// The living water round the boat: a height-field simulation in two nested windows that follow the boat, read by
// the surface shader in water-final.js (and, through engine.shared.tRipple, by any realm material that wants to know
// how disturbed the water is).
//
//   fine window   512 x 512 over a quarter of the wide one (16 m by default, 3 cm cells): rain rings, pin rings, the
//                 feathering of the bow wave. It leans toward where the rider is looking.
//   wide window   512 x 512 over `rippleSize` metres (64 by default, a realm may ask for up to 96): the body of the
//                 wake, rings that travel, everything a realm material reads.
//
// Deep-water waves are dispersive (long waves outrun short ones, groups travel at half the speed of their crests).
// That law is not local, so every octave of wavelength gets its own field obeying a Klein-Gordon equation tangent to
// it,  h_tt = c2 lap(h) - m2 h  with  c2 = g / 2k,  m2 = g k / 2,  which has the right phase and group speed at that
// octave. The fine window carries two octaves, the wide one four; a disturbance is split between them with
// differences of gaussians. A stone dropped in becomes a train of thin rings; the hull, a moving pressure patch read
// off the boat model's own waterline, leaves a wake with feathered arms and transverse waves between them.
//
// Written into it: the hull, ripple() (any number a frame, one draw), and rain as data: impulses chosen by a hash
// under a mask (everywhere, capsule-shaped zones, a front that sweeps across the water).
//
// What the surface reads, per window:
//   aux    rg = slope of the rippled surface, b = wash (the churned water the hull leaves behind, fading over seconds),
//          a = how lively the water is here, 0..1 and a little more (it lingers a moment). This is engine.shared.tRipple.
//   ridge  rg = the vector from here to the nearest wave crest, in metres, b = how much of a crest it is
import * as THREE from 'three';

const G = 9.81;
const STEP = 1 / 60;                       // the simulation's own clock
const MAX_DROPS = 1024;                    // ripple() calls taken per frame ...
const MAX_SPLASH = 600;                    // ... adding up to this much strength at most (a thousand fish rising at once come to about this)
const SCRUB_EVERY = 120;                   // steps between two scrubbings of the fields (see SCRUB_FRAG)
const OWN_DROPS = 8;                       // ... and a few more places kept for the water's own splashes (the paddle), so that a flood from a realm cannot crowd them out
export const MAX_ZONES = 8;
const N_BY_LEVEL = { high: 512, medium: 384, low: 256 };
const HULL_N = 16;

// Everything that was tuned by eye, in one place.
const TUNE = {
  split: 0.153,                            // gaussian width (in wavelengths) that splits the spectrum at a band
  hullDepth: 0.25,                         // metres the hull presses the water down at wake = 1
  head: 1.2, headKnee: 8.0,               // the head of water motion raises at the stem: metres at full speed, and the speed squared at which it is half that
  // the two windows: seconds liveliness lingers and how much a unit of steepness counts; seconds the wash lingers and
  // how fast it spreads (m2/s); extra damping (1/s) of each octave inside the wash; curvature (per wave number) at which
  // a wave starts to count, and fully counts, as having a crest
  fine: { livelyLife: 0.8, livelyGain: 2.4, washLife: 7.5, washSpread: 0.012, washDamp: [2.5, 1.5, 0, 0], crest: [0.012, 0.11] },
  wide: { livelyLife: 1.15, livelyGain: 2.8, washLife: 9, washSpread: 0.045, washDamp: [2.5, 1.0, 0, 0], crest: [0.035, 0.3] },
  lean: 0.2, leanMax: 3.2, leanRate: 1.5,  // the fine window leans toward where the rider looks: share of its size, metres at most, how fast it follows
  dampBase: 0.17, dampShort: 0.28,         // damping (1/s) of long waves, and what the shortest add, at rippleLife 4
  drop: 0.28,                              // metres of dent per unit of ripple() strength
  dropWidth: 0.22,                         // width of the dent as a share of the radius asked for
  rainSlot: 6,                             // steps between two slots of raindrops
  rainFine: { width: 0.04, depth: 0.012 }, // raindrops in the fine window: metres
  rainWide: { width: 0.1, depth: 0.016 },  // and the heavier ones that reach the wide window
  splash: 0.0,                             // liveliness a raindrop adds of itself (none: its ripples speak for it, or a shower would flood whatever lingers on liveliness)
  carry: 0.8,                              // how much of the fine window's liveliness the wide one takes over
};

// The hull as gaussian pressure blobs. f, r: metres ahead and to the right of the boat's origin, for a hull whose
// waterline runs from f = -1.5 (transom) to f = 1.84 (stem); the table is fitted to the measured waterline of the real
// model. w: width; d: how far the hull presses the water down there at rest (in units of TUNE.hullDepth); head: what
// motion adds, in units of U2 / 2g (water piles up where it meets the stem, is sucked down along the flanks and behind
// the transom); wash, stir: how much churned water and how much liveliness the blob leaves behind when the boat moves.
const HULL = [
  { f: 1.84, r: 0, w: 0.075, d: 1.5, head: 0, wash: 0, stir: 1 }, { f: 1.72, r: 0, w: 0.12, d: 0, head: 0.7, wash: 0, stir: 1 },
  { f: 1.45, r: 0, w: 0.25, d: 0.6, head: 1.0, wash: 0.25, stir: 1 }, { f: 0.8, r: 0, w: 0.30, d: 0.9, head: 0, wash: 0.8, stir: 0.55 },
  { f: 0.2, r: 0, w: 0.36, d: 1.0, head: 0, wash: 1, stir: 0.55 }, { f: -0.5, r: 0, w: 0.40, d: 1.0, head: 0, wash: 1, stir: 0.55 },
  { f: -1.2, r: 0, w: 0.36, d: 0.9, head: 0, wash: 1, stir: 0.55 }, { f: -1.75, r: 0, w: 0.13, d: 0.5, head: 0, wash: 0.6, stir: 0.8 },
  { f: -1.95, r: 0, w: 0.30, d: 0, head: -0.22, wash: 0, stir: 0.8 },
  // the bow wave: a ridge thrown out and back from each side of the stem, and the hollow between it and the flank
  ...[-1, 1].flatMap((side) => [
    { f: 1.5, r: 0.62 * side, w: 0.15, d: 0, head: 0.22, wash: 0.16, stir: 0.7 }, { f: 1.15, r: 0.9 * side, w: 0.17, d: 0, head: 0.18, wash: 0.16, stir: 0.7 },
    { f: 0.8, r: 1.16 * side, w: 0.2, d: 0, head: 0.13, wash: 0.12, stir: 0.6 }, { f: 0.42, r: 1.42 * side, w: 0.24, d: 0, head: 0.08, wash: 0.08, stir: 0.45 },
    { f: 0.35, r: 0.95 * side, w: 0.28, d: 0, head: -0.12, wash: 0, stir: 0 },
  ]),
];
// An oar's blade is a pressure patch as well (blade(), below): what a blade pushing through the water does to it is what
// a hull does, smaller: it heaps the water up before it and leaves a hollow behind, and both run off as waves; and the
// water it has worked is churned. Two patches are kept for blades, after the hull's in the same lists.
const BLADES = 2;
const NH = HULL.length, NB = NH + BLADES;

const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3(), _m = new THREE.Matrix4(), _inv = new THREE.Matrix4();
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const fin = (x) => typeof x === 'number' && Number.isFinite(x);
const lim = (x, d, lo, hi) => { const v = fin(x) ? x : d; return v < lo ? lo : v > hi ? hi : v; };

/**
 * Where the boat meets the water: the hull's waterline read off the boat's own geometry, so the wake starts at the real
 * stem and the wash is as wide as the real hull. Returns { bow, stern, half } in metres ahead of the boat's origin
 * (bow > stern) and the greatest half-width, or null when there is nothing to measure.
 */
export function measureHull(group) {
  const pts = [];
  group.updateMatrixWorld(true);
  _inv.copy(group.matrixWorld).invert();
  const cross = (p, q) => { if ((p.y > 0) !== (q.y > 0)) { const t = p.y / (p.y - q.y); pts.push(p.z + (q.z - p.z) * t, Math.abs(p.x + (q.x - p.x) * t)); } };
  group.traverse((o) => {
    if (!o.isMesh || !o.geometry || !o.geometry.attributes || !o.geometry.attributes.position) return;
    const pos = o.geometry.attributes.position, idx = o.geometry.index, n = idx ? idx.count : pos.count;
    if (n > 90000) return;
    _m.multiplyMatrices(_inv, o.matrixWorld);
    for (let i = 0; i + 2 < n; i += 3) {
      _a.fromBufferAttribute(pos, idx ? idx.getX(i) : i).applyMatrix4(_m);
      _b.fromBufferAttribute(pos, idx ? idx.getX(i + 1) : i + 1).applyMatrix4(_m);
      _c.fromBufferAttribute(pos, idx ? idx.getX(i + 2) : i + 2).applyMatrix4(_m);
      cross(_a, _b); cross(_b, _c); cross(_c, _a);
    }
  });
  if (pts.length < 16) return null;
  let z0 = Infinity, z1 = -Infinity;
  for (let i = 0; i < pts.length; i += 2) { z0 = Math.min(z0, pts[i]); z1 = Math.max(z1, pts[i]); }
  if (!(z1 - z0 > 0.5) || !(z1 - z0 < 30)) return null;
  const widths = new Float32Array(HULL_N).fill(-1);
  for (let i = 0; i < pts.length; i += 2) { const k = Math.round((pts[i] - z0) / (z1 - z0) * (HULL_N - 1)); widths[k] = Math.max(widths[k], pts[i + 1]); }
  let half = 0;
  for (let k = 0; k < HULL_N; k++) if (widths[k] > 0) half = Math.max(half, Math.min(widths[k], 1.2));     // whatever else touches the water, the hull is not wider than this
  if (!(half > 0.05)) return null;
  return { bow: -z0, stern: -z1, half };                  // the bow is toward -z in the boat's frame
}

// ------------------------------------------------------------------------------------------------ shaders
const PASS_VERT = /* glsl */`
  precision highp float;
  in vec3 position;
  out vec2 vUv;
  void main() { vUv = position.xy * 0.5 + 0.5; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

const COMMON = /* glsl */`
  precision highp float;
  precision highp sampler2D;
  uniform float uSig2[BANDS + 1];          // squared widths of the gaussians that cut the spectrum into this window's octaves
  #if BANDS > 2
    #define BVEC vec4
  #else
    #define BVEC vec2
  #endif
  // a gaussian dent of squared width w2 and volume vol, split between the octaves
  BVEC split(float r2, float w2, float vol) {
    float g[BANDS + 1];
    for (int j = 0; j <= BANDS; j++) { float s2 = w2 + uSig2[j]; g[j] = exp(-0.5 * r2 / s2) / s2; }
    #if BANDS > 2
      return vec4(g[0] - g[1], g[1] - g[2], g[2] - g[3], g[3] - g[4]) * vol;
    #else
      return vec2(g[0] - g[1], g[1] - g[2]) * vol;
    #endif
  }
`;
const OUTS = /* glsl */`
  layout(location = 0) out vec4 oS0;
  #if BANDS > 2
    layout(location = 1) out vec4 oS1;
    layout(location = 2) out vec4 oAux;
    layout(location = 3) out vec4 oRidge;
  #else
    layout(location = 1) out vec4 oAux;
    layout(location = 2) out vec4 oRidge;
  #endif
`;

// One step of every octave field of one window. State: (h, v) of two octaves per texture.
const SIM_FRAG = /* glsl */`
  ${COMMON}
  uniform sampler2D tS0, tAux, tOther;
  #if BANDS > 2
    uniform sampler2D tS1;
  #endif
  uniform vec2 uTexel, uOff;
  uniform vec4 uMap;                       // where this water was in the previous window: mat2(uMap) * (uv - 0.5) + uOff
  uniform vec4 uWin;                       // window centre x, z, size, cell size (metres)
  uniform vec4 uOther;                     // the other window: centre x, z, 1 / size, how much of its liveliness to take over
  uniform float uDt;
  uniform vec4 uBand[BANDS];               // c2 / cell2, m2, damping (1/s), wave number
  uniform vec4 uWashDamp;                  // extra damping (1/s) of each octave inside the wash
  uniform vec4 uBlob[${NB}];               // hull blobs: centre x, z at mid-step, and how far they move during the step
  uniform vec4 uBlobP[${NB}];              // width2, volume / 2 pi, wash it leaves, liveliness it leaves
  uniform vec4 uBoat;                      // boat x, z, reach2 of its blobs, wash the hull leaves (0..1)
  uniform vec4 uHull;                      // the hull's waterline: stern x, z, bow x, z
  uniform vec4 uTune;                      // liveliness kept per step, liveliness per unit steepness, wash kept per step, wash diffusion number
  uniform vec4 uRidge;                     // curvature at which a wave counts as having a crest: from, to; half-width of the hull; liveliness of a splash
  uniform vec4 uRain;                      // rain everywhere (rings per m2 per s), cell (m), drop width2, drop volume (0 = no drops this step)
  uniform vec4 uRainB;                     // seed of this slot, chance per unit rate, how far the front gates the rain, -
  uniform vec2 uRainOff;                   // where the grid of this slot sits
  uniform vec4 uFront;                     // the front: normal x, z, offset, 1 / width
  uniform vec4 uZoneA[${MAX_ZONES}];       // rain zones: a capsule from xy to zw ...
  uniform vec4 uZoneB[${MAX_ZONES}];       // ... radius, rate, soft edge, strength
  uniform int uZones;
  in vec2 vUv;
  ${OUTS}

  vec3 hash3(vec2 p) { vec3 q = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973)); q += dot(q, q.yxz + 33.33); return fract((q.xxy + q.yzz) * q.zyx); }
  // rings per square metre per second at a place (x), and how heavy the drops are there (y)
  vec2 rainAt(vec2 p) {
    float gate = mix(1.0, clamp((uFront.z - dot(uFront.xy, p)) * uFront.w + 0.5, 0.0, 1.0), uRainB.z);
    vec2 acc = vec2(uRain.x * gate, uRain.x * gate);
    for (int i = 0; i < ${MAX_ZONES}; i++) {
      if (i >= uZones) break;
      vec2 ab = uZoneA[i].zw - uZoneA[i].xy, ap = p - uZoneA[i].xy;
      float t = clamp(dot(ap, ab) / max(dot(ab, ab), 1e-6), 0.0, 1.0);
      float m = 1.0 - smoothstep(uZoneB[i].x - uZoneB[i].z, uZoneB[i].x + uZoneB[i].z, length(ap - ab * t));
      acc += vec2(uZoneB[i].y, uZoneB[i].y * uZoneB[i].w) * m;
    }
    return vec2(acc.x, acc.x > 1e-5 ? acc.y / acc.x : 1.0);
  }
  float total(vec4 s) { return s.x + s.z; }
  void main() {
    vec2 uv = mat2(uMap.xy, uMap.zw) * (vUv - 0.5) + uOff;
    float inside = step(0.0, uv.x) * step(uv.x, 1.0) * step(0.0, uv.y) * step(uv.y, 1.0);
    vec2 dx = vec2(uTexel.x, 0.0), dy = vec2(0.0, uTexel.y);
    vec2 w = uWin.xy + (vUv - 0.5) * uWin.z;                 // this cell in the world
    float im = 1.0 / uWin.w;

    // the nine cells around this one: the round nine-point laplacian of every octave, and the shape of the whole surface
    vec4 a0 = texture(tS0, uv - dx - dy), a1 = texture(tS0, uv - dy), a2 = texture(tS0, uv + dx - dy);
    vec4 b0 = texture(tS0, uv - dx), s0 = texture(tS0, uv) * inside, b2 = texture(tS0, uv + dx);
    vec4 c0 = texture(tS0, uv - dx + dy), c1 = texture(tS0, uv + dy), c2 = texture(tS0, uv + dx + dy);
    vec4 lap0 = (4.0 * (a1 + b0 + b2 + c1) + a0 + a2 + c0 + c2 - 20.0 * s0) * (inside / 6.0);
    float hLD = total(a0), hD = total(a1), hRD = total(a2), hL = total(b0), hC = total(s0), hR = total(b2), hLU = total(c0), hU = total(c1), hRU = total(c2);
    #if BANDS > 2
      vec4 d0 = texture(tS1, uv - dx - dy), d1 = texture(tS1, uv - dy), d2 = texture(tS1, uv + dx - dy);
      vec4 e0 = texture(tS1, uv - dx), s1 = texture(tS1, uv) * inside, e2 = texture(tS1, uv + dx);
      vec4 f0 = texture(tS1, uv - dx + dy), f1 = texture(tS1, uv + dy), f2 = texture(tS1, uv + dx + dy);
      vec4 lap1 = (4.0 * (d1 + e0 + e2 + f1) + d0 + d2 + f0 + f2 - 20.0 * s1) * (inside / 6.0);
      hLD += total(d0); hD += total(d1); hRD += total(d2); hL += total(e0); hC += total(s1); hR += total(e2); hLU += total(f0); hU += total(f1); hRU += total(f2);
    #endif
    vec2 grad = vec2(2.0 * (hR - hL) + hRU - hLU + hRD - hLD, 2.0 * (hU - hD) + hRU - hRD + hLU - hLD) * (0.125 * im * inside);

    // the crest of a wave: where the surface is level across its line of greatest downward curvature. Stored as the vector
    // from here to that line, so the surface shader can draw it as thin as the screen allows.
    float hxx = (hL + hR - 2.0 * hC) * im * im, hyy = (hD + hU - 2.0 * hC) * im * im, hxy = (hRU - hRD - hLU + hLD) * 0.25 * im * im;
    float tr = 0.5 * (hxx + hyy), df = 0.5 * (hxx - hyy), lam = tr - sqrt(df * df + hxy * hxy);
    vec2 v1 = vec2(hxy, lam - hxx), v2 = vec2(lam - hyy, hxy);
    vec2 ev = dot(v1, v1) > dot(v2, v2) ? v1 : v2;
    ev /= max(length(ev), 1e-9);
    vec2 toCrest = ev * (dot(grad, ev) / max(-lam, 1e-4));
    toCrest *= min(1.0, 3.0 * uWin.w / max(length(toCrest), 1e-6));
    vec2 hb = uHull.zw - uHull.xy, hp = w - uHull.xy;
    float hullDist = length(hp - hb * clamp(dot(hp, hb) / max(dot(hb, hb), 1e-4), 0.0, 1.0));
    // a real crest is a ridge: steeply curved one way, hardly at all the other. Where two trains of waves cross the surface
    // is a field of separate peaks, and those are left dark (they would read as beads and blobs).
    float other = abs(tr + sqrt(df * df + hxy * hxy)), ridge = smoothstep(0.25, 0.65, (-lam - other) / max(-lam + other, 1e-6));
    float crest = smoothstep(uRidge.x, uRidge.y, -lam) * ridge * smoothstep(uRidge.z, uRidge.z + 0.25, hullDist) * inside;

    // the hull: a moving pressure patch. What it adds is the change of its footprint, split between the octaves.
    BVEC src = BVEC(0.0); float foot = 0.0, stirred = 0.0, footB = 0.0, stirredB = 0.0;
    vec2 rb = w - uBoat.xy;
    if (dot(rb, rb) < uBoat.z) {
      for (int i = 0; i < ${NB}; i++) {
        vec2 r = w - uBlob[i].xy; float r2 = dot(r, r), mv = dot(r, uBlob[i].zw) * uBlobP[i].y;
        float g[BANDS + 1];
        for (int j = 0; j <= BANDS; j++) { float s2 = uBlobP[i].x + uSig2[j]; g[j] = exp(-0.5 * r2 / s2) / (s2 * s2); }
        #if BANDS > 2
          src += vec4(g[0] - g[1], g[1] - g[2], g[2] - g[3], g[3] - g[4]) * mv;
        #else
          src += vec2(g[0] - g[1], g[1] - g[2]) * mv;
        #endif
        if (i < ${NH}) {
          foot = max(foot, uBlobP[i].z * exp(-0.22 * r2 / uBlobP[i].x));
          stirred = max(stirred, uBlobP[i].w * exp(-0.5 * r2 / (uBlobP[i].x * 3.0 + 0.05)));
        } else {                                               // a blade: what it churns is two or three times as wide as the patch that pushes (the water round a working blade turns over)
          footB = max(footB, uBlobP[i].z * exp(-0.5 * r2 / (uBlobP[i].x * 6.0 + 0.01)));
          stirredB = max(stirredB, uBlobP[i].w * exp(-0.5 * r2 / (uBlobP[i].x * 6.0 + 0.01)));
        }
      }
    }

    // rain as data: each cell of a grid takes at most one drop per slot of time, wherever the masks allow
    float splash = 0.0;
    if (uRain.w != 0.0) {
      vec2 g = w / uRain.y + uRainOff, id = floor(g), fr = g - id, base = id - step(fr, vec2(0.5));      // (the grid sits elsewhere every slot, so no lattice ever shows)
      for (int j = 0; j < 2; j++) for (int i = 0; i < 2; i++) {
        vec2 cid = base + vec2(float(i), float(j));
        vec3 h = hash3(cid + uRainB.x);
        vec2 at = (cid + 0.25 + 0.5 * h.xy - uRainOff) * uRain.y;
        vec2 rate = rainAt(at);
        float n = rate.x * uRainB.y;                           // drops expected in this cell in this slot
        if (h.z < n) {
          vec2 r = w - at; float r2 = dot(r, r);
          float heavy = rate.y * (0.55 + 0.9 * fract(h.z * 57.3 + h.x)) * sqrt(max(n, 1.0));
          BVEC dr = split(r2, uRain.z, uRain.w * heavy);
          #if BANDS > 2
            src.xy += dr.xy;                                   // (the long octaves never hear a raindrop)
          #else
            src += dr;
          #endif
          splash += heavy * exp(-0.5 * r2 / (uRain.z * 2.0 + uSig2[0]));
        }
      }
    }

    // waves leave through a soft sponge at the rim of the window
    vec2 e = min(vUv, 1.0 - vUv);
    float sponge = 1.0 - smoothstep(0.0, 0.075, min(e.x, e.y)); sponge *= sponge * 10.0;
    float fade = 1.0 - min(1.0, sponge * uDt);
    vec4 a = texture(tAux, uv) * inside;
    float lw = texture(tAux, uv + dx).z + texture(tAux, uv - dx).z + texture(tAux, uv + dy).z + texture(tAux, uv - dy).z - 4.0 * a.z;
    float wash2 = a.z * a.z;

    // churned water swallows short waves: inside the wash the fine ripples die quickly
    vec2 keepA = max(vec2(0.0), 1.0 - (vec2(uBand[0].z, uBand[1].z) + sponge + wash2 * uWashDamp.xy) * uDt);
    vec2 velA = s0.yw * keepA + uDt * (vec2(uBand[0].x, uBand[1].x) * lap0.xz - vec2(uBand[0].y, uBand[1].y) * s0.xz);
    vec2 hgtA = (s0.xz + uDt * velA) * fade + src.xy;
    oS0 = vec4(hgtA.x, velA.x, hgtA.y, velA.y);
    // how steep the waves are here (amplitude times wave number), whatever their phase
    float steep = uBand[0].w * sqrt(hgtA.x * hgtA.x + velA.x * velA.x / (2.0 * uBand[0].y)) + uBand[1].w * sqrt(hgtA.y * hgtA.y + velA.y * velA.y / (2.0 * uBand[1].y));
    #if BANDS > 2
      vec2 keepB = max(vec2(0.0), 1.0 - (vec2(uBand[2].z, uBand[3].z) + sponge + wash2 * uWashDamp.zw) * uDt);
      vec2 velB = s1.yw * keepB + uDt * (vec2(uBand[2].x, uBand[3].x) * lap1.xz - vec2(uBand[2].y, uBand[3].y) * s1.xz);
      vec2 hgtB = (s1.xz + uDt * velB) * fade + src.zw;
      oS1 = vec4(hgtB.x, velB.x, hgtB.y, velB.y);
      steep += uBand[2].w * sqrt(hgtB.x * hgtB.x + velB.x * velB.x / (2.0 * uBand[2].y)) + uBand[3].w * sqrt(hgtB.y * hgtB.y + velB.y * velB.y / (2.0 * uBand[3].y));
    #endif

    // liveliness follows the steepness of the waves and lingers; the hull stirs the water it touches
    float lively = max(a.w * uTune.x, max(min(1.5, steep * uTune.y + splash * uRidge.w), max(uBoat.w * stirred * 0.9, stirredB)));
    if (uOther.w > 0.0) {
      vec2 ouv = (w - uOther.xy) * uOther.z + 0.5, oe = min(ouv, 1.0 - ouv);
      if (min(oe.x, oe.y) > 0.0) lively = max(lively, texture(tOther, ouv).w * uOther.w * smoothstep(0.0, 0.1, min(oe.x, oe.y)));
    }
    // the wash: stirred water behind the hull. It spreads a little, fades slowly, and is renewed under the hull.
    float wash = (a.z + uTune.w * lw * inside) * uTune.z;
    wash = max(wash, max(uBoat.w * min(1.0, foot), min(1.5, footB)));      // (above 1: water a blade has just churned; the surface shows it pale whatever the look's foam)
    oAux = vec4(grad, wash * fade, lively * fade);
    oRidge = vec4(toCrest, crest, 0.0);
  }
`;

// Disturbances from ripple(): small gaussian dents, split between the octaves. Instanced quads, one draw per window.
const DROP_VERT = /* glsl */`
  ${COMMON}
  in vec3 position;
  in vec4 aDrop;                           // x, z, depth of the dent (metres, negative = pushed down), width (metres)
  uniform vec4 uWin;
  out vec2 vOff; out vec4 vDrop;
  void main() {
    float reach = 3.3 * sqrt(aDrop.w * aDrop.w + uSig2[BANDS]);
    vOff = position.xy * reach; vDrop = aDrop;
    gl_Position = vec4((aDrop.xy + vOff - uWin.xy) / uWin.z * 2.0, 0.0, 1.0);
  }
`;
const DROP_FRAG = /* glsl */`
  ${COMMON}
  uniform float uFlash;
  in vec2 vOff; in vec4 vDrop;
  ${OUTS}
  void main() {
    float r2 = dot(vOff, vOff), w2 = vDrop.w * vDrop.w;
    BVEC b = split(r2, w2, vDrop.z * w2);
    oS0 = vec4(b.x, 0.0, b.y, 0.0);
    #if BANDS > 2
      oS1 = vec4(b.z, 0.0, b.w, 0.0);
    #endif
    oAux = vec4(0.0, 0.0, 0.0, uFlash * abs(vDrop.z) * exp(-0.5 * r2 / (w2 * 2.0 + uSig2[0])));
    oRidge = vec4(0.0);
  }
`;
// Once in a while, and whenever the boat is carried to another realm, every field is copied through this: a value that
// is not a number becomes still water, and nothing is larger than the textures can hold. (Everything that feeds the
// simulation is already kept finite; this is the net under it, so that no accident can leave the water dead for the
// rest of the ride. For water in its right mind the copy is exact.)
const SCRUB_FRAG = /* glsl */`
  precision highp float;
  precision highp sampler2D;
  uniform sampler2D tS0, tAux, tRidge;
  #if BANDS > 2
    uniform sampler2D tS1;
  #endif
  ${OUTS}
  vec4 sane(vec4 v, float most) { return mix(clamp(v, -most, most), vec4(0.0), isnan(v)); }
  void main() {
    ivec2 p = ivec2(gl_FragCoord.xy);
    oS0 = sane(texelFetch(tS0, p, 0), 512.0);
    #if BANDS > 2
      oS1 = sane(texelFetch(tS1, p, 0), 512.0);
    #endif
    oAux = sane(texelFetch(tAux, p, 0), 64.0);
    oRidge = sane(texelFetch(tRidge, p, 0), 64.0);
  }
`;
const ZERO_FRAG = /* glsl */`
  precision highp float;
  ${OUTS}
  void main() {
    oS0 = vec4(0.0);
    #if BANDS > 2
      oS1 = vec4(0.0);
    #endif
    oAux = vec4(0.0); oRidge = vec4(0.0);
  }
`;

class Zone {
  constructor(sim, spec) { this.sim = sim; this.x = 0; this.z = 0; this.x2 = null; this.z2 = null; this.radius = 4; this.rate = 6; this.strength = 1; this.soft = null; Object.assign(this, spec); }
  /** Change it in place (x, z, x2, z2, radius, rate, strength, soft). */
  set(spec) { Object.assign(this, spec); return this; }
  remove() { const i = this.sim.zones.indexOf(this); if (i >= 0) this.sim.zones.splice(i, 1); }
}

export class RippleSim {
  /**
   * @param {THREE.WebGLRenderer} renderer
   * @param {{level?: string, aniso?: number}} opts
   */
  constructor(renderer, { level = 'high', aniso = 8 } = {}) {
    this.renderer = renderer;
    this.n = N_BY_LEVEL[level] || 512;
    const n = this.n;
    // without float render targets the water stays, flat: no wake, no rings (the textures are never drawn into, and read as zero)
    this.ok = renderer.capabilities.isWebGL2 !== false && (renderer.extensions.has('EXT_color_buffer_float') || renderer.extensions.has('EXT_color_buffer_half_float'));
    const tri = new THREE.BufferGeometry();
    tri.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
    this.scene = new THREE.Scene(); this.camera = new THREE.Camera();
    this.quad = new THREE.Mesh(tri, null); this.quad.frustumCulled = false; this.scene.add(this.quad);
    // ripple(): instanced quads
    const dq = new THREE.InstancedBufferGeometry();
    dq.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]), 3));
    dq.setIndex([0, 1, 2, 0, 2, 3]);
    this.dropData = new Float32Array((MAX_DROPS + OWN_DROPS) * 4);
    this.dropAttr = new THREE.InstancedBufferAttribute(this.dropData, 4); this.dropAttr.setUsage(THREE.DynamicDrawUsage);
    dq.setAttribute('aDrop', this.dropAttr); dq.instanceCount = 0;
    this.dropScene = new THREE.Scene();
    this.dropMesh = new THREE.Mesh(dq, null); this.dropMesh.frustumCulled = false; this.dropScene.add(this.dropMesh);
    this.dropCount = 0;

    this.blobU = Array.from({ length: NB }, () => new THREE.Vector4());
    this.blobP = Array.from({ length: NB }, (_, i) => (i < NH ? new THREE.Vector4(HULL[i].w * HULL[i].w, 0, HULL[i].wash, HULL[i].stir) : new THREE.Vector4(0.01, 0, 0, 0)));
    this.blades = Array.from({ length: BLADES }, () => ({ on: false, x: 0, z: 0, mx: 0, mz: 0, w: 0.15, vol: 0, wash: 0, stir: 0, wide: 0.25 }));
    this.zoneA = Array.from({ length: MAX_ZONES }, () => new THREE.Vector4());
    this.zoneB = Array.from({ length: MAX_ZONES }, () => new THREE.Vector4(1, 0, 0.5, 1));
    this.front = new THREE.Vector4(1, 0, 1e6, 0.1);
    this.hullLine = new THREE.Vector4();
    this.zones = [];
    this.hull = { bow: 1.84, stern: -1.5, half: 0.4, model: null, known: new WeakMap() };

    const base = { type: THREE.HalfFloatType, format: THREE.RGBAFormat, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false, stencilBuffer: false, generateMipmaps: false, colorSpace: THREE.NoColorSpace };
    const make = (bands, washDamp, tune) => {
      const count = bands > 2 ? 4 : 3, auxAt = count - 2;
      const target = () => {
        const t = new THREE.WebGLRenderTarget(n, n, { ...base, count });
        const aux = t.textures[auxAt];
        aux.generateMipmaps = true; aux.minFilter = THREE.LinearMipmapLinearFilter; aux.anisotropy = Math.min(8, aniso); aux.mipmapsAutoUpdate = false;
        return t;
      };
      const win = new THREE.Vector4(0, 0, 16, 16 / n), sig2 = new Float32Array(bands + 1);
      const defines = { BANDS: bands };
      const raw = { glslVersion: THREE.GLSL3, depthTest: false, depthWrite: false, defines };
      const sim = new THREE.RawShaderMaterial({
        ...raw, vertexShader: PASS_VERT, fragmentShader: SIM_FRAG, blending: THREE.NoBlending,
        uniforms: {
          tS0: { value: null }, tS1: { value: null }, tAux: { value: null }, tOther: { value: null },
          uTexel: { value: new THREE.Vector2(1 / n, 1 / n) }, uOff: { value: new THREE.Vector2(0.5, 0.5) }, uMap: { value: new THREE.Vector4(1, 0, 0, 1) },
          uWin: { value: win }, uOther: { value: new THREE.Vector4(0, 0, 1, 0) }, uDt: { value: STEP },
          uBand: { value: Array.from({ length: bands }, () => new THREE.Vector4()) }, uSig2: { value: sig2 }, uWashDamp: { value: new THREE.Vector4(...washDamp) },
          uBlob: { value: this.blobU }, uBlobP: { value: this.blobP }, uBoat: { value: new THREE.Vector4() }, uHull: { value: this.hullLine },
          uTune: { value: new THREE.Vector4() }, uRidge: { value: new THREE.Vector4(0.2, 1.2, 0.5, 0) },
          uRain: { value: new THREE.Vector4() }, uRainB: { value: new THREE.Vector4() }, uRainOff: { value: new THREE.Vector2() }, uFront: { value: this.front },
          uZoneA: { value: this.zoneA }, uZoneB: { value: this.zoneB }, uZones: { value: 0 },
        },
      });
      const drops = new THREE.RawShaderMaterial({
        ...raw, vertexShader: DROP_VERT, fragmentShader: DROP_FRAG, transparent: true,
        blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneFactor,
        uniforms: { uWin: { value: win }, uSig2: { value: sig2 }, uFlash: { value: 8 } },
      });
      const zero = new THREE.RawShaderMaterial({ ...raw, vertexShader: PASS_VERT, fragmentShader: ZERO_FRAG, blending: THREE.NoBlending });
      const scrub = new THREE.RawShaderMaterial({ ...raw, vertexShader: PASS_VERT, fragmentShader: SCRUB_FRAG, blending: THREE.NoBlending, uniforms: { tS0: { value: null }, tS1: { value: null }, tAux: { value: null }, tRidge: { value: null } } });
      return { bands, count, auxAt, read: target(), write: target(), win, sig2, sim, drops, zero, scrub, tune, cx: 0, cz: 0, size: 16, lambda: new Float32Array(bands), fresh: true };
    };
    this.fine = make(2, TUNE.fine.washDamp, TUNE.fine);
    this.wide = make(4, TUNE.wide.washDamp, TUNE.wide);
    this.leanX = 0; this.leanZ = 0;
    this.size = 0; this.life = 4; this.speed = 1;
    this.acc = 0; this.steps = 0; this.jump = true; this.started = false;
    this.pose = { x: 0, z: 0, heading: 0 }; this.smoothSpeed = 0;
    this.rainSeed = 1; this.rnd = 12345;
    this.dropSum = 0; this.sinceScrub = 0;
    this.setSize(64);
  }

  get auxFine() { return this.fine.read.textures[this.fine.auxAt]; }
  get auxWide() { return this.wide.read.textures[this.wide.auxAt]; }
  get ridgeFine() { return this.fine.read.textures[this.fine.auxAt + 1]; }
  get ridgeWide() { return this.wide.read.textures[this.wide.auxAt + 1]; }

  /** Lay the wide window over `size` metres (the fine one over a quarter of that). Changing it stills the water. */
  setSize(size) {
    size = Math.min(128, Math.max(32, size || 64));
    if (Math.abs(size - this.size) < 0.5) return;
    this.size = size;
    for (const [g, s] of [[this.fine, size / 4], [this.wide, size]]) {
      g.size = s; g.win.z = s; g.win.w = s / this.n;
      for (let b = 0; b < g.bands; b++) g.lambda[b] = 6.4 * g.win.w * Math.pow(2, b);
      for (let b = 0; b <= g.bands; b++) g.sig2[b] = Math.pow(TUNE.split * (b < g.bands ? g.lambda[b] : 2 * g.lambda[g.bands - 1]), 2);
      const mid = Math.sqrt(g.lambda[0] * g.lambda[Math.min(1, g.bands - 1)]), k = 2 * Math.PI / mid;
      g.sim.uniforms.uRidge.value.set(g.tune.crest[0] * k, g.tune.crest[1] * k, this.hull.half + 0.05, TUNE.splash);
    }
    this.bands();
    this.clear();
  }

  /** The octaves' constants: wave speed, pull toward level, damping. `life` is the seconds a ripple lasts, `speed` how fast time runs for waves. */
  bands() {
    const s2 = this.speed * this.speed, life = Math.max(0.3, this.life);
    for (const g of [this.fine, this.wide]) {
      const u = g.sim.uniforms.uBand.value;
      for (let b = 0; b < g.bands; b++) {
        const k = 2 * Math.PI / g.lambda[b];
        // short ripples die sooner than long ones, as they do; at life = 4 these are the damping rates the wake was tuned with
        const damp = (TUNE.dampBase + TUNE.dampShort * Math.pow(0.2 / g.lambda[b], 0.42)) * (4 / life);
        u[b].set(G / (2 * k) / (g.win.w * g.win.w) * s2, G * k / 2 * s2, damp, k);
      }
    }
  }

  /** Still water, everywhere. */
  clear() {
    if (!this.ok) return;
    const r = this.renderer, prev = r.getRenderTarget(), auto = r.autoClear;
    r.autoClear = false;
    for (const g of [this.fine, this.wide]) {
      this.quad.material = g.zero;
      for (const t of [g.read, g.write]) { t.textures[g.auxAt].mipmapsAutoUpdate = true; r.setRenderTarget(t); r.render(this.scene, this.camera); t.textures[g.auxAt].mipmapsAutoUpdate = false; }
      g.fresh = true;
    }
    r.setRenderTarget(prev); r.autoClear = auto;
    this.dropCount = 0; this.dropSum = 0; this.sinceScrub = 0;
  }

  /** The boat has been put somewhere else: the water round it comes along, turned to its new heading. */
  teleport() { this.jump = true; this.dropCount = 0; this.dropSum = 0; this.scrub(); }

  /** Copy every field through the scrubbing pass (see SCRUB_FRAG): exact for sane water, and the end of anything that is not a number. */
  scrub() {
    if (!this.ok) return;
    const r = this.renderer, prev = r.getRenderTarget(), auto = r.autoClear, xr = r.xr.enabled;
    r.autoClear = false; r.xr.enabled = false;
    for (const g of [this.fine, this.wide]) {
      if (g.fresh) continue;
      const u = g.scrub.uniforms, aux = g.write.textures[g.auxAt];
      u.tS0.value = g.read.textures[0]; if (g.bands > 2) u.tS1.value = g.read.textures[1];
      u.tAux.value = g.read.textures[g.auxAt]; u.tRidge.value = g.read.textures[g.auxAt + 1];
      this.quad.material = g.scrub;
      aux.mipmapsAutoUpdate = true;
      r.setRenderTarget(g.write); r.render(this.scene, this.camera);
      aux.mipmapsAutoUpdate = false;
      const tmp = g.read; g.read = g.write; g.write = tmp;
    }
    r.setRenderTarget(prev); r.autoClear = auto; r.xr.enabled = xr;
    this.sinceScrub = 0;
  }

  /**
   * Disturb the surface at a world position. Any number of calls a frame; outside the wide window they cost a comparison.
   * (own: one of the water's own splashes, which has a place kept for it however many a realm has asked for.)
   */
  ripple(x, z, strength = 1, radius = 0.5, own = false) {
    if (!(strength > 0) || this.dropCount >= (own ? MAX_DROPS + OWN_DROPS : MAX_DROPS) || !this.ok) return;
    const g = this.wide, h = g.size * 0.5 + 2;
    if (!(Math.abs(x - g.win.x) < h) || !(Math.abs(z - g.win.y) < h)) return;
    if (strength > 6) strength = 6;
    if (!own && (this.dropSum += strength) > MAX_SPLASH) return;      // (a runaway caller: what it has already asked for this frame is more than any scene needs)
    const o = this.dropCount++ * 4, d = this.dropData;
    d[o] = x; d[o + 1] = z; d[o + 2] = -TUNE.drop * strength; d[o + 3] = radius > 0 ? Math.min(2.5, Math.max(0.03, radius * TUNE.dropWidth)) : 0.03;
  }

  /**
   * A blade in the water, for the frame that follows (call it every frame the blade is under; it is forgotten after the
   * next step). i: which blade (0 or 1). (x, z): the middle of the part of it that is under water. (mx, mz): how far that
   * has moved THROUGH THE WATER since the last frame, in metres (the water's own drift taken out). width: metres;
   * heap: metres of water it heaps up before it (about its speed squared over 2 g, said larger so that it reads);
   * wide: the share of it the wide window takes (0.25): a blade is a small thing, and what it does to the water is
   * short ripples that stay near it (the fine window's), not rings that cross the picture (the wide window's);
   * wash: 0..1.5, how churned it leaves the water where it is (above 1 it is drawn pale for the three seconds it takes
   * to fall back under 1: water.js, `churn`); stir: 0..1.5, how lively.
   */
  blade(i, x, z, mx, mz, { width = 0.16, heap = 0.05, wash = 0, stir = 0, wide = 0.25 } = {}) {
    const b = this.blades[i];
    if (!b || !fin(x) || !fin(z) || !fin(mx) || !fin(mz)) return;
    b.on = true; b.x = x; b.z = z; b.mx = lim(mx, 0, -0.5, 0.5); b.mz = lim(mz, 0, -0.5, 0.5);
    b.w = lim(width, 0.16, 0.05, 0.6); b.vol = lim(heap, 0, -0.5, 0.5) * b.w * b.w; b.wash = lim(wash, 0, 0, 1.5); b.stir = lim(stir, 0, 0, 1.5); b.wide = lim(wide, 0.25, 0, 1);
  }

  /** A place where it rains: a disc at (x, z), or a capsule from (x, z) to (x2, z2), `rate` rings per square metre per second. */
  rainZone(spec = {}) {
    if (this.zones.length >= MAX_ZONES) { if (!this.warnedZones) { this.warnedZones = true; console.warn(`water: at most ${MAX_ZONES} rain zones at once (the rest rain nowhere). Zones made in a realm's build are cleared when it becomes current: make them in water.onBind`); } return new Zone(this, spec); }
    const z = new Zone(this, spec); this.zones.push(z); return z;
  }

  /** Read the boat's waterline off its model (again, if the engine has swapped the model). */
  measureBoat(boat) {
    const model = boat && boat.model;
    if (!model || model === this.hull.model || !model.group) return;
    this.hull.model = model;
    let hull = this.hull.known.get(model);
    if (hull === undefined) {
      hull = null;
      try { hull = measureHull(model.group); } catch (err) { console.warn('water: could not measure the boat', err); }
      this.hull.known.set(model, hull);
    }
    if (!hull) return;
    this.hull.bow = hull.bow; this.hull.stern = hull.stern; this.hull.half = hull.half;
    for (const g of [this.fine, this.wide]) g.sim.uniforms.uRidge.value.z = hull.half + 0.05;
  }

  /**
   * Advance the water. boat: { x, z, heading }; o: { wake, life, speed, rain, rainStrength, frontRain, lookX, lookZ }.
   * The front itself is this.front (normal x, z, offset, 1 / width), set by the owner.
   */
  step(dt, boat, o) {
    if (!this.ok || !boat || !fin(boat.x) || !fin(boat.z) || !fin(boat.heading) || !(dt >= 0)) return;
    const r = this.renderer;
    const life = lim(o.life, 4, 0.3, 120), fast = lim(o.speed, 1, 0.25, 2.5);
    if (life !== this.life || fast !== this.speed) { this.life = life; this.speed = fast; this.bands(); }
    this.measureBoat(boat);
    const p = this.pose, H = this.hull;
    const jumped = this.jump || !this.started;
    this.acc += dt;
    let n = Math.floor(this.acc / STEP + 1e-4);
    this.acc -= n * STEP;
    if (n > 3) { n = 3; this.acc = 0; }
    if (jumped) n = Math.max(1, n);
    if (n === 0) return;
    if ((this.sinceScrub += n) >= SCRUB_EVERY) this.scrub();
    const span = n * STEP;
    const vx = jumped ? 0 : (boat.x - p.x) / span, vz = jumped ? 0 : (boat.z - p.z) / span, speed = Math.hypot(vx, vz);
    const wake = lim(o.wake, 1, 0, 4), rainRate = lim(o.rain, 0, 0, 60), rainHeavy = lim(o.rainStrength, 1, 0, 12);
    // where the windows want to be: round the boat, the fine one leaning toward where the rider looks (the lean is eased,
    // the window itself keeps up with the boat at any speed)
    const lookX = fin(o.lookX) ? o.lookX : 0, lookZ = fin(o.lookZ) ? o.lookZ : 0;
    const ll = Math.hypot(lookX, lookZ) || 1, lean = Math.min(TUNE.leanMax, this.fine.size * TUNE.lean) / ll;
    const kf = jumped ? 1 : 1 - Math.exp(-span * TUNE.leanRate);
    this.leanX += (lookX * lean - this.leanX) * kf; this.leanZ += (lookZ * lean - this.leanZ) * kf;
    if (this.leanX !== this.leanX || this.leanZ !== this.leanZ) { this.leanX = 0; this.leanZ = 0; }
    this.fine.wantX = boat.x + this.leanX; this.fine.wantZ = boat.z + this.leanZ;
    this.wide.wantX = boat.x; this.wide.wantZ = boat.z;
    const prevTarget = r.getRenderTarget(), prevAuto = r.autoClear, prevXr = r.xr.enabled;
    r.autoClear = false; r.xr.enabled = false;

    let dh = boat.heading - p.heading; dh = Math.atan2(Math.sin(dh), Math.cos(dh));
    const cos0 = Math.cos(p.heading), sin0 = Math.sin(p.heading);
    this.smoothSpeed += (Math.min(speed, 5.2) - this.smoothSpeed) * (jumped ? 1 : 1 - Math.exp(-span * 2));
    // the head of water the hull raises: as on real water at a drift, levelling off as the boat is paddled (the ride wants
    // a wake that reads when drifting and is never a breaker)
    const u2 = this.smoothSpeed * this.smoothSpeed, head = TUNE.head * u2 / (u2 + TUNE.headKnee);
    const fit = (H.bow - H.stern) / 3.34, wfit = H.half / 0.40;          // the table, fitted to the measured waterline
    const fx1 = -Math.sin(boat.heading), fz1 = -Math.cos(boat.heading);
    this.hullLine.set(boat.x + fx1 * (H.stern + 0.1), boat.z + fz1 * (H.stern + 0.1), boat.x + fx1 * (H.bow - 0.1), boat.z + fz1 * (H.bow - 0.1));
    // zones
    const nz = Math.min(MAX_ZONES, this.zones.length);
    for (let i = 0; i < nz; i++) {
      // (whatever a realm has written into a zone, the shaders get finite numbers in a sane range; a zone that is nowhere rains nowhere)
      const z = this.zones[i], ok = fin(z.x) && fin(z.z), radius = lim(z.radius, 4, 0.01, 500);
      this.zoneA[i].set(ok ? z.x : 0, ok ? z.z : 0, ok && fin(z.x2) ? z.x2 : ok ? z.x : 0, ok && fin(z.z2) ? z.z2 : ok ? z.z : 0);
      this.zoneB[i].set(radius, ok ? lim(z.rate, 0, 0, 60) : 0, lim(z.soft, Math.min(0.5, radius * 0.25), 0.02, 500), lim(z.strength, 1, 0, 12));
    }
    const anyRain = rainRate > 0 || nz > 0;

    for (let s = 0; s < n; s++) {
      const f = (s + 0.5) / n, last = s === n - 1;
      this.steps++;
      // hull blobs at the middle of this step and how far each moves during it (turning sweeps bow and stern sideways)
      const still = jumped ? 0 : 1;
      for (let i = 0; i < BLADES; i++) {                  // the blades: where they are, and their way through the water this step
        const b = this.blades[i], U = this.blobU[NH + i], P = this.blobP[NH + i];
        if (b.on && !jumped) { U.set(b.x - b.mx * (1 - f), b.z - b.mz * (1 - f), b.mx / n, b.mz / n); P.set(b.w * b.w, b.vol, b.wash, b.stir); }
        else { U.set(boat.x, boat.z, 0, 0); P.set(0.01, 0, 0, 0); }
      }
      for (let i = 0; i < NH; i++) {                      // forward is (-sin, -cos) of the heading, right is (cos, -sin)
        const b = HULL[i], bf = H.stern + (b.f + 1.5) * fit, br = b.r * fit;
        const h0 = p.heading, h1 = p.heading + dh;
        const x0 = p.x - Math.sin(h0) * bf + Math.cos(h0) * br, z0 = p.z - Math.cos(h0) * bf - Math.sin(h0) * br;
        const x1 = boat.x - Math.sin(h1) * bf + Math.cos(h1) * br, z1 = boat.z - Math.cos(h1) * bf - Math.sin(h1) * br;
        if (jumped) this.blobU[i].set(x1, z1, 0, 0);
        else this.blobU[i].set(x0 + (x1 - x0) * f, z0 + (z1 - z0) * f, (x1 - x0) / n * still, (z1 - z0) / n * still);
        const w = b.w * wfit;
        this.blobP[i].x = w * w;
        this.blobP[i].y = (b.head * head - b.d * TUNE.hullDepth) * w * w * wake;      // volume / 2 pi; negative = pressed down
      }
      for (let gi = 0; gi < 2; gi++) {
        const g = gi === 0 ? this.fine : this.wide, other = gi === 0 ? this.wide : this.fine, u = g.sim.uniforms;
        if (s === 0) {
          // the window follows by whole cells, so nothing in it is ever resampled
          const cx = g.wantX, cz = g.wantZ;
          const cell = g.win.w, nx = Math.round(cx / cell) * cell, nz2 = Math.round(cz / cell) * cell;
          if (jumped && this.started && !g.fresh) {
            // carried through a jump: the same water round the boat, turned with it. (Where the window sat relative to the
            // boat before, it sits now.)
            const c = Math.cos(dh), sn = Math.sin(dh);
            const ax = nx - boat.x, az = nz2 - boat.z;                    // new window centre relative to the new boat
            const ox = c * ax - sn * az, oz = sn * ax + c * az;           // the same offset in the old frame
            u.uMap.value.set(c, sn, -sn, c);
            u.uOff.value.set(0.5 + (ox + p.x - g.win.x) / g.size, 0.5 + (oz + p.z - g.win.y) / g.size);
          } else if (g.fresh) { u.uMap.value.set(1, 0, 0, 1); u.uOff.value.set(9, 9); }
          else { u.uMap.value.set(1, 0, 0, 1); u.uOff.value.set(0.5 + (nx - g.win.x) / g.size, 0.5 + (nz2 - g.win.y) / g.size); }
          g.cx = cx; g.cz = cz; g.win.x = nx; g.win.y = nz2; g.fresh = false;
        } else { u.uMap.value.set(1, 0, 0, 1); u.uOff.value.set(0.5, 0.5); }
        u.tS0.value = g.read.textures[0]; if (g.bands > 2) u.tS1.value = g.read.textures[1];
        u.tAux.value = g.read.textures[g.auxAt];
        // the wide window hears the fine one's liveliness (rain, pin rings), so whoever reads tRipple sees all of it. Only
        // in the last step of a frame: the fine window is read through its mipmaps, and those are rebuilt once a frame, on
        // its last step. (In an earlier step they are those of whatever that texture last held as a frame's end, which at
        // a steady thirty frames a second is never renewed: liveliness from long ago would be heard again on every frame.)
        u.tOther.value = other.read.textures[other.auxAt];
        u.uOther.value.set(other.win.x, other.win.y, 1 / other.size, gi === 1 && last ? TUNE.carry : 0);
        for (let i = 0; i < BLADES; i++) { const b = this.blades[i]; if (b.on && !jumped) this.blobP[NH + i].y = b.vol * (gi === 0 ? 1 : b.wide); }
        u.uDt.value = STEP;
        // (how far from the boat anything of the hull's is felt; a blade out on its oar reaches further)
        let reach = 2.7 + 3.2 * Math.sqrt(g.sig2[g.bands] + 0.09);
        for (const b of this.blades) if (b.on) reach = Math.max(reach, Math.hypot(b.x - boat.x, b.z - boat.z) + 3.3 * Math.sqrt(b.w * b.w + g.sig2[g.bands]));
        u.uBoat.value.set(boat.x, boat.z, reach * reach, wake > 0 ? Math.min(1, wake) * smooth(0.25, 3.2, speed) : 0);
        const t = g.tune;
        u.uTune.value.set(Math.exp(-STEP / t.livelyLife), t.livelyGain, Math.exp(-STEP / t.washLife), Math.min(0.2, t.washSpread * STEP / (g.win.w * g.win.w)));
        // rain: a new slot of drops every tenth of a second, the two windows in turn
        const fire = anyRain && (this.steps + gi * 3) % TUNE.rainSlot === 0;
        if (fire) {
          this.rainSeed = (this.rainSeed * 16807) % 2147483647;
          const top = g.sig2[Math.min(2, g.bands)];                     // the widest gaussian a drop is split with
          const rt = gi === 0 ? TUNE.rainFine : TUNE.rainWide;
          const width = gi === 0 ? rt.width : rt.width + 0.6 * g.win.w, cell = 4.4 * Math.sqrt(width * width + top);
          const depth = -rt.depth * rainHeavy;
          u.uRain.value.set(rainRate, cell, width * width, depth * width * width);
          u.uRainB.value.set((this.rainSeed % 4096) + 0.5, cell * cell * TUNE.rainSlot * STEP, lim(o.frontRain, 0, 0, 1), 0);
          u.uRainOff.value.set((this.rainSeed % 977) / 977, (this.rainSeed % 613) / 613);
        } else u.uRain.value.w = 0;
        u.uZones.value = nz;
        const hasDrops = last && this.dropCount > 0;
        const aux = g.write.textures[g.auxAt];
        aux.mipmapsAutoUpdate = last && !hasDrops;
        this.quad.material = g.sim;
        r.setRenderTarget(g.write);
        r.render(this.scene, this.camera);
        if (hasDrops) {
          aux.mipmapsAutoUpdate = true;
          this.dropAttr.clearUpdateRanges(); this.dropAttr.addUpdateRange(0, this.dropCount * 4); this.dropAttr.needsUpdate = true;
          this.dropMesh.geometry.instanceCount = this.dropCount;
          this.dropMesh.material = g.drops;
          r.render(this.dropScene, this.camera);
        }
        aux.mipmapsAutoUpdate = false;
        const tmp = g.read; g.read = g.write; g.write = tmp;
      }
    }
    this.dropCount = 0; this.dropSum = 0;
    for (const b of this.blades) b.on = false;
    r.setRenderTarget(prevTarget); r.autoClear = prevAuto; r.xr.enabled = prevXr;
    p.x = boat.x; p.z = boat.z; p.heading = boat.heading;
    this.jump = false; this.started = true;
  }

  /** Bytes of GPU memory held by the simulation. */
  memory() {
    let b = 0;
    for (const g of [this.fine, this.wide]) b += 2 * this.n * this.n * 8 * (g.count + 0.34);
    return b;
  }

  dispose() {
    for (const g of [this.fine, this.wide]) { g.read.dispose(); g.write.dispose(); g.sim.dispose(); g.drops.dispose(); g.zero.dispose(); g.scrub.dispose(); }
    this.quad.geometry.dispose(); this.dropMesh.geometry.dispose();
  }
}
