// Old machinery still turning. The page is docs/life/ribbons.md.
//
// A machine here is rigid parts turned by PHASE: where each part is follows from one number, the machine's phase at
// the realm's time, never from adding up a step every frame. So a picture taken twice is the same picture, a machine
// seen for the first time is already in the middle of its work, and parts that are geared together cannot drift.
// A cue may set a machine's phase, ask it to arrive at a phase by a moment (it hurries or dawdles a little to get
// there), or ease its pace. Nothing here starts a machine from rest: there is no rest to start from.
//
//   makeMachine(ctx, opts)       a shaft: turn() parts with it, gear() other shafts to it so that their teeth mesh,
//                                drive() anything from its phase; or a cycle of moves and holds (a wringer, a beam)
//   makeEscapement(ctx, opts)    a pendulum, its anchor and an escape wheel that ticks: step, recoil, step
//   makePendulum(ctx, opts)      one hanging thing that swings and settles (a chandelier, a bell, a moon on a wire)
//   makeWaterWheel(ctx, opts)    a wheel the current turns, its floats shedding water that rings the surface
//   makeRotors(ctx, opts)        many copies of one turning part in one draw call (far wheels, wringers)
//   lineTo(ctx, ropes, i, from, to), counterweight(ctx, opts)    ropes that reach their loads; a weight that rises as its cloth falls
import * as THREE from 'three';
import { lifeClock } from './ribbons.js';

const TAU = Math.PI * 2;
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const inOut = (t) => t * t * (3 - 2 * t);
// how far through a nudge the phase is, 0..1: its pace eases in over the first fifth, holds, and eases out over the last fifth
const RAMP = 0.2;
const smoother = (x) => {
  const part = (u) => RAMP * (u * u * u - 0.5 * u * u * u * u);                // the integral of a smooth step over one ramp
  if (x <= 0) return 0; if (x >= 1) return 1;
  const area = x < RAMP ? part(x / RAMP) : x <= 1 - RAMP ? RAMP / 2 + (x - RAMP) : (1 - RAMP) - part((1 - x) / RAMP);
  return area / (1 - RAMP);
};
const AX = { x: new THREE.Vector3(1, 0, 0), y: new THREE.Vector3(0, 1, 0), z: new THREE.Vector3(0, 0, 1) };
const _q = new THREE.Quaternion(), _v = new THREE.Vector3(), _v2 = new THREE.Vector3();

// Every shaft, pendulum and follower of a realm is moved by one update, in the order they were made
const BENCH = new WeakMap();
function bench(ctx) {
  let b = BENCH.get(ctx);
  if (!b) { b = []; BENCH.set(ctx, b); ctx.onUpdate((dt) => { for (const fn of b) fn(dt); }); }
  return b;
}
const where = (p, out) => (typeof p === 'function' ? where(p(), out) : p && p.isObject3D ? p.getWorldPosition(out) : p && p.isVector3 ? out.copy(p) : out.set(p[0], p[1], p[2]));

/** Turn `object` about one of its own axes to `angle` radians, on top of the rotation it was given when it was placed. */
function turner(object, axis = 'z') {
  const base = object.quaternion.clone(), ax = typeof axis === 'string' ? AX[axis] : new THREE.Vector3(axis[0], axis[1], axis[2]).normalize();
  return (angle) => { object.quaternion.copy(base).multiply(_q.setFromAxisAngle(ax, angle)); };
}

class Shaft {
  constructor(ctx, angleAt) { this.ctx = ctx; this.angleAt = angleAt; this.followers = []; }
  /** Radians this shaft has turned, now. */
  get angle() { return this.angleAt(this.ctx.time); }
  /**
   * Turn a part with this shaft. o: { axis: 'x' | 'y' | 'z' | [x, y, z] (the part's own axis it turns about; a model's
   * moving part turns about the axis it was modelled on: Blender's Y is the ride's -Z), sign: 1 | -1, offset: radians }.
   */
  turn(object, o = {}) {
    const set = turner(object, o.axis || 'z'), sign = o.sign ?? 1, off = o.offset ?? 0;
    this.followers.push(() => set(sign * this.angle + off));
    return this;
  }
  /** Call fn(angle, shaft) every frame: for anything that is not a plain turn (a crank's rod, a cam, a sound). */
  drive(fn) { this.followers.push(() => fn(this.angle, this)); return this; }
  /**
   * A second shaft geared to this one so that the teeth mesh. o:
   *   teeth: [n1, n2]     teeth on this wheel and on the other
   *   at                  where the two wheels meet, as an angle in THIS wheel's plane (radians, measured the way this
   *                       shaft's own angle is). Default 0
   *   atOther             the same place as an angle in the OTHER wheel's plane. Default: `at` + half a turn, which is
   *                       right for two wheels side by side in one plane; a crown wheel and its pinion give their own
   *   tooth: [a1, a2]     the angle, on each wheel as modelled, at which one tooth stands (default [0, 0])
   *   internal            true if the other wheel's teeth point inward (it then turns the same way)
   *   sign                the way the other turns relative to this one; default -1 (1 if internal). A crown wheel and
   *                       pinion on crossed axes: say which, the worked example shows how to find it
   * The other shaft's angle is sign * angle * n1 / n2 + the offset that puts a gap of the other wheel where a tooth
   * of this one arrives.
   */
  gear(o = {}) {
    const [n1, n2] = o.teeth, sign = o.sign ?? (o.internal ? 1 : -1), ratio = sign * n1 / n2;
    const at = o.at ?? 0, atOther = o.atOther ?? at + Math.PI, t = o.tooth || [0, 0];
    // when this wheel has a tooth at `at` (it has turned by at - t[0]), the other must have a gap at `atOther`
    const c = atOther - t[1] - Math.PI / n2 - ratio * (at - t[0]);
    const child = new Shaft(this.ctx, (time) => ratio * this.angleAt(time) + c);
    child.ratio = ratio; child.parent = this;
    this.followers.push(() => { for (const f of child.followers) f(); });
    return child;
  }
  /** A shaft on the same arbor (or joined by a belt): `ratio` turns for each turn of this one. */
  with(ratio = 1, offset = 0) {
    const child = new Shaft(this.ctx, (time) => ratio * this.angleAt(time) + offset);
    this.followers.push(() => { for (const f of child.followers) f(); });
    return child;
  }
}

/**
 * A machine. opts:
 *   period       seconds for one turn (or one cycle); or
 *   steps        [[seconds, value], ...]: a cycle of moves and holds. The machine's `value` goes to each value over
 *                its seconds, eased so that it starts and stops with weight, and holds wherever two values are equal;
 *                the cycle then repeats. A wringer: [[5, 3.5], [2, 3.5], [4, 0], [5, 0]] (turns of twist)
 *   phase        0..1: where in its turn or cycle it is when the realm begins (give neighbours different ones)
 *   direction    1 | -1: which way it turns
 * Returns a shaft (turn, gear, drive, with) that is also the clock:
 *   phase              turns since the realm began (a fraction for a cycle: use `at`); angle: radians; value: the cycle's value
 *   at                 0..1 within the present turn or cycle
 *   setPhase(p)        be at p (0..1) now. Only for before it is seen (a cue's settle, a part still out of sight)
 *   arrive(p, seconds, { nudge })   be at p in `seconds` from now: it runs a little faster or slower on the way, by
 *                      no more than `nudge` (default 0.2) of its pace, and takes the shorter way round. Returns how much
 *                      of the correction it could make (1 = it will be there). What it can make up is
 *                      nudge x 0.8 x seconds / period of a turn: ask early (a wheel that turns in 120 s can be brought
 *                      3.8 degrees in 10 s; a 16 s cycle can be brought a tenth of its cycle in 10 s)
 *   ease(factor, seconds)           change its pace to `factor` times its own (0.25 to 4), over `seconds`
 *   every(p, fn)       call fn(machine) each time it passes p in its turn (the knock of a float, the top of a pour)
 *   period, rate
 */
export function makeMachine(ctx, opts = {}) {
  const o = { period: null, steps: null, phase: 0, direction: 1, ...opts };
  let total = o.period;
  if (o.steps) total = o.steps.reduce((a, s) => a + s[0], 0);
  if (!(total > 0)) throw new Error('makeMachine: give a period or steps');
  const base = 1 / total;
  // the clock: phase = p0 + rate * (t - t0) + a ramp of pace in progress + nudges in progress. All closed form.
  const C = { p0: o.phase, t0: 0, rate: base, ramp: null, nudges: [] };
  const rateAt = (t) => { const r = C.ramp; if (!r) return C.rate; const x = clamp01((t - r.t0) / r.dur); return C.rate + (r.to - C.rate) * inOut(x); };
  const phaseAt = (t) => {
    let p = C.p0 + C.rate * (t - C.t0);
    const r = C.ramp;
    if (r && t > r.t0) { const x = clamp01((t - r.t0) / r.dur); p += (r.to - C.rate) * (r.dur * (x * x * x - 0.5 * x * x * x * x) + Math.max(0, t - r.t0 - r.dur)); }
    for (const n of C.nudges) p += n.d * smoother(clamp01((t - n.t0) / n.dur));
    return p;
  };
  const fold = (t) => {                              // put what has finished into the base, so the sums stay short
    C.nudges = C.nudges.filter((n) => { if (t >= n.t0 + n.dur) { C.p0 += n.d; return false; } return true; });
    if (C.ramp && t >= C.ramp.t0 + C.ramp.dur) { const p = phaseAt(t) - C.nudges.reduce((a, n) => a + n.d * smoother(clamp01((t - n.t0) / n.dur)), 0); C.rate = C.ramp.to; C.ramp = null; C.p0 = p; C.t0 = t; }
  };
  const m = new Shaft(ctx, (t) => o.direction * TAU * phaseAt(t));
  const marks = [];
  // the cycle's value at a place in the cycle
  let valueAt = null;
  if (o.steps) {
    const st = o.steps, n = st.length;
    valueAt = (f) => {
      let t = (f - Math.floor(f)) * total, prev = st[n - 1][1];
      for (let i = 0; i < n; i++) { if (t <= st[i][0] || i === n - 1) return prev + (st[i][1] - prev) * inOut(clamp01(t / st[i][0])); t -= st[i][0]; prev = st[i][1]; }
      return prev;
    };
  }
  Object.defineProperties(m, {
    phase: { get: () => phaseAt(ctx.time) },
    at: { get: () => { const p = phaseAt(ctx.time); return p - Math.floor(p); } },
    value: { get: () => (valueAt ? valueAt(phaseAt(ctx.time)) : phaseAt(ctx.time)) },
    rate: { get: () => rateAt(ctx.time) },
  });
  m.period = total; m.direction = o.direction; m.phaseAt = phaseAt; m.valueAt = valueAt;
  m.setPhase = (p) => { const now = phaseAt(ctx.time); C.p0 += (p - (now - Math.floor(now))); return m; };
  m.arrive = (p, seconds, a = {}) => {
    const t = ctx.time, T = Math.max(0.5, seconds), nudge = a.nudge ?? 0.2;
    const then = phaseAt(t + T); let d = p - (then - Math.floor(then)); d -= Math.round(d);          // the shorter way round
    const most = nudge * rateAt(t) * T * (1 - RAMP), got = Math.max(-most, Math.min(most, d));      // what its pace can make up in the time
    if (Math.abs(got) > 1e-6) C.nudges.push({ t0: t, dur: T, d: got });
    return Math.abs(d) < 1e-9 ? 1 : got / d;
  };
  m.ease = (factor, seconds = 4) => {
    const t = ctx.time; fold(t);
    const now = rateAt(t), p = phaseAt(t) - C.nudges.reduce((s, n) => s + n.d * smoother(clamp01((t - n.t0) / n.dur)), 0);
    C.p0 = p; C.t0 = t; C.rate = now; C.ramp = { t0: t, dur: Math.max(0.05, seconds), to: base * Math.max(0.25, Math.min(4, factor)) };
    return m;
  };
  m.every = (p, fn) => { marks.push({ p, fn, last: Math.floor(phaseAt(ctx.time) - p) }); return m; };
  bench(ctx).push(() => {
    const t = ctx.time; fold(t);
    for (const f of m.followers) f();
    if (marks.length) { const ph = phaseAt(t); for (const k of marks) { const n = Math.floor(ph - k.p); if (n !== k.last) { k.last = n; k.fn(m); } } }
  });
  return m;
}

/**
 * An anchor escapement under its pendulum. The pendulum swings; the anchor rocks with it; the escape wheel is let
 * through half a tooth at each swing: it drops onto a pallet (the tick), is pushed BACK a little as the pendulum
 * swings on (the recoil), then follows the pallet round until it is let go again. opts:
 *   period       seconds for the pendulum's whole swing, there and back (the town's: 6; a tick every 3)
 *   amplitude    radians either side (0.122 = 7 degrees)
 *   teeth        on the escape wheel (30: it steps 6 degrees a tick)
 *   recoil       how far it is pushed back, as a share of a step (0.12); drop: the share of a step it falls free (0.1)
 *   phase        0..1 of the pendulum's swing when the realm begins; direction: the way the wheel turns
 * Returns {
 *   pendulum     a shaft whose angle is the pendulum's swing: clock.pendulum.turn(model.parts.pendulum, { axis: 'z' })
 *                (turn the anchor with it too: they are one piece)
 *   wheel        a shaft: the escape wheel; gear the going train and the hands to it: wheel.gear({ teeth: [8, 60] })
 *   onTick(fn)   fn(side, clock) each time a tooth lands (side: 1 or -1): the tick. It lands when the pendulum is most of
 *                the way out, not at the middle
 *   onPass(fn)   fn(direction, clock) each time the pendulum passes the bottom of its swing (a bob that kisses the water)
 *   swingAt(t), stepAt(t)   the pendulum's angle and the wheel's angle at any time
 * }
 */
export function makeEscapement(ctx, opts = {}) {
  const o = { period: 6, amplitude: 0.122, teeth: 30, recoil: 0.12, drop: 0.1, phase: 0, direction: 1, ...opts };
  const T = o.period, d = o.drop, del = 0.16;                                                              // the drop takes a little of the swing
  // where in its swing the pendulum is when a tooth lands, so that the wheel is pushed back by just the recoil asked
  let lo = 0.3, hi = 0.999;
  for (let i = 0; i < 40; i++) { const x = (lo + hi) / 2, r = (1 - d) * (1 - x) / (x + Math.sin(Math.asin(x) - del)); if (r > o.recoil) lo = x; else hi = x; }
  const xL = (lo + hi) / 2, phL = Math.asin(xL);
  const xR = -Math.sin(phL - del), K = (1 - d) / (xL - xR), step = Math.PI / o.teeth;
  const swingAt = (t) => o.amplitude * Math.sin(TAU * (t / T + o.phase));
  // the wheel, in half-teeth: whole steps done, plus how far through the present one
  const stepsAt = (t) => {
    const ph = TAU * (t / T + o.phase) - phL, k = Math.floor(ph / Math.PI), f = ph - k * Math.PI + phL;        // f runs from phL to phL + pi
    let g;
    if (f <= Math.PI + phL - del) g = K * (xL - Math.sin(f));                                                 // held by the pallet: back a little, then round with it
    else { const q = (f - (Math.PI + phL - del)) / del; g = 1 - d + d * q * q; }                             // let go: it falls, gathering way, onto the other pallet
    return k + g;
  };
  const pendulum = new Shaft(ctx, swingAt), wheel = new Shaft(ctx, (t) => o.direction * step * stepsAt(t));
  const ticks = [], passes = [];
  let last = Math.floor((TAU * (ctx.time / T + o.phase) - phL) / Math.PI), lastPass = Math.floor((ctx.time / T + o.phase) * 2);
  bench(ctx).push(() => {
    for (const f of pendulum.followers) f();
    for (const f of wheel.followers) f();
    const k = Math.floor((TAU * (ctx.time / T + o.phase) - phL) / Math.PI);
    if (k !== last) { last = k; for (const fn of ticks) fn(k % 2 === 0 ? 1 : -1, api); }
    const h = Math.floor((ctx.time / T + o.phase) * 2);
    if (h !== lastPass) { lastPass = h; for (const fn of passes) fn(h % 2 === 0 ? 1 : -1, api); }
  });
  const api = { pendulum, wheel, period: T, swingAt, stepAt: (t) => o.direction * step * stepsAt(t), onTick(fn) { ticks.push(fn); return api; }, onPass(fn) { passes.push(fn); return api; } };
  return api;
}

/**
 * One thing that hangs and swings: a chandelier on its chain, a bell, a pail, a painted moon on a wire. It keeps a small
 * swing of its own, takes a push, and settles. (For many alike use makeHangers in ropes.js.) opts:
 *   object       what swings; it is turned about its own pivot (a model's moving part hangs at its pivot)
 *   axis         'x' | 'z' | [x, y, z]: the axis it swings about (its own); axis2: a second, for a thing free both ways
 *   period       seconds (or length: metres from pivot to its middle, from which the period follows)
 *   amplitude    radians it keeps swinging in still air (0.02); settle: seconds to lose most of a push (12)
 *   phase
 * Returns { push(radians per second, second axis?), angle, swingTo(radians) (lean it and let go), rest(radians) }.
 */
export function makePendulum(ctx, opts = {}) {
  const o = { object: null, axis: 'z', axis2: null, period: null, length: 1, amplitude: 0.02, settle: 12, phase: 0, ...opts };
  const w = o.period ? TAU / o.period : Math.sqrt(9.81 / o.length), g = 1 / o.settle, wd = Math.sqrt(Math.max(w * w - g * g, 1e-6));
  const st = [0, 0, 0, 0], rest = [0, 0];
  const base = o.object ? o.object.quaternion.clone() : null;
  const a1 = typeof o.axis === 'string' ? AX[o.axis] : new THREE.Vector3(...o.axis).normalize(), a2 = o.axis2 ? (typeof o.axis2 === 'string' ? AX[o.axis2] : new THREE.Vector3(...o.axis2).normalize()) : null;
  const stepOne = (k, r, dt) => { const e = Math.exp(-g * dt), c = Math.cos(wd * dt), s = Math.sin(wd * dt), x = st[k] - r, v = st[k + 1]; st[k] = r + e * (x * c + ((v + g * x) / wd) * s); st[k + 1] = e * (v * c - ((w * w * x + g * v) / wd) * s); };
  const q2 = new THREE.Quaternion();
  const api = {
    get angle() { return st[0] + o.amplitude * Math.sin(w * ctx.time + o.phase * TAU); },
    get angle2() { return st[2] + (a2 ? o.amplitude * 0.6 * Math.sin(w * 0.93 * ctx.time + o.phase * 11) : 0); },
    push(v, v2 = 0) { st[1] += v; st[3] += v2; return api; },
    swingTo(a, a2v = 0) { st[0] = a; st[2] = a2v; return api; },
    rest(a, a2v = 0) { rest[0] = a; rest[1] = a2v; return api; },
    period: TAU / w,
  };
  bench(ctx).push((dt) => {
    stepOne(0, rest[0], dt); if (a2) stepOne(2, rest[1], dt);
    if (o.object) { o.object.quaternion.copy(base).multiply(_q.setFromAxisAngle(a1, api.angle)); if (a2) o.object.quaternion.multiply(q2.setFromAxisAngle(a2, api.angle2)); }
  });
  return api;
}

/**
 * A wheel turned by the current. Its pace is not chosen, it follows: the floats at the bottom move downstream at
 * `slip` times the water's speed. As each float climbs out of the water it sheds drops for a quarter of a turn; they
 * fall as the turning rim threw them, and each one that lands rings the water. opts:
 *   object       the rotor (a model's moving part), turned about its own `axis` ('x' | 'y' | 'z'; default 'z': a part
 *                modelled to turn about Blender's Y). Leave it out to get the motion only (wheel.angle)
 *   at: [x, y, z]   the middle of the axle, in the realm (default: the object's own place)
 *   axle: [x, z]    the way the axle lies, on the level (default: across the route at that place)
 *   radius, width   metres to the tips of the floats, and the floats' width along the axle
 *   floats       how many (12)
 *   flow         m/s of water past it (default: the realm's current); flowDir: [x, z] (default: down the route there)
 *   slip         0.8: the floats go this much slower than the water (a wheel doing work)
 *   drips        drops shed by the floats in each turn of the wheel (240; 0 for none); dripColor (default: the realm's
 *                own water, a little paler; give the dye's colour where the water is dyed); dripSize (0.011 m); glow (0.35:
 *                how much they light against the sun)
 *   rings        true: the drops that land ring the water; onTouch(x, z, kind): 'drip' for a drop, 'float' as each float goes in
 *   phase
 * Returns the machine (a shaft: gear its pinion to it, ease it, arrive) with { object: the drops, floatsPassed() }.
 */
export function makeWaterWheel(ctx, opts = {}) {
  const { kit } = ctx, clock = lifeClock(ctx);
  const o = { object: null, axis: 'z', at: null, axle: null, radius: 1.6, width: 0.8, floats: 12, flow: null, flowDir: null, slip: 0.8, drips: 240, dripColor: null, dripSize: 0.011, glow: 0.35, rings: true, onTouch: null, phase: 0, sign: null, ...opts };
  // the drops are the water's own colour, a little paler (never white: a white speck is glitter, not water)
  const wl = ctx.waterLook && ctx.waterLook.shallow, dripColor = o.dripColor || (wl && wl.isColor ? '#' + wl.clone().lerp(new THREE.Color('#e4ecf0'), 0.5).getHexString() : '#9fb2bf');
  const C = o.at ? new THREE.Vector3(o.at[0], o.at[1], o.at[2]) : o.object.getWorldPosition(new THREE.Vector3());
  const loc = ctx.path.locate(C.x, C.z), here = ctx.path.at(loc.s);
  const fd = o.flowDir ? new THREE.Vector2(o.flowDir[0], o.flowDir[1]).normalize() : new THREE.Vector2(here.tx, here.tz);
  const ax = o.axle ? new THREE.Vector2(o.axle[0], o.axle[1]).normalize() : new THREE.Vector2(-fd.y, fd.x);
  const flow = o.flow ?? (ctx.look && ctx.look.current) ?? 2, R = o.radius;
  const period = TAU * R / Math.max(0.05, o.slip * flow);
  // which way round: the bottom of the wheel must go with the water. A turn by +angle about the axle a carries the
  // bottom of the wheel toward (a.z, -a.x) on the level
  const turnSign = Math.sign(ax.y * fd.x - ax.x * fd.y) || 1;
  const m = makeMachine(ctx, { period, phase: o.phase, direction: turnSign });
  if (o.object) {
    // the part's own axis may point either way along the axle once the model is placed: find out, and turn it to suit
    o.object.updateWorldMatrix(true, false);
    const local = (typeof o.axis === 'string' ? AX[o.axis] : new THREE.Vector3(...o.axis)).clone().normalize();
    const world = local.transformDirection(o.object.matrixWorld), along = world.x * ax.x + world.z * ax.y;
    m.turn(o.object, { axis: o.axis, sign: o.sign ?? (along >= 0 ? 1 : -1) });
  }
  m.radius = R; m.axle = ax; m.centre = C;
  let drops = null;
  const N = o.floats, K = Math.max(0, Math.round(o.drips / N));
  // the place and the pace of the rim at a wheel angle a (measured from straight down, the way it turns)
  const rim = (a, across, out) => { const s = Math.sin(a), c = Math.cos(a); return out.set(C.x + fd.x * R * s + ax.x * across, C.y - R * c, C.z + fd.y * R * s + ax.y * across); };
  // a float leaves the water at angle a0, and sheds its drops over the next quarter turn, most of them early
  const depth = Math.max(-1, Math.min(1, C.y / R)), a0 = Math.acos(depth);                // where the rim crosses the surface, rising
  const slots = [];
  if (K > 0) {
    const rnd = ctx.rng(o.seed ?? 77);
    for (let j = 0; j < N; j++) for (let k = 0; k < K; k++) {
      const late = Math.pow((k + rnd()) / K, 1.7) * 1.45, a = a0 + 0.04 + late, across = (rnd() - 0.5) * o.width * 0.92;
      // released at wheel angle `a` (turns: a / TAU) by float j, whose own angle is its place on the wheel plus the wheel's
      slots.push({ rel: (a / TAU - j / N), a, across, seed: rnd(), tLand: 0, x: 0, z: 0, last: 0 });
    }
    const w = TAU / period;
    for (const s of slots) {
      const y0 = C.y - R * Math.cos(s.a), vy = w * R * Math.sin(s.a), vh = w * R * Math.cos(s.a);
      s.tLand = (vy + Math.sqrt(vy * vy + 2 * 9.81 * Math.max(y0, 0))) / 9.81;
      s.x = C.x + fd.x * (R * Math.sin(s.a) + vh * s.tLand) + ax.x * s.across; s.z = C.z + fd.y * (R * Math.sin(s.a) + vh * s.tLand) + ax.y * s.across;
      s.last = Math.floor(m.phase - s.rel - s.tLand / period);
    }
    // the drops: a slender bead drawn out along its fall (never a diamond), one draw call
    const bead = new THREE.OctahedronGeometry(1, 0).toNonIndexed(); bead.computeVertexNormals();
    const geo = new THREE.InstancedBufferGeometry(); geo.setAttribute('position', bead.attributes.position); geo.setAttribute('normal', bead.attributes.normal);
    const aSlot = new Float32Array(slots.length * 4);
    slots.forEach((s, i) => aSlot.set([s.rel, s.a, s.across, s.seed], i * 4));
    geo.setAttribute('aSlot', new THREE.InstancedBufferAttribute(aSlot, 4)); geo.instanceCount = slots.length;
    const U = { uWheel: { value: new THREE.Vector4(C.x, C.y, C.z, R) }, uWheelB: { value: new THREE.Vector4(fd.x, fd.y, ax.x, ax.y) }, uWheelC: { value: new THREE.Vector4(0, period, o.dripSize, 0) } };
    const mat = kit.gouache({ color: dripColor, brush: 0, shade: 0.6, backlight: o.glow, extend: {
      uniforms: U,
      vertexPars: /* glsl */`attribute vec4 aSlot; uniform vec4 uWheel, uWheelB, uWheelC;`,
      vertexWorld: /* glsl */`{
        float per = uWheelC.y, w = 6.2831853 / per, R = uWheel.w;
        float tau = fract(uWheelC.x - aSlot.x) * per;                                        // seconds since this drop let go
        float a = aSlot.y, y0 = uWheel.y - R * cos(a), vy = w * R * sin(a), vh = w * R * cos(a);
        float tl = (vy + sqrt(vy * vy + 19.62 * max(y0, 0.0))) / 9.81;
        vec3 fdir = vec3(uWheelB.x, 0.0, uWheelB.y), adir = vec3(uWheelB.z, 0.0, uWheelB.w);
        vec3 c = uWheel.xyz + fdir * (R * sin(a) + vh * tau) + adir * aSlot.z + vec3(0.0, -R * cos(a) + vy * tau - 4.905 * tau * tau, 0.0);
        vec3 vel = fdir * vh + vec3(0.0, vy - 9.81 * tau, 0.0); float sp = length(vel); vec3 dir = vel / max(sp, 1e-3);
        float on = step(tau, tl) * smoothstep(0.0, 0.05, tau);
        float size = uWheelC.z * (0.7 + 0.6 * aSlot.w) * on, stretch = 2.6 + min(sp * 0.9, 5.0);
        // drawn out along its fall: slender, with a tail above it (a stroke of water, not a bead of glass)
        float al = dot(position, dir);
        vec3 p = (position - dir * al) * size * 0.55 + dir * (al * size * stretch * (al < 0.0 ? 1.5 : 0.6));
        wp.xyz = c + p; wn = normal;
      }`,
    } });
    drops = new THREE.Mesh(geo, mat); drops.name = 'wheel-drips'; drops.frustumCulled = false;
    ctx.group.add(drops);
    m.dripUniform = U.uWheelC;
    void clock;
  }
  m.object = drops;
  let lastFloat = Math.floor(m.phase * N), passed = 0;
  m.floatsPassed = () => passed;
  bench(ctx).push(() => {
    const ph = m.phase;
    if (drops) {
      m.dripUniform.value.x = ph - Math.floor(ph);
      if (o.rings || o.onTouch) for (const s of slots) {
        const n = Math.floor(ph - s.rel - s.tLand / period);
        if (n !== s.last) { s.last = n; if (o.rings) ctx.water.ripple(s.x, s.z, 0.1 + 0.08 * s.seed, 0.14); if (o.onTouch) o.onTouch(s.x, s.z, 'drip'); }
      }
    }
    const f = Math.floor(ph * N);
    if (f !== lastFloat) {                                                                   // a float goes in
      lastFloat = f; passed++;
      const a = TAU - a0; rim(a, 0, _v);
      if (o.rings) ctx.water.ripple(_v.x, _v.z, 0.35, 0.5);
      if (o.onTouch) o.onTouch(_v.x, _v.z, 'float');
    }
  });
  return m;
}

/**
 * Many copies of one rigid turning part, each on its own axle and its own phase, in one draw call: the five far
 * wheels down a sun road, a row of wringing wheels, sheaves. opts:
 *   geometry     the part, modelled about its own origin (with `color` if vertex-painted); material: kit.gouache options
 *   items        [{ at: [x, y, z], axle: [x, y, z] (the way its axle points), period (seconds a turn; negative turns the
 *                   other way), phase, scale, face (radians: the part's own turn about the vertical before it is set on its axle) }]
 *   turnsAbout   'z': the axis of the geometry that lies along the axle (default 'z')
 * Returns { object, count }. They cannot be cued one by one: for that, use makeMachine and separate parts.
 */
export function makeRotors(ctx, opts = {}) {
  const { kit } = ctx, clock = lifeClock(ctx);
  const o = { geometry: null, items: [], material: {}, turnsAbout: 'z', parent: null, ...opts };
  const n = o.items.length, geo = new THREE.InstancedBufferGeometry();
  for (const k of Object.keys(o.geometry.attributes)) geo.setAttribute(k, o.geometry.attributes[k]);
  if (o.geometry.index) geo.setIndex(o.geometry.index);
  const aAt = new Float32Array(n * 4), aAx = new Float32Array(n * 4), aTurn = new Float32Array(n * 2);
  const from = AX[o.turnsAbout].clone(), q = new THREE.Quaternion();
  const aQ = new Float32Array(n * 4);
  o.items.forEach((it, i) => {
    const ax = new THREE.Vector3(...(it.axle || [0, 0, 1])).normalize();
    q.setFromUnitVectors(from, ax);
    aAt.set([it.at[0], it.at[1], it.at[2], it.scale ?? 1], i * 4); aAx.set([ax.x, ax.y, ax.z, 0], i * 4); aQ.set([q.x, q.y, q.z, q.w], i * 4);
    aTurn.set([1 / (it.period ?? 16), it.phase ?? ((i * 0.618) % 1)], i * 2);
  });
  geo.setAttribute('aRotAt', new THREE.InstancedBufferAttribute(aAt, 4)); geo.setAttribute('aRotAx', new THREE.InstancedBufferAttribute(aAx, 4));
  geo.setAttribute('aRotQ', new THREE.InstancedBufferAttribute(aQ, 4)); geo.setAttribute('aRotTurn', new THREE.InstancedBufferAttribute(aTurn, 2));
  geo.instanceCount = n;
  const mat = kit.gouache({ vertexColors: !!o.geometry.attributes.color, ...o.material, extend: {
    uniforms: { uLifeTime: clock.uLifeTime },
    vertexPars: /* glsl */`attribute vec4 aRotAt, aRotAx, aRotQ; attribute vec2 aRotTurn; uniform float uLifeTime;
      vec3 rotQ(vec3 v, vec4 q) { return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v); }`,
    vertexWorld: /* glsl */`{
      float ang = 6.2831853 * (uLifeTime * aRotTurn.x + aRotTurn.y), c = cos(ang), s = sin(ang);
      vec3 p = rotQ(position * aRotAt.w, aRotQ), nn = rotQ(normal, aRotQ), a = aRotAx.xyz;
      p = p * c + cross(a, p) * s + a * dot(a, p) * (1.0 - c); nn = nn * c + cross(a, nn) * s + a * dot(a, nn) * (1.0 - c);
      wp.xyz = aRotAt.xyz + p; wn = nn;
    }`,
  } });
  const mesh = new THREE.Mesh(geo, mat); mesh.name = 'rotors'; mesh.frustumCulled = false;
  (o.parent || ctx.group).add(mesh);
  return { object: mesh, material: mat, count: n };
}

/**
 * A rope that reaches its load: keep rope `i` of a makeRopes system running from `from` to `to`, whatever they do.
 * from, to: an Object3D (its own origin), a Vector3, [x, y, z], or a function returning any of these. o: { slack:
 * metres of rope more than the straight distance (default 0.01: taut) } or { length: fixed metres (it sags when the
 * load comes near and is drawn straight when it is far) }.
 */
export function lineTo(ctx, ropes, i, from, to, o = {}) {
  const a = new THREE.Vector3(), b = new THREE.Vector3();
  const fn = () => {
    where(from, a); where(to, b); ctx.group.worldToLocal(a); ctx.group.worldToLocal(b);
    if (o.length == null) ropes.setLength(i, a.distanceTo(b) + (o.slack ?? 0.01));
    ropes.setFrom(i, a.x, a.y, a.z); ropes.setEnd(i, b.x, b.y, b.z);
  };
  bench(ctx).push(fn); fn();
  return fn;
}

/**
 * A counterweight on a line over a sheave: it comes down as its load goes up, metre for metre, and the sheave turns
 * with the line. opts: { travel: () => metres the load has been drawn up, weight: Object3D, top: the weight's height
 * when the load is down, axis: 'y' (the way the weight slides), ratio: 1 (2 for a double purchase: the weight moves
 * half as far), sheave: Object3D, sheaveAxis: 'z', radius: the sheave's }.
 */
export function counterweight(ctx, opts = {}) {
  const o = { travel: () => 0, weight: null, top: 0, axis: 'y', ratio: 1, sheave: null, sheaveAxis: 'z', radius: 0.15, sign: 1, ...opts };
  const turn = o.sheave ? turner(o.sheave, o.sheaveAxis) : null;
  const fn = () => { const x = o.travel(); if (o.weight) o.weight.position[o.axis] = o.top - x / o.ratio; if (turn) turn(o.sign * x / o.radius); };
  bench(ctx).push(fn); fn();
  return fn;
}
