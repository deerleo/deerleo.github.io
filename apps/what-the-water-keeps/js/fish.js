// Fish: the schools of the ride. Every school is instanced (one draw call for a whole species), each fish a small
// mesh with real thickness, and the body's wave, the fins and the school's motion are all worked out in the vertex
// shader. The fish are solid things under the surface, so the water bends them, tints them and hides them with depth
// by itself (docs/water.md, "Things under the surface"); they are left out of the mirror. The one thing the water
// cannot do for them is make them look as shallow as water makes things look: every fish draws itself as the surface
// would show it, slimmed and (near the surface) lifted (the end of FISH_VERTEX says how and why), and is lit from
// above as things under water are (FISH_LIGHT_HOOK).
//
//   makeSchool   schools of one species: rudd and carp (deep-bodied), a slim school fish, fry; on closed routes or
//                round a wandering point; they part round the hull and close behind it, burst from a fright and
//                regroup, flash along the flank as they turn, rise and sip; or drawn as streaks of light (the sea)
//   makeRises    fish rising anywhere on a water: a ring, and now and then a back and a dorsal fin rolling over
//   makeSparks   fish that dart away from the stem as dashes of light (the sea)
//   makeShrimp   clouds of brine shrimp that loop, and gather where a light stands in the water
//
// docs/life/fish.md is the manual: what each gives, every option, how to stage it with ctx.stage, what it costs, and
// the notes on the real animals that the meshes and the motion were made from.
//
// How a fish gets where it is. Nothing is simulated fish by fish. A school is a few numbers kept on the CPU (how far
// it has come along its route, how fast it goes, the phase of its tail beat, where its last fright began); a fish is
// a station in the school (so far along, so far to the side, so deep, a place in the ball) and four random numbers.
// From these fishPos() gives the place of any fish at any time, the same in the shader (FISH_GLSL, for every vertex)
// and in script (Fish.posAt, for the few fish that touch the water each frame). The shader asks for it at three
// moments a little apart: the difference is the way the fish is going (so it always faces where it travels: nothing
// skates), and the difference of the differences is how hard it turns (its body bends into the turn, it rolls, and
// its flank catches the light).
import * as THREE from 'three';
import { WATER_GLSL, waterUniforms } from '../water-final.js';
import { MAX_LIGHTS } from '../gouache.js';

const TAU = Math.PI * 2;
const K_MAX = 8;                 // schools in one system (one draw call)
const T_MAX = 4;                 // large things a system keeps clear of at once (a pike, a diving bird, the old carp)
const ROUTE_N = 1024;            // samples of a school's route
const EPS = 0.09;                // seconds between the three moments the shader looks at
const PHI_WRAP = TAU * 20;       // the tail-beat phase wraps here (a fish's own rate is a multiple of a twentieth)
const SIP_AT = 0.31;             // the share of a sip's length at which the lips are at the surface and the ring is made (the fish has all but stopped)
const SIP_RING = [0.2, 0.14];    // a sip's ring: slight, and no wider than the mouth that made it (a ring 0.3 across left a dark dimple the size of the head)

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const smooth = (a, b, x) => { if (!(b > a)) return x >= b ? 1 : 0; const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const col = (c) => (c && c.isColor ? c.clone() : new THREE.Color(c ?? '#ffffff'));
const range = (v, d) => (Array.isArray(v) ? v : v == null ? d : [v, v]);
/** The options that were really given: a key set to undefined counts as left out, and the default stands. */
const given = (o) => { const out = {}; if (o && typeof o === 'object') for (const k in o) if (o[k] !== undefined) out[k] = o[k]; return out; };
const _size = new THREE.Vector2();
/** A number in 0..1 from three whole numbers: for events in time, so that the n-th rise of fish i is the same in every run, however the frames fall. */
function hash01(a, b, c = 0) {
  let h = Math.imul(a | 0, 374761393) ^ Math.imul(b | 0, 668265263) ^ Math.imul(c | 0, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; h = Math.imul(h, 2246822519); h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}

// ------------------------------------------------------------------------------------------------ the species
// Measures are shares of the fish's whole length, snout to the tips of the tail (docs/life/fish.md has the animals).
// profile: [share of the length from the snout, height of the back above the axis, depth of the belly below it, half width]
export const SPECIES = {
  // Rudd, Scardinius erythrophthalmus: deep and flat-sided, the dorsal fin set back behind the pelvics, a deeply
  // forked tail, rust-red lower fins, a small upturned mouth.
  rudd: {
    length: 0.22, vary: 0.16, sides: 8, section: 2.0, crown: 0.0, nose: 0.006, detail: true,
    profile: [[0.03, 0.036, 0.030, 0.023], [0.08, 0.070, 0.060, 0.040], [0.15, 0.108, 0.100, 0.052], [0.25, 0.142, 0.140, 0.058], [0.36, 0.156, 0.160, 0.058],
      [0.46, 0.148, 0.158, 0.054], [0.58, 0.112, 0.128, 0.044], [0.68, 0.074, 0.080, 0.030], [0.76, 0.050, 0.050, 0.018], [0.805, 0.046, 0.046, 0.013]],
    caudal: { at: 0.80, half: 0.046, thick: 0.022, rim: [[1.0, 0.135], [0.955, 0.062], [0.905, 0.0], [0.955, -0.062], [1.0, -0.135]] },
    dorsal: { base: [0.455, 0.49, 0.53, 0.575], rim: [[0.475, 0.060], [0.500, 0.115], [0.550, 0.058], [0.592, 0.026]], thick: 0.012 },
    anal: { base: [0.585, 0.625, 0.67, 0.715], rim: [[0.602, 0.050], [0.630, 0.095], [0.688, 0.050], [0.732, 0.020]], thick: 0.012 },
    pectoral: { at: 0.20, out: 0.85, low: 0.62, length: 0.15, fan: 0.95, rays: 3, dir: [0.26, -0.20, -1], thick: 0.010 },
    pelvic: { at: 0.40, out: 0.35, low: 0.93, length: 0.105, fan: 0.75, rays: 2, dir: [0.15, -0.45, -1], thick: 0.010 },
    colors: { back: '#3a4124', flank: '#8f7a44', belly: '#b0a684', fin: '#84482a', finEdge: '#96502a', dusky: '#7d6c50' },
    eye: [0.065, 0.014, 0.021], iris: '#7a6636', scale: [0.026, 0.024, 0.22],
    wave: [0.012, -0.05, 0.14, 0.95], beat: [1.2, 1.35], rest: 0.28, cruise: 0.3, glide: 0.6,
    pec: [0.62, 0.22, 0.3, 8.2], roll: [0.55, 0.6], bend: 0.8, pitch: 0.6, bias: 0.07,
    flash: { color: '#f2dc9c', strength: 0.9 },
    speed: [0.2, 0.4], spacing: 0.9, surge: 0.11, wobble: [0.085, 0.75],
    burst: { radius: 1.0, out: 0.8, back: 8, reach: 5, wave: 6, boost: 0, boil: [0.22, 0.16], boils: 12 },
    rise: { seconds: 0.95, top: -0.085, travel: 1.5 }, sip: { seconds: 3.0, top: -0.13 },
    hull: { radius: 1.25, vertical: 0.5, depth: 3 }, top: -0.45,
  },
  // Common carp in its wild form, Cyprinus carpio: a heavy torpedo with broad shoulders, one long low dorsal fin,
  // broad pectoral fans held out when it idles, two pairs of barbels, large scales.
  carp: {
    length: 0.7, vary: 0.12, sides: 10, section: 2.5, crown: 0.12, nose: 0.0, detail: true,
    profile: [[0.03, 0.035, 0.030, 0.035], [0.08, 0.070, 0.060, 0.058], [0.15, 0.100, 0.085, 0.072], [0.25, 0.125, 0.110, 0.080], [0.33, 0.132, 0.125, 0.080],
      [0.45, 0.125, 0.125, 0.074], [0.58, 0.100, 0.105, 0.060], [0.68, 0.072, 0.075, 0.042], [0.76, 0.058, 0.058, 0.026], [0.80, 0.055, 0.055, 0.018]],
    caudal: { at: 0.795, half: 0.055, thick: 0.032, rim: [[0.965, 0.132], [0.998, 0.108], [0.972, 0.056], [0.925, 0.0], [0.972, -0.056], [0.998, -0.108], [0.965, -0.132]] },
    dorsal: { base: [0.335, 0.37, 0.43, 0.50, 0.57, 0.625], rim: [[0.350, 0.036], [0.386, 0.076], [0.442, 0.052], [0.512, 0.040], [0.586, 0.036], [0.642, 0.020]], thick: 0.014 },
    anal: { base: [0.60, 0.635, 0.67], rim: [[0.615, 0.050], [0.652, 0.085], [0.692, 0.030]], thick: 0.012 },
    pectoral: { at: 0.205, out: 0.82, low: 0.72, length: 0.155, fan: 1.15, rays: 4, dir: [0.30, -0.16, -1], thick: 0.012 },
    pelvic: { at: 0.385, out: 0.35, low: 0.92, length: 0.11, fan: 0.85, rays: 2, dir: [0.18, -0.4, -1], thick: 0.010 },
    barbel: { at: 0.035, out: 0.75, low: 0.75, length: 0.05, dir: [0.4, -0.62, -0.7] },
    colors: { back: '#26271f', flank: '#3b3a2e', belly: '#55503f', fin: '#2b2a23', finEdge: '#35332a', dusky: '#2b2a23' },
    eye: [0.07, 0.022, 0.014], iris: '#4e4226', scale: [0.0275, 0.03, 0.34],
    wave: [0.008, -0.035, 0.105, 1.05], beat: [0.75, 0.95], rest: 0.35, cruise: 0.4, glide: 0.5,
    pec: [0.72, 0.5, 0.16, 5.0], roll: [0.35, 0.3], bend: 0.7, pitch: 0.24, bias: 0.07,
    flash: { color: '#8c7a4c', strength: 0.25 },
    speed: [0.25, 0.5], spacing: 1.6, surge: 0.25, wobble: [0.06, 0.25],
    burst: { radius: 1.3, out: 0.65, back: 7, reach: 4.5, wave: 8, boost: 0, trigger: 2.2, boil: [0.4, 0.5], boils: 6 },
    rise: { seconds: 1.6, top: -0.09, travel: 1.2 }, sip: { seconds: 4.6, top: -0.205, tilt: 0.32 },
    hull: { radius: 1.5, vertical: 1, depth: 3 }, top: -0.2,
  },
  // A slim school fish of the roach kind (Rutilus rutilus), 22 to 30 cm: a dark back, a bright flank, a forked tail.
  school: {
    length: 0.25, vary: 0.14, sides: 4, section: 2.0, crown: 0.0, nose: 0.0,
    profile: [[0.05, 0.036, 0.036, 0.026], [0.16, 0.080, 0.084, 0.044], [0.32, 0.108, 0.118, 0.052], [0.50, 0.100, 0.112, 0.048], [0.68, 0.062, 0.064, 0.028], [0.80, 0.040, 0.040, 0.012]],
    far: [[0.10, 0.060, 0.062, 0.038], [0.36, 0.108, 0.118, 0.052], [0.80, 0.040, 0.040, 0.012]],
    caudal: { at: 0.80, half: 0.040, thick: 0.02, rim: [[1.0, 0.125], [0.905, 0.0], [1.0, -0.125]] },
    dorsal: { base: [0.42, 0.54], rim: [[0.475, 0.085]], thick: 0.010 },
    anal: { base: [0.60, 0.71], rim: [[0.66, 0.065]], thick: 0.010 },
    pectoral: { at: 0.20, out: 0.85, low: 0.6, length: 0.13, fan: 0.6, rays: 1, dir: [0.26, -0.2, -1], thick: 0.008 },
    colors: { back: '#2f3b3a', flank: '#7e8a88', belly: '#aeb0a8', fin: '#8a4c30', finEdge: '#8a4c30', dusky: '#454844' },
    wave: [0.012, -0.05, 0.14, 0.95], beat: [1.3, 1.35], rest: 0.3, cruise: 0.5, glide: 0.35,
    pec: [0.8, 0.2, 0.3, 8.0], roll: [0.6, 0.6], bend: 0.8, pitch: 0.35, bias: 0.07,
    flash: { color: '#e4ecec', strength: 1.0 },
    speed: [0.8, 1.4], spacing: 1.0, surge: 0.35, wobble: [0.06, 0.45],
    burst: { radius: 1.6, out: 0.7, back: 6, reach: 6, wave: 8, boost: 2.4, onHull: false, boil: [0, 0], boils: 0 },
    rise: { seconds: 0.95, top: -0.08, travel: 1.5 }, sip: { seconds: 3.0, top: -0.12 },
    hull: { radius: 2.5, vertical: 0, depth: 8, length: 0 }, top: -0.4,
  },
  // Fry, the young of the year, about 6 cm: a few triangles with a big head, hanging in shoals near the surface.
  fry: {
    length: 0.06, vary: 0.2, sides: 3, section: 2.0, crown: 0.0, nose: 0.0, tiny: true,
    profile: [[0.14, 0.075, 0.072, 0.050], [0.46, 0.085, 0.090, 0.044]],
    tail: { at: 0.82, tips: [[1.0, 0.085], [1.0, -0.085]] },
    colors: { back: '#4a5442', flank: '#8f968a', belly: '#b4b4a8', fin: '#7f8372', finEdge: '#7f8372', dusky: '#5c6052' },
    wave: [0.015, -0.05, 0.16, 0.9], beat: [2.2, 1.6], rest: 0.3, cruise: 0.18, glide: 0.2,
    pec: [0, 0, 0, 0], roll: [0.3, 0.7], bend: 0.9, pitch: 0.4, bias: 0.05,
    flash: { color: '#f0f2ee', strength: 1.0 },
    speed: [0.06, 0.14], spacing: 1.6, surge: 0.03, wobble: [0.018, 0.9],
    burst: { radius: 0.9, out: 0.4, back: 4, reach: 5, wave: 6, boost: 0, trigger: 2.0, boil: [0.1, 0.12], boils: 5 },      // (the town: they burst from a hull inside 3 m; `reach` must be well beyond that, or a fright that begins 3 m off has all but died when it arrives)
    rise: { seconds: 0.6, top: -0.09, travel: 1.5 }, sip: { seconds: 1.6, top: -0.12 },
    hull: { radius: 1.15, vertical: 0.5, depth: 3 }, top: -0.5,
  },
};

// ------------------------------------------------------------------------------------------------ the meshes
/** A smooth curve through (t, value) pairs on uneven knots. */
function through(ts, vs) {
  const n = ts.length;
  return (t) => {
    if (t <= ts[0]) return vs[0];
    if (t >= ts[n - 1]) return vs[n - 1];
    let i = 0; while (i < n - 2 && t > ts[i + 1]) i++;
    const h = ts[i + 1] - ts[i], x = (t - ts[i]) / h, x2 = x * x, x3 = x2 * x;
    const m0 = i > 0 ? (vs[i + 1] - vs[i - 1]) / (ts[i + 1] - ts[i - 1]) : (vs[1] - vs[0]) / (ts[1] - ts[0]);
    const m1 = i < n - 2 ? (vs[i + 2] - vs[i]) / (ts[i + 2] - ts[i]) : (vs[n - 1] - vs[n - 2]) / (ts[n - 1] - ts[n - 2]);
    return (2 * x3 - 3 * x2 + 1) * vs[i] + (x3 - 2 * x2 + x) * h * m0 + (-2 * x3 + 3 * x2) * vs[i + 1] + (x3 - x2) * h * m1;
  };
}

/** Collects points and faces; faces are turned to look outward, normals are smoothed where points are shared. */
function builder() {
  const P = [], C = [], F = [], Q = [], I = [];
  const b = {
    /** A point: where, its paint, how much of a flank it is (-1 for a fin), and for a fin that sculls its hinge and side. */
    v(p, c, part = 0, fin = null) { P.push(p[0], p[1], p[2]); C.push(c.r, c.g, c.b); Q.push(part); if (fin) F.push(fin[0], fin[1], fin[2], fin[3]); else F.push(0, 0, 0, 0); return P.length / 3 - 1; },
    at(i) { return [P[i * 3], P[i * 3 + 1], P[i * 3 + 2]]; },
    /** A face whose front looks the way `out` points. */
    tri(a, bb, c, out) {
      const ax = P[a * 3], ay = P[a * 3 + 1], az = P[a * 3 + 2], ux = P[bb * 3] - ax, uy = P[bb * 3 + 1] - ay, uz = P[bb * 3 + 2] - az, vx = P[c * 3] - ax, vy = P[c * 3 + 1] - ay, vz = P[c * 3 + 2] - az;
      const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      if (nx * out[0] + ny * out[1] + nz * out[2] < 0) I.push(a, c, bb); else I.push(a, bb, c);
    },
    get triangles() { return I.length / 3; },
    geometry() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
      g.setAttribute('aFin', new THREE.Float32BufferAttribute(F, 4));
      g.setAttribute('aPart', new THREE.Float32BufferAttribute(Q, 1));
      g.setIndex(I);
      g.computeVertexNormals();
      return g;
    },
  };
  return b;
}

/**
 * The mesh of one species, one body length long: the snout at z = +0.5, the tips of the tail at z = -0.5, the back
 * toward +y, the fish's own left toward +x. `far` asks for the plainest form (a spindle and a tail).
 */
export function fishGeometry(species, { far = false, colors = null } = {}) {
  const S = typeof species === 'string' ? SPECIES[species] : species;
  const pal = {}; for (const k in S.colors) pal[k] = col((colors && colors[k]) || S.colors[k]);
  const prof = far && S.far ? S.far : S.profile, n = S.sides;
  const ts = prof.map((p) => p[0]), top = through(ts, prof.map((p) => p[1])), bot = through(ts, prof.map((p) => p[2])), wid = through(ts, prof.map((p) => p[3]));
  const z = (t) => 0.5 - t, B = builder(), e = 2 / S.section;
  const paint = (q, t) => {                                   // q: 0 at the belly's keel .. 1 on the ridge of the back
    const c = q > 0.5 ? pal.flank.clone().lerp(pal.back, smooth(0.5, 0.84, q)) : pal.belly.clone().lerp(pal.flank, smooth(0.06, 0.46, q));
    if (t < 0.14) c.lerp(pal.back, 0.25 * smooth(0.3, 0.9, q));   // the top of the head is darker
    return c;
  };
  const flank = (q) => smooth(0.1, 0.38, q) * (1 - smooth(0.62, 0.9, q));
  // ---- the body: rings from the snout to the root of the tail
  const nose = B.v([0, S.nose, 0.5], paint(0.55, 0), 0.3), rings = [];
  for (const t of ts) {
    const ring = [], H = top(t), D = bot(t), Wd = wid(t);
    for (let j = 0; j < n; j++) {
      const a = TAU * j / n, sx = Math.sin(a), cy = Math.cos(a);
      const x = Wd * Math.sign(sx) * Math.pow(Math.abs(sx), e) * (1 + S.crown * cy), y = cy >= 0 ? H * Math.pow(cy, e) : -D * Math.pow(-cy, e);
      const q = (y + D) / (H + D);
      ring.push(B.v([x, y, z(t)], paint(q, t), flank(q)));
    }
    rings.push(ring);
  }
  // faces of the body look away from its axis
  const centre = (...ids) => { let x = 0, y = 0, zz = 0; for (const i of ids) { const p = B.at(i); x += p[0]; y += p[1]; zz += p[2]; } return [x / ids.length, y / ids.length, zz / ids.length]; };
  const outward = (...ids) => { const c = centre(...ids); return [c[0], c[1], 0.0001]; };
  for (let j = 0; j < n; j++) { const a = rings[0][j], b = rings[0][(j + 1) % n]; const c = centre(a, b); B.tri(nose, a, b, [c[0], c[1], 0.02]); }
  for (let r = 0; r < rings.length - 1; r++) for (let j = 0; j < n; j++) {
    const a = rings[r][j], b = rings[r][(j + 1) % n], c = rings[r + 1][j], d = rings[r + 1][(j + 1) % n], o = outward(a, b, c, d);
    B.tri(a, b, c, o); B.tri(b, d, c, o);
  }
  const last = rings[rings.length - 1];
  // ---- fins: thin, but with a real thickness at the root that runs out to an edge (a lens, never a card)
  // a strip between a line of points on the body and a line of points on the fin's free edge
  const strip = (base, rim, normal, thick, cBase, cRim, part = -1) => {
    for (const s of [1, -1]) {
      const off = (p, k) => [p[0] + normal[0] * s * thick * k, p[1] + normal[1] * s * thick * k, p[2] + normal[2] * s * thick * k];
      const bi = base.map((p) => B.v(off(p, 0.5), cBase, part)), ri = rim.map((p) => B.v(off(p, 0.04), cRim, part));
      const hint = [normal[0] * s, normal[1] * s, normal[2] * s];
      if (ri.length === 1) { for (let j = 0; j < bi.length - 1; j++) B.tri(bi[j], ri[0], bi[j + 1], hint); continue; }
      for (let j = 0; j < bi.length - 1; j++) { B.tri(bi[j], ri[j], bi[j + 1], hint); B.tri(ri[j], ri[j + 1], bi[j + 1], hint); }
    }
  };
  // a fan from a hinge: the paired fins. `dir` is where the leading ray points; the rays open from it toward the body.
  const fan = (hinge, dir, plane, length, angle, rays, thick, cBase, cRim, kind) => {
    const dl = Math.hypot(dir[0], dir[1], dir[2]), d = dir.map((v) => v / dl);
    let nx = plane[0], ny = plane[1], nz = plane[2];           // the fin's own plane: make its normal square to the ray
    const dot = nx * d[0] + ny * d[1] + nz * d[2]; nx -= dot * d[0]; ny -= dot * d[1]; nz -= dot * d[2];
    const nl = Math.hypot(nx, ny, nz); nx /= nl; ny /= nl; nz /= nl;
    const side = hinge[0] >= 0 ? 1 : -1;                       // the rays open toward the middle of the fish
    let ax = d[1] * nz - d[2] * ny, ay = d[2] * nx - d[0] * nz, az = d[0] * ny - d[1] * nx;      // in the plane, square to the ray
    if (ax * side > 0) { ax = -ax; ay = -ay; az = -az; }
    const fin = kind ? [hinge[0], hinge[1], hinge[2], kind] : null, rim = [];
    for (let j = 0; j <= rays; j++) {
      const a = angle * j / Math.max(1, rays), r = length * (1 - 0.3 * Math.pow(j / Math.max(1, rays), 1.6));
      rim.push([hinge[0] + (d[0] * Math.cos(a) + ax * Math.sin(a)) * r, hinge[1] + (d[1] * Math.cos(a) + ay * Math.sin(a)) * r, hinge[2] + (d[2] * Math.cos(a) + az * Math.sin(a)) * r]);
    }
    for (const s of [1, -1]) {
      const h = B.v([hinge[0] + nx * s * thick * 0.5, hinge[1] + ny * s * thick * 0.5, hinge[2] + nz * s * thick * 0.5], cBase, -1, fin);
      const ri = rim.map((p) => B.v([p[0] + nx * s * thick * 0.04, p[1] + ny * s * thick * 0.04, p[2] + nz * s * thick * 0.04], cRim, -1, fin));
      for (let j = 0; j < ri.length - 1; j++) B.tri(h, ri[j], ri[j + 1], [nx * s, ny * s, nz * s]);
    }
  };
  const X = [1, 0, 0];
  if (S.tail) {                                                // fry: the body runs out to a point, and a small forked tail stands on it
    const tip = B.v([0, 0, z(S.tail.at)], pal.flank, 0.3);
    for (let j = 0; j < n; j++) { const a = last[j], b = last[(j + 1) % n]; const c = centre(a, b); B.tri(a, b, tip, [c[0], c[1], -0.001]); }
    const p0 = [0, 0, z(S.tail.at - 0.04)], p1 = [0, S.tail.tips[0][1], z(S.tail.tips[0][0])], p2 = [0, S.tail.tips[1][1], z(S.tail.tips[1][0])];
    for (const s of [1, -1]) { const a = B.v(p0, pal.fin, -1), b = B.v(p1, pal.finEdge, -1), c = B.v(p2, pal.finEdge, -1); B.tri(a, b, c, [s, 0, 0]); }
  } else {
    const cd = S.caudal, m = cd.rim.length, base = [];
    for (let j = 0; j < m; j++) base.push([0, cd.half * (1 - 2 * j / (m - 1)), z(cd.at)]);
    strip(base, cd.rim.map((r) => [0, r[1], z(r[0])]), X, cd.thick, pal.flank.clone().lerp(pal.back, 0.35).lerp(pal.fin, 0.25), pal.finEdge);
    if (!far || !S.far) {
      const sink = 0.008;
      // (the dorsal fin is dark where it leaves the back: seen from above, as the rider sees most fish, it is a dark line, never a pale slit)
      if (S.dorsal) { const f = S.dorsal; strip(f.base.map((t) => [0, top(t) - sink, z(t)]), f.rim.map((r, j) => [0, top(f.base[Math.min(j, f.base.length - 1)]) + r[1], z(r[0])]), X, f.thick, pal.back.clone().lerp(pal.dusky, 0.15), pal.dusky.clone().lerp(pal.back, 0.3)); }
      if (S.anal) { const f = S.anal; strip(f.base.map((t) => [0, -bot(t) + sink, z(t)]), f.rim.map((r, j) => [0, -bot(f.base[Math.min(j, f.base.length - 1)]) - r[1], z(r[0])]), X, f.thick, pal.belly.clone().lerp(pal.fin, 0.45), pal.finEdge); }
      for (const side of [1, -1]) {
        if (S.pectoral) { const f = S.pectoral; fan([side * f.out * wid(f.at), -f.low * bot(f.at), z(f.at)], [side * f.dir[0], f.dir[1], f.dir[2]], [side * 0.3, 0.95, 0.1], f.length, f.fan, f.rays, f.thick, pal.flank.clone().lerp(pal.dusky, 0.5), pal.dusky, side > 0 ? 1 : 2); }
        if (S.pelvic) { const f = S.pelvic; fan([side * f.out * wid(f.at), -f.low * bot(f.at), z(f.at)], [side * f.dir[0], f.dir[1], f.dir[2]], [side * 0.75, 0.6, 0.1], f.length, f.fan, f.rays, f.thick, pal.belly.clone().lerp(pal.fin, 0.45), pal.finEdge, 0); }
        if (S.barbel) { const f = S.barbel; fan([side * f.out * wid(f.at), -f.low * bot(f.at), z(f.at)], [side * f.dir[0], f.dir[1], f.dir[2]], [side * 0.5, 0.8, 0.3], f.length, 0.16, 1, 0.012, pal.flank, pal.belly, 0); }
      }
    }
  }
  return { geometry: B.geometry(), triangles: B.triangles };
}

/**
 * A sliver of light, for fish that are drawn as the light they make: a narrow ribbon one unit long and one wide that
 * always faces the eye, the head at z = +0.5, six stations along it so that it bends where the fish turned (a streak
 * of two straight pieces showed as a hooked wire). Widest a fifth of the way back, running out to nothing at the tail.
 */
function streakGeometry() {
  const B = builder(), c = new THREE.Color(1, 1, 1), at = [0, 0.08, 0.22, 0.42, 0.68, 1], half = [0.1, 0.46, 0.5, 0.4, 0.25, 0.04], rows = [];
  for (let j = 0; j < at.length; j++) rows.push([B.v([-half[j], 0, 0.5 - at[j]], c), B.v([half[j], 0, 0.5 - at[j]], c)]);
  for (let j = 0; j < at.length - 1; j++) { B.tri(rows[j][0], rows[j][1], rows[j + 1][0], [0, 1, 0]); B.tri(rows[j][1], rows[j + 1][1], rows[j + 1][0], [0, 1, 0]); }
  return { geometry: B.geometry(), triangles: B.triangles };
}

// ------------------------------------------------------------------------------------------------ routes
/** Where a route is at u metres along it. out: x, y, z, width, tangent x, y, z, a post's place across the school, its gap. The same sum as fishRoute in the shader. */
function routeEval(data, k, u, L, out) {
  let f = u / L; f = (f - Math.floor(f)) * ROUTE_N;
  let i1 = Math.floor(f); const x = f - i1; i1 %= ROUTE_N;
  const i0 = (i1 + ROUTE_N - 1) % ROUTE_N, i2 = (i1 + 1) % ROUTE_N, i3 = (i1 + 2) % ROUTE_N, row = 2 * k * ROUTE_N * 4, x2 = x * x, x3 = x2 * x;
  const w0 = (1 - 3 * x + 3 * x2 - x3) / 6, w1 = (4 - 6 * x2 + 3 * x3) / 6, w2 = (1 + 3 * x + 3 * x2 - 3 * x3) / 6, w3 = x3 / 6;
  const d0 = -0.5 * (1 - x) * (1 - x), d1 = 0.5 * (3 * x2 - 4 * x), d2 = 0.5 * (-3 * x2 + 2 * x + 1), d3 = 0.5 * x2;
  const a = row + i0 * 4, b = row + i1 * 4, c = row + i2 * 4, d = row + i3 * 4;
  for (let j = 0; j < 4; j++) out[j] = data[a + j] * w0 + data[b + j] * w1 + data[c + j] * w2 + data[d + j] * w3;
  let tx = data[a] * d0 + data[b] * d1 + data[c] * d2 + data[d] * d3, ty = data[a + 1] * d0 + data[b + 1] * d1 + data[c + 1] * d2 + data[d + 1] * d3, tz = data[a + 2] * d0 + data[b + 2] * d1 + data[c + 2] * d2 + data[d + 2] * d3;
  const l = Math.hypot(tx, ty, tz);
  if (l > 1e-6) { tx /= l; ty /= l; tz /= l; } else { tx = 0; ty = 0; tz = 1; }
  out[4] = tx; out[5] = ty; out[6] = tz;
  const rb = row + ROUTE_N * 4;
  out[7] = lerp(data[rb + i1 * 4], data[rb + i2 * 4], x); out[8] = lerp(data[rb + i1 * 4 + 1], data[rb + i2 * 4 + 1], x);
  return out;
}
const push = (d, g) => { const q = Math.max(0, 1 - d / (2 * g + 1e-5)); return g * q * q; };

/** Realm coordinates of a point given as [x, y, z], [x, y, z, width], or { s, d, y, width } (metres along the waterway, right of its centre line, height). */
function pointOf(ctx, p) {
  if (Array.isArray(p)) return [p[0], p[1], p[2], p[3] ?? 1];
  if (p.s !== undefined) { const v = ctx.kit.at(p.s, p.d || 0, p.y ?? -1); return [v.x, v.y, v.z, p.width ?? 1]; }
  return [p.x, p.y ?? -1, p.z, p.width ?? 1];
}

/** Lay a closed route through points, evenly by distance, into row k of the routes; returns its length in metres. */
function bakeRoute(data, k, pts) {
  const row = 2 * k * ROUTE_N * 4;
  if (pts.length === 1) {                                     // a school that stays in one place
    for (let i = 0; i < ROUTE_N; i++) { data[row + i * 4] = pts[0][0]; data[row + i * 4 + 1] = pts[0][1]; data[row + i * 4 + 2] = pts[0][2]; data[row + i * 4 + 3] = pts[0][3] ?? 1; }
    return 1;
  }
  const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p[0], p[1], p[2])), true, 'centripetal');
  curve.arcLengthDivisions = Math.max(400, pts.length * 40);
  const L = curve.getLength(), sp = curve.getSpacedPoints(ROUTE_N);
  // the width given at each control point, carried round by distance
  const fine = curve.getPoints(pts.length * 24), acc = [0];
  for (let i = 1; i < fine.length; i++) acc.push(acc[i - 1] + fine[i].distanceTo(fine[i - 1]));
  const at = pts.map((_, i) => acc[Math.round(i / pts.length * (fine.length - 1))] / acc[acc.length - 1]);
  const width = (u) => {
    let j = 0; while (j < at.length - 1 && u > at[j + 1]) j++;
    const u0 = at[j], u1 = j + 1 < at.length ? at[j + 1] : 1, w0 = pts[j][3] ?? 1, w1 = (pts[(j + 1) % pts.length][3]) ?? 1, f = u1 > u0 ? clamp((u - u0) / (u1 - u0), 0, 1) : 0;
    return w0 + (w1 - w0) * f * f * (3 - 2 * f);
  };
  for (let i = 0; i < ROUTE_N; i++) { const p = sp[i]; data[row + i * 4] = p.x; data[row + i * 4 + 1] = p.y; data[row + i * 4 + 2] = p.z; data[row + i * 4 + 3] = width(i / ROUTE_N); }
  return L;
}

/** Lay a closed line of straight pieces into row k, evenly by distance, as it is (a wandering point's legs and its quick turns). Returns its length. */
function bakePolyline(data, k, pts) {
  const row = 2 * k * ROUTE_N * 4, n = pts.length, acc = [0];
  for (let i = 0; i < n; i++) { const a = pts[i], b = pts[(i + 1) % n]; acc.push(acc[i] + Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2])); }
  const L = acc[n];
  let j = 0;
  for (let i = 0; i < ROUTE_N; i++) {
    const d = i / ROUTE_N * L;
    while (j < n - 1 && acc[j + 1] < d) j++;
    const a = pts[j], b = pts[(j + 1) % n], f = acc[j + 1] > acc[j] ? (d - acc[j]) / (acc[j + 1] - acc[j]) : 0;
    data[row + i * 4] = lerp(a[0], b[0], f); data[row + i * 4 + 1] = lerp(a[1], b[1], f); data[row + i * 4 + 2] = lerp(a[2], b[2], f); data[row + i * 4 + 3] = 1;
  }
  return L;
}

/** Round every corner of a closed line of waypoints with an arc of radius r, and return the line as many short pieces. */
function roundCorners(way, r, step = 0.02) {
  const n = way.length, out = [];
  for (let i = 0; i < n; i++) {
    const p0 = way[(i + n - 1) % n], p1 = way[i], p2 = way[(i + 1) % n];
    let ax = p0[0] - p1[0], az = p0[2] - p1[2], bx = p2[0] - p1[0], bz = p2[2] - p1[2];
    const la = Math.hypot(ax, az), lb = Math.hypot(bx, bz); ax /= la; az /= la; bx /= lb; bz /= lb;
    const cosA = clamp(ax * bx + az * bz, -1, 1), half = Math.acos(cosA) / 2;      // half the angle between the two legs
    if (half > 1.5 || half < 0.05) { out.push([p1[0], p1[1], p1[2]]); continue; }  // nearly straight on (or a full reverse): no arc
    const t = Math.min(r / Math.tan(half), la * 0.45, lb * 0.45), rr = t * Math.tan(half);      // where the arc leaves each leg
    const sx = p1[0] + ax * t, sz = p1[2] + az * t, ex = p1[0] + bx * t, ez = p1[2] + bz * t;
    let mx = ax + bx, mz = az + bz; const ml = Math.hypot(mx, mz) || 1; mx /= ml; mz /= ml;
    const cx = p1[0] + mx * rr / Math.sin(half), cz = p1[2] + mz * rr / Math.sin(half);
    let a0 = Math.atan2(sz - cz, sx - cx), a1 = Math.atan2(ez - cz, ex - cx), da = a1 - a0;
    while (da > Math.PI) da -= TAU; while (da < -Math.PI) da += TAU;
    const m = Math.max(2, Math.ceil(Math.abs(da) * rr / step));
    for (let j = 0; j <= m; j++) { const a = a0 + da * j / m; out.push([cx + Math.cos(a) * rr, p1[1], cz + Math.sin(a) * rr]); }
  }
  return out;
}

/** Posts (lamp posts, piers) that a school parts round: written into the route's second row as a place across the school and a gap. */
function bakePosts(data, k, posts, reach = 3.5) {
  const row = 2 * k * ROUTE_N * 4, rb = row + ROUTE_N * 4;
  for (let i = 0; i < ROUTE_N; i++) {
    const a = row + i * 4, b = row + ((i + 1) % ROUTE_N) * 4, c = row + ((i + ROUTE_N - 1) % ROUTE_N) * 4;
    let tx = data[b] - data[c], tz = data[b + 2] - data[c + 2]; const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l;
    let best = 0, where = 0;
    for (const p of posts) {
      const dx = p.x - data[a], dz = p.z - data[a + 2], along = dx * tx + dz * tz, across = dx * tz - dz * tx;      // across: toward the school's own left
      const g = ((p.r ?? 0.2) + (p.clear ?? 0.35)) * (1 - smooth(0.25 * reach, reach, Math.abs(along))) * (1 - smooth(4, 7, Math.abs(across)));
      if (g > best) { best = g; where = across; }
    }
    data[rb + i * 4] = where; data[rb + i * 4 + 1] = best;
  }
}

/**
 * A closed route for a wandering point: straight legs with a turn at the end of each, inside a pool.
 * home: { x, z, r } or { s, d, r }: a round pool; or { s: [a, b], d: [a, b] }: a stretch of the waterway.
 * avoid: [{ x, z, r }] places the point never enters. depth: [shallowest, deepest] of the point, metres under the surface.
 */
function wanderRoute(ctx, rnd, home, { leg = [2, 4], turn = [0.7, 1.9], legs = 30, depth = [0.2, 0.3], avoid = [] } = {}) {
  let inside, start;
  if (Array.isArray(home.s)) {
    const s0 = home.s[0], s1 = home.s[1], d0 = home.d[0], d1 = home.d[1];
    const loc = {};
    inside = (x, z) => { ctx.path.locate(x, z, (s0 + s1) / 2, loc); return loc.s > s0 && loc.s < s1 && loc.d > d0 && loc.d < d1; };
    const v = ctx.kit.at((s0 + s1) / 2, (d0 + d1) / 2, 0); start = [v.x, v.z];
  } else {
    let cx = home.x, cz = home.z; if (home.s !== undefined) { const v = ctx.kit.at(home.s, home.d || 0, 0); cx = v.x; cz = v.z; }
    const r = home.r ?? 3;
    inside = (x, z) => Math.hypot(x - cx, z - cz) < r;
    start = [cx + (rnd() - 0.5) * r * 0.6, cz + (rnd() - 0.5) * r * 0.6];
  }
  const ok = (x, z) => inside(x, z) && !avoid.some((a) => Math.hypot(x - a.x, z - a.z) < (a.r ?? 1));
  const pts = [], y = (j) => -lerp(depth[0], depth[1], 0.5 + 0.5 * Math.sin(j * 0.83 + 1.7));
  let x = start[0], z = start[1], h = rnd() * TAU;
  pts.push([x, y(0), z]);
  for (let j = 1; j < legs; j++) {
    const home2 = j > legs - 4;                                // the last legs go home, so the loop closes without a long leap
    let nx = x, nz = z, nh = h, found = false;
    for (let tries = 0; tries < 24 && !found; tries++) {
      const len = lerp(leg[0], leg[1], rnd());
      if (home2) nh = Math.atan2(start[0] - x, start[1] - z) + (rnd() - 0.5) * 0.5;
      else nh = h + (rnd() < 0.5 ? -1 : 1) * lerp(turn[0], turn[1], rnd()) * (tries > 12 ? 1.6 : 1);
      nx = x + Math.sin(nh) * len; nz = z + Math.cos(nh) * len;
      found = ok(nx, nz);
    }
    if (!found) { nh = Math.atan2(start[0] - x, start[1] - z); const len = leg[0]; nx = x + Math.sin(nh) * len; nz = z + Math.cos(nh) * len; }
    if (home2 && Math.hypot(nx - start[0], nz - start[1]) < leg[0] * 0.8) break;
    x = nx; z = nz; h = nh; pts.push([x, y(j), z]);
  }
  return pts;
}

// ------------------------------------------------------------------------------------------------ the shader
// fishPos: where a fish is at a time. Keep Fish.posAt (below) in step with it, line for line.
const FISH_GLSL = /* glsl */`
  attribute vec4 aSt;      // its station: metres along the school, across it, deep in it; its length
  attribute vec4 aW;       // its place in the ball (metres, the realm's axes); which school
  attribute vec4 aRnd;     // four numbers of its own
  attribute vec4 aEv;      // an event of its own: when it began, its kind (1 a rise, 2 a sip, 3 a dash), a turn of its own (radians), a number for the event
  attribute vec4 aFin;     // for a fin that sculls: its hinge, and 1 for the left fin, 2 for the right
  attribute float aPart;   // how much of a flank this point is (0..1), or -1 on a fin
  uniform sampler2D tRoute;
  uniform float uNow;
  uniform vec4 uS0[FISH_K], uS1[FISH_K], uS2[FISH_K], uB0[FISH_K], uB1[FISH_K];
  uniform vec4 uBurst, uForm, uLimits, uHull0, uHull1, uHull2, uThreat[FISH_T], uThreatV[FISH_T], uEvt, uEvt2;
  uniform vec4 uWave, uBeat, uPec, uShape, uStreak, uSwell[3];
  uniform vec3 uTintA, uTintB; uniform vec2 uGlowV, uBody; uniform float uTilt, uRefr, uInPre;
  varying vec4 vFish; varying vec3 vModel, vTint; varying float vFishY;

  vec3 fishRotY(vec3 v, float a) { float c = cos(a), s = sin(a); return vec3(v.x * c + v.z * s, v.y, v.z * c - v.x * s); }
  // how far a round thing of size g moves a point that lies d from its middle: out to g at its heart, nothing beyond 2 g
  float fishPush(float d, float g) { float q = max(0.0, 1.0 - d / (2.0 * g + 1e-5)); return g * q * q; }
  float fishSwell(vec2 xz) {
    float h = 0.0;
    for (int i = 0; i < 3; i++) { float ph = dot(uSwell[i].xy, xz) - uSwell[i].z, a = uSwell[i].w; h += a * cos(ph) + 0.5 * length(uSwell[i].xy) * a * a * cos(2.0 * ph); }
    return h;
  }
  void fishRoute(int k, float u, float L, out vec4 R, out vec3 T, out vec2 Q) {
    float f = fract(u / L) * float(FISH_N);
    int i1 = int(floor(f)); float x = f - float(i1); i1 = i1 % FISH_N;
    int i0 = (i1 + FISH_N - 1) % FISH_N, i2 = (i1 + 1) % FISH_N, i3 = (i1 + 2) % FISH_N;
    vec4 p0 = texelFetch(tRoute, ivec2(i0, 2 * k), 0), p1 = texelFetch(tRoute, ivec2(i1, 2 * k), 0), p2 = texelFetch(tRoute, ivec2(i2, 2 * k), 0), p3 = texelFetch(tRoute, ivec2(i3, 2 * k), 0);
    float x2 = x * x, x3 = x2 * x;
    R = (p0 * (1.0 - 3.0 * x + 3.0 * x2 - x3) + p1 * (4.0 - 6.0 * x2 + 3.0 * x3) + p2 * (1.0 + 3.0 * x + 3.0 * x2 - 3.0 * x3) + p3 * x3) / 6.0;
    vec3 d = p0.xyz * (-0.5 * (1.0 - x) * (1.0 - x)) + p1.xyz * (0.5 * (3.0 * x2 - 4.0 * x)) + p2.xyz * (0.5 * (-3.0 * x2 + 2.0 * x + 1.0)) + p3.xyz * (0.5 * x2);
    float l = length(d);
    T = l > 1e-6 ? d / l : vec3(0.0, 0.0, 1.0);
    Q = mix(texelFetch(tRoute, ivec2(i1, 2 * k + 1), 0).xy, texelFetch(tRoute, ivec2(i2, 2 * k + 1), 0).xy, x);
  }
  // 1 while a fish is to be seen (a fish of a pool exists only while its event runs)
  float fishShow(float t) {
    if (uEvt2.z < 0.5) return 1.0;
    float tau = t - aEv.x, life = aEv.y < 1.5 ? uEvt.x : aEv.y < 2.5 ? uEvt.z : uEvt2.y, x = tau / life;
    return (aEv.y > 0.5 && tau > 0.0 && tau < life) ? smoothstep(0.0, 0.14, x) * (1.0 - smoothstep(0.86, 1.0, x)) : 0.0;      // (it grows out of the depth and is lost in it again: begun at a third of its size it popped into view)
  }
  vec3 fishPos(float t, int k, out vec3 hdir, out float path) {
    vec4 S0 = uS0[k]; float dt = t - uNow;
    // its station along the school: it surges a little ahead and falls back
    float u = S0.x + S0.y * dt + aSt.x + uForm.w * sin(t * (0.23 + 0.31 * aRnd.y) + 6.2832 * aRnd.x);
    vec4 R; vec3 T; vec2 Q; fishRoute(k, u, S0.w, R, T, Q);
    vec2 th = T.xz; float tl = length(th); th = tl > 1e-3 ? th / tl : vec2(0.0, 1.0);
    vec3 left = vec3(th.y, 0.0, -th.x);
    hdir = fishRotY(vec3(th.x, 0.0, th.y), aEv.z);
    // the school parts round a post that stands in its way
    float b = aSt.y * R.w, d = b - Q.x;
    if (Q.y > 0.0) b = Q.x + (d < 0.0 ? -1.0 : 1.0) * (abs(d) + fishPush(abs(d), Q.y));
    vec3 P = R.xyz + left * b + vec3(0.0, aSt.z * R.w, 0.0) + fishRotY(aW.xyz, uForm.x * t * (0.85 + 0.3 * aRnd.z))
      + uForm.y * vec3(sin(t * uForm.z * (0.7 + 0.6 * aRnd.x) + 6.2832 * aRnd.y), 0.5 * sin(t * uForm.z * (0.5 + 0.7 * aRnd.w) + 6.2832 * aRnd.z), sin(t * uForm.z * (0.6 + 0.5 * aRnd.z) + 6.2832 * aRnd.w));
    // a fright: the fish darts away from where it began, swings round and comes back to its place
    path = 0.0;
    vec4 b0 = uB0[k], b1 = uB1[k];
    if (b1.x > 0.0) {
      vec3 rel = P - (uS1[k].xyz + uS2[k].xyz * dt) - b0.xyz + (aRnd.xyz - 0.5) * 0.06;
      float dist = length(rel), tau = t - b0.w - dist / uBurst.x - 0.15 * aRnd.x;
      if (tau > 0.0) {
        vec3 dir = normalize(vec3(rel.x, rel.y * uBurst.z, rel.z));
        float R1 = b1.x * (0.55 + 0.9 * aRnd.y) * (1.0 - smoothstep(0.55 * b1.w, b1.w, dist));
        float To = b1.y * (0.8 + 0.4 * aRnd.z), Tb = b1.z * (0.75 + 0.5 * aRnd.w);
        float x = min(tau / To, 1.0), go = 1.0 - (1.0 - x) * (1.0 - x);
        float y = clamp((tau - To) / Tb, 0.0, 1.0), back = y * y * (3.0 - 2.0 * y);
        float z = clamp((tau - 0.5 * To) / (0.5 * To + Tb), 0.0, 1.0);
        dir = fishRotY(dir, (aRnd.x > 0.5 ? 1.0 : -1.0) * uBurst.y * (0.5 + aRnd.z) * z * z * (3.0 - 2.0 * z));
        P += dir * (R1 * go * (1.0 - back));
        path = R1 * (go + back);
      }
    }
    // never through the surface
    float over = P.y - uLimits.x; P.y = uLimits.x + 0.5 * (over - sqrt(over * over + 0.0009));
    // an event of its own
    float kind = aEv.y, ta = t - aEv.x;
    if (kind > 0.5 && ta > 0.0) {
      if (kind < 1.5) { float x = ta / uEvt.x; if (x < 1.0) { P.y += (uEvt.y * aSt.w - P.y) * pow(sin(3.14159 * x), 1.5); P += hdir * (uEvt2.w * aSt.w * (x - 0.5)); } }
      else if (kind < 2.5) {
        // a sip: it comes up in the first quarter, all but stops with its lips at the surface (a fish that swam on
        // under its own ring looked as if the ring had been dropped on it), sinks, and makes up the ground it lost
        float x = ta / uEvt.z;
        if (x < 1.0) {
          P.y += (uEvt.w * aSt.w - P.y) * smoothstep(0.0, 0.28, x) * (1.0 - smoothstep(0.36, 0.7, x));
          P.xz -= th * (S0.y * uEvt.z * 0.213 * smoothstep(0.04, 0.44, x) * (1.0 - smoothstep(0.46, 1.0, x)));
        }
      }
      else { float x = min(ta / uEvt2.y, 1.0); P += hdir * (uEvt2.x * aEv.w * uEvt2.y * x * (1.0 - 0.35 * x)); }
    }
    P.y = max(P.y, uLimits.y);
    // the hull: a fish near its line is moved out round it, or down under it
    if (uHull1.x > 0.0) {
      vec2 q = P.xz - (uHull0.xy + uHull2.zw * dt);
      float ca = clamp(dot(q, uHull0.zw), -uHull2.x, uHull2.y);
      vec3 dv = vec3(q.x - uHull0.z * ca, P.y * uHull1.y, q.y - uHull0.w * ca);
      float dl = length(dv), g = uHull1.x * (1.0 - smoothstep(0.6 * uHull1.z, uHull1.z, -P.y));
      P += dv / max(dl, 1e-3) * fishPush(dl, g);
    }
    // anything large that comes through
    for (int i = 0; i < FISH_T; i++) {
      vec4 q = uThreat[i];
      if (q.w > 0.0) { vec3 dv = P - (q.xyz + uThreatV[i].xyz * dt); float dl = length(dv); P += dv / max(dl, 1e-3) * fishPush(dl, q.w); }
    }
    P.y = clamp(P.y, uLimits.y, max(uLimits.x, -0.012));
    return P;
  }
`;

// The body of a fish, placed and posed: the wave that runs tailward and grows, the bend into a turn, the roll, the
// pectoral fins that scull while it hangs still. (vertexLocal of the gouache material: `transformed`, `objectNormal`.)
const FISH_VERTEX = /* glsl */`
  int fk = int(aW.w + 0.5);
  vec3 fH, fH2; float fPath, fPath2;
  vec3 fP0 = fishPos(uNow, fk, fH, fPath), fPm = fishPos(uNow - FISH_EPS, fk, fH2, fPath2), fPp = fishPos(uNow + FISH_EPS, fk, fH2, fPath2);
  vec3 fV1 = (fP0 - fPm) / FISH_EPS, fV2 = (fPp - fP0) / FISH_EPS, fVel = 0.5 * (fV1 + fV2);
  float fSp = length(fVel);
  // a fish that hangs still keeps a heading of its own; one that has all but stopped to sip holds it firmly (what
  // little way it still has, forward or back, must not swing it round)
  float fSipX = (aEv.y > 1.5 && aEv.y < 2.5) ? (uNow - aEv.x) / uEvt.z : -1.0;
  float fHang = (fSipX > 0.0 && fSipX < 1.0) ? smoothstep(0.02, 0.2, fSipX) * (1.0 - smoothstep(0.45, 0.7, fSipX)) : 0.0;
  vec3 fBias = fH * (uLimits.w * (1.0 + 8.0 * fHang));
  vec3 fF = fVel + fBias;
  float fFl = max(length(fF.xz), 1e-4);
  fF.y = clamp(fF.y, -uLimits.z * fFl, uLimits.z * fFl); fF = normalize(fF);
  // a sip: the head tilts up to the surface, and levels again
  if (fSipX > 0.0 && fSipX < 1.0) fF = normalize(fF + vec3(0.0, uTilt * smoothstep(0.03, 0.27, fSipX) * (1.0 - smoothstep(0.35, 0.6, fSipX)), 0.0));
  vec2 fD1 = normalize(fV1.xz + fBias.xz + vec2(0.0, 1e-5)), fD2 = normalize(fV2.xz + fBias.xz + vec2(0.0, 1e-5));
  float fTurn = (fD1.y * fD2.x - fD1.x * fD2.y) / FISH_EPS;   // radians a second, positive toward its own left
  float fRoll = clamp(fTurn * uShape.x, -uShape.y, uShape.y);
  float fBend = clamp(fTurn / max(fSp, 0.12) * aSt.w, -uShape.z, uShape.z);      // how sharply the body curves, per body length
  vec3 fL = normalize(vec3(fF.z, 0.0, -fF.x)), fU = cross(fF, fL);
  // the tail beat: its phase is kept by the school (so it never jumps when the school changes pace), each fish a little off
  float fRate = 0.9 + 0.05 * floor(aRnd.w * 4.999);
  float fPh = uS0[fk].z * fRate + 6.2832 * aRnd.x + fPath * uBurst.w;
  float fGo = smoothstep(0.0, uBeat.y, fSp);
  float fAmp = mix(uBeat.x, 1.0, fGo);
  float fGl = 0.5 + 0.5 * sin(uNow * (2.6 + 2.2 * aRnd.y) + 6.2832 * aRnd.z);      // a few beats, then a glide
  fAmp *= mix(1.0, 0.3 + 0.7 * smoothstep(0.25, 0.75, fGl), uBeat.w * (1.0 - smoothstep(uBeat.y, 2.5 * uBeat.y, fSp)));
  fAmp *= 1.0 + 0.25 * smoothstep(2.0 * uBeat.y, 5.0 * uBeat.y, fSp);
  vec3 fp = position, fn = normal;
  if (aFin.w > 0.5) {                                         // a pectoral fin: folded along the body at speed, open and sculling at rest
    float fSide = aFin.w < 1.5 ? 1.0 : -1.0;
    float fOpen = mix(uPec.x, uPec.y, fGo) + uPec.z * (1.0 - fGo) * sin(uNow * uPec.w + fSide * 1.5708 + 6.2832 * aRnd.x);
    fp = aFin.xyz + fishRotY(fp - aFin.xyz, -fSide * fOpen); fn = fishRotY(fn, -fSide * fOpen);
  }
  float fs = 0.5 - fp.z;                                      // 0 at the snout, 1 at the tips of the tail
  float fEnv = uWave.x + uWave.y * fs + uWave.z * fs * fs, fKk = 6.2832 / uWave.w, fArg = fPh - fKk * fs;
  float fLat = fAmp * fEnv * sin(fArg) + 0.5 * fBend * fp.z * fp.z;
  float fSlope = fAmp * ((uWave.y + 2.0 * uWave.z * fs) * sin(fArg) - fEnv * fKk * cos(fArg)) - fBend * fp.z;
  float fInv = inversesqrt(1.0 + fSlope * fSlope);
  vec3 fq = vec3(fLat + fp.x * fInv, fp.y, fp.z + fp.x * fSlope * fInv);
  vec3 fnn = vec3(fn.x * fInv - fn.z * fSlope * fInv, fn.y, fn.x * fSlope * fInv + fn.z * fInv);
  float fCr = cos(fRoll), fSr = sin(fRoll);
  vec3 fL2 = fL * fCr - fU * fSr, fU2 = fU * fCr + fL * fSr;
  transformed = fP0 + (fL2 * fq.x + fU2 * fq.y + fF * fq.z) * (aSt.w * fishShow(uNow));
  objectNormal = normalize(fL2 * fnn.x + fU2 * fnn.y + fF * fnn.z);
  // Seen through the surface. Water makes what is under it look shallower than it is, the more so the lower the eye
  // looks: depths shrink by tan(refracted) / tan(seen), which is sin(e) / sqrt(n * n - 1 + sin(e) * sin(e)) for an eye
  // looking down at e: to three quarters straight down, to a half at thirty degrees, to a third at twenty (a fish
  // three metres from the boat), to a sixth at eight. Drawn along the straight line of sight a fish beside the boat
  // shows its whole flank, like a paper fish laid on its side in the water (a carp sipping looked like a dead one
  // afloat); in truth the rider sees a slim thing, as much back as flank. So every point of a fish that is under the
  // surface is drawn as the water would show it, at every distance:
  //   - a fish near the surface (its middle less than 0.6 m down: rudd, carp, fry, a fish that rises) has every depth
  //     shrunk about the SURFACE, as in nature: it is drawn that much shallower, all its parts keep their proportions
  //     (when only the lower points were shrunk, a carp's dorsal fin stood on a slimmed body like a shark's), nothing
  //     is pushed through the surface, and a point that reaches the surface is exactly where it truly is, so a back
  //     breaks the water whole and a ring lies over the mouth that made it. Being drawn shallower it is also hidden
  //     by about as much water as truly lies on the line of sight (the straight line to its true depth, seen low,
  //     runs through three times too much);
  //   - a fish deep down (below 2.4 m: the town's ribbons) keeps its own depth and is only slimmed about its own
  //     middle, so that it stays in its street beside walls and posts that the water does not lift.
  // (Light falls on the fish as it is: only where its points are drawn changes, not which way its sides face.)
  float fFar = 0.0, fMidY = fP0.y;
  vFishY = transformed.y;
  if (uRefr > 0.0 && uCameraPos.y > 0.0 && fP0.y < 0.0) {
    vec3 fE = uCameraPos - fP0; float fe = fE.y / max(length(fE), 1e-3);
    fFar = uRefr * (1.0 - smoothstep(0.18, 0.5, fe));
    float fr = max(fe / sqrt(0.769 + fe * fe), 0.12);
    // (never thinner than the screen can draw: a small fish far off keeps what little height it has, or it would fall between the pixels)
    fr = max(fr, min(1.0, 1.2 * uStreak.z * length(fE) / (aSt.w * uBody.x * max(sqrt(1.0 - fe * fe), 0.35))));
    fr = mix(1.0, fr, uRefr);
    fMidY = fP0.y * mix(fr, 1.0, smoothstep(0.6, 2.4, -fP0.y));
    if (transformed.y < 0.0) transformed.y = fMidY + fr * (transformed.y - fP0.y);
  }
  // The water keeps a picture of its own of what lies beneath (three quarters the size of the screen's, and not
  // smoothed) and adds only the difference it makes. Where its copy of a small thing reaches past the thing as the
  // screen draws it, the bed behind shows there raw: every fish over a lit street wore a pale fringe. So in that
  // picture a fish is drawn a pixel and a half slimmer all round its axis (one too thin for that is left out): the
  // copy never reaches past the fish, and what fringe is left is of the fish's own colour.
  if (uInPre > 0.5) {
    vec3 fo = transformed - vec3(fP0.x, fMidY, fP0.z); fo -= fF * dot(fo, fF);
    transformed -= fo * min(1.0, 0.9 * uStreak.z * length(uCameraPos - fP0) / max(length(fo), 1e-5));
  }
  transformed.y += fishSwell(fP0.xz);
  // the glint: a rolled flank catches the sky only for the moment it passes the right angle, each fish at a moment
  // of its own, so a school that turns shows a ripple of brief pale flanks and never goes pale all at once
  float fGlint = pow(0.5 + 0.5 * sin(uNow * (6.4 + 4.2 * aRnd.y) + 6.2832 * aRnd.z), 3.0);
  vFish = vec4(smoothstep(uShape.w, uShape.w * 4.0, abs(fRoll)) * fGlint, aPart, fSp, fFar);
  vModel = position;
  vTint = mix(uTintA, uTintB, aRnd.w) * (0.9 + 0.2 * aRnd.z);
`;

// A fish drawn as the light it makes: a sliver that reaches from where the fish is back to where it was a moment
// ago, along the way it really came, so its length is its speed and it curves when the fish curves.
const LIGHT_VERTEX = /* glsl */`
  int fk = int(aW.w + 0.5);
  vec3 fH, fH2; float fPath, fPath2;
  float fs = 0.5 - position.z;
  float fTv = uNow - fs * uStreak.x;
  vec3 fPa = fishPos(fTv, fk, fH, fPath), fPb = fishPos(fTv + 0.05, fk, fH2, fPath2);
  vec3 fD = fPb - fPa; float fDl = length(fD), fSp = fDl / 0.05;
  vec3 fF = fDl > 1e-4 ? fD / fDl : fH;
  vec3 fC = fPa + fF * (position.z * aSt.w);
  fC.y += fishSwell(fC.xz);
  // the ribbon lies across the line of sight (flat on the water where the eye looks straight along it)
  vec3 fV = fC - uCameraPos, fL = cross(fF, fV); float fLl = length(fL);
  fL = fLl > 1e-4 * length(fV) ? fL / fLl : normalize(vec3(fF.z, 0.0, -fF.x) + vec3(1e-4, 0.0, 0.0));
  // never thinner than the screen can draw: too far to fill a pixel means fainter, not a bright speck
  float fW = aSt.w * uStreak.y, fMin = length(fV) * uStreak.z, fGain = min(1.0, fW / max(fMin, 1e-5));
  float fOn = fishShow(uNow);
  transformed = fC + fL * (position.x * max(fW, fMin) * fOn);
  objectNormal = vec3(0.0, 1.0, 0.0);
  float fLife = 1.0;
  if (uEvt2.z > 0.5) { float fx = clamp((uNow - aEv.x) / uEvt2.y, 0.0, 1.0); fLife = pow(sin(3.14159 * fx), 0.6); }
  vFish = vec4(0.0, 0.0, (uStreak.w + (1.0 - uStreak.w) * smoothstep(uGlowV.x, uGlowV.y, fSp)) * pow(1.0 - fs, 1.5) * fGain * fLife * fOn, fs);
  vFishY = 0.0;
  vModel = position;
  vTint = vec3(0.9 + 0.2 * aRnd.z);
`;

const FISH_FRAG_PARS = /* glsl */`
  varying vec4 vFish; varying vec3 vModel, vTint; varying float vFishY;
  uniform vec4 uFlash, uEye, uScale, uUnder; uniform vec3 uGlowCol, uGold, uUnderLight, uIris; uniform float uRefr;
`;
const FISH_ALBEDO = /* glsl */`
  albedo *= vTint;
  float fScale = 0.0, fEye = 0.0;
  #ifdef FISH_LIGHT
    albedo = vec3(0.0);
  #endif
  #ifdef FISH_DETAIL
    if (vFish.y >= 0.0) {
      vec2 fq = vec2(0.5 - vModel.z, vModel.y);                // along the body from the snout, and up from its axis
      // rows of scales, each a dark edge at its back, as a painter would hint at them; gone when too small to draw
      vec2 fg = fq / uScale.xy; fg.x += 0.5 * mod(floor(fg.y), 2.0);
      float fw = max(fwidth(fg.x), fwidth(fg.y));
      vec2 fc = fract(fg) - vec2(0.0, 0.5);
      float fd = length(fc * vec2(1.0, 1.15));
      fScale = smoothstep(0.6, 0.86, fd) * (1.0 - smoothstep(0.86, 1.0, fd)) * smoothstep(0.175, 0.225, fq.x) * (1.0 - smoothstep(0.76, 0.82, fq.x)) * (1.0 - smoothstep(0.25, 0.6, fw));
      albedo *= 1.0 - uScale.z * fScale;
      // the edge of the gill cover, and the eye: a dark matte pupil half as wide as the eye, in a ring of dull brass
      // (the whole eye painted black was a button: a fish's eye is mostly iris)
      albedo *= 1.0 - 0.28 * (1.0 - smoothstep(0.0, 0.01, abs(fq.x - 0.19 + 1.6 * fq.y * fq.y))) * (1.0 - smoothstep(0.25, 0.6, fw));
      float fEd = length(fq - uEye.xy);
      fEye = 1.0 - smoothstep(uEye.z * 0.44, uEye.z * 0.6, fEd);
      albedo = mix(albedo, uIris, (1.0 - smoothstep(uEye.z * 0.82, uEye.z, fEd)) * (1.0 - fEye));
      albedo = mix(albedo, vec3(0.012, 0.011, 0.014), fEye);
    }
  #endif
`;
const FISH_LIGHT_HOOK = /* glsl */`
  #ifdef FISH_LIGHT
    glow = uGlowCol * vFish.z;
  #else
    // Under the surface the light comes down from above, whatever the hour: a low sun lies on the water and hardly
    // enters it. So the back is lit, the flank (an upright mirror, which shows the dark water beside the fish) is
    // in half shade, the belly in shade; no flank is lit side on by the realm's key light as a thing in the air is.
    // What is above the surface (a back in a rise, a carp's shoulders) takes the realm's light as it stands.
    float fUnder = uRefr * (1.0 - smoothstep(-0.02, 0.0, vFishY));
    float fPart = max(vFish.y, 0.0);
    if (fUnder > 0.0) {
      vec3 fDown = uSkyLight * uUnder.x + uRampLight * uKeyColor * (uUnder.y * clamp(-uKeyDir.y, 0.0, 1.0));      // what comes down through the surface
      float fTop = mix(uUnder.z, 1.0, smoothstep(-0.5, 0.9, N.y));                                                 // the back, then the flank, then the belly
      vec3 fWet = albedo * (fDown * fTop * (1.0 - 0.3 * fPart) + lamps * uUnder.w                                  // (a flank mirrors the dark water beside it)
        + uUnderLight * (1.15 - 0.6 * smoothstep(-0.5, 0.9, N.y)));                                               // light from below or all round (a lit town under the fish): on bellies and flanks first
      c += (fWet - albedo * (mix(vec3(1.0), shade, uShade) + ambient + lamps)) * fUnder;
      c *= 1.0 - fUnder * vFish.w * (0.2 + 0.2 * fPart);                                                           // far off and seen low it is a dark sliver
    }
    // the flank catches the light of the sky as the fish rolls into a turn: a lozenge of light on the fore flank, gone toward the tail
    float fAlong = smoothstep(-0.36, -0.06, vModel.z) * (1.0 - smoothstep(0.2, 0.44, vModel.z));
    c += uFlash.rgb * mix(uSkyLight + 0.5 * uRampLight * uKeyColor, vec3(1.0), uFlash.a) * (vFish.x * fPart * fAlong * smoothstep(0.15, 0.85, N.y));
    #ifdef FISH_DETAIL
      c += uGold * lamps * (1.0 - fScale) * max(vFish.y, 0.0);  // scales show dull gold only where a lamp reaches
    #endif
    // what stands above the surface is wet: darker than the same paint dry (the tail of a rising rudd stood up as an orange flag)
    c *= 1.0 - 0.34 * uRefr * smoothstep(-0.01, 0.01, vFishY);
    c *= 1.0 - 0.94 * fEye;
  #endif
`;

// ------------------------------------------------------------------------------------------------ the system
const _R = new Float64Array(9);

/** One instanced system of fish: the buffers, the uniforms, the material and the school state. Used by every factory here. */
class Fish {
  constructor(ctx, cfg) {
    this.ctx = ctx; this.cfg = cfg; this.now = 0;
    const n = this.count = cfg.count, S = this.species = cfg.species;
    this.St = new Float32Array(n * 4); this.W = new Float32Array(n * 4); this.Rnd = new Float32Array(n * 4); this.Ev = new Float32Array(n * 4);
    this.routeData = new Float32Array(ROUTE_N * 2 * K_MAX * 4);
    for (let i = 3; i < this.routeData.length; i += 4) this.routeData[i] = 1;
    this.schools = [];
    this.form = { spin: 0, wob: 0, wobRate: 0.5, surge: 0 };
    this.limits = { top: -0.05, floor: -1e4, pitch: Math.tan(S.pitch ?? 0.35), bias: S.bias ?? 0.07 };
    this.burstK = { wave: 6, sweep: 1.1, up: 0.3, stride: TAU / (0.65 * (S.length || 0.2)) };
    this.hull = { on: false, radius: 1, vertical: 1, depth: 3, astern: 1.5, ahead: 2.2 };
    this.evt = { rise: 1, riseTop: -0.085, sip: 2.2, sipTop: -0.13, dash: 5, dashFor: 0.5, pooled: 0, travel: 0, tilt: 0.3 };
    this.threats = [];
    const v4 = (m) => Array.from({ length: m }, () => new THREE.Vector4());
    const tex = this.routeTex = new THREE.DataTexture(this.routeData, ROUTE_N, 2 * K_MAX, THREE.RGBAFormat, THREE.FloatType);
    tex.minFilter = tex.magFilter = THREE.NearestFilter; tex.generateMipmaps = false; tex.needsUpdate = true;
    this.sharedSwell = waterUniforms(ctx.engine).uSwell;
    const u = this.uniforms = {
      tRoute: { value: tex }, uNow: { value: 0 }, uTilt: { value: 0.3 }, uRefr: { value: cfg.refract ?? 1 },
      uS0: { value: v4(K_MAX) }, uS1: { value: v4(K_MAX) }, uS2: { value: v4(K_MAX) }, uB0: { value: v4(K_MAX) }, uB1: { value: v4(K_MAX) },
      uBurst: { value: new THREE.Vector4(6, 1.1, 0.3, 1) }, uForm: { value: new THREE.Vector4() }, uLimits: { value: new THREE.Vector4(-0.05, -1e4, 0.35, 0.07) },
      uHull0: { value: new THREE.Vector4(0, 0, 0, -1) }, uHull1: { value: new THREE.Vector4() }, uHull2: { value: new THREE.Vector4(1.5, 2.2, 0, 0) },
      uThreat: { value: v4(T_MAX) }, uThreatV: { value: v4(T_MAX) }, uEvt: { value: new THREE.Vector4(1, -0.085, 2.2, -0.13) }, uEvt2: { value: new THREE.Vector4(5, 0.5, 0, 0) },
      uWave: { value: new THREE.Vector4(...(S.wave || [0.012, -0.05, 0.14, 0.95])) }, uBeat: { value: new THREE.Vector4(S.rest ?? 0.3, S.cruise ?? 0.3, 0, S.glide ?? 0.5) },
      uPec: { value: new THREE.Vector4(...(S.pec || [0, 0, 0, 0])) }, uShape: { value: new THREE.Vector4(S.roll ? S.roll[0] : 0.5, S.roll ? S.roll[1] : 0.6, S.bend ?? 0.8, 0.06) },
      uStreak: { value: new THREE.Vector4(0.25, 0.1, 0.0015, 0.2) }, uSwell: { value: [new THREE.Vector4(0, 0, 0, 0), new THREE.Vector4(0, 0, 0, 0), new THREE.Vector4(0, 0, 0, 0)] }, uGlowV: { value: new THREE.Vector2(0.8, 3) },
      uTintA: { value: new THREE.Color(1, 1, 1) }, uTintB: { value: new THREE.Color(1, 1, 1) },
      uFlash: { value: new THREE.Vector4(0, 0, 0, 0) }, uEye: { value: new THREE.Vector4(0.065, 0.014, 0.02, 0) }, uScale: { value: new THREE.Vector4(0.026, 0.024, 0.2, 0) },
      uGlowCol: { value: new THREE.Color(0, 0, 0) }, uGold: { value: new THREE.Color(0, 0, 0) }, uIris: { value: col(S.iris || '#6e5a2c') },
      uUnder: { value: new THREE.Vector4(1.6, 0.6, 0.4, 0.55) },      // light under the surface: of the sky, of the key light, on the belly; of lamps
      uInPre: { value: 0 },                                           // 1 while the water's own picture of what lies beneath is being drawn
      uUnderLight: { value: new THREE.Color(0, 0, 0) },              // light that reaches the fish from below or from all round (the town's streets)
      uBody: { value: new THREE.Vector2(S.profile ? Math.max(...S.profile.map((q) => q[1] + q[2])) : 0.2, S.profile ? 2 * Math.max(...S.profile.map((q) => q[3])) : 0.1) },      // the body's depth and width, as shares of its length
    };
    const light = cfg.look === 'light';
    const defines = { FISH_K: K_MAX, FISH_T: T_MAX, FISH_N: ROUTE_N, FISH_EPS: EPS.toFixed(3) };
    if (light) defines.FISH_LIGHT = '';
    if (cfg.detail && !light) defines.FISH_DETAIL = '';
    const mat = this.material = ctx.kit.gouache({
      color: '#ffffff', vertexColors: true, brush: 0, shade: 0.85, ...(light ? { side: THREE.DoubleSide } : {}), ...(cfg.paint || {}),
      extend: { defines, uniforms: u, vertexPars: FISH_GLSL, vertexLocal: light ? LIGHT_VERTEX : FISH_VERTEX, fragmentPars: FISH_FRAG_PARS, albedo: FISH_ALBEDO, light: FISH_LIGHT_HOOK },
    });
    const src = cfg.geometry, geo = this.geometry = new THREE.InstancedBufferGeometry();
    for (const k of ['position', 'normal', 'color', 'aFin', 'aPart']) geo.setAttribute(k, src.attributes[k]);
    geo.setIndex(src.index);
    const inst = (name, arr) => { const a = new THREE.InstancedBufferAttribute(arr, 4); geo.setAttribute(name, a); return a; };
    inst('aSt', this.St); inst('aW', this.W); inst('aRnd', this.Rnd); this.evAttr = inst('aEv', this.Ev); this.wAttr = geo.attributes.aW;
    geo.instanceCount = n;
    const mesh = this.object = new THREE.Mesh(geo, mat);
    mesh.name = cfg.name || 'fish'; mesh.frustumCulled = false;
    mesh.onBeforeRender = (renderer, scene, camera) => {      // the angle one pixel covers, for the pass being drawn
      const rt = renderer.getRenderTarget(), h = rt ? rt.height : renderer.getDrawingBufferSize(_size).y;
      u.uStreak.value.z = 1.3 * 2 / (h * camera.projectionMatrix.elements[5]); u.uInPre.value = rt && rt === ctx.engine.pre ? 1 : 0; mat.uniformsNeedUpdate = true;
    };
    (cfg.parent || ctx.group).add(mesh);
    if (cfg.mirror !== true) ctx.only(mesh, 'direct');         // under the surface: the mirror never shows them
    this.pend = [];                                            // rings and marks that are due a moment after an event began
    this.triangles = cfg.triangles * n;
  }

  /** Add a school on a route already baked into row k. */
  addSchool(k, L, o = {}) {
    const sc = { k, L, U: o.start ?? 0, v: 0, phi: (k * 1.7) % PHI_WRAP, speed: o.speed ?? 0.3, mid: o.mid ?? 0, radius: o.radius ?? 1, gait: o.gait || 'cruise',
      centre: new THREE.Vector3(), vel: new THREE.Vector3(), b0: [0, 0, 0, -1e6], b1: [0, 1, 1, 1], lastBurst: -1e6, armed: true, boostAt: -1e6, dart: null, nextDart: o.firstDart ?? 1,
      first: o.first ?? 0, count: o.count ?? 0, w1: 0.21 + 0.05 * k, w2: 0.083 + 0.021 * k, p1: k * 2.1, p2: k * 0.7, lock: null, pace: 1, hold: 1 };
    this.schools[k] = sc;
    return sc;
  }

  uploadRoutes() { this.routeTex.needsUpdate = true; }

  /** Where fish i is at time t (realm coordinates), the same sum as fishPos in the shader. out: [x, y, z]. */
  posAt(i, t, out) {
    const St = this.St, W = this.W, Rn = this.Rnd, Ev = this.Ev, o = i * 4, F = this.form, Lm = this.limits;
    const k = W[o + 3] | 0, sc = this.schools[k], dt = t - this.now;
    const size = St[o + 3], h0 = Rn[o], h1 = Rn[o + 1], h2 = Rn[o + 2], h3 = Rn[o + 3];
    const u = sc.U + sc.v * dt + St[o] + F.surge * Math.sin(t * (0.23 + 0.31 * h1) + TAU * h0);
    const R = routeEval(this.routeData, k, u, sc.L, _R);
    let thx = R[4], thz = R[6]; const tl = Math.hypot(thx, thz);
    if (tl > 1e-3) { thx /= tl; thz /= tl; } else { thx = 0; thz = 1; }
    const lx = thz, lz = -thx, yaw = Ev[o + 2], cy = Math.cos(yaw), sy = Math.sin(yaw), hx = thx * cy + thz * sy, hz = thz * cy - thx * sy;
    let b = St[o + 1] * R[3]; const d = b - R[7];
    if (R[8] > 0) b = R[7] + (d < 0 ? -1 : 1) * (Math.abs(d) + push(Math.abs(d), R[8]));
    const sa = F.spin * t * (0.85 + 0.3 * h2), cs = Math.cos(sa), sn = Math.sin(sa), wx = W[o], wz = W[o + 2];
    let x = R[0] + lx * b + wx * cs + wz * sn + F.wob * Math.sin(t * F.wobRate * (0.7 + 0.6 * h0) + TAU * h1);
    let y = R[1] + St[o + 2] * R[3] + W[o + 1] + F.wob * 0.5 * Math.sin(t * F.wobRate * (0.5 + 0.7 * h3) + TAU * h2);
    let z = R[2] + lz * b + wz * cs - wx * sn + F.wob * Math.sin(t * F.wobRate * (0.6 + 0.5 * h2) + TAU * h3);
    const b0 = sc.b0, b1 = sc.b1;
    if (b1[0] > 0) {
      const rx = x - (sc.centre.x + sc.vel.x * dt) - b0[0] + (h0 - 0.5) * 0.06, ry = y - (sc.centre.y + sc.vel.y * dt) - b0[1] + (h1 - 0.5) * 0.06, rz = z - (sc.centre.z + sc.vel.z * dt) - b0[2] + (h2 - 0.5) * 0.06;
      const dist = Math.hypot(rx, ry, rz), tau = t - b0[3] - dist / this.burstK.wave - 0.15 * h0;
      if (tau > 0) {
        let dx = rx, dy = ry * this.burstK.up, dz = rz; const dl = Math.hypot(dx, dy, dz) || 1; dx /= dl; dy /= dl; dz /= dl;
        const R1 = b1[0] * (0.55 + 0.9 * h1) * (1 - smooth(0.55 * b1[3], b1[3], dist));
        const To = b1[1] * (0.8 + 0.4 * h2), Tb = b1[2] * (0.75 + 0.5 * h3);
        const xx = Math.min(tau / To, 1), go = 1 - (1 - xx) * (1 - xx), yy = clamp((tau - To) / Tb, 0, 1), back = yy * yy * (3 - 2 * yy);
        const zz = clamp((tau - 0.5 * To) / (0.5 * To + Tb), 0, 1), an = (h0 > 0.5 ? 1 : -1) * this.burstK.sweep * (0.5 + h2) * zz * zz * (3 - 2 * zz), ca = Math.cos(an), sb = Math.sin(an);
        const k1 = R1 * go * (1 - back);
        x += (dx * ca + dz * sb) * k1; y += dy * k1; z += (dz * ca - dx * sb) * k1;
      }
    }
    const over = y - Lm.top; y = Lm.top + 0.5 * (over - Math.sqrt(over * over + 0.0009));
    const kind = Ev[o + 1], ta = t - Ev[o], E = this.evt;
    if (kind > 0.5 && ta > 0) {
      if (kind < 1.5) { const xx = ta / E.rise; if (xx < 1) { y += (E.riseTop * size - y) * Math.pow(Math.sin(Math.PI * xx), 1.5); x += hx * E.travel * size * (xx - 0.5); z += hz * E.travel * size * (xx - 0.5); } }
      else if (kind < 2.5) {
        const xx = ta / E.sip;
        if (xx < 1) {
          y += (E.sipTop * size - y) * smooth(0, 0.28, xx) * (1 - smooth(0.36, 0.7, xx));
          const lag = sc.v * E.sip * 0.213 * smooth(0.04, 0.44, xx) * (1 - smooth(0.46, 1, xx)); x -= thx * lag; z -= thz * lag;
        }
      }
      else { const xx = Math.min(ta / E.dashFor, 1), k1 = E.dash * Ev[o + 3] * E.dashFor * xx * (1 - 0.35 * xx); x += hx * k1; z += hz * k1; }
    }
    y = Math.max(y, Lm.floor);
    const H = this.hull;
    if (H.on) {
      const qx = x - (H.x + H.vx * dt), qz = z - (H.z + H.vz * dt), ca = clamp(qx * H.fx + qz * H.fz, -H.astern, H.ahead);
      const dx = qx - H.fx * ca, dy = y * H.vertical, dz = qz - H.fz * ca, dl = Math.hypot(dx, dy, dz), g = H.radius * (1 - smooth(0.6 * H.depth, H.depth, -y)), p = push(dl, g) / Math.max(dl, 1e-3);
      x += dx * p; y += dy * p; z += dz * p;
    }
    for (const th of this.threats) {
      if (!(th.r > 0)) continue;
      const dx = x - (th.x + th.vx * dt), dy = y - (th.y + th.vy * dt), dz = z - (th.z + th.vz * dt), dl = Math.hypot(dx, dy, dz), p = push(dl, th.r) / Math.max(dl, 1e-3);
      x += dx * p; y += dy * p; z += dz * p;
    }
    y = clamp(y, Lm.floor, Math.max(Lm.top, -0.012));
    out[0] = x; out[1] = y + (this.ctx.water.heightAt ? this.swell(x, z) : 0); out[2] = z; out[3] = hx; out[4] = hz;
    return out;
  }

  swell(x, z) { const s = this.uniforms.uSwell.value; let h = 0; for (let i = 0; i < 3; i++) { const v = s[i], ph = v.x * x + v.y * z - v.z, a = v.w; h += a * Math.cos(ph) + 0.5 * Math.hypot(v.x, v.y) * a * a * Math.cos(2 * ph); } return h; }

  /** True while fish i is in the middle of a rise or a sip (a second one begun now would leave the first one's ring behind it). */
  busy(i, t) { const o = i * 4, k = this.Ev[o + 1], d = k > 1.5 && k < 2.5 ? this.evt.sip : k > 0.5 && k < 1.5 ? this.evt.rise : 0; return t - this.Ev[o] < d; }

  /** Begin an event of its own for fish i: kind 1 a rise, 2 a sip, 3 a dash. */
  event(i, kind, t, yaw, par) {
    const o = i * 4; this.Ev[o] = t; this.Ev[o + 1] = kind; if (yaw !== undefined) this.Ev[o + 2] = yaw; if (par !== undefined) this.Ev[o + 3] = par;
    this.evAttr.needsUpdate = true;
  }

  /** A fright in school k, begun at a place (realm coordinates) now. */
  burst(k, x, y, z, t, B) {
    const sc = this.schools[k]; if (!sc) return;
    sc.b0[0] = x - sc.centre.x; sc.b0[1] = y - sc.centre.y; sc.b0[2] = z - sc.centre.z; sc.b0[3] = t;
    sc.b1[0] = B.radius; sc.b1[1] = B.out; sc.b1[2] = B.back; sc.b1[3] = B.reach;
    sc.lastBurst = t; sc.boostAt = t;
  }

  /** Ring the water (and tell the realm) at a time to come. */
  later(time, x, z, strength, radius, kind, k = 0) { this.pend.push({ time, x, z, strength, radius, kind, k }); }

  /** Every frame: the pace and the place of every school, the hull, the things to keep clear of; then the uniforms. */
  step(dt, t) {
    const ctx = this.ctx, u = this.uniforms, boat = ctx.boat, S = this.species, calm = ctx.reducedMotion ? 1 : 0;
    this.now = t; u.uNow.value = t;
    // the sea's swell lifts the fish with the surface (the water's shared numbers are read only while a swell is up)
    for (let i = 0; i < 3; i++) { if (ctx.water.swellOn) u.uSwell.value[i].copy(this.sharedSwell.value[i]); else u.uSwell.value[i].set(0, 0, 0, 0); }
    for (const sc of this.schools) {
      if (!sc) continue;
      let v;
      if (sc.lock) { const U = sc.lock(t); v = dt > 0 ? (U - sc.U) / dt : 0; if (Math.abs(v) > 20) v = 0; sc.U = U; }
      else {
        if (sc.gait === 'hover') {                             // it hangs, and every few seconds darts a hand's breadth on, turning as it goes
          if (!sc.dart && t >= sc.nextDart) sc.dart = { t0: t, T: sc.dartFor || 0.6, dist: sc.dartDist ? sc.dartDist() : 0.25 };
          v = 0;
          if (sc.dart) { const x = (t - sc.dart.t0) / sc.dart.T; if (x >= 1) { sc.dart = null; sc.nextDart = t + (sc.dartGap ? sc.dartGap() : 3); } else v = sc.dart.dist / sc.dart.T * (1 - Math.cos(TAU * x)); }
        } else v = sc.speed * (1 + 0.2 * Math.sin(t * sc.w1 + sc.p1) + 0.1 * Math.sin(t * sc.w2 + sc.p2));
        const bt = t - sc.boostAt, B = this.cfg.burst;           // after a fright the whole school runs on for a while
        if (B && B.boost > 0 && bt >= 0 && bt < B.boostFor + 3) v += (B.boost - sc.speed) * smooth(0, 0.4, bt) * (1 - smooth(B.boostFor, B.boostFor + 3, bt)) * (calm ? 0.4 : 1);
        v *= sc.pace * sc.hold;
        sc.U += v * dt; if (sc.U > sc.L) sc.U -= sc.L; else if (sc.U < 0) sc.U += sc.L;
      }
      sc.v = v;
      const len = this.cfg.length || S.length || 0.2, beat = S.beat || [1.2, 1.3];
      sc.phi = (sc.phi + TAU * (beat[0] + beat[1] * Math.abs(v) / len) * dt) % PHI_WRAP;
      const R = routeEval(this.routeData, sc.k, sc.U + sc.mid, sc.L, _R);
      sc.centre.set(R[0], R[1], R[2]); sc.vel.set(R[4] * v, R[5] * v, R[6] * v);
      u.uS0.value[sc.k].set(sc.U, v, sc.phi, sc.L);
      u.uS1.value[sc.k].set(sc.centre.x, sc.centre.y, sc.centre.z, 0);
      u.uS2.value[sc.k].set(sc.vel.x, sc.vel.y, sc.vel.z, 0);
      u.uB0.value[sc.k].set(sc.b0[0], sc.b0[1], sc.b0[2], sc.b0[3]);
      u.uB1.value[sc.k].set(sc.b1[0], sc.b1[1], sc.b1[2], sc.b1[3]);
    }
    // the hull
    const H = this.hull;
    if (H.on) {
      H.x = boat.x; H.z = boat.z; H.fx = -Math.sin(boat.heading); H.fz = -Math.cos(boat.heading); H.vx = boat.vx || 0; H.vz = boat.vz || 0;
      u.uHull0.value.set(H.x, H.z, H.fx, H.fz); u.uHull1.value.set(H.radius, H.vertical, H.depth, 0); u.uHull2.value.set(H.astern, H.ahead, H.vx, H.vz);
    } else u.uHull1.value.x = 0;
    // large things
    for (let i = 0; i < T_MAX; i++) {
      const th = this.threats[i];
      if (!th || th.off) { u.uThreat.value[i].w = 0; if (th) th.r = 0; continue; }
      const p = th.read();
      if (th.seen) { th.vx = dt > 0 ? (p[0] - th.x) / dt : 0; th.vy = dt > 0 ? (p[1] - th.y) / dt : 0; th.vz = dt > 0 ? (p[2] - th.z) / dt : 0; if (Math.hypot(th.vx, th.vy, th.vz) > 30) th.vx = th.vy = th.vz = 0; } else { th.vx = th.vy = th.vz = 0; th.seen = true; }
      th.x = p[0]; th.y = p[1]; th.z = p[2]; th.r = th.radius;
      u.uThreat.value[i].set(th.x, th.y, th.z, th.r); u.uThreatV.value[i].set(th.vx, th.vy, th.vz, 0);
    }
    const F = this.form, L = this.limits, B = this.burstK, E = this.evt;
    u.uForm.value.set(F.spin, F.wob, F.wobRate, F.surge); u.uLimits.value.set(L.top, L.floor, L.pitch, L.bias);
    u.uBurst.value.set(B.wave, B.sweep, B.up, B.stride);
    u.uEvt.value.set(E.rise, E.riseTop, E.sip, E.sipTop); u.uEvt2.value.set(E.dash, E.dashFor, E.pooled, E.travel); u.uTilt.value = E.tilt;
    // rings that are due
    if (this.pend.length) {
      const P = this.pend;
      for (let i = P.length - 1; i >= 0; i--) {
        const e = P[i]; if (t < e.time) continue;
        if (e.strength > 0) ctx.water.ripple(e.x, e.z, e.strength, e.radius);
        if (this.cfg.onTouch) this.cfg.onTouch(e.x, e.z, e.kind, e.k);
        P[i] = P[P.length - 1]; P.pop();
      }
    }
  }
}

/** Places in a ball (an ellipsoid of half sizes rx, ry, rz), no two nearer than `gap` where there is room. */
function ballPlaces(rnd, n, rx, ry, rz, gap) {
  const out = [];
  for (let i = 0; i < n; i++) {
    let best = null, bestD = -1;
    for (let tries = 0; tries < 14; tries++) {
      let x, y, z; do { x = rnd() * 2 - 1; y = rnd() * 2 - 1; z = rnd() * 2 - 1; } while (x * x + y * y + z * z > 1);
      x *= rx; y *= ry; z *= rz;
      let dmin = 1e9; for (const p of out) { const d = Math.hypot(p[0] - x, (p[1] - y) * 1.6, p[2] - z); if (d < dmin) dmin = d; }
      if (dmin > bestD) { bestD = dmin; best = [x, y, z]; }
      if (dmin >= gap) break;
    }
    out.push(best);
  }
  return out;
}

const SPECIES_OF = (species) => {
  if (typeof species === 'string') { if (!SPECIES[species]) throw new Error(`fish: no species called '${species}' (rudd, carp, school, fry)`); return { name: species, ...SPECIES[species] }; }
  const base = SPECIES[species.like || 'school'];
  return { name: species.like || 'school', ...base, ...given(species) };
};

/**
 * Schools of one species, in one draw call (at most eight schools; make a second system for more).
 *
 *   const rudd = makeSchool(ctx, {
 *     species: 'rudd',
 *     schools: [
 *       { count: 34, home: { s: 14, d: -6, r: 3 }, depth: [0.1, 0.4] },           // a wandering point in a pool 3 m round
 *       { count: 26, route: [[x, y, z], ...] },                                   // or a closed route of its own
 *     ],
 *     onTouch: (x, z, kind) => ctx.audio.play('drop', { x, z }),
 *   });
 *   rudd.burst(0, { x, z });        rudd.threat(pike.group, { radius: 0.9 });
 *
 * opts (docs/life/fish.md says more about each):
 *   species     'rudd' | 'carp' | 'school' | 'fry', or { like: 'school', ...overrides of SPECIES.school }
 *   schools     [{ count, and one of:
 *                    home: { s, d, r } | { x, z, r } | { s: [a, b], d: [a, b] }    a wandering point in that pool
 *                    route: [[x, y, z, width?], ...] | [{ s, d, y, width? }, ...]   a closed route (y under the surface is negative)
 *                    at: [x, y, z]                                                 a school that stays in one place (heading: radians, 0 looks toward +z)
 *                  depth: [shallowest, deepest] (wandering), speed | [lo, hi] m/s, gait: 'cruise' | 'hover', form: 'shoal' |
 *                  'ribbon' | 'file' | 'ball', spread: [half width, half depth, half length], long (metres of ribbon), start
 *                  (0..1 of its route), posts: [{ x, z, r }] it parts round, avoid: [{ x, z, r }] a wandering point keeps out of,
 *                  corner (turn radius, body lengths), leg, turn, every, dart, spacing (body lengths) }]
 *               Without `schools` the options themselves describe one school. Any school key may also be given once for all.
 *   look        'light': drawn as streaks of light whose length is their speed (glow: { color, intensity, seconds, width, rest, from, to })
 *   length, vary             metres, and how much sizes differ (0..1)
 *   colors      { back, flank, belly, fin, finEdge, dusky }     flash: { color, strength, self }     tint: [colour, colour]
 *   detail      'far' (the plainest mesh; chosen by itself above 600 fish) | 'plain' (no scales or eye drawn)
 *   spin        radians a second the ball turns (a ball of fish milling)
 *   hull        false, or { radius, depth, vertical, astern, ahead }: the room given to the boat
 *   burst       false, or { radius, out, back, reach, wave, onHull, trigger, boost, boostFor, boil: [strength, radius], boils, ring, marks }
 *   rises       { kind: 'rise' | 'sip', every: [lo, hi] seconds for each fish, ring: [strength, radius], near }
 *   trace       true or { channel, radius, strength, within, near }: a mark in the water's trace over each back near the surface
 *   top, floor  metres: the highest the middle of a fish may come (negative), and the bed
 *   gold        colour scales take from a lamp (carp)        scales   0..1 how strongly scales are drawn
 *   caustics, shade, steps, rim                               passed to kit.gouache
 *   water       false: no rings        onTouch(x, z, kind, school)   kind: 'rise' | 'sip' | 'boil' | 'burst' | 'pass'
 *   refract     false for fish that are not in the water (a specimen held in the air): they are then drawn as they are,
 *               not as the surface shows them, and lit as things in the air are
 *   underlight  a colour: light that reaches the fish from below or from all round (a lit town under them), on bellies and
 *               flanks first        under: { sky 1.6, key 0.6, belly 0.4, lamps 0.55 }: how the realm's light comes down
 *               through the surface onto them (of the sky, of the key light, how much of it the belly keeps, of lamps)
 *   strays      radians by which each fish's own heading differs from the school's when it hangs still (0.3; 0.5 when hovering)
 *   seed, exact (counts are not thinned by the quality setting), parent
 */
export function makeSchool(ctx, opts = {}) {
  const S = SPECIES_OF(opts.species || 'school'), kit = ctx.kit, rnd = ctx.rng(opts.seed ?? 3), light = opts.look === 'light';
  const list = (opts.schools && opts.schools.length ? opts.schools : [opts]).slice(0, K_MAX);
  if (opts.schools && opts.schools.length > K_MAX) console.error(`INVALID_ fish: a system holds at most ${K_MAX} schools; make a second system for the rest`);
  const counts = list.map((s) => { const c = s.count ?? opts.count ?? 30; return opts.exact || s.exact ? c : kit.count(c); });
  const n = counts.reduce((a, b) => a + b, 0);
  const far = opts.detail === 'far' || (opts.detail == null && S.far && n > 600);
  const built = light ? streakGeometry() : fishGeometry(S, { far, colors: opts.colors });
  const paint = {}; for (const k of ['caustics', 'shade', 'steps', 'brush', 'emissive', 'emissiveIntensity', 'rim']) if (opts[k] !== undefined) paint[k] = opts[k];
  const burst = opts.burst === false ? null : { boostFor: 2, onHull: true, ...S.burst, ...given(opts.burst) };
  const fish = new Fish(ctx, { count: n, species: S, geometry: built.geometry, triangles: built.triangles, look: opts.look, detail: S.detail && !far && opts.detail !== 'plain', paint, parent: opts.parent,
    name: 'fish:' + S.name, burst, onTouch: opts.onTouch, length: opts.length ?? S.length, refract: opts.refract === false ? 0 : opts.refract === undefined || opts.refract === true ? 1 : opts.refract });
  const u = fish.uniforms, len = opts.length ?? S.length, vary = opts.vary ?? S.vary;
  u.uBeat.value.y = (S.cruise ?? 0.3) * len / S.length;
  // ---- how the species moves
  fish.form.surge = opts.surge ?? S.surge; fish.form.wob = (opts.wobble ?? S.wobble[0]); fish.form.wobRate = S.wobble[1]; fish.form.spin = opts.spin ?? 0;
  fish.limits.top = opts.top ?? S.top * len; fish.limits.floor = opts.floor ?? -1e4;
  fish.burstK.wave = burst ? burst.wave : 6; fish.burstK.stride = TAU / (0.65 * len);
  fish.evt.rise = S.rise.seconds; fish.evt.riseTop = S.rise.top; fish.evt.sip = S.sip.seconds; fish.evt.sipTop = S.sip.top; fish.evt.tilt = S.sip.tilt ?? 0.3;
  if (opts.hull !== false) Object.assign(fish.hull, { on: true, radius: S.hull.radius, vertical: S.hull.vertical, depth: S.hull.depth, astern: S.hull.length === 0 ? 0 : 1.5, ahead: S.hull.length === 0 ? 0 : 2.2 }, typeof opts.hull === 'object' ? opts.hull : {});
  const fl = { ...S.flash, ...given(opts.flash) }, fc = col(fl.color).multiplyScalar(fl.strength);
  u.uFlash.value.set(fc.r, fc.g, fc.b, fl.self ?? 0);
  if (S.eye) u.uEye.value.set(S.eye[0], S.eye[1], S.eye[2], 1);
  if (S.scale) u.uScale.value.set(S.scale[0], S.scale[1], opts.scales ?? S.scale[2], 0);
  if (opts.gold) u.uGold.value.copy(col(opts.gold));
  if (opts.underlight) u.uUnderLight.value.copy(col(opts.underlight));
  if (opts.under) { const q = opts.under; u.uUnder.value.set(q.sky ?? 1.6, q.key ?? 0.6, q.belly ?? 0.4, q.lamps ?? 0.55); }
  u.uTintA.value.copy(col(opts.tint ? range(opts.tint)[0] : '#ffffff')); u.uTintB.value.copy(col(opts.tint ? range(opts.tint)[1] : '#e9e6dc'));
  if (light) {
    const g = { color: '#3fe0d0', intensity: 3.2, seconds: 0.17, width: 0.12, rest: 0.28, from: 0.9, to: 3.2, ...given(opts.glow) };
    const slow = ctx.reducedMotion ? 0.55 : 1;
    u.uGlowCol.value.copy(col(g.color).multiplyScalar(g.intensity)); u.uStreak.value.set(g.seconds / slow, g.width, 0.0015, g.rest); u.uGlowV.value.set(g.from * slow, g.to * slow);
  }
  // ---- the schools: a route each, and a station for every fish
  const schools = [];
  let first = 0;
  list.forEach((s, k) => {
    const cnt = counts[k], form = s.form || opts.form || (s.route ? (S.name === 'carp' ? 'file' : 'ribbon') : (opts.spin || s.spin ? 'ball' : 'shoal'));
    const gait = s.gait || opts.gait || 'cruise', speedR = range(s.speed ?? opts.speed, S.speed), speed = gait === 'hover' || s.at ? 0 : lerp(speedR[0], speedR[1], rnd());
    const depth = range(s.depth ?? opts.depth, [0.15, 0.4]), spacing = (s.spacing ?? opts.spacing ?? S.spacing) * len;
    // the size of the school, from how many fish it holds and how close they keep
    let rx, ry, rz, lag = 0, along = 0;
    const spread = s.spread ?? opts.spread;
    if (form === 'ribbon' || form === 'file') {
      along = (s.long ?? opts.long) ?? (form === 'file' ? cnt * spacing * 1.1 : Math.max(6, cnt * spacing * spacing * 0.9 / 2.2));
      rx = spread ? spread[0] : form === 'file' ? Math.max(0.3, spacing * 0.6) : 1.25; ry = spread ? spread[1] : form === 'file' ? 0.06 : 0.5; rz = 0;
    } else {
      const vol = cnt * spacing * spacing * spacing * 1.25, flat = (depth[1] - depth[0]) * 0.5;
      ry = spread ? spread[1] : Math.max(0.02, Math.min(flat, Math.cbrt(vol * 0.24)));
      const rh = Math.sqrt(vol / (4.19 * Math.max(ry, 0.03)) / 0.72);
      rx = spread ? spread[0] : rh * 1.2; rz = spread ? (spread[2] ?? spread[0]) : rh * 0.85; lag = gait === 'hover' ? 0.03 : Math.min(0.2, speed * 0.5);
    }
    // its route
    let pts;
    if (s.route) pts = s.route.map((p) => pointOf(ctx, p));
    else if (s.at) pts = [pointOf(ctx, s.at)];
    else {
      const hov = gait === 'hover';
      pts = wanderRoute(ctx, rnd, s.home || { x: 0, z: 0, r: 3 }, {
        leg: s.leg || opts.leg || (hov ? [0.18, 0.4] : [speed * 5, speed * 12].map((v) => clamp(v, 0.8, 6))), turn: s.turn || opts.turn || (hov ? [0.6, 1.9] : [0.7, 1.9]),
        legs: s.legs || (hov ? 40 : 30), depth: [depth[0] + ry, Math.max(depth[0] + ry, depth[1] - ry)], avoid: s.avoid || opts.avoid || [] });
    }
    const L = s.route || s.at ? bakeRoute(fish.routeData, k, pts) : bakePolyline(fish.routeData, k, roundCorners(pts, (s.corner ?? opts.corner ?? 0.6) * len));
    if (s.posts || opts.posts) bakePosts(fish.routeData, k, s.posts || opts.posts);
    const sc = fish.addSchool(k, L, { speed, gait, mid: along * 0.5, radius: Math.max(rx, rz, along * 0.5) + 0.3, start: (s.start ?? rnd()) * L, first, count: cnt });
    if (gait === 'hover') {
      const gap = range(s.every ?? opts.every, [2.5, 6]), dist = range(s.dart ?? opts.dart, [0.18, 0.4]);
      const r2 = ctx.rng((opts.seed ?? 3) * 31 + k * 7 + 1);
      sc.dartGap = () => lerp(gap[0], gap[1], r2()); sc.dartDist = () => lerp(dist[0], dist[1], r2()); sc.dartFor = 0.55; sc.nextDart = lerp(0.5, gap[1], r2());
    }
    sc.form = form; sc.spread = [rx, ry, rz]; sc.long = along;
    // the fish
    const ball = form === 'ribbon' || form === 'file' ? null : ballPlaces(rnd, cnt, rx, ry, rz, spacing * 0.8);
    const waveA = rnd() * TAU, waveX = Math.cos(waveA), waveZ = Math.sin(waveA), rPh = ctx.rng((opts.seed ?? 3) * 53 + k * 11 + 2), ribbonPh = [rPh(), rPh()];
    for (let j = 0; j < cnt; j++) {
      const i = first + j, o = i * 4, size = len * (1 + vary * (rnd() * 2 - 1));
      if (form === 'ribbon') {
        // A travelling school is no ruled band (the first ribbons were sausages of one width and one density, with
        // square ends): its head is blunt and crowded, its body wanders a little from side to side, and it thins away
        // behind into a tail of stragglers. f: 0 at the tail .. 1 at the head.
        const b = (rnd() + rnd() + rnd() - 1.5) / 1.5, c = (rnd() + rnd() - 1);
        const f = rnd() < 0.3 ? 0.5 + 0.5 * Math.sqrt(rnd()) * (0.7 + 0.3 * rnd()) : Math.pow(rnd(), 0.85);
        const wide = (0.22 + 0.78 * smooth(0, 0.34, f)) * Math.sqrt(Math.min(1, (1 - f) / 0.05 + 0.08));
        const wander = 0.2 * Math.sin(TAU * (f * 2.3 + ribbonPh[0])) + 0.1 * Math.sin(TAU * (f * 5.3 + ribbonPh[1]));
        fish.St[o] = f * along; fish.St[o + 1] = (b * wide * 0.72 + wander * smooth(0, 0.2, f)) * rx; fish.St[o + 2] = c * ry * Math.sqrt(wide);
      } else if (form === 'file') {
        fish.St[o] = (j + 0.5 + (rnd() - 0.5) * 0.6) * along / cnt; fish.St[o + 1] = (rnd() * 2 - 1) * rx; fish.St[o + 2] = (rnd() * 2 - 1) * ry;
      } else {
        fish.St[o] = lag * (0.8 * (ball[j][0] * waveX + ball[j][2] * waveZ) / Math.max(rx, rz, 1e-3) + 0.25 * (rnd() * 2 - 1)); fish.W[o] = ball[j][0]; fish.W[o + 1] = ball[j][1]; fish.W[o + 2] = ball[j][2];
      }
      fish.St[o + 3] = size; fish.W[o + 3] = k;
      fish.Rnd[o] = rnd(); fish.Rnd[o + 1] = rnd(); fish.Rnd[o + 2] = rnd(); fish.Rnd[o + 3] = rnd();
      fish.Ev[o] = -1e6; fish.Ev[o + 1] = 0; fish.Ev[o + 2] = (s.heading ?? 0) + (rnd() - 0.5) * (opts.strays ?? (gait === 'hover' ? 0.5 : 0.3)); fish.Ev[o + 3] = 1;
    }
    first += cnt; schools.push(sc);
  });
  fish.uploadRoutes();

  // ---- what the school does by itself: rises and sips, a mark over each back, frights from the hull and from large things
  const rises = opts.rises ? { kind: 'rise', every: [20, 40], ring: null, near: 30, ...given(opts.rises) } : null;
  const trace = opts.trace ? { channel: 'lane', radius: 0.175, strength: 0.55, within: 0.3, near: 45, ...given(opts.trace) } : null;
  const nextRise = rises ? new Float32Array(n) : null, riseN = rises ? new Uint16Array(n) : null, seedR = (opts.seed ?? 3) * 17 + 5;
  if (rises) for (let i = 0; i < n; i++) nextRise[i] = lerp(rises.every[0] * 0.15, rises.every[1], hash01(seedR, i, 0));
  const prev = trace ? new Float32Array(n * 2).fill(NaN) : null, P = [0, 0, 0, 0, 0], calm = !!ctx.reducedMotion, traceStep = Math.max(1, Math.ceil(n / 64));      // (at most 64 backs write on the water)
  // reduced motion: a fright is half as quick; solid fish also go less far (fish of light keep their bloom: it is slow light, not motion)
  const B = burst && calm ? { ...burst, radius: burst.radius * (light ? 1 : 0.6), out: burst.out * 2, back: burst.back * 1.2 } : burst;
  const startBurst = (k, x, y, z, t, why) => {
    const sc = schools[k]; if (!sc || !B) return;
    fish.burst(k, x, y, z, t, B);
    for (let j = fish.pend.length - 1; j >= 0; j--) { const e = fish.pend[j]; if (e.k === k && (e.kind === 'rise' || e.kind === 'sip')) { fish.pend[j] = fish.pend[fish.pend.length - 1]; fish.pend.pop(); } }
    if (opts.water !== false && B.boils > 0 && B.boil[0] > 0) {            // small boils where fish turned: the nearest fish first
      const m = Math.min(B.boils, sc.count), stepI = Math.max(1, Math.floor(sc.count / m));
      for (let j = 0; j < m; j++) {
        const i = sc.first + ((j * stepI + (k * 3)) % sc.count); fish.posAt(i, t, P);
        // (the deeper the fish the fainter its mark; no two boils alike, and they come over most of a second, not in a volley)
        const shallow = 1 - 0.65 * smooth(0.15, 0.6, -P[1]), h = hash01(seedR, i, 91);
        if (P[1] > -1) fish.later(t + Math.hypot(P[0] - x, P[2] - z) / B.wave + 0.05 + 0.75 * B.out * hash01(seedR, i, 92), P[0], P[2], B.boil[0] * shallow * (0.6 + 0.8 * h), B.boil[1] * (0.75 + 0.5 * hash01(seedR, i, 93)), 'boil', k);
      }
    }
    if (opts.onTouch) opts.onTouch(x, z, 'burst', k, why);
    if (B.ring) ctx.water.ripple(x, z, B.ring[0], B.ring[1]);
    if (B.marks && ctx.water.trace && ctx.water.trace.inject) {            // dabs of light going out from the place, as the bloom opens
      const M = { count: 24, from: 1, to: 6, radius: 0.4, strength: 0.6, channel: 'glow', ...given(B.marks) };
      for (let j = 0; j < M.count; j++) { const a = TAU * (j + 0.5 * (j % 2)) / M.count, r = lerp(M.from, M.to, ((j * 7) % M.count) / M.count); marks.push({ time: t + r / (B.radius / B.out + 1e-3) * 0.6, x: x + Math.cos(a) * r, z: z + Math.sin(a) * r, M }); }
    }
  };
  const marks = [];
  ctx.onUpdate((dt, c) => {
    const t = c.time, boat = ctx.boat;
    fish.step(dt, t);
    // the hull frightens a school it bears down on (a shoal bursts; a ribbon only runs on faster, and parts round it)
    if (B && fish.hull.on && (B.onHull || B.boost > 0)) {
      const H = fish.hull, bs = Math.hypot(H.vx, H.vz);
      for (const sc of schools) {
        let cx = sc.centre.x, cy = sc.centre.y, cz = sc.centre.z;
        if (sc.long > 0) {                                     // a ribbon is long: take the part of it that is nearest the boat
          let best = 1e9;
          for (let j = 0; j <= 4; j++) { const R = routeEval(fish.routeData, sc.k, sc.U + sc.long * j / 4, sc.L, _R), d2 = (R[0] - H.x) * (R[0] - H.x) + (R[2] - H.z) * (R[2] - H.z); if (d2 < best) { best = d2; cx = R[0]; cy = R[1]; cz = R[2]; } }
        }
        const qx = cx - H.x, qz = cz - H.z, ca = clamp(qx * H.fx + qz * H.fz, -H.astern, H.ahead), nx = H.x + H.fx * ca, nz = H.z + H.fz * ca;
        const wide = sc.long > 0 ? sc.spread[0] : sc.radius, dist = Math.hypot(cx - nx, cz - nz), reach = wide + (B.trigger ?? 1.2), deep = -cy > H.depth;
        if (dist > reach + 1.5 && t - sc.lastBurst > B.out + B.back * 0.5) sc.armed = true;
        if (!sc.armed || deep || dist > reach) continue;
        if (B.onHull) { if (bs > 0.25 && (qx * H.vx + qz * H.vz) > 0) { sc.armed = false; startBurst(sc.k, nx, -0.1, nz, t, 'hull'); } }
        else { sc.armed = false; sc.boostAt = t; sc.lastBurst = t; if (opts.onTouch) opts.onTouch(cx, cz, 'pass', sc.k); }
      }
    }
    // large things frighten a school they enter
    for (const th of fish.threats) {
      if (!th || th.off || !th.scare || !B) continue;
      for (const sc of schools) {
        const dist = sc.centre.distanceTo(P3.set(th.x, th.y, th.z)), reach = sc.radius * 0.8 + th.radius;
        if (dist > reach + 2 && t - sc.lastBurst > B.out + B.back * 0.5) sc['arm' + th.id] = true;
        if (sc['arm' + th.id] !== false && dist < reach) { sc['arm' + th.id] = false; startBurst(sc.k, th.x, th.y, th.z, t, 'threat'); }
      }
    }
    for (let i = marks.length - 1; i >= 0; i--) { const m = marks[i]; if (t < m.time) continue; ctx.water.trace.inject(m.x, m.z, { channel: m.M.channel, radius: m.M.radius, strength: m.M.strength }); marks[i] = marks[marks.length - 1]; marks.pop(); }
    // rises and sips, each fish on a clock of its own
    if (rises) {
      const kind = rises.kind === 'sip' ? 2 : 1, dur = kind === 2 ? fish.evt.sip : fish.evt.rise, when = kind === 2 ? SIP_AT : 0.42;
      for (let i = 0; i < n; i++) {
        if (t < nextRise[i]) continue;
        nextRise[i] += lerp(rises.every[0], rises.every[1], hash01(seedR, i, ++riseN[i]));        // (from its own last time, not from this frame's)
        if (nextRise[i] < t) nextRise[i] = t + rises.every[0] * hash01(seedR, i, riseN[i] + 7);
        const sc = schools[fish.W[i * 4 + 3] | 0];
        if (t - sc.lastBurst < (B ? B.out + B.back : 0) || fish.busy(i, t)) continue;
        fish.posAt(i, t, P);
        if (Math.hypot(P[0] - boat.x, P[2] - boat.z) > rises.near) continue;
        fish.event(i, kind, t);
        fish.posAt(i, t + when * dur, P);
        const ring = rises.ring || (kind === 2 ? SIP_RING : [0.5, 0.35]);
        fish.later(t + when * dur, P[0] + P[3] * fish.St[i * 4 + 3] * (kind === 2 ? 0.45 : 0.1), P[2] + P[4] * fish.St[i * 4 + 3] * (kind === 2 ? 0.45 : 0.1), opts.water === false ? 0 : ring[0], ring[1], rises.kind, sc.k);
      }
    }
    // a weak mark in the water's trace over each back that is near the surface (carp lifting a skin of petals)
    if (trace && ctx.water.trace && ctx.water.trace.line) {
      for (let i = 0; i < n; i += traceStep) {
        fish.posAt(i, t, P);
        const o = i * 2, px = prev[o], pz = prev[o + 1], size = fish.St[i * 4 + 3], near = Math.hypot(P[0] - boat.x, P[2] - boat.z) < trace.near;
        const back = -P[1] - (S.profile[4] ? S.profile[4][1] : 0.1) * size;                  // metres of water over its back
        prev[o] = P[0]; prev[o + 1] = P[2];
        if (!near || back > trace.within || !(Math.hypot(P[0] - px, P[2] - pz) < 1.5)) continue;
        ctx.water.trace.line(px, pz, P[0], P[2], { channel: trace.channel, radius: trace.radius, strength: trace.strength * (1 - smooth(trace.within * 0.6, trace.within, back)), soft: 0.8 });
      }
    }
  });
  const P3 = new THREE.Vector3();
  let threatId = 0;
  const handle = {
    object: fish.object, count: n, triangles: fish.triangles, species: S.name, fish,
    /** The schools: for each { centre (Vector3, live), speed, radius, count, pace, hold }. Set `pace` (a multiplier) or `hold` (0 stops it) from a cue. */
    schools,
    /** Fright: school k (or 'all') bursts away from a place, { x, y, z } in realm coordinates (default: its own middle), and regroups. */
    burst(k = 'all', at = null) {
      const t = ctx.time;
      for (const sc of schools) if (k === 'all' || k === sc.k) startBurst(sc.k, at ? at.x : sc.centre.x, at ? (at.y ?? -0.2) : sc.centre.y, at ? at.z : sc.centre.z, t, 'cue');
      return handle;
    },
    /**
     * Something large the fish keep clear of: an Object3D (its world position is read every frame), or a function
     * returning [x, y, z]. radius: the room they give it; scare: true makes a school burst when it comes in.
     * Returns { radius, off, remove() }. At most four at once.
     */
    threat(target, { radius = 1, scare = true } = {}) {
      const slot = fish.threats.findIndex((q) => !q || q.dead), i = slot >= 0 ? slot : fish.threats.length;
      if (i >= T_MAX) { console.error(`INVALID_ fish: at most ${T_MAX} large things at once`); return null; }
      const read = typeof target === 'function' ? target : () => { target.getWorldPosition(P3); return [P3.x, P3.y, P3.z]; };
      const th = { id: threatId++, read, radius, scare, off: false, dead: false, seen: false, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, r: 0, remove() { this.off = true; this.dead = true; } };
      fish.threats[i] = th; return th;
    },
    /** School k keeps to a clock of the realm's: fn(time) returns how many metres along its route its head is (the hour ring's lanterns). null lets it go. */
    lock(k, fn) { if (schools[k]) schools[k].lock = fn; return handle; },
    /** Where fish i is now: [x, y, z] in realm coordinates. */
    fishAt(i, out = [0, 0, 0]) { fish.posAt(i, fish.now, P); out[0] = P[0]; out[1] = P[1]; out[2] = P[2]; return out; },
    /** Make fish i rise ('rise') or sip ('sip') now. */
    rise(i, kind = 'rise') {
      const t = ctx.time, k2 = kind === 'sip' ? 2 : 1, dur = k2 === 2 ? fish.evt.sip : fish.evt.rise, when = k2 === 2 ? SIP_AT : 0.42;
      if (!(i >= 0 && i < n) || fish.busy(i, t)) return handle;                 // (no such fish, or it is coming up already)
      fish.event(i, k2, t); fish.posAt(i, t + when * dur, P);
      const ring = (rises && rises.ring) || (k2 === 2 ? SIP_RING : [0.5, 0.35]);
      const ahead = fish.St[i * 4 + 3] * (k2 === 2 ? 0.45 : 0.1);
      fish.later(t + when * dur, P[0] + P[3] * ahead, P[2] + P[4] * ahead, opts.water === false ? 0 : ring[0], ring[1], kind, fish.W[i * 4 + 3] | 0);
      return handle;
    },
    /** Put school k so many metres along its route (for a cue's settle, or to stage where a school is met). */
    put(k, metres) { const sc = schools[k]; if (sc) sc.U = ((metres % sc.L) + sc.L) % sc.L; return handle; },
    /** The hull's room: { radius, depth, vertical, astern, ahead } or false. */
    setHull(h) { if (h === false) fish.hull.on = false; else Object.assign(fish.hull, { on: true }, h); return handle; },
    uniforms: u,
  };
  return handle;
}

// ------------------------------------------------------------------------------------------------ rises
/**
 * Fish rising on a water: every so often a ring somewhere, and for some of them a back and a dorsal fin rolling over.
 * The fish that show are a small pool of one species' mesh; when and where is fixed by the seed, so it is the same
 * every run.
 *
 *   const rises = makeRises(ctx, { every: 2.5, near: 30, onTouch: (x, z) => ctx.audio.play('drop', { x, z, pitch: 0.7, gain: 0.35 }) });
 *   const hatch = rises.zone({ x, z, radius: 9.5, rate: 0 });   stage.tween(hatch, 'rate', 2.5, 4);      // a place where they rise fast
 *
 * opts: species ('rudd'), length, every (seconds between rises, on average; 0 = only in zones), backs (the share that
 * shows a back, 0.2), near (metres from the boat within which they rise, 30), keep (never nearer the hull's line than
 * this, 2.5), area ((rnd) => [x, z]: where, instead of round the boat), ring [strength, radius] (0.5, 0.35), backRing
 * (0.3, 0.5), depth (where a fish comes up from, 0.65), pool (how many backs at once, 10), colors, seed, onTouch(x, z, 'rise', back).
 */
export function makeRises(ctx, opts = {}) {
  const S = SPECIES_OF(opts.species || 'rudd');
  const o = { every: 2.5, backs: 0.2, near: 30, keep: 2.5, area: null, ring: [0.5, 0.35], backRing: [0.3, 0.5], depth: 0.65, pool: 10, seed: 23, water: true, ...given(opts) };
  const len = o.length ?? S.length * 1.15, built = fishGeometry(S, { colors: o.colors }), n = Math.max(2, o.pool);
  const fish = new Fish(ctx, { count: n, species: S, geometry: built.geometry, triangles: built.triangles, detail: S.detail, parent: o.parent, name: 'fish:rises', length: len, onTouch: null });
  const u = fish.uniforms, rnd = ctx.rng(o.seed), dur = o.seconds ?? S.rise.seconds * 1.6;
  u.uBeat.value.y = (S.cruise ?? 0.3) * len / S.length;
  if (S.eye) u.uEye.value.set(S.eye[0], S.eye[1], S.eye[2], 1);
  if (S.scale) u.uScale.value.set(S.scale[0], S.scale[1], S.scale[2], 0);
  fish.limits.top = S.top * len; fish.evt.pooled = 1; fish.evt.rise = dur; fish.evt.riseTop = S.rise.top; fish.evt.travel = S.rise.travel * 1.6;
  bakeRoute(fish.routeData, 0, [[0, 0, 0, 1]]); fish.uploadRoutes();
  fish.addSchool(0, 1, { speed: 0, count: n });
  for (let i = 0; i < n; i++) { const q = i * 4; fish.St[q + 3] = len * (0.9 + 0.3 * rnd()); fish.W[q + 1] = -o.depth; for (let j = 0; j < 4; j++) fish.Rnd[q + j] = rnd(); fish.Ev[q] = -1e6; fish.Ev[q + 3] = 1; }
  const zones = [], loc = {}, busy = new Float32Array(n).fill(-1e6);
  // the n-th rise takes everything from n (its time, its place, whether a back shows, the way the fish heads), so the
  // same rises come at the same moments in every run, however the frames fall
  const H = (k, j, id = 0) => hash01(o.seed + 101 * id, k, j);
  let next = o.every > 0 ? o.every * (0.3 + H(0, 9)) : Infinity, slot = 0, count = 0;
  const fire = (x, z, back, t, yaw) => {
    if (back) {
      let i = -1; for (let q = 0; q < n; q++) { const c = (slot + q) % n; if (t > busy[c]) { i = c; break; } }
      if (i >= 0) {
        slot = i + 1; busy[i] = t + dur + 0.1;
        const q = i * 4;
        fish.W[q] = x; fish.W[q + 2] = z; fish.wAttr.needsUpdate = true;
        fish.event(i, 1, t, yaw);
        if (o.water) { fish.later(t + 0.44 * dur, x, z, o.ring[0], o.ring[1], 'rise'); fish.later(t + 0.64 * dur, x + Math.sin(yaw) * 0.2 * len, z + Math.cos(yaw) * 0.2 * len, o.backRing[0], o.backRing[1], 'roll'); }
        else if (o.onTouch) o.onTouch(x, z, 'rise', true);
        return;
      }
    }
    if (o.water) ctx.water.ripple(x, z, o.ring[0], o.ring[1]);
    if (o.onTouch) o.onTouch(x, z, 'rise', false);
  };
  fish.cfg.onTouch = (x, z, kind) => { if (kind === 'rise' && o.onTouch) o.onTouch(x, z, 'rise', true); };
  // somewhere on the water near the boat, clear of the hull and inside the channel
  const somewhere = (k) => {
    const boat = ctx.boat;
    for (let tries = 0; tries < 6; tries++) {
      let x, z;
      if (o.area) { let c2 = 0; const p = o.area(() => H(k, 40 + tries * 8 + (c2++ % 8))); x = p[0]; z = p[1]; }
      else { const a = H(k, 20 + tries * 2) * TAU, r = Math.sqrt(lerp(o.keep * o.keep, o.near * o.near, H(k, 21 + tries * 2))); x = boat.x + Math.cos(a) * r; z = boat.z + Math.sin(a) * r; }
      ctx.path.locate(x, z, boat.s, loc);
      if (Math.abs(loc.d) < loc.halfWidth - 0.6 && Math.hypot(x - boat.x, z - boat.z) > o.keep && Math.hypot(x - boat.x, z - boat.z) < o.near) return [x, z];
    }
    return null;
  };
  ctx.onUpdate((dt, c) => {
    const t = c.time, boat = ctx.boat;
    fish.step(dt, t);
    let guard = 0;
    while (t >= next && guard++ < 8) { const k = ++count; next += o.every * (0.35 + 1.3 * H(k, 0)); const p = somewhere(k); if (p) fire(p[0], p[1], H(k, 1) < o.backs, t, H(k, 2) * TAU); }
    for (const zn of zones) {
      if (!(zn.rate > 0)) { zn.next = t; continue; }
      let g2 = 0;
      while (t >= zn.next && g2++ < 12) {
        const k = ++zn.count;
        zn.next += (0.35 + 1.3 * H(k, 0, zn.id)) / zn.rate;
        const a = H(k, 3, zn.id) * TAU, r = Math.sqrt(H(k, 4, zn.id)) * zn.radius, x = zn.x + Math.cos(a) * r, z = zn.z + Math.sin(a) * r;
        if (Math.hypot(x - boat.x, z - boat.z) > o.keep) fire(x, z, H(k, 1, zn.id) < o.backs, t, H(k, 2, zn.id) * TAU);
      }
    }
  });
  return {
    object: fish.object, triangles: fish.triangles, fish,
    /** A rise now at a place: fire(x, z, { back: true }). */
    fire(x, z, { back = false, heading = 0 } = {}) { fire(x, z, back, ctx.time, heading); },
    /** A place where they rise at a rate of their own (rises a second): returns { x, z, radius, rate }, to change at will. */
    zone({ x, z, radius = 9.5, rate = 0 }) { const zn = { x, z, radius, rate, next: ctx.time, count: 0, id: zones.length + 1 }; zones.push(zn); return zn; },
    /** Seconds between rises round the boat (0 stops them). */
    set every(v) { o.every = v; next = v > 0 ? Math.min(next, ctx.time + v) : Infinity; }, get every() { return o.every; },
  };
}

// ------------------------------------------------------------------------------------------------ sparks
/**
 * Fish that flee the stem as dashes of light (the answering sea): nothing while the boat lies still, six to fourteen
 * a second as it moves, each a streak that fans away from the bow, slows and is gone. A pool; one draw call.
 *
 *   makeSparks(ctx, { color: '#3fe0d0', onTouch: (x, z) => {} });
 *
 * opts: count (300), color, intensity (5), rate [at the slowest, at speed] (6, 14), speedAt [0.3, 3] m/s, ahead
 * [1.2, 5] metres before the stem where they start (nearer, the bow hides them from the rider), spread (1.6, half the
 * width), fan (1.2 radians either side),
 * depth [0.2, 0.6], dash [4, 6] m/s, seconds (0.5), length (0.16, the fish itself), streak (0.1 s of light behind it),
 * trace ({ channel: 'glow', radius: 0.3, strength: 0.5 } or false), seed, onTouch(x, z, 'spark').
 */
export function makeSparks(ctx, opts = {}) {
  const o = { count: 300, color: '#3fe0d0', intensity: 5, rate: [6, 14], speedAt: [0.3, 3], ahead: [1.2, 5], spread: 1.6, fan: 1.2, depth: [0.2, 0.6], dash: [4, 6], seconds: 0.5,
    length: 0.16, streak: 0.1, width: 0.3, trace: { channel: 'glow', radius: 0.3, strength: 0.5 }, bow: 2.4, seed: 29, ...given(opts) };
  const n = o.exact ? o.count : ctx.kit.count(o.count), built = streakGeometry(), rnd = ctx.rng(o.seed);
  const fish = new Fish(ctx, { count: n, species: { ...SPECIES.fry, length: o.length }, geometry: built.geometry, triangles: built.triangles, look: 'light', parent: o.parent, name: 'fish:sparks', length: o.length });
  const u = fish.uniforms;
  u.uGlowCol.value.copy(col(o.color).multiplyScalar(o.intensity)); u.uStreak.value.set(o.streak, o.width, 0.0015, 0.2); u.uGlowV.value.set(0.5, 2.5);
  fish.limits.top = -0.05; fish.evt.pooled = 1; fish.evt.dash = 1; fish.evt.dashFor = ctx.reducedMotion ? o.seconds * 1.5 : o.seconds;
  bakeRoute(fish.routeData, 0, [[0, 0, 0, 1]]); fish.uploadRoutes();
  fish.addSchool(0, 1, { speed: 0, count: n });
  for (let i = 0; i < n; i++) { const q = i * 4; fish.St[q + 3] = o.length * (0.8 + 0.4 * rnd()); for (let j = 0; j < 4; j++) fish.Rnd[q + j] = rnd(); fish.Ev[q] = -1e6; fish.Ev[q + 3] = 1; }
  let acc = 0, slot = 0, born = 0;
  ctx.onUpdate((dt, c) => {
    const t = c.time, boat = ctx.boat, sp = Math.hypot(boat.vx || 0, boat.vz || 0);
    fish.step(dt, t);
    if (sp < o.speedAt[0]) { acc = 0; return; }
    acc += lerp(o.rate[0], o.rate[1], smooth(o.speedAt[0], o.speedAt[1], sp)) * dt * (ctx.reducedMotion ? 0.6 : 1);
    const fx = -Math.sin(boat.heading), fz = -Math.cos(boat.heading), rx = -fz, rz = fx;
    let wrote = false;
    while (acc >= 1) {
      acc -= 1;
      const i = slot, k = ++born; slot = (slot + 1) % n;
      const side = hash01(o.seed, k, 0) < 0.5 ? -1 : 1, off = side * hash01(o.seed, k, 1) * o.spread, ah = o.bow + lerp(o.ahead[0], o.ahead[1], hash01(o.seed, k, 2));
      const x = boat.x + fx * ah + rx * off, z = boat.z + fz * ah + rz * off, a = side * hash01(o.seed, k, 3) * o.fan;       // it flees to its own side of the stem
      const dx = fx * Math.cos(a) + rx * Math.sin(a), dz = fz * Math.cos(a) + rz * Math.sin(a), q = i * 4;
      fish.W[q] = x; fish.W[q + 1] = -lerp(o.depth[0], o.depth[1], hash01(o.seed, k, 4)); fish.W[q + 2] = z;
      fish.Ev[q] = t; fish.Ev[q + 1] = 3; fish.Ev[q + 2] = Math.atan2(dx, dz); fish.Ev[q + 3] = lerp(o.dash[0], o.dash[1], hash01(o.seed, k, 5)) * (ctx.reducedMotion ? 0.6 : 1);
      wrote = true;
      if (o.trace && ctx.water.trace && ctx.water.trace.inject) ctx.water.trace.inject(x, z, o.trace);
      if (o.onTouch) o.onTouch(x, z, 'spark');
    }
    if (wrote) { fish.wAttr.needsUpdate = true; fish.evAttr.needsUpdate = true; }
  });
  return { object: fish.object, count: n, triangles: fish.triangles, fish };
}

// ------------------------------------------------------------------------------------------------ brine shrimp
const SHRIMP_L = 6;
const SHRIMP_GLSL = /* glsl */`
  attribute vec4 aSeed;      // its place in the box (0..1), a number of its own
  attribute vec4 aSeed2;     // its length, the radius of its loop, how fast it goes round, where on the loop it began
  attribute float aTip;      // 1 and 2 on the outer corners of the legs' leaves (they beat one after the other)
  uniform float uNow;
  uniform vec4 uBox;         // the box: its width, its top and bottom (metres under the surface), how far off a shrimp can be seen
  uniform vec4 uCloud;       // the clouds: their drift x, z (m/s), their size, the share of the water that holds one
  uniform vec4 uLight[SHRIMP_L];      // lights standing in the water: x, z, the radius they draw from, how far the shrimp have gathered (0..1)
  uniform vec3 uCentre; uniform vec2 uGatherK; uniform float uPixel, uTop;
  varying float vShrimp;
  ${WATER_GLSL}
  float shrimpHash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float shrimpNoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(shrimpHash(i), shrimpHash(i + vec2(1.0, 0.0)), f.x), mix(shrimpHash(i + vec2(0.0, 1.0)), shrimpHash(i + vec2(1.0, 1.0)), f.x), f.y); }
`;
const SHRIMP_VERTEX = /* glsl */`
  // its place: the box follows the rider's eye, the clouds drift through it
  vec2 sHome = mod(aSeed.xz * uBox.x + uCloud.xy * uNow - uCentre.xz + 0.5 * uBox.x, uBox.x) - 0.5 * uBox.x + uCentre.xz;
  // a cloud is where the slow noise is high: a shrimp outside one is not drawn
  float sCloud = smoothstep(1.0 - uCloud.w - 0.12, 1.0 - uCloud.w + 0.12, 0.5 * shrimpNoise((sHome - uCloud.xy * uNow) / uCloud.z) + 0.5 * shrimpNoise((sHome - uCloud.xy * uNow) / (uCloud.z * 0.37) + 7.3));
  // its loop: a ring a hand's breadth across, tilted its own way, the body lying along it
  float sPh = 6.2832 * aSeed2.w + uNow * aSeed2.z, sTilt = 6.2832 * aSeed.w, sLean = 0.5 * (fract(aSeed.w * 7.31) - 0.5);
  vec3 sA = vec3(cos(sTilt), sLean, sin(sTilt)), sB = vec3(-sin(sTilt), 0.6 * (fract(aSeed.w * 3.17) - 0.5), cos(sTilt));
  vec3 sP = vec3(sHome.x, -mix(uBox.y, uBox.z, aSeed.y), sHome.y) + aSeed2.y * (sA * cos(sPh) + sB * sin(sPh));
  vec3 sF = normalize(-sA * sin(sPh) + sB * cos(sPh));
  // lights in the water draw them in: the water for some metres round each is emptied toward it
  for (int i = 0; i < SHRIMP_L; i++) {
    vec4 l = uLight[i];
    if (l.w > 0.0) { vec2 d = sP.xz - l.xy; float dl = length(d); sP.xz = l.xy + d * (1.0 - uGatherK.x * l.w * (1.0 - smoothstep(l.z, l.z * uGatherK.y, dl))); }
  }
  // churned water scatters them: the wake, a paddle's swirl, a ring going by
  vec4 sW = waterRipple(sP.xz);
  float sStir = clamp(sW.z * 1.4 + sW.w * 0.6, 0.0, 1.0), sAng = 6.2832 * fract(aSeed.w * 13.7);
  sP.xz += vec2(cos(sAng), sin(sAng)) * (0.45 * sStir * (0.4 + aSeed.y)) + sW.xy * 0.25;
  sP.y = min(sP.y - 0.04 * sStir, uTop);
  // how many are to be seen thins out toward the edge of a cloud and with distance: each shrimp has a mark of its own
  // to pass, so the cloud has no outline and nothing fades in paint (a faded speck is a dark speck)
  float sDist = length(sP - uCameraPos);
  float sSee = sCloud * (1.0 - smoothstep(0.6 * uBox.w, uBox.w, sDist));
  float sMark = 0.03 + 0.94 * fract(aSeed.w * 17.3 + aSeed.y * 3.1);
  // never thinner than the screen can draw (a speck that falls between pixels flickers)
  float sLen = aSeed2.x, sMin = sDist * uPixel, sWide = max(1.0, sMin / (0.26 * sLen));
  vec3 sL = normalize(cross(vec3(0.0, 1.0, 0.0), sF) + vec3(1e-4, 0.0, 0.0)), sU = cross(sF, sL);
  float sRoll = 6.2832 * fract(aSeed.w * 5.3) * 0.15;         // on its back: the legs (the feathery edge) upward, give or take
  vec3 sL2 = sL * cos(sRoll) - sU * sin(sRoll), sU2 = sU * cos(sRoll) + sL * sin(sRoll);
  vec3 sp = position; if (aTip > 0.5) sp.z += 0.06 * sin(uNow * 34.0 + 40.0 * aSeed.w - 1.9 * aTip);      // the legs beat, a wave running tailward
  transformed = sP + (sL2 * sp.x * sWide + sU2 * sp.y * sWide + sF * sp.z) * (sLen * step(sMark, sSee));
  objectNormal = normalize(sL2 * normal.x + sU2 * normal.y + sF * normal.z);
  // no two alike: some are all but clear, and the deeper ones are dimmer (a cloud of one flat pink reads as confetti)
  vShrimp = (0.45 + 0.55 * fract(aSeed.w * 9.7 + aSeed.x * 3.3)) * mix(1.0, 0.62, aSeed.y);
`;
// A shrimp is all but clear: what shows of it is the light of a lamp passing through it, and little of the realm's own light.
const SHRIMP_LIGHT = /* glsl */`
  vec3 sLamps = pointLight(uLanternPos, uLanternColor, uLanternRadius, normalize(uLanternPos - vWPos)) + pointLight(uLampPos, uLampColor, uLampRadius, normalize(uLampPos - vWPos));
  for (int i = 0; i < ${MAX_LIGHTS}; i++) { if (i >= uLightCount) break; sLamps += pointLight(uLights[i].xyz, uLightColors[i], uLights[i].w, normalize(uLights[i].xyz - vWPos)); }
  c = albedo * (mix(lamps, sLamps, 0.7) * uShrimpLit.x + (mix(vec3(1.0), shade, uShade) + ambient) * uShrimpLit.y);      // (lit through, whichever way it is turned)
`;

/**
 * A brine shrimp one unit long, swimming on its back as they do (+y is its underside, turned up): a slender body with
 * real thickness (a three-sided spindle: a dark head, thickest just behind it, running out to a thin pale tail that
 * hangs a little, the comma), and the two rows of its legs as a leaf either side of the front half, standing up and
 * out (drawn from both sides). Ten triangles: on screen it is never more than nine pixels long.
 */
export function shrimpGeometry(color = '#e7a39c', pale = '#f1c8bf') {
  const B = builder(), c = col(color), p = col(pale), dark = c.clone().multiplyScalar(0.8);      // (the head a shade deeper, no more: at 0.45 every shrimp carried a black dot)
  const head = B.v([0, 0, 0.5], dark), tail = B.v([0, -0.12, -0.5], p), ring = [];
  for (let j = 0; j < 3; j++) { const a = TAU * j / 3; ring.push(B.v([Math.sin(a) * 0.075, Math.cos(a) * 0.075 + 0.01, 0.24], c)); }
  for (let j = 0; j < 3; j++) { const a = ring[j], b = ring[(j + 1) % 3], ax = Math.sin(TAU * (j + 0.5) / 3), ay = Math.cos(TAU * (j + 0.5) / 3); B.tri(head, a, b, [ax, ay, 0.3]); B.tri(a, b, tail, [ax, ay, -0.1]); }
  const tips = [];
  for (const s of [1, -1]) {
    const a = B.v([s * 0.03, 0.04, 0.42], c), b = B.v([s * 0.17, 0.12, 0.33], p), d = B.v([s * 0.13, 0.10, 0.02], p), e = B.v([s * 0.03, 0.04, -0.10], c), up = [-s * 0.5, 0.85, 0];
    B.tri(a, b, d, up); B.tri(a, d, e, up); tips.push([b, 1], [d, 2]);
  }
  const g = B.geometry(), tip = new Float32Array(g.attributes.position.count);
  for (const [i, k] of tips) tip[i] = k;
  g.setAttribute('aTip', new THREE.BufferAttribute(tip, 1));
  return { geometry: g, triangles: B.triangles };
}

/**
 * Clouds of brine shrimp: tiny pink commas that loop in the water round the boat and gather where a light stands in it.
 * They are all but clear: they show where a lamp's light passes through them (the lantern's pool, a light in the water).
 *
 *   const shrimp = makeShrimp(ctx, { count: 6000 });
 *   shrimp.light({ x, z, radius: 1.5 });        // a light in the water (a fallen star): they gather round it
 *
 * opts: count (6000), box (12: metres across; the box follows the rider's eye, and should be twice `see`), depth
 * [0.03, 0.15] under the surface, size [0.008, 0.012] metres, color, pale (the tail and the legs), loop [0.03, 0.05]
 * (the radius of a loop: 6 to 10 cm across), speed [0.02, 0.04] m/s, drift (0.1 m/s, the clouds), cloud (0.55: the
 * share of the water a cloud covers; 1 = everywhere), cloudSize (2.6 m), lantern (true: they gather under the prow
 * lantern while the boat lies still), gather (2.5 m), dense (4: times as dense there), gatherTime (6 s), see (6 m:
 * they thin out from 0.6 of this and beyond it none is drawn), lit ([2, 0.15]: how strongly the light of lamps shows
 * in them (the lantern, ctx.light), and how much of the realm's own light: at 0 they are seen only where a lamp
 * reaches), top (-0.012: the highest one may come), lights ([{ x, z, radius }]), prepass (false: they are left out of
 * the water's own picture of what lies beneath and so are drawn once a frame), seed, exact, parent.
 */
export function makeShrimp(ctx, opts = {}) {
  const o = { count: 6000, box: 12, depth: [0.03, 0.15], size: [0.008, 0.012], color: '#e7a39c', pale: '#f1c8bf', loop: [0.03, 0.05], speed: [0.02, 0.04], drift: 0.1, cloud: 0.55, cloudSize: 2.6,
    lantern: true, gather: 2.5, dense: 4, gatherTime: 6, see: 6, lit: [2, 0.15], top: -0.012, lights: [], seed: 31, prepass: false, ...given(opts) };
  // (prepass: the water keeps a picture of its own of what lies beneath, at three quarters of the screen's size, and
  // bends it; a shrimp is smaller than that picture can hold, and drawn into it each one came out twice, as itself and
  // as a dark smear beside it. So they are left out of it and show once, straight, tinted by nothing: they are in a
  // hand's depth of water. `prepass: true` puts them back in, for a water deep enough to tint them.)
  const n = o.exact ? o.count : ctx.kit.count(o.count), rnd = ctx.rng(o.seed), built = shrimpGeometry(o.color, o.pale);
  const seed = new Float32Array(n * 4), seed2 = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) {
    const q = i * 4, r = lerp(o.loop[0], o.loop[1], rnd()), v = lerp(o.speed[0], o.speed[1], rnd());
    seed[q] = rnd(); seed[q + 1] = rnd(); seed[q + 2] = rnd(); seed[q + 3] = rnd();
    seed2[q] = lerp(o.size[0], o.size[1], rnd()); seed2[q + 1] = r; seed2[q + 2] = (rnd() < 0.5 ? -1 : 1) * v / r * (ctx.reducedMotion ? 0.6 : 1); seed2[q + 3] = rnd();
  }
  const da = rnd() * TAU, shared = waterUniforms(ctx.engine);
  const u = {
    uNow: { value: 0 }, uBox: { value: new THREE.Vector4(o.box, o.depth[0], o.depth[1], o.see) }, uCloud: { value: new THREE.Vector4(Math.cos(da) * o.drift, Math.sin(da) * o.drift, o.cloudSize, o.cloud) },
    uLight: { value: Array.from({ length: SHRIMP_L }, () => new THREE.Vector4()) }, uCentre: { value: new THREE.Vector3() }, uGatherK: { value: new THREE.Vector2(1 - 1 / Math.sqrt(o.dense), 2.2) }, uPixel: { value: 0.0015 },
    uTop: { value: o.top }, uShrimpLit: { value: new THREE.Vector2(o.lit[0], o.lit[1]) },
    tRipple: shared.tRipple, uRippleRect: shared.uRippleRect, tTrace: shared.tTrace, uTraceRect: shared.uTraceRect, uSwell: { value: [new THREE.Vector4(0, 0, 0, 0), new THREE.Vector4(0, 0, 0, 0), new THREE.Vector4(0, 0, 0, 0)] },
  };
  const mat = ctx.kit.gouache({ color: '#ffffff', vertexColors: true, brush: 0, shade: 0.6, side: THREE.DoubleSide, ...(o.paint || {}),
    extend: { defines: { SHRIMP_L }, uniforms: u, vertexPars: SHRIMP_GLSL, vertexLocal: SHRIMP_VERTEX, fragmentPars: 'uniform vec2 uShrimpLit; varying float vShrimp;', albedo: 'albedo *= vShrimp;', light: SHRIMP_LIGHT,
      final: 'if (max(c.r, max(c.g, c.b)) < 0.03) discard;' } });      // (a shrimp no light passes through is not a dark speck: it is not seen)
  const geo = new THREE.InstancedBufferGeometry();
  for (const k of ['position', 'normal', 'color', 'aTip']) geo.setAttribute(k, built.geometry.attributes[k]);
  geo.setIndex(built.geometry.index);
  geo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seed, 4)); geo.setAttribute('aSeed2', new THREE.InstancedBufferAttribute(seed2, 4));
  geo.instanceCount = n;
  const mesh = new THREE.Mesh(geo, mat); mesh.name = 'fish:shrimp'; mesh.frustumCulled = false;
  mesh.onBeforeRender = (renderer, scene, camera) => {
    const rt = renderer.getRenderTarget(), h = rt ? rt.height : renderer.getDrawingBufferSize(_size).y;
    u.uPixel.value = 2.0 * 2 / (h * camera.projectionMatrix.elements[5]);
    geo.instanceCount = o.prepass || !rt || rt !== ctx.engine.pre ? n : 0;   // (left out of the water's own picture of what lies beneath: see `prepass` above)
    mat.uniformsNeedUpdate = true;
  };
  (o.parent || ctx.group).add(mesh); ctx.only(mesh, 'direct');
  const lights = o.lights.map((l) => ({ x: l.x, z: l.z, radius: l.radius ?? 1.5, on: 1 })), lamp = ctx.engine.shared.uLanternPos, eye = new THREE.Vector3();
  let gathered = 0;
  const selL = new Array(SHRIMP_L + 1).fill(null), selD = new Float64Array(SHRIMP_L + 1);      // the few lights nearest the boat, and how far (squared)
  ctx.onUpdate((dt, c) => {
    const boat = ctx.boat, sp = Math.hypot(boat.vx || 0, boat.vz || 0);
    ctx.engine.camera.getWorldPosition(eye);
    u.uNow.value = c.time; u.uCentre.value.set(eye.x, 0, eye.z);
    // under the prow lantern they gather while the boat lies still, and are left behind when it moves
    gathered = clamp(gathered + (sp < 0.3 ? dt / o.gatherTime : -dt / 1.5), 0, 1);
    let k = 0;
    if (o.lantern && lamp) { u.uLight.value[k++].set(lamp.value.x, lamp.value.z, o.gather * Math.sqrt(o.dense), gathered * gathered * (3 - 2 * gathered)); }
    // the nearest of the other lights (a realm may hand over hundreds of fallen stars): one pass keeps the few that
    // fit and the next one out, and a light lets its shrimp go as it nears that next one's distance, so none is dropped at a stroke
    const m = SHRIMP_L - k; let cnt = 0;
    for (const l of lights) {
      const d = (l.x - boat.x) * (l.x - boat.x) + (l.z - boat.z) * (l.z - boat.z);
      if (cnt > m && d >= selD[m]) continue;
      let j = Math.min(cnt, m); while (j > 0 && selD[j - 1] > d) { selD[j] = selD[j - 1]; selL[j] = selL[j - 1]; j--; }
      selD[j] = d; selL[j] = l; if (cnt <= m) cnt++;
    }
    const out = cnt > m ? Math.sqrt(selD[m]) : Infinity;
    for (let i = 0; i < Math.min(cnt, m); i++) { const l = selL[i]; u.uLight.value[k++].set(l.x, l.z, l.radius, l.on * (out === Infinity ? 1 : 1 - smooth(0.7 * out, out, Math.sqrt(selD[i])))); }
    for (; k < SHRIMP_L; k++) u.uLight.value[k].w = 0;
  });
  return {
    object: mesh, count: n, triangles: built.triangles * n, uniforms: u,
    /** A light standing in the water that they gather round: returns { x, z, radius, on } (on: 0..1, to raise or lower from a cue). */
    light({ x, z, radius = 1.5, on = 1 }) { const l = { x, z, radius, on }; lights.push(l); return l; },
    /** How far they have gathered under the prow lantern, 0..1. */
    get gathered() { return gathered; },
  };
}
