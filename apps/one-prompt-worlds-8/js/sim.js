/*
 * ひつじが いっぴき — ルールの核（描画なし。node からも使える）
 *
 * しくみは少しだけ：
 *   ・ひつじは犬から離れる。歩く犬には「まとまって」、走る犬には「ちって」逃げる。
 *   ・やぎと、クローバーを食べているひつじは、歩く犬を気にしない。走る犬にだけ驚く。
 *   ・小屋に入って少しすると、落ちついて数に入る。
 */
(function (root) {
  'use strict';

  var C = {
    W: 1280, H: 720,
    BX0: 34, BY0: 78, BX1: 1246, BY1: 690,   // 牧場の内のり
    WALK: 150, DASH: 370,
    R_STAND: 70, R_WALK: 125, R_DASH: 205,
    SHEEP_R: 10, DOG_R: 9,
    PANIC_SHEEP: 1.1, PANIC_GOAT: 0.3,
    PANIC_V: 225, GOAT_V: 215,
    SETTLE_T: 0.7,
    GRAZE_T: 0.45, SMELL: 70,
    SLOT: 30
  };

  function mulberry(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // ---- 地形 ----
  function penGeometry(p) {
    var segs = [];
    var x0 = p.x, y0 = p.y, x1 = p.x + p.w, y1 = p.y + p.h;
    var gw = p.gw || 84, gp = p.gpos == null ? 0.5 : p.gpos;
    function side(ax, ay, bx, by, isGate) {
      if (!isGate) { segs.push([ax, ay, bx, by]); return null; }
      var len = Math.hypot(bx - ax, by - ay), ux = (bx - ax) / len, uy = (by - ay) / len;
      var c = len * gp, a = c - gw / 2, b = c + gw / 2;
      if (a > 2) segs.push([ax, ay, ax + ux * a, ay + uy * a]);
      if (b < len - 2) segs.push([ax + ux * b, ay + uy * b, bx, by]);
      return { x: ax + ux * c, y: ay + uy * c, ax: ax + ux * a, ay: ay + uy * a, bx: ax + ux * b, by: ay + uy * b };
    }
    var g = null, r;
    r = side(x0, y0, x1, y0, p.gate === 'T'); if (r) g = r;
    r = side(x1, y0, x1, y1, p.gate === 'R'); if (r) g = r;
    r = side(x0, y1, x1, y1, p.gate === 'B'); if (r) g = r;
    r = side(x0, y0, x0, y1, p.gate === 'L'); if (r) g = r;
    // 寝床（門から遠い順）
    var slots = [];
    var nx = Math.floor((p.w - 24) / C.SLOT), ny = Math.floor((p.h - 24) / C.SLOT);
    var ox = p.x + (p.w - (nx - 1) * C.SLOT) / 2, oy = p.y + (p.h - (ny - 1) * C.SLOT) / 2;
    for (var j = 0; j < ny; j++) for (var i = 0; i < nx; i++) {
      var sx = ox + i * C.SLOT + ((j % 2) ? 5 : -5), sy = oy + j * C.SLOT;
      slots.push({ x: sx, y: sy, d: Math.hypot(sx - g.x, sy - g.y), used: false });
    }
    slots.sort(function (a, b) { return b.d - a.d; });
    return { segs: segs, gate: g, slots: slots };
  }

  function create(level, seed) {
    var rnd = mulberry(seed == null ? 12345 : seed);
    var walls = [];
    (level.walls || []).forEach(function (w) { walls.push(w.slice()); });
    var pens = (level.pens || []).map(function (p) {
      var geo = penGeometry(p);
      geo.segs.forEach(function (s) { walls.push(s); });
      // 小屋と生け垣のあいだの細いすきまは、はじめから ふさいでおく
      var G = 34;
      if (p.y - C.BY0 > 0 && p.y - C.BY0 < G) { walls.push([p.x, C.BY0, p.x, p.y]); walls.push([p.x + p.w, C.BY0, p.x + p.w, p.y]); }
      if (C.BY1 - (p.y + p.h) > 0 && C.BY1 - (p.y + p.h) < G) { walls.push([p.x, p.y + p.h, p.x, C.BY1]); walls.push([p.x + p.w, p.y + p.h, p.x + p.w, C.BY1]); }
      if (p.x - C.BX0 > 0 && p.x - C.BX0 < G) { walls.push([C.BX0, p.y, p.x, p.y]); walls.push([C.BX0, p.y + p.h, p.x, p.y + p.h]); }
      if (C.BX1 - (p.x + p.w) > 0 && C.BX1 - (p.x + p.w) < G) { walls.push([p.x + p.w, p.y, C.BX1, p.y]); walls.push([p.x + p.w, p.y + p.h, C.BX1, p.y + p.h]); }
      return {
        x: p.x, y: p.y, w: p.w, h: p.h, gateSide: p.gate, accept: p.accept || 'any',
        gate: geo.gate, slots: geo.slots, count: 0, need: 0
      };
    });
    var animals = [];
    function add(kind, pos, i) {
      animals.push({
        id: animals.length, kind: kind, x: pos[0], y: pos[1], vx: 0, vy: 0,
        hx: rnd() < 0.5 ? 1 : -1, hy: 0,
        panic: 0, graze: false, grazeT: 0, settleT: 0, settled: false, slot: null, pen: -1,
        wanderA: rnd() * 6.283, wanderT: rnd() * 3, bias: (rnd() - 0.5) * 1.5, biasT: 0,
        stuckT: 0, resp: false, phase: rnd() * 6.283, speed: 0, lie: 0, hop: 0
      });
    }
    (level.sheep || []).forEach(function (p, i) { add('sheep', p, i); });
    (level.goats || []).forEach(function (p, i) { add('goat', p, i); });
    pens.forEach(function (p) {
      animals.forEach(function (a) { if (p.accept === 'any' || p.accept === a.kind) p.need++; });
    });
    var st = { pens: pens };
    return {
      closed: { sheep: closedGates(st, 'sheep'), goat: closedGates(st, 'goat') },
      level: level, t: 0, clock: 0, started: false, done: false, rnd: rnd,
      dog: { x: level.dog[0], y: level.dog[1], vx: 0, vy: 0, hx: 1, hy: 0, gait: 0, speed: 0, swim: false, R: C.R_STAND, dashT: 0 },
      animals: animals, walls: walls, pens: pens,
      ponds: level.ponds || [], grass: level.grass || [],
      settled: 0, total: animals.length, events: [], dashUse: 0
    };
  }

  function inPond(s, x, y, pad) {
    for (var i = 0; i < s.ponds.length; i++) {
      var p = s.ponds[i], nx = (x - p.x) / (p.rx + (pad || 0)), ny = (y - p.y) / (p.ry + (pad || 0));
      if (nx * nx + ny * ny < 1) return p;
    }
    return null;
  }
  function grassAt(s, x, y, pad) {
    for (var i = 0; i < s.grass.length; i++) {
      var g = s.grass[i], d = Math.hypot(x - g.x, y - g.y);
      if (d < g.r + (pad || 0)) return g;
    }
    return null;
  }

  // 看板の絵とちがう動物にとっては、門も柵とおなじ
  function closedGates(s, kind) {
    var out = [];
    for (var i = 0; i < s.pens.length; i++) {
      var p = s.pens[i];
      if (p.accept !== 'any' && p.accept !== kind) out.push([p.gate.ax, p.gate.ay, p.gate.bx, p.gate.by]);
    }
    return out;
  }
  function collideWalls(s, o, r, extra) {
    var hit = false, nw = s.walls.length, ne = extra ? extra.length : 0;
    for (var i = 0; i < nw + ne; i++) {
      var w = i < nw ? s.walls[i] : extra[i - nw], ax = w[0], ay = w[1], bx = w[2], by = w[3];
      var dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy;
      var t = l2 > 0 ? ((o.x - ax) * dx + (o.y - ay) * dy) / l2 : 0;
      if (t < 0) t = 0; else if (t > 1) t = 1;
      var px = ax + dx * t, py = ay + dy * t, ex = o.x - px, ey = o.y - py, d = Math.hypot(ex, ey), R = r + 3;
      if (d < R) {
        if (d < 0.001) { ex = -dy; ey = dx; d = Math.hypot(ex, ey) || 1; }
        o.x = px + ex / d * R; o.y = py + ey / d * R; hit = true;
      }
    }
    if (o.x < C.BX0 + r) { o.x = C.BX0 + r; hit = true; }
    if (o.x > C.BX1 - r) { o.x = C.BX1 - r; hit = true; }
    if (o.y < C.BY0 + r) { o.y = C.BY0 + r; hit = true; }
    if (o.y > C.BY1 - r) { o.y = C.BY1 - r; hit = true; }
    return hit;
  }
  function collidePonds(s, o, r) {
    for (var i = 0; i < s.ponds.length; i++) {
      var p = s.ponds[i], RX = p.rx + r, RY = p.ry + r;
      var nx = (o.x - p.x) / RX, ny = (o.y - p.y) / RY, q = nx * nx + ny * ny;
      if (q < 1) {
        var f = 1 / Math.sqrt(q || 1e-6);
        o.x = p.x + nx * f * RX; o.y = p.y + ny * f * RY;
      }
    }
  }

  function penFor(s, a) {
    for (var i = 0; i < s.pens.length; i++) {
      var p = s.pens[i];
      if (a.x > p.x + 7 && a.x < p.x + p.w - 7 && a.y > p.y + 7 && a.y < p.y + p.h - 7) return i;
    }
    return -1;
  }

  function step(s, inp, dt) {
    var d = s.dog, i, j, a, b;
    s.t += dt;
    // ---- 犬 ----
    var dx = inp.tx - d.x, dy = inp.ty - d.y, dist = Math.hypot(dx, dy);
    var want = inp.dash ? C.DASH : Math.min(C.WALK, dist * 5);
    if (dist < 5) want = 0;
    else if (inp.dash && dist < 40) want = Math.min(want, dist * 9);
    d.swim = !!inPond(s, d.x, d.y, -4);
    if (d.swim) want *= 0.42;
    var tvx = dist > 0 ? dx / dist * want : 0, tvy = dist > 0 ? dy / dist * want : 0;
    var k = Math.min(1, dt * 11);
    d.vx += (tvx - d.vx) * k; d.vy += (tvy - d.vy) * k;
    d.x += d.vx * dt; d.y += d.vy * dt;
    collideWalls(s, d, C.DOG_R);
    d.speed = Math.hypot(d.vx, d.vy);
    if (d.speed > 12) { var hk = Math.min(1, dt * 14); d.hx += (d.vx / d.speed - d.hx) * hk; d.hy += (d.vy / d.speed - d.hy) * hk; }
    var gait = (inp.dash && d.speed > 170) ? 2 : (d.speed > 22 ? 1 : 0);
    if (gait === 2 && d.gait !== 2) s.events.push({ type: 'dash' });
    d.gait = gait;
    if (gait === 2) { d.dashT += dt; s.dashUse += dt; } else d.dashT = 0;
    var Rt = gait === 2 ? C.R_DASH : gait === 1 ? C.R_WALK : C.R_STAND;
    d.R += (Rt - d.R) * Math.min(1, dt * 8);
    if (!s.started && (d.speed > 20)) s.started = true;
    if (s.started && !s.done) s.clock += dt;

    // ---- どうぶつ ----
    var A = s.animals, n = A.length;
    for (i = 0; i < n; i++) {
      a = A[i];
      a.phase += dt * (2 + a.speed * 0.12);
      if (a.hop > 0) a.hop -= dt;
      if (a.settled) {
        var sl = a.slot, sx = sl.x - a.x, sy = sl.y - a.y, sd = Math.hypot(sx, sy);
        if (sd > 3) {
          var sv = Math.min(70, sd * 4);
          a.vx += (sx / sd * sv - a.vx) * Math.min(1, dt * 6); a.vy += (sy / sd * sv - a.vy) * Math.min(1, dt * 6);
          a.x += a.vx * dt; a.y += a.vy * dt;
          a.speed = Math.hypot(a.vx, a.vy);
          if (a.speed > 8) { a.hx += (a.vx / a.speed - a.hx) * 0.15; a.hy += (a.vy / a.speed - a.hy) * 0.15; }
        } else { a.vx = a.vy = 0; a.speed = 0; a.lie = Math.min(1, a.lie + dt * 2); }
        continue;
      }
      var sepx = 0, sepy = 0, cx = 0, cy = 0, cn = 0, avx = 0, avy = 0;
      for (j = 0; j < n; j++) {
        if (j === i) continue;
        b = A[j];
        var ex = a.x - b.x, ey = a.y - b.y, e = Math.hypot(ex, ey);
        if (e < 27 && e > 0.01) { var sw = (1 - e / 27); sepx += ex / e * sw; sepy += ey / e * sw; }
        if (!b.settled && b.kind === a.kind && e < 150) { cx += b.x; cy += b.y; avx += b.vx; avy += b.vy; cn++; }
      }
      var ddx = a.x - d.x, ddy = a.y - d.y, dd = Math.hypot(ddx, ddy) || 0.01;
      var stubborn = a.kind === 'goat' || a.graze;
      var R = d.R;
      var resp = dd < R && d.gait > 0 && (!stubborn || d.gait === 2);
      if (!resp && d.gait === 0 && !stubborn && dd < C.R_STAND) resp = true;
      if (d.gait === 2 && dd < C.R_DASH * 0.85) {
        if (a.panic <= 0) { s.events.push({ type: 'panic', kind: a.kind, x: a.x, y: a.y }); a.hop = 0.25; }
        a.panic = a.kind === 'goat' ? C.PANIC_GOAT : C.PANIC_SHEEP;
        a.graze = false; a.grazeT = 0;
      }
      a.resp = resp;
      var vx = 0, vy = 0, kk = 6;
      if (a.panic > 0) {
        a.panic -= dt;
        var fx = ddx / dd, fy = ddy / dd;
        if (a.kind === 'sheep') {
          a.biasT -= dt;
          if (a.biasT <= 0) { a.biasT = 0.5 + s.rnd() * 0.5; a.bias = (s.rnd() - 0.5) * 1.7; }
          var cb = Math.cos(a.bias), sb = Math.sin(a.bias);
          var rx = fx * cb - fy * sb, ry = fx * sb + fy * cb; fx = rx; fy = ry;
          var pv = C.PANIC_V * Math.min(1, a.panic / 0.35 + 0.15);
          vx = fx * pv; vy = fy * pv;
        } else {
          var gv = C.GOAT_V * Math.min(1, a.panic / 0.3 + 0.1);
          vx = fx * gv; vy = fy * gv;
        }
        kk = 10;
      } else if (resp) {
        var p = 1 - dd / R, sp = 50 + 85 * p;
        var ux = ddx / dd, uy = ddy / dd;
        if (cn > 0) {
          var ccx = cx / cn - a.x, ccy = cy / cn - a.y, cl = Math.hypot(ccx, ccy);
          if (cl > 14) { ux += ccx / cl * 0.55; uy += ccy / cl * 0.55; }
          var al = Math.hypot(avx, avy);
          if (al > 1) { ux += avx / al * 0.35; uy += avy / al * 0.35; }
        }
        var ul = Math.hypot(ux, uy) || 1;
        ux /= ul; uy /= ul;
        vx = ux * sp; vy = uy * sp;
        a.grazeT = 0;
      } else {
        // のんびり
        var g = grassAt(s, a.x, a.y, 0);
        if (g) {
          a.grazeT += dt;
          if (a.grazeT > C.GRAZE_T && !a.graze) { a.graze = true; s.events.push({ type: 'graze', x: a.x, y: a.y }); }
        } else { a.grazeT = 0; a.graze = false; }
        var gs = g ? null : grassAt(s, a.x, a.y, C.SMELL);
        if (a.graze) {
          a.wanderT -= dt;
          if (a.wanderT <= 0) { a.wanderT = 2 + s.rnd() * 3; a.wanderA = s.rnd() * 6.283; }
          var inner = Math.hypot(a.x - g.x, a.y - g.y) < g.r - 16;
          if (!inner) { var gl = Math.hypot(g.x - a.x, g.y - a.y) || 1; vx = (g.x - a.x) / gl * 22; vy = (g.y - a.y) / gl * 22; }
          else if (a.wanderT < 0.5) { vx = Math.cos(a.wanderA) * 14; vy = Math.sin(a.wanderA) * 14; }
        } else if (gs) {
          var gl2 = Math.hypot(gs.x - a.x, gs.y - a.y) || 1;
          vx = (gs.x - a.x) / gl2 * 38; vy = (gs.y - a.y) / gl2 * 38;
        } else if (g) {
          vx = a.vx * 0.5; vy = a.vy * 0.5;
        } else {
          a.wanderT -= dt;
          if (a.wanderT <= 0) { a.wanderT = 1.5 + s.rnd() * 3.5; a.wanderA = s.rnd() * 6.283; a.wanderOn = s.rnd() < 0.55; }
          if (a.wanderOn) { vx = Math.cos(a.wanderA) * 11; vy = Math.sin(a.wanderA) * 11; }
          if (cn > 0 && a.kind === 'sheep') {
            var wx = cx / cn - a.x, wy = cy / cn - a.y, wl = Math.hypot(wx, wy);
            if (wl > 55) { vx += wx / wl * 16; vy += wy / wl * 16; }
          }
        }
        kk = 3;
      }
      vx += sepx * 150; vy += sepy * 150;
      // 柵や生け垣には寄りかからない（壁ぎわで追いつめても、内がわへ それる）
      var WR = (resp || a.panic > 0) ? 40 : 52, wk = a.panic > 0 ? 150 : 80, wd;
      if (a.x < C.BX0 + WR) vx += (1 - (a.x - C.BX0) / WR) * wk;
      if (a.x > C.BX1 - WR) vx -= (1 - (C.BX1 - a.x) / WR) * wk;
      if (a.y < C.BY0 + WR) vy += (1 - (a.y - C.BY0) / WR) * wk;
      if (a.y > C.BY1 - WR) vy -= (1 - (C.BY1 - a.y) / WR) * wk;
      for (j = 0; j < s.walls.length; j++) {
        var w = s.walls[j], wdx = w[2] - w[0], wdy = w[3] - w[1], wl2 = wdx * wdx + wdy * wdy;
        var wt = wl2 > 0 ? ((a.x - w[0]) * wdx + (a.y - w[1]) * wdy) / wl2 : 0;
        if (wt < 0) wt = 0; else if (wt > 1) wt = 1;
        var wex = a.x - (w[0] + wdx * wt), wey = a.y - (w[1] + wdy * wt);
        wd = Math.hypot(wex, wey);
        if (wd < WR && wd > 0.01) { vx += wex / wd * (1 - wd / WR) * wk; vy += wey / wd * (1 - wd / WR) * wk; }
      }
      var kq = Math.min(1, dt * kk);
      a.vx += (vx - a.vx) * kq; a.vy += (vy - a.vy) * kq;
      var ox = a.x, oy = a.y;
      a.x += a.vx * dt; a.y += a.vy * dt;
      collidePonds(s, a, C.SHEEP_R);
      collideWalls(s, a, C.SHEEP_R, s.closed[a.kind]);
      var moved = Math.hypot(a.x - ox, a.y - oy) / dt;
      a.speed = moved;
      if ((resp || a.panic > 0) && moved < 16) a.stuckT += dt; else a.stuckT = Math.max(0, a.stuckT - dt * 2);
      if (moved > 9) {
        var hq = Math.min(1, dt * 9);
        a.hx += ((a.x - ox) / (moved * dt) - a.hx) * hq; a.hy += ((a.y - oy) / (moved * dt) - a.hy) * hq;
      }
      // 小屋
      var pi = penFor(s, a);
      if (pi >= 0 && (s.pens[pi].accept === 'any' || s.pens[pi].accept === a.kind)) {
        a.settleT += dt;
        if (a.settleT >= C.SETTLE_T) {
          var pen = s.pens[pi], slot = null;
          for (j = 0; j < pen.slots.length; j++) if (!pen.slots[j].used) { slot = pen.slots[j]; break; }
          if (!slot) slot = { x: pen.x + pen.w / 2, y: pen.y + pen.h / 2, used: true };
          slot.used = true;
          a.settled = true; a.slot = slot; a.pen = pi; a.panic = 0; a.graze = false; a.resp = false;
          pen.count++; s.settled++;
          s.events.push({ type: 'settle', kind: a.kind, n: s.settled, total: s.total, x: a.x, y: a.y, pen: pi });
        }
      } else a.settleT = 0;
    }
    // 重なりをほどく
    for (i = 0; i < n; i++) {
      a = A[i];
      for (j = i + 1; j < n; j++) {
        b = A[j];
        var qx = b.x - a.x, qy = b.y - a.y, q = Math.hypot(qx, qy), min = 18;
        if (q < min && q > 0.01) {
          if (a.settled && b.settled) continue;
          var push = (min - q), wa = a.settled ? 0 : (b.settled ? 1 : 0.5), wb = 1 - wa;
          if (a.settled && a.lie < 0.5) { wa = 0.5; wb = 0.5; }
          if (b.settled && b.lie < 0.5) { wa = 0.5; wb = 0.5; }
          a.x -= qx / q * push * wa; a.y -= qy / q * push * wa;
          b.x += qx / q * push * wb; b.y += qy / q * push * wb;
        }
      }
    }
    for (i = 0; i < n; i++) { a = A[i]; if (!a.settled) { collidePonds(s, a, C.SHEEP_R); collideWalls(s, a, C.SHEEP_R, s.closed[a.kind]); } }

    if (!s.done && s.settled >= s.total) { s.done = true; s.events.push({ type: 'clear', time: s.clock }); }
  }

  var Sim = { C: C, create: create, step: step, inPond: inPond, grassAt: grassAt, penGeometry: penGeometry, mulberry: mulberry };
  if (typeof module !== 'undefined' && module.exports) module.exports = Sim;
  root.Sim = Sim;
})(typeof window !== 'undefined' ? window : globalThis);
