// The greater flamingo, in numbers: sleepers that can be passed at 8 m, and the near birds of a flock that wakes in a
// wave, walks, runs into the wind and lifts in ribbons. docs/life/flamingo.md is the manual (the real bird, every
// option, staging, cost); src/realms/lifetest/flamingo.js is the demo (/?realm=lifetest&w=flamingo).
//
//   import { makeFlamingos } from '../engine/life/flamingo.js';
//   const flock = await makeFlamingos(ctx, { birds: [{ at: [206, 8.4] }, ...], depth: 0.18, wind: [0, 1] });
//   ctx.stage.cue('wind', { s: 216 }, () => flock.lift({ front: { from: [x, z], dir: [0, 1], speed: 26 }, ribbons: [...] }));
//
// Every bird is a copy of ONE rigged model whose clips were baked in Blender (source-art/models/life/flamingo.py;
// src/engine/life/baked.js draws all of them in one draw call a form: a near form within 30 m, a far one beyond).
// Here each bird has a small life on the CPU: where it RESTS (asleep on one leg, awake on one leg, standing on two,
// feeding, in the air), a script of steps it is working through (each step is a baked clip), and what it has been
// told. Nothing is done for a bird that only sleeps.
//
// Bird space: z forward, y up, x to its own left. Places are the realm's own (metres, the water at y = 0).
import * as THREE from 'three';
import { makeBaked } from './baked.js';

const FILE = 'models/life/flamingo_vat.json';
const TAU = Math.PI * 2, G = 9.81;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a || 1e-9), 0, 1); return t * t * (3 - 2 * t); };
const wrap = (a) => { a = (a + Math.PI) % TAU; return (a < 0 ? a + TAU : a) - Math.PI; };
const xyz = (p) => (p && p.isVector3 ? [p.x, p.y, p.z] : p);

/** A way through points (a smooth curve), walked by distance; beyond either end it runs straight on. */
export class Way {
  constructor(points) {
    const P = points.map(xyz), n = P.length, per = 16;
    this.pts = []; this.len = [0];
    const at = (i) => P[clamp(i, 0, n - 1)];
    for (let i = 0; i < n - 1; i++) for (let k = i === 0 ? 0 : 1; k <= per; k++) {
      const t = k / per, t2 = t * t, t3 = t2 * t, p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2), q = [0, 0, 0];
      for (let c = 0; c < 3; c++) q[c] = 0.5 * (2 * p1[c] + (p2[c] - p0[c]) * t + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t2 + (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * t3);
      if (this.pts.length) { const a = this.pts[this.pts.length - 1]; this.len.push(this.len[this.len.length - 1] + Math.hypot(q[0] - a[0], q[1] - a[1], q[2] - a[2])); }
      this.pts.push(q);
    }
    this.length = this.len[this.len.length - 1]; this.hint = 0;
  }
  /** How far along the way the place nearest to (x, z) lies, metres (negative: short of its first point, as the way runs on backward).
   *  hx, hz (a level direction, optional): only the stretch of the way that runs that way is looked at, from its beginning to
   *  where it first turns aside by more than 75 degrees. (A ribbon that wheels round and comes back past the place the birds
   *  stood has two places abreast of a bird: without this, one bird in a few took the far one, and turned about in the air.) */
  near(x, z, hx, hz) {
    const P = this.pts; let best = 0, bd = Infinity, began = false;
    for (let i = 0; i < P.length; i++) {
      if (hx != null && i < P.length - 1) {
        const tx = P[i + 1][0] - P[i][0], tz = P[i + 1][2] - P[i][2];
        if (tx * hx + tz * hz < 0.26 * Math.hypot(tx, tz)) { if (began) break; continue; }
        began = true;
      }
      const d = (P[i][0] - x) * (P[i][0] - x) + (P[i][2] - z) * (P[i][2] - z); if (d < bd) { bd = d; best = i; }
    }
    if (hx != null && !began) return this.near(x, z);            // (no stretch of it runs that way: the nearest place of all)
    if (best > 0) return this.len[best];
    const a = P[0], b = P[1], l = Math.hypot(b[0] - a[0], b[2] - a[2]) || 1;
    return Math.min(0, ((x - a[0]) * (b[0] - a[0]) + (z - a[2]) * (b[2] - a[2])) / l);
  }
  /** The place `s` metres along it, and the way it runs there: out = { x, y, z, tx, ty, tz }. */
  at(s, out) {
    const L = this.len, P = this.pts, m = P.length;
    let i, f;
    if (s <= 0) { i = 0; f = s / Math.max(1e-6, L[1]); } else if (s >= this.length) { i = m - 2; f = 1 + (s - this.length) / Math.max(1e-6, L[m - 1] - L[m - 2]); } else {
      i = Math.min(this.hint, m - 2);
      while (i > 0 && L[i] > s) i--;
      while (i < m - 2 && L[i + 1] < s) i++;
      this.hint = i; f = (s - L[i]) / Math.max(1e-6, L[i + 1] - L[i]);
    }
    const a = P[i], b = P[i + 1], dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], l = Math.hypot(dx, dy, dz) || 1;
    out.x = a[0] + dx * f; out.y = a[1] + dy * f; out.z = a[2] + dz * f; out.tx = dx / l; out.ty = dy / l; out.tz = dz / l;
    return out;
  }
}

// ---- first light. Below the sunline a bird keeps the colour of the night: its pink is not seen until the sun has reached it
// (the pale plumage stays as it is; the legs and the wing's rose go to that same pale, the ink stays dark).
const SUN_EXT = (uSun, uPre) => ({
  uniforms: { uFlamSun: uSun, uFlamPre: uPre },
  fragmentPars: 'uniform vec4 uFlamSun; uniform vec3 uFlamPre;',
  albedo: `{ float lit = smoothstep(uFlamSun.x - 0.5 * uFlamSun.y, uFlamSun.x + 0.5 * uFlamSun.y, vWPos.y) * uFlamSun.z;
      float lum = dot(albedo, vec3(0.3, 0.6, 0.1));
      albedo = mix(uFlamPre * vBakedTint * (0.3 + 0.7 * smoothstep(0.0, 0.42, lum)), albedo, lit); }`,
});

// ---- the steps a bird's script is made of: a baked clip, played once (or for a while if it goes round), after which
// the bird rests where the step leaves it (`to`)
const STEPS = {
  untuck: { clip: 'untuck', to: 'one' }, tuck: { clip: 'untuck', reverse: true, rate: 0.83, to: 'sleep' },
  legdown: { clip: 'legdown', to: 'stand' }, legup: { clip: 'legdown', reverse: true, to: 'one' },
  wake: { clip: 'wake', to: 'stand' },
  feed_in: { clip: 'feed_in', to: 'feed' }, feed_out: { clip: 'feed_in', reverse: true, to: 'stand' },
  look: { clip: 'look', loop: 8, on: 'one' }, preen: { clip: 'preen', on: 'one' }, shake: { clip: 'shake', on: 'one' },
  alert: { clip: 'alert', hold: true, on: 'one' }, headup: { clip: 'alert2', hold: true, on: 'stand' },
  stretch: { clip: 'stretch', on: 'stand' }, feed: { clip: 'feed', loop: 12, on: 'feed' }, stand: { clip: 'stand', loop: 6, on: 'stand' },
  walk_in: { clip: 'walk_in', travel: true, on: 'stand' }, walk: { clip: 'walk', loop: 5, travel: true, on: 'stand', fade: 0.1 }, walk_out: { clip: 'walk_out', travel: true, on: 'stand', fade: 0.1 },
  takeoff: { clip: 'takeoff', travel: true, to: 'air', on: 'stand' },
  land: { clip: 'land', travel: true, to: 'stand', on: 'air' },
};
const IDLE = { sleep: 'sleep', one: 'look', stand: 'stand', feed: 'feed', air: 'fly' };
const ROUTE = {
  'sleep>one': ['untuck'], 'sleep>stand': ['wake'], 'sleep>feed': ['wake', 'feed_in'], 'one>sleep': ['tuck'], 'one>stand': ['legdown'], 'one>feed': ['legdown', 'feed_in'],
  'stand>one': ['legup'], 'stand>sleep': ['legup', 'tuck'], 'stand>feed': ['feed_in'], 'feed>stand': ['feed_out'], 'feed>one': ['feed_out', 'legup'], 'feed>sleep': ['feed_out', 'legup', 'tuck'],
};
const MARK = { step: [0.12, 0.22], run: [0.25, 0.4], bill: [0.1, 0.18], land: [0.3, 0.4] };

/**
 * A flock of flamingos.
 *
 * options (all optional but the birds):
 *   birds          [{ at: [s, d] | position: [x, y, z], heading | face, state, group, stay, rooted, scale, mirror, depth, keep, collide }, ...]:
 *                  who stands where. heading: radians (0 looks toward +z); face: 'channel' | 'back' | 'along' (kit.faceAngle).
 *                  Left out: into the wind if there is one (give or take 25 degrees), else any way. state: 'sleep'
 *                  (default) | 'one' (awake on one leg) | 'stand' | 'feed'. group: a name for `who`. stay: it never
 *                  lifts. collide: metres (1.6): a soft circle the hull is eased round, with a hard one of 0.6 m inside it that
 *                  the hull cannot enter (the rider's eye then never comes within a metre and a half of where the bird
 *                  stands); false for none
 *   count, place   or: how many, and (i, rnd) => one such record
 *   depth          metres of water they stand in (0.07): their feet are that far under the surface
 *   safe           metres (20): a bird that stands within this of the route's centre line is ROOTED: it moves its neck
 *                  and nothing else (it never brings its leg down, walks, shakes, stretches, runs or flies)
 *   wind           [x, z]: the way the wind blows; birds face into it and run into it
 *   life           { awake: [3, 5], every: [3, 8], acts: { look: 3, preen: 2, shake: 1, feed: 1, stretch: 0.5 }, far: 20 }:
 *                  of the birds that sleep, so many are awake at a time, each for one or two things, then asleep again.
 *                  feed and stretch are only for birds further than `far` from the boat. false or left out: none
 *   near           { within: 10, count: 3, away: 14, linger: 6, alert: 6 }: when the boat is within `within` metres the
 *                  nearest `count` sleepers draw their heads out and look about (never at the boat for long), until the
 *                  boat has been `away` metres off for `linger` seconds; within `alert` a bird stands tall. None: left out
 *   flush          metres (0 = never): a bird that is not rooted runs and lifts when the boat comes this near, if the way it would run
 *                  (into the wind; with no wind, the way it faces) leads away from the boat; one that would have to run toward the
 *                  boat stays, as a rooted bird
 *   collide        true (default), false, metres, or { soft: 1.6, hard: 0.6 }: every bird is solid where it stands (a bird's own
 *                  `collide` says otherwise for that bird)
 *   sunline        { y, soft: 3, color: '#b4adc8' } or { uniform, color }: below this height (eased over `soft` metres) a bird has not been
 *                  reached by the sun: it shows none of its pink and is `color` all over (lilac-grey), its ink still dark.
 *                  uniform: a { value: Vector4(height, soft, strength 0..1, -) } of the area's own (the standing sky's uSunline)
 *   ribbons        [{ path: [[x, y, z], ...], speed: 14, width: 10, depth: 5, join: 8, strung, length: 90 }, ...]: where birds
 *                  that lift go (lift() takes them too). A bird joins its ribbon abreast of where it left the water, over
 *                  `join` seconds, so the ribbon is as long as the ground its birds stood on (and the front that raised
 *                  them) made it. strung: true strings them out behind one head instead, over `length` metres
 *   lod            [30]: metres at which a bird changes from the near form to the far one
 *   marks          { step: [strength, radius], run, bill, land }: what each touch writes on the water;  ripples: false for none
 *   onTouch(x, z, kind, strength, metres)   every touch on the water, however far off (metres: from the boat): for a sound, or for a
 *                  ring of the area's own where the water's ripples do not reach. kinds: 'step', 'run', 'bill', 'land'
 *   onEvent(name, bird)   for sound and staging. names: 'wake', 'sleep', 'run' (it begins its take-off), 'air' (its feet have left the
 *                  water), 'land' (its landing begins), 'gone', and 'act:<step>' for every step of a bird's script (act:preen, act:untuck ...)
 *   keepOut        metres no flying bird comes to the eye (12; 20 with reduced motion);  gone: seconds in the air after which it is no longer drawn (60)
 *   under, neck, fold, edge   how the pale bird is painted when it is small in the picture or folded (baked.js says what each is;
 *                  the defaults are the flamingo's: '#a9a4c8', 0.85, [0.35, 0.8], { color: '#c8c2e0', strength: 0.8 })
 *   seed, exact, material, gouache, prePass, only, parent, file
 *
 * The handle: see the object at the end. Controls take `who`: a group's name, a list of indices, or (bird) => bool.
 */
export async function makeFlamingos(ctx, options = {}) {
  const o = { seed: 1, depth: 0.07, safe: 20, lod: [30], wind: null, life: null, near: null, flush: 0, ripples: true, keepOut: 12, gone: 60, state: 'sleep', ...options };
  const kit = ctx.kit, calm = !!ctx.reducedMotion, rnd = ctx.rng(o.seed * 7717 + 3);
  const density = ctx.quality && ctx.quality.density || 1;
  let wind = o.wind ? (() => { const l = Math.hypot(o.wind[0], o.wind[1]) || 1; return [o.wind[0] / l, o.wind[1] / l]; })() : null;
  // ---- who stands where
  let specs = o.birds ? o.birds.slice() : Array.from({ length: o.exact ? o.count || 0 : kit.count(o.count || 0) }, (_, i) => o.place(i, rnd));
  if (o.birds && !o.exact && density < 0.99) { const r2 = ctx.rng(o.seed * 31 + 7); specs = specs.filter((s) => { const keep = r2() < density; return keep || s.keep || s.collide; }); }
  const n = specs.length, loc = {};
  const sunU = o.sunline ? (o.sunline.uniform || { value: new THREE.Vector4(o.sunline.y ?? -1e4, o.sunline.soft ?? 3, 1, 0) }) : null;
  const preU = { value: new THREE.Color(o.sunline && o.sunline.color || '#b4adc8') };
  const { extend: more, ...paint } = o.material || {};
  const baked = await makeBaked(ctx, { file: o.file || FILE, count: Math.max(1, n), lod: o.lod, gouache: o.gouache, prePass: o.prePass ?? [true, false], only: o.only, parent: o.parent,
    under: o.under ?? '#a9a4c8', neck: o.neck, edge: o.edge ?? { color: '#c8c2e0', strength: 0.8 }, fold: o.fold ?? [0.35, 0.8],
    material: { ...paint, extend: [...(sunU ? [SUN_EXT(sunU, preU)] : []), ...[].concat(more || [])] } });
  const C = baked.clips;
  const WALK_D = C.walk.end.z, RUN_END = C.takeoff.end.clone(), RUN_V = (() => { const a = new THREE.Vector3(), b = new THREE.Vector3(); C.takeoff.travel(C.takeoff.seconds - 1 / 24, a); C.takeoff.travel(C.takeoff.seconds, b); return b.sub(a).multiplyScalar(24); })();
  const birds = [];
  for (let i = 0; i < n; i++) {
    const s = specs[i];
    let x, z, y = null;
    if (s.at) { const p = kit.at(s.at[0], s.at[1] ?? 0, 0); x = p.x; z = p.z; } else { const p = xyz(s.position || [s.x, s.y ?? null, s.z]); x = p[0]; z = p[2]; y = p[1]; }
    ctx.path.locate(x, z, null, loc);
    const depth = s.depth ?? o.depth, scale = s.scale ?? lerp(0.92, 1.05, Math.pow(rnd(), 1.4));
    const into = wind ? Math.atan2(-wind[0], -wind[1]) : null;
    const heading = s.heading ?? (s.face != null ? kit.faceAngle(s.face, loc.s, loc.d) + (s.turn || 0) : into != null ? into + (rnd() - 0.5) * 0.9 : rnd() * TAU);
    // (ground: where its feet are; rise: how far the water's surface lies above the 7 cm the clips' runs were made for: a runner comes up that much more)
    const b = { i, x, y: y ?? -depth, z, heading, home: [x, z, heading], ground: y ?? -depth, rise: y == null ? depth - 0.07 : 0, scale, depth, mirror: s.mirror ?? rnd() < 0.5, tint: lerp(0.95, 1.03, rnd()), group: s.group || null,
      stay: !!s.stay, rooted: s.rooted ?? Math.abs(loc.d) < o.safe, base: s.state || o.state, dest: null, cur: null, end: Infinity, t0: 0, script: [], pending: null, release: false,
      pace: lerp(0.85, 1.15, rnd()), flap: lerp(0.98, 1.1, rnd()), seed: rnd(), busy: 0, held: 0, far: 0, life: (s.state || o.state) === 'sleep', ribbon: s.ribbon ?? -1, evAt: 0, hurry: 1, went: 0,
      air: null, bank: 0, pitch: 0 };
    if (!IDLE[b.base]) throw new Error(`makeFlamingos: no state called '${b.base}'`);
    b.dest = b.base;
    birds.push(b);
    // (a soft circle the hull is eased round; and inside it a hard one, so that however the rider paddles the eye stays a good metre from the bird)
    // A bird is solid where it stands: a hard circle the hull cannot enter (0.6 m: the eye, at the boat's middle, then
    // stays a good metre and a half from the bird: a soft circle alone lets a rider who paddles sail through it) inside
    // a soft one the hull is eased round. The circles go with a bird that walks and are put away while it is in the air
    const cd = s.collide ?? o.collide ?? true;
    if (cd) {
      const c = typeof cd === 'number' ? { soft: cd, hard: Math.min(0.6, cd) } : { soft: 1.6, hard: 0.6, ...(cd === true ? {} : cd) };
      b.colliders = [c.soft > 0 ? ctx.addCollider({ x, z, r: c.soft, r0: c.soft, soft: true }) : null, c.hard > 0 ? ctx.addCollider({ x, z, r: c.hard, r0: c.hard }) : null].filter(Boolean);
    }
    baked.set(i, { x: b.x, y: b.y, z: b.z, heading: b.heading, scale: b.scale, mirror: b.mirror, tint: b.tint });
    baked.play(i, IDLE[b.base], { fade: 0, phase: rnd(), rate: b.base === 'sleep' || b.base === 'stand' ? b.pace : b.pace * 0.7 });
  }
  let ribbons = (o.ribbons || []).map(makeRibbon);
  function makeRibbon(r) { return { speed: 14, width: 10, depth: 5, length: 90, join: 8, ...r, way: new Way(r.path) }; }
  const marks = { ...MARK, ...(o.marks || {}) };
  const boat = ctx.boat, water = ctx.water, eye = new THREE.Vector3(), _a = new THREE.Vector3(), _w = {}, _w2 = {};
  const emit = (name, b) => { if (o.onEvent) o.onEvent(name, b); };
  const touch = (x, z, kind) => {
    const m = marks[kind] || marks.step, d = Math.hypot(x - boat.x, z - boat.z);
    if (o.ripples && d < 70) water.ripple(x, z, m[0], m[1]);        // (the water's own ripple window ends at 32 to 48 m: beyond it the call is one comparison)
    if (o.onTouch) o.onTouch(x, z, kind, m[0], d);
  };
  const now = () => baked.now;
  /** A bird's circles in the water: where it is now (on: it stands or walks there), or put away (it runs, flies or has gone). */
  const solid = (b, on) => { if (b.colliders) for (const c of b.colliders) { c.x = b.x; c.z = b.z; c.r = on ? c.r0 : -1e3; } };

  // ---------------------------------------------------------------------------------------------- one bird's script
  const stepOf = (s) => (typeof s === 'string' ? { ...STEPS[s], name: s } : { ...STEPS[s.name], ...s });
  function begin(b, s) {
    const st = stepOf(s), c = C[st.clip], rate = (st.rate ?? 1) * (st.loop ? b.pace : 1) * (st.fixed ? 1 : b.hurry);
    baked.play(b.i, st.clip, { reverse: st.reverse, rate, fade: st.fade ?? 0.35, at: st.at, phase: st.loop && st.at == null ? (st.travel ? 0 : b.seed) : undefined });
    b.cur = st; b.t0 = now(); b.rate = rate; b.release = false; b.evAt = st.at || 0;
    b.dest = st.to || b.base;
    const left = st.at != null && !st.reverse ? c.seconds - st.at : c.seconds;
    b.end = st.hold ? Infinity : now() + (st.loop ? (st.seconds ?? st.loop) : left / rate);
    b.inAt = st.hold ? now() + c.seconds / rate : 0;
    if (st.travel) { b.sx = b.x; b.sy = b.y; b.sz = b.z; b.went = st.at ? C[st.clip].travel(st.at, _a).z : 0; b.cycle = 0; }
    if (st.clip === 'takeoff') solid(b, false);
    emit('act:' + st.name, b);
  }
  function idle(b) {
    b.cur = null; b.end = Infinity; b.hurry = 1;
    if (b.base === 'air') return;
    baked.play(b.i, IDLE[b.base], { fade: 0.4, phase: b.seed, rate: b.base === 'one' ? b.pace * 0.7 : b.pace });
  }
  function advance(b) {
    if (b.cur) { if (b.cur.travel) { settleTravel(b); if (b.cur.to !== 'air') solid(b, true); } b.base = b.dest; if (b.cur.to === 'air') return launch(b); }
    b.cur = null;
    while (b.script.length) {
      const s = b.script.shift(), st = stepOf(s);
      if (st.on && st.on !== b.base) continue;                 // (a step that does not belong where the bird now rests is passed over)
      return begin(b, s);
    }
    idle(b);
  }
  /** Where the bird will rest once the step it is in has run its course. */
  const restOf = (b) => (b.cur && !b.cur.loop && !b.cur.hold ? b.dest : b.base);
  /** Give a bird something to do: go and rest in `to` ('sleep' | 'one' | 'stand' | 'feed'), then the steps of `then`. */
  function send(b, to, then = [], hurry = 1) {
    const from = restOf(b);
    if (from === 'air' || b.base === 'gone') return;
    b.script = (from === to ? [] : (ROUTE[`${from}>${to}`] || []).slice()).concat(then);
    b.hurry = hurry;
    if (b.cur && (b.cur.name === 'walk' || b.cur.name === 'walk_in')) {      // it is walking: it finishes its stride and halts with its feet together before anything else
      b.script.unshift({ name: 'walk_out', steer: b.cur.steer });
      if (b.cur.loop) b.end = Math.min(b.end, now() + (C.walk.seconds - baked.time(b.i)) / (b.rate || 1) - 0.02);
      return;
    }
    if (!b.cur || b.cur.loop) advance(b); else if (b.cur.hold) b.release = true; else if (hurry > 1) baked.rate(b.i, (b.rate *= hurry)), b.end = now() + (b.end - now()) / hurry;
  }
  function settleTravel(b) { baked.set(b.i, { x: b.x, y: b.y, z: b.z, heading: b.heading }); }

  // ---------------------------------------------------------------------------------------------- the air
  function launch(b) {
    const t = now(), h = b.heading, r = ribbons.length ? ribbons[clamp(b.ribbon < 0 ? 0 : b.ribbon, 0, ribbons.length - 1)] : null;
    b.base = 'air'; b.cur = null; b.end = Infinity; b.script.length = 0;
    // (a bird enters its ribbon abreast of where it is, give or take a few metres along it: one that was drawn to the ribbon's
    // head from far behind it or ahead of it hung in the air while it was)
    b.air = { t0: t, x: b.x, y: b.y, z: b.z, h, v0: Math.hypot(RUN_V.x, RUN_V.z) * b.scale, vz0: RUN_V.y * b.scale, r,
      a: r ? (r.strung ? rnd() * 0.3 * r.length : -r.way.near(b.x, b.z, Math.sin(h), Math.cos(h)) + (rnd() - 0.5) * 12) : 0, b: r ? (rnd() - 0.5) * r.width : 0, c: r ? (rnd() - 0.5) * r.depth : 0, px: b.x, py: b.y, pz: b.z, hh: h };
    baked.play(b.i, 'fly', { fade: 0.2, rate: b.flap * (calm ? 0.9 : 1), phase: 0 });
    emit('air', b);
  }
  // Coming down. The clip `land` begins in flight, LAND_RUN metres short of where the bird will stand and LAND_DROP above
  // it, at LAND_V; so a bird is first flown to that point, along a curve that leaves where it is at the speed it has and
  // arrives there level, slowed, and flying the way it will land (into the wind), on the last frame of a wingbeat.
  const LAND_RUN = C.land.end.z, LAND_DROP = -C.land.end.y, LAND_V = (() => { const a = new THREE.Vector3(); C.land.travel(1 / 24, a); return a.z * 24; })();
  const LAND_T0 = C.land.events.length ? C.land.events[0].t : 0.75, LAND_T1 = C.land.events.length ? C.land.events[C.land.events.length - 1].t : 1.9;
  function approach(b, to, h, then) {
    const ex = Math.sin(h), ez = Math.cos(h), run = LAND_RUN * b.scale;
    const p1 = [to[0] - ex * run, b.ground + LAND_DROP * b.scale + b.rise, to[1] - ez * run];
    let A = b.air;
    if (b.base === 'gone' || !A) {                             // it comes back from far off, down the wind and high
      const far = 150 + 70 * rnd(), off = (rnd() - 0.5) * 80;
      b.x = p1[0] - ex * far + ez * off; b.y = 16 + 16 * rnd(); b.z = p1[2] - ez * far - ex * off; b.heading = h; b.pitch = 0; b.bank = 0;
      b.base = 'air'; b.cur = null; b.script.length = 0;
      b.air = A = { t0: now(), x: b.x, y: b.y, z: b.z, h, v0: 14, vz0: 0, r: null, a: 0, b: 0, c: 0, px: b.x, py: b.y, pz: b.z, hh: h, vx: ex * 14, vy: 0, vz: ez * 14 };
      baked.set(b.i, { hidden: false, x: b.x, y: b.y, z: b.z, heading: h, pitch: 0, bank: 0 });
      baked.play(b.i, 'fly', { fade: 0, rate: b.flap * (calm ? 0.9 : 1), phase: rnd() });
    }
    const v0 = [A.vx ?? Math.sin(A.hh) * 14, A.vy ?? 0, A.vz ?? Math.cos(A.hh) * 14], v1 = LAND_V * b.scale * (calm ? 0.9 : 1);
    const D = Math.hypot(p1[0] - b.x, p1[1] - b.y, p1[2] - b.z);
    let T = Math.max(1.5, D / (0.5 * (Math.hypot(v0[0], v0[1], v0[2]) + v1)));
    // it arrives as a wingbeat ends, so that the clip takes over without a seam
    const beat = C.fly.seconds / (b.flap * (calm ? 0.9 : 1)), left = (C.fly.seconds - baked.time(b.i)) / (b.flap * (calm ? 0.9 : 1));
    T = left + Math.ceil((T - left) / beat - 1e-6) * beat;
    A.land = { t0: now(), T, p0: [b.x, b.y, b.z], v0, p1, v1: [ex * v1, 0, ez * v1], h, then: then || [] };
  }
  function fly(b, dt) {
    const A = b.air, ta = now() - A.t0, r = A.r, V = (r ? r.speed : 14) * (calm ? 0.8 : 1);
    let x, y, z;
    if (A.land) {
      const Ld = A.land, u = (now() - Ld.t0) / Ld.T;
      if (u >= 1) {                                            // there: the landing itself is the clip's, with its travel
        b.x = Ld.p1[0]; b.y = Ld.p1[1]; b.z = Ld.p1[2]; b.heading = Ld.h; b.pitch = 0; b.bank = 0;
        baked.move(b.i, b.x, b.y, b.z, b.heading, 0, 0);
        b.script = Ld.then.slice(); A.land = null; b.going = false;
        begin(b, { name: 'land', fade: 0.12, fixed: true, rate: calm ? 0.9 : 1 });
        emit('land', b);
        return;
      }
      const u2 = u * u, u3 = u2 * u, h00 = 2 * u3 - 3 * u2 + 1, h10 = u3 - 2 * u2 + u, h01 = -2 * u3 + 3 * u2, h11 = u3 - u2;
      x = h00 * Ld.p0[0] + h10 * Ld.T * Ld.v0[0] + h01 * Ld.p1[0] + h11 * Ld.T * Ld.v1[0];
      y = Math.max(Ld.p1[1], h00 * Ld.p0[1] + h10 * Ld.T * Ld.v0[1] + h01 * Ld.p1[1] + h11 * Ld.T * Ld.v1[1]);
      z = h00 * Ld.p0[2] + h10 * Ld.T * Ld.v0[2] + h01 * Ld.p1[2] + h11 * Ld.T * Ld.v1[2];
    } else {
      const dist = V * ta - (V - A.v0) * 1.6 * (1 - Math.exp(-ta / 1.6));
      const up = Math.min(3 * ta - (3 - A.vz0) * 1.2 * (1 - Math.exp(-ta / 1.2)), 90);
      x = A.x + Math.sin(A.h) * dist; y = A.y + up; z = A.z + Math.cos(A.h) * dist;
      if (r) {
        r.way.at(V * ta - A.a, _w);
        const nl = Math.hypot(_w.tx, _w.tz) || 1, nx = _w.tz / nl, nz = -_w.tx / nl, j = smooth(0, r.join, ta);
        const wob = Math.sin(ta * 0.37 + b.seed * 40) * 0.8;
        x = lerp(x, _w.x + nx * (A.b + wob), j); y = lerp(y, _w.y + A.c + 0.5 * Math.sin(ta * 0.29 + b.seed * 17), j); z = lerp(z, _w.z + nz * (A.b + wob), j);
      }
    }
    // never near the rider. (The sphere grows over the first second and a half of a flight from 2.5 m: a bird whose run ended
    // inside it is eased outward and never thrown.)
    const keep = Math.max(2.5, Math.max(o.keepOut, calm ? 20 : 0) * (A.land ? 1 : smooth(0, 1.5, ta))), ex = x - eye.x, ey = y - eye.y, ez = z - eye.z, d = Math.hypot(ex, ey, ez);
    if (d < keep) { const k = (keep - d) / Math.max(d, 1e-3); x += ex * k; y += Math.abs(ey) * k + (keep - d) * 0.3; z += ez * k; }
    const vx = (x - A.px) / dt, vy = (y - A.py) / dt, vz = (z - A.pz) / dt, sp = Math.hypot(vx, vz);
    A.vx = vx; A.vy = vy; A.vz = vz;
    if (sp > 0.5) {
      const h = Math.atan2(vx, vz), dh = wrap(h - A.hh);
      const turn = dh / dt, level = A.land ? 1 - smooth(0.7, 1, (now() - A.land.t0) / A.land.T) : 1;      // (it comes level as it reaches the place where the landing begins)
      A.hh += dh * Math.min(1, dt * 6);
      b.bank += (clamp(Math.atan(sp * turn / G), -0.6, 0.6) * (calm ? 0.4 : 1) * level - b.bank) * Math.min(1, dt * (2.5 + 6 * (1 - level)));
      b.pitch += (clamp(Math.atan2(vy, sp), -0.5, 0.6) * 0.7 * level - b.pitch) * Math.min(1, dt * (3 + 6 * (1 - level)));
    }
    A.px = x; A.py = y; A.pz = z; b.x = x; b.y = y; b.z = z; b.heading = A.hh;
    baked.move(b.i, x, y, z, A.hh, b.pitch, b.bank);
    if (ta > o.gone && !A.land) { b.base = 'gone'; baked.hide(b.i); emit('gone', b); }
  }

  // ---------------------------------------------------------------------------------------------- every frame
  let lifeAt = 2 + rnd() * 3, scanAt = 0;
  const lifeOn = o.life ? { awake: [3, 5], every: [3, 8], far: 20, ...o.life, acts: { look: 3, preen: 2, shake: 1, feed: 1, stretch: 0.5, ...((o.life && o.life.acts) || {}) } } : null;
  const near = o.near ? { within: 10, count: 3, away: 14, linger: 6, alert: 6, ...o.near } : null;
  const pick = (table) => { let sum = 0; for (const k in table) sum += table[k]; let r = rnd() * sum; for (const k in table) { r -= table[k]; if (r <= 0) return k; } return Object.keys(table)[0]; };
  function privateLife(t) {
    const L = lifeOn; lifeAt = t + lerp(L.every[0], L.every[1], rnd());
    let awake = 0; const asleep = [];
    for (const b of birds) { if (!b.life || b.base === 'gone' || b.base === 'air') continue; if (b.base === 'sleep' && !b.cur && !b.pending && !b.held) asleep.push(b); else if (b.base !== 'sleep' || b.cur) awake++; }
    const want = Math.round(lerp(L.awake[0], L.awake[1], rnd()));
    if (awake >= want || !asleep.length) return;
    const b = asleep[Math.floor(rnd() * asleep.length)], dBoat = Math.hypot(b.x - boat.x, b.z - boat.z);
    const acts = { look: L.acts.look, preen: L.acts.preen };
    if (!b.rooted) { acts.shake = calm ? 0 : L.acts.shake; if (dBoat > L.far) { acts.feed = L.acts.feed; acts.stretch = L.acts.stretch; } }
    const what = pick(acts), plan = ['untuck'];
    if (what === 'look') plan.push({ name: 'look', seconds: 8 / (b.pace * 0.9) });
    else if (what === 'preen') plan.push('preen', ...(rnd() < 0.6 ? ['preen'] : []));
    else if (what === 'shake') plan.push('shake', { name: 'look', seconds: 4 });
    else if (what === 'feed') plan.push('legdown', 'feed_in', { name: 'feed', seconds: 6 * Math.round(lerp(2, 4, rnd())) / b.pace }, 'feed_out', 'legup');
    else plan.push('legdown', 'stretch', 'legup');
    plan.push('tuck');
    b.script = plan; b.hurry = 1; advance(b);
    emit('wake', b);
  }
  const order = [];
  function nearBoat(t) {
    scanAt = t + 0.25; order.length = 0;
    for (const b of birds) {
      if (b.base === 'gone' || b.base === 'air') continue;
      const d = Math.hypot(b.x - boat.x, b.z - boat.z); b.dBoat = d;
      if (o.flush > 0 && d < o.flush && !b.rooted && !b.stay && !b.pending && !b.going && restOf(b) !== 'air') {
        // it goes, if the way it would run (into the wind, or the way it faces) leads away from the boat. If not it stays, and from
        // then on is a rooted bird (it has no way to turn about on the spot): it answers the boat as `near` says, and its circle keeps the hull off
        const h = wind ? Math.atan2(-wind[0], -wind[1]) : b.heading, away = (Math.sin(h) * (b.x - boat.x) + Math.cos(h) * (b.z - boat.z)) / Math.max(d, 0.01);
        if (away > -0.2) { if (wind) b.runHeading = h + (b.seed - 0.5) * 0.35; liftOne(b, t + 0.2 + rnd() * 0.6, 1.2); continue; }
        b.rooted = true;
      }
      if (!near) continue;
      if (d < near.within && b.base === 'sleep' && !b.cur && !b.pending) order.push(b);
      if (b.held) {
        if (d < near.away) b.far = t; else if (t - b.far > near.linger) { b.held = 0; send(b, 'sleep'); emit('sleep', b); }
        // within arm's reach of the hull it stands tall and waits
        if (b.held && d < near.alert && b.base === 'one' && (!b.cur || b.cur.name === 'look')) { b.script = ['alert', { name: 'look', seconds: 1e9 }]; advance(b); }
        else if (b.cur && b.cur.name === 'alert' && d > near.alert * 1.35 && t > b.inAt + 1.5) b.release = true;
      }
    }
    if (near && order.length) {
      let up = 0; for (const b of birds) if (b.held) up++;
      order.sort((p, q) => p.dBoat - q.dBoat);
      for (const b of order) { if (up >= near.count) break; up++; b.held = 1; b.far = t; send(b, 'one', [{ name: 'look', seconds: 1e9 }]); emit('wake', b); }
    }
  }
  const cost = { ms: 0, frames: 0 };                           // this file's own work, for the page's figures (handle.cost)
  ctx.onUpdate((dt) => {
    const t = now(), c0 = performance.now();
    if (dt <= 0) return;
    eye.copy(ctx.engine.shared.uCameraPos.value); ctx.group.worldToLocal(eye);
    if (lifeOn && t > lifeAt) privateLife(t);
    if ((near || o.flush > 0) && t > scanAt) nearBoat(t);
    for (let k = 0; k < n; k++) {
      const b = birds[k];
      if (b.base === 'gone') continue;
      if (b.pending && t >= b.pending.t) { const p = b.pending; b.pending = null; p.run(b); }
      if (b.base === 'air' && !b.cur) { fly(b, dt); continue; }
      const st = b.cur;
      if (!st) continue;
      if (st.hold) {                                           // played in, held, and when it is let go played back out
        if (b.release && t >= b.inAt) { baked.play(b.i, st.clip, { reverse: true, rate: b.rate, fade: 0.2 }); b.cur = { ...st, hold: false, loop: 0 }; b.end = t + C[st.clip].seconds / b.rate; }
        continue;
      }
      if (st.travel) {                                         // the clip carries the bird: its root's travel is laid on the bird's own place
        const c = C[st.clip], tc = baked.time(b.i);
        let gone, lift = 0;
        if (st.loop) { if (tc < b.evAt - 0.5 * c.seconds) b.cycle++; gone = (b.cycle * c.end.z + c.travel(tc, _a).z); }
        else { c.travel(tc, _a); gone = _a.z; lift = _a.y; }
        const dd = (gone - b.went) * b.scale; b.went = gone;
        if (st.steer != null) b.heading += clamp(wrap(st.steer - b.heading), -0.45 * dt, 0.45 * dt);
        b.x += Math.sin(b.heading) * dd; b.z += Math.cos(b.heading) * dd;
        // (a runner comes up onto the water whatever its depth; a lander runs on it and sinks to the bed as it stops)
        if (!st.loop) b.y = b.sy + lift * b.scale + b.rise * (st.clip === 'land' ? -smooth(LAND_T0, LAND_T1, tc) : smooth(0, 0.07, lift));
        baked.move(b.i, b.x, b.y, b.z, b.heading, 0, 0);
        if (st.loop && b.colliders) solid(b, true);
        for (const e of c.events) {                            // footfalls: a ring each
          if ((b.evAt <= e.t && tc > e.t) || (st.loop && tc < b.evAt && (e.t >= b.evAt || e.t < tc))) {
            const ex = e.at[0] * b.scale * (b.mirror ? -1 : 1), ez = e.at[2] * b.scale;
            touch(b.x + Math.cos(b.heading) * ex + Math.sin(b.heading) * ez, b.z - Math.sin(b.heading) * ex + Math.cos(b.heading) * ez, st.clip === 'walk' ? 'step' : st.clip === 'land' ? 'land' : 'run');
          }
        }
        b.evAt = tc;
      } else if (st.clip === 'feed' && t > (b.ringAt || 0)) {  // the bill in the water: a small ring now and then, where it is
        b.ringAt = t + 0.7 + 0.5 * b.seed;
        C.feed.track('tip_bill', baked.time(b.i), _a);
        const ex = _a.x * b.scale * (b.mirror ? -1 : 1), ez = _a.z * b.scale;
        touch(b.x + Math.cos(b.heading) * ex + Math.sin(b.heading) * ez, b.z - Math.sin(b.heading) * ex + Math.cos(b.heading) * ez, 'bill');
      }
      if (t >= b.end) advance(b);
    }
    cost.ms += performance.now() - c0; cost.frames++;
  });

  // ---------------------------------------------------------------------------------------------- what a realm tells them
  const chosen = (who) => (who == null ? birds : typeof who === 'function' ? birds.filter(who) : typeof who === 'string' ? birds.filter((b) => b.group === who) : who.map((i) => birds[i]).filter(Boolean));
  /** When a front reaches a bird: seconds from now. front: { from: [x, z], dir: [dx, dz], speed }: a line through `from` that travels along `dir`. */
  const frontDelay = (front, b) => { if (!front) return 0; const l = Math.hypot(front.dir[0], front.dir[1]) || 1; return Math.max(0, ((b.x - front.from[0]) * front.dir[0] + (b.z - front.from[1]) * front.dir[1]) / l / (front.speed || 26)); };
  const after = (b, t, run) => { b.pending = { t, run }; };
  function liftOne(b, tRun, lead) {
    b.going = true;
    // the bird must stand on two feet 0.71 s before it runs (the take-off's own heads-up and lean). One that is asleep
    // or feeding is brought there first, in `lead` seconds: it wakes in a hurry
    const need = { sleep: C.wake.seconds, one: C.legdown.seconds, feed: C.feed_in.seconds, stand: 0 };
    after(b, Math.max(now(), tRun - 0.71 - ((need[restOf(b)] ?? 0) > 0 ? lead : 0)), (bb) => {
      const total = need[restOf(bb)] ?? 0, room = Math.max(0.4, tRun - 0.71 - now());
      bb.held = 0;
      send(bb, 'stand', [{ name: 'takeoff', fixed: true, rate: calm ? 0.9 : 1, steer: bb.runHeading }], total > 0 ? Math.max(1, total / room) : 1);
      emit('run', bb);
    });
  }
  const handle = {
    object: baked.object, baked, birds, count: n, ribbons,
    /** A wave of waking: each bird wakes as the front reaches it (or at once), over `jitter` seconds of its own. to: 'stand' (default: the
     *  leg comes down too; rooted birds stay on one leg whatever is asked) | 'one'. */
    wake({ who = null, front = null, jitter = 1.2, to = 'stand', delay = 0 } = {}) {
      for (const b of chosen(who)) {
        if (b.base === 'gone' || b.base === 'air') continue;
        after(b, now() + delay + frontDelay(front, b) + rnd() * jitter, (bb) => { bb.held = 0; bb.life = false; send(bb, bb.rooted ? 'one' : to); emit('wake', bb); });
      }
      return handle;
    },
    /** Back to sleep, as a front passes or at once. */
    sleep({ who = null, front = null, jitter = 3, delay = 0 } = {}) {
      for (const b of chosen(who)) { if (b.base === 'gone' || b.base === 'air') continue; after(b, now() + delay + frontDelay(front, b) + rnd() * jitter, (bb) => { bb.life = true; send(bb, 'sleep'); emit('sleep', bb); }); }
      return handle;
    },
    /** Birds that are not rooted walk: { heading (radians) or toward: [x, z], seconds: 8 or metres, front, jitter }. They set off with a
     *  first step, steer round to their way as they go (27 degrees a second at most) and halt with the feet together. */
    walk({ who = null, heading = null, toward = null, seconds = 8, metres = null, front = null, jitter = 1.5, delay = 0 } = {}) {
      for (const b of chosen(who)) {
        if (b.rooted || b.base === 'gone' || b.base === 'air') continue;
        after(b, now() + delay + frontDelay(front, b) + rnd() * jitter, (bb) => {
          const h = heading != null ? heading + (rnd() - 0.5) * 0.3 : toward ? Math.atan2(toward[0] - bb.x, toward[1] - bb.z) : bb.heading;
          const cyc = Math.max(1, Math.round((metres != null ? metres / (WALK_D * bb.scale) : seconds / C.walk.seconds * bb.pace)));
          bb.life = false;
          send(bb, 'stand', [{ name: 'walk_in', steer: h }, { name: 'walk', seconds: cyc * C.walk.seconds / bb.pace - 0.02, steer: h }, { name: 'walk_out', steer: h }]);
        });
      }
      return handle;
    },
    /** Head down in the water, sweeping (birds that are not rooted), for `seconds` or until told otherwise. */
    feed({ who = null, seconds = null, jitter = 3, delay = 0 } = {}) {
      for (const b of chosen(who)) { if (b.rooted || b.base === 'gone' || b.base === 'air') continue; after(b, now() + delay + rnd() * jitter, (bb) => { bb.life = false; send(bb, 'feed', seconds ? [{ name: 'feed', seconds }, 'feed_out'] : []); }); }
      return handle;
    },
    /** Stand on two legs (out of feeding or sleep). */
    stand({ who = null, jitter = 1.5, delay = 0 } = {}) {
      for (const b of chosen(who)) { if (b.rooted || b.base === 'gone' || b.base === 'air') continue; after(b, now() + delay + rnd() * jitter, (bb) => { bb.life = false; send(bb, 'stand'); }); }
      return handle;
    },
    /** One thing, now, for birds that are in the right place for it: 'look' | 'preen' | 'shake' | 'alert' (awake on one leg), 'stretch' | 'headup' (on two). */
    act(name, { who = null, seconds = null } = {}) {
      for (const b of chosen(who)) { const st = STEPS[name]; if (!st || restOf(b) !== st.on || (b.rooted && (name === 'shake' || name === 'stretch'))) continue; b.script = [seconds ? { name, seconds } : name]; if (!b.cur || b.cur.loop) advance(b); }
      return handle;
    },
    /** Let go of a pose that is held (alert, headup). */
    settle({ who = null } = {}) { for (const b of chosen(who)) if (b.cur && b.cur.hold) b.release = true; return handle; },
    /**
     * They go: heads up, a run into the wind, the climb, and into their ribbons.
     *   front    { from: [x, z], dir: [dx, dz], speed: 26 }: each bird runs when the line reaches it (plus 0.5 s and up to `jitter` of its own:
     *            the same reckoning as the far flock's lift(), src/engine/life/birds.js)
     *   delay    (bird) => seconds, instead of a front;   jitter (1.4);   stay: the share that never lift (0), besides the birds marked `stay`
     *   wind     [x, z]: the way the wind blows (they turn into it as they run);   ribbons: [...] (as the option);   ribbon: (bird) => index
     *   lead     seconds a bird that is still asleep is given to get onto two feet (1.5: it wakes in a hurry)
     * Rooted birds do not go: they draw their heads out and stand watching.
     */
    lift({ who = null, front = null, delay = null, jitter = 1.4, stay = 0, wind: w = null, ribbons: rs = null, ribbon = null, lead = 1.5 } = {}) {
      if (w) { const l = Math.hypot(w[0], w[1]) || 1; wind = [w[0] / l, w[1] / l]; }
      if (rs) { ribbons = rs.map(makeRibbon); handle.ribbons = ribbons; }
      const lr = ctx.rng(o.seed * 23 + 1), into = wind ? Math.atan2(-wind[0], -wind[1]) : null;
      for (const b of chosen(who)) {
        if (b.base === 'gone' || b.base === 'air') continue;
        const d = delay ? delay(b) : frontDelay(front, b), own = lr() * jitter, stays = lr() < stay;
        const tRun = now() + 0.5 + d + own;
        if (b.rooted || b.stay || stays) {                       // they do not go: heads come up, and they stand watching
          after(b, Math.max(now(), tRun - 0.5), (bb) => { const at = restOf(bb); bb.held = 0; bb.life = false; if (at === 'sleep') send(bb, 'one', [{ name: 'look', seconds: 1e9 }]); else if (at === 'stand' && !bb.cur) { bb.script = ['headup']; advance(bb); } });
          continue;
        }
        if (ribbon) b.ribbon = ribbon(b);
        else if (b.ribbon < 0 && ribbons.length > 1) { let best = 0, bd = Infinity; ribbons.forEach((r, k) => { const p = r.way.pts[0], dd = Math.hypot(p[0] - b.x, p[2] - b.z); if (dd < bd) { bd = dd; best = k; } }); b.ribbon = best; }
        if (into != null) b.runHeading = into + (lr() - 0.5) * 0.35;
        liftOne(b, tRun, lead);
        b.life = false;
      }
      return handle;
    },
    /**
     * They come down: birds in the air (and birds that have gone: they come back from far off) fly to a place, let their legs down, brake, run a few
     * steps on the water and stand.
     *   at       (bird) => [x, z]: where each is to stand (default: where it stood before it left)
     *   heading  radians: the way they land (default: into the wind; with no wind, the way they stood)
     *   then     'sleep' | 'one' | 'feed': what each does once it stands (default: it stands);   jitter (4), delay: seconds
     * A place within `safe` of the route's centre line is refused (the bird goes to its own place instead).
     */
    land({ who = null, at = null, heading = null, then = null, jitter = 4, delay = 0 } = {}) {
      const into = heading ?? (wind ? Math.atan2(-wind[0], -wind[1]) : null);
      const after_ = then && then !== 'stand' ? (ROUTE[`stand>${then}`] || []) : [];
      for (const b of chosen(who)) {
        if (b.base !== 'air' && b.base !== 'gone') continue;
        if (b.base === 'air' && (b.cur || (b.air && b.air.land))) continue;        // it is already coming down
        after(b, now() + delay + rnd() * jitter, (bb) => {
          if (bb.base !== 'air' && bb.base !== 'gone') return;
          let to = at ? at(bb) : null;
          if (to) { ctx.path.locate(to[0], to[1], null, loc); if (Math.abs(loc.d) < o.safe) to = null; }
          approach(bb, to || bb.home, into != null ? into + (rnd() - 0.5) * 0.3 : bb.home[2], after_);
          bb.life = then === 'sleep';
        });
      }
      return handle;
    },
    /** Put birds where a moment would have left them, at once and without playing anything (for a cue's settle()): 'sleep' | 'one' | 'stand' | 'feed' | 'gone'. */
    put(state, { who = null } = {}) {
      for (const b of chosen(who)) {
        b.pending = null; b.script.length = 0; b.cur = null; b.end = Infinity; b.held = 0;
        let st = state;
        if (st === 'gone') { if (!(b.rooted || b.stay)) { b.base = 'gone'; baked.hide(b.i); solid(b, false); continue; } st = 'one'; }
        if (b.rooted && (st === 'stand' || st === 'feed')) st = 'one';
        if (b.base === 'air' || b.base === 'gone') {            // (one that had left stands where it stood)
          b.x = b.home[0]; b.z = b.home[1]; b.y = b.ground; b.heading = b.home[2]; b.air = null; b.pitch = b.bank = 0;
          baked.set(b.i, { hidden: false, x: b.x, y: b.y, z: b.z, heading: b.heading, pitch: 0, bank: 0 });
        }
        b.base = b.dest = st; b.life = st === 'sleep'; b.going = false; solid(b, true);
        baked.play(b.i, IDLE[st], { fade: 0, phase: b.seed, rate: st === 'one' ? b.pace * 0.7 : b.pace });
      }
      return handle;
    },
    /** The sunline's height (metres), if the flock was given one of its own. */
    set sunline(y) { if (sunU) sunU.value.x = y; }, get sunline() { return sunU ? sunU.value.x : null; },
    /** The middle of the birds that are in the air (or, given `who`, of those birds wherever they are), for a sound that travels
     *  with them: `out` is set to it; returns how many birds were counted (0: `out` is left at the origin). */
    centre(out = new THREE.Vector3(), who = null) {
      let c = 0; out.set(0, 0, 0);
      for (const b of chosen(who)) { if (b.base === 'gone' || (who == null && b.base !== 'air')) continue; out.x += b.x; out.y += b.y; out.z += b.z; c++; }
      if (c) out.multiplyScalar(1 / c);
      return c;
    },
    /** Indices of the birds nearest a point. */
    nearest(x, z, count = 1) { return birds.filter((b) => b.base !== 'gone').map((b) => [Math.hypot(b.x - x, b.z - z), b.i]).sort((p, q) => p[0] - q[0]).slice(0, count).map((p) => p[1]); },
    /** What they are doing now: how many rest where, how many wear which form, triangles in one pass. */
    stats() { const out = { ...baked.stats(), sleep: 0, one: 0, stand: 0, feed: 0, air: 0, gone: 0 }; for (const b of birds) out[b.base]++; return out; },
    memory: baked.memory,
    /** This file's own work on the processor, milliseconds a frame, averaged since the flock was made. */
    get cost() { return cost.frames ? cost.ms / cost.frames : 0; },
  };
  return handle;
}
