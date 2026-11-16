// REEL DELVE ― 進行・入力・描画
(function () {
  'use strict';
  var R = window.RD_RULES, A = window.RD_ART, SND = window.RD_AUDIO, C = A.COL;
  var W = 1280, H = 720;
  var RX0 = 330, RW = 104, RSTEP = 118, TH = 60, Y0 = 96;
  var WIN_Y = Y0 + 3 * TH, WIN_H = 3 * TH;
  var ENTRY_X = 258, EXIT_X = 962;
  var PX = 1016, PW = 248; // 右パネル
  var FONT = "'Hiragino Kaku Gothic ProN','Yu Gothic UI','Meiryo',sans-serif";
  var TAU = Math.PI * 2;

  var canvas = document.getElementById('c');
  var ctx = canvas.getContext('2d');
  var scale = 1;
  function fit() {
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var s = Math.min(window.innerWidth / W, window.innerHeight / H);
    canvas.style.width = Math.floor(W * s) + 'px';
    canvas.style.height = Math.floor(H * s) + 'px';
    canvas.width = Math.round(W * s * dpr); canvas.height = Math.round(H * s * dpr);
    scale = canvas.width / W;
  }
  window.addEventListener('resize', fit); fit();

  function reelX(c) { return RX0 + c * RSTEP; }
  function reelCX(c) { return reelX(c) + RW / 2; }
  function laneCY(l) { return WIN_Y + l * TH + TH / 2; }
  function feetY(l) { return laneCY(l) + 22; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function ease(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

  var G = {
    phase: 'title', t: 0, pt: 0, run: null,
    pos: [0, 0, 0, 0, 0], order: ['K', 'T', 'M'], base: null, free: true, target: null,
    rv: [], preview: null, heroes: {}, disp: { gold: 0, mana: 0, hp: 0 },
    fx: [], timers: [], shake: 0, flash: null, banner: null,
    camp: { offers: [], sel: null }, eaten: {}, spawnAt: {}, lampN: 0, lampPop: 0,
    hover: null, mouse: { x: 0, y: 0, down: false }, drag: null, buttons: [],
    sel: 0, kb: false, fastHeld: false, floorGold: 0, manaFlash: 0, restartArm: 0,
    gateInfo: null, best: null, seen: {}
  };
  for (var i0 = 0; i0 < 5; i0++) G.rv.push({ off: 0, spinning: false, stopping: false, v: 0, bounce: 0, spinT: 0, good: false });
  try { G.best = JSON.parse(localStorage.getItem('reeldelve.best') || 'null'); } catch (e) { G.best = null; }
  var dbg = { hold: false, fast: false };

  // ------------------------------------------------------------ 進行
  function startRun(seed) {
    G.run = R.newRun(seed == null ? (Date.now() & 0x7fffffff) : seed);
    G.pos = G.run.pos.slice(); G.order = G.run.order.slice();
    G.disp = { gold: 0, mana: G.run.mana, hp: G.run.hp };
    G.fx = []; G.timers = []; G.eaten = {}; G.spawnAt = {}; G.banner = null; G.camp.sel = null;
    ['K', 'T', 'M'].forEach(function (h, i) { G.heroes[h] = { x: 60, y: feetY(i), walk: 0, mood: 0, moodT: 0, moving: false }; });
    for (var c = 0; c < 5; c++) { G.rv[c].off = 0; G.rv[c].spinning = false; G.rv[c].stopping = false; }
    enterIntro();
  }
  function setPhase(p) { G.phase = p; G.pt = 0; }

  function enterIntro() {
    setPhase('intro');
    G.lampN = 0; G.floorGold = 0; G.base = null; G.target = null; G.camp.sel = null; G.viewFloor = G.run.floor;
    G.order = G.run.order.slice(); G.pos = G.run.pos.slice();
    ['K', 'T', 'M'].forEach(function (h) { var l = G.order.indexOf(h); G.heroes[h].x = 110 - l * 6; G.heroes[h].y = feetY(l); G.heroes[h].mood = 0; });
    SND.play('floor');
  }
  function enterPlan() { setPhase('arrange'); G.free = true; G.base = null; G.target = null; }

  function arrangeCost(pos, order) {
    var cost = R.swapCost(G.run.order, order);
    if (!G.free && G.base) for (var c = 0; c < 5; c++) cost += R.nudgeCost(pos[c], G.base[c]);
    return cost;
  }
  function deny() { SND.play('deny'); G.manaFlash = 0.6; }

  function rotate(c, d) {
    if (G.phase !== 'arrange' || !d) return false;
    var np = G.pos.slice(); np[c] = R.mod(np[c] + d);
    if (arrangeCost(np, G.order) > G.run.mana) { deny(); return false; }
    G.pos = np; G.rv[c].off += d; SND.play('rotate');
    return true;
  }
  function swapLanes(a) { // a と a+1 の段を入れ替える
    if (G.phase !== 'arrange') return;
    var no = G.order.slice(); var t = no[a]; no[a] = no[a + 1]; no[a + 1] = t;
    if (arrangeCost(G.pos, no) > G.run.mana) { deny(); return; }
    G.order = no; SND.play('swap');
  }

  function pullLever() {
    if (G.phase !== 'arrange' || !G.free) return;
    var cost = arrangeCost(G.pos, G.order);
    G.run.mana -= cost; G.disp.mana = G.run.mana; G.run.order = G.order.slice();
    G.target = G.pos.slice();
    setPhase('spin'); SND.play('lever');
    for (var c = 0; c < 5; c++) {
      var rv = G.rv[c];
      // 目印が一度に重ならないよう、回し始めの位置をリールごとにずらす
      var kick = (3 + c * 2 + Math.floor(Math.random() * 3)) % R.L;
      G.pos[c] = R.mod(G.pos[c] + kick);
      rv.off = Math.random() * 0.9; rv.spinning = true; rv.stopping = false; rv.spinT = -c * 0.05;
      rv.v = R.spinSpeed(G.run, c);
    }
  }
  function stopReel(c) {
    var rv = G.rv[c];
    if (G.phase !== 'spin' || !rv.spinning || rv.stopping || rv.spinT < 0.2) return false;
    rv.stopping = true; return true;
  }
  function stopNext() { for (var c = 0; c < 5; c++) if (G.rv[c].spinning && !G.rv[c].stopping) { stopReel(c); return; } }
  function landed(c) {
    var rv = G.rv[c];
    rv.spinning = false; rv.stopping = false; rv.off = 0; rv.bounce = 1;
    rv.good = G.pos[c] === G.target[c];
    SND.play('stop', rv.good);
    burst(reelCX(c), WIN_Y + WIN_H / 2, rv.good ? C.gold : '#8892b0', rv.good ? 10 : 4, 120);
    if (!rv.good) floatText(reelCX(c), WIN_Y - 12, 'ずれた', '#aab2cc', 16);
    var left = 0; for (var k = 0; k < 5; k++) if (G.rv[k].spinning) left++;
    if (left === 1) {
      var allGood = true; for (k = 0; k < 5; k++) if (!G.rv[k].spinning && G.pos[k] !== G.target[k]) allGood = false;
      var p = R.resolve(G.run, G.target, G.run.order);
      if (allGood && p.maxStreak >= 3) { G.reach = true; SND.play('reach'); }
    }
    if (left === 0) {
      G.reach = false; G.base = G.pos.slice(); setPhase('arrange'); G.free = false;
      var perfect = true; for (k = 0; k < 5; k++) if (G.pos[k] !== G.target[k]) perfect = false;
      if (perfect) { // 5本とも狙いどおり
        var pb = R.perfectBonus(G.run); G.disp.gold = G.run.gold;
        later(0.25, function () { SND.play('hit'); });
        G.banner = { text: 'ぴたり！', sub: '5本とも狙いどおり ― 金 +' + pb, c: C.gold, t: 0, dur: 1.3, small: true };
        for (k = 0; k < 5; k++) burst(reelCX(k), WIN_Y + WIN_H / 2, C.gold, 8, 200);
      }
    }
  }

  function go() {
    if (G.phase !== 'arrange' || G.free) return;
    var cost = arrangeCost(G.pos, G.order);
    if (cost > G.run.mana) { deny(); return; }
    G.run.mana -= cost; G.disp.mana = G.run.mana;
    var res = R.resolve(G.run, G.pos, G.order);
    G.walk = { res: res, col: -1, st: 'move', t: 0, lanes: {}, from: {}, to: {} };
    G.order.forEach(function (h, l) { G.walk.lanes[h] = l; });
    G.lampN = 0; G.floorGold = 0;
    setPhase('walk'); beginMove(0);
  }
  function beginMove(col) {
    var w = G.walk; w.col = col; w.st = 'move'; w.t = 0;
    ['K', 'T', 'M'].forEach(function (h) { w.from[h] = G.heroes[h].x; w.to[h] = col >= 5 ? 1040 : reelCX(col) - 4; });
  }
  function fireEvents(col) {
    var cd = G.walk.res.cols[col];
    var big = 0;
    cd.events.forEach(function (ev, i) {
      later(i * 0.1, function () { fireEvent(col, ev); });
      if (ev.hit === 5) big = Math.max(big, 1.2); else if (ev.hit === 3) big = Math.max(big, 0.55);
    });
    return 0.42 + big;
  }
  function fireEvent(col, ev) {
    var x = reelCX(col), y = laneCY(ev.lane), h = G.heroes[ev.hero];
    var key = col + ':' + R.mod(G.pos[col] + ev.lane);
    var k = ev.kind;
    if (k === 'empty') { SND.play('step'); return; }
    if (k === 'stairs') return;
    if (k === 'pass') { SND.play('pass'); floatText(x, y - 26, '…', '#aab2cc', 18); return; }
    if (k === 'hurt') {
      SND.play('hurt'); G.disp.hp--; G.shake = 0.35; G.flash = { c: '255,60,60', a: 0.3 };
      h.mood = 2; h.moodT = 0.6; floatText(x, y - 30, '体力 −1', C.bad, 22); burst(x, y, C.bad, 12, 200);
      return;
    }
    G.eaten[key] = G.t;
    h.mood = 1; h.moodT = 0.45;
    if (ev.n > G.lampN) { G.lampN = ev.n; G.lampPop = 0.4; }
    if (k === 'coin') { SND.play('coin', ev.n); burst(x, y, C.gold, 6 + ev.n * 2, 150); }
    else if (k === 'kill') { SND.play('kill', ev.n); G.fx.push({ type: 'slash', x: x, y: y, t: 0, dur: 0.25 }); burst(x, y, C.mon, 14, 230); G.shake = Math.max(G.shake, 0.12); }
    else if (k === 'open') { SND.play('open', ev.n); burst(x, y - 6, C.gold, 16, 240); G.fx.push({ type: 'ring', x: x, y: y, c: C.gold, t: 0, dur: 0.4, r: 46 }); }
    else if (k === 'crystal') { SND.play('crystal', ev.n); G.fx.push({ type: 'ring', x: x, y: y, c: C.cry, t: 0, dur: 0.5, r: 54 }); burst(x, y, C.cry, 10, 160); G.disp.mana = Math.min(G.run.maxMana, G.disp.mana + ev.mana); }
    else if (k === 'potion') { SND.play('potion'); burst(x, y, C.pot, 10, 140); if (ev.heal) G.disp.hp++; }
    else if (k === 'disarm') { SND.play('disarm', ev.n); burst(x, y, C.steel, 10, 200); }
    if (ev.gold) {
      G.disp.gold += ev.gold; G.floorGold += ev.gold;
      floatText(x, y - 30, '+' + ev.gold, C.gold, 20 + Math.min(12, ev.n * 3));
      for (var i = 0; i < Math.min(6, ev.gold); i++) G.fx.push({ type: 'fly', x0: x, y0: y, x1: 1068, y1: 42, t: -i * 0.04, dur: 0.5, c: C.gold });
    } else if (ev.mana) floatText(x, y - 30, '魔力 +' + ev.mana, C.mana, 20);
    else if (k === 'potion') floatText(x, y - 30, ev.heal ? '体力 +1' : '満タン', C.pot, 20);
    if (ev.n >= 2) floatText(x, y + 34, ev.n + '連', '#fff', 16 + ev.n * 2, 0.9);
    if (ev.hit === 3) { later(0.12, function () { SND.play('hit'); }); G.banner = { text: 'HIT!', sub: R.HERO_NAMES[ev.hero] + 'の3連', c: C[ev.hero], t: 0, dur: 1.0 }; burst(x, y, '#fff', 24, 320); }
    if (ev.hit === 5) {
      later(0.12, function () { SND.play('jackpot'); });
      G.banner = { text: 'JACKPOT!!', sub: R.HERO_NAMES[ev.hero] + 'の5連', c: C.gold, t: 0, dur: 1.8 };
      G.shake = 0.6; G.flash = { c: '255,230,140', a: 0.5 };
      for (var j = 0; j < 5; j++) burst(reelCX(j), y, j % 2 ? C.gold : '#fff', 26, 380);
    }
  }
  function finishWalk() {
    var res = G.walk.res;
    var gate = R.gateNeed(G.run.floor);
    var out = R.applyWalk(G.run, G.pos, res);
    G.order = G.run.order.slice();
    G.eaten = {};
    G.disp.mana = G.run.mana;
    if (G.run.dead && !out.gateFail) { enterOver(); return; }
    if (gate) {
      G.gateInfo = out; setPhase('gate');
      if (out.gateOpen) {
        SND.play('gateOpen'); G.shake = 0.5;
        G.banner = { text: '門が開いた！', sub: gate + '連の封印を解いた', c: C.gold, t: 0, dur: 2.0 };
        G.disp.gold = G.run.gold; G.disp.hp = G.run.hp;
      } else {
        SND.play('gateFail'); G.shake = 0.4; G.flash = { c: '255,60,60', a: 0.3 };
        G.banner = { text: '門は開かない…', sub: 'この階の稼ぎ ' + (out.forfeit || 0) + ' を没収・体力 −1', c: C.bad, t: 0, dur: 2.4 };
        G.disp.gold = G.run.gold; G.disp.hp = G.run.hp;
      }
      return;
    }
    G.disp.gold = G.run.gold; G.disp.hp = G.run.hp;
    afterFloor();
  }
  function afterFloor() {
    if (G.run.dead) { enterOver(); return; }
    if (G.run.won) { enterWin(); return; }
    var weak = !!(G.gateInfo && G.gateInfo.gateFail); G.gateInfo = null; G.weakCamp = weak;
    var sp = R.regrow(G.run, weak);
    G.spawnAt = {};
    sp.forEach(function (s, i) {
      G.spawnAt[s.reel + ':' + s.idx] = G.t + 0.3 + i * 0.13;
      later(0.3 + i * 0.13, function () {
        SND.play('spawn', i);
        var row = rowOf(s.reel, s.idx);
        if (row != null) G.fx.push({ type: 'ring', x: reelCX(s.reel), y: Y0 + row * TH + TH / 2, c: s.tile === 'm' || s.tile === 't' ? C.mon : '#cfd6ee', t: 0, dur: 0.45, r: 40 });
      });
    });
    G.regrowDur = 0.3 + sp.length * 0.13 + 0.7; G.disp.mana = G.run.mana;
    setPhase('regrow');
    G.banner = { text: weak ? '迷宮の脈が弱い' : '迷宮が脈打つ', sub: (weak ? '門の前では、ほとんど何も湧かない' : '空いた床に新しいものが湧いた') + ' ・ ひと休みで魔力 +1', c: '#b9a6ff', t: 0, dur: G.regrowDur, small: true };
  }
  function enterCamp() {
    G.camp.offers = R.genOffers(G.run); G.camp.sel = null; setPhase('camp'); G.lampN = 0; G.viewFloor = G.run.floor;
    ['K', 'T', 'M'].forEach(function (h) { var l = G.order.indexOf(h); G.heroes[h].x = ENTRY_X - 6 - l * 4 + (l === 1 ? 14 : 0); G.heroes[h].y = feetY(l); G.heroes[h].mood = 0; });
  }
  function campBuy(id) {
    if (G.phase !== 'camp') return;
    var it = R.ITEMS[id];
    if (!R.itemAvailable(G.run, id)) { SND.play('deny'); return; }
    if (G.run.gold < R.priceOf(G.run, id)) { SND.play('deny'); G.goldFlash = 0.6; return; }
    if (it.plant) { G.camp.sel = G.camp.sel === id ? null : id; SND.play('select'); return; }
    if (R.buy(G.run, id)) { SND.play('buy'); G.disp.gold = G.run.gold; G.disp.hp = G.run.hp; floatText(PX + PW / 2, 300, it.name + '！', C.gold, 20); }
  }
  function campPlant(c, idx) {
    var id = G.camp.sel; if (!id) return;
    if (R.buy(G.run, id, c, idx)) {
      SND.play('plant'); G.disp.gold = G.run.gold;
      G.spawnAt[c + ':' + idx] = G.t;
      var row = rowOf(c, idx);
      if (row != null) burst(reelCX(c), Y0 + row * TH + TH / 2, C.gold, 12, 180);
      if (G.run.gold < R.priceOf(G.run, id)) G.camp.sel = null;
    } else { SND.play('deny'); if (G.run.gold < R.priceOf(G.run, id)) { G.goldFlash = 0.6; G.camp.sel = null; } }
  }
  function nextFloor() { if (G.phase === 'camp') { G.camp.sel = null; enterIntro(); } }
  function enterOver() { setPhase('over'); SND.play('over'); G.banner = null; }
  function enterWin() {
    setPhase('win'); SND.play('win'); G.banner = null;
    var e = G.run.stats.earned;
    if (!G.best || e > G.best.earned) { G.best = { earned: e, rank: R.rankOf(e).id }; try { localStorage.setItem('reeldelve.best', JSON.stringify(G.best)); } catch (er) { /* 保存できなくても続行 */ } G.newBest = true; } else G.newBest = false;
  }

  function rowOf(c, idx) { var d = R.mod(idx - G.pos[c] + 3); return d; } // 表示行（0〜8）
  function later(t, fn) { G.timers.push({ t: t, fn: fn }); }
  function floatText(x, y, text, color, size, dur) { G.fx.push({ type: 'text', x: x, y: y, text: text, c: color, size: size || 18, t: 0, dur: dur || 1.0 }); }
  function burst(x, y, color, n, sp) {
    for (var i = 0; i < n; i++) {
      var a = Math.random() * TAU, v = (0.3 + Math.random() * 0.7) * sp;
      G.fx.push({ type: 'p', x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, c: color, r: 2 + Math.random() * 3, t: 0, dur: 0.4 + Math.random() * 0.4 });
    }
  }

  // ------------------------------------------------------------ 更新
  function update(dt) {
    G.t += dt; G.pt += dt;
    var sp = (G.fastHeld || dbg.fast) ? (dbg.fast ? 12 : 3) : 1;
    var i, c;
    // 予約した処理
    var tdt = G.phase === 'walk' ? dt * sp : dt;
    for (i = G.timers.length - 1; i >= 0; i--) { G.timers[i].t -= tdt; if (G.timers[i].t <= 0) { var f = G.timers[i].fn; G.timers.splice(i, 1); f(); } }
    // リール
    for (c = 0; c < 5; c++) {
      var rv = G.rv[c];
      if (rv.spinning) {
        rv.spinT += dt;
        if (rv.spinT > 0) {
          rv.off += rv.v * Math.min(1, rv.spinT * 4) * dt;
          while (rv.off >= 1) {
            G.pos[c] = R.mod(G.pos[c] - 1); rv.off -= 1;
            if (rv.stopping) { landed(c); break; }
            if (c === 0 || G.reach) SND.play('tick');
          }
        }
      } else if (rv.off !== 0) {
        var k = Math.min(1, dt * 18);
        rv.off += (0 - rv.off) * k; if (Math.abs(rv.off) < 0.01) rv.off = 0;
      }
      if (rv.bounce > 0) rv.bounce = Math.max(0, rv.bounce - dt * 4);
    }
    // 冒険者
    ['K', 'T', 'M'].forEach(function (h) {
      var o = G.heroes[h]; if (!o) return;
      if (o.moodT > 0) { o.moodT -= dt; if (o.moodT <= 0) o.mood = 0; }
      if (G.phase === 'arrange' || G.phase === 'spin' || G.phase === 'camp') {
        var l = G.order.indexOf(h), ty = feetY(l);
        o.y += (ty - o.y) * Math.min(1, dt * 14);
        o.moving = false;
      }
    });
    if (G.phase === 'intro') {
      var p = clamp(G.pt / 1.1, 0, 1);
      ['K', 'T', 'M'].forEach(function (h) { var l = G.order.indexOf(h); var o = G.heroes[h]; o.x = lerp(110 - l * 6, ENTRY_X - (l === 1 ? -10 : 6), ease(p)); o.walk += dt * 12; o.moving = p < 1; });
      if (G.pt > 1.5) enterPlan();
    } else if (G.phase === 'walk') updateWalk(dt * sp);
    else if (G.phase === 'gate') { if (G.pt > (G.gateInfo.gateOpen ? 2.1 : 2.5)) afterFloor(); }
    else if (G.phase === 'regrow') { if (G.pt > G.regrowDur) enterCamp(); }
    // 演出
    for (i = G.fx.length - 1; i >= 0; i--) {
      var e = G.fx[i]; e.t += dt;
      if (e.type === 'p' && e.t > 0) { e.x += e.vx * dt; e.y += e.vy * dt; e.vy += 520 * dt; }
      if (e.t >= e.dur) G.fx.splice(i, 1);
    }
    if (G.banner) { G.banner.t += dt; if (G.banner.t > G.banner.dur) G.banner = null; }
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt);
    if (G.flash) { G.flash.a -= dt * 1.2; if (G.flash.a <= 0) G.flash = null; }
    if (G.lampPop > 0) G.lampPop -= dt;
    if (G.manaFlash > 0) G.manaFlash -= dt;
    if (G.goldFlash > 0) G.goldFlash -= dt;
    if (G.restartArm > 0) G.restartArm -= dt;
    if (G.phase === 'arrange') G.preview = R.resolve(G.run, G.pos, G.order); else if (G.phase !== 'spin') G.preview = null;
  }
  function updateWalk(dt) {
    var w = G.walk, res = w.res; w.t += dt;
    var hs = ['K', 'T', 'M'];
    if (w.st === 'move') {
      var dur = w.col >= 5 ? 0.55 : 0.3, p = clamp(w.t / dur, 0, 1);
      hs.forEach(function (h) { var o = G.heroes[h]; o.x = lerp(w.from[h], w.to[h], p); o.walk += dt * 14; o.moving = true; });
      if (p >= 1) {
        if (w.col >= 5) { finishWalk(); return; }
        w.st = 'act'; w.t = 0; w.dur = fireEvents(w.col);
      }
    } else if (w.st === 'act') {
      if (w.t >= w.dur) {
        var cd = res.cols[w.col];
        if (res.dead && res.deadCol === w.col) { w.st = 'dead'; w.t = 0; return; }
        var real = cd.swaps.filter(function (s) { return !s.bump; });
        cd.swaps.forEach(function (s) { if (s.bump) { SND.play('bump'); floatText(reelCX(w.col), laneCY(s.lane) - 26, '行き止まり', '#aab2cc', 14); } });
        if (real.length) {
          w.st = 'swap'; w.t = 0; w.y0 = {}; w.y1 = {};
          hs.forEach(function (h) { w.y0[h] = G.heroes[h].y; });
          cd.orderAfter.forEach(function (h, l) { w.lanes[h] = l; w.y1[h] = feetY(l); });
          SND.play('stairs', real[0].to < real[0].lane);
        } else beginMove(w.col + 1);
      }
    } else if (w.st === 'swap') {
      var q = clamp(w.t / 0.28, 0, 1);
      hs.forEach(function (h) { var o = G.heroes[h]; o.y = lerp(w.y0[h], w.y1[h], ease(q)); if (w.y0[h] !== w.y1[h]) o.walk += dt * 20; });
      if (q >= 1) beginMove(w.col + 1);
    } else if (w.st === 'dead') {
      if (w.t > 1.0) { R.applyWalk(G.run, G.pos, res); enterOver(); }
    }
  }

  // ------------------------------------------------------------ 入力
  function mainAction() {
    SND.unlock();
    if (G.phase === 'title') { startRun(); return; }
    if (G.phase === 'over' || G.phase === 'win') { if (G.pt > 0.8) startRun(); return; }
    if (G.phase === 'arrange') { if (G.free) pullLever(); else go(); return; }
    if (G.phase === 'spin') { stopNext(); return; }
    if (G.phase === 'camp') { nextFloor(); return; }
  }
  window.addEventListener('keydown', function (e) {
    var k = e.key;
    if (k === ' ' || k === 'Enter') { e.preventDefault(); if (G.phase === 'walk') { G.fastHeld = true; return; } if (!e.repeat) mainAction(); return; }
    if (k === 'm' || k === 'M') { SND.unlock(); SND.toggleMute(); return; }
    if (k === 'r' || k === 'R') {
      if (G.phase === 'title') return;
      if (G.restartArm > 0) { G.restartArm = 0; startRun(); } else G.restartArm = 2.5;
      return;
    }
    if (k === 'Escape') { G.camp.sel = null; return; }
    if (k >= '1' && k <= '5') { var c = +k - 1; if (G.phase === 'spin') stopReel(c); else { G.sel = c; G.kb = true; } return; }
    if (G.phase === 'arrange') {
      if (k === 'ArrowLeft') { G.sel = (G.sel + 4) % 5; G.kb = true; SND.play('select'); e.preventDefault(); }
      else if (k === 'ArrowRight') { G.sel = (G.sel + 1) % 5; G.kb = true; SND.play('select'); e.preventDefault(); }
      else if (k === 'ArrowUp') { G.kb = true; rotate(G.sel, 1); e.preventDefault(); }
      else if (k === 'ArrowDown') { G.kb = true; rotate(G.sel, -1); e.preventDefault(); }
      else if (k === 'w' || k === 'W') swapLanes(0);
      else if (k === 's' || k === 'S') swapLanes(1);
    }
  });
  window.addEventListener('keyup', function (e) { if (e.key === ' ' || e.key === 'Enter') G.fastHeld = false; });

  function toLocal(e) {
    var r = canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height };
  }
  function reelAt(x, y) {
    if (y < Y0 || y >= Y0 + 9 * TH) return null;
    for (var c = 0; c < 5; c++) if (x >= reelX(c) && x < reelX(c) + RW) {
      var row = Math.floor((y - Y0) / TH);
      return { c: c, row: row, idx: R.mod(G.pos[c] + row - 3) };
    }
    return null;
  }
  function hitButton(x, y) {
    for (var i = G.buttons.length - 1; i >= 0; i--) { var b = G.buttons[i]; if (x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h) return b; }
    return null;
  }
  canvas.addEventListener('mousemove', function (e) {
    var p = toLocal(e); G.mouse.x = p.x; G.mouse.y = p.y;
    G.hover = reelAt(p.x, p.y);
    if (G.drag && G.phase === 'arrange') {
      var steps = Math.round((p.y - G.drag.y0) / TH);
      var d = steps - G.drag.applied;
      while (d !== 0) {
        var one = d > 0 ? 1 : -1;
        if (!rotate(G.drag.c, -one)) break;
        G.drag.applied += one; d -= one; G.drag.moved = true;
      }
      if (Math.abs(p.y - G.drag.y0) > 8) G.drag.moved = true;
    }
    var b = hitButton(p.x, p.y);
    canvas.style.cursor = b && b.on ? 'pointer' : (G.hover && (G.phase === 'arrange' || (G.phase === 'camp' && G.camp.sel)) ? (G.phase === 'arrange' ? 'grab' : 'pointer') : 'default');
  });
  canvas.addEventListener('mousedown', function (e) {
    if (e.button !== 0) return;
    SND.unlock();
    var p = toLocal(e); G.mouse.down = true;
    var b = hitButton(p.x, p.y);
    if (b) { if (b.on) b.fn(); else SND.play('deny'); return; }
    if (G.phase === 'title' || G.phase === 'over' || G.phase === 'win') { mainAction(); return; }
    var r = reelAt(p.x, p.y);
    if (G.phase === 'walk') { G.fastHeld = true; return; }
    if (G.phase === 'spin') { if (r) stopReel(r.c); else stopNext(); return; }
    if (G.phase === 'arrange' && r) { G.drag = { c: r.c, y0: p.y, applied: 0, moved: false, row: r.row }; G.sel = r.c; return; }
    if (G.phase === 'camp' && r && G.camp.sel) { campPlant(r.c, r.idx); return; }
  });
  window.addEventListener('mouseup', function () {
    G.mouse.down = false; G.fastHeld = false;
    if (G.drag) {
      var d = G.drag; G.drag = null;
      // 動かさずに離したら、その絵柄を中段へ呼び込む
      if (!d.moved && G.phase === 'arrange' && (d.row < 3 || d.row > 5)) {
        var n = d.row - 4, one = n > 0 ? 1 : -1;
        while (n !== 0) { if (!rotate(d.c, one)) break; n -= one; }
      }
    }
  });
  canvas.addEventListener('wheel', function (e) {
    e.preventDefault();
    var p = toLocal(e), r = reelAt(p.x, p.y);
    if (r && G.phase === 'arrange') rotate(r.c, e.deltaY > 0 ? 1 : -1);
  }, { passive: false });

  // ------------------------------------------------------------ 描画
  function text(s, x, y, size, color, align, bold) {
    ctx.font = (bold ? 'bold ' : '') + size + 'px ' + FONT;
    ctx.textAlign = align || 'left'; ctx.textBaseline = 'middle';
    ctx.fillStyle = color || C.text; ctx.fillText(s, x, y);
  }
  function textO(s, x, y, size, color, align) {
    ctx.font = 'bold ' + size + 'px ' + FONT; ctx.textAlign = align || 'center'; ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(3, size * 0.22); ctx.strokeStyle = 'rgba(12,10,20,0.9)';
    ctx.strokeText(s, x, y); ctx.fillStyle = color; ctx.fillText(s, x, y);
  }
  function button(x, y, w, h, label, fn, on, style, sub) {
    var hov = G.mouse.x >= x && G.mouse.x < x + w && G.mouse.y >= y && G.mouse.y < y + h;
    G.buttons.push({ x: x, y: y, w: w, h: h, fn: fn, on: on });
    var main = style === 'main';
    ctx.save();
    if (!on) ctx.globalAlpha = 0.45;
    var py = hov && on && G.mouse.down ? 2 : 0;
    ctx.fillStyle = main ? C.brassLo : '#1b1e30'; A.rr(ctx, x, y + 4, w, h, 10); ctx.fill();
    ctx.fillStyle = main ? (hov && on ? '#e6bf63' : C.brass) : (hov && on ? '#3d4468' : '#2c314c'); A.rr(ctx, x, y + py, w, h, 10); ctx.fill();
    if (main) { ctx.fillStyle = 'rgba(255,255,255,0.25)'; A.rr(ctx, x + 4, y + py + 3, w - 8, 5, 2.5); ctx.fill(); }
    text(label, x + w / 2, y + py + h / 2 - (sub ? 8 : 0), main ? 22 : 16, main ? '#2a1c08' : C.text, 'center', true);
    if (sub) text(sub, x + w / 2, y + py + h / 2 + 15, 13, main ? '#4a3510' : C.dim, 'center');
    ctx.restore();
  }

  function drawBackground() {
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#141627'); g.addColorStop(0.5, '#0f1018'); g.addColorStop(1, '#0a0a11');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // 石積み
    ctx.strokeStyle = 'rgba(120,130,180,0.05)'; ctx.lineWidth = 2;
    for (var y = 100; y < 650; y += 46) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      var o = (y / 46) % 2 ? 0 : 60;
      for (var x = o; x < W; x += 120) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 46); ctx.stroke(); }
    }
    // 通路（窓の高さの帯）
    var cg = ctx.createLinearGradient(0, WIN_Y, 0, WIN_Y + WIN_H);
    cg.addColorStop(0, '#3a3024'); cg.addColorStop(1, '#2a221a');
    ctx.fillStyle = cg; ctx.fillRect(176, WIN_Y, 830, WIN_H);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    for (var l = 1; l < 3; l++) ctx.fillRect(176, WIN_Y + l * TH - 1, 830, 2);
    // たいまつの光
    var fl = 0.85 + 0.15 * Math.sin(G.t * 9) * Math.sin(G.t * 5.3);
    [[226, WIN_Y - 26], [980, WIN_Y - 26]].forEach(function (p) {
      var tg = ctx.createRadialGradient(p[0], p[1], 4, p[0], p[1], 190);
      tg.addColorStop(0, 'rgba(255,180,90,' + (0.26 * fl) + ')'); tg.addColorStop(1, 'rgba(255,180,90,0)');
      ctx.fillStyle = tg; ctx.fillRect(p[0] - 190, p[1] - 190, 380, 380);
      ctx.fillStyle = '#5a4630'; ctx.fillRect(p[0] - 3, p[1], 6, 22);
      ctx.fillStyle = '#ffb347'; ctx.beginPath(); ctx.ellipse(p[0], p[1] - 4, 6, 10 * fl, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#fff1b0'; ctx.beginPath(); ctx.ellipse(p[0], p[1] - 2, 3, 5 * fl, 0, 0, TAU); ctx.fill();
    });
  }

  function drawReels() {
    var camp = G.phase === 'camp';
    for (var c = 0; c < 5; c++) {
      var x = reelX(c), rv = G.rv[c];
      var off = rv.off + (rv.bounce > 0 ? Math.sin(rv.bounce * 9) * rv.bounce * 0.1 : 0);
      // 胴
      ctx.fillStyle = '#0b0c14'; A.rr(ctx, x - 6, Y0 - 6, RW + 12, 9 * TH + 12, 10); ctx.fill();
      ctx.save(); ctx.beginPath(); ctx.rect(x, Y0, RW, 9 * TH); ctx.clip();
      var lo = Math.floor(-off) - 1, hi = 9 + Math.ceil(-off) + 1;
      for (var j = lo; j <= hi; j++) {
        var idx = R.mod(G.pos[c] + j - 3);
        var y = Y0 + (j + off) * TH;
        var cy = y + TH / 2;
        var inWin = cy > WIN_Y && cy < WIN_Y + WIN_H;
        var tile = G.run.reels[c][idx];
        var key = c + ':' + idx;
        A.slab(ctx, x, y, RW, TH, inWin && !camp, c * 9 + idx);
        var eat = G.eaten[key];
        var sp = G.spawnAt[key];
        if (sp != null && G.t < sp) continue;
        var ghost = camp && G.camp.sel && G.hover && G.hover.c === c && G.hover.idx === idx && tile !== R.ITEMS[G.camp.sel].plant;
        if (tile !== '.' && !ghost) {
          ctx.save();
          var s = 1;
          if (sp != null && G.t - sp < 0.35) { var q = (G.t - sp) / 0.35; s = 1 + Math.sin(q * Math.PI) * 0.35 * (1 - q) + (q - 1) * 0.0; s *= easeOut(q); }
          if (eat != null) { var eq = clamp((G.t - eat) / 0.25, 0, 1); s *= 1 - eq; ctx.globalAlpha = 1 - eq; }
          if (s > 0.02) { ctx.translate(x + RW / 2, cy); ctx.scale(s, s); A.icon(ctx, tile, 0, 0, 56, G.t + c * 1.3 + idx * 0.7); }
          ctx.restore();
        }
      }
      // 野営で置こうとしているマスの見本
      if (camp && G.camp.sel && G.hover && G.hover.c === c) {
        var hy = Y0 + G.hover.row * TH, pt = R.ITEMS[G.camp.sel].plant;
        var same = G.run.reels[c][G.hover.idx] === pt;
        ctx.fillStyle = same ? 'rgba(255,90,90,0.18)' : 'rgba(255,211,90,0.22)'; A.rr(ctx, x + 3, hy + 3, RW - 6, TH - 6, 8); ctx.fill();
        ctx.strokeStyle = same ? C.bad : C.gold; ctx.lineWidth = 3; ctx.setLineDash([7, 5]); ctx.lineDashOffset = -G.t * 24; ctx.stroke(); ctx.setLineDash([]);
        if (!same) { ctx.globalAlpha = 0.75 + 0.2 * Math.sin(G.t * 8); A.icon(ctx, pt, x + RW / 2, hy + TH / 2, 52, G.t); ctx.globalAlpha = 1; }
      }
      // 窓の外は暗く沈める
      if (!camp) {
        ctx.fillStyle = 'rgba(8,9,18,0.5)';
        ctx.fillRect(x, Y0, RW, WIN_Y - Y0); ctx.fillRect(x, WIN_Y + WIN_H, RW, Y0 + 9 * TH - WIN_Y - WIN_H);
      } else { ctx.fillStyle = 'rgba(8,9,18,0.12)'; ctx.fillRect(x, Y0, RW, 9 * TH); }
      var g1 = ctx.createLinearGradient(0, Y0, 0, Y0 + 70); g1.addColorStop(0, 'rgba(8,9,18,0.85)'); g1.addColorStop(1, 'rgba(8,9,18,0)');
      ctx.fillStyle = g1; ctx.fillRect(x, Y0, RW, 70);
      var g2 = ctx.createLinearGradient(0, Y0 + 9 * TH - 70, 0, Y0 + 9 * TH); g2.addColorStop(0, 'rgba(8,9,18,0)'); g2.addColorStop(1, 'rgba(8,9,18,0.85)');
      ctx.fillStyle = g2; ctx.fillRect(x, Y0 + 9 * TH - 70, RW, 70);
      // 目印（下見で決めた並び）
      if (G.phase === 'spin' && rv.spinning) {
        var d = R.mod(G.target[c] - G.pos[c]);
        var hot = d === 8 && !rv.stopping;
        [d + 3, d + 3 - 9].forEach(function (row) {
          var by = Y0 + (row + off) * TH;
          ctx.strokeStyle = hot ? '#fff7c9' : C.gold; ctx.lineWidth = hot ? 6 : 4;
          ctx.shadowColor = C.gold; ctx.shadowBlur = hot ? 22 : 8;
          A.rr(ctx, x + 3, by + 2, RW - 6, 3 * TH - 4, 10); ctx.stroke();
          ctx.shadowBlur = 0;
          if (hot) { ctx.fillStyle = 'rgba(255,240,170,0.16)'; A.rr(ctx, x + 3, by + 2, RW - 6, 3 * TH - 4, 10); ctx.fill(); }
        });
      }
      ctx.restore();
      // 枠
      ctx.strokeStyle = C.brassLo; ctx.lineWidth = 3; A.rr(ctx, x - 2, Y0 - 2, RW + 4, 9 * TH + 4, 8); ctx.stroke();
      if (G.phase === 'spin' && !rv.spinning) {
        ctx.strokeStyle = rv.good ? C.gold : '#7d86a6'; ctx.lineWidth = 3; A.rr(ctx, x + 1, WIN_Y + 1, RW - 2, WIN_H - 2, 8); ctx.stroke();
      }
      if (G.phase === 'arrange' && (G.kb && G.sel === c)) {
        ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 2; ctx.setLineDash([8, 6]); ctx.lineDashOffset = -G.t * 20;
        A.rr(ctx, x - 5, Y0 - 5, RW + 10, 9 * TH + 10, 10); ctx.stroke(); ctx.setLineDash([]);
      }
      // ずらした量（調整中）
      if (G.phase === 'arrange' && !G.free && G.base) {
        var nc = R.nudgeCost(G.pos[c], G.base[c]);
        if (nc) textO('魔力 −' + nc, x + RW / 2, Y0 + 9 * TH + 14, 15, C.mana);
      }
    }
    // 窓の枠（真鍮）
    ctx.fillStyle = C.brass; ctx.fillRect(RX0 - 14, WIN_Y - 5, 5 * RSTEP + 14, 5); ctx.fillRect(RX0 - 14, WIN_Y + WIN_H, 5 * RSTEP + 14, 5);
    ctx.fillStyle = C.brassHi; ctx.fillRect(RX0 - 14, WIN_Y - 5, 5 * RSTEP + 14, 1.5); ctx.fillRect(RX0 - 14, WIN_Y + WIN_H, 5 * RSTEP + 14, 1.5);
    for (var k = 0; k < 2; k++) {
      var ex = k ? RX0 + 5 * RSTEP - 14 + 4 : RX0 - 18;
      ctx.fillStyle = C.brass; A.rr(ctx, ex, WIN_Y - 10, 10, WIN_H + 20, 4); ctx.fill();
    }
  }

  function drawExit() {
    var need = R.gateNeed(G.viewFloor), x = 968, y = WIN_Y - 16, w = 44, h = WIN_H + 32;
    if (need) {
      var open = (G.phase === 'gate' && G.gateInfo && G.gateInfo.gateOpen) ? clamp(G.pt / 1.2, 0, 1) : 0;
      ctx.fillStyle = '#05050a'; A.rr(ctx, x, y, w, h, 8); ctx.fill();
      ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
      ctx.fillStyle = '#4a4f72'; ctx.fillRect(x, y - open * h, w, h);
      ctx.fillStyle = '#5c6290'; ctx.fillRect(x + 4, y + 4 - open * h, w - 8, 6);
      for (var i = 0; i < need; i++) {
        var ly = y + h * (i + 0.5) / need - open * h;
        var lit = G.lampNShown > i;
        ctx.fillStyle = lit ? C.gold : '#22243a'; ctx.beginPath(); ctx.arc(x + w / 2, ly, 9, 0, TAU); ctx.fill();
        ctx.strokeStyle = C.brass; ctx.lineWidth = 2.5; ctx.stroke();
        if (lit) { ctx.fillStyle = 'rgba(255,211,90,0.3)'; ctx.beginPath(); ctx.arc(x + w / 2, ly, 16, 0, TAU); ctx.fill(); }
      }
      ctx.restore();
      ctx.strokeStyle = C.brass; ctx.lineWidth = 3; A.rr(ctx, x, y, w, h, 8); ctx.stroke();
      textO(need + '連の門', x + w / 2, y - 14, 15, C.gold);
    } else {
      ctx.fillStyle = '#05050a'; ctx.beginPath(); ctx.moveTo(x, y + h); ctx.lineTo(x, y + 30); ctx.quadraticCurveTo(x + w / 2, y - 14, x + w, y + 30); ctx.lineTo(x + w, y + h); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#4a4f72'; ctx.lineWidth = 4; ctx.stroke();
      for (i = 0; i < 4; i++) { ctx.fillStyle = 'rgba(160,170,220,' + (0.22 - i * 0.045) + ')'; ctx.fillRect(x + 6 + i * 5, y + h - 14 - i * 12, w - 12 - i * 5, 6); }
    }
  }

  var BADGE = { coin: C.gold, kill: C.gold, open: C.gold, disarm: C.gold };
  function drawPreview() {
    var p = G.preview; if (!p || G.phase !== 'arrange') return;
    var hs = ['K', 'T', 'M'];
    // 道すじ
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    hs.forEach(function (h, hi) {
      var lane = G.order.indexOf(h);
      ctx.beginPath(); ctx.moveTo(ENTRY_X + 24, laneCY(lane) + 22 + hi * 0);
      for (var c = 0; c < p.cols.length; c++) {
        lane = p.cols[c].orderBefore.indexOf(h);
        ctx.lineTo(reelCX(c) - 30, laneCY(lane) + 22);
        ctx.lineTo(reelCX(c) + 30, laneCY(lane) + 22);
      }
      if (!p.dead) { lane = p.endOrder.indexOf(h); ctx.lineTo(EXIT_X, laneCY(lane) + 22); }
      ctx.strokeStyle = C[h]; ctx.globalAlpha = 0.8; ctx.lineWidth = 4; ctx.setLineDash([2, 9]); ctx.lineDashOffset = -G.t * 26; ctx.stroke();
    });
    ctx.restore();
    // 結果の札
    p.cols.forEach(function (cd, c) {
      cd.events.forEach(function (ev) {
        var x = reelX(c), y = WIN_Y + ev.lane * TH;
        if (ev.kind === 'hurt') {
          var a = 0.55 + 0.45 * Math.sin(G.t * 7);
          ctx.strokeStyle = 'rgba(255,80,80,' + a + ')'; ctx.lineWidth = 4; A.rr(ctx, x + 4, y + 4, RW - 8, TH - 8, 8); ctx.stroke();
          pill(x + RW - 8, y + 13, '体力−1', '#3a0d14', '#ff8a8a');
        } else if (ev.gold) pill(x + RW - 8, y + 13, '+' + ev.gold, '#3a2c08', C.gold);
        else if (ev.mana) pill(x + RW - 8, y + 13, '魔力+' + ev.mana, '#0b2a3a', C.mana);
        else if (ev.kind === 'potion') pill(x + RW - 8, y + 13, ev.heal ? '体力+1' : '満タン', '#3a0d24', C.pot);
        if (ev.n >= 2) pill(x + 8, y + TH - 13, ev.n + '連', C[ev.hero], '#14101c', true);
        // 使える絵柄には、その人の色の下線
        if (ev.n >= 1) { ctx.fillStyle = C[ev.hero]; A.rr(ctx, x + 16, y + TH - 7, RW - 32, 3, 1.5); ctx.fill(); }
      });
    });
  }
  function pill(xr, cy, s, bg, fg, left) {
    ctx.font = 'bold 14px ' + FONT;
    var w = ctx.measureText(s).width + 12, x = left ? xr : xr - w;
    ctx.fillStyle = bg; A.rr(ctx, x, cy - 10, w, 20, 6); ctx.fill();
    ctx.strokeStyle = fg; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = fg; ctx.fillText(s, x + w / 2, cy + 1);
  }

  function drawHeroes() {
    var list = ['K', 'T', 'M'].map(function (h) { return G.heroes[h] ? { h: h, o: G.heroes[h] } : null; }).filter(Boolean);
    list.sort(function (a, b) { return a.o.y - b.o.y; });
    list.forEach(function (e) {
      var o = e.o;
      if (G.phase === 'over' && G.run.dead) return;
      A.hero(ctx, e.h, o.x, o.y, 50, o.moving ? o.walk : 0, o.mood, G.t);
    });
    if (G.phase === 'camp') { // 焚き火
      var fx = 208, fy = feetY(1) + 2, fl = 0.8 + 0.2 * Math.sin(G.t * 11);
      var g = ctx.createRadialGradient(fx, fy - 10, 2, fx, fy - 10, 90); g.addColorStop(0, 'rgba(255,170,70,0.35)'); g.addColorStop(1, 'rgba(255,170,70,0)');
      ctx.fillStyle = g; ctx.fillRect(fx - 90, fy - 100, 180, 180);
      ctx.strokeStyle = '#5a3c20'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(fx - 12, fy); ctx.lineTo(fx + 12, fy - 6); ctx.moveTo(fx + 12, fy); ctx.lineTo(fx - 12, fy - 6); ctx.stroke();
      ctx.fillStyle = '#ff8a3a'; ctx.beginPath(); ctx.moveTo(fx - 9, fy - 4); ctx.quadraticCurveTo(fx - 12, fy - 20, fx, fy - 30 * fl); ctx.quadraticCurveTo(fx + 12, fy - 20, fx + 9, fy - 4); ctx.fill();
      ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.moveTo(fx - 4, fy - 4); ctx.quadraticCurveTo(fx - 5, fy - 12, fx, fy - 17 * fl); ctx.quadraticCurveTo(fx + 5, fy - 12, fx + 4, fy - 4); ctx.fill();
    }
  }

  var ROLE = { K: ['魔物を倒す', 'm'], T: ['宝箱・罠', 'x'], M: ['水晶で魔力', 'y'] };
  function drawLeftPanel() {
    var arr = G.phase === 'arrange';
    for (var l = 0; l < 3; l++) {
      var h = G.order[l], x = 14, y = laneCY(l) - 25, w = 160, hh = 50;
      if (G.phase === 'walk' && G.walk) { h = null; for (var hk in G.walk.lanes) if (G.walk.lanes[hk] === l) h = hk; }
      ctx.fillStyle = 'rgba(20,22,38,0.92)'; A.rr(ctx, x, y, w, hh, 8); ctx.fill();
      if (!h) { text('—', x + w / 2, y + hh / 2, 16, C.dim, 'center'); continue; }
      ctx.fillStyle = C[h]; A.rr(ctx, x, y, 7, hh, 3); ctx.fill();
      text(R.HERO_NAMES[h], x + 16, y + 16, 18, C[h], 'left', true);
      text(ROLE[h][0], x + 16, y + 37, 13, C.dim, 'left');
      A.icon(ctx, ROLE[h][1], x + w - 24, y + hh / 2, 34, G.t);
      if (h === 'T') A.icon(ctx, 't', x + w - 54, y + hh / 2 + 2, 26, G.t);
    }
    if (arr) for (var a = 0; a < 2; a++) {
      (function (a) {
        var bx = 182, by = WIN_Y + (a + 1) * TH - 13;
        var can = arrangeCostAfterSwap(a) <= G.run.mana;
        var hov = Math.abs(G.mouse.x - (bx + 18)) < 22 && Math.abs(G.mouse.y - (by + 13)) < 14;
        G.buttons.push({ x: bx - 4, y: by - 2, w: 44, h: 30, fn: function () { swapLanes(a); }, on: true });
        ctx.fillStyle = hov ? '#4a5280' : '#2c314c'; A.rr(ctx, bx, by, 36, 26, 13); ctx.fill();
        ctx.strokeStyle = can ? C.mana : '#555a72'; ctx.lineWidth = 2; ctx.stroke();
        text('⇅', bx + 18, by + 14, 17, can ? C.mana : '#777c92', 'center', true);
      })(a);
    }
    if (arr) text('⇅ 入れ替え（魔力1）', 94, WIN_Y + WIN_H + 26, 13, C.dim, 'center');
    if (arr) text('W / S キーでも可', 94, WIN_Y + WIN_H + 44, 12, '#6f7590', 'center');
  }
  function arrangeCostAfterSwap(a) { var no = G.order.slice(); var t = no[a]; no[a] = no[a + 1]; no[a + 1] = t; return arrangeCost(G.pos, no); }

  function drawHUD() {
    var run = G.run, vf = G.viewFloor || run.floor;
    ctx.fillStyle = 'rgba(10,11,20,0.9)'; ctx.fillRect(0, 0, W, 80);
    ctx.fillStyle = C.brassLo; ctx.fillRect(0, 80, W, 2);
    // 階
    text('B' + vf + 'F', 22, 34, 40, C.text, 'left', true);
    ctx.font = 'bold 40px ' + FONT; var fw = ctx.measureText('B' + vf + 'F').width;
    text('/ ' + R.LAST_FLOOR, 30 + fw, 42, 16, C.dim);
    text(['上層', '中層', '深層'][R.stratum(vf) - 1], 24, 66, 14, C.dim);
    // 門の予告
    var g = R.nextGate(vf);
    if (g) {
      var here = g.floor === vf;
      var gx = 190;
      ctx.fillStyle = here ? 'rgba(201,162,74,0.22)' : 'rgba(40,44,70,0.8)'; A.rr(ctx, gx, 16, 250, 48, 8); ctx.fill();
      if (here) { ctx.strokeStyle = C.gold; ctx.lineWidth = 2; ctx.stroke(); }
      text(here ? 'この階に門がある' : '次の門：B' + g.floor + 'F（あと' + (g.floor - vf) + '階）', gx + 14, 30, 15, here ? C.gold : C.text, 'left', true);
      text('同じ階で ' + g.need + '連 を出すと開く', gx + 14, 51, 14, C.dim);
    }
    // 連鎖ランプ
    var need = R.gateNeed(vf);
    var n = G.phase === 'arrange' && G.preview ? G.preview.maxStreak : G.lampN;
    if (G.phase === 'spin' && G.target) n = 0;
    G.lampNShown = (G.phase === 'walk' || G.phase === 'gate' || G.phase === 'regrow') ? G.lampN : 0;
    text('連鎖', 500, 40, 15, C.dim, 'right');
    for (var i = 0; i < 5; i++) {
      var lx = 530 + i * 44, ly = 40, lit = n > i;
      var prev = G.phase === 'arrange';
      var pop = lit && i === n - 1 && G.lampPop > 0 ? 1 + G.lampPop : 1;
      if (need && i < need) { ctx.strokeStyle = C.brassHi; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(lx, ly, 19, 0, TAU); ctx.stroke(); }
      ctx.fillStyle = '#1c1e30'; ctx.beginPath(); ctx.arc(lx, ly, 14, 0, TAU); ctx.fill();
      if (lit) {
        var al = prev ? 0.55 + 0.35 * Math.sin(G.t * 6) : 1;
        if (G.reach) al = 0.5 + 0.5 * Math.sin(G.t * 20);
        ctx.fillStyle = 'rgba(255,211,90,' + (0.3 * al) + ')'; ctx.beginPath(); ctx.arc(lx, ly, 22 * pop, 0, TAU); ctx.fill();
        ctx.fillStyle = 'rgba(255,211,90,' + al + ')'; ctx.beginPath(); ctx.arc(lx, ly, 12 * pop, 0, TAU); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,' + (0.8 * al) + ')'; ctx.beginPath(); ctx.arc(lx - 4, ly - 4, 3.5, 0, TAU); ctx.fill();
      }
      text(String(i + 1), lx, ly + 28, 12, i + 1 === 3 || i + 1 === 5 ? C.brass : '#5d6280', 'center', true);
    }
    // 体力・金・魔力
    var hx = 800;
    for (i = 0; i < run.maxHp; i++) A.heart(ctx, hx + i * 26, 38, 9, i < G.disp.hp);
    var gf = G.goldFlash > 0 && Math.sin(G.t * 40) > 0;
    A.coin(ctx, 1068, 40, 38, 0);
    text(String(G.disp.gold), 1090, 41, 28, gf ? C.bad : C.gold, 'left', true);
    var mf = G.manaFlash > 0 && Math.sin(G.t * 40) > 0;
    A.crystal(ctx, 1178, 40, 38, G.t);
    text(String(G.disp.mana), 1198, 41, 28, mf ? C.bad : C.mana, 'left', true);
    text('金', 1068, 70, 12, C.dim, 'center'); text('魔力', 1178, 70, 12, C.dim, 'center');
  }

  var INFO = {
    '.': ['空き床', 'なにも起きない', '（連鎖はここで切れる）'],
    c: ['金貨', 'だれでも拾える　金 +1', ''],
    m: ['魔物', '剣士が踏むと退治して金に', 'ほかの2人は 体力 −1'],
    t: ['罠', '盗賊が踏むと外して金に', 'ほかの2人は 体力 −1'],
    x: ['宝箱', '盗賊だけが開けられる', 'ほかの2人は素通り'],
    y: ['水晶', '魔導士だけが魔力に変える', 'ほかの2人は素通り'],
    p: ['薬', 'だれでも飲める　体力 +1', ''],
    u: ['上り階段', '踏んだ人が上の段へ', '上の段の人と入れ替わる'],
    d: ['下り階段', '踏んだ人が下の段へ', '下の段の人と入れ替わる']
  };
  function panelBox(y, h) { ctx.fillStyle = 'rgba(20,22,38,0.92)'; A.rr(ctx, PX, y, PW, h, 10); ctx.fill(); ctx.strokeStyle = 'rgba(125,98,38,0.6)'; ctx.lineWidth = 1.5; ctx.stroke(); }
  function drawInfoBox(y) {
    panelBox(y, 112);
    var tl = null;
    if (G.hover && G.phase !== 'spin') tl = G.run.reels[G.hover.c][G.hover.idx];
    if (G.phase === 'camp' && G.camp.sel) tl = R.ITEMS[G.camp.sel].plant;
    if (tl == null) { text('絵柄にカーソルを合わせると', PX + PW / 2, y + 46, 14, C.dim, 'center'); text('はたらきが分かる', PX + PW / 2, y + 68, 14, C.dim, 'center'); return; }
    var inf = INFO[tl];
    if (tl !== '.') A.icon(ctx, tl, PX + 36, y + 34, 44, G.t);
    text(inf[0], PX + 68, y + 26, 19, C.text, 'left', true);
    text(inf[1], PX + 16, y + 66, 14, C.text); text(inf[2], PX + 16, y + 88, 14, C.dim);
  }
  function drawRightPanel() {
    var run = G.run, y;
    if (G.phase === 'arrange') {
      var p = G.preview, cost = arrangeCost(G.pos, G.order);
      panelBox(96, 190);
      text(G.free ? '下見' : '止まった！', PX + 16, 120, 20, C.gold, 'left', true);
      text(G.free ? 'いくら回しても自由' : 'ずらすには魔力がいる', PX + PW - 14, 121, 13, C.dim, 'right');
      if (p) {
        var rows = [['金', '+' + p.gold, p.gold ? C.gold : C.dim], ['魔力', '+' + p.mana, p.mana ? C.mana : C.dim],
          ['体力', (p.heal - p.dmg > 0 ? '+' : '') + (p.heal - p.dmg) + (p.dead ? '（全滅！）' : ''), p.dmg ? C.bad : (p.heal ? C.pot : C.dim)],
          ['最大連鎖', p.maxStreak + '連', p.maxStreak >= 3 ? C.gold : C.text]];
        rows.forEach(function (r, i) { text(r[0], PX + 18, 154 + i * 27, 15, C.dim); text(r[1], PX + PW - 18, 154 + i * 27, 19, r[2], 'right', true); });
        var need = R.gateNeed(run.floor);
        if (need) text(p.maxStreak >= need ? '門が開く並び！' : '門には ' + need + '連 が必要', PX + PW / 2, 268, 14, p.maxStreak >= need ? C.gold : C.bad, 'center', true);
      }
      drawInfoBox(298);
      if (cost > 0) text('魔力を ' + cost + ' 使う（残り ' + (run.mana - cost) + '）', PX + PW / 2, 432, 14, C.mana, 'center');
      if (G.free) button(PX, 452, PW, 74, 'レバーを引く', pullLever, true, 'main', 'SPACE ― ここから目押し');
      else button(PX, 452, PW, 74, '出発！', go, true, 'main', 'SPACE');
      // 操作
      panelBox(546, 90);
      text('ドラッグ / ホイール：リールを回す', PX + 14, 568, 13, C.dim);
      text('← →：リール選択　↑ ↓：回す', PX + 14, 590, 13, C.dim);
      text('M：音　R を2回：最初から', PX + 14, 612, 13, C.dim);
    } else if (G.phase === 'spin') {
      panelBox(96, 190);
      text('目押し', PX + 16, 120, 20, C.gold, 'left', true);
      text('金の枠が下見した並び。', PX + 16, 156, 14, C.text);
      text('枠が窓のひとつ上に来て', PX + 16, 180, 14, C.text);
      text('白く光ったら止める。', PX + 16, 204, 14, C.text);
      text('止めると次のコマでカチッと止まる', PX + 16, 240, 13, C.dim);
      text('ずれても魔力で直せる', PX + 16, 262, 13, C.dim);
      button(PX, 452, PW, 74, '止める', stopNext, true, 'main', 'SPACE（左から）/ リールをクリック / 1〜5');
    } else if (G.phase === 'walk' || G.phase === 'gate' || G.phase === 'regrow' || G.phase === 'intro') {
      panelBox(96, 120);
      text('この階の稼ぎ', PX + 16, 122, 16, C.dim);
      text('+' + G.floorGold, PX + PW - 18, 166, 44, C.gold, 'right', true);
      A.coin(ctx, PX + 40, 166, 44, G.t);
      if (G.phase === 'walk') text('SPACE / クリック長押しで早送り', PX + PW / 2, 240, 13, C.dim, 'center');
    } else if (G.phase === 'camp') {
      panelBox(96, 34);
      text('野営', PX + 16, 113, 18, C.gold, 'left', true);
      text('稼ぎでリールに手を入れる', PX + PW - 12, 114, 13, C.dim, 'right');
      y = 138;
      var list = G.camp.offers.concat(['rest']);
      list.forEach(function (id) {
        var it = R.ITEMS[id], price = R.priceOf(run, id), avail = R.itemAvailable(run, id), can = avail && run.gold >= price;
        var sel = G.camp.sel === id, bx = PX, bw = PW, bh = 62;
        var hov = G.mouse.x >= bx && G.mouse.x < bx + bw && G.mouse.y >= y && G.mouse.y < y + bh;
        G.buttons.push({ x: bx, y: y, w: bw, h: bh, fn: (function (id) { return function () { campBuy(id); }; })(id), on: can });
        ctx.save(); if (!can) ctx.globalAlpha = 0.5;
        ctx.fillStyle = sel ? '#4b4220' : (hov && can ? '#343a5c' : '#232740'); A.rr(ctx, bx, y, bw, bh, 9); ctx.fill();
        ctx.strokeStyle = sel ? C.gold : 'rgba(125,98,38,0.5)'; ctx.lineWidth = sel ? 2.5 : 1.2; ctx.stroke();
        if (it.plant) A.icon(ctx, it.plant, bx + 30, y + bh / 2, 40, G.t);
        else if (id === 'rest') A.heart(ctx, bx + 30, y + bh / 2, 11, true);
        else { ctx.fillStyle = C.brass; ctx.beginPath(); for (var k = 0; k < 10; k++) { var a = -Math.PI / 2 + k * Math.PI / 5, rr2 = k % 2 ? 7 : 16; ctx.lineTo(bx + 30 + Math.cos(a) * rr2, y + bh / 2 + Math.sin(a) * rr2); } ctx.closePath(); ctx.fill(); }
        var nm = it.name + (it.up && run.up[it.up] ? '（' + (run.up[it.up] + 1) + '段目）' : '');
        text(avail ? nm : (id === 'rest' ? '体力は満タン' : it.name + '（済）'), bx + 58, y + 21, 16, C.text, 'left', true);
        text(it.plant ? (sel ? 'リールのマスをクリック' : it.desc) : it.desc, bx + 58, y + 43, 12.5, sel ? C.gold : C.dim);
        if (avail) { text(String(price), bx + bw - 12, y + 21, 18, run.gold >= price ? C.gold : C.bad, 'right', true); }
        ctx.restore();
        y += bh + 6;
      });
      drawInfoBox(y + 2 > 486 ? 486 : y + 2);
      button(PX, 610, PW, 44, '次の階へ', nextFloor, true, 'main');
    }
  }

  function hintText() {
    var run = G.run, f = run.floor;
    if (G.restartArm > 0) return 'もう一度 R を押すと、最初からやり直す';
    if (G.phase === 'arrange' && G.free) {
      if (f === 1) return 'リールをつかんで上下に回し、窓の3段 ＝ 3人の通り道を決めよう。剣士は魔物を倒せるが、ほかの2人はケガをする。';
      if (f === 2) return '踏んだ絵柄は消え、避けた魔物はリールに残り続ける。同じ人が同じ絵柄を続けて踏むと「連鎖」で稼ぎが増える。';
      if (f === 3) return '次の階は門。同じ階で3連を出さないと開かない。いま拾うか、門のために残しておくか。';
      if (R.gateNeed(f)) return 'この階には門がある。' + R.gateNeed(f) + '連に届く並びを探そう。開けられないと、この階の稼ぎは没収される。';
      return '下見：リールを回して、3人それぞれの通り道を決める。決まったらレバーを引く。';
    }
    if (G.phase === 'arrange') return 'ずれたリールは、魔力1につき1コマずらして直せる。よければ出発！';
    if (G.phase === 'spin') return '金の枠が窓のひとつ上で白く光った瞬間に止める。左から順に SPACE、または止めたいリールをクリック。';
    if (G.phase === 'camp') {
      if (G.camp.sel) return '置きたいマスをクリック（魔物や罠の上に置けば、上書きして消せる）。ESC でやめる。';
      if (G.weakCamp) return '門の前では迷宮がほとんど湧かない。連鎖の材料が足りないなら、「金貨の種」を隣り合うリールの同じ段にそろえて植えよう。';
      if (f <= 2) return '野営：稼いだ金で、迷宮のリールそのものを作り変えられる。縦に並ぶ3マスが、次に3人が同時に踏む組になる。';
      return '野営：買い物が済んだら次の階へ。';
    }
    return '';
  }
  function drawHint() {
    var s = hintText(); if (!s) return;
    ctx.fillStyle = 'rgba(10,11,20,0.9)'; ctx.fillRect(0, 668, W, 52);
    ctx.fillStyle = C.brassLo; ctx.fillRect(0, 667, W, 2);
    text(s, W / 2, 695, 17, C.text, 'center');
  }

  function drawFx() {
    G.fx.forEach(function (e) {
      if (e.t < 0) return;
      var q = e.t / e.dur;
      if (e.type === 'p') { ctx.globalAlpha = 1 - q; ctx.fillStyle = e.c; ctx.beginPath(); ctx.arc(e.x, e.y, e.r * (1 - q * 0.5), 0, TAU); ctx.fill(); ctx.globalAlpha = 1; }
      else if (e.type === 'text') { ctx.globalAlpha = q < 0.7 ? 1 : 1 - (q - 0.7) / 0.3; var sc = q < 0.12 ? 0.6 + q / 0.12 * 0.5 : 1.1 - Math.min(0.1, (q - 0.12)); textO(e.text, e.x, e.y - easeOut(q) * 30, e.size * sc, e.c); ctx.globalAlpha = 1; }
      else if (e.type === 'ring') { ctx.globalAlpha = 1 - q; ctx.strokeStyle = e.c; ctx.lineWidth = 4 * (1 - q) + 1; ctx.beginPath(); ctx.arc(e.x, e.y, e.r * easeOut(q), 0, TAU); ctx.stroke(); ctx.globalAlpha = 1; }
      else if (e.type === 'slash') { ctx.globalAlpha = 1 - q; ctx.strokeStyle = '#fff'; ctx.lineWidth = 6 * (1 - q) + 1; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(e.x - 34 + q * 10, e.y - 26); ctx.lineTo(e.x + 34, e.y + 26 - q * 10); ctx.stroke(); ctx.globalAlpha = 1; }
      else if (e.type === 'fly') { var p = ease(q); var x = lerp(e.x0, e.x1, p), y = lerp(e.y0, e.y1, p) - Math.sin(p * Math.PI) * 60; ctx.fillStyle = e.c; ctx.beginPath(); ctx.arc(x, y, 5, 0, TAU); ctx.fill(); ctx.fillStyle = C.goldHi; ctx.beginPath(); ctx.arc(x - 1.5, y - 1.5, 2, 0, TAU); ctx.fill(); }
    });
    if (G.banner) {
      var b = G.banner, q = b.t / b.dur, a = q < 0.1 ? q / 0.1 : q > 0.8 ? (1 - q) / 0.2 : 1;
      var sc = b.small ? 1 : 1 + Math.max(0, 0.12 - b.t) * 4;
      ctx.globalAlpha = clamp(a, 0, 1);
      var by = b.small ? 212 : 200;
      ctx.fillStyle = 'rgba(8,8,16,0.78)'; ctx.fillRect(176, by - (b.small ? 34 : 48), 830, b.small ? 64 : 92);
      textO(b.text, 591, by - (b.small ? 10 : 12), (b.small ? 26 : 46) * sc, b.c);
      if (b.sub) textO(b.sub, 591, by + (b.small ? 16 : 26), b.small ? 15 : 18, '#fff');
      ctx.globalAlpha = 1;
    }
  }

  function drawFloorCard() {
    if (G.phase !== 'intro') return;
    var a = G.pt < 0.2 ? G.pt / 0.2 : G.pt > 1.2 ? clamp((1.5 - G.pt) / 0.3, 0, 1) : 1;
    ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(8,8,16,0.8)'; ctx.fillRect(176, 150, 830, 100);
    var need = R.gateNeed(G.run.floor);
    textO('地下 ' + G.run.floor + ' 階', 591, need ? 188 : 200, 44, C.text);
    if (need) textO('門の階 ― ' + need + '連で開く', 591, 228, 20, C.gold);
    ctx.globalAlpha = 1;
  }

  function overlay(a) { ctx.fillStyle = 'rgba(6,6,12,' + a + ')'; ctx.fillRect(0, 0, W, H); }
  function drawTitle() {
    overlay(0.8);
    ctx.font = 'bold 96px Georgia, "Times New Roman", serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineWidth = 12; ctx.strokeStyle = '#2a1c08'; ctx.strokeText('REEL DELVE', W / 2, 210);
    var g = ctx.createLinearGradient(0, 160, 0, 260); g.addColorStop(0, '#fff3b8'); g.addColorStop(0.5, C.gold); g.addColorStop(1, '#b97f1c');
    ctx.fillStyle = g; ctx.fillText('REEL DELVE', W / 2, 210);
    text('まわる迷宮と三人の旅', W / 2, 286, 28, C.text, 'center', true);
    ['K', 'T', 'M'].forEach(function (h, i) { A.hero(ctx, h, W / 2 - 110 + i * 110, 430 + Math.sin(G.t * 3 + i) * 0, 96, G.t * 6 + i * 2, 0, G.t); });
    text('止めたリールの3段が、そのまま3人の通り道になる。', W / 2, 486, 20, C.text, 'center');
    text('下見して、目押しで止めて、12階の底をめざす。', W / 2, 516, 20, C.text, 'center');
    var bl = 0.6 + 0.4 * Math.sin(G.t * 4);
    ctx.globalAlpha = bl; text('クリック　または　SPACE　ではじめる', W / 2, 590, 24, C.gold, 'center', true); ctx.globalAlpha = 1;
    if (G.best) text('これまでの最高：総獲得 ' + G.best.earned + '（評価 ' + G.best.rank + '）', W / 2, 640, 16, C.dim, 'center');
    text('音が出ます（M で消音）', W / 2, 690, 14, C.dim, 'center');
  }
  function statLines(y) {
    var s = G.run.stats;
    var rows = [['稼いだ総額', s.earned], ['最大連鎖', s.best + '連'], ['HIT / JACKPOT', s.hits + ' / ' + s.jackpots], ['目押しぴたり', s.perfects + ' 回'], ['受けた被害', s.dmg], ['門での失敗', s.gateFails]];
    rows.forEach(function (r, i) { text(r[0], W / 2 - 150, y + i * 30, 19, C.dim); text(String(r[1]), W / 2 + 150, y + i * 30, 22, C.text, 'right', true); });
  }
  function drawOver() {
    overlay(clamp(G.pt * 1.5, 0, 0.8));
    textO('全滅…', W / 2, 190, 70, C.bad);
    text('地下 ' + G.run.floor + ' 階で力尽きた', W / 2, 262, 22, C.text, 'center');
    statLines(316);
    text('魔物は剣士の段へ、罠は盗賊の段へ。危ないマスは野営で上書きもできる。', W / 2, 520, 17, C.dim, 'center');
    if (G.pt > 0.8) { ctx.globalAlpha = 0.6 + 0.4 * Math.sin(G.t * 4); text('クリック　または　SPACE　でもう一度', W / 2, 590, 24, C.gold, 'center', true); ctx.globalAlpha = 1; }
  }
  function drawWin() {
    overlay(clamp(G.pt * 1.5, 0, 0.82));
    if (Math.random() < 0.3) burst(Math.random() * W, 60 + Math.random() * 100, Math.random() < 0.5 ? C.gold : '#fff', 3, 140);
    var rk = R.rankOf(G.run.stats.earned);
    textO('踏破！', W / 2, 130, 72, C.gold);
    text('三人は最後の門を抜け、竜の眠る宝物庫にたどり着いた。', W / 2, 198, 20, C.text, 'center');
    ['K', 'T', 'M'].forEach(function (h, i) { A.hero(ctx, h, W / 2 - 96 + i * 96, 300, 76, 0, 1, G.t + i * 0.3); });
    textO('評価 ' + rk.id + ' ― ' + rk.name, W / 2, 346, 30, C.gold);
    statLines(392);
    if (G.newBest) textO('最高記録を更新！', W / 2, 578, 20, '#fff');
    if (G.pt > 0.8) { ctx.globalAlpha = 0.6 + 0.4 * Math.sin(G.t * 4); text('クリック　または　SPACE　でもう一度（迷宮は毎回変わる）', W / 2, 620, 22, C.gold, 'center', true); ctx.globalAlpha = 1; }
  }

  function render() {
    G.buttons = [];
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.clearRect(0, 0, W, H);
    if (!G.run) { // タイトルの背景用に仮の迷宮を置く
      G.run = R.newRun(7); G.demo = true;
      ['K', 'T', 'M'].forEach(function (h, i) { G.heroes[h] = { x: -100, y: feetY(i), walk: 0, mood: 0, moodT: 0 }; });
    }
    ctx.save();
    if (G.shake > 0) ctx.translate((Math.random() - 0.5) * G.shake * 26, (Math.random() - 0.5) * G.shake * 26);
    drawBackground();
    drawReels();
    drawExit();
    drawPreview();
    drawHeroes();
    drawFx();
    ctx.restore();
    if (G.phase !== 'title') { drawHUD(); drawLeftPanel(); drawRightPanel(); drawHint(); drawFloorCard(); }
    if (G.flash) { ctx.fillStyle = 'rgba(' + G.flash.c + ',' + clamp(G.flash.a, 0, 1) + ')'; ctx.fillRect(0, 0, W, H); }
    if (G.phase === 'title') drawTitle();
    else if (G.phase === 'over') drawOver();
    else if (G.phase === 'win') drawWin();
  }

  var last = performance.now();
  function frame(now) {
    var dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!dbg.hold) { update(dt); render(); }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // ------------------------------------------------------------ 検証用フック
  window.__rd = {
    G: G, R: R, dbg: dbg,
    step: function (n, dt) { for (var i = 0; i < (n || 1); i++) update(dt || 1 / 60); render(); },
    start: function (seed) { startRun(seed); },
    set: function (pos, order) { if (G.phase !== 'arrange') return false; for (var c = 0; c < 5; c++) rotate(c, R.mod(pos[c] - G.pos[c])); if (order) G.order = order.slice(); return true; },
    lever: pullLever, stop: stopReel, go: go, next: nextFloor, buy: campBuy, plant: campPlant, action: mainAction,
    // 目押しを正確に（または err コマずらして）済ませる
    stopExact: function (errs) {
      for (var c = 0; c < 5; c++) { var rv = G.rv[c]; if (!rv.spinning) continue; G.pos[c] = R.mod(G.target[c] + 1 - ((errs && errs[c]) || 0)); rv.off = 0.5; rv.spinT = 1; rv.stopping = true; }
    }
  };
})();
