/* ぽん、と森は灯る — simulation core (deterministic, DOM-free; also runs in Node) */
(function (root) {
  'use strict';

  var C = {
    DT: 1 / 120,
    DRAG: 1.6,          // 1/s  exponential slowdown
    VMAX: 760,          // launch speed at full pull
    VMIN: 150,
    STOP: 40,           // speed at which the spore settles
    CAP: 1250,
    LIFE: 7,            // seconds of flight before the spore settles anyway
    SPORE_R: 6,
    KICK: [0, 420, 680, 1000, 1200],   // min outgoing speed by mushroom size
    MR: [0, 16, 22, 29, 40],           // mushroom radius by size
    GROW: [0, 2, 5],                   // hits needed to reach size 2, size 3
    BELL_R: 26,
    BELL_KEEP: 48,
    FLOAT_V: 230,
    REKICK: 24,         // steps before the same mushroom can kick again
    FF_R: 30,
    CELL: 256
  };

  /* ---------- static index ---------- */
  function buildIndex(world) {
    var grid = {};
    function put(item, x0, y0, x1, y1) {
      var pad = C.SPORE_R + 16;
      var cx0 = Math.floor((x0 - pad) / C.CELL), cx1 = Math.floor((x1 + pad) / C.CELL);
      var cy0 = Math.floor((y0 - pad) / C.CELL), cy1 = Math.floor((y1 + pad) / C.CELL);
      for (var cx = cx0; cx <= cx1; cx++) for (var cy = cy0; cy <= cy1; cy++) {
        var k = cx + cy * 4096;
        (grid[k] || (grid[k] = [])).push(item);
      }
    }
    function circ(type, o, extra) {
      var it = { type: type, shape: 0, x: o.x, y: o.y, r: o.r };
      if (extra) for (var k in extra) it[k] = extra[k];
      put(it, o.x - o.r, o.y - o.r, o.x + o.r, o.y + o.r);
    }
    function caps(type, o, extra) {
      var it = { type: type, shape: 1, ax: o.ax, ay: o.ay, bx: o.bx, by: o.by, r: o.r };
      if (extra) for (var k in extra) it[k] = extra[k];
      put(it, Math.min(o.ax, o.bx) - o.r, Math.min(o.ay, o.by) - o.r, Math.max(o.ax, o.bx) + o.r, Math.max(o.ay, o.by) + o.r);
    }
    world.rocks.forEach(function (o) { circ('rock', o, { rest: o.rest, kick: o.kick }); });
    world.thorns.forEach(function (o) { circ('thorn', o); });
    world.walls.forEach(function (o) { caps('wall', o, { rest: o.rest, log: !!o.log }); });
    world.bells.forEach(function (o, i) { circ('bell', { x: o.x, y: o.y, r: C.BELL_R }, { idx: i }); });
    world.gates.forEach(function (o) { if (o.ax !== undefined) caps('gate', o, { group: o.group }); });
    world.fireflies.forEach(function (o, i) { circ('ff', { x: o.x, y: o.y, r: C.FF_R }, { idx: i }); });
    world.grid = grid;
    return world;
  }

  function inMoss(world, x, y) {
    var ms = world.bells, K = C.BELL_KEEP * C.BELL_KEEP;   // nothing roots on a bell's bare ring
    for (var j = 0; j < ms.length; j++) { var ex = x - ms[j].x, ey = y - ms[j].y; if (ex * ex + ey * ey < K) return false; }
    ms = world.moss;
    for (var i = 0; i < ms.length; i++) {
      var m = ms[i], dx = x - m.x, dy = y - m.y;
      if (dx * dx + dy * dy < m.r * m.r) return true;
    }
    return false;
  }

  function riverAt(world, x, y) {
    for (var r = 0; r < world.rivers.length; r++) {
      var rv = world.rivers[r], p = rv.pts;
      for (var s = 0; s < p.length - 1; s++) {
        var ax = p[s][0], ay = p[s][1], bx = p[s + 1][0], by = p[s + 1][1];
        var ex = bx - ax, ey = by - ay, l2 = ex * ex + ey * ey;
        var t = ((x - ax) * ex + (y - ay) * ey) / l2;
        if (t < 0) t = 0; else if (t > 1) t = 1;
        var dx = x - (ax + ex * t), dy = y - (ay + ey * t);
        if (dx * dx + dy * dy < rv.hw * rv.hw) return { river: rv, seg: s, t: t };
      }
    }
    return null;
  }

  /* ---------- state ---------- */
  function newState(world) {
    var st = {
      mush: [], gateOpen: {}, ff: [], bellLit: [], nextId: 1, won: false,
      stats: { shots: 0, planted: 0, lost: 0, bestCombo: 0, time: 0 }
    };
    st.mush.push({ id: st.nextId++, x: world.mother.x, y: world.mother.y, size: 2, hits: 2, kind: 'mother' });
    world.wilds.forEach(function (w) {
      st.mush.push({ id: st.nextId++, x: w.x, y: w.y, size: w.size, hits: w.hits !== undefined ? w.hits : (w.size >= 3 ? 5 : (w.size === 2 ? 2 : 0)), kind: w.size === 4 ? 'giant' : 'wild' });
    });
    world.fireflies.forEach(function () { st.ff.push(false); });
    world.bells.forEach(function () { st.bellLit.push(false); });
    return st;
  }

  function freeSpot(world, state, x, y) {
    function ok(px, py) {
      if (!inMoss(world, px, py)) return false;
      for (var i = 0; i < state.mush.length; i++) {
        var m = state.mush[i], rr = C.MR[m.size] + 14, dx = px - m.x, dy = py - m.y;
        if (dx * dx + dy * dy < rr * rr) return false;
      }
      return true;
    }
    if (ok(x, y)) return { x: x, y: y };
    for (var rad = 24; rad <= 130; rad += 18) {
      for (var a = 0; a < 16; a++) {
        var ang = a * Math.PI / 8 + rad;
        var px = x + Math.cos(ang) * rad, py = y + Math.sin(ang) * rad;
        if (ok(px, py)) return { x: px, y: py };
      }
    }
    return null;
  }

  /* ---------- one shot ---------- */
  function simulate(world, state, L, vx, vy, opt) {
    opt = opt || {};
    var maxLen = opt.maxLen || 0, len = 0, px0 = 0, py0 = 0;
    var DT = C.DT, SR = C.SPORE_R;
    var x = L.x, y = L.y;
    var pts = [x, y], events = [];
    var i = 0, bounces = 0, combo = 0, inL = true;
    var mush = [];
    for (var k = 0; k < state.mush.length; k++) {
      var mm = state.mush[k];
      if (Math.abs(mm.x - L.x) < 2600 && Math.abs(mm.y - L.y) < 2600) mush.push(mm);
    }
    var bellsHit = {}, ffHit = {}, mushHits = {}, lastHit = {};
    var maxSteps = Math.round(C.LIFE / DT);
    var end = null, floatFrom = -1;
    var grid = world.grid, CELL = C.CELL;
    var dr = 1 - C.DRAG * DT;

    while (!end) {
      i++;
      vx *= dr; vy *= dr;
      px0 = x; py0 = y;
      x += vx * DT; y += vy * DT;
      var dx, dy, d2, rr, d, nx, ny, vn, sp, ns, f;

      if (inL) {
        dx = x - L.x; dy = y - L.y; rr = C.MR[L.size] + SR + 1;
        if (dx * dx + dy * dy > rr * rr) inL = false;
      }
      // mushrooms
      for (k = 0; k < mush.length; k++) {
        var m = mush[k];
        if (m === L && inL) continue;
        dx = x - m.x; dy = y - m.y; rr = C.MR[m.size] + SR; d2 = dx * dx + dy * dy;
        if (d2 < rr * rr && d2 > 1e-6) {
          d = Math.sqrt(d2); nx = dx / d; ny = dy / d;
          x = m.x + nx * rr; y = m.y + ny * rr;
          vn = vx * nx + vy * ny;
          if (vn < 0) {
            vx -= 2 * vn * nx; vy -= 2 * vn * ny;
            sp = Math.sqrt(vx * vx + vy * vy);
            // a mushroom needs a moment before it can kick again (no machine-gun traps)
            var fresh = !(i - (lastHit[m.id] || -99) < C.REKICK);
            ns = fresh ? Math.min(C.CAP, Math.max(sp * 0.9, C.KICK[m.size])) : sp * 0.9;
            f = ns / (sp || 1); vx *= f; vy *= f;
            bounces++;
            if (fresh) {
              lastHit[m.id] = i; combo++;
              mushHits[m.id] = (mushHits[m.id] || 0) + 1;
              events.push({ i: i, type: 'mush', id: m.id, x: x, y: y, combo: combo });
            }
          }
        }
      }
      // statics
      var cell = grid[Math.floor(x / CELL) + Math.floor(y / CELL) * 4096];
      if (cell) {
        for (k = 0; k < cell.length; k++) {
          var o = cell[k], ox, oy;
          if (o.type === 'gate' && state.gateOpen[o.group]) continue;
          if (o.type === 'bell') {
            if (bellsHit[o.idx]) continue;
            dx = x - o.x; dy = y - o.y;
            if (dx * dx + dy * dy < o.r * o.r) { bellsHit[o.idx] = true; events.push({ i: i, type: 'bell', idx: o.idx, x: o.x, y: o.y, count: Object.keys(bellsHit).length }); }
            continue;
          }
          if (o.type === 'ff') {
            if (state.ff[o.idx] || ffHit[o.idx]) continue;
            dx = x - o.x; dy = y - o.y;
            if (dx * dx + dy * dy < o.r * o.r) { ffHit[o.idx] = true; events.push({ i: i, type: 'ff', idx: o.idx }); }
            continue;
          }
          if (o.shape === 0) { ox = o.x; oy = o.y; }
          else {
            var ex = o.bx - o.ax, ey = o.by - o.ay;
            var t = ((x - o.ax) * ex + (y - o.ay) * ey) / (ex * ex + ey * ey);
            if (t < 0) t = 0; else if (t > 1) t = 1;
            ox = o.ax + ex * t; oy = o.ay + ey * t;
          }
          dx = x - ox; dy = y - oy; rr = o.r + SR; d2 = dx * dx + dy * dy;
          if (d2 < rr * rr && d2 > 1e-6) {
            if (o.type === 'thorn') { end = { type: 'thorn', x: x, y: y }; break; }
            d = Math.sqrt(d2); nx = dx / d; ny = dy / d;
            x = ox + nx * rr; y = oy + ny * rr;
            vn = vx * nx + vy * ny;
            if (vn < 0) {
              vx -= 2 * vn * nx; vy -= 2 * vn * ny;
              sp = Math.sqrt(vx * vx + vy * vy);
              {
                ns = sp * (o.rest || (o.type === 'rock' ? 0.8 : 0.7)); if (o.kick && ns < o.kick) ns = o.kick; bounces++;
                events.push({ i: i, type: o.type, x: x, y: y, sp: sp, log: o.log, kick: o.kick });
              }
              f = ns / (sp || 1); vx *= f; vy *= f;
            }
          }
        }
      }
      pts.push(x, y);
      if (end) break;
      if (maxLen) { len += Math.sqrt((x - px0) * (x - px0) + (y - py0) * (y - py0)); if (len >= maxLen) { end = { type: 'preview', x: x, y: y }; break; } }
      sp = Math.sqrt(vx * vx + vy * vy);
      if (sp < C.STOP || i >= maxSteps) {
        if (inMoss(world, x, y)) { end = { type: 'sprout', x: x, y: y }; break; }
        var rv = riverAt(world, x, y);
        if (!rv) { end = { type: 'fizzle', x: x, y: y }; break; }
        // float downstream until moss or the river's end
        floatFrom = i;
        events.push({ i: i, type: 'splash', x: x, y: y });
        if (maxLen) { end = { type: 'water', x: x, y: y }; break; }
        var p = rv.river.pts, s = rv.seg, guard = 0;
        while (!end && guard++ < 4000) {
          var ax = p[s][0], ay = p[s][1], bx = p[s + 1][0], by = p[s + 1][1];
          var sx = bx - ax, sy = by - ay, sl = Math.sqrt(sx * sx + sy * sy);
          sx /= sl; sy /= sl;
          x += sx * C.FLOAT_V * DT; y += sy * C.FLOAT_V * DT;
          i++; pts.push(x, y);
          if (inMoss(world, x, y)) {
            var spot = freeSpot(world, state, x, y);
            end = spot ? { type: 'sprout', x: spot.x, y: spot.y, floated: true } : { type: 'sink', x: x, y: y };
            break;
          }
          if ((x - ax) * sx + (y - ay) * sy >= sl) { s++; if (s >= p.length - 1) { end = { type: 'sink', x: x, y: y }; } }
        }
        if (!end) end = { type: 'sink', x: x, y: y };
      }
    }
    return { pts: pts, n: pts.length / 2, events: events, end: end, floatFrom: floatFrom, bellsHit: bellsHit, ffHit: ffHit, mushHits: mushHits, combo: combo, launcher: L.id };
  }

  /* apply the outcome of a finished shot to the state */
  function applyShot(world, state, res) {
    var out = { opened: [], grown: [], sprout: null, won: false, partial: {} };
    state.stats.shots++;
    if (res.combo > state.stats.bestCombo) state.stats.bestCombo = res.combo;
    var id;
    for (id in res.mushHits) {
      var m = null;
      for (var k = 0; k < state.mush.length; k++) if (state.mush[k].id == id) m = state.mush[k];
      if (!m || m.kind === 'giant') continue;
      m.hits += res.mushHits[id];
      var ns = m.hits >= C.GROW[2] ? 3 : (m.hits >= C.GROW[1] ? 2 : 1);
      if (ns > m.size) { m.size = ns; out.grown.push(m.id); }
    }
    for (id in res.ffHit) state.ff[id] = true;
    // bell groups
    world.gates.forEach(function (g) {
      if (state.gateOpen[g.group]) return;
      var bells = [], hit = 0;
      world.bells.forEach(function (b, bi) { if (b.group === g.group) { bells.push(bi); if (res.bellsHit[bi]) hit++; } });
      if (hit > 0) out.partial[g.group] = { hit: hit, need: bells.length };
      if (hit === bells.length) {
        state.gateOpen[g.group] = true; out.opened.push(g.group);
        bells.forEach(function (bi) { state.bellLit[bi] = true; });
        if (g.final) { state.won = true; out.won = true; }
      }
    });
    if (res.end.type === 'sprout') {
      var nm = { id: state.nextId++, x: res.end.x, y: res.end.y, size: 1, hits: 0, kind: 'own' };
      state.mush.push(nm); state.stats.planted++; out.sprout = nm;
    } else state.stats.lost++;
    return out;
  }

  function uproot(state, id) {
    for (var k = 0; k < state.mush.length; k++) {
      if (state.mush[k].id === id && state.mush[k].kind === 'own') { return state.mush.splice(k, 1)[0]; }
    }
    return null;
  }

  var api = { C: C, buildIndex: buildIndex, inMoss: inMoss, riverAt: riverAt, newState: newState, simulate: simulate, applyShot: applyShot, uproot: uproot };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.PonSim = api;
})(typeof window !== 'undefined' ? window : globalThis);
