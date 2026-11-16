// LUMEN REEL — 進行・入力・画面
(function () {
  'use strict';
  const R = window.RD, C = R.C, W = R.W, H = R.H, LR = window.LR, SND = window.SND;
  const cv = document.getElementById('cv'), g = cv.getContext('2d');
  const STEP = 0.15;
  const SAVE_KEY = 'lumenreel.save', BEST_KEY = 'lumenreel.best';
  const mod = (a, n) => ((a % n) + n) % n;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  let S = null;
  const V = {
    scene: 'title', phase: 'idle', time: 0, scale: 1, mouse: { x: -1, y: -1 }, items: [], hover: null,
    reels: [], offs: [], holds: [], heldSpin: [], ships: [], pops: [], parts: [], timers: [], flashes: {},
    beam: null, prev: null, prevHit: null, will: {}, overlay: null, shop: null, banner: null,
    disp: { coins: 0, stars: 0 }, dawn: 0, shake: 0, lightning: 0, snap: null, msg: null, msgT: 0, hasSave: false, best: {},
  };

  // ---------- 汎用 ----------
  function after(sec, fn) { V.timers.push({ t: V.time + sec, fn: fn }); }
  function pop(x, y, str, col, size, dur) { V.pops.push({ x: x, y: y, str: str, col: col || C.light, size: size || 24, t0: V.time, dur: dur || 1.0 }); }
  function spark(x, y, n, col, sp) {
    for (let i = 0; i < n; i++) { const a = Math.random() * 7, v = (sp || 120) * (0.3 + Math.random()); V.parts.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 30, t0: V.time, dur: 0.5 + Math.random() * 0.5, col: col || C.light, r: 2 + Math.random() * 2.5 }); }
  }
  function say(str, sec) { V.msg = str; V.msgT = V.time + (sec || 3.5); }
  function item(x, y, w, h, o) { const it = Object.assign({ x: x, y: y, w: w, h: h }, o); V.items.push(it); return it; }
  function isHover(it) { const m = V.mouse; return m.x >= it.x && m.x < it.x + it.w && m.y >= it.y && m.y < it.y + it.h; }
  function button(x, y, w, h, label, cb, o) {
    o = o || {};
    const it = item(x, y, w, h, { cb: o.disabled ? null : cb, info: o.info });
    const hv = isHover(it) && !o.disabled;
    R.rr(g, x, y, w, h, o.r || 10);
    const gr = g.createLinearGradient(0, y, 0, y + h);
    if (o.primary) { gr.addColorStop(0, hv ? '#ffe08a' : '#ffd166'); gr.addColorStop(1, hv ? '#f2a53a' : '#e0912a'); }
    else if (o.active) { gr.addColorStop(0, '#ffe08a'); gr.addColorStop(1, '#d99a36'); }
    else { gr.addColorStop(0, hv ? '#4a4470' : '#373258'); gr.addColorStop(1, hv ? '#35305a' : '#262240'); }
    g.globalAlpha = o.disabled ? 0.38 : 1;
    g.fillStyle = gr; g.fill(); g.lineWidth = 2; g.strokeStyle = o.primary || o.active ? '#fff3c4' : C.brass; g.stroke();
    const dark = o.primary || o.active;
    const sz = o.size || 18;
    if (label) R.text(g, label, x + w / 2, y + h / 2 + (o.sub ? -sz * 0.42 : 1), sz, dark ? '#3a2408' : C.cream, 'center', '800');
    if (o.sub) R.text(g, o.sub, x + w / 2, y + h / 2 + sz * 0.5 + 6, sz > 24 ? 15 : 13, dark ? '#5a3a10' : 'rgba(246,236,210,0.7)', 'center', '600');
    g.globalAlpha = 1;
    return hv;
  }
  function panel(x, y, w, h, a) {
    R.rr(g, x, y, w, h, 14); g.fillStyle = 'rgba(12,16,38,' + (a == null ? 0.9 : a) + ')'; g.fill();
    g.lineWidth = 2; g.strokeStyle = 'rgba(210,162,76,0.7)'; g.stroke();
  }

  // ---------- 保存 ----------
  function save(mode) {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify({ mode: mode, s: mode === 'night' ? V.snap : JSON.stringify(S), shopMode: V.shop ? V.shop.mode : null })); V.hasSave = true; } catch (e) { /* 保存できなくても遊べる */ }
  }
  function clearSave() { try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* noop */ } V.hasSave = false; }
  function loadBest() { try { V.best = JSON.parse(localStorage.getItem(BEST_KEY)) || {}; V.hasSave = !!localStorage.getItem(SAVE_KEY); } catch (e) { V.best = {}; } }
  function saveBest() {
    const k = S.hard ? 'h' : 'n', b = V.best[k];
    const better = !b || S.wrecks < b.wrecks || (S.wrecks === b.wrecks && S.stars > b.stars);
    if (better) V.best[k] = { wrecks: S.wrecks, stars: S.stars, shot: S.bestShot };
    try { localStorage.setItem(BEST_KEY, JSON.stringify(V.best)); } catch (e) { /* noop */ }
    return better;
  }

  // ---------- 進行 ----------
  function syncReels() {
    V.reels = S.reels.map(r => ({ posf: r.pos, tw: null, bounce: -9 }));
    V.offs = S.reels.map(() => 0); V.holds = S.reels.map(() => false); V.heldSpin = S.reels.map(() => false);
  }
  function syncShips() {
    const old = {};
    for (const v of V.ships) old[v.id] = v;
    const next = V.ships.filter(v => v.state !== 'sail');
    for (const sh of S.ships) {
      const v = old[sh.id] || { id: sh.id, type: sh.type, lane: sh.lane, dist: sh.dist, shown: sh.need, shownParts: sh.parts ? sh.parts.slice() : null, glow: 0, alpha: 0, state: 'sail', born: V.time };
      v.need = sh.need; v.thr = sh.thr; v.max = sh.max; v.parts = sh.parts; v.target = sh.dist;
      v.danger = sh.dist - LR.SHIP[sh.type].speed <= 0.01;
      next.push(v);
    }
    V.ships = next;
  }
  function newGame(hard) {
    S = LR.newGame((Date.now() ^ (Math.random() * 1e9)) & 0x7fffffff, hard);
    V.disp.coins = 0; V.disp.stars = 0; V.ships = [];
    beginNight();
  }
  function beginNight() {
    V.snap = JSON.stringify(S); V.shop = null; save('night');
    LR.startNight(S);
    V.ships = []; V.pops = []; V.beam = null; V.prev = null; V.will = {}; V.dawn = 0; V.banner = null; V.msg = null;
    syncReels(); syncShips();
    V.scene = 'play'; V.phase = 'intro'; V.overlay = { kind: 'intro', t0: V.time };
    SND.setRoot([0, -2, 3, 5, -4][S.night - 1]);
    announce(S.ships);
  }
  function continueGame() {
    try {
      const d = JSON.parse(localStorage.getItem(SAVE_KEY));
      S = JSON.parse(d.s); V.disp.coins = S.coins; V.disp.stars = S.stars; V.ships = [];
      if (d.mode === 'shop') { syncReels(); openShop(d.shopMode || 'advance', true); }
      else beginNight();
    } catch (e) { newGame(false); }
  }

  // 初めて見る種類の舟が現れたら、ひとこと説明する
  function announce(ships) {
    S.seen = S.seen || { boat: 1 };
    for (const sh of ships) {
      if (S.seen[sh.type]) continue;
      S.seen[sh.type] = 1;
      say('【' + LR.SHIP[sh.type].name + '】' + LR.SHIP[sh.type].desc, 9);
    }
  }
  function tweenFn(p) { const a = 0.68, v = 1 / (a + (1 - a) / 2); return p < a ? v * p : v * a + v * (p - a) - v * (p - a) * (p - a) / (2 * (1 - a)); }

  function spin() {
    if (V.phase !== 'ready') return;
    const n = S.reels.length, holds = V.holds.slice();
    const old = S.reels.map(r => r.pos);
    LR.spin(S, holds);
    V.heldSpin = holds; V.holds = S.reels.map(() => false);
    V.phase = 'spin'; V.prev = null; V.will = {}; V.reach = null; V.msg = null;
    SND.spinStart();
    const free = []; for (let c = 0; c < n; c++) if (!holds[c]) free.push(c);
    // リーチ：最後の一本以外で、同じ部品が横に並んでいる
    let reach = false;
    const last = free[free.length - 1];
    if (free.length) {
      for (let r = 0; r < 3; r++) {
        const t0 = LR.cellAt(S.reels[last === 0 ? 1 : 0], r).t;
        if (t0 === 'blank') continue;
        let ok = true;
        for (let c = 0; c < n; c++) if (c !== last) { const cl = LR.cellAt(S.reels[c], r); if (cl.t !== t0 || cl.gull) ok = false; }
        if (ok) { reach = true; V.reachRows = (V.reachRows || []); }
      }
    }
    free.forEach((c, k) => {
      const len = S.reels[c].strip.length;
      let dur = 0.6 + 0.3 * k;
      if (reach && c === last) dur += 1.0;
      const travel = len * (2 + k) + mod(old[c] - S.reels[c].pos, len) + (reach && c === last ? len * 2 : 0);
      V.reels[c].posf = old[c];
      V.reels[c].tw = { from: old[c], to: old[c] - travel, t0: V.time, dur: dur, spin: true };
    });
    if (reach && free.length > 1) V.reachAt = V.time + 0.6 + 0.3 * (free.length - 2) + 0.05; else if (reach) V.reachAt = V.time + 0.1; else V.reachAt = null;
    if (!free.length) enterAim();
  }
  function hurry() {
    // 回転中にもう一度押したら、すぐに止める
    let k = 0;
    V.reels.forEach((vr, c) => {
      if (!vr.tw || !vr.tw.spin) return;
      const len = S.reels[c].strip.length, end = V.time + 0.08 * (++k);
      if (vr.tw.t0 + vr.tw.dur <= end) return;
      const cur = vr.posf, tgt = S.reels[c].pos;
      const to = cur - mod(cur - tgt, len) - len;
      vr.tw = { from: cur, to: to, t0: V.time, dur: end - V.time, spin: true, lin: true };
    });
    V.reachAt = null;
  }
  function onStop(c) {
    const vr = V.reels[c];
    vr.posf = S.reels[c].pos + V.offs[c]; vr.tw = null; vr.bounce = V.time;
    SND.stop(c);
    if (V.reels.every(x => !x.tw)) enterAim();
  }
  function recalc() {
    V.prev = LR.compute(LR.windowOf(S, V.offs), S.src);
    V.prevHit = LR.hitLanes(S, V.prev.exits, false);
    V.will = {}; for (const sh of V.prevHit.guided) V.will[sh.id] = true;
  }
  function enterAim() {
    V.phase = 'aim'; V.reach = null; recalc();
    if (S.ships.some(sh => sh.dist - LR.SHIP[sh.type].speed <= 0.01 && !V.will[sh.id])) SND.warn();
  }
  function usedTokens() { return V.offs.reduce((a, b) => a + Math.abs(b), 0); }
  function nudge(c, d) {
    if (V.phase !== 'aim' || c >= S.reels.length) return;
    const n = V.offs[c] + d, cost = usedTokens() - Math.abs(V.offs[c]) + Math.abs(n);
    if (Math.abs(n) > 3) { SND.deny(); return; }
    if (cost > S.tokens) { SND.deny(); say('ゼンマイが足りない。'); return; }
    V.offs[c] = n;
    const vr = V.reels[c];
    vr.tw = { from: vr.posf, to: S.reels[c].pos + n, t0: V.time, dur: 0.11, lin: true };
    SND.nudge(); recalc();
  }
  function toggleHold(c) {
    if (V.phase !== 'ready' || c >= S.reels.length) return;
    if (V.holds[c]) { V.holds[c] = false; SND.hold(false); return; }
    const cnt = V.holds.filter(Boolean).length;
    if (cnt + 1 > S.tokens) { SND.deny(); say('ゼンマイが足りない。'); return; }
    if (cnt + 1 >= S.reels.length) { SND.deny(); say('すべてのリールは固定できない。'); return; }
    V.holds[c] = true; SND.hold(true);
  }

  function fire() {
    if (V.phase !== 'aim') return;
    if (V.reels.some(x => x.tw)) return;
    V.phase = 'fire';
    const offs = V.offs.slice();
    // 演出のため、育つ前の種火・飛び立つ前のカモメを覚えておく
    const ev = LR.fire(S, offs);
    const n = S.reels.length;
    V.offs = S.reels.map(() => 0); V.heldSpin = S.reels.map(() => false);
    V.reels.forEach((vr, c) => { vr.posf = S.reels[c].pos; });
    const win = LR.windowOf(S);
    for (const q of ev.res.grow) win[q.c][q.r]._lag = 1;
    for (const q of ev.res.shoo) win[q.c][q.r]._gull = true;
    V.prev = null; V.will = {};
    V.beam = { ev: ev, t0: V.time, n: n, sea: null }; V.holdDisp = true;
    for (let c = 0; c < n; c++) after((c + 1) * STEP, () => colArrive(ev, c, win));
    const tExit = (n + 1) * STEP;
    after(tExit, () => exitArrive(ev));
    const zd = ev.res.zoro.length ? 0.7 : 0;
    after(tExit + zd + 0.3, () => resolveHits(ev));
    after(tExit + zd + 0.3 + (ev.guided.length ? 1.0 : 0.6), () => doAdvance(ev));
  }
  function colArrive(ev, c, win) {
    const col = ev.res.cols[c];
    let mx = 0;
    for (let r = 0; r < 3; r++) {
      const lk = col.links[r], x = R.cx(c), y = R.cy(r);
      if (lk.p > 0 || lk.o > 0) { V.flashes[c + ':' + mod(S.reels[c].pos + r, S.reels[c].strip.length)] = V.time; }
      if (lk.op && lk.op !== 'x') pop(x, y - 34, lk.op, lk.op[0] === '×' ? '#aee8ff' : C.light, 22, 0.7);
      mx = Math.max(mx, lk.o);
      const cell = win[c][r];
      if (cell._lag) { delete cell._lag; pop(x, y - 54, '育った！', '#b8ffb0', 18, 1.1); spark(x, y, 10, '#b8ffb0'); SND.grow(); }
      if (cell._gull) { delete cell._gull; V.parts.push({ gull: true, x: x, y: y, vx: 160, vy: -260, t0: V.time, dur: 1.3 }); SND.gull(); pop(x, y - 54, 'カモメが飛び立った', '#fff', 16, 1.2); }
      else if (lk.op === 'x') pop(x, y - 34, '…', '#cdd6ee', 22, 0.7);
    }
    if (mx > 0) SND.beam(mx, c);
  }
  function exitArrive(ev) {
    const n = V.beam.n;
    if (ev.res.zoro.length) {
      V.banner = { str: 'ゾロ目！', sub: '光が ' + ev.res.zmul + ' 倍', t0: V.time, dur: 1.5 };
      SND.zoro(); V.shake = 0.35;
      for (const r of ev.res.zoro) for (let c = 0; c < n; c++) { spark(R.cx(c), R.cy(r), 14, C.gold, 220); V.flashes[c + ':' + mod(S.reels[c].pos + r, S.reels[c].strip.length)] = V.time + 0.3; }
      after(0.7, () => { V.beam.sea = V.time; SND.shoot(ev.total); });
    } else { V.beam.sea = V.time; SND.shoot(ev.total); }
    V.beam.exit = V.time;
  }
  function vship(id) { return V.ships.find(v => v.id === id); }
  function shipPos(v) { return { x: v.type === 'liner' ? R.shipX(v.dist) - 60 : R.shipX(v.dist), y: R.cy(v.lane) }; }
  function resolveHits(ev) {
    V.holdDisp = false;
    let k = 0, any = false;
    ev.lanes.forEach((ln, l) => {
      for (const h of ln.hits) {
        const v = vship(h.id); if (!v) continue;
        const px = shipPos(v).x, py = R.cy(l);
        v.glow = 1;
        if (h.swallowed != null) { pop(px, py - 78, '霧に飲まれた', '#cdd6ee', 17, 1.2); SND.swallow(); continue; }
        any = true;
        if (v.type === 'liner') v.tParts = v.tParts || v.shownParts.slice(), v.tParts[l] = h.after;
        else if (v.type !== 'fog') v.tShown = h.after;
        if (h.take > 0) pop(px + 44, py - 50, '-' + h.take, C.light, 24, 0.9);
      }
      if (ln.left > 0) { pop(1210, R.cy(l) - 30, '★+' + ln.left, '#fff3a8', 24, 1.2); }
    });
    if (any) SND.hit();
    if (ev.stars > 0) SND.star();
    for (const sh of ev.guided) {
      const v = vship(sh.id); if (!v) continue;
      const kk = k++;
      after(0.12 + kk * 0.1, () => {
        v.state = 'guided'; v.t0 = V.time; if (v.type === 'liner') v.tParts = [0, 0, 0]; else v.tShown = 0;
        const p = shipPos(v); spark(p.x, p.y - 10, 18, C.light, 180); SND.guided(kk);
        const coin = LR.SHIP[sh.type].coin;
        if (coin) pop(p.x, p.y - 84, '+' + coin + ' 貨', '#ffd166', 20, 1.3);
        if (sh.type === 'cargo') pop(p.x, p.y - 108, '積み荷！', '#ffd18a', 18, 1.4);
      });
    }
    if (ev.tokens > 0) after(0.5, () => { pop(R.RX0 + 90, 596, 'ゼンマイ +' + ev.tokens, C.gold, 18, 1.4); });
    if (ev.guided.length >= 2) say(ev.guided.length + '隻をいちどに導いた！');
  }
  function doAdvance(ev) {
    V.beam = null;
    const adv = LR.advance(S);
    for (const sh of adv.wrecks) {
      const v = vship(sh.id); if (!v) continue;
      v.state = 'wreck'; v.t0 = V.time + 0.4; v.target = 0;
    }
    if (adv.wrecks.length) after(0.4, () => { SND.wreck(); V.shake = 0.5; say(adv.linerLost ? 'ひかり丸が岩礁に乗り上げてしまった……' : '舟が岩礁に乗り上げてしまった……'); });
    syncShips();
    for (const sh of adv.spawns) { const v = vship(sh.id); if (v) v.alpha = 0; }
    if (adv.spawns.length) { SND.spawn(); announce(adv.spawns); }
    if (adv.wound) after(0.3, () => pop(R.RX0 + 84 + (S.tokens - 1) * 30, R.Y0 + 3 * R.CELL + 112, '+1', C.gold, 18, 0.9));
    for (const q of adv.gulls) after(0.2, () => { pop(R.cx(q.c), R.cy(q.r) - 54, 'カモメが降りてきた', '#fff', 16, 1.6); SND.gull(); });
    if (adv.gulls.length && !(S.seen && S.seen.gull)) { S.seen = S.seen || { boat: 1 }; S.seen.gull = 1; say('【カモメ】部品にとまって、光をさえぎってしまう。' + LR.GULL_SHOO + '以上の光を当てれば飛び立つ。', 9); }
    after(adv.wrecks.length ? 1.2 : 0.55, () => {
      if (adv.failed) return openFail(adv);
      if (ev.cargo > 0) return openCargo(ev.cargo, adv);
      afterTurn(adv);
    });
  }
  function afterTurn(adv) {
    if (adv.over) return openDawn();
    V.phase = 'ready';
  }
  function openDawn() {
    V.phase = 'dawn';
    const bonus = LR.nightBonus(S);
    S.coins += bonus;
    V.overlay = { kind: 'dawn', t0: V.time, bonus: bonus };
    SND.dawn();
  }
  function openFail(adv) {
    V.phase = 'fail'; V.overlay = { kind: 'fail', t0: V.time, liner: adv.linerLost }; SND.fail();
  }
  // 同じ夜でつまずくほど、差し入れが少しずつ増える（詰み防止）
  function retryGift() { return LR.RETRY_GIFT + 3 * (S.tryN || 0); }
  function retryNight() {
    const tries = S.retries + 1, gift = retryGift();
    S = JSON.parse(V.snap);
    S.rs = (S.rs + 7919 * tries) | 0; S.retries = tries; S.tryN = (S.tryN || 0) + 1; S.coins += gift;
    V.disp.coins = S.coins - gift; V.overlay = null; V.ships = [];
    LR.rollOffers(S); syncReels();
    openShop('retry');
  }

  // ---------- 工房 ----------
  function openShop(mode, loaded) {
    if (mode === 'advance' && !loaded) LR.rollOffers(S);
    V.shop = { mode: mode, held: null, confirm: null, entry: null, t0: V.time, rerolls: 0 };
    V.scene = 'shop'; V.overlay = null; V.phase = 'shop'; V.msg = null;
    save('shop');
    V.shop.entry = JSON.stringify(S);
  }
  function openCargo(count, adv) {
    const keep = S.offers;
    const offers = LR.rollOffers(S, 3).map(o => ({ t: o.t, sold: false }));
    S.offers = keep;
    V.shop = { mode: 'cargo', held: null, confirm: null, offers: offers, left: count, adv: adv, t0: V.time };
    V.scene = 'shop'; V.phase = 'shop';
  }
  function leaveShop() {
    const sh = V.shop;
    if (!sh || sh.busy) return;
    SND.click();
    if (sh.mode === 'cargo') {
      if (--sh.left > 0) { const keep = S.offers; sh.offers = LR.rollOffers(S, 3).map(o => ({ t: o.t, sold: false })); S.offers = keep; sh.held = null; sh.t0 = V.time; return; }
      V.scene = 'play'; V.shop = null; syncReels(); afterTurn(sh.adv); return;
    }
    if (sh.mode === 'advance') { S.night++; S.tryN = 0; }
    beginNight();
  }
  function shopOffers() { return V.shop.mode === 'cargo' ? V.shop.offers : S.offers; }
  function shopCellClick(c, i) {
    const sh = V.shop, held = sh.held;
    if (sh.busy) return;
    if (!held) { SND.click(); say('先に、右の部品か道具を選ぼう。'); return; }
    const cell = S.reels[c].strip[i];
    if (held.kind === 'offer') {
      const o = shopOffers()[held.k], free = sh.mode === 'cargo', price = free ? 0 : LR.PRICE[o.t];
      const res = LR.placeResult(cell, o.t);
      if (!res) { SND.deny(); say('これ以上は強くできない。'); return; }
      if (res === 'replace' && cell.t !== 'blank' && !(sh.confirm && sh.confirm.c === c && sh.confirm.i === i)) {
        sh.confirm = { c: c, i: i }; SND.click(); say('もう一度押すと、今ある「' + LR.COMP[cell.t].name + '」と取り替える。', 5); return;
      }
      S.coins -= price; LR.place(S, c, i, o.t); o.sold = true; sh.held = null; sh.confirm = null;
      SND.buy(); V.flashes['s' + c + ':' + i] = V.time;
      say(res === 'upgrade' ? '重ねて強くなった！' : LR.COMP[o.t].name + 'を組みこんだ。');
      if (free) { sh.busy = true; after(0.5, () => { if (V.shop === sh) { sh.busy = false; leaveShop(); } }); }
    } else if (held.kind === 'swap') {
      if (!held.a) { held.a = { c: c, i: i }; SND.click(); return; }
      if (held.a.c === c && held.a.i === i) { held.a = null; return; }
      if (S.coins < LR.SWAP_PRICE) { SND.deny(); say('貨幣が足りない。'); return; }
      S.coins -= LR.SWAP_PRICE; LR.swap(S, held.a.c, held.a.i, c, i);
      V.flashes['s' + c + ':' + i] = V.time; V.flashes['s' + held.a.c + ':' + held.a.i] = V.time;
      held.a = null; SND.buy();
    } else if (held.kind === 'remove') {
      if (!LR.canRemove(S, c)) { SND.deny(); say('このリールは、これ以上短くできない。'); return; }
      if (S.coins < LR.REMOVE_PRICE) { SND.deny(); say('貨幣が足りない。'); return; }
      S.coins -= LR.REMOVE_PRICE; LR.remove(S, c, i); sh.held = null; SND.buy(); say('コマをひとつ外した。リールが短くなった。');
      syncReels();
    }
  }

  // ---------- 入力 ----------
  function primary() {
    SND.init();
    if (V.overlay) return overlayPrimary();
    if (V.scene === 'title') return;
    if (V.scene !== 'play') return;
    if (V.phase === 'ready') spin();
    else if (V.phase === 'spin') hurry();
    else if (V.phase === 'aim') fire();
  }
  function overlayPrimary() {
    const o = V.overlay; if (!o) return;
    if (V.time - o.t0 < 0.35) return;
    if (o.kind === 'intro') { V.overlay = null; V.phase = 'ready'; SND.click(); }
    else if (o.kind === 'dawn') {
      if (V.time - o.t0 < 1.2) return;
      SND.click();
      if (S.night >= LR.NIGHTS.length) openEnding(); else openShop('advance');
    }
    else if (o.kind === 'fail') { if (V.time - o.t0 > 1.0) { SND.click(); retryNight(); } }
    else if (o.kind === 'help' || o.kind === 'strips') { V.overlay = null; SND.click(); }
  }
  function openEnding() {
    V.overlay = null; V.scene = 'ending'; V.phase = 'ending'; V.endT0 = V.time; V.dawn = 1;
    V.newBest = saveBest(); clearSave();
  }
  function toTitle() {
    V.scene = 'title'; V.overlay = null; V.phase = 'idle'; V.dawn = 0; V.ships = [];
    S = LR.newGame(12345); LR.startNight(S); syncReels(); syncShips(); for (const v of V.ships) v.alpha = 1;
    loadBest();
  }
  window.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    const k = e.key.toLowerCase();
    if (k === ' ' || k === 'enter') { e.preventDefault(); primary(); return; }
    if (k === 'm') { SND.setMuted(!SND.muted); return; }
    if (k === 'escape') { if (V.overlay && (V.overlay.kind === 'help' || V.overlay.kind === 'strips')) V.overlay = null; else if (V.shop) { V.shop.held = null; V.shop.confirm = null; } return; }
    if (V.scene !== 'play' || V.overlay) return;
    const up = 'qwer'.indexOf(k), dn = 'asdf'.indexOf(k), hd = '1234'.indexOf(k);
    if (up >= 0) nudge(up, 1); else if (dn >= 0) nudge(dn, -1); else if (hd >= 0) toggleHold(hd);
  });
  function toLogical(e) { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height }; }
  cv.addEventListener('mousemove', (e) => { V.mouse = toLogical(e); });
  cv.addEventListener('mouseleave', () => { V.mouse = { x: -1, y: -1 }; });
  function clickAt(p) {
    SND.init(); V.mouse = p;
    for (let i = V.items.length - 1; i >= 0; i--) {
      const it = V.items[i];
      if (it.cb && p.x >= it.x && p.x < it.x + it.w && p.y >= it.y && p.y < it.y + it.h) { it.cb(); return true; }
    }
    return false;
  }
  cv.addEventListener('mousedown', (e) => { if (e.button === 0) clickAt(toLogical(e)); });
  cv.addEventListener('contextmenu', (e) => { e.preventDefault(); if (V.shop) { V.shop.held = null; V.shop.confirm = null; } });
  cv.addEventListener('touchstart', (e) => { e.preventDefault(); const t = e.changedTouches[0]; clickAt(toLogical(t)); }, { passive: false });

  // ---------- 更新 ----------
  function update(dt) {
    V.time += dt;
    const t = V.time;
    // タイマー
    if (V.timers.length) {
      const due = V.timers.filter(x => x.t <= t).sort((a, b) => a.t - b.t);
      V.timers = V.timers.filter(x => x.t > t);
      for (const d of due) d.fn();
    }
    // リール
    V.reels.forEach((vr, c) => {
      const tw = vr.tw; if (!tw) return;
      const p = clamp((t - tw.t0) / tw.dur, 0, 1), before = Math.floor(vr.posf);
      vr.posf = tw.from + (tw.to - tw.from) * (tw.lin ? p : tweenFn(p));
      if (tw.spin && Math.floor(vr.posf) !== before && (!V.lastTick || t - V.lastTick > 0.05)) { SND.tick(); V.lastTick = t; }
      if (p >= 1) { if (tw.spin) onStop(c); else { vr.posf = tw.to; vr.tw = null; } }
    });
    if (V.reachAt && t >= V.reachAt && V.phase === 'spin') { V.reachAt = null; V.reach = t; SND.reach(); }
    // 船
    for (const v of V.ships) {
      v.alpha = Math.min(1, v.alpha + dt * 2.5);
      v.glow = Math.max(0, v.glow - dt * 1.4);
      if (v.target != null && v.state !== 'guided') v.dist += (v.target - v.dist) * Math.min(1, dt * 7);
      if (v.tShown != null) { v.shown += (v.tShown - v.shown) * Math.min(1, dt * 9); if (Math.abs(v.shown - v.tShown) < 0.05) { v.shown = v.tShown; v.tShown = null; } }
      if (v.tParts) for (let l = 0; l < 3; l++) v.shownParts[l] += (v.tParts[l] - v.shownParts[l]) * Math.min(1, dt * 9);
      if (v.state === 'guided') { const k = t - v.t0; if (k > 0.25) v.dist -= dt * (2 + k * 9) * (v.type === 'liner' ? 0.5 : 1); if (k > (v.type === 'liner' ? 2.6 : 1.3)) v.dead = true; }
      if (v.state === 'wreck' && t - v.t0 > 1.2) v.dead = true;
    }
    V.ships = V.ships.filter(v => !v.dead);
    V.pops = V.pops.filter(p => t - p.t0 < p.dur);
    V.parts = V.parts.filter(p => t - p.t0 < p.dur);
    V.shake = Math.max(0, V.shake - dt);
    V.lightning = Math.max(0, V.lightning - dt * 2.5);
    if (S && !V.holdDisp) {
      V.disp.coins += (S.coins - V.disp.coins) * Math.min(1, dt * 8); if (Math.abs(S.coins - V.disp.coins) < 0.5) V.disp.coins = S.coins;
      V.disp.stars += (S.stars - V.disp.stars) * Math.min(1, dt * 6); if (Math.abs(S.stars - V.disp.stars) < 0.5) V.disp.stars = S.stars;
    }
    if (S && V.scene === 'play' && S.night === 5 && V.dawn === 0 && Math.random() < dt * 0.09) { V.lightning = 1; SND.thunder(); }
    if (V.overlay && V.overlay.kind === 'dawn') V.dawn = clamp((t - V.overlay.t0) / 2.2, 0, 1);
    if (V.overlay && V.overlay.kind === 'intro' && t - V.overlay.t0 > 3.2) { V.overlay = null; V.phase = 'ready'; }
  }

  // ---------- 描画：プレイ画面 ----------
  function viewCell(cell) {
    if (cell._lag || cell._gull) return Object.assign({}, cell, { n: cell.n - (cell._lag || 0), gull: cell.gull || cell._gull });
    return cell;
  }
  function drawReels(interactive) {
    const t = V.time;
    S.reels.forEach((reel, c) => {
      const vr = V.reels[c], x = R.RX0 + c * R.RP, len = reel.strip.length;
      let posf = vr.posf;
      const bd = t - vr.bounce; if (bd < 0.5) posf += -0.09 * Math.exp(-9 * bd) * Math.cos(26 * bd);
      const base = Math.floor(posf), frac = posf - base, spinning = vr.tw && vr.tw.spin;
      g.save(); g.beginPath(); g.rect(x, R.Y0 - 40, R.CW, 3 * R.CELL + 80); g.clip();
      for (let k = -1; k <= 4; k++) {
        const idx = mod(base + k, len), cell = reel.strip[idx], y = R.Y0 + (k - frac) * R.CELL + 1;
        const f = V.flashes[c + ':' + idx], fl = f != null ? clamp(1 - (t - f) / 0.45, 0, 1) : 0;
        R.cell(g, viewCell(cell), x, y, R.CW, t, { flash: fl });
      }
      if (spinning) { g.fillStyle = 'rgba(16,26,54,0.3)'; g.fillRect(x, R.Y0 - 40, R.CW, 3 * R.CELL + 80); }
      g.fillStyle = 'rgba(6,10,26,0.74)'; g.fillRect(x, R.Y0 - 40, R.CW, 39); g.fillRect(x, R.Y0 + 3 * R.CELL + 1, R.CW, 40);
      g.restore();
      if (V.holds[c] || V.heldSpin[c]) {
        R.rr(g, x - 1, R.Y0 - 2, R.CW + 2, 3 * R.CELL + 2, 12); g.lineWidth = 4; g.strokeStyle = C.gold; g.stroke();
        R.text(g, '固定', x + R.CW / 2, R.Y0 + 14, 15, C.gold, 'center', '800', '#1a1230');
      }
      if (V.offs[c]) R.text(g, (V.offs[c] > 0 ? '▲' : '▼') + Math.abs(V.offs[c]), x + R.CW - 18, R.Y0 + 14, 15, C.gold, 'center', '800', '#1a1230');
      if (interactive && (V.phase === 'aim' || V.phase === 'ready') && !vr.tw) {
        for (let r = 0; r < 3; r++) {
          const cell = LR.cellAt(reel, r, V.offs[c]);
          item(x, R.Y0 + r * R.CELL, R.CW, R.CELL, { info: cellInfo(cell) });
        }
      }
    });
  }
  function cellInfo(cell) {
    if (cell.gull) return { title: 'カモメ', desc: 'この部品にとまって、光をさえぎっている。' + LR.GULL_SHOO + '以上の光を当てると飛び立つ（その光は使われる）。夜明けには帰っていく。' };
    const d = LR.COMP[cell.t]; let extra = '';
    if (cell.t === 'flame') extra = '（いまは +' + cell.lv + '）';
    if (cell.t === 'ember') extra = '（いまは +' + cell.n + '）';
    if (cell.t === 'lens') extra = '（いまは ×' + (cell.lv + 1) + '）';
    return { title: d.name, desc: d.desc + extra };
  }
  function drawBeamPaths(res, upto, alpha, dashed) {
    const n = S.reels.length, ex = R.exitX(n);
    const q0 = clamp(upto, 0, 1);
    if (q0 > 0) for (let r = 0; r < 3; r++) R.beamLine(g, R.SRCX - 8, R.cy(r), R.lerp(R.SRCX - 8, R.cx(0), q0), R.cy(r), S.src, alpha, dashed);
    for (let c = 0; c < res.cols.length; c++) {
      const q = clamp(upto - (c + 1), 0, 1); if (q <= 0) break;
      for (let r = 0; r < 3; r++) {
        const lk = res.cols[c].links[r]; if (lk.o <= 0) continue;
        for (const to of lk.to) {
          const x1 = R.cx(c), y1 = R.cy(r), x2 = c < n - 1 ? R.cx(c + 1) : ex - 20, y2 = R.cy(to);
          R.beamLine(g, x1, y1, R.lerp(x1, x2, q), R.lerp(y1, y2, q), lk.o, alpha, dashed);
        }
      }
    }
  }
  function laneEndX(ln) {
    if (ln.left > 0 || !ln.hits.length) return 1300;
    const v = vship(ln.hits[ln.hits.length - 1].id);
    return v ? shipPos(v).x - 4 : 1300;
  }
  function drawBeams() {
    const n = S.reels.length, ex = R.exitX(n), t = V.time;
    if (V.phase === 'spin') {
      // 止まったリールまで、光の道すじを先に見せる
      let k = 0; while (k < n && !V.reels[k].tw) k++;
      if (k > 0) { const res = LR.compute(LR.windowOf(S).slice(0, k), S.src); drawBeamPaths(res, k + 1, 0.7, true); }
    } else if (V.phase === 'aim' && V.prev) {
      drawBeamPaths(V.prev, 99, 0.85, true);
      V.prevHit.lanes.forEach((ln, l) => { if (ln.power > 0) R.beamLine(g, ex + 22, R.cy(l), Math.min(1280, laneEndX(ln)), R.cy(l), ln.power, 0.5, true); });
    } else if (V.beam) {
      const b = V.beam, ev = b.ev, fade = 1;
      drawBeamPaths(ev.res, (t - b.t0) / STEP, fade, false);
      if (b.sea != null) {
        const q = clamp((t - b.sea) / 0.22, 0, 1);
        ev.lanes.forEach((ln, l) => { if (ln.power > 0) R.beamLine(g, ex + 22, R.cy(l), R.lerp(ex + 22, laneEndX(ln), q), R.cy(l), ln.power, 1, false); });
      }
    }
  }
  function drawExits() {
    const n = S.reels.length, ex = R.exitX(n);
    let vals = null, hot = false;
    if (V.phase === 'aim' && V.prev) vals = V.prev.exits;
    else if (V.beam && V.beam.exit != null) { vals = V.beam.sea != null ? V.beam.ev.res.exits : V.beam.ev.res.raw; hot = true; }
    for (let l = 0; l < 3; l++) {
      const y = R.cy(l), v = vals ? vals[l] : null;
      const pulse = hot ? 1 + 0.25 * clamp(1 - (V.time - (V.beam.sea || V.beam.exit)) / 0.3, 0, 1) : 1;
      g.fillStyle = '#0a1024'; g.beginPath(); g.arc(ex, y, 23 * pulse, 0, 7); g.fill();
      g.lineWidth = 3; g.strokeStyle = v ? C.gold : C.brassD; g.stroke();
      R.text(g, v == null ? '·' : String(v), ex, y + 1, (v != null && v >= 100 ? 17 : 22) * pulse, v ? (hot ? '#fff' : C.light) : 'rgba(255,255,255,0.35)', 'center', '800');
    }
    if (V.phase === 'aim' && V.prev && V.prev.zoro.length) R.text(g, 'ゾロ目 ×' + V.prev.zmul, ex + 64, R.Y0 - 16, 18, C.gold, 'center', '800', '#1a1230');
  }
  function drawShips(interactive) {
    const t = V.time;
    const list = V.ships.slice().sort((a, b) => (a.type === 'liner' ? -1 : 0) - (b.type === 'liner' ? -1 : 0) || a.lane - b.lane);
    for (const v of list) {
      g.save(); g.globalAlpha = v.alpha;
      let x = R.shipX(v.dist), y = R.cy(v.lane);
      if (v.state === 'guided') g.globalAlpha = v.alpha * clamp(1.6 - (t - v.t0) / (v.type === 'liner' ? 1.6 : 0.8), 0, 1);
      if (v.state === 'wreck') {
        const k = clamp((t - v.t0) / 0.8, 0, 1);
        if (t > v.t0) { g.translate(x, y + 20); g.rotate(-0.5 * k); g.translate(-x, -(y + 20) + k * 26); g.globalAlpha = 1 - k * 0.9; }
      }
      const vv = Object.assign({}, v, { will: V.will[v.id] && V.phase === 'aim', danger: v.danger && v.state === 'sail' && (V.phase === 'aim' || V.phase === 'ready' || V.phase === 'spin') });
      if (v.type === 'liner') R.liner(g, vv, x, t); else R.ship(g, vv, x, y, t);
      g.restore();
      if (interactive && v.state === 'sail') {
        const d = LR.SHIP[v.type];
        if (v.type === 'liner') item(x - 100, R.Y0, 300, 3 * R.CELL, { info: { title: d.name, desc: d.desc } });
        else item(x - 44, y - 70, 88, 110, { info: { title: d.name, desc: d.desc + (v.danger ? '【！】この一手で導けないと、岩礁に乗り上げる。' : '') } });
      }
    }
  }
  function drawDeck() {
    const n = S.reels.length;
    for (let c = 0; c < n; c++) {
      const x = R.RX0 + c * R.RP;
      const aim = V.phase === 'aim', ready = V.phase === 'ready';
      button(x + 12, R.Y0 - 82, R.CW - 24, 30, '▲', () => nudge(c, 1), { disabled: !aim, size: 16, info: { title: 'ずらす', desc: 'リールを一コマ上へ送る。ゼンマイを一つ使う。光を放つまでは、何度でも戻せる。（キー：' + 'QWER'[c] + '）' } });
      button(x + 12, R.Y0 + 3 * R.CELL + 50, R.CW - 24, 30, '▼', () => nudge(c, -1), { disabled: !aim, size: 16, info: { title: 'ずらす', desc: 'リールを一コマ下へ送る。ゼンマイを一つ使う。（キー：' + 'ASDF'[c] + '）' } });
      button(x + 12, R.Y0 + 3 * R.CELL + 86, R.CW - 24, 30, V.holds[c] ? '固定中' : '固定', () => toggleHold(c), { disabled: !ready, active: V.holds[c], size: 15, info: { title: '固定', desc: '次に回すとき、このリールだけ回さずに残す。ゼンマイを一つ使う。（キー：' + (c + 1) + '）' } });
    }
    // ゼンマイ
    const used = V.phase === 'aim' ? usedTokens() : V.phase === 'ready' ? V.holds.filter(Boolean).length : 0;
    const tx = R.RX0, ty = R.Y0 + 3 * R.CELL + 134;
    R.text(g, 'ゼンマイ', tx, ty, 15, C.cream, 'left', '700');
    for (let i = 0; i < S.maxTokens; i++) {
      const on = i < S.tokens, spent = on && i >= S.tokens - used;
      g.globalAlpha = spent ? 0.45 + 0.25 * Math.sin(V.time * 8) : 1;
      R.spring(g, tx + 84 + i * 30, ty, 11, on); g.globalAlpha = 1;
      if (i === S.tokens && S.wind) R.spring(g, tx + 84 + i * 30, ty, 11, true, 0.5);
    }
    item(tx, ty - 14, 84 + S.maxTokens * 30, 28, { info: { title: 'ゼンマイ', desc: 'リールをずらしたり固定したりする力。一手ごとに半分ずつ巻き戻り、夜のはじめには全部巻き直される。それ以外にも、巻き足される時がある。' } });
    button(R.winRight(n) - 96, ty - 15, 100, 30, 'リール表', () => { V.overlay = { kind: 'strips', t0: V.time }; SND.click(); }, { size: 14, info: { title: 'リール表', desc: 'それぞれのリールに、何がどの順で並んでいるかを見る。' } });
  }
  function drawPops() {
    const t = V.time;
    for (const p of V.parts) {
      const k = (t - p.t0) / p.dur, x = p.x + p.vx * (t - p.t0), y = p.y + p.vy * (t - p.t0) + (p.gull ? 0 : 120 * (t - p.t0) * (t - p.t0));
      g.globalAlpha = 1 - k;
      if (p.gull) { g.save(); g.translate(x, y); R.gull(g, 80, t * 6); g.restore(); }
      else { g.fillStyle = p.col; g.beginPath(); g.arc(x, y, p.r * (1 - k * 0.5), 0, 7); g.fill(); }
    }
    g.globalAlpha = 1;
    for (const p of V.pops) {
      const k = (t - p.t0) / p.dur, sc = k < 0.15 ? 0.6 + k / 0.15 * 0.5 : 1.1 - Math.min(0.1, (k - 0.15) * 0.5);
      g.globalAlpha = k > 0.7 ? (1 - k) / 0.3 : 1;
      R.text(g, p.str, p.x, p.y - k * 26, p.size * sc, p.col, 'center', '800', 'rgba(8,12,30,0.85)');
    }
    g.globalAlpha = 1;
  }
  function drawHUD() {
    const def = LR.NIGHTS[S.night - 1];
    const gr = g.createLinearGradient(0, 0, 0, 60); gr.addColorStop(0, 'rgba(6,9,24,0.75)'); gr.addColorStop(1, 'rgba(6,9,24,0)');
    g.fillStyle = gr; g.fillRect(480, 0, 800, 60);
    R.text(g, '第' + '一二三四五'[S.night - 1] + '夜　' + def.name + (S.hard ? '（荒海）' : ''), 520, 28, 22, C.cream, 'left', '800');
    const left = S.sched.length + S.ships.length;
    R.text(g, 'のこり ' + left + ' 隻', 800, 29, 17, 'rgba(246,236,210,0.8)', 'left', '700');
    for (let i = 0; i < 3; i++) R.heart(g, 930 + i * 28, 28, 22, i < S.hearts);
    item(912, 10, 92, 36, { info: { title: '灯台への信頼', desc: '舟が岩礁に乗り上げると一つ減る。三つ失うと、その夜はやり直し。夜ごとに元へ戻る。' } });
    R.coin(g, 1040, 28, 11); R.text(g, String(Math.round(V.disp.coins)), 1058, 29, 20, '#ffd166', 'left', '800');
    item(1024, 10, 76, 36, { info: { title: '貨幣', desc: '舟を導くともらえる。夜明けの工房で、部品と取り替えられる。' } });
    R.star(g, 1122, 28, 12); R.text(g, String(Math.round(V.disp.stars)), 1140, 29, 20, '#fff3a8', 'left', '800');
    item(1106, 10, 84, 36, { info: { title: '星明かり', desc: 'どの舟にも当たらず沖へ抜けた光。空に昇って、記録として残る。' } });
    button(1196, 12, 34, 32, SND.muted ? '×' : '♪', () => SND.setMuted(!SND.muted), { size: 16, info: { title: '音', desc: '音を鳴らす／止める。（キー：M）' } });
    button(1236, 12, 34, 32, '？', () => { V.overlay = { kind: 'help', t0: V.time }; }, { size: 16 });
  }
  function hintText() {
    const n = S.night, t = S.turn;
    if (V.phase === 'ready') {
      if (n === 1 && t === 0) return ['灯台守の心得', 'スペースキー（または右下のボタン）で、灯室のリールを回そう。止まった部品の並びが、そのまま光の通り道になる。'];
      if (n === 1 && t === 3) return ['灯台守の心得', '回す前に「固定」を押すと、そのリールは回らずに残る。いい並びを取っておきたいときに。ゼンマイを一つ使う。'];
      if (S.ships.some(sh => sh.dist - LR.SHIP[sh.type].speed <= 0.01)) return ['あぶない！', '赤い輪の舟は、次の光で導けないと岩礁に乗り上げてしまう。'];
      return ['沖のようす', 'のこり ' + (S.sched.length + S.ships.length) + ' 隻。リールを回そう。'];
    }
    if (V.phase === 'spin') return ['……', 'リールが回っている。'];
    if (V.phase === 'aim') {
      if (n === 1 && t === 0) return ['灯台守の心得', '点線が、光の通り道。右の丸い数字が、それぞれの海路へ届く光の量だ。もう一度スペースで、光を放とう。'];
      if (n === 1 && t === 1) return ['灯台守の心得', 'リールの上下にある ▲▼ で、一コマずつ、ずらせる。ゼンマイを一つ使うが、光を放つ前なら戻せる。試してみよう。'];
      const miss = S.ships.filter(sh => sh.dist - LR.SHIP[sh.type].speed <= 0.01 && !V.will[sh.id]);
      if (miss.length) return ['あぶない！', '赤い輪の舟に、光が足りていない。▲▼ でリールをずらせないか、見てみよう。'];
      const w = Object.keys(V.will).length;
      return ['光の見こみ', (w ? w + ' 隻を導けそうだ。' : '') + 'スペースで光を放つ。▲▼ でずらすこともできる。'];
    }
    return null;
  }
  function drawBottom() {
    // 案内
    const hv = V.hover && V.hover.info;
    let title, desc;
    if (hv) { title = hv.title; desc = hv.desc; }
    else if (V.msg && V.time < V.msgT) { title = ''; desc = V.msg; }
    else { const h = hintText(); if (h) { title = h[0]; desc = h[1]; } }
    panel(516, 592, 470, 112, 0.82);
    if (desc) {
      if (title) R.text(g, title, 536, 616, 17, C.gold, 'left', '800');
      R.para(g, desc, 536, title ? 644 : 628, 432, 16, C.cream, 24);
    }
    // 主ボタン
    const lab = { ready: 'まわす', spin: 'とめる', aim: '光を放つ' }[V.phase];
    button(1004, 596, 256, 104, lab || '……', primary, { primary: true, disabled: !lab, size: 32, sub: lab ? 'スペースキー' : null, r: 16 });
  }
  function drawBanner() {
    const b = V.banner; if (!b) return;
    const k = (V.time - b.t0) / b.dur; if (k >= 1) { V.banner = null; return; }
    const sc = k < 0.12 ? 0.5 + k / 0.12 * 0.6 : 1.1 - Math.min(0.1, (k - 0.12));
    g.globalAlpha = k > 0.8 ? (1 - k) / 0.2 : 1;
    R.text(g, b.str, 760, 300, 76 * sc, C.gold, 'center', '900', '#3a1a08');
    R.text(g, b.sub, 760, 366, 30 * sc, '#fff', 'center', '800', '#3a1a08');
    g.globalAlpha = 1;
  }
  function drawWorld(interactive) {
    const t = V.time, n = S.reels.length;
    g.save();
    if (V.shake > 0) g.translate((Math.random() - 0.5) * V.shake * 16, (Math.random() - 0.5) * V.shake * 16);
    R.background(g, S.night, t, V.dawn);
    R.reef(g, t);
    drawShips(interactive);
    R.weather(g, S.night, t, V.dawn);
    R.lighthouse(g, n, t);
    drawReels(interactive);
    drawBeams();
    drawExits();
    if (V.reach && V.phase === 'spin') R.text(g, 'リーチ！', R.exitX(n) + 64, R.Y0 - 16, 22 + 3 * Math.sin(t * 20), C.gold, 'center', '900', '#3a1a08');
    g.restore();
    if (V.lightning > 0) { g.fillStyle = 'rgba(220,230,255,' + V.lightning * 0.35 + ')'; g.fillRect(0, 0, W, H); }
  }
  function drawPlay() {
    drawWorld(true);
    drawDeck();
    drawPops();
    drawHUD(); drawBottom(); drawBanner();
    if (V.overlay) drawOverlay();
  }

  // ---------- 描画：重ねる画面 ----------
  function dim(a) { g.fillStyle = 'rgba(4,6,18,' + a + ')'; g.fillRect(0, 0, W, H); }
  function stripView(x0, y0, size, onCell, hl) {
    const t = V.time, pitch = size + 4, colW = size + 34;
    S.reels.forEach((reel, c) => {
      const x = x0 + c * colW;
      R.text(g, 'リール' + (c + 1), x + size / 2, y0 - 20, 15, C.cream, 'center', '700');
      reel.strip.forEach((cell, i) => {
        const y = y0 + i * pitch;
        const f = V.flashes['s' + c + ':' + i], fl = f != null ? clamp(1 - (t - f) / 0.6, 0, 1) : 0;
        const it = item(x, y, size, size, { cb: onCell ? () => onCell(c, i) : null, info: cellInfo(cell), ref: { c: c, i: i } });
        const hot = onCell && isHover(it);
        R.cell(g, cell, x, y, size, t, { flash: fl, hl: hl && hl(c, i) ? C.gold : hot ? '#fff' : null });
        if (hl && hl(c, i)) { R.rr(g, x, y, size, size, 9); g.lineWidth = 3; g.strokeStyle = C.gold; g.stroke(); }
      });
    });
  }
  function drawOverlay() {
    const o = V.overlay, t = V.time, k = clamp((t - o.t0) / 0.4, 0, 1);
    V.items.length = 0;
    if (o.kind === 'intro') {
      const def = LR.NIGHTS[S.night - 1];
      dim(0.45 * k);
      g.globalAlpha = k;
      R.text(g, '第' + '一二三四五'[S.night - 1] + '夜', 860, 250, 34, C.gold, 'center', '800', '#0a1024');
      R.text(g, def.name, 860, 322, 78, C.cream, 'center', '900', '#0a1024');
      R.text(g, def.sub, 860, 400, 24, '#fff', 'center', '600', '#0a1024');
      g.globalAlpha = 1;
      item(0, 0, W, H, { cb: overlayPrimary });
    } else if (o.kind === 'dawn') {
      dim(0.25 * k);
      if (t - o.t0 > 0.8) {
        const a = clamp((t - o.t0 - 0.8) / 0.5, 0, 1); g.globalAlpha = a;
        panel(650, 210, 460, 300);
        const last = S.night >= LR.NIGHTS.length;
        R.text(g, last ? '嵐が去り、夜が明ける' : '夜が明けた', 880, 262, 34, C.gold, 'center', '900');
        R.text(g, '導いた舟　' + S.guided + ' 隻（通算）', 880, 318, 19, C.cream, 'center', '600');
        R.text(g, '難破　' + S.wrecks + ' 隻（通算）', 880, 350, 19, C.cream, 'center', '600');
        if (!last) { R.coin(g, 800, 392, 11); R.text(g, '港からのお礼　+' + o.bonus, 820, 393, 19, '#ffd166', 'left', '700'); }
        button(760, 430, 240, 58, last ? '朝を迎える' : '工房へ', overlayPrimary, { primary: true, size: 24 });
        g.globalAlpha = 1;
      }
    } else if (o.kind === 'fail') {
      dim(0.6 * k);
      panel(630, 200, 500, 320);
      R.text(g, o.liner ? 'ひかり丸を導けなかった' : '灯台への信頼が尽きた', 880, 256, 30, C.warn, 'center', '900');
      R.para(g, 'でも、海はまた荒れる前の姿に戻る。港の人たちが差し入れ（貨幣 +' + retryGift() + '）を持ってきてくれた。工房で灯室を組み直して、同じ夜にもう一度挑もう。', 670, 310, 420, 17, C.cream, 27);
      button(740, 436, 280, 60, '工房で準備し直す', overlayPrimary, { primary: true, size: 22 });
    } else if (o.kind === 'strips') {
      dim(0.72);
      panel(300, 60, 680, 610);
      R.text(g, 'リール表', 640, 96, 26, C.gold, 'center', '900');
      R.text(g, '金色の枠が、いま灯室に見えている三コマ', 640, 128, 15, C.cream, 'center', '500');
      const n = S.reels.length, size = 50, x0 = 640 - (n * (size + 34) - 34) / 2;
      stripView(x0, 170, size, null, (c, i) => { const len = S.reels[c].strip.length; const d = mod(i - S.reels[c].pos - V.offs[c], len); return d < 3; });
      button(560, 618, 160, 40, 'とじる', overlayPrimary, { size: 17 });
      if (V.hover && V.hover.info) { R.text(g, V.hover.info.title, 330, 600, 16, C.gold, 'left', '800'); }
      item(0, 0, 1, 1, {});
    } else if (o.kind === 'help') {
      dim(0.72);
      panel(250, 70, 780, 580);
      R.text(g, 'あそびかた', 640, 110, 28, C.gold, 'center', '900');
      const lines = [
        ['まわす', 'スペースキー、または右下のボタン。止まった部品の並びが、光の通り道になる。'],
        ['光を放つ', 'もう一度スペース。光は左から右へ進み、三つの海路へ出ていく。'],
        ['ずらす', 'リールの上下の ▲▼（キー：QWER／ASDF）。ゼンマイを一つ使う。放つ前なら戻せる。'],
        ['固定', '回す前に「固定」（キー：1〜4）。そのリールは回らない。ゼンマイを一つ使う。'],
        ['舟', '数字のぶんの光を届ければ、港へ帰れる。岩礁まで来てしまうと難破。'],
        ['工房', '夜が明けたら、貨幣で部品を手に入れ、リールの好きな場所へ組みこむ。'],
        ['調べる', '部品や舟にマウスを重ねると、下の欄に説明が出る。'],
      ];
      lines.forEach((ln, i) => {
        R.text(g, ln[0], 300, 172 + i * 58, 19, C.gold, 'left', '800');
        R.para(g, ln[1], 420, 172 + i * 58, 570, 16, C.cream, 24);
      });
      button(480, 584, 150, 44, 'とじる', overlayPrimary, { size: 18 });
      button(650, 584, 180, 44, 'タイトルへ戻る', () => { SND.click(); toTitle(); }, { size: 16 });
    }
  }

  // ---------- 描画：工房 ----------
  function drawShop() {
    const sh = V.shop, t = V.time, cargo = sh.mode === 'cargo';
    R.background(g, S.night, t, cargo ? 0 : 1);
    dim(cargo ? 0.6 : 0.42);
    V.items.length = 0;
    panel(30, 24, 500, 672, 0.88); panel(546, 24, 704, 672, 0.88);
    R.text(g, cargo ? '積み荷が届いた' : sh.mode === 'retry' ? '仕切り直しの工房' : '夜明けの工房', 898, 62, 30, C.gold, 'center', '900');
    if (!cargo) { R.coin(g, 1150, 62, 12); R.text(g, String(Math.round(V.disp.coins)), 1170, 63, 24, '#ffd166', 'left', '800'); }
    // リール
    const n = S.reels.length, size = 58, colW = size + 34, x0 = 280 - (n * colW - 34) / 2;
    const held = sh.held;
    stripView(x0, 110, size, shopCellClick, (c, i) => (held && held.kind === 'swap' && held.a && held.a.c === c && held.a.i === i) || (sh.confirm && sh.confirm.c === c && sh.confirm.i === i));
    R.text(g, 'リールは輪になっていて、灯室には続いた三コマが見える', 280, 668, 14, 'rgba(246,236,210,0.7)', 'center', '500');
    // 部品
    const offers = shopOffers(), cw = 160, gap = 12, ox = 898 - (offers.length * (cw + gap) - gap) / 2;
    R.text(g, cargo ? 'ひとつ選んで、左のリールの好きなコマへ' : '部品を選んで、左のリールの好きなコマへ', 898, 100, 16, C.cream, 'center', '600');
    offers.forEach((o, k) => {
      const x = ox + k * (cw + gap), y = 122, h = 176;
      const price = cargo ? 0 : LR.PRICE[o.t], can = !o.sold && S.coins >= price;
      const sel = held && held.kind === 'offer' && held.k === k;
      const it = item(x, y, cw, h, { cb: o.sold ? null : () => { if (!can) { SND.deny(); say('貨幣が足りない。'); return; } sh.held = sel ? null : { kind: 'offer', k: k }; sh.confirm = null; SND.click(); }, info: { title: LR.COMP[o.t].name, desc: LR.COMP[o.t].desc } });
      const hv = isHover(it);
      R.rr(g, x, y, cw, h, 12); g.fillStyle = sel ? '#4a3d24' : hv && !o.sold ? '#2e2a52' : '#1e1c3a'; g.fill();
      g.lineWidth = sel ? 4 : 2; g.strokeStyle = sel ? C.gold : 'rgba(210,162,76,0.6)'; g.stroke();
      g.globalAlpha = o.sold ? 0.25 : can ? 1 : 0.5;
      R.icon(g, o.t, x + cw / 2, y + 62, 92, t);
      R.text(g, LR.COMP[o.t].name, x + cw / 2, y + 126, 17, C.cream, 'center', '800');
      if (cargo) R.text(g, 'もらう', x + cw / 2, y + 154, 16, C.good, 'center', '700');
      else { R.coin(g, x + cw / 2 - 16, y + 153, 9); R.text(g, String(price), x + cw / 2 + 2, y + 154, 18, '#ffd166', 'left', '800'); }
      g.globalAlpha = 1;
      if (o.sold) R.text(g, '組みこみ済み', x + cw / 2, y + 88, 16, C.cream, 'center', '700');
    });
    // 道具
    if (!cargo) {
      const ty = 322, bw = 160, tool = (k, label, sub, price, cb, o) => {
        const x = ox + k * (bw + gap);
        button(x, ty, bw, 64, label, cb, Object.assign({ sub: sub + '　' + price + '貨', size: 17 }, o));
      };
      const wp = LR.wickPrice(S), zp = LR.zenPrice(S);
      tool(0, '灯芯を太く', 'もとの光 ' + S.src + '→' + (S.src + 1), wp, () => {
        if (S.coins < wp) { SND.deny(); say('貨幣が足りない。'); return; }
        S.coins -= wp; S.src++; S.wickLv++; SND.buy(); say('灯芯を太くした。三つの海路へ入る、もとの光が強くなる。');
      }, { disabled: S.src >= LR.MAX_SRC, info: { title: '灯芯を太く', desc: '三つの海路へ最初に入る光を、1 ずつ強くする。' } });
      tool(1, 'ゼンマイ追加', '最大 ' + S.maxTokens + '→' + (S.maxTokens + 1), zp, () => {
        if (S.coins < zp) { SND.deny(); say('貨幣が足りない。'); return; }
        S.coins -= zp; S.maxTokens++; S.zenLv++; SND.buy(); say('ゼンマイを一つ増やした。');
      }, { disabled: S.maxTokens >= LR.MAX_TOKENS, info: { title: 'ゼンマイ追加', desc: 'ずらし・固定に使えるゼンマイの数を、一つ増やす。' } });
      tool(2, '入れ替え', '二つのコマを交換', LR.SWAP_PRICE, () => { sh.held = held && held.kind === 'swap' ? null : { kind: 'swap', a: null }; sh.confirm = null; SND.click(); },
        { active: held && held.kind === 'swap', info: { title: '入れ替え', desc: '選んだ二つのコマを交換する。別のリール同士でもよい。一回ごとに ' + LR.SWAP_PRICE + ' 貨。' } });
      tool(3, 'コマを外す', 'リールを短く', LR.REMOVE_PRICE, () => { sh.held = held && held.kind === 'remove' ? null : { kind: 'remove' }; sh.confirm = null; SND.click(); },
        { active: held && held.kind === 'remove', info: { title: 'コマを外す', desc: '選んだコマを取りのぞき、そのリールを一コマ短くする（最短 ' + LR.MIN_STRIP + ' コマ）。' } });
      const rp = LR.REROLL_PRICE + sh.rerolls;
      button(ox, 400, bw, 40, '品ぞろえを替える　' + rp + '貨', () => {
        if (S.coins < rp) { SND.deny(); say('貨幣が足りない。'); return; }
        S.coins -= rp; sh.rerolls++; LR.rollOffers(S); sh.held = null; SND.click();
      }, { size: 14, info: { title: '品ぞろえを替える', desc: '並んでいる部品を、別のものに取り替えてもらう。頼むたびに、少しずつ高くなる。' } });
      button(ox + bw + gap, 400, bw, 40, '最初からやり直す', () => { S = JSON.parse(sh.entry); sh.held = null; sh.confirm = null; sh.rerolls = 0; syncReels(); SND.click(); say('工房に入ったときの状態に戻した。'); },
        { size: 14, info: { title: '最初からやり直す', desc: 'この工房に入ったときの状態へ戻す。貨幣も戻る。何度でも試してよい。' } });
    }
    // 案内
    panel(570, 462, 656, 132, 0.6);
    const hv = V.hover && V.hover.info;
    let title = '', desc = '';
    if (V.msg && t < V.msgT) desc = V.msg;
    else if (held && held.kind === 'offer' && V.hover && V.hover.ref) {
      const cell = S.reels[V.hover.ref.c].strip[V.hover.ref.i], tt = offers[held.k].t, res = LR.placeResult(cell, tt);
      title = 'ここに組みこむと';
      desc = !res ? 'これ以上は強くできない。' : res === 'upgrade' ? '同じ部品に重ねて、一段強くする。' : cell.t === 'blank' ? '素通しガラスのコマが、' + LR.COMP[tt].name + 'になる。' : '今ある「' + LR.COMP[cell.t].name + '」と取り替える。';
    }
    else if (hv) { title = hv.title; desc = hv.desc; }
    else if (held && held.kind === 'offer') { title = LR.COMP[offers[held.k].t].name + 'を持っている'; desc = '左のリールの、組みこみたいコマを押そう。素通しガラス以外に置くと、取り替えになる。（Esc でやめる）'; }
    else if (held && held.kind === 'swap') { title = '入れ替え'; desc = held.a ? '交換する相手のコマを押そう。' : '一つめのコマを押そう。'; }
    else if (held && held.kind === 'remove') { title = 'コマを外す'; desc = '取りのぞくコマを押そう。'; }
    else if (cargo) { title = '貨物船からの贈りもの'; desc = '三つのうち一つを、ただで受け取れる。部品にマウスを重ねると、はたらきが読める。'; }
    else { title = '灯室を組み直す'; desc = '部品にマウスを重ねると、はたらきが読める。リールのどこに置くかで、光の通り道が変わる。'; }
    if (title) R.text(g, title, 592, 488, 17, C.gold, 'left', '800');
    R.para(g, desc, 592, title ? 518 : 500, 612, 16, C.cream, 25);
    if (cargo) button(960, 616, 266, 60, '受け取らずに戻る', leaveShop, { size: 18 });
    else button(960, 612, 266, 68, sh.mode === 'retry' ? 'もう一度、夜の海へ' : '次の夜の海へ', leaveShop, { primary: true, size: 24 });
    if (!cargo) R.text(g, '次は　第' + '一二三四五'[sh.mode === 'retry' ? S.night - 1 : S.night] + '夜', 760, 646, 18, C.cream, 'center', '700');
    drawPops();
  }

  // ---------- 描画：タイトルと結末 ----------
  function drawTitle() {
    drawWorld(false);
    V.items.length = 0;
    // 飾りの光
    const t = V.time, n = S.reels.length, ex = R.exitX(n);
    for (let l = 0; l < 3; l++) { const a = 0.25 + 0.2 * Math.sin(t * 0.9 + l * 2.1); R.beamLine(g, ex + 22, R.cy(l), 1300, R.cy(l), 2 + l, a, false); }
    dim(0.18);
    R.text(g, 'LUMEN REEL', 850, 250, 92, C.gold, 'center', '900', '#1a0f30');
    R.text(g, 'ルーメンリール　― まわる灯台と三つの海路 ―', 850, 326, 24, C.cream, 'center', '700', '#0a1024');
    button(710, 400, 280, 66, 'はじめる', () => { SND.init(); SND.click(); newGame(false); }, { primary: true, size: 28 });
    let y = 480;
    if (V.hasSave) { button(710, y, 280, 50, 'つづきから', () => { SND.init(); SND.click(); continueGame(); }, { size: 20 }); y += 62; }
    if (V.best.n) { button(710, y, 280, 50, '荒海に挑む', () => { SND.init(); SND.click(); newGame(true); }, { size: 20, sub: null, info: { title: '荒海', desc: '舟の求める光が、すべて一・五倍になる。' } }); y += 62; }
    if (V.best.n) R.text(g, '記録　難破 ' + V.best.n.wrecks + ' 隻 ／ 星明かり ' + V.best.n.stars + (V.best.h ? '　　荒海　難破 ' + V.best.h.wrecks + ' ／ 星明かり ' + V.best.h.stars : ''), 850, y + 14, 16, C.cream, 'center', '600', '#0a1024');
    R.text(g, 'マウスとキーボードで遊べます　・　音が出ます', 850, 690, 14, 'rgba(246,236,210,0.7)', 'center', '500');
  }
  function drawEnding() {
    const t = V.time - V.endT0;
    R.background(g, 1, V.time, 1);
    R.reef(g, V.time);
    // 港へ帰る船たち
    const lin = { type: 'liner', parts: [0, 0, 0], max: 1, glow: 0 };
    g.save(); g.translate(0, 452); g.scale(0.5, 0.5); R.liner(g, lin, 2700 - Math.min(t, 24) * 60, V.time, true); g.restore();
    for (let i = 0; i < 6; i++) { const x = 1340 + i * 120 - Math.min(t, 16) * 62; R.ship(g, { type: ['boat', 'fast', 'cargo'][i % 3], need: 0, max: 1, glow: 0 }, x, 624 + (i % 2) * 40, V.time, true); }
    R.lighthouse(g, S.reels.length, V.time);
    drawReels(false);
    V.items.length = 0;
    if (t > 1.5) {
      const a = clamp((t - 1.5) / 0.8, 0, 1); g.globalAlpha = a;
      panel(560, 96, 640, 480, 0.86); g.translate(0, -54);
      R.text(g, '朝が来た', 880, 200, 44, C.gold, 'center', '900');
      R.text(g, '嵐の夜を越えて、ひかり丸も港へ帰ってきた。', 880, 250, 18, C.cream, 'center', '600');
      R.text(g, LR.rank(S), 880, 306, 36, '#fff', 'center', '900');
      const rows = [['導いた舟', S.guided + ' 隻'], ['難破させてしまった舟', S.wrecks + ' 隻'], ['星明かり', String(S.stars)], ['いちどに放った最大の光', String(S.bestShot)], ['ゾロ目', S.zoros + ' 回'], ['やり直した夜', S.retries + ' 回']];
      rows.forEach((r, i) => { R.text(g, r[0], 640, 364 + i * 32, 18, C.cream, 'left', '600'); R.text(g, r[1], 1120, 364 + i * 32, 20, C.light, 'right', '800'); });
      if (V.newBest) R.text(g, '★ 記録を更新 ★', 880, 560, 18, C.gold, 'center', '800');
      g.translate(0, 54);
      button(600, 524, 180, 40, 'もう一度あそぶ', () => { SND.click(); newGame(false); }, { size: 16 });
      button(790, 524, 180, 40, '荒海に挑む', () => { SND.click(); newGame(true); }, { size: 16, info: { title: '荒海', desc: '舟の求める光が、すべて一・五倍になる。' } });
      button(980, 524, 180, 40, 'タイトルへ', () => { SND.click(); toTitle(); }, { size: 16 });
      g.globalAlpha = 1;
    }
  }

  // ---------- ループ ----------
  function render() {
    g.setTransform(V.scale, 0, 0, V.scale, 0, 0);
    V.items = [];
    if (V.scene === 'title') drawTitle();
    else if (V.scene === 'play') drawPlay();
    else if (V.scene === 'shop') drawShop();
    else if (V.scene === 'ending') drawEnding();
    // マウスが重なっているもの
    V.hover = null;
    for (let i = V.items.length - 1; i >= 0; i--) { if (isHover(V.items[i])) { V.hover = V.items[i]; break; } }
    cv.style.cursor = V.hover && V.hover.cb ? 'pointer' : 'default';
  }
  function fit() {
    const dpr = Math.min(2, window.devicePixelRatio || 1), sc = Math.min(window.innerWidth / W, window.innerHeight / H);
    cv.style.width = Math.floor(W * sc) + 'px'; cv.style.height = Math.floor(H * sc) + 'px';
    cv.width = Math.round(W * sc * dpr); cv.height = Math.round(H * sc * dpr);
    V.scale = cv.width / W;
  }
  window.addEventListener('resize', fit);
  const DBG = window.__lr = {
    hold: false, V: V,
    get S() { return S; }, set S(v) { S = v; },
    step(n, dt) { for (let i = 0; i < (n || 1); i++) update(dt || 1 / 60); render(); },
    primary: primary, click: (x, y) => clickAt({ x: x, y: y }), nudge: nudge, toggleHold: toggleHold,
    newGame: newGame, beginNight: beginNight, openShop: openShop, openEnding: openEnding, toTitle: toTitle, syncReels: syncReels, syncShips: syncShips,
  };
  let lastT = 0;
  function loop(ts) {
    const dt = Math.min(0.05, (ts - lastT) / 1000 || 0); lastT = ts;
    if (!DBG.hold) { update(dt); render(); }
    requestAnimationFrame(loop);
  }
  fit(); loadBest(); toTitle();
  requestAnimationFrame(loop);
})();
