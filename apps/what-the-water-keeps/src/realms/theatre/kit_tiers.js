// The theatre of leaves: THE HORSESHOE. The five tiers of the house, bay by bay: stage 2, kit and close band, the tiers
// (docs/build/theatre/2-kit-tiers.md says what is here, how to see it, and what the people who follow must know).
//
//   the bays      190 bays of tier front with the box behind each: three designs (a beech, b oak, c laurel), near versions on
//                 tiers 1 and 2 and far versions above. Models: source-art/models/theatre/tier_bay.py. A bay is modelled
//                 STRAIGHT and bent here to the curve of the house, in the vertex shader (see `bend` below)
//   the fronts where no bay stands (the stage boxes' stretch, the rear corners), swept in code from the same section
//
// Everything is instanced: one draw call per model file. The numbers are plan.js's, under "the horseshoe".
import * as THREE from 'three';
import { at, house, passes, dev } from './lib.js';
import { makeFlames, SWING_GLSL } from './kit_multitudes.js';
import { removeStandIn } from '../../engine/modules.js';

const HALF = 1.65;                                           // half a bay

// The section of a front where no bay stands: (o metres out from the line into the room, h above the tier's floor line, colour).
// It is the bay model's own section and paint (tier_bay.py: FRONT, FRONT_PAINT and the cushion): keep the two alike.
const SECTION = [
  [0.0, -0.22, '#12291f', 0], [0.10, -0.06, '#0f221b', 0], [0.235, -0.004, '#0f221b', 0], [0.242, 0.0, '#6e5a2e', 0.31], [0.276, 0.032, '#c29c50', 0.31], [0.262, 0.066, '#a8843f', 0.31], [0.249, 0.076, '#0f221b', 0],
  [0.225, 0.12, '#12291f', 0], [0.335, 0.26, '#1f493e', 0], [0.38, 0.45, '#2a5a4d', 0], [0.30, 0.62, '#1f493e', 0], [0.205, 0.80, '#12291f', 0],
  [0.25, 0.845, '#6e5a2e', 0.31], [0.268, 0.86, '#c29c50', 0.31], [0.268, 0.878, '#a8843f', 0.31], [0.24, 0.915, '#10231c', 0], [0.29, 0.955, '#a8843f', 0.31], [0.30, 0.972, '#c29c50', 0.31],
  [0.343, 1.005, '#1f4a3e', 0.5], [0.352, 1.052, '#356352', 0.5], [0.318, 1.098, '#2c5a4b', 0.5], [0.03, 1.108, '#1f4a3e', 0.5], [0.0, 1.07, '#12322a', 0.5],
];

export async function build(ctx, plan, shared) {
  const { kit } = ctx, H = house(ctx, plan, shared), T = plan.tiers, V = (s, d, y) => at(ctx, s, d, y);
  // How many tiers, from the lowest, wear the near versions of bay, pier and girandole (the page: tiers 1 and 2). The page's first
  // rung, if triangles must come down, is tier 2 to the far versions: plan.horseshoe.nearTiers = 1 (or &neartiers=1 to try it).
  const q = new URLSearchParams(typeof location !== 'undefined' ? location.search : '');
  const NEAR = q.has('neartiers') ? +q.get('neartiers') : (plan.horseshoe.nearTiers ?? 2);

  // ============================================================================================ the tiers' paint
  // One material for a whole bay (one draw call), though it is made of four things: the UV's u says which (tier_bay.py):
  // 0 the lacquer ground, 0.25 gilt (0.31 the gilt of the long mouldings), 0.5 velvet, 0.75 wax, 1 the box's lining. From that:
  //   * gilt wears the `gilt` tile (the page's generated art no. 4, top left: worn leaf, green-black tarnish, red bole), laid on
  //     from three sides in the house's own space, so that no two bays wear alike. It multiplies the vertex paint about its own mean;
  //   * each takes the house's light its own way (light.js `uKeep`: hue kept in the dark, the room's dark, the wet gleam, the
  //     glint a flame gets back from metal). The house's extension reads one uKeep for a material; here it is set per fragment.
  const wear = await ctx.tex('art/theatre/gilt_gold.webp', { repeat: true });
  wear.wrapS = wear.wrapT = THREE.RepeatWrapping; wear.anisotropy = 4; wear.needsUpdate = true;
  // (Second look.) Two more of the page's four swatches are laid on: the velvet's nap on cushions and hangings (from three sides, in the
  // house's own space), and the damask on the lining of every box (on each wall's own run, so that its figure stands upright on walls
  // that are askew to the house: the bay's own coordinates are carried to the fragment for it). Each multiplies the paint about its mean.
  const nap = await ctx.tex('art/theatre/gilt_velvet.webp', { repeat: true }), silk = await ctx.tex('art/theatre/gilt_damask.webp', { repeat: true });
  for (const t of [nap, silk]) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; t.needsUpdate = true; }
  const tierUniforms = { tWear: { value: wear }, uWearMean: { value: new THREE.Vector3(0.2836, 0.1261, 0.0265) }, uWearP: { value: new THREE.Vector4(1 / 2.3, 0.8, 1.3, 0.1) }, uTierPass: { value: 0 },
    tNap: { value: nap }, uNapMean: { value: new THREE.Vector3(0.0126, 0.0494, 0.0335) }, tSilk: { value: silk }, uSilkMean: { value: new THREE.Vector3(0.107, 0.1153, 0.0425) },
    uClothP: { value: new THREE.Vector4(1 / 1.1, 0.7, 1 / 1.3, 0.9) },         // the nap: repeats a metre, strength; the damask: the same
    uTierAir: { value: new THREE.Vector4(ctx.path.at(60).tx, ctx.path.at(60).tz, 0.03, 0) },
    // (fourth look) gilt under a flame keeps its form (see `light` below): how soon the pool rules (x), the dark of what turns away from the flames (y) and what
    // their light adds to what looks at them (z), how dark the paint's own hollows stay (w). &giltform=0 shows the gilt as the house's pool alone lights it.
    uGiltGlint: { value: new THREE.Vector4(...(q.has('giltglint') ? q.get('giltglint').split(',').map(Number) : [1.1, 40, 0.35, 0])) },      // the flames' glints on gilt (see `light`): strength, how tight, how fast they fail with the square of the distance (&giltglint=0,60,0.35: none)
    uGiltForm: { value: q.get('giltform') === '0' ? new THREE.Vector4(0, 1, 0, 1.1) : new THREE.Vector4(...(q.has('giltform') ? q.get('giltform').split(',').map(Number) : [6.0, 0.42, 0.9, 0.4])) },
    // (fifth look) CARVED GILT TAKES THE MOON AS A FORM, NOT AS SHARDS (see the albedo and light hooks): x the share of the house's wet gleam that carved gilt keeps
    // (it was whole: every facet of a festoon flashed white by itself, a colonnette was a white needle), y the soft sheen laid in its place (crowns that look toward the
    // tear are pearl-green, flanks and hollows stay dark: the carving reads as carving before a candle burns), z the share of the pearl gleam left on a bay whose own
    // brackets burn (pearl on old gold by candlelight was pewter), w the soft gold its two brackets lay along its festoon beyond their pools. &tiermoon=1,0,1,0: as it was.
    uTierMoon: { value: new THREE.Vector4(...(q.has('tiermoon') ? q.get('tiermoon').split(',').map(Number) : [0.4, 0.36, 0.35, 0.9])) },
    uTierMoonL: { value: q.has('tiermoonl') ? +q.get('tiermoonl') : 0.3 } };      // ... and the share of that soft sheen that the lacquer ground takes (&tiermoonl=0: none)      // the room's air on the box hangings: (the way it blows, x and z; metres they stir; metres they lean)
  // WHAT EACH PASS NEEDS. The engine draws the scene three times a frame: the picture it takes first, without the water; the water's
  // mirror; the picture itself.
  //   * THE FIRST PICTURE is read by two things only: the water, for what lies beneath it (at pixels of water), and the painter's
  //     filter, to tell water from everything else, which it asks only of rays that go DOWN from the eye. Every part of the horseshoe is
  //     three metres and more above the water and above the eye: no ray to it goes down and no pixel of it is water. So (second look)
  //     NOTHING of the horseshoe is drawn in that pass: a third of its cost, with the picture the same to the last pixel (checked:
  //     2-kit-tiers.md). (The first builder drew it there in one flat colour, taking its depth to be needed.)
  //   * THE MIRROR wants the house's shapes and lights, not its carving: tiers 1 and 2 are drawn there in their far versions, the gilt
  //     goes without its tile, and the inside of a box is the room's dark.
  // watchPass(mesh, which) tells a mesh which passes it is drawn in ('all': the picture and the mirror; 'main': the picture only;
  // 'mirror': the mirror only) and tells its material which pass it is in.
  const passOf = (renderer) => (ctx.engine.reflecting ? 2 : renderer.getRenderTarget() === ctx.engine.pre ? 1 : 0);
  const PRE = q.has('tierpre');                              // &tierpre=1: draw the horseshoe in the first picture all the same (to prove it is not needed there)
  const watchPass = (mesh, which = 'all') => {
    const inst = mesh.isInstancedMesh;
    if (inst) mesh.userData.all = mesh.count;
    mesh.onBeforeRender = (renderer) => {
      const p = passOf(renderer);
      tierUniforms.uTierPass.value = p; mesh.material.uniformsNeedUpdate = true;
      if (inst) mesh.count = ((p === 1 && !PRE) || (which === 'main' && p !== 0) || (which === 'mirror' && p !== 2)) ? 0 : mesh.userData.all;
    };
    mesh.onAfterRender = () => { if (inst) mesh.count = mesh.userData.all; };
    return mesh;
  };
  // (Third look.) THE POOL ON THE LACQUER. The second look gave lacquer a "metal" of 0.42 (it gave a flame back as a sheen: at 0.2 a pool on it was the
  // lime of amber times green). Since then the light itself lays its pools warm on green things; and the sheen, half the lacquer's own green and half
  // the flame's amber, had become a mustard patch at each end of every bay, as bright as the gilt beside it. At 0.06 the lacquer stays green-black under
  // a warm breath, and what carries the light of a bracket is the carving round it. (&lacqm=0.42 shows the patch again.)
  const LACQ_METAL = q.has('lacqm') ? +q.get('lacqm') : 0.06;
  const LACQ = q.has('lacq') ? +q.get('lacq') : 0.72;         // how dark old lacquer is beside its paint chip (&lacq=1: as painted)
  const tierExt = (bend, gleamK = 1, timed = bend) => ({       // gleamK: a share of the wet gleam for the whole piece (the girandoles: crisp, in their hundreds, they were rows of pale forks before the hour); timed: its instances carry aBayT (bays, and since the fourth look the piers)
    uniforms: tierUniforms,
    vertexPars: (bend ? 'attribute vec4 aBendA, aBendB; uniform vec4 uTierAir;' : '') + (timed ? ' attribute float aBayT; varying vec3 vFlameA, vFlameB;' : '') + ' varying vec3 vTierAt, vTierN; varying float vBayT;',      // (aBayT: the show clock at which this bay's brackets catch: its hanging is lit by them, and its gilt is shaped by them; vTierN: the normal in the model's own axes)
    // THE BEND. A bay is modelled straight, from x -1.65 to +1.65; it stands on a curve. aBendA and aBendB give, in the bay's own
    // axes, the two ends of its stretch of the front and the way the front runs there (each tangent as long as the chord): the bay
    // follows the cubic through them, so that two neighbours meet end to end AND run on in one line (no faceted fronts).
    vertexLocal: 'vTierAt = position; vTierN = objectNormal; vBayT = ' + (timed ? 'aBayT' : '1.0e6') + ';' + (bend ? /* glsl */`{
      float bu = (transformed.x + ${HALF.toFixed(2)}) / ${(2 * HALF).toFixed(2)}, b2 = bu * bu, b3 = b2 * bu;
      vec2 bc = (2.0 * b3 - 3.0 * b2 + 1.0) * aBendA.xy + (b3 - 2.0 * b2 + bu) * aBendA.zw + (3.0 * b2 - 2.0 * b3) * aBendB.xy + (b3 - b2) * aBendB.zw;
      vec2 bt = normalize((6.0 * b2 - 6.0 * bu) * aBendA.xy + (3.0 * b2 - 4.0 * bu + 1.0) * aBendA.zw + (6.0 * bu - 6.0 * b2) * aBendB.xy + (3.0 * b2 - 2.0 * bu) * aBendB.zw);
      vec2 bn = vec2(-bt.y, bt.x);                                         // into the room
      transformed.xz = bc + bn * transformed.z;
      objectNormal.xz = bt * objectNormal.x + bn * objectNormal.z;
    }` : ''),
    // THE HANGINGS BREATHE. The velvet in the head of every box and its fringe carry, in the UV's v, how freely each point hangs
    // (tiers_carve.py tag_free: 0.5 nailed .. 1 loose; everything else in a bay is 0.5). What is loose stirs 3 cm in the room's air, in
    // and out of the room and along the draught, each box in its own time; it leans with the draught and stirs wider in a gust
    // (uTierAir: the house's draught, the same numbers the parterre's box curtains move by: see `air` below).
    vertexWorld: (bend ? /* glsl */`{
      float tFree = max(uv.y - 0.5, 0.0) * 2.0 * (step(abs(uv.x - 0.56), 0.03) + step(abs(uv.x - 0.19), 0.03));
      if (tFree > 0.001) {
        float tPh = wp.x * 0.61 + wp.z * 0.47 + wp.y * 0.9, tA = sin(uTime * 1.07 + tPh) * 0.6 + sin(uTime * 0.63 + tPh * 1.7 + 1.3) * 0.4;
        vec3 tInto = vec3(0.0, 0.0, 1.0);
        #ifdef USE_INSTANCING
          tInto = normalize(mat3(modelMatrix) * (mat3(instanceMatrix) * tInto));
        #endif
        wp.xz += uTierAir.xy * (tFree * (uTierAir.z * 0.6 * tA + uTierAir.w * (0.8 + 0.2 * tA))) + tInto.xz * (tFree * tFree * uTierAir.z * 0.9 * sin(uTime * 0.83 + tPh * 1.3));
      }
    }` : '') + (timed ? /* glsl */`{
      // (fourth look) where this piece's flames burn, in the realm's space: a bay's two brackets stand at its ends (1.52 m above the floor line,
      // 0.46 m into the room, on the bent front), a pier's own in front of it. The fragment shader lays their glints on the gilt.
      ${bend ? `vec2 fTa = normalize(aBendA.zw), fTb = normalize(aBendB.zw);
      vec4 fPa = vec4(aBendA.x - fTa.y * 0.46, 1.52, aBendA.y + fTa.x * 0.46, 1.0), fPb = vec4(aBendB.x - fTb.y * 0.46, 1.52, aBendB.y + fTb.x * 0.46, 1.0);`
    : 'vec4 fPa = vec4(0.0, 1.52, 0.46, 1.0), fPb = fPa;'}
      #ifdef USE_INSTANCING
        fPa = instanceMatrix * fPa; fPb = instanceMatrix * fPb;
      #endif
      vFlameA = (modelMatrix * fPa).xyz; vFlameB = (modelMatrix * fPb).xyz;
    }` : ''),
    fragmentPars: /* glsl */`
  uniform sampler2D tWear, tNap, tSilk; uniform vec3 uWearMean, uNapMean, uSilkMean; uniform vec4 uWearP, uClothP, uGiltForm, uGiltGlint, uTierMoon; uniform float uTierPass, uTierMoonL;
  varying vec3 vTierAt, vTierN;                                // where the fragment is in its own model, before any bend (the damask is laid by it), and which way it looks there
  varying float vBayT;${timed ? ' varying vec3 vFlameA, vFlameB;' : ''}
  vec4 tierKeep;                                               // light.js reads uKeep; from here on it reads this, set per fragment below
  #define uKeep tierKeep
  float tierHash(vec2 p) { p = fract(p * vec2(127.1, 311.7)); p += dot(p, p + 34.123); return fract(p.x * p.y); }
  float tierNoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(tierHash(i), tierHash(i + vec2(1.0, 0.0)), f.x), mix(tierHash(i + vec2(0.0, 1.0)), tierHash(i + vec2(1.0, 1.0)), f.x), f.y); }`,
    // What a surface is made of (the UV's u; tiers_common.py CLS, tiers_carve.py): 0 lacquer, 0.19 dull gilt (fringe, door furniture),
    // 0.25 gilt, 0.31 the gilt of long mouldings, 0.5 velvet, 0.56 velvet that hangs in the head of a box, 0.75 wax, 1 the box's lining.
    albedo: /* glsl */`{
      // (Second look: far off the carving's triangles are smaller than a pixel, and with multisampling a pixel's centre can lie outside the
      // triangle it shades: the vertex paint is then EXTRAPOLATED, past its darkest or brightest point. Past green-black, old gold comes out
      // negative in red and green: lit, that was a dark blue speck. From the stage the far tiers were peppered with them.)
      albedo = clamp(albedo, vec3(0.0), vec3(1.2));
      float tCls = vUv0.x;
      float tGilt = 1.0 - smoothstep(0.08, 0.16, abs(tCls - 0.25)), tVelvet = 1.0 - smoothstep(0.08, 0.16, abs(tCls - 0.5)), tLining = smoothstep(0.84, 0.92, tCls);
      float tDull = tGilt * (1.0 - step(0.22, tCls)), tMould = tGilt * step(0.285, tCls), tHang = tVelvet * step(0.54, tCls);
      if (uTierPass > 0.5 && uTierPass < 1.5) { gl_FragColor = vec4(albedo * 0.1, 1.0); return; }      // the picture without the water: depth is all that is read of a tier
      // (Third look.) A BULLION FRINGE IS THREADS. Along the hem of every hanging, and in the skirt of its tassels, the class runs from 0.19 at the
      // heading to 0.165 at the threads' ends (tiers_carve.py FRINGE_END): each thread, 12 mm wide, has its own length and its own tone. Far off,
      // where a thread is finer than a pixel, the fringe is a plain band again (nothing to crawl).
      float tFr = tDull * clamp((0.19 - tCls) / 0.025, 0.0, 1.0);
      if (tFr > 0.01 && uTierPass < 0.5) {
        float tSee = 1.0 - smoothstep(0.004, 0.011, fwidth(vTierAt.x)), tId = floor(vTierAt.x * 85.0);
        if (tFr > mix(2.0, 0.45 + 0.55 * tierHash(vec2(tId, 3.0)), tSee)) discard;
        albedo *= mix(1.0, 0.6 + 0.75 * tierHash(vec2(tId, 7.0)), tSee);
      }
      if (uTierPass > 1.5 && tLining > 0.5) { gl_FragColor = vec4(uFogColor * 0.9 + albedo * 0.06, 1.0); return; }      // in the water's mirror the inside of a box is the room's dark and no more
      if (uTierPass < 0.5) {                                                             // (what a thing is made of is the same all over a triangle: the branches are safe for the texture's level)
        if (tGilt > 0.5) {
          vec3 tW = min(tri(tWear, vWPos * uWearP.x, N) / uWearMean, vec3(uWearP.z));
          albedo *= mix(vec3(1.0), tW, uWearP.y * (1.0 - 0.5 * tDull));
        } else if (tVelvet > 0.5) {
          albedo *= mix(vec3(1.0), min(tri(tNap, vWPos * uClothP.x, N) / uNapMean, vec3(1.6)), uClothP.y);
        } else if (tLining > 0.5) {
          vec3 tF = abs(normalize(cross(dFdx(vTierAt), dFdy(vTierAt))));               // which way the wall looks in its own model
          vec2 tQ = tF.x > max(tF.y, tF.z) ? vTierAt.zy : (tF.y > tF.z ? vTierAt.xz : vTierAt.xy);
          vec3 tS = texture2D(tSilk, tQ * uClothP.z).rgb / uSilkMean;
          tS = tS * tS * (0.75 + 0.5 * tS);                                              // the figure is faint in the painting: drawn out, so that it reads by candle and lantern
          albedo *= mix(vec3(1.0), min(tS, vec3(1.9)), uClothP.w);
        }
      }
      // (third look: old lacquer is darker than its paint chip: 0.72 of it (&lacq=1: as painted). Between two pools the front falls back to green-black.)
      albedo *= mix(1.0, ${LACQ.toFixed(2)}, (1.0 - step(0.08, tCls)));
      tierKeep = vec4(0.55, 1.0, 0.75, ${LACQ_METAL.toFixed(2)});                                            // green lacquer: keeps its colour in the dark, wet; old lacquer gives a flame back as a soft amber sheen (second look: at 0.2 a pool on it was only the lime of amber times green)
      tierKeep = mix(tierKeep, vec4(0.34, 1.0, 0.55, 1.0 - 0.5 * tMould), tGilt);        // gilt: old gold gone green in the dark, a line of pearl, the flame given back (half as much by the long mouldings)
      tierKeep = mix(tierKeep, vec4(0.3, 1.0, 0.2, 0.3), tDull);                         // dull gilt: bullion, door furniture
      tierKeep = mix(tierKeep, vec4(0.6, 1.0, 0.4, 0.12), tVelvet);
      tierKeep = mix(tierKeep, vec4(0.7, 0.55, 0.08, 0.04), tHang);                      // a hanging in the head of a box: in the box's own shade, dry (it must sit back behind the fronts: before the hour the house was rows of pale awnings)
      albedo *= 1.0 - 0.5 * tHang;
      tierKeep = mix(tierKeep, vec4(0.5, 0.9, 0.15, 0.05), tLining);                     // the box: dark, dry
      tierKeep = mix(tierKeep, vec4(0.3, 0.8, 0.2, 0.1), 1.0 - smoothstep(0.08, 0.16, abs(tCls - 0.75)));      // wax
      // (Fifth look.) CARVED GILT TAKES THE MOON AS A FORM. The house's wet gleam is a tight light: on a rail or a belly it is a line of pearl, which is right; on
      // carving every facet of every leaf took it whole or not at all. From the arches the far wall was a rack of white needles (the colonnettes) hung with white
      // shards (the festoons); at arm's length a festoon wore snow. Carved gilt keeps a share of the tight gleam (a few points of pearl) and takes the rest as a soft
      // sheen (the light hook): what looks toward the tear is pearl-green, what turns away stays dark. On a bay whose own brackets burn the pearl gives way to their gold.
      { float tCarve = tGilt * (1.0 - tMould) * (1.0 - tDull);
        tierKeep.z *= mix(1.0, uTierMoon.x * mix(1.0, uTierMoon.z, smoothstep(0.0, 1.5, uShow - vBayT)), tCarve); }
      tierKeep.z *= ${gleamK.toFixed(2)};
      // THE WET SIDE (the page's close band, "the left side behind the tree"): under the tear, on the left between s 48 and 68, rain has
      // run down the fronts for years. Long upright runs, darker and wetter than what they run over (they take more of the gleam: before
      // the hour they are what glistens there), and everything on that stretch a little wetter.
      float tWetSide = step(vWPos.x, 0.0) * smoothstep(45.0, 50.0, -vWPos.z) * (1.0 - smoothstep(66.0, 71.0, -vWPos.z)) * (1.0 - tLining) * (1.0 - tHang);
      if (tWetSide > 0.01) {
        float tRun = tierNoise(vec2(-vWPos.z * 6.5, vWPos.y * 0.2 + 3.0));
        tRun = smoothstep(0.55, 0.78, tRun) * (0.5 + 0.5 * tierNoise(vec2(-vWPos.z * 2.1, vWPos.y * 1.3))) * tWetSide;
        albedo *= mix(vec3(1.0), vec3(0.5, 0.58, 0.58), tRun);
        tierKeep.z = min(tierKeep.z * (1.0 + 0.35 * tWetSide + 1.6 * tRun), 1.7);
      }
    }`,
    // (Third look.) THE HANGINGS BY CANDLELIGHT. Kindled, a hanging was the room's dark with one thin line for its hem: nothing said cloth.
    // The house's pool dies within two metres of a bracket and a hanging is further than that from both of its own; but velvet is what a
    // candle shows best. So a bay's two brackets (at its ends, a metre and more below the hem) light its hanging from underneath once they
    // have caught: the folds' undersides and the lowest lobes take it, bottle green (amber on green velvet, multiplied out honestly: at this
    // strength it is a warm green, never a lemon), dying toward the middle of the bay; the galloon, the fringe and the tassels go old gold.
    light: /* glsl */`{
      float tC = vUv0.x, tH = (1.0 - smoothstep(0.08, 0.16, abs(tC - 0.5))) * step(0.54, tC);
      float tF = (1.0 - smoothstep(0.08, 0.16, abs(tC - 0.25))) * (1.0 - step(0.22, tC)) * step(2.2, vTierAt.y) * step(-0.5, vTierAt.z);      // (the trimming of the hanging, not the door furniture at the back of the box)
      if (tH + tF > 0.5 && vBayT < 1.0e5) {
        float tLit = smoothstep(0.0, 1.5, uShow - vBayT);
        vec2 tq = vec2(${HALF.toFixed(2)} - abs(vTierAt.x), vTierAt.y - 1.55);
        float tNear = 1.0 / (1.0 + dot(tq, tq) * 0.6), tUnder = 0.3 + 0.7 * clamp(0.4 - N.y * 1.5, 0.0, 1.0);
        c += albedo * (tH > 0.5 ? vec3(0.58, 0.80, 0.72) * 4.4 : vec3(1.0, 0.70, 0.36) * 1.5) * (tLit * tNear * tUnder);      // (velvet: the light's red is held back, or under the air's amber glow the cloth by a bracket went olive: it must stay bottle green)
      }
      // (Fourth look.) GILT UNDER A FLAME KEEPS ITS FORM. The director: gilt "must catch a candle's pool as edges of light". In the heart of a pool
      // it did the opposite: the house's pool wraps round everything within arm's length of a bracket, so the lit colonnette was an orange plank,
      // the console under the bracket an orange wedge, the sprays by the pins flat cut-outs: the plainest shapes of the house, exactly where the
      // eye goes. Here the flames are a PLACE (in the piece's own axes: at the pier, 1.5 m above the floor line, 0.46 m into the room; the row of
      // the tier below lights the dentils and the impost): what looks at them is lit, what turns away from them falls to dark bronze, and the
      // paint's own hollows (flutes, the channels of a console, the stalk end of every leaf) stay dark under the brightest light. Only where the
      // pool rules: between two brackets and before the hour nothing changes.
      float gC = vUv0.x;
      // (Fifth look.) THE MOON ON CARVED GILT: a soft light from the tear (where the house's own gleam looks), wide, falling off slowly across the house, on the
      // paint's crests more than in its hollows. It is the share of the wet gleam that the albedo hook took away, given back as form.
      { bool mGilt = abs(gC - 0.25) < 0.03, mLacq = gC < 0.08;                             // carved gilt; the lacquer ground (its belly is the broad form of a front: lit softly from the tear, a tier is a band and not two lines)
      if ((mGilt || mLacq) && uTierMoon.y > 0.0) {                                       // (in the water's mirror too: the fronts stand in it as they stand in the room)
        vec2 mQ = vWPos.xz - (uShaft.xy + uShaftLean * vWPos.y);
        float mR = length(mQ), mFall = uShaft.z / (uShaft.z + 1.4 * max(mR - uShaft.z, 0.0));
        vec3 mTo = normalize(vec3(uShaft.x + uShaftLean.x * 30.0, 30.0, uShaft.y + uShaftLean.y * 30.0) - vWPos);
        float mL = dot(N, mTo) * 0.5 + 0.5; mL *= mL;
        float mLum = dot(albedo, vec3(0.3, 0.55, 0.15)), mRelief = smoothstep(0.07, 0.36, mLum);
        float mOwn = smoothstep(0.0, 1.5, uShow - vBayT);                                  // (by its own candles a bay's gilt is gold, not pearl)
        float mK = mGilt ? (0.12 + 0.88 * mRelief) * mix(0.7, 1.0, smoothstep(5.0, 14.0, length(vViewPos))) : uTierMoonL * (0.6 + 0.4 * stroke);      // (gilt: its crests, not its hollows; and less at arm's length, where the bow lantern shows it as gold and a pale sheen over that was pewter)
        c += uMoonCol * mix(vec3(1.0), min(albedo / max(mLum, 0.03), vec3(2.0)), mGilt ? 0.6 : 0.5) * (uTierMoon.y * ${gleamK.toFixed(2)} * uShaft.w * min(uTake.z, 1.0) * pow(mFall, 0.4) * mL * mK * (1.0 - 0.6 * mOwn));      // (in its own hue, greyed by the moon: old gold gone green-pearl, the page's tarnished gilt)
      } }
      if (abs(gC - 0.28) < 0.065 && vBayT < 1.0e5) {                                    // carved gilt (0.25) and the long mouldings (0.31); not the bullion (0.19)
        float gLit = smoothstep(0.0, 0.9, uShow - vBayT);
        if (gLit > 0.001) {
          vec3 gQ = vec3(${bend ? `${HALF.toFixed(2)} * sign(vTierAt.x)` : '0.0'} - vTierAt.x, 1.52 - vTierAt.y, 0.46 - vTierAt.z), gQb = vec3(gQ.x, gQ.y - 3.2, gQ.z + 0.25);
          float gD2 = dot(gQ, gQ), gD2b = dot(gQb, gQb);
          if (gD2b < gD2) { gQ = gQb; gD2 = gD2b; }
          float gPool = exp(-gD2 / 1.44) / (1.0 + gD2) * gLit;                          // (the house's own pool: light.js housePool, reach 1.2 m)
          float gIn = clamp(gPool * uGiltForm.x, 0.0, 1.0);
          vec3 gN = normalize(vTierN) * (gl_FrontFacing ? 1.0 : -1.0);
          float gTurn = smoothstep(-0.3, 0.8, dot(gN, normalize(gQ * vec3(1.0, 0.4, 1.0) + vec3(0.0, 0.0, 1.0e-3))));      // (three candles of three heights and their halo are a tall light: a shaft above them is lit on its room side all the way up, not only where it is level with them)
          float gRelief = smoothstep(0.02, 0.2, dot(albedo, vec3(0.3, 0.55, 0.15)));
          c *= mix(1.0, (uGiltForm.y + uGiltForm.z * gTurn) * (uGiltForm.w + (1.1 - uGiltForm.w) * gRelief), gIn);
          // AND GIVES THE FLAMES BACK. Old gold is a mirror, however tarnished: a flame shows in it as a point of light on every crest that
          // looks half way between the flame and the eye, further off than the pool reaches (a pool dies within two metres; the image of a
          // flame does not). So between two brackets a festoon carries a few glints along its leaves and the shield one soft light on its
          // boss, and they travel as the boat moves. Crests only (the paint's hollows give nothing back); near the boat only (far off a
          // glint is finer than a pixel and would crawl).
          ${timed ? `float gNear = (1.0 - smoothstep(16.0, 30.0, length(vViewPos)))${bend ? '' : ' * step(vTierAt.y, 2.9)'};      // (not on a capital: its leaves are single planes, and one that looked straight between flame and eye flashed whole, a cream spike)
          if (gNear > 0.0 && uGiltGlint.x > 0.0) {
            vec3 gLa = vFlameA - vWPos, gLb = vFlameB - vWPos; float gDa = dot(gLa, gLa), gDb = dot(gLb, gLb);
            float gSa = pow(max(dot(N, normalize(gLa * inversesqrt(max(gDa, 1.0e-4)) + V)), 0.0), uGiltGlint.y) / (1.0 + gDa * uGiltGlint.z);
            float gSb = pow(max(dot(N, normalize(gLb * inversesqrt(max(gDb, 1.0e-4)) + V)), 0.0), uGiltGlint.y) / (1.0 + gDb * uGiltGlint.z);
            c += vec3(1.0, 0.70, 0.34) * (uGiltGlint.x * min(gSa + gSb, 1.0) * gLit * gNear * smoothstep(0.05, 0.22, dot(albedo, vec3(0.3, 0.55, 0.15))) * (gC > 0.285 ? 0.4 : 1.0) * clamp(1.0 - 1.25 * c.r, 0.0, 1.0));      // (laid on as a painter lays a light on a light: less the brighter the ground already is. Added plainly, a leaf of the capital that looked straight between flame and eye burnt out to a white spike)
          }` : ''}
          // (Fifth look.) AND BEYOND ITS POOLS a bay's carving takes a soft gold from its two brackets: wide, slow to fail, on the paint's crests, less the brighter the
          // ground already is. A pool dies within two metres, and between two pools a festoon and its shield were pewter by the room's air and the moon; old gold a
          // fathom from six candles is still gold: dim, deep, its crown lighter than its flanks. Carving only: the long mouldings stay dark between pools, so
          // that a tier is never one lit line.
          ${timed && bend ? `if (gC < 0.285 && uTierMoon.w > 0.0) {
            vec3 wLa = vFlameA - vWPos, wLb = vFlameB - vWPos; float wDa = dot(wLa, wLa), wDb = dot(wLb, wLb);
            float wA = dot(N, wLa * inversesqrt(max(wDa, 1.0e-4))) * 0.5 + 0.5, wB = dot(N, wLb * inversesqrt(max(wDb, 1.0e-4))) * 0.5 + 0.5;
            float wSoft = wA * wA / (1.0 + wDa * 0.45) + wB * wB / (1.0 + wDb * 0.45);
            float wRel = smoothstep(0.07, 0.36, dot(albedo, vec3(0.3, 0.55, 0.15)));
            c += vec3(1.0, 0.58, 0.20) * (uTierMoon.w * wSoft * gLit * (0.1 + 0.9 * wRel) * clamp(1.0 - 2.4 * c.r, 0.0, 1.0));      // (a deep gold, and held under the pool's own brightness: at full strength it was cream)
          }` : ''}
        }
      }
    }`,
  });
  const tierDress = (bend) => H.dress('gilt', { extend: tierExt(bend), brush: 0.5 });
  // THIN THINGS, NEAR AND FAR. Girandoles, lustres and beads are drawn `crisp` (kept out of the painter's filter), or their arms are wiped
  // out within a few metres. But far off a crisp thing's unlit parts are single dark pixels beside its own flames (from the stage the
  // far tiers were peppered with black specks): so the mark is let go between 26 and 44 m, and beyond that they are painted like the rest.
  // (The filter reads the mark from alpha: -1.05 and below is wholly crisp, 0.5 and above wholly painted: src/engine/post.js.)
  const crispNear = { final: '{ float cfD = length(vViewPos); if (cfD > 26.0) gl_FragColor.a = mix(-1.05, 0.5, smoothstep(26.0, 44.0, cfD)); }' };

  // ============================================================================================ the bays
  // Each bay's bend, in its own axes: where its two ends stand on the front, and the way the front runs there.
  const M = new THREE.Matrix4(), inv = new THREE.Matrix4();
  const bendOf = (b) => {
    const y = T[b.tier].floor;
    let E0, E1, D0, D1;
    if (b.rear) { E0 = V(b.s, b.d - HALF, y); E1 = V(b.s, b.d + HALF, y); D0 = E1.clone().sub(E0).normalize(); D1 = D0.clone(); }
    else {
      const a0 = plan.arc.bay0 + b.i * plan.bay, q0 = plan.sideFront(b.tier, b.side, a0), q1 = plan.sideFront(b.tier, b.side, a0 + plan.bay);
      E0 = V(q0.s, q0.d, y); E1 = V(q1.s, q1.d, y);
      D0 = V(q0.s + q0.ts, q0.d + q0.td, y).sub(E0).normalize(); D1 = V(q1.s + q1.ts, q1.d + q1.td, y).sub(E1).normalize();
    }
    inv.copy(M.makeRotationY(b.turn).setPosition(V(b.s, b.d, y))).invert();
    let e0 = E0.applyMatrix4(inv), e1 = E1.applyMatrix4(inv), d0 = D0.transformDirection(inv), d1 = D1.transformDirection(inv);
    if (e0.x > e1.x) { [e0, e1] = [e1, e0]; [d0, d1] = [d1, d0]; }
    if (d0.x < 0) d0.negate(); if (d1.x < 0) d1.negate();
    const len = Math.hypot(e1.x - e0.x, e1.z - e0.z);
    return [e0.x, e0.z, d0.x * len, d0.z * len, e1.x, e1.z, d1.x * len, d1.z * len];
  };
  const rnd = ctx.rng(1905), tints = ['#ffffff', '#f6f1e6', '#fff8ee', '#eef2ea', '#f9f0e0', '#f0ece2'];
  const sets = {};                                           // 'a' | 'a_far' ... -> [bay]
  const Bk = plan.horseshoe.broken, isBroken = (b) => !b.rear && b.tier === Bk.tier && b.side === Bk.side && b.i === Bk.i;
  for (const b of plan.bays) { const k = isBroken(b) ? 'broken' : plan.bayDesign(b) + (b.tier <= NEAR ? '' : '_far'); (sets[k] || (sets[k] = [])).push(b); }      // (the one special: the bay the limb grew into)
  const bays = {};
  const placeBays = async (file, list, which, tinted) => {
    const res = await kit.models(`models/theatre/${file}.glb`, list.map((b) => ({ position: V(b.s, b.d, T[b.tier].floor), turn: b.turn, tint: tinted ? tints[Math.floor(rnd() * tints.length)] : '#ffffff' })), tierDress(true));
    const A = new Float32Array(list.length * 4), B = new Float32Array(list.length * 4);
    list.forEach((b, i) => { const q = bendOf(b); A.set(q.slice(0, 4), i * 4); B.set(q.slice(4), i * 4); });
    for (const mesh of res.meshes) {
      mesh.geometry = mesh.geometry.clone();                 // (the file's own geometry is shared: the bends are this batch's)
      mesh.geometry.setAttribute('aBendA', new THREE.InstancedBufferAttribute(A, 4)); mesh.geometry.setAttribute('aBendB', new THREE.InstancedBufferAttribute(B, 4));
      mesh.geometry.setAttribute('aBayT', new THREE.InstancedBufferAttribute(new Float32Array(list.map((bb) => plan.kindleTime('tier', bb.tier, bb.arc58))), 1));
      mesh.frustumCulled = false;                            // the batch is the whole house
      watchPass(mesh, which);
    }
    return res;
  };
  for (const [k, list] of Object.entries(sets)) {
    const near = k.length === 1;                             // 'a', 'b', 'c': the near versions, for the picture; the mirror gets the same bays in their far versions
    bays[k] = await placeBays(`tier_bay_${k}`, list, near ? 'main' : 'all', true);
    if (near) bays[k + '_mirror'] = await placeBays(`tier_bay_${k}_far`, list, 'mirror', false);
  }

  // ============================================================================================ the fronts where no bay stands
  // Swept from the bay's own section: (1) the stage boxes' stretch of every tier, s 84 to 90, until stage_box.glb stands there
  // (whoever places it: removeStandIn(ctx, 'tier fronts at the stage boxes')); (2) the rear corners of tiers 3 to 5, between the
  // last rear bay and the side front.
  const sweep = (lines, SEC = SECTION) => {                   // lines: [{ pts: [{ s, d, ns, nd }], y }] -> one geometry (SEC: the section carried along each line)
    const pos = [], col = [], uv = [], idx = [], c = new THREE.Color();
    for (const { pts, y } of lines) {
      const base = pos.length / 3, m = SEC.length;
      for (const p of pts) for (const [o, h, hex, cls] of SEC) { const q = V(p.s + p.ns * o, p.d + p.nd * o, y + h); pos.push(q.x, q.y, q.z); c.set(hex); col.push(c.r, c.g, c.b); uv.push(cls, 0.5); }
      for (let i = 0; i < pts.length - 1; i++) for (let j = 0; j < m - 1; j++) { const a = base + i * m + j, b = a + m; idx.push(a, b, a + 1, a + 1, b, b + 1); }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    return g;
  };
  // (Each swept mesh has a material of its OWN: the first is a stand-in that heroes_house.js takes out with removeStandIn, which frees the
  // material of what it removes; shared, the rear corners lost their program with it, and every picture at low quality printed a dozen GL errors.)
  const plainOf = () => H.paint('gilt', { color: '#ffffff', vertexColors: true, side: THREE.DoubleSide, extend: tierExt(false), brush: 0.5 });
  {
    const lines = [];
    for (let t = 1; t <= 5; t++) for (const sign of [-1, 1]) {
      const pts = []; for (let a = plan.arc.at84; a < plan.arc.end + 0.3; a += 0.55) pts.push(plan.sideFront(t, sign, Math.min(a, plan.arc.end)));
      lines.push({ pts: sign > 0 ? pts : pts.reverse(), y: T[t].floor });
    }
    const m = new THREE.Mesh(sweep(lines), plainOf()); m.name = 'standin:tier fronts at the stage boxes (swept)'; ctx.add(watchPass(m));
    // the rear corners: tiers 3 to 5 run on from their last bay (d +-13.2) into the plain corner pier beside the arch wall
    const stubs = [];
    for (let t = 3; t <= 5; t++) for (const sign of [-1, 1]) {
      const pts = []; for (let d = 4 * plan.bay; d < 4 * plan.bay + 2.75; d += 0.55) pts.push({ s: plan.archWall.face, d: sign * d, ns: 1, nd: 0 });
      stubs.push({ pts: sign > 0 ? pts.reverse() : pts, y: T[t].floor });
    }
    const m2 = new THREE.Mesh(sweep(stubs), plainOf()); m2.name = 'tier fronts: rear corners (swept)'; ctx.add(watchPass(m2));
    // (Fifth look.) THE CORNERS BESIDE THE ARCH WALL. Where the side fronts run in, the set has a plain slab of plaster from the water to the cornice (set.js 'rear
    // corners'), between two carved walls: every front of a side ended cut off against it and five brackets of each side were fixed on its bare face. It is the
    // horseshoe's own end, so the horseshoe dresses it (plan.horseshoe.corner): a pier of the house's lacquer on its two faces that show (the one that looks into
    // the room, and its return toward the stage, which the fronts die into), the fronts' own gilt bead and rail carried round it at every tier, so that the lines of
    // the house run on to the arch wall; a plinth in the water; a cornice under the cove; on the room face one tall panel to a storey in a gilt frame, a patera at
    // its head; and the five brackets of that side in one upright line, each on its rail (plan.girandoles()).
    {
      const K = plan.horseshoe.corner, o0 = K.face, lac = '#1f493e', lacD = '#12291f', lo = '#6e5a2e', hi = '#c29c50', mid = '#a8843f';
      // the pier's elevation, from under the water to the cove: (metres proud of the slab, height, colour, what it is made of)
      const SEC = [[o0 + 0.07, -1.6, lacD, 0], [o0 + 0.07, 0.05, '#0d1f19', 0], [o0 + 0.07, 0.62, lac, 0], [o0 + 0.085, 0.66, lo, 0.31], [o0 + 0.11, 0.69, hi, 0.31], [o0 + 0.085, 0.735, mid, 0.31], [o0 + 0.012, 0.775, lacD, 0]];
      for (let t = 1; t <= 5; t++) {
        const F = T[t].floor;
        SEC.push([o0, F - 0.3, lac, 0], [o0, F - 0.004, lacD, 0], [o0 + 0.007, F, lo, 0.31], [o0 + 0.045, F + 0.032, hi, 0.31], [o0 + 0.03, F + 0.066, mid, 0.31], [o0 + 0.012, F + 0.076, '#0f221b', 0],
          [o0 + 0.014, F + 0.14, lacD, 0], [o0 + 0.034, F + 0.46, '#2a5a4d', 0], [o0 + 0.014, F + 0.80, lacD, 0],                                  // (the die between bead and rail swells a finger: a pier's own belly)
          [o0 + 0.016, F + 0.845, lo, 0.31], [o0 + 0.042, F + 0.86, hi, 0.31], [o0 + 0.042, F + 0.878, mid, 0.31], [o0 + 0.016, F + 0.915, '#10231c', 0], [o0 + 0.056, F + 0.955, mid, 0.31], [o0 + 0.066, F + 0.972, hi, 0.31],
          [o0 + 0.062, F + 1.0, lo, 0.31], [o0, F + 1.045, lacD, 0], [o0, F + 1.4, lac, 0]);
      }
      SEC.push([o0, 19.2, lac, 0], [o0 + 0.01, 19.26, lo, 0.31], [o0 + 0.065, 19.33, hi, 0.31], [o0 + 0.075, 19.47, mid, 0.31], [o0 + 0.15, 19.56, hi, 0.31], [o0 + 0.15, 19.6, lo, 0.31], [o0, 19.68, lacD, 0], [o0, 20.3, lacD, 0]);
      const lines = [], pos = [], col = [], uv = [], idx = [], c = new THREE.Color();
      const tri = (a, b, cc, want) => {                           // a triangle that looks the way `want` does (a world vector), whichever way its points were given
        const ax = pos[a * 3], ay = pos[a * 3 + 1], az = pos[a * 3 + 2], ux = pos[b * 3] - ax, uy = pos[b * 3 + 1] - ay, uz = pos[b * 3 + 2] - az, vx = pos[cc * 3] - ax, vy = pos[cc * 3 + 1] - ay, vz = pos[cc * 3 + 2] - az;
        const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
        if (nx * want.x + ny * want.y + nz * want.z >= 0) idx.push(a, b, cc); else idx.push(a, cc, b);
      };
      for (const sign of [-1, 1]) {
        const at2 = (L, w, o = 0) => [K.B[0] - K.dir[0] * L - K.n[0] * w + K.n[0] * o, sign * (K.B[1] - K.dir[1] * L - K.n[1] * w + K.n[1] * o)];      // L metres from the corner along the room face, w along the return, o proud of the room face
        const P = (L, w, ns, nd) => { const [ps, pd] = at2(L, w); return { s: ps, d: pd, ns, nd: sign * nd }; };
        // the facing: along the room face to the corner, round it (a mitre: the corner point twice, so that the two faces keep their own shade), and back along the return
        const pts = [P(2.35, 0, K.n[0], K.n[1]), P(0, 0, K.n[0] + K.dir[0], K.n[1] + K.dir[1]), P(0, 0, K.n[0] + K.dir[0], K.n[1] + K.dir[1]), P(0, K.thick + 0.05, K.dir[0], K.dir[1])];
        lines.push({ pts: sign > 0 ? pts : pts.reverse(), y: 0 });
        // the panels of the room face: one to a storey, a gilt fillet round it (three points across: edge, crest, edge), a patera at its head
        const want = V(K.n[0], sign * K.n[1], 0).sub(V(0, 0, 0)), [L0, L1] = K.panel, wd = 0.024;
        const put = (L, y, o, hex, cls = 0.31) => { const [ps, pd] = at2(L, 0, o); const q = V(ps, pd, y); pos.push(q.x, q.y, q.z); c.set(hex); col.push(c.r, c.g, c.b); uv.push(cls, 0.5); return pos.length / 3 - 1; };
        // (Sixth look. The fifth look, cut off while making this, left each panel a hair of gold round a pale six-pointed flower no bigger than a hand: from the
        // water a snowflake on a sticker. The panel's frame and what hangs in its head are a model now, corner_drop_a/b.glb, placed below; here only its sunk
        // field is laid. All five panels are one size, 1.46 m, so that one model fits them: the top storey has half a metre of plain frieze under its cornice.)
        const storeys = []; for (let t = 1; t <= 5; t++) storeys.push([T[t].floor + 1.24, T[t].floor + 2.70]);      // (none at the water: the parterre's own corner post stands in front of the pier there)
        for (const [y0, y1] of storeys) {
          // the panel's own field: the same lacquer, a tone deeper than the pier round it (so that a lit panel is a dark green field in a gold frame)
          { const f = [[L0, y0], [L1, y0], [L1, y1], [L0, y1]].map(([L, y]) => put(L, y, o0 + 0.006, '#0f271f', 0)); tri(f[0], f[1], f[2], want); tri(f[0], f[2], f[3], want); }
        }
      }
      const gPier = sweep(lines, SEC), gDress = new THREE.BufferGeometry();
      gDress.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); gDress.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); gDress.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); gDress.setIndex(idx); gDress.computeVertexNormals();
      // THE PIER'S OWN POOLS. The house's light works every pool out from where a front's pier stands (light.js), and the first pier of each side is buried in this
      // slab: on tier 1 its pool falls on the pier's face where the bracket now is (plan.horseshoe.corner.bracket), but every tier stands a hand further back, and by
      // tier 5 the pool is a metre inside the wall while the bracket burns on the face in the dark. So the pier lights itself from its own five brackets, by the
      // share the house's pool has lost at each tier (none on tier 1, most on tier 5): the same pool (reach, wrap, cap), the same candle colour, when that bracket catches.
      const bAt = (sign) => V(K.B[0] - K.dir[0] * K.bracket + K.n[0] * 0.46, sign * (K.B[1] - K.dir[1] * K.bracket + K.n[1] * 0.46), 0);
      const bR = bAt(1), bL = bAt(-1), first = (t, sign) => plan.girandoles().find((g) => g.corner && g.tier === t && Math.sign(g.d) === sign);
      const cornerExt = {
        uniforms: { uCornerAt: { value: new THREE.Vector4(bR.x, bR.z, bL.x, bL.z) }, uCornerT: { value: [1, 2, 3, 4, 5].flatMap((t) => [first(t, 1).t, first(t, -1).t]) } },
        fragmentPars: 'uniform vec4 uCornerAt; uniform float uCornerT[10];',
        light: /* glsl */`{
          float kT = clamp(floor((vWPos.y - 1.5) / 3.2 + 0.5), 1.0, 5.0); bool kRight = vWPos.x > 0.0;
          vec2 kB = kRight ? uCornerAt.xy : uCornerAt.zw;
          vec3 kL = vec3(kB.x - vWPos.x, 3.2 * kT + 1.5 - vWPos.y, kB.y - vWPos.z); float kD2 = dot(kL, kL);
          float kLit = smoothstep(0.0, 0.9, uShow - uCornerT[int(kT + 0.5) * 2 - (kRight ? 2 : 1)]);
          ${dev.second ? `float kPool = housePool(kD2, uPoolP.x) * kLit * max(dot(N, kL * inversesqrt(max(kD2, 1.0e-4))) * uPoolP.y + 1.0 - uPoolP.y, 0.0) * (kT - 1.0) * 0.22;
          float kLum = dot(albedo, vec3(0.3, 0.55, 0.15)), kCool = clamp((max(albedo.g, albedo.b) - albedo.r) / max(kLum, 0.03) * 2.0, 0.0, 1.0);
          vec3 kCl = uCandleCol * uTake.y * mix(albedo, vec3(kLum) * vec3(1.14, 0.95, 0.76), uWarmP.x * kCool) * kPool;
          c += kCl / (1.0 + max(kCl.r, max(kCl.g, kCl.b)) * uWarmP.z);`
          // (sixth look: housePool, uPoolP and uWarmP are the house's SECOND light's. Under the first (&light=1, &raw=1: postcard 13) this material did not compile:
          // 17 page errors in that picture, and no corner piers. There the pier takes the first light's own plain pool.)
          : 'c += albedo * uCandleCol * (uTake.y * kLit * (kT - 1.0) * 0.22 / (1.0 + kD2 / 0.7));'}
          // (Sixth look.) THE PANEL OVER ITS BRACKET. Three candles stand a hand in front of the pier's face and the panel's carving hangs half a metre above
          // them: lit from below, the light rakes up the panel. The house's pool dies within arm's length (and by then it is the room's dark again: the drop was a
          // dim smudge over three flames). So each bracket lays a wash up its own panel, dying toward the panel's head: on gilt, its crests more than its hollows,
          // what looks down at the flames more than what looks up; a breath of it, warmed, on the lacquer.
          { float wY = vWPos.y - (3.2 * kT + 1.5), wX = length(vWPos.xz - kB);
            float wUp = smoothstep(-0.15, 0.3, wY) * exp(-max(wY, 0.0) / 0.8) * exp(-wX * wX / 0.55);
            float wLum = dot(albedo, vec3(0.3, 0.55, 0.15)), wGilt = step(abs(vUv0.x - 0.28), 0.065);
            float wFace = 0.5 + 0.5 * clamp(0.5 - N.y * 1.2, 0.0, 1.0);
            vec3 wAlb = mix(mix(albedo, vec3(wLum) * vec3(1.14, 0.95, 0.76), 0.8) * 0.3, albedo * (0.3 + 0.7 * smoothstep(0.04, 0.3, wLum)), wGilt);
            vec3 wC = wAlb * uCandleCol * (uTake.y * kLit * wUp * wFace * 0.62);
            c += wC / (1.0 + max(wC.r, max(wC.g, wC.b)) * 0.5); }
        }`,
      };
      const cornerPaint = () => H.paint('gilt', { color: '#ffffff', vertexColors: true, side: THREE.DoubleSide, extend: [tierExt(false, 0.3), cornerExt], brush: 0.5 });      // (0.3 of the wet gleam and of the tiers' soft sheen: a broad flat face that looks at the tear took both whole, and before the hour the pier was the palest thing in the house)
      const m4 = new THREE.Mesh(gPier, cornerPaint()); m4.name = 'corner piers beside the arch wall (swept)'; ctx.add(watchPass(m4));
      const m5 = new THREE.Mesh(gDress, cornerPaint()); m5.name = 'corner piers: panels'; ctx.add(watchPass(m5));
      // (Sixth look.) THE PANELS' CARVING: corner_drop_a.glb on storeys 1, 3 and 5, corner_drop_b.glb on 2 and 4 (source-art/models/theatre/corner_drop.py): a bolection
      // frame of old gold round the panel and, hanging in its head clear of the three flames below, a drop of husks (a: beech, from a bow of ribbon; b: oak, from a
      // patera between two leaves). Each is modelled in the axes of the bracket under it (plan.girandoles(): `corner`), so it stands where that bracket stands, is
      // shaped by that bracket's flames like every pier of the house (aBayT: when it catches) and takes the pier's own pools. In the picture only.
      const dropDress = H.dress('gilt', { extend: [tierExt(false, 0.3, true), cornerExt], brush: 0.5 });
      for (const [file, tiers] of [['corner_drop_a', [1, 3, 5]], ['corner_drop_b', [2, 4]]]) {
        const list = tiers.flatMap((t) => [first(t, 1), first(t, -1)]);
        const res = await kit.models(`models/theatre/${file}.glb`, list.map((g) => ({ position: V(g.s, g.d, T[g.tier].floor), turn: g.turn })), dropDress);
        for (const mesh of res.meshes) {
          mesh.geometry = mesh.geometry.clone();
          mesh.geometry.setAttribute('aBayT', new THREE.InstancedBufferAttribute(new Float32Array(list.map((g) => g.t)), 1));
          mesh.frustumCulled = false; watchPass(mesh, 'main');
        }
      }
    }
    // STAND-IN, WAITING FOR royal_wall.glb. The rear bays' boxes stand in the arch wall's thickness; against a solid wall they
    // cannot be seen and the candles light the wall's face behind every colonnette. Until the wall is open there, each rear box
    // is closed on the wall's face by a plain dark panel (plan.horseshoe.rearBlind; removeStandIn(ctx, 'rear boxes') takes them out).
    let wallIsStandIn = false; ctx.group.traverse((o) => { if (o.name && o.name.startsWith('standin:royal_wall')) wallIsStandIn = true; });
    const blind = plan.horseshoe.rearBlind === true || (plan.horseshoe.rearBlind === 'auto' && wallIsStandIn);
    if (blind) {
      const pos = [], col = [], uv = [], idx = [], c = new THREE.Color(), face = plan.archWall.face + 0.015;
      for (const b of plan.bays) if (b.rear) {
        const y0 = T[b.tier].floor + 1.0, y1 = T[b.tier].floor + 2.99, base = pos.length / 3;
        [[b.d - HALF, y0, '#16302b'], [b.d + HALF, y0, '#16302b'], [b.d + HALF, y1, '#0e201c'], [b.d - HALF, y1, '#0e201c']].forEach(([d, y, hex]) => { const q = V(face, d, y); pos.push(q.x, q.y, q.z); c.set(hex); col.push(c.r, c.g, c.b); uv.push(1, 0.5); });
        idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
      const m3 = new THREE.Mesh(g, plainOf()); m3.name = 'standin:rear boxes (blind while the arch wall is solid)'; ctx.add(watchPass(m3));
    }
  }

  // ============================================================================================ the piers
  // On every joint of two bays, and closing every run (plan.piers()): the impost block, the drop of husks, the die, the plinth and
  // the colonnette on the rail, and the partition between two boxes. Model: source-art/models/theatre/tier_pier.py.
  const piers = {};
  {
    const P = plan.piers(), near = P.filter((p) => p.tier <= NEAR), far = P.filter((p) => p.tier > NEAR);
    const item = (p) => ({ position: V(p.s, p.d, T[p.tier].floor), turn: p.turn, tint: tints[Math.floor(rnd() * tints.length)] });
    // (fourth look) every pier knows when the bracket on it catches (a pier that closes a run: when the house's light lays its pool there), so that its gilt can be shaped by those flames
    const whenOf = (p) => plan.kindleTime('tier', p.tier, p.bay ? p.bay.arc58 : p.end === 'stage box' ? Math.abs(plan.arc.at84 - plan.arc.at58) : Math.abs(plan.arc.rearFace - Math.max(plan.frontD(plan.archWall.face) - Math.abs(p.d), 0) - plan.arc.at58));
    const pierDress = H.dress('gilt', { extend: tierExt(false, 1, true), brush: 0.5 });
    piers.near = await kit.models('models/theatre/tier_pier.glb', near.map(item), pierDress);
    piers.far = await kit.models('models/theatre/tier_pier_far.glb', far.map(item), pierDress);
    piers.nearMirror = await kit.models('models/theatre/tier_pier_far.glb', near.map(item), pierDress);      // (the near piers as the mirror draws them)
    for (const [k, which, list] of [['near', 'main', near], ['far', 'all', far], ['nearMirror', 'mirror', near]]) for (const mesh of piers[k].meshes) {
      mesh.geometry = mesh.geometry.clone();
      mesh.geometry.setAttribute('aBayT', new THREE.InstancedBufferAttribute(new Float32Array(list.map(whenOf)), 1));
      mesh.frustumCulled = false; watchPass(mesh, which);
    }
  }

  // ============================================================================================ the girandoles
  // 190 three-armed brackets (plan.girandoles()): each on its pier's die, each with its own three candle lengths (the candles are
  // modelled 14 cm long and drawn to length here), about six in a hundred hanging a few degrees off true about the fixing.
  // The flames stand on the same numbers (plan.flames()). Model: source-art/models/theatre/girandole.py.
  const girandoles = {};
  {
    const G = plan.horseshoe.girandole, fix = new THREE.Vector3(...G.fixing), q = new THREE.Vector3(), e = new THREE.Euler();
    const candleExt = {
      uniforms: { uSocketY: { value: new THREE.Vector3(G.sockets[0][1], G.sockets[1][1], G.sockets[2][1]) } },
      vertexPars: 'attribute vec4 aCandle; attribute vec3 aCandleOut; uniform vec3 uSocketY; uniform float uShow; varying float vWaxGlow, vGirLit;',
      // wax (u = 0.75) carries in v which candle it is; above its socket it is drawn to this girandole's own length.
      // (Second look: a burning candle glows in its own wax: the top third of each is lit from within once its flame has caught, and
      // goes dark again with a flame the fall puts out. Lit only by the bracket's one pool they were grey sticks under their flames.)
      // (Third look: vGirLit, 0..1: how much of this bracket burns: its three flames light the bracket itself: see `light` below.)
      vertexLocal: /* glsl */`vWaxGlow = 0.0;
      vGirLit = smoothstep(0.0, 0.9, uShow - aCandle.w) * (1.0 - (clamp((uShow - aCandleOut.x) / 1.5, 0.0, 1.0) + clamp((uShow - aCandleOut.y) / 1.5, 0.0, 1.0) + clamp((uShow - aCandleOut.z) / 1.5, 0.0, 1.0)) / 3.0);
      if (abs(uv.x - 0.75) < 0.1) {
        float ck = floor((1.0 - uv.y) * 3.0), cy = ck < 0.5 ? uSocketY.x : (ck < 1.5 ? uSocketY.y : uSocketY.z), cl = ck < 0.5 ? aCandle.x : (ck < 1.5 ? aCandle.y : aCandle.z);
        float cOut = ck < 0.5 ? aCandleOut.x : (ck < 1.5 ? aCandleOut.y : aCandleOut.z), cUp = clamp((transformed.y - cy) / ${G.candle.toFixed(3)}, 0.0, 1.0);
        vWaxGlow = cUp * cUp * smoothstep(0.0, 0.9, uShow - aCandle.w) * (1.0 - clamp((uShow - cOut) / 1.5, 0.0, 1.0));
        transformed.y = cy + max(transformed.y - cy, 0.0) * cl;
      }`,
      fragmentPars: 'varying float vWaxGlow, vGirLit;',
      // (Third look. From the water a rider sees only what LOOKS DOWN of a bracket, away from its own flames: by the house's pool alone it
      // was a dull grey-brown fork under three lights, and its candles dark sticks with glowing tips. A gilt bracket under its own candles
      // is the brightest gilding in the house: so, while it burns, what looks up takes the flames whole, what looks down is deep bronze by
      // the light the lacquer and the die give back, and every turn of an arm carries an edge of light. The whole candle is warm ivory by
      // its neighbours' flames, and glows from within toward its own. Before the hour, wax is the palest thing on a bracket.)
      light: /* glsl */`{
        float gWax = 1.0 - smoothstep(0.08, 0.16, abs(vUv0.x - 0.75)), gUp = N.y * 0.5 + 0.5;
        float gRim = 1.0 - clamp(abs(dot(N, V)), 0.0, 1.0); gRim *= gRim * sqrt(gRim);
        c += albedo * vec3(1.0, 0.70, 0.34) * (vGirLit * (1.0 - gWax) * (0.38 + 0.8 * gUp * gUp + 1.2 * gRim));
        c += albedo * vec3(1.0, 0.72, 0.40) * (gWax * (0.5 * vGirLit + 2.1 * vWaxGlow));
        c += albedo * uMoonCol * (0.16 * gWax * uShaft.w);
      }`,
    };
    const dressG = H.dress('gilt', { extend: [tierExt(false, 0.55), candleExt, crispNear], brush: 0.4, crisp: true });      // (crisp: arms two fingers thick are kept out of the painter's filter, which wiped them out beyond a few metres)
    const item = (g) => {                                     // it hangs about its fixing: the place is moved so that the fixing stays where it is
      q.copy(fix).applyEuler(e.set(0, 0, g.roll)).sub(fix).negate().applyEuler(e.set(0, g.turn, 0));
      return { position: V(g.s, g.d, T[g.tier].floor).add(q), rotation: [0, g.turn, g.roll] };
    };
    const all = plan.girandoles(), near = all.filter((g) => g.tier <= NEAR), far = all.filter((g) => g.tier > NEAR);
    // when each candle's flame goes out for good, if it does (plan.flames() lists the tiers' flames girandole by girandole, three to each)
    const FL = plan.flames(), outOf = (g) => { if (g.late) return [1e6, 1e6, 1e6]; const i = all.indexOf(g) * 3; return [0, 1, 2].map((k) => { const f = FL[i + k]; return f && f.where === 'tier' && Number.isFinite(f.out) ? f.out : 1e6; }); };      // (sixth look: the three `late` brackets' flames stand at the END of plan.flames(), and never go out)
    for (const [k, list, file, which] of [['near', near, 'girandole', 'main'], ['far', far, 'girandole_far', 'all'], ['nearMirror', near, 'girandole_far', 'mirror']]) {
      const res = await kit.models(`models/theatre/${file}.glb`, list.map(item), dressG);
      const L = new Float32Array(list.length * 4), O = new Float32Array(list.length * 3);
      list.forEach((g, i) => { L.set([...g.lengths.map((l) => l / G.candle), g.t + 0.12], i * 4); O.set(outOf(g), i * 3); });
      for (const mesh of res.meshes) {
        mesh.geometry = mesh.geometry.clone();
        mesh.geometry.setAttribute('aCandle', new THREE.InstancedBufferAttribute(L, 4)); mesh.geometry.setAttribute('aCandleOut', new THREE.InstancedBufferAttribute(O, 3));
        mesh.frustumCulled = false; watchPass(mesh, which);
      }
      girandoles[k] = res;
    }
  }

  // ============================================================================================ what swings
  // A lustre hangs on a chain: it, its flames and its beads swing as one pendulum about its hook. Twelve groups, read by all three
  // materials: 1..10 the lustres (plan.lustresAt()), 11 the chandelier in the tree (its hook where the chain meets the limb: the
  // monument's builder drives that one with swing.set(11, ax, az), and may take swing.matrix(11) for the model itself).
  // An angle pair is (about the realm's z: across the house, about its x: along it), radians.
  const swing = {
    uniforms: { uSwingPivot: { value: Array.from({ length: 12 }, () => new THREE.Vector3()) }, uSwingAngle: { value: Array.from({ length: 12 }, () => new THREE.Vector2()) },
      uSwingLate: { value: Array.from({ length: 12 }, () => new THREE.Vector2()) },
      uSwingGlow: { value: Array.from({ length: 12 }, () => new THREE.Vector3(2.67, 2.5, 0)) } },      // per group: how far below the hook its candles burn, how fast their light falls off, how many are alight (0..1)
    gust: 0,                                                 // the staging adds to this (0..1) when wind crosses the tear: the lustres swing wider
    lean: new THREE.Vector2(),                               // and to this: a steady lean in the draught, radians
    set(g, ax, az) { this.uniforms.uSwingAngle.value[g].set(ax, az); },
    matrix(g, target = new THREE.Matrix4()) {                 // the same turn as a matrix, for a model that must swing with its flames
      const p = this.uniforms.uSwingPivot.value[g], a = this.uniforms.uSwingAngle.value[g];
      return target.makeTranslation(p.x, p.y, p.z).multiply(_m1.makeRotationX(a.y)).multiply(_m2.makeRotationZ(a.x)).multiply(_m3.makeTranslation(-p.x, -p.y, -p.z));
    },
  };
  const _m1 = new THREE.Matrix4(), _m2 = new THREE.Matrix4(), _m3 = new THREE.Matrix4();
  const Ls = plan.lustresAt(), Lz = plan.horseshoe.lustre;
  for (const L of Ls) swing.uniforms.uSwingPivot.value[L.group].copy(V(L.hook.s, L.hook.d, L.hook.y));
  swing.uniforms.uSwingPivot.value[11].copy(V(plan.chandelier.s, plan.chandelier.d, plan.chandelier.hangsFrom));
  const swingExt = (late, glow = 1.05) => ({                   // (second look: at 1.7 a lit lustre was one pale yellow mass: at 1.05 its own dark hollows hold its form)
    uniforms: swing.uniforms,
    vertexPars: SWING_GLSL + '\n  uniform vec2 uSwingLate[12]; attribute float aGroup; varying float vGroup;',
    // (the ride reads 1 - v of the model's UV: 1 hangs, 0 is fixed; beads have no UV and all hang, a little behind the rest)
    vertexWorld: 'vGroup = aGroup; ' + (late ? 'wp.xyz = swingAbout(wp.xyz, aGroup, uSwingLate[int(aGroup + 0.5)]);' : 'if (uv.y > 0.5) wp.xyz = swingAbout(wp.xyz, aGroup, vec2(0.0));'),
    // what hangs is lit by its own candles: gilt and pearl a hand from the flames are gold, the foot of the stem and the chain go dark
    fragmentPars: 'uniform vec3 uSwingPivot[12]; uniform vec3 uSwingGlow[12]; varying float vGroup;',
    // (third look: seen from the water a lit lustre was an olive starfish in a ring of beads: everything the rider sees of it looks down,
    // into its own shade. What looks down now takes the light the water and the fronts give back, and every turned edge carries a line of
    // its own candles' light: the calyx, the arms and the cone read as gilt from beneath.)
    light: /* glsl */`{ int sg = int(vGroup + 0.5); vec3 sq = uSwingGlow[sg]; vec3 sd = vWPos - (uSwingPivot[sg] - vec3(0.0, sq.x, 0.0));
      float sRim = 1.0 - clamp(abs(dot(N, V)), 0.0, 1.0); sRim *= sRim * sqrt(sRim);
      float sLit = sq.z / (1.0 + dot(sd, sd) * sq.y) * step(vWPos.y, uSwingPivot[sg].y - 0.3);
      vec3 sAdd = albedo * vec3(1.0, 0.63, 0.29) * (${glow.toFixed(2)} * sLit) * (1.0 + 1.5 * sRim + 0.55 * max(-N.y, 0.0));      // (the key painting's lit gilt measures hue 30: a deeper amber than ours was, at 37)
      c += sAdd / (1.0 + max(sAdd.r, max(sAdd.g, sAdd.b)) * ${late ? '0.35' : '0.9'});      // (fourth look: held in. By its own twelve candles a lustre burnt out to a lemon mass with no form: an amber that passes one goes yellow on its way to white. Held under it, the bowl's lobes and the arms' undersides keep their bronze)
      ${late ? '' : 'c *= mix(vec3(1.0), vec3(1.2, 0.76, 0.4), clamp(sLit * 1.6, 0.0, 1.0));      // by its own candles the green of the room\'s dark on its gilt turns bronze (amber over petrol was olive)'}
    }`,
  });

  // ============================================================================================ the lustres
  // Ten, each on its wrought bracket from a pier of the third tier, 2.2 m inside the box line, its ring of twelve candles 7.7 m
  // above the water. Model: source-art/models/theatre/lustre.py. Each lustre's candles are one light on what is round it.
  let lustres = null; const lustreLights = [];
  {
    lustres = await kit.models('models/theatre/lustre.glb', Ls.map((L) => ({ position: V(L.s, L.d, L.y), turn: L.turn, tint: tints[Math.floor(rnd() * tints.length)] })),
      H.dress('gilt', { extend: [tierExt(false), swingExt(false), crispNear], brush: 0.4, crisp: true }));      // (crisp: its arms, chain and iron are thin things)
    const G = new Float32Array(Ls.map((L) => L.group));
    for (const mesh of lustres.meshes) { mesh.geometry = mesh.geometry.clone(); mesh.geometry.setAttribute('aGroup', new THREE.InstancedBufferAttribute(G, 1)); mesh.frustumCulled = false; watchPass(mesh); }
    for (const L of Ls) lustreLights.push({ L, light: ctx.light({ position: V(L.centre.s, L.centre.d, L.centre.y + 0.25), color: '#FFD27A', radius: 7.5, intensity: 0 }) });
  }

  // ============================================================================================ the beads
  // One instanced bead (an octahedron, eight triangles), matte pearl, hung on wire: the lustres' skirts (a swag from arm to arm, a
  // string from each arm in to the bowl, a drop under each pan: 132 a lustre). They swing with what they hang on, a little late.
  let beads = null;
  {
    const P = [], grp = [], size = [], long = [], kindle = new Map(), add = (p, g, k, l = 1.15) => { P.push(p); grp.push(g); size.push(k); long.push(l); };      // (kindle: bead index -> the show clock at which the bracket it hangs under catches)
    const sag = (a, b, n, drop, g, k) => { for (let i = 1; i <= n; i++) { const t = i / (n + 1); add(a.clone().lerp(b, t).setY(a.y + (b.y - a.y) * t - drop * 4 * t * (1 - t)), g, k); } };
    for (const L of Ls) {
      const cf = Math.cos(L.turn), sf = Math.sin(L.turn);
      const to = (x, y, z) => V(L.s + x * sf - z * cf, L.d + x * cf + z * sf, L.y + y);       // from the pier's axes (as plan.lustresAt does)
      const arm = (i, r, y) => { const a = i / 12 * Math.PI * 2; return to(Lz.hook[0] + Math.cos(a) * r, y, Lz.hook[2] - Math.sin(a) * r); };
      // (Second look. From beneath, five beads from arm to arm and five from each arm to the bowl drew a dotted wheel with dotted spokes.
      // Now: a deeper swag of seven from pan to pan; a long string from the canopy down to every other pan, so that the lustre wears a
      // tent of beads over its arms; and under every pan a pear drop on a smaller bead.)
      // (Fourth look. From beneath it was still a wheel: a hub, twelve spokes, a dotted rim. A lustre's beads are its BODY: a tent of strings
      // from the canopy down to every pan, a swag from pan to pan whose beads grow toward its lowest point, and under all of it a BAG: a
      // string from the low point of every swag down and in to the pendant, hanging below the arms, so that from the water the lustre is a
      // basket of pearl closing on its pine cone, with the gilt bowl seen through it. 336 beads a lustre.)
      const graded = (a, b, n, drop, g, k0, k1) => { for (let i = 1; i <= n; i++) { const t = i / (n + 1), w = 4 * t * (1 - t); add(a.clone().lerp(b, t).setY(a.y + (b.y - a.y) * t - drop * w), g, k0 + (k1 - k0) * w); } };
      const low = (i) => arm(i + 0.5, Lz.ring * Math.cos(Math.PI / 12), Lz.armEnd - 0.02 - 0.15);       // the lowest bead of the swag between pan i and pan i + 1
      for (let i = 0; i < 12; i++) {
        graded(arm(i, Lz.ring, Lz.armEnd - 0.02), arm(i + 1, Lz.ring, Lz.armEnd - 0.02), 7, 0.15, L.group, 0.013, 0.021);
        sag(arm(i, Lz.canopy[0], Lz.canopy[1]), arm(i, Lz.ring - 0.035, Lz.armEnd + 0.01), 9, 0.17, L.group, 0.014);
        { const a = low(i), b = arm(i + 0.5, Lz.bag[0], Lz.bag[1]), n = 10;                              // the bag: from the swag's low point to the pendant's neck, hanging a hand below the straight line
          for (let k = 1; k <= n; k++) { const t = k / (n + 0.5); add(a.clone().lerp(b, t).setY(a.y + (b.y - a.y) * t - 0.1 * 4 * t * (1 - t)), L.group, 0.019 - 0.008 * t); } }
        add(arm(i, Lz.ring, Lz.drop - 0.015), L.group, 0.013);
        add(arm(i, Lz.ring, Lz.drop - 0.062), L.group, 0.028, 1.6);                                     // a pear under the turned drop of every pan
      }
    }
    // (Third look.) A PEARL DROP UNDER EVERY BRACKET of the near tiers: a pear of matte pearl on a finger of wire under the curl of the
    // middle arm, the lowest thing on the bracket and the nearest to the rider's eye; the pale accent of the picture, by every flame and,
    // before the hour, in the moon. It hangs where the model says (plan.horseshoe.girandole.drop), turned with a bracket that hangs off true.
    { const G = plan.horseshoe.girandole;
      if (G.drop) for (const g of plan.girandoles()) if (g.tier <= NEAR) {
        const [x, y, z] = G.drop, cs = Math.cos(g.roll), sn = Math.sin(g.roll), dx = x - G.fixing[0], dy = y - G.fixing[1];
        const lx = G.fixing[0] + dx * cs - dy * sn, ly = G.fixing[1] + dx * sn + dy * cs, cf = Math.cos(g.turn), sf = Math.sin(g.turn);
        const hang = (drop) => V(g.s + lx * sf - z * cf, g.d + lx * cf + z * sf, T[g.tier].floor + ly - drop);
        add(hang(0.02), 0, 0.011, 1.0); add(hang(0.078), 0, 0.031, 1.6); kindle.set(P.length - 2, g.t + 0.2); kindle.set(P.length - 1, g.t + 0.2);
      } }
    // The chandelier in the tree strings its own beads from its own pans (tree.js, from tree_chandelier.json): these, hung on the
    // plan's true rings, are only for a house in which that module did not build (&skip=tree).
    if (!(shared.tree && shared.tree.chandelier)) {
      const C = plan.chandelier, tilt = Math.tan(C.outOfTrueDeg * Math.PI / 180);
      const on = (ring, a, dy = 0, k = 1) => V(C.s + Math.cos(a) * ring.r * k, C.d + Math.sin(a) * ring.r * k, ring.y + Math.sin(a) * ring.r * k * tilt + dy);
      C.rings.forEach((ring, r) => {
        const n = ring.n, per = [4, 6, 12][r];                                     // 192 + 192 + 192 from arm to arm
        for (let i = 0; i < n; i++) { const a0 = i / n * Math.PI * 2 + r * 0.4, a1 = (i + 1) / n * Math.PI * 2 + r * 0.4; sag(on(ring, a0, -0.06), on(ring, a1, -0.06), per, 0.05 + 0.05 * r, 11, 0.03); }
        for (let i = 0; i < n; i++) { const a0 = i / n * Math.PI * 2 + r * 0.4; for (let j = 0; j < 3; j++) add(on(ring, a0, -0.1 - 0.07 * j), 11, 0.034 - 0.006 * j); }      // 288 hanging under the arms
      });
      for (let r = 0; r < 2; r++) for (let i = 0; i < 16; i++) {                    // 2 x 16 long festoons from ring to ring: 736
        const a = i / 16 * Math.PI * 2 + 0.2 + r * 0.4;
        sag(on(C.rings[r], a, -0.05), on(C.rings[r + 1], a + 0.12, -0.05), 23, 0.42, 11, 0.032);
      }
    }
    const geo = new THREE.OctahedronGeometry(1, 0);
    geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(geo.attributes.position.count * 2), 2));
    geo.setAttribute('aGroup', new THREE.InstancedBufferAttribute(new Float32Array(grp), 1));
    geo.setAttribute('aKindle', new THREE.InstancedBufferAttribute(new Float32Array(P.map((_, i) => kindle.get(i) ?? 1e6)), 1));
    // (third look) a drop under a bracket is warm pearl by that bracket's flames once they have caught, and a pale point in the moon before
    const dropExt = { vertexPars: 'attribute float aKindle; varying float vKindle;', vertexWorld: 'vKindle = aKindle;', fragmentPars: 'varying float vKindle;',
      light: 'if (vKindle < 1e5) { c += albedo * vec3(1.0, 0.76, 0.45) * (0.8 * smoothstep(0.0, 0.9, uShow - vKindle)) + albedo * uMoonCol * (0.14 * uShaft.w); }' };
    beads = new THREE.InstancedMesh(geo, H.paint('pearl', { color: '#b9cbc5', flat: true, brush: 0.2, crisp: true, extend: [swingExt(true, 1.35), dropExt, crispNear] }), P.length);      // (their own candles' light on them: warm pearl by the flames; at 0.75 they were cold teal dots in the room's dark)
    const m4 = new THREE.Matrix4(), qd = new THREE.Quaternion(), e3 = new THREE.Euler(), s3 = new THREE.Vector3(), c3 = new THREE.Color();
    P.forEach((p, i) => {
      const k = size[i] * (0.85 + 0.3 * rnd()), pear = long[i] > 1.3;                  // (a pear drop hangs point up: it is only turned about its wire)
      beads.setMatrixAt(i, m4.compose(p, qd.setFromEuler(pear ? e3.set(0, rnd() * 3, 0) : e3.set(rnd() * 3, rnd() * 3, rnd() * 3)), s3.set(k, k * long[i], k)));
      beads.setColorAt(i, c3.set(['#ffffff', '#eef3ee', '#f6f0e4', '#e4ece8'][i % 4]));
    });
    beads.name = 'beads x ' + P.length; beads.frustumCulled = false;
    ctx.add(beads);
    passes(beads, ctx, { pre: 0, mirror: 0 });                 // (nothing of the horseshoe is needed in the first picture: see watchPass. Sixth look: nor are the beads in the water's mirror: a pearl a thumb across, eight metres up, is less than a pixel of rippled water; 28,000 triangles a frame that paid for the shields' frames and the corner piers' panels)
  }

  // ============================================================================================ the tassels
  // 160 bullion tassels along the hem of the house curtain (the page's multitude): one instanced tassel of 28 triangles, a turned
  // head, a neck bound with thread, a skirt; no two the same length; each swings a little on its own, more while the curtain travels.
  // They hang where the curtain's hem is: plan.curtainHem(c) while the curtain is the layout's stand-in. Whoever makes the festoon
  // cloth: set shared.horseshoe.tassels.hem = (x, c) => height of the hem at x metres right of the centre line, and they follow it.
  const tassels = { mesh: null, hem: null, swing: 0 };
  {
    // (second look: a turned head, a neck bound dark, a skirt that flares; five sides, not four: 60 triangles. It was a pale pin.)
    const Cu = plan.curtain, n = Cu.tassels, prof = [[0, 0.012, '#5e4e28'], [0.022, 0, '#a8843f'], [0.031, -0.03, '#c29c50'], [0.024, -0.06, '#8a6d35'], [0.013, -0.078, '#2e2a1a'], [0.03, -0.115, '#8a6d35'], [0.045, -0.24, '#a8843f'], [0.05, -0.31, '#5e4e28']];
    const geo = new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 5), col = new Float32Array(geo.attributes.position.count * 3), c = new THREE.Color();
    for (let i = 0; i < geo.attributes.position.count; i++) { const y = geo.attributes.position.getY(i), k = prof.reduce((b, q, j) => (Math.abs(q[1] - y) < Math.abs(prof[b][1] - y) ? j : b), 0); c.set(prof[k][2]); col.set([c.r, c.g, c.b], i * 3); }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); geo.computeVertexNormals();
    const sw = new Float32Array(n * 2); for (let i = 0; i < n; i++) sw.set([rnd(), (i % 4 === 1 ? 1.25 : 0.8) + 0.3 * rnd()], i * 2);      // every fourth hangs longer
    geo.setAttribute('aSway', new THREE.InstancedBufferAttribute(sw, 2));
    const uTassel = { value: 0.035 };
    const mat = H.paint('gilt', { color: '#ffffff', vertexColors: true, wake: false, brush: 0.3, keep: [0.3, 1, 0.22, 0.45], extend: {      // (bullion thread on velvet is dry: little of the wet gleam, or the fringe is a row of pale pins before the hour)
      uniforms: { uTassel },
      vertexPars: 'attribute vec2 aSway; uniform float uTassel;',
      vertexLocal: /* glsl */`{ transformed.y *= aSway.y;                 // its own length
        float ta = uTassel * sin(uTime * (1.2 + 0.5 * fract(aSway.x * 7.31)) + aSway.x * 6.2831853), tb = uTassel * 0.6 * sin(uTime * (0.9 + 0.4 * fract(aSway.x * 3.7)) + aSway.x * 17.0);
        transformed.x -= transformed.y * ta; transformed.z -= transformed.y * tb; }`,
    } });
    const mesh = tassels.mesh = new THREE.InstancedMesh(geo, mat, n), m4 = new THREE.Matrix4(), base = V(Cu.s - 0.04, 0, 0), right = ctx.path.at(Cu.s);
    const xs = Array.from({ length: n }, (_, i) => (i / (n - 1) - 0.5) * (Cu.width - 0.3));
    tassels.place = (cNow) => {
      for (let i = 0; i < n; i++) { const y = tassels.hem ? tassels.hem(xs[i], cNow) : plan.curtainHem(cNow); mesh.setMatrixAt(i, m4.makeTranslation(base.x + right.rx * xs[i], y - 0.01, base.z + right.rz * xs[i])); }
      mesh.instanceMatrix.needsUpdate = true;
    };
    tassels.place(-1); tassels.uTassel = uTassel;
    mesh.name = 'tassels x ' + n; mesh.frustumCulled = false;
    ctx.add(mesh);
    passes(mesh, ctx, { pre: 0 });
    removeStandIn(ctx, 'tassel x 160');                       // (the layout's cones, in kit.js's stand-in curtain)
  }

  // ============================================================================================ the flames
  // 890 flames, standing on the wicks the plan gives (kit_multitudes.js makeFlames): the girandoles' and the lustres' are this
  // module's, the rest stand where the plan's other owners put them.
  const flames = makeFlames(ctx, plan, shared, swing);

  // The box hangings' air. Left alone it is the parterre's box curtains' own draught (shared.kitFloor.draught: the cast's cloth group
  // drives that for gusts, the lean after the hour and the fall), so that all the cloth of the house stirs as one; `follow: false` and
  // `value` (the Vector4 above) let the staging drive it by hand.
  const air = { value: tierUniforms.uTierAir.value, follow: true };
  shared.horseshoe = { bays, piers, girandoles, lustres, lustreLights, beads, flames, swing, tassels, hangings: air };
  let hemWas = null;
  const show = shared.show || { c: -1 }, late = Ls.map(() => new THREE.Vector2()), smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const W = Math.PI * 2 / 2.9;                               // a 2.1 m chain: a swing in 2.9 s
  return {
    update(dt) {
      const c = show.c, t = ctx.time, calm = ctx.reducedMotion ? 0.4 : 1;
      { const kf = shared.kitFloor && shared.kitFloor.draught;                           // the hangings take the house's draught when the parterre has made it
        if (air.follow && kf && kf.value) air.value.copy(kf.value); else if (air.follow) air.value.z = 0.03 * (ctx.reducedMotion ? 0.5 : 1); }
      for (const { L, light } of lustreLights) { const lit = smooth(0, 1.2, c - plan.kindleTime('lustre', L.pair)); light.intensity = 0.9 * lit; swing.uniforms.uSwingGlow.value[L.group].z = lit; }
      swing.uniforms.uSwingGlow.value[11].set(5.1, 0.12, smooth(1, 6, c));                // the chandelier in the tree: its flames burn about 5 m under the hook, 6 m across
      // the tassels ride the curtain's hem, and swing wider while it travels
      const hem = plan.curtainHem(c), moving = hemWas == null ? 0 : Math.min(1, Math.abs(hem - hemWas) / Math.max(dt, 1e-3) / 0.8);
      if (tassels.hem || hem !== hemWas) tassels.place(c);
      hemWas = hem;
      tassels.uTassel.value += ((0.035 + 0.11 * moving + tassels.swing) * calm - tassels.uTassel.value) * Math.min(1, dt * 1.5);
      // each lustre swings a little in the room's air, in its own time, a little wider across the house than along it; wider in a gust
      const amp = (0.011 + 0.03 * swing.gust) * calm;
      Ls.forEach((L, i) => {
        const ph = L.group * 2.39, ax = amp * Math.sin(W * t + ph) + swing.lean.x, az = 0.7 * amp * Math.sin(W * 0.93 * t + ph * 1.7) + swing.lean.y;
        swing.set(L.group, ax, az);
        // the beads follow late: their own angle chases the lustre's, and overshoots it a little
        const q = late[i], k = Math.min(1, dt * 5);
        q.x += (ax * 1.5 - q.x) * k; q.y += (az * 1.5 - q.y) * k;
        swing.uniforms.uSwingLate.value[L.group].set(q.x - ax, q.y - az);
      });
    },
  };
}
