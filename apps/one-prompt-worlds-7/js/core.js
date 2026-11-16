/*
 * 切りもどし — ルールの核（描画なし。ブラウザと node の両方で使う）
 *
 * ルールは4つだけ。
 *  1. 春が来ると、芽は向いている方へ1ます伸びる。
 *  2. 水（樹勢）は高い芽から順にとどく。足りない芽は眠る。
 *  3. 枝を切ると、裸になった切り口は左右ななめに二つの芽を吹く。
 *  4. ひだまりに入った芽は花になって止まる。しずくに届いた枝は水が1つ増える。
 */
(function (root) {
  'use strict';

  // 向き: 0=上 1=右上 2=右 3=右下 4=下 5=左下 6=左 7=左上（yは上が正）
  var DX = [0, 1, 1, 1, 0, -1, -1, -1];
  var DY = [1, 1, 0, -1, -1, -1, 0, 1];

  function key(x, y) { return x + ',' + y; }

  // レベル文字列を読む。'.'空き '#'石 '*'ひだまり 'o'しずく 'R'根
  function parseLevel(def) {
    var rows = def.map, h = rows.length, w = rows[0].length;
    var L = {
      name: def.name, sub: def.sub || '', hint: def.hint || '', vigor: def.vigor || 2,
      par: def.par || 0, free: !!def.free, dir: def.dir || 0, w: w, h: h,
      stones: {}, suns: [], dews: [], root: null, sunAt: {}, dewAt: {}
    };
    for (var r = 0; r < h; r++) {
      for (var x = 0; x < w; x++) {
        var c = rows[r][x], y = h - 1 - r;
        if (c === '#') L.stones[key(x, y)] = true;
        else if (c === '*') { L.sunAt[key(x, y)] = L.suns.length; L.suns.push({ x: x, y: y }); }
        else if (c === 'o') { L.dewAt[key(x, y)] = L.dews.length; L.dews.push({ x: x, y: y }); }
        else if (c === 'R') L.root = { x: x, y: y };
      }
    }
    return L;
  }

  function newState(L) {
    return {
      year: 0, nextId: 1, rootId: 0,
      nodes: { 0: { id: 0, x: L.root.x, y: L.root.y, parent: -1, din: L.dir, children: [], buds: [L.dir], bloom: false, born: 0 } }
    };
  }

  function clone(S) {
    var N = {}, k, n;
    for (k in S.nodes) {
      n = S.nodes[k];
      N[k] = { id: n.id, x: n.x, y: n.y, parent: n.parent, din: n.din, children: n.children.slice(), buds: n.buds.slice(), bloom: n.bloom, born: n.born };
    }
    return { year: S.year, nextId: S.nextId, rootId: S.rootId, nodes: N };
  }

  function occupancy(S) {
    var occ = {}, diag = {}, k, n, p;
    for (k in S.nodes) {
      n = S.nodes[k];
      occ[key(n.x, n.y)] = n.id;
      if (n.parent >= 0) {
        p = S.nodes[n.parent];
        if (p.x !== n.x && p.y !== n.y) diag[diagKey(p.x, p.y, n.x, n.y)] = true;
      }
    }
    return { occ: occ, diag: diag };
  }
  // 斜めの枝どうしの交差を調べるための鍵
  function diagKey(x0, y0, x1, y1) {
    var mx = Math.min(x0, x1), my = Math.min(y0, y1);
    var slope = ((x1 - x0) * (y1 - y0) > 0) ? 'a' : 'b';
    return mx + ',' + my + ',' + slope;
  }
  function crossKey(x0, y0, x1, y1) {
    var mx = Math.min(x0, x1), my = Math.min(y0, y1);
    var slope = ((x1 - x0) * (y1 - y0) > 0) ? 'b' : 'a';
    return mx + ',' + my + ',' + slope;
  }

  function vigor(S, L) {
    var v = L.vigor, k, n;
    for (k in S.nodes) { n = S.nodes[k]; if (L.dewAt[key(n.x, n.y)] !== undefined) v++; }
    return v;
  }

  // 全ての芽を、水がとどく順に並べる
  function budList(S) {
    var list = [], k, n, i, d;
    for (k in S.nodes) {
      n = S.nodes[k];
      for (i = 0; i < n.buds.length; i++) {
        d = n.buds[i];
        list.push({ node: n.id, dir: d, x: n.x, y: n.y, tx: n.x + DX[d], ty: n.y + DY[d] });
      }
    }
    list.sort(function (a, b) {
      return (b.y - a.y) || (b.ty - a.ty) || (a.x - b.x) || (a.tx - b.tx) || (a.dir - b.dir);
    });
    return list;
  }

  // 次の春に何が起きるか。status: 'grow' | 'sleep'(水が足りない) | 'block'(行き先がふさがっている)
  function plan(S, L) {
    var o = occupancy(S), list = budList(S), left = vigor(S, L), i, b, k, free;
    for (i = 0; i < list.length; i++) {
      b = list[i]; k = key(b.tx, b.ty);
      free = b.tx >= 0 && b.tx < L.w && b.ty >= 0 && b.ty < L.h && !L.stones[k] && o.occ[k] === undefined;
      if (free && b.tx !== b.x && b.ty !== b.y && o.diag[crossKey(b.x, b.y, b.tx, b.ty)]) free = false;
      if (!free) { b.status = 'block'; continue; }
      if (left <= 0) { b.status = 'sleep'; continue; }
      b.status = 'grow'; left--;
      b.bloom = L.sunAt[k] !== undefined;
      b.dew = L.dewAt[k] !== undefined;
      o.occ[k] = -2;
      if (b.tx !== b.x && b.ty !== b.y) o.diag[diagKey(b.x, b.y, b.tx, b.ty)] = true;
    }
    return list;
  }

  // 春を呼ぶ。伸びた芽の一覧を返す（その場で S を書き換える）
  function spring(S, L) {
    var p = plan(S, L), grown = [], i, b, n, id;
    for (i = 0; i < p.length; i++) {
      b = p[i];
      if (b.status !== 'grow') continue;
      n = S.nodes[b.node];
      n.buds.splice(n.buds.indexOf(b.dir), 1);
      id = S.nextId++;
      S.nodes[id] = { id: id, x: b.tx, y: b.ty, parent: n.id, din: b.dir, children: [], buds: b.bloom ? [] : [b.dir], bloom: !!b.bloom, born: S.year + 1 };
      n.children.push(id);
      grown.push({ id: id, from: n.id, bloom: !!b.bloom, dew: !!b.dew });
    }
    S.year++;
    return grown;
  }

  function subtree(S, id) {
    var out = [], st = [id], n;
    while (st.length) { n = S.nodes[st.pop()]; out.push(n.id); for (var i = 0; i < n.children.length; i++) st.push(n.children[i]); }
    return out;
  }

  // id の節へ入る枝を切る。切り落とした節の一覧を返す
  function cut(S, id) {
    var n = S.nodes[id];
    if (!n || n.parent < 0) return null;
    var p = S.nodes[n.parent], ids = subtree(S, id), removed = [], i;
    for (i = 0; i < ids.length; i++) { removed.push(S.nodes[ids[i]]); delete S.nodes[ids[i]]; }
    p.children.splice(p.children.indexOf(id), 1);
    var forked = false;
    if (p.children.length === 0 && p.buds.length === 0) { p.buds = [(p.din + 7) % 8, (p.din + 1) % 8]; forked = true; }
    return { removed: removed, parent: p.id, forked: forked };
  }

  function bloomed(S, L) {
    var c = 0, k, n;
    for (k in S.nodes) { n = S.nodes[k]; if (n.bloom) c++; }
    return c;
  }
  function solved(S, L) { return !L.free && L.suns.length > 0 && bloomed(S, L) === L.suns.length; }

  // 形だけで決まる状態の鍵（探索の重複除去用）
  function stateKey(S) {
    var a = [], k, n;
    for (k in S.nodes) { n = S.nodes[k]; a.push(n.x + ',' + n.y + ',' + n.din + ':' + n.buds.slice().sort().join('')); }
    return a.sort().join('|');
  }

  var api = { DX: DX, DY: DY, key: key, parseLevel: parseLevel, newState: newState, clone: clone, vigor: vigor, plan: plan, spring: spring, cut: cut, subtree: subtree, bloomed: bloomed, solved: solved, stateKey: stateKey };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.KIRI = api;
})(this);
