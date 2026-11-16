// The town below: the roofs at the waterline (stage 2, kit and close band: docs/build/town/2-kit-roofs.md).
// Everything that breaks the surface along the street, and what lies just under it where the boat passes within arm's
// length: the fifteen roofs awash (right bank in clay pantiles, left bank in slate), their ridge tiles and coped gable
// ends, the chimney stacks and their pots, the four cross gables with their half-lit windows, the dovecote, the roof
// ladder, the skylight, the vanes, the balcony rail, and the weed that rises from the deeper pots.
//
// How it is built. The small units are modelled by hand in Blender (source-art/models/town/kr_*.py -> assets/models/
// town/) and a roof is GROWN from them here, tile by tile, to the size and place the layout gives each house, so that no
// two roofs are alike and every roof fits: its own sag, its own slipped and missing tiles, its own patches of colour.
//   - tiles and slates: four instanced meshes (above the surface: in the mirror too; deep: direct view only)
//   - everything else that stands still: merged into two meshes (what crosses the surface; what is wholly under it)
//   - the vanes turn inside the merged mesh (three pivots in the vertex shader); the weed is the ribbons family's
// One material for all of it: the area's light (light.mat) with this kit's own paint added in the shader (KR below):
//   - the mark the water leaves on brick, clay, slate and lead, drawn exactly at the surface whatever height a piece
//     stands at: a dark wet band 15 cm high that the wake wets higher, a thread of jade weed on the line, the pale tide
//     mark at 0.6 m, a film of algae and silt below;
//   - moss, which fills the hollows first (the alpha of a model's paint says where they are), and lichen;
//   - the rooms behind the gables' windows (slot `lit`: they give off light only below the surface, and wake and sleep
//     with their street), and the dark glass above the water (slot `glass`).
//
// Developer switches (address):  &kr=tiles,stacks,gables,small,weed  build only these parts   &krmarks=0  no waterline paint
//                                &krlog=1  print what was made        &krvane=<degrees>  hold the arrow vane there
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { makeWind, makeRibbons } from '../../engine/life/ribbons.js';

const Q = new URLSearchParams(typeof location !== 'undefined' ? location.search : '');
const ONLY = (Q.get('kr') || '').split(',').filter(Boolean);
const want = (part) => !ONLY.length || ONLY.includes(part);
const DIR = 'assets/models/town/';

// ------------------------------------------------------------------------------------------------ this kit's paint
// (GLSL added to the area's material. Everything is by world position, so it is exact at the surface and it crosses
// from one tile, brick or piece to the next without a seam. aKr, four numbers per piece: x = what it is (0 paint, 1 a
// lit room, 2 glass, 3 4 5 the vanes), and for paint y = how mossy its place is, z = its own random number, w = how
// plainly it shows the tide mark; for a lit room y = its street's distance along the route / 300, z = its random
// number, w = 1 if it stays lit when its street sleeps.)
const KR_GLSL = /* glsl */`
  float krHash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
  float krNoise(vec3 x) { vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(krHash(i), krHash(i + vec3(1.0, 0.0, 0.0)), f.x), mix(krHash(i + vec3(0.0, 1.0, 0.0)), krHash(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
               mix(mix(krHash(i + vec3(0.0, 0.0, 1.0)), krHash(i + vec3(1.0, 0.0, 1.0)), f.x), mix(krHash(i + vec3(0.0, 1.0, 1.0)), krHash(i + vec3(1.0, 1.0, 1.0)), f.x), f.y), f.z); }
  // how disturbed the water is at a place (the engine's ripple field round the boat; nothing outside it)
  float krRipple(vec2 xz) { vec2 uv = (xz - uRippleRect.xy) / uRippleRect.zw + 0.5, e = min(uv, 1.0 - uv); return min(e.x, e.y) > 0.0 ? clamp(texture2D(tRipple, uv).a * 4.0, 0.0, 1.0) * smoothstep(0.0, 0.08, min(e.x, e.y)) : 0.0; }
`;
const krExtend = (U) => ({
  defines: { TOWN_AFLOAT: '' },                                  // (the line at the surface is drawn below, by this kit: see the end of `light`)
  uniforms: U,
  vertexPars: 'attribute vec4 aKr; varying vec4 vKr; flat varying float vKrOne; uniform vec4 uKrVane[3];',
  vertexWorld: /* glsl */`
    vKr = aKr;
    #ifdef USE_INSTANCING_COLOR
      vKrOne = fract(dot(instanceColor, vec3(37.1, 91.7, 53.3)));      // (one number per copy: a tile's own, from its tint)
    #else
      vKrOne = fract(aKr.z * 7.31);
    #endif
    if (aKr.x > 0.011) {                                        // a vane: it turns about its own spindle
      vec4 kv = aKr.x < 0.0137 ? uKrVane[0] : aKr.x < 0.0176 ? uKrVane[1] : uKrVane[2];
      float kc = cos(kv.z), ks = sin(kv.z); vec2 kq = wp.xz - kv.xy;
      wp.xz = kv.xy + vec2(kq.x * kc + kq.y * ks, -kq.x * ks + kq.y * kc);
      wn.xz = vec2(wn.x * kc + wn.z * ks, -wn.x * ks + wn.z * kc);
    }`,
  fragmentPars: KR_GLSL + 'varying vec4 vKr; flat varying float vKrOne; uniform vec3 uKrWet, uKrTide, uKrWeed, uKrMoss, uKrLichen, uKrGlass, uKrSheen; uniform vec4 uKrMarks, uKrMarks2, uKrLit, uKrSilt, uKrUnder, uKrNear, uKrBrick, uKrGlassK, uKrCool, uKrStone, uKrLine; uniform vec3 uKrTint; float kCoolPaint, kStone;' + /* glsl */`
  // Every mark this kit lays on its paint is laid twice: on the paint as the water has repainted it (albedo: what the
  // water's own light shows) and on the paint as it was made (kOwn: what a lantern shows; see the light hook).
  #define KMUL(m) { vec3 k_m = vec3(m); albedo *= k_m; kOwn *= k_m; }
  #define KADD(a) { vec3 k_a = (a); albedo += k_a; kOwn += k_a; }
  #define KMIX(t, f) { vec3 k_t = (t); float k_f = (f); albedo = mix(albedo, k_t, k_f); kOwn = mix(kOwn, k_t, k_f); }
  `,
  albedo: /* glsl */`
    float kkind = vKr.x * 255.0;
    #ifdef USE_COLOR_ALPHA
      float kalpha = vColor.a;
    #else
      float kalpha = 1.0;
    #endif
    #ifdef USE_COLOR
      vec3 kOwn = vColor.rgb;                                    // the paint as it was made, before the area repainted it for the water
    #else
      vec3 kOwn = albedo;
    #endif
    // (how COOL a paint is in itself: dressed stone, old timber, lead, paint gone grey, as against brick, clay and warm mortar;
    // what is green in itself is neither. And whether a point is DRESSED STONE: the models mark it, alpha exactly 0.96. See the light hook.)
    kCoolPaint = 0.0; kStone = 0.0;
    #ifdef USE_COLOR
      if (kkind < 0.5) { float kmx0 = max(vColor.r, max(vColor.g, vColor.b));
        kCoolPaint = (1.0 - smoothstep(-0.03, 0.10, (vColor.r - vColor.b) / max(kmx0, 1e-3))) * (1.0 - smoothstep(0.0, 0.05, vColor.g - max(vColor.r, vColor.b)));
        kStone = step(abs(kalpha - 0.96), 0.004); }
    #endif
    if (kkind < 0.5 || kkind > 2.5) {
    float ky = vWPos.y, kdist = length(vViewPos);
    float kn = krNoise(vWPos * vec3(1.3, 0.5, 1.3)), kf = krNoise(vWPos * 7.0 + 3.0);
    // ---- moss and lichen, which take no notice of where one tile ends and the next begins. vKr.y: how mossy this
    // piece's place is. Moss fills the hollows first (the paint's alpha: 0 in a pan, under a lip, in a joint), most of
    // all within half a metre of the surface, in patches a few tiles across; lichen spots what stands dry.
    float khol = 1.0 - kalpha, km = vKr.y;
    KMUL(uKrTint)
    // what weather does to any wall or stone: stains in slow patches, and the rain's runs down it
    KMUL(0.86 + 0.22 * krNoise(vWPos * vec3(2.3, 1.1, 2.3) + 7.0) + 0.10 * (krNoise(vec3(vWPos.x * 8.0, vWPos.y * 0.7, vWPos.z * 8.0)) - 0.5) * (1.0 - abs(N.y)))
    // AT ARM'S LENGTH a brick, a tile, a stone is not one colour: the grain of fired clay and of tooled stone (a finger
    // wide), the painter's dabs inside every brick (a hand wide, a little warmer here, a little cooler there). It is
    // drawn only where the eye can use it, within a few metres; from across the street nothing changes and nothing crawls.
    // (Without it a wall at one metre was flat coloured rectangles: toy blocks.)
    float knear = (1.0 - smoothstep(3.5, 10.0, kdist)) * uKrNear.x;
    if (knear > 0.0) {
      float kg1 = krNoise(vWPos * 34.0 + 1.7), kg2 = krNoise(vWPos * vec3(10.0, 17.0, 10.0) + 17.0), kg3 = krNoise(vWPos * 5.3 + 29.0) - 0.5;
      KMUL((1.0 + knear * (0.40 * (kg1 - 0.5) + 0.32 * (kg2 - 0.5))) * mix(vec3(1.0), vec3(1.0 + 0.22 * kg3, 1.0, 1.0 - 0.22 * kg3), knear))
    }
    // A BRICK'S FACE. The models mark it (kr_lib: the paint's alpha is exactly 0.98) and lean its shading normals outward
    // at its four corners. So a brick is LIT as the worn, rounded thing it is (the light from below catches its lower
    // arris, the night its upper one), and the lean also says WHERE on the brick a point is: kbuv, -1..1 along it and
    // -1..1 up it. With that it is PAINTED as a brick: its arrises dark where the joint's shadow lies on them, bitten
    // where they are chipped, its corners rounded off. It costs no points and no triangles: a brick is still two.
    // (A wall at one metre was flat coloured cards with a hair line between them.)
    if (vKr.w > 0.9 && abs(kalpha - 0.98) < 0.004 && uKrBrick.y > 0.0) {
      vec3 kng = normalize(cross(dFdx(vWPos), dFdy(vWPos))); if (dot(kng, N) < 0.0) kng = -kng;
      vec3 kdv = N - kng * dot(N, kng);
      vec3 ktu = normalize(cross(vec3(0.0, 1.0, 0.0), kng) + vec3(1e-5, 0.0, 0.0)), ktv = cross(kng, ktu);
      vec2 kbuv = clamp(vec2(dot(kdv, ktu), dot(kdv, ktv)) / uKrBrick.x, -1.0, 1.0);
      float kwob = krNoise(vWPos * 23.0 + 61.0);
      float kde = min((1.0 - abs(kbuv.x)) * 0.1075, (1.0 - abs(kbuv.y)) * 0.0325) + 0.007 * (kwob - 0.55);      // metres to the nearest arris, ragged
      // (fifth holder: the shadow on the arris is a HAIR's breadth, 5 mm, not 10: with a broad dark arris either side of
      // a 10 mm joint the joint read 30 mm wide, a third of a course, and the bricks as orange cards afloat in it)
      float karris = 1.0 - smoothstep(0.0, 0.010 * uKrBrick.z, kde);                                               // the joint's shadow on the arris
      float kchip = smoothstep(0.66, 0.82, krNoise(vWPos * 13.0 + 7.0)) * (1.0 - smoothstep(0.003, 0.020, kde));   // a bite out of it, here and there
      float kcorn = (1.0 - smoothstep(0.0, 0.024, (1.0 - abs(kbuv.x)) * 0.1075)) * (1.0 - smoothstep(0.0, 0.016, (1.0 - abs(kbuv.y)) * 0.0325));
      float kfar = (1.0 - smoothstep(9.0, 24.0, kdist)) * uKrBrick.y;
      KMUL(1.0 - kfar * (1.0 - (1.0 - uKrBrick.w * karris) * (1.0 - 0.45 * kchip) * (1.0 - 0.40 * kcorn)))
      // (and its face is never one tone from end to end: fired harder at one end, a darker heart)
      KMUL(1.0 + kfar * 0.10 * kbuv.x * (vKrOne - 0.5) * 2.0)
    }
    // DRESSED STONE (the models mark it: alpha exactly 0.96) is tooled: a mason's drove leaves fine furrows aslant the
    // face, a finger apart, and soot lies in them; lichen sits on it in dry rosettes; the weather has it in blotches.
    // Drawn by place, within a few metres only, so it costs no points and nothing crawls from across the street.
    // (A lintel, a keystone and ten jamb stones at three metres were flat pink board.)
    if (kStone > 0.5 && uKrStone.x > 0.0) {
      float ksn = (1.0 - smoothstep(4.0, 12.0, kdist)) * uKrStone.x;
      // (sixth holder) The drove's furrows are for the eye that is nearly touching the stone: a finger's breadth apart, faint,
      // above the water only. Drawn 3.5 cm apart at a fifth of the stone's value, and under the water too, they were a
      // pattern fill: even diagonal hatching on a keystone three metres off, and on the drowned jambs under it.
      float ktool = (1.0 - smoothstep(1.2, 3.4, kdist)) * step(0.02, ky) * uKrStone.x;
      if (ktool > 0.0) {
        vec3 kau = abs(N.y) > 0.7 ? vec3(1.0, 0.0, 0.0) : normalize(cross(vec3(0.0, 1.0, 0.0), N)), kav = cross(N, kau);
        float kline = sin((dot(vWPos, kau) * 0.72 + dot(vWPos, kav)) * uKrStone.y + 3.4 * krNoise(vWPos * 6.0));
        KMUL(1.0 - ktool * 0.12 * smoothstep(-0.2, 0.9, kline))
      }
      // Lichen on old stone is SMALL, CRISP and PALE: rosettes a thumb to a hand across, in colonies, lighter than the
      // weathered stone they sit on. (Drawn as soft dark blots a foot across they were camouflage on every coping.)
      float kro = krNoise(vWPos * 41.0 + 9.0), krm = krNoise(vWPos * 14.0 + 4.0), krb = krNoise(vWPos * 2.3 + 2.0);
      float klic = smoothstep(0.640, 0.665, kro * 0.36 + krm * 0.40 + krb * 0.28) * step(0.06, ky) * uKrStone.z * ksn;
      KMUL(1.0 + 0.34 * klic) KMIX(uKrLichen * 0.60, klic * 0.22)      // (a step paler than its stone and a little toward its own grey-lilac: as a flat pale paint it was whitewash thrown at the wall)
      KMUL(mix(1.0, 0.80 + 0.36 * krb, uKrStone.w))
    }
    // Masonry (vKr.w = 1: walls, stacks, stone) wears the weather plainly, most of all where it is pale and flat: lime
    // render and dressed stone. Drawn here, by place, so that it costs no points: the rain's dark runs down every
    // upright face, the damp that stands in a wall's first metre over the water, slow blooms a metre across, and on
    // render and stone the hair cracks. (A rendered gable end was one flat salmon plane beside the boat's lantern.)
    if (vKr.w > 0.9 && uKrUnder.y > 0.0) {
      // (kpale: how plain a paint is, render, stone, mortar, old timber, as against brick and fired clay, which have a colour of their own)
      float kmx = max(vColor.r, max(vColor.g, vColor.b)), kwall = 1.0 - smoothstep(0.35, 0.75, abs(N.y)), kpale = 1.0 - smoothstep(0.42, 0.55, (kmx - min(vColor.r, min(vColor.g, vColor.b))) / max(kmx, 1e-3));
      // (sixth holder: each of these value noises is worked only where its mark can show; the picture is the same, point for point)
      float krun = kwall > 0.0 ? smoothstep(0.50, 0.80, krNoise(vec3(vWPos.x * 9.0, vWPos.y * 0.5, vWPos.z * 9.0) + 3.0)) : 0.0;
      float kbloom = krNoise(vWPos * vec3(0.9, 0.7, 0.9) + 11.0);
      float kdamp = (1.0 - smoothstep(0.08, 0.7 + 0.7 * kn, ky)) * step(0.0, ky);
      // (hair cracks: fine, short, above the water only. Drawn broad, or under the water where the wall is seen whole, they were eels)
      float kcrack = 0.0;
      if (ky > 0.05 && kpale * kwall > 0.0) { float kcr = abs(krNoise(vWPos * vec3(3.1, 1.6, 3.1) + 23.0) - 0.5); kcrack = (1.0 - smoothstep(0.0015, 0.0055, kcr)) * smoothstep(0.52, 0.7, krNoise(vWPos * 1.3 + 41.0)); }
      float kw = uKrUnder.y * kwall * (0.55 + 0.45 * kpale);
      KMUL((1.0 - 0.42 * krun * kw) * (1.0 - 0.30 * kdamp * kw) * mix(1.0, 0.70 + 0.46 * kbloom, uKrUnder.y * (0.5 + 0.5 * kpale)) * (1.0 - 0.45 * kcrack * kpale * kwall * uKrUnder.y))
      KMUL(mix(vec3(1.0), vec3(0.78, 0.98, 0.84), 0.5 * kdamp * kw * smoothstep(0.45, 0.7, kbloom)))       // (and green where the damp stays)
    }
    if (km > 0.004) {
      float kp = krNoise(vWPos * 1.9 + vKr.z * 9.0);
      float kns = smoothstep(0.9, 0.05, abs(ky - 0.1));
      float kam = km * (0.12 + 0.88 * kns) * smoothstep(0.34, 0.7, kp);
      float kmoss = smoothstep(0.98 - 0.72 * kam, 1.12 - 0.6 * kam, khol * 0.72 + kf * 0.36) * smoothstep(0.02, 0.5, N.y);
      KMIX(uKrMoss * (0.45 + 0.75 * kf), kmoss * 0.85)
      KMUL(1.0 - 0.22 * khol * (1.0 - kmoss))                                      // and where no moss grows, a hollow holds its dirt
      if (ky > 0.12 && kn > 0.5) {
        float klich = smoothstep(0.80, 0.83, krNoise(vWPos * 13.0 + 5.0) * 0.8 + kf * 0.2) * smoothstep(0.5, 0.72, kn) * (1.0 - khol) * 0.5 * min(1.0, km * 2.5);
        KMUL(1.0 - 0.3 * klich) KADD(uKrLichen * (0.3 * klich))
      }
    }
    if (uKrMarks.x > 0.0) {
      // ---- the water's mark. The wet band: dark from the surface to a hand and a half above it, higher where the wake laps
      float kwet = 0.13 + 0.06 * (kn - 0.5) + 0.07 * krRipple(vWPos.xz);
      float kband = (1.0 - smoothstep(kwet * 0.6, kwet, ky)) * step(-0.02, ky);
      KMUL(mix(vec3(1.0), uKrWet, kband * 0.8))
      // the tide mark at 0.6 m: the surface is scoured paler below it; on the mark itself the lime the water left, a band
      // two fingers deep, hard along its top and dying downward, broken wherever the stone is rough. Plain on masonry;
      // on tiles and lead there is no line at all, only the paler roof under it (vKr.w says which).
      float ktide = uKrMarks.y + 0.09 * (kn - 0.5) + 0.02 * (kf - 0.5);
      float kscour = (1.0 - smoothstep(ktide - 0.04, ktide, ky)) * smoothstep(kwet, kwet + 0.12, ky) * 0.5 * (0.3 + 0.7 * vKr.w);
      KMUL(1.0 + 0.07 * kscour) KADD(uKrTide * (0.04 * kscour))
      if (vKr.w > 0.45 && abs(ky - ktide) < 0.07) {
        float kbrk = krNoise(vWPos * vec3(9.0, 3.0, 9.0) + 11.0);
        float kmark = smoothstep(ktide - 0.055, ktide - 0.008, ky) * (1.0 - smoothstep(ktide - 0.004, ktide + 0.005, ky)) * smoothstep(0.30, 0.62, kbrk * 0.65 + kf * 0.5) * 0.6 * uKrMarks.z * smoothstep(0.45, 0.9, vKr.w);
        KMUL(1.0 - 0.45 * kmark) KADD(uKrTide * (0.45 * kmark))
      }
      // a thread of jade weed on the line itself, broken
      // (as broad ON the surface it grows on, on a roof's slope as on a wall: by height alone a roof of thirty degrees wore a green band a hand wide)
      float kslope = clamp(sqrt(max(0.0, 1.0 - N.y * N.y)), 0.3, 1.0);
      float kweed = (1.0 - smoothstep(0.0, (0.035 + 0.035 * kf) * kslope, abs(ky + 0.012 * kslope))) * smoothstep(0.30, 0.55, kn + 0.3 * kf);
      KMIX(uKrWeed * (0.7 + 0.5 * kf), kweed * uKrMarks2.x * smoothstep(0.12, 0.2, vKr.w))      // (not on thin iron: a bar wore a green bead)
      // under the surface: a film of algae on everything from the first centimetre, and sediment that gathers with depth
      // on what faces up and in every hollow. It darkens: nothing under this water goes pale as it goes down.
      float kunder = 1.0 - smoothstep(-0.07, -0.01, ky);
      if (kunder > 0.0) {
      KMUL(mix(vec3(1.0), vec3(0.80, 0.97, 0.92), kunder * 0.6))
      float kdeep = 1.0 - smoothstep(-1.9, -0.1, ky);
      KMUL(1.0 - kunder * uKrSilt.x * (uKrSilt.y + (1.0 - uKrSilt.y) * kdeep) * (0.5 + 0.5 * smoothstep(0.3, 0.95, N.y)) * (0.7 + 0.6 * kf) * (1.0 + 0.6 * khol))      // (uKrSilt.y: how much of it lies already in the first hand under the surface: 0.45; it was 0.25 and a drowned tile beside the boat was lighter than a dry one)
      // The drowned roofs' second note. Under this water the area paints a thing the water's own green-teal unless it is
      // warm in itself, and the clay and slate here are painted cool (for the night above): every roof went one mint
      // from eaves to waterline. The key painting's are violet AND green: violet in the body of tile, slate, brick and
      // stone, tile by tile and in drifts a few tiles across; green where moss, algae and weed have it. And nothing
      // pale stays pale down there: algae in blooms, and what was light (stone, render, lead) is brought down with the rest.
      // (This is the paint the WATER's light shows. What a lantern shows of a thing under the water is its own paint,
      // wet: kOwn, in the light hook. The violet note under the boat's amber lantern was pink.)
      float kgreen = smoothstep(-0.03, 0.05, vColor.g - max(vColor.r, vColor.b));
      float kdrift = smoothstep(0.30, 0.66, krNoise(vWPos * vec3(0.5, 0.8, 0.5) + 31.0));
      // (seventh holder) The violet note is the ROOFS': tile by tile, in drifts. A wall of brick took it whole and, in the
      // water's green light and the boat's amber, came out a neutral grey from eaves to foot (measured: saturation 0.11),
      // the dullest and largest thing in every close view of a gable. Masonry keeps a quarter of it (uKrUnder.z): under
      // the water a wall is the water's own teal, its bricks told apart by value, warm only where a window lights it.
      float kviol = kunder * uKrUnder.x * (1.0 - kgreen) * (0.35 + 0.65 * kdrift) * (0.5 + 0.5 * vKrOne) * mix(1.0, uKrUnder.z, step(0.9, vKr.w));
      float klum = dot(albedo, vec3(0.3, 0.5, 0.2));
      albedo = mix(albedo, vec3(1.9, 0.62, 1.12) * klum, kviol);      // (red enough to stay violet under the water's green light)
      KMUL(mix(1.0, 0.66 + 0.50 * krNoise(vWPos * 2.6 + 5.0), kunder * 0.85))
      albedo *= 1.0 - 0.45 * kunder * smoothstep(0.16, 0.42, klum);
      kOwn *= (1.0 - 0.45 * kunder * smoothstep(0.16, 0.42, dot(kOwn, vec3(0.3, 0.5, 0.2)))) * mix(1.0, uKrNear.z, kunder);      // (and a wet thing is darker than a dry one)
      }
    }
    }`,
  light: /* glsl */`
    if ((kkind < 0.5 || kkind > 2.5) && vWPos.y < 0.03) {
      // What a LANTERN shows of a thing under the water is the thing's own colour, wet: clay is clay, brick is brick, a
      // little way down. The area repaints everything under the surface in the water's two families of colour (that is
      // what the water's own light shows, and it is right from across the street); but the bow lantern, the kept lamp and
      // the area's local lights then lit THAT paint, and beside the boat a drowned tile was pink and a drowned pot salmon,
      // paler under the water than above it. Here the travelling lights' share is taken back and given again on the paint
      // as it was made. It fails with depth as theirs does, so a roof still sinks into the water's colour.
      float kud = max(-vWPos.y, 0.0);
      c += (kOwn * (1.0 + stroke * 0.16 * uBrush) - albedo) * lamps * (exp(-kud * 0.7) * (1.0 - smoothstep(-0.03, 0.03, vWPos.y)) * uKrNear.y * mix(1.0, uKrNear.w, step(0.9, vKr.w)));      // (masonry less: uKrNear.w. Brick's own orange in the water's teal is grey)
    }
    if (kkind < 0.5) {
      // The dark inside a hole (a dovecote's door, a pot's bore, the socket a brick fell out of: paint darker than any
      // surface's) takes no light. The area's water-light and edge-light are added to a thing whatever its paint, and a
      // black hole a metre over the water glowed teal: twelve blue windows in the dovecote.
      c *= 1.0 - 0.9 * (1.0 - smoothstep(0.012, 0.04, dot(vColor.rgb, vec3(0.3333))));
    }
    if (kkind > 0.5 && kkind < 1.5) {
      // a lit room behind a window: it gives off its own painted light, under the surface only (the rule of the place),
      // and wakes and sleeps with its street; asleep it is an ember, then dark. The paint's alpha: how hard a point burns.
      float kl = townWake(vKr.y * 300.0, vWPos.xz, vKr.z, step(0.5, vKr.w));
      float krule = 1.0 - smoothstep(-0.012, 0.012, vWPos.y);
      #ifdef USE_COLOR
        vec3 kroom = vColor.rgb;
      #else
        vec3 kroom = vec3(0.8, 0.5, 0.35);
      #endif
      vec3 kember = vec3(0.80, 0.26, 0.30) * (dot(kroom, vec3(0.3, 0.5, 0.2)) * 1.3 + 0.05);
      vec3 klit = mix(kember, kroom, smoothstep(0.3, 0.8, kl)) * smoothstep(0.0, 0.3, kl) * mix(0.5, 1.0, smoothstep(0.35, 1.0, kl));
      klit *= 1.0 + 1.3 * clamp(kl - 1.0, 0.0, 0.5);
      c = uKrGlass * 0.35 + kroom * 0.02;
      glow = klit * (uKrLit.x * (1.0 + uKrLit.y * (1.0 - kalpha)) * krule);
    } else if (kkind > 1.5 && kkind < 2.5) {
      // Glass above the water. It is DARK (the room behind it gives off nothing above the surface) and it is GLASS: old
      // crown glass, never flat, so what it mirrors wanders across each pane and no two panes hold the same piece of it
      // (the paint's red: one number a pane). What a pane in a wall mirrors, seen from a boat, is the water in front of it
      // and the foot of the sky beyond: a band of lit mist at the horizon between the dark of the lake and the dark of
      // the cloud; and, drawn out long by the glass's waves, the boat's own lantern. The rain's dried runs dull it.
      // (It was one flat violet, the colour of the lake behind the house: the eye went through the gable as through a hole.)
      #ifdef USE_COLOR
        float kpane = vColor.r;
      #else
        float kpane = 0.3;
      #endif
      vec3 kq = vWPos * 7.0 + kpane * 40.0;
      vec3 kgn = normalize(N + uKrGlassK.y * vec3(krNoise(kq) - 0.5, krNoise(kq + 19.0) - 0.5, krNoise(kq + 37.0) - 0.5) + 0.07 * (fract(kpane * vec3(113.0, 271.0, 419.0)) - 0.5));
      vec3 kR = reflect(-V, kgn);
      float kfr = uKrGlassK.x + (1.0 - uKrGlassK.x) * pow(1.0 - clamp(dot(kgn, V), 0.0, 1.0), 3.0);
      float khz = exp(-kR.y * kR.y / 0.010);
      vec3 kenv = uKrSheen * (0.14 + 0.30 * smoothstep(0.0, 0.5, kR.y) * (0.5 + krNoise(vec3(kR.x, kR.y * 3.0, kR.z) * 2.3 + 5.0)) + uKrGlassK.w * khz);
      float kdirt = 0.70 + 0.30 * krNoise(vec3(vWPos.x * 26.0, vWPos.y * 2.2, vWPos.z * 26.0) + 3.0);
      c = uKrGlass * (0.5 + 0.3 * kdirt) + kenv * (kfr * kdirt);
      vec3 kL = uLanternPos - vWPos; float kLd = length(kL);
      c += uLanternColor * (uKrGlassK.z * pow(max(dot(kR, kL / max(kLd, 1e-3)), 0.0), 44.0) * (1.0 - smoothstep(uLanternRadius * 0.5, uLanternRadius * 1.4, kLd)));
      glow = vec3(0.0);
    }
    if (kkind < 0.5 && (vKr.w > 0.9 || abs(vKr.w - 0.1) < 0.03 || abs(vKr.w - 0.5) < 0.03) && vWPos.y > -0.03 && uKrCool.w > 0.0) {      // (masonry and its joinery; and the loose timber: driftwood, the shutter, the ladder)
      // What is COOL in itself stays cool under the warm lights: dressed stone, old timber, lead, paint gone grey. The
      // lantern is amber and the light from below coral, and lit by them every pale thing came out salmon: the stone
      // round a window, a bargeboard and the brick beside them were one family of orange. A painter gives stone in
      // firelight a warm grey with lilac in it (the key painting: stone and timber about #9a7a94 where brick is #c8703c).
      float kl2 = dot(c, vec3(0.3, 0.5, 0.2));
      c = mix(c, kl2 * uKrCool.rgb, uKrCool.w * kCoolPaint);
    }
    if (abs(vWPos.y) < 0.4) {
      // The line of light where the water meets a thing. It is the area's own (its colour, its strength: uTownLine,
      // uTownSurf.w), drawn here instead of there (TOWN_AFLOAT switches the area's off) so that it is as wide ON THE
      // SURFACE on a roof's slope as on an upright wall: by height alone a roof of thirty degrees wears it twice as
      // broad, a white cord laid along the tiles.
      float kd = length(vViewPos), kw0 = max(uKrLine.z, 0.0013 * kd), klw = kw0 * clamp(sqrt(max(0.0, 1.0 - N.y * N.y)), 0.3, 1.0);
      float kln = (1.0 - smoothstep(klw * 0.5, klw * 1.5, abs(vWPos.y - klw * 0.5))) * min(1.0, 0.008 / kw0 + 0.3) * (1.0 - smoothstep(60.0, 120.0, kd));
      // (on what slopes into the water, a roof, a skirt of lead, it is no cord laid along the tiles: it comes and goes
      // along its length as the water breathes, a run of glints)
      kln *= mix(1.0, 0.06 + 0.66 * smoothstep(0.46, 0.72, krNoise(vec3(vWPos.x * 2.6, uTime * 0.18, vWPos.z * 2.6))), smoothstep(0.15, 0.5, N.y));
      // (and on a thin bar of iron it is a glint, not a band: every bar of the balcony wore a white tick)
      kln *= (kkind < 0.5 || kkind > 2.5) ? mix(0.3, 1.0, smoothstep(0.05, 0.3, vKr.w)) : 1.0;
      // (sixth holder) and on an upright wall it is no cord of one breadth and one strength drawn round the house: it
      // swells and fails over a metre or two as the water breathes against the wall, and it is brightest where the water
      // is stirred (the hull's own wake arriving, a ring). It read as an outline, not as water.
      { float kbr = krNoise(vec3(vWPos.x * 1.15 + uTime * 0.04, uTime * 0.10, vWPos.z * 1.15));
        kln *= mix(min(1.25, mix(uKrLine.x, 1.0, smoothstep(0.30, 0.74, kbr)) + uKrLine.y * krRipple(vWPos.xz)), 1.0, smoothstep(0.15, 0.5, N.y)); }
      vec3 kfrom = mix(uTownUnderCol, uTownJade, clamp(gTown.g * 1.4, 0.0, 1.0));
      c += mix(uTownLine, kfrom, 0.55 * min(gTownL * 1.3, 1.0)) * (kln * uTownSurf.w * (0.55 + 0.45 * mix(uTownUnder.y, 1.0, min(gTownL * 1.5, 1.0))) * uKrMarks.w);
    }`,
});

// ------------------------------------------------------------------------------------------------ small tools
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _p = new THREE.Vector3(), _s = new THREE.Vector3(), _e = new THREE.Euler(), _n3 = new THREE.Matrix3();
const KIND = { paint: 0, lit: 1, glass: 2 };

/** A model file as plain arrays: { position, normal, color (linear rgba), kind (per point: its slot), index, points: { name: [x, y, z] } }, in the file's own space. */
async function loadModel(loader, name) {
  const gltf = await loader.loadAsync(DIR + name + '.glb');
  gltf.scene.updateMatrixWorld(true);
  const parts = [], points = {};
  gltf.scene.traverse((o) => {
    if (o.isMesh) parts.push(o);
    else if (o !== gltf.scene && o.children.length === 0 && o.name) { const v = new THREE.Vector3(); o.getWorldPosition(v); points[o.name] = [v.x, v.y, v.z]; }
  });
  let nv = 0, ni = 0;
  for (const o of parts) { nv += o.geometry.attributes.position.count; ni += o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count; }
  const position = new Float32Array(nv * 3), normal = new Float32Array(nv * 3), color = new Float32Array(nv * 4), kind = new Uint8Array(nv), index = new Uint32Array(ni);
  let v0 = 0, i0 = 0;
  const v = new THREE.Vector3();
  for (const o of parts) {
    const g = o.geometry, P = g.attributes.position, N = g.attributes.normal, C = g.attributes.color, n = P.count, k = KIND[(o.material && o.material.name) || 'paint'] || 0;
    _n3.getNormalMatrix(o.matrixWorld);
    for (let i = 0; i < n; i++) {
      v.fromBufferAttribute(P, i).applyMatrix4(o.matrixWorld); position.set([v.x, v.y, v.z], (v0 + i) * 3);
      v.fromBufferAttribute(N, i).applyMatrix3(_n3).normalize(); normal.set([v.x, v.y, v.z], (v0 + i) * 3);
      if (C) color.set([C.getX(i), C.getY(i), C.getZ(i), C.itemSize > 3 ? C.getW(i) : 1], (v0 + i) * 4); else color.set([1, 1, 1, 1], (v0 + i) * 4);   // (alpha: how open to the weather the point is, 1, or how hollow, 0)
      kind[v0 + i] = k;
    }
    if (g.index) for (let i = 0; i < g.index.count; i++) index[i0 + i] = g.index.getX(i) + v0; else for (let i = 0; i < n; i++) index[i0 + i] = v0 + i;
    v0 += n; i0 += g.index ? g.index.count : n;
    g.dispose(); if (o.material && o.material.dispose) o.material.dispose();
  }
  return { name, position, normal, color, kind, index, points, count: nv, triangles: ni / 3 };
}

/**
 * Everything that stands still, gathered into one mesh: pieces are added with a place, a tint and this kit's own numbers.
 * Each piece also says how far along the route it reaches (`s`); the mesh's triangles are laid in the buffer far end of
 * the street first, so that what the rider has passed and can no longer see is left out of the draw by shortening it
 * (userData.krS: the pieces' s, falling; userData.krEnd: where each ends in the index buffer): see `passed` in build().
 */
class Bin {
  constructor() { this.cap = 1 << 15; this.icap = 1 << 16; this.nv = 0; this.ni = 0; this.chunks = [];
    this.pos = new Float32Array(this.cap * 3); this.nor = new Int8Array(this.cap * 3); this.col = new Uint16Array(this.cap * 4); this.kr = new Uint8Array(this.cap * 4); this.idx = new Uint32Array(this.icap); }
  grow(nv, ni) {
    if (this.nv + nv > this.cap) { while (this.nv + nv > this.cap) this.cap *= 2; const g = (A, k) => { const b = new A.constructor(this.cap * k); b.set(A.subarray(0, this.nv * k)); return b; };
      this.pos = g(this.pos, 3); this.nor = g(this.nor, 3); this.col = g(this.col, 4); this.kr = g(this.kr, 4); }
    if (this.ni + ni > this.icap) { while (this.ni + ni > this.icap) this.icap *= 2; const b = new Uint32Array(this.icap); b.set(this.idx.subarray(0, this.ni)); this.idx = b; }
  }
  /**
   * model: from loadModel (or the same shape made here: position, normal, color as rgb or rgba, index, count);
   * M: Matrix4 into the realm; tint: THREE.Color or null; kr: [kind, moss, seed, plain] for its paint (kind as a number 0..5);
   * lit: [street's s / 300, random, stays] for the points of its slot `lit`; s: how far along the route it reaches.
   */
  add(model, M, tint = null, kr = null, lit = null, s = 0) {
    const n = model.count, P = model.position, N = model.normal, C = model.color, Kd = model.kind, e = M.elements, cs = C.length === n * 4 ? 4 : 3;
    this.grow(n, model.index.length);
    _n3.getNormalMatrix(M); const ne = _n3.elements;
    const tr = tint ? tint.r : 1, tg = tint ? tint.g : 1, tb = tint ? tint.b : 1, b8 = (x) => Math.round(Math.min(1, Math.max(0, x)) * 255);
    const k0 = kr ? Math.round(kr[0]) : 0, k1 = kr ? b8(kr[1]) : 0, k2 = kr ? b8(kr[2] % 1) : 0, k3 = kr ? b8(kr[3] || 0) : 0;
    const l1 = lit ? b8(lit[0]) : 0, l2 = lit ? b8(lit[1]) : 0, l3 = lit ? b8(lit[2]) : 0;
    let o = this.nv * 3, k = this.nv * 4;
    for (let i = 0; i < n; i++, o += 3, k += 4) {
      const x = P[i * 3], y = P[i * 3 + 1], z = P[i * 3 + 2], kd = Kd ? Kd[i] : 0, t = kd === 0;
      this.pos[o] = e[0] * x + e[4] * y + e[8] * z + e[12]; this.pos[o + 1] = e[1] * x + e[5] * y + e[9] * z + e[13]; this.pos[o + 2] = e[2] * x + e[6] * y + e[10] * z + e[14];
      const nx = N[i * 3], ny = N[i * 3 + 1], nz = N[i * 3 + 2];
      const a = ne[0] * nx + ne[3] * ny + ne[6] * nz, b = ne[1] * nx + ne[4] * ny + ne[7] * nz, c = ne[2] * nx + ne[5] * ny + ne[8] * nz, l = 127 / (Math.hypot(a, b, c) || 1);
      this.nor[o] = Math.round(a * l); this.nor[o + 1] = Math.round(b * l); this.nor[o + 2] = Math.round(c * l);
      this.col[k] = Math.min(65535, Math.round(C[i * cs] * (t ? tr : 1) * 65535)); this.col[k + 1] = Math.min(65535, Math.round(C[i * cs + 1] * (t ? tg : 1) * 65535)); this.col[k + 2] = Math.min(65535, Math.round(C[i * cs + 2] * (t ? tb : 1) * 65535));
      this.col[k + 3] = cs === 4 ? Math.round(C[i * 4 + 3] * 65535) : 65535;
      if (kd === 1) { this.kr[k] = 1; this.kr[k + 1] = l1; this.kr[k + 2] = l2; this.kr[k + 3] = l3; }
      else if (kd === 2) { this.kr[k] = 2; this.kr[k + 1] = 0; this.kr[k + 2] = 0; this.kr[k + 3] = 0; }
      else { this.kr[k] = k0; this.kr[k + 1] = k1; this.kr[k + 2] = k2; this.kr[k + 3] = k3; }
    }
    const I = model.index, base = this.nv; for (let i = 0; i < I.length; i++) this.idx[this.ni + i] = I[i] + base;
    this.chunks.push({ s, i0: this.ni, n: I.length });
    this.nv += n; this.ni += I.length;
  }
  mesh(material, name) {
    if (!this.nv) return null;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.pos.slice(0, this.nv * 3), 3));
    g.setAttribute('normal', new THREE.BufferAttribute(this.nor.slice(0, this.nv * 3), 3, true));
    g.setAttribute('color', new THREE.BufferAttribute(this.col.slice(0, this.nv * 4), 4, true));
    g.setAttribute('aKr', new THREE.BufferAttribute(this.kr.slice(0, this.nv * 4), 4, true));
    // the pieces in the order of the street's far end first
    const order = this.chunks.slice().sort((a, b) => b.s - a.s), idx = new Uint32Array(this.ni), krS = new Float32Array(order.length), krEnd = new Uint32Array(order.length);
    let at = 0; order.forEach((c, i) => { idx.set(this.idx.subarray(c.i0, c.i0 + c.n), at); at += c.n; krS[i] = c.s; krEnd[i] = at; });
    g.setIndex(new THREE.BufferAttribute(idx, 1));
    g.computeBoundingSphere();
    const m = new THREE.Mesh(g, material); m.name = name; m.matrixAutoUpdate = false; m.frustumCulled = false;
    m.userData.krS = krS; m.userData.krEnd = krEnd;
    this.pos = this.nor = this.col = this.kr = this.idx = this.chunks = null;
    return m;
  }
}

/** One unit many times: an instanced mesh, each copy with its own place, tint and numbers, and how far along the route it lies (the copies are kept far end of the street first: see Bin). */
class Flock {
  constructor(model) { this.model = model; this.m = []; this.c = []; this.k = []; this.s = []; this.n = 0; }
  add(M, tint, kr, s = 0) { const e = M.elements; for (let i = 0; i < 16; i++) this.m.push(e[i]); this.c.push(tint.r, tint.g, tint.b); const b8 = (x) => Math.round(Math.min(1, Math.max(0, x)) * 255); this.k.push(Math.round(kr[0]), b8(kr[1]), b8(kr[2] % 1), b8(kr[3] || 0)); this.s.push(s); this.n++; }
  mesh(material, name) {
    if (!this.n || !this.model) return null;
    const md = this.model, g = new THREE.BufferGeometry(), n = this.n;
    g.setAttribute('position', new THREE.BufferAttribute(md.position, 3)); g.setAttribute('normal', new THREE.BufferAttribute(md.normal, 3)); g.setAttribute('color', new THREE.BufferAttribute(md.color, 4));
    g.setIndex(new THREE.BufferAttribute(md.index, 1));
    const order = Array.from({ length: n }, (_, i) => i).sort((a, b) => this.s[b] - this.s[a]);
    const mats = new Float32Array(n * 16), cols = new Float32Array(n * 3), ks = new Uint8Array(n * 4), krS = new Float32Array(n);
    order.forEach((j, i) => { for (let q = 0; q < 16; q++) mats[i * 16 + q] = this.m[j * 16 + q]; for (let q = 0; q < 3; q++) cols[i * 3 + q] = this.c[j * 3 + q]; for (let q = 0; q < 4; q++) ks[i * 4 + q] = this.k[j * 4 + q]; krS[i] = this.s[j]; });
    g.setAttribute('aKr', new THREE.InstancedBufferAttribute(ks, 4, true));
    const mesh = new THREE.InstancedMesh(g, material, n);
    mesh.instanceMatrix.array.set(mats); mesh.instanceMatrix.needsUpdate = true;
    mesh.instanceColor = new THREE.InstancedBufferAttribute(cols, 3);
    mesh.name = name; mesh.frustumCulled = false; mesh.matrixAutoUpdate = false;
    mesh.userData.krS = krS; mesh.userData.krAll = n;
    this.m = this.c = this.k = this.s = null;
    return mesh;
  }
}

/**
 * A piece parted at the water: [what reaches above `cut`, what lies wholly under it, how far it reaches down the route],
 * each of the first two the same shape of thing as the piece itself (either may be null). M: the piece's place in the realm. What is wholly under the surface is never in the
 * mirror, so it goes to the mesh that only the direct view draws: a stack that stands six metres deep costs its top twice.
 */
function parted(model, M, cut = -0.04, tx = 0, tz = 0) {
  const e = M.elements, P = model.position, N = model.normal, C = model.color, Kd = model.kind, n = model.count, I = model.index, cs = C.length === n * 4 ? 4 : 3;
  const y = new Float32Array(n);
  let top = -Infinity, bot = Infinity;
  let ahead = -Infinity;                                          // how far down the route (along tx, tz) it reaches beyond its own placing point
  for (let i = 0; i < n; i++) { const px = P[i * 3], py = P[i * 3 + 1], pz = P[i * 3 + 2], v = e[1] * px + e[5] * py + e[9] * pz + e[13]; y[i] = v; if (v > top) top = v; if (v < bot) bot = v;
    const f = (e[0] * px + e[4] * py + e[8] * pz) * tx + (e[2] * px + e[6] * py + e[10] * pz) * tz; if (f > ahead) ahead = f; }
  if (bot > cut) return [model, null, ahead];
  if (top <= cut) return [null, model, ahead];
  const hi = [], lo = [];
  for (let t = 0; t < I.length; t += 3) { const a = I[t], b = I[t + 1], c = I[t + 2]; if (y[a] > cut || y[b] > cut || y[c] > cut) hi.push(a, b, c); else lo.push(a, b, c); }
  const sub = (idx) => {
    if (!idx.length) return null;
    const map = new Int32Array(n).fill(-1); let m = 0;
    for (let k = 0; k < idx.length; k++) if (map[idx[k]] < 0) map[idx[k]] = m++;
    const pos = new Float32Array(m * 3), nor = new Float32Array(m * 3), col = new Float32Array(m * cs), kind = Kd ? new Uint8Array(m) : null, index = new Uint32Array(idx.length);
    for (let i = 0; i < n; i++) { const j = map[i]; if (j < 0) continue;
      for (let k = 0; k < 3; k++) { pos[j * 3 + k] = P[i * 3 + k]; nor[j * 3 + k] = N[i * 3 + k]; }
      for (let k = 0; k < cs; k++) col[j * cs + k] = C[i * cs + k];
      if (kind) kind[j] = Kd[i]; }
    for (let k = 0; k < idx.length; k++) index[k] = map[idx[k]];
    return { count: m, position: pos, normal: nor, color: col, kind, index };
  };
  return [sub(hi), sub(lo), ahead];
}

/**
 * A piece cut by the level plane y = cut (the piece placed by M): what of it lies above the plane (side 1) or under it
 * (side -1), its triangles cut clean along the plane. The same shape of thing as the piece; null if nothing is left.
 */
function clipped(model, M, cut, side) {
  const e = M.elements, P = model.position, N = model.normal, C = model.color, Kd = model.kind, n = model.count, I = model.index, cs = C.length === n * 4 ? 4 : 3;
  const y = new Float32Array(n); for (let i = 0; i < n; i++) y[i] = (e[1] * P[i * 3] + e[5] * P[i * 3 + 1] + e[9] * P[i * 3 + 2] + e[13] - cut) * side;
  const pos = [], nor = [], col = [], kind = [], index = [], map = new Int32Array(n).fill(-1);
  const keep = (i) => { if (map[i] < 0) { map[i] = pos.length / 3; pos.push(P[i * 3], P[i * 3 + 1], P[i * 3 + 2]); nor.push(N[i * 3], N[i * 3 + 1], N[i * 3 + 2]); for (let k = 0; k < cs; k++) col.push(C[i * cs + k]); kind.push(Kd ? Kd[i] : 0); } return map[i]; };
  const cutAt = (a, b) => { const t = y[a] / (y[a] - y[b]), j = pos.length / 3;
    for (let k = 0; k < 3; k++) { pos.push(P[a * 3 + k] + (P[b * 3 + k] - P[a * 3 + k]) * t); nor.push(N[a * 3 + k] + (N[b * 3 + k] - N[a * 3 + k]) * t); }
    for (let k = 0; k < cs; k++) col.push(C[a * cs + k] + (C[b * cs + k] - C[a * cs + k]) * t); kind.push(Kd ? Kd[a] : 0); return j; };
  for (let t = 0; t < I.length; t += 3) {
    const v = [I[t], I[t + 1], I[t + 2]], inn = [y[v[0]] >= 0, y[v[1]] >= 0, y[v[2]] >= 0], k = inn[0] + inn[1] + inn[2];
    if (k === 3) index.push(keep(v[0]), keep(v[1]), keep(v[2]));
    else if (k > 0) { const poly = [];
      for (let q = 0; q < 3; q++) { const a = v[q], b = v[(q + 1) % 3]; if (inn[q]) poly.push(keep(a)); if (inn[q] !== inn[(q + 1) % 3]) poly.push(cutAt(a, b)); }
      for (let q = 1; q + 1 < poly.length; q++) index.push(poly[0], poly[q], poly[q + 1]); }
  }
  return index.length ? { name: model.name, count: pos.length / 3, position: new Float32Array(pos), normal: new Float32Array(nor), color: new Float32Array(col), kind: Kd ? new Uint8Array(kind) : null, index: new Uint32Array(index), points: {} } : null;
}

// value noise for placing (the same every run)
const hash2 = (ix, iy, seed) => { let h = (ix * 374761393 + iy * 668265263 + seed * 1442695041) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };
const noise2 = (x, y, seed = 0) => { const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  const a = hash2(ix, iy, seed), b = hash2(ix + 1, iy, seed), c = hash2(ix, iy + 1, seed), d = hash2(ix + 1, iy + 1, seed); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; };

export async function build(ctx, plan, shared) {
  const light = shared.light || (await import('./light.js')).ensureLight(ctx, plan, shared);
  const town = light.town, loader = new GLTFLoader();
  const col = (c) => new THREE.Color(c);

  // ---------------------------------------------------------------------------------------------- the material
  const KRU = {
    uKrWet: { value: col('#8a7a86') },                 // what the wet band multiplies paint by: darker, and a little cooler
    uKrTide: { value: col('#c9c2cf') },                // the lime of the tide mark
    uKrWeed: { value: col('#2e6252') },                // the thread of weed on the line
    uKrSilt: { value: new THREE.Vector4(+(Q.get('krsilt') ?? 0.5), +(Q.get('krsilt0') ?? 0.45), 0, 0) },      // how much the sediment under water darkens what it lies on (&krsilt=)
    uKrMoss: { value: col('#3a6350') }, uKrLichen: { value: col('#b6accb') },
    uKrGlass: { value: col('#1d1430') }, uKrSheen: { value: col('#6a5890') },      // dark glass, and the brightest thing it mirrors (the lit mist at the foot of the sky)
    uKrGlassK: { value: new THREE.Vector4(...(Q.get('krglass') || '0.28,0.16,0.24,1.0').split(',').map(Number)) },      // the glass: x how much it mirrors seen square on (the rest comes aslant), y how wavy it is, z the boat's lantern in it, w the band of lit mist at the horizon (&krglass=x,y,z,w)
    uKrCool: { value: new THREE.Vector4(1.0, 0.90, 1.16, +(Q.get('krcool') ?? 0.6)) },      // what is cool in itself stays cool under the warm lights: the cast it keeps (rgb), and how much (&krcool=; 0 = as the lights leave it)
    uKrStone: { value: new THREE.Vector4(+(Q.get('krstone') ?? 1), 330, 1, 0.3) },      // dressed stone: x how plainly its tooling shows (&krstone=), y the furrows' pitch (radians a metre: 330 = 1.9 cm; it was 180, 3.5 cm: a hatching), z its lichen, w the weather's blotches
    uKrLit: { value: new THREE.Vector4(plan.gain.window * +(Q.get('krroom') ?? 1), +(Q.get('krflame') ?? 0.5), 0, 0) },      // x: how brightly a lit room's paint burns (the page's window gain; &krroom= scales it); y: how much harder its lamp's flame burns (&krflame=)
    uKrMarks: { value: new THREE.Vector4(Q.get('krmarks') === '0' ? 0 : 1, 0.6, 1, +(Q.get('krline') ?? 0.8)) },     // on; height of the tide mark; strength of its line; strength of the line at the surface (&krline=)
    uKrLine: { value: new THREE.Vector4(...(Q.get('krlinek') || '0.30,0.35,0.0055,0').split(',').map(Number)) },      // the line at the surface on a wall: x how far it fails between its swells (1 = a cord of one strength, as it was), y how much brighter where the water is stirred, z its least breadth in metres (it was 0.008) (&krlinek=x,y,z,0)
    uKrMarks2: { value: new THREE.Vector4(+(Q.get('krweedline') ?? 0.62), 0, 0, 0) },      // x: how plainly the thread of weed is painted on the line itself (it was 0.85: on a tiled slope at arm's length a neon cord; &krweedline=)
    uKrTint: { value: new THREE.Vector3(...(Q.get('krtint') || '1,1,1').split(',').map(Number)) },      // (a developer's switch: &krtint=r,g,b multiplies every paint of the kit)
    uKrUnder: { value: new THREE.Vector4(+(Q.get('krviolet') ?? 0.9), +(Q.get('krweather') ?? 1), +(Q.get('krvwall') ?? 0.25), 0) },      // x: how far the roofs go to violet under the water (&krviolet=); y: how plainly masonry wears the weather (&krweather=)
    uKrVane: { value: [new THREE.Vector4(), new THREE.Vector4(), new THREE.Vector4()] },      // each vane: its spindle (x, z) and its turn now
    uKrBrick: { value: new THREE.Vector4(0.28, +(Q.get('krbrick') ?? 1), +(Q.get('krarris') ?? 0.5), +(Q.get('krarrisk') ?? 0.30)) },      // a brick's face: x how far its shading normals lean at its edges (kr_lib.BRICK_PILLOW, as it arrives here), y how plainly its arrises, chips and corners are painted (&krbrick=), z how broad the shadow on its arris is (1 = 10 mm; &krarris=), w how dark (&krarrisk=)
    uKrNear: { value: new THREE.Vector4(+(Q.get('krgrain') ?? 1), +(Q.get('krown') ?? 1), +(Q.get('krwetown') ?? 0.42), +(Q.get('krownwall') ?? 0.45)) },      // x: the grain and the dabs of a surface at arm's length (&krgrain=); y: how much of its OWN colour a lantern shows of a thing under the water (&krown=; 0 = as the water repainted it); z: how much darker that own colour is for being wet (&krwetown=)
  };
  const mat = light.mat({ color: '#ffffff', vertexColors: true, lit: 0.34, water: true, extend: krExtend(KRU) });
  // (the same paint for the few thin things, the vane, the balcony's bars, the twigs of the nest: `crisp` keeps them out of
  // the painter's filter, whose brush is wider than they are and would wipe them out a few metres off)
  const matThin = light.mat({ color: '#ffffff', vertexColors: true, lit: 0.34, water: true, crisp: true, extend: krExtend(KRU) });
  const above = new Bin(), under = new Bin();                    // what crosses the surface or stands over it (mirror too); what is wholly under it
  const thin = new Bin();
  // What stands over the water but is looked at only directly, never in the mirror (the roofs' end walls with their
  // copings, the ridge tiles, moss, ferns, the ladder, what the current has lodged): aboveMain is drawn in the picture
  // only; aboveTwin holds the plain forms that stand in for the walls in the mirror and in the engine's picture of the
  // scene without the water (which wants their depth and nothing else of them). See onlyPass, below.
  const aboveMain = new Bin(), aboveTwin = new Bin();
  /** Where a place lies along the route, and the way the route runs there: [s, tx, tz]. */
  const routeAt = (x, z) => { const q = town.sd(x, z), a = town.along(q.s); return [q.s, Math.cos(a), -Math.sin(a)]; };
  /** Put a piece in the realm: what of it reaches above the water into `above` (or `thin`), the rest into `under`. */
  const tally = {};                                             // (&krlog: triangles by kind of piece, above the water and under it)
  const count = (model, hi, lo) => { const t = tally[model.name || 'made here'] || (tally[model.name || 'made here'] = [0, 0, 0]); t[0]++; t[1] += hi ? hi.index.length / 3 : 0; t[2] += lo ? lo.index.length / 3 : 0; };
  const layIn = (top) => (model, M, tint = null, kr = null, lit = null) => { const [s0, tx, tz] = routeAt(M.elements[12], M.elements[14]), [hi, lo, ahead] = parted(model, M, -0.04, tx, tz), sp = s0 + ahead;
    count(model, hi, lo); if (hi) top.add(hi, M, tint, kr, lit, sp); if (lo) under.add(lo, M, tint, kr, lit, sp); };
  const lay = layIn(above), layThin = layIn(thin), layMain = Q.has('krfull') ? lay : layIn(aboveMain);
  /** The plain form of a piece, for the mirror and for the picture without the water: only what of it stands over the surface. */
  const layTwin = (model, M, tint = null, kr = null) => { const [s0, tx, tz] = routeAt(M.elements[12], M.elements[14]), ahead = parted(model, M, -1e9, tx, tz)[2], hi = clipped(model, M, -0.03, 1); if (hi) aboveTwin.add(hi, M, tint, kr, null, s0 + ahead); };
  /** A piece that lies wholly under the water. */
  const layUnder = (model, M, tint = null, kr = null, lit = null) => { const [s0, tx, tz] = routeAt(M.elements[12], M.elements[14]), ahead = parted(model, M, Infinity, tx, tz)[2]; count(model, null, model); under.add(model, M, tint, kr, lit, s0 + ahead); };

  // ---------------------------------------------------------------------------------------------- the units
  const names = ['pantile', 'pantile_deep', 'pantile_far', 'slate', 'slate_deep', 'ridge_half', 'ridge_half_b', 'ridge_hog', 'ridge_hog_b', 'moss_a', 'moss_b', 'moss_c', 'moss_d',
    'roof_end_rb_a', 'roof_end_rb_b', 'roof_end_rb_c', 'roof_end_lb_a', 'roof_end_lb_b', 'roof_end_lb_c', 'roof_end_rb_d', 'roof_end_lb_d',
    'stack_1', 'stack_2', 'stack_3', 'stack_4', 'stack_5', 'stack_6', 'stack_7', 'stack_8', 'stack_9', 'stack_10', 'stack_deep_a', 'stack_deep_b', 'stack_deep_c', 'stack_deep_d', 'pot_fallen',
    'gable_1', 'gable_2', 'gable_3', 'gable_4', 'dovecote', 'roof_ladder', 'roof_skylight', 'vane_arrow', 'balcony_rail', 'roof_gutter', 'roof_gutter_b',
    'drift_limb', 'drift_branch', 'drift_plank', 'drift_shutter', 'fern_a', 'fern_b', 'pot_nest'];
  const K = {};
  await Promise.all(names.map((n) => loadModel(loader, n).then((m) => { K[n] = m; }).catch((err) => { console.error(`INVALID_MODEL kit_roofs: ${DIR}${n}.glb did not load (${err && err.message})`); })));

  // ---------------------------------------------------------------------------------------------- the roofs awash: where they are
  // Fifteen roofs: the right bank's nine in clay pantiles, the left bank's six in slate. A house record of the layout
  // gives each its place, its length and its ridge. A roof's own frame: lx along the ridge (down the route), ly up,
  // lz across (toward the right of the route).
  const roofs = town.houses.filter((h) => h.awash && h.roof !== 'mansard').map((h, i) => {
    const half = h.dep / 2 + 0.35, rise = h.ridge - h.eaves, phi = Math.atan2(rise, half), side = h.row === 'RB' ? -1 : 1, rr = ctx.rng(100 + i * 17);
    const R = { h, i, kind: h.row === 'RB' ? 'pantile' : 'slate', half, rise, phi, Ls: Math.hypot(half, rise), side, len: h.w + 0.3, x0: -(h.w + 0.3) / 2, x1: (h.w + 0.3) / 2, seed: 100 + i * 17,
      cy: Math.cos(h.yaw), sy: Math.sin(h.yaw), sagAmp: 0.035 + rr() * 0.06, moss: 0.45 + 0.5 * rr() };
    R.F = new THREE.Matrix4().makeRotationY(h.yaw).setPosition(h.x, 0, h.z);
    R.local = (x, z) => { const dx = x - h.x, dz = z - h.z; return [dx * R.cy - dz * R.sy, dx * R.sy + dz * R.cy]; };
    return R;
  });
  // The skylight propped open under the water (the page: s 90). The layout laid its lit pane off the end of the roof,
  // in the corner between two houses, a hand above nothing. Here it stands a metre up the route, in the roof it
  // belongs to (s 85), where that roof is 0.66 m under the surface; the layout's loose pane is taken out below.
  const skyW = town.windows.find((q) => q.pitch && Math.abs(q.pitch + 1.0) < 1e-6 && Math.abs(q.s - 90) < 1);
  { const R = skyW && roofs.find((r) => r.kind === 'pantile' && Math.abs(r.local(skyW.x, skyW.z)[0] - r.x1) < 0.8);
    if (R) { const lx = R.x1 - 0.95, y = -0.66; R.skylight = { lx, lz: R.side * (R.h.ridge - y) * R.half / R.rise, y }; } }
  /** How far the old roof has sunk at a place (lx along it, t up the slope 0..1): the ridge sways between its gables, the rafters show. */
  const sag = (R, lx, t) => { const u = Math.min(1, Math.max(0, (lx - R.x0) / R.len)); return -(R.sagAmp * Math.pow(Math.sin(Math.PI * u), 2) * (0.35 + 0.65 * t) + 0.012 * Math.sin(lx * 3.4 + R.seed) * t + 0.02 * (noise2(lx * 0.9, t * 3 + R.seed, 7) - 0.5)); };
  /** The height of the roofs' own planes over a place of the realm (-Infinity where there is none). */
  const mainRoofY = (x, z) => { let y = -Infinity; for (const R of roofs) { const [lx, lz] = R.local(x, z); if (lx > R.x0 - 0.01 && lx < R.x1 + 0.01 && Math.abs(lz) <= R.half + 0.01) y = Math.max(y, R.h.ridge - Math.abs(lz) * R.rise / R.half); } return y; };
  const PW = 0.17;                                               // the coped gable wall at each end of a roof takes this much of its length
  const WALL_DEEP = -0.5;                                        // below this a roof's end wall is laid in its plain form (roof_end_*_d)

  // ---------------------------------------------------------------------------------------------- the cross gables: where they are
  // Four gabled wings (the layout's gables), each standing a hand's breadth out from the front of its house so that its
  // own lit room lies in front of the layout's window pane (which stays where it is, inside the wing, unseen).
  // A gable's own frame: x across it (right as seen from the channel), y up, z toward the channel; its face is z = 0.
  const TANW = 0.8, EAVE = 3.0, WLEN = 5.2;
  const gables = town.gables.map((g, i) => {
    const dFace = g.side < 0 ? -12.75 : g.d - 1.23, [x, z] = town.xz(g.s, dFace), boards = i === 0 || i === 2;
    const G = { g, i, x, z, yaw: g.yawFace, apex: g.apex, name: 'gable_' + (i + 1), kind: g.side < 0 ? 'slate' : 'pantile', boards, zf: boards ? 0.2 : 0.0, zc: boards ? 0.2 : -0.24, seed: 700 + i * 13 };
    G.F = new THREE.Matrix4().makeRotationY(G.yaw).setPosition(x, 0, z);
    const cy = Math.cos(G.yaw), sy = Math.sin(G.yaw);
    G.local = (px, pz) => { const dx = px - x, dz = pz - z; return [dx * cy - dz * sy, dx * sy + dz * cy]; };
    return G;
  });
  /** Is a place of a main roof under (or in front of) a wing? p: a point on the main roof's tiles. */
  const underWing = (p) => { for (const G of gables) { const [lx, lz] = G.local(p.x, p.z); if (Math.abs(lx) > EAVE + 0.06 || lz > 1.4 || lz < -WLEN) continue; if (lz > G.zc) { if (Math.abs(lx) < 2.96) return true; continue; } if (G.apex - TANW * Math.abs(lx) > p.y - 0.09) return true; } return false; };

  // ---------------------------------------------------------------------------------------------- laying a slope
  // Each kind of tile is three draws: the modelled tile for what stands out of the water and the first hand's breadths
  // under it (the direct view only); its plain form for everything deeper (the direct view only); and the plain form
  // again for the tiles that stand out of the water, in the mirror only (a reflection is never looked at tile by tile).
  // (fifth holder) And the tiles that stand wholly out of the water are a fourth and a fifth draw: modelled in the
  // picture itself (`_dry`), and in their plainest form in the engine's picture of the scene without the water (`_pre`),
  // which is drawn before every frame and wants of a dry tile only its depth: 2,500 pantiles of 28 triangles were
  // drawn there in full.
  const tiles = { pantile: new Flock(K.pantile), pantile_dry: new Flock(K.pantile), pantile_deep: new Flock(K.pantile_deep), pantile_far: new Flock(K.pantile_far || K.pantile_deep),
    pantile_mirror: new Flock(K.pantile_far || K.pantile_deep), pantile_pre: new Flock(K.pantile_far || K.pantile_deep),
    slate: new Flock(K.slate), slate_dry: new Flock(K.slate), slate_deep: new Flock(K.slate_deep), slate_mirror: new Flock(K.slate_deep), slate_pre: new Flock(K.slate_deep) };
  const TILE_DRY = Q.has('krfull') ? 1e9 : 0.03;                 // above this a tile stands wholly out of the water
  const TILE_DEEP = -0.38, TILE_MIRROR = -0.17;                // below this a tile is laid in its plain form; above this some of it shows over the water
  // (sixth holder) -1.0 -> -9: on the roofs awash NO tile of the slope the rider looks down on is laid flat. Their eaves lie
  // 1.2 to 2.4 m under the water at the navigable edge itself: the flat pieces were the tiles NEAREST the gunwale, the
  // page's "roof plane slides under the surface a boat-length away, tiles magnified through the water", and from the
  // boat they were a quilt of flat squares, another roof than the pantiles above them (town_r5_m_sky.png). It costs
  // 2,650 tiles of eight triangles instead of two (32,000 triangles a frame of the picture's 2.1 million). The mirror's
  // twins and the picture without the water keep the flat piece.
  const TILE_FAR = +(Q.get('krfar') ?? -9.0);                  // below this a pantile is laid as ONE flat piece shaded as a pan and a roll (pantile_far: two triangles), and so are the mirror's twins
  const TINTS = { pantile: ['#ffffff', '#f7dccb', '#e2cdd0', '#ffe2cc', '#cfbcc4', '#efc8b4', '#bfa8ae', '#f4d6d6', '#a8949c'].map(col), slate: ['#ffffff', '#e6ecf8', '#dbe6e0', '#eee2f4', '#cfd2e2', '#f2ece2', '#bcc0d0', '#e4d6dc', '#aab0c4'].map(col) };
  // The clay, a step cooler and darker than its paint (measured at postcard 3 once the area's light had settled: the
  // tiles stood at #714051, rose; the page asks a dusty plum-brown #5E3A52, the key painting's roofs are #4e3f51 to
  // #6d495d). A multiplier in the light's own space, on every tile and ridge tile's tint. (&krclay=r,g,b tries another)
  { const k = (Q.get('krclay') || '0.66,0.80,1.0').split(',').map(Number), ks = (Q.get('krslate') || '0.86,0.94,1.0').split(',').map(Number);
    for (const c of TINTS.pantile) c.setRGB(c.r * k[0], c.g * k[1], c.b * k[2]);
    for (const c of TINTS.slate) c.setRGB(c.r * ks[0], c.g * ks[1], c.b * ks[2]); }
  const tc = new THREE.Color(), white = col('#ffffff'), Rm = new THREE.Matrix4(), vU = new THREE.Vector3(), vT = new THREE.Vector3(), vN = new THREE.Vector3();
  /**
   * Lay one slope tile by tile. o: { kind, O, U, T: the low end of its eaves and the unit vectors along the eaves and up
   * the slope (U x T must be the slope's outward normal); uLen, tLen: its size; u0, u1: what is left bare at each end;
   * seed, moss; lift(u, tn): how far the roof has sunk there; keep(p): false where no tile lies; tuck: how far under
   * the ridge the top course ends }.
   */
  const laySlope = (o) => {
    const pant = o.kind === 'pantile', gauge0 = pant ? 0.27 : 0.20, cover0 = pant ? 0.205 : 0.25, lap = pant ? 0.04 : 0.0, tints = TINTS[o.kind];
    const tTop = o.tLen - (o.tuck ?? (pant ? 0.33 : 0.26)), nC = Math.max(2, Math.round((tTop + 0.06) / gauge0) + 1), gauge = (tTop + 0.06) / (nC - 1);
    const avail = o.uLen - o.u0 - o.u1, nX = Math.max(1, Math.floor((avail - lap) / cover0)), cover = (avail - lap) / nX;
    vU.copy(o.U); vT.copy(o.T); vN.crossVectors(vU, vT).normalize();
    Rm.makeBasis(vU, vN, vT.clone().negate()); const baseQ = new THREE.Quaternion().setFromRotationMatrix(Rm);
    const rr = ctx.rng(o.seed), patch = { c: rr() * nX, k: rr() * nC, w: 2 + rr() * 3, h: 2 + rr() * 3 }, slipAt = { c: rr() * nX, k: nC * (0.3 + 0.5 * rr()) };
    for (let k = 0; k < nC; k++) {
      const t = -0.06 + k * gauge + 0.008 * Math.sin(k * 1.7 + o.seed), stag = !pant && (k % 2) ? cover / 2 : 0;
      for (let i = 0; i < nX + (stag ? 1 : 0); i++) {
        let u = o.u0 + i * cover - stag, w = 1;                  // (a slate at the end of a staggered course is cut to half)
        if (stag && (i === 0 || i === nX)) { w = 0.5; if (i === 0) u = o.u0; }
        const h1 = hash2(i, k, o.seed), h2 = hash2(i, k, o.seed + 1), h3 = hash2(i, k, o.seed + 2);
        if (h1 < 0.004 && k > 1 && k < nC - 2) continue;         // one tile in two hundred and fifty has gone
        let slip = (h2 - 0.5) * 0.014;
        if (h3 < 0.012 || (Math.hypot((i - slipAt.c) * 0.6, k - slipAt.k) < 1.6 && h3 < 0.5)) slip -= 0.03 + 0.05 * h1;       // slipped down a little: its nib has let go
        const ts = t + slip, tn = Math.min(1, Math.max(0, ts / o.tLen));
        _p.copy(o.O).addScaledVector(vU, u).addScaledVector(vT, ts); if (o.lift) _p.y += o.lift(u, tn);
        if (o.keep && !o.keep(_p)) continue;
        _e.set((h1 - 0.5) * 0.022, (h2 - 0.5) * 0.03, (h3 - 0.5) * 0.03);
        _q.copy(baseQ).multiply(_q2.setFromEuler(_e));
        _m.compose(_p, _q, _s.set(w * cover / cover0 * (pant ? 1 : 0.985), 1, gauge / gauge0));
        // its colour: its own, its neighbourhood's (the roof was not tiled from one kiln), and a repair's
        const nb = noise2(u * 0.55 + o.seed, t * 0.8, 3), inPatch = Math.abs(i - patch.c) < patch.w && Math.abs(k - patch.k) < patch.h;
        tc.copy(tints[Math.floor(h2 * 7919) % tints.length]).lerp(tints[nb > 0.5 ? 2 : 5], 0.25 + 0.3 * Math.abs(nb - 0.5)).multiplyScalar(0.74 + 0.36 * h3 + (inPatch ? 0.12 : 0));
        if (inPatch) tc.lerp(white, 0.5);
        const deep = _p.y < TILE_DEEP, krn = [0, o.moss * (deep ? 0.6 : 1), o.seed * 0.013, 0.25];      // (moss is the roof's own number: the material grows it by place)
        const st = o.sAt ? o.sAt(_p) + 0.3 : 0;                  // (how far along the route it lies: see `passed`)
        tiles[o.kind + (deep ? (pant && _p.y < TILE_FAR ? '_far' : '_deep') : (_p.y > TILE_DRY ? '_dry' : ''))].add(_m, tc, krn, st);
        if (_p.y > TILE_MIRROR) tiles[o.kind + '_mirror'].add(_m, tc, krn, st);
        if (_p.y > TILE_DRY) tiles[o.kind + '_pre'].add(_m, tc, krn, st);
      }
    }
  };
  /** A run of ridge tiles from a to b (points on the ridge line), bedded: lift(f) = how far the ridge has sunk at f (0..1 along it). */
  const layRidge = (kind, a, b, seed, lift, skip) => {
    const pant = kind === 'pantile', ru = pant ? [K.ridge_half, K.ridge_half_b] : [K.ridge_hog, K.ridge_hog_b], ulen = pant ? 0.33 : 0.46, tints = TINTS[kind];
    const len = a.distanceTo(b), n = Math.max(1, Math.round(len / ulen)), step = len / n, dir = b.clone().sub(a).normalize(), yaw = Math.atan2(-dir.z, dir.x);
    for (let i = 0; i < n; i++) {
      const h1 = hash2(i, 991, seed), h2 = hash2(i, 992, seed), f0 = i / n, f1 = (i + 1) / n;
      if (skip && skip(a, dir, i * step, (i + 1) * step)) continue;
      const y0 = lift ? lift(f0) : 0, y1 = lift ? lift(f1) : 0;
      _p.copy(a).addScaledVector(dir, i * step); _p.y += y0 + (pant ? 0 : 0.012);
      _e.set((h1 - 0.5) * 0.04, yaw, Math.atan2(y1 - y0 + (b.y - a.y) / n, step) + (h2 - 0.5) * 0.02, 'YXZ');
      _m.compose(_p, _q.setFromEuler(_e), _s.set(step / ulen, 1, 1));
      tc.copy(tints[Math.floor(h1 * 97) % tints.length]).multiplyScalar(0.82 + 0.28 * h2);
      const md = ru[h1 < 0.14 ? 1 : 0]; if (md) layMain(md, _m, tc, [0, 0.5 + 0.4 * h2, h1, 0.6]);
    }
  };
  /** A plain piece made here (boards under a roof, a strip of lead): quads through rows of points, each with a colour. */
  const sheet = (bin, rows, cols, M, flip = false, kr = [0, 0, 0, 0]) => {
    const nr = rows.length, nc = rows[0].length, pos = [], nor = [], colr = [], idx = [], a = new THREE.Vector3(), b = new THREE.Vector3(), n = new THREE.Vector3();
    for (let i = 0; i < nr; i++) for (let j = 0; j < nc; j++) {
      const p = rows[i][j], i0 = Math.max(0, i - 1), i1 = Math.min(nr - 1, i + 1), j0 = Math.max(0, j - 1), j1 = Math.min(nc - 1, j + 1);
      a.set(rows[i1][j][0] - rows[i0][j][0], rows[i1][j][1] - rows[i0][j][1], rows[i1][j][2] - rows[i0][j][2]); b.set(rows[i][j1][0] - rows[i][j0][0], rows[i][j1][1] - rows[i][j0][1], rows[i][j1][2] - rows[i][j0][2]);
      n.crossVectors(b, a).normalize(); if (flip) n.negate();
      const c = cols[i][j]; pos.push(p[0], p[1], p[2]); nor.push(n.x, n.y, n.z); colr.push(c.r, c.g, c.b);
    }
    for (let i = 0; i < nr - 1; i++) for (let j = 0; j < nc - 1; j++) { const q = i * nc + j; if (flip) idx.push(q, q + nc, q + 1, q + 1, q + nc, q + nc + 1); else idx.push(q, q + 1, q + nc, q + 1, q + nc + 1, q + nc); }
    const piece = { count: pos.length / 3, position: pos, normal: nor, color: colr, index: idx };
    if (bin === above) lay(piece, M, null, kr); else layUnder(piece, M, null, kr);
  };

  // the stacks of the layout, each with the model that stands for it (needed before the ridges are laid). The right
  // bank's seven are made to measure, in the layout's order; the others by what they are. A stack's front looks at the channel.
  const stackLen = { 1: 0.89, 2: 1.115, 3: 1.34, 4: 1.565 };
  { let rb = 0, deep = 0;
    for (const st of town.stacks) {
      const q = town.sd(st.x, st.z);
      st.kr = { d: q.d, s: q.s, flip: q.d > 0 ? Math.PI : 0 };
      if (st.cupola) st.kr.model = null;                                   // the dovecote: see below
      else if (st.vane) st.kr.model = 'stack_10';
      else if (st.clear && st.perch && Math.abs(q.s - 204) < 3) st.kr.model = 'stack_9';
      else if (st.clear && q.s > 125) st.kr.model = 'stack_8';
      else if (st.clear) st.kr.model = 'stack_' + (++rb);
      else { st.kr.model = st.pots > 1 ? (deep % 2 ? 'stack_deep_d' : 'stack_deep_b') : (deep % 2 ? 'stack_deep_c' : 'stack_deep_a'); st.kr.deep = true; st.kr.flip = (deep % 3 === 0) ? Math.PI : 0; deep++; }
      const R = roofs.find((r) => r.h.s === st.s && r.h.d === st.d);
      if (R) { const [lx, lz] = R.local(st.x, st.z); st.kr.lx = lx; st.kr.lz = lz; (R.stacks || (R.stacks = [])).push(st); }
    } }

  // A stack of the roofs under the keel keeps clear of its own house's dormers. The layout sets stacks and dormers
  // without a thought for one another, and the houses' dormers stand a hand higher than their ridges: at s 52 a stack
  // stood between two of them, its brick sunk between their flat tops and its pot standing on them like a flowerpot,
  // right under the gunwale. Where a dormer is in its way a stack slides along its ridge to the nearest free place
  // (kr.x, kr.z: where it stands; the layout's own record is left as it was, for whoever else reads it).
  for (const st of town.stacks) {
    if (!st.kr || !st.kr.deep) continue;
    const h = town.houses.find((q) => q.s === st.s && q.d === st.d); if (!h) continue;
    const c = Math.cos(h.yaw), sn = Math.sin(h.yaw), hl = (stackLen[st.pots] || 0.89) / 2;
    const lx0 = (st.x - h.x) * c - (st.z - h.z) * sn, lz0 = (st.x - h.x) * sn + (st.z - h.z) * c;
    const inWay = town.dormers.map((q) => ({ lx: (q.x - h.x) * c - (q.z - h.z) * sn, lz: (q.x - h.x) * sn + (q.z - h.z) * c, w: q.w, dep: q.dep, top: q.y + q.h }))
      .filter((q) => Math.abs(q.lx) < h.w / 2 + 1 && Math.abs(q.lz - lz0) - q.dep / 2 - 0.33 < 0.45 && q.top > st.y1 - 0.9);
    const free = (lx) => Math.abs(lx) <= h.w / 2 - hl - 0.2 && inWay.every((q) => Math.abs(q.lx - lx) - q.w / 2 - hl > 0.4);
    if (!inWay.length || free(lx0)) continue;
    let best = null; for (let k = 1; k < 20 && best === null; k++) for (const sg of [-1, 1]) { const lx = lx0 + sg * k * 0.15; if (free(lx)) { best = lx; break; } }
    if (best !== null) { st.kr.x = h.x + best * c + lz0 * sn; st.kr.z = h.z - best * sn + lz0 * c; st.kr.slid = best - lx0; }
  }

  // ---------------------------------------------------------------------------------------------- the roofs awash
  // The near slope (the one that looks at the channel) is laid tile by tile from the eaves, two and a half metres down,
  // to the ridge; the far slope is never seen from the water and is closed plainly.
  if (want('tiles')) for (const R of roofs) {
    const F = R.F, pant = R.kind === 'pantile', sp = Math.sin(R.phi), cp = Math.cos(R.phi);
    // the near slope: U runs so that U x T looks out of the roof (down the route on the left bank, up it on the right)
    const U = new THREE.Vector3(R.side, 0, 0).transformDirection(F), T = new THREE.Vector3(0, sp, -R.side * cp).transformDirection(F);
    const O = new THREE.Vector3(R.side > 0 ? R.x0 : R.x1, R.h.eaves, R.side * R.half).applyMatrix4(F);
    const [rs0, rtx, rtz] = routeAt(R.h.x, R.h.z);
    laySlope({ kind: R.kind, O, U, T, uLen: R.len, tLen: R.Ls, u0: PW, u1: PW, seed: R.seed, moss: R.moss, sAt: (q) => rs0 + (q.x - R.h.x) * rtx + (q.z - R.h.z) * rtz,
      lift: (u, tn) => sag(R, R.side > 0 ? R.x0 + u : R.x1 - u, tn),
      keep: (p) => { if (underWing(p)) return false;
        if (R.skylight) { const [lx, lz] = R.local(p.x, p.z); if (Math.abs(lx - R.skylight.lx - 0.12) < 0.52 && lz - R.skylight.lz > -0.5 && lz - R.skylight.lz < 0.26) return false; }      // (no tile lies in the skylight's kerb)
        return true; } });
    // the ridge: tiles bedded in mortar from gable to gable, following the sway of the old roof; it keeps clear of a
    // stack that stands astride it, and of a wing that crosses it
    const ra = new THREE.Vector3(R.x0 + PW, R.h.ridge, 0).applyMatrix4(F), rb = new THREE.Vector3(R.x1 - PW, R.h.ridge, 0).applyMatrix4(F);
    layRidge(R.kind, ra, rb, R.seed, (f) => sag(R, R.x0 + PW + f * (R.len - 2 * PW), 1), (a, dir, d0, d1) => {
      const lx0 = R.x0 + PW + d0, lx1 = R.x0 + PW + d1;
      if ((R.stacks || []).some((st) => Math.abs(st.kr.lz) < 0.3 && lx1 > st.kr.lx - stackLen[st.pots] / 2 - 0.03 && lx0 < st.kr.lx + stackLen[st.pots] / 2 + 0.03)) return true;
      _p.copy(a).addScaledVector(dir, (d0 + d1) / 2); return underWing(_p);
    });
    // the coped gable wall at each end (the same model turned half round for the far end)
    // (where a neighbour's wall stands against it, as high and in line, nothing of this wall's outer face can be seen: the
    // plain form of the model, without the render's broken edges and the brick behind them)
    { const ends = pant ? [K.roof_end_rb_a, K.roof_end_rb_b] : [K.roof_end_lb_a, K.roof_end_lb_b], plain = pant ? K.roof_end_rb_c : K.roof_end_lb_c, renders = ['#ffffff', '#eceef6', '#e6e2f0', '#f1f1ee', '#e2e5ee'];      // (fifth holder: lime render is a cool grey; tinted warm it lost the cast the kit's material keeps for cool paints, and stood beside the lantern as a flat salmon plane)
      for (const e of [0, 1]) {
        const hidden = roofs.some((O) => { if (O === R || O.kind !== R.kind) return false; const [lx, lz] = R.local(O.h.x, O.h.z);
          return (e ? lx > 0 : lx < 0) && Math.abs(lx) - (R.len + O.len) / 2 < 0.9 && Math.abs(lz) < 0.6 && O.h.ridge >= R.h.ridge - 0.25; });
        const md = (hidden && plain) || ends[Math.floor(hash2(e, 77, R.seed) * 2)]; if (!md) continue;
        _m.makeRotationY(e ? Math.PI : 0).setPosition(e ? R.x1 : R.x0, R.h.ridge, 0).premultiply(F);
        // (the wall as modelled down to half a metre under the water; below that its plain form, cut clean at the same level:
        // nobody studies a coping stone through a metre of water, and thirty walls go down two metres each)
        const tint = tc.set(renders[Math.floor(hash2(e, 78, R.seed) * renders.length)]), krn = [0, 0.35, hash2(e, 79, R.seed), 1], dm = pant ? K.roof_end_rb_d : K.roof_end_lb_d;
        if (dm && !Q.has('krfull')) { const top = clipped(md, _m, WALL_DEEP, 1), bot = clipped(dm, _m, WALL_DEEP, -1); if (top) layMain(top, _m, tint, krn); if (bot) layUnder(bot, _m, tint, krn); layTwin(dm, _m, tint, krn); }
        else lay(md, _m, tint, krn);
      } }
    // the roof under the tiles: boards and battens, dark, seen only where a tile has gone; and the far slope, closed
    // (the near slope of the roof with the skylight is left open under its kerb: the lit room is seen down the well)
    { const c0 = col('#3d3038'), c1 = col('#2c2430');
      const pt = (lx, t, sd) => [lx, R.h.eaves + (R.h.ridge - R.h.eaves) * t - 0.02 + sag(R, lx, t), sd * R.half * (1 - t)];
      const piece = (sd, xa, xb, ta, tb) => {
        if (xb - xa < 0.01 || tb - ta < 0.004) return;
        const n = Math.max(1, Math.ceil((xb - xa) / 1.2)), rows = [[], []];
        for (let i = 0; i <= n; i++) { const lx = xa + (xb - xa) * i / n; rows[0].push(pt(lx, ta, sd)); rows[1].push(pt(lx, tb, sd)); }
        const ca = c1.clone().lerp(c0, ta), cb = c1.clone().lerp(c0, tb);
        sheet(under, rows, [rows[0].map(() => ca), rows[1].map(() => cb)], F, sd < 0);
      };
      for (const sd of [R.side, -R.side]) {
        const k = sd === R.side && want('small') ? R.skylight : null;
        if (!k) { piece(sd, R.x0, R.x0 + R.len, 0, 1); continue; }
        const tm = 1 - Math.abs(k.lz) / R.half, dt = 0.4 * cp / R.half, a0 = k.lx - 0.475, a1 = k.lx + 0.475;
        piece(sd, R.x0, a0, 0, 1); piece(sd, a1, R.x0 + R.len, 0, 1); piece(sd, a0, a1, 0, tm - dt); piece(sd, a0, a1, tm + dt, 1);
      } }
  }

  // ---------------------------------------------------------------------------------------------- the cross gables
  // The model is the wing's front with its window and its lit room, its cheeks, its verge and the boards of its roof.
  // Its slates (or pantiles), its ridge and the lead of its two valleys are laid here, against the roofs behind it.
  // (sixth holder) The light of these rooms in the water. Every other window of the town burns with a halo round it (the
  // light's own, light.halos: a glow that stands a hand in front of the glass, lies on sill and wall, wakes and sleeps
  // with its window and stops exactly at the surface). The kit's four attic rooms and its skylight had none: the layout's
  // pane and its halo stand INSIDE the wing, unseen, so the half-lit gable, the page's own picture, was the dimmest
  // window in its street. roomHalos: one for each, as that room is lit (gable 3's paper is jade; the half-lit gable's
  // lamp is the one that stays).
  const roomHalos = [];
  if (want('gables')) for (const G of gables) {
    const md = K[G.name]; if (!md) continue;
    lay(md, G.F, null, [0, 0.4, G.seed * 0.01, 1], [G.g.s / 300, 0.3, G.g.halfLit ? 1 : 0]);
    { const o = new THREE.Vector3(0, 0, 1).transformDirection(G.F);
      // (where its light stands behind the glass, how wide its glow, its colour: gable 1's room is lit from a door out of
      // sight, a low rose; the half-lit gable's lamp is the street's own rose-gold, the widest; gable 3's paper is jade;
      // gable 4's landing a paler gold)
      const q = [[-0.2, 2.1, '#7a3a26'], [0.1, 3.2, '#f2703a'], [-0.26, 2.5, '#3a9a7c'], [0.2, 2.7, '#e88a44']][G.i] || [0, 2.5, '#f2703a'];
      _p.set(q[0], -0.42, 0.0).applyMatrix4(G.F);
      roomHalos.push({ x: _p.x, y: _p.y, z: _p.z, size: q[1], color: q[2], s: G.g.s, rnd: 0.3, stay: G.g.halfLit ? 1 : 0, out: [o.x, o.y, o.z] }); }
    const wingY = (lx) => G.apex - TANW * Math.abs(lx), cw = 1 / Math.hypot(1, TANW), sw = TANW * cw, tLen = EAVE / cw, [gs0, gtx, gtz] = routeAt(G.x, G.z);
    for (const sg of [-1, 1]) {
      // each slope from the wing's own eaves to its ridge, from its face back; only where it stands above the roof behind
      const U = new THREE.Vector3(0, 0, -sg).transformDirection(G.F), T = new THREE.Vector3(-sg * cw, sw, 0).transformDirection(G.F);
      const O = new THREE.Vector3(sg * EAVE, G.apex - TANW * EAVE, sg > 0 ? G.zf : -WLEN).applyMatrix4(G.F);
      const bare = G.boards ? 0.0 : 0.26;                         // (a coped gable's parapet takes the first hand's breadths of its roof)
      laySlope({ kind: G.kind, O, U, T, uLen: WLEN + G.zf, tLen, u0: sg > 0 ? bare : 0.0, u1: sg > 0 ? 0.0 : bare, seed: G.seed + (sg > 0 ? 1 : 2), moss: 0.6, tuck: G.kind === 'pantile' ? 0.3 : 0.22, sAt: (q) => gs0 + (q.x - G.x) * gtx + (q.z - G.z) * gtz,
        keep: (p) => p.y > mainRoofY(p.x, p.z) + 0.03 });
      // the valley: lead laid where the wing's slope meets the roof behind it, from the wing's eaves up to the main ridge
      // (old lead, dark, its gutter darker still and green with what lodges there: pale, it lay in the valley like a plank)
      const rows = [[], [], []], cols = [[], [], []], lead = col('#6c6e86'), pale = col('#9698ae'), dark = col('#474a5c'), silt = col('#3c5a4c');
      for (let v = 0; v <= WLEN; v += 0.22) {
        let ax = EAVE, ok = false;
        for (let it = 0; it < 6; it++) { _p.set(sg * ax, 0, -v).applyMatrix4(G.F); const my = mainRoofY(_p.x, _p.z); if (my === -Infinity) { ok = false; break; } ax = (G.apex - my) / TANW; ok = true; }
        if (!ok || ax > EAVE - 0.02 || ax < 0.26) { if (rows[0].length > 1) break; rows.forEach((r) => (r.length = 0)); cols.forEach((c) => (c.length = 0)); continue; }      // (it stops a hand short of the wing's ridge: run on, its end stood up through the slates as a pale horn)
        const yv = wingY(ax), h = hash2(Math.round(v * 9), sg + 3, G.seed);
        rows[0].push([sg * (ax - 0.13), wingY(ax - 0.13) + 0.07, -v]); rows[1].push([sg * ax, yv + 0.012, -v]); rows[2].push([sg * (ax + 0.15), yv + 0.085, -v + 0.03]);
        for (let q = 0; q < 3; q++) cols[q].push(q === 1 ? tc.copy(dark).lerp(silt, 0.3 + 0.6 * h).clone() : tc.copy(lead).lerp(pale, 0.45 * hash2(Math.round(v * 9), q + 7, G.seed)).clone());
      }
      if (rows[0].length > 1) sheet(above, rows, cols, G.F, sg > 0, [0, 0.5, 0.3, 0.6]);
    }
    // its ridge, from the face back to where it dies into the roof behind (it runs on past the main ridge, until the far slope rises to meet it)
    { let back = 2.6; for (; back < WLEN; back += 0.1) { _p.set(0, 0, -back).applyMatrix4(G.F); if (mainRoofY(_p.x, _p.z) > G.apex - 0.04) break; }
      const a = new THREE.Vector3(0, G.apex, G.boards ? G.zf - 0.02 : -0.28).applyMatrix4(G.F), b = new THREE.Vector3(0, G.apex, -Math.min(back + 0.2, WLEN)).applyMatrix4(G.F);
      layRidge(G.kind, a, b, G.seed + 5, null, null); }
    // a wing that stands in navigable water keeps the hull off its face
    const hw = town.hw(G.g.s), dF = town.sd(G.x, G.z).d;
    if (Math.abs(dF) < hw + 0.9) for (const lx of [-2.25, -1.35, -0.45, 0.45, 1.35, 2.25]) { _p.set(lx, 0, -0.75).applyMatrix4(G.F); ctx.addCollider({ x: _p.x, z: _p.z, r: 0.75 }); }      // (its whole width: the corners of the wing too)
  }

  // ---------------------------------------------------------------------------------------------- the houses' own roofs under the deep stacks
  // A stack of the roofs under the keel stands on a roof that the houses' module models (kit_houses.js: the shells), and
  // that roof is not always the plain ridge the layout promises: one house has a lead flat, another a cross gablet, and
  // where the real roof stands higher than the layout's ridge a stack's brick is buried in it and its pot stands on the
  // lead like a flowerpot (the pot under the gunwale at s 52). So the kit LOOKS: roofUnder(x, z, under) is the height of
  // the houses' real roof over a place (the highest of their triangles there that lies below `under`).
  const roofUnder = !Q.has('krlog') ? null : (() => {
    const shells = []; ctx.group.traverse((o) => { if (o.isMesh && /town-shells/.test(o.name) && o.geometry && o.geometry.attributes.position) shells.push(o); });
    const pts = town.stacks.filter((st) => !st.clear && st.y1 > -4).map((st) => [st.x, st.z]), tris = [];
    for (const m of shells) { const P = m.geometry.attributes.position.array, I = m.geometry.index ? m.geometry.index.array : null, n = I ? I.length : P.length / 3;
      for (let t = 0; t < n; t += 3) { const a = (I ? I[t] : t) * 3, b = (I ? I[t + 1] : t + 1) * 3, c = (I ? I[t + 2] : t + 2) * 3;
        const x0 = Math.min(P[a], P[b], P[c]), x1 = Math.max(P[a], P[b], P[c]), z0 = Math.min(P[a + 2], P[b + 2], P[c + 2]), z1 = Math.max(P[a + 2], P[b + 2], P[c + 2]);
        let near = false; for (const q of pts) if (q[0] > x0 - 3.2 && q[0] < x1 + 3.2 && q[1] > z0 - 3.2 && q[1] < z1 + 3.2) { near = true; break; }
        if (near) tris.push(P[a], P[a + 1], P[a + 2], P[b], P[b + 1], P[b + 2], P[c], P[c + 1], P[c + 2]); } }
    const T = new Float32Array(tris);
    const fn = (x, z, under) => { let y = -Infinity;
      for (let i = 0; i < T.length; i += 9) { const ax = T[i], az = T[i + 2], bx = T[i + 3], bz = T[i + 5], cx = T[i + 6], cz = T[i + 8];
        if ((x < ax && x < bx && x < cx) || (x > ax && x > bx && x > cx) || (z < az && z < bz && z < cz) || (z > az && z > bz && z > cz)) continue;
        const d = (bz - cz) * (ax - cx) + (cx - bx) * (az - cz); if (Math.abs(d) < 1e-9) continue;
        const u = ((bz - cz) * (x - cx) + (cx - bx) * (z - cz)) / d, v = ((cz - az) * (x - cx) + (ax - cx) * (z - cz)) / d, w = 1 - u - v;
        if (u < -1e-4 || v < -1e-4 || w < -1e-4) continue;
        const yy = u * T[i + 1] + v * T[i + 4] + w * T[i + 7]; if (yy < under && yy > y) y = yy; }
      return y; };
    fn.known = T.length > 0;
    return fn;
  })();

  // ---------------------------------------------------------------------------------------------- stacks and pots
  // Ten stacks stand clear of the water (each its own model, made to measure), twenty-two stand on the roofs under the
  // keel with their pots 0.3 m under the surface. What the cast needs of them goes in shared.pots (every pot's mouth:
  // bubbles and weed leave from there) and shared.perches (where the two cormorants stand).
  const pots = [];
  if (want('stacks')) {
    const v = new THREE.Vector3();
    for (const st of town.stacks) {
      const md = st.kr.model && K[st.kr.model]; if (!md) continue;
      _m.makeRotationY(st.yaw + st.kr.flip).setPosition(st.kr.x ?? st.x, st.kr.deep ? st.y1 : 0, st.kr.z ?? st.z);
      (st.kr.deep ? layUnder : lay)(md, _m, null, [0, 0.4, hash2(Math.round(st.x * 10), Math.round(st.z * 10), 5), 1]);
      for (const [name, p] of Object.entries(md.points)) {
        v.set(p[0], p[1], p[2]).applyMatrix4(_m);
        if (name.startsWith('mouth')) pots.push({ x: v.x, y: v.y, z: v.z, s: st.kr.s, d: st.kr.d, clear: !!st.clear, stack: st, name });
        if (name === 'perch') { st.kr.perch = v.clone(); const pr = (shared.perches || []).find((q) => Math.hypot(q.x - st.x, q.z - st.z) < 1.5); if (pr) { pr.x = v.x; pr.y = v.y; pr.z = v.z; pr.model = st.kr.model; } }
        if (name === 'vane') st.kr.vane = v.clone();
      }
    }
  }
  shared.pots = pots;
  // What stands out of the water at the navigable edge keeps the hull off it: the dovecote's turret (its face is 0.3 m
  // inside the edge) and the tall stack with the vane (0.2 m inside). The others stand two metres and more beyond.
  for (const st of town.stacks) {
    if (!st.clear) continue;
    const reach = st.cupola ? 0.92 : 0.36, edge = town.hw(st.kr.s);
    if (Math.abs(st.kr.d) - reach > edge + 0.6) continue;
    if (st.cupola) ctx.addCollider({ x: st.x, z: st.z, r: 1.15 });
    else { const yw = st.yaw + st.kr.flip, hl = (stackLen[st.pots] || 1.1) / 2 - 0.3; for (const u of [-hl, hl]) ctx.addCollider({ x: st.x + u * Math.cos(yw), z: st.z - u * Math.sin(yw), r: 0.62 }); }
  }

  // ---------------------------------------------------------------------------------------------- the small things a rider finds when he stops
  const vanes = [], weedRoots = [];                             // (weedRoots: where weed trails from a lodged thing, for the weed below)
  if (want('small')) {
    const v = new THREE.Vector3(), slopeAt = (R, lx, lz, lift = 0) => {         // a place on a roof's near slope, and the frame that lies in it: x along the eaves, y up the slope, z out of the roof
      const sp = Math.sin(R.phi), cp = Math.cos(R.phi), tn = 1 - Math.abs(lz) / R.half;
      const U = new THREE.Vector3(R.side, 0, 0).transformDirection(R.F), T = new THREE.Vector3(0, sp, -R.side * cp).transformDirection(R.F), N = new THREE.Vector3().crossVectors(U, T);
      const P = new THREE.Vector3(lx, R.h.ridge - Math.abs(lz) * R.rise / R.half + sag(R, lx, tn), lz).applyMatrix4(R.F).addScaledVector(N, lift);
      return new THREE.Matrix4().makeBasis(U, T, N).setPosition(P);
    };
    const pantLift = (R) => (R.kind === 'pantile' ? 0.085 : 0.03);              // the crest of a pantile's roll, or a slate's face, above the roof's own plane
    // the dovecote: an empty cupola on its turret, where the left bank's roofs have gone under (s 88)
    for (const st of town.stacks) if (st.cupola && K.dovecote) {
      _m.makeRotationY(st.yaw + st.kr.flip).setPosition(st.x, 0, st.z);
      lay(K.dovecote, _m, null, [0, 0.5, 0.37, 1]);
      v.fromArray(K.dovecote.points.top || [0, 1.67, 0]).applyMatrix4(_m); shared.dovecote = { x: st.x, z: st.z, top: v.clone(), s: st.kr.s, d: st.kr.d };
    }
    // the arrow vane on the tall stack's spindle (s 102): it turns in the material (uKrVane[0])
    for (const st of town.stacks) if (st.kr.vane && K.vane_arrow) {
      const base = Math.PI * 0.3;
      _m.makeRotationY(base).setPosition(st.kr.vane.x, st.kr.vane.y - 0.24, st.kr.vane.z);      // (high on its spindle: its arrow sweeps a hand above the rim of the pot beside it)
      layThin(K.vane_arrow, _m, null, [3, 0, 0.2, 0]);
      vanes.push({ u: KRU.uKrVane.value[0], x: st.kr.vane.x, z: st.kr.vane.z, y: st.kr.vane.y - 0.11, base, phase: 1.7 });
    }
    // the roof ladder hooked over a ridge (s 74), on the right bank
    { const R = roofs.find((r) => r.kind === 'pantile' && r.h.s > 70 && r.h.s < 80);
      if (R && K.roof_ladder) { const lx = -0.5; _m.makeRotationY(Math.PI).setPosition(lx, R.h.ridge + sag(R, lx, 1), 0).premultiply(R.F); layMain(K.roof_ladder, _m, null, [0, 0.3, 0.6, 0.5]); } }
    // the skylight, propped open 0.66 m under the surface, lit from the room below
    for (const R of roofs) if (R.skylight && K.roof_skylight) {
      const M = slopeAt(R, R.skylight.lx, R.skylight.lz, 0.22);
      lay(K.roof_skylight, M, null, [0, 0.3, 0.8, 0.3], [(skyW ? skyW.s : 90) / 300, 0.4, 1]);
      v.setFromMatrixPosition(M); shared.kitRoofSkylight = { x: v.x, y: v.y, z: v.z };
      { const o = new THREE.Vector3().setFromMatrixColumn(M, 2).normalize(); roomHalos.push({ x: v.x, y: v.y - 0.1, z: v.z, size: 2.3, color: '#f2703a', s: skyW ? skyW.s : 90, rnd: 0.4, stay: 1, out: [o.x, o.y, o.z] }); }      // (its well's light in the water over it)
    }
    // the balcony awash on the terrace of the square (s 172): its floor half a metre down, the top of its rail out of the water
    if (K.balcony_rail) { const te = plan.square.terrace, [x, z] = town.xz(172, te.d0 - 0.45);
      _m.makeRotationY(town.along(172) + Math.PI).setPosition(x, 0, z); layThin(K.balcony_rail, _m, null, [0, 0.35, 0.15, 0.1]); }
    // the eaves gutter of the right bank, just under the surface: two-metre lengths on their brackets, one in six with a bracket gone
    for (const R of roofs) if (R.kind === 'pantile' && K.roof_gutter) {
      const n = Math.round((R.len - 2 * PW) / 2), step = (R.len - 2 * PW) / n;
      for (let i = 0; i < n; i++) {
        const h1 = hash2(i, 55, R.seed), lx = R.x1 - PW - i * step;             // (turned half round: its length runs up the route from there)
        _e.set(0, Math.PI, (h1 - 0.5) * 0.02, 'YXZ');
        _m.compose(_p.set(lx, R.h.eaves + sag(R, lx - step / 2, 0), R.side * R.half), _q.setFromEuler(_e), _s.set(step / 2, 1, 1)).premultiply(R.F);
        layUnder(h1 < 0.17 && K.roof_gutter_b ? K.roof_gutter_b : K.roof_gutter, _m, null, [0, 0.7, h1, 0.4]);
      }
    }
    // the pot that fell from the broken stack (s 114): it lies in the tiles at the waterline
    { const st = town.stacks.find((q) => q.kr && q.kr.model === 'stack_7'), R = st && roofs.find((r) => (r.stacks || []).includes(st));
      if (R && K.pot_fallen) { const lz = R.side * (R.h.ridge - 0.04) * R.half / R.rise, M = slopeAt(R, st.kr.lx + 0.55, lz, 0.075);
        _m.makeRotationX(Math.PI / 2).premultiply(new THREE.Matrix4().makeRotationZ(0.35)).premultiply(M); layMain(K.pot_fallen, _m, null, [0, 0.6, 0.5, 0.4]); } }
    // Cushions of moss, each where water lingers: on the pantiles in the pans (never astride a roll), lying up the
    // slope as the pan runs; on the slates along the laps; thickest in the hand's breadths either side of the surface,
    // a few along the foot of the ridge's mortar. Dark, low, ragged: they are found, not seen from across the street.
    for (const R of roofs) {
      const rr = ctx.rng(R.seed + 9), ms = [K.moss_a, K.moss_b, K.moss_c, K.moss_d, K.moss_d].filter(Boolean); if (!ms.length) continue;
      const pant = R.kind === 'pantile', avail = R.len - 2 * PW, nX = Math.max(1, Math.floor((avail - 0.04) / 0.205)), cover = (avail - 0.04) / nX;
      const n = 15 + Math.floor(rr() * 8);
      for (let i = 0; i < n; i++) {
        const onRidge = i % 5 === 0;
        const yy = onRidge ? R.h.ridge - 0.13 - rr() * 0.08 : -0.3 + 0.75 * Math.pow(rr(), 1.4);
        if (yy > R.h.ridge - 0.07) continue;
        // (a pantile's pan lies 0.072 of a tile from its left edge as the slope is laid: from the low end of the eaves)
        const ti = Math.floor(rr() * nX), across = PW + ti * cover + (pant ? 0.072 * cover / 0.205 : rr() * cover);
        const lx = R.side > 0 ? R.x0 + across : R.x1 - across, lz = R.side * Math.max(0.05, R.h.ridge - yy) * R.half / R.rise;
        const M = slopeAt(R, lx, lz, pant ? 0.026 : 0.021);
        v.setFromMatrixPosition(M); if (underWing(v)) continue;
        const md = ms[Math.floor(rr() * ms.length)], k = (pant ? 0.75 : 0.9) + rr() * 0.55;
        const spin = pant ? Math.PI / 2 + (rr() - 0.5) * 0.3 + (rr() < 0.5 ? Math.PI : 0) : (rr() - 0.5) * 0.35 + (rr() < 0.5 ? Math.PI : 0);
        _m.makeRotationX(Math.PI / 2).premultiply(new THREE.Matrix4().makeRotationZ(spin)).scale(_s.set(k * (pant ? 1.25 : 1.3), k * (pant ? 0.62 : 1), k * (0.8 + 0.5 * rr()))).premultiply(M);
        layMain(md, _m, tc.setRGB(0.7 + 0.35 * rr(), 0.72 + 0.3 * rr(), 0.7 + 0.3 * rr()), [0, 0, rr(), 0.2]);
      }
    }
    // ------------------------------------------------------------------------------------------ lodged and grown
    // What the town's slow current has laid against the things that stand in it, and what has taken root since. Each
    // has its reason. The current runs down the street and a little toward the left bank (shared.current, below).
    { const a0 = town.along(90), cur = new THREE.Vector2(Math.cos(a0) - 0.22 * Math.sin(a0), -Math.sin(a0) - 0.22 * Math.cos(a0)).normalize();
      // A limb of driftwood lies ACROSS the up-stream face of a thing that stands alone in the water, held there by the
      // current. (x, z): the thing's middle; (hx, hz), yaw: its half sizes and turn; slide: how far along the face; turn: a little askew.
      const lodge = (md, x, z, yaw, hx, hz, slide, turn, flipped, k = 1) => {
        if (!md) return;
        const c = Math.cos(yaw), sn = Math.sin(yaw), faces = [[1, 0, hx], [-1, 0, hx], [0, 1, hz], [0, -1, hz]];
        let best = null;                                          // the face that looks most squarely up the current
        for (const [fx, fz, reach] of faces) { const nx = fx * c + fz * sn, nz = -fx * sn + fz * c, dot = nx * cur.x + nz * cur.y; if (!best || dot < best.dot) best = { nx, nz, reach, dot }; }
        const th = Math.atan2(-best.nx, -best.nz) + turn + (flipped ? Math.PI : 0), tx = -best.nz, tz = best.nx;      // (its front, +Z, rests against the face)
        _m.makeRotationY(th).scale(_s.set(k, k, k)).setPosition(x + best.nx * (best.reach + 0.075 * k) + tx * slide, 0, z + best.nz * (best.reach + 0.075 * k) + tz * slide);
        layMain(md, _m, tc.setRGB(0.92 + 0.12 * Math.abs(turn), 0.94, 0.96), [0, 0.5, 0.31 + slide, 0.1]);
        for (const n of ['weed1', 'weed2', 'weed3']) if (md.points[n]) { v.fromArray(md.points[n]).applyMatrix4(_m); weedRoots.push({ x: v.x, y: v.y, z: v.z, ox: best.nx, oz: best.nz }); }
      };
      for (const st of town.stacks) {
        if (!st.clear || st.y0 > -2.5) continue;                  // the things that rise straight out of deep water: the tall stack with the vane, the dovecote's turret, the lone stack of the square
        // (three kinds, one to each: a forked limb, a long branch with its twigs, a board from somebody's floor. The one limb
        // turned and scaled three times was driftwood the first time it was found and a stamp the third.)
        if (st.cupola) lodge(K.drift_branch || K.drift_limb, st.x, st.z, st.yaw, 0.6, 0.6, 0.3, 0.1, false, 0.9);
        else if (st.vane) lodge(K.drift_limb, st.x, st.z, st.yaw + st.kr.flip, stackLen[st.pots] / 2, 0.3325, -0.3, -0.1, true, 1.0);
        else if (st.perch) lodge(K.drift_plank || K.drift_limb, st.x, st.z, st.yaw + st.kr.flip, stackLen[st.pots] / 2, 0.3325, 0.3, 0.16, false, 1.0);
      }
      // The lost shutter. The first gable (s 44) has one shutter left, hanging by a hinge; its twin went down the street
      // on the current and lies in the corner the water makes where the next gable's wing meets its roof (s 58: the
      // half-lit gable, where a rider stops longest), on the wing's up-stream side.
      { const G = gables[1];
        if (G && K.drift_shutter) {
          // (fifth holder) It lay flat in the water in the corner of the inlet and could not be found in its own picture: seen
          // from a boat a board afloat is a dark sliver. The water has stood higher than this (the tide mark is at 0.6 m):
          // when it fell the shutter was left STRANDED on the slates of the roof behind the wing, just up-stream of the
          // wing's eaves, where the roof looks straight at the channel: most of it out of the water, one corner still
          // under, its boards and its two ledges plain to anyone who looks at the half-lit gable beside it.
          _p.set(-EAVE - 0.95, 0, -0.4).applyMatrix4(G.F);
          const R = roofs.find((r) => { const [lx, lz] = r.local(_p.x, _p.z); return lx > r.x0 + 0.3 && lx < r.x1 - 0.3 && Math.abs(lz) <= r.half; });
          if (R) { const [lx] = R.local(_p.x, _p.z), lz = R.side * (R.h.ridge - 0.11) * R.half / R.rise, M = slopeAt(R, lx, lz, R.kind === 'pantile' ? 0.1 : 0.05);
            _m.makeRotationX(Math.PI / 2).premultiply(new THREE.Matrix4().makeRotationZ(0.42 * R.side)).premultiply(M);
            layMain(K.drift_shutter, _m, null, [0, 0.4, 0.62, 0.1]);
            shared.kitRoofShutter = { x: _m.elements[12], z: _m.elements[14] }; }
        } }
      // Hart's tongue, where mortar holds the wet: at the foot of three stacks on the right bank's ridges (the side the
      // rain is thrown to), on the dovecote's leaded foot, and in the lead valleys of the gables where they stand dry.
      { const ferns = [K.fern_a, K.fern_b].filter(Boolean), rr = ctx.rng(977);
        const grow = (P, k = 1) => { if (!ferns.length) return; _m.makeRotationY(rr() * 6.283).scale(_s.set(k, k * (0.85 + 0.3 * rr()), k)).setPosition(P.x, P.y, P.z); layMain(ferns[Math.floor(rr() * ferns.length)], _m, tc.setRGB(0.8 + 0.25 * rr(), 0.85 + 0.2 * rr(), 0.8 + 0.2 * rr()), [0, 0, rr(), 0.05]); };
        for (const R of roofs) for (const st of (R.stacks || [])) {
          if (!st.clear || !['stack_2', 'stack_4', 'stack_6'].includes(st.kr.model)) continue;
          const end = (rr() < 0.5 ? -1 : 1) * (stackLen[st.pots] / 2 + 0.07), lx = st.kr.lx + end, lz = R.side * (0.1 + 0.1 * rr());
          grow(new THREE.Vector3().setFromMatrixPosition(slopeAt(R, lx, lz, pantLift(R))), 0.85 + 0.4 * rr());
        }
        for (const st of town.stacks) if (st.cupola) { const c = Math.cos(st.yaw), sn = Math.sin(st.yaw); grow(new THREE.Vector3(st.x + 0.52 * c + 0.1 * sn, 0.11, st.z - 0.52 * sn + 0.1 * c), 0.8); }
        for (const G of gables) for (const sg of [-1, 1]) {
          for (let back = WLEN - 0.2; back > 0.3; back -= 0.12) {      // down the valley from the main ridge: the first place that stands a hand above the water
            let ax = EAVE, ok = true; for (let it = 0; it < 6 && ok; it++) { _p.set(sg * ax, 0, -back).applyMatrix4(G.F); const my = mainRoofY(_p.x, _p.z); if (my === -Infinity) ok = false; else ax = (G.apex - my) / TANW; }
            if (!ok || ax > EAVE - 0.05 || ax < 0.1) continue;
            const y = G.apex - TANW * ax; if (y < 0.1 || y > 0.42) continue;
            if (rr() < 0.75) grow(new THREE.Vector3(sg * ax, y + 0.03, -back).applyMatrix4(G.F), 0.75 + 0.35 * rr());
            break;
          }
        } }
      // A jackdaw's nest left in a pot of the stack at s 98 (right bank): twigs across the mouth. No bird.
      { const p = pots.find((q) => q.stack.kr.model === 'stack_6' && q.name === 'mouth2');
        if (p && K.pot_nest) { _m.makeRotationY(0.9).setPosition(p.x, p.y - 0.01, p.z); layThin(K.pot_nest, _m, null, [0, 0, 0.44, 0]); shared.kitRoofNest = { x: p.x, y: p.y, z: p.z }; } }
    }
  }
  // the layout's own pane for the skylight (a loose quad in the corner between two houses) is not drawn: the skylight above has its own light
  if (skyW && shared.windows && shared.windows.isInstancedMesh && want('small')) {
    const w = shared.windows, M4 = new THREE.Matrix4(), q = new THREE.Vector3(); let hit = 0;
    for (let i = 0; i < w.count; i++) { w.getMatrixAt(i, M4); q.setFromMatrixPosition(M4); if (q.distanceToSquared(_p.set(skyW.x, skyW.y, skyW.z)) < 0.01) { M4.makeScale(0, 0, 0).setPosition(q); w.setMatrixAt(i, M4); hit++; } }
    if (hit) w.instanceMatrix.needsUpdate = true; else console.error('INVALID_ note kit_roofs: the layout pane of the skylight (s 90) was not found among the windows: it may show as a loose lit quad');
  }

  // ---------------------------------------------------------------------------------------------- the weed
  // Long weed rises like smoke from the pots of the deeper stacks (three to five metres of it where the water is deep
  // enough: weed never leaves the water); short weed streams from the mouths of the shallow pots, from the eaves and
  // gutters of the roofs awash and from the eaves of the houses under the keel. All of it is the ribbons family's
  // (docs/life/ribbons.md): it never stretches, a slow wave travels up it, the hull parts it and the wake sways it.
  // It lives in the town's one slow current, which runs down the street (shared.current: the cast's cloth may take it).
  let weed = null;
  if (want('weed')) {
    const rr = ctx.rng(431), a0 = town.along(90);
    const current = shared.current || (shared.current = makeWind(ctx, { direction: [Math.cos(a0) - 0.22 * Math.sin(a0), -Math.sin(a0) - 0.22 * Math.cos(a0)], speed: 0.45, breeze: 0.8, gustiness: 0.4 }));
    const wd = current.direction, dyes = ['#2c6258', '#35705f', '#2a5a5c', '#3d7862', '#31665a'], tips = ['#4AA391', '#58a888', '#3f8f76', '#6aa884'];
    const pick = (list) => list[Math.floor(rr() * list.length)];
    const smoke = [], fringe = [];
    // (a tuft is THREADS, several from one root, fine and dark, each its own length: a pot under the gunwale wore one
    // pale ribbon a hand broad, a paper leaf stuck in its mouth)
    const tuft = (x, y, z, n, lo, hi, up = 0.12, spread = 0.08) => { for (let i = 0; i < n; i++) { const a = (rr() - 0.5) * 1.1, c = Math.cos(a), sn = Math.sin(a);
      fringe.push({ at: [x + (rr() - 0.5) * spread, y - 0.02 * rr(), z + (rr() - 0.5) * spread], length: (lo + (hi - lo) * rr()) * (i % 2 ? 0.55 + 0.35 * rr() : 1), width: 0.012 + 0.02 * rr(), color: pick(jade0), tip: pick(pale0), direction: [wd.x * c - wd.y * sn, up + 0.3 * rr(), wd.x * sn + wd.y * c] }); } };
    const jade0 = ['#1f4a3c', '#27584a', '#1c4440', '#2e6350'], pale0 = ['#3f8f76', '#4a9a7c', '#357a66'];
    for (const p of pots) {
      if (p.clear) continue;
      const depth = -p.y;
      if (depth >= 1.9) {
        // Deep enough to SMOKE. A plume, not three blades of grass: nine ribbons from the one mouth, gathered thin
        // where they leave it and broadest in their middle; three long and broad that reach nearly to the surface, three
        // of middling length, three fine short ones; all leaning down the current, the longer the more, and fanning
        // apart as they rise, so the plume is narrow at the pot and wide above it, dark at its root and pale at its end.
        for (let i = 0; i < 9; i++) { const a = rr() * 6.283, r0 = 0.015 + 0.05 * rr(), cls = i % 3;
          const full = Math.min(3 + 2 * rr(), depth - 0.3 - 0.3 * rr()), len = full * (cls === 0 ? 1 : cls === 1 ? 0.55 + 0.25 * rr() : 0.25 + 0.2 * rr());
          const lean = (cls === 0 ? 0.34 : cls === 1 ? 0.24 : 0.14) + 0.12 * rr(), fan = cls === 0 ? 0.3 : 0.2;
          smoke.push({ at: [p.x + Math.cos(a) * r0, p.y - 0.04, p.z + Math.sin(a) * r0], length: len, width: cls === 0 ? 0.11 + 0.08 * rr() : cls === 1 ? 0.06 + 0.05 * rr() : 0.03 + 0.025 * rr(),
            color: pick(cls === 2 ? jade0 : dyes), tip: pick(tips), direction: [wd.x * lean + (rr() - 0.5) * fan, 1, wd.y * lean + (rr() - 0.5) * fan] }); }
      } else if (depth > 0.18) tuft(p.x, p.y - 0.02, p.z, 5, Math.min(0.22, depth), Math.min(0.7, 0.2 + depth), 0.05, 0.1);
    }
    for (const R of roofs) {                                       // the eaves and gutters of the roofs awash
      const n = Math.round(R.len * 0.55);
      for (let i = 0; i < n; i++) { const lx = R.x0 + PW + rr() * (R.len - 2 * PW), y = R.h.eaves + sag(R, lx, 0) + (R.kind === 'pantile' ? -0.02 : 0.02); if (y > -0.3) continue;
        _p.set(lx, y, R.side * (R.half + (R.kind === 'pantile' ? 0.1 : 0.02))).applyMatrix4(R.F); tuft(_p.x, _p.y, _p.z, 3, 0.3, Math.min(0.95, 0.35 - y * 0.5)); }
    }
    // (the fringes on the eaves of the houses under the keel are the street's: kit_street.js)
    // The thread of weed at the waterline, grown: short fronds rooted a hand under the surface on whatever stands in the
    // water, lying downstream along it. They never leave the water; the hull parts them and a wake sets them working,
    // so the line where the town goes under is the liveliest line in the picture. `frond`: one at a place, streaming
    // with the current but never into the thing it grows on (out: the way that thing's face looks, level).
    // (Fine and dark: a weed is a thread, two or three from one root, each its own length. The first fronds were
    // single ribbons a hand broad in pale jade: under this water they came out luminous turquoise, tape laid on the wall.)
    const jade = ['#1f4a3c', '#27584a', '#1c4440', '#2e6350'], pale = ['#3f8f76', '#4a9a7c', '#357a66'];
    const frond = (x, y, z, ox, oz, lo = 0.28, hi = 0.75) => {
      const into = wd.x * ox + wd.y * oz;                           // (the current blows on to this face: the frond lies along it instead)
      let dx = wd.x - Math.min(0, into) * ox + 0.22 * ox, dz = wd.y - Math.min(0, into) * oz + 0.22 * oz;
      const k = 1 / (Math.hypot(dx, dz) || 1); dx *= k; dz *= k;
      const n = 2 + (rr() < 0.4 ? 1 : 0);
      for (let i = 0; i < n; i++) { const a = (rr() - 0.5) * 0.7, c = Math.cos(a), sn = Math.sin(a);
        fringe.push({ at: [x + ox * 0.015 + (rr() - 0.5) * 0.05, y - 0.03 * i, z + oz * 0.015 + (rr() - 0.5) * 0.05], length: (lo + (hi - lo) * rr() * rr()) * (i ? 0.55 + 0.4 * rr() : 1), width: 0.016 + 0.02 * rr(), color: pick(jade), tip: pick(pale), direction: [dx * c - dz * sn, 0.06 + 0.3 * rr(), dx * sn + dz * c] }); }
    };
    // round a thing that stands in the water: n fronds round a box (its middle, its turn, its half sizes)
    const round = (x, z, yaw, hx, hz, n) => { const c = Math.cos(yaw), sn = Math.sin(yaw);
      for (let i = 0; i < n; i++) { const f = Math.floor(rr() * 4), u = (rr() * 2 - 1), lx = f < 2 ? u * hx : (f === 2 ? -hx : hx), lz = f < 2 ? (f === 0 ? -hz : hz) : u * hz, nx = f < 2 ? 0 : (f === 2 ? -1 : 1), nz = f < 2 ? (f === 0 ? -1 : 1) : 0;
        frond(x + lx * c + lz * sn, -0.03 - 0.2 * rr(), z - lx * sn + lz * c, nx * c + nz * sn, -nx * sn + nz * c); } };
    for (const st of town.stacks) {                                // the three stacks that rise straight out of the water, and the dovecote's turret
      if (!st.clear || st.y0 > -2.5) continue;
      if (st.cupola) round(st.x, st.z, st.yaw, 0.93, 0.93, 9); else round(st.x, st.z, st.yaw + st.kr.flip, stackLen[st.pots] / 2, 0.3325, 8);
    }
    for (const w of weedRoots) frond(w.x, Math.min(w.y, -0.03), w.z, w.ox, w.oz, 0.25, 0.6);      // from under the driftwood and the shutter
    for (const G of gables) {                                      // the gables' walls, either side of the window
      const c = Math.cos(G.yaw), sn = Math.sin(G.yaw);
      for (let i = 0; i < 9; i++) { const lx = (rr() < 0.5 ? -1 : 1) * (0.7 + 2.05 * rr()); frond(G.x + lx * c, -0.03 - 0.22 * rr(), G.z - lx * sn, sn, c); }
    }
    weed = {
      smoke: smoke.length ? makeRibbons(ctx, { kind: 'smokeweed', items: smoke, wind: current, seed: 432, exact: true, taper: [0.2, 0.5, 0.12, 0.0], meander: 0.16 }) : null,
      fringe: fringe.length ? makeRibbons(ctx, { kind: 'weed', items: fringe, wind: current, seed: 433, wave: { root: 0.008, tip: 0.07, length: 0.6, hz: 0.42 }, segments: [1, 6] }) : null,      // (a thread a finger wide: one strip across and six along, 12 triangles where the family's weed has 32)
      items: { smoke, fringe }, current,
    };
    // The ribbons family dresses its ribbons in plain gouache; under this water a thing must wear the area's light (the
    // water's two families of colour, the lamplight of its street, and the water between, which swallows it with
    // distance), or it stands out pale and sharp against a town that dissolves. The family takes no `extend`, so the
    // area's extension is laid into the finished material here, at the same marks the material's maker uses.
    const dress = (r, lit) => {
      if (!r || !r.material) return;
      const m = r.material, ex = light.extendFor(lit);
      for (const h of ['vertexPars', 'vertexLocal', 'vertexWorld']) if (ex[h]) m.vertexShader = m.vertexShader.replace(`//@${h}`, `${ex[h]}\n    //@${h}`);
      for (const h of ['fragmentPars', 'albedo', 'light', 'fog', 'final']) if (ex[h]) m.fragmentShader = m.fragmentShader.replace(`//@${h}`, `${ex[h]}\n    //@${h}`);
      Object.assign(m.defines, ex.defines || {}, { TOWN_AFLOAT: '' }); Object.assign(m.uniforms, ex.uniforms || {});
      m.needsUpdate = true;
    };
    dress(weed.smoke, 0.5); dress(weed.fringe, 0.5);
    shared.kitRoofWeed = weed;
  }

  // ---------------------------------------------------------------------------------------------- into the realm
  const made = [];
  if (light.halos && roomHalos.length && Q.get('krhalo') !== '0') { const h = light.halos(roomHalos, { gain: +(Q.get('krhalo') ?? 0.38), push: 0.22 }); h.name = 'kr-room-halos'; ctx.add(h); shared.kitRoofHalos = h; }      // (&krhalo=<gain>; 0 = none, as it was)
  const put = (mesh, where) => { if (!mesh) return null; ctx.add(mesh); if (where !== 'both') ctx.only(mesh, where); made.push(mesh); return mesh; };
  // A frame is drawn three times: the scene without the water (the engine's own picture of what lies beneath, which also
  // tells paint from water by its depth), the mirror, and the picture. onlyPass(mesh, ...) draws a mesh in some of these
  // only: by the moment it is drawn (the engine's picture without the water has its own target; the mirror its own
  // camera) the draw is emptied or left whole. `passed`, below, keeps each mesh's true length in userData.
  const eng = ctx.engine;
  const onlyPass = (mesh, ...passes) => { if (!mesh) return mesh;
    const whole = () => { if (mesh.isInstancedMesh) mesh.count = mesh.userData.krCount ?? mesh.userData.krAll; else { const r = mesh.userData.krRange; if (r) mesh.geometry.setDrawRange(r[0], r[1]); } };
    mesh.onBeforeRender = (renderer, scene, camera) => {
      const pass = renderer.getRenderTarget() === eng.pre ? 'pre' : (camera === eng.camera ? 'main' : 'mirror');
      if (passes.includes(pass)) whole(); else if (mesh.isInstancedMesh) mesh.count = 0; else mesh.geometry.setDrawRange(0, 0); };
    mesh.onAfterRender = whole;
    return mesh; };
  put(tiles.pantile.mesh(mat, 'kr-pantiles'), 'direct'); onlyPass(put(tiles.pantile_dry.mesh(mat, 'kr-pantiles-dry'), 'direct'), 'main');
  put(tiles.pantile_deep.mesh(mat, 'kr-pantiles-deep'), 'direct'); put(tiles.pantile_far.mesh(mat, 'kr-pantiles-far'), 'direct');
  put(tiles.pantile_mirror.mesh(mat, 'kr-pantiles-mirror'), 'mirror'); onlyPass(put(tiles.pantile_pre.mesh(mat, 'kr-pantiles-pre'), 'both'), 'pre');
  put(tiles.slate.mesh(mat, 'kr-slates'), 'direct'); onlyPass(put(tiles.slate_dry.mesh(mat, 'kr-slates-dry'), 'direct'), 'main');
  put(tiles.slate_deep.mesh(mat, 'kr-slates-deep'), 'direct'); put(tiles.slate_mirror.mesh(mat, 'kr-slates-mirror'), 'mirror'); onlyPass(put(tiles.slate_pre.mesh(mat, 'kr-slates-pre'), 'both'), 'pre');
  put(above.mesh(mat, 'kr-above'), 'both'); put(thin.mesh(matThin, 'kr-above-thin'), 'both');
  { const m = put(under.mesh(mat, 'kr-under'), 'direct'); if (m) m.userData.krFar = 75; }      // (what lies under the water more than this far ahead is not drawn: the water between has swallowed it long before)
  onlyPass(put(aboveMain.mesh(mat, 'kr-above-main'), 'direct'), 'main'); onlyPass(put(aboveTwin.mesh(mat, 'kr-above-twin'), 'both'), 'mirror', 'pre');
  for (const m of made) if (!m.isInstancedMesh) m.userData.krRange = [0, m.geometry.index.count];
  shared.roofs = { roofs, gables, material: mat, uniforms: KRU, mainRoofY };
  const TAU = Math.PI * 2, hold = Q.has('krvane') ? +Q.get('krvane') * Math.PI / 180 : null;
  for (const vn of vanes) vn.u.set(vn.x, vn.z, 0, 0);
  if (Q.has('krlog')) console.error('INVALID_ note (kit_roofs, &krlog): ' + made.map((m) => `${m.name} ${m.isInstancedMesh ? m.count + ' x ' + m.geometry.index.count / 3 : m.geometry.index.count / 3} tris`).join('; ')
    + (weed ? `; weed: ${weed.items.smoke.length} long x 56, ${weed.items.fringe.length} short x 32 tris` : '') + `; pots ${pots.length}`
    );
  if (Q.has('krlog')) { const rows2 = town.stacks.filter((st) => st.kr && st.kr.deep && st.y1 > -4).map((st) => { const c = Math.cos(st.yaw + st.kr.flip), sn = Math.sin(st.yaw + st.kr.flip), hl = (stackLen[st.pots] || 0.9) / 2, hd = 0.33; let lo = Infinity, hi = -Infinity;
      for (const [u, w] of [[0, 0], [-hl, -hd], [hl, -hd], [-hl, hd], [hl, hd]]) { const y = roofUnder(st.x + u * c + w * sn, st.z - u * sn + w * c, st.y1 - 0.1); lo = Math.min(lo, y); hi = Math.max(hi, y); }
      return `s ${st.kr.s.toFixed(0)} d ${st.kr.d.toFixed(0)} ${st.kr.model} top ${st.y1.toFixed(2)} roof ${lo.toFixed(2)}..${hi.toFixed(2)}${st.kr.slid ? ' slid ' + st.kr.slid.toFixed(2) : ''}`; });
    for (let i = 0; i < rows2.length; i += 6) console.error('INVALID_ note (kit_roofs, &krlog) deep stacks (pot top; the houses\' roof under its foot): ' + rows2.slice(i, i + 6).join('; ')); }
  if (Q.has('krlog')) { const rows = Object.entries(tally).sort((a, b) => (b[1][1] + b[1][2]) - (a[1][1] + a[1][2])).map(([k, t]) => `${k} x${t[0]}: ${Math.round(t[1])} + ${Math.round(t[2])}`);
    for (let i = 0; i < rows.length; i += 5) console.error('INVALID_ note (kit_roofs, &krlog) pieces (copies: triangles above + under): ' + rows.slice(i, i + 5).join('; ')); }
  // ---------------------------------------------------------------------------------------------- what the rider has passed is not drawn
  // Every mesh of this kit runs the length of the street, so the engine cannot leave any of it out by its bounds. But
  // each keeps its pieces in the order of the street's far end first, and each piece knows how far along the route it
  // reaches: every frame the draw is shortened to the pieces the rider can still see. Looking down the route that is
  // everything not yet passed (a few metres behind the eye, more as the head turns: by the widest angle of the view);
  // looking back, everything. Over the square, with the street astern, nothing of the street is drawn at all, and
  // the mirror and the picture of the scene without the water are spared it too. (&krpassed=0: draw everything always)
  const culls = made.filter((m) => m.userData.krS), usePassed = Q.get('krpassed') !== '0', _dir = new THREE.Vector3(), _at = {};
  const upTo = (krS, sMin) => { let lo = 0, hi = krS.length; while (lo < hi) { const mid = (lo + hi) >> 1; if (krS[mid] > sMin) lo = mid + 1; else hi = mid; } return lo; };      // how many of a falling list are above sMin
  const passed = (c) => {
    const cam = c.engine && c.engine.camera; if (!cam || !usePassed) return;
    cam.getWorldDirection(_dir);
    const sNow = c.s || 0, pt = c.path.at(Math.min(c.path.length, Math.max(0, sNow)), _at), h = Math.hypot(_dir.x, _dir.z);
    const f = h > 0.25 ? (_dir.x * pt.tx + _dir.z * pt.tz) / h : 0;                                // 1 looking down the route .. -1 looking back (0 when looking nearly straight down)
    const phi = Math.acos(Math.min(1, Math.max(-1, f))) + 0.96;                                    // the angle of the view's rearmost edge off the route: half the field of view and a margin (55 degrees)
    const sMin = phi > 2.6 ? -1e9 : sNow - 5 - (phi > Math.PI / 2 ? 50 * Math.tan(phi - Math.PI / 2) : 0);
    for (const m of culls) { const k = upTo(m.userData.krS, sMin);
      if (m.isInstancedMesh) { m.userData.krCount = k; m.count = k; }
      else { const far = m.userData.krFar && f > 0.2 ? upTo(m.userData.krS, sNow + m.userData.krFar) : 0, a = far ? m.userData.krEnd[far - 1] : 0, b = k ? m.userData.krEnd[k - 1] : 0;
        m.userData.krRange = [a, Math.max(0, b - a)]; m.geometry.setDrawRange(a, Math.max(0, b - a)); }
      m.visible = k > 0; }
  };
  return {
    // the vane wanders 25 degrees either way over 17 s, in air that has no wind (&krvane=<degrees> holds it)
    update(dt, c) { for (const vn of vanes) vn.u.z = hold ?? (25 * Math.PI / 180) * (0.62 * Math.sin(c.time * TAU / 17 + vn.phase) + 0.38 * Math.sin(c.time * TAU / 27.5 + 2.1 + vn.phase)); passed(c); },
  };
}
