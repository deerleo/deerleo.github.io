// The dyers' reach: THE SKIN OF THE HOUSES (the indigo house, the cloth loft, the west front, the west door, the lamp's
// standing; heroes_b.js; docs/build/reach/2-heroes-houses.md, "Second look").
//
// The houses' models are vertex paint on modelled timber, stone and shingle. Paint alone is smooth: at 3 m a post is a
// pipe and a stone step is soap. This lays the area's painted tiles (assets/art/reach/timber_oak, timber_stone,
// timber_shingle: source-art/reach/timber.png, the yards' picture) over that paint, and draws the water's marks, so that
// the houses are made of the same stuff as the yards' walls beside them.
//
//   timber   (slot `paint`)  the oak tile laid BY THE GRAIN. Each timber's own direction travels in the alpha of its
//                            paint (hh_lib.encode in the models' scripts: the long axis of every loose piece), so a post's
//                            grain runs up it, a tie beam's along it, a rafter's up the slope; the tile's checks and nail
//                            runs follow. Sawn ends are darker. Alpha's special code: no grain (iron, cloth).
//   stone    (slot `stone`)  the stone tile from three sides (the model's own axes); its painted runs of red and blue
//                            shown in the place's two dyes, as the yards do.
//   roof     (slot `roof`)   the shingle tile: across by the model's ridge direction, up the slope by the metres that
//                            travel in the paint's alpha (hh_lib.set_v), so the painted rows follow a roof that sags.
//   the water's marks        on timber and stone within a metre of the water: three levels the river has stood at, each
//                            a wash below its line and darkest AT its line, wicking upward in fingers; the lowest in the
//                            bank's own dye, the highest in the other bank's (the page's order); wet and dark below
//                            them, green at the very water. (The yards' marks, kit_yards.js: the same hand.)
//
// The tile multiplies the paint and is divided by its own mean, so a model's calibrated colours keep their value.
// Everything is laid in the MODEL'S OWN SPACE (a moving part carries its grain with it).
//
// ALL OF IT IS IN THE FRAGMENT SHADER (third holder, 21:30). The sun's mask (light.js, `sweep`) takes only things whose
// vertex shader is the plain gouache one: the first version of this file passed the model's own space and the grain's
// code down from the vertex shader, and with that every house stood OUTSIDE the mask (a timber behind a glowing cloth
// would not have cut the sun's coin). Now the model's own space is worked back from the world position with the mesh's
// inverse matrix (`uHsInv`, set for each mesh as it is drawn: skin.dress(model)) and the code is read from the paint's
// alpha where it is used (every corner of one triangle carries the same code, so nothing is lost on the way).
//
//   const skin = await houseSkin(ctx, plan, shared);
//   const m = await kit.model(url, { ...WEAR, materials: skin.materials({ dyes: [INDIGO, MADDER], ridge: [1, 0, 0] }) });
//   skin.dress(m);                                  // REQUIRED: without it the tiles lie in the world's space, not the model's
//
// Switches for looking: &hskin=0 the paint alone; &hskin=<0..1> the tiles' strength; &hcon=<1..2.5> their contrast;
// &hedge=0 without the last light on the edges, &hedge=2 twice as much.
import * as THREE from 'three';

const QS = typeof location !== 'undefined' ? new URLSearchParams(location.search) : new URLSearchParams('');
// the tiles' mean colours (linear), measured from the files: a tile is divided by its mean before it multiplies the paint
const MEAN = { oak: [0.1829, 0.0556, 0.0873], stone: [0.3879, 0.1274, 0.1513], shingle: [0.2136, 0.0603, 0.1158] };

// The paint's alpha (a normalised 16-bit number) carries a code (hh_lib.encode in the models' scripts):
//   timber: code * 4 + 2, code = azimuth (0..255) * 64 + elevation (0..62) of the grain, in the model's Blender axes
//           (elevation 63: no grain);   roof: metres up the slope / 16.
// HS_LOCAL: the model's own space and the code, worked out in the fragment shader (see the header).
const HS_LOCAL = /* glsl */`
    vec3 vHsP = (uHsInv * vec4(vWPos, 1.0)).xyz;
    vec3 vHsN = mat3(uHsInv) * N;
    #ifdef USE_COLOR_ALPHA
      float hsA = vColor.a;
    #else
      float hsA = 1.0;
    #endif
    #if HS_KIND == 2
      vec4 vHsAx = vec4(0.0, 1.0, 0.0, hsA * 16.0);
    #else
      float hsC = floor(hsA * 16383.75), hsAz = floor(hsC / 64.0), hsEl = hsC - hsAz * 64.0;
      float hsa = hsAz * 0.02454369, hse = hsEl * 0.02533543;                  // 2 pi / 256, (pi / 2) / 62
      // Blender (x, y, z) is the file's (x, z, -y)
      vec4 vHsAx = hsEl > 62.5 ? vec4(0.0, 1.0, 0.0, 0.0) : vec4(cos(hse) * cos(hsa), sin(hse), -cos(hse) * sin(hsa), 1.0);
    #endif`;

const FRAG_PARS = /* glsl */`
  uniform mat4 uHsInv; uniform vec4 uHsEdge, uHsIn; uniform vec3 uHsEdgeCol;
  uniform sampler2D tHs; uniform vec4 uHs; uniform vec3 uHsMean; uniform vec3 uHsDyeA, uHsDyeB; uniform vec4 uHsMark; uniform vec3 uHsRidge;
  float hsH(vec2 p) { p = fract(p * vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.y); }
  float hsNz(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(hsH(i), hsH(i + vec2(1.0, 0.0)), f.x), mix(hsH(i + vec2(0.0, 1.0)), hsH(i + vec2(1.0, 1.0)), f.x), f.y); }
  // a dye on stone or timber is a glaze (the ground shows through, darker and tinted) that thickens to the dye's own body
  vec3 hsDye(vec3 ground, vec3 dye, float a) {
    float g = pow(max(dot(ground, vec3(0.3333)), 1e-4), 0.4545);
    vec3 tint = dye / max(max(dye.r, max(dye.g, dye.b)), 1e-3);
    vec3 glaze = ground * (0.25 + 0.95 * tint), body = dye * (1.7 * g);
    return mix(ground, mix(glaze, body, 0.1 + 0.45 * a), a);
  }`;

// uHs: tile repeats per metre, the tile's strength, how much of the tile's own colour is kept (the rest its light and dark), its contrast (a power)
// uHsMark: the water's marks (strength, height: 1 = as the yards have them), the painted runs' strength on stone, 1 = the model stands on both banks
const ALBEDO = /* glsl */`
  {${HS_LOCAL}
    vec3 hn = normalize(vHsN);
    // (a model that stands on both banks: its +x side is the other bank, and the dyes change places there)
    bool hswap = uHsMark.w > 0.5 && vHsP.x > 0.0;
    vec3 hdA = hswap ? uHsDyeB : uHsDyeA, hdB = hswap ? uHsDyeA : uHsDyeB;
    #if HS_KIND == 0
      // ---- timber, by the grain: two faces of the timber's own box, blended; sawn ends take a little of both and are darker
      vec3 hax = normalize(vHsAx.xyz);
      vec3 he1 = normalize(cross(hax, abs(hax.y) < 0.9 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0))), he2 = cross(hax, he1);
      float hw1 = pow(abs(dot(hn, he1)), 4.0), hw2 = pow(abs(dot(hn, he2)), 4.0), hw3 = pow(abs(dot(hn, hax)), 4.0), hws = hw1 + hw2 + hw3 + 1e-5;
      float hal = dot(vHsP, hax);
      vec3 ht1 = texture2D(tHs, vec2(dot(vHsP, he2), hal) * uHs.x).rgb, ht2 = texture2D(tHs, vec2(dot(vHsP, he1), hal) * uHs.x).rgb;
      vec3 htx = (ht1 * (hw1 + 0.5 * hw3) + ht2 * (hw2 + 0.5 * hw3)) / hws / uHsMean;
      vec3 hm = pow(max(mix(vec3(dot(htx, vec3(0.3333))), htx, uHs.z), vec3(1e-3)), vec3(uHs.w));      // (a little harder than painted: at 8 m the grain was lost)
      float hon = vHsAx.w * uHs.y;
      albedo *= clamp(mix(vec3(1.0), hm, hon), 0.25, 2.4) * mix(1.0, 0.7, hon * hw3 / hws);
    #elif HS_KIND == 1
      // ---- stone, from three sides; its painted runs in the place's two dyes
      vec3 htx = tri(tHs, vHsP * uHs.x, hn) / uHsMean;
      albedo *= clamp(mix(1.0, dot(htx, vec3(0.3333)), uHs.y), 0.4, 1.8);
      float hrb = clamp((htx.b - htx.r - 0.15) * 1.6, 0.0, 1.0), hrr = clamp((htx.r - htx.g - 0.12) * 1.6 - hrb, 0.0, 1.0);
      float hg1 = smoothstep(0.3, 0.7, hsNz(vHsP.xz * 0.31 + 4.7)), hg2 = smoothstep(0.35, 0.75, hsNz(vHsP.xz * 0.27 + 13.1));
      albedo = hsDye(albedo, hdA, hrr * (0.15 + 0.85 * hg1) * uHsMark.z * uHs.y);      // (the tile's red runs in the bank's own dye, its blue runs in the other's: as the yards)
      albedo = hsDye(albedo, hdB, hrb * (0.1 + 0.9 * hg2) * uHsMark.z * uHs.y);
    #elif HS_KIND == 2
      // ---- shingles: across by the ridge's direction, up the slope by the metres carried in the paint's alpha
      vec3 htx = texture2D(tHs, vec2(dot(vHsP, uHsRidge), vHsAx.w) * uHs.x).rgb / uHsMean;
      vec3 hm = pow(max(mix(vec3(dot(htx, vec3(0.3333))), htx, uHs.z), vec3(1e-3)), vec3(uHs.w));
      albedo *= clamp(mix(vec3(1.0), hm, uHs.y * step(0.0, hn.y + 0.35)), 0.3, 2.2);      // (not on what looks down: the roof's underside)
    #endif
    #if HS_KIND != 2
      // ---- the water's marks: three levels, the lowest in the bank's own dye, the highest in the other bank's
      float hh = vWPos.y;
      if (hh < 1.05 && uHsMark.x > 0.0) {
        float hup = abs(N.y);
        vec2 hq = hup > 0.7 ? vWPos.xz : vec2(dot(vWPos.xz, normalize(vec2(N.z, -N.x) + 1e-5)), hh);
        float hf = hup > 0.7 ? hsNz(hq * 6.0) * 0.6 + hsNz(hq * 15.0 + 2.0) * 0.4 : hsNz(hq * vec2(9.0, 1.7)) * 0.6 + hsNz(hq * vec2(23.0, 3.1) + 7.3) * 0.4;
        float hn3 = hsNz(hq * 0.9 + 3.1), hlift = uHsMark.y;
        float he1m = (0.17 + 0.07 * hsNz(vec2(hq.x * 0.13, 1.7))) * hlift + 0.07 * (hf - 0.5);
        float he2m = (0.36 + 0.09 * hsNz(vec2(hq.x * 0.09, 9.3))) * hlift + 0.08 * (hf - 0.5);
        float he3m = (0.56 + 0.12 * hsNz(vec2(hq.x * 0.06, 21.7))) * hlift + 0.10 * (hf - 0.5);
        float hp2 = smoothstep(0.2, 0.42, hsNz(vec2(hq.x * 0.045, 31.0))), hp3 = smoothstep(0.3, 0.55, hsNz(vec2(hq.x * 0.037, 57.0)));
        float hflat = mix(1.0, 0.75, smoothstep(0.7, 0.95, hup));
        float ha3 = (1.0 - smoothstep(he3m - 0.012, he3m + 0.012, hh)) * hp3 * (0.16 + 0.42 * exp(-max(he3m - hh, 0.0) / 0.045));
        float ha2 = (1.0 - smoothstep(he2m - 0.012, he2m + 0.012, hh)) * hp2 * (0.2 + 0.42 * exp(-max(he2m - hh, 0.0) / 0.045));
        float ha1 = (1.0 - smoothstep(he1m - 0.012, he1m + 0.012, hh)) * (0.26 + 0.44 * exp(-max(he1m - hh, 0.0) / 0.045));
        float hunder = smoothstep(-0.45, -0.05, hh);                              // (under the water the marks are lost in weed)
        albedo = hsDye(albedo, hdB, ha3 * hflat * hunder * uHsMark.x);
        albedo = hsDye(albedo, 0.5 * (hdA + hdB), ha2 * hflat * hunder * uHsMark.x);
        albedo = hsDye(albedo, hdA, ha1 * hflat * hunder * uHsMark.x);
        float hwet = 1.0 - smoothstep(0.02, 0.1 + 0.08 * hf, hh);
        albedo *= mix(1.0, 0.62, hwet * uHsMark.x);
        float hslime = (1.0 - smoothstep(-0.02, 0.05 + 0.06 * hf, hh)) * smoothstep(-0.6, -0.1, hh);
        albedo = mix(albedo, vec3(0.042, 0.07, 0.028) * (0.6 + 0.8 * hn3), 0.42 * hslime * uHsMark.x);
      }
    #endif
  }`;

// THE LAST LIGHT (third holder). The houses stand against the sun: the loft dead against it for the last 35 m of the
// reach. Gouache's own `rim` is one fixed colour; this edge takes the SUN'S colour where the thing stands (gold in the
// lagoon, red at the loft, and the dyed light inside the bar, so that it agrees with the picture), on every face that
// is seen nearly edge-on by an eye that looks toward the light. uHsEdge: strength, power; uHsIn: inside a shed the
// edge fades (the model's own z from .. to, what is left of it inside, 1 = on).
const LIGHT = /* glsl */`
  if (uHsEdge.x > 0.0) {
    float hsE = pow(1.0 - clamp(abs(dot(N, V)), 0.0, 1.0), uHsEdge.y) * uHsEdge.x * smoothstep(-0.25, 0.65, dot(V, uKeyDir));
    #ifdef HS_SUN
      vec3 hsK = reachKey(vWPos, uKeyColor);
    #else
      vec3 hsK = uKeyColor;
    #endif
    if (uHsIn.w > 0.5) { float hsZ = (uHsInv * vec4(vWPos, 1.0)).z; hsE *= mix(uHsIn.z, 1.0, smoothstep(uHsIn.x, uHsIn.y, hsZ)); }
    c += uHsEdgeCol * hsK * hsE * (0.3 + 0.7 * albedo);
  }`;

/**
 * The houses' skin. Resolves to { materials(o), ready }.
 *   skin.materials({ dyes: [own, other], ridge: [x, y, z], marks, strength, more: { slot: {...} } })
 * gives kit.model's `materials` for the slots `paint`, `stone`, `roof` (and `rope`: crisp). `dyes`: the place's two dyes
 * on the dyer's scale (plan.dye.*), the bank's own first; `ridge`: which way the roof's ridge runs in the model's
 * Blender axes (default along x); `marks`: the water's marks' strength (0 for a thing that stands on dry land);
 * `bothBanks`: the model's +x side stands on the other bank (the two dyes change places there); `roofTint`: a colour
 * the roof's paint is multiplied by; `shingle`: metres to a repeat of the shingle tile (four painted rows); `stone`: metres
 * to a repeat of the stone tile (2.4, the yards'; less for stone the boat passes at arm's length);
 * `edge`: { strength, power, color, inside: [zFrom, zTo, left] }: the last light on what is seen edge-on against the sun
 * (LIGHT, above); `inside`: in the model's own z (the file's: -Blender y) the edge fades from zTo to zFrom, down to `left`.
 */
export async function houseSkin(ctx, plan, shared) {
  const want = QS.get('hskin'), amount = want === null ? 1 : Math.max(0, +want || 0);
  const edgeK = QS.has('hedge') ? Math.max(0, +QS.get('hedge') || 0) : 1;                  // &hedge=0: without the last light on the houses' edges; &hedge=2: twice as much
  let tex = { oak: null, stone: null, shingle: null };
  if (amount > 0) {
    try {
      const [oak, stone, shingle] = await Promise.all(['timber_oak', 'timber_stone', 'timber_shingle'].map((n) => ctx.tex(`art/reach/${n}.webp`, { repeat: true })));
      tex = { oak, stone, shingle };
    } catch (e) { console.error('reach/house_skin: the timber tiles did not load: ' + e); }
  }
  const stains = (plan.yards && plan.yards.stain) || ['#E6CC98', '#EE9A1E', '#C43A26', '#A4163A', '#6E3090', '#2C3E8A'];
  const sunExt = shared.sun ? shared.sun.extend : null;
  const ext = (kind, o) => {
    const t = kind === 0 ? tex.oak : kind === 1 ? tex.stone : tex.shingle, mean = kind === 0 ? MEAN.oak : kind === 1 ? MEAN.stone : MEAN.shingle;
    const per = kind === 0 ? 1 / 1.7 : kind === 1 ? 1 / (o.stone || 2.4) : 1 / (o.shingle || 2.0);      // a tile's repeats per metre (the yards': oak 1.7 m, stone 2.4 m; `stone`: metres to a repeat of the stone tile, for stone that is seen at arm's length)
    const strength = t ? amount * (o.strength ?? 1) * (kind === 0 ? 0.85 : kind === 1 ? 0.8 : 0.9) : 0;
    const dyes = o.dyes || [plan.dye.INDIGO, plan.dye.MADDER], rd = o.ridge || [1, 0, 0], ed = o.edge || {};
    return {
      defines: sunExt ? { HS_KIND: kind, HS_SUN: 1 } : { HS_KIND: kind },
      uniforms: {
        tHs: { value: t }, uHs: { value: new THREE.Vector4(per, strength, kind === 0 ? 0.55 : kind === 2 ? 0.6 : 0, QS.has('hcon') ? +QS.get('hcon') : kind === 0 ? 1.7 : 1.35) }, uHsMean: { value: new THREE.Vector3(...mean) },
        uHsDyeA: { value: new THREE.Color(stains[dyes[0]]) }, uHsDyeB: { value: new THREE.Color(stains[dyes[1]]) },
        uHsMark: { value: new THREE.Vector4(o.marks ?? 1, o.lift ?? 1, o.runs ?? 0.6, o.bothBanks ? 1 : 0) },
        uHsRidge: { value: new THREE.Vector3(rd[0], rd[2], -rd[1]).normalize() },      // Blender (x, y, z) is the file's (x, z, -y)
        uHsInv: { value: new THREE.Matrix4() },                                        // world -> the mesh's own space (skin.dress sets it as each mesh is drawn)
        uHsEdge: { value: new THREE.Vector4(edgeK * (ed.strength ?? 0) * (kind === 2 ? (ed.roof ?? 1) : 1), ed.power ?? 3, 0, 0) }, uHsEdgeCol: { value: new THREE.Color(ed.color || '#ffffff') },
        uHsIn: { value: ed.inside && kind !== 2 ? new THREE.Vector4(ed.inside[0], ed.inside[1], ed.inside[2] ?? 0, 1) : new THREE.Vector4(0, 0, 0, 0) },
      },
      fragmentPars: FRAG_PARS, albedo: ALBEDO, light: LIGHT,
    };
  };
  /** After kit.model: give every mesh of the model its own space as it is drawn (the body, and each moving part with its own
   *  pivot and turn). One matrix inverted per mesh per pass; the uniform is the material's, so it is sent again for each mesh. */
  const dress = (model) => {
    model.group.traverse((o) => {
      if (!o.isMesh) return;
      const before = o.onBeforeRender;
      o.onBeforeRender = function (r, sc, cam, geo, m, grp) {
        if (before) before.call(this, r, sc, cam, geo, m, grp);
        const u = m && m.uniforms && m.uniforms.uHsInv;
        if (u) { u.value.copy(this.matrixWorld).invert(); m.uniformsNeedUpdate = true; }
      };
    });
    return model;
  };
  return {
    amount, dress,
    /** kit.model's `materials` for one model (every call makes its own uniforms: each model has its own dyes). */
    materials(o = {}) {
      const both = (e) => (sunExt ? [sunExt, e] : e);
      return { paint: { extend: both(ext(0, o)) }, stone: { extend: both(ext(1, o)) }, roof: { extend: both(ext(2, o)), ...(o.roofTint ? { color: o.roofTint } : {}) }, rope: { crisp: true }, ...(o.more || {}) };
    },
  };
}
