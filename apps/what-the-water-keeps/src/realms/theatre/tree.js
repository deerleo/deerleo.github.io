// The theatre of leaves: THE MONUMENT. A copper beech 44 m tall in the shaft of moonlit rain, the mound of fallen dome
// it stands on, and the house's great chandelier caught in its boughs (docs/art/theatre.md, section 3, "Monument").
// How it was made, what it measures and what is still to do: docs/build/theatre/2-monument.md.
//
// Every part is modelled by hand in Blender, by the scripts in source-art/models/theatre/ (beech_common.py is the
// skeleton they share), all in ONE space: the tree's foot on the water is the origin, +X the page's d, +Y the page's s.
// So every file is placed at the same point with no turn, and nothing is carried across by hand:
//   beech_trunk.glb      trunk, root flares and roots, the great limb (one draw);  beech_limbs.glb  the leaders and every bough (one draw)
//   beech_crown.glb      the crown's fine wood: the lesser branches inside every mass of leaves, kept crisp (one draw)
//   beech_spray_a/b/c.glb  three BOUGH SPRAYS (a twig, its side twigs, some thirty leaves cut as folded cards), instanced on
//                        beech_sprays.json: where each of some nine hundred stands on the tree's wood, its colour, and how much
//                        of the moon and of the chandelier's fire reaches it through the crown (three draws)
//   tree_chandelier.glb  the chandelier's frame and chains, and its spare chain (two draws); tree_chandelier.json: its hook,
//                        every wick, every swag of beads (the beads are instanced here: one draw)
//   mound.glb            the heap, the fallen ceiling, the lifted seats and parquet, the gilt rib, the drifts (four slots: four draws)
// and four painted surface tiles, laid on those modelled forms (the page's picture 8, `bark`, generated once as a sheet of
// four: source-art/theatre/bark.png, split_bark.py): bark_trunk (trunk and limbs), bark_root (roots and the trunk's foot),
// bark_litter (the drifts of leaves), bark_rubble (the mound's ground). Each is laid about its own mean, so that a model's
// own paint keeps its value and its drawing. If a tile is missing the tree stands in its paint alone.
//
// What it gives the people who bring the area to life is in `shared.tree` (see the end of build, and the log).
// Developer switches: &skip=tree leaves the monument out; &sway=0 holds the crown still; &sprays=0.5 draws half the sprays;
// &lk=a,b,c,d  &lf=a,b,c,d  &lc=a,b,c,d  other strengths for the leaves' light (see U below); &leafdebug shows its terms.
import * as THREE from 'three';
import { removeStandIn } from '../../engine/modules.js';
import { NOISE_GLSL } from '../../engine/kit.js';
import { at, house, dev } from './lib.js';

const DIR = 'models/theatre/';
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const DV = (k, d) => (dev.has(k) && dev.get(k) !== '' ? +dev.get(k) : d);      // a number from the address, for trying things: &falli=0.3

// ------------------------------------------------------------------------------------------------ the crown's slow sway
// One field of movement for wood, cards and sprays alike, worked out from where a point IS, so that a twig and the
// leaves on it go together without sharing any data. Nothing below the fork moves. The script below (swayAt) is the
// same arithmetic, for what hangs from a limb (the chandelier's hook must go where its limb goes).
const SWAY_GLSL = /* glsl */`
  uniform vec3 uTreeAt; uniform vec4 uTreeSway;                // the tree's foot;  x: metres at the top, y: seconds, z: how much the sprays toss, w: 1 + gust
  vec3 treeSway(vec3 p) {                                      // p: metres from the tree's foot (y up)
    float h = smoothstep(14.0, 40.0, p.y), r = length(p.xz);
    float k = (0.25 * h + 0.75 * h * h) + 0.42 * smoothstep(2.5, 11.0, r) * smoothstep(14.5, 18.0, p.y);
    float t = uTreeSway.y;
    float a = t * 0.5712 + p.x * 0.17 + p.z * 0.21, b = t * 0.4586 - p.x * 0.12 + p.z * 0.26 + 1.3;      // periods of 11 and 13.7 s, crossing the crown
    vec3 d = vec3(sin(a) * 0.62 + sin(b) * 0.38, 0.0, cos(a * 0.91 + 0.7) * 0.5 + sin(b * 1.07) * 0.32);
    d.y = -0.22 * (d.x * p.x + d.z * p.z) / max(r, 1.5);       // a bough dips as it swings out
    return d * (k * uTreeSway.x * uTreeSway.w);
  }`;
/** The mound's ground at (x, y) metres from the tree's foot (x toward the centre line, y toward the stage): beech_common.mound_height. */
function moundHeight(x, y) {
  const r = Math.hypot(x, y), a = Math.atan2(y, x);
  const shore = 5.0 + 0.45 * Math.sin(2 * a + 0.6) + 0.28 * Math.sin(3 * a - 1.1) + 0.18 * Math.sin(5 * a + 2.0);
  if (r <= shore) { const t = Math.max(0, (r - 1.1) / (shore - 1.1)); return 1.86 * (1 - Math.pow(t, 1.25)) + 0.10 * Math.sin(1.7 * x + 0.3) * Math.sin(1.3 * y - 0.8) * Math.min(1, t * 3); }
  return -1.52 * Math.pow(Math.min(1, (r - shore) / (9.0 - shore)), 0.85);
}
function swayAt(p, t, amp, out) {                              // the same, in script: p from the tree's foot
  const h = smooth(14, 40, p.y), r = Math.hypot(p.x, p.z);
  const k = (0.25 * h + 0.75 * h * h) + 0.42 * smooth(2.5, 11, r) * smooth(14.5, 18, p.y);
  const a = t * 0.5712 + p.x * 0.17 + p.z * 0.21, b = t * 0.4586 - p.x * 0.12 + p.z * 0.26 + 1.3;
  const dx = Math.sin(a) * 0.62 + Math.sin(b) * 0.38, dz = Math.cos(a * 0.91 + 0.7) * 0.5 + Math.sin(b * 1.07) * 0.32;
  return out.set(dx, -0.22 * (dx * p.x + dz * p.z) / Math.max(r, 1.5), dz).multiplyScalar(k * amp);
}

/**
 * Which passes draw a thing. The engine draws the scene three times a frame: once without the water (what the water
 * is looked through at), once for the mirror, once for the picture. Nothing 15 m up a tree is ever seen through the
 * water, so the crown, the limbs and the chandelier are left out of the first; and the mirror, which ripples, takes
 * half the sprays. opts: { pre: false, mirror: 0..1 (instanced things only), lod: () => 0..1 (instanced things only: the share drawn now) }
 */
function drawnIn(mesh, ctx, { pre = true, mirror = 1, lod = null } = {}) {
  const engine = ctx.engine, inst = mesh.isInstancedMesh, all = inst ? mesh.count : 0, range = mesh.geometry.drawRange;
  let start = 0, count = Infinity;
  mesh.onBeforeRender = (renderer) => {
    const isPre = renderer.getRenderTarget() === engine.pre, k = isPre ? (pre ? 1 : 0) : engine.reflecting ? mirror : 1;
    if (inst) mesh.count = Math.ceil(all * k * (lod ? lod() : 1));      // (lod: stage 6, a share of an instanced multitude by the boat's distance)
    else if (k === 0) { start = range.start; count = range.count; mesh.geometry.setDrawRange(0, 0); }
  };
  mesh.onAfterRender = () => { if (inst) mesh.count = all; else if (count !== Infinity || range.count === 0) { mesh.geometry.setDrawRange(start, count); count = Infinity; } };
  return mesh;
}

export async function build(ctx, plan, shared) {
  const { kit } = ctx, H = house(ctx, plan, shared), B = plan.beech, C = plan.chandelier, show = shared.show || { c: -1, k: 0 };
  const foot = at(ctx, B.s, B.d, 0), place = { position: [foot.x, 0, foot.z] };
  const still = dev.get('sway') === '0';
  // (stage 6, 5-critique.md) FAR MULTITUDES THIN. The share of the sprays and of the mound's leaves that is drawn, by how far the boat is from the trunk: all of
  // them to 20 m (the leaves on the ground: to 14 m), then fewer, down to six sprays in ten from 34 m and half the leaves from 30 m. Both are laid out so that any
  // first part of them is a fair sample (the sprays: every other one first, each half from the lowest up; the leaves: shuffled), so they go one at a time, the
  // topmost sprays first, while the boat is 20 m and more away. At the fall this is 90,000 triangles of the picture. &treelod=0: all of them always.
  const far = { sprays: 1, litter: 1 }, LOD = dev.get('treelod') !== '0';

  // ---- what every part of the tree shares: its sway, and the two lights that are its own (the moon in the shaft, the fire in it)
  const U = {
    uTreeAt: { value: foot.clone() }, uTreeSway: { value: new THREE.Vector4(still ? 0 : 0.34, 0, 1, 1) },
    uLfShaft: H.U.uShaft || { value: new THREE.Vector4(foot.x, foot.z, 10, 1) }, uLfLean: H.U.uShaftLean || { value: new THREE.Vector2() },
    uLfMoon: H.U.uMoonCol || { value: new THREE.Color('#C4D6D0') },
    uLfFire: { value: new THREE.Vector4(0, 17.5, 0, 12) },      // the middle of the chandelier's flames; w: the metres at which its light on the leaves has halved
    uLfFireOn: { value: 0 },                                   // 0..1: the share of its candles alight
    uLfK: { value: new THREE.Vector4(1.0, 1.0, 1.4, 1.3) },    // the crown's own shade; the moon on what looks up; the moon through a leaf; the room's pearl on what is open to it
    uLfF: { value: new THREE.Vector4(7.0, 2.6, 0.04, 1.0) },   // the fire on a leaf; the fire through a leaf; its glow all round; how far a lit leaf goes over from copper to amber (third holder: it was 8.5, 2.2, 0.10 with the light halving at 12 m: every leaf in the house reached the limiter and the crown was one orange. Now it halves at 8 m: amber by the flames, copper beyond, plum where the crown shades itself)
    uLfPlum: { value: new THREE.Color(dev.get('lplum') ? '#' + dev.get('lplum') : '#2c1c22') },      // the crown's shade is a colour: plum (third holder: purpler, it was a brown)
    uLfAmber: { value: dev.has('lamber') ? +dev.get('lamber') : 0.7 },     // how far a leaf in strong warm light goes over from copper to amber (third holder: 0.38 before; the lit crown was one red-orange)
    uLfAir: { value: dev.has('lair') ? +dev.get('lair') : 0.55 },           // (fourth holder: 1.1 before, and seven tenths of it grey: pearl laid over copper on every side of every leaf is salmon pink, and the crown's top was. Half of it now, and it keeps the leaf's own copper: the pearl is on what looks UP)            // the lit rain's own light on the leaves that stand in it, from all round: pearl on the crown where it is open to the shaft
    uLfVerm: { value: new THREE.Color(dev.get('lverm') ? '#' + dev.get('lverm') : '#E0492B') },      // a leaf with a flame behind it: the page's vermilion
    // the house takes the lights other people make with ctx.light at a share its light state gives (uPoolP.w). The leaves take
    // none of them: the fire in the tree reaches a leaf through the crown, by the numbers Blender worked out, and is added below
    uPoolP: { value: new THREE.Vector4(1.2, 0.7, 0.55, 0) },
  };
  for (const [k, u] of [['lk', U.uLfK], ['lf', U.uLfF]]) if (dev.has(k)) u.value.fromArray(dev.get(k).split(',').map(Number).concat([0, 0, 0, 0]).slice(0, 4));
  const swayExt = { uniforms: { uTreeAt: U.uTreeAt, uTreeSway: U.uTreeSway }, vertexPars: SWAY_GLSL, vertexWorld: 'wp.xyz += treeSway(wp.xyz - uTreeAt);' };
  // LEAVES. The house's paint gives a leaf the room's dark and nothing else (take: all zero): the rest is here, because a
  // crown is not a wall. A leaf is thin: what the eye sees of it is as often the light that comes THROUGH it as the light on it.
  //   in its own shade      plum, a little of its own copper in it, lighter where the spray is open to the room
  //   the moon              only inside the shaft, only as much as reaches the spray through the crown above (Blender's number):
  //                         pearl on the side that looks up at it (the copper greyed out, as moonlight does); copper, glowing a
  //                         little, when the eye is under the leaf and the moon over it
  //   the fire              from the chandelier, as much as reaches the spray through the crown: the side that looks at it goes
  //                         from copper to amber as it nears the flames; a leaf between the eye and the flames is vermilion
  // vLeaf: x = moon, y = fire, z = open (all 0..1, per spray), w = a number of its own. vUv0: x = how far along the spray, y = a
  // number of the leaf's own (2 on the spray's twigs).
  const leafExt = {
    defines: dev.has('leafdebug') ? { LEAF_DEBUG: dev.get('leafdebug') || '1' } : {},
    uniforms: U,
    vertexPars: /* glsl */`${SWAY_GLSL}
      attribute vec4 aLeaf; varying vec4 vLeaf;`,
    vertexLocal: /* glsl */`
      vLeaf = aLeaf;
      { // a spray nods from where it is held: its tip most, each to its own time
        float ph = aLeaf.w * 6.2832, t = uTreeSway.y;
        float nod = (sin(t * (0.55 + 0.5 * aLeaf.w) + ph) * 0.6 + sin(t * (1.3 + 0.7 * aLeaf.w) + ph * 1.7) * 0.4) * 0.05 * uTreeSway.z * uTreeSway.w;
        float along = transformed.x * transformed.x * 0.5;
        transformed.y += along * nod; transformed.z += along * nod * 0.5 * sin(ph * 3.0);
      }`,
    vertexWorld: 'wp.xyz += treeSway(wp.xyz - uTreeAt);',
    fragmentPars: /* glsl */`uniform vec4 uLfShaft, uLfFire, uLfK, uLfF; uniform vec2 uLfLean; uniform vec3 uLfMoon, uLfPlum, uLfVerm; uniform float uLfFireOn, uLfAmber, uLfAir; varying vec4 vLeaf;
      // copper in a little light, amber in much: as a leaf brightens it pales toward the flame's own colour (what a painter does, and
      // what keeps a lit crown from going one red-orange). a: the leaf's own paint; l: how much warm light is on it
      vec3 leafWarm(vec3 a, float l, float k) { vec3 lit = a * l; return mix(lit, vec3(1.0, 0.60, 0.21) * (dot(lit, vec3(0.3, 0.55, 0.15)) * 1.7), k * uLfAmber * smoothstep(0.3, 1.6, l)); }`,
    albedo: /* glsl */`
      if (vUv0.y < 1.5) albedo *= 0.74 + 0.36 * vUv0.x;                    // a spray is darker at its foot, in the mass, than at its tip`,
    light: /* glsl */`
    { // ---- leaves (src/realms/theatre/tree.js)
      float lTwig = step(1.5, vUv0.y);                                     // the spray's own twigs: wood, nothing comes through them
      vec3 lN = dot(N, V) < 0.0 ? -N : N;                                  // the side of the leaf the eye sees
      float lLum = dot(albedo, vec3(0.3, 0.55, 0.15));
      float lOne = fract(vUv0.y * 7.31 + vLeaf.w * 3.7);                   // a number of this leaf's own
      float lThin = (0.35 + 0.9 * lOne) * (1.0 - lTwig);                   // some leaves lie two deep: less comes through
      float lEach = mix(0.6 + 0.7 * lOne, 1.0, lTwig);                     // and no two take the light alike
      // ---- in its own shade: plum, with a little of its own colour, lighter where the spray is open to the room
      c += (uLfPlum * 0.6 + albedo * 0.14) * (uLfK.x * (0.4 + 0.6 * vLeaf.z) * lEach);
      // ---- the moon (when the chandelier burns the eye is set for its gold, and the moon's part is the less)
      vec2 lQ = vWPos.xz - (uLfShaft.xy + uLfLean * vWPos.y);
      float lR = length(lQ);
      float lIn = 1.0 - smoothstep(uLfShaft.z * 0.85, uLfShaft.z * 1.3, lR);
      float lDim = 1.0 - 0.6 * uLfFireOn;
      float lMoon = uLfShaft.w * vLeaf.x * lIn * lDim;
      float lUp = dot(lN, -uKeyDir);                                       // above 0: the eye sees the side the moon lights
      vec3 lGrey = mix(albedo, vec3(lLum * 1.25), 0.85);
      vec3 lMoonC = uLfMoon * lGrey * (lMoon * uLfK.y * 2.4 * smoothstep(0.05, 0.85, lUp));         // pearl on what looks up
      lMoonC += leafWarm(albedo, lMoon * uLfK.z * 1.1 * max(-lUp, 0.0) * lThin, 0.5) * vec3(0.9, 1.0, 0.95);      // copper, glowing, with the moon behind it
      // the lit rain is a column of light. A leaf that hangs between the eye and the column has that light behind it and glows
      // copper; what looks up and is open to the room takes a breath of its pearl
      float lBehind = smoothstep(-1.0, 7.0, dot(-lQ, -V.xz) / max(length(V.xz), 0.2)) * (1.0 - smoothstep(0.55, 0.95, V.y));
      lMoonC += leafWarm(albedo, uLfShaft.w * lDim * uLfK.w * 0.8 * lBehind * vLeaf.z * lThin * (1.0 - smoothstep(uLfShaft.z, uLfShaft.z * 2.2, lR)), 0.4);
      lMoonC += uLfMoon * lGrey * (uLfShaft.w * lDim * uLfK.w * 0.12 * vLeaf.z * vLeaf.z * max(lN.y, 0.0));
      // (third holder) the column of lit rain is a lamp all round what stands in it: a spray that is open to the shaft takes its pearl
      // on every side, the greyer the more open: the top of the crown in the tear is copper under a pearl bloom, whatever burns below
      lMoonC += uLfMoon * mix(albedo * 1.25, vec3(lLum * 1.35), 0.3 + 0.5 * smoothstep(0.2, 0.9, lN.y)) * (uLfShaft.w * lIn * uLfAir * vLeaf.x * vLeaf.x * (1.0 - 0.3 * uLfFireOn) * (0.7 + 0.6 * lOne) * (0.75 + 0.9 * max(lN.y, 0.0)) * (1.0 - lTwig));
      // wet leaves: the side the eye sees gives back the pale opening of the dome where it looks up toward it (the house's wet
      // gleam, on leaves: glints of pearl along the crown's hanging skirts)
      vec3 lRf = reflect(-V, lN);
      float lGl = max(dot(lRf, normalize(vec3(uLfShaft.x, 34.0, uLfShaft.y) - vWPos)), 0.0); lGl *= lGl; lGl *= lGl * lGl;
      lMoonC += uLfMoon * (uLfShaft.w * lDim * 0.4 * lGl * max(vLeaf.x, 0.5 * vLeaf.z) * lEach * (1.0 - lTwig) * (1.0 - smoothstep(uLfShaft.z * 1.2, uLfShaft.z * 2.4, lR)));
      c += lMoonC;
      // ---- the fire in the tree
      vec3 lF = uLfFire.xyz - vWPos; float lD = length(lF); lF /= max(lD, 1e-3);
      float lAtt = uLfFireOn * smoothstep(0.03, 0.66, vLeaf.y) / (1.0 + lD * lD / (uLfFire.w * uLfFire.w));      // (what the crown hides from the flames stays in its own shade: plum against the gold)
      float lFace = dot(lN, lF);                                           // above 0: the eye sees the side the flames light
      float lLit = lAtt * uLfF.x * (0.3 + 0.7 * max(lFace, 0.0)) * lEach + lAtt * uLfF.z;
      lLit = 1.9 * (1.0 - exp(-lLit / 1.9));                               // (a leaf by the flames is a deep amber, never bleached: what is over-lit pales toward yellow-white)
      vec3 lFireC = leafWarm(albedo, lLit, uLfF.w);
      float lThru = lAtt * uLfF.y * max(-lFace, 0.0) * lThin;
      lFireC += mix(leafWarm(albedo, lThru * 2.0, 0.5), uLfVerm * lThru, 0.22);      // a leaf between the eye and the flames (fourth holder: 0.4 before: from the arches every leaf has the fire behind it, and vermilion is the page's accent, under a twentieth)
      c += lFireC;
      #ifdef LEAF_DEBUG
        #if LEAF_DEBUG == 2
          c = vec3(vLeaf.x, vLeaf.y, vLeaf.z);
        #elif LEAF_DEBUG == 3
          c = uLfPlum;
        #else
          c = vec3(lLit, lMoon * max(lUp, 0.0), lThru);
        #endif
      #endif
    }`,
  };

  // ============================================================================================ the wood
  // (three files along the tree's natural joints: below the fork, where the boat is near; the leaders and boughs above it;
  // and the fine wood inside the masses of leaves, thinner than the painter's brush at that distance: kept crisp)
  // THE BARK'S SURFACE. Blender's paint gives the bark its drawing at the scale of a hand's span and up (lichen in drifts, the
  // runnels, the scars); what a rider three metres from a root looks at is finer: the level marks of a beech's skin, crusts
  // of lichen with edges, moss in the folds of the roots. Two painted tiles carry it, laid from three sides in the tree's
  // own space BEFORE its sway (so nothing swims on a moving bough), each about its own mean: the trunk's bark everywhere,
  // going over to the roots' wet bark toward the water.
  const tiles = {};
  for (const n of ['trunk', 'root', 'litter', 'rubble']) { try { tiles[n] = await ctx.tex(`art/theatre/bark_${n}.webp`, { repeat: true }); } catch (err) { console.warn(`theatre/tree: bark_${n}.webp did not load: that surface stands in its paint alone`); } }
  const UB = { tBark: { value: tiles.trunk || null }, tRootBark: { value: tiles.root || tiles.trunk || null }, uBarkB: { value: new THREE.Vector2(DV('bumpt', 0.025), DV('bumpr', 0.07)) },      // how deep the bark's relief is taken to be, metres: trunk, roots
    uBarkP: { value: new THREE.Vector4(1 / 2.3, 1 / DV('roott', 1.1), 0.9, DV('rootw', 0.6)) } };       // tiles per metre: trunk, roots; how strongly each is laid (fifth holder: the roots' at 0.6, it was 0.85: their own paint now carries their moss and lichen, and the two together were mud)
  const barkExt = {
    defines: tiles.trunk ? { TREE_BARK: '' } : {},
    uniforms: { uTreeAt: U.uTreeAt, uTreeSway: U.uTreeSway, ...UB },
    vertexPars: /* glsl */`${SWAY_GLSL}
      varying vec3 vBarkP;`,
    vertexWorld: 'vBarkP = wp.xyz - uTreeAt; wp.xyz += treeSway(wp.xyz - uTreeAt);',
    fragmentPars: /* glsl */`uniform sampler2D tBark, tRootBark; uniform vec4 uBarkP; uniform vec2 uBarkB; varying vec3 vBarkP;
      vec3 barkTri(sampler2D t, vec3 q, vec3 bw) { return texture2D(t, q.zy).rgb * bw.x + texture2D(t, q.xz).rgb * bw.y + texture2D(t, q.xy).rgb * bw.z; }
      vec3 barkTriB(sampler2D t, vec3 q, vec3 bw, float b) { return texture2D(t, q.zy, b).rgb * bw.x + texture2D(t, q.xz, b).rgb * bw.y + texture2D(t, q.xy, b).rgb * bw.z; }`,
    albedo: /* glsl */`
      #ifdef TREE_BARK
      { // ---- the bark's surface (src/realms/theatre/tree.js)
        vec3 bw = pow(abs(N), vec3(4.0)); bw /= (bw.x + bw.y + bw.z);
        vec3 bk = barkTri(tBark, vBarkP * uBarkP.x, bw) / vec3(0.112, 0.132, 0.116);                // (about its own mean, in linear light: split_bark.py prints it)
        bk = min(bk, vec3(1.7));                                                                    // (its lichen is cream: on a trunk that stands in the moon's shaft it must not burn)
        float cRoot = 0.0, cCyl = 0.0;                                                              // (1 on a root: it wears the roots' own bark however high on the heap it lies; 1 where the bole wears its bark round it)
        #ifdef BARK_CYL
        { // (fourth holder) THE BOLE WEARS ITS BARK ROUND IT. Laid from three sides, the level marks of a beech's skin smeared wherever two
          // sides met and the trunk read as an enlarged, blurred photograph. Between the flares and the fork the tile goes round the
          // trunk's own axis instead: three times round, its level marks level, its runs of wet plumb.
          vec2 cAx = vec2(0.12 * sin(0.33 * vBarkP.y + 0.4) - 0.03, 0.10 * sin(0.26 * vBarkP.y + 2.0) - 0.06);
          vec2 cD = vec2(vBarkP.x - cAx.x, -vBarkP.z - cAx.y);
          float cR = length(cD), cT = atan(cD.y, cD.x), cT2 = atan(-cD.y, -cD.x);
          float cOn = (1.0 - smoothstep(1.35, 1.85, cR)) * (1.0 - smoothstep(12.6, 13.8, vBarkP.y)) * smoothstep(1.6, 3.2, vBarkP.y);
          cRoot = smoothstep(1.9, 2.8, cR) * (1.0 - smoothstep(2.6, 4.0, vBarkP.y)); cCyl = cOn;
          if (cOn > 0.001) {
            bool cFar = abs(cT) > 1.57;                                                             // (the angle jumps behind the trunk: its slope is taken from the angle measured the other way round there)
            vec2 cUv = vec2(cT * 0.47746, vBarkP.y / 2.3);                                         // (three times round: a tile is 2.3 m each way on a trunk 2.2 m through)
            vec2 cDx = vec2((cFar ? dFdx(cT2) : dFdx(cT)) * 0.47746, dFdx(vBarkP.y) / 2.3), cDy = vec2((cFar ? dFdy(cT2) : dFdy(cT)) * 0.47746, dFdy(vBarkP.y) / 2.3);
            vec3 ck = textureGrad(tBark, cUv, cDx, cDy).rgb / vec3(0.112, 0.132, 0.116);
            ck = mix(vec3(1.0), ck, 1.3);                                                           // (a little more of its drawing: the painter's brush takes a third of it back)
            bk = mix(bk, clamp(ck, vec3(0.25), vec3(1.28)), cOn);                                   // (its lichen rosettes only a breath paler than the skin: at full strength they were pale leaves stuck on the trunk)
          }
        }
        #endif
        float wet = max(1.0 - smoothstep(0.5, 2.7, vBarkP.y + 0.5 * (bk.g - 1.0)), cRoot * 0.9);    // toward the water: the roots' own bark, ragged at its upper edge (fourth holder: and on every root, to its top: the roots high on the heap wore the trunk's bark from three sides, a blur)
        vec3 rt = barkTri(tRootBark, vBarkP * uBarkP.y, bw) / vec3(0.042, 0.061, 0.045);
        rt = min(rt, vec3(2.2)) * vec3(0.92, 0.98, 0.92);
        albedo *= mix(vec3(1.0), mix(bk, rt, wet), mix(uBarkP.z, uBarkP.w, wet));
        { // (fifth holder) BARK HAS RELIEF. A root in one smooth skin, wet, was a seal: its light lay on it in one long soft gleam. The tile's own lights
          // and darks are taken for heights (the folds of the roots' bark, the lenticels and crusts of the trunk's) and the surface is turned by
          // them before any light falls on it: the moon, the wet gleam and the flames then break over it as they do over bark.
          // (the heights are read from the tile BLURRED, two steps down its pyramid: read sharp, every pixel turned its own way and the bark was sand)
          float bH = dot(mix(barkTriB(tBark, vBarkP * uBarkP.x, bw, 2.2) / vec3(0.112, 0.132, 0.116), barkTriB(tRootBark, vBarkP * uBarkP.y, bw, 2.2) / vec3(0.042, 0.061, 0.045), wet), vec3(0.3, 0.55, 0.15));
          vec3 bPx = dFdx(vWPos), bPy = dFdy(vWPos);
          vec3 bR1 = cross(bPy, N), bR2 = cross(N, bPx);
          float bDet = dot(bPx, bR1);
          vec3 bGr = sign(bDet) * (dFdx(bH) * bR1 + dFdy(bH) * bR2);
          float bK = mix(uBarkB.x * (1.0 - cCyl), uBarkB.y, wet) * (1.0 - smoothstep(0.03, 0.12, length(bPx) + length(bPy)));      // (not where a pixel is wider than a fold; not where the bole wears its bark round it: its drawing is laid otherwise)
          bK *= smoothstep(0.12, 0.5, abs(dot(N, normalize(uCameraPos - vWPos))));                                                // (nor on a flank seen edge-on: a pixel there covers a hand's breadth along the surface, and the turning is noise)
          N = normalize(abs(bDet) * N - bGr * bK);
        }
      }
      #endif`,
  };
  // THE BOLE'S DRAWING AND ITS LIGHT (third holder). Two things were wrong with the trunk from the boat. Before the hour it was a dark
  // blurred column in bright rain, where the page asks "a pale column": the house lights what stands in the shaft from the moon's
  // side only, and from the arches the rider sees its other side. But a trunk in a column of lit rain stands in light all round:
  // the rain itself is the lamp. So the bole takes less of the moon's one-sided light and a soft light from the column all round
  // it, a little more at its edges (a round thing in a bright mist has pale flanks). And its drawing was lost: paint on points
  // 7 to 17 cm apart and a fine tile cannot hold what a beech's skin shows at ten metres under the painter's brush. That is drawn
  // here, between the flares and the fork, in the trunk's own bearings and heights: the level FOLDS of the skin, a finger thick
  // with a pale roll above each, in drifts and crowded under every scar; the scars' EYES (a dark heart, a callus lip, two brows:
  // the model's own bumps, named scar0..6 in the file); LICHEN in crusts with edges. Each fades where a pixel cannot hold it.
  const scars = Array.from({ length: 7 }, () => new THREE.Vector4(0, 0, 0, 0));
  // (fourth holder) WHERE THE RAIN RUNS. The page: "the bark silver where the moon reaches and black where rain runs". A beech in rain
  // is the one tree that shows it: the water gathers in the armpits of its limbs and under every scar and comes down the smooth
  // skin in a few dark runs, black-green with what lives in them, the same runs for a hundred years; between them the skin is
  // dry silver. Drawn here in the trunk's own bearings (broad sheets from the fork, ropes, threads, a run under every scar),
  // more of them on the lee side, down over the flares into the hollows between the roots. Wet is dark and it shines: a run
  // gives back the pale opening of the dome to an eye below it, the lit rain to an eye beside it, and the chandelier once it burns.
  const UBO = { uBarkScar: { value: scars }, uBarkM: { value: new THREE.Vector4(0.72, 1, 0.45, 1) },      // x: the column's light all round the bole; y: folds; z: lichen (fourth holder: 1 before: with the tile's own lichen it made a camouflage of the trunk); w: scars
    uBarkR: { value: new THREE.Vector4(1, 0.5, 1, 1) },      // the runs of wet: x how dark; y the bearing they favour (radians, the trunk's own: the lee side); z how much they shine; w the chandelier's gold on the side that faces it
    uLfShaft: U.uLfShaft, uLfLean: U.uLfLean, uLfMoon: U.uLfMoon, uLfFireOn: U.uLfFireOn, uLfFire: U.uLfFire,
    // (sixth holder) THE TRUNK STAYS PEARL WHEN THE HOUSE IS GOLD. Kindled, it was khaki: a buff-olive post with dark blotches, the largest thing in
    // postcard 4. Grey bark took the room's warm bounce whole and, from two metres off, the lamp this module hangs low in the tree for the mound
    // ('fall'): amber on grey-green is khaki. The key painting's trunk is the cool thing in a gold room. So the bole takes a sixth of the lights
    // other things take from the fire (this uniform, as the leaves do), a third of the room's bounce ('take' below), keeps three quarters of the
    // lit rain's pearl, and has its gold from the flames themselves, on the side that faces them, high up (bFg below).
    uPoolP: { value: new THREE.Vector4(1.2, 0.7, 0.55, DV('bpool', 0.16)) } };
  if (dev.has('barkm')) UBO.uBarkM.value.fromArray(dev.get('barkm').split(',').map(Number).concat([1, 1, 1, 1]).slice(0, 4));
  if (dev.has('barkr')) UBO.uBarkR.value.fromArray(dev.get('barkr').split(',').map(Number).concat([1, 0.5, 1, 1]).slice(0, 4));
  const boleExt = {
    defines: { BARK_CYL: '' },
    uniforms: UBO,
    fragmentPars: /* glsl */`uniform vec4 uBarkScar[7]; uniform vec4 uBarkM, uBarkR, uLfShaft, uLfFire; uniform vec2 uLfLean; uniform vec3 uLfMoon; uniform float uLfFireOn;
      float bWet = 0.0, bBole = 0.0;                                                                 // how wet this point of the bole is; and whether it IS the bole (not a root, not the great limb): set where its skin is drawn, read where it is lit
      float bkHash(vec2 p) { p = fract(p * vec2(127.1, 311.7)); p += dot(p, p + 34.5); return fract(p.x * p.y); }
      float bkNoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(bkHash(i), bkHash(i + vec2(1.0, 0.0)), f.x), mix(bkHash(i + vec2(0.0, 1.0)), bkHash(i + vec2(1.0, 1.0)), f.x), f.y); }
      // (noise ROUND the trunk, k cells to the turn, without a seam behind it: th the bearing, y a height already scaled)
      float bkRing(float th, float k, float y) {
        float u = th * k / 6.2832 + k * 0.5, i = floor(u), f = fract(u), j = floor(y), g = fract(y); f = f * f * (3.0 - 2.0 * f); g = g * g * (3.0 - 2.0 * g);
        return mix(mix(bkHash(vec2(mod(i, k), j)), bkHash(vec2(mod(i + 1.0, k), j)), f), mix(bkHash(vec2(mod(i, k), j + 1.0)), bkHash(vec2(mod(i + 1.0, k), j + 1.0)), f), g); }
      // (noise round a trunk without a seam: taken along whichever level axis the bark there runs along)
      float bkRound(vec3 p, vec2 sc, float o, float w) { return mix(bkNoise(vec2(p.x * sc.x + o, p.y * sc.y)), bkNoise(vec2(p.z * sc.x - o, p.y * sc.y + 5.3)), w); }`,
    albedo: /* glsl */`
      { // ---- the bole's drawing (src/realms/theatre/tree.js)
        float bY = vBarkP.y;
        albedo *= mix(vec3(1.07, 1.0, 0.94), vec3(0.96, 1.0, 1.08), uLfFireOn);                      // (the moon in the shaft is green-pearl: a neutral grey bark went green under it. A beech's silver is a warm grey; sixth holder: and once the house is gold it is the COOL thing in the picture, a blue-pearl grey, as the key painting has it)
        albedo *= mix(0.58, 1.0, smoothstep(0.15, 2.4, bY + 0.5 * (albedo.g / max(albedo.r, 0.02) - 1.0)));      // the roots and the trunk's foot: wet, darker toward the water (they were paler than the trunk: hoses laid on the heap)
        vec2 bAx = vec2(0.12 * sin(0.33 * bY + 0.4) - 0.03, 0.10 * sin(0.26 * bY + 2.0) - 0.06);      // the trunk's own axis (beech_common.bole_axis), in the tree's X and Y
        vec2 bD = vec2(vBarkP.x - bAx.x, -vBarkP.z - bAx.y);
        float bR = length(bD), bTh = atan(bD.y, bD.x);
        float bOn = (1.0 - smoothstep(1.45, 1.9, bR)) * (1.0 - smoothstep(13.0, 14.0, bY)) * smoothstep(2.3, 3.7, bY);
        float bPx = max(length(dFdx(vBarkP)), length(dFdy(vBarkP)));                                  // the metres under one pixel
        bBole = (1.0 - smoothstep(1.5, 2.4, bR)) * (1.0 - smoothstep(13.2, 14.4, bY));
        albedo *= mix(vec3(1.0), vec3(0.66, 0.72, 0.64), (1.0 - bBole) * (1.0 - smoothstep(2.6, 4.0, bY)));      // (fourth holder: the roots: wet through and mossed, a tone and a half under the bole's silver: they were the palest thing on the heap; fifth: two tones)
        float sRun = 0.0;                                                                            // the run of wet under a scar
        if (bOn > 0.01) {
          float bW = abs(N.x) / (abs(N.x) + abs(N.z) + 1e-4);
          float bSee = 1.0 - smoothstep(0.012, 0.05, bPx);
          // the scars: eyes, and the folds that crowd under each
          float sHeart = 0.0, sLip = 0.0, sBrow = 0.0, sNear = 0.0;
          for (int i = 0; i < 7; i++) {
            vec4 sc = uBarkScar[i];
            if (sc.z > 0.0) {
              float dth = bTh - sc.x; dth = atan(sin(dth), cos(dth));
              float da = dth * 1.08, dz = bY - sc.y, k = sc.z;
              float q = length(vec2(da / (0.27 * k), dz / (0.40 * k)));
              sHeart = max(sHeart, 1.0 - smoothstep(0.40, 0.62, q));
              sLip = max(sLip, 1.0 - smoothstep(0.10, 0.30, abs(q - 0.95)));
              float inb = 1.0 - smoothstep(0.5 * k, 0.7 * k, abs(da));
              sBrow = max(sBrow, inb * max(1.0 - smoothstep(0.020, 0.045, abs(dz - (0.68 * k - 0.9 * da * da / k))), 1.0 - smoothstep(0.016, 0.036, abs(dz - (0.94 * k - 0.7 * da * da / k)))));
              sNear = max(sNear, exp(-(da * da) / (0.55 * k * k) - (dz + 0.55 * k) * (dz + 0.55 * k) / (0.6 * k * k)));
              // (fourth holder) the wet that gathers in a scar's eye runs down from its lower lip: a hand wide there, thinning, two to five metres long
              float rw = (0.11 + 0.05 * sin(dz * 2.3 + sc.x * 5.0)) * k * (0.45 + 0.55 * smoothstep(-4.5, -0.3, dz));
              sRun = max(sRun, (1.0 - smoothstep(rw * 0.6, rw, abs(da + 0.035 * sin(dz * 1.9 + sc.y)))) * (1.0 - smoothstep(-0.42 * k, -0.2 * k, dz)) * smoothstep(-2.2 - 2.6 * fract(sc.x * 3.7), -1.0, dz));
            }
          }
          // the folds of the skin: level lines a finger thick, each a wandering line of its own, there for a stretch and gone
          float fY = (bY + 0.16 * (bkRound(vBarkP, vec2(0.7, 0.45), 1.7, bW) - 0.5)) / 0.17, fId = floor(fY);
          float fF = (fract(fY) - 0.5 - 0.3 * (bkHash(vec2(fId, 3.0)) - 0.5)) * 0.17;                    // (no two folds the same distance apart)
          float fHere = smoothstep(0.48, 0.58, bkRound(vBarkP, vec2(1.15, 0.0), fId * 3.71, bW));
          float fClus = max(smoothstep(0.56, 0.72, bkRound(vBarkP, vec2(0.45, 0.33), 9.1, bW)), sNear);      // (in drifts, with long stretches of plain skin between: evenly spread they made a ringed column of it, a birch)
          float fT = 0.011 + 0.008 * bkHash(vec2(fId, 7.0));
          float fLine = (1.0 - smoothstep(fT, fT + 0.012, abs(fF))) * fHere * fClus, fLip = smoothstep(fT, fT + 0.02, fF) * (1.0 - smoothstep(0.04, 0.08, fF)) * fHere * fClus;
          albedo *= 1.0 - bOn * uBarkM.y * bSee * 0.6 * fLine;
          albedo *= 1.0 + bOn * uBarkM.y * bSee * 0.32 * fLip;
          // lichen: grey-green crusts a hand to an arm across, with edges; small white ones where a pixel can hold them
          float lM = bkRound(vBarkP, vec2(0.5, 0.4), 12.0, bW);
          float lich = smoothstep(0.60, 0.63, bkRound(vBarkP, vec2(2.1, 2.1), 4.4, bW)) * smoothstep(0.36, 0.6, lM);
          albedo = mix(albedo, albedo * 0.7 + vec3(0.085, 0.10, 0.082), bOn * uBarkM.z * 0.7 * lich);
          float lW = smoothstep(0.74, 0.77, bkRound(vBarkP, vec2(5.3, 5.3), 8.8, bW)) * smoothstep(0.45, 0.62, lM) * (1.0 - smoothstep(0.008, 0.03, bPx));
          albedo = mix(albedo, vec3(0.21, 0.23, 0.20), bOn * uBarkM.z * 0.65 * lW);
          albedo = mix(albedo, albedo * 1.45 + 0.015, bOn * uBarkM.w * 0.6 * sLip * (1.0 - sHeart));
          albedo *= 1.0 - bOn * uBarkM.w * (0.82 * sHeart + 0.5 * sBrow * bSee * (1.0 - sHeart));
        }
        { // ---- where the rain runs (fourth holder): from the fork down over the flares, into the hollows between the roots
          float rMax = mix(3.1, 1.6, smoothstep(0.5, 3.4, bY));
          float rOn = (1.0 - smoothstep(rMax, rMax + 0.5, bR)) * (1.0 - smoothstep(13.4, 14.8, bY)) * smoothstep(0.15, 0.8, bY);
          if (rOn > 0.01) {
            float thW = bTh + 0.07 * sin(bY * 0.83 + 1.0) + 0.03 * sin(bY * 2.1 + 4.0);               // a run wanders a little as it comes down
            float lee = 0.5 + 0.5 * cos(bTh - uBarkR.y), more = 0.10 * lee + 0.05 * smoothstep(7.0, 13.0, bY);      // more of them on the lee side, and under the fork where they start
            float broad = smoothstep(0.60 - more, 0.66 - more, bkRing(thW, 9.0, bY * 0.15 + 3.0));    // sheets two hands wide, the height of the trunk
            float rope = smoothstep(0.66 - more, 0.70 - more, bkRing(thW + 0.3, 21.0, bY * 0.27 + 9.0));      // ropes a hand wide, three or four metres long
            float thread = smoothstep(0.70, 0.74, bkRing(thW + 1.1, 47.0, bY * 0.4 + 2.0)) * (1.0 - smoothstep(0.012, 0.045, bPx));      // threads, where a pixel can hold them
            float run = max(max(broad * 0.9, rope), max(thread * 0.55, sRun)) * rOn;
            run *= 0.75 + 0.25 * bkNoise(vec2(bTh * 7.0, bY * 3.1));                                  // (never one flat tone)
            bWet = run;
            albedo *= mix(vec3(1.0), mix(vec3(0.30, 0.345, 0.34), vec3(0.50, 0.53, 0.50), uLfFireOn), run * uBarkR.x);      // black-green: what lives in the run (fifth holder: less black once the chandelier burns: on the gold side of the trunk its runs at full depth were the blotches of a camouflage)
            albedo *= 1.0 + 0.10 * (1.0 - run) * rOn;                                                 // (and the dry skin between them a breath paler: silver)
          }
        }
      }`,
    light: /* glsl */`
      { // ---- the column of lit rain lights the bole all round (src/realms/theatre/tree.js)
        vec2 bQ = vWPos.xz - (uLfShaft.xy + uLfLean * vWPos.y);
        float bIn = 1.0 - smoothstep(uLfShaft.z * 0.8, uLfShaft.z * 1.2, length(bQ));
        float bE = 1.0 - abs(dot(N, V));
        // (fourth holder: the great limb and the roots took this all-round light too, and a pale smooth limb lit alike above and below is a tusk:
        // they keep a third of it, and the house's moon, which falls from above, gives them their form)
        // (fifth holder: and no light at their edges: a tube with a bright rim down either side is a hose. A root is matt, mossed wood: the moon from above shows its back)
        c += uLfMoon * albedo * (uLfShaft.w * bIn * uBarkM.x * mix(0.34, 1.0, bBole) * (1.0 - ${DV('bdim', 0.25).toFixed(2)} * uLfFireOn) * (0.45 + 1.2 * bE * bE * bBole + 0.25 * max(N.y, 0.0)) * smoothstep(0.6, 2.6, vWPos.y));      // (most on its flanks: a wet round thing in a bright mist is silver at its edges; less once the chandelier burns: the eye is then set for its gold, and from the stage the bole was a chalk-white post)
        // (fourth holder) the chandelier's gold on the side of the wood that faces it: "the trunk gold on one side and pearl on the other"
        vec3 bF = uLfFire.xyz - vWPos; float bFd = length(bF); bF /= max(bFd, 1e-3);
        float bFa = uLfFireOn / (1.0 + bFd * bFd / 90.0);
        // (fifth holder: this fell on the whole trunk at half strength, foot and all, on every side but the far one: grey bark under so much amber
        // from nowhere was khaki, and the lichen on it camouflage. It falls from the FLAMES: strong on the fork and the upper bole, on what
        // faces them; by the foot, seventeen metres under them, a breath. The trunk stays a grey beech with one gold side high up.)
        float bFg = uLfFireOn / (1.0 + bFd * bFd / 36.0);
        c += albedo * vec3(1.0, 0.60, 0.25) * (uBarkR.w * 1.9 * bFg * smoothstep(0.05, 0.95, dot(N, bF)));
        // wet shines: a run of wet gives back the dome's pale opening to an eye below it, the lit rain to an eye beside it, the flames to an eye across from them
        // (fourth holder) the roots are wet through: their crests give back the dome's pale opening as a broken line, and the flames once they burn
        float bRoot = (1.0 - bBole) * (1.0 - smoothstep(1.2, 3.2, vWPos.y));
        if (bRoot > 0.01) {
          vec3 rRf = reflect(-V, N);
          float rUp = max(dot(rRf, normalize(vec3(uLfShaft.x, 38.0, uLfShaft.y) - vWPos)), 0.0); rUp *= rUp; rUp *= rUp; rUp *= rUp;
          float rFl = max(dot(rRf, bF), 0.0); rFl *= rFl; rFl *= rFl; rFl *= rFl;
          float rBr = 0.6 + 0.8 * dot(albedo, vec3(0.3, 0.55, 0.15)) / 0.12;                        // (broken by the bark's own drawing: moss does not shine)
          // (fifth holder: a third of it, and only where the bark is bare and rubbed: one unbroken gleam down a root's back was the highlight on rubber)
          float rBare = smoothstep(0.95, 1.5, rBr) * smoothstep(0.45, 0.62, bkNoise(vBarkP.xz * 2.3 + 3.7));
          c += uLfMoon * (uLfShaft.w * bIn * bRoot * uBarkR.z * (1.0 - 0.5 * uLfFireOn) * 0.07 * rUp * rBare);
          c += vec3(1.0, 0.66, 0.30) * (bRoot * uBarkR.z * 0.35 * bFa * rFl * rBare);
        }
        if (bWet > 0.01) {
          vec3 bRf = reflect(-V, N);
          float bUp = max(dot(bRf, normalize(vec3(uLfShaft.x, 38.0, uLfShaft.y) - vWPos)), 0.0); bUp *= bUp; bUp *= bUp; bUp *= bUp; bUp *= bUp;
          float bFl = max(dot(bRf, bF), 0.0); bFl *= bFl; bFl *= bFl; bFl *= bFl; bFl *= bFl;
          c += uLfMoon * (uLfShaft.w * bIn * bWet * uBarkR.z * (1.0 - 0.5 * uLfFireOn) * (0.20 * bUp + 0.07 * bE * bE * bE));      // (a thin gleam: a run is DARK first; at four times this it was a drip of white paint)
          c += vec3(1.0, 0.66, 0.30) * (bWet * uBarkR.z * 0.7 * bFa * bFl);
        }
      }`,
  };
  // (take: bark stands in the shaft itself and would burn out to white: it takes a share of the house's moon, and little of its wet gleam, so that its paint reads)
  const barkTake = dev.has('bark') ? dev.get('bark').split(',').map(Number) : [0.42, 0.14];
  const bark = (over) => H.dress('bark', { take: [1, 1, barkTake[0], 1], keep: [0.3, 1, barkTake[1], 0.1], extend: barkExt, ...over });
  const trunk = await kit.model(DIR + 'beech_trunk.glb', { ...place, ...bark({ take: [1, 1, barkTake[0], DV('bfill', 0.3)], extend: [barkExt, boleExt] }) });
  for (let i = 0; i < 7; i++) {                                              // the scars' places, from the model's own named points
    if (!trunk.points['scar' + i] || !trunk.points['scar' + i + '_top']) continue;
    const pc = trunk.point('scar' + i), pt = trunk.point('scar' + i + '_top'), y = pc.y;
    const X = pc.x - foot.x - (0.12 * Math.sin(0.33 * y + 0.4) - 0.03), Y = -(pc.z - foot.z) - (0.10 * Math.sin(0.26 * y + 2.0) - 0.06);
    scars[i].set(Math.atan2(Y, X), y, (pt.y - pc.y) / 0.4, 0);
  }
  const limbs = await kit.model(DIR + 'beech_limbs.glb', { ...place, ...bark({ wake: false, take: [1, 1, 0.44, 1], keep: [0.3, 1, barkTake[1] * 0.7, 0.1] }) });      // (seen from below against the sky: darker than the trunk)
  const crown = await kit.model(DIR + 'beech_crown.glb', { ...place, ...bark({ wake: false, crisp: true, brush: 0.2, take: [0, 0, 0.33, 1], keep: [0.3, 1, 0.15, 0.1], extend: swayExt }) });

  // ============================================================================================ the leaves
  const data = await fetch('assets/' + DIR + 'beech_sprays.json').then((r) => { if (!r.ok) throw new Error('beech_sprays.json: ' + r.status); return r.json(); });
  const share = dev.has('sprays') ? Math.max(0.05, Math.min(1, +dev.get('sprays'))) : 1;
  const cols = data.colours.map((h) => new THREE.Color(h)), tint = new THREE.Color();
  const q = new THREE.Quaternion(), e = new THREE.Euler();
  // take: nothing of the house's own moon, candles or fill (the leaves' light is above); keep: its own hue in the dark, no wet gleam
  const leafDress = () => H.dress('leaf', { brush: 0.3, take: [0, 0, 0, 0], keep: [0.8, 0.55, 0, 0], extend: leafExt });
  const sprays = [], sprayRows = [];
  for (let k = 0; k < data.kinds.length; k++) {
    const mine = data.sprays.filter((r) => r[8] === k);
    const N = Math.max(1, Math.round(kit.count(mine.length) * share)), step = mine.length / N, rows = [];
    for (let i = 0; i < N; i++) rows.push(mine[Math.min(mine.length - 1, Math.floor(i * step))]);
    // every other one first, then the rest: each half runs from the lowest up (seen from below the nearest are drawn first
    // and hide the rest), and the first half alone is a fair sample for the water's mirror
    const order = [...rows.filter((_, i) => i % 2 === 0), ...rows.filter((_, i) => i % 2 === 1)];
    const placements = order.map((r) => {
      e.setFromQuaternion(q.set(r[3], r[4], r[5], r[6]), 'YXZ');
      tint.copy(cols[r[9]]).multiplyScalar(1.3 * (1.06 - 0.38 * r[14]));    // (the palette is a leaf in full warm light; a spray's own paint averages three quarters; darker toward the heart of its mass)
      tint.g *= 1.09; tint.b *= 0.94;                                        // (fourth holder: measured from the arches, kindled, the crown's leaves stood at hue 13: brick red; the key painting's are 19 in shade and 23 by the fire. A breath toward amber)
      // (third holder: every other spray is its own mirror image, left for right, so that three models read as six: from under the
      // nearest mass two neighbours could be told for the same fan. The leaves are two-sided; the mirror turns the normals with them)
      return { position: [foot.x + r[0], r[1], foot.z + r[2]], rotation: [e.x, e.y, e.z], scale: r[13] > 0.5 ? [r[7], r[7], -r[7]] : r[7], tint: '#' + tint.getHexString() };
    });
    const set = await kit.models(DIR + 'beech_spray_' + data.kinds[k] + '.glb', placements, leafDress());
    const mesh = set.meshes[0], aLeaf = new Float32Array(order.length * 4);
    order.forEach((r, i) => aLeaf.set([r[10], r[11], r[12], r[13]], i * 4));
    mesh.geometry.setAttribute('aLeaf', new THREE.InstancedBufferAttribute(aLeaf, 4));
    mesh.name = 'beech sprays ' + data.kinds[k]; mesh.frustumCulled = false;
    drawnIn(mesh, ctx, { pre: false, mirror: 0.5, lod: () => far.sprays });
    sprays.push(set); sprayRows.push(order);
  }
  crown.group.traverse((o) => { if (o.isMesh) drawnIn(o, ctx, { pre: false }); });
  limbs.group.traverse((o) => { if (o.isMesh) drawnIn(o, ctx, { pre: false }); });

  // ============================================================================================ the mound
  // The fallen dome heaped round the trunk, the seats and the parquet the roots have lifted, the gilt rib, the drifts
  // of leaves. Its pieces of ceiling have their painted faces in a slot of their own ("sky", with UVs: each piece a
  // different part of one ceiling). Until the house's ceiling painting exists the cloud is painted here, as the
  // dome's stand-in paints it; when it does: materials: { sky: H.dress('sky', { map: thePainting }) } and nothing else.
  const skyPaint = { fragmentPars: NOISE_GLSL, albedo: /* glsl */`{ vec2 q = vUv0 * 2.4; float n = fbm(q) * 0.6 + fbm(q * 2.7 + 3.1) * 0.4, m = fbm(q * 0.55 + 9.0);
    vec3 depth = vec3(0.16, 0.30, 0.32), cloud = mix(vec3(0.78, 0.84, 0.80), vec3(0.74, 0.56, 0.56), smoothstep(0.42, 0.7, m));
    albedo *= mix(depth, cloud, smoothstep(0.38, 0.60, n)) * (0.85 + 0.3 * fbm(q * 9.0));
    albedo = mix(albedo, vec3(0.80, 0.78, 0.70) * vColor.rgb, smoothstep(0.62, 0.70, fbm(q * 5.0 + 17.0)) * 0.8); }` };      // (flaked to bare plaster in patches)
  // (the house's ceiling painting, if it is there: the kit's own fallen pieces wear it too. If it is not, the cloud painted in code above.)
  let domeMap = null;
  try { domeMap = await ctx.tex((plan.kitFloor && plan.kitFloor.art && plan.kitFloor.art.dome) || 'art/theatre/dome.webp'); } catch (err) { console.warn('theatre/tree: the dome painting did not load: the mound\'s pieces of ceiling wear cloud painted in code'); }
  // (on the painting: the hair cracks of old plaster where a pixel can hold them, and patches flaked to the bare coat)
  // (third holder: the second's cracks were the contours of a smooth noise, and read as the lines of a jigsaw. Old plaster crazes in
  // straight-sided cells: a great craquelure of cells two hands across and a fine one inside it, the paint lifting pale along the
  // great cracks)
  const skyWear = { fragmentPars: NOISE_GLSL + /* glsl */`
    float skyCrack(vec2 x) {                                                // how far a point is from the nearest edge of its cell (cells one unit across)
      vec2 n = floor(x), f = fract(x), mg = vec2(0.0), mr = vec2(0.0); float md = 8.0;
      for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) { vec2 g = vec2(float(i), float(j)); vec2 o = vec2(hash21(n + g), hash21(n + g + 17.3)); vec2 r = g + o - f; float d = dot(r, r); if (d < md) { md = d; mr = r; mg = g; } }
      md = 8.0;
      for (int j = -2; j <= 2; j++) for (int i = -2; i <= 2; i++) { vec2 g = mg + vec2(float(i), float(j)); vec2 o = vec2(hash21(n + g), hash21(n + g + 17.3)); vec2 r = g + o - f; vec2 dr = r - mr; if (dot(dr, dr) > 0.00001) md = min(md, dot(0.5 * (mr + r), normalize(dr))); }
      return md; }`,
    albedo: /* glsl */`{ vec2 q = vUv0 * 11.5; float px = length(fwidth(q));
    float c1 = skyCrack(q * 3.6 + 3.0) / 3.6, c2 = skyCrack(q * 11.0 + 11.0) / 11.0;               // metres to the nearest crack: cells of a foot, and of a hand inside them
    float see1 = 1.0 - smoothstep(0.008, 0.05, px), see2 = 1.0 - smoothstep(0.003, 0.016, px);
    float where = smoothstep(0.38, 0.62, fbm(q * 0.9 + 5.0));                                      // crazed in some places, sound in others
    albedo *= 1.0 - 0.17 * see1 * (0.2 + 0.8 * where) * (1.0 - smoothstep(0.0015, 0.004 + px, c1)) - 0.12 * see2 * where * (1.0 - smoothstep(0.001, 0.003 + px, c2));      // (sixth holder: the great cells at half their strength, and mostly where the plaster is crazed: all over a piece they were the plates of a tortoise)
    albedo *= 0.94 + 0.12 * hash21(floor(q * 3.6 + 3.0));                                           // (no two cells have kept their colour quite alike)
    albedo = mix(albedo, vec3(0.20, 0.195, 0.17), smoothstep(0.66, 0.69, fbm(q * 2.6 + 17.0)) * 0.85); }` };      // (flaked to the bare coat in small patches, a hand or two across; fourth holder: a tone and a half darker, they were splashes of white)
  // (fifth holder) THE PAINTED FACES LIE IN THE RAIN. They took twice the room's dark and so stood in both light states as pale boards lit from nowhere, the
  // largest and palest things on the heap. A painted ceiling thirty years in the rain is WET: its darks deeper, its colour richer, its clouds the only
  // pale thing; it takes the room's dark as anything does, and the moon and the fire show which way it lies; and wet paint gives back the dome's opening.
  // (sixth holder) THE FALLEN SKY. Darkened so, on the sherds the pieces now are, the painted faces were black slabs before the hour and olive ones after
  // it: nothing said "sky". Each sherd now wears a part of the ceiling's picture CHOSEN for it (mound.py, SLABS: where a pearl cloud stands against the
  // petrol depth), and keeps the picture's own values: depths a deep petrol, clouds pearl and rose. And it stays the COOL thing on the heap when the
  // house is gold, as the dome over it does: wet paint that looks up at the tear gives back the night; it takes a quarter of the fire's lamps (uPoolP,
  // as the leaves and the bole do) and a third of the room's warm bounce. Copper leaves lie on it.
  const skyWet = { uniforms: { uPoolP: { value: new THREE.Vector4(1.2, 0.7, 0.55, DV('skypool', 0.25)) } },
    // (the picture is put down again in two tones, as a scene painter lays in a sky: a deep petrol where it is dark, pearl where it is cloud, with two
    // fifths of its own colour left in it (its rose, its washed greens). By the bow lantern the picture's own pastels all came out one warm grey: a
    // dull slab. What reads from a boat, by any light, is VALUE: pale cloud shapes on a dark ground.)
    albedo: /* glsl */`{ vec3 sv = max(vColor.rgb, vec3(0.06)); vec3 st = albedo / sv;                       // the picture alone, and the piece's own stains
      float sl = dot(st, vec3(0.3, 0.55, 0.15));
      st = max(mix(vec3(sl), st, ${DV('skysat', 1.5).toFixed(2)}), 0.0);
      float sc = smoothstep(${DV('skylo', 0.13).toFixed(3)}, ${DV('skyhi', 0.36).toFixed(3)}, sl);
      vec3 two = mix(vec3(0.036, 0.085, 0.098), vec3(0.40, 0.43, 0.40), sc);
      albedo = mix(st, two * (0.7 + 0.6 * st / max(sl, 0.03) * 0.5), ${DV('skytwo', 0.62).toFixed(2)}) * (sv / 0.45) * ${DV('skygain', 0.74).toFixed(2)}; }` };
  const skyDress = domeMap ? H.dress('sky', { map: domeMap, color: '#ffffff', take: [0.5, 1, DV('skymoon', 0.8), DV('skyfill', 0.35)], keep: [0.9, DV('skydark', 1.0), 0.3, 0], brush: 0.4, extend: [skyWear, skyWet] }) : H.dress('sky', { take: [0.6, 1, 1, 1], brush: 0.5, extend: skyPaint });
  // two files along its natural joint: the ground and its drifts (mound.glb: slots "ground", "litter"), and what lies on it
  // (mound_fallen.glb: the pieces of ceiling with their painted faces, the lumps and laths, the seats, the parquet, the gilt rib)
  // the drifts wear the litter of leaves, the heap's ground the rubble of the ceiling: each tile IS the surface's local colour (the
  // model's own paint on those two slots is only its shade: the wet at the water, the mould by the trunk, the dark where things crowd)
  // (a tile's own mean is a mid-dark; times the model's shade it would be a dark: each is lifted so that its lights are the surface's lights)
  // (fifth holder) THE BLANKET OF LEAVES (mound.py, `blanket`): one soft cover over the heap, not fourteen cushions. Its tile of fallen leaves is laid at the
  // size of the leaves strewn over it (it was laid at twice that: a smeared picture), twice over at two sizes and turns so that it does not repeat,
  // dark and wet in the hollows: leaf mould under the last fall.
  const litterExt = tiles.litter ? { uniforms: { tLitter: { value: tiles.litter }, uLitterP: { value: new THREE.Vector4(DV('lits', 0.66), DV('litg', 1.7), 0, 0) } },
    fragmentPars: NOISE_GLSL + 'uniform sampler2D tLitter; uniform vec4 uLitterP;',
    albedo: /* glsl */`{ vec2 lq = vWPos.xz;
      vec3 la = texture2D(tLitter, lq / uLitterP.x).rgb, lb = texture2D(tLitter, (mat2(0.78, -0.62, 0.62, 0.78) * lq) / (uLitterP.x * 0.74) + 0.37).rgb;
      float lm = smoothstep(0.36, 0.64, vnoise(lq * 1.7 + 4.0));
      // (sixth holder: it was one saturated orange from the trunk to the shore, the brightest thing near the boat before a candle burned: mulch. Leaves that
      // have lain a year in the rain are DARK: bronze and plum-brown, wet; the last fall lies on them in drifts of copper, and those drifts are the
      // only bright thing. So: a deep tone all over, lighter in broad patches where the last fall lies thick, darkest in the hollows and toward the water)
      float lNew = smoothstep(0.42, 0.68, vnoise(lq * 0.55 + 11.0) * 0.65 + vnoise(lq * 1.9 + 3.0) * 0.35);
      vec3 lt = mix(la, lb, lm);
      float ll = dot(lt, vec3(0.3, 0.55, 0.15));
      lt = mix(vec3(ll) * vec3(1.25, 0.86, 0.80), lt, mix(0.62, 1.0, lNew));                    // old leaves: plum-brown, their copper gone
      albedo *= lt * uLitterP.y * mix(0.50, 1.12, lNew) * (0.72 + 0.28 * smoothstep(0.1, 1.2, vWPos.y)); }` } : null;
  const mound = await kit.model(DIR + 'mound.glb', { ...place, materials: {
    litter: H.dress('leaf', { ...(litterExt ? { extend: litterExt } : { color: '#6f4631' }), take: [0, 1, 0.4, 1], keep: [DV('litkeep', 0.6), 1, 0.1, 0.05], brush: 0.4 }),
    ground: H.dress('mound', { ...(tiles.rubble ? { map: tiles.rubble, triplanar: 1.9, extend: { albedo: 'albedo *= 2.6;' } } : { color: '#7d7566' }), take: [0.6, 1, 0.42, 1], keep: [0.5, 1, 0.15, 0.1], brush: 0.4 }) } });
  const fallen = await kit.model(DIR + 'mound_fallen.glb', { ...place, ...H.dress('mound', { take: [0.6, 1, 0.5, 1], keep: [0.5, 1, 0.2, 0.15] }), materials: { sky: skyDress } });
  // (third holder) its rubble, modelled: lumps and shards of plaster with scraps of the painted sky on them, lathing in torn panels, the dome's
  // joists (mound_rubble.glb). If the file is not there the mound stands without it.
  let rubble = null;
  try { rubble = await kit.model(DIR + 'mound_rubble.glb', { ...place, ...H.dress('mound', { take: [0.6, 1, 0.5, 1], keep: [0.5, 1, 0.22, 0.12], brush: 0.45 }) }); } catch (err) { console.warn('theatre/tree: mound_rubble.glb did not load: the mound stands without its rubble'); }
  // single leaves lying on it: thick on the drifts, thinner between (mound.json, in the ride's axes from the tree's foot). Never in the water's mirror.
  const md = await fetch('assets/' + DIR + 'mound.json').then((r) => { if (!r.ok) throw new Error('mound.json: ' + r.status); return r.json(); });
  let litter = null;
  {
    // a beech leaf as a folded card (third holder: the second's was five-cornered, and from three metres the mound was strewn with
    // confetti): a pointed oval, widest a third of the way along, cupped along its midrib, its tip curled; darker at the stalk
    // and along the midrib (ten triangles; its own shade is a vertex colour under the leaf's own colour)
    const L = 0.088, w = 0.027, h = 0.009;
    const pts = [[0, 0, 0], [0, 0, L * 0.30], [0, 0.001, L * 0.65], [0, 0.007, L],                                  // the midrib: stalk end .. tip
      [-w, h, L * 0.30], [-w * 0.74, h * 0.9, L * 0.65], [-w * 0.30, h * 0.7 + 0.003, L * 0.88],                       // one edge
      [w, h * 0.8, L * 0.31], [w * 0.72, h, L * 0.66], [w * 0.31, h * 0.6 + 0.003, L * 0.88]];                         // the other, not its mirror
    const shade = [0.62, 0.74, 0.8, 0.95, 1, 1, 0.97, 0.96, 1, 0.95];
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts.flat(), 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(shade.flatMap((v) => [v, v, v]), 3));
    g.setIndex([0, 4, 1, 1, 4, 5, 1, 5, 2, 2, 5, 6, 2, 6, 3, 0, 1, 7, 1, 8, 7, 1, 2, 8, 2, 9, 8, 2, 3, 9]); g.computeVertexNormals();
    const n = kit.count(md.leaves.length), SHUFFLE = n % 7919 ? 7919 : 7907, stepL = md.leaves.length / n, lc = md.colours.map((hx) => new THREE.Color(hx)), m4 = new THREE.Matrix4(), qa = new THREE.Quaternion(), qb = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), nv = new THREE.Vector3(), c3 = new THREE.Color(), _old = new THREE.Color('#5a3a36'), _s3 = new THREE.Vector3(), rl = ctx.rng(2907);
    litter = new THREE.InstancedMesh(g, H.paint('leaf', { color: '#ffffff', vertexColors: true, side: THREE.DoubleSide, brush: 0.3, take: [0, 1, 0.55, DV('leaffill', 0.6)], keep: [DV('leafkeep', 0.55), 1, 0.12, 0.05] }), n);      // (wet leaves on the ground: they keep their copper under the moon, and take little of its sheen)
    for (let i = 0; i < n; i++) {
      const r = md.leaves[Math.min(md.leaves.length - 1, Math.floor(((i * SHUFFLE) % n) * stepL))];      // (shuffled, stage 6: any first part of them is the whole heap, thinner)
      const onPiece = r[7] === 1, jit = onPiece ? 0.08 : 0.2;                 // (r[7]: it lies on a piece of the fallen ceiling, to the piece's own plane)
      nv.set(r[4] + (rl() - 0.5) * jit, 1, r[5] + (rl() - 0.5) * jit).normalize();
      qa.setFromUnitVectors(up, nv).multiply(qb.setFromAxisAngle(up, r[3]));
      // (fourth holder: a quarter over life, was half as much again and more: from three metres they were chips of orange card standing at
      // every angle. Wet leaves lie FLAT, and are dark: bronze and plum-brown with a copper one here and there; they are the heap's texture, not its subject)
      const k = (0.7 + rl() * 0.6) * 1.25;
      litter.setMatrixAt(i, m4.compose(nv.set(foot.x + r[0], r[1], foot.z + r[2]), qa, _s3.set(k * (0.85 + 0.3 * rl()), k, k)));
      const ci = r[6] === 3 && rl() < 0.6 ? 2 : r[6], bright = rl() < 0.12 ? 0.2 : 0;      // (old gold is rare on the ground; one leaf in eight still has its copper)
      // (sixth holder: with the blanket under them they were one saturated red-orange from the trunk to the shore. Seven in eight have lain a year: plum-brown
      // and bronze, their copper gone; the eighth is this autumn's)
      c3.copy(lc[ci]); if (!bright) c3.lerp(_old, 0.35 + 0.4 * rl());
      litter.setColorAt(i, c3.multiplyScalar((ci === 3 ? 0.24 : 0.27) + 0.22 * rl() + bright));
    }
    litter.name = 'leaves on the mound'; litter.frustumCulled = false; litter.instanceMatrix.needsUpdate = true; litter.instanceColor.needsUpdate = true;
    ctx.add(litter); ctx.only(litter, 'direct'); drawnIn(litter, ctx, { pre: false, lod: () => far.litter });
  }

  // ============================================================================================ the chandelier
  // The frame is the file's body: this module swings it about its hook (where its chain leaves the limb), and the hook
  // goes where the limb goes in the crown's sway. The spare chain hangs from the boss under it and swings by itself.
  // tree_chandelier.json has the hook, every candle's wick and every swag of beads, from the hook, in the ride's axes.
  const cd = await fetch('assets/' + DIR + 'tree_chandelier.json').then((r) => { if (!r.ok) throw new Error('tree_chandelier.json: ' + r.status); return r.json(); });
  const UF = { uLfFireCol: { value: new THREE.Color(0, 0, 0) } };
  // (it hangs INSIDE its own fire: the light other things take from it (ctx.light, at the house's share) would bleach it to a pale
  // lace. Its own candles light it here instead, from all round and most from above the pans: old gilt gone amber, the flames the
  // brightest thing on it)
  // (fourth holder: lit alike all round it was a pale buff basket from the arches and a wicker tray from below. Its flames stand ABOVE its
  // pans: what looks up at them is gold, what looks down is the dark of old gilt, so that from under it is a dark wheel ringed with fire
  // and from the side every hoop and leaf has a lit top and a deep underside. Its candles are wax: they glow of themselves near the flame.)
  const litExt = { uniforms: { ...UF, uPoolP: U.uPoolP }, fragmentPars: 'uniform vec3 uLfFireCol;',
    light: `{ float cWax = smoothstep(0.30, 0.55, min(albedo.r, min(albedo.g, albedo.b)));                       // (the candles are the only pale thing on it)
      c += albedo * uLfFireCol * mix(0.07 + 0.62 * smoothstep(-0.25, 0.9, N.y) + 0.10 * (1.0 - abs(N.y)), 0.75, cWax); }` };
  // (take and keep: it hangs in the shaft; with the house's whole moon and gleam on it the gilt goes to pearl and the candles' gold is lost)
  const chand = await kit.model(DIR + 'tree_chandelier.glb', { ...place, ...H.dress('gilt', { wake: false, crisp: !dev.has('chsoft'), brush: 0.3, take: [0, 0, DV('chmoon', 0.09), 1], keep: [0.7, 1, DV('chgleam', 0.2), 0.8], extend: litExt }) });      // (fifth holder: a third of the moon it took and less than half the wet gleam: before the hour it was a ball of pale grey wire in the lit rain; the page asks 'a dark gilt shape hanging under the leaves': dark old gold, a glint here and there)      // (fourth holder: crisp: it is all bars, leaves and chain a finger to a wrist thick, and from the arches the painter's brush made a pale lace of them; less of the moon, more of its own gold in the dark: a dark gilt shape before the hour)
  const frame = chand.body, spare = chand.parts.spare_chain;
  const hook = new THREE.Vector3(cd.pivot[0], cd.pivot[1], cd.pivot[2]);        // in the model's own space (from the tree's foot)
  frame.matrixAutoUpdate = false;
  if (spare) { frame.attach(spare); spare.matrixAutoUpdate = true; }
  // beads: swags of matte pearl beads on wire, strung where the script hung them; they follow the frame, a little late
  const beadAt = [], beadW = [];
  for (const sw of cd.swags) {
    const a = new THREE.Vector3(sw[0], sw[1], sw[2]), b = new THREE.Vector3(sw[3], sw[4], sw[5]), sag = sw[6];
    const len = a.distanceTo(b) * (1 + 2.2 * (sag / Math.max(0.2, a.distanceTo(b))) ** 2), n = Math.max(3, Math.round(len / 0.105));
    for (let j = 0; j < n; j++) {
      const t = (j + 0.5) / n, w = 4 * t * (1 - t);
      beadAt.push(new THREE.Vector3().lerpVectors(a, b, t).add(hook).setY(hook.y + a.y + (b.y - a.y) * t - sag * w)); beadW.push(w * Math.min(1, sag / 0.3));
    }
  }
  const beadExt = { uniforms: { ...UF, uPoolP: U.uPoolP, uBeadLag: { value: new THREE.Vector3() } }, vertexPars: 'attribute float aBead; uniform vec3 uBeadLag;', vertexLocal: 'transformed += uBeadLag * aBead;',
    fragmentPars: 'uniform vec3 uLfFireCol;', light: 'c += albedo * uLfFireCol * 0.17;' };      // (matte pearl in candlelight: warm, and quieter than the flames. Third holder: half as bright, and a third fewer of them: they were the palest thing on it, and made a lemon lace of the whole)
  const beadMat = H.paint('pearl', { color: '#c9c8b4', brush: 0.2, take: [0, 0, 0.13, 1], keep: [0.3, 1, 0.22, 0.3], extend: beadExt });      // (they hang in the moon's shaft: with the whole of it on them the beads are a white lace over the gilt, kindled or not)
  // and pearl drops: one under every other pan and round the lowest hoop, each on a hand of wire (they are the last thing to follow)
  const dropFrom = beadAt.length, dropSize = [];
  for (const d of cd.drops || []) { beadAt.push(new THREE.Vector3(d[0], d[1], d[2]).add(hook)); beadW.push(1.3); dropSize.push(d[3]); }
  const beads = new THREE.InstancedMesh(new THREE.OctahedronGeometry(0.042, 0), beadMat, beadAt.length);
  { const m = new THREE.Matrix4(), rb = ctx.rng(1600);
    beadAt.forEach((p, i) => { const k = 0.8 + 0.5 * rb(), dk = i >= dropFrom ? dropSize[i - dropFrom] : 0;
      if (dk) beads.setMatrixAt(i, m.makeScale(1.25 * dk, 2.9 * dk, 1.25 * dk).setPosition(p.x, p.y - 0.11 * dk, p.z)); else beads.setMatrixAt(i, m.makeScale(k, k * 1.15, k).setPosition(p)); }); }
  beads.geometry.setAttribute('aBead', new THREE.InstancedBufferAttribute(new Float32Array(beadW), 1));
  beads.name = 'chandelier beads'; beads.frustumCulled = false; beads.instanceMatrix.needsUpdate = true;
  frame.add(beads);
  drawnIn(beads, ctx, { pre: false, mirror: 0.6 }); drawnIn(frame, ctx, { pre: false }); if (spare) drawnIn(spare, ctx, { pre: false });
  // the candles: every wick, in the model's own space; `candleTop(i)` is where it is in the realm NOW
  const wicks = cd.candles.map((c) => ({ ring: c[0], i: c[1], at: new THREE.Vector3(c[2], c[3], c[4]).add(hook) }));
  const candleTop = (i, out = new THREE.Vector3()) => out.copy(wicks[i].at).applyMatrix4(frame.matrixWorld);

  // ============================================================================================ the fire in the tree
  // One light for the chandelier's 96 flames (they catch at c 1 to 6): on the wood, the mound, the falling leaves; the
  // leaves of the crown take it through themselves as well (leafExt). A second, fainter and lower: gold falls on the
  // mound, the water and the boat.
  const fireAt = at(ctx, C.s, C.d, 17.6);
  const fire = ctx.light({ position: fireAt, color: '#FFC27A', radius: 15, intensity: 0 });
  const fall = ctx.light({ position: at(ctx, C.s - 0.8, C.d - 1.2, 8.5), color: '#FFC27A', radius: 13, intensity: 0 });
  // and its glow in the air among the leaves: what makes it the light of the tree from across the house, and in the water's mirror
  // (a deeper gold than the tiers' candles: it is a fire in a tree; and its reflection must stand in the water as amber-gold, not lemon)
  const glow = kit.glow({ position: fireAt, color: '#FFAC50', size: 13, intensity: 0 }), glowCol = new THREE.Color('#FFAC50');
  // (fourth holder) and its burning heart: a smaller, deeper fire inside the hoops, where the three tiers' flames are thickest
  const heart = kit.glow({ position: fireAt, color: '#FF8A2A', size: 5.2, intensity: 0 }), heartCol = new THREE.Color('#FF8A2A');
  // every flame has a little halo of its own, so that from across the house the chandelier is a burning thing and not a row of
  // dots (one draw; they hang on the frame and swing with it). Each comes up as its own candle catches.
  const haloCol = new THREE.Color('#FF8E2E'), _hc = new THREE.Color();
  const halos = kit.glows(wicks.map((w) => ({ x: w.at.x, y: w.at.y + 0.07, z: w.at.z })), { color: '#000000', size: DV('halos', 1.2), intensity: DV('haloi', 1.2), flicker: 0.14, pulse: 2.2 });      // (fourth holder: larger and stronger: from the arches a ring of them must join into a ring of fire)
  frame.add(halos.points); halos.points.name = 'chandelier halos';
  let halosLit = -1;
  let treeFlames = [];
  try { treeFlames = plan.flames().filter((f) => f.where === 'tree'); } catch (err) { console.warn('theatre/tree: plan.flames() is not to be had just now: the fire in the tree follows the clock alone'); }
  U.uLfFire.value.set(fireAt.x, fireAt.y, fireAt.z, dev.has('lr') ? +dev.get('lr') : 5.6);      // (fourth holder: 8 m before: the fire reached the whole lower crown alike. The key painting's tree has a burning heart and deep red-brown shade round it)
  // The plan's 96 flames in the tree were set out on true rings; the candles are burnt to their own lengths and six arms
  // are bent. Each flame is moved to its own wick (the plan's list is the one the flames are made from), in the plan's own order.
  frame.matrix.identity(); frame.updateMatrixWorld(true);
  const flameOf = [];                                                        // wick i -> its place in plan.flames()
  if (treeFlames.length === wicks.length) {
    const all = plan.flames(), _w = new THREE.Vector3();
    let k = 0;
    all.forEach((f, j) => { if (f.where !== 'tree') return; const p = candleTop(k, _w); f.s = -p.z; f.d = p.x; f.y = p.y; flameOf[k++] = j; });
  }

  // ============================================================================================ stand-ins this replaces
  // Those in heroes.js are deleted there. The sprays' and the beads' stand-ins live in the kit's module: they are
  // taken out here once the kit has built them (the first frame), and their lines there can go.
  let cleared = false;

  const _p = new THREE.Vector3(), _q = new THREE.Vector3(), _sway = new THREE.Vector3(), _m1 = new THREE.Matrix4(), _m2 = new THREE.Matrix4(), _e = new THREE.Euler(), _lag = new THREE.Vector3();
  shared.tree = {
    foot, trunk, limbs, crown, sprays, mound, fallen, rubble, litter, fire, uniforms: U,      // (crown: the fine wood inside the masses; sprays: the three instanced sets of bough sprays)
    /** how far the crown's sway has carried a point of the realm (metres), now */
    swayAt: (p, out = new THREE.Vector3()) => swayAt(_p.copy(p).sub(foot), U.uTreeSway.value.y, U.uTreeSway.value.x * U.uTreeSway.value.w, out),
    /** the crown's masses of leaves (where leaves let go from): name, centre in the realm, radius, ring 1 (the skirt, hanging to 15 m) .. 7 (the top, above the roof); 0: on the great limb */
    masses: data.masses.map((q) => ({ name: q[0], at: new THREE.Vector3(foot.x + q[1], q[2], foot.z + q[3]), r: q[4], ring: q[5] })),
    /** where heavy drops gather and fall from: under the great limb's sag, under the ends of the heavy boughs, either side of the chandelier's chain */
    drips: [...Object.keys(trunk.points).filter((n) => n.startsWith('drip_')).map((n) => trunk.point(n)), ...Object.keys(limbs.points).filter((n) => n.startsWith('drip_')).map((n) => limbs.point(n))],
    /** where the great limb meets the front of its tier-4 box (the kit's broken bay hangs there) */
    limbAtFront: trunk.points.limb_at_front ? trunk.point('limb_at_front') : null,
    /** the mound's ground under (s, d): metres above the water (negative under it); the same arithmetic as the models' (beech_common.mound_height) */
    moundHeight: (sv, dv) => moundHeight(dv - B.d, sv - B.s), moundAt: (sv, dv) => moundHeight(dv - B.d, sv - B.s),
    /** eighteen pockets on the mound for the kit's ferns, in the realm (between the roots, clear of the rubble's larger pieces) */
    fernPockets: md.ferns.map((q) => new THREE.Vector3(foot.x + q[0], q[1], foot.z + q[2])),
    /** the crown's sway: gust (0 still air .. 1 the page's gust: three times the sway). The staging's to drive. */
    gust: 0,
    chandelier: { frame, spare, beads, halos, hook, count: wicks.length, wicks, candleTop, tilt: cd.tilt, swing: 1 },      // swing: the staging may widen it in a gust (1 = +-1.2 degrees)
  };
  const fireCol = new THREE.Color('#FFD27A');

  // The kit's horseshoe (kit_tiers.js) makes the house's flames and gives what hangs a swing: group 11 is this chandelier.
  // Its flames stand on the plan's list (moved to the wicks above) and turn about the group's pivot by the group's angles;
  // so the frame is turned by the same two angles about the same pivot (its hook), and what the group cannot say (the
  // hook going with the limb, the slow turn about the chain) is written into the 96 flames' own places every frame.
  const hookW = hook.clone().add(foot);
  const rest = wicks.map((w) => w.at.clone().add(foot));                     // every wick at rest, in the realm
  const _hs = { found: false, sw: null, aPos: null, plain: null };
  const findFlames = () => {
    _hs.found = true;
    const hs = shared.horseshoe;
    if (hs && hs.swing && hs.flames && hs.flames.mesh) { _hs.sw = hs.swing; _hs.aPos = hs.flames.mesh.geometry.attributes.aPos || null; }
    else if (shared.standIns && shared.standIns.flames && shared.standIns.flames.geometry) _hs.plain = shared.standIns.flames.geometry.attributes.aPos || null;
    // the kit strung 1,600 beads for this chandelier on the plan's true rings, before the model existed. The model hangs out
    // of true by its stays, six of its arms are bent, and its beads are strung from its own pans (above): the kit's are put away.
    const kb = hs && hs.beads, ag = kb && kb.geometry.attributes.aGroup;
    if (ag) { const z = new THREE.Matrix4().makeScale(0, 0, 0); let n = 0; for (let i = 0; i < ag.count; i++) if (Math.round(ag.getX(i)) === 11) { kb.setMatrixAt(i, z); n++; } kb.instanceMatrix.needsUpdate = true; shared.tree.kitBeadsPutAway = n; }
  };

  return {
    update() {
      if (!cleared) { cleared = true; removeStandIn(ctx, 'leaf spray'); removeStandIn(ctx, 'bead'); findFlames(); }
      if (LOD) {                                               // (stage 6: see `far`)
        const dB = Math.hypot(ctx.boat.x - foot.x, ctx.boat.z - foot.z), s01 = (a, b) => { const x = Math.min(1, Math.max(0, (dB - a) / (b - a))); return x * x * (3 - 2 * x); };
        far.sprays = 1 - 0.4 * s01(20, 34); far.litter = 1 - 0.5 * s01(14, 30);
      }
      const c = show.c, t = ctx.engine.shared.uTime.value, calm = ctx.reducedMotion ? 0.4 : 1;
      U.uTreeSway.value.y = t; U.uTreeSway.value.w = 1 + 2 * shared.tree.gust * calm;
      // ---- the chandelier: a pendulum of 4.5 s, +-1.2 degrees, a little wider across the house than along it; it turns
      // +-4 degrees about its chain in 30 s; its hook goes with the limb; the beads come after; the spare chain hangs plumb and swings
      const k = (still ? 0 : calm) * shared.tree.chandelier.swing;
      const ax = 0.021 * k * Math.sin(t * 1.3963), az = 0.012 * k * Math.sin(t * 1.2985 + 1.1), yaw = 0.07 * k * Math.sin(t * 0.2094);
      swayAt(_p.copy(hook), t, U.uTreeSway.value.x * U.uTreeSway.value.w, _sway);
      _m1.makeRotationX(az).multiply(_m2.makeRotationZ(ax)).multiply(_m2.makeRotationY(yaw));
      frame.matrix.makeTranslation(hook.x + _sway.x, hook.y + _sway.y, hook.z + _sway.z).multiply(_m1).multiply(_m2.makeTranslation(-hook.x, -hook.y, -hook.z));
      frame.updateMatrixWorld(true);
      // (where the frame's middle was 0.4 s ago, less where it is: the beads hang back by that much)
      const tb = t - 0.4, bx = 0.021 * k * Math.sin(tb * 1.3963), bz = 0.012 * k * Math.sin(tb * 1.2985 + 1.1);
      _lag.set(5.2 * (ax - bx), 0, -5.2 * (az - bz)).multiplyScalar(-1);
      beadMat.uniforms.uBeadLag.value.copy(_lag);
      // (it hangs plumb whatever the frame does, so it turns back what the frame turned; and swings +-6 degrees of its own)
      if (spare) spare.rotation.set(-az + 0.10 * k * Math.sin(t * 2.03 + 0.6), 0, -ax + 0.07 * k * Math.sin(t * 2.31));
      // ---- the fire
      let lit = 0;
      if (treeFlames.length) { for (const f of treeFlames) lit += Math.min(1, Math.max(0, (c - f.t) / 0.9)); lit /= treeFlames.length; }
      else lit = smooth(1, 6, c);
      fire.intensity = DV('firei', 1.0) * lit; fall.intensity = DV('falli', 0.3) * lit;      // (sixth holder: 0.45 before. The key painting's heap stays in the shaft's pearl when the house is gold: gold falls on it as a breath, from the fire's side)
      glow.material.color.copy(glowCol).multiplyScalar(0.26 * lit);          // (third holder: 0.36 before: its own haze washed the frame to a pale lace)
      glow.visible = lit > 0.004; glow.position.set(hook.x, hook.y - 4.6, hook.z).applyMatrix4(frame.matrixWorld);      // (fourth holder: these two had been swallowed by the comment above)
      heart.material.color.copy(heartCol).multiplyScalar(DV('hearti', 0.42) * lit); heart.visible = lit > 0.004; heart.position.set(hook.x, hook.y - 5.4, hook.z).applyMatrix4(frame.matrixWorld);
      UF.uLfFireCol.value.set(2.5, 1.25, 0.48).multiplyScalar(lit); U.uLfFireOn.value = lit;
      if (Math.abs(lit - halosLit) > 1e-4) {                                   // the halos: each with its own candle
        halosLit = lit;
        for (let i = 0; i < wicks.length; i++) { const f = treeFlames.length === wicks.length ? treeFlames[i] : null, on = f ? Math.min(1, Math.max(0, (c - f.t) / 0.9)) : lit; halos.setColor(i, _hc.copy(haloCol).multiplyScalar(on)); }
      }
      // ---- the flames ride on their wicks
      if (flameOf.length) {
        if (_hs.sw && _hs.aPos) {                                              // the horseshoe's flames: its swing turns them; the rest is written here
          _hs.sw.set(11, ax, az); _hs.sw.uniforms.uSwingPivot.value[11].copy(hookW).add(_sway);
          const cy = Math.cos(yaw), sy = Math.sin(yaw);
          for (let i = 0; i < flameOf.length; i++) { const r = rest[i], dx = r.x - hookW.x, dz = r.z - hookW.z; _hs.aPos.setXYZ(flameOf[i], hookW.x + dx * cy + dz * sy + _sway.x, r.y + _sway.y, hookW.z - dx * sy + dz * cy + _sway.z); }
          _hs.aPos.needsUpdate = true;
        } else if (_hs.plain) {                                                // the layout's stand-in flames: each is put where its wick is
          for (let i = 0; i < flameOf.length; i++) { candleTop(i, _q); _hs.plain.setXYZ(flameOf[i], _q.x, _q.y, _q.z); }
          _hs.plain.needsUpdate = true;
        }
      }
      if (dev.has('treelog') && !shared.tree.logged && ctx.time > 1) {      // &treelog=name.json: what the tree thinks, written to .shots/
        shared.tree.logged = true;
        const uni = {}; for (const kk of ['uPoolP', 'uShaft', 'uHouse', 'uMoonCol', 'uShow', 'uMoonP', 'uDarkP']) if (H.U[kk]) uni[kk] = H.U[kk].value;
        fetch('/__shot/' + dev.get('treelog'), { method: 'POST', body: JSON.stringify({ c, lit, fire: fire.intensity, sway: U.uTreeSway.value, house: ctx.look.house, uni, flames: treeFlames.length, horseshoe: !!_hs.sw, plain: !!_hs.plain, kitBeadsPutAway: shared.tree.kitBeadsPutAway, sprays: sprays.map((q) => q.count), beads: beads.count }) }).catch(() => {});
      }
    },
  };
}
