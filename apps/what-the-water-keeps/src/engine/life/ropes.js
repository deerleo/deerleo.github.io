// Ropes and hanging things. The page is docs/life/ribbons.md.
//
//   makeRopes(ctx, opts)      tubes that never stretch: a rope hanging by one end (a chain of stretches of fixed
//                             length, swung by its own two slowest modes), a rope slung between two points (a true
//                             catenary of fixed length that swings about its chord), a line to a load that moves
//                             (re-fitted every frame, always attached). Darker along their wet length. Struck by the
//                             hull, kicked by its wake, leaned on by the wind, and settling. With `chain`, links
//   makeHangers(ctx, opts)    things that hang and swing as pendulums in the vertex shader, each on its cord: eel
//                             traps, lanterns, sandbags, a pail
//
// Both take the realm's ctx first, add what they make to the realm, do their own per-frame work and return
// { object, ...controls } (docs/life.md).
import * as THREE from 'three';
import { lifeClock, sharedWind, thin } from './ribbons.js';

const G = 9.81, TAU = Math.PI * 2;
const col = (c) => (c && c.isColor ? c : new THREE.Color(c ?? '#ffffff'));

// ------------------------------------------------------------------------------------------------ the catenary
/**
 * The curve a rope of length L takes between two points D metres apart on the level and V metres apart in height
 * (V > 0: the second is higher). Returns { a, s0 }: `a` is the catenary's parameter and `s0` the arc length, measured
 * from its lowest point, at which the first point lies (negative when the lowest point is between the two).
 * A rope too short to reach is treated as just long enough: it is drawn straight.
 */
export function catenary(D, V, L) {
  const chord = Math.hypot(D, V);
  L = Math.max(L, chord * 1.0002);
  D = Math.max(D, 1e-4);
  const k = Math.sqrt(L * L - V * V) / D;            // sinh(x) / x, with x = D / (2a); always above 1
  // solve sinh(x) / x = k for x: a good first guess, then Newton
  let x = k < 3 ? Math.sqrt(6 * (k - 1)) : Math.log(2 * k) + Math.log(Math.log(2 * k) + 1e-9);
  x = Math.max(x, 1e-4);
  for (let i = 0; i < 12; i++) {
    const sh = Math.sinh(x), f = sh / x - k, df = (Math.cosh(x) * x - sh) / (x * x);
    const step = f / (df || 1e-9); x -= step; if (x < 1e-5) x = 1e-5; if (Math.abs(step) < 1e-9) break;
  }
  const a = D / (2 * x), x0 = D / 2 - a * Math.asinh(V / Math.sqrt(L * L - V * V));
  return { a, s0: -a * Math.sinh(x0 / a), L };
}
/** A point on that curve at arc length t from the first point: [metres along the level, metres up] from the first point. */
export function catenaryPoint(c, t, out = [0, 0]) {
  const s = c.s0 + t, a = c.a;
  out[0] = a * (Math.asinh(s / a) - Math.asinh(c.s0 / a));
  out[1] = (s * s - c.s0 * c.s0) / (Math.sqrt(a * a + s * s) + Math.sqrt(a * a + c.s0 * c.s0));
  return out;
}
/** The same in GLSL: vec2 catPoint(a, s0, t) -> (along, up) from the first point; vec2 catTangent(a, s0, t). */
export const CATENARY_GLSL = /* glsl */`
  vec2 catPoint(float a, float s0, float t) {
    float s = s0 + t;
    return vec2(a * (asinh(s / a) - asinh(s0 / a)), (s * s - s0 * s0) / (sqrt(a * a + s * s) + sqrt(a * a + s0 * s0)));
  }
  vec2 catTangent(float a, float s0, float t) { float s = s0 + t; return vec2(a, s) / sqrt(a * a + s * s); }
`;

// A damped swing, stepped exactly (the answer does not depend on the frame rate): x'' + 2 x'/tau + w^2 (x - rest) = 0
function swingStep(st, k, w, tau, rest, dt) {
  const g = 1 / tau, wd = Math.sqrt(Math.max(w * w - g * g, 1e-6)), e = Math.exp(-g * dt), c = Math.cos(wd * dt), s = Math.sin(wd * dt);
  const x = st[k] - rest, v = st[k + 1];
  st[k] = rest + e * (x * c + ((v + g * x) / wd) * s);
  st[k + 1] = e * (v * c - ((w * w * x + g * v) / wd) * s);
}

// ------------------------------------------------------------------------------------------------ ropes
const ROPE_VERT_PARS = /* glsl */`
  attribute vec3 aA, aRopeColor;
  attribute vec4 aB, aCat, aSwing, aWet;
  uniform vec4 uRope;          // idle sway (rad), the wet line: metres above the water below which a rope is wet, strands, lay (m)
  uniform float uLifeTime, uRopePx;
  varying vec4 vRope; varying vec3 vRopeColor; varying float vRopeLay;
  ${CATENARY_GLSL}
  // where the rope is at a share of its length from its fixed end, and which way it runs there
  vec3 ropePoint(float sig, out vec3 T) {
    float L = aCat.z;
    if (aB.w > 0.5) {
      // slung between two points: a catenary of fixed length, swung about its chord like a skipping rope held still
      vec3 chord = aB.xyz - aA; vec2 h = chord.xz; float D = max(length(h), 1e-4); vec3 hd = vec3(h.x, 0.0, h.y) / D;
      vec2 c = catPoint(aCat.x, aCat.y, sig * L), ct = catTangent(aCat.x, aCat.y, sig * L);
      vec3 p = hd * c.x + vec3(0.0, c.y, 0.0); T = hd * ct.x + vec3(0.0, ct.y, 0.0);
      vec3 ax = normalize(chord + vec3(0.0, 1e-5, 0.0));
      float th = aSwing.x + uRope.x * aWet.w * sin(uLifeTime * (0.9 + aWet.z) + aWet.z * 40.0);
      float cs = cos(th), sn = sin(th);
      p = p * cs + cross(ax, p) * sn + ax * dot(ax, p) * (1.0 - cs);
      T = T * cs + cross(ax, T) * sn + ax * dot(ax, T) * (1.0 - cs);
      return aA + p;
    }
    // hanging by one end: a chain of stretches of fixed length, each leaning as the rope's two slowest swings ask
    float segs = float(ROPE_SEGS), ds = L / segs, want = sig * segs;
    vec3 p = aA;
    vec2 idle = uRope.x * aWet.w * vec2(sin(uLifeTime * (0.7 + aWet.z * 0.5) + aWet.z * 30.0), cos(uLifeTime * (0.55 + aWet.z * 0.4) + aWet.z * 17.0));
    for (int i = 0; i <= ROPE_SEGS; i++) {
      float fi = float(i), w = min(1.0, want - fi); bool last = w <= 0.0;
      float sg = last ? sig : (fi + 0.5 * w) / segs;
      float m1 = 0.43 + 0.57 * sg * sqrt(sg), m2 = 0.123 + 0.087 * sg - 1.21 * sg * sg * sg;
      vec2 lean = (aSwing.xy + idle) * m1 + aSwing.zw * m2;
      float ll = length(lean); if (ll > 1.35) lean *= 1.35 / ll;
      T = vec3(sin(lean.x), 0.0, sin(lean.y)); T.y = -sqrt(max(1.0 - dot(T.xz, T.xz), 0.02)); T = normalize(T);
      if (last) break;
      p += T * (ds * w);
    }
    return p;
  }
`;
const ROPE_VERT_WORLD = /* glsl */`
  {
    vec3 T;
    #ifdef ROPE_CHAIN
      // a link: placed whole at its own place along the chain, every other one turned a quarter
      float linkN = floor(aCat.z / uChain.x + 0.5), k = position.z;
      float sig = (k + 0.5) / max(linkN, 1.0);
      vec3 C = ropePoint(min(sig, 1.0), T);
      vec3 ref = abs(T.y) > 0.9 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0);
      vec3 U = normalize(cross(T, ref)), V = cross(T, U);
      float roll = mod(k, 2.0) * 1.5708 + aWet.z * 6.2831853;
      vec3 U2 = U * cos(roll) + V * sin(roll), V2 = V * cos(roll) - U * sin(roll);
      // position.xy: the link's own outline (x along the chain, y across it), normal.xyz in the same frame
      float show = step(k, linkN - 0.5);
      wp.xyz = C + (T * position.x + U2 * position.y + V2 * normal.z * uChain.y) * show;
      wn = T * normal.x + U2 * normal.y + V2 * normal.z;
      vRope = vec4(0.0, sig * aCat.z, sig, 0.0); vRopeLay = 1.0;
    #else
      float sig = position.y, ang = position.x * 6.2831853;
      vec3 C = ropePoint(sig, T);
      vec3 ref = aB.w > 0.5 && aB.w < 1.5 ? vec3(0.0, 1.0, 0.0) : vec3(0.8, 0.0, 0.6);
      vec3 U = normalize(cross(T, ref)), V = cross(T, U);
      vec3 N = U * cos(ang) + V * sin(ang);
      float fray = 1.0;
      #ifdef ROPE_FRAY
        fray = aB.w > 0.5 ? 1.0 : 1.0 + 0.9 * smoothstep(0.985, 1.0, sig);              // a free end comes apart a little
      #endif
      // never thinner on the screen than two pixels: beyond that distance a rope keeps its width (thinner, it breaks
      // into beads that crawl as the boat moves)
      float rad = aCat.w * fray, depth = max(-(viewMatrix * vec4(C, 1.0)).z, 0.0);
      float least = uRopePx * depth / projectionMatrix[1][1];                              // the radius that is its least width on the screen, here
      // its strands show only while the rope is some pixels thick; a far rope is a plain line
      vRopeLay = uRopePx > 0.0 ? smoothstep(1.2, 3.0, rad / max(least, 1e-6)) : 1.0;
      rad = max(rad, least);
      wp.xyz = C + N * rad;
      wn = N;
      vRope = vec4(position.x, sig * aCat.z, sig, 0.0);
    #endif
    vRopeColor = aRopeColor;
    vRope.w = clamp(smoothstep(aWet.x - 0.04, aWet.x + 0.04, sig) * (1.0 - smoothstep(aWet.y - 0.04, aWet.y + 0.04, sig)), 0.0, 1.0);
  }
`;
const ROPE_FRAG_PARS = /* glsl */`
  varying vec4 vRope; varying vec3 vRopeColor; varying float vRopeLay; uniform vec4 uRope;
`;
const ROPE_ALBEDO = /* glsl */`
  {
    albedo = vRopeColor;
    #ifndef ROPE_CHAIN
      // the lay of the strands, drawn only while it is wider than a pixel
      float arg = vRope.x * uRope.z * 6.2831853 + vRope.y * 6.2831853 / uRope.w, fw = fwidth(vRope.y) * 6.2831853 / uRope.w;
      albedo *= 1.0 - 0.3 * (0.5 - 0.5 * cos(arg)) * clamp(1.5 - fw, 0.0, 1.0) * vRopeLay;
    #endif
    float wet = max(vRope.w, 1.0 - smoothstep(uRope.y - 0.06, uRope.y + 0.1, vWPos.y));
    albedo *= mix(1.0, 0.62, wet);                                                       // wet rope is darker by a third and more
  }
`;

function tubeGeometry(sides, segs) {
  const pos = new Float32Array((sides + 1) * (segs + 1) * 3), idx = [];
  for (let j = 0; j <= segs; j++) for (let i = 0; i <= sides; i++) pos.set([i / sides, j / segs, 0], (j * (sides + 1) + i) * 3);
  for (let j = 0; j < segs; j++) for (let i = 0; i < sides; i++) { const a = j * (sides + 1) + i, b = a + 1, c = a + sides + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(idx);
  return g;
}
// One oval link: a ring of wire stretched along x, and copies of it down the chain (position.z carries which link)
function chainGeometry(links, link, wire, width) {
  const SEG = 8, SIDE = 4, half = link * 0.5 - wire, wide = (width ?? link * 0.62) * 0.5 - wire;
  const pos = [], nor = [], idx = [];
  for (let k = 0; k < links; k++) {
    const base = pos.length / 3;
    for (let i = 0; i <= SEG; i++) {
      const a = i / SEG * TAU, cx = Math.cos(a) * half, cy = Math.sin(a) * wide, nx = Math.cos(a) * wide, ny = Math.sin(a) * half, nl = Math.hypot(nx, ny) || 1;
      for (let j = 0; j <= SIDE; j++) {
        const b = j / SIDE * TAU, ox = Math.cos(b) * nx / nl, oy = Math.cos(b) * ny / nl, oz = Math.sin(b);
        pos.push(cx + ox * wire, cy + oy * wire, k); nor.push(ox, oy, oz);
      }
    }
    for (let i = 0; i < SEG; i++) for (let j = 0; j < SIDE; j++) { const a = base + i * (SIDE + 1) + j, b = a + 1, c = a + SIDE + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
  }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setIndex(idx);
  return g;
}

/**
 * Ropes (or chains). opts:
 *   ropes      [{ from: [x, y, z]      its fixed end (the upper one, for a rope that hangs)
 *                 to: [x, y, z]         its other end: leave it out for a rope that hangs free
 *                 length                metres of rope. Hanging: required. Slung: default 3 per cent more than the straight
 *                                       distance; or give sag: metres its lowest point hangs below the lower end
 *                 radius                metres (default opts.radius)
 *                 color, wet: [from, to]   the share of its length that is wet (0 = the fixed end); wet rope is darker
 *                 settle                seconds it takes to lose most of a swing (default opts.settle)
 *                 hz                    its slowest swing, if you know better than its length does }]
 *   radius (0.016), color ('#a8946a'), sides (6), segments (14), settle (20), strands (3), lay (metres per turn; default 7 x radius)
 *   wetLine    metres above the water below which every rope is wet (default 0.12; -1 = none)
 *   idle       radians of sway the air gives a rope left alone (default 0.012), scaled by the wind's breeze
 *   minPixels  2: a rope is never drawn thinner than this, in pixels of whatever is being drawn into (a far rope keeps
 *              that width instead of breaking into beads that crawl as the boat moves); 0 draws it at its true width
 *              however far. Chain is not widened
 *   wind       the area's wind: a front leans every rope downwind while it holds (default: the realm's shared wind)
 *   hull       true (default): the boat pushes aside any rope it touches and its wake kicks ropes near the water
 *   rings      true (default): a swinging rope whose end is in the water rings it
 *   chain      { link: 0.07, wire: 0.008, width } draws links instead of a tube (give `from`/`to`/`length` as for a rope)
 *   onTouch(x, z, kind, i)   'hull' when the boat first touches rope i; 'ring' when its end writes on the water
 *   caustics, exact, parent
 * Returns {
 *   object, count
 *   kick(i, [x, z] | strength, where)   strike rope i: radians per second of swing, along x and z (a number: away from the boat)
 *   setEnd(i, x, y, z)                  move its other end (a load on a line): the rope is re-fitted, never stretched
 *   setFrom(i, x, y, z)                 move its fixed end
 *   setLength(i, metres)                pay out or take in
 *   letGo(i)                            its far end slips its fixing: it falls and hangs by its fixed end (a painter let go)
 *   point(i, share, out)                where the rope is at a share of its length (0 = fixed end), as drawn
 *   energy(i)                           how hard it is swinging, 0 at rest (to quicken its drips)
 *   length(i)
 * }
 */
export function makeRopes(ctx, opts = {}) {
  const { kit } = ctx, clock = lifeClock(ctx);
  const o = { ropes: [], radius: 0.016, color: '#a8946a', sides: 6, segments: 14, settle: 20, strands: 3, lay: null, wetLine: 0.12, idle: 0.012, minPixels: 2, wind: null, hull: true, rings: true, chain: null, onTouch: null, exact: true, parent: null, caustics: null, fray: true, ...opts };
  const wind = o.wind || sharedWind(ctx);
  const items = thin(ctx, o.ropes, o.exact), n = items.length, rnd = ctx.rng(o.seed ?? 19);
  const aA = new Float32Array(n * 3), aB = new Float32Array(n * 4), aCat = new Float32Array(n * 4), aSwing = new Float32Array(n * 4), aWet = new Float32Array(n * 4), aColor = new Float32Array(n * 3);
  const S = [];                                    // each rope's state on the script's side
  const fit = (i) => {                             // (re)fit a slung rope to its two ends
    const s = S[i], k = i * 4;
    if (!s.slung) { aB[k + 3] = 0; aCat[k] = 1; aCat[k + 1] = 0; aCat[k + 2] = s.L; return; }
    const dx = aB[k] - aA[i * 3], dy = aB[k + 1] - aA[i * 3 + 1], dz = aB[k + 2] - aA[i * 3 + 2], D = Math.hypot(dx, dz);
    const c = catenary(D, dy, s.L);
    s.cat = c; s.D = D; s.V = dy;
    // how far its lowest point hangs below the chord's middle: the length of the pendulum it makes
    const mid = catenaryPoint(c, c.L * 0.5), sagMid = Math.max(0.02, dy * 0.5 - mid[1]);
    s.w1 = s.hz ? s.hz * TAU : Math.sqrt(G / (0.8 * sagMid));
    aCat[k] = c.a; aCat[k + 1] = c.s0; aCat[k + 2] = c.L;
    aB[k + 3] = Math.abs(dy) > 0.9 * Math.hypot(D, dy) ? 2 : 1;
  };
  items.forEach((it, i) => {
    const from = it.from, to = it.to || null, r = it.radius ?? o.radius;
    aA.set(from, i * 3);
    let L = it.length;
    if (to) {
      const chord = Math.hypot(to[0] - from[0], to[1] - from[1], to[2] - from[2]);
      if (L == null && it.sag != null) { const D = Math.hypot(to[0] - from[0], to[2] - from[2]); L = Math.sqrt(D * D + (16 / 3) * it.sag * it.sag) + Math.abs(to[1] - from[1]) * 0.5; L = Math.max(L, chord * 1.002); }
      if (L == null) L = chord * 1.03;
      aB.set([to[0], to[1], to[2], 1], i * 4);
    }
    if (L == null) L = 2;
    S.push({ slung: !!to, L, hz: it.hz || 0, tau: it.settle ?? o.settle, st: new Float32Array(8), awake: true, kickAt: 0, touched: false, lastRing: -1e9, cat: null, vx: 0, vz: 0, movedAt: null, inWater: false,
      w1: it.hz ? it.hz * TAU : 1.2025 * Math.sqrt(G / L), w2: 2.295 * (it.hz ? it.hz * TAU : 1.2025 * Math.sqrt(G / L)), pending: [] });
    aCat[i * 4 + 3] = r;
    fit(i);
    const w = it.wet || [2, 2];
    aWet.set([w[0], w[1], it.phase ?? rnd(), it.idle ?? 1], i * 4);
    const c = col(it.color ?? o.color); aColor.set([c.r, c.g, c.b], i * 3);
  });
  let geo, defines = { ROPE_SEGS: o.segments };
  const U = { uLifeTime: clock.uLifeTime, uRopePx: { value: 0 }, uRope: { value: new THREE.Vector4(o.idle, o.wetLine, o.strands, o.lay ?? o.radius * 7) } };
  if (o.chain) {
    const ch = { link: 0.07, wire: 0.008, ...o.chain }, pitch = ch.link - ch.wire * 2.6;
    const most = Math.max(1, ...S.map((s) => Math.round(s.L / pitch)));
    geo = chainGeometry(most, ch.link, ch.wire, ch.width);
    defines.ROPE_CHAIN = ''; U.uChain = { value: new THREE.Vector2(pitch, ch.wire) };
  } else { geo = tubeGeometry(o.sides, o.segments); if (o.fray) defines.ROPE_FRAY = ''; }
  const attr = (name, arr, size, dyn) => { const a = new THREE.InstancedBufferAttribute(arr, size); if (dyn) a.setUsage(THREE.DynamicDrawUsage); geo.setAttribute(name, a); return a; };
  const tA = attr('aA', aA, 3, true), tB = attr('aB', aB, 4, true), tCat = attr('aCat', aCat, 4, true), tSwing = attr('aSwing', aSwing, 4, true); attr('aWet', aWet, 4); attr('aRopeColor', aColor, 3);
  geo.instanceCount = n;
  const mat = kit.gouache({ color: '#ffffff', brush: o.chain ? 0.3 : 0, caustics: o.caustics, extend: {
    defines, uniforms: U,
    vertexPars: (o.chain ? 'uniform vec2 uChain;\n' : '') + ROPE_VERT_PARS, vertexWorld: ROPE_VERT_WORLD, fragmentPars: ROPE_FRAG_PARS, albedo: ROPE_ALBEDO } });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = o.chain ? 'chain' : 'ropes'; mesh.frustumCulled = false;
  (o.parent || ctx.group).add(mesh);
  // the pixel floor needs the height of whatever is being drawn into (the picture, the mirror, the pre-pass)
  const size = new THREE.Vector2();
  mesh.onBeforeRender = (renderer) => { const rt = renderer.getRenderTarget(); if (rt) size.set(rt.width, rt.height); else renderer.getDrawingBufferSize(size); U.uRopePx.value = o.minPixels / Math.max(1, size.y); mat.uniformsNeedUpdate = true; };

  const tmp = new THREE.Vector3(), cp = [0, 0];
  // the rope's shape on the script's side (the same as the shader's, without the idle sway)
  const point = (i, share, out = new THREE.Vector3()) => {
    const s = S[i], k = i * 4, ax = aA[i * 3], ay = aA[i * 3 + 1], az = aA[i * 3 + 2];
    if (s.slung) {
      const dx = aB[k] - ax, dz = aB[k + 2] - az, D = Math.max(s.D, 1e-4);
      catenaryPoint(s.cat, share * s.cat.L, cp);
      out.set(dx / D * cp[0], cp[1], dz / D * cp[0]);
      tmp.set(aB[k] - ax, aB[k + 1] - ay + 1e-5, aB[k + 2] - az).normalize();
      out.applyAxisAngle(tmp, aSwing[k]);
      return out.set(out.x + ax, out.y + ay, out.z + az);
    }
    const N = o.segments, ds = s.L / N, want = share * N; let px = ax, py = ay, pz = az;
    for (let j = 0; j < N; j++) {
      const w = Math.min(1, want - j); if (w <= 0) break;
      const sg = (j + 0.5 * w) / N, m1 = 0.43 + 0.57 * sg * Math.sqrt(sg), m2 = 0.123 + 0.087 * sg - 1.21 * sg * sg * sg;
      let lx = aSwing[k] * m1 + aSwing[k + 2] * m2, lz = aSwing[k + 1] * m1 + aSwing[k + 3] * m2; const ll = Math.hypot(lx, lz); if (ll > 1.35) { lx *= 1.35 / ll; lz *= 1.35 / ll; }
      const tx = Math.sin(lx), tz = Math.sin(lz), ty = -Math.sqrt(Math.max(1 - tx * tx - tz * tz, 0.02)), tl = Math.hypot(tx, ty, tz);
      px += tx / tl * ds * w; py += ty / tl * ds * w; pz += tz / tl * ds * w;
    }
    return out.set(px, py, pz);
  };
  const api = {
    object: mesh, material: mat, count: n,
    kick(i, v, where = 0.7) {
      const s = S[i]; if (!s) return api;
      let kx, kz;
      if (Array.isArray(v)) { kx = v[0]; kz = v[1]; } else { point(i, s.slung ? 0.5 : 1, tmp); const dx = tmp.x - ctx.boat.x, dz = tmp.z - ctx.boat.z, d = Math.hypot(dx, dz) || 1; kx = dx / d * v; kz = dz / d * v; }
      if (s.slung) {
        // a slung rope swings about its chord: take the part of the blow that is square to it
        const k = i * 4, cx = aB[k] - aA[i * 3], cz = aB[k + 2] - aA[i * 3 + 2], cl = Math.hypot(cx, cz) || 1;
        s.st[1] += (kx * -cz / cl + kz * cx / cl);
      } else { s.st[1] += kx * (1.2 - where * 0.4); s.st[3] += kz * (1.2 - where * 0.4); s.st[5] -= kx * where * 0.6; s.st[7] -= kz * where * 0.6; }
      s.awake = true; return api;
    },
    setEnd(i, x, y, z) { const k = i * 4; aB[k] = x; aB[k + 1] = y; aB[k + 2] = z; S[i].slung = true; fit(i); tB.needsUpdate = true; tCat.needsUpdate = true; return api; },
    setFrom(i, x, y, z) {
      const s = S[i], t = ctx.time;
      // how fast its fixed end is being carried (a painter on a moving boat trails behind it)
      if (s.movedAt != null && t > s.movedAt) { const k = Math.min(1, (t - s.movedAt) * 4); s.vx += ((x - aA[i * 3]) / (t - s.movedAt) - s.vx) * k; s.vz += ((z - aA[i * 3 + 2]) / (t - s.movedAt) - s.vz) * k; }
      s.movedAt = t; s.awake = true;
      aA[i * 3] = x; aA[i * 3 + 1] = y; aA[i * 3 + 2] = z; fit(i); tA.needsUpdate = true; tCat.needsUpdate = true; return api;
    },
    setLength(i, L) { const s = S[i]; s.L = L; if (!s.slung && !s.hz) { s.w1 = 1.2025 * Math.sqrt(G / L); s.w2 = 2.295 * s.w1; } fit(i); tCat.needsUpdate = true; return api; },
    /**
     * Its far end slips its fixing: the rope hangs from its fixed end alone, and falls. It starts from where it lay (as
     * nearly as a hanging rope can be laid along a line) and swings down with its weight.
     */
    letGo(i) {
      const s = S[i], k = i * 4; if (!s || !s.slung) return api;
      const dx = aB[k] - aA[i * 3], dy = aB[k + 1] - aA[i * 3 + 1], dz = aB[k + 2] - aA[i * 3 + 2], D = Math.hypot(dx, dz) || 1e-3;
      const lean = Math.min(1.25, Math.atan2(D, -dy));                 // how far from straight down it lay
      s.slung = false; s.cat = null; s.fellAt = ctx.time; s.w1 = s.hz ? s.hz * TAU : 1.2025 * Math.sqrt(G / s.L); s.w2 = 2.295 * s.w1;
      // the two slowest swings, mixed so that the whole rope starts out along the line it lay on
      s.st.fill(0); s.st[0] = dx / D * lean * 2.03; s.st[2] = dz / D * lean * 2.03; s.st[4] = dx / D * lean * 1.03; s.st[6] = dz / D * lean * 1.03;
      aSwing.set([s.st[0], s.st[2], s.st[4], s.st[6]], k); s.awake = true; fit(i); tB.needsUpdate = true; tCat.needsUpdate = true; tSwing.needsUpdate = true;
      return api;
    },
    point, length: (i) => S[i].L,
    energy(i) { const st = S[i].st; return Math.min(1, (Math.abs(st[1]) + Math.abs(st[3]) + Math.hypot(st[0], st[2]) * S[i].w1) * 1.5); },
  };

  const hullR = 1.05, bowR = 0.6;
  ctx.onUpdate((dt) => {
    const t = ctx.time, boat = ctx.boat, calm = clock.calm ? 0.5 : 1; let dirty = false;
    const fx = -Math.sin(boat.heading), fz = -Math.cos(boat.heading), bowX = boat.x + fx * 1.85, bowZ = boat.z + fz * 1.85, sp = boat.speed || 0;
    const F = wind.state, blowing = F.strength > 0;
    for (let i = 0; i < n; i++) {
      const s = S[i], k = i * 4, st = s.st;
      // where the wind would have it hang: leaned downwind while a front holds
      let restX = 0, restZ = 0;
      if (blowing) { const f = wind.frontAt(aA[i * 3], aA[i * 3 + 2]) * 0.16 * calm; restX = F.nx * f; restZ = F.nz * f; }
      if (o.hull) {
        // the hull and its wake: only ropes that come down to the boat can be touched; any near the water feel the wake
        const dxb = aA[i * 3] - boat.x, dzb = aA[i * 3 + 2] - boat.z;
        if (dxb * dxb + dzb * dzb < 144) {
          const low = point(i, s.slung ? 0.5 : 1, tmp);
          if (low.y < 2.0) {
            let px = low.x - boat.x, pz = low.z - boat.z, pd = Math.hypot(px, pz), R = low.y > 0.6 ? hullR + 0.15 : hullR;
            const qx = low.x - bowX, qz = low.z - bowZ, qd = Math.hypot(qx, qz);
            if (qd - bowR < pd - R) { px = qx; pz = qz; pd = qd; R = bowR; }
            if (pd < R + aCat[k + 3]) {
              // touching: shove it out to the hull's side, as hard as it is in the way (a stiff spring, held within bounds)
              const push = Math.min(6, (R + aCat[k + 3] - pd) * 30 + 0.5) / Math.max(s.L, 0.5), ux = px / (pd || 1), uz = pz / (pd || 1);
              if (s.slung) { const cx = aB[k] - aA[i * 3], cz = aB[k + 2] - aA[i * 3 + 2], cl = Math.hypot(cx, cz) || 1; st[1] += (ux * -cz / cl + uz * cx / cl) * push * dt * 8; }
              else { st[1] += ux * push * dt * 8; st[3] += uz * push * dt * 8; }
              st[1] = Math.max(-2, Math.min(2, st[1])); st[3] = Math.max(-2, Math.min(2, st[3]));          // no harder than a hull moves
              s.awake = true;
              if (!s.touched) { s.touched = true; if (o.onTouch) o.onTouch(low.x, low.z, 'hull', i); }
            } else if (pd > R + 0.4) s.touched = false;
            // the wake reaches a rope near the water a moment after the boat has gone by
            if (low.y < 0.5 && sp > 0.4 && pd < 6 && t > s.kickAt) { s.kickAt = t + 3; s.pending.push({ at: t + pd / 1.6, v: Math.min(1, sp / 3) * 0.5 * Math.max(0.2, 1 - pd / 7), x: px / (pd || 1), z: pz / (pd || 1) }); }
          }
        }
      }
      if (s.pending.length && t >= s.pending[0].at) { const p = s.pending.shift(); api.kick(i, [p.x * p.v, p.z * p.v]); }
      if (!s.awake && !blowing && restX === 0 && Math.abs(st[0]) + Math.abs(st[2]) < 1e-5) continue;
      if (s.slung) {
        const cx = aB[k] - aA[i * 3], cz = aB[k + 2] - aA[i * 3 + 2], cl = Math.hypot(cx, cz) || 1;
        swingStep(st, 0, s.w1, s.tau, (restX * -cz / cl + restZ * cx / cl) * 2.5, dt);
        st[0] = Math.max(-1.3, Math.min(1.3, st[0]));
        aSwing[k] = st[0];
      } else {
        // a rope whose end is in the water is held by it: its swing dies quickly, and it trails behind a fixing that moves
        let tau1 = s.tau, tau2 = s.tau * 0.45;
        if (aA[i * 3 + 1] - s.L < 0.05) {
          s.inWater = point(i, 1, tmp).y < 0.03;
          if (s.inWater) { tau1 = 0.9; tau2 = 0.5; restX = Math.max(-1.2, Math.min(1.2, restX - s.vx * 0.4)); restZ = Math.max(-1.2, Math.min(1.2, restZ - s.vz * 0.4)); }
          if (s.movedAt != null && t - s.movedAt > 0.5) { s.vx *= Math.exp(-dt * 3); s.vz *= Math.exp(-dt * 3); }
        }
        // a rope that has just fallen in drags through the water before it hangs: for a few seconds it comes upright slowly
        let w1 = s.w1;
        if (s.inWater && s.fellAt != null && t - s.fellAt < 4) { w1 *= 0.45 + 0.55 * Math.max(0, t - s.fellAt) / 4; tau1 = 0.8; }
        swingStep(st, 0, w1, tau1, restX, dt); swingStep(st, 2, w1, tau1, restZ, dt);
        swingStep(st, 4, s.w2, tau2, 0, dt); swingStep(st, 6, s.w2, tau2, 0, dt);
        aSwing[k] = st[0]; aSwing[k + 1] = st[2]; aSwing[k + 2] = st[4]; aSwing[k + 3] = st[6];
        // a rope whose end is in the water writes on it as it swings
        if (o.rings && t - s.lastRing > 0.35) {
          const e = Math.abs(st[1]) + Math.abs(st[3]);
          if (e > 0.03 && aA[i * 3 + 1] - s.L < 0.02) { point(i, Math.min(1, (aA[i * 3 + 1]) / s.L), tmp); s.lastRing = t; ctx.water.ripple(tmp.x, tmp.z, Math.min(0.3, 0.08 + e * 0.4), 0.15); if (o.onTouch) o.onTouch(tmp.x, tmp.z, 'ring', i); }
        }
      }
      dirty = true;
      const e = Math.abs(st[0]) + Math.abs(st[1]) + Math.abs(st[2]) + Math.abs(st[3]) + Math.abs(st[4]) + Math.abs(st[5]) + Math.abs(st[6]) + Math.abs(st[7]);
      s.awake = e > 2e-4 || blowing || Math.abs(s.vx) + Math.abs(s.vz) > 0.02;
    }
    if (dirty) tSwing.needsUpdate = true;
  });
  return api;
}

// ------------------------------------------------------------------------------------------------ hangers
/**
 * Things that hang and swing: eel traps drying on cords, lanterns, sandbags, a pail on a rope. Each is a rigid
 * pendulum in the vertex shader (the thing and its cord in one draw call for all of them); each turns slowly on its
 * cord, swings a little in the air, leans in a wind front, and can be kicked. opts:
 *   geometry    the thing itself, a BufferGeometry modelled with its hanging point at the origin and the thing below it
 *               (with a `color` attribute if it is vertex-painted, and a `glow` attribute, three numbers a vertex, for
 *               the light any part of it gives off); or
 *   model       'models/<area>/<thing>.glb' (its meshes are merged into one; `hangAt: [x, y, z]` is the hanging point in
 *               the model's own coordinates as the ride sees them, default the top middle of its bounds)
 *   slots       for a model: { slotName: false } leaves that material slot out (a lantern's cap of snow);
 *               { slotName: { color, emissive, emissiveIntensity } } gives it a colour or makes it give off light (a flame,
 *               a lit globe: above 1 it blooms). Everything is still one draw call
 *   items       [{ at: [x, y, z]     where the cord is made fast
 *                  cord              metres of cord (0.5 to 0.9 for an eel trap)
 *                  turn              radians it turns on its cord either way (0.44 = 25 degrees); turnPeriod: seconds (5 to 8)
 *                  swing             radians it swings in still air (0.07 = 4 degrees)
 *                  yaw, scale, tint, phase }]
 *   cordRadius (0.006), cordColor, settle (seconds, default 9), material: { ...kit.gouache options } for the thing
 *   wind, hull (true: the boat knocks it aside; onTouch(x, z, 'knock', i)), exact, parent
 * Returns { object, count, kick(which, radians per second, [x, z] direction), swingOf(i), position(i, out) }
 *   which: an index, 'all', or { near: [x, z], radius, speed } (a passing flock sets the traps swinging; with `speed`,
 *   m/s, each is struck as the flock reaches it along the direction given, one after another).
 */
export async function makeHangers(ctx, opts = {}) {
  const { kit } = ctx, clock = lifeClock(ctx);
  const o = { geometry: null, model: null, hangAt: null, slots: null, items: [], cordRadius: 0.006, cordColor: '#8a7a5a', settle: 9, material: {}, wind: null, hull: true, onTouch: null, exact: false, parent: null, ...opts };
  const wind = o.wind || sharedWind(ctx);
  let src = o.geometry;
  if (!src && o.model) {
    // take the model's own geometry (all its meshes as one), leaving the file's cache to the kit
    const m = await kit.model(o.model, { position: [0, -1000, 0] });
    const parts = [], slots = o.slots || {}; m.group.updateMatrixWorld(true);
    m.group.traverse((ob) => {
      if (!ob.isMesh) return;
      const slot = ob.userData.slot || 'paint', given = slots[slot];
      if (given === false) return;                                                              // a slot left out
      const g = ob.geometry.index ? ob.geometry.toNonIndexed() : ob.geometry.clone();
      g.applyMatrix4(new THREE.Matrix4().copy(ob.matrixWorld).premultiply(new THREE.Matrix4().makeTranslation(0, 1000, 0)));
      // the slot's own paint and light go into every vertex, so that the whole thing is one mesh
      const u = ob.material.uniforms || {}, tint = given && given.color ? col(given.color) : (u.uColor ? u.uColor.value : null);
      const em = given && given.emissive ? col(given.emissive).clone().multiplyScalar(given.emissiveIntensity ?? 1) : (u.uEmissive ? u.uEmissive.value : null);
      const nV = g.attributes.position.count, cA = new Float32Array(nV * 3), gA = new Float32Array(nV * 3), had = g.attributes.color;
      for (let i = 0; i < nV; i++) {
        const r = had ? had.getX(i) : 1, gg = had ? had.getY(i) : 1, b = had ? had.getZ(i) : 1;
        cA[i * 3] = r * (tint ? tint.r : 1); cA[i * 3 + 1] = gg * (tint ? tint.g : 1); cA[i * 3 + 2] = b * (tint ? tint.b : 1);
        if (em) { gA[i * 3] = em.r; gA[i * 3 + 1] = em.g; gA[i * 3 + 2] = em.b; }
      }
      for (const k of Object.keys(g.attributes)) if (!['position', 'normal'].includes(k)) g.deleteAttribute(k);
      g.setAttribute('color', new THREE.BufferAttribute(cA, 3)); g.setAttribute('glow', new THREE.BufferAttribute(gA, 3));
      if (!g.attributes.normal) g.computeVertexNormals();
      parts.push(g);
    });
    m.group.removeFromParent(); for (const k in m.materials) m.materials[k].dispose();
    if (!parts.length) throw new Error('makeHangers: ' + o.model + ' has no meshes left to hang');
    src = parts.length === 1 ? parts[0] : (await import('three/addons/utils/BufferGeometryUtils.js')).mergeGeometries(parts, false);
    src.computeBoundingBox();
    const b = src.boundingBox, h = o.hangAt || [(b.min.x + b.max.x) / 2, b.max.y, (b.min.z + b.max.z) / 2];
    src.translate(-h[0], -h[1], -h[2]);
  }
  if (!src) throw new Error('makeHangers: give a geometry or a model');
  src = src.index ? src.toNonIndexed() : src.clone();
  src.computeBoundingBox(); if (!src.attributes.normal) src.computeVertexNormals();
  const depth = -src.boundingBox.min.y;                       // how far the thing reaches below its hanging point
  // one geometry: the thing, then a unit cord (a four-sided tube from 0 down to -1), told apart by aPart
  const pv = src.attributes.position, nv = src.attributes.normal, cv = src.attributes.color, gv = src.attributes.glow, nThing = pv.count;
  const CS = 4, nCord = CS * 6, total = nThing + nCord;
  const pos = new Float32Array(total * 3), nor = new Float32Array(total * 3), colr = new Float32Array(total * 3), part = new Float32Array(total), glw = new Float32Array(total * 3);
  pos.set(pv.array.subarray(0, nThing * 3)); nor.set(nv.array.subarray(0, nThing * 3));
  if (gv) glw.set(gv.array.subarray(0, nThing * 3));
  const cc = col(o.cordColor);
  for (let i = 0; i < nThing; i++) { if (cv) { colr[i * 3] = cv.getX(i); colr[i * 3 + 1] = cv.getY(i); colr[i * 3 + 2] = cv.getZ(i); } else colr.set([1, 1, 1], i * 3); }
  let w = nThing;
  for (let i = 0; i < CS; i++) {
    const a0 = i / CS * TAU, a1 = (i + 1) / CS * TAU, q = [[a0, 0], [a1, 0], [a0, -1], [a1, 0], [a1, -1], [a0, -1]];
    for (const [a, y] of q) { pos.set([Math.cos(a), y, Math.sin(a)], w * 3); nor.set([Math.cos(a), 0, Math.sin(a)], w * 3); colr.set([cc.r, cc.g, cc.b], w * 3); part[w] = 1; w++; }
  }
  const geo = new THREE.InstancedBufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); geo.setAttribute('color', new THREE.BufferAttribute(colr, 3)); geo.setAttribute('aPart', new THREE.BufferAttribute(part, 1));
  if (gv) geo.setAttribute('aGlow', new THREE.BufferAttribute(glw, 3));
  const items = thin(ctx, o.items, o.exact), n = items.length, rnd = ctx.rng(o.seed ?? 23);
  const aPivot = new Float32Array(n * 3), aHang = new Float32Array(n * 4), aSw = new Float32Array(n * 4), aTurn = new Float32Array(n * 4), aTint = new Float32Array(n * 3);
  const S = items.map((it, i) => {
    const cord = it.cord ?? 0.7, sc = it.scale ?? 1;
    aPivot.set(it.at, i * 3); aHang.set([cord, it.yaw ?? rnd() * TAU, sc, it.phase ?? rnd()], i * 4);
    aTurn.set([it.turn ?? 0.44, TAU / (it.turnPeriod ?? (5 + 3 * rnd())), it.swing ?? 0.07, 0], i * 4);
    const c = col(it.tint ?? '#ffffff'); aTint.set([c.r, c.g, c.b], i * 3);
    const arm = cord + depth * sc * 0.55;                       // from the fixing to the thing's middle: the pendulum's length
    return { st: new Float32Array(4), w: Math.sqrt(G / arm), tau: it.settle ?? o.settle, arm, reach: cord + depth * sc, awake: true, touched: false, kickAt: 0, pending: [] };
  });
  const attr = (name, arr, size, dyn) => { const a = new THREE.InstancedBufferAttribute(arr, size); if (dyn) a.setUsage(THREE.DynamicDrawUsage); geo.setAttribute(name, a); return a; };
  attr('aPivot', aPivot, 3); attr('aHang', aHang, 4); const tSw = attr('aSw', aSw, 4, true); attr('aTurn', aTurn, 4); attr('aTint', aTint, 3);
  geo.instanceCount = n;
  const mat = kit.gouache({ color: '#ffffff', vertexColors: true, ...o.material, extend: {
    defines: gv ? { HANG_GLOW: 1 } : {},
    uniforms: { uLifeTime: clock.uLifeTime, uCord: { value: o.cordRadius } },
    vertexPars: /* glsl */`attribute vec3 aPivot, aTint; attribute vec4 aHang, aSw, aTurn; attribute float aPart; uniform float uLifeTime, uCord; varying vec3 vHangTint;
      #ifdef HANG_GLOW
        attribute vec3 aGlow; varying vec3 vHangGlow;
      #endif`,
    vertexWorld: /* glsl */`{
      float t = uLifeTime, ph = aHang.w * 6.2831853;
      // the thing turns slowly on its cord, one way and back; the cord does not show it
      float yaw = aHang.y + aTurn.x * sin(t * aTurn.y + ph) * (1.0 - aPart);
      vec3 p = position, nn = normal;
      if (aPart > 0.5) p = vec3(p.x * uCord, p.y * aHang.x, p.z * uCord); else p = p * aHang.z - vec3(0.0, aHang.x, 0.0);
      float cy = cos(yaw), sy = sin(yaw);
      p = vec3(p.x * cy + p.z * sy, p.y, -p.x * sy + p.z * cy); nn = vec3(nn.x * cy + nn.z * sy, nn.y, -nn.x * sy + nn.z * cy);
      // then the whole swings about the fixing: what the script's pendulum says, and a little of its own in still air
      vec2 sw = aSw.xy + aTurn.z * vec2(sin(t * aSw.z + ph * 1.7), 0.6 * sin(t * aSw.z * 0.93 + ph * 0.6));
      float ang = length(sw);
      if (ang > 1e-5) {
        vec3 ax = vec3(-sw.y, 0.0, sw.x) / ang; float c = cos(ang), s = sin(ang);            // leaning toward (sw.x, sw.y) on the level
        p = p * c + cross(ax, p) * s + ax * dot(ax, p) * (1.0 - c); nn = nn * c + cross(ax, nn) * s + ax * dot(ax, nn) * (1.0 - c);
      }
      wp.xyz = aPivot + p; wn = nn; vHangTint = aTint;
      #ifdef HANG_GLOW
        vHangGlow = aGlow;
      #endif
    }`,
    fragmentPars: /* glsl */`varying vec3 vHangTint;
      #ifdef HANG_GLOW
        varying vec3 vHangGlow;
      #endif`,
    albedo: 'albedo *= vHangTint;',
    light: /* glsl */`
      #ifdef HANG_GLOW
        glow += vHangGlow;
      #endif`,
  } });
  const mesh = new THREE.Mesh(geo, mat); mesh.name = 'hangers'; mesh.frustumCulled = false;
  (o.parent || ctx.group).add(mesh);
  for (let i = 0; i < n; i++) aSw[i * 4 + 2] = S[i].w;        // its own pace, for the idle sway
  tSw.needsUpdate = true;
  const tmp = new THREE.Vector3();
  const pick = (which) => {
    if (which === 'all' || which == null) return items.map((_, i) => i);
    if (typeof which === 'number') return [which];
    if (Array.isArray(which)) return which;
    const out = [], r2 = which.radius * which.radius;
    for (let i = 0; i < n; i++) { const dx = aPivot[i * 3] - which.near[0], dz = aPivot[i * 3 + 2] - which.near[1]; if (dx * dx + dz * dz < r2) out.push(i); }
    return out;
  };
  const api = {
    object: mesh, material: mat, count: n,
    kick(which, v = 0.5, dir = null) {
      // what sets them swinging travels (a flock going by, a gust): with `speed` each is struck as it is reached,
      // one after another along `dir` from `near`, never all in the same instant
      const pace = which && typeof which === 'object' && !Array.isArray(which) && which.speed > 0 ? which.speed : 0;
      const dl = dir ? Math.hypot(dir[0], dir[1]) || 1 : 1;
      for (const i of pick(which)) {
        const s = S[i]; let dx, dz;
        if (dir) { dx = dir[0]; dz = dir[1]; } else { dx = aPivot[i * 3] - ctx.boat.x; dz = aPivot[i * 3 + 2] - ctx.boat.z; }
        const d = Math.hypot(dx, dz) || 1, j = 0.75 + 0.5 * ((i * 0.618) % 1), kx = dx / d * v * j, kz = dz / d * v * j;
        if (pace && dir) {
          const along = ((aPivot[i * 3] - which.near[0]) * dir[0] + (aPivot[i * 3 + 2] - which.near[1]) * dir[1]) / dl;
          s.pending.push({ at: ctx.time + Math.max(0, along) / pace, kx, kz });
        } else { s.st[1] += kx; s.st[3] += kz; }
        s.awake = true;
      }
      return api;
    },
    swingOf(i) { return Math.hypot(S[i].st[0], S[i].st[2]); },
    position(i, out = new THREE.Vector3()) { const s = S[i]; return out.set(aPivot[i * 3] + Math.sin(s.st[0]) * s.arm, aPivot[i * 3 + 1] - s.arm * Math.cos(Math.hypot(s.st[0], s.st[2])), aPivot[i * 3 + 2] + Math.sin(s.st[2]) * s.arm); },
  };
  ctx.onUpdate((dt) => {
    const t = ctx.time, boat = ctx.boat, F = wind.state, blowing = F.strength > 0, calm = clock.calm ? 0.5 : 1; let dirty = false;
    for (let i = 0; i < n; i++) {
      const s = S[i], st = s.st, k = i * 4;
      let rx = 0, rz = 0;
      if (blowing) { const f = wind.frontAt(aPivot[i * 3], aPivot[i * 3 + 2]) * 0.3 * calm; rx = F.nx * f; rz = F.nz * f; }
      if (o.hull) {
        const dx = aPivot[i * 3] - boat.x, dz = aPivot[i * 3 + 2] - boat.z;
        if (dx * dx + dz * dz < 9 && aPivot[i * 3 + 1] - s.reach < 2.1) {
          api.position(i, tmp);
          const px = tmp.x - boat.x, pz = tmp.z - boat.z, pd = Math.hypot(px, pz), R = 1.25;
          if (pd < R) {
            const push = Math.min(5, (R - pd) * 14 + 0.4) / s.arm;
            st[1] += px / (pd || 1) * push * dt * 8; st[3] += pz / (pd || 1) * push * dt * 8; s.awake = true;
            if (!s.touched) { s.touched = true; if (o.onTouch) o.onTouch(tmp.x, tmp.z, 'knock', i); }
          } else if (pd > R + 0.4) s.touched = false;
        }
      }
      if (s.pending.length) { for (let q = s.pending.length - 1; q >= 0; q--) if (t >= s.pending[q].at) { st[1] += s.pending[q].kx; st[3] += s.pending[q].kz; s.pending.splice(q, 1); } s.awake = true; }
      if (!s.awake && !blowing) continue;
      swingStep(st, 0, s.w, s.tau, rx, dt); swingStep(st, 2, s.w, s.tau, rz, dt);
      const a = Math.hypot(st[0], st[2]); if (a > 1.2) { st[0] *= 1.2 / a; st[2] *= 1.2 / a; }
      aSw[k] = st[0]; aSw[k + 1] = st[2]; dirty = true;
      s.awake = Math.abs(st[0]) + Math.abs(st[1]) + Math.abs(st[2]) + Math.abs(st[3]) > 2e-4 || blowing;
    }
    if (dirty) tSw.needsUpdate = true;
  });
  return api;
}
