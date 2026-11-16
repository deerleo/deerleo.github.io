// The authoring kit: the building blocks a realm uses to make its world. A realm gets one as `ctx.kit`.
// Everything here respects the engine's fog and the veil between realms, shows up in the water's reflection,
// and scales its particle counts with the quality setting. See docs/realm-guide.md for how a realm is put
// together; the comment above each helper is the reference for its options. src/realms/kitcheck.js uses every
// helper and nearly every option (open it with ?realm=kitcheck).
//
// How things are drawn, in order (the water does not write depth, so the order is what puts it over or under things):
//   1 solid things: built geometry, cut-out flats (they hide each other correctly anywhere, above or below the water)
//   2 stars                                  3 anything marked `underwater`        4 the water
//   5 soft and additive flats                6 glows        7 particles            8 mist and light shafts
// A soft flat therefore never hides the glows, particles or mist behind it; only solid things do.
// The engine draws the scene up to three times a frame (without the water, mirrored for the reflection, and for the
// picture) into targets of different sizes; helpers whose look depends on the size of the picture (point sizes, the
// edges of cut-outs) set themselves up for each pass in onBeforeRender.
import * as THREE from 'three';
import { softDisc } from './boat.js';
import * as gouacheLib from './gouache.js';

// ------------------------------------------------------------------------------------------------ shared GLSL
/**
 * Fog for custom shaders. Put ${FOG_PARS} in BOTH shaders and give the material the engine's shared uniforms
 * (`uFogColor`, `uFogDensity`, `uVeil`, `uVeilColor` from `ctx.engine.shared`).
 *   vertex:    varying float vFogDist; ... vec4 mvPosition = modelViewMatrix * vec4(position, 1.0); vFogDist = fogDistance(mvPosition);
 *   fragment:  col = applyFog(col, vFogDist);                    // ordinary surfaces: fade into the fog colour
 *              col *= 1.0 - fogAmount(vFogDist);                  // additive light: fade to nothing instead
 * A compile error in a custom shader does not stop the page: the object is just missing. Look for it.
 */
export const FOG_PARS = /* glsl */`
  uniform vec3 uFogColor; uniform float uFogDensity; uniform vec3 uVeilColor; uniform float uVeil;
  float fogDistance(vec4 mvPosition) { return length(mvPosition.xyz); }
  float fogAmount(float dist) { return 1.0 - exp(-uFogDensity * uFogDensity * dist * dist); }
  vec3 applyFog(vec3 col, float dist) { return mix(col, uFogColor, fogAmount(dist)); }
`;
export const NOISE_GLSL = /* glsl */`
  float hash11(float n) { return fract(sin(n * 127.1) * 43758.5453123); }
  float hash21(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float vnoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash21(i), hash21(i + vec2(1.0, 0.0)), f.x), mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), f.x), f.y); }
  float fbm(vec2 p) { float a = 0.5, s = 0.0; for (int i = 0; i < 4; i++) { s += a * vnoise(p); p = p * 2.03 + 17.1; a *= 0.5; } return s; }
`;

// ------------------------------------------------------------------------------------------------ JS noise
function hash2(ix, iy, seed) { let h = (ix * 374761393 + iy * 668265263 + seed * 1442695041) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; }
/** Smooth value noise in 0..1. */
export function noise2(x, y, seed = 0) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  const a = hash2(ix, iy, seed), b = hash2(ix + 1, iy, seed), c = hash2(ix, iy + 1, seed), d = hash2(ix + 1, iy + 1, seed);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
export function fbm2(x, y, octaves = 4, seed = 0) { let a = 0.5, s = 0, n = 0; for (let i = 0; i < octaves; i++) { s += a * noise2(x, y, seed + i * 31); n += a; x = x * 2.03 + 17.1; y = y * 2.03 - 9.3; a *= 0.5; } return s / n; }

let _caustic = null;
/**
 * A tileable picture of water caustics (the bright web that rippling water throws on things), made once in code.
 * kit.painted slides two copies of it across each other; any custom shader may use it too (R channel, the square
 * root of the brightness / 4).
 */
export function causticTexture() {
  if (_caustic) return _caustic;
  const n = 256, data = new Uint8Array(n * n), TAU = Math.PI * 2, inten = 0.005, t = 23;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const px = x / n * TAU - 250, py = y / n * TAU - 250;       // the large offset keeps the pattern's terms bounded
    let ix = px, iy = py, c = 1;
    for (let k = 0; k < 4; k++) {
      const tt = t * (1 - 3.5 / (k + 1)), nx = px + Math.cos(tt - ix) + Math.sin(tt + iy), ny = py + Math.sin(tt - iy) + Math.cos(tt + ix);
      ix = nx; iy = ny;
      c += 1 / Math.hypot(px / (Math.sin(ix + tt) / inten), py / (Math.cos(iy + tt) / inten));
    }
    c = 1.17 - Math.pow(c / 4, 1.4);
    data[y * n + x] = Math.round(Math.sqrt(Math.min(4, Math.pow(Math.abs(c), 8)) / 4) * 255);
  }
  _caustic = new THREE.DataTexture(data, n, n, THREE.RedFormat);
  _caustic.wrapS = _caustic.wrapT = THREE.RepeatWrapping; _caustic.minFilter = THREE.LinearMipmapLinearFilter; _caustic.magFilter = THREE.LinearFilter;
  _caustic.generateMipmaps = true; _caustic.anisotropy = 4; _caustic.needsUpdate = true;
  _caustic.userData.shared = true;                              // every realm uses it: the engine must not free it with one of them
  return _caustic;
}

const _v = new THREE.Vector3(), _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _e = new THREE.Euler(), _p = {}, _size2 = new THREE.Vector2();
const col = (c) => (c && c.isColor ? c : new THREE.Color(c ?? 0xffffff));
const smoothstep = (a, b, x) => { if (!(b > a)) return x >= b ? 1 : 0; const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const vec3 = (p) => (p && p.isVector3 ? p : new THREE.Vector3(p[0], p[1], p[2]));

export function makeKit(engine, inst, ctx) {
  const shared = engine.shared, path = inst.path, group = inst.group, density = engine.quality.density;
  const sharedUniforms = () => ({ uTime: shared.uTime, uFogColor: shared.uFogColor, uFogDensity: shared.uFogDensity, uVeilColor: shared.uVeilColor, uVeil: shared.uVeil, uCameraPos: shared.uCameraPos });
  const kit = {};
  const rndK = ctx.rng(7919);                                  // the kit's own repeatable random source (pictures must repeat)
  // Point sizes are in pixels of whatever is being drawn into: the main picture, or the smaller picture the water
  // mirrors. These give the right figure for the pass in progress (call them from an object's onBeforeRender).
  const targetHeight = (renderer) => { const rt = renderer.getRenderTarget(); return rt ? rt.height : renderer.getDrawingBufferSize(_size2).y; };
  const pixelsPerMetre = (renderer, camera) => targetHeight(renderer) * 0.5 * camera.projectionMatrix.elements[5];      // at one metre from the eye
  const phase = ctx.rng(7919);                          // for flicker phases and the like: the same every run
  const skyTone = new THREE.Color(0.5, 0.5, 0.6); let hasSky = false;      // the light low in the sky, kept up to date by kit.sky
  const scalePoints = (points, mat) => { points.onBeforeRender = (renderer, scene, camera) => {
    mat.uniforms.uScale.value = pixelsPerMetre(renderer, camera); if (mat.uniforms.uPixel) mat.uniforms.uPixel.value = targetHeight(renderer) / 900; mat.uniformsNeedUpdate = true; }; };

  // ---------------------------------------------------------------------------------------------- placement
  /** Local position at arc length s, d metres right of the centreline (negative = left), height y. */
  kit.at = (s, d = 0, y = 0, target = new THREE.Vector3()) => path.point(s, d, y, target);
  /**
   * The boat's heading when it follows the path at s: the rotation.y that points an object's -Z axis down the path
   * (the boat's nose is its -Z). For turning scenery use a `face` mode instead (see kit.place).
   */
  kit.headingAt = (s) => path.at(s, _p).heading;
  /** Half width of the channel at s. */
  kit.halfWidth = (s) => path.at(s, _p).halfWidth;
  /**
   * The rotation.y for a `face` mode at path coordinates (s, d). One rule for kit.place, kit.flat and kit.flats: the
   * FRONT of a thing is its +Z side (the painted side of a flat, the side a PlaneGeometry or a text shows, the side
   * Object3D.lookAt turns toward its target).
   *   'back'      the front looks back up the path, at the oncoming boat
   *   'along'     the front looks down the path (the rider sees it properly only when looking back)
   *   'channel'   the front looks at the centreline (things on the banks; d decides which bank)
   *   a number    rotation.y as given
   */
  kit.faceAngle = (face, s, d = 0) => {
    if (typeof face === 'number') return face;
    const h = path.at(s, _p).heading;
    return face === 'along' ? h + Math.PI : face === 'channel' ? h + (d >= 0 ? -Math.PI / 2 : Math.PI / 2) : h;
  };
  /**
   * Put an object at path coordinates: s metres along, d metres right of the centreline, height y. `face` turns its
   * front (+Z) as described at kit.faceAngle: 'back', 'along', 'channel' or a number; leave it out to keep the
   * object's own rotation. Adds the object to the realm if it has no parent yet.
   */
  kit.place = (obj, s, d = 0, y = 0, face = null) => {
    path.point(s, d, y, obj.position);
    if (face !== null) obj.rotation.y = kit.faceAngle(face, s, d);
    if (!obj.parent) group.add(obj);
    return obj;
  };
  /** Call fn(s, i) every `step` metres from s0 to s1. */
  kit.along = (s0, s1, step, fn) => { let i = 0; for (let s = s0; s <= s1 + 1e-6; s += step) fn(s, i++); };
  kit.noise = noise2; kit.fbm = fbm2;
  /** Scale a particle or instance count by the quality setting. */
  kit.count = (n) => Math.max(1, Math.round(n * density));

  // ---------------------------------------------------------------------------------------------- lights
  // These lights act on kit.painted and on three.js's own lit materials. They do not reach kit.gouache (which takes
  // the realm's `look.light`), and painted flats, glows and particles are not lit at all: they show their own colours
  // (use `tint` and `emissive`).
  /** Soft overall light: sky colour from above, ground colour from below. */
  kit.hemi = (sky = '#8fa0ff', ground = '#1a1420', intensity = 1) => ctx.add(new THREE.HemisphereLight(col(sky), col(ground), intensity));
  /** A directional key light. `dir` is the direction the light travels: [0, -1, 0] shines straight down, and a `dir` that points back toward the start (+z) leaves the faces the rider sees first in shadow. */
  kit.sun = (color = '#fff0d8', intensity = 1, dir = [-0.4, -0.7, -0.5]) => { const l = new THREE.DirectionalLight(col(color), intensity); l.position.copy(vec3(dir)).normalize().multiplyScalar(-100); ctx.add(l); ctx.add(l.target); return l; };
  /**
   * A local lamp that lights nearby built geometry: { at: [s, d, y] (y defaults to 1) | position: [x, y, z], color,
   * intensity (candela; default 20: 20 to 60 lights a wall a few metres away), distance (reach in metres, default 14),
   * decay }. It has no visible source: add a kit.glow or a bright mesh at the same place. Keep the number of lamps
   * small (about 8 or fewer in a realm).
   */
  kit.lamp = ({ position, at, color = '#ffc98a', intensity = 20, distance = 14, decay = 1.8 } = {}) => {
    const l = new THREE.PointLight(col(color), intensity, distance, decay);
    if (at) path.point(at[0], at[1] ?? 0, at[2] ?? 1, l.position); else if (position) l.position.copy(vec3(position));
    return ctx.add(l);
  };

  // ---------------------------------------------------------------------------------------------- sky
  /**
   * A sky dome that surrounds the rider. Gradient colours by elevation, plus an optional painted panorama standing
   * around the horizon. opts:
   *   top, mid, horizon, below   colours (zenith, about 25 degrees up, the horizon, under the horizon)
   *   midAt                      elevation of the `mid` colour, 0..1 of the way to the zenith (default 0.28)
   *   texture                    painted panorama (a wide picture). The CENTRE of the picture is straight ahead at the
   *                              start of the realm (toward -z) and its left edge is on the rider's left.
   *   band                       where the panorama stands, in degrees of elevation.
   *                              Left out, or [lo] alone (default [-4]): the picture keeps its shapes. It wraps around
   *                              the rider with its bottom edge at `lo` and rises as far as its width allows; circles
   *                              stay circles everywhere and only get smaller toward the zenith. A 3:1 picture wrapped
   *                              once reaches about 75 degrees up, wrapped twice about 50. Wrapped once, a quarter of
   *                              the picture's width fills the rider's view: paint a true all-round panorama.
   *                              [lo, hi]: the picture is stretched to fill exactly that range (a wide picture in a low
   *                              band is stretched sideways: 360 / (repeat x picture width / height) degrees is the
   *                              height that keeps its proportions). [lo, 90] maps it over the whole dome.
   *   repeat                     how many times the picture repeats around the full circle (default 1)
   *   mirror                     true = every other repeat is mirrored, which hides the seam of a picture that does not
   *                              wrap (use an even `repeat`); a picture made with `art.py seamless` needs no mirror
   *   rotation                   radians; turns the panorama about the vertical axis like rotation.y (positive moves the
   *                              picture to the rider's left)
   *   panoramaGlow               multiplier on the panorama's brightness (above 1 feeds the bloom)
   *   fadeTop, fadeBottom        0..1 of the picture's height over which its upper and lower edges fade into the gradient
   *   end: { top, mid, horizon, below, panoramaGlow }   what the sky has become by the end of the realm. It changes over
   *                              the same stretch as the realm's `look` turns into its `lookEnd` (look.blend), so a realm that
   *                              travels from dusk into night gives its fog a `lookEnd` and its sky an `end`.
   * The far water takes the fog colour, the sky does not: keep `look.fog.color` close to `horizon` (or to the bottom of
   * the panorama), or a hard line shows where they meet.
   * Returns the Mesh. To drive the sky yourself, change mesh.material.uniforms in `update`: uTop, uMid, uHorizon, uBelow
   * (THREE.Color), uPanoGlow, uRotation (numbers).
   */
  kit.sky = (opts = {}) => {
    const o = { top: '#0b1030', mid: '#2a2a5a', horizon: '#6a5a7a', below: null, midAt: 0.28, texture: null, band: null, repeat: 1, mirror: false, rotation: 0, panoramaGlow: 1, fadeTop: 0.25, fadeBottom: 0.05, end: null, ...opts };
    const tex = o.texture, rad = Math.PI / 180, band = o.band == null ? [-4] : Array.isArray(o.band) ? o.band : [o.band];
    skyTone.copy(col(o.horizon)).lerp(col(o.mid), 0.25); hasSky = true;       // the light low in the sky: what mist takes its default colour from
    const conformal = band[1] == null;                 // no upper limit given: keep the picture's shapes
    let lo = band[0] * rad, hi = conformal ? 0 : band[1] * rad;
    if (conformal) {                                   // Mercator heights, atanh(sin(elevation)): equal scale both ways at every height
      const img = tex && tex.image, aspect = tex ? (tex.userData.aspect || (img && img.width && img.height ? img.width / img.height : 3)) : 3;
      lo = Math.atanh(Math.sin(lo)); hi = lo + 2 * Math.PI / (aspect * o.repeat);
    }
    const uniforms = {
      ...sharedUniforms(),
      uTop: { value: col(o.top).clone() }, uMid: { value: col(o.mid).clone() }, uHorizon: { value: col(o.horizon).clone() }, uBelow: { value: col(o.below ?? o.horizon).clone() }, uMidAt: { value: o.midAt },
      tPano: { value: tex }, uBand: { value: new THREE.Vector2(lo, hi) },
      uRepeat: { value: o.repeat }, uRotation: { value: o.rotation }, uPanoGlow: { value: o.panoramaGlow }, uFade: { value: new THREE.Vector2(o.fadeBottom, o.fadeTop) },
    };
    if (tex) { tex.wrapS = o.mirror ? THREE.MirroredRepeatWrapping : THREE.RepeatWrapping; tex.wrapT = THREE.ClampToEdgeWrapping; tex.needsUpdate = true; }
    const mat = new THREE.ShaderMaterial({
      uniforms, side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false,
      vertexShader: /* glsl */`varying vec3 vDir; void main() { vDir = normalize(position); vec4 p = projectionMatrix * viewMatrix * vec4(position + cameraPosition, 1.0); gl_Position = p.xyww; }`,
      fragmentShader: /* glsl */`
        uniform vec3 uTop, uMid, uHorizon, uBelow, uVeilColor; uniform float uMidAt, uVeil, uRepeat, uRotation, uPanoGlow;
        uniform vec2 uBand, uFade; uniform sampler2D tPano;
        varying vec3 vDir;
        void main() {
          vec3 d = normalize(vDir);
          float e = asin(clamp(d.y, -1.0, 1.0));                       // elevation, radians
          float t = clamp(e / 1.5708, 0.0, 1.0);
          vec3 c = t < uMidAt ? mix(uHorizon, uMid, smoothstep(0.0, uMidAt, t)) : mix(uMid, uTop, smoothstep(uMidAt, 1.0, t));
          c = mix(c, uBelow, smoothstep(0.0, -0.12, e));
          ${tex ? /* glsl */`
          float ua = (atan(d.x, -d.z) + uRotation) / 6.2831853, ub = fract(ua);     // the same angle with its jump behind the rider, and ahead
          float h = ${conformal ? '0.5 * log((1.0 + d.y) / max(1e-5, 1.0 - d.y))' : 'e'};
          float v = (h - uBand.x) / (uBand.y - uBand.x);
          vec2 uvA = vec2(ua * uRepeat + 0.5, v), uvB = vec2(ub * uRepeat + 0.5, v);
          // the angle jumps by a whole turn somewhere: take the picture's slope from whichever copy is smooth here,
          // or the jump shows as a thin dotted line
          vec2 gx = dFdx(uvA), gy = dFdy(uvA), hx = dFdx(uvB), hy = dFdy(uvB);
          if (dot(hx, hx) + dot(hy, hy) < dot(gx, gx) + dot(gy, gy)) { gx = hx; gy = hy; }
          if (v > 0.0 && v < 1.0) {
            vec4 p = textureGrad(tPano, uvA, gx, gy);
            float a = p.a * smoothstep(0.0, max(1e-4, uFade.x), v) * (1.0 - smoothstep(1.0 - max(1e-4, uFade.y), 1.0, v));
            c = mix(c, p.rgb * uPanoGlow, a);
          }` : ''}
          gl_FragColor = vec4(mix(c, uVeilColor, uVeil), 1.0);
        }`,
    });
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 24), mat);
    mesh.name = 'sky'; mesh.renderOrder = -1000; mesh.frustumCulled = false;
    if (o.end) {
      const keys = [['uTop', 'top'], ['uMid', 'mid'], ['uHorizon', 'horizon'], ['uBelow', 'below']];
      const from = keys.map(([u]) => uniforms[u].value.clone()), to = keys.map(([u, k], i) => (o.end[k] != null ? col(o.end[k]).clone() : k === 'below' && o.below == null && o.end.horizon != null ? col(o.end.horizon).clone() : from[i].clone()));
      const glow0 = o.panoramaGlow, glow1 = o.end.panoramaGlow ?? glow0, blend = inst.look.blend || [0.12, 0.88];
      ctx.onUpdate((dt, c) => {
        const t = smoothstep(blend[0], blend[1], c.progress);
        keys.forEach(([u], i) => uniforms[u].value.copy(from[i]).lerp(to[i], t));
        uniforms.uPanoGlow.value = glow0 + (glow1 - glow0) * t;
        skyTone.copy(uniforms.uHorizon.value).lerp(uniforms.uMid.value, 0.25);
      });
    }
    return ctx.add(mesh);
  };

  /**
   * Stars (or any field of distant points) on the dome, behind everything else. opts:
   *   count, size (pixels on a 900 px tall picture), color or colors: [], intensity (above 1 blooms), twinkle 0..1,
   *   band: [loDeg, hiDeg] (default [4, 90]; they thin out over the lowest 8 degrees of the band), seed
   * Returns the Points. To bring them out as a realm darkens, change points.material.uniforms.uIntensity.value in `update`.
   */
  kit.stars = (opts = {}) => {
    const o = { count: 1400, size: 2.2, color: '#ffffff', colors: null, twinkle: 0.5, band: [4, 90], seed: 5, intensity: 1.6, ...opts };
    const n = kit.count(o.count), rnd = ctx.rng(o.seed), pos = new Float32Array(n * 3), aux = new Float32Array(n * 4), cols = new Float32Array(n * 3);
    const lo = Math.sin(o.band[0] * Math.PI / 180), hi = Math.sin(o.band[1] * Math.PI / 180), palette = (o.colors || [o.color]).map(col);
    for (let i = 0; i < n; i++) {
      const y = lo + (hi - lo) * rnd(), r = Math.sqrt(Math.max(0, 1 - y * y)), a = rnd() * Math.PI * 2;
      pos.set([Math.cos(a) * r, y, Math.sin(a) * r], i * 3);
      aux.set([rnd(), Math.pow(rnd(), 2.2) * 1.6 + 0.4, rnd() * 6.283, rnd()], i * 4);
      const c = palette[Math.floor(rnd() * palette.length)]; cols.set([c.r, c.g, c.b], i * 3);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('aAux', new THREE.BufferAttribute(aux, 4)); geo.setAttribute('aColor', new THREE.BufferAttribute(cols, 3));
    const mat = new THREE.ShaderMaterial({
      uniforms: { ...sharedUniforms(), uSize: { value: o.size }, uTwinkle: { value: o.twinkle }, uIntensity: { value: o.intensity }, uPixel: { value: 1 }, uLow: { value: lo } },
      // drawn at the far plane WITH the depth test, so that land, flats and the boat hide them
      transparent: true, depthWrite: false, depthTest: true, blending: THREE.AdditiveBlending, fog: false,
      vertexShader: /* glsl */`
        attribute vec4 aAux; attribute vec3 aColor; uniform float uSize, uTwinkle, uTime, uPixel, uLow; varying vec3 vColor; varying float vA;
        void main() {
          vec4 p = projectionMatrix * viewMatrix * vec4(position * 900.0 + cameraPosition, 1.0); gl_Position = p.xyww;
          float tw = 1.0 - uTwinkle * (0.5 + 0.5 * sin(uTime * (0.6 + aAux.x * 2.2) + aAux.z));
          vColor = aColor; vA = tw * (0.35 + 0.65 * aAux.w) * smoothstep(uLow, uLow + 0.14, position.y);
          gl_PointSize = max(1.0, uSize * aAux.y * uPixel);
        }`,
      fragmentShader: /* glsl */`
        uniform float uVeil, uIntensity; varying vec3 vColor; varying float vA;
        void main() { float r = length(gl_PointCoord - 0.5) * 2.0; float a = smoothstep(1.0, 0.0, r); a *= a; gl_FragColor = vec4(vColor * uIntensity * a * vA * (1.0 - uVeil), 1.0); }`,
    });
    const pts = new THREE.Points(geo, mat);
    pts.name = 'stars'; pts.frustumCulled = false; pts.renderOrder = -999;
    pts.onBeforeRender = (renderer) => { mat.uniforms.uPixel.value = targetHeight(renderer) / 900; mat.uniformsNeedUpdate = true; };
    return ctx.add(pts);
  };

  // ---------------------------------------------------------------------------------------------- painted flats
  // The fragment shader of every painted flat. kind: 'cut' (a cut-out), 'core' (the solid part of cutout 'both'),
  // 'soft' (translucent), 'add' (light). `many`: the instanced kind, whose tint comes per copy.
  const flatFragment = (kind, many) => {
    const cut = kind === 'cut' || kind === 'core';
    return /* glsl */`
      uniform sampler2D map; uniform vec3 uTint; uniform vec2 uTexSize; uniform float uOpacity, uFogAmount${cut ? ', uEdge, uCut' : ''};
      ${FOG_PARS}
      varying vec2 vUv; varying float vDist; ${many ? 'varying vec3 vTint;' : ''}
      void main() {
        vec4 t = texture2D(map, vUv);
        float a = t.a;
        ${cut ? /* glsl */`
        // A cut-out: one crisp edge where the picture is uEdge opaque, a pixel wide at any distance, smoothed by the
        // multisampling where there is some (uCut says whether there is). Far away, thin things would melt as the
        // picture is averaged down, so their alpha is lifted a little with every halving.
        ${kind === 'cut' ? 'vec2 px = vUv * uTexSize; vec2 gx = dFdx(px), gy = dFdy(px); a = min(1.0, a * (1.0 + 0.25 * max(0.0, 0.5 * log2(max(dot(gx, gx), dot(gy, gy))))));' : ''}
        a = clamp((a - uEdge) / max(fwidth(a), 1e-4) + 0.5, 0.0, 1.0);
        if (a < uCut) discard;
        a *= uOpacity;` : /* glsl */`
        a *= uOpacity;
        if (a < 0.004) discard;`}
        vec3 c = t.rgb * uTint${many ? ' * vTint' : ''};
        float f = fogAmount(vDist) * uFogAmount;
        float fa2 = uFogAmount * uFogAmount, fa4 = fa2 * fa2;
        float vl = uVeil * (1.0 - fa4 * fa4);                    // what the fog is told to spare, the veil between realms still hides
        ${kind === 'add' ? 'gl_FragColor = vec4(c * a * (1.0 - f) * (1.0 - vl), 1.0);' : 'gl_FragColor = vec4(mix(mix(c, uFogColor, f), uVeilColor, vl), a);'}
      }`;
  };
  // With multisampling a cut-out's edge is smoothed by coverage; without it (low quality, and the picture the water
  // mirrors) it is a plain cut. Each pass tells the material which it is.
  const cutPerPass = (mesh) => { mesh.onBeforeRender = (renderer, scene, camera, geometry, m) => { const rt = renderer.getRenderTarget(); m.uniforms.uCut.value = rt && rt.samples > 0 ? 0.01 : 0.5; m.uniformsNeedUpdate = true; }; };

  /**
   * A painted picture standing in the world, like a piece of theatre scenery. Returns the Mesh.
   *   texture                 from `await ctx.tex(...)`, or one cell of a kit.sheet: kit.flat(sheet.cells[2], {...})
   *   width or height         size in metres (the other follows the picture's proportions); or both. Default: 4 m tall.
   *   at: [s, d, y]           path coordinates of its bottom centre (d > 0 = right bank); or position: [x, y, z]
   *   face                    which way its painted side (its front, +Z) looks:
   *                             'channel'  at the centreline: the default when placed with `at` (flats on a bank)
   *                             'camera'   turns about the vertical axis to face the rider (trees, posts, anything that
   *                                        must never be seen edge-on)
   *                             'back'     back up the path, at the oncoming boat
   *                             'along'    down the path: the rider sees its mirrored back until they turn round
   *                             'up'       lies flat, painted side up, the top of the picture pointing down the path;
   *                                        anchored at its centre (lily pads, things under the surface, light on the ground)
   *                             a number   rotation.y (0 looks toward +z); the default when placed with `position`
   *   spin                    radians added to the turn about the vertical axis (not with 'camera')
   *   uv: [u0, v0, u1, v1]    use only this part of the picture (v = 0 is the bottom), e.g. one cell of a prop sheet
   *   emissive                brightness multiplier; above about 1.2 the flat starts to glow through the bloom
   *   tint, opacity
   *   cutout                  how the picture's transparency is drawn:
   *                             true (default)  a cut-out: crisp edges where the picture is half opaque, hidden by and hiding
   *                                             everything correctly, above or below the water. Anything painted softer than
   *                                             that (a halo, mist, wisps) is NOT drawn. `opacity` thins a cut-out only in a few
   *                                             coarse steps, and not at all on low quality: for a see-through flat use false.
   *                             'both'          the solid parts as a cut-out plus the soft parts as a translucent layer over
   *                                             them: for a tree with glowing lanterns, a lamp with its halo. Two draw calls.
   *                             false           the whole picture as one soft translucent layer (veils, mist, glass). It does
   *                                             not hide the glows, particles and mist behind it.
   *   additive                true: adds light (glows, light shapes); the picture's alpha is its strength; implies cutout false
   *   sway: {amp, speed, phase}   the top sways (foliage, banners); amp in metres
   *   curve                   radians: bend the flat around a vertical axis so wide scenery wraps toward the rider (its two
   *                           ends come forward; 1.2 is a good backdrop)
   *   fog                     1 = fully fogged like everything else (default) .. 0 = ignores the realm's fog (far backdrops that
   *                           should stay visible). The veil between realms hides it either way.
   *   anchor                  'bottom' (default) or 'center'
   *   mirror                  true: flip the picture left-right
   *   underwater              true: for translucent and additive flats below the surface, so the water lies over them
   * A flat is double sided: from behind it shows the picture mirrored.
   */
  kit.flat = (texture, opts = {}) => {
    if (texture && !texture.isTexture && texture.texture) { opts = { uv: texture.uv, ...opts }; texture = texture.texture; }     // a cell of a sheet
    const o = { width: null, height: null, at: null, position: null, face: null, spin: 0, uv: null, emissive: 1, tint: '#ffffff', opacity: 1, cutout: true, additive: false, sway: null, curve: 0, fog: 1, anchor: null, mirror: false, underwater: false, ...opts };
    const uv = o.uv || [0, 0, 1, 1];
    const img = texture.image;                          // a texture made in code (a canvas) has no userData.aspect
    const iw = texture.userData.width || (img && img.width) || 1024, ih = texture.userData.height || (img && img.height) || 1024;
    const texAspect = (texture.userData.aspect || iw / ih) * ((uv[2] - uv[0]) / (uv[3] - uv[1]));
    const face = o.face ?? (o.at ? 'channel' : 0), anchor = o.anchor ?? (face === 'up' ? 'center' : 'bottom');
    let w = o.width, h = o.height;
    if (w == null && h == null) h = 4;
    if (w == null) w = h * texAspect; if (h == null) h = w / texAspect;
    const segs = o.curve ? 24 : (o.sway ? 6 : 1);
    const geo = new THREE.PlaneGeometry(w, h, segs, o.sway ? 6 : 1);
    if (anchor === 'bottom') geo.translate(0, h / 2, 0);
    if (o.curve) {                                     // wrap around a vertical cylinder whose axis is in front of the flat (+Z side)
      const p = geo.attributes.position, R = w / o.curve;
      for (let i = 0; i < p.count; i++) { const a = p.getX(i) / R; p.setX(i, Math.sin(a) * R); p.setZ(i, (1 - Math.cos(a)) * R); }
      geo.computeVertexNormals();
    }
    const uniforms = {
      ...sharedUniforms(), map: { value: texture }, uUv: { value: new THREE.Vector4(uv[0], uv[1], uv[2] - uv[0], uv[3] - uv[1]) }, uTint: { value: col(o.tint).clone().multiplyScalar(o.emissive) },
      uOpacity: { value: o.opacity }, uFogAmount: { value: o.fog }, uSway: { value: new THREE.Vector3(o.sway ? o.sway.amp : 0, o.sway ? (o.sway.speed ?? 1) : 0, o.sway ? (o.sway.phase ?? 0) : 0) }, uMirror: { value: o.mirror ? 1 : 0 },
      uTexSize: { value: new THREE.Vector2(iw, ih) },
    };
    // kind: 'cut' (a cut-out), 'core' (the solid part of cutout 'both'), 'soft' (translucent), 'add' (light)
    const material = (kind) => {
      const cut = kind === 'cut' || kind === 'core';
      return new THREE.ShaderMaterial({
        uniforms: cut ? { ...uniforms, uEdge: { value: kind === 'core' ? 0.9 : 0.5 }, uCut: { value: 0.5 } } : uniforms,
        side: THREE.DoubleSide, transparent: !cut, depthWrite: cut, alphaToCoverage: cut, forceSinglePass: true, blending: kind === 'add' ? THREE.AdditiveBlending : THREE.NormalBlending, fog: false,
        vertexShader: /* glsl */`
          uniform vec4 uUv; uniform vec3 uSway; uniform float uTime, uMirror; varying vec2 vUv; varying float vDist;
          void main() {
            vec2 u = uv; if (uMirror > 0.5) u.x = 1.0 - u.x;
            vUv = uUv.xy + u * uUv.zw;
            vec3 p = position;
            float k = uv.y * uv.y;
            p.x += sin(uTime * uSway.y + uSway.z + p.y * 0.35) * uSway.x * k;
            vec4 mv = modelViewMatrix * vec4(p, 1.0); vDist = length(mv.xyz);
            gl_Position = projectionMatrix * mv;
          }`,
        fragmentShader: flatFragment(kind, false),
      });
    };
    const kind = o.additive ? 'add' : o.cutout === 'both' ? 'core' : o.cutout ? 'cut' : 'soft', cut = kind === 'cut' || kind === 'core';
    const mesh = new THREE.Mesh(geo, material(kind));
    mesh.name = 'flat';
    if (cut) cutPerPass(mesh);
    if (o.underwater && !cut) mesh.renderOrder = -2; else if (!cut) mesh.renderOrder = 2;
    if (kind === 'core') {                             // the soft parts, drawn over the cut-out as a second layer
      const soft = new THREE.Mesh(geo, material('soft'));
      soft.name = 'flat-soft'; soft.renderOrder = o.underwater ? -2 : 2;
      mesh.add(soft); mesh.userData.soft = soft;
    }
    if (o.at) path.point(o.at[0], o.at[1] ?? 0, o.at[2] ?? 0, mesh.position); else if (o.position) mesh.position.copy(vec3(o.position));
    const s = o.at ? o.at[0] : path.locate(mesh.position.x, mesh.position.z, null, _p).s, d = o.at ? (o.at[1] ?? 0) : path.locate(mesh.position.x, mesh.position.z, null, _p).d;
    if (face === 'camera') { ctx.onUpdate(() => { const c = shared.uCameraPos.value; mesh.getWorldPosition(_v); mesh.rotation.y = Math.atan2(c.x - _v.x, c.z - _v.z) - group.rotation.y; }); }
    else if (face === 'up') { mesh.rotation.order = 'YXZ'; mesh.rotation.set(-Math.PI / 2, path.at(s, _p).heading + o.spin, 0); }
    else mesh.rotation.y = kit.faceAngle(face, s, d) + o.spin;
    return ctx.add(mesh);
  };

  /**
   * Load a sheet of several painted props that tools/art.py has sliced (`art.py sheet`). Returns
   *   { texture, cells, row }   cells: as art.py lists them, largest first;  row: the same cells in reading order, left to right
   *                             as they stand in the picture you generated (which is how you will think of them)
   *   a cell: { texture, uv, aspect, px: [w, h], source_box, index }
   * Use one with  kit.flat(sheet.row[2], { height: 3, at: [...] })  (or  kit.flat(sheet.texture, { uv: cell.uv, ... })).
   * A prop must be one connected shape: art.py drops loose bits that stand apart from it.
   */
  kit.sheet = async (url) => {
    const [texture, meta] = await Promise.all([ctx.tex(url), fetch('assets/' + url.replace(/\.\w+$/, '.json')).then((r) => r.json())]);
    const cells = meta.cells.map((c) => ({ ...c, texture }));
    const row = [...cells].sort((a, b) => (a.source_box && b.source_box ? a.source_box[0] - b.source_box[0] : 0));
    return { texture, cells, row };
  };

  /**
   * Many painted flats in ONE draw call: a wood of trees, reeds along a bank, a hundred far lanterns. kit.flat costs a
   * draw call each (two, with the reflection), so anything repeated more than a few times belongs here.
   *   source                  a texture, or a sheet from kit.sheet (then every item may pick a `cell`)
   *   items: [{ at: [s, d, y] | position: [x, y, z],     where its bottom centre stands
   *             height | width,                           metres (the other follows the picture); default opts.height
   *             cell,                                     with a sheet: an index into sheet.row (default 0), or a cell
   *             uv: [u0, v0, u1, v1],                     or any part of the picture
   *             tint, mirror, phase (of its sway), turn (radians added to a fixed face) }]
   *   opts:
   *     face                  'camera' (default: each turns about the vertical axis to face the rider), 'channel', 'back',
   *                           'along' or a number, as for kit.flat (there is no 'up')
   *     cutout                true (default; they hide each other correctly) or false (soft; they are drawn in the order
   *                           given, so list them far to near);  additive: true for light
   *     height                default height of an item (4)
   *     emissive, tint, opacity, fog, underwater     as for kit.flat, for all of them
   *     sway: {amp, speed}    their tops sway, each with its own phase
   * Returns the Mesh.
   */
  kit.flats = (source, items, opts = {}) => {
    const o = { face: 'camera', cutout: true, additive: false, height: 4, emissive: 1, tint: '#ffffff', opacity: 1, fog: 1, sway: null, underwater: false, ...opts };
    const sheet = source && !source.isTexture ? source : null, texture = sheet ? sheet.texture : source;
    const img = texture.image, iw = texture.userData.width || (img && img.width) || 1024, ih = texture.userData.height || (img && img.height) || 1024, texAspect = texture.userData.aspect || iw / ih;
    const n = items.length, pos = new Float32Array(n * 3), size = new Float32Array(n * 2), uvr = new Float32Array(n * 4), tint = new Float32Array(n * 3), aux = new Float32Array(n * 2), white = col('#ffffff');
    items.forEach((it, i) => {
      const cell = sheet ? (typeof it.cell === 'object' && it.cell ? it.cell : sheet.row[it.cell ?? 0] || sheet.row[0]) : null, uv = it.uv || (cell ? cell.uv : [0, 0, 1, 1]);
      const aspect = texAspect * ((uv[2] - uv[0]) / (uv[3] - uv[1]));
      let w = it.width, h = it.height;
      if (w == null && h == null) h = o.height;
      if (w == null) w = h * aspect; if (h == null) h = w / aspect;
      let s, d;
      if (it.at) { path.point(it.at[0], it.at[1] ?? 0, it.at[2] ?? 0, _v); s = it.at[0]; d = it.at[1] ?? 0; }
      else { _v.copy(vec3(it.position)); const l = path.locate(_v.x, _v.z, null, _p); s = l.s; d = l.d; }
      pos.set([_v.x, _v.y, _v.z], i * 3); size.set([w, h], i * 2);
      uvr.set(it.mirror ? [uv[2], uv[1], uv[0] - uv[2], uv[3] - uv[1]] : [uv[0], uv[1], uv[2] - uv[0], uv[3] - uv[1]], i * 4);
      const c = it.tint ? col(it.tint) : white; tint.set([c.r, c.g, c.b], i * 3);
      aux.set([o.face === 'camera' ? 0 : kit.faceAngle(o.face, s, d) + (it.turn ?? 0), it.phase ?? phase() * 6.283], i * 2);
    });
    const base = new THREE.PlaneGeometry(1, 1, 1, o.sway ? 5 : 1); base.translate(0, 0.5, 0);      // bottom centre at the origin
    const geo = new THREE.InstancedBufferGeometry();
    geo.index = base.index; geo.setAttribute('position', base.attributes.position); geo.setAttribute('uv', base.attributes.uv);
    geo.setAttribute('aPos', new THREE.InstancedBufferAttribute(pos, 3)); geo.setAttribute('aSize', new THREE.InstancedBufferAttribute(size, 2));
    geo.setAttribute('aUv', new THREE.InstancedBufferAttribute(uvr, 4)); geo.setAttribute('aTint', new THREE.InstancedBufferAttribute(tint, 3)); geo.setAttribute('aAux', new THREE.InstancedBufferAttribute(aux, 2));
    geo.instanceCount = n;
    const kind = o.additive ? 'add' : o.cutout ? 'cut' : 'soft', cut = kind === 'cut';
    const mat = new THREE.ShaderMaterial({
      uniforms: { ...sharedUniforms(), map: { value: texture }, uTint: { value: col(o.tint).clone().multiplyScalar(o.emissive) }, uOpacity: { value: o.opacity }, uFogAmount: { value: o.fog },
        uSway: { value: new THREE.Vector2(o.sway ? o.sway.amp : 0, o.sway ? (o.sway.speed ?? 1) : 0) }, uTexSize: { value: new THREE.Vector2(iw, ih) }, ...(cut ? { uEdge: { value: 0.5 }, uCut: { value: 0.5 } } : {}) },
      side: THREE.DoubleSide, transparent: !cut, depthWrite: cut, alphaToCoverage: cut, forceSinglePass: true, blending: kind === 'add' ? THREE.AdditiveBlending : THREE.NormalBlending, fog: false,
      vertexShader: /* glsl */`
        attribute vec3 aPos, aTint; attribute vec2 aSize, aAux; attribute vec4 aUv;
        uniform vec3 uCameraPos; uniform vec2 uSway; uniform float uTime;
        varying vec2 vUv; varying float vDist; varying vec3 vTint;
        void main() {
          vUv = aUv.xy + uv * aUv.zw; vTint = aTint;
          vec3 foot = (modelMatrix * vec4(aPos, 1.0)).xyz;
          float x = position.x * aSize.x + sin(uTime * uSway.y + aAux.y + position.y * aSize.y * 0.35) * uSway.x * uv.y * uv.y;
          float turn = ${o.face === 'camera' ? 'atan(uCameraPos.x - foot.x, uCameraPos.z - foot.z)' : 'aAux.x'};      // about the vertical axis, like rotation.y
          vec4 mv = viewMatrix * vec4(foot + vec3(cos(turn) * x, position.y * aSize.y, -sin(turn) * x), 1.0); vDist = length(mv.xyz);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: flatFragment(kind, true),
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = 'flats'; mesh.frustumCulled = false;
    if (cut) cutPerPass(mesh);
    if (o.underwater && !cut) mesh.renderOrder = -2; else if (!cut) mesh.renderOrder = 2;
    return ctx.add(mesh);
  };

  // ---------------------------------------------------------------------------------------------- glows
  /**
   * One soft additive glow (a lantern's halo, a distant window). It lights nothing (kit.lamp does); it is the halo.
   *   at: [s, d, y] (y defaults to 1) | position: [x, y, z],  color,  size (metres across; the bright core is about a fifth),
   *   intensity (above 1 blooms),  flicker 0..1,  underwater: true for one below the surface
   * Each is a draw call: for more than a handful use kit.glows.
   */
  kit.glow = (opts = {}) => {
    const o = { color: '#ffd9a0', size: 1.2, intensity: 1, flicker: 0, underwater: false, ...opts };
    const m = new THREE.SpriteMaterial({ map: softDisc(), color: col(o.color).clone().multiplyScalar(o.intensity), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false });
    // Light added to the picture must fade to nothing in fog (the stock fog would turn it into a disc of fog colour),
    // so the sprite does its own, by distance, with the same density as everything else.
    m.onBeforeCompile = (shader) => {
      shader.uniforms.uFogDensity = shared.uFogDensity;
      shader.vertexShader = shader.vertexShader.replace('void main() {', 'varying float vGlowDist;\nvoid main() {').replace('#include <fog_vertex>', '#include <fog_vertex>\n\tvGlowDist = length( mvPosition.xyz );');
      shader.fragmentShader = shader.fragmentShader.replace('void main() {', 'uniform float uFogDensity; varying float vGlowDist;\nvoid main() {').replace('#include <fog_fragment>', '#include <fog_fragment>\n\tgl_FragColor.rgb *= exp( - uFogDensity * uFogDensity * vGlowDist * vGlowDist );');
    };
    m.customProgramCacheKey = () => 'kit-glow-2';
    const s = new THREE.Sprite(m); s.scale.setScalar(o.size);
    if (o.at) path.point(o.at[0], o.at[1] ?? 0, o.at[2] ?? 1, s.position); else if (o.position) s.position.copy(vec3(o.position));
    s.renderOrder = o.underwater ? -2 : 3;
    if (o.flicker) { const ph = phase() * 10, base = m.color.clone(); ctx.onUpdate((dt, c) => { const f = 1 - o.flicker * (0.5 + 0.5 * Math.sin(c.time * 7.3 + ph) * Math.sin(c.time * 3.1 + ph * 2)); m.color.copy(base).multiplyScalar(f); }); }
    return ctx.add(s);
  };

  /**
   * Many glowing points at once (fireflies, a field of lanterns seen far away, glowing spores). One draw call.
   *   points: [{x, y, z, size?, color?, phase?}]  local positions (a Vector3 from kit.at will do), size in metres
   *   opts:
   *     color, size, intensity      defaults for the points; intensity above 1 blooms
   *     flicker 0..1, pulse         how deep each one breathes, and how fast
   *     drift                       metres of slow wandering about its place
   *     sizeAttenuation             true (default): sizes are metres, so far glows are small. false: sizes are pixels (on a
   *                                 900 px tall picture) at any distance, for far lights that must stay visible
   *     underwater                  true for glows below the surface, so the water lies over them
   * A glow never grows beyond about 420 pixels and fades out within 3.5 m of the rider: for a big soft light close to the
   * water use kit.glow or an additive kit.flat.
   * Returns { points, material, setPosition(i, x, y, z), setSize(i, s), setColor(i, c) } for moving them in `update`.
   */
  kit.glows = (points, opts = {}) => {
    const o = { color: '#ffd9a0', size: 0.5, intensity: 1.5, flicker: 0.3, pulse: 1, drift: 0, sizeAttenuation: true, underwater: false, ...opts };
    const n = points.length, pos = new Float32Array(n * 3), aux = new Float32Array(n * 2), cols = new Float32Array(n * 3), base = col(o.color);
    points.forEach((p, i) => { pos.set([p.x, p.y, p.z], i * 3); aux.set([p.size ?? o.size, p.phase ?? phase() * 6.283], i * 2); const c = p.color ? col(p.color) : base; cols.set([c.r, c.g, c.b], i * 3); });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('aAux', new THREE.BufferAttribute(aux, 2)); geo.setAttribute('aColor', new THREE.BufferAttribute(cols, 3));
    const mat = new THREE.ShaderMaterial({
      uniforms: { ...sharedUniforms(), uIntensity: { value: o.intensity }, uFlicker: { value: o.flicker }, uPulse: { value: o.pulse }, uDrift: { value: o.drift }, uScale: { value: 1 }, uPixel: { value: 1 } },
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
      vertexShader: /* glsl */`
        attribute vec2 aAux; attribute vec3 aColor; uniform float uTime, uFlicker, uPulse, uDrift, uScale, uPixel; varying vec3 vColor; varying float vDist;
        void main() {
          vec3 p = position;
          float ph = aAux.y;
          p += uDrift * vec3(sin(uTime * 0.31 + ph * 3.1), sin(uTime * 0.23 + ph * 1.7) * 0.6, cos(uTime * 0.27 + ph * 2.3));
          vec4 mv = modelViewMatrix * vec4(p, 1.0); vDist = length(mv.xyz);
          gl_Position = projectionMatrix * mv;
          float f = 1.0 - uFlicker * (0.5 + 0.5 * sin(uTime * uPulse * (1.2 + fract(ph) * 1.3) + ph * 5.0));
          float px = ${o.sizeAttenuation ? 'aAux.x * uScale / max(0.1, -mv.z)' : 'aAux.x * uPixel'};
          vColor = aColor * f * min(1.0, px * px);               // smaller than a pixel: fainter, not a hard bright dot
          gl_PointSize = clamp(px, 1.0, 420.0);
        }`,
      fragmentShader: /* glsl */`
        uniform float uIntensity; ${FOG_PARS} varying vec3 vColor; varying float vDist;
        void main() { float r = length(gl_PointCoord - 0.5) * 2.0; float a = smoothstep(1.0, 0.0, r); a = a * a * (0.35 + 0.65 * smoothstep(0.5, 0.0, r));
          gl_FragColor = vec4(vColor * uIntensity * a * (1.0 - fogAmount(vDist)) * smoothstep(0.8, 3.5, vDist), 1.0); }`,
    });
    const pts = new THREE.Points(geo, mat);
    pts.name = 'glows'; pts.frustumCulled = false; pts.renderOrder = o.underwater ? -2 : 3;
    scalePoints(pts, mat);                              // point size in pixels for a size in metres, in the main picture and in the reflection
    ctx.add(pts);
    return {
      points: pts, material: mat,
      setPosition(i, x, y, z) { geo.attributes.position.setXYZ(i, x, y, z); geo.attributes.position.needsUpdate = true; },
      setSize(i, s) { geo.attributes.aAux.setX(i, s); geo.attributes.aAux.needsUpdate = true; },
      setColor(i, c) { const k = col(c); geo.attributes.aColor.setXYZ(i, k.r, k.g, k.b); geo.attributes.aColor.needsUpdate = true; },
    };
  };

  // ---------------------------------------------------------------------------------------------- particles
  /**
   * An endless field of drifting particles that stays around the rider (petals, snow, ash, dust motes, embers,
   * rain streaks). The motion is computed on the GPU. opts:
   *   count, box: [w, h, d]     how many, and the size of the volume around the rider they fill (they wrap around)
   *   y: [lo, hi]               height range in metres (default [0, h]: from the water up). Keep lo at 0 or above: the
   *                             water does not hide particles that are below it.
   *   velocity: [x, y, z]       drift in m/s (negative y falls)
   *   sway, swaySpeed           sideways wander in metres, and how fast
   *   size                      metres (for 'streak': about a third of the streak's length)
   *   color or colors: []       one colour or a palette picked per particle
   *   shape                     'disc', 'petal' (a tumbling ellipse), 'flake' (a soft round flake), 'streak' (a thin line along
   *                             its motion: rain, sparks), 'mote' (a tiny bright dot)
   *   additive                  true for things that give off light
   *   opacity, twinkle 0..1, intensity (brightness multiplier, above 1 blooms), fadeNear (metres), seed
   * Pale particles vanish against a pale sky: check them against the brightest and the darkest part of the realm.
   */
  kit.particles = (opts = {}) => {
    const o = { count: 400, box: [60, 20, 60], y: null, velocity: [0, -0.4, 0], sway: 0.6, swaySpeed: 0.5, size: 0.08, color: '#ffffff', colors: null, shape: 'disc', additive: false, opacity: 0.9, twinkle: 0, intensity: 1, fadeNear: 1.2, seed: 11, ...opts };
    const n = kit.count(o.count), rnd = ctx.rng(o.seed), seeds = new Float32Array(n * 4), cols = new Float32Array(n * 3), palette = (o.colors || [o.color]).map(col);
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { seeds.set([rnd(), rnd(), rnd(), rnd()], i * 4); const c = palette[Math.floor(rnd() * palette.length)]; cols.set([c.r, c.g, c.b], i * 3); }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 4)); geo.setAttribute('aColor', new THREE.BufferAttribute(cols, 3));
    const ylo = o.y ? o.y[0] : 0, yhi = o.y ? o.y[1] : o.box[1], high = Math.max(0.01, yhi - ylo);
    const shapes = { disc: 0, petal: 1, flake: 2, streak: 3, mote: 4 };
    const mat = new THREE.ShaderMaterial({
      uniforms: { ...sharedUniforms(), uBox: { value: new THREE.Vector3(o.box[0], high, o.box[2]) }, uYLo: { value: ylo }, uVel: { value: vec3(o.velocity).clone() },
        uSway: { value: new THREE.Vector2(o.sway, o.swaySpeed) }, uSize: { value: o.size }, uScale: { value: 1 }, uOpacity: { value: o.opacity }, uTwinkle: { value: o.twinkle }, uIntensity: { value: o.intensity },
        uShape: { value: shapes[o.shape] ?? 0 }, uFadeNear: { value: o.fadeNear }, uEdgeY: { value: Math.min(0.08, 0.6 / high) } },
      transparent: true, depthWrite: false, blending: o.additive ? THREE.AdditiveBlending : THREE.NormalBlending, fog: false,
      vertexShader: /* glsl */`
        attribute vec4 aSeed; attribute vec3 aColor;
        uniform vec3 uBox, uVel, uCameraPos; uniform vec2 uSway; uniform float uTime, uSize, uScale, uYLo, uTwinkle, uShape, uEdgeY;
        varying vec3 vColor; varying float vDist, vSpin, vAlpha, vPx; varying vec2 vAxis;
        void main() {
          vec3 p = aSeed.xyz * uBox + uVel * uTime * (0.7 + 0.6 * aSeed.w);
          p.x += sin(uTime * uSway.y * (0.6 + aSeed.w) + aSeed.x * 40.0) * uSway.x;
          p.z += cos(uTime * uSway.y * (0.5 + aSeed.y) + aSeed.z * 40.0) * uSway.x;
          vec3 c = vec3(uCameraPos.x, uYLo + uBox.y * 0.5, uCameraPos.z);          // the box follows the rider over the water, between fixed heights
          p = mod(p - c + uBox * 0.5, uBox) - uBox * 0.5 + c;
          vec4 mv = viewMatrix * vec4(p, 1.0); vDist = length(mv.xyz);
          gl_Position = projectionMatrix * mv;
          float size = uSize * (0.6 + 0.8 * aSeed.w) * (uShape > 2.5 && uShape < 3.5 ? 3.0 : 1.0);
          float px = size * uScale / max(0.1, -mv.z);
          gl_PointSize = clamp(px, 1.5, 220.0); vPx = gl_PointSize;
          vSpin = uTime * (0.8 + aSeed.y * 2.0) + aSeed.x * 20.0;
          vAlpha = 1.0 - uTwinkle * (0.5 + 0.5 * sin(uTime * (1.0 + aSeed.z * 3.0) + aSeed.w * 30.0));
          vAlpha *= min(1.0, px * px / 2.25);                                    // too far to fill a pixel: fainter, never a bright speck
          // soften at every edge of the box so nothing pops in or out
          vec3 e = abs(p - c) / (uBox * 0.5); float ey = (p.y - uYLo) / uBox.y;
          vAlpha *= (1.0 - smoothstep(0.82, 1.0, max(e.x, e.z))) * smoothstep(0.0, uEdgeY, ey) * (1.0 - smoothstep(1.0 - uEdgeY, 1.0, ey));
          // which way it travels across the picture (streaks lie along this)
          vec4 ahead = projectionMatrix * viewMatrix * vec4(p + normalize(uVel + vec3(0.0, 1e-5, 0.0)) * 0.25, 1.0);
          vec2 dir = (ahead.xy / ahead.w - gl_Position.xy / gl_Position.w) * vec2(projectionMatrix[1][1] / projectionMatrix[0][0], 1.0);
          vAxis = dot(dir, dir) > 1e-10 ? normalize(dir) : vec2(0.0, 1.0);
          vColor = aColor;
        }`,
      fragmentShader: /* glsl */`
        uniform float uOpacity, uIntensity, uShape, uFadeNear; ${FOG_PARS}
        varying vec3 vColor; varying float vDist, vSpin, vAlpha, vPx; varying vec2 vAxis;
        void main() {
          vec2 q = gl_PointCoord - 0.5; float a;
          if (uShape < 0.5) a = smoothstep(0.5, 0.36, length(q));
          else if (uShape < 1.5) { float cs = cos(vSpin), sn = sin(vSpin); vec2 r = vec2(q.x * cs - q.y * sn, q.x * sn + q.y * cs); r.y *= 1.0 + 1.6 * abs(sin(vSpin * 0.7)); a = smoothstep(0.5, 0.38, length(r * vec2(1.0, 1.7))); }
          else if (uShape < 2.5) { float l = length(q) * 2.0; a = smoothstep(1.0, 0.0, l); a *= a; }
          else if (uShape < 3.5) { vec2 ax = vec2(vAxis.x, -vAxis.y);              // point coordinates run downward
            float wide = max(0.9, 0.012 * vPx);                                    // a thin line: about a pixel, a little more when close
            a = smoothstep(wide, wide * 0.25, abs(dot(q, vec2(-ax.y, ax.x))) * vPx) * smoothstep(0.5, 0.1, abs(dot(q, ax))); }
          else { float l = length(q) * 2.0; a = smoothstep(1.0, 0.0, l); a = a * a * a; }
          a *= uOpacity * vAlpha * smoothstep(uFadeNear * 0.4, uFadeNear, vDist);
          if (a < 0.003) discard;
          float f = fogAmount(vDist);
          ${o.additive ? 'gl_FragColor = vec4(vColor * uIntensity * a * (1.0 - f), 1.0);' : 'gl_FragColor = vec4(mix(vColor * uIntensity, uFogColor, f), a);'}
        }`,
    });
    const pts = new THREE.Points(geo, mat);
    pts.name = 'particles'; pts.frustumCulled = false; pts.renderOrder = 4;
    scalePoints(pts, mat);
    return ctx.add(pts);
  };

  // ---------------------------------------------------------------------------------------------- mist and light shafts
  /**
   * Low drifting mist: big soft translucent cards that hang over the water and fade as the boat reaches them.
   *   count, from, to           how many cards, over which stretch of the waterway (default: all of it)
   *   spread                    metres either side of the centreline (default: 1.6 x the channel's half width)
   *   y: [lo, hi]               height of the cards' centres (default [0.2, 2.2]); a card is about 0.4 x `size` tall
   *   size                      metres across (default 22)
   *   color                     default: between the realm's fog colour and the light low in its sky (call kit.sky first);
   *                             it follows the fog when the realm's look changes along the way (lookEnd).
   *                             Give a colour for mist that is lit: moonlit, dawn-lit, glowing
   *   opacity                   of one card (default 0.16); cards overlap, so 40 of them over 150 m veil the far bank
   *   drift                     m/s of slow wandering;  additive: true for luminous vapour;  seed
   */
  kit.mist = (opts = {}) => {
    const o = { count: 40, from: 0, to: path.length, spread: null, y: [0.2, 2.2], size: 22, color: null, opacity: 0.16, drift: 0.25, additive: false, seed: 3, ...opts };
    const n = kit.count(o.count), rnd = ctx.rng(o.seed);
    // No colour given: between the realm's fog and the light low in its sky, so the mist belongs to the scene instead of
    // glowing in it. Worked out in the shader from the fog colour of the moment, so it follows a realm whose look changes.
    const tone = o.color != null ? 'uColor' : hasSky ? 'min(vec3(1.0), mix(uFogColor, uSkyTone, 0.6) * 1.15)' : 'min(vec3(1.0), uFogColor * 2.1 + 0.05)';
    const geo = new THREE.InstancedBufferGeometry(); const base = new THREE.PlaneGeometry(1, 1);
    geo.index = base.index; geo.setAttribute('position', base.attributes.position); geo.setAttribute('uv', base.attributes.uv);
    const off = new Float32Array(n * 4), aux = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const s = o.from + (o.to - o.from) * rnd(), hw = path.at(s, _p).halfWidth, sp = o.spread ?? hw * 1.6;
      path.point(s, (rnd() * 2 - 1) * sp, o.y[0] + (o.y[1] - o.y[0]) * rnd(), _v);
      off.set([_v.x, _v.y, _v.z, o.size * (0.6 + rnd() * 0.9)], i * 4); aux.set([rnd() * 100, 0.6 + rnd() * 0.8, rnd() < 0.5 ? -1 : 1], i * 3);
    }
    geo.setAttribute('aOffset', new THREE.InstancedBufferAttribute(off, 4)); geo.setAttribute('aAux', new THREE.InstancedBufferAttribute(aux, 3));
    geo.instanceCount = n;
    const mat = new THREE.ShaderMaterial({
      uniforms: { ...sharedUniforms(), uColor: { value: col(o.color ?? '#ffffff') }, uSkyTone: { value: skyTone }, uOpacity: { value: o.opacity * Math.sqrt(o.count / n) }, uDrift: { value: o.drift } },     // fewer cards on low quality: each a little denser
      transparent: true, depthWrite: false, blending: o.additive ? THREE.AdditiveBlending : THREE.NormalBlending, fog: false, side: THREE.DoubleSide, forceSinglePass: true,
      vertexShader: /* glsl */`
        attribute vec4 aOffset; attribute vec3 aAux; uniform float uTime, uDrift; varying vec2 vUv; varying float vDist, vSeed;
        void main() {
          vUv = uv; vSeed = aAux.x;
          vec3 c = (modelMatrix * vec4(aOffset.xyz, 1.0)).xyz;
          c.x += sin(uTime * 0.07 * aAux.y + aAux.x) * 6.0 * uDrift * aAux.z; c.z += cos(uTime * 0.05 * aAux.y + aAux.x * 1.3) * 6.0 * uDrift;
          vec4 mv = viewMatrix * vec4(c, 1.0);
          mv.xy += position.xy * vec2(aOffset.w, aOffset.w * 0.42);
          // A card faces the eye and stands at one depth, so it is cut off whole, in one frame, when its middle passes
          // behind the eye, while its far corners are still 12 m and more away and fully drawn: the whole picture lost two
          // per cent of its light in one frame (the reach's nave, found by its critique on 9 November). So a card also
          // fades by its own depth before the eye: whole at 9 m, gone at a metre and a half.
          vDist = min(length(mv.xyz), -mv.z * 1.3);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */`
        uniform vec3 uColor, uSkyTone; uniform float uOpacity, uTime; ${FOG_PARS} ${NOISE_GLSL}
        varying vec2 vUv; varying float vDist, vSeed;
        void main() {
          vec2 q = vUv - 0.5;
          float shape = smoothstep(0.5, 0.0, length(q * vec2(1.0, 1.25)));
          float n = fbm(vUv * 2.6 + vSeed + vec2(uTime * 0.012, 0.0));
          float a = shape * shape * smoothstep(0.2, 0.75, n + shape * 0.35) * uOpacity;
          a *= smoothstep(2.0, 12.0, vDist) * (1.0 - fogAmount(vDist) * 0.85) * (1.0 - uVeil);
          if (a < 0.002) discard;
          vec3 tone = ${tone};
          ${o.additive ? 'gl_FragColor = vec4(tone * a, 1.0);' : 'gl_FragColor = vec4(mix(tone, uFogColor, fogAmount(vDist) * 0.5), a);'}
        }`,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = 'mist'; mesh.frustumCulled = false; mesh.renderOrder = 5;
    return ctx.add(mesh);
  };

  /**
   * Shafts of light: soft additive beams, each a widening cone that hangs from its top. opts:
   *   position: [x, y, z] or at: [s, d, y]     the top of the beam (where the light comes in)
   *   direction: [x, y, z]                     which way the light falls (default [0.15, -1, 0.1])
   *   length, radius, radiusTop                metres; `radius` is at the far end
   *   color, intensity                         additive light: 0.5 suits dusk, use 0.1 to 0.2 in a bright realm or it washes out
   *   count, spread                            several jittered beams, and the metres between them
   *   underwater: true                         for beams under the surface. Otherwise a beam ends softly where it meets the
   *                                            water and its reflection carries it on, so let it reach the water or stop above it.
   * The top of a beam is visible from the boat: start it somewhere that explains it (a gap in a canopy, a window, a cloud).
   * A beam may stand over the channel: as the boat passes through it the beam eases to a soft brightening.
   */
  kit.shafts = (opts = {}) => {
    const o = { direction: [0.15, -1, 0.1], length: 30, radius: 5, radiusTop: 0.8, color: '#ffe9c0', intensity: 0.5, count: 1, spread: 4, underwater: false, seed: 9, ...opts };
    const rnd = ctx.rng(o.seed), holder = new THREE.Group();
    const origin = o.at ? path.point(o.at[0], o.at[1] ?? 0, o.at[2] ?? 20) : vec3(o.position || [0, 20, 0]).clone();
    const dir = vec3(o.direction).clone().normalize();
    const geo = new THREE.CylinderGeometry(1, 1, 1, 32, 6, true); geo.translate(0, -0.5, 0);      // unit beam hanging down from its top
    for (let i = 0; i < o.count; i++) {
      const mat = new THREE.ShaderMaterial({
        uniforms: { ...sharedUniforms(), uColor: { value: col(o.color).clone().multiplyScalar(o.intensity * (0.6 + rnd() * 0.8)) }, uSeed: { value: rnd() * 50 }, uR: { value: new THREE.Vector2(o.radiusTop, o.radius) }, uInside: { value: 0 } },
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, forceSinglePass: true, fog: false,
        vertexShader: /* glsl */`
          uniform vec2 uR; varying vec2 vUv; varying float vWorldY; varying vec3 vN; varying vec3 vView;
          void main() { vUv = uv; float t = -position.y; vec3 p = position; float r = mix(uR.x, uR.y, t); p.xz *= r;
            vWorldY = (modelMatrix * vec4(p, 1.0)).y;
            vec4 mv = modelViewMatrix * vec4(p, 1.0); vN = normalize(normalMatrix * vec3(position.x, 0.0, position.z)); vView = -mv.xyz; gl_Position = projectionMatrix * mv; }`,
        fragmentShader: /* glsl */`
          uniform vec3 uColor; uniform float uSeed, uTime, uInside; ${FOG_PARS}
          varying vec2 vUv; varying float vWorldY; varying vec3 vN; varying vec3 vView;
          void main() {
            float vDist = length(vView);                                                 // worked out per pixel: the beam's long faces are too coarse to carry it, close up
            float facing = abs(dot(normalize(vN), vView / max(vDist, 1e-4)));            // bright through the middle, gone at the silhouette
            float a = pow(facing, 2.6) * smoothstep(0.0, 0.3, vUv.y) * smoothstep(1.0, 0.86, vUv.y);       // soft at the far end, the top and the silhouette
            float th = vUv.x * 6.2831853, t = uTime * 0.05;                              // rays inside the beam: whole numbers of waves, so they meet around the back
            a *= 0.72 + 0.14 * sin(th * 3.0 + uSeed + t) + 0.09 * sin(th * 7.0 + uSeed * 1.7 - t * 1.6) + 0.05 * sin(th * 13.0 + uSeed * 2.9 + t * 2.3);
            a *= smoothstep(1.5, 9.0, vDist) * (1.0 - fogAmount(vDist) * 0.7) * (1.0 - uVeil);
            a *= 1.0 - 0.72 * uInside;                                                   // seen from inside, a beam is a soft brightening, not a white wall
            ${o.underwater ? '' : 'a *= smoothstep(-0.05, 1.4, vWorldY);'}
            gl_FragColor = vec4(uColor * a, 1.0);
          }`,
      });
      const beam = new THREE.Mesh(geo, mat);
      beam.position.copy(origin).add(_v.set((rnd() - 0.5) * o.spread, 0, (rnd() - 0.5) * o.spread));
      beam.scale.set(1, o.length * (0.8 + rnd() * 0.4), 1);
      beam.quaternion.setFromUnitVectors(_s.set(0, -1, 0), dir);
      beam.renderOrder = o.underwater ? -2 : 5; beam.frustumCulled = false;
      const len = beam.scale.y;
      beam.onBeforeRender = (renderer, scene, camera) => {             // how far inside the beam the eye is, for this pass
        _v.setFromMatrixPosition(camera.matrixWorld).sub(_s.setFromMatrixPosition(beam.matrixWorld));
        const t = Math.min(len, Math.max(0, _v.dot(dir))), r = o.radiusTop + (o.radius - o.radiusTop) * (t / len);
        const off = _v.addScaledVector(dir, -t).length();
        mat.uniforms.uInside.value = 1 - smoothstep(r * 0.55, r * 1.25, off); mat.uniformsNeedUpdate = true;
      };
      holder.add(beam);
    }
    holder.name = 'shafts';
    return ctx.add(holder);
  };

  // ---------------------------------------------------------------------------------------------- materials
  /**
   * A matte material for built geometry. It takes the realm's lights (kit.hemi, kit.sun, kit.lamp, the boat's
   * lantern) and the fog; with no light in the realm it is black. opts:
   *   color, map              base colour and/or painted texture (the geometry's own UVs; load a tiling picture with
   *                           ctx.tex(url, { repeat: true }))
   *   triplanar               metres per repeat: lay `map` on from three sides in world space, so the geometry needs no
   *                           UVs and neighbouring pieces match. For things that stay put: on a moving object the picture swims.
   *   emissive, emissiveIntensity   self-illumination (above 1 it blooms)
   *   caustics                true or { intensity 0.5, scale 0.35 (repeats per metre), speed 0.6, height 4, color }: dancing
   *                           water-light, strongest at the waterline and gone `height` metres above it (and 1.5 m below).
   *                           It goes by height alone: right on walls, pillars and rocks; on low flat land it would cover the
   *                           whole plain, so give that a `height` under 1 or leave it out.
   *   side                    THREE.FrontSide (default), THREE.DoubleSide, THREE.BackSide
   *   flat                    true for faceted shading
   *   transparent, opacity    a see-through material. Keep such a thing wholly above the water or wholly below it (then
   *                           set its renderOrder to -2): one that crosses the surface is drawn over the water.
   */
  kit.painted = (opts = {}) => {
    const o = { color: '#ffffff', map: null, triplanar: 0, emissive: '#000000', emissiveIntensity: 1, caustics: null, side: THREE.FrontSide, flat: false, transparent: false, opacity: 1, ...opts };
    const tri = o.triplanar && o.map ? o.triplanar : 0;     // triplanar without a picture means nothing
    const mat = new THREE.MeshLambertMaterial({ color: col(o.color), map: tri ? null : o.map, emissive: col(o.emissive), emissiveIntensity: o.emissiveIntensity, side: o.side, flatShading: o.flat, transparent: o.transparent, opacity: o.opacity });
    const ca = o.caustics ? { intensity: 0.5, scale: 0.35, speed: 0.6, height: 4, color: '#bfe6ff', ...(o.caustics === true ? {} : o.caustics) } : null;
    if (tri || ca) {
      if (tri) { o.map.wrapS = o.map.wrapT = THREE.RepeatWrapping; o.map.needsUpdate = true; }
      mat.onBeforeCompile = (shader) => {
        shader.uniforms.uTime = shared.uTime;
        if (tri) { shader.uniforms.tTri = { value: o.map }; shader.uniforms.uTriScale = { value: 1 / tri }; }
        if (ca) { shader.uniforms.tCaustic = { value: causticTexture() }; shader.uniforms.uCaustic = { value: new THREE.Vector4(ca.intensity, ca.scale, ca.speed, ca.height) }; shader.uniforms.uCausticColor = { value: col(ca.color) }; }
        shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWPos; varying vec3 vWNormal;')
          .replace('#include <fog_vertex>', `#include <fog_vertex>
            { vec4 wp = vec4(transformed, 1.0); vec3 wn = objectNormal;
              #ifdef USE_INSTANCING
                wp = instanceMatrix * wp; wn = mat3(instanceMatrix) * wn;
              #endif
              vWPos = (modelMatrix * wp).xyz; vWNormal = normalize(mat3(modelMatrix) * wn); }`);
        let frag = shader.fragmentShader.replace('#include <common>', `#include <common>
          varying vec3 vWPos; varying vec3 vWNormal; uniform float uTime;
          ${tri ? 'uniform sampler2D tTri; uniform float uTriScale;' : ''}
          ${ca ? `uniform vec4 uCaustic; uniform vec3 uCausticColor; uniform sampler2D tCaustic;
          // two copies of the caustic web sliding across each other: the threads of both show, brightest where they
          // cross, the light seems to dance, and no repeat shows because their sizes never line up
          float causticAt(vec2 uv, float t) {
            float a = texture2D(tCaustic, uv + vec2(t * 0.20, t * 0.124)).r, b = texture2D(tCaustic, uv * 0.73 + vec2(-t * 0.172, t * 0.228) + 0.37).r;
            a *= a * 4.0; b *= b * 4.0;
            return max(a, b) * 0.5 + min(a, b) * 1.2; }` : ''}`);
        if (tri) frag = frag.replace('#include <map_fragment>', `
          { vec3 bw = pow(abs(normalize(vWNormal)), vec3(4.0)); bw /= (bw.x + bw.y + bw.z);
            vec3 tp = vWPos * uTriScale;
            vec4 tx = texture2D(tTri, tp.zy), ty = texture2D(tTri, tp.xz), tz = texture2D(tTri, tp.xy);
            diffuseColor *= tx * bw.x + ty * bw.y + tz * bw.z; }`);
        if (ca) frag = frag.replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
          { float band = smoothstep(uCaustic.w, 0.0, vWPos.y) * smoothstep(-1.5, 0.1, vWPos.y);
            vec3 cw = pow(abs(normalize(vWNormal)), vec3(4.0)); cw /= (cw.x + cw.y + cw.z);       // from three sides, blended: no seams, no stretching
            vec3 cq = vWPos * uCaustic.y; float ct = uTime * uCaustic.z;
            float cst = causticAt(cq.zy, ct) * cw.x + causticAt(cq.xz, ct) * cw.y + causticAt(cq.xy, ct) * cw.z;
            totalEmissiveRadiance += uCausticColor * min(cst, 4.0) * uCaustic.x * band; }`);
        shader.fragmentShader = frag;
      };
      mat.customProgramCacheKey = () => `painted|${tri ? 'tri' : ''}|${ca ? 'ca2' : ''}`;
    }
    return mat;
  };

  /**
   * The ride's gouache material for built geometry (src/engine/gouache.js, where its options are listed: color, map,
   * triplanar, brush, shade, steps, emissive, caustics, backlight, sway, side, flat, vertexColors, cutout, transparent).
   * Matte paint in flat dry-brushed steps of light. It answers to the realm's `look.light` (one key light, a shadow
   * colour and a lit colour, sky and ground light), to the boat's lantern and to the realm's kept lamp. It does NOT
   * take kit.hemi, kit.sun or kit.lamp: those light kit.painted and three.js's own materials. Pick one of the two
   * for a realm's built things, or they will not sit in the same light.
   */
  kit.gouache = (opts = {}) => gouacheLib.makeGouache(engine, opts);

  /**
   * Many copies of one geometry in one draw call. transforms: [{ position: [x, y, z] | Vector3, rotation: [x, y, z] |
   * number (about the vertical axis), scale: number | [x, y, z], color }]. A `color` multiplies the material's own, so
   * give the material a pale colour when the copies are to differ. Returns the InstancedMesh.
   */
  kit.instances = (geometry, material, transforms) => {
    const mesh = new THREE.InstancedMesh(geometry, material, transforms.length);
    let colored = false;
    transforms.forEach((t, i) => {
      const p = vec3(t.position);
      const r = t.rotation == null ? [0, 0, 0] : typeof t.rotation === 'number' ? [0, t.rotation, 0] : t.rotation;
      const sc = t.scale == null ? [1, 1, 1] : typeof t.scale === 'number' ? [t.scale, t.scale, t.scale] : t.scale;
      _m.compose(p, _q.setFromEuler(_e.set(r[0], r[1], r[2])), _s.set(sc[0], sc[1], sc[2]));
      mesh.setMatrixAt(i, _m);
      if (t.color) { mesh.setColorAt(i, col(t.color)); colored = true; }
    });
    mesh.instanceMatrix.needsUpdate = true; if (colored) mesh.instanceColor.needsUpdate = true;
    mesh.frustumCulled = false;
    return ctx.add(mesh);
  };

  // ---------------------------------------------------------------------------------------------- banks and land
  /**
   * Land along the edge of the channel: a ribbon that follows the waterway. The cross-section `profile` is a list of
   * [out, y] points, where `out` is metres outward from the channel edge (negative reaches under the water toward the
   * middle) and y is height. Example, a low shore rising to a field:  [[-3, -1.2], [0, 0.05], [2, 0.5], [12, 1.2], [90, 3]]
   *   side                 'left' | 'right' | 'both' (default)
   *   from, to, step       the stretch of waterway (default all of it) and the metres between cross-sections (3)
   *   profile              start under the water (or the edge of the land hangs in the air) and keep the first metre and a
   *                        half past the edge low: the bow reaches that far when the boat noses into a bank
   *   material             default: a dark kit.painted. Its `map` is laid along the shore (see uvScale)
   *   roughness            metres of unevenness along the shore;  heightNoise: metres, of the land's height
   *   uvScale              metres per texture repeat;  seed
   * Far from the water the land follows the broad sweep of the waterway, so it does not fold over itself on the inside
   * of ordinary bends. It cannot reach further into the inside of a tight bend than there is room: there, keep `out`
   * below the bend's radius. Several banks with different profiles can follow one another along the path.
   * Returns the Mesh (or a Group of two for 'both').
   */
  kit.bank = (opts = {}) => {
    const o = { side: 'both', from: 0, to: path.length, step: 3, profile: [[-3, -1.2], [0, 0.05], [3, 0.6], [14, 1.4], [80, 3]], material: null, roughness: 1.2, heightNoise: 0.35, uvScale: 8, seed: 2, ...opts };
    if (o.side === 'both') { const g = new THREE.Group(); g.add(kit.bank({ ...o, side: 'left' }), kit.bank({ ...o, side: 'right', seed: o.seed + 17 })); return ctx.add(g); }
    const side = o.side === 'left' ? -1 : 1, rows = Math.max(2, Math.ceil((o.to - o.from) / o.step) + 1), cols = o.profile.length;
    const pos = new Float32Array(rows * cols * 3), uvs = new Float32Array(rows * cols * 2), idx = [];
    for (let r = 0; r < rows; r++) {
      const s = Math.min(o.to, o.from + r * o.step), p = path.at(s, _p), px = p.x, pz = p.z, rx = p.rx, rz = p.rz, hw = p.halfWidth;
      for (let c = 0; c < cols; c++) {
        const [out, y] = o.profile[c];
        const wob = o.roughness * (fbm2(s * 0.06 + c * 3.7, side * 9.1 + c, 3, o.seed) - 0.5) * 2 * Math.min(1, 0.35 + Math.abs(out) * 0.12);
        const reach = out + wob;
        // Land far from the water follows the broad sweep of the waterway, not its every bend: its sideways direction
        // is averaged over a stretch of path that grows with the distance. Straight out from each point of the
        // channel, rows would cross each other on the inside of every bend and the land would fold over itself.
        let ax = rx, az = rz;
        if (reach > 0) {
          ax = 0; az = 0;
          for (let j = -4; j <= 4; j++) { const q = path.at(s + reach * 1.5 * j / 4, _p); ax += q.rx; az += q.rz; }
          ax /= 9; az /= 9;
          const t = Math.min(1, Math.max(0, (0.7 - (ax * rx + az * rz)) / 0.4)), m = t * t * (3 - 2 * t);     // a turn too sharp to average: fall back to straight out
          ax += (rx - ax) * m; az += (rz - az) * m;
        }
        const yy = y + (y > 0.02 ? o.heightNoise * (fbm2(s * 0.09 + 11, c * 2.3, 3, o.seed + 5) - 0.5) * 2 * Math.min(1, Math.abs(out) * 0.2) : 0);
        const i = r * cols + c;
        pos.set([px + side * (rx * hw + ax * reach), yy, pz + side * (rz * hw + az * reach)], i * 3); uvs.set([s / o.uvScale, reach / o.uvScale], i * 2);
      }
    }
    for (let r = 0; r < rows - 1; r++) for (let c = 0; c < cols - 1; c++) {
      const a = r * cols + c, b = a + 1, d = a + cols, e = d + 1;
      if (side > 0) idx.push(a, b, d, b, e, d); else idx.push(a, d, b, b, d, e);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2)); geo.setIndex(idx); geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, o.material || kit.painted({ color: '#2a2f3a' }));
    if (mesh.material.map) { const t = mesh.material.map; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.needsUpdate = true; }      // its uv runs far past 1
    mesh.name = 'bank'; mesh.frustumCulled = false;
    return ctx.add(mesh);
  };

  /**
   * An island or rock rising from the water: a radial version of kit.bank. `profile` is [r, y] pairs from the centre
   * outward, e.g. [[0, 2.2], [3, 1.6], [5, 0.3], [7, -1.5]] (end it under the water). opts:
   *   position: [x, z] or at: [s, d]     its centre
   *   profile, material, roughness (metres of unevenness), segments (around), seed
   *   collide                            true (default): the boat steers around it. The collider is 1.2 m wider than the
   *                                      island's waterline, because the boat's bow reaches further than the circle that
   *                                      stands for the boat; a number: that radius instead; false: none
   * Returns the Mesh (its collider, if any, is mesh.userData.collider).
   */
  kit.island = (opts = {}) => {
    const o = { profile: [[0, 2], [3, 1.4], [5, 0.2], [7, -1.5]], roughness: 0.8, segments: 28, collide: true, material: null, seed: 4, ...opts };
    const c = o.at ? path.point(o.at[0], o.at[1] ?? 0, 0) : new THREE.Vector3(o.position[0], 0, o.position[1]);
    const rings = o.profile.length, seg = o.segments, pos = [], uvs = [], idx = [];
    for (let j = 0; j < rings; j++) for (let i = 0; i <= seg; i++) {
      const a = (i % seg) / seg * Math.PI * 2, [r, y] = o.profile[j];
      const wob = j === 0 ? 0 : o.roughness * (fbm2(Math.cos(a) * 1.7 + j * 2.1, Math.sin(a) * 1.7 + j, 3, o.seed) - 0.5) * 2;
      const rr = Math.max(0, r + wob * Math.min(1, r * 0.4)), yy = y + (j === 0 ? 0 : (fbm2(Math.cos(a) * 2.3 + 5, Math.sin(a) * 2.3 + j, 3, o.seed + 9) - 0.5) * o.roughness * 0.6 * (y > 0 ? 1 : 0));
      pos.push(c.x + Math.cos(a) * rr, yy, c.z + Math.sin(a) * rr); uvs.push(Math.cos(a) * rr / 6, Math.sin(a) * rr / 6);
    }
    for (let j = 0; j < rings - 1; j++) for (let i = 0; i < seg; i++) { const a = j * (seg + 1) + i, b = a + 1, d = a + seg + 1, e = d + 1; idx.push(a, b, d, b, e, d); }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); geo.setIndex(idx); geo.computeVertexNormals();
    { // each ring starts and ends on the same spot, and the peak is one spot many times over: share their normals, or the shading shows a seam
      const nrm = geo.attributes.normal, n0 = new THREE.Vector3(), n1 = new THREE.Vector3();
      for (let j = 0; j < rings; j++) {
        const a = j * (seg + 1), peak = o.profile[j][0] === 0;
        if (peak) { n0.set(0, 0, 0); for (let i = 0; i <= seg; i++) n0.add(n1.fromBufferAttribute(nrm, a + i)); n0.normalize(); for (let i = 0; i <= seg; i++) nrm.setXYZ(a + i, n0.x, n0.y, n0.z); }
        else { n0.fromBufferAttribute(nrm, a).add(n1.fromBufferAttribute(nrm, a + seg)).normalize(); nrm.setXYZ(a, n0.x, n0.y, n0.z); nrm.setXYZ(a + seg, n0.x, n0.y, n0.z); }
      }
    }
    const mesh = new THREE.Mesh(geo, o.material || kit.painted({ color: '#2a2f3a' }));
    if (mesh.material.map) { const t = mesh.material.map; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.needsUpdate = true; }
    mesh.name = 'island'; mesh.frustumCulled = false;
    if (o.collide) {                                    // radius where the profile crosses the waterline, plus room for the bow
      let rw = o.profile[o.profile.length - 1][0];
      for (let j = 1; j < rings; j++) { const [r0, y0] = o.profile[j - 1], [r1, y1] = o.profile[j]; if (y0 > 0 && y1 <= 0) { rw = r0 + (r1 - r0) * (y0 / (y0 - y1)); break; } }
      mesh.userData.collider = ctx.addCollider({ x: c.x, z: c.z, r: typeof o.collide === 'number' ? o.collide : rw + 1.2 });
    }
    return ctx.add(mesh);
  };

  // ---------------------------------------------------------------------------------------------- things on the water
  /**
   * Objects floating on the water (lanterns, leaves, ice, paper boats): they bob, turn slowly and drift with the current,
   * and stay within a stretch of the waterway. opts:
   *   count, from, to           how many and where along the path
   *   spread                    0..1 of the channel half width they occupy (default 0.85)
   *   make(i, rnd)              returns a THREE.Object3D for each one (shared geometry and materials are cheap), or pass `geometry` + `material` for one instanced mesh
   *   bob, bobSpeed             metres, and speed
   *   drift                     m/s along the path (they wrap around from `to` back to `from`)
   *   spin                      rad/s
   *   ripple                    0..1: how often they disturb the water
   *   y                         resting height of their origin above the water
   *   avoid                     metres: they ease aside when the boat comes this close
   *   scale: [min, max]         size range of the instanced ones (objects from make() keep the size you gave them)
   * One that reaches `to` starts again at `from`: it sinks away over the last 4 m and grows back over the first 4,
   * so the change is never a pop, but keep both ends out of the rider's eye if you can. They drift straight through
   * islands and colliders: keep `from`..`to` and `spread` clear of them.
   * Returns { items: [{object, s, x, y, z, ...}], mesh } (mesh: the InstancedMesh, when made from geometry + material).
   */
  kit.floaters = (opts = {}) => {
    const o = { count: 30, from: 10, to: path.length - 10, spread: 0.85, make: null, geometry: null, material: null, bob: 0.03, bobSpeed: 1, drift: 0.15, spin: 0.1, ripple: 0.15, y: 0, avoid: 2.2, seed: 21, scale: [1, 1], ...opts };
    const n = o.make ? o.count : kit.count(o.count), rnd = ctx.rng(o.seed), items = [];
    let inst = null;
    if (!o.make) { inst = new THREE.InstancedMesh(o.geometry, o.material, n); inst.frustumCulled = false; ctx.add(inst); }
    for (let i = 0; i < n; i++) {
      const it = { s: o.from + (o.to - o.from) * rnd(), f: (rnd() * 2 - 1) * o.spread, phase: rnd() * 10, rot: rnd() * Math.PI * 2, scale: o.scale[0] + (o.scale[1] - o.scale[0]) * rnd(), push: 0, object: null, timer: rnd() * 6 };
      if (o.make) { it.object = o.make(i, rnd); it.base = it.object.scale.clone(); ctx.add(it.object); }
      items.push(it);
    }
    ctx.onUpdate((dt, c) => {
      const boat = engine.boat, t = c.time;
      for (let i = 0; i < n; i++) {
        const it = items[i];
        it.s += o.drift * dt; if (it.s > o.to) it.s = o.from; if (it.s < o.from) it.s = o.to;
        const p = path.at(it.s, _p), d = (it.f + it.push) * Math.max(0.5, p.halfWidth - 0.8);
        const x = p.x + p.rx * d, z = p.z + p.rz * d;
        const dx = x - boat.x, dz = z - boat.z, dist = Math.hypot(dx, dz);
        if (dist < o.avoid && dist > 0.01) { const side = Math.sign((dx * p.rx + dz * p.rz) || 1); it.push += side * (o.avoid - dist) * 0.25 * dt; }
        else it.push *= Math.exp(-dt * 0.15);
        it.rot += o.spin * dt * (i % 2 ? 1 : -1);
        const y = o.y + Math.sin(t * o.bobSpeed + it.phase) * o.bob + engine.water.heightAt(x, z);
        const e = Math.min(1, Math.max(0, Math.min(it.s - o.from, o.to - it.s) / 4)), k = e * e * (3 - 2 * e);       // small near either end: no pop when it wraps
        if (it.object) { it.object.position.set(x, y, z); it.object.rotation.y = it.rot; it.object.rotation.z = Math.sin(t * o.bobSpeed * 0.8 + it.phase) * 0.04; it.object.scale.copy(it.base).multiplyScalar(k); it.object.visible = k > 0.001; }
        else { _m.compose(_v.set(x, y, z), _q.setFromEuler(_e.set(0, it.rot, Math.sin(t * o.bobSpeed * 0.8 + it.phase) * 0.04)), _s.setScalar(it.scale * k)); inst.setMatrixAt(i, _m); }
        it.x = x; it.z = z; it.y = y;
        if (o.ripple > 0) { it.timer -= dt; if (it.timer <= 0) { it.timer = 3 + 6 * rndK() / o.ripple; if (dist < 60) engine.water.ripple(x, z, 0.25, 0.35); } }
      }
      if (inst) inst.instanceMatrix.needsUpdate = true;
    });
    return { items, mesh: inst };
  };

  /**
   * Rain or drips on the water: rings around the boat. { rate (rings per second within `radius` metres), radius,
   * strength, size }. It draws nothing in the air: for falling rain add kit.particles({ shape: 'streak', ... }).
   */
  kit.rain = ({ rate = 20, radius = 22, strength = 0.35, size = 0.3 } = {}) => {
    let acc = 0;
    ctx.onUpdate((dt) => {
      acc += rate * dt;
      const boat = engine.boat;
      while (acc >= 1) { acc -= 1; const a = rndK() * Math.PI * 2, r = Math.sqrt(rndK()) * radius; engine.water.ripple(boat.x + Math.cos(a) * r, boat.z + Math.sin(a) * r, strength * (0.5 + rndK()), size); }
    });
  };

  // ---------------------------------------------------------------------------------------------- models
  // Hand-made GLB models: props, buildings, trees and creatures modelled in Blender (docs/modelling.md). The work is
  // done in src/engine/models.js, where every option is described. A file is fetched once however often it is used,
  // and freed when the last realm that used it is thrown away. `url` is under assets/ ('models/<area>/<thing>.glb').
  // One placement for all three: { at: [s, d, y] | position: [x, y, z], face: 'channel' | 'back' | 'along' | radians,
  // turn, rotation: [x, y, z], scale }. A model's front is its +Z (Blender's -Y), as for everything the kit places.
  const heldModels = new Set();
  /**
   * One model, dressed in gouache with its vertex paint (pass any kit.gouache option: brush, shade, caustics, backlight,
   * emissive, sway, ...; `materials: { slot: {...} }` for one named material slot; `collide: radius`; `live: true` if
   * the realm moves the whole thing every frame). Resolves to { group, parts, body, materials, set(placement) };
   * `parts` are the file's named objects, and the moving ones (a wheel, a bell) are the realm's to turn.
   * One draw call per mesh in the file, three times a frame; nothing else while it stands still.
   */
  kit.model = (url, opts = {}) => modelsLib.model(engine, ctx, kit, heldModels, url, opts);
  /**
   * The same model many times as instanced meshes: one draw call per material slot however many copies.
   * placements: [{ at | position, face, turn, rotation, scale, tint }, ...]; tint multiplies the model's paint.
   * Resolves to { group, meshes, count, place(i, placement), tint(i, color) }.
   */
  kit.models = (url, placements, opts = {}) => modelsLib.models(engine, ctx, kit, heldModels, url, placements, opts);
  /**
   * A rigged model with its clips: its own skeleton and mixer (advanced by the realm's update), cross-fades between
   * clips. Each call is an independent copy. opts: a placement, gouache options, clip: 'name' to start in, speed, phase.
   * Resolves to { group, clips, play(name, { fade, loop, speed, phase, then, onDone }), pause(), resume(), bones, mixer }.
   */
  kit.animated = (url, opts = {}) => modelsLib.animated(engine, ctx, kit, heldModels, url, opts);
  /** What model files are loaded now: [{ file, kB, triangles, realms, uses, clips }]. */
  kit.modelReport = modelsLib.modelReport;

  return kit;
}
// (imported down here so that the models section above is the only addition to this file; imports are hoisted)
import * as modelsLib from './models.js';
