// The kept lamp, remodelled: the one storm lantern that someone has left burning in every area, and the three ways
// it is held. Same exports as lamp.js (buildStormLantern, makeKeptLamp, flameCrossing, LAMP_AMBER, LAMP_CORE), taking
// the same arguments and returning the same things, plus the choice of holding. The page is docs/life/boat.md.
//
//   import { makeKeptLamp, flameCrossing } from '../engine/lamp-hero.js';
//   const lamp = makeKeptLamp(ctx.engine, ctx, { at: [204.6, -6.7], note: 62, moths: 4 });               // on its crooked post
//   const lamp = makeKeptLamp(ctx.engine, ctx, { holding: 'hook', flame: [x, 2.2, z], note: 65 });        // S-hook and chain from a bough
//   const lamp = makeKeptLamp(ctx.engine, ctx, { holding: 'bracket', flame: [x, 2.3, z], out: [nx, nz] }); // scrolled bracket on stone
//
// The lantern is a model (assets/models/life/lantern.glb, source-art/models/life/lantern.py). Everything here returns
// at once and fills itself in when the file has arrived; `await loadLamp()` first if a picture must not miss it.
// Far off, where the flame is smaller than a pixel, a lamp is also a point of light that never shrinks below a pixel
// or two (HALO_FRAG). A realm may keep two lamps: the one that counts most where the boat is lights the painted world
// (shareLight).
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { makeGouache, gouacheShared } from './gouache.js';

export const LAMP_AMBER = '#ffb45e', LAMP_CORE = '#ffe2a8';
const LAMP_GLASS = '#ffa23c';                 // the globe's own glow: a shade deeper than the amber, because the picture's tone curve pales whatever is bright
const FLAME_GAIN = 2.7;                       // how bright the flame's body is drawn (above 1 it blooms; much more and it is a blob again)
const FLAME_DROP = 0.2;                       // the flame's middle is this far below the point the lantern hangs by
const _v = new THREE.Vector3(), _w = new THREE.Vector3(), _gw = new THREE.Vector3(), _q = new THREE.Quaternion(), _m = new THREE.Matrix4(), _col = new THREE.Color();

// ------------------------------------------------------------------------------------------------ model files
const files = new Map();
/** Fetch and parse a model once: resolves to { slots: { name: BufferGeometry }, nodes: { name: Object3D } }. */
export function loadModel(url) {
  let p = files.get(url);
  if (!p) {
    p = new GLTFLoader().loadAsync(url).then((gltf) => {
      const slots = {}, nodes = {};
      gltf.scene.updateMatrixWorld(true);
      gltf.scene.traverse((o) => {
        if (o.name) nodes[o.name] = o;
        if (!o.isMesh) return;
        const slot = (o.material && o.material.name) || 'paint';
        slots[slots[slot] ? `${o.name}:${slot}` : slot] = o.geometry.clone().applyMatrix4(o.matrixWorld);       // a second mesh in the same slot is a named part
        if (o.material && o.material.dispose) o.material.dispose();
      });
      return { slots, nodes };
    });
    p.catch((err) => { console.error(`INVALID_MODEL ${url}: ${err && err.message}`); files.delete(url); });
    files.set(url, p);
  }
  return p;
}
const LANTERN_URL = 'assets/models/life/lantern.glb';
/** Fetch the lantern (and the holdings named) ahead of time. */
export function loadLamp(holdings = []) {
  return Promise.all([loadModel(LANTERN_URL), ...holdings.map((h) => loadModel(`assets/models/life/lamp_${h}.glb`))]);
}

// ------------------------------------------------------------------------------------------------ the area's light
// The ride's paint (gouache.js) shades a thing by a ramp of three stops: the area's shadow colour, the thing's own
// colour, the area's lit colour. Things built for one area are painted for its light. The boat, the lantern and its
// holdings are painted once and go through all of them, and in an area whose lit step is dim (the sea: 1 per cent;
// the theatre, the standing sky's night, the orchard's blue hour: a tenth to a third) the MIDDLE of that ramp, which
// is always the paint as painted, is far brighter than the lit side: a boat in daylight colours under a black sky.
// This is laid over the ramp (gouache's `light` place) for those travelling things: where the area's lit step is
// dim, the middle stop comes down to lie between shadow and lit, so the thing sits in the area's light. In a bright
// area (the landing, the reach's sunset, snow light) it changes nothing.
export const AREA_RAMP = /* glsl */`
    {
      vec3 kLit = uRampLight * uKeyColor;
      float kDim = 1.0 - smoothstep(0.25, 0.9, dot(kLit, vec3(0.2126, 0.7152, 0.0722)));
      vec3 kMid = mix(vec3(1.0), 0.5 * (uRampShadow + min(kLit, vec3(1.0))), kDim);
      #ifdef AREA_RAMP_INSIDE
        // an open boat: light that travels upward (a town lit from under the water, a mirror's light) never reaches its inside
        float kW = w * (1.0 - 0.7 * smoothstep(0.0, 0.45, uKeyDir.y));
      #else
        float kW = w;
      #endif
      #ifdef AREA_RAMP_STROKE
        kW = clamp(kW + AREA_RAMP_STROKE, 0.0, 1.0);                      // (a stroke of the thing's own, to rag the ramp's steps: see boat-hero.js)
      #endif
      vec3 kShade = kW < 0.5 ? mix(uRampShadow, kMid, smoothstep(0.0, 0.5, kW)) : mix(kMid, kLit, smoothstep(0.5, 1.0, kW));
      c += albedo * (kShade - shade) * uShade;
    }`;

const HOLDER_LIGHT = /* glsl */`
    { vec3 hTo = uLampPos - vWPos; float hD2 = dot(hTo, hTo);
      vec3 hL = pointLight(uLampPos, uLampColor, uLampRadius, N);
      c += albedo * hL * (1.2 / (1.0 + 1.2 * hD2) - 1.0);
      // iron is nearly black: without a glint of its lamp on it a chain is lost against the night, and the lantern hangs from nothing
      c += hL * 0.022 / (1.0 + 0.6 * hD2); }`;

// ------------------------------------------------------------------------------------------------ the lantern's paints
const FOG_GLSL = /* glsl */`
  uniform vec3 uFogColor; uniform float uFogDensity;
  float lampFog(float d) { return 1.0 - exp(-uFogDensity * uFogDensity * d * d); }`;

// The lantern's metal. A lantern does not light its own outside: the flame is inside it, and what the rider sees of
// the frame is turned away from it. The ride's lamp lights are wrapped (they warm paint that is turned a little away),
// which bleached the frame to the colour of clay and lost it against its own glass. Here the frame gives back the
// light of whichever shared lamp sits at its own flame, and takes instead a strict light from that flame: only what
// truly faces it (the inside of the far tube, the underside of the crown) is warmed. The frame stays dark against the
// globe, which is the whole silhouette of a storm lantern.
// uOwn: xyz = this lantern's flame in the world, w = how brightly it burns (0 cold .. 1 .. 1.6 flaring)
const bodyExtend = (u) => ({
  uniforms: u,
  fragmentPars: 'uniform vec4 uOwn;',
  light: AREA_RAMP + /* glsl */`
    {
      float kA = 1.0 - smoothstep(0.05, 0.30, distance(uLanternPos, uOwn.xyz)), kB = 1.0 - smoothstep(0.05, 0.30, distance(uLampPos, uOwn.xyz));
      c = max(c - albedo * (pointLight(uLanternPos, uLanternColor, uLanternRadius, N) * kA + pointLight(uLampPos, uLampColor, uLampRadius, N) * kB), vec3(0.0));
      vec3 kTo = uOwn.xyz - vWPos;
      float kFace = pow(max(dot(N, kTo / max(length(kTo), 1e-3)), 0.0), 1.6);
      c += albedo * vec3(1.0, 0.52, 0.16) * (2.4 * uOwn.w * kFace);
    }`,
});

// The glass: clear when cold (you see the wick, and the world, through it), a lit globe when burning, frosted in winter.
// uGl: x = how brightly it burns (0 cold .. 1 .. 1.6 flaring), y = frost (0..1), z = the flame's height in the world,
//      w = 1: it burns as in the dark whatever the area's light (a lamp that exists only in the water's memory)
const glassExtend = (u) => ({
  uniforms: u,
  fragmentPars: 'uniform vec4 uGl; uniform vec3 uGlLit, uGlCore;',
  albedo: /* glsl */`
    float gSoot = vColor.r;                                                       // painted in Blender: the smoked top of the globe
    float gNdv = clamp(abs(dot(N, normalize(uCameraPos - vWPos))), 0.0, 1.0);
    float gFres = pow(1.0 - gNdv, 2.0);
    float gGrain = fract(sin(dot(floor(vWPos * 260.0), vec3(12.9898, 78.233, 37.719))) * 43758.5453);
    albedo = mix(vec3(0.60, 0.70, 0.72), vec3(0.15, 0.12, 0.10), gSoot * 0.85);
    albedo = mix(albedo, vec3(0.66, 0.72, 0.84) * (0.82 + 0.18 * gGrain), uGl.y);
    alpha = mix(0.14 + 0.55 * gFres + 0.45 * gSoot, 0.88, uGl.y);
    // Burning in the dusk or the dark, the glass is full of its own light: nearly opaque. By day a lantern's glass
    // does not glow: it stays clear, a little warm, and the flame is seen in it (gDay: how bright the area's own light is).
    float gDay = smoothstep(0.66, 0.92, dot(uRampLight * uKeyColor, vec3(0.2126, 0.7152, 0.0722))) * (1.0 - uGl.w);
    float gLit = clamp(uGl.x, 0.0, 1.0) * (1.0 - 0.8 * gDay);
    alpha = mix(alpha, 0.93 + 0.05 * gFres, clamp(gLit * 1.5, 0.0, 1.0));`,
  light: AREA_RAMP + /* glsl */`
    // Clear glass does not give a lamp's light back as paint does: a cold lantern three metres from the lit bow lantern
    // showed a pale bulb, as if frosted. It keeps a fifth of the two travelling lamps' light (a sheen); frosted, all of it.
    c = max(c - albedo * (pointLight(uLanternPos, uLanternColor, uLanternRadius, N) + pointLight(uLampPos, uLampColor, uLampRadius, N)) * (0.8 * (1.0 - uGl.y)), vec3(0.0));
    c *= 1.0 - 0.97 * gLit;                                                       // a lit globe shows its own light, not the day's
    // The globe is DEEP amber (the ride's one reserved colour): kept under paper white, because the picture's tone
    // curve pales whatever is brighter, and a globe that glows like a bulb is a blob, not a lantern. It is fuller
    // toward the middle, deepest at its rim and under the sooted crown, and a breath of paler gold stands in the
    // glass round the flame. The brightness belongs to the flame's own body, drawn inside it.
    float gUp = (vWPos.y - uGl.z);                                                // metres above the flame's middle
    float gHeart = exp(-pow((gUp - 0.008) / 0.042, 2.0)) * pow(gNdv, 1.8);
    vec3 gAmber = uGlLit * (0.25 + 0.47 * pow(gNdv, 1.25)) * (1.0 - 0.30 * smoothstep(0.01, 0.075, gUp));
    glow += (gAmber + mix(uGlLit, uGlCore, 0.3) * 0.30 * gHeart) * (1.0 - 0.75 * gSoot) * uGl.x * (1.0 - 0.8 * gDay);`,
});

// The flame: a body of its own. The model gives its shape (a flat wick's flame) and, in its paint, where each point
// is: red = 0 on the axis .. 1 on the skin, green = 0 at the wick .. 1 at the tip. It wavers, leans in a wind, and is
// drawn as light (added to the picture, fading to nothing in fog as the kit's rule asks).
// uFl: x = brightness, y = height (1 = at rest), zw = lean in the lantern's own x and z
const flameExtend = (u) => ({
  uniforms: u,
  vertexPars: 'uniform vec4 uFl; uniform float uFlSeed;',
  vertexLocal: /* glsl */`
    float fH = color.g, fT = uTime * 1.0 + uFlSeed;
    float fTip = fH * fH;
    transformed.y = -0.214 + (transformed.y + 0.214) * (0.55 + 0.45 * uFl.y + 0.05 * sin(fT * 11.0) * fH);        // it breathes from the wick up
    transformed.x += fTip * (0.0032 * sin(fT * 7.3 + fH * 5.0) + 0.0016 * sin(fT * 17.1 + 1.3) + uFl.z * 0.028);
    transformed.z += fTip * (0.0022 * sin(fT * 5.9 + 2.1 + fH * 4.0) + uFl.w * 0.028);
    transformed.xz *= 1.0 - 0.35 * fTip * length(uFl.zw);`,
  fragmentPars: 'uniform vec4 uFl;',
  albedo: /* glsl */`
    float fR = vColor.r, fG = vColor.g;
    float fEdge = pow(clamp(abs(dot(N, normalize(uCameraPos - vWPos))), 0.0, 1.0), 0.8);
    // (kept warm: the picture's bloom spreads the flame's colour over the whole globe, and a white core bleaches the amber out of it)
    vec3 fCol = mix(vec3(1.0, 0.46, 0.09), vec3(1.0, 0.72, 0.26), smoothstep(0.95, 0.35, fG));               // orange tip, amber body
    fCol = mix(fCol, vec3(1.0, 0.91, 0.62), (1.0 - 0.6 * fR) * smoothstep(0.04, 0.3, fG) * smoothstep(0.9, 0.45, fG) * fEdge);   // the pale core
    fCol = mix(vec3(0.10, 0.17, 0.42), fCol, smoothstep(0.0, 0.11, fG));                                      // blue where it leaves the wick
    albedo = fCol; alpha = (0.25 + 0.75 * fEdge) * smoothstep(1.0, 0.86, fG);`,
  final: 'gl_FragColor = vec4(albedo * uFl.x * (1.0 - fog), alpha);',
});

const HALO_VERT = /* glsl */`
  uniform vec4 uHalo;                                    // size (m), brightness, how far it is drawn toward the eye (m; 0), 1 = the plain shine for the mirror
  varying vec2 vQ; varying float vDist;
  void main() {
    vec4 mv = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    vDist = length(mv.xyz);
    // Near, it stands BEHIND the lantern (0.12 m beyond the flame): the whole frame, the bail and the hook it hangs
    // from stay dark against the glow, which is a storm lantern's silhouette. (Standing AT the flame it veiled whatever
    // of the frame lay beyond the flame: from below, as the orchards' lamp is passed, that is the crown, the bail and
    // both tubes, and the lantern was a tank under a pale ghost.) Far off, where the lantern is a few pixels and its
    // frame would only blot the light out, it comes forward of the frame. The plain shine for the mirror keeps its place.
    float pull = uHalo.z + 0.16 * smoothstep(12.0, 30.0, vDist) - (uHalo.w > 0.5 ? 0.0 : 0.12 * (1.0 - smoothstep(4.0, 10.0, vDist)));
    float k = (vDist - min(pull, vDist * 0.3)) / max(vDist, 1e-3);
    float size = uHalo.w > 0.5 ? max(uHalo.x, 0.0045 * vDist) : uHalo.x;  // (in the water its shine never shrinks below three or four pixels: a far lamp still lays its stroke)
    mv.xyz *= k; mv.xy += position.xy * size * k;
    vQ = position.xy * 2.0;
    gl_Position = projectionMatrix * mv;
  }`;
const HALO_FRAG = /* glsl */`
  ${FOG_GLSL}
  uniform vec4 uHalo; uniform vec3 uHaloColor, uHaloCore;
  varying vec2 vQ; varying float vDist;
  void main() {
    float r = length(vQ);
    if (r >= 1.0) discard;
    float edge = 1.0 - r; edge *= edge;
    vec3 col; float cover = 0.0;
    if (uHalo.w > 0.5) {
      // (in the water only) the lamp's own shine, plain and bright: this is what the water draws out into the long stroke
      col = mix(uHaloColor, uHaloCore, 0.45) * 3.0 * (1.0 - smoothstep(0.5, 1.0, r)) * uHalo.y;
    } else {
      // a warm heart behind the lantern, a breath of light round it, and the wide air, which swells where the air is thick
      float rho = r * uHalo.x * 0.5;                                      // metres from the flame
      float thick = clamp(uFogDensity * 26.0, 0.0, 1.6);
      float a = 0.34 * exp(-rho * rho / 0.026) + 0.20 * exp(-rho / 0.30) * (1.0 + 0.8 * thick) + 0.045 * (1.0 + 2.0 * thick) * (1.0 - r);
      // The halo is light in the AIR round the lantern. Over the lantern itself it all but stops (within about 7 cm of
      // the flame, which is the globe): laid over the glass it turned the amber globe into a milky bulb and hid the flame.
      // (Only while the lantern can be seen as a lantern: from twenty metres it is ten pixels tall, and a hole in the
      // heart of its glow read as a pale ring round a dark middle, a target. Far off the glow is whole.)
      float body = mix(smoothstep(0.035, 0.105, rho), 1.0, smoothstep(9.0, 20.0, vDist));
      a *= 0.10 + 0.90 * body;
      // far off the flame is smaller than a pixel and would be lost between two of them: beyond ten metres or so the
      // lamp is also a point of light, which never shrinks below a pixel or two (this is what is steered for at 180 m)
      float px = fwidth(vQ.x) * uHalo.x * 0.5;                            // metres to a pixel, at the flame
      float glint = 2.6 * smoothstep(0.012, 0.05, px) * exp(-rho * rho / max(2.6 * px * px, 1e-6));
      a = (a * smoothstep(1.0, 0.4, r) + glint) * uHalo.y;
      col = mix(uHaloColor, uHaloCore, max(exp(-rho * rho / 0.02), 0.5 * min(1.0, glint))) * a;
      cover = min(0.85, a * 1.4) * body;                                  // against a pale sky light cannot be added: there the halo stains the air instead (never the lantern)
    }
    float clear = 1.0 - lampFog(vDist);                                   // light fades to nothing in fog: never a disc of fog colour
    gl_FragColor = vec4(col * clear, cover * clear);
  }`;

const haloGeo = new THREE.PlaneGeometry(1, 1);
const sharedOf = (engine) => gouacheShared(engine);

/**
 * The storm lantern itself: brass, glass and a flame, about 0.3 m tall, hanging from the group's origin; the flame's
 * middle is 0.2 m below it (`flamePoint`). Returns at once; the model fills in when its file has arrived.
 *   opts: { halo: 1 (size of the halo: 0 for none), shine: 0 (1 = also a plain bright copy of its light in the water's
 *           mirror only, which the water draws out into the lamp's long stroke), winter: false (a cap of snow, icicles,
 *           frost on the glass), seed: 0 (so that two flames do not waver in step), night: false (true = it glows as in
 *           the dark whatever the area's light: by day a lantern's glass is clear and throws no halo),
 *           flameOnly: false (true = the flame and its glow alone, never the brass or the glass: a mote of flame) }
 * Returns { group, flame, halo, wide, glassMat, flamePoint, materials, ready, setLevel(level, flick), wind (a Vector3:
 * set it, in the realm's own axes, and the flame leans that way: 1 = a stiff gust), setWinter(on) }.
 */
export function buildStormLantern(engine, opts = {}) {
  const o = { halo: 1, shine: 0, winter: false, seed: 0, night: false, flameOnly: false, ...opts };
  const S = sharedOf(engine);
  const g = new THREE.Group(); g.name = 'storm-lantern';
  const uOwn = { uOwn: { value: new THREE.Vector4(0, -1000, 0, 0) } };
  const brass = makeGouache(engine, { vertexColors: true, brush: 0.3, extend: bodyExtend(uOwn) });
  const uGl = { uGl: { value: new THREE.Vector4(1, o.winter ? 1 : 0, 0, o.night ? 1 : 0) }, uGlLit: { value: new THREE.Color(LAMP_GLASS) }, uGlCore: { value: new THREE.Color(LAMP_CORE) } };
  const glassMat = makeGouache(engine, { vertexColors: true, brush: 0, shade: 1, transparent: true, extend: glassExtend(uGl) });      // (shade 1: a cold glass takes the area's light whole, and is dark in the dark)
  glassMat.depthWrite = false;
  const uFl = { uFl: { value: new THREE.Vector4(FLAME_GAIN, 1, 0, 0) }, uFlSeed: { value: o.seed * 7.31 } };
  const flameMat = makeGouache(engine, { vertexColors: true, brush: 0, shade: 0, transparent: true, side: THREE.DoubleSide, extend: flameExtend(uFl) });
  flameMat.depthWrite = false; flameMat.blending = THREE.CustomBlending; flameMat.blendSrc = THREE.SrcAlphaFactor; flameMat.blendDst = THREE.OneFactor; flameMat.blendEquation = THREE.AddEquation;
  const snowMat = makeGouache(engine, { vertexColors: true, brush: 0.2, emissive: '#dfe4f2', emissiveIntensity: 0.06, extend: { light: AREA_RAMP } });
  const uHalo = { uHalo: { value: new THREE.Vector4(3.4 * o.halo, 1, 0.0, 0) }, uHaloColor: { value: new THREE.Color(LAMP_AMBER) }, uHaloCore: { value: new THREE.Color(LAMP_CORE) }, uFogColor: S.uFogColor, uFogDensity: S.uFogDensity };
  const haloMat = new THREE.ShaderMaterial({ uniforms: uHalo, vertexShader: HALO_VERT, fragmentShader: HALO_FRAG, transparent: true, depthWrite: false, fog: false,
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor });
  const mk = (mat, order = 0) => { const m = new THREE.Mesh(new THREE.BufferGeometry(), mat); m.frustumCulled = false; m.renderOrder = order; m.visible = false; g.add(m); return m; };
  const body = mk(brass), glass = mk(glassMat, 1), flame = mk(flameMat, 2), snow = mk(snowMat);
  const halo = new THREE.Mesh(haloGeo, haloMat); halo.frustumCulled = false; halo.renderOrder = 3; halo.position.y = -0.2; halo.visible = o.halo > 0; g.add(halo);
  // the same light once more, for the water alone (see the fragment shader)
  let shine = null, uShine = null;
  if (o.shine) {
    uShine = { uHalo: { value: new THREE.Vector4(0.34 * o.shine, 1, 0.0, 1) }, uHaloColor: uHalo.uHaloColor, uHaloCore: uHalo.uHaloCore, uFogColor: S.uFogColor, uFogDensity: S.uFogDensity };
    shine = new THREE.Mesh(haloGeo, new THREE.ShaderMaterial({ uniforms: uShine, vertexShader: HALO_VERT, fragmentShader: HALO_FRAG, transparent: true, depthWrite: false, fog: false,
      blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor }));
    shine.frustumCulled = false; shine.renderOrder = 3; shine.position.y = -0.2; shine.layers.set(2); g.add(shine);
  }
  let level = 1, winter = !!o.winter, loaded = false;
  const lantern = {
    group: g, flame, halo, wide: halo, glass, body, snow, glassMat, flameMat, haloMat, flamePoint: new THREE.Vector3(0, -0.2, 0),
    materials: [brass, glassMat, flameMat, snowMat, haloMat], wind: new THREE.Vector3(), haloGain: 1, shine,
    /** level: 0 = cold and dark, 1 = burning normally, above 1 = flaring. flick: this frame's flicker, about 1. */
    setLevel(lv, flick = 1) {
      level = Math.max(0, lv);
      const on = Math.min(1.7, level) * flick;
      g.localToWorld(_gw.set(0, -FLAME_DROP, 0));                       // the flame's middle in the world (the lantern may hang aslant)
      uGl.uGl.value.x = on; uGl.uGl.value.z = _gw.y;
      uOwn.uOwn.value.set(_gw.x, _gw.y, _gw.z, on);
      flame.visible = loaded && level > 0.03;
      uFl.uFl.value.x = FLAME_GAIN * Math.min(1.3, 0.35 + 0.65 * level) * flick; uFl.uFl.value.y = Math.min(1.25, 0.25 + 0.75 * level) * (0.94 + 0.06 * flick);
      // by day a lantern throws no glow into the air and lays no stroke on the water: both fade as the area's own
      // light comes up (the same measure the glass uses; read through the material, whose uniforms are the engine's)
      const kl = brass.uniforms.uRampLight.value, kc = brass.uniforms.uKeyColor.value;
      const dk = o.night ? 0 : Math.min(1, Math.max(0, (0.2126 * kl.r * kc.r + 0.7152 * kl.g * kc.g + 0.0722 * kl.b * kc.b - 0.66) / 0.26)), day = dk * dk * (3 - 2 * dk);
      halo.visible = o.halo > 0 && level > 0.02; uHalo.uHalo.value.y = Math.min(1.7, level) * flick * lantern.haloGain * (1 - 0.6 * day);
      if (shine) { shine.visible = level > 0.02; uShine.uHalo.value.y = Math.min(1.5, level) * flick * (1 - 0.8 * day); }
      // the flame leans with the wind, in the lantern's own axes
      if (lantern.wind.lengthSq() > 1e-6) { g.getWorldQuaternion(_q).invert(); _v.copy(lantern.wind).applyQuaternion(_q); uFl.uFl.value.z = _v.x; uFl.uFl.value.w = _v.z; }
      else { uFl.uFl.value.z = 0; uFl.uFl.value.w = 0; }
    },
    /** A cap of snow on the crown, icicles, and frost on the glass (the orchard in snow). */
    setWinter(on) { winter = !!on; snow.visible = loaded && winter && !o.flameOnly; uGl.uGl.value.y = winter ? 1 : 0; },
  };
  lantern.ready = loadModel(LANTERN_URL).then(({ slots }) => {
    body.geometry = slots.paint.clone(); glass.geometry = slots.glass.clone(); flame.geometry = slots.flame.clone(); if (slots.snow) snow.geometry = slots.snow.clone();
    loaded = true; body.visible = glass.visible = !o.flameOnly; snow.visible = !o.flameOnly && winter && !!slots.snow;
    lantern.setLevel(level);
    return lantern;
  }).catch(() => lantern);
  lantern.setLevel(1);
  return lantern;
}

// ------------------------------------------------------------------------------------------------ the three holdings
// Where the lantern's bail rests on each holding, in the holding's own frame (source-art/models/life/lamp_*.py).
// post: its foot at the waterline, the arm along +x.  hook: the point on the bough, the chain hanging down.
// bracket: the point on the wall where the arm leaves it, the arm along +z.
export const HOLDINGS = { post: { hang: [0.707, 2.46, 0], file: 'post' }, hook: { hang: [0, -0.94, 0], file: 'hook' }, bracket: { hang: [0, -0.105, 0.80], file: 'bracket' }, none: { hang: [0, 0, 0], file: null } };

// ------------------------------------------------------------------------------------------------ moths
// A moth is a body and two wings hinged on it (each wing a fan of three triangles: fore wing and hind wing as one
// outline), 36 mm across. A few of them, each steered on the CPU, drawn in one instanced call in the ride's paint,
// so the lamp lights the side of them that faces it. aPart: 0 body, +1 right wing, -1 left wing. (Modelled 36 mm
// across and drawn 1.4 times that.)
function mothGeometry() {
  const P = [], C = [], A = [];
  const tri = (a, b, c, part, ca, cb, cc) => { P.push(...a, ...b, ...c); C.push(...ca, ...cb, ...cc); A.push(part, part, part); };
  // (Pale on purpose: half a metre from the flame they are the best-lit things in the picture, paler than a dusk sky and
  // bright against the night. Painted a mid grey they matched the dusk sky and were lost: tried, and put back.)
  const pale = [0.72, 0.69, 0.62], base = [0.40, 0.37, 0.33], tip = [0.80, 0.77, 0.70], dark = [0.27, 0.25, 0.23];
  for (const s of [1, -1]) {
    const R0 = [s * 0.0015, 0, 0.003], T1 = [s * 0.0178, 0, 0.0066], M = [s * 0.0168, 0, -0.003], T2 = [s * 0.0102, 0, -0.0108], R1 = [s * 0.0015, 0, -0.0062];
    tri(R0, T1, M, s, base, tip, pale); tri(R0, M, T2, s, base, pale, pale); tri(R0, T2, R1, s, base, pale, base);
  }
  const nose = [0, 0, 0.0078], tail = [0, 0, -0.0088], ring = [[0.0023, 0, 0.001], [0, 0.0021, 0.001], [-0.0023, 0, 0.001], [0, -0.0019, 0.001]];
  for (let i = 0; i < 4; i++) { const a = ring[i], b = ring[(i + 1) % 4]; tri(a, b, nose, 0, dark, dark, base); tri(b, a, tail, 0, dark, dark, base); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setAttribute('aPart', new THREE.Float32BufferAttribute(A, 1));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(new Float32Array(P.length).fill(0).map((v, i) => (i % 3 === 1 ? 1 : 0)), 3));
  return g;
}
const mothExtend = {
  vertexPars: 'attribute float aPart; attribute vec2 aWing;',          // aWing (per moth): x = how far the wings are raised, y = folded (0 flying .. 1 at rest)
  vertexLocal: /* glsl */`
    if (aPart != 0.0) {
      float mb = aWing.y * 0.82;                                         // at rest the wings are swept back into a delta
      float mx = abs(transformed.x);
      transformed.z -= mx * sin(mb) * 0.9; mx *= cos(mb);
      transformed.y += mx * sin(aWing.x); transformed.x = aPart * mx * cos(aWing.x);
    }`,
};
const easeIO = (t) => t * t * (3 - 2 * t);
const _p = new THREE.Vector3(), _p2 = new THREE.Vector3(), _f = new THREE.Vector3(), _r = new THREE.Vector3(), _u = new THREE.Vector3(), _c = new THREE.Vector3(), _s = new THREE.Vector3();
// places on the lantern where a moth can sit (lantern's own axes: position, and the way out from the surface)
const PERCHES = [[[0.000, -0.108, 0.036], [0, 0.5, 0.86]], [[0.058, -0.262, 0.020], [0.9, 0.3, 0.3]], [[-0.030, -0.085, -0.012], [-0.5, 0.8, -0.2]], [[-0.060, -0.200, 0.028], [-0.92, 0, 0.38]], [[0.020, -0.270, -0.052], [0.3, 0.3, -0.9]]];

/**
 * Moths for a lamp, or for the boat's own lantern alone.
 *   home      () => Vector3 | null: the flame they attend (null: they have none, and only ever come to the prow lantern)
 *   homeLit   () => 0..1: how brightly it burns (they leave a cold lamp, and come back about four seconds after it is lit)
 *   count     how many (3)
 *   visit     true: when the boat has lain still for `after` seconds within `range` metres, they cross to the prow
 *             lantern, circle it and settle on it; they leave when the boat moves
 *   parent    where the mesh is added (default: the realm)
 * Returns { mesh, count, moths (their states, to read) }.
 */
export function makeMoths(engine, ctx, opts = {}) {
  const o = { count: 3, visit: true, after: 6, range: 14, seed: 1, home: null, homeLit: () => 1, ...opts };
  const n = Math.max(0, Math.round(o.count));
  const geo = mothGeometry();
  const wing = new THREE.InstancedBufferAttribute(new Float32Array(n * 2), 2); wing.setUsage(THREE.DynamicDrawUsage);
  geo.setAttribute('aWing', wing);
  const mat = makeGouache(engine, { vertexColors: true, brush: 0, shade: 0.7, flat: true, side: THREE.DoubleSide, emissive: '#8a8478', emissiveIntensity: 0.10, extend: [mothExtend, { light: AREA_RAMP }] });
  const mesh = new THREE.InstancedMesh(geo, mat, n); mesh.name = 'moths'; mesh.frustumCulled = false; mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const rnd = ctx.rng(977 + o.seed * 13);
  const calm = ctx.reducedMotion ? 0.55 : 1;
  const moths = Array.from({ length: n }, (_, i) => ({
    ph: [rnd() * 40, rnd() * 6.28, rnd() * 6.28, rnd() * 6.28, rnd() * 6.28], w: (1.5 + rnd() * 0.8) * (rnd() < 0.5 ? -1 : 1), R: 0.26 + rnd() * 0.14, beat: 9 + rnd() * 2.5,
    mode: o.home ? 'home' : 'away', u: 0, dur: 1, from: new THREE.Vector3(), to: new THREE.Vector3(), c: new THREE.Vector3(),
    here: o.home && o.homeLit() > 0.5 ? 1 : 0,                    // (none at a lamp that starts cold: they used to be seen leaving it for two seconds)
    wait: 0.3 + rnd() * 1.4, after: o.after + i * 1.7 + rnd() * 2,
    perch: PERCHES[(i * 2 + Math.floor(rnd() * 2)) % PERCHES.length], flick: 3 + rnd() * 5, fold: 0, lift: 0.5, pos: new THREE.Vector3(), q: new THREE.Quaternion(), scale: o.home ? 1 : 0, lateral: (rnd() - 0.5) * 2,
  }));
  let still = 0, moving = 0, time = 0;
  const cam = engine.shared.uCameraPos.value;
  const prow = new THREE.Vector3(), prowQ = new THREE.Quaternion(), home = new THREE.Vector3();
  // where moth m would be on its wandering orbit round `centre` at time t (radius scaled by k)
  const orbit = (m, t, centre, k, out) => {
    const a = t * m.w + m.ph[1], dart = 1 - 0.55 * Math.pow(Math.max(0, Math.sin(t * 0.43 + m.ph[2])), 12);
    const rr = m.R * k * (0.6 + 0.4 * Math.sin(t * 0.61 + m.ph[3])) * dart;
    return out.set(centre.x + Math.cos(a) * rr + 0.022 * Math.sin(t * 8.3 + m.ph[4]), centre.y + k * (0.02 + 0.10 * Math.sin(t * 2.3 + m.ph[2]) + 0.035 * Math.sin(t * 5.3 + m.ph[1])), centre.z + Math.sin(a) * rr + 0.022 * Math.sin(t * 7.1 + m.ph[3]));
  };
  ctx.onUpdate((dt) => {
    if (!n) return;
    time += dt * calm;
    const boat = engine.boat, model = boat.model, hasHome = !!o.home;
    if (hasHome) home.copy(o.home());
    const lit = hasHome ? o.homeLit() : 0;
    const lanternObj = model && model.lantern;
    let prowOn = 0;
    if (lanternObj) { lanternObj.getWorldPosition(prow); lanternObj.getWorldQuaternion(prowQ); prow.y -= FLAME_DROP; prowOn = (model.lit ?? 1) > 0.5 && (model.lightLevel ?? 1) > 0.05 ? 1 : 0; }
    if (boat.speed < 0.25) { still += dt; moving = 0; } else { moving += dt; if (moving > 0.3) still = 0; }
    const near = !hasHome || home.distanceTo(prow) < o.range;
    for (let i = 0; i < n; i++) {
      const m = moths[i];
      // ---- what it is doing
      if (m.mode === 'home') {
        m.here += ((lit > 0.5 ? 1 : 0) - m.here) * Math.min(1, dt * (lit > 0.5 ? 0.25 : 0.6));         // they find a lit lamp slowly and leave a cold one
        m.c.copy(home);
        if (o.visit && prowOn && near && lit > 0.5 && still > m.after) { m.mode = 'going'; m.u = 0; m.from.copy(home); m.dur = Math.max(2.5, home.distanceTo(prow) / 0.9); }
      } else if (m.mode === 'away') {
        m.here += (0 - m.here) * Math.min(1, dt * 1.5);
        if (o.visit && prowOn && still > m.after) {                                                     // out of the dark, from a few metres off
          m.mode = 'going'; m.u = 0; const a = m.ph[1] + i * 2.1; m.from.set(prow.x + Math.cos(a) * 4.5, prow.y + 1.2 + m.lateral, prow.z + Math.sin(a) * 4.5); m.dur = 5.5; m.c.copy(m.from);
        }
      } else if (m.mode === 'going') {
        m.u = Math.min(1, m.u + dt * calm / m.dur); m.here = Math.min(1, m.here + dt * 0.8);
        const e = easeIO(m.u); m.c.lerpVectors(m.from, prow, e); m.c.y += Math.sin(e * Math.PI) * 0.35; m.c.x += Math.sin(e * Math.PI) * 0.3 * m.lateral;
        if (moving > m.wait) { m.mode = 'leaving'; m.u = 0; m.from.copy(m.c); m.dur = 3; }
        else if (m.u >= 1) { m.mode = 'circling'; m.u = 0; m.dur = 3 + m.wait * 2; }
      } else if (m.mode === 'circling') {
        m.u = Math.min(1, m.u + dt * calm / m.dur); m.c.copy(prow);
        if (moving > m.wait || !prowOn) { m.mode = 'leaving'; m.u = 0; m.from.copy(prow); m.dur = 3; }
        else if (m.u >= 1) { m.mode = 'landing'; m.u = 0; m.dur = 0.9; m.from.copy(m.pos); }
      } else if (m.mode === 'landing' || m.mode === 'landed') {
        if (m.mode === 'landing') { m.u = Math.min(1, m.u + dt / m.dur); if (m.u >= 1) m.mode = 'landed'; }
        if (moving > m.wait || !prowOn) { m.mode = 'leaving'; m.u = 0; m.from.copy(prow); m.dur = 3; }
      } else if (m.mode === 'leaving') {
        m.u = Math.min(1, m.u + dt * calm / m.dur);
        const back = hasHome && lit > 0.5 && home.distanceTo(prow) < o.range * 1.5;
        if (back) { m.to.copy(home); m.dur = Math.max(m.dur, home.distanceTo(m.from) / 1.1); }
        else { m.to.set(m.from.x + Math.cos(m.ph[1]) * 5, m.from.y + 2.2, m.from.z + Math.sin(m.ph[1]) * 5); m.here = Math.max(0, m.here - dt * 0.45); }
        m.c.lerpVectors(m.from, m.to, easeIO(m.u));
        if (m.u >= 1) m.mode = hasHome ? 'home' : 'away';
      }
      // ---- where it is, which way it heads
      const settle = m.mode === 'landed' ? 1 : m.mode === 'landing' ? easeIO(m.u) : 0;
      const k = m.mode === 'circling' ? 1 - 0.55 * easeIO(m.u) : m.mode === 'going' ? 1 + 0.5 * Math.sin(m.u * Math.PI) : 1;
      const t = time + m.ph[0];
      orbit(m, t, m.c, k * (1.6 - 0.6 * m.here), _p); orbit(m, t + 0.05, m.c, k * (1.6 - 0.6 * m.here), _p2);
      _f.subVectors(_p2, _p); if (_f.lengthSq() < 1e-10) _f.set(0, 0, 1); _f.normalize();
      _f.y = _f.y * 0.5 + 0.45; _f.normalize();                                           // a moth flies with its body tilted up
      _u.set(0, 1, 0);
      if (settle > 0) {
        // on the lantern: its feet on the surface, its head up
        _s.set(m.perch[0][0], m.perch[0][1], m.perch[0][2]).applyQuaternion(prowQ); _s.x += prow.x; _s.y += prow.y + FLAME_DROP; _s.z += prow.z;
        _c.set(m.perch[1][0], m.perch[1][1], m.perch[1][2]).normalize().applyQuaternion(prowQ);
        _s.addScaledVector(_c, 0.004);
        if (m.mode === 'landing') _p.lerpVectors(m.from, _s, settle); else _p.copy(_s);
        _r.set(0, 1, 0).addScaledVector(_c, -_c.y).normalize();                           // head up, along the surface
        _f.lerp(_r, settle).normalize(); _u.lerp(_c, settle).normalize();
      }
      // never in the rider's face
      _c.subVectors(_p, cam); const dc = _c.length(); if (dc < 0.75 && dc > 1e-4) _p.addScaledVector(_c, (0.75 - dc) / dc);
      m.pos.copy(_p);
      _r.crossVectors(_u, _f).normalize(); _u.crossVectors(_f, _r).normalize();
      _m.makeBasis(_r, _u, _f); _m.setPosition(_p);
      const sc = Math.min(1, m.here * 3) * 1.4;                                   // (a pale moth 5 cm across the wings: a ghost moth, a white ermine)
      _m.scale(_s.set(sc, sc, sc));
      mesh.setMatrixAt(i, _m);
      // ---- its wings: a flutter in flight; folded at rest, with a flick now and then
      let flap = 0.25 + 0.95 * Math.sin(t * 6.283 * m.beat / calm * (ctx.reducedMotion ? 0.5 : 1)), fold = 0;
      if (settle > 0) {
        m.flick -= dt; let fl = 0;
        if (m.flick < 0) { fl = Math.sin(Math.min(1, -m.flick / 0.45) * Math.PI); if (m.flick < -0.45) m.flick = 4 + ((i * 7 + Math.floor(time)) % 5); }
        fold = settle * (1 - 0.5 * fl); flap = flap * (1 - settle) + settle * (-0.16 + 0.5 * fl);
      }
      wing.array[i * 2] = flap; wing.array[i * 2 + 1] = fold;
    }
    mesh.instanceMatrix.needsUpdate = true; wing.needsUpdate = true;
  });
  (o.parent || ctx.group).add(mesh);
  return { mesh, count: n, moths };
}

// A position may be given as [x, y, z] or as a THREE.Vector3 (what model.point() and kit.at() return).
const arr3 = (v) => (v && v.isVector3 ? [v.x, v.y, v.z] : v);

// A lantern on a hook is a pendulum, whatever it weighs: its length sets its period (2 pi sqrt(L / g): 0.87 s on a
// short hook, 2 s under 0.8 m of chain). It is moved only by what pushes it: the wind, a hand, the wake of something
// passing. Never by a clock, and never by having its amplitude changed under it (which makes it jump).
// a, b = its lean in radians toward the parent's +x and +z; `settle` = seconds for a swing to die to a third.
function makePendulum(length, settle) {
  const w2 = 9.81 / length, damp = 2 / settle;
  const p = {
    a: 0, b: 0, va: 0, vb: 0, w: Math.sqrt(w2), length,
    /** ax, az: what pushes the bob this frame, as an acceleration (m/s2) along the parent's x and z */
    step(dt, ax, az) {
      let left = Math.min(dt, 0.1);
      while (left > 1e-6) {
        const h = Math.min(left, 0.02); left -= h;
        p.va += (-w2 * p.a - damp * p.va + ax / length) * h; p.a += p.va * h;
        p.vb += (-w2 * p.b - damp * p.vb + az / length) * h; p.b += p.vb * h;
      }
      p.a = Math.max(-0.5, Math.min(0.5, p.a)); p.b = Math.max(-0.5, Math.min(0.5, p.b));
    },
    /** a push that will carry it (da, db) radians out: speed is added, the place it hangs in is not changed */
    kick(da, db) { p.va += da * p.w; p.vb += db * p.w; },
  };
  return p;
}

/**
 * Put the realm's kept lamp in the world. opts (all that lamp.js took, and the holding):
 *   holding                 'post' (default with `at` / `position`), 'hook', 'bracket', or 'none' (default with `hang`)
 *   at: [s, d]              post: where its foot stands in the water, in path coordinates (or position: [x, y, z])
 *   hang: [x, y, z]         hook: the point on the bough it hangs from.  none: the point the lantern's bail hangs on
 *   wall: [x, y, z]         bracket: the point on the stone where the arm leaves it;  out: [x, z] the way the arm reaches
 *   flame: [x, y, z]        instead of any of these: where the flame must be; the holding is worked back from it
 *                           (every position may be an array or a THREE.Vector3)
 *   face                    post: where its arm reaches: 'along' (down the path: the default, as lamp.js had it),
 *                           'channel' (toward the centre line: the lamp hangs clear of its post for a boat coming down
 *                           the path, over the water it will lay its stroke on), 'back' (up the path)
 *   out: [x, z]             post or bracket: the way the arm reaches, as a direction in the realm's own axes
 *   turn                    radians about the vertical: the arm reaches along (cos turn, -sin turn) for a post, along
 *                           (sin turn, cos turn) for a bracket. It wins over `face` and `out`
 *   spin                    how far the lantern is turned on its hook, radians (default 0.62: a three-quarter view from
 *                           along the arm and from across it; 0 = its face square to the arm)
 *   chain                   hook: metres of chain (default 0.8; 0.4 to 1.3 look right: only the chain is drawn out or closed
 *                           up, the eye bolt, the S-hook and the drop hook keep their size)
 *   lit                     true (default); false = cold and dark (light it later with lamp.setLit(true))
 *   note                    MIDI number of the soft note it sounds when the boat passes within `near` metres (D4 = 62)
 *   near 8, reach 12        how near the boat must pass; how far its light falls on painted things, metres
 *   moths 3                 how many pale moths attend it (0 for none; the number is exact: so few are never thinned by
 *                           the quality setting);  visit: true = they cross to the prow lantern when the boat lies still
 *   lean 0.12, postHeight 2.4, intensity 1
 *   winter                  true: a cap of snow, icicles and frosted glass (the orchard in snow)
 *   halo 1, stroke 1        size of its halo; strength of its stroke on the water (0 = only what the mirror shows of itself)
 *   only                    'mirror' | 'direct': the whole lamp is seen only in the water, or only above it
 *   night                   true: it glows as in the dark whatever the area's light (default: only for a lamp that is
 *                           `only: 'mirror'`). By day a lit lantern's glass is clear, with the flame in it, and it has no halo
 *   light                   false: it does not light the painted world (for a second lamp that exists only in the mirror).
 *                           Of several lamps that do, the one that counts most where the boat is has the kit's lamp light
 * Returns { group, lantern, position (the flame, local), setLit(on, seconds), lit, onPass(fn), holding, swing(amount),
 *           wind (Vector3: the flame leans that way and the lantern is pushed), moths, ready (a promise: its models have arrived) }.
 */
export function makeKeptLamp(engine, ctx, opts = {}) {
  const o = { lit: true, note: 62, near: 8, reach: 12, moths: 3, visit: true, lean: 0.12, postHeight: 2.4, intensity: 1, chain: 0.8, winter: false, light: true, spin: 0.62, ...opts };
  for (const k of ['position', 'hang', 'wall', 'flame']) o[k] = arr3(o[k]);
  const kind = o.holding || (o.hang && !o.flame ? 'none' : (o.at || o.position ? 'post' : (o.wall ? 'bracket' : 'post')));
  const H = HOLDINGS[kind] || HOLDINGS.none;
  const S = sharedOf(engine), group = new THREE.Group(); group.name = 'kept-lamp';
  const lantern = buildStormLantern(engine, { winter: o.winter, seed: (o.note || 0) % 17, halo: o.halo ?? 1, shine: o.stroke ?? 1, night: o.night ?? (o.only === 'mirror') });
  const holder = new THREE.Group(); holder.name = 'lamp-' + kind;            // the holding's own frame
  const swing = new THREE.Group(); holder.add(swing);                        // (the hook and chain swing in it; the others stand still)
  const hang = new THREE.Vector3(...H.hang);
  if (kind === 'hook') hang.y = -(0.14 + o.chain);
  // ---- which way the holding is turned. A post's arm reaches along its own +x, a bracket's along its +z.
  const armTurn = (dx, dz) => (kind === 'bracket' ? Math.atan2(dx, dz) : Math.atan2(-dz, dx));
  let turn = o.turn ?? 0;
  if (o.turn == null) {
    if (o.out && (kind === 'post' || kind === 'bracket')) turn = armTurn(o.out[0], o.out[1]);
    else if (kind === 'post') {
      // where the post stands on the waterway: from `at`, or found from its position or its flame
      const here = o.at ? ctx.path.at(o.at[0]) : null, xz = o.position || o.flame;
      const loc = here ? { tx: here.tx, tz: here.tz, rx: here.rx, rz: here.rz, d: o.at[1] ?? 0 } : (xz ? ctx.path.locate(xz[0], xz[2]) : ctx.path.locate(0, 0));
      const face = o.face || 'along';
      if (face === 'channel' && Math.abs(loc.d) > 0.05) turn = armTurn(-Math.sign(loc.d) * loc.rx, -Math.sign(loc.d) * loc.rz);
      else if (face === 'back') turn = armTurn(-loc.tx, -loc.tz);
      else turn = armTurn(loc.tx, loc.tz);                                   // down the path
    }
  }
  holder.rotation.y = turn;
  if (kind === 'post') { holder.scale.y = o.postHeight / 2.4; holder.rotation.z = -(o.lean - 0.12); }
  holder.updateMatrix();
  const off = hang.clone().applyMatrix4(holder.matrix);                       // from the holding's placing point to the lantern's bail
  const base = new THREE.Vector3();
  if (o.flame) base.set(o.flame[0] - off.x, o.flame[1] + FLAME_DROP - off.y, o.flame[2] - off.z);          // worked back from the flame
  else if (kind === 'post') { if (o.at) ctx.path.point(o.at[0], o.at[1] ?? 0, 0, base); else base.set(o.position[0], o.position[1] ?? 0, o.position[2]); }
  else if (kind === 'bracket') base.set(...(o.wall || o.position || [0, 0, 0]));
  else base.set(...(o.hang || o.position || [0, 0, 0]));
  holder.position.copy(base); holder.updateMatrix();
  // ---- the holding's model, in the ride's paint (water-light on the post's foot), sitting in each area's light
  let holdMesh = null;
  const tasks = [lantern.ready];
  if (H.file) {
    // (and its own lamp's light thins along it with the square of the distance, as the bow lantern's does along the
    // boat: the ride's lamps do not fall away at all within a quarter of their reach, which painted the whole post
    // amber from its head to the water. Its head glows; its foot keeps the dusk.)
    const mat = makeGouache(engine, { vertexColors: true, brush: kind === 'post' ? 0.8 : 0.4, caustics: kind === 'post' ? { intensity: 0.22, height: 0.9, color: '#ffe2c0' } : null, extend: { light: AREA_RAMP + HOLDER_LIGHT } });
    holdMesh = new THREE.Mesh(new THREE.BufferGeometry(), mat); holdMesh.name = 'lamp-' + kind + '-model'; holdMesh.visible = false;
    (kind === 'hook' ? swing : holder).add(holdMesh);
    tasks.push(loadModel(`assets/models/life/lamp_${H.file}.glb`).then(({ slots }) => {
      const geo = slots.paint.clone();
      // A hook's chain is as long as the realm asks. The model has 0.8 m of it (from 0.128 to 0.900 m under the bough):
      // only that stretch is drawn out or closed up, link by link; the eye bolt and the S-hook above it and the drop
      // hook below keep their own size. (Scaling the whole model squashed the smith's hook with the chain.)
      if (kind === 'hook' && Math.abs(o.chain - 0.8) > 1e-4) {
        const pos = geo.attributes.position, k = (o.chain - 0.028) / 0.772;
        for (let i = 0; i < pos.count; i++) { const y = pos.getY(i); if (y < -0.128) pos.setY(i, y > -0.900 ? -0.128 + (y + 0.128) * k : y + 0.772 * (1 - k)); }
        pos.needsUpdate = true; geo.computeBoundingSphere();
      }
      holdMesh.geometry = geo; holdMesh.visible = true;
    }).catch(() => {}));
  }
  // The lantern hangs upright whatever the holding's lean, turned a little on its hook (`spin`): a hook's lantern
  // swings with its chain, the others hang from a point. Its own rotations are taken turn first, then swing.
  const hanging = kind === 'hook';
  lantern.group.rotation.order = 'XZY';
  if (hanging) { lantern.group.position.copy(hang); swing.add(lantern.group); group.add(holder); }
  else { group.add(holder); holder.updateMatrix(); lantern.group.position.copy(hang).applyMatrix4(holder.matrix); group.add(lantern.group); }
  lantern.group.rotation.y = hanging ? o.spin : turn + o.spin;
  ctx.add(group);

  const calm = ctx.reducedMotion ? 0.3 : 1;
  const pend = makePendulum(hanging ? 0.25 + o.chain : 0.19, hanging ? 7 : 1.6);
  const ph = ((o.note || 0) % 17) * 0.37 + base.x * 0.13 + base.z * 0.07;      // so that two lamps never move in step
  const cs = Math.cos(turn), sn = Math.sin(turn);
  // the wind as the pendulum's parent sees it (a hook's chain hangs in its holder's frame, the others in the realm's)
  const windLocal = (out) => { const wx = lamp.wind.x, wz = lamp.wind.z; return hanging ? out.set(wx * cs - wz * sn, 0, wx * sn + wz * cs) : out.set(wx, 0, wz); };
  // ---- moths
  const lamp = {
    group, lantern, holder, holding: kind, position: new THREE.Vector3(), lit: o.lit ? 1 : 0, target: o.lit ? 1 : 0, rate: 1, flare: 0, inside: false, wind: lantern.wind,
    /** Light or put out the lamp over `seconds`. */
    setLit(on, seconds = 2.5) { lamp.target = on ? 1 : 0; lamp.rate = 1 / Math.max(0.05, seconds); },
    /** fn() is called each time the boat comes within `near` metres of the lamp. */
    onPass(fn) { passFns.push(fn); },
    /** Give the lamp a push (1 = a hand's push: a hanging lamp swings a hand's breadth and settles in about twenty
     *  seconds; one on a post or a bracket rocks on its hook for a few). It goes the way the wind blows, if any does. */
    swing(amount = 1) {
      windLocal(_v); const n = Math.hypot(_v.x, _v.z);
      const dx = n > 0.05 ? _v.x / n : 0.8, dz = n > 0.05 ? _v.z / n : 0.6, k = 0.06 * Math.min(3, amount) * calm * (hanging ? 1 : 1.8);
      pend.kick(dx * k, dz * k);
    },
    ready: Promise.all(tasks).then(() => lamp),
  };
  const passFns = [];
  group.updateMatrixWorld(true);
  lantern.group.localToWorld(lamp.position.set(0, -FLAME_DROP, 0));
  lamp.moths = o.moths > 0 ? makeMoths(engine, ctx, { count: o.moths, visit: o.visit, seed: o.note || 1, home: () => lamp.position, homeLit: () => lamp.lit, parent: group }) : null;
  if (o.only) { const layer = o.only === 'mirror' ? 2 : 1; group.traverse((x) => { if (x !== lantern.shine) x.layers.set(layer); }); if (o.only === 'direct' && lantern.shine) lantern.shine.visible = false, lantern.shine.scale.setScalar(0); }

  const amber = new THREE.Color(LAMP_AMBER);
  ctx.onUpdate((dt, c) => {
    lamp.lit += Math.sign(lamp.target - lamp.lit) * Math.min(Math.abs(lamp.target - lamp.lit), dt * lamp.rate);
    const t = c.time;
    // ---- how it hangs. The wind leans it and, being never steady, keeps it moving; a push sets it swinging; and in
    // still air it is never wholly still: under a chain it keeps a breath of its own swing (a centimetre or two), on
    // a hook it leans and recovers with the air.
    windLocal(_v);
    const gust = 1 + 0.35 * Math.sin(t * 1.7 + ph) + 0.25 * Math.sin(t * 2.9 + 1.3 * ph);
    pend.step(dt, _v.x * 1.6 * gust * calm, _v.z * 1.6 * gust * calm);
    let a = pend.a, b = pend.b;
    if (hanging) {
      const k = (0.010 + 0.008 * Math.sin(t * 0.21 + 1.0)) * calm;
      a += k * Math.sin(t * pend.w + ph); b += 0.6 * k * Math.sin(t * pend.w * 0.985 + 1.3 + ph);
    } else {
      a += (0.030 * Math.sin(t * 0.9 + ph) + 0.010 * Math.sin(t * 2.3 + 2.0 * ph)) * calm; b -= (0.025 * Math.sin(t * 0.7 + 1.0 + ph) + 0.009 * Math.sin(t * 1.9 + 0.7)) * calm;
    }
    const hung = hanging ? swing : lantern.group;
    hung.rotation.z = a; hung.rotation.x = -b;                         // (a turn about z carries what hangs toward +x; about x, toward -z)
    // and it turns a little on its hook, slowly, as a hanging thing does
    lantern.group.rotation.y = (hanging ? o.spin : turn + o.spin) + (0.16 * Math.sin(t * 0.31 + ph) + 0.07 * Math.sin(t * 0.127 + 2.0 * ph)) * calm;
    lantern.group.localToWorld(_w.set(0, -FLAME_DROP, 0));
    lamp.position.copy(_w);                                            // realms are not transformed, so world = local
    const boat = engine.boat, dist = Math.hypot(boat.x - _w.x, boat.z - _w.z);
    // passing close: both lamps brighten for a breath, and one soft note sounds
    if (dist < o.near && !lamp.inside) {
      lamp.inside = true;
      if (lamp.lit > 0.5) { lamp.flare = 1; engine.lanternFlare = 1; if (engine.audio && engine.audio.play) engine.audio.play('lamp', { x: _w.x, z: _w.z, note: o.note, gain: 1 }); }
      for (const fn of passFns) { try { fn(lamp); } catch (e) { console.error(e); } }
    } else if (dist > o.near * 1.6) lamp.inside = false;
    lamp.flare = Math.max(0, lamp.flare - dt / 3.2);
    const breath = Math.sin(Math.min(1, 1 - lamp.flare) * Math.PI);    // rises and falls once over the flare
    const flick = 1 + Math.sin(t * 9.1 + 1.0) * 0.03 + Math.sin(t * 13.7) * 0.02 + Math.sin(t * 2.1) * 0.03;
    const level = lamp.lit * o.intensity * (1 + 0.45 * breath * (lamp.flare > 0 ? 1 : 0));
    lantern.setLevel(level, flick);
    if (o.light) shareLight(engine, S, ctx, lamp, _w, o.reach, _col.copy(amber).multiplyScalar(1.7 * level * flick), level > 0.01 ? level / (1 + dist / 20) : 0);
  });
  return lamp;
}

// The painted world takes the light of ONE kept lamp (gouache.js: uLampPos, uLampColor, uLampRadius). A realm may keep
// two (the standing sky's, the snow orchard's): each offers its light here every frame and the one that counts most
// where the boat is (the brightest, the nearest) is given the uniforms. Where two count alike, half way between
// them, the light is let down to nothing and comes up again as the other's, so that nothing jumps.
const OFFERS = new WeakMap();                                             // engine -> Map(lamp -> its offer)
function shareLight(engine, S, ctx, lamp, pos, reach, color, weight) {
  let offers = OFFERS.get(engine); if (!offers) OFFERS.set(engine, offers = new Map());
  let mine = offers.get(lamp); if (!mine) offers.set(lamp, mine = { pos: new THREE.Vector3(), color: new THREE.Color(), reach, w: 0, at: 0, ctx });
  const now = performance.now();
  mine.pos.copy(pos); mine.color.copy(color); mine.reach = reach; mine.w = weight; mine.at = now;
  let best = null, next = 0;
  for (const [l, x] of offers) {
    // (a lamp of a realm that has been left: its place was in that realm's own coordinates, and it lights nothing here)
    if (x.ctx !== ctx || now - x.at > 500) { offers.delete(l); continue; }
    if (!best || x.w > best.w) { if (best) next = Math.max(next, best.w); best = x; } else next = Math.max(next, x.w);
  }
  const k = best.w > 0 ? Math.min(1, (best.w - next) / best.w * 4) : 0;
  S.uLampPos.value.copy(best.pos); S.uLampRadius.value = best.reach; S.uLampColor.value.copy(best.color).multiplyScalar(k);
}

/**
 * A single mote of flame that drifts from one point to another (the flame crossing between lamps): a small flame
 * with its own glow, drawn in the mirror too, lighting the painted things it passes.
 * from, to: THREE.Vector3 in local coordinates, or functions returning one (for a moving target such as the bow lantern).
 * Returns a promise that resolves when it arrives. `arrived` (optional) is called in the very frame it arrives: a
 * promise's `then` comes a frame later, and in a strip taken with tools/shot.py only at the next picture. Having
 * arrived, the mote sinks into the lamp it came to over two thirds of a second, while that lamp's own flame comes up.
 */
export function flameCrossing(engine, ctx, from, to, seconds = 5, arrived = null) {
  const get = (p) => (typeof p === 'function' ? p() : p);
  // (a MOTE: a flame's worth of light. Its glow was half as wide again as the bow lantern's own, and leaving that lantern,
  // under three metres from the rider's eye, it was a glare that filled a third of a night picture)
  // only the flame of it (flameOnly: its brass and glass are never shown, not even in the frame its model arrives: a
  // whole lantern once flew across one picture of a strip), a little larger than life so that it reads across fourteen
  // metres of water
  const mote = buildStormLantern(engine, { halo: 0.42, shine: 0.36, seed: 5, flameOnly: true });
  mote.shine.layers.set(0);                                           // its bright heart is seen directly too: a spark that can be followed across the water
  mote.group.scale.setScalar(1.7);
  ctx.add(mote.group);
  const light = ctx.light ? ctx.light({ position: [0, 0, 0], color: LAMP_AMBER, radius: 3.2, intensity: 0.9 }) : null;
  const a = get(from).clone(), prev = a.clone();
  let t = 0, tail = 0;
  const gone = () => {
    ctx.group.remove(mote.group); for (const m of mote.materials) m.dispose();
    mote.group.traverse((x) => { if (x.geometry && x.geometry !== haloGeo) x.geometry.dispose(); });
    if (light) light.on = false;
  };
  return new Promise((resolve) => {
    ctx.onUpdate((dt) => {
      if (tail >= 1) return;
      if (t >= 1) {
        // it has arrived (the promise is kept: the lamp it came to is being lit): it sinks into that lamp's own flame
        // and is gone in two thirds of a second, so that there is never a breath with no flame at all
        tail = Math.min(1, tail + dt / 0.7);
        const b = get(to), k = 1 - tail, size = 1 + 0.7 * k;
        mote.group.scale.setScalar(size); mote.group.position.set(b.x, b.y + FLAME_DROP * size, b.z); mote.wind.set(0, 0, 0);
        mote.setLevel(1.15 * 0.6 * k * k, 1);
        if (light) { light.position.copy(b); light.intensity = 0.9 * 0.6 * k; }
        if (tail >= 1) gone();
        return;
      }
      t = Math.min(1, t + dt / seconds);
      const e = t * t * (3 - 2 * t), b = get(to);
      _v.lerpVectors(a, b, e);
      _v.y += Math.sin(e * Math.PI) * 0.6 + Math.sin(t * 9.0) * 0.03 * (1 - e);        // a slow arc, with a little waver
      // never in the rider's face: it goes round the head, and over it
      { const cam = engine.shared.uCameraPos.value; _w.subVectors(_v, cam); const dc = _w.length(); if (dc < 0.9) { _w.y += 0.25; _w.setLength(0.9); _v.copy(cam).add(_w); } }
      // the flame's middle is 0.2 below the lantern's origin, at the mote's scale
      mote.group.position.set(_v.x, _v.y + FLAME_DROP * 1.7, _v.z);
      // it leans back from the way it travels
      mote.wind.subVectors(prev, _v).multiplyScalar(dt > 0 ? 0.45 / dt : 0); if (mote.wind.length() > 1.2) mote.wind.setLength(1.2);
      prev.copy(_v);
      const s = 0.85 + 0.15 * Math.sin(t * 40.0), fade = Math.min(1, t * 8) * Math.min(1, (1 - t) * 10 + 0.6);
      mote.setLevel(1.15 * fade, s);
      if (light) { light.position.copy(_v); light.intensity = 0.9 * fade; }
      if (t >= 1) { if (arrived) { try { arrived(); } catch (err) { console.error(err); } } resolve(); }
    });
  });
}
