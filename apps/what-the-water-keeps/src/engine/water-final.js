// The water. One surface, one shader, one set of parameters per realm (its `water` look), blended through the passages.
// docs/water.md is the reference for the people who build realms; this comment is the map of the code.
//
//   mirror        One planar reflection of the scene (a little wider than the view, multisampled), then three cheap smears
//                 of it along the direction in which upright things reflect. The surface blends between the sharp picture
//                 and the smears by how rough the water is, by how far the mirrored thing stands from the water, and by
//                 how much the wavelets fold the picture. Things that shine are carried alone through the smears and laid
//                 back as long columns that break into dashes on the nearer wavelets. The reflection is graded a little
//                 darker and richer than the world, and how much of a mirror the water is follows an art-directed curve.
//   waves         Five slow analytic swells under three scales of travelling wavelets (one small texture holding a wave
//                 field and its quadrature), with drifting patches of calmer and livelier water. Waves too small to see
//                 at a distance turn into softness instead of noise. A realm may also raise a true swell (three long
//                 waves that displace the surface and lift the boat), and send a front across the water that wakes it.
//   living water  water-final-sim.js: two windows of dispersive ripples round the boat (wake, rings, rain as data).
//   trace         water-final-trace.js: a slow-fading texture anchored to the realm (dye film, a skin with lanes, light
//                 that lingers where the water was touched). The film and the skin are matte things lying on the water:
//                 they are lit by the realm's painted light and its lamps (the uniforms kit.gouache shares), never by
//                 the mirrored picture.
//   looking in    With the engine's picture of the scene without the water (engine.pre): what lies beneath is bent by the
//                 surface, tinted and swallowed with depth, and the water thins to nothing at a shore or a hull.
//
//   asked for     What the areas, built on this water, had made by hand because it did not give it (7 November, evening):
//                 pieces of this file given to realm shaders so that nothing copies it (the fine ripple window, the
//                 surface function, the rain: WATER_FINE_GLSL, WATER_SURFACE_GLSL, WATER_RAIN_GLSL), a sheet on the
//                 water's own grid (overlay), a look for the mirror (onMirror), and look keys: haze, sheen, waterline,
//                 tremor, rest, column, columnFar, spareLights, film.tinted / brush / route, touch by age, trace.lay.
//                 Every one is nothing until a look asks: the surface's arithmetic without them is what it was.
//
// The engine calls: setLook, veilLook, setMirrorScale, teleport, bind, update, renderReflection, setSize, heightAt, dispose.
// Realms call: ripple, rainZone, lattice, trace.inject / trace.line / trace.stamp, onBind, onMirror, overlay, heightAt, slopeAt.
import * as THREE from 'three';
import { RippleSim, MAX_ZONES } from './water-final-sim.js';
import { Trace, FILM_GLSL, makeFleckTexture, makeSkinTexture } from './water-final-trace.js';

/** The vocabulary a realm uses to describe its water. Colours are CSS strings or THREE.Color; everything is optional. */
export const WATER_LOOK = {
  // ---- the body of the water
  deep: '#06182b',            // body colour of the water at a distance and at grazing angles; what depth turns things into
  shallow: '#17505f',         // body colour when looking down into it near the boat
  glow: '#000000',            // light the water itself gives off everywhere (milky, luminous water)
  // ---- the mirror
  reflectivity: 0.92,         // the mirror at grazing angles (the cap of the curve)
  fresnel: 4.2,               // the curve's exponent: lower = mirror-like even when looking down
  reflectFloor: 0.02,         // the mirror looking straight down (the floor of the curve); 1 with reflectivity 1 = an exact mirror at every angle
  clearRadius: 0,             // metres round the rider within which the mirror gives way to a window (0 = none) ...
  clearSoft: 8,               // ... over this many metres ...
  clearFloor: 0.15,           // ... down to this share of the mirror
  mirrorDarken: 0.15,         // the reflection is this much darker than the world ...
  mirrorSaturate: 0.10,       // ... and this much richer: the water keeps a better copy
  reflectionTint: '#ffffff',
  roughness: 0.12,            // 0 = razor-sharp reflections, 1 = soft smears
  streak: 1.0,                // vertical stretch of reflected lights
  mirror: 0,                  // 0..1: pull toward a perfectly still mirror
  column: -1,                 // the long columns under lights, set apart from `mirror`, `streak` and a front's `calm`: 0 = none, 1 = as on water that is not stilled; -1 = as those leave them
  columnFar: 0,               // metres from the eye beyond which lights grow no columns (0 = no limit): a far house of a thousand flames is not one slab of light
  spareLights: 0,             // 0..1: how far things that shine in the mirror are spared its tint, its darkening and the window round the rider
  // ---- waves
  waveHeight: 0.55,           // how strongly wavelets bend the reflections
  waveScale: 1.0,             // size of the wavelets
  waveSpeed: 1.0,
  wind: [0.6, 0.8],           // direction the wavelets travel (x, z)
  swell: 0,                   // metres, crest to trough: a long swell that really lifts the surface and the boat (0 = flat water, no cost)
  swellLength: 24,            // metres between its crests (three waves: three quarters of this, this, and five quarters)
  swellPeriod: 7,             // seconds
  swellDir: [1, 0.35],        // where it travels (x, z)
  // ---- light on the water
  sparkle: 0.25,              // glints where lights are mirrored
  sparkleColor: '#fff3d6',
  sun: { dir: [0, 0.07, -1], color: '#000000', strength: 0, spread: 1, glitter: 0.35 },   // a sun or moon path: direction TO the light, colour, strength, width, molten (0) .. sequins (1)
  rippleGlow: '#000000',      // light given off where the surface is disturbed (wakes, rings, rain): thin lines along the crests
  rippleGlowStrength: 0,
  // sky-light on leaning water, whatever the mirror has to show there: on the far face of every ripple (rings), on the fine
  // crests of water at rest (still), where the eye meets the water at a glance (glance: far water, the backs of a swell), and on
  // water the rain is falling on where its rings are too far off to draw (rain: a rain column across a dark hall is a pale disc).
  // hide: how much of what lies under a line of the still sheen it hides; lamps: how much of the lantern's and the kept lamp's light it takes
  sheen: { color: '#000000', rings: 0, still: 0, glance: 0, rain: 0, hide: 0, lamps: 0 },
  waterline: { color: '#000000', width: 0.012, gain: 1, reach: 40 },      // a line of light where the water meets what stands in it: colour, width in metres (never thinner than the screen can draw), strength, metres from the eye at which it has gone
  // ---- looking in
  opacity: 0.94,              // how much a metre of water hides of what lies beneath it
  clarity: 0,                 // metres of depth over which things beneath fade to a third (0 = take it from `opacity`)
  absorb: '#ffffff',          // tint of things seen at `absorbDepth` metres down (white = no tint)
  absorbDepth: 4,
  underglow: -1,              // 0..1: how much of translucent things under the surface shows (lights, jellies); -1 = 1 - opacity
  refraction: 1,              // how far ripples bend what lies beneath ...
  refractReach: 1.5,          // ... growing with its depth up to this many metres (a town 20 m down wavers whole streets at 10)
  tremor: -1,                 // how far the standing waves (wavelets, the slow swell) bend what lies beneath, apart from the living ripples; -1 = as `refraction`
  // the water between: what lies beneath is swallowed by the distance sight travels through water (perMetre) and by depth
  // itself (perDepth), into `color` where the sight ends shallow and `deep` where it ends deep (depths: from, to, metres).
  // burn: how much less a thing that gives off light is swallowed. map: a picture of where the water is lit (its colours are
  // added to the haze, lit times; rect: where it lies in the realm: centre x, z, size x, z)
  haze: { color: '#000000', deep: '#000000', depths: [2, 18], perMetre: 0, perDepth: 0, burn: 0, lit: 1, map: null, rect: [0, 0, 1, 1] },
  seeDistance: 22,            // beyond this many metres the surface no longer shows what is under it
  edge: 0.05,                 // metres of depth over which the water thins to nothing at a shore or a hull (0 = hard edge)
  // ---- the living water round the boat
  wake: 1.0,                  // strength of the boat's wake
  rest: 0,                    // a boat lying still breathes on the water: strength of the fine ring that leaves bow and stern in turn every few seconds (0 = none)
  foam: 0.25,                 // pale foam in the wake
  churn: 0.5,                 // how pale the water an oar's blade has just churned shows, whatever `foam` is (0 = not at all)
  rain: 0,                    // raindrop rings per square metre per second, everywhere (or behind the front: front.rain)
  rainStrength: 1,            // how heavy the drops are
  rippleSize: 64,             // metres across which ripples are simulated (up to 96; changing it stills the water)
  rippleLife: 4,              // seconds a ripple lasts (30 = rings that cross the whole field)
  rippleSpeed: 1,             // how fast ripples travel (1 = as on real water; up to 2.5)
  front: { normal: [1, 0], offset: 1e5, width: 10, rain: 0, calm: 0 },   // a line crossing the water: behind it (dot(normal, xz) < offset) the rain falls (rain: 1) and the waves blow (calm: 1 = a mirror ahead of it)
  // ---- what the realm-anchored trace is read as (each allocates the trace when its amount is above 0)
  film: { amount: 0, a: '#26397a', b: '#a8324a', mix: '#54306b', cover: 0.75, split: 1, scale: 7, flow: 0.08, life: 60, matte: 0.8, light: 1, stir: 1, tinted: 1, brush: 1, route: null },
  skin: { amount: 0, kind: 'petal', map: null, scale: 3, tint: '#ffffff', close: 25, lead: 0, width: 0, plate: 1.1, sheen: 0.25, light: 1 },
  touch: { amount: 0, color: '#4fe6d2', hold: 4, fleck: 1, wake: 1, fresh: null, late: null, dying: null, ages: [0.26, 0.6, 0.93], map: null },
  trace: { texel: 0.125, margin: 14, lay: false },      // lay: true = lay the trace though the water itself reads nothing from it (for a realm's own shaders)
};

const GRAV = 9.81, TAU = Math.PI * 2;
// Everything in this file that was tuned by eye, in one place (the simulation's own table is in water-final-sim.js).
const TUNE = {
  farFade: 45.0,            // how soon a wavelet layer is faded as it shrinks below a pixel: exp(-farFade * (footprint / wavelength)^2)
  farSlow: 0.5,             // the same for each slow swell, by its own footprint: exp(-farSlow * (wave number . footprint)^2)
  steepest: 1.2,            // a ripple cannot bend the mirror harder than this allows
  washCalm: 0.35,           // how much the wash behind the hull calms the wavelets (they keep riding over it)
  ripSoft: 0.004,           // how much a steep ripple softens the mirror (it shows the sky softly, not in folds)
  fold: 0.2, foldRip: 0.07, // how much the mirror softens where the wavelets fold the picture, and where the ripples of the wake do
  windEase: 0.6,            // 1/s: how fast the waves follow a change of wind
  column: 9.0,              // strength of the long columns under lights
  lineFine: 0.005, lineWide: 0.011,      // half-width of a glowing crest line, metres (never thinner than the screen can draw)
  bead: [0.22, 1.15],       // the light along a crest: what is always there, and what the beads add
  lineRain: 0.6,            // how fast the crest lines go out under rain (per ring per m2 per s)
  wet: { film: 0.5, petal: 0.42, ice: 0.8 },      // how much of the painted light matte things on the water give back (they are wet, and lie on the dark)
  glance: 0.3,              // how much of the light mirrored where it lies a petal skin gives back at a glancing angle      // how much of the painted light matte things on the water give back (they are wet, and lie on the dark)
  lineWash: 0.72,           // how far they go out inside the churned lane astern (the hull's own stationary waves would draw tram lines there)
  glowLine: [0.55, 0.9],    // brightness of a crest line: at rest, and what liveliness adds
  glowRoad: 0.09,           // the churned lane astern, as light
  glowBreath: 0.006,        // lively water, as light
  touchLively: 1.3, touchWash: 0.8,      // light from touch: how much lively water (squared) and the wash count as touched
  touchRain: 0.03,          // and each unit of rain (rings per m2 per s)
  touchFill: 0.8,           // the share of the flecks that light where the water is fully touched
  sparks: 0.22,             // chance of a point of light on the path of a lamp
  sparkGain: 9.0,
  lattice: { k: 2.6, speed: 28, fade: 2.5, ring: 16, ringSpeed: 2.2, line: 0.012, slope: 0.0025, gain: 0.9, apart: [5.0, 16.0] },      // apart: pixels between two lines of a family at which they begin to show, and show fully
  swellNear: 120, swellFar: 260,          // the swell lifts the surface fully within this many metres of the eye, and not at all beyond
  swellEase: 1.2,           // seconds: a swell that a realm switches on or off in one frame rises and falls over about three times this (nothing jumps)
  shine: [0.9, 1.8],        // how bright a thing in the mirror must be to count as a light (as in the smears): for look.spareLights
  // sky-light on leaning water (look.sheen). rings: how soon a lean shows, and how a steep one is held back (the slightest ring shows whole; a wake, whose
  // water leans ten times as far, does not blaze); seen from straight above it is this share. still: the lean of the fine wavelets from and to
  // which a crest shows; the patches they lie in, beside the hull and toward the horizon; the even sheen far off. glance: the angle (radians)
  // within which the eye meets the water at a glance
  sheen: { soon: 70.0, held: 22.0, above: 0.32, crest: [0.55, 1.15], patch: [0.62, 0.3, 0.35], even: 0.1, near: [1.6, 3.6], glance: 0.26 },
  haze: { fire: [0.35, 1.2], gather: 0.08, least: 0.03 },      // how bright a thing must be to count as giving off light; how fast lit water gathers along a sight line (per metre); the least sine of the eye's angle counted (the path through water never runs longer than depth / this)
  rest: { every: [2.7, 1.5], ahead: 1.2, radius: 0.2, slow: 0.6 },      // a boat at rest: seconds between two breaths (and what chance adds), how far ahead and astern they leave, their size, the speed below which the boat counts as lying still
};
const f = (x) => Number(x).toFixed(4);
const OVER_X = 1.10, OVER_Y = 1.16;               // the reflection sees this much more than the view
const PAINT_LIGHTS = 8;                           // the realm's local lights that reach things lying on the water (gouache.js keeps eight)
const FILM_STOPS = 8;                             // colours a pigment of the dye film may take along the route (look.film.route)
const MIRROR_PIXELS = { high: 0.9e6, medium: 0.7e6, low: 0.5e6 };        // the mirror never grows beyond this, however large the window
const MIRROR_FINER = 1.44;                        // ... times this at most, for a realm that asks for a finer mirror (look.mirrorScale above 1)
const SWELL_GRID = { high: { cell: 1, flat: 48 }, medium: { cell: 1.5, flat: 32 }, low: { cell: 2, flat: 24 } };
// the three smears: size relative to the reflection, kernel sigma and tap spacing as fractions of its height
const SMEARS = [{ scale: 0.5, sigma: 0.0090, step: 0.0035 }, { scale: 0.5, sigma: 0.032, step: 0.0112 }, { scale: 0.25, sigma: 0.109, step: 0.0385 }];
// slow swells (in the light only): angle off the wind (radians), wavelength (m), weight
const SLOW = [{ a: -0.38, l: 17.0, w: 1.0 }, { a: 0.21, l: 11.3, w: 0.9 }, { a: -0.08, l: 7.1, w: 0.75 }, { a: 0.52, l: 8.9, w: 0.6 }, { a: -0.7, l: 5.3, w: 0.5 }];
// wavelets: size of one repeat of the wave texture (m), angle off the wind, fixed offset
const LAYERS = [{ tile: 19.7, rot: 0.26, off: [0.13, 0.71] }, { tile: 7.3, rot: -0.47, off: [0.57, 0.29] }, { tile: 2.63, rot: 1.05, off: [0.83, 0.47] }];
const WAVE_PEAK = 6.5;                            // the wave texture's dominant waves per repeat
const SPEED = 0.3;                                // how fast waves travel compared with real ones (a slow, heavy water)
const SWELL3 = [{ len: 0.75, turn: -0.31, w: 0.33 }, { len: 1.0, turn: 0.0, w: 0.45 }, { len: 1.25, turn: 0.27, w: 0.22 }];   // the true swell: three long waves

const _v = new THREE.Vector3(), _n = new THREE.Vector3(0, 1, 0), _camPos = new THREE.Vector3(), _look = new THREE.Vector3(), _target = new THREE.Vector3();
const _rot = new THREE.Matrix4(), _plane = new THREE.Plane(), _clip = new THREE.Vector4(), _q = new THREE.Vector4(), _col = new THREE.Color();
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
// A look is written by many hands and blended every frame: whatever arrives, the water takes only finite numbers of the
// right kind and in a sane range (anything else falls back to the default), so that one bad value in a realm can never
// blank the water, and never stays in it after the value has been put right.
const num = (x, d) => (typeof x === 'number' && Number.isFinite(x) ? x : d);
const rng = (x, d, lo, hi) => { const v = typeof x === 'number' && Number.isFinite(x) ? x : d; return v < lo ? lo : v > hi ? hi : v; };
const vec = (v, d, n) => { if (!v || typeof v !== 'object' || !(v.length >= n)) return d; for (let i = 0; i < n; i++) if (!(typeof v[i] === 'number' && Number.isFinite(v[i]))) return d; return v; };
const sub = (v, d) => (v && typeof v === 'object' && !v.isColor && !v.isTexture ? v : d);
const tone = (c) => (c >= 0 ? (c > 1000 ? 1000 : c) : 0);         // (NaN and negative light: none)
const setColor = (target, v) => {
  if (v && v.isColor) target.copy(v); else if (typeof v === 'string' || (typeof v === 'number' && Number.isFinite(v))) target.set(v);
  target.r = tone(target.r); target.g = tone(target.g); target.b = tone(target.b);
  return target;
};

// ------------------------------------------------------------------------------------------------ the wave texture
function fft1(re, im, n) {
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) { let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = TAU / len, wr = Math.cos(ang), wi = Math.sin(ang), half = len >> 1;
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let j = 0; j < half; j++) {
        const a = i + j, b = a + half, xr = re[b] * cr - im[b] * ci, xi = re[b] * ci + im[b] * cr;
        re[b] = re[a] - xr; im[b] = im[a] - xi; re[a] += xr; im[a] += xi;
        const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t;
      }
    }
  }
}
function fft2(re, im, n) {
  const tr = new Float64Array(n), ti = new Float64Array(n);
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) { tr[x] = re[y * n + x]; ti[x] = im[y * n + x]; }
    fft1(tr, ti, n);
    for (let x = 0; x < n; x++) { re[y * n + x] = tr[x]; im[y * n + x] = ti[x]; }
  }
  for (let x = 0; x < n; x++) {
    for (let y = 0; y < n; y++) { tr[y] = re[y * n + x]; ti[y] = im[y * n + x]; }
    fft1(tr, ti, n);
    for (let y = 0; y < n; y++) { re[y * n + x] = tr[y]; im[y * n + x] = ti[y]; }
  }
}
/**
 * A tileable field of travelling waves. The texture holds the slope of a complex wave field Z: (Re dZ/du, Re dZ/dv,
 * Im dZ/du, Im dZ/dv). The surface at time t is Re(Z e^-iwt), so slope = rg cos(wt) + ba sin(wt), and every wave in
 * it moves along its own direction (mostly toward +u, the wind).
 */
function makeWaveTexture(n = 256, seed = 11) {
  let s = seed; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const xr = new Float64Array(n * n), xi = new Float64Array(n * n), zr = new Float64Array(n * n), zi = new Float64Array(n * n);
  for (let iz = 0; iz < n; iz++) for (let ix = 0; ix < n; ix++) {
    const kx = ix < n / 2 ? ix : ix - n, kz = iz < n / 2 ? iz : iz - n, k = Math.hypot(kx, kz);
    const u1 = rnd(), u2 = rnd();
    if (k < 1.5 || k > n * 0.19) continue;
    const th = Math.atan2(kz, kx), dir = Math.pow(Math.max(0, Math.cos(th * 0.5)), 4.0);
    const a = Math.pow(k, -2.5) * Math.exp(-Math.pow(4.5 / k, 3)) * Math.exp(-(k * k) / (34 * 34)) * dir * Math.sqrt(-Math.log(Math.max(1e-6, u1)));
    const ph = u2 * TAU, re = a * Math.cos(ph), im = a * Math.sin(ph), o = iz * n + ix;
    xr[o] = -TAU * kx * im; xi[o] = TAU * kx * re;         // i k Z
    zr[o] = -TAU * kz * im; zi[o] = TAU * kz * re;
  }
  fft2(xr, xi, n); fft2(zr, zi, n);
  let sum = 0;
  for (let i = 0; i < n * n; i++) sum += xr[i] * xr[i] + xi[i] * xi[i] + zr[i] * zr[i] + zi[i] * zi[i];
  const norm = 1 / Math.sqrt(sum / (n * n) / 4);            // each stored channel has unit strength on average
  const data = new Uint16Array(n * n * 4), half = THREE.DataUtils.toHalfFloat;
  for (let i = 0; i < n * n; i++) {
    data[i * 4] = half(xr[i] * norm); data[i * 4 + 1] = half(zr[i] * norm); data[i * 4 + 2] = half(xi[i] * norm); data[i * 4 + 3] = half(zi[i] * norm);
  }
  const t = new THREE.DataTexture(data, n, n, THREE.RGBAFormat, THREE.HalfFloatType);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter;
  t.generateMipmaps = true; t.colorSpace = THREE.NoColorSpace; t.needsUpdate = true;
  return t;
}

/** The sheet for flat water: a disc of rings that grow with distance, so that small triangles near the rider keep the interpolated position exact. */
function makeDisc() {
  const SEG = 48, radii = [];
  for (let r = 0.75; r < 2600; r *= 1.42) radii.push(r);
  const pos = [0, 0, 0], idx = [];
  for (const r of radii) for (let i = 0; i < SEG; i++) { const a = i / SEG * TAU; pos.push(Math.cos(a) * r, 0, Math.sin(a) * r); }
  for (let i = 0; i < SEG; i++) idx.push(0, 1 + (i + 1) % SEG, 1 + i);
  for (let j = 0; j < radii.length - 1; j++) for (let i = 0; i < SEG; i++) {
    const a = 1 + j * SEG + i, b = 1 + j * SEG + (i + 1) % SEG, c = a + SEG, d = b + SEG;
    idx.push(a, b, c, b, d, c);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx);
  return geo;
}

/** The sheet for a sea with swell: square cells round the rider (so the waves never swim), growing with distance. */
function makeSwellGrid(cell, flat, reach = 1300) {
  const steps = [0];
  for (let i = 1; i <= flat; i++) steps.push(i * cell);
  let d = cell;
  while (steps[steps.length - 1] < reach) { d *= 1.1; steps.push(steps[steps.length - 1] + d); }
  const m = steps.length - 1, side = 2 * m + 1, at = (i) => (i < m ? -steps[m - i] : steps[i - m]);
  const pos = new Float32Array(side * side * 3);
  for (let j = 0; j < side; j++) for (let i = 0; i < side; i++) { const o = (j * side + i) * 3; pos[o] = at(i); pos[o + 1] = 0; pos[o + 2] = at(j); }
  const idx = new (side * side > 65535 ? Uint32Array : Uint16Array)((side - 1) * (side - 1) * 6);
  let k = 0;
  for (let j = 0; j < side - 1; j++) for (let i = 0; i < side - 1; i++) { const a = j * side + i, b = a + 1, c = a + side, e = c + 1; idx[k++] = a; idx[k++] = c; idx[k++] = b; idx[k++] = b; idx[k++] = c; idx[k++] = e; }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setIndex(new THREE.BufferAttribute(idx, 1));
  return geo;
}

// ------------------------------------------------------------------------------------------------ GLSL shared with realms
/**
 * For a realm's own shaders: the ripple field, the trace and the swell. Put ${WATER_GLSL} in a shader and give its
 * material the uniforms from waterUniforms(engine).
 *   vec4 waterRipple(vec2 xz)   xy = slope of the rippled surface, z = wash (churned water), w = how disturbed the water is (0..1)
 *   vec4 waterTrace(vec2 xz)    r, g = the two pigments of the dye film, b = light that lingers where the water was touched, a = how open the skin is
 *   float waterSwell(vec2 xz)   height of the swell there, in metres (0 without a swell); vec2 waterSwellSlope(vec2 xz)
 */
export const WATER_GLSL = /* glsl */`
  uniform sampler2D tRipple, tTrace;
  uniform vec4 uRippleRect, uTraceRect, uSwell[3];
  vec4 waterRipple(vec2 xz) {
    vec2 uv = (xz - uRippleRect.xy) / uRippleRect.zw + 0.5, e = min(uv, 1.0 - uv);
    return min(e.x, e.y) > 0.0 ? texture2D(tRipple, uv) * smoothstep(0.0, 0.08, min(e.x, e.y)) : vec4(0.0);
  }
  vec4 waterTrace(vec2 xz) {
    vec2 uv = (xz - uTraceRect.xy) / uTraceRect.zw + 0.5, e = min(uv, 1.0 - uv);
    return min(e.x, e.y) > 0.0 ? texture2D(tTrace, uv) : vec4(0.0);
  }
  float waterSwell(vec2 xz) {
    float h = 0.0;
    for (int i = 0; i < 3; i++) { float ph = dot(uSwell[i].xy, xz) - uSwell[i].z, a = uSwell[i].w; h += a * cos(ph) + 0.5 * length(uSwell[i].xy) * a * a * cos(2.0 * ph); }
    return h;
  }
  vec2 waterSwellSlope(vec2 xz) {
    vec2 s = vec2(0.0);
    for (int i = 0; i < 3; i++) { float ph = dot(uSwell[i].xy, xz) - uSwell[i].z, a = uSwell[i].w; s -= uSwell[i].xy * (a * sin(ph) + length(uSwell[i].xy) * a * a * sin(2.0 * ph)); }
    return s;
  }
`;

// ---- GLSL that is written once and used twice: by the water's own shaders (with its own uniforms) and by the pieces
// realms are given below (with the shared uniforms). A realm's sheet that lies on the water, or draws light on the
// water's own rain rings, takes these pieces instead of copying lines out of this file: they cannot drift apart.
/** The surface over a place: statements that lift `world` (a vec3 or vec4 in the world) onto the water. */
const liftGlsl = (height, lift, well, wellB) => /* glsl */`
    if (${lift}.x > 0.5) {
      float h = ${height}(world.xz) * (1.0 - smoothstep(${lift}.y, ${lift}.z, distance(world.xz, cameraPosition.xz)));
      vec2 q = world.xz - ${well}.xy;
      float ahead = dot(q, ${well}.zw), side = dot(q, vec2(-${well}.w, ${well}.z));
      float d = length(vec2(side, ahead - clamp(ahead, -1.7, 2.0)));
      world.y += mix(h, ${wellB}.x + ahead * ${wellB}.y + side * ${wellB}.z, 1.0 - smoothstep(0.9, 3.4, d));
    }`;
/** The front at a place p: 0 ahead of the line, 1 behind it (before its edge is eased). */
const frontGlsl = (front, p) => `clamp((${front}.z - dot(${front}.xy, ${p})) * ${front}.w + 0.5, 0.0, 1.0)`;
/** Rings of rain per square metre per second at a place: the look's rain (gated by the front) and every rain zone. */
const rainAtGlsl = (name, rain, zoneA, zoneB, zones) => /* glsl */`
  float ${name}(vec2 p, float front) {
    float rate = ${rain}.x * mix(1.0, front, ${rain}.w);
    for (int i = 0; i < ${MAX_ZONES}; i++) {
      if (i >= ${zones}) break;
      vec2 ab = ${zoneA}[i].zw - ${zoneA}[i].xy, ap = p - ${zoneA}[i].xy;
      float t = clamp(dot(ap, ab) / max(dot(ab, ab), 1e-6), 0.0, 1.0);
      rate += ${zoneB}[i].y * (1.0 - smoothstep(${zoneB}[i].x - ${zoneB}[i].z, ${zoneB}[i].x + ${zoneB}[i].z, length(ap - ab * t)));
    }
    return rate;
  }`;
const HASH3_GLSL = (name) => `vec3 ${name}(vec2 p) { vec3 q = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973)); q += dot(q, q.yxz + 33.33); return fract((q.xxy + q.yzz) * q.zyx); }`;
/** The drop that the cell `cid` of a grid of rain hosts now (inside a loop: a cell without one is passed over). */
const rainDropGlsl = (hash) => /* glsl */`
      vec3 h = ${hash}(cid + seed);
      float cyc = t + h.z, n = floor(cyc), ph = cyc - n;
      vec3 k = ${hash}(cid + seed + n * 17.37);
      if (k.z > prob) continue;
      vec2 d = p - (cid + 0.25 + 0.5 * k.xy) * cell;
      float heavy = fract(k.z * 91.7), size = 0.5 + 0.5 * fract(k.z * 37.3);
      float r = length(d), gap = r - (0.04 + 0.66 * ph * size) * cell, x = gap / 0.065;`;
// Rings of rain finer than the simulated water can hold: every cell of a grid hosts one drop at a time, at a new random
// place each time, and no two alike (most are slight, a few heavy; each ring grows to its own size). Returns the slope
// of the ring (xy) and, for water that lights where it is struck: the ring as a hairline broken into arcs (z), and how
// hard the drop stirs the water it is crossing (w: a spark where it lands, then a widening band).
const rainRingsGlsl = (name, hash) => /* glsl */`
  vec4 ${name}(vec2 p, float cell, float seed, float t, float prob, float foot) {
    vec2 g = p / cell, id = floor(g), f = g - id, base = id - step(f, vec2(0.5));
    vec4 acc = vec4(0.0);
    for (int j = 0; j < 2; j++) for (int i = 0; i < 2; i++) {
      vec2 cid = base + vec2(float(i), float(j));${rainDropGlsl(hash)}
      float born = smoothstep(0.0, 0.07, ph), env = exp(-x * x) * (1.0 - ph) * (1.0 - ph) * born;
      vec2 u = d / max(r, 1e-3);
      acc.xy += u * (env * sin(x * 3.3) * (0.6 + 0.4 * size));
      heavy = 0.2 + 0.8 * heavy * heavy;
      vec2 n1 = normalize(h.xy - 0.5 + 1e-4), n2 = normalize(k.yx - 0.5 + 1e-4);
      float arc = smoothstep(-0.3, 0.4, 0.7 * dot(vec2(u.x * u.x - u.y * u.y, 2.0 * u.x * u.y), n1) + 0.6 * dot(u, n2));
      float wd = max(0.007, 0.7 * foot), q = gap / wd;
      acc.z += exp(-q * q) * arc * heavy * (1.0 - ph) * born * min(1.0, 0.012 / wd);
      acc.w += heavy * (2.2 * exp(-x * x * 0.7) * (1.0 - ph) * born * (0.45 + 0.55 * arc) + 2.5 * exp(-r * r / 0.0016) * (1.0 - smoothstep(0.0, 0.3, ph)));
    }
    return acc;
  }`;
// The two families of rings the surface draws: where each asks (the place shifted by `shift`), its cell in metres, its
// seed, the pace and start of its clock, and its share of the rate as the chance that a cell holds a drop.
const RAIN_FAMILIES = [{ shift: 0, cell: 0.5, seed: 3.1, pace: 1, start: 0, share: 0.14 }, { shift: 7.3, cell: 0.72, seed: 9.7, pace: 0.83, start: 0.4, share: 0.18 }];
const famPlace = (F, p) => (F.shift ? `${p} + ${F.shift}` : p);
const famClock = (F, rain) => (F.pace === 1 && !F.start ? `${rain}.y` : `${rain}.y * ${F.pace} + ${F.start}`);
const famRings = (F, fn, rain, rate) => `${fn}(${famPlace(F, 'p')}, ${F.cell}, ${F.seed}, ${famClock(F, rain)}, ${rate} * ${F.share}, fp)`;

/**
 * The fine ripple window (a quarter of the wide one's size, round the boat: pin rings, raindrops, the feathering of
 * the bow wave). After WATER_GLSL; uniforms from waterUniforms(engine).
 *   vec4 waterRippleFine(vec2 xz)   the same four numbers as waterRipple, from the fine window (nothing outside it)
 *   vec4 waterRippleBoth(vec2 xz)   both windows: xy = the two slopes added, z = the greater wash, w = the greater liveliness
 */
export const WATER_FINE_GLSL = /* glsl */`
  uniform sampler2D tRippleFine;
  uniform vec4 uRippleFineRect;
  vec4 waterRippleFine(vec2 xz) {
    vec2 uv = (xz - uRippleFineRect.xy) / uRippleFineRect.zw + 0.5, e = min(uv, 1.0 - uv);
    return min(e.x, e.y) > 0.0 ? texture2D(tRippleFine, uv) * smoothstep(0.0, 0.16, min(e.x, e.y)) : vec4(0.0);
  }
  vec4 waterRippleBoth(vec2 xz) {
    vec4 w = waterRipple(xz), f = waterRippleFine(xz);
    return vec4(w.xy + f.xy, max(w.z, f.z), max(w.w, f.w));
  }
`;
/**
 * The water's surface, for a vertex shader whose mesh must lie ON the water (a sheet of light, things drawn at the
 * waterline): the very statements the water's own vertex shader runs (the swell, eased out with distance from the eye,
 * and the well round the hull). After WATER_GLSL; uniforms from waterUniforms(engine); a THREE.ShaderMaterial (it uses
 * cameraPosition). On the water's own grid (water.overlay) the result is the water's surface exactly.
 *   vec3 waterSurface(vec3 world)   the same place, lifted by the water's height there (flat water: unchanged)
 *   float waterHeight(vec2 xz)      that height alone, in metres
 */
export const WATER_SURFACE_GLSL = /* glsl */`
  uniform vec4 uWaterLift, uWaterWell, uWaterWellB;
  vec3 waterSurface(vec3 world) {${liftGlsl('waterSwell', 'uWaterLift', 'uWaterWell', 'uWaterWellB')}
    return world;
  }
  float waterHeight(vec2 xz) { return waterSurface(vec3(xz.x, 0.0, xz.y)).y; }
`;
/**
 * The water's rain, for a realm that draws its own light on the very rings the water bends: the same cells, seeds and
 * clock (this text and the surface's own are one). Uniforms from waterUniforms(engine).
 *   float waterFront(vec2 xz)                 0 ahead of the look's front .. 1 behind it
 *   float waterRainRate(vec2 xz)              rings per square metre per second there (the look's rain and every rain zone)
 *   vec4 waterRain(vec2 xz, float foot)       the rings the surface draws there (foot: metres of water under a pixel): xy = their
 *                                             slope, z = each ring as a hairline broken into arcs, w = how hard the drops stir the water
 *   vec4 waterRainFamily(vec2 xz, int f)      family f (0 .. WATER_RAIN_FAMILIES - 1): xy = the place to ask in its grid, z = its cell, w = its seed
 *   vec2 waterRainClock(int f, float rate)    its clock now, and the chance that one of its cells holds a drop at that rate
 *   vec2 waterRainBase(vec2 p, float cell)    the first of the four cells whose drops may reach p (the others: + (1, 0), (0, 1), (1, 1))
 *   bool waterRainCell(p, cid, cell, seed, t, prob, out WaterDrop)   the drop of one cell, if it holds one now
 *   vec4 waterRainRings(p, cell, seed, t, prob, foot)                one family's rings, as waterRain sums them (for a family of your own)
 */
export const WATER_RAIN_GLSL = /* glsl */`
  uniform vec4 uWaterRain, uWaterFront, uWaterZoneA[${MAX_ZONES}], uWaterZoneB[${MAX_ZONES}];
  uniform int uWaterZones;
  const int WATER_RAIN_FAMILIES = ${RAIN_FAMILIES.length};
  // d: from the drop's centre to the place asked about, metres. age: 0 as it lands .. 1 as its ring is gone. gap: metres from the
  // place to its ring (negative inside the ring). heavy 0.2 .. 1, size 0.5 .. 1: its own. h, k: its cell's and its own random numbers
  struct WaterDrop { vec2 d; float age; float gap; float heavy; float size; vec3 h; vec3 k; };
  ${HASH3_GLSL('waterHash3')}
  float waterFront(vec2 xz) { float f = ${frontGlsl('uWaterFront', 'xz')}; return f * f * (3.0 - 2.0 * f); }
  ${rainAtGlsl('waterRainAt', 'uWaterRain', 'uWaterZoneA', 'uWaterZoneB', 'uWaterZones')}
  float waterRainRate(vec2 xz) { return waterRainAt(xz, waterFront(xz)); }
  vec4 waterRainFamily(vec2 xz, int f) { return ${RAIN_FAMILIES.map((F, i) => `${i < RAIN_FAMILIES.length - 1 ? `f == ${i} ? ` : ''}vec4(${famPlace(F, 'xz')}, ${F.cell}, ${F.seed})`).join(' : ')}; }
  vec2 waterRainClock(int f, float rate) { return ${RAIN_FAMILIES.map((F, i) => `${i < RAIN_FAMILIES.length - 1 ? `f == ${i} ? ` : ''}vec2(${famClock(F, 'uWaterRain')}, rate * ${F.share})`).join(' : ')}; }
  vec2 waterRainBase(vec2 p, float cell) { vec2 g = p / cell, id = floor(g), f = g - id; return id - step(f, vec2(0.5)); }
  bool waterRainCell(vec2 p, vec2 cid, float cell, float seed, float t, float prob, out WaterDrop drop) {
    for (int once = 0; once < 1; once++) {${rainDropGlsl('waterHash3')}
      drop = WaterDrop(d, ph, gap, 0.2 + 0.8 * heavy * heavy, size, h, k);
      return true;
    }
    drop = WaterDrop(vec2(0.0), 1.0, 0.0, 0.0, 0.0, vec3(0.0), vec3(0.0));
    return false;
  }
  ${rainRingsGlsl('waterRainRings', 'waterHash3')}
  vec4 waterRain(vec2 p, float fp) {
    float rainRate = waterRainRate(p);
    return rainRate > 0.0 ? ${RAIN_FAMILIES.map((F) => famRings(F, 'waterRainRings', 'uWaterRain', 'rainRate')).join(' + ')} : vec4(0.0);
  }
`;
/** The uniforms WATER_GLSL and the pieces above need (shared objects: the water keeps them up to date). */
export function waterUniforms(engine) {
  const s = engine.shared, v4 = (x = 0, y = 0, z = 0, w = 0) => ({ value: new THREE.Vector4(x, y, z, w) });
  if (!s.tRipple) s.tRipple = { value: null };
  if (!s.uRippleRect) s.uRippleRect = { value: new THREE.Vector4(0, 0, 64, 64) };
  if (!s.tTrace) s.tTrace = { value: null };
  if (!s.uTraceRect) s.uTraceRect = { value: new THREE.Vector4(0, 0, 1, 1) };
  if (!s.uSwell) s.uSwell = { value: [new THREE.Vector4(0, 0, 0, 0), new THREE.Vector4(0, 0, 0, 0), new THREE.Vector4(0, 0, 0, 0)] };      // (wave vector x, z; phase; amplitude: none until a realm raises a swell)
  if (!s.tRippleFine) s.tRippleFine = { value: null };                // the fine ripple window ...
  if (!s.uRippleFineRect) s.uRippleFineRect = v4(0, 0, 16, 16);      // ... centre x, z, size x, z
  if (!s.uWaterLift) s.uWaterLift = v4(0, TUNE.swellNear, TUNE.swellFar, 0);      // 1 while a swell is up; it lifts the surface fully within y metres of the eye, not at all beyond z
  if (!s.uWaterWell) s.uWaterWell = v4(0, 0, 0, -1);                  // the well round the hull: boat x, z, forward x, z ...
  if (!s.uWaterWellB) s.uWaterWellB = v4();                           // ... its height, rise per metre ahead, per metre to starboard
  if (!s.uWaterRain) s.uWaterRain = v4();                             // rings per square metre per second everywhere, the rain's clock, its strength, how far the front gates it
  if (!s.uWaterFront) s.uWaterFront = v4(1, 0, 1e6, 0.1);             // the front: normal x, z, offset, 1 / width
  if (!s.uWaterZoneA) { s.uWaterZoneA = { value: Array.from({ length: MAX_ZONES }, () => new THREE.Vector4()) }; s.uWaterZoneB = { value: Array.from({ length: MAX_ZONES }, () => new THREE.Vector4(1, 0, 0.5, 1)) }; s.uWaterZones = { value: 0 }; }      // rain zones: a capsule from xy to zw; radius, rate, soft edge, strength
  return { tRipple: s.tRipple, uRippleRect: s.uRippleRect, tTrace: s.tTrace, uTraceRect: s.uTraceRect, uSwell: s.uSwell,
    tRippleFine: s.tRippleFine, uRippleFineRect: s.uRippleFineRect, uWaterLift: s.uWaterLift, uWaterWell: s.uWaterWell, uWaterWellB: s.uWaterWellB,
    uWaterRain: s.uWaterRain, uWaterFront: s.uWaterFront, uWaterZoneA: s.uWaterZoneA, uWaterZoneB: s.uWaterZoneB, uWaterZones: s.uWaterZones };
}

// ------------------------------------------------------------------------------------------------ full-screen passes
const PASS_VERT = /* glsl */`varying vec2 vUv; void main() { vUv = position.xy * 0.5 + 0.5; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

// How far beyond the water the mirrored thing lies, as a share of the whole path from the eye (0 = it touches the water
// here, 1 = sky). Averaged over a few pixels so that silhouettes do not turn into steps when the water moves them.
const REACH_FRAG = /* glsl */`
  uniform sampler2D tDepth;
  uniform vec4 uDepthInfo, uPlane;
  uniform vec2 uInvFocal, uTexel;
  varying vec2 vUv;
  float reach(vec2 uv) {
    float zd = texture2D(tDepth, uv).r;
    if (zd > 0.99999) return 1.0;
    vec2 ndc = uv * 2.0 - 1.0;
    float depth = uDepthInfo.w / (zd * 2.0 - 1.0 - dot(uDepthInfo.xy, ndc) - uDepthInfo.z);
    float hit = -uPlane.w / dot(uPlane.xyz, vec3(ndc * uInvFocal, -1.0));       // where this pixel's ray meets the water
    return hit > 0.0 ? clamp(1.0 - hit / max(depth, 1e-3), 0.0, 1.0) : 1.0;
  }
  void main() {
    vec2 o = uTexel * 0.5;
    float q = reach(vUv + o) + reach(vUv - o) + reach(vUv + vec2(o.x, -o.y)) + reach(vUv + vec2(-o.x, o.y));
    gl_FragColor = vec4(q * 0.25, 0.0, 0.0, 1.0);
  }
`;

// Smear the reflection along the direction in which upright things reflect (toward the vanishing point of the
// vertical), folding the kernel back at the horizon so nothing from "under the world" bleeds in.
const SMEAR_FRAG = /* glsl */`
  uniform sampler2D tSrc;
  uniform vec2 uSize; uniform vec3 uVP, uLine;
  uniform float uStepPx, uSigmaPx, uBoost, uFirst;
  varying vec2 vUv;
  void main() {
    vec2 p = vUv * uSize;
    vec2 dir = uVP.xy - p * uVP.z; dir /= max(length(dir), 1e-5);
    vec4 acc = vec4(0.0); float sum = 0.0;
    float inv = 0.5 / (uSigmaPx * uSigmaPx), tail = exp(-64.0 * uStepPx * uStepPx * inv);
    for (int i = -7; i <= 7; i++) {
      float o = float(i) * uStepPx;
      vec2 q = p + dir * o;
      float side = dot(uLine.xy, q) + uLine.z;
      q -= 2.0 * min(side, 0.0) * uLine.xy;
      float w = exp(-o * o * inv) - tail;
      vec4 c = textureLod(tSrc, q / uSize, 0.0);
      c.rgb = mix(clamp(c.rgb, 0.0, 48.0), vec3(0.0), isnan(c.rgb));
      float luma = dot(c.rgb, vec3(0.3, 0.55, 0.15));
      float lights = smoothstep(0.9, 1.8, luma);                  // only things that shine count as lights
      c.a = mix(c.a, luma * lights, uFirst);
      c.rgb *= 1.0 + uBoost * lights * uFirst;
      acc += c * w; sum += w;
    }
    gl_FragColor = acc / sum;
  }
`;

// ------------------------------------------------------------------------------------------------ the surface
const SWELL_GLSL = /* glsl */`
  uniform vec4 uSwellK[3];                  // the true swell: wave vector x, z; phase; amplitude
  float swellHeight(vec2 p) {
    float h = 0.0;
    for (int i = 0; i < 3; i++) { float ph = dot(uSwellK[i].xy, p) - uSwellK[i].z, a = uSwellK[i].w; h += a * cos(ph) + 0.5 * length(uSwellK[i].xy) * a * a * cos(2.0 * ph); }
    return h;
  }
  vec2 swellSlope(vec2 p) {
    vec2 s = vec2(0.0);
    for (int i = 0; i < 3; i++) { float ph = dot(uSwellK[i].xy, p) - uSwellK[i].z, a = uSwellK[i].w; s -= uSwellK[i].xy * (a * sin(ph) + length(uSwellK[i].xy) * a * a * sin(2.0 * ph)); }
    return s;
  }
`;
const VERT = /* glsl */`
  uniform mat4 uTextureMatrix;
  uniform vec4 uSwellOn;                    // 1 when the swell is up; it lifts the surface fully within x metres of the eye, not at all beyond y
  uniform vec4 uWell, uWellB;               // the water round the hull follows the hull: boat x, z, forward x, z; height, rise per metre ahead, per metre to starboard
  ${SWELL_GLSL}
  varying vec3 vWorld; varying vec4 vRefl;
  #include <fog_pars_vertex>
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);${liftGlsl('swellHeight', 'uSwellOn', 'uWell', 'uWellB')}
    vWorld = world.xyz;
    vRefl = uTextureMatrix * vec4(world.x, 0.0, world.z, 1.0);
    vec4 mvPosition = viewMatrix * world;
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`;
const FRAG = /* glsl */`
  uniform sampler2D tRefl, tS1, tS2, tS3, tReach, tWave, tScene, tSceneDepth;
  uniform sampler2D tRipF, tRipW, tRidgeF, tRidgeW, tTrace, tFleck, tSkin;     // (fifteen samplers in all; sixteen is the most a fragment shader is sure to get)
  uniform vec4 uScreen;                     // 1 / width and height of the picture, the camera's near and far
  uniform vec3 uCamR, uCamU, uCamF; uniform float uPixel;      // the camera's axes in the world; radians to a pixel at the middle of the picture
  uniform vec4 uPre;                        // the engine's picture of the scene without the water: width, height and their inverses
  uniform vec4 uBelow;                      // 1 when the view beneath the water is to hand, half the projection's scale (x, y), how fast the water swallows light (per metre)
  uniform vec4 uSee;                        // how much of translucent things beneath shows, where seeing in starts to fail and ends (metres), soft edge (metres of depth)
  uniform vec4 uAbsorb;                     // tint of things at depth: rgb at 1 / w metres
  uniform vec2 uRefract;                    // how far ripples bend what lies beneath, and the depth up to which that grows
  uniform mat4 uTextureMatrix;
  uniform vec2 uReflSize;                   // the reflection, in pixels
  uniform float uFocal;                     // pixels of the reflection per radian
  uniform vec3 uVP;                         // where upright things point in the reflection (homogeneous, pixels)
  uniform vec3 uLevelVar;                   // how long each smear is (pixels squared)
  uniform vec4 uSlowA[5], uSlowB[5];        // slow swells: A: wave vector, phase   B: slope along x and z
  uniform vec4 uLayerA[3], uLayerB[3];      // A: direction of travel, 1 / repeat   B: drift, cos and sin of the phase
  uniform vec4 uAmp, uInvLambda;            // slow swells and the three wavelet layers: slope, 1 / wavelength
  uniform vec4 uRipF, uRipW;                // the ripple windows: centre x, z, 1 / size, cells across
  uniform vec3 uGust;                       // time, depth of the calm patches, seconds
  uniform vec4 uRain;                       // rings per square metre per second everywhere, time, strength, how far the front gates it
  uniform vec4 uZoneA[${MAX_ZONES}], uZoneB[${MAX_ZONES}]; uniform int uZones;
  uniform vec4 uFront;                      // the front: normal x, z, offset, 1 / width
  uniform float uFrontCalm;
  uniform vec4 uLamp; uniform vec3 uLampColor;
  uniform vec4 uCurve;                      // the mirror: floor, cap, exponent, -
  uniform vec4 uClear;                      // a window round the rider: radius, soft, floor
  uniform vec2 uGrade;                      // the reflection: darker by x, richer by y
  uniform float uRough2, uSmear, uColumn, uStreak, uSparkle, uFoam, uChurn, uVeil, uSwellAmt;
  uniform vec3 uDeep, uShallow, uSparkleColor, uGlow, uRippleGlow, uReflectionTint;
  uniform vec4 uSun; uniform vec3 uSunDir, uSunColor;                 // sun path: strength, spread2, glitter, -
  uniform vec4 uLattice, uLatticeB, uLatticeC; uniform vec3 uLatticeColor;   // centre x, z, radius, amount; wave number, front radius, ring radius, ring amount; time
  uniform float uLatPhase[8];
  uniform vec4 uTraceRect;                  // the trace: centre x, z, 1 / size x, 1 / size z
  uniform vec4 uFilmLine; uniform float uFilmHalf;                     // beyond the trace the waterway is taken for one straight line: a point on it, its direction; its half width
  uniform vec4 uFilm, uFilmB; uniform vec3 uFilmA, uFilmBc, uFilmMix;  // amount, cover, split, 1 / scale; flow offset, matte, light, on
  uniform vec4 uSkin, uSkinB; uniform vec3 uSkinTint;                  // amount, kind, 1 / scale, plate size; sheen, light, 1 where the trace holds standing open water, -
  uniform vec4 uTouch; uniform vec3 uTouchColor;                       // amount, fleck scale, wake share, -
  uniform vec3 uPaint;                                                 // the realm's painted light on a level surface: what lights matte things lying on the water
  uniform vec4 uLantern, uKept, uLights[${PAINT_LIGHTS}];             // the bow lantern, the realm's kept lamp and its local lights: position, reach
  uniform vec3 uLanternColor, uKeptColor, uLightColors[${PAINT_LIGHTS}]; uniform int uLightCount;
  // ---- what the areas asked the water for (each is nothing until a look asks: the picture without them is as it was)
  uniform float uColumnOwn;      // 1: the look gives the columns' strength itself (column): they stand on water a front has calmed too
  uniform float uColumnFar, uSpare, uTremor;      // lights grow no columns beyond this distance (0: no limit); how far lights in the mirror are spared its grade; how far standing waves bend what lies beneath (below 0: as the ripples do)
  uniform vec4 uSheen, uSheenB; uniform vec3 uSheenColor;      // sky-light on leaning water: on living ripples, on water at rest, at a glance, where rain falls far off; how much its lines hide, how much lamp light it takes
  uniform sampler2D tHaze;                        // (the sixteenth sampler, and the last a fragment shader is sure to get) a look's picture of where the water is lit
  uniform vec4 uHaze, uHazeD, uHazeRect; uniform vec3 uHazeColor, uHazeDeep;      // the water between: per metre of sight, per metre of depth, how far lights are spared, on; depths from and to which its colour turns deep, how lit; the picture's centre x, z, 1 / size x, z
  uniform vec4 uLine; uniform vec3 uLineColor;    // the waterline: width (metres), reach (metres), -, on
  uniform vec4 uFilmC;                            // the film: how far its edge is brushed, how far the light's colour tints it
  uniform vec4 uFilmStopA[${FILM_STOPS}], uFilmStopB[${FILM_STOPS}]; uniform int uFilmStopsA, uFilmStopsB;      // its pigments' colours along the route: rgb at so many metres along the waterway's line; how many stops each has (0: one colour)
  uniform vec4 uTouchAge; uniform vec3 uTouchFresh, uTouchLate, uTouchDying;      // light from touch by age: the ages at which it turns from dying to late, late to itself, itself to fresh; on
  ${SWELL_GLSL}
  ${FILM_GLSL}
  varying vec3 vWorld; varying vec4 vRefl;
  #include <fog_pars_fragment>

  vec2 layer(vec2 p, vec4 a, vec4 b, out vec4 raw) {
    vec2 across = vec2(-a.y, a.x);
    raw = texture2D(tWave, vec2(dot(p, a.xy), dot(p, across)) * a.z - b.xy);
    vec2 s = raw.xy * b.z + raw.zw * b.w;
    return a.xy * s.x + across * s.y;
  }
  // a ripple window seen close up: a smooth (cubic) reading of it, so its cells never show as facets
  vec4 cubic(sampler2D t, vec2 uv, float n) {
    vec2 st = uv * n - 0.5, i = floor(st), f = st - i, f2 = f * f, f3 = f2 * f;
    vec2 w0 = (1.0 - 3.0 * f + 3.0 * f2 - f3) / 6.0, w1 = (4.0 - 6.0 * f2 + 3.0 * f3) / 6.0, w3 = f3 / 6.0, w2 = 1.0 - w0 - w1 - w3;
    vec2 g0 = w0 + w1, g1 = w2 + w3;
    vec2 p0 = (i - 0.5 + w1 / g0) / n, p1 = (i + 1.5 + w3 / g1) / n;
    return g0.y * (g0.x * textureLod(t, vec2(p0.x, p0.y), 0.0) + g1.x * textureLod(t, vec2(p1.x, p0.y), 0.0))
         + g1.y * (g0.x * textureLod(t, vec2(p0.x, p1.y), 0.0) + g1.x * textureLod(t, vec2(p1.x, p1.y), 0.0));
  }
  float sceneZ(vec2 uv) { float d = textureLod(tSceneDepth, uv, 0.0).r; return uScreen.z * uScreen.w / (uScreen.w - d * (uScreen.w - uScreen.z)); }
  // Metres of water along the line of sight (k = metres per unit of view depth) before something solid. The scene's depth
  // comes smaller than the picture and unfiltered, so it is read here from the four nearest samples, by hand, counting only
  // those that lie behind the surface: a shoreline then fades smoothly, and nothing standing in front of the water cuts a
  // hole in it.
  float waterThickness(vec2 sc, float zW, float k) {
    vec2 st = sc * uPre.xy - 0.5, i = floor(st), f = st - i;
    vec4 z = vec4(sceneZ((i + vec2(0.5, 0.5)) * uPre.zw), sceneZ((i + vec2(1.5, 0.5)) * uPre.zw), sceneZ((i + vec2(0.5, 1.5)) * uPre.zw), sceneZ((i + vec2(1.5, 1.5)) * uPre.zw));
    vec4 w = vec4((1.0 - f.x) * (1.0 - f.y), f.x * (1.0 - f.y), (1.0 - f.x) * f.y, f.x * f.y) * step(vec4(zW), z);
    float sum = w.x + w.y + w.z + w.w;
    return sum > 1.0e-4 ? dot(w, z - zW) / sum * k : 1.0e3;
  }
  ${HASH3_GLSL('hash3')}
  // a lamp's light on a matte thing lying level on the water, as kit.gouache lights every painted surface
  vec3 lampLight(vec4 lamp, vec3 color) {
    vec3 d = lamp.xyz - vWorld; float dist = length(d), att = 1.0 - smoothstep(lamp.w * 0.25, lamp.w, dist);
    return color * (att * att * max(d.y / max(dist, 1e-3) * 0.6 + 0.4, 0.0));
  }
  // (rain rings finer than the simulated water can hold: rainRingsGlsl, above, which realms share as WATER_RAIN_GLSL)
  ${rainRingsGlsl('rainRings', 'hash3')}
  // Soft round points of light that come and go, about as many near as far: each cell of a grid (its mesh follows the
  // size of a pixel on the water) holds one, and it shows with the given chance. Never a hard shape, never a flake.
  float sparks(vec2 p, mat2 toPx, float foot, float chance, float seed) {
    float lv = max(log2(foot * 62.0), 0.0), l0 = floor(lv), fr = lv - l0, sum = 0.0;
    for (int i = 0; i < 2; i++) {
      float cell = 0.09 * exp2(l0 + float(i));
      vec2 id = floor(p / cell);
      vec3 h = hash3(id + seed + (l0 + float(i)) * 17.0);
      float cyc = uGust.z * (0.55 + 0.7 * h.z) + h.x * 7.0, ph = fract(cyc);
      vec3 k = hash3(id + floor(cyc) * 3.7 + seed + 5.0);
      vec2 dpx = toPx * (p - (id + 0.25 + 0.5 * k.xy) * cell);
      float b = sin(3.14159 * ph);
      sum += (i == 0 ? 1.0 - fr : fr) * step(k.z, chance) * (1.0 - smoothstep(0.4, 1.8, length(dpx))) * b * b;
    }
    return sum;
  }
  // Pixels to a metre, measured on the screen square to a line that lies on the water with normal n. (At a glancing angle
  // this is far less than the pixels between two points a metre apart: a line running away from the eye lies almost level
  // on the screen. Drawn by the wrong measure such lines come out thinner than a pixel and break into crawling dashes.)
  float pxAcross(vec2 n, vec2 fa, vec2 fb) { return 1.0 / max(length(vec2(dot(n, fa), dot(n, fb))), 1e-6); }
  // a wave crest from a ripple window: rd.xy is the way to the crest in metres, rd.z how much of a crest it is. Never
  // thinner than the screen can draw; where it would be, it is drawn a pixel wide and fainter.
  float crestLine(vec3 rd, vec2 fa, vec2 fb, float width) {
    float dl = length(rd.xy), ppm = pxAcross(rd.xy / max(dl, 1e-6), fa, fb);
    float lp = dl * ppm, wpx = width * ppm, halfPx = max(0.8, wpx);
    return rd.z * (1.0 - smoothstep(halfPx * 0.5, halfPx * 1.5, lp)) * min(1.0, sqrt(wpx / 0.8) + 0.35);
  }
  ${rainAtGlsl('rainAt', 'uRain', 'uZoneA', 'uZoneB', 'uZones')}
  vec2 voronoi(vec2 x, out vec2 id, out vec2 across) {       // x: distance to the nearest cell edge, y: a random number of the cell; across: the way square to that edge
    vec2 n = floor(x), f = x - n, mg, mr; float md = 8.0;
    for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
      vec2 g = vec2(float(i), float(j)), o = hash3(n + g).xy, r = g + o - f; float d = dot(r, r);
      if (d < md) { md = d; mr = r; mg = g; }
    }
    md = 8.0; across = vec2(1.0, 0.0);
    for (int j = -2; j <= 2; j++) for (int i = -2; i <= 2; i++) {
      vec2 g = mg + vec2(float(i), float(j)), o = hash3(n + g).xy, r = g + o - f;
      if (dot(mr - r, mr - r) > 1e-5) { vec2 e = normalize(r - mr); float d = dot(0.5 * (mr + r), e); if (d < md) { md = d; across = e; } }
    }
    id = n + mg;
    return vec2(md, hash3(n + mg + 3.1).z);
  }

  void main() {
    vec3 toCam = cameraPosition - vWorld;
    float dist = length(toCam);
    vec3 V = toCam / dist;
    vec2 p = vWorld.xz;
    // The patch of water one pixel covers, worked out from the camera (not from screen derivatives, which are noisy far
    // off and undefined inside branches): fa, fb = how far the surface point moves per pixel across and up the screen.
    vec3 ray = -V;
    float pix = uPixel * max(dot(ray, uCamF), 0.05), down = max(-ray.y, 1e-3);
    vec3 dR = (uCamR - ray * dot(ray, uCamR)) * pix, dU = (uCamU - ray * dot(ray, uCamU)) * pix;
    vec2 fa = dist * (dR.xz + ray.xz * (dR.y / down)), fb = dist * (dU.xz + ray.xz * (dU.y / down));
    float fp = max(length(fa), length(fb));                    // metres of water under this pixel, the long way
    float det = fa.x * fb.y - fa.y * fb.x;
    mat2 toPx = mat2(fb.y, -fa.y, -fb.x, fa.x) / (abs(det) > 1e-12 ? det : 1e-12);
    vec2 fwd = -toCam.xz / max(length(toCam.xz), 1e-4), rgt = vec2(-fwd.y, fwd.x);     // level, away from the eye; and to its right
    float veil = 1.0 - uVeil;

    // the front: 0 ahead of the line, 1 behind it. Behind it the waves blow (and the rain falls).
    float front = ${frontGlsl('uFront', 'p')};
    front = front * front * (3.0 - 2.0 * front);
    float blow = 1.0 - uFrontCalm * (1.0 - front);

    // ---- the living field round the boat: slope, liveliness, wash; and the crests of its waves
    vec2 uvF = (p - uRipF.xy) * uRipF.z + 0.5, eF = min(uvF, 1.0 - uvF);
    vec2 uvW = (p - uRipW.xy) * uRipW.z + 0.5, eW = min(uvW, 1.0 - uvW);
    float inF = smoothstep(0.0, 0.16, min(eF.x, eF.y)), inW = smoothstep(0.0, 0.1, min(eW.x, eW.y));
    vec4 ripF = texture2D(tRipF, clamp(uvF, 0.0, 1.0)), ripW = texture2D(tRipW, clamp(uvW, 0.0, 1.0));
    float closeF = 1.0 - smoothstep(0.5, 0.9, fp * uRipF.z * uRipF.w), closeW = 1.0 - smoothstep(0.5, 0.9, fp * uRipW.z * uRipW.w);
    vec3 rdF = vec3(0.0), rdW = vec3(0.0);
    bool glows = dot(uRippleGlow, vec3(1.0)) + uTouch.x > 0.0;       // (the crests are only read where they are drawn)
    if (inF > 0.0) { if (closeF > 0.0) ripF = mix(ripF, cubic(tRipF, uvF, uRipF.w), closeF); if (glows) rdF = textureLod(tRidgeF, uvF, 0.0).xyz; }
    if (inW > 0.0) { if (closeW > 0.0) ripW = mix(ripW, cubic(tRipW, uvW, uRipW.w), closeW); if (glows) rdW = textureLod(tRidgeW, uvW, 0.0).xyz; }
    ripF *= inF; ripW *= inW;
    vec2 rip = ripF.xy + ripW.xy;
    rip /= 1.0 + ${f(TUNE.steepest)} * length(rip);                 // a splash cannot be steeper than water allows
    float wash = clamp(max(ripF.z, ripW.z), 0.0, 1.5), lively = clamp(max(ripF.w, ripW.w), 0.0, 1.5);

    // ---- wavelets. A slow bending of the pattern, so that no repeat of the wave texture is ever seen.
    vec2 pq = p + 1.1 * vec2(sin(p.y * 0.0713 + 1.3) + sin(p.y * 0.0291 + p.x * 0.0133), sin(p.x * 0.0631 + 4.1) + sin(p.x * 0.0317 - p.y * 0.0171));
    // drifting patches of calmer and livelier water
    float gs = sin(dot(p, vec2(0.071, 0.043)) + 1.7 * sin(dot(p, vec2(-0.031, 0.058)) + uGust.x) + uGust.x * 0.6);
    float gust = 1.0 + uGust.y * (0.5 * gs + 0.25 * sin(dot(p, vec2(0.023, -0.017)) - uGust.x * 0.4) - 0.1);
    float live = gust * (1.0 - ${f(TUNE.washCalm)} * smoothstep(0.0, 0.9, wash)) * blow;      // the wash calms the wavelets a little; they keep riding over it

    vec4 w1, w2, w3;
    vec2 l1 = layer(pq, uLayerA[0], uLayerB[0], w1), l2 = layer(pq, uLayerA[1], uLayerB[1], w2), l3 = layer(pq, uLayerA[2], uLayerB[2], w3);
    // Every wave is faded as it shrinks below a pixel, and the slope variance that is lost is kept (along and across the
    // view) so that it softens the reflection instead: the far water goes calm and streaked, never noisy.
    vec3 keep = exp(-${f(TUNE.farFade)} * (fp * uInvLambda.yzw) * (fp * uInvLambda.yzw));
    vec2 sw = vec2(0.0), lost = vec2(0.0);
    for (int i = 0; i < 5; i++) {
      float ka = dot(uSlowA[i].xy, fa), kb = dot(uSlowA[i].xy, fb), kp = exp(-${f(TUNE.farSlow)} * (ka * ka + kb * kb));
      sw += uSlowB[i].xy * (cos(dot(uSlowA[i].xy, pq) - uSlowA[i].z) * kp);
      float df = dot(uSlowB[i].xy, fwd), all = dot(uSlowB[i].xy, uSlowB[i].xy), gone = 0.5 * (1.0 - kp * kp);
      lost += gone * vec2(df * df, all - df * df);
    }
    lost *= uAmp.x * uAmp.x * blow * blow;
    vec3 a2 = uAmp.yzw * uAmp.yzw;
    float lostFine = 0.5 * dot(a2, 1.0 - keep * keep) * live * live;
    vec2 wavelets = (l1 * (uAmp.y * keep.x) + l2 * (uAmp.z * keep.y) + l3 * (uAmp.w * keep.z)) * live;
    vec2 slope = sw * (uAmp.x * blow) + wavelets + rip;
    // a mottle cut from all three layers of the wave texture (so it never repeats): foam and the glowing wash break up along it
    float lace = 0.5 + 0.2 * (w3.x * uLayerB[2].w - w3.z * uLayerB[2].z) + 0.17 * (w2.y * uLayerB[1].w - w2.w * uLayerB[1].z) + 0.15 * (w1.x * uLayerB[0].w - w1.z * uLayerB[0].z);
    float varF = uRough2 * blow * blow + lost.x + lostFine + ${f(TUNE.ripSoft)} * dot(rip, rip);      // a steep wake wave shows the sky softly, not in folds
    float varR = uRough2 * blow * blow + lost.y + lostFine + ${f(TUNE.ripSoft)} * dot(rip, rip);

    // ---- the true swell (a sea): it tilts the light as well as lifting the surface
    vec2 swl = vec2(0.0);
    if (uSwellAmt > 0.0) { swl = swellSlope(p); slope += swl; }

    // ---- a standing lattice (the bell): eight radial waves cross and stand, each a family of fine bright crests, glinting
    // where they agree (the figure a struck bowl of water makes); then it lets go into one slow ring
    float latLine = 0.0;
    if (uLattice.w > 0.0 || uLatticeB.w > 0.0) {
      vec2 q = p - uLattice.xy; float r = length(q);
      float env = uLattice.w * (1.0 - smoothstep(0.55 * uLattice.z, uLattice.z, r)) * (1.0 - smoothstep(-4.0, 4.0, r - uLatticeB.y));
      if (env > 0.002) {
        float H = 0.0, lines = 0.0; vec2 dH = vec2(0.0);
        for (int i = 0; i < 8; i++) {
          // eight rings of waves, from eight points round the place that was struck
          float ang = float(i) * 0.7854 + 0.2; vec2 d = q - vec2(cos(ang), sin(ang)) * (0.3 * uLattice.z);
          float ri = max(length(d), 1e-3); d /= ri;
          float ph = uLatticeB.x * ri + uLatPhase[i];
          H += cos(ph); dH -= d * sin(ph);
          float ppm = pxAcross(d, fa, fb);                                       // pixels to a metre across this family of crests, as the screen sees them
          float dm = abs(mod(ph + 3.14159, 6.28318) - 3.14159) / uLatticeB.x;     // metres to its nearest crest
          float wpx = max(1.0, ${f(TUNE.lattice.line)} * ppm);
          lines += (1.0 - smoothstep(0.5 * wpx, 1.5 * wpx, dm * ppm)) * min(1.0, sqrt(${f(TUNE.lattice.line)} * ppm)) * smoothstep(${f(TUNE.lattice.apart[0])}, ${f(TUNE.lattice.apart[1])}, ppm * 6.28318 / uLatticeB.x);   // (a family whose lines the screen cannot hold apart goes dark: far off the lattice thins to a few long lines, never a band of speckle)
        }
        latLine = env * lines * (0.22 + 0.78 * smoothstep(-1.0, 4.5, H));
        slope += dH * (uLatticeB.x * ${f(TUNE.lattice.slope)} * env);
      }
      if (uLatticeB.w > 0.0) {
        float x = (r - uLatticeB.z) / 1.1, e2 = exp(-x * x) * uLatticeB.w;
        slope += q / max(r, 1e-3) * (-0.09 * x * e2);
        float ppm = pxAcross(q / max(r, 1e-3), fa, fb), wpx = max(0.9, 0.03 * ppm);
        latLine += 0.6 * uLatticeB.w * (1.0 - smoothstep(0.5 * wpx, 1.5 * wpx, abs(r - uLatticeB.z) * ppm)) * min(1.0, sqrt(0.03 * ppm / 0.9) + 0.25);
      }
    }

    // ---- rain. The drops themselves are data in the ripple field (they rock the reflections, wake the water-light on walls,
    // light the sea); their fine rings, thinner than the field's cells, are drawn here under the same masks, and far off
    // they are plain roughness.
    float rainLight = 0.0, rainStir = 0.0, rainRate = 0.0;
    if (uRain.x > 0.0 || uZones > 0) {
      rainRate = rainAt(p, front);
      if (rainRate > 0.0) {
        float near = 1.0 - smoothstep(0.04, 0.2, fp);
        if (near > 0.0) {
          vec4 r1 = ${famRings(RAIN_FAMILIES[0], 'rainRings', 'uRain', 'rainRate')}, r2 = ${famRings(RAIN_FAMILIES[1], 'rainRings', 'uRain', 'rainRate')};
          slope += (r1.xy + r2.xy) * uRain.z * near;
          rainLight = (r1.z + r2.z) * near; rainStir = (r1.w + r2.w) * near;
        }
        float far = min(rainRate, 8.0) * 0.0006 * (1.0 - 0.6 * near);
        varF += far; varR += far;
      }
    }

    vec3 N = normalize(vec3(-slope.x, 1.0, -slope.y));
    vec3 Rf = vec3(-V.x, V.y, -V.z);
    vec3 R = reflect(-V, N);
    R.y = max(Rf.y + (abs(R.y) - Rf.y) * uStreak, 0.002);
    R = normalize(R);

    // ---- the mirror. Where that ray lands in the mirrored picture: at the water (flat), infinitely far (dir), and in between
    vec4 cD = uTextureMatrix * vec4(R, 0.0);
    float dw = max(cD.w, 1e-3);
    vec2 uvFlat = vRefl.xy / vRefl.w, uvI = cD.xy / dw;
    float q = texture2D(tReach, uvFlat).r;
    float reach = dist * q / max(1.0 - q, 1e-4) + 0.25;                         // metres from the water to what it mirrors here
    float par = reach * dw / (vRefl.w + reach * dw);
    vec2 uv = clamp(mix(uvFlat, uvI, par), vec2(0.002), vec2(0.998));

    // how much the picture must soften: roughness too small to see, plus the folding of the picture by the wavelets
    vec2 ddx = dFdx(uvI) * uReflSize, ddy = dFdy(uvI) * uReflSize;
    vec2 sdir = uVP.xy - uv * uReflSize * uVP.z; sdir /= max(length(sdir), 1e-4);
    vec2 tdir = vec2(-sdir.y, sdir.x);
    float fv = min(abs(dot(ddx, sdir)) + abs(dot(ddy, sdir)), 120.0), fh = min(abs(dot(ddx, tdir)) + abs(dot(ddy, tdir)), 120.0);
    float sm = uSmear * blow * 2.0 * uFocal;
    // (where the folding comes from the ripples of the wake rather than from the wavelets it is forgiven more: the wake keeps its drawing)
    float fold = mix(${f(TUNE.fold)}, ${f(TUNE.foldRip)}, clamp(dot(rip, rip) / (dot(slope, slope) + 1e-5), 0.0, 1.0));
    float sigV2 = (4.0 * varF * uFocal * uFocal * uStreak * uStreak + sm * sm + fold * fv * fv) * par * par;
    float sigH2 = (4.0 * varR * uFocal * uFocal * V.y * V.y + fold * fh * fh) * par * par;
    float lod = log2(max(sqrt(sigH2) * 2.4, 1.0));
    float vRes = max(sigV2 - sigH2, 0.0);
    vec3 tt = clamp(vec3(vRes / uLevelVar.x, (vRes - uLevelVar.x) / (uLevelVar.y - uLevelVar.x), (vRes - uLevelVar.y) / (uLevelVar.z - uLevelVar.y)), 0.0, 1.0);
    float extra = max(0.0, 0.5 * log2(max(vRes / uLevelVar.z, 1e-3)));
    vec3 c0 = textureLod(tRefl, uv, lod).rgb;
    vec3 c1 = textureLod(tS1, uv, max(lod - 1.0, 0.0)).rgb;
    vec3 c2 = textureLod(tS2, uv, max(lod - 1.0, 0.0)).rgb;
    vec4 c3 = textureLod(tS3, uv, max(lod - 2.0, 0.0) + extra);
    c0 = mix(clamp(c0, 0.0, 48.0), vec3(0.0), isnan(c0));
    vec3 refl = mix(mix(mix(c0, c1, tt.x), c2, tt.y), c3.rgb, tt.z);
    refl = mix(refl, c0, 0.18);                                    // keep a little of the crisp picture inside the smear
    // lights are drawn out into long columns, broken into dashes where the wavelets can be seen
    vec2 toward = -V.xz / max(length(V.xz), 1e-4);
    float dash = 1.0 + clamp(dot(wavelets + rip, toward) / (1.5 * uAmp.z + 1e-4), -0.8, 1.2);
    // (a soft column with a brighter, wavering core. Each takes its hue from the very sample that says how much light there
    // is: the soft part's light and colour are read at the same breadth, or the halo of every column would take the hue of
    // the dark beside it, a lavender smudge next to each bright reflection)
    vec4 cw = textureLod(tS3, uv, max(lod - 2.0, 0.0) + extra + 1.0);
    cw.rgb = mix(clamp(cw.rgb, 0.0, 48.0), vec3(0.0), isnan(cw.rgb));
    float envL = dot(c3.rgb, vec3(0.3, 0.55, 0.15)), envW = dot(cw.rgb, vec3(0.3, 0.55, 0.15));
    float lights = 0.55 * cw.a + 0.45 * c3.a;
    float colK = uColumn * blow * dash;
    if (uColumnOwn > 0.0) colK = uColumn * dash;      // (a look's own column: a lamp keeps its stroke on the mirror ahead of a front as on water that mirror has stilled)
    if (uColumnFar > 0.0) colK *= 1.0 - smoothstep(0.6 * uColumnFar, uColumnFar, dist);      // (a look's columnFar: beyond it a light is given back as it is, with no column)
    refl += (cw.rgb * (0.55 * cw.a / max(envW, 0.02)) + c3.rgb * (0.45 * c3.a / max(envL, 0.02))) * colK;
    vec3 crisp = c0;
    // the water keeps a better copy: a little darker, a little richer
    vec3 ungraded = refl;
    float rl = dot(refl, vec3(0.2126, 0.7152, 0.0722));
    refl = max(mix(vec3(rl), refl, 1.0 + uGrade.y), 0.0) * (1.0 - uGrade.x) * uReflectionTint;
    // (a look's spareLights: what shines keeps its own colour and strength in the water, and is seen in the window round the rider)
    float spare = 0.0;
    if (uSpare > 0.0) { spare = uSpare * smoothstep(${f(TUNE.shine[0])}, ${f(TUNE.shine[1])}, rl); refl = mix(refl, max(ungraded, 0.0), spare); }

    // how much of a mirror: an art-directed curve from looking straight down (floor) to grazing (cap)
    float ndv = clamp(dot(N, V), 0.0, 1.0);
    float F = clamp(uCurve.x + (uCurve.y - uCurve.x) * pow(1.0 - ndv, uCurve.z), 0.0, 1.0);
    if (uClear.x > 0.0) { float win = mix(uClear.z, 1.0, smoothstep(uClear.x, uClear.x + uClear.y, length(toCam.xz))); if (spare > 0.0) win = mix(win, 1.0, spare); F *= win; }
    F *= 1.0 - 0.55 * uVeil;

    // ---- the body of the water: shallow colour looking down near the boat, deep colour away
    vec3 body = mix(uDeep, uShallow, pow(ndv, 1.5) * smoothstep(70.0, 4.0, dist));
    vec3 lv = uLamp.xyz - vWorld; float ld2 = dot(lv, lv);
    float lampFall = uLamp.w * 0.012 * max(lv.y, 0.0) / (sqrt(ld2) * (ld2 + 0.4));
    body += uLampColor * lampFall * mix(uShallow, vec3(1.0), 0.4);
    // The light on matte things that lie on the water (a film of dye, a skin of petals or ice): the realm's own
    // painted light, the same that falls on everything built with kit.gouache, with its lamps. (Not the mirrored picture:
    // that changes with where the rider looks, and in a realm whose mirror lies it is the light of another evening.)
    vec3 paint = uPaint;
    if (uFilm.x + uSkin.x > 0.0) {
      paint += lampLight(uLantern, uLanternColor) + lampLight(uKept, uKeptColor);
      for (int i = 0; i < ${PAINT_LIGHTS}; i++) { if (i >= uLightCount) break; paint += lampLight(uLights[i], uLightColors[i]); }
    }

    // ---- the trace: a film of dye, a skin with lanes, light that lingers
    vec2 tuv = (p - uTraceRect.xy) * uTraceRect.zw + 0.5, te = min(tuv, 1.0 - tuv);
    float trIn = smoothstep(0.0, 0.015, min(te.x, te.y));
    vec4 tr = vec4(0.0);
    if (uFilm.x + uSkin.x + uTouch.x > 0.0) tr = texture2D(tTrace, clamp(tuv, 0.0, 1.0)) * trIn;
    vec2 gp = fa, gq = fb;

    // a matte film of dye lies on the water; where it is dense the mirror is dulled
    float filmCover = 0.0; vec3 filmCol = vec3(0.0);
    if (uFilm.x > 0.0) {
      vec2 den = max(tr.rg, 0.0);
      if (trIn < 1.0) {
        vec2 rel = p - uFilmLine.xy;
        den = mix(filmRest(vec3(dot(rel, uFilmLine.zw), dot(rel, vec2(-uFilmLine.w, uFilmLine.z)), uFilmHalf), uFilm, uFilmB.x), den, trIn);
      }
      // the edge of the film is brushed, not blurred: dry-brush streaks along the flow break the density before its edge is taken
      vec2 fl = vec2(dot(p, vec2(-uFilmLine.w, uFilmLine.z)), dot(p, uFilmLine.zw)) + rip * 0.35;
      float br = (filmNoise(vec2(fl.x * 3.6, fl.y * 0.5)) - 0.5) * exp(-14.0 * fp * fp) + 0.6 * (filmNoise(vec2(fl.x * 10.0 + 3.0, fl.y * 1.2 + 7.0)) - 0.5) * exp(-110.0 * fp * fp)
               + 0.5 * (filmNoise(fl * 0.9 + 11.0) - 0.5);
      if (uFilmC.x != 1.0) br *= uFilmC.x;                                                   // (a look's film.brush: 0 = washes with soft edges, never streaks)
      float total = den.r + den.g, d = total - 0.5 * den.r * den.g;
      float body = smoothstep(0.1, 0.62, d + br * 1.5 * smoothstep(0.03, 0.35, d) * (1.0 - smoothstep(0.75, 1.25, d)));
      filmCover = uFilm.x * body * (0.55 + 0.45 * smoothstep(0.3, 0.9, d));               // thin film lets the water through
      float share = den.g / max(total, 1e-4), meet = 4.0 * den.r * den.g / max(total * total, 1e-4);
      vec3 pigA = uFilmA, pigB = uFilmBc;
      if (uFilmStopsA + uFilmStopsB > 0) {                                                // (a look's film.route: each pigment's colour by how far along the waterway's line it lies)
        float along = dot(p - uFilmLine.xy, uFilmLine.zw);
        if (uFilmStopsA > 0) { pigA = uFilmStopA[0].rgb; for (int i = 1; i < ${FILM_STOPS}; i++) { if (i >= uFilmStopsA) break; pigA = mix(pigA, uFilmStopA[i].rgb, smoothstep(uFilmStopA[i - 1].a, uFilmStopA[i].a, along)); } }
        if (uFilmStopsB > 0) { pigB = uFilmStopB[0].rgb; for (int i = 1; i < ${FILM_STOPS}; i++) { if (i >= uFilmStopsB) break; pigB = mix(pigB, uFilmStopB[i].rgb, smoothstep(uFilmStopB[i - 1].a, uFilmStopB[i].a, along)); } }
      }
      vec3 pig = mix(mix(pigA, pigB, smoothstep(0.12, 0.88, share)), uFilmMix, smoothstep(0.2, 0.9, meet));     // where the two meet: the mixed colour, never mud
      pig *= 0.86 + 0.55 * br + 0.26 * smoothstep(0.4, 1.2, d);                             // richer where it lies thick, streaked by the brush
      vec3 filmLight = paint;
      if (uFilmC.y < 1.0) filmLight = mix(vec3(dot(paint, vec3(0.2126, 0.7152, 0.0722))), paint, uFilmC.y);      // (a look's film.tinted: under a gold sun the pigments keep their own hue)
      filmCol = pig * (filmLight * ${f(TUNE.wet.film)} + 0.03) * uFilmB.z;
      F *= 1.0 - filmCover * uFilmB.y;
    }

    // a skin on the water (a crust of petals, skin ice), opened where the trace says something passed
    float skinCover = 0.0, skinSheen = 0.0; vec3 skinCol = vec3(0.0);
    if (uSkin.x > 0.0) {
      float glance = F * ${f(TUNE.glance)};                           // wet petals at a glancing angle give back a little of what the water there mirrors: toward the afterglow the skin is warmer
      float open = max(tr.a, tr.g * uSkinB.z);                        // what passed lately (a lane), and water the realm keeps open (trace channel 'bare')
      vec2 suv = (p + rip * 0.35) * uSkin.z;
      vec4 sk = textureGrad(tSkin, suv, gp * uSkin.z, gq * uSkin.z);
      float grain = textureGrad(tSkin, suv.yx * 0.37 + 0.23, gp.yx * uSkin.z * 0.37, gq.yx * uSkin.z * 0.37).a;
      vec3 light = (paint * mix(${f(TUNE.wet.petal)}, ${f(TUNE.wet.ice)}, uSkin.y) + 0.02) * uSkinB.y;
      if (uSkin.y < 0.5) {
        // petals: whole petals at the ragged edge of a lane, a few left behind inside it
        float gone = smoothstep(0.3, 0.62, open + (grain - 0.5) * 0.45);
        float thin = 1.0 - smoothstep(0.0, 0.25, lively) * 0.25;
        skinCover = uSkin.x * sk.a * thin * (1.0 - gone * (0.93 + 0.07 * step(0.82, grain)));
        skinCol = sk.rgb * uSkinTint * (light + min(c3.rgb, vec3(1.5)) * glance);
      } else {
        // skin ice: plates. Cracks run where the trace is faint (ahead of the bow), plates part where it is strong
        vec2 cid, crossing; vec2 vo = voronoi(p / uSkin.w + (grain - 0.5) * 0.12, cid, crossing);
        float edgeM = vo.x * uSkin.w, weak = 0.35 + 0.65 * vo.y;
        float cracked = smoothstep(0.06, 0.22, open * weak * 1.6);
        float gap = max(0.0, open - 0.3 - 0.28 * vo.y) * uSkin.w * 1.3 + cracked * 0.012;
        float lp = pxAcross(crossing, fa, fb);                              // pixels to a metre across this crack, as the screen sees it
        // (a crack thinner than the screen can draw is drawn a pixel wide and fainter, so far cracks are faint hairlines and never crawl)
        float wpx = gap * lp, gone = (1.0 - smoothstep(wpx - 0.5, wpx + 1.0, edgeM * lp)) * min(1.0, (2.0 * wpx + 0.3) / 1.5);
        float plate = 1.0 - cracked * gone;                                // whole ice shows no crack at all
        float young = smoothstep(0.02, 0.3, open);                         // lately open: thin dark new ice
        skinCover = uSkin.x * plate * (0.94 - 0.5 * young * (1.0 - cracked * 0.5)) * mix(1.0, sk.a, 0.25);
        float rim = (1.0 - smoothstep(0.0, 0.07, edgeM)) * (1.0 - cracked) * (1.0 - smoothstep(0.02, 0.2, fp));      // a pale ridge of frost where two plates froze together
        skinCol = mix(sk.rgb, vec3(dot(sk.rgb, vec3(0.333))), 0.2) * uSkinTint * light * (0.88 + 0.2 * vo.y + 0.1 * rim) * (1.0 - 0.35 * young);
        skinSheen = uSkinB.x;
      }
      F *= 1.0 - skinCover * (1.0 - skinSheen);
    }

    // ---- what lies beneath shows through the surface (the picture is already there, behind the water). With the engine's
    // view of the scene without the water to hand, the water tints and swallows it with depth, thins to nothing over its
    // last few centimetres at a shore or a hull, and bends it. Where the surface is still, only the difference all this
    // makes is added, so the things beneath stay as sharp as they were drawn. Where a ripple moves the picture, the water
    // draws the bent picture itself and hides the one behind it (own): a lit window seen through a wake must not leave
    // its outline standing where it was.
    float reachIn = 1.0 - smoothstep(uSee.y, uSee.z, dist);
    float see = uSee.x * reachIn, edge = 1.0, own = 0.0, wline = 0.0, hazed = 0.0;
    vec3 under = vec3(0.0), hazeCol = vec3(0.0);
    if (uBelow.x > 0.5) {
      vec2 sc = gl_FragCoord.xy * uScreen.xy;
      float zW = 1.0 / gl_FragCoord.w;
      float thick = waterThickness(sc, zW, dist / zW);
      float far = smoothstep(8.0, 22.0, dist);                     // further off, a pixel is wider than a shoreline: leave it be
      if (uSee.w > 0.0) edge = mix(smoothstep(0.0, uSee.w, thick * V.y), 1.0, far);
      // (a look's waterline) A line of light where the water meets what stands in it: where the depth of water over what
      // lies behind this pixel runs out. How many pixels away that is comes from how fast the depth changes across the
      // screen, so the line is as thin on a roof that slopes into the water as at a wall; never thinner than the screen
      // can draw (fainter instead); and only where the depth itself is next to nothing, so that the outline of a thing
      // standing deep in clear water is never taken for a shore.
      if (uLine.w > 0.5) {
        float dn = thick * V.y, lp = dn / max(length(vec2(dFdx(dn), dFdy(dn))), 1e-6);
        float wpx = uLine.x / (dist * uPixel), hw = max(1.3, wpx), wall = dist * uPixel / max(sqrt(1.0 - V.y * V.y), 0.3);      // (wall: the depth one pixel is worth at an upright wall)
        wline = (1.0 - smoothstep(0.5 * hw, 1.5 * hw, lp)) * (1.0 - smoothstep(1.5 * hw * wall, 3.0 * hw * wall, dn)) * min(1.0, wpx / 1.3 + 0.3) * (1.0 - smoothstep(0.6 * uLine.y, uLine.y, dist));
        wline = isnan(wline) ? 0.0 : clamp(wline, 0.0, 1.0);
      }
      float bendRay = 1.0 / sqrt(max(1.0 - (1.0 - V.y * V.y) * 0.565, 0.2));   // the ray steepens as it enters the water: a short way down even at a glance
      float T = exp(-uBelow.w * thick * V.y * bendRay) * reachIn;   // how much of the solid things beneath comes through
      float hzDown = thick * V.y; vec3 hzSeen = vec3(-1.0);         // (for the haze: how deep the sight ends, and what it ends on)
      if (T > 0.004) {
        float zS = zW + thick * zW / dist;
        vec3 bend = (viewMatrix * vec4(slope.x, 0.0, slope.y, 0.0)).xyz * (0.25 * uRefract.x * min(thick, uRefract.y));
        // (a look's tremor: the standing waves bend what lies beneath by their own number, the living ripples by the look's refraction)
        if (uTremor >= 0.0) { vec2 bs = rip * uRefract.x + (slope - rip) * uTremor; bend = (viewMatrix * vec4(bs.x, 0.0, bs.y, 0.0)).xyz * (0.25 * min(thick, uRefract.y)); }
        vec2 sr = sc + bend.xy * uBelow.yz / zS;
        float zR = sceneZ(sr), down = thick * V.y;
        if (zR > zW) down = (zR - zW) * dist / zW * V.y; else sr = sc;
        T = exp(-uBelow.w * down * bendRay) * reachIn;
        vec3 there = max(textureLod(tScene, sr, 0.0).rgb, 0.0), here = max(textureLod(tScene, sc, 0.0).rgb, 0.0);
        there = mix(min(there, vec3(48.0)), vec3(0.0), isnan(there)); here = mix(min(here, vec3(48.0)), vec3(0.0), isnan(here));
        vec3 tint = pow(uAbsorb.rgb, vec3(down * uAbsorb.w));
        own = smoothstep(0.35, 1.5, length((sr - sc) * uPre.xy));                 // (in pixels of the engine's picture)
        under = mix((there * tint - here) * T, there * (max(see, T) - T + T * tint), own);
        hzDown = down; hzSeen = there;
      }
      // (a look's haze) The water between. What lies beneath is swallowed by the DISTANCE the sight travels through water,
      // not only by depth: a street nine metres down runs away into the water's own colour instead of standing as clear at
      // a hundred metres as under the keel. Everything dissolves alike, whatever it is made of (glows and lamps under the
      // surface too); what gives off light burns through further; and what is swallowed is given back as the haze's
      // colour (deeper where the sight ends deep, lit where the look's picture says the water is lit).
      if (uHaze.w > 0.5 && max(see, T) > 0.002) {
        if (hzSeen.r < 0.0) { hzSeen = max(textureLod(tScene, sc, 0.0).rgb, 0.0); hzSeen = mix(min(hzSeen, vec3(48.0)), vec3(0.0), isnan(hzSeen)); }
        float path = hzDown / max(V.y, ${f(TUNE.haze.least)});                                 // metres of water along the sight
        float thru = exp(-uHaze.x * path - uHaze.y * hzDown);
        thru = 1.0 - (1.0 - thru) * (1.0 - uHaze.z * smoothstep(${f(TUNE.haze.fire[0])}, ${f(TUNE.haze.fire[1])}, max(hzSeen.r, max(hzSeen.g, hzSeen.b))));
        hazeCol = mix(uHazeColor, uHazeDeep, smoothstep(uHazeD.x, uHazeD.y, hzDown));
        if (uHazeD.z > 0.0) {
          vec2 hu = (p - V.xz * path - uHazeRect.xy) * uHazeRect.zw + 0.5, he = min(hu, 1.0 - hu);      // where the sight ends, in the look's picture of lit water
          if (min(he.x, he.y) > 0.0) { vec3 lit = textureLod(tHaze, hu, 0.0).rgb; hazeCol += mix(clamp(lit, 0.0, 48.0), vec3(0.0), isnan(lit)) * (uHazeD.z * (1.0 - exp(-path * ${f(TUNE.haze.gather)}))); }
        }
        hazed = max(see, T) * (1.0 - thru);
        under *= thru; T *= thru; see *= thru;
      }
      see = max(see, T);
    }
    see *= (1.0 - skinCover) * (1.0 - filmCover * 0.85);
    float through = (1.0 - F) * see * (1.0 - own);
    vec3 col = refl * F + body * ((1.0 - F) * (1.0 - see)) + uGlow * ((1.0 - see) * veil) + under * ((1.0 - F) * (1.0 - skinCover) * (1.0 - filmCover * 0.85));
    float alpha = 1.0 - through;
    if (hazed > 0.0) col += (hazeCol - body) * ((1.0 - F) * hazed * (1.0 - skinCover) * (1.0 - filmCover * 0.85));      // (what the haze swallowed shows as the haze, not as the body of the water)

    // ---- (a look's sheen) sky-light on leaning water. Water under a sky with little in it, or in front of dark rock, has
    // nothing to mirror: nothing says where the surface is. So a look may lay sky-light on it as a painter does once the
    // depths are done: on the far face of every living ripple (rings arrive as fine pale arcs, the wake as two feathered
    // arms), on the fine crests of water at rest (in drifting patches, sparse under the eye and closing up toward the
    // horizon; each hides a little of what lies under it, which is what makes it a thing lying ON the water), and wherever
    // the eye meets the water at a glance (the far water, and every back of a swell that falls away from the eye).
    if (uSheen.x + uSheen.y + uSheen.z + uSheen.w > 0.0) {
      float gl = 1.0 - V.y, sh = 0.0, lie = 0.0;                    // gl: 0 looking straight down .. 1 at the horizon
      if (uSheen.x > 0.0) {
        float lean = max(-dot(rip, fwd), 0.0);                       // how far the living water leans away from the eye here
        sh += uSheen.x * (1.0 - exp(-lean * ${f(TUNE.sheen.soon)})) * (0.25 + 0.75 * exp(-lean * ${f(TUNE.sheen.held)})) * (1.0 - smoothstep(0.25, 0.9, wash)) * mix(${f(TUNE.sheen.above)}, 1.0, gl * gl);
      }
      if (uSheen.y > 0.0) {
        float g3 = gl * gl * gl;
        float lean0 = -dot(l2 * (0.6 * keep.y) + l3 * keep.z, fwd) * blow;      // the finest waves the water has, as far as the screen can still hold them apart
        float drift = 0.5 + 0.35 * gs + 0.3 * (w1.x * uLayerB[0].w - w1.z * uLayerB[0].z);      // broad drifting patches of it
        float cut = mix(${f(TUNE.sheen.patch[0])}, ${f(TUNE.sheen.patch[1])}, g3);
        float still = smoothstep(cut, cut + ${f(TUNE.sheen.patch[2])}, drift) * (${f(TUNE.sheen.even)} * g3 + ${f(1 - TUNE.sheen.even)} * smoothstep(${f(TUNE.sheen.crest[0])}, ${f(TUNE.sheen.crest[1])}, lean0)) * mix(0.5, 1.0, gl * sqrt(gl));
        still *= (1.0 - smoothstep(0.15, 0.6, wash)) * smoothstep(${f(TUNE.sheen.near[0])}, ${f(TUNE.sheen.near[1])}, dist);      // (the wash has broken it; none under the rider's own eye)
        sh += uSheen.y * still; lie = clamp(still * uSheenB.x, 0.0, 1.0);
      }
      if (uSheen.z > 0.0) {
        float meet = V.y + dot(sw * (uAmp.x * blow) + swl, fwd);      // how squarely the eye meets the water: next to nothing on a back that falls away from it
        float shine = clamp(1.0 - meet / ${f(TUNE.sheen.glance)}, 0.0, 1.0);
        sh += uSheen.z * shine * shine * (0.5 + 0.75 * smoothstep(0.3, 0.7, lace));
      }
      // (water the rain is falling on, where its rings are too far off to draw: a thousand facets turned every way give back the
      // sky. Near the eye the rings themselves speak, and it stands back)
      if (uSheen.w > 0.0 && rainRate > 0.0) sh += uSheen.w * (min(rainRate, 8.0) / 8.0) * (1.0 - 0.75 * (1.0 - smoothstep(0.04, 0.2, fp))) * (0.55 + 0.45 * smoothstep(0.3, 0.7, lace));
      vec3 shLight = uSheenColor;
      if (uSheenB.y > 0.0) shLight += (lampLight(uLantern, uLanternColor) + lampLight(uKept, uKeptColor)) * uSheenB.y;      // where a lamp stands over the water the sheen takes its light
      float on = (1.0 - skinCover) * (1.0 - filmCover) * veil;
      if (lie > 0.0) { col *= 1.0 - lie * on; alpha = 1.0 - (1.0 - alpha) * (1.0 - lie * on); }
      col += shLight * (sh * on);
    }

    // ---- light of disturbed water: a thin line along every crest, over a faint breath where the water is lively
    float lines = 0.0;
    if (glows) {
      float fineOk = 1.0 - smoothstep(0.05, 0.22, fp);
      lines = crestLine(rdF, fa, fb, ${f(TUNE.lineFine)}) * inF * fineOk + crestLine(rdW, fa, fb, ${f(TUNE.lineWide)}) * inW * (1.0 - smoothstep(0.25, 1.1, fp));
      // a crest is not a wire: its light runs along it in beads that come and go with the wavelets, and under rain (when
      // every drop's ripples have crests of their own) it all but goes out
      lines = min(lines, 1.0) * (${f(TUNE.bead[0])} + ${f(TUNE.bead[1])} * smoothstep(0.36, 0.64, lace)) / (1.0 + ${f(TUNE.lineRain)} * rainRate);
      lines *= 1.0 - ${f(TUNE.lineWash)} * smoothstep(0.3, 0.85, wash);      // in the churned lane astern there are no clean crests to light: the road and the flecks speak there
      // the churned lane astern is a soft road of light that breaks up into islands as it fades
      float road = wash * (0.35 + 0.65 * wash) * mix(0.22, 1.0, smoothstep(0.78 - wash * 1.1, 1.08 - wash * 1.1, lace)) * (1.0 - smoothstep(0.86, 0.99, wash));
      float breath = road * ${f(TUNE.glowRoad)} + lively * lively * ${f(TUNE.glowBreath)} + rainLight * 0.5;
      col += uRippleGlow * ((lines * (${f(TUNE.glowLine[0])} + ${f(TUNE.glowLine[1])} * min(lively, 1.0)) + breath) * veil);
    }
    // light from touch: it lingers in the trace where the water was disturbed, and shows as flecks of paint, never a gradient
    if (uTouch.x > 0.0) {
      float E = clamp(max(tr.b, (lively * lively * ${f(TUNE.touchLively)} + wash * ${f(TUNE.touchWash)}) * uTouch.z), 0.0, 1.0);
      // rain: the sea answers every drop. A spark where it lands, then the flecks its ring crosses flare and go out behind
      // it; between the drops a few flecks glimmer, never the same ones for long
      float E0 = E;                                                   // (before the rain: how lately the hull, or a realm, touched the water here)
      E = max(E, min(1.0, max(rainStir, min(rainRate, 6.0) * ${f(TUNE.touchRain)} * (0.2 + 1.6 * lace))));
      if (E > 0.003) {
        vec2 fu = p * uTouch.y;
        vec2 f1 = textureGrad(tFleck, fu + rip * 0.2, gp * uTouch.y, gq * uTouch.y).rg;
        vec2 f2 = textureGrad(tFleck, fu.yx * 0.43 + 0.37, gp.yx * uTouch.y * 0.43, gq.yx * uTouch.y * 0.43).rg;
        float cut = 1.02 - E * ${f(TUNE.touchFill)};                     // each fleck has its own threshold: they come and go one by one
        float flecks = smoothstep(cut, cut + 0.2, f1.r) * f1.g * (0.55 + 0.75 * f1.g) + 0.7 * smoothstep(cut + 0.1, cut + 0.3, f2.r) * f2.g * (0.55 + 0.75 * f2.g);
        float blurred = smoothstep(0.012, 0.05, fp * uTouch.y);       // too far to tell flecks apart: a sparkle of points stands in for them
        if (blurred > 0.0) flecks = mix(flecks, sparks(p, toPx, fp, clamp(E * 0.8, 0.0, 0.6), 23.0) * 1.5 + E * E * 0.05, blurred);
        if (uTouchAge.w > 0.5) {
          // (a look's touch.fresh, late, dying) Light cools as it ages. A fleck is as old as the light it belongs to, and older
          // as its own threshold is reached, so that among new flecks a few are always going out; a drop's spark is new light.
          // (Fresh is the water being struck NOW: under the hull, in the bow wave. Light that lingers, however strongly the
          // trace still holds it, and light the rain stirs, is light in its prime at most: it begins as the look's own colour.)
          float struck = clamp(smoothstep(0.8, 1.02, wash) + lively * lively * 0.08, 0.0, 1.0);
          float age = mix(min(max(E0, min(E, 0.8)), uTouchAge.z), 1.0, struck) * (0.3 + 0.7 * smoothstep(0.0, 0.3, max(f1.r - cut, f2.r - cut - 0.1)));
          vec3 aged = mix(mix(mix(uTouchDying, uTouchLate, smoothstep(0.0, uTouchAge.x, age)), uTouchColor, smoothstep(uTouchAge.x, uTouchAge.y, age)), uTouchFresh, smoothstep(uTouchAge.z, 1.0, age));
          col += (aged * (flecks * (0.45 + 0.55 * E) + lines * 0.9) + uTouchColor * (rainLight * 1.5)) * (uTouch.x * veil);
        } else col += uTouchColor * ((flecks * (0.45 + 0.55 * E) + lines * 0.9 + rainLight * 1.5) * uTouch.x * veil);
      }
    }
    if (latLine > 0.0) col += uLatticeColor * (latLine * veil);

    // ---- light on the water
    // glints: where a wavelet mirrors a light cleanly, let it through the smear as a crisp dash
    vec3 glint = max(crisp * uReflectionTint - refl, 0.0);
    col += uSparkleColor * glint * (uSparkle * 2.0 * F);
    // and small soft points that come and go on the path of a light (never on bare water)
    float lightPath = clamp(lights * 6.0, 0.0, 1.0) * blow * clamp(uAmp.z * 80.0, 0.0, 1.0);      // (none on water without waves)
    if (uSparkle > 0.0 && lightPath > 0.01) {
      float sp = sparks(p, toPx, fp, ${f(TUNE.sparks)} * lightPath * (0.3 + live * (1.0 - keep.z) + 0.7 * keep.y), 3.0);
      col += uSparkleColor * c3.rgb * (sp * uSparkle * ${f(TUNE.sparkGain)} * F / max(envL, 0.04)) * veil;
    }
    // a sun or moon path: every facet of the water that leans just right mirrors the light. Wavelets that can be seen give
    // separate molten dabs; those too fine to see, a smooth track; the look's glitter turns part of it into sequins.
    if (uSun.x > 0.0) {
      vec3 Hs = normalize(uSunDir + V);
      vec2 need = -Hs.xz / max(Hs.y, 0.05) - slope;                  // the extra lean a facet here would need
      float vf = varF + uSun.y, vr = varR + uSun.y, na = dot(need, fwd), nb = dot(need, rgt);
      float P = exp(-0.5 * (na * na / vf + nb * nb / vr)) * uSun.y / sqrt(vf * vr);
      float track = P * (1.0 - uSun.z * 0.75);
      float seq = uSun.z > 0.0 ? sparks(p, toPx, fp, clamp(P * 0.9, 0.0, 0.6) * uSun.z, 11.0) * 5.0 : 0.0;
      col += uSunColor * ((track + seq) * uSun.x * (0.25 + 0.75 * F) * veil);
    }

    // ---- foam: a pale, soft-edged veil where the water has just been churned, mottled by the wavelets. Never a hard shape,
    // never flecks. It takes the colour of the scene's own light (the mirrored picture's average, and what is mirrored here),
    // so it always sits in the picture.
    if (uFoam > 0.0 && wash > 0.1) {
      vec3 ambient = textureLod(tS3, vec2(0.5), 12.0).rgb;
      ambient = mix(clamp(ambient, 0.0, 16.0), vec3(0.0), isnan(ambient));
      float foam = smoothstep(0.12, 1.0, wash) * (0.3 + 0.7 * smoothstep(0.3, 0.8, lace)) * uFoam;
      col = mix(col, (ambient + c3.rgb) * 0.9 + 0.015, clamp(foam * 1.3, 0.0, 0.9) * (1.0 - skinCover));
    }

    // ---- water an oar has just churned shows pale whatever the look's foam: a soft veil, mottled like the foam, where the
    // blade worked. (Wash above 1 is written only by a blade, src/engine/rower.js; it falls back under 1 in about three
    // seconds and is then the hull's kind of wash.)
    if (uChurn > 0.0 && wash > 1.0) {
      vec3 amb2 = textureLod(tS3, vec2(0.5), 12.0).rgb;
      amb2 = mix(clamp(amb2, 0.0, 16.0), vec3(0.0), isnan(amb2));
      float churn = smoothstep(1.0, 1.42, wash) * (0.4 + 0.6 * smoothstep(0.3, 0.75, lace)) * uChurn;
      col = mix(col, (amb2 + c3.rgb) * 0.9 + 0.015, clamp(churn, 0.0, 0.75) * (1.0 - skinCover));
    }

    // ---- the film and the skin lie on top
    if (filmCover > 0.0) { col = mix(col, filmCol, filmCover * 0.92); alpha = max(alpha, filmCover * 0.85); }
    if (skinCover > 0.0) { col = mix(col, skinCol + refl * (F * 0.0 + skinSheen * 0.6), skinCover); alpha = max(alpha, skinCover); }

    // ---- into the veil between realms, and fog by distance, worked out here for every pixel
    float inAir = 1.0;                                             // (how much of a light on the water the air lets through: for the waterline)
    #ifdef USE_FOG
      col = mix(col, fogColor, uVeil * uVeil * 0.9);
      #ifdef FOG_EXP2
        float fogF = 1.0 - exp(-fogDensity * fogDensity * dist * dist);
      #else
        float fogF = smoothstep(fogNear, fogFar, dist);
      #endif
      col = mix(col, fogColor, fogF); alpha = mix(alpha, 1.0, fogF);
      inAir = 1.0 - fogF;
    #endif
    // (col may be a little below zero where the water darkens what lies beneath it: it is added to what is already drawn)
    col = mix(clamp(col, -48.0, 48.0), vec3(0.0), isnan(col));
    alpha = isnan(alpha) ? 1.0 : clamp(alpha, 0.0, 1.0);
    edge = isnan(edge) ? 1.0 : clamp(edge, 0.0, 1.0);
    gl_FragColor = vec4(col, alpha) * edge;
    // (the waterline lies exactly where the water thins to nothing: it is laid on after the edge has been taken)
    if (wline > 0.0) gl_FragColor.rgb += uLineColor * (wline * veil * inAir * (1.0 - skinCover));
  }
`;

export class Water {
  /** The defaults a realm's `water` is laid over (the realm manager reads this). */
  static LOOK = WATER_LOOK;

  constructor(engine, { resolution = 0.6 } = {}) {
    this.engine = engine; this.resolution = resolution; this.mirrorScale = 1; this.pixelSize = [0, 0];
    const renderer = engine.renderer, level = (engine.quality && engine.quality.level) || 'high';
    this.level = level;
    this.needsScene = true;                             // ask the engine for the view without the water (engine.pre): refraction, depth, soft shores
    this.look = {}; this.veil = 0; this.time = 0;
    // the look as numbers that can be trusted: setLook fills them, update() and the simulation read them
    this.P = { streak: 1, frontRain: 0, mirror: 0, waveHeight: 0.55, waveScale: 1, waveSpeed: 1, wind: WATER_LOOK.wind, roughness: 0.12, swell: 0, swellLength: 24, swellPeriod: 7, swellDir: WATER_LOOK.swellDir,
      rain: 0, rainStrength: 1, wake: 1, rippleSize: 64, rippleLife: 4, rippleSpeed: 1, texel: 0.125, margin: 14, lay: false, column: -1, rest: 0,
      film: { amount: 0, cover: 0.75, split: 1, scale: 7, flow: 0.08, life: 60, stir: 1 }, skin: { amount: 0, close: 25, lead: 0, width: 0 }, touch: { amount: 0, hold: 4, wake: 1 } };
    this.glowColor = new THREE.Color(0, 0, 0); this.badPath = null;
    this.virtualCamera = new THREE.PerspectiveCamera();
    this.textureMatrix = new THREE.Matrix4();
    const aniso = Math.min(16, renderer.capabilities.getMaxAnisotropy());

    // --- reflection and its smears
    const half = { type: THREE.HalfFloatType, colorSpace: THREE.LinearSRGBColorSpace, depthBuffer: false };
    this.samples = (engine.quality && engine.quality.samples) || 0;
    this.target = new THREE.WebGLRenderTarget(512, 512, { ...half, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.LinearFilter, depthBuffer: true, samples: this.samples });
    this.target.depthTexture = new THREE.DepthTexture(512, 512);
    this.target.depthTexture.minFilter = this.target.depthTexture.magFilter = THREE.NearestFilter;
    this.smears = SMEARS.map(() => new THREE.WebGLRenderTarget(256, 256, { ...half, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.LinearFilter }));
    this.reach = new THREE.WebGLRenderTarget(256, 256, { ...half, format: THREE.RedFormat, generateMipmaps: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
    this.reachMat = new THREE.ShaderMaterial({
      uniforms: { tDepth: { value: this.target.depthTexture }, uDepthInfo: { value: new THREE.Vector4(0, 0, 1, -0.16) }, uPlane: { value: new THREE.Vector4(0, 1, 0, 0) }, uInvFocal: { value: new THREE.Vector2(1, 1) }, uTexel: { value: new THREE.Vector2(1 / 256, 1 / 256) } },
      vertexShader: PASS_VERT, fragmentShader: REACH_FRAG, depthTest: false, depthWrite: false,
    });
    this.vp = new THREE.Vector3(0, -1, 0); this.line = new THREE.Vector3(0, 1, 0); this.reflSize = new THREE.Vector2(512, 512);
    this.smearMat = new THREE.ShaderMaterial({
      uniforms: { tSrc: { value: null }, uSize: { value: this.reflSize }, uVP: { value: this.vp }, uLine: { value: this.line }, uStepPx: { value: 1 }, uSigmaPx: { value: 1 }, uBoost: { value: 0 }, uFirst: { value: 0 } },
      vertexShader: PASS_VERT, fragmentShader: SMEAR_FRAG, depthTest: false, depthWrite: false,
    });
    const tri = new THREE.BufferGeometry();
    tri.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
    this.passScene = new THREE.Scene(); this.passCamera = new THREE.Camera();
    this.passMesh = new THREE.Mesh(tri, this.smearMat); this.passMesh.frustumCulled = false;
    this.passScene.add(this.passMesh);

    // --- the living water and the trace
    this.sim = new RippleSim(renderer, { level, aniso });
    this.trace = new Trace(renderer, { level, aniso });
    this.binders = new WeakMap();                       // waterway -> functions to run when the water is bound to it
    this.mirrorHooks = new WeakMap();                   // waterway -> [{ before, after }] run round the drawing of the mirror
    this.overlays = [];                                 // realms' own sheets on the water's grid (overlay())
    this.shared = null;                                 // what realm shaders are given (waterUniforms): looked up again whenever the engine's shared uniforms change hands
    this.path = null; this.traceWanted = false;
    this.paddle = { next: 0, side: 1 };
    this.lat = { on: false, t: 0, x: 0, z: 0, strength: 1, radius: 30, hold: 6, color: new THREE.Color(1, 1, 1) };

    // --- waves
    this.waveTex = makeWaveTexture(256, 11); this.waveTex.anisotropy = aniso;
    this.slowPhase = SLOW.map((_, i) => i * 1.7); this.layerPhase = LAYERS.map((_, i) => i * 2.1);
    this.layerOff = LAYERS.map((l) => ({ u: l.off[0], v: l.off[1], ca: 1, sa: 0, inv: 1, set: false }));
    this.slow = SLOW.map(() => ({ kx: 0, kz: 0, amp: 0, set: false })); this.windAngle = null;
    this.gustTime = 0; this.rainTime = 0; this.heaveCap = 0; this.heaveScale = 1;
    this.swell = SWELL3.map(() => ({ kx: 0, kz: 0, k: 0, amp: 0, phase: 0 })); this.swellOn = false; this.swellPhase = [0.4, 2.1, 4.4];
    this.swellNow = 0; this.swellSnap = true;
    this.rest = { t: 0.9, end: 1, seed: 41 };           // a boat lying still breathes on the water (look.rest)
    this.routes = { a: { given: null, n: 0 }, b: { given: null, n: 0 } };      // the film's colours along the route, as last read (look.film.route)

    this.blank = new THREE.DataTexture(new Uint8Array([0, 0, 0, 0]), 1, 1); this.blank.needsUpdate = true;
    this.grey = new THREE.DataTexture(new Uint8Array([133, 133, 133, 255]), 1, 1); this.grey.wrapS = this.grey.wrapT = THREE.RepeatWrapping; this.grey.needsUpdate = true;
    this.fleckTex = null; this.skinTex = {}; this.skinKind = '';
    const v4 = (n) => Array.from({ length: n }, () => new THREE.Vector4(0, 0, 0, 0));
    const u = {
      tRefl: { value: this.target.texture }, tS1: { value: this.smears[0].texture }, tS2: { value: this.smears[1].texture }, tS3: { value: this.smears[2].texture },
      tReach: { value: this.reach.texture }, tWave: { value: this.waveTex },
      tRipF: { value: this.sim.auxFine }, tRipW: { value: this.sim.auxWide }, tRidgeF: { value: this.sim.ridgeFine }, tRidgeW: { value: this.sim.ridgeWide },
      tTrace: { value: this.blank }, tFleck: { value: this.blank }, tSkin: { value: this.grey },
      uTextureMatrix: { value: this.textureMatrix }, uReflSize: { value: this.reflSize }, uFocal: { value: 500 },
      uVP: { value: this.vp }, uLevelVar: { value: new THREE.Vector3(1, 2, 3) },
      tScene: { value: null }, tSceneDepth: { value: null }, uScreen: { value: new THREE.Vector4(1 / 1600, 1 / 900, 0.08, 1800) }, uPre: { value: new THREE.Vector4(4, 4, 0.25, 0.25) },
      uCamR: { value: new THREE.Vector3(1, 0, 0) }, uCamU: { value: new THREE.Vector3(0, 1, 0) }, uCamF: { value: new THREE.Vector3(0, 0, -1) }, uPixel: { value: 0.0012 },
      uBelow: { value: new THREE.Vector4(0, 1, 1, 3) }, uSee: { value: new THREE.Vector4(0.06, 8, 22, 0.05) }, uAbsorb: { value: new THREE.Vector4(1, 1, 1, 0.25) }, uRefract: { value: new THREE.Vector2(1, 1.5) },
      uSlowA: { value: v4(5) }, uSlowB: { value: v4(5) },
      uLayerA: { value: LAYERS.map(() => new THREE.Vector4(1, 0, 0.1, 0)) }, uLayerB: { value: LAYERS.map(() => new THREE.Vector4(0, 0, 1, 0)) },
      uAmp: { value: new THREE.Vector4() }, uInvLambda: { value: new THREE.Vector4(0.1, 0.3, 1, 2) },
      uRipF: { value: new THREE.Vector4(0, 0, 1 / 16, this.sim.n) }, uRipW: { value: new THREE.Vector4(0, 0, 1 / 64, this.sim.n) },
      uGust: { value: new THREE.Vector3() }, uRain: { value: new THREE.Vector4() },
      uZoneA: { value: this.sim.zoneA }, uZoneB: { value: this.sim.zoneB }, uZones: { value: 0 },
      uFront: { value: this.sim.front }, uFrontCalm: { value: 0 },
      uLamp: { value: new THREE.Vector4(0, 1, 0, 0) }, uLampColor: { value: new THREE.Color(1, 0.75, 0.5) },
      uCurve: { value: new THREE.Vector4(0.02, 0.92, 4.2, 0) }, uClear: { value: new THREE.Vector4(0, 8, 0.15, 0) }, uGrade: { value: new THREE.Vector2(0.15, 0.1) },
      uRough2: { value: 0 }, uSmear: { value: 0 }, uColumn: { value: 0 }, uStreak: { value: 1 }, uSparkle: { value: 0.25 }, uFoam: { value: 0.25 }, uChurn: { value: 0.5 }, uVeil: { value: 0 }, uSwellAmt: { value: 0 },
      uDeep: { value: new THREE.Color() }, uShallow: { value: new THREE.Color() }, uSparkleColor: { value: new THREE.Color() }, uGlow: { value: new THREE.Color(0, 0, 0) },
      uRippleGlow: { value: new THREE.Color(0, 0, 0) }, uReflectionTint: { value: new THREE.Color(1, 1, 1) },
      uSun: { value: new THREE.Vector4() }, uSunDir: { value: new THREE.Vector3(0, 0.1, -1).normalize() }, uSunColor: { value: new THREE.Color(0, 0, 0) },
      uLattice: { value: new THREE.Vector4() }, uLatticeB: { value: new THREE.Vector4(2.8, 0, 0, 0) }, uLatticeC: { value: new THREE.Vector4() }, uLatticeColor: { value: new THREE.Color(1, 1, 1) },
      uLatPhase: { value: new Float32Array(8) },
      uTraceRect: { value: new THREE.Vector4(0, 0, 1, 1) }, uFilmLine: { value: new THREE.Vector4(0, 0, 0, -1) }, uFilmHalf: { value: 16 },
      uFilm: { value: new THREE.Vector4() }, uFilmB: { value: new THREE.Vector4() }, uFilmA: { value: new THREE.Color() }, uFilmBc: { value: new THREE.Color() }, uFilmMix: { value: new THREE.Color() },
      uSkin: { value: new THREE.Vector4() }, uSkinB: { value: new THREE.Vector4() }, uSkinTint: { value: new THREE.Color(1, 1, 1) },
      uTouch: { value: new THREE.Vector4() }, uTouchColor: { value: new THREE.Color() },
      uPaint: { value: new THREE.Color(1, 1, 1) }, uLantern: { value: new THREE.Vector4(0, -100, 0, 7) }, uLanternColor: { value: new THREE.Color(0, 0, 0) },
      uKept: { value: new THREE.Vector4(0, -100, 0, 12) }, uKeptColor: { value: new THREE.Color(0, 0, 0) },
      uLights: { value: v4(PAINT_LIGHTS) }, uLightColors: { value: Array.from({ length: PAINT_LIGHTS }, () => new THREE.Color(0, 0, 0)) }, uLightCount: { value: 0 },
      uSwellK: { value: v4(3) }, uSwellOn: { value: new THREE.Vector4(0, TUNE.swellNear, TUNE.swellFar, 0) }, uWell: { value: new THREE.Vector4(0, 0, 0, -1) }, uWellB: { value: new THREE.Vector4() },
      // what the areas asked for (docs/water.md): each at nothing until a look asks
      uColumnFar: { value: 0 }, uSpare: { value: 0 }, uTremor: { value: -1 }, uColumnOwn: { value: 0 },
      uSheen: { value: new THREE.Vector4() }, uSheenB: { value: new THREE.Vector4() }, uSheenColor: { value: new THREE.Color(0, 0, 0) },
      tHaze: { value: this.blank }, uHaze: { value: new THREE.Vector4() }, uHazeD: { value: new THREE.Vector4(2, 18, 0, 0) }, uHazeRect: { value: new THREE.Vector4(0, 0, 1, 1) }, uHazeColor: { value: new THREE.Color(0, 0, 0) }, uHazeDeep: { value: new THREE.Color(0, 0, 0) },
      uLine: { value: new THREE.Vector4(0.012, 40, 0, 0) }, uLineColor: { value: new THREE.Color(0, 0, 0) },
      uFilmC: { value: new THREE.Vector4(1, 1, 0, 0) }, uFilmStopA: { value: v4(FILM_STOPS) }, uFilmStopB: { value: v4(FILM_STOPS) }, uFilmStopsA: { value: 0 }, uFilmStopsB: { value: 0 },
      uTouchAge: { value: new THREE.Vector4(0.26, 0.6, 0.93, 0) }, uTouchFresh: { value: new THREE.Color() }, uTouchLate: { value: new THREE.Color() }, uTouchDying: { value: new THREE.Color() },
      ...THREE.UniformsLib.fog,
    };
    this.material = new THREE.ShaderMaterial({ uniforms: u, vertexShader: VERT, fragmentShader: FRAG, transparent: true, premultipliedAlpha: true, fog: true, depthWrite: false });
    this.flatGeo = makeDisc();
    this.swellGeo = null;
    this.mesh = new THREE.Mesh(this.flatGeo, this.material);
    this.mesh.name = 'water'; this.mesh.renderOrder = -1; this.mesh.frustumCulled = false;
    // The surface finds what lies behind each of its pixels by the pixel's place in the picture: measure the picture it
    // is really being drawn into (a pixel ratio such as 1.25 rounds differently in different places, and the sheet may be
    // drawn into another target altogether), not the one it was told about.
    const drawn = new THREE.Vector2();
    this.mesh.onBeforeRender = (renderer, scene, camera) => {
      const rt = renderer.getRenderTarget();
      if (rt) drawn.set(rt.width, rt.height); else renderer.getDrawingBufferSize(drawn);
      const w = Math.max(1, Math.floor(drawn.x)), h = Math.max(1, Math.floor(drawn.y)), sc = u.uScreen.value;
      if (sc.x !== 1 / w || sc.y !== 1 / h) { sc.x = 1 / w; sc.y = 1 / h; this.material.uniformsNeedUpdate = true; }
      const px = 2 * Math.tan((camera.fov || 60) * Math.PI / 360) / h;
      if (u.uPixel.value !== px) { u.uPixel.value = px; this.material.uniformsNeedUpdate = true; }
    };
    engine.scene.add(this.mesh);
    this.veilColor = new THREE.Color(0, 0, 0);
    this.setLook(WATER_LOOK);
    const s = renderer.getDrawingBufferSize(new THREE.Vector2());
    this.setSize(s.x, s.y, 1);
  }

  // ---------------------------------------------------------------------------------------------- interface
  /**
   * Every frame, with the realm's blended look. Keys that are missing keep their last value; a value that is not a finite
   * number (or not the kind of thing the key wants) is ignored and the default stands in while it lasts.
   */
  setLook(look) {
    const u = this.material.uniforms, L = this.look, P = this.P, D = WATER_LOOK;
    if (look && typeof look === 'object') for (const k in look) L[k] = look[k];
    setColor(u.uDeep.value, L.deep); setColor(u.uShallow.value, L.shallow); setColor(u.uSparkleColor.value, L.sparkleColor); setColor(u.uGlow.value, L.glow);
    setColor(u.uReflectionTint.value, L.reflectionTint);
    u.uRippleGlow.value.copy(setColor(this.glowColor, L.rippleGlow)).multiplyScalar(rng(L.rippleGlowStrength, 0, 0, 100));
    u.uCurve.value.set(rng(L.reflectFloor, 0.02, 0, 1), rng(L.reflectivity, 0.92, 0, 1), rng(L.fresnel, 4.2, 0.05, 64), 0);
    u.uClear.value.set(rng(L.clearRadius, 0, 0, 1e4), rng(L.clearSoft, 8, 0.01, 1e4), rng(L.clearFloor, 0.15, 0, 1), 0);
    u.uGrade.value.set(rng(L.mirrorDarken, 0.15, 0, 1), rng(L.mirrorSaturate, 0.1, -1, 2));
    P.streak = rng(L.streak, 1, 0, 8);
    u.uStreak.value = P.streak; u.uSparkle.value = rng(L.sparkle, 0, 0, 100); u.uFoam.value = rng(L.foam, 0, 0, 4); u.uChurn.value = rng(L.churn, 0.5, 0, 2);
    // lights in the mirror: their columns by themselves, where they end, and how far lights are spared the mirror's grade
    P.column = num(L.column, -1) >= 0 ? rng(L.column, 1, 0, 8) : -1;
    u.uColumnFar.value = rng(L.columnFar, 0, 0, 1e5); u.uSpare.value = rng(L.spareLights, 0, 0, 1);
    u.uVeil.value = this.veil;
    // looking in
    const opacity = rng(L.opacity, 0.94, 0, 0.9995), clarity = rng(L.clarity, 0, 0, 1e4);
    this.sigma = Math.min(1e4, clarity > 0 ? 1.1 / clarity : -Math.log(1 - opacity));
    const underglow = num(L.underglow, -1) >= 0 ? clamp(L.underglow, 0, 1) : 1 - opacity, far = rng(L.seeDistance, 22, 2, 5000), edge = rng(L.edge, 0.05, 0, 10);
    u.uSee.value.set(underglow, far * 0.3, far, edge);
    setColor(_col, L.absorb); u.uAbsorb.value.set(clamp(_col.r, 1e-3, 1), clamp(_col.g, 1e-3, 1), clamp(_col.b, 1e-3, 1), 1 / rng(L.absorbDepth, 4, 0.05, 1e4));
    u.uRefract.value.set(rng(L.refraction, 1, 0, 50), rng(L.refractReach, 1.5, 0.1, 1e3));
    u.uTremor.value = num(L.tremor, -1) >= 0 ? rng(L.tremor, 1, 0, 50) : -1;
    // the water between: swallowing by the distance sight travels through water and by depth, into its own colours; lit water from a look's picture
    const hz = sub(L.haze, D.haze), hd = vec(hz.depths, D.haze.depths, 2), hr = vec(hz.rect, D.haze.rect, 4), hazeMap = hz.map && hz.map.isTexture ? hz.map : null;
    const perMetre = rng(hz.perMetre, 0, 0, 100), perDepth = rng(hz.perDepth, 0, 0, 100), hd0 = clamp(hd[0], 0, 1e4);
    u.uHaze.value.set(perMetre, perDepth, rng(hz.burn, 0, 0, 1), perMetre + perDepth > 0 ? 1 : 0);
    u.uHazeD.value.set(hd0, clamp(hd[1], hd0 + 0.01, 2e4), hazeMap ? rng(hz.lit, 1, 0, 100) : 0, 0);
    u.uHazeRect.value.set(hr[0], hr[1], 1 / clamp(Math.abs(hr[2]), 1e-3, 1e6), 1 / clamp(Math.abs(hr[3]), 1e-3, 1e6));
    setColor(u.uHazeColor.value, hz.color); setColor(u.uHazeDeep.value, hz.deep);
    u.tHaze.value = hazeMap || this.blank;
    // a line of light where the water meets what stands in it
    const wl = sub(L.waterline, D.waterline), lineGain = rng(wl.gain, 1, 0, 100);
    setColor(_col.setRGB(0, 0, 0), wl.color); u.uLineColor.value.copy(_col).multiplyScalar(lineGain);
    const lineOn = lineGain > 0 && _col.r + _col.g + _col.b > 0;
    u.uLine.value.set(rng(wl.width, 0.012, 0.001, 1), rng(wl.reach, 40, 1, 1e5), 0, lineOn ? 1 : 0);
    // sky-light on leaning water
    const shn = sub(L.sheen, D.sheen), lampShare = rng(shn.lamps, 0, 0, 100);
    setColor(u.uSheenColor.value, shn.color);
    const sheenOn = lampShare > 0 || u.uSheenColor.value.r + u.uSheenColor.value.g + u.uSheenColor.value.b > 0 ? 1 : 0;
    u.uSheen.value.set(rng(shn.rings, 0, 0, 100) * sheenOn, rng(shn.still, 0, 0, 100) * sheenOn, rng(shn.glance, 0, 0, 100) * sheenOn, rng(shn.rain, 0, 0, 100) * sheenOn);
    u.uSheenB.value.set(rng(shn.hide, 0, 0, 1), lampShare, 0, 0);
    // (the engine's picture of the scene without the water is needed whenever anything beneath can show: that is, unless
    // the water is all but opaque, has no clarity, no floor for things that glow beneath, and a hard edge)
    this.needsScene = underglow > 0.004 || clarity > 0 || edge > 0 || opacity < 0.996;
    // the front
    const fr = sub(L.front, D.front), fn = vec(fr.normal, D.front.normal, 2), nl = Math.hypot(fn[0], fn[1]) || 1;
    this.sim.front.set(fn[0] / nl, fn[1] / nl, rng(fr.offset, 1e5, -1e6, 1e6), 1 / rng(fr.width, 10, 0.1, 1e4));
    u.uFrontCalm.value = rng(fr.calm, 0, 0, 1);
    P.frontRain = rng(fr.rain, 0, 0, 1);
    // light on the water
    const sun = sub(L.sun, D.sun), sd = vec(sun.dir, D.sun.dir, 3), ss = rng(sun.strength, 0, 0, 100);
    setColor(u.uSunColor.value, sun.color);
    u.uSunDir.value.set(sd[0], Math.max(0.01, sd[1]), sd[2]).normalize();
    const spread = 0.03 * rng(sun.spread, 1, 0.1, 50);
    u.uSun.value.set(ss * (u.uSunColor.value.r + u.uSunColor.value.g + u.uSunColor.value.b > 0 ? 1 : 0), spread * spread, rng(sun.glitter, 0.35, 0, 1), 0);
    // the waves and the living water (update() reads these, never the look itself)
    P.mirror = rng(L.mirror, 0, 0, 1); P.waveHeight = rng(L.waveHeight, 0.55, -20, 20); P.waveScale = rng(num(L.waveScale, 1) || 1, 1, 0.05, 50); P.waveSpeed = rng(L.waveSpeed, 1, -20, 20);
    P.wind = vec(L.wind, D.wind, 2); P.roughness = rng(L.roughness, 0.12, 0, 4);
    P.swell = rng(L.swell, 0, 0, 6); P.swellLength = rng(L.swellLength, 24, 4, 400); P.swellPeriod = rng(L.swellPeriod, 7, 1, 120); P.swellDir = vec(L.swellDir, D.swellDir, 2);
    P.rain = rng(L.rain, 0, 0, 60); P.rainStrength = rng(L.rainStrength, 1, 0, 12);
    P.wake = rng(L.wake, 1, 0, 4); P.rippleSize = rng(L.rippleSize, 64, 32, 96); P.rippleLife = rng(L.rippleLife, 4, 0.3, 120); P.rippleSpeed = rng(L.rippleSpeed, 1, 0.25, 2.5);
    P.rest = rng(L.rest, 0, 0, 6);
    if (lineOn) this.needsScene = true;                  // (the waterline is found in the engine's picture of the scene without the water)
    // what the trace is read as
    const film = sub(L.film, D.film), skin = sub(L.skin, D.skin), touch = sub(L.touch, D.touch), tr = sub(L.trace, D.trace), F = P.film, S = P.skin, T = P.touch;
    const fa = rng(film.amount, 0, 0, 100), sa = rng(skin.amount, 0, 0, 100), ta = rng(touch.amount, 0, 0, 100);
    F.amount = fa; F.cover = rng(film.cover, 0.75, 0, 1); F.split = rng(film.split, 1, 0, 1); F.scale = rng(film.scale, 7, 0.5, 1e3); F.flow = rng(film.flow, 0.08, -10, 10); F.life = rng(film.life, 60, 2, 1e4); F.stir = rng(film.stir, 1, 0, 20);
    u.uFilm.value.set(Math.min(1, fa), F.cover, F.split, 1 / F.scale);
    u.uFilmB.value.set(u.uFilmB.value.x, rng(film.matte, 0.8, 0, 1), rng(film.light, 1, 0, 100), fa > 0 ? 1 : 0);
    setColor(u.uFilmA.value, film.a); setColor(u.uFilmBc.value, film.b); setColor(u.uFilmMix.value, film.mix);
    u.uFilmC.value.set(rng(film.brush, 1, 0, 4), rng(film.tinted, 1, 0, 1), 0, 0);
    const route = film.route && typeof film.route === 'object' && !film.route.isColor && !film.route.isTexture ? film.route : null;
    u.uFilmStopsA.value = this.readRoute(this.routes.a, route && route.a, u.uFilmStopA.value); u.uFilmStopsB.value = this.readRoute(this.routes.b, route && route.b, u.uFilmStopB.value);
    const kind = skin.kind === 'ice' ? 1 : 0;
    S.amount = sa; S.close = rng(skin.close, 25, 0.5, 1e4); S.lead = rng(skin.lead, 0, 0, 50); S.width = rng(skin.width, 0, 0, 50);
    u.uSkin.value.set(Math.min(1, sa), kind, 1 / rng(skin.scale, 3, 0.2, 1e3), rng(skin.plate, 1.1, 0.2, 100));
    u.uSkinB.value.x = rng(skin.sheen, 0.25, 0, 1) * kind; u.uSkinB.value.y = rng(skin.light, 1, 0, 100);      // (z: update() says whether the trace holds standing open water)
    setColor(u.uSkinTint.value, skin.tint);
    if (sa > 0) u.tSkin.value = skin.map && skin.map.isTexture ? skin.map : this.skinTexture(kind ? 'ice' : 'petal');
    T.amount = ta; T.hold = rng(touch.hold, 4, 0.2, 1e3); T.wake = rng(touch.wake, 1, 0, 100);
    u.uTouch.value.set(ta, 1 / (3.0 * rng(touch.fleck, 1, 0.2, 100)), T.wake, 0);
    setColor(u.uTouchColor.value, touch.color);
    // (light from touch by age: each of the three is the colour next to it until a look gives it one of its own)
    const isCol = (c) => !!c && (c.isColor === true || (typeof c === 'string' && c.length > 0));
    const ag = vec(touch.ages, D.touch.ages, 3), a0 = clamp(ag[0], 0.001, 0.97), a1 = clamp(ag[1], a0 + 0.001, 0.98), a2 = clamp(ag[2], a1 + 0.001, 0.999);
    u.uTouchAge.value.set(a0, a1, a2, isCol(touch.fresh) || isCol(touch.late) || isCol(touch.dying) ? 1 : 0);
    setColor(u.uTouchFresh.value.copy(u.uTouchColor.value), isCol(touch.fresh) ? touch.fresh : null);
    setColor(u.uTouchLate.value.copy(u.uTouchColor.value), isCol(touch.late) ? touch.late : null);
    setColor(u.uTouchDying.value.copy(u.uTouchLate.value), isCol(touch.dying) ? touch.dying : null);
    if (ta > 0 && !this.fleckTex) this.fleckTex = makeFleckTexture();
    if (ta > 0) u.tFleck.value = touch.map && touch.map.isTexture ? touch.map : this.fleckTex;
    P.texel = rng(tr.texel, 0.125, 0.01, 100); P.margin = rng(tr.margin, 14, 0, 500); P.lay = tr.lay === true;
    this.traceWanted = fa > 0 || sa > 0 || ta > 0 || P.lay;
    this.traceFloat = fa > 0;
    if (this.traceWanted && this.path && this.path !== this.badPath && (!this.trace.active || this.trace.path !== this.path || (this.traceFloat && !this.trace.float))) this.layTrace();
  }

  /**
   * A pigment's colours along the route (look.film.route.a or .b): [[metres along the waterway's line, colour], ...],
   * up to eight stops. Read into `stops` (rgb, metres) only when the list given is another one than last time, or its
   * colours are THREE.Colors (which a realm may be changing): returns how many stops there are (0: the pigment has one colour).
   */
  readRoute(kept, list, stops) {
    if (!Array.isArray(list) || !list.length) { kept.given = null; kept.n = 0; return 0; }
    if (list === kept.given && !kept.live) return kept.n;
    const rows = []; let live = false;
    for (const row of list) {
      if (!Array.isArray(row) || !(typeof row[0] === 'number' && Number.isFinite(row[0]))) continue;
      const c = row[1];
      if (c && c.isColor) { live = true; rows.push([row[0], c]); } else if (typeof c === 'string' && /^(#|rgb|hsl)/i.test(c.trim())) rows.push([row[0], c]);
      if (rows.length === FILM_STOPS) break;
    }
    rows.sort((p, q) => p[0] - q[0]);
    let last = -Infinity;
    for (let i = 0; i < rows.length; i++) {
      const at = Math.max(rows[i][0], last + 0.01); last = at;      // (two stops never stand at one place: the shader blends between them)
      setColor(_col.setRGB(0, 0, 0), rows[i][1]); stops[i].set(_col.r, _col.g, _col.b, clamp(at, -1e5, 1e5));
    }
    kept.given = list; kept.live = live; kept.n = rows.length;
    return kept.n;
  }

  /** A default picture for a skin whose realm gave none: scattered petals, or frosted ice. */
  skinTexture(kind) {
    if (!this.skinTex[kind]) this.skinTex[kind] = makeSkinTexture(kind);
    return this.skinTex[kind];
  }

  /** Dissolve into the veil between realms (k: 0 clear .. 1 veiled). Called with the look just before setLook. */
  veilLook(W, veilColor, k) { this.veil = rng(k, 0, 0, 1); if (veilColor && veilColor.isColor) this.veilColor.copy(veilColor); }

  /** Disturb the surface at a world position: rings spread from there. Any number of calls a frame. */
  ripple(x, z, strength = 1, radius = 0.5) { if (Number.isFinite(x) && Number.isFinite(z)) this.sim.ripple(x, z, strength, radius); }
  /** An oar's blade working the water this frame: a moving pressure patch in the simulation, like the hull (see sim.blade). */
  blade(i, x, z, mx, mz, o) { this.sim.blade(i, x, z, mx, mz, o); }

  /** A place where it rains: { x, z, radius, rate, strength } (a disc), or with x2, z2 a line of drips. Returns the zone: change its fields, or call remove(). */
  rainZone(spec) { return this.sim.rainZone(spec); }

  /** Strike the water like a bell: a lattice of fine bright lines stands round (x, z) for `hold` seconds, then relaxes into one slow ring. */
  lattice({ x = 0, z = 0, strength = 1, radius = 30, hold = 6, color = '#dfe9ff' } = {}) {
    if (!Number.isFinite(x) || !Number.isFinite(z)) return;
    const l = this.lat; l.on = true; l.t = 0; l.x = x; l.z = z; l.strength = rng(strength, 1, 0, 20); l.radius = rng(radius, 30, 1, 400); l.hold = rng(hold, 6, 0, 600);
    setColor(l.color.set('#dfe9ff'), color);
  }

  /** Run fn(water) every time the water is bound to this waterway (when its realm becomes the current one): pre-write a lane, add rain zones. */
  onBind(path, fn) {
    if (!path || typeof fn !== 'function') return;
    const list = this.binders.get(path) || []; list.push(fn); this.binders.set(path, list);
    // (asked for by the realm that is current already: now, if its first frame has passed; otherwise that frame runs it)
    if (path === this.path && this.bound) { try { fn(this); } catch (err) { console.error('water: an onBind function threw', err); } }
  }

  /**
   * A look of its own for the mirror: before(camera) runs just before the water draws its reflection of the scene and
   * after(camera) just after it, while this waterway's realm is the current one (camera: the mirror's own). Change what
   * the reflection should see differently in `before` (the fog, the painted light, a lamp, a material's uniform) and put
   * it back in `after`. A hook that throws is switched off and reported once.
   */
  onMirror(path, before, after) {
    if (!path || (typeof before !== 'function' && typeof after !== 'function')) return;
    const list = this.mirrorHooks.get(path) || []; list.push({ before: typeof before === 'function' ? before : null, after: typeof after === 'function' ? after : null, broken: false }); this.mirrorHooks.set(path, list);
  }
  mirrorHook(h, when, camera) {
    if (h.broken || !h[when]) return;
    try { h[when](camera); } catch (err) { h.broken = true; console.error('water: an onMirror function threw and has been switched off', err); }
  }

  /**
   * A sheet of a realm's own lying ON the water: a mesh with your material on the water's own grid (the flat disc, or
   * the swell's grid while a swell is up), kept where the water's sheet is frame by frame. Lift it in its vertex shader
   * with waterSurface() (WATER_SURFACE_GLSL) and it lies on the surface exactly, swell, well round the hull and all.
   * Add it to your realm (ctx.add); it is freed with its material. renderOrder 0 is straight after the water; with
   * mirror: false (the default) it is not drawn in the water's reflection. A see-through material that writes no depth
   * (as light lying on water is) is left out of the picture of what lies beneath by the engine.
   */
  overlay(material, opts) {
    if (!material || !material.isMaterial) return null;
    const { renderOrder = 0, mirror = false } = opts || {};
    // (its own geometry over the water's own numbers: a realm that is freed frees its sheet, never the water's)
    const twin = (geo) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(geo.attributes.position.array, 3)); g.setIndex(new THREE.BufferAttribute(geo.index.array, 1)); return g; };
    const o = { mesh: null, disc: twin(this.flatGeo), grid: null, twin };
    const mesh = o.mesh = new THREE.Mesh(this.swellOn && this.swellGeo ? (o.grid = twin(this.swellGeo)) : o.disc, material);
    mesh.name = 'on the water'; mesh.frustumCulled = false; mesh.renderOrder = num(renderOrder, 0);
    if (mirror !== true) mesh.layers.set(1);
    mesh.position.copy(this.mesh.position);
    const free = () => { o.disc.dispose(); if (o.grid) o.grid.dispose(); const i = this.overlays.indexOf(o); if (i >= 0) this.overlays.splice(i, 1); material.removeEventListener('dispose', free); };
    material.addEventListener('dispose', free);
    this.overlays.push(o);
    return mesh;
  }

  /** The realm's waterway: the trace is laid over its bounds, cleared. Called by the realm manager when a realm becomes current. */
  bind(path) {
    if (path === this.path && this.trace.active) this.trace.clear(); else this.trace.release();
    this.path = path || null; this.badPath = null;
    for (const z of [...this.sim.zones]) z.remove();
    this.lat.on = false;
    this.bound = false; this.swellSnap = true;
  }

  layTrace() {
    const P = this.P;
    try { this.trace.lay(this.path, { texel: P.texel, margin: P.margin, float: this.traceFloat, film: this.traceFloat ? P.film : null }); }
    catch (err) { this.badPath = this.path; console.error('water: the trace could not be laid over this waterway (the realm goes without one)', err); }      // (once, not on every frame)
  }

  /**
   * Height of the surface, for the boat and for things that float. Flat water returns only a breath of its slow swell
   * (at most three centimetres); a realm's `swell` returns the real thing. Never reads the GPU.
   */
  heightAt(x, z) {
    let h = 0;
    const px = x + 1.1 * (Math.sin(z * 0.0713 + 1.3) + Math.sin(z * 0.0291 + x * 0.0133)), pz = z + 1.1 * (Math.sin(x * 0.0631 + 4.1) + Math.sin(x * 0.0317 - z * 0.0171));
    for (let i = 0; i < SLOW.length; i++) { const w = this.slow[i]; h += w.amp * Math.sin(w.kx * px + w.kz * pz - this.slowPhase[i]); }
    h = this.heaveCap * Math.tanh(h / this.heaveScale);
    if (this.swellOn) for (let i = 0; i < 3; i++) { const w = this.swell[i], ph = w.kx * x + w.kz * z - w.phase; h += w.amp * Math.cos(ph) + 0.5 * w.k * w.amp * w.amp * Math.cos(2 * ph); }
    return h === h ? h : 0;
  }

  /** Slope of the swell at a place: out.x = rise per metre along x, out.z = along z (zero on flat water). For tilting things that float. */
  slopeAt(x, z, out = { x: 0, z: 0 }) {
    out.x = 0; out.z = 0;
    if (this.swellOn) for (let i = 0; i < 3; i++) { const w = this.swell[i], ph = w.kx * x + w.kz * z - w.phase, s = -(w.amp * Math.sin(ph) + w.k * w.amp * w.amp * Math.sin(2 * ph)); out.x += w.kx * s; out.z += w.kz * s; }
    if (out.x !== out.x || out.z !== out.z) { out.x = 0; out.z = 0; }
    return out;
  }

  setSize(w, h) {
    w = Math.round(rng(w, 1, 1, 16384)); h = Math.round(rng(h, 1, 1, 16384));
    this.pixelSize = [w, h];
    this.material.uniforms.uScreen.value.set(1 / Math.max(1, w), 1 / Math.max(1, h), 0.08, 1800);
    let k = this.resolution * this.mirrorScale;
    // (a mirror asked to be finer than usual may hold up to 1.44 times the usual pixels, no more: it is multisampled, and
    // the whole water keeps to its 150 MB)
    const cap = (MIRROR_PIXELS[this.level] || 1e6) * clamp(this.mirrorScale * this.mirrorScale, 1, MIRROR_FINER);
    k = Math.min(k, Math.sqrt(cap / Math.max(1, w * h * OVER_X * OVER_Y)));
    const rw = Math.max(64, Math.round(w * k * OVER_X)), rh = Math.max(64, Math.round(h * k * OVER_Y));
    this.target.setSize(rw, rh);
    this.mirrorDrawn = false;                              // (a new size: the mirror is empty until it is drawn again)
    this.reflSize.set(rw, rh);
    this.reach.setSize(Math.ceil(rw / 2), Math.ceil(rh / 2));
    this.reachMat.uniforms.uTexel.value.set(1 / Math.ceil(rw / 2), 1 / Math.ceil(rh / 2));
    SMEARS.forEach((s, i) => this.smears[i].setSize(Math.max(16, Math.ceil(rw * s.scale)), Math.max(16, Math.ceil(rh * s.scale))));
    // the three smears add up: each is made from the one before
    const lv = [];
    for (const s of SMEARS) { const sg = s.sigma * rh; lv.push(sg * sg); }
    this.material.uniforms.uLevelVar.value.set(lv[0], lv[1], lv[2]);
  }

  /** Resolution of the mirror relative to the quality setting (a realm in near darkness can halve it). */
  setMirrorScale(scale = 1) {
    scale = clamp(Math.round((num(scale, 1) || 1) * 8) / 8, 0.25, 1.5);
    if (scale === this.mirrorScale) return;
    this.mirrorScale = scale;
    const samples = scale < 1 ? 0 : this.samples;       // a coarse mirror (a dark realm) is not worth multisampling
    if (samples !== this.target.samples) { this.target.dispose(); this.target.samples = samples; }
    if (this.pixelSize[0]) this.setSize(this.pixelSize[0], this.pixelSize[1]);
  }

  /** The boat has been put somewhere else (a new realm): the water round it comes along. */
  teleport() { this.sim.teleport(); this.mirrorDrawn = false; }      // (the mirror kept from the frame before shows another place)

  update(dt, time, boat) {
    const u = this.material.uniforms, P = this.P, engine = this.engine;
    dt = rng(dt, 0, 0, 0.25);
    if (boat && !(Number.isFinite(boat.x) && Number.isFinite(boat.z) && Number.isFinite(boat.heading))) boat = null;      // a boat that is nowhere: the water waits
    this.time += dt;
    // --- the character of the waves
    const still = 1 - P.mirror;
    const A = 0.09 * P.waveHeight * Math.pow(still, 1.3);
    const scale = P.waveScale, speed = SPEED * P.waveSpeed;
    // the wind is eased, and the whole pattern is kept where it is under the boat while its size and direction change:
    // a look that blends waveScale or wind turns the waves about the rider instead of streaming them past
    const wind = P.wind, want = Math.atan2(wind[1], wind[0]);
    if (this.windAngle === null || this.windAngle !== this.windAngle) this.windAngle = want;
    else { let d = (want - this.windAngle) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; this.windAngle += d * (1 - Math.exp(-dt * TUNE.windEase)); }
    const wa = this.windAngle;
    const ax0 = boat ? boat.x : 0, az0 = boat ? boat.z : 0;
    const ax = ax0 + 1.1 * (Math.sin(az0 * 0.0713 + 1.3) + Math.sin(az0 * 0.0291 + ax0 * 0.0133)), az = az0 + 1.1 * (Math.sin(ax0 * 0.0631 + 4.1) + Math.sin(ax0 * 0.0317 - az0 * 0.0171));
    // toward a mirror the wavelets die away first; the slow swell is the last thing left
    const fine = Math.pow(still, 0.6), sw = A * 0.5 * (1 + 1.5 * (1 - still));
    u.uAmp.value.set(sw, A * 0.5 * fine, A * 0.55 * fine, A * 0.45 * fine);
    const rough = 0.13 * P.roughness * still;
    u.uRough2.value = rough * rough;
    u.uSmear.value = (0.006 + 0.07 * P.roughness) * P.streak * Math.pow(still, 1.5);      // everything is drawn out a little, as a painter would
    this.boost = 1.0 * clamp(P.streak, 0, 2) * still;
    u.uColumnOwn.value = P.column >= 0 ? 1 : 0; u.uColumn.value = P.column >= 0 ? TUNE.column * P.column : TUNE.column * P.streak * Math.pow(still, 1.5);      // (a look's column: a lamp keeps its stroke however still the water)
    let norm = 0, energy = 0; for (const s of SLOW) norm += s.w * s.w;
    norm = Math.sqrt(4 / norm);
    for (let i = 0; i < SLOW.length; i++) {
      const s = SLOW[i], k = TAU / (s.l * scale), a = wa + s.a, dx = Math.cos(a), dz = Math.sin(a);
      const w = this.slow[i];
      if (w.set) this.slowPhase[i] += (dx * k - w.kx) * ax + (dz * k - w.kz) * az;
      this.slowPhase[i] = (this.slowPhase[i] + dt * speed * Math.sqrt(GRAV * k)) % TAU;
      if (this.slowPhase[i] !== this.slowPhase[i]) this.slowPhase[i] = 0;
      u.uSlowA.value[i].set(dx * k, dz * k, this.slowPhase[i], 0);
      u.uSlowB.value[i].set(dx * s.w * norm, dz * s.w * norm, 0, 0);
      w.kx = dx * k; w.kz = dz * k; w.amp = sw * s.w * norm / k; w.set = true;
      energy += 0.5 * w.amp * w.amp;
    }
    const rms = Math.sqrt(energy);
    this.heaveScale = Math.max(1e-4, 2 * rms); this.heaveCap = Math.min(0.03, 0.4 * rms);
    for (let i = 0; i < LAYERS.length; i++) {
      const l = LAYERS[i], tile = l.tile * scale, lambda = tile / WAVE_PEAK, c = speed * Math.sqrt(GRAV * lambda / TAU), a = wa + l.rot;
      const ca = Math.cos(a), sa2 = Math.sin(a), inv = 1 / tile, o = this.layerOff[i];
      if (o.set) { o.u += (ax * ca + az * sa2) * inv - (ax * o.ca + az * o.sa) * o.inv; o.v += (-ax * sa2 + az * ca) * inv - (-ax * o.sa + az * o.ca) * o.inv; }
      o.ca = ca; o.sa = sa2; o.inv = inv; o.set = true;
      o.u = (o.u + dt * 0.5 * c / tile) % 1; o.v %= 1;
      this.layerPhase[i] = (this.layerPhase[i] + dt * TAU * WAVE_PEAK * 0.5 * c / tile) % TAU;
      if (o.u !== o.u) o.u = l.off[0]; if (o.v !== o.v) o.v = l.off[1]; if (this.layerPhase[i] !== this.layerPhase[i]) this.layerPhase[i] = 0;
      u.uLayerA.value[i].set(ca, sa2, 1 / tile, 0);
      u.uLayerB.value[i].set(o.u, o.v, Math.cos(this.layerPhase[i]), Math.sin(this.layerPhase[i]));
      u.uInvLambda.value.setComponent(i + 1, 1 / lambda);
    }
    u.uInvLambda.value.x = 1 / (9 * scale);
    this.gustTime += dt * 0.05 * P.waveSpeed;
    if (this.gustTime !== this.gustTime) this.gustTime = 0; if (this.time !== this.time) this.time = 0;
    u.uGust.value.set(this.gustTime, 0.42 * still, this.time % 4096);
    this.rainTime = (this.rainTime + dt / 0.85) % 4096;
    u.uRain.value.set(P.rain, this.rainTime, 0.3 * P.rainStrength, P.frontRain);

    // --- the true swell: three long waves that lift the surface and the boat
    // (within a realm its height is eased, so that a look which switches the swell on or off in one frame, or the rider
    // switching reduced motion, never makes the whole surface jump; a realm that begins with a swell has it at once)
    const swellWant = P.swell * (engine.reducedMotion ? 0.35 : 1);
    if (this.swellSnap || !(Math.abs(swellWant - this.swellNow) > 5e-4)) this.swellNow = swellWant; else this.swellNow += (swellWant - this.swellNow) * (1 - Math.exp(-dt / TUNE.swellEase));
    this.swellSnap = false;
    const sh = this.swellNow;
    // (the painted materials' set-up, made after the water, replaces two of the shared uniforms with its own: the water
    // writes into whichever objects are the engine's now, and asks again only when they have changed)
    let shared = this.shared; const ES = engine.shared;
    if (!shared || shared.tRipple !== ES.tRipple || shared.uRippleRect !== ES.uRippleRect || shared.tTrace !== ES.tTrace || shared.uTraceRect !== ES.uTraceRect || shared.uSwell !== ES.uSwell) shared = this.shared = waterUniforms(engine);
    if (sh > 0.001) {
      if (!this.swellGeo) { const g = SWELL_GRID[this.level] || SWELL_GRID.high; this.swellGeo = makeSwellGrid(g.cell, g.flat); this.swellCell = g.cell; }
      const len = P.swellLength, per = P.swellPeriod, dir = P.swellDir, da = Math.atan2(dir[1], dir[0]);
      for (let i = 0; i < 3; i++) {
        const s = SWELL3[i], w = this.swell[i], k = TAU / (len * s.len), a = da + s.turn;
        const nkx = Math.cos(a) * k, nkz = Math.sin(a) * k;
        if (w.k > 0) this.swellPhase[i] += (nkx - w.kx) * ax0 + (nkz - w.kz) * az0;
        this.swellPhase[i] = (this.swellPhase[i] + dt * (TAU / per) / Math.sqrt(s.len)) % TAU;
        if (this.swellPhase[i] !== this.swellPhase[i]) this.swellPhase[i] = 0;
        w.kx = nkx; w.kz = nkz; w.k = k; w.amp = 0.5 * sh * s.w; w.phase = this.swellPhase[i];
        u.uSwellK.value[i].set(w.kx, w.kz, w.phase, w.amp); shared.uSwell.value[i].copy(u.uSwellK.value[i]);
      }
      this.swellOn = true;
    } else if (this.swellOn) {
      this.swellOn = false;
      for (let i = 0; i < 3; i++) { this.swell[i].amp = 0; this.swell[i].k = 0; u.uSwellK.value[i].set(0, 0, 0, 0); shared.uSwell.value[i].set(0, 0, 0, 0); }
    }
    u.uSwellAmt.value = this.swellOn ? sh : 0;
    u.uSwellOn.value.x = this.swellOn ? 1 : 0;
    const geo = this.swellOn ? this.swellGeo : this.flatGeo;
    if (this.mesh.geometry !== geo) this.mesh.geometry = geo;

    // --- the view beneath the water, when the engine draws one
    const pre = engine.pre, cam = engine.camera;
    const below = !!(pre && pre.depthTexture) && (this.needsScene || engine.paintAmount > 0);     // only when it is really being drawn
    if (below) { u.tScene.value = pre.texture; u.tSceneDepth.value = pre.depthTexture; u.uPre.value.set(pre.width, pre.height, 1 / pre.width, 1 / pre.height); }
    const pe = cam.projectionMatrix.elements;
    u.uBelow.value.set(below ? 1 : 0, 0.5 * pe[0], 0.5 * pe[5], this.sigma);
    u.uScreen.value.z = cam.near; u.uScreen.value.w = cam.far;

    // --- the painted light: what falls on a level, matte thing in this realm (kit.gouache's ramp at a surface facing up,
    // plus its light from the sky), and the lamps that travel with it. Read from the uniforms every painted surface shares.
    const S = engine.shared;
    if (S.uKeyDir && S.uRampLight) {
      const w = clamp(0.5 - 0.5 * S.uKeyDir.value.y, 0, 1), sh = S.uRampShadow.value, li = S.uRampLight.value, kc = S.uKeyColor.value, sky = S.uSkyLight.value;
      const ease = (x) => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); }, a = ease(w * 2), b = ease(w * 2 - 1);
      const ramp = (shadow, lit) => (w < 0.5 ? shadow + (1 - shadow) * a : 1 + (lit - 1) * b);
      u.uPaint.value.setRGB(ramp(sh.r, li.r * kc.r) + sky.r, ramp(sh.g, li.g * kc.g) + sky.g, ramp(sh.b, li.b * kc.b) + sky.b);
      const lp = S.uLanternPos.value, kp = S.uLampPos.value;
      u.uLantern.value.set(lp.x, lp.y, lp.z, S.uLanternRadius.value); u.uLanternColor.value.copy(S.uLanternColor.value);
      u.uKept.value.set(kp.x, kp.y, kp.z, S.uLampRadius.value); u.uKeptColor.value.copy(S.uLampColor.value);
      const n = Math.min(PAINT_LIGHTS, S.uLightCount.value | 0, S.uLights.value.length);
      for (let i = 0; i < n; i++) { u.uLights.value[i].copy(S.uLights.value[i]); u.uLightColors.value[i].copy(S.uLightColors.value[i]); }
      u.uLightCount.value = n;
    }

    // --- the lantern on the bow lights the water a little
    const model = boat && boat.model, lamp = model && model.light;
    if (lamp) { lamp.getWorldPosition(_v); u.uLamp.value.set(_v.x, _v.y, _v.z, lamp.intensity); u.uLampColor.value.copy(lamp.color); }
    else u.uLamp.value.w = 0;

    // --- the living water round the boat
    if (boat) {
      if (!this.bound) {                                 // the first frame in a newly bound realm: its own preparations
        this.bound = true;
        const list = this.path && this.binders.get(this.path);
        if (this.traceWanted && this.path && !this.trace.active) this.layTrace();
        if (list) for (const fn of list) { try { fn(this); } catch (err) { console.error('water: an onBind function threw', err); } }
      }
      this.sim.setSize(P.rippleSize);
      // paddle strokes leave paired swirls, one side then the other. (Only for a boat with no rower aboard: her oar
      // works the water itself, where its blade really is: src/engine/rower.js.)
      const input = engine.input, throttle = input ? input.throttle : 0;
      if (Math.abs(throttle) > 0.05 && !(boat.model && boat.model.rower)) {
        this.paddle.next -= dt;
        if (this.paddle.next <= 0) {
          this.paddle.next = (boat.speed > 4.2 ? 1.15 : 1.5);
          const s = this.paddle.side, fx = -Math.sin(boat.heading), fz = -Math.cos(boat.heading), rx = Math.cos(boat.heading), rz = -Math.sin(boat.heading);
          for (const [ahead, k] of [[0.35, 0.55], [-0.05, 0.4]]) this.sim.ripple(boat.x + fx * ahead + rx * s * 0.82, boat.z + fz * ahead + rz * s * 0.82, k * P.wake, 0.5, true);
          if (this.trace.active && this.traceFloat) this.trace.line(boat.x - fx * 0.1 + rx * s * 0.85, boat.z - fz * 0.1 + rz * s * 0.85, boat.x - fx * 0.1 + rx * s * 0.85, boat.z - fz * 0.1 + rz * s * 0.85, { channel: 'swirl', radius: 0.5, strength: 0.35 * s * Math.sign(throttle) }, true);
          this.paddle.side = -s;
        }
      } else this.paddle.next = Math.min(this.paddle.next, 0.25);
      // a boat lying still breathes on the water (a look's rest): a fine ring from the bow and the stern in turn; under way the wake speaks instead
      if (P.rest > 0) {
        const R = this.rest; R.t -= dt;
        if (R.t <= 0) {
          R.seed = (R.seed * 16807) % 2147483647; R.t = TUNE.rest.every[0] + TUNE.rest.every[1] * R.seed / 2147483647;
          const sp = Math.abs(boat.speed) || 0;
          if (sp < TUNE.rest.slow) { const ahead = R.end * TUNE.rest.ahead; R.end = -R.end; this.sim.ripple(boat.x - Math.sin(boat.heading) * ahead, boat.z - Math.cos(boat.heading) * ahead, P.rest * (1 - sp / TUNE.rest.slow), TUNE.rest.radius, true); }
        }
      }
      cam.getWorldDirection(_v);
      this.sim.step(dt, boat, { wake: P.wake, life: P.rippleLife, speed: P.rippleSpeed, rain: P.rain, rainStrength: P.rainStrength, frontRain: P.frontRain, lookX: _v.x, lookZ: _v.z });
      const sim = this.sim, f = sim.fine, w = sim.wide;
      u.tRipF.value = sim.auxFine; u.tRipW.value = sim.auxWide; u.tRidgeF.value = sim.ridgeFine; u.tRidgeW.value = sim.ridgeWide;
      u.uRipF.value.set(f.win.x, f.win.y, 1 / f.size, sim.n); u.uRipW.value.set(w.win.x, w.win.y, 1 / w.size, sim.n);
      u.uZones.value = Math.min(MAX_ZONES, sim.zones.length);
      shared.tRipple.value = sim.auxWide; shared.uRippleRect.value.set(w.win.x, w.win.y, w.size, w.size);
      // the water round the hull follows the hull (so a swell never comes in over the gunwale)
      if (boat.tilt) {
        u.uWell.value.set(boat.x, boat.z, -Math.sin(boat.heading), -Math.cos(boat.heading));
        u.uWellB.value.set(boat.tilt.position.y, Math.sin(boat.tilt.rotation.x), Math.sin(boat.tilt.rotation.z), 0);
      }
      // --- the trace
      const tr = this.trace;
      if (tr.active) {
        tr.update(dt, { boat, sim, hull: sim.hull, film: P.film, skin: P.skin, touch: P.touch, feed: P.lay, time: this.time });
        u.uFilmB.value.x = tr.flowOffset; u.uFilmLine.value.copy(tr.line0); u.uFilmHalf.value = tr.halfWidth;
      }
      u.tTrace.value = tr.active ? tr.texture : this.blank;
      if (tr.active) u.uTraceRect.value.set(tr.rect.x, tr.rect.y, 1 / tr.rect.z, 1 / tr.rect.w); else u.uTraceRect.value.set(0, 0, 1e-6, 1e-6);
      shared.tTrace.value = tr.active ? tr.texture : this.blank;
      if (tr.active) shared.uTraceRect.value.copy(tr.rect); else shared.uTraceRect.value.set(0, 0, 1, 1);
      u.uSkinB.value.z = tr.active && !tr.float ? 1 : 0;      // (an 8-bit trace keeps standing open water in its second channel: trace channel 'bare')
      // the fine window, the lift and the well, the rain and its zones, the front: as the surface itself has them this frame
      shared.tRippleFine.value = sim.auxFine; shared.uRippleFineRect.value.set(f.win.x, f.win.y, f.size, f.size);
      shared.uWaterWell.value.copy(u.uWell.value); shared.uWaterWellB.value.copy(u.uWellB.value);
      for (let i = 0; i < MAX_ZONES; i++) { shared.uWaterZoneA.value[i].copy(sim.zoneA[i]); shared.uWaterZoneB.value[i].copy(sim.zoneB[i]); }
      shared.uWaterZones.value = u.uZones.value;
    }
    shared.uWaterLift.value.copy(u.uSwellOn.value); shared.uWaterRain.value.copy(u.uRain.value); shared.uWaterFront.value.copy(this.sim.front);

    // --- the lattice: it spreads from where it was struck, stands, then lets go into one ring
    const l = this.lat;
    if (l.on) {
      l.t += dt;
      const fadeT = TUNE.lattice.fade, ringT = TUNE.lattice.ring, hold = l.hold, t = l.t;
      const amount = t < hold ? Math.min(1, t / 0.5) : Math.max(0, 1 - (t - hold) / fadeT);
      const ring = t > hold ? Math.max(0, 1 - (t - hold) / ringT) : 0;
      u.uLattice.value.set(l.x, l.z, l.radius, amount * l.strength);
      u.uLatticeB.value.set(TUNE.lattice.k, TUNE.lattice.speed * t, 1.0 + TUNE.lattice.ringSpeed * Math.max(0, t - hold), ring * ring * l.strength);
      u.uLatticeC.value.set(t, 0, 0, 0);
      u.uLatticeColor.value.copy(l.color).multiplyScalar(TUNE.lattice.gain * l.strength);
      const ph = u.uLatPhase.value; for (let i = 0; i < 8; i++) ph[i] = i * 2.4 + 0.5 * Math.sin(t * 0.55 + i * 1.3);
      if (t > hold + ringT) { l.on = false; u.uLattice.value.w = 0; u.uLatticeB.value.w = 0; }
    } else { u.uLattice.value.w = 0; u.uLatticeB.value.w = 0; }

    // the sheet follows the rider (a swell's grid by whole cells, so its waves never swim)
    cam.getWorldPosition(_v);
    if (this.swellOn) this.mesh.position.set(Math.round(_v.x / this.swellCell) * this.swellCell, 0, Math.round(_v.z / this.swellCell) * this.swellCell);
    else this.mesh.position.set(_v.x, 0, _v.z);
    this.mesh.updateMatrixWorld();
    // realms' own sheets on the water: the water's grid of the moment, where the water's sheet is
    for (let i = 0; i < this.overlays.length; i++) {
      const o = this.overlays[i], geo = this.swellOn ? (o.grid || (o.grid = o.twin(this.swellGeo))) : o.disc;
      if (o.mesh.geometry !== geo) o.mesh.geometry = geo;
      o.mesh.position.copy(this.mesh.position); o.mesh.updateMatrixWorld();
    }
  }

  // ---------------------------------------------------------------------------------------------- reflection
  pass(material, target) {
    const renderer = this.engine.renderer;
    this.passMesh.material = material;
    renderer.setRenderTarget(target);
    renderer.render(this.passScene, this.passCamera);
  }

  /** Render the scene as seen by a camera mirrored below the water plane, then smear it for the streaks. */
  renderReflection() {
    const { renderer, scene, camera } = this.engine, vc = this.virtualCamera, u = this.material.uniforms;
    const prevTarget = renderer.getRenderTarget();
    camera.updateMatrixWorld();
    _camPos.setFromMatrixPosition(camera.matrixWorld);
    {
      const m = camera.matrixWorld.elements;
      u.uCamR.value.set(m[0], m[1], m[2]).normalize(); u.uCamU.value.set(m[4], m[5], m[6]).normalize(); u.uCamF.value.set(-m[8], -m[9], -m[10]).normalize();      // (uPixel: see mesh.onBeforeRender)
    }
    if (_camPos.y <= 0.01) return;
    const shown = this.mesh.visible;
    if (!shown) return;                                    // (the sheet has been hidden, by a realm or a test: no mirror is needed, and it stays hidden)
    // A phone at sixty frames a second (engine.mirrorEvery = 2; docs/build/phone.md): the mirror is drawn every other
    // frame. Nothing below is touched on the frame between: the water goes on reading the mirror it has through the
    // eye that mirror was drawn with (textureMatrix), so what is mirrored stays where it stands in the world; only
    // what moves in the mirror is a sixtieth of a second late.
    const every = this.engine.mirrorEvery || 1;
    this.mirrorTurn = (this.mirrorTurn || 0) + 1;
    if (every > 1 && this.mirrorDrawn && this.mirrorTurn % every) return;
    this.mirrorDrawn = true;
    _rot.extractRotation(camera.matrixWorld);
    _look.set(0, 0, -1).applyMatrix4(_rot).add(_camPos);
    vc.position.set(_camPos.x, -_camPos.y, _camPos.z);
    _target.set(_look.x, -_look.y, _look.z);
    vc.up.set(0, 1, 0).applyMatrix4(_rot); vc.up.y *= -1;
    vc.lookAt(_target);
    vc.near = camera.near; vc.far = camera.far;
    vc.updateMatrixWorld();
    vc.projectionMatrix.copy(camera.projectionMatrix);
    const e = vc.projectionMatrix.elements;
    e[0] /= OVER_X; e[5] /= OVER_Y;                        // look a little wider than the view
    this.textureMatrix.set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1);
    this.textureMatrix.multiply(vc.projectionMatrix).multiply(vc.matrixWorldInverse);
    // oblique near plane, so nothing below the surface is drawn into the reflection
    _plane.setFromNormalAndCoplanarPoint(_n, _v.set(0, 0, 0)).applyMatrix4(vc.matrixWorldInverse);
    _clip.set(_plane.normal.x, _plane.normal.y, _plane.normal.z, _plane.constant);
    _q.x = (Math.sign(_clip.x) + e[8]) / e[0]; _q.y = (Math.sign(_clip.y) + e[9]) / e[5]; _q.z = -1; _q.w = (1 + e[10]) / e[14];
    _clip.multiplyScalar(2 / _clip.dot(_q));
    e[2] = _clip.x; e[6] = _clip.y; e[10] = _clip.z + 1 - 0.003; e[14] = _clip.w;

    const rw = this.reflSize.x, rh = this.reflSize.y, m = this.textureMatrix.elements;
    u.uFocal.value = 0.5 * rh * e[5];
    const ru = this.reachMat.uniforms;
    ru.uDepthInfo.value.set(e[2] / e[0], e[6] / e[5], -e[10], e[14]);
    ru.uPlane.value.set(_plane.normal.x, _plane.normal.y, _plane.normal.z, _plane.constant);
    ru.uInvFocal.value.set(1 / e[0], 1 / e[5]);
    // where upright things point, and the horizon, in the pixels of the reflection
    this.vp.set(m[4] * rw, m[5] * rh, m[7]);
    const ax = m[0] * rw, ay = m[1] * rh, aw = m[3], bx = m[8] * rw, by = m[9] * rh, bw = m[11];
    let lx = ay * bw - aw * by, ly = aw * bx - ax * bw, lz = ax * by - ay * bx;
    const ll = Math.hypot(lx, ly) || 1, sign = (lx * this.vp.x + ly * this.vp.y + lz * this.vp.z) < 0 ? -1 : 1;
    this.line.set(lx / ll * sign, ly / ll * sign, lz / ll * sign);

    const prevShadow = renderer.shadowMap.autoUpdate, prevXr = renderer.xr.enabled;
    this.mesh.visible = false;
    renderer.xr.enabled = false; renderer.shadowMap.autoUpdate = false;
    renderer.setRenderTarget(this.target);
    renderer.state.buffers.depth.setMask(true);
    renderer.clear();
    this.engine.reflecting = true;
    const hooks = this.path && this.mirrorHooks.get(this.path);
    if (hooks) for (let i = 0; i < hooks.length; i++) this.mirrorHook(hooks[i], 'before', vc);
    renderer.render(scene, vc);
    if (hooks) for (let i = hooks.length - 1; i >= 0; i--) this.mirrorHook(hooks[i], 'after', vc);
    this.engine.reflecting = false;
    renderer.xr.enabled = prevXr; renderer.shadowMap.autoUpdate = prevShadow;
    this.mesh.visible = shown;

    // how far away the mirrored things are, then the smears
    this.pass(this.reachMat, this.reach);
    const su = this.smearMat.uniforms;
    let src = this.target.texture;
    for (let i = 0; i < SMEARS.length; i++) {
      const s = SMEARS[i], prevSigma = i ? SMEARS[i - 1].sigma : 0, sg = Math.sqrt(s.sigma * s.sigma - prevSigma * prevSigma) * rh;
      su.tSrc.value = src; su.uStepPx.value = s.step * rh; su.uSigmaPx.value = sg;
      su.uBoost.value = this.boost || 0; su.uFirst.value = i === 0 ? 1 : 0;
      this.pass(this.smearMat, this.smears[i]);
      src = this.smears[i].texture;
    }
    renderer.setRenderTarget(prevTarget);
  }

  /** Every render target and texture the water owns, with its size in bytes (for docs/water.md and the perf probe). */
  memoryReport() {
    const t = this.target, px = t.width * t.height, samples = t.samples || 0, list = [];
    list.push({ name: 'mirror', size: [t.width, t.height], bytes: px * 8 * 1.34 + px * 4 + (samples ? px * samples * (8 + 4) : 0), note: samples ? `${samples}x multisampled` : '' });
    this.smears.forEach((s, i) => list.push({ name: 'smear ' + (i + 1), size: [s.width, s.height], bytes: s.width * s.height * 8 * 1.34 }));
    list.push({ name: 'reach', size: [this.reach.width, this.reach.height], bytes: this.reach.width * this.reach.height * 2 });
    list.push({ name: 'ripples (two windows)', size: [this.sim.n, this.sim.n], bytes: this.sim.memory() });
    list.push({ name: 'wave texture', size: [256, 256], bytes: 256 * 256 * 8 * 1.34 });
    if (this.trace.active) list.push({ name: 'trace', size: [this.trace.width, this.trace.height], bytes: this.trace.memory(), note: this.trace.float ? 'half float' : '8 bit' });
    if (this.swellGeo) list.push({ name: 'swell grid', size: [this.swellGeo.attributes.position.count, 1], bytes: this.swellGeo.attributes.position.array.byteLength + this.swellGeo.index.array.byteLength });
    for (const o of this.overlays) if (o.grid) list.push({ name: "a realm's sheet on the swell's grid", size: [o.grid.attributes.position.count, 1], bytes: o.grid.attributes.position.array.byteLength + o.grid.index.array.byteLength });
    if (this.fleckTex) list.push({ name: 'flecks (light from touch)', size: [512, 512], bytes: 512 * 512 * 4 * 1.34 });
    for (const k in this.skinTex) list.push({ name: `built-in ${k} skin`, size: [512, 512], bytes: 512 * 512 * 4 * 1.34 });
    let total = 0; for (const e of list) total += e.bytes;
    return { list, totalMB: +(total / 1048576).toFixed(1) };
  }

  dispose() {
    this.engine.scene.remove(this.mesh);
    // realm materials that read the water through the shared uniforms must not be left holding freed textures
    const S = this.engine.shared;
    if (S.tRipple && S.tRipple.value === this.sim.auxWide) S.tRipple.value = null;
    if (S.tTrace && (S.tTrace.value === this.blank || S.tTrace.value === this.trace.texture)) S.tTrace.value = null;
    if (S.uSwell) for (const v of S.uSwell.value) v.set(0, 0, 0, 0);
    if (S.tRippleFine && S.tRippleFine.value === this.sim.auxFine) S.tRippleFine.value = null;
    if (S.uWaterLift) { S.uWaterLift.value.x = 0; S.uWaterRain.value.x = 0; S.uWaterZones.value = 0; }
    this.overlays.length = 0;
    this.target.depthTexture.dispose(); this.target.dispose();
    for (const s of this.smears) s.dispose();
    this.reach.dispose();
    this.sim.dispose(); this.trace.dispose();
    this.waveTex.dispose(); this.blank.dispose(); this.grey.dispose();
    if (this.fleckTex) this.fleckTex.dispose();
    for (const k in this.skinTex) this.skinTex[k].dispose();
    for (const m of [this.material, this.smearMat, this.reachMat]) m.dispose();
    this.flatGeo.dispose(); if (this.swellGeo) this.swellGeo.dispose(); this.passMesh.geometry.dispose();
  }
}
