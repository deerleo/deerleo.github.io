// Ribbons: everything long, thin and moved by air or water. The page is docs/life/ribbons.md.
//
//   makeWind(ctx, opts)          one wind (or one current) for an area, with a front that travels and HOLDS. Ribbons,
//                                cloth (src/engine/cloth.js), ropes, smoke and dust all read it, so they agree
//   makeRibbons(ctx, opts)       instanced ribbons with weight: flying silks tethered to mast heads that can slip
//                                them and sail off along a path, strays, pennants and high tails, weed, washing and
//                                cloth streaming under water, kelp that surges with the swell
//   makeHairlines(ctx, opts)     camera-facing lines never thinner than a pixel and a half that draw in along their
//                                length: constellation lines, cracks across ice, gossamer; makeMeteors and makeTrails
//                                are built on it (falling stars, comet tails)
//   makeVeils(ctx, opts)         far curtains of falling snow or rain
//   makePours(ctx, opts)         ropes and sheets of falling liquid (dye from a spout) that twist and break into beads
//
// Every factory takes the realm's ctx first, adds what it makes to the realm, registers its own per-frame work and
// returns { object, ...controls } (docs/life.md). Positions are the realm's own; time is the realm's (ctx.time).
import * as THREE from 'three';
import { WATER_GLSL, waterUniforms } from '../water-final.js';

const TAU = Math.PI * 2;
const col = (c) => (c && c.isColor ? c : new THREE.Color(c ?? '#ffffff'));
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const smooth = (a, b, x) => { if (a === b) return x >= b ? 1 : 0; const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const v3 = (p, out = new THREE.Vector3()) => (p && p.isVector3 ? out.copy(p) : out.set(p[0], p[1], p[2]));

// ------------------------------------------------------------------------------------------------ the realm's clock
// One uniform per realm that carries ctx.time into every shader of the family, so that what the shader draws and what
// the script works out (a landing, a tick, a tail in the water) are the same moment, and everything stops with the ride.
const CLOCKS = new WeakMap();
export function lifeClock(ctx) {
  let c = CLOCKS.get(ctx);
  if (!c) {
    c = { uLifeTime: { value: ctx.time || 0 }, calm: !!ctx.reducedMotion, density: (ctx.quality && ctx.quality.density) || 1 };
    CLOCKS.set(ctx, c);
    ctx.onUpdate(() => { c.uLifeTime.value = ctx.time; c.calm = !!ctx.reducedMotion; });
  }
  return c;
}

/** Keep a spread-out part of a list on lower quality (ctx.quality.density), the same part every time. */
export function thin(ctx, items, exact) {
  const d = (ctx.quality && ctx.quality.density) || 1;
  if (exact || d >= 0.999 || items.length < 3) return items.slice();
  let acc = 0.5; const out = [];
  for (const it of items) { acc += d; if (acc >= 1) { acc -= 1; out.push(it); } }
  return out.length ? out : items.slice(0, 1);
}

// ------------------------------------------------------------------------------------------------ the wind
/**
 * GLSL for anything moved by an area's wind (give the material `wind.uniforms`):
 *   float lifeBreeze(vec2 xz)   the breeze where a thing stands, about 1: slow cat's-paws that travel downwind
 *   float lifeFront(vec2 xz)    0..strength: how much of the travelling front is on that spot now. It rises over the
 *                               leading edge, HOLDS for as long as the wind blows, and falls when the release line passes
 *   uLifeWind.xy                the unit direction the wind blows TO (x, z); uLifeWind.w is the realm's time
 */
export const WIND_GLSL = /* glsl */`
  uniform vec4 uLifeWind;      // xy: unit direction the wind blows to (x, z); z: breeze, 1 = the area's ordinary air; w: the realm's time
  uniform vec4 uLifeWindB;     // x: speed of the breeze, m/s; y: gustiness 0..1; z: calm (1, or 0.5 with reduced motion); w: unused
  uniform vec4 uLifeFront;     // xy: unit direction the front travels; z: where its leading line is, metres along that; w: strength
  uniform vec4 uLifeFrontB;    // x: depth of the leading edge, m; y: where the release line is; z: depth of the release edge; w: overshoot
  uniform vec4 uLifeFrontC;    // x: the front's speed, m/s (the wind's own, behind it); y: the speed of the release line; z, w: unused
  float lifeBreeze(vec2 xz) {
    float along = dot(uLifeWind.xy, xz) - uLifeWindB.x * uLifeWind.w, across = dot(vec2(-uLifeWind.y, uLifeWind.x), xz);
    float g = sin(along * 0.071 + across * 0.023) * 0.5 + sin(along * 0.19 - across * 0.11 + 1.7) * 0.3 + sin(along * 0.033 + 4.1) * 0.2;
    return uLifeWind.z * (1.0 + uLifeWindB.y * g);
  }
  float lifeFront(vec2 xz) {
    float q = dot(uLifeFront.xy, xz), lead = uLifeFront.z - q, rel = uLifeFrontB.y - q;
    float up = smoothstep(0.0, uLifeFrontB.x, lead);
    float over = uLifeFrontB.w * up * exp(-max(lead - uLifeFrontB.x, 0.0) / (uLifeFrontB.x * 1.5 + 0.01));
    return uLifeFront.w * (up + over) * (1.0 - smoothstep(0.0, uLifeFrontB.z, rel));
  }
`;

const WINDS = new WeakMap();
/**
 * One wind for an area (or one current, for things under water). opts:
 *   direction   [x, z] the way it blows TO (default: down the route at its start)
 *   speed       m/s of the ordinary breeze (default 2): how fast its cat's-paws travel
 *   breeze      1 = ordinary air; 0 = dead still; the amount every ribbon, cloth and rope takes its sway from
 *   gustiness   0..1: how much the breeze comes and goes (default 0.35)
 * Returns {
 *   uniforms, glsl                     for your own shaders (smoke, dust): ${WIND_GLSL}, lifeBreeze(), lifeFront()
 *   front({ from, toward, speed, depth, strength, hold, releaseDepth })
 *                                      send a front across the place. from: [x, z] or { s, d } where its line starts;
 *                                      toward: [x, z] the way it runs (default the wind's direction); speed m/s (17);
 *                                      depth: metres of leading edge (8); strength 0..1; hold: seconds the wind goes on
 *                                      blowing behind the front before it drops (Infinity = until release()); the
 *                                      drop then travels the same way at the same speed. releaseDepth: metres over
 *                                      which things come down as the drop passes (default: two seconds' worth of its
 *                                      travel, 34 m at 17 m/s: a gust throws cloth up in half a second, but it only falls)
 *   release({ speed, depth })          the wind drops: what was held comes down in the order it rose (depth as releaseDepth)
 *   settle(level)                      no front in the air: everything held (1) or everything at rest (0), at once
 *   frontAt(x, z), breezeAt(x, z)      the numbers the shaders get, for sound and cues
 *   reached(x, z)                      seconds since the front's leading line passed that spot (negative = not yet)
 *   set({ breeze, speed, gustiness })  change the air (ease it yourself with ctx.stage.tween(wind, 'breeze', ...))
 * }
 */
export function makeWind(ctx, opts = {}) {
  const clock = lifeClock(ctx);
  const h = ctx.path ? ctx.path.at(0) : { tx: 0, tz: -1 };
  const o = { direction: [h.tx, h.tz], speed: 2, breeze: 1, gustiness: 0.35, ...opts };
  const dir = new THREE.Vector2(o.direction[0], o.direction[1]).normalize();
  const U = {
    uLifeWind: { value: new THREE.Vector4(dir.x, dir.y, o.breeze, 0) },
    uLifeWindB: { value: new THREE.Vector4(o.speed, o.gustiness, ctx.reducedMotion ? 0.5 : 1, 0) },
    uLifeFront: { value: new THREE.Vector4(dir.x, dir.y, -1e6, 0) },
    uLifeFrontB: { value: new THREE.Vector4(8, -2e6, 10, 0.18) },
    uLifeFrontC: { value: new THREE.Vector4(0, 0, 0, 0) },
  };
  // the front, on the script's side: a line across the place, travelling
  const F = { nx: dir.x, nz: dir.y, q0: -1e6, speed: 0, t0: 0, strength: 0, depth: 8, relT: Infinity, relSpeed: 0, relDepth: 10, relQ0: -2e6 };
  const leadNow = (t) => F.q0 + F.speed * (t - F.t0);
  const relNow = (t) => (t >= F.relT ? F.relQ0 + F.relSpeed * (t - F.relT) : -2e6);
  const wind = {
    uniforms: U, glsl: WIND_GLSL, direction: dir,
    get breeze() { return U.uLifeWind.value.z; }, set breeze(v) { U.uLifeWind.value.z = v; },
    get speed() { return U.uLifeWindB.value.x; }, set speed(v) { U.uLifeWindB.value.x = v; },
    get gustiness() { return U.uLifeWindB.value.y; }, set gustiness(v) { U.uLifeWindB.value.y = v; },
    set(v = {}) { for (const k of ['breeze', 'speed', 'gustiness']) if (v[k] != null) wind[k] = v[k]; return wind; },
    front(f = {}) {
      const t = ctx.time;
      const toward = f.toward ? new THREE.Vector2(f.toward[0], f.toward[1]).normalize() : dir;
      let ox = 0, oz = 0;
      if (Array.isArray(f.from)) { ox = f.from[0]; oz = f.from[1]; } else if (f.from && f.from.s != null) { const p = ctx.path.point(f.from.s, f.from.d || 0, 0); ox = p.x; oz = p.z; }
      F.nx = toward.x; F.nz = toward.y; F.q0 = toward.x * ox + toward.y * oz; F.speed = f.speed ?? 17; F.t0 = t;
      F.strength = f.strength ?? 1; F.depth = f.depth ?? 8; F.relDepth = f.releaseDepth ?? Math.max(10, F.depth, F.speed * 2);      // cloth is thrown up in half a second; it takes two to fall
      F.relQ0 = F.q0; F.relSpeed = F.speed; F.relT = Number.isFinite(f.hold) ? t + Math.max(0.05, f.hold) : Infinity;
      apply(); return wind;
    },
    release(f = {}) {
      if (F.strength <= 0) return wind;
      if (f.speed != null) F.relSpeed = f.speed; if (f.depth != null) F.relDepth = f.depth;
      // where the drop starts: where the front started; or `from`; or, for a wind that was put in place whole with
      // settle(1) and never had a front, the start of the route
      const at = (p) => (Array.isArray(p) ? F.nx * p[0] + F.nz * p[1] : (() => { const q = ctx.path.point(p.s ?? 0, p.d || 0, 0); return F.nx * q.x + F.nz * q.z; })());
      if (f.from) F.relQ0 = at(f.from);
      else if (!(F.speed > 0)) F.relQ0 = ctx.path ? Math.min(at({ s: 0 }), at({ s: ctx.path.length })) - 20 : -200;      // the windward end
      if (!(F.relSpeed > 0)) F.relSpeed = f.speed ?? 17;
      F.relT = ctx.time; apply(); return wind;
    },
    settle(level = 0) {
      F.speed = 0; F.t0 = ctx.time; F.q0 = level > 0 ? 1e6 : -1e6; F.strength = level; F.relT = Infinity; apply(); return wind;
    },
    frontAt(x, z) {
      const t = ctx.time, q = F.nx * x + F.nz * z, lead = leadNow(t) - q, rel = relNow(t) - q, V = U.uLifeFrontB.value;
      const up = smooth(0, F.depth, lead), over = V.w * up * Math.exp(-Math.max(lead - F.depth, 0) / (F.depth * 1.5 + 0.01));
      return F.strength * (up + over) * (1 - smooth(0, F.relDepth, rel));
    },
    reached(x, z) { return F.speed > 0 ? (leadNow(ctx.time) - (F.nx * x + F.nz * z)) / F.speed : (F.q0 > 0 ? 1e6 : -1e6); },
    breezeAt(x, z) {
      const W = U.uLifeWind.value, B = U.uLifeWindB.value, along = W.x * x + W.y * z - B.x * ctx.time, across = -W.y * x + W.x * z;
      const g = Math.sin(along * 0.071 + across * 0.023) * 0.5 + Math.sin(along * 0.19 - across * 0.11 + 1.7) * 0.3 + Math.sin(along * 0.033 + 4.1) * 0.2;
      return W.z * (1 + B.y * g);
    },
    /** The front itself, to read: where its line is and whether it is held. */
    state: F,
  };
  function apply() {
    const t = ctx.time;
    U.uLifeWind.value.w = t; U.uLifeWindB.value.z = clock.calm ? 0.5 : 1;
    U.uLifeFront.value.set(F.nx, F.nz, leadNow(t), F.strength);
    U.uLifeFrontB.value.x = F.depth; U.uLifeFrontB.value.y = relNow(t); U.uLifeFrontB.value.z = F.relDepth;
    U.uLifeFrontC.value.x = F.speed; U.uLifeFrontC.value.y = F.relSpeed;
  }
  ctx.onUpdate(apply);
  apply();
  if (!WINDS.has(ctx)) WINDS.set(ctx, wind);
  return wind;
}
/** The area's wind: the first one made in this realm (still air if the realm made none). */
export function sharedWind(ctx) { return WINDS.get(ctx) || makeWind(ctx, { breeze: 1 }); }

// ------------------------------------------------------------------------------------------------ ribbons
// What each kind is, in numbers (docs/life/ribbons.md has where they come from). Lengths in metres, angles in radians.
//   segments   [across, along]
//   wave       root, tip: amplitude of the travelling wave at the tether and at the free end (half the height of a
//              wave from trough to crest); length: metres from crest to crest; hz: crests passing a point each second
//   free       the same for a ribbon that has let go and travels: its wave grows toward the end that trails
//   twist      amount: how far it rolls about its own length either way; length: metres over which it does so
//              (never more than 70 degrees in 4 m, whatever is asked)
//   droop      how far below its axis it hangs in ordinary air (a gust straightens it); negative rises (buoyant weed)
//   swing      the whole ribbon swings about its tether: angle either way, period in seconds
//   taper      [gathered root as a share of the length, where the tip begins to narrow, width left at the tip, notch]
//   meander    radians it wanders from side to side in its own plane; ceiling: for things under water, the height
//              they never rise above (default -0.05: what is longer than the water is deep lies along under the surface)
//   stream     for a ribbon on a path: 0 = the whole ribbon follows the path like a train on a line (a loose silk, which
//              goes where the wind goes); above 0 only its HEAD follows the path and the rest streams down the wind from
//              it (a kite's tail: the kite weaves, the tail hangs to leeward of it). The number is the head's own pace
//              as a share of the wind's (0.3): how much of the head's weaving shows as a bend in the tail
const KINDS = {
  // a strip of dyed silk tied by one end to a mast head: long, clean, slow
  silk: { segments: [4, 64], width: 0.8, wave: { root: 0.15, tip: 0.8, length: 7, hz: 0.36 }, free: { root: 0.12, tip: 0.75, length: 8.5, hz: 0.3 }, twist: { amount: 1.1, length: 22 },
    droop: 0.2, swing: { angle: 0.21, period: 11 }, taper: [0.035, 0.97, 0.9, 0.0], backlight: 0.9, edge: 0.22, mottle: 0.3, mirror: true, meander: 0.07, clear: 3, steep: 0.7 },
  // a loose silk that swims on the wind along a path
  stray: { segments: [4, 56], width: 0.9, wave: { root: 0.12, tip: 0.6, length: 8.5, hz: 0.3 }, free: { root: 0.12, tip: 0.75, length: 8.5, hz: 0.3 }, twist: { amount: 1.2, length: 20 },
    droop: 0.2, swing: { angle: 0.15, period: 13 }, taper: [0.02, 0.97, 0.9, 0.0], backlight: 0.9, edge: 0.22, mottle: 0.3, mirror: true, free0: true, meander: 0.07, clear: 3, steep: 0.7 },
  // a short pointed flag at a mast head or on a line
  pennant: { segments: [2, 20], width: 0.55, wave: { root: 0.03, tip: 0.22, length: 2.2, hz: 0.7 }, free: { root: 0.05, tip: 0.2, length: 2.5, hz: 0.5 }, twist: { amount: 0.5, length: 6 },
    droop: 0.35, swing: { angle: 0.18, period: 7 }, taper: [0.0, 0.08, 0.03, 0.0], backlight: 0.6, edge: 0.2, mottle: 0.25, mirror: true },
  // the tail of a kite too high to have a shape: very long, thin, slow
  tail: { segments: [2, 80], width: 0.7, wave: { root: 0.3, tip: 1.6, length: 21, hz: 0.12 }, free: { root: 0.4, tip: 1.6, length: 21, hz: 0.1 }, twist: { amount: 0.9, length: 40 },
    droop: 0.3, swing: { angle: 0.1, period: 23 }, taper: [0.0, 0.5, 0.25, 0.0], backlight: 1.0, edge: 0.1, mottle: 0.15, mirror: false, free0: true, stream: 0.3 },
  // a rag on a cane, a tell-tale: hangs when the air is still, lifts and streams when it blows
  rag: { segments: [2, 8], width: 0.16, wave: { root: 0.01, tip: 0.05, length: 0.5, hz: 1.1 }, free: { root: 0.02, tip: 0.05, length: 0.5, hz: 1 }, twist: { amount: 0.4, length: 2 },
    droop: 1.1, swing: { angle: 0.25, period: 5 }, taper: [0.0, 0.9, 0.7, 0.3], backlight: 0.3, edge: 0.15, mottle: 0.3, mirror: false },
  // river weed streaming from a pile or a stone
  weed: { segments: [2, 8], width: 0.05, wave: { root: 0.006, tip: 0.05, length: 0.42, hz: 0.55 }, free: { root: 0.01, tip: 0.05, length: 0.4, hz: 0.5 }, twist: { amount: 0.8, length: 1.2 },
    droop: 0.12, swing: { angle: 0.22, period: 6 }, taper: [0.0, 0.35, 0.12, 0.0], backlight: 0.25, edge: 0.0, mottle: 0.35, mirror: false, underwater: true, part: 1.6 },
  // long weed rising from a chimney pot or a roof like smoke: buoyant, leaning with the current
  smokeweed: { segments: [2, 14], width: 0.12, wave: { root: 0.03, tip: 0.5, length: 3.2, hz: 0.14 }, free: { root: 0.05, tip: 0.4, length: 3, hz: 0.12 }, twist: { amount: 1.0, length: 5 },
    droop: 0.3, swing: { angle: 0.2, period: 11 }, taper: [0.0, 0.3, 0.08, 0.0], backlight: 0.2, edge: 0.0, mottle: 0.35, mirror: false, underwater: true, part: 2.5 },
  // a frond of kelp: a short stalk and a long tapering blade with a quarter twist, thrown over by every surge
  kelp: { segments: [2, 8], width: 0.3, wave: { root: 0.0, tip: 0.3, length: 3.0, hz: 0.19 }, free: { root: 0.05, tip: 0.2, length: 3, hz: 0.2 }, twist: { amount: 0.8, length: 9 },
    droop: 0.0, swing: { angle: 0.1, period: 9 }, taper: [0.14, 0.78, 0.3, 0.0], backlight: 0.1, edge: 0.3, mottle: 0.4, mirror: false, underwater: true, part: 3.0, meander: 0.12,
    surge: { lean: 1.15, lag: 0.22, period: 7, use: 'swell' } },
  // washing, a curtain out of a window, a lost bolt: cloth under water, pinned by one edge and streaming
  cloth: { segments: [6, 32], width: 2.2, wave: { root: 0.02, tip: 0.22, length: 7.5, hz: 0.11 }, free: { root: 0.1, tip: 0.5, length: 7, hz: 0.1 }, twist: { amount: 0.25, length: 30 },
    droop: 0.02, swing: { angle: 0.06, period: 17 }, taper: [0.0, 1.0, 1.0, 0.0], backlight: 0.3, edge: 0.3, mottle: 0.4, mirror: false, underwater: true, hull: 0.3, ragged: 0.16, meander: 0.16 },
};

const RIB_VERT_PARS = /* glsl */`
  attribute vec3 aAnchor, aColor, aTip;
  attribute vec4 aDir, aShape, aState, aPath;
  uniform vec4 uRibWave;       // the tethered wave: amplitude at the root, at the tip (m), wavelength (m), frequency (Hz)
  uniform vec4 uRibFree;       // the same for a ribbon that travels
  uniform vec4 uRibMore;       // twist either way (rad), over this many metres, droop (rad), swing (rad)
  uniform vec4 uRibTime;       // swing period (s), keep-out round the eye (m), clearance over the boat (m), how far the hull presses it down (m)
  uniform vec4 uRibTaper;      // gathered root, where the tip begins, width left at the tip, notch
  uniform vec4 uRibSurge;      // lean at full surge (rad), the tip's lag (share of a period), period (s), 1 = follow the water's own swell
  uniform vec4 uRibSurgeDir;   // xy: the way a surge of its own runs (x, z); z: how far the hull parts it (m); w: wake sway
  uniform vec4 uRibExtra;      // x: the height nothing of it may rise above (weed never leaves the water); y: sideways meander (rad); z: stream (a tail: how much of its head's way shows in it; 0 = it follows its path like a train)
  uniform sampler2D tRibPath;
  varying vec4 vRib; varying vec3 vRibColor;
  ${WIND_GLSL}
  ${WATER_GLSL}

  // how far the ribbon bends at arc length s (radians), and how far it has rolled about its own length
  void ribWave(vec4 wave, float prof, float s, float ph, float amp, float t, float dir, out float beta, out float psi) {
    float k = 6.2831853 / wave.z, om = 6.2831853 * wave.w * aShape.w;
    float A = mix(wave.x, wave.y, prof * sqrt(prof)) * amp;
    beta = min(A * k, 1.0) * (sin(k * s - dir * om * t + ph) * 0.8 + 0.3 * sin(1.73 * k * s - dir * 1.31 * om * t + ph * 2.7));
    float tw = min(uRibMore.x, RIB_TWIST * uRibMore.y / 7.76);                        // never more than 70 degrees in 4 m
    psi = tw * (sin(6.2831853 * s / uRibMore.y - 0.21 * om * t + ph * 1.9) + 0.4 * sin(3.7 * s / uRibMore.y + 0.13 * om * t + ph * 0.7));
  }
  #ifdef RIB_SURGE
  // the water's to-and-fro where a frond stands, -1..1 each way, the tip a little late
  vec2 ribSurge(vec2 xz, float lag) {
    vec2 S = vec2(0.0); float sum = 1e-4;
    for (int i = 0; i < 3; i++) { vec2 kd = uSwell[i].xy; float kl = length(kd), a = uSwell[i].w; if (kl > 1e-5) { S += kd / kl * a * cos(dot(kd, xz) - uSwell[i].z - lag); sum += abs(a); } }
    float own = sin(6.2831853 * uLifeWind.w / uRibSurge.z - lag - dot(uRibSurgeDir.xy, xz) * 0.11) * 0.8 + 0.2 * sin(6.2831853 * uLifeWind.w / (uRibSurge.z * 2.7) + xz.x * 0.05);
    return mix(uRibSurgeDir.xy * own, S / sum * 1.25, uRibSurge.w);
  }
  #endif

  // ---- tethered: the ribbon is built from its tether outward, one stretch after another, each turned by the wave.
  // Every stretch keeps its length, so the ribbon never stretches and its free end is thrown about by what the
  // rest of it does.
  vec3 ribAnchored(float sig, float gust, float breeze, out vec3 T, out vec3 W) {
    float L = aDir.w, ph = aShape.y * 6.2831853, t = uLifeWind.w;
    vec3 a0 = normalize(aDir.xyz);
    vec3 lee = vec3(uLifeWind.x, 0.0, uLifeWind.y);
    vec3 g = vec3(0.0, -1.0, 0.0) + a0 * a0.y; float gl = length(g);                 // the way it would fall
    g = gl > 0.35 ? g / gl : normalize(lee - a0 * dot(lee, a0) + vec3(1e-4, 0.0, 0.0));
    float droop = uRibMore.z * clamp(1.5 - 0.5 * breeze, 0.4, 1.6) * (1.0 - 0.75 * min(gust, 1.0));
    float sw = uRibMore.w * sin(6.2831853 * t / (uRibTime.x * (0.8 + 0.4 * fract(ph * 3.3))) + ph * 5.1) * uLifeWindB.z;
    vec3 a = a0 * cos(droop) + g * sin(droop);
    vec3 e2 = normalize(cross(g, a0)), e3 = cross(a, e2);
    a = a * cos(sw) + e2 * sin(sw); e2 = cross(e3, a);
    #ifdef RIB_PART
      // the hull parts what stands in its way: lean away from the boat, the more the nearer the tip
      vec2 away = aAnchor.xz - uBoat.xz; float ad = length(away);
      float press = smoothstep(uRibSurgeDir.z, uRibSurgeDir.z * 0.3, ad);
      vec3 push = vec3(away.x, 0.0, away.y) / max(ad, 0.05) * press;
    #endif
    float amp = aShape.z * (0.75 + 0.25 * breeze) * (1.0 - 0.4 * min(gust, 1.0)) * uLifeWindB.z;
    float segs = float(RIB_SEGS), ds = L / segs, want = sig * segs;
    vec3 p = aAnchor; float beta, psi;
    for (int i = 0; i <= RIB_SEGS; i++) {
      float fi = float(i), w = min(1.0, want - fi);
      bool last = w <= 0.0;                                                          // the last turn only finds the frame at the point itself
      float s = last ? sig * L : (fi + 0.5 * w) * ds, sg = s / L;
      vec3 ax = a, b2 = e2, b3 = e3;
      #ifdef RIB_SURGE
        vec2 S = ribSurge(aAnchor.xz, uRibSurge.y * 6.2831853 * sg + ph * 0.35);
        #ifdef RIB_PART
          S += push.xz * 1.4;
        #endif
        float lean = uRibSurge.x * min(length(S), 1.3) * (0.3 + 0.7 * smoothstep(0.0, 0.5, sg)) * uLifeWindB.z;
        float sl = length(S); vec3 sd = vec3(S.x, 0.0, S.y) / max(sl, 1e-3);
        ax = normalize(a * cos(lean) + sd * sin(lean));
        // the blade turns its face to the water that pushes it
        vec3 bc = cross(vec3(0.0, 1.0, 0.0), ax); if (dot(bc, e2) < 0.0) bc = -bc;
        b2 = normalize(mix(e2, bc / max(length(bc), 1e-3), smoothstep(0.05, 0.4, sl))); b3 = normalize(cross(ax, b2)); b2 = cross(b3, ax);
      #else
        #ifdef RIB_PART
          ax = normalize(a + push * (1.6 * sg)); b3 = normalize(cross(ax, e2)); b2 = cross(b3, ax);
        #endif
      #endif
      #ifdef RIB_WATER
        // what trails in the water answers the wake: it leans down the slope of every ring that passes
        vec2 slope = waterRipple(aAnchor.xz + ax.xz * s).xy;
        ax = normalize(ax + vec3(slope.x, 0.0, slope.y) * (uRibSurgeDir.w * sg)); b3 = normalize(cross(ax, b2)); b2 = cross(b3, ax);
      #endif
      ribWave(uRibWave, sg, s, ph, amp, t, 1.0, beta, psi);
      beta += 0.05 * min(gust, 1.0) * sin(9.0 * sg * L / uRibWave.z - 4.2 * t + ph * 4.0) * sg;   // a gust shivers it a little
      vec3 n = b3 * cos(psi) + b2 * sin(psi);
      T = ax * cos(beta) + n * sin(beta); W = b2 * cos(psi) - b3 * sin(psi);
      // it wanders from side to side in its own plane, slowly, more toward its free end
      float gam = uRibExtra.y * amp * sg * sin(6.2831853 * s / (uRibWave.z * 2.3) - 2.3 * uRibWave.w * aShape.w * t + ph * 4.3);
      T = normalize(T + W * gam); W = normalize(W - T * dot(W, T));
      #ifdef RIB_CEIL
        // weed and cloth under water never break the surface: what would rise through it turns and lies along under it
        float room = uRibExtra.x - p.y, stepLen = max(last ? ds : ds * w, 1e-4), most = clamp(0.55 * room / stepLen, -1.0, 1.0);
        if (T.y > most) {
          vec3 hz = vec3(T.x, 0.0, T.z) + lee * 0.35; hz = normalize(hz + vec3(1e-4, 0.0, 0.0));
          T = normalize(vec3(hz.x * sqrt(max(1.0 - most * most, 0.0)), most, hz.z * sqrt(max(1.0 - most * most, 0.0))));
          W = normalize(W - T * dot(W, T) + vec3(0.0, 1e-4, 0.0));
        }
      #endif
      if (last) break;
      p += T * (ds * w);
    }
    return p;
  }

  #ifdef RIB_PATHS
  // ---- travelling: the ribbon follows a path the area gave, like a train on a line, with its wave laid over it.
  vec3 ribPathPoint(float u, vec3 anchor, vec3 axis, float L, out vec3 tang) {
    if (u < 0.0) { tang = axis; return anchor + axis * (u + L); }                    // before the path begins: the line the tethered ribbon streamed along
    float n = aPath.y, step = aPath.z, x = u / step, over = 0.0;
    int row = int(aPath.x + 0.5), ni = int(n + 0.5);
    ivec4 idx;
    if (aPath.w > 0.5) { float xi = floor(x); x -= xi; int i1 = int(mod(xi, n)); idx = ivec4((i1 + ni - 1) % ni, i1, (i1 + 1) % ni, (i1 + 2) % ni); }
    else { float lim = n - 1.0001; over = max(x - lim, 0.0) * step; x = min(x, lim); float xi = floor(x); x -= xi; int i1 = int(xi); idx = ivec4(max(i1 - 1, 0), i1, min(i1 + 1, ni - 1), min(i1 + 2, ni - 1)); }
    vec3 p0 = texelFetch(tRibPath, ivec2(idx.x, row), 0).xyz, p1 = texelFetch(tRibPath, ivec2(idx.y, row), 0).xyz, p2 = texelFetch(tRibPath, ivec2(idx.z, row), 0).xyz, p3 = texelFetch(tRibPath, ivec2(idx.w, row), 0).xyz;
    vec3 c1 = p2 - p0, c2 = 2.0 * p0 - 5.0 * p1 + 4.0 * p2 - p3, c3 = -p0 + 3.0 * p1 - 3.0 * p2 + p3;
    tang = normalize(c1 + 2.0 * c2 * x + 3.0 * c3 * x * x);
    return 0.5 * (2.0 * p1 + c1 * x + c2 * x * x + c3 * x * x * x) + tang * over;
  }
  vec3 ribTravelling(float sig, float tether, out vec3 T, out vec3 W) {
    float L = aDir.w, ph = aShape.y * 6.2831853, t = uLifeWind.w, s = sig * L, tau = 1.0 - sig;
    float amp = aShape.z * uLifeWindB.z * aState.w;
    // a wave takes up cloth: every point is drawn toward the leading end by what the waves ahead of it have taken up
    float k = 6.2831853 / uRibFree.z, om = 6.2831853 * uRibFree.w * aShape.w, a0 = uRibFree.x * amp, b = (uRibFree.y - uRibFree.x) * amp;
    float prof = tau * sqrt(tau), A = a0 + b * prof, phi = k * s + om * t + ph;
    float took = 0.25 * k * k * L * (a0 * a0 * tau + 0.8 * a0 * b * tau * tau * sqrt(tau) + 0.25 * b * b * tau * tau * tau * tau);
    float u = aState.x - L + s + took - 0.125 * A * A * k * sin(2.0 * phi);
    vec3 axis = normalize(aDir.xyz); vec3 gdn = vec3(0.0, -1.0, 0.0) + axis * axis.y; float gl = length(gdn);
    axis = gl > 0.35 ? normalize(axis * cos(uRibMore.z) + gdn / gl * sin(uRibMore.z)) : axis;
    vec3 tp; vec3 p;
    if (uRibExtra.z > 0.0) {
      // a tail: only its head follows the path (a kite weaving on its line). The rest is carried down the wind from
      // it, hanging a little below level: each point is where the head was when the air now at that point left it. So
      // the head's weaving runs down the tail as one long slow bend, and the tail never draws its own path in the sky
      float back = L - s;                                                             // metres behind the head
      p = ribPathPoint(aState.x - back * uRibExtra.z, aAnchor, axis, L, tp);
      vec3 lee = vec3(uLifeWind.x, 0.0, uLifeWind.y) * cos(uRibMore.z) - vec3(0.0, sin(uRibMore.z), 0.0);
      float along = dot(tp, lee), g = uRibExtra.z * along + sqrt(max(1.0 - uRibExtra.z * uRibExtra.z * (1.0 - along * along), 0.2));   // (so that it keeps its length)
      p += lee * (back * g);
      tp = normalize(uRibExtra.z * tp - g * lee);
    } else p = ribPathPoint(u, aAnchor, axis, L, tp);
    vec3 e2 = normalize(cross(vec3(0.0, 1.0, 0.0), tp) + vec3(1e-4, 0.0, 0.0)), e3 = cross(tp, e2);
    float tw = min(uRibMore.x, RIB_TWIST * uRibMore.y / 7.76);
    float psi = tw * (sin(6.2831853 * s / uRibMore.y + 0.21 * om * t + ph * 1.9) + 0.4 * sin(3.7 * s / uRibMore.y - 0.13 * om * t + ph * 0.7));
    vec3 n = e3 * cos(psi) + e2 * sin(psi);
    W = e2 * cos(psi) - e3 * sin(psi);
    float y = A * (sin(phi) * 0.8 + 0.3 * sin(1.73 * k * s + 1.31 * om * t + ph * 2.7)), dy = A * k * (cos(phi) * 0.8 + 0.52 * cos(1.73 * k * s + 1.31 * om * t + ph * 2.7));
    float y2 = 0.4 * A * sin(0.61 * k * s + 0.77 * om * t + ph * 3.3);
    T = normalize(tp + n * dy);
    return p + n * y + W * y2;
  }
  #endif
`;

const RIB_VERT_WORLD = /* glsl */`
  {
    float sig = position.y, across = position.x;
    float L = aDir.w, ph = aShape.y;
    float gust = lifeFront(aAnchor.xz + uLifeFront.xy * (ph - 0.5) * 3.0), breeze = lifeBreeze(aAnchor.xz);
    #ifdef RIB_NOTCH
      if (sig > 0.999) sig -= uRibTaper.w * (1.0 - abs(across)) * aShape.x / max(L, 1e-3);          // a swallow tail
    #endif
    vec3 T, W, P;
    #ifdef RIB_PATHS
      float rel = aState.y;
      if (rel <= 0.0) P = ribAnchored(sig, gust, breeze, T, W);
      else if (rel >= 1.0) P = ribTravelling(sig, 0.0, T, W);
      else { vec3 T2, W2; P = ribAnchored(sig, gust, breeze, T, W); vec3 P2 = ribTravelling(sig, 1.0 - rel, T2, W2); P = mix(P, P2, rel); T = normalize(mix(T, T2, rel)); W = normalize(mix(W, W2, rel)); }
    #else
      P = ribAnchored(sig, gust, breeze, T, W);
    #endif
    float hw = 0.5 * aShape.x * aState.z * pow(smoothstep(0.0, max(uRibTaper.x, 1e-4), sig), 0.6) * mix(1.0, uRibTaper.z, smoothstep(uRibTaper.y, 1.0, sig));
    wp.xyz = P + W * (across * hw);
    wn = cross(T, W);
    #ifdef RIB_HULL
      // cloth that streams under the keel is pressed down by the hull and rises again behind it
      vec2 hb = wp.xz - uBoat.xz; wp.y -= uRibTime.w * smoothstep(3.2, 0.6, length(hb)) * smoothstep(-1.6, -0.1, wp.y);
    #endif
    // never in the rider's face: nothing comes nearer the eye than the keep-out, it is eased round it
    vec3 fromEye = wp.xyz - uCameraPos; float ed = length(fromEye), keep = uRibTime.y;
    if (ed < keep * 3.0 && keep > 0.0) { float e2d = sqrt(sqrt(ed * ed * ed * ed + keep * keep * keep * keep)); wp.xyz = uCameraPos + fromEye * (e2d / max(ed, 1e-4)); }
    // and a ribbon that travels low lifts over the boat instead of crossing it
    if (uRibTime.z > 0.0) { float bd = length(wp.xz - uBoat.xz); wp.y += max(uRibTime.z - wp.y, 0.0) * smoothstep(uRibTime.z * 2.2, uRibTime.z * 0.8, bd); }
    float pr = smoothstep(0.0, 1.0, sig);
    vRibColor = mix(aColor, aTip, smoothstep(0.3, 0.85, sig + 0.12 * sin(across * 2.3 + ph * 40.0)));
    float glow = 0.0;
    #ifdef RIB_SURGE
      vec2 S1 = ribSurge(aAnchor.xz, uRibSurge.y * 6.2831853 * sig + ph * 6.2831853 * 0.35), S0 = ribSurge(aAnchor.xz, uRibSurge.y * 6.2831853 * sig + ph * 6.2831853 * 0.35 + 0.5);
      glow = clamp(1.6 - 3.2 * length(S1), 0.0, 1.0) * smoothstep(0.02, 0.3, length(S1 - S0)) * pr;        // the edges light as it is thrown over: at each reversal
      #ifdef RIB_PART
        { vec2 aw = aAnchor.xz - uBoat.xz; glow = max(glow, smoothstep(uRibSurgeDir.z, uRibSurgeDir.z * 0.3, length(aw)) * pr); }
      #endif
    #endif
    vRib = vec4(across, sig * L, ph, glow);
  }
`;

const RIB_FRAG_PARS = /* glsl */`
  varying vec4 vRib; varying vec3 vRibColor;
  uniform vec4 uRibPaint;      // rolled hem (0..1), uneven dye (0..1), ragged edge (0..1), wet toward the tip (0..1)
  uniform vec3 uRibGlow;
  float ribHash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float ribNoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(ribHash(i), ribHash(i + vec2(1.0, 0.0)), f.x), mix(ribHash(i + vec2(0.0, 1.0)), ribHash(i + vec2(1.0, 1.0)), f.x), f.y); }
`;
const RIB_ALBEDO = /* glsl */`
  {
    float m = ribNoise(vec2(vRib.x * 1.3 + vRib.z * 37.0, vRib.y * 0.21 + vRib.z * 11.0)) * 0.65 + ribNoise(vec2(vRib.x * 4.0 + vRib.z * 5.0, vRib.y * 1.3)) * 0.35;
    albedo = vRibColor * (1.0 - uRibPaint.y * 0.5 + uRibPaint.y * m);
    albedo *= 1.0 - uRibPaint.x * smoothstep(0.8, 0.97, abs(vRib.x));
    #ifdef RIB_RAGGED
      if (abs(vRib.x) > 1.0 - uRibPaint.z * (0.25 + 0.75 * ribNoise(vec2(vRib.y * 0.55 + vRib.z * 13.0, sign(vRib.x) * 3.0)))) discard;      // an edge that wanders: never a ruled rectangle
    #endif
  }
`;
const RIB_LIGHT = /* glsl */`
  glow += uRibGlow * vRib.w * (0.2 + 0.8 * smoothstep(0.35, 0.95, abs(vRib.x)));
`;

function ribbonGeometry(ax, n) {
  const pos = new Float32Array((ax + 1) * (n + 1) * 3), idx = [];
  for (let j = 0; j <= n; j++) for (let i = 0; i <= ax; i++) { const k = (j * (ax + 1) + i) * 3; pos[k] = i / ax * 2 - 1; pos[k + 1] = j / n; pos[k + 2] = 0; }
  for (let j = 0; j < n; j++) for (let i = 0; i < ax; i++) { const a = j * (ax + 1) + i, b = a + 1, c = a + ax + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(idx);
  return g;
}

/** Points of a path made even: [n, step, length, Float32Array of n * 4 (x, y, z, 0)]. Catmull-Rom through the points given. */
function resamplePath(points, loop, maxN, steep = 0) {
  const pts = points.map((p) => v3(p));
  const curve = new THREE.CatmullRomCurve3(pts, !!loop, 'centripetal');
  const len = curve.getLength();
  const n = Math.max(4, Math.min(maxN, Math.ceil(len / 1.5) + 1));
  const sp = curve.getSpacedPoints(loop ? n : n - 1), step = loop ? len / n : len / (n - 1);
  // a loose silk is never upright: where the path given climbs or dives more steeply than `steep` (rise over run),
  // its heights are eased until it does not (its ends stay where they were put)
  if (steep > 0) {
    const most = step * Math.sin(Math.atan(steep));
    for (let it = 0; it < 60; it++) {
      let moved = false;
      for (let i = 0; i < (loop ? n : n - 1); i++) {
        const j = (i + 1) % n, d = sp[j].y - sp[i].y, over = Math.abs(d) - most;
        if (over <= 1e-4) continue;
        const h = 0.5 * over * Math.sign(d), fixI = !loop && i === 0, fixJ = !loop && j === n - 1;
        if (!fixI) sp[i].y += fixJ ? 2 * h : h; if (!fixJ) sp[j].y -= fixI ? 2 * h : h; moved = true;
      }
      if (!moved) break;
    }
  }
  const data = new Float32Array(maxN * 4);
  for (let i = 0; i < n; i++) { const p = sp[i]; data.set([p.x, p.y, p.z, 0], i * 4); }
  return { n, step, length: len, data, loop: !!loop };
}
function pathPoint(P, u, out) {                       // the same curve the shader draws, on the script's side
  const n = P.n; let x = u / P.step, over = 0, i0, i1, i2, i3;
  if (P.loop) { const xi = Math.floor(x); x -= xi; i1 = ((xi % n) + n) % n; i0 = (i1 + n - 1) % n; i2 = (i1 + 1) % n; i3 = (i1 + 2) % n; }
  else { const lim = n - 1.0001; over = Math.max(x - lim, 0) * P.step; x = Math.max(0, Math.min(x, lim)); const xi = Math.floor(x); x -= xi; i1 = xi; i0 = Math.max(i1 - 1, 0); i2 = Math.min(i1 + 1, n - 1); i3 = Math.min(i1 + 2, n - 1); }
  const d = P.data;
  for (let c = 0; c < 3; c++) {
    const p0 = d[i0 * 4 + c], p1 = d[i1 * 4 + c], p2 = d[i2 * 4 + c], p3 = d[i3 * 4 + c];
    const c1 = p2 - p0, c2 = 2 * p0 - 5 * p1 + 4 * p2 - p3, c3 = -p0 + 3 * p1 - 3 * p2 + p3;
    out.setComponent(c, 0.5 * (2 * p1 + c1 * x + c2 * x * x + c3 * x * x * x));
  }
  return out;
}

/**
 * Ribbons. opts:
 *   kind        'silk' | 'stray' | 'pennant' | 'tail' | 'rag' | 'weed' | 'smokeweed' | 'kelp' | 'cloth' (see KINDS above;
 *               any of a kind's values may be given here to override it: segments, width, wave, free, twist, droop,
 *               swing, taper, backlight, edge, mottle, surge, part, hull, ragged, mirror, underwater)
 *   items       [{ at: [x, y, z]      where it is tied (the realm's coordinates). Not needed for a ribbon that only travels
 *                  length, width      metres
 *                  color, tip         its dye, and the dye toward its free end (dip-dyed); hex or THREE.Color
 *                  direction: [x, y, z]  its axis: the way it streams (default: the wind's direction, level; weed: the current)
 *                  phase 0..1, amp, speed   to make neighbours differ (all default to a spread from options.seed)
 *                  path: [[x, y, z], ...], loop, travel: m/s, start: metres    a ribbon that travels from the first frame (strays, tails)
 *                  stops: [{ point: index of one of the path's points (or at: metres along it), seconds }]   it slows, lies
 *                                       with its middle there for that long, and slips off again: lay the path up one side of
 *                                       a line or a roof and down the other, and it drapes itself over it
 *               }]
 *   wind        the wind or current it lives in (default: the realm's shared wind)
 *   paths       how many ribbons may ever travel at once (default: all that were given a path, or 0); release() needs one each
 *   clear       metres: a ribbon that comes low lifts over the boat instead of crossing within this of it (silks and
 *               strays: 3; others 0 = off)
 *   keep        metres: the keep-out round the rider's eye (default 0.7)
 *   glow        the colour its edges light with (kelp), times how bright; default none
 *   onTouch(x, z, kind, i)   called when a travelling ribbon's tail is in the water (it has just written a ring there)
 *   exact, seed, parent
 * Returns {
 *   object, count, material
 *   release(which, { path, speed, delay, loop, ramp })   a tethered ribbon slips its tie and sails off along `path` (points
 *                               from where its free end is now; the first point is added for you). which: an index, a
 *                               list, or 'all' with path: (i, item) => points
 *   gone(which)                 it is no longer there (the state after a release, for a cue's settle)
 *   reset(which)                tied again where it was
 *   set(i, { at, color, tip, amp, speed, width })
 *   head(i, out), tail(i, out)  where its leading and trailing ends are now (Vector3; the centre line, without the wave)
 *   travelling(i)               true while it is under way
 * }
 */
export function makeRibbons(ctx, opts = {}) {
  const { kit } = ctx, clock = lifeClock(ctx);
  const kind = KINDS[opts.kind || 'silk'] || KINDS.silk;
  const o = { clear: 0, ...kind, items: [], wind: null, paths: null, keep: 0.7, glow: null, glowStrength: 1, seed: 7, exact: false, onTouch: null, parent: null, ...opts };
  for (const k of ['wave', 'free', 'twist', 'swing', 'surge']) if (kind[k] && opts[k]) o[k] = { ...kind[k], ...opts[k] };
  const wind = o.wind || sharedWind(ctx);
  const items = thin(ctx, o.items, o.exact), n = items.length, rnd = ctx.rng(o.seed);
  let [ax, segs] = o.segments;
  if (clock.density < 0.7 && segs > 16) segs = Math.round(segs * 0.6);
  const geo = ribbonGeometry(ax, segs);
  const aAnchor = new Float32Array(n * 3), aDir = new Float32Array(n * 4), aShape = new Float32Array(n * 4), aState = new Float32Array(n * 4), aPath = new Float32Array(n * 4), aColor = new Float32Array(n * 3), aTip = new Float32Array(n * 3);
  const want = o.paths != null ? o.paths : items.filter((it) => it.path).length;
  const PW = 128, rows = Math.max(1, Math.min(n, want)), pathData = new Float32Array(PW * rows * 4);
  const pathTex = new THREE.DataTexture(pathData, PW, rows, THREE.RGBAFormat, THREE.FloatType);
  pathTex.minFilter = pathTex.magFilter = THREE.NearestFilter; pathTex.generateMipmaps = false; pathTex.needsUpdate = true;
  const R = items.map(() => ({ path: null, row: -1, relT: Infinity, speed: 0, ramp: 2.5, d0: 0, d: 0, gone: false, lastRing: -1e9 }));
  const freeRows = []; for (let r = rows - 1; r >= 0; r--) freeRows.push(r);
  const wd = wind.direction, tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3(), c1 = new THREE.Color();
  const defaultAxis = () => (o.underwater && o.kind !== 'cloth' && (o.kind === 'smokeweed' || o.kind === 'kelp') ? [0, 1, 0] : [wd.x, 0, wd.y]);
  items.forEach((it, i) => {
    const L = it.length ?? 10, at = it.at || (it.path ? it.path[0] : [0, 0, 0]);
    aAnchor.set([at[0], at[1], at[2]], i * 3);
    const d = v3(it.direction || defaultAxis(), tmp).normalize();
    aDir.set([d.x, d.y, d.z, L], i * 4);
    aShape.set([it.width ?? o.width, it.phase ?? rnd(), it.amp ?? (0.8 + 0.4 * rnd()), it.speed ?? (0.85 + 0.3 * rnd())], i * 4);
    aState.set([0, 0, 1, 1], i * 4);
    c1.copy(col(it.color ?? '#ffffff')); aColor.set([c1.r, c1.g, c1.b], i * 3);
    c1.copy(col(it.tip ?? it.color ?? '#ffffff')); aTip.set([c1.r, c1.g, c1.b], i * 3);
  });
  const attr = (name, arr, size) => { const a = new THREE.InstancedBufferAttribute(arr, size); geo.setAttribute(name, a); return a; };
  const anchorAttr = attr('aAnchor', aAnchor, 3); attr('aDir', aDir, 4); const shapeAttr = attr('aShape', aShape, 4);
  const stateAttr = attr('aState', aState, 4), pathAttr = attr('aPath', aPath, 4), colorAttr = attr('aColor', aColor, 3), tipAttr = attr('aTip', aTip, 3);
  stateAttr.setUsage(THREE.DynamicDrawUsage);
  geo.instanceCount = n;

  const usePaths = want > 0;
  const defines = { RIB_SEGS: segs, RIB_TWIST: '1.2217' };
  if (usePaths) defines.RIB_PATHS = '';
  if (o.surge) defines.RIB_SURGE = '';
  if (o.part) defines.RIB_PART = '';
  if (o.hull) defines.RIB_HULL = '';
  if (o.underwater && (o.wake ?? true)) defines.RIB_WATER = '';
  if (o.underwater && o.ceiling !== false) defines.RIB_CEIL = '';
  if (o.taper[3] > 0) defines.RIB_NOTCH = '';
  if (o.ragged) defines.RIB_RAGGED = '';
  const sd = o.surge && o.surge.direction ? new THREE.Vector2(o.surge.direction[0], o.surge.direction[1]).normalize() : new THREE.Vector2(wd.x, wd.y);
  const U = {
    ...wind.uniforms, ...waterUniforms(ctx.engine),
    uRibWave: { value: new THREE.Vector4(o.wave.root, o.wave.tip, o.wave.length, o.wave.hz) },
    uRibFree: { value: new THREE.Vector4(o.free.root, o.free.tip, o.free.length, o.free.hz) },
    uRibMore: { value: new THREE.Vector4(o.twist.amount, o.twist.length, o.droop, o.swing.angle) },
    // (the keep-out is held by every point of the mesh, so it is made a little larger than asked by what a face can cut across)
    uRibTime: { value: new THREE.Vector4(o.swing.period, o.keep > 0 ? o.keep + 0.3 * Math.max(o.width / ax, Math.max(1, ...items.map((it) => it.length ?? 10)) / segs) : 0, o.clear, o.hull || 0) },
    uRibTaper: { value: new THREE.Vector4(o.taper[0], o.taper[1], o.taper[2], o.taper[3]) },
    uRibSurge: { value: new THREE.Vector4(o.surge ? o.surge.lean : 0, o.surge ? o.surge.lag : 0, o.surge ? o.surge.period : 7, o.surge && o.surge.use === 'swell' ? 1 : 0) },
    uRibSurgeDir: { value: new THREE.Vector4(sd.x, sd.y, o.part || 0, o.wake === false ? 0 : (typeof o.wake === 'number' ? o.wake : 0.9)) },
    uRibExtra: { value: new THREE.Vector4(o.ceiling ?? -0.05, o.meander ?? 0, Math.max(0, Math.min(0.9, o.stream || 0)), 0) },
    tRibPath: { value: pathTex },
    uRibPaint: { value: new THREE.Vector4(o.edge, o.mottle, o.ragged || 0, 0) },
    uRibGlow: { value: col(o.glow || '#000000').clone().multiplyScalar(o.glow ? o.glowStrength : 0) },
  };
  const mat = kit.gouache({
    color: '#ffffff', side: THREE.DoubleSide, brush: 0, backlight: o.backlight, backColor: o.backColor || '#ffffff', steps: o.steps ?? 3, shade: o.shade ?? 1,
    caustics: o.caustics || null,
    extend: { defines, uniforms: U, vertexPars: RIB_VERT_PARS, vertexWorld: RIB_VERT_WORLD, fragmentPars: RIB_FRAG_PARS, albedo: RIB_ALBEDO, light: RIB_LIGHT },
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = 'ribbons:' + (opts.kind || 'silk'); mesh.frustumCulled = false;
  (o.parent || ctx.group).add(mesh);
  if (!o.mirror || o.underwater) ctx.only(mesh, 'direct');

  const setPath = (i, points, loop, steep = o.steep || 0) => {
    const r = R[i];
    if (r.row < 0) { if (!freeRows.length) { console.error(`INVALID_ ribbons: no path left for ribbon ${i}: give makeRibbons a larger 'paths'`); return false; } r.row = freeRows.pop(); }
    const P = resamplePath(points, loop, PW, steep);
    pathData.set(P.data, r.row * PW * 4); pathTex.needsUpdate = true;
    r.path = P; aPath.set([r.row, P.n, P.step, P.loop ? 1 : 0], i * 4); pathAttr.needsUpdate = true;
    return true;
  };
  // where a tethered ribbon's free end rests: the first point of any path it is released on
  const restEnd = (i, out) => {
    const L = aDir[i * 4 + 3]; tmp2.set(aDir[i * 4], aDir[i * 4 + 1], aDir[i * 4 + 2]);
    const gy = -1 + tmp2.y * tmp2.y, gx = tmp2.x * tmp2.y, gz = tmp2.z * tmp2.y, gl = Math.hypot(gx, gy, gz);
    if (gl > 0.35) { const c = Math.cos(o.droop), s = Math.sin(o.droop) / gl; tmp2.set(tmp2.x * c + gx * s, tmp2.y * c + gy * s, tmp2.z * c + gz * s); }
    return out.set(aAnchor[i * 3], aAnchor[i * 3 + 1], aAnchor[i * 3 + 2]).addScaledVector(tmp2, L);
  };
  const list = (which) => (which === 'all' || which == null ? items.map((_, i) => i) : Array.isArray(which) ? which : [which]);
  // A way down the wind for a ribbon that has been let go and was given none: it leaves along the wind, climbs, and
  // wanders to one side and the other, every ribbon in its own way (from the seed), so that a crowd of them is a
  // crowd and never a formation. d: { rise: [lo, hi] metres climbed by the end, wander: metres to either side,
  // reach: metres before it is lost, turn: metres it bears off to the right of the wind by the end (negative: left),
  // floor: the height it does not come below once it is 25 m on its way }
  const driftPath = (end, d, own) => {
    const D = { rise: [10, 45], wander: 22, reach: 420, turn: 0, floor: -1e9, ...d };
    const a = own() * 2 - 1, b = own() * 2 - 1, ph = own() * TAU, rise = D.rise[0] + (D.rise[1] - D.rise[0]) * own(), hump = (own() - 0.5) * 0.6;
    return [0.07, 0.19, 0.38, 0.66, 1].map((f) => {
      const dist = f * D.reach, lat = D.wander * (a * f + b * Math.sin(Math.PI * 1.5 * f + ph) * Math.min(1, f * 4)) + D.turn * f * f;
      const y = Math.max(end.y + rise * Math.pow(f, 0.8) + hump * rise * Math.sin(Math.PI * f), dist > 25 ? D.floor : -1e9);
      return [end.x + wd.x * dist - wd.y * lat, y, end.z + wd.y * dist + wd.x * lat];
    });
  };
  const speedScale = () => (clock.calm ? 0.7 : 1);

  const api = {
    object: mesh, material: mat, count: n, wind,
    release(which, r = {}) {
      const all = list(which).filter((i) => i >= 0 && i < n);
      // one after another from the windward end: the wind reaches those ties first
      if (r.stagger) all.sort((p, q) => (aAnchor[p * 3] * wd.x + aAnchor[p * 3 + 2] * wd.y) - (aAnchor[q * 3] * wd.x + aAnchor[q * 3 + 2] * wd.y));
      all.forEach((i, rank) => {
        const end = restEnd(i, new THREE.Vector3()), own = ctx.rng((o.seed || 7) * 131 + i * 17 + 5);
        let pts = typeof r.path === 'function' ? r.path(i, items[i]) : r.path;
        if (!pts || !pts.length) pts = driftPath(end, { ...(r.drift && r.drift !== true ? r.drift : {}) }, own);
        // the path begins where the free end is and leaves along the line the ribbon lies on
        const lead = end.clone().addScaledVector(tmp.set(aDir[i * 4], aDir[i * 4 + 1], aDir[i * 4 + 2]), Math.min(6, aDir[i * 4 + 3] * 0.3));
        if (!setPath(i, [end, lead, ...pts], false)) return;
        const rec = R[i], sp = r.speed;
        rec.relT = ctx.time + (typeof r.delay === 'function' ? r.delay(i) : (r.delay || 0)) + (r.stagger ? r.stagger * (rank + 0.7 * own()) / Math.max(1, all.length) : 0);
        rec.speed = typeof sp === 'function' ? sp(i) : Array.isArray(sp) ? sp[0] + (sp[1] - sp[0]) * own() : (sp ?? 10);
        rec.ramp = r.ramp ?? 3; rec.d0 = 0; rec.gone = false;
      });
      return api;
    },
    gone(which) { for (const i of list(which)) { if (i < 0 || i >= n) continue; R[i].gone = true; R[i].relT = Infinity; aState[i * 4 + 2] = 0; if (R[i].row >= 0) { freeRows.push(R[i].row); R[i].row = -1; R[i].path = null; } } stateAttr.needsUpdate = true; return api; },
    reset(which) { for (const i of list(which)) { if (i < 0 || i >= n) continue; const r = R[i]; r.gone = false; r.relT = Infinity; r.d = 0; if (!items[i].path && r.row >= 0) { freeRows.push(r.row); r.row = -1; r.path = null; } aState.set([0, 0, 1, 1], i * 4); } stateAttr.needsUpdate = true; return api; },
    set(i, v = {}) {
      if (v.at) { aAnchor.set(v.at, i * 3); anchorAttr.needsUpdate = true; }
      if (v.color) { c1.copy(col(v.color)); aColor.set([c1.r, c1.g, c1.b], i * 3); colorAttr.needsUpdate = true; if (!v.tip && !items[i].tip) { aTip.set([c1.r, c1.g, c1.b], i * 3); tipAttr.needsUpdate = true; } }
      if (v.tip) { c1.copy(col(v.tip)); aTip.set([c1.r, c1.g, c1.b], i * 3); tipAttr.needsUpdate = true; }
      if (v.width != null) aShape[i * 4] = v.width; if (v.amp != null) aShape[i * 4 + 2] = v.amp; if (v.speed != null) aShape[i * 4 + 3] = v.speed;
      shapeAttr.needsUpdate = true; return api;
    },
    travelling(i) { const r = R[i]; return !r.gone && !!r.path && ctx.time >= r.relT; },
    head(i, out = new THREE.Vector3()) { const r = R[i]; return r.path && ctx.time >= r.relT ? pathPoint(r.path, r.d, out) : restEnd(i, out); },
    tail(i, out = new THREE.Vector3()) {
      const r = R[i], L = aDir[i * 4 + 3];
      if (r.path && ctx.time >= r.relT && r.d >= L) return pathPoint(r.path, r.d - L, out);
      return out.set(aAnchor[i * 3], aAnchor[i * 3 + 1], aAnchor[i * 3 + 2]);
    },
  };

  // ribbons that travel from the first frame
  items.forEach((it, i) => {
    if (!it.path) return;
    if (!setPath(i, it.path, !!it.loop, it.stops || it.steep === false ? 0 : (it.steep ?? o.steep ?? 0))) return;      // (what drapes over a rail climbs it: no limit)
    const r = R[i], L = aDir[i * 4 + 3];
    r.relT = 0; r.speed = it.travel ?? 4; r.ramp = 0; r.d0 = (it.start ?? 0) + L; r.stopState = null;
    // a stop is given as metres along the path, or as one of the path's own points: the ribbon's middle comes to rest there
    r.stops = it.stops ? it.stops.map((st) => {
      if (st.point == null) return st;
      const P = r.path, q = v3(it.path[st.point], new THREE.Vector3()); let best = 0, bd = Infinity;
      for (let k = 0; k < P.n; k++) { const d2 = (P.data[k * 4] - q.x) ** 2 + (P.data[k * 4 + 1] - q.y) ** 2 + (P.data[k * 4 + 2] - q.z) ** 2; if (d2 < bd) { bd = d2; best = k; } }
      return { ...st, at: best * P.step + L / 2 };
    }) : null;
    aState.set([r.d0, 1, 1, 1], i * 4);
  });

  ctx.onUpdate((dt) => {
    const t = ctx.time; let dirty = false;
    for (let i = 0; i < n; i++) {
      const r = R[i];
      if (r.gone || !r.path || t < r.relT) continue;
      const tau = t - r.relT, v = r.speed * speedScale();
      let d, wave = 1;
      if (r.stops) {
        // a stray that drapes itself over something for a while and slips off again: it slows, lies, and goes on
        const st = r.stopState || (r.stopState = { d: r.d0, v, wait: 0, k: 0 });
        const stop = r.stops[st.k % r.stops.length], lap = r.path.loop ? r.path.length : Infinity;
        const at = stop.at + (r.path.loop ? Math.floor(st.k / r.stops.length) * lap : 0), left = at - st.d;
        let target = v;
        if (st.wait > 0) { target = 0; st.wait -= dt; if (st.wait <= 0) st.k++; }
        else if (left < 8 && left > -1) { target = v * Math.max(0.04, left / 8); if (left < 0.25) st.wait = stop.seconds ?? 20; }
        st.v += (target - st.v) * (1 - Math.exp(-dt * 1.6)); st.d += st.v * dt; d = st.d; wave = 0.25 + 0.75 * clamp01(st.v / Math.max(v, 1e-3));
      } else d = r.d0 + (r.ramp > 0 && tau < r.ramp ? v * tau * tau / (2 * r.ramp) : v * (tau - r.ramp / 2));
      r.d = d;
      const k = i * 4, rel = r.ramp > 0 ? smooth(0, Math.max(0.5, r.ramp * 0.8), tau) : 1;
      // far past the end of its path a ribbon is gone for good (the fog has had it long before)
      if (!r.path.loop && d > r.path.length + aDir[k + 3] + 400) { api.gone(i); continue; }
      aState[k] = d; aState[k + 1] = rel; aState[k + 3] = wave; dirty = true;
      // a tail in the water writes on it
      if (t - r.lastRing > 0.16) {
        const L = aDir[k + 3], uTail = d - L;
        if (uTail >= 0) {
          pathPoint(r.path, uTail + L * 0.06, tmp);
          if (tmp.y < 0.08) { r.lastRing = t; ctx.water.ripple(tmp.x, tmp.z, 0.22, 0.3); if (o.onTouch) o.onTouch(tmp.x, tmp.z, 'tail', i); }
        }
      }
    }
    if (dirty) stateAttr.needsUpdate = true;
  });
  return api;
}

// ------------------------------------------------------------------------------------------------ hairlines
/**
 * Lines of light or ink that always face the eye, never thinner than a pixel and a half however far away, and that
 * draw in along their length. One draw call for all of them. opts:
 *   lines       [{ points: [[x, y, z], ...]   two or more
 *                  color, tip          colour at its start and at its end (default the same)
 *                  width               metres at its thickest (it is never drawn thinner than `minPixels`)
 *                  taper               0..1: how much thinner its end is than its start (a meteor's tail)
 *                  nose                0..1: the share of its length over which it widens from a point at its start (a comet's head)
 *                  shown               false = not drawn until draw() }]
 *   color, width, minPixels (1.5), intensity (1; above 1 it blooms)
 *   additive    true: light (stars, meteors, gossamer against the sun); false: ink (a crack across ice)
 *   against     0..1: lit only when seen against the key light (gossamer); 0 = always
 *   sag         metres a line may sway sideways at its middle (gossamer); gap: share of each end left undrawn (0.02 stops a
 *               constellation line short of its stars)
 *   fog         0..1 how much of the realm's fog it takes (the veil always hides it)
 *   underwater  drawn before the water; mirror: false to leave it out of the reflection
 *   segments    room for this many straight pieces in all (default: what the lines given need)
 * Returns {
 *   object, count
 *   draw(i, seconds, { from })    line i draws itself in along its length (from: 'start' | 'end')
 *   fade(i, seconds)              and goes out the same way it came
 *   show(i, on)                   at once
 *   setPoints(i, points)          move it (the same number of points): a constellation whose stars move
 *   setColor(i, color, tip)
 *   point(i, k, out)              where its k-th point is
 * }
 */
export function makeHairlines(ctx, opts = {}) {
  const clock = lifeClock(ctx), sh = ctx.engine.shared;
  const o = { lines: [], color: '#e6eeff', width: 0.02, minPixels: 1.5, intensity: 1, additive: true, against: 0, sag: 0, gap: 0, fog: 1, underwater: false, mirror: true, segments: 0, parent: null, ...opts };
  const lines = o.lines.map((l) => ({ ...l, n: l.points.length - 1 }));
  const total = Math.max(o.segments, lines.reduce((a, l) => a + l.n, 0), 1);
  const aA = new Float32Array(total * 3), aB = new Float32Array(total * 3), aArc = new Float32Array(total * 4), aTime = new Float32Array(total * 4), aCa = new Float32Array(total * 4), aCb = new Float32Array(total * 4);
  const quad = new THREE.InstancedBufferGeometry();
  quad.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, -1, 0, 1, -1, 0, 0, 1, 0, 1, 1, 0]), 3)); quad.setIndex([0, 1, 2, 2, 1, 3]);
  const mk = (name, arr, size) => { const a = new THREE.InstancedBufferAttribute(arr, size); a.setUsage(THREE.DynamicDrawUsage); quad.setAttribute(name, a); return a; };
  const tA = mk('aA', aA, 3), tB = mk('aB', aB, 3), tArc = mk('aArc', aArc, 4), tTime = mk('aTime', aTime, 4), tCa = mk('aCa', aCa, 4), tCb = mk('aCb', aCb, 4);
  let first = 0; const cA = new THREE.Color(), cB = new THREE.Color();
  const writeLine = (l) => {
    const pts = l.points, n = l.n; let len = 0; const acc = [0];
    for (let k = 0; k < n; k++) { len += Math.hypot(pts[k + 1][0] - pts[k][0], pts[k + 1][1] - pts[k][1], pts[k + 1][2] - pts[k][2]); acc.push(len); }
    cA.copy(col(l.color ?? o.color)); cB.copy(col(l.tip ?? l.color ?? o.color));
    const w = l.width ?? o.width, tp = l.taper ?? 0, nose = l.nose ?? 0;
    const wAt = (f) => w * (1 - tp * f) * (nose > 0 ? Math.pow(Math.min(1, f / nose), 0.7) : 1);             // a pointed head, a tail that thins
    for (let k = 0; k < n; k++) {
      const j = l.first + k, f0 = acc[k] / (len || 1), f1 = acc[k + 1] / (len || 1);
      aA.set(pts[k], j * 3); aB.set(pts[k + 1], j * 3);
      aArc.set([f0, f1, wAt(f0), wAt(f1)], j * 4);
      aCa.set([cA.r + (cB.r - cA.r) * f0, cA.g + (cB.g - cA.g) * f0, cA.b + (cB.b - cA.b) * f0, Math.sin(Math.PI * f0)], j * 4);
      aCb.set([cA.r + (cB.r - cA.r) * f1, cA.g + (cB.g - cA.g) * f1, cA.b + (cB.b - cA.b) * f1, Math.sin(Math.PI * f1)], j * 4);
    }
    l.length = len;
  };
  const setTimes = (l) => { for (let k = 0; k < l.n; k++) aTime.set([l.t0, l.dur, l.f0, l.fdur], (l.first + k) * 4); tTime.needsUpdate = true; };
  for (const l of lines) { l.first = first; first += l.n; l.t0 = l.shown === false ? 1e9 : -1e6; l.dur = 1; l.f0 = 1e9; l.fdur = 1; writeLine(l); setTimes(l); }
  quad.instanceCount = first;
  const mat = new THREE.ShaderMaterial({
    uniforms: { uLifeTime: clock.uLifeTime, uFogColor: sh.uFogColor, uFogDensity: sh.uFogDensity, uVeil: sh.uVeil, uVeilColor: sh.uVeilColor, uCameraPos: sh.uCameraPos, uKeyDir: sh.uKeyDir,
      uView: { value: new THREE.Vector2(1600, 900) }, uLine: { value: new THREE.Vector4(o.minPixels, o.intensity, o.against, o.fog) }, uSag: { value: new THREE.Vector4(o.sag, o.gap, 0, 0) } },
    transparent: true, depthWrite: false, blending: o.additive ? THREE.AdditiveBlending : THREE.NormalBlending, side: THREE.DoubleSide, fog: false,
    vertexShader: /* glsl */`
      attribute vec3 aA, aB; attribute vec4 aArc, aTime, aCa, aCb;
      uniform float uLifeTime; uniform vec2 uView; uniform vec4 uLine, uSag; uniform vec3 uCameraPos, uKeyDir;
      varying vec4 vCol; varying vec3 vInfo;
      void main() {
        float t = uLifeTime;
        float shown = clamp((t - aTime.x) / max(abs(aTime.y), 1e-3), 0.0, 1.0);                                        // how much of the line has drawn itself in
        float f0 = aArc.x, f1 = aArc.y, lo = uSag.y, hi = 1.0 - uSag.y;
        float a = f0, b = f1;
        if (aTime.y >= 0.0) b = min(f1, shown); else a = max(f0, 1.0 - shown);                                         // from its start, or from its far end
        a = clamp(a, lo, hi); b = clamp(b, lo, hi);
        float ka = (a - f0) / max(f1 - f0, 1e-5), kb = (b - f0) / max(f1 - f0, 1e-5);
        // the two ends of what is drawn of this segment, in the eye's space, cut where the segment passes behind the eye
        // (12 cm before it). An end behind the eye used to be pushed forward to that plane where it stood, which drew a
        // line lying behind the boat as a wide band right across the picture (the snow's cracks, 9 November).
        vec3 Pa = mix(aA, aB, ka), Pb = mix(aA, aB, kb);
        float swx = uSag.x * sin(t * 0.7 + aA.x * 3.1 + aA.z * 1.7), swy = uSag.x * 0.5 * sin(t * 0.9 + aA.z * 2.3);
        float sga = mix(aCa.a, aCb.a, ka), sgb = mix(aCa.a, aCb.a, kb);
        Pa.x += swx * sga; Pa.y += swy * sga; Pb.x += swx * sgb; Pb.y += swy * sgb;
        vec3 va = (viewMatrix * vec4(Pa, 1.0)).xyz, vb = (viewMatrix * vec4(Pb, 1.0)).xyz;
        float nearZ = 0.12, da = -va.z - nearZ, db = -vb.z - nearZ;                                                    // above 0: before the eye
        float behind = (da <= 0.0 && db <= 0.0) ? 1.0 : 0.0;
        float cutA = 0.0, cutB = 1.0;
        if (da < 0.0 && db > 0.0) cutA = da / (da - db);
        if (db < 0.0 && da > 0.0) cutB = da / (da - db);
        float kk = mix(cutA, cutB, position.x), k = mix(ka, kb, kk);                                                   // this corner: along what is drawn, and along the whole segment
        vec3 P = mix(Pa, Pb, kk);
        vec3 qa = mix(va, vb, cutA), qb = mix(va, vb, cutB);
        vec4 mv = vec4(mix(qa, qb, position.x), 1.0);
        vec4 c = projectionMatrix * mv, cA = projectionMatrix * vec4(qa, 1.0), cB = projectionMatrix * vec4(qb, 1.0);
        vec2 dir = (cB.xy / cB.w - cA.xy / cA.w) * uView; float dl = length(dir); dir = dl > 1e-6 ? dir / dl : vec2(1.0, 0.0);
        float wm = mix(aArc.z, aArc.w, k), px = wm * 0.5 * uView.y * projectionMatrix[1][1] / max(-mv.z, nearZ);
        float wpx = max(px, uLine.x), thin = min(1.0, px / uLine.x);                                                  // thinner than the floor: fainter, never narrower
        vec2 off = vec2(-dir.y, dir.x) * position.y * (wpx * 0.5 + 1.0) / uView * 2.0 + dir * (position.x * 2.0 - 1.0) * 0.6 / uView * 2.0;
        gl_Position = behind > 0.5 ? vec4(0.0, 0.0, 2.0, 1.0) : c + vec4(off * c.w, 0.0, 0.0);                           // (wholly behind the eye: nothing)
        float fade = 1.0 - clamp((t - aTime.z) / max(aTime.w, 1e-3), 0.0, 1.0);
        float live = step(a + 1e-5, b) * fade * (1.0 - behind);
        float here = mix(a, b, kk);
        float tip = aTime.y >= 0.0 ? smoothstep(0.0, 0.03, shown - here + 0.012) : smoothstep(0.0, 0.03, here - (1.0 - shown) + 0.012);   // a soft point where it is being drawn
        vec3 V = normalize(uCameraPos - P); float ag = mix(1.0, pow(max(dot(V, uKeyDir), 0.0), 3.0), uLine.z);
        vCol = vec4(mix(aCa.rgb, aCb.rgb, k) * uLine.y, live * mix(0.35 + 0.65 * thin, 1.0, step(1.0, thin)) * (0.4 + 0.6 * tip) * ag);
        vInfo = vec3(position.y * (wpx * 0.5 + 1.0), wpx * 0.5, length(mv.xyz));
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uFogColor, uVeilColor; uniform float uFogDensity, uVeil; uniform vec4 uLine;
      varying vec4 vCol; varying vec3 vInfo;
      void main() {
        float edge = 1.0 - smoothstep(max(vInfo.y - 0.75, 0.0), vInfo.y + 0.75, abs(vInfo.x));
        float a = vCol.a * edge; if (a < 0.003) discard;
        float f = (1.0 - exp(-uFogDensity * uFogDensity * vInfo.z * vInfo.z)) * uLine.w;
        ${o.additive ? 'gl_FragColor = vec4(vCol.rgb * a * (1.0 - f) * (1.0 - uVeil), 1.0);' : 'gl_FragColor = vec4(mix(mix(vCol.rgb, uFogColor, f), uVeilColor, uVeil), a * (1.0 - f * 0.6));'}
      }`,
  });
  const mesh = new THREE.Mesh(quad, mat);
  mesh.name = 'hairlines'; mesh.frustumCulled = false; mesh.renderOrder = o.underwater ? -2 : 3;
  const size = new THREE.Vector2();
  mesh.onBeforeRender = (renderer) => { const rt = renderer.getRenderTarget(); if (rt) size.set(rt.width, rt.height); else renderer.getDrawingBufferSize(size); mat.uniforms.uView.value.copy(size); mat.uniformsNeedUpdate = true; };
  (o.parent || ctx.group).add(mesh);
  if (!o.mirror) ctx.only(mesh, 'direct');
  const api = {
    object: mesh, material: mat, count: lines.length, lines,
    /** Add a line later (there must be room: options.segments). Returns its index. */
    add(l) { const L = { ...l, n: l.points.length - 1 }; if (first + L.n > total) { console.error('INVALID_ hairlines: no room for another line (give makeHairlines more segments)'); return -1; } L.first = first; first += L.n; L.t0 = l.shown === false ? 1e9 : -1e6; L.dur = 1; L.f0 = 1e9; L.fdur = 1; lines.push(L); writeLine(L); setTimes(L); quad.instanceCount = first; tA.needsUpdate = tB.needsUpdate = tArc.needsUpdate = tCa.needsUpdate = tCb.needsUpdate = true; api.count = lines.length; return lines.length - 1; },
    draw(i, seconds = 1.5, d = {}) { const l = lines[i]; if (!l) return api; l.t0 = ctx.time; l.dur = (d.from === 'end' ? -1 : 1) * Math.max(0.01, seconds); l.f0 = 1e9; setTimes(l); return api; },
    fade(i, seconds = 1.5) { const l = lines[i]; if (!l) return api; l.f0 = ctx.time; l.fdur = Math.max(0.01, seconds); setTimes(l); return api; },
    show(i, on = true) { const l = lines[i]; if (!l) return api; l.t0 = on ? -1e6 : 1e9; l.dur = 1; l.f0 = 1e9; setTimes(l); return api; },
    setPoints(i, pts) { const l = lines[i]; if (!l || pts.length !== l.points.length) return api; l.points = pts; writeLine(l); tA.needsUpdate = tB.needsUpdate = tArc.needsUpdate = true; return api; },
    setColor(i, c, tip) { const l = lines[i]; if (!l) return api; l.color = c; l.tip = tip ?? c; writeLine(l); tCa.needsUpdate = tCb.needsUpdate = true; return api; },
    point(i, k, out = new THREE.Vector3()) { const p = lines[i].points[k]; return out.set(p[0], p[1], p[2]); },
  };
  return api;
}

/**
 * Falling stars: a pool of streaks, each a head and a tail that thins, in the mirror like everything else. opts:
 *   count (6), color ('#e6eeff'), tip ('#6a509c': what the tail thins to), width (0.5 m at the head, far away), intensity (2.2)
 *   every: [lo, hi] seconds between falls of its own somewhere in `sky` (omit for none: you call fall())
 *   sky: { centre: [x, y, z], radius, height: [lo, hi], spread }   where its own falls happen
 * Returns { object, fall({ from, to, seconds, length }) } - from and to are [x, y, z]; length is the tail in metres.
 */
export function makeMeteors(ctx, opts = {}) {
  const o = { count: 6, color: '#e6eeff', tip: '#6a509c', width: 0.5, intensity: 2.2, every: null, sky: null, seed: 31, ...opts };
  const lines = [];
  for (let i = 0; i < o.count; i++) lines.push({ points: [[0, -500, 0], [0, -500, 0.1], [0, -500, 0.2], [0, -500, 0.3]], color: o.color, tip: o.tip, width: o.width, taper: 0.92, shown: false });
  const H = makeHairlines(ctx, { ...opts, lines, additive: true, minPixels: 1.6, intensity: o.intensity, fog: opts.fog ?? 0.3 });
  const live = lines.map(() => null), rnd = ctx.rng(o.seed), a = new THREE.Vector3(), b = new THREE.Vector3(), d = new THREE.Vector3();
  let next = o.every ? o.every[0] * 0.5 : Infinity;
  const api = {
    object: H.object, lines: H,
    fall(f) {
      const i = live.findIndex((l) => !l); if (i < 0) return api;
      live[i] = { from: v3(f.from).clone(), to: v3(f.to).clone(), t0: ctx.time, dur: f.seconds ?? 1.2, len: f.length ?? 40 };
      return api;
    },
  };
  ctx.onUpdate(() => {
    const t = ctx.time;
    if (t >= next && o.sky) {
      next = t + o.every[0] + rnd() * (o.every[1] - o.every[0]);
      const S = o.sky, ang = rnd() * TAU, r = S.radius * (0.5 + 0.5 * rnd()), h = S.height[0] + rnd() * (S.height[1] - S.height[0]);
      a.set(S.centre[0] + Math.cos(ang) * r, h, S.centre[2] + Math.sin(ang) * r);
      const run = (S.spread ?? 0.35) * r * (0.6 + 0.8 * rnd()), tang = ang + Math.PI / 2 + (rnd() - 0.5);
      b.set(a.x + Math.cos(tang) * run, h - run * (0.35 + 0.5 * rnd()), a.z + Math.sin(tang) * run);
      api.fall({ from: a, to: b, seconds: 0.9 + 0.7 * rnd(), length: run * 0.45 });
    }
    for (let i = 0; i < live.length; i++) {
      const m = live[i]; if (!m) continue;
      const k = (t - m.t0) / m.dur;
      if (k >= 1.25) { live[i] = null; H.show(i, false); continue; }
      // the head runs from one end to the other at very nearly one pace (a falling star does not coast to a stop: it is
      // there and then it is not); the tail grows, follows and burns out behind it
      const head = Math.min(1, k), ease = head * (1.3 - 0.3 * head);
      d.subVectors(m.to, m.from); const run = d.length(); d.normalize();
      const hp = a.copy(m.from).addScaledVector(d, run * ease), tail = Math.min(m.len * Math.min(1, k * 3), run * ease) * (k > 1 ? Math.max(0, 1 - (k - 1) * 4) : 1);
      const pts = lines[i].points;
      for (let j = 0; j < 4; j++) { const q = j / 3; pts[j][0] = hp.x - d.x * tail * q; pts[j][1] = hp.y - d.y * tail * q; pts[j][2] = hp.z - d.z * tail * q; }
      H.setPoints(i, pts); H.show(i, true);
    }
  });
  return api;
}

/**
 * Trails: the light a moving thing leaves behind it for a few seconds (a dolphin's comet). You say where each head is
 * every frame; the trail follows, thinning to nothing. opts: count, points (16 a trail), seconds (3), color, tip, width,
 * intensity, underwater (true), additive (true).
 * Returns { object, move(i, x, y, z), cut(i) } - cut() ends a trail at once (the thing has gone elsewhere).
 */
export function makeTrails(ctx, opts = {}) {
  const o = { count: 1, points: 16, seconds: 3, color: '#3fe0d0', tip: '#0e5e6e', width: 0.3, intensity: 2.5, underwater: true, additive: true, ...opts };
  const K = o.points, lines = [], hist = [];
  for (let i = 0; i < o.count; i++) { lines.push({ points: Array.from({ length: K }, () => [0, -500, 0]), color: o.color, tip: o.tip, width: o.width, taper: 0.97, nose: 0.05 }); hist.push({ t: -1e9, n: 0 }); }
  const H = makeHairlines(ctx, { ...opts, lines, additive: o.additive, intensity: o.intensity, underwater: o.underwater, minPixels: 1.5, fog: opts.fog ?? 1 });
  const gap = o.seconds / (K - 1);
  return {
    object: H.object, lines: H,
    move(i, x, y, z) {
      const pts = lines[i].points, h = hist[i], t = ctx.time;
      if (h.n === 0) { for (const p of pts) { p[0] = x; p[1] = y; p[2] = z; } h.n = 1; h.t = t; }
      else if (t - h.t >= gap) { for (let j = K - 1; j > 1; j--) { pts[j][0] = pts[j - 1][0]; pts[j][1] = pts[j - 1][1]; pts[j][2] = pts[j - 1][2]; } pts[1][0] = pts[0][0]; pts[1][1] = pts[0][1]; pts[1][2] = pts[0][2]; h.t = t; }
      pts[0][0] = x; pts[0][1] = y; pts[0][2] = z;
      H.setPoints(i, pts);
    },
    cut(i) { hist[i].n = 0; for (const p of lines[i].points) { p[0] = 0; p[1] = -500; p[2] = 0; } H.setPoints(i, lines[i].points); },
  };
}

// ------------------------------------------------------------------------------------------------ veils
/**
 * Far curtains of falling snow or rain: tall soft sheets, further off than anything built, whose streaks fall and
 * slant, and which drift across the distance. One draw call. opts:
 *   sheets      [{ at: [x, z]           where its middle stands (the realm's coordinates), or bearing (degrees right of -z)
 *                                       and distance from `centre`
 *                  width, height        metres (300 to 500 wide, 120 to 220 tall)
 *                  turn                 radians: which way it faces (default: toward `centre`)
 *                  alpha, phase }]
 *   centre      [x, z] the place they are seen from (default: the middle of the route)
 *   kind        'snow' (grey wash, slow, slanted 8 degrees) | 'rain' (the air's own colour toward grey-violet, faster, lit at the foot)
 *   color, foot (colour at the foot), footGlow (0..: brightness of the foot's light, for a sea lit from below; drive it)
 *   slant (radians), fall (m/s the streaks fall), drift (m/s the sheets travel), driftDir [x, z], alpha (0.35)
 *   fog         how much of the realm's fog they take (default 0.35: they are weather, they stand in it)
 * Returns { object, material, set({ footGlow, alpha, fall }) }.
 */
export function makeVeils(ctx, opts = {}) {
  const clock = lifeClock(ctx), sh = ctx.engine.shared;
  const rain = opts.kind === 'rain';
  // rain has no colour of its own: it is the air's colour, a little toward grey-violet, so that at night it is all but
  // unseen until something lights its foot, and by day it is a grey darker than the sky. (Give `color` and `foot` to say otherwise.)
  const lookFog = ctx.look && ctx.look.fog && ctx.look.fog.color, air = lookFog && lookFog.isColor ? lookFog : sh.uFogColor.value;
  const toward = (hex, k) => '#' + air.clone().lerp(col(hex), k).getHexString();
  const o = { sheets: [], centre: null, kind: 'snow', color: rain ? toward('#4a4a72', 0.35) : '#7a7194', foot: rain ? toward('#6a6a9a', 0.45) : '#9a92b4', footGlow: 0, footColor: '#3fe0d0', slant: rain ? 0.2 : 0.14, fall: rain ? 9 : 1.2,
    drift: rain ? 1 : 0.5, driftDir: [-1, 0], alpha: rain ? 0.5 : 0.35, fog: 0.35, parent: null, ...opts };
  const mid = ctx.path.at(ctx.path.length * 0.5), centre = o.centre || [mid.x, mid.z];
  const pos = [], uv = [], aux = [], idx = [];
  const SX = 24, SY = 6;
  o.sheets.forEach((s, si) => {
    let x, z;
    if (s.at) { x = s.at[0]; z = s.at[1]; } else { const b = (s.bearing || 0) * Math.PI / 180; x = centre[0] + Math.sin(b) * s.distance; z = centre[1] - Math.cos(b) * s.distance; }
    const w = s.width ?? 400, h = s.height ?? 200, turn = s.turn ?? Math.atan2(centre[0] - x, centre[1] - z), bend = s.bend ?? 0.5, base = pos.length / 3;
    const R = w / Math.max(bend, 1e-3);
    for (let j = 0; j <= SY; j++) for (let i = 0; i <= SX; i++) {
      const u = i / SX, v = j / SY, a = (u - 0.5) * bend;
      const lx = Math.sin(a) * R, lz = (1 - Math.cos(a)) * R;                                  // a shallow arc, hollow side toward the rider
      pos.push(x + Math.cos(turn) * lx + Math.sin(turn) * lz, v * h - 2, z - Math.sin(turn) * lx + Math.cos(turn) * lz);
      uv.push(u, v); aux.push(w, h, s.alpha ?? 1, s.phase ?? ((si * 0.618) % 1));
    }
    for (let j = 0; j < SY; j++) for (let i = 0; i < SX; i++) { const a = base + j * (SX + 1) + i, b = a + 1, c = a + SX + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setAttribute('aAux', new THREE.Float32BufferAttribute(aux, 4)); geo.setIndex(idx);
  const dd = new THREE.Vector2(o.driftDir[0], o.driftDir[1]).normalize();
  const mat = new THREE.ShaderMaterial({
    uniforms: { uLifeTime: clock.uLifeTime, uFogColor: sh.uFogColor, uFogDensity: sh.uFogDensity, uVeil: sh.uVeil, uVeilColor: sh.uVeilColor,
      uColor: { value: col(o.color).clone() }, uFoot: { value: col(o.foot).clone() }, uFootColor: { value: col(o.footColor).clone() },
      uVeilA: { value: new THREE.Vector4(o.slant, o.fall, o.alpha, o.fog) }, uVeilB: { value: new THREE.Vector4(dd.x * o.drift, dd.y * o.drift, o.footGlow, rain ? 1 : 0) }, uCalm: { value: 1 } },
    transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false,
    vertexShader: /* glsl */`
      attribute vec4 aAux; uniform float uLifeTime, uCalm; uniform vec4 uVeilB;
      varying vec2 vUv; varying vec4 vAux; varying float vDist;
      void main() {
        vUv = uv; vAux = aAux;
        vec3 p = position; p.xz += uVeilB.xy * uLifeTime * uCalm;                               // the whole curtain travels
        vec4 mv = viewMatrix * vec4(p, 1.0); vDist = length(mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uColor, uFoot, uFootColor, uFogColor, uVeilColor; uniform float uLifeTime, uFogDensity, uVeil, uCalm; uniform vec4 uVeilA, uVeilB;
      varying vec2 vUv; varying vec4 vAux; varying float vDist;
      float h2(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
      float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h2(i), h2(i + vec2(1.0, 0.0)), f.x), mix(h2(i + vec2(0.0, 1.0)), h2(i + vec2(1.0, 1.0)), f.x), f.y); }
      void main() {
        float w = vAux.x, h = vAux.y, t = uLifeTime * uCalm;
        // streaks: noise drawn out twelve times as long as it is wide, leaning with the wind, falling
        vec2 q = vec2(vUv.x * w + (1.0 - vUv.y) * h * tan(uVeilA.x), vUv.y * h + t * uVeilA.y);
        float s1 = vn(vec2(q.x / 9.0 + vAux.w * 31.0, q.y / 108.0)), s2 = vn(vec2(q.x / 3.2 + vAux.w * 7.0, q.y / 40.0 + 3.0)), s3 = vn(vec2(q.x / 31.0, q.y / 300.0 + vAux.w * 3.0));
        float streak = s1 * 0.5 + s2 * 0.28 + s3 * 0.42;
        // the shape of a shower: ragged along its top, thinning to nothing at its sides, densest low down
        float top = smoothstep(1.0, 0.45 + 0.4 * vn(vec2(vUv.x * 5.0 + vAux.w * 9.0, t * 0.01)), vUv.y);
        float sides = smoothstep(0.0, 0.22, vUv.x) * smoothstep(1.0, 0.78, vUv.x);
        float body = smoothstep(0.25, 0.85, streak + 0.35 * (1.0 - vUv.y)) * top * sides * smoothstep(0.0, 0.015, vUv.y);
        float a = body * uVeilA.z * vAux.z;
        if (a < 0.004) discard;
        float low = smoothstep(0.3, 0.0, vUv.y);
        vec3 c = mix(uColor, uFoot, low) + uFootColor * uVeilB.z * low * low * (0.6 + 0.8 * s2);
        float f = (1.0 - exp(-uFogDensity * uFogDensity * vDist * vDist)) * uVeilA.w;
        gl_FragColor = vec4(mix(mix(c, uFogColor, f), uVeilColor, uVeil), a * (1.0 - uVeil));
      }`,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = 'veils'; mesh.frustumCulled = false; mesh.renderOrder = 2;
  (o.parent || ctx.group).add(mesh);
  ctx.onUpdate(() => { mat.uniforms.uCalm.value = clock.calm ? 0.5 : 1; });
  return {
    object: mesh, material: mat,
    set(v = {}) { if (v.footGlow != null) mat.uniforms.uVeilB.value.z = v.footGlow; if (v.alpha != null) mat.uniforms.uVeilA.value.z = v.alpha; if (v.fall != null) mat.uniforms.uVeilA.value.y = v.fall; },
  };
}

// ------------------------------------------------------------------------------------------------ pours
/**
 * Falling liquid: a rope or a sheet of dye from a spout, a lip or a gutter. It leaves the lip level, falls on its
 * parabola getting thinner as it gets faster, turns about itself as it falls, and breaks into beads in its last
 * third. It thickens and thins over some seconds, and can be opened and shut. One draw call for all. opts:
 *   pours       [{ at: [x, y, z]       the lip
 *                  toward: [x, z]      the way it leaves (default: the wind's direction is NOT used: give it)
 *                  speed               m/s at the lip (0.6: a thread dribbling off; 2: a pour)
 *                  thick, wide         metres at the lip: a rope is as thick as it is wide, a sheet is much wider
 *                  color, to           y it falls to (default 0: the water)
 *                  period, phase       seconds over which it thickens and thins; flow 0..1 }]
 *   glow        0..1 how much it lights when it hangs between the eye and the light (default 0.9)
 *   rings       true: each one rings the water where it lands, at `ringEvery` seconds (0.25)
 *   onTouch(x, z, 'pour', i)
 * Returns { object, flow(i, amount, seconds), landing(i, out) }.
 */
export function makePours(ctx, opts = {}) {
  const { kit } = ctx, clock = lifeClock(ctx);
  const o = { pours: [], glow: 0.9, rings: true, ringEvery: 0.25, onTouch: null, seed: 5, exact: false, parent: null, ...opts };
  const items = thin(ctx, o.pours, o.exact || o.pours.length < 12), n = items.length, rnd = ctx.rng(o.seed);
  const SIDES = 7, SEG = 16;
  const pos = new Float32Array((SIDES + 1) * (SEG + 1) * 3), idx = [];
  for (let j = 0; j <= SEG; j++) for (let i = 0; i <= SIDES; i++) pos.set([i / SIDES, j / SEG, 0], (j * (SIDES + 1) + i) * 3);
  for (let j = 0; j < SEG; j++) for (let i = 0; i < SIDES; i++) { const a = j * (SIDES + 1) + i, b = a + 1, c = a + SIDES + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
  const geo = new THREE.InstancedBufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setIndex(idx);
  const aLip = new Float32Array(n * 4), aGo = new Float32Array(n * 4), aBody = new Float32Array(n * 4), aCol = new Float32Array(n * 3);
  const P = items.map((it, i) => {
    const at = it.at, to = it.to ?? 0, v = it.speed ?? 1.2, d = new THREE.Vector2(...(it.toward || [1, 0])).normalize(), fall = Math.max(0.05, at[1] - to), T = Math.sqrt(2 * fall / 9.81);
    aLip.set([at[0], at[1], at[2], T], i * 4); aGo.set([d.x * v, d.y * v, it.period ?? (6 + 5 * rnd()), it.phase ?? rnd()], i * 4);
    aBody.set([it.thick ?? 0.08, it.wide ?? it.thick ?? 0.08, it.flow ?? 1, rnd()], i * 4);
    const c = col(it.color ?? '#a8324a'); aCol.set([c.r, c.g, c.b], i * 3);
    return { x: at[0] + d.x * v * T, z: at[2] + d.y * v * T, y: to, next: rnd() * o.ringEvery, flow: it.flow ?? 1, tween: null };
  });
  geo.setAttribute('aLip', new THREE.InstancedBufferAttribute(aLip, 4)); geo.setAttribute('aGo', new THREE.InstancedBufferAttribute(aGo, 4));
  const bodyAttr = new THREE.InstancedBufferAttribute(aBody, 4); bodyAttr.setUsage(THREE.DynamicDrawUsage); geo.setAttribute('aBody', bodyAttr);
  geo.setAttribute('aCol', new THREE.InstancedBufferAttribute(aCol, 3)); geo.instanceCount = n;
  const mat = kit.gouache({ color: '#ffffff', brush: 0, backlight: o.glow, shade: 0.7, side: THREE.DoubleSide, extend: {
    uniforms: { uLifeTime: clock.uLifeTime },
    vertexPars: /* glsl */`attribute vec4 aLip, aGo, aBody; attribute vec3 aCol; uniform float uLifeTime; varying vec4 vPour, vPourCol; varying float vPourOn;`,
    vertexWorld: /* glsl */`{
      float T = aLip.w, f = position.y, tau = f * T, t = uLifeTime, ang = position.x * 6.2831853;
      vec3 c = aLip.xyz + vec3(aGo.x * tau, -4.905 * tau * tau, aGo.y * tau);                    // the parabola a falling thing draws
      vec3 vel = vec3(aGo.x, -9.81 * tau, aGo.y); float sp = length(vel), sp0 = length(aGo.xy); vec3 dir = vel / max(sp, 1e-4);
      vec3 side = normalize(cross(dir, vec3(aGo.y, 0.0, -aGo.x) + vec3(1e-4, 0.0, 0.0))); vec3 lat = cross(side, dir);
      // it thickens and thins over some seconds, and what left the lip thick stays thick all the way down
      float born = t - tau, pulse = 0.72 + 0.28 * sin(6.2831853 * (born / aGo.z + aGo.w)) + 0.1 * sin(born * 5.3 + aBody.w * 40.0);
      float thin = sqrt(max(sp0, 0.25) / max(sp, 0.25));                                         // faster, so thinner
      // in its last third it necks and breaks into beads that fall with it (the breaks themselves are cut in the painting)
      float bead = smoothstep(0.5, 0.95, f), wave = 0.5 + 0.5 * sin((born * 9.0 + aBody.w * 20.0) * (1.0 + 0.6 * aBody.w));
      float r = pulse * thin * aBody.z * mix(1.0, 0.8 + 0.45 * wave, bead) * smoothstep(0.0, 0.04, f);
      float tw = born * 3.1 + f * 7.0 * (0.6 + aBody.w);                                         // a rope of liquid turns about itself
      float flat_ = clamp(aBody.y / max(aBody.x, 1e-4) - 1.0, 0.0, 1.0);                         // a sheet keeps most of its width across the lip and does not turn
      float rw = mix(r, pulse * aBody.z * mix(1.0, 0.78, smoothstep(0.0, 1.0, f)) * smoothstep(0.0, 0.04, f), flat_);
      vec2 e = vec2(cos(ang) * aBody.y * 0.5 * rw, sin(ang) * aBody.x * 0.5 * r);
      vec2 er = vec2(e.x * cos(tw) - e.y * sin(tw), e.x * sin(tw) + e.y * cos(tw));
      vec2 ee = mix(er, e, flat_);
      wp.xyz = c + lat * ee.x + side * ee.y;
      wn = lat * cos(ang + mix(tw, 0.0, flat_)) + side * sin(ang + mix(tw, 0.0, flat_));
      vPour = vec4(position.x, f, born, flat_); vPourCol = vec4(aCol, aBody.w); vPourOn = r;
    }`,
    fragmentPars: /* glsl */`varying vec4 vPour, vPourCol; varying float vPourOn;
      float pourN(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); vec2 h = vec2(127.1, 311.7);
        float a = fract(sin(dot(i, h)) * 43758.5), b = fract(sin(dot(i + vec2(1.0, 0.0), h)) * 43758.5), c = fract(sin(dot(i + vec2(0.0, 1.0), h)) * 43758.5), d = fract(sin(dot(i + vec2(1.0, 1.0), h)) * 43758.5);
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y); }`,
    albedo: /* glsl */`{
      float seed = vPourCol.a, streak = 0.82 + 0.3 * sin(vPour.x * 25.0 + vPour.z * 4.0) * sin(vPour.z * 13.0 + vPour.y * 9.0);
      albedo = vPourCol.rgb * streak;
      if (vPourOn < 0.02) discard;
      // a rope of liquid breaks into beads in its last third: the gaps fall with it
      float bead = smoothstep(0.55, 0.97, vPour.y) * (1.0 - vPour.w), cut = 0.5 + 0.5 * sin(vPour.z * (150.0 + 90.0 * seed) + seed * 40.0) * sin(vPour.z * 37.0 + seed * 9.0);
      if (cut < bead * 0.6) discard;
      // a sheet tears into strands as it falls
      float strand = pourN(vec2(vPour.x * 23.0 + seed * 9.0, vPour.z * 1.6 + vPour.y * 0.5));
      if (vPour.w > 0.5 && strand < smoothstep(0.3, 1.0, vPour.y) * 0.6) discard;
    }`,
  } });
  const mesh = new THREE.Mesh(geo, mat); mesh.name = 'pours'; mesh.frustumCulled = false;
  (o.parent || ctx.group).add(mesh);
  ctx.onUpdate((dt) => {
    let dirty = false;
    for (let i = 0; i < n; i++) {
      const p = P[i];
      if (p.tween) { const k = clamp01((ctx.time - p.tween.t0) / p.tween.dur), e = k * k * (3 - 2 * k); p.flow = p.tween.from + (p.tween.to - p.tween.from) * e; aBody[i * 4 + 2] = p.flow; dirty = true; if (k >= 1) p.tween = null; }
      if (!o.rings || p.flow < 0.05) continue;
      p.next -= dt;
      if (p.next <= 0) { p.next = o.ringEvery * (0.6 + 0.8 * rnd()); ctx.water.ripple(p.x, p.z, 0.25 * p.flow + 0.1, 0.25 + aBody[i * 4 + 1] * 0.5); if (o.onTouch) o.onTouch(p.x, p.z, 'pour', i); }
    }
    if (dirty) bodyAttr.needsUpdate = true;
  });
  return {
    object: mesh, material: mat, count: n,
    /** Open or shut pour i: amount 0..1, reached over `seconds` (a thread that thickens to a rope). */
    flow(i, amount, seconds = 2) { const p = P[i]; if (p) p.tween = { from: p.flow, to: amount, t0: ctx.time, dur: Math.max(0.01, seconds) }; },
    landing(i, out = new THREE.Vector3()) { const p = P[i]; return out.set(p.x, p.y, p.z); },
  };
}
