/* game.js — fighters, combat rules, the mission world (camera, HUD, dialogue, scripting helpers) */
(() => {
  'use strict';
  const BD = window.BD, U = BD.U, cam = BD.cam, In = BD.Input, FX = BD.FX, T = BD.Text, Px = BD.Px;
  const A = () => BD.Audio;
  const G = 2400, RUN = 340, JUMP = 1040, DASH_V = 980, DASH_T = 0.2, PARRY = 0.17;
  const FW = BD.FBW, FH = BD.FBH;
  const QKEYS = ['light', 'heavy', 'guard', 'jump', 'dash'], QNAME = { light: 'J', heavy: 'K', guard: 'L', jump: 'SPACE', dash: 'SHIFT' };

  /* ------------------------------------------------------------ Huey's moves */
  // reach: world units in front of the body; h: [top, bottom] relative to the feet (up is negative)
  const ATK = (BD.ATK = {
    jab:   { poses: ['jabW', 'jab'], wind: 0.05, act: 0.08, rec: 0.13, dmg: 5, reach: 82, h: [-110, -30], kb: 150, lunge: 130, stop: 0.04, sfx: 'whoosh', hs: 'hit_light', chain: 'cross' },
    cross: { poses: ['crossW', 'cross'], wind: 0.06, act: 0.08, rec: 0.15, dmg: 6, reach: 88, h: [-110, -30], kb: 190, lunge: 160, stop: 0.05, sfx: 'whoosh', hs: 'hit_light', chain: 'spin' },
    spin:  { poses: ['spinW', 'spinKick'], wind: 0.11, act: 0.1, rec: 0.26, dmg: 11, reach: 106, h: [-120, -20], kb: 540, lunge: 210, stop: 0.09, sfx: 'whoosh_heavy', hs: 'hit_heavy', down: true, arc: [-1.0, 0.9, 70] },
    side:  { poses: ['kickW', 'sideKick'], wind: 0.14, act: 0.1, rec: 0.3, dmg: 13, reach: 112, h: [-110, -14], kb: 640, lunge: 270, stop: 0.1, sfx: 'whoosh_heavy', hs: 'hit_heavy', down: true, heavy: true, arc: [-0.7, 0.6, 78] },
    rise:  { poses: ['kickW', 'riseKick'], wind: 0.1, act: 0.12, rec: 0.3, dmg: 10, reach: 84, h: [-190, -30], kb: 110, ky: -860, lunge: 60, stop: 0.09, sfx: 'whoosh_heavy', hs: 'hit_heavy', launch: true, heavy: true, arc: [0.9, -1.3, 84] },
    airK:  { poses: ['airKick', 'airKick'], wind: 0.04, act: 0.3, rec: 0.1, dmg: 9, reach: 96, h: [-100, 16], kb: 400, stop: 0.07, sfx: 'whoosh', hs: 'hit_heavy', down: true, air: true },
    dive:  { poses: ['diveKick', 'diveKick'], wind: 0.05, act: 0.6, rec: 0.12, dmg: 12, reach: 84, h: [-80, 30], kb: 440, stop: 0.09, sfx: 'whoosh_heavy', hs: 'hit_heavy', down: true, heavy: true, air: true, diveV: [540, 780] },
    sweep: { poses: ['sweep', 'sweep'], wind: 0.03, act: 0.18, rec: 0.22, dmg: 9, reach: 104, h: [-56, 4], kb: 320, stop: 0.07, sfx: 'whoosh', hs: 'hit_heavy', down: true },
  });

  /* --------------------------------------------------------------- fighter */
  class Fighter {
    constructor(w, id, x, o) {
      o = o || {};
      this.w = w; this.id = id; this.def = BD.CAST[id];
      this.rig = new BD.Rig(id, { variant: o.variant || 0, vars: o.vars, prop: o.prop });
      this.rig.setLight(w.light);
      this.kid = (this.def.build || 'adult') === 'kid';
      this.hh = (this.kid ? 122 : 198) * (this.def.scale || 1); this.hw = this.kid ? 20 : 28;
      this.x = x; this.y = o.y || 0; this.vx = 0; this.vy = 0; this.face = o.face || 1; this.onG = true;
      this.team = o.team || 'foe'; this.max = this.hp = o.hp || 30;
      this.state = 'idle'; this.st = 0; this.stun = 0; this.downT = o.downT || 0.7;
      this.atk = null; this.done = []; this.struck = false; this.connected = false; this.queue = null;
      this.inv = 0; this.flash = 0; this.armor0 = !!o.armor; this.armor = this.armor0; this.brk = 0; this.brkMax = o.brk || 0;
      this.blockP = o.block || 0; this.blockT = 0;
      this.speed = o.speed || 150; this.idlePose = o.idle || this.def.idle || 'stand'; this.walk = o.walk || 'walk';
      this.expr0 = o.expr || this.def.expr || 'neutral'; this.rig.expr = this.expr0;
      this.alpha = 1; this.dead = false; this.gone = false; this.tint = null;
      this.focus = 0; this.guardT = 0; this.dashCd = 0; this.dropT = 0; this.drive = false;
      this.boss = !!o.boss; this.name = o.name || this.def.name; this.title = o.title || '';
      this.brainFn = o.ai || null; this.brain = null; this.data = o.data || {};
      this.shadow = o.shadow !== false; this.hidden = false; this.z = o.z || 0;
      if (o.pose) { this.state = 'act'; this.rig.snap(o.pose); }
    }
    set(s) { if (this.atk && this.atk.armor) this.armor = this.armor0; this.state = s; this.st = 0; if (s !== 'atk') this.atk = null; }
    target() { return this.w.player; }
    dx() { return this.target().x - this.x; }
    dist() { return Math.abs(this.dx()); }
    faceT() { this.face = this.dx() >= 0 ? 1 : -1; }
    pose(name, rate, expr) { this.state = 'act'; this.rig.setPose(name, rate || 12); if (expr) this.rig.expr = expr; }
    attack(a) {
      this.set('atk'); this.atk = a; this.done.length = 0; this.struck = false; this.connected = false; this.queue = null;
      this.rig.setPose(a.poses[0], a.windRate || 30);
      if (a.armor) this.armor = true;
      if (A().voice && a.dmg && (this.team === 'hero' ? a.heavy || a.down : this.boss)) A().voice(this.id, 'effort');
      if (a.tell) { // enemy telegraph: a glint + a sound so you can react
        FX.stars.push({ x: this.x + this.face * 10, y: this.y - this.hh - 26, life: 0.16, max: 0.16, size: a.unblock ? 7 : 5 });
        A().sfx(a.unblock ? 'alert' : 'detect', { vol: 0.6, pitch: a.unblock ? 1 : 1.5 });
        this.tellC = a.unblock ? '#ff3b3b' : '#ffe36e'; this.tellT = a.wind;
      }
    }
    updAtk() {
      const a = this.atk, t = this.st;
      if (t >= a.wind && !this.struck) {
        this.struck = true;
        this.rig.setPose(a.poses[1], 46);
        if (a.lunge) { this.vx = this.face * a.lunge * (this.onG ? 1 : 0.4); }
        if (a.diveV) { this.vx = this.face * a.diveV[0]; this.vy = a.diveV[1]; }
        if (a.sfx) A().sfx(a.sfx);
        if (a.arc) FX.arc(this.x + this.face * 20, this.y - this.hh * (a.arcY || 0.5), a.arc[2] * (this.kid ? 1 : 1.5), a.arc[0], a.arc[1], this.face, a.arcC);
        if (a.fire) a.fire(this, this.w);
        this.rig.expr = this.team === 'hero' || this.boss ? 'shout' : 'angry';
      }
      if (a.rush && t >= a.wind && t < a.wind + a.act) { this.vx = this.face * a.rush; this.drive = true; }
      if (t >= a.wind && t < a.wind + a.act && a.dmg) this.w.resolve(this, a);
      if (a.air && this.onG && t > a.wind) { this.set('idle'); return; }
      if (a.diveV && t > a.wind && !this.onG) this.drive = true;
      if (t >= a.wind + a.act + a.rec) this.set(this.onG ? 'idle' : 'air');
    }
    phys(dt) {
      const w = this.w, was = this.onG, py = this.y, pvy = this.vy;
      if (!was) this.vy += G * dt;
      this.x += this.vx * dt; this.y += this.vy * dt;
      this.onG = false;
      this.dropT -= dt;
      if (this.vy >= 0 && this.dropT <= 0) {
        for (const p of w.bg.platforms) if (this.x >= p.x1 && this.x <= p.x2 && py <= p.y + 1 && this.y >= p.y) { this.y = p.y; this.onG = true; }
      }
      if (this.y >= 0) { this.y = 0; this.onG = true; }
      if (this.onG) {
        if (!was && pvy > 320) { FX.dust(this.x, this.y, 4, w.dustCol); A().sfx('land', { vol: 0.5 }); this.rig.squash(1.14, 0.86); }
        this.vy = 0;
        if (!this.drive) this.vx = U.damp(this.vx, 0, this.state === 'launch' || this.state === 'down' ? 5 : 13, dt);
      }
      this.drive = false;
      if (this.team !== 'npc') { // story characters may walk off-screen; fighters stay in the arena
        if (this.x < w.minX) { this.x = w.minX; if (this.state === 'launch') this.vx *= -0.4; }
        if (this.x > w.maxX) { this.x = w.maxX; if (this.state === 'launch') this.vx *= -0.4; }
      }
    }
    update(dt) {
      this.st += dt;
      this.inv = Math.max(0, this.inv - dt); this.flash = Math.max(0, this.flash - dt); this.dashCd -= dt; this.blockT -= dt;
      if (this.tellT > 0) this.tellT -= dt;
      if (this.chainT > 0) this.chainT -= dt;
      const s = this.state;
      if (s === 'atk') this.updAtk();
      else if ((s === 'hurt' || s === 'stagger') && this.st > this.stun) this.set('idle');
      else if (s === 'launch') { if (this.onG && this.st > 0.12) { this.set('down'); A().sfx('thud', { vol: 0.7 }); FX.dust(this.x, this.y, 6, this.w.dustCol); cam.shake(0.12); } }
      else if (s === 'down') {
        if (this.dead) { if (!this.boss && this.team !== 'hero' && this.st > 0.7) { this.alpha -= dt * 2.4; if (this.alpha <= 0) this.gone = true; } }
        else if (this.st > this.downT) { this.set('getup'); this.inv = Math.max(this.inv, 0.5); }
      } else if (s === 'getup' && this.st > 0.3) this.set('idle');
      else if (s === 'dash') { this.drive = true; if (this.st > DASH_T) { this.vx *= 0.25; this.set(this.onG ? 'idle' : 'air'); } }
      this.phys(dt);
      this.anim();
      this.rig.grounded = this.onG;
      this.rig.update(dt, this.vx, this.vy);
      if (this.rig.prop === 'nunchaku' || this.rig.prop === 'trap') this.rig.spin += dt * (this.state === 'atk' ? 26 : 5);
    }
    anim() {
      const r = this.rig, s = this.state, hero = this.team === 'hero';
      if (s === 'act') return;
      let ex = this.expr0;
      if (s === 'atk') ex = r.expr;
      else if (s === 'hurt' || s === 'launch' || s === 'down') ex = 'pain';
      else if (s === 'stagger') ex = 'shock';
      r.expr = ex;
      if (s === 'atk') return;
      const mv = Math.abs(this.vx);
      if (s === 'idle' || s === 'move') {
        if (this.blockT > 0) r.setPose('guard', 30);
        else if (mv > 30 && this.onG) r.setCycle(hero || mv > 230 ? 'run' : this.walk, hero ? mv / 26 : mv > 230 ? mv / 30 : mv / 15);
        else r.setPose(hero ? (this.w.fighting ? 'stance' : 'stand') : this.idlePose, 12);
      } else if (s === 'air') r.setPose(this.vy < 0 ? 'jump' : 'fall', 14);
      else if (s === 'crouch') { if (mv > 20) r.setCycle('sneak', mv / 13); else r.setPose('crouch', 16); }
      else if (s === 'guard') r.setPose(this.guardT < PARRY ? 'parry' : 'guard', 30);
      else if (s === 'hurt') r.setPose(this.gut ? 'hurtGut' : 'hurt', 40);
      else if (s === 'stagger') r.setPose('stagger', 20);
      else if (s === 'launch') r.setPose('launch', 22);
      else if (s === 'down') r.setPose('down', 24);
      else if (s === 'getup') r.setPose('getup', 18);
      else if (s === 'dash') r.setPose('dash', 40);
    }
    think(dt) {
      if (!this.brainFn || this.dead) return;
      const s = this.state;
      if (s === 'hurt' || s === 'launch' || s === 'down' || s === 'getup' || s === 'stagger') {
        if (this.brain) { this.brain = null; this.armor = this.armor0; this.w.untoken(this); if (!this.dead) this.alpha = 1; }
        return;
      }
      if (!this.brain) this.brain = new BD.Co(this.brainFn(this, this.w));
      if (this.brain.update(dt)) this.brain = null;
    }
    /* --- little behaviours for AI scripts (generators) --- */
    *idleFor(t) { if (this.state !== 'idle') this.set('idle'); yield t; }
    *approach(range, maxT, speed) {
      let t = 0;
      while (this.dist() > range && t < (maxT || 3)) {
        this.faceT(); this.state = 'move'; this.vx = this.face * (speed || this.speed); this.drive = true;
        yield; t += this.w.dt;
      }
      this.state = 'idle';
    }
    *backOff(d, speed) {
      const x0 = this.x; let t = 0;
      while (Math.abs(this.x - x0) < d && t < 1.2) {
        this.faceT(); this.state = 'move'; this.vx = -this.face * (speed || this.speed); this.drive = true;
        yield; t += this.w.dt;
      }
      this.state = 'idle';
    }
    *strike(a, noTurn) { if (!noTurn) this.faceT(); this.attack(a); yield () => this.state !== 'atk'; }
    *hop(vx, vy, pose) {
      this.set('air'); this.vx = vx; this.vy = vy; this.y -= 2; this.onG = false;
      if (pose) { this.state = 'act'; this.rig.setPose(pose, 20); }
      A().sfx('jump', { vol: 0.5 });
      yield () => this.onG;
      this.set('idle');
    }
    *runTo(x, speed, cycle) {
      let t = 0;
      while (Math.abs(this.x - x) > 14 && t < 5) {
        this.face = x > this.x ? 1 : -1; this.state = 'move'; this.vx = this.face * (speed || this.speed); this.drive = true;
        yield; t += this.w.dt;
      }
      this.state = 'idle';
    }
    draw(g) {
      if (this.hidden) return;
      const o = this._o || (this._o = {});
      o.flash = this.flash > 0 ? 1 : 0; o.alpha = this.alpha < 1 ? Math.max(0, this.alpha) : undefined; o.tint = this.tint; o.rimDir = this.w.rimDir;
      cam.push(g, 1);
      this.rig.draw(g, this.x, this.y, this.face, o);
      cam.pop(g);
    }
  }
  BD.Fighter = Fighter;

  /* ------------------------------------------------------ player controls */
  function control(f, dt) {
    const w = f.w;
    if (w.cineOn || w.lock || f.dead || f.state === 'act' || w.over) return;
    const ax = In.axisX(), s = f.state, fight = !w.noFight;
    if (s === 'atk') {
      const a = f.atk;
      if (a.chain && In.peek('light', 0.3) && f.st > a.wind * 0.5) f.queue = a.chain;
      if (f.queue && f.st >= a.wind + a.act + a.rec * 0.3) { In.take('light', 1); const n = f.queue; if (ax) f.face = ax; f.attack(ATK[n]); return; }
      if (f.connected && In.take('dash')) dash(f, ax || f.face);
      return;
    }
    if (s === 'dash') { if (fight && f.onG && In.take('light')) { f.attack(ATK.sweep); f.vx = f.face * 620; } return; }
    if (s !== 'idle' && s !== 'move' && s !== 'air' && s !== 'crouch' && s !== 'guard') return;
    if (In.take('dash') && f.dashCd <= 0) { dash(f, ax || f.face); return; }
    if (fight && f.onG && In.held('guard')) {
      if (s !== 'guard') { f.set('guard'); f.guardT = 0; }
      f.guardT += dt; if (ax) f.face = ax;
      return;
    }
    if (s === 'guard') f.set('idle');
    if (fight) {
      if (In.take('special') && f.focus >= 100) { w.special(); return; }
      if (In.take('light')) { f.attack(f.onG ? ATK.jab : ATK.airK); return; }
      if (In.take('heavy')) { f.attack(!f.onG ? ATK.dive : In.held('down') ? ATK.rise : ATK.side); return; }
    }
    if (In.take('jump') && f.onG) {
      if (In.held('down') && f.y < 0) { f.dropT = 0.25; f.y += 3; f.onG = false; }
      else { f.vy = -JUMP; f.y -= 2; f.onG = false; A().sfx('jump', { vol: 0.6 }); f.rig.squash(0.86, 1.16); FX.dust(f.x, f.y, 3, w.dustCol); }
    }
    const crouch = f.onG && In.held('down');
    const sp = crouch ? 160 : RUN;
    if (ax) { f.face = ax; f.vx = U.damp(f.vx, ax * sp, f.onG ? 20 : 9, dt); f.drive = true; }
    else if (!f.onG) { f.vx = U.damp(f.vx, 0, 2, dt); }
    f.state = !f.onG ? 'air' : crouch ? 'crouch' : ax ? 'move' : 'idle';
    if (f.onG && ax && !crouch) { f.stepT = (f.stepT || 0) - dt; if (f.stepT <= 0) { f.stepT = 0.21; A().sfx('step', { vol: 0.35 }); } }
  }
  function dash(f, dir) {
    f.set('dash'); f.face = dir; f.vx = dir * DASH_V; f.inv = Math.max(f.inv, 0.24); f.dashCd = 0.42; f.vy = Math.min(f.vy, 0) * 0.3;
    A().sfx('dash'); FX.dust(f.x, f.y, 4, f.w.dustCol); f.w.ghostT = 0;
  }

  /* ----------------------------------------------------------------- world */
  const faces = {};
  /** small cached portrait tile for the HUD */
  function faceTile(id, r, w, h, expr) {
    const k = id + r + expr;
    if (!faces[k]) {
      const [c, g] = U.canvas(w, h, 1, true);
      g.fillStyle = U.shade(BD.CAST[id].color, -0.35); g.fillRect(0, 0, w, h);
      BD.Portrait.draw(g, id, w / 2 - 1, h * 0.6, r, 1, expr || null, 0, 0);
      faces[k] = c;
    }
    return faces[k];
  }
  BD.faceTile = faceTile;

  class World {
    constructor(def) {
      this.def = def; this.t = 0; this.dt = 0; this.rdt = 0;
      this.st = { t: 0 };
      this.fighters = []; this.shots = []; this.subs = []; this.tokens = [];
      this.zoom = 1.35; this.camLock = null; this.boss = null; this.fighting = false; this.noFight = false;
      this.cineOn = false; this.letter = 0; this.fade = 1; this.fadeTo = 0; this.skip = false;
      this.dlg = null; this.toastS = null; this.toastT = 0; this.card = null; this.banner = null;
      this.stats = { time: 0, dmg: 0, combo: 0, parries: 0, retries: 0 };
      this.combo = 0; this.comboT = 0; this.hpGhost = 1; this.bossGhost = 1; this.over = null; this.overT = 0;
      this.ghostT = 0; this.slash = null; this.phase = 0; this.beams = []; this.alert = 0; this.done = false;
      this.dustCol = '#d9cfbb'; this.rimDir = -1; this.marks = [];
      this.obj = null; this.objN = 0; this.mark = null; this.items = []; this.bubbles = []; this.pick = null; this.qteS = null; this.clock = null; this.lock = false; this.failMsg = null; this.noHud = !!def.hub; this.flags = {}; this.pins = [];
      this.setBg(def.bg);
      this.player = new Fighter(this, 'huey', 200, { team: 'hero', hp: 100 });
      this.fighters.push(this.player);
      FX.clear();
      this.co = new BD.Co(this.run(0, true));
    }
    setBg(name, st) {
      if (!BD.Backgrounds[name]) { console.warn('missing backdrop "' + name + '", using the street'); name = 'street'; }
      this.bgName = name; this.bg = BD.Backgrounds[name]; this.bg.init();
      if (st) Object.assign(this.st, st);
      this.minX = 40; this.maxX = this.bg.width - 40;
      this.relight();
      this.dustCol = name === 'ink' ? '#3a3430' : name === 'street' ? '#9fb4d0' : '#d9cfbb';
    }
    relight() {
      this.light = this.bg.lightFor ? this.bg.lightFor(this.st) : this.bg.light;
      for (const f of this.fighters) f.rig.setLight(this.light);
    }
    /* ------------------------------------------------- mission flow */
    *run(from, first) {
      const d = this.def;
      if (first) {
        if (!d.noCard) yield* this.titleCard();
        if (d.intro) { this.cine(true); yield* d.intro(this); this.cine(false); }
      }
      for (this.phase = from; this.phase < d.phases.length; this.phase++) { this.clearStage(); yield* d.phases[this.phase](this); }
      this.cine(true);
      if (d.outro) yield* d.outro(this);
      yield* this.fadeOut(0.6);
      this.done = true;
    }
    /** every phase starts on an empty stage: no leftover characters, side scripts, markers or objectives */
    clearStage() {
      for (const f of this.fighters) if (f !== this.player) f.gone = true;
      this.fighters = [this.player]; this.shots.length = 0; this.subs.length = 0; this.tokens.length = 0;
      this.boss = null; this.beams.length = 0; this.marks.length = 0; this.items = []; this.bubbles = []; this.pins = [];
      this.mark = null; this.obj = null; this.objN = 0; this.clock = null; this.lock = false; this.qteS = null; this.pick = null;
      this.alert = 0; this.noFight = false; this.camLock = null; this.slash = null;
      BD.timeScale = 1; FX.dark = 0;
      if (this.player.state === 'act' && !this.cineOn) this.player.set('idle');
    }
    retry() {
      this.stats.retries++;
      for (const f of this.fighters) if (f !== this.player) f.gone = true;
      this.fighters = [this.player]; this.shots.length = 0; this.subs.length = 0; this.tokens.length = 0;
      this.boss = null; this.over = null; this.dlg = null; this.banner = null; this.beams.length = 0; this.alert = 0; this.marks.length = 0;
      this.obj = null; this.objN = 0; this.mark = null; this.items = []; this.bubbles = []; this.pick = null; this.qteS = null; this.clock = null; this.lock = false; this.failMsg = null; this.overlay = null;
      const p = this.player; p.hp = p.max; p.dead = false; p.set('idle'); p.inv = 1; p.alpha = 1; p.vx = p.vy = 0; p.y = 0; p.focus = Math.min(p.focus, 50);
      BD.timeScale = 1; FX.clear(); this.fade = 1; this.fadeTo = 0; this.cineOn = false; this.camLock = null; this.noFight = false;
      this.co = new BD.Co(this.run(this.phase, false));
    }
    cine(on) {
      this.cineOn = on; this.skip = false;
      const p = this.player;
      if (on) { p.vx = 0; p.set('act'); p.rig.setPose('stand', 10); p.rig.expr = p.expr0; }
      else { p.set('idle'); this.camLock = null; this.dlg = null; }
    }
    *wait(t) { if (!this.skip) yield t; }
    *titleCard() {
      const d = this.def;
      this.card = { t: 0, ep: d.ep, title: d.title, src: d.src };
      A().music(null, { fade: 0.4 });
      yield 0.5; A().sting('card');
      let t = 0; yield (dt) => (t += dt) > 2.6 || (t > 0.8 && In.take('confirm'));
      this.card = null; this.fade = 1; this.fadeTo = 0;
    }
    *fadeOut(t) { this.fadeTo = 1; this.fadeRate = 1 / (t || 0.4); yield () => this.fade >= 0.99; }
    *fadeIn(t) { this.fadeTo = 0; this.fadeRate = 1 / (t || 0.4); yield () => this.fade <= 0.01; }
    /** dialogue line. who = cast id, or null for Huey's voice-over */
    *say(who, text, expr, opts) {
      if (this.skip) return;
      text = BD.slang(text);
      const d = (this.dlg = { who, text, n: 0, expr: expr || null, lines: T.wrap(text, who ? 56 : 66), opts: opts || {}, t: 0 });
      const voice = who ? BD.CAST[who].voice : 1.1;
      let blip = 0;
      const spoken = A().speak ? A().speak(who || 'huey', text, false, !who) : false;
      In.take('confirm', 1);
      yield (dt) => {
        d.t += dt;
        if (d.n < text.length) {
          const ch = text[d.n | 0];
          d.n = Math.min(text.length, d.n + dt * (ch === ',' || ch === '.' || ch === '!' || ch === '?' ? 14 : 46));
          blip -= dt; if (blip <= 0 && ch !== ' ' && !spoken) { blip = 0.05; A().blip(voice); }
          if (In.take('confirm')) d.n = text.length;
          return false;
        }
        return this.skip || In.take('confirm');
      };
      A().sfx('ui_move', { vol: 0.4 });
      if (A().shush) A().shush();
      this.dlg = null;
    }
    *narr(text) { yield* this.say(null, text); }
    npc(id, x, o) {
      const f = new Fighter(this, id, x, Object.assign({ team: 'npc', pose: (o && o.pose) || BD.CAST[id].idle || 'stand' }, o));
      this.fighters.push(f);
      return f;
    }
    foe(id, x, o) { const f = new Fighter(this, id, x, o); f.faceT(); this.fighters.push(f); return f; }
    *walk(f, x, speed, cycle) {
      if (this.skip) { f.x = x; return; }
      const dir = x > f.x ? 1 : -1; f.face = dir; f.state = 'act';
      f.rig.setCycle(cycle || 'walk', (speed || 120) / (cycle === 'run' ? 26 : 15));
      yield (dt) => { f.x += dir * (speed || 120) * dt; return (x - f.x) * dir <= 0 || this.skip; };
      f.x = x; f.rig.setPose(f.idlePose, 10);
    }
    look(x, zoom, y) { this.camLock = x === null ? null : { x, zoom: zoom || 1.5, y: y || 0 }; }
    toast(s, t) { this.toastS = s; this.toastT = t || 3.5; }
    music(name, intensity) { A().music(name); A().intensity(intensity === undefined ? 0.3 : intensity); }
    place(x, face) { const p = this.player; p.x = x; p.y = 0; p.vx = p.vy = 0; if (face) p.face = face; cam.x = x; }
    /** spawn a wave and wait until they are all down */
    *wave(list) {
      this.fighting = true;
      const fs = list.map((s) => this.foe(s.id, s.x, s));
      yield () => fs.every((f) => f.dead);
      yield 0.5;
      this.fighting = false;
    }
    /** boss duel: intro banner, wait for the KO, slow-motion finish */
    *duel(f, o) {
      o = o || {};
      this.boss = f; this.bossGhost = 1; this.fighting = true;
      A().intensity(1);
      this.banner = { s: o.banner || 'HANDLE IT.', t: 0, life: 1.3 }; A().sfx('bell');
      yield () => f.dead;
      this.tokens.length = 0;
      for (const s of this.shots) s.life = 0;
      for (const x of this.fighters) if (x.team === 'foe' && x !== f && !x.dead) { x.hp = 0; x.dead = true; x.set('launch'); x.vy = -300; x.onG = false; }
      BD.timeScale = 0.22; A().sfx('hit_final'); A().duck(0.8, 2); FX.flash(0.9); cam.shake(1);
      this.banner = { s: o.ko || 'WHOOPED.', t: 0, life: 2.2, big: true };
      let t = 0; yield () => (t += this.rdt) > 1.5;
      BD.timeScale = 1; A().intensity(0.2);
      yield 0.9;
      this.fighting = false; this.boss = null;
    }
    /* ------------------------------------------- errands & story beats */
    /* Everything here auto-completes when BD.AUTOPLAY is set (headless tests). */
    objective(s) { this.obj = s || null; this.objN = 0; }
    /** speech bubble over a character; the action keeps going */
    bubble(f, text, dur) {
      text = BD.slang(text);
      this.bubbles = this.bubbles.filter((b) => b.f !== f);
      this.bubbles.push({ f, lines: T.wrap(text, 26), t: dur || Math.max(2.2, text.length * 0.07) });
      if (A().speak) A().speak(f.id, text, true);
    }
    /** objective: walk to a spot. o: { r: radius, y: platform height } */
    *goTo(x, label, o) {
      o = o || {};
      const p = this.player;
      this.objective(label); this.mark = { x, y: (o.y || 0) - 40 };
      if (BD.AUTOPLAY) { p.x = x; p.y = o.y || 0; p.vy = 0; }
      yield () => Math.abs(p.x - x) < (o.r || 70) && (o.y === undefined || Math.abs(p.y - o.y) < 50);
      this.mark = null; this.objective(null); A().sfx('ui_select', { vol: 0.5 });
    }
    /** objective: walk up to a character (or an x position) and press the talk key (E / Enter) */
    *interact(target, label, prompt) {
      const isX = typeof target === 'number', tx = () => (isX ? target : target.x), p = this.player;
      this.objective(label);
      In.take('talk', 1);
      yield () => {
        if (BD.AUTOPLAY) { p.x = tx() - 70; p.y = 0; }
        const near = Math.abs(p.x - tx()) < 120 && p.onG && !this.dlg;
        this.mark = { x: tx(), y: isX ? -40 : target.y - target.hh - 34, prompt: near ? prompt || 'TALK' : null };
        return near && (BD.AUTOPLAY || In.take('talk'));
      };
      this.mark = null; this.objective(null); A().sfx('ui_select', { vol: 0.5 });
      if (!isX) { p.face = target.x >= p.x ? 1 : -1; target.face = -p.face; }
    }
    /** interact with an npc, then run a dialogue generator as a little cutscene */
    *talk(npc, label, gen) {
      yield* this.interact(npc, label);
      this.cine(true); this.look((npc.x + this.player.x) / 2, 1.5);
      yield* gen;
      this.cine(false);
    }
    /** objective: pick things up by walking into them. items: [{ x, y, name, col, on(item) }] */
    *collect(items, label) {
      const p = this.player;
      this.objective(label);
      this.items = items.map((i) => Object.assign({ y: 0, col: '#ffe36e', got: false }, i));
      yield () => {
        let left = 0;
        for (const it of this.items) {
          if (it.got) continue;
          if (BD.AUTOPLAY || (Math.abs(p.x - it.x) < 48 && Math.abs(p.y - it.y) < 100)) {
            it.got = true; A().sfx('unlock') || A().sfx('ui_select'); FX.ring(it.x, it.y - 40, it.col, 50); FX.text(it.x, it.y - 80, it.name || 'GOT IT', it.col);
            if (it.on) it.on(it);
          } else left++;
        }
        this.objN = left;
        return left === 0;
      };
      this.items = []; this.objective(null);
    }
    /** dialogue choice menu; returns the index picked */
    *choice(who, prompt, options) {
      if (BD.AUTOPLAY || this.skip) return 0;
      options = options.map(BD.slang);
      const c = (this.pick = { who, prompt: BD.slang(prompt), options, sel: 0 });
      In.clear();
      yield () => {
        if (In.take('up')) { c.sel = (c.sel + options.length - 1) % options.length; A().sfx('ui_move'); }
        if (In.take('down')) { c.sel = (c.sel + 1) % options.length; A().sfx('ui_move'); }
        return In.take('confirm') || In.take('talk');
      };
      this.pick = null; A().sfx('ui_select');
      return c.sel;
    }
    /** timed button prompts. keys: 'light' | 'heavy' | 'guard' | 'jump' | 'dash'. o: { window, gap, onHit(k,i), onMiss(k,i) }. returns hits */
    *qte(keys, o) {
      o = o || {};
      let hits = 0;
      this.lock = true;
      for (let i = 0; i < keys.length; i++) {
        const k = keys[i], q = (this.qteS = { key: k, t: 0, win: o.window || 0.9, res: null });
        In.clear();
        yield () => {
          q.t += this.rdt;
          if (BD.AUTOPLAY) { q.res = 'hit'; return true; }
          for (const a of QKEYS) if (In.take(a)) { q.res = a === k ? 'hit' : 'miss'; return true; }
          if (q.t > q.win) { q.res = 'miss'; return true; }
          return false;
        };
        if (q.res === 'hit') { hits++; A().sfx('parry', { vol: 0.6 }); if (o.onHit) o.onHit(k, i); }
        else { A().sfx('ui_locked'); if (o.onMiss) o.onMiss(k, i); }
        yield o.gap === undefined ? 0.4 : o.gap;
      }
      this.qteS = null; this.lock = false;
      return hits;
    }
    /** countdown on the HUD. true if cond() became true in time */
    *timed(seconds, cond) {
      if (BD.AUTOPLAY) return true;
      let ok = false;
      this.clock = seconds;
      yield () => { this.clock -= this.dt; if (cond()) { ok = true; return true; } return this.clock <= 0; };
      this.clock = null;
      return ok;
    }
    /** fail this step: shows the reason; the player restarts the current phase */
    *fail(reason) {
      if (BD.AUTOPLAY) return;
      this.failMsg = reason; this.over = 'dead'; this.overT = 0; A().sting('defeat');
      yield () => false;
    }
    /** npc tags along behind the player. returns the coroutine; call .stop() on it to end */
    follow(npc, gap) {
      gap = gap || 120;
      const w = this, co = new BD.Co((function* () {
        for (;;) {
          const d = w.player.x - npc.x;
          if (Math.abs(d) > gap && !w.cineOn) {
            npc.face = d > 0 ? 1 : -1; npc.x += npc.face * Math.min(Math.abs(d) - gap, (Math.abs(d) > gap + 200 ? 420 : 300) * w.dt);
            npc.state = 'act'; npc.rig.setCycle(Math.abs(d) > gap + 160 ? 'run' : 'walk', 9);
          } else if (npc.rig.cycle) npc.rig.setPose(npc.idlePose, 10);
          yield;
        }
      })());
      this.subs.push(co);
      return co;
    }
    /** an npc mutters lines in speech bubbles whenever the player is nearby */
    chatter(npc, lines, radius) {
      const w = this;
      let i = 0;
      const co = new BD.Co((function* () {
        for (;;) {
          yield U.rand(3.5, 6.5);
          if (!npc.gone && !w.cineOn && !w.dlg && Math.abs(w.player.x - npc.x) < (radius || 320)) w.bubble(npc, lines[i++ % lines.length]);
        }
      })());
      this.subs.push(co);
      return co;
    }
    /** run extra script alongside the main one */
    also(gen) { const co = new BD.Co(gen); this.subs.push(co); return co; }

    token(f) { if (this.tokens.indexOf(f) >= 0) return true; if (this.tokens.length >= 2) return false; this.tokens.push(f); return true; }
    untoken(f) { const i = this.tokens.indexOf(f); if (i >= 0) this.tokens.splice(i, 1); }

    /* ------------------------------------------------------ combat rules */
    resolve(att, a) {
      const x0 = Math.min(att.x - 14 * att.face, att.x + att.face * a.reach), x1 = Math.max(att.x - 14 * att.face, att.x + att.face * a.reach);
      const y0 = att.y + a.h[0], y1 = att.y + a.h[1];
      for (const t of this.fighters) {
        if (t.team === att.team || t.team === 'npc' || t.dead || att.done.indexOf(t) >= 0) continue;
        if (t.x + t.hw < x0 || t.x - t.hw > x1 || t.y - t.hh > y1 || t.y < y0) continue;
        if (t.state === 'down' || t.state === 'getup') continue;
        att.done.push(t);
        if (this.strike(att, t, a, att.face)) att.connected = true;
      }
    }
    strike(att, t, a, dir, shot) {
      if (t.inv > 0) return null;
      const hero = t === this.player, hx = shot ? shot.x : (att.x + t.x) / 2 + dir * 8, hy = shot ? shot.y : t.y - Math.min(t.hh, att.hh) * 0.62;
      const facing = t.face === -dir;
      if (t.state === 'guard' && facing && (!a.unblock || t.guardT < PARRY)) {
        if (t.guardT < PARRY) {
          A().sfx('parry'); FX.hit(hx, hy, 1, -dir, '#9fe8ff'); FX.ring(hx, hy, '#9fe8ff', 60); FX.text(t.x, t.y - t.hh - 30, 'PARRY!', '#9fe8ff');
          BD.hitstop = 0.12; cam.shake(0.25); t.focus = Math.min(100, t.focus + 22); this.stats.parries++; t.guardT = 0;
          if (!shot && att && !att.dead) { att.set('stagger'); att.stun = att.boss ? 1.25 : 1.6; att.vx = dir * -160; att.armor = false; A().sfx('stagger', { vol: 0.6 }); }
          return 'parry';
        }
        A().sfx('block'); FX.spark(hx, hy, 4, '#ffffff', 240); t.vx = dir * 150; t.hp = Math.max(1, t.hp - a.dmg * 0.12); t.guardT = Math.max(t.guardT, PARRY);
        return 'block';
      }
      if (!hero && t.blockP && !a.heavy && !shot && (t.state === 'idle' || t.state === 'move') && Math.random() < t.blockP) {
        t.blockT = 0.3; t.face = -dir; A().sfx('block'); FX.spark(hx, hy, 4, '#ffffff', 240); t.vx = dir * 120;
        return 'block';
      }
      const dmg = a.dmg * (hero ? this.def.hurt || 1 : 1);
      t.hp -= dmg; t.flash = 0.09;
      const pow = Math.min(1.2, a.dmg / 12);
      if (A().voice) A().voice(t.id, t.hp <= 0 ? 'ko' : 'hurt');
      BD.hitstop = Math.max(BD.hitstop, a.stop || 0.05);
      cam.shake(0.14 + pow * 0.3); cam.punch(dir * (3 + pow * 5), 0);
      FX.hit(hx, hy, pow, dir, a.col);
      A().sfx(a.hs || 'hit_light');
      if (hero) {
        this.stats.dmg += dmg; this.combo = 0; A().sfx('hurt', { vol: 0.7 }); FX.flash(0.18, '#ff2a2a');
      } else if (att === this.player) {
        this.combo++; this.comboT = 2.4; this.stats.combo = Math.max(this.stats.combo, this.combo);
        att.focus = Math.min(100, att.focus + a.dmg * 0.75);
        if (att.focus >= 100 && !att.full) { att.full = true; A().sfx('focus_full'); }
      }
      if (t.hp <= 0) {
        t.hp = 0; t.dead = true; t.set('launch'); t.vx = dir * 560; t.vy = -520; t.y -= 2; t.onG = false; t.armor = false; t.face = -dir;
        this.untoken(t);
        if (hero) this.playerDown(); else if (!t.boss) { A().sfx('ko'); FX.ring(hx, hy, '#ffe36e', 80); }
        return 'ko';
      }
      if (t.armor) {
        if (t.brkMax) { t.brk += dmg; if (t.brk >= t.brkMax) { t.brk = 0; t.armor = false; t.set('stagger'); t.stun = 1.5; FX.text(t.x, t.y - t.hh - 30, 'BROKEN!', '#ffe36e'); A().sfx('stagger'); } }
        return 'hit';
      }
      if (t.boss) { // bosses shrug off endless juggles: after a long string they burst free
        t.chain = (t.chainT > 0 ? t.chain : 0) + 1; t.chainT = 1.1;
        if (t.chain > 6 && att === this.player) {
          t.chain = 0; t.set('idle'); t.inv = 0.7; t.face = -dir; att.vx = -dir * 620; att.set('hurt'); att.stun = 0.25;
          FX.ring(t.x, t.y - t.hh * 0.5, '#ffffff', 110); FX.text(t.x, t.y - t.hh - 30, 'ENOUGH!', '#ffffff'); A().sfx('block');
          return 'hit';
        }
      }
      t.face = -dir;
      if (a.launch) { t.set('launch'); t.vx = dir * (a.kb || 100); t.vy = a.ky || -760; t.y -= 2; t.onG = false; }
      else if (a.down || !t.onG) { t.set('launch'); t.vx = dir * (a.kb || 400); t.vy = -330; t.y -= 2; t.onG = false; }
      else { t.set('hurt'); t.stun = hero ? 0.3 : 0.34; t.vx = dir * (a.kb || 150); t.gut = Math.random() < 0.4; }
      if (hero) t.inv = 0.55;
      return 'hit';
    }
    shoot(o) {
      const s = Object.assign({ x: 0, y: 0, vx: 0, vy: 0, g: 0, r: 8, dmg: 6, team: 'foe', kind: 'bb', life: 3, reflect: true, kb: 140, owner: null, t: 0 }, o);
      this.shots.push(s);
      return s;
    }
    updShots(dt) {
      for (let i = this.shots.length - 1; i >= 0; i--) {
        const s = this.shots[i];
        s.t += dt; s.life -= dt; s.vy += s.g * dt; s.x += s.vx * dt; s.y += s.vy * dt;
        let dead = s.life <= 0 || s.x < -100 || s.x > this.bg.width + 100;
        if (!dead && s.y > 0 && s.kind !== 'wave') { dead = true; if (s.onLand) s.onLand(s, this); else FX.spark(s.x, 0, 3, '#ffffff', 160); }
        if (!dead) for (const t of this.fighters) {
          if (t.team === s.team || t.team === 'npc' || t.dead || t.state === 'down' || t.state === 'getup') continue;
          if (Math.abs(t.x - s.x) > t.hw + (s.w || s.r) || s.y < t.y - t.hh - s.r || s.y > t.y + s.r) continue;
          const res = this.strike(s.owner || t, t, s, Math.sign(s.vx) || 1, s);
          if (res === null) continue;
          if (res === 'parry' && s.reflect) {
            s.team = t.team; s.vx *= -1.5; s.vy = s.owner ? ((s.owner.y - s.owner.hh * 0.6 - s.y) / Math.max(0.1, Math.abs(s.owner.x - s.x) / Math.abs(s.vx))) : 0;
            s.g = 0; s.dmg = Math.max(8, s.dmg * 2); s.down = true; s.owner = t; s.life = 2; s.back = true; A().sfx('bb_ricochet');
          } else { dead = true; if (s.back && !t.dead && t.boss) { t.set('stagger'); t.stun = 1.3; A().sfx('stagger'); } }
          break;
        }
        if (dead) this.shots.splice(i, 1);
      }
    }
    playerDown() {
      BD.timeScale = 0.3; A().duck(0.9, 2.5); A().sfx('hit_final', { vol: 0.8 });
      this.over = 'down'; this.overT = 0;
    }
    special() {
      const p = this.player;
      p.focus = 0; p.full = false; p.inv = 2;
      this.subs.push(new BD.Co(this.specialCo()));
    }
    *specialCo() {
      const p = this.player, dir = p.face, x0 = p.x;
      let t = 0;
      const real = (d) => { t = 0; return () => (t += this.rdt) > d; };
      p.set('act'); p.vx = 0; p.vy = 0; p.rig.setPose('iaiW', 30); p.rig.expr = 'scowl';
      BD.timeScale = 0.06; FX.dark = 0.6; A().sfx('special_charge'); A().duck(0.7, 1.4);
      this.banner = { s: 'CLARITY', t: 0, life: 1.1, col: '#9fe8ff' };
      yield real(0.42);
      const x1 = U.clamp(x0 + dir * 560, this.minX + 30, this.maxX - 30);
      const hit = this.fighters.filter((f) => f.team === 'foe' && !f.dead && (f.x - x0) * dir > -50 && (f.x - x0) * dir < Math.abs(x1 - x0) + 60);
      p.x = x1; p.rig.snap('iaiCut'); p.rig.expr = 'shout';
      this.slash = { x0, x1, y: p.y - 74, t: 0.5 };
      FX.flash(1); FX.lines = 1; A().sfx('special_release'); cam.shake(0.9);
      yield real(0.4);
      BD.timeScale = 1; FX.dark = 0;
      for (let i = 0; i < 3; i++) {
        for (const f of hit) if (!f.dead) {
          f.inv = 0; const st = f.state;
          if (st === 'down' || st === 'getup') f.set('idle');
          this.strike(p, f, { dmg: 14, kb: i === 2 ? 620 : 40, stop: 0.07, hs: i === 2 ? 'hit_heavy' : 'slash', down: i === 2, heavy: true, col: '#9fe8ff' }, dir);
        }
        yield real(0.1);
      }
      p.face = -dir; p.set('idle'); p.inv = 0.4;
    }

    /* ------------------------------------------------------------ update */
    update(dt, rdt) {
      this.dt = dt; this.rdt = rdt; this.t += dt; this.st.t += dt;
      if (this.over === 'down') {
        this.overT += rdt;
        if (this.overT > 1.3) { BD.timeScale = 1; this.over = 'dead'; this.overT = 0; A().sting('defeat'); }
      } else if (this.over === 'dead') {
        this.overT += rdt;
        if (this.overT > 0.6 && In.take('confirm')) { A().sfx('ui_select'); this.retry(); }
      }
      if (this.cineOn && In.take('cancel')) this.skip = true;
      if (!this.over && this.co) this.co.update(dt);
      for (let i = this.subs.length - 1; i >= 0; i--) if (this.subs[i].update(dt)) this.subs.splice(i, 1);
      const p = this.player;
      control(p, dt);
      for (const f of this.fighters) { if (f !== p) f.think(dt); f.update(dt); }
      this.updShots(dt);
      for (let i = this.fighters.length - 1; i >= 0; i--) if (this.fighters[i].gone) this.fighters.splice(i, 1);
      if (!this.cineOn && !this.over && this.fighting) this.stats.time += dt;
      // dash afterimages
      if (p.state === 'dash' || this.slash) { this.ghostT -= dt; if (this.ghostT <= 0) { this.ghostT = 0.035; FX.ghosts.push({ x: p.x, y: p.y, face: p.face, life: 0.2, max: 0.2 }); } }
      if (this.slash) { this.slash.t -= rdt; if (this.slash.t <= 0) this.slash = null; }
      this.comboT -= dt; if (this.comboT <= 0) this.combo = 0;
      this.hpGhost = Math.max(p.hp / p.max, this.hpGhost - rdt * 0.35);
      if (this.boss) this.bossGhost = Math.max(this.boss.hp / this.boss.max, this.bossGhost - rdt * 0.35);
      if (this.toastT > 0) this.toastT -= rdt;
      for (let i = this.bubbles.length - 1; i >= 0; i--) { const b = this.bubbles[i]; b.t -= rdt; if (b.t <= 0 || b.f.gone) this.bubbles.splice(i, 1); }
      for (let i = this.marks.length - 1; i >= 0; i--) { this.marks[i].t -= dt; if (this.marks[i].t <= 0) this.marks.splice(i, 1); }
      if (this.banner) { this.banner.t += rdt; if (this.banner.t > this.banner.life) this.banner = null; }
      if (this.card) this.card.t += rdt;
      const fr = (this.fadeRate || 2.5) * rdt;
      this.fade = this.fade < this.fadeTo ? Math.min(this.fadeTo, this.fade + fr) : Math.max(this.fadeTo, this.fade - fr);
      this.letter = U.damp(this.letter, this.cineOn ? 1 : 0, 8, rdt);
      FX.update(rdt * (BD.hitstop > 0 ? 0.3 : 1));
      // camera
      let tx, tz, ty = 0;
      if (this.camLock) { tx = this.camLock.x; tz = this.camLock.zoom; ty = this.camLock.y; }
      else if (this.boss && !this.boss.gone) { const d = Math.abs(this.boss.x - p.x); tx = (this.boss.x + p.x) / 2; tz = U.clamp(1.78 - d / 820, 1.12, 1.6); }
      else { tx = p.x + p.face * 70; tz = this.zoom; }
      if (!this.camLock) ty = Math.min(0, p.y * 0.45);
      cam.follow(tx, ty, tz, rdt, 5.5, this.bg.width);
    }

    /* ------------------------------------------------------------ render */
    render(g) {
      const ps = BD.pixelScale, st = this.st;
      this.bg.draw(g, cam, st);
      if (BD.Save.data.opts.dither !== false) Px.dither(g, this.bgName === 'ink' ? 20 : 28);
      // contact shadows
      cam.push(g, 1);
      g.fillStyle = this.bgName === 'ink' ? 'rgba(20,16,14,0.35)' : 'rgba(0,0,0,0.3)';
      for (const f of this.fighters) if (f.shadow && !f.hidden) {
        const floor = f.onG ? f.y : this.floorUnder(f), k = U.clamp(1 - (floor - f.y) / 320, 0.3, 1) * f.alpha;
        g.beginPath(); g.ellipse(f.x, floor + 2, (f.kid ? 30 : 44) * k, 7 * k, 0, 0, U.TAU); g.fill();
      }
      for (const b of this.beams) { // flashlight cones (stealth)
        const gr = g.createLinearGradient(b.x, 0, b.x + b.dir * b.len, 0);
        gr.addColorStop(0, b.hot ? 'rgba(255,90,60,0.5)' : 'rgba(255,240,170,0.42)'); gr.addColorStop(1, b.hot ? 'rgba(255,90,60,0)' : 'rgba(255,240,170,0)');
        g.fillStyle = gr; g.beginPath(); g.moveTo(b.x, b.y); g.lineTo(b.x + b.dir * b.len, b.y - 80); g.lineTo(b.x + b.dir * b.len, 6); g.lineTo(b.x + b.dir * 40, 6); g.closePath(); g.fill();
      }
      cam.pop(g);
      // dash ghosts
      const p = this.player;
      for (const gh of FX.ghosts) { cam.push(g, 1); p.rig.draw(g, gh.x, gh.y, gh.face, { flat: '#9fe8ff', alpha: (gh.life / gh.max) * 0.5 }); cam.pop(g); }
      const order = this.fighters.slice().sort((a, b) => (a.state === 'down' ? -1 : 0) - (b.state === 'down' ? -1 : 0) || a.z - b.z || (a === p ? 1 : 0) - (b === p ? 1 : 0));
      for (const f of order) f.draw(g);
      g.setTransform(1, 0, 0, 1, 0, 0);
      this.drawShots(g);
      if (this.slash) {
        const a = cam.toScreen(this.slash.x0, this.slash.y), b = cam.toScreen(this.slash.x1, this.slash.y), k = this.slash.t / 0.5;
        g.fillStyle = '#ffffff'; const y = (a[1] * ps) | 0, h = Math.max(1, Math.round(5 * k));
        g.fillRect(Math.min(a[0], b[0]) * ps, y - (h >> 1), Math.abs(b[0] - a[0]) * ps, h);
        g.fillStyle = '#9fe8ff'; g.fillRect(Math.min(a[0], b[0]) * ps, y + (h >> 1), Math.abs(b[0] - a[0]) * ps, 1);
      }
      for (const f of this.fighters) if (f.tellT > 0 && f.state === 'atk') { // attack telegraph marker
        const s = cam.toScreen(f.x, f.y - f.hh - 34);
        if (((BD.time * 16) | 0) % 2) T.draw(g, '!', s[0] * ps, s[1] * ps, { align: 'center', color: f.tellC, outline: '#14101a', scale: 2 });
      }
      for (const f of this.fighters) if (f.state === 'atk' && f.st < f.atk.wind && (f.atk.rush || f.atk.laser) && ((BD.time * 20) | 0) % 2) {
        const a = f.atk, y0 = f.y - f.hh * (a.laser ? 0.55 : 0.4);
        const x1 = a.laser ? this.player.x : f.x + f.face * a.rush * a.act, y1 = a.laser ? this.player.y - 60 : y0;
        const q0 = cam.toScreen(f.x + f.face * 30, y0), q1 = cam.toScreen(x1, y1);
        g.strokeStyle = '#ff3b3b'; g.lineWidth = 1; g.beginPath(); g.moveTo(q0[0] * ps, q0[1] * ps); g.lineTo(q1[0] * ps, q1[1] * ps); g.stroke();
      }
      for (const m of this.marks) { // where something is about to land
        const q = cam.toScreen(m.x, 0), x = (q[0] * ps) | 0, y = (q[1] * ps) | 0;
        if (((BD.time * 14) | 0) % 2) { g.fillStyle = m.col || '#b6ff8a'; g.fillRect(x - 6, y, 12, 2); g.fillRect(x - 1, y - 5, 2, 4); }
      }
      for (const pn of this.pins) { // case markers on the street
        const q = cam.toScreen(pn.x, -210 + Math.sin(BD.time * 3 + pn.x) * 8), x = (q[0] * ps) | 0, y = (q[1] * ps) | 0;
        if (x < -20 || x > FW + 20) continue;
        g.fillStyle = '#14101a'; for (let i = 0; i <= 9; i++) g.fillRect(x - 9 + i - 1, y - i - 1, (9 - i) * 2 + 2, i * 2 + 2);
        g.fillStyle = pn.done ? '#5fd07a' : '#ffe36e'; for (let i = 0; i <= 8; i++) g.fillRect(x - 8 + i, y - i, (8 - i) * 2, i * 2);
        T.draw(g, pn.label, x, y - 3, { align: 'center', color: '#14101a' });
        g.fillStyle = pn.done ? '#5fd07a' : '#ffe36e'; g.fillRect(x - 1, y + 12, 2, 10);
      }
      for (const it of this.items) if (!it.got) { // pickups
        const q = cam.toScreen(it.x, it.y - 44 + Math.sin(BD.time * 5 + it.x) * 6), x = (q[0] * ps) | 0, y = (q[1] * ps) | 0;
        g.fillStyle = '#14101a'; g.fillRect(x - 5, y - 2, 10, 4); g.fillRect(x - 2, y - 5, 4, 10); g.fillRect(x - 4, y - 4, 8, 8);
        g.fillStyle = it.col; g.fillRect(x - 3, y - 3, 6, 6); g.fillStyle = '#ffffff'; g.fillRect(x - 2, y - 2, 2, 2);
      }
      FX.drawWorld(g);
      g.setTransform(ps, 0, 0, ps, 0, 0);
      this.bg.drawFront(g, cam, st);
      g.setTransform(1, 0, 0, 1, 0, 0);
      FX.drawScreen(g);
      if (this.mark && !this.cineOn && !this.over) { // objective marker
        const q = cam.toScreen(this.mark.x, this.mark.y), x = q[0] * ps, y = Math.max(46, q[1] * ps - 8 + Math.sin(BD.time * 6) * 2);
        if (x < 8) T.draw(g, '◀', 4, 120, { color: '#ffe36e', outline: '#0d0b10', scale: 2 });
        else if (x > FW - 8) T.draw(g, '▶', FW - 14, 120, { color: '#ffe36e', outline: '#0d0b10', scale: 2 });
        else {
          T.draw(g, '▼', x, y, { align: 'center', color: '#ffe36e', outline: '#0d0b10', scale: 2 });
          if (this.mark.prompt) T.draw(g, 'E: ' + this.mark.prompt, x, y - 12, { align: 'center', color: '#ffffff', outline: '#0d0b10' });
        }
      }
      for (const b of this.bubbles) if (!this.cineOn || !this.dlg) { // speech bubbles
        const q = cam.toScreen(b.f.x, b.f.y - b.f.hh - 40), w = Math.max.apply(null, b.lines.map((l) => T.width(l))) + 8, h = b.lines.length * 9 + 5;
        const x = U.clamp(Math.round(q[0] * ps - w / 2), 2, FW - w - 2), y = Math.max(34, Math.round(q[1] * ps - h));
        g.fillStyle = '#14101a'; g.fillRect(x - 1, y - 1, w + 2, h + 2); g.fillRect(U.clamp((q[0] * ps) | 0, x + 3, x + w - 5) - 1, y + h, 5, 4);
        g.fillStyle = '#fbf6ea'; g.fillRect(x, y, w, h); g.fillRect(U.clamp((q[0] * ps) | 0, x + 3, x + w - 5), y + h, 3, 3);
        b.lines.forEach((l, i) => T.draw(g, l, x + 4, y + 3 + i * 9, { color: '#221a22' }));
      }
      this.hud(g);
    }
    floorUnder(f) {
      let y = 0;
      for (const pl of this.bg.platforms) if (f.x >= pl.x1 && f.x <= pl.x2 && f.y <= pl.y + 1) y = Math.min(y, pl.y);
      return y;
    }
    drawShots(g) {
      const ps = BD.pixelScale;
      for (const s of this.shots) {
        const q = cam.toScreen(s.x, s.y), x = (q[0] * ps) | 0, y = (q[1] * ps) | 0, d = s.vx >= 0 ? -1 : 1;
        if (s.kind === 'bb') {
          g.fillStyle = s.back ? '#9fe8ff' : '#ffb347'; g.fillRect(x + d * 2, y, 8 * 1, 1);
          g.fillRect(d > 0 ? x : x - 7, y, 8, 1);
          g.fillStyle = '#ffffff'; g.fillRect(x - 1, y - 1, 3, 3);
        } else if (s.kind === 'cork') {
          g.fillStyle = '#14101a'; g.fillRect(x - 3, y - 3, 6, 6); g.fillStyle = s.back ? '#9fe8ff' : '#d9b77c'; g.fillRect(x - 2, y - 2, 4, 4);
        } else if (s.kind === 'wave') { // a crescent of ink/energy sliding along the floor
          const h = Math.round(s.r * 2 * cam.zoom * ps), cx = x + d * h * 0.55, cy = y - h * 0.45;
          const a0 = d > 0 ? -1.0 : Math.PI - 1.0, a1 = d > 0 ? 1.0 : Math.PI + 1.0;
          g.strokeStyle = s.col || '#14110f'; g.lineWidth = 5; g.beginPath(); g.arc(cx, cy, h * 0.7, a0, a1); g.stroke();
          g.strokeStyle = s.col2 || '#c8102e'; g.lineWidth = 1; g.beginPath(); g.arc(cx + d * 4, cy, h * 0.7, a0 + 0.2, a1 - 0.2); g.stroke();
        } else if (s.kind === 'cane') {
          g.strokeStyle = '#14101a'; g.lineWidth = 4; g.beginPath(); g.moveTo(x, y - 16); g.lineTo(x, y + 2); g.stroke();
          g.strokeStyle = s.col || '#b6ff8a'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y - 16); g.lineTo(x, y + 2); g.stroke();
          g.beginPath(); g.arc(x - 3, y - 16, 3, Math.PI, 0); g.stroke();
        } else {
          g.fillStyle = '#14101a'; g.fillRect(x - 5, y - 5, 10, 10); g.fillStyle = s.col || '#8a5a2c'; g.fillRect(x - 4, y - 4, 8, 8);
          g.fillStyle = '#3d2915'; g.fillRect(x - 4, y - 1, 8, 1); g.fillRect(x - 1, y - 4, 1, 8);
        }
      }
    }
    hud(g) {
      const p = this.player, lb = Math.round(this.letter * 22);
      if (lb > 0) { g.fillStyle = '#07060a'; g.fillRect(0, 0, FW, lb); g.fillRect(0, FH - lb, FW, lb); }
      if (!this.cineOn && !this.card && this.obj) {
        const s = '▶ ' + this.obj + (this.objN ? '  (' + this.objN + ' LEFT)' : '');
        T.draw(g, s, FW / 2, 35, { align: 'center', color: '#ffe36e', outline: '#0d0b10' });
      }
      if (this.clock !== null && !this.cineOn) {
        const c = Math.max(0, Math.ceil(this.clock));
        T.draw(g, ((c / 60) | 0) + ':' + ('0' + (c % 60)).slice(-2), FW / 2, 14, { align: 'center', scale: 2, color: c <= 10 ? '#ff4b3a' : '#fff3d6', outline: '#0d0b10' });
      }
      if (this.qteS) {
        const q = this.qteS, nm = QNAME[q.key], w = Math.max(44, T.width(nm, 3) + 16), x = (FW - w) / 2;
        Px.panel(g, x, 58, w, 40, q.res === 'hit' ? '#2f8a4a' : q.res === 'miss' ? '#8a2a2a' : '#15121c', '#07060a', '#ffe36e');
        T.draw(g, nm, FW / 2, 64, { align: 'center', scale: 3, color: '#ffffff', shadow: '#07060a' });
        g.fillStyle = '#ffe36e'; g.fillRect(x + 4, 91, Math.round((w - 8) * Math.max(0, 1 - q.t / q.win)), 3);
      }
      if (!this.cineOn && !this.card && !this.noHud) {
        // Huey
        Px.panel(g, 4, 4, 28, 28, '#2a1114', '#0d0b10', '#b3262d');
        g.drawImage(faceTile('huey', 6.5, 22, 22, p.hp < 30 ? 'pain' : null), 7, 7);
        T.draw(g, 'HUEY', 36, 5, { color: '#fff3d6', outline: '#0d0b10' });
        Px.bar(g, 36, 15, 120, 7, p.hp / p.max, this.hpGhost, p.hp < 30 ? '#ff4b3a' : '#ffd23a', p.hp < 30 ? '#ff9a8a' : '#fff0a0', 1);
        const full = p.focus >= 100, blink = full && ((BD.time * 6) | 0) % 2;
        Px.bar(g, 36, 25, 72, 3, p.focus / 100, p.focus / 100, blink ? '#ffffff' : '#49c8f0', '#bff0ff', 1);
        if (full) T.draw(g, 'F: CLARITY', 112, 23, { color: blink ? '#ffffff' : '#9fe8ff', outline: '#0d0b10' });
        // boss
        const b = this.boss;
        if (b) {
          Px.panel(g, FW - 32, 4, 28, 28, '#1a1420', '#0d0b10', b.def.color);
          g.save(); g.translate(FW - 7, 7); g.scale(-1, 1); g.drawImage(faceTile(b.id, b.kid ? 6.5 : 7, 22, 22, null), 0, 0); g.restore();
          T.draw(g, b.name.toUpperCase(), FW - 36, 5, { color: '#fff3d6', outline: '#0d0b10', align: 'right' });
          Px.bar(g, FW - 36 - 150, 15, 150, 7, b.hp / b.max, this.bossGhost, '#e8452e', '#ff9a7a', -1);
          if (b.title) T.draw(g, b.title, FW - 36, 25, { color: '#c9bfd6', outline: '#0d0b10', align: 'right' });
        }
        if (this.combo > 1) {
          const pop = this.comboT > 2.25 ? 3 : 2;
          T.draw(g, String(this.combo), FW - 44, 44, { align: 'right', scale: pop, color: this.combo >= 10 ? '#ff7a3a' : '#ffe36e', outline: '#0d0b10' });
          T.draw(g, 'HITS', FW - 40, 51, { color: '#fff3d6', outline: '#0d0b10' });
        }
        if (this.toastT > 0 && this.toastS) {
          const w = T.width(this.toastS) + 12, a = this.toastT < 0.3 ? ((BD.time * 30) | 0) % 2 : 1;
          if (a) { Px.panel(g, (FW - w) / 2, 46, w, 13, '#14101a', '#0d0b10', '#ffe36e'); T.draw(g, this.toastS, FW / 2, 49, { align: 'center', color: '#fff3d6' }); }
        }
        if (this.alert > 0.02) { // stealth detection meter
          const s = cam.toScreen(p.x, p.y - p.hh - 60), x = (s[0] * BD.pixelScale) | 0, y = Math.max(40, (s[1] * BD.pixelScale) | 0);
          g.fillStyle = '#0d0b10'; g.fillRect(x - 13, y - 1, 26, 5);
          g.fillStyle = this.alert > 0.66 ? '#ff3b3b' : '#ffe36e'; g.fillRect(x - 12, y, Math.round(24 * this.alert), 3);
        }
      }
      if (this.banner) {
        const b = this.banner, k = Math.min(1, b.t / 0.12), sc = b.big ? 5 : 4;
        const img = T.banner(b.s, sc, b.col || '#fff3d6', b.col ? '#3aa0d8' : '#ffb21e', '#1a0d10', 0.2);
        if (b.t < b.life - 0.25 || ((BD.time * 30) | 0) % 2) g.drawImage(img, Math.round((FW - img.width) / 2 + (1 - k) * 120), Math.round(FH * 0.36 - img.height / 2));
      }
      if (this.dlg) this.drawDlg(g);
      if (this.pick) { // dialogue choice
        const c = this.pick, h = 22 + c.options.length * 12;
        Px.panel(g, 60, FH - 30 - h, FW - 120, h, '#15121c', '#07060a', '#ffe36e');
        T.draw(g, c.prompt, 70, FH - 24 - h, { color: '#ffe36e' });
        c.options.forEach((o, i) => T.draw(g, (i === c.sel ? '▶ ' : '  ') + o, 70, FH - 10 - h + i * 12, { color: i === c.sel ? '#ffffff' : '#b9b0c4' }));
      }
      if (this.fade > 0.01) { g.globalAlpha = Math.min(1, this.fade); g.fillStyle = '#07060a'; g.fillRect(0, 0, FW, FH); g.globalAlpha = 1; }
      if (this.card) this.drawCard(g);
      if (this.over === 'dead') {
        g.fillStyle = 'rgba(10,4,6,0.78)'; g.fillRect(0, 0, FW, FH);
        const img = T.banner(this.failMsg ? 'MISSION FAILED' : 'YOU GOT WHOOPED', 4, '#ff6a4a', '#a8141c', '#14060a', 0.2);
        g.drawImage(img, Math.round((FW - img.width) / 2), 78);
        const q = this.failMsg || this.def.loss || 'Granddad: "Boy, get up off that floor. You embarrassing the family."';
        T.wrap(q, 60).forEach((l, i) => T.draw(g, l, FW / 2, 132 + i * 10, { align: 'center', color: '#f1e6d2', shadow: '#0d0b10' }));
        if (((BD.time * 2.5) | 0) % 2) T.draw(g, 'ENTER: RUN IT BACK', FW / 2, 176, { align: 'center', color: '#ffe36e', outline: '#0d0b10' });
      }
      if (this.cineOn && !this.card) T.draw(g, this.skip ? 'SKIPPING...' : 'ESC: SKIP', FW - 6, 8, { align: 'right', color: '#6f6a7a' });
      if (this.overlay) this.overlay(g);
    }
    drawDlg(g) {
      const d = this.dlg, n = d.n | 0;
      if (!d.who) { // Huey's voice-over: plain captions over the letterbox
        let c = 0;
        const h = d.lines.length * 10 + 8, y0 = FH - 26 - h;
        g.fillStyle = 'rgba(7,6,10,0.78)'; g.fillRect(0, y0, FW, h + 4);
        g.fillStyle = '#b3262d'; g.fillRect(0, y0, FW, 1);
        d.lines.forEach((l, i) => { const s = l.slice(0, Math.max(0, n - c)); c += l.length + 1; if (s) T.draw(g, s, Math.round(FW / 2 - T.width(l) / 2), y0 + 6 + i * 10, { color: '#fff3d6', shadow: '#07060a' }); });
        if (n >= d.text.length && ((BD.time * 3) | 0) % 2) T.draw(g, '▼', FW / 2 - 2, FH - 14, { color: '#ffe36e' });
        return;
      }
      const def = BD.CAST[d.who], left = d.who === 'huey', y = FH - 70;
      const bx = left ? 62 : 8, bw = FW - 70;
      Px.panel(g, bx, y, bw, 62, '#15121c', '#07060a', def.color);
      // portrait
      const pxx = left ? 4 : FW - 70, talking = n < d.text.length ? Math.max(0, Math.sin(d.t * 26)) * 0.9 : 0;
      Px.panel(g, pxx, y - 14, 66, 76, U.shade(def.color, -0.45), '#07060a', def.color);
      g.save(); g.beginPath(); g.rect(pxx + 3, y - 11, 60, 70); g.clip();
      const kidP = (def.build || 'adult') === 'kid';
      BD.Portrait.draw(g, d.who, pxx + 33 + (left ? -1 : 1), y + (kidP ? 30 : 24), kidP ? 15 : 16, left ? 1 : -1, d.expr, talking, this.rdt, d.opts.pose);
      g.restore();
      // name plate
      const nm = (d.opts.name || def.name).toUpperCase(), nw = T.width(nm) + 10, nx = left ? bx + 6 : bx + bw - nw - 6;
      Px.panel(g, nx, y - 7, nw, 12, def.color, '#07060a', U.shade(def.color, 0.3));
      T.draw(g, nm, nx + 5, y - 4, { color: '#ffffff', shadow: '#07060a' });
      let c = 0;
      d.lines.forEach((l, i) => { const s = l.slice(0, Math.max(0, n - c)); c += l.length + 1; if (s) T.draw(g, s, bx + 10, y + 12 + i * 11, { color: '#f4ecdc', shadow: '#07060a' }); });
      if (n >= d.text.length && ((BD.time * 3) | 0) % 2) T.draw(g, '▼', bx + bw - 14, y + 50, { color: '#ffe36e' });
    }
    drawCard(g) {
      const c = this.card, t = c.t;
      g.fillStyle = '#07060a'; g.fillRect(0, 0, FW, FH);
      if (t < 0.5) return;
      g.fillStyle = '#b3262d'; g.fillRect(40, 96, Math.min(400, (t - 0.5) * 2400) | 0, 2);
      T.draw(g, c.ep, FW / 2, 82, { align: 'center', color: '#b3262d' });
      const sc = T.width(c.title, 3) > 420 ? 2 : 3;
      const n = Math.min(c.title.length, ((t - 0.55) * 40) | 0);
      T.draw(g, '"' + c.title.slice(0, n) + (n >= c.title.length ? '"' : ''), Math.round(FW / 2 - (T.width(c.title, sc) + 12 * sc) / 2), 108, { color: '#f4ecdc', scale: sc });
      if (t > 1.3) T.draw(g, c.src, FW / 2, 108 + 7 * sc + 12, { align: 'center', color: '#8a8496' });
    }
  }
  BD.World = World;
})();
