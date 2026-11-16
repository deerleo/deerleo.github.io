/* missions.js — the five episodes: enemy brains, attack data, staging and every line of dialogue */
(() => {
  'use strict';
  const BD = window.BD, U = BD.U, FX = BD.FX, cam = BD.cam;
  const A = () => BD.Audio;
  const G = 2400;
  /** enemy attack with sane defaults: slow readable wind-up, a "!" tell, adult-height hitbox */
  const E = (o) => Object.assign({ poses: ['crossW', 'cross'], wind: 0.46, act: 0.1, rec: 0.5, dmg: 8, reach: 112, h: [-180, -6], kb: 260, lunge: 190, stop: 0.07, sfx: 'whoosh', hs: 'hit_heavy', tell: true, windRate: 9 }, o);
  const bark = (f, s, col) => FX.text(f.x, f.y - f.hh - 44, BD.slang(s).toUpperCase(), col || '#ffffff');
  const sub = (w, gen) => w.subs.push(new BD.Co(gen));
  const near = (w, dx) => U.clamp(w.player.x + dx, w.minX + 20, w.maxX - 20);

  function lob(f, w, kind, dmg, speed) {
    const p = w.player, x0 = f.x + f.face * 40, y0 = f.y - f.hh * 0.8, g = 900;
    const T = Math.max(0.4, Math.abs(p.x - x0) / (speed || 500));
    w.shoot({ x: x0, y: y0, vx: (p.x - x0) / T, vy: (p.y - 60 - y0 - 0.5 * g * T * T) / T, g, dmg, kind, owner: f, hs: 'hit_light' });
    A().sfx('bb_shot', { pitch: 0.55 });
  }
  function fireAt(f, w, speed, dmg, spread) {
    const p = w.player, x0 = f.x + f.face * 34, y0 = f.y - f.hh * 0.56;
    const ang = Math.atan2(p.y - 62 - y0, p.x - x0) + (spread || 0);
    w.shoot({ x: x0, y: y0, vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed, dmg, kind: 'bb', owner: f, r: 7, kb: 90, stop: 0.02, hs: 'hit_light' });
    A().sfx('bb_shot'); FX.spark(x0, y0, 2, '#ffd27a', 160);
  }
  function waves(f, w, col, col2, dmg) {
    for (const d of [-1, 1]) w.shoot({ x: f.x + d * 50, y: 0, vx: d * 520, r: 34, w: 22, dmg: dmg || 9, kind: 'wave', reflect: false, life: 1.7, owner: f, down: true, kb: 360, col, col2, hs: 'hit_heavy' });
  }
  function* leap(f, w, slam, T) {
    f.faceT(); T = T || 0.75;
    const tx = U.clamp(w.player.x - f.face * 70, w.minX + 40, w.maxX - 40);
    f.armor = true;
    yield* f.hop((tx - f.x) / T, -0.5 * G * T, 'overW');
    f.faceT(); yield* f.strike(slam, true); f.armor = f.armor0;
  }

  /* ----------------------------------------------------- rank-and-file AI */
  const PUNCH = E({ dmg: 7 });
  const MALLET = E({ poses: ['overW', 'over'], wind: 0.62, dmg: 11, reach: 150, down: true, sfx: 'whoosh_heavy', arc: [-2.2, 0.4, 62], arcY: 0.7 });
  const CORK = E({ poses: ['throwW', 'throwR'], wind: 0.6, dmg: 0, lunge: 0, sfx: null, fire(f, w) { lob(f, w, 'cork', 7); } });
  function* grunt(f, w) {
    const d = f.data, range = d.range || 122;
    yield* f.idleFor(U.rand(0.2, 0.8));
    yield* f.approach(range, 2.2);
    if (f.dist() > range + 34) return;
    if (!w.token(f)) { yield* f.idleFor(U.rand(0.3, 0.7)); if (Math.random() < 0.5) yield* f.backOff(70); return; }
    yield* f.strike(U.pick(d.atks));
    w.untoken(f);
    yield* f.idleFor(U.rand(0.5, 1.0));
  }
  function* shooter(f, w) {
    const d = f.dist();
    if (d < 260) yield* f.backOff(170, 180); else if (d > 540) yield* f.approach(480, 1.5);
    yield* f.idleFor(U.rand(0.5, 1.1));
    yield* f.strike(CORK);
    yield* f.idleFor(U.rand(0.8, 1.4));
  }
  const SHOVE = E({ poses: ['jabW', 'flurry'], wind: 0.34, dmg: 6, kb: 540, reach: 124, down: true });
  const SLAM = E({ poses: ['overW', 'slam'], wind: 0.7, rec: 0.7, dmg: 14, reach: 144, unblock: true, down: true, armor: true, sfx: 'whoosh_heavy', fire(f) { FX.ring(f.x + f.face * 90, 0, '#ffffff', 90); cam.shake(0.4); A().sfx('thud'); } });
  function* guardAI(f) {
    yield* f.idleFor(U.rand(0.4, 0.8));
    yield* f.approach(132, 2.5, 150);
    if (f.dist() > 176) return;
    yield* f.strike(Math.random() < 0.45 ? SLAM : SHOVE);
    yield* f.idleFor(0.6);
  }

  /* ---------------------------------------------- Stinkmeaner of legend */
  const S_CUT = E({ poses: ['swingW', 'swing'], wind: 0.36, rec: 0.3, dmg: 8, reach: 160, lunge: 230, hs: 'slash', sfx: 'slash', arc: [-1.3, 0.9, 60], arcY: 0.55, arcC: '#14110f' });
  const S_CUT2 = E({ poses: ['thrustW', 'thrust'], wind: 0.2, rec: 0.3, dmg: 7, reach: 170, lunge: 260, hs: 'slash', sfx: 'slash', tell: false, windRate: 20 });
  const S_OVER = E({ poses: ['overW', 'over'], wind: 0.44, rec: 0.6, dmg: 13, reach: 160, lunge: 200, hs: 'slash', sfx: 'whoosh_heavy', unblock: true, down: true, arc: [-2.3, 0.5, 64], arcY: 0.7, arcC: '#c8102e' });
  const S_IAI = E({ poses: ['iaiW', 'iaiCut'], wind: 0.62, act: 0.2, rec: 0.8, dmg: 16, reach: 150, rush: 1750, lunge: 0, kb: 560, down: true, hs: 'slash', sfx: 'slash', armor: true, windRate: 16, arc: [-0.5, 0.5, 76], arcC: '#c8102e' });
  const S_WAVE = E({ poses: ['swingW', 'swing'], wind: 0.5, rec: 0.5, dmg: 0, lunge: 0, sfx: 'slash', fire(f, w) { w.shoot({ x: f.x + f.face * 60, y: 0, vx: f.face * 560, r: 40, w: 22, dmg: 10, kind: 'wave', reflect: false, life: 2.2, owner: f, down: true, kb: 380, hs: 'slash' }); } });
  const S_SLAM = E({ poses: ['over', 'slam'], wind: 0.04, act: 0.12, rec: 0.85, dmg: 14, reach: 150, h: [-140, 10], unblock: true, down: true, tell: false, lunge: 0, sfx: 'thud', fire(f) { FX.ring(f.x + f.face * 70, 0, '#14110f', 110); FX.dust(f.x + f.face * 70, 0, 10, '#3a3430'); cam.shake(0.5); } });
  const STINK_BARKS = ['I HEAR YO KNEES KNOCKIN!', 'COME ON WIT IT!', 'I CAN SMELL A SCRUB!', 'BLIND AND STILL SEE YOU LOSIN!'];
  function* stinkAI(f, w) {
    const rage = f.hp < f.max * 0.5;
    f.expr0 = rage ? 'angry' : 'grin';
    yield* f.idleFor(rage ? 0.3 : 0.65);
    if (Math.random() < 0.25) bark(f, U.pick(STINK_BARKS), '#c8102e');
    const d = f.dist(), r = Math.random();
    if (d > 380) {
      if (r < 0.55) { yield* f.strike(S_IAI); if (rage) { yield 0.12; yield* f.strike(S_IAI); } }
      else yield* f.strike(S_WAVE);
    } else if (d < 190) {
      if (r < 0.5) { yield* f.strike(S_CUT); yield* f.strike(S_CUT2); yield* f.strike(S_OVER); }
      else if (r < 0.8) yield* leap(f, w, S_SLAM);
      else yield* f.backOff(230, 330);
    } else {
      yield* f.approach(170, 1.0, rage ? 270 : 200);
      if (f.dist() < 200) { yield* f.strike(S_CUT); yield* f.strike(S_OVER); }
    }
  }

  /* ---------------------------------------------------- the Night Manager */
  const N_WHIP = E({ poses: ['swingW', 'swing'], wind: 0.34, rec: 0.25, dmg: 6, reach: 150, lunge: 160, hs: 'hit_light', arc: [-1.2, 0.8, 58], arcY: 0.6 });
  const N_WHIP2 = E({ poses: ['overW', 'over'], wind: 0.16, rec: 0.2, dmg: 6, reach: 150, lunge: 160, tell: false, windRate: 22, hs: 'hit_light', arc: [-2.0, 0.6, 58], arcY: 0.7 });
  const N_END = E({ poses: ['thrustW', 'thrust'], wind: 0.32, rec: 0.65, dmg: 10, reach: 165, lunge: 240, down: true, unblock: true });
  const N_KICK = E({ poses: ['kickW', 'sideKick'], wind: 0.5, act: 0.24, rec: 0.6, dmg: 11, reach: 120, rush: 880, lunge: 0, down: true, sfx: 'whoosh_heavy' });
  function* managerAI(f) {
    const rage = f.hp < f.max * 0.45;
    yield* f.idleFor(rage ? 0.35 : 0.7);
    const d = f.dist(), r = Math.random();
    if (d > 330) { if (r < 0.6) yield* f.strike(N_KICK); else yield* f.approach(160, 1.2, 240); }
    else if (d < 200) {
      if (r < 0.6) { yield* f.strike(N_WHIP); yield* f.strike(N_WHIP2); if (rage) yield* f.strike(N_WHIP2); yield* f.strike(N_END); }
      else if (r < 0.8) { yield* f.backOff(200, 300); yield* f.strike(N_KICK); }
      else { bark(f, 'EMPLOYEE OF THE MONTH. SIX TIMES.'); f.pose('cheer', 14, 'grin'); yield 0.8; f.set('idle'); }
    } else yield* f.approach(170, 1.0, 230);
  }

  /* ------------------------------------------------------- Young Reezy */
  const R_SHOT = E({ poses: ['aim', 'recoil'], wind: 0.42, act: 0.05, rec: 0.22, dmg: 0, lunge: 0, sfx: null, laser: true, tell: false, windRate: 18, fire(f, w) { fireAt(f, w, 800, 6); } });
  const R_QUICK = Object.assign({}, R_SHOT, { wind: 0.15 });
  const R_SHOVE = E({ poses: ['jabW', 'flurry'], wind: 0.22, rec: 0.3, dmg: 4, reach: 84, h: [-110, -10], kb: 580, down: true, lunge: 120, tell: false, windRate: 20 });
  const R_WILD = E({ poses: ['jabW', 'jab'], wind: 0.26, rec: 0.3, dmg: 5, reach: 82, h: [-110, -10], lunge: 210 });
  const R_WILD2 = E({ poses: ['crossW', 'cross'], wind: 0.14, rec: 0.55, dmg: 6, reach: 86, h: [-110, -10], lunge: 210, tell: false, windRate: 20, down: true });
  const RILEY_BARKS = ['YOUNG REEZY DONT MISS!', 'THIS FOR MY FORTY DOLLARS!', 'YOU AINT GRANDDAD!', 'GAME RECOGNIZE GAME!'];
  function* relocate(f, w) {
    const p = w.player, left = 150, right = w.bg.width - 150, pl = w.bg.platforms[0];
    if (f.y < -10) { yield* f.hop(p.x > f.x ? -340 : 340, -520); f.dropT = 0; }
    else if (pl && Math.random() < 0.5 && Math.abs(p.x - pl.x1) > 260) { yield* f.runTo(pl.x1 - 90, 440); yield* f.hop(340, -1160); }
    else yield* f.runTo(Math.abs(p.x - left) > Math.abs(p.x - right) ? left : right, 440);
    f.faceT();
  }
  function* rileyAI(f, w) {
    const d = f.data, k = f.hp / f.max;
    if (k < 0.55 && !d.dark) { d.dark = true; w.st.dark = 1; w.relight(); A().sfx('glass'); FX.flash(0.7, '#000000'); bark(f, 'LIGHTS OUT!'); yield* relocate(f, w); }
    if (k < 0.22 && !d.fists) { d.fists = true; f.rig.prop = null; bark(f, 'OUTTA AMMO?! ...AIGHT. HANDS.'); f.pose('shrug', 14, 'shock'); yield 0.9; f.set('idle'); }
    if (d.fists) { yield* f.idleFor(0.3); yield* f.approach(84, 1.5, 310); yield* f.strike(R_WILD); yield* f.strike(R_WILD2); yield* f.idleFor(0.7); return; }
    if (f.dist() < 190) { yield* f.strike(R_SHOVE); yield* relocate(f, w); return; }
    yield* f.idleFor(d.dark ? 0.35 : 0.6);
    const r = Math.random();
    if (r < 0.42) yield* f.strike(R_SHOT);
    else if (r < 0.86) { yield* f.strike(R_SHOT); yield* f.strike(R_QUICK); yield* f.strike(R_QUICK); }
    else { bark(f, U.pick(RILEY_BARKS)); f.pose('cheer', 14, 'grin'); yield 0.9; f.set('idle'); }
  }

  /* ----------------------------------------------- Stinkmeaner, wearing Tom */
  const T_J1 = E({ poses: ['jabW', 'jab'], wind: 0.3, rec: 0.16, dmg: 6, reach: 130, lunge: 220 });
  const T_J2 = E({ poses: ['crossW', 'cross'], wind: 0.14, rec: 0.16, dmg: 7, reach: 135, lunge: 240, tell: false, windRate: 22 });
  const T_OVER = E({ poses: ['overW', 'slam'], wind: 0.4, rec: 0.6, dmg: 13, reach: 140, unblock: true, down: true, sfx: 'whoosh_heavy' });
  const T_BACK = E({ poses: ['swingW', 'swing'], wind: 0.24, rec: 0.5, dmg: 10, reach: 140, down: true, windRate: 20 });
  const T_POUND = E({ poses: ['over', 'slam'], wind: 0.04, act: 0.1, rec: 0.9, dmg: 12, reach: 110, h: [-140, 10], unblock: true, down: true, tell: false, lunge: 0, sfx: 'thud', fire(f, w) { waves(f, w, '#2c5a22', '#b6ff8a'); cam.shake(0.6); A().sfx('ghost', { vol: 0.5 }); FX.ring(f.x, 0, '#b6ff8a', 120); } });
  const TOM_BARKS = ['WHATS GOOD, FREEMAN!', 'HELL WAS LOVELY THIS TIME OF YEAR!', 'THIS BODY GOT A GYM MEMBERSHIP!', 'I HATE THIS HOUSE!'];
  function* ghostStep(f, w) {
    A().sfx('ghost'); f.inv = 0.8; f.pose('float', 14, 'grin');
    let t = 0; yield () => { t += w.dt; f.alpha = Math.max(0.15, 1 - t * 4); return t > 0.35; };
    const p = w.player; f.x = U.clamp(p.x - p.face * 124, w.minX + 30, w.maxX - 30); f.faceT(); FX.spark(f.x, f.y - 100, 8, '#b6ff8a', 200);
    t = 0; yield () => { t += w.dt; f.alpha = Math.min(1, 0.15 + t * 5); return t > 0.2; };
    f.alpha = 1; yield* f.strike(T_BACK);
  }
  function* caneRain(f, w, n) {
    f.pose('cheer', 12, 'shout'); f.armor = true; A().sfx('ghost'); bark(f, 'RAINING CANES, BOY!', '#b6ff8a');
    const p = w.player;
    for (let i = 0; i < n; i++) {
      const x = U.clamp(p.x + p.vx * 0.4 + U.rand(-90, 90), w.minX, w.maxX);
      w.marks.push({ x, t: 0.8 });
      sub(w, (function* () { yield 0.5; w.shoot({ x, y: -560, vy: 900, vx: 0.01, dmg: 9, kind: 'cane', r: 18, reflect: false, owner: f, down: true, life: 2, kb: 200, hs: 'hit_heavy' }); })());
      yield 0.22;
    }
    yield 0.5; f.armor = f.armor0; f.set('idle');
  }
  function* tomAI(f, w) {
    const rage = f.hp < f.max * 0.4;
    yield* f.idleFor(rage ? 0.25 : 0.6);
    if (Math.random() < 0.2) bark(f, U.pick(TOM_BARKS), '#b6ff8a');
    const d = f.dist(), r = Math.random();
    if (r < 0.22) yield* ghostStep(f, w);
    else if (r < 0.4) yield* caneRain(f, w, rage ? 7 : 5);
    else if (d > 300 && r < 0.72) yield* leap(f, w, T_POUND);
    else { yield* f.approach(140, 1.2, rage ? 300 : 230); if (f.dist() < 190) { yield* f.strike(T_J1); yield* f.strike(T_J2); yield* f.strike(T_OVER); } }
  }

  /* -------------------------------------------------------- the Hateocracy */
  const C_TRAP = E({ poses: ['throwW', 'throwR'], wind: 0.6, rec: 0.5, dmg: 8, reach: 340, lunge: 0, kb: -640, sfx: 'chain', arc: [-0.25, 0.25, 150], arcY: 0.5, arcC: '#9a9aa4' });
  const C_CLAW = E({ poses: ['swingW', 'swing'], wind: 0.3, rec: 0.45, dmg: 9, reach: 135, down: true });
  const C_OVER = E({ poses: ['overW', 'slam'], wind: 0.55, rec: 0.7, dmg: 13, reach: 150, unblock: true, down: true, sfx: 'chain' });
  function* crabAI(f) {
    yield* f.idleFor(0.6);
    const d = f.dist(), r = Math.random();
    if (d > 200 && d < 390 && r < 0.75) { yield* f.strike(C_TRAP); if (f.dist() < 180) yield* f.strike(C_CLAW); }
    else if (d <= 200) yield* f.strike(r < 0.6 ? C_CLAW : C_OVER);
    else yield* f.approach(300, 1.2, 170);
  }
  const G_K1 = E({ poses: ['kickW', 'sideKick'], wind: 0.28, rec: 0.14, dmg: 6, reach: 130, lunge: 200 });
  const G_K2 = E({ poses: ['spinW', 'spinKick'], wind: 0.14, rec: 0.14, dmg: 6, reach: 130, lunge: 200, tell: false, windRate: 22 });
  const G_K3 = E({ poses: ['kickW', 'riseKick'], wind: 0.18, rec: 0.55, dmg: 9, reach: 120, lunge: 160, tell: false, windRate: 22, launch: true, ky: -700 });
  const G_DIVE = E({ poses: ['diveKick', 'diveKick'], wind: 0.02, act: 0.7, rec: 0.3, dmg: 11, reach: 100, h: [-110, 30], air: true, diveV: [640, 760], down: true, tell: false, lunge: 0 });
  function* gripeAI(f) {
    yield* f.idleFor(f.hp < f.max * 0.5 ? 0.3 : 0.5);
    const d = f.dist(), r = Math.random();
    if (d > 260 || r < 0.3) {
      f.faceT(); f.set('air'); f.y -= 2; f.onG = false; f.vy = -880; f.vx = f.face * 150; A().sfx('jump');
      FX.stars.push({ x: f.x, y: f.y - f.hh - 26, life: 0.16, max: 0.16, size: 5 });
      yield () => f.vy > -140 || f.onG;
      if (!f.onG) yield* f.strike(G_DIVE);
    } else if (d < 190) {
      yield* f.strike(G_K1); yield* f.strike(G_K2); yield* f.strike(G_K3);
      if (Math.random() < 0.6) yield* f.hop(-f.face * 380, -620);
    } else yield* f.approach(170, 0.8, 330);
  }
  const P_HAY = E({ poses: ['crossW', 'cross'], wind: 0.7, rec: 0.7, dmg: 16, reach: 150, lunge: 260, unblock: true, down: true, kb: 640, sfx: 'whoosh_heavy' });
  const P_BELLY = E({ poses: ['stomp', 'flurry'], wind: 0.55, act: 0.3, rec: 0.7, dmg: 10, reach: 110, rush: 760, lunge: 0, down: true, kb: 560 });
  const P_STOMP = E({ poses: ['stomp', 'slam'], wind: 0.6, act: 0.1, rec: 0.8, dmg: 0, lunge: 0, sfx: 'thud', fire(f, w) { waves(f, w, '#3b4a66', '#cfe0ff', 10); cam.shake(0.7); FX.dust(f.x, 0, 10, '#9fb4d0'); } });
  function* pistAI(f) {
    yield* f.idleFor(0.7);
    const d = f.dist(), r = Math.random();
    if (d > 360) yield* f.strike(r < 0.5 ? P_BELLY : P_STOMP);
    else if (d < 200) yield* f.strike(r < 0.6 ? P_HAY : P_STOMP);
    else yield* f.approach(170, 1.4, 130);
  }
  const CREW = [
    { id: 'crab', ai: crabAI, hp: 180, o: { title: 'TRAPS OLDER THAN YOU', speed: 170, idle: 'hold', brk: 50 }, banner: 'CRABMISER!', ko: 'DECLAWED.' },
    { id: 'gripe', ai: gripeAI, hp: 165, o: { title: 'KICKING SINCE 1949', speed: 320, idle: 'stance', block: 0.3 }, banner: 'GRIPENASTY!', ko: 'SAT DOWN.' },
    { id: 'pist', ai: pistAI, hp: 230, o: { title: 'HE JUST HITS THINGS', speed: 130, idle: 'stance', armor: true, brk: 42 }, banner: 'PISTOFFERSON!', ko: 'WHOOPED.' },
  ];
  const hatePhase = (i) => function* (w) {
    w.setBg('street'); w.music('finale', 0.6); w.place(720, 1);
    w.maxX = 1560;                       // the ones waiting their turn watch from under the far street lamp
    for (let j = i + 1; j < 3; j++) w.npc(CREW[j].id, 1640 + j * 110, { face: -1, prop: 'umbrella', pose: 'hold', z: -1 });
    const c = CREW[i], b = w.foe(c.id, 1260, Object.assign({ boss: true, ai: c.ai, hp: c.hp }, c.o));
    yield* w.fadeIn(0.3);
    yield* w.duel(b, { banner: c.banner, ko: c.ko });
  };

  /* --------------------------------------------------------------- stealth */
  function* patrol(g, w) {
    const d = g.data;
    for (;;) {
      yield* w.walk(g, d.b, d.speed, 'patrol'); g.rig.setPose('flashlight', 10); yield U.rand(0.9, 1.7);
      yield* w.walk(g, d.a, d.speed, 'patrol'); g.rig.setPose('flashlight', 10); yield U.rand(0.9, 1.7);
    }
  }

  /* shared library for the episode files in js/episodes/ */
  BD.Lib = { E, bark, sub, near, lob, fireAt, waves, leap, grunt, shooter, guardAI, stinkAI, managerAI, rileyAI, relocate, tomAI, ghostStep, caneRain, crabAI, gripeAI, pistAI, patrol, CREW,
    PUNCH, MALLET, CORK, SHOVE, SLAM };
  /** an episode file replaces the built-in mission with the same id (board position and unlock rules carry over) */
  BD.episode = (def) => {
    const i = BD.MISSIONS.findIndex((m) => m.id === def.id);
    if (i < 0) { BD.MISSIONS.push(def); return; }
    const base = BD.MISSIONS[i];   // numbering, board position and unlock rules are set centrally (GRAPH below)
    BD.MISSIONS[i] = Object.assign({}, base, def, { ep: base.ep, x: base.x, y: base.y, needs: base.needs });
  };

  /* ============================================================ missions */
  const M = (BD.MISSIONS = []);

  M.push({
    id: 'garden', ep: 'EPISODE 1', title: 'THE GARDEN PARTY', src: 'inspired by Season 1, Episode 1', bg: 'garden', x: 52, y: 104, needs: [],
    blurb: 'Ed Wuncler throws a garden party. Huey has a microphone and a few facts about the shrimp.',
    loss: 'Guest: "He\'s so articulate when he\'s unconscious."',
    *intro(w) {
      w.setBg('garden', { heat: 0 }); w.music('garden', 0); w.place(430, 1);
      const gd = w.npc('granddad', 300, { face: 1, pose: 'handsHips' }), ri = w.npc('riley', 220, { face: 1, pose: 'lean' });
      const g1 = w.npc('guest', 650, { face: -1 }), g2 = w.npc('tux', 760, { face: -1 }), g3 = w.npc('guest', 880, { face: -1, variant: 1 });
      w.look(540, 1.3);
      yield* w.narr('Woodcrest. A suburb so peaceful you can hear the property values rise.');
      yield* w.narr('Granddad moved us here from the South Side of Chicago for a "better life". Tonight the better life is a garden party at Ed Wuncler\'s mansion.');
      w.player.face = -1;
      yield* w.say('granddad', 'Now listen. These are nice, wealthy people. Don\'t you say NOTHING. No politics. No conspiracies. No "truth".', 'scowl');
      yield* w.say('riley', 'What if they ask me somethin\'?', 'smirk');
      yield* w.say('granddad', 'Then you say "I like cheese." Everybody likes cheese.', 'deadpan');
      w.player.face = 1; w.player.pose('point', 12, 'deadpan');
      yield* w.say('huey', 'Excuse me. Everyone. I have a brief announcement.', 'deadpan');
      yield* w.say('huey', 'Everything on that buffet table was paid for by a war. Also, the shrimp is undercooked.', 'scowl');
      g1.rig.expr = g2.rig.expr = g3.rig.expr = 'shock'; A().sfx('crowd');
      yield* w.say('guest', '...Did that child just say something ARTICULATE?', 'shock');
      yield* w.say('tux', 'He criticized the shrimp. GET HIM.', 'angry');
      gd.rig.setPose('facepalm', 12);
      yield* w.narr('In my experience the truth doesn\'t set people free. It makes them throw champagne.');
      yield* w.fadeOut(0.3);
      gd.gone = ri.gone = g1.gone = g2.gone = g3.gone = true;
    },
    phases: [function* (w) {
      w.setBg('garden', { heat: 0.3 }); w.music('garden', 0.9); w.place(430, 1); w.zoom = 1.3;
      const H = { hp: 24, ai: grunt, data: { atks: [PUNCH] } };
      yield* w.fadeIn(0.3);
      w.toast('A/D MOVE   J STRIKE   K KICK   SPACE JUMP', 7);
      yield* w.wave([Object.assign({ id: 'guest', x: near(w, 460) }, H), Object.assign({ id: 'guest', x: near(w, -380), variant: 1 }, H)]);
      w.st.heat = 0.65; w.relight();
      w.toast('L GUARD. TAP IT JUST BEFORE A HIT TO PARRY.', 7);
      yield* w.wave([
        { id: 'guest', x: near(w, 520), variant: 2, hp: 30, prop: 'mallet', ai: grunt, data: { atks: [MALLET], range: 150 } },
        { id: 'tux', x: near(w, 700), hp: 20, prop: 'bottle', ai: shooter },
        Object.assign({ id: 'guest', x: near(w, -420) }, H),
      ]);
      w.st.heat = 1; w.relight();
      w.toast('SHIFT DASH.  A RED "!" CANNOT BE BLOCKED.', 7);
      const b = w.foe('guard', near(w, 560), { hp: 110, boss: true, ai: guardAI, title: 'WUNCLER ESTATE SECURITY', speed: 150, idle: 'stance', brk: 40 });
      w.foe('tux', near(w, -520), { variant: 1, hp: 20, prop: 'bottle', ai: shooter });
      w.foe('guest', near(w, 760), { variant: 1, hp: 30, prop: 'mallet', ai: grunt, data: { atks: [MALLET], range: 150 } });
      yield* w.duel(b, { banner: 'SECURITY!', ko: 'ESCORTED OUT.' });
    }],
    *outro(w) {
      yield* w.fadeOut(0.5);
      A().sfx('slap'); FX.flash(0.8);
      w.setBg('house', {}); w.music('house', 0); w.place(600, 1);
      w.player.rig.snap('down'); w.player.rig.expr = 'pain';
      const gd = w.npc('granddad', 700, { face: -1, pose: 'handsHips' }), ri = w.npc('riley', 470, { face: 1, pose: 'lean' });
      w.look(590, 1.5);
      yield* w.fadeIn(0.5);
      yield* w.say('granddad', 'BOY! Wake up! You were kicking my couch and hollering about shrimp!', 'shout');
      w.player.pose('stand', 6, 'deadpan');
      yield* w.say('huey', 'I was telling the truth at the garden party. They rioted.', 'deadpan');
      yield* w.say('granddad', 'How many times I gotta tell you? Stop dreaming about making rich people riot! We ain\'t even BEEN to the party yet!', 'scowl');
      yield* w.say('riley', 'Was I in the dream? Was I doin\' somethin\' cool?', 'grin');
      yield* w.say('huey', 'You said you liked cheese.', 'deadpan');
      yield* w.say('riley', '...That ain\'t cool.', 'scowl');
      yield* w.narr('The real party went differently. They called me "well-spoken" and clapped. I preferred the riot.');
      gd.gone = ri.gone = true;
    },
  });

  M.push({
    id: 'fight', ep: 'EPISODE 2', title: 'GRANDDAD\'S FIGHT', src: 'inspired by Season 1, Episode 4', bg: 'house', x: 140, y: 104, needs: ['garden'],
    blurb: 'A blind old man whooped Granddad in a parking lot. Huey investigates, and lets his imagination do the rest.',
    loss: 'Stinkmeaner: "I couldn\'t SEE that whoopin\'. But I felt it. Felt great."',
    *intro(w) {
      w.setBg('house', {}); w.music('house', 0.1); w.place(620, 1);
      const gd = w.npc('granddad', 760, { face: -1, pose: 'facepalm' }), ri = w.npc('riley', 500, { face: 1, pose: 'lean' });
      w.look(640, 1.45);
      yield* w.narr('There are moments that define a man. Granddad\'s came in a parking lot, over a parking space.');
      yield* w.say('granddad', 'He was BLIND, Huey. A blind old man whooped me in front of the whole mall. He called me things I can\'t repeat on television.', 'worry');
      yield* w.say('riley', 'It\'s on the internet, Granddad. Eleven thousand views. You fell like a folding chair.', 'grin');
      gd.rig.setPose('handsHips', 12);
      yield* w.say('granddad', 'I want a rematch. Huey, you know all that kung fu. Find out who this Stinkmeaner is.', 'scowl');
      yield* w.narr('Colonel H. Stinkmeaner. Blind since birth. How does a blind man fight like that? I had a theory. It was a stupid theory. I committed to it completely.');
      yield* w.fadeOut(0.6);
      gd.gone = ri.gone = true;
      w.setBg('ink'); w.music('ink', 0.2); w.place(520, 1);
      const s = w.npc('stinkInk', 1240, { face: -1, pose: 'caneLean' });
      w.look(880, 1.15);
      yield* w.fadeIn(0.8);
      yield* w.narr('Somewhere in the mountains a blind boy was taken in by a master swordsman. For forty years he trained, until he could hear a heartbeat at a hundred paces.');
      yield* w.say('stinkInk', 'I smell fear. And cocoa butter. Come get this whoopin\', little bushy-headed boy.', 'grin', { name: 'Stinkmeaner (imagined)' });
      s.gone = true;
    },
    phases: [function* (w) {
      w.setBg('ink'); w.music('ink', 0.6); w.place(520, 1);
      const b = w.foe('stinkInk', 1260, { hp: 250, boss: true, ai: stinkAI, title: 'THE BLIND FURY (ALLEGEDLY)', speed: 200, idle: 'caneLean', walk: 'stride', expr: 'grin', brk: 60 });
      yield* w.fadeIn(0.3);
      w.toast('RED "!" = UNBLOCKABLE. PARRY IT OR MOVE.', 6);
      yield* w.duel(b, { banner: 'DUEL!', ko: 'IMAGINARY WHOOPING.' });
    }],
    *outro(w) {
      yield* w.fadeOut(0.6);
      w.setBg('house', {}); w.music('house', 0.1); w.place(620, 1);
      const gd = w.npc('granddad', 760, { face: -1, pose: 'handsHips' });
      w.look(680, 1.5);
      yield* w.fadeIn(0.6);
      yield* w.narr('That\'s what I imagined. Then I actually followed him around for a day.');
      yield* w.say('huey', 'Granddad, I researched Stinkmeaner. He has no training. No powers. He\'s not a master of anything.', 'deadpan');
      yield* w.say('granddad', 'Then how did he BEAT me?!', 'shock');
      yield* w.say('huey', 'He\'s just mean. He swung wild and you got scared. It\'s the oldest trick there is.', 'deadpan');
      gd.rig.setPose('cheer', 12);
      yield* w.say('granddad', 'So you\'re telling me I can TAKE him.', 'grin');
      yield* w.narr('Granddad won the rematch. He won it a little too hard. The Colonel did not get back up. Ever.');
      yield* w.narr('Hatred that pure doesn\'t just disappear, though. It finds a way back.');
      gd.gone = true;
    },
  });

  M.push({
    id: 'theater', ep: 'EPISODE 3A', title: '...OR DIE TRYING', src: 'inspired by Season 2, Episode 1', bg: 'lobby', x: 232, y: 58, needs: ['fight'],
    blurb: 'Granddad sneaks everyone into the movies. Huey gets left in the lobby with Uncle Ruckus and his principles.',
    loss: 'Ruckus: "That\'s what you get for watchin\' without payin\'. Clean-up, aisle YOU."',
    *intro(w) {
      w.setBg('lobby'); w.music('stealth', 0.1); w.place(330, 1);
      const gd = w.npc('granddad', 460, { face: -1, pose: 'handsHips' }), ri = w.npc('riley', 250, { face: 1, pose: 'lean' }), jz = w.npc('jazmine', 170, { face: 1, expr: 'worry' });
      const ru = w.npc('ruckus', 900, { face: -1, prop: 'flashlight', pose: 'flashlight', idle: 'flashlight', expr: 'grin' });
      w.look(420, 1.35);
      yield* w.narr('"Soul Jet 2: Still Delayed." Opening night. The trailer alone set us back about fifteen years.');
      yield* w.say('granddad', 'Thirteen dollars a ticket? For THAT? We\'re gonna do what my generation did. March right in and take what\'s ours.', 'scowl');
      yield* w.say('huey', 'You\'re describing theft.', 'deadpan');
      yield* w.say('granddad', 'I\'m describing a PROTEST. Y\'all love protests.', 'grin');
      yield* w.say('jazmine', 'Mr. Freeman, isn\'t sneaking in against the law? I don\'t want to go to movie jail!', 'worry');
      yield* w.say('riley', 'Ain\'t no movie jail. ...Is it?', 'worry');
      w.look(760, 1.3);
      yield* w.walk(ru, 720, 130, 'patrol');
      yield* w.say('ruckus', 'Welcome to the picture show! Uncle Ruckus, head usher, no relation. I can smell an unpaid ticket from the parkin\' lot. Enjoy the film, PAYING customers.', 'grin');
      yield* w.narr('Granddad and the others slipped in while Ruckus was sniffing a stranger. I got left in the lobby. With my principles. And no ticket.');
      yield* w.fadeOut(0.3);
      gd.gone = ri.gone = jz.gone = ru.gone = true;
    },
    phases: [function* (w) {
      w.setBg('lobby'); w.music('stealth', 0.5); w.place(160, 1); w.noFight = true; w.zoom = 1.3;
      const guards = [
        w.npc('ruckus', 900, { prop: 'flashlight', pose: 'flashlight', idle: 'flashlight', expr: 'grin', data: { a: 640, b: 1500, speed: 105 } }),
        w.npc('manager', 2300, { variant: 1, prop: 'flashlight', pose: 'flashlight', idle: 'flashlight', data: { a: 1760, b: 2860, speed: 135 } }),
      ];
      for (const g of guards) sub(w, patrol(g, w));
      yield* w.fadeIn(0.3);
      w.toast('HOLD S BEHIND A PROP TO HIDE. STAY OUT OF THE LIGHT.', 8);
      const p = w.player;
      let tick = 0, caught = null;
      yield () => {
        const hidden = p.state === 'crouch' && w.bg.hideSpots.some((h) => Math.abs(p.x - h.x) < h.w / 2 + 12);
        let seen = 0;
        w.beams.length = 0;
        for (const g of guards) {
          const len = 340, dx = (p.x - g.x) * g.face;
          let s = 0;
          if (!hidden && p.y > -150) { if (dx > 0 && dx < len + 20) s = 1.3 - dx / len; else if (Math.abs(p.x - g.x) < 64) s = 1.3; }
          w.beams.push({ x: g.x + g.face * 46, y: g.y - 118, dir: g.face, len, hot: s > 0 });
          if (s > seen) { seen = s; caught = g; }
        }
        w.alert = U.clamp(w.alert + (seen > 0 ? seen * 2.1 : -0.9) * w.dt, 0, 1);
        if (seen > 0) { tick -= w.dt; if (tick <= 0) { tick = 0.16; A().sfx('detect', { pitch: 0.8 + w.alert }); } }
        return w.alert >= 1 || p.x > 3250;
      };
      w.beams.length = 0;
      if (w.alert >= 1) {
        A().sfx('alert'); p.pose('stagger', 20, 'shock'); w.noFight = true;
        bark(caught, caught.id === 'ruckus' ? 'I KNEW I SMELLED A FREELOADER!' : 'SIR. SIR! TICKET!', '#ffe36e');
        yield 1.1; yield* w.fadeOut(0.3);
        w.retry(); return;
      }
      w.alert = 0; w.noFight = false;
      yield* w.fadeOut(0.4);
      for (const g of guards) g.gone = true;
    }, function* (w) {
      w.setBg('theater'); w.music('duel', 0.4); w.place(400, 1); w.noFight = false; w.alert = 0;
      const b = w.foe('manager', 1050, { hp: 230, boss: true, ai: managerAI, prop: 'nunchaku', title: 'SIX YEARS ON THE NIGHT SHIFT', speed: 230, idle: 'stance', block: 0.4 });
      yield* w.fadeIn(0.4);
      if (!w.def.met) {
        w.def.met = true; w.cine(true); w.look(720, 1.4);
        yield* w.say('manager', 'Screen four. Seat nobody-paid-for. I am the Night Manager, and I have waited six years for someone to sneak in on my shift.', 'angry');
        yield* w.say('huey', 'I\'m not here to watch it. I\'m here to get my family OUT. That movie is a crime.', 'deadpan');
        yield* w.say('manager', 'Then you shall be refunded... in PAIN.', 'shout');
        w.cine(false);
      }
      yield* w.duel(b, { banner: 'SHOWTIME!', ko: 'REFUNDED.' });
    }],
    *outro(w) {
      yield* w.fadeOut(0.5);
      w.def.met = false;
      w.setBg('lobby'); w.music('stealth', 0); w.place(420, 1);
      const gd = w.npc('granddad', 540, { face: -1, pose: 'handsHips' }), ri = w.npc('riley', 300, { face: 1, pose: 'lean' }), ru = w.npc('ruckus', 760, { face: -1, pose: 'point', expr: 'grin' });
      w.look(540, 1.35);
      yield* w.fadeIn(0.5);
      yield* w.say('granddad', 'We got kicked out before the plane even took off! I want my money back!', 'shout');
      yield* w.say('huey', 'You didn\'t pay.', 'deadpan');
      yield* w.say('granddad', 'That\'s the PRINCIPLE of the thing!', 'scowl');
      yield* w.say('ruckus', 'And STAY out! That\'s a lifetime ban! ...Well. A ban till Tuesday. Tuesday\'s discount day.', 'grin');
      yield* w.narr('We never did see Soul Jet 2. Critics agree this was the best possible outcome.');
      gd.gone = ri.gone = ru.gone = true;
    },
  });

  M.push({
    id: 'home', ep: 'EPISODE 3B', title: 'HOME ALONE', src: 'inspired by Season 2, Episode 12', bg: 'house', x: 232, y: 150, needs: ['fight'],
    blurb: 'Granddad goes on vacation and leaves Huey in charge. Riley has two airsoft pistols and a grievance.',
    loss: 'Riley: "Say it. Say Young Reezy is the man of the house. I\'ll wait."',
    *intro(w) {
      w.setBg('house', { dark: 0 }); w.music('house', 0.2); w.place(600, 1);
      const gd = w.npc('granddad', 300, { face: 1, pose: 'point' }), ri = w.npc('riley', 780, { face: -1, pose: 'lean' });
      w.look(560, 1.4);
      yield* w.narr('Granddad went on vacation and left me in charge. Of the house. Of the money. Of Riley.');
      w.player.face = -1;
      yield* w.say('granddad', 'Huey, you got the emergency fund. Riley, you got... supervision. Don\'t burn down my house. I just got it how I like it.', 'scowl');
      yield* w.walk(gd, -80, 200, 'walk');
      gd.gone = true; w.player.face = 1;
      yield* w.say('riley', 'I need forty dollars.', 'smirk');
      yield* w.say('huey', 'For what?', 'deadpan');
      yield* w.say('riley', 'Stuff.', 'smirk');
      yield* w.say('huey', 'No.', 'deadpan');
      ri.rig.setPose('point', 14);
      yield* w.say('riley', 'You ain\'t Granddad! You can\'t BUDGET me! This a dictatorship!', 'shout');
      yield* w.say('huey', 'It\'s a household.', 'deadpan');
      yield* w.say('riley', 'Then it\'s a REVOLUTION. You love those.', 'grin');
      yield* w.narr('He had a point. He also had two airsoft pistols and four thousand pellets.');
      yield* w.fadeOut(0.3);
      ri.gone = true;
    },
    phases: [function* (w) {
      w.setBg('house', { dark: 0 }); w.music('house', 0.7); w.place(420, 1);
      const b = w.foe('riley', 1100, { hp: 220, boss: true, ai: rileyAI, prop: 'pistol', vars: { goggles: true }, name: 'Young Reezy', title: '4,000 PELLETS', speed: 300, idle: 'aim', expr: 'smirk', downT: 0.5 });
      yield* w.fadeIn(0.3);
      w.toast('PARRY (L) A PELLET TO SEND IT RIGHT BACK.', 7);
      yield* w.duel(b, { banner: 'REVOLUTION!', ko: 'GROUNDED.' });
    }],
    *outro(w) {
      yield* w.fadeOut(0.5);
      w.setBg('house', { dark: 0 }); w.music('house', 0); w.place(620, 1);
      const ri = w.npc('riley', 760, { face: -1, pose: 'shrug', expr: 'pain' });
      const gd = w.npc('granddad', 60, { face: 1, pose: 'stand', prop: 'belt', idle: 'beltHold' });
      w.look(620, 1.4);
      yield* w.fadeIn(0.5);
      yield* w.say('riley', 'Aight, aight! Truce! You play too much. Those were my GOOD pellets.', 'pain');
      w.player.face = -1; ri.face = -1;
      yield* w.walk(gd, 400, 200, 'walk');
      gd.rig.setPose('beltHold', 10);
      yield* w.say('granddad', 'WHAT. Happened. To my HOUSE?!', 'shock');
      yield* w.say('riley', 'Huey did it.', 'smirk');
      yield* w.say('huey', '...We both did it.', 'deadpan');
      gd.rig.setPose('overW', 10);
      yield* w.say('granddad', 'I was gone ONE day! ONE! I ain\'t even make it to the buffet!', 'shout');
      yield* w.narr('Democracy was restored that evening. By belt.');
      gd.gone = ri.gone = true;
    },
  });

  M.push({
    id: 'strikes', ep: 'EPISODE 4', title: 'STINKMEANER STRIKES BACK', src: 'inspired by Season 2, Episode 4', bg: 'house', x: 324, y: 104, needs: ['theater', 'home'],
    blurb: 'Colonel Stinkmeaner climbs out of Hell, borrows Tom DuBois, and comes looking for the Freemans.',
    loss: 'Stinkmeaner: "Tell the Devil I said hey. He knows me."',
    *intro(w) {
      w.setBg('house', { dark: 1, ghost: 0.3 }); w.music('possessed', 0.2); w.place(700, 1);
      const gd = w.npc('granddad', 860, { face: -1, pose: 'handsHips' }), ri = w.npc('riley', 960, { face: -1, pose: 'lean' });
      w.look(600, 1.35);
      yield* w.narr('Colonel Stinkmeaner arrived in Hell and loved it. He trained there. They say the Devil himself asked him to tone it down.');
      yield* w.narr('Then he came back. He needed a body. He picked the softest one in Woodcrest.');
      const tom = w.npc('tom', -60, { face: 1 });
      w.player.face = -1;
      yield* w.walk(tom, 380, 190, 'walk');
      yield* w.say('tom', 'H-hey, Freemans! Sorry to drop by so late. I just felt this strange chill, and then I... hrk...', 'worry');
      A().sfx('thunder'); A().sfx('ghost'); FX.flash(1); w.st.flash = 1; w.st.ghost = 1; w.relight();
      tom.gone = true;
      const tp = w.npc('tomP', 380, { face: 1, pose: 'cheer', expr: 'shout' });
      yield 0.25; w.st.flash = 0; w.relight();
      yield* w.say('tomP', 'WHAT\'S GOOD, FREEMAN! Stinkmeaner\'s BACK! And this time I got a lawyer\'s cardio!', 'shout', { name: 'Tom?' });
      yield* w.say('granddad', 'Aw, HELL naw. Boys, get behind me. No... get in FRONT of me.', 'shock');
      yield* w.say('riley', 'Tom got HANDS now?!', 'shock');
      yield* w.say('huey', 'That\'s not Tom. Just don\'t hurt him too badly. It\'s still Tom\'s body.', 'deadpan');
      yield* w.say('granddad', 'Hurt him a MEDIUM amount.', 'scowl');
      yield* w.fadeOut(0.3);
      gd.gone = ri.gone = tp.gone = true;
    },
    phases: [function* (w) {
      w.setBg('house', { dark: 1, ghost: 1 }); w.music('possessed', 0.8); w.place(760, -1);
      const b = w.foe('tomP', 360, { hp: 340, boss: true, ai: tomAI, name: 'Stinkmeaner', title: 'RENTING TOM DUBOIS', speed: 230, idle: 'stance', brk: 70 });
      sub(w, (function* () { for (;;) { yield U.rand(5, 9); A().sfx('thunder', { vol: 0.7 }); w.st.flash = 1; yield 0.12; w.st.flash = 0; } })());
      yield* w.fadeIn(0.3);
      yield* w.duel(b, { banner: 'EXORCISE!', ko: 'EVICTED.' });
      w.st.flash = 0;
    }],
    *outro(w) {
      yield* w.fadeOut(0.5);
      w.setBg('house', { dark: 1, ghost: 0.6 }); w.music('possessed', 0); w.place(760, -1);
      const tp = w.npc('tomP', 520, { face: 1, pose: 'cower', expr: 'angry' }), gd = w.npc('granddad', 900, { face: -1, pose: 'handsHips' });
      const ru = w.npc('ruckus', 250, { face: 1, expr: 'grin' });
      w.look(560, 1.4);
      yield* w.fadeIn(0.5);
      yield* w.narr('You can\'t beat the hate out of a man. We tried. For about forty minutes.');
      tp.face = -1;
      yield* w.say('ruckus', 'Hold on now. This here demon don\'t like NOBODY? ...Sir, I been waitin\' my whole life to meet you.', 'grin');
      yield* w.say('tomP', 'You hate everybody too? Even the...', 'shock', { name: 'Stinkmeaner' });
      yield* w.say('ruckus', 'ESPECIALLY them.', 'grin');
      tp.rig.setPose('cheer', 10);
      yield* w.narr('Stinkmeaner and Uncle Ruckus found common ground. And the moment a spirit of pure hate makes a friend, it has nothing left to hold onto.');
      A().sfx('ghost'); FX.flash(0.9, '#b6ff8a'); w.st.ghost = 0; w.st.dark = 0; w.relight();
      tp.gone = true;
      const tom = w.npc('tom', 520, { face: 1, pose: 'stagger', expr: 'worry' });
      yield* w.say('tom', '...Why am I in your living room? Why does my everything hurt?', 'worry');
      yield* w.say('granddad', 'You fell. Go home, Tom.', 'deadpan');
      tom.gone = gd.gone = ru.gone = true;
    },
  });

  M.push({
    id: 'hate', ep: 'EPISODE 5', title: 'THE HATEOCRACY', src: 'inspired by Season 3, Episode 13', bg: 'street', x: 414, y: 104, needs: ['strikes'],
    blurb: 'Stinkmeaner\'s old crew of elderly menaces shows up on Timid Deer Lane, in the rain, with opinions.',
    loss: 'Crabmiser: "In my day, children got whooped AND said thank you."',
    *intro(w) {
      w.setBg('street', {}); w.music('finale', 0.1); w.place(700, 1);
      const c = CREW.map((x, i) => w.npc(x.id, 1100 + i * 130, { face: -1, prop: 'umbrella', pose: 'hold' }));
      const gd = w.npc('granddad', 420, { face: 1, pose: 'handsHips' });
      w.look(1000, 1.2);
      yield* w.narr('Hate has friends. I didn\'t know that. Colonel Stinkmeaner used to run with a crew of elderly menaces, bonded by a love of ruining everybody\'s day.');
      yield* w.narr('They called themselves the Hateocracy. And they had just heard what happened to their friend.');
      yield* w.say('crab', 'Lord Rufus Crabmiser. I got traps older than you, boy.', 'scowl');
      yield* w.say('gripe', 'Lady Esmeralda Gripenasty. I\'ve been kicking since before your granddaddy could walk. And I kicked HIM, too.', 'scowl');
      yield* w.say('pist', 'Mr. George Pistofferson. I don\'t have a speech. I just hit things.', 'scowl');
      w.look(560, 1.35); w.player.face = -1;
      yield* w.say('granddad', 'Huey! I hired a bodyguard, but he wanted BENEFITS! You gon\' have to handle this!', 'shout');
      w.player.face = 1;
      yield* w.say('huey', 'Three senior citizens. In the rain. ...This is going to look terrible no matter how it ends.', 'deadpan');
      yield* w.fadeOut(0.3);
      for (const f of c) f.gone = true; gd.gone = true;
    },
    phases: [hatePhase(0), hatePhase(1), hatePhase(2)],
    *outro(w) {
      yield* w.fadeOut(0.5);
      w.setBg('street', {}); w.music('credits', 0.3); w.place(700, 1);
      const gd = w.npc('granddad', 840, { face: -1, pose: 'handsHips' }), ri = w.npc('riley', 560, { face: 1, pose: 'lean' });
      w.look(700, 1.4);
      yield* w.fadeIn(0.6);
      yield* w.narr('They didn\'t want revenge. They never even liked Stinkmeaner. They just wanted somebody to hate, and we were nearby.');
      yield* w.say('granddad', 'So I didn\'t have to fight nobody? I could\'ve just called the police on three old people standing in my yard?', 'shock');
      yield* w.say('huey', 'That was always an option.', 'deadpan');
      yield* w.say('granddad', 'Why didn\'t you SAY something?!', 'shout');
      yield* w.say('huey', 'I did. Twice.', 'deadpan');
      yield* w.say('riley', 'Yo, can we keep the crab trap?', 'grin');
      yield* w.narr('The thing about hate is, it\'s lazy. It never builds anything. It just shows up at your house and waits for you to open the door.');
      yield* w.narr('So that was our year. A riot that didn\'t happen, a movie we didn\'t see, a neighbor we beat up for his own good. Woodcrest is peaceful again.');
      yield* w.narr('I give it a week.');
      yield* w.fadeOut(1.2);
      gd.gone = ri.gone = true;
      const lines = ['THE WOODCREST FILES', '', 'an unofficial, non-commercial fan game', 'made out of love for The Boondocks,', 'created by Aaron McGruder', '', 'every sprite, backdrop, beat and line of dialogue', 'in this game was made from scratch', '', 'thank you for playing', '', '"I give it a week."'];
      let t = 0;
      w.overlay = (g) => {
        g.fillStyle = '#07060a'; g.fillRect(0, 0, BD.FBW, BD.FBH);
        lines.forEach((l, i) => { const y = BD.FBH + 10 - t * 16 + i * 16; if (y > -10 && y < BD.FBH) BD.Text.draw(g, l, BD.FBW / 2, y, { align: 'center', color: i === 0 ? '#ffe36e' : '#f1e6d2', scale: i === 0 ? 2 : 1 }); });
      };
      yield (dt) => (t += dt) > 30 || (t > 2 && BD.Input.take('confirm'));
    },
  });

  /* ------------------------------------------------------------ storyline */
  // Nine episodes in broadcast order. Two threads, life in Woodcrest and the Stinkmeaner saga, meet in the finale.
  const stub = (id, title, src, bg, blurb) => ({ id, title, src, bg, blurb, phases: [function* (w) {
    w.setBg(bg); w.place(400, 1); yield* w.fadeIn(0.3); w.cine(true); yield* w.narr('This case file is still being written.'); w.cine(false);
  }] });
  M.push(stub('dinner', 'GUESS HOE\'S COMING TO DINNER', 'inspired by Season 1, Episode 3', 'house', 'Granddad has a new girlfriend half his age. The boys know exactly who to call: A Pimp Named Slickback.'));
  M.push(stub('inspector', 'A DATE WITH THE HEALTH INSPECTOR', 'inspired by Season 1, Episode 5', 'street', 'Tom is arrested for a murder he is far too nervous to commit. Ed Wuncler III and Gin Rummy offer to help. Nobody should let them.'));
  M.push(stub('itis', 'THE ITIS', 'inspired by Season 1, Episode 10', 'house', 'Granddad opens a soul food restaurant with Ed Wuncler\'s money. The food is delicious. The neighborhood never wakes up from it.'));
  const GRAPH = {
    garden: [1, 44, 104, []], dinner: [2, 120, 58, ['garden']], fight: [3, 120, 150, ['garden']], inspector: [4, 196, 58, ['dinner']], itis: [5, 272, 58, ['inspector']],
    theater: [6, 348, 58, ['itis']], strikes: [7, 272, 150, ['fight', 'itis']], home: [8, 348, 150, ['itis']], hate: [9, 424, 104, ['theater', 'strikes', 'home']],
  };
  for (const m of M) { const g = GRAPH[m.id]; m.ep = 'EPISODE ' + g[0]; m.x = g[1]; m.y = g[2]; m.needs = g[3]; }
  M.sort((a, b) => GRAPH[a.id][0] - GRAPH[b.id][0]);
})();
