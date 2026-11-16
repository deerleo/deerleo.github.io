// うしろのハニワ ― ゲーム本体（入力・進行・画面まわり）
(function () {
  'use strict';
  var R = window.HB_RULES, LEVELS = window.HB_LEVELS, AU = window.HB_AUDIO;
  var W = 1280, H = 720;
  var FONT = '"Yu Gothic UI","Hiragino Sans","Noto Sans JP","Meiryo",sans-serif';
  var SERIF = '"Yu Mincho","Hiragino Mincho ProN","Noto Serif JP","MS PMincho",serif';
  var SAVE_KEY = 'ushiro_no_haniwa_v1';
  var DIRN = ['北', '東', '南', '西'];
  var MARKC = ['○', '△', '□'];
  var MOVE_T = 0.17, TURN_T = 0.15;

  var cv = document.getElementById('game'), ctx = cv.getContext('2d');
  var T = window.HB_TEX.build();
  var REN = window.HB_RENDER.create(640, 360);
  var PARSED = LEVELS.map(function (d) { return R.parse(d); });
  var ENDING = R.parse(LEVELS.ending);

  var save = loadSave();
  var G = {
    mode: 'title', time: 0, floor: 0, L: null, s: null, undo: [], seen: [], hd: [],
    view: { x: 0, y: 0, ang: 0 }, vt: null, queue: [], explored: null,
    caption: null, flashes: [], banner: 0, bigMap: false, menu: 0, sel: 0,
    caughtT: 0, clearT: 0, clearInfo: null, fade: 0, fadeTo: null, mirrorTex: null, mirrorCell: null,
    titleStep: 0, titleT: 0, ending: false, shake: 0, lastHint: '', pauseSel: 0, bumpT: -9, bumpDir: 0
  };
  var dbg = { hold: false };

  // ---- 保存 ----------------------------------------------------------
  function loadSave() {
    try {
      var o = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
      if (o && typeof o.cleared === 'number') { o.best = o.best || {}; o.gems = o.gems || {}; o.told = o.told || {}; o.stars = o.stars || {}; return o; }
    } catch (e) { /* 保存が読めなければ最初から */ }
    return { cleared: 0, best: {}, gems: {}, told: {}, stars: {}, finished: false };
  }
  function writeSave() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { /* 保存できなくても遊べる */ } }

  // ---- 階のはじまり ---------------------------------------------------
  function startFloor(i, ending) {
    G.ending = !!ending;
    G.floor = i;
    G.L = ending ? ENDING : PARSED[i];
    G.s = R.initState(G.L);
    G.undo = []; G.queue = []; G.flashes = []; G.vt = null; G.bigMap = false;
    G.explored = new Uint8Array(G.L.w * G.L.h);
    G.hd = G.s.h.map(function (o, k) {
      return { x: o.x, y: o.y, fx: o.x, fy: o.y, t0: -9, wob: -9, pose: 0, known: false, stuck: -9, glow: -9 };
    });
    G.view.x = G.s.px + 0.5; G.view.y = G.s.py + 0.5; G.view.ang = G.s.pd * Math.PI / 2;
    G.mode = 'play'; G.banner = G.time; G.caption = null;
    G.an = ending ? null : new R.Analyzer(G.L); G.dead = false;
    afterChange([]);
    var def = G.L.def;
    if (def.hint) say(def.hint, 9);
  }

  function say(text, dur) { G.caption = { text: text, t0: G.time, dur: dur || 7 }; G.lastHint = text; }
  function tellOnce(key, text, dur) {
    if (save.told[key]) return false;
    save.told[key] = 1; writeSave(); say(text, dur || 8); return true;
  }

  // 状態が変わったあとの共通処理（見えているもの・地図・鏡）
  function afterChange() {
    var L = G.L, s = G.s, key = R.visKey(L, s);
    G.seen = R.seenFlags(L, s);
    var vis = R.visibleCells(L, key, s.px, s.py, s.pd);
    G.visNow = vis;
    for (var i = 0; i < vis.length; i++) G.explored[vis[i]] = 1;
    G.explored[s.py * L.w + s.px] = 1;
    for (i = 0; i < s.h.length; i++) if (G.seen[i]) G.hd[i].known = true;
    var m = R.mirrorAhead(L, key, s.px, s.py, s.pd);
    G.mirrorCell = m;
    G.mirrorDirty = true;
    checkDead();
  }
  // このままでは出口へ行けない状態か（調べ終わるまでは判定しない）
  function checkDead() {
    var was = G.dead;
    G.dead = !!(G.an && G.mode === 'play' && !G.s.won && G.s.caught < 0 && !G.an.isAlive(G.s));
    if (G.dead && !was) say('……このままでは、出口へ行けそうにない。Z で一手ずつ戻せる。', 9);
  }

  // ---- 1手 -----------------------------------------------------------
  function act(a) {
    if (G.mode !== 'play') return;
    var L = G.L, s = G.s, before = R.clone(s);
    var ev = R.tick(L, s, a);
    if (ev.length && ev[0].t === 'bump') {
      AU.play('bump'); G.bumpT = G.time; G.bumpDir = a === 'B' ? -1 : 1;
      if (ev[0].haniwa >= 0 && L.haniwa[ev[0].haniwa].type === 'r' && !G.ending) tellOnce('bumpH', 'ハニワは押してもびくともしない。', 5);
      return;
    }
    G.undo.push(before);
    if (G.undo.length > 600) G.undo.shift();
    // 視点の動き
    var ta = G.view.ang;
    if (a === 'L') ta -= Math.PI / 2; else if (a === 'R') ta += Math.PI / 2;
    G.vt = { fx: G.view.x, fy: G.view.y, fa: G.view.ang, tx: s.px + 0.5, ty: s.py + 0.5, ta: ta, t0: G.time, dur: (a === 'L' || a === 'R') ? TURN_T : MOVE_T };
    AU.play(a === 'F' ? 'step' : a === 'B' ? 'back' : a === 'W' ? 'wait' : 'turn');
    var wasSeen = G.seen.slice();
    afterChange();
    handleEvents(ev, wasSeen);
  }

  function relOf(x, y) {
    var s = G.s, dx = x - s.px, dy = y - s.py;
    return {
      fwd: dx * R.DX[s.pd] + dy * R.DY[s.pd],
      lat: dx * R.DX[(s.pd + 1) % 4] + dy * R.DY[(s.pd + 1) % 4],
      dist: Math.abs(dx) + Math.abs(dy)
    };
  }

  function handleEvents(ev, wasSeen) {
    var L = G.L, s = G.s, movedUnseen = false;
    ev.forEach(function (e) {
      var d, rel, pan, near;
      if (e.t === 'move') {
        d = G.hd[e.i];
        d.fx = e.fx; d.fy = e.fy; d.t0 = G.time; d.pose ^= 1;
        rel = relOf(e.tx, e.ty); pan = rel.lat / (Math.abs(rel.lat) + Math.abs(rel.fwd) + 0.5);
        near = 1 / (1 + rel.dist * 0.45);
        if (L.haniwa[e.i].type === 'r') {
          d.wob = G.time;
          AU.play('goto', pan, near, rel.fwd < 0);
          movedUnseen = true;
          var side = Math.abs(rel.lat) > Math.abs(rel.fwd) ? (rel.lat < 0 ? 'L' : 'R') : (rel.fwd < 0 ? 'B' : 'F');
          G.flashes.push({ side: side, t0: G.time, near: near });
        } else {
          AU.play('koto', pan, near);
          tellOnce('push', '青いハニワは、見つめると 見ている向きへ あとずさる。', 9);
        }
      } else if (e.t === 'stuck') {
        if (G.time - G.hd[e.i].stuck > 1.2) AU.play('stuck', 0);
        G.hd[e.i].stuck = G.time;
      } else if (e.t === 'wake') {
        AU.play('wake'); G.hd[e.i].glow = G.time;
        if (!tellOnce('wake', '……目が あった。ハニワが 目をさました。', 7)) { /* 2回目以降は音だけ */ }
      } else if (e.t === 'settle') {
        AU.play('settle'); G.hd[e.i].glow = G.time;
        tellOnce('settle', 'おなじ印の台座にのると、ハニワは眠る。もう動かない。', 8);
      } else if (e.t === 'door') { setTimeout(function () { AU.play('door'); }, 350); }
      else if (e.t === 'exitopen') {
        setTimeout(function () { AU.play('exitopen'); }, 500);
        if (!G.ending) say('どこかで 重い石の戸がひらく音がした。出口へ。', 7);
      }
      else if (e.t === 'gem') { AU.play('gem'); tellOnce('gem', 'まが玉を ひろった。', 5); }
      else if (e.t === 'caught') {
        G.mode = 'caught'; G.caughtT = G.time; G.shake = G.time; AU.play('caught');
        G.caughtBy = e.i;
      } else if (e.t === 'win') { onWin(); }
    });
    if (G.mode !== 'play') return;
    if (movedUnseen) tellOnce('goto', 'ゴト。……見ていないほうで、音がした。', 7);
    // ふたたび目に入ったとき
    for (var i = 0; i < s.h.length; i++) {
      if (L.haniwa[i].type === 'r' && s.h[i].st === R.AWAKE && G.seen[i] && !wasSeen[i] && save.told.goto && G.undo.length > 2) {
        tellOnce('freeze', 'さっきより近い。見ているあいだは、動かないらしい。', 9);
      }
    }
    if (G.mirrorCell && !G.ending) {
      tellOnce('mirror', '銅の鏡。のぞきこむと、真うしろの通路が映る。鏡ごしでも「見ている」ことになる。', 11);
    }
    // 台座が目に入ったら
    if (!save.told.ped && G.visNow) {
      for (i = 0; i < G.visNow.length; i++) if (L.ped[G.visNow[i]] >= 0) {
        tellOnce('ped', '床に 印のついた台座がある。ハニワの腹にも 印がある。', 9); break;
      }
    }
  }

  function onWin() {
    if (G.ending) { G.mode = 'fadeout'; G.fade = G.time; save.finished = true; writeSave(); return; }
    var def = G.L.def, steps = G.s.steps, prev = save.best[def.id];
    var par = G.s.gem && def.parGem ? def.parGem : def.par || 0, st = starsFor(steps, par);
    var info = { steps: steps, par: par, gem: G.s.gem, hasGem: !!G.L.gem, newBest: !prev || steps < prev, stars: st };
    if (info.newBest) save.best[def.id] = steps;
    if (!(save.stars[def.id] >= st)) save.stars[def.id] = st;
    if (G.s.gem) save.gems[def.id] = 1;
    if (save.cleared < G.floor + 1) save.cleared = G.floor + 1;
    writeSave();
    G.clearInfo = info; G.mode = 'clear'; G.clearT = G.time;
    AU.play('clear');
  }
  function starsFor(steps, par) {
    if (!par) return 1;
    return steps <= Math.ceil(par * 1.25) ? 3 : steps <= par * 2 ? 2 : 1;
  }

  function undo() {
    if (!G.undo.length) return;
    var L = G.L;
    G.s = G.undo.pop();
    G.mode = 'play'; G.vt = null; G.queue = [];
    G.view.x = G.s.px + 0.5; G.view.y = G.s.py + 0.5; G.view.ang = G.s.pd * Math.PI / 2;
    G.s.h.forEach(function (o, i) { var d = G.hd[i]; d.x = o.x; d.y = o.y; d.t0 = -9; d.wob = -9; });
    AU.play('undo');
    afterChange();
    void L;
  }
  function restart() { AU.play('ui'); startFloor(G.floor, G.ending); }

  // ---- 入力 ----------------------------------------------------------
  var KEYMAP = {
    ArrowUp: 'F', KeyW: 'F', ArrowDown: 'B', KeyS: 'B', ArrowLeft: 'L', KeyA: 'L', ArrowRight: 'R', KeyD: 'R', Space: 'W'
  };
  window.addEventListener('keydown', function (e) {
    AU.unlock();
    var c = e.code;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Backspace'].indexOf(c) >= 0) e.preventDefault();
    if (c === 'KeyN') { AU.toggleMute(); return; }
    if (G.mode === 'title') return titleKey(c);
    if (G.mode === 'select') return selectKey(c);
    if (G.mode === 'pause') return pauseKey(c);
    if (G.mode === 'clear') {
      if ((c === 'Enter' || c === 'Space') && G.time - G.clearT > 0.6) nextFloor();
      else if (c === 'KeyR') restart();
      return;
    }
    if (G.mode === 'result') { if (c === 'Enter' || c === 'Space' || c === 'Escape') { AU.play('ui'); G.mode = 'select'; G.sel = 0; } return; }
    if (G.mode === 'caught') {
      if (G.time - G.caughtT < 0.5) return;
      if (c === 'KeyZ' || c === 'Backspace' || c === 'Enter' || c === 'Space') undo();
      else if (c === 'KeyR') restart();
      return;
    }
    if (G.mode !== 'play') return;
    if (c === 'Escape') { G.mode = 'pause'; G.pauseSel = 0; AU.play('ui'); return; }
    if (c === 'KeyZ' || c === 'Backspace') { undo(); return; }
    if (c === 'KeyR' && !e.repeat) { restart(); return; }
    if (c === 'KeyM' && !e.repeat) { G.bigMap = !G.bigMap; AU.play('ui'); return; }
    if (c === 'KeyH' && G.lastHint) { say(G.lastHint, 7); return; }
    var a = KEYMAP[c];
    if (a) { if (G.queue.length < 2) G.queue.push(a); }
  });

  function nextFloor() {
    AU.play('ui');
    if (G.floor + 1 < PARSED.length) startFloor(G.floor + 1);
    else startFloor(0, true);
  }

  var TITLE_ITEMS = [];
  function titleItems() {
    var it = [];
    if (save.cleared > 0 && save.cleared < PARSED.length) it.push({ k: 'cont', label: 'つづきから（地下' + (save.cleared + 1) + '階）' });
    it.push({ k: 'new', label: 'はじめから' });
    if (save.cleared > 0) it.push({ k: 'select', label: '階をえらぶ・記録' });
    return it;
  }
  function titleKey(c) {
    TITLE_ITEMS = titleItems();
    if (c === 'ArrowUp' || c === 'KeyW') { G.menu = (G.menu + TITLE_ITEMS.length - 1) % TITLE_ITEMS.length; AU.play('ui'); }
    else if (c === 'ArrowDown' || c === 'KeyS') { G.menu = (G.menu + 1) % TITLE_ITEMS.length; AU.play('ui'); }
    else if (c === 'Enter' || c === 'Space') titleGo(TITLE_ITEMS[G.menu].k);
  }
  function titleGo(k) {
    AU.unlock(); AU.play('ui');
    if (k === 'cont') startFloor(save.cleared);
    else if (k === 'new') { save.told = {}; writeSave(); startFloor(0); }
    else { G.mode = 'select'; G.sel = Math.min(save.cleared, PARSED.length - 1); }
  }
  function selectKey(c) {
    var n = PARSED.length, cols = 5;
    if (c === 'Escape') { G.mode = 'title'; G.menu = 0; AU.play('ui'); return; }
    if (c === 'ArrowLeft' || c === 'KeyA') G.sel = (G.sel + n - 1) % n;
    else if (c === 'ArrowRight' || c === 'KeyD') G.sel = (G.sel + 1) % n;
    else if (c === 'ArrowUp' || c === 'KeyW') G.sel = (G.sel + n - cols) % n;
    else if (c === 'ArrowDown' || c === 'KeyS') G.sel = (G.sel + cols) % n;
    else if (c === 'Enter' || c === 'Space') { if (G.sel <= save.cleared) { AU.play('ui'); startFloor(G.sel); } else AU.play('bump'); return; }
    else return;
    AU.play('ui');
  }
  var PAUSE_ITEMS = ['つづける', 'この階をやりなおす', 'タイトルへもどる'];
  function pauseKey(c) {
    if (c === 'Escape') { G.mode = 'play'; return; }
    if (c === 'ArrowUp' || c === 'KeyW') { G.pauseSel = (G.pauseSel + 2) % 3; AU.play('ui'); }
    else if (c === 'ArrowDown' || c === 'KeyS') { G.pauseSel = (G.pauseSel + 1) % 3; AU.play('ui'); }
    else if (c === 'Enter' || c === 'Space') pauseGo(G.pauseSel);
  }
  function pauseGo(i) {
    AU.play('ui');
    if (i === 0) G.mode = 'play';
    else if (i === 1) startFloor(G.floor, G.ending);
    else { G.mode = 'title'; G.menu = 0; }
  }

  // マウス・タッチ：画面のボタンを押せるようにする
  var hits = [];
  function hit(x, y, w, h, fn) { hits.push({ x: x, y: y, w: w, h: h, fn: fn }); }
  cv.addEventListener('pointerdown', function (e) {
    AU.unlock();
    var r = cv.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * W, y = (e.clientY - r.top) / r.height * H;
    for (var i = hits.length - 1; i >= 0; i--) {
      var b = hits[i];
      if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) { b.fn(); e.preventDefault(); return; }
    }
  });

  // ---- 更新 ----------------------------------------------------------
  function ease(p) { return p < 0 ? 0 : p > 1 ? 1 : p * p * (3 - 2 * p); }
  function update() {
    if (G.vt) {
      var p = (G.time - G.vt.t0) / G.vt.dur, e = ease(p);
      G.view.x = G.vt.fx + (G.vt.tx - G.vt.fx) * e;
      G.view.y = G.vt.fy + (G.vt.ty - G.vt.fy) * e;
      G.view.ang = G.vt.fa + (G.vt.ta - G.vt.fa) * e;
      if (p >= 1) { G.view.ang = G.vt.ta; G.vt = null; }
    }
    if (G.mode === 'play' && G.queue.length && (!G.vt || (G.time - G.vt.t0) / G.vt.dur > 0.72)) {
      if (G.vt) { G.view.x = G.vt.tx; G.view.y = G.vt.ty; G.view.ang = G.vt.ta; G.vt = null; }
      act(G.queue.shift());
    }
    if (G.mode === 'fadeout' && G.time - G.fade > 2.2) { G.mode = 'result'; }
    if (G.an && !G.an.done && G.an.step(5)) checkDead();
    if (G.mode === 'title') {
      if (G.time - G.titleT > 4.2) { G.titleT = G.time; G.titleStep = (G.titleStep + 1) % 4; }
    }
    G.flashes = G.flashes.filter(function (f) { return G.time - f.t0 < 0.9; });
  }

  // ---- 3Dの場面 -------------------------------------------------------
  function hash(x, y) { var n = (x * 73856093) ^ (y * 19349663); return (n >>> 0) % 6; }
  function poseOf(i) {
    var L = G.L, o = G.s.h[i], d = G.hd[i];
    if (o.st === R.SETTLED) return 'settled';
    if (L.haniwa[i].type === 'r') {
      if (o.st === R.ASLEEP) return 'sleep';
      var dist = Math.abs(o.x - G.s.px) + Math.abs(o.y - G.s.py);
      return dist <= 1 ? 'near' : d.pose ? 'b' : 'a';
    }
    if (G.time - d.stuck < 0.8) return 'stuck';
    return d.pose ? 'b' : 'a';
  }
  function buildScene() {
    var L = G.L, s = G.s, key = R.visKey(L, s), t = G.time;
    var mc = G.mirrorCell;
    if (mc && (G.mirrorDirty || ((t * 8) | 0) !== G.mirrorTick)) {
      G.mirrorTick = (t * 8) | 0; G.mirrorDirty = false;
      var behind = [], len = 0;
      for (var b = 1; b < 14; b++) {
        var bx = s.px - R.DX[s.pd] * b, by = s.py - R.DY[s.pd] * b;
        if (R.opaque(L, key, bx, by)) break;
        len = b;
        var hi = R.haniwaAt(s, bx, by);
        if (hi >= 0) behind.push({ dist: b, type: L.haniwa[hi].type, mark: L.haniwa[hi].mark, st: s.h[hi].st });
      }
      G.mirrorTex = T.mirrorActive(behind, len, t);
    }
    var sprites = [], i, x, y;
    for (y = 0; y < L.h; y++) for (x = 0; x < L.w; x++) {
      var m = L.ped[y * L.w + x];
      if (m >= 0) {
        var lit = !!(R.settledMask(L, s) & (1 << m));
        sprites.push({ x: x + 0.5, y: y + 0.5, data: T.ped(m, lit).data, scale: 1, bright: lit ? 0.25 : 0.55 });
      }
    }
    if (L.decor) L.decor.forEach(function (d) {
      sprites.push({ x: d.x + 0.5, y: d.y + 0.5, data: T.sprite(d.type, d.mark, 'settled').data, scale: d.type === 'r' ? 0.84 : 0.76, z: 0.02 });
    });
    for (i = 0; i < s.h.length; i++) {
      var o = s.h[i], d = G.hd[i], type = L.haniwa[i].type;
      var p = Math.min(1, (t - d.t0) / 0.16), e = ease(p);
      d.x = d.fx + (o.x - d.fx) * e; d.y = d.fy + (o.y - d.fy) * e;
      if (p >= 1) { d.fx = o.x; d.fy = o.y; }
      var wob = t - d.wob, sway = 0;
      if (wob < 0.55) sway = Math.sin(wob * 40) * 0.035 * (1 - wob / 0.55);
      if (type === 'b' && t - d.stuck < 0.4) sway = Math.sin((t - d.stuck) * 60) * 0.02;
      var gl = Math.max(0, 1 - (t - d.glow) / 0.9);
      sprites.push({
        x: d.x + 0.5, y: d.y + 0.5, data: T.sprite(type, L.haniwa[i].mark, poseOf(i)).data,
        scale: type === 'r' ? 0.84 : 0.76, z: 0.02 + Math.sin(Math.PI * p) * (p < 1 ? 0.05 : 0), sway: sway, bright: gl * 0.7
      });
    }
    if (L.gem && !s.gem) sprites.push({ x: L.gem.x + 0.5, y: L.gem.y + 0.5, data: T.gem().data, scale: 0.5, z: 0.22 + Math.sin(t * 2.4) * 0.04, bright: 0.85 });
    var exitOpen = !R.opaque(L, key, L.exit.x, L.exit.y);
    if (exitOpen) sprites.push({ x: L.exit.x + 0.5, y: L.exit.y + 0.5, data: T.stair().data, scale: 1, bright: 1 });
    return {
      floor: T.floor, ceil: T.ceil, sprites: sprites,
      light: 1.22 + Math.sin(t * 7.3) * 0.03 + Math.sin(t * 13.7) * 0.02,
      wallAt: function (cx, cy) {
        if (cx < 0 || cy < 0 || cx >= L.w || cy >= L.h) return T.walls[0];
        var k = cy * L.w + cx, tl = L.tile[k];
        if (tl === R.T_WALL) return T.walls[hash(cx, cy)];
        if (tl === R.T_MIRROR) return (mc && mc.x === cx && mc.y === cy && G.mirrorTex) ? G.mirrorTex : T.mirror;
        if (tl === 3) return null;
        var dm = L.door[k];
        if (dm >= 0 && !(key & (1 << dm))) return T.door[dm];
        if (L.exit.x === cx && L.exit.y === cy && !(key & 8)) return T.exit;
        return null;
      }
    };
  }

  // ---- 描画の部品 -----------------------------------------------------
  function text(str, x, y, size, col, align, font, weight) {
    ctx.font = (weight || '600') + ' ' + size + 'px ' + (font || FONT);
    ctx.textAlign = align || 'left'; ctx.textBaseline = 'middle';
    ctx.fillStyle = col; ctx.fillText(str, x, y);
  }
  function outlined(str, x, y, size, col, align, font) {
    ctx.font = '700 ' + size + 'px ' + (font || FONT);
    ctx.textAlign = align || 'left'; ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(4, size * 0.2); ctx.strokeStyle = 'rgba(16,10,8,0.9)';
    ctx.strokeText(str, x, y); ctx.fillStyle = col; ctx.fillText(str, x, y);
  }
  function panel(x, y, w, h, a, r) {
    ctx.fillStyle = 'rgba(18,12,10,' + (a === undefined ? 0.72 : a) + ')';
    rrect(x, y, w, h, r || 12); ctx.fill();
    ctx.strokeStyle = 'rgba(234,215,168,0.28)'; ctx.lineWidth = 2; rrect(x + 1, y + 1, w - 2, h - 2, r || 12); ctx.stroke();
  }
  function rrect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
  }
  function eyeIcon(x, y, open, col) {
    ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - 11, y); ctx.quadraticCurveTo(x, y - (open ? 9 : -6), x + 11, y);
    if (open) { ctx.quadraticCurveTo(x, y + 9, x - 11, y); }
    ctx.stroke();
    if (open) { ctx.beginPath(); ctx.arc(x, y, 3.4, 0, 7); ctx.fill(); }
  }
  function drawStars(x, y, n, size) {
    for (var i = 0; i < 3; i++) text('★', x + i * size * 1.1, y, size, i < n ? '#f2c24e' : 'rgba(255,255,255,0.18)', 'center');
  }

  function draw3D() {
    var scene = buildScene();
    var cam = { x: G.view.x, y: G.view.y, ang: G.view.ang };
    var bump = G.time - G.bumpT;
    if (bump < 0.14) {
      var k = Math.sin(bump / 0.14 * Math.PI) * 0.07 * G.bumpDir;
      cam.x += Math.sin(cam.ang) * k; cam.y -= Math.cos(cam.ang) * k;
    }
    REN.draw(cam, scene);
    var bob = 0, sx = 0;
    if (G.vt && G.vt.dur === MOVE_T) bob = Math.sin(Math.min(1, (G.time - G.vt.t0) / G.vt.dur) * Math.PI) * 7;
    if (G.time - G.shake < 0.4) { sx = Math.sin(G.time * 90) * 10 * (1 - (G.time - G.shake) / 0.4); }
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(REN.canvas, -12 + sx, -8 + bob, W + 24, H + 16);
    // ランタンの明かりのふち
    var vg = ctx.createRadialGradient(W / 2, H / 2 + 30, 240, W / 2, H / 2, 760);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(6,4,10,0.78)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    var warm = ctx.createRadialGradient(W / 2, H + 80, 40, W / 2, H + 80, 520);
    warm.addColorStop(0, 'rgba(255,170,70,0.13)'); warm.addColorStop(1, 'rgba(255,170,70,0)');
    ctx.fillStyle = warm; ctx.fillRect(0, 0, W, H);
  }

  // ---- 地図 ----------------------------------------------------------
  function drawMap(x0, y0, maxW, maxH, big) {
    var L = G.L, s = G.s, key = R.visKey(L, s);
    var cs = Math.floor(Math.min(maxW / L.w, maxH / L.h, big ? 44 : 20));
    var mw = cs * L.w, mh = cs * L.h, ox = x0 + (maxW - mw), oy = y0;
    if (big) { ox = x0 + (maxW - mw) / 2; oy = y0 + (maxH - mh) / 2; }
    panel(ox - 10, oy - 10, mw + 20, mh + 20, big ? 0.9 : 0.6);
    var x, y, i, vis = {};
    if (G.visNow) for (i = 0; i < G.visNow.length; i++) vis[G.visNow[i]] = 1;
    for (y = 0; y < L.h; y++) for (x = 0; x < L.w; x++) {
      i = y * L.w + x;
      var px = ox + x * cs, py = oy + y * cs;
      if (G.explored[i]) {
        ctx.fillStyle = vis[i] ? '#b9a27c' : '#7c6c58';
        ctx.fillRect(px, py, cs - 1, cs - 1);
        var pm = L.ped[i];
        if (pm >= 0) {
          var lit = R.settledMask(L, s) & (1 << pm);
          ctx.fillStyle = lit ? '#5c4a30' : '#fff0c0';
          ctx.beginPath(); ctx.arc(px + cs / 2, py + cs / 2, cs * 0.42, 0, 7); ctx.fill();
          T.drawMark(ctx, pm, px + cs / 2 - 0.5, py + cs / 2 - 0.5, cs * 0.22, lit ? '#b9a27c' : '#7c2414', Math.max(1.5, cs * 0.1));
        }
        if (L.gem && !s.gem && L.gem.x === x && L.gem.y === y) { ctx.fillStyle = '#4fe0b0'; ctx.beginPath(); ctx.arc(px + cs / 2, py + cs / 2, cs * 0.22, 0, 7); ctx.fill(); }
      } else {
        // 探索済みの床に接した壁・戸だけを描く
        var near = false;
        for (var d = 0; d < 4; d++) {
          var nx = x + R.DX[d], ny = y + R.DY[d];
          if (nx >= 0 && ny >= 0 && nx < L.w && ny < L.h && G.explored[ny * L.w + nx]) near = true;
        }
        if (!near) continue;
        var dm = L.door[i];
        if (L.exit.x === x && L.exit.y === y) {
          ctx.fillStyle = '#e8c66a'; ctx.fillRect(px + 1, py + 1, cs - 3, cs - 3);
        } else if (dm >= 0) {
          ctx.fillStyle = '#a03a22'; ctx.fillRect(px + 1, py + 1, cs - 3, cs - 3);
          T.drawMark(ctx, dm, px + cs / 2 - 0.5, py + cs / 2 - 0.5, cs * 0.22, '#ead7a8', Math.max(1.5, cs * 0.1));
        } else if (L.tile[i] === R.T_MIRROR) {
          ctx.fillStyle = '#2c241e'; ctx.fillRect(px, py, cs - 1, cs - 1);
          ctx.fillStyle = '#9fd0b0'; ctx.beginPath(); ctx.arc(px + cs / 2, py + cs / 2, cs * 0.3, 0, 7); ctx.fill();
        } else if (L.tile[i] === R.T_WALL) { ctx.fillStyle = '#2c241e'; ctx.fillRect(px, py, cs - 1, cs - 1); }
      }
    }
    if (!R.opaque(L, key, L.exit.x, L.exit.y)) {
      ctx.fillStyle = '#fff3c4'; ctx.fillRect(ox + L.exit.x * cs + 1, oy + L.exit.y * cs + 1, cs - 3, cs - 3);
    }
    // ハニワ（いちど見たものだけ）
    for (i = 0; i < s.h.length; i++) {
      if (!G.hd[i].known) continue;
      var o = s.h[i], d2 = G.hd[i], hx = ox + (d2.x + 0.5) * cs, hy = oy + (d2.y + 0.5) * cs;
      var red = L.haniwa[i].type === 'r';
      ctx.fillStyle = o.st === R.SETTLED ? '#8d7a62' : red ? '#d2603a' : '#7fa2c4';
      ctx.beginPath(); ctx.arc(hx, hy, cs * 0.4, 0, 7); ctx.fill();
      ctx.strokeStyle = '#1a1310'; ctx.lineWidth = 1.5; ctx.stroke();
      T.drawMark(ctx, L.haniwa[i].mark, hx, hy, cs * 0.19, '#fff3d6', Math.max(1.5, cs * 0.09));
      if (red && o.st === R.AWAKE && !G.seen[i]) {
        var pu = (G.time * 1.6) % 1;
        ctx.strokeStyle = 'rgba(255,120,80,' + (1 - pu) + ')'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(hx, hy, cs * (0.45 + pu * 0.5), 0, 7); ctx.stroke();
      }
    }
    // 自分
    var ax = ox + G.view.x * cs, ay = oy + G.view.y * cs;
    ctx.save(); ctx.translate(ax, ay); ctx.rotate(G.view.ang);
    ctx.fillStyle = '#fff6da'; ctx.strokeStyle = '#1a1310'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, -cs * 0.46); ctx.lineTo(cs * 0.36, cs * 0.36); ctx.lineTo(0, cs * 0.16); ctx.lineTo(-cs * 0.36, cs * 0.36); ctx.closePath();
    ctx.fill(); ctx.stroke(); ctx.restore();
    return { x: ox - 10, y: oy - 10, w: mw + 20, h: mh + 20 };
  }

  // ---- HUD -----------------------------------------------------------
  function drawHUD() {
    var L = G.L, s = G.s, i;
    // 左上：階と歩数
    panel(18, 16, 330, 84, 0.6);
    if (G.ending) {
      text('おやすみの間', 36, 44, 26, '#ead7a8', 'left', SERIF, '700');
      text('みんな、よく眠っている', 36, 78, 18, '#cdbb96');
    } else {
      text('地下 ' + (G.floor + 1) + ' 階', 36, 43, 20, '#cdbb96');
      text(L.def.name, 122, 43, 26, '#ead7a8', 'left', SERIF, '700');
      text('歩数 ' + s.steps, 36, 79, 20, '#f4ead0');
      var parNow = s.gem && L.def.parGem ? L.def.parGem : L.def.par;
      if (parNow) text('めやす ' + parNow, 140, 79, 18, '#a8987a');
      if (L.gem) {
        ctx.imageSmoothingEnabled = true;
        ctx.globalAlpha = s.gem ? 1 : 0.4;
        ctx.drawImage(T.gem().canvas, 268, 40, 76, 76);
        ctx.globalAlpha = 1;
      }
      if (G.dead) {
        var da = 0.75 + Math.sin(G.time * 5) * 0.2;
        ctx.fillStyle = 'rgba(120,30,16,' + da.toFixed(2) + ')'; rrect(18, 106, 330, 40, 10); ctx.fill();
        text('行きづまり　Z：戻す　R：やりなおし', 183, 127, 17, '#ffe2cc', 'center');
      }
    }
    // 上中央：向き
    var a = ((G.view.ang / (Math.PI / 2)) % 4 + 4) % 4;
    panel(W / 2 - 110, 14, 220, 52, 0.55, 26);
    for (i = -2; i <= 2; i++) {
      var di = Math.round(a) + i, off = (di - a) * 62;
      if (Math.abs(off) > 96) continue;
      var al = 1 - Math.abs(off) / 110;
      text(DIRN[((di % 4) + 4) % 4], W / 2 + off, 41, Math.abs(off) < 20 ? 28 : 20, 'rgba(244,234,208,' + al.toFixed(2) + ')', 'center', SERIF, '700');
    }
    ctx.fillStyle = '#e8c66a'; ctx.beginPath(); ctx.moveTo(W / 2 - 7, 66); ctx.lineTo(W / 2 + 7, 66); ctx.lineTo(W / 2, 58); ctx.closePath(); ctx.fill();

    // 右上：地図
    if (!G.bigMap) {
      drawMap(W - 18 - 250, 26, 250, 220, false);
    }

    // 左下：ハニワの様子
    if (s.h.length) {
      var bw = 122, bx0 = 18, by0 = H - 152;
      for (i = 0; i < s.h.length; i++) {
        var o = s.h[i], hw = L.haniwa[i], x = bx0 + i * (bw + 10);
        var red = hw.type === 'r', danger = red && o.st === R.AWAKE && !G.seen[i];
        panel(x, by0, bw, 134, 0.62);
        if (danger) {
          var pu = 0.45 + Math.sin(G.time * 7) * 0.3;
          ctx.strokeStyle = 'rgba(255,110,70,' + pu.toFixed(2) + ')'; ctx.lineWidth = 3; rrect(x + 1, by0 + 1, bw - 2, 132, 12); ctx.stroke();
        }
        var unknown = !G.hd[i].known;
        ctx.globalAlpha = unknown ? 0.25 : 1;
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(T.sprite(hw.type, hw.mark, unknown ? (red ? 'sleep' : 'a') : poseOf(i)).canvas, x + 21, by0 + 2, 80, 80);
        ctx.globalAlpha = 1;
        var label, col, open = false, showEye = false;
        if (unknown) { label = 'まだ見ていない'; col = '#8f8068'; }
        else if (o.st === R.SETTLED) { label = 'おやすみ'; col = '#e8c66a'; }
        else if (red && o.st === R.ASLEEP) { label = 'ねむっている'; col = '#b9a98a'; }
        else if (red) { showEye = true; open = G.seen[i]; label = open ? '見ている：止まる' : '見ていない：来る'; col = open ? '#f4ead0' : '#ff8a66'; }
        else { showEye = true; open = G.seen[i]; label = open ? '見ている：うごく' : '見ていない：じっと'; col = open ? '#bfe0ff' : '#b9a98a'; }
        if (showEye) eyeIcon(x + bw / 2, by0 + 92, open, col);
        text(label, x + bw / 2, by0 + 116, 14.5, col, 'center');
      }
    }

    // 見ていないほうで動いた合図
    G.flashes.forEach(function (f) {
      var p = (G.time - f.t0) / 0.9, al = (1 - p) * (0.35 + f.near * 0.6), g;
      if (f.side === 'L' || f.side === 'R') {
        var lx = f.side === 'L' ? 0 : W - 150;
        g = ctx.createLinearGradient(f.side === 'L' ? 0 : W, 0, f.side === 'L' ? 150 : W - 150, 0);
        g.addColorStop(0, 'rgba(255,110,60,' + al.toFixed(2) + ')'); g.addColorStop(1, 'rgba(255,110,60,0)');
        ctx.fillStyle = g; ctx.fillRect(lx, 0, 150, H);
        outlined('ゴト', f.side === 'L' ? 70 : W - 70, H / 2 - p * 20, 34 + f.near * 16, 'rgba(255,220,190,' + (1 - p).toFixed(2) + ')', 'center', SERIF);
      } else if (f.side === 'B') {
        g = ctx.createLinearGradient(0, H, 0, H - 150);
        g.addColorStop(0, 'rgba(255,110,60,' + al.toFixed(2) + ')'); g.addColorStop(1, 'rgba(255,110,60,0)');
        ctx.fillStyle = g; ctx.fillRect(0, H - 150, W, 150);
        outlined('ゴト', W / 2, H - 64 - p * 16, 34 + f.near * 16, 'rgba(255,220,190,' + (1 - p).toFixed(2) + ')', 'center', SERIF);
      }
    });

    // 下中央：ことば
    if (G.caption && G.mode !== 'caught' && G.mode !== 'clear') {
      var ct = G.time - G.caption.t0;
      if (ct > G.caption.dur) G.caption = null;
      else {
        var ca = Math.min(1, ct / 0.3) * Math.min(1, (G.caption.dur - ct) / 0.6);
        ctx.globalAlpha = ca;
        ctx.font = '600 23px ' + FONT;
        var tw = Math.min(820, ctx.measureText(G.caption.text).width + 56);
        panel(W / 2 - tw / 2, H - 208, tw, 50, 0.78, 25);
        text(G.caption.text, W / 2, H - 182, 23, '#f7efd8', 'center');
        ctx.globalAlpha = 1;
      }
    }

    // 右下：操作
    var keys = [
      ['A', '左を向く', 'L'], ['W', '前へ', 'F'], ['D', '右を向く', 'R'], ['S', 'うしろへ', 'B'], ['Space', '待つ', 'W'], ['Z', '一手もどす', 'undo']
    ];
    var kx = W - 18 - 384, ky = H - 106;
    panel(kx, ky, 384, 90, 0.5);
    keys.forEach(function (k, n) {
      var cx = kx + 14 + (n % 3) * 124, cy = ky + 12 + ((n / 3) | 0) * 36;
      ctx.fillStyle = 'rgba(234,215,168,0.16)'; rrect(cx, cy, k[0].length > 1 ? 58 : 30, 28, 6); ctx.fill();
      text(k[0], cx + (k[0].length > 1 ? 29 : 15), cy + 15, 16, '#f4ead0', 'center');
      text(k[1], cx + (k[0].length > 1 ? 64 : 37), cy + 15, 15, '#cdbb96');
      hit(cx - 4, cy - 4, 122, 36, function () {
        if (k[2] === 'undo') undo(); else if (G.queue.length < 2) G.queue.push(k[2]);
      });
    });
    text('R やりなおし　M 地図　H ことば　N 音　Esc メニュー', W - 20, H - 122, 14, 'rgba(205,187,150,0.8)', 'right');

    // 階のなまえ（はじめの数秒）
    var bt = G.time - G.banner;
    if (bt < 2.6 && !G.ending && G.mode === 'play') {
      var ba = Math.min(1, bt / 0.4) * Math.min(1, (2.6 - bt) / 0.7);
      ctx.globalAlpha = ba;
      outlined('地下 ' + (G.floor + 1) + ' 階', W / 2, 196, 28, '#cdbb96', 'center', SERIF);
      outlined(L.def.name, W / 2, 252, 58, '#f4ead0', 'center', SERIF);
      ctx.globalAlpha = 1;
    }
    if (G.bigMap) {
      ctx.fillStyle = 'rgba(8,6,8,0.6)'; ctx.fillRect(0, 0, W, H);
      drawMap(240, 110, 800, 500, true);
      text('地図（M で閉じる）　明るいマスが いま見えている範囲', W / 2, 660, 20, '#cdbb96', 'center');
    }
  }

  function drawCaught() {
    var t = G.time - G.caughtT, L = G.L;
    ctx.fillStyle = 'rgba(40,8,4,' + Math.min(0.55, t * 2) + ')'; ctx.fillRect(0, 0, W, H);
    var hw = L.haniwa[G.caughtBy], sc = 300 + ease(Math.min(1, t / 0.3)) * 260;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(T.sprite(hw.type, hw.mark, 'near').canvas, W / 2 - sc / 2, H / 2 - sc * 0.52 + Math.sin(t * 5) * 6, sc, sc);
    if (t > 0.3) {
      outlined('つかまった！', W / 2, 96, 68, '#ffd9a8', 'center', SERIF);
      panel(W / 2 - 290, H - 132, 580, 96, 0.82);
      text('見ていないあいだに、一歩ずつ寄ってくる。', W / 2, H - 102, 21, '#f4ead0', 'center');
      text('Z：一手もどす　　R：この階をやりなおす', W / 2, H - 64, 22, '#e8c66a', 'center');
      hit(W / 2 - 290, H - 132, 580, 96, undo);
    }
  }

  function drawClear() {
    var t = G.time - G.clearT, info = G.clearInfo, L = G.L;
    ctx.fillStyle = 'rgba(255,236,190,' + Math.max(0, 0.5 - t) + ')'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(10,7,8,' + Math.min(0.55, t) + ')'; ctx.fillRect(0, 0, W, H);
    var a = Math.min(1, t / 0.4);
    ctx.globalAlpha = a;
    panel(W / 2 - 300, 150, 600, 400, 0.88, 18);
    text('地下 ' + (G.floor + 1) + ' 階　' + L.def.name, W / 2, 196, 22, '#cdbb96', 'center');
    text('みんな、おやすみ。', W / 2, 252, 46, '#f4ead0', 'center', SERIF, '700');
    drawStars(W / 2 - 55, 322, info.stars, 50);
    text('歩数 ' + info.steps + (info.par ? '　／　めやす ' + info.par + (info.gem && info.hasGem ? '（まが玉あり）' : '') : '') + (info.newBest ? '　自己最少' : ''), W / 2, 388, 22, '#f4ead0', 'center');
    if (info.hasGem) {
      ctx.globalAlpha = a * (info.gem ? 1 : 0.3);
      ctx.drawImage(T.gem().canvas, W / 2 - 150, 404, 64, 64);
      ctx.globalAlpha = a;
      text(info.gem ? 'まが玉を 持ち帰った' : 'まが玉は 見つけていない', W / 2 - 84, 440, 21, info.gem ? '#8ff0cc' : '#8f8068');
    }
    var last = G.floor + 1 >= PARSED.length;
    text(last ? 'Enter：奥へ進む　　R：もう一度' : 'Enter：つぎの階へ　　R：もう一度', W / 2, 508, 23, '#e8c66a', 'center');
    ctx.globalAlpha = 1;
    hit(W / 2 - 300, 150, 600, 400, function () { if (G.time - G.clearT > 0.6) nextFloor(); });
  }

  function drawPause() {
    ctx.fillStyle = 'rgba(8,6,8,0.66)'; ctx.fillRect(0, 0, W, H);
    panel(W / 2 - 220, 210, 440, 290, 0.9, 18);
    text('ひとやすみ', W / 2, 256, 30, '#ead7a8', 'center', SERIF, '700');
    PAUSE_ITEMS.forEach(function (s, i) {
      var y = 318 + i * 56, on = i === G.pauseSel;
      if (on) { ctx.fillStyle = 'rgba(232,198,106,0.18)'; rrect(W / 2 - 180, y - 24, 360, 48, 10); ctx.fill(); }
      text(s, W / 2, y, 24, on ? '#fff3d0' : '#b9a98a', 'center');
      hit(W / 2 - 180, y - 24, 360, 48, function () { pauseGo(i); });
    });
  }

  // ---- タイトル -------------------------------------------------------
  function drawTitle() {
    // 背景：1階の通路。まばたきのたびにハニワが一歩近づく
    var L = PARSED[0], st = G.titleStep, t = G.time - G.titleT;
    var hy = [1, 2, 3, 3][st], scene, sp = [];
    sp.push({ x: 3.5, y: hy + 0.5 + (st === 3 ? -0.15 : 0), data: T.sprite('r', 0, st === 3 ? 'near' : (st % 2 ? 'b' : 'a')).data, scale: 0.84, z: 0.02,
      sway: t < 0.9 ? Math.sin(t * 40) * 0.03 * Math.max(0, 1 - (t - 0.35) / 0.55) : 0 });
    scene = {
      floor: T.floor, ceil: T.ceil, sprites: sp, light: 1.25 + Math.sin(G.time * 7.3) * 0.03,
      wallAt: function (cx, cy) {
        if (cx < 0 || cy < 0 || cx >= L.w || cy >= L.h) return T.walls[0];
        return L.tile[cy * L.w + cx] === R.T_WALL ? T.walls[hash(cx, cy)] : null;
      }
    };
    REN.draw({ x: 3.5, y: 4.62, ang: Math.sin(G.time * 0.4) * 0.03 }, scene);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(REN.canvas, -12, -8, W + 24, H + 16);
    var vg = ctx.createRadialGradient(W / 2, H / 2, 200, W / 2, H / 2, 760);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(6,4,10,0.85)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    // まばたき
    if (t < 0.34) { ctx.fillStyle = 'rgba(4,3,6,' + (1 - Math.abs(t - 0.12) / 0.22).toFixed(2) + ')'; ctx.fillRect(0, 0, W, H); }
    var g = ctx.createLinearGradient(0, 0, 0, 250);
    g.addColorStop(0, 'rgba(8,5,8,0.85)'); g.addColorStop(1, 'rgba(8,5,8,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, 250);
    outlined('うしろのハニワ', W / 2, 104, 92, '#f4e3b4', 'center', SERIF);
    outlined('見ているあいだは、うごかない。', W / 2, 180, 26, '#e0c9a0', 'center', SERIF);
    TITLE_ITEMS = titleItems();
    if (G.menu >= TITLE_ITEMS.length) G.menu = 0;
    var y0 = H - 70 - TITLE_ITEMS.length * 54;
    panel(W / 2 - 230, y0 - 24, 460, TITLE_ITEMS.length * 54 + 24, 0.7, 16);
    TITLE_ITEMS.forEach(function (it, i) {
      var y = y0 + 16 + i * 54, on = i === G.menu;
      if (on) { ctx.fillStyle = 'rgba(232,198,106,0.2)'; rrect(W / 2 - 210, y - 23, 420, 46, 10); ctx.fill(); }
      text(it.label, W / 2, y, 25, on ? '#fff3d0' : '#b9a98a', 'center');
      hit(W / 2 - 210, y - 23, 420, 46, function () { G.menu = i; titleGo(it.k); });
    });
    text('↑↓ でえらぶ　Enter で決定　／　音が出ます（N で消音）', W / 2, H - 28, 16, 'rgba(205,187,150,0.85)', 'center');
  }

  // ---- 階えらび・記録 --------------------------------------------------
  function totals() {
    var st = 0, gm = 0, gmAll = 0;
    PARSED.forEach(function (L) {
      var b = save.best[L.def.id];
      if (b) st += save.stars[L.def.id] || starsFor(b, L.def.par);
      if (L.gem) { gmAll++; if (save.gems[L.def.id]) gm++; }
    });
    return { stars: st, gems: gm, gemsAll: gmAll };
  }
  function drawSelect() {
    ctx.fillStyle = '#120d0c'; ctx.fillRect(0, 0, W, H);
    var g = ctx.createRadialGradient(W / 2, 200, 60, W / 2, 300, 800);
    g.addColorStop(0, 'rgba(178,58,30,0.22)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    text('階をえらぶ', W / 2, 62, 40, '#f4e3b4', 'center', SERIF, '700');
    var tt = totals();
    text('★ ' + tt.stars + ' / ' + PARSED.length * 3 + '　　まが玉 ' + tt.gems + ' / ' + tt.gemsAll, W / 2, 112, 22, '#cdbb96', 'center');
    var cols = 5, cw = 244, ch = 200, x0 = (W - cols * cw) / 2 + 8, y0 = 160;
    PARSED.forEach(function (L, i) {
      var x = x0 + (i % cols) * cw, y = y0 + ((i / cols) | 0) * (ch + 14), open = i <= save.cleared, on = i === G.sel;
      panel(x, y, cw - 16, ch, on ? 0.95 : 0.6);
      if (on) { ctx.strokeStyle = '#e8c66a'; ctx.lineWidth = 3; rrect(x + 1, y + 1, cw - 18, ch - 2, 12); ctx.stroke(); }
      ctx.globalAlpha = open ? 1 : 0.35;
      text('地下 ' + (i + 1) + ' 階', x + 20, y + 32, 18, '#cdbb96');
      text(open ? L.def.name : '？？？', x + 20, y + 70, 24, '#f4ead0', 'left', SERIF, '700');
      var b = save.best[L.def.id];
      if (b) {
        drawStars(x + 36, y + 116, save.stars[L.def.id] || starsFor(b, L.def.par), 28);
        text('最少 ' + b + ' 歩（めやす ' + L.def.par + (L.def.parGem !== L.def.par ? '／玉あり ' + L.def.parGem : '') + '）', x + 16, y + 166, 14, '#cdbb96');
      } else text(open ? 'まだ' : '', x + 20, y + 116, 18, '#8f8068');
      if (L.gem) { ctx.globalAlpha = (open ? 1 : 0.35) * (save.gems[L.def.id] ? 1 : 0.25); ctx.drawImage(T.gem().canvas, x + cw - 80, y + 86, 56, 56); }
      ctx.globalAlpha = 1;
      hit(x, y, cw - 16, ch, function () { G.sel = i; if (open) { AU.play('ui'); startFloor(i); } });
    });
    text('←→↑↓ でえらぶ　Enter であそぶ　Esc でタイトルへ', W / 2, H - 34, 18, '#cdbb96', 'center');
    if (save.finished) text('★は少ない歩数で。まが玉を取った回は「玉あり」のめやすで数える。', W / 2, H - 70, 18, '#a8987a', 'center');
  }

  function drawResult() {
    ctx.fillStyle = '#f6ecd2'; ctx.fillRect(0, 0, W, H);
    var g = ctx.createRadialGradient(W / 2, -100, 50, W / 2, 200, 900);
    g.addColorStop(0, 'rgba(255,255,255,0.9)'); g.addColorStop(1, 'rgba(240,200,130,0.55)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    text('朝の光のなかへ', W / 2, 130, 60, '#5a3a22', 'center', SERIF, '700');
    text('古墳の奥では、ハニワたちが みんな眠っている。', W / 2, 206, 25, '#6b4a30', 'center', SERIF);
    var tt = totals(), n = PARSED.length;
    ctx.imageSmoothingEnabled = false;
    var names = [['r', 0, 'settled'], ['b', 1, 'settled'], ['r', 2, 'settled'], ['b', 0, 'settled'], ['r', 1, 'settled']];
    names.forEach(function (s, i) {
      ctx.drawImage(T.sprite(s[0], s[1], s[2]).canvas, W / 2 - 400 + i * 160, 250 + Math.sin(G.time * 1.2 + i) * 4, 160, 160);
    });
    text('★ ' + tt.stars + ' / ' + n * 3, W / 2 - 150, 470, 34, '#8a5a1e', 'center', SERIF, '700');
    text('まが玉 ' + tt.gems + ' / ' + tt.gemsAll, W / 2 + 150, 470, 34, '#1f7a5e', 'center', SERIF, '700');
    var msg = tt.gems >= tt.gemsAll && tt.stars >= n * 3 ? 'すべての★とまが玉がそろった。これ以上ない、見事なおもり役。'
      : tt.gems >= tt.gemsAll ? 'まが玉がぜんぶそろった。あとは、もっと少ない歩数で。'
        : '取りのこしたまが玉と★が、まだ古墳に残っている。';
    text(msg, W / 2, 540, 22, '#6b4a30', 'center');
    text('Enter：記録と階えらびへ', W / 2, 628, 24, '#8a5a1e', 'center');
    hit(0, 0, W, H, function () { AU.play('ui'); G.mode = 'select'; G.sel = 0; });
  }

  // ---- 1フレーム ------------------------------------------------------
  function render() {
    hits = [];
    if (G.mode === 'title') { drawTitle(); return; }
    if (G.mode === 'select') { drawSelect(); return; }
    if (G.mode === 'result') { drawResult(); return; }
    draw3D();
    drawHUD();
    if (G.mode === 'caught') drawCaught();
    else if (G.mode === 'clear') drawClear();
    else if (G.mode === 'pause') drawPause();
    else if (G.mode === 'fadeout') {
      ctx.fillStyle = 'rgba(255,244,214,' + Math.min(1, (G.time - G.fade) / 1.8).toFixed(2) + ')'; ctx.fillRect(0, 0, W, H);
    }
  }
  var last = 0;
  function frame(ts) {
    if (!dbg.hold) {
      var dt = Math.min(0.05, (ts - last) / 1000 || 0.016);
      last = ts;
      G.time += dt; update(); render();
    }
    requestAnimationFrame(frame);
  }
  function fit() {
    var s = Math.min(window.innerWidth / W, window.innerHeight / H);
    cv.style.width = Math.floor(W * s) + 'px'; cv.style.height = Math.floor(H * s) + 'px';
  }
  window.addEventListener('resize', fit); fit();
  requestAnimationFrame(frame);

  // 検証用の入口（遊びには使わない）
  window.__hb = {
    G: G, R: R, dbg: dbg, save: function () { return save; },
    step: function (n, dt) { for (var i = 0; i < (n || 1); i++) { G.time += dt || 1 / 60; update(); } render(); },
    act: function (seq) { for (var i = 0; i < seq.length; i++) { if (G.vt) { G.view.x = G.vt.tx; G.view.y = G.vt.ty; G.view.ang = G.vt.ta; G.vt = null; } act(seq[i]); } },
    goto: function (i, ending) { startFloor(i, ending); },
    undo: undo, reset: function () { localStorage.removeItem(SAVE_KEY); save = loadSave(); }
  };
})();
