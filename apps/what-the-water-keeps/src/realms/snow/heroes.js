// The orchard in snow: THE MONUMENT. The oldest apple tree, bare and under snow, and the same tree in blossom in the water.
// What was made, how to see it and what the next people must know: docs/build/snow/2-monument.md.
//
// THE MONUMENT IS MADE OF
//   the wood        the flood orchard's own files, loaded as they are (assets/models/orchard/oldest_trunk, oldest_limbs,
//                   oldest_boughs, oldest_crown, their _twigs, limb_ends, root_knuckles; ladder_7m, basket). SHARED: the
//                   water shows the same wood. Never modelled here. The numbers beside them (oldest_crown.json,
//                   oldest_limbs.json, limb_ends.json) are what shared.tree is filled from.
//   the snow        WINTER (the direct view only). Three things, one on top of the other:
//                   (1) a coat: whatever of the wood looks up is white, drawn in the wood's own paint (`coat`, below): the
//                       line of snow on every twig, the dusting on burrs, elbows, forks, root backs;
//                   (2) `oldest_snow`: the 44 loads on the great limbs and the ridges on the boughs, modelled by script on
//                       the wood that is there (source-art/models/snow/oldest_snow.py), cut into pieces that can let go;
//                   (3) the snow on the islet, in the hollow, up the drum, on the ladder, in the crutches' forks.
//   the apples      70, WINTER, on the wood's own `apple` places
//   the blossom     MEMORY (the water only): masses on the pads of the same wood
//   the kept lamp   twice: cold with its dressing (WINTER), alight (MEMORY)
//
// shared.tree (for the cast and the staging; everything in the world):
//   centre, top, hook, flame        the foot of the bole; the top of the dome; the lamp's eye; the flame
//   limbs: { lamp, arch, west }     the three low limbs as the page gives them (points along their UNDERSIDES)
//   boughs: [{ a, b, r, order }]    every stretch of limb and bough along its axis (order 1 limbs, 2 great boughs, 3 boughs)
//   ends: [Vector3]                 every twig end (perches, sifts);   tips: [{ x, y, z, dx, dy, dz, limb, low }] the same with the way each points
//   loads: [{ a, b, r, from, to, width, depth, top, limb, on, index }]   the 44 stretches of limb top where a load lies
//   snow                            everything white on the tree: snow.visible = false writes the tree clean
//   lobes: [{ x, y, z, r, limb }]   the pads where blossom sits in the water;   crown: its object
//   apples: [Vector3], roosts, perches, props, ladder: { top, foot }, paths, sway, point(name), wood, at
// shared.lamp: { cold, lit, position (the flame), pass() }
//
// Developer switches: &clean=1 the tree with no snow on it (as it stands after the fall); &coat=0 without the painted coat;
// &wood=d8d4ee a tint over the wood's paint.
import * as THREE from 'three';
import * as lampFile from '../../engine/lamp.js';
import { removeStandIn } from '../../engine/modules.js';
import { lobeGeometry, nameAt, Pile, V } from './standins.js';

const Q = new URLSearchParams(location.search);
const DIR = 'models/orchard/', OWN = 'models/snow/';

export async function build(ctx, plan, shared) {
  const { kit, engine } = ctx, F = shared.frame, M = shared.mat, C = plan.chip, T = plan.tree, [ts, td] = T.at, memory = shared.memory, LT = shared.light;
  const rnd = ctx.rng(189);
  const treeAt = F.at(ts, td, 0), centre = treeAt.clone();
  const col = (c) => new THREE.Color(c);

  // ================================================================================================ the wood (shared)
  // The flood orchard's files, about ONE origin: the middle of the bole's foot at the waterline, the hollow facing back
  // up the avenue. This area's (189, 0) is that area's (111, 0), 78 m on, with no turn: every file stands at treeAt.
  //
  // THE COAT. In winter whatever looks up carries snow. The thick of it is modelled (oldest_snow); the thin of it, a line
  // on every twig, a dusting in every fork and on every burr, is paint: where a face of the wood looks up it is white,
  // its edge broken by noise. It is drawn only above the water (uMoCoat.x is set as each picture is drawn: the water
  // shows the same wood on another evening, bare of snow), and it goes with the fall: nothing lies above the height the
  // fall has come down to (uMoCoat.y).
  const snowLine = { value: new THREE.Vector4(1, 90, 6, Q.get('coat') === '0' || Q.has('clean') ? 0 : 1) };      // x: 1 in the direct view, 0 in the water; y: the height the fall has come down to; z: metres over which it thins there; w: how much lies at all
  const coat = (from, to, strength = 1, ragged = 0.3, low = [0.03, 0.12]) => ({
    uniforms: { uMoCoat: snowLine, uMoPaper: { value: col(C.paper) }, uMoShade: { value: col(C.lavender).lerp(col(C.paper), 0.35) } },
    fragmentPars: /* glsl */`uniform vec4 uMoCoat; uniform vec3 uMoPaper, uMoShade;
      float moHash(vec3 p) { p = fract(p * vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yxz + 33.33); return fract((p.x + p.y) * p.z); }
      float moNoise(vec3 p) { vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(mix(moHash(i), moHash(i + vec3(1.0, 0.0, 0.0)), f.x), mix(moHash(i + vec3(0.0, 1.0, 0.0)), moHash(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
                   mix(mix(moHash(i + vec3(0.0, 0.0, 1.0)), moHash(i + vec3(1.0, 0.0, 1.0)), f.x), mix(moHash(i + vec3(0.0, 1.0, 1.0)), moHash(i + vec3(1.0, 1.0, 1.0)), f.x), f.y), f.z); }`,
    albedo: /* glsl */`{
      float moN = moNoise(vWPos * 3.1) * 0.6 + moNoise(vWPos * 11.0) * 0.4;
      float moLies = smoothstep(${from.toFixed(3)}, ${to.toFixed(3)}, N.y + (moN - 0.5) * ${ragged.toFixed(3)}) * uMoCoat.x * uMoCoat.w * ${strength.toFixed(3)};
      moLies *= (1.0 - smoothstep(uMoCoat.y - uMoCoat.z, uMoCoat.y, vWPos.y + (moNoise(vWPos * 0.35) - 0.5) * 4.0)) * smoothstep(${low[0].toFixed(3)}, ${low[1].toFixed(3)}, vWPos.y);      // (and none under the water: a root's back was white all the way down into it)
      albedo = mix(albedo, mix(uMoShade, uMoPaper, smoothstep(0.25, 0.8, N.y)), moLies);
    }`,
  });
  const pixel = { value: 0.00125 };                               // how much of a metre one pixel is, a metre from the eye (update keeps it)
  /** Whatever wears the coat is told, as each picture of a frame is drawn, whether that picture is the water's. */
  const perPass = (root) => { root.traverse((o) => { if (!o.isMesh) return; const was = o.onBeforeRender; o.onBeforeRender = function (...a) { snowLine.value.x = engine.reflecting ? 0 : 1; if (this.material) this.material.uniformsNeedUpdate = true; was.apply(this, a); }; }); return root; };

  // THE PAINTED BARK AND THE LIME WASH: the flood orchard's own (its heroes.js, `barkGrain`, lifted as it stood at 21:28
  // on 7 November, without the flood's marks: no tide line, no silt, no wet on a frozen flood). The wood the rider comes
  // near (bole, roots, lamp limb, arch, limb ends) is modelled plate of bark by plate and carries UVs: u = metres round
  // the limb + 10, v = metres along it (u under 5: not bark). On those it lays that area's painted bark
  // (art/orchard/bark.webp, the picture every avenue trunk wears) and, on whatever is painted pale, its lime wash
  // (lime.webp); and from far off the bole's washed foot goes over to the wash's own even colour: THE WHITE DRUM
  // the page composes on ("lead to the white drum and the dark hollow"). When that area changes its bark, lift it again.
  // (Second look: the copy that stood here until 23:00 was the afternoon's, made for UVs that counted plates: on the
  // files as they now are it drew cells a metre wide and "shed" the wash, so the drum was dark and the daughter stem hooped.)
  // WHAT LIES UNDER THE WATER IS INK. The page: "black, slow and heavy ... nothing seen through it". The islet's turf, the
  // root flare and the limbs that go under are the orchard's and are lit by the bow lantern as it passes: through the
  // water they were an olive and tan stain round the islet. Whatever of this wood is under the surface takes the water's
  // own dark (uMoDrown), so it is not seen.
  const [tBark, tLime] = await Promise.all([ctx.tex('art/orchard/bark.webp', { repeat: true }), ctx.tex('art/orchard/lime.webp', { repeat: true })]);
  const barkGrain = {
    uniforms: { tBarkO: { value: tBark }, tLimeO: { value: tLime }, uBarkO: { value: new THREE.Vector2(Q.has('nobark') ? 0 : 0.8, Q.has('nodrum') ? 0 : 1) }, uOldAt: { value: new THREE.Vector2(treeAt.x, treeAt.z) },
      uMoDrown: { value: col(plan.water && plan.water.deep ? plan.water.deep : '#0A0913') }, uMoWeather: { value: new THREE.Vector2((plan.weather || { x: 0.33 }).x, (plan.weather || { z: 0.944 }).z).normalize() },
      // (the wash is painted mid-value for an afterglow, where it holds light of its own; under snow light, beside snow, it
      // was a grey bark. Lifted, it is the page's limewash chip: a white a step under the snow's, "lost against the snow")
      uMoFar: { value: +(Q.get('farink') || 0.58) },
      uMoWash: { value: (() => { const c = col(Q.get('washc') ? '#' + Q.get('washc') : '#c9c4c6'); return new THREE.Vector4(c.r, c.g, c.b, +(Q.get('wash') || 1.75)); })() } },      // rgb: the drum's wash as painted; w: how much every other washed thing of the tree (root backs, the daughter stem) is lifted
    fragmentPars: 'uniform sampler2D tBarkO, tLimeO; uniform vec2 uBarkO, uOldAt, uMoWeather; uniform vec3 uMoDrown; uniform vec4 uMoWash; uniform float uMoFar;',
    albedo: /* glsl */`{
        float obD = length(vViewPos), obHt = vWPos.y;
        float obLum = dot(albedo, vec3(0.3, 0.5, 0.2)), obPale = smoothstep(0.2, 0.5, obLum);
        if (vUv0.x > 5.0) {
          vec2 obUv = vec2(vUv0.x - 10.0, vUv0.y);
          float obKeep = (1.0 - smoothstep(22.0, 46.0, obD)) * uBarkO.x;
          if (obKeep > 0.0 && obPale < 0.98) {
            vec3 bk = texture2D(tBarkO, obUv * vec2(1.0 / 0.62, 1.0 / 1.25)).rgb;
            albedo *= mix(vec3(1.0), clamp(bk / vec3(0.078, 0.052, 0.074), 0.35, 2.2), obKeep * (1.0 - obPale));
          }
          vec3 lw = texture2D(tLimeO, obUv * vec2(1.0 / 0.6, 1.0 / 1.2)).rgb / vec3(0.4551, 0.3765, 0.4245);
          albedo = mix(albedo, albedo * clamp(lw, 0.22, 1.5) * uMoWash.w, obPale);
          // THE WHITE DRUM. In the flood orchard's file the bole's wash is laid plate by plate in a mid grey that holds
          // light of its own at dusk. Under snow light, beside snow, that is grey bark. Here the bole is washed whole to
          // its line: every plate white, the cracks between plates left dark, the brush's drags from the lime picture,
          // each strip of bark ending its stroke at its own height; from the avenue it is one white band.
          float obR = length(vWPos.xz - uOldAt);
          if (obR > 1.9 && obR < 3.9 && obHt < 2.4) {
            float obTop = 1.84 + 0.8 * (texture2D(tLimeO, vec2(obUv.x * 1.3, 0.37)).g - 0.2);
            float obDrum = (1.0 - smoothstep(obTop - 0.07, obTop + 0.05, obHt)) * uBarkO.y;
            float obPlate = smoothstep(0.003, 0.009, obLum);
            float obFar = smoothstep(14.0, 42.0, obD);
            albedo = mix(albedo, uMoWash.rgb * mix(clamp(lw, 0.62, 1.2), vec3(1.0), obFar), obDrum * mix(mix(0.12, 0.94, obPlate), 0.92, obFar));
          }
          // SNOW IN THE BARK'S FURROWS, up the weather side of the bole (the page: "a plaster of snow up the weather side").
          // The thick of the plaster is modelled (islet_snow); above it the storm packed the creases between the plates:
          // white lines running up the way the bark runs, thinning out by four metres up and round to the lee. Winter
          // only (uMoCoat.x: not in the water's picture), and it goes with the fall (uMoCoat.y).
          if (obR < 4.3 && obHt < 5.6) {
            float obW = smoothstep(0.05, 0.8, dot(normalize(vWPos.xz - uOldAt), uMoWeather));
            float obUp = 1.0 - smoothstep(2.2, 5.2, obHt + 2.4 * (lw.g - 0.5));
            float obFurrow = 1.0 - smoothstep(0.0035, 0.0105, obLum);
            float obRime = obFurrow * obW * obUp * uMoCoat.x * uMoCoat.w * (1.0 - smoothstep(uMoCoat.y - uMoCoat.z, uMoCoat.y, obHt));
            albedo = mix(albedo, vec3(0.83, 0.82, 0.88), 0.92 * obRime);
          }
        }
        albedo = mix(uMoDrown, albedo, smoothstep(-0.22, -0.02, obHt));
        albedo *= mix(1.0, uMoFar, smoothstep(40.0, 105.0, obD));
      }`,
  };
  // FROM FAR THE GREAT TREE IS INK (third look). The avenue's trees are inked for this light (kit_trees.js multiplies the
  // orchard's bark by #8f8798); this tree's bark is tinted lighter so that it has colour and plates when the boat is
  // under it. From the plain and from the gate, 125 and 80 m off, that left the monument paler than the small trees in
  // front of it. Beyond 40 m its wood goes over to the same ink (uMoFar; &farink=1 leaves it as it was), thick and thin.
  const farInk = { uniforms: { uMoFarT: { value: +(Q.get('farink') || 0.58) } }, fragmentPars: 'uniform float uMoFarT;', albedo: 'albedo *= mix(1.0, uMoFarT, smoothstep(40.0, 105.0, length(vViewPos)));' };
  // The high wood sways, slowly (the flood orchard's own numbers: 16 cm at the top, a period of 11 s, nothing under 9 m).
  // It moves a point by where it IS, so that the snow, the blossom and a perched bird given the same numbers move with
  // the wood: shared.tree.sway.
  const sway = { strength: ctx.reducedMotion ? 0.08 : 0.16, speed: 0.57, from: 9, to: 31, dir: [0.8, 0.6] };
  // (the orchard's bark is a plum-brown painted for an afterglow; in snow light it is ink: a cool tint takes the red out)
  const TINT = Q.get('wood') ? '#' + Q.get('wood') : '#cfcbe6';
  const woodLook = { brush: 0.85, shade: 0.8, sway, color: TINT, extend: [barkGrain, LT.dusk, LT.wet, coat(0.42, 0.7)].filter(Boolean) };
  // PLATED WOOD TAKES ALMOST NO COAT (second look). The bole, the roots, the lamp limb, the arch and the limb ends are
  // modelled plate of bark by plate, each with sloping sides: the coat above painted every plate side that looked up,
  // which left hard white dashes down the flanks of the limbs the rider passes and turned the lamp limb's falling
  // stretch into white fish scales. On these files only what lies all but level is dusted; their snow is modelled.
  const PLATED = /^(oldest_trunk|oldest_limbs|oldest_arch|limb_ends|root_knuckles)\.glb$/;
  // (Third look: and nothing at all under a man's height. Where the lamp limb and the arch go down into the water their
  // bark plates lie level: each was painted white, a litter of paper scraps on the limb at the rider's eye level. Low
  // wood carries modelled snow or none.)
  const platedLook = { extend: [barkGrain, LT.dusk, LT.wet, coat(0.86, 0.97, 1, 0.08, [1.5, 2.3])].filter(Boolean) };
  // (the buttress roots that stand out of the islet's snow and step down into the water: their backs are white, their flanks bark)
  const rootLook = { extend: [barkGrain, LT.dusk, LT.wet, coat(0.5, 0.82, 1, 0.22)].filter(Boolean) };
  // A HAIRLINE NEVER THINNER THAN THE SCREEN CAN DRAW. A twig a centimetre thick is a quarter of a pixel from 40 m: drawn
  // true it is a row of dots. So thin wood is swollen, by where the eye is, to about a pixel and a half across, out
  // to 60 m; beyond that it is let thin away to nothing by 105 m (from the plain the wood's own twigs carry the dome).
  // (Second look: it was let thin away between 60 and 105 m, "from the plain the wood's own twigs carry the dome". They do
  // not: a twig is a tenth of a pixel there, and from the two places the tree is PRESENTED from, 125 m and 80 m, the dome
  // was a dozen pale limbs with nothing between them. The hairline now holds out to the plain (HAIR[0] to HAIR[1] metres;
  // &hair=from,to tries others): the dome is densest at the bole and feathers to hairlines, as the page draws it.)
  const HAIR = (Q.get('hair') || '170,260').split(',').map(Number);
  const hair = { uniforms: { uMoPx: pixel }, vertexPars: 'uniform float uMoPx;',
    vertexWorld: `float moFar = length(wp.xyz - uCameraPos); wp.xyz += normalize(wn) * max(0.0, 0.8 * moFar * uMoPx * (1.0 - smoothstep(${HAIR[0].toFixed(1)}, ${HAIR[1].toFixed(1)}, moFar)) - 0.004);` };
  // A LINE OF SNOW ON EVERY TWIG (fourth look). The director: "snow lying along the upper side of every bough: thick on the
  // great limbs, a line on the twigs"; the page, from the plain: "a white line along the top of every stroke". The coat
  // (above) whitens only what looks straight up, and of a twig seen from a boat, from below and from the side, that is
  // nothing: all the thin wood of the tree was bare ink. Snow on a twig STANDS on it: so whatever of a thin stem looks
  // up is LIFTED (by the snow's own depth, a finger; and never by less than a pixel, as the hairline does for the wood
  // under it) and what is lifted is white. From the side and from far every stroke is ink below and white above; from
  // straight underneath the net is still ink, with white at its edges. It is winter's (not in the water's picture:
  // uMoCoat.x), it lies only on what leans less than about sixty degrees (a shoot that stands plumb is bare), and it
  // goes with the fall, from the top down (uMoCoat.y). &twigsnow=0: without; &twigsnow=1.6: deeper.
  const TWIG_SNOW = Q.has('twigsnow') ? +Q.get('twigsnow') : 1;
  const twigSnow = TWIG_SNOW > 0 ? { uniforms: { uMoCoat: snowLine },
    vertexPars: 'uniform vec4 uMoCoat; varying float vMoSnow;',
    vertexWorld: `{ float moUpV = smoothstep(0.3, 0.62, normalize(wn).y);
        vMoSnow = moUpV * uMoCoat.x * uMoCoat.w * (1.0 - smoothstep(uMoCoat.y - uMoCoat.z, uMoCoat.y, wp.y)) * smoothstep(0.5, 1.2, wp.y);
        wp.y += vMoSnow * ${TWIG_SNOW.toFixed(2)} * max(0.013, 1.1 * moFar * uMoPx * (1.0 - smoothstep(${HAIR[0].toFixed(1)}, ${HAIR[1].toFixed(1)}, moFar))); }`,
    fragmentPars: 'varying float vMoSnow;',
    albedo: 'albedo = mix(albedo, uMoPaper, smoothstep(0.4, 0.5, vMoSnow));' } : null;
  // thin wood against the sky: an ink line (`crisp`: the painter's filter leaves it as drawn), white along its top
  const twigLook = { brush: 0.35, shade: 0.5, sway, color: '#b9b4d2', crisp: true, extend: [farInk, LT.dusk, coat(0.8, 0.93, 0.85, 0), hair, twigSnow].filter(Boolean) };      // (its coat lies only on what truly looks up, and unbroken: a twig a pixel wide with a ragged coat is a row of pale dots, and the ink is lost)
  // what the flood left on the wood (petals stuck at its line; the dipped tip's flowers, modelled one by one) belongs to
  // the other evening: the water shows it, the winter does not
  const petalLook = { brush: 0.3, shade: 0.6, side: THREE.DoubleSide, extend: [LT.dusk].filter(Boolean) };
  const flowerLook = { brush: 0.25, steps: 2, shade: 0, side: THREE.DoubleSide, color: (LT.blossom && LT.blossom.side) || C.blossom, extend: [LT.holds].filter(Boolean) };
  // WHICH FILES. The flood orchard is still dividing this wood among its files (the arch and the skirt boughs were split
  // off on 7 November). The snow's script (source-art/models/snow/oldest_snow.py) lists every file of the tree it found
  // and laid snow on: the same list is loaded here, so that wood and snow are always of one making.
  const ownNumbers = async (file) => { try { const r = await fetch('assets/' + OWN + file); return r.ok ? await r.json() : null; } catch (err) { return null; } };
  const snowNumbers = await ownNumbers('oldest_snow.json');
  const FILES = (snowNumbers && snowNumbers.files) || ['oldest_trunk.glb', 'root_knuckles.glb', 'oldest_limbs.glb', 'oldest_limbs_twigs.glb', 'oldest_crown.glb', 'oldest_crown_twigs.glb', 'limb_ends.glb'];
  const wood = async (file, opts = {}) => {
    try { return await kit.model(DIR + file, { position: treeAt, ...woodLook, ...opts }); }
    catch (err) { console.error(`INVALID_MODEL snow/heroes: ${file} did not load (${(err && err.message) || err})`); return null; }
  };
  const slots = { materials: { petals: petalLook, blossom: flowerLook, thin: twigLook } };      // (thin: the limb ends' twigs, spurs and stalks, a slot of their own: kept out of the painter's filter like every twig)
  const files = {};                                               // every file by its name: trunk, limbs, limbs_twigs, arch, boughs, crown, crown_twigs, limb_ends, root_knuckles
  for (const file of FILES) files[file.replace(/^oldest_/, '').replace(/\.glb$/, '')] = await wood(file, /_twigs\.glb$/.test(file) ? twigLook : /^root/.test(file) ? { ...slots, ...rootLook, brush: 0.7 } : PLATED.test(file) ? { ...slots, ...platedLook } : slots);
  const tree = { ...files, limbTwigs: files.limbs_twigs, crownTwigs: files.crown_twigs, ends: files.limb_ends, roots: files.root_knuckles };      // (and by the names the flood orchard publishes)
  for (const m of Object.values(files)) {
    if (!m) continue;
    perPass(m.group);
    for (const [name, part] of Object.entries(m.parts)) if (name === 'petal_collar' || name === 'tip_flowers') ctx.only(part, 'mirror');
  }
  // (in the water the crown is in blossom: its thin wood, 12 to 33 m up and upside down under the masses, does not show
  // there, and it is 48,000 triangles)
  if (tree.crownTwigs) ctx.only(tree.crownTwigs.group, 'direct');
  nameAt(ctx, F, 'the oldest tree: the flood orchard\'s wood (shared)', [ts, td, 34.5]);

  // ---- what the wood says of itself (assets/models/orchard/*.json, written by its scripts): nothing here is copied by hand
  const numbers = async (file) => { try { const r = await fetch('assets/' + DIR + file); return r.ok ? await r.json() : null; } catch (err) { return null; } };
  const [nL, nC, nE] = await Promise.all([numbers('oldest_limbs.json'), numbers('oldest_crown.json'), numbers('limb_ends.json')]);
  if (!nC || !nL) console.error('INVALID_MODEL snow/heroes: the oldest tree\'s numbers (oldest_crown.json, oldest_limbs.json) did not load: no perches, loads, apples or pads');
  const at = (a) => new THREE.Vector3(a[0] + treeAt.x, a[1] + treeAt.y, a[2] + treeAt.z);
  const point = (name) => { for (const m of Object.values(files)) if (m && m.points && m.points[name]) return m.point(name); return null; };
  const tips = [], paths = [], boughs = [], ends = [];
  for (const [n, low] of [[nC, false], [nL, true], [nE, true]]) if (n && n.tips) for (const t of n.tips) tips.push({ x: t[0] + treeAt.x, y: t[1] + treeAt.y, z: t[2] + treeAt.z, dx: t[3], dy: t[4], dz: t[5], limb: t[6], low });
  for (const t of tips) ends.push(new THREE.Vector3(t.x, t.y, t.z));
  for (const n of [nL, nC]) if (n && n.limbs) for (const l of n.limbs) if (!paths.some((q) => q.name === l.name)) paths.push({ name: l.name, limb: l.no, path: l.path.map(at), radius: l.path.map((q) => q[3]) });
  for (const q of paths) { const order = /^(lamp|arch|west|nw|ne|se|sw|leader)$/.test(q.name) ? 1 : 2; for (let i = 0; i + 1 < q.path.length; i++) boughs.push({ a: q.path[i], b: q.path[i + 1], r: q.radius[i], order }); }
  if (nC && nC.boughs) for (const b of nC.boughs) { const p = b.path.map(at); for (let i = 0; i + 1 < p.length; i++) boughs.push({ a: p[i], b: p[i + 1], r: b.path[i][3], order: 3 }); }
  // the 44 loads: each a stretch of limb top (the life toolkit's makeSlabs reads from, to, width, depth; the layout's readers a, b, r)
  const loads = ((nC && nC.loads) || []).map((l, index) => {
    const top = l.top.map(at), a = top[0], b = top[top.length - 1];
    return { index, limb: l.limb, on: l.on, width: l.width, depth: Math.min(0.22, 0.12 + l.width * 0.08), top, a, b, r: l.width / 2, from: [a.x, a.y, a.z], to: [b.x, b.y, b.z] };
  });
  const pads = ((nC && nC.lobes) || []).map(([x, y, z, r, limb, n]) => ({ x: x + treeAt.x, y: y + treeAt.y - 0.3 * r, z: z + treeAt.z, r, limb, n, cx: x + treeAt.x, cy: y + treeAt.y, cz: z + treeAt.z }));
  const applePlaces = ((nC && nC.apples) || []).map(at);

  // ================================================================================================ its twig sprays (shared wood)
  // The orchard's crown ends in twigs a finger thick. Bare against a white sky the tree must go on feathering to
  // hairlines: every third twig end the wood names carries a spray (source-art/models/snow/oldest_spray.py: two of
  // them), growing on the way its twig points, turned about it, no two a size. Thin wood: crisp, white along its top
  // (the coat). Shared by the page; but in the water the crown is in blossom and none of this shows: above the water only.
  {
    const sprayLook = twigLook;
    const up = V(0, 1, 0), q = new THREE.Quaternion(), roll = new THREE.Quaternion(), mtx = new THREE.Matrix4(), dir = V(0, 0, 0), pos = V(0, 0, 0), scl = V(1, 1, 1);
    const chosen = tips.filter((t, i) => (t.low ? i % 4 === 1 : i % 3 === 0) && t.y > 1.2);
    const n = Math.min(chosen.length, kit.count(1500)), keepEvery = chosen.length / Math.max(1, n);
    const lists = [[], []];
    for (let i = 0; i < n; i++) lists[i % 2].push(chosen[Math.floor(i * keepEvery)]);
    let made = 0;
    for (const [k, file] of [[0, 'oldest_spray_a.glb'], [1, 'oldest_spray_b.glb']]) {
      const list = lists[k];
      if (!list.length) continue;
      try {
        const res = await kit.models(OWN + file, list.map((t) => ({ position: [t.x, t.y, t.z] })), sprayLook);
        const mesh = res.meshes[0];
        list.forEach((t, i) => {
          dir.set(t.dx, t.dy, t.dz).normalize(); if (dir.lengthSq() < 0.5) dir.set(0, 1, 0);
          q.setFromUnitVectors(up, dir).multiply(roll.setFromAxisAngle(up, rnd() * 6.283));
          const sc = (t.low ? 0.45 : 0.6) + rnd() * 0.5;
          mesh.setMatrixAt(i, mtx.compose(pos.set(t.x - dir.x * 0.04, t.y - dir.y * 0.04, t.z - dir.z * 0.04), q, scl.set(sc, sc * (0.85 + rnd() * 0.3), sc)));
        });
        mesh.instanceMatrix.needsUpdate = true; mesh.computeBoundingSphere(); mesh.frustumCulled = false;
        res.group.name = `the oldest tree's twig sprays: ${file} x${list.length} (shared wood, above the water)`;
        perPass(res.group); ctx.only(res.group, 'direct'); made += list.length;
      } catch (err) { console.error(`INVALID_MODEL snow/heroes: ${file} did not load (${(err && err.message) || err})`); }
    }
    shared.counts = { ...(shared.counts || {}), oldestSprays: made };
  }

  // ================================================================================================ the snow on it (winter)
  // Everything white on the tree hangs from one handle: snow.visible = false writes the tree clean (the coat goes too).
  // (Things that cannot hang IN it, because they hang on something that moves, go in `withSnow` and are shown and hidden with it:
  // the hoar on the lamp's chain, the snow on the crutches.)
  const snow = new THREE.Group(); snow.name = 'the oldest tree\'s snow (winter)'; ctx.add(snow);
  const withSnow = [];
  {
    let shown = !Q.has('clean');
    Object.defineProperty(snow, 'visible', { get: () => shown, set: (v) => { shown = !!v; snowLine.value.w = shown && Q.get('coat') !== '0' ? 1 : 0; for (const o of withSnow) o.visible = shown; } });
    snow.visible = shown;
  }
  // ---- `oldest_snow`: the 44 loads on the great limbs, and the thinner ridges on the boughs (two files, one making:
  // source-art/models/snow/oldest_snow.py lays them on the wood that is there). Every load is cut across into pieces along
  // hidden lines; a piece knows its load, how far along it lies, the limb's middle under it and its own (oldest_snow.json).
  // THE FALL is worked here, in the snow's own paint: when its load lets go a piece cracks and settles (0.4 s), rolls
  // off its limb to its heavier side (0.6 s), comes away, falls as a clod falls, turning over, and has crumbled to
  // nothing within its fall (three metres at most; less near the water, so that nothing but powder comes near a hull).
  // The powder, the whump, the rings on the water and the limb's spring are the cast's and the staging's:
  // shared.tree.fall tells them when and where (onRelease).
  const NL = Math.max(1, loads.length), lets = new Array(NL).fill(1e6);          // when each load lets go, on the fall's own clock (seconds)
  const fallU = { tMoPieces: { value: null }, uMoLet: { value: lets }, uMoShow: { value: 0 } };
  const fall = {
    loads, clock: 0, over: 0, running: false, onRelease: null,
    /** One load lets go, `delay` seconds from now. */
    release(i, delay = 0) { if (i < 0 || i >= NL) return; lets[i] = Math.min(lets[i], fall.clock + delay); loads[i].let = lets[i]; loads[i].told = false; fall.running = true; },
    /** All of them: over `over` seconds (9; 16 with reduced motion); order 'top' (the highest first, slowly at first, most of them late), 'out' (from the bole outward), or (load, i) => 0..1. */
    releaseAll({ over = ctx.reducedMotion ? 16 : 9, order = 'top' } = {}) {
      const key = typeof order === 'function' ? order : order === 'out' ? (l) => Math.hypot(l.a.x - treeAt.x, l.a.z - treeAt.z) : (l) => -l.high;
      const rank = loads.map((l, i) => [key(l, i), i]).sort((a, b) => a[0] - b[0]);
      const when = (x) => (x < 0.15 ? x / 0.15 * 0.39 : x < 0.85 ? 0.39 + (x - 0.15) / 0.7 * 0.33 : 0.72 + (x - 0.85) / 0.15 * 0.28);      // slowly at first, most of them between four tenths and seven tenths of the way
      rank.forEach(([k, i], n) => fall.release(i, over * (typeof order === 'function' ? Math.min(1, Math.max(0, k)) : when(NL > 1 ? n / (NL - 1) : 0))));
      fall.over = over;
    },
    /** Every load back on its limb. */
    reset() { lets.fill(1e6); for (const l of loads) { l.let = 1e6; l.told = false; } fall.running = false; snowLine.value.y = 90; snow.visible = true; },
    /** The boughs bare, with no show: what the `settle` of a moment already past calls. */
    clear() { lets.fill(-1e3); for (const l of loads) { l.let = -1e3; l.told = true; } fall.running = false; snowLine.value.y = -9; snow.visible = false; },
  };
  for (const l of loads) { l.let = 1e6; l.told = false; l.high = Math.max(...l.top.map((p) => p.y)); l.peel = Math.min(1.4, 0.16 * l.a.distanceTo(l.b)); l.clear = l.peel + 1.0; }
  if (snowNumbers && snowNumbers.pieces && snowNumbers.pieces.length) {
    const rows = snowNumbers.pieces, n = rows.length, data = new Float32Array(n * 16);
    let seed = 7; const rs = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    rows.forEach((r, k) => {
      const [load, kind, u, px, py, pz, ax, ay, az, cx, cy, cz, side] = r, L0 = loads[Math.min(NL - 1, Math.max(0, load))], rnd1 = rs();
      const cyw = cy + treeAt.y;
      data.set([px + treeAt.x, py + treeAt.y, pz + treeAt.z, Math.max(0, load)], k * 16);
      data.set([ax, ay, az, side], k * 16 + 4);
      data.set([cx + treeAt.x, cyw, cz + treeAt.z, kind ? 1 : u], k * 16 + 8);
      // kind; its own chance; seconds from its load's letting go to its own (a load peels from one end to the other; bough snow follows a moment later); how far it falls before it is powder
      data.set([kind, rnd1, kind ? 0.35 + 0.9 * rs() : (L0 ? L0.peel : 1), Math.min(2.9, Math.max(0.45, cyw - 2.7))], k * 16 + 12);
    });
    const tex = new THREE.DataTexture(data, 4, n, THREE.RGBAFormat, THREE.FloatType); tex.needsUpdate = true;
    fallU.tMoPieces.value = tex; ctx.onDispose(() => tex.dispose());
    const fallPars = /* glsl */`uniform sampler2D tMoPieces; uniform float uMoLet[${NL}]; uniform float uMoShow;
      vec3 moTurn(vec3 v, vec3 k, float a) { float c = cos(a), s = sin(a); return v * c + cross(k, v) * s + k * dot(k, v) * (1.0 - c); }`;
    const fallWorld = /* glsl */`{
      int moId = int(floor(uv.y + 0.5));
      vec4 m0 = texelFetch(tMoPieces, ivec2(0, moId), 0), m1 = texelFetch(tMoPieces, ivec2(1, moId), 0), m2 = texelFetch(tMoPieces, ivec2(2, moId), 0), m3 = texelFetch(tMoPieces, ivec2(3, moId), 0);
      float moT = uMoShow - (uMoLet[int(m0.w + 0.5)] + m2.w * m3.z + 0.12 * m3.y);      // seconds since this piece began to go
      if (moT > 0.0) {
        float moA = clamp(moT / 0.4, 0.0, 1.0); moA = moA * moA * (3.0 - 2.0 * moA);    // it cracks along its crest and settles
        float moB = clamp((moT - 0.35) / mix(0.65, 0.45, m3.x), 0.0, 1.0);              // it rolls off its limb, to its heavier side
        float moC = max(moT - mix(1.0, 0.8, m3.x), 0.0);                                // it comes away and falls
        float moAng = m1.w * (0.05 * moA + mix(1.15, 0.8, m3.x) * moB * moB);
        vec3 moQ = moTurn(wp.xyz - m0.xyz, m1.xyz, moAng) - vec3(0.0, 0.012 * moA, 0.0);
        vec3 moMid = moTurn(m2.xyz - m0.xyz, m1.xyz, moAng);                            // its own middle, carried round the limb
        vec3 moVel = cross(m1.xyz, moMid) * (m1.w * 1.5);                               // it leaves with the way the roll gave it
        float moDrop = 3.0 * moC * moC;                                                 // (a clod of snow: the air holds it back)
        float moKeep = 1.0 - smoothstep(0.2 * m3.w, m3.w, moDrop + 0.25 * m3.y);        // crumbling raggedly: powder within its fall
        vec3 moAx = normalize(vec3(m3.y - 0.5, 0.3, fract(m3.y * 7.31) - 0.5));
        float moSpin = moC * (2.0 + 2.2 * m3.y);
        wp.xyz = m0.xyz + moMid + moTurn(moQ - moMid, moAx, moSpin) * moKeep + moVel * moC * 0.55 - vec3(0.0, moDrop, 0.0);
        wn = moTurn(moTurn(wn, m1.xyz, moAng), moAx, moSpin);
      }
    }`;
    // The snow's paint is the area's own (shared.mat.snowPaint, whoever holds the light keeps it): a copy of it is taken,
    // sharing its every uniform, and given the wood's sway and the fall. (If that material is ever not gouache, the
    // area's `paint` makes one.)
    const base = M.snowPaint;
    let snowMat = null;
    if (base && base.isShaderMaterial && base.vertexShader.includes('//@vertexWorld') && base.vertexShader.includes('//@vertexPars')) {
      snowMat = base.clone();
      snowMat.uniforms = { ...base.uniforms, ...fallU, uWind: { value: new THREE.Vector4(sway.dir[0], sway.dir[1], sway.strength, sway.speed) } };
      snowMat.defines = { ...base.defines, SWAY: '', SWAY_FROM: Number(sway.from).toFixed(2), SWAY_TO: Number(sway.to).toFixed(2) };
      snowMat.vertexShader = base.vertexShader.replace('//@vertexPars', fallPars + '\n    //@vertexPars').replace('//@vertexWorld', fallWorld + '\n    //@vertexWorld');
      snowMat.isGouache = true;
    } else snowMat = LT.paint({ color: '#ffffff', vertexColors: true, brush: 0.35, steps: 4, sway, extend: [LT.lift, { uniforms: fallU, vertexPars: fallPars, vertexWorld: fallWorld }].filter(Boolean) });
    for (const file of ['oldest_snow.glb', 'oldest_snow_boughs.glb']) {
      try {
        const m = await kit.model(OWN + file, { position: treeAt });
        m.group.traverse((o) => { if (o.isMesh) { o.material = snowMat; o.frustumCulled = false; } });
        snow.add(m.group); m.group.updateMatrixWorld(true);
      } catch (err) { console.error(`INVALID_MODEL snow/heroes: ${file} did not load (${(err && err.message) || err})`); }
    }
  } else console.error('INVALID_MODEL snow/heroes: assets/models/snow/oldest_snow.json did not load: the tree carries only its painted coat (run source-art/models/snow/oldest_snow.py)');
  ctx.only(snow, 'direct');
  if (Q.has('fall')) fall.releaseAll({ over: +Q.get('fall') > 1 ? +Q.get('fall') : undefined });      // (&fall=1, developer: the fall from the first frame; &t= chooses the moment)

  // ================================================================================================ the islet under snow (winter)
  // Its ground and roots are the orchard's (root_knuckles, shared: the water shows it as it was). Over them, WINTER:
  // `islet_snow` (source-art/models/snow/islet_snow.py, laid on the orchard's own ground, roots and bole by casting at
  // them): the blanket, draped over the root knuckles and banked against the bole; the rim of ice it rounds over on to;
  // the keel mark at the page's (182.6, -1.5); the fourteen footprints to the hollow and back; the pits of the ladder's
  // stiles; the drift on the hollow's sill; the plaster up the drum's weather side. Named points: keel_mark,
  // print_01 .. print_14, ladder_pit, hollow_drift (shared.tree.islet.point(name)).
  let islet = null;
  try {
    islet = await kit.model(OWN + 'islet_snow.glb', { position: treeAt });
    // (Third look: THE ISLET IS SHELTERED SNOW. The area's snow paint draws the open flood on whatever is level and lies
    // low: wind-packed crust in plates, and the wind's ridges as long strokes ("the plain, the shelf's back, the islet's
    // skirts"). On thirteen metres of snow under a tree those strokes were pairs of lavender rails across the islet,
    // and the keel mark and the footprints could not be found among them. The islet wears the same paint, in the same
    // light, with the same painted tile, without the wind: uSnowWind.z (the crust) and uSnowLee.z (the strokes) are 0
    // on it; everything else is read from the area's paint every frame, so that it follows whoever holds the light.
    // &crust=1: as the area's paint has it.)
    let isletSnow = M.snowPaint, isletFollow = null;
    try {
      const base = M.snowPaint;
      if (base && base.isShaderMaterial && base.uniforms && base.uniforms.uSnowWind && base.uniforms.uSnowLee && Q.get('crust') !== '1') {
        const wind = { value: base.uniforms.uSnowWind.value.clone() }, lee = { value: base.uniforms.uSnowLee.value.clone() };
        isletSnow = base.clone();
        isletSnow.uniforms = { ...base.uniforms, uSnowWind: wind, uSnowLee: lee };
        isletSnow.isGouache = true;
        isletFollow = () => { wind.value.copy(base.uniforms.uSnowWind.value); wind.value.z = 0; lee.value.copy(base.uniforms.uSnowLee.value); lee.value.z = 0; };
        isletFollow();
        ctx.onDispose(() => isletSnow.dispose());
      }
    } catch (err) { isletSnow = M.snowPaint; isletFollow = null; }
    if (isletFollow) ctx.onUpdate(isletFollow);
    islet.group.traverse((o) => { if (o.isMesh) o.material = (o.userData.slot === 'ice' ? M.ice : isletSnow) || o.material; });
    islet.group.name = 'the islet under snow (winter)';
    ctx.only(islet.group, 'direct');
  } catch (err) {
    console.error(`INVALID_MODEL snow/heroes: islet_snow.glb did not load, the layout's dome of snow stands in (${(err && err.message) || err})`);
    const dome = kit.island({ position: [centre.x, centre.z], profile: [[0, 0.72], [2.4, 0.68], [4.4, 0.5], [6.25, 0.2], [6.45, 0.0], [6.5, -0.2]], roughness: 0.5, segments: 30, collide: false, material: M.snow, seed: 6 });
    dome.name = 'standin:the islet under snow (winter)'; ctx.only(dome, 'direct');
  }

  // ================================================================================================ its last apples (winter)
  // The 70 last apples at 10 to 28 m, on the wood's own `apple` places (twig ends). The apple is the Outlier group's
  // model (assets/models/snow/apple.glb: placed by where its stalk leaves the spur, hanging plumb; one in three pecked;
  // a cap of snow on its shoulders, a file of its own, which goes with the tree's snow). Until that file is there:
  // spheres. The sixty waxwings that feed on them are the cast's (shared.tree.apples: where each hangs).
  const apples = applePlaces.map((p) => p.clone().add(V(0, -0.012, 0)));
  if (apples.length) {
    const turn = apples.map(() => rnd() * 6.283), size = apples.map(() => 0.92 + rnd() * 0.22);
    const place = (i) => ({ position: [apples[i].x, apples[i].y, apples[i].z], turn: turn[i], scale: size[i] });
    const whole = apples.map((_, i) => i).filter((i) => i % 3 !== 1), pecked = apples.map((_, i) => i).filter((i) => i % 3 === 1);
    try {
      // RED SPARKS (third look). The page, from the gate of stumps, 80 m off: "the bare dome ... with red sparks in its upper
      // third". An apple of 7 cm is two thirds of a pixel there, and the painter's filter took even that: the tree had no
      // red in it until the boat was under it. Like its twigs, an apple is never drawn smaller than about two pixels
      // across (swollen along its own normals by where the eye is, nothing added inside 25 m), and is kept out of the
      // filter. Seventy dots of frost-bitten red: two hundredths of a per cent of the frame.
      const spark = { uniforms: { uMoPx: pixel }, vertexPars: 'uniform float uMoPx;',
        vertexWorld: `float moFarA = length(wp.xyz - uCameraPos); wp.xyz += normalize(wn) * max(0.0, ${(+(Q.get('spark') || 1.15)).toFixed(2)} * moFarA * uMoPx - 0.04) * (1.0 - smoothstep(190.0, 280.0, moFarA));` };
      const look = { brush: 0.4, shade: 0.8, sway, crisp: true, extend: [spark] };
      for (const [file, list] of [['apple.glb', whole], ['apple_pecked.glb', pecked]]) { const m = await kit.models(OWN + file, list.map(place), look); m.group.name = `the last apples: ${file} x${list.length} (winter)`; ctx.only(m.group, 'direct'); }
      const caps = await kit.models(OWN + 'apple_cap.glb', apples.map((_, i) => place(i)), { brush: 0.35, steps: 4, sway, extend: [LT.lift].filter(Boolean) });
      caps.group.name = 'the last apples: their caps of snow (winter)'; snow.add(caps.group); ctx.only(caps.group, 'direct');
    } catch (err) {
      console.error(`INVALID_MODEL snow/heroes: the apple (assets/models/snow/apple.glb, the Outlier group's) did not load: spheres stand in (${(err && err.message) || err})`);
      ctx.only(kit.instances(new THREE.SphereGeometry(0.035, 7, 5), M.apple, apples.map((p) => ({ position: [p.x, p.y - 0.04, p.z], scale: 0.9 + rnd() * 0.3 }))), 'direct').name = 'standin:the last apples (winter)';
    }
  }

  // ================================================================================================ the tree in the water (memory)
  // The same wood in blossom, drawn ONLY in the mirror. The blossom is the flood orchard's own (its module
  // src/realms/orchard/kit_blossom.js: masses gathered from this wood's twig ends, clothed in sprays, garlands along
  // the low limbs), built here for this one tree and worn as this area wears blossom: it gives its own light
  // (light.js, `holds`), in this area's tones (pink as the water is to show it), and goes with the thaw.
  // That module is another area's and is still being worked on: if it cannot be built here the masses of the layout
  // stand on the wood's pads instead, and the page errors say so. (&blossom=pads: the pads' masses, to compare.)
  let crown = null, blossom = null;
  const lobes = pads.map((p) => ({ x: p.x, y: p.y, z: p.z, r: p.r, limb: p.limb, turn: rnd() * 6.283, tall: 0.85 + rnd() * 0.4 }));
  if (tips.length && Q.get('blossom') !== 'pads') {
    try {
      const mod = await import('../orchard/kit_blossom.js');
      const holds = LT.holds || {};
      const ownLight = { ...holds, albedo: 'vec3 ownColour = albedo;\n' + (holds.albedo || '') };      // (that module's light speaks of `ownColour`: the flood orchard's dusk declares it)
      const theirs = { frame: F, tree: { tips, sway, flowers: nE && nE.flowers ? nE.flowers.map(at) : [], bare: false }, dusk: ownLight, blossomSelf: { value: new THREE.Color(0, 0, 0) }, sway, blossomLayer: 'mirror', hour: 0, counts: {} };
      const theirPlan = { trees: { trees: [], far: [], motes: [] }, tree: T, chip: { white: '#ffffff', apricot: '#000000' }, heading: () => 0 };
      const built = await mod.build(ctx, theirPlan, theirs);
      blossom = theirs.blossom;
      if (!blossom || !blossom.objects || !blossom.objects.length) throw new Error('it built nothing');
      const tones = () => { const U = blossom.uniforms || {}, B = LT.blossom || {}; if (U.uDeepB && B.under) U.uDeepB.value.copy(B.under); if (U.uShadeLoB && B.side) U.uShadeLoB.value.copy(B.side); if (U.uShadeHiB && B.top) U.uShadeHiB.value.copy(B.top); if (U.uPinkB && B.pink) U.uPinkB.value.copy(B.pink); };
      tones();
      if (built && built.update) ctx.onUpdate((dt) => { built.update(dt); tones(); });
      crown = new THREE.Group(); crown.name = 'the crown in the water (the flood orchard\'s blossom; MEMORY)'; ctx.add(crown);
      for (const o of blossom.objects) crown.add(o);
      ctx.only(crown, 'mirror');
      shared.counts = { ...(shared.counts || {}), oldestBlossom: theirs.counts && theirs.counts.blossom };
    } catch (err) {
      blossom = null;
      console.error(`INVALID_MODULE snow/heroes: the flood orchard's blossom (src/realms/orchard/kit_blossom.js) could not be worn by the tree in the water; the pads' masses stand in (${(err && err.stack) || err})`);
    }
  }
  if (!blossom && lobes.length) {
    // ---- STAND-IN: one mass on every pad of the wood (a pad is flat below and round above)
    const shades = ['#ffffff', '#f4e9ee', '#fff3ee', '#e9dde6', '#fbeef0'];
    crown = kit.instances(lobeGeometry(10, 6, 4), M.blossom, lobes.map((l, i) => ({ position: [l.x, l.y, l.z], rotation: l.turn, scale: [l.r * 2.3, l.r * 2.3 * l.tall, l.r * 2.3], color: shades[(i * 7 + (i >> 2)) % shades.length] })));
    crown.name = 'standin:the crown in the water (lobes on the wood\'s pads; MEMORY)'; ctx.only(crown, 'mirror');
  }

  // ================================================================================================ the pole ladder (shared)
  // The orchard's `ladder_7m` and `basket`, stood where the wood says the ladder stands and rests (`ladder_foot`,
  // `ladder_top`), as the flood orchard stands them.
  let ladder = null;
  {
    const foot = point('ladder_foot') || F.at(T.poleLadder.foot[0], T.poleLadder.foot[1], T.poleLadder.foot[2]), aim = point('ladder_top') || F.at(ts - 8.4, -0.4, 5.2);
    const head = foot.clone().addScaledVector(aim.clone().sub(foot).normalize(), T.poleLadder.length);
    const thin = { brush: 0.6, shade: 0.8, color: '#d2cee4', extend: [LT.dusk, LT.wet, coat(0.5, 0.8)].filter(Boolean) };
    try {
      const m = await kit.model(DIR + 'ladder_7m.glb', thin);
      const y = head.clone().sub(foot).normalize(), up = V(0, 1, 0), z = up.addScaledVector(y, -up.dot(y)).normalize(), x = V().crossVectors(y, z);
      m.group.position.copy(foot); m.group.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z)); m.group.updateMatrix(); m.group.updateMatrixWorld(true);
      perPass(m.group);
      const hang = m.point('rung_top'), yaw = Math.atan2(-x.z, x.x), rest = (Math.sin(yaw) * z.x + Math.cos(yaw) * z.z > 0 ? 1 : -1) * 0.14;
      const basket = await kit.models(DIR + 'basket.glb', [{ position: hang, rotation: [rest, yaw, 0] }], thin);
      perPass(basket.group);
      ladder = { model: m, foot, head, across: x, face: z, basket, hang, yaw, rest };
      // WINTER on it (source-art/models/snow/oldest_ladder_snow.py: each in the frame of the thing it lies on): 3 cm on
      // every rung, a cap on each stile's head; the basket full to its brim and heaped
      try {
        const sn = await kit.model(OWN + 'oldest_ladder_snow.glb', {});
        sn.group.position.copy(m.group.position); sn.group.quaternion.copy(m.group.quaternion); sn.group.updateMatrix(); sn.group.updateMatrixWorld(true);
        const heap = await kit.model(OWN + 'oldest_basket_snow.glb', { position: hang, rotation: [rest, yaw, 0] });
        for (const g of [sn.group, heap.group]) { g.traverse((o) => { if (o.isMesh) o.material = M.snowPaint || o.material; }); ctx.only(g, 'direct'); }
        sn.group.name = 'oldest_ladder_snow (winter)'; heap.group.name = 'oldest_basket_snow (winter)';
      } catch (err) { console.error(`INVALID_MODEL snow/heroes: the pole ladder's snow did not load (${(err && err.message) || err})`); }
    } catch (err) { console.error(`INVALID_MODEL snow/heroes: the pole ladder did not load (${(err && err.message) || err})`); }
  }

  // ================================================================================================ the kept lamp, twice
  // The ride's one storm lantern, where the orchard hung it: by its ring from the wrought S-hook and 0.8 m of chain
  // under the lamp limb at (174, -1), flame 2.2 m above the water, in front of the dark of the hollow. Above the water
  // it is WINTER: cold (a cap of snow, three icicles, frost on the glass: the engine's lantern brings them with `winter`).
  // In the water it is MEMORY: alight, with its halo and four moths. Its note is D5, heard as if from under the water
  // (low-passed 500 Hz). The lit lamp lights only what the water shows (light.js: memory.lamp), never the real bole or the ice.
  // (The eye it hangs from is a named point of the limb's model, `lamp_hook`: 0.8 m of chain then puts the flame at 2.2 m.)
  const Lp = plan.lamp, eye = point('lamp_hook');
  const hook = eye ? new THREE.Vector3(eye.x, eye.y, eye.z) : F.at(Lp.hook[0], Lp.hook[1], Lp.hook[2]), flame = new THREE.Vector3(hook.x, Lp.flame[2], hook.z), ring = Lp.flame[2] + 0.2;
  let lamps = lampFile;
  if (!lamps.HOLDINGS && Q.get('lamp') === 'hero') lamps = await import('../../engine/lamp-hero.js');
  const remodelled = !!lamps.HOLDINGS;
  const ownChain = tree.limbs && tree.limbs.parts.lamp_chain;       // the limb's own S-hook and links (a part of oldest_limbs.glb)
  let cold, lit;
  if (remodelled) {
    if (lamps.loadLamp) await lamps.loadLamp(['hook']);
    const base = { holding: 'hook', flame: [flame.x, flame.y, flame.z], chain: Math.max(0.3, hook.y - ring - 0.14), note: Lp.note, near: 0, light: false, visit: false };
    cold = lamps.makeKeptLamp(ctx.engine, ctx, { ...base, lit: false, winter: true, only: 'direct', moths: 0 });
    lit = lamps.makeKeptLamp(ctx.engine, ctx, { ...base, lit: true, only: 'mirror', moths: Lp.moths, reach: Lp.reach });
    if (ownChain) ownChain.visible = false;                         // (the remodelled lamp brings its own hook and chain)
  } else {
    if (!ownChain) { const p = new Pile(F); p.limb({ line: [[Lp.hook[0], Lp.hook[1], Lp.hook[2] + 0.1], [Lp.hook[0], Lp.hook[1], ring]], thick: 0.035, smooth: false, radial: 5 }, '#17151c'); p.build(ctx, 'S-hook and chain (shared)', M.timber); }
    cold = lamps.makeKeptLamp(ctx.engine, ctx, { hang: [hook.x, ring, hook.z], lit: false, note: Lp.note, near: 0, moths: 0 });
    ctx.only(cold.group, 'direct');
    lit = lamps.makeKeptLamp(ctx.engine, ctx, { hang: [hook.x, ring, hook.z], lit: true, note: Lp.note, near: 0, moths: Lp.moths, reach: Lp.reach });
    ctx.only(lit.group, 'mirror');
  }
  cold.group.name = 'kept lamp: cold (winter)'; lit.group.name = 'kept lamp: alight (memory)';
  // (FOURTH LOOK: A LARGER LANTERN. The engine's storm lantern is 0.30 m tall: in the areas where it burns its halo
  // announces it, here it hangs cold, and at the eight metres the page composes its picture from ("the cold lantern 8 m
  // ahead ... snow on its hat") it was thirty pixels of the picture's nine hundred. It hangs here a third larger, a
  // big barn lantern of 0.39 m (both of it: the one in the water is the same lantern), grown downward from the hook it
  // hangs by, so the chain and the smith's hook keep their size. &lampsize=1: as the engine makes it.)
  const LAMP_SIZE = remodelled ? Math.min(1.6, Math.max(0.8, +(Q.get('lampsize') || 1.3))) : 1;
  if (LAMP_SIZE !== 1) for (const l of [cold, lit]) if (l.lantern && l.lantern.group) l.lantern.group.scale.setScalar(LAMP_SIZE);
  // ---- `lamp_dressing` (winter): HOAR ON THE CHAIN. The engine's winter lantern brings its own cap of snow, its
  // icicles and its frosted glass (looked at first, as the page asks); its S-hook and chain are bare iron. Iron in
  // freezing fog grows hoar: feathers of ice one to four centimetres long standing out of it toward where
  // the air came from (plan.weather), on every link and on the smith's hook. 190 feathers of two triangles, grown from
  // the iron's own points, in the chain's own swinging frame (so they swing with it), above the water only.
  let hoar = null;
  const hoarOnChain = () => {
    let iron = null;
    cold.group.traverse((o) => { if (o.isMesh && o.name === 'lamp-hook-model') iron = o; });
    const pos = iron && iron.geometry.attributes.position, nor = iron && iron.geometry.attributes.normal;
    if (!pos || !nor || !pos.count) return;
    iron.updateWorldMatrix(true, false);
    const w = plan.weather || { x: 0.33, z: 0.944 }, rnd = ctx.rng(7411), FEATHERS = 200;
    const wind = new THREE.Vector3(w.x, 0.3, w.z).transformDirection(new THREE.Matrix4().copy(iron.matrixWorld).invert());
    const P = new Float32Array(FEATHERS * 18), Nn = new Float32Array(FEATHERS * 18), Cc = new Float32Array(FEATHERS * 18);
    const foot = new THREE.Color('#d6d0e4'), mid = new THREE.Color('#f1eef3'), tip = new THREE.Color('#fbf8f6');
    const p = V(0, 0, 0), n = V(0, 0, 0), g = V(0, 0, 0), sd = V(0, 0, 0), t2 = V(0, 0, 0), q = V(0, 0, 0), lit2 = V(0, 0, 0);
    // (second look: the feathers were drawn from the iron's points at random, and the smith's hook has most of the points:
    // the hook wore a tuft and the eight links hung bare, so from the boat there was no hoar. Now every hand's breadth
    // of the iron, from the eye down to the lantern's ring, grows its share, and the feathers are a little longer.)
    const upL = new THREE.Vector3(0, 1, 0).transformDirection(new THREE.Matrix4().copy(iron.matrixWorld).invert());
    const BANDS = 26, bands = Array.from({ length: BANDS }, () => []);
    let hLo = Infinity, hHi = -Infinity;
    for (let i = 0; i < pos.count; i++) { const h = p.fromBufferAttribute(pos, i).dot(upL); hLo = Math.min(hLo, h); hHi = Math.max(hHi, h); }
    for (let i = 0; i < pos.count; i++) bands[Math.min(BANDS - 1, Math.floor((p.fromBufferAttribute(pos, i).dot(upL) - hLo) / Math.max(1e-6, hHi - hLo) * BANDS))].push(i);
    const share = Math.ceil(FEATHERS / BANDS);
    let made = 0;
    for (const band of bands) for (let got = 0, tries = 0; band.length && got < share && made < FEATHERS && tries < share * 40; tries++) {
      const i = band[Math.floor(rnd() * band.length)];
      p.fromBufferAttribute(pos, i); n.fromBufferAttribute(nor, i).normalize();
      if (rnd() > Math.min(1, Math.max(0.06, 0.3 + 0.9 * n.dot(wind)))) continue;         // (thick on the weather side, a few all round)
      g.copy(wind).multiplyScalar(0.5 + 0.5 * rnd()).addScaledVector(n, 0.5).add(t2.set(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).multiplyScalar(0.7)).normalize();
      if (g.dot(n) < 0.1) g.addScaledVector(n, 0.6).normalize();
      sd.crossVectors(g, Math.abs(g.y) < 0.9 ? t2.set(0, 1, 0) : t2.set(1, 0, 0)).normalize();
      const turn = rnd() * Math.PI; sd.multiplyScalar(Math.cos(turn)).addScaledVector(t2.crossVectors(g, sd), Math.sin(turn)).normalize();
      const len = 0.018 + 0.034 * rnd() * rnd(), wide = len * (0.2 + 0.14 * rnd());
      p.addScaledVector(n, -0.0015);
      lit2.copy(n).add(t2.set(0, 0.7, 0)).normalize();
      const put = (k, v, c) => { const o = made * 18 + k * 3; P[o] = v.x; P[o + 1] = v.y; P[o + 2] = v.z; Nn[o] = lit2.x; Nn[o + 1] = lit2.y; Nn[o + 2] = lit2.z; Cc[o] = c.r; Cc[o + 1] = c.g; Cc[o + 2] = c.b; };
      const left = q.copy(p).addScaledVector(g, len * 0.42).addScaledVector(sd, wide).clone(), right = q.copy(p).addScaledVector(g, len * 0.42).addScaledVector(sd, -wide).clone(), end = q.copy(p).addScaledVector(g, len).clone();
      put(0, p, foot); put(1, left, mid); put(2, end, tip); put(3, p, foot); put(4, end, tip); put(5, right, mid);
      made++; got++;
    }
    if (!made) return;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(P.subarray(0, made * 18), 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(Nn.subarray(0, made * 18), 3));
    geo.setAttribute('color', new THREE.BufferAttribute(Cc.subarray(0, made * 18), 3));
    geo.computeBoundingSphere();
    hoar = new THREE.Mesh(geo, kit.gouache({ color: '#ffffff', vertexColors: true, brush: 0.15, steps: 4, side: THREE.DoubleSide, crisp: true, extend: [LT.dusk, LT.lift].filter(Boolean) }));
    hoar.name = 'lamp_dressing: hoar on the chain and the hook (winter)';
    hoar.position.copy(iron.position); hoar.quaternion.copy(iron.quaternion); hoar.scale.copy(iron.scale);
    iron.parent.add(hoar); ctx.only(hoar, 'direct');
    withSnow.push(hoar); hoar.visible = snow.visible;
  };
  if (remodelled && cold.ready && !Q.has('clean')) cold.ready.then(() => { try { hoarOnChain(); } catch (err) { console.error(`INVALID_MODULE snow/heroes: the hoar on the lamp's chain was not made (${(err && err.message) || err})`); } });
  // ---- `lamp_dressing`, the rest (third look): RIME ON THE BRASS. The engine's lantern is brass, and under snow light its
  // font was a saturated ochre: the one yellow thing above the water, in an area that keeps amber for the water and red
  // for the apples ("cold ... pale against the hollow"). A lantern left out for months of freezing fog is furred white:
  // the cold lamp's body is repainted here in its own colours under rime (thickest on what looks up, thin underneath,
  // so that it is still a made thing of metal). The lit lamp in the water is the engine's own brass. (&brass=1: without.)
  // (FOURTH LOOK: THE COLD LANTERN IS DRAWN IN INK. As found it could not be seen: from 14 m, 8 m and 4 m alike it was a
  // pale ghost with a grey foot (.shots/snow_m4_b07_lamp_zoom_crop.png, snow_m4_e02_lamp8m.png). Three causes. Its
  // pewter was painted a mid grey, which this light shows as pale. Its frame is wire a few millimetres thick, and the
  // painter's filter wipes out whatever is thinner than its brush: bail, tubes, guard and chain were gone. And its
  // frosted glass is the sky's own white. The kept lamp is the area's thread, "the same silhouette as in every other
  // area", and the lie needs it: "the cold lamp over the lit one". So, on the cold lamp only:
  //   - its iron (frame, font, crown, and the smith's hook and chain) is INK, like the twigs it hangs among, kept out of
  //     the painter's filter (crisp), with hoar white on whatever looks up and a rime on its weather side;
  //   - its glass is frosted BUT NOT BLANK: frost has bloomed over it from the rim and the foot, a cold blue-white, and
  //     where the bloom has not closed the glass is clear and shows the dark of the cold lamp's inside (lavender to
  //     wash): against the sky it is a small globe with a dark heart in an ink frame, against the hollow it is pale;
  //   - its cap of snow and its icicles (the engine's) wear the area's own snow light, crisp.
  // The lit lamp in the water is the engine's own in every part. &brass=1: the cold lamp as the engine makes it.)
  if (remodelled && cold.ready && Q.get('brass') !== '1') cold.ready.then(() => {
    try {
      const Ln = cold.lantern;
      if (!Ln || !Ln.body || !Ln.body.isMesh) return;
      const seenAs = (hex) => (shared.seen ? shared.seen(hex) : col(hex));
      const w = plan.weather || { x: 0.33, z: 0.944 }, wl = Math.hypot(w.x, w.z) || 1;
      const frost = col(C.frost || '#D6DDEF'), ink = col(C.inkPaint || '#19141F');
      const ironU = { uMoInk: { value: ink }, uMoRime: { value: new THREE.Vector4(frost.r * 0.5, frost.g * 0.5, frost.b * 0.5, +(Q.get('rime') || 1)) }, uMoWx: { value: new THREE.Vector2(w.x / wl, w.z / wl) } };
      const iron = { uniforms: ironU, fragmentPars: 'uniform vec3 uMoInk; uniform vec4 uMoRime; uniform vec2 uMoWx;',
        albedo: /* glsl */`{ float moLum = dot(albedo, vec3(0.3, 0.5, 0.2));
          vec3 moIron = uMoInk * (0.8 + 1.8 * moLum);                         // (the model's own paint is kept as a breath of form in the ink)
          float moGrain = fract(sin(dot(floor(vWPos * 380.0), vec3(12.9898, 78.233, 37.719))) * 43758.5453);
          float moUp = smoothstep(0.62, 0.9, N.y);                             // hoar on what looks UP: the crown, the font's shoulder, the top of a wire or a link (a line of white along it, the ink left under it)
          float moSide = smoothstep(0.3, 0.95, dot(N.xz, uMoWx)) * (1.0 - smoothstep(0.0, 0.5, -N.y));       // ... and a rime, in single grains, on the side the weather came from
          albedo = mix(moIron, uMoRime.rgb, clamp(moUp + 0.5 * moSide * smoothstep(0.66, 0.9, moGrain), 0.0, 1.0) * uMoRime.w); }` };
      const ironMat = kit.gouache({ color: '#ffffff', vertexColors: true, brush: 0.15, crisp: true, extend: [iron] });
      const glassU = { uMoGl: { value: new THREE.Vector4(flame.x, flame.y, flame.z, +(Q.get('bloom') || 1)) }, uMoGlS: { value: LAMP_SIZE }, uMoGlPale: { value: seenAs('#DCE1F1') }, uMoGlRim: { value: seenAs(C.lavender || '#B4AED0') }, uMoGlHeart: { value: seenAs('#5F5A82') } };
      ctx.onUpdate(() => { const q = cold.position; if (q && q.lengthSq() > 0) { const g = glassU.uMoGl.value; g.x = q.x; g.y = q.y; g.z = q.z; } });      // (the wick's place, as the lantern swings)
      const glass = { uniforms: glassU,
        fragmentPars: /* glsl */`uniform vec4 uMoGl; uniform float uMoGlS; uniform vec3 uMoGlPale, uMoGlRim, uMoGlHeart;
          float moGH(vec3 p) { p = fract(p * vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yxz + 33.33); return fract((p.x + p.y) * p.z); }
          float moGN(vec3 p) { vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
            return mix(mix(mix(moGH(i), moGH(i + vec3(1.0, 0.0, 0.0)), f.x), mix(moGH(i + vec3(0.0, 1.0, 0.0)), moGH(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
                       mix(mix(moGH(i + vec3(0.0, 0.0, 1.0)), moGH(i + vec3(1.0, 0.0, 1.0)), f.x), mix(moGH(i + vec3(0.0, 1.0, 1.0)), moGH(i + vec3(1.0, 1.0, 1.0)), f.x), f.y), f.z); }`,
        // (the glass mesh's paint is the engine's own channels: red = the smoked top of the globe. Its colour is laid here.)
        albedo: /* glsl */`{ float gSoot = vColor.r;
          float gNdv = clamp(abs(dot(N, normalize(uCameraPos - vWPos))), 0.0, 1.0);
          vec3 gq = (vWPos - uMoGl.xyz) / uMoGlS;                             // metres from the wick, at the lantern's own size: the globe stands from 0.028 under it to 0.085 over it
          float gUp = clamp((gq.y + 0.028) / 0.113, 0.0, 1.0);                // 0 at its foot .. 1 at its crown
          // frost grows in from the foot, the crown and the rim, in feathers: what is left clear is a ragged heart
          vec3 gp = gq * uMoGlS;
          float gFern = moGN(gp * 62.0) * 0.5 + moGN(gp * 170.0 + 3.7) * 0.25 + abs(moGN(gp * 28.0 + 9.1) - 0.5) * 0.5;
          float gEdge = max(pow(1.0 - gNdv, 0.8), max(smoothstep(0.42, 0.0, gUp), smoothstep(0.66, 1.0, gUp)));
          float gBloom = smoothstep(0.52, 0.8, gFern + 0.7 * gEdge) * uMoGl.w;
          vec3 gClear = mix(uMoGlHeart, uMoGlRim, 0.35 + 0.4 * (1.0 - gNdv)) * (1.0 - 0.45 * gSoot);
          albedo = mix(gClear, mix(uMoGlPale, uMoGlRim, 0.55 * pow(1.0 - gNdv, 1.5)), gBloom);
          alpha = 1.0; }`,
        light: 'c = albedo + albedo * lamps * 0.6;' };      // (authored as it is to be seen; the bow lantern still warms it as it passes)
      const glassMat = kit.gouache({ color: '#ffffff', vertexColors: true, brush: 0, shade: 0, crisp: true, extend: [glass] });
      const capMat = kit.gouache({ color: '#ffffff', vertexColors: true, brush: 0.15, steps: 4, crisp: true, extend: [LT.lift].filter(Boolean) });
      const put = [];
      const dress = (mesh, mat) => { if (!mesh || !mesh.isMesh) return; const was = mesh.material, wasOrder = mesh.renderOrder; mesh.material = mat; put.push(() => { mesh.material = was; mesh.renderOrder = wasOrder; }); };
      dress(Ln.body, ironMat);
      dress(Ln.glass, glassMat); if (Ln.glass) Ln.glass.renderOrder = 0;      // (opaque now: drawn with the solid things, in the depth)
      dress(Ln.snow, capMat);
      cold.group.traverse((o) => { if (o.isMesh && o.name === 'lamp-hook-model') dress(o, ironMat); });
      ctx.onDispose(() => { for (const undo of put) undo(); });
    } catch (err) { console.error(`INVALID_MODULE snow/heroes: the cold lantern's winter dress was not made (${(err && err.message) || err})`); }
  });
  memory.keepLampCold();                                          // (after the lamps: whatever they wrote this frame is put out above the water)
  // From the plain the lit lamp is "one amber stroke at the road's end", 110 m off, where the lantern itself is two
  // pixels: it is given a far glow of the same amber in the water only, which hands over to the lantern as the boat
  // comes near (nothing of it is left inside 14 m). (The flood orchard's layout found the same.)
  const far = kit.glow({ position: [flame.x, flame.y, flame.z], color: C.lamp, size: 3.2, intensity: 2.6 });
  far.name = 'kept lamp: far glow (memory)'; ctx.only(far, 'mirror');
  const farColor = far.material.color.clone();
  // ... and near to, the ride's present lantern is a nine-pixel flame in the water, which the water's own softness all
  // but puts out: its halo in the water is given here (the remodelled lamp brings its own shine for the mirror).
  const near = remodelled ? null : kit.glow({ position: [flame.x, flame.y, flame.z], color: C.lamp, size: 1.5, intensity: 3.2 });
  if (near) { near.name = 'kept lamp: its halo in the water (memory)'; ctx.only(near, 'mirror'); }
  // THE STROKE. "The only light that lays a long vertical stroke on the water (visible from the plain, 110 m off)".
  // This water is the ride's stillest mirror (it carries half the cast), and a mirror gives a lamp back as a point: the
  // water's own columns need wavelets, and with them every pale thing in the water is drawn out as well (1-layout.md).
  // So the stroke is the area's own: a column of amber light standing over the lit lamp, drawn only in the mirror, where
  // it lies down the water from the lamp toward whoever looks (what stands higher is mirrored nearer). It thins and
  // breaks into dashes away from the lamp, is never thinner than the screen can draw, and pans crossing it cut it.
  // (Whoever holds the light may take it out by its name and make the stroke the water's own: 2-light.md.)
  const strokeU = { uTime: ctx.engine.shared.uTime, uFogDensity: ctx.engine.shared.uFogDensity, uVeil: ctx.engine.shared.uVeil, uColor: { value: new THREE.Color(C.lamp).multiplyScalar(4.6) }, uCore: { value: new THREE.Color(C.lampCore).multiplyScalar(5.5) }, uLevel: { value: 1 }, uTall: { value: Lp.stroke } };
  const stroke = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 1, 24).translate(0, 0.5, 0), new THREE.ShaderMaterial({
    uniforms: strokeU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
    vertexShader: /* glsl */`uniform float uTall; varying vec2 vUv; varying float vDist;
      void main() {
        vUv = uv;
        vec3 foot = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz, toEye = cameraPosition - foot;
        float far = length(toEye.xz);
        vec3 side = normalize(vec3(toEye.z, 0.0, -toEye.x));
        float wide = max(0.22, 0.006 * far);                                 // never under about three pixels
        vec3 wp = foot + side * (uv.x - 0.5) * wide + vec3(0.0, uv.y * uTall, 0.0);
        vec4 mv = viewMatrix * vec4(wp, 1.0); vDist = length(mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`uniform vec3 uColor, uCore; uniform float uTime, uFogDensity, uVeil, uLevel, uTall; varying vec2 vUv; varying float vDist;
      float hash(float n) { return fract(sin(n * 127.1) * 43758.5453); }
      float vn(float x) { float i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f); return mix(hash(i), hash(i + 1.0), f); }
      void main() {
        float x = abs(vUv.x - 0.5) * 2.0, h = vUv.y * uTall;
        float across = exp(-x * x * 5.0) * (1.0 - smoothstep(0.75, 1.0, x));
        float along = exp(-h / (0.42 * uTall)) * (1.0 - smoothstep(0.8, 1.0, vUv.y));
        // dashes: whole near the lamp, broken further off, each slowly coming and going
        float dash = mix(1.0, smoothstep(0.32, 0.62, vn(h * 2.6 + uTime * 0.22) * 0.6 + vn(h * 0.9 - uTime * 0.1) * 0.5), smoothstep(0.6, 3.5, h));
        float a = across * along * dash * uLevel * (1.0 - uVeil) * exp(-uFogDensity * uFogDensity * vDist * vDist * 0.35);     // (a flame is seen through mist long after the things round it are gone)
        if (a < 0.003) discard;
        gl_FragColor = vec4(mix(uColor, uCore, exp(-x * x * 18.0) * exp(-h / 1.2)) * a, 1.0);
      }`,
  }));
  stroke.position.copy(flame); stroke.name = 'kept lamp: its stroke on the water (memory)'; stroke.frustumCulled = false; stroke.renderOrder = 3; ctx.only(ctx.add(stroke), 'mirror');
  // ================================================================================================ the nine crutches' winter
  // The crutches are the kit's (kit_trees.js: the flood orchard's crutch_A .. crutch_H, forked poles and shear legs,
  // stood where this wood says each limb bears), and the kit builds AFTER this module: so their winter is put on from
  // the first update, when they stand. Nothing here knows a design by name: crutch_snow.json (written by
  // source-art/models/snow/crutch_snow.py from the orchard's own files) says, for every design, where each of its
  // poles runs and whether it has a snow file. Whatever matrix the kit gave a crutch, its snow takes the same
  // (crutch_<X>_snow is in the crutch's own frame: a cap on each prong of a forked pole, a ridge along the pole lashed
  // across shear legs), and a collar of ice (crutch_ice) is laid on the water round EACH of its poles exactly where
  // that pole goes through, at the pole's own thickness there, its rime leaning as the pole leans. Only the crutches
  // that stand at this tree's own props are dressed (the avenue's are the kit's). The layout's stand-in for all this
  // lives in kit.js and is taken out here, by name.
  const crutchTable = ((await ownNumbers('crutch_snow.json')) || {}).designs || {};
  const held = async (file, n, material) => {                      // (made now, empty: filled when the kit's crutches stand)
    try {
      const m = await kit.models(OWN + file, Array.from({ length: n }, () => ({ position: [0, -60, 0] })), { brush: 0.4 });
      const mesh = m.meshes[0]; mesh.count = 0; mesh.frustumCulled = false; if (material) mesh.material = material;
      ctx.only(m.group, 'direct'); return mesh;
    } catch (err) { console.error(`INVALID_MODEL snow/heroes: ${file} did not load (${(err && err.message) || err})`); return null; }
  };
  const capMesh = {};
  for (const [kind, d] of Object.entries(crutchTable)) {
    if (!d.snow) continue;
    capMesh[kind] = await held(`${kind}_snow.glb`, 9, M.snowPaint);
    if (capMesh[kind]) { capMesh[kind].name = `${kind}_snow: the snow on a crutch of this design (winter)`; withSnow.push(capMesh[kind]); capMesh[kind].visible = snow.visible; }
  }
  const COLLARS = 18;                                              // (nine crutches, and shear legs stand on two poles)
  const iceMesh = await held('crutch_ice.glb', COLLARS, M.ice);
  if (iceMesh) iceMesh.name = 'crutch_ice: collars of ice round the poles of the nine crutches (winter)';
  const crutches = { tries: 0, done: false, standIn: false, dressed: 0, collars: [] };
  const dressCrutches = () => {
    crutches.tries++;
    if (!crutches.standIn) crutches.standIn = removeStandIn(ctx, 'ice collars and snow caps on the crutches') > 0;
    const found = [];
    ctx.group.traverse((o) => { const m = o.isInstancedMesh && !/snow|ice/.test(o.name || '') && /^(crutch_[A-H])\b/.exec(o.name || ''); if (m) found.push([o, m[1]]); });
    if (!found.length) {
      // (the kit is still building; or it was left out, and then nothing is laid: a collar of ice with no pole in it is worse than none)
      if (crutches.tries >= 90) crutches.done = true;
      return;
    }
    const props = (shared.tree.props || []).filter(Boolean);
    const mtx = new THREE.Matrix4(), lay = new THREE.Matrix4(), used = {};
    let ci = 0;
    const collar = (x, z, r, lx, lz) => {
      if (!iceMesh || ci >= COLLARS) return;
      // turned about the plumb line and sized to the pole; its rime leans the way the pole leans (a shear: the ice itself stays level on the water)
      const k = (0.5 + 0.5 * r / 0.1) * (0.92 + 0.3 * ((ci * 0.618) % 1)), kz = k * (0.85 + 0.3 * ((ci * 0.37) % 1)), t = ci * 2.4, c = Math.cos(t), sn = Math.sin(t);      // (second look: a stout pole's collar is a little wider, not twice as wide)
      lay.set(c * k, lx, sn * kz, x, 0, 1, 0, 0.004, -sn * k, lz, c * kz, z, 0, 0, 0, 1);
      iceMesh.setMatrixAt(ci++, lay); crutches.collars.push({ x, z, r });
    };
    const through = (leg, m) => {                                  // where a pole goes through the water: followed ring by ring down from its head
      let above = null, ra = 0;
      for (const ring of leg) {
        const q = new THREE.Vector3(ring[1], -ring[0], ring[2]).applyMatrix4(m);
        if (above && above.y > 0 && q.y <= 0) {
          const u = above.y / (above.y - q.y), rise = Math.max(0.05, above.y - q.y);
          return { x: above.x + (q.x - above.x) * u, z: above.z + (q.z - above.z) * u, r: ra + (ring[3] - ra) * u, lx: (above.x - q.x) / rise, lz: (above.z - q.z) / rise };
        }
        above = q; ra = ring[3];
      }
      return null;
    };
    for (const [mesh, kind] of found) {
      const design = crutchTable[kind], caps = capMesh[kind];
      mesh.updateWorldMatrix(true, false);
      for (let i = 0; i < mesh.count; i++) {
        mesh.getMatrixAt(i, mtx); mtx.premultiply(mesh.matrixWorld);
        const e = mtx.elements;
        const mine = props.length ? props.some((q) => Math.hypot(q.x - e[12], q.y - e[13], q.z - e[14]) < 1.2) : Math.hypot(e[12] - treeAt.x, e[14] - treeAt.z) < 26;
        if (!mine) continue;
        crutches.dressed++;
        if (caps && (used[kind] || 0) < 9) { caps.setMatrixAt(used[kind] || 0, mtx); used[kind] = (used[kind] || 0) + 1; }
        for (const leg of (design && design.legs) || []) {
          const w = through(leg, mtx);
          if (w) collar(w.x, w.z, Math.min(0.16, Math.max(0.07, w.r)), Math.max(-0.5, Math.min(0.5, w.lx)), Math.max(-0.5, Math.min(0.5, w.lz)));
        }
      }
    }
    for (const [kind, caps] of Object.entries(capMesh)) if (caps) { caps.count = used[kind] || 0; caps.instanceMatrix.needsUpdate = true; if (caps.count) caps.computeBoundingSphere(); }
    if (iceMesh) { iceMesh.count = ci; iceMesh.instanceMatrix.needsUpdate = true; if (ci) iceMesh.computeBoundingSphere(); }
    crutches.done = true;
  };

  let inside = false;
  const lamp = shared.lamp = {
    cold, lit, remodelled, position: flame.clone(),
    /** The boat passes the lamp: the bow lantern swells for a breath, the lamp in the water brightens, its note sounds as if from under the water. */
    pass() { ctx.engine.lanternFlare = 1; lit.flare = 1; ctx.audio.play('lamp', { x: flame.x, z: flame.z, note: Lp.note, lowpass: Lp.lowpass, gain: 1 }); },
  };

  // ================================================================================================ what the monument publishes
  const along = (line) => line.map(([s, d, y]) => F.at(s, d, y));
  const top = nC && nC.dome ? new THREE.Vector3(treeAt.x, nC.dome.top, treeAt.z - 3) : F.at(T.crownMemory.top[0], T.crownMemory.top[1], T.crownMemory.top[2]);
  shared.tree = {
    centre, at: treeAt.clone(), top, hook, flame,
    limbs: { lamp: along(T.lampLimb.line), arch: along(T.arch.line), west: along(T.westLimb.line) },
    boughs, ends, tips, paths, loads, snow, snowLine, fall, lobes, pads, crown, blossom, apples,
    roosts: nC && nC.roosts ? nC.roosts.map(at) : T.roosts.map(([s, d, y]) => F.at(s, d, y)),
    perches: nC && nC.perches ? nC.perches.map(at) : [],
    props: tree.limbs ? Array.from({ length: 9 }, (_, k) => point('prop_' + (k + 1))) : T.props.map(([s, d, h]) => F.at(s, d, h)),
    ladder: ladder ? { top: ladder.head, foot: ladder.foot, model: ladder.model, basket: ladder.basket } : null,
    lampHook: hook, wood: tree, point, sway, islet: islet ? { model: islet, point: (name) => islet.point(name) } : null,
    flowers: nE && nE.flowers ? nE.flowers.map(at) : [], marks: nE && nE.marks ? Object.fromEntries(Object.entries(nE.marks).map(([k, v]) => [k, at(v)])) : {},
  };
  shared.counts = { ...(shared.counts || {}), oldest: { files: Object.entries(files).filter(([, m]) => m).map(([k, m]) => `${k}: ${m.triangles}`), tips: tips.length, loads: loads.length, pads: pads.length, apples: apples.length } };

  return {
    update(dt) {
      if (!crutches.done) dressCrutches();
      else if (!crutches.standIn && crutches.tries < 200) { crutches.tries++; crutches.standIn = removeStandIn(ctx, 'ice collars and snow caps on the crutches') > 0; }
      pixel.value = 2 * Math.tan((engine.camera.fov || 60) * Math.PI / 360) / Math.max(200, engine.height || 900);
      // ---- the fall: its clock; each load tells whoever listens as it begins to go; the painted coat goes with the loads, from the top down
      fall.clock += dt; fallU.uMoShow.value = fall.clock;
      if (fall.running) {
        let line = 90, going = false;
        for (const l of loads) {
          if (l.let > 1e5) { going = true; continue; }
          const since = fall.clock - l.let;
          if (since >= 0 && !l.told) { l.told = true; if (fall.onRelease) { try { fall.onRelease(l.index, l); } catch (err) { console.error(err); } } }
          if (since < l.clear + 3.5) going = true;
          if (since > 0.5) line = Math.min(line, l.high - 1.5 - Math.max(0, since - 0.5) * 2.5);
        }
        if (!going) line = -9;
        snowLine.value.y += (Math.min(snowLine.value.y, line) - snowLine.value.y) * Math.min(1, dt * 3);
        if (!going && snowLine.value.y < -8) { fall.running = false; snow.visible = false; }
      }
      const boat = ctx.boat, d = Math.hypot(boat.x - flame.x, boat.z - flame.z);
      // the lit lamp, as the mirror's light has it (light.js lights it only while the mirror is drawn, and by memory.amount)
      memory.lamp.position.copy(lit.position && lit.position.lengthSq() > 0 ? lit.position : flame);
      memory.lamp.level = (lit.lit ?? 1) * (1 + 0.45 * Math.sin(Math.min(1, 1 - (lit.flare || 0)) * Math.PI) * ((lit.flare || 0) > 0 ? 1 : 0));
      // the lamp's note, once each time the boat comes within 8 m (the staging takes this over with the showstopper)
      if (d < Lp.near && !inside) { inside = true; if (memory.amount > 0.5 && !ctx.stage.done('show')) lamp.pass(); } else if (d > Lp.near * 1.6) inside = false;
      // (a flame is seen through mist long after the things round it are gone: the glow is let through the remembered
      // evening's mist, so that from the plain, 110 m off, it still lays its stroke down the road)
      const k = Math.min(1, Math.max(0, (d - 14) / 30)), mist = Math.min(9, Math.exp(Math.pow(memory.fogDensity * Math.hypot(d, 1), 2)));
      const open = shared.air ? shared.air.open : 1;                                                    // (the lamp's glow and its stroke come with the opening of the plain, not before)
      far.material.opacity = k * k * (3 - 2 * k) * (lit.lit ?? 1) * memory.amount * open; far.visible = far.material.opacity > 0.01;
      far.material.color.copy(farColor).multiplyScalar(mist);
      if (near) { near.material.opacity = (lit.lit ?? 1) * memory.amount * (1 + 0.5 * (lit.flare || 0)); near.visible = near.material.opacity > 0.01; }
      strokeU.uLevel.value = (lit.lit ?? 1) * memory.amount * open * (1 + 0.5 * (lit.flare || 0)); stroke.visible = strokeU.uLevel.value > 0.01 && Q.get('stroke') !== '0';      // (&stroke=0, developer: the lit lamp as the water alone gives it back)
    },
  };
}
