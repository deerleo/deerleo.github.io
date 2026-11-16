'use strict';
// ひとつぶ庭園 — 粒シミュレーション本体（描画・入力から独立）
const W = 168, H = 112, CH = 4, MC = 42, MR = 28;
const EMPTY = 0, WALL = 1, ROCK = 2, SAND = 3, WATER = 4, SEED = 5, PLANT = 6, FLAME = 7,
  STEAM = 8, EMBER = 9, ASH = 10, BRAMBLE = 11, BURN = 12, ICE = 13, BUD = 14, LANTERN = 15;
const N4 = [-W, 1, W, -1];
const N8 = [-W, -W + 1, 1, W + 1, W, W - 1, -1, -W - 1];
const TOOLS = {
  sand: { type: SAND, bw: 2, dens: 0.75, every: 1 },
  water: { type: WATER, bw: 2, dens: 0.6, every: 1 },
  seed: { type: SEED, bw: 1, dens: 0.5, every: 5 },
  ember: { type: EMBER, bw: 1, dens: 0.5, every: 4 },
};
const ATTRACT_R2 = 20 * 20;

function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const NOISE = new Uint8Array(W * H);
(function () { const r = mulberry32(777); for (let i = 0; i < W * H; i++) NOISE[i] = (r() * 256) | 0; })();

class Sim {
  constructor() {
    const n = W * H;
    this.g = new Uint8Array(n);   // 種類
    this.a = new Uint8Array(n);   // 寿命・水滴トークンなど
    this.d = new Int16Array(n);   // つるの深さ／向き／エンティティ番号
    this.st = new Uint8Array(n);  // そのtickで動いた印
    this.rock = new Uint32Array(n);
    this.buds = []; this.lanterns = []; this.events = [];
    this.cnt = { grow: 0, hiss: 0, burn: 0, drip: 0, melt: 0, sink: 0, growDepth: 0 };
    this.found = {};
    this.tick = 0; this.won = false; this.budget = {}; this.rnd = Math.random;
  }

  load(stage) {
    const g = this.g;
    this.stage = stage;
    this.rnd = mulberry32(stage.seed || 4242);
    g.fill(0); this.a.fill(0); this.d.fill(0); this.st.fill(0);
    this.buds = []; this.lanterns = []; this.events = []; this.found = {};
    this.tick = 0; this.won = false; this.sinks = 0;
    this.budget = Object.assign({}, stage.tools);
    this.budget0 = Object.assign({}, stage.tools);
    const ents = [];
    for (let r = 0; r < MR; r++) {
      const row = stage.map[r] || '';
      for (let c = 0; c < MC; c++) {
        const ch = row[c] || '.';
        let t = EMPTY;
        if (ch === '#') t = ROCK; else if (ch === 'x') t = BRAMBLE; else if (ch === 'I') t = ICE;
        else if (ch === '~') t = WATER; else if (ch === 's') t = SAND;
        else if (ch === 'B') ents.push(['bud', c * CH + 2, r * CH + 2]);
        else if (ch === 'L') ents.push(['lantern', c * CH + 1, r * CH + 2]);
        if (t) for (let y = 0; y < CH; y++) for (let x = 0; x < CH; x++) g[(r * CH + y) * W + c * CH + x] = t;
      }
    }
    this.smooth();
    const self = this;
    const api = {
      rect(x0, y0, x1, y1, t) { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (x >= 0 && x < W && y >= 0 && y < H) g[y * W + x] = t; },
      poly(pts, t) {
        let x0 = W, x1 = 0, y0 = H, y1 = 0;
        for (const [x, y] of pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
        for (let y = Math.max(0, y0 | 0); y <= Math.min(H - 1, y1); y++) for (let x = Math.max(0, x0 | 0); x <= Math.min(W - 1, x1); x++) {
          let inside = false; const px = x + 0.5, py = y + 0.5;
          for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
            const xi = pts[i][0], yi = pts[i][1], xj = pts[j][0], yj = pts[j][1];
            if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) inside = !inside;
          }
          if (inside) g[y * W + x] = t;
        }
      },
      bud(x, y) { ents.push(['bud', x, y]); },
      lantern(x, y) { ents.push(['lantern', x, y]); },
    };
    if (stage.shape) stage.shape(api);
    // びんの壁
    for (let y = 0; y < H; y++) { g[y * W] = WALL; g[y * W + W - 1] = WALL; }
    for (let x = 0; x < W; x++) g[(H - 1) * W + x] = WALL;
    const R = 9;
    for (let y = H - 1 - R; y < H; y++) for (let x = 0; x < R; x++) {
      const dx = R - x, dy = y - (H - 1 - R);
      if (dx * dx + dy * dy > R * R) { g[y * W + x] = WALL; g[y * W + W - 1 - x] = WALL; }
    }
    for (const [k, x, y] of ents) k === 'bud' ? this.addBud(x, y) : this.addLantern(x, y);
    this.computeRock();
    return this;
  }

  smooth() {
    const g = this.g, rnd = this.rnd, n = W * H;
    const solid = (x, y) => { if (x < 0 || x >= W || y >= H) return 1; if (y < 0) return 0; const t = g[y * W + x]; return (t === ROCK || t === BRAMBLE || t === ICE) ? 1 : 0; };
    // 境界にノイズを入れてから多数決でならす
    const tmp = new Uint8Array(n);
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
      const p = y * W + x, t = g[p];
      if (t !== ROCK && t !== EMPTY) continue;
      const c = solid(x - 1, y) + solid(x + 1, y) + solid(x, y - 1) + solid(x, y + 1);
      if (c > 0 && c < 4 && rnd() < 0.22) tmp[p] = 1;
    }
    for (let p = 0; p < n; p++) if (tmp[p]) g[p] = g[p] === ROCK ? EMPTY : ROCK;
    for (let pass = 0; pass < 2; pass++) {
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const p = y * W + x, t = g[p];
        if (t !== ROCK && t !== EMPTY) { tmp[p] = t; continue; }
        let c = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) c += solid(x + dx, y + dy);
        tmp[p] = c >= 5 ? ROCK : EMPTY;
      }
      g.set(tmp);
    }
  }

  computeRock() {
    const g = this.g, rock = this.rock;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const p = y * W + x;
      if (g[p] !== ROCK) continue;
      let dep = 0, q = p;
      while (dep < 9 && q >= W && g[q - W] === ROCK) { q -= W; dep++; }
      const open = q >= W ? (g[q - W] === EMPTY || g[q - W] === WATER) : true;
      const nz = NOISE[p] / 255, band = Math.sin(y * 0.55 + NOISE[(y * 7) % (W * H)] * 0.02 + x * 0.05) * 0.5 + 0.5;
      let r, gg, b;
      if (open && dep < 2) { r = 78 + nz * 30; gg = 140 + nz * 40; b = 96 + nz * 20; if (dep === 1) { r -= 18; gg -= 26; b -= 12; } }
      else {
        const k = 1 - Math.min(dep, 9) * 0.035;
        r = (66 + band * 16 + nz * 10) * k; gg = (62 + band * 12 + nz * 10) * k; b = (98 + band * 18 + nz * 12) * k;
        let edge = 0;
        if (x > 0 && g[p - 1] !== ROCK && g[p - 1] !== WALL) edge = 1;
        if (x < W - 1 && g[p + 1] !== ROCK && g[p + 1] !== WALL) edge = 1;
        if (y < H - 1 && g[p + W] !== ROCK && g[p + W] !== WALL) edge = -1;
        if (edge > 0) { r += 16; gg += 16; b += 22; } else if (edge < 0) { r -= 14; gg -= 14; b -= 14; }
      }
      rock[p] = (255 << 24 | (b & 255) << 16 | (gg & 255) << 8 | (r & 255)) >>> 0;
    }
  }

  addBud(x, y) {
    const g = this.g, idx = this.buds.length, cells = [], per = [];
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (dx * dx + dy * dy <= 4) { const p = (y + dy) * W + x + dx; g[p] = BUD; this.d[p] = idx; cells.push(p); }
    for (const p of cells) for (const n of N8) { const q = p + n; if (g[q] !== BUD && per.indexOf(q) < 0) per.push(q); }
    const solidAt = (q) => { const t = g[q]; return t === ROCK || t === WALL; };
    let dir = 'up';
    if (solidAt((y + 3) * W + x)) dir = 'up'; else if (solidAt((y - 3) * W + x)) dir = 'down';
    else if (solidAt(y * W + x - 3)) dir = 'right'; else if (solidAt(y * W + x + 3)) dir = 'left';
    this.buds.push({ x, y, water: 0, need: 10, done: false, per, dir, t: 0 });
  }
  addLantern(x, y) {
    const g = this.g, idx = this.lanterns.length, cells = [], per = [];
    for (let dy = -2; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const p = (y + dy) * W + x + dx; g[p] = LANTERN; this.d[p] = idx; cells.push(p); }
    for (const p of cells) for (const n of N8) { const q = p + n; if (g[q] !== LANTERN && per.indexOf(q) < 0) per.push(q); }
    const hang = g[(y - 3) * W + x] === ROCK && g[(y + 2) * W + x] !== ROCK;
    this.lanterns.push({ x, y, lit: false, per, hang, vine: false, t: 0 });
  }

  disc(id) { if (!this.found[id]) { this.found[id] = 1; this.events.push(['disc', id]); } }

  pour(tool, cx) {
    const T = TOOLS[tool]; let b = this.budget[tool];
    if (!T || !(b > 0)) return 0;
    if (T.every > 1 && this.tick % T.every) return 0;
    const g = this.g; let n = 0;
    for (let dx = -T.bw; dx <= T.bw; dx++) {
      const x = cx + dx; if (x < 1 || x >= W - 1) continue;
      if (this.rnd() > T.dens) continue;
      const p = W + x; if (g[p] !== EMPTY) continue;
      g[p] = T.type; this.d[p] = 0;
      this.a[p] = T.type === EMBER ? 200 + (this.rnd() * 55 | 0) : (this.rnd() < 0.5 ? 1 : 0);
      if (T.type === SEED) this.a[p] = 0;
      n++; if (--b <= 0) { b = 0; break; }
    }
    this.budget[tool] = b; return n;
  }

  mv(p, q, s) { const g = this.g, a = this.a, d = this.d; g[q] = g[p]; a[q] = a[p]; d[q] = d[p]; g[p] = EMPTY; a[p] = 0; d[p] = 0; this.st[q] = s; }
  sw(p, q, s) {
    const g = this.g, a = this.a, d = this.d; let t;
    t = g[p]; g[p] = g[q]; g[q] = t; t = a[p]; a[p] = a[q]; a[q] = t; t = d[p]; d[p] = d[q]; d[q] = t;
    this.st[q] = s; this.st[p] = s;
  }
  powder(p, sink, s) {
    const g = this.g, b = p + W, tb = g[b];
    if (tb === EMPTY) { this.mv(p, b, s); return b; }
    if (tb === WATER) { if (this.rnd() < sink) { this.sw(p, b, s); this.sinks++; return b; } return p; }
    if (tb === STEAM || tb === FLAME) { this.sw(p, b, s); return b; }
    const k = this.rnd() < 0.5 ? -1 : 1;
    for (let j = 0; j < 2; j++) {
      const kk = j ? -k : k, side = g[p + kk], q = b + kk, tq = g[q];
      if (side !== EMPTY && side !== WATER && side !== STEAM && side !== FLAME) continue;
      if (tq === EMPTY) { this.mv(p, q, s); return q; }
      if (tq === WATER && this.rnd() < sink) { this.sw(p, q, s); return q; }
    }
    return p;
  }
  water(p, s) {
    const g = this.g, a = this.a, rnd = this.rnd;
    const b = p + W, tb = g[b];
    if (tb === EMPTY) { this.mv(p, b, s); return; }
    if (tb === STEAM || tb === FLAME) { this.sw(p, b, s); return; }
    const k = rnd() < 0.5 ? -1 : 1;
    if (g[b + k] === EMPTY && g[p + k] === EMPTY) { this.mv(p, b + k, s); return; }
    if (g[b - k] === EMPTY && g[p - k] === EMPTY) { this.mv(p, b - k, s); return; }
    const dir = (a[p] & 1) ? 1 : -1; let q = p, n = 0;
    while (n < 6 && g[q + dir] === EMPTY) { q += dir; n++; if (g[q + W] === EMPTY) break; }
    if (n > 0) this.mv(p, q, s); else a[p] ^= 1;
  }
  ignite(q, s) {
    const t = this.g[q];
    if (t === PLANT || t === BRAMBLE) this.disc('burn');
    this.g[q] = BURN; this.a[q] = 26 + (this.rnd() * 30 | 0); this.d[q] = 0; this.st[q] = s;
  }
  melt(q, s) { this.g[q] = WATER; this.a[q] = 0; this.d[q] = 0; this.st[q] = s; this.cnt.melt++; this.disc('melt'); }
  feed(b, src) {
    b.water++; b.src = src;
    this.events.push(['feed', b]);
    if (src === 1) this.disc('wick'); else if (src === 2) this.disc('steambloom');
    if (b.water >= b.need) { b.done = true; b.t = this.tick; if (src === 0) this.disc('pool'); this.events.push(['bloom', b]); }
  }

  grow(p, x, y, av, dp, s) {
    if (dp >= 140 || y < 8) return false;
    const g = this.g, rnd = this.rnd;
    let tx = -1, ty = 0, best = ATTRACT_R2, tl = null;
    for (const b of this.buds) if (!b.done) { const dd = (b.x - x) * (b.x - x) + (b.y - y) * (b.y - y); if (dd < best) { best = dd; tx = b.x; ty = b.y; tl = null; } }
    for (const l of this.lanterns) if (!l.lit && !l.vine) { const dd = (l.x - x) * (l.x - x) + (l.y - y) * (l.y - y); if (dd < best) { best = dd; tx = l.x; ty = l.y; tl = l; } }
    let q = -1;
    if (tx >= 0) {
      let bd = best;
      for (let i = 0; i < 8; i++) {
        const c = p + N8[i], t = g[c];
        if (t !== EMPTY && t !== WATER && t !== STEAM) continue;
        const cx = c % W, cy = (c / W) | 0, dd = (tx - cx) * (tx - cx) + (ty - cy) * (ty - cy);
        if (dd < bd) { bd = dd; q = c; }
      }
    }
    if (q < 0) {
      const up = p - W, k = rnd() < 0.5 ? -1 : 1;
      const order = rnd() < 0.1 ? [up + k, up, up - k, p + k, p - k] : [up, up + k, up - k, p + k, p - k];
      for (const c of order) { const t = g[c]; if (t === EMPTY || t === WATER || t === STEAM) { q = c; break; } }
    }
    if (q < 0) return false;
    const rich = av & 2, wasWater = g[q] === WATER;
    g[q] = PLANT; this.d[q] = dp + 1; this.a[q] = rich | ((wasWater || (rich && rnd() < 0.6)) ? 1 : 0); this.st[q] = s;
    this.cnt.grow++; if (dp > this.cnt.growDepth) this.cnt.growDepth = dp;
    if (tl) { for (const n of N8) if (g[q + n] === LANTERN) { tl.vine = true; break; } }
    if (dp > 8 && rnd() < 0.04) { const c = p + (rnd() < 0.5 ? -1 : 1); if (g[c] === EMPTY) { g[c] = PLANT; this.d[c] = dp + 1; this.a[c] = rich; this.st[c] = s; } }
    return true;
  }

  step() {
    const g = this.g, a = this.a, d = this.d, st = this.st, rnd = this.rnd, cnt = this.cnt;
    const s = (++this.tick) & 255, ltr = this.tick & 1;
    let burning = 0;
    for (let y = H - 2; y >= 0; y--) {
      const row = y * W;
      for (let i = 1; i < W - 1; i++) {
        const x = ltr ? i : W - 1 - i; let p = row + x; const t = g[p];
        if (t < 3 || st[p] === s) continue;
        switch (t) {
          case SAND: this.powder(p, 0.6, s); break;
          case WATER: this.water(p, s); break;
          case STEAM: {
            if (y === 0) { g[p] = EMPTY; a[p] = 0; d[p] = 0; break; }
            const u = p - W, tu = g[u];
            if (tu === EMPTY) { if (rnd() < 0.85) this.mv(p, u, s); break; }
            if (tu === WATER) { this.sw(p, u, s); break; }
            const k = d[p] > 0 ? 1 : -1; let moved = false;
            for (let j = 0; j < 2 && !moved; j++) {
              const kk = j ? -k : k, side = g[p + kk], q = u + kk, tq = g[q];
              if (side !== EMPTY && side !== WATER) continue;
              if (tq === EMPTY) { this.mv(p, q, s); d[q] = kk; moved = true; }
              else if (tq === WATER) { this.sw(p, q, s); d[q] = kk; moved = true; }
            }
            if (moved) break;
            let q = p, n = 0;
            while (n < 3 && g[q + k] === EMPTY) { q += k; n++; if (g[q - W] === EMPTY) break; }
            if (n > 0) { if (a[p] < 255 && rnd() < 0.125) a[p]++; this.mv(p, q, s); d[q] = k; }
            else if (g[p + k] === WATER) { this.sw(p, p + k, s); d[p + k] = k; }
            else { d[p] = -k; if (a[p] < 255) a[p]++; }
            if (a[q] > 90 && rnd() < 0.03 && g[q] === STEAM) { g[q] = WATER; a[q] = 0; d[q] = 0; cnt.drip++; this.disc('rain'); }
            break;
          }
          case FLAME: {
            const life = a[p];
            if (life <= 1 || y === 0) { g[p] = EMPTY; a[p] = 0; break; }
            a[p] = life - 1; let dead = false;
            for (let j = 0; j < 4; j++) {
              const q = p + N4[j], tq = g[q];
              if (tq === PLANT || tq === BRAMBLE || tq === SEED) { if (rnd() < 0.2) this.ignite(q, s); }
              else if (tq === ICE) { if (rnd() < 0.1) this.melt(q, s); }
              else if (tq === WATER) { if (rnd() < 0.5) dead = true; }
            }
            if (dead) { g[p] = EMPTY; a[p] = 0; break; }
            if (rnd() < 0.7) { const q = p - W + (rnd() < 0.6 ? 0 : (rnd() < 0.5 ? -1 : 1)); if (g[q] === EMPTY) this.mv(p, q, s); }
            break;
          }
          case BURN: {
            burning++;
            const life = a[p];
            for (let j = 0; j < 8; j++) {
              const q = p + N8[j], tq = g[q];
              if (tq === PLANT || tq === BRAMBLE || tq === SEED) { if (rnd() < 0.16) this.ignite(q, s); }
              else if (tq === ICE) { if (rnd() < 0.1) this.melt(q, s); }
            }
            if (y > 0 && g[p - W] === EMPTY && rnd() < 0.35) { g[p - W] = FLAME; a[p - W] = 6 + (rnd() * 10 | 0); st[p - W] = s; }
            if (life <= 1) { if (rnd() < 0.3) { g[p] = ASH; this.disc('ash'); } else g[p] = EMPTY; a[p] = 0; d[p] = 0; }
            else a[p] = life - 1;
            break;
          }
          case EMBER: {
            p = this.powder(p, 0.5, s);
            let life = a[p];
            // 氷にふれている間は、とかすのに手いっぱいで水を沸かさない
            const onIce = g[p + W] === ICE || g[p + 1] === ICE || g[p - 1] === ICE;
            for (let j = 0; j < 4; j++) {
              const q = p + N4[j], tq = g[q];
              if (tq === WATER) { if (!onIce && rnd() < 0.07) { g[q] = STEAM; a[q] = 0; d[q] = rnd() < 0.5 ? 1 : -1; st[q] = s; life -= 60; cnt.hiss++; this.disc('steam'); } }
              else if (tq === PLANT || tq === BRAMBLE || tq === SEED) { if (rnd() < 0.3) this.ignite(q, s); }
              else if (tq === ICE) { if (rnd() < 0.12) this.melt(q, s); }
            }
            if (p >= W && g[p - W] === EMPTY && rnd() < 0.15) { g[p - W] = FLAME; a[p - W] = 6 + (rnd() * 9 | 0); st[p - W] = s; }
            life--; burning++;
            if (life <= 0) { g[p] = EMPTY; a[p] = 0; d[p] = 0; } else a[p] = life;
            break;
          }
          case ASH: {
            p = this.powder(p, 0.25, s);
            if (rnd() < 0.012 && (g[p + 1] === WATER || g[p - 1] === WATER || g[p - W] === WATER)) { g[p] = EMPTY; a[p] = 0; }
            break;
          }
          case ICE: {
            if (g[p + W] === EMPTY) { this.mv(p, p + W, s); break; }
            // とけ水にふれた氷は、ゆっくりつられてとけていく
            if (rnd() < 0.05 && (g[p - 1] === WATER || g[p + 1] === WATER || (y > 0 && g[p - W] === WATER))) this.melt(p, s);
            break;
          }
          case SEED: {
            const q0 = this.powder(p, 0.35, s);
            if (q0 !== p) break;
            const tb = g[p + W];
            if (tb !== ROCK && tb !== SAND && tb !== ASH && tb !== WALL && tb !== ICE && tb !== PLANT && tb !== BRAMBLE) break;
            let wq = -1;
            for (let j = 0; j < 4; j++) if (g[p + N4[j]] === WATER) { wq = p + N4[j]; break; }
            if (wq < 0 || rnd() > 0.08) break;
            let near = false;
            for (let dy = -3; dy <= 3 && !near; dy++) for (let dx = -3; dx <= 3; dx++) {
              const xx = x + dx, yy = y + dy; if (xx < 0 || xx >= W || yy < 0 || yy >= H) continue;
              if (g[yy * W + xx] === PLANT) { near = true; break; }
            }
            if (near) { g[p] = EMPTY; a[p] = 0; break; }
            let rich = 0;
            for (let j = 0; j < 8; j++) if (g[p + N8[j]] === ASH) rich = 2;
            g[wq] = EMPTY; a[wq] = 0;
            g[p] = PLANT; d[p] = 1; a[p] = 1 | rich; st[p] = s;
            this.disc('sprout'); if (rich) this.disc('rich');
            this.events.push(['sprout', x, y]);
            break;
          }
          case PLANT: {
            let av = a[p]; const dp = d[p];
            if (!(av & 1)) {
              if (rnd() < 0.14) for (let j = 0; j < 4; j++) { const q = p + N4[j], tq = g[q]; if (tq === WATER || tq === STEAM) { g[q] = EMPTY; a[q] = 0; d[q] = 0; a[p] = av | 1; break; } }
              break;
            }
            let fed = false;
            for (let j = 0; j < 8; j++) { const q = p + N8[j]; if (g[q] === BUD) { const b = this.buds[d[q]]; if (!b.done) { this.feed(b, 1); a[p] = av & ~1; fed = true; break; } } }
            if (fed) break;
            let has = false, moved = false; const o = (rnd() * 8) | 0;
            for (let j = 0; j < 8; j++) {
              const q = p + N8[(j + o) & 7];
              if (g[q] === PLANT && d[q] === dp + 1) { has = true; if (!(a[q] & 1)) { a[q] |= 1; st[q] = s; a[p] = av & ~1; moved = true; break; } }
            }
            if (moved) break;
            if (has) { // 先がつまって水が余ったら、途中から枝を出す
              if (rnd() < 0.03 && this.grow(p, x, y, av, dp, s)) a[p] = av & ~1;
              break;
            }
            if (this.grow(p, x, y, av, dp, s)) a[p] = av & ~5;
            else if (!(av & 4)) { a[p] = av | 4; this.disc('blossom'); }
            break;
          }
        }
      }
    }
    // 水だけもう一度動かして、山にならず素早くならされるようにする
    const s2 = s ^ 128;
    for (let y = H - 2; y >= 0; y--) {
      const row = y * W;
      for (let i = 1; i < W - 1; i++) { const p = row + (ltr ? W - 1 - i : i); if (g[p] === WATER && st[p] !== s2) this.water(p, s2); }
    }
    cnt.burn = burning;
    if (this.sinks > 150) { this.disc('sink'); }
    // つぼみ・ランタン
    let all = this.buds.length + this.lanterns.length > 0;
    for (const b of this.buds) {
      if (!b.done) for (const q of b.per) { const tq = g[q]; if ((tq === WATER || tq === STEAM) && rnd() < 0.25) { g[q] = EMPTY; a[q] = 0; d[q] = 0; this.feed(b, tq === STEAM ? 2 : 0); if (b.done) break; } }
      if (!b.done) all = false;
    }
    for (const l of this.lanterns) {
      if (!l.lit) for (const q of l.per) {
        const tq = g[q];
        if (tq === FLAME || tq === BURN || tq === EMBER) {
          l.lit = true; l.t = this.tick; this.disc('lit');
          let fuse = tq === BURN;
          for (const q2 of l.per) if (g[q2] === BURN) fuse = true;
          if (fuse) this.disc('fuse');
          this.events.push(['lit', l]); break;
        }
      }
      if (!l.lit) all = false;
    }
    if (all && !this.won) { this.won = true; this.events.push(['win']); }
  }
}
