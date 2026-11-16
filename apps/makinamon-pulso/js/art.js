'use strict';
// ───────── arte por código: criaturas horneadas, personajes, terreno con volumen, edificios ─────────
const PAL = {
  g0: '#9cdc6c', g1: '#74c458', g2: '#48a048', g3: '#2a6c3c', gh: '#c4f094', gl: '#aae678', gd: '#8cd062', p0: '#f6e4b0', p1: '#e0c488', p2: '#b89460', pl: '#fcf0c8',
  w0: '#5aa8f0', w1: '#9cd4f8', w2: '#3c80d8', wh: '#e8f8ff', t0: '#8cd860', t1: '#50b04c', t2: '#2c8040', t3: '#1c5434', th: '#b8ee7c', tk: '#143c2c', tr: '#946238', trd: '#5e3c26',
};
const R = (c, x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
const P = (c, x, y, col) => { c.fillStyle = col; c.fillRect(x, y, 1, 1); };
const hex2 = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const mix = (a, b, k) => { const A = hex2(a), Bc = hex2(b); return '#' + A.map((v, i) => Math.round(v + (Bc[i] - v) * k).toString(16).padStart(2, '0')).join(''); };
const dark = (c, k = .3) => mix(c, '#182040', k), lite = (c, k = .3) => mix(c, '#fffbe0', k);
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + .5) / 16);
const bay = (x, y) => BAYER[(y & 3) * 4 + (x & 3)];
const hsh = (x, y, s = 0) => { const v = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453; return v - Math.floor(v); };
function vnoise(x, y, s = 0) { const ix = Math.floor(x), iy = Math.floor(y); let fx = x - ix, fy = y - iy; fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy); const a = hsh(ix, iy, s), b = hsh(ix + 1, iy, s), c = hsh(ix, iy + 1, s), d = hsh(ix + 1, iy + 1, s); return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy; }
// degradado vertical tramado entre varias paradas
function gradV(c, x, y, w, h, stops) { for (let j = 0; j < h; j++) { const t = j / Math.max(1, h - 1) * (stops.length - 1), i = Math.min(stops.length - 2, Math.floor(t)), fr = t - i; for (let k = 0; k < w; k++) P(c, x + k, y + j, fr > bay(x + k, y + j) ? stops[i + 1] : stops[i]); } }
function ell(c, cx, cy, rx, ry, col) { c.fillStyle = col; for (let dy = -ry; dy <= ry; dy++) { const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - dy * dy / (ry * ry + .01)))); c.fillRect(cx - w, cy + dy, w * 2, 1); } }

// ── criaturas ──
const MON = {}; let MONIMG = null;
function tintOf(src, col) { const [c, x] = mk(src.width, src.height); x.drawImage(src, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = col; x.fillRect(0, 0, c.width, c.height); return c; }
function cutMons() {
  for (const id in SPECIES) {
    const r = SPECIES[id].row, o = {};
    const cut = (sx, sy, w, h) => { const [c, x] = mk(w, h); x.drawImage(MONIMG, sx, sy, w, h, 0, 0, w, h); return c; };
    o.f0 = cut(0, r * 56, 56, 56); o.f1 = cut(56, r * 56, 56, 56); o.back = cut(112, r * 56, 56, 56); o.icon = cut(168, r * 56, 24, 24); o.ow = cut(200, r * 56 + 32, 16, 16); o.owb = cut(168, r * 56 + 32, 16, 16); o.ows = cut(184, r * 56 + 32, 16, 16);
    { const [c, x] = mk(16, 16); x.translate(16, 0); x.scale(-1, 1); x.drawImage(o.ows, 0, 0); o.owr = c; }
    // vistas de 24×24 para seguirte por el mapa
    o.fw = cut(224, r * 56, 24, 24); o.fb = cut(248, r * 56, 24, 24); o.fs = cut(224, r * 56 + 24, 24, 24);
    { const [c, x] = mk(24, 24); x.translate(24, 0); x.scale(-1, 1); x.drawImage(o.fs, 0, 0); o.fr = c; }
    for (const k of ['f0', 'f1', 'back']) { o[k + 'W'] = tintOf(o[k], '#ffffff'); o[k + 'K'] = tintOf(o[k], INK); }
    MON[id] = o;
  }
}
function drawMon(sp, view, cx, by, o = {}) {
  const m = MON[sp]; let img = m[view]; if (o.white) img = m[view + 'W']; else if (o.dark) img = m[view + 'K'];
  const sx = o.sx ?? 1, sy = o.sy ?? 1, w = 56 * sx, h = 56 * sy, clip = o.clip ?? 0;
  if (o.alpha != null) g.globalAlpha = o.alpha;
  const sh = 56 * (1 - clip);
  if (sh > 0) g.drawImage(img, 0, 0, 56, sh, Math.round(cx - w / 2), Math.round(by - h * (1 - clip) + (o.dy || 0)), Math.round(w), Math.round(h * (1 - clip)));
  if (o.tint) { g.globalAlpha = o.tintA ?? .5; g.drawImage(tintC(m, view, o.tint), 0, 0, 56, sh, Math.round(cx - w / 2), Math.round(by - h * (1 - clip)), Math.round(w), Math.round(h * (1 - clip))); }
  g.globalAlpha = 1;
}
function tintC(m, view, col) { const k = view + col; return m[k] || (m[k] = tintOf(m[view], col)); }

// ── personajes 16x16, con sombreado y contorno de color automáticos ──
const STYLES = {
  nia: { cap: 1, h: '#30b8a8', H: '#1c8078', s: '#f8c8a0', c: '#f8c838', C: '#d8a020', d: '#3a4868', e: '#f0f0f0', b: '#e86048', w: '#ffffff' },
  cobre: { spiky: 1, h: '#d87038', H: '#a04820', s: '#f8c8a0', c: '#5a4a8a', C: '#463874', d: '#2a2a3a', e: '#e84848', b: '#404050', w: '#f8e070' },
  estano: { long: 1, bun: 1, coat: 1, h: '#b8b8d0', H: '#8888a8', s: '#f0c0a0', c: '#f4f4f8', C: '#d4d4e4', d: '#506080', e: '#404858', b: '#f4f4f8', w: '#58b8b0' },
  ayudante: { coat: 1, h: '#6a4a30', H: '#4a3020', s: '#e8b088', c: '#58b8b0', C: '#3c9890', d: '#404858', e: '#303038', b: '#58b8b0', w: '#ffffff' },
  abuelo: { bald: 1, h: '#d8d8d8', H: '#a8a8a8', s: '#f0c0a0', c: '#6a9a58', C: '#527c44', d: '#6a5a48', e: '#403830', b: '#6a9a58', w: '#f8f0d8' },
  nina: { long: 1, h: '#f078a0', H: '#c04878', s: '#f8c8a0', c: '#f8f0f0', C: '#dcd0d8', d: '#c04878', e: '#f8f0f0', b: '#f8f0f0', w: '#f078a0' },
  leo: { cap: 1, h: '#f8d030', H: '#c09818', s: '#e8b088', c: '#58a848', C: '#408838', d: '#4868a8', e: '#f0f0f0', b: '#d05838', w: '#ffffff' },
  vecina: { long: 1, h: '#3a3048', H: '#282038', s: '#d8a078', c: '#e86048', C: '#c04834', d: '#3a4868', e: '#f0f0f0', b: '#e86048', w: '#f8e070' },
  obrero: { cap: 1, h: '#f8d030', H: '#c09818', s: '#d8a078', c: '#f08838', C: '#c86820', d: '#3a4868', e: '#303038', b: '#f08838', w: '#f8f8f8' },
};
const CHARS = {};
function makeChar(st) {
  const [cv2, c] = mk(16 * 12, 16);
  for (let dir = 0; dir < 4; dir++) for (let f = 0; f < 3; f++) {
    const m = Array.from({ length: 16 }, () => Array(16).fill('.'));
    const r = (x0, y0, x1, y1, ch) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (y >= 0 && y < 16 && x >= 0 && x < 16) m[y][x] = ch; };
    const coat = st.coat ? 1 : 0;
    if (dir < 2) {
      r(4, 1, 11, 1, 'h'); r(3, 2, 12, 4, 'h');
      if (st.bald) { r(5, 1, 10, 3, 's'); r(4, 2, 11, 3, 's'); }
      if (st.spiky) { r(4, 0, 4, 0, 'h'); r(7, 0, 8, 0, 'h'); r(11, 0, 11, 0, 'h'); }
      if (st.bun) r(7, 0, 8, 0, 'h');
      if (dir === 0) {
        r(3, 5, 12, 7, 's'); r(4, 8, 11, 8, 's');
        if (st.cap) { r(3, 5, 12, 5, 'H'); r(6, 2, 9, 3, 'w'); } else { r(3, 5, 4, 5, 'h'); r(11, 5, 12, 5, 'h'); if (!st.bald) r(5, 4, 10, 4, 'h'); }
        if (st.bald) r(3, 5, 12, 5, 's'), r(3, 4, 3, 6, 'h'), r(12, 4, 12, 6, 'h');
        r(5, 6, 5, 7, 'k'); r(10, 6, 10, 7, 'k'); r(4, 7, 4, 7, 'r'); r(11, 7, 11, 7, 'r');
        if (st.long) { r(3, 5, 3, 9, 'h'); r(12, 5, 12, 9, 'h'); }
        if (st.bald) r(6, 8, 9, 8, 'h');
      } else {
        r(3, 5, 12, 7, 'h'); r(5, 8, 10, 8, 's'); if (st.cap) r(3, 5, 12, 5, 'H');
        if (st.bald) { r(4, 4, 11, 6, 's'); r(3, 5, 3, 7, 'h'); r(12, 5, 12, 7, 'h'); }
        if (st.long) r(3, 5, 12, 10, 'h');
      }
      r(4, 9, 11, 12 + coat, 'c'); r(3, 9, 3, 11, 'C'); r(12, 9, 12, 11, 'C');
      const la = f === 1 ? 11 : 12, ra = f === 2 ? 11 : 12; r(3, la, 3, la, 's'); r(12, ra, 12, ra, 's');
      if (dir === 0) { r(7, 9, 8, 9, 'w'); if (!coat) r(4, 12, 11, 12, 'd'); else r(7, 10, 8, 13, 'C'); }
      else if (!st.long) r(5, 9, 10, 12, 'b');
      const l0 = 13 + coat;
      if (f !== 1) { r(5, l0, 6, 14, 'd'); r(5, 14, 6, 14, 'e'); } else r(5, l0, 6, 13, 'e');
      if (f !== 2) { r(9, l0, 10, 14, 'd'); r(9, 14, 10, 14, 'e'); } else r(9, l0, 10, 13, 'e');
    } else {
      r(4, 1, 11, 1, 'h'); r(3, 2, 12, 4, 'h');
      if (st.spiky) { r(5, 0, 5, 0, 'h'); r(9, 0, 9, 0, 'h'); r(12, 1, 12, 1, 'h'); }
      if (st.bun) r(10, 0, 11, 0, 'h');
      r(3, 5, 8, 7, 's'); r(4, 8, 8, 8, 's'); r(9, 5, 12, 7, 'h');
      if (st.bald) { r(3, 2, 9, 4, 's'); r(5, 1, 9, 1, 's'); r(4, 8, 6, 8, 'h'); }
      if (st.cap) { r(1, 5, 7, 5, 'H'); r(4, 2, 6, 3, 'w'); }
      if (st.long) r(9, 5, 12, 10, 'h');
      r(4, 6, 4, 7, 'k'); r(6, 7, 6, 7, 'r');
      r(5, 9, 10, 12 + coat, 'c'); if (!st.long) r(10, 9, 11, 11, 'b');
      const ax = f === 1 ? 6 : 7; r(ax, 9, ax + 1, 11, 'C'); r(ax, 12, ax + 1, 12, 's');
      if (!coat) r(5, 12, 10, 12, 'd');
      if (f !== 1) { r(6, 13 + coat, 9, 14, 'd'); r(5, 14, 9, 14, 'e'); }
      else { r(4, 13, 6, 13, 'd'); r(3, 14, 5, 14, 'e'); r(9, 13, 11, 13, 'd'); r(9, 14, 11, 14, 'e'); }
    }
    const at = (x, y) => (m[y] || [])[x] || '.', base = ch => ch === 'k' ? '#1c1c2c' : ch === 'r' ? mix(st.s, '#f07070', .45) : st[ch];
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const ch = m[y][x]; let col;
      if (ch === '.') {
        // contorno: versión oscura del color vecino
        let nb = null; for (const [dx, dy] of [[0, -1], [-1, 0], [1, 0], [0, 1]]) { const v = at(x + dx, y + dy); if (v !== '.') { nb = v; break; } }
        if (!nb) continue; col = dark(base(nb === 'k' || nb === 'r' ? 's' : nb), .66);
      } else {
        col = base(ch);
        if ('hHcCsdbew'.includes(ch)) {
          const edgeR = at(x + 1, y) === '.', edgeB = at(x, y + 1) === '.', up = at(x, y - 1), left = at(x - 1, y);
          if (edgeR || (edgeB && ch !== 'e')) col = dark(col, ch === 's' ? .14 : .24);
          else if ((up === '.' || left === '.') && 'hcb'.includes(ch)) col = lite(col, .38);
          if (ch === 's' && 'hH'.includes(up)) col = dark(base('s'), .16); // sombra del pelo o la visera
          if (ch === 'c' && y === 9 && dir === 0) col = lite(col, .2);
        }
      }
      P(c, (dir * 3 + f) * 16 + (dir === 3 ? 15 - x : x), y, col);
    }
  }
  return cv2;
}
const WALK = [0, 1, 0, 2];
function drawChar(style, dir, step, x, y, breath) {
  const sx = (dir * 3 + WALK[step & 3]) * 16; x = Math.round(x); y = Math.round(y);
  if (breath) { g.drawImage(CHARS[style], sx, 9, 16, 7, x, y + 9, 16, 7); g.drawImage(CHARS[style], sx, 0, 16, 9, x, y + 1, 16, 9); }
  else g.drawImage(CHARS[style], sx, 0, 16, 16, x, y, 16, 16);
}
const DX = [0, 0, -1, 1], DY = [1, -1, 0, 0];

// ── celda ──
function drawCelda(c, x, y, leds = 0, col = '#58e890') {
  x = Math.round(x); y = Math.round(y);
  R(c, x + 2, y, 5, 1, '#1c1c2c'); R(c, x + 1, y + 1, 7, 2, '#d8dce8'); R(c, x + 1, y + 1, 2, 1, '#ffffff'); R(c, x + 3, y - 1, 3, 1, '#8890a0');
  R(c, x, y + 3, 9, 8, '#1c1c2c'); R(c, x + 1, y + 3, 7, 8, '#384868'); R(c, x + 1, y + 3, 2, 8, '#6480b0'); R(c, x + 7, y + 3, 1, 8, '#283450');
  R(c, x + 1, y + 11, 7, 1, '#b8bcc8'); R(c, x + 2, y + 12, 5, 1, '#1c1c2c');
  for (let i = 0; i < 3; i++) { R(c, x + 3, y + 9 - i * 2 - 1, 4, 1, i < leds ? col : '#1c2438'); if (i < leds) P(c, x + 3, y + 9 - i * 2 - 1, '#ffffff'); }
}
// ── tiles animados ──
const TILE = {};
function makeTiles() {
  // reflejos del agua (transparentes; el fondo con profundidad va debajo)
  const [wc, wx] = mk(64, 16);
  for (let f = 0; f < 4; f++) {
    const r = rng(77);
    for (let i = 0; i < 6; i++) { const x = (Math.floor(r() * 16) + f * 2) % 16, y = Math.floor(r() * 8) * 2 + (i & 1), len = 3 + Math.floor(r() * 3);
      for (let k = 0; k < len; k++) P(wx, f * 16 + (x + k) % 16, y, i % 3 === 2 ? 'rgba(40,96,200,.55)' : 'rgba(190,230,255,.75)'); }
    P(wx, f * 16 + (3 + f * 4) % 16, 5, PAL.wh); P(wx, f * 16 + (11 + f * 4) % 16, 12, PAL.wh);
  }
  TILE.water = wc;
  const [fc, fx2] = mk(32, 16);
  for (let f = 0; f < 2; f++) for (const [x, y, col] of [[3, 4, '#f8f8f8'], [11, 6, '#f890b0'], [6, 12, '#f8e060']]) {
    const X = f * 16 + x, Y = y + (f && (x & 1) ? -1 : 0);
    P(fx2, X + 1, Y + 4, 'rgba(40,90,50,.35)'); P(fx2, X, Y + 2, PAL.g2); P(fx2, X, Y + 3, PAL.g2); P(fx2, X + 1, Y + 3, PAL.g1);
    R(fx2, X - 1, Y, 3, 1, col); R(fx2, X, Y - 1, 1, 3, col); P(fx2, X + 1, Y, dark(col, .18)); P(fx2, X, Y + 1, dark(col, .18)); P(fx2, X, Y, col === '#f8e060' ? '#f08838' : '#f8d040');
  }
  TILE.flower = fc;
  const [tc, tx] = mk(48, 16), [tf, tfx] = mk(48, 16);
  for (let l = 0; l < 3; l++) { tallTile(tx, l * 16, 0, false, l - 1); tallTile(tfx, l * 16, 0, true, l - 1); }
  TILE.tall = tc; TILE.tallFront = tf;
  // sombra de nube
  const [cc, cx2] = mk(128, 64); const blobs = [[40, 34, 34, 18], [74, 28, 38, 22], [96, 38, 26, 15], [58, 42, 30, 14]];
  for (let y = 0; y < 64; y++) for (let x = 0; x < 128; x++) { let fsum = 0; for (const [bx, by, rx, ry] of blobs) { const d = ((x - bx) / rx) ** 2 + ((y - by) / ry) ** 2; if (d < 1) fsum = Math.max(fsum, 1 - d); } if (fsum > .22 || (fsum > .04 && fsum * 5 > bay(x, y))) P(cx2, x, y, '#cfd9ee'); }
  TILE.cloud = cc;
  // viñeta tramada
  const [vc, vx] = mk(W, H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const d = Math.hypot((x - 80) / 104, (y - 72) / 92), a = clamp((d - .66) * 1.25, 0, .5), lv = Math.floor(a * 6 + bay(x, y)); if (lv > 0) P(vx, x, y, `rgba(14,18,48,${Math.min(.3, lv * .085)})`); }
  TILE.vig = vc;
}
function tallTile(c, x, y, front, lean = 0) {
  if (!front) { R(c, x, y, 16, 16, PAL.g1); for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) if ((j % 5) > 2 && bay(i, j) > .55) P(c, x + i, y + j, PAL.g2); }
  const rows = front ? [[10, [4, 9, 14]], [15, [2, 7, 12]]] : [[5, [2, 7, 12]], [10, [4, 9, 14]], [15, [2, 7, 12]]];
  for (const [cy, xs] of rows) for (const cx of xs) {
    const px = (dx, dy, col) => { const X = cx + dx + (dy <= -3 ? lean : 0); if (X >= 0 && X < 16) P(c, x + X, y + cy + dy, col); };
    if (front) { for (let i = -2; i <= 2; i++) { px(i, 0, PAL.g1); px(i, -1, PAL.g1); } }
    px(0, -5, PAL.gh); px(0, -4, PAL.g0); px(0, -3, PAL.g2); px(0, -2, PAL.g2); px(0, -1, PAL.g3);
    px(-2, -4, PAL.g0); px(-2, -3, PAL.g2); px(-1, -2, PAL.g2); px(-1, -1, PAL.g3); px(2, -4, PAL.gh); px(2, -3, PAL.g2); px(1, -2, PAL.g2); px(1, -1, PAL.g3);
    px(-1, -3, PAL.g3); px(1, -3, PAL.g3); px(-2, -1, PAL.g2); px(2, -1, PAL.g2); px(-2, -2, PAL.g3); px(2, -2, PAL.g3);
  }
}
// ── mapa ──
const SOLID = '#~=SXBRCTbpkKol', isPath = ch => ch === ':';
const TREE_LUMPS = [[8, -4, 6.6], [3.5, 1.5, 5.6], [12.5, 1.5, 5.6], [8, 4, 6.8], [5, -1.5, 5], [11.2, -1.2, 5.2]];
function paintTree(c, f, X, Y, r) {
  // tronco
  R(c, X + 6, Y + 9, 4, 6, PAL.tr); R(c, X + 6, Y + 9, 1, 6, lite(PAL.tr, .25)); R(c, X + 9, Y + 9, 1, 6, PAL.trd); R(c, X + 5, Y + 14, 6, 1, PAL.trd); P(c, X + 5, Y + 14, PAL.tr); R(c, X + 6, Y + 9, 4, 2, PAL.trd);
  const N = 26, off = 13, hgt = new Float32Array(N * N).fill(-1), lum = new Float32Array(N * N), edg = new Uint8Array(N * N);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const dx = i - 5, dy = j - off; let best = -1, bl = 0, be = 0;
    for (const [cx, cy, rr] of TREE_LUMPS) {
      const ddx = dx - cx, ddy = dy - cy, d = Math.hypot(ddx, ddy) / rr; if (d >= 1) continue;
      const z = Math.sqrt(1 - d * d) * rr + cy * .45;
      if (z > best) { best = z; bl = -(ddx / rr * .6 + ddy / rr * .75) + (1 - d) * .25 - (dy + 2) / 26; be = d > .8 && ddx + ddy > 0 ? 1 : 0; }
    }
    hgt[j * N + i] = best; lum[j * N + i] = bl; edg[j * N + i] = be;
  }
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const k = j * N + i; if (hgt[k] < 0) continue; const dx = i - 5, dy = j - off;
    const out = i === 0 || j === 0 || i === N - 1 || j === N - 1 || hgt[k - 1] < 0 || hgt[k + 1] < 0 || hgt[k - N] < 0 || hgt[k + N] < 0;
    const l = lum[k] + (r() - .5) * .34 + (bay(i, j) - .5) * .18;
    let col = out ? (lum[k] > .35 ? PAL.t2 : PAL.tk) : edg[k] ? PAL.t3 : l > .78 ? PAL.th : l > .42 ? PAL.t0 : l > .02 ? PAL.t1 : l > -.4 ? PAL.t2 : PAL.t3;
    P(c, X + dx, Y + dy, col); if (dy < 0) P(f, X + dx, Y + dy, col);
  }
}
function buildMap(def) {
  const w = def.w, h = def.h, [bg, c] = mk(w * 16, h * 16), [fg, f] = mk(w * 16, h * 16);
  const rows = def.rows.map(r => r.split('')), at = (x, y) => (rows[y] || [])[x] ?? '#';
  const M = { def, w, h, bg, fg, rows, at, lights: [], cables: [], blink: [], shadows: [] };
  if (def.paint) { def.paint(c, f, M); return M; }
  const pathy = v => v === ':' || v === 'S' || v === 'X';
  // 1. suelo, píxel a píxel, con manchas de tono
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const ch = rows[y][x], X = x * 16, Y = y * 16, r = rng(x * 131 + y * 977 + 5), nb = (dx, dy) => at(x + dx, y + dy);
    const paved = ch === 'P' || ch === 'a' || ch === 'R' || ch === 'D' || ch === 'l' || ch === 'n' || ('S=,'.includes(ch) && 'PaD'.includes(nb(0, 1)));
    if (paved) { paintGround(c, 'S=,'.includes(ch) ? nb(0, 1) : ch, X, Y, nb, r); if (ch === ',') { P(c, X + 7, Y + 7, '#f890b0'); P(c, X + 6, Y + 7, '#fff'); } }
    const isP = ch === ':' || (ch === 'S' && (isPath(nb(-1, 0)) || isPath(nb(1, 0))));
    if (!paved) {
    for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) {
      const gx = X + i, gy = Y + j, n = vnoise(gx / 26, gy / 26) * .7 + vnoise(gx / 8, gy / 8, 3) * .3 + (bay(gx, gy) - .5) * .2;
      P(c, gx, gy, isP ? (n > .62 ? PAL.pl : n < .4 ? mix(PAL.p0, PAL.p1, .5) : PAL.p0) : (n > .6 ? PAL.gl : n < .4 ? PAL.gd : PAL.g0));
    }
    if (!isP) {
      for (let i = 0; i < 4; i++) { const tx = 1 + Math.floor(r() * 12), ty = 3 + Math.floor(r() * 11); P(c, X + tx, Y + ty, PAL.g1); P(c, X + tx + 1, Y + ty - 1, PAL.g1); P(c, X + tx + 2, Y + ty, PAL.g1); P(c, X + tx + 1, Y + ty, PAL.g2); if (r() < .45) P(c, X + tx + 1, Y + ty - 2, PAL.gh); }
      if (r() < .1) { const sx = 2 + Math.floor(r() * 11), sy = 3 + Math.floor(r() * 10); R(c, X + sx, Y + sy, 3, 2, '#a8b0a8'); R(c, X + sx, Y + sy, 2, 1, '#e0e8e0'); R(c, X + sx, Y + sy + 2, 3, 1, PAL.g2); }
      if (r() < .14) { const sx = 2 + Math.floor(r() * 12), sy = 2 + Math.floor(r() * 12); P(c, X + sx, Y + sy, '#fffbe0'); P(c, X + sx + 1, Y + sy + 1, PAL.g1); }
    } else {
      for (let i = 0; i < 6; i++) P(c, X + Math.floor(r() * 16), Y + Math.floor(r() * 16), PAL.p1);
      for (let k = 0; k < 2; k++) if (r() < .5) { const bx = 2 + Math.floor(r() * 11), by = 3 + Math.floor(r() * 10); R(c, X + bx, Y + by, 2, 1, PAL.p2); P(c, X + bx, Y + by - 1, '#fff8dc'); P(c, X + bx + 1, Y + by + 1, mix(PAL.p1, PAL.p2, .5)); }
      for (let i = 0; i < 16; i++) {
        const d = () => 1 + (r() < .45 ? 1 : 0);
        if (!pathy(nb(0, -1))) { const k = d(); R(c, X + i, Y, 1, k, PAL.g2); R(c, X + i, Y + k, 1, 1, PAL.p2); if (r() < .3) P(c, X + i, Y + k + 1, PAL.p1); if (r() < .25) P(c, X + i, Y + k, PAL.g1); }
        if (!pathy(nb(0, 1))) { const k = d(); R(c, X + i, Y + 16 - k, 1, k, PAL.gl); if (r() < .4) P(c, X + i, Y + 15 - k, PAL.pl); }
        if (!pathy(nb(-1, 0))) { const k = d(); R(c, X, Y + i, k, 1, PAL.g1); P(c, X + k, Y + i, PAL.p1); }
        if (!pathy(nb(1, 0))) { const k = d(); R(c, X + 16 - k, Y + i, k, 1, PAL.gl); P(c, X + 15 - k, Y + i, PAL.pl); }
      }
    }
    }
    if (ch === '"') tallTile(c, X, Y);
    if (ch === 'L') {
      const lx = nb(-1, 0) === 'L' ? 0 : 2, rx = nb(1, 0) === 'L' ? 16 : 14, ww = rx - lx, rk = ['#d8b888', '#b89468', '#8c6c4c', '#644c38'];
      R(c, X + lx, Y + 5, ww, 1, PAL.gh); R(c, X + lx, Y + 6, ww, 1, PAL.g1);
      for (let i = lx; i < rx; i++) { const hh = r() < .3 ? 2 : 1; R(c, X + i, Y + 7, 1, hh, PAL.g2); for (let j = 7 + hh; j < 13; j++) P(c, X + i, Y + j, rk[j < 9 ? 0 : j < 11 ? 1 : 2]); }
      for (let i = lx + 1 + Math.floor(r() * 3); i < rx - 1; i += 3 + Math.floor(r() * 3)) { R(c, X + i, Y + 9, 1, 3, rk[2]); P(c, X + i + 1, Y + 9, lite(rk[0], .3)); P(c, X + i - 1, Y + 12, rk[3]); }
      R(c, X + lx, Y + 13, ww, 1, rk[3]); if (lx) { R(c, X + lx, Y + 7, 1, 6, rk[1]); } if (rx < 16) R(c, X + rx - 1, Y + 7, 1, 7, rk[3]);
      M.shadows.push(['r', X + lx + 1, Y + 14, ww, 3]);
    }
    if (ch === '=') {
      const hz2 = nb(-1, 0) === '=' || nb(1, 0) === '=', A = '#fff4dc', Bc = '#c8b490', K = '#6a5a48';
      if (hz2 || !(nb(0, -1) === '=' || nb(0, 1) === '=')) {
        const x0 = nb(-1, 0) === '=' ? 0 : 3, x1 = nb(1, 0) === '=' ? 16 : 13;
        R(c, X + x0, Y + 4, x1 - x0, 1, K); R(c, X + x0, Y + 5, x1 - x0, 2, A); R(c, X + x0, Y + 7, x1 - x0, 1, Bc); R(c, X + x0, Y + 8, x1 - x0, 1, K); R(c, X + x0, Y + 10, x1 - x0, 2, A); R(c, X + x0, Y + 12, x1 - x0, 1, Bc); R(c, X + x0, Y + 13, x1 - x0, 1, K);
        M.shadows.push(['r', X + x0 + 2, Y + 15, x1 - x0, 2]);
      }
      if (nb(0, -1) === '=') R(c, X + 7, Y - 3, 2, 8, A); if (nb(0, 1) === '=') R(c, X + 7, Y + 8, 2, 8, A);
      R(c, X + 5, Y + 1, 6, 14, K); R(c, X + 6, Y + 2, 4, 12, A); R(c, X + 9, Y + 2, 1, 12, Bc); R(c, X + 6, Y + 2, 4, 1, '#ffffff'); R(c, X + 6, Y + 13, 4, 1, Bc);
      M.shadows.push(['e', X + 10, Y + 15, 5, 2]);
    }
    if (ch === 'S') {
      R(c, X + 7, Y + 9, 2, 6, PAL.trd); P(c, X + 7, Y + 10, PAL.tr); R(c, X + 1, Y + 1, 14, 10, PAL.trd); R(c, X + 2, Y + 2, 12, 8, '#ecd09c'); R(c, X + 2, Y + 2, 12, 1, '#fff0c8'); R(c, X + 2, Y + 9, 12, 1, '#c8a870'); R(c, X + 13, Y + 3, 1, 7, '#c8a870');
      R(c, X + 4, Y + 4, 8, 1, PAL.tr); R(c, X + 4, Y + 6, 6, 1, PAL.tr); M.shadows.push(['e', X + 11, Y + 15, 6, 2]);
    }
  }
  // 2. agua: fondo con profundidad (orilla clara, centro oscuro) y ribazo
  const [wbg, wcx] = mk(w * 16, h * 16); M.wbg = wbg; M.shore = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (rows[y][x] === '~') {
    const X = x * 16, Y = y * 16, land = (dx, dy) => at(x + dx, y + dy) !== '~';
    c.clearRect(X, Y, 16, 16);
    for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) {
      let d = 99;
      for (let ty = -2; ty <= 2; ty++) for (let tx = -2; tx <= 2; tx++) if (at(x + tx, y + ty) !== '~') { const ddx = tx > 0 ? tx * 16 - i : tx < 0 ? i - (tx * 16 + 15) : 0, ddy = ty > 0 ? ty * 16 - j : ty < 0 ? j - (ty * 16 + 15) : 0; d = Math.min(d, Math.hypot(ddx, ddy)); }
      const dd = d + (bay(X + i, Y + j) - .5) * 4 + vnoise((X + i) / 7, (Y + j) / 7, 9) * 3;
      P(wcx, X + i, Y + j, dd < 5 ? '#8cd0f8' : dd < 10 ? '#6cb8f4' : dd < 19 ? PAL.w0 : dd < 30 ? '#4c98e8' : '#4088dc');
    }
    if (land(0, -1)) { R(c, X, Y, 16, 1, PAL.g2); for (let i = 0; i < 16; i++) { P(c, X + i, Y + 1, i % 5 === 2 ? '#c8a878' : '#a88860'); P(c, X + i, Y + 2, (i + y) % 4 === 1 ? '#644c38' : '#806448'); P(c, X + i, Y + 3, '#644c38'); } R(c, X, Y + 4, 16, 2, 'rgba(24,56,120,.5)'); M.shore.push([X, Y + 6, 16, 0]); }
    if (land(-1, 0)) { R(c, X, Y, 1, 16, PAL.g2); R(c, X + 1, Y, 1, 16, '#806448'); R(c, X + 2, Y, 1, 16, 'rgba(24,56,120,.4)'); M.shore.push([X + 3, Y, 0, 16]); }
    if (land(1, 0)) { R(c, X + 15, Y, 1, 16, PAL.g1); R(c, X + 14, Y, 1, 16, '#a88860'); M.shore.push([X + 13, Y, 0, 16]); }
    if (land(0, 1)) { R(c, X, Y + 15, 16, 1, PAL.g1); R(c, X, Y + 14, 16, 1, PAL.gh); M.shore.push([X, Y + 13, 16, 0]); }
  }
  // 3. sombras proyectadas (una sola capa, para que no se sumen)
  const [sm, sx2] = mk(w * 16, h * 16); sx2.fillStyle = '#1c3c50';
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (rows[y][x] === '#') ell(sx2, x * 16 + 11, y * 16 + 14, 10, 4, '#1c3c50');
  for (const o of def.objects || []) { const X = o.x * 16, Y = o.y * 16, ow = o.w * 16, oh = o.h * 16;
    if (o.k === 'casa') { sx2.fillRect(X + 3, Y + oh, ow + 3, 4); for (let i = 0; i < 7; i++) sx2.fillRect(X + ow + i, Y + 14 + i, 1, oh - 11 - i); }
    else if (o.k === 'palo') { for (let k = 0; k < 26; k++) sx2.fillRect(X + 9 + k, Y + 13 + (k >> 2), 2, 2); sx2.fillRect(X + 30, Y + 17, 8, 2); }
    else if (o.k === 'chatarra') { ell(sx2, X + 28, Y + 29, 24, 4, '#1c3c50'); }
    else if (o.k === 'central') { sx2.fillRect(X + 3, Y + oh, ow + 3, 5); for (let i = 0; i < 9; i++) sx2.fillRect(X + ow + i, Y + 30 + i, 1, oh - 26 - i); }
    else if (o.k === 'edif' || o.k === 'estacion' || o.k === 'torreApagon') { sx2.fillRect(X + 3, Y + oh, ow + 2, 4); for (let i = 0; i < 8; i++) sx2.fillRect(X + ow + i, Y + 4 + i, 1, oh - 2 - i); }
    else if (o.k === 'farola' || o.k === 'banco' || o.k === 'barrera' || o.k === 'arbusto') { }
    else if (o.k === 'fuente') { }
    else if (o.k === 'barco' || o.k === 'faro' || o.k === 'vapor' || o.k === 'granPila') { }
    else if (o.k === 'granFabrica') { sx2.fillRect(X + 4, Y + oh, ow, 5); }
    else if (o.k === 'torre') { for (let k = 0; k < 40; k++) sx2.fillRect(X + 4 + k, Y + 13 + (k >> 2), 8 - (k >> 3), 2); }
    else ell(sx2, X + 12, Y + 14, 7, 3, '#1c3c50');
  }
  for (const s of M.shadows) { if (s[0] === 'r') sx2.fillRect(s[1], s[2], s[3], s[4]); else ell(sx2, s[1], s[2], s[3], s[4], '#1c3c50'); }
  c.globalCompositeOperation = 'source-atop'; c.globalAlpha = .26; c.drawImage(sm, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  // 4. árboles (de arriba abajo, se solapan) y objetos
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (rows[y][x] === '#') paintTree(c, f, x * 16, y * 16, rng(x * 71 + y * 313));
  for (const o of def.objects || []) OBJ[o.k](c, f, o.x * 16, o.y * 16, o, M);
  return M;
}
// ── suelos de ciudad, playa, roca y muelle ──
function paintGround(c, ch, X, Y, nb, r) {
  if (ch === 'P') { // adoquines con bordillo donde acaba la calle
    for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) { const gx = X + i, gy = Y + j, row = gy >> 3, bx = (gx + (row & 1) * 4) & 7, by = gy & 7, n = vnoise(gx / 13, gy / 13, 2);
      P(c, gx, gy, bx === 0 || by === 0 ? '#9c968c' : by === 1 || bx === 1 ? '#e4ded0' : n > .66 && bay(gx, gy) > .5 ? '#c4bcac' : (bx + by) % 5 === 0 ? '#d8d0c0' : '#d0c8b8'); }
    if (!'PSD'.includes(nb(0, -1))) { R(c, X, Y, 16, 2, '#8c867c'); R(c, X, Y + 2, 16, 1, '#f0ece0'); }
    if (!'PSD'.includes(nb(0, 1))) { R(c, X, Y + 14, 16, 2, '#7c766c'); }
    if (!'PSD'.includes(nb(-1, 0))) R(c, X, Y, 2, 16, '#8c867c'); if (!'PSD'.includes(nb(1, 0))) R(c, X + 14, Y, 2, 16, '#7c766c');
  } else if (ch === 'a') { // arena con conchas
    for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) { const gx = X + i, gy = Y + j, n = vnoise(gx / 9, gy / 9, 6) + (bay(gx, gy) - .5) * .25; P(c, gx, gy, n > .68 ? '#fff4d0' : n < .32 ? '#e0c890' : '#f0dca8'); }
    if (r() < .3) { const sx = 3 + Math.floor(r() * 10), sy = 3 + Math.floor(r() * 10); P(c, X + sx, Y + sy, '#f8b8a8'); P(c, X + sx + 1, Y + sy, '#fff0e8'); P(c, X + sx, Y + sy + 1, '#d89080'); }
  } else if (ch === 'R') { // roca: pared de risco con vetas
    for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) { const gx = X + i, gy = Y + j, n = vnoise(gx / 7, gy / 5, 8) * .8 + vnoise(gx / 3, gy / 3, 9) * .2;
      P(c, gx, gy, n > .7 ? '#b8a890' : n > .5 ? '#9c8c74' : n > .32 ? '#806e5a' : '#5c4c3e'); }
    if (nb(0, -1) !== 'R') { R(c, X, Y, 16, 3, '#6aa850'); R(c, X, Y, 16, 1, '#a8dc78'); for (let i = 0; i < 16; i += 3) P(c, X + i, Y + 3, '#4c8840'); }
    if (nb(0, 1) !== 'R') { R(c, X, Y + 13, 16, 3, '#4c3c30'); }
  } else if (ch === 'l') { // lava con costra
    for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) { const gx = X + i, gy = Y + j, n = vnoise(gx / 7, gy / 7, 21) + vnoise(gx / 3, gy / 3, 22) * .3; P(c, gx, gy, n > 1.05 ? '#fff0a0' : n > .85 ? '#f8b030' : n > .6 ? '#e86020' : n > .45 ? '#a02818' : '#3c1c18'); }
    if (r() < .5) { /* brillo */ } 
  } else if (ch === 'n') { // ceniza volcánica
    for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) { const gx = X + i, gy = Y + j, n = vnoise(gx / 8, gy / 8, 23) + (bay(gx, gy) - .5) * .25; P(c, gx, gy, n > .66 ? '#8c8078' : n < .32 ? '#4c4440' : '#6c625a'); }
    if (r() < .25) { const sx = 2 + Math.floor(r() * 11), sy = 2 + Math.floor(r() * 11); P(c, X + sx, Y + sy, '#f86020'); }
  } else if (ch === 'D') { // tablones de muelle
    for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) { const gx = X + i, gy = Y + j, plank = (gx >> 2) & 3; P(c, gx, gy, (gx & 3) === 0 ? '#5c3c24' : ['#b8865a', '#a87850', '#c09060', '#ac7c54'][plank]); }
    for (const yy of [3, 12]) for (let i = 1; i < 16; i += 4) P(c, X + i, Y + yy, '#e0d8c8');
  }
}
// ── objetos del mapa ──
const OBJ = {
  casa(c, f, X, Y, o, M) {
    const wt = o.w, ht = o.h, w = wt * 16, h = ht * 16, wallH = 24, rh = h - wallH, [r0, r1, r2, r3] = o.roof, lab = o.lab;
    // tejado con degradado
    gradV(c, X, Y + 2, w, rh - 2, [lite(r1, .22), r1, r1, mix(r1, r2, .5)]);
    R(c, X + 1, Y, w - 2, 1, lite(r0, .3)); R(c, X, Y + 1, w, 1, r0); R(c, X, Y + 2, w, 1, r2);
    if (lab) { for (let xx = X + 7; xx < X + w; xx += 12) { R(c, xx, Y + 3, 1, rh - 6, r2); R(c, xx - 1, Y + 3, 1, rh - 6, lite(r1, .35)); P(c, xx - 3, Y + 6, r0); P(c, xx - 3, Y + 7, r2); P(c, xx - 3, Y + rh - 7, r0); P(c, xx - 3, Y + rh - 6, r2); }
      R(c, X + 10, Y + 9, 22, 12, r3); gradV(c, X + 11, Y + 10, 20, 10, ['#d8f4fc', '#a0d8f0', '#78b8e0']); R(c, X + 20, Y + 10, 1, 10, r3); for (let i = 0; i < 6; i++) P(c, X + 13 + i, Y + 17 - i, '#ffffff'); }
    else for (let yy = Y + 7, k = 0; yy < Y + rh - 3; yy += 5, k++) { R(c, X, yy, w, 1, r2); R(c, X, yy + 1, w, 1, lite(r1, .2)); for (let xx = X + (k % 2 ? 3 : 7); xx < X + w; xx += 8) { R(c, xx, yy - 4, 1, 4, r2); P(c, xx + 1, yy - 3, lite(r1, .35)); } }
    R(c, X, Y + rh - 3, w, 2, r2); R(c, X, Y + rh - 1, w, 1, r3); R(c, X, Y + 2, 1, rh - 3, lite(r0, .2)); R(c, X + w - 2, Y + 2, 2, rh - 2, r3);
    // pared
    const wall = lab ? '#e4ecf0' : '#f8eed0', wl = dark(wall, .1), wx0 = X + 2, ww = w - 4;
    R(c, wx0, Y + rh, ww, wallH, wall); gradV(c, wx0, Y + rh, ww, 5, [dark(wall, .34), dark(wall, .2), wall]);
    for (let yy = Y + rh + 7; yy < Y + h - 4; yy += 5) { R(c, wx0, yy, ww, 1, wl); }
    R(c, wx0 + ww - 3, Y + rh, 3, wallH, dark(wall, .16)); R(c, wx0, Y + rh, 1, wallH, lite(wall, .5));
    R(c, wx0, Y + h - 4, ww, 4, '#a09484'); R(c, wx0, Y + h - 4, ww, 1, '#c4b8a4'); for (let xx = wx0 + 4; xx < wx0 + ww; xx += 7) R(c, xx, Y + h - 3, 1, 3, '#7c7064');
    R(c, X + 1, Y + rh, 1, wallH, dark(wall, .62)); R(c, X + w - 2, Y + rh, 1, wallH, dark(wall, .62)); R(c, X + 1, Y + h - 1, w - 2, 1, dark(wall, .62));
    for (let col = 0; col < wt; col++) {
      if (col === o.door) {
        const dx = X + col * 16 + 2, dy = Y + h - 18, dc = o.dc || '#c86848';
        R(c, dx - 1, dy - 1, 14, 19, '#4a3024'); R(c, dx, dy, 12, 18, dark(dc, .45)); R(c, dx + 1, dy + 1, 10, 17, dc); R(c, dx + 1, dy + 1, 1, 17, lite(dc, .35)); R(c, dx + 10, dy + 1, 1, 17, dark(dc, .25));
        if (lab) { gradV(c, dx + 2, dy + 3, 8, 6, ['#d8f4fc', '#88c8e8']); R(c, dx + 6, dy + 1, 1, 17, dark(dc, .4)); }
        else { R(c, dx + 2, dy + 3, 8, 5, dark(dc, .22)); R(c, dx + 3, dy + 4, 6, 3, lite(dc, .22)); R(c, dx + 2, dy + 10, 8, 6, dark(dc, .22)); R(c, dx + 3, dy + 11, 6, 4, lite(dc, .12)); }
        P(c, dx + 9, dy + 9, '#f8e070'); P(c, dx + 9, dy + 10, '#b08810'); R(c, dx - 2, Y + h - 1, 16, 1, '#c4b8a4'); R(c, dx - 2, Y + h, 16, 1, '#807060');
        // tejadillo y farol
        R(c, dx - 3, dy - 5, 18, 3, r2); R(c, dx - 3, dy - 5, 18, 1, lite(r1, .2)); R(c, dx - 3, dy - 2, 18, 1, r3); R(c, dx - 2, dy - 1, 16, 2, 'rgba(40,30,40,.3)');
        M.lights.push({ x: dx + 6, y: dy + 4, r: 13 });
      } else if (!(lab && (col === o.door - 1 || col === o.door + 1))) {
        const wx = X + col * 16 + 2, wy = Y + rh + 6;
        R(c, wx - 1, wy - 1, 14, 12, '#5a4a3a'); gradV(c, wx, wy, 12, 10, ['#c8ecfc', '#90ccf4', '#68acdc']); for (let i = 0; i < 4; i++) { P(c, wx + 2 + i, wy + 4 - i, '#ffffff'); P(c, wx + 4 + i, wy + 6 - i, '#e0f4ff'); }
        R(c, wx, wy, 12, 1, 'rgba(30,40,70,.45)'); R(c, wx + 5, wy, 2, 10, '#f8f0e0'); R(c, wx, wy + 4, 12, 2, '#f8f0e0'); R(c, wx + 6, wy, 1, 10, '#d0c4b0'); R(c, wx, wy + 5, 12, 1, '#d0c4b0');
        R(c, wx - 2, wy + 11, 16, 2, '#e8dcc0'); R(c, wx - 2, wy + 12, 16, 1, '#a89878');
        if (!lab) { R(c, wx - 1, wy + 9, 14, 3, '#8a5a34'); R(c, wx - 1, wy + 9, 14, 1, '#b07c4c'); for (let i = 0; i < 6; i++) { P(c, wx + i * 2 + (i & 1), wy + 8, PAL.t1); P(c, wx + 1 + i * 2, wy + 7 + (i & 1), ['#f85878', '#f8e060', '#ffffff'][i % 3]); } }
        M.lights.push({ x: wx + 6, y: wy + 5, r: 12, win: [wx, wy] });
      }
    }
    if (lab) {
      const sx = X + o.door * 16 - 12; R(c, sx, Y + rh + 1, 40, 10, '#1c2838'); R(c, sx + 1, Y + rh + 2, 38, 8, '#3c5468'); R(c, sx + 1, Y + rh + 2, 38, 1, '#5c7c94'); txt('TALLER', sx + 4, Y + rh + 3, '#f8e070', c);
      const gx = X + w - 20, gy = Y + 15;
      for (let a = 0; a < 8; a++) { R(c, Math.round(gx + Math.cos(a * .785) * 9) - 1, Math.round(gy + Math.sin(a * .785) * 9) - 1, 3, 3, '#f8e070'); P(c, Math.round(gx + Math.cos(a * .785) * 9) + 1, Math.round(gy + Math.sin(a * .785) * 9) + 1, '#b08810'); }
      for (let dy = -8; dy <= 8; dy++) for (let dx = -8; dx <= 8; dx++) { const d = Math.hypot(dx, dy); if (d < 7.6) P(c, gx + dx, gy + dy, d < 2.6 ? r3 : d < 3.6 ? '#b08810' : d > 6.4 ? (dx + dy > 0 ? '#b08810' : '#fff4b0') : dx + dy < -4 ? '#fff4b0' : dx + dy > 5 ? '#d8b020' : '#f8e070'); else if (d < 8.6 && dx + dy > 2) P(c, gx + dx + 1, gy + dy + 1, r3); }
      R(f, X + 14, Y - 14, 1, 16, '#606878'); R(c, X + 14, Y, 1, 3, '#606878'); R(f, X + 11, Y - 9, 7, 1, '#606878'); R(f, X + 12, Y - 5, 5, 1, '#606878');
      M.blink.push({ x: X + 14, y: Y - 15, c: '#f85858' });
      // tubo de vapor
      R(c, X + w - 8, Y + rh + 2, 4, 14, '#98a8b8'); R(c, X + w - 8, Y + rh + 2, 1, 14, '#d0d8e4'); R(c, X + w - 5, Y + rh + 2, 1, 14, '#586878'); R(c, X + w - 9, Y + rh + 8, 6, 2, '#586878');
      M.smoke = M.smoke || []; M.smoke.push({ x: X + w - 6, y: Y + rh + 1, steam: 1 });
    } else {
      const cx0 = X + w - 15; R(c, cx0, Y - 3, 8, 11, '#7a3828'); R(c, cx0 + 1, Y - 2, 6, 10, '#b86048'); R(c, cx0 + 1, Y - 2, 2, 10, '#d88868'); R(c, cx0 + 6, Y - 2, 1, 10, '#904030'); R(c, cx0 - 1, Y - 4, 10, 2, '#d88868'); R(c, cx0 - 1, Y - 3, 10, 1, '#904030');
      R(f, cx0, Y - 3, 8, 3, '#b86048'); R(f, cx0 - 1, Y - 4, 10, 2, '#d88868'); R(f, cx0 - 1, Y - 3, 10, 1, '#904030'); for (let j = 1; j < 8; j += 3) R(c, cx0 + 1, Y + j, 6, 1, '#904030');
      M.smoke = M.smoke || []; M.smoke.push({ x: cx0 + 3, y: Y - 5 });
    }
  },
  poste(c, f, X, Y, o, M) {
    // estación de carga: base con franja de peligro, armario turquesa, pantalla y bobina con orbe (lo vivo se pinta en drawPostes)
    const d = (x, y, w, h, col) => { R(c, x, y, w, h, col); R(f, x, y, w, Math.min(h, Math.max(0, Y + 2 - y)), col); };
    ell(c, X + 8, Y + 15, 9, 2, 'rgba(20,44,60,.35)');
    d(X, Y + 10, 16, 6, INK); d(X + 1, Y + 11, 14, 4, '#8c8a84'); d(X + 1, Y + 11, 14, 1, '#b8b4a8'); for (let i = 0; i < 14; i++) if (((i >> 1) & 1) === 0) d(X + 1 + i, Y + 14, 1, 1, '#f8d030'); else d(X + 1 + i, Y + 14, 1, 1, '#2a2a34');
    // armario
    d(X + 2, Y - 13, 12, 24, INK); d(X + 3, Y - 12, 10, 22, '#30b8a8'); d(X + 3, Y - 12, 10, 1, '#8ce0d4'); d(X + 3, Y - 12, 1, 22, '#58d0c0'); d(X + 11, Y - 11, 2, 21, '#1c8078'); d(X + 3, Y + 8, 10, 2, '#1c6c64');
    // pantalla (marco)
    d(X + 3, Y - 10, 10, 9, INK); d(X + 4, Y - 9, 8, 7, '#0b1719');
    // rayo pintado y rejilla de ventilación
    d(X + 7, Y + 1, 2, 1, '#f8d030'); d(X + 6, Y + 2, 2, 1, '#f8d030'); d(X + 6, Y + 3, 3, 1, '#f8d030'); d(X + 7, Y + 4, 2, 1, '#f8d030'); d(X + 7, Y + 5, 1, 1, '#f8d030');
    for (let i = 0; i < 3; i++) d(X + 5, Y + 6 + i, 6, 1, i & 1 ? '#1c8078' : '#26a094');
    // cable enrollado con su enchufe
    d(X, Y - 4, 3, 8, INK); d(X + 1, Y - 3, 1, 6, '#f08838'); d(X, Y - 1, 3, 1, '#a85020'); d(X - 1, Y + 4, 4, 3, INK); d(X, Y + 5, 2, 1, '#c8d0dc');
    // bobina y soporte del orbe
    d(X + 6, Y - 22, 4, 9, INK); for (let i = 0; i < 4; i++) { d(X + 5, Y - 21 + i * 2, 6, 1, '#c87838'); d(X + 6, Y - 21 + i * 2, 4, 1, '#f0a050'); } d(X + 4, Y - 14, 8, 2, '#8890a0'); d(X + 4, Y - 14, 8, 1, '#c8d0dc');
    M.postes = M.postes || []; M.postes.push({ x: X, y: Y });
    M.lights.push({ x: X + 8, y: Y - 26, r: 18, c: '#70f8a0' }); M.lights.push({ x: X + 8, y: Y - 6, r: 10, c: '#70f8a0' });
  },
  palo(c, f, X, Y, o, M) {
    const d = (x, y, w, h, col) => { R(c, x, y, w, h, col); R(f, x, y, w, Math.min(h, Math.max(0, Y - y)), col); };
    d(X + 6, Y - 34, 4, 48, PAL.trd); d(X + 7, Y - 34, 2, 48, PAL.tr); d(X + 7, Y - 34, 1, 48, lite(PAL.tr, .3)); d(X + 1, Y - 31, 15, 3, PAL.trd); d(X + 1, Y - 31, 15, 1, lite(PAL.tr, .2));
    d(X + 2, Y - 35, 2, 4, '#e8f0f8'); d(X + 13, Y - 35, 2, 4, '#e8f0f8'); d(X + 3, Y - 35, 1, 4, '#98a8b8'); d(X + 14, Y - 35, 1, 4, '#98a8b8');
    if (o.to) M.cables.push({ x0: X + 8, y0: Y - 34, x1: o.to[0] * 16 + 8, y1: o.to[1] * 16 - 34 });
  },
  chatarra(c, f, X, Y) {
    ell(c, X + 24, Y + 24, 22, 7, '#5c544c'); ell(c, X + 22, Y + 21, 18, 6, '#7a7064'); ell(c, X + 18, Y + 19, 10, 3, '#8c8274');
    R(c, X + 3, Y + 5, 17, 21, '#1c1c2c'); R(c, X + 4, Y + 6, 15, 19, '#d8dcd8'); R(c, X + 4, Y + 6, 2, 19, '#f4f8f4'); R(c, X + 16, Y + 6, 3, 19, '#a8b0ac'); R(c, X + 4, Y + 6, 15, 3, '#b0b8b8'); P(c, X + 6, Y + 7, '#f85858'); P(c, X + 8, Y + 7, '#58c878');
    for (let dy = -5; dy <= 5; dy++) for (let dx = -5; dx <= 5; dx++) { const dd = Math.hypot(dx, dy); if (dd < 5.5) P(c, X + 11 + dx, Y + 16 + dy, dd > 4.2 ? (dx + dy > 0 ? '#505860' : '#909aa4') : dx + dy < -3 ? '#c8ecfc' : dx + dy > 3 ? '#2c64a8' : '#4888c8'); }
    for (const [px2, py2] of [[5, 22], [15, 12], [17, 23], [7, 11]]) P(c, X + px2, Y + py2, '#b87040');
    R(c, X + 22, Y + 1, 16, 15, '#1c1c2c'); R(c, X + 23, Y + 2, 14, 13, '#946238'); R(c, X + 23, Y + 2, 14, 1, '#c08850'); R(c, X + 35, Y + 2, 2, 13, '#6a4426'); R(c, X + 24, Y + 4, 10, 9, '#1c2c28'); R(c, X + 25, Y + 5, 8, 7, '#34504a'); R(c, X + 26, Y + 6, 3, 1, '#88b0a4'); P(c, X + 26, Y + 7, '#88b0a4'); P(c, X + 35, Y + 5, '#f8e070'); P(c, X + 35, Y + 8, '#d8dcd8');
    R(f, X + 27, Y - 6, 1, 8, '#606878'); R(f, X + 31, Y - 7, 1, 9, '#606878'); R(c, X + 27, Y, 1, 2, '#606878'); R(c, X + 31, Y, 1, 2, '#606878');
    for (let dy = -7; dy <= 7; dy++) for (let dx = -7; dx <= 7; dx++) { const dd = Math.hypot(dx, dy); if (dd < 6.6 && dd > 2) P(c, X + 39 + dx, Y + 22 + dy, dd > 5.4 || dd < 3 ? '#1c1c2c' : dx + dy < -3 ? '#5c6070' : '#383c48'); }
    for (let a = 0; a < 8; a++) R(c, Math.round(X + 26 + Math.cos(a * .785) * 5) - 1, Math.round(Y + 24 + Math.sin(a * .785) * 5) - 1, 2, 2, '#c8843c');
    for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) { const dd = Math.hypot(dx, dy); if (dd < 4.4) P(c, X + 26 + dx, Y + 24 + dy, dd < 1.5 ? '#5c544c' : dx + dy < -2 ? '#f8c888' : dx + dy > 2 ? '#b06c2c' : '#e09850'); }
    R(c, X + 13, Y + 26, 10, 2, '#8890a0'); R(c, X + 13, Y + 26, 10, 1, '#c8d0dc');
    for (const [gx2, gy2] of [[2, 28], [9, 30], [30, 30], [44, 28], [20, 29]]) { P(c, X + gx2, Y + gy2, PAL.g2); P(c, X + gx2 + 1, Y + gy2 - 1, PAL.g1); P(c, X + gx2 + 2, Y + gy2, PAL.g2); }
  },
  valla(c, f, X, Y, o, M) {
    R(c, X + 2, Y + 6, 2, 9, '#606878'); R(c, X + 12, Y + 6, 2, 9, '#606878'); P(c, X + 2, Y + 6, '#a0a8b8'); P(c, X + 12, Y + 6, '#a0a8b8'); R(c, X + 1, Y + 14, 4, 1, '#404858'); R(c, X + 11, Y + 14, 4, 1, '#404858');
    R(c, X, Y + 3, 16, 8, '#1c1c2c'); for (let i = 0; i < 14; i++) { const yel = ((i + 0) >> 1) % 2; R(c, X + 1 + i, Y + 4, 1, 6, yel ? '#f8d030' : '#2a2a3a'); if (yel) { P(c, X + 1 + i, Y + 4, '#fff4a0'); P(c, X + 1 + i, Y + 9, '#c09818'); } }
    M.blink.push({ x: X + 7, y: Y, c: '#f8a030', w: 2, h: 2 });
  },
};
function drawCrate(x, y) { g.fillStyle = 'rgba(24,56,72,.3)'; g.fillRect(x + 4, y + 14, 11, 2); R(g, x + 3, y + 5, 10, 10, '#1c1c2c'); R(g, x + 4, y + 6, 8, 8, '#e0a858'); R(g, x + 4, y + 6, 8, 1, '#f8d898'); R(g, x + 11, y + 6, 1, 8, '#a87838'); R(g, x + 4, y + 13, 8, 1, '#a87838'); R(g, x + 7, y + 6, 2, 8, '#8a5c30'); P(g, x + 7, y + 9, '#f8e070'); P(g, x + 8, y + 9, '#f8e070'); P(g, x + 7, y + 10, '#b08810'); P(g, x + 8, y + 10, '#b08810'); }

// ── interior del taller ──
function paintTaller(c, f, M) {
  for (let y = 2; y < 8; y++) for (let x = 0; x < 10; x++) { const b = (x + y) & 1 ? '#ece4cc' : '#e2d8bc'; R(c, x * 16, y * 16, 16, 16, b); R(c, x * 16, y * 16, 16, 1, lite(b, .5)); R(c, x * 16, y * 16, 1, 16, lite(b, .5)); R(c, x * 16, y * 16 + 15, 16, 1, '#cfc4a4'); R(c, x * 16 + 15, y * 16, 1, 16, '#cfc4a4'); for (let k = 0; k < 3; k++) P(c, x * 16 + 2 + ((x * 7 + y * 3 + k * 5) % 12), y * 16 + 2 + ((x * 3 + y * 11 + k * 7) % 12), '#d8ccac'); }
  gradV(c, 0, 0, 160, 32, ['#7ca0ac', '#8fb0b8', '#9cbcc4']); R(c, 0, 0, 160, 3, '#5c7c88'); R(c, 0, 3, 160, 1, '#48646c'); R(c, 0, 28, 160, 4, '#4c6470'); R(c, 0, 28, 160, 1, '#6c8894'); gradV(c, 0, 32, 160, 5, ['#a89c80', '#cfc4a4', '#e2d8bc']);
  for (let x = 15; x < 160; x += 16) { R(c, x, 4, 1, 24, '#7898a0'); R(c, x + 1, 4, 1, 24, '#a8c8d0'); }
  // haz de luz de la ventana sobre el suelo
  for (let j = 0; j < 60; j++) for (let i = 0; i < 34; i++) { const x = 84 + i - j * .35, y = 36 + j; if (y < 126 && (i + j * .2) % 17 > 2 && bay(Math.round(x), y) < .34 - j * .003) P(c, Math.round(x), y, 'rgba(255,248,200,.5)'); }
  // alfombra con sombra y fleco
  ell(c, 81, 90, 45, 23, 'rgba(60,50,40,.25)');
  for (let dy = -22; dy <= 22; dy++) for (let dx = -44; dx <= 44; dx++) { const d = Math.hypot(dx / 44, dy / 22); if (d < 1) { let col = d > .88 ? '#2c8078' : d > .76 ? '#f8e070' : d > .3 ? '#58b8b0' : d > .22 ? '#f8e070' : '#2c8078'; if (d > .3 && d < .76 && ((Math.atan2(dy * 2, dx) * 6 / Math.PI + 12) | 0) % 2 === 0) col = '#4ca8a0'; if (dy > 14 && d < .98) col = dark(col, .12); P(c, 80 + dx, 88 + dy, col); } }
  // pizarra
  R(c, 35, 4, 46, 23, '#3c2418'); R(c, 36, 5, 44, 21, PAL.trd); R(c, 36, 5, 44, 1, PAL.tr); R(c, 37, 6, 42, 19, '#2c4c44'); R(c, 37, 6, 42, 1, '#1c3830'); for (let k = 0; k < 14; k++) P(c, 38 + (k * 17) % 40, 8 + (k * 7) % 16, '#3c5c54'); txt('PULSO', 40, 10, '#e8f0e0', c);
  for (let a = 0; a < 12; a++) P(c, Math.round(66 + Math.cos(a * .52) * 5), Math.round(13 + Math.sin(a * .52) * 5), '#e8f0e0');
  [[42, 21], [45, 18], [47, 21], [50, 17], [52, 21], [55, 19]].forEach(([x, y], i, a) => { if (i) { const [px2, py2] = a[i - 1]; for (let k = 0; k <= 3; k++) P(c, Math.round(px2 + (x - px2) * k / 3), Math.round(py2 + (y - py2) * k / 3), '#f8e070'); } });
  R(c, 37, 26, 42, 1, '#946238'); R(c, 44, 25, 6, 1, '#f8f8f8'); R(c, 54, 25, 4, 1, '#f8a0a0');
  // ventana
  R(c, 87, 4, 24, 21, '#586c78'); R(c, 88, 5, 22, 19, '#f8f8f0'); gradV(c, 89, 6, 20, 16, ['#88ccf8', '#b8e4fc', '#e0f4fc']); R(c, 92, 12, 9, 3, '#ffffff'); R(c, 94, 10, 5, 2, '#ffffff'); R(c, 93, 15, 7, 1, '#d8ecf8'); R(c, 98, 6, 2, 16, '#f8f8f0'); R(c, 89, 13, 20, 1, '#f8f8f0'); R(c, 88, 23, 22, 2, '#d8d8d0'); R(c, 88, 25, 22, 1, '#788c98');
  M.lights.push({ x: 99, y: 14, r: 0 });
  // estantería
  R(c, 113, 2, 47, 46, '#1c1c2c'); R(c, 114, 3, 46, 44, PAL.trd); R(c, 114, 3, 1, 44, PAL.tr); R(c, 114, 3, 46, 1, PAL.tr);
  const r = rng(9); for (let s = 0; s < 3; s++) { const sy = 6 + s * 13; R(c, 116, sy, 42, 11, '#2c1a10'); R(c, 116, sy, 42, 2, '#1c1008'); let x = 117; while (x < 155) { const bw = 2 + Math.floor(r() * 3), bh = 7 + Math.floor(r() * 3); const col = ['#e86048', '#58b8b0', '#f8c838', '#5a4a8a', '#78c850', '#f0f0e8'][Math.floor(r() * 6)]; R(c, x, sy + 11 - bh, bw, bh, col); R(c, x, sy + 11 - bh, 1, bh, lite(col, .4)); if (bw > 2) R(c, x + bw - 1, sy + 11 - bh, 1, bh, dark(col, .3)); R(c, x, sy + 13 - bh, bw, 1, dark(col, .3)); x += bw + (r() < .2 ? 3 : 1); } R(c, 115, sy + 11, 44, 2, PAL.tr); R(c, 115, sy + 11, 44, 1, lite(PAL.tr, .3)); }
  R(c, 114, 47, 46, 2, 'rgba(60,50,40,.3)');
  // máquina grande
  R(c, 0, 7, 33, 42, '#1c1c2c'); gradV(c, 1, 8, 31, 40, ['#8898a8', '#687888', '#586878']); R(c, 1, 8, 31, 2, '#b0c0d0'); R(c, 1, 8, 2, 40, '#98a8b8'); R(c, 29, 8, 3, 40, '#485868'); R(c, 4, 12, 25, 14, '#1c2430'); R(c, 5, 13, 23, 12, '#283440');
  for (let dy = -5; dy <= 5; dy++) for (let dx = -5; dx <= 5; dx++) { const d = Math.hypot(dx, dy); if (d < 5.2) P(c, 11 + dx, 19 + dy, d > 4 ? (dx + dy > 0 ? '#586878' : '#c0d0e0') : '#f4f4e4'); }
  R(c, 11, 16, 1, 4, '#e84848'); P(c, 11, 19, '#1c1c2c'); for (let i = 0; i < 4; i++) { R(c, 5 + i * 6, 40, 5, 4, '#1c2430'); R(c, 6 + i * 6, 40, 3, 3, ['#e86048', '#f8c838', '#58b8b0', '#d8dcd8'][i]); P(c, 6 + i * 6, 40, '#ffffff'); }
  R(c, 4, 28, 25, 10, '#1c2430'); R(c, 5, 29, 23, 8, '#4c5868'); for (let i = 0; i < 5; i++) { R(c, 7 + i * 4, 30, 2, 6, '#1c2430'); P(c, 7 + i * 4, 30, '#283440'); }
  R(c, 23, 0, 6, 9, '#1c1c2c'); R(c, 24, 0, 4, 9, '#98a8b8'); R(c, 24, 0, 1, 9, '#d0d8e4'); R(c, 27, 0, 1, 9, '#586878'); R(c, 1, 48, 33, 2, 'rgba(60,50,40,.3)');
  M.blink.push({ x: 19, y: 15, c: '#58e890' }, { x: 22, y: 15, c: '#f8c838', slow: 1 }, { x: 25, y: 15, c: '#f85858' }, { x: 19, y: 20, c: '#58aef0', slow: 1 }, { x: 23, y: 20, c: '#58e890' });
  // banco de trabajo
  R(c, 48, 62, 52, 3, 'rgba(60,50,40,.3)'); R(c, 46, 45, 52, 18, '#1c1c2c'); R(c, 47, 46, 50, 8, '#e0b078'); R(c, 47, 46, 50, 1, '#fce0b0'); for (let x = 50; x < 96; x += 9) R(c, x, 48, 5, 1, '#c89860'); R(c, 47, 54, 50, 8, '#a87440'); R(c, 47, 54, 50, 1, '#7c5028'); R(c, 49, 57, 46, 1, '#8a5c30'); R(c, 60, 55, 1, 7, '#8a5c30'); R(c, 84, 55, 1, 7, '#8a5c30');
  // macetas
  for (const px2 of [0, 144]) { ell(c, px2 + 9, 95, 6, 2, 'rgba(60,50,40,.3)'); R(c, px2 + 3, 87, 10, 9, '#1c1c2c'); R(c, px2 + 4, 88, 8, 7, '#b85838'); R(c, px2 + 4, 88, 2, 7, '#e08060'); R(c, px2 + 10, 88, 2, 7, '#8c3c24'); R(c, px2 + 3, 86, 10, 2, '#d87858'); for (const [dx, dy] of [[0, -8], [-3, -5], [3, -5], [-1, -11], [2, -9], [-4, -2], [4, -2]]) { R(c, px2 + 7 + dx, 85 + dy, 3, 4, dx < 0 ? PAL.t1 : PAL.t2); P(c, px2 + 7 + dx, 85 + dy, PAL.t0); } R(c, px2 + 7, 75, 2, 2, PAL.th); }
  // felpudo
  R(c, 63, 113, 34, 14, '#6c2c20'); R(c, 64, 114, 32, 12, '#a84838'); R(c, 65, 115, 30, 10, '#d86850'); R(c, 65, 115, 30, 1, '#f09078'); for (let x = 67; x < 94; x += 4) R(c, x, 117, 2, 6, '#f0a080');
}

// ───────── capítulo 2: Ruta 2 y Central Dinamo ─────────
Object.assign(STYLES, {
  pescador: { cap: 1, h: '#4a7ab8', H: '#2c5488', s: '#d8a078', c: '#d8c890', C: '#b0a068', d: '#4a5a80', e: '#5a4030', b: '#6a8a48', w: '#f8f8f8' },
  chatarrero: { bald: 1, h: '#6a5040', H: '#4a3020', s: '#d8a078', c: '#c87838', C: '#a05820', d: '#4a4a5a', e: '#3a3030', b: '#808890', w: '#f8e070' },
  veraneante: { long: 1, h: '#f0c040', H: '#c09020', s: '#f8c8a0', c: '#58c8e8', C: '#38a0c0', d: '#f8f0f0', e: '#e86048', b: '#58c8e8', w: '#ffffff' },
  apagon: { cap: 1, h: '#2a2438', H: '#1a1424', s: '#e8b088', c: '#3c3050', C: '#2a2238', d: '#1c1828', e: '#f8d030', b: '#3c3050', w: '#f8d030' },
  contadora: { long: 1, bun: 1, coat: 1, h: '#c03050', H: '#901c38', s: '#f0c0a0', c: '#3c3050', C: '#2a2238', d: '#1c1828', e: '#202020', b: '#3c3050', w: '#f8d030' },
  volta: { long: 1, cap: 1, h: '#f8d030', H: '#3a4868', s: '#f0c0a0', c: '#3a4868', C: '#2a3450', d: '#2a2a3a', e: '#f8d030', b: '#f8d030', w: '#f8d030' },
  herrin: { cap: 1, h: '#e8e8f0', H: '#283c68', s: '#d8a078', c: '#283c68', C: '#1c2c50', d: '#f0f0f0', e: '#3a2a20', b: '#c88458', w: '#f8d030' },
  tasador: { bald: 1, h: '#5a4a3a', H: '#3a2a20', s: '#e8b088', c: '#2a2438', C: '#1a1424', d: '#1c1828', e: '#f8d030', b: '#2a2438', w: '#f8d030' },
  tallo: { cap: 1, h: '#6a4a30', H: '#58a848', s: '#d8a078', c: '#78c850', C: '#4c9838', d: '#5a4a38', e: '#3a2a20', b: '#a87850', w: '#f8e070' },
  podadora: { long: 1, h: '#2a2438', H: '#1a1424', s: '#f0c0a0', c: '#2a2438', C: '#1a1424', d: '#1c1828', e: '#f8d030', b: '#58e890', w: '#58e890' },
  estano2: { long: 1, bun: 1, coat: 1, h: '#b8b8d0', H: '#8888a8', s: '#f0c0a0', c: '#f4f4f8', C: '#d4d4e4', d: '#506080', e: '#404858', b: '#f4f4f8', w: '#58b8b0' },
  ohmio: { bald: 1, h: '#c8c8d0', H: '#9898a8', s: '#e8b088', c: '#1c1828', C: '#0c0a14', d: '#1c1828', e: '#f8d030', b: '#1c1828', w: '#f8d030' },
  pirita: { cap: 1, long: 1, h: '#c05030', H: '#f8d030', s: '#d8a078', c: '#9890d0', C: '#6c64a8', d: '#3a3a48', e: '#3a2a20', b: '#f8d030', w: '#f8d030' },
  candil: { bald: 1, h: '#5a3020', H: '#3a1c10', s: '#c88060', c: '#7c3c20', C: '#5a2810', d: '#3a2a20', e: '#1c1410', b: '#5a3a24', w: '#f8a030' },
  bruma: { long: 1, bun: 1, coat: 1, h: '#d8e8f8', H: '#a8c0d8', s: '#f0c8b0', c: '#f8f8ff', C: '#d0d8e8', d: '#a8c0d8', e: '#f8f8ff', b: '#f8f8ff', w: '#58aef0' },
  operaria: { cap: 1, h: '#5a3a28', H: '#d8d8e0', s: '#c89070', c: '#e8e8f0', C: '#b8b8c8', d: '#3a4868', e: '#303038', b: '#f08838', w: '#f08838' },
});
// pinta en fondo y, lo que sobresale por encima de la base, también en la capa de delante
const both = (c, f, Y0) => (x, y, w, h, col) => { R(c, x, y, w, h, col); if (y < Y0) R(f, x, y, w, Math.min(h, Y0 - y), col); };
const bothP = (c, f, Y0) => (x, y, col) => { P(c, x, y, col); if (y < Y0) P(f, x, y, col); };
Object.assign(OBJ, {
  central(c, f, X, Y, o, M) {
    const w = o.w * 16, h = o.h * 16, rh = 30, wy = Y + rh, wh = h - rh, d = both(c, f, Y + 8), dp = bothP(c, f, Y + 8);
    // chimenea (detrás del tejado)
    const cx0 = X + w - 26; d(cx0 - 1, Y - 30, 14, 40, '#3c2420'); for (let yy = Y - 29; yy < Y + 10; yy++) for (let xx = 0; xx < 12; xx++) { const row = (yy - Y + 40) >> 2, brick = ((xx + (row & 1) * 3) % 6 === 0) || ((yy - Y + 40) & 3) === 0; dp(cx0 + xx, yy, brick ? '#7c3c2c' : xx < 3 ? '#c8704c' : xx > 9 ? '#8c4430' : '#a85438'); }
    d(cx0 - 2, Y - 32, 16, 3, '#5c3428'); d(cx0 - 2, Y - 32, 16, 1, '#c8704c'); d(cx0 + 1, Y - 31, 10, 1, '#1c1418');
    for (let k = 0; k < 3; k++) d(cx0, Y - 20 + k * 9, 12, 1, '#e8e0d0');
    M.blink.push({ x: cx0 + 5, y: Y - 34, c: '#f85858', w: 2, h: 2, slow: 1 });
    // tejado en diente de sierra con lucernarios apagados
    const teeth = 4, tw2 = w / teeth;
    for (let k = 0; k < teeth; k++) {
      const tx = X + k * tw2;
      gradV(c, tx, Y + 4, tw2, rh - 4, ['#6c7688', '#545c6c', '#454c5a', '#3a404c']);
      for (let yy = Y + 7; yy < Y + rh; yy += 4) R(c, tx, yy, tw2, 1, '#3c4250');
      R(c, tx, Y + 2, tw2, 2, '#8c96a8'); R(c, tx, Y + 2, tw2, 1, '#b8c0cc');
      R(c, tx + tw2 - 9, Y + 2, 9, rh - 4, '#1c2230'); R(c, tx + tw2 - 9, Y + 2, 1, rh - 4, '#5c6878');
      for (let yy = Y + 5; yy < Y + rh - 3; yy += 6) { R(c, tx + tw2 - 8, yy, 8, 1, '#3c4858'); P(c, tx + tw2 - 7 + (k * 3 + yy) % 6, yy + 2, '#7c90a8'); }
    }
    R(c, X, Y + rh - 2, w, 2, '#2c303a'); R(c, X, Y + rh - 3, w, 1, '#7c8698');
    // rayo del logotipo, apagado
    const lx = X + 66, ly = Y + 8; [[6, 0], [5, 1], [4, 2], [3, 3], [2, 4], [3, 5], [4, 5], [5, 5], [6, 5], [5, 6], [4, 7], [3, 8], [2, 9]].forEach(([dx, dy]) => { R(c, lx + dx * 2, ly + dy * 2, 4, 2, '#8c7a3c'); P(c, lx + dx * 2, ly + dy * 2, '#b8a058'); });
    // fachada de ladrillo
    for (let yy = wy; yy < Y + h; yy++) for (let xx = X; xx < X + w; xx++) {
      const row = (yy - wy) >> 2, joint = ((yy - wy) & 3) === 3 || ((xx - X + (row & 1) * 4) & 7) === 0;
      const gr = vnoise(xx / 9, yy / 9, 4) * .7 + (yy - wy) / wh * .5;
      P(c, xx, yy, joint ? '#7c3c2c' : gr > .78 && bay(xx, yy) > .5 ? '#8c4430' : ((xx * 7 + row * 13) % 11 === 0) ? '#b86a48' : '#a85438');
    }
    gradV(c, X, wy, w, 6, ['#3c2420', '#6c3428', '#a85438']);
    for (let k = 0; k <= o.w; k += 2) { const px = X + k * 16 - (k === o.w ? 4 : 0); R(c, px, wy, 4, wh, '#8c4430'); R(c, px, wy, 1, wh, '#c8704c'); R(c, px + 3, wy, 1, wh, '#6c3428'); }
    R(c, X, Y + h - 5, w, 5, '#7c7c80'); R(c, X, Y + h - 5, w, 1, '#a8a8ac'); for (let xx = X + 3; xx < X + w; xx += 9) R(c, xx, Y + h - 4, 1, 4, '#5c5c64');
    R(c, X, wy, 1, wh, '#3c2420'); R(c, X + w - 1, wy, 1, wh, '#3c2420');
    // ventanales apagados (uno roto)
    for (let col = 0; col < o.w; col++) {
      if (col === o.door || col === o.door + 1 || col % 2 === 0) continue;
      const vx = X + col * 16 - 3, vy = wy + 9;
      R(c, vx - 1, vy - 3, 22, 30, '#3c2420'); ell(c, vx + 10, vy, 10, 3, '#3c2420');
      gradV(c, vx + 1, vy - 1, 18, 26, ['#2c3848', '#1c2430', '#141a24']);
      for (let i = 0; i < 18; i++) for (let j = 0; j < 3; j++) if (Math.hypot(i - 8.5, j * 1.5 - 1) < 8) P(c, vx + 1 + i, vy - 2 + j, '#2c3848');
      R(c, vx + 9, vy - 3, 2, 28, '#4c5868'); R(c, vx + 1, vy + 7, 18, 1, '#4c5868'); R(c, vx + 1, vy + 15, 18, 1, '#4c5868');
      P(c, vx + 3, vy + 1, '#6c88a8'); P(c, vx + 4, vy, '#6c88a8'); P(c, vx + 13, vy + 9, '#6c88a8');
      if (col === 3 && !o.lit) { for (const [a, b] of [[13, 1], [14, 2], [15, 2], [16, 3], [14, 4], [12, 3], [13, 5]]) P(c, vx + a, vy + b, '#0c0e14'); }
      if (o.lit) { gradV(c, vx + 1, vy - 1, 18, 26, ['#fff4c0', '#f8d878', '#e8b850']); R(c, vx + 9, vy - 3, 2, 28, '#4c5868'); R(c, vx + 1, vy + 7, 18, 1, '#4c5868'); R(c, vx + 1, vy + 15, 18, 1, '#4c5868'); M.lights.push({ x: vx + 10, y: vy + 10, r: 14, c: '#f8d878' }); }
      R(c, vx - 2, vy + 25, 24, 2, '#c8b8a0'); R(c, vx - 2, vy + 26, 24, 1, '#8c7c68');
    }
    // puerta enrollable entreabierta con franjas de peligro
    const dx = X + o.door * 16, dy = Y + h - 30;
    R(c, dx - 4, dy - 4, 40, 34, '#2c2c34'); for (let j = 0; j < 30; j++) { const s = ((j >> 2) & 1) ? '#f8c830' : '#1c1c24'; R(c, dx - 4, dy - 2 + j, 3, 1, s); R(c, dx + 33, dy - 2 + j, 3, 1, s); }
    for (let j = 0; j < 18; j += 3) { R(c, dx, dy + j, 32, 2, '#7c8494'); R(c, dx, dy + j, 32, 1, '#a8b0bc'); R(c, dx, dy + j + 2, 32, 1, '#4c5260'); }
    R(c, dx, dy + 18, 32, 2, '#3c424c'); R(c, dx + 13, dy + 16, 6, 2, '#2c2c34');
    gradV(c, dx, dy + 20, 32, 10, ['#0c0c14', '#14161e', '#1c1e28']);
    // cartel apagado
    const sg = o.sign || 'CENTRAL DINAMO', sw = tw_(sg) + 10, sx = Math.round(X + w / 2 - sw / 2 + (o.sign ? 0 : 8)), sy = wy + 1;
    R(c, sx, sy, sw, 11, '#1c1c24'); R(c, sx + 1, sy + 1, sw - 2, 9, '#2c3444'); R(c, sx + 1, sy + 1, sw - 2, 1, '#4c5868'); txt(sg, sx + 5, sy + 2, o.lit ? '#f8e070' : '#8c7a50', c);
    M.lights.push({ x: dx + 16, y: dy + 24, r: 10, c: '#f85858' });
  },
  torre(c, f, X, Y, o, M) {
    const top = Y - 46, d = both(c, f, Y), dp = bothP(c, f, Y);
    const L = (x0, y0, x1, y1, col, col2) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)); for (let i = 0; i <= n; i++) { const x = Math.round(x0 + (x1 - x0) * i / n), y = Math.round(y0 + (y1 - y0) * i / n); dp(x, y, col); if (col2) dp(x + 1, y, col2); } };
    L(X + 1, Y + 14, X + 6, top, '#4c5464', '#a8b0bc'); L(X + 14, Y + 14, X + 9, top, '#c8d0dc', '#4c5464');
    for (let k = 0; k < 5; k++) { const y0 = Y + 14 - k * 12, y1 = y0 - 12, i0 = 1 + k * 1, i1 = 1 + (k + 1) * 1; if (y1 < top) break; L(X + i0 + 1, y0, X + 14 - i1, y1, '#7c8494'); L(X + 14 - i0, y0, X + i1 + 1, y1, '#5c6474'); d(X + i1, y1, 16 - i1 * 2, 1, '#8890a0'); }
    d(X - 6, top + 1, 28, 2, '#5c6474'); d(X - 6, top + 1, 28, 1, '#c8d0dc'); d(X - 2, top + 12, 20, 2, '#5c6474'); d(X - 2, top + 12, 20, 1, '#c8d0dc');
    for (const ix of [X - 6, X + 20]) { d(ix, top + 3, 2, 5, '#f0f0f0'); d(ix, top + 4, 2, 1, '#a0a8b8'); d(ix, top + 6, 2, 1, '#a0a8b8'); }
    for (const ix of [X - 2, X + 16]) { d(ix, top + 14, 2, 4, '#f0f0f0'); d(ix, top + 15, 2, 1, '#a0a8b8'); }
    d(X + 7, top - 6, 2, 7, '#8890a0'); d(X + 7, top - 6, 1, 7, '#c8d0dc');
    d(X + 3, Y + 8, 10, 3, '#f8d030'); for (let i = 0; i < 10; i += 3) d(X + 3 + i, Y + 8, 1, 3, '#1c1c24');
    if (o.to) { const [tx, ty] = o.to; M.cables.push({ x0: X - 5, y0: top + 7, x1: tx - 13, y1: ty }, { x0: X + 21, y0: top + 7, x1: tx + 13, y1: ty }); }
  },
  gen(c, f, X, Y, o, M) {
    ell(c, X + 18, Y + 30, 16, 3, 'rgba(0,0,0,.35)');
    R(c, X + 1, Y + 3, 30, 28, '#14161c'); gradV(c, X + 2, Y + 4, 28, 9, ['#a8b2c0', '#8c96a4', '#7c8694']); R(c, X + 2, Y + 4, 28, 1, '#d0d8e4');
    gradV(c, X + 2, Y + 13, 28, 17, ['#6c7684', '#5c6674', '#4c5462']); R(c, X + 2, Y + 13, 28, 1, '#2c323c'); R(c, X + 29, Y + 4, 1, 26, '#3c424c'); R(c, X + 2, Y + 4, 1, 26, '#9ca6b4');
    for (let dy = -6; dy <= 6; dy++) for (let dx = -6; dx <= 6; dx++) { const dd = Math.hypot(dx, dy); if (dd < 6.4) P(c, X + 10 + dx, Y + 21 + dy, dd > 5.2 ? (dx + dy < 0 ? '#2c323c' : '#9ca6b4') : '#1c2028'); }
    for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) { const dd = Math.hypot(dx, dy); if (dd < 4.4) P(c, X + 23 + dx, Y + 20 + dy, dd > 3.4 ? '#2c323c' : dy < -1 ? '#f8f8e8' : '#e0e4d0'); }
    for (let i = 0; i < 28; i += 4) { R(c, X + 2 + i, Y + 28, 2, 2, '#f8c830'); R(c, X + 4 + i, Y + 28, 2, 2, '#1c1c24'); }
    txt('G' + (o.n + 1), X + 19, Y + 6, '#3c4250', c);
    R(c, X + 13, Y - 6, 4, 10, '#3c424c'); R(c, X + 13, Y - 6, 1, 10, '#7c8694');
  },
  turbina(c, f, X, Y, o, M) {
    const cx = X + 32, cy = Y + 24;
    R(c, X, Y + 6, 64, 36, '#1c1e26'); R(c, X - 10, Y + 18, 84, 8, '#3c424c'); R(c, X - 10, Y + 18, 84, 2, '#7c8694'); R(c, X - 10, Y + 25, 84, 1, '#1c1e26');
    for (let dy = -23; dy <= 23; dy++) for (let dx = -23; dx <= 23; dx++) { const d = Math.hypot(dx, dy); if (d < 23.5) P(c, cx + dx, cy + dy, d > 21 ? '#14161c' : d > 18 ? (dx + dy < -8 ? '#c8d0dc' : dx + dy > 8 ? '#4c5462' : '#8c96a4') : '#20242c'); }
    for (let a = 0; a < 12; a++) { const x = Math.round(cx + Math.cos(a * .5236) * 19.5), y = Math.round(cy + Math.sin(a * .5236) * 19.5); P(c, x, y, '#e8ecf4'); P(c, x + 1, y + 1, '#3c424c'); }
    R(c, cx - 30, Y + 44, 60, 4, '#14161c'); for (let i = 0; i < 60; i += 6) { R(c, cx - 30 + i, Y + 44, 3, 3, '#f8c830'); }
  },
});
// ── interior de la Central ──
function paintCentral(c, f, M) {
  const { w, h, at } = M;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const ch = at(x, y), X = x * 16, Y = y * 16;
    if (ch === '.') {
      const tone = (x + y) & 1 ? '#596270' : '#545c6a';
      for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) { const n = vnoise((X + i) / 11, (Y + j) / 11, 7); let col = ((i + j * 3) % 6 === 0 && (j & 1)) ? '#646e7c' : tone; if (n > .72 && bay(X + i, Y + j) > .45) col = '#4a515e'; P(c, X + i, Y + j, col); }
      R(c, X, Y, 16, 1, '#6c7684'); R(c, X, Y, 1, 16, '#6c7684'); R(c, X, Y + 15, 16, 1, '#3c424e'); R(c, X + 15, Y, 1, 16, '#3c424e');
      for (const [i, j] of [[2, 2], [13, 2], [2, 13], [13, 13]]) { P(c, X + i, Y + j, '#8c96a4'); P(c, X + i + 1, Y + j + 1, '#30363f'); }
      if (at(x, y - 1) === 'X' || at(x, y - 1) === 'B') { R(c, X, Y, 16, 4, 'rgba(10,12,20,.45)'); R(c, X, Y + 4, 16, 1, 'rgba(10,12,20,.2)'); }
    } else if (ch === 'X') {
      const below = at(x, y + 1);
      if (below !== 'X' && y + 1 < h) {
        gradV(c, X, Y, 16, 16, ['#3a4250', '#434c5c', '#4c5666', '#3e4656']);
        R(c, X, Y + 13, 16, 3, '#2a303a'); R(c, X, Y + 13, 16, 1, '#5c6676');
        if ((x * 5 + y) % 3 === 0) { R(c, X + 5, Y, 3, 13, '#6c7684'); R(c, X + 5, Y, 1, 13, '#9ca6b4'); R(c, X + 7, Y, 1, 13, '#3c424c'); R(c, X + 4, Y + 6, 5, 2, '#3c424c'); }
        else if ((x * 5 + y) % 3 === 1) { R(c, X + 3, Y + 3, 10, 7, '#1c2028'); R(c, X + 4, Y + 4, 8, 5, '#2c3440'); P(c, X + 5, Y + 5, '#58e890'); P(c, X + 7, Y + 5, '#f8c838'); R(c, X + 4, Y + 7, 6, 1, '#3c4a58'); }
        else { R(c, X, Y + 5, 16, 3, '#6c7684'); R(c, X, Y + 5, 16, 1, '#9ca6b4'); R(c, X, Y + 7, 16, 1, '#3c424c'); }
        R(c, X, Y, 16, 1, '#2a303a');
      } else {
        for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) P(c, X + i, Y + j, bay(X + i, Y + j) > .93 ? '#1c2028' : '#121419');
        if (below !== 'X' && y + 1 >= h) R(c, X, Y, 16, 2, '#2a303a');
        const r1 = at(x, y + 1) !== 'X' && y + 1 < h;
        if (!r1 && at(x, y - 1) !== 'X' && y > 0) R(c, X, Y, 16, 2, '#5c6676');
      }
    } else if (ch === 'B') {
      R(c, X, Y + 2, 16, 14, '#14161c'); gradV(c, X + 1, Y + 3, 14, 5, ['#9ca6b4', '#8c96a4']); R(c, X + 1, Y + 3, 14, 1, '#c8d0dc');
      gradV(c, X + 1, Y + 8, 14, 7, ['#5c6674', '#4c5462']); R(c, X + 3, Y + 9, 7, 4, '#1c2430'); R(c, X + 4, Y + 10, 3, 1, '#58c8a0');
      P(c, X + 12, Y + 10, '#f85858'); P(c, X + 12, Y + 12, '#f8c838'); R(c, X + 1, Y + 15, 14, 1, '#2c323c');
      R(c, X, Y + 16, 16, 2, 'rgba(10,12,20,.4)');
    }
  }
  // salida: felpudo con flecha
  for (let x = 0; x < w; x++) if (at(x, h - 1) === '.') { R(c, x * 16 + 1, (h - 1) * 16 + 6, 14, 9, '#2c3036'); for (let i = 0; i < 14; i += 2) R(c, x * 16 + 1 + i, (h - 1) * 16 + 6, 1, 9, '#3c4048'); }
  // cables por el suelo, de los generadores a la turbina
  const cab = (pts) => { for (let k = 1; k < pts.length; k++) { const [x0, y0] = pts[k - 1], [x1, y1] = pts[k], n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)); for (let i = 0; i <= n; i++) { const x = Math.round(x0 + (x1 - x0) * i / n), y = Math.round(y0 + (y1 - y0) * i / n); R(c, x, y, 2, 2, '#1a1c22'); P(c, x, y, '#3c424c'); } } };
  if (M.def.cables) {   cab([[56, 120], [76, 120], [76, 96], [96, 70]]); cab([[184, 120], [164, 120], [140, 96], [128, 70]]); cab([[56, 200], [56, 156], [96, 150], [104, 70]]); }
  for (const o of M.def.objects || []) OBJ[o.k](c, f, o.x * 16, o.y * 16, o, M);
}
// oscuridad con agujeros de luz (la Central sin corriente)
let DK = null;
function drawDark(cx, cy) {
  const mina = world.M.def.dark === 'mina', on = mina ? 1 : [0, 1, 2].filter(i => G.flags['gen' + i]).length;
  if (!DK) DK = mk(W, H); const [cv, x] = DK;
  x.globalCompositeOperation = 'source-over'; x.clearRect(0, 0, W, H); x.fillStyle = `rgba(6,8,22,${[.93, .82, .68, .52][on]})`; x.fillRect(0, 0, W, H);
  x.globalCompositeOperation = 'destination-out';
  const hole = (lx, ly, r) => { x.globalAlpha = .4; ell(x, lx, ly, r, Math.round(r * .8), '#000'); x.globalAlpha = .55; ell(x, lx, ly, Math.round(r * .72), Math.round(r * .58), '#000'); x.globalAlpha = 1; ell(x, lx, ly, Math.round(r * .46), Math.round(r * .37), '#000'); };
  const p = world.pl, fl = Math.sin(frame * .13) > .96 ? -2 : 0;
  hole(Math.round(p.px) + 8 - cx, Math.round(p.py) + 6 - cy, (mina ? (G.bag.linterna ? 50 : 40) : 30 + on * 4) + fl);
  if (mina) for (const l of world.M.lights) hole(l.x - cx, l.y - cy, l.r + 4);
  for (const o of world.M.def.objects || []) if (o.k === 'gen' && G.flags['gen' + o.n]) hole(o.x * 16 + 16 - cx, o.y * 16 + 18 - cy, 34 + Math.round(Math.sin(frame * .08 + o.n) * 1.5));
  for (const n of world.npcs) if (n.style && !n.gone && n.lamp) hole(Math.round(n.px) + 8 - cx, Math.round(n.py) + 6 - cy, 18);
  x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1;
  g.drawImage(cv, 0, 0);
  // pilotos que se ven en la oscuridad
  for (const o of world.M.def.objects || []) if (o.k === 'gen') { const lit = G.flags['gen' + o.n]; if (lit || (frame >> 4) & 1) { g.fillStyle = lit ? '#58f890' : '#f84848'; g.fillRect(o.x * 16 + 26 - cx, o.y * 16 + 7 - cy, 2, 2); } }
  if (!mina && (frame >> 5) & 1) for (const [ex, ey] of [[24, 18], [200, 18], [8, 150], [216, 150]]) { g.fillStyle = '#f84848'; g.fillRect(ex - cx, ey - cy, 2, 2); g.globalAlpha = .18; disc(ex - cx + 1, ey - cy + 1, 6, '#f84848'); g.globalAlpha = 1; }
}
// partes que se mueven en la Central
function dynCentral(cx, cy) {
  for (const o of world.M.def.objects || []) {
    if (o.k === 'gen') {
      const X = o.x * 16 - cx, Y = o.y * 16 - cy, lit = G.flags['gen' + o.n] || G.flags.luz, a = lit ? frame * .35 : 0;
      for (let k = 0; k < 3; k++) { const an = a + k * 2.094; for (let r = 1; r <= 4; r++) P(g, Math.round(X + 10 + Math.cos(an) * r), Math.round(Y + 21 + Math.sin(an) * r), lit ? '#9ca6b4' : '#4c5462'); }
      const na = lit ? -2.2 + Math.sin(frame * .05 + o.n) * .25 : -.6; for (let r = 0; r < 3; r++) P(g, Math.round(X + 23 + Math.cos(na) * r), Math.round(Y + 20 + Math.sin(na) * r), '#e84848');
      if (lit && frame % 9 === o.n) part({ w: 1, x: o.x * 16 + 15, y: o.y * 16 - 6, vx: rnd(-.2, .2), vy: rnd(-.6, -.2), life: 10, c: '#f8e070' });
    } else if (o.k === 'turbina') {
      const X = o.x * 16 + 32 - cx, Y = o.y * 16 + 24 - cy, a = G.flags.luz ? frame * .12 : 0;
      for (let k = 0; k < 6; k++) { const an = a + k * 1.047; for (let r = 3; r <= 16; r++) { const col = G.flags.luz ? (r > 13 ? '#f8e070' : '#9ca6b4') : (r > 13 ? '#3c424c' : '#5c6674'); P(g, Math.round(X + Math.cos(an) * r), Math.round(Y + Math.sin(an) * r), col); P(g, Math.round(X + Math.cos(an + .12) * r), Math.round(Y + Math.sin(an + .12) * r), col); } }
      disc(X, Y, 3, G.flags.luz ? '#f8e070' : '#3c424c');
    }
  }
}

// ───────── ciudad: edificios, farolas, fuente, bancos, torre APAGÓN, barreras ─────────
Object.assign(OBJ, {
  edif(c, f, X, Y, o, M) {
    const w = o.w * 16, h = o.h * 16, wall = o.wall || '#d8c8a8', roof = o.roof || '#8c7c6c', rh = 10, d = both(c, f, Y + 6);
    // azotea con pretil
    d(X, Y - 6, w, rh + 6, dark(roof, .2)); R(c, X + 2, Y - 4, w - 4, rh + 2, roof); for (let i = X + 5; i < X + w - 4; i += 9) R(c, i, Y - 2, 4, 3, dark(roof, .15));
    d(X, Y - 6, w, 2, lite(roof, .35)); R(c, X, Y + rh - 2, w, 2, dark(roof, .45));
    if (o.smoke) { M.smoke = M.smoke || []; for (const sx of o.smoke) { d(X + sx - 3, Y - 18, 7, 14, '#4c3c34'); d(X + sx - 4, Y - 19, 9, 2, '#6c5c50'); M.smoke.push({ x: X + sx, y: Y - 20, steam: o.steam }); } }
    if (o.antena) { d(X + w - 12, Y - 22, 1, 18, '#606878'); d(X + w - 16, Y - 18, 9, 1, '#606878'); M.blink.push({ x: X + w - 12, y: Y - 23, c: '#f85858' }); }
    // fachada por plantas
    const fy = Y + rh, fh = h - rh; gradV(c, X, fy, w, fh, [lite(wall, .12), wall, wall, dark(wall, .1)]);
    for (let yy = fy + 3; yy < Y + h - 4; yy += 4) if ((yy >> 2) % 3 === 0) R(c, X, yy, w, 1, dark(wall, .06));
    R(c, X, fy, 1, fh, dark(wall, .5)); R(c, X + w - 1, fy, 1, fh, dark(wall, .5)); R(c, X + w - 3, fy, 2, fh, dark(wall, .14));
    const floors = Math.max(0, Math.floor((fh - 22) / 16));
    for (let fl = 0; fl < floors; fl++) for (let col = 0; col < o.w; col++) {
      const wx = X + col * 16 + 4, wy = fy + 3 + fl * 16; if (wy + 10 > Y + h - 22) continue;
      R(c, wx - 1, wy - 1, 10, 11, dark(wall, .45)); gradV(c, wx, wy, 8, 9, o.dim ? ['#2c3848', '#1c2430', '#141a24'] : ['#c8ecfc', '#90ccf4', '#68acdc']); R(c, wx + 3, wy, 1, 9, dark(wall, .3)); R(c, wx, wy + 4, 8, 1, dark(wall, .3));
      if (!o.dim) { P(c, wx + 1, wy + 1, '#ffffff'); P(c, wx + 2, wy + 2, '#e0f4ff'); } R(c, wx - 1, wy + 9, 10, 1, lite(wall, .4));
      if (!o.dim) M.lights.push({ x: wx + 4, y: wy + 4, r: 8, win: null });
    }
    // planta baja: puerta, escaparates y cartel
    const gy = Y + h - 22; R(c, X, gy - 1, w, 2, dark(wall, .3));
    for (let col = 0; col < o.w; col++) {
      const cx = X + col * 16;
      if (col === o.door) {
        R(c, cx + 2, gy + 3, 12, 19, '#2a2024'); gradV(c, cx + 3, gy + 4, 10, 18, o.dim ? ['#1c1c24', '#14141c'] : ['#a8d8e8', '#68a8c8', '#4888a8']); R(c, cx + 7, gy + 4, 2, 18, '#2a2024'); P(c, cx + 6, gy + 13, '#f8e070'); P(c, cx + 9, gy + 13, '#f8e070');
        R(c, cx, Y + h - 1, 16, 1, '#a8a098'); M.lights.push({ x: cx + 8, y: gy + 10, r: 12 });
      } else {
        R(c, cx + 2, gy + 4, 12, 13, dark(wall, .5)); gradV(c, cx + 3, gy + 5, 10, 11, o.dim ? ['#2c3848', '#1c2430'] : ['#d8f0f8', '#98c8e0', '#78a8c8']); if (!o.dim) { P(c, cx + 4, gy + 6, '#fff'); P(c, cx + 5, gy + 7, '#fff'); }
        R(c, cx + 2, gy + 17, 12, 2, dark(wall, .25));
      }
    }
    if (o.awning) { const [a1, a2] = o.awning; for (let i = 0; i < w; i++) { const col = ((i >> 2) & 1) ? a1 : a2; R(c, X + i, gy, 1, 5, col); P(c, X + i, gy + 5 + ((i >> 1) & 1), col); } R(c, X, gy, w, 1, lite(o.awning[0], .4)); }
    if (o.sign) { const sw = tw_(o.sign) + 8, sx = Math.round(X + w / 2 - sw / 2), sy = gy - (o.awning ? 12 : 11); R(c, sx - 1, sy - 1, sw + 2, 11, '#1c1c24'); R(c, sx, sy, sw, 9, o.signBg || '#2c3c50'); R(c, sx, sy, sw, 1, lite(o.signBg || '#2c3c50', .3)); txt(o.sign, sx + 4, sy + 1, o.signC || '#f8e070', c); }
    R(c, X, Y + h - 3, w, 3, '#a8a098'); R(c, X, Y + h - 3, w, 1, '#c8c0b4');
  },
  farola(c, f, X, Y, o, M) {
    const d = both(c, f, Y + 4);
    d(X + 7, Y - 20, 2, 34, '#3c4250'); d(X + 7, Y - 20, 1, 34, '#6c7684'); d(X + 5, Y + 12, 6, 3, '#2c323c');
    d(X + 4, Y - 24, 8, 5, '#2c323c'); d(X + 5, Y - 23, 6, 3, '#fff4c0'); d(X + 5, Y - 23, 6, 1, '#ffffff'); d(X + 3, Y - 25, 10, 1, '#4c5462');
    M.lights.push({ x: X + 8, y: Y - 20, r: 18, c: '#f8d878' });
  },
  fuente(c, f, X, Y, o, M) {
    const cx = X + 24, cy = Y + 18;
    ell(c, cx + 2, cy + 6, 24, 9, 'rgba(30,40,60,.25)'); ell(c, cx, cy + 3, 23, 9, '#8c867c'); ell(c, cx, cy + 1, 23, 9, '#d8d0c0'); ell(c, cx, cy + 1, 19, 7, '#5aa8f0'); ell(c, cx, cy + 2, 15, 5, '#4c98e8');
    R(c, cx - 3, cy - 14, 6, 15, '#c4bcac'); R(c, cx - 3, cy - 14, 2, 15, '#e4ded0'); ell(c, cx, cy - 14, 7, 3, '#d8d0c0'); ell(c, cx, cy - 14, 5, 2, '#5aa8f0');
    M.smoke = M.smoke || []; M.fountain = M.fountain || []; M.fountain.push({ x: cx, y: cy - 16 });
  },
  banco(c, f, X, Y, o, M) {
    R(c, X + 1, Y + 6, 30, 3, '#8a5c34'); R(c, X + 1, Y + 6, 30, 1, '#b07c4c'); R(c, X + 1, Y + 10, 30, 3, '#8a5c34'); R(c, X + 1, Y + 10, 30, 1, '#b07c4c');
    for (const lx of [3, 27]) R(c, X + lx, Y + 6, 2, 10, '#3c4250'); R(c, X + 2, Y + 15, 30, 2, 'rgba(30,40,60,.25)');
  },
  torreApagon(c, f, X, Y, o, M) {
    const w = o.w * 16, h = o.h * 16, d = both(c, f, Y + 8);
    // torre negra con franjas amarillas y una antena que parpadea
    d(X + 6, Y - 40, w - 12, 48, '#1c1828'); for (let yy = Y - 38; yy < Y + 8; yy += 6) { d(X + 8, yy, w - 16, 3, '#2a2438'); for (let xx = X + 10; xx < X + w - 10; xx += 7) d(xx, yy, 3, 2, (yy >> 3) % 3 === 0 ? '#f8d030' : '#3c3450'); }
    d(X + w / 2 - 1, Y - 62, 2, 22, '#606878'); d(X + w / 2 - 6, Y - 52, 12, 1, '#606878'); M.blink.push({ x: X + w / 2 - 1, y: Y - 64, c: '#f8d030', w: 2, h: 2 });
    gradV(c, X, Y + 8, w, h - 8, ['#2a2438', '#1c1828', '#141020']);
    for (let i = 0; i < w; i++) { const yel = ((i + 0) >> 2) & 1; R(c, X + i, Y + 8, 1, 4, yel ? '#f8d030' : '#1c1c24'); R(c, X + i, Y + h - 6, 1, 3, yel ? '#f8d030' : '#1c1c24'); }
    for (let fl = 0; fl < Math.floor((h - 34) / 14); fl++) for (let col = 0; col < o.w; col++) { const wx = X + col * 16 + 4, wy = Y + 16 + fl * 14; R(c, wx, wy, 8, 8, '#0c0a14'); if ((col + fl) % 3 === 1) { R(c, wx + 1, wy + 1, 6, 6, '#f8d030'); M.lights.push({ x: wx + 4, y: wy + 4, r: 7, c: '#f8d030' }); } else R(c, wx + 1, wy + 1, 6, 6, '#241c34'); }
    const dx = X + o.door * 16; R(c, dx, Y + h - 22, 16, 19, '#0c0a14'); R(c, dx + 1, Y + h - 21, 14, 17, '#3c3450'); R(c, dx + 7, Y + h - 21, 1, 17, '#0c0a14'); R(c, dx + 3, Y + h - 14, 3, 2, '#f8d030');
    const sw = tw_('APAGÓN') + 8, sx = Math.round(X + w / 2 - sw / 2); R(c, sx, Y + h - 34, sw, 10, '#f8d030'); txt('APAGÓN', sx + 4, Y + h - 32, '#1c1828', c);
  },
  estacion(c, f, X, Y, o, M) {
    OBJ.edif(c, f, X, Y, Object.assign({ wall: '#e8d0a8', roof: '#a85438', sign: 'ESTACIÓN', signBg: '#5a2a20' }, o), M);
    const cx = X + o.w * 8; for (let dy = -6; dy <= 6; dy++) for (let dx = -6; dx <= 6; dx++) { const dd = Math.hypot(dx, dy); if (dd < 6.5) P(c, cx + dx, Y + 1 + dy, dd > 5.3 ? '#3c2a20' : '#f8f4e8'); } R(c, cx, Y - 3, 1, 5, '#3c2a20'); R(c, cx, Y + 1, 4, 1, '#3c2a20');
  },
  barrera() { }, // se dibuja en vivo (puede desaparecer)
  arbusto(c, f, X, Y) { for (let dy = -6; dy <= 6; dy++) for (let dx = -7; dx <= 7; dx++) { const d = Math.hypot(dx / 7, dy / 6); if (d < 1) P(c, X + 8 + dx, Y + 9 + dy, d > .85 ? PAL.tk : dx + dy < -4 ? PAL.th : dx + dy > 3 ? PAL.t2 : PAL.t0); } },
});
// barreras que dependen de la historia: valla de obra o cerca eléctrica
const barreraOn = o => o.k === 'barrera' && (o.until ? !G.flags[o.until] : true) && (o.from ? G.flags[o.from] : true);
function drawBarreras(cx, cy) {
  for (const o of world.M.def.objects || []) if (barreraOn(o)) for (let i = 0; i < o.w; i++) for (let j = 0; j < o.h; j++) {
    const X = (o.x + i) * 16 - cx, Y = (o.y + j) * 16 - cy;
    if (o.kind === 'seto') {
      g.fillStyle = PAL.tk; g.fillRect(X, Y + 2, 16, 14); for (let k = 0; k < 6; k++) { const bx = X + 1 + (k % 3) * 5, by = Y + 2 + (k >> 1 & 1) * 6; g.fillStyle = PAL.t1; g.fillRect(bx, by, 5, 6); g.fillStyle = PAL.t0; g.fillRect(bx + 1, by, 3, 2); }
      g.fillStyle = PAL.t2; g.fillRect(X, Y + 13, 16, 3); if ((i + j) % 2 === 0) { g.fillStyle = '#f890b0'; g.fillRect(X + 6, Y + 5, 2, 2); }
    } else if (o.kind === 'bomba') {
      if (i || j) continue; const bx = X, by = Y, pump = Math.sin(frame * .15) * 2;
      g.fillStyle = 'rgba(20,40,30,.3)'; g.fillRect(bx + 2, by + 28, 30, 4);
      g.fillStyle = '#1c1828'; g.fillRect(bx + 2, by + 6, 28, 24); g.fillStyle = '#2a2438'; g.fillRect(bx + 3, by + 7, 26, 22); for (let k = 0; k < 26; k += 4) { g.fillStyle = '#f8d030'; g.fillRect(bx + 3 + k, by + 26, 2, 3); }
      g.fillStyle = '#3c3450'; g.fillRect(bx + 10, by - 6 + pump, 12, 14); g.fillStyle = '#f8d030'; g.fillRect(bx + 12, by - 2 + pump, 8, 2);
      g.fillStyle = '#58e890'; g.fillRect(bx + 6, by + 12, 6, 8); g.fillStyle = (frame >> 3) & 1 ? '#a8ffc8' : '#58e890'; g.fillRect(bx + 7, by + 13 + ((frame >> 2) % 6), 4, 2);
      g.fillStyle = '#3c3450'; for (const [tx, ty] of [[-8, 18], [34, 14], [16, 32]]) { g.fillRect(bx + 16 + Math.sign(tx - 16) * 2, by + 18, tx - 16 + (tx < 16 ? 0 : 0), 2); }
      if (frame % 9 === 0) part({ w: 1, x: bx + cx + 9, y: by + cy + 10, vx: rnd(-.2, .2), vy: -.5, life: 20, c: '#58e890' });
    } else if (o.kind === 'electrica') {
      g.fillStyle = '#3c4250'; g.fillRect(X + 1, Y + 1, 2, 15); g.fillRect(X + 13, Y + 1, 2, 15); g.fillStyle = '#8c96a4'; g.fillRect(X + 1, Y + 1, 1, 15); g.fillRect(X + 13, Y + 1, 1, 15);
      for (let k = 0; k < 3; k++) { const yy = Y + 4 + k * 4; g.fillStyle = (frame + k * 5 + i * 3) % 12 < 6 ? '#f8f080' : '#f8c030'; for (let x = X + 3; x < X + 13; x++) g.fillRect(x, yy + (((x + frame) >> 1) % 3 === 0 ? -1 : 0), 1, 1); }
      if ((frame + i * 7) % 40 === 0) part({ w: 1, x: X + cx + 8, y: Y + cy + 8, vx: rnd(-.6, .6), vy: rnd(-.8, 0), life: 10, c: '#fff8a0' });
    } else {
      g.fillStyle = '#5a5a64'; g.fillRect(X + 2, Y + 6, 2, 10); g.fillRect(X + 12, Y + 6, 2, 10);
      g.fillStyle = INK; g.fillRect(X, Y + 3, 16, 8); for (let k = 0; k < 14; k++) { g.fillStyle = ((k >> 1) % 2) ? '#f8d030' : '#e84838'; g.fillRect(X + 1 + k, Y + 4, 1, 6); }
      if (((frame >> 4) + i) & 1) { g.fillStyle = '#f8a030'; g.fillRect(X + 7, Y, 2, 2); }
    }
  }
  for (const s of world.M.fountain || []) { for (let k = 0; k < 3; k++) { const t = ((frame + k * 7) % 21) / 21, x = s.x - cx + (k - 1) * t * 9, y = s.y - cy - Math.sin(t * Math.PI) * 9 + t * 12; g.fillStyle = '#d8f0ff'; g.fillRect(Math.round(x), Math.round(y), 1, 2); } }
}
// ── interiores: casas, ferretería, estación ──
const ROOMS = {
  oficina: { wall: '#4c4060', wall2: '#3c3450', floor: ['#5c4c70', '#544468'], trim: '#f8d030' },
  casa: { wall: '#f0e0b8', wall2: '#d8c49c', floor: ['#c8946a', '#b8845c'], trim: '#8a5c34' },
  ferreteria: { wall: '#d8e4dc', wall2: '#b4c8bc', floor: ['#b8b0a0', '#a8a090'], trim: '#4c5c58' },
  estacion: { wall: '#e8d8b8', wall2: '#c8b48c', floor: ['#d8d0c0', '#c4bcac'], trim: '#5a2a20' },
};
function paintRoom(c, f, M) {
  const { w, h, at } = M, th = ROOMS[M.def.room] || ROOMS.casa, r = rng(w * 7 + h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const ch = at(x, y), X = x * 16, Y = y * 16;
    if (ch === 'X') {
      if (y + 1 < h && at(x, y + 1) !== 'X') { gradV(c, X, Y, 16, 16, [th.wall, th.wall, th.wall2]); for (let i = 0; i < 16; i += 4) R(c, X + i, Y, 1, 12, th.wall2); R(c, X, Y + 12, 16, 4, th.trim); R(c, X, Y + 12, 16, 1, lite(th.trim, .3)); }
      else { R(c, X, Y, 16, 16, '#2a2028'); }
      continue;
    }
    for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) { const gx = X + i, gy = Y + j, plank = ((gy >> 2) + (gx >> 4)) & 1; P(c, gx, gy, (gy & 3) === 0 ? dark(th.floor[1], .2) : th.floor[plank]); }
    if (at(x, y - 1) === 'X') R(c, X, Y, 16, 3, 'rgba(20,10,10,.3)');
    if (ch === 'r') { R(c, X, Y + 1, 16, 14, '#a83c38'); R(c, X, Y + 3, 16, 1, '#f8d030'); R(c, X, Y + 12, 16, 1, '#f8d030'); for (let i = 2; i < 16; i += 4) P(c, X + i, Y + 7, '#f8d030'); }
    if (ch === 'C') { R(c, X, Y + 2, 16, 14, '#3c2418'); R(c, X, Y + 3, 16, 5, '#c89060'); R(c, X, Y + 3, 16, 1, '#f0c890'); R(c, X, Y + 8, 16, 8, '#8a5c34'); R(c, X, Y + 8, 16, 1, '#5a3a20'); }
    if (ch === 'S') { R(c, X + 1, Y - 6, 14, 20, '#3c2418'); R(c, X + 2, Y - 5, 12, 18, '#6a4428'); for (let k = 0; k < 3; k++) { R(c, X + 2, Y - 5 + k * 6 + 5, 12, 1, '#a87850'); for (let q = 0; q < 4; q++) R(c, X + 3 + q * 3, Y - 5 + k * 6 + 1, 2, 4, ['#e86048', '#58b8b0', '#f8c838', '#a8b0bc', '#78c850'][Math.floor(r() * 5)]); } }
    if (ch === 'T') { R(c, X + 1, Y + 3, 14, 11, '#5a3a20'); R(c, X + 2, Y + 3, 12, 8, '#c89060'); R(c, X + 2, Y + 3, 12, 1, '#f0c890'); R(c, X + 3, Y + 11, 2, 4, '#5a3a20'); R(c, X + 11, Y + 11, 2, 4, '#5a3a20'); }
    if (ch === 'b') { R(c, X + 1, Y + 1, 14, 15, '#3c2418'); R(c, X + 2, Y + 2, 12, 5, '#f8f8f0'); R(c, X + 2, Y + 7, 12, 8, '#5878c8'); R(c, X + 2, Y + 7, 12, 1, '#a8c0f8'); }
    if (ch === 'p') { R(c, X + 4, Y + 9, 8, 6, '#b85838'); R(c, X + 4, Y + 9, 8, 1, '#d87858'); for (const [dx, dy] of [[0, -6], [-3, -3], [3, -3], [-1, -9], [2, -7]]) { R(c, X + 7 + dx, Y + 8 + dy, 3, 4, PAL.t1); P(c, X + 7 + dx, Y + 8 + dy, PAL.t0); } }
    if (ch === 'k') { R(c, X, Y - 4, 16, 18, '#e8ecf0'); R(c, X, Y - 4, 16, 1, '#ffffff'); R(c, X + 2, Y + 2, 5, 3, '#2c323c'); R(c, X + 9, Y + 2, 5, 3, '#2c323c'); R(c, X, Y + 8, 16, 6, '#c8ccd4'); R(c, X + 7, Y + 9, 2, 2, '#808890'); }
    if (ch === 'K') { R(c, X + 2, Y - 2, 12, 16, '#2c2c34'); R(c, X + 3, Y - 1, 10, 7, '#58a8c8'); R(c, X + 3, Y + 8, 10, 4, '#808890'); P(c, X + 4, Y, '#ffffff'); }
  }
  for (let x = 0; x < w; x++) if (at(x, h - 1) === '.' || at(x, h - 1) === 'r') { R(c, x * 16 + 2, (h - 1) * 16 + 8, 12, 7, '#7c3c30'); R(c, x * 16 + 3, (h - 1) * 16 + 9, 10, 5, '#a85848'); }
  for (const o of M.def.objects || []) OBJ[o.k](c, f, o.x * 16, o.y * 16, o, M);
}

// Centrales de los líderes: la misma sala industrial, con el color de su tipo
function paintGym(c, f, M) {
  paintCentral(c, f, M); const ty = TYPES[M.def.type], { w, h, at } = M;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const ch = at(x, y), X = x * 16, Y = y * 16;
    if (ch === '.' && (x === Math.floor(w / 2) - 1 || x === Math.floor(w / 2))) { R(c, X + (x === Math.floor(w / 2) - 1 ? 14 : 0), Y, 2, 16, ty.d); P(c, X + (x === Math.floor(w / 2) - 1 ? 14 : 0), Y + 8, ty.c); }
    if (ch === 'X' && y + 1 < h && at(x, y + 1) !== 'X' && (x + y) % 2 === 0) { R(c, X + 3, Y + 2, 10, 8, '#1c2028'); R(c, X + 4, Y + 3, 8, 6, dark(ty.c, .3)); R(c, X + 4, Y + 3, 8, 1, ty.c); M.blink.push({ x: X + 6, y: Y + 6, c: ty.c, w: 4, h: 1, slow: 1 }); }
  }
  // emblema del tipo delante del líder
  const ex = Math.floor(w / 2) * 16, ey = 3 * 16 + 14; for (let dy = -9; dy <= 9; dy++) for (let dx = -14; dx <= 14; dx++) { const d = Math.hypot(dx / 14, dy / 9); if (d < 1) P(c, ex + dx, ey + dy, d > .85 ? ty.d : d > .7 ? ty.c : (Math.abs(dx) + Math.abs(dy)) % 6 < 2 ? lite(ty.c, .3) : dark(ty.c, .15)); }
}
Object.assign(OBJ, {
  barco(c, f, X, Y, o, M) {
    const w = o.w * 16, h = o.h * 16, d = both(c, f, Y + 10);
    // casco negro con franja amarilla, sobre el agua
    for (let j = 0; j < h - 10; j++) { const inset = Math.max(0, j - (h - 22)) * 1.4, y = Y + 10 + j; R(c, X + inset, y, w - inset * 2 - (j < 4 ? 0 : 0), 1, j < 3 ? '#3c3450' : j < 6 ? '#f8d030' : j > h - 16 ? '#141020' : '#1c1828'); }
    R(c, X + 4, Y + 22, w - 8, 1, '#2a2438'); for (let x = X + 10; x < X + w - 10; x += 12) { R(c, x, Y + 26, 5, 5, '#0c0a14'); R(c, x + 1, Y + 27, 3, 3, (x >> 4) & 1 ? '#f8d030' : '#3c3450'); }
    ell(c, X + w / 2, Y + h + 1, w / 2, 3, 'rgba(10,20,50,.35)');
    // cubierta, puente y chimenea
    d(X + 2, Y + 4, w - 4, 7, '#7c6c5c'); for (let x = X + 3; x < X + w - 3; x += 6) d(x, Y + 5, 1, 5, '#5c4c3c'); d(X + 2, Y + 4, w - 4, 1, '#a8987c');
    d(X + w - 50, Y - 22, 34, 27, '#e8e4dc'); d(X + w - 50, Y - 22, 34, 3, '#3c3450'); for (let x = X + w - 46; x < X + w - 20; x += 7) d(x, Y - 14, 5, 5, '#2c3848');
    d(X + w - 40, Y - 40, 12, 18, '#1c1828'); d(X + w - 40, Y - 34, 12, 4, '#f8d030'); d(X + w - 41, Y - 42, 14, 3, '#2a2438');
    d(X + 20, Y - 30, 2, 34, '#5c4c3c'); d(X + 12, Y - 26, 18, 1, '#5c4c3c'); M.blink.push({ x: X + 20, y: Y - 32, c: '#f84848', w: 2, h: 2 });
    const sw = tw_('EL APAGADO') + 6; R(c, X + 14, Y + 13, sw, 8, '#0c0a14'); txt('EL APAGADO', X + 17, Y + 13, '#f8d030', c);
    // carga: jaulas con anclas
    for (let k = 0; k < 3; k++) { const cx = X + 30 + k * 14; d(cx, Y - 4, 11, 9, '#3c3450'); for (let q = 1; q < 11; q += 3) d(cx + q, Y - 4, 1, 9, '#8890a0'); d(cx + 4, Y - 2, 3, 5, '#c88458'); }
    M.smoke = M.smoke || []; M.smoke.push({ x: X + w - 34, y: Y - 42 });
  },
  faro(c, f, X, Y, o, M) {
    const d = both(c, f, Y + 6);
    for (let j = 0; j < 52; j++) { const y = Y + 14 - j, wd = 10 - Math.floor(j / 13), col = (Math.floor(j / 8) & 1) ? '#e84838' : '#f8f4ec'; d(X + 8 - wd / 2, y, wd, 1, col); d(X + 8 - wd / 2, y, 1, 1, dark(col, .3)); }
    d(X + 3, Y - 44, 10, 8, '#2c3848'); d(X + 4, Y - 43, 8, 6, '#fff4c0'); d(X + 2, Y - 47, 12, 3, '#e84838'); d(X + 7, Y - 50, 2, 3, '#3c3c48');
    M.lights.push({ x: X + 8, y: Y - 40, r: 26, c: '#fff4c0' });
  },
});
Object.assign(OBJ, {
  invernadero(c, f, X, Y, o, M) {
    const w = o.w * 16, h = o.h * 16, d = both(c, f, Y + 4), rh = 26;
    // tejado de cristal a dos aguas
    for (let j = 0; j < rh; j++) { const inset = Math.round((rh - j) * .9); for (let i = inset; i < w - inset; i++) { const frame = (i - inset) % 12 === 0 || j === rh - 1; P(c, X + i, Y + j, frame ? '#e8f0e8' : j < 4 ? '#c8ecd8' : ((i + j) % 9 === 0 ? '#f0fff8' : '#9cd8c0')); if (Y + j < Y + 4) P(f, X + i, Y + j, frame ? '#e8f0e8' : '#c8ecd8'); } }
    d(X + w / 2 - 1, Y - 6, 2, 8, '#e8f0e8'); M.blink.push({ x: X + w / 2 - 1, y: Y - 7, c: '#58e890', w: 2, h: 1, slow: 1 });
    // paredes de cristal con plantas dentro
    const wy = Y + rh; for (let j = 0; j < h - rh; j++) for (let i = 0; i < w; i++) { const frame = i % 16 === 0 || i === w - 1 || j === 0 || j === h - rh - 1 || j === 12; P(c, X + i, wy + j, frame ? '#f4f8f4' : '#a8e0cc'); }
    for (let k = 0; k < o.w * 2; k++) { const px = X + 3 + k * 8, ph = 6 + ((k * 7) % 9); for (let q = 0; q < ph; q++) { P(c, px + Math.round(Math.sin(q * .6 + k) * 1.5), wy + h - rh - 3 - q, q > ph - 3 ? PAL.t0 : PAL.t1); } P(c, px, wy + h - rh - 3 - ph, (k % 3) ? '#f890b0' : '#f8e060'); }
    for (let i = 0; i < w; i += 4) P(c, X + i + 1, wy + 3, '#ffffff');
    const dx = X + o.door * 16; R(c, dx + 1, Y + h - 20, 14, 20, '#e8f0e8'); R(c, dx + 2, Y + h - 19, 12, 19, '#78c8a8'); R(c, dx + 7, Y + h - 19, 1, 19, '#e8f0e8'); P(c, dx + 6, Y + h - 10, '#f8e070');
    const sw = tw_('INVERNADERO') + 8, sx = Math.round(X + w / 2 - sw / 2); R(c, sx, wy - 6, sw, 10, '#2f8244'); R(c, sx, wy - 6, sw, 1, '#78c850'); txt('INVERNADERO', sx + 4, wy - 5, '#fffbd6', c);
    R(c, X, Y + h, w, 2, 'rgba(30,60,40,.3)');
  },
});

Object.assign(OBJ, {
  ascensor(c, f, X, Y, o, M) {
    R(c, X, Y, 16, 16, '#2a2438'); R(c, X + 1, Y + 3, 14, 13, '#8890a0'); R(c, X + 7, Y + 3, 2, 13, '#3c4250'); R(c, X + 1, Y + 3, 14, 1, '#c8d0dc');
    R(c, X + 4, Y, 8, 3, '#0c0a14'); txt(o.up ? '▲' : '▼', X + 6, Y - 1, '#f8d030', c);
  },
});
// ── cuevas y minas ──
function paintCave(c, f, M) {
  const { w, h, at } = M, r = rng(w * 13 + h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const ch = at(x, y), X = x * 16, Y = y * 16;
    if (ch === 'X') {
      const face = y + 1 < h && at(x, y + 1) !== 'X';
      for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) { const gx = X + i, gy = Y + j, n = vnoise(gx / 6, gy / 5, 11) * .8 + vnoise(gx / 2.5, gy / 2.5, 12) * .2;
        P(c, gx, gy, face ? (j > 12 ? '#2a2018' : n > .62 ? '#8c7460' : n > .42 ? '#6c5848' : '#4c3c30') : (n > .7 ? '#3a2e26' : '#241c18')); }
      if (face) { R(c, X, Y + 14, 16, 2, '#1a1410'); if (r() < .25) { const ox = 3 + Math.floor(r() * 9), oy = 3 + Math.floor(r() * 7); R(c, ox + X, oy + Y, 3, 2, '#9890d0'); P(c, ox + X, oy + Y, '#e0d8ff'); M.blink.push({ x: X + ox + 1, y: Y + oy, c: '#e0d8ff', slow: 1 }); } }
      continue;
    }
    for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) { const gx = X + i, gy = Y + j, n = vnoise(gx / 8, gy / 8, 13) + (bay(gx, gy) - .5) * .2; P(c, gx, gy, n > .66 ? '#8c7864' : n < .3 ? '#5c4c3c' : '#74624e'); }
    if (r() < .2) { const sx = 2 + Math.floor(r() * 11), sy = 2 + Math.floor(r() * 11); R(c, X + sx, Y + sy, 2, 2, '#4c3c30'); P(c, X + sx, Y + sy, '#a89078'); }
    if (at(x, y - 1) === 'X') R(c, X, Y, 16, 3, 'rgba(10,6,4,.4)');
    if (ch === 'r') { for (const ry of [4, 11]) R(c, X, Y + ry, 16, 1, '#a8a8b0'); for (let i = 1; i < 16; i += 5) R(c, X + i, Y + 3, 2, 10, '#5a3a24'); for (const ry of [4, 11]) R(c, X, Y + ry, 16, 1, '#c8c8d0'); }
    if (ch === 'v') { for (let i = 1; i < 16; i += 5) R(c, X + 3, Y + i, 10, 2, '#5a3a24'); for (const rx of [4, 11]) R(c, X + rx, Y, 1, 16, '#c8c8d0'); }
    if (ch === 'o') { for (let dy = -6; dy <= 5; dy++) for (let dx = -6; dx <= 6; dx++) { const d = Math.hypot(dx / 6.5, dy / 6); if (d < 1) P(c, X + 8 + dx, Y + 9 + dy, d > .8 ? '#2a2018' : dx + dy < -3 ? '#a89078' : '#7c6650'); } R(c, X + 5, Y + 7, 3, 2, '#9890d0'); R(c, X + 9, Y + 10, 2, 2, '#b8b0f0'); M.blink.push({ x: X + 6, y: Y + 7, c: '#f0e8ff', slow: 1 }); }
    if (ch === 'B') { R(c, X + 1, Y + 4, 14, 11, '#3c2418'); R(c, X + 2, Y + 5, 12, 6, '#8c6c4c'); R(c, X + 2, Y + 5, 12, 1, '#b08860'); for (const wx of [4, 11]) { R(c, X + wx - 2, Y + 12, 4, 4, '#2c2c34'); P(c, X + wx - 1, Y + 13, '#808090'); } R(c, X + 4, Y + 3, 8, 3, '#9890d0'); }
  }
  for (const o of M.def.objects || []) OBJ[o.k](c, f, o.x * 16, o.y * 16, o, M);
}
Object.assign(OBJ, {
  lampara(c, f, X, Y, o, M) { R(c, X + 7, Y + 2, 2, 5, '#3c3028'); R(c, X + 5, Y + 6, 6, 5, '#2c2c34'); R(c, X + 6, Y + 7, 4, 3, '#f8d878'); M.lights.push({ x: X + 8, y: Y + 8, r: 20, c: '#f8d878' }); },
  bocamina(c, f, X, Y, o, M) {
    const w = o.w * 16, h = o.h * 16;
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const d = Math.hypot((i - w / 2) / (w / 2), (j - h) / h); if (d < 1) P(c, X + i, Y + j, d > .82 ? '#5a3a24' : d > .74 ? '#8a5c34' : j > h * .5 ? '#0c0806' : '#140e0a'); }
    R(c, X + 2, Y + h - 6, w - 4, 1, '#a8a8b0'); R(c, X + 2, Y + h - 2, w - 4, 1, '#a8a8b0');
    const sw = tw_('MINA IMANTA') + 8, sx = Math.round(X + w / 2 - sw / 2); R(c, sx, Y - 4, sw, 10, '#5a3a24'); R(c, sx, Y - 4, sw, 1, '#a87850'); txt('MINA IMANTA', sx + 4, Y - 3, '#f8e070', c);
    M.lights.push({ x: X + 6, y: Y + 8, r: 12, c: '#f8d878' }, { x: X + w - 6, y: Y + 8, r: 12, c: '#f8d878' });
  },
});

Object.assign(OBJ, { vapor(c, f, X, Y, o, M) { M.smoke = M.smoke || []; M.smoke.push({ x: X + 8, y: Y + 8, steam: 1 }); } });
// ───────── el final: la Gran Fábrica, la Gran Pila y el Rayo Madre ─────────
Object.assign(OBJ, {
  granFabrica(c, f, X, Y, o, M) {
    const w = o.w * 16, h = o.h * 16, d = both(c, f, Y + 4), gate = X + o.door * 16;
    // torre central con pararrayos
    d(X + w / 2 - 14, Y - 70, 28, 80, '#5a2a20'); for (let yy = Y - 68; yy < Y + 8; yy += 4) for (let xx = X + w / 2 - 13; xx < X + w / 2 + 14; xx++) if (((xx + (yy >> 2) * 3) & 7) === 0) bothP(c, f, Y + 4)(xx, yy, '#3c1c14');
    d(X + w / 2 - 16, Y - 72, 32, 4, '#3c1c14'); d(X + w / 2 - 1, Y - 100, 2, 30, '#a8b0bc'); d(X + w / 2 - 6, Y - 92, 12, 1, '#a8b0bc');
    for (let k = 0; k < 4; k++) { const wy = Y - 60 + k * 16; d(X + w / 2 - 6, wy, 12, 8, '#140a08'); d(X + w / 2 - 5, wy + 1, 10, 6, '#f8d878'); M.lights.push({ x: X + w / 2, y: wy + 4, r: 10, c: '#f8d878' }); }
    // chimeneas
    for (const cx of [X + 22, X + 46, X + w - 50, X + w - 26]) { d(cx, Y - 40, 10, 48, '#6c3424'); d(cx - 1, Y - 42, 12, 3, '#8c4430'); M.smoke = M.smoke || []; M.smoke.push({ x: cx + 5, y: Y - 44 }); }
    // naves en diente de sierra
    for (let k = 0; k < Math.floor(w / 32); k++) { const tx = X + k * 32; gradV(c, tx, Y + 2, 32, 22, ['#7c7068', '#5c524c', '#4a423e']); R(c, tx + 23, Y + 2, 9, 22, '#2a2420'); for (let yy = Y + 5; yy < Y + 24; yy += 5) R(c, tx + 24, yy, 8, 1, '#f8d878'); R(c, tx, Y + 2, 32, 1, '#a89888'); }
    // fachada de ladrillo
    for (let yy = Y + 24; yy < Y + h; yy++) for (let xx = X; xx < X + w; xx++) { const row = (yy - Y) >> 2, joint = ((yy - Y) & 3) === 3 || ((xx - X + (row & 1) * 4) & 7) === 0; P(c, xx, yy, joint ? '#5a2418' : vnoise(xx / 11, yy / 11, 31) > .7 ? '#8c3c28' : '#a84c34'); }
    for (let col = 0; col < o.w; col++) { if (Math.abs(col - o.door - .5) < 2) continue; const vx = X + col * 16 + 3, vy = Y + 34; R(c, vx - 1, vy - 1, 12, 20, '#3c1c14'); gradV(c, vx, vy, 10, 18, ['#f8e8a8', '#f8c860', '#e8a040']); R(c, vx + 4, vy, 1, 18, '#3c1c14'); R(c, vx, vy + 8, 10, 1, '#3c1c14'); M.lights.push({ x: vx + 5, y: vy + 9, r: 10, c: '#f8c860' }); }
    // el portón con las seis ranuras
    R(c, gate - 8, Y + h - 40, 48, 40, '#2a1410'); R(c, gate - 6, Y + h - 38, 44, 38, '#4c4c58'); R(c, gate + 15, Y + h - 38, 2, 38, '#2a2a34');
    for (let yy = Y + h - 34; yy < Y + h; yy += 6) R(c, gate - 6, yy, 44, 1, '#6c6c78');
    FUSIBLES.forEach(([t], i) => { const sx = gate - 4 + i * 7, sy = Y + h - 48; R(c, sx, sy, 6, 8, '#1c1c24'); R(c, sx + 1, sy + 1, 4, 6, TYPES[t].c); });
    const sw = tw_('GRAN FÁBRICA MAKINA') + 10, sx = Math.round(X + w / 2 - sw / 2); R(c, sx, Y + 25, sw, 11, '#1c1010'); R(c, sx + 1, Y + 26, sw - 2, 9, '#5a2010'); txt('GRAN FÁBRICA MAKINA', sx + 5, Y + 27, '#f8e070', c);
    M.rod = { x: X + w / 2, y: Y - 100 };
  },
  granPila(c, f, X, Y, o, M) { },
});
// la Gran Pila (se vacía cuando cae) y el Rayo Madre en la Cámara
function dynCamara(cx, cy) {
  const M = world.M, o = M.def.objects.find(q => q.k === 'granPila'); if (!o) return;
  const X = o.x * 16 - cx, Y = o.y * 16 - cy, broken = G.flags.pilaRota, lv = broken ? 0 : .35 + .5 * ((Math.sin(frame * .02) + 1) / 2);
  g.fillStyle = '#1c1828'; g.fillRect(X + 4, Y + 2, 40, 44); g.fillStyle = '#2a2438'; g.fillRect(X + 6, Y + 4, 36, 40);
  g.fillStyle = '#f8d030'; g.fillRect(X + 4, Y + 2, 40, 4); g.fillStyle = '#a8b0bc'; g.fillRect(X + 18, Y - 4, 12, 6);
  const fh = Math.round(34 * lv); g.fillStyle = broken ? '#3c3450' : '#f8e070'; g.fillRect(X + 10, Y + 42 - fh, 28, fh); if (!broken) { g.fillStyle = '#fff8c0'; g.fillRect(X + 10, Y + 42 - fh, 28, 1); }
  if (broken) { g.fillStyle = '#0c0a14'; for (const [a, b] of [[14, 10], [16, 14], [20, 16], [24, 22], [22, 28]]) g.fillRect(X + a, Y + b, 3, 2); }
  for (const [ax, ay] of [[-40, 30], [88, 30], [-30, 60], [78, 60]]) { g.strokeStyle = broken ? '#3c3450' : ((frame >> 2) & 1 ? '#f8e070' : '#a89040'); g.lineWidth = 1; g.beginPath(); g.moveTo(X + 24, Y + 20); g.lineTo(X + 24 + ax, Y + ay); g.stroke(); }
  txt('GRAN PILA', X + 1, Y + 48, broken ? '#606070' : '#f8d030');
  if (!G.flags.fulgor) { const fx = 7 * 16 + 8 - cx + Math.sin(frame * .05) * 2, fy = 3 * 16 - cy + Math.cos(frame * .07) * 2; g.globalCompositeOperation = 'lighter'; g.globalAlpha = .2; disc(fx, fy, 16, '#f8e070'); disc(fx, fy, 10, '#ffffff'); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; if (frame % 6 === 0) part({ w: 1, x: fx + cx + rnd(-8, 8), y: fy + cy + rnd(-8, 8), vx: rnd(-.5, .5), vy: rnd(-.5, .5), life: 14, c: pick(['#fff', '#f8e070', '#58b8f8']) }); }
}
