// The answering sea: the cast, group "Whale" (stage 3; docs/build/sea/3-cast-whale.md). The one whale, 25 m, the
// director's second thing that must not go wrong: a dark body sheathed in green-gold, never lit from within; a spine
// that follows its own trail (the swimmers family: docs/life/swimmers.md); one silent dive.
//
//   beneath     moment 7. On the cue 'whale' (s 112; heroes.js registers it) it passes under the bow from the right:
//               from (132, +46) toward (144, -40) at 2.5 m/s, rising from 11 m to 7 m, and beyond d -20 it sinks and
//               its light goes out (over seven seconds: there is one whale, and it is wanted again eight seconds into
//               the show). Far off, what is seen is its light on the water (a long smear that kindles and dies in the
//               sea's own marks, flukeprints opening one a stroke). Within a dozen metres of the eye, where the water
//               lets the body be seen, the smear gives way and the animal itself is seen, drawn in the light on its
//               own skin: head, flippers, back, stock and flukes sliding under the boat
//   surfacing   moment 9, on the show clock shared.sea.T. It comes up ahead and to the left heading away, blows at
//               T 16.5, rolls its back through one place, shows its fin, arches, lifts its flukes with the water
//               running off them, and sounds; a footprint is left where it went down
//
// WHAT IS THE FAMILY'S AND WHAT IS THIS MODULE'S. The animal, its motion, the events, the guard and the water that
// runs off the flukes are the family's (makeSwimmer). This module's own, because the family cannot give them HERE:
//   the light on the water   the family's (makeSwimLight) lies flat at y 0.04 and is cut with the water's own fleck
//                            mask; this sea heaves 1.4 m and draws every light in marks of its own (shared.sea.fleck
//                            and its stipple). So the smear, the flukeprints, the footprint and the rim round a back
//                            are drawn here: one patch that lies on the water's own grid and rides its swell, in the
//                            sheet's own marks (the same pictures at the same sizes, kindling and dying one by one),
//                            in the whale's green-gold
//   the light on its skin    the family's sheath takes still water (y = 0) for the waterline; here every point of the
//                            body is measured from where the water stands NOW at that point (so a back in a trough is
//                            a back in the air and takes no light, and the line of light lies where the sea meets it).
//                            It is in the sea's own marks too, sliding aft, and strong enough to be seen through
//                            seven metres of this water: under the boat the whale is a dark body drawn by its marks
//   the blow                 the family's is lit by the realm's one light, which in this sea has no red in it: the
//                            page's column (core-white at its foot, violet at its top) is drawn here, lit by the sea
//                            under it
//   what it writes into the water's trace   on the area's scale (a strength there is an age: shared.cast.seaLight)
//   the boat lifted          its swell as it passes under (0.2 m) and the one long ring of its footprint (0.25 m) lift
//                            the rider's own boat, and the water round the hull with it; none with reduced motion
//
// Everything this module gives staging is under shared.cast.whale: see "for staging" at the end of build(). It plays
// no sound: every sound has an event (whale.on(name, fn)).
//
// Numbers: W, below (plan.js is being edited by the set's people: this group keeps its numbers here).
// Switches for looking: &whplay=beneath | surface starts a life at once (the surfacing: the blow eight seconds on),
// wherever the boat is and whatever the hour (&whplayat=<seconds>: not at once but then); &whlog=<seconds>&whlogto=<name>.json
// writes what it told the realm, and a track of the animal, to .shots/ after that many seconds; &whshow=<m> how far the
// back stands out; &whgain=<k> its light on the water (0: the body alone); &what=<s>,<d> another place to come up;
// &whbase= &whlimb= &whunder= the light on its skin under water (W.sheath); &whnear= what is left of the smear beside the boat;
// &whaway=1 the module as built and the whale never sent (the fair "without" for measuring: &skip=cast_whale brings the three
// prototypes of heroes.js back); &whlift=0 the boat is not lifted; &whlit=<k> how much more of the water it lights behind the front;
// &whmeet=<s> where the boat is as its snout crosses the line; &whkeep=0 the 14 m rule off; &whoff=0 nothing eases a boat off it;
// &whsheen=<k> the sky on its wet back (0: one black shape); &whrow=<m/s> a rider who points the bow at the top of its roll and
// paddles at that speed from the moment it is put on its line (the worst case for "never nearer than").
import * as THREE from 'three';
import { makeSwimmer } from '../../engine/life/swimmers.js';
import { WATER_GLSL, waterUniforms } from '../../engine/water-final.js';
import { FOG_PARS } from '../../engine/kit.js';
import { removeStandIn } from '../../engine/modules.js';

const num0 = (key, d) => { const q = new URLSearchParams(typeof location !== 'undefined' ? location.search : ''); return q.has(key) && !Number.isNaN(+q.get(key)) ? +q.get(key) : d; };      // (&whmeet=: for looking)
const W = {
  // ---- colour: green-gold is the whale's and nothing else's (the page's chip 8). Its light ages inside its own
  // family: new, a paler core for the few hottest marks, then deeper and greener as a mark goes out. Never aqua
  color: '#B4E86A', hot: '#E2F6A6', old: '#6FA840', dying: '#2F5C32',
  // ---- the body: the family's paint brought down to the sea's basalt, in the sea's own rock light (shared.sea.extend):
  // rest: how much of its colour it keeps unlit; pale: how readily wet skin gives back the sky's slate and the lit sea
  // lit: what the lit sea gives a wet skin that stands in it (its colour; a glow at its foot that dies within `foot` metres; an edge of light
  // round what stands higher, dying over `high` metres): black against the fire, rimmed with light, darkest at its top
  tint: '#5a5478', rock: { rest: 0.34, top: 1, run: 0.2, pale: 0.06 }, lit: { color: '#35C4BE', foot: [0.07, 0.8], edge: [0.42, 3.6] },
  sheen: 0.4,                         // how much of the sky's slate wet skin gives back where it looks up (0: one black shape; at 1.5 the top of a back is as pale as the sky behind it)
  // ---- the light on its skin (the sheath): how bright on skin under the water (it is seen through six metres of it or
  // not at all), how bright the broken line where a back meets the water, m/s the marks slide aft, the share of them lit
  // base: how much of plain skin under the water is lit before the model's mask (snout, leading edges) and the grooves add theirs; limb: what
  // skin seen edge-on adds (the sheath is looked along there: its marks crowd, and the body's form is drawn by where they are)
  // (stage 5, the critique: under 1.9 -> 2.55, base 0.72 -> 0.85, limb 0.26 -> 0.75. As it passed beneath, a rider left to the current saw a thin
  // line of flecks and patches either side of the bow: no animal, no width, no weight. With these the whole breadth of the body is drawn in its
  // marks (still broken, dark between) and its flipper and flukes read at a glance: .shots/sea_crit_beneath_right.png against sea_crit_beneath_after.png)
  sheath: { under: 2.55, line: 1.7, stream: 1.1, share: 1.0, base: 0.85, limb: 0.75 }, under: 0.65,      // under: under the water its body is this much of the deep's own colour (a shade darker than the water: a shape, not a hole)
  // ---- the light on the water (the patch). gain: all of it (the page's "whale's sheath 2.5" on the scale the area was
  // built to, where the wake's flecks stand at 1.1); range: metres down from which a body lights the water over it;
  // wide: half width of the smear against the body's own; after: seconds the water stays lit behind it; fade: seconds
  // it takes to come (nothing of it appears in less than four)
  // near: beside the boat the body itself is seen through the water, so its light on the surface gives way: [what is left of it, within this many metres of the eye, all of it from this many]
  // cap: the brightest any mark of it may be (its strongest channel; above 1 it blooms)
  // lit: how much more of the water it lights behind the rain front (gain times 1 + lit there)
  light: { gain: 1.0, bright: 1.5, range: 14, wide: 1.5, after: 2.6, fade: 4, size: 80, near: [0.5, 4.5, 12.5], cap: 1.7, lit: 0.5 },
  print: { life: 18, open: 4.5, ring: 0.62, heart: 0.1, turn: 0.07 },            // a flukeprint: a ragged ring that opens, turns slowly and thins away
  // the footprint: the same, 22 m across, with flecks turning inside it; slick: how far the sea's own light is quieted inside it;
  // wave: the one long ring that leaves it: metres out at the start, m/s, how strong its light
  foot: { life: 20, open: 5.5, ring: 0.75, heart: 0.34, turn: 0.085, slick: 0.55, wave: [9, 9, 0.4] },
  // ---- moment 7. from / to: the page's line (s, d); depth: of its spine at the two ends of its rise; sinkAt: the d
  // beyond which it sinks; cross: seconds from its start to its snout crossing the centre line (46 m at 2.5 m/s);
  // meet: the s a rider left to the current has reached by then; wait: the longest it waits for a slow boat after the
  // cue (the page: never more than 12 s); least: the shortest run-in it is given for a fast one
  // out: seconds its light takes to go out once its snout is `past` metres beyond sinkAt (the page: "30 s in all"; and the one whale is wanted again
  // ahead of the boat eight seconds into the show: left to sink at its own pace its tail was still lit then, and it was cut off in sight);
  // under: metres the whole animal settles deeper as it goes; cut: the same when the surfacing cannot wait (never a disappearance in less than four)
  beneath: { from: [132, 46], to: [144, -40], depth: [11, 7], speed: 2.5, sinkAt: -20, sink: 23, on: 45, cross: 18.6, meet: num0('whmeet', 126), settle: 2.5, wait: 12, least: 9, swell: 0.2, past: 6, out: 7, under: 12, cut: 4.5 },
  // ---- moment 9. from -> at: the page's heading; at: where the TOP of its roll is (the family's wheel turns in one
  // place: the blow 5 m short of it, the flukes over the same water; the page's two points 17 m apart cannot both be
  // kept, and the flukes' place, 37 to 41 m from a rider left to the current, is the one that makes the picture).
  // blowT: the show clock at the blow; lead: seconds before it that it is put on its line; show: metres the back stands
  // out at the top of the roll; keep / aside: the page's rule (within 26 m: the whole line 14 m further left);
  // ride: how much of the swell at its place the animal rides once it has blown (a cork rides all of it, a whale little)
  // kindle: seconds before the blow that its light begins to come (over light.fade seconds)
  // off: while it is at the surface the water round the place leans a boat back that is paddled at it (the area's own way with its edges: shallows that
  // ease the boat out): [metres round the top of its roll, how hard]. A rider left to the current is never within 33 m and feels nothing; one who
  // paddles flat out at it is held about 23 m off. Without it the hull could be rowed through its back in the fifteen seconds it is up
  // calmWait: seconds later that it comes with reduced motion (the front is that much slower there: 150 m at 7.5 m/s and not at 12.5)
  surface: { from: [187, -13], at: [198, -26], blowT: 16.5, lead: 8, least: 6, late: 22, calmWait: 8, show: 1.0, keep: 26, aside: 14, ride: 0.35, kindle: 5, off: [30, 6] },
  // ---- the blow: metres tall, seconds it hangs, m/s it drifts to the right (the way the front travels), its colours
  // from foot to top, how bright under the lit sea and at rest
  // (top: the page's violet, lifted: mist that is darker than the sky behind it cannot be seen, and the sky here is itself violet)
  // mid: the body of the column: the sea's aqua paled toward the core (at the chip's full aqua the column was a band of neon between a white foot and a violet top)
  // mist: how much of a part of the breath is soft mist (the rest of it is the sea's dabs); dense: how close those dabs stand (1: one mass at the foot);
  // dab: the dabs' size (repeats of the sea's mask to a metre: at 0.15, the water's own size, the painter's filter washed them into one soft plume from forty metres);
  // drops: the thrown water (drops that rise with the jet, hang and fall back as sparks; fewer at low quality); spent: the colour of a spark as it falls back
  blow: { height: 9, life: 6.5, wind: 1.0, foot: '#D2FBF2', mid: '#86EBDF', top: '#6E62EE', spent: '#0E5E6E', lit: 0.95, rest: 0.1, opacity: 0.82, size: 1, puffs: 88, mist: 0.15, dense: 0.8, dab: 0.07, drops: 120 },
  pour: { color: '#D2FBF2', glow: '#A8F4E8', glowStrength: 1.25, size: 0.06, opacity: 0.7 },      // the family's: "curtains of light pour from the trailing edge"
  // ---- the curtains (this module's: fine threads from whichever edge of the flukes is lowest). pool: threads alive at once (fewer at low quality);
  // rate: threads let go a second [at the last, more at the first, seconds over which that falls away]; size: half a thread's width (m); streak: seconds of its
  // fall a thread is as long as; hot / body: its colour as it tears off and as it falls; rest: how lit where the sea is dark; ring: one thread in so many rings the water
  curtain: { pool: 640, rate: [36, 300, 1.4], size: 0.02, streak: 0.12, gain: 1.0, hot: '#D2FBF2', body: '#58E4D6', rest: 0.2, ring: 5, least: 0.2 },
  // ---- what it writes into the water's trace, as ages (0.6 is new light, the hull's own; under 0.42 violet)
  trace: { back: 0.52, flukes: 0.56, rising: 0.46, backRadius: 0.5, flukeRadius: 0.55, every: 0.6 },
  waker: 5.5,                         // metres round its head within which a jelly is woken (the page: 5 m of the hull, a dolphin or the whale)
  deep: [0.3, 0.75, 0.35],            // the layer 'deep' for moment 7: at rest, as it passes, and where it is left
};

const clamp = (x, a, b) => Math.min(b, Math.max(a, x)), clamp01 = (x) => Math.min(1, Math.max(0, x));
const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };

// ------------------------------------------------------------------------------------------------ GLSL: the sea's marks, in green-gold
// The same arithmetic as the sheet's (light.js, SEA_INK): a mark read from the area's pictures has a cover, a threshold
// of its own and a phase of its own; marks come and go one by one as the light under them rises and falls; a mark near
// its threshold is an old mark. Only the colours differ: the whale's.
const MARKS_GLSL = /* glsl */`
  uniform vec3 uWhYoung, uWhHot, uWhOld, uWhDying;
  vec3 whMark(sampler2D t, vec2 uv) { vec4 m = texture2D(t, uv); float c = max(m.g, 0.004); return vec3(m.g, m.r / c, m.b / c); }
  float whLit(vec3 m, float cut) { return m.x * smoothstep(cut, cut + 0.14, m.y); }
  vec3 whAged(float a) {
    vec3 c = mix(uWhDying * 1.3, uWhOld * 1.25, smoothstep(0.06, 0.3, a));
    c = mix(c, uWhYoung, smoothstep(0.36, 0.66, a));
    return mix(c, uWhHot * 1.15, smoothstep(0.9, 1.0, a));
  }
  vec3 whInk(vec3 m, float cut, float a) { float mg = m.y - cut; return whAged(a * (0.1 + 0.9 * smoothstep(0.02, 0.38, mg))) * (m.x * smoothstep(0.0, 0.14, mg)); }
`;

// ------------------------------------------------------------------------------------------------ the light on the water
// One patch of the water's own grid (cells of the water's own size, corners on the water's own corners, lifted by the
// water's own swell and the well round the hull: the lines are the sheet's, light.js, which are the water's), laid
// where the whale and its prints are. It draws how lit the water is by the body under it (worked out at its corners
// from the family's spine stations, and from where the tail has been: the water stays lit a moment), the prints and
// the footprint (rings that open, turn and thin away), and the rim where a back stands out of the water; all of it
// broken by the sea's own marks, near the eye as marks, far off as level dashes that come and go.
const NB = 32, NP = 6;
function makeWaterLight(ctx, shared, plan) {
  const { engine } = ctx, sh = engine.shared, sea = shared.sea;
  const level = (engine.quality && engine.quality.level) || 'high';
  const cell = { high: 1, medium: 1.5, low: 2 }[level] || 1, n = Math.round(W.light.size / cell / 2) * 2, half = n * cell / 2;
  const pos = new Float32Array((n + 1) * (n + 1) * 3), idx = new Uint32Array(n * n * 6);
  for (let j = 0; j <= n; j++) for (let i = 0; i <= n; i++) { const o = (j * (n + 1) + i) * 3; pos[o] = (i - n / 2) * cell; pos[o + 1] = 0; pos[o + 2] = (j - n / 2) * cell; }
  let k = 0;
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const a = j * (n + 1) + i, b = a + 1, c = a + n + 1, e = c + 1; idx[k++] = a; idx[k++] = c; idx[k++] = b; idx[k++] = b; idx[k++] = c; idx[k++] = e; }      // (the water's own split of a cell)
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setIndex(new THREE.BufferAttribute(idx, 1));
  const WU = (engine.water && engine.water.material && engine.water.material.uniforms) || {};
  const own = { uSwellOn: { value: new THREE.Vector4(1, 120, 260, 0) }, uWell: { value: new THREE.Vector4(0, 0, 0, -1) }, uWellB: { value: new THREE.Vector4() } };
  const shares = !!(WU.uSwellOn && WU.uWell && WU.uWellB);
  const fl = (plan.seaLight && plan.seaLight.fleck) || [0.37, 0.16, 0.047, 0.75];
  const fleck = sea.fleck, stip = (sea.uniforms.tSeaStip && sea.uniforms.tSeaStip.value) || sea.fleck;
  const col = (c) => new THREE.Color(c);
  const uni = {
    ...waterUniforms(engine),
    uSwellOn: shares ? WU.uSwellOn : own.uSwellOn, uWell: shares ? WU.uWell : own.uWell, uWellB: shares ? WU.uWellB : own.uWellB,
    uBody: { value: Array.from({ length: NB }, () => new THREE.Vector4()) }, uBodyB: { value: Array.from({ length: NB }, () => new THREE.Vector4()) }, uBodyN: { value: 0 },
    uPrint: { value: Array.from({ length: NP }, () => new THREE.Vector4()) }, uPrintB: { value: Array.from({ length: NP }, () => new THREE.Vector4()) }, uPrintN: { value: 0 },
    uPatch: { value: new THREE.Vector4(0, 0, half, 5 * cell) },
    uHull: { value: new THREE.Vector4(0, 0, 1, 0) },
    uGain: { value: new THREE.Vector4(1, 1, 0, 0) },        // x: how lit (the field), y: how bright (the marks), z: the sea's own light here (L), w: how much a slick quiets the sea's light
    uRing: { value: new THREE.Vector4(0, 0, 0, 0) },        // the one long ring that leaves the footprint: x, z, how far out it has run (m), how strong
    uSlick: { value: new THREE.Color('#04121c') },
    uNear: { value: new THREE.Vector4(W.light.near[0], W.light.near[1], W.light.near[2], 0) },
    uFleck: { value: new THREE.Vector4(fl[0], fl[1], fl[2], fl[3] ?? 0.75) }, uPix: { value: 0.0012 },
    tWhFleck: { value: fleck }, tWhStip: { value: stip },
    uWhYoung: { value: col(W.color) }, uWhHot: { value: col(W.hot) }, uWhOld: { value: col(W.old) }, uWhDying: { value: col(W.dying) },
    uWhTime: sh.uTime, uFogColor: sh.uFogColor, uFogDensity: sh.uFogDensity, uVeil: sh.uVeil, uVeilColor: sh.uVeilColor,
  };
  const VERT = /* glsl */`${WATER_GLSL} ${FOG_PARS}
    #define NB ${NB}
    uniform vec4 uSwellOn, uWell, uWellB, uPatch;
    uniform vec4 uBody[NB], uBodyB[NB]; uniform int uBodyN;
    varying vec3 vWorld; varying vec3 vField; varying float vFogDist;
    void main() {
      vec4 world = modelMatrix * vec4(position, 1.0);
      if (uSwellOn.x > 0.5) {                            // exactly what the water's own sheet does (water-final.js, VERT)
        float h = waterSwell(world.xz) * (1.0 - smoothstep(uSwellOn.y, uSwellOn.z, distance(world.xz, cameraPosition.xz)));
        vec2 q = world.xz - uWell.xy;
        float ahead = dot(q, uWell.zw), side = dot(q, vec2(-uWell.w, uWell.z));
        float d = length(vec2(side, ahead - clamp(ahead, -1.7, 2.0)));
        world.y += mix(h, uWellB.x + ahead * uWellB.y + side * uWellB.z, 1.0 - smoothstep(0.9, 3.4, d));
      }
      // how lit the water is here by the body under it (x), and how near the line where a back stands out of it (y)
      vec2 p = world.xz; float e = 0.0, rim = 0.0;
      for (int i = 0; i < NB - 1; i++) {
        if (i >= uBodyN - 1) break;
        vec2 a = uBody[i].xy, ab = uBody[i + 1].xy - a;
        float t = clamp(dot(p - a, ab) / max(dot(ab, ab), 1e-4), 0.0, 1.0), d = distance(p, a + ab * t);
        float w = mix(uBody[i].z, uBody[i + 1].z, t), lit = mix(uBody[i].w, uBody[i + 1].w, t);
        e = max(e, lit * (1.0 - smoothstep(0.25 * w, w, d)));
        float wl = mix(uBodyB[i].x, uBodyB[i + 1].x, t);
        rim = max(rim, step(0.02, min(uBodyB[i].x, uBodyB[i + 1].x)) * (1.0 - smoothstep(0.15, 1.5, abs(d - wl))));
      }
      vec2 q2 = abs(p - uPatch.xy);
      vField = vec3(e, rim, 1.0 - smoothstep(uPatch.z - uPatch.w, uPatch.z - 0.5, max(q2.x, q2.y)));
      vWorld = world.xyz;
      vec4 mv = viewMatrix * world; vFogDist = fogDistance(mv);
      gl_Position = projectionMatrix * mv;
    }`;
  const FRAG = /* glsl */`${WATER_GLSL} ${FOG_PARS} ${MARKS_GLSL}
    #define NP ${NP}
    uniform sampler2D tWhFleck, tWhStip;
    uniform vec4 uPrint[NP], uPrintB[NP], uHull, uGain, uFleck, uRing, uNear; uniform vec3 uSlick; uniform int uPrintN; uniform float uWhTime, uPix;
    varying vec3 vWorld; varying vec3 vField; varying float vFogDist;
    float whHash(vec2 p) { p = fract(p * vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.y); }
    vec3 whHash3(vec2 p) { vec3 q = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973)); q += dot(q, q.yxz + 33.33); return fract((q.xxy + q.yzz) * q.zyx); }
    float whNoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(whHash(i), whHash(i + vec2(1.0, 0.0)), f.x), mix(whHash(i + vec2(0.0, 1.0)), whHash(i + vec2(1.0, 1.0)), f.x), f.y); }
    // Light on water too far off to tell marks apart, as the eye has it from low down: short level dashes that come and
    // go, laid out by the direction they are seen in (the sheet's own way, light.js seaGlints). x: light, y: how hot
    vec2 whGlints(vec2 ang, vec2 cell, float dens, float seed, float time) {
      vec2 g = ang / cell, id = floor(g), f = g - id;
      vec3 h = whHash3(id + seed);
      float cyc = time * (0.45 + 0.8 * h.z) + h.x * 9.0, n = floor(cyc), ph = cyc - n;
      vec3 k = whHash3(id + seed + n * 7.13 + 3.0);
      if (k.z > dens) return vec2(0.0);
      vec2 dq = (f - vec2(0.22 + 0.56 * k.x, 0.28 + 0.44 * k.y)) * cell;
      float halfLen = cell.x * (0.12 + 0.28 * h.y), th = cell.y * (0.18 + 0.16 * k.x), thPx = max(th, 0.55 * uPix);
      float r = length(vec2(dq.x / halfLen, dq.y / thPx));
      float life = sin(3.14159 * ph);
      return vec2((1.0 - smoothstep(0.55, 1.0, r)) * life * life * min(1.0, th / thPx), fract(k.z * 53.7 + h.y));
    }
    bool whInHull(vec2 w) { vec2 q = w - uHull.xy; q = vec2(q.x * uHull.z - q.y * uHull.w, q.x * uHull.w + q.y * uHull.z) / vec2(1.0, 2.5); return dot(q, q) < 1.0; }
    void main() {
      vec2 p = vWorld.xz;
      if (whInHull(p)) discard;                                             // never inside the rider's own boat
      // beside the boat the animal itself is seen through the water, drawn in the light on its own skin: there its light on the
      // surface over it gives way (to uNear.x of itself), or the rider would look at a sheet of marks with the whale hidden under it
      float nearK = smoothstep(uNear.y, uNear.z, distance(p, cameraPosition.xz)), nearE = vField.x * mix(uNear.x, 1.0, nearK);
      // (the rim round a back that stands out of the water is broken along its length: stretches of marks a few metres long with dark water between,
      // which pass slowly aft. Whole, it was a line of light drawn round the animal: an outline, which this sea forbids: sea_wh3_b02_crop.png)
      float rimK = 0.22 + 0.78 * smoothstep(0.4, 0.62, whNoise(p * 0.5 + vec2(uWhTime * 0.31, uWhTime * -0.17)));
      float E = nearE, slick = 0.0;
      // the prints: a ragged ring of light where the upwelling meets the sea, opening, then thinning away; knots of it
      // travel slowly round (each mark lies still on the water: they kindle and go out in turn, and the light turns)
      for (int i = 0; i < NP; i++) {
        if (i >= uPrintN) break;
        vec4 P = uPrint[i], Q = uPrintB[i];                                   // x, z, radius now, age 0..1;  ring, heart, turn (radians), seed
        vec2 d = p - P.xy; float l = length(d) / max(P.z, 0.1);
        if (l > 1.3) continue;
        float cz = cos(Q.z), sz = sin(Q.z), inv = 1.0 / max(P.z, 0.1);
        vec2 dr = vec2(d.x * cz - d.y * sz, d.x * sz + d.y * cz) * inv;         // the print's own frame, which turns slowly
        l += (whNoise(p * 0.35 + Q.w) - 0.5) * 0.3;
        float knots = 0.4 + 0.6 * smoothstep(0.3, 0.7, whNoise(dr * 2.2 + Q.w));
        float ring = smoothstep(0.42, 0.86, l) * (1.0 - smoothstep(0.9, 1.1, l));
        float heart = (1.0 - smoothstep(0.1, 0.8, l)) * smoothstep(0.35, 0.75, whNoise(dr * 4.0 + Q.w * 1.7));
        float lifeK = smoothstep(0.0, 0.05, P.w) * pow(1.0 - P.w, 1.6);
        E = max(E, clamp((ring * Q.x * knots + heart * Q.y) * lifeK, 0.0, 1.0));
        slick = max(slick, (1.0 - smoothstep(0.55, 0.98, l)) * smoothstep(0.0, 0.1, P.w) * (1.0 - smoothstep(0.55, 1.0, P.w)) * min(1.0, Q.y * 3.0 + 0.3));
      }
      #ifdef WH_SLICK
        // a slick of smooth water where it went down: inside it the sea's own light is quieted, and nothing else is drawn here
        float sa = slick * uGain.w * vField.z * (1.0 - uVeil);
        if (sa < 0.004) discard;
        gl_FragColor = vec4(mix(uSlick, uFogColor, fogAmount(vFogDist)), sa);
        return;
      #endif
      if (uRing.w > 0.001) {                                                // the one long ring: a band of the same light running out over the sea
        float rr = (distance(p, uRing.xy) - uRing.z) / 2.6;
        E = max(E, uRing.w * exp(-rr * rr) * (0.45 + 0.55 * whNoise(p * 0.21 + 3.0)));
      }
      // (and there it is fine sparks only: at half light the sheet's large dabs are the last to go, and lay round the body like lily pads)
      float padK = mix(1.0, nearK, clamp(nearE / max(E, 0.001), 0.0, 1.0));
      // (behind the rain front more of its marks are lit, uNear.w: none may be brighter than the sheet's own, so in a sea of aqua its green-gold
      // is told by how much of it there is. The rim round a back takes none of that: it keeps its dark stretches)
      E = max(min(E * vField.z * uGain.x * uNear.w, 1.0), 0.9 * vField.y * rimK * vField.z * min(uGain.x, 1.0));
      if (E < 0.004) discard;
      vec2 fa = dFdx(p), fb = dFdy(p);                                       // metres of water under this pixel, across and up the screen
      float px = max(length(fa), length(fb));
      float far = smoothstep(0.05, 0.26, px);                                // where single marks can no longer be told apart
      vec2 flow = waterRipple(p).xy * 0.2;
      vec3 m1 = whMark(tWhFleck, p * uFleck.x + flow), m2 = whMark(tWhFleck, p.yx * uFleck.y + 0.37);
      vec3 st = whMark(tWhStip, p * uFleck.w + flow), st2 = whMark(tWhStip, p.yx * uFleck.w * 0.37 + 0.5);
      float tw = 0.6 + 0.4 * sin(uWhTime * (1.3 + 3.2 * st.z) + st.z * 47.0), tw2 = 0.7 + 0.3 * sin(uWhTime * (0.9 + 2.0 * st2.z) + st2.z * 31.0);
      float softB = texture2D(tWhFleck, p * uFleck.z + 0.71, 4.0).g + 0.5 * texture2D(tWhFleck, p.yx * uFleck.y + 0.37, 4.5).g;      // (read small: only the soft sum of the marks is left)
      float aE = 0.12 + 0.88 * E;                                            // strong light is young light
      float dab1 = whLit(m1, 1.06 - E * 0.85) * padK, dab2 = whLit(m2, 1.14 - E * 0.8) * padK;
      softB *= padK;
      float dens = clamp(E * (0.62 + 0.9 * dab1 + 0.7 * dab2 + 0.45 * softB), 0.0, 1.0);      // the glitter is denser in the dabs, a little denser in large soft patches (a smear is one field: with the sheet's own weights it was a patchwork of pads)
      vec3 gl = whInk(st, 1.03 - 0.95 * dens, aE) * tw + 0.8 * whInk(st2, 1.08 - 0.92 * dens, aE) * tw2;
      vec3 nearC = gl * (0.75 + 1.4 * E) + (whInk(m1, 1.06 - E * 0.85, aE) * 0.3 + whInk(m2, 1.14 - E * 0.8, aE) * 0.2) * padK + whAged(clamp(aE * 0.6, 0.0, 0.4)) * (softB * E * 0.1);
      // too far to tell marks apart: level dashes that come and go, more of them where the light is stronger
      vec2 qv = p - cameraPosition.xz; float dH = max(length(qv), 0.5);
      vec2 ang = vec2(atan(qv.x, -qv.y), (cameraPosition.y - vWorld.y) / dH);
      float dn = clamp(E * (0.55 + 1.1 * softB) * 1.8, 0.0, 0.92);
      vec2 g1 = whGlints(ang, vec2(0.024, 0.005), dn, 23.0, uWhTime), g2 = whGlints(ang + vec2(0.41, 0.0019), vec2(0.015, 0.0033), dn, 29.0, uWhTime * 1.2);
      vec2 g3 = whGlints(ang + vec2(0.71, 0.0013), vec2(0.011, 0.0027), dn, 37.0, uWhTime * 1.31), g4 = whGlints(ang + vec2(1.13, 0.0007), vec2(0.0075, 0.002), dn * 0.9, 41.0, uWhTime * 1.5);      // (and finer ones between them: a print forty metres off is a sliver seventeen pixels deep, and must hold more than a dozen dashes)
      vec3 farC = whAged(clamp(aE + 0.25 * (g1.y - 0.6), 0.03, 0.97)) * (g1.x * 2.1) + whAged(clamp(aE - 0.05, 0.02, 0.97)) * (g2.x * 2.0)
                + whAged(clamp(aE + 0.2 * (g3.y - 0.5), 0.03, 0.97)) * (g3.x * 1.9) + whAged(clamp(aE - 0.12, 0.02, 0.97)) * (g4.x * 1.8) + whAged(aE) * (E * 0.06 * softB);
      // light rides the backs of the swell, as the sheet's does
      float amp = uSwell[0].w + uSwell[1].w + uSwell[2].w + 1e-4, fold = 0.8 + 0.3 * clamp(waterSwell(p) / amp, -1.0, 1.0);
      vec3 c = mix(nearC, farC, far) * (fold * uGain.y);
      // No mark of it is brighter than the sheet's own beside it (the director: its light must agree with the sheet's flecks in size, colour and age:
      // the sheet's dashes stand at 1.7 to 2.2 times their colour, these stood at 4 until the cap), and the cap keeps its hue. (Capped channel by
      // channel at 3, the bloom took the brightest dashes at a back's waterline for lamps; at 1.45 the lamps were white: sea_wh3_b07_crop.png, _b09_crop.png)
      c *= min(1.0, ${W.light.cap.toFixed(2)} / max(max(c.r, c.g), max(c.b, 1e-4)));
      c *= (1.0 - fogAmount(vFogDist)) * (1.0 - uVeil);
      gl_FragColor = vec4(c, 1.0);
    }`;
  const mat = new THREE.ShaderMaterial({ uniforms: uni, vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = 'whale-waterlight'; mesh.frustumCulled = false; mesh.renderOrder = 0.6; mesh.visible = false;      // after the water (-1) and the sea's own sheet (0)
  const size2 = new THREE.Vector2();
  mesh.onBeforeRender = (renderer, scene, camera) => {
    const rt = renderer.getRenderTarget(), hgt = rt ? rt.height : renderer.getDrawingBufferSize(size2).y, pix = 2 / (camera.projectionMatrix.elements[5] * Math.max(1, hgt));
    if (uni.uPix.value !== pix) { uni.uPix.value = pix; mat.uniformsNeedUpdate = true; }
  };
  ctx.add(mesh); ctx.only(mesh, 'direct');                                   // it lies on the water: the mirror has no use for it
  // the slick: the same patch drawn once more, before the light, as a veil of the water's own dark over the sea's light inside a print
  const slickMat = new THREE.ShaderMaterial({ uniforms: uni, vertexShader: VERT, fragmentShader: FRAG, defines: { WH_SLICK: '' }, transparent: true, depthWrite: false, fog: false });
  const slick = new THREE.Mesh(geo, slickMat);
  slick.name = 'whale-slick'; slick.frustumCulled = false; slick.renderOrder = 0.5; slick.visible = false; slick.matrixAutoUpdate = false;
  ctx.add(slick); ctx.only(slick, 'direct');
  return {
    mesh, slick, uniforms: uni, cell, half,
    /** Lay the patch with its middle at (x, z), on the water's own corners. */
    place(x, z) { mesh.position.set(Math.round(x / cell) * cell, 0, Math.round(z / cell) * cell); mesh.updateMatrixWorld(); slick.matrix.copy(mesh.matrix); slick.matrixWorld.copy(mesh.matrixWorld); uni.uPatch.value.x = mesh.position.x; uni.uPatch.value.y = mesh.position.z; },
  };
}

// ------------------------------------------------------------------------------------------------ the blow
// A whale's breath as the family moves it (swimmers.js, makeBlow: a jet that stands in under a second as one tall
// column, densest at its foot, then hangs, leans downwind and thins from the bottom up while its spray falls back),
// drawn in this sea's hand. Mist is lit by what is under it, and here that is the burning sea: core-white at its
// foot, a pale aqua above, violet where it thins away at the top; next to nothing where the sea is dark. And it is
// BROKEN, as every light here is (the page: flecks, dabs, dashes, never a gradient, no tube of light): the column is a
// crowd of the sea's own dabs, leaning upward, crowding into one mass at its foot and standing apart higher up, over
// no more than a breath of soft mist; and the heavy part of the breath is thrown water: drops that rise with the
// jet, hang, and fall back into the sea as sparks. (Drawn as eighty-eight soft discs it was an airbrushed flame in
// three colours: sea_wh3_f02_crop.png.) Two draw calls while a breath hangs; nothing moves on the CPU.
function makeBlow(ctx, shared) {
  const S = ctx.engine.shared, B = W.blow, PUFFS = B.puffs, DROPS = Math.max(24, ctx.kit.count(B.drops));
  const quad = (pool) => {
    const geo = new THREE.InstancedBufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0]), 3));
    geo.setIndex([0, 1, 2, 0, 2, 3]);
    const origin = new Float32Array(pool * 4).fill(-1e6), seed = new Float32Array(pool * 4), drift = new Float32Array(pool * 3);
    const aO = new THREE.InstancedBufferAttribute(origin, 4), aS = new THREE.InstancedBufferAttribute(seed, 4), aD = new THREE.InstancedBufferAttribute(drift, 3);
    geo.setAttribute('aOrigin', aO); geo.setAttribute('aSeed', aS); geo.setAttribute('aDrift', aD);
    geo.instanceCount = pool;
    return { geo, origin, seed, drift, touch() { aO.needsUpdate = aS.needsUpdate = aD.needsUpdate = true; }, pool };
  };
  const P = quad(PUFFS * 2), D = quad(DROPS * 2);
  const uLight = { value: 0 }, col = (c) => new THREE.Color(c);
  const common = { uTime: S.uTime, uFogColor: S.uFogColor, uFogDensity: S.uFogDensity, uVeil: S.uVeil, uVeilColor: S.uVeilColor,
    uFoot: { value: col(B.foot) }, uMid: { value: col(B.mid) }, uTop: { value: col(B.top) }, uLight, uHeight: { value: B.height } };
  // ---- the mist and its dabs
  const mistMat = new THREE.ShaderMaterial({
    uniforms: { ...common, uSize: { value: B.size }, uOpacity: { value: B.opacity }, uLife: { value: B.life }, uMist: { value: new THREE.Vector3(B.mist, B.dense, B.dab) }, tBlFleck: { value: shared.sea.fleck } },
    transparent: true, depthWrite: false,
    vertexShader: /* glsl */`
      ${FOG_PARS}
      attribute vec4 aOrigin, aSeed; attribute vec3 aDrift;
      uniform float uTime, uHeight, uSize, uLife;
      varying vec2 vQ, vSizeM, vSeed; varying float vAlpha, vDist, vUp, vDens;
      void main() {
        float age = uTime - aOrigin.w, hf = aSeed.x;                      // hf: how far up the column this part of the breath gets, 0..1
        vQ = position.xy; vSeed = aSeed.yz; vSizeM = vec2(1.0); vDens = 0.0;
        float life = uLife * mix(0.42, 1.0, hf * hf);                    // the spray at the foot is gone in two seconds; the mist at the top hangs
        if (age < 0.0 || age > life) { gl_Position = vec4(0.0, 0.0, -2.0, 1.0); vAlpha = 0.0; vDist = 0.0; vUp = 0.0; return; }
        float jet = 1.0 - exp(-age / (0.16 + 0.2 * hf));                 // it stands up at once
        float sag = (0.55 - 0.42 * hf) * pow(max(age - 0.7, 0.0), 1.7) + 0.05 * max(age - 1.2, 0.0);    // then it falls: the low, heavy part soonest
        float y = max(uHeight * hf * jet - sag, 0.05);
        float wide = (0.04 + 0.16 * hf + 0.2 * hf * age) * (0.5 + age * 0.5);
        vec3 p = aOrigin.xyz + vec3(0.0, y, 0.0) + aDrift * (age * (0.3 + 0.7 * hf)) + vec3(aSeed.y - 0.5, 0.0, aSeed.z - 0.5) * wide;
        float size = uSize * (0.9 + 0.45 * aSeed.w) * (0.62 + 0.8 * hf) * (1.0 + 1.7 * smoothstep(0.0, 4.0, age));
        vec4 mv = viewMatrix * modelMatrix * vec4(p, 1.0);
        vSizeM = size * vec2(1.0, mix(2.1, 1.4, smoothstep(0.3, 2.5, age)));                                 // (drawn out upward while it is a jet)
        mv.xy += position.xy * vSizeM;
        vDist = length(mv.xyz); vUp = clamp(y / uHeight, 0.0, 1.0);
        vAlpha = smoothstep(0.0, 0.1, age) * (1.0 - smoothstep(life * 0.5, life, age)) * (0.74 + 0.26 * (1.0 - hf));
        // how close its dabs stand: one mass at the foot while the breath is new, apart higher up, the last of them single as it thins away
        vDens = clamp((1.12 - 0.62 * hf) * (1.0 - 0.5 * smoothstep(0.3 * life, life, age)), 0.0, 1.0);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      ${FOG_PARS}
      uniform sampler2D tBlFleck; uniform vec3 uFoot, uMid, uTop, uMist; uniform float uOpacity, uLight;
      varying vec2 vQ, vSizeM, vSeed; varying float vAlpha, vDist, vUp, vDens;
      vec3 blMark(sampler2D t, vec2 uv) { vec4 m = texture2D(t, uv); float c = max(m.g, 0.004); return vec3(m.g, m.r / c, m.b / c); }
      float blLit(vec3 m, float cut) { return m.x * smoothstep(cut, cut + 0.14, m.y); }
      void main() {
        float l = length(vQ) * 2.0;
        if (l >= 1.0) discard;
        float body = 1.0 - smoothstep(0.0, 1.0, l); body *= body;
        // the sea's dabs, laid along the column (they lean upward and ride up with the breath that carries them); each part of the breath has its own
        vec2 q = vQ * vSizeM;
        vec3 mA = blMark(tBlFleck, vec2(q.y, q.x) * uMist.z + vSeed * 7.0), mB = blMark(tBlFleck, vec2(q.y, -q.x) * (uMist.z * 1.9) + vSeed.yx * 5.0 + 0.4);
        float cut = 1.05 - uMist.y * vDens * (0.35 + 0.65 * body);
        float mk = max(blLit(mA, cut), 0.85 * blLit(mB, cut + 0.07));
        mk *= 1.0 - smoothstep(0.72, 1.0, l);
        // at its very foot the jet is one white core; above that it is thrown water, in dabs; at its top it is mist
        // (the dabs made to run into one mass at the foot, part by part of the breath, were a string of pale beans: sea_wh4_b04_crop.png)
        float mistK = mix(mix(0.5, uMist.x, smoothstep(0.02, 0.2, vUp)), 0.5, smoothstep(0.3, 0.85, vUp));
        float a = (mistK * body + (1.0 - mistK) * mk) * vAlpha * uOpacity;
        if (a < 0.004) discard;
        // lit from below by the sea: brightest and whitest at its foot, pale aqua above, violet where it thins away at the top
        vec3 col = mix(mix(uFoot, uMid, smoothstep(0.07, 0.3, vUp)), uTop, smoothstep(0.44, 0.84, vUp)) * (uLight * mix(1.0, 0.8, vUp));
        col *= 0.8 + 0.34 * mk * (0.55 + 0.9 * mA.z);                      // (a dab stands a little brighter than the mist it is in, and no two alike)
        gl_FragColor = vec4(applyFog(col, vDist) * (1.0 - uVeil), a);
      }`,
  });
  const mist = new THREE.Mesh(P.geo, mistMat);
  mist.name = 'whale-blow'; mist.frustumCulled = false; mist.renderOrder = 3;
  // ---- the thrown water: drops that rise with the jet, hang and fall back as sparks. Paint, not added light (the brighter of a drop and
  // what is behind it stands), and marked for the painter's filter to leave as drawn: the sea's own way with thrown water (light.js, spray)
  const uPix = { value: 0.0012 };
  const dropMat = new THREE.ShaderMaterial({
    uniforms: { ...common, ...waterUniforms(ctx.engine), uPix, uEmber: { value: col(B.spent) }, uDropK: { value: 1 } },
    transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide,      // (a drop is drawn out along its flight, whichever way that turns its square)
    blending: THREE.CustomBlending, blendEquation: THREE.MaxEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
    blendEquationAlpha: THREE.AddEquation, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneFactor,
    vertexShader: /* glsl */`
      ${WATER_GLSL} ${FOG_PARS}
      attribute vec4 aOrigin, aSeed; attribute vec3 aDrift;
      uniform float uTime, uHeight, uPix, uDropK;
      varying vec2 vE; varying float vA, vUp, vFall, vDist;
      void main() {
        float age = uTime - aOrigin.w, hf = aSeed.x;
        vE = vec2(position.x * 2.0, position.y * 2.0); vA = 0.0; vUp = 0.0; vFall = 0.0; vDist = 0.0;
        if (age < 0.0 || age > 8.0) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
        // carried up by the jet, it hangs a moment at the top of its throw and falls (slowly: spray, not stones)
        float tau = 0.16 + 0.2 * hf, H = uHeight * hf * (0.78 + 0.34 * aSeed.w);
        float hang = 0.3 + 0.9 * aSeed.y, g = 3.0 + 3.4 * aSeed.z, fall = max(age - hang, 0.0);
        float y = H * (1.0 - exp(-age / tau)) - 0.5 * g * fall * fall, vy = H / tau * exp(-age / tau) - g * fall;
        vec2 fling = (vec2(fract(aSeed.w * 7.13), fract(aSeed.y * 5.71)) - 0.5) * (1.0 + 2.0 * (1.0 - hf));      // the heavy low drops are thrown widest
        vec2 vh = aDrift.xz * (0.3 + 0.9 * hf) + fling;
        vec3 pos = aOrigin.xyz + vec3(vh.x * age, y, vh.y * age);
        float level = waterSwell(pos.xz);
        if (fall > 0.0 && pos.y < level + 0.03) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }               // it is in the sea again
        vec4 mv = viewMatrix * modelMatrix * vec4(pos, 1.0);
        vec3 vv = mat3(viewMatrix) * vec3(vh.x, vy, vh.y);
        vec2 d2 = normalize(vv.xy + vec2(1e-4, 0.0));
        float dist = length(mv.xyz), sz = (0.02 + 0.04 * aSeed.z * aSeed.z) * uDropK, wpx = max(sz, 1.5 * dist * uPix);     // never thinner than the screen can draw: fainter instead
        float len = wpx * (1.0 + min(length(vv.xy) * 0.2, 2.6));                                                  // drawn out along its flight
        mv.xy += d2 * (position.y * len * 2.0) + vec2(-d2.y, d2.x) * (position.x * wpx * 2.0);
        vDist = dist; vUp = clamp((pos.y - level) / uHeight, 0.0, 1.0); vFall = clamp(fall * 0.55, 0.0, 1.0);
        vA = smoothstep(0.0, 0.08, age) * min(1.0, 0.45 + 0.75 * sqrt(sz / wpx)) * (0.7 + 0.3 * aSeed.w);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      ${FOG_PARS}
      uniform vec3 uFoot, uMid, uTop, uEmber; uniform float uLight;
      varying vec2 vE; varying float vA, vUp, vFall, vDist;
      void main() {
        float shape = 1.0 - smoothstep(0.45, 1.0, length(vE));
        // lit by the sea under it: white-hot low in the jet, aqua higher, the violet of the cloud's underside at the top of its throw; a spent spark as it falls back
        vec3 c = mix(mix(uFoot * 1.1, uMid * 1.05, smoothstep(0.06, 0.3, vUp)), uTop * 1.05, smoothstep(0.5, 0.9, vUp));
        c = mix(c, mix(uMid, uEmber * 2.2, smoothstep(0.35, 1.0, vFall)), smoothstep(0.1, 0.6, vFall));
        float show = shape * vA * uLight * (1.0 - fogAmount(vDist)) * (1.0 - uVeil);
        gl_FragColor = vec4(c * show, -15.5 * step(0.25, shape * vA) * step(0.3, show));
      }`,
  });
  const drops = new THREE.Mesh(D.geo, dropMat);
  drops.name = 'whale-blow-drops'; drops.frustumCulled = false; drops.renderOrder = 3.1;
  const size2 = new THREE.Vector2();
  drops.onBeforeRender = (renderer, scene, camera) => {
    const rt = renderer.getRenderTarget(), hgt = rt ? rt.height : renderer.getDrawingBufferSize(size2).y, pix = 2 / (camera.projectionMatrix.elements[5] * Math.max(1, hgt));
    if (uPix.value !== pix) { uPix.value = pix; dropMat.uniformsNeedUpdate = true; }
  };
  const group = new THREE.Group();
  group.name = 'whale-breath'; group.add(mist); group.add(drops); group.visible = false;
  ctx.add(group); ctx.only(drops, 'direct');                                 // (the mist stands in the water's mirror; its drops are too small for it)
  const rnd = ctx.rng(77);
  let nextP = 0, nextD = 0;
  return {
    object: group, mist, drops, light: uLight, uniforms: mistMat.uniforms, dropUniforms: dropMat.uniforms,
    /** A blow from `pos` (a Vector3). The whale moves on while it breathes out (vel): the breath is left standing behind it and drifts with the wind ([x, z] m/s). */
    at(pos, vel, wind) {
      const now = S.uTime.value, out = 1.1;
      for (let i = 0; i < PUFFS; i++) {
        const j = (nextP + i) % P.pool, q = i / PUFFS, t = q * out, o = P.origin, s = P.seed, d = P.drift;
        o[j * 4] = pos.x + (vel ? vel.x * t * 0.45 : 0); o[j * 4 + 1] = pos.y - 0.25; o[j * 4 + 2] = pos.z + (vel ? vel.z * t * 0.45 : 0); o[j * 4 + 3] = now + t + rnd() * 0.05;      // (the jet is quick: most of the breath stands where it began; laid out along all the animal's way it had two feet from abeam)
        s[j * 4] = (0.08 + 0.92 * Math.pow(rnd(), 0.62)) * (1 - 0.5 * q * q);
        s[j * 4 + 1] = rnd(); s[j * 4 + 2] = rnd(); s[j * 4 + 3] = rnd();
        d[j * 3] = wind[0]; d[j * 3 + 1] = 0; d[j * 3 + 2] = wind[1];
      }
      nextP = (nextP + PUFFS) % P.pool; P.touch();
      for (let i = 0; i < DROPS; i++) {
        const j = (nextD + i) % D.pool, q = i / DROPS, t = q * 0.95, o = D.origin, s = D.seed, d = D.drift;
        o[j * 4] = pos.x + (vel ? vel.x * t * 0.45 : 0); o[j * 4 + 1] = pos.y - 0.15; o[j * 4 + 2] = pos.z + (vel ? vel.z * t * 0.45 : 0); o[j * 4 + 3] = now + t + rnd() * 0.08;
        s[j * 4] = (0.1 + 0.9 * Math.pow(rnd(), 0.85)) * (1 - 0.45 * q * q);      // (more of them low: what is thrown highest is mist)
        s[j * 4 + 1] = rnd(); s[j * 4 + 2] = rnd(); s[j * 4 + 3] = rnd();
        d[j * 3] = wind[0]; d[j * 3 + 1] = 0; d[j * 3 + 2] = wind[1];
      }
      nextD = (nextD + DROPS) % D.pool; D.touch();
    },
  };
}

// ------------------------------------------------------------------------------------------------ the curtains
// "Curtains of light pour from the trailing edge" (the page; the key painting). The family's `pour` gives thirty
// runnels of single strands off the hind edge; a curtain is many fine threads close together, and it hangs from
// whichever edge of the flukes is LOWEST: the hind edge while they come out of the water trailing, the two leading
// edges (the lower outline of the butterfly, as the key painting has it) once they stand. So this module pours its
// own: a pool of fine falling threads, let go along all three edges by how steeply each looks down, thrown with the
// edge's own motion, falling as water falls; most in the first second and a half (a sheet that tears), thinning to a
// drip. Each is light as the sea's thrown water is light: white-hot as it tears off, aqua as it falls; paint, not
// added light, and marked for the painter's filter to leave as drawn (light.js, spray). One draw call while the flukes
// are up and a second after; the fall is worked out in the shader.
function makeCurtain(ctx) {
  const S = ctx.engine.shared, C = W.curtain, POOL = Math.max(160, ctx.kit.count(C.pool)), col = (c) => new THREE.Color(c);
  const geo = new THREE.InstancedBufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-0.5, 0, 0, 0.5, 0, 0, 0.5, 1, 0, -0.5, 1, 0]), 3));
  geo.setIndex([0, 1, 2, 0, 2, 3]);
  const origin = new Float32Array(POOL * 4).fill(-1e6), vel = new Float32Array(POOL * 4);
  const aO = new THREE.InstancedBufferAttribute(origin, 4), aV = new THREE.InstancedBufferAttribute(vel, 4);
  aO.setUsage(THREE.DynamicDrawUsage); aV.setUsage(THREE.DynamicDrawUsage);
  geo.setAttribute('aOrigin', aO); geo.setAttribute('aVel', aV);
  geo.instanceCount = POOL;
  const uPix = { value: 0.0012 }, uLight = { value: 0 };
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...waterUniforms(ctx.engine), uTime: S.uTime, uFogColor: S.uFogColor, uFogDensity: S.uFogDensity, uVeil: S.uVeil, uVeilColor: S.uVeilColor, uPix, uLight,
      uHot: { value: col(C.hot) }, uBody: { value: col(C.body) }, uThread: { value: new THREE.Vector3(C.size, C.streak, C.gain) } },
    transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide,
    blending: THREE.CustomBlending, blendEquation: THREE.MaxEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
    blendEquationAlpha: THREE.AddEquation, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneFactor,
    vertexShader: /* glsl */`
      ${WATER_GLSL} ${FOG_PARS}
      attribute vec4 aOrigin, aVel;
      uniform float uTime, uPix; uniform vec3 uThread;
      varying vec2 vQ; varying float vA, vAge, vDist;
      void main() {
        float age = uTime - aOrigin.w;
        vQ = position.xy; vA = 0.0; vAge = 0.0; vDist = 0.0;
        if (age < 0.0 || age > 3.0) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
        vec3 v = aVel.xyz + vec3(0.0, -9.8 * age, 0.0);
        vec3 p = aOrigin.xyz + aVel.xyz * age + vec3(0.0, -4.9 * age * age, 0.0);
        if (p.y < waterSwell(p.xz) + 0.02) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }               // it is in the sea again
        // a thread as long as it falls in a sixth of a second (drop follows drop down a runnel, and they join), never longer than the way it has fallen
        float sp = length(v), len = min(clamp(sp * uThread.y, 0.08, 1.5) * (0.45 + 1.1 * aVel.w * aVel.w), length(p - aOrigin.xyz) + 0.08);      // (no two alike: of one length they were bristles)
        vec4 mv = viewMatrix * modelMatrix * vec4(p, 1.0);
        vec3 a = mat3(viewMatrix) * (v / max(sp, 1e-3));                                                       // the way it falls, as the eye sees it
        vec2 side = normalize(vec2(-a.y, a.x) + vec2(1e-5, 0.0));
        float dist = length(mv.xyz), wide = uThread.x * (0.55 + 0.9 * aVel.w), least = 1.15 * dist * uPix;      // never thinner than the screen can draw: fainter instead
        mv.xyz -= a * (position.y * len);                                                                      // the thread lies where the drop has just been
        mv.xy += side * (position.x * 2.0 * max(wide, least));
        vDist = dist; vAge = age;
        vA = smoothstep(0.0, 0.05, age) * min(1.0, 0.4 + 0.6 * sqrt(wide / least)) * (0.42 + 0.58 * fract(aVel.w * 7.31));
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      ${FOG_PARS}
      uniform vec3 uHot, uBody, uThread; uniform float uLight;
      varying vec2 vQ; varying float vA, vAge, vDist;
      void main() {
        float x = clamp(vQ.x * 2.0, -1.0, 1.0), y = clamp(vQ.y, 0.0, 1.0);
        float shape = clamp((1.0 - x * x) * pow(1.0 - y, 0.8) * smoothstep(0.0, 0.05, y), 0.0, 1.0);          // full at the drop, thinning up its trail
        vec3 c = mix(uHot * 1.05, uBody, smoothstep(0.1, 0.65, vAge));                                         // white-hot as it tears off the edge, aqua as it falls
        float show = shape * vA * uThread.z * uLight * (1.0 - fogAmount(vDist)) * (1.0 - uVeil);
        gl_FragColor = vec4(c * show, -15.5 * step(0.3, shape * vA) * step(0.3, show));
      }`,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = 'whale-curtain'; mesh.frustumCulled = false; mesh.renderOrder = 3.05; mesh.visible = false;
  const size2 = new THREE.Vector2();
  mesh.onBeforeRender = (renderer, scene, camera) => {
    const rt = renderer.getRenderTarget(), hgt = rt ? rt.height : renderer.getDrawingBufferSize(size2).y, pix = 2 / (camera.projectionMatrix.elements[5] * Math.max(1, hgt));
    if (uPix.value !== pix) { uPix.value = pix; mat.uniformsNeedUpdate = true; }
  };
  ctx.add(mesh);                                                               // (it hangs in the water's mirror too: the brightest thing of the dive)
  // where along each edge the water gathers and runs off: in clumps, with gaps between them (a torn curtain, not a comb).
  // edge 0: the hind edge (f: 0 at the notch, 1 at a tip); edge 1: the leading edge (f: 0 at the stock, 1 at the tip); left and right
  const rnd = ctx.rng(913), runnels = [[], []];
  for (let e = 0; e < 2; e++) for (let sideK = 0; sideK < 2; sideK++) {
    const clumps = e === 0 ? 5 : 6;
    for (let c = 0; c < clumps; c++) {
      const mid = (c + 0.15 + 0.7 * rnd()) / clumps, n = 2 + Math.floor(rnd() * 4), wide = 0.02 + 0.05 * rnd(), heavy = 0.45 + 0.55 * rnd();
      for (let i = 0; i < n; i++) runnels[e].push({ left: sideK === 0, f: clamp(mid + (rnd() - 0.5) * 2 * wide, e === 0 ? 0.05 : 0.14, 1), w: heavy * (0.6 + 0.4 * rnd()) });
    }
  }
  const LAND = 256, land = new Float32Array(LAND * 3).fill(Infinity);
  let next = 0, nextLand = 0, pending = 0, count = 0;
  return {
    object: mesh, light: uLight, runnels, pool: POOL,
    /** One drop let go at (x, y, z) with the speed (vx, vy, vz); level: the height of the water under it; ring: true if it rings the water where it lands. */
    drop(x, y, z, vx, vy, vz, level, ring) {
      const j = next, now = S.uTime.value; next = (next + 1) % POOL; count++;
      origin[j * 4] = x; origin[j * 4 + 1] = y; origin[j * 4 + 2] = z; origin[j * 4 + 3] = now;
      vel[j * 4] = vx; vel[j * 4 + 1] = vy; vel[j * 4 + 2] = vz; vel[j * 4 + 3] = rnd();
      aO.needsUpdate = aV.needsUpdate = true;
      if (ring) {
        const t = (vy + Math.sqrt(vy * vy + 19.6 * Math.max(0, y - level))) / 9.8, k = nextLand; nextLand = (nextLand + 1) % LAND;
        if (land[k * 3 + 2] === Infinity) pending++;
        land[k * 3] = x + vx * t; land[k * 3 + 1] = z + vz * t; land[k * 3 + 2] = now + t;
      }
    },
    /** Call every frame: fn(x, z) for each ringing drop that has met the water since the last call. */
    landed(fn) {
      if (!pending) return;
      const now = S.uTime.value;
      for (let k = 0; k < LAND; k++) if (land[k * 3 + 2] <= now) { fn(land[k * 3], land[k * 3 + 1]); land[k * 3 + 2] = Infinity; pending--; }
    },
    get count() { return count; },
  };
}

// ------------------------------------------------------------------------------------------------ the body's own light
// An extension of the family's material, laid after the sea's rock light. Two things. (1) Every point of the body is
// measured from where the water stands NOW at that point: before the family lifts what is under water to where the eye
// sees it, the point is put down by the swell's height there, and afterwards put back; so "under water" is under the
// swell, and a back in a trough stands in the air as it should. (2) The sheath: the sea's own marks laid on the body as
// modelled, sliding aft, in green-gold; on skin under the water and along the line where it meets the sea, and none on
// skin that stands in the air (the body is never lit from within).
function bodyLight(ctx, shared) {
  const sea = shared.sea, col = (c) => new THREE.Color(c);
  const uSheath = { value: new THREE.Vector4(0, 0, W.sheath.stream, W.sheath.share) }, uSheathB = { value: new THREE.Vector4(W.sheath.base, W.sheath.limb, 0, 0) };
  const uLit = { value: new THREE.Vector4(0, 0, 0, 0) }, uLitB = { value: new THREE.Vector4(W.lit.foot[0], W.lit.foot[1], W.lit.edge[0], W.lit.edge[1]) };      // the lit sea's colour and how lit it is where the whale is
  { const k = col(W.lit.color); uLit.value.set(k.r, k.g, k.b, 0); }
  const uUnder = { value: new THREE.Color(0, 0, 0) };      // what it is under the water: a shade darker than the deep itself
  // the sky's slate on wet skin that looks up (the colour the sea's own rock takes on its tops behind the front), and how much of it
  const uSky = { value: new THREE.Vector4(0, 0, 0, 0) };
  { const k = sea.uniforms.uSeaSky1 && sea.uniforms.uSeaSky1.value && sea.uniforms.uSeaSky1.value.isColor ? sea.uniforms.uSeaSky1.value : col('#34406A'); uSky.value.set(k.r, k.g, k.b, W.sheen); }
  return {
    uSheath, uSheathB, uLit, uUnder, uSky,
    extend: {
      uniforms: { uSwell: waterUniforms(ctx.engine).uSwell, uWhSheath: uSheath, uWhSheathB: uSheathB, uWhLit: uLit, uWhLitB: uLitB, uWhUnder: uUnder, uWhSky: uSky, tWhFleck: { value: sea.fleck }, tWhStip: { value: (sea.uniforms.tSeaStip && sea.uniforms.tSeaStip.value) || sea.fleck },
        uWhYoung: { value: col(W.color) }, uWhHot: { value: col(W.hot) }, uWhOld: { value: col(W.old) }, uWhDying: { value: col(W.dying) } },
      vertexPars: /* glsl */`
        uniform vec4 uSwell[3];
        varying vec3 vWhRest, vWhRestN; varying float vWhUp, vWhDeep;
        float whLevel;
        float whSwellAt(vec2 xz) { float h = 0.0; for (int i = 0; i < 3; i++) { float ph = dot(uSwell[i].xy, xz) - uSwell[i].z, a = uSwell[i].w; h += a * cos(ph) + 0.5 * length(uSwell[i].xy) * a * a * cos(2.0 * ph); } return h; }`,
      vertexLocal: /* glsl */`
        vWhRest = position; vWhRestN = normal;
        whLevel = whSwellAt(transformed.xz);
        transformed.y -= whLevel;
        vWhDeep = max(-transformed.y, 0.0);`,
      vertexWorld: /* glsl */`
        vWhUp = wp.y;
        wp.y += whLevel;`,
      fragmentPars: /* glsl */`
        uniform sampler2D tWhFleck, tWhStip; uniform vec4 uWhSheath, uWhSheathB, uWhLit, uWhLitB, uWhSky; uniform vec3 uWhUnder;
        varying vec3 vWhRest, vWhRestN; varying float vWhUp, vWhDeep;
        ${MARKS_GLSL}`,
      light: /* glsl */`{
        // under the water it takes no sky and keeps next to nothing of itself: a dark body, known by the light it stirs
        c = mix(c, uWhUnder, smoothstep(0.05, 2.4, vWhDeep));
        // out of the water it is a black shape against the lit sea, and the sea lights it from below: a glow on its wet foot that dies
        // within a metre, and an edge of light round what stands higher, darkest at its top (laid in strokes, never a film)
        if (uWhLit.w > 0.001 && vWhUp > 0.0) {
          float whEdge = pow(1.0 - clamp(abs(dot(N, V)), 0.0, 1.0), 2.2), whStroke = 0.75 + 0.5 * stroke;
          // (the edge of light is the flukes' alone, which are a blade: a back or a tailstock seen from astern or abeam is ALL seen edge-on,
          // and with an edge of light on it the whole of it stood moss green on the sea, a boulder and then a tent: sea_wh3_c03_crop.png)
          float whBlade = smoothstep(22.6, 23.6, -vWhRest.z);
          c += uWhLit.rgb * (uWhLit.w * whStroke * (uWhLitB.x * (0.35 + 0.65 * whEdge) * exp(-vWhUp / uWhLitB.y) + uWhLitB.z * whEdge * whBlade * exp(-vWhUp / uWhLitB.w)));
        }
        // wet skin that looks up gives back a little of the sky: the darkest light there is, laid in strokes, by which a back that is one black
        // shape against the fire is still seen to be round (none under the water; none on what looks sideways or down)
        c += uWhSky.rgb * (uWhSky.w * pow(clamp(N.y, 0.0, 1.0), 2.0) * (0.7 + 0.3 * stroke) * smoothstep(0.02, 0.3, vWhUp));      // (stroke runs from -1 to 1)
        float whWet = 1.0 - smoothstep(-0.06, 0.06, vWhUp), whLine = exp(-vWhUp * vWhUp / 0.016) * step(-0.25, vWhUp);      // skin under the water or just out of it; the line where it meets the sea
        if ((uWhSheath.x + uWhSheath.y) * max(whWet, whLine) > 0.001) {
          vec3 whN = normalize(vWhRestN);
          vec2 whK = pow(abs(whN.xy), vec2(6.0)); whK /= max(whK.x + whK.y, 1e-5);              // how far this skin faces sideways (x) or up and down (y)
          float whU = vWhRest.z + uTime * uWhSheath.z;                                         // the marks slide toward the tail
          vec2 whA = vec2(whU, vWhRest.x), whB = vec2(whU + 3.1, vWhRest.y);
          float whMask = 0.0;
          #ifdef USE_COLOR_ALPHA
            whMask = 1.0 - vColor.a;                                                           // the model's own: the snout, the leading edges of flippers and flukes
          #endif
          // along the throat grooves (the belly, chin to navel): marks drawn out along the body
          float whGroove = smoothstep(0.25, 0.7, -whN.y) * (1.0 - smoothstep(13.5, 15.5, -vWhRest.z));
          // how lit the water is on this part of the skin: never the same in one place for long; most on what stirs it
          // most (the model's mask, the grooves); and where skin under the water is seen edge-on the sheath is looked
          // along and its marks crowd: the form of the animal is drawn by where its marks are, never by a line
          float whPatch = 0.72 + 0.28 * sin(vWhRest.z * 0.41 + uTime * 0.31 + 1.7 * sin(vWhRest.x * 0.9 + vWhRest.y * 0.7 + uTime * 0.17));
          float whLimb = pow(1.0 - clamp(abs(dot(N, V)), 0.0, 1.0), 1.5) * whWet;
          float whE = clamp(uWhSheath.w * ((uWhSheathB.x + (1.0 - uWhSheathB.x) * max(whMask, 0.8 * whGroove)) * whPatch + uWhSheathB.y * whLimb), 0.0, 0.95);
          vec3 d1 = whK.y * whMark(tWhFleck, whA * 0.33) + whK.x * whMark(tWhFleck, whB * 0.33 + 0.37);
          vec3 d2 = whK.y * whMark(tWhFleck, whA * vec2(0.11, 0.16) + 0.21) + whK.x * whMark(tWhFleck, whB * vec2(0.11, 0.16) + 0.63);
          vec3 s1 = whK.y * whMark(tWhStip, whA * 0.55 + 0.13) + whK.x * whMark(tWhStip, whB * 0.55 + 0.71);
          vec3 g1 = whK.y * whMark(tWhFleck, whA * vec2(0.035, 0.42) + 0.5) + whK.x * whMark(tWhFleck, whB * vec2(0.035, 0.42) + 0.9);      // (drawn out along the body)
          float whTw = 0.65 + 0.35 * sin(uTime * (1.2 + 2.6 * s1.z) + s1.z * 41.0);
          float whDens = clamp(whE * (0.5 + 1.1 * whLit(d1, 1.06 - whE * 0.85) + 0.9 * whLit(d2, 1.1 - whE * 0.8)), 0.0, 1.0);
          float whAge = 0.2 + 0.58 * whE;                                                      // (never the hot core: seen through the water a dense patch of it went mint-white)
          vec3 whSkin = whInk(s1, 1.03 - 0.95 * whDens, whAge) * whTw * 1.2 + whInk(d1, 1.06 - whE * 0.85, whAge) * 0.75 + whInk(d2, 1.12 - whE * 0.8, whAge) * 0.6
                       + whInk(g1, 1.08 - 0.75 * whE * whGroove, 0.5) * (0.9 * whGroove);
          // where the back meets the water: small marks close together, a broken line (never a wire, never two lone bright spots)
          vec3 l1 = whK.y * whMark(tWhStip, whA * 0.8 + 0.4) + whK.x * whMark(tWhStip, whB * 0.8 + 0.2), l2 = whK.y * whMark(tWhFleck, whA * 0.6 + 0.7) + whK.x * whMark(tWhFleck, whB * 0.6 + 0.1);
          vec3 whRim = whInk(l1, 0.3, 0.85) * 1.3 + whInk(l2, 0.46, 0.75) * 0.9;
          // (broken along the body, in stretches that slide aft with the water that sheets off it, and never brighter than the sheet's own marks
          // beside it: whole and at full strength it was a wire of green light along the animal with lamps on it where the bloom took the brightest marks)
          float whBreak = smoothstep(-0.25, 0.3, sin(whU * 1.9 + 2.3 * sin(whU * 0.53 + 1.3)) + 0.5 * sin(whU * 4.7 + vWhRest.x * 2.0));
          glow += uWhSheath.x * whSkin * whWet * (1.0 - 0.6 * whLine) + min(uWhSheath.y * whRim * (0.12 + 0.88 * whBreak), vec3(1.25)) * whLine;
        }
      }`,
    },
  };
}

export async function build(ctx, plan, shared) {
  const cast = shared.cast = shared.cast || {};
  const { kit, stage, path } = ctx, sea = shared.sea, P = plan;
  if (!sea || !sea.uniforms) return {};                     // (the place and its light did not build: nothing for the cast to answer)
  const params = new URLSearchParams(typeof location !== 'undefined' ? location.search : '');
  const num = (key, d) => (params.has(key) && !Number.isNaN(+params.get(key)) ? +params.get(key) : d);

  // ---- the three prototypes of heroes.js (the layout's: a green-gold spindle, a dark ellipsoid, two blades) go
  removeStandIn(ctx, 'whale (');

  // ---- events: every sound and every consequence has one; nothing here plays or does it. whale.on('blow', fn) ...
  const listeners = {}, log = [];
  const fire = (name, a, b, c) => { log.push([+ctx.time.toFixed(2), name, typeof a === 'number' ? +a.toFixed(1) : a ?? null, typeof b === 'number' ? +b.toFixed(1) : b ?? null]); const l = listeners[name]; if (l) for (const fn of l) { try { fn(a, b, c); } catch (err) { console.error('sea/cast_whale: a listener of ' + name + ' threw', err); } } };

  // ---------------------------------------------------------------------------------------------- the animal
  const body = bodyLight(ctx, shared), R = W.rock;
  body.uSheathB.value.set(num('whbase', W.sheath.base), num('whlimb', W.sheath.limb), 0, 0);      // (for looking: &whbase= &whlimb= &whunder=)
  body.uSky.value.w = num('whsheen', W.sheen);      // (&whsheen=0: one black shape, as it was)
  const underK = num('whunder', 1), offK = num('whoff', W.surface.off[1]);      // (&whoff=0: nothing eases a boat off it)
  // the sea's own rock light, with one number of its own: the water does not break on a whale as on a rock (no surge of aqua up its flank:
  // its waterline is green-gold), so of the sea's `uSeaL` it keeps how lit the sea is and leaves out how the swell answers at a foot
  const seaExt = sea.extend({ rest: R.rest, top: R.top, run: R.run, pale: R.pale }), seaL = { value: new THREE.Vector4(0, 0, 0, 0) };
  if (seaExt.uniforms && seaExt.uniforms.uSeaL) seaExt.uniforms = { ...seaExt.uniforms, uSeaL: seaL };
  const st = { phase: 'away', t0: -1e9, plan: null, wheel: null, ride: 1, out: 1, leaving: false, leaveK: 0, leaveFor: 1, pending: null, sinkLine: null, keep: 0, blown: false, passWait: false, surfaced: false, passed: false, called: false, fade: 0, hist: [], histAt: 0, traceAt: 0, flukeT: -1, ringT: -1e9, ring: null, swellT: -1e9, swell: null, om: [0, 0, 0], ph: [0, 0, 0], deep: W.deep[0], sent: false, track: [] };
  const whale = await makeSwimmer(ctx, {
    species: 'whale', hidden: true, tint: W.tint, seed: 7,
    blow: false, pour: num('whfampour', 1) > 0 ? { ...W.pour } : false,      // (&whfampour=0: for looking, the curtains without the family's strands)
    material: { extend: [seaExt, body.extend] },
    onTouch: (x, z, kind, sw) => {
      if (kind === 'blow') { st.blown = true; st.blowAt = ctx.time; const f = sea.front, k = W.blow.wind; blow.at(sw.marks.blowhole, sw.velocity, [(f ? f.nx : 0.9) * k, (f ? f.nz : 0.3) * k]); }
      if (kind === 'flukes') st.flukeT = ctx.time;
      if (kind === 'footprint') { st.ringT = ctx.time; st.ring = { x, z }; }
      if (kind === 'swell') { st.swellT = ctx.time; st.swell = { x, z }; }
      if (kind !== 'wake') fire(kind, x, z, sw);
    },
  });
  const sw = whale.swimmers[0], spec = whale.spec, NS = sw.body.length / 4;
  const blow = makeBlow(ctx, shared);
  const curtain = makeCurtain(ctx), curtainK = num('whcurtain', 1), famPour = num('whfampour', 1) > 0, crnd = ctx.rng(4242);      // (&whcurtain=0: for looking, the family's strands alone)
  blow.uniforms.uMist.value.set(num('blmist', W.blow.mist), num('bldense', W.blow.dense), num('bldab', W.blow.dab)); blow.dropUniforms.uDropK.value = num('bldrop', 1);      // (for looking: &blmist= &bldense= &bldab= &bldrop=)
  const light = makeWaterLight(ctx, shared, plan);
  const LU = light.uniforms;
  LU.uNear.value.x = num('whnear', W.light.near[0]);
  const litK = num('whlit', W.light.lit);      // (&whlit=0: for looking, as it was)
  const rowAt = num('whrow', 0);
  const seaLight = () => cast.seaLight || null;
  const answer = () => sea.uniforms.uSeaL.value.y;         // 0..1: whether the water answers at all
  const writeLine = (x0, z0, x1, z1, radius, age) => { const s = seaLight(); if (s) s.line(x0, z0, x1, z1, radius, age); else if (ctx.water.trace && ctx.water.trace.line) ctx.water.trace.line(x0, z0, x1, z1, { channel: 'glow', radius, strength: Math.min(0.6, age) * answer(), soft: 0.75 }); };
  const writeDab = (x, z, radius, age) => { const s = seaLight(); if (s) s.dab(x, z, radius, age); else if (ctx.water.trace && ctx.water.trace.inject) ctx.water.trace.inject(x, z, { channel: 'glow', radius, strength: Math.min(0.6, age) * answer(), soft: 0.8 }); };

  // ---- the swell where it will stand a moment from now (the water's own three waves; their pace is read from the water itself)
  const swellU = waterUniforms(ctx.engine).uSwell;
  const swellAt = (x, z, ahead = 0) => {
    let h = 0; const w = swellU.value;
    for (let i = 0; i < 3; i++) { const q = w[i], a = q.w, kk = Math.hypot(q.x, q.y), ph = q.x * x + q.y * z - (q.z + st.om[i] * ahead); h += a * Math.cos(ph) + 0.5 * kk * a * a * Math.cos(2 * ph); }
    return h;
  };

  // ---------------------------------------------------------------------------------------------- the two lives
  const P3 = (s, d, y) => { const p = kit.at(s, d, y); return [p.x, p.y, p.z]; };
  const boatV = { x: 0, z: 0, s: 0 };                       // the boat's own way over the ground, eased (m/s; and along the route)
  /**
   * Moment 7: it passes beneath. o: in (seconds until its snout crosses the centre line; default: the page's 18.6, its
   * whole run from (132, +46)), speed. It is put that far back on its line, deep and unlit: its light comes over four seconds.
   */
  const beneath = (o = {}) => {
    const B = W.beneath, a = B.from, b = B.to, k = (B.sinkAt - a[1]) / (b[1] - a[1]), k0 = (0 - a[1]) / (b[1] - a[1]);
    const from = P3(a[0], a[1], -B.depth[0]), to = P3(a[0] + (b[0] - a[0]) * k, B.sinkAt, -B.depth[1]), cross = kit.at(a[0] + (b[0] - a[0]) * k0, 0);
    whale.sink(0, 0.5);
    whale.pass({ from, to, speed: o.speed ?? B.speed, sink: B.sink, on: B.on, in: o.in ?? B.cross, by: [cross.x, cross.z], onDone: () => { if (st.phase === 'beneath') { st.phase = 'away'; fire('gone'); } } });
    st.phase = 'beneath'; st.t0 = ctx.time; st.passed = true; st.cross = cross; st.plan = null; st.wheel = null;      // (st.called is never put back: one call, whatever staging does)
    { const lx = to[0] - from[0], lz = to[2] - from[2], ll = Math.hypot(lx, lz) || 1; st.sinkLine = { x: to[0], z: to[2], dx: lx / ll, dz: lz / ll }; }
    st.leaving = false; st.out = 1;
    fire('pass', cross.x, cross.z);
    return api;
  };
  /**
   * Moment 9: it comes up, blows, rolls, shows its flukes and sounds. o: in (seconds until the blow: 8; never under 6),
   * at ([x, z]: the top of its roll), show. The page's rule is kept here: if the boat is, or by then will be, within 26 m
   * of the water it comes up through, its whole line lies 14 m further left. Returns the family's plan with its times.
   */
  // (its light goes out over `seconds`; asked again for less, it goes on from where it is, quicker)
  const leave = (seconds) => {
    if (!st.leaving) { st.leaving = true; st.leaveK = 0; st.leaveFor = seconds; whale.sink(W.beneath.under, seconds + 1); fire('sink', head.x, head.z); }
    else st.leaveFor = Math.min(st.leaveFor, seconds);
  };
  const inSight = () => st.phase === 'beneath' && sw.active && st.fade > 0.02;
  const surface = (o = {}) => {
    // There is one whale. If it is still passing beneath with its light on, it is not cut off: its light goes out first (over
    // four seconds and a half) and it comes up that much later. Then null is returned, and `times` are set when it has begun ('rise').
    if (inSight()) { st.pending = o; st.surfaced = true; leave(W.beneath.cut); return null; }
    const S = W.surface, lead = Math.max(S.least, o.in ?? (o.byClock ? S.blowT + (stage.calm ? S.calmWait : 0) - sea.T : S.lead));
    const atSD = params.has('what') ? params.get('what').split(',').map(Number) : S.at;
    let a = o.at ? { x: o.at[0], z: o.at[1] } : kit.at(atSD[0], atSD[1]);
    const f0 = kit.at(S.from[0], S.from[1]), t0 = kit.at(S.at[0], S.at[1]);
    let dx = t0.x - f0.x, dz = t0.z - f0.z; const dl = Math.hypot(dx, dz) || 1; dx /= dl; dz /= dl;
    // where the boat will be while it is up (the blow, the flukes breaking, the flukes going under), carried as it is carried now
    const boat = ctx.boat, nearest = (ax, az) => {
      let best = 1e9;
      for (const [t, along] of [[lead, -5], [lead + 8, -7], [lead + 10, -3], [lead + 14, 5]]) { const bx = boat.x + boatV.x * t, bz = boat.z + boatV.z * t; best = Math.min(best, Math.hypot(ax + dx * along - bx, az + dz * along - bz)); }
      return best;
    };
    let aside = 0, ahead = 0;
    if (nearest(a.x, a.z) < num('whkeep', S.keep)) {      // (&whkeep=0: for looking, the rule off)
      // (the boat is to its right, as ever: it goes left; a boat that has got to its left sends it right. The page's 14 m is tried first; where
      // that still leaves it within 26 m of the boat, its own line 14, 28 or 42 m further on, which is open water all the way)
      // (Checked against what stands in the sea, sea-cast-whale3/clear.mjs: the page's line clears far pipe 1 by 7.8 m, 68 m beyond the roll and
      // 34 m down. A line 14 m to the left runs under that pipe's foot: 58 m on and 33 m down for the page's own rule, which is kept; moved on
      // as well it met the pipe 16 to 25 m down, and 28 m to the left it ran under the corner of the wreck's reef: those are no longer tried.)
      const here = path.at(clamp(atSD[0], 0, path.length)), bside = (boat.x - a.x) * here.rx + (boat.z - a.z) * here.rz, k = (bside >= -2 ? -1 : 1) * S.aside;
      let best = -1, pick = null;
      for (const c of [[k, 0], [0, 14], [0, 28], [0, 42], [k, 14]]) {
        const n = nearest(a.x + here.rx * c[0] + dx * c[1], a.z + here.rz * c[0] + dz * c[1]);
        if (n > best) { best = n; pick = c; }
        if (n >= S.keep + 1) break;
      }
      aside = pick[0]; ahead = pick[1];
      a = { x: a.x + here.rx * aside + dx * ahead, z: a.z + here.rz * aside + dz * ahead };
    }
    whale.sink(0, 0.5);
    const plan_ = whale.surface({ at: [a.x, a.z], dir: [dx, dz], in: lead, show: o.show ?? num('whshow', S.show), onDone: () => { if (st.phase === 'surfacing') { st.phase = 'away'; fire('gone'); } } });
    // (its light begins to come `kindle` seconds before the blow, over four seconds: the page's "t 12 to 16"; while the front is still
    // crossing the boat a band of green-gold ahead would be looked at instead of it)
    st.phase = 'surfacing'; st.t0 = ctx.time + Math.max(0, lead - S.kindle); st.surfaced = true; st.blown = false; st.ride = 1; st.flukeT = -1;
    st.leaving = false; st.out = 1; st.pending = null;
    st.wheel = { x: a.x, z: a.z, dx, dz, aside, ahead }; st.plan = plan_;
    api.times = { ...plan_.times, at: ctx.time, T: sea.T };
    fire('rise', a.x, a.z, api.times);
    return plan_;
  };

  // ---------------------------------------------------------------------------------------------- for staging
  const head = new THREE.Vector3(0, -50, 0), focus = new THREE.Vector3(), wakerAt = new THREE.Vector3(0, -50, 0);
  const keepOff = ctx.addCollider({ x: 0, z: 0, r: -1e6, soft: 0.001 });      // (moved and switched every frame: see "it is never rowed into")
  const api = cast.whale = {
    numbers: W,
    /** The family's handle (docs/life/swimmers.md): swimmers[0] has head, dir, velocity, speed, body (x, y, z, radius of every spine station), marks (snout, blowhole, dorsal, fluke_L, fluke_R, notch ...), active, atSurface. */
    handle: whale,
    /** This module starts both lives itself (the pass on the cue 'whale', the surfacing on the show clock, the blow at T 16.5). false: staging calls beneath() and surface(). */
    auto: !params.has('whaway'),      // (&whaway=1: for measuring: the module as built, the whale never sent)
    /** beneath({ in, speed }): moment 7. surface({ in, at, show }): moment 9; it returns the family's plan with its times, or null if the whale was still passing beneath
     *  in sight (it is never cut off: its light goes out first, and it comes up that much later; `times` are set, and 'rise' fires, when it has begun). */
    beneath, surface,
    /** Take it away at once (only where it cannot be seen). */
    hide() { whale.hide(); st.phase = 'away'; st.leaving = false; st.pending = null; st.out = 0; return api; },
    /** 'away' | 'beneath' | 'surfacing' */
    get phase() { return st.phase; },
    get active() { return sw.active; },
    /** Its snout (live; far below while it is away). focus: where a rider would look for it now (the light over its head while it is under; its blowhole, then the top of its roll, then its flukes while it is up). */
    head, focus,
    /** Metres of water over its back now (0: at the surface; 99: away). */
    depth: 99,
    /** After surface(): { blow, fin, flukes, stand, under } in seconds from the call, `at` (ctx.time of the call), `T` (the show clock then). The family's own reckoning: to within a few tenths, and the swell moves each by up to half a second. */
    times: null,
    /** For the jellies (shared.cast.deep.waker takes this very shape): the middle of its head, live; radius 0 while it is away. */
    waker: { position: wakerAt, radius: 0 },
    /** Its light: on the water (gain: how much of the water is lit, 0..1.5; bright: how bright its marks) and on its skin (sheath: 1 = as built). Live. */
    light: { gain: num('whgain', W.light.gain), bright: W.light.bright, sheath: 1 },
    /** What the layer 'deep' should stand at for it (the page: 0.3 to 0.75 over 4 s as it comes, back to 0.35 over 10 s). */
    get deep() { return st.deep; },
    /**
     * Metres its swell lifts the water at (x, z) now: the long swell of its back as it passes under (moment 7: the boat 0.2 m,
     * then the buoy and the floats in turn) and the one long ring that leaves the footprint (the boat 0.25 m about three
     * seconds after its flukes have gone). A travelling hump: add it to whatever floats.
     */
    lift(x, z) {
      let h = 0; const t = ctx.time;
      if (st.swell && t - st.swellT < 30) { const r = Math.hypot(x - st.swell.x, z - st.swell.z), front = 2 + (t - st.swellT) * 3.2, q = (r - front) / 4.5; h += W.beneath.swell * Math.exp(-q * q) * Math.exp(-r / 60) * smooth(0, 1.5, t - st.swellT) * (stage.calm ? 0.4 : 1); }      // (it comes over a second and a half: the boat is within nine metres of where it begins)
      if (st.ring && t - st.ringT < 30) { const r = Math.hypot(x - st.ring.x, z - st.ring.z), front = W.foot.wave[0] + (t - st.ringT) * W.foot.wave[1], q = (r - front) / 6; h += 0.3 * Math.exp(-q * q) * Math.exp(-Math.max(0, r - 36) / 40) * (stage.calm ? 0.4 : 1); }
      return h;
    },
    /** true (as built): this module lifts the rider's own boat by lift() at the boat (none with reduced motion: the ride's rule for a ring that reaches the hull). false: staging does it, or nobody. */
    lifts: num('whlift', 1) > 0,
    /** whale.on(name, fn): 'pass' (x, z: it has begun to pass beneath; where it will cross the line), 'flukeprint' (x, z), 'swell' (x, z: its back is under the boat), 'call' (x, z: its flukes are passing under: the one whale call,
     *  once in the area's life whatever is called), 'sink' (x, z: it begins to settle and its light to go out), 'rise' (x, z, times: it has been put on its line to come up), 'emerge' (x, z: the head parts the water), 'blow' (x, z),
     *  'fin', 'flukes' (they break the water), 'pour', 'submerge', 'footprint' (x, z: they have gone under; no sound), 'gone' (it has been taken out). */
    on(name, fn) { (listeners[name] || (listeners[name] = [])).push(fn); return api; },
    log, state: st,
  };

  // ---------------------------------------------------------------------------------------------- every frame
  const tmp = new THREE.Vector3(), tail = new THREE.Vector3();
  const play = params.get('whplay');
  let played = false, lastX = null;
  const sec = spec.section;

  return {
    update(dt, c) {
      const boat = c.boat, t = c.time, T = sea.T, L = sea.L || 0, S = W.surface;
      // the boat's way over the ground, and the pace of the swell's three waves (read from the water)
      if (dt > 0) {
        const k = 1 - Math.exp(-dt / 0.8);
        if (lastX) { boatV.x += ((boat.x - lastX[0]) / dt - boatV.x) * k; boatV.z += ((boat.z - lastX[1]) / dt - boatV.z) * k; boatV.s += ((c.s - lastX[2]) / dt - boatV.s) * k; }
        lastX = [boat.x, boat.z, c.s];
        for (let i = 0; i < 3; i++) { const ph = swellU.value[i].z; let d = ph - st.ph[i]; d -= Math.round(d / (2 * Math.PI)) * 2 * Math.PI; if (Math.abs(d) < 1) st.om[i] += (d / dt - st.om[i]) * 0.2; st.ph[i] = ph; }
      }
      // ---- the two lives, begun here unless staging has taken them (api.auto)
      if (play && !played && t > num('whplayat', 0.2)) { played = true; if (play === 'beneath') beneath(); else surface({ in: S.lead }); }
      if (api.auto && !play) {
        // moment 7: on the cue. A rider left to the current is at s 134 as its snout crosses the line; for a slower boat
        // it waits (never more than 12 s), for a faster one its run-in is shorter (never so short that it would be seen to appear)
        const tw = stage.since('whale'), B = W.beneath;
        if (!st.passed && tw >= B.settle && tw < 60) {      // (not before the boat's pace is known: reckoned from the first second's it came 2 m late)
          const eta = (B.meet - c.s) / Math.max(0.25, boatV.s);
          if (eta <= B.cross || tw >= B.wait) beneath({ in: clamp(eta, B.least, B.cross) });
        }
        // moment 9: the blow at T 16.5. (A clock that is already past it when first seen, a rider who has paddled far into
        // the show: it comes as soon as it can; past `late` it has gone.)
        // (stage 5: with reduced motion the front takes 20 s to cross and not 12 (set.js), and the whale kept the clock: it blew in dark water as the
        // front's foot reached it. It now waits those eight seconds too, so that the order is the page's: the sea is lit, then the head parts it)
        const wait = stage.calm ? S.calmWait : 0;
        if (!st.surfaced && T >= S.blowT + wait - S.lead && T < S.late + wait) surface({ byClock: true });
      }

      // ---- where it is
      const active = sw.active, mk = sw.marks, b = sw.body, water = c.water;
      let minDepth = 99, outFirst = -1, outLast = -1;
      if (active) {
        head.copy(mk.snout);
        for (let k2 = 0; k2 < NS; k2++) { const lvl = water.heightAt(b[k2 * 4], b[k2 * 4 + 2]), top = b[k2 * 4 + 1] + sec[k2][1], d = lvl - top; if (d < minDepth) minDepth = d; if (d < 0) { if (outFirst < 0) outFirst = k2; outLast = k2; } }
        api.depth = Math.max(0, minDepth);
        wakerAt.set((mk.snout.x + b[0]) / 2, (mk.snout.y + b[1]) / 2, (mk.snout.z + b[2]) / 2); api.waker.radius = minDepth < 40 ? W.waker : 0;
        // where to look: over its head while it is under; its blowhole as it blows; the top of its roll; its flukes
        if (st.phase === 'surfacing' && st.wheel) {
          const fl = Math.max(mk.fluke_L.y, mk.fluke_R.y, mk.notch.y);
          if (fl > 0.2) focus.set(mk.notch.x, Math.max(1, mk.notch.y * 0.6), mk.notch.z);
          else if (st.blown) focus.set(st.wheel.x, 0.6, st.wheel.z);
          else focus.set(mk.blowhole.x, 0, mk.blowhole.z);
        } else focus.set(mk.snout.x, 0, mk.snout.z);
      } else { head.set(0, -50, 0); api.depth = 99; api.waker.radius = 0; }

      // ---- the surfacing: it rides a share of the swell at its place (all of it until it has blown, so that it comes
      // up through the water as it stands; then little: a whale is not a cork), told a moment ahead (the family eases it)
      if (st.phase === 'surfacing' && st.wheel && active) {
        const want = st.blown ? S.ride : 1;
        st.ride += (want - st.ride) * (1 - Math.exp(-dt / 1.6));
        const deepK = 1 - smooth(6, 22, api.depth);
        const k = smooth(0, 2.5, st.blown ? t - st.blowAt : 0);                    // (until it blows: the water over its blowhole; then the water at the top of its roll)
        const h = (1 - k) * swellAt(mk.blowhole.x, mk.blowhole.z, 0.3) + k * swellAt(st.wheel.x, st.wheel.z, 0.3);
        whale.sink(-st.ride * deepK * h, 0.9);
      }

      // ---- it is never rowed into: while its back is within three metres of the surface, the water round the top of its roll eases a boat out
      {
        const want = st.phase === 'surfacing' && st.wheel && active && api.depth < 3 ? 1 : 0;
        st.keep += (want - st.keep) * (1 - Math.exp(-dt / 1.2));
        if (st.keep > 0.01 && st.wheel && offK > 0) { keepOff.x = st.wheel.x; keepOff.z = st.wheel.z; keepOff.r = S.off[0]; keepOff.soft = Math.max(0.001, offK * st.keep); } else keepOff.r = -1e6;
        // (for looking, &whrow=<m/s>: a rider who points the bow at the top of its roll and paddles at that speed from the moment it is put on its line)
        if (rowAt > 0 && st.wheel && st.phase === 'surfacing' && ctx.engine.boat) { const eb = ctx.engine.boat; eb.heading = Math.atan2(-(st.wheel.x - boat.x), -(st.wheel.z - boat.z)); ctx.engine.devSpeed = rowAt; }
      }

      // ---- its swell lifts the rider's own boat (the page: 0.2 m as its back passes under; 0.25 m as the one long ring of the footprint reaches it).
      // The engine eases the hull toward the water's own height every frame (boat.js, sync: five a second), so what was laid on last frame has been
      // eased away by that much: it is made up and the new lift laid over it, and hull and eye stand exactly `lift` above where the engine has them.
      // The water round the hull follows the hull (the water's well), so it comes up with the boat: a hump, not a hull lifted out of the sea
      {
        const tiltG = ctx.engine.boat && ctx.engine.boat.tilt;
        if (tiltG && tiltG.position && dt > 0) {
          const want = api.lifts && !stage.calm ? api.lift(boat.x, boat.z) : 0, kept = (st.lifted || 0) * Math.exp(-dt * 5);
          if (want > 1e-4 || kept > 1e-4) tiltG.position.y += want - kept;
          st.lifted = want > 1e-4 || kept > 1e-4 ? want : 0;
        }
      }

      // ---- the one call (moment 7): as its flukes pass under the boat's line
      if (st.phase === 'beneath' && active && !st.called && st.cross) {
        const B = W.beneath, a0 = kit.at(B.from[0], B.from[1]), dirx = st.cross.x - a0.x, dirz = st.cross.z - a0.z, dl = Math.hypot(dirx, dirz) || 1;
        if (((mk.notch.x - st.cross.x) * dirx + (mk.notch.z - st.cross.z) * dirz) / dl > 0) { st.called = true; fire('call', mk.notch.x, mk.notch.z); }
      }
      // the layer 'deep': up as it comes (4 s), down after it has gone (10 s)
      { const near = st.phase === 'beneath' && active ? smooth(34, 12, Math.hypot(head.x - boat.x, head.z - boat.z)) : 0; const want = st.passed ? Math.max(W.deep[2], W.deep[0] + (W.deep[1] - W.deep[0]) * near) : W.deep[0]; st.deep += (want - st.deep) * (1 - Math.exp(-dt / (want > st.deep ? 1.6 : 4))); }

      // ---- its light. It comes over four seconds (never an appearance in less); on its skin it is strongest under water
      const lifeT = t - st.t0;
      // moment 7 ends: once its snout is well beyond d -20 (or the show has begun) it settles deeper and its light goes out, over seconds
      if (st.phase === 'beneath' && active) {
        const q = st.sinkLine, B = W.beneath;
        if (!st.leaving && ((q && (mk.snout.x - q.x) * q.dx + (mk.snout.z - q.z) * q.dz > B.past) || T >= 0.5)) leave(B.out);
        if (st.leaving) {
          st.leaveK += dt / st.leaveFor; st.out = 1 - smooth(0, 1, st.leaveK);
          if (st.leaveK > 1 + 1.5 / st.leaveFor) { whale.hide(); st.phase = 'away'; st.leaving = false; st.out = 0; fire('gone'); }      // (a second and a half after the last of its light: out of sight, it is taken out)
        }
      }
      st.fade = sw.active ? smooth(0, W.light.fade, lifeT) * st.out : Math.max(0, st.fade - dt / 3);
      if (st.pending && !inSight()) { const o = st.pending; st.pending = null; surface(o); }
      const answerK = answer();
      // (Tried and dropped: the light on its skin lit from the moment it is put on its line for the surfacing, so that its tail would be seen sliding away
      // under the bow before its light on the surface is there. This water does not show a body 11 to 14 m off and 7 m down: nothing came of it,
      // sea_wh3_u01.png, sea_wh3_u02.png)
      body.uSheath.value.x = W.sheath.under * underK * api.light.sheath * st.fade * answerK;
      body.uSheath.value.y = W.sheath.line * api.light.sheath * st.fade * answerK * (0.55 + 0.45 * L);
      blow.light.value = (W.blow.rest + (W.blow.lit - W.blow.rest) * L) * (1 - c.veil);
      blow.object.visible = st.blowAt !== undefined && t - st.blowAt < W.blow.life + 1.5;      // (drawn only while a breath hangs: it was two draw calls a frame for the whole area)
      { const WL = c.waterLook; if (WL && WL.deep && WL.deep.isColor) body.uUnder.value.copy(WL.deep).multiplyScalar(W.under); }
      { const u = sea.uniforms.uSeaL.value; seaL.value.set(u.x, 0, 0, u.w);
        const lw = active && sea.front ? smooth(-6, 12, sea.front.behind(head.x, head.z)) * u.x : 0; body.uLit.value.w = lw * answerK * (1 - c.veil); }

      // ---- the curtains: while the flukes are in the air, water runs off whichever of their edges looks down. The plate of the flukes is
      // its two tips, the notch between them and the stock's end; the hind edge runs tip, notch, tip; a leading edge runs from the stock out to a tip
      {
        const C = W.curtain, cu = st.cur || (st.cur = { l: new THREE.Vector3(), r: new THREE.Vector3(), n: new THREE.Vector3(), o: new THREE.Vector3(), ok: false, on: false, t: 0, due: 0, last: -1e9 });
        if (active && st.phase === 'surfacing') {
          const tl = mk.fluke_L, tr = mk.fluke_R, n = mk.notch, i0 = Math.min(13, NS - 2) * 4, i1 = i0 + 4;
          const ox = (b[i0] + b[i1]) / 2, oy = (b[i0 + 1] + b[i1 + 1]) / 2, oz = (b[i0 + 2] + b[i1 + 2]) / 2;      // the stock's end, where the flukes begin
          const lv = (v) => v.y - water.heightAt(v.x, v.z), up = Math.max(lv(tl), lv(tr), lv(n));
          if (curtainK > 0 && up > 0.3 && dt > 0 && cu.ok) {
            if (!cu.on) { cu.on = true; cu.t = 0; cu.due = 0; if (!famPour) fire('pour', n.x, n.z, sw); }
            cu.t += dt; cu.due += dt * curtainK * (curtain.pool / C.pool) * (C.rate[0] + C.rate[1] * Math.exp(-cu.t / C.rate[2]));
            // how steeply each edge looks down (and a little of every edge always: water sheets off a plate that is flung up)
            let ax = n.x - ox, ay = n.y - oy, az = n.z - oz; const al = Math.hypot(ax, ay, az) || 1; ax /= al; ay /= al; az /= al;      // aft: out over the hind edge
            const cx = (tl.x + tr.x + ox) / 3, cy = (tl.y + tr.y + oy) / 3, cz = (tl.z + tr.z + oz) / 3;
            const outOf = (tip) => {      // out over a leading edge: square to it, in the plate, away from the plate's middle
              let ex = tip.x - ox, ey = tip.y - oy, ez = tip.z - oz; const el = Math.hypot(ex, ey, ez) || 1; ex /= el; ey /= el; ez /= el;
              let mx = (tip.x + ox) / 2 - cx, my = (tip.y + oy) / 2 - cy, mz = (tip.z + oz) / 2 - cz; const d = mx * ex + my * ey + mz * ez;
              mx -= ex * d; my -= ey * d; mz -= ez * d; const ml = Math.hypot(mx, my, mz) || 1;
              return [mx / ml, my / ml, mz / ml];
            };
            const oL = outOf(tl), oR = outOf(tr), base = 0.1;
            const wH = base + Math.max(0, -ay), wL = base + Math.max(0, -oL[1]), wR = base + Math.max(0, -oR[1]), wMax = Math.max(wH, wL, wR);
            const all = curtain.runnels[0].length + curtain.runnels[1].length, nH = curtain.runnels[0].length;
            for (; cu.due >= 1; cu.due -= 1) {
              let run = null, hind = false, wE = 0;
              for (let tries = 0; tries < 4 && !run; tries++) {
                const k = Math.floor(crnd() * all), q = k < nH ? curtain.runnels[0][k] : curtain.runnels[1][k - nH];
                hind = k < nH; wE = hind ? wH : q.left ? wL : wR;
                if (crnd() * wMax < wE * q.w) run = q;
              }
              if (!run) continue;
              const tip = run.left ? tl : tr, was = run.left ? cu.l : cu.r, f = run.f + (crnd() - 0.5) * 0.012;
              let x, y, z, px, py, pz, out;
              if (hind) { x = n.x + (tip.x - n.x) * f; y = n.y + (tip.y - n.y) * f; z = n.z + (tip.z - n.z) * f; px = cu.n.x + (was.x - cu.n.x) * f; py = cu.n.y + (was.y - cu.n.y) * f; pz = cu.n.z + (was.z - cu.n.z) * f; out = [ax, ay, az]; }
              else { x = ox + (tip.x - ox) * f; y = oy + (tip.y - oy) * f; z = oz + (tip.z - oz) * f; px = cu.o.x + (was.x - cu.o.x) * f; py = cu.o.y + (was.y - cu.o.y) * f; pz = cu.o.z + (was.z - cu.o.z) * f; out = run.left ? oL : oR; }
              const level = water.heightAt(x, z);
              if (y - level < C.least) continue;                              // that part of the edge is in the water
              const kv = 0.85 / dt;                                            // (a drop keeps most of the edge's own speed as it lets go)
              curtain.drop(x, y - 0.02, z, (x - px) * kv + out[0] * 0.3 + (crnd() - 0.5) * 0.3, (y - py) * kv + out[1] * 0.3, (z - pz) * kv + out[2] * 0.3 + (crnd() - 0.5) * 0.3, level, (cu.rung = (cu.rung || 0) + 1) % C.ring === 0);
              cu.last = t;
            }
          } else if (cu.on && up < -0.3) cu.on = false;
          cu.l.copy(tl); cu.r.copy(tr); cu.n.copy(n); cu.o.set(ox, oy, oz); cu.ok = true;
        } else { cu.ok = false; cu.on = false; }
        curtain.landed((x, z) => water.ripple(x, z, 0.07 + 0.05 * crnd(), 0.14));
        curtain.light.value = (C.rest + (1 - C.rest) * L) * (1 - c.veil);
        curtain.object.visible = t - cu.last < 2.5;
      }

      // ---- the light on the water: the body's stations, and where its tail has been
      const now = whale.time, prints = whale.prints, Lt = W.light;
      let nb = 0, any = false, cx = 0, cz = 0, cn = 0;
      const UB = LU.uBody.value, UBB = LU.uBodyB.value;
      const put = (x, z, w, lit, wl) => { if (nb >= NB) return; UB[nb].set(x, z, w, lit); UBB[nb].set(wl, 0, 0, 0); nb++; if (lit > 0.004 || wl > 0) { any = true; cx += x; cz += z; cn++; } };
      if (active) {
        let hx = mk.snout.x - b[0], hz = mk.snout.z - b[2]; const hl = Math.hypot(hx, hz) || 1; hx /= hl; hz /= hl;
        const litOf = (y, rad, x, z) => { const depth = water.heightAt(x, z) - (y + rad); return depth > 0.15 ? Math.min(0.66, 0.92 * Math.pow(clamp01(1 - depth / Lt.range), 0.8)) * (0.4 + 0.6 * clamp01(depth / 2.5)) * st.fade : 0; };
        const snLit = litOf(mk.snout.y, 0.9, mk.snout.x, mk.snout.z);
        put(mk.snout.x + hx * 1.8, mk.snout.z + hz * 1.8, 1.2, 0, 0);
        put(mk.snout.x, mk.snout.z, (0.9 * Lt.wide + 0.9) * (0.6 + 0.4 * snLit / 0.6), snLit, 0);
        const flukes = 0.5 * Math.hypot(mk.fluke_L.x - mk.fluke_R.x, mk.fluke_L.z - mk.fluke_R.z);
        let lastLit = 0, lastW = 2;
        for (let k2 = 0; k2 < NS; k2++) {
          const x = b[k2 * 4], y = b[k2 * 4 + 1], z = b[k2 * 4 + 2], a = sec[k2][0], up = sec[k2][1], dn = sec[k2][2];
          const lit = litOf(y, up, x, z), wide = Math.max(a * Lt.wide + 0.9, k2 === NS - 1 ? flukes + 0.4 : k2 === NS - 2 ? 0.45 * flukes : 0) * (0.6 + 0.4 * lit / 0.6);
          // the line where this part of it stands out of the water: half its width there (0: it is under, or wholly in the air)
          const hgt = water.heightAt(x, z) - y; let wl = 0;
          if (hgt < up && hgt > -dn) wl = Math.max(0.05, a * Math.sqrt(Math.max(0, 1 - (hgt >= 0 ? (hgt / up) * (hgt / up) : (hgt / dn) * (hgt / dn)))));
          put(x, z, wide, lit, wl * st.fade);
          lastLit = lit; lastW = wide;
        }
        tail.set(b[(NS - 1) * 4], 0, b[(NS - 1) * 4 + 2]);
        if (t - st.histAt > 0.5) { st.histAt = t; st.hist.unshift({ x: tail.x, z: tail.z, lit: lastLit, w: lastW, t }); if (st.hist.length > 10) st.hist.pop(); }
      }
      // (the water stays lit a moment where it has passed: the smear is longer than the whale)
      for (const h of st.hist) { const age = t - h.t; if (age > Lt.after * 3.2) continue; put(h.x, h.z, h.w * (1 - 0.3 * clamp01(age / (Lt.after * 3))), h.lit * Math.exp(-age / Lt.after), 0); }
      LU.uBodyN.value = nb;
      // the prints: the family says where and when; here they are rings in the sea's marks
      let np = 0; const UP = LU.uPrint.value, UPB = LU.uPrintB.value;
      // (the water churned round its tailstock while the flukes stand: the footprint begins there, before they have gone)
      if (active && st.flukeT > 0 && mk.notch.y > water.heightAt(mk.notch.x, mk.notch.z) - 0.5) {
        const k2 = clamp(outFirst < 0 ? NS - 1 : outFirst, 0, NS - 1), age = t - st.flukeT;
        st.churn = { x: b[k2 * 4], z: b[k2 * 4 + 2], r: 2.0 + 3.6 * smooth(0, 3.5, age), k: smooth(0, 1.2, age), t };
      }
      if (st.churn) {
        const q = st.churn, k = q.k * (1 - smooth(0.3, 2.2, t - q.t));      // (it lets go as the footprint itself opens)
        if (k > 0.01) { UP[np].set(q.x, q.z, q.r, 0.1); UPB[np].set(0.85 * k, 0.56 * k, t * 0.2, 9.1); np++; any = true; cx += q.x * 2; cz += q.z * 2; cn += 2; } else if (t - q.t > 3) st.churn = null;
      }
      let footAt = null;
      for (let i = prints.length - 1; i >= 0 && np < NP; i--) {
        const q = prints[i], foot = q.kind === 'foot', K = foot ? W.foot : W.print, age = now - q.t;
        if (age < 0 || age > K.life) continue;
        const a = age / K.life, r = q.r * (0.4 + 0.6 * smooth(0, K.open, age) + 0.35 * a);
        if (q.k === undefined) q.k = foot ? 1 : clamp01(st.fade * 1.4);      // (a print is as strong as the whale's light was when it was made: none kindles after that has gone out)
        if (q.k < 0.02) continue;
        UP[np].set(q.x, q.z, r, a); UPB[np].set(K.ring * q.k, K.heart * q.k, age * K.turn * (i % 2 ? 1 : -1), 3.7 * i + q.x * 0.13);
        if (foot && !footAt) footAt = { x: q.x, z: q.z, age };
        np++; any = true; cx += q.x * 2; cz += q.z * 2; cn += 2;
      }
      LU.uPrintN.value = np;
      // the one long ring that leaves the footprint (the same hump whale.lift() gives to what floats)
      if (footAt && footAt.age < 7) { const g = W.foot.wave; LU.uRing.value.set(footAt.x, footAt.z, g[0] + g[1] * footAt.age, g[2] * smooth(0, 0.8, footAt.age) * (1 - smooth(2.5, 7, footAt.age))); cx += boat.x; cz += boat.z; cn += 1; } else LU.uRing.value.w = 0;
      light.mesh.visible = any && answerK > 0.01 && api.light.gain > 0.001;
      light.slick.visible = light.mesh.visible && np > 0 && L > 0.02;
      if (light.mesh.visible) {
        // the patch lies over the whale and its prints (the whale first: if all of it will not fit, it keeps the whale)
        let px = cx / cn, pz = cz / cn;
        if (active) { const mx = (mk.snout.x + tail.x) / 2, mz = (mk.snout.z + tail.z) / 2, reach = light.half - 20; px = mx + clamp(px - mx, -reach, reach); pz = mz + clamp(pz - mz, -reach, reach); }
        light.place(px, pz);
        LU.uHull.value.set(boat.x, boat.z, Math.cos(boat.heading), -Math.sin(boat.heading));
        LU.uGain.value.set(api.light.gain * answerK, api.light.bright * (1 + 0.3 * L) * (1 - c.veil), L, W.foot.slick * L * answerK);      // (at rest there is no light of the sea's to quiet: a veil of the water's colour over the resting sea was a pale wedge)
        LU.uNear.value.w = 1 + litK * L;      // (on the lit sea more of its marks are lit: see the shader)
        const WL = c.waterLook; if (WL && WL.deep && WL.deep.isColor) LU.uSlick.value.copy(WL.deep).lerp(WL.shallow, 0.25);
      }

      // ---- what it writes into the water's trace (the water's own light, on the area's scale): lines along both sides
      // of a back that is out, a broad dab over one that is about to come out, and the line where its flukes' water lands
      if (active && st.phase === 'surfacing' && t - st.traceAt > 0.12) {
        st.traceAt = t; const TR = W.trace;
        for (let k2 = Math.max(1, outFirst); k2 <= outLast; k2++) {
          const wa = UBB[k2 + 1].x, wb = UBB[k2 + 2].x;      // (stations lie two places on in the list: the point ahead of the snout and the snout come first)
          if (!(wa > 0 && wb > 0)) continue;
          const x0 = b[(k2 - 1) * 4], z0 = b[(k2 - 1) * 4 + 2], x1 = b[k2 * 4], z1 = b[k2 * 4 + 2], ux = x1 - x0, uz = z1 - z0, ul = Math.hypot(ux, uz) || 1, nx = -uz / ul, nz = ux / ul;
          writeLine(x0 + nx * wa, z0 + nz * wa, x1 + nx * wb, z1 + nz * wb, TR.backRadius, TR.back); writeLine(x0 - nx * wa, z0 - nz * wa, x1 - nx * wb, z1 - nz * wb, TR.backRadius, TR.back);
        }
        if (outFirst < 0 && api.depth < 2 && sw.speed > 0.5) writeDab(b[4 * 2], b[4 * 2 + 2], 1.7, TR.rising * (1 - api.depth / 2));
        const fl = Math.min(mk.fluke_L.y - water.heightAt(mk.fluke_L.x, mk.fluke_L.z), mk.fluke_R.y - water.heightAt(mk.fluke_R.x, mk.fluke_R.z));
        if (fl > 0.4 && st.flukeT > 0 && t - st.flukeT < 5.5) { writeLine(mk.fluke_L.x, mk.fluke_L.z, mk.notch.x, mk.notch.z, TR.flukeRadius, TR.flukes); writeLine(mk.notch.x, mk.notch.z, mk.fluke_R.x, mk.fluke_R.z, TR.flukeRadius, TR.flukes); }
      }

      // ---- for looking: what it told the realm, and a track of it
      const logAt = num('whlog', 0);
      if (logAt) {
        if (active && st.track.length < 4000) st.track.push([+t.toFixed(2), +(T ?? -1).toFixed(2), +c.s.toFixed(1), +head.x.toFixed(2), +head.y.toFixed(2), +head.z.toFixed(2), +api.depth.toFixed(2), +(mk.notch.y - water.heightAt(mk.notch.x, mk.notch.z)).toFixed(2), +(mk.dorsal.y - water.heightAt(mk.dorsal.x, mk.dorsal.z)).toFixed(2), +Math.hypot(mk.notch.x - boat.x, mk.notch.z - boat.z).toFixed(1), +Math.hypot(head.x - boat.x, head.z - boat.z).toFixed(1), +sw.speed.toFixed(2), outFirst, outLast, +boat.x.toFixed(2), +boat.z.toFixed(2)]);
        if (st.lifts === undefined) st.lifts = [];      // (the boat's lift, logged whether the whale is there or not: [t, T, metres laid on, the hull's height])
        if ((st.lifted || 0) > 0.002) st.liftAt = t;
        if (st.lifts.length < 4000 && st.liftAt !== undefined && t - st.liftAt < 1.5) st.lifts.push([+t.toFixed(2), +(T ?? -1).toFixed(2), +(st.lifted || 0).toFixed(3), +((ctx.engine.boat && ctx.engine.boat.tilt ? ctx.engine.boat.tilt.position.y : 0)).toFixed(3)]);
        if (!st.sent && t >= logAt) { st.sent = true; fetch('/__shot/' + (params.get('whlogto') || 'sea_wh_log.json'), { method: 'POST', body: JSON.stringify({ log, times: api.times, wheel: st.wheel, cols: 't,T,s,hx,hy,hz,depth,notchUp,finUp,notchToBoat,headToBoat,speed,outFirst,outLast,bx,bz', track: st.track, lifts: st.lifts || [],
          lit: { fade: +st.fade.toFixed(3), gain: [LU.uGain.value.x, LU.uGain.value.y, LU.uGain.value.z, LU.uGain.value.w], boat: [+boat.x.toFixed(1), +boat.z.toFixed(1)], body: LU.uBody.value.slice(0, LU.uBodyN.value).map((v) => [+v.x.toFixed(1), +v.y.toFixed(1), +v.z.toFixed(2), +v.w.toFixed(3)]) } }) }); }      // (lit: how lit the water is over each of its stations as this is written: x, z, half width, light)
      }
    },
  };
}
