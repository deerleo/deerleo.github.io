// Fronts: one helper for anything that travels as an edge across an area. Every showstopper of the ride has one
// (docs/art/README.md, "A front that travels"): wind lifting cloth and holding it, chevrons of fireflies, one ring
// under water, flame running round tiers and climbing them, a wall of rain behind which the sea stays lit, snow let
// go from the top of one tree downward, stars lifting point by point.
//
// A front is a line, a ring or a plane in the realm's own space (or an edge running along a coordinate of your
// own), with an eased edge and a ragged delay for every instance it crosses. It is evaluated by the SAME formula
// in GLSL (a snippet for a gouache `extend` or a shader of your own) and in JavaScript (for sounds and cues: has it
// reached this point yet? when will it?), so what is heard is what is seen.
//
//   import { makeFront } from '../engine/life/fronts.js';
//   const tide = makeFront(ctx, { name: 'tide', shape: 'line', speed: 14, lateral: 1 / 40, climb: 1 / 5,
//     rag: 0.35, stray: 0.06, profile: 'pulse', rise: 0.3, hold: 0.15, fall: 0.9,
//     clock: () => ctx.stage.clock('tide', (s) => (s - 160) / 1.2) });          // a show clock (docs/realm-guide.md)
//   const material = kit.gouache({ extend: { uniforms: tide.uniforms,
//     vertexPars: tide.glsl + 'attribute float aSeed; varying float vLit;', vertexWorld: 'vLit = tideLevel(wp.xyz, aSeed);',
//     fragmentPars: 'varying float vLit;', light: 'glow += vec3(0.8, 1.0, 0.5) * vLit;' } });
//   stage.cue('tide', { s: 160 }, () => {});
//   // in update():
//   const T = tide.T;                                                           // the clock's value this frame
//   if (stage.beat('tide.w1', T, 7)) tide.launch({ at: 7, origin: wall, dir: [0, 0, 1] });
//   if (stage.beat('tide.w1.boat', T, tide.arrival(boat.x, 0, boat.z))) ctx.audio.play('breath', { x: boat.x, z: boat.z });
//
// What `Level` returns is 0..1 (times the wave's strength): how far the thing at that point has been changed by the
// front. 'hold' fronts rise and stay (cloth lifted, a sea lit, a window awake); 'pulse' fronts rise, hold and fall (a
// firefly's one pulse as the front crosses it), so the band of lit things is speed x (rise + hold + fall) metres deep.
//
// The law (docs/art-direction.md): no large area may change brightness in under half a second. A front keeps it in
// three ways: the edge is eased over `rise` seconds and ragged by `rag`, and their sum may not be under half a second
// (it is lengthened, with a warning); nothing a wave touches can come up faster than half a second after its launch,
// wherever the wave was launched from; and with reduced motion a front takes the calmer form you give it in `calm`.
// docs/life/lights.md has the seven fronts of the ride as worked examples; src/realms/lifetest/lights.js runs them.
import * as THREE from 'three';

/** Seconds: the fastest a large area may change brightness. */
export const MIN_RISE = 0.5;
const MAX_WAVES = 8;
const f32 = Math.fround, K1 = f32(91.7), K2 = f32(517.3);
const fract32 = (x) => { const v = f32(x); return v - Math.floor(v); };
const smooth = (a, b, x) => { if (!(b > a)) return x >= b ? 1 : 0; const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const triple = (v, d) => (v == null ? d.slice() : typeof v === 'number' ? [v, 0, 0] : v.isVector3 ? [v.x, v.y, v.z] : [v[0] ?? 0, v[1] ?? 0, v[2] ?? 0]);

/**
 * The ragged delay of one instance, in seconds, from its seed (0..1): up to `rag` early or late, and a share `stray`
 * of all instances out of step by up to `strayBy` more. The GLSL twin is in the snippet below: keep them the same.
 */
export function ragDelay(seed, rag, stray = 0, strayBy = 0) {
  const s = f32(seed);
  let d = (s * 2 - 1) * rag;
  if (stray > 0 && fract32(s * K1) <= stray - 1e-6) d += (fract32(s * K2) * 2 - 1) * strayBy;
  return d;
}

/**
 * A brightness that may not jump. const g = makeGuard(); in update: uniform.value = g(target, dt);
 * It moves toward the target no faster than its whole range (0..1) in `seconds` (half a second: the law). g.set(v)
 * puts it somewhere at once (for a realm entered part-way, under the veil).
 */
export function makeGuard(seconds = MIN_RISE, start = 0) {
  let v = start;
  const g = (target, dt) => { const m = Math.max(0, dt) / Math.max(1e-3, seconds); v += Math.max(-m, Math.min(m, target - v)); return v; };
  g.set = (x) => { v = x; return g; };
  g.get = () => v;
  return g;
}

/**
 * A travelling front. opts:
 *   name       letters and digits, starting with a letter: the prefix of its GLSL names (default 'front'). Two fronts
 *              in one material need two names
 *   shape      'line'   a straight line on the water travelling along `dir` (y ignored): wind, fireflies, the wave of stars
 *              'ring'   a circle spreading on the water from `origin`: the bell's waking ring
 *              'plane'  a plane in space travelling along `dir` (any direction): rain's oblique wall, snow let go downward
 *              'along'  an edge running along a number of your own (arc length round a tier, in metres), both ways
 *                       from `origin` (a number), or one way if `dir` is +1 or -1
 *   origin     [x, y, z] where a wave starts unless its launch says otherwise (ring: its centre; along: a number)
 *   dir        [x, y, z] the way it travels (along: 0 both ways, +1 or -1 one way)
 *   speed      metres a second (default 10); 0 = a front that stands where `place` puts it (a sunline)
 *   lateral    line, plane: seconds later for every metre to the side of the axis through `origin` along `dir`. On a
 *              line it bends the front into a chevron; on a plane that falls it makes the front leave from the axis outward
 *   climb      line, ring: seconds later for every metre above `origin`'s height (ring: above or below): the front climbs
 *              whatever it passes
 *   rag        seconds: each instance is up to this much early or late, by its seed (default 0)
 *   stray, strayBy   the share of instances that are out of step with their neighbours (say 0.06), and by how many seconds
 *   profile    'hold' (default): rises over `rise` and stays;  'pulse': rises over `rise`, holds `hold`, falls over `fall`
 *   rise, hold, fall   seconds (defaults 0.8, 0.15, 0.9)
 *   cap        the most that several waves crossing at once add up to (default 1.5: brighter where they cross, never double)
 *   waves      how many waves can be on their way at once (default 4, at most 8)
 *   clock      where its time comes from: a function returning seconds (a show clock: () => stage.clock('name', f)),
 *              or leave it out and call front.tick(T) every frame yourself. While the clock is negative nothing shows
 *   calm       what reduced motion (ctx.reducedMotion) makes of it:
 *                { rise: 2.5 }             the same travel with a slower edge (the town's waking ring)
 *                { even: 3 }               no travelling edge: everything it would cross rises together over 3 s (the theatre)
 *                { swell: 10, max: 0.6 }   a slow swell of the whole field, once per wave (the fireflies)
 *              left out: the edge is slowed to at least a second
 *   large      false for a front over a small thing (one bracket of candles): the half-second law is not applied
 *   farthest   metres: a pulse wave that has travelled this far has crossed everything and gives up its place (600)
 * Returns the front:
 *   glsl                       declarations for a shader: uniforms, and the functions
 *                                float <name>Since(int k, vec3 p, float seed, float group)    seconds since wave k passed p (negative: not yet)
 *                                float <name>Level(vec3 p, float seed, float group)           0..cap: all waves together
 *                                float <name>Level(vec3 p, float seed)                        the same for an instance with no group
 *                              ('along' fronts take `float coord` in place of `vec3 p`)
 *   uniforms                   give them to the material that uses `glsl` (spread into its uniforms, or extend.uniforms)
 *   T                          the clock's value this frame;   tick(T)   set it yourself
 *   launch({ at, strength, origin, dir, speed, group, reach, closing })   send a wave. at: clock time it leaves (default now);
 *                              origin / dir / speed: this wave's own (default the front's); group: only instances of that
 *                              group answer (left out: all); reach: { x, y, z, at }: place the origin so that the wave is
 *                              at that point at that time (two waves that must meet where the boat is); closing: metres,
 *                              for a ring that begins that far out and closes on its origin (a town going to sleep in
 *                              rings that close on its tower). Returns its number
 *   repeat({ from, every, ...as launch })   send a wave every `every` seconds from clock time `from`, for as long as
 *                              the clock runs (the fireflies' steady waves: one every 8.5 s at 60 per cent). Set it once,
 *                              at build: it waits for the clock. A clock that is already far along (a realm entered
 *                              part-way, a rider who comes back) gets the wave that is on its way now, where it would be.
 *                              Returns { stop() }
 *   wave(k)                    what wave k is: { at, group, strength, speed } (null if that place is empty)
 *   settle(strength)           put everything in the state the front leaves behind, at once (a realm entered part-way)
 *   clear(), stop(k)           no waves; one wave off. Both act AT ONCE (nothing is eased): for use under the veil, or on
 *                              a wave that has not arrived yet
 *   since(x, y, z, seed, k)    JS twin of <name>Since for wave k (default: the last one launched), whatever its group;
 *                              seed defaults to 0.5, the middle of the rag
 *   level(x, y, z, seed, group)   JS twin of <name>Level
 *   reached(x, y, z, k)        has wave k passed this point?
 *   arrival(x, y, z, seed, k)  the clock time at which wave k reaches this point (use with stage.beat for sounds)
 *   distance(x, y, z, k)       metres between the point and the front: negative while the front is still on its way to it
 *   position(k, out)           metres wave k has travelled, and (out, a Vector3) the point on its axis where the front is now
 *   place(k, origin)           move a wave's origin (a standing front, speed 0, lies through it: `rise` is then in METRES)
 * For 'along' fronts pass the coordinate as x: since(coord, 0, 0, seed, k).
 */
export function makeFront(ctx, opts = {}) {
  const o = { name: 'front', shape: 'line', origin: [0, 0, 0], dir: [0, 0, -1], speed: 10, lateral: 0, climb: 0, rag: 0, stray: 0, strayBy: 1.2,
    profile: 'hold', rise: 0.8, hold: 0.15, fall: 0.9, cap: 1.5, waves: 4, clock: null, calm: null, large: true, farthest: 600, ...opts };
  const name = String(o.name).replace(/[^A-Za-z0-9]/g, '') || 'front';
  const N = Math.max(1, Math.min(MAX_WAVES, Math.round(o.waves)));
  const shape = ['line', 'ring', 'plane', 'along'].includes(o.shape) ? o.shape : 'line';
  const pulse = o.profile === 'pulse';
  const calmOn = !!ctx.reducedMotion;
  const calm = calmOn ? (o.calm || { rise: Math.max(1, o.rise) }) : null;
  const calmMode = !calm ? 0 : calm.even ? 1 : calm.swell ? 2 : 0;
  let rise = Math.max(1e-3, o.rise);
  if (calm && calm.rise) rise = Math.max(rise, calm.rise);
  // ---- the guard: an edge over a large area may not be quicker than the law allows
  const floor = calmOn ? Math.max(MIN_RISE, 1) : MIN_RISE;
  if (o.large && o.speed > 0 && calmMode === 0 && rise + Math.abs(o.rag) < floor - 1e-6) {      // (a front that reduced motion has turned into an even rise or a swell has no edge to check)
    const was = rise; rise = floor - Math.abs(o.rag);
    console.warn(`INVALID_FRONT '${name}': an edge of ${was.toFixed(2)} s with ${Math.abs(o.rag).toFixed(2)} s of rag is quicker than the law allows (${floor} s for a large area). It was lengthened to ${rise.toFixed(2)} s; give \`large: false\` if this front only crosses a small thing.`);
  }
  const guardRise = o.large ? floor : 0.05;                    // nothing comes up faster than this after a wave's launch

  // ---- the waves: O = origin xyz + the clock time it left; D = direction xyz + speed; S = strength, group, on, the radius a closing ring starts from
  const O = Array.from({ length: N }, () => new THREE.Vector4(0, 0, 0, -1e6));
  const D = Array.from({ length: N }, () => new THREE.Vector4(0, 0, -1, 0));
  const S = Array.from({ length: N }, () => new THREE.Vector4(0, -1, 0, 0));
  const u = (k) => `${name}${k}`;
  const uniforms = {
    [u('O')]: { value: O }, [u('D')]: { value: D }, [u('S')]: { value: S },
    [u('P')]: { value: new THREE.Vector4(o.lateral, o.climb, o.rag, o.strayBy) },
    [u('Q')]: { value: new THREE.Vector4(rise, o.hold, o.fall, o.stray) },
    [u('C')]: { value: new THREE.Vector4(calmMode, calmMode === 1 ? calm.even : calmMode === 2 ? calm.swell : 0, calmMode === 2 ? (calm.max ?? 0.6) : 1, guardRise) },
    [u('T')]: { value: -1 },
  };
  const P = uniforms[u('P')].value, Q = uniforms[u('Q')].value, C = uniforms[u('C')].value, Tu = uniforms[u('T')];

  // ---- GLSL. Everything below has a twin in JavaScript further down: change both or neither.
  const arg = shape === 'along' ? 'float p' : 'vec3 p';
  const geometry = {
    line: `vec2 q = p.xz - O.xz; float al = dot(q, D.xz);
      float tau = (travelled - al) / pace - ${u('P')}.x * abs(q.x * D.z - q.y * D.x) - ${u('P')}.y * max(p.y - O.y, 0.0);`,
    ring: `float away = length(p.xz - O.xz);
      float tau = (travelled - (S.w > 0.0 ? max(S.w - away, 0.0) : away)) / pace - ${u('P')}.y * abs(p.y - O.y);`,
    plane: `vec3 q = p - O.xyz; float al = dot(q, D.xyz);
      float tau = (travelled - al) / pace - ${u('P')}.x * length(q - D.xyz * al);`,
    along: `float tau = (travelled - (D.x == 0.0 ? abs(p - O.x) : (p - O.x) * sign(D.x))) / pace;`,
  }[shape];
  const glsl = /* glsl */`
    uniform vec4 ${u('O')}[${N}], ${u('D')}[${N}], ${u('S')}[${N}], ${u('P')}, ${u('Q')}, ${u('C')}; uniform float ${u('T')};
    float ${name}Rag(float seed) {
      return (seed * 2.0 - 1.0) * ${u('P')}.z + step(fract(seed * 91.7), ${u('Q')}.w - 1e-6) * (fract(seed * 517.3) * 2.0 - 1.0) * ${u('P')}.w;
    }
    float ${name}Since(int k, ${arg}, float seed, float group) {
      vec4 O = ${u('O')}[k], D = ${u('D')}[k], S = ${u('S')}[k];
      if (S.z < 0.5 || (S.y >= 0.0 && abs(S.y - group) > 0.5)) return -1e6;
      float age = ${u('T')} - O.w;
      if (${u('C')}.x > 0.5) return age - ${name}Rag(seed) * 0.5;               // reduced motion: no travelling edge
      float pace = D.w > 0.0 ? D.w : 1.0, travelled = D.w * age;
      ${geometry}
      return tau - ${name}Rag(seed);
    }
    float ${name}Shape(float tau) {
      if (${u('C')}.x > 1.5) return ${u('C')}.z * (0.5 - 0.5 * cos(6.2831853 * clamp(tau / ${u('C')}.y, 0.0, 1.0)));
      float up = smoothstep(0.0, ${u('C')}.x > 0.5 ? ${u('C')}.y : ${u('Q')}.x, tau);
      ${pulse ? `return ${u('C')}.x > 0.5 ? up : up * (1.0 - smoothstep(${u('Q')}.x + ${u('Q')}.y, ${u('Q')}.x + ${u('Q')}.y + ${u('Q')}.z, tau));` : 'return up;'}
    }
    float ${name}Level(${arg}, float seed, float group) {
      float lv = 0.0;
      for (int k = 0; k < ${N}; k++) {
        float tau = ${name}Since(k, p, seed, group);
        if (tau > 0.0) lv += ${u('S')}[k].x * ${name}Shape(tau) * smoothstep(0.0, ${u('C')}.w, ${u('T')} - ${u('O')}[k].w);
      }
      return min(lv, ${Number(o.cap).toFixed(3)});
    }
    float ${name}Level(${arg}, float seed) { return ${name}Level(p, seed, -1.0); }
  `;

  // ---- the JavaScript twins (anyGroup: a question about the wave itself, whatever group it was sent to)
  const rag = (seed) => ragDelay(seed, P.z, Q.w, P.w);
  const sinceK = (k, x, y, z, seed, group, anyGroup) => {
    const Ok = O[k], Dk = D[k], Sk = S[k];
    if (Sk.z < 0.5 || (!anyGroup && Sk.y >= 0 && Math.abs(Sk.y - group) > 0.5)) return -1e6;
    const age = Tu.value - Ok.w;
    if (C.x > 0.5) return age - rag(seed) * 0.5;
    const pace = Dk.w > 0 ? Dk.w : 1, travelled = Dk.w * age;
    let tau;
    if (shape === 'line') { const qx = x - Ok.x, qz = z - Ok.z, al = qx * Dk.x + qz * Dk.z; tau = (travelled - al) / pace - P.x * Math.abs(qx * Dk.z - qz * Dk.x) - P.y * Math.max(y - Ok.y, 0); }
    else if (shape === 'ring') { const away = Math.hypot(x - Ok.x, z - Ok.z); tau = (travelled - (Sk.w > 0 ? Math.max(Sk.w - away, 0) : away)) / pace - P.y * Math.abs(y - Ok.y); }
    else if (shape === 'plane') { const qx = x - Ok.x, qy = y - Ok.y, qz = z - Ok.z, al = qx * Dk.x + qy * Dk.y + qz * Dk.z; tau = (travelled - al) / pace - P.x * Math.hypot(qx - Dk.x * al, qy - Dk.y * al, qz - Dk.z * al); }
    else tau = (travelled - (Dk.x === 0 ? Math.abs(x - Ok.x) : (x - Ok.x) * Math.sign(Dk.x))) / pace;
    return tau - rag(seed);
  };
  const shapeOf = (tau) => {
    if (C.x > 1.5) return C.z * (0.5 - 0.5 * Math.cos(2 * Math.PI * Math.min(1, Math.max(0, tau / C.y))));
    const up = smooth(0, C.x > 0.5 ? C.y : Q.x, tau);
    return pulse && C.x < 0.5 ? up * (1 - smooth(Q.x + Q.y, Q.x + Q.y + Q.z, tau)) : up;
  };

  let last = -1, serial = 0, warned = false;
  const born = new Array(N).fill(-1), repeats = [];
  const span = (pulse ? rise + o.hold + o.fall : 0) + Math.abs(o.rag) + (o.stray > 0 ? o.strayBy : 0) + 2;
  // a pulse wave that has left everything behind gives up its place, so `waves` need only cover those in view at once
  const step = (T) => {
    Tu.value = T;
    if (pulse) for (let i = 0; i < N; i++) {
      if (S[i].z < 0.5) continue;
      const age = T - O[i].w, done = C.x > 0.5 ? age > C.y + span : D[i].w > 0 && age > o.farthest / D[i].w + span;
      if (done) { S[i].z = 0; born[i] = -1; }
    }
    // the waves that repeat: the one whose turn has come (and, for a clock that has jumped far ahead, the one before it,
    // which is still crossing)
    for (const r of repeats) {
      if (r.dead || T < r.from) continue;
      const n = Math.floor((T - r.from) / r.every);
      if (n <= r.sent) continue;
      for (let m = Math.max(r.sent + 1, n - 1); m <= n; m++) front.launch({ ...r.wave, at: r.from + m * r.every });
      r.sent = n;
    }
  };
  const front = {
    name, shape, glsl, uniforms, waves: N,
    /** True when reduced motion has changed this front's form (see `calm`); the edge's length after the guard. */
    calm: calmOn, rise,
    /** With reduced motion and `calm: { even }`: the seconds everything rises over together (0 otherwise). */
    calmEven: calmMode === 1 ? calm.even : 0,
    /** The clock's value this frame (negative before the clock has started). */
    get T() { return Tu.value; },
    /** The number of the last wave launched (-1: none). */
    get last() { return last; },
    tick(T) { step(T); return front; },
    launch(w = {}) {
      // a free place if there is one, else the oldest wave's
      let k = -1, oldest = Infinity, free = false;
      for (let i = 0; i < N; i++) { if (S[i].z < 0.5) { k = i; free = true; break; } if (born[i] < oldest) { oldest = born[i]; k = i; } }
      // (a 'hold' wave never gives up its place: when there is none left the oldest is taken, and whatever it had changed
      // goes back at once. That is a jump: say so, once)
      if (!free && !pulse && !warned) { warned = true; console.warn(`INVALID_FRONT '${name}': all ${N} waves are in use and this front holds what it has changed; the oldest wave was taken, and what it held let go at once. Give \`waves: ${N + 1}\` or more (at most ${MAX_WAVES}).`); }
      const at = w.at ?? Math.max(0, Tu.value), speed = w.speed ?? o.speed;
      const org = triple(w.origin ?? o.origin, [0, 0, 0]);
      let dir = triple(w.dir ?? o.dir, [0, 0, -1]);
      if (shape === 'line') dir[1] = 0;
      if (shape === 'along') dir = [Math.sign(dir[0]), 0, 0];
      else { const l = Math.hypot(dir[0], dir[1], dir[2]) || 1; dir = dir.map((v) => v / l); }
      if (w.reach && (shape === 'line' || shape === 'plane')) {       // be at this point at this time
        const lead = speed * (w.reach.at - at);
        org[0] = w.reach.x - dir[0] * lead; org[2] = w.reach.z - dir[2] * lead;
        if (shape === 'plane') org[1] = (w.reach.y ?? 0) - dir[1] * lead; else if (w.origin == null) org[1] = w.reach.y ?? org[1];
      }
      O[k].set(org[0], org[1], org[2], at); D[k].set(dir[0], dir[1], dir[2], speed); S[k].set(w.strength ?? 1, w.group ?? -1, 1, shape === 'ring' ? Math.max(0, w.closing ?? 0) : 0);
      born[k] = serial++; last = k;
      return k;
    },
    repeat(r = {}) {
      const { from = 0, every = 8.5, ...wave } = r, rep = { from, every: Math.max(0.5, every), wave, sent: -1, dead: false, stop() { rep.dead = true; } };
      repeats.push(rep); return rep;
    },
    wave(k = last) { return k >= 0 && k < N && S[k].z > 0.5 ? { at: O[k].w, group: S[k].y, strength: S[k].x, speed: D[k].w } : null; },
    settle(strength = 1) { front.clear(); return front.launch({ at: -1e5, strength }); },
    clear() { for (let i = 0; i < N; i++) { S[i].set(0, -1, 0, 0); born[i] = -1; } last = -1; return front; },
    stop(k) { if (k >= 0 && k < N) { S[k].z = 0; born[k] = -1; } return front; },
    place(k, origin) { const org = triple(origin, [0, 0, 0]); if (k >= 0 && k < N) { O[k].x = org[0]; O[k].y = org[1]; O[k].z = org[2]; } return front; },
    since(x, y = 0, z = 0, seed = 0.5, k = last) { return k < 0 ? -1e6 : sinceK(k, x, y, z, seed, -1, true); },
    level(x, y = 0, z = 0, seed = 0.5, group = -1) {
      let lv = 0;
      for (let k = 0; k < N; k++) { const tau = sinceK(k, x, y, z, seed, group, false); if (tau > 0) lv += S[k].x * shapeOf(tau) * smooth(0, C.w, Tu.value - O[k].w); }
      return Math.min(lv, o.cap);
    },
    reached(x, y = 0, z = 0, k = last) { return front.since(x, y, z, 0.5, k) >= 0; },
    arrival(x, y = 0, z = 0, seed = 0.5, k = last) { return k < 0 || S[k].z < 0.5 ? Infinity : Tu.value - sinceK(k, x, y, z, seed, -1, true); },
    distance(x, y = 0, z = 0, k = last) { if (k < 0 || S[k].z < 0.5) return -Infinity; return (sinceK(k, x, y, z, 0.5, -1, true) + rag(0.5) * (C.x > 0.5 ? 0.5 : 1)) * (D[k].w > 0 ? D[k].w : 1); },
    position(k = last, out = null) {
      if (k < 0) return 0;
      const travelled = D[k].w * (Tu.value - O[k].w);
      if (out) { if (shape === 'ring' || shape === 'along') out.set(O[k].x, O[k].y, O[k].z); else out.set(O[k].x + D[k].x * travelled, O[k].y + D[k].y * travelled, O[k].z + D[k].z * travelled); }
      return travelled;
    },
  };
  if (typeof o.clock === 'function') ctx.onUpdate(() => step(o.clock()));
  return front;
}
