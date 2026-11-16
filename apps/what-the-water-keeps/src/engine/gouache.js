// Gouache: the one material every built (3D) thing in the ride wears, so a post, a wall and a painted flat beside
// them all take the same light. It is matte opaque paint:
//   - a three-stop painted ramp instead of smooth shading: the realm's shadow colour, the thing's own colour, the
//     realm's light colour, with soft dry-brushed steps between them;
//   - one key light (unshadowed, wrapped) and a soft sky/ground ambient, both set by the realm's `look.light`;
//   - the lights that travel: the lantern on the boat's bow, the realm's kept lamp, and up to eight of the realm's
//     own local lights (ctx.light: the nearest and strongest are chosen every frame);
//   - a shared dry-brush stroke texture projected from three sides, which breaks up flat colour and the edges
//     between the ramp's steps, plus an optional painted texture of the thing's own;
//   - optional water-light (caustics) on surfaces near the waterline, which can follow how disturbed the water is;
//   - optional backlight, for cloth and leaves that glow when they hang between the eye and the light;
//   - optional rim light, for things that stand against the light and are edged with it.
// No specular, no gloss: only the water and the lamps shine.
// It also dresses skinned meshes (rigged creatures loaded with kit.animated: see src/engine/models.js): nothing to
// ask for, the same material works on a Mesh, an InstancedMesh and a SkinnedMesh.
//
// A realm or a creature that needs something of its own (wings that flap in the vertex shader, reeds that lean away
// from the hull, a town lit from under the water, a line of first light that climbs a wall) does not write a new
// material: it EXTENDS this one, so that light, fog, veil and brushwork stay those of the ride. See `extend` below.
import * as THREE from 'three';

const col = (c) => (c && c.isColor ? c : new THREE.Color(c ?? 0xffffff));
export const MAX_LIGHTS = 8;

let _caustic = null;
/** A tileable picture of water caustics (the bright web rippling water throws on things), made once in code. R channel: the square root of the brightness / 4. */
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

/** Uniforms shared by every gouache material; the realm manager fills them from the realm's `look.light`. */
export function gouacheShared(engine) {
  if (engine.shared.uKeyDir) return engine.shared;
  Object.assign(engine.shared, {
    uKeyDir: { value: new THREE.Vector3(-0.3, -0.5, -0.8).normalize() },       // direction the key light travels
    uKeyColor: { value: new THREE.Color(1, 1, 1) },                            // multiplies the lit side
    uRampShadow: { value: new THREE.Color(0.25, 0.22, 0.4) },                  // colour the unlit side is pulled to
    uRampLight: { value: new THREE.Color(1.2, 1.1, 0.95) },                    // tint of the fully lit step
    uSkyLight: { value: new THREE.Color(0.25, 0.3, 0.5) }, uGroundLight: { value: new THREE.Color(0.1, 0.08, 0.12) },
    uLanternPos: { value: new THREE.Vector3(0, -100, 0) }, uLanternColor: { value: new THREE.Color(0, 0, 0) }, uLanternRadius: { value: 7 },
    uLampPos: { value: new THREE.Vector3(0, -100, 0) }, uLampColor: { value: new THREE.Color(0, 0, 0) }, uLampRadius: { value: 12 },
    // the realm's own local lights (ctx.light): position and radius, colour, how many are set this frame
    uLights: { value: Array.from({ length: MAX_LIGHTS }, () => new THREE.Vector4(0, -1000, 0, 1)) },
    uLightColors: { value: Array.from({ length: MAX_LIGHTS }, () => new THREE.Color(0, 0, 0)) },
    uLightCount: { value: 0 },
    tBrush: { value: null }, uBrushScale: { value: 1 / 3.2 }, tCaustic: { value: causticTexture() },
    tRipple: { value: null }, uRippleRect: { value: new THREE.Vector4(0, 0, 64, 64) },   // xz centre, size: where the ripple field lies in the world
    uHeightFog: { value: new THREE.Vector2(0, 6) },                            // extra fog near the water: amount, height it fades over
  });
  // the shared dry-brush tile loads once; until then a flat grey stands in
  const flat = new THREE.DataTexture(new Uint8Array([128, 128, 128, 255]), 1, 1); flat.needsUpdate = true; flat.userData.shared = true;
  engine.shared.tBrush.value = flat;
  engine.loadTexture('art/shared/drybrush.webp', { repeat: true }).then((t) => { t.userData.shared = true; engine.shared.tBrush.value = t; }).catch(() => {});
  return engine.shared;
}

const VERT = /* glsl */`
  #include <common>
  #include <uv_pars_vertex>
  #include <color_pars_vertex>
  #include <skinning_pars_vertex>
  uniform float uTime; uniform vec4 uWind;                   // xz direction, strength, speed (for 'sway')
  uniform vec3 uCameraPos; uniform vec3 uBoat;               // the rider's eye and the boat (x, 0, z), in world space
  varying vec3 vWPos; varying vec3 vWNormal; varying vec3 vViewPos; varying vec2 vUv0;
  //@vertexPars
  void main() {
    #include <color_vertex>
    vUv0 = uv;
    vec3 transformed = position; vec3 objectNormal = normal;
    // a skinned mesh (a rigged creature from kit.animated) is posed by its bones here; for every other mesh these
    // three lines are empty (three.js defines USE_SKINNING only for a SkinnedMesh)
    #include <skinbase_vertex>
    #include <skinnormal_vertex>
    #include <skinning_vertex>
    //@vertexLocal
    vec4 wp = vec4(transformed, 1.0); vec3 wn = objectNormal;
    #ifdef USE_INSTANCING
      wp = instanceMatrix * wp; wn = mat3(instanceMatrix) * wn;
    #endif
    wp = modelMatrix * wp; wn = mat3(modelMatrix) * wn;
    #ifdef SWAY
      float sw = sin(uTime * uWind.w + wp.x * 0.21 + wp.z * 0.17) * 0.6 + sin(uTime * uWind.w * 0.43 + wp.z * 0.11 + 1.7) * 0.4;
      wp.xz += uWind.xy * uWind.z * sw * smoothstep(SWAY_FROM, SWAY_TO, wp.y);
    #endif
    //@vertexWorld
    vWPos = wp.xyz; vWNormal = normalize(wn);
    vec4 mv = viewMatrix * wp; vViewPos = mv.xyz;
    gl_Position = projectionMatrix * mv;
  }
`;

const FRAG = /* glsl */`
  #include <common>
  #include <color_pars_fragment>
  uniform vec3 uColor, uEmissive, uFogColor, uKeyDir, uKeyColor, uRampShadow, uRampLight, uSkyLight, uGroundLight;
  uniform vec3 uLanternPos, uLanternColor, uLampPos, uLampColor, uCameraPos, uBoat, uCausticColor, uBackColor, uRimColor;
  uniform float uFogDensity, uLanternRadius, uLampRadius, uBrush, uBrushScale, uTime, uOpacity, uTriScale, uBack, uSteps, uShade;
  uniform vec2 uHeightFog; uniform vec4 uCaustic, uRippleRect; uniform vec3 uRim;
  uniform vec4 uLights[${MAX_LIGHTS}]; uniform vec3 uLightColors[${MAX_LIGHTS}]; uniform int uLightCount;
  uniform sampler2D tBrush, tMap, tRipple, tCaustic;
  varying vec3 vWPos; varying vec3 vWNormal; varying vec3 vViewPos; varying vec2 vUv0;

  vec3 tri(sampler2D t, vec3 p, vec3 n) {
    vec3 bw = pow(abs(n), vec3(4.0)); bw /= (bw.x + bw.y + bw.z);
    return texture2D(t, p.zy).rgb * bw.x + texture2D(t, p.xz).rgb * bw.y + texture2D(t, p.xy).rgb * bw.z;
  }
  // two copies of the caustic web sliding across each other: the threads of both show, brightest where they cross,
  // the light seems to dance, and no repeat shows because their sizes never line up
  float causticAt(vec2 uv, float t) {
    float a = texture2D(tCaustic, uv + vec2(t * 0.20, t * 0.124)).r, b = texture2D(tCaustic, uv * 0.73 + vec2(-t * 0.172, t * 0.228) + 0.37).r;
    a *= a * 4.0; b *= b * 4.0;
    return max(a, b) * 0.5 + min(a, b) * 1.2;
  }
  vec3 pointLight(vec3 pos, vec3 color, float radius, vec3 N) {
    vec3 d = pos - vWPos; float dist = length(d);
    float att = 1.0 - smoothstep(radius * 0.25, radius, dist); att *= att;
    float nl = dot(N, d / max(dist, 1e-3)) * 0.6 + 0.4;                           // wrapped: paint near a lamp warms even when turned a little away
    return color * att * max(nl, 0.0);
  }
  //@fragmentPars
  void main() {
    vec3 N = normalize(vWNormal);
    if (!(dot(N, N) > 0.25)) N = vec3(0.0, 1.0, 0.0);              // normals that cancel at the tip of a thin thing would give a black pixel
    #ifdef FLAT_SHADED
      N = normalize(cross(dFdx(vWPos), dFdy(vWPos)));
    #endif
    #ifdef DOUBLE_SIDED
      if (!gl_FrontFacing) N = -N;
    #endif
    // ---- local colour: the thing's own colour, its painted texture, and the shared dry-brush strokes
    vec3 albedo = uColor;
    #ifdef USE_COLOR
      albedo *= vColor.rgb;
    #endif
    float alpha = uOpacity;
    #ifdef USE_MAP_UV
      vec4 tx = texture2D(tMap, vUv0); albedo *= tx.rgb; alpha *= tx.a;
    #endif
    #ifdef USE_MAP_TRI
      albedo *= tri(tMap, vWPos * uTriScale, N);
    #endif
    //@albedo
    #ifdef CUTOUT
      if (alpha < 0.5) discard;
    #endif
    float brush = tri(tBrush, vWPos * uBrushScale, N).r;                           // about 0.42 .. 0.62
    float stroke = clamp((brush - 0.52) * 5.0, -1.0, 1.0);
    albedo *= 1.0 + stroke * 0.16 * uBrush;

    // ---- the painted ramp: shadow, local, light, with dry-brushed steps
    float w = dot(N, -uKeyDir) * 0.5 + 0.5;                                        // 0 turned away .. 1 facing the light
    w = clamp(w + stroke * 0.10 * uBrush, 0.0, 1.0);
    float steps = max(uSteps, 1.0);
    float q = floor(w * steps) / steps, f = fract(w * steps);
    w = mix(w, q + smoothstep(0.42, 0.58, f) / steps, 0.85);                       // mostly flat steps, a little roundness left
    vec3 shade = w < 0.5 ? mix(uRampShadow, vec3(1.0), smoothstep(0.0, 0.5, w)) : mix(vec3(1.0), uRampLight * uKeyColor, smoothstep(0.5, 1.0, w));
    vec3 ambient = mix(uGroundLight, uSkyLight, N.y * 0.5 + 0.5);
    vec3 c = albedo * mix(vec3(1.0), shade, uShade) + albedo * ambient;

    // ---- the lights that travel: the bow lantern, the realm's kept lamp, and the realm's local lights
    vec3 lamps = pointLight(uLanternPos, uLanternColor, uLanternRadius, N) + pointLight(uLampPos, uLampColor, uLampRadius, N);
    for (int i = 0; i < ${MAX_LIGHTS}; i++) { if (i >= uLightCount) break; lamps += pointLight(uLights[i].xyz, uLightColors[i], uLights[i].w, N); }
    c += albedo * lamps;

    // ---- backlight: cloth and leaves glow when they hang between the eye and the light
    vec3 V = normalize(uCameraPos - vWPos);
    #ifdef BACKLIGHT
      float through = pow(max(dot(V, uKeyDir), 0.0), 2.5) * (0.35 + 0.65 * abs(dot(N, uKeyDir)));
      c += albedo * uBackColor * through * uBack;
    #endif
    // ---- rim: an edge of light on things that stand against it (uRim: strength, power, how much it needs the eye to face the light)
    #ifdef RIM
      float rimEdge = pow(1.0 - clamp(abs(dot(N, V)), 0.0, 1.0), uRim.y);
      c += uRimColor * rimEdge * uRim.x * mix(1.0, smoothstep(-0.25, 0.65, dot(V, uKeyDir)), uRim.z) * (0.3 + 0.7 * albedo);
    #endif

    // ---- water-light near the waterline: the caustic web from three sides, blended (no seams, no stretching)
    #ifdef CAUSTICS
      float band = smoothstep(uCaustic.w, 0.0, vWPos.y) * smoothstep(-2.5, -0.2, vWPos.y);
      vec3 cw = pow(abs(N), vec3(4.0)); cw /= (cw.x + cw.y + cw.z);
      vec3 cq = vWPos * uCaustic.y; float ct = uTime * uCaustic.z;
      float cst = min(causticAt(cq.zy, ct) * cw.x + causticAt(cq.xz, ct) * cw.y + causticAt(cq.xy, ct) * cw.z, 4.0);
      float lively = 1.0;
      #ifdef CAUSTICS_RIPPLE
        vec2 ruv = (vWPos.xz - uRippleRect.xy) / uRippleRect.zw + 0.5;
        float e = (ruv.x > 0.0 && ruv.x < 1.0 && ruv.y > 0.0 && ruv.y < 1.0) ? texture2D(tRipple, ruv).a : 0.0;   // alpha = how disturbed the water is there
        lively = CAUSTICS_BASE + (1.0 - CAUSTICS_BASE) * clamp(e * 4.0, 0.0, 1.0);
      #endif
      c += uCausticColor * cst * uCaustic.x * band * lively * (0.35 + 0.65 * albedo);
    #endif

    vec3 glow = uEmissive;                                                         // light the thing gives off (above 1 it blooms)
    //@light
    c += glow;
    // ---- fog by distance, thicker near the water if the realm asks
    float dist = length(vViewPos);
    float fog = 1.0 - exp(-uFogDensity * uFogDensity * dist * dist);
    fog = clamp(fog + uHeightFog.x * exp(-max(vWPos.y, 0.0) / max(uHeightFog.y, 0.01)) * smoothstep(4.0, 40.0, dist), 0.0, 1.0);
    //@fog
    gl_FragColor = vec4(mix(c, uFogColor, fog), alpha);
    #ifdef CRISP
      gl_FragColor.a = -15.0;                                // the mark that tells the painter's filter to leave this pixel as it is (CRISP_ALPHA; src/engine/post.js)
    #endif
    //@final
  }
`;

/** What a material writes to gl_FragColor.a to keep out of the painter's filter (opaque materials only): see `crisp`. */
export const CRISP_ALPHA = -15;

const HOOKS_V = ['vertexPars', 'vertexLocal', 'vertexWorld'], HOOKS_F = ['fragmentPars', 'albedo', 'light', 'fog', 'final'];

/**
 * A gouache material. opts:
 *   color                   the thing's own colour (default white)
 *   map                     its painted texture, used with the mesh's UVs
 *   triplanar               metres per repeat: project `map` from three sides in world space instead (no UVs needed)
 *   brush                   0..1 strength of the shared dry-brush strokes (default 0.7)
 *   shade                   0..1 how much the realm's light ramp applies (default 1; 0 = flat local colour)
 *   steps                   number of flat steps in the ramp (default 3)
 *   emissive, emissiveIntensity   paint that gives off light (windows, flames); above 1 it blooms
 *   caustics                true or { intensity, scale, speed, height, color, ripple, base }: water-light near the waterline;
 *                           ripple: true makes it follow how disturbed the water is nearby (base = strength on still water, 0..1)
 *   backlight               0..1: glows when between the eye and the key light (cloth, thin leaves); backColor tints it
 *   rim                     true or { color, strength 0.8, power 3, toward 1 }: an edge of light round the silhouette.
 *                           toward 1 = only when the rider looks toward the key light (things against the sun);
 *                           toward 0 = all round (a creature edged with its own glow)
 *   sway                    { strength, speed, from, to, dir: [x, z] }: sways in the wind above height `from`, fully by `to`
 *   side, flat, vertexColors, cutout (alpha-tested map), transparent + opacity
 *   crisp                   true: the painter's filter leaves it alone. For THIN things only (lines, rails, rigging, twigs, far masts,
 *                           small far creatures), which the filter would otherwise wipe out or thicken into blots; broad surfaces
 *                           should stay painted. Not for blended (transparent) materials
 *   extend                  one extension or a list of them: your own GLSL at fixed places in this shader, so that a
 *                           special thing still takes the ride's light, fog and brushwork. Each is
 *                             { defines: {NAME: value}, uniforms: {uName: {value}},
 *                               vertexPars:  declarations (attributes, uniforms, varyings, functions) for the vertex shader,
 *                               vertexLocal: code in the object's own space, after skinning and before instancing: change
 *                                            `transformed` (vec3 position) and `objectNormal` (a wing beat, a body wave),
 *                               vertexWorld: code in world space: change `wp.xyz` (the world position) and `wn` (the normal,
 *                                            not yet normalised): leaning away from the hull, rocking on a ripple,
 *                               fragmentPars: declarations for the fragment shader,
 *                               albedo:      change `albedo` (vec3) and `alpha` (float) before any light falls on them
 *                                            (N is the normal, vWPos the world position, vUv0 the UV, vColor the vertex
 *                                            or instance colour when the mesh has one),
 *                               light:       after all lighting: change `c` (the lit colour) or add to `glow` (light the
 *                                            thing gives off); `albedo`, `N`, `V` (toward the eye), `w` (0 turned away
 *                                            from the key light .. 1 facing it) are there to read,
 *                               fog:         change `fog` (0..1) before it is applied,
 *                               final:       last word on gl_FragColor }
 *                           Already declared for you in both shaders: uTime, uCameraPos, uBoat (x, 0, z of the boat);
 *                           in the vertex shader: the varyings vWPos, vWNormal, vUv0. Extensions with the same text
 *                           share one compiled program however many materials use them.
 */
export function makeGouache(engine, opts = {}) {
  const S = gouacheShared(engine);
  const o = { color: '#ffffff', map: null, triplanar: 0, brush: 0.7, shade: 1, steps: 3, emissive: '#000000', emissiveIntensity: 1, caustics: null, backlight: 0, backColor: '#ffffff', rim: null, sway: null,
    side: THREE.FrontSide, flat: false, vertexColors: false, cutout: false, transparent: false, opacity: 1, crisp: false, extend: null, ...opts };
  const ca = o.caustics ? { intensity: 0.5, scale: 0.35, speed: 0.6, height: 4, color: '#bfe6ff', ripple: false, base: 0.25, ...(o.caustics === true ? {} : o.caustics) } : null;
  const rim = o.rim ? { color: '#ffffff', strength: 0.8, power: 3, toward: 1, ...(o.rim === true ? {} : o.rim) } : null;
  const defines = {};
  if (o.map && o.triplanar) defines.USE_MAP_TRI = ''; else if (o.map) defines.USE_MAP_UV = '';
  if (o.flat) defines.FLAT_SHADED = '';
  if (o.side === THREE.DoubleSide) defines.DOUBLE_SIDED = '';
  if (o.cutout) defines.CUTOUT = '';
  if (o.crisp && !o.transparent) defines.CRISP = '';
  if (o.backlight > 0) defines.BACKLIGHT = '';
  if (rim) defines.RIM = '';
  if (ca) { defines.CAUSTICS = ''; if (ca.ripple) { defines.CAUSTICS_RIPPLE = ''; defines.CAUSTICS_BASE = Number(ca.base).toFixed(3); } }
  if (o.sway) { defines.SWAY = ''; defines.SWAY_FROM = Number(o.sway.from ?? 1).toFixed(2); defines.SWAY_TO = Number(o.sway.to ?? 8).toFixed(2); }
  if (o.map && o.triplanar) { o.map.wrapS = o.map.wrapT = THREE.RepeatWrapping; o.map.needsUpdate = true; }
  const sw = o.sway || {};
  const uniforms = {
    uTime: S.uTime, uFogColor: S.uFogColor, uFogDensity: S.uFogDensity, uCameraPos: S.uCameraPos, uBoat: S.uBoat,
    uKeyDir: S.uKeyDir, uKeyColor: S.uKeyColor, uRampShadow: S.uRampShadow, uRampLight: S.uRampLight, uSkyLight: S.uSkyLight, uGroundLight: S.uGroundLight,
    uLanternPos: S.uLanternPos, uLanternColor: S.uLanternColor, uLanternRadius: S.uLanternRadius, uLampPos: S.uLampPos, uLampColor: S.uLampColor, uLampRadius: S.uLampRadius,
    uLights: S.uLights, uLightColors: S.uLightColors, uLightCount: S.uLightCount,
    tBrush: S.tBrush, uBrushScale: S.uBrushScale, tCaustic: S.tCaustic, tRipple: S.tRipple, uRippleRect: S.uRippleRect, uHeightFog: S.uHeightFog,
    uColor: { value: col(o.color).clone() }, uEmissive: { value: col(o.emissive).clone().multiplyScalar(o.emissiveIntensity) }, uOpacity: { value: o.opacity },
    uBrush: { value: o.brush }, uShade: { value: o.shade }, uSteps: { value: o.steps }, tMap: { value: o.map }, uTriScale: { value: o.triplanar ? 1 / o.triplanar : 1 },
    uBack: { value: o.backlight }, uBackColor: { value: col(o.backColor).clone() },
    uRim: { value: rim ? new THREE.Vector3(rim.strength, rim.power, rim.toward) : new THREE.Vector3() }, uRimColor: { value: col(rim ? rim.color : '#ffffff').clone() },
    uCaustic: { value: ca ? new THREE.Vector4(ca.intensity, ca.scale, ca.speed, ca.height) : new THREE.Vector4() }, uCausticColor: { value: col(ca ? ca.color : '#ffffff').clone() },
    uWind: { value: new THREE.Vector4(sw.dir ? sw.dir[0] : 1, sw.dir ? sw.dir[1] : 0.3, sw.strength ?? 0.25, sw.speed ?? 0.5) },
  };
  let vert = VERT, frag = FRAG;
  for (const ex of [].concat(o.extend || [])) {
    if (!ex) continue;
    for (const h of HOOKS_V) if (ex[h]) vert = vert.replace(`//@${h}`, `${ex[h]}\n    //@${h}`);
    for (const h of HOOKS_F) if (ex[h]) frag = frag.replace(`//@${h}`, `${ex[h]}\n    //@${h}`);
    if (ex.defines) Object.assign(defines, ex.defines);
    if (ex.uniforms) Object.assign(uniforms, ex.uniforms);
  }
  const mat = new THREE.ShaderMaterial({ defines, vertexShader: vert, fragmentShader: frag, side: o.side, vertexColors: o.vertexColors, transparent: o.transparent, alphaToCoverage: o.cutout && !o.crisp, uniforms });
  mat.isGouache = true;
  return mat;
}

/** Light for gouache: a realm's `look.light`, already resolved to colours by the realm manager. Missing parts keep their defaults. */
export function applyGouacheLight(engine, light = {}) {
  const S = gouacheShared(engine);
  if (light.key) S.uKeyDir.value.set(light.key[0], light.key[1], light.key[2]).normalize();
  if (light.keyColor) S.uKeyColor.value.copy(light.keyColor);
  if (light.shadow) S.uRampShadow.value.copy(light.shadow);
  if (light.lit) S.uRampLight.value.copy(light.lit);
  if (light.sky) S.uSkyLight.value.copy(light.sky);
  if (light.ground) S.uGroundLight.value.copy(light.ground);
  if (typeof light.lanternRadius === 'number') S.uLanternRadius.value = light.lanternRadius;
  if (typeof light.heightFog === 'number') S.uHeightFog.value.x = light.heightFog;
  if (typeof light.heightFogOver === 'number') S.uHeightFog.value.y = light.heightFogOver;
}

const _lp = [];
/**
 * Fill the local-light uniforms from a realm's list of lights ([{position: Vector3, color: Color, radius, intensity, on}]).
 * The eight that matter most from where the rider is are used; one that is about to drop out of the eight fades
 * first, so nothing pops. Called by the realm manager every frame.
 */
export function applyGouacheLights(engine, lights) {
  const S = gouacheShared(engine), cam = S.uCameraPos.value;
  _lp.length = 0;
  if (lights) for (const l of lights) {
    if (l.on === false || !(l.intensity > 0) || !(l.radius > 0)) continue;
    l._score = l.intensity * l.radius / (1 + cam.distanceToSquared(l.position) / (l.radius * l.radius * 9));
    _lp.push(l);
  }
  if (_lp.length > MAX_LIGHTS) _lp.sort((a, b) => b._score - a._score);
  const cut = _lp.length > MAX_LIGHTS ? _lp[MAX_LIGHTS]._score : 0;
  const n = Math.min(MAX_LIGHTS, _lp.length);
  for (let i = 0; i < n; i++) {
    const l = _lp[i], k = cut > 0 ? Math.min(1, Math.max(0, (l._score - cut) / (0.3 * l._score + 1e-6))) : 1;
    S.uLights.value[i].set(l.position.x, l.position.y, l.position.z, l.radius);
    S.uLightColors.value[i].copy(l.color).multiplyScalar(l.intensity * k);
  }
  S.uLightCount.value = n;
}
