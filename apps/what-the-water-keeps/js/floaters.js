// Floaters: things that lie on the water. Lily pads, rafts of petals, leaves afloat, feathers, spent wings, seed tufts,
// clumps of foam; ice pans, a crate, a plank, a boom. The page is docs/life/falls.md; what falls is in falls.js.
//
//   makeFloaters(ctx, opts)   many small things lying on the water, in one draw call. Each rides the ripple field (it
//                             tips to the slope of every ring that passes under it, and a limp thing bends over it), is
//                             shouldered aside by the bow and closes in behind, parts along the lanes written in the
//                             water's trace, and drifts with the current. All of it in the vertex shader: nothing is
//                             kept per floater in script. It can take what has just fallen (falls.js: settleOn)
//   makeDrifters(ctx, opts)   a few heavy things with their places kept in script: ice pans (circles the boat pushes, that
//                             nudge one another), a crate, a plank, the baulks of a boom. They ride the same field
//   floatRide(ctx, opts)      the gouache extension that makes any model ride the water where it stands
//                             (kit.model(file, { live: true, extend: floatRide(ctx, { size: 0.6 }) }))
//   padGeometry(), panGeometry()   the default pad and pan (an area may pass its own modelled geometry instead)
//
// The water is one flat sheet whose rings are in its shading, so nothing here is ever under it: a floater is lifted a
// few millimetres clear and tipped by the slope the water's own field gives (docs/water.md, "For shader authors").
import * as THREE from 'three';
import { WATER_GLSL, waterUniforms } from '../water-final.js';
import { cardGeometry, lifeHull, lifeTime, LANE_N, GLARE_GLSL, GLARE_PARS, glareUniforms } from './falls.js';

const TAU = Math.PI * 2;
const col = (c) => (c && c.isColor ? c : new THREE.Color(c ?? '#ffffff'));
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const smooth = (a, b, x) => { if (a === b) return x >= b ? 1 : 0; const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const pair = (v, d) => (Array.isArray(v) ? v : v == null ? d : [v, v]);
const ALWAYS = -1e9;
// How much of the painted light a wet petal lying on the water gives back, and how much of what the water mirrors there
// it gives back at a glancing angle: the water's own numbers for its petal skin (TUNE.wet.petal and TUNE.glance in
// water-final.js, which does not export them). Floaters that double the skin are lit by the same rule, or they show.
const SKIN_WET = 0.42, SKIN_GLANCE = 0.3;

// The water's shared uniforms for WATER_GLSL, with a swell of our own keeping: copied here only while the water says a
// swell is up, and nothing otherwise. (When this was written the water's shared uSwell started out as three default
// vectors (0, 0, 0, 1), which waterSwell() read as three waves a metre high; water-final.js now starts it at nothing,
// and this guard stays so that a floater can never be lifted by a swell the water is not drawing.)
const WATERS = new WeakMap();
function lifeWater(ctx) {
  let w = WATERS.get(ctx);
  if (!w) {
    const shared = waterUniforms(ctx.engine);
    const still = new THREE.DataTexture(new Uint8Array([0, 0, 0, 0]), 1, 1); still.needsUpdate = true;
    w = { tRipple: shared.tRipple, uRippleRect: shared.uRippleRect, tTrace: shared.tTrace, uTraceRect: shared.uTraceRect,
      uSwell: { value: [new THREE.Vector4(0, 0, 0, 0), new THREE.Vector4(0, 0, 0, 0), new THREE.Vector4(0, 0, 0, 0)] },
      // The water keeps two ripple windows (water-final-sim.js): a wide one, which it shares (tRipple: waves of 0.8 m
      // and longer), and a fine one of 16 m round the boat (rings of 0.2 and 0.4 m: the ones a pad or a petal rocks
      // on), which it does not share yet. Until it does, it is read from the water itself, just before each draw.
      tLifeFine: { value: still }, uLifeFine: { value: new THREE.Vector4(0, 0, 0, 0) } };
    Object.defineProperty(w, 'refresh', { enumerable: false, value: () => {      // (not a uniform: kept out of the spread)
      const sim = ctx.water && ctx.water.sim, f = sim && sim.fine, tex = f && sim.auxFine;
      if (tex && f.win) { w.tLifeFine.value = tex; w.uLifeFine.value.set(f.win.x, f.win.y, f.size || f.win.z, 0); }
      else { w.tLifeFine.value = still; w.uLifeFine.value.set(0, 0, 0, 0); }
    } });
    WATERS.set(ctx, w);
    ctx.onUpdate(() => { const up = !!(ctx.water && ctx.water.swellOn); for (let i = 0; i < 3; i++) { if (up) w.uSwell.value[i].copy(shared.uSwell.value[i]); else w.uSwell.value[i].set(0, 0, 0, 0); } });
    ctx.onDispose(() => still.dispose());
  }
  return w;
}
// GLSL (after WATER_GLSL): the slope of the water under a floating thing `across` metres wide, from both windows, each
// read at the thing's own size, so that a pad answers the rings it can feel and ignores what is finer than itself.
const SLOPE_GLSL = /* glsl */`
  uniform sampler2D tLifeFine; uniform vec4 uLifeFine;
  vec2 floSlope(vec2 p, float across) {
    vec2 s = vec2(0.0), uv = (p - uRippleRect.xy) / uRippleRect.zw + 0.5, e = min(uv, 1.0 - uv);
    if (min(e.x, e.y) > 0.0) s = textureLod(tRipple, uv, max(0.0, log2(0.6 * across * float(textureSize(tRipple, 0).x) / uRippleRect.z))).xy * smoothstep(0.0, 0.08, min(e.x, e.y));
    if (uLifeFine.z > 0.0) {
      uv = (p - uLifeFine.xy) / uLifeFine.z + 0.5; e = min(uv, 1.0 - uv);
      if (min(e.x, e.y) > 0.0) s += textureLod(tLifeFine, uv, max(0.0, log2(0.6 * across * float(textureSize(tLifeFine, 0).x) / uLifeFine.z))).xy * smoothstep(0.0, 0.08, min(e.x, e.y));
    }
    return s;
  }
  // a slope as a floating thing at p may take it: no steeper than 'most', and never further away from the eye than the
  // eye can see over it
  vec2 floSee(vec2 sl, vec2 p, float most) {
    sl = clamp(sl, -most, most);
    vec2 d = p - uCameraPos.xz; float len = max(length(d), 0.3); d /= len;
    float g = 0.75 * max(uCameraPos.y, 0.2) / len, a = dot(sl, d);
    return a < -g ? sl - d * (a + g) : sl;
  }
`;

// ------------------------------------------------------------------------------------------------ making way for the hull
// Shared GLSL: how far a thing resting at p must give way to the rider's hull and to the lane it has just left.
// The hull is a line from stem to stern with a half width; behind it the boat's own track is remembered for a while
// (falls.js, lifeHull), and the lane along it narrows with age until it has closed. A thing in the way is moved
// straight out to the side, and its neighbours beyond it are crowded up a little, as a bow wave does.
export const LANE_GLSL = /* glsl */`
  #define LANE_N ${LANE_N}
  uniform vec4 uLifeHull, uLifeHullB;      // stern x, z, stem x, z (at the waterline); half width, places on the track, the boat's speed, the realm's time
  uniform vec4 uLifeLane[LANE_N];          // the track, newest first: x, z, when the boat's middle was there, weight
  // one stretch of the lane, wa and wb wide (half widths of clear water) at its ends; the shove reaches 'within' beyond that
  vec3 laneStretch(vec2 p, vec2 a, vec2 b, float wa, float wb, float within, float side, vec3 best) {
    vec2 ab = b - a, ap = p - a; float t = clamp(dot(ap, ab) / max(dot(ab, ab), 1e-6), 0.0, 1.0);
    vec2 d = ap - ab * t; float dist = length(d), w = mix(wa, wb, t), q = w * (1.0 - dist / (w + within));
    if (q > best.z) best = vec3(dist > 0.02 ? d / dist : normalize(vec2(-ab.y, ab.x) + vec2(1e-5, 0.0)) * side, q);
    return best;
  }
  // aside: how much clear water the hull keeps beyond its own side; within: how far out its shove is still felt;
  // close: seconds the lane behind takes to close (0 = it closes at the stern); seed: 0..1, which way a thing dead ahead goes
  vec2 lanePush(vec2 p, float aside, float within, float close, float seed) {
    vec2 rel = p - uBoat.xz;
    if (dot(rel, rel) > 4900.0) return vec2(0.0);
    float side = seed < 0.5 ? -1.0 : 1.0, W = uLifeHullB.x + aside;
    vec2 stern = uLifeHull.xy, bow = uLifeHull.zw, fwd = normalize(bow - stern + vec2(1e-5, 0.0));
    // first the lane the boat has left behind it, closing with age ...
    vec3 best = vec3(0.0);
    if (close > 0.0) {
      vec2 a = uBoat.xz; float wa = 0.92 * W; int n = int(uLifeHullB.y + 0.5);
      for (int i = 0; i < LANE_N; i++) {
        if (i >= n) break;
        float age = uLifeHullB.w - uLifeLane[i].z;
        float wb = 0.92 * W * (1.0 - smoothstep(0.15 * close, close, age)) * uLifeLane[i].w;
        if (wa + wb > 0.002) best = laneStretch(p, a, uLifeLane[i].xy, wa, wb, within, side, best);
        a = uLifeLane[i].xy; wa = wb;
      }
    }
    vec2 moved = best.xy * best.z;
    // ... then the hull itself, which has the last word: whatever the lane did, nothing is left inside the boat
    best = laneStretch(p + moved, bow + fwd * 0.3, bow - fwd * 0.85, 0.04, W, within, side, vec3(0.0));     // the stem parts them, the shoulder moves them
    best = laneStretch(p + moved, bow - fwd * 0.85, stern - fwd * 0.1, W, 0.92 * W, within, side, best);
    return moved + best.xy * best.z;
  }
`;

// ------------------------------------------------------------------------------------------------ the kinds
// What each kind is, in numbers. Lengths in metres. Every key can be overridden in makeFloaters' options.
//   size      [smallest, largest] across;   lift: how far clear of the water it lies
//   tip       how far a ring's slope tips it, in times the water's own slope. The water's rings are low and are seen
//             mostly by what they do to the mirror, so a thing lying on them is tipped about six times as far, which is
//             what agrees with the eye (measured: a strong ring through a raft of pads shows nothing at 1.5 and rocks each
//             leaf in turn at 6); most: the steepest it is ever tipped (rise per metre: 0.2 is 11 degrees). And it is never
//             tipped further AWAY from the eye than the eye can see over it: the wave that would hide its far side is
//             not drawn, and without this a pad ten metres off would show its underside to a rider 1.1 m above the water;
//             limp: 0 a stiff thing tipped whole .. 1 a limp one that bends over the ring passing under it
//   aside     how much clear water the hull keeps beyond its own side; within: how far out its shove is felt;
//             close: seconds the lane behind takes to close; tether: how far it can be moved at all (0 = free)
//   turning   radians a second it turns of itself (each its own way); bob: metres it rises and falls
//   top, under   colours of its two faces (lists: one picked for each); backlight;
//   tone      how light its paint is drawn (1 = as painted: a thing lying flat takes the whole sky, so a leathery leaf wants less)
//   rafts     0..1: how much a field of them gathers into loose rafts with open water between (0 = evenly strewn)
//   crisp     true: kept out of the painter's filter (the small thin kinds: a floating petal ten metres off is a sliver
//             two pixels high, which the filter would wipe); pads and foam are broad and stay painted
export const FLOAT_KINDS = {
  // A water-lily pad: a leathery disc with a notch to its stalk, olive above and bronze beneath, tethered by the stalk.
  // It lies flat and limp on the water, so a ring crossing a raft is seen as a wave of rocking leaves.
  pad: { shape: 'pad', size: [0.28, 0.46], lift: 0.006, tip: 6, most: 0.2, limp: 1, aside: 0.12, within: 0.9, close: 6, tether: 0.75, turning: 0, bob: 0,
    top: ['#6B6E32', '#5F6A30', '#74733A', '#586028'], under: ['#6A3A20', '#744426'], tone: 0.6, backlight: 0.2, backColor: '#FFE7A8', brush: 0.5, shade: 0.8, curl: 0.3, gap: 0.8 },
  // A fallen petal: a small dish, tipped by every ring; gathered into loose rafts with open water between.
  petal: { shape: 'kite', size: [0.05, 0.07], crisp: true, lift: 0.004, tip: 5, most: 0.22, limp: 0, aside: 0.1, within: 1.0, close: 25, tether: 0, turning: 0.03, bob: 0,
    top: ['#DDD0D6', '#D6C8D2', '#E4D8DA'], under: ['#D0A0AA', '#D6AEB6'], backlight: 0.2, brush: 0.2, shade: 0.5, curl: 0.5, gap: 0, rafts: 0.6 },
  // A beech leaf afloat, its edges curled up like a small boat, each at its own angle.
  leaf: { shape: 'leafkite', size: [0.075, 0.1], crisp: true, lift: 0.005, tip: 5, most: 0.24, limp: 0, aside: 0.2, within: 1.2, close: 20, tether: 0, turning: 0.02, bob: 0,
    top: ['#B5522A', '#7A3B22', '#C08A3A', '#B5522A', '#5A2630', '#9C4526'], under: ['#9A5A34', '#6E3E2A', '#A8804A', '#9A5A34', '#523038', '#8A4A2E'], backlight: 0.3, backColor: '#ff6a3a', brush: 0.45, shade: 0.9, curl: 1, flat: true, gap: 0 },
  // A feather on the water: bowed, its two ends clear of the surface; it turns with any breath.
  feather: { shape: 'feather', size: [0.09, 0.14], crisp: true, lift: 0.01, tip: 5, most: 0.24, limp: 0, aside: 0.15, within: 1.0, close: 8, tether: 0, turning: 0.06, bob: 0,
    top: ['#F2B8C2', '#F3C6CC', '#EFAAB8'], under: ['#F6D2D6', '#F8DCDE'], backlight: 0.3, brush: 0.2, shade: 0.8, curl: 0.2, gap: 0 },
  // A spent mayfly: a pale cross lying flat, turning at a tenth of a radian a second.
  wing: { shape: 'wing', size: [0.11, 0.13], crisp: true, lift: 0.004, tip: 5, most: 0.2, limp: 0, aside: 0.12, within: 1.0, close: 6, tether: 0, turning: 0.1, bob: 0,
    top: ['#EDE5C8'], under: ['#E2D8B6'], backlight: 0.4, backColor: '#FFE7A8', brush: 0.15, shade: 0.6, curl: 0, gap: 0 },
  // A tuft of reedmace down afloat: the seed in the water, its hairs standing.
  down: { shape: 'tuft', size: [0.022, 0.034], crisp: true, lift: 0.002, tip: 5, most: 0.25, limp: 0, aside: 0.12, within: 1.0, close: 5, tether: 0, turning: 0.05, bob: 0,
    top: ['#D8C79A', '#CDBB8A'], under: ['#B9A56E'], backlight: 0.8, backColor: '#FFE7A8', brush: 0, shade: 0.5, curl: 0, gap: 0 },
  // A clump of dye foam: matte, ragged, a hand high; it turns once in half a minute.
  foam: { shape: 'foam', size: [0.4, 0.9], lift: 0.01, tip: 4, most: 0.2, limp: 0.7, aside: 0.15, within: 1.0, close: 4, tether: 0, turning: 0.2, bob: 0.004,
    top: ['#7E6672', '#88707A'], under: ['#5E4A54'], backlight: 0, brush: 0.6, shade: 0.6, glare: 0.5, curl: 0, gap: 0.6 },
};

export const PAD_HUB = 0.105;                 // where the stalk joins a pad of one unit across: this far from its middle toward the notch
/**
 * A lily pad (Nymphaea alba), one unit across, lying flat, its notch toward +Z (as the modelled one, lily_pad.glb):
 * sixty-two triangles. A leathery disc a little longer than wide, cleft by a narrow notch (18 degrees) from the rim to
 * where the stalk joins, 0.39 of the way across; the two lobes a little long; the margin entire, ROUND (thirty-six
 * points: beside the hull a pad is 300 pixels across, and fewer show as corners) and never quite a circle. Olive is
 * the material's colour; the paint here is the pale place at the stalk and the worn, darker rim. The veins are
 * painted by the floaters' own shader (they fan from PAD_HUB), on this pad and on a modelled one alike.
 */
export function padGeometry() {
  const P = [], C = [], I = [], RIM = 36, MID = 12, NOTCH = 0.16;
  const v = (x, y, z, c) => { P.push(x, y, z); C.push(c[0], c[1], c[2]); return P.length / 3 - 1; };
  const up = (a, b, c) => { const ux = P[b * 3] - P[a * 3], uz = P[b * 3 + 2] - P[a * 3 + 2], wx = P[c * 3] - P[a * 3], wz = P[c * 3 + 2] - P[a * 3 + 2]; if (uz * wx - ux * wz > 0) I.push(a, b, c); else I.push(a, c, b); };
  const hub = v(0, 0.004, PAD_HUB, [1.14, 1.12, 1.0]), mid = [], rim = [];
  for (let i = 0; i <= MID; i++) { const th = NOTCH * 2.4 + (TAU - NOTCH * 4.8) * i / MID, r = 0.27 + 0.008 * Math.sin(th * 3.0 + 1.0); mid.push(v(Math.sin(th) * r, 0.002, Math.cos(th) * r + 0.03, [1.02, 1.02, 0.98])); }
  for (let i = 0; i <= RIM; i++) {
    // the margin wanders slowly (two and five to the turn), with one shallow place where something has fed
    const th = NOTCH + (TAU - NOTCH * 2) * i / RIM, lobe = i === 0 || i === RIM, fed = Math.exp(-((th - 4.25) ** 2) / 0.012);
    const r = 0.5 * (lobe ? 1.035 : 1 + 0.016 * Math.sin(th * 2.0 + 0.6) + 0.009 * Math.sin(th * 5.0 + 2.1) - 0.045 * fed);
    const worn = Math.max(fed, Math.exp(-((th - 1.5) ** 2) / 0.05));
    rim.push(v(Math.sin(th) * r * 0.97, 0, Math.cos(th) * r, [0.88 - 0.08 * worn, 0.9 - 0.14 * worn, 0.84 - 0.18 * worn]));
  }
  for (let i = 0; i < MID; i++) up(hub, mid[i + 1], mid[i]);
  let m = 0;                                              // the band between the inner ring and the rim (three rim points to each inner one)
  for (let i = 0; i < RIM; i++) {
    const want = Math.min(MID, Math.round((i + 1) * MID / RIM));
    up(mid[m], rim[i + 1], rim[i]);
    if (want > m) { up(mid[m], mid[m + 1], rim[i + 1]); m++; }
  }
  up(hub, mid[0], rim[0]); up(hub, rim[RIM], mid[MID]);   // the two lobes close the notch down to the stalk
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
  g.setIndex(I); g.computeVertexNormals();
  return g;
}
/**
 * A tuft of reedmace down afloat: the seed lying in the water and a dozen hairs standing up and out of it at every
 * height, no two the same length: a tuft, never a flat star. One unit across. 14 triangles.
 */
export function tuftGeometry() {
  const P = [], C = [], I = [];
  const v = (x, y, z, c) => { P.push(x, y, z); C.push(c, c, c); return P.length / 3 - 1; };
  const s0 = v(-0.07, 0.02, 0, 0.45), s1 = v(0, 0.02, -0.12, 0.45), s2 = v(0.07, 0.02, 0, 0.45), s3 = v(0, 0.02, 0.12, 0.45);
  I.push(s0, s2, s1, s0, s3, s2);
  for (let i = 0; i < 12; i++) {
    const h = (k) => { const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return x - Math.floor(x); };
    const a = (i + 0.7 * h(1)) / 12 * TAU, el = 0.35 + 0.95 * h(2), len = 0.3 + 0.2 * h(3), c = Math.cos(el) * len;
    const a0 = v(Math.cos(a - 1.2) * 0.014, 0.03, Math.sin(a - 1.2) * 0.014, 1), a1 = v(Math.cos(a + 1.2) * 0.014, 0.03, Math.sin(a + 1.2) * 0.014, 1), t = v(Math.cos(a) * c, 0.03 + Math.sin(el) * len, Math.sin(a) * c, 1.1);
    I.push(a0, t, a1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
  g.setIndex(I); g.computeVertexNormals();
  return g;
}
/**
 * A clump of foam: a low mound of froth with a lobed outline and a lumpy top, one unit across (its outline is varied for
 * each in the shader; twenty points round it, so that the lobes are round and never spikes). 60 triangles.
 */
export function foamGeometry() {
  const P = [], C = [], I = [], N = 20;
  const v = (x, y, z, c) => { P.push(x, y, z); C.push(c, c, c); return P.length / 3 - 1; };
  const top = v(0.03, 0.085, -0.02, 1.1), mid = [], rim = [];
  for (let i = 0; i < N; i++) {
    const a = i / N * TAU, lump = 0.5 + 0.5 * Math.sin(a * 4 + 0.7) * Math.sin(a * 3 + 2.1);       // heaps of bubbles, and the hollows between them
    mid.push(v(Math.cos(a) * 0.31, 0.045 + 0.04 * lump, Math.sin(a) * 0.31, 0.86 + 0.24 * lump));
    rim.push(v(Math.cos(a) * 0.5, 0, Math.sin(a) * 0.5, 0.74));
  }
  for (let i = 0; i < N; i++) { const j = (i + 1) % N; I.push(top, mid[j], mid[i], mid[i], mid[j], rim[j], mid[i], rim[j], rim[i]); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
  g.setIndex(I); g.computeVertexNormals();
  return g;
}
const shapeGeometry = (shape) => (shape === 'pad' ? padGeometry() : shape === 'tuft' ? tuftGeometry() : shape === 'foam' ? foamGeometry() : cardGeometry(shape));

/**
 * The geometry of a modelled piece (a GLB made with tools/blender_lib/qc.py: docs/modelling.md), to hand to makeFloaters
 * or makeDrifters as `geometry`. The file is fetched once and counted like any model the realm uses.
 *   const pad = await lifeGeometry(ctx, 'models/life/lily_pad.glb');
 */
export async function lifeGeometry(ctx, file) {
  const m = await ctx.kit.model(file, {});
  m.group.removeFromParent();                             // only its geometry is wanted: the floaters draw it themselves
  return m.body.geometry;
}

// A lily pad's own painting, laid on in the fragment shader (thirteen to seventeen broad pale veins fanning from where
// the stalk joins, the one that runs away from the notch being the midrib; a wet, darker margin; on four pads in ten a
// browned patch). The strokes are a centimetre wide on purpose: the painter's filter keeps them on a pad beside the
// boat and lets them go on a pad five metres off, which is then one flat leaf, as a painter would leave it.
const PAD_PAINT = /* glsl */`
          { vec2 pq = vFloPiece.xy - vec2(0.0, ${PAD_HUB.toFixed(3)}); float pl = length(pq), pn = 13.0 + 2.0 * floor(vFloPiece.z * 2.99), pr = length(vFloPiece.xy) * 2.0;
            float pk = abs(fract(atan(pq.x, -pq.y) / 6.2831853 * pn + 0.5) - 0.5) / pn * 6.2831853 * pl;
            float vein = (1.0 - smoothstep(0.005, 0.021, pk)) * smoothstep(0.03, 0.1, pl) * (1.0 - smoothstep(0.6, 0.95, pr));
            albedo = mix(albedo, albedo * vec3(1.36, 1.32, 1.04) + 0.012, vein * 0.5);
            albedo *= 1.0 - 0.24 * smoothstep(0.87, 1.0, pr);
            vec2 bq = vFloPiece.xy - 0.28 * vec2(cos(vFloPiece.z * 40.0), sin(vFloPiece.z * 40.0));
            albedo = mix(albedo, albedo * vec3(1.05, 0.74, 0.5), 0.55 * (1.0 - smoothstep(0.05, 0.17, length(bq))) * step(0.62, fract(vFloPiece.z * 7.3))); }`;

// ------------------------------------------------------------------------------------------------ makeFloaters
/**
 * Many small things lying on the water, in one draw call. opts (every key of FLOAT_KINDS[kind] may be overridden too):
 *   kind        'pad' | 'petal' | 'leaf' | 'feather' | 'wing' | 'down' | 'foam'
 *   Where they lie, one of:
 *   items       [{ x, z, size, turn, flip, rock }]   placed by hand (flip: true = wrong side up; rock: 0..1 = still rocking
 *               when the realm loads, settling over `settle` seconds)
 *   scatter     { count, s: [from, to], d: [left, right] (or area: [x0, z0, x1, z1]), where: (x, z) => 0..1, avoid: [{ x, z, r }],
 *                 rafts: [{ s: [..], d: [..], count }] }   strewn (with `gap` they keep their distance, as pads do);
 *               `where` thins them (0 none .. 1 all); rafts are oval patches thickest in the middle
 *   around      [width, depth] with count: a field that goes with the boat (the petals round the hull): what leaves one
 *               side comes in at the other, out at the edge of sight
 *   pool        how many more can be taken from what falls (settleOn in falls.js; or handle.add(x, z))
 *   geometry    your own modelled piece instead of the kind's: one unit across, lying flat with its upper face up, with
 *               its own vertex paint (which is then its upper colour: `top` only tints it). From a model file:
 *               await lifeGeometry(ctx, 'models/life/lily_pad.glb')
 *   cover       0..1: how many of them are out (raise it as a fall lands; each comes and goes softly)
 *   skin        { map, scale, tone }: the water's own skin picture and its metres per repeat: floaters lie only where the
 *               skin has a petal and take its colour there (times `tone`, default 0.62), so the two agree. `coverage`: { map, rect: [cx, cz, sx, sz] } a standing map likewise
 *   drift       metres a second along the route (or [x, z] for a field that goes with the boat); `shuttle`: metres a
 *               fixed one travels before it comes round again (default 14); with `shuttle: 0` they drift on instead,
 *               and `until` (metres along the route) is where something stops them: they gather against it
 *   landed      seconds one taken from a fall stays before it has soaked and gone (default 90)
 *   mirror      false (default): flat things show nothing in the mirror
 *   tone        how light its paint is drawn (see FLOAT_KINDS); glare: the brightest its paint may be (default 0.86)
 *   rafts, raftSize   0..1 how much a field gathers into loose rafts, and metres across one (default 2.2)
 *   settle      seconds over which `rock` dies away (default 30); band: metres deep the drift gathered at `until` lies (1.5)
 *   seed, exact, parent
 * Returns { object, kind, count, pool, cover (0..1), drift (m/s), add(x, z, { turn, size, flip }), uniforms }.
 */
export function makeFloaters(ctx, opts = {}) {
  const { kit, engine } = ctx;
  const K = FLOAT_KINDS[opts.kind || 'pad'];
  if (!K) throw new Error(`makeFloaters: no kind called '${opts.kind}'`);
  const o = { kind: 'pad', items: null, scatter: null, around: null, count: 0, pool: 0, geometry: null, cover: 1, skin: null, coverage: null, drift: 0, shuttle: 14, landed: 90, until: null,
    mirror: false, seed: 53, exact: false, parent: null, settle: 30, ...K, ...opts };
  const calm = !!ctx.reducedMotion, rnd = ctx.rng(o.seed), hull = lifeHull(ctx), clock = lifeTime(ctx), size = pair(o.size, [0.1, 0.1]);
  const thin = (n) => (o.exact || n <= 0 ? Math.max(0, Math.round(n)) : Math.max(1, kit.count(n)));
  const loc = {};

  // ---- where they lie
  const seats = [];                                       // x, z, size, turn, flip, rock, tx, tz (the way the current runs there), room
  // the way the current runs at a place, and how far a thing there can drift before `until` stops it
  const tangentAt = (x, z) => { ctx.path.locate(x, z, null, loc); return [loc.tx, loc.tz, o.until == null ? 1e6 : Math.max(0, o.until - loc.s - rnd() * (o.band ?? 1.5))]; };
  const seat = (x, z, s, turn, flip = 0, rock = 0) => { const t = o.around ? [0, 0, 1e6] : tangentAt(x, z); seats.push([x, z, s, turn, flip, rock, t[0], t[1], t[2]]); };
  const pickSize = () => size[0] + (size[1] - size[0]) * rnd();
  if (o.items) for (const it of o.items) seat(it.x, it.z, it.size ?? pickSize(), it.turn ?? rnd() * TAU, it.flip ? 1 : 0, it.rock ?? 0);
  if (o.scatter) {
    const sc = o.scatter, cell = Math.max(0.05, size[1] * (o.gap || 0)), grid = new Map(), key = (x, z) => `${Math.floor(x / cell)},${Math.floor(z / cell)}`;
    const free = (x, z, s) => {
      if (sc.avoid) for (const a of sc.avoid) if (Math.hypot(x - a.x, z - a.z) < a.r + s * 0.5) return false;
      if (!o.gap) return true;
      const cx = Math.floor(x / cell), cz = Math.floor(z / cell);
      for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) { const l = grid.get(`${cx + i},${cz + j}`); if (l) for (const q of l) if (Math.hypot(x - q[0], z - q[1]) < (s + q[2]) * 0.5 * o.gap) return false; }
      return true;
    };
    const strew = (n, pick) => {
      let made = 0;
      for (let tries = 0; made < n && tries < n * 30; tries++) {
        const p = pick(); if (!p) continue;
        const s = pickSize();
        if (sc.where && rnd() > sc.where(p[0], p[1])) continue;
        if (!free(p[0], p[1], s)) continue;
        if (o.gap) { const k = key(p[0], p[1]); if (!grid.has(k)) grid.set(k, []); grid.get(k).push([p[0], p[1], s]); }
        seat(p[0], p[1], s, rnd() * TAU); made++;
      }
    };
    if (sc.count) strew(thin(sc.count), () => {
      if (sc.area) return [sc.area[0] + (sc.area[2] - sc.area[0]) * rnd(), sc.area[1] + (sc.area[3] - sc.area[1]) * rnd()];
      const s = sc.s[0] + (sc.s[1] - sc.s[0]) * rnd(), d = sc.d[0] + (sc.d[1] - sc.d[0]) * rnd(), p = ctx.path.point(s, d, 0);
      return [p.x, p.z];
    });
    for (const r of sc.rafts || []) strew(thin(r.count), () => {
      // an oval patch, thickest in the middle
      const a = rnd() * TAU, q = Math.pow(rnd(), 0.62), s = (r.s[0] + r.s[1]) / 2 + Math.cos(a) * q * (r.s[1] - r.s[0]) / 2, d = (r.d[0] + r.d[1]) / 2 + Math.sin(a) * q * (r.d[1] - r.d[0]) / 2, p = ctx.path.point(s, d, 0);
      return [p.x, p.z];
    });
  }
  const nAround = o.around ? thin(o.count) : 0;
  for (let i = 0; i < nAround; i++) seat(0, 0, pickSize(), rnd() * TAU);
  const nStand = seats.length, nPool = thin(o.pool), N = Math.max(1, nStand + nPool);

  const aSeatArr = new Float32Array(N * 4), aSeedArr = new Float32Array(N * 4), aLifeArr = new Float32Array(N * 4), aWayArr = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const s = seats[i];
    aSeedArr[i * 4] = rnd(); aSeedArr[i * 4 + 1] = rnd(); aSeedArr[i * 4 + 2] = rnd(); aSeedArr[i * 4 + 3] = rnd();
    if (s) { aSeatArr.set([s[0], s[1], s[2], s[3]], i * 4); aLifeArr.set([ALWAYS, s[5], s[4], 0], i * 4); aWayArr.set([s[6], s[7], s[8]], i * 3); }
    else { aSeatArr.set([0, 0, 0, 0], i * 4); aLifeArr.set([ALWAYS, 0, 0, 0], i * 4); }      // a pool slot not yet used: no size
  }
  const base = o.geometry || shapeGeometry(o.shape), geo = new THREE.InstancedBufferGeometry();
  // how light the piece's own paint is on the whole (the under colour is laid over the paint's light and dark)
  let lum = 1;
  if (base.attributes.color) { const c = base.attributes.color; lum = 0; for (let i = 0; i < c.count; i++) lum += 0.3 * c.getX(i) + 0.55 * c.getY(i) + 0.15 * c.getZ(i); lum = Math.max(0.02, lum / c.count); }
  if (o.geometry && !opts.top) o.top = ['#ffffff'];                 // a modelled piece carries its own colour
  geo.index = base.index; for (const name of ['position', 'normal', 'color']) if (base.attributes[name]) geo.setAttribute(name, base.attributes[name]);
  const aSeat = new THREE.InstancedBufferAttribute(aSeatArr, 4), aLife = new THREE.InstancedBufferAttribute(aLifeArr, 4);
  aSeat.setUsage(THREE.DynamicDrawUsage); aLife.setUsage(THREE.DynamicDrawUsage);
  geo.setAttribute('aSeat', aSeat); geo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(aSeedArr, 4)); geo.setAttribute('aLife', aLife); geo.setAttribute('aWay', new THREE.InstancedBufferAttribute(aWayArr, 3));
  geo.instanceCount = N;

  const blank = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1); blank.needsUpdate = true;
  const palette = (list) => { const cs = (list || ['#ffffff']).map((c) => col(c).clone().multiplyScalar(o.tone ?? 1)); return Array.from({ length: 16 }, (_, i) => cs[i % cs.length].clone()); };
  const driftVec = Array.isArray(o.drift) ? o.drift : null;
  const U = {
    ...lifeWater(ctx), ...hull.uniforms, uLifeNow: clock.uLifeNow,
    uFloA: { value: new THREE.Vector4(o.lift, o.tip * (calm ? 0.6 : 1), o.most, o.limp) },
    uFloB: { value: new THREE.Vector4(o.aside, o.within, o.close, o.tether) },
    uFloC: { value: new THREE.Vector4(0, 0, o.turning, clamp(o.cover, 0, 1)) },           // drift so far (x, z; or metres along the route in x), turning, cover
    uFloD: { value: new THREE.Vector4(o.curl, o.bob, o.landed, o.settle) },
    uFloBox: { value: new THREE.Vector4(o.around ? o.around[0] : 0, o.around ? o.around[1] : 0, 0, 0) },
    uFloShuttle: { value: o.shuttle }, uFloLum: { value: lum }, ...glareUniforms(ctx, o.skin ? 100 : o.glare ?? 0.86), uFloRaft: { value: new THREE.Vector2(o.rafts || 0, o.raftSize || 2.2) },
    uFloTone: { value: new THREE.Color(1, 1, 1) }, uFloGlance: { value: new THREE.Vector4(0, 4.2, 0.02, 0) }, uFogColor: engine.shared.uFogColor,      // (the skin's tone and tint; its mirror at a glancing angle: reflectivity, exponent, floor, how much)
    uFloPaint: { value: new THREE.Color(1, 1, 1) },                                        // the realm's painted light on a level thing, worked out as the water works it out
    uFloTrace: { value: new THREE.Vector4(0, 2, 0.6, 0) },                                // is there a trace; which level of it to read; metres between taps
    tFloSkin: { value: o.skin && o.skin.map ? o.skin.map : blank }, uFloSkin: { value: new THREE.Vector2(o.skin ? 1 / (o.skin.scale || 3) : 1, o.skin && o.skin.map ? 1 : 0) },
    tFloCover: { value: o.coverage && o.coverage.map ? o.coverage.map : blank }, uFloCoverRect: { value: new THREE.Vector4(...(o.coverage ? o.coverage.rect : [0, 0, 1, 1])) }, uFloCoverOn: { value: o.coverage ? 1 : 0 },
    uFloPalA: { value: palette(o.top) }, uFloPalB: { value: palette(o.under || o.top) }, uFloPalN: { value: new THREE.Vector2(Math.min(16, (o.top || [1]).length), Math.min(16, (o.under || o.top || [1]).length)) },
  };
  const shape = o.shape;
  // (one that doubles the water's skin is lit exactly as the skin is, by the `light` hook below: no brush, backlight or cap of its own)
  const mat = kit.gouache({ color: '#ffffff', side: THREE.DoubleSide, vertexColors: !!base.attributes.color, backlight: o.skin ? 0 : o.backlight ?? 0, backColor: o.backColor ?? '#ffffff', brush: o.skin ? 0 : o.brush ?? 0.4, shade: o.shade ?? 0.8, crisp: !!o.crisp && !o.skin,
    extend: {
      uniforms: U,
      vertexPars: /* glsl */`
        ${WATER_GLSL} ${SLOPE_GLSL} ${LANE_GLSL}
        attribute vec4 aSeat, aSeed, aLife; attribute vec3 aWay;
        uniform float uLifeNow, uFloShuttle, uFloCoverOn; uniform vec3 uFloTone; uniform vec2 uFloRaft; uniform vec4 uFloA, uFloB, uFloC, uFloD, uFloBox, uFloTrace, uFloCoverRect; uniform vec2 uFloSkin, uFloPalN;
        uniform sampler2D tFloSkin, tFloCover; uniform vec3 uFloPalA[16], uFloPalB[16];
        varying vec3 vFloTop, vFloUnder, vFloPiece;
        float floTrace(vec2 p, float lod) { vec2 uv = (p - uTraceRect.xy) / uTraceRect.zw + 0.5, e = min(uv, 1.0 - uv); return min(e.x, e.y) > 0.0 ? textureLod(tTrace, uv, lod).a : 0.0; }`,
      vertexLocal: /* glsl */`
        // ---- where it rests
        vec2 fSeat = aSeat.xy; float fShow = 1.0;
        if (aLife.x > -5.0e8) {
          if (uFloBox.x <= 0.0) fSeat += aWay.xy * min(uFloC.x - aLife.w, aWay.z);      // one that has just landed: it lies where it fell, and drifts from there
        } else if (uFloBox.x > 0.0) {
          vec2 fb = uFloBox.xy;                          // a field that goes with the boat
          fSeat = mod(aSeed.xy * fb + uFloC.xy - uFloBox.zw + 0.5 * fb, fb) - 0.5 * fb + uFloBox.zw;
          fShow *= 1.0 - smoothstep(0.78, 0.98, 2.0 * length((fSeat - uFloBox.zw) / fb));
        } else if (uFloShuttle <= 0.0) fSeat += aWay.xy * min(uFloC.x, aWay.z);            // it drifts on until something stops it
        else if (uFloC.x != 0.0) {
          float fu = fract(uFloC.x / uFloShuttle + aSeed.x);   // it travels its stretch and comes round again, out of nothing
          fSeat += aWay.xy * ((fu - 0.5) * uFloShuttle); fShow *= smoothstep(0.0, 0.08, fu) * (1.0 - smoothstep(0.92, 1.0, fu));
        }
        // ---- is it out
        fShow *= clamp((uFloC.w * 1.05 - aSeed.z) * 20.0, 0.0, 1.0) * step(1.0e-4, aSeat.z);
        vec4 fSkin = vec4(1.0);
        if (uFloSkin.y > 0.5) { fSkin = texture2D(tFloSkin, fSeat * uFloSkin.x); fShow *= smoothstep(0.62, 0.82, fSkin.a); }      // (well inside one of the skin's own petals: at a petal's soft edge the picture's colour is not the petal's)
        if (uFloRaft.x > 0.0) {
          // loose rafts: a slow pattern over the water says where they have gathered
          vec2 fq = fSeat / uFloRaft.y;
          float fr = 0.5 + 0.27 * sin(fq.x * 2.1 + 1.7 * sin(fq.y * 1.3)) + 0.23 * sin(fq.y * 2.6 + 1.9 * sin(fq.x * 0.9 + 2.0));
          fShow *= step(aSeed.w * uFloRaft.x, smoothstep(0.25, 0.75, fr) + (1.0 - uFloRaft.x) * 0.5);
        }
        if (uFloCoverOn > 0.5) { vec2 cu = (fSeat - uFloCoverRect.xy) / uFloCoverRect.zw + 0.5; fShow *= step(aSeed.w, texture2D(tFloCover, cu).r * 1.02); }
        if (aLife.x > -5.0e8) { float fAge = uLifeNow - aLife.x; fShow *= step(0.0, fAge) * (1.0 - smoothstep(uFloD.z - 5.0, uFloD.z, fAge)); }      // (one that has just landed is there at once: it takes the falling card's place)
        // ---- making way: for whatever has opened the water (the trace), then for the lane the hull has left, then for the hull
        vec2 fPush = vec2(0.0);
        if (uFloTrace.x > 0.5) {
          float fo = floTrace(fSeat, uFloTrace.y);
          if (fo > 0.02) {
            float fd = uFloTrace.z;
            vec2 fg = vec2(floTrace(fSeat + vec2(fd, 0.0), uFloTrace.y) - floTrace(fSeat - vec2(fd, 0.0), uFloTrace.y), floTrace(fSeat + vec2(0.0, fd), uFloTrace.y) - floTrace(fSeat - vec2(0.0, fd), uFloTrace.y));
            float fl = length(fg);
            if (fl > 1.0e-3) fPush = -fg / fl * ((uLifeHullB.x + uFloB.x + 0.25) * smoothstep(0.2, 0.62, fo) * smoothstep(0.0, 0.05, fl));
          }
        }
        if (uFloB.w > 0.0) fPush *= min(1.0, uFloB.w / max(length(fPush), 1.0e-4));        // a tethered thing gives only as far as its stalk lets it ...
        fPush += lanePush(fSeat + fPush, uFloB.x + 0.42 * aSeat.z, uFloB.y, uFloB.z, aSeed.y);   // ... except to the hull (its own half width counts too)
        vec2 fC = fSeat + fPush;
        if (uFloTrace.x > 0.5 && aSeed.w < 0.93) fShow *= 1.0 - smoothstep(0.4, 0.7, floTrace(fC, 0.0));   // where the skin is open there is nothing afloat (a few stay, as in the skin)
        // ---- riding the water
        vec2 fSl = floSee(floSlope(fC, aSeat.z) * uFloA.y, fC, uFloA.z) + waterSwellSlope(fC);
        if (aLife.y > 0.0) { float fr = aLife.y * exp(-uLifeNow / uFloD.w) * 0.16, fp = uLifeNow * (1.5 + aSeed.x) + aSeed.z * 40.0; fSl += fr * vec2(sin(fp), cos(fp * 0.83)); }   // still rocking from what passed before
        float fY = uFloA.x * (1.0 + aSeed.z) + waterSwell(fC) + uFloD.y * sin(uLifeNow * 2.24 + aSeed.x * 40.0);      // (each at its own height by a few millimetres: where the bow crowds two together one lies over the other, and nothing flickers)
        // ---- the piece itself
        vec3 fP = position; vec3 fN = normal;
        vFloPiece = vec3(position.x, position.z, aSeed.x);                                   // where on the piece (for its own painting), and which piece
        ${shape === 'pad' ? /* glsl */`
        // no two pads alike: a little oval, and on some an arc of the rim is curled up clear of the water
        float fRad = length(fP.xz) * 2.0, fAng = atan(fP.z, fP.x);
        fP.x *= 0.92 + 0.16 * aSeed.x;
        float fCurl = uFloD.x * step(0.55, aSeed.w) * smoothstep(0.55, 1.0, fRad) * pow(max(cos(fAng - aSeed.y * 6.2831853), 0.0), 2.0);
        fP.y += 0.22 * fCurl; fP.xz *= 1.0 - 0.18 * fCurl;` : shape === 'foam' ? /* glsl */`
        float fAng = atan(fP.z, fP.x), fRad = length(fP.xz) * 2.0;
        fP.xz *= 1.0 + smoothstep(0.4, 1.0, fRad) * (0.2 * sin(fAng * 2.0 + aSeed.x * 40.0) + 0.13 * sin(fAng * 3.0 + aSeed.y * 40.0));      // (two and three lobes round it: twenty points draw those as curves)` : shape === 'tuft' ? '' : /* glsl */`
        // a floating card is bent like a small boat, each its own way
        fP.y += uFloD.x * (0.5 + aSeed.w) * (0.16 * abs(fP.x) + 0.12 * fP.z * fP.z);`}
        if (aLife.z > 0.5) { fP.xy = -fP.xy; fN.xy = -fN.xy; }                               // wrong side up
        float fSize = aSeat.z * fShow;
        float fTurn = aSeat.w + uLifeNow * uFloC.z * (aSeed.w * 2.0 - 1.0) + length(fPush) * (aSeed.x - 0.5) * 2.4;      // it turns a little as it is shouldered aside
        float fc = cos(fTurn), fs = sin(fTurn);
        vec3 fL = vec3(fc * fP.x + fs * fP.z, fP.y, -fs * fP.x + fc * fP.z) * fSize;
        fN = vec3(fc * fN.x + fs * fN.z, fN.y, -fs * fN.x + fc * fN.z);
        // a stiff thing is tipped whole by the slope under its middle; a limp one takes the slope under each part of it
        vec2 fSv = fSl;
        if (uFloA.w > 0.0) fSv = mix(fSl, floSee(floSlope(fC + fL.xz, 0.7 * aSeat.z) * uFloA.y, fC, uFloA.z) + waterSwellSlope(fC + fL.xz), uFloA.w);      // (it bends over waves of about its own size, not over finer ones: it is leathery)
        transformed = vec3(fC.x + fL.x, fY + fL.y + 0.5 * (dot(fSl, fL.xz) + dot(fSv, fL.xz)), fC.y + fL.z);
        objectNormal = normalize(vec3(fN.x - fSv.x * fN.y, fN.y, fN.z - fSv.y * fN.y));
        vFloTop = uFloPalA[int(fract(aSeed.z * 5.37 + aSeed.x) * uFloPalN.x)];
        if (uFloSkin.y > 0.5) vFloTop = fSkin.rgb * uFloTone;                               // it takes the colour of the skin it lies in
        vFloUnder = uFloPalB[int(fract(aSeed.z * 3.91 + aSeed.y) * uFloPalN.y)];`,
      fragmentPars: `varying vec3 vFloTop, vFloUnder, vFloPiece; uniform float uFloLum; uniform vec4 uFloGlance; uniform vec3 uFloPaint; ${GLARE_PARS}`,
      // One that doubles the water's skin is lit by the water's own rule for its skin (water-final.js): the realm's
      // painted light on a level thing with its lamps, as much of it as a wet petal gives back (that is in vFloTop),
      // and at a glancing angle a little of what the water mirrors there, which far off is the colour of the horizon.
      light: `if (uFloGlance.w > 0.0 && gl_FrontFacing) c = vFloTop * (uFloPaint + lamps + 0.048 + uFogColor * (uFloGlance.w * (uFloGlance.z + (uFloGlance.x - uFloGlance.z) * pow(1.0 - clamp(V.y, 0.0, 1.0), uFloGlance.y))));
${GLARE_GLSL}`,
      // the upper face is the piece's own paint times its colour; the under face keeps the paint's light and dark and takes the under colour
      albedo: `albedo = gl_FrontFacing ? albedo * vFloTop : vFloUnder * (dot(albedo, vec3(0.3, 0.55, 0.15)) / uFloLum);${o.flat ? ' N = normalize(cross(dFdx(vWPos), dFdy(vWPos)));' : ''}${shape === 'pad' && o.veins !== false ? PAD_PAINT : ''}`,
    } });
  const mesh = new THREE.Mesh(geo, mat); mesh.frustumCulled = false; mesh.name = `float:${o.kind}`;
  (o.parent || ctx.group).add(mesh);
  if (!o.mirror) ctx.only(mesh, 'direct');
  const waterNow = lifeWater(ctx);
  mesh.onBeforeRender = (renderer, scene, camera, geometry, material) => { waterNow.refresh(); material.uniformsNeedUpdate = true; };      // (the water's fine window, as it is now)

  let along = 0, dx = 0, dz = 0, head = 0, drift = driftVec ? Math.hypot(driftVec[0], driftVec[1]) : o.drift;
  ctx.onUpdate((dt) => {
    hull.update(ctx);
    if (o.around) { if (driftVec) { dx += driftVec[0] * dt; dz += driftVec[1] * dt; } U.uFloC.value.x = dx; U.uFloC.value.y = dz; U.uFloBox.value.z = ctx.boat.x; U.uFloBox.value.w = ctx.boat.z; }
    else { along += drift * dt; U.uFloC.value.x = along; }
    const tr = ctx.water && ctx.water.trace;
    if (tr && tr.active) U.uFloTrace.value.set(1, Math.max(0, Math.log2(0.7 / (tr.cell || 0.125))), 0.6, 0); else U.uFloTrace.value.x = 0;
    if (o.skin) {
      // the skin's own tint and light, and the water's mirror, as the realm has them now
      const wl = ctx.waterLook || {}, sk = wl.skin || {}, tone = (o.skin.tone ?? SKIN_WET) * (sk.light ?? 1);
      U.uFloTone.value.copy(col(sk.tint ?? '#ffffff')).multiplyScalar(tone);
      U.uFloGlance.value.set(wl.reflectivity ?? 0.92, wl.fresnel ?? 4.2, wl.reflectFloor ?? 0.02, SKIN_GLANCE / Math.max(tone, 0.05));
      // (the painted light on a level surface: gouache's ramp at a face looking up, plus its light from the sky; the same sum as the water's uPaint)
      const S = engine.shared;
      if (S.uKeyDir && S.uRampLight) {
        const w = clamp(0.5 - 0.5 * S.uKeyDir.value.y, 0, 1), sh = S.uRampShadow.value, li = S.uRampLight.value, kc = S.uKeyColor.value, sky = S.uSkyLight.value;
        const ease = (x) => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); }, a = ease(w * 2), b = ease(w * 2 - 1), ramp = (shadow, lit) => (w < 0.5 ? shadow + (1 - shadow) * a : 1 + (lit - 1) * b);
        U.uFloPaint.value.setRGB(ramp(sh.r, li.r * kc.r) + sky.r, ramp(sh.g, li.g * kc.g) + sky.g, ramp(sh.b, li.b * kc.b) + sky.b);
      }
    }
  });
  ctx.onDispose(() => blank.dispose());
  const handle = {
    object: mesh, kind: o.kind, count: nStand, pool: nPool, uniforms: U,
    /** How many of them are out, 0..1. */
    get cover() { return U.uFloC.value.w; }, set cover(v) { U.uFloC.value.w = clamp(v, 0, 1); },
    /** Metres a second they drift along the route. */
    get drift() { return drift; }, set drift(v) { drift = v; },
    /** Put one down (something has just landed there). It lies for `landed` seconds, then it has soaked and gone. */
    add(x, z, p = {}) {
      if (!nPool) return;
      const i = nStand + head; head = (head + 1) % nPool;
      // (it lies as the card lay when it landed: what its own slow turning would have added by now is taken off)
      aSeatArr[i * 4] = x; aSeatArr[i * 4 + 1] = z; aSeatArr[i * 4 + 2] = p.size ?? pickSize(); aSeatArr[i * 4 + 3] = (p.turn ?? rnd() * TAU) - ctx.time * o.turning * (aSeedArr[i * 4 + 3] * 2 - 1);
      aLifeArr[i * 4] = ctx.time; aLifeArr[i * 4 + 1] = 0; aLifeArr[i * 4 + 2] = p.flip ? 1 : 0; aLifeArr[i * 4 + 3] = along;
      if (!o.around) { const t = tangentAt(x, z); aWayArr[i * 3] = t[0]; aWayArr[i * 3 + 1] = t[1]; aWayArr[i * 3 + 2] = t[2]; geo.attributes.aWay.addUpdateRange(i * 3, 3); geo.attributes.aWay.needsUpdate = true; }
      aSeat.addUpdateRange(i * 4, 4); aSeat.needsUpdate = true; aLife.addUpdateRange(i * 4, 4); aLife.needsUpdate = true;
    },
  };
  return handle;
}

// ------------------------------------------------------------------------------------------------ riding, for any model
/**
 * The gouache extension that makes a whole model ride the water where it stands: lifted and tipped by the slope of the
 * rings under it (averaged over its footprint, so a heavy thing ignores what is shorter than itself), with a slow bob
 * of its own. Works on a kit.model (pass `live: true`), on kit.models and on any InstancedMesh.
 *   size     metres across its footprint (default 1)
 *   tip      how much of the water's slope it takes (default 0.8);  most: the steepest it is tipped (default 0.12: about 7 degrees)
 *   bob      metres (default 0.02), every `period` seconds (default 2.8)
 */
export function floatRide(ctx, opts = {}) {
  const o = { size: 1, tip: 0.8, most: 0.12, bob: 0.02, period: 2.8, ...opts }, clock = lifeTime(ctx), calm = !!ctx.reducedMotion;
  return {
    uniforms: { ...lifeWater(ctx), uLifeNow: clock.uLifeNow, uRide: { value: new THREE.Vector4(o.size * 0.35, o.tip * (calm ? 0.6 : 1), o.most, o.bob * (calm ? 0.5 : 1)) }, uRideB: { value: TAU / o.period } },
    vertexPars: `${WATER_GLSL} uniform float uLifeNow, uRideB; uniform vec4 uRide;`,
    vertexWorld: /* glsl */`
      #ifdef USE_INSTANCING
        vec3 rO = (modelMatrix * vec4(instanceMatrix[3].xyz, 1.0)).xyz;
      #else
        vec3 rO = modelMatrix[3].xyz;
      #endif
      vec2 rS = (waterRipple(rO.xz).xy + waterRipple(rO.xz + vec2(uRide.x, 0.0)).xy + waterRipple(rO.xz - vec2(uRide.x, 0.0)).xy + waterRipple(rO.xz + vec2(0.0, uRide.x)).xy + waterRipple(rO.xz - vec2(0.0, uRide.x)).xy) * 0.2;
      rS = clamp(rS * uRide.y, -uRide.z, uRide.z) + waterSwellSlope(rO.xz);
      wp.y += dot(rS, wp.xz - rO.xz) + waterSwell(rO.xz) + uRide.w * sin(uLifeNow * uRideB + rO.x * 1.7 + rO.z * 2.3);
      wn = vec3(wn.x - rS.x * wn.y, wn.y, wn.z - rS.y * wn.y);`,
  };
}

/**
 * An ice pan (pancake ice), one unit in radius: a flat plate of new ice with a raised, rounded rim where it has rubbed
 * against its neighbours, a skirt of grey slush at the waterline and its edge going under. The plate is painted a
 * step darker and cooler than the rim's crest, so that the rim reads as a ring in flat snow light. 440 triangles
 * (forty round it: a pan 2.5 m across beside the hull fills half the picture, and with fewer its edge is a row of
 * straight pieces; its outline is pushed in and out for each in the shader, and stays a curve).
 */
export function panGeometry() {
  const P = [], C = [], I = [], N = 40;
  // rings from the plate outward: radius, height, colour (lavender plate, the rim's inner slope, its paper-white crest, its outer slope, grey slush, the edge under water)
  const rings = [[0.76, 0.03, [0.84, 0.84, 0.93]], [0.85, 0.046, [0.9, 0.89, 0.95]], [0.925, 0.075, [1.04, 1.03, 1.03]], [1.0, 0.03, [0.9, 0.89, 0.94]], [1.08, -0.012, [0.62, 0.62, 0.72]], [0.98, -0.11, [0.42, 0.43, 0.55]]];
  P.push(0, 0.028, 0); C.push(0.82, 0.82, 0.92);
  rings.forEach(([r, y, c], k) => { for (let i = 0; i < N; i++) { const a = i / N * TAU + (k % 2) * Math.PI / N; P.push(Math.cos(a) * r, y, Math.sin(a) * r); C.push(c[0], c[1], c[2]); } });
  for (let i = 0; i < N; i++) I.push(0, 1 + (i + 1) % N, 1 + i);
  for (let k = 0; k < rings.length - 1; k++) for (let i = 0; i < N; i++) {
    const a = 1 + k * N + i, b = 1 + k * N + (i + 1) % N, c = a + N, d = b + N;
    if (k % 2 === 0) I.push(a, b, c, b, d, c); else I.push(a, b, d, a, d, c);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
  g.setIndex(I); g.computeVertexNormals();
  return g;
}

// ------------------------------------------------------------------------------------------------ makeDrifters
// closest points of two segments in the plane (a0-a1 and b0-b1): returns the squared distance and fills o.ax, o.az, o.bx, o.bz, o.s, o.t
function segSeg(a0x, a0z, a1x, a1z, b0x, b0z, b1x, b1z, o) {
  const ux = a1x - a0x, uz = a1z - a0z, vx = b1x - b0x, vz = b1z - b0z, wx = a0x - b0x, wz = a0z - b0z;
  const a = ux * ux + uz * uz, b = ux * vx + uz * vz, c = vx * vx + vz * vz, d = ux * wx + uz * wz, e = vx * wx + vz * wz, D = a * c - b * b;
  let s, t;
  if (a < 1e-9 && c < 1e-9) { s = 0; t = 0; }
  else if (a < 1e-9) { s = 0; t = clamp(e / c, 0, 1); }
  else if (c < 1e-9) { t = 0; s = clamp(-d / a, 0, 1); }
  else {
    s = D > 1e-9 ? clamp((b * e - c * d) / D, 0, 1) : 0;
    t = (b * s + e) / c;
    if (t < 0) { t = 0; s = clamp(-d / a, 0, 1); } else if (t > 1) { t = 1; s = clamp((b - d) / a, 0, 1); }
  }
  o.ax = a0x + ux * s; o.az = a0z + uz * s; o.bx = b0x + vx * t; o.bz = b0z + vz * t; o.s = s; o.t = t;
  const dx = o.ax - o.bx, dz = o.az - o.bz;
  return dx * dx + dz * dz;
}

/**
 * A few heavy floating things whose places are kept in script, so that the boat can push them and they can nudge one
 * another: ice pans, a crate, a plank, the baulks of a boom. Each is a circle (radius) or a rounded bar (radius and
 * length). They drift with the current, turn slowly, are pushed aside by the hull with a soft knock, keep clear of the
 * banks and of `posts`, and ride the ripple field (floatRide). opts:
 *   kind        'pan' gives the default pan (panGeometry, or your own `geometry` of unit radius: its outline is varied
 *               for each unless `vary: false`), white, with these defaults
 *   items       [{ x, z (or s, d), radius, length, turn, home }]  the bodies. `home: true` tethers one to its place (a boom)
 *   count, s: [from, to], d: [left, right], radius: [smallest, largest]   or strew `count` of them over a stretch
 *   geometry, material   your own piece and gouache options for it. A circle's piece has unit radius and is scaled by
 *               each one's radius; a bar's piece is drawn as it is modelled, lying along X. With neither geometry nor
 *               kind nothing is drawn: use attach()
 *   drift       metres a second with the current (default 0.3); spin: [20, 60] seconds for a turn
 *   keep        [from, to] metres along the route: one that drifts out at the far end comes in again at the near one
 *   tether      how hard a tethered one is pulled home (1/s2, default 1.2)
 *   posts       [{ x, z, r }] solid things the round ones knock against (piles, trunks)
 *   onKnock     (x, z, strength, what) for sound: what = 'hull' | 'other' | 'post' | 'bank'; strength 0..1
 *   ride        options for floatRide (size, tip, most, bob)
 * Returns { object, bodies, attach(object3d, { radius, length, home }), ride (the extension: give it to kit.model as
 *   `extend` for anything you attach), nudge(i, vx, vz) }.
 */
export function makeDrifters(ctx, opts = {}) {
  const { kit } = ctx;
  const PAN = { radius: [0.4, 1.25], drift: 0.3, spin: [20, 60], ride: { tip: 0.9, most: 0.075, bob: 0.004 }, material: { color: '#F3ECE8', brush: 0.35, shade: 0.75, emissive: '#F3ECE8', emissiveIntensity: 0.06 } };
  const o = { kind: null, items: null, count: 0, s: null, d: null, radius: [0.4, 0.4], geometry: null, material: null, drift: 0.3, spin: [20, 60], keep: null, tether: 1.2, posts: [], onKnock: null, ride: {}, seed: 87, exact: false, parent: null,
    ...(opts.kind === 'pan' ? PAN : {}), ...opts };
  const rnd = ctx.rng(o.seed), hull = lifeHull(ctx), radius = pair(o.radius, [0.4, 0.4]), spin = pair(o.spin, [20, 60]);
  const bodies = [], loc = {}, cp = {};
  const body = (p) => {
    let x = p.x, z = p.z;
    if (x == null) { const q = ctx.path.point(p.s, p.d || 0, 0); x = q.x; z = q.z; }
    const r = p.radius ?? radius[0] + (radius[1] - radius[0]) * rnd(), L = (p.length || 0) / 2;
    const b = { x, z, a: p.turn ?? rnd() * TAU, vx: 0, vz: 0, w: 0, r, L, m: Math.PI * r * r + 4 * r * L, hx: x, hz: z, home: !!p.home, spin: (rnd() < 0.5 ? -1 : 1) * TAU / (spin[0] + (spin[1] - spin[0]) * rnd()),
      s: null, k: 1, object: p.object || null, seed: rnd(), knock: 0 };
    b.I = b.m * (r * r / 2 + L * L / 3);
    bodies.push(b); return b;
  };
  if (o.items) for (const it of o.items) body(it);
  if (o.count && o.s) {
    const n = o.exact ? o.count : Math.max(1, kit.count(o.count));
    for (let i = 0; i < n; i++) {
      // strewn, each clear of the others
      for (let tries = 0; tries < 40; tries++) {
        const s = o.s[0] + (o.s[1] - o.s[0]) * rnd(), d = (o.d ? o.d[0] + (o.d[1] - o.d[0]) * rnd() : 0), q = ctx.path.point(s, d, 0), r = radius[0] + (radius[1] - radius[0]) * Math.pow(rnd(), 1.6);
        if (bodies.every((b) => Math.hypot(b.x - q.x, b.z - q.z) > b.r + r + 0.1)) { body({ x: q.x, z: q.z, radius: r }); break; }
      }
    }
  }
  const ride = floatRide(ctx, { size: 2 * (radius[0] + radius[1]) / 2, ...o.ride });
  let mesh = null; const nInst = bodies.length;
  const given = o.geometry || (o.kind === 'pan' ? panGeometry() : null);
  if (given && nInst) {
    // (a geometry of our own with the given one's buffers: the same piece may serve several sets of drifters)
    const geometry = new THREE.BufferGeometry(); geometry.index = given.index; for (const name of Object.keys(given.attributes)) geometry.setAttribute(name, given.attributes[name]);
    const seeds = new Float32Array(nInst); for (let i = 0; i < nInst; i++) seeds[i] = bodies[i].seed;
    geometry.setAttribute('aRideSeed', new THREE.InstancedBufferAttribute(seeds, 1));
    const shapeExt = o.kind === 'pan' && o.vary !== false ? {
      vertexPars: 'attribute float aRideSeed;',
      // no two pans the same shape: the outline is pushed in and out round each
      vertexLocal: `float pA = atan(transformed.z, transformed.x), pR = length(transformed.xz);
        transformed.xz *= 1.0 + smoothstep(0.3, 0.9, pR) * (0.1 * sin(pA * 2.0 + aRideSeed * 40.0) + 0.07 * sin(pA * 3.0 + aRideSeed * 71.0) + 0.03 * sin(pA * 5.0 + aRideSeed * 113.0));`,
    } : null;
    const capExt = { uniforms: glareUniforms(ctx, o.glare ?? 0.88), fragmentPars: GLARE_PARS, light: GLARE_GLSL };      // pale paint stays paint
    mesh = new THREE.InstancedMesh(geometry, kit.gouache({ vertexColors: !!geometry.attributes.color, ...(o.material || {}), extend: [ride, shapeExt, capExt] }), nInst);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); mesh.frustumCulled = false; mesh.name = `drifters:${o.kind || 'things'}`;
    (o.parent || ctx.group).add(mesh);
  }
  const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), p3 = new THREE.Vector3(), s3 = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  const knock = (b, x, z, strength, what) => { if (o.onKnock && strength > 0.08 && b.knock <= 0) { b.knock = 0.5; o.onKnock(x, z, Math.min(1, strength), what); } };
  // push body b out of something at (cx, cz) along n by pen, and take up the other thing's speed along n
  const shove = (b, nx, nz, pen, px, pz, ovx, ovz, what) => {
    b.x += nx * pen; b.z += nz * pen;
    const vn = (b.vx - ovx) * nx + (b.vz - ovz) * nz;
    if (vn < 0) {
      const j = -1.1 * vn;
      b.vx += nx * j; b.vz += nz * j;
      b.w += ((px - b.x) * nz - (pz - b.z) * nx) * j * b.m / Math.max(b.I, 1e-3) * 0.6;
      knock(b, px, pz, j * 0.5, what);
    }
  };
  ctx.onUpdate((dtRaw) => {
    hull.update(ctx);
    const dt = Math.min(dtRaw, 0.05), boat = ctx.boat, H = hull.uniforms.uLifeHull.value, hr = hull.half + 0.06;
    for (const b of bodies) {
      b.knock -= dt;
      // the current carries it, and it turns slowly of itself
      ctx.path.locate(b.x, b.z, b.s, loc); b.s = loc.s;
      const k = 1 - Math.exp(-dt * 0.5), drift = b.home ? 0 : o.drift;
      b.vx += (loc.tx * drift - b.vx) * k; b.vz += (loc.tz * drift - b.vz) * k;
      b.w += ((b.home ? 0 : b.spin) - b.w) * (1 - Math.exp(-dt * 0.35));
      if (b.home) { b.vx += (b.hx - b.x) * o.tether * dt; b.vz += (b.hz - b.z) * o.tether * dt; }
      b.x += b.vx * dt; b.z += b.vz * dt; b.a += b.w * dt;
      // the banks
      const lim = loc.halfWidth - b.r - 0.2;
      if (Math.abs(loc.d) > lim) { const sd = Math.sign(loc.d), over = Math.abs(loc.d) - lim; b.x -= loc.rx * sd * over; b.z -= loc.rz * sd * over; const out = (b.vx * loc.rx + b.vz * loc.rz) * sd; if (out > 0) { b.vx -= loc.rx * sd * out * 1.1; b.vz -= loc.rz * sd * out * 1.1; knock(b, b.x, b.z, out, 'bank'); } }
      // out at the far end, in again at the near one (small while it is near either end, so that nothing pops)
      if (o.keep) {
        if (loc.s > o.keep[1]) { const q = ctx.path.point(o.keep[0], clamp(loc.d, -lim, lim), 0); b.x = q.x; b.z = q.z; b.s = o.keep[0]; b.vx = b.vz = 0; }
        b.k = smooth(0, 4, Math.min(b.s - o.keep[0], o.keep[1] - b.s));
      }
      // the hull: narrower toward the stem
      const ca = Math.cos(b.a), sa = Math.sin(b.a);
      const d2 = segSeg(b.x - ca * b.L, b.z + sa * b.L, b.x + ca * b.L, b.z - sa * b.L, H.x, H.y, H.z, H.w, cp);
      const rad = b.r + hr * (1 - 0.8 * smooth(0.55, 1, cp.t));
      if (d2 < rad * rad) {
        const d = Math.sqrt(d2) || 1e-4;
        let nx = (cp.ax - cp.bx) / d, nz = (cp.az - cp.bz) / d;
        if (d < 1e-3) { nx = Math.cos(boat.heading); nz = -Math.sin(boat.heading); }
        shove(b, nx, nz, rad - d, cp.bx, cp.bz, boat.vx || 0, boat.vz || 0, 'hull');
      }
      for (const p of o.posts) {
        const dx = b.x - p.x, dz = b.z - p.z, d = Math.hypot(dx, dz), min = b.r + p.r;
        if (d < min && d > 1e-4 && b.L === 0) shove(b, dx / d, dz / d, min - d, p.x, p.z, 0, 0, 'post');
      }
    }
    // one another
    for (let i = 0; i < bodies.length; i++) for (let j = i + 1; j < bodies.length; j++) {
      const a = bodies[i], b = bodies[j], reach = a.r + a.L + b.r + b.L;
      if (Math.abs(a.x - b.x) > reach || Math.abs(a.z - b.z) > reach) continue;
      const ca = Math.cos(a.a), sa = Math.sin(a.a), cb = Math.cos(b.a), sb = Math.sin(b.a);
      const d2 = segSeg(a.x - ca * a.L, a.z + sa * a.L, a.x + ca * a.L, a.z - sa * a.L, b.x - cb * b.L, b.z + sb * b.L, b.x + cb * b.L, b.z - sb * b.L, cp), min = a.r + b.r;
      if (d2 >= min * min) continue;
      const d = Math.sqrt(d2) || 1e-4, nx = d > 1e-3 ? (cp.ax - cp.bx) / d : 1, nz = d > 1e-3 ? (cp.az - cp.bz) / d : 0, pen = min - d, ma = a.m, mb = b.m, wa = mb / (ma + mb), wb = ma / (ma + mb);
      a.x += nx * pen * wa; a.z += nz * pen * wa; b.x -= nx * pen * wb; b.z -= nz * pen * wb;
      const vn = (a.vx - b.vx) * nx + (a.vz - b.vz) * nz;
      if (vn < 0) { const jm = -1.1 * vn / (1 / ma + 1 / mb); a.vx += nx * jm / ma; a.vz += nz * jm / ma; b.vx -= nx * jm / mb; b.vz -= nz * jm / mb; knock(a, (cp.ax + cp.bx) / 2, (cp.az + cp.bz) / 2, -vn * 0.6, 'other'); }
    }
    // show them
    for (let i = 0; i < bodies.length; i++) {
      const b = bodies[i];
      if (b.object) { b.object.position.x = b.x; b.object.position.z = b.z; b.object.rotation.y = b.a; }
      else if (mesh && i < nInst) { const sc = (b.L > 0 ? 1 : b.r) * b.k; m4.compose(p3.set(b.x, 0, b.z), q4.setFromAxisAngle(up, b.a), s3.set(sc, b.k, sc)); mesh.setMatrixAt(i, m4); }
    }
    if (mesh) mesh.instanceMatrix.needsUpdate = true;
  });
  return {
    object: mesh, bodies, ride,
    /** Let a model of your own be one of them: the boat pushes it, it rides the water (give `ride` to kit.model as `extend`, with live: true). */
    attach(object, p = {}) { return body({ x: object.position.x, z: object.position.z, turn: object.rotation.y, ...p, object }); },
    /** Give one a push (metres a second). */
    nudge(i, vx, vz) { const b = bodies[i]; if (b) { b.vx += vx; b.vz += vz; } },
  };
}
