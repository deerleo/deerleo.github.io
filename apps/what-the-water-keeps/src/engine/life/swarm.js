// Swarms: the insects and small wanderers that live as stateless fields on the GPU. Each instance carries a few
// seeds and a home; where it is at any moment is a closed function of those and of the realm's clock, worked out in
// the vertex shader, so thousands cost one draw call and no work on the CPU. The page for the people who build areas
// is docs/life/insects.md; a realm imports everything from './insects.js', which re-exports this file.
//
//   makeMayflies   swarms that dance (rise fast, parachute down), hundreds at rest on timbers that let go in a wave,
//                  a hatch from the water (each with its ring), spent wings falling to lie as pale crosses
//   makeMidges     columns that hold station over a point and breathe
//   makeMoths      moths drawn to flames: tightening loops, settling; at rest roof-wise on perches; opening flat
//   makeSedgeFlies flat wheels just above the water that never rise, each touch a pin ring
//   makeMotes      motes in the air or under the water; lint in shafts of light
//   makeBubbles    chains of bubbles rising from below, each popping as a pin ring
//
// The machinery they share (also used by the watched agents in insects.js):
//   - a model's hinged parts (wings, tails) merged into ONE instanced mesh, each vertex knowing its part and pivot,
//     turned in the vertex shader (loadInsectParts, buildInsectGeometry, INSECT_GLSL);
//   - the rules for when a thing is lit (litRule): only against the sun, only inside a shaft, only over a light
//     under the water;
//   - things that push a swarm aside and let it close again: the hull, a passing bird (makeShoves);
//   - the keep-out round the rider's eye: nothing comes nearer the lens than 0.7 m.
import * as THREE from 'three';
import { WATER_GLSL, waterUniforms } from '../water-final.js';

const TAU = Math.PI * 2;
const DEG = Math.PI / 180;
const v3 = (p, out = new THREE.Vector3()) => (p && p.isVector3 ? out.copy(p) : Array.isArray(p) ? out.set(p[0], p[1], p[2]) : p ? out.set(p.x, p.y, p.z) : out);
const col = (c) => (c && c.isColor ? c : new THREE.Color(c ?? '#ffffff'));
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

// ------------------------------------------------------------------------------------------------ shared GLSL
/**
 * Small maths for insect shaders. Angles in radians. The creature's own frame: x = its left, y = up, z = forward.
 *   liHinge(v, side, flap, sweep, twist)   a wing on its hinge: v is relative to the pivot; side +1 left, -1 right;
 *                                          flap lifts the tip, sweep carries it backward, twist lifts the leading edge
 */
export const INSECT_GLSL = /* glsl */`
  mat3 liRx(float a) { float c = cos(a), s = sin(a); return mat3(1.0, 0.0, 0.0, 0.0, c, s, 0.0, -s, c); }
  mat3 liRy(float a) { float c = cos(a), s = sin(a); return mat3(c, 0.0, -s, 0.0, 1.0, 0.0, s, 0.0, c); }
  mat3 liRz(float a) { float c = cos(a), s = sin(a); return mat3(c, s, 0.0, -s, c, 0.0, 0.0, 0.0, 1.0); }
  mat3 liHingeM(float side, float flap, float sweep, float twist) { return liRz(side * flap) * liRy(side * sweep) * liRx(-twist); }
  float liHash(float n) { return fract(sin(n * 127.1 + 0.7) * 43758.5453); }
  vec2 liHash2(float n) { return fract(sin(vec2(n * 127.1 + 1.3, n * 269.5 + 3.1)) * 43758.5453); }
  vec3 liQuat(vec4 q, vec3 v) { return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v); }
  // nothing comes nearer the rider's eye than uKeep metres: a smooth push outward that leaves far things where they were
  vec3 liKeepOut(vec3 c, vec3 eye, float keep) {
    vec3 d = c - eye; float dist = length(d) + 1e-5, k4 = keep * keep * keep * keep;
    return eye + d * (sqrt(sqrt(dist * dist * dist * dist + k4)) / dist);
  }
`;
/** For fragment shaders: an ordered dither, 0..1, for stippling thin membranes and the blur of a beating wing. */
export const STIPPLE_GLSL = /* glsl */`
  float liBayer2(vec2 a) { a = floor(a); return fract(a.x / 2.0 + a.y * a.y * 0.75); }
  float liBayer4(vec2 a) { return liBayer2(0.5 * a) * 0.25 + liBayer2(a); }
`;

// ------------------------------------------------------------------------------------------------ model parts
/**
 * Load a hinged insect model (written by a script in source-art/models/life/) and return its parts WITHOUT putting
 * it in the realm: [{ name, slot, geometry, pivot }]. `name` is the part's name in Blender ('wing_fl', 'abdomen';
 * the fixed body has the file's name); `pivot` is its hinge in the model's own space; the geometry's positions are
 * relative to that pivot. Model space: x = the creature's left, y = up, z = forward, metres at drawn size.
 */
export async function loadInsectParts(ctx, file) {
  const m = await ctx.kit.model(file, {});
  m.group.removeFromParent();
  const out = [];
  for (const node of m.group.children) {
    const meshes = [];
    node.traverse((o) => { if (o.isMesh) meshes.push(o); });
    for (const mesh of meshes) out.push({ name: node.name, slot: mesh.userData.slot || 'paint', geometry: mesh.geometry, pivot: node.position.clone() });
  }
  if (!out.length) console.error(`INVALID_MODEL ${file}: no meshes found for an insect`);
  return out;
}

/**
 * Merge an insect's parts into one geometry for an instanced draw. `ids(name)` gives each part its number in the
 * shader (return null to leave a part out); it may return an array to add the part several times (ghost wings).
 * Attributes: position (relative to the pivot), aPivot, normal, color, aPart (the number), aMem (1 in the slot
 * 'membrane': thin two-sided sheets), aHair (for parts whose number is in opts.hair: xyz = the sliver's direction
 * from its base, w = -1 / +1 for the two base corners and 0 for the tip, so the shader can widen it to a hairline).
 */
export function buildInsectGeometry(parts, ids, opts = {}) {
  const hair = new Set(opts.hair || []), memOnly = new Set(opts.membraneOnly || []);
  const pos = [], piv = [], nrm = [], colr = [], part = [], mem = [], hairs = [], index = [];
  let base = 0;
  const c = new THREE.Color();
  for (const p of parts) {
    let list = ids(p.name, p);
    if (list == null) continue;
    if (!Array.isArray(list)) list = [list];
    const g = p.geometry, P = g.attributes.position, N = g.attributes.normal, C = g.attributes.color, I = g.index;
    for (const id of list) {
      if (memOnly.has(id) && p.slot !== 'membrane') continue;
      const hv = new Float32Array(P.count * 4);
      if (hair.has(id)) {                                  // every triangle is one sliver: its shortest edge is the base
        const tri = I ? I.array : null, nt = (I ? I.count : P.count) / 3, a = new THREE.Vector3(), b = new THREE.Vector3(), d = new THREE.Vector3();
        for (let t = 0; t < nt; t++) {
          const v = [0, 1, 2].map((k) => (tri ? tri[t * 3 + k] : t * 3 + k));
          let best = 0, bl = Infinity;
          for (let k = 0; k < 3; k++) { a.fromBufferAttribute(P, v[k]); b.fromBufferAttribute(P, v[(k + 1) % 3]); const l = a.distanceTo(b); if (l < bl) { bl = l; best = k; } }
          const i0 = v[best], i1 = v[(best + 1) % 3], i2 = v[(best + 2) % 3];
          a.fromBufferAttribute(P, i0).add(b.fromBufferAttribute(P, i1)).multiplyScalar(0.5);
          d.fromBufferAttribute(P, i2).sub(a).normalize();
          for (const [i, s] of [[i0, -1], [i1, 1], [i2, 0]]) hv.set([d.x, d.y, d.z, s], i * 4);
        }
      }
      for (let i = 0; i < P.count; i++) {
        pos.push(P.getX(i), P.getY(i), P.getZ(i)); piv.push(p.pivot.x, p.pivot.y, p.pivot.z);
        nrm.push(N.getX(i), N.getY(i), N.getZ(i));
        if (C) colr.push(C.getX(i), C.getY(i), C.getZ(i)); else colr.push(1, 1, 1);
        part.push(id); mem.push(p.slot === 'membrane' ? 1 : 0);
        hairs.push(hv[i * 4], hv[i * 4 + 1], hv[i * 4 + 2], hv[i * 4 + 3]);
      }
      if (I) for (let i = 0; i < I.count; i++) index.push(base + I.getX(i)); else for (let i = 0; i < P.count; i++) index.push(base + i);
      base += P.count;
    }
  }
  void c;
  const geo = new THREE.InstancedBufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('aPivot', new THREE.Float32BufferAttribute(piv, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colr, 3));
  geo.setAttribute('aPart', new THREE.Float32BufferAttribute(part, 1));
  geo.setAttribute('aMem', new THREE.Float32BufferAttribute(mem, 1));
  if (hair.size) geo.setAttribute('aHair', new THREE.Float32BufferAttribute(hairs, 4));
  geo.setIndex(index);
  geo.userData.triangles = index.length / 3;
  return geo;
}

/** An instanced attribute on one or several geometries (they share the buffer: it is uploaded once). */
export function instanced(geos, name, array, size, dynamic = false) {
  const a = new THREE.InstancedBufferAttribute(array, size);
  if (dynamic) a.setUsage(THREE.DynamicDrawUsage);
  for (const g of [].concat(geos)) g.setAttribute(name, a);
  return a;
}

/** Pixels: the world size of one pixel at one metre from the eye, for the pass being drawn (call from onBeforeRender). */
const _sz = new THREE.Vector2();
export function pixelAtOneMetre(renderer, camera) {
  const rt = renderer.getRenderTarget(), h = rt ? rt.height : renderer.getDrawingBufferSize(_sz).y;
  return 2 / (Math.max(1, h) * camera.projectionMatrix.elements[5]);
}
/** The same for the finished picture, whatever pass is being drawn: a creature that is drawn up to a size on the screen must be the
 *  same size in the mirror and in the pre-pass (which are coarser) as it is in the picture. */
export function pixelOnScreen(renderer, camera) {
  return 2 / (Math.max(1, renderer.getDrawingBufferSize(_sz).y) * camera.projectionMatrix.elements[5]);
}

// ------------------------------------------------------------------------------------------------ when a thing is lit
/**
 * The rules for when a small thing is lit, as a piece of a gouache `extend` (and as plain GLSL for point shaders).
 *   lit: null | 'plain'            the realm's ordinary light
 *        'sun' | { rule: 'sun', dir, color, gain, power, dull, thin }
 *                                  only against the sun: bright when it hangs between the eye and the light, a dull
 *                                  speck otherwise. dir = the way the light TRAVELS (default: the realm's key light,
 *                                  followed live); power 6 = within about 25 degrees of the sun; dull = how much of
 *                                  its ordinary lit colour is left (0.55); thin = how much less a solid body takes
 *                                  than a wing (0.4)
 *        { rule: 'shafts', shafts: [{ from: [x,y,z], to: [x,y,z], radius, radiusTo, color, gain }], dull }
 *                                  only inside a shaft (a volume the area gives: a cone from `from` to `to`); it takes
 *                                  the shaft's colour, and is all but invisible outside (dull 0.08)
 *        { rule: 'under', lights: [{ x, z, radius, color, gain }], dark, height, cap }
 *                                  only over a light under the water: lit from beneath by the nearest lights, falling
 *                                  to `dark` (0) of its own colour outside them and with height above the water; never
 *                                  brighter than `cap` (0.8), so that it is lit and does not glow
 * Returns { ext, uniforms, glsl, set... }: `ext` goes into kit.gouache({ extend: [..., rule.ext] }); the varying
 * vLit (vec4: rgb light, a = amount) must be filled in the vertex shader with `vLit = liLit(worldPosition);`.
 * Shafts and lights can be changed at any time: rule.setShafts(list), rule.setLights(list); to move one light, change
 * rule.lights[i] (x, z, radius, gain, on) and call rule.push().
 */
export const MAX_SHAFTS = 12, MAX_UNDER = 24;
export function litRule(ctx, lit) {
  const S = ctx.engine.shared;
  const o = typeof lit === 'string' ? { rule: lit } : { ...(lit || { rule: 'plain' }) };
  const rule = o.rule || 'plain';
  const uniforms = {}, api = { rule, uniforms };
  let vpars = 'varying vec4 vLit;\n', vfn = 'vec4 liLit(vec3 p) { return vec4(0.0); }\n', fpars = 'varying vec4 vLit;\n', light = '';
  if (rule === 'sun') {
    const follow = !o.dir;
    uniforms.uLitDir = follow ? S.uKeyDir : { value: v3(o.dir).normalize() };
    uniforms.uLitColor = { value: col(o.color ?? '#ffe7a8').clone() };
    uniforms.uLitK = { value: new THREE.Vector4(o.dull ?? 0.55, o.gain ?? 1.1, o.power ?? 6, o.thin ?? 0.4) };
    fpars += 'uniform vec3 uLitDir, uLitColor; uniform vec4 uLitK;\n';
    // V looks from the thing to the eye; the light travels along uLitDir: they agree when the thing hangs in front of the light
    light = `{ float sc = pow(max(dot(V, normalize(uLitDir)), 0.0), uLitK.z); c = c * uLitK.x + uLitColor * (uLitK.y * sc * mix(uLitK.w, 1.0, vThin)); }`;
    api.set = (k) => { if (k.dull != null) uniforms.uLitK.value.x = k.dull; if (k.gain != null) uniforms.uLitK.value.y = k.gain; if (k.power != null) uniforms.uLitK.value.z = k.power; if (k.color) uniforms.uLitColor.value.set(k.color); if (k.dir && !follow) uniforms.uLitDir.value.copy(v3(k.dir)).normalize(); };
  } else if (rule === 'shafts') {
    uniforms.uShaftA = { value: Array.from({ length: MAX_SHAFTS }, () => new THREE.Vector4()) };
    uniforms.uShaftB = { value: Array.from({ length: MAX_SHAFTS }, () => new THREE.Vector4()) };
    uniforms.uShaftC = { value: Array.from({ length: MAX_SHAFTS }, () => new THREE.Vector3()) };
    uniforms.uShaftN = { value: 0 }; uniforms.uLitK = { value: new THREE.Vector4(o.dull ?? 0.08, 1, 0, 0) };
    const decl = `uniform vec4 uShaftA[${MAX_SHAFTS}], uShaftB[${MAX_SHAFTS}]; uniform vec3 uShaftC[${MAX_SHAFTS}]; uniform int uShaftN;\n`;
    vpars += decl; fpars += 'uniform vec4 uLitK;\n';
    vfn = /* glsl */`vec4 liLit(vec3 p) {
      vec3 sum = vec3(0.0); float amt = 0.0;
      for (int i = 0; i < ${MAX_SHAFTS}; i++) { if (i >= uShaftN) break;
        vec3 a = uShaftA[i].xyz, ab = uShaftB[i].xyz - a; float t = clamp(dot(p - a, ab) / max(dot(ab, ab), 1e-6), 0.0, 1.0);
        float r = mix(uShaftA[i].w, uShaftB[i].w, t), d = length(p - (a + ab * t));
        float k = (1.0 - smoothstep(r * 0.45, r, d)) * smoothstep(0.0, 0.04, t) * (1.0 - smoothstep(0.94, 1.0, t));
        sum += uShaftC[i] * k; amt = max(amt, k); }
      return vec4(sum, amt); }\n`;
    light = `c = c * mix(uLitK.x, 1.0, vLit.a) + vLit.rgb * (0.35 + 0.65 * albedo);`;
    api.setShafts = (list) => {
      const n = Math.min(MAX_SHAFTS, list.length);
      for (let i = 0; i < n; i++) {
        const s = list[i], a = v3(s.from), b = v3(s.to);
        uniforms.uShaftA.value[i].set(a.x, a.y, a.z, s.radius ?? 1.5); uniforms.uShaftB.value[i].set(b.x, b.y, b.z, s.radiusTo ?? s.radius ?? 1.5);
        const k = col(s.color ?? '#ffe9c0'); uniforms.uShaftC.value[i].set(k.r, k.g, k.b).multiplyScalar(s.gain ?? 1);
      }
      uniforms.uShaftN.value = n; api.shafts = list.slice(0, n);
    };
    api.setShafts(o.shafts || []);
  } else if (rule === 'under') {
    uniforms.uUnderP = { value: Array.from({ length: MAX_UNDER }, () => new THREE.Vector4(0, 0, 1, 0)) };     // x, z, radius, on
    uniforms.uUnderC = { value: Array.from({ length: MAX_UNDER }, () => new THREE.Vector3()) };
    uniforms.uUnderN = { value: 0 }; uniforms.uLitK = { value: new THREE.Vector4(o.dark ?? 0.0, o.height ?? 1.4, o.cap ?? 0.8, 0) };
    vpars += `uniform vec4 uUnderP[${MAX_UNDER}]; uniform vec3 uUnderC[${MAX_UNDER}]; uniform int uUnderN; uniform vec4 uLitK;\n`;
    fpars += 'uniform vec4 uLitK;\n';
    vfn = /* glsl */`vec4 liLit(vec3 p) {
      vec3 sum = vec3(0.0); float amt = 0.0, up = exp(-max(p.y, 0.0) / uLitK.y);
      for (int i = 0; i < ${MAX_UNDER}; i++) { if (i >= uUnderN) break;
        float d = length(p.xz - uUnderP[i].xy), k = (1.0 - smoothstep(uUnderP[i].z * 0.35, uUnderP[i].z, d)) * uUnderP[i].w * up;
        sum += uUnderC[i] * k; amt = max(amt, k); }
      return vec4(sum, amt); }\n`;
    // lit from beneath, and by the lamps that travel (the lantern, the kept lamp, the realm's local lights); the realm's key light does not reach them
    light = `c = albedo * (uLitK.x * (shade + ambient) + vLit.rgb) + albedo * lamps; { float m = max(c.r, max(c.g, c.b)); c *= min(1.0, uLitK.z / max(m, 1e-3)); }`;      // lit, never glowing: it is not a light
    const lights = [];
    api.lights = lights;
    api.setLights = (list) => { lights.length = 0; for (const l of list.slice(0, MAX_UNDER)) lights.push({ x: l.x, z: l.z, radius: l.radius ?? 1.5, color: col(l.color ?? '#f3a77e').clone(), gain: l.gain ?? 1, on: l.on ?? 1 }); api.push(); };
    api.push = () => {
      for (let i = 0; i < lights.length; i++) { const l = lights[i]; uniforms.uUnderP.value[i].set(l.x, l.z, l.radius, l.on); uniforms.uUnderC.value[i].set(l.color.r, l.color.g, l.color.b).multiplyScalar(l.gain); }
      uniforms.uUnderN.value = lights.length;
    };
    api.setLights(o.lights || []);
  }
  api.vertexPars = vpars + vfn; api.fragmentPars = fpars; api.light = light;
  api.ext = { uniforms, vertexPars: api.vertexPars, fragmentPars: fpars, light };
  return api;
}

// ------------------------------------------------------------------------------------------------ shoves and the hull
/**
 * Things that push a swarm aside and let it close again behind them: the hull, a swift, a bat. Up to eight at once.
 *   const sh = makeShoves(ctx, { hull: 1.6, close: 3 });       // the hull pushes with this radius; the lane closes in 3 s
 *   sh.push(x, y, z, radius, seconds)                           // a hole of that radius opens here now and closes over `seconds`
 * GLSL: `c = liShove(c, flat);` (flat = 1.0 pushes only sideways: for things on the water).
 */
export const MAX_SHOVES = 8;
export function makeShoves(ctx, opts = {}) {
  const o = { hull: 0, close: 3, hullHeight: 1.7, ...opts };
  const uniforms = {
    uShove: { value: Array.from({ length: MAX_SHOVES }, () => new THREE.Vector4(0, -1000, 0, 1)) },
    uShoveK: { value: new Float32Array(MAX_SHOVES) },
    uHullSeg: { value: new THREE.Vector4(0, 0, 0, -1) }, uHullK: { value: new THREE.Vector3(o.hull, o.hullHeight, o.hull > 0 ? 1 : 0) },
  };
  const live = [];                                          // { x, y, z, r, life, age }
  let lx = NaN, lz = NaN;
  const api = {
    uniforms,
    glsl: /* glsl */`uniform vec4 uShove[${MAX_SHOVES}]; uniform float uShoveK[${MAX_SHOVES}]; uniform vec4 uHullSeg; uniform vec3 uHullK;
      // A hole of radius a opens without piling anything up at its rim: what was within 2a is spread evenly through
      // the shell between a and 2a (a map that keeps the air's density nearly as it was), and nothing beyond 2a moves.
      float liOpen(float dist, float a, float flatten) {
        if (dist >= 2.0 * a) return dist;
        return flatten > 0.5 ? sqrt(a * a + 0.75 * dist * dist) : pow(a * a * a + 0.875 * dist * dist * dist, 1.0 / 3.0);
      }
      vec3 liHull(vec3 c) {                                                          // the hull itself: a capsule from stern to bow (alone: for things afloat, which the bow shoulders aside)
        if (uHullK.z > 0.0 && c.y < uHullK.y) {
          vec2 d = c.xz - uHullSeg.xy; float t = clamp(dot(d, uHullSeg.zw), -1.7, 2.6); vec2 q = d - uHullSeg.zw * t; float dist = length(q) + 1e-4;
          c.xz += q / dist * (liOpen(dist, uHullK.x * (1.0 - smoothstep(uHullK.y * 0.55, uHullK.y, c.y)), 1.0) - dist); }
        return c; }
      vec3 liShove(vec3 c, float flatten) {
        for (int i = 0; i < ${MAX_SHOVES}; i++) { float k = uShoveK[i]; if (k <= 0.0) continue;
          vec3 d = c - uShove[i].xyz; d.y *= 1.0 - flatten; float dist = length(d) + 1e-4;
          c += d / dist * (liOpen(dist, uShove[i].w * k, flatten) - dist); }
        return liHull(c); }\n`,
    /** A lane opens at (x, y, z): nothing within `r` metres of the point, what was there moved out as far as 2r; it closes over `seconds`. */
    push(x, y, z, r, seconds = 2) {
      if (live.length >= MAX_SHOVES) live.shift();
      live.push({ x, y, z, r, life: Math.max(0.05, seconds), age: 0 });
    },
    update(dt) {
      const boat = ctx.boat, U = uniforms.uShove.value, K = uniforms.uShoveK.value;
      let n = 0;
      if (o.hull > 0) {                                     // the hull, and a trail of where it has just been: the lane closes behind it
        uniforms.uHullSeg.value.set(boat.x, boat.z, -Math.sin(boat.heading), -Math.cos(boat.heading));
        if (Number.isNaN(lx)) { lx = boat.x; lz = boat.z; }
        if (Math.hypot(boat.x - lx, boat.z - lz) > o.hull * 0.8) { api.push(lx, 0.4, lz, o.hull, o.close); lx = boat.x; lz = boat.z; }
      }
      for (let i = live.length - 1; i >= 0; i--) { live[i].age += dt; if (live[i].age >= live[i].life) live.splice(i, 1); }
      for (const s of live) { if (n >= MAX_SHOVES) break; const k = 1 - s.age / s.life; U[n].set(s.x, s.y, s.z, s.r); K[n] = k * k * (3 - 2 * k); n++; }
      for (; n < MAX_SHOVES; n++) K[n] = 0;
    },
  };
  return api;
}

// ------------------------------------------------------------------------------------------------ common plumbing
function common(ctx, o) {
  const S = ctx.engine.shared, engine = ctx.engine;
  const uT = { value: 0 }, uPx = { value: 0.001 }, uMirror = { value: 0 }, uKeep = { value: o.keepOut ?? 0.75 };
  const parent = o.parent || ctx.group;
  const calm = !!ctx.reducedMotion;
  /** Per-pass set-up for a mesh: pixel size, whether this is the mirror, and how many instances the mirror draws. */
  const perPass = (mesh, geo, n, mirrorShare = 1) => {
    mesh.onBeforeRender = (renderer, scene, camera) => {
      uPx.value = geo && geo.isInstancedBufferGeometry ? pixelOnScreen(renderer, camera) : pixelAtOneMetre(renderer, camera); uMirror.value = engine.reflecting ? 1 : 0;
      if (geo && geo.isInstancedBufferGeometry) geo.instanceCount = engine.reflecting ? Math.max(1, Math.round(n() * mirrorShare)) : n();
      mesh.material.uniformsNeedUpdate = true;
    };
  };
  const mirrorMode = (obj, mode) => { if (mode === false) ctx.only(obj, 'direct'); };
  return { S, engine, uT, uPx, uMirror, uKeep, parent, calm, perPass, mirrorMode };
}
const count = (ctx, n, exact) => (exact ? Math.round(n) : Math.max(n > 0 ? 1 : 0, Math.round(n * (ctx.quality.density ?? 1))));

// Shared by every instanced insect: what a vertex needs to know about itself, and the fragment's stipple.
const PART_ATTRS = /* glsl */`attribute vec3 aPivot; attribute float aPart, aMem; varying float vThin, vCover;\n`;
const FRAG_STIPPLE_PARS = /* glsl */`varying float vThin, vCover; uniform vec2 uPale;\n${STIPPLE_GLSL}`;
// thin sheets let the light through where their paint is pale: an ordered stipple (never blended, so nothing needs sorting)
const FRAG_STIPPLE = /* glsl */`if (vThin > 0.5) { float pale = smoothstep(uPale.x, uPale.y, dot(albedo, vec3(0.299, 0.587, 0.114)));
      if (liBayer4(gl_FragCoord.xy) + 0.03 > mix(1.0, vCover, pale)) discard; }`;

// ================================================================================================ mayflies
/**
 * Mayflies: the long-tailed fly whose dance is a cycle of rising fast and parachuting slowly down. One call makes the
 * dancing swarms, the hundreds at rest on timber, the hatch from the water and the spent wings; cues drive the rest.
 *
 *   const may = await makeMayflies(ctx, {
 *     swarms: [{ at: [32, -9.5], count: 70, radius: 1.8 }],            // dancing from the start
 *     rest: { points: [{ x, y, z, nx, ny, nz }, ...], count: 600 },    // at rest on timbers until release()
 *     hatch: [{ at: [49, 0], radius: 9.5, count: 330 }],               // unborn until hatch(i)
 *   });
 *   ctx.stage.cue('letgo', { s: 37, settle: () => may.settle() }, () => may.release({ from: [boat.x, boat.z], speed: 6 }));
 *
 * options
 *   swarms    [{ at: [s, d] | position: [x, y, z], count, radius = 1.8, height: [0.4, 4.5] }]
 *   rest      { points: [{ x, y, z, nx, ny, nz }], count, to: { radius = 3, height: [0.5, 3.5] } }   perches with the
 *             surface normal (under a soffit the normal points down: they hang). `to` is where the released ones go
 *             to dance, relative to each one's own perch
 *   hatch     [{ at | position, radius = 9.5, count, height: [0.4, 4.5] }]   zones of water that hatch
 *   size      1 = drawn 12 cm overall (body 4 cm, tails 8 cm); 0.5 is life size. minPixels 4: far off, body and
 *             wings are drawn no smaller than this (the painter's filter flattens anything smaller)
 *   tails     2 (what the landing's page draws: a clean V) or 3 (the May dun as it is: the model carries three, and
 *             the middle one is left out for 2)
 *   cycle     3.7 s for one rise and fall; riseTime 1.5 s of it; rise 1.4 m; breathe 0.6 m (the whole swarm, over
 *             breathePeriod 9 s)
 *   wind      [x, z]: they face into it (default: the water's wind)
 *   drift     [x, z] m/s: the current that carries the spent
 *   lit       a lit rule (see litRule); default 'sun': a dull straw speck except against the light
 *   keepOut   0.8 m: how far its middle is kept from the lens (so that no tail comes within 0.7 m); hull: 0.95 m:
 *             how far from the boat's centre line they are kept (0 = off)
 *   mirror    true | false | a share 0..1 of them drawn in the water's reflection (default 0.5, with the far mesh)
 *   ripples   true: births and spent landings write rings; onTouch(x, z, kind) kind = 'hatch' | 'spent'
 *   material  extra kit.gouache options (rim, backlight ...); seed; exact (do not thin with quality); parent
 * returns { object, count, near, far, uniforms,
 *   release({ from: [x, z], speed = 6, delay = 0 })   those at rest let go, in a wave that runs out from a point
 *   hatch(i, { ramp = 4, rate = 9 })                  zone i begins: rings per second climb over `ramp` seconds
 *   spend(n, seconds = 20, { at })                    n of those in the air fall spent over that long (for a cue's
 *                                                     `settle`: at: ctx.time - 40, they fell a while ago)
 *   stir(i, { rise = 1, seconds = 3.2, turn = 1.2 })  swarm i swirls up and settles
 *   part(x, y, z, radius, seconds = 2)                a lane opens (a swift passes) and closes
 *   attend(lamp, { circle = 12, seats: [fn...] })     some gather round a lamp (a Vector3 or a function giving one);
 *                                                     attend(null) lets them go
 *   strength(k, seconds = 10)                         thin the dance to a share k of itself (1 = all)
 *   settle('all' | 'rest' | 'hatch', i)               the after-state at once (for a cue's `settle`): those at rest
 *                                                     released, or zone i (or every zone) hatched, long ago
 *   counts()                                          { resting, air, spent, unborn } now }
 */
export async function makeMayflies(ctx, opts = {}) {
  const o = { swarms: [], rest: null, hatch: [], size: 1, minPixels: 4, tails: 2, cycle: 3.7, riseTime: 1.5, rise: 1.4, breathe: 0.6, breathePeriod: 9, wind: null, drift: [0, 0],
    lit: 'sun', keepOut: 0.8, hull: 0.95, mirror: 0.5, ripples: true, onTouch: null, material: {}, seed: 5, exact: false, nearDistance: 10, ...opts };
  const { THREE: T3, kit } = ctx; void T3;
  const C = common(ctx, o), rnd = ctx.rng(o.seed);
  const [nearParts, farParts] = await Promise.all([loadInsectParts(ctx, 'models/life/mayfly.glb'), loadInsectParts(ctx, 'models/life/mayfly_far.glb')]);
  const ids = (name) => (name === 'wing_l' ? 1 : name === 'wing_r' ? 2 : name === 'tails' ? 5 : 0);
  const gNear = buildInsectGeometry(nearParts, ids, { hair: [5] }), gFar = buildInsectGeometry(farParts, ids, { hair: [5] });

  // ---- the instances
  const groups = [];
  const at = (g) => (g.position ? v3(g.position) : kit.at(g.at[0], g.at[1] ?? 0, g.at[2] ?? 0));
  o.swarms.forEach((g, i) => groups.push({ kind: 0, i, n: count(ctx, g.count ?? 60, o.exact), c: at(g), radius: g.radius ?? 1.8, height: g.height || [0.4, 4.5] }));
  const restN = o.rest ? count(ctx, o.rest.count ?? o.rest.points.length, o.exact) : 0;
  if (restN) groups.push({ kind: 1, i: 0, n: restN });
  o.hatch.forEach((g, i) => groups.push({ kind: 2, i, n: count(ctx, g.count ?? 300, o.exact), c: at(g), radius: g.radius ?? 9.5, height: g.height || [0.4, 4.5] }));
  const N = groups.reduce((a, g) => a + g.n, 0);
  const aHome = new Float32Array(N * 4), aRest = new Float32Array(N * 4), aNrm = new Float32Array(N * 3), aSeed = new Float32Array(N * 4), aTimes = new Float32Array(N * 4), aSpent = new Float32Array(N * 4);
  const NEVER = 1e9, LONG_AGO = -1e5;
  const baseHeight = (lo, hi) => lo + (hi - lo - o.rise) * Math.pow(rnd(), 1.7);          // thickest low down
  let k = 0;
  const swarmCentres = [];
  for (const g of groups) {
    g.start = k;
    for (let j = 0; j < g.n; j++, k++) {
      aSeed.set([rnd(), rnd(), rnd(), rnd()], k * 4);
      aSpent.set([0, 0, NEVER, 1], k * 4);
      if (g.kind === 0) {
        const a = rnd() * TAU, r = Math.sqrt(rnd()) * g.radius * 0.85;
        aHome.set([g.c.x + Math.cos(a) * r, baseHeight(g.height[0], g.height[1]), g.c.z + Math.sin(a) * r, g.radius * 0.5], k * 4);
        aRest.set([0, 0, 0, 0], k * 4); aNrm.set([0, 1, 0], k * 3);
        aTimes.set([LONG_AGO, 0, 0, (g.i + 0.5) / 16], k * 4);
      } else if (g.kind === 1) {
        const pts = o.rest.points, p = pts[Math.floor(j * pts.length / g.n + rnd() * 0.999) % pts.length], to = { radius: 3, height: [0.5, 3.5], ...(o.rest.to || {}) };
        const a = rnd() * TAU, r = Math.sqrt(rnd()) * to.radius;
        aRest.set([p.x, p.y, p.z, 1], k * 4); aNrm.set([p.nx ?? 0, p.ny ?? 1, p.nz ?? 0], k * 3);
        aHome.set([p.x + Math.cos(a) * r, baseHeight(to.height[0], to.height[1]), p.z + Math.sin(a) * r, 1.2], k * 4);
        aTimes.set([NEVER, 0, 0, (8 + 0.5) / 16], k * 4);
      } else {
        const a = rnd() * TAU, r = Math.sqrt(rnd()) * g.radius, x = g.c.x + Math.cos(a) * r, z = g.c.z + Math.sin(a) * r;
        aRest.set([x, 0.004, z, 2], k * 4); aNrm.set([0, 1, 0], k * 3);
        aHome.set([x + (rnd() - 0.5) * 2, baseHeight(g.height[0], g.height[1]), z + (rnd() - 0.5) * 2, 1.4], k * 4);
        aTimes.set([NEVER, 0.8 + rnd() * 0.7, 0, (9 + g.i + 0.5) / 16], k * 4);
      }
    }
    if (g.kind === 0) swarmCentres[g.i] = g.c;
  }
  const attrs = {
    home: instanced([gNear, gFar], 'aHome', aHome, 4), rest: instanced([gNear, gFar], 'aRest', aRest, 4), nrm: instanced([gNear, gFar], 'aNrm', aNrm, 3),
    seed: instanced([gNear, gFar], 'aSeed', aSeed, 4), times: instanced([gNear, gFar], 'aTimes', aTimes, 4), spent: instanced([gNear, gFar], 'aSpent', aSpent, 4),
  };
  gNear.instanceCount = gFar.instanceCount = N;

  // ---- the shader
  const rule = litRule(ctx, o.lit), shoves = makeShoves(ctx, { hull: o.hull, close: 2.5 });
  const wl = ctx.waterLook && ctx.waterLook.wind, wind0 = o.wind || (wl ? [wl[0], wl[1]] : [0.6, 0.8]);
  const U = {
    uT: C.uT, uPx: C.uPx, uMirror: C.uMirror, uKeep: C.uKeep, ...shoves.uniforms,
    uSize: { value: o.size }, uMinPx: { value: o.minPixels }, uTails: { value: o.tails }, uFlick: { value: 0 }, uPale: { value: new THREE.Vector2(0.22, 0.5) },
    uDance: { value: new THREE.Vector4(o.cycle, o.riseTime / o.cycle, o.rise * (C.calm ? 0.5 : 1), o.breathe * (C.calm ? 0.5 : 1)) },
    uBreathe: { value: TAU / o.breathePeriod }, uWindYaw: { value: Math.atan2(-wind0[0], -wind0[1]) }, uDrift: { value: new THREE.Vector2(o.drift[0], o.drift[1]) },
    uStir: { value: Array.from({ length: 8 }, (_, i) => new THREE.Vector4(swarmCentres[i] ? swarmCentres[i].x : 0, swarmCentres[i] ? swarmCentres[i].z : 0, 0, 0)) },
    uDensity: { value: 1 }, uAttend: { value: 0 }, uLamp: { value: new THREE.Vector3(0, -100, 0) }, uSeat: { value: Array.from({ length: 4 }, () => new THREE.Vector3(0, -100, 0)) },
    uNearFar: { value: new THREE.Vector3(o.nearDistance, 1, 0) },                         // switch distance; band; 0 = this is the near mesh, 1 = the far
  };
  const ext = {
    uniforms: U,
    vertexPars: /* glsl */`${PART_ATTRS} ${INSECT_GLSL} ${shoves.glsl}
      attribute vec4 aHome, aRest, aSeed, aTimes, aSpent, aHair; attribute vec3 aNrm;
      uniform float uT, uPx, uMirror, uKeep, uSize, uTails, uFlick, uBreathe, uWindYaw, uDensity, uAttend, uMinPx;
      uniform vec4 uDance, uStir[8]; uniform vec2 uDrift; uniform vec3 uLamp, uSeat[4], uNearFar;
      // where a dancer is at time t: a place in its swarm that shifts a little with every cycle, and the cycle's height
      vec3 liDance(float t, out float u, out float yaw) {
        float Tc = uDance.x * (0.85 + 0.3 * aSeed.x), ph = t / Tc + aSeed.y * 7.0, cyc = floor(ph); u = ph - cyc;
        float e = u * u * (3.0 - 2.0 * u), key = cyc + aSeed.z * 31.0;
        vec2 off = mix(liHash2(key), liHash2(key + 1.0), e) - 0.5;
        float fr = uDance.y, H = uDance.z * (0.7 + 0.55 * liHash(key * 1.7 + 4.0));
        // The rise: the wings take it (no start from nothing at full speed), it climbs fast, and it slows into the top as they stop.
        // The parachute: it settles into one steady sinking speed, and brakes over the last eighth as the wings catch it again.
        // Both ends are at rest for an instant, so the turn at the bottom is a turn and not a bounce.
        float xr = clamp(u / fr, 0.0, 1.0), xf = clamp((u - fr) / (1.0 - fr), 0.0, 1.0);
        float rise = 1.0 - pow(1.0 - pow(xr, 1.35), 1.9);
        float fa = 0.16, fd = 0.13, fv = 1.0 / (1.0 - 0.5 * fa - 0.5 * fd);
        float fall = xf < fa ? fv * xf * xf / (2.0 * fa) : xf < 1.0 - fd ? fv * (xf - 0.5 * fa) : 1.0 - fv * (1.0 - xf) * (1.0 - xf) / (2.0 * fd);
        float h = u < fr ? H * rise : H * (1.0 - fall);
        yaw = uWindYaw + (mix(liHash(key + 9.0), liHash(key + 10.0), e) - 0.5) * 1.7;
        float sw = floor(aTimes.w * 16.0);
        vec3 p = aHome.xyz + vec3(off.x * aHome.w * 2.0, h + uDance.w * sin(t * uBreathe + sw * 2.4), off.y * aHome.w * 2.0);
        if (sw < 8.0) {                                                              // a swarm that has been stirred swirls up about its own middle
          vec4 st = uStir[int(sw)]; vec2 d = p.xz - st.xy; float ca = cos(st.w), sa = sin(st.w);
          p.xz = st.xy + vec2(d.x * ca - d.y * sa, d.x * sa + d.y * ca); p.y += st.z * (0.6 + 0.8 * aSeed.w);
        }
        return p;
      }`,
    vertexLocal: /* glsl */`
      float kind = aRest.w, tStart = aTimes.x, slot = aTimes.z;
      float sigma = uT - aSpent.z;                                                   // seconds since it began to fall spent
      float u, yaw; vec3 air = liDance(min(uT, aSpent.z), u, yaw);
      float fr = uDance.y;
      // the wings are beating from the moment it brakes at the foot of its fall until it lets go at the top of its climb
      float wRise = max(smoothstep(fr + (1.0 - fr) * 0.86, fr + (1.0 - fr) * 0.97, u), 1.0 - smoothstep(fr - 0.08, fr + 0.03, u)), wPara = 1.0 - wRise, wRest = 0.0, wFlat = 0.0, show = 1.0;
      vec3 c = air, upv = vec3(0.0, 1.0, 0.0), fwd;
      float tau = uT - tStart;
      if (kind > 0.5) {
        vec3 n = normalize(aNrm);
        if (tau < 0.0) {                                                             // not yet in the air: at rest on its timber, or standing on the water it has just come out of
          wRest = 1.0; wRise = 0.0; wPara = 0.0; c = aRest.xyz; upv = n;
          if (kind > 1.5) show = smoothstep(-aTimes.y, -aTimes.y + 0.3, tau);        // (unborn until its ring)
        } else {
          float k = smoothstep(0.35, 2.4, tau), lift = smoothstep(0.0, 0.3, tau);
          vec3 from = aRest.xyz + n * (0.14 * lift) + vec3(0.0, kind > 1.5 ? 0.5 * tau : -0.5 * smoothstep(0.0, 0.5, tau), 0.0);
          c = mix(from, air, k);
          wRest = 1.0 - lift; wRise = mix(lift, wRise, k); wPara = 1.0 - wRest - wRise;
          upv = normalize(mix(n, vec3(0.0, 1.0, 0.0), lift));
        }
      }
      if (slot > 0.5 && uAttend > 0.0) {                                             // drawn to a lamp: a dozen circle it, a few settle on it
        // round a lamp they do not run on rails: each goes about it by fits, nearer and further, higher and lower
        float g1 = uT * (0.9 + 0.5 * aSeed.z) + aSeed.x * 30.0, g2 = uT * (2.3 + 0.8 * aSeed.w) + aSeed.y * 30.0;
        float a = (uT * (1.3 + 0.8 * aSeed.x) + 0.9 * sin(g1) + 0.4 * sin(g2)) * (aSeed.y > 0.5 ? 1.0 : -1.0) + aSeed.z * 6.283;
        float r = (0.34 + 0.46 * aSeed.w) * (1.0 + 0.28 * sin(g1 * 1.37 + 1.0) + 0.14 * sin(g2 * 1.13));
        vec3 q = uLamp + vec3(cos(a) * r, 0.05 + 0.2 * sin(g1 * 1.61 + aSeed.y * 20.0) + 0.08 * sin(g2 * 1.29), sin(a) * r); float wr = 1.0, ws = 0.0;
        if (slot > 12.5) { q = uSeat[int(slot - 13.0)]; ws = smoothstep(0.85, 1.0, uAttend); wr = 1.0 - ws; }
        else yaw = mix(yaw, -a * sign(aSeed.y - 0.5) + 1.57, uAttend);
        c = mix(c, q, uAttend);
        wRest = mix(wRest, ws, uAttend); wRise = mix(wRise, wr, uAttend); wPara = 1.0 - wRest - wRise;
      }
      if (sigma > 0.0) {                                                             // spent: it falls with its wings going flat, lies as a pale cross, turns and drifts
        float kf = clamp(sigma / aSpent.w, 0.0, 1.0), after = max(0.0, sigma - aSpent.w);
        c.xz = mix(c.xz, aSpent.xy, kf * kf * (3.0 - 2.0 * kf)) + uDrift * after + 0.05 * sin(sigma * 5.0 + aSeed.x * 9.0) * (1.0 - kf);
        c.y = mix(c.y, 0.004, pow(kf, 0.85));
        wFlat = smoothstep(0.0, 0.6, sigma); wRise *= 1.0 - wFlat; wPara *= 1.0 - wFlat; wRest *= 1.0 - wFlat;
        yaw += 0.1 * after + (aSeed.w - 0.5) * 9.0 * kf * kf * (3.0 - 2.0 * kf);          // it turns as it falls, and lies as it lands: no two the same way
        c = mix(c, liHull(c), kf);                                                   // afloat, the bow shoulders it aside: it is never drawn through the hull
      } else {
        c = liShove(c, 0.0);
        c = liKeepOut(c, uCameraPos, uKeep);
        if (wRest < 0.5) c.y = max(c.y, 0.05);
      }
      // thinning the dance: those past the share shrink away
      show *= 1.0 - smoothstep(uDensity - 0.02, uDensity + 0.02, aSeed.w) * (1.0 - wFlat) * (1.0 - step(0.5, wRest));
      // ---- which way it faces
      if (abs(upv.y) > 0.75) fwd = vec3(sin(yaw + wRest * aSeed.x * 6.283), 0.0, cos(yaw + wRest * aSeed.x * 6.283));
      else { vec3 t0 = normalize(vec3(0.0, 1.0, 0.0) - upv * upv.y), t1 = cross(upv, t0); float a = (aSeed.x - 0.5) * 1.5; fwd = t0 * cos(a) + t1 * sin(a); }   // on an upright face: head up, more or less
      vec3 lft = normalize(cross(upv, fwd)); fwd = cross(lft, upv);
      // ---- the pose: the sail (at rest), the rise (beating), the parachute, the cross (spent)
      float beat = step(0.5, fract(uFlick + aSeed.x * 7.0));
      float flap = (wRest * 84.0 + wRise * mix(14.0, 80.0, beat) + wPara * 60.0) * ${DEG};
      float pitch = (wRise * 72.0 + wPara * 14.0) * ${DEG};
      float cock = (wRest * 12.0 + wRise * -6.0 + wPara * 30.0 + wFlat * 4.0) * ${DEG}, spread = wRest * 1.6 + wRise * 1.2 + wPara * 2.6 + wFlat * 2.0;
      vec3 p = transformed, nn = objectNormal;
      float hairSide = 0.0; vec3 hairAxis = vec3(0.0, 0.0, -1.0);
      if (aPart > 0.5 && aPart < 2.5) { mat3 Hm = liHingeM(aPart < 1.5 ? 1.0 : -1.0, flap, 0.0, 0.0); p = Hm * p; nn = Hm * nn; }
      else if (aPart > 4.5) {
        float psi = atan(aHair.x, -aHair.z);
        mat3 Tm = liRx(cock) * liRy(-psi * (spread - 1.0));
        p = Tm * p; hairAxis = Tm * aHair.xyz; hairSide = aHair.w;
        if (uTails < 2.5 && abs(aHair.x) < 0.05) show = 0.0;                         // the olives have two tails: the middle one is not drawn
      }
      p += aPivot;
      float dcam0 = distance(c, uCameraPos);
      if (aPart < 0.5 && aMem < 0.5) { float kB = max(1.0, 0.7 * uPx * dcam0 / (0.0026 * uSize)); p.x *= kB; p.y = 0.0058 + (p.y - 0.0058) * kB; }      // far off, the body keeps a pixel of girth
      vec3 mid = vec3(0.0, 0.0058, 0.0); mat3 Pm = liRx(-pitch);
      p = mid + Pm * (p - mid); nn = Pm * nn; hairAxis = Pm * hairAxis;
      // ---- near mesh or far mesh (the far mesh alone is drawn in the mirror)
      float dcam = distance(c, uCameraPos);
      float mine = uNearFar.z < 0.5 ? (1.0 - step(uNearFar.x + uNearFar.y * 0.5, dcam)) * (1.0 - uMirror) : max(step(uNearFar.x - uNearFar.y * 0.5, dcam), uMirror);
      float sc = uSize * show * mine * max(1.0, uMinPx * uPx * dcam / (0.05 * uSize));          // far off it is drawn up to what the painter's brush can keep
      vec3 wpos = c + (lft * p.x + upv * p.y + fwd * p.z) * sc;
      if (hairSide != 0.0) {                                                         // a tail is a hair: widened toward the eye so that it never falls below a pixel
        vec3 ax = lft * hairAxis.x + upv * hairAxis.y + fwd * hairAxis.z, eye = cameraPosition - wpos;
        wpos += normalize(cross(ax, eye)) * hairSide * max(0.0004 * sc, uPx * length(eye) * 0.6) * step(0.001, sc);
      }
      transformed = wpos; objectNormal = lft * nn.x + upv * nn.y + fwd * nn.z;
      vThin = aMem; vCover = mix(0.86, 0.5, wRise * (1.0 - wFlat));`,
    fragmentPars: FRAG_STIPPLE_PARS,
    albedo: FRAG_STIPPLE,
  };
  const litExt = { ...rule.ext, vertexWorld: 'vLit = liLit(wp.xyz);' };
  const matOpts = { vertexColors: true, side: THREE.DoubleSide, brush: 0.1, ...o.material };
  const matNear = kit.gouache({ ...matOpts, extend: [{ ...ext, uniforms: { ...U } }, litExt] });
  const matFar = kit.gouache({ ...matOpts, extend: [{ ...ext, uniforms: { ...U, uNearFar: { value: new THREE.Vector3(o.nearDistance, 1, 1) } } }, litExt] });
  const near = new THREE.Mesh(gNear, matNear), far = new THREE.Mesh(gFar, matFar);
  const object = new THREE.Group(); object.name = 'mayflies'; object.add(near, far);
  const share = o.mirror === true ? 1 : o.mirror === false ? 0 : o.mirror;
  for (const m of [near, far]) { m.frustumCulled = false; m.name = m === near ? 'mayflies:near' : 'mayflies:far'; }
  C.perPass(near, gNear, () => N, 1); C.perPass(far, gFar, () => N, share || 1);
  ctx.only(near, 'direct'); if (!share) ctx.only(far, 'direct');
  C.parent.add(object);

  // ---- events the CPU must know about (it placed them, so it knows them without asking the GPU): rings and touches
  const events = [];                                        // { t, x, z, kind }, kept sorted by t
  let ev = 0;
  const addEvents = (list) => { if (!list.length) return; const rest = events.slice(ev).concat(list).sort((a, b) => a.t - b.t); events.length = 0; events.push(...rest); ev = 0; };
  const attending = [];
  let lampFn = null, seatFns = [], attendTarget = 0, densityTween = null;
  const stirs = [];
  const now = () => ctx.time;
  const api = {
    object, near, far, count: N, uniforms: U, rule, shoves,
    release({ from = null, speed = 6, delay = 0, at = null } = {}) {
      const g = groups.find((q) => q.kind === 1); if (!g) return api;
      const t0 = at ?? now() + delay;
      for (let i = g.start; i < g.start + g.n; i++) {
        if (aTimes[i * 4] < NEVER * 0.5) continue;
        const d = from ? Math.hypot(aRest[i * 4] - from[0], aRest[i * 4 + 2] - from[1]) : 0;
        aTimes[i * 4] = t0 + d / speed + aSeed[i * 4 + 2] * 0.5;
      }
      attrs.times.needsUpdate = true; return api;
    },
    hatch(i, { ramp = 4, rate = 9, at = null } = {}) {
      const g = groups.find((q) => q.kind === 2 && q.i === i); if (!g) return api;
      const t0 = at ?? now(), list = [];
      // the k-th ring: the rate climbs from nothing to `rate` over `ramp` seconds and holds
      for (let j = 0; j < g.n; j++) {
        const kk = j + 0.5, tb = kk < rate * ramp / 2 ? Math.sqrt(2 * kk * ramp / rate) : kk / rate + ramp / 2, q = g.start + j;
        if (aTimes[q * 4] < NEVER * 0.5) continue;
        aTimes[q * 4] = t0 + tb + aTimes[q * 4 + 1];
        list.push({ t: t0 + tb, x: aRest[q * 4], z: aRest[q * 4 + 2], kind: 'hatch' });
      }
      attrs.times.needsUpdate = true; addEvents(list); return api;
    },
    spend(n, seconds = 20, { at = null } = {}) {
      const t0 = at ?? now(), list = [], pick = [];
      for (let i = 0; i < N; i++) if (aTimes[i * 4] < t0 && aSpent[i * 4 + 2] > NEVER * 0.5 && aTimes[i * 4 + 2] < 0.5) pick.push(i);
      const want = Math.min(pick.length, count(ctx, n, o.exact));
      for (let j = 0; j < want; j++) {
        const q = j + Math.floor(rnd() * (pick.length - j)), i = pick[q]; pick[q] = pick[j];
        const ts = t0 + rnd() * seconds, fall = 1.6 + rnd() * 2.2, a = rnd() * TAU, r = rnd() * 0.9;
        const x = aHome[i * 4] + Math.cos(a) * r, z = aHome[i * 4 + 2] + Math.sin(a) * r;
        aSpent.set([x, z, ts, fall], i * 4);
        list.push({ t: ts + fall, x, z, kind: 'spent' });
      }
      attrs.spent.needsUpdate = true; addEvents(list); return api;
    },
    stir(i, { rise = 1, seconds = 3.2, turn = 1.2 } = {}) { stirs.push({ i, rise: C.calm ? rise * 0.5 : rise, seconds, turn: C.calm ? turn * 0.4 : turn, age: 0 }); return api; },
    part(x, y, z, radius, seconds = 2) { shoves.push(x, y, z, radius, seconds); return api; },
    attend(lamp, { circle = 12, seats = [] } = {}) {
      if (!lamp) { attendTarget = 0; return api; }
      lampFn = typeof lamp === 'function' ? lamp : () => lamp; seatFns = seats.slice(0, 4).map((s) => (typeof s === 'function' ? s : () => s));
      if (!attending.length) {                              // take those whose homes are nearest the lamp
        const L = lampFn(), cand = [];
        for (let i = 0; i < N; i++) if (aTimes[i * 4] < now() && aSpent[i * 4 + 2] > NEVER * 0.5) cand.push([Math.hypot(aHome[i * 4] - L.x, aHome[i * 4 + 2] - L.z), i]);
        cand.sort((a, b) => a[0] - b[0]);
        const want = Math.min(cand.length, circle + seatFns.length);
        for (let j = 0; j < want; j++) { const i = cand[j][1]; aTimes[i * 4 + 2] = j < seatFns.length ? 13 + j : 1 + (j - seatFns.length); attending.push(i); }
        attrs.times.needsUpdate = true;
      }
      attendTarget = 1; return api;
    },
    strength(kk, seconds = 10) { if (densityTween) densityTween.cancel(); densityTween = ctx.stage.tween((v) => { U.uDensity.value = v; }, U.uDensity.value, kk, seconds); return api; },
    settle(what = 'all', i = null) {
      for (const g of groups) {
        if (g.kind === 0 || (what === 'rest' && g.kind !== 1) || (what === 'hatch' && (g.kind !== 2 || (i != null && g.i !== i)))) continue;
        for (let q = g.start; q < g.start + g.n; q++) if (aTimes[q * 4] > NEVER * 0.5) aTimes[q * 4] = LONG_AGO + aSeed[q * 4] * 10;
      }
      attrs.times.needsUpdate = true; return api;
    },
    counts() {
      const t = now(), out = { resting: 0, air: 0, spent: 0, unborn: 0 };
      for (let i = 0; i < N; i++) {
        if (t > aSpent[i * 4 + 2]) out.spent++;
        else if (t >= aTimes[i * 4]) out.air++;
        else if (aRest[i * 4 + 3] > 1.5 && t < aTimes[i * 4] - aTimes[i * 4 + 1]) out.unborn++;
        else out.resting++;
      }
      return out;
    },
  };
  ctx.onUpdate((dt) => {
    const t = ctx.time;
    C.uT.value = t; U.uFlick.value = (t * 11) % 1;
    shoves.update(dt);
    for (let j = stirs.length - 1; j >= 0; j--) {           // a stir: up quickly, down slowly, turning as it goes
      const s = stirs[j]; s.age += dt; const x = s.age / s.seconds;
      const up = x < 0.3 ? smooth(0, 0.3, x) : 1 - smooth(0.3, 1, x), u4 = U.uStir.value[s.i];
      if (u4) { u4.z = s.rise * up; u4.w = s.turn * smooth(0, 1, x) * (x < 1 ? 1 : 0) * (1 - smooth(0.6, 1, x)); }
      if (x >= 1) { if (u4) { u4.z = 0; u4.w = 0; } stirs.splice(j, 1); }
    }
    if (lampFn) {
      U.uAttend.value += clamp(attendTarget - U.uAttend.value, -dt / 4, dt / 4);
      U.uLamp.value.copy(lampFn()); seatFns.forEach((f, i) => U.uSeat.value[i].copy(f()));
    }
    let fired = 0;
    while (ev < events.length && events[ev].t <= t) {
      const e = events[ev++];
      if (t - e.t > 0.5 || fired > 24) continue;            // (a realm entered part-way does not replay them)
      fired++;
      if (o.ripples) { if (e.kind === 'hatch') ctx.water.ripple(e.x, e.z, 0.12, 0.12); else ctx.water.ripple(e.x, e.z, 0.04, 0.1); }
      if (o.onTouch) o.onTouch(e.x, e.z, e.kind);
    }
  });
  return api;
}

// ================================================================================================ shared: point sprites
const FOG_GLSL = /* glsl */`uniform vec3 uFogColor; uniform float uFogDensity; float liFog(float d) { return 1.0 - exp(-uFogDensity * uFogDensity * d * d); }\n`;
const fogUniforms = (S) => ({ uFogColor: S.uFogColor, uFogDensity: S.uFogDensity, uVeil: S.uVeil, uCameraPos: S.uCameraPos });
/** A place given as [s, d, y], { position }, { at } or a Vector3, in the realm's coordinates. */
function placeOf(ctx, g, y = 0) {
  if (g.position) return v3(g.position);
  if (g.at) return ctx.kit.at(g.at[0], g.at[1] ?? 0, g.at[2] ?? y);
  if (g.isVector3) return g.clone();
  if (Array.isArray(g)) return new THREE.Vector3(g[0], g[1], g[2]);
  return new THREE.Vector3(g.x, g.y ?? y, g.z);
}

// ================================================================================================ midges
/**
 * Midge columns: a few hundred specks that hold station over a point, each darting to and fro in its own small loop,
 * the whole column breathing (rising and sinking, swelling and narrowing). Points: a midge is 4 mm long.
 *
 *   const midges = makeMidges(ctx, { columns: [{ at: [38, -6, 3], count: 250 }, { at: [55, 5, 3], count: 250 }] });
 *   midges.lean(0.25, 0, 3);                          // the evening air moves: the columns lean, over 3 s
 *
 * options
 *   columns   [{ at: [s, d, y] | position: [x, y, z], count = 250, width = 1.2, height = 2 }]   y is the column's middle
 *   size      0.007 m (drawn; life is 0.004); minPixels 6.5: the smallest a fleck is drawn (the painter's filter
 *             flattens anything smaller than its brush: with look.paint 0 this can be 2)
 *   breathe   { rise: 0.4, period: 5, swell: 0.12 }   metres the column rises and sinks, over how long, and how much
 *             it widens as it sinks (the orchard's page asks for 0.4 m at 0.7 Hz: period 1.43)
 *   dart      0.13 m: the size of each midge's own loop; dartRate 0.8 a second
 *   color     '#efe6cf' when lit; dark: '#2b2620' when not; opacity 0.85
 *   lit       'sun' (default: pale only when seen toward the light, a fainter dark speck otherwise (dull 0.7); give
 *             { rule: 'sun', dir: [x, y, z], power: 2 } to aim it at a bright band of sky) or 'plain' (always pale)
 *   hull      1.4 m: they part round the hull and close again in `close` = 3 s; keepOut 0.75
 *   mirror    false (specks under 20 cm are left out of the reflection); seed; exact; parent
 * returns { object, count, lean(x, z, seconds), fade(k, seconds), column(i) -> { strength, set(position) }, part(x, y, z, r, seconds) }
 */
export function makeMidges(ctx, opts = {}) {
  const o = { columns: [], size: 0.007, minPixels: 6.5, breathe: {}, dart: 0.13, dartRate: 0.8, color: '#efe6cf', dark: '#2b2620', opacity: 0.85, lit: 'sun', hull: 1.4, close: 3, keepOut: 0.75, mirror: false, seed: 17, exact: false, ...opts };
  const br = { rise: 0.4, period: 5, swell: 0.12, ...o.breathe };
  const C = common(ctx, o), rnd = ctx.rng(o.seed), S = C.S;
  const cols = o.columns.slice(0, 16).map((g) => ({ c: placeOf(ctx, g, 3), n: count(ctx, g.count ?? 250, o.exact), width: g.width ?? 1.2, height: g.height ?? 2, strength: 1 }));
  const N = cols.reduce((a, c) => a + c.n, 0), aHome = new Float32Array(N * 4), aSeed = new Float32Array(N * 4), pos = new Float32Array(N * 3);
  let k = 0;
  cols.forEach((c, i) => { for (let j = 0; j < c.n; j++, k++) { aHome.set([0, 0, 0, i], k * 4); aSeed.set([rnd(), rnd(), rnd(), rnd()], k * 4); } });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('aHome', new THREE.BufferAttribute(aHome, 4)); geo.setAttribute('aSeed', new THREE.BufferAttribute(aSeed, 4));
  const shoves = makeShoves(ctx, { hull: o.hull, close: o.close });
  const lit = typeof o.lit === 'string' ? { rule: o.lit } : o.lit;
  const U = {
    ...fogUniforms(S), ...shoves.uniforms, uT: C.uT, uPx: C.uPx, uKeep: C.uKeep,
    uCol: { value: cols.map((c) => new THREE.Vector4(c.c.x, c.c.y, c.c.z, 1)).concat(Array.from({ length: 16 - cols.length }, () => new THREE.Vector4())) },
    uColS: { value: cols.map((c, i) => new THREE.Vector4(c.width, c.height, 1, i * 1.9)).concat(Array.from({ length: 16 - cols.length }, () => new THREE.Vector4())) },
    uBreathe: { value: new THREE.Vector3(br.rise * (C.calm ? 0.5 : 1), TAU / br.period, br.swell) }, uDart: { value: new THREE.Vector2(o.dart, o.dartRate * TAU * (C.calm ? 0.6 : 1)) },
    uLean: { value: new THREE.Vector2(0, 0) }, uSize: { value: o.size }, uMinPx: { value: o.minPixels }, uColor: { value: col(o.color).clone() }, uDark: { value: col(o.dark).clone() }, uOpacity: { value: o.opacity },
    uLitDir: lit.dir ? { value: v3(lit.dir).normalize() } : S.uKeyDir, uLitK: { value: new THREE.Vector3(lit.rule === 'plain' ? 0 : 1, lit.power ?? 3, lit.dull ?? 0.7) },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms: U, transparent: true, depthWrite: false, fog: false,
    vertexShader: /* glsl */`${INSECT_GLSL} ${shoves.glsl}
      attribute vec4 aHome, aSeed; uniform float uT, uPx, uKeep, uSize, uMinPx; uniform vec4 uCol[16], uColS[16]; uniform vec3 uBreathe, uCameraPos, uLitDir, uLitK; uniform vec2 uDart, uLean;
      varying float vDist, vAlpha, vLit;
      void main() {
        int ci = int(aHome.w); vec4 c4 = uCol[ci], s4 = uColS[ci];
        // a place in the column (thicker toward its axis and its middle), and this midge's own darting loop round it
        vec2 g = vec2(aSeed.x + aSeed.y, aSeed.z + aSeed.w) - 1.0; float gy = (aSeed.y + aSeed.w) - 1.0;
        float ph = uT * uDart.y * (0.7 + 0.6 * aSeed.x);
        vec3 off = vec3(g.x * s4.x * 0.5, gy * s4.y * 0.5, g.y * s4.x * 0.5);
        off += uDart.x * vec3(sin(ph * 1.3 + aSeed.z * 40.0) + 0.4 * sin(ph * 3.7 + aSeed.w * 40.0), 0.7 * sin(ph * 1.1 + aSeed.w * 40.0) + 0.3 * sin(ph * 4.3 + aSeed.x * 40.0), sin(ph * 1.7 + aSeed.x * 40.0) + 0.4 * sin(ph * 3.1 + aSeed.y * 40.0));
        // the whole column breathes, but not as one block on a piston: its top follows its foot, and each midge is a little early
        // or late and rides the breath more or less than its neighbours
        float b = sin(uT * uBreathe.y + s4.w - 0.9 * gy - 1.1 * (aSeed.x - 0.5));
        off.y += uBreathe.x * 0.5 * b * (0.6 + 0.8 * aSeed.z); off.xz *= 1.0 - uBreathe.z * b;
        off.xz += uLean * (off.y + s4.y * 0.5);                                      // and leans in moving air, its foot holding station
        vec3 p = liKeepOut(liShove(c4.xyz + off, 0.0), uCameraPos, uKeep);
        vec4 mv = viewMatrix * vec4(p, 1.0); vDist = length(mv.xyz); gl_Position = projectionMatrix * mv;
        float px = uSize / max(uPx * vDist, 1e-6);
        // The painter's filter flattens anything smaller than its brush (about 7 pixels), so a far midge is drawn as a
        // soft fleck that size and faint: the column then reads as a smoky, breathing patch; near the boat the flecks
        // tighten into single midges.
        gl_PointSize = clamp(px * 1.8, uMinPx, 64.0);
        float thin = min(1.0, px * 1.8 / uMinPx);                                    // how much smaller than its fleck the midge really is
        vAlpha = s4.z * min(1.0, 15.0 * thin * thin);                                // so that a far column stays a haze and never clots
        vLit = mix(1.0, pow(max(dot(normalize(uCameraPos - p), normalize(uLitDir)), 0.0), uLitK.y), uLitK.x);
      }`,
    fragmentShader: /* glsl */`${FOG_GLSL} uniform vec3 uColor, uDark, uLitK; uniform float uOpacity, uVeil; varying float vDist, vAlpha, vLit;
      void main() {
        vec2 q = gl_PointCoord - 0.5; float a = smoothstep(0.5, 0.05, length(q * vec2(1.0, 1.25)));    // a soft dot, a little wider than tall (its wings)
        a *= uOpacity * vAlpha * mix(uLitK.z, 1.0, vLit) * (1.0 - uVeil);
        if (a < 0.004) discard;
        gl_FragColor = vec4(mix(mix(uDark, uColor, vLit), uFogColor, liFog(vDist)), a);
      }`,
  });
  const object = new THREE.Points(geo, mat); object.name = 'midges'; object.frustumCulled = false; object.renderOrder = 4;
  C.perPass(object, null, () => N);
  C.mirrorMode(object, o.mirror); C.parent.add(object);
  const tw = { lean: null, fade: null };
  const api = {
    object, count: N, uniforms: U,
    lean(x, z, seconds = 3) { if (tw.lean) tw.lean.cancel(); const a = U.uLean.value.clone(); tw.lean = ctx.stage.tween((kk) => { U.uLean.value.set(a.x + (x - a.x) * kk, a.y + (z - a.y) * kk); }, 0, 1, seconds); return api; },
    fade(kk, seconds = 4) { if (tw.fade) tw.fade.cancel(); const a = U.uOpacity.value; tw.fade = ctx.stage.tween((q) => { U.uOpacity.value = a + (o.opacity * kk - a) * q; }, 0, 1, seconds); return api; },
    column(i) { const u4 = U.uCol.value[i], s4 = U.uColS.value[i]; return { get strength() { return s4.z; }, set strength(v) { s4.z = v; }, set(p) { const q = placeOf(ctx, p, 3); u4.set(q.x, q.y, q.z, 1); } }; },
    part(x, y, z, r, seconds = 3) { shoves.push(x, y, z, r, seconds); return api; },
  };
  ctx.onUpdate((dt) => { C.uT.value = ctx.time; shoves.update(dt); });
  return api;
}

// ================================================================================================ motes and lint
/**
 * Motes: dust in the air, lint in shafts of light, the small stuff that gives water a body. Points.
 *
 *   const lint = makeMotes(ctx, { kind: 'lint', count: 1500, wind: [-0.3, 0, 0],
 *     lit: { rule: 'shafts', shafts: [{ from: [x, y, z], to: [x, y, z], radius: 1.6, color: '#f4a21c', gain: 0.5 }] } });
 *   const snow = makeMotes(ctx, { under: true, count: 3000, box: [40, 14, 40], color: '#f3a77e', colorDeep: '#7850a6' });
 *
 * options
 *   kind      'dust' (round, tiny) | 'lint' (short threads that turn as they drift and catch the light as they turn)
 *   count     how many
 *   lit       { rule: 'shafts', shafts } : they exist ONLY inside the shafts (they are placed there, and drift through),
 *             take each shaft's colour and are added to the picture as light. Without it they fill `box`.
 *   box       [w, h, d] metres: a volume that follows the rider (default [40, 12, 40]); y: [lo, hi] its height range
 *             (default [0.2, h]; under water: [-h, -0.3])
 *   under     true: under the surface (drawn before the water; `colorDeep` is what they turn to with depth, over
 *             `deepAt` metres), lights: [{ x, y, z, radius, color, gain }] brightens them near lamps (up to 12)
 *   wind      [x, y, z] m/s: the drift (0.3 m/s for lint, 0.03 under water); change it with motes.wind(x, y, z);
 *             gust(k) multiplies it for a moment (the lint streaks by)
 *   size      metres (dust 0.004, lint 0.012, under water 0.02); minPixels: the smallest a mote is drawn (in the air
 *             the painter's filter flattens anything much under its brush: 5 for dust, 8 for lint; 2.5 under water,
 *             where the filter does not reach); color; opacity; additive (default: true in shafts)
 *   hull      2 m: they swirl aside round the hull and close again in 3 s; keepOut 0.75 (and they fade out as they
 *             come that near); mirror false; seed
 * returns { object, count, rule, wind(x, y, z), gust(k, seconds), uniforms }
 */
export function makeMotes(ctx, opts = {}) {
  const kind = opts.kind || 'dust', under = !!opts.under;
  const o = { count: 800, lit: null, box: [40, 12, 40], y: null, wind: under ? [0.02, 0.004, 0.02] : [-0.2, -0.01, 0.08], size: under ? 0.02 : kind === 'lint' ? 0.012 : 0.004,
    color: under ? '#f3a77e' : '#fff3d6', colorDeep: null, deepAt: 12, lights: [], opacity: under ? 0.5 : 0.8, additive: null, hull: 2, close: 3, keepOut: 0.75, mirror: false, seed: 23, exact: false, ...opts };
  const C = common(ctx, o), rnd = ctx.rng(o.seed), S = C.S;
  const rule = litRule(ctx, o.lit && o.lit.rule === 'shafts' ? o.lit : null), inShafts = rule.rule === 'shafts';
  const additive = o.additive ?? inShafts;
  const N = count(ctx, o.count, o.exact), aSeed = new Float32Array(N * 4), aWhere = new Float32Array(N * 4), pos = new Float32Array(N * 3);
  // in shafts: share them out by volume, each bound to its shaft and wrapped inside a box round it
  let vols = null;
  if (inShafts) { vols = rule.shafts.map((s) => { const a = v3(s.from), b = v3(s.to), r = Math.max(s.radius ?? 1.5, s.radiusTo ?? s.radius ?? 1.5); return a.distanceTo(b) * r * r; }); const tot = vols.reduce((a, b) => a + b, 0) || 1; vols = vols.map((v) => v / tot); }
  for (let i = 0; i < N; i++) {
    aSeed.set([rnd(), rnd(), rnd(), rnd()], i * 4);
    let si = 0; if (vols) { let r = rnd(); while (si < vols.length - 1 && r > vols[si]) { r -= vols[si]; si++; } }
    aWhere.set([rnd(), rnd(), rnd(), si], i * 4);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('aSeed', new THREE.BufferAttribute(aSeed, 4)); geo.setAttribute('aWhere', new THREE.BufferAttribute(aWhere, 4));
  const shoves = makeShoves(ctx, { hull: o.hull, close: o.close });
  const ylo = o.y ? o.y[0] : under ? -o.box[1] : 0.2, yhi = o.y ? o.y[1] : under ? -0.3 : o.box[1];
  const NL = 12, lights = o.lights.slice(0, NL);
  const U = {
    ...fogUniforms(S), ...shoves.uniforms, ...rule.uniforms, uT: C.uT, uPx: C.uPx, uKeep: C.uKeep,
    uBox: { value: new THREE.Vector3(o.box[0], yhi - ylo, o.box[2]) }, uYLo: { value: ylo }, uDrift: { value: new THREE.Vector3() }, uSize: { value: o.size }, uMinPx: { value: o.minPixels ?? (under ? 2.5 : kind === 'lint' ? 8 : 5) }, uKind: { value: kind === 'lint' ? 1 : 0 },
    uColor: { value: col(o.color).clone() }, uDeep: { value: col(o.colorDeep ?? o.color).clone() }, uDeepAt: { value: o.deepAt }, uOpacity: { value: o.opacity }, uStreak: { value: 0 },
    uLampP: { value: Array.from({ length: NL }, (_, i) => (lights[i] ? new THREE.Vector4(lights[i].x, lights[i].y ?? -1, lights[i].z, lights[i].radius ?? 4) : new THREE.Vector4(0, -1000, 0, 1))) },
    uLampC: { value: Array.from({ length: NL }, (_, i) => (lights[i] ? col(lights[i].color ?? '#f3a77e').clone().multiplyScalar(lights[i].gain ?? 1) : new THREE.Color(0, 0, 0))) }, uLampN: { value: lights.length },
  };
  const place = inShafts
    ? /* glsl */`int si = int(aWhere.w); vec3 A = uShaftA[si].xyz, AB = uShaftB[si].xyz - A; float len = length(AB) + 1e-4, R = max(uShaftA[si].w, uShaftB[si].w) * 1.15;
        vec3 ax = AB / len, e1 = normalize(cross(ax, abs(ax.y) > 0.9 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0))), e2 = cross(ax, e1);
        vec3 size3 = vec3(len, 2.0 * R, 2.0 * R), q = fract(aWhere.xyz + vec3(dot(uDrift, ax), dot(uDrift, e1), dot(uDrift, e2)) / size3 + wob / size3) * size3;
        vec3 p = A + ax * q.x + e1 * (q.y - R) + e2 * (q.z - R);
        float edge = 1.0;`
    : /* glsl */`vec3 p = aWhere.xyz * uBox + uDrift + wob;
        vec3 mid = vec3(uCameraPos.x, uYLo + uBox.y * 0.5, uCameraPos.z);
        p = mod(p - mid + uBox * 0.5, uBox) - uBox * 0.5 + mid;
        vec3 e = abs(p - mid) / (uBox * 0.5); float edge = (1.0 - smoothstep(0.8, 1.0, max(e.x, e.z))) * (1.0 - smoothstep(0.85, 1.0, e.y));`;
  const mat = new THREE.ShaderMaterial({
    uniforms: U, transparent: true, depthWrite: false, fog: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    vertexShader: /* glsl */`${INSECT_GLSL} ${shoves.glsl} ${rule.vertexPars}
      attribute vec4 aSeed, aWhere; uniform float uT, uPx, uKeep, uSize, uYLo, uKind, uDeepAt, uStreak, uMinPx; uniform vec3 uBox, uDrift, uCameraPos, uColor, uDeep;
      uniform vec4 uLampP[${NL}]; uniform vec3 uLampC[${NL}]; uniform int uLampN;
      varying float vDist, vAlpha, vSpin; varying vec3 vCol; varying vec2 vAxis;
      void main() {
        float ph = uT * (0.25 + 0.3 * aSeed.x);
        vec3 wob = 0.12 * vec3(sin(ph + aSeed.y * 40.0), 0.6 * sin(ph * 0.8 + aSeed.z * 40.0), cos(ph * 1.1 + aSeed.w * 40.0));     // a slow wander of its own
        ${place}
        p = liKeepOut(liShove(p, 0.0), uCameraPos, uKeep);
        vec4 mv = viewMatrix * vec4(p, 1.0); vDist = length(mv.xyz); gl_Position = projectionMatrix * mv;
        float sz = uSize * (0.6 + 0.8 * aSeed.w) * (1.0 + uStreak * 2.0), px = sz / max(uPx * vDist, 1e-6);
        gl_PointSize = clamp(px * 1.5, uMinPx, 48.0);                                // (never smaller than the painter's filter lets live)
        float thinM = min(1.0, px * 1.5 / uMinPx);
        vAlpha = edge * min(1.0, 0.25 + 12.0 * thinM * thinM) * smoothstep(uKeep * 0.9, uKeep * 1.6, vDist);
        vSpin = ph * 2.3 + aSeed.x * 30.0;
        vec4 L = liLit(p);
        vCol = uColor;
        ${inShafts ? 'vCol = L.rgb * 1.7; vAlpha *= L.a;' : ''}
        ${under ? `vCol = mix(uColor, uDeep, clamp(-p.y / uDeepAt, 0.0, 1.0));
        for (int i = 0; i < ${NL}; i++) { if (i >= uLampN) break; vec3 d = p - uLampP[i].xyz; vCol += uLampC[i] * (1.0 - smoothstep(uLampP[i].w * 0.2, uLampP[i].w, length(d))); }` : ''}
        vec4 ahead = projectionMatrix * viewMatrix * vec4(p + vec3(cos(vSpin), 0.35 * sin(vSpin * 0.7), sin(vSpin)) * 0.05, 1.0);       // which way a thread lies across the picture
        vec2 dir = (ahead.xy / ahead.w - gl_Position.xy / gl_Position.w) * vec2(projectionMatrix[1][1] / projectionMatrix[0][0], 1.0);
        vAxis = dot(dir, dir) > 1e-12 ? normalize(dir) : vec2(1.0, 0.0);
        if (uStreak > 0.01) vAlpha *= 1.0 - 0.4 * uStreak;
      }`,
    fragmentShader: /* glsl */`${FOG_GLSL} uniform float uOpacity, uVeil, uKind; varying float vDist, vAlpha, vSpin; varying vec3 vCol; varying vec2 vAxis;
      void main() {
        vec2 q = gl_PointCoord - 0.5; float a;
        if (uKind < 0.5) { float l = length(q) * 2.0; a = smoothstep(1.0, 0.0, l); a *= a; }
        else { vec2 ax = vec2(vAxis.x, -vAxis.y); float across = abs(dot(q, vec2(-ax.y, ax.x))), along = abs(dot(q, ax));          // a thread: thin, and brightest when it lies square to the eye
          a = smoothstep(0.2, 0.05, across) * smoothstep(0.5, 0.25, along) * (0.45 + 0.55 * abs(sin(vSpin * 0.9))); }
        a *= uOpacity * vAlpha * (1.0 - uVeil);
        if (a < 0.003) discard;
        float f = liFog(vDist);
        ${additive ? 'gl_FragColor = vec4(vCol * a * (1.0 - f), 1.0);' : 'gl_FragColor = vec4(mix(vCol, uFogColor, f), a);'}
      }`,
  });
  const object = new THREE.Points(geo, mat); object.name = kind; object.frustumCulled = false; object.renderOrder = under ? -2 : 4;
  C.perPass(object, null, () => N);
  C.mirrorMode(object, o.mirror); C.parent.add(object);
  const wind = v3(o.wind), gust = { k: 1, t: 0, dur: 0, peak: 1 };
  const api = {
    object, count: N, rule, uniforms: U,
    wind(x, y, z) { wind.set(x, y, z); return api; },
    /** The wind multiplied by k for `seconds` (it eases in and out): lint streaks by in a gust. */
    gust(kk = 6, seconds = 4) { gust.peak = kk; gust.t = 0; gust.dur = seconds; return api; },
  };
  ctx.onUpdate((dt) => {
    C.uT.value = ctx.time; shoves.update(dt);
    if (gust.dur > 0) { gust.t += dt; const x = gust.t / gust.dur; gust.k = 1 + (gust.peak - 1) * Math.sin(Math.PI * clamp(x, 0, 1)) ** 2; if (x >= 1) { gust.dur = 0; gust.k = 1; } }
    U.uStreak.value = C.calm ? 0 : clamp((gust.k - 1) / 6, 0, 1);
    U.uDrift.value.addScaledVector(wind, dt * gust.k * (C.calm ? 0.6 : 1));
  });
  return api;
}

// ================================================================================================ bubbles
/**
 * Chains of bubbles rising from below: silver beads, irregularly spaced, wobbling, growing as they climb, each
 * popping at the surface as a pin ring. Solid cut-out beads under the surface: the water bends, tints and swallows
 * them like anything else down there.
 *
 *   const bub = makeBubbles(ctx, { sources: [{ at: [30, 6, -3.2] }, { at: [170, -13, -22], count: 150, spread: 0.75 }] });
 *   bub.burst(x, y, z, 12, 0.3);                      // a sheath of bubbles let go here, once (a diving bird)
 *
 * options
 *   sources   [{ at: [s, d, y] | position: [x, y, z] (y below 0: where they are let go), count = 8 (beads in the
 *             chain at once), spread = 0.04 (metres the column widens to by the surface: 0.75 for a fountain's plume),
 *             size = 0.012 (radius at the bottom, metres) }]
 *   speed     0.35 m/s; grow 0.3 (30 per cent larger at the top); wobble 0.035 m
 *   pool      0: how many spare beads to keep for burst()
 *   color     '#dfeaf2' (the rim); glow 0 (above 0 the rim gives off light: multiply for bloom)
 *   ripples   true: each pop within reach of the boat is ctx.water.ripple(x, z, 0.15, 0.3); onTouch(x, z, 'pop')
 *   seed; exact; parent
 * returns { object, count, burst(x, y, z, n, spread), source(i) -> { set(position) } }
 */
export function makeBubbles(ctx, opts = {}) {
  const o = { sources: [], speed: 0.35, grow: 0.3, wobble: 0.035, pool: 0, color: '#dfeaf2', glow: 0, ripples: true, onTouch: null, reach: 34, seed: 29, exact: false, ...opts };
  const C = common(ctx, o), rnd = ctx.rng(o.seed), S = C.S;
  const srcs = o.sources.map((g) => ({ p: placeOf(ctx, g, -3), n: count(ctx, g.count ?? 8, o.exact || (g.count ?? 8) <= 12), spread: g.spread ?? 0.04, size: g.size ?? 0.012 }));
  const N = srcs.reduce((a, s) => a + s.n, 0) + o.pool;
  const aSrc = new Float32Array(N * 4), aTime = new Float32Array(N * 4), meta = [];
  let k = 0;
  for (const s of srcs) {
    const rise = -s.p.y / o.speed;                          // seconds from the source to the surface
    for (let j = 0; j < s.n; j++, k++) {
      const period = rise * (1 + 0.06 * (rnd() - 0.5)) + 0.4 + rnd() * 0.3, phase = (j + (rnd() - 0.5) * 0.7) / s.n, seed = rnd(), size = s.size * (0.7 + rnd() * 0.6);
      aSrc.set([s.p.x, s.p.y, s.p.z, size], k * 4); aTime.set([phase, period, seed, s.spread], k * 4);
      meta.push({ src: s, period, phase, seed, last: -1 });
    }
  }
  for (; k < N; k++) { aSrc.set([0, -1000, 0, 0.01], k * 4); aTime.set([0, -1, 0, 0], k * 4); meta.push(null); }
  const quad = new THREE.InstancedBufferGeometry();
  quad.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); quad.setIndex([0, 1, 2, 0, 2, 3]);
  const A = { src: instanced(quad, 'aSrc', aSrc, 4), time: instanced(quad, 'aTime', aTime, 4) };
  quad.instanceCount = N;
  const U = { ...fogUniforms(S), uT: C.uT, uK: { value: new THREE.Vector4(o.speed, o.grow, o.wobble, 0) }, uColor: { value: col(o.color).clone() }, uGlow: { value: o.glow } };
  const mat = new THREE.ShaderMaterial({
    uniforms: U, fog: false, side: THREE.DoubleSide,
    vertexShader: /* glsl */`attribute vec4 aSrc, aTime; uniform float uT; uniform vec4 uK; varying vec2 vQ; varying float vDist;
      void main() {
        // a bead of a chain comes round again every period; a bead from a burst rises once
        float age = aTime.y > 0.0 ? fract(uT / aTime.y + aTime.x) * aTime.y : uT - aTime.x;
        float sp = uK.x * (0.85 + 0.3 * aTime.z), y = aSrc.y + sp * age, k = clamp(1.0 - y / min(aSrc.y, -1e-3), 0.0, 1.0);
        float a = age * (5.0 + 3.0 * aTime.z) + aTime.z * 40.0, w = uK.z * (0.3 + 0.7 * k);
        vec3 c = vec3(aSrc.x + sin(a) * w + cos(aTime.z * 77.0) * aTime.w * pow(k, 1.5), y, aSrc.z + cos(a * 0.83) * w + sin(aTime.z * 77.0) * aTime.w * pow(k, 1.5));
        float r = aSrc.w * (1.0 + uK.y * k) * step(0.0, age) * step(y, -0.012) * smoothstep(0.0, 0.15, age);
        vec4 mv = viewMatrix * vec4(c, 1.0); mv.xy += position.xy * r; vDist = length(mv.xyz); vQ = position.xy;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`${FOG_GLSL} uniform vec3 uColor; uniform float uGlow; varying vec2 vQ; varying float vDist;
      void main() {
        float r = length(vQ); if (r > 1.0) discard;
        // a bubble under water is a mirror at its rim and a window in its middle: a bright ring, a glint, and nothing between
        float ring = smoothstep(0.62, 0.8, r), glint = smoothstep(0.34, 0.2, length(vQ - vec2(-0.3, 0.36)));
        if (ring + glint < 0.5) discard;
        vec3 c = uColor * (0.55 + 0.45 * smoothstep(-1.0, 1.0, vQ.y)) * mix(0.75, 1.15, glint) * (1.0 + uGlow);
        gl_FragColor = vec4(mix(c, uFogColor, liFog(vDist)), 1.0);
      }`,
  });
  const object = new THREE.Mesh(quad, mat); object.name = 'bubbles'; object.frustumCulled = false;
  ctx.only(object, 'direct'); C.parent.add(object);
  let next = N - o.pool, tick = 0;
  const popAt = (m, age) => {                                // where a bead breaks the surface: the same sums as the shader
    const a = age * (5 + 3 * m.seed) + m.seed * 40, w = o.wobble;
    return [m.src.p.x + Math.sin(a) * w + Math.cos(m.seed * 77) * m.src.spread, m.src.p.z + Math.cos(a * 0.83) * w + Math.sin(m.seed * 77) * m.src.spread];
  };
  const api = {
    object, count: N, uniforms: U,
    burst(x, y, z, n = 8, spread = 0.2) {
      for (let j = 0; j < n && o.pool > 0; j++) {
        const i = N - o.pool + (next++ - (N - o.pool)) % o.pool, seed = rnd();
        aSrc.set([x + (rnd() - 0.5) * spread, y + (rnd() - 0.5) * spread * 0.5, z + (rnd() - 0.5) * spread, 0.008 + rnd() * 0.008], i * 4); aTime.set([ctx.time + rnd() * 0.4, -1, seed, 0.03], i * 4);
      }
      A.src.needsUpdate = true; A.time.needsUpdate = true; return api;
    },
    source(i) { const s = srcs[i]; return { set(p) { const q = placeOf(ctx, p, -3); let b = 0; for (let j = 0; j < i; j++) b += srcs[j].n; s.p.copy(q); for (let j = b; j < b + s.n; j++) { aSrc[j * 4] = q.x; aSrc[j * 4 + 1] = q.y; aSrc[j * 4 + 2] = q.z; } A.src.needsUpdate = true; } }; },
  };
  ctx.onUpdate(() => {
    const t = ctx.time; C.uT.value = t;
    if (!o.ripples && !o.onTouch) return;
    const boat = ctx.boat; let fired = 0;
    for (let i = 0; i < meta.length && fired < 6; i++) {    // a chain's bead pops once a turn, when its age passes the time it takes to rise
      const m = meta[i]; if (!m) continue;
      if (Math.hypot(m.src.p.x - boat.x, m.src.p.z - boat.z) > o.reach) continue;
      const sp = o.speed * (0.85 + 0.3 * m.seed), rise = -m.src.p.y / sp, turn = Math.floor((t - rise) / m.period + m.phase);
      if (m.last < 0) { m.last = turn; continue; }
      if (turn !== m.last) { m.last = turn; fired++; const [x, z] = popAt(m, rise); if (o.ripples) ctx.water.ripple(x, z, 0.15, 0.3); if (o.onTouch) o.onTouch(x, z, 'pop'); }
    }
    void tick;
  });
  return api;
}

// ================================================================================================ small meshes made in code
/** One part of a hand-built insect: triangles with flat normals. verts: [[x, y, z], ...] in model space, tris: [[a, b, c], ...]. */
export function codePart(name, pivot, verts, tris, color, slot = 'paint') {
  const pos = [], nrm = [], colr = [], a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), n = new THREE.Vector3(), k = col(color);
  const cols = Array.isArray(color) ? color.map(col) : null;
  for (const t of tris) {
    a.fromArray(verts[t[0]]); b.fromArray(verts[t[1]]); c.fromArray(verts[t[2]]);
    n.copy(b).sub(a).cross(c.clone().sub(a)).normalize();
    for (const i of t) { const v = verts[i]; pos.push(v[0] - pivot[0], v[1] - pivot[1], v[2] - pivot[2]); nrm.push(n.x, n.y, n.z); const q = cols ? cols[i] : k; colr.push(q.r, q.g, q.b); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(colr, 3));
  return { name, slot, geometry: g, pivot: new THREE.Vector3(...pivot) };
}

// ================================================================================================ sedge flies
/**
 * Sedge flies (caddis): pale night insects drawn to a light under the water that they cannot reach. They skitter and
 * circle in flat wheels on the bright water and just over it, never higher than a knee, never in a column, never in
 * a cloud; each draws a hair-fine V on the water and a pin ring where it touches down. Outside the light there are
 * none to be seen.
 *
 *   const sedges = makeSedgeFlies(ctx, { wheels: [{ at: [36, -6], count: 220, radius: 1.5, color: '#f3a77e' }] });
 *   sedges.settle(1, 2);                              // the warning: they settle on the water and hold still
 *   sedges.wheel(3).moveTo(x, z, 6);                  // a wheel leaves its lamp for a new light
 *
 * options
 *   wheels    [{ at: [s, d] | position: [x, z], count = 200, radius = 1.3, color = '#f3a77e' (the light beneath),
 *             gain = 0.7, lightRadius = radius * 1.35 }]   up to 24. The family does NOT draw the lamp or its dome of
 *             light: the area does (a kit.glow under the water, a lit window); `color` only says what light they are in
 *   speed     0.6 m/s; hop: [0.05, 0.4] metres (how high they lift between touches; the top never passes maxHeight 0.8)
 *   size      1 = drawn 2.4 cm long (life is 1.2 to 1.8 cm); minPixels 4 (far off it is drawn no smaller)
 *   color     '#f6e3c8' multiplies their pale paint; dark: 0.0 (how much of them shows outside any light); cap: 0.55
 *             (the brightest a lit fly may be: pale and matte, lit from beneath, never a spark)
 *   lights    extra lights under the water that light them: [{ x, z, radius, color, gain }] (the wheels' own are added)
 *   hull      2.5 m: they part round the hull and close again in `close` = 6 s; keepOut 0.75
 *   ripples   true: each touch-down within `reach` = 20 m of the boat is ctx.water.ripple(x, z, 0.08, 0.2), at most
 *             `touches` = 2 a second a wheel; onTouch(x, z, 'sedge')
 *   mirror    false; seed; exact; material
 * returns { object, count, rule,
 *   wheel(i) -> { x, z, radius, strength, set({ x, z, radius }), moveTo(x, z, seconds), fade(k, seconds) },
 *   settle(k, seconds)    0 = lively, 1 = all down on the water and still
 *   part(x, y, z, r, seconds) }
 */
export const MAX_WHEELS = 24;
const PALE_LIGHT = new THREE.Color('#fff2e0');
export function makeSedgeFlies(ctx, opts = {}) {
  const o = { wheels: [], speed: 0.6, hop: [0.05, 0.4], maxHeight: 0.8, size: 1, minPixels: 4, color: '#f6e3c8', dark: 0.0, lights: [], hull: 2.5, close: 6, keepOut: 0.75, ripples: true, onTouch: null, reach: 20, touches: 2,
    cap: 0.55, mirror: false, seed: 37, exact: false, material: {}, ...opts };
  const { kit } = ctx, C = common(ctx, o), rnd = ctx.rng(o.seed);
  const B = '#8a7a62', A = '#5a4e3e', Wc = '#fbf6ee', K = '#fff8ee';        // (the wings near white: `color` gives them their cream)
  const parts = [
    codePart('body', [0, 0, 0], [[0, 0.0042, 0.009], [0.0014, 0.0034, 0.002], [-0.0014, 0.0034, 0.002], [0, 0.0056, 0.002], [0, 0.004, -0.007]], [[0, 1, 3], [0, 3, 2], [0, 2, 1], [4, 3, 1], [4, 2, 3], [4, 1, 2]], B),
    codePart('feelers', [0, 0, 0], [[0.0002, 0.0046, 0.009], [0.0009, 0.0046, 0.0086], [0.0062, 0.0062, 0.027], [-0.0002, 0.0046, 0.009], [-0.0009, 0.0046, 0.0086], [-0.0062, 0.0062, 0.027]], [[0, 1, 2], [3, 5, 4]], A, 'membrane'),
    codePart('wing_l', [0, 0.0062, 0.005], [[0, 0.0062, 0.005], [0, 0.0074, -0.014], [0.0046, 0.003, -0.016], [0.0024, 0.0034, 0.003]], [[0, 2, 1], [0, 3, 2]], Wc, 'membrane'),
    codePart('wing_r', [0, 0.0062, 0.005], [[0, 0.0062, 0.005], [0, 0.0074, -0.014], [-0.0046, 0.003, -0.016], [-0.0024, 0.0034, 0.003]], [[0, 1, 2], [0, 2, 3]], Wc, 'membrane'),
    codePart('wake', [0, 0, -0.006], [[0, 0.0006, -0.004], [0, 0.0006, -0.009], [0.034, 0.0006, -0.1], [-0.034, 0.0006, -0.1]], [[0, 2, 1], [0, 1, 3]], K, 'membrane'),
  ];
  const geo = buildInsectGeometry(parts, (n) => ({ body: 0, feelers: 0, wing_l: 1, wing_r: 2, wake: 6 }[n]));
  const wheels = o.wheels.slice(0, MAX_WHEELS).map((g) => {
    const p = g.position ? new THREE.Vector3(g.position[0], 0, g.position[g.position.length - 1]) : kit.at(g.at[0], g.at[1] ?? 0, 0);
    return { x: p.x, z: p.z, radius: g.radius ?? 1.3, n: count(ctx, g.count ?? 200, o.exact), color: g.color ?? '#f3a77e', gain: g.gain ?? 0.7, lightRadius: g.lightRadius, strength: 1, phase: 0, list: [], budget: 0, tween: null };
  });
  const N = wheels.reduce((a, w) => a + w.n, 0), aWheel = new Float32Array(N), aSeed = new Float32Array(N * 4), aHop = new Float32Array(N * 4);
  let k = 0;
  wheels.forEach((w, i) => { for (let j = 0; j < w.n; j++, k++) {
    aWheel[k] = i; aSeed.set([rnd(), rnd(), rnd(), rnd()], k * 4);
    aHop.set([2.5 + rnd() * 5.5, rnd(), 0.1 + rnd() * 0.12, Math.min(o.maxHeight, o.hop[0] + (o.hop[1] - o.hop[0]) * rnd() * rnd())], k * 4);
    w.list.push(k);
  } });
  instanced(geo, 'aWheel', aWheel, 1); instanced(geo, 'aSeed', aSeed, 4); instanced(geo, 'aHop', aHop, 4);
  geo.instanceCount = N;
  const rule = litRule(ctx, { rule: 'under', dark: o.dark, height: 0.9, cap: o.cap, lights: [] }), shoves = makeShoves(ctx, { hull: o.hull, close: o.close });
  const pushLights = () => {
    const list = wheels.map((w) => ({ x: w.x, z: w.z, radius: w.lightRadius ?? w.radius * 1.35, color: col(w.color).clone().lerp(PALE_LIGHT, 0.62), gain: w.gain * w.strength })).concat(o.lights);      // they are pale and matte, and they sit IN the light beneath them: they take two fifths of its colour
    rule.setLights(list);
  };
  pushLights();
  const U = {
    uT: C.uT, uKeep: C.uKeep, uPx: C.uPx, ...shoves.uniforms, uSize: { value: o.size }, uMinPx: { value: o.minPixels }, uFlick: { value: 0 }, uPale: { value: new THREE.Vector2(0.3, 0.7) },
    uWheel: { value: Array.from({ length: MAX_WHEELS }, (_, i) => (wheels[i] ? new THREE.Vector4(wheels[i].x, wheels[i].z, wheels[i].radius, 0) : new THREE.Vector4())) },
    uWheelK: { value: Array.from({ length: MAX_WHEELS }, () => new THREE.Vector4(1, 0, 1, 0)) },
  };
  const ext = {
    uniforms: U,
    vertexPars: /* glsl */`${PART_ATTRS} ${INSECT_GLSL} ${shoves.glsl}
      attribute float aWheel; attribute vec4 aSeed, aHop; uniform float uT, uKeep, uSize, uFlick, uPx, uMinPx; uniform vec4 uWheel[${MAX_WHEELS}], uWheelK[${MAX_WHEELS}];`,
    vertexLocal: /* glsl */`
      int wi = int(aWheel); vec4 W = uWheel[wi], Kw = uWheelK[wi];
      float r0 = W.z * sqrt(mix(0.04, 1.0, aSeed.x)), sgn = aSeed.w < 0.2 ? -1.0 : 1.0, stepLen = 0.22 + 0.2 * aSeed.z;
      float q = W.w * (0.7 + 0.6 * aSeed.y) / stepLen + aSeed.z * 10.0, fq = fract(q), dash = floor(q) + smoothstep(0.15, 0.85, fq);      // it goes in dashes
      float r = r0 + 0.09 * sin(dash * 2.3 + aSeed.w * 20.0), th = aSeed.x * 44.0 + sgn * dash * stepLen / max(r0, 0.3);
      vec3 c = vec3(W.x + cos(th) * r, 0.0, W.y + sin(th) * r);
      float hx = fract(uT / aHop.x + aHop.y) / aHop.z, hop = hx < 1.0 ? 4.0 * hx * (1.0 - hx) * (1.0 - Kw.y) : 0.0;                         // and now and then lifts off and touches down again
      c.y = aHop.w * hop;
      c = liShove(c, 1.0); c = liKeepOut(c, uCameraPos, uKeep); c.y = max(c.y, 0.0);
      vec4 Lc = liLit(c + vec3(0.0, 0.02, 0.0)); vLit = Lc;
      float going = (1.0 - Kw.y) * smoothstep(0.1, 0.3, fq) * (1.0 - smoothstep(0.7, 0.9, fq)), air = max(step(0.02, hop), going);
      vec3 fwd = sgn * vec3(-sin(th), 0.0, cos(th)), upv = vec3(0.0, 1.0, 0.0), lft = cross(upv, fwd);
      float beat = step(0.5, fract(uFlick + aSeed.x * 7.0)), flap = air * mix(0.5, 1.35, beat);
      vec3 p = transformed, nn = objectNormal; float show = Kw.x * smoothstep(0.03, 0.3, Lc.a);
      if (aPart > 0.5 && aPart < 2.5) { mat3 Hm = liRz((aPart < 1.5 ? 1.0 : -1.0) * flap); p = Hm * p; nn = Hm * nn; }
      else if (aPart > 5.5) { p *= going * (1.0 - step(0.02, hop)); }                // the V it draws: only while it runs on the water
      p += aPivot;
      float growS = max(1.0, uMinPx * uPx * distance(c, uCameraPos) / (0.024 * uSize));
      transformed = c + (lft * p.x + upv * p.y + fwd * p.z) * (uSize * show * growS); objectNormal = lft * nn.x + upv * nn.y + fwd * nn.z;
      vThin = aMem; vCover = mix(1.0, 0.55, air);`,
    fragmentPars: FRAG_STIPPLE_PARS,
    albedo: FRAG_STIPPLE,
  };
  const mat = kit.gouache({ vertexColors: true, side: THREE.DoubleSide, brush: 0, color: o.color, ...o.material, extend: [ext, rule.ext] });
  const object = new THREE.Mesh(geo, mat); object.name = 'sedge flies'; object.frustumCulled = false;
  C.perPass(object, geo, () => N, 0.5); C.mirrorMode(object, o.mirror); C.parent.add(object);
  let settle = 0, settleTween = null, tPrev = 0;
  const touch = (i, w) => {                                 // where fly i is now: the same sums as the shader
    const sx = aSeed[i * 4], sy = aSeed[i * 4 + 1], sz = aSeed[i * 4 + 2], sw = aSeed[i * 4 + 3];
    const r0 = w.radius * Math.sqrt(0.04 + 0.96 * sx), sgn = sw < 0.2 ? -1 : 1, stepLen = 0.22 + 0.2 * sz, q = w.phase * (0.7 + 0.6 * sy) / stepLen + sz * 10;
    const dash = Math.floor(q) + smooth(0.15, 0.85, q - Math.floor(q)), r = r0 + 0.09 * Math.sin(dash * 2.3 + sw * 20), th = sx * 44 + sgn * dash * stepLen / Math.max(r0, 0.3);
    return [w.x + Math.cos(th) * r, w.z + Math.sin(th) * r];
  };
  const api = {
    object, count: N, rule, uniforms: U,
    wheel(i) {
      const w = wheels[i];
      return {
        get x() { return w.x; }, get z() { return w.z; }, get radius() { return w.radius; }, get strength() { return w.strength; }, set strength(v) { w.strength = v; pushLights(); },
        set(p) { if (p.x != null) w.x = p.x; if (p.z != null) w.z = p.z; if (p.radius != null) w.radius = p.radius; pushLights(); return this; },
        moveTo(x, z, seconds = 6) { if (w.tween) w.tween.cancel(); const x0 = w.x, z0 = w.z; w.tween = ctx.stage.tween((kk) => { w.x = x0 + (x - x0) * kk; w.z = z0 + (z - z0) * kk; pushLights(); }, 0, 1, seconds); return this; },
        fade(kk, seconds = 3) { const a = w.strength; ctx.stage.tween((q) => { w.strength = a + (kk - a) * q; pushLights(); }, 0, 1, seconds); return this; },
      };
    },
    settle(kk, seconds = 2) { if (settleTween) settleTween.cancel(); settleTween = ctx.stage.tween((v) => { settle = v; }, settle, kk, seconds); return api; },
    part(x, y, z, r, seconds = 6) { shoves.push(x, y, z, r, seconds); return api; },
  };
  ctx.onUpdate((dt) => {
    const t = ctx.time; C.uT.value = t; U.uFlick.value = (t * 11) % 1; shoves.update(dt);
    const boat = ctx.boat, sp = o.speed * (C.calm ? 0.6 : 1);
    wheels.forEach((w, i) => {
      w.phase += dt * sp * (1 - settle);
      U.uWheel.value[i].set(w.x, w.z, w.radius, w.phase); U.uWheelK.value[i].set(w.strength, settle, 1, 0);
      if ((!o.ripples && !o.onTouch) || settle > 0.9 || Math.hypot(w.x - boat.x, w.z - boat.z) > o.reach) return;
      w.budget = Math.min(1, w.budget + dt * o.touches);
      for (const q of w.list) {                             // a touch-down: its hop has just ended
        if (w.budget < 1) break;
        const P = aHop[q * 4], ph = aHop[q * 4 + 1], d = aHop[q * 4 + 2];
        if (Math.floor(t / P + ph - d) !== Math.floor(tPrev / P + ph - d)) { w.budget -= 1; const [x, z] = touch(q, w); if (o.ripples) ctx.water.ripple(x, z, 0.08, 0.2); if (o.onTouch) o.onTouch(x, z, 'sedge'); }
      }
    });
    tPrev = t;
  });
  return api;
}

// ================================================================================================ moths
/**
 * Moths drawn to flames. Each belongs to a place: a perch (it sits roof-wise, or flies loops near it), a flame
 * (it circles in tightening loops, settles on the lamp for a while, lifts and circles again) or nowhere (unseen).
 * A cue sends it from one place to the next, and it loops its way over. The small moth of the swarms (moth_far.glb).
 *
 *   const moths = await makeMoths(ctx, { lamps: [{ at: lamp.position }], count: 4 });          // the moths of a kept lamp
 *   const gilt = await makeMoths(ctx, { species: 'gilt', perches, resting: 420, flying: 180 });
 *   gilt.toFlames(flames, { from: [x, z], speed: 8 });                                         // their tier kindles
 *
 * options
 *   species   'lamp' (pale, 5 cm across the spread wings) | 'gilt' (pale gold, a copper hind wing; 6 cm across, at
 *             rest a tent 30 by 26 mm) | 'winter' (grey, 3 cm, rests flat) : sets size, colours and the way of resting;
 *             any of the next four overrides it
 *   size      1 = 6 cm across the spread wings (the file's size); minPixels 6 (far off it is drawn no smaller);
 *             color (multiplies its paint); hind (the hind wing's colour); rest: 'roof' | 'flat'
 *   lamps     [{ at: Vector3 | () => Vector3 | [x, y, z], lit = 1, seat: [x, y, z] | false, still, visitors }]
 *             lights that can move or go out (up to 16): `at` is read every frame. seat = where they settle, from the
 *             flame (default: the lantern's cap, [0, 0.105, 0]); false = they never settle. still: seconds (a lamp on
 *             the boat: `visitors` = 2 spare moths come to it when the boat has held still that long, and leave when
 *             it makes way)
 *   count     moths that attend the lamps from the start (shared out among them); spare: hidden ones for arrive()
 *   perches   [{ x, y, z, nx, ny, nz }]; resting: how many sit on them; flying: how many more fly loops near one
 *   orbit     { wide: 0.55, tight: 0.14, speed: 0.9, cycle: 20 }   metres, m/s, seconds for one coming-in and settling
 *   beat      wingbeats a second (9); flameColor '#ffb45e' and flameGain 0.7: how a flame lights them, within 1.4 m
 *             (kept under 1 so that a moth is lit and never glows: it is not a light)
 *   wake      1: at rest they open flat where the water beside them is disturbed (wake-light), 0 = never
 *   hull      0: with a radius (4 m), when the hull COMES that near, two in five of those at rest there lift, six to
 *             twelve together, and settle on perches 3 to 6 m further on after `transit` = 8 s; the rest sit it out (a
 *             boat lying beside a wall keeps moths to look at); no more than one such lift every 2.5 to 5 s;
 *             onLift(x, y, z, n) is called where they lift (the place for a sound)
 *   lit       a lit rule on top (litRule); keepOut 0.75; mirror false; seed; exact; material
 * returns { object, count,
 *   lamp(i) -> { lit (set 0 or 1), moths }      arrive(i, n, { delay, seconds, from })   leave(i, { seconds, to })
 *   toFlames(flames, { from: [x, z], speed, near, seconds })    every moth within `near` of a flame goes to it, in a
 *                                                               front that runs out from a point
 *   sendTo(which, place, { at, seconds })       which: an index, a list, or (i) => bool; place: { x, y, z, nx, ny, nz }
 *                                               | { flame: [x, y, z] } | { lamp: k } | 'away', or (i) => one of those
 *   open(k, seconds)                            open them all flat (1) or let them close (0)
 *   gust(x, y, z, seconds)                      those on the wing are thrown this far and gather again
 *   placeOf(i) }
 */
export const MAX_LAMPS = 16;
const MOTH_SPECIES = {
  lamp: { size: 0.9, color: '#efe6d6', hind: '#e2d8c8', rest: 'roof', beat: 11 },
  gilt: { size: 1.0, color: '#e6c478', hind: '#b5522a', rest: 'roof', beat: 9 },
  winter: { size: 0.5, color: '#9c958c', hind: '#b4aea6', rest: 'flat', beat: 10 },          // (grey-brown: it must read on a white page as well as by a flame)
};
export async function makeMoths(ctx, opts = {}) {
  const sp = MOTH_SPECIES[opts.species || 'lamp'] || MOTH_SPECIES.lamp;
  const o = { species: 'lamp', minPixels: 6, lamps: [], count: 0, spare: 0, perches: [], resting: 0, flying: 0, orbit: {}, flameColor: '#ffb45e', flameGain: 0.7, wake: 1, hull: 0, transit: 8, onLift: null, lit: null, keepOut: 0.75, mirror: false, seed: 41,
    exact: false, material: {}, ...sp, ...opts };
  const orbit = { wide: 0.55, tight: 0.14, speed: 0.9, cycle: 20, ...o.orbit };
  const { kit } = ctx, C = common(ctx, o), rnd = ctx.rng(o.seed), S = C.S;
  const parts = await loadInsectParts(ctx, 'models/life/moth_far.glb');
  const geo = buildInsectGeometry(parts, (n) => ({ wing_fl: 1, wing_fr: 2, wing_hl: 3, wing_hr: 4 }[n] ?? 0));
  const lamps = o.lamps.slice(0, MAX_LAMPS).map((l) => {
    const at = l.at ?? l.position ?? l, get = typeof at === 'function' ? at : at && at.isVector3 ? () => at : (() => { const q = v3(at); return () => q; })();
    return { get, lit: l.lit ?? 1, seat: l.seat === false ? null : v3(l.seat || [0, 0.105, 0]), moths: [], still: l.still || 0, visitors: l.visitors ?? 2, stillT: 0 };
  });
  const nLamp = count(ctx, o.count, o.exact || o.count <= 12), nRest = count(ctx, o.resting, o.exact), nFly = count(ctx, o.flying, o.exact), nSpare = o.spare;
  const N = nLamp + nRest + nFly + nSpare, NEVER = 1e9, LONG_AGO = -1e5;
  const aA = new Float32Array(N * 4), aAn = new Float32Array(N * 3), aB = new Float32Array(N * 4), aBn = new Float32Array(N * 3), aMove = new Float32Array(N * 4), aSeed = new Float32Array(N * 4);
  const setPlace = (arr, nrm, i, pl) => {                   // kinds: -1 perch, -2 a fixed flame, -3 away, >= 0 one of the lamps
    if (pl === 'away' || pl.away) { const q = pl.away || [0, -50, 0]; arr.set([q[0], q[1], q[2], -3], i * 4); nrm.set([0, 1, 0], i * 3); }
    else if (pl.lamp != null) { arr.set([0, 0, 0, pl.lamp], i * 4); nrm.set([0, 1, 0], i * 3); }
    else if (pl.flame) { const q = v3(pl.flame); arr.set([q.x, q.y, q.z, -2], i * 4); nrm.set([0, 1, 0], i * 3); }
    else { arr.set([pl.x, pl.y, pl.z, -1], i * 4); nrm.set([pl.nx ?? 0, pl.ny ?? 1, pl.nz ?? 0], i * 3); }
  };
  const perchOf = new Int32Array(N).fill(-1), busyUntil = new Float32Array(N).fill(-1e9);
  let k = 0;
  for (let j = 0; j < nLamp; j++, k++) { const li = lamps.length ? j % lamps.length : 0; setPlace(aA, aAn, k, { lamp: li }); setPlace(aB, aBn, k, { lamp: li }); aMove.set([LONG_AGO, o.transit, 1, 0], k * 4); if (lamps[li]) lamps[li].moths.push(k); }
  for (let j = 0; j < nRest + nFly; j++, k++) {
    const pi = o.perches.length ? Math.floor(j * o.perches.length / Math.max(1, nRest + nFly) + rnd() * 0.999) % o.perches.length : 0, pl = o.perches[pi] || { x: 0, y: -50, z: 0 };
    setPlace(aA, aAn, k, pl); setPlace(aB, aBn, k, pl); aMove.set([LONG_AGO, o.transit, j < nRest ? 0 : 1, 0], k * 4); perchOf[k] = pi;
  }
  const spare = [];
  for (let j = 0; j < nSpare; j++, k++) { setPlace(aA, aAn, k, 'away'); setPlace(aB, aBn, k, 'away'); aMove.set([LONG_AGO, o.transit, 1, 0], k * 4); spare.push(k); }
  for (let i = 0; i < N; i++) aSeed.set([rnd(), rnd(), rnd(), rnd()], i * 4);
  const A = { a: instanced(geo, 'aA', aA, 4), an: instanced(geo, 'aAn', aAn, 3), b: instanced(geo, 'aB', aB, 4), bn: instanced(geo, 'aBn', aBn, 3), move: instanced(geo, 'aMove', aMove, 4) };
  instanced(geo, 'aSeed', aSeed, 4); geo.instanceCount = N;
  const rule = litRule(ctx, o.lit);
  const U = {
    uT: C.uT, uKeep: C.uKeep, uPx: C.uPx, ...waterUniforms(ctx.engine), uSize: { value: o.size }, uMinPx: { value: o.minPixels }, uBeat: { value: 0 }, uPale: { value: new THREE.Vector2(2, 3) },
    uLamp: { value: Array.from({ length: MAX_LAMPS }, () => new THREE.Vector4(0, -100, 0, 0)) }, uLampSeat: { value: Array.from({ length: MAX_LAMPS }, (_, i) => (lamps[i] && lamps[i].seat ? new THREE.Vector4(lamps[i].seat.x, lamps[i].seat.y, lamps[i].seat.z, 1) : new THREE.Vector4())) },
    uOrbit: { value: new THREE.Vector4(orbit.wide, orbit.tight, orbit.speed * (C.calm ? 0.6 : 1), orbit.cycle) }, uOpen: { value: new THREE.Vector2(0, o.wake) }, uGust: { value: new THREE.Vector3() },
    uRestFlat: { value: o.rest === 'flat' ? 1 : 0 }, uFlameColor: { value: col(o.flameColor).clone().multiplyScalar(o.flameGain) }, uHind: { value: (() => { const h = col(o.hind), c = col(o.color); return new THREE.Color(h.r / Math.max(c.r, 0.01), h.g / Math.max(c.g, 0.01), h.b / Math.max(c.b, 0.01)); })() },      // (the hind wing's own colour, whatever `color` is)
  };
  const ext = {
    uniforms: U,
    vertexPars: /* glsl */`${PART_ATTRS} ${INSECT_GLSL} ${WATER_GLSL}
      attribute vec4 aA, aB, aMove, aSeed; attribute vec3 aAn, aBn;
      uniform float uT, uKeep, uSize, uBeat, uRestFlat, uPx, uMinPx; uniform vec4 uLamp[${MAX_LAMPS}], uLampSeat[${MAX_LAMPS}], uOrbit; uniform vec2 uOpen; uniform vec3 uGust;
      varying float vHind, vFl;
      // where a moth is while it belongs to a place. sit = it is settled; fl = the flame's light; away = it is nowhere
      vec3 liPlace(vec4 pl, vec3 nrm, float t, float onWing, out float sit, out vec3 upv, out vec4 flame, out float away) {
        sit = 0.0; upv = vec3(0.0, 1.0, 0.0); flame = vec4(pl.xyz, 0.0); away = 0.0;
        if (pl.w < -2.5) { away = 1.0; return pl.xyz; }
        if (pl.w < -0.5 && pl.w > -1.5) {
          if (onWing < 0.5) { sit = 1.0; upv = normalize(nrm); return pl.xyz; }
          float a = t * (0.45 + 0.4 * aSeed.x) + aSeed.y * 40.0;                     // loops within a metre and a half of its perch: never the same loop twice
          a += 0.55 * sin(a * 0.37 + aSeed.z * 20.0) + 0.3 * sin(a * 2.3 + aSeed.w * 20.0);
          return pl.xyz + normalize(nrm) * 0.6 + vec3(sin(a * 1.3) * 0.62 + sin(a * 2.9 + aSeed.w * 9.0) * 0.2, sin(a * 0.9 + 1.0) * 0.3 + sin(a * 3.7 + aSeed.x * 9.0) * 0.12, sin(a * 1.7 + 2.0) * 0.62 + sin(a * 3.1 + aSeed.y * 9.0) * 0.2);
        }
        vec3 f = pl.xyz; float lit = 1.0; vec4 seat = vec4(0.0);
        if (pl.w > -0.5) { int li = int(pl.w + 0.5); f = uLamp[li].xyz; lit = uLamp[li].w; seat = uLampSeat[li]; }
        flame = vec4(f, lit);
        // one cycle: spiral in at a steady speed (so it turns faster as it tightens), settle, lift and widen again
        float Tc = uOrbit.w * (0.7 + 0.6 * aSeed.x), ph = t / Tc + aSeed.y * 11.0, cyc = floor(ph), u = ph - cyc;
        float R1 = uOrbit.x * (0.8 + 0.4 * aSeed.z), R0 = uOrbit.y, rr = R1 / R0, D = 0.62 * Tc;
        float kA = uOrbit.z * D / (R1 * log(rr)), kB = uOrbit.z * 0.38 * Tc / (0.5 * (R0 + R1));
        float x = clamp(u / 0.62, 0.0, 1.0), leave = smoothstep(0.88, 1.0, u);
        float r = R1 * pow(1.0 / rr, x * (1.0 - leave));
        float th = kA * (pow(rr, x) - 1.0) + kB * smoothstep(0.62, 1.0, u) + mod(cyc * (kA * (rr - 1.0) + kB), 6.2832) + aSeed.w * 6.2832;
        // A moth at a flame is no planet: it surges and stalls, its loop swells and shrinks and tips, it is thrown out and comes in again.
        // Slow irregular terms on the angle, the radius and the plane (the quick flutter of the body itself is added by liFlutter).
        float q1 = t * (1.05 + 0.5 * aSeed.z) + aSeed.x * 40.0, q2 = t * (2.6 + 0.9 * aSeed.w) + aSeed.y * 40.0;
        th += 0.85 * sin(q1) + 0.38 * sin(q2 * 1.17 + 1.0);
        r *= 1.0 + 0.30 * sin(q1 * 1.31 + 2.0) + 0.16 * sin(q2 + 0.5);
        r = max(r, 0.09);                                                            // never through the glass
        th *= aSeed.z > 0.5 ? 1.0 : -1.0;
        float tip = 0.45 * sin(q1 * 0.53 + aSeed.w * 6.2832);                        // the loop's plane tips one way and then another
        vec3 p = f + vec3(cos(th) * r, 0.04 + (0.08 + 0.2 * r) * sin(t * 1.9 + aSeed.x * 30.0) + r * tip * sin(th + aSeed.y * 6.2832) + 0.05 * sin(q2 * 1.43), sin(th) * r);
        if (seat.w > 0.5) {
          float s1 = smoothstep(0.62, 0.69, u) * (1.0 - smoothstep(0.85, 0.9, u));
          vec3 sp = f + seat.xyz + vec3(cos(aSeed.w * 6.2832), 0.0, sin(aSeed.w * 6.2832)) * 0.03;
          p = mix(p, sp, s1); sit = smoothstep(0.93, 1.0, s1);
        }
        return p;
      }
      vec3 liMoth(float t, out float sit, out vec3 upv, out vec4 flame, out float away, out vec3 perch) {
        float k = clamp((uT - aMove.x) / max(aMove.y, 0.01), 0.0, 1.0), e = k * k * (3.0 - 2.0 * k);
        float sA, sB, wA, wB; vec3 uA, uB; vec4 fA, fB;
        vec3 pA = liPlace(aA, aAn, t, aMove.z, sA, uA, fA, wA), pB = liPlace(aB, aBn, t, aMove.z, sB, uB, fB, wB);
        float mid = sin(3.14159 * k);
        vec3 p = mix(pA, pB, e) + mid * 0.45 * vec3(sin(t * 1.4 + aSeed.x * 20.0), 0.6 * sin(t * 1.1 + aSeed.y * 20.0) + 0.5, cos(t * 1.7 + aSeed.z * 20.0));   // never straight: it loops its way over
        sit = sA * (1.0 - smoothstep(0.0, 0.04, k)) + sB * smoothstep(0.96, 1.0, k);
        upv = k < 0.5 ? uA : uB; flame = k < 0.5 ? fA : fB; perch = k < 0.5 ? aA.xyz : aB.xyz;
        away = wA * (1.0 - step(0.02, k)) + wB * step(0.98, k);
        return p;
      }`,
    vertexLocal: /* glsl */`
      float sit, away, sit2, away2; vec3 upv, up2, perch, perch2; vec4 flame, fl2;
      vec3 c = liMoth(uT, sit, upv, flame, away, perch), ahead = liMoth(uT + 0.06, sit2, up2, fl2, away2, perch2);
      float fly = 1.0 - sit;
      vec3 vel = ahead - c, fwd;                                                     // (its heading is its own path's: not the gust's, nor the push away from the lens)
      // the flutter of a small body on big wings: it is jogged a few centimetres this way and that, several times a second
      float f1 = uT * (5.1 + 2.0 * aSeed.x) + aSeed.y * 50.0, f2 = uT * (8.3 + 2.5 * aSeed.z) + aSeed.w * 50.0;
      c += fly * (0.022 * vec3(sin(f1), sin(f1 * 1.31 + 1.7), cos(f1 * 0.83)) + 0.009 * vec3(sin(f2 + 0.7), cos(f2 * 1.13), sin(f2 * 0.91 + 2.0)));
      c += uGust * fly;
      c = liKeepOut(c, uCameraPos, uKeep);
      if (fly > 0.5) { fwd = normalize(vel + vec3(1e-4, 0.0, 0.0)); float roll = 0.35 * sin(uT * 1.3 + aSeed.x * 20.0); upv = normalize(vec3(0.0, 1.0, 0.0) + cross(fwd, vec3(0.0, 1.0, 0.0)) * roll); }
      else if (abs(upv.y) > 0.75) fwd = vec3(sin(aSeed.x * 6.2832), 0.0, cos(aSeed.x * 6.2832));
      else { vec3 t0 = normalize(vec3(0.0, 1.0, 0.0) - upv * upv.y), t1 = cross(upv, t0); float a = (aSeed.x - 0.5) * 1.8; fwd = t0 * cos(a) + t1 * sin(a); }      // on an upright face: head up, more or less
      vec3 lft = normalize(cross(upv, fwd)); fwd = normalize(cross(lft, upv));
      // ---- the pose: roof-wise or flat at rest, opened flat by wake-light, beating on the wing
      // wake-light: each has its own nerve (some open to a breath on the water, some only to a real wake), and those higher up, where the
      // water-light climbs last, need more of it: a wall of them never opens as one
      float sens = 0.55 + 0.9 * aSeed.w;
      float wake = uOpen.y * smoothstep(0.03 * sens + 0.012 * max(perch.y, 0.0), (0.16 + 0.2 * aSeed.z) * sens + 0.02 * max(perch.y, 0.0), waterRipple(perch.xz).w);
      float shrug = smoothstep(0.985, 0.992, fract(uT / (10.0 + 20.0 * aSeed.y) + aSeed.z)) * (1.0 - smoothstep(0.992, 1.0, fract(uT / (10.0 + 20.0 * aSeed.y) + aSeed.z)));
      float open = clamp(max(max(uOpen.x, wake), uRestFlat) + 0.3 * shrug, 0.0, 1.0);
      float bp = (uBeat + aSeed.x) * 6.2832, beatS = sin(bp);
      float tent = sit * (1.0 - open);
      float flap = fly * 1.08 * beatS, twist = mix(mix(0.0, -0.436, tent), 0.14 * cos(bp), fly);
      // opened flat: a moth that rests flat lies with its fore wings swept a little back over the hind wings; one that rests roof-wise and is
      // made to open shows its hind wings, the fore wings carried forward off them
      float sweepF = mix(mix(mix(-0.2, 0.35, uRestFlat), 1.222, tent), 0.03, fly), sweepH = mix(mix(mix(0.14, 0.105, uRestFlat), 1.222, tent), 0.03, fly);
      vec3 p = transformed, nn = objectNormal;
      if (aPart > 0.5) {
        float side = (aPart < 1.5 || (aPart > 2.5 && aPart < 3.5)) ? 1.0 : -1.0, hindW = step(2.5, aPart);
        p.z *= mix(1.0, 0.4, tent * hindW);                                          // the hind wing pleats away under the fore wing
        mat3 Hm = liHingeM(side, flap, mix(sweepF, sweepH, hindW), twist); p = Hm * p; nn = Hm * nn;
      }
      p += aPivot;
      p.y += fly * (-0.006 * sin(bp - 0.9) - 0.003);                                 // the body hangs below the wing roots and bobs with every beat
      mat3 Pm = liRx(-0.3 * fly); p = Pm * p; nn = Pm * nn;
      float show = (1.0 - away) * step(-40.0, c.y) * max(1.0, uMinPx * uPx * distance(c, uCameraPos) / (0.06 * uSize));
      transformed = c + (lft * p.x + upv * p.y + fwd * p.z) * (uSize * show); objectNormal = lft * nn.x + upv * nn.y + fwd * nn.z;
      vThin = 0.0; vCover = 1.0; vHind = step(2.5, aPart) * mix(1.0, 0.4, fly);        // (the hind wing's colour is for when it sits open; on the wing it is only a warmth)
      vFl = flame.w * (1.0 - smoothstep(0.1, 1.4, distance(c, flame.xyz)));`,
    fragmentPars: `${FRAG_STIPPLE_PARS} varying float vHind, vFl; uniform vec3 uHind, uFlameColor;`,
    albedo: 'albedo *= mix(vec3(1.0), uHind, vHind);',
    // a flame lights it warmly; it is never brighter than paper, so it never glows: a moth is not a light
    light: 'c += albedo * uFlameColor * vFl; { float m = max(c.r, max(c.g, c.b)); c *= min(1.0, 0.9 / max(m, 1e-3)); }',
  };
  const mat = kit.gouache({ vertexColors: true, side: THREE.DoubleSide, brush: 0, color: o.color, ...o.material, extend: [ext, { ...rule.ext, vertexWorld: 'vLit = liLit(wp.xyz);' }] });
  const object = new THREE.Mesh(geo, mat); object.name = 'moths'; object.frustumCulled = false;
  C.perPass(object, geo, () => N, 1); C.mirrorMode(object, o.mirror); C.parent.add(object);

  const now = () => ctx.time;
  const move = (i, pl, at, seconds) => {                    // B becomes the place it leaves; it must have arrived there first
    if (at < busyUntil[i]) return false;
    aA.set(aB.subarray(i * 4, i * 4 + 4), i * 4); aAn.set(aBn.subarray(i * 3, i * 3 + 3), i * 3);
    setPlace(aB, aBn, i, pl); aMove[i * 4] = at; aMove[i * 4 + 1] = seconds; busyUntil[i] = at + seconds;
    return true;
  };
  const flush = () => { for (const q of Object.values(A)) q.needsUpdate = true; };
  let openTween = null; const gust = { v: new THREE.Vector3(), t: 0, dur: 0 };
  const api = {
    object, count: N, uniforms: U, rule,
    placeOf: (i) => ({ x: aB[i * 4], y: aB[i * 4 + 1], z: aB[i * 4 + 2], kind: aB[i * 4 + 3] }),
    lamp(i) { const l = lamps[i]; return { get lit() { return l.lit; }, set lit(v) { l.lit = v; }, moths: l.moths }; },
    arrive(i, n = 3, { delay = 0, seconds = 6, from = null } = {}) {
      const L = lamps[i].get(), t0 = now() + delay;
      for (let j = 0; j < n && spare.length; j++) {
        const qi = spare.findIndex((m) => busyUntil[m] <= now()); if (qi < 0) break;
        const q = spare.splice(qi, 1)[0], a = rnd() * TAU, far = from || [L.x + Math.cos(a) * 7, L.y + 1.5 + rnd() * 2, L.z + Math.sin(a) * 7];
        setPlace(aB, aBn, q, { away: far }); busyUntil[q] = -1e9; move(q, { lamp: i }, t0 + j * 1.3, seconds); lamps[i].moths.push(q);
      }
      flush(); return api;
    },
    leave(i, { seconds = 7, to = null } = {}) {
      const L = lamps[i].get();
      for (const q of lamps[i].moths.splice(0)) { const a = rnd() * TAU; if (move(q, { away: to || [L.x + Math.cos(a) * 8, L.y + 2 + rnd() * 2, L.z + Math.sin(a) * 8] }, now() + rnd() * 1.5, seconds)) spare.push(q); else lamps[i].moths.push(q); }
      flush(); return api;
    },
    sendTo(which, place, { at = null, seconds = o.transit } = {}) {
      const t0 = at ?? now(), list = typeof which === 'number' ? [which] : Array.isArray(which) ? which : null;
      for (let q = 0; q < N; q++) { if (list ? !list.includes(q) : !which(q)) continue; const pl = typeof place === 'function' ? place(q) : place; if (pl) move(q, pl, t0, seconds); }
      flush(); return api;
    },
    toFlames(flames, { from = null, speed = 8, near = 6, seconds = 5, at = null } = {}) {
      const t0 = at ?? now();
      for (let q = 0; q < N; q++) {
        if (aB[q * 4 + 3] !== -1) continue;
        const x = aB[q * 4], y = aB[q * 4 + 1], z = aB[q * 4 + 2]; let best = null, bd = near;
        for (const f of flames) { const d = Math.hypot(f.x - x, f.y - y, f.z - z); if (d < bd) { bd = d; best = f; } }
        if (!best) continue;
        const d0 = from ? Math.hypot(best.x - from[0], best.z - from[1]) : 0;
        move(q, { flame: [best.x, best.y, best.z] }, t0 + d0 / speed + 0.4 + rnd() * 1.6, seconds * (0.7 + 0.6 * rnd()));
      }
      flush(); return api;
    },
    open(kk, seconds = 1.2) { if (openTween) openTween.cancel(); openTween = ctx.stage.tween((v) => { U.uOpen.value.x = v; }, U.uOpen.value.x, kk, seconds); return api; },
    gust(x, y, z, seconds = 6) { gust.v.set(x, y, z); gust.t = 0; gust.dur = seconds; return api; },
  };
  let hullT = 0;
  const hullSeen = new Uint8Array(N), nervous = [];        // (for the hull's lifts: which moths the hull has already come near on this pass, and which of them will not sit it out)
  ctx.onUpdate((dt) => {
    const t = ctx.time; C.uT.value = t; U.uBeat.value = (t * o.beat * (C.calm ? 0.7 : 1)) % 1;
    lamps.forEach((l, i) => {
      const q = l.get(); U.uLamp.value[i].set(q.x, q.y, q.z, l.lit);
      if (!l.still) return;                                   // a lamp on the boat: they come when it has held still a while, and go when it makes way
      const sp = ctx.boat.speed; l.stillT = sp < 0.15 ? l.stillT + dt : 0;
      if (l.stillT > l.still && !l.moths.length) api.arrive(i, l.visitors);
      else if (sp > 0.3 && l.moths.length) api.leave(i);
    });
    if (gust.dur > 0) { gust.t += dt; const x = clamp(gust.t / gust.dur, 0, 1), kk = Math.sin(Math.PI * x) ** 2 * (1 - x * 0.3); U.uGust.value.copy(gust.v).multiplyScalar(C.calm ? kk * 0.4 : kk); if (x >= 1) { gust.dur = 0; U.uGust.value.set(0, 0, 0); } }
    // The hull lifts a few of those at rest near it; they settle a little further on. It is the hull's COMING that lifts them, and only
    // the nervous ones (two in five): the rest sit it out, so that a boat lying a metre off a wall still has moths to look at, and a
    // boat that stays does not strip the wall bare a flutter at a time.
    if (o.hull > 0 && o.perches.length && (hullT -= dt) <= 0) {
      hullT = 0.5;
      const boat = ctx.boat;
      for (let q = 0; q < N; q++) {
        if (aB[q * 4 + 3] !== -1 || aMove[q * 4 + 2] > 0.5) continue;
        const d = Math.hypot(aB[q * 4] - boat.x, aB[q * 4 + 2] - boat.z);
        if (d > o.hull + 2) hullSeen[q] = 0;
        else if (d < o.hull && !hullSeen[q] && t > busyUntil[q] + 20) { hullSeen[q] = 1; if (rnd() < 0.4) nervous.push(q); }
      }
      if (nervous.length >= 3 || (nervous.length && (nervous.wait = (nervous.wait || 0) + 0.5) > 2.5)) {
        const want = Math.min(nervous.length, 6 + Math.floor(rnd() * 7)); let moved = 0, sx = 0, sy = 0, sz = 0;
        for (const q of nervous.splice(0, want)) {
          const x = aB[q * 4], y = aB[q * 4 + 1], z = aB[q * 4 + 2], cand = [];
          for (let pi = 0; pi < o.perches.length; pi++) { const pp = o.perches[pi], d = Math.hypot(pp.x - x, pp.z - z); if (d > 3 && d < 6 && Math.hypot(pp.x - boat.x, pp.z - boat.z) > o.hull) cand.push(pp); }
          if (cand.length && move(q, cand[Math.floor(rnd() * cand.length)], t + rnd() * 1.2, o.transit)) { moved++; sx += x; sy += y; sz += z; }
        }
        nervous.wait = 0;
        if (moved) { flush(); hullT = 2.5 + rnd() * 2.5; if (o.onLift) o.onLift(sx / moved, sy / moved, sz / moved, moved); }      // one lift, then a pause: it is an event, not a churn
      }
    }
  });
  return api;
}
