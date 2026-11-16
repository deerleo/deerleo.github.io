// The theatre of leaves: the cast, group "Machines" (stage 3). The log is docs/build/theatre/3-cast-machines.md.
//
// THIS MODULE DRAWS NOTHING. The stage's machinery was modelled in stage 2 and is moved, every frame, by the set
// (heroes_stage.js, update()): eight wave rollers and their cranks, three cloud cars on four lines each, the moon on its
// wire, the sandbags, the rope walls. The director's decision stands: nobody adds a second motion to those parts. So
// this module steers the ONE motion they have, through the numbers the set reads every frame (shared.stageRig), and
// listens to it:
//   ROLLERS   each roller's own period (a little slower than the page's, no two alike: no pair stays locked together and
//             the stage never repeats); a pace the staging can ease to a stop and back (a heavy thing coasts, and rocks
//             back once as it comes to rest); no ring on the water from a roller that stands; `creak` once a turn, at its
//             catch, from each roller within 12 m of the boat. How: list[i].period and .phase. While a roller's pace is
//             not the page's, its period is made endless and its phase IS its turn (counted here); when it is back at its
//             pace the set's own closed form takes it again without a step.
//   CARS      B and C keep a clock of this module's: the set's cycle, wandering a few seconds either way (no exact 60 s
//             loop), and taking the hour's time when the hour begins (the show setting: B hangs low as the curtain
//             uncovers it and goes up as A comes down; C arrives as the house is full). A keeps the show clock (the
//             set's) until the staging holds or sends it. hold / release / send / put / give. Leaves spill from the bench
//             as a car stops at the bottom (the Leaves group's burstAt); `creak` as a car starts, `knock` as it stops.
//             How: rig.cars[k].C is replaced by an object of this module's ({ clock: 'realm', phase }): the plan's is not touched.
//   MOON      read only (the set takes it from the show clock and publishes nothing to drive): `creak` as it begins to
//             rise, `knock` at the top.
//   ROPES     a ring where the hull drags a rope that hangs in the water, `knock` as the hull first touches one that
//             hangs low enough; a stir for the staging (the draught through the parted cloth); reduced motion.
//             How: rig.ropes.U.uRopeP.x (the sway) and rig.ropes.list.
// Not here: the two travelling cloths and their counterweights (the Cloth group: shared.cast.cloth.fly), the roller's
// own ring (the set writes it), the bags' turn and swing (the set's: no bag hangs within the hull's reach any more).
//
// shared.cast.machines (every call is safe if a part of the set is missing; nothing here plays a sound):
//   on.creak, on.knock, on.rustle     hooks: fn({ x, y, z, near, what, ... }) in the realm's own coordinates; near: metres from the boat
//   rollers.pace(k, seconds, i)       0 stopped .. 1 the page's pace, eased (all eight, a little apart; or roller i)
//   rollers.stop(seconds, i), rollers.start(seconds, i);   rollers.list[i] = { i, at, pace, near, u }
//   cars.hold(name, seconds), cars.release(name, seconds), cars.send(name), cars.put(name, cycleSeconds), cars.give(name),
//   cars.state(name) -> { u, tau, part: 'down' | 'held' | 'up' | 'away', held, bench }
//   moon.u, moon.at, moon.lit         to read
//   ropes.stir(k, seconds)            every hanging rope sways up to (1 + 1.6 k) times as far, rising in a second and dying over `seconds`
//   show(c)                           the show setting, from show clock c (done by itself when the hour begins: auto.show)
//   settle(c)                         everything as it is long after: rollers at their pace, cars on the hour's time, ropes at rest
//   auto.show, auto.spill             set false to do either from the staging
// Developer switches (with ?realm=theatre):  &mdo=stop:2,start:9,holdB:3,releaseB:8,sendC:1,putA:1:20,stir:1,show:0:27,settle:5,say:6
//   (what:at which second of the realm[:a number]; `say` writes where every machine is to the console);  &mlog=1  every hook is written to the console.
import * as THREE from 'three';
import { at, dev } from './lib.js';

const TAU = Math.PI * 2, BIG = 1e9, EDGE = 1e-4;
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const inOut = (x) => { x = clamp01(x); return x * x * (3 - 2 * x); };
const coast = (x) => { x = clamp01(x); return 1 - (1 - x) * (1 - x); };      // a heavy thing let go: it begins to slow at once and takes long to stop
const wrap = (v, T) => ((v % T) + T) % T;

// This group's own numbers (the places and the page's periods are the plan's: plan.rollers, plan.cloudCars, plan.stageRig)
const N = {
  // slower: each roller turns this share slower than the page's period (never faster than 6 s a turn); calm: its pace with reduced motion;
  // takes: seconds to stop or start; stagger: seconds between the first and the last of the eight to begin; ring: under this pace it draws no ring;
  // rock: [turns, seconds a swing, seconds to die]: as it comes to rest its heavy side settles
  rollers: { slower: [0.008, 0.058], calm: 0.6, takes: 6, stagger: 1.4, ring: 0.15, creakWithin: 12, rock: [0.006, 2.6, 1.8] },
  // wander: [seconds, period] added to a car's clock; show: where B and C are in their cycle (seconds) at show clock 0;
  // spill: leaves from the bench at the bottom, in `gusts` handfuls `every` seconds; see: only while the boat is between these s
  cars: { wander: [[2.0, 211], [0.8, 89]], show: { B: 4, C: 50 }, spill: [20, 30], gusts: 4, every: 0.8, see: [60, 121], takes: 3, settleAt: 1 },
  // calm: the sway with reduced motion; stir: how much further a full stir sways them; low: a rope whose end hangs under this height can be touched;
  // within: metres from the boat's middle; ring: what a wet rope writes on the water, `every` seconds while it is dragged; from: only beyond this s
  ropes: { calm: 0.6, stir: 1.6, low: 1.2, within: 1.45, ring: [0.3, 0.5], every: 0.55, from: 118 },
};

export async function build(ctx, plan, shared) {
  shared.cast = shared.cast || {};
  const rig = shared.stageRig || {}, show = shared.show || { c: -1 };
  const stats = { creak: 0, knock: 0, rustle: 0, rings: 0, spilled: 0 };
  const M = shared.cast.machines = { on: { creak: null, knock: null, rustle: null }, auto: { show: true, spill: true }, stats };
  const log = dev.has('mlog');
  let warned = false;
  /** A sound the staging may play: the hook, if one is attached, gets the place and what it is. */
  const fire = (name, p, info = {}) => {
    stats[name]++;
    if (info.near == null) { const b = ctx.boat; info.near = +Math.hypot(p.x - b.x, p.z - b.z).toFixed(1); }      // metres from the boat, on the plan (a roller's: to the nearest of its length)
    if (log) console.error(`machines ${name} t ${ctx.time.toFixed(2)} ${JSON.stringify(info)}`);
    const fn = M.on[name]; if (!fn) return;
    try { fn({ x: p.x, y: p.y, z: p.z, ...info }); } catch (err) { if (!warned) { warned = true; console.warn('theatre/cast_machines: a hook threw (' + ((err && err.message) || err) + ')'); } }
  };
  const boat = { s: 0, d: 0 };

  // ============================================================================================ the wave rollers
  const Ro = plan.rollers, rl = [];
  if (rig.rollers && rig.rollers.list && Ro) {
    const rnd = ctx.rng(7310), half = (Ro.d[1] - Ro.d[0]) / 2;
    rig.rollers.list.forEach((q, i) => {
      q.period *= 1 + N.rollers.slower[0] + (N.rollers.slower[1] - N.rollers.slower[0]) * rnd();      // its own period, for good: the set's closed form goes on with it
      rl.push({ i, q, P: q.period, half, at: at(ctx, q.s, q.d, 0.3), steered: false, u: 0, nWas: null, pace: 1, from: 1, to: 1, t0: -1e9, T: 1, stopped: -1, rock: 0,
        lazy: 0.8 + 0.5 * rnd(), late: rnd(), near: 99 });
    });
  }
  const paceOf = (r, time) => (time >= r.t0 + r.T ? r.to : r.from + (r.to - r.from) * (r.to < r.from ? coast : inOut)((time - r.t0) / r.T));
  const rollers = M.rollers = {
    list: rl,
    /** 0 stopped .. 1 the page's pace, reached over `seconds` (all eight, each a little later and slower than the last; or roller i alone). */
    pace(k = 1, seconds = N.rollers.takes, i = null) {
      k = clamp01(k); const time = ctx.time, all = i == null;
      for (const r of rl) if (all || r.i === i) {
        r.from = paceOf(r, time); r.to = k; r.t0 = time + (all && seconds > 0 ? N.rollers.stagger * r.late : 0); r.T = Math.max(1e-3, seconds * (all ? r.lazy : 1));
      }
      return M;
    },
    stop(seconds, i) { return rollers.pace(0, seconds, i); },
    start(seconds, i) { return rollers.pace(1, seconds, i); },
  };
  let calmK = ctx.reducedMotion ? N.rollers.calm : 1;
  const rockAt = (t) => -N.rollers.rock[0] * (1 - Math.cos(TAU * t / N.rollers.rock[1])) * Math.exp(-t / N.rollers.rock[2]);
  const updateRollers = (dt, time) => {
    const goal = ctx.reducedMotion ? N.rollers.calm : 1;
    calmK += (goal - calmK) * Math.min(1, dt / 1.2); if (Math.abs(goal - calmK) < 2e-3) calmK = goal;
    const seen = ctx.s > 70;
    for (const r of rl) {
      const q = r.q, pace = paceOf(r, time), eff = pace * calmK;
      r.pace = pace;
      if (!r.steered) {
        r.u = time / q.period + q.phase;                                  // (what the set has just drawn)
        if (eff !== 1) { r.steered = true; q.period = BIG; }              // from here its phase is its turn
      }
      if (r.steered) {
        if (eff === 1) { r.steered = false; r.stopped = -1; q.period = r.P; q.phase = r.u - time / r.P; }      // back to the set's closed form, without a step
        else {
          if (eff <= 0) { if (r.stopped < 0) r.stopped = time; r.rock = rockAt(time - r.stopped); }
          else if (r.stopped >= 0) { r.u += r.rock; r.rock = 0; r.stopped = -1; }
          r.u += eff * dt / r.P;
          q.phase = r.u + r.rock;
        }
      }
      if (eff < N.rollers.ring) q.next = Math.max(q.next, time + 1.2);     // a roller that stands breaks no crest
      if (seen) { const ds = boat.s - q.s, dd = Math.max(0, Math.abs(boat.d - q.d) - r.half); r.near = Math.hypot(ds, dd); } else r.near = 99;
      const n = Math.floor(r.u - 0.5);                                    // its catch: where the set's own pace is slowest
      if (r.nWas != null && n !== r.nWas && eff > 0.2 && r.near < N.rollers.creakWithin) fire('creak', r.at, { what: 'roller', i: r.i, near: +r.near.toFixed(1), pace: +eff.toFixed(2) });
      r.nWas = n;
    }
  };

  // ============================================================================================ the cloud cars
  const cyc = (plan.stageRig && plan.stageRig.cars && plan.stageRig.cars.cycle) || [18, 10, 18, 14], T = cyc[0] + cyc[1] + cyc[2] + cyc[3];
  const cl = {};
  const wander = (st, t) => N.cars.wander[0][0] * Math.sin(TAU * t / N.cars.wander[0][1] + st.ph[0]) + N.cars.wander[1][0] * Math.sin(TAU * t / N.cars.wander[1][1] + st.ph[1]);
  const baseAt = (st, t) => (st.ease ? st.ease.from + st.ease.by * inOut((t - st.ease.t0) / st.ease.T) : st.base);
  const tauAt = (st, t) => t + baseAt(st, t) + wander(st, t) - st.lag;      // this module's clock for a car, in seconds of its cycle (not yet wrapped)
  /** Where the set's own clock has a car now (seconds of its cycle). */
  const setTau = (st, time) => { const C = st.C0; if (C.clock !== 'show') return time + (C.phase || 0); const c = show.c; return c >= C.from ? c - C.from + (show.held ? time : 0) : T - 1; };
  const partOf = (p) => (p < cyc[0] ? 'down' : p < cyc[0] + cyc[1] ? 'held' : p < cyc[0] + cyc[1] + cyc[2] ? 'up' : 'away');
  /** Take a car onto this module's clock, where it is. */
  const take = (st) => { if (st.mine) return st; const time = ctx.time || 0; st.ease = null; st.lag = 0; st.base = setTau(st, time) - time - wander(st, time); st.mine = true; st.q.C = st.own; st.own.phase = st.base + wander(st, time); return st; };
  /** Bring a car's clock to `tau` seconds of its cycle: at once (seconds 0: only when it cannot be seen), or by hurrying or dawdling. */
  const rephase = (st, tau, seconds = 0) => {
    const time = ctx.time, by = wrap(tau - tauAt(st, time) + T / 2, T) - T / 2;
    st.base = baseAt(st, time); st.ease = null;
    if (!(seconds > 0)) { st.base += by; st.skip = 2; st.spill = null; }      // (a step nobody sees: and nothing is to be heard of it) else st.ease = { from: st.base, by, t0: time, T: Math.max(seconds, Math.abs(by) / 0.5) };
  };
  const carPace = (st, time) => (time >= st.t0 + st.T ? st.to : st.from + (st.to - st.from) * inOut((time - st.t0) / st.T));
  (rig.cars || []).forEach((q, k) => {
    const rnd = ctx.rng(7400 + k * 13), C0 = q.C || {};
    const st = cl[q.car.name] = { name: q.car.name, q, C0, own: { ...C0, clock: 'realm', phase: C0.phase || 0 }, mine: false, base: C0.phase || 0, lag: 0, ease: null,
      from: 1, to: 1, t0: -1e9, T: 1, holdAt: null, ph: [rnd() * TAU, rnd() * TAU], uWas: null, skip: 2, bench: new THREE.Vector3(), spill: null, rnd };
    if (C0.clock !== 'show') take(st);                                    // B and C: the set's phases, on a clock that wanders
  });
  const cars = M.cars = {
    list: cl,
    /** Hold car `name` where it is: on its way, its clock eases to a stop over `seconds`; at the bottom (or away) it stays there. */
    hold(name, seconds = N.cars.takes) {
      const st = cl[name]; if (!st) return false; take(st);
      const time = ctx.time, p = wrap(tauAt(st, time), T), part = partOf(p);
      // (the set's swing after a stop is counted on the cycle's own seconds: a clock stopped in the middle of it would leave the car leaning. It is held once that has died)
      if (part === 'held') { st.holdAt = cyc[0] + cyc[1] - N.cars.settleAt; return true; }
      if (part === 'away') { st.holdAt = T - N.cars.settleAt; return true; }
      st.holdAt = null; st.from = carPace(st, time); st.to = 0; st.t0 = time; st.T = Math.max(1e-3, seconds); return true;
    },
    /** Let it go on, its clock easing back over `seconds`. */
    release(name, seconds = N.cars.takes) { const st = cl[name]; if (!st) return false; const time = ctx.time; st.holdAt = null; st.from = carPace(st, time); st.to = 1; st.t0 = time; st.T = Math.max(1e-3, seconds); return true; },
    /** Start its descent now. Only while it is up out of sight (true); otherwise nothing happens (false): it comes by itself. */
    send(name) { const st = cl[name]; if (!st) return false; take(st); if (partOf(wrap(tauAt(st, ctx.time), T)) !== 'away') return false; rephase(st, 0, 0); cars.release(name, 0); return true; },
    /** Put it at `tau` seconds of its cycle at once (0 starting down, 18 at the bottom, 28 starting up, 46 away): for a settled picture, not in sight. */
    put(name, tau = 0) { const st = cl[name]; if (!st) return false; take(st); rephase(st, tau, 0); return true; },
    /** Give it back to the set's own clock (A: the show clock). */
    give(name) { const st = cl[name]; if (!st) return false; st.mine = false; st.q.C = st.C0; st.holdAt = null; st.from = st.to = 1; st.lag = 0; st.skip = 2; return true; },
    state(name) {
      const st = cl[name]; if (!st) return null;
      const p = wrap(st.mine ? tauAt(st, ctx.time) : setTau(st, ctx.time), T);
      return { u: st.q.u, tau: p, part: partOf(p), held: st.mine && (st.to === 0 || st.holdAt != null), bench: st.q.model.point('bench', st.bench) };
    },
  };
  const updateCars = (dt, time) => {
    const tn = time + dt;                                                 // (the set reads a car's clock on the next frame)
    for (const name in cl) {
      const st = cl[name], q = st.q;
      if (st.mine) {
        if (st.ease && time >= st.ease.t0 + st.ease.T) { st.base = st.ease.from + st.ease.by; st.ease = null; }
        if (st.holdAt != null) { const p = wrap(tauAt(st, time), T); if (p >= st.holdAt && p < st.holdAt + N.cars.settleAt) { st.holdAt = null; st.from = st.to = 0; st.t0 = -1e9; } }
        const k = carPace(st, time);
        if (k !== 1) st.lag += (1 - k) * (tauAt(st, tn) - tauAt(st, time));      // (what its clock would have gone on by, wander and all: a held car is still)
        st.own.phase = wrap(tauAt(st, tn), T) + T - tn;                    // (always a whole cycle ahead of nought: the set reads a clock under nought as "not yet")
      }
      // ---- what the set has just done with it
      const u = q.u, was = st.uWas; st.uWas = u;
      if (st.skip > 0) { st.skip--; continue; }
      if (was == null || u == null) continue;
      const p = q.model.group.position;
      if (was <= EDGE && u > EDGE) fire('creak', p, { what: 'car', name, part: 'down' });
      if (was >= 1 - EDGE && u < 1 - EDGE) fire('creak', p, { what: 'car', name, part: 'up' });
      if (was > EDGE && u <= EDGE) fire('knock', p, { what: 'car', name, part: 'top' });
      if (was < 1 - EDGE && u >= 1 - EDGE) {
        fire('knock', p, { what: 'car', name, part: 'bottom' });
        // the leaves that lay on its bench go over the side as it stops and swings: a handful at each swing (the Leaves group's burst)
        if (M.auto.spill && ctx.s > N.cars.see[0] && ctx.s < N.cars.see[1]) {
          const n = Math.round((N.cars.spill[0] + (N.cars.spill[1] - N.cars.spill[0]) * st.rnd()) * (ctx.reducedMotion ? 0.6 : 1));
          st.spill = { each: Math.max(1, Math.round(n / N.cars.gusts)), left: N.cars.gusts, next: time + 0.35, n };
        }
      }
      if (st.spill && time >= st.spill.next) {
        const L = shared.cast.leaves, sp = st.spill;
        sp.next = time + N.cars.every; sp.left--;
        q.model.point('bench', st.bench);
        // (check false: the Leaves group keeps the air clear of each car's whole way, so a leaf that starts ON a car is refused by its own check; under every bench at
        // its lowest there is open water: A and C over the stage, B between two ranks of rollers)
        if (L && L.burstAt) { stats.spilled += L.burstAt(st.bench, { count: sp.each, radius: 0.16 * q.car.width, height: 0.1, over: N.cars.every, delay: 0, check: false }) || 0; }
        if (sp.left === N.cars.gusts - 1) fire('rustle', st.bench, { what: 'car leaves', name, count: sp.n });
        if (sp.left <= 0) st.spill = null;
      }
    }
  };

  // ============================================================================================ the show setting, the settled state
  let shown = false;
  /** The machines keep the hour: from show clock `c`, B and C take the hour's time (`seconds` 0: at once, while the curtain hides them). */
  M.show = (c = show.c, seconds = 0) => {
    if (!(c >= 0)) return M;
    shown = true;
    for (const name in N.cars.show) { const st = cl[name]; if (st) { take(st); rephase(st, c + N.cars.show[name] + (show.held ? ctx.time : 0), seconds); } }
    return M;
  };
  /** Everything as it is long after (for a picture taken further on): rollers at their pace, cars on the hour's time and let go, ropes at rest. */
  M.settle = (c = show.c) => {
    for (const r of rl) { r.from = r.to = 1; r.t0 = -1e9; r.T = 1; }
    for (const name in cl) { const st = cl[name]; st.holdAt = null; st.from = st.to = 1; st.t0 = -1e9; st.spill = null; st.skip = 2; if (st.C0.clock === 'show') cars.give(name); }
    if (c >= 0) M.show(c, 0);
    stir.v = 0; stir.until = -1;
    return M;
  };

  // ============================================================================================ the moon (to read) and the ropes
  M.moon = { get u() { return rig.moonU || 0; }, get at() { return rig.moonAt || null; }, get lit() { return rig.moonOn || 0; } };
  let moonWas = null;
  const RU = rig.ropes && rig.ropes.U && rig.ropes.U.uRopeP ? rig.ropes.U.uRopeP.value : null, sway0 = RU ? RU.x : 0;
  const low = RU && rig.ropes.list ? rig.ropes.list.map((q, i) => ({ q, i, wet: q.end === 'wet', in: false, next: 0 })).filter((t) => t.q.free && t.q.bottom && t.q.bottom.y < N.ropes.low) : [];
  const stir = { v: 0, k: 0, until: -1, die: 8 }, foot = new THREE.Vector3();
  M.ropes = {
    low,
    /** The draught takes the hanging ropes: they sway up to (1 + 1.6 k) times as far, rising in about a second and dying over `seconds`. */
    stir(k = 1, seconds = 8) { stir.k = Math.max(0, k); stir.until = ctx.time + 1.2; stir.die = Math.max(0.5, seconds); return M; },
    get stirNow() { return stir.v; },
  };
  const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
  const updateRopes = (dt, time) => {
    if (!RU) return;
    const rising = time < stir.until;
    stir.v += ((rising ? stir.k : 0) - stir.v) * Math.min(1, dt / (rising ? 0.5 : stir.die / 3)); if (!rising && stir.v < 1e-3) stir.v = 0;
    RU.x = sway0 * (ctx.reducedMotion ? N.ropes.calm : 1) * (1 + N.ropes.stir * stir.v);
    if (ctx.s < N.ropes.from) return;
    const b = ctx.boat;
    for (const t of low) {
      const dx = t.q.bottom.x - b.x, dz = t.q.bottom.z - b.z, dist = Math.hypot(dx, dz), inNow = dist < N.ropes.within;
      if (inNow && (!t.in || time >= t.next)) {
        // where its end is now: pushed away from the hull, as the set's shader pushes it
        const k = dist > 1e-3 ? (1 - smooth(0.7, RU.w, dist)) * RU.z / dist : 0;
        foot.set(t.q.bottom.x + dx * k, 0.3, t.q.bottom.z + dz * k);
        if (t.wet) { ctx.water.ripple(foot.x, foot.z, N.ropes.ring[0], N.ropes.ring[1]); stats.rings++; }
        if (!t.in) fire('knock', foot, { what: 'rope', i: t.i, wet: t.wet, last: !!t.q.last });
        t.next = time + N.ropes.every;
      } else if (!inNow && t.in && t.wet) { ctx.water.ripple(t.q.bottom.x, t.q.bottom.z, N.ropes.ring[0] * 0.7, N.ropes.ring[1]); stats.rings++; }      // it falls back
      t.in = inNow;
    }
  };

  // ============================================================================================ a developer's script, to look at each handle
  const script = (dev.get('mdo') || '').split(',').filter(Boolean).map((w) => { const [what, t, a] = w.split(':'); return { what, t: +t || 0, a: a != null && a !== '' ? +a : undefined, done: false }; });
  const act = (j) => {
    const w = j.what, car = /[ABC]$/.test(w) ? w.slice(-1) : null, verb = car ? w.slice(0, -1) : w;
    if (verb === 'stop') rollers.stop(j.a); else if (verb === 'start') rollers.start(j.a); else if (verb === 'pace') rollers.pace(j.a ?? 0.5);
    else if (verb === 'hold' && car) cars.hold(car, j.a); else if (verb === 'release' && car) cars.release(car, j.a); else if (verb === 'send' && car) cars.send(car);
    else if (verb === 'put' && car) cars.put(car, j.a ?? 0); else if (verb === 'give' && car) cars.give(car);
    else if (verb === 'stir') M.ropes.stir(j.a ?? 1); else if (verb === 'show') M.show(j.a ?? show.c, 0); else if (verb === 'settle') M.settle(j.a ?? show.c);
    else if (verb === 'say') console.error('machines say t ' + ctx.time.toFixed(2) + ' c ' + (+show.c).toFixed(1) + ' rollers ' + rl.map((r) => `${r.u.toFixed(3)}@${(+r.pace).toFixed(2)}${r.steered ? 's' : ''}`).join(' ')
      + ' cars ' + Object.keys(cl).map((n) => { const z = cars.state(n); return `${n}:${z.part} u ${(+z.u).toFixed(3)} tau ${z.tau.toFixed(1)}${z.held ? ' held' : ''}${cl[n].mine ? '' : ' (set)'}`; }).join(', ')
      + ' moon ' + (+M.moon.u).toFixed(3) + ' sway ' + (RU ? RU.x.toFixed(3) : '-') + ' low ropes ' + low.length + ' (wet ' + low.filter((t) => t.wet).length + ') ' + JSON.stringify(stats));
  };

  return {
    update(dt) {
      const time = ctx.time, t0 = log ? performance.now() : 0;
      for (const j of script) if (!j.done && time >= j.t) { j.done = true; act(j); }
      if (ctx.s > 70) { const q = ctx.path.locate(ctx.boat.x, ctx.boat.z, ctx.s); boat.s = q.s; boat.d = q.d; }
      // the hour begins: B and C take its time (at once while the curtain still hides them, else by hurrying or dawdling)
      if (M.auto.show && !shown && show.c >= 0) M.show(show.c, time < 0.6 || (show.c < 13 && ctx.s < 88) ? 0 : 12);
      updateRollers(dt, time);
      updateCars(dt, time);
      if (rig.moonU != null) {
        const u = rig.moonU;
        if (moonWas != null && rig.moonAt) {
          if (moonWas <= EDGE && u > EDGE) fire('creak', rig.moonAt, { what: 'moon', part: 'rise' });
          if (moonWas < 1 - EDGE && u >= 1 - EDGE) fire('knock', rig.moonAt, { what: 'moon', part: 'top' });
        }
        moonWas = u;
      }
      updateRopes(dt, time);
      if (log) { stats.ms = +((stats.ms || 0) + performance.now() - t0).toFixed(3); stats.frames = (stats.frames || 0) + 1; }      // (&mlog=1: what this module's own frame costs, summed)
    },
  };
}
