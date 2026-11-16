// REEL DELVE ― ルール本体（描画や入力に依存しない純粋なロジック）
// ブラウザでは window.RD_RULES、node では require で使う。
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.RD_RULES = factory();
})(this, function () {
  'use strict';

  var L = 9;        // リール1本の絵柄数
  var REELS = 5;    // リール本数
  var LANES = 3;    // 窓の段数（＝冒険者の人数）
  var LAST_FLOOR = 12;

  // 絵柄コード
  // . 空き床 / c 金貨 / m 魔物 / t 罠 / x 宝箱 / y 水晶 / p 薬 / u 上り階段 / d 下り階段
  var TILE_NAMES = {
    '.': '空き床', c: '金貨', m: '魔物', t: '罠', x: '宝箱',
    y: '水晶', p: '薬', u: '上り階段', d: '下り階段'
  };
  var HERO_NAMES = { K: '剣士', T: '盗賊', M: '魔導士' };

  // はじめの迷宮。金貨は左3本、魔物は右寄りに置いてあり、1階では3連までしか組めない。
  var START_REELS = [
    'c..c..x.c',
    '.cc.m.y.u',
    'p.c.cd.t.',
    '.m.x..y.m',
    'p.y.xm...'
  ];

  // ---- 乱数（状態を run に持たせ、複製・再現できるようにする） ----
  function rnd(run) {
    run.rs = (run.rs + 0x6D2B79F5) | 0;
    var t = run.rs;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  function newRun(seed) {
    return {
      seed: seed | 0,
      rs: seed | 0,
      reels: START_REELS.map(function (s) { return s.split(''); }),
      pos: [0, 0, 0, 0, 0],
      order: ['K', 'T', 'M'],
      hp: 5, maxHp: 5, gold: 0, mana: 3, maxMana: 9,
      floor: 1,
      up: { sword: 0, key: 0, staff: 0, brake: 0, hp: 0 },
      stats: { best: 0, hits: 0, jackpots: 0, dmg: 0, kills: 0, chests: 0, earned: 0, gateFails: 0, spins: 0, perfects: 0 },
      rests: 0, won: false, dead: false
    };
  }

  function cloneRun(r) { return JSON.parse(JSON.stringify(r)); }

  function mod(a) { return ((a % L) + L) % L; }

  // 門：その階で必要な連鎖数（0 なら門なし）
  function gateNeed(floor) {
    if (floor === 4) return 3;
    if (floor === 8) return 4;
    if (floor === 12) return 5;
    return 0;
  }
  function nextGate(floor) {
    for (var f = floor; f <= LAST_FLOOR; f++) if (gateNeed(f)) return { floor: f, need: gateNeed(f) };
    return null;
  }
  function stratum(floor) { return floor <= 4 ? 1 : floor <= 8 ? 2 : 3; }

  function tileAt(run, pos, col, lane) {
    return run.reels[col][mod(pos[col] + lane)];
  }

  // 隣り合う入れ替えの最小回数（隊列の入れ替えコスト）
  function swapCost(from, to) {
    var idx = to.map(function (h) { return from.indexOf(h); });
    var n = 0;
    for (var i = 0; i < idx.length; i++) for (var j = i + 1; j < idx.length; j++) if (idx[i] > idx[j]) n++;
    return n;
  }
  // リールのずらしコスト（巡回の最短距離）
  function nudgeCost(a, b) {
    var d = mod(a - b);
    return Math.min(d, L - d);
  }

  function rewardFor(run, kind, n) {
    if (kind === 'coin') return { gold: 1 * n };
    if (kind === 'kill') return { gold: (2 + run.up.sword) * n };
    if (kind === 'open') return { gold: (4 + 2 * run.up.key) * n };
    if (kind === 'disarm') return { gold: 1 * n };
    if (kind === 'crystal') return { mana: (1 + run.up.staff) * n };
    if (kind === 'potion') return { heal: 1 };
    return {};
  }

  // 1マス踏んだときの結果の種類
  function stepKind(hero, tile) {
    switch (tile) {
      case '.': return 'empty';
      case 'c': return 'coin';
      case 'm': return hero === 'K' ? 'kill' : 'hurt';
      case 't': return hero === 'T' ? 'disarm' : 'hurt';
      case 'x': return hero === 'T' ? 'open' : 'pass';
      case 'y': return hero === 'M' ? 'crystal' : 'pass';
      case 'p': return 'potion';
      case 'u': case 'd': return 'stairs';
    }
    return 'empty';
  }
  var STREAK_KINDS = { coin: 1, kill: 1, open: 1, disarm: 1, crystal: 1, potion: 1 };
  var CONSUME_KINDS = STREAK_KINDS;

  // 歩行の解決。run は変更しない。
  // pos: 各リールの停止位置 / order: 入場時の隊列（上段から）
  function resolve(run, pos, order) {
    var ord = order.slice();
    var streak = { K: { k: null, n: 0 }, T: { k: null, n: 0 }, M: { k: null, n: 0 } };
    var hp = run.hp, res = {
      cols: [], gold: 0, mana: 0, dmg: 0, heal: 0, maxStreak: 0, hits: 0, jackpots: 0,
      consumed: [], endOrder: null, dead: false, kills: 0, chests: 0, startOrder: order.slice()
    };
    for (var c = 0; c < REELS; c++) {
      var col = { events: [], swaps: [], orderBefore: ord.slice(), orderAfter: null };
      for (var lane = 0; lane < LANES; lane++) {
        var hero = ord[lane];
        var tile = tileAt(run, pos, c, lane);
        var kind = stepKind(hero, tile);
        var ev = { lane: lane, hero: hero, tile: tile, kind: kind, n: 0, gold: 0, mana: 0, dmg: 0, heal: 0, hit: 0 };
        var st = streak[hero];
        if (STREAK_KINDS[kind]) {
          if (st.k === kind) st.n++; else { st.k = kind; st.n = 1; }
          ev.n = st.n;
          var rw = rewardFor(run, kind, st.n);
          ev.gold = rw.gold || 0; ev.mana = rw.mana || 0;
          if (rw.heal && hp < run.maxHp) { ev.heal = 1; hp++; res.heal++; }
          res.gold += ev.gold; res.mana += ev.mana;
          if (st.n > res.maxStreak) res.maxStreak = st.n;
          if (st.n === 3) { ev.hit = 3; res.hits++; }
          if (st.n === 5) { ev.hit = 5; res.jackpots++; }
          if (kind === 'kill') res.kills++;
          if (kind === 'open') res.chests++;
          res.consumed.push({ reel: c, idx: mod(pos[c] + lane) });
        } else if (kind === 'stairs') {
          // 階段は連鎖を切らない（数にも入らない）
        } else {
          st.k = null; st.n = 0;
          if (kind === 'hurt') { ev.dmg = 1; hp--; res.dmg++; }
        }
        col.events.push(ev);
      }
      // 階段：上の段から順に働く。その列で一度動いた人はもう動かない。
      var moved = {};
      for (var ln = 0; ln < LANES; ln++) {
        var tl = tileAt(run, pos, c, ln);
        if (tl !== 'u' && tl !== 'd') continue;
        var who = col.orderBefore[ln];
        var to = tl === 'u' ? ln - 1 : ln + 1;
        if (to < 0 || to >= LANES) { col.swaps.push({ lane: ln, to: ln, hero: who, bump: true }); continue; }
        var cur = ord.indexOf(who);
        var partner = ord[to];
        if (moved[who] || moved[partner] || cur !== ln) { col.swaps.push({ lane: ln, to: ln, hero: who, bump: true }); continue; }
        ord[to] = who; ord[ln] = partner;
        moved[who] = moved[partner] = true;
        col.swaps.push({ lane: ln, to: to, hero: who, partner: partner });
      }
      col.orderAfter = ord.slice();
      res.cols.push(col);
      if (hp <= 0) { res.dead = true; res.deadCol = c; break; }
    }
    res.endOrder = ord.slice();
    res.hpAfter = hp;
    return res;
  }

  // 歩行結果を run に反映する。門の判定もここで行う。
  function applyWalk(run, pos, res) {
    var out = { gate: gateNeed(run.floor), gateOpen: false, gateFail: false, advanced: false };
    run.pos = pos.slice();
    run.order = res.endOrder.slice();
    var failed = out.gate && res.maxStreak < out.gate && res.hpAfter > 0;
    // 門を開けられなかった階の稼ぎは、門番に取り上げられる
    if (failed) out.forfeit = res.gold; else run.gold += res.gold;
    run.mana = Math.min(run.maxMana, run.mana + res.mana);
    run.hp = Math.max(0, Math.min(run.maxHp, res.hpAfter));
    res.consumed.forEach(function (q) { run.reels[q.reel][q.idx] = '.'; });
    var s = run.stats;
    s.spins++; s.dmg += res.dmg; s.kills += res.kills; s.chests += res.chests; if (!failed) s.earned += res.gold;
    s.hits += res.hits; s.jackpots += res.jackpots;
    if (res.maxStreak > s.best) s.best = res.maxStreak;
    if (run.hp <= 0) { run.dead = true; return out; }
    if (out.gate) {
      if (res.maxStreak >= out.gate) out.gateOpen = true;
      else {
        out.gateFail = true; s.gateFails++;
        run.hp -= 1; s.dmg++;
        if (run.hp <= 0) { run.dead = true; return out; }
        return out;
      }
    }
    out.advanced = true;
    if (run.floor >= LAST_FLOOR) { run.won = true; return out; }
    run.floor++;
    return out;
  }

  // 迷宮の脈動：空き床に新しい絵柄が湧く。深いほど危険が増える。
  var SPAWN_TABLE = {
    1: [['c', 46], ['m', 24], ['t', 8], ['x', 9], ['y', 9], ['p', 4]],
    2: [['c', 36], ['m', 30], ['t', 14], ['x', 8], ['y', 8], ['p', 4]],
    3: [['c', 30], ['m', 33], ['t', 19], ['x', 7], ['y', 7], ['p', 4]]
  };
  function pick(run, table) {
    var tot = 0, i;
    for (i = 0; i < table.length; i++) tot += table[i][1];
    var r = rnd(run) * tot;
    for (i = 0; i < table.length; i++) { r -= table[i][1]; if (r < 0) return table[i][0]; }
    return table[0][0];
  }
  // weak: 門を開けられなかったあとは、脈が弱く、ほとんど湧かない
  function regrow(run, weak) {
    var spawned = [];
    var table = SPAWN_TABLE[stratum(run.floor)];
    run.mana = Math.min(run.maxMana, run.mana + 1); // 野営のたびに魔力が1戻る
    for (var c = 0; c < REELS; c++) {
      var st = stratum(run.floor);
      var n = (st === 3 ? 2 : 1) + (rnd(run) < [0.45, 0.7, 0.3][st - 1] ? 1 : 0);
      if (weak) n = rnd(run) < 0.35 ? 1 : 0;
      for (var k = 0; k < n; k++) {
        var empties = [];
        for (var i = 0; i < L; i++) if (run.reels[c][i] === '.') empties.push(i);
        if (empties.length <= 2) break; // 通り道が詰まりきらないよう、空きは少し残す
        var idx = empties[Math.floor(rnd(run) * empties.length)];
        var t = pick(run, table);
        run.reels[c][idx] = t;
        spawned.push({ reel: c, idx: idx, tile: t });
      }
    }
    return spawned;
  }

  // ---- 野営（買い物） ----
  var ITEMS = {
    plant_c: { name: '金貨の種', desc: '好きなマスに「金貨」を置く', plant: 'c', price: function () { return 4; } },
    plant_x: { name: '宝箱', desc: '好きなマスに「宝箱」を置く', plant: 'x', price: function () { return 8; } },
    plant_y: { name: '水晶', desc: '好きなマスに「水晶」を置く', plant: 'y', price: function () { return 6; } },
    plant_p: { name: '薬', desc: '好きなマスに「薬」を置く', plant: 'p', price: function () { return 7; } },
    plant_u: { name: '上り階段', desc: '好きなマスに「上り階段」を置く', plant: 'u', price: function () { return 5; } },
    plant_d: { name: '下り階段', desc: '好きなマスに「下り階段」を置く', plant: 'd', price: function () { return 5; } },
    up_sword: { name: '剣を研ぐ', desc: '剣士の魔物退治の報酬 +1', up: 'sword', max: 3, price: function (r) { return 14 + 8 * r.up.sword; } },
    up_key: { name: '鍵開けの腕', desc: '盗賊の宝箱の報酬 +2', up: 'key', max: 3, price: function (r) { return 14 + 8 * r.up.key; } },
    up_staff: { name: '杖の調律', desc: '魔導士が水晶から得る魔力 +1', up: 'staff', max: 2, price: function (r) { return 12 + 8 * r.up.staff; } },
    up_hp: { name: '丈夫な鎧', desc: '体力の上限 +1（1回復）', up: 'hp', max: 3, price: function (r) { return 14 + 6 * r.up.hp; } },
    up_brake: { name: 'ブレーキ油', desc: 'リールの回転がゆっくりになる', up: 'brake', max: 2, price: function (r) { return 10 + 6 * r.up.brake; } },
    rest: { name: '焚き火で休む', desc: '体力を 1 回復（休むたび値上がり）', price: function (r) { return 5 + 3 * r.rests; } }
  };
  function itemAvailable(run, id) {
    var it = ITEMS[id];
    if (it.up && run.up[it.up] >= it.max) return false;
    if (id === 'rest' && run.hp >= run.maxHp) return false;
    return true;
  }
  function genOffers(run) {
    var plants = ['plant_x', 'plant_y', 'plant_p', 'plant_u', 'plant_d'];
    var ups = ['up_sword', 'up_key', 'up_staff', 'up_hp', 'up_brake'].filter(function (id) { return itemAvailable(run, id); });
    var out = [];
    function take(list) {
      if (!list.length) return;
      var i = Math.floor(rnd(run) * list.length);
      out.push(list.splice(i, 1)[0]);
    }
    take(plants); take(plants);
    if (ups.length) take(ups); else take(plants);
    out.push('plant_c'); // 金貨の種はいつでも買える
    return out;
  }
  function priceOf(run, id) { return ITEMS[id].price(run); }
  // 購入。植える品は reel/idx を指定する。成功なら true。
  function buy(run, id, reel, idx) {
    var it = ITEMS[id];
    if (!it || !itemAvailable(run, id)) return false;
    var p = priceOf(run, id);
    if (run.gold < p) return false;
    if (it.plant) {
      if (reel == null || idx == null) return false;
      if (run.reels[reel][idx] === it.plant) return false;
      run.reels[reel][idx] = it.plant;
    } else if (it.up) {
      run.up[it.up]++;
      if (it.up === 'hp') { run.maxHp++; run.hp = Math.min(run.maxHp, run.hp + 1); }
    } else if (id === 'rest') {
      run.hp = Math.min(run.maxHp, run.hp + 1);
      run.rests++;
    }
    run.gold -= p;
    return true;
  }

  // 回転速度（絵柄／秒）
  function spinSpeed(run, reel) {
    var base = [2.3, 3.0, 3.7][stratum(run.floor) - 1];
    var per = [1.0, 1.06, 0.94, 1.1, 1.0][reel];
    return base * per * Math.pow(0.84, run.up.brake);
  }

  // 評価は「踏破までに稼いだ総額」で決める
  // 目押しが5本とも狙いどおりだったときのごほうび
  function perfectBonus(run) {
    var b = 2 + stratum(run.floor);
    run.gold += b; run.stats.earned += b; run.stats.perfects++;
    return b;
  }
  function rankOf(earned) {
    if (earned >= 440) return { id: 'S', name: '竜王の客人' };
    if (earned >= 340) return { id: 'A', name: '黄金の一行' };
    if (earned >= 250) return { id: 'B', name: '腕利きの一行' };
    return { id: 'C', name: '生還者' };
  }

  return {
    L: L, REELS: REELS, LANES: LANES, LAST_FLOOR: LAST_FLOOR,
    TILE_NAMES: TILE_NAMES, HERO_NAMES: HERO_NAMES, ITEMS: ITEMS,
    newRun: newRun, cloneRun: cloneRun, rnd: rnd, mod: mod,
    gateNeed: gateNeed, nextGate: nextGate, stratum: stratum,
    tileAt: tileAt, swapCost: swapCost, nudgeCost: nudgeCost,
    stepKind: stepKind, resolve: resolve, applyWalk: applyWalk, regrow: regrow,
    genOffers: genOffers, priceOf: priceOf, buy: buy, itemAvailable: itemAvailable,
    spinSpeed: spinSpeed, rankOf: rankOf, perfectBonus: perfectBonus
  };
});
