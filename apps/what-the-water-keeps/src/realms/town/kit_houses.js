// The town below: the town itself (stage 2, kit and close band: docs/build/town/2-kit-streets.md).
//   - the houses within sight of the boat's water, each built to its own measure (shells: source-art/models/town/
//     town_houses.py -> models/town/town_shell_a|b|c.glb, in the realm's own place) and dressed with instanced parts
//     (town_parts.py: window units in every opening, shutters, dormers, rooflights, ridge tiles, gutters, pipes, moss;
//     where each stands: models/town/town_parts.json);
//   - the windows: every window of the layout as a pane with a painted room behind it (art/town/windows_atlas.webp, 24
//     rooms), set at the back of its modelled reveal, sliding as the rider passes; curtains, blinds and glazing bars
//     drawn on the glass; lit only below the waterline; its light on its own sill and reveal.
// It builds BEFORE kit.js, and tells it which houses are real (shared.kitHouses), so that kit.js leaves their stand-ins out.
//
// The chain that makes the files (run again whenever plan.js or layout.js moves a place; docs/build/town/2-kit-streets.md):
//   node --import ./source-art/models/town/_three_hook.mjs source-art/models/town/layout_dump.mjs     -> layout.json, kit_data.js
//   python3 tools/blend.py source-art/models/town/town_parts.py                                          -> the parts
//   python3 tools/blend.py source-art/models/town/town_houses.py                                         -> shells, town_parts.json
//
// Developer switches (address):  &kh=shells,parts,windows  build only these   &khspill=0  no window light on walls and reveals
//                                &khpour=0  the roofs' dressing as instanced kinds again (to compare draw calls)
import * as THREE from 'three';
import { ensureLight } from './light.js';
import { bakeInstanced, routeKey, reach } from './kit_bake.js';
import { NEAR_HOUSES, WINDOW_COUNT, WINDOW_SUM, WINDOW_MODE, WINDOW_BACK, WINDOW_BACK_INDEX } from './kit_data.js';

const Q = new URLSearchParams(typeof location !== 'undefined' ? location.search : '');
const ONLY = (Q.get('kh') || '').split(',').filter(Boolean);
const want = (part) => !ONLY.length || ONLY.includes(part);

// what the windows burn with, by the layout's tone: amber and orange mostly; a few old rose, jade, pale gold
export const WINDOW_TONES = ['#FFA64D', '#F27A8C', '#5FD9B4', '#FFD79A'];
// rooms of the atlas (6 columns by 4 rows, counted along the rows from the top left) by the light they were painted in
const ROOMS = { warm: [0, 1, 2, 4, 5, 6, 7, 8, 10, 14, 15, 18, 20, 22, 23], rose: [3, 9, 11, 16], jade: [13, 17, 21], dim: [12, 19], shop: [6, 2, 10, 22, 5, 15] };

export async function build(ctx, plan, shared) {
  const { kit } = ctx;
  const light = ensureLight(ctx, plan, shared), town = light.town;
  const col = (c) => new THREE.Color(c);
  const spill = Q.get('khspill') === '0' ? 0 : 1;
  const under = 'float kUnder = 1.0 - smoothstep(-0.012, 0.012, vWPos.y);';      // the rule of the place: nothing is lit above the waterline
  const tones = WINDOW_TONES.map(col);
  // WEIGHT (taken over a fourth time: kit_bake.js, "within reach of the boat"): what lies under the water is drawn only within
  // REACH metres of the boat along the route (the windows' panes and their halos, which are lights, everywhere).
  const key = routeKey(ctx.path), near = reach(), REACH = Q.get('ksreach') === null ? 70 : +Q.get('ksreach');
  // Tone (the second look). Under this water only a thing's VALUE shows (the area's light repaints every hue: light.js, its
  // `albedo` hook), and what faces up takes the water's top-light as well. Paint two to six times its roof's value (ridge
  // tiles, lead, stone copings and sills, pale timber, cloth) stood out as mint lines round every roof: the street read as
  // a drawing in pale green, where the key painting's drowned town is deep and rich. Under the water, values above a knee
  // are drawn together (a power of how far above it they are); the knee is lower for what faces up.
  //   tone(name, knee, kneeUp, power, gain): gain multiplies the paint first (the roofs' dressing was painted for daylight).
  //   &khtone=dress:0.09:0.075:0.35:0.5,wall:0.17:0.08:0.4:1 tries other numbers by name; &khtone=0 leaves the paint as it is
  const tq = Object.fromEntries((Q.get('khtone') || '').split(',').filter((v) => v.includes(':')).map((v) => { const [n, ...r] = v.split(':'); return [n, r.map(Number)]; }));
  const tone = (name, knee = 0.16, up = 0.11, power = 0.42, gain = 1) => {
    if (Q.get('khtone') === '0') return null;
    const o = tq[name] || [];
    return {
      uniforms: { uKhToneK: { value: new THREE.Vector4(o[0] ?? knee, o[1] ?? up, o[2] ?? power, o[3] ?? gain) } },
      fragmentPars: 'uniform vec4 uKhToneK;',
      albedo: /* glsl */`if (vWPos.y < 0.0) { float ktw = smoothstep(0.0, 0.25, -vWPos.y); albedo *= mix(1.0, uKhToneK.w, ktw);
        float ktl = dot(albedo, vec3(0.3, 0.5, 0.2)), ktk = mix(uKhToneK.x, uKhToneK.y, smoothstep(0.25, 0.8, N.y));
        if (ktl > ktk) albedo *= mix(1.0, pow(ktl / ktk, uKhToneK.z - 1.0), ktw); }`,
    };
  };

  // the houses that are real now (kit.js leaves their stand-ins out)
  shared.kitHouses = new Set(NEAR_HOUSES.map((i) => town.houses[i]));
  const [tPlaster, tRoof, tSlate, tRooms] = await Promise.all([
    ctx.tex('art/town/surfaces_plaster.webp', { repeat: true }), ctx.tex('art/town/surfaces_roof.webp', { repeat: true }),
    ctx.tex('art/town/surfaces_slate.webp', { repeat: true }), ctx.tex('art/town/windows_atlas.webp', { anisotropy: 4 })]);

  // ---------------------------------------------------------------------------------------------- shells
  // wall: the area's light, hand-floated plaster laid on from three sides, and the light of the windows on the wall
  // round them (u of the UV: painted into the shell beside each lit opening; it sleeps with its street).
  const SPILL = {
    uniforms: { uKhSpill: { value: col('#FF9A4A').multiplyScalar(0.55 * spill) } },
    fragmentPars: 'uniform vec3 uKhSpill;',
    light: /* glsl */`{ float ks = vUv0.x;
      if (ks > 0.002) { ${under} vec4 kg = townGlow(vWPos.xz); float kl = townWake(townS(kg), vWPos.xz, -1.0, kg.a);
        glow += uKhSpill * (ks * (0.4 + 0.6 * ks) * smoothstep(0.25, 1.0, kl) * kl * kUnder) * (0.3 + 0.7 * albedo); } }`,
  };
  // WEATHER ON THE WALLS (the second look, taken over again). A front was one flat plaster with holes cut in it: card. A
  // wall's weather is drawn where it stands now, in the wall's own plane (no triangle, no texture, no draw call added):
  // old render in soft clouds of lighter and darker; streaks that have run down it for years; and the render FALLEN from
  // the brick in ragged patches, more on one house than on its neighbour: in each patch the brick itself, course by course
  // (a course of headers every sixth), each brick its own value, one in ten burnt dark, pale mortar between, and a line of
  // shadow under the render's broken edge. Under this water only value shows: the brick is darker than its render, so a
  // patch reads as a dark shape with a pale net in it; in a window's pool of lamplight it shows its own red. Far off the
  // bricks melt into their average and the patches stay, as shapes. &khwear=0 the plain plaster; &khwear=<how much has fallen, 0..1>
  const wq = Q.get('khwear');
  // (render falls from the brick only UNDER the water, on the house fronts: what the 'wall' slot holds above it is the
  // terrace's dressed stone, lucarnes and parapets, where a patch of brick was an orange square in the light from below;
  // wear(1) gives it above the water too, for rendered houses that stand in air: the upper town)
  const wear = (air = 0) => (wq === '0' ? null : {
    uniforms: { uKhWear: { value: new THREE.Vector2(wq === null ? 0.5 : +wq, air) } },
    fragmentPars: /* glsl */`uniform vec2 uKhWear;
      float kwH(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float kwN(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(kwH(i), kwH(i + vec2(1.0, 0.0)), f.x), mix(kwH(i + vec2(0.0, 1.0)), kwH(i + vec2(1.0, 1.0)), f.x), f.y); }`,
    albedo: /* glsl */`{ vec3 kwa = abs(N);
      if (kwa.y < 0.6) {
        float kwu = kwa.x > kwa.z ? vWPos.z : vWPos.x, kwv = vWPos.y; vec2 kwp = vec2(kwu, kwv);
        float kwpx = max(length(vec2(dFdx(kwu), dFdy(kwu))), length(vec2(dFdx(kwv), dFdy(kwv))));     // metres to a pixel, here
        float kwseed = kwH(vec2(floor(dot(vWPos.xz, N.xz) * 0.7), 3.0));                                // this wall's own number (its plane)
        albedo *= 0.84 + 0.30 * kwN(kwp * 0.45 + kwseed * 37.0);                                        // old render: clouds
        float kws = kwN(vec2(kwu * 2.6 + kwseed * 9.0, kwv * 0.22)) * (0.4 + 0.6 * kwN(vec2(kwu * 0.7, kwv * 0.9 + 4.0)));
        albedo *= 1.0 - 0.36 * smoothstep(0.22, 0.5, kws);                                              // streaks that have run down it
        float kwf = kwN(kwp * 0.8 + vec2(kwseed * 53.0, 7.0)) * 0.60 + kwN(kwp * 2.6 + 3.0) * 0.27 + kwN(kwp * 9.0) * 0.13;
        float kwt = 0.80 - 0.30 * uKhWear.x + (kwN(vec2(kwu * 0.13 + 5.0, kwseed * 17.0)) - 0.5) * 0.2;   // how much of THIS house's front has lost its render
        float kwhere = mix(uKhWear.y, 1.0, smoothstep(0.05, 0.4, -vWPos.y));
        float kwb = smoothstep(kwt, kwt + 0.012 + kwpx * 0.5, kwf) * kwhere;
        albedo *= 1.0 - 0.38 * smoothstep(kwt - 0.05, kwt, kwf) * (1.0 - kwb) * kwhere;                 // the render's broken edge: darker, damp, about to go
        if (kwb > 0.001) {
          float kbr = kwv / 0.075, kbc = floor(kbr), kbl = mod(kbc, 6.0) < 0.5 ? 0.1125 : 0.225;
          float kbx = kwu / kbl + 0.5 * mod(kbc, 2.0), kbf = fract(kbx), kbg = fract(kbr);
          float kbid = kwH(vec2(floor(kbx), kbc));
          float kbj = min(min(kbf, 1.0 - kbf) * kbl, min(kbg, 1.0 - kbg) * 0.075);
          float kbfade = 1.0 - smoothstep(0.012, 0.05, kwpx);
          vec3 kbrick = vec3(0.17, 0.072, 0.056) * mix(1.0, (0.66 + 0.68 * kbid) * (kbid > 0.9 ? 0.55 : 1.0), kbfade);
          kbrick = mix(kbrick, vec3(0.21, 0.19, 0.18), (1.0 - smoothstep(0.004, 0.009 + kwpx, kbj)) * kbfade * 0.85);      // mortar, paler than the brick
          kbrick *= 1.0 - 0.45 * (1.0 - smoothstep(0.0, 0.03, kwf - kwt));                              // the shadow of the render's thickness along its broken edge
          kbrick = mix(kbrick, albedo * (0.5 + 0.34 * kbid) + vec3(0.01, 0.0, 0.0), 0.8 * smoothstep(-0.4, -0.05, vWPos.y));      // (in air, at night, old brick is a darker step of its own wall, hardly red: red brick in the light from below was an orange square)
          albedo = mix(albedo, kbrick, kwb); } } }`,
  });
  const WEAR = wear(0);
  // roof: the painted tiles on the roof's own UVs (v + 100 marks a slate roof), tinted by the shell's own paint
  // SINGLE TILES AND SLATES (the second look, taken over). The courses are modelled, but a course was one board: the
  // painted tiles on it are soft, and under this water only value shows. Every tile and slate is now drawn where it lies,
  // registered to the modelled courses by the roof's own UVs (town_houses.py, roof_uv): a pantile is 0.22 m of its course
  // (nine to a repeat of the painting, whose own tiles they fall on), with its roll and its pan (the normal is turned, so
  // the water's top-light and its nets lie on the rolls), the side lap, the shadow of the course above under each roll;
  // a slate is cut to its own width (its joints wander, and break joint with the course below), lies at its own small
  // tilt, has now and then a corner gone at the lip. Each has its own value and its own warmth (under the water what is
  // warm goes violet and what is cool green-teal: a roof is both, as in the key painting); one in forty is newer, one in
  // thirty black with soot, one in ninety gone. Moss stands dark in the laps. Far off it all melts into its average.
  //   &khtile=0 the boards as they were; &khtile=<strength>
  const ROOF = {
    uniforms: { tKhRoofA: { value: tRoof }, tKhRoofB: { value: tSlate }, uKhRoofGain: { value: +(Q.get('khroof') || 2.2) }, uKhTile: { value: Q.get('khtile') === null ? 1 : +Q.get('khtile') } },
    fragmentPars: /* glsl */`uniform sampler2D tKhRoofA, tKhRoofB; uniform float uKhRoofGain, uKhTile;
      float krH(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float krN(float x, float y) { float i = floor(x), f = x - i; f = f * f * (3.0 - 2.0 * f); return mix(krH(vec2(i, y)), krH(vec2(i + 1.0, y)), f); }`,
    albedo: /* glsl */`{
      float krs = step(50.0, vUv0.y); vec2 kuv = vec2(vUv0.x, vUv0.y - 100.0 * krs);
      float kpx = max(length(dFdx(vWPos)), length(dFdy(vWPos)));                       // metres to a pixel, here
      float kfade = (1.0 - smoothstep(0.03, 0.1, kpx)) * uKhTile;
      vec3 kU = cross(vec3(0.0, 1.0, 0.0), N); float kUl = length(kU); kU /= max(kUl, 1e-3);      // along the course, level
      float ksg = sign(dot(dFdx(vWPos), kU) * dFdx(kuv.x) + dot(dFdy(vWPos), kU) * dFdy(kuv.x));   // (which way u runs along it)
      vec3 kV = cross(N, kU);                                                          // up or down the slope
      float ktone = 1.0, kwarm = 0.0, krf = 0.0, kri = 0.0, kmx = 0.0; vec3 kpaint, kbend = vec3(0.0);
      if (krs < 0.5) {
        float kc = kuv.x * 9.0 - 0.745, kr = (kuv.y - 0.1117) * 6.0, kci = floor(kc), kcf = kc - kci; kri = floor(kr); krf = kr - kri;
        float kid = krH(vec2(kci, kri)), kid2 = krH(vec2(kri, kci) + 3.7), kroll = cos((kcf - 0.36) * 6.2832);
        ktone = (0.76 + 0.48 * kid) * (kid2 > 0.975 ? 1.38 : kid2 < 0.033 ? 0.58 : 1.0);
        ktone *= 0.82 + 0.22 * kroll;                                                  // the pan holds the dirt, the roll is worn
        ktone *= 1.0 - 0.45 * (1.0 - smoothstep(0.0, 0.06 + kpx / 0.22, min(kcf, 1.0 - kcf)));      // the side lap
        ktone *= 1.0 - 0.34 * smoothstep(0.76, 1.0, krf) * smoothstep(-0.3, 0.7, kroll);            // the shadow of the course above, under each of its rolls
        if (kid2 > 0.989) ktone = 0.34;                                                // one gone: the dark of the laths
        else kbend = kU * (ksg * sin((kcf - 0.36) * 6.2832) * 0.55);
        kwarm = kid * 2.0 - 1.0; kmx = kuv.x * 9.0;
        kpaint = texture2D(tKhRoofA, vUv0).rgb;
      } else {
        float kr = (kuv.y - 0.00625) * 8.0; kri = floor(kr); krf = kr - kri;
        float kc = kuv.x * 6.0 + 0.5 * mod(kri, 2.0) + 0.37 * krH(vec2(kri, 5.0)), kc0 = floor(kc);
        float kb0 = kc0 + (krH(vec2(kc0, kri)) - 0.5) * 0.4, kb1 = kc0 + 1.0 + (krH(vec2(kc0 + 1.0, kri)) - 0.5) * 0.4;
        float kci = kc < kb0 ? kc0 - 1.0 : (kc < kb1 ? kc0 : kc0 + 1.0);
        float kdj = min(abs(kc - kb0), abs(kc - kb1)) * 0.2933;                       // metres to the nearest joint
        float kid = krH(vec2(kci, kri) + 11.0), kid2 = krH(vec2(kri, kci) + 3.7), kid3 = krH(vec2(kci * 1.7, kri * 2.3) + 29.0);
        ktone = (0.70 + 0.60 * kid) * (kid2 > 0.975 ? 1.34 : kid2 < 0.033 ? 0.55 : 1.0);
        ktone *= 1.0 - 0.55 * (1.0 - smoothstep(0.003, 0.011 + kpx, kdj));             // the joint
        ktone *= 1.0 - 0.32 * smoothstep(0.86, 1.0, krf);                              // the shadow under the lip of the course above
        // a corner gone at the lip, one slate in eight, on one of its sides (on every fifth slate and both sides they read as fish scales)
        float kdl = kci == kc0 ? kc - kb0 : (kci > kc0 ? kc - kb1 : 9.0), kdr = kci == kc0 ? kb1 - kc : (kci < kc0 ? kb0 - kc : 9.0);
        if (kid3 > 0.875) ktone *= 1.0 - 0.5 * (1.0 - smoothstep(0.0, 0.012, krf * 0.22 + (fract(kid3 * 37.0) < 0.5 ? kdl : kdr) * 0.2933 - 0.03 - 0.5 * (kid3 - 0.875)));
        if (kid2 > 0.989) ktone = 0.34;
        else kbend = kU * (ksg * (kid - 0.5) * 0.16) + kV * ((kid3 - 0.5) * 0.10);
        kwarm = kid3 * 2.0 - 1.0; kmx = kuv.x * 6.0;
        kpaint = mix(texture2D(tKhRoofB, vUv0).rgb, texture2D(tKhRoofB, vUv0, 2.5).rgb, uKhTile);      // (the painting's own slates would break joint with these: it is kept as cloud)
      }
      // moss in the laps: dark and cool, in ragged runs along some courses, more of it low on the slope
      float kms = smoothstep(0.52, 0.74, krN(kmx * 0.21 + kri * 7.3, kri)) * smoothstep(0.55, 0.85, krN(kmx * 1.9, kri + 40.0) * 0.5 + 0.5 * krf) * smoothstep(0.62, 0.9, krf);
      albedo *= kpaint * mix(1.3, uKhRoofGain, smoothstep(0.0, 0.3, -vWPos.y));       // (the painted tiles are laid on more strongly under the water, where a roof would else lie at the floor of the water's own colour; above it, the terrace's slates, they are the plum of the night)
      albedo *= mix(1.0, ktone, kfade);
      albedo *= mix(vec3(1.0), vec3(1.0) + kwarm * vec3(0.13, -0.03, -0.12), kfade);
      albedo = mix(albedo, albedo * vec3(0.42, 0.70, 0.46), kms * kfade * 0.85);
      if (kUl > 0.05) N = normalize(N + kbend * kfade);
    }`,
  };
  // DRESSED STONE ABOVE THE WATER (taken over a fourth time): the terrace's lucarnes, cornice and parapets are passed at arm's
  // length (postcard 13), and their stone was plain board, pink in the bow lantern's light. As the roofs' kit does for its
  // own dressed stone (kit_roofs.js, so that the gable's surround and the terrace's lucarnes are one stone): the weather has
  // it in blotches; the rain has run down what stands upright; lichen sits on what looks up, small, crisp and pale; a
  // mason's drove has left fine furrows, for the eye that nearly touches it; and what is cool in itself (stone, lead, grey
  // timber: not the stacks' brick) keeps a lilac cast under the amber lantern and the coral light from below (the
  // director: "lilac stone, warmed where the kept lamp reaches"). Above the water only. &khdress=0 the plain stone;
  // &khcool=<0..1> how much of the cast.
  const DRESS = Q.get('khdress') === '0' ? null : {
    uniforms: { uKhCool: { value: Q.get('khcool') === null ? 0.5 : +Q.get('khcool') } },
    fragmentPars: /* glsl */`uniform float uKhCool; float gKhCool;
      float kdH(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
      float kdN(vec3 p) { vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(mix(kdH(i), kdH(i + vec3(1.0, 0.0, 0.0)), f.x), mix(kdH(i + vec3(0.0, 1.0, 0.0)), kdH(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
                   mix(mix(kdH(i + vec3(0.0, 0.0, 1.0)), kdH(i + vec3(1.0, 0.0, 1.0)), f.x), mix(kdH(i + vec3(0.0, 1.0, 1.0)), kdH(i + vec3(1.0, 1.0, 1.0)), f.x), f.y), f.z); }`,
    albedo: /* glsl */`gKhCool = 0.0;
      if (vWPos.y > -0.05) { float kdd = length(vWPos - uCameraPos), kmx = max(max(vColor.r, vColor.g), vColor.b);
        gKhCool = 1.0 - smoothstep(-0.03, 0.10, (vColor.r - vColor.b) / max(kmx, 1e-3));
        float kb = kdN(vWPos * 2.3 + 2.0);
        albedo *= 0.80 + 0.36 * kb;                                                    // the weather, in blotches
        if (abs(N.y) < 0.5) { vec3 ka = abs(N); float ku = ka.x > ka.z ? vWPos.z : vWPos.x;      // the rain's dark runs down what stands upright
          float ks = kdN(vec3(ku * 5.0, vWPos.y * 0.45, 3.0)) * (0.4 + 0.6 * kdN(vec3(ku * 1.3, vWPos.y * 1.1 + 4.0, 9.0)));
          albedo *= 1.0 - 0.32 * smoothstep(0.22, 0.5, ks); }
        float klic = smoothstep(0.640, 0.665, kdN(vWPos * 41.0 + 9.0) * 0.36 + kdN(vWPos * 14.0 + 4.0) * 0.40 + kb * 0.28) * step(0.06, N.y) * (1.0 - smoothstep(4.0, 12.0, kdd));
        albedo *= 1.0 + 0.34 * klic;                                                   // lichen: rosettes a thumb to a hand across, a step paler than their stone
        float kt = (1.0 - smoothstep(1.2, 3.4, kdd)) * gKhCool;
        if (kt > 0.0) { vec3 kau = abs(N.y) > 0.7 ? vec3(1.0, 0.0, 0.0) : normalize(cross(vec3(0.0, 1.0, 0.0), N)), kav = cross(N, kau);
          albedo *= 1.0 - kt * 0.12 * smoothstep(-0.2, 0.9, sin((dot(vWPos, kau) * 0.72 + dot(vWPos, kav)) * 330.0 + 3.4 * kdN(vWPos * 6.0))); } }`,
    light: 'if (vWPos.y > -0.03 && gKhCool > 0.0) { float kl2 = dot(c, vec3(0.3, 0.5, 0.2)); c = mix(c, kl2 * vec3(1.0, 0.90, 1.16), uKhCool * gKhCool); }',
  };
  shared.khKit = { SPILL, ROOF, WEAR, wear, tPlaster, tones, under, tone, DRESS };                 // for the street's module (kit_street.js): the same paint on its stone
  if (want('shells')) {
    // (three files, because a model file may not pass 2 MB; poured into one mesh of walls and one of roofs: two draw calls)
    const shells = [];
    for (const k of ['a', 'b', 'c']) shells.push(await kit.models(`models/town/town_shell_${k}.glb`, [{ position: [0, 0, 0] }], { materials: {
      wall: { map: tPlaster, triplanar: 3.4, brush: 0.9, extend: [WEAR, tone('wall', 0.12, 0.045, 0.3), light.extendFor(0.5), SPILL].filter(Boolean) },
      roof: { brush: 0.55, extend: [ROOF, tone('roof', 0.13, 0.10, 0.42), light.extendFor(0.24)] },
    } }));
    for (const mesh of bakeInstanced(ctx, shells, { name: 'town-shells' })) ctx.only(mesh, 'direct');      // wholly under the water: not in the mirror. (Always drawn whole: walls and roofs are what HIDES the lit windows of the houses behind them; with the far shells left out, windows that no eye could see burnt through)
    // the uphill terrace above its wall head (mansard_1 .. _5: town_terrace.py): cornice, nine lucarnes whose sashes the
    // waterline cuts at the meeting rail, the slate mansard, parapets and stacks. It crosses the surface: the mirror has it.
    await kit.model('models/town/town_terrace.glb', { position: [0, 0, 0], materials: {
      wall: { map: tPlaster, triplanar: 2.6, brush: 0.9, extend: [WEAR, tone('wall', 0.12, 0.045, 0.3), light.extendFor(0.5), SPILL, DRESS].filter(Boolean) },
      roof: { brush: 0.55, extend: [ROOF, tone('roof', 0.13, 0.10, 0.42), light.extendFor(0.3)] },
    } });
  }

  // ---------------------------------------------------------------------------------------------- the far houses, the upper town
  // back_house_1 .. _4 (the lower town beyond sight of the boat's water: 84 placed): four roofs modelled one metre each
  // way and a wall likewise (town_far.py), each copy scaled to its house, so that its slopes are the planes the layout
  // lays its rooflights in; tinted by its house. Their windows are painted frames (the windows below).
  // upper_house_1 .. _4 (40 placed on the hill, above the waterline): whole dark houses, scaled to their records.
  if (want('far')) {
    const rnd = ctx.rng(5150), far = town.houses.filter((h) => !shared.kitHouses.has(h) && h.roof !== 'mansard');
    const plaster = plan.local.plaster.map(col), tmp = new THREE.Color(), hex = (c) => '#' + c.getHexString();
    const vary = (c, v) => hex(tmp.copy(c).multiplyScalar(1 + (rnd() - 0.5) * v));
    await kit.models('models/town/back_wall.glb', far.map((h) => ({ position: [h.x, h.floor - 0.5, h.z], rotation: [0, h.yaw, 0], scale: [h.w, h.eaves - h.floor + 0.5, h.dep], tint: vary(plaster[h.tone], 0.24) })),
      { map: tPlaster, triplanar: 3.4, brush: 0.9, extend: [WEAR, light.extendFor(0.5)].filter(Boolean) }).then((m) => ctx.only(m.group, 'direct'));
    // the roof: its UVs are 0..1 along the eaves and up the slope; each copy lays the painted tiles to its own size
    const FAR_ROOF = {
      uniforms: ROOF.uniforms, fragmentPars: ROOF.fragmentPars,
      vertexLocal: /* glsl */`
        #ifdef USE_INSTANCING
          if (uv.y < 5.0) vUv0 = vec2(uv.x * length(instanceMatrix[0].xyz) / 1.98, uv.y * length(vec2(length(instanceMatrix[2].xyz) * 0.5, length(instanceMatrix[1].xyz))) / 1.80);
        #endif`,
      albedo: 'vec3 kra = texture2D(tKhRoofA, vUv0).rgb; albedo *= mix(vec3(1.0), kra * uKhRoofGain, step(vUv0.y, 5.0));',
    };
    const roofs = [];
    for (let k = 1; k <= 4; k++) {
      const set = far.filter((h) => (h.model.startsWith('back_house_') ? +h.model.slice(-1) : 1 + (Math.round(h.s * 3) % 4)) === k);
      if (!set.length) continue;
      roofs.push(await kit.models(`models/town/back_roof_${k}.glb`, set.map((h) => ({ position: [h.x, h.eaves, h.z], rotation: [0, h.yaw + (rnd() < 0.5 ? Math.PI : 0), 0], scale: [h.w + 0.5, h.ridge - h.eaves, h.dep + 0.7],
        tint: vary(h.roofTone ? col('#9d98d6') : col('#f6eef0'), 0.2) })), { brush: 0.55, extend: [FAR_ROOF, light.extendFor(0.24)] }));
    }
    // (the four kinds are poured into one still mesh: one draw call; each copy's tiles are laid to its own size as the instances' were)
    for (const mesh of bakeInstanced(ctx, roofs, { name: 'town-far-roofs', uv: (a, b, sx, sy, sz) => (b < 5 ? [a * sx / 1.98, b * Math.hypot(sz * 0.5, sy) / 1.80] : [a, b]) })) ctx.only(mesh, 'direct');
    for (const h of far) shared.kitHouses.add(h);
    // the upper town: above the water, so the mirror has it too
    const up = town.upper, tints = ['#ffffff', '#f0e6ee', '#e4e2f4', '#f4ead8', '#d8d2e2'];
    const ups = [];
    for (let k = 1; k <= 4; k++) {
      const set = up.filter((h) => +h.model.slice(-1) === k);
      if (!set.length) continue;
      ups.push(await kit.models(`models/town/upper_house_${k}.glb`, set.map((h) => ({ position: [h.x, h.floor, h.z], rotation: [0, h.yaw + Math.PI, 0], scale: [h.w / 10, (h.ridge - h.floor) / 10.6, h.dep / 7.5], tint: tints[Math.floor(rnd() * tints.length)] })),
        { map: tPlaster, triplanar: 4.2, brush: 0.9, extend: [wear(1), light.extendFor(0.4)].filter(Boolean) }));      // (their render is weathered like the lower town's, in air: the vista's stone, poured into this mesh by kit_street.js, wears the same damp)
    }
    bakeInstanced(ctx, ups, { name: 'town-upper' });
    shared.kitUpper = true;
  }

  // ---------------------------------------------------------------------------------------------- the dressing
  // Every kind is one instanced mesh. A copy carries its tint (taken where the part's UV says so: v = 1 the copy's own
  // colour, 0 the part's paint) and the window that lights it (u = how much of that light falls on the spot).
  const PART = {
    uniforms: { uKhTone: { value: tones }, uKhPartLight: { value: 0.9 * spill } },
    vertexPars: 'attribute vec3 aKhTint; attribute vec4 aKhWin; varying vec3 vKhTint; varying vec4 vKhWin;',
    vertexLocal: 'vKhTint = aKhTint; vKhWin = aKhWin;',
    fragmentPars: 'varying vec3 vKhTint; varying vec4 vKhWin; uniform vec3 uKhTone[4]; uniform float uKhPartLight;',
    albedo: 'albedo *= mix(vec3(1.0), vKhTint, clamp(vUv0.y, 0.0, 1.0));',
    light: /* glsl */`{ float ks = vUv0.x;
      if (vKhWin.x > -0.5 && ks > 0.002) { ${under} float kl = townWake(vKhWin.w, vWPos.xz, vKhWin.y, vKhWin.z);
        int ki = int(vKhWin.x + 0.5); vec3 kt = ki == 0 ? uKhTone[0] : ki == 1 ? uKhTone[1] : ki == 2 ? uKhTone[2] : uKhTone[3];
        glow += kt * (ks * uKhPartLight * smoothstep(0.25, 1.0, kl) * kl * kUnder) * (0.25 + 0.75 * albedo); } }`,
  };
  const LIT = { win_a: 0.5, win_b: 0.5, win_c: 0.5, win_d: 0.5, shutter_l: 0.55, shutter_r: 0.55, dormer_a: 0.3, dormer_b: 0.3, dormer_c: 0.3, dormer_first: 0.3, skylight: 0.3, ridge_run: 0.24, gutter_run: 0.3, downpipe: 0.45, moss: 0.3 };
  // The parts that dress the ROOFS (and the rainwater pipes) stand still and are few of each kind: they are poured into ONE
  // mesh (two draw calls a frame instead of eighteen), each copy's tint laid into its points and its window carried on them.
  // The parts in the walls' openings (window units, shutters: 2,100 copies of six kinds) stay instanced: poured, they
  // would be ten megabytes of points.
  const POURED = new Set(['dormer_a', 'dormer_b', 'dormer_c', 'dormer_first', 'skylight', 'ridge_run', 'gutter_run', 'downpipe', 'moss']);
  const PARTB = { uniforms: PART.uniforms, vertexPars: 'attribute vec4 aKhWin; varying vec4 vKhWin;', vertexLocal: 'vKhWin = aKhWin;',
    fragmentPars: 'varying vec4 vKhWin; uniform vec3 uKhTone[4]; uniform float uKhPartLight;', light: PART.light };
  const pour = (list, name, lit) => {
    let nv = 0, ni = 0;
    for (const { m } of list) for (const mesh of m.meshes) { const g = mesh.geometry; nv += g.attributes.position.count * mesh.count; ni += (g.index ? g.index.count : g.attributes.position.count) * mesh.count; }
    if (!nv) return null;
    const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), colr = new Float32Array(nv * 3), uvs = new Float32Array(nv * 2), wn = new Float32Array(nv * 4), idx = new Uint32Array(ni);
    const M = new THREE.Matrix4(), N = new THREE.Matrix3(), v = new THREE.Vector3(); let vo = 0, io = 0;
    for (const { m, tint, win } of list) for (const mesh of m.meshes) {
      const g = mesh.geometry, P = g.attributes.position, Nn = g.attributes.normal, C = g.attributes.color, U = g.attributes.uv, I = g.index, vc = P.count;
      for (let k = 0; k < mesh.count; k++) {
        mesh.getMatrixAt(k, M); N.getNormalMatrix(M);
        const tr = tint[k * 3], tg = tint[k * 3 + 1], tb = tint[k * 3 + 2];
        for (let i = 0; i < vc; i++) {
          const o = (vo + i) * 3, tv = U ? Math.min(1, Math.max(0, U.getY(i))) : 0;
          v.fromBufferAttribute(P, i).applyMatrix4(M); pos[o] = v.x; pos[o + 1] = v.y; pos[o + 2] = v.z;
          v.fromBufferAttribute(Nn, i).applyMatrix3(N).normalize(); nor[o] = v.x; nor[o + 1] = v.y; nor[o + 2] = v.z;
          colr[o] = (C ? C.getX(i) : 1) * (1 + (tr - 1) * tv); colr[o + 1] = (C ? C.getY(i) : 1) * (1 + (tg - 1) * tv); colr[o + 2] = (C ? C.getZ(i) : 1) * (1 + (tb - 1) * tv);
          uvs[(vo + i) * 2] = U ? U.getX(i) : 0;
          wn[(vo + i) * 4] = win[k * 4]; wn[(vo + i) * 4 + 1] = win[k * 4 + 1]; wn[(vo + i) * 4 + 2] = win[k * 4 + 2]; wn[(vo + i) * 4 + 3] = win[k * 4 + 3];
        }
        if (I) for (let i = 0; i < I.count; i++) idx[io + i] = I.getX(i) + vo; else for (let i = 0; i < vc; i++) idx[io + i] = vo + i;
        vo += vc; io += I ? I.count : vc;
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); geo.setAttribute('color', new THREE.BufferAttribute(colr, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2)); geo.setAttribute('aKhWin', new THREE.BufferAttribute(wn, 4)); geo.setIndex(new THREE.BufferAttribute(idx, 1)); geo.computeBoundingSphere();
    const mesh = new THREE.Mesh(geo, kit.gouache({ color: '#ffffff', vertexColors: true, brush: 0.6, extend: [PARTB, tone('dress', 0.06, 0.045, 0.3, 0.5), light.extendFor(lit)] }));
    mesh.name = name; mesh.frustumCulled = false; mesh.matrixAutoUpdate = false; ctx.add(mesh); ctx.only(mesh, 'direct'); near.sorted(mesh, key);
    for (const { m } of list) { if (m.group.parent) m.group.parent.remove(m.group); for (const im of m.meshes) im.material.dispose(); }
    return mesh;
  };
  const W = town.windows;
  if (want('parts')) {
    const res = await fetch('assets/models/town/town_parts.json');
    const PJ = res.ok ? await res.json() : null;
    if (!PJ) console.error('INVALID_MODEL assets/models/town/town_parts.json is missing: run source-art/models/town/town_houses.py');
    const st = PJ ? PJ.stride : 13, c = new THREE.Color(), still = [];
    for (const [kind, flat] of Object.entries(PJ ? PJ.parts : {})) {
      const n = flat.length / st, places = [], tint = new Float32Array(n * 3), win = new Float32Array(n * 4);
      for (let i = 0; i < n; i++) {
        const o = i * st;
        places.push({ position: [flat[o], flat[o + 1], flat[o + 2]], rotation: [flat[o + 3], flat[o + 4], flat[o + 5]], scale: [flat[o + 6], flat[o + 7], flat[o + 8]] });
        c.setRGB(flat[o + 9], flat[o + 10], flat[o + 11], THREE.SRGBColorSpace); tint.set([c.r, c.g, c.b], i * 3);
        const w = W[flat[o + 12]];
        win.set(w ? [w.tone, w.rnd, w.stay, w.s] : [-1, 0, 0, 0], i * 4);
      }
      const m = await kit.models(`models/town/${kind}.glb`, places, { brush: 0.6, extend: [PART, POURED.has(kind) ? tone('dress', 0.06, 0.045, 0.3, 0.5) : tone('trim', 0.12, 0.07, 0.35), light.extendFor(LIT[kind] ?? 0.4)] });
      if (POURED.has(kind) && Q.get('khpour') !== '0') { still.push({ m, tint, win }); continue; }
      for (const mesh of m.meshes) {
        mesh.geometry.setAttribute('aKhTint', new THREE.InstancedBufferAttribute(tint, 3));
        mesh.geometry.setAttribute('aKhWin', new THREE.InstancedBufferAttribute(win, 4));
        mesh.frustumCulled = false;
        near.instanced(mesh, places.map((pl) => key(pl.position[0], pl.position[2])));      // (window units and shutters: the copies within reach of the boat)
      }
      ctx.only(m.group, 'direct');
    }
    pour(still, 'town-roof-dressing', 0.3);
  }

  // ---------------------------------------------------------------------------------------------- windows
  // The multitude "windows": one instanced mesh of panes. kit_data.js (made with the shells) says, for every window of
  // the layout, how it is drawn and how far its pane stands behind the layout's place:
  //   0 a painted frame (far and upper houses: no modelled reveal; the pane draws a stone surround, a reveal that shows
  //     as sight slides, and the glass 0.14 m in)      1 behind a modelled reveal      2 a rooflight in its kerb
  //   3 a shop arch under the raised walk      4 a sash of the terrace      5 a dormer's front      6 a gable's attic window
  //   9 not drawn (it burns inside a party wall, or the layout laid it on top of another)
  // Behind each pane a room of the atlas stands half a metre in: it slides against the frame as the rider passes
  // (the page's "parallax offset"). Cloth is drawn on the glass (curtains, a blind), and the glazing bars, which melt
  // away with distance instead of crawling. The page's rule is kept here: lit only below the waterline, exactly.
  if (want('windows')) {
    let ok = W.length === WINDOW_COUNT;
    if (ok) { let sum = 0; for (const w of W) sum = (((sum + Math.round(w.x * 7 + w.y * 13 + w.z * 17)) % 1000003) + 1000003) % 1000003; ok = sum === WINDOW_SUM; }
    if (!ok) console.error('INVALID_MODEL the town\'s layout has changed since source-art/models/town/layout_dump.mjs was run: the windows are drawn as painted frames and the house shells no longer fit. Run the chain in kit_houses.js\'s header again.');
    const rnd = ctx.rng(8086);
    // the terrace's sashes are drawn where their lucarnes were built (on the straight wall of each house), not on the route's curve
    const moved = new Map();
    await fetch('assets/models/town/town_terrace.json').then((r) => (r.ok ? r.json() : null)).then((j) => { if (j) for (const p of j.panes) moved.set(p[0], p); }).catch(() => {});
    const list = [];
    W.forEach((w, i) => {
      const mode = ok ? +WINDOW_MODE[i] : 0, at = ok && moved.get(i);
      if (mode === 9) return;
      list.push(at ? { w: { ...w, x: at[1], y: at[2], z: at[3], yaw: at[4] }, mode, back: 0 } : { w, mode, back: ok ? WINDOW_BACK[+WINDOW_BACK_INDEX[i]] : 0 });
    });
    const n = list.length, geo = new THREE.PlaneGeometry(1, 1), aWin = new Float32Array(n * 4), aPane = new Float32Array(n * 4);
    const M = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), sc = new THREE.Vector3(), out = new THREE.Vector3();
    const halo = [];
    const mesh = new THREE.InstancedMesh(geo, null, n);
    list.forEach(({ w, mode, back }, i) => {
      q.setFromEuler(e.set(w.pitch || 0, w.yaw, 0, 'YXZ')); out.set(0, 0, 1).applyQuaternion(q);
      p.set(w.x, w.y, w.z).addScaledVector(out, -back);
      const frame = mode === 0;
      M.compose(p, q, sc.set(w.w + (frame ? 0.26 : 0), w.h + (frame ? 0.30 : 0), 1)); mesh.setMatrixAt(i, M);
      const r = rnd(), pool = mode === 3 ? ROOMS.shop : w.tone === 2 ? ROOMS.jade : w.tone === 1 ? ROOMS.rose : r < 0.07 ? ROOMS.dim : ROOMS.warm;
      aWin.set([w.tone, w.rnd, w.stay, w.s], i * 4);
      aPane.set([mode, pool[Math.floor(rnd() * pool.length)], rnd(), back], i * 4);
      const top = Math.min(w.y + w.h / 2, 0), bottom = w.y - w.h / 2;                // its halo in the water: round the part of it that is under the surface
      if (top - bottom > 0.12) halo.push({ x: w.x, y: (top + bottom) / 2, z: w.z, size: 1.5 + 1.1 * Math.sqrt(w.w * (top - bottom)), tone: w.tone, s: w.s, rnd: w.rnd, stay: w.stay, out: [out.x, out.y, out.z] });
    });
    geo.setAttribute('aWin', new THREE.InstancedBufferAttribute(aWin, 4)); geo.setAttribute('aPane', new THREE.InstancedBufferAttribute(aPane, 4));
    const WIN = {
      uniforms: { tKhRooms: { value: tRooms }, uKhGain: { value: plan.gain.window }, uKhTone: { value: tones }, uKhGlass: { value: col('#261b38') }, uKhSpillK: { value: spill }, uKhNear: { value: +(Q.get('khnear') || 0.4) },
        uKhRoom: { value: new THREE.Vector2(...(Q.get('khroom') || '2.1,1.15').split(',').map(Number)) } },      // the room's contrast: the power its darks are drawn down by, how far its lights are drawn up (&khroom=1,1: the washes as they were)
      vertexPars: 'attribute vec4 aWin, aPane; varying vec4 vWin, vPane; varying vec2 vWinSize; varying vec3 vWT, vWB, vWN;',
      vertexLocal: /* glsl */`vWin = aWin; vPane = aPane;
        #ifdef USE_INSTANCING
          vWinSize = vec2(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz));
          vWT = normalize(mat3(modelMatrix) * instanceMatrix[0].xyz); vWB = normalize(mat3(modelMatrix) * instanceMatrix[1].xyz); vWN = normalize(mat3(modelMatrix) * instanceMatrix[2].xyz);
        #else
          vWinSize = vec2(1.0); vWT = vec3(1.0, 0.0, 0.0); vWB = vec3(0.0, 1.0, 0.0); vWN = vec3(0.0, 0.0, 1.0);
        #endif`,
      fragmentPars: 'varying vec4 vWin, vPane; varying vec2 vWinSize; varying vec3 vWT, vWB, vWN; uniform sampler2D tKhRooms; uniform float uKhGain, uKhSpillK, uKhNear; uniform vec3 uKhTone[4]; uniform vec3 uKhGlass; uniform vec2 uKhRoom;',
      light: /* glsl */`{
        float wmode = vPane.x, wseed = vPane.z;
        vec2 wm = vUv0 * vWinSize;
        float wpx = max(length(dFdx(wm)), length(dFdy(wm)));                         // metres to a pixel, here
        vec2 wbd = wmode < 0.5 ? vec2(0.13, 0.15) : vec2(0.0);                       // a painted frame keeps a border of stone round its opening
        vec2 wps = vWinSize - 2.0 * wbd, wpm = wm - wbd;
        float wopen = wmode < 0.5 ? step(0.0, wpm.x) * step(wpm.x, wps.x) * step(0.0, wpm.y) * step(wpm.y, wps.y) : 1.0;
        vec3 wV = normalize(vWPos - uCameraPos);
        float wvz = max(dot(-wV, normalize(vWN)), 0.22);
        vec2 wsl = vec2(dot(wV, normalize(vWT)), dot(wV, normalize(vWB))) / wvz;     // how far sight slides sideways for each metre it goes in
        vec2 wgu = wpm / wps; float wglass = wopen;
        if (wmode < 0.5) { wgu += wsl * 0.14 / wps; wglass *= step(0.0, wgu.x) * step(wgu.x, 1.0) * step(0.0, wgu.y) * step(wgu.y, 1.0); }
        float wreveal = wopen - wglass;
        float wr1 = fract(wseed * 7.13 + 0.31), wr2 = fract(wseed * 13.7 + 0.57), wr3 = fract(wseed * 29.3 + 0.11), wr4 = fract(wseed * 53.9 + 0.73);
        int wti = int(vWin.x + 0.5);
        vec3 wtone = wti == 0 ? uKhTone[0] : wti == 1 ? uKhTone[1] : wti == 2 ? uKhTone[2] : uKhTone[3];
        float wlv = townWake(vWin.w, vWPos.xz, vWin.y, vWin.z);
        ${under}
        // the room: a painted picture standing half a metre behind the glass
        vec2 wsh = wsl * 0.5 / wps; wsh = 0.17 * tanh(wsh / 0.17);
        vec2 wru = clamp((wgu - 0.5) * 0.66 + 0.5 + wsh, 0.015, 0.985);
        // (a sash of the terrace is lit in its lower half only, and that half showed the room's floor: a wash. The room's heart,
        // its lamp and what stands by it, is brought down into the half that burns)
        if (wmode > 3.5 && wmode < 4.5) wru.y = clamp(0.30 + wgu.y * 0.84 + wsh.y, 0.015, 0.985);
        float wc = floor(vPane.y + 0.5);
        vec2 wcell = vec2(mod(wc, 6.0), 3.0 - floor(wc / 6.0));
        vec3 wroom = texture2D(tKhRooms, (wcell + wru) / vec2(6.0, 4.0), 0.4).rgb;
        vec3 wavg = texture2D(tKhRooms, (wcell + 0.5) / vec2(6.0, 4.0), 6.0).rgb;
        float wl = dot(wroom, vec3(0.3, 0.5, 0.2)), wal = dot(wavg, vec3(0.3, 0.5, 0.2));
        // (the second look, taken over: a room was a wash of orange and pink. The paintings are rooms, but every part of one
        // was lit to burn: a chair in shadow came out as bright as the wall behind it. What is darker than the room's
        // average is drawn DOWN, so that the stair, the shelf, the bedstead stand as dark shapes against a lit wall, and what
        // is lighter, the lamp and its pool, is drawn up: a room seen from the street at night)
        float wkc = clamp(wl / max(wal, 0.03), 0.0, 3.0), wkd = wkc < 1.0 ? pow(wkc, uKhRoom.x) : 1.0 + (wkc - 1.0) * uKhRoom.y;
        wroom *= wkd / max(wkc, 1e-3); wl *= wkd / max(wkc, 1e-3);
        wroom = mix(wroom, wtone * (wl * 1.6 + 0.02), wti == 2 ? 0.4 : 0.5);         // pulled toward its tone: no room is violet in its shadows
        if (wti == 2) wroom *= 0.55;                                                 // (a room behind green glass is a dimmer room: at full strength the jade windows were cyan cards among the amber)
        wroom *= 0.8 + 0.5 * wr4;
        // cloth on the glass: a curtain drawn part way from one side or both, or a blind part way down; lit from inside
        float wcl = 0.0;
        if (wmode < 1.5 || wmode > 3.5) {
          // (taken over: curtain and blind were flat cream cards, the palest things in their windows. Cloth with a lamp behind
          // it is the room's own light a step down, in pleats: each fold a lit side and a dark one, its edge hanging in a
          // wavering line with the room a little darker beside it; a blind has its lath)
          vec3 wcloth = mix(vec3(0.95, 0.74, 0.52), vec3(0.84, 0.52, 0.56), wr2) * mix(wtone, vec3(1.0), 0.35) * (wal * 1.25 + 0.06);
          float wside = wr1 < 0.3 ? wgu.x : wr1 < 0.6 ? 1.0 - wgu.x : min(wgu.x, 1.0 - wgu.x);
          float wcw = wr3 < 0.5 ? mix(0.14, 0.36, wr2) + 0.022 * sin(wgu.y * wps.y * 5.0 + wseed * 17.0) : 0.0;
          float wcur = (1.0 - smoothstep(wcw - 0.012, wcw + 0.012, wside)) * step(0.001, wcw);
          float wfold = 0.40 + 0.60 * smoothstep(-0.75, 0.9, sin(wgu.x * wps.x * 38.0 + wseed * 31.0 + 0.7 * sin(wgu.y * wps.y * 3.1 + wseed * 7.0)));
          wroom *= 1.0 - 0.4 * step(0.001, wcw) * (1.0 - smoothstep(wcw, wcw + 0.09, wside));      // the room is darker beside its curtain
          wroom = mix(wroom, wcloth * wfold * (1.0 - 0.25 * (1.0 - wgu.y)), wcur); wcl = wcur * (0.7 + 0.3 * wfold);
          float wbl = wr3 > 0.82 ? mix(0.25, 0.6, wr1) : 0.0;
          float wbd2 = smoothstep(1.0 - wbl - 0.008, 1.0 - wbl + 0.008, wgu.y) * step(0.001, wbl);
          float wlath = 1.0 - 0.55 * (1.0 - smoothstep(0.0, 0.03 / max(wps.y, 0.3), abs(wgu.y - (1.0 - wbl) - 0.02 / max(wps.y, 0.3))));
          wroom = mix(wroom, wcloth * (0.62 + 0.2 * wgu.y) * wlath, wbd2); wcl = max(wcl, wbd2);
        }
        // glazing bars: a sash's upright and its rails; a shop front's mullions; none where the bars are modelled
        float wcols = 1.0, wrows = 1.0;
        if (wmode < 1.5 || (wmode > 4.5 && wmode < 6.5)) { wcols = wps.x > 0.62 ? 2.0 : 1.0; wrows = wps.y > 1.15 ? (wr4 > 0.5 ? 3.0 : 2.0) : wps.y > 0.7 ? 2.0 : 1.0; }
        else if (wmode > 2.5 && wmode < 3.5) { wcols = 3.0; wrows = 2.0; }
        vec2 wcm = wps / vec2(wcols, wrows), wg = abs(mod(wgu * wps + wcm * 0.5, wcm) - wcm * 0.5);
        float wsoft = max(wpx, 0.006);
        float wbars = wcols * wrows > 1.5 ? 1.0 - smoothstep(0.03 - wsoft, 0.03 + wsoft, min(wcols > 1.5 ? wg.x : 9.0, wrows > 1.5 ? wg.y : 9.0)) : 0.0;
        wbars *= 1.0 - smoothstep(0.035, 0.1, wpx);
        // asleep to flaring: dark glass, an ember (a warm light reddens as it dies), the room, the stroke's flare
        vec3 wember = vec3(0.80, 0.26, 0.30) * (wl * 1.3 + 0.05);
        vec3 wlit = mix(wember, wroom, smoothstep(0.3, 0.8, wlv)) * smoothstep(0.0, 0.3, wlv) * mix(0.5, 1.0, smoothstep(0.35, 1.0, wlv));
        wlit *= 1.0 + 1.3 * clamp(wlv - 1.0, 0.0, 0.5);
        wlit = mix(wlit, wlit * 0.05, wbars);
        vec3 wglassCol = uKhGlass * (0.5 + 0.4 * wgu.y);                              // dark glass under the water (a window asleep)
        // Above the line the glass holds the night (the page: it "must reflect the dark sky"): furrows of plum cloud that slide
        // against the frame as the rider passes, paler toward the top of the pane, and behind them, hardly seen, the cloth
        // that hangs in the window's lit half going on up into the dark. It was one flat violet card.
        if (kUnder < 0.5) { vec2 wrq = wgu * max(wps, vec2(0.5)) * vec2(1.1, 1.6) + wsl * 0.6 + wseed * 9.0;
          float wsky = 0.5 + 0.5 * sin(wrq.x * 2.3 + 1.4 * sin(wrq.y * 1.9 + wseed * 5.0)) * sin(wrq.y * 2.7 + 0.8 * sin(wrq.x * 1.3));
          wglassCol = mix(vec3(0.006, 0.004, 0.015), vec3(0.030, 0.018, 0.050), smoothstep(0.35, 0.8, wsky) * (0.25 + 0.75 * wgu.y));
          wglassCol += vec3(0.010, 0.006, 0.014) * wcl; }
        // a painted frame above the water (the upper town): no painted surround at all (the wall itself shows there: any paler
        // stone round the glass read as a lit square, and nothing up there is lit), and glass darker than its wall
        if (wmode < 0.5) { if (kUnder < 0.5 && wopen < 0.5) discard; c *= 0.85; wglassCol *= mix(0.42, 1.0, kUnder); }
        c = mix(c, wglassCol, wglass);
        c = mix(c, (wmode < 0.5 && kUnder < 0.5) ? wglassCol * 2.2 : c * 0.55, wreveal);      // (above the water a painted frame's reveal is in the dark, like its glass)
        float wk = smoothstep(0.25, 1.0, wlv) * wlv * kUnder * uKhSpillK;
        // (at arm's length a window was a cream card: the room burnt out. The eye that comes close sees INTO a room: within a
        // few metres a window gives off less than half its light, and its picture shows: the terrace's sashes, the first dormers)
        float wnearK = mix(uKhNear, 1.0, smoothstep(2.5, 13.0, length(vWPos - uCameraPos)));
        glow = wlit * (uKhGain * kUnder * wglass * wnearK) + wtone * (wreveal * 0.5 * wk);
        if (wmode < 0.5) { vec2 wd = max(-wpm, wpm - wps); glow += wtone * ((1.0 - wopen) * 0.16 * (1.0 - smoothstep(0.0, 0.16, max(wd.x, wd.y))) * wk); }
      }`,
    };
    mesh.material = kit.gouache({ color: '#b3a6c0', brush: 0.4, extend: [light.extendFor(0.5), WIN] });
    mesh.frustumCulled = false; mesh.name = 'town-windows';
    ctx.add(mesh); ctx.only(mesh, 'direct');
    // their halos in the water are the light's own (light.halos, when the area's light has them)
    if (light.halos && halo.length) { const h = light.halos(halo, {}); ctx.add(h); }
    shared.windows = mesh;
  }
  return { update(dt, c) { near.update((c || ctx).s || 0, REACH); } };
}
