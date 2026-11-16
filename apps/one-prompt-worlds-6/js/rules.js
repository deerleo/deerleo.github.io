// うしろのハニワ ― ルール本体（描画・音から独立。ブラウザと node の両方で動く）
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.HB_RULES = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // 向き：0=北(y-1) 1=東 2=南 3=西
  var DX = [0, 1, 0, -1], DY = [-1, 0, 1, 0];
  var T_FLOOR = 0, T_WALL = 1, T_MIRROR = 2;
  var ASLEEP = 0, AWAKE = 1, SETTLED = 2;
  var MAX_SIGHT = 14;

  // ---- 階の定義を読む ------------------------------------------------
  // #:壁  M:鏡のある壁  .:床  S:開始  X:出口  *:まが玉
  // a b c:赤ハニワ(印○△□)  p q r:青ハニワ(印○△□)
  // 1 2 3:台座(印○△□)      A B C:石戸(同じ印の台座が埋まると開く)
  function parse(def) {
    var rows = def.map, h = rows.length, w = rows[0].length;
    var L = {
      id: def.id, name: def.name, w: w, h: h, tile: new Uint8Array(w * h),
      door: new Int8Array(w * h).fill(-1), ped: new Int8Array(w * h).fill(-1),
      haniwa: [], start: null, exit: null, gem: null, def: def, _vis: {}, decor: null
    };
    var hs = [];
    for (var y = 0; y < h; y++) {
      if (rows[y].length !== w) throw new Error('行の長さが不揃い: ' + def.name + ' y=' + y);
      for (var x = 0; x < w; x++) {
        var c = rows[y][x], i = y * w + x, k;
        if (c === '#') L.tile[i] = T_WALL;
        else if (c === 'M') L.tile[i] = T_MIRROR;
        else if (c === 'S') L.start = { x: x, y: y, dir: def.dir || 0 };
        else if (c === 'X') L.exit = { x: x, y: y };
        else if (c === '*') L.gem = { x: x, y: y };
        else if ((k = 'abc'.indexOf(c)) >= 0) hs.push({ type: 'r', mark: k, x: x, y: y });
        else if ((k = 'pqr'.indexOf(c)) >= 0) hs.push({ type: 'b', mark: k, x: x, y: y });
        else if ((k = '123'.indexOf(c)) >= 0) L.ped[i] = k;
        else if ((k = 'ABC'.indexOf(c)) >= 0) L.door[i] = k;
        else if (c === 'o') { // 飾りの眠ったハニワ（結末の間）。通れない
          L.tile[i] = 3;
          L.decor = L.decor || []; L.decor.push({ x: x, y: y, type: L.decor.length % 3 === 1 ? 'b' : 'r', mark: L.decor.length % 3 });
        }
        else if (c !== '.') throw new Error('不明な記号 ' + c);
      }
    }
    hs.sort(function (a, b) { return a.mark - b.mark; });
    L.haniwa = hs;
    if (!L.start || !L.exit) throw new Error('開始か出口がない: ' + def.name);
    return L;
  }

  function initState(L) {
    var s = {
      px: L.start.x, py: L.start.y, pd: L.start.dir,
      h: L.haniwa.map(function (o) { return { x: o.x, y: o.y, st: o.type === 'r' ? ASLEEP : AWAKE }; }),
      gem: false, steps: 0, won: false, caught: -1
    };
    // 開始時点で見えている赤は、はじめから目をさましている
    var seen = seenFlags(L, s);
    for (var i = 0; i < s.h.length; i++) if (seen[i] && s.h[i].st === ASLEEP) s.h[i].st = AWAKE;
    return s;
  }
  function clone(s) {
    return {
      px: s.px, py: s.py, pd: s.pd,
      h: s.h.map(function (o) { return { x: o.x, y: o.y, st: o.st }; }),
      gem: s.gem, steps: s.steps, won: s.won, caught: s.caught
    };
  }

  // ---- 開閉の状態 ----------------------------------------------------
  function settledMask(L, s) {
    var m = 0;
    for (var i = 0; i < s.h.length; i++) if (s.h[i].st === SETTLED) m |= 1 << L.haniwa[i].mark;
    return m;
  }
  function allSettled(s) {
    for (var i = 0; i < s.h.length; i++) if (s.h[i].st !== SETTLED) return false;
    return true;
  }
  function visKey(L, s) { return settledMask(L, s) | (allSettled(s) ? 8 : 0); }

  // 視線も通行もさえぎるマスか（key は visKey）
  function opaque(L, key, x, y) {
    if (x < 0 || y < 0 || x >= L.w || y >= L.h) return true;
    var i = y * L.w + x;
    if (L.tile[i] !== T_FLOOR) return true;
    var d = L.door[i];
    if (d >= 0 && !(key & (1 << d))) return true;
    if (L.exit.x === x && L.exit.y === y && !(key & 8)) return true;
    return false;
  }
  function haniwaAt(s, x, y) {
    for (var i = 0; i < s.h.length; i++) if (s.h[i].x === x && s.h[i].y === y) return i;
    return -1;
  }

  // ---- 視線 ----------------------------------------------------------
  // マスの中心から中心へ。角をかすめる線は、わずかにずらした2本のどちらかが通れば見える。
  function los(L, key, ax, ay, bx, by) {
    var dx = bx - ax, dy = by - ay, len = Math.sqrt(dx * dx + dy * dy);
    var n = Math.ceil(len * 24), ox = -dy / len * 0.012, oy = dx / len * 0.012;
    for (var sgn = -1; sgn <= 1; sgn += 2) {
      var ok = true;
      for (var k = 1; k < n; k++) {
        var t = k / n;
        var cx = Math.round(ax + dx * t + ox * sgn), cy = Math.round(ay + dy * t + oy * sgn);
        if ((cx === ax && cy === ay) || (cx === bx && cy === by)) continue;
        if (opaque(L, key, cx, cy)) { ok = false; break; }
      }
      if (ok) return true;
    }
    return false;
  }

  // 正面にある鏡（なければ null）
  function mirrorAhead(L, key, px, py, pd) {
    for (var k = 1; k <= MAX_SIGHT; k++) {
      var x = px + DX[pd] * k, y = py + DY[pd] * k;
      if (x < 0 || y < 0 || x >= L.w || y >= L.h) return null;
      if (L.tile[y * L.w + x] === T_MIRROR) return { x: x, y: y, dist: k };
      if (opaque(L, key, x, y)) return null;
    }
    return null;
  }

  // その立ち位置・向きで見える床マスの一覧（鏡ごしの真後ろも含む）
  function visibleCells(L, key, px, py, pd) {
    var cache = L._vis[key] || (L._vis[key] = {});
    var ck = (py * L.w + px) * 4 + pd, got = cache[ck];
    if (got) return got;
    var out = [], fx = DX[pd], fy = DY[pd], rx = DX[(pd + 1) % 4], ry = DY[(pd + 1) % 4];
    for (var f = 1; f <= MAX_SIGHT; f++) {
      for (var l = -f; l <= f; l++) {
        var x = px + fx * f + rx * l, y = py + fy * f + ry * l;
        if (opaque(L, key, x, y)) continue;
        if (los(L, key, px, py, x, y)) out.push(y * L.w + x);
      }
    }
    if (mirrorAhead(L, key, px, py, pd)) {
      for (var b = 1; b <= MAX_SIGHT; b++) {
        var bx = px - fx * b, by = py - fy * b;
        if (opaque(L, key, bx, by)) break;
        out.push(by * L.w + bx);
      }
    }
    cache[ck] = out;
    return out;
  }

  // いま見えているハニワ（真偽の配列）
  function seenFlags(L, s) {
    var vis = visibleCells(L, visKey(L, s), s.px, s.py, s.pd), out = [];
    for (var i = 0; i < s.h.length; i++) out.push(vis.indexOf(s.h[i].y * L.w + s.h[i].x) >= 0);
    return out;
  }

  // ---- 赤ハニワの道のり（プレイヤーからの歩数）-------------------------
  function distField(L, s) {
    var key = visKey(L, s), w = L.w, dist = new Int16Array(w * L.h).fill(-1);
    var blocked = {};
    for (var i = 0; i < s.h.length; i++) {
      if (s.h[i].st === SETTLED || L.haniwa[i].type === 'b') blocked[s.h[i].y * w + s.h[i].x] = 1;
    }
    var q = [s.py * w + s.px], head = 0;
    dist[q[0]] = 0;
    while (head < q.length) {
      var c = q[head++], cx = c % w, cy = (c / w) | 0;
      for (var d = 0; d < 4; d++) {
        var nx = cx + DX[d], ny = cy + DY[d], n = ny * w + nx;
        if (opaque(L, key, nx, ny) || dist[n] >= 0 || blocked[n]) continue;
        if (nx === L.exit.x && ny === L.exit.y) continue;
        dist[n] = dist[c] + 1;
        q.push(n);
      }
    }
    return dist;
  }

  function canPlayerEnter(L, s, x, y) {
    return !opaque(L, visKey(L, s), x, y) && haniwaAt(s, x, y) < 0;
  }

  function settleIfHome(L, s, i, ev) {
    var o = s.h[i];
    if (L.ped[o.y * L.w + o.x] === L.haniwa[i].mark) {
      o.st = SETTLED;
      ev.push({ t: 'settle', i: i });
      var m = L.haniwa[i].mark;
      for (var c = 0; c < L.door.length; c++) if (L.door[c] === m) { ev.push({ t: 'door', mark: m }); break; }
      if (allSettled(s)) ev.push({ t: 'exitopen' });
    }
  }

  // ---- 1手すすめる ---------------------------------------------------
  // a: 'F'前 'B'後 'L'左を向く 'R'右を向く 'W'待つ。s を書き換え、起きたことの一覧を返す。
  // 動けなかった（壁など）ときは手数を使わず [{t:'bump'}] を返す。
  function tick(L, s, a) {
    var ev = [];
    if (s.won || s.caught >= 0) return ev;
    if (a === 'L') s.pd = (s.pd + 3) % 4;
    else if (a === 'R') s.pd = (s.pd + 1) % 4;
    else if (a === 'F' || a === 'B') {
      var sg = a === 'F' ? 1 : -1, nx = s.px + DX[s.pd] * sg, ny = s.py + DY[s.pd] * sg;
      if (!canPlayerEnter(L, s, nx, ny)) { ev.push({ t: 'bump', haniwa: haniwaAt(s, nx, ny) }); return ev; }
      s.px = nx; s.py = ny;
    } else if (a !== 'W') return ev;
    s.steps++;
    if (L.gem && !s.gem && s.px === L.gem.x && s.py === L.gem.y) { s.gem = true; ev.push({ t: 'gem' }); }
    if (s.px === L.exit.x && s.py === L.exit.y) { s.won = true; ev.push({ t: 'win' }); return ev; }

    var seen = seenFlags(L, s), i, o, key;
    // 見られた赤は目をさます
    for (i = 0; i < s.h.length; i++) {
      if (seen[i] && s.h[i].st === ASLEEP) { s.h[i].st = AWAKE; ev.push({ t: 'wake', i: i }); }
    }
    // 青：見られていると、視線の向きへ1マスあとずさる（奥のものから）
    var fx = DX[s.pd], fy = DY[s.pd], order = [];
    for (i = 0; i < s.h.length; i++) {
      if (L.haniwa[i].type === 'b' && s.h[i].st === AWAKE && seen[i]) order.push(i);
    }
    order.sort(function (p, q) {
      return (s.h[q].x * fx + s.h[q].y * fy) - (s.h[p].x * fx + s.h[p].y * fy);
    });
    for (var k = 0; k < order.length; k++) {
      i = order[k]; o = s.h[i];
      var tx = o.x + fx, ty = o.y + fy;
      key = visKey(L, s);
      if (opaque(L, key, tx, ty) || haniwaAt(s, tx, ty) >= 0 || (tx === s.px && ty === s.py) ||
          (tx === L.exit.x && ty === L.exit.y)) { ev.push({ t: 'stuck', i: i }); continue; }
      ev.push({ t: 'move', i: i, fx: o.x, fy: o.y, tx: tx, ty: ty });
      o.x = tx; o.y = ty;
      settleIfHome(L, s, i, ev);
    }
    // 赤：見られていなければ、最短の道で1マス寄ってくる（近いものから）
    var dist = distField(L, s), reds = [];
    for (i = 0; i < s.h.length; i++) {
      if (L.haniwa[i].type === 'r' && s.h[i].st === AWAKE && !seen[i]) reds.push(i);
    }
    reds.sort(function (p, q) {
      var dp = dist[s.h[p].y * L.w + s.h[p].x], dq = dist[s.h[q].y * L.w + s.h[q].x];
      return (dp < 0 ? 9999 : dp) - (dq < 0 ? 9999 : dq) || p - q;
    });
    for (k = 0; k < reds.length; k++) {
      i = reds[k]; o = s.h[i];
      var cur = dist[o.y * L.w + o.x];
      if (cur <= 0) continue; // 道がない
      var best = -1, bestScore = -1, adx = Math.abs(s.px - o.x), ady = Math.abs(s.py - o.y);
      for (var d = 0; d < 4; d++) {
        var nx2 = o.x + DX[d], ny2 = o.y + DY[d];
        if (nx2 < 0 || ny2 < 0 || nx2 >= L.w || ny2 >= L.h) continue;
        if (dist[ny2 * L.w + nx2] !== cur - 1) continue;
        // 遠い軸を先に詰める。同じなら北東南西の順
        var sc = (DX[d] !== 0 ? adx : ady) * 8 + (3 - d);
        if (sc > bestScore) { bestScore = sc; best = d; }
      }
      if (best < 0) continue;
      var mx = o.x + DX[best], my = o.y + DY[best];
      if (mx === s.px && my === s.py) {
        s.caught = i;
        ev.push({ t: 'caught', i: i });
        return ev;
      }
      if (haniwaAt(s, mx, my) >= 0) continue;
      ev.push({ t: 'move', i: i, fx: o.x, fy: o.y, tx: mx, ty: my });
      o.x = mx; o.y = my;
      settleIfHome(L, s, i, ev);
    }
    return ev;
  }

  function stateKey(s) {
    var k = s.px + ',' + s.py + ',' + s.pd + (s.gem ? 'g' : '');
    for (var i = 0; i < s.h.length; i++) k += '|' + s.h[i].x + ',' + s.h[i].y + ',' + s.h[i].st;
    return k;
  }

  // ---- 行きづまりの判定 ------------------------------------------------
  // 開始状態から行ける状態をすべて調べ、そこから出口へ届くものに印をつける。
  // 重いので step(ミリ秒) で少しずつ進める。終わるまでは「届く」とみなす。
  function Analyzer(L, cap) {
    this.L = L; this.cap = cap || 200000;
    this.ids = new Map(); this.pred = []; this.winning = []; this.queue = []; this.head = 0;
    this.alive = null; this.done = false; this.failed = false;
    var s0 = initState(L);
    this.ids.set(stateKey(s0), 0); this.pred.push([]); this.queue.push(s0);
  }
  Analyzer.prototype.step = function (ms) {
    if (this.done) return true;
    var t0 = Date.now(), L = this.L, acts = ['F', 'B', 'L', 'R', 'W'], n = 0;
    while (this.head < this.queue.length) {
      var id = this.head, s = this.queue[id];
      this.queue[id] = null; this.head++;
      for (var a = 0; a < 5; a++) {
        var t = clone(s), ev = tick(L, t, acts[a]);
        if ((ev.length && ev[0].t === 'bump') || t.caught >= 0) continue;
        if (t.won) { this.winning.push(id); continue; }
        var k = stateKey(t), tid = this.ids.get(k);
        if (tid === undefined) {
          tid = this.pred.length; this.ids.set(k, tid); this.pred.push([]); this.queue.push(t);
          if (tid > this.cap) { this.done = true; this.failed = true; this.queue = []; return true; }
        }
        this.pred[tid].push(id);
      }
      if ((++n & 31) === 0 && ms && Date.now() - t0 > ms) return false;
    }
    var alive = new Uint8Array(this.pred.length), st = this.winning.slice(), i;
    for (i = 0; i < st.length; i++) alive[st[i]] = 1;
    while (st.length) {
      var c = st.pop(), pr = this.pred[c];
      for (i = 0; i < pr.length; i++) if (!alive[pr[i]]) { alive[pr[i]] = 1; st.push(pr[i]); }
    }
    this.alive = alive; this.done = true; this.queue = [];
    return true;
  };
  Analyzer.prototype.isAlive = function (s) {
    if (!this.done || this.failed) return true;
    var id = this.ids.get(stateKey(s));
    return id === undefined ? true : !!this.alive[id];
  };

  return {
    Analyzer: Analyzer,
    DX: DX, DY: DY, T_FLOOR: T_FLOOR, T_WALL: T_WALL, T_MIRROR: T_MIRROR,
    ASLEEP: ASLEEP, AWAKE: AWAKE, SETTLED: SETTLED,
    parse: parse, initState: initState, clone: clone, tick: tick,
    visKey: visKey, opaque: opaque, haniwaAt: haniwaAt, visibleCells: visibleCells,
    seenFlags: seenFlags, mirrorAhead: mirrorAhead, allSettled: allSettled,
    settledMask: settledMask, stateKey: stateKey, canPlayerEnter: canPlayerEnter
  };
});
