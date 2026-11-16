// The landing's own light, materials and small makers, shared by every module of the area: published as
// shared.landing. docs/art/landing.md, section 2 ("How 'rimmed with light' is made"), is what it carries out.
//
//   const L = shared.landing;
//   L.at(s, d, y)                 a Vector3 at the page's (s, d, height): kit.at that runs on beyond both ends of the path
//   L.timber({ ... })             paint for piles, boards and posts
//   L.plant({ tall, backlight })  paint for reeds and plants (double sided, vertex colours, the wind)
//   L.ground({ ... })             paint for land and bed
//   L.extend({ rim, soft })       the area's light as a gouache extension, for a model: kit.model(url, { extend: L.extend({ rim: 0.6 }) })
//   L.wind                        the wind's uniform: .value.z is its strength, 0..1 (staging hushes it for the crossing)
//   L.toSun                       a Vector3: the way to the sun now (it sinks from 4.6 to 4.0 degrees along the route)
//   L.sunAt(x, y, z)              0..1: is this place in the sun, or in the shade of the reeds and the cloth
//   L.SCATTER_GLSL, L.uniforms    the forward-scatter rule for everything that flies or drifts (seed, mayflies, wings)
//   L.Geo                         a small triangle-list builder with vertex colours, for things grown in code
//   L.grow(name, geometry, material, list, opts)     many copies in a few draw calls, each chunk culled by its own sphere
//   L.beams(name, items, material)                   many timbers, each a box from one point to another, in one draw call
//   L.standIn(o)                  the engine's stand-in, wearing one of the area's own materials (o.material)
//   L.label(text, x, y, z)        a name above a thing, shown with &labels=1
//
// WHAT THE AREA'S PAINT ADDS TO THE RIDE'S GOUACHE (all three paints, and L.extend):
//   * THE SHADE. The sun is 4.6 degrees up behind reeds 4 m tall: nearly everything low near the right bank is in
//     their shade, or in the shade of the door's nine cloths, behind which the sun stands for the whole left side of
//     the backwater (PLAN.gate.shade: what stands near behind the cloth is lit by it, what stands far is shaded), and
//     only the tops of things, the open fen, the bridge and the last straight are in the sun. The
//     ride's material has one key light and no shadows, so here a small map of how high the shade reaches at every
//     place (made once at load from PLAN.occluder) takes the key light off whatever is below it. This is what gives
//     the area its three values: tea-brown shade, straw half-light, cream light.
//   * THE RIM. An edge of flame cream on whatever stands between the eye and the sun (0.9 on plants and creatures,
//     0.6 on timber), less in the shade and almost none on level things (a deck seen along its length is not an edge).
//   * for plants: BACKLIGHT that grows with height (plumes and blade tips are on fire toward the sun, stems are
//     not), darker feet, a warm tint on whatever stands toward the sun (PLAN.fire: gold, and weak; the sun's bloom
//     itself is a light in the reed bed, set.js), and THE WIND: a travelling lean from the sun's quarter (28 m, 7 s),
//     a shiver, crests a little brighter; `lampless` for the one plant the kept lamp must not light (the lamp tuft);
//   * for timber: where it meets the water, a wet band darker by a third to 0.5 m and a pale dry line above it, and
//     water-light that follows the wake.
//
// Everything made with grow, beams and standIn is named 'standin:<name>', so removeStandIn(ctx, '<name>')
// (src/engine/modules.js) takes it out from another module once the real thing stands.
import * as THREE from 'three';
import { standIn as engineStandIn } from '../../engine/modules.js';
import { at as planAt, frame, C } from './plan.js';

const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _v = new THREE.Vector3(), _s = new THREE.Vector3();
const _x = new THREE.Vector3(), _y = new THREE.Vector3(), _z = new THREE.Vector3(), _a = new THREE.Vector3(), _b = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0);
const params = new URLSearchParams(typeof location !== 'undefined' ? location.search : '');
const col = (c) => (c && c.isColor ? c : new THREE.Color(c ?? '#ffffff'));

/** A triangle list with a colour at every corner: enough for reeds, pads, stones and stand-ins grown in code. */
export class Geo {
  constructor() { this.p = []; this.c = []; }
  /** One triangle; color: one colour, or [ca, cb, cc] for a colour at each corner. */
  tri(a, b, c, color) {
    this.p.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
    const each = Array.isArray(color) ? color : [color, color, color];
    for (const k of each) { const q = col(k); this.c.push(q.r, q.g, q.b); }
    return this;
  }
  quad(a, b, c, d, color) { const k = Array.isArray(color) ? color : [color, color, color, color]; return this.tri(a, b, c, [k[0], k[1], k[2]]).tri(a, c, d, [k[0], k[2], k[3]]); }
  /** A tapering prism of n sides between two points (a stem, a stake, a head). */
  prism(a, b, ra, rb, n, ca, cb = ca, caps = false) {
    _a.fromArray(a); _b.fromArray(b); _y.subVectors(_b, _a).normalize();
    _x.crossVectors(_y, Math.abs(_y.y) > 0.9 ? _z.set(1, 0, 0) : UP).normalize(); _z.crossVectors(_x, _y);
    const ring = (o, r) => Array.from({ length: n }, (_, i) => { const t = i / n * Math.PI * 2; return [o.x + (_x.x * Math.cos(t) + _z.x * Math.sin(t)) * r, o.y + (_x.y * Math.cos(t) + _z.y * Math.sin(t)) * r, o.z + (_x.z * Math.cos(t) + _z.z * Math.sin(t)) * r]; });
    const A = ring(_a, ra), B = ring(_b, rb);
    for (let i = 0; i < n; i++) { const j = (i + 1) % n; this.quad(A[i], A[j], B[j], B[i], [ca, ca, cb, cb]); }
    if (caps) for (let i = 1; i < n - 1; i++) { this.tri(B[0], B[i], B[i + 1], cb); this.tri(A[0], A[i + 1], A[i], ca); }
    return this;
  }
  get triangles() { return this.p.length / 9; }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
    g.computeVertexNormals(); g.computeBoundingSphere();
    return g;
  }
}

export async function build(ctx, plan, shared) {
  const { kit, path } = ctx, P = plan, W = P.wind, PL = P.plantLight, PM = P.plantMist;
  const CROWN = Array.isArray(PL.crown) && PL.crown.length === 3 ? PL.crown : [0, 0.85, 1.05];      // [gain, from, to]: the backlight again at a plant's very top
  // ---- the sun: its azimuth is the heading of the last straight, taken from the path (the page: not from a number)
  const sunAz = -path.at(P.sun.headingAt).heading;               // radians to the right of the starting heading
  const sunDir = (elevationDeg, out = new THREE.Vector3()) => { const el = elevationDeg * Math.PI / 180; return out.set(Math.sin(sunAz) * Math.cos(el), Math.sin(el), -Math.cos(sunAz) * Math.cos(el)); };
  const toSun = sunDir(P.sun.elevation);
  { // the page's key light must be this sun, seen from the other end
    const k = P.look.light.key, n = Math.hypot(k[0], k[1], k[2]), dot = -(k[0] * toSun.x + k[1] * toSun.y + k[2] * toSun.z) / n;
    if (dot < Math.cos(1.5 * Math.PI / 180)) console.warn(`landing: look.light.key is ${(Math.acos(Math.min(1, dot)) * 180 / Math.PI).toFixed(1)} degrees off the sun the path gives`);
  }

  // ============================================================================================ the shade
  // How high the shade reaches at every place: from each cell, look toward the sun and keep the greatest of
  // (what stands there) - (distance x the sun's slope). One byte a cell, 1.6 m cells, made once.
  const SH = { x0: -72, z0: -166, cell: 1.6, nx: 104, nz: 138, top: 12 };
  const shadeData = new Uint8Array(SH.nx * SH.nz);
  {
    const occ = new Float32Array(SH.nx * SH.nz), CS = P.gate.shade;
    const slope = Math.tan((P.sun.elevation + P.sun.elevationEnd) / 2 * Math.PI / 180), sx = Math.sin(sunAz), sz = -Math.cos(sunAz), step = SH.cell * 0.75;
    const ease = (a, b, x) => { const k = Math.min(1, Math.max(0, (x - a) / (b - a))); return k * k * (3 - 2 * k); };
    for (let j = 0; j < SH.nz; j++) for (let i = 0; i < SH.nx; i++) {
      const x = SH.x0 + (i + 0.5) * SH.cell, z = SH.z0 + (j + 0.5) * SH.cell;
      occ[j * SH.nx + i] = P.occluder(path, x, z);
    }
    // (the nine cloths, exactly: where the line from a place to the sun crosses the door's own plane. As first made the
    // cloth was a row of marked cells that a ray's samples, 1.2 m apart, could step over where two cells met corner to
    // corner: single cells of full sun inside the cloth's shade, one of them on mooring post M2 (2-heroes-mooring.md))
    const gf = frame(path, P.gate.s, {}), gAlong = sx * gf.tx + sz * gf.tz, gAcross = sx * gf.rx + sz * gf.rz;
    for (let j = 0; j < SH.nz; j++) for (let i = 0; i < SH.nx; i++) {
      let H = 0;
      for (let t = step; t * slope < 9.5; t += step) {
        const u = Math.floor(i + 0.5 + sx * t / SH.cell), v = Math.floor(j + 0.5 + sz * t / SH.cell), out = u < 0 || v < 0 || u >= SH.nx || v >= SH.nz;
        const h = (out ? 4.2 : occ[v * SH.nx + u]) - t * slope;      // beyond the map the reed runs on
        if (h > H) H = h;
      }
      // the nine cloths: a lit sheet to what stands near behind them, a shade to what stands far (PLAN.gate.shade)
      if (CS && gAlong > 0.05) {
        const x = SH.x0 + (i + 0.5) * SH.cell, z = SH.z0 + (j + 0.5) * SH.cell, go = (x - gf.x) * gf.tx + (z - gf.z) * gf.tz, gd = (x - gf.x) * gf.rx + (z - gf.z) * gf.rz;
        if (go < 0) {
          const t = -go / gAlong, across = Math.abs(gd + gAcross * t);
          // (its edge: soft over the last 1.5 m before the masts, so that the shade's long side, forty metres back at the mooring, is not a ruled line)
          const h = (CS.height - t * slope) * ease(CS.from, CS.to, t) * (1 - ease(P.gate.mast - 1.5, P.gate.mast + 0.3, across));
          if (h > H) H = h;
        }
      }
      shadeData[j * SH.nx + i] = Math.round(Math.min(1, H / SH.top) * 255);
    }
  }
  // (developer: &shademap=1 writes the map to .shots/landing_shade.json: docs/build/landing/shade.py draws it)
  if (params.has('shademap')) fetch('/__shot/landing_shade.json', { method: 'POST', body: JSON.stringify({ ...SH, data: Array.from(shadeData) }) }).catch(() => {});
  const shadeMap = new THREE.DataTexture(shadeData, SH.nx, SH.nz, THREE.RedFormat);
  shadeMap.minFilter = shadeMap.magFilter = THREE.LinearFilter; shadeMap.wrapS = shadeMap.wrapT = THREE.ClampToEdgeWrapping; shadeMap.needsUpdate = true;
  const shadeAt = (x, z) => { const i = Math.min(SH.nx - 1, Math.max(0, Math.floor((x - SH.x0) / SH.cell))), j = Math.min(SH.nz - 1, Math.max(0, Math.floor((z - SH.z0) / SH.cell))); return shadeData[j * SH.nx + i] / 255 * SH.top; };

  const uniforms = {
    uLSun: { value: toSun },                                                             // the way TO the sun
    uLWind: { value: new THREE.Vector4(-Math.sin(sunAz), Math.cos(sunAz), 1, 0) },       // xy: the way the wind travels (x, z); z: its strength
    tLShade: { value: shadeMap }, uLShadeRect: { value: new THREE.Vector4(SH.x0, SH.z0, 1 / (SH.nx * SH.cell), 1 / (SH.nz * SH.cell)) },
    uLCream: { value: col(C.cream) },
    uLFire: { value: new THREE.Vector3(P.fire.wide, P.fire.mid, P.fire.heart) },             // the sun's fire in the reeds: three lobes
  };

  // ============================================================================================ the area's extensions
  // (each is a gouache `extend`: src/engine/gouache.js. The fragment `light` hook runs after the ride's own light:
  // c is the lit colour; albedo, N, V, shade, ambient are the material's own.)
  /**
   * The shade and the rim. rim: its strength; soft: metres over which the edge of the shade falls on a thing (plants:
   * 1.2); sun: how much of the sun the thing takes where the map says it is in the sun (1; 0 for a thing that is
   * always in shade: the lamp tuft); under: true for solid things whose undersides must be out of the sun (the ride's
   * key light is wrapped, so a sun 4.6 degrees up half-lights the underside of a deck: under the bridge the boards
   * came out paler than the slots of sky between them).
   */
  const base = (rim, soft, sun = 1, under = false) => ({
    uniforms: { tLShade: uniforms.tLShade, uLShadeRect: uniforms.uLShadeRect, uLCream: uniforms.uLCream, uLRim: { value: new THREE.Vector3(rim, soft, sun) } },
    fragmentPars: /* glsl */`
      uniform sampler2D tLShade; uniform vec4 uLShadeRect; uniform vec3 uLCream; uniform vec3 uLRim;
      float landingSun(vec3 p, float soft) { float H = texture2D(tLShade, (p.xz - uLShadeRect.xy) * uLShadeRect.zw).r * ${SH.top.toFixed(1)}; return smoothstep(H - soft, H + 0.3, p.y); }
      float lHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float lNoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(lHash(i), lHash(i + vec2(1.0, 0.0)), f.x), mix(lHash(i + vec2(0.0, 1.0)), lHash(i + vec2(1.0, 1.0)), f.x), f.y); }`,
    light: /* glsl */`
      float lSun = landingSun(vWPos, uLRim.y) * uLRim.z${under ? ' * smoothstep(-0.75, -0.2, N.y)' : ''};
      { vec3 lKey = albedo * mix(vec3(1.0), shade, uShade), lDark = albedo * mix(vec3(1.0), uRampShadow, uShade);
        c += (lDark - lKey) * (1.0 - lSun);
        float lEdge = pow(1.0 - clamp(abs(dot(N, V)), 0.0, 1.0), 3.0) * smoothstep(-0.25, 0.65, dot(V, uKeyDir));
        c += uLCream * lEdge * uLRim.x * (0.3 + 0.7 * albedo) * mix(0.4, 1.0, lSun) * (1.0 - 0.8 * smoothstep(0.5, 0.95, N.y)); }`,
  });
  const glsl3 = (v, d) => { const a = Array.isArray(v) && v.length === 3 ? v : d; return `vec3(${a.map((x) => (+x).toFixed(3)).join(', ')})`; };
  /** Plants: the wind, darker feet, and backlight that grows with height. */
  const plantExt = (tall, backlight, sway, rooted, fire) => ({
    uniforms: { uLWind: uniforms.uLWind, uLFire: uniforms.uLFire, uLPlant: { value: new THREE.Vector4(tall, backlight, sway, fire) } },
    vertexPars: /* glsl */`uniform vec4 uLWind, uLPlant; varying float vLCrest, vLH;`,
    vertexWorld: (rooted === 'world' ? /* glsl */`
      vec2 lRoot = wp.xz; float lJit = 0.0;` : /* glsl */`
      #ifdef USE_INSTANCING
        vec2 lRoot = (modelMatrix * vec4(instanceMatrix[3].xyz, 1.0)).xz;
      #else
        vec2 lRoot = modelMatrix[3].xz;
      #endif
      float lJit = fract(sin(dot(lRoot, vec2(12.9898, 78.233))) * 43758.5453);`) + /* glsl */`
      float lCrest = 0.5 + 0.5 * sin(dot(lRoot, uLWind.xy) * ${(2 * Math.PI / W.length).toFixed(4)} - uTime * ${(2 * Math.PI / W.period).toFixed(4)} + lJit * 0.8);
      float lH = clamp(wp.y / uLPlant.x, 0.0, 1.25), lW = uLWind.z * uLPlant.z;
      wp.xz += uLWind.xy * ((0.24 + 0.76 * lCrest) * ${W.lean.toFixed(3)} * min(1.0, uLPlant.x / 4.2) * lW * lH * lH)
             + vec2(sin(uTime * 8.17 + lJit * 40.0), cos(uTime * 7.31 + lJit * 31.0)) * (${W.shiver.toFixed(3)} * lH * lW);
      vLH = lH; vLCrest = lCrest * smoothstep(0.55, 1.0, lH) * lW;`,
    fragmentPars: /* glsl */`uniform vec4 uLPlant; uniform vec3 uLFire; varying float vLCrest, vLH;`,
    albedo: /* glsl */`albedo *= mix(${PL.feet[0].toFixed(3)}, 1.0, smoothstep(${PL.feet[1].toFixed(3)}, ${PL.feet[2].toFixed(3)}, vLH));`,
    light: /* glsl */`
      { float lThrough = pow(max(dot(V, uKeyDir), 0.0), 2.5) * (0.35 + 0.65 * abs(dot(N, uKeyDir)));
        // (PLAN.plantLight.crown, third holder: the very top of a plant, its plume or its blade tips, takes the backlight
        // again by that much: a plume is down and hair, the thinnest thing on the stem, and against a sky of 0.5 it must
        // stand above the sky to be alight; as it was, every plume was a khaki blot a step DARKER than the sky behind it)
        c += albedo * uLCream * lThrough * uLPlant.y * mix(${PL.glow[0].toFixed(3)}, 1.0, smoothstep(${PL.glow[1].toFixed(3)}, ${PL.glow[2].toFixed(3)}, vLH)) * (1.0 + ${(+CROWN[0]).toFixed(3)} * smoothstep(${(+CROWN[1]).toFixed(3)}, ${(+CROWN[2]).toFixed(3)}, vLH)) * mix(0.3, 1.0, lSun);
        // the fire in the reeds: within about fifteen degrees of the sun, what stands in front of it burns (the sun's
        // own spot is hidden wherever the bed is deep, so its fire has to be in the reeds themselves)
        // (only the blades that face the light take it: the fire is streaks between dark stems, not a haze)
        // Three lobes about the sun (uLFire: their strengths; PLAN.fire). They are GOLD, and only the innermost is pale:
        // as first laid out the two outer ones were cream and strong, and the sun in the reeds was a bank of white fog
        // in which the reeds were lost (1-layout.md).
        float lToSun = max(dot(V, uKeyDir), 0.0), lFace = abs(dot(N, uKeyDir));
        // within about fourteen degrees: honey on the blades that face the light, streaks between dark stems
        c += ${glsl3(P.fire.wideColor, [1.0, 0.68, 0.26])} * pow(lToSun, 24.0) * uLPlant.y * uLPlant.w * pow(lFace, 3.0) * smoothstep(0.25, 0.9, vLH) * mix(0.35, 1.0, lSun) * uLFire.x;
        // within about seven: THE FIRE. Whatever of the bed stands there is GONE INTO GOLD: its own colour gives way to
        // the light that comes through forty metres of reed (PLAN.fire: mid = how bright that gold, take = how much of
        // the reed it takes at the middle, power = how tight the lobe). The front rank's single stems take a tenth of it
        // (fire.stems) and stand dark before it.
        // (Third holder. It was ADDED to the reed's own lit colour, weak: olive plus a little gold is khaki, and from the
        // mooring and the head of the backwater the bank toward the sun was a pale khaki haze with no dark in it and no
        // fire either: .shots/landing_l3_C4_crop.png. Taken out, the bank is a dark mass (.shots/landing_l3_C5_crop.png);
        // mixed toward a saturated gold instead of added, the dark mass has a burning middle.)
        { float lBlaze = pow(lToSun, ${(+(P.fire.power ?? 90)).toFixed(1)}) * smoothstep(0.1, 0.55, vLH) * uLPlant.w * min(1.0, uLPlant.y * 2.0);
          c = mix(c, ${glsl3(P.fire.midColor, [1.0, 0.50, 0.10])} * uLFire.y * (0.8 + 0.4 * lFace), clamp(lBlaze * ${(+(P.fire.take ?? 0)).toFixed(3)}, 0.0, 0.96)); }
        // within about three: the heart, where the light comes through everything. This is the sun's bloom in the reeds.
        // It is on the reeds, not behind them, so no stem that crosses it can make it flicker.
        // (third holder: the heart too takes the reed's place, in a paler gold: PLAN.fire.heart is its brightness, heartColor its colour)
        c = mix(c, ${glsl3(P.fire.heartColor, [1.0, 0.45, 0.08])} * uLFire.z, clamp(pow(lToSun, ${(+(P.fire.heartPower ?? 480)).toFixed(1)}) * smoothstep(0.1, 0.55, vLH) * uLPlant.w * min(1.0, uLPlant.y * 2.0) * ${(+(P.fire.take ?? 0)).toFixed(3)}, 0.0, 0.96) * step(0.001, uLFire.z));
        c *= 1.0 + 0.12 * vLCrest; }`,
    // (the gold mist lies on the FAR water: PLAN.plantMist. Plants nearer than about 35 m are spared most of the height
    // fog: at the foot of the near right bank it was a pale band exactly where the bank must be darkest, and taken down
    // for the whole area it left the far fen under the bridge without its haze)
    fog: PM ? /* glsl */`fog = clamp(fog - uHeightFog.x * exp(-max(vWPos.y, 0.0) / max(uHeightFog.y, 0.01)) * smoothstep(4.0, 40.0, dist) * ${(+PM.spare).toFixed(3)} * (1.0 - smoothstep(${(+PM.to[0]).toFixed(1)}, ${(+PM.to[1]).toFixed(1)}, dist)), 0.0, 1.0);` : '',
  });
  // ---- a thin thing that is paint when it is near and a drawn line when it is far: the painter's filter wipes out
  // whatever is thinner than its brush (about 5 pixels), and a reed stem is one pixel wide at 20 m. From `near` metres
  // the thing is marked for the filter to leave alone, wholly from `far` (the mark is the engine's own: CRISP_ALPHA in
  // src/engine/gouache.js; a thing that is crisp at every distance is kit.gouache's `crisp: true`).
  const crispFar = (near, far) => ({
    final: /* glsl */`{ float lK = smoothstep(${near.toFixed(1)}, ${far.toFixed(1)}, dist); if (lK > 0.0) gl_FragColor.a = 0.5 - 1.55 * lK - 13.95 * smoothstep(0.8, 1.0, lK); }`,
  });
  // ---- a thing the kept lamp must not light (the lamp tuft: it is what the lamp is seen AGAINST; lit amber by the
  // lamp three metres off, it was a brown veil and the halo had nothing dark to sit on: 1-layout.md). The ride's
  // gouache has already added the lamp's light; this takes exactly that back.
  const lampless = { light: /* glsl */`c -= albedo * pointLight(uLampPos, uLampColor, uLampRadius, N);` };
  // ---- where timber meets the water (PLAN.waterline), by world height, on every timber that stands in it; no model
  // paints it. From the water up: all that is under the water and the lowest hand above it slimed green-black; the
  // WET BAND, darker by a third and warmer (silver-grey oak goes tea brown when it is wet), its top between 0.36 and
  // 0.52 m and ragged round every pile; then the DRY LINE, a pale band of dried silt, broken here and there.
  const WL = P.waterline || { wet: [0.36, 0.52], tint: [0.72, 0.62, 0.5], slime: [0.6, 0.74, 0.48], slimeTo: 0.16, line: 1 };
  const wlUniforms = { uLWet: { value: new THREE.Vector4(WL.wet[0], WL.wet[1], WL.line, WL.slimeTo) }, uLWetTint: { value: new THREE.Vector3(...WL.tint) }, uLSlime: { value: new THREE.Vector3(...WL.slime) } };
  // (third holder: A LEVEL MEMBER IS WET OR DRY AS A WHOLE. The band goes by each point's own height, which is right
  // round a pile and wrong along a pole, a stringer or a revetment board that lies level near the band's top: there the
  // ragged line ran ALONG the member as a row of scallops (the Mooring's and the Pilings' finding). Where the paint knows
  // which way a member runs (a tile is worn: `grain`), a member that lies level takes the height of its own heart, an
  // even top to the band, and no dry line. The Mooring's `dry` slots can go back into `paint` when they like.)
  const waterlineOf = (grain) => ({
    uniforms: wlUniforms,
    fragmentPars: /* glsl */`uniform vec4 uLWet; uniform vec3 uLWetTint, uLSlime;`,
    albedo: /* glsl */`
      { float lLev = ${grain ? 'vLLevel.x' : '0.0'}, lY = ${grain ? 'mix(vWPos.y, min(vLLevel.y, vWPos.y + 0.12), lLev)' : 'vWPos.y'};
        float lWn = mix((lNoise(vWPos.xz * 9.0) + 0.5 * lNoise(vWPos.xz * 23.0 + 7.0)) / 1.5, 0.5, lLev);
        float lTop = mix(uLWet.x, uLWet.y, lWn);
        albedo = mix(albedo, albedo * uLWetTint, 1.0 - smoothstep(lTop - 0.03, lTop + 0.02, lY));
        albedo = mix(albedo, albedo * uLSlime, 0.85 * (1.0 - smoothstep(0.02, uLWet.w + 0.07 * lWn, lY)));
        float lLine = smoothstep(lTop - 0.005, lTop + 0.025, lY) * (1.0 - smoothstep(lTop + 0.05, lTop + 0.14, lY));
        lLine *= (0.4 + 0.6 * smoothstep(0.3, 0.7, lNoise(vWPos.xz * 31.0 + lY * 9.0))) * (1.0 - lLev);
        albedo = mix(albedo, albedo * 1.2 + vec3(0.04, 0.036, 0.03), lLine * uLWet.z); }`,
  });
  const waterline = waterlineOf(false);

  // ============================================================================================ the three tiles
  // timber, reed and wicker (PLAN.art, PLAN.tiles; page images 4 and 5): each a NEUTRAL detail layer (its mean is 0.5
  // in every channel) laid over a thing's own paint, so a model keeps the colour and value it was painted. What makes
  // it wood and not wallpaper: THE GRAIN RUNS ALONG EVERY MEMBER. A world projection would lay it upright on every
  // standing face (right on a pile, across the grain of a rail, a waling or a revetment board) and one way on every
  // level face (right on one deck, across the boards of the next). So every mesh that wears a tile is given, once,
  // two things at each point (grainGeometry, below): which way its member runs, and where that member's heart is.
  // The shader lays the tile on each facet in that member's own frame (along the grain; across it within the facet),
  // gives every member its own piece of the tile (no figure runs on from one board into the next), and on a CUT END
  // (a facet across the grain: a pile's head, a board's end, the butt of a bundle) paints the end: growth rings and
  // radial checks round the heart for timber, the cut stems for reed.
  const tileOf = (url) => (url ? ctx.tex(url, { repeat: true }).catch((err) => { console.warn(`landing: ${url} did not load (${err && err.message}); painted without it`); return null; }) : Promise.resolve(null));
  const [tTimber, tReed, tWicker] = await Promise.all([tileOf(P.art.timber), tileOf(P.art.reed), tileOf(P.art.wicker)]);
  const greyTile = new THREE.DataTexture(new Uint8Array([188, 188, 188, 255]), 1, 1); greyTile.colorSpace = THREE.SRGBColorSpace; greyTile.needsUpdate = true;
  const TILES = { timber: tTimber || greyTile, reed: tReed || greyTile, wicker: tWicker || greyTile };
  /**
   * A tile over the paint. kind: 'timber' | 'reed' | 'wicker'. o: tile (metres to one repeat across the grain), grain
   * (0..1: how strongly it shows), axis ([x, y, z] in the thing's own space: the way the grain runs, for one welded
   * mass whose members cannot be told apart), through (wicker: light through the weave against the sun).
   */
  const stuff = (kind, o = {}) => {
    const T = (P.tiles && P.tiles[kind]) || { across: 1, along: 1, grain: 1 }, across = o.tile ?? T.across, along = across * T.along / T.across, ax = o.axis;
    return {
      uniforms: {
        tLTile: { value: TILES[kind] || greyTile },
        uLTile: { value: new THREE.Vector4(1 / across, 1 / along, o.grain ?? T.grain, { timber: 1, reed: 2 }[kind] || 0) },
        uLAxis: { value: ax ? new THREE.Vector4(ax[0], ax[1], ax[2], 1) : new THREE.Vector4(0, 0, 1, 0) },
        uLThrough: { value: kind === 'wicker' ? (o.through ?? T.through ?? 0) : 0 },
      },
      vertexPars: /* glsl */`attribute vec4 aLGrain; attribute vec3 aLHeart; varying vec3 vLP, vLHeart; varying vec4 vLG; varying vec2 vLLevel;`,
      // (the thing's own space, in metres: the tile is laid there, so it stays on a thing that is instanced, turned or moved)
      vertexLocal: /* glsl */`
        {
          #ifdef USE_INSTANCING
            mat4 lM = modelMatrix * instanceMatrix; float lSeed = fract(sin(dot(instanceMatrix[3].xyz, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
          #else
            mat4 lM = modelMatrix; float lSeed = 0.0;
          #endif
          vec3 lS = vec3(length(lM[0].xyz), length(lM[1].xyz), length(lM[2].xyz)), lAx = aLGrain.xyz * lS;
          vLP = transformed * lS; vLHeart = aLHeart * lS;
          vLG = vec4(dot(aLGrain.xyz, aLGrain.xyz) > 0.25 ? lAx / max(length(lAx), 1e-6) : vec3(0.0), fract(aLGrain.w + lSeed));
          // (for the waterline: does the member lie level in the world, and how high is its heart)
          vec3 lAw = mat3(lM) * aLGrain.xyz; float lAl = length(lAw);
          vLLevel = vec2(lAl > 1e-5 && dot(aLGrain.xyz, aLGrain.xyz) > 0.25 ? 1.0 - smoothstep(0.2, 0.45, abs(lAw.y) / lAl) : 0.0, (lM * vec4(aLHeart, 1.0)).y);
        }`,
      fragmentPars: /* glsl */`uniform sampler2D tLTile; uniform vec4 uLTile, uLAxis; uniform float uLThrough; varying vec3 vLP, vLHeart; varying vec4 vLG; varying vec2 vLLevel;`,
      albedo: /* glsl */`
        float lGap = 0.0;
        { vec3 lPx = dFdx(vLP), lPy = dFdy(vLP), lNg = cross(lPx, lPy); float lNl = length(lNg); lNg = lNl > 1e-14 ? lNg / lNl : vec3(0.0, 1.0, 0.0);
          // the way the member runs: its own (worked out from the mesh), or one given for the whole thing, or, not known,
          // upright on standing faces and along uLAxis on level ones
          vec3 lA = vLG.xyz; float lKnown = step(0.25, dot(lA, lA));
          if (uLAxis.w > 0.5) { lA = uLAxis.xyz; lKnown = 1.0; } else if (lKnown < 0.5) lA = abs(lNg.y) > 0.7 ? uLAxis.xyz : vec3(0.0, 1.0, 0.0);
          lA = normalize(lA);
          float lCut = smoothstep(0.80, 0.93, abs(dot(lNg, lA))) * lKnown;                   // 1 on a facet across the grain: a cut end
          vec3 lA1 = normalize(cross(lA, abs(lA.y) < 0.9 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0))), lA2 = cross(lA, lA1);
          vec3 lT = lA - lNg * dot(lNg, lA); float lTl = length(lT); lT = lTl > 0.05 ? lT / lTl : lA1;
          vec3 lB = cross(lNg, lT);
          float lR = vLG.w, lFlip = lR > 0.5 ? 1.0 : -1.0;
          vec2 lSc = vec2(uLTile.x * lFlip, uLTile.y);
          vec2 lUV = vec2(dot(vLP, lB), dot(vLP, lT)) * lSc + vec2(lR * 7.31, lR * 3.17);
          vec3 lTex = textureGrad(tLTile, lUV, vec2(dot(lPx, lB), dot(lPx, lT)) * lSc, vec2(dot(lPy, lB), dot(lPy, lT)) * lSc).rgb * 2.0;
          lGap = 1.0 - smoothstep(0.25, 0.6, dot(lTex, vec3(0.3333)));
          if (lCut > 0.0) {
            vec2 lQ = vec2(dot(vLP, lA1), dot(vLP, lA2));
            vec3 lD = vLP - vLHeart; lD -= lA * dot(lD, lA); float lRad = length(lD);
            float lNear = 1.0 - smoothstep(3.0, 8.0, length(vViewPos));
            vec3 lEndC = vec3(0.8);
            if (uLTile.w > 1.5) {
              // reed: the cut ends of the stems, pale rings round dark hollows, packed like a comb
              // (each stem a little off its place in the comb, each of its own thickness and tone: packed true, the comb is a wire screen)
              vec2 q = lQ / 0.014; q.x += 0.5 * floor(q.y); vec2 cell = floor(q); float h = lHash(cell), h2 = lHash(cell + 7.7);
              vec2 f = fract(q) - 0.5 - (vec2(h, h2) - 0.5) * 0.35; float l = length(f) / (0.75 + 0.5 * h2);
              float ring = smoothstep(0.12, 0.22, l) * (1.0 - smoothstep(0.36, 0.5, l));
              lEndC = mix(vec3(0.72), vec3(0.34 + 0.85 * ring) * (0.65 + 0.7 * h), lNear) * (0.85 + 0.3 * lNoise(lQ * 14.0));
            } else if (uLTile.w > 0.5) {
              // timber: growth rings and radial checks round the member's heart, a dark heart; end grain weathers darker
              float n = lNoise(lQ * 9.0 + lR * 40.0);
              float rings = 0.5 + 0.5 * sin((lRad + 0.012 * n) * 285.0);
              float th = atan(dot(lD, lA1), dot(lD, lA2));
              float checks = smoothstep(0.90, 0.985, sin(th * 5.0 + lR * 31.0 + 2.2 * n)) * smoothstep(0.015, 0.06, lRad);
              lEndC = vec3(0.84) * (1.0 - 0.2 * rings * lNear) * (1.0 - 0.55 * checks * lNear) * (1.0 - 0.3 * (1.0 - smoothstep(0.0, 0.035, lRad)) * lNear);
            }
            vec2 lS2 = vec2(uLTile.x) * 2.3;
            lEndC *= mix(vec3(1.0), textureGrad(tLTile, lQ * lS2 + lR * 5.0, vec2(dot(lPx, lA1), dot(lPx, lA2)) * lS2, vec2(dot(lPy, lA1), dot(lPy, lA2)) * lS2).rgb * 2.0, 0.45);
            lTex = mix(lTex, lEndC, lCut); lGap *= 1.0 - lCut;
          }
          albedo *= mix(vec3(1.0), lTex, uLTile.z) * (0.94 + 0.12 * fract(lR * 17.31)); }`,
      // (wicker against the sun: the light comes through the gaps of the weave)
      light: /* glsl */`c += uLCream * (lGap * uLThrough * pow(max(dot(V, uKeyDir), 0.0), 3.0)) * mix(0.3, 1.0, lSun);`,
    };
  };
  /** The reed tile on one great mesh grown in the world's own space (the far reed mass): broad upright strokes. */
  const massReed = (o = {}) => {
    const T = (P.tiles && P.tiles.farReed) || { across: 5.5, along: 9, grain: 0.5 }, across = o.tile ?? T.across;
    return {
      uniforms: { tLMass: { value: TILES.reed }, uLMass: { value: new THREE.Vector3(1 / across, 1 / (across * T.along / T.across), o.grain ?? T.grain) } },
      fragmentPars: /* glsl */`uniform sampler2D tLMass; uniform vec3 uLMass;`,
      albedo: /* glsl */`
        { vec3 lPx = dFdx(vWPos), lPy = dFdy(vWPos); vec2 lH = cross(lPx, lPy).xz; float lHl = length(lH); lH = lHl > 1e-12 ? lH / lHl : vec2(1.0, 0.0);
          vec2 lB = vec2(-lH.y, lH.x);
          albedo *= mix(vec3(1.0), textureGrad(tLMass, vec2(dot(vWPos.xz, lB) * uLMass.x, vWPos.y * uLMass.y), vec2(dot(lPx.xz, lB) * uLMass.x, lPx.y * uLMass.y), vec2(dot(lPy.xz, lB) * uLMass.x, lPy.y * uLMass.y)).rgb * 2.0, uLMass.z); }`,
    };
  };

  /**
   * Which way every member of a mesh runs, and where its heart is: two attributes (aLGrain: xyz the member's own
   * direction, 0 where it has none, w a number of its own; aLHeart: a point on its centre line) for the tile's shader.
   * A member is a piece of the mesh that hangs together (a pile, a board, a rail, a bundle: a model's objects are
   * joined, not welded). Its direction is its longest axis (principal axis of its points), and, where it is bent (a
   * crooked pile, a sagging rail), the direction of its centre line there. A piece with no long axis (a block, a
   * washer, a stone) has none: the shader lays the tile upright on it. Done once per geometry; a few milliseconds.
   */
  const grainGeometry = (g) => {
    if (!g || g.userData.lGrain || !g.attributes || !g.attributes.position) return false;
    g.userData.lGrain = true;
    if (g.attributes.aLGrain) return false;                      // it carries its grain already (a mesh laid from copies of a model that had it)
    const pos = g.attributes.position, n = pos.count, idx = g.index ? g.index.array : null, tris = Math.floor((idx ? idx.length : n) / 3);
    if (!g.boundingBox) g.computeBoundingBox();
    const bb = g.boundingBox.min, X = new Float32Array(n), Y = new Float32Array(n), Z = new Float32Array(n), canon = new Int32Array(n), seen = new Map();
    for (let i = 0; i < n; i++) {                                // points at one place (to a millimetre) are one point
      const x = X[i] = pos.getX(i), y = Y[i] = pos.getY(i), z = Z[i] = pos.getZ(i);
      const key = (Math.round((x - bb.x) * 1000) * 131072 + Math.round((y - bb.y) * 1000)) * 131072 + Math.round((z - bb.z) * 1000);
      const c = seen.get(key);
      if (c === undefined) { seen.set(key, i); canon[i] = i; } else canon[i] = c;
    }
    const parent = Int32Array.from(canon);
    const find = (a) => { while (parent[a] !== a) { parent[a] = parent[parent[a]]; a = parent[a]; } return a; };
    const at = (k) => canon[idx ? idx[k] : k];
    for (let t = 0; t < tris; t++) { const a = find(at(3 * t)), b = find(at(3 * t + 1)); if (a !== b) parent[b] = a; const c = find(at(3 * t + 2)), a2 = find(a); if (a2 !== c) parent[c] = a2; }
    const groups = new Map();
    for (let i = 0; i < n; i++) { const r = find(canon[i]); let list = groups.get(r); if (!list) groups.set(r, list = []); list.push(i); }
    const grain = new Float32Array(n * 4), heart = new Float32Array(n * 3);
    for (const list of groups.values()) {
      const m = list.length; let cx = 0, cy = 0, cz = 0;
      for (const i of list) { cx += X[i]; cy += Y[i]; cz += Z[i]; }
      cx /= m; cy /= m; cz /= m;
      let xx = 0, xy = 0, xz = 0, yy = 0, yz = 0, zz = 0;
      for (const i of list) { const dx = X[i] - cx, dy = Y[i] - cy, dz = Z[i] - cz; xx += dx * dx; xy += dx * dy; xz += dx * dz; yy += dy * dy; yz += dy * dz; zz += dz * dz; }
      let vx = xx >= yy && xx >= zz ? 1 : 0, vy = !vx && yy >= zz ? 1 : 0, vz = vx || vy ? 0 : 1;
      for (let k = 0; k < 32; k++) { const ax = xx * vx + xy * vy + xz * vz, ay = xy * vx + yy * vy + yz * vz, az = xz * vx + yz * vy + zz * vz, l = Math.hypot(ax, ay, az) || 1; vx = ax / l; vy = ay / l; vz = az / l; }
      const l1 = vx * (xx * vx + xy * vy + xz * vz) + vy * (xy * vx + yy * vy + yz * vz) + vz * (xz * vx + yz * vy + zz * vz), tr = xx + yy + zz;
      const known = m >= 4 && tr > 1e-10 && l1 > 0.62 * tr;
      const rnd = Math.abs(Math.sin(cx * 12.9898 + cy * 78.233 + cz * 37.719) * 43758.5453) % 1;
      // a bent member: the centres of its slices along its length, and the way the line through them runs at each
      let slices = null;
      if (known) {
        let t0 = Infinity, t1 = -Infinity; const tt = new Float32Array(m);
        for (let k = 0; k < m; k++) { const i = list[k], t = (X[i] - cx) * vx + (Y[i] - cy) * vy + (Z[i] - cz) * vz; tt[k] = t; if (t < t0) t0 = t; if (t > t1) t1 = t; }
        const len = t1 - t0, K = Math.min(24, Math.max(1, Math.round(len / 0.35)));
        if (K >= 3) {
          const sum = new Float64Array(K * 4), bin = new Int32Array(m);
          for (let k = 0; k < m; k++) { const i = list[k], b = Math.min(K - 1, Math.floor((tt[k] - t0) / len * K)); bin[k] = b; sum[b * 4] += X[i]; sum[b * 4 + 1] += Y[i]; sum[b * 4 + 2] += Z[i]; sum[b * 4 + 3]++; }
          const pts = [];
          for (let b = 0; b < K; b++) if (sum[b * 4 + 3] >= 3) pts.push([sum[b * 4] / sum[b * 4 + 3], sum[b * 4 + 1] / sum[b * 4 + 3], sum[b * 4 + 2] / sum[b * 4 + 3], b]);
          // (only if the line through them really leaves the straight axis: by more than 2 per cent of the length)
          let off = 0;
          for (const p of pts) { const dx = p[0] - cx, dy = p[1] - cy, dz = p[2] - cz, t = dx * vx + dy * vy + dz * vz; off = Math.max(off, Math.hypot(dx - vx * t, dy - vy * t, dz - vz * t)); }
          if (pts.length >= 3 && off > 0.02 * len) {
            const of = new Int32Array(K).fill(-1);
            pts.forEach((p, j) => {
              const a = pts[Math.max(0, j - 1)], b = pts[Math.min(pts.length - 1, j + 1)];
              let dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2]; const l = Math.hypot(dx, dy, dz) || 1; dx /= l; dy /= l; dz /= l;
              // (never far from the straight axis: a slice whose points lie to one side would kink the grain)
              if (dx * vx + dy * vy + dz * vz < 0.9) { dx = vx; dy = vy; dz = vz; }
              p.push(dx, dy, dz); of[p[3]] = j;
            });
            for (let b = 0, last = 0; b < K; b++) { if (of[b] >= 0) last = of[b]; else of[b] = last; }       // an empty slice takes its neighbour's
            slices = { pts, of, bin };
          }
        }
      }
      for (let k = 0; k < m; k++) {
        const i = list[k], p = slices ? slices.pts[slices.of[slices.bin[k]]] : null;
        if (known) { grain[i * 4] = p ? p[4] : vx; grain[i * 4 + 1] = p ? p[5] : vy; grain[i * 4 + 2] = p ? p[6] : vz; }
        grain[i * 4 + 3] = rnd;
        heart[i * 3] = p ? p[0] : cx; heart[i * 3 + 1] = p ? p[1] : cy; heart[i * 3 + 2] = p ? p[2] : cz;
      }
    }
    g.setAttribute('aLGrain', new THREE.BufferAttribute(grain, 4)); g.setAttribute('aLHeart', new THREE.BufferAttribute(heart, 3));
    return true;
  };
  /** Give every mesh under `root` that wears a tile its grain (grainGeometry). Called by itself as the area builds; returns how many were done. */
  const dress = (root = ctx.group) => {
    let done = 0;
    root.traverse((o) => { if (o.isMesh && !o.isSkinnedMesh && o.material && o.material.uniforms && o.material.uniforms.tLTile && grainGeometry(o.geometry)) done++; });
    return done;
  };

  /** Several extensions as ONE (kit.model and kit.gouache take one extension or a flat list: a list inside a list is silently dropped). */
  const merge = (...exts) => {
    const out = { uniforms: {}, defines: {} };
    for (const ex of exts.flat()) {
      if (!ex) continue;
      for (const h of ['vertexPars', 'vertexLocal', 'vertexWorld', 'fragmentPars', 'albedo', 'light', 'fog', 'final']) if (ex[h]) out[h] = (out[h] ? out[h] + '\n' : '') + ex[h];
      Object.assign(out.uniforms, ex.uniforms || {}); Object.assign(out.defines, ex.defines || {});
    }
    return out;
  };

  const L = {
    sunAz, sunDir, toSun, uniforms, wind: uniforms.uLWind, Geo, C,
    at: (s, d = 0, y = 0, out = new THREE.Vector3()) => out.fromArray(planAt(path, s, d, y)),
    frame: (s, out = {}) => frame(path, s, out),
    /** 0..1: is the place in the sun (1), or in the shade of the reeds or the cloth (0)? */
    sunAt: (x, y, z) => { const H = shadeAt(x, z), t = Math.min(1, Math.max(0, (y - H + 0.5) / 0.8)); return t * t * (3 - 2 * t); },
    shadeTop: shadeAt,
    /**
     * The area's light for a model or a material of your own: kit.model(url, { extend: L.extend({ rim: 0.6, under: true }) });
     * kit.gouache({ ..., extend: L.extend() }). opts: rim (0.6), soft (0.5: metres over which the shade's edge falls),
     * sun (1; 0 = always in shade), under (false; true for timber and other solid things: undersides out of the sun).
     */
    // Since stage 2 it also takes: timber | reed | wicker: true (the tile over the thing's own paint, its grain along
    // every member; or { tile, grain, axis, through } for that tile), wet: true (the wet band and the dry line), and
    // tile, grain, axis, through at the top level. It ALWAYS returns one extension, never a list.
    extend: (o = {}) => {
      const b = base(o.rim ?? 0.6, o.soft ?? 0.5, o.sun ?? 1, o.under ?? false), kind = o.timber ? 'timber' : o.reed ? 'reed' : o.wicker ? 'wicker' : null;
      if (!kind && !o.wet) return b;
      const own = kind && typeof o[kind] === 'object' ? o[kind] : {};
      return merge(b, kind ? stuff(kind, { tile: o.tile, grain: o.grain, axis: o.axis, through: o.through, ...own }) : null, o.wet ? waterlineOf(!!kind) : null);
    },
    /**
     * Paint for timber: the `timber` tile with its grain along every beam, the wet band and the dry line, water-light
     * from the wake, undersides out of the sun. opts: rim (0.6), caustics: false for timber that stands away from the
     * water, wet: false for no waterline, grain (0..1: how strongly the tile shows), tile (metres to one repeat across
     * the grain), and any gouache option.
     */
    timber(o = {}) {
      const { caustics, wet, rim = 0.6, soft, sun, under, grain, tile, axis, ...rest } = o;
      return kit.gouache({ color: '#ffffff', ...L.wear('timber', { rim, soft, sun, under, wet: wet !== false, caustics: caustics !== false, grain, tile, axis }), ...rest });
    },
    /**
     * Paint for reeds and plants. opts: tall (the height at which the wind's lean and the backlight are whole),
     * backlight (the page: reeds 0.9, iris 0.5, pads 0.35, reedmace heads 0.3), rim (0.9), wind: false for things
     * that do not sway, rooted: 'world' for one great mesh (the far reed mass), fire (1: how much of the sun's bloom
     * it takes when it stands in front of the sun; 0.2 for wicker), lampless: true for a thing the kept lamp does not
     * light, shaded: true for a thing that is always in shade (the lamp tuft: both), crispFrom: [near, far] for thin
     * stems that are painted when near and drawn as lines from `far` metres (the reed stems: [7, 15]), and any
     * gouache option.
     */
    // (Since stage 2: one great mesh, rooted: 'world', also wears the `reed` tile as broad upright strokes, PLAN.tiles.farReed;
    // reed: false leaves it off, reed: { tile, grain } changes it.)
    plant(o = {}) {
      const { tall = 4.2, backlight = 0.9, rim = 0.9, wind, rooted, lampless: noLamp = false, shaded = false, crispFrom = null, reed, ...rest } = o;
      // (the fire is the reed BED's: what is as tall as a reed takes it whole; the lower plants that stand before the bed
      // (reedmace, iris, sedge, grass) take `fire.low` of it unless they say otherwise, and stay silhouettes against it)
      const fire = o.fire ?? (tall >= 3.6 ? 1 : (P.fire.low ?? 0.3));
      delete rest.fire;
      return kit.gouache({ color: '#ffffff', vertexColors: true, side: THREE.DoubleSide, brush: 0.6,
        // (the single stems of the front rank, the ones drawn as lines from afar (crispFrom), take little of the sun's fire:
        // PLAN.fire.stems. They are what the fire is seen THROUGH: dark stems before a bed that burns behind them. With every
        // reed lit alike the bank toward the sun was one pale straw fog, at any strength: .shots/landing_postcards_l_f1.jpg)
        extend: [base(rim, 1.2, shaded ? 0 : 1), plantExt(tall, backlight, wind === false ? 0 : 1, rooted, fire * (crispFrom ? (P.fire.stems ?? 1) : 1)), rooted === 'world' && reed !== false ? massReed(typeof reed === 'object' ? reed : {}) : null,
          noLamp ? lampless : null, crispFrom ? crispFar(crispFrom[0], crispFrom[1]) : null], ...rest });
    },
    /** Paint for land and bed. */
    ground(o = {}) { const { rim = 0.2, ...rest } = o; return kit.gouache({ color: '#ffffff', vertexColors: true, brush: 0.9, extend: base(rim, 0.6), ...rest }); },
    /**
     * What a MODEL wears (2-light.md): plain gouache options to spread into kit.model, kit.models or kit.gouache:
     *   kit.model(url, { at: [...], ...L.wear('timber') })        materials: { iron: L.wear('plain', { rim: 0.3 }) }
     * kind: 'timber' | 'reed' | 'wicker' | 'plain'. opts: rim, soft, sun, under, wet, caustics, grain, tile.
     */
    wear(kind = 'plain', o = {}) {
      const timber = kind === 'timber', tile = kind === 'timber' || kind === 'reed' || kind === 'wicker';
      const { rim = 0.6, soft = 0.5, sun = 1, under = true, wet = timber, caustics = timber } = o;
      const out = { brush: o.brush ?? (timber ? 0.85 : 0.7), extend: L.extend({ rim, soft, sun, under, wet: !!wet, ...(tile ? { [kind]: true } : {}), tile: o.tile, grain: o.grain, axis: o.axis, through: o.through }) };
      if (caustics) out.caustics = caustics === true ? { ripple: true, base: 0.15, color: '#FFE2A0', height: 4.5, intensity: 0.5 } : caustics;
      return out;
    },
    /**
     * Paint for reed laid in bundles and thatch (the `reed` tile, its stems along every bundle, the cut ends on end
     * faces), and for wickerwork (the `wicker` tile, light through the weave against the sun), on geometry of your own.
     * opts as L.wear (rim, soft, sun, under, grain, tile, axis, through), and any gouache option (vertexColors, side ...).
     */
    reed(o = {}) { const { rim, soft, sun, under, wet, caustics, grain, tile, axis, through, ...rest } = o; return kit.gouache({ color: '#ffffff', ...L.wear('reed', o), ...rest }); },
    wicker(o = {}) { const { rim, soft, sun, under, wet, caustics, grain, tile, axis, through, ...rest } = o; return kit.gouache({ color: '#ffffff', ...L.wear('wicker', o), ...rest }); },
    /**
     * Work out the grain of a model NOW (which way each of its members runs: grainGeometry above). Nothing needs to
     * call it: every mesh that wears a tile is found and done by itself within half a second of being added. Returns
     * what it was given.
     */
    grain(thing) { const root = thing && (thing.isObject3D ? thing : thing.group); if (root) dress(root); return thing; },
    /**
     * The forward-scatter rule (the page, section 2), for the materials of everything that flies or drifts:
     *   vec3 c = landingScatter(normalize(worldPos - uCameraPos));     // give the material L.uniforms.uLSun
     * Dull straw at 0.55, on fire only within about 25 degrees of the sun. This is what keeps the area from glitter.
     */
    SCATTER_GLSL: /* glsl */`
      uniform vec3 uLSun;
      vec3 landingScatter(vec3 fromEye) { return vec3(0.485, 0.378, 0.155) * 0.55 + vec3(1.0, 0.799, 0.392) * 1.1 * pow(max(dot(fromEye, uLSun), 0.0), 6.0); }`,

    /**
     * Many copies of one geometry. list: [{ x, y, z, turn, tiltX, tiltZ, scale: n | [x, y, z], color }]. They are cut into
     * chunks `cell` metres square (default 40; 0 = one chunk), each an InstancedMesh culled by its own sphere.
     * opts: cell, margin (metres the shader may move a copy, default 0.8), mirror: false to leave them out of the water's
     * reflection, front: the name of a number on each item by which a chunk's copies are drawn smallest first. Returns the meshes.
     */
    grow(name, geometry, material, list, o = {}) {
      const cell = o.cell ?? 40, groups = new Map();
      for (const it of list) { const key = cell > 0 ? Math.floor(it.x / cell) + ',' + Math.floor(it.z / cell) : 'all'; let g = groups.get(key); if (!g) groups.set(key, g = []); g.push(it); }
      if (!geometry.boundingSphere) geometry.computeBoundingSphere();
      const reach = geometry.boundingSphere.radius + geometry.boundingSphere.center.length(), meshes = [], white = col('#ffffff'), tinted = list.some((it) => it.color);
      for (const items of groups.values()) {
        // Each chunk stands at its own middle (its copies are placed from there), so that three.js draws the chunks
        // nearest first; and within a chunk the copies keep the order of the list. Give the list nearest-the-water
        // first (opts.front: a number on each item, smaller = drawn sooner): what is hidden behind nearer reeds is
        // then never shaded, which is most of the cost of a reed bed.
        if (o.front) items.sort((a, b) => a[o.front] - b[o.front]);
        const mesh = new THREE.InstancedMesh(geometry, material, items.length), box = new THREE.Box3();
        for (const it of items) box.expandByPoint(_v.set(it.x, it.y ?? 0, it.z));
        const mid = box.getCenter(new THREE.Vector3());
        let big = 1;
        items.forEach((it, i) => {
          const sc = it.scale ?? 1, sx = Array.isArray(sc) ? sc : [sc, sc, sc];
          _e.set(it.tiltX ?? 0, it.turn ?? 0, it.tiltZ ?? 0, 'YXZ');
          _m.compose(_v.set(it.x - mid.x, (it.y ?? 0) - mid.y, it.z - mid.z), _q.setFromEuler(_e), _s.set(sx[0], sx[1], sx[2]));
          mesh.setMatrixAt(i, _m); big = Math.max(big, sx[0], sx[1], sx[2]);
          if (tinted) mesh.setColorAt(i, it.color ? col(it.color) : white);
        });
        mesh.position.copy(mid);
        mesh.instanceMatrix.needsUpdate = true; if (tinted) mesh.instanceColor.needsUpdate = true;
        const sphere = box.getBoundingSphere(new THREE.Sphere()); sphere.center.sub(mid); sphere.radius += reach * big + (o.margin ?? 0.8);
        mesh.boundingSphere = sphere; mesh.frustumCulled = true;
        mesh.name = 'standin:' + name;
        if (o.mirror === false) ctx.only(mesh, 'direct');
        ctx.add(mesh); meshes.push(mesh);
      }
      return meshes;
    },

    /**
     * Timbers: each a box from point a to point b. items: [{ a: [x, y, z], b: [x, y, z], w, h, color, ref }] (w: its
     * width, level where the timber is level; h: its depth; ref: for an upright timber, the way its w side faces).
     * One InstancedMesh, one draw call.
     */
    beams(name, items, material) {
      const mesh = new THREE.InstancedMesh(L.unitBox, material, items.length), box = new THREE.Box3(), white = col('#ffffff');
      items.forEach((it, i) => {
        _a.fromArray(it.a); _b.fromArray(it.b); box.expandByPoint(_a); box.expandByPoint(_b);
        const len = _a.distanceTo(_b) || 1e-3;
        _y.subVectors(_b, _a).divideScalar(len);
        _x.crossVectors(_y, Math.abs(_y.y) > 0.95 ? _z.fromArray(it.ref || [1, 0, 0]) : UP).normalize(); _z.crossVectors(_x, _y);
        _m.makeBasis(_x.multiplyScalar(it.w), _y.multiplyScalar(len), _z.multiplyScalar(it.h ?? it.w)).setPosition(_v.addVectors(_a, _b).multiplyScalar(0.5));
        mesh.setMatrixAt(i, _m); mesh.setColorAt(i, it.color ? col(it.color) : white);
      });
      mesh.instanceMatrix.needsUpdate = true; mesh.instanceColor.needsUpdate = true;
      const sphere = box.getBoundingSphere(new THREE.Sphere()); sphere.radius += 1;
      mesh.boundingSphere = sphere; mesh.frustumCulled = true; mesh.name = 'standin:' + name;
      ctx.add(mesh);
      return mesh;
    },
    unitBox: new THREE.BoxGeometry(1, 1, 1),

    /** The engine's stand-in (src/engine/modules.js), wearing one of the area's own materials if o.material is given. */
    standIn(o) {
      const m = engineStandIn(ctx, o);
      if (o.material) { m.material.dispose(); m.material = o.material; }
      return m;
    },
    /** A name above a thing made of many parts (the engine's stand-ins name themselves), with &labels=1. */
    label(text, x, y, z) {
      if (!params.has('labels')) return;
      const cv = document.createElement('canvas'), g = cv.getContext('2d');
      g.font = '600 28px system-ui, sans-serif'; cv.width = Math.ceil(g.measureText(text).width) + 20; cv.height = 40;
      g.font = '600 28px system-ui, sans-serif'; g.fillStyle = 'rgba(0,0,0,0.72)'; g.fillRect(0, 0, cv.width, cv.height);
      g.fillStyle = '#fff'; g.textBaseline = 'middle'; g.fillText(text, 10, 21);
      const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, fog: false, sizeAttenuation: false }));
      sp.scale.set(0.045 * cv.width / cv.height, 0.045, 1); sp.renderOrder = 999; sp.position.set(x, y, z); ctx.only(sp, 'direct'); ctx.add(sp);
    },
  };

  // (The rider's boat is the engine's remodelled one, which wears gouache and takes the area's light by itself; the
  // area's last word on it is look.boat.tone in plan.js. The first boat, &boat=boat-model, was lit by three.js lights
  // that this file used to add; it is no longer the ride's, and they are gone.)

  // a beam of L.beams runs along its own Y, and its heart is its middle
  L.unitBox.setAttribute('aLGrain', new THREE.BufferAttribute(new Float32Array(Array.from({ length: 24 }, () => [0, 1, 0, 0]).flat()), 4));
  L.unitBox.setAttribute('aLHeart', new THREE.BufferAttribute(new Float32Array(72), 3));
  L.unitBox.userData.lGrain = true;

  shared.landing = L;
  ctx.onDispose(() => shadeMap.dispose());
  // every mesh that wears a tile gets its grain, by itself: at the first frame, then twice a second while the area
  // is young (models arrive as their modules build), then every three seconds
  let since = 1e3, age = 0;
  return { update(dt) { age += dt; since += dt; if (since > (age < 12 ? 0.5 : 3)) { since = 0; dress(); } } };
}
