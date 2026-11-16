// Lights: the floating and rising lights of the ride. Each is one instanced system, drawn once, with times of its own
// for every light; all of them fade with the fog and the veil, keep clear of the rider's eye, and are meshes (never
// points), so the water's mirror draws them like anything else.
//
//   makeFireflies     small soft lights in the air that pulse as a front crosses them, alone as scouts, or when
//                     called by name, and go dark round the hull, the kept lamp and any living thing (the orchard's
//                     tide; the snow's mirror)
//   makeFlames        modelled candle flames with a kindle time each: a wick's glow, a bead, then the flame stands up;
//                     they lean with a draught, flicker out of step, steam in rain (the theatre's 890)
//   makeBedLights     lights lying on a lake bed (a faceted stone when near) that breathe, answer the prow lantern, and
//                     rise one by one or as a front crosses them, each leaving a ring, going out at a sunline (the
//                     sky's fallen stars)
//   makeRings         a pool of rings on the water for events too far off for the water's own ripples
//   makeFallingStars  streaks across the sky with their reflections; some come down as embers and land
//   makeLampGlobe     the globe of gold flakes round a lamp in falling snow
//   makeLampDomes     domes of lamplight under the water round lamps that burn just beneath it (the town)
//   scatter           places for a multitude, from volumes given the way the area pages give them
//
// The jellies are in jellies.js and the helper for fronts in fronts.js. docs/life/lights.md is the manual: what each
// gives, every option, how to stage it with ctx.stage, what it costs, and the notes on the real things.
//
// Two rules that everything here keeps (and that cost a day to learn):
//   - Light is ADDED to the picture, so one pixel that is not a number becomes a black disc once the painter has
//     passed. Whatever is one value for a whole quad is passed `flat` or `centroid`; every result is clamped.
//   - Nothing here is drawn in the engine's picture of the scene without the water (see perPass), or the water would
//     show it a second time beneath itself.
import * as THREE from 'three';
import { FOG_PARS } from '../kit.js';
import { makeFront, makeGuard, MIN_RISE } from './fronts.js';

export { makeFront, makeGuard, MIN_RISE };

const _size = new THREE.Vector2(), _v = new THREE.Vector3();
const col = (c) => (c && c.isColor ? c.clone() : new THREE.Color(c ?? '#ffffff'));
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const smooth = (a, b, x) => { if (!(b > a)) return x >= b ? 1 : 0; const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };

/** The nearest anything in this family may come to the rider's eye, metres (docs/life.md, rule 9). */
export const KEEP_CLEAR = 0.7;

// Which pass is being drawn (0 the scene without the water, 1 the picture, 2 the mirror) and how many pixels a metre
// covers at one metre from the eye in it: sizes in pixels differ between the picture and the smaller mirror.
// The engine first draws the scene without the water, for the water to bend; light that is in the air or lies on the
// water has no place in that picture (the water would show it a second time, beneath itself), so unless `inPre` is
// given nothing at all is sent in that pass: the instance count is set to none just before the draw. A geometry
// whose count changes keeps the true one in `geometry.userData.count`.
function perPass(engine, obj, mat, inPre = false) {
  obj.onBeforeRender = (renderer, scene, camera, geometry) => {
    const rt = renderer.getRenderTarget(), h = rt ? rt.height : renderer.getDrawingBufferSize(_size).y, u = mat.uniforms, pass = engine.reflecting ? 2 : rt === engine.pre ? 0 : 1;
    if (u.uPx) u.uPx.value = h * 0.5 * camera.projectionMatrix.elements[5];
    if (u.uPass) u.uPass.value = pass;
    if (geometry.userData.count == null) geometry.userData.count = geometry.instanceCount;
    geometry.instanceCount = pass === 0 && !inPre ? 0 : geometry.userData.count;
    mat.uniformsNeedUpdate = true;
  };
}
const sharedOf = (ctx) => { const s = ctx.engine.shared; return { uTime: s.uTime, uFogColor: s.uFogColor, uFogDensity: s.uFogDensity, uVeilColor: s.uVeilColor, uVeil: s.uVeil, uCameraPos: s.uCameraPos, uBoat: s.uBoat }; };
function quadGeometry() {
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  return g;
}
/** Positions given as [[x, y, z], ...], [{x, y, z}, ...], Vector3s or a flat Float32Array -> a flat Float32Array. */
function flat(points) {
  if (points instanceof Float32Array) return points;
  const out = new Float32Array(points.length * 3);
  points.forEach((p, i) => { if (Array.isArray(p)) out.set([p[0], p[1], p[2]], i * 3); else out.set([p.x, p.y, p.z], i * 3); });
  return out;
}
/**
 * Places for a multitude, from volumes given the way the area pages give them. Returns a flat Float32Array (x, y, z).
 *   count      how many
 *   volumes    [{ s: [from, to], d: [from, to], y: [from, to], weight }]   boxes along the waterway: s metres along,
 *              d metres right of the centre line, y above the water. `weight` is the share of the count (default 1).
 *              or { centre: [x, y, z], radius, height, weight }: an upright cylinder in the realm's coordinates
 *   keep       (x, y, z, s, d) => false to refuse a place (inside a trunk, on the lane)
 *   seed
 */
export function scatter(ctx, { count, volumes, keep = null, seed = 1 }) {
  const rnd = ctx.rng(seed), out = new Float32Array(count * 3), total = volumes.reduce((a, v) => a + (v.weight ?? 1), 0);
  let n = 0, tries = 0;
  while (n < count && tries < count * 40) {
    tries++;
    let pick = rnd() * total, v = volumes[volumes.length - 1];
    for (const c of volumes) { pick -= (c.weight ?? 1); if (pick <= 0) { v = c; break; } }
    let x, y, z, s = 0, d = 0;
    if (v.centre) { const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * v.radius; x = v.centre[0] + Math.cos(a) * r; z = v.centre[2] + Math.sin(a) * r; y = v.centre[1] + rnd() * (v.height ?? 1); }
    else { s = v.s[0] + (v.s[1] - v.s[0]) * rnd(); d = v.d[0] + (v.d[1] - v.d[0]) * rnd(); y = v.y[0] + (v.y[1] - v.y[0]) * (v.low ? rnd() * rnd() : rnd()); ctx.kit.at(s, d, y, _v); x = _v.x; z = _v.z; }
    if (keep && !keep(x, y, z, s, d)) continue;
    out[n * 3] = x; out[n * 3 + 1] = y; out[n * 3 + 2] = z; n++;
  }
  return n < count ? out.subarray(0, n * 3) : out;
}

// ================================================================================================= fireflies
/**
 * Fireflies: small soft lights in the air, each wandering about its own place. They are dark most of the time. One
 * lights for a single slow pulse when a front crosses it (ragged, a few out of step), or alone, as a scout. They stay
 * dark round the hull and for a few seconds in its track, and round anything given in `avoid` (the kept lamp, a
 * wading stag). They are small meshes on the ordinary layers, so the water's mirror draws them: by default every
 * firefly in the direct view, and about a third of them, larger, in the mirror.
 *
 *   const flies = makeFireflies(ctx, { points: scatter(ctx, { count: 7000, volumes: [...] }),
 *     avoid: [{ position: lamp.position, radius: 7 }, { position: stag.group.position, radius: 4 }] });
 *   stage.cue('scouts', { s: 140 }, () => flies.scouts(1));                       // sixty pulse alone, now and then
 *   stage.cue('tide', { s: 160 }, () => flies.scouts(0, 1.5));
 *   // in update(): const T = stage.clock('tide'); flies.tick(T);
 *   //              if (stage.beat('w1', T, 7)) flies.wave({ at: 7, origin: kit.at(236, 0), dir: back, strength: 1 });
 *
 * opts:
 *   points          where they live: [[x, y, z], ...], Vector3s or a flat Float32Array (see `scatter`). Keep them above
 *                   0.3 m: a light under the water is not a firefly
 *   count           the count at high quality, if fewer than the points given (thinned by the quality setting unless `exact`)
 *   color           '#d6ee8c'; intensity 3.5 (above 1 it blooms and the mirror grows a dash under it)
 *   size            [0.04, 0.07] metres across (each its own)
 *   wander          [0.3, 0.9] metres each strays from its place (at 0.15 to 0.4 m/s)
 *   pulse           { rise: 0.3, hold: 0.15, fall: 0.9 } seconds: one pulse
 *   front           a front of your own (makeFront, shape 'line', profile 'pulse'); left out, one is made with the
 *                   orchard's numbers: 14 m/s, a chevron (1/40 s a metre sideways), climbing (1/5 s a metre), ragged
 *                   by 0.35 s, 6 per cent out of step; reduced motion turns it into a slow swell (10 s, 60 per cent)
 *   speed, lateral, climb, rag, stray   numbers for the front that is made (see makeFront)
 *   scouts          how many may pulse alone (60), and scoutEvery: [5, 9] seconds between a scout's pulses;
 *                   scoutBelow: only fireflies under this height are scouts (1.5 m)
 *   hull            { dark: 5, soft: 8, track: 6 }: dark within 5 m of the boat, soft to 8 m, and for 6 s in its track;
 *                   false for none (a set drawn only in the mirror of another season)
 *   avoid           [{ position: Vector3 (yours to move), radius }]: up to eight places no firefly lights near
 *   mirror          the share drawn in the mirror, as larger lights (default 0.36); 0 = none; 1 = all
 *   mirrorSize      how much larger the mirror's are (1.7)
 *   only            'mirror': they exist only in the water (the snow orchard's memory); 'direct': never in the water
 *   minPixels       a far firefly is never drawn smaller than this, only fainter (2.2)
 *   exact, seed, parent
 * Returns { object, front, count,
 *   tick(T)                  the show clock for the front (when you did not give the front a clock of its own)
 *   wave({ at, origin, dir, strength, reach })   send a front (see makeFront's launch); strength 0.6 for the steady ones
 *   repeat({ from, every, origin, dir, strength })   a wave every `every` seconds from clock time `from`, for as long as
 *                            the clock runs: set once, at build (see makeFront's repeat)
 *   call({ at, near, count, radius, share, over, strength })   a few answer by themselves: the `count` nearest the
 *                            point `near` ([x, y, z]) each pulse once (count 1: that one firefly), or everything within
 *                            `radius` metres, or a `share` of it (0.1: one in ten); each at its own moment within `over`
 *                            seconds of `at` (the front's clock). Six calls can be alight at once
 *   scouts(level, seconds)   let the scouts pulse (1) or not (0), eased over `seconds`
 *   level(v, seconds)        all of them, 0..1 (none before the lamp has been passed)
 *   avoid                    the list given: move the positions, change the radii
 *   litNear(x, y, z, radius) roughly how lit the air is round a point just now, 0..1 (for a sound that follows the front) }
 */
export function makeFireflies(ctx, opts = {}) {
  const o = { points: null, count: null, color: '#d6ee8c', intensity: 3.5, size: [0.04, 0.07], wander: [0.3, 0.9], pulse: { rise: 0.3, hold: 0.15, fall: 0.9 },
    front: null, speed: 14, lateral: 1 / 40, climb: 1 / 5, rag: 0.35, stray: 0.06, scouts: 60, scoutEvery: [5, 9], scoutBelow: 1.5,
    hull: { dark: 5, soft: 8, track: 6 }, avoid: [], mirror: 0.36, mirrorSize: 1.7, only: null, minPixels: 2.2, exact: false, seed: 31, parent: null, ...opts };
  const engine = ctx.engine, src = flat(o.points || []), have = src.length / 3;
  const want = Math.min(have, o.count ?? have), n = o.exact ? want : Math.min(have, Math.max(1, Math.round(want * (ctx.quality.density || 1))));
  const rnd = ctx.rng(o.seed);
  // the order is shuffled, so that any first part of the list is spread over the whole place (the mirror draws the first third)
  const order = Array.from({ length: have }, (_, i) => i);
  for (let i = have - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)), t = order[i]; order[i] = order[j]; order[j] = t; }
  const home = new Float32Array(n * 4), seed = new Float32Array(n * 4);
  let scoutsLeft = Math.min(n, Math.round(o.scouts * (o.exact ? 1 : Math.max(0.5, ctx.quality.density || 1))));
  for (let i = 0; i < n; i++) {
    const k = order[i] * 3, y = Math.max(0.3, src[k + 1]);
    home.set([src[k], y, src[k + 2], o.size[0] + (o.size[1] - o.size[0]) * rnd()], i * 4);
    const scout = scoutsLeft > 0 && y < o.scoutBelow ? (scoutsLeft--, o.scoutEvery[0] + (o.scoutEvery[1] - o.scoutEvery[0]) * rnd()) : 0;
    seed.set([rnd(), rnd(), rnd(), scout], i * 4);
  }
  const front = o.front || makeFront(ctx, { name: 'tide', shape: 'line', speed: o.speed, lateral: o.lateral, climb: o.climb, rag: o.rag, stray: o.stray, strayBy: 1.4,
    profile: 'pulse', rise: o.pulse.rise, hold: o.pulse.hold, fall: o.pulse.fall, waves: 6, calm: { swell: 10, max: 0.6 } });
  const fname = front.name, KEEP = 8, CALLS = 6;
  const keep = Array.from({ length: KEEP }, () => new THREE.Vector4(0, -1000, 0, 0));
  // calls: (place xyz, reach) and (clock time, strength, share, seconds they are spread over)
  const callA = Array.from({ length: CALLS }, () => new THREE.Vector4(0, -1000, 0, 0)), callB = Array.from({ length: CALLS }, () => new THREE.Vector4(-1e6, 0, 1, 0));
  const uniforms = {
    ...sharedOf(ctx), ...front.uniforms,
    uPx: { value: 800 }, uPass: { value: 1 }, uColor: { value: col(o.color).multiplyScalar(o.intensity) }, uLevel: { value: 1 }, uScout: { value: 0 },
    uWander: { value: new THREE.Vector2(o.wander[0], o.wander[1] - o.wander[0]) }, uMinPx: { value: o.minPixels }, uSizeK: { value: 1 },
    uHull: { value: new THREE.Vector3(o.hull ? o.hull.dark : -2, o.hull ? o.hull.soft : -1, o.hull ? 1 : 0) }, uTail: { value: new THREE.Vector3() }, uKeep: { value: keep },
    uCallA: { value: callA }, uCallB: { value: callB },
  };
  const vertexShader = /* glsl */`
    attribute vec4 aHome, aSeed;
    uniform float uTime, uPx, uPass, uLevel, uScout, uMinPx, uSizeK; uniform vec2 uWander; uniform vec3 uCameraPos, uBoat, uTail, uHull, uColor; uniform vec4 uKeep[${KEEP}], uCallA[${CALLS}], uCallB[${CALLS}];
    ${FOG_PARS}
    ${front.glsl}
    varying vec2 vQ; varying vec3 vCol;
    float onePulse(float tau) { return smoothstep(0.0, ${o.pulse.rise.toFixed(3)}, tau) * (1.0 - smoothstep(${(o.pulse.rise + o.pulse.hold).toFixed(3)}, ${(o.pulse.rise + o.pulse.hold + o.pulse.fall).toFixed(3)}, tau)); }
    float toSegment(vec2 p, vec2 a, vec2 b) { vec2 pa = p - a, ba = b - a; return length(pa - ba * clamp(dot(pa, ba) / max(dot(ba, ba), 1e-4), 0.0, 1.0)); }
    void main() {
      vec3 home = aHome.xyz;
      // ---- how lit: the fronts that cross its place, and a scout's own pulse now and then
      float lv = ${fname}Level(home, aSeed.x);
      if (aSeed.w > 0.0 && uScout > 0.0) lv += uScout * onePulse(mod(uTime + aSeed.y * aSeed.w, aSeed.w));
      // ---- and those that are called: the few nearest a place answer once, each at its own moment
      for (int i = 0; i < ${CALLS}; i++) {
        vec4 ca = uCallA[i], cb = uCallB[i];
        if (cb.y > 0.0 && aSeed.z <= cb.z && distance(home, ca.xyz) <= ca.w) lv += cb.y * onePulse(${fname}T - cb.x - cb.w * fract(aSeed.x * 7.31 + float(i) * 0.37));
      }
      // ---- where: a slow wander about its place, two turns of different lengths on every axis
      float sd = aSeed.z * 6.2831853, t = uTime;
      vec3 w = vec3(sin(t * (0.31 + 0.23 * aSeed.y) + sd) + 0.45 * sin(t * (0.83 + 0.4 * aSeed.x) + sd * 1.7),
                    0.4 * sin(t * (0.27 + 0.2 * aSeed.z) + sd * 2.3) + 0.2 * sin(t * 0.71 + sd * 0.6),
                    cos(t * (0.29 + 0.25 * aSeed.x) + sd * 1.3) + 0.45 * sin(t * (0.77 + 0.35 * aSeed.y) + sd * 2.9));
      vec3 p = home + w * ((uWander.x + uWander.y * aSeed.y) / 1.45);
      p.y = max(p.y + 0.10 * lv, 0.12);                                // a lit one lifts a hand's breadth as it glows
      // ---- dark round the hull and in its track, and round every place it must leave alone
      float dark = uHull.z > 0.5 ? smoothstep(uHull.x, uHull.y, toSegment(p.xz, uBoat.xz, uTail.xz)) : 1.0;
      for (int i = 0; i < ${KEEP}; i++) { vec4 k = uKeep[i]; if (k.w > 0.0) dark *= smoothstep(k.w, k.w * 1.35 + 0.6, distance(p, k.xyz)); }
      // ---- never in the rider's face
      vec3 dc = p - uCameraPos; float dn = max(length(dc), 1e-3);
      p += dc / dn * max(0.0, ${KEEP_CLEAR.toFixed(2)} - dn);
      float b = uLevel * min(lv, 1.5) * dark * smoothstep(${KEEP_CLEAR.toFixed(2)}, 1.6, dn);
      if (b < 0.004 || uPass < 0.5) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }      // dark: not drawn at all (nor in the picture the water bends: it is not under the water)
      vec4 mv = viewMatrix * modelMatrix * vec4(p, 1.0);
      // a firefly's lantern is a few millimetres across and is drawn ten times that so that it carries at a distance;
      // close by it is let shrink toward its true size, so that a near one is a keen point and not a ball of light
      float dist = max(0.1, -mv.z), size = aHome.w * uSizeK * mix(0.22, 1.0, smoothstep(2.5, 18.0, dist)), px = size * uPx / dist, grow = max(1.0, uMinPx / px);
      mv.xy += position.xy * size * grow * 1.5;                          // the quad is three discs wide: the light and its soft skirt
      gl_Position = projectionMatrix * mv;
      vQ = position.xy;
      vCol = uColor * b * pow(1.0 / grow, 1.25) * (1.0 - fogAmount(length(mv.xyz)));   // too far to fill its pixels: fainter, never a hard speck
    }`;
  const fragmentShader = /* glsl */`
    varying vec2 vQ; varying vec3 vCol;
    void main() {
      float r = length(vQ);
      float disc = 1.0 - smoothstep(0.20, 0.36, r), skirt = exp(-r * r * 6.0) * (1.0 - smoothstep(0.75, 1.0, r));
      gl_FragColor = vec4(clamp(vCol * (disc + 0.28 * skirt), 0.0, 30.0), 1.0);
    }`;
  const group = new THREE.Group(); group.name = 'fireflies';
  const build = (count, sizeK, layer) => {
    const g = quadGeometry();
    g.setAttribute('aHome', new THREE.InstancedBufferAttribute(home, 4)); g.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seed, 4));
    g.instanceCount = count;
    const mat = new THREE.ShaderMaterial({ uniforms: { ...uniforms, uSizeK: { value: sizeK }, uPx: { value: 800 }, uPass: { value: 1 } }, vertexShader, fragmentShader,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
    const mesh = new THREE.Mesh(g, mat);
    mesh.frustumCulled = false; mesh.renderOrder = 3; if (layer) mesh.layers.set(layer);
    perPass(engine, mesh, mat); group.add(mesh);
    return mesh;
  };
  const share = Math.max(0, Math.min(1, o.mirror));
  let direct = null, mirrored = null;
  if (o.only === 'mirror') mirrored = build(Math.max(1, Math.round(n * (share > 0 ? share : 1))), o.mirrorSize, 2);
  else if (o.only === 'direct' || share <= 0) direct = build(n, 1, 1);
  else if (share >= 1) direct = build(n, 1, 0);
  else { direct = build(n, 1, 1); mirrored = build(Math.max(1, Math.round(n * share)), o.mirrorSize, 2); }
  (o.parent || ctx.group).add(group);

  // the boat's track: where it was `track` seconds ago, from samples taken twice a second on the realm's clock
  const STEP = 0.5, track = o.hull ? Math.max(0, o.hull.track ?? 6) : 0, slots = Math.max(2, Math.ceil(track / STEP) + 2), tx = new Float32Array(slots), tz = new Float32Array(slots);
  let head = -1, filled = 0, acc = STEP;
  const levelGuard = makeGuard(MIN_RISE, 1), scoutGuard = makeGuard(1.5, 0);
  let levelTo = 1, levelIn = MIN_RISE, scoutTo = 0, scoutIn = 1.5;
  ctx.onUpdate((dt) => {
    const boat = ctx.boat;
    if (o.hull) {
      acc += dt;
      if (acc >= STEP || head < 0) { acc = head < 0 ? 0 : acc - STEP; head = (head + 1) % slots; tx[head] = boat.x; tz[head] = boat.z; filled = Math.min(slots, filled + 1); }
      // between the two samples either side of `track` seconds ago
      const back = track / STEP + acc / STEP, i0 = Math.min(filled - 1, Math.floor(back)), i1 = Math.min(filled - 1, i0 + 1), f = Math.min(1, back - Math.floor(back));
      const a = (head - i0 + slots * 4) % slots, b = (head - i1 + slots * 4) % slots;
      uniforms.uTail.value.set(tx[a] + (tx[b] - tx[a]) * f, 0, tz[a] + (tz[b] - tz[a]) * f);
    }
    for (let i = 0; i < KEEP; i++) { const a = o.avoid[i]; if (a && a.radius > 0 && a.position) keep[i].set(a.position.x, a.position.y, a.position.z, a.radius); else keep[i].w = 0; }
    uniforms.uLevel.value = slew(levelGuard, levelTo, dt, levelIn);
    uniforms.uScout.value = slew(scoutGuard, scoutTo, dt, scoutIn);
  });
  let callNext = 0;
  return {
    object: group, front, count: n, avoid: o.avoid, direct, mirrored,
    tick(T) { front.tick(T); return this; },
    wave(w = {}) { return front.launch(w); },
    /** A wave every `every` seconds from clock time `from`, for as long as the clock runs (see makeFront's repeat). */
    repeat(r = {}) { return front.repeat(r); },
    call(c = {}) {
      const q = c.near || [0, 0, 0], x = q.x ?? q[0] ?? 0, y = q.y ?? q[1] ?? 0, z = q.z ?? q[2] ?? 0, share = clamp01(c.share ?? 1);
      let reach = c.radius ?? Infinity;
      if (c.count != null || c.radius == null) {
        // the `count` nearest of those that may answer: the reach is the distance of the last of them
        const want = Math.max(1, Math.round(c.count ?? 1)), best = new Float64Array(want).fill(Infinity);
        for (let i = 0; i < n; i++) {
          if (seed[i * 4 + 2] > share) continue;
          const d = (home[i * 4] - x) ** 2 + (home[i * 4 + 1] - y) ** 2 + (home[i * 4 + 2] - z) ** 2;
          if (d >= best[want - 1]) continue;
          let j = want - 1; while (j > 0 && best[j - 1] > d) { best[j] = best[j - 1]; j--; } best[j] = d;
        }
        let far = want - 1; while (far > 0 && !Number.isFinite(best[far])) far--;
        if (Number.isFinite(best[far])) reach = Math.min(reach, Math.sqrt(best[far]) + 1e-3);
      }
      if (!Number.isFinite(reach)) return -1;                               // nobody there to answer
      const k = callNext; callNext = (callNext + 1) % CALLS;
      callA[k].set(x, y, z, reach); callB[k].set(c.at ?? Math.max(0, front.T), c.strength ?? 1, share, Math.max(0, c.over ?? 0));
      return k;
    },
    scouts(level = 1, seconds = 1.5) { scoutTo = clamp01(level); scoutIn = Math.max(MIN_RISE, seconds); return this; },
    level(v = 1, seconds = 2) { levelTo = clamp01(v); levelIn = Math.max(MIN_RISE, seconds); return this; },
    litNear(x, y, z, radius = 12) {
      // the front's level at the point and at four places round it: enough for a sound to rise and fall with the passing light
      let s = front.level(x, y, z, 0.5);
      for (let i = 0; i < 4; i++) s += front.level(x + Math.cos(i * 1.5708) * radius, y, z + Math.sin(i * 1.5708) * radius, 0.25 + 0.16 * i);
      return Math.min(1, s / 5) * uniforms.uLevel.value;
    },
  };
}
// a guard moved at a rate of our choosing (never faster than the law)
function slew(guard, target, dt, seconds) { const v = guard.get(), m = Math.max(0, dt) / Math.max(MIN_RISE, seconds); const nv = v + Math.max(-m, Math.min(m, target - v)); guard.set(nv); return nv; }

// ================================================================================================= candle flames
// A flame, modelled: a teardrop of six sides turned from a profile (radius as a share of the half width, height 0..1),
// round at the wick, widest a little under a third of the way up, drawn out to a point.
const FLAME_PROFILE = [[0.0, 0.34], [0.12, 0.80], [0.30, 1.0], [0.55, 0.70], [0.80, 0.30]];
function flameGeometry() {
  const pos = [], nrm = [], part = [], idx = [], S = 6, TAU = Math.PI * 2;
  const add = (x, y, z, nx, ny, nz, p) => { pos.push(x, y, z); nrm.push(nx, ny, nz); part.push(p); return pos.length / 3 - 1; };
  const foot = add(0, -0.03, 0, 0, -1, 0, 0), rings = [];
  FLAME_PROFILE.forEach(([h, r], j) => {
    const a = FLAME_PROFILE[Math.max(0, j - 1)], b = FLAME_PROFILE[Math.min(FLAME_PROFILE.length - 1, j + 1)], dr = b[1] - a[1], dh = (b[0] - a[0]) * 5.5, l = Math.hypot(dr, dh) || 1, row = [];
    for (let i = 0; i < S; i++) { const th = (i + (j % 2) * 0.5) / S * TAU, c = Math.cos(th), s = Math.sin(th); row.push(add(r * c, h, r * s, dh / l * c, -dr / l, dh / l * s, 0)); }
    rings.push(row);
  });
  const tip = add(0, 1, 0, 0, 1, 0, 0);
  for (let i = 0; i < S; i++) idx.push(foot, rings[0][i], rings[0][(i + 1) % S]);
  for (let j = 0; j < rings.length - 1; j++) for (let i = 0; i < S; i++) {
    const a = rings[j][i], b = rings[j][(i + 1) % S], c = rings[j + 1][i], d = rings[j + 1][(i + 1) % S];
    if (j % 2 === 0) idx.push(a, c, b, b, c, d); else idx.push(a, c, d, a, d, b);
  }
  const last = rings[rings.length - 1];
  for (let i = 0; i < S; i++) idx.push(tip, last[(i + 1) % S], last[i]);
  // and its halo: one quad that faces the eye (part 1)
  const q0 = pos.length / 3;
  for (const [x, y] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) add(x, y, 0, 0, 0, 1, 1);
  idx.push(q0, q0 + 1, q0 + 2, q0, q0 + 2, q0 + 3);
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
  g.setAttribute('aPart', new THREE.Float32BufferAttribute(part, 1)); g.setIndex(idx);
  return g;
}
// A thread of steam for a flame that stands in rain: a ribbon of five pieces (part 2: x = side, y = how far up it).
function steamGeometry() {
  const pos = [], idx = [], ROWS = 6;
  for (let j = 0; j < ROWS; j++) for (const side of [-1, 1]) pos.push(side, j / (ROWS - 1), 0);
  for (let j = 0; j < ROWS - 1; j++) { const a = j * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const g = new THREE.InstancedBufferGeometry(), nv = pos.length / 3;
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(new Array(nv * 3).fill(0), 3));
  g.setAttribute('aPart', new THREE.Float32BufferAttribute(new Array(nv).fill(2), 1)); g.setIndex(idx);
  return g;
}

/**
 * Candle flames: each a small modelled teardrop of light with a soft halo, and each with a kindle time of its own on a
 * show clock. A quarter of a second before its time the wick glows; then the flame stands up over `rise` seconds. Lit,
 * its height wanders (never in step with its neighbours) and it leans with the draught. They are drawn in the mirror.
 *
 *   const flames = makeFlames(ctx, { points: brackets });                       // [{ x, y, z, group, coord }, ...]
 *   const edge = makeFront(ctx, { name: 'kindle', shape: 'along', speed: 8, rise: 0.9, waves: 6, large: false, calm: { even: 3 } });
 *   // tier by tier: flame runs both ways from the bracket nearest the tree (coord 58) at 8 m/s, tier 1 at 6 s, tier 2 at 8 s ...
 *   for (let tier = 0; tier < 5; tier++) flames.kindle((p) => (p.group === tier ? 6 + 2 * tier + Math.abs(p.coord - 58) / 8 : null));
 *   // in update(): const c = showClock; flames.tick(c); house.set({ dark: 1 - flames.share(), kindled: flames.share() });
 *
 * opts:
 *   points         [{ x, y, z, group, coord, size, steam }, ...] (or [x, y, z] triples): the wick tops. `group` and `coord`
 *                  are yours (a tier, an arc length): they come back to you in `kindle` and `share`. steam: true puts a
 *                  thread of steam over that flame while it burns (those that stand in rain)
 *   steam          true: a thread of steam over every flame (default false: only the points that ask)
 *   color, core    '#ffd27a' the body of the flame, '#fff1c8' its core;  intensity: [2.2, 4.0] (body, core)
 *   height, width  0.055 and 0.02 metres: about twice life, as stage flames are
 *   halo           0.5 metres across;  haloLevel: 0.22 (they add up: keep it low where flames stand in rows)
 *   rise           0.9 seconds for a flame to stand up (never under half a second)
 *   flicker        0.12: how far the height wanders, at 0.7 to 1.3 times a second, each its own
 *   draught        [x, y, z]: the lean (0.1 is about six degrees); change it later with flames.draught.set(...)
 *   minPixels      2.2: a far flame is never drawn narrower than this (so never under 2.5 pixels tall); it is dimmed instead
 *   only           'direct' to keep them out of the mirror (the gold on the water is half the picture: leave it)
 *   exact, seed, parent (a moving thing they hang from: positions are then in its space; flames stay upright)
 * Returns { object, count, draught (a Vector3),
 *   tick(T)                    the show clock
 *   kindle(when)               when: a clock time for all, or (point, i) => clock time or null (null leaves that one alone)
 *   kindleWith(front, k, pick) each catches as wave k of a front reaches it (the front's group, its rag and what reduced
 *                              motion makes of it are all kept: see the method)
 *   kindleOne(i, T), douse(i, T), douseSome(share, T, pick)   one flame lit or put out at T; a share of them put out
 *   setAll(lit)                all burning (true) or all cold (false), at once: for a realm entered part-way
 *   share(group)               0..1: how much of the house (or of one group) is burning now, eased like the flames
 *   level(v, seconds)          dim them all }
 */
export function makeFlames(ctx, opts = {}) {
  const o = { points: [], color: '#ffd27a', core: '#fff1c8', intensity: [2.2, 4.0], height: 0.055, width: 0.02, halo: 0.5, haloLevel: 0.22, rise: 0.9, flicker: 0.12,
    draught: [0, 0, 0], steam: false, minPixels: 2.2, only: null, exact: true, seed: 61, parent: null, ...opts };
  const engine = ctx.engine, rnd = ctx.rng(o.seed), pts = o.points.map((p) => (Array.isArray(p) ? { x: p[0], y: p[1], z: p[2] } : p));
  const n = pts.length, rise = Math.max(MIN_RISE, o.rise);
  const place = new Float32Array(n * 4), times = new Float32Array(n * 4);
  // times: kindled at, put out at, two numbers of its own (the first carries + 2 when the flame steams)
  pts.forEach((p, i) => { place.set([p.x, p.y, p.z, (p.size ?? 1) * (0.9 + 0.2 * rnd())], i * 4); times.set([1e9, 1e9, rnd() + ((p.steam ?? o.steam) ? 2 : 0), rnd()], i * 4); });
  const geo = flameGeometry(), aTimes = new THREE.InstancedBufferAttribute(times, 4); aTimes.setUsage(THREE.DynamicDrawUsage);
  geo.setAttribute('aPlace', new THREE.InstancedBufferAttribute(place, 4)); geo.setAttribute('aTimes', aTimes); geo.instanceCount = n;
  const draught = new THREE.Vector3(o.draught[0], o.draught[1], o.draught[2]);
  const uniforms = {
    ...sharedOf(ctx), uPx: { value: 800 }, uPass: { value: 1 }, uClock: { value: -1 }, uLevel: { value: 1 }, uDraught: { value: draught },
    uBody: { value: col(o.color).multiplyScalar(o.intensity[0]) }, uCore: { value: col(o.core).multiplyScalar(o.intensity[1]) }, uHalo: { value: col(o.color).multiplyScalar(o.haloLevel) },
    uSteam: { value: col(o.color).lerp(new THREE.Color('#ffffff'), 0.55).multiplyScalar(0.42) },
    uDim: { value: new THREE.Vector4(o.height, o.width * 0.5, o.halo * 0.5, o.minPixels) }, uAnim: { value: new THREE.Vector3(rise, o.flicker, ctx.reducedMotion ? 0.4 : 1) },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
    vertexShader: /* glsl */`
      attribute float aPart; attribute vec4 aPlace, aTimes;
      uniform float uTime, uClock, uPx, uPass, uLevel; uniform vec3 uCameraPos, uDraught, uAnim; uniform vec4 uDim;
      ${FOG_PARS}
      centroid varying vec3 vN, vView; centroid varying vec4 vF;      // vF: height up the flame (or -1 for the halo), brightness, wick glow, halo radius coordinate
      centroid varying vec2 vQ;      // (centroid: a flame just catching is a sliver a pixel wide, and a value read outside it is anything at all)
      void main() {
        float k = uClock - aTimes.x, d = uClock - aTimes.y, s3 = fract(aTimes.z), s4 = aTimes.w;
        // the wick glows, the flame stands up (a little past its height, and settles), burns, and is put out
        float up = smoothstep(0.0, uAnim.x, k);
        float stand = (up + 0.10 * sin(up * 3.14159) * up) * (1.0 - smoothstep(0.0, 0.5, d));
        float ember = max(smoothstep(-0.35, -0.08, k) * (1.0 - up), smoothstep(0.0, 0.2, d) * (1.0 - smoothstep(0.5, 1.9, d)) * step(0.0, k));
        float tall = 1.0 + uAnim.y * uAnim.z * (0.6 * sin(uTime * (4.4 + 3.8 * s3) + s3 * 40.0) + 0.4 * sin(uTime * (7.1 + 2.0 * s4) + s4 * 17.0));
        // the draught leans it; it also wavers a little of its own accord
        vec3 lean = uDraught + uAnim.z * 0.035 * vec3(sin(uTime * (1.3 + s4) + s3 * 30.0), 0.0, cos(uTime * (1.1 + s3) + s4 * 30.0));
        vec3 base = (modelMatrix * vec4(aPlace.xyz, 1.0)).xyz;
        float dist = max(distance(base, uCameraPos), 0.1), H = uDim.x * aPlace.w;
        float grow = max(1.0, uDim.w / (2.0 * uDim.y * aPlace.w * uPx / dist));   // never narrower than a couple of pixels: a far flame is drawn larger, and fainter
        vec3 p;
        if (aPart < 0.5) {
          float h = position.y, wide = mix(0.2, 1.0, smoothstep(0.0, 0.45, stand)) * (1.0 - 0.25 * (tall - 1.0));      // it catches as a bead, as wide as it is tall
          p = base + vec3(position.x * uDim.y * aPlace.w * wide, h * H * stand * tall, position.z * uDim.y * aPlace.w * wide) * grow;
          p.xz += lean.xz * h * h * H * stand * 1.6 * grow; p.y -= length(lean.xz) * h * h * H * 0.3 * grow;
          vec4 mv = viewMatrix * vec4(p, 1.0);
          vN = normalize(mat3(viewMatrix) * vec3(normal.x, normal.y * 0.35, normal.z)); vView = -mv.xyz;
          vF = vec4(h, stand * uLevel / pow(grow, 0.6), 0.0, 0.0); vQ = vec2(0.0);
          gl_Position = (stand < 0.04 || uPass < 0.5) ? vec4(2.0, 2.0, 2.0, 1.0) : projectionMatrix * mv;
        } else if (aPart < 1.5) {
          // the halo, centred a little above the wick; before the flame it is only the wick's small glow
          float lit = stand * uLevel;
          vec4 mv = viewMatrix * vec4(base + vec3(lean.x, 1.0, lean.z) * H * 0.45 * stand * grow, 1.0);
          float size = mix(H * 1.6 * grow, uDim.z * aPlace.w * (0.86 + 0.14 * tall), up * (1.0 - smoothstep(0.0, 0.5, d)));
          mv.xy += position.xy * size;
          vN = vec3(0.0); vView = -mv.xyz;
          // (the wick's glow keeps its own small size inside the halo's quad: the tip of a wick, under a centimetre across
          // (it was three, a ball wider than its candle), never drawn under a pixel across and fainter by as much)
          float emberR = 0.0045 * aPlace.w, emberPx = emberR * uPx / dist, emberGrow = max(1.0, 0.55 / max(emberPx, 1e-3));
          vF = vec4(-1.0, lit, ember / emberGrow, emberR * emberGrow / size); vQ = position.xy;
          gl_Position = ((lit + ember) < 0.01 || uPass < 0.5) ? vec4(2.0, 2.0, 2.0, 1.0) : projectionMatrix * mv;
        } else {
          // a thread of steam over a flame that stands in rain: it leaves the tip, widens and wavers more the higher it
          // is, leans further than the flame in a draught, and is gone within a hand's breadth; it goes up in breaths
          float t = position.y, on = step(1.5, aTimes.z) * stand * uLevel, len = 0.17 * aPlace.w;
          vec3 q = base + vec3(lean.x * 1.6, tall - length(lean.xz) * 0.3, lean.z * 1.6) * (H * stand * grow);
          q += vec3(lean.x * 2.5, 1.0, lean.z * 2.5) * (t * len) + vec3(0.0, 0.012 * aPlace.w, 0.0);
          float sway = (0.003 + 0.022 * t) * t;
          q.x += sway * sin(t * 7.0 - uTime * 3.2 + s4 * 40.0); q.z += sway * cos(t * 6.0 - uTime * 2.7 + s3 * 40.0);
          vec4 mv = viewMatrix * vec4(q, 1.0);
          float hw = (0.004 + 0.013 * t) * aPlace.w, wgrow = max(1.0, 0.75 / (hw * uPx / max(-mv.z, 0.1)));      // never under a pixel and a half wide: much fainter instead
          mv.x += position.x * hw * wgrow;
          vN = vec3(0.0); vView = -mv.xyz;
          float breath = 0.5 + 0.5 * sin(t * 9.0 - uTime * 4.6 + s3 * 30.0);
          float run = smoothstep(0.0, 0.22, t) * (1.0 - t) * (1.0 - t) * (0.2 + 0.8 * breath * breath);
          vF = vec4(-2.0, on * run / (wgrow * wgrow), 0.0, 0.0); vQ = vec2(position.x, t);
          gl_Position = (on < 0.05 || uPass < 0.5) ? vec4(2.0, 2.0, 2.0, 1.0) : projectionMatrix * mv;
        }
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uBody, uCore, uHalo, uSteam; ${FOG_PARS}
      centroid varying vec3 vN, vView; centroid varying vec4 vF; centroid varying vec2 vQ;
      // (light is added to the picture: one pixel that is not a number becomes a black disc once the painter has passed)
      vec3 sound(vec3 c) { return (any(isnan(c)) || any(isinf(c))) ? vec3(0.0) : clamp(c, 0.0, 30.0); }
      void main() {
        float fog = 1.0 - fogAmount(length(vView));
        if (vF.x >= -0.5) {
          // the flame: a hot pale core seen through its middle, the body's colour at its edges; dark round the wick, a
          // little blue at the very foot, thinner toward the tip. Both faces are drawn and added: thicker reads brighter
          float h = clamp(vF.x, -0.05, 1.0), facing = clamp(abs(dot(vN / max(length(vN), 1e-4), vView / max(length(vView), 1e-4))), 0.0, 1.0);
          vec3 c = mix(uBody, uCore, pow(facing, 2.2) * smoothstep(0.08, 0.4, h) * (1.0 - smoothstep(0.55, 0.95, h)));
          c *= mix(0.22, 1.0, smoothstep(0.0, 0.26, h)) * (0.35 + 0.65 * facing);
          c += vec3(0.10, 0.20, 0.75) * 0.5 * (1.0 - smoothstep(0.0, 0.16, h)) * facing;
          gl_FragColor = vec4(sound(c * 0.38 * clamp(vF.y, 0.0, 1.5) * fog), 1.0);
        } else if (vF.x >= -1.5) {
          // the halo: a wide soft light and, close round the flame, a brighter one
          float r = length(vQ), w = max(vF.w, 1e-3), a = (exp(-r * r * 5.5) + 2.6 * exp(-r * r * 70.0)) * (1.0 - smoothstep(0.7, 1.0, r));
          vec3 c = uHalo * a * clamp(vF.y, 0.0, 1.5) + vec3(1.0, 0.33, 0.08) * (2.2 * (1.0 - smoothstep(w * 0.3, w, r)) + 0.22 * exp(-r * r / (w * w * 10.0)) * (1.0 - smoothstep(0.55, 1.0, r))) * clamp(vF.z, 0.0, 1.0);
          gl_FragColor = vec4(sound(c * fog), 1.0);
        } else {
          // the steam: pale, lit from beneath by its own flame, soft across
          float a = 1.0 - min(abs(vQ.x), 1.0);
          gl_FragColor = vec4(sound(uSteam * (a * a) * clamp(vF.y, 0.0, 1.5) * fog), 1.0);
        }
      }`,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = 'flames'; mesh.frustumCulled = false; mesh.renderOrder = 3;
  if (o.only === 'direct') mesh.layers.set(1); else if (o.only === 'mirror') mesh.layers.set(2);
  perPass(engine, mesh, mat);
  (o.parent || ctx.group).add(mesh);
  // the steam: a second small mesh over only the flames that steam, with copies of their places and times
  const steamers = []; pts.forEach((p, i) => { if (p.steam ?? o.steam) steamers.push(i); });
  let sTimes = null, saTimes = null;
  if (steamers.length) {
    const sgeo = steamGeometry(), sPlace = new Float32Array(steamers.length * 4); sTimes = new Float32Array(steamers.length * 4);
    steamers.forEach((i, k) => { sPlace.set(place.subarray(i * 4, i * 4 + 4), k * 4); sTimes.set(times.subarray(i * 4, i * 4 + 4), k * 4); });
    saTimes = new THREE.InstancedBufferAttribute(sTimes, 4); saTimes.setUsage(THREE.DynamicDrawUsage);
    sgeo.setAttribute('aPlace', new THREE.InstancedBufferAttribute(sPlace, 4)); sgeo.setAttribute('aTimes', saTimes); sgeo.instanceCount = steamers.length;
    const steam = new THREE.Mesh(sgeo, mat); steam.name = 'flame-steam'; steam.frustumCulled = false; steam.renderOrder = 3; steam.layers.mask = mesh.layers.mask;
    perPass(engine, steam, mat); mesh.add(steam);
  }
  const changed = () => { aTimes.needsUpdate = true; if (sTimes) { steamers.forEach((i, k) => sTimes.set(times.subarray(i * 4, i * 4 + 4), k * 4)); saTimes.needsUpdate = true; } };
  const guard = makeGuard(MIN_RISE, 1); let levelTo = 1, levelIn = 1;
  ctx.onUpdate((dt) => { uniforms.uLevel.value = slew(guard, levelTo, dt, levelIn); });
  const api = {
    object: mesh, count: n, draught, points: pts,
    tick(T) { uniforms.uClock.value = T; return api; },
    kindle(when) {
      for (let i = 0; i < n; i++) { const t = typeof when === 'function' ? when(pts[i], i) : when; if (t != null && Number.isFinite(t)) { times[i * 4] = t; times[i * 4 + 1] = 1e9; } }
      changed(); return api;
    },
    /**
     * Kindle by a front: every flame catches as wave k of the front reaches it (an 'along' front is asked with the
     * flame's `coord`, any other with its place). If the wave was sent to one group, only the flames of that group
     * answer; `pick(point, i)` narrows it further. With reduced motion and a front whose calm form is `{ even }` there
     * is no travelling edge: the flames catch here and there over seven tenths of that time, so the whole rises evenly.
     * (Flames that hang from a moving `parent` have their places in its space: give those their times with `kindle`.)
     */
    kindleWith(front, k = front.last, pick = null) {
      const w = front.wave(k);
      if (!w) return api;
      for (let i = 0; i < n; i++) {
        const q = pts[i];
        if ((w.group >= 0 && q.group !== w.group) || (pick && !pick(q, i))) continue;
        const t = front.calmEven > 0 ? w.at + 0.7 * front.calmEven * ((i * 0.618034) % 1)
          : front.shape === 'along' ? front.arrival(q.coord ?? 0, 0, 0, times[i * 4 + 3], k) : front.arrival(q.x, q.y, q.z, times[i * 4 + 3], k);
        if (Number.isFinite(t)) { times[i * 4] = t; times[i * 4 + 1] = 1e9; }
      }
      changed(); return api;
    },
    kindleOne(i, T) { times[i * 4] = T; times[i * 4 + 1] = 1e9; changed(); return api; },
    douse(i, T) { times[i * 4 + 1] = T; changed(); return api; },
    /** Put out a share of the burning flames at T (pick(point, i) narrows which may go out; each on its own moment within `over` seconds). */
    douseSome(share, T, pick = null, over = 3) {
      const r = ctx.rng(o.seed + 5);
      for (let i = 0; i < n; i++) if (times[i * 4] < 1e8 && (!pick || pick(pts[i], i)) && r() < share) times[i * 4 + 1] = T + r() * over;
      changed(); return api;
    },
    setAll(lit) { for (let i = 0; i < n; i++) { times[i * 4] = lit ? -1e5 : 1e9; times[i * 4 + 1] = 1e9; } changed(); return api; },
    share(group = null) {
      const T = uniforms.uClock.value; let sum = 0, cnt = 0;
      for (let i = 0; i < n; i++) { if (group != null && pts[i].group !== group) continue; cnt++; sum += smooth(0, rise, T - times[i * 4]) * (1 - smooth(0, 0.5, T - times[i * 4 + 1])); }
      return cnt ? sum / cnt : 0;
    },
    level(v = 1, seconds = 1) { levelTo = clamp01(v); levelIn = Math.max(MIN_RISE, seconds); return api; },
  };
  return api;
}

// ================================================================================================= rings on the water
/**
 * A pool of rings drawn on the water, for events too far from the boat for the water's own ripples (which live only
 * within `rippleSize` metres of it): a far star landing, a far foot coming down. One draw call.
 *   const rings = makeRings(ctx, { pool: 64, color: '#e6eeff' });
 *   rings.add(x, z, { size: 0.3, grow: 2, life: 6, strength: 1 });     // or rings.touch(x, z, ...) which uses a real ripple when near enough
 * opts: pool (64), color, intensity (1.2), grow (metres a second, 2), life (seconds, 6), width (metres of line, 0.07).
 * Returns { object, add(x, z, o), touch(x, z, o), level(v) (0..1: how strongly drawn rings show; the water's own are the water's) }.
 */
export function makeRings(ctx, opts = {}) {
  const o = { pool: 64, color: '#e6eeff', intensity: 1.2, grow: 2, life: 6, width: 0.07, parent: null, ...opts };
  const engine = ctx.engine, n = o.pool, a = new Float32Array(n * 4), b = new Float32Array(n * 4).fill(-1e9);
  const geo = quadGeometry(), aA = new THREE.InstancedBufferAttribute(a, 4), aB = new THREE.InstancedBufferAttribute(b, 4);
  aA.setUsage(THREE.DynamicDrawUsage); aB.setUsage(THREE.DynamicDrawUsage);
  geo.setAttribute('aA', aA); geo.setAttribute('aB', aB); geo.instanceCount = n;      // aA: x, z, first radius, growth;  aB: born (uTime), life, strength, -
  const ringColor = col(o.color).multiplyScalar(o.intensity);
  const uniforms = { ...sharedOf(ctx), uPx: { value: 800 }, uPass: { value: 1 }, uColor: { value: ringColor.clone() }, uWidth: { value: o.width } };
  const mat = new THREE.ShaderMaterial({ uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
    // (a ring lies flat and is often seen almost on its edge. Whatever is one value for the whole ring is passed `flat`:
    // interpolated, it would be extrapolated far outside its range on such slivers and blow the picture out)
    vertexShader: /* glsl */`
      attribute vec4 aA, aB; uniform float uTime, uPx, uWidth; uniform vec3 uCameraPos; ${FOG_PARS}
      centroid varying vec2 vQ; flat varying vec3 vR;
      void main() {
        float age = uTime - aB.x, life = max(aB.y, 0.01);
        if (age < 0.0 || age >= life || aB.z <= 0.0) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); vQ = vec2(0.0); vR = vec3(0.0, 1.0, 0.0); return; }
        float rad = aA.z + aA.w * age, reach = rad + uWidth * 3.0 + 0.5;
        vec3 p = vec3(aA.x + position.x * reach, 0.012, aA.y + position.y * reach);
        float dist = distance(vec3(aA.x, 0.012, aA.y), uCameraPos);
        float fade = smoothstep(0.0, 0.25, age) * pow(max(1.0 - age / life, 0.0), 1.5) * aB.z;
        // A ring far off is seen almost on its edge. Once it is only a few pixels from its near side to its far side it is
        // let go altogether: a hundred such rings at the horizon were one hard white line across the picture.
        float tall = 2.0 * rad * abs(uCameraPos.y - 0.012) * uPx / max(dist * dist, 1e-3);
        fade *= smoothstep(2.5, 8.0, tall);
        vQ = position.xy * reach; vR = vec3(rad, uWidth * (1.0 + 0.25 * age), clamp(fade * (1.0 - fogAmount(dist)), 0.0, 1.0));
        gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(p, 1.0);
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uColor; centroid varying vec2 vQ; flat varying vec3 vR;
      void main() {
        float r = length(vQ), px = max(fwidth(r), 1e-4);                     // metres one pixel covers here, across the line
        float wide = max(vR.y, px * 1.3);                                    // never thinner than the screen can draw: wider instead, and fainter
        float d = (r - vR.x) / wide, a = exp(-d * d * 1.4) * vR.z * clamp(vR.y / wide, 0.06, 1.0);
        if (!(a > 0.003)) discard;
        gl_FragColor = vec4(uColor * clamp(a, 0.0, 1.0), 1.0);
      }`,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = 'rings'; mesh.frustumCulled = false; mesh.renderOrder = 1; mesh.layers.set(1);      // on the water itself: not in its own mirror
  perPass(engine, mesh, mat);
  (o.parent || ctx.group).add(mesh);
  let head = 0; const T = engine.shared.uTime;
  const api = {
    object: mesh,
    add(x, z, r = {}) {
      a.set([x, z, r.size ?? 0.3, r.grow ?? o.grow], head * 4); b.set([T.value, r.life ?? o.life, r.strength ?? 1, 0], head * 4);
      head = (head + 1) % n; aA.needsUpdate = true; aB.needsUpdate = true; return api;
    },
    /** A touch on the water: a real ripple if the water is alive there (inside its ripple window round the boat), else a drawn ring. */
    touch(x, z, r = {}) {
      const half = (ctx.waterLook.rippleSize || 64) * 0.5 - 3, boat = ctx.boat;
      if (Math.abs(x - boat.x) < half && Math.abs(z - boat.z) < half) ctx.water.ripple(x, z, r.ripple ?? 0.35, r.radius ?? 0.6); else api.add(x, z, r);
      return api;
    },
    level(v = 1) { uniforms.uColor.value.copy(ringColor).multiplyScalar(clamp01(v)); return api; },
  };
  return api;
}

// ================================================================================================= lights on a lake bed that rise
/**
 * Lights lying on a lake bed (the standing sky's fallen stars). They breathe, each on its own time; the ones near the
 * prow lantern brighten a little. Told to rise, one by one or as a front crosses them, each lifts off the bed, breaks
 * the surface with a ring, and goes straight up, slowly and gaining, with its twin going down in the mirror, and goes
 * out as it crosses the sunline.
 *
 *   const bed = makeBedLights(ctx, { points, after: true });            // after: drawn after the water, so rings do not shiver them
 *   const wave = makeFront(ctx, { name: 'lift', shape: 'line', speed: 30, rag: 0.8, rise: 0.5 });
 *   stage.cue('letgo', { s: 216 }, () => {});
 *   // in update(): const T = stage.clock('letgo'); bed.tick(T); wave.tick(T);
 *   //   if (stage.beat('lg.first', T, 0)) bed.rise(bed.nearest(ahead34.x, ahead34.z), 0);
 *   //   if (stage.beat('lg.wave', T, 5)) { wave.launch({ at: 5, origin: east, dir: [-1, 0, 0] }); bed.riseWith(wave); }
 *   //   bed.sunline = sunlineY;
 *
 * opts:
 *   points         [[x, y, z], ...] on the bed (y is the bed's height: -0.18 in the standing sky)
 *   after          true (default): drawn after the water, at full strength, unbent by ripples (the difference between a
 *                  light in the lake and a star in the sky). false: drawn under the water, bent by every ring and
 *                  shown as much as the water's `underglow` lets through; once it has risen it is drawn in the air
 *   color          '#e6eeff'; tints: ['#58c49c', '#c06a98'] and tinted: 1 / 9, the share that leans a little to them
 *   intensity      1.7 (the point);  halo: 0.6 metres of light on the sand round each, haloLevel 0.16
 *   size           [0.06, 0.09] metres: the stone. Within about fifteen metres of the eye it is drawn as one, a faceted
 *                  pebble (24 triangles, each a little its own shape; the 64 nearest at most), with its soft light
 *                  round it; farther off it is a point, kept to two pixels and dimmed
 *   breathe        0.2: they swell and sink by this much over `breatheEvery` [9, 14] seconds
 *   lantern        { reach: 3, gain: 0.5 }: those within 3 m of the prow lantern brighten by half
 *   speed, gain    0.5 m/s at lift-off, gaining 0.22 m/s every second;  drift: [x, z] m/s sideways as they go up ([-0.2, 0])
 *   sunline        the height at which they go out (Infinity: never); sunlineSoft: metres the change is eased over (3)
 *   rings          a pool from makeRings (one is made if left out); ring: { ripple: 0.35, radius: 0.6 } what each writes
 *   onRise         (x, z, i, near) => {} as each breaks the surface (near: the water's own ripples reach it): for its tick
 *   exact, seed, parent
 * (`after: true` draws them over the water, as lights: right for a bed a hand deep under a mirror, which lets nothing
 * beneath it through. Where the water can be seen into and should bend and swallow them, give `after: false`.)
 * Returns { object, count, rings, sunline (set it every frame from the realm's light),
 *   tick(T)                    the show clock
 *   rise(i, T)                 light i lifts at clock time T
 *   riseWith(front, k)         every light not yet told lifts when wave k of a front reaches it (with the front's rag)
 *   riseAll(when)              when: (x, z, i) => clock time, or a time for all
 *   hold(i)                    keep one back from riseWith (the last star, lifted by hand)
 *   settle(risen)              all gone (true) or all back on the bed (false), at once
 *   nearest(x, z, free)        the index of the light nearest a point (free: only those not yet told to rise)
 *   within(x, z, radius, free) the indices of the lights within `radius` metres of a point, nearest first
 *   take(i, out)               the light leaves the bed for good, at once, and its place comes back (a Vector3): for something
 *                              that picks it up and carries it off (the wader gleaning: put your own bead there the same frame)
 *   place(i, x, z), bear(i)    move a light on the bed; let it come alight now, over two seconds (a star that has just landed)
 *   spare()                    the index of a light kept dark for `bear` (give `spares: n` in the options), or -1
 *   level(v, seconds)          all of them, 0..1 (a third of their night strength under a pale sky)
 *   positionOf(i, out)         where light i is now }
 */
export function makeBedLights(ctx, opts = {}) {
  const o = { points: [], after: true, color: '#e6eeff', tints: ['#58c49c', '#c06a98'], tinted: 1 / 9, intensity: 1.7, halo: 0.6, haloLevel: 0.16, size: [0.06, 0.09], breathe: 0.2, breatheEvery: [9, 14],
    lantern: { reach: 3, gain: 0.5 }, speed: 0.5, gain: 0.22, drift: [-0.2, 0], sunline: Infinity, sunlineSoft: 3, rings: null, ring: {}, onRise: null, spares: 0, exact: false, seed: 71, parent: null, ...opts };
  const engine = ctx.engine, rnd = ctx.rng(o.seed), src = flat(o.points), have = src.length / 3;
  const n = o.exact ? have : Math.max(have ? 1 : 0, Math.round(have * Math.max(0.5, ctx.quality.density || 1))), step = have / Math.max(1, n), total = n + o.spares;
  const bed = new Float32Array(total * 4), star = new Float32Array(total * 4), tint = new Float32Array(total * 3);
  const base = col(o.color), tints = o.tints.map(col), c = new THREE.Color();
  for (let i = 0; i < total; i++) {
    const k = Math.min(have - 1, Math.floor(Math.min(i, n - 1) * step)) * 3;
    bed.set([src[k], src[k + 1], src[k + 2], o.size[0] + (o.size[1] - o.size[0]) * rnd()], i * 4);
    star.set([1e9, rnd(), o.breatheEvery[0] + (o.breatheEvery[1] - o.breatheEvery[0]) * rnd(), i < n ? -1e9 : 1e9], i * 4);      // lifts at, seed, breath period, born (uTime)
    c.copy(base); if (rnd() < o.tinted) c.lerp(tints[Math.floor(rnd() * tints.length) % tints.length], 0.4);
    tint.set([c.r, c.g, c.b], i * 3);
  }
  const held = new Uint8Array(total);
  const aBed = new THREE.InstancedBufferAttribute(bed, 4), aStar = new THREE.InstancedBufferAttribute(star, 4);
  aBed.setUsage(THREE.DynamicDrawUsage); aStar.setUsage(THREE.DynamicDrawUsage);
  // two quads a light: the point with its small glow, facing the eye (part 0), and the light it lays on the sand (part 1);
  // and the stone itself, seen within fifteen metres (part 2): a flattened pebble of 24 facets, a ring of six above its
  // waist, six below and turned half a step, a blunt top and bottom, every corner a little out of true
  // (the stones are a small mesh of their own, drawn only for the lights nearest the eye: chosen every frame, below)
  const STONES = 64, spos = [], sidx = [];
  {
    const jr = ctx.rng(o.seed + 17), j = (v) => v * (0.9 + 0.2 * jr()), v0 = 0, P = [];
    P.push([0.08, 0.56, -0.05]);
    for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; P.push([j(Math.cos(a)), j(0.17), j(Math.sin(a))]); }
    for (let k = 0; k < 6; k++) { const a = (k + 0.5) / 6 * Math.PI * 2; P.push([j(0.84 * Math.cos(a)), j(-0.2), j(0.84 * Math.sin(a))]); }
    P.push([-0.06, -0.5, 0.04]);
    for (const q of P) spos.push(q[0], q[1], q[2]);
    const tri = (a, b, c) => {                                              // wound so that it faces outward
      const A = P[a], B = P[b], C = P[c], nx = (B[1] - A[1]) * (C[2] - A[2]) - (B[2] - A[2]) * (C[1] - A[1]), ny = (B[2] - A[2]) * (C[0] - A[0]) - (B[0] - A[0]) * (C[2] - A[2]), nz = (B[0] - A[0]) * (C[1] - A[1]) - (B[1] - A[1]) * (C[0] - A[0]);
      const out = nx * (A[0] + B[0] + C[0]) + ny * (A[1] + B[1] + C[1]) + nz * (A[2] + B[2] + C[2]) >= 0;
      sidx.push(v0 + a, v0 + (out ? b : c), v0 + (out ? c : b));
    };
    for (let k = 0; k < 6; k++) { const k1 = (k + 1) % 6; tri(0, 1 + k, 1 + k1); tri(1 + k, 7 + k, 1 + k1); tri(1 + k1, 7 + k, 7 + k1); tri(13, 7 + k1, 7 + k); }
  }
  const geo = new THREE.InstancedBufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0, -1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3));
  geo.setAttribute('aPart', new THREE.Float32BufferAttribute([0, 0, 0, 0, 1, 1, 1, 1], 1)); geo.setIndex([4, 5, 6, 4, 6, 7, 0, 1, 2, 0, 2, 3]);
  geo.setAttribute('aBed', aBed); geo.setAttribute('aStar', aStar); geo.setAttribute('aTint', new THREE.InstancedBufferAttribute(tint, 3)); geo.instanceCount = total;
  const stoneGeo = new THREE.InstancedBufferGeometry(), sBed = new Float32Array(STONES * 4), sStar = new Float32Array(STONES * 4), sTint = new Float32Array(STONES * 3);
  const saBed = new THREE.InstancedBufferAttribute(sBed, 4), saStar = new THREE.InstancedBufferAttribute(sStar, 4), saTint = new THREE.InstancedBufferAttribute(sTint, 3);
  for (const a of [saBed, saStar, saTint]) a.setUsage(THREE.DynamicDrawUsage);
  stoneGeo.setAttribute('position', new THREE.Float32BufferAttribute(spos, 3)); stoneGeo.setAttribute('aPart', new THREE.Float32BufferAttribute(new Array(spos.length / 3).fill(2), 1)); stoneGeo.setIndex(sidx);
  stoneGeo.setAttribute('aBed', saBed); stoneGeo.setAttribute('aStar', saStar); stoneGeo.setAttribute('aTint', saTint); stoneGeo.instanceCount = 0; stoneGeo.userData.count = 0;
  const S = gouacheLantern(engine);
  const common = {
    ...sharedOf(ctx), uPx: { value: 800 }, uClock: { value: -1 }, uLevel: { value: 1 }, uLanternPos: S.uLanternPos, uStone: { value: new THREE.Vector2(11, 16) },
    uRise: { value: new THREE.Vector4(o.speed, o.gain, o.drift[0], o.drift[1]) }, uSun: { value: new THREE.Vector2(1e6, o.sunlineSoft) },
    uGlow: { value: new THREE.Vector4(o.intensity, o.haloLevel, o.halo * 0.5, o.breathe) }, uLamp: { value: new THREE.Vector2(o.lantern ? o.lantern.reach : 0, o.lantern ? o.lantern.gain : 0) },
  };
  const vertexShader = /* glsl */`
    attribute float aPart; attribute vec4 aBed, aStar; attribute vec3 aTint;
    uniform float uTime, uClock, uPx, uPass, uWhere, uLevel; uniform vec3 uCameraPos, uLanternPos; uniform vec4 uRise, uGlow; uniform vec2 uSun, uLamp, uStone;
    ${FOG_PARS}
    varying vec2 vQ; varying vec3 vW; flat varying vec4 vC; flat varying vec2 vD;      // vC.a: 0 the point, 1 its light on the sand, 2 the stone;  vD: how much of the point's hard middle shows, and where the sand cuts its quad
    void main() {
      float tau = max(uClock - aStar.x, 0.0);
      float up = uRise.x * tau + 0.5 * uRise.y * tau * tau;
      vec3 p = aBed.xyz + vec3(uRise.z * tau, up, uRise.w * tau);
      float lying = 1.0 - smoothstep(0.0, 0.6, up);                         // 1 on the bed .. 0 once it is a hand's breadth up
      float b = uLevel * (1.0 + uGlow.w * sin(uTime * 6.2831853 / aStar.z + aStar.y * 40.0) * lying) * smoothstep(0.0, 2.0, uTime - aStar.w);
      b *= 1.0 + uLamp.y * lying * (1.0 - smoothstep(uLamp.x * 0.55, uLamp.x * 1.15 + 1e-3, distance(p.xz, uLanternPos.xz)));
      b *= 1.0 - smoothstep(uSun.x - uSun.y * 0.5, uSun.x + uSun.y * 0.5 + 1e-3, p.y);        // it goes out as it crosses the sunline
      // which side of the water this copy draws: uWhere 0 = both (drawn after the water), -1 = under it only, 1 = in the air only
      if (uWhere < -0.5) b *= 1.0 - smoothstep(-0.03, 0.0, p.y); else if (uWhere > 0.5) b *= smoothstep(-0.03, 0.0, p.y);
      if (uPass < 0.5 && uWhere > -0.5) b = 0.0;                             // not in the picture the water bends
      vec3 dc = p - uCameraPos; float dn = max(length(dc), 1e-3);
      p += dc / dn * max(0.0, ${KEEP_CLEAR.toFixed(2)} - dn);                // it passes the eye at arm's length, never nearer
      vQ = position.xy; vC = vec4(0.0); vW = vec3(0.0); vD = vec2(1.0, -3.0);
      if (b < 0.004) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
      // (everything that is one value for the whole light is worked out at its middle and passed flat: see makeRings)
      vec4 mv = viewMatrix * modelMatrix * vec4(p, 1.0);
      float dist = max(0.1, -mv.z), fog = 1.0 - fogAmount(length(mv.xyz));
      float near = 1.0 - smoothstep(uStone.x, uStone.y, length(mv.xyz));     // within fifteen metres the stone itself is drawn
      if (aPart < 0.5) {
        // the point: far off it is kept to two pixels and dimmed; close by, its hard middle gives way to the stone and
        // only the soft light round it is left
        // (in the mirror, which is a smaller picture stretched, it is kept to three pixels: two made square blocks of its twin)
        float px = aBed.w * uPx / dist, grow = max(1.0, (uPass > 1.5 ? 3.0 : 2.0) / px), close = mix(0.25, 1.0, smoothstep(1.5, 10.0, dist));
        float lift = mix(aBed.w * grow, aBed.w * 0.28, near) * lying;
        mv.xyz += (viewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz * lift;         // it lies ON the bed, lifted by its own radius: the sand would cut it in half
        mv.xy += position.xy * aBed.w * grow * 2.2;
        gl_Position = projectionMatrix * mv;
        vC = vec4(aTint * uGlow.x * b * close * pow(1.0 / grow, 1.1) * fog, 0.0); vD = vec2(1.0 - near, mix(-3.0, -lift / (aBed.w * grow * 2.2), lying));
      } else if (aPart > 1.5) {
        // the stone: 6 to 9 cm, each a little its own shape and turned its own way; once it has left the bed it turns slowly
        if (near < 0.01) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
        float sd = aStar.y, ang = sd * 6.2831853 + tau * (0.2 + 0.3 * sd), ca = cos(ang), sa = sin(ang);
        vec3 q = position * vec3(0.85 + 0.3 * fract(sd * 7.3), 0.75 + 0.4 * fract(sd * 13.7), 0.85 + 0.3 * fract(sd * 29.1)) * (aBed.w * 0.5);
        q = vec3(q.x * ca + q.z * sa, q.y, q.z * ca - q.x * sa);
        float tip = 0.35 * sin(tau * (0.17 + 0.2 * fract(sd * 3.1))) * (1.0 - lying), ct = cos(tip), st = sin(tip);
        q = vec3(q.x, q.y * ct - q.z * st, q.y * st + q.z * ct);
        vW = (modelMatrix * vec4(p + vec3(0.0, aBed.w * 0.28 * lying, 0.0) + q, 1.0)).xyz;
        gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.0);
        vC = vec4(aTint * uGlow.x * 0.30 * b * near * fog, 2.0);
      } else {
        // light on the sand: a flat disc on the bed, gone as soon as the light has left it
        vec3 q = vec3(p.x + position.x * uGlow.z, aBed.y + 0.01, p.z + position.y * uGlow.z);
        gl_Position = lying < 0.01 ? vec4(2.0, 2.0, 2.0, 1.0) : projectionMatrix * viewMatrix * modelMatrix * vec4(q, 1.0);
        vC = vec4(aTint * uGlow.y * b * lying * fog, 1.0);
      }
    }`;
  const fragmentShader = /* glsl */`
    uniform vec3 uCameraPos;
    varying vec2 vQ; varying vec3 vW; flat varying vec4 vC; flat varying vec2 vD;
    void main() {
      if (vC.a > 1.5) {
        // the stone: every facet one flat tone, by how it faces the eye and the sky (its own light; both sides are added,
        // so the far facets show faintly through the near ones, as through milky glass)
        vec3 n = cross(dFdx(vW), dFdy(vW)); float l = length(n);
        if (!(l > 1e-16)) discard;
        n /= l; vec3 e = normalize(uCameraPos - vW); float f = dot(n, e);
        if (f < 0.0) { n = -n; f = -f; }
        float tone = 0.10 + 0.70 * pow(f, 2.4) + 0.26 * max(n.y, 0.0);
        gl_FragColor = vec4(clamp(vC.rgb * tone * (gl_FrontFacing ? 0.95 : 0.2), 0.0, 30.0), 1.0); return;
      }
      float r = min(length(vQ), 2.0), a = vC.a > 0.5 ? exp(-r * r * 4.0) * (1.0 - smoothstep(0.7, 1.0, r)) * 0.5 : (1.0 - smoothstep(0.20, 0.42, r)) * vD.x + 0.14 * exp(-r * r * 5.0) * (1.0 - smoothstep(0.7, 1.0, r)) * smoothstep(vD.y - 0.02, vD.y + 0.4, vQ.y);      // (the soft light thins toward the sand, which would otherwise cut it along a ruled line)
      gl_FragColor = vec4(clamp(vC.rgb * a, 0.0, 30.0), 1.0);
    }`;
  const group = new THREE.Group(); group.name = 'bed-lights';
  const make = (where, order, layer) => {
    const mat = new THREE.ShaderMaterial({ uniforms: { ...common, uPx: { value: 800 }, uPass: { value: 1 }, uWhere: { value: where } }, vertexShader, fragmentShader, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false });
    for (const g of [geo, stoneGeo]) { const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = order; if (layer) mesh.layers.set(layer); perPass(engine, mesh, mat, where < 0); group.add(mesh); }
  };
  if (o.after) make(0, 3, 0); else { make(-1, -2, 1); make(1, 3, 0); }
  (o.parent || ctx.group).add(group);
  const rings = o.rings || makeRings(ctx, { color: o.color, parent: o.parent });

  // each light breaks the surface a moment after it lifts: found on the CPU from the same numbers, in order of time
  let order = null, next = 0, lastT = -Infinity, nextSpare = n;
  const depthTime = (y) => { const d = Math.max(0, -y); return o.gain > 1e-4 ? (-o.speed + Math.sqrt(o.speed * o.speed + 2 * o.gain * d)) / o.gain : d / Math.max(o.speed, 1e-3); };
  const dirty = () => { order = null; aStar.needsUpdate = true; };
  const api = {
    object: group, count: n, rings, sunline: o.sunline,
    tick(T) { common.uClock.value = T; return api; },
    rise(i, T) { if (i >= 0 && i < total) { star[i * 4] = T; dirty(); } return api; },
    riseWith(front, k = front.last) { for (let i = 0; i < n; i++) if (star[i * 4] > 1e8 && !held[i]) star[i * 4] = front.arrival(bed[i * 4], bed[i * 4 + 1], bed[i * 4 + 2], star[i * 4 + 1], k); dirty(); return api; },
    riseAll(when) { for (let i = 0; i < n; i++) if (!held[i]) star[i * 4] = typeof when === 'function' ? when(bed[i * 4], bed[i * 4 + 2], i) : when; dirty(); return api; },
    hold(i) { if (i >= 0 && i < total) held[i] = 1; return api; },
    settle(risen) { for (let i = 0; i < total; i++) star[i * 4] = risen ? -1e5 : 1e9; dirty(); next = total; return api; },
    nearest(x, z, free = true) { let best = -1, bd = Infinity; for (let i = 0; i < n; i++) { if (held[i] === 2 || (free && star[i * 4] < 1e8)) continue; const d = (bed[i * 4] - x) ** 2 + (bed[i * 4 + 2] - z) ** 2; if (d < bd) { bd = d; best = i; } } return best; },
    within(x, z, radius, free = true) {
      const out = [];
      for (let i = 0; i < total; i++) { if (held[i] === 2 || star[i * 4 + 3] > 1e8 || (free && star[i * 4] < 1e8)) continue; const d = (bed[i * 4] - x) ** 2 + (bed[i * 4 + 2] - z) ** 2; if (d <= radius * radius) out.push([d, i]); }
      return out.sort((p, q) => p[0] - q[0]).map((e) => e[1]);
    },
    take(i, out = new THREE.Vector3()) {
      if (i < 0 || i >= total) return null;
      out.set(bed[i * 4], bed[i * 4 + 1], bed[i * 4 + 2]);
      held[i] = 2; star[i * 4] = 1e9; star[i * 4 + 3] = 1e9; dirty();
      return out;
    },
    level(v = 1, seconds = 2) { levelTo = clamp01(v); levelIn = Math.max(MIN_RISE, seconds); return api; },
    place(i, x, z) { if (i >= 0 && i < total) { bed[i * 4] = x; bed[i * 4 + 2] = z; aBed.needsUpdate = true; } return api; },
    bear(i) { if (i >= 0 && i < total) { star[i * 4 + 3] = engine.shared.uTime.value; star[i * 4] = 1e9; aStar.needsUpdate = true; } return api; },
    spare() { return nextSpare < total ? nextSpare++ : -1; },
    positionOf(i, out = new THREE.Vector3()) { const tau = Math.max(0, common.uClock.value - star[i * 4]); return out.set(bed[i * 4] + o.drift[0] * tau, bed[i * 4 + 1] + o.speed * tau + 0.5 * o.gain * tau * tau, bed[i * 4 + 2] + o.drift[1] * tau); },
  };
  const levelGuard = makeGuard(MIN_RISE, 1); let levelTo = 1, levelIn = 2;
  const candD = new Float32Array(total), candI = new Int32Array(total), camPos = engine.shared.uCameraPos.value;
  let stonesWere = 0;
  ctx.onUpdate((dt) => {
    const T = common.uClock.value;
    common.uLevel.value = slew(levelGuard, levelTo, dt, levelIn);
    common.uSun.value.x = Number.isFinite(api.sunline) ? api.sunline : 1e6;
    // ---- the stones: the lights within sixteen metres of the eye, the nearest sixty-four at most
    let m = 0;
    for (let i = 0; i < total; i++) {
      if (star[i * 4 + 3] > 1e8) continue;                                  // dark: not born, or taken
      const tau = Math.max(0, T - star[i * 4]), x = bed[i * 4] + o.drift[0] * tau - camPos.x, y = bed[i * 4 + 1] + o.speed * tau + 0.5 * o.gain * tau * tau - camPos.y, z = bed[i * 4 + 2] + o.drift[1] * tau - camPos.z, d = x * x + y * y + z * z;
      if (d < 272) { candD[i] = d; candI[m++] = i; }                        // (16.5 m)
    }
    let far = 16;
    if (m > STONES) { candI.subarray(0, m).sort((p, q) => candD[p] - candD[q]); far = Math.sqrt(candD[candI[STONES - 1]]); m = STONES; }      // a crowd: the stones give way to points sooner
    common.uStone.value.set(far * 0.7, far);
    if (m || stonesWere) {
      for (let k = 0; k < m; k++) { const i = candI[k]; sBed.set(bed.subarray(i * 4, i * 4 + 4), k * 4); sStar.set(star.subarray(i * 4, i * 4 + 4), k * 4); sTint.set(tint.subarray(i * 3, i * 3 + 3), k * 3); }
      stoneGeo.userData.count = m; saBed.needsUpdate = saStar.needsUpdate = saTint.needsUpdate = true; stonesWere = m;
    }
    if (!order) {                                                           // (only when rise times have changed)
      order = []; for (let i = 0; i < total; i++) if (star[i * 4] < 1e8 && star[i * 4] > -1e4) order.push(i);
      order.sort((p, q) => (star[p * 4] + depthTime(bed[p * 4 + 1])) - (star[q * 4] + depthTime(bed[q * 4 + 1])));
      next = 0; while (next < order.length && star[order[next] * 4] + depthTime(bed[order[next] * 4 + 1]) <= lastT) next++;
    }
    let budget = 24;                                                        // at most this many rings begun in one frame
    while (next < order.length && budget > 0) {
      const i = order[next], at = star[i * 4] + depthTime(bed[i * 4 + 1]);
      if (at > T) break;
      next++;
      if (T - at > 1.5) continue;                                           // long past (a realm entered part-way): no ring
      const tau = at - star[i * 4], x = bed[i * 4] + o.drift[0] * tau, z = bed[i * 4 + 2] + o.drift[1] * tau, boat = ctx.boat;
      const half = (ctx.waterLook.rippleSize || 64) * 0.5 - 3, near = Math.abs(x - boat.x) < half && Math.abs(z - boat.z) < half;
      rings.touch(x, z, o.ring); budget--;
      if (o.onRise) o.onRise(x, z, i, near);
    }
    lastT = T;
  });
  return api;
}
// the bow lantern's place, as the gouache material knows it (the engine keeps it up to date)
function gouacheLantern(engine) { const s = engine.shared; return { uLanternPos: s.uLanternPos || { value: new THREE.Vector3(0, -100, 0) } }; }

// ================================================================================================= falling stars
/**
 * Falling stars: a streak across the sky with its reflection racing up the water to meet it; some come on down as a
 * slow ember and land, with a ring. A pool of six, one draw call; they are sparse, and never two in one quarter of
 * the sky at once. Everything is timed on the realm's own clock and its seeded numbers: the same every run.
 *
 *   const falls = makeFallingStars(ctx, { every: [5, 8], landOne: 4, onLand: (x, z) => { const i = bed.spare(); bed.place(i, x, z).bear(i); } });
 *   stage.cue('first', { s: 46 }, () => falls.fall({ to: kit.at(130, -34), seconds: 8, from: 'left' }));
 *
 * opts:
 *   every          [5, 8] seconds between ambient falls (null or 0: only the ones you ask for)
 *   landOne        one ambient fall in this many comes down (4); landAt: [60, 250] metres from the boat
 *   color, tail    '#e6eeff' the head, '#6a509c' what the tail thins to;  intensity: 2.0
 *   arc            [12, 28] degrees of sky a streak crosses, in `streak` [0.9, 1.6] seconds
 *   high           [25, 70] degrees up where streaks begin
 *   sink           3.5 m/s: how fast an ember comes down;  rings: a pool from makeRings (one is made)
 *   onLand         (x, z, near) => {} when one lands (near: within reach of the water's own ripples)
 *   seed, parent
 * Returns { object, rings, active,
 *   fall({ to: {x, z} | Vector3, seconds, from: 'left' | 'right' | radians })   with no `to` it is a plain streak somewhere;
 *                              with `to` it comes down and lands there after `seconds` (6 to 10)
 *   set({ every, landOne, landAt })   change the ambient falls on the way (one in six steered to 20 to 40 m for a stretch)
 *   level(v, seconds)          dim them all (a third of their night strength under a pale sky) }
 */
export function makeFallingStars(ctx, opts = {}) {
  const o = { every: [5, 8], landOne: 4, landAt: [60, 250], color: '#e6eeff', tail: '#6a509c', intensity: 2.0, arc: [12, 28], streak: [0.9, 1.6], high: [25, 70], sink: 3.5, rings: null, onLand: null, seed: 81, parent: null, ...opts };
  const engine = ctx.engine, rnd = ctx.rng(o.seed), POOL = 6, SEG = 14, RAD = Math.PI / 180;
  // geometry: a ribbon of SEG pieces (part 0: x = how far back along the tail 0..1, y = side) and the ember's quad (part 1)
  const pos = [], part = [], idx = [];
  for (let j = 0; j <= SEG; j++) for (const side of [-1, 1]) { pos.push(j / SEG, side, 0); part.push(0); }
  for (let j = 0; j < SEG; j++) { const a = j * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const q0 = pos.length / 3; for (const [x, y] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { pos.push(x, y, 0); part.push(1); } idx.push(q0, q0 + 1, q0 + 2, q0, q0 + 2, q0 + 3);
  const geo = new THREE.InstancedBufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('aPart', new THREE.Float32BufferAttribute(part, 1)); geo.setIndex(idx);
  const A = new Float32Array(POOL * 4), B = new Float32Array(POOL * 4), C = new Float32Array(POOL * 4);      // A: from dir + start (uTime); B: to dir + seconds; C: landing x, z, fall seconds (0: none), start height
  for (let i = 0; i < POOL; i++) A[i * 4 + 3] = -1e9;
  const aA = new THREE.InstancedBufferAttribute(A, 4), aB = new THREE.InstancedBufferAttribute(B, 4), aC = new THREE.InstancedBufferAttribute(C, 4);
  for (const a of [aA, aB, aC]) a.setUsage(THREE.DynamicDrawUsage);
  geo.setAttribute('aA', aA); geo.setAttribute('aB', aB); geo.setAttribute('aC', aC); geo.instanceCount = POOL;
  const uniforms = { ...sharedOf(ctx), uPx: { value: 800 }, uPass: { value: 1 }, uView: { value: new THREE.Vector2(1600, 900) }, uHead: { value: col(o.color).multiplyScalar(o.intensity) }, uTail: { value: col(o.tail).multiplyScalar(o.intensity * 0.6) }, uSink: { value: o.sink }, uLevel: { value: 1 } };
  const mat = new THREE.ShaderMaterial({ uniforms, transparent: true, depthWrite: false, depthTest: true, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
    vertexShader: /* glsl */`
      attribute float aPart; attribute vec4 aA, aB, aC;
      uniform float uTime, uPx, uPass, uSink, uLevel; uniform vec2 uView; uniform vec3 uCameraPos;
      ${FOG_PARS}
      varying vec3 vCol; varying vec2 vQ; varying float vKind;
      uniform vec3 uHead, uTail;
      vec3 along(float e) { return normalize(mix(aA.xyz, aB.xyz, e)); }
      void main() {
        float age = uTime - aA.w, dur = max(aB.w, 0.05), t01 = age / dur, e = clamp(t01, 0.0, 1.0);
        float lands = step(0.01, aC.z);
        // A meteor does not brake: a plain streak crosses at a nearly even pace (it ends at two thirds of the speed it
        // began with) and burns out on the way. Only one that comes on down as an ember slows to where the ember begins.
        e = mix(e * (1.0 - 0.2 * e) / 0.8, 1.0 - (1.0 - e) * (1.0 - e), lands);
        if (age < 0.0 || uPass < 0.5) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
        if (aPart < 0.5) {
          // the streak: far away (it is drawn against the sky, wherever the eye is), a hair wide, its tail drawn up as it ends
          float after = max(age - dur, 0.0), len = 0.55 * smoothstep(0.0, 0.25, t01) * mix(1.0, 1.0 - smoothstep(0.0, 0.5, after), lands);
          float back = position.x * len;
          vec4 c0 = projectionMatrix * viewMatrix * vec4(cameraPosition + along(e - back) * 700.0, 1.0);
          vec4 c1 = projectionMatrix * viewMatrix * vec4(cameraPosition + along(e - back - 0.02) * 700.0, 1.0);
          vec2 dir = (c0.xy / c0.w - c1.xy / c1.w) * uView; float dl = length(dir);
          vec2 nrm = dl > 1e-4 ? vec2(-dir.y, dir.x) / dl : vec2(0.0, 1.0);
          float wide = mix(2.0, 1.0, position.x) * max(uView.y / 900.0, 0.6);  // pixels: a hair, a little stouter at its head
          c0.xy += nrm * position.y * wide / uView * 2.0 * c0.w;
          gl_Position = c0.xyww;
          // (plain: the head goes out over the last third of its way and its train a moment after it, where it hangs;
          // landing: the whole streak is drawn up into the ember)
          float alight = mix(1.0 - smoothstep(0.66 + 0.24 * position.x, 1.0 + 0.3 * position.x, t01), 1.0 - smoothstep(0.1, 0.5, after), lands);
          // (brightest a little behind its tip, as a meteor is, and never a ball: the first build's head carried all the
          // light at its very point, which the bloom blew up into a rocket's flare)
          float fade = smoothstep(0.0, 0.08, age) * alight * (1.0 - position.x) * (0.55 + 0.45 * smoothstep(0.0, 0.06, position.x)) * (1.0 - uVeil);
          vCol = mix(uHead, uTail, smoothstep(0.0, 0.45, position.x)) * fade * uLevel; vQ = vec2(0.0, position.y); vKind = 0.0;
          if (len < 0.001 || c0.w <= 0.0) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
        } else {
          // the ember: a point that comes on down where the streak ended, swaying a little, and lands
          float tf = age - dur * 0.85;
          if (lands < 0.5 || tf < 0.0 || tf > aC.z) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
          vec3 p = vec3(aC.x, aC.w - uSink * tf, aC.y);
          p.xz += 0.35 * (aC.w - uSink * tf) / max(aC.w, 1.0) * vec2(sin(tf * 0.9 + aC.x), cos(tf * 0.7 + aC.y));
          vec3 dc = p - uCameraPos; float dn = max(length(dc), 1e-3); p += dc / dn * max(0.0, ${KEEP_CLEAR.toFixed(2)} - dn);
          vec4 mv = viewMatrix * vec4(p, 1.0);
          float dist = max(0.1, -mv.z), size = 0.11, px = size * uPx / dist, grow = max(1.0, 2.4 / px);
          mv.xy += position.xy * size * grow * 1.6;
          gl_Position = projectionMatrix * mv;
          float fade = smoothstep(0.0, 0.4, tf) * (1.0 - smoothstep(aC.z - 0.15, aC.z, tf)) * (1.0 - fogAmount(length(mv.xyz)) * 0.8);
          vCol = uHead * 0.75 * fade * uLevel / pow(grow, 1.0); vQ = position.xy; vKind = 1.0;
        }
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vCol; varying vec2 vQ; varying float vKind;
      void main() {
        float a = vKind < 0.5 ? 1.0 - smoothstep(0.3, 1.0, abs(vQ.y)) : (1.0 - smoothstep(0.18, 0.42, length(vQ))) + 0.3 * exp(-dot(vQ, vQ) * 5.0) * (1.0 - smoothstep(0.7, 1.0, length(vQ)));
        gl_FragColor = vec4(clamp(vCol * a, 0.0, 30.0), 1.0);
      }`,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = 'falling-stars'; mesh.frustumCulled = false; mesh.renderOrder = -998;       // with the stars: against the sky, behind the land
  mesh.onBeforeRender = (renderer, scene, camera) => {
    const rt = renderer.getRenderTarget(), u = mat.uniforms;
    if (rt) u.uView.value.set(rt.width, rt.height); else renderer.getDrawingBufferSize(u.uView.value);
    u.uPx.value = u.uView.value.y * 0.5 * camera.projectionMatrix.elements[5]; u.uPass.value = engine.reflecting ? 2 : rt === engine.pre ? 0 : 1; mat.uniformsNeedUpdate = true;
  };
  (o.parent || ctx.group).add(mesh);
  const rings = o.rings || makeRings(ctx, { color: o.color });
  const T = engine.shared.uTime, land = new Array(POOL).fill(null), quarter = new Array(POOL).fill(-1);
  let nextAt = o.every ? o.every[0] * 0.6 : Infinity, count = 0, slot = 0;
  const dirOf = (az, el) => [Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el)];      // az 0 = down the path's start direction (-z), positive to the right
  const api = {
    object: mesh, rings, get active() { let k = 0; for (let i = 0; i < POOL; i++) if (T.value - A[i * 4 + 3] < B[i * 4 + 3] + (C[i * 4 + 2] || 0.6)) k++; return k; },
    fall(f = {}) {
      const i = slot; slot = (slot + 1) % POOL;
      const cam = engine.shared.uCameraPos.value, dur = o.streak[0] + (o.streak[1] - o.streak[0]) * rnd(), arc = (o.arc[0] + (o.arc[1] - o.arc[0]) * rnd()) * RAD;
      let to, az, el, lx = 0, lz = 0, secs = 0, h = 0;
      if (f.to) {                                                            // it ends where the ember begins: above its landing
        lx = f.to.x; lz = f.to.z; secs = f.seconds ?? 8; h = o.sink * secs;
        const dx = lx - cam.x, dy = h - cam.y, dz = lz - cam.z, l = Math.hypot(dx, dy, dz) || 1;
        to = [dx / l, dy / l, dz / l]; az = Math.atan2(to[0], -to[2]); el = Math.asin(to[1]);
      } else {
        // (where it ends: `az` and `el` in degrees if given; else `from` as radians of azimuth, or anywhere; 10 to 42 degrees up)
        az = f.az != null ? f.az * RAD : typeof f.from === 'number' ? f.from : (rnd() * 2 - 1) * Math.PI; el = f.el != null ? f.el * RAD : (o.high[0] * 0.4 + (o.high[1] * 0.6 - o.high[0] * 0.4) * rnd()) * RAD; to = dirOf(az, el);
      }
      // it comes from higher up, and from the side asked for
      const sideways = f.from === 'left' ? -1 : f.from === 'right' ? 1 : rnd() < 0.5 ? -1 : 1, slant = 0.35 + 0.5 * rnd();
      const from = dirOf(az + sideways * arc * slant / Math.max(0.3, Math.cos(el)), Math.min(88 * RAD, el + arc * Math.sqrt(1 - slant * slant * 0.6)));
      A.set([from[0], from[1], from[2], T.value], i * 4); B.set([to[0], to[1], to[2], dur], i * 4); C.set([lx, lz, secs, h], i * 4);
      aA.needsUpdate = aB.needsUpdate = aC.needsUpdate = true;
      land[i] = f.to ? { x: lx, z: lz, at: T.value + dur * 0.85 + secs } : null;
      quarter[i] = Math.floor(((az / (Math.PI * 2) + 1) % 1) * 4);
      return api;
    },
    set(c = {}) {
      const had = !!o.every;
      for (const k of ['every', 'landOne', 'landAt']) if (k in c) o[k] = c[k];
      if (!o.every) nextAt = Infinity; else if (!had || !Number.isFinite(nextAt)) nextAt = ctx.time + o.every[0] * 0.6;
      return api;
    },
    level(v = 1, seconds = 2) { levelTo = clamp01(v); levelIn = Math.max(MIN_RISE, seconds); return api; },
  };
  const levelGuard = makeGuard(MIN_RISE, 1); let levelTo = 1, levelIn = 2;
  ctx.onUpdate((dt, c) => {
    const now = T.value, boat = ctx.boat;
    uniforms.uLevel.value = slew(levelGuard, levelTo, dt, levelIn);
    for (let i = 0; i < POOL; i++) { const l = land[i]; if (l && now >= l.at) { land[i] = null; const half = (ctx.waterLook.rippleSize || 64) * 0.5 - 3, near = Math.abs(l.x - boat.x) < half && Math.abs(l.z - boat.z) < half; rings.touch(l.x, l.z, { ripple: 0.6, radius: 0.8, size: 0.4, grow: 2, life: 6 }); if (o.onLand) o.onLand(l.x, l.z, near); } }
    if (c.time < nextAt) return;
    nextAt = c.time + o.every[0] + (o.every[1] - o.every[0]) * rnd(); count++;
    // somewhere no other is: never two in one quarter of the sky
    let az = 0;
    for (let tries = 0; tries < 6; tries++) { az = (rnd() * 2 - 1) * Math.PI; const q = Math.floor(((az / (Math.PI * 2) + 1) % 1) * 4); let busy = false; for (let i = 0; i < POOL; i++) if (quarter[i] === q && now - A[i * 4 + 3] < B[i * 4 + 3] + C[i * 4 + 2] + 0.5) busy = true; if (!busy) break; }
    if (o.landOne > 0 && count % Math.round(o.landOne) === 0) {
      const r = o.landAt[0] + (o.landAt[1] - o.landAt[0]) * rnd();
      api.fall({ to: { x: boat.x + Math.sin(az) * r, z: boat.z - Math.cos(az) * r }, seconds: 6 + 4 * rnd() });
    } else api.fall({ from: az });
  });
  return api;
}

// ================================================================================================= the lamp's globe of gold flakes
// For anyone's own falling things (the snow itself is the `falls` family's): how gold a flake at world position p is.
//   uniforms: { ...lampGlobeUniforms(ctx) }     shader: ${LAMP_GLOBE_GLSL}  ...  float g = lampGlobe(p); col = lampGlobeColor(col, peach, g);
// (The lantern's place has a name of its own here, uGlobeAt: the gouache material already declares uLanternPos in its
// fragment shader, and a name declared twice does not compile. So the snippet goes into any shader, a gouache `extend` too.)
export const LAMP_GLOBE_GLSL = /* glsl */`
  uniform vec3 uGlobeAt; uniform vec4 uGlobe; uniform vec4 uGlobeGold;
  // 0 outside the globe .. 1 beside the lamp. A lamp's light thins with the square of the distance: half at uGlobe.y
  // metres (1.3), a fifth at two and a half, and it is let go to nothing at the globe's edge. That steepness is what
  // makes a globe: lit evenly, the flakes are gold dust all over the picture. (uGlobe: radius, half distance, the lamp's level, -)
  float lampGlobe(vec3 p) {
    float d = distance(p, uGlobeAt), h = max(uGlobe.y, 0.05);
    return (1.0 - smoothstep(0.55, 1.0, d / max(uGlobe.x, 0.01))) * uGlobe.z / (1.0 + d * d / (h * h));
  }
  // the colour a flake takes: paper at the globe's edge, through peach, to gold beside the lamp. (The gold is brighter
  // than paper, uGlobeGold.a = 1.6, and has to be: the painter's filter flattens anything small that is not a light,
  // so a flake of two or three pixels in a matte gold is simply painted out)
  vec3 lampGlobeColor(vec3 paper, vec3 peach, float g) {
    return mix(mix(paper, peach, smoothstep(0.0, 0.10, g)), uGlobeGold.rgb * uGlobeGold.a, smoothstep(0.07, 0.42, g));
  }
`;
const _globes = new WeakMap();
/** The uniforms LAMP_GLOBE_GLSL needs (shared: one globe round the boat's lantern; makeLampGlobe keeps them up to date). */
export function lampGlobeUniforms(ctx, { radius = 3.5, half = 1.3, gold = '#ffd79a', intensity = 1.6 } = {}) {
  const engine = ctx.engine; let u = _globes.get(engine);
  if (!u) { u = { uGlobeAt: engine.shared.uLanternPos, uGlobe: { value: new THREE.Vector4(radius, half, 1, 0) }, uGlobeGold: { value: new THREE.Vector4(1, 1, 1, 1) } }; _globes.set(engine, u); }
  const g = col(gold); u.uGlobe.value.x = radius; u.uGlobe.value.y = half; u.uGlobeGold.value.set(g.r, g.g, g.b, intensity);
  return u;
}
/**
 * The globe of gold flakes round the boat's lantern in falling snow: flakes of its own that fall through a box round the
 * lamp and show only inside its reach, paper white at the edge of the globe, peach, then gold beside the glass. Matte:
 * no sparkle. It travels with the boat. (It also keeps `lampGlobeUniforms` up to date, so the snowfall itself can turn
 * gold in the same globe: see LAMP_GLOBE_GLSL.)
 *
 *   makeLampGlobe(ctx, {});
 *
 * opts:
 *   count          2,400 in the box the globe sits in, about 800 of them inside the globe at any time (thinned by the
 *                  quality setting unless `exact`)
 *   radius         3.5 metres: the globe is 7 m across
 *   gold, peach, paper   '#ffd79a', '#f6cfae', '#f3ece8';  intensity: 1.6 beside the lamp
 *   fall           0.8 m/s;  sway: 0.15 metres at swayRate 0.2 turns a second, each on its own phase
 *   size           [0.012, 0.022] metres; one flake in seven is a clump twice the size
 *   opacity        0.85
 *   only           'direct' (default: the winter is not in the snow orchard's mirror); null for both
 *   exact, seed, parent
 * Returns { object, count, level(v, seconds): 0 when the lantern is out, uniforms }.
 */
export function makeLampGlobe(ctx, opts = {}) {
  const o = { count: 2400, radius: 3.5, half: 1.3, gold: '#ffd79a', peach: '#f6cfae', paper: '#f3ece8', intensity: 1.6, fall: 0.8, sway: 0.15, swayRate: 0.2, size: [0.007, 0.013], opacity: 0.85, only: 'direct', exact: false, seed: 91, parent: null, ...opts };
  const engine = ctx.engine, rnd = ctx.rng(o.seed), n = o.exact ? o.count : Math.max(1, Math.round(o.count * (ctx.quality.density || 1)));
  const seeds = new Float32Array(n * 4); for (let i = 0; i < n; i++) seeds.set([rnd(), rnd(), rnd(), rnd()], i * 4);
  const geo = quadGeometry(); geo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seeds, 4)); geo.instanceCount = n;
  const G = lampGlobeUniforms(ctx, { radius: o.radius, half: o.half, gold: o.gold, intensity: o.intensity });
  const uniforms = { ...sharedOf(ctx), ...G, uPx: { value: 800 }, uPass: { value: 1 }, uPeach: { value: col(o.peach) }, uPaper: { value: col(o.paper) },
    uFall: { value: new THREE.Vector4(o.fall, o.sway, o.swayRate * Math.PI * 2, o.opacity) }, uSize: { value: new THREE.Vector2(o.size[0], o.size[1] - o.size[0]) } };
  const mat = new THREE.ShaderMaterial({ uniforms, transparent: true, depthWrite: false, blending: THREE.NormalBlending, side: THREE.DoubleSide, fog: false,
    vertexShader: /* glsl */`
      attribute vec4 aSeed; uniform float uTime, uPx, uPass; uniform vec3 uCameraPos; uniform vec4 uFall; uniform vec2 uSize;
      ${LAMP_GLOBE_GLSL} ${FOG_PARS}
      varying vec2 vQ; varying vec3 vK;
      void main() {
        // (its own flakes live in the inner two thirds of the globe, where the light is: three hundred within a metre and
        // a half of the lamp. Spread through the whole globe there were sixty there, and no globe to be seen. The pale
        // outer shell is for the snowfall itself, through LAMP_GLOBE_GLSL)
        float box = uGlobe.x * 1.4;
        vec3 p = aSeed.xyz * box;
        p.y -= uTime * uFall.x * (0.75 + 0.5 * aSeed.w);
        p.x += sin(uTime * uFall.z * (0.7 + 0.6 * aSeed.w) + aSeed.x * 40.0) * uFall.y;
        p.z += cos(uTime * uFall.z * (0.6 + 0.7 * aSeed.y) + aSeed.z * 40.0) * uFall.y;
        p = mod(p - uGlobeAt + box * 0.5, box) - box * 0.5 + uGlobeAt;             // the box travels with the lamp; flakes pass through it
        float g = lampGlobe(p) * step(0.02, p.y) * (1.0 - smoothstep(0.34 * box, 0.5 * box, distance(p, uGlobeAt)));   // none under the water, none at the box's own walls
        vec3 dc = p - uCameraPos; float dn = max(length(dc), 1e-3);
        p += dc / dn * max(0.0, ${KEEP_CLEAR.toFixed(2)} - dn);
        g *= smoothstep(${KEEP_CLEAR.toFixed(2)}, 1.9, dn);                       // nothing looms in the rider's face: a flake comes up out of nothing two metres off
        if (g < 0.008 || uPass < 0.5) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
        float clump = step(0.857, aSeed.w) + 1.0;                                    // one in seven is a clump twice the size
        vec4 mv = viewMatrix * vec4(p, 1.0);
        float size = (uSize.x + uSize.y * aSeed.y) * clump, px = size * uPx / max(0.1, -mv.z), grow = max(1.0, 1.6 / px);
        size *= min(1.0, 7.0 / px);                                                  // (and is never a disc more than seven pixels across)
        mv.xy += position.xy * size * grow * 0.5;
        gl_Position = projectionMatrix * mv;
        vQ = position.xy; vK = vec3(g, uFall.w * min(1.0, g * 3.0) / (grow * grow), 1.0 - fogAmount(length(mv.xyz)));
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uPeach, uPaper; ${LAMP_GLOBE_GLSL} varying vec2 vQ; varying vec3 vK;
      void main() {
        float r = length(vQ), a = (1.0 - smoothstep(0.45, 1.0, r)) * vK.y;
        if (a < 0.01) discard;
        vec3 c = lampGlobeColor(uPaper, uPeach, vK.x);                             // paper at the globe's edge, peach, then gold
        gl_FragColor = vec4(clamp(c, 0.0, 30.0), clamp(a * vK.z, 0.0, 1.0));
      }`,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = 'lamp-globe'; mesh.frustumCulled = false; mesh.renderOrder = 4;
  if (o.only === 'direct') mesh.layers.set(1); else if (o.only === 'mirror') mesh.layers.set(2);
  perPass(engine, mesh, mat);
  (o.parent || ctx.group).add(mesh);
  const guard = makeGuard(MIN_RISE, 1); let to = 1, secs = 2;
  ctx.onUpdate((dt) => { G.uGlobe.value.z = slew(guard, to, dt, secs); });
  return { object: mesh, count: n, uniforms: G, level(v = 1, seconds = 2) { to = clamp01(v); secs = Math.max(MIN_RISE, seconds); return this; } };
}

// ================================================================================================= domes of lamplight under water
/**
 * Domes of lamplight under the water, round lamps that burn just beneath the surface. Each is a ball of light in the
 * water, worked out along the eye's ray (bent as it enters the water), so it has depth: a low dome seen from the side,
 * a round pool seen from above; the surface's own ripples make it waver. Drawn on the water, after it.
 *
 *   const domes = makeLampDomes(ctx, { lamps: heads.map((p) => ({ x: p.x, y: -0.4, z: p.z })), color: '#f3a77e' });
 *   stage.cue('street', { s: 26 }, () => { domes.kindle(0, 3); stage.after(4, () => domes.kindle(1, 3)); });
 *
 * opts:
 *   lamps          [{ x, y, z, radius, lit }]: the lamp heads (y under the water); up to 16. lit: false = cold until `kindle`
 *   radius         1.5 metres (a dome 3 m across)
 *   color, core    '#f3a77e' the body of the light, '#ffd9b0' its hot middle;  intensity: 1.3;  coreLevel: 1.4
 *   mist           true or { height: 2, size: 4, color: '#c76c8c', level: 0.07 }: a faint glow on the mist above each lamp
 *                  (off by default: use it where there is mist to be lit)
 *   parent
 * Returns { object, lamps (their places and levels: for insects that gather over a lit one), kindle(i, seconds),
 *   dim(i, seconds), set(i, level), levelOf(i) }. Levels are eased; nothing comes up faster than half a second.
 */
export function makeLampDomes(ctx, opts = {}) {
  const o = { lamps: [], radius: 1.5, color: '#f3a77e', core: '#ffd9b0', intensity: 1.3, coreLevel: 1.4, mist: null, parent: null, ...opts };
  if (o.mist === true) o.mist = {};
  if (o.mist) o.mist = { height: 2, size: 4, color: '#c76c8c', level: 0.07, ...o.mist };
  const engine = ctx.engine, n = Math.min(16, o.lamps.length);
  const place = new Float32Array(n * 4), state = new Float32Array(n * 4);
  const lamps = o.lamps.slice(0, n).map((l, i) => { const L = { x: l.x, y: Math.min(l.y, -0.05), z: l.z, radius: l.radius ?? o.radius, level: l.lit === false ? 0 : 1, to: l.lit === false ? 0 : 1, seconds: 2 }; place.set([L.x, L.y, L.z, L.radius], i * 4); state.set([L.level, i * 1.7, 0, 0], i * 4); return L; });
  const aState = new THREE.InstancedBufferAttribute(state, 4); aState.setUsage(THREE.DynamicDrawUsage);
  const waterU = (() => { const s = engine.shared; return { tRipple: s.tRipple || (s.tRipple = { value: null }), uRippleRect: s.uRippleRect || (s.uRippleRect = { value: new THREE.Vector4(0, 0, 64, 64) }) }; })();
  const group = new THREE.Group(); group.name = 'lamp-domes';
  const geo = quadGeometry(); geo.setAttribute('aPlace', new THREE.InstancedBufferAttribute(place, 4)); geo.setAttribute('aState', aState); geo.instanceCount = n;
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...sharedOf(ctx), ...waterU, uBody: { value: col(o.color).multiplyScalar(o.intensity) }, uCore: { value: col(o.core).multiplyScalar(o.coreLevel) } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
    vertexShader: /* glsl */`
      attribute vec4 aPlace, aState; uniform vec3 uCameraPos; varying vec3 vP; flat varying vec4 vL; flat varying float vLevel;
      void main() {
        // The water draws what lies beneath it straight along the eye's line (it bends things only by its ripples), so a
        // lamp head 0.4 m down is seen through the surface some way short of where it stands. The ball of light is put
        // where the ray bent into the water at that spot reaches the lamp's depth: the dome then sits round the lamp as
        // the picture shows it, and keeps the low shape that the bent ray gives it.
        vec3 toL = aPlace.xyz - uCameraPos;
        vec3 S = uCameraPos + toL * (uCameraPos.y / max(uCameraPos.y - aPlace.y, 1e-3));
        vec3 dS = refract(normalize(toL), vec3(0.0, 1.0, 0.0), 0.75);
        vec3 C = S + dS * (aPlace.y / min(dS.y, -1e-3));
        float reach = aPlace.w * 2.7;
        vec3 p = vec3(C.x + position.x * reach, 0.006, C.z + position.y * reach);
        vP = p; vL = vec4(C, aPlace.w); vLevel = aState.x * (0.96 + 0.04 * sin(aState.y * 3.0));
        gl_Position = aState.x < 0.004 ? vec4(2.0, 2.0, 2.0, 1.0) : projectionMatrix * viewMatrix * modelMatrix * vec4(p, 1.0);
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uCameraPos, uBody, uCore; uniform sampler2D tRipple; uniform vec4 uRippleRect; ${FOG_PARS}
      varying vec3 vP; flat varying vec4 vL; flat varying float vLevel;
      // how much of a soft ball of light (thickest at its middle, nothing at radius R) a ray from p along d passes through, 0..1
      float through(vec3 p, vec3 d, vec3 c, float R) {
        vec3 oc = p - c; float b = dot(oc, d), h2 = dot(oc, oc) - b * b, a = R * R - h2;
        if (a <= 0.0) return 0.0;
        float hw = sqrt(a), x0 = max(-hw, b), x1 = hw;                       // from the surface (x = b) to the far side of the ball
        if (x1 <= x0) return 0.0;
        float i1 = a * a * x1 - 2.0 * a * x1 * x1 * x1 / 3.0 + pow(x1, 5.0) / 5.0, i0 = a * a * x0 - 2.0 * a * x0 * x0 * x0 / 3.0 + pow(x0, 5.0) / 5.0;
        return clamp((i1 - i0) / (16.0 / 15.0 * pow(R, 5.0)), 0.0, 1.0);
      }
      void main() {
        vec3 at = vec3(clamp(vP.xz, vL.xz - vL.w * 2.8, vL.xz + vL.w * 2.8), 0.006).xzy;      // (kept on its own quad, however the edge of a sliver is extrapolated)
        vec3 v = normalize(at - uCameraPos);
        // the surface's slope here, from the water's own ripples: it bends the ray, so the dome wavers with every ring
        vec2 uv = (at.xz - uRippleRect.xy) / uRippleRect.zw + 0.5, e = min(uv, 1.0 - uv);
        vec2 slope = min(e.x, e.y) > 0.0 ? texture2D(tRipple, uv).xy * smoothstep(0.0, 0.08, min(e.x, e.y)) : vec2(0.0);
        vec3 nrm = normalize(vec3(-slope.x, 1.0, -slope.y));
        vec3 d = refract(v, nrm, 0.75);                                       // into the water
        float body = through(at, d, vL.xyz, vL.w), core = through(at, d, vL.xyz, vL.w * 0.3);
        // (and a wider, fainter ball round it: light gone astray in the water. Seen at a glance along the water the ball
        // alone is a lens with two sharp points, which reads as a flare in a camera and not as a pool of light)
        float stray = through(at, d, vL.xyz, vL.w * 1.75);
        float dist = distance(at, uCameraPos);
        vec3 c = (uBody * (0.8 * pow(body, 1.3) + 0.3 * stray) + uCore * pow(core, 1.5)) * vLevel * (1.0 - fogAmount(dist)) * (0.55 + 0.45 * abs(v.y));
        gl_FragColor = vec4(clamp(c, 0.0, 30.0), 1.0);
      }`,
  });
  const mesh = new THREE.Mesh(geo, mat); mesh.frustumCulled = false; mesh.renderOrder = 1; mesh.layers.set(1); perPass(engine, mesh, mat); group.add(mesh);
  if (o.mist) {
    // a faint glow on the mist above each lamp: a soft flattened light that faces the eye (there is no sheet of mist to draw on)
    const mgeo = quadGeometry(); mgeo.setAttribute('aPlace', geo.getAttribute('aPlace')); mgeo.setAttribute('aState', aState); mgeo.instanceCount = n;
    const mm = new THREE.ShaderMaterial({ uniforms: { ...sharedOf(ctx), uColor: { value: col(o.mist.color).multiplyScalar(o.mist.level) }, uMist: { value: new THREE.Vector2(o.mist.height, o.mist.size * 0.5) } },
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
      vertexShader: /* glsl */`attribute vec4 aPlace, aState; uniform vec2 uMist; uniform float uTime; ${FOG_PARS} varying vec2 vQ; varying float vA;
        void main() { vec4 mv = viewMatrix * modelMatrix * vec4(aPlace.x, uMist.x + 0.15 * sin(uTime * 0.2 + aState.y), aPlace.z, 1.0); float dist = length(mv.xyz);
          mv.xy += position.xy * uMist.y * vec2(1.0, 0.32); vQ = position.xy; vA = aState.x * (1.0 - fogAmount(dist)) * smoothstep(3.0, 9.0, dist);
          gl_Position = aState.x < 0.004 ? vec4(2.0, 2.0, 2.0, 1.0) : projectionMatrix * mv; }`,
      fragmentShader: /* glsl */`uniform vec3 uColor; varying vec2 vQ; varying float vA;
        void main() { float r = length(vQ), a = exp(-r * r * 3.5) * (1.0 - smoothstep(0.7, 1.0, r)); gl_FragColor = vec4(clamp(uColor * a * vA, 0.0, 30.0), 1.0); }`,
    });
    const m2 = new THREE.Mesh(mgeo, mm); m2.frustumCulled = false; m2.renderOrder = 5; m2.layers.set(1); perPass(engine, m2, mm); group.add(m2);
  }
  (o.parent || ctx.group).add(group);
  ctx.onUpdate((dt) => {
    let changed = false;
    for (let i = 0; i < n; i++) { const L = lamps[i]; if (L.level !== L.to) { const m = dt / Math.max(MIN_RISE, L.seconds); L.level += Math.max(-m, Math.min(m, L.to - L.level)); const k = L.level; state[i * 4] = k * k * (3 - 2 * k); changed = true; } }
    if (changed) aState.needsUpdate = true;
  });
  const api = {
    object: group, lamps,
    kindle(i, seconds = 3) { if (lamps[i]) { lamps[i].to = 1; lamps[i].seconds = seconds; } return api; },
    dim(i, seconds = 3) { if (lamps[i]) { lamps[i].to = 0; lamps[i].seconds = seconds; } return api; },
    set(i, level) { if (lamps[i]) { lamps[i].to = lamps[i].level = clamp01(level); state[i * 4] = lamps[i].level; aState.needsUpdate = true; } return api; },
    levelOf(i) { return lamps[i] ? state[i * 4] : 0; },
  };
  return api;
}
