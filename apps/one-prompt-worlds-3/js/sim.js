// EMBERDEEP — simulation. Pure logic, deterministic, no DOM (runs in node for bot tests).
(function (root) {
  'use strict';
  const EMB = root.EMB || require('./data.js');
  const T = EMB.T;
  const TAU = Math.PI * 2;
  const GROUP_LAMP = { upper: 'L2', hub: 'L3', fungus: 'L4', archive: 'L5', coretop: 'L6', core: 'L7' };

  function angDiff(a, b) { let d = (a - b) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; }
  function hypot(x, y) { return Math.sqrt(x * x + y * y); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  function Game(save, seed) {
    this.defs = EMB.buildZones();
    let s = (seed || 12345) >>> 0;
    this.rng = function () { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    this.flags = { lit: {}, lamps: { L1: 1 }, chests: {}, crates: {}, cracks: {}, doors: {}, cleared: {}, dead: {}, seenTypes: {} };
    this.seen = this.defs.map(d => new Uint8Array(d.w * d.h));
    this.stats = { time: 0, kills: 0, deaths: 0, chests: 0, secrets: 0 };
    this.p = {
      x: EMB.START.x, y: EMB.START.y, r: 0.3, face: 0, hp: 14, lvl: 1, xp: 0, cry: 0,
      forge: { blade: 0, cloak: 0 }, weapons: ['sword'], wi: 0, charms: [], equipped: [],
      flasks: 2, flaskMax: 2, flare: 0, hasFlare: false,
      state: 'idle', t: 0, combo: 0, comboT: 0, inv: 0, rollCd: 0, bufAtk: 0, bufRoll: 0, bufAim: null,
      kx: 0, ky: 0, safeX: EMB.START.x, safeY: EMB.START.y, lamp: 'L1', rdx: 0, rdy: 0, hitDone: false, moving: false, trailT: 0
    };
    this.ev = []; this.hs = 0; this.time = 0; this.ended = false; this.endReady = false;
    let zi = EMB.START.zone, x = EMB.START.x, y = EMB.START.y;
    if (save) {
      Object.assign(this.flags, save.flags);
      Object.assign(this.p, save.p);
      Object.assign(this.stats, save.stats);
      save.seen.forEach((h, i) => unhex(h, this.seen[i]));
      const lp = this.lampPos(this.p.lamp); zi = lp.zone; x = lp.x; y = lp.y;
      this.p.state = 'idle'; this.p.hp = this.maxhp(); this.p.flasks = this.p.flaskMax;
    }
    this.enterZone(zi, x, y);
  }
  function hex(a) { let s = ''; for (let i = 0; i < a.length; i += 4) s += ((a[i] ? 1 : 0) | (a[i + 1] ? 2 : 0) | (a[i + 2] ? 4 : 0) | (a[i + 3] ? 8 : 0)).toString(16); return s; }
  function unhex(s, a) { for (let i = 0; i < s.length; i++) { const v = parseInt(s[i], 16); for (let k = 0; k < 4; k++) if (i * 4 + k < a.length) a[i * 4 + k] = (v >> k) & 1; } }

  const G = Game.prototype;
  G.emit = function (t, o) { const e = o || {}; e.t = t; this.ev.push(e); };
  G.serialize = function () {
    const p = this.p;
    return {
      v: 1, flags: this.flags, stats: this.stats, seen: this.seen.map(hex),
      p: { lvl: p.lvl, xp: p.xp, cry: p.cry, forge: p.forge, weapons: p.weapons, wi: p.wi, charms: p.charms, equipped: p.equipped, flaskMax: p.flaskMax, flare: p.flare, hasFlare: p.hasFlare, lamp: p.lamp }
    };
  };
  G.atk = function () { return 3 + (this.p.lvl - 1) + this.p.forge.blade * 2; };
  G.maxhp = function () { return 14 + (this.p.lvl - 1) * 2 + this.p.forge.cloak * 4; };
  G.weapon = function () { return EMB.WEAPONS[this.p.weapons[this.p.wi]]; };
  G.has = function (c) { return this.p.equipped.indexOf(c) >= 0; };
  G.lampPos = function (id) {
    for (let i = 0; i < this.defs.length; i++) for (const s of this.defs[i].spawns) if (s.k === 'lamp' && s.lamp === id) return { zone: i, x: s.x + 0.5, y: s.y + 1.7, name: s.name };
    return null;
  };
  G.groupLit = function (g) {
    if (g === 'camp') return true;
    if (g === 'final') return !!this.flags.cleared['z2.final'];
    return !!this.flags.lamps[GROUP_LAMP[g]];
  };
  G.roomKey = function (id) { return this.z.def.id + '.' + id; };
  G.roomLit = function (id) {
    let n = 0;
    for (const o of this.z.objs) if (o.k === 'brazier' && o.room === id) { if (!o.lit) return false; n++; }
    return n > 0;
  };
  G.cond = function (c) {
    const i = c.indexOf(':'), k = c.slice(0, i), v = c.slice(i + 1);
    if (k === 'lit') return this.roomLit(v);
    if (k === 'clear') return !!this.flags.cleared[this.roomKey(v)];
    if (k === 'lamps') return v.split(',').every(l => this.flags.lamps[l]);
    return false;
  };

  // ------------------------------------------------------------ zone setup
  G.enterZone = function (zi, x, y) {
    const def = this.defs[zi];
    const z = this.z = { i: zi, def: def, w: def.w, h: def.h, tiles: new Uint8Array(def.tiles), solid: new Uint8Array(def.w * def.h), objs: [], enemies: [], shots: [], lobs: [], rings: [], fires: [], picks: [] };
    this.arena = null; this.flow = null; this.flowT = 0;
    for (const s of def.spawns) {
      if (s.k === 'enemy') continue;
      const o = { k: s.k, id: s.id, x: s.x, y: s.y, cx: s.x + 0.5, cy: s.y + 0.5, room: s.room, s: s };
      if (s.k === 'brazier') { o.lit = !s.relight && !!this.flags.lit[s.id]; o.solid = 1; o.snuff = 0; }
      else if (s.k === 'lamp') { o.lit = !!(s.lit || this.flags.lamps[s.lamp]); o.solid = 1; }
      else if (s.k === 'chest') { o.open = !!this.flags.chests[s.id]; o.hidden = false; o.solid = 1; }
      else if (s.k === 'crate') { if (this.flags.crates[s.id]) continue; o.solid = 1; }
      else if (s.k === 'crack') { if (this.flags.cracks[s.id]) continue; o.solid = 2; }
      else if (s.k === 'door') { o.open = true; o.tiles = s.tiles; o.cx = (s.tiles[0][0] + s.tiles[s.tiles.length - 1][0]) / 2 + 0.5; o.cy = (s.tiles[0][1] + s.tiles[s.tiles.length - 1][1]) / 2 + 0.5; }
      else if (s.k === 'heart') { o.solid = 1; }
      z.objs.push(o);
    }
    for (const o of z.objs) if (o.k === 'chest' && o.s.hidden && !o.open) o.hidden = !this.cond(o.s.hidden);
    for (const o of z.objs) if (o.solid && !o.hidden) z.solid[o.y * z.w + o.x] = o.solid;
    this.refreshDoors(true);
    this.spawnEnemies();
    const p = this.p; p.x = x; p.y = y; p.safeX = x; p.safeY = y; p.kx = p.ky = 0;
    this.markSeen();
    this.emit('zone', { zone: zi });
  };
  G.refreshDoors = function (silent) {
    const z = this.z;
    for (const o of z.objs) {
      if (o.k !== 'door') continue;
      const m = o.s.mode; let open;
      if (m === 'seal' || m === 'gate') open = this.cond(o.s.cond);
      else if (m === 'arena') open = !(this.arena && this.arena.room.id === o.s.arena);
      else open = !!this.flags.doors[o.id];
      if (open !== o.open || silent) {
        o.open = open;
        for (const t of o.tiles) z.solid[t[1] * z.w + t[0]] = open ? 0 : 2;
        if (!silent) this.emit('door', { open: open, x: o.cx, y: o.cy, mode: m });
      }
    }
  };
  G.mk = function (type, x, y, room, extra) {
    const d = EMB.ENEMIES[type], tier = this.z.def.tier;
    const hp = d.abs ? d.hp : Math.round(d.hp * EMB.TIER_HP[tier]);
    const e = Object.assign({
      type: type, d: d, x: x + 0.5, y: y + 0.5, hx: x + 0.5, hy: y + 0.5, r: d.r, hp: hp, maxhp: hp,
      dmg: d.abs ? d.dmg : Math.round(d.dmg * EMB.TIER_DMG[tier]), room: room, state: 'idle', t: 0, T: 0,
      cd: 0.3 + this.rng() * 0.7, aim: 0, face: this.rng() * TAU, kx: 0, ky: 0, stun: 0, flash: 0, aggro: false,
      wob: this.rng() * TAU, orb: this.rng() * TAU, dir: this.rng() < 0.5 ? 1 : -1, burn: 0, hitP: false, n: 0
    }, extra || {});
    this.z.enemies.push(e); return e;
  };
  G.spawnEnemies = function () {
    const z = this.z; z.enemies = []; z.shots = []; z.lobs = []; z.rings = []; z.fires = [];
    for (const s of z.def.spawns) {
      if (s.k !== 'enemy') continue;
      const room = z.def.rooms.find(r => r.id === s.room);
      if (this.flags.dead[s.id]) { if (this.roomLit(s.room)) continue; delete this.flags.dead[s.id]; }
      this.mk(s.type, s.x, s.y, room, { id: s.id });
    }
  };

  // ------------------------------------------------------------ collision helpers
  G.tile = function (tx, ty) { const z = this.z; if (tx < 0 || ty < 0 || tx >= z.w || ty >= z.h) return T.ROCK; return z.tiles[ty * z.w + tx]; };
  G.tsolid = function (tx, ty) {
    const z = this.z; if (tx < 0 || ty < 0 || tx >= z.w || ty >= z.h) return true;
    const i = ty * z.w + tx, t = z.tiles[i]; return t === T.ROCK || t === T.SHELF || z.solid[i] > 0;
  };
  G.blocked = function (x, y, r, pit) {
    const x0 = Math.floor(x - r), x1 = Math.floor(x + r), y0 = Math.floor(y - r), y1 = Math.floor(y + r);
    for (let j = y0; j <= y1; j++) for (let i = x0; i <= x1; i++) if (this.tsolid(i, j)) return true;
    if (pit && this.tile(Math.floor(x), Math.floor(y)) === T.PIT) return true;
    return false;
  };
  G.move = function (e, dx, dy, pit, room) {
    let hit = false;
    let nx = e.x + dx;
    if (room) nx = clamp(nx, room.x + e.r, room.x + room.w - e.r);
    if (!this.blocked(nx, e.y, e.r, pit)) e.x = nx; else hit = true;
    let ny = e.y + dy;
    if (room) ny = clamp(ny, room.y + e.r, room.y + room.h - e.r);
    if (!this.blocked(e.x, ny, e.r, pit)) e.y = ny; else hit = true;
    return hit;
  };
  G.los = function (x0, y0, x1, y1) {
    const d = hypot(x1 - x0, y1 - y0), n = Math.ceil(d / 0.3);
    for (let i = 1; i < n; i++) {
      const tx = Math.floor(x0 + (x1 - x0) * i / n), ty = Math.floor(y0 + (y1 - y0) * i / n);
      const z = this.z, idx = ty * z.w + tx, t = this.tile(tx, ty);
      if (t === T.ROCK || t === T.SHELF || z.solid[idx] === 2) return false;
    }
    return true;
  };
  G.roomOf = function (x, y) { const z = this.z, i = z.def.roomAt[Math.floor(y) * z.w + Math.floor(x)]; return i >= 0 ? z.def.rooms[i] : null; };
  G.markSeen = function () {
    const p = this.p, z = this.z, seen = this.seen[z.i], pr = this.roomOf(p.x, p.y);
    const px = Math.floor(p.x), py = Math.floor(p.y);
    for (let j = py - 8; j <= py + 8; j++) for (let i = px - 8; i <= px + 8; i++) {
      if (i < 0 || j < 0 || i >= z.w || j >= z.h) continue;
      const d = hypot(i - px, j - py), ri = z.def.roomAt[j * z.w + i];
      if (d <= 3.2 || (d <= 8 && pr && ri >= 0 && z.def.rooms[ri] === pr)) seen[j * z.w + i] = 1;
    }
  };

  // ------------------------------------------------------------ main update
  G.update = function (dt, inp) {
    this.ev.length = 0;
    if (this.ended) return;
    if (this.hs > 0) { this.hs -= dt; return; }
    this.time += dt; this.stats.time += dt;
    this.updatePlayer(dt, inp);
    this.updateArena(dt);
    this.updateFlow(dt);
    this.updateEnemies(dt);
    this.updateHazards(dt);
    this.updatePicks(dt);
    this.updatePrompt();
    this.seenT = (this.seenT || 0) - dt; if (this.seenT <= 0) { this.seenT = 0.12; this.markSeen(); }
    // stairs
    const p = this.p;
    if (p.state !== 'dead') for (const o of this.z.objs) if (o.k === 'stairs' && Math.floor(p.x) === o.x && Math.floor(p.y) === o.y) { const to = o.s.to; this.enterZone(to[0], to[1], to[2]); break; }
  };

  // ------------------------------------------------------------ player
  G.updatePlayer = function (dt, inp) {
    const p = this.p;
    p.inv -= dt; p.rollCd -= dt; p.bufAtk -= dt; p.bufRoll -= dt;
    if (p.comboT > 0) { p.comboT -= dt; if (p.comboT <= 0) p.combo = 0; }
    if (inp.attack) { p.bufAtk = 0.2; p.bufAim = inp.aim === undefined ? null : inp.aim; }
    if (inp.roll) p.bufRoll = 0.16;
    let mx = inp.mx || 0, my = inp.my || 0; const ml = hypot(mx, my);
    if (ml > 1) { mx /= ml; my /= ml; }
    p.moving = false;
    // knockback
    if (Math.abs(p.kx) + Math.abs(p.ky) > 0.05) { this.move(p, p.kx * dt, p.ky * dt, true); const k = Math.exp(-9 * dt); p.kx *= k; p.ky *= k; }
    const st = p.state;
    if (st === 'idle') {
      if (ml > 0.1) { this.move(p, mx * 4.7 * dt, my * 4.7 * dt, true); p.face = Math.atan2(my, mx); p.moving = true; }
      if (this.tile(Math.floor(p.x), Math.floor(p.y)) === T.FLOOR && !this.nearPit(p.x, p.y)) { p.safeX = p.x; p.safeY = p.y; }
      if (p.bufRoll > 0 && p.rollCd <= 0) this.startRoll(mx, my, ml);
      else if (p.bufAtk > 0) this.startAttack();
      else if (inp.flare && p.hasFlare && p.flare >= 100) this.doFlare();
      else if (inp.flask) { if (p.flasks > 0 && p.hp < this.maxhp()) { p.state = 'drink'; p.t = 0; this.emit('drink'); } else this.emit('deny'); }
      else if (inp.swap && p.weapons.length > 1) { p.wi = (p.wi + 1) % p.weapons.length; p.combo = 0; this.emit('swap', { w: p.weapons[p.wi] }); }
      else if (inp.interact) this.interact();
    } else if (st === 'attack') {
      const w = this.weapon(); p.t += dt;
      if (p.t < w.wu + 0.06) this.move(p, Math.cos(p.face) * w.lunge * dt, Math.sin(p.face) * w.lunge * dt, true);
      else if (ml > 0.1) this.move(p, mx * 0.9 * dt, my * 0.9 * dt, true);
      if (!p.hitDone && p.t >= w.wu) { p.hitDone = true; this.doHit(w); }
      if (p.hitDone && p.t >= w.wu + w.cancel) {
        if (p.bufRoll > 0 && p.rollCd <= 0) { p.comboT = 0; p.combo = 0; this.startRoll(mx, my, ml); }
        else if (p.bufAtk > 0 && p.combo < w.combo) { p.comboT = 0.4; this.startAttack(mx, my, ml); }
      }
      if (p.state === 'attack' && p.t >= w.wu + w.rc + (p.combo >= w.combo && w.combo > 1 ? 0.12 : 0)) { p.state = 'idle'; p.comboT = p.combo >= w.combo ? 0.001 : 0.38; }
    } else if (st === 'roll') {
      p.t += dt;
      this.move(p, p.rdx * 8.8 * dt, p.rdy * 8.8 * dt, false);
      if (this.has('trail')) { p.trailT -= dt; if (p.trailT <= 0) { p.trailT = 0.05; this.z.fires.push({ x: p.x, y: p.y, r: 0.6, life: 1.3, dmg: Math.max(1, Math.round(this.atk() * 0.6)) }); } }
      const onPit = this.tile(Math.floor(p.x), Math.floor(p.y)) === T.PIT;
      if (p.t >= 0.3 && (!onPit || p.t >= 0.4)) {
        p.state = 'idle'; p.rollCd = 0.2;
        if (onPit) { p.state = 'fall'; p.t = 0; this.emit('fall', { x: p.x, y: p.y }); }
      }
    } else if (st === 'hurt') {
      p.t += dt; if (p.t >= 0.2) p.state = 'idle';
    } else if (st === 'drink') {
      p.t += dt; if (ml > 0.1) { this.move(p, mx * 1.6 * dt, my * 1.6 * dt, true); p.face = Math.atan2(my, mx); p.moving = true; }
      if (p.t >= 0.55) { const h = Math.ceil(this.maxhp() * 0.55); p.flasks--; p.hp = Math.min(this.maxhp(), p.hp + h); p.state = 'idle'; this.emit('heal', { n: h, x: p.x, y: p.y }); }
    } else if (st === 'flare') {
      p.t += dt; if (p.t >= 0.28) p.state = 'idle';
    } else if (st === 'fall') {
      p.t += dt;
      if (p.t >= 0.65) { p.x = p.safeX; p.y = p.safeY; p.state = 'idle'; p.kx = p.ky = 0; p.inv = 1.2; p.hp = Math.max(1, p.hp - 2); this.emit('hurt', { n: 2, x: p.x, y: p.y, fall: true }); }
    } else if (st === 'dead') {
      p.t += dt; if (p.t >= 2.6) this.respawn();
    }
  };
  G.nearPit = function (x, y) {
    const tx = Math.floor(x), ty = Math.floor(y);
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) if (this.tile(tx + i, ty + j) === T.PIT) return true;
    return false;
  };
  G.startRoll = function (mx, my, ml) {
    const p = this.p;
    if (ml > 0.1) { p.rdx = mx / ml; p.rdy = my / ml; p.face = Math.atan2(my, mx); } else { p.rdx = Math.cos(p.face); p.rdy = Math.sin(p.face); }
    p.state = 'roll'; p.t = 0; p.bufRoll = 0; p.inv = Math.max(p.inv, 0.3); p.trailT = 0; this.emit('roll', { x: p.x, y: p.y });
  };
  G.startAttack = function () {
    const p = this.p, w = this.weapon();
    p.combo = (p.comboT > 0 && p.combo < w.combo) ? p.combo + 1 : 1;
    let a = p.bufAim;
    if (a === null || a === undefined) {
      a = p.face; let best = 1e9;
      for (const e of this.z.enemies) {
        if (e.dead || e.air || e.state === 'spawn') continue;
        const d = hypot(e.x - p.x, e.y - p.y); if (d - e.r > w.range + 0.9) continue;
        const ea = Math.atan2(e.y - p.y, e.x - p.x); if (Math.abs(angDiff(ea, p.face)) > 1.25) continue;
        if (d < best) { best = d; a = ea; }
      }
      if (best > 1e8) for (const o of this.z.objs) {
        if (o.hidden || !((o.k === 'brazier' && !o.lit) || o.k === 'crate' || (o.k === 'chest' && !o.open) || o.k === 'crack')) continue;
        const d = hypot(o.cx - p.x, o.cy - p.y); if (d > w.range + 0.7) continue;
        const ea = Math.atan2(o.cy - p.y, o.cx - p.x); if (Math.abs(angDiff(ea, p.face)) > 1.3) continue;
        if (d < best) { best = d; a = ea; }
      }
    }
    p.face = a; p.state = 'attack'; p.t = 0; p.hitDone = false; p.bufAtk = 0;
  };
  G.inArc = function (x, y, r, w) {
    const p = this.p, d = hypot(x - p.x, y - p.y);
    if (d - r > w.range) return false;
    if (d < r + 0.45) return true;
    return Math.abs(angDiff(Math.atan2(y - p.y, x - p.x), p.face)) <= w.arc / 2 + Math.asin(Math.min(1, r / d)) * 0.6;
  };
  G.doHit = function (w) {
    const p = this.p, fin = w.combo > 1 && p.combo >= w.combo;
    const dmg = Math.max(1, Math.round(this.atk() * w.mult * (fin ? 1.5 : 1)));
    let hits = 0, blockedHit = false;
    this.emit('swing', { x: p.x, y: p.y, a: p.face, w: w.id, fin: fin });
    for (const e of this.z.enemies) {
      if (e.dead || e.air || e.state === 'spawn') continue;
      if (!this.inArc(e.x, e.y, e.r, w) || !this.los(p.x, p.y, e.x, e.y)) continue;
      const r = this.hitEnemy(e, dmg, Math.atan2(e.y - p.y, e.x - p.x), w.kb * (fin ? 1.8 : 1), { hammer: w.hammer, power: w.power + (fin ? 1 : 0), melee: true });
      if (r === 1) hits++; else if (r === 2) blockedHit = true;
    }
    for (const o of this.z.objs) {
      if (o.hidden) continue;
      if (o.k === 'brazier' && !o.lit) { if (this.inArc(o.cx, o.cy, 0.4, w) && this.los(p.x, p.y, o.cx, o.cy)) this.ignite(o); }
      else if (o.k === 'crate' && !o.dead) { if (this.inArc(o.cx, o.cy, 0.45, w)) this.breakCrate(o); }
      else if (o.k === 'chest' && !o.open) { if (this.inArc(o.cx, o.cy, 0.45, w)) this.openChest(o); }
      else if (o.k === 'crack' && !o.dead) {
        if (this.inArc(o.cx, o.cy, 0.5, w)) {
          if (w.hammer) this.breakCrack(o);
          else { this.emit('clink', { x: o.cx, y: o.cy }); this.say(p.weapons.indexOf('hammer') >= 0 ? 'ひび割れた壁だ。大槌なら砕けそうだ（Q で持ち替え）' : 'ひび割れた壁だ。もっと重い一撃が要る……'); }
        }
      } else if (o.k === 'door' && !o.open && o.s.mode === 'oneway') { if (this.inArc(o.cx, o.cy, 0.6, w)) this.tryDoor(o); }
    }
    if (hits) {
      this.hs = w.hammer ? 0.09 : fin ? 0.075 : 0.045;
      if (p.hasFlare) p.flare = Math.min(100, p.flare + (6 + 3 * Math.min(hits, 3)) * (this.has('tempo') ? 1.6 : 1) * (w.hammer ? 1.6 : 1));
    }
    if (blockedHit && !hits) { p.kx -= Math.cos(p.face) * 5; p.ky -= Math.sin(p.face) * 5; }
  };
  // returns 0 no effect, 1 damaged, 2 blocked by guard
  G.hitEnemy = function (e, dmg, ang, kb, o) {
    if (e.dead) return 0;
    o = o || {};
    e.aggro = true;
    if (e.type === 'shell' && o.melee && e.stun <= 0 && e.state !== 'rec' && Math.abs(angDiff(e.face, ang + Math.PI)) < 1.15) {
      if (!o.hammer) { this.emit('clang', { x: e.x, y: e.y, a: ang }); if (!this.flags.seenTypes.guard) { this.flags.seenTypes.guard = 1; this.say('正面の殻に弾かれた！ 背後に回るか、突進を壁にぶつけさせよう'); } return 2; }
      e.stun = 1.8; e.state = 'chase'; this.emit('guardbreak', { x: e.x, y: e.y });
    }
    let shroud = false;
    if (e.type === 'eater' && e.shroud) { dmg = Math.max(1, Math.round(dmg * 0.25)); shroud = true; }
    e.hp -= dmg; e.flash = 0.14;
    const m = e.d.mass; e.kx += Math.cos(ang) * kb / m; e.ky += Math.sin(ang) * kb / m;
    if ((o.power || 0) > e.d.poise + (e.state === 'wind' || e.state === 'atk' ? 1 : 0) && e.state !== 'spawn' && !(e.armor > 0)) { if (e.state !== 'stag' || o.power >= 2) { e.state = 'stag'; e.t = 0; e.T = o.power >= 2 ? 0.5 : 0.28; } }
    if (o.stun) e.stun = Math.max(e.stun, e.d.boss ? o.stun * 0.5 : o.stun);
    this.emit('dmg', { x: e.x, y: e.y, n: dmg, a: ang, heavy: (o.power || 0) >= 2, shroud: shroud, burst: !!o.burst });
    if (e.hp <= 0) this.kill(e, ang);
    return 1;
  };
  G.kill = function (e, ang) {
    if (e.dead) return;
    e.dead = true; this.stats.kills++;
    const p = this.p;
    if (e.id) this.flags.dead[e.id] = 1;
    this.emit('kill', { x: e.x, y: e.y, type: e.type, r: e.r, a: ang || 0, boss: !!e.d.boss });
    let xp = e.d.xp, cry = e.d.cry;
    if (!e.d.abs) { xp = Math.round(xp * (1 + this.z.def.tier * 0.9)); cry = Math.round(cry * (1 + this.z.def.tier * 0.6)); }
    if (e.minion) { xp = 2; cry = 1; }
    this.drop(e.x, e.y, 'xp', xp, 3 + this.z.def.tier * 2); this.drop(e.x, e.y, 'cry', cry, 3 + this.z.def.tier);
    if (this.has('leech') && p.hp < this.maxhp() && p.state !== 'dead') { p.hp++; this.emit('leech', { x: p.x, y: p.y }); }
    if (e.type === 'brood') { p.hasFlare = true; p.flare = 100; this.emit('item', { item: 'flare' }); }
  };
  G.drop = function (x, y, k, total, unit) {
    while (total > 0) {
      const v = Math.min(unit, total); total -= v;
      const a = this.rng() * TAU, s = 2 + this.rng() * 4;
      this.z.picks.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, k: k, v: v, t: 0 });
    }
  };
  G.updatePicks = function (dt) {
    const p = this.p, R = this.has('magnet') ? 9 : 3.4, pk = this.z.picks;
    for (let i = pk.length - 1; i >= 0; i--) {
      const o = pk[i]; o.t += dt;
      const dx = p.x - o.x, dy = p.y - o.y, d = hypot(dx, dy) || 0.001;
      if (o.t > 0.35 && p.state !== 'dead' && (d < R || o.k === 'xp' || this.tile(Math.floor(o.x), Math.floor(o.y)) !== T.FLOOR)) {
        const s = Math.min(16, 5 + o.t * 14); o.vx = dx / d * s; o.vy = dy / d * s;
        if (d < 0.4) {
          pk.splice(i, 1);
          if (o.k === 'xp') this.gainXp(o.v);
          else { const v = this.has('magnet') ? Math.ceil(o.v * 1.25) : o.v; p.cry += v; this.emit('pick', { k: 'cry', v: v }); }
          continue;
        }
      } else { const k = Math.exp(-5 * dt); o.vx *= k; o.vy *= k; }
      const nx = o.x + o.vx * dt, ny = o.y + o.vy * dt;
      if (o.t > 0.35 || !this.tsolid(Math.floor(nx), Math.floor(ny))) { o.x = nx; o.y = ny; } else { o.vx = 0; o.vy = 0; }
    }
  };
  G.gainXp = function (v) {
    const p = this.p; p.xp += v; this.emit('pick', { k: 'xp', v: v });
    while (p.xp >= EMB.xpNeed(p.lvl)) {
      p.xp -= EMB.xpNeed(p.lvl); p.lvl++; p.hp = this.maxhp();
      this.emit('lvl', { lvl: p.lvl, x: p.x, y: p.y });
      for (const e of this.z.enemies) { if (e.dead || e.air) continue; const d = hypot(e.x - p.x, e.y - p.y); if (d < 2.6) { const a = Math.atan2(e.y - p.y, e.x - p.x); e.kx += Math.cos(a) * 9 / e.d.mass; e.ky += Math.sin(a) * 9 / e.d.mass; } }
    }
  };
  G.say = function (text) { if (this.lastSay === text && this.time - this.lastSayT < 4) return; this.lastSay = text; this.lastSayT = this.time; this.emit('msg', { text: text }); };

  G.doFlare = function () {
    const p = this.p, R = 3.1; p.flare = 0; p.state = 'flare'; p.t = 0; p.inv = Math.max(p.inv, 0.55);
    this.emit('flare', { x: p.x, y: p.y, r: R });
    const dmg = Math.round(this.atk() * 2.6);
    for (const e of this.z.enemies) {
      if (e.dead || e.air || e.state === 'spawn') continue;
      const d = hypot(e.x - p.x, e.y - p.y);
      if (d - e.r <= R) this.hitEnemy(e, dmg, Math.atan2(e.y - p.y, e.x - p.x), 12, { power: 3, stun: 1.0, burst: true });
    }
    const z = this.z;
    z.shots = z.shots.filter(s => hypot(s.x - p.x, s.y - p.y) > R + 0.3);
    z.lobs = z.lobs.filter(s => hypot(s.tx - p.x, s.ty - p.y) > R + 0.3);
    for (const o of z.objs) if (o.k === 'brazier' && !o.lit && hypot(o.cx - p.x, o.cy - p.y) <= R) this.ignite(o);
    this.hs = 0.1;
  };
  G.ignite = function (o) {
    o.lit = true; o.snuff = 0;
    if (!o.s.relight) this.flags.lit[o.id] = 1;
    this.emit('ignite', { x: o.cx, y: o.cy });
    const dmg = 5 + this.p.lvl * 2 + this.z.def.tier * 3;
    for (const e of this.z.enemies) {
      if (e.dead || e.air || e.state === 'spawn') continue;
      const d = hypot(e.x - o.cx, e.y - o.cy);
      if (d - e.r <= 2.5) this.hitEnemy(e, e.d.boss ? dmg * 2 : dmg, Math.atan2(e.y - o.cy, e.x - o.cx), 10, { power: 3, stun: 1.1, burst: true });
    }
    if (o.room && !o.s.relight && this.roomLit(o.room)) {
      this.emit('roomlit', { room: o.room, x: o.cx, y: o.cy });
      this.refreshDoors();
    }
  };
  G.breakCrate = function (o) {
    o.dead = true; this.flags.crates[o.id] = 1; this.z.solid[o.y * this.z.w + o.x] = 0;
    this.z.objs.splice(this.z.objs.indexOf(o), 1);
    this.emit('crate', { x: o.cx, y: o.cy });
    this.drop(o.cx, o.cy, 'cry', 3 + Math.floor(this.rng() * 3) + this.z.def.tier * 2, 2);
  };
  G.breakCrack = function (o) {
    o.dead = true; this.flags.cracks[o.id] = 1; this.z.solid[o.y * this.z.w + o.x] = 0;
    this.z.objs.splice(this.z.objs.indexOf(o), 1);
    this.emit('crack', { x: o.cx, y: o.cy }); this.hs = 0.1;
  };
  G.openChest = function (o) {
    if (o.open || o.hidden) return;
    o.open = true; this.flags.chests[o.id] = 1; this.stats.chests++;
    const p = this.p, it = o.s.item, i = it.indexOf(':'), k = i < 0 ? it : it.slice(0, i), v = it.slice(i + 1);
    const room = this.z.def.rooms.find(r => r.id === o.room); if (room && room.secret) this.stats.secrets++;
    this.emit('chest', { x: o.cx, y: o.cy });
    if (k === 'weapon') { p.weapons.push(v); p.wi = p.weapons.length - 1; p.combo = 0; }
    else if (k === 'charm') { p.charms.push(v); if (p.equipped.length < 2) p.equipped.push(v); }
    else if (k === 'flask') { p.flaskMax++; p.flasks++; }
    else if (k === 'crystal') { this.drop(o.cx, o.cy + 0.6, 'cry', +v, 6); this.drop(o.cx, o.cy + 0.6, 'xp', 30, 6); return; }
    this.drop(o.cx, o.cy + 0.6, 'cry', 20 + this.z.def.tier * 15, 5);
    this.emit('item', { item: it });
  };
  G.tryDoor = function (o) {
    const p = this.p, s = o.s.side;
    const ok = s === 'e' ? p.x > o.cx : s === 'w' ? p.x < o.cx : s === 'n' ? p.y < o.cy : p.y > o.cy;
    if (ok) { this.flags.doors[o.id] = 1; this.refreshDoors(); this.say('閂を外した。近道が開いた'); }
    else this.say('向こう側から閂がかかっている');
  };
  G.nearest = function () {
    const p = this.p; let best = null, bd = 1.55;
    for (const o of this.z.objs) {
      if (o.hidden) continue;
      let ok = false;
      if (o.k === 'lamp') ok = true;
      else if (o.k === 'chest') ok = !o.open;
      else if (o.k === 'door') ok = !o.open && (o.s.mode === 'oneway' || o.s.mode === 'gate' || o.s.mode === 'seal');
      else if (o.k === 'heart') ok = true;
      if (!ok) continue;
      const d = hypot(o.cx - p.x, o.cy - p.y) - (o.k === 'door' ? 0.5 : o.k === 'heart' ? 0.9 : 0);
      if (d < bd) { bd = d; best = o; }
    }
    return best;
  };
  G.updatePrompt = function () {
    const o = this.p.state === 'dead' ? null : this.nearest(); this.prompt = null;
    if (!o) return;
    let t = null;
    if (o.k === 'lamp') t = this.arena ? null : o.lit ? '大燈で休む' : '大燈を灯す';
    else if (o.k === 'chest') t = '開ける';
    else if (o.k === 'door') t = '調べる';
    else if (o.k === 'heart') t = this.flags.cleared['z2.final'] ? '炉心に火を入れる' : null;
    if (t) this.prompt = { text: t, x: o.cx, y: o.cy, o: o };
  };
  G.interact = function () {
    const o = this.nearest(); if (!o) return;
    if (o.k === 'lamp') {
      if (this.arena) return;
      if (!o.lit) { o.lit = true; this.flags.lamps[o.s.lamp] = 1; this.emit('lamp', { id: o.s.lamp, x: o.cx, y: o.cy, name: o.s.name, group: o.s.group }); this.refreshDoors(); }
      this.rest(o.s.lamp, true);
    } else if (o.k === 'chest') this.openChest(o);
    else if (o.k === 'door') {
      const m = o.s.mode;
      if (m === 'oneway') this.tryDoor(o);
      else if (m === 'gate') this.say('二つの大燈 ― 茸の洞と書庫 ― が灯るとき、炉心への門は開く');
      else if (o.s.cond.indexOf('lit') === 0) this.say('封じられた扉。この部屋の火鉢をすべて灯せば開きそうだ');
      else this.say('封じられている');
    } else if (o.k === 'heart') {
      if (this.flags.cleared['z2.final']) { this.ended = true; this.emit('ending'); }
    }
  };
  G.rest = function (lamp, menu) {
    const p = this.p; p.lamp = lamp; p.hp = this.maxhp(); p.flasks = p.flaskMax;
    this.spawnEnemies();
    this.emit('rest', { lamp: lamp, menu: !!menu });
  };
  G.warp = function (lamp) {
    const lp = this.lampPos(lamp);
    this.enterZone(lp.zone, lp.x, lp.y); this.rest(lamp, false); this.emit('warp');
  };
  G.buy = function (kind) {
    const p = this.p, f = EMB.FORGE[kind], lv = p.forge[kind];
    if (lv >= f.cost.length || p.cry < f.cost[lv]) return false;
    p.cry -= f.cost[lv]; p.forge[kind]++;
    if (kind === 'cloak') p.hp = this.maxhp();
    this.emit('forge', { kind: kind }); return true;
  };
  G.toggleCharm = function (c) {
    const p = this.p, i = p.equipped.indexOf(c);
    if (i >= 0) p.equipped.splice(i, 1); else { if (p.equipped.length >= 2) return false; p.equipped.push(c); }
    return true;
  };
  G.hurt = function (dmg, fx, fy) {
    const p = this.p;
    if (p.inv > 0 || p.state === 'dead' || p.state === 'fall') return false;
    if (this.has('iron')) dmg = Math.max(1, dmg - 1);
    p.hp -= dmg; p.inv = 0.9;
    const a = Math.atan2(p.y - fy, p.x - fx); p.kx = Math.cos(a) * 9; p.ky = Math.sin(a) * 9;
    this.emit('hurt', { n: dmg, x: p.x, y: p.y });
    this.hs = 0.08;
    if (p.hp <= 0) { p.hp = 0; p.state = 'dead'; p.t = 0; this.stats.deaths++; this.emit('die', { x: p.x, y: p.y }); return true; }
    p.state = 'hurt'; p.t = 0; p.combo = 0;
    if (this.has('retort')) {
      this.emit('retort', { x: p.x, y: p.y });
      const d2 = Math.round(this.atk() * 1.6);
      for (const e of this.z.enemies) { if (e.dead || e.air || e.state === 'spawn') continue; if (hypot(e.x - p.x, e.y - p.y) - e.r <= 2.4) this.hitEnemy(e, d2, Math.atan2(e.y - p.y, e.x - p.x), 12, { power: 3, stun: 0.6, burst: true }); }
    }
    return true;
  };
  G.respawn = function () {
    const p = this.p, lp = this.lampPos(p.lamp);
    p.state = 'idle'; p.inv = 1; p.combo = 0;
    this.enterZone(lp.zone, lp.x, lp.y); this.rest(p.lamp, false); this.emit('respawn');
  };

  // ------------------------------------------------------------ arena
  G.updateArena = function (dt) {
    const p = this.p, z = this.z;
    if (!this.arena) {
      if (p.state === 'dead') return;
      const r = this.roomOf(p.x, p.y);
      if (r && r.arena && !this.flags.cleared[this.roomKey(r.id)] && p.x > r.x + 1.3 && p.x < r.x + r.w - 1.3 && p.y > r.y + 1.3 && p.y < r.y + r.h - 1.3) {
        this.arena = { room: r, wave: -1, t: 0.5 };
        this.refreshDoors();
        this.emit('arena', { boss: !!r.boss, room: r.id });
      }
      return;
    }
    const A = this.arena;
    const alive = z.enemies.some(e => e.wave && !e.dead);
    if (alive) return;
    A.t -= dt; if (A.t > 0) return;
    A.wave++;
    if (A.wave < A.room.waves.length) {
      for (const w of A.room.waves[A.wave]) this.mk(w[0], w[1], w[2], A.room, { wave: true, aggro: true, state: 'spawn', T: 0.8 });
      A.t = 0.9;
      if (A.room.boss) this.emit('boss', { type: A.room.waves[A.wave][0][0] });
    } else {
      this.flags.cleared[this.roomKey(A.room.id)] = 1; this.arena = null;
      for (const o of z.objs) if (o.k === 'chest' && o.hidden && this.cond(o.s.hidden)) { o.hidden = false; z.solid[o.y * z.w + o.x] = 1; this.emit('reveal', { x: o.cx, y: o.cy }); this.unstick(); }
      if (A.room.id === 'final') { for (const o of z.objs) if (o.k === 'brazier') o.lit = true; z.shots = []; z.rings = []; z.lobs = []; }
      this.refreshDoors();
      this.emit('cleared', { room: A.room.id, boss: !!A.room.boss });
    }
  };

  G.unstick = function () {
    const p = this.p; if (!this.blocked(p.x, p.y, p.r, false)) return;
    for (let r = 0.3; r < 3; r += 0.3) for (let k = 0; k < 8; k++) { const x = p.x + Math.cos(k * 0.785) * r, y = p.y + Math.sin(k * 0.785) * r; if (!this.blocked(x, y, p.r, true)) { p.x = x; p.y = y; return; } }
  };
  // ------------------------------------------------------------ flow field
  G.updateFlow = function (dt) {
    this.flowT -= dt; if (this.flowT > 0) return; this.flowT = 0.15;
    const p = this.p, r = this.roomOf(p.x, p.y);
    if (!r) { this.flow = null; return; }
    const w = r.w, h = r.h, d = new Int16Array(w * h).fill(-1), z = this.z;
    const sx = Math.floor(p.x) - r.x, sy = Math.floor(p.y) - r.y;
    const q = [sx + sy * w]; d[sx + sy * w] = 0;
    for (let qi = 0; qi < q.length; qi++) {
      const c = q[qi], cx = c % w, cy = (c - cx) / w;
      for (let k = 0; k < 4; k++) {
        const nx = cx + (k === 0 ? 1 : k === 1 ? -1 : 0), ny = cy + (k === 2 ? 1 : k === 3 ? -1 : 0);
        if (nx < 0 || ny < 0 || nx >= w || ny >= h || d[nx + ny * w] >= 0) continue;
        const gi = (ny + r.y) * z.w + nx + r.x;
        if (z.tiles[gi] !== T.FLOOR || z.solid[gi]) continue;
        d[nx + ny * w] = d[c] + 1; q.push(nx + ny * w);
      }
    }
    this.flow = { r: r, d: d };
  };
  // direction for a ground enemy to approach player
  G.steer = function (e) {
    const p = this.p, f = this.flow;
    let dx = p.x - e.x, dy = p.y - e.y; const dl = hypot(dx, dy) || 1;
    if (!f || f.r !== e.room || e.d.fly) return [dx / dl, dy / dl];
    if (dl < 2.2 && this.los(e.x, e.y, p.x, p.y)) return [dx / dl, dy / dl];
    const r = f.r, tx = Math.floor(e.x) - r.x, ty = Math.floor(e.y) - r.y;
    if (tx < 0 || ty < 0 || tx >= r.w || ty >= r.h) return [dx / dl, dy / dl];
    const cur = f.d[tx + ty * r.w]; let best = cur < 0 ? 1e9 : cur, bx = 0, by = 0, found = false;
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
      if (!i && !j) continue; const nx = tx + i, ny = ty + j;
      if (nx < 0 || ny < 0 || nx >= r.w || ny >= r.h) continue;
      const v = f.d[nx + ny * r.w]; if (v < 0) continue;
      if (i && j && (f.d[tx + i + ty * r.w] < 0 || f.d[tx + (ty + j) * r.w] < 0)) continue;
      const vv = v + (i && j ? 0.4 : 0);
      if (vv < best) { best = vv; bx = nx; by = ny; found = true; }
    }
    if (!found) return [dx / dl, dy / dl];
    const gx = bx + r.x + 0.5 - e.x, gy = by + r.y + 0.5 - e.y, gl = hypot(gx, gy) || 1;
    return [gx / gl, gy / gl];
  };

  // ------------------------------------------------------------ enemies
  function set(e, s, Tm) { e.state = s; e.t = 0; e.T = Tm || 0; e.hitP = false; }
  G.touch = function (e, extra) {
    const p = this.p;
    if (!e.hitP && hypot(p.x - e.x, p.y - e.y) < e.r + p.r + 0.12 + (extra || 0)) { if (this.hurt(e.dmg, e.x, e.y)) e.hitP = true; }
  };
  G.updateEnemies = function (dt) {
    const p = this.p, z = this.z, pr = this.roomOf(p.x, p.y), alive = p.state !== 'dead';
    for (const e of z.enemies) {
      if (e.dead) continue;
      e.flash -= dt; e.wob += dt;
      const room = e.room, fly = !!e.d.fly;
      if (Math.abs(e.kx) + Math.abs(e.ky) > 0.05 && !e.air) {
        this.move(e, e.kx * dt, e.ky * dt, false, room); const k = Math.exp(-8 * dt); e.kx *= k; e.ky *= k;
      }
      if (!fly && !e.air && !e.d.boss && this.tile(Math.floor(e.x), Math.floor(e.y)) === T.PIT && Math.abs(e.kx) + Math.abs(e.ky) < 3 && e.state !== 'atk') {
        this.emit('pitfall', { x: e.x, y: e.y, r: e.r }); this.kill(e, 0); continue;
      }
      if (e.state === 'spawn') { e.t += dt; if (e.t >= e.T) set(e, 'chase'); continue; }
      if (e.stun > 0) { e.stun -= dt; if (e.state === 'wind' || e.state === 'atk') set(e, 'chase'); continue; }
      if (e.armor > 0) e.armor -= dt;
      if (e.state === 'stag') { e.t += dt; if (e.t >= e.T) { set(e, 'chase'); e.armor = e.d.elite ? 3 : 1.3; e.cd = Math.min(e.cd, 0.25); } continue; }
      const dx = p.x - e.x, dy = p.y - e.y, dist = hypot(dx, dy), toP = Math.atan2(dy, dx);
      const same = alive && pr === room;
      if (!e.aggro) {
        if (same && dist < 6.8 && this.los(e.x, e.y, p.x, p.y)) { e.aggro = true; set(e, 'chase'); this.emit('aggro', { x: e.x, y: e.y, type: e.type }); if (!this.flags.seenTypes[e.type]) this.flags.seenTypes[e.type] = 1; }
        else { // idle drift home
          const hx = e.hx - e.x, hy = e.hy - e.y, hl = hypot(hx, hy);
          if (hl > 0.3) this.move(e, hx / hl * e.d.speed * 0.6 * dt, hy / hl * e.d.speed * 0.6 * dt, !fly, room);
          continue;
        }
      }
      if (!same && !e.wave && (e.state === 'chase' || e.state === 'idle')) { e.aggro = false; e.state = 'idle'; continue; }
      if (e.state === 'idle') set(e, 'chase');
      e.cd -= dt;
      this['ai_' + e.type](e, dt, dist, toP, room);
    }
    // soft separation
    for (let i = 0; i < z.enemies.length; i++) {
      const a = z.enemies[i]; if (a.dead || !a.aggro || a.air || a.state === 'atk') continue;
      for (let j = i + 1; j < z.enemies.length; j++) {
        const b = z.enemies[j]; if (b.dead || !b.aggro || b.air || b.state === 'atk') continue;
        const dx = b.x - a.x, dy = b.y - a.y, d = hypot(dx, dy), m = a.r + b.r;
        if (d < m && d > 0.001) { const s = (m - d) * 0.5 * Math.min(1, dt * 10), ux = dx / d, uy = dy / d; if (!a.d.boss) this.move(a, -ux * s, -uy * s, !a.d.fly, a.room); if (!b.d.boss) this.move(b, ux * s, uy * s, !b.d.fly, b.room); }
      }
    }
    for (let i = z.enemies.length - 1; i >= 0; i--) if (z.enemies[i].dead) z.enemies.splice(i, 1);
  };
  G.walk = function (e, dt, mul, room) { const s = this.steer(e); this.move(e, s[0] * e.d.speed * mul * dt, s[1] * e.d.speed * mul * dt, !e.d.fly, room); e.face = Math.atan2(s[1], s[0]); };

  G.ai_blob = function (e, dt, dist, toP, room) {
    if (e.state === 'chase') {
      this.walk(e, dt, 1, room);
      if (dist < 1.9 && e.cd <= 0 && this.los(e.x, e.y, this.p.x, this.p.y)) { set(e, 'wind', 0.5); e.aim = toP; }
    } else if (e.state === 'wind') {
      e.t += dt; if (e.t < e.T - 0.18) e.aim = toP;
      if (e.t >= e.T) { set(e, 'atk', 0.22); this.emit('lunge', { x: e.x, y: e.y }); }
    } else if (e.state === 'atk') {
      e.t += dt; this.move(e, Math.cos(e.aim) * 9.5 * dt, Math.sin(e.aim) * 9.5 * dt, true, room); this.touch(e);
      if (e.t >= e.T) { set(e, 'rec', 0.85); e.cd = 0.5 + this.rng() * 0.5; }
    } else if (e.state === 'rec') { e.t += dt; if (e.t >= e.T) set(e, 'chase'); }
  };
  G.ai_flit = function (e, dt, dist, toP, room) {
    const p = this.p;
    if (e.state === 'chase') {
      e.orb += dt * 1.3 * e.dir;
      const tx = p.x + Math.cos(e.orb) * 3.3, ty = p.y + Math.sin(e.orb) * 3.3, dx = tx - e.x, dy = ty - e.y, dl = hypot(dx, dy) || 1;
      if (this.move(e, dx / dl * e.d.speed * dt, dy / dl * e.d.speed * dt, false, room)) e.dir = -e.dir;
      if (e.cd <= 0 && dist < 5.2 && this.los(e.x, e.y, p.x, p.y)) { set(e, 'wind', 0.6); e.aim = toP; }
    } else if (e.state === 'wind') {
      e.t += dt; if (e.t < e.T - 0.22) e.aim = toP;
      if (e.t >= e.T) { set(e, 'atk', 0.42); this.emit('dive', { x: e.x, y: e.y }); }
    } else if (e.state === 'atk') {
      e.t += dt; const hit = this.move(e, Math.cos(e.aim) * 11.5 * dt, Math.sin(e.aim) * 11.5 * dt, false, room); this.touch(e);
      if (e.t >= e.T || hit) { set(e, 'rec', 0.8); e.cd = 1.5 + this.rng() * 1.2; }
    } else if (e.state === 'rec') { e.t += dt; if (e.t >= e.T) set(e, 'chase'); }
  };
  G.ai_spitter = function (e, dt, dist, toP, room) {
    const p = this.p;
    if (e.state === 'chase') {
      if (dist < 3.6) { this.move(e, -Math.cos(toP) * e.d.speed * dt, -Math.sin(toP) * e.d.speed * dt, true, room); }
      else if (dist > 6.5) this.walk(e, dt, 1, room);
      e.face = toP;
      if (e.cd <= 0 && dist < 9) { set(e, 'wind', 0.55); }
    } else if (e.state === 'wind') {
      e.t += dt; e.face = toP;
      if (e.t >= e.T) {
        this.z.lobs.push({ x0: e.x, y0: e.y, tx: p.x, ty: p.y, t: 0, T: 0.95, r: 1.05, dmg: e.dmg, src: e });
        this.emit('spit', { x: e.x, y: e.y }); set(e, 'rec', 0.5); e.cd = 2.3 + this.rng() * 0.8;
      }
    } else if (e.state === 'rec') { e.t += dt; if (e.t >= e.T) set(e, 'chase'); }
  };
  G.ai_shell = function (e, dt, dist, toP, room) {
    if (e.state === 'chase') {
      const d = angDiff(toP, e.face); e.face += clamp(d, -2.4 * dt, 2.4 * dt);
      const s = this.steer(e); this.move(e, s[0] * e.d.speed * dt, s[1] * e.d.speed * dt, true, room);
      if (e.cd <= 0 && dist < 7.5 && Math.abs(d) < 0.3 && this.los(e.x, e.y, this.p.x, this.p.y)) { set(e, 'wind', 0.75); e.aim = e.face; }
    } else if (e.state === 'wind') {
      e.t += dt; if (e.t < 0.4) { const d = angDiff(toP, e.face); e.face += clamp(d, -1.5 * dt, 1.5 * dt); e.aim = e.face; }
      if (e.t >= e.T) { set(e, 'atk', 0.8); e.hits = []; this.emit('charge', { x: e.x, y: e.y }); }
    } else if (e.state === 'atk') {
      e.t += dt;
      const ox = e.x, oy = e.y, vx = Math.cos(e.aim) * 9.5 * dt, vy = Math.sin(e.aim) * 9.5 * dt;
      this.move(e, vx, vy, false, room);
      const moved = hypot(e.x - ox, e.y - oy);
      this.touch(e, 0.05);
      for (const o of this.z.enemies) { if (o === e || o.dead || o.air || o.d.boss || e.hits.indexOf(o) >= 0) continue; if (hypot(o.x - e.x, o.y - e.y) < o.r + e.r + 0.1) { e.hits.push(o); this.hitEnemy(o, e.dmg * 3, e.aim, 12, { power: 3, burst: true }); } }
      if (this.tile(Math.floor(e.x), Math.floor(e.y)) === T.PIT && e.t > 0.08) { /* keep sliding; pit check happens when slow */ e.overPit = true; }
      if (moved < hypot(vx, vy) * 0.5) { e.stun = 2.3; set(e, 'chase'); e.cd = 1; this.emit('crash', { x: e.x, y: e.y }); if (e.overPit) { /* stays */ } }
      else if (e.t >= e.T) { set(e, 'rec', 1.0); e.cd = 1.4; }
      if (e.state !== 'atk' && this.tile(Math.floor(e.x), Math.floor(e.y)) === T.PIT) { this.emit('pitfall', { x: e.x, y: e.y, r: e.r }); this.kill(e, 0); }
    } else if (e.state === 'rec') { e.t += dt; if (e.t >= e.T) set(e, 'chase'); }
  };
  G.sweep = function (e, range, arc) {
    const p = this.p, d = hypot(p.x - e.x, p.y - e.y);
    this.emit('sweep', { x: e.x, y: e.y, a: e.aim, r: range, arc: arc });
    if (d <= range + p.r && Math.abs(angDiff(Math.atan2(p.y - e.y, p.x - e.x), e.aim)) <= arc / 2) this.hurt(e.dmg, e.x, e.y);
  };
  G.ai_knight = function (e, dt, dist, toP, room) {
    const ph2 = e.hp < e.maxhp * 0.5;
    if (e.state === 'chase') {
      this.walk(e, dt, 1, room); e.face = toP;
      if (e.cd <= 0) {
        if (dist < 2.3) { set(e, 'wind', 0.6); e.aim = toP; e.atk = 'sweep'; e.n = ph2 ? 2 : 1; }
        else if (dist < 7 && this.los(e.x, e.y, this.p.x, this.p.y)) { set(e, 'wind', 0.6); e.aim = toP; e.atk = 'lunge'; }
      }
    } else if (e.state === 'wind') {
      e.t += dt; if (e.t < e.T - 0.2) { e.aim = toP; e.face = toP; }
      if (e.t >= e.T) {
        if (e.atk === 'sweep') { this.sweep(e, 2.4, 2.9); e.n--; if (e.n > 0) { set(e, 'wind', 0.42); e.aim = toP; } else { set(e, 'rec', 0.9); e.cd = 0.6; } }
        else { set(e, 'atk', 0.34); this.emit('dive', { x: e.x, y: e.y }); }
      }
    } else if (e.state === 'atk') {
      e.t += dt; this.move(e, Math.cos(e.aim) * 12.5 * dt, Math.sin(e.aim) * 12.5 * dt, true, room); this.touch(e, 0.15);
      if (e.t >= e.T) { set(e, 'rec', 0.85); e.cd = 0.7; }
    } else if (e.state === 'rec') { e.t += dt; if (e.t >= e.T) set(e, 'chase'); }
  };
  G.ai_brood = function (e, dt, dist, toP, room) {
    const p = this.p, ph2 = e.hp < e.maxhp * 0.5;
    const sp = e.sp || 0;
    if (!e.air && ((sp === 0 && e.hp < e.maxhp * 0.7) || (sp === 1 && e.hp < e.maxhp * 0.38))) {
      e.sp = sp + 1;
      for (let i = 0; i < 3; i++) { const a = e.wob + i * 2.1; const m = this.mk('blob', Math.floor(clamp(e.x + Math.cos(a) * 2.2, room.x + 1, room.x + room.w - 2)), Math.floor(clamp(e.y + Math.sin(a) * 2.2, room.y + 1, room.y + room.h - 2)), room, { wave: true, aggro: true, state: 'spawn', T: 0.7, minion: true }); m.hp = m.maxhp = 6; }
      this.emit('roar', { x: e.x, y: e.y });
    }
    if (e.state === 'chase') {
      const hop = Math.max(0, Math.sin(e.wob * 5)); this.walk(e, dt, 0.4 + hop * 1.2, room);
      if (e.cd <= 0) {
        if (dist < 3 && e.alt) { set(e, 'wind', 0.65); e.aim = toP; e.alt = false; }
        else { set(e, 'jump', 1.0); e.air = true; e.alt = true; e.jumps = 0; this.emit('jump', { x: e.x, y: e.y }); }
      }
    } else if (e.state === 'wind') {
      e.t += dt; if (e.t < e.T - 0.2) e.aim = toP;
      if (e.t >= e.T) { set(e, 'atk', 0.3); this.emit('lunge', { x: e.x, y: e.y, big: true }); }
    } else if (e.state === 'atk') {
      e.t += dt; this.move(e, Math.cos(e.aim) * 10 * dt, Math.sin(e.aim) * 10 * dt, true, room); this.touch(e);
      if (e.t >= e.T) { set(e, 'rec', 1.1); e.cd = 0.8; }
    } else if (e.state === 'jump') {
      e.t += dt; const s = Math.min(6.2 * dt, dist); e.x = clamp(e.x + Math.cos(toP) * s, room.x + e.r, room.x + room.w - e.r); e.y = clamp(e.y + Math.sin(toP) * s, room.y + e.r, room.y + room.h - e.r);
      if (e.t >= e.T) set(e, 'fallw', 0.5);
    } else if (e.state === 'fallw') {
      e.t += dt;
      if (e.t >= e.T) {
        e.air = false; this.emit('slam', { x: e.x, y: e.y });
        if (dist < e.r + 0.7) this.hurt(e.dmg + 1, e.x, e.y);
        this.z.rings.push({ x: e.x, y: e.y, rad: e.r, speed: 6.5, maxR: 6, dmg: e.dmg, hit: false });
        e.jumps = (e.jumps || 0) + 1;
        if (ph2 && e.jumps < 2) { set(e, 'rec', 0.55); e.again = true; } else { set(e, 'rec', 1.9); e.again = false; e.cd = 0.9; }
      }
    } else if (e.state === 'rec') {
      e.t += dt;
      if (e.t >= e.T) { if (e.again) { e.again = false; set(e, 'jump', 0.9); e.air = true; this.emit('jump', { x: e.x, y: e.y }); } else set(e, 'chase'); }
    }
  };
  G.ai_eater = function (e, dt, dist, toP, room) {
    const p = this.p, z = this.z, ph2 = e.hp < e.maxhp * 0.5;
    const brs = z.objs.filter(o => o.k === 'brazier');
    let lit = 0; for (const b of brs) if (b.lit) lit++;
    e.shroud = lit < 2 && e.state !== 'scorch';
    e.lit = lit;
    for (const b of brs) if (b.snuff > 0) { b.snuff -= dt; if (b.snuff <= 0 && b.lit) { b.lit = false; this.emit('snuff', { x: b.cx, y: b.cy }); } }
    if (e.state === 'scorch') {
      e.t += dt; if (e.t >= e.T) { set(e, 'roar', 0.9); this.emit('roarwind', { x: e.x, y: e.y }); }
      return;
    }
    if (e.state === 'roar') {
      e.t += dt;
      if (e.t >= e.T) {
        for (const b of brs) if (b.lit) { b.lit = false; this.emit('snuff', { x: b.cx, y: b.cy }); }
        z.rings.push({ x: e.x, y: e.y, rad: e.r, speed: 8, maxR: 11, dmg: e.dmg, hit: false });
        this.emit('roar', { x: e.x, y: e.y, big: true }); set(e, 'chase'); e.cd = 1.2; e.snuffT = 9;
      }
      return;
    }
    if (lit >= 4) { set(e, 'scorch', 4.6); e.stun = 0; this.emit('scorch', { x: e.x, y: e.y }); this.say('四つの火が灯喰いを灼く ― 今だ！'); return; }
    e.snuffT = (e.snuffT === undefined ? 7 : e.snuffT) - dt;
    if (e.snuffT <= 0 && lit > 0) {
      const l = brs.filter(b => b.lit && b.snuff <= 0);
      if (l.length) { const b = l[Math.floor(this.rng() * l.length)]; b.snuff = 1.3; this.emit('snuffwarn', { x: b.cx, y: b.cy }); }
      e.snuffT = ph2 ? 6.5 : 9;
    }
    if (e.state === 'chase') {
      this.walk(e, dt, ph2 ? 1.15 : 1, room); e.face = toP;
      if (e.cd <= 0) {
        if (dist < 2.6) { set(e, 'wind', 0.62); e.aim = toP; e.atk = 'sweep'; e.n = ph2 ? 2 : 1; }
        else { e.k = ((e.k || 0) + 1) % 2; if (e.k === 0) { set(e, 'wind', 0.75); e.atk = 'burst'; e.n = ph2 ? 2 : 1; } else { set(e, 'wind', 0.55); e.aim = toP; e.atk = 'dash'; e.n = ph2 ? 3 : 2; } }
      }
    } else if (e.state === 'wind') {
      e.t += dt; if (e.atk !== 'burst' && e.t < e.T - 0.2) { e.aim = toP; e.face = toP; }
      if (e.t >= e.T) {
        if (e.atk === 'sweep') { this.sweep(e, 2.9, 3.0); e.n--; if (e.n > 0) { set(e, 'wind', 0.45); e.aim = toP; } else { set(e, 'rec', 0.95); e.cd = 0.5; } }
        else if (e.atk === 'burst') {
          const N = 12, off = e.n % 2 ? 0 : Math.PI / N;
          for (let i = 0; i < N; i++) { const a = off + i * TAU / N; z.shots.push({ x: e.x, y: e.y, vx: Math.cos(a) * 4.6, vy: Math.sin(a) * 4.6, r: 0.24, dmg: e.dmg - 2, life: 4 }); }
          this.emit('burst', { x: e.x, y: e.y }); e.n--;
          if (e.n > 0) set(e, 'wind', 0.5); else { set(e, 'rec', 1.0); e.cd = 0.6; }
        } else { set(e, 'atk', 0.36); this.emit('dive', { x: e.x, y: e.y }); }
      }
    } else if (e.state === 'atk') {
      e.t += dt; this.move(e, Math.cos(e.aim) * 13 * dt, Math.sin(e.aim) * 13 * dt, true, room); this.touch(e, 0.1);
      if (e.t >= e.T) { e.n--; if (e.n > 0) { set(e, 'wind', 0.42); e.aim = toP; } else { set(e, 'rec', 1.1); e.cd = 0.6; } }
    } else if (e.state === 'rec') { e.t += dt; if (e.t >= e.T) set(e, 'chase'); }
  };

  // ------------------------------------------------------------ hazards
  G.updateHazards = function (dt) {
    const p = this.p, z = this.z;
    for (let i = z.lobs.length - 1; i >= 0; i--) {
      const l = z.lobs[i]; l.t += dt;
      if (l.t >= l.T) {
        z.lobs.splice(i, 1); this.emit('splash', { x: l.tx, y: l.ty, r: l.r });
        if (hypot(p.x - l.tx, p.y - l.ty) < l.r + p.r * 0.5) this.hurt(l.dmg, l.tx, l.ty);
        for (const e of z.enemies) { if (e.dead || e.air || e === l.src || e.d.boss || e.state === 'spawn') continue; if (hypot(e.x - l.tx, e.y - l.ty) < l.r + e.r * 0.5) this.hitEnemy(e, l.dmg * 3, Math.atan2(e.y - l.ty, e.x - l.tx), 8, { power: 3, burst: true }); }
      }
    }
    for (let i = z.rings.length - 1; i >= 0; i--) {
      const r = z.rings[i]; r.rad += r.speed * dt;
      const d = hypot(p.x - r.x, p.y - r.y);
      if (!r.hit && Math.abs(d - r.rad) < 0.35 && p.state !== 'roll') { if (this.hurt(r.dmg, r.x, r.y)) r.hit = true; }
      if (r.rad >= r.maxR) z.rings.splice(i, 1);
    }
    for (let i = z.shots.length - 1; i >= 0; i--) {
      const s = z.shots[i]; s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt;
      const t = this.tile(Math.floor(s.x), Math.floor(s.y));
      if (s.life <= 0 || t === T.ROCK || t === T.SHELF) { z.shots.splice(i, 1); continue; }
      if (hypot(p.x - s.x, p.y - s.y) < s.r + p.r * 0.8) { if (this.hurt(s.dmg, s.x - s.vx, s.y - s.vy)) z.shots.splice(i, 1); }
    }
    for (let i = z.fires.length - 1; i >= 0; i--) {
      const f = z.fires[i]; f.life -= dt; if (f.life <= 0) { z.fires.splice(i, 1); continue; }
      for (const e of z.enemies) {
        if (e.dead || e.air || e.state === 'spawn' || e.burn > this.time) continue;
        if (hypot(e.x - f.x, e.y - f.y) < f.r + e.r) { e.burn = this.time + 0.45; this.hitEnemy(e, f.dmg, 0, 0, { power: 0, burst: true }); }
      }
    }
  };

  EMB.Game = Game;
  EMB.angDiff = angDiff;
  if (typeof module !== 'undefined') module.exports = EMB;
})(typeof window !== 'undefined' ? window : globalThis);
