// The theatre of leaves: the kit at the water. Stage 2, "the kit and the close band" (log: docs/build/theatre/2-kit-floor.md).
//
// What is here, each a hand-made model from source-art/models/theatre/ (their scripts say how each is made):
//   the 34 boxes at water level in five designs (parterre_box_a..e) and the pier on every joint (parterre_pier_a, _b)
//   chairs standing in the boxes to their seats; things left behind (trinkets); the drowned stalls (seat);
//   the fallen sky (dome_fragment_a..f); ferns seeded in the plaster; the foyer's rosettes, balusters and lamp standards
// Everything repeated is instanced (kit.models: one draw call per kind and slot). The stand-ins these replace live in
// kit.js (someone else's file): they are taken out from here with removeStandIn once the real thing stands.
//
// HOW A BOX IS SET. plan.parterreBoxes gives every box with its middle on the box-front line. Here each box is set as
// a CHORD between the two points of the line where its piers stand (`bays` below), so that its long members end
// exactly in the piers; a pier stands on every joint and is turned to the line there. A piece's own space, as the ride
// sees a model: x along the front, y up, z into the room (Blender's -y). `frame.at(x, y, z)` turns a place in a box's
// own space into the realm's (chairs, things on the rail, perches).
//
// Developer switches (with ?realm=theatre):  &kf=boxes,chairs  build only these of this module's parts;  &kfdesign=c  every box the same design
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { removeStandIn } from '../../engine/modules.js';
import { at, house, dev } from './lib.js';

const M = 'models/theatre/';
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// ================================================================================================ surfaces
// One model here is many materials at once (gilt, velvet, silk, painted wood, wax). Its script numbers every face (the
// u of the `paint` slot's UVs: source-art/models/theatre/kf_lib.py), and this table says, for each number,
//   what it takes of the house's light. The house's own extension (lib.js, light.js) has one such set per MATERIAL
//     (uTake, uKeep); for these models the two are read from this table instead, per surface, so that a whole box is
//     one draw call and its velvet, gilt and silk still each answer the moon, the candles and the water as their kind does.
//     take: [water-light, candle rows, moon, room fill]      keep: [hue, dark, gleam, metal]   (light.js says what each is)
//   which painted swatch it wears (the page's generated picture `gilt`, cut in four by the tiers' builder: worn leaf,
//     velvet, damask, boards): swatch [layer, metres to a repeat, strength]. The swatch multiplies the model's own paint
//     about its mean, so the paint keeps its colour and gains the hand of the painting. Gilt, velvet and wood are laid
//     on from three sides in the house's own space (no two boxes wear alike); the damask is laid on a wall's own run
//     (the v of its UVs is metres along the wall), so that its figure is whole on walls that stand askew to the house.
const GILT_GLEAM = dev.has('kfgilt') ? Number(dev.get('kfgilt')) : 0.12;      // (the fourth hand: at the whole gleam a fluted shaft was a chrome tube with a white strip down it; &kfgilt=1 shows it. The sixth: at 0.45 it was still a bundle of glass rods, a pale blue streak down every arris on a body as dark as the box behind it; at 0.12 it is a fluted column of old gilt. &kfgilt=0.45 the fourth's)
const CARVED_HUE = dev.has('kfhue') ? Number(dev.get('kfhue')) : 0.45;
const SURFACES = [
  { name: 'plain',  take: [0.22, 1, 1, 1],   keep: [0.5, 1, 0.5, 0.1],    swatch: [3, 1.3, 0.45] },    // 0 painted woodwork, green-black
  { name: 'gilt',   take: [1, 1, 1, 1],      keep: [0.4, 1, GILT_GLEAM, 1.0],    swatch: [0, 2.1, 0.8] },     // 1 (hue 0.4, where the tiers have 0.12: no candle ever burns at this level, and the page gives the house before the kindling 12 % tarnished gilt "seen only by water-light")
  { name: 'velvet', take: [0.25, 0.8, 1, 1], keep: [0.6, 1, 0.45, 0.12],  swatch: [1, 1.1, 0.7] },     // 2
  { name: 'damask', take: [0.06, 0.8, 1, 1], keep: [0.5, 1.7, 0.12, 0.1], swatch: [2, 1.3, 0.95] },    // 3 the silk lining of the boxes (it takes more of the room's dark than its value alone would give: its figure must read at the back of a box by the moon)
  { name: 'boards', take: [0, 0, 0.3, 0],    keep: [0.3, 0.8, 0.2, 0],    swatch: [3, 1.7, 0.8] },     // 4 floors under the water
  { name: 'wax',    take: [0.3, 1, 1, 1],    keep: [0.3, 1, 0.3, 0.1],    swatch: [0, 1, 0] },         // 5 wax, card: pale things
  { name: 'brass',  take: [1, 1, 1, 1],      keep: [0.2, 1, 0.9, 0.9],    swatch: [0, 1.1, 0.5] },     // 6
  { name: 'dark',   take: [0, 0, 0.2, 0.2],  keep: [0.2, 0.5, 0.05, 0],   swatch: [0, 1, 0] },         // 7 the dark beyond a door
  { name: 'glass',  take: [0.6, 1, 1, 1],    keep: [0.3, 1, 1.0, 0.5],    swatch: [0, 1, 0] },         // 8 old looking-glass, mother of pearl
  { name: 'stone',  take: [0.7, 1, 1, 1],    keep: [0.2, 1, 0.35, 0.08],  swatch: [0, 1, 0] },         // 9 stone and plaster
  { name: 'carved', take: [1, 1, 1, 1],      keep: [CARVED_HUE, 1, 0.06, 1.0],  swatch: [0, 1.7, 0.6] },     // 10 gilt carved in the round: leaves, shells, paterae (all but none of the wet gleam: at a third of it every leaf that looked up was a white cap, and the rail a row of teeth; without it the torus is old gold and bole, leaf over leaf)
  { name: 'silk',   take: [0.1, 0.8, 1, 1],  keep: [0.75, 1, 0.3, 0.15],  swatch: [2, 0.55, 0.5] },    // 11 coloured silk: a shawl, a fan's leaf (it keeps its colour in the dark, as the leaves do)
  { name: 'leaf',   take: [0, 1, 1, 1],      keep: [0.85, 1, 0.5, 0.12],  swatch: [0, 1, 0] },         // 12 a fallen beech leaf
];
const v4 = (a) => `vec4(${a.map((n) => Number(n).toFixed(3)).join(', ')})`, v3 = (a) => `vec3(${a.map((n) => Number(n).toFixed(3)).join(', ')})`;
const NS = SURFACES.length;

/** The four swatches as one texture of four layers (0 worn gilt, 1 velvet, 2 damask, 3 boards) and the mean colour of each. */
async function loadSwatches(names) {
  const N = 512;
  const cv = document.createElement('canvas'); cv.width = cv.height = N;
  const g = cv.getContext('2d', { willReadFrequently: true }), data = new Uint8Array(N * N * 4 * names.length), means = [];
  const lin = new Float32Array(256); for (let i = 0; i < 256; i++) { const c = i / 255; lin[i] = c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
  for (let k = 0; k < names.length; k++) {
    const bmp = await createImageBitmap(await (await fetch(`assets/art/theatre/${names[k]}.webp`)).blob());
    g.drawImage(bmp, 0, 0, N, N); bmp.close();
    const px = g.getImageData(0, 0, N, N).data; data.set(px, k * N * N * 4);
    let r = 0, gg = 0, b = 0; for (let i = 0; i < px.length; i += 4) { r += lin[px[i]]; gg += lin[px[i + 1]]; b += lin[px[i + 2]]; }
    means.push(new THREE.Vector3(r, gg, b).multiplyScalar(4 / px.length));
  }
  const tex = new THREE.DataArrayTexture(data, N, N, names.length);
  tex.format = THREE.RGBAFormat; tex.type = THREE.UnsignedByteType; tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.magFilter = THREE.LinearFilter; tex.generateMipmaps = true; tex.anisotropy = 4;
  tex.needsUpdate = true;
  return { tex, means };
}

/**
 * The extension that reads light and swatch per surface. It goes AFTER the house's own in a material's list: its
 * fragmentPars turn the house's uTake and uKeep into two variables that its albedo code fills from the table.
 * cloth: the same for a material that is all velvet (curtains): only the swatch, from the place the cloth hangs at rest.
 */
// WHAT EACH PASS NEEDS (as the tiers' builder found, 2-kit-tiers.md). The engine draws the scene three times. In its first picture
// (the one without the water) only what lies UNDER the water is ever shown, through the surface; of everything above it only the
// depth is read. So there a fragment more than 0.6 m above the water is one flat dark colour and none of the house's light is worked
// out for it: `pass` is a uniform { value } that the boxes' and piers' meshes set to 1 before they are drawn into that picture
// (watchPass in build). The water's mirror has sets of its own (far models in a plain paint with no swatch and no water-light).
const NO_PASS = { value: 0 };
// THE WATER'S EDGE (the third hand on this stage: 2-kit-floor.md, "Second look"). Everything here stands in the water, and from
// three metres the water at a box front is perfectly clear and unlit: what stood under it was as crisp and as bright as what
// stood over it, and a front read as a wall going down into the dark. So every surface of this module knows where the water is:
//   under it   the bow lantern's amber is all but gone and what is left of it is green (the lantern lit the drowned seats' rolls
//              as yellow sausages); everything is a tone darker and greener than the water alone makes it
//   on it      a thread of pale where the surface climbs the thing, broken along its length, livelier where the water is
//   over it    for a finger's breadth the thing is wet and darker
// uKfEdge: (how much darker under, how much darker just over, the thread's strength, what is left of the lantern under water);
// uKfEdgeCol: the thread's colour (pearl before the hour, a breath of gold after: update() below).
const EDGE = { uKfEdge: { value: new THREE.Vector4(0.6, 1, 0.8, 0.55) }, uKfEdgeCol: { value: new THREE.Color('#8fa9a1') } };
if (dev.has('kfedge')) EDGE.uKfEdge.value.fromArray(dev.get('kfedge').split(',').map(Number));      // &kfedge=1,1,0.55,0.55 tries other numbers
// (uKfLanK, uKfWarmP: the house's own uLanternK and uWarmP under names of this module's, bound in build(): the first version of the
// house's light, &light=1 and &raw=1, does not declare them, and a shader that named them there did not compile)
EDGE.uKfLanK = { value: 0 }; EDGE.uKfWarmP = { value: new THREE.Vector4(0, 0, 0, 0) };
const EDGE_PARS = 'uniform vec4 uKfEdge, uKfWarmP; uniform vec3 uKfEdgeCol; uniform float uKfLanK; uniform vec2 uKfLan;';
const EDGE_GLSL = /* glsl */`
    { // ---- the water's edge (src/realms/theatre/kit_floor.js)
      float kfY = vWPos.y;
      if (uKfLan.x < 0.999 && kfY > -0.14) {
        // THE BOW LANTERN ON SODDEN VELVET (fifth hand). The house's light takes a green thing under a warm light toward a warm grey of its own value
        // (amber times bottle green is a sour olive): right for a pool of candlelight on a far front, but three metres from the bow it turned the
        // seat backs that stand out of the water into pale stones, a row of them into headstones. Wet velvet drinks light: these take a share of the
        // lantern (uKfLan.x) and keep most of their own green under it (uKfLan.y: how far toward that warm grey they still go).
        vec3 kfLanA = pointLight(uLanternPos, uLanternColor, uLanternRadius, N);
        vec3 kfLvA = uLanternPos - vWPos;
        float kfKA = 1.0 - uKfLanK * (1.0 - 1.0 / (1.0 + dot(kfLvA, kfLvA) / 6.0));
        float kfLumA = dot(albedo, vec3(0.3, 0.55, 0.15));
        float kfCoolA = clamp((max(albedo.g, albedo.b) - albedo.r) / max(kfLumA, 0.03) * 2.0, 0.0, 1.0);
        vec3 kfGreyA = vec3(kfLumA) * vec3(1.14, 0.95, 0.76);
        vec3 kfWasA = kfLanA * mix(albedo, kfGreyA, uKfWarmP.y * kfCoolA) * kfKA;
        vec3 kfNowA = kfLanA * mix(albedo, kfGreyA, uKfLan.y * kfCoolA) * (kfKA * uKfLan.x);
        c = max(c + (kfNowA - kfWasA) * smoothstep(-0.14, 0.0, kfY), vec3(0.0));
      }
      if (kfY < 0.09) {
        float kfUnder = 1.0 - smoothstep(-0.14, 0.0, kfY);
        if (kfUnder > 0.0) {
          vec3 kfLan = pointLight(uLanternPos, uLanternColor, uLanternRadius, N);
          vec3 kfLv = uLanternPos - vWPos;
          float kfK = 1.0 - uKfLanK * (1.0 - 1.0 / (1.0 + dot(kfLv, kfLv) / 6.0));
          float kfLum = dot(albedo, vec3(0.3, 0.55, 0.15));
          float kfCool = clamp((max(albedo.g, albedo.b) - albedo.r) / max(kfLum, 0.03) * 2.0, 0.0, 1.0);
          vec3 kfWas = kfLan * mix(albedo, vec3(kfLum) * vec3(1.14, 0.95, 0.76), uKfWarmP.y * kfCool) * kfK;      // what the house's light laid on it from the lantern (light.js)
          vec3 kfNow = dot(kfLan, vec3(0.3, 0.55, 0.15)) * mix(albedo, vec3(kfLum), mix(0.78, 0.3, kfCool)) * vec3(0.6, 1.0, 0.85) * (kfK * uKfEdge.w);      // (a warm thing loses most of its own colour down there: gilt under the water came out lime)
          c += (kfNow - kfWas) * kfUnder;
          c = max(c, vec3(0.0)) * mix(vec3(1.0), vec3(0.52, 0.68, 0.64), kfUnder * uKfEdge.x);
          // (fifth hand: and whatever lights it. A length of gilt rib lying on the fallen sky a hand under the water, in the moon's shaft, was a lime-green
          // pickle: gold times the water's green. Under the water a warm thing keeps a third of its colour, whatever the light.)
          float kfC2 = dot(c, vec3(0.3, 0.55, 0.15));
          c = mix(c, vec3(kfC2) * vec3(0.82, 1.0, 0.93), kfUnder * 0.68 * (1.0 - kfCool));
        }
        if (kfY > -0.01) {
          c *= 1.0 - 0.32 * uKfEdge.y * (1.0 - smoothstep(0.0, 0.075, kfY)) * step(0.0, kfY);
          float kfLine = 1.0 - smoothstep(0.002, 0.02, abs(kfY - 0.012));
          if (kfLine > 0.0) {
            vec2 kfUv2 = (vWPos.xz - uRippleRect.xy) / uRippleRect.zw + 0.5;
            float kfLive = (kfUv2.x > 0.02 && kfUv2.x < 0.98 && kfUv2.y > 0.02 && kfUv2.y < 0.98) ? clamp(texture2D(tRipple, kfUv2).a * 3.0, 0.0, 1.0) : 0.0;
            float kfBr = 0.5 + 0.5 * sin(dot(vWPos.xz, vec2(5.1, 3.3)) + uTime * 0.7) * sin(dot(vWPos.xz, vec2(-2.3, 4.1)) - uTime * 0.45);
            kfBr *= 0.6 + 0.4 * sin(dot(vWPos.xz, vec2(23.0, 17.0)) + uTime * 1.3);
            c += uKfEdgeCol * (kfLine * uKfEdge.z * (0.12 + 0.88 * kfBr) * (0.7 + 0.9 * kfLive));      // (fifth hand: 1.5 of the water's liveliness made it a white band on everything that stands in the rain)
          }
        }
      }
    }`;
// GLASS (sixth hand). Old looking-glass, opal glass and mother of pearl (surface 8) were paint like any other, and by the lantern the foyer's opal
// globes were four tan balls. Glass gives the bow lantern back: a small soft glint where the lantern would be seen in it (on a globe it sits still
// on the side toward the boat; in a box's flat looking-glass it comes and goes as the boat passes), and a round thing of glass is darker toward
// its limb, as a hollow thing is. Nothing else changes: by the moon it takes the wet gleam as it did.
const GLASS_GLSL = /* glsl */`
    if (clamp(int(floor(vUv0.x + 0.5)), 0, ${NS - 1}) == 8 && vWPos.y > 0.0) {
      vec3 kfGl = uLanternPos - vWPos; float kfGd = length(kfGl);
      float kfGa = 1.0 - smoothstep(uLanternRadius * 0.3, uLanternRadius * 1.6, kfGd);
      float kfRound = clamp(length(fwidth(N)) * 40.0, 0.0, 1.0);
      float kfNv = clamp(dot(N, V), 0.0, 1.0);
      c *= mix(1.0, 0.5 + 0.5 * kfNv, kfRound);
      float kfSp = max(dot(N, normalize(kfGl / max(kfGd, 1e-3) + V)), 0.0);
      kfSp *= kfSp; kfSp *= kfSp; kfSp *= kfSp; kfSp *= kfSp; kfSp *= kfSp; kfSp *= kfSp;      // (to the sixty-fourth: a point, not a glow)
      c += uLanternColor * (0.3 * mix(0.62, 1.0, kfRound) * kfSp * kfGa * kfGa);      // (dim: at 0.55 each globe seemed to hold a small flame, and nothing at this level is ever lit)
    }`;
function surfaceExt(sw, cloth = false, dim = [1, 1, 1, 1], gleam = 1, pass = NO_PASS, lan = [1, 1]) {
  const uniforms = { tKfSwatch: { value: sw.tex }, uKfMean: { value: sw.means }, uKfDim: { value: new THREE.Vector4(...dim) }, uKfGleam: { value: gleam }, uKfPass: pass, uKfLan: { value: new THREE.Vector2(...lan) }, ...EDGE };
  const early = 'if (uKfPass > 0.5 && vWPos.y > 0.6) { gl_FragColor = vec4(albedo * 0.12, 1.0); return; }';
  const tri = /* glsl */`
  uniform sampler2DArray tKfSwatch; uniform vec3 uKfMean[4];
  vec3 kfSwatch(float layer, vec3 p, vec3 n) {                       // from three sides, about the swatch's own mean
    vec3 bw = pow(abs(n), vec3(4.0)); bw /= (bw.x + bw.y + bw.z);
    vec3 t = texture(tKfSwatch, vec3(p.zy, layer)).rgb * bw.x + texture(tKfSwatch, vec3(p.xz, layer)).rgb * bw.y + texture(tKfSwatch, vec3(p.xy, layer)).rgb * bw.z;
    return t / uKfMean[int(layer + 0.5)];
  }`;
  if (cloth) return { uniforms, vertexPars: 'varying vec3 vKfRest;', vertexWorld: 'vKfRest = wp.xyz;', fragmentPars: tri + '\n  varying vec3 vKfRest; uniform float uKfPass; ' + EDGE_PARS,
    albedo: /* glsl */`${early}
      albedo *= mix(vec3(1.0), min(kfSwatch(1.0, vKfRest * ${(1 / 1.1).toFixed(4)}, N), vec3(1.6)), 0.7);`, light: EDGE_GLSL };
  return {
    uniforms,
    fragmentPars: tri + /* glsl */`
  const vec4 KF_TAKE[${NS}] = vec4[${NS}](${SURFACES.map((q) => v4(q.take)).join(', ')});
  const vec4 KF_KEEP[${NS}] = vec4[${NS}](${SURFACES.map((q) => v4(q.keep)).join(', ')});
  const vec3 KF_SWATCH[${NS}] = vec3[${NS}](${SURFACES.map((q) => v3([q.swatch[0], 1 / q.swatch[1], q.swatch[2]])).join(', ')});
  uniform vec4 uKfDim; uniform float uKfGleam, uKfPass; ${EDGE_PARS}   // a whole material's share of what its surfaces take (things under the water take less), and of the wet gleam (they take none)
  vec4 kfTake, kfKeep;                                               // the house's light reads uTake and uKeep: from here on it reads these
  #define uTake kfTake
  #define uKeep kfKeep`,
    albedo: /* glsl */`{
      ${early}
      int kfS = clamp(int(floor(vUv0.x + 0.5)), 0, ${NS - 1});
      kfTake = KF_TAKE[kfS] * uKfDim; kfKeep = KF_KEEP[kfS]; kfKeep.z *= uKfGleam * smoothstep(-0.03, 0.03, vWPos.y);      // (no wet gleam under the water: the surface gives back the dome's opening, not what stands under it. The blank shields on the rails' bellies were soap bubbles)
      vec3 kfQ = KF_SWATCH[kfS];
      vec3 kfP = vWPos * kfQ.y, kfN = N;
      if (kfS == 3) { kfP = vec3(vUv0.y, vWPos.y, 0.0) * kfQ.y; kfN = vec3(0.0, 0.0, 1.0); }      // the damask: along the wall's own run, and up
      vec3 kfT = kfSwatch(kfQ.x, kfP, kfN);
      if (kfS == 3) {                                                      // the damask: its figure is faint in the painting; here it is woven in two tones, the leaves and garlands a pale gold-green on a deep ground, so that a box's wall is a picture even by the moon
        float kfF = smoothstep(0.94, 1.22, dot(kfT, vec3(0.3, 0.55, 0.15)));
        albedo *= mix(vec3(0.6, 0.62, 0.64), vec3(2.0, 1.9, 1.45), kfF) * (0.9 + 0.2 * kfT);
      } else albedo *= mix(vec3(1.0), min(kfT, vec3(1.9)), kfQ.z);
    }`,
    light: GLASS_GLSL + EDGE_GLSL,
  };
}
/** Gouache options for a model whose faces are numbered by surface: the house's light for `kind`, read per surface, and the swatches. */
function surfaced(H, sw, kind = 'gilt', over = null) {
  const { dim, gleam, pass, lan, ...rest } = over || {};
  return H.dress(kind, { ...rest, extend: [surfaceExt(sw, false, dim, gleam ?? 1, pass || NO_PASS, lan || [1, 1]), ...[].concat(rest.extend || [])] });
}

// ================================================================================================ small things, baked
// Forty trinkets of seven kinds, each in its own place, are not worth seven draw calls: the named pieces of one model
// file are copied to where each stands and merged into ONE mesh per slot (they never move one by one; what is of
// cloth among them still stirs by its own UVs).
/** The named pieces of a model file: { name: [{ geometry, slot, rel (its place inside the file) }] }. Nothing is added to the realm. */
async function piecesOf(ctx, url) {
  const model = await ctx.kit.model(url, {});
  if (model.group.parent) model.group.parent.remove(model.group);
  model.group.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(model.group.matrixWorld).invert(), pieces = {};
  model.group.traverse((o) => {
    if (o === model.group || !o.name) return;
    const list = [];
    o.traverse((q) => { if (q.isMesh) list.push({ geometry: q.geometry, slot: q.userData.slot || 'paint', rel: new THREE.Matrix4().multiplyMatrices(inv, q.matrixWorld) }); });
    if (list.length) pieces[o.name] = list;
  });
  return pieces;
}
/** Copies of pieces, each baked where it stands: items [{ piece, matrix, tint, origin (optional: a point every vertex of the copy carries as aOrigin) }] -> one geometry for each slot the pieces have: { paint, cloth, picture ... }. */
function bake(pieces, items) {
  const out = {}, nm = new THREE.Matrix3(), m = new THREE.Matrix4(), v = new THREE.Vector3(), c = new THREE.Color();
  for (const it of items) for (const { geometry: src, slot, rel } of pieces[it.piece] || []) {
    const n = src.attributes.position.count, pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3), uv = new Float32Array(n * 2), org = new Float32Array(n * 4);
    m.multiplyMatrices(it.matrix, rel); nm.getNormalMatrix(m); c.set(it.tint || '#ffffff');
    const ca = src.attributes.color, ua = src.attributes.uv, o = it.origin || [0, 0, 0, 0];
    for (let i = 0; i < n; i++) {
      v.fromBufferAttribute(src.attributes.position, i).applyMatrix4(m); pos[i * 3] = v.x; pos[i * 3 + 1] = v.y; pos[i * 3 + 2] = v.z;
      v.fromBufferAttribute(src.attributes.normal, i).applyMatrix3(nm).normalize(); nor[i * 3] = v.x; nor[i * 3 + 1] = v.y; nor[i * 3 + 2] = v.z;
      col[i * 3] = (ca ? ca.getX(i) : 1) * c.r; col[i * 3 + 1] = (ca ? ca.getY(i) : 1) * c.g; col[i * 3 + 2] = (ca ? ca.getZ(i) : 1) * c.b;
      if (ua) { uv[i * 2] = ua.getX(i); uv[i * 2 + 1] = ua.getY(i); }
      org[i * 4] = o[0]; org[i * 4 + 1] = o[1]; org[i * 4 + 2] = o[2]; org[i * 4 + 3] = o[3];
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setAttribute('aOrigin', new THREE.BufferAttribute(org, 4));
    const idx = src.index ? Array.from(src.index.array) : Array.from({ length: n }, (_, i) => i);
    if (m.determinant() < 0) for (let i = 0; i + 2 < idx.length; i += 3) { const t = idx[i + 1]; idx[i + 1] = idx[i + 2]; idx[i + 2] = t; }      // (a mirrored copy: its triangles are turned back the right way out)
    g.setIndex(idx);
    (out[slot] ||= []).push(g);
  }
  const join = (list) => { const g = list.length === 1 ? list[0] : mergeGeometries(list, false); if (list.length > 1) list.forEach((q) => q.dispose()); return g; };
  return Object.fromEntries(Object.entries(out).map(([slot, list]) => [slot, join(list)]));
}

export async function build(ctx, plan, shared) {
  const { kit } = ctx, H = house(ctx, plan, shared), show = shared.show || { c: -1 };
  const only = (dev.get('kf') || '').split(',').filter(Boolean), want = (k) => !only.length || only.includes(k);
  const rnd = ctx.rng(3402);
  const PTS = await fetch('assets/' + M + 'parterre_points.json').then((r) => r.json()).catch(() => ({}));
  const K = shared.kitFloor = { bays: [], piers: [], perches: [], points: PTS };
  if (dev.second && shared.house && shared.house.U.uLanternK && shared.house.U.uWarmP) { EDGE.uKfLanK = shared.house.U.uLanternK; EDGE.uKfWarmP = shared.house.U.uWarmP; }      // (the water's edge reads the house's own lantern numbers: see EDGE)
  const SW = await loadSwatches(plan.kitFloor.art.swatches);

  // ============================================================================================ near and far
  // A box, a pier and a chair are each made twice (parterre.py, chair.py): as they are (6,000, 2,700 and 1,100 triangles: carved
  // leaf by leaf) and FAR (1,000, 440 and 260: the same masses and the same paint, nothing carved, the cloth a plain sheet).
  // Within NEAR metres of the boat a thing is drawn as it is; beyond that, and always in the water's mirror, far. From the centre
  // line every box is far (the fronts stand 20 to 22 m off): what is carved is spent only where the rider has gone to look.
  // A carved leaf at 17 m is four pixels long; a change of level is not seen. (&kflod=0 draws everything as it is, =far everything far.)
  const LOD = dev.get('kflod'), reach = (d) => LOD === '0' ? 1e6 : LOD === 'far' ? -1 : d, lodSets = [];
  const levels = (near, far, places, dist = 16.5) => {
    // (every instance's own place and tint are kept here; each set is then PACKED: the instances it shows first, and its count
    // cut to them, so that what is not shown is not sent at all. Do not use the sets' own place() or tint() afterwards.)
    const own = (set) => set.meshes.map((mesh) => {
      mesh.frustumCulled = false;
      const mats = [], cols = [], c = new THREE.Color();
      for (let i = 0; i < places.length; i++) { const m = new THREE.Matrix4(); mesh.getMatrixAt(i, m); mats.push(m); if (mesh.instanceColor) { mesh.getColorAt(i, c); cols.push(c.clone()); } }
      return { mesh, mats, cols };
    });
    lodSets.push({ near: own(near), far: own(far), places, state: places.map(() => -1), dist: reach(dist) });
  };
  const pack = (sets, pick) => {
    for (const { mesh, mats, cols } of sets) {
      let n = 0;
      for (const i of pick) { mesh.setMatrixAt(n, mats[i]); if (cols.length) mesh.setColorAt(n, cols[i]); n++; }
      mesh.count = n; mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }
  };
  const setLevels = () => {
    const bx = ctx.boat.x, bz = ctx.boat.z;
    for (const L of lodSets) {
      let changed = false;
      for (let i = 0; i < L.places.length; i++) {
        const d = Math.hypot(L.places[i].x - bx, L.places[i].z - bz), was = L.state[i], now = d < (was === 1 ? L.dist + 1.5 : L.dist) ? 1 : 0;      // (a metre and a half between coming and going, so that nothing flickers at the edge)
        if (now !== was) { L.state[i] = now; changed = true; }
      }
      if (!changed) continue;
      const a = [], b = [];
      L.state.forEach((st, i) => (st ? a : b).push(i));
      pack(L.near, a); pack(L.far, b);
    }
  };

  // ============================================================================================ where the boxes stand
  // Seventeen a side. Bay i runs from arc a0 (its rear end, where its own pier stands) to a0 + 3.3 m along the line.
  const V = (s, d, y = 0) => at(ctx, s, d, y);
  for (const side of [-1, 1]) for (let i = 0; i < plan.baysASide; i++) {
    const a0 = plan.arc.bay0 + i * plan.bay, p0 = plan.frontAt(a0), p1 = plan.frontAt(a0 + plan.bay);
    const cl = Math.hypot(p1.s - p0.s, p1.d - p0.d), cs = (p1.s - p0.s) / cl, cd = (p1.d - p0.d) / cl;
    const turn = Math.atan2(-side * cs, -cd);                       // rotation.y: the bay's front (+z) looks into the room
    const pos = V((p0.s + p1.s) / 2, side * (p0.d + p1.d) / 2, 0), cosT = Math.cos(turn), sinT = Math.sin(turn);
    const frame = {
      side, i, turn, pos, s: (p0.s + p1.s) / 2, d: side * (p0.d + p1.d) / 2,
      /** A place in the box's own space (x along the front, y up, z into the room) as a point of the realm. */
      at: (x, y, z, target = new THREE.Vector3()) => target.set(pos.x + x * cosT + z * sinT, pos.y + y, pos.z - x * sinT + z * cosT),
      /** A heading in the box's own space as rotation.y in the realm. */
      heading: (a = 0) => turn + a,
    };
    K.bays.push(frame);
    K.piers.push({ side, i, pos: V(p0.s, side * p0.d, 0), turn: Math.atan2(-side * p0.ts, -p0.td), s: p0.s, d: side * p0.d });
  }

  // ============================================================================================ the boxes and their piers
  // Five designs: a (both curtains tied back), b (one let down), c (drawn), d (tied high and low), e (tied back tight).
  // One box in six has its curtains drawn (c): three on each side. No two neighbours alike.
  // (On the right, bays 4 to 7 are postcard 2's: d, b, a, and a drawn one furthest off.)
  const KF = plan.kitFloor, ORDER = KF.order;
  const TINT = ['#ffffff', '#f6f0e4', '#eef5f0', '#fff4e6', '#e8efe8', '#f3f6ee'];
  // The house's draught, for everything of cloth here: (the way it blows in the realm, x and z; metres the cloth stirs; metres
  // it leans that way). It stirs 3 cm; from the hour (the show clock) it leans toward the stage, and streams in the fall.
  const down = ctx.path.at(60), draught = K.draught = { value: new THREE.Vector4(down.tx, down.tz, 0.03, 0) };
  K.gust = { value: 0 };                                                 // 0..1, for the staging: a gust (the page's moment at s 38) quadruples the stir for as long as it is held up
  const clothExt = {
    uniforms: { uKfDraught: draught },
    vertexPars: 'uniform vec4 uKfDraught; uniform sampler2D tRipple; uniform vec4 uRippleRect;',
    vertexWorld: /* glsl */`{
      // uv.x: how free the cloth is here (0 sewn or tied .. 1 hanging loose); uv.y: a phase
      float kfFree = uv.x, kfPh = uv.y * 2.1 + wp.x * 0.61 + wp.z * 0.47;
      float kfA = sin(uTime * 1.07 + kfPh) * 0.6 + sin(uTime * 0.63 + kfPh * 1.7 + 1.3) * 0.4;
      wp.xz += uKfDraught.xy * (kfFree * (uKfDraught.z * kfA + uKfDraught.w * (0.8 + 0.2 * kfA)));
      wp.xz += wn.xz * (kfFree * uKfDraught.z * 0.6 * sin(uTime * 0.83 + kfPh * 0.7));
      // what hangs in the water is carried by the wake when it arrives
      vec2 kfUv = (wp.xz - uRippleRect.xy) / uRippleRect.zw + 0.5;
      if (kfUv.x > 0.02 && kfUv.x < 0.98 && kfUv.y > 0.02 && kfUv.y < 0.98) wp.xz += texture2D(tRipple, kfUv).xy * (0.22 * step(0.01, kfFree) * smoothstep(1.6, 0.0, wp.y));
    }`,
  };
  if (want('boxes')) {
    // (what each pass needs: see surfaceExt. kfPass is 1 while the engine draws its first picture, the one without the water)
    const kfPass = { value: 0 };
    const watchPass = (set) => { for (const mesh of set.meshes) mesh.onBeforeRender = (renderer) => { kfPass.value = renderer.getRenderTarget() === ctx.engine.pre ? 1 : 0; mesh.material.uniformsNeedUpdate = true; }; return set; };
    const cloth = H.dress('velvet', { wake: false, extend: [surfaceExt(SW, true, [1, 1, 1, 1], 1, kfPass), clothExt] });      // (the swatch first: it notes where the cloth hangs at rest)
    const opts = { ...surfaced(H, SW, 'gilt', { pass: kfPass }), materials: { cloth } };
    const plain = () => H.dress('velvet', { wake: false });               // for the water's mirror: the model's own paint in the house's light, nothing more
    const byDesign = {};
    K.bays.forEach((b, n) => { b.design = dev.get('kfdesign') || ORDER[b.side][b.i]; (byDesign[b.design] ||= []).push({ position: b.pos, rotation: b.turn, tint: TINT[(n * 7 + b.i) % TINT.length] }); });
    // each kind three times: as it is (near the boat), far (beyond), and far again for the water's mirror alone
    const thrice = async (name, list, o) => {
      const near = watchPass(await kit.models(`${M}${name}.glb`, list, o)), far = watchPass(await kit.models(`${M}${name}_far.glb`, list, surfaced(H, SW, 'gilt', { pass: kfPass }))), mirror = await kit.models(`${M}${name}_far.glb`, list, plain());
      for (const mesh of mirror.meshes) mesh.frustumCulled = false;
      ctx.only(near.group, 'direct'); ctx.only(far.group, 'direct'); ctx.only(mirror.group, 'mirror');
      levels(near, far, list.map((it) => it.position));
      return { near, far, mirror };
    };
    K.boxes = {};
    for (const [design, list] of Object.entries(byDesign)) K.boxes[design] = await thrice(`parterre_box_${design}`, list, opts);
    const pa = [], pb = [];
    K.piers.forEach((p, n) => ((p.i + (p.side > 0 ? 1 : 0)) % 3 === 1 ? pb : pa).push({ position: p.pos, rotation: p.turn, tint: TINT[(n * 5 + 2) % TINT.length] }));
    K.pierModels = [await thrice('parterre_pier_a', pa, surfaced(H, SW, 'gilt', { pass: kfPass })), await thrice('parterre_pier_b', pb, surfaced(H, SW, 'gilt', { pass: kfPass }))];
    removeStandIn(ctx, 'parterre_box');
  }

  // ============================================================================================ the chairs
  // Gilt chairs standing in the boxes, in water to their seats: two to four in a box, as they were left when the last people
  // went out: most turned a little toward the stage, one pushed back, one half turned to its neighbour, a few leaning where a
  // leg has gone through the floor's edge. None in the boxes whose curtains are drawn (nothing of them would be seen).
  // Two models (chair.py): a, a side chair with an oval back; b, an armchair, as the key painting has them.
  // A chair's place is in its box's own space: [x along the front, z (negative: back from the rail), turn (radians: 0 faces the room), lean, which].
  const CHAIRS = {
    a: [[-0.66, -0.5, 0.1, 0, 'b'], [0.5, -0.58, 0.45, 0, 'a'], [-0.2, -1.12, 1.3, 0.05, 'a']],
    b: [[-0.52, -0.48, 0.2, 0, 'a'], [0.34, -0.6, 0.55, 0, 'b'], [0.5, -1.25, -0.5, 0, 'a']],
    d: [[-0.78, -0.55, 0.0, 0, 'a'], [0.0, -0.5, 0.3, 0, 'b'], [0.74, -0.62, 0.5, 0.07, 'a'], [-0.35, -1.28, 0.9, 0, 'a']],
    e: [[-0.6, -0.52, 0.25, 0, 'b'], [0.52, -0.6, 0.35, 0, 'a'], [0.8, -1.22, -0.2, 0, 'a']],
    c: [],
  };
  // the places a chair model names (chair_points.json, written by chair.py), from Blender's axes to the ride's
  const CP = await fetch('assets/' + M + 'chair_points.json').then((r) => r.json()).catch(() => ({}));
  const rideXYZ = ([x, y, z]) => [x, z, -y];
  const chairPts = (v) => { const pt = CP['chair_' + v] || {}; return { seat: rideXYZ(pt.seat || [0, -0.03, 0.066]), back: rideXYZ(pt.back_top || [0, 0.29, 0.54]) }; };
  // THE BOX THE SKY LEANS ON (plan.kitFloor.leaning: the left side, bay 10): a piece of the painted dome leans on its rail from outside, its upper
  // edge over two side chairs (dome_fragment_g, modelled for chairs standing exactly here: x, and 0.55 m behind the rail, square to it). Nothing else is left in that box.
  const FELL = new Map(KF.leaning.map(([side, i]) => [side + ':' + i, [[-0.55, -0.55], [0.5, -0.55]]]));
  const fellInto = (b) => FELL.get(b.side + ':' + b.i);
  K.chairs = [];
  if (want('chairs')) {
    const lists = { a: [], b: [] }, e3 = new THREE.Euler(), q = new THREE.Quaternion(), qy = new THREE.Quaternion(), UP = new THREE.Vector3(0, 1, 0);
    K.bays.forEach((b, n) => {
      (CHAIRS[b.design] || []).forEach(([x, z, turn, lean, which], k) => {
        if (b.design !== 'd' && k === 2 && (n * 3 + b.i) % 3 === 0) return;            // some boxes keep only two
        const toStage = -b.side;                                                     // in a box's own space the stage lies toward -x on the right of the house, +x on the left
        const yaw = toStage * turn + (rnd() - 0.5) * 0.3, tilt = lean ? lean * (rnd() < 0.5 ? -1 : 1) : (rnd() < 0.18 ? (rnd() - 0.5) * 0.12 : 0);
        const pos = b.at(x + (rnd() - 0.5) * 0.1, 0, z + (rnd() - 0.5) * 0.08);
        // lean about the chair's own feet (0.45 m down), then turn
        q.setFromEuler(e3.set(tilt * 0.6, 0, tilt)); qy.setFromAxisAngle(UP, b.turn + yaw); q.premultiply(qy);
        const foot = new THREE.Vector3(0, -0.45, 0), moved = foot.clone().applyQuaternion(q);
        pos.add(foot).sub(moved);
        const rot = new THREE.Euler().setFromQuaternion(q, 'YXZ');
        const variant = (n + k) % 7 === 3 ? (which === 'a' ? 'b' : 'a') : which;     // (now and then the other chair: no two boxes furnished alike)
        if (fellInto(b)) return;                                                     // (its own two chairs are set below; the dice are still thrown above, so that no other box's chairs move)
        lists[variant].push({ position: pos, rotation: [rot.x, rot.y, rot.z], tint: TINT[(n + k * 2) % TINT.length] });
        // (a chair's own space, as the ride sees the model: x to its sitter's left, y up from the WATER, z the way the sitter faces)
        const cp = pos.clone(), cq = q.clone();
        K.chairs.push({ bay: b, k, variant, pts: chairPts(variant), pos: cp, quat: cq, leans: tilt !== 0, at: (x1, y1, z1) => new THREE.Vector3(x1, y1, z1).applyQuaternion(cq).add(cp) });
      });
    });
    for (const b of K.bays) for (const [x, z] of fellInto(b) || []) {
      const pos = b.at(x, 0, z), cq = new THREE.Quaternion().setFromAxisAngle(UP, b.turn);
      lists.a.push({ position: pos, rotation: [0, b.turn, 0], tint: TINT[1] });
      K.chairs.push({ bay: b, k: K.chairs.length, variant: 'a', pts: chairPts('a'), pos: pos.clone(), quat: cq, leans: false, taken: true, shawl: true, under: 'sky', at: (x1, y1, z1) => new THREE.Vector3(x1, y1, z1).applyQuaternion(cq).add(pos) });
    }
    K.chairModels = [];
    for (const v of ['a', 'b']) {                                         // as they are near the boat, far beyond (never in the water's mirror: the rail hides where their reflections would lie)
      // (gleam 0.5: a stuffed back is a flat thing that looks straight at the boat, and at the whole wet gleam it was a pale pane: glass, not velvet)
      const chairOpts = () => surfaced(H, SW, 'gilt', { gleam: dev.has('kfchairgl') ? Number(dev.get('kfchairgl')) : 0.5 });
      const near = await kit.models(`${M}chair_${v}.glb`, lists[v], chairOpts()), far = await kit.models(`${M}chair_${v}_far.glb`, lists[v], chairOpts());
      ctx.only(near.group, 'direct'); ctx.only(far.group, 'direct');
      levels(near, far, lists[v].map((it) => it.position));
      K.chairModels.push({ near, far });
    }
    removeStandIn(ctx, 'chair');
  }

  // ============================================================================================ things left behind
  // Of the page's six kinds (trinkets.glb has eleven pieces of them), each as somebody left it. What lies flat on a rail is a
  // sliver from the boat (the eye is 1.1 m up, the rail 0.25): so the ones that carry the picture stand up: glasses stood on
  // their great lenses, a fan across the rail with its tassel hanging over the edge, a fan leaned on a chair's back, a shawl
  // thrown over a chair, a shawl left over the rail with both its ends in the water (dark where it has drunk).
  K.trinkets = [];
  if (want('trinkets')) {
    const pieces = await piecesOf(ctx, `${M}trinkets.glb`), items = [], one = new THREE.Vector3(1, 1, 1), q = new THREE.Quaternion(), e = new THREE.Euler();
    const NAME = { glasses: 'glasses', up: 'glasses_up', fan: 'fan', edge: 'fan_edge', open: 'fan_open', posy: 'posy', card: 'trinkets', cards: 'cards', cushion: 'cushion', shawl: 'shawl', over: 'shawl_rail' };      // (the single card is the file's own body; the shawls have two colourways each: shawl, shawl_b; shawl_rail, shawl_rail_b)
    const bayOf = (side, i) => K.bays.find((b) => b.side === side && b.i === i);
    const chairsOf = (b) => K.chairs.filter((c) => c.bay === b);
    const put = (kind, position, quaternion, tint, bay, piece = NAME[kind], scale = one) => { items.push({ piece, matrix: new THREE.Matrix4().compose(position, quaternion, scale), tint }); K.trinkets.push({ kind, at: position.clone(), bay }); return true; };
    const TOP = 0.2535;                                                    // the rail's velvet
    // on the rail: x along it, z across its top (0.02 its inner edge .. 0.19 where it begins to roll over), a turn about the vertical
    const onRail = (b, kind, x, z, turn = 0, tint) => put(kind, b.at(x, TOP, z), new THREE.Quaternion().setFromEuler(e.set(0, b.turn + turn, 0)), tint, b);
    // a closed fan along the rail by its edge (x: where its rivet lies; it runs toward +x, skewed a little): its loop goes out over the roll of the
    // velvet and its tassel hangs down in front of the carved leaves. (Never tinted: its guards are ivory.)
    const onEdge = (b, x, skew = 0) => put('edge', b.at(x, 0.2528, 0.2), new THREE.Quaternion().setFromEuler(e.set(0, b.turn + skew, 0, 'YXZ')), undefined, b);
    // (Nothing is left ON a seat: from the boat the rail hides whatever stands lower than a hand above the water at a chair's place.
    // The eye is 1.1 m up and never nearer than 2.6 m. So a cushion lies on the rail, where someone leaned on it.)
    // a shawl thrown over the back of a chair
    // (seventh hand: only over an ARMCHAIR's back: the side chair has a finial at each corner of its head, and they came through the cloth. If the chair
    // named is a side chair the box's armchair takes it; a box with none keeps no shawl. `which`: 0 plum with a border of old gold, 1 celadon with a green one)
    const SHAWL_TINT = ['#ffffff', '#f3ebe4', '#eef3ee', '#fff6ea'];
    const onBack = (c, which = 0, turn = 0) => {
      if (c && c.variant !== 'b') c = K.chairs.find((o) => o.bay === c.bay && o.variant === 'b' && !o.shawl && !o.taken);
      if (!c || c.shawl) return false;
      c.shawl = true;
      return put('shawl', c.at(...c.pts.back), c.quat.clone().multiply(q.setFromEuler(e.set(0, turn, 0))), SHAWL_TINT[(K.trinkets.length + which) % SHAWL_TINT.length], c.bay, which ? 'shawl_b' : 'shawl');
    };
    // an open fan stood on a seat and leaned on the chair's back, its face to the room
    const leaned = (c, tint, skew = 0) => { if (!c || c.leans || c.shawl || c.taken) return false; c.taken = true; const st = c.pts.seat;
      return put('open', c.at(st[0] + 0.015, st[1] + 0.003, st[2] - 0.11), c.quat.clone().multiply(q.setFromEuler(e.set(1.15, skew, 0, 'YXZ'))), tint, c.bay); };
    // a shawl left over the rail, both its ends in the water
    // (seventh hand: a long shawl: it lies aslant across the velvet, falls over the carved front, and its end FLOATS along the foot of the rail, trailing
    // toward the stage, the way the draught carries what is on the water: the piece trails toward +x, which is the stage on the left of the house; on the
    // right it is set as its mirror image. `which`: 0 celadon, 1 plum)
    const overRail = (b, x, which = 0) => put('over', b.at(x, 0, 0), new THREE.Quaternion().setFromEuler(e.set(0, b.turn, 0)), SHAWL_TINT[(K.trinkets.length + which) % SHAWL_TINT.length], b,
      which ? 'shawl_rail_b' : 'shawl_rail', b.side > 0 ? new THREE.Vector3(-1, 1, 1) : one);
    // (the shawls carry their own colours now, two colourways each: trinkets.py. The sixth hand's note stands: by the bow lantern a copper shawl on the chair at the
    // centre of postcard 2 was a red rag, and a pearl one a tan pelt; the one there now is plum with a border of old gold.)
    const FANS = ['#ffffff', '#e6b3a6', '#c7dccd', '#e0c08a'];                  // and so are the fans' leaves: pearl, old rose, celadon, straw
    // ---- composed by hand where the rider comes closest. Postcard 2 looks at the right side, bays 6, 5, 4 (left to right in the picture: a, b, d);
    // in a box's own space on that side, +x is to the right as the rider sees it.
    const hand = [
      [1, 5, (b, c) => { onRail(b, 'up', -0.47, 0.1, 0.5); onEdge(b, -0.12, 0.2); onBack(c[1], 0, 0.04); onRail(b, 'card', 0.62, 0.12, 0.7); }],      // someone watched closely from here, and went out without her shawl
      [1, 4, (b, c) => { overRail(b, -0.1, 0); onRail(b, 'cushion', 0.62, 0.1, 0.25); leaned(c[0], FANS[2], -0.2); onRail(b, 'posy', 1.2, 0.11, 2.5); }],
      [1, 6, (b, c) => { onRail(b, 'posy', 0.42, 0.1, 0.6); onRail(b, 'glasses', -0.92, 0.1, -0.5); onBack(c[0], 1, -0.06); onRail(b, 'cards', 1.12, 0.1, 0.3); }],
      [1, 7, (b) => { onRail(b, 'card', 0.2, 0.15, -0.4); }],
      [1, 3, (b) => { onRail(b, 'fan', -0.3, 0.1, 0.3); }],
      // the wet side, behind the tree (the left side, bays 5 to 8)
      [-1, 5, (b, c) => { onRail(b, 'up', 0.5, 0.1, 0.4); onRail(b, 'posy', -0.9, 0.12, 2.0); onBack(c[0], 1, 0.05); }],
      [-1, 6, (b, c) => { onEdge(b, 0.15, -0.25); onBack(c[1], 0, 0.04); leaned(c[0], FANS[1], 0.25); }],
      [-1, 8, (b, c) => { overRail(b, 0.1, 0); onRail(b, 'glasses', -0.5, 0.11, 2.4); onRail(b, 'cushion', -1.1, 0.1, -0.3); }],
    ];
    const done = new Set();
    for (const [side, i, fn] of hand) { const b = bayOf(side, i); if (b) { fn(b, chairsOf(b)); done.add(b); } }
    // ---- and the rest from a hand of small scenes, dealt so that no two neighbours have the same: each is something a person does
    const R = (a, b) => a + (b - a) * rnd(), pick = (list, k) => list[((k % list.length) + list.length) % list.length];
    const scenes = [
      (b, c, k) => { const x = c[0] ? -0.6 : 0; onRail(b, 'up', x + R(-0.15, 0.15), 0.1, R(0, 6.3)); onEdge(b, x + 0.35 + R(0, 0.2), R(-0.3, 0.3)); },      // glasses and fan put down side by side
      (b, c, k) => { onBack(c[c.length - 1], k % 2, R(-0.1, 0.1)); onRail(b, 'posy', R(0.7, 1.1) * (k % 2 ? 1 : -1), 0.11, R(0, 6.3)); },                        // a shawl forgotten on a chair, a posy given and left
      (b, c, k) => { const x = R(-0.6, 0.6); overRail(b, x, (k + 1) % 2); onRail(b, 'cushion', x + (x > 0 ? -1 : 1) * R(0.75, 0.95), 0.1, R(-0.4, 0.4)); },             // a shawl over the rail; a cushion brought from home to lean on
      (b, c, k) => { leaned(c[1] || c[0], pick(FANS, k), R(-0.3, 0.3)); onRail(b, 'cards', R(-1.0, 1.0), 0.1, R(0, 6.3)); },                                                // a fan stood against a chair back; cards
      (b, c, k) => { onRail(b, 'fan', R(-0.8, 0.4), 0.1, R(-0.4, 0.4)); onRail(b, 'glasses', R(0.6, 1.0), 0.1, R(0, 6.3)); },
      (b, c, k) => { onRail(b, 'card', R(-1.0, 1.0), 0.13, R(0, 6.3)); },                                                                                                    // only a card
      (b, c, k) => { onRail(b, 'posy', R(-0.3, 0.3), 0.11, R(0, 6.3)); onBack(c[1] || c[0], (k + 1) % 2, R(-0.1, 0.1)); },
      () => {},                                                                                                                                                               // nothing: some boxes were left as they were found
    ];
    let k = 0;
    for (const b of K.bays) {
      if (done.has(b)) continue;
      const c = chairsOf(b);
      if (fellInto(b)) { k++; continue; }                                    // (the sky lies on this rail)
      if (b.design === 'c') { if (rnd() < 0.5) onRail(b, pick(['card', 'glasses', 'fan'], k), R(-1, 1), 0.11, R(-0.5, 0.5)); k++; continue; }
      scenes[(k * 3 + (b.side > 0 ? 1 : 4)) % scenes.length](b, c, k); k++;
    }
    const geo = bake(pieces, items);
    if (geo.paint) { const mesh = new THREE.Mesh(geo.paint, kit.gouache({ vertexColors: true, ...surfaced(H, SW, 'gilt') })); mesh.name = 'things left behind'; ctx.only(mesh, 'direct'); ctx.add(mesh); K.trinketMesh = mesh; }
    if (geo.cloth) { const mesh = new THREE.Mesh(geo.cloth, kit.gouache({ vertexColors: true, side: THREE.DoubleSide, ...H.dress('pearl', { wake: false, take: [0.1, 0.8, 1, 1], keep: [0.75, 1, 0.05, 0.04], extend: clothExt }) })); mesh.name = 'shawls'; ctx.only(mesh, 'direct'); ctx.add(mesh); K.shawlMesh = mesh; }      // (silk does not take the wet gleam: its folds flashed like broken glass)
    removeStandIn(ctx, 'trinkets');
  }

  // ============================================================================================ the drowned stalls
  // Forty-six rows of velvet seats under the water (the page's seating plan: rows 0.9 m apart, places 0.5 m wide, the centre
  // aisle clear, none under the mound). Two sets:
  //   THE POOL: what the water lets the rider see of the rows that are wholly under it: places laid out round the boat (beyond
  //   about six metres the water is a mirror), its rim sunk into the water's own dark so that no seat is seen to arrive;
  //   THE ROWS THE ROOTS HAVE LIFTED: round the tree the floor rides up the mound's drowned skirt (the mound's own ground:
  //   shared.tree.moundHeight), and for two or three rows all round it the seat backs break the surface: these stand where
  //   they are whatever the boat does (they are in the mirror too). Rows hold together in runs of three to five places, as
  //   they were bolted; each run is tipped its own way, more the nearer the trunk, some are gone, some lie half in the rubble.
  // The hull passes within a metre of them (the mound's collider is 6.8 m; the nearest backs stand 5.5 to 7.5 m from the trunk).
  let laySeats = null;
  if (want('seats')) {
    const Sp = plan.seats, B = plan.beech, aisle = plan.runner.width / 2 + 0.1, face = Math.atan2(ctx.path.at(50).tx, ctx.path.at(50).tz);      // a seat's front looks down the house
    const hash = (a, b) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };
    // the mound's ground (the tree's own arithmetic when its module stands; the same numbers otherwise: source-art/models/theatre/beech_common.py, mound_height)
    const shoreAt = (a) => 5.0 + 0.45 * Math.sin(2 * a + 0.6) + 0.28 * Math.sin(3 * a - 1.1) + 0.18 * Math.sin(5 * a + 2.0);
    const moundOwn = (sv, dv) => { const x = dv - B.d, y = sv - B.s, r = Math.hypot(x, y), sh = shoreAt(Math.atan2(y, x));
      if (r <= sh) { const t = Math.max(0, (r - 1.1) / (sh - 1.1)); return 1.86 * (1 - Math.pow(t, 1.25)); } return -1.52 * Math.pow(Math.min(1, (r - sh) / (9.0 - sh)), 0.85); };
    const mound = (shared.tree && shared.tree.moundHeight) || moundOwn;
    const ground = (sv, dv) => Math.max(plan.stallsFloor(sv), Math.hypot(sv - B.s, dv - B.d) < 9.2 ? mound(sv, dv) : -9);
    const fromTree = (sv, dv) => Math.hypot(sv - B.s, dv - B.d), shore = (sv, dv) => shoreAt(Math.atan2(sv - B.s, dv - B.d));
    const LIFT = -1.22;                                                    // a place whose floor is above this shows its back at the surface: it belongs to the standing rows
    const isSeat = (r, k) => {
      if (r < 0 || r > Sp.rows) return false;
      const sv = Sp.from + r * Sp.pitch, dv = (k + 0.5) * Sp.width;
      return !(Math.abs(dv) < aisle || Math.abs(dv) > plan.frontD(sv) - 1.3 || fromTree(sv, dv) < shore(sv, dv) + 0.4);
    };
    const lifted = (r, k) => ground(Sp.from + r * Sp.pitch, (k + 0.5) * Sp.width) > LIFT;
    const rimFade = { uniforms: { uKfDeep: { value: new THREE.Color('#06120f') } }, fragmentPars: 'uniform vec3 uKfDeep;',
      final: 'gl_FragColor.rgb = mix(uKfDeep, gl_FragColor.rgb, 1.0 - smoothstep(4.4, 6.3, distance(vWPos.xz, uBoat.xz)));' };
    const seatOpts = surfaced(H, SW, 'velvet', { wake: false, extend: rimFade, dim: [0, 0.25, 0.4, 0.3], gleam: 0 });      // (no wet gleam under the water: the rolled tops lit up like a row of lamps)
    const POOL = 440, ENDS = 64, park = { position: [0, -50, 0] };
    const seats = await kit.models(`${M}seat_far.glb`, Array.from({ length: POOL }, () => park), seatOpts);      // (seen from above through the water: the far seat, 172 triangles)
    const ends = await kit.models(`${M}seat_end.glb`, Array.from({ length: ENDS }, () => park), seatOpts);
    for (const g of [seats, ends]) { ctx.only(g.group, 'direct'); for (const mesh of g.meshes) mesh.frustumCulled = false; }
    const m4 = new THREE.Matrix4(), p3 = new THREE.Vector3(), q4 = new THREE.Quaternion(), e3 = new THREE.Euler(), s3 = new THREE.Vector3(1, 1, 1);
    // how a place stands: on the ground under it, leaning with the ground's slope; near the tree each run of places is tipped its own way
    const stand = (sv, dv, r, k, sink = 0) => {
      const g0 = ground(sv, dv), e = 0.25, gs = (ground(sv + e, dv) - ground(sv - e, dv)) / (2 * e), gd = (ground(sv, dv + e) - ground(sv, dv - e)) / (2 * e);
      const near = Math.max(0, Math.min(1, 1 - (fromTree(sv, dv) - shore(sv, dv) - 0.4) / 3.4)), run = Math.floor(k / 4 + hash(r, 9.1) * 4);
      const t = near * near * 0.42, own = 0.07 * near;
      // (a seat's front looks toward the stage, +s: its pitch about its own x follows the slope along s, its roll about its own z the slope across)
      const lim = (a) => Math.max(-0.3, Math.min(0.3, a));                // (the skirt is steep at the shore: a row follows it only so far)
      e3.set(lim(-Math.atan(gs) * 0.8) + (hash(r, run) - 0.5) * 2 * t + (hash(r, k) - 0.5) * own, face + (hash(run, r) - 0.5) * t * 0.8,
        (face > 1.5 || face < -1.5 ? 1 : -1) * lim(-Math.atan(gd) * 0.8) + (hash(r + 7, run + 3) - 0.5) * 2 * t + (hash(k, r + 5) - 0.5) * own, 'YXZ');
      q4.setFromEuler(e3);
      at(ctx, sv, dv, g0 - sink * near, p3);
    };
    let cell = '';
    laySeats = () => {
      const b = ctx.boat, loc = ctx.path.locate(b.x, b.z, ctx.s), row0 = Math.round((loc.s - Sp.from) / Sp.pitch), col0 = Math.round(loc.d / Sp.width), id = row0 + ':' + col0;
      if (id === cell) return; cell = id;
      let n = 0, ne = 0;
      const put = (mesh, i, sv, dv, r, k) => { stand(sv, dv, r, k); mesh.setMatrixAt(i, m4.compose(p3, q4, s3)); };
      for (let r = row0 - 7; r <= row0 + 7; r++) for (let k = col0 - 14; k <= col0 + 14; k++) {
        if (!isSeat(r, k) || lifted(r, k)) continue;
        const sv = Sp.from + r * Sp.pitch, dv = (k + 0.5) * Sp.width;
        if (n < POOL) put(seats.meshes[0], n++, sv, dv, r, k);
        // a place brings the arm on its +d side; where nothing stands on its -d side the row ends there in cast iron; and the aisle's other side too
        if (!isSeat(r, k - 1) && ne < ENDS) put(ends.meshes[0], ne++, sv, dv - Sp.width / 2, r, k);
        if (!isSeat(r, k + 1) && Math.abs(dv + Sp.width / 2 + aisle) < 0.05 && ne < ENDS) put(ends.meshes[0], ne++, sv, dv + Sp.width / 2, r, k + 0.5);
      }
      seats.meshes[0].count = n; ends.meshes[0].count = ne;
      seats.meshes[0].instanceMatrix.needsUpdate = true; ends.meshes[0].instanceMatrix.needsUpdate = true;
    };
    // ---- the rows the roots have lifted (their velvet is soaked: darker and greyer than the pile under the water looks through it)
    const up = [], upEnds = [], WET = ['#93a79d', '#a3b5aa', '#889c93', '#9aaea0', '#aab9ae'];
    const r0 = Math.floor((B.s - 9.5 - Sp.from) / Sp.pitch), r1 = Math.ceil((B.s + 9.5 - Sp.from) / Sp.pitch), k0 = Math.floor((B.d - 9.5) / Sp.width), k1 = Math.ceil((B.d + 9.5) / Sp.width);
    for (let r = r0; r <= r1; r++) for (let k = k0; k <= k1; k++) {
      if (!isSeat(r, k) || !lifted(r, k)) continue;
      const sv = Sp.from + r * Sp.pitch, dv = (k + 0.5) * Sp.width, near = Math.max(0, Math.min(1, 1 - (fromTree(sv, dv) - shore(sv, dv) - 0.4) / 3.4)), run = Math.floor(k / 4 + hash(r, 9.1) * 4);
      if (hash(r * 1.7, run * 3.1) < 0.2 * near + 0.04) continue;                        // a run torn out and gone under the rubble
      if (hash(r, k * 7.3) < 0.07 * near) continue;                                      // a single place gone
      // (fifth hand: they were sunk 0.34 to 0.74 m "into the rubble", which put all but 38 of the 212 backs under the water after all and left the rest as
      // caps a hand high. The floor has ridden up with the roots: a row stands ON the skirt, so the rows climb out of the water toward the mound, the
      // outermost awash, the next a hand clear, the innermost to their arms; only those at the mound's very foot stand a little in what fell. &kfsink=1 the old)
      stand(sv, dv, r, k, dev.get('kfsink') === '1' ? 0.34 + 0.4 * hash(run, r * 2.3) : 0.05 + 0.2 * hash(run, r * 2.3) * near);
      // (where the hull can come no back stands out of the water: the mound's collider keeps the boat's middle 7.75 m from the trunk and its side
      // comes to about seven; from 6.85 m out a back is awash at most, a hand under the surface, and the hull goes over it)
      { const over = p3.y + Sp.back + 0.06; if (over > 0) p3.y -= over * smooth(6.45, 6.85, fromTree(sv, dv)); }
      const er = new THREE.Euler().setFromQuaternion(q4, 'YXZ');
      up.push({ position: p3.clone(), rotation: [er.x, er.y, er.z], tint: WET[(k + r * 3 + 60) % WET.length], s: sv, d: dv, top: p3.y + Sp.back });
      if (!isSeat(r, k - 1) || !lifted(r, k - 1) || Math.floor((k - 1) / 4 + hash(r, 9.1) * 4) !== run) upEnds.push({ position: at(ctx, sv, dv - Sp.width / 2, p3.y), rotation: [er.x, er.y, er.z] });      // every run ends in its cast-iron standard
    }
    K.heavedSeats = up;
    const LAN = dev.has('kflan') ? dev.get('kflan').split(',').map(Number) : [0.5, 0.2];      // (the bow lantern on sodden velvet: see EDGE_GLSL; &kflan=1,1 as the house's light has it)
    // (gleam: a quarter of the wet gleam, &kfgl=1 the whole of it. Before the hour the light's gleam is 4.2, and on a seat's broad back three metres off
    // it laid the pale opening of the dome over the whole of it: a row of seats seen from behind was a row of pale stones, each with a dot. At a quarter
    // the velvet is green and the roll carries a soft pearl edge)
    // (sixth hand: OLD VELVET IN THE RAIN. In the shaft the moon lays its whole light on the pile's own colour, and bottle green under a white light
    // is the green of new baize: the rows round the mound read a little like new seats. Sodden velvet a hundred years old is greyer: a third of the
    // way to a pearl grey of its own value, whatever lights it. &kfsat=0 the green as it was.)
    const GREY = dev.has('kfsat') ? Number(dev.get('kfsat')) : 0.34;
    const oldVelvet = { light: /* glsl */`{ float kfVl = dot(c, vec3(0.3, 0.55, 0.15)); c = mix(c, vec3(kfVl) * vec3(0.93, 1.0, 0.98), ${GREY.toFixed(3)} * (0.75 + 0.25 * smoothstep(-0.2, 0.05, vWPos.y))); }` };      // (a little less of it under the water, which greens everything)
    const upOpts = surfaced(H, SW, 'velvet', { wake: false, dim: [0.4, 1, 0.75, 1], gleam: dev.has('kfgl') ? Number(dev.get('kfgl')) : 0.25, lan: LAN, extend: oldVelvet });
    // the seat as it is (787 triangles: buttons, the oak frame, the cast scroll) within eleven metres of the boat; far beyond, and in the water's mirror
    // (one place in nine is seat_b: its spring has gone and its seat has stayed down, its whole buttoned back showing, the roll worn through at one shoulder)
    const down = (it) => hash(it.s * 3.1 + 0.7, it.d * 7.7) < 0.11, upA = up.filter((it) => !down(it)), upB = up.filter(down);
    const upMirror = await kit.models(`${M}seat_far.glb`, up, H.dress('velvet', { wake: false }));
    ctx.only(upMirror.group, 'mirror');
    for (const mesh of upMirror.meshes) mesh.frustumCulled = false;
    K.heavedModel = { mirror: upMirror, sets: [] };
    for (const [file, list] of [['seat', upA], ['seat_b', upB]]) {
      if (!list.length) continue;
      const near = await kit.models(`${M}${file}.glb`, list, upOpts), far = await kit.models(`${M}seat_far.glb`, list, upOpts);
      ctx.only(near.group, 'direct'); ctx.only(far.group, 'direct');
      levels(near, far, list.map((it) => it.position), 11);
      K.heavedModel.sets.push({ near, far });
    }
    K.heavedEnds = await kit.models(`${M}seat_end.glb`, upEnds, upOpts);
    removeStandIn(ctx, 'seat (pool');
  }

  // ============================================================================================ the fallen sky
  // Pieces of the painted dome (dome_fragment.py, its fifth version, the sixth hand's: a SHATTERED SHEET of lath and plaster: a broken
  // outline, five to eight stiff plates along cracks that wander, each lying at its own small tilt on what it fell across, a finger or a
  // hand apart, the painted cloud running on from plate to plate; laths standing out of some breaks, one plate shed to its laths, a split
  // timber. The fourth version folded along its laths like the lid of a roll-top desk: in the ride, folded card). Six lie across the seat
  // backs under the water where they fell (the page's six places): each is set with the line it drapes along on the crown of a row and
  // its laths along the rows; one runs from the last seats of a row down into the aisle, under the keel. A seventh LEANS ON A BOX FRONT of the wet side (bay 10 on
  // the left, under the tear's edge): it came down edge-first beside the fronts and toppled against the rail: a ramp far wider than
  // it is high (2.6 m along the rail, its highest corner 0.9 m above the water), at forty degrees, so that its painted face looks up
  // at the boat. (Its history: two upright slabs leaned on the fronts in the second version, a tombstone on the right, where nothing
  // fell, and on the left, from across the house, a pale standing figure; the fourth hand laid one over the rail and two chairs,
  // where from the boat it was seen edge-on, a grey trough. Nothing of the sky stands upright, and nothing of it lies on the right
  // of the house: that side is kept.)
  // Their faces wear the `dome` painting (generated for them and for the dome itself: page picture 3).
  if (want('sky')) {
    const pieces = {};
    for (const n of 'abcdefg') Object.assign(pieces, await piecesOf(ctx, `${M}dome_fragment_${n}.glb`));      // (g: the one that leans)
    const dome = await ctx.tex(KF.art.dome);
    const Sq = plan.seats, Bm = plan.beech, moundAt = shared.tree && shared.tree.moundHeight;
    // the crown of a row's backs: a back's face stands 0.2 m behind its place and leans back seven degrees (seat.py), 0.95 m above its floor
    const rowOf = (sv) => Math.round((sv + 0.27 - Sq.from) / Sq.pitch), crownS = (r) => Sq.from + r * Sq.pitch - 0.27;
    const crownY = (sv, dv) => Math.max(plan.stallsFloor(sv), moundAt && Math.hypot(sv - Bm.s, dv - Bm.d) < 9.2 ? moundAt(sv, dv) : -9) + Sq.back + 0.03;
    const one = new THREE.Vector3(1, 1, 1), UPY = new THREE.Vector3(0, 1, 0), items = [];
    const set = (piece, pos, yaw, tint) => items.push({ piece: 'dome_fragment_' + piece, tint, matrix: new THREE.Matrix4().compose(pos, new THREE.Quaternion().setFromAxisAngle(UPY, yaw), one) });
    // across the rows: its first fold on the crown of the row nearest s; its section runs on toward the rear of the house, or toward the stage
    const lie = (piece, sv, dv, toStage, tint) => { const sc = crownS(rowOf(sv)); set(piece, at(ctx, sc, dv, crownY(sc, dv)), toStage ? 0 : Math.PI, tint); };
    // a ramp into the aisle: its level part on the crowns of two rows, its fold at the last seat of the row (d), its fall toward the centre line
    const ramp = (piece, sv, dv, tint) => { const sc = crownS(rowOf(sv)) + Sq.pitch / 2; set(piece, at(ctx, sc, dv, crownY(sc, dv - 0.5 * Math.sign(-dv || 1))), dv < 0 ? -Math.PI / 2 : Math.PI / 2, tint); };
    lie('a', 48, -3, false);                                                // the first painted cloud under the keel: across two backs, both its edges hanging
    lie('d', 52, 1.9, true);                                                // one end on a back, the other down between two rows
    lie('e', 55, -17, false);                                               // on the wet side: across three rows
    ramp('c', 63, -1.0, '#f4f1ea');                                         // from the last seats of two rows down into the aisle, under the keel (its gilt rib uppermost)
    lie('b', 66, -14, true);
    lie('f', 69, -5, false);
    // the one that leans on a box front: modelled where it stands in the box's own space (its foot on the last seat backs, on the outer roll of the rail's pad, its upper edge over the two chairs set for it above)
    K.leaningSky = [];
    for (const [side, i, piece, tint] of KF.leaning) {
      const b = K.bays.find((q) => q.side === side && q.i === i);
      if (!b) continue;
      items.push({ piece: 'dome_fragment_' + piece, tint, matrix: new THREE.Matrix4().makeRotationY(b.turn).setPosition(b.pos) });
      K.leaningSky.push({ bay: b, at: b.at(0, 0.62, -0.4) });
    }
    // (the painting keeps its own colours whatever lights it: distemper is matt and pale, and the lantern's amber on its blue-greys multiplied out to mud)
    const SKYP = dev.has('kfsky') ? dev.get('kfsky').split(',').map(Number) : [0.5, 1.4, 0.2, 0.55];      // the painting: its share of the moon, of the room's dark; its middle value, how much of its own contrast is put back
    // (fifth hand: and its own VALUES. Away from the shaft what lights a piece is the room's dark, which lays nearly the same luminance on a dark thing
    // as on a pale one: the painting's teal depths and pearl clouds came out one pale blue-grey, a sheet of card. The picture's own contrast is put back:
    // each point is taken darker or lighter by how its paint stands to the painting's middle value, so that under the water it is cloud and sky again.)
    const ownHue = { light: /* glsl */`{ float kfSl = dot(c, vec3(0.3, 0.55, 0.15)), kfSa = max(dot(albedo, vec3(0.3, 0.55, 0.15)), 0.012); c = mix(c, albedo * (kfSl / kfSa), 0.62);
      c *= clamp(pow(kfSa / ${SKYP[2].toFixed(3)}, ${SKYP[3].toFixed(3)}), 0.3, 2.2); }` };
    const geo = bake(pieces, items);
    if (geo.paint) { const mesh = new THREE.Mesh(geo.paint, kit.gouache({ vertexColors: true, ...surfaced(H, SW, 'plaster', { wake: false, dim: [0.3, 1, 1, 1] }) })); mesh.name = 'the fallen sky (plaster)'; ctx.add(mesh); }
    if (geo.picture) { const mesh = new THREE.Mesh(geo.picture, kit.gouache({ vertexColors: true, map: dome, ...H.dress('sky', { wake: false, take: [0, 1, SKYP[0], 1], keep: [0.9, SKYP[1], 0.12, 0], extend: ownHue }) })); mesh.name = 'the fallen sky (painting)'; ctx.add(mesh); K.fallenSky = mesh; }
    removeStandIn(ctx, 'dome_fragment');
  }

  // ============================================================================================ ferns
  // Hart's-tongue (fern.glb, three plants): eighteen clumps on the mound (the page's count, in the pockets the mound's own
  // model names), and nineteen more seeded on the left side behind the tree, where the rain comes in (bays 4 to 12): in the
  // sodden velvet of a rail where it meets a pier, on the pedestals' caps behind the colonnettes. All ONE mesh.
  // They nod in the draught, shiver while the water at their foot is lively (rain, a wake arriving) and lean away from the
  // hull within three metres of it: every vertex carries its plant's foot (aOrigin) so that a plant moves as a plant.
  if (want('ferns')) {
    const pieces = await piecesOf(ctx, `${M}fern.glb`), items = [], B = plan.beech, e = new THREE.Euler(), names = { a: 'fern', b: 'fern_b', c: 'fern_c' };      // (fern_a is the file's own body)
    const grow = (kind, pos, yaw, scale, tilt = [0, 0], tint) => items.push({ piece: names[kind], tint, origin: [pos.x, pos.y, pos.z, rnd() * 6.28],
      matrix: new THREE.Matrix4().compose(pos, new THREE.Quaternion().setFromEuler(e.set(tilt[0], yaw, tilt[1], 'YXZ')), new THREE.Vector3(scale, scale * (0.9 + rnd() * 0.25), scale)) });
    const GREENS = ['#ffffff', '#e8f2e0', '#f3f0d8', '#dfeee6', '#fff6e0'];
    // on the mound: in the eighteen pockets its own model names (shared.tree.fernPockets: between the roots, clear of the larger rubble).
    // (If the tree's module did not build there is no mound to grow on, and none are planted.)
    const pockets = (shared.tree && shared.tree.fernPockets) || [];
    pockets.forEach((pk, i) => {
      const sv = -pk.z, dv = pk.x, mh = shared.tree.moundHeight, e2 = 0.25;
      const gs = (mh(sv + e2, dv) - mh(sv - e2, dv)) / (2 * e2), gd = (mh(sv, dv + e2) - mh(sv, dv - e2)) / (2 * e2);      // the slope under it: a plant stands square to its ground, half way
      grow('abc'[(i * 7) % 3], new THREE.Vector3(pk.x, pk.y - 0.015, pk.z), rnd() * 6.28, 0.85 + rnd() * 0.5, [Math.atan(gs) * 0.5, -Math.atan(gd) * 0.5], GREENS[i % GREENS.length]);
    });
    // in the openings of the wet side, behind the tree where the rain comes in (the left side, bays 4 to 12): rooted in the sodden
    // velvet of a rail where it meets a pier, on the pedestals' caps behind the colonnettes (the old plants there hang their
    // fronds down the pedestal's face). [bay, kind, where in the box's own space (x, y, z), scale]
    const CAP = 0.662, PAD = 0.252, nMound = items.length;
    // (fifth hand: there were nineteen, half life size, a tuft at the foot of a pier here and there: from the boat the wet side had no ferns to speak of.
    // The page: "ferns in the box openings". Now every opening from bay 4 to bay 12 is grown in, thickest under the tear's edge (bays 6 to 10) and
    // thinning toward both ends: a full plant in each corner where the rail meets a pier, its fronds arching out over the water and back into the box;
    // old plants rooted on the outer roll of the velvet that hang their fronds down the carved front to the water; one on a pedestal's cap behind the
    // colonnette; young ones between. A fifth over life size, as everything left on these rails is. `wetFern(bay, kind, x, where, scale)`: where is
    // 'pad' (on the velvet, toward its inner edge), 'roll' (on its outer roll: the hanging kind), 'cap' (a pedestal's cap).)
    const wetFern = (i, kind, x, where, scale) => {
      const b = K.bays.find((q) => q.side === -1 && q.i === i); if (!b) return;
      const [y, z] = where === 'cap' ? [CAP, -0.03] : where === 'roll' ? [PAD - 0.004, 0.16] : [PAD, 0.07];
      // (the old plant's five lying fronds leave it between its own +x and its back, fern.py: turned by -2.53 they hang out over the water, a little askew)
      const yaw = kind === 'c' ? b.turn - 2.53 + (rnd() - 0.5) * 0.8 : rnd() * 6.28, sc = scale * (0.92 + rnd() * 0.16), dz = (rnd() - 0.5) * 0.03;
      const pos = b.at(x, y, z + dz);
      // (never on a thing somebody left: a fern on the shawl that hangs over a rail was a plant in a red pot)
      if ((K.trinkets || []).some((t) => t.bay === b && Math.hypot(t.at.x - pos.x, t.at.z - pos.z) < (t.kind === 'over' ? 0.5 : 0.26))) return;
      grow(kind, pos, yaw, sc, [0, 0], GREENS[(i + kind.charCodeAt(0) + Math.round(x * 3)) % GREENS.length]);
    };
    const THICK = { 4: 0.45, 5: 0.7, 6: 1, 7: 1, 8: 1, 9: 0.9, 10: 0.8, 11: 0.6, 12: 0.4 };
    for (const [i, k] of Object.entries(THICK)) {
      const bay = +i, slab = bay === 10;                                   // (bay 10: the piece of sky leans on its rail from -1.25 to 1.32)
      wetFern(bay, 'a', -1.36, 'pad', 0.75 + 0.5 * k);                     // the corner at the rear pier: the largest
      if (k > 0.75) wetFern(bay, 'b', -1.12, 'roll', 0.75 + 0.3 * k);      // ... and a second crown beside it, on the roll
      if (k > 0.5) wetFern(bay, 'a', 1.38, 'pad', 0.6 + 0.45 * k);         // the corner at the stage-ward pier
      else wetFern(bay, 'b', 1.36, 'pad', 0.7 + 0.4 * k);
      if (!slab && k > 0.6) wetFern(bay, 'c', (bay % 2 ? -0.55 : 0.62) + (rnd() - 0.5) * 0.3, 'roll', 0.8 + 0.3 * k);      // an old one hanging down the front
      if (!slab && k > 0.85) wetFern(bay, 'c', (bay % 2 ? 0.95 : -1.0), 'roll', 0.7 + 0.2 * rnd());
      if (k > 0.55) wetFern(bay, 'c', bay % 2 ? 1.56 : -1.56, 'cap', 0.65 + 0.25 * k);      // on a pedestal's cap, hanging down its face
      if (!slab) wetFern(bay, 'b', (bay % 3 - 1) * 0.5 + (rnd() - 0.5) * 0.3, 'pad', 0.55 + 0.35 * k);                    // a young one between
      if (!slab && k > 0.95) wetFern(bay, 'b', (bay % 2 ? 0.25 : -0.3), 'roll', 0.6);
    }
    K.ferns = items.map((it) => ({ at: new THREE.Vector3(it.origin[0], it.origin[1], it.origin[2]) }));
    const fernExt = {
      uniforms: { uKfDraught: draught },
      vertexPars: 'attribute vec4 aOrigin; uniform vec4 uKfDraught; uniform sampler2D tRipple; uniform vec4 uRippleRect;',
      vertexWorld: /* glsl */`{
        float kfFree = uv.x, kfPh = aOrigin.w + uv.y;
        float kfA = sin(uTime * 0.9 + kfPh) * 0.6 + sin(uTime * 0.57 + kfPh * 1.7) * 0.4;
        vec2 kfOut = wp.xz - aOrigin.xz; kfOut /= max(length(kfOut), 1e-3);                 // the way this frond lies
        wp.xz += uKfDraught.xy * (kfFree * (uKfDraught.z * 0.6 * kfA + uKfDraught.w * 0.6));
        wp.y += kfFree * 0.012 * kfA;
        // the hull: within three metres the fronds lean away from it and are pressed down a little
        vec2 kfAway = aOrigin.xz - uBoat.xz; float kfD = length(kfAway), kfNear = smoothstep(4.6, 1.8, kfD);
        wp.xz += kfAway / max(kfD, 1e-3) * (kfFree * 0.11 * kfNear); wp.y -= kfFree * 0.03 * kfNear;
        // the water at its foot: while it is lively (the rain's rings, a wake arriving) the fronds shiver
        vec2 kfUv = (aOrigin.xz - uRippleRect.xy) / uRippleRect.zw + 0.5;
        float kfLive = (kfUv.x > 0.02 && kfUv.x < 0.98 && kfUv.y > 0.02 && kfUv.y < 0.98) ? clamp(texture2D(tRipple, kfUv).a * 4.0, 0.0, 1.0) : 0.0;
        wp.xz += vec2(-kfOut.y, kfOut.x) * (kfFree * 0.016 * kfLive * sin(uTime * 11.0 + kfPh * 5.0));
        wp.y += kfFree * 0.012 * kfLive * sin(uTime * 13.0 + kfPh * 3.0);
      }`,
    };
    // two meshes: the mound's (in the shaft: a fifth of the wet gleam, or the fronds are white stars), and the wet side's (out of the shaft, in the
    // spill of the lit rain: they take more of the moon and of the gleam, or they are dark tufts on a dark wall: &kffern=moon,gleam tries others)
    const FW = dev.has('kffern') ? dev.get('kffern').split(',').map(Number) : [1.4, 0.42, 1.6];
    const geo = bake(pieces, items.slice(0, nMound)), geoW = bake(pieces, items.slice(nMound));
    if (geo.cloth) { const mesh = new THREE.Mesh(geo.cloth, kit.gouache({ vertexColors: true, side: THREE.DoubleSide, ...H.dress('leaf', { wake: false, keep: [0.75, 1, 0.22, 0.1], extend: fernExt }) })); mesh.name = "hart's-tongue ferns"; /* (gleam 0.22: at 0.9 the fronds in the shaft were white stars) */ mesh.frustumCulled = false; ctx.add(mesh); K.fernMesh = mesh; }
    if (geoW.cloth) { const mesh = new THREE.Mesh(geoW.cloth, kit.gouache({ vertexColors: true, side: THREE.DoubleSide, ...H.dress('leaf', { wake: false, take: [0, 1, FW[0], 1], keep: [0.9, FW[2], FW[1], 0.1], extend: fernExt }) })); mesh.name = "hart's-tongue ferns (the wet side)"; mesh.frustumCulled = false; ctx.only(mesh, 'direct'); ctx.add(mesh); K.fernMeshWet = mesh; }
    removeStandIn(ctx, 'fern');
  }

  // ============================================================================================ things afloat
  // Not the leaves (the cast's): the few made things the water has taken: blank cards, a sodden cushion against a pier, a
  // posy. Only where the hull cannot come (inside boxes, in the strip under the rails). ONE mesh; each rides the water
  // as one stiff thing: it tilts with the slope of the ripples under its middle and rocks a little of its own accord.
  const floatExt = {
    vertexPars: 'attribute vec4 aOrigin; uniform sampler2D tRipple; uniform vec4 uRippleRect;',
    vertexWorld: /* glsl */`{
      vec2 kfUv = (aOrigin.xz - uRippleRect.xy) / uRippleRect.zw + 0.5;
      vec4 kfR = (kfUv.x > 0.02 && kfUv.x < 0.98 && kfUv.y > 0.02 && kfUv.y < 0.98) ? texture2D(tRipple, kfUv) : vec4(0.0);
      vec2 kfSl = kfR.xy * 0.7 + 0.018 * vec2(sin(uTime * 0.7 + aOrigin.w), cos(uTime * 0.53 + aOrigin.w * 1.3));      // the water's slope under it, and its own slow rocking
      wp.y += dot(kfSl, wp.xz - aOrigin.xz) + 0.004 * sin(uTime * 0.8 + aOrigin.w);
    }`,
  };
  if (want('afloat')) {
    const pieces = await piecesOf(ctx, `${M}trinkets.glb`), items = [], e = new THREE.Euler(), one = new THREE.Vector3(1, 1, 1);
    const float = (piece, pos, yaw, sunk, tint) => { pos.y = -sunk; items.push({ piece, tint, origin: [pos.x, pos.y, pos.z, rnd() * 6.28], matrix: new THREE.Matrix4().compose(pos, new THREE.Quaternion().setFromEuler(e.set(0, yaw, 0)), one) }); };
    const bay = (side, i) => K.bays.find((q) => q.side === side && q.i === i), pier = (side, i) => K.piers.find((q) => q.side === side && q.i === i);
    const inBox = (b, x, z) => b.at(x, 0, z);
    const SOD = '#8f927f';                                                  // sodden: darker, greener
    for (const [side, i, piece, x, z, sunk, tint] of [
      [1, 5, 'trinkets', 0.35, -1.05, 0.0, '#e9e6da'], [1, 6, 'trinkets', -0.5, 0.62, 0.0, '#dcdccb'], [-1, 8, 'trinkets', 0.6, -0.9, 0.0, '#e9e6da'], [-1, 3, 'trinkets', -0.2, 0.7, 0.0, '#dcdccb'],
      [1, 11, 'cards', 0.1, -1.2, 0.0, '#e9e6da'], [1, 13, 'trinkets', 1.1, 0.55, 0.0, '#dcdccb'], [-1, 12, 'trinkets', -0.7, 0.6, 0.0, '#e2e0d2'], [1, 4, 'trinkets', 0.2, -0.95, 0.0, '#e4e1d4'],
      [-1, 9, 'cushion', -0.9, -1.1, 0.062, SOD], [-1, 6, 'posy', 0.2, -0.75, 0.03, '#b9b6a2'], [1, 9, 'cards', 0.4, 0.6, 0.0, '#c9c8b8'], [1, 2, 'cushion', 0.3, 0.6, 0.066, SOD],
    ]) { const b = bay(side, i); if (b) float(piece, inBox(b, x, z), rnd() * 6.28, sunk, tint); }
    { const pr = pier(1, 5); if (pr) { const c = Math.cos(pr.turn), sn = Math.sin(pr.turn), lx = 0.42, lz = 0.52; float('cushion', new THREE.Vector3(pr.pos.x + lx * c + lz * sn, 0, pr.pos.z - lx * sn + lz * c), pr.turn + 0.5, 0.062, SOD); } }      // lodged against the pier between postcard 2's two nearest boxes
    K.afloat = items.map((it) => ({ at: new THREE.Vector3(it.origin[0], it.origin[1], it.origin[2]) }));
    const geo = bake(pieces, items);
    if (geo.paint) { const mesh = new THREE.Mesh(geo.paint, kit.gouache({ vertexColors: true, ...surfaced(H, SW, 'card', { wake: false, extend: floatExt }) })); mesh.name = 'things afloat'; mesh.frustumCulled = false; ctx.only(mesh, 'direct'); ctx.add(mesh); K.afloatMesh = mesh; }
  }

  // ============================================================================================ leaves that have come to rest
  // Not the leaves in the air or adrift (the cast's): the ones the draught left somewhere, and that have lain there since.
  // A small drift on the rail against the stage-ward pier of a box (the draught goes toward the stage: that pier stops them),
  // some propped on the pier itself; a leaf or two alone on the velvet; a few sunk on the box's carpet;
  // a few afloat in the still water inside a box, riding what ripples reach them. Copper keeps its colour in the house's dark:
  // these are the warm notes of the boxes before a candle burns. One instanced mesh, six triangles a leaf; never in the mirror.
  if (want('leaves')) {
    const L = 0.1, w = 0.033, h = 0.0085, lp = [[0, 0, 0], [0, 0, L * 0.5], [0, 0.004, L], [-w, h, L * 0.38], [-w * 0.72, h * 0.8, L * 0.74], [w, h, L * 0.38], [w * 0.72, h * 0.8, L * 0.74]];
    const lg = new THREE.BufferGeometry();
    lg.setAttribute('position', new THREE.Float32BufferAttribute(lp.flat(), 3)); lg.setIndex([0, 3, 1, 1, 3, 4, 1, 4, 2, 0, 1, 5, 1, 6, 5, 1, 2, 6]); lg.computeVertexNormals();
    lg.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(14), 2));
    const COL = ['#B5522A', '#B5522A', '#9C4526', '#7A3B22', '#C08A3A', '#5A2630', '#C4622E', '#C08A3A'].map((c) => new THREE.Color(c));
    const list = [], R = (a, b) => a + (b - a) * rnd();
    const rest = (p, nx, nz, afloat = 0, dark = 1) => list.push({ p, n: new THREE.Vector3(nx, 1, nz).normalize(), yaw: R(0, 6.283), k: R(0.8, 1.3), col: Math.floor(R(0, COL.length)), shade: dark * R(0.5, 0.86), afloat });
    for (const b of K.bays) {
      const st = b.side > 0 ? -1 : 1, c = K.chairs.filter((q) => q.bay === b);          // the box's stage-ward end
      if (rnd() < 0.82) {                                                                 // the drift against the pier
        const n = 2 + Math.floor(R(0, 6));
        for (let j = 0; j < n; j++) {
          const off = R(0.01, 0.34) * R(0.3, 1);                                          // (more of them close against it)
          if (off < 0.05 && rnd() < 0.7) rest(b.at(st * (1.445 - off), 0.262 + R(0, 0.07), R(0.02, 0.2)), -st * 1.6, R(-0.4, 0.4));      // propped on the pier's own side
          else rest(b.at(st * (1.44 - off), 0.2545 + 0.0035 * j, R(0.0, 0.2)), R(-0.3, 0.3), R(-0.3, 0.3));
        }
      }
      if (rnd() < 0.55) rest(b.at(R(-1.2, 1.2), 0.2545, R(0.03, 0.18)), R(-0.2, 0.2), R(-0.2, 0.2));
      if (b.design === 'c') continue;                                                     // (nothing of a drawn box's inside is seen)
      for (let j = 0, n = 3 + Math.floor(R(0, 3)); j < n; j++) rest(b.at(R(-1.3, 1.3), KF.box.floor + 0.016, R(-1.5, -0.15)), R(-0.15, 0.15), R(-0.15, 0.15), 0, 0.6);      // sunk on the carpet
      for (let j = 0, n = 2 + Math.floor(R(0, 3)); j < n; j++) {                          // afloat in the box
        const x = R(-1.3, 1.3), z = R(-1.45, -0.1);
        if (c.some((ch) => Math.hypot(ch.pos.x - b.at(x, 0, z).x, ch.pos.z - b.at(x, 0, z).z) < 0.32)) continue;
        rest(b.at(x, 0.004, z), R(-0.12, 0.12), R(-0.12, 0.12), 1, 0.8);
      }
    }
    // LODGED AGAINST THE BOX FRONTS (third hand; the director: "things afloat or lodged against a box front"). What floats is carried toward the stage,
    // and every pedestal stands a hand proud of the rail: in the nook on its rear side a small raft of leaves has gathered, thickest against the
    // pedestal, and a leaf or two lies along the rail's foot. They ride the ripples as the leaves afloat in the boxes do; they mark where the water is.
    for (const p of K.piers) {
      const c = Math.cos(p.turn), sn = Math.sin(p.turn), up = p.side > 0 ? 1 : -1;      // (in a pier's own space, as in a box's, the stage lies toward -x on the right of the house)
      const P = (x, z) => new THREE.Vector3(p.pos.x + x * c + z * sn, 0.004, p.pos.z - x * sn + z * c);
      for (let j = 0, n = 3 + Math.floor(R(0, 7)); j < n; j++) { const off = R(0.02, 0.55) * R(0.35, 1); rest(P(up * (0.23 + off), R(0.285, 0.36 + 0.4 * (0.55 - off))), R(-0.12, 0.12), R(-0.12, 0.12), 1, 0.85); }
      if (rnd() < 0.6) rest(P(-up * R(0.35, 1.4), R(0.29, 0.38)), R(-0.12, 0.12), R(-0.12, 0.12), 1, 0.8);
    }
    const leafExt = {
      vertexPars: 'attribute vec4 aKfLeaf; uniform sampler2D tRipple; uniform vec4 uRippleRect;',
      vertexWorld: /* glsl */`if (aKfLeaf.w > 0.5) {
        vec2 kfUv = (aKfLeaf.xy - uRippleRect.xy) / uRippleRect.zw + 0.5;
        vec4 kfR = (kfUv.x > 0.02 && kfUv.x < 0.98 && kfUv.y > 0.02 && kfUv.y < 0.98) ? texture2D(tRipple, kfUv) : vec4(0.0);
        vec2 kfSl = kfR.xy * 0.7 + 0.02 * vec2(sin(uTime * 0.7 + aKfLeaf.z), cos(uTime * 0.53 + aKfLeaf.z * 1.3));
        wp.y += dot(kfSl, wp.xz - aKfLeaf.xy) + 0.003 * sin(uTime * 0.8 + aKfLeaf.z);
      }`,
    };
    const mesh = new THREE.InstancedMesh(lg, H.paint('leaf', { color: '#ffffff', side: THREE.DoubleSide, brush: 0.3, extend: leafExt }), list.length);
    const m4 = new THREE.Matrix4(), qa = new THREE.Quaternion(), qb = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), sc = new THREE.Vector3(), c3 = new THREE.Color(), aux = new Float32Array(list.length * 4);
    list.forEach((it, i) => {
      qa.setFromUnitVectors(up, it.n).multiply(qb.setFromAxisAngle(up, it.yaw));
      mesh.setMatrixAt(i, m4.compose(it.p, qa, sc.setScalar(it.k)));
      mesh.setColorAt(i, c3.copy(COL[it.col]).multiplyScalar(it.shade));
      aux.set([it.p.x, it.p.z, it.yaw * 3.1, it.afloat], i * 4);
    });
    mesh.geometry.setAttribute('aKfLeaf', new THREE.InstancedBufferAttribute(aux, 4));
    mesh.name = 'leaves that have come to rest'; mesh.frustumCulled = false; mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    ctx.only(mesh, 'direct'); ctx.add(mesh);
    K.restingLeaves = { mesh, places: list.map((it) => it.p) };
  }

  // ============================================================================================ the foyer's small pieces
  // A leaf rosette in each of the ceiling's eighteen coffers; sixty balusters down the open edge of each stair; an unlit bronze
  // lamp standard on the newel at the foot of each stair (its collider is the plan's 'newel and lamp standard').
  if (want('foyer')) {
    const fo = plan.foyer, St = fo.stairs, ros = [], bal = [];
    const BTINT = ['#ffffff', '#dfe4da', '#c6cec6', '#f0e9d8', '#d2cbbd', '#b4beb6', '#e8ebe2'];      // (sixth hand: the balusters were one tan by the lantern: stone of a hundred years, some damp, some rubbed, no two neighbours of one tone)
    for (let i = 0; i < 6; i++) for (const d of [-6.67, 0, 6.67]) ros.push({ position: at(ctx, 1.45 + i * 5.3, d, fo.height - 0.06), rotation: [Math.PI / 2, 0, (i * 3 + Math.round(d)) * 0.5236], scale: 2.3 + ((i * 5 + Math.round(d + 7)) % 3) * 0.08, tint: TINT[(i + Math.round(d + 7)) % TINT.length] });
    K.rosettes = await kit.models(`${M}rosette.glb`, ros, surfaced(H, SW, 'gilt', { wake: true }));
    removeStandIn(ctx, 'rosette');
    for (const sign of [-1, 1]) for (let i = 0; i < St.balusters; i++) {
      // (down to the newel and no further: below it the stair has no handrail, and a row of balusters stood in the water carrying nothing)
      const u = i / (St.balusters - 1) * 0.484, k = u * (St.line.length - 1), j = Math.min(St.line.length - 2, Math.floor(k)), f = k - j, a = St.line[j], b = St.line[j + 1];
      bal.push({ position: at(ctx, a[0] + (b[0] - a[0]) * f, sign * (a[1] + (b[1] - a[1]) * f - St.width / 2 + 0.08), a[2] + (b[2] - a[2]) * f), rotation: rnd() * 6.28, scale: [1, 0.97 + rnd() * 0.06, 1], tint: BTINT[(i * 5 + (sign > 0 ? 2 : 0) + (i % 7 === 3 ? 1 : 0)) % BTINT.length] });
    }
    // (two balusters: one in five is baluster_b, the same turning with an arris gone, a chip out of its belly and a run of damp down it)
    const worn = (i) => (i * 7 + 3) % 5 === 0;
    K.balusters = [await kit.models(`${M}baluster.glb`, bal.filter((_, i) => !worn(i)), surfaced(H, SW, 'plaster', { wake: true })),
      await kit.models(`${M}baluster_b.glb`, bal.filter((_, i) => worn(i)), surfaced(H, SW, 'plaster', { wake: true }))];
    removeStandIn(ctx, 'baluster');
    K.lampStandards = await kit.models(`${M}lamp_standard.glb`, [-1, 1].map((sg) => ({ position: at(ctx, fo.newel.s, sg * fo.newel.d, 0), rotation: sg > 0 ? 0.4 : 2.6, tint: sg > 0 ? '#ffffff' : '#f2f6ee' })), surfaced(H, SW, 'brass', { wake: true }));
    removeStandIn(ctx, 'lamp_standard');
    // (stage 6, 5-critique.md: 61,000 triangles in each of three passes wherever the boat is. Once the boat is twenty metres into the house they are seen, if at
    // all, through an arch from thirty metres and more: the picture keeps them, the mirror and the engine's first picture go without. &foyerall=1: as it was.)
    if (!dev.has('foyerall')) for (const set of [K.rosettes, ...K.balusters, K.lampStandards]) for (const mesh of set.meshes) {
      if (!mesh.isInstancedMesh) continue;
      const all = mesh.count;
      mesh.onBeforeRender = (renderer) => { if (ctx.s > 50 && (ctx.engine.reflecting || renderer.getRenderTarget() === ctx.engine.pre)) mesh.count = 0; };
      mesh.onAfterRender = () => { mesh.count = all; };
    }
  }

  // ============================================================================================ for the cast
  // Where a moth may rest: places the models themselves name (parterre_points.json, written by parterre.py), turned into the
  // realm. Each: { at (a point just clear of the surface), out (the way the surface faces), on: 'colonnette' | 'pedestal' | 'capital' | 'rail' | 'pelmet' }.
  {
    const toLocal = ([x, y, z]) => [x, z, -y];                              // Blender (x, y, z) is the ride's (x, z, -y)
    const pp = (PTS.parterre_pier_a || {}).perches || [], bp = (PTS.parterre_box_a || {}).perches || [];
    for (const p of K.piers) { const c = Math.cos(p.turn), sn = Math.sin(p.turn); pp.forEach((q, k) => { const [x, y, z] = toLocal(q);
      K.perches.push({ at: new THREE.Vector3(p.pos.x + x * c + z * sn, y, p.pos.z - x * sn + z * c), out: new THREE.Vector3(sn, 0, c), on: ['colonnette', 'colonnette', 'colonnette', 'pedestal', 'capital'][k] || 'colonnette', side: p.side, s: p.s }); }); }
    for (const b of K.bays) bp.forEach((q, k) => { const [x, y, z] = toLocal(q); K.perches.push({ at: b.at(x, y, z), out: new THREE.Vector3(Math.sin(b.turn), 0, Math.cos(b.turn)), on: k < 2 ? 'rail' : 'pelmet', side: b.side, s: b.s }); });
  }

  if (dev.has('kfcount')) console.error(`KF_COUNT chairs ${K.chairs.length} trinkets ${K.trinkets.length} afloat ${(K.afloat || []).length} leaves ${K.restingLeaves ? K.restingLeaves.places.length : 0} ferns ${(K.ferns || []).length} heaved ${(K.heavedSeats || []).length} perches ${K.perches.length}`);
  void rnd;
  return {
    update() {
      setLevels();
      if (laySeats) laySeats();
      // the draught: before the hour the cloth only stirs; from c 0 it leans toward the stage (4 cm), and from c 29 to 37 it streams (12 cm)
      const c = show.c, calm = ctx.reducedMotion ? 0.4 : 1;
      draught.value.z = 0.03 * calm * (1 + 3 * Math.min(1, Math.max(0, K.gust.value)));
      draught.value.w = (0.04 * smooth(0, 3, c) + 0.08 * smooth(29, 31, c) * (1 - smooth(36, 40, c))) * calm;
    },
  };
}
