// The orchard in flood: the monument and the hero pieces. STAGE 1: EVERY THING HERE IS A STAND-IN of the true size in
// the true place, in its local colour (docs/building-an-area.md). Stage 2a replaces each one with its model and
// deletes the stand-in's lines; the comment on each says which model it stands for (page section 9).
// The numbers are plan.tree and plan.left (src/realms/orchard-plan.js, shared with the orchard in snow).
//
// STAGE 2a (the monument): the oldest tree's WOOD is modelled now (assets/models/orchard/oldest_trunk, oldest_limbs,
// oldest_arch, oldest_boughs, oldest_limbs_twigs, oldest_crown, oldest_crown_twigs, limb_ends, root_knuckles; scripts in
// source-art/models/orchard/). The wood the rider comes near (bole, roots, lamp limb, arch, limb ends) is modelled plate
// of bark by plate of bark and wears the orchard's own painted bark and lime wash (barkGrain below).
// Its blossom is another module's (the stand-in crown below is theirs to take out). docs/build/orchard/2-monument.md.
// Developer switches of this module: &bare=1 the tree with no blossom on it; &nocrisp=1 its thin wood through the
// painter's filter (as it was: the filter wipes it out); &twigmirror=1 the crown's twigs drawn in the water's mirror too;
// &nobark=1 without the painted bark; &noflood=1 without the flood's marks; &farglow=<m> the size of the lamp's far glow.
//
// shared.tree (everything in the world):
//   centre, top                    the foot of the bole; the top of the dome (33 m over s 114)
//   at, wood                       where the models stand (no turn); the models: { trunk, roots, limbs (the lamp limb), arch, boughs
//                                  (the west limb and the skirt boughs), limbTwigs, crown, crownTwigs, ends }
//   point(name)                    a named point of any of them: lamp_hook, ladder_top, ladder_foot, prop_1..9, roost_1, roost_2,
//                                  perch_001..120, lobe_001..110, apple_001..070, load_01..44, tip_end, tip_dips, tip_rises,
//                                  arch_foot, daughter_foot, daughter_top, hollow_mouth, band_joint_1, band_joint_2
//   lobes: [{x, y, z, r, turn, tall, limb, n, cx, cy, cz}]   where blossom masses sit: the crown's PADS (flat-bottomed,
//                                  round-topped masses of twiggy wood, each the end of a bough), fullest first
//                                  ((x, y, z) the middle of a lobe's underside, r its half width; limb 0..6; n twig ends in it)
//   tips: [{x, y, z, dx, dy, dz, limb, low}]   every twig end and the way it points: where a spray grows (low: on the low limbs)
//   paths: [{name, limb, path, radius}]        the limbs and great boughs along their axes
//   limbs: { lamp, arch, west }     the three low limbs as the page gives them (points along their undersides)
//   windows: { eye, through }       the two sky windows: keep blossom out of these sight lines (the wood is)
//   roosts, perches, apples, loads  two egret roosts; 120 perches; 70 places for a winter apple; 44 stretches of limb top for snow
//   props, ladder, lampHook         where the nine crutches bear; where the pole ladder rests and stands; the lamp's eye
//   flowers, marks                  the modelled flowers of the dipped tip (hang no spray on them); named places of the limb ends
//   islet: { shore(a), heightAt(x, z) }       the islet's ground
//   sway                            gouache `sway` numbers of the wood: give blossom and perched birds the same and they move with it
//   bare                            &bare=1: show the tree without blossom
import * as THREE from 'three';
import * as lampFile from '../../engine/lamp.js';
import { stand, limb, lobeGeometry, nameAt, Pile } from './standins.js';

const Q = new URLSearchParams(location.search);

export async function build(ctx, plan, shared) {
  const { kit } = ctx, F = shared.frame, M = shared.mat, T = plan.tree, [ts, td] = T.at;
  const rnd = ctx.rng(111);

  // ================================================================================================ the oldest tree
  // Its wood is modelled in Blender (source-art/models/orchard/oldest_*.py, limb_ends.py, root_knuckles.py): several
  // files about ONE origin, the middle of the bole's foot at the waterline, with the model's front (its east face, the
  // hollow) looking back up the avenue. So every file stands at the page's (111, 0, 0) with no turn.
  // A file that is missing or broken leaves its stand-in standing and says so; the rest of the area still builds.
  const treeAt = F.at(ts, td, 0);
  // limewash holds the light as blossom does (as shared.mat.wood); bark and iron do not
  const holdsWash = { uniforms: { uSelf: shared.blossomSelf }, fragmentPars: 'uniform vec3 uSelf;', light: 'glow += uSelf * 0.65 * smoothstep(0.45, 0.8, min(ownColour.r, min(ownColour.g, ownColour.b)));' };
  // THE PAINTED BARK AND LIME WASH. The wood the rider comes near (the bole, the lamp limb, the arch, the limb ends) is
  // modelled plate by plate (source-art/models/orchard/oldest_bark.py) and carries UVs: u = metres round the limb + 10,
  // v = metres along it. On those the orchard's own painted bark is laid (assets/art/orchard/bark.webp: the picture
  // every trunk of the avenue wears, made by the trees' maker), so that its flakes and lenticels run with the limb's own
  // grain; and on whatever is painted pale, the orchard's lime wash and, at the foot, the flood's line (lime.webp,
  // limefoot.webp). Wood without UVs (the crown, the boughs: nobody comes near) keeps its paint as modelled.
  // The flood's marks go by height above tonight's water, the same on every trunk and post of the orchard
  // (kit_trees.js): stain under the line that stands 0.555 m up, the line itself, and the wet at the water.
  const [tBark, tLime, tFoot] = await Promise.all([ctx.tex('art/orchard/bark.webp', { repeat: true }), ctx.tex('art/orchard/lime.webp', { repeat: true }), ctx.tex('art/orchard/limefoot.webp', { repeat: true })]);
  const FOOT = { y0: -0.13, tall: 1.05, wide: 1.05 * 449 / 1024, tide: 0.653 };                    // (kit_trees.js, LIME.foot: how the foot's picture is laid)
  const barkGrain = {
    uniforms: { tBarkO: { value: tBark }, tLimeO: { value: tLime }, tFootO: { value: tFoot }, uFootO: { value: new THREE.Vector4(FOOT.y0, FOOT.tall, FOOT.wide, FOOT.y0 + FOOT.tall * FOOT.tide) },
      uBarkO: { value: new THREE.Vector2(Q.has('nobark') ? 0 : 0.8, Q.has('noflood') ? 0 : 1) }, uOldAt: { value: new THREE.Vector2(treeAt.x, treeAt.z) } },
    fragmentPars: `uniform sampler2D tBarkO, tLimeO, tFootO; uniform vec4 uFootO; uniform vec2 uBarkO, uOldAt;
      float obH(vec3 p) { p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
      float obN3(vec3 p) { vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(mix(obH(i), obH(i + vec3(1.0, 0.0, 0.0)), f.x), mix(obH(i + vec3(0.0, 1.0, 0.0)), obH(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
                   mix(mix(obH(i + vec3(0.0, 0.0, 1.0)), obH(i + vec3(1.0, 0.0, 1.0)), f.x), mix(obH(i + vec3(0.0, 1.0, 1.0)), obH(i + vec3(1.0, 1.0, 1.0)), f.x), f.y), f.z); }`,
    albedo: `{
        float obD = length(vViewPos), obHt = vWPos.y;
        float obPale = smoothstep(0.2, 0.5, dot(albedo, vec3(0.3, 0.5, 0.2)));
        if (vUv0.x > 5.0) {
          vec2 obUv = vec2(vUv0.x - 10.0, vUv0.y);
          float obKeep = (1.0 - smoothstep(22.0, 46.0, obD)) * uBarkO.x;
          if (obKeep > 0.0 && obPale < 0.98) {
            vec3 bk = texture2D(tBarkO, obUv * vec2(1.0 / 0.62, 1.0 / 1.25)).rgb;
            albedo *= mix(vec3(1.0), clamp(bk / vec3(0.078, 0.052, 0.074), 0.35, 2.2), obKeep * (1.0 - obPale));
          }
          if (obPale > 0.02) {
            // lime wash: the paint says where it lies and how thick (plate by plate); the picture is the brush
            vec3 mean = vec3(0.4551, 0.3765, 0.4245);
            vec3 lw = texture2D(tLimeO, obUv * vec2(1.0 / 0.6, 1.0 / 1.2)).rgb;
            vec3 wash = albedo * clamp(lw / mean, 0.22, 1.5);
            float fv = clamp((obHt - uFootO.x) / uFootO.y, 0.004, 0.996);
            vec3 fw = texture2D(tFootO, vec2(obUv.x / uFootO.z, fv)).rgb;
            float fk = (1.0 - smoothstep(uFootO.x + uFootO.y - 0.34, uFootO.x + uFootO.y - 0.05, obHt)) * uBarkO.y;
            wash = mix(wash, albedo * clamp(fw / mean, 0.04, 1.6), fk);
            albedo = mix(albedo, wash, obPale);
          }
          // FROM THE AVENUE THE DRUM IS ONE WHITE BAND (the page composes on it: "the bole's white band, 3 degrees wide,
          // with its reflection"). Close to, the wash is plates of chalk with dark cracks between them; from fifty
          // metres the cracks are not seen, and what the modelled cracks would average to is a grey. So with distance
          // the bole's washed foot goes over to the wash's own even colour.
          float obDrum = (1.0 - smoothstep(1.62, 1.9, obHt)) * (1.0 - step(3.7, length(vWPos.xz - uOldAt))) * smoothstep(14.0, 42.0, obD);
          albedo = mix(albedo, vec3(0.8, 0.78, 0.77), 0.8 * obDrum);
        }
        // what the flood left, by height
        float obTide = uFootO.w + (obN3(vec3(vWPos.x * 4.0, obHt * 1.2, vWPos.z * 4.0) + 9.0) - 0.5) * 0.04;
        float obUnder = (1.0 - smoothstep(obTide - 0.03, obTide + 0.04, obHt)) * uBarkO.y;
        albedo *= mix(vec3(1.0), vec3(0.6, 0.74, 0.72), obUnder * (1.0 - 0.6 * obPale));
        albedo *= 1.0 - 0.32 * (1.0 - smoothstep(0.012, 0.045, abs(obHt - obTide))) * (1.0 - obPale) * (1.0 - smoothstep(0.45, 0.8, abs(N.y))) * uBarkO.y;
        // ON DARK WOOD THE FLOOD'S LINE IS PALE: dried silt, a ragged thread a finger wide, and a thin film of it for a
        // hand under the line. (A darker thread on bark that is dark already cannot be seen: where the arch and the
        // lamp limb go under, the wood had no mark of the water on it at all.)
        float obSilt = (1.0 - smoothstep(0.008, 0.032, abs(obHt - obTide))) * smoothstep(0.28, 0.6, obN3(vec3(vWPos.x * 9.0, obHt * 3.0, vWPos.z * 9.0) + 3.0));
        float obFilm = (1.0 - smoothstep(0.0, 0.16, obTide - obHt)) * step(obHt, obTide);
        albedo = mix(albedo, vec3(0.2, 0.19, 0.185), (0.55 * obSilt + 0.2 * obFilm) * (1.0 - obPale) * (1.0 - smoothstep(0.5, 0.85, abs(N.y))) * uBarkO.y);
        albedo *= mix(vec3(1.0), vec3(0.5, 0.58, 0.62), (1.0 - smoothstep(0.0, 0.08, obHt)) * uBarkO.y);
      }`,
  };
  // The high wood sways, slowly and never all together (the page: periods of 9 to 14 s, 18 cm at the tips): gouache's own
  // `sway`, which moves a point by where it IS, so that every file of the tree and whatever is hung on it (blossom,
  // roosting birds) move as one thing if they take the same numbers: shared.tree.sway. Nothing under 9 m moves: the
  // bole, the low limbs on their crutches and the lamp's eye stand still.
  const sway = { strength: 0.16, speed: 0.57, from: 9, to: 31, dir: [0.8, 0.6] };
  // BARK STAYS DARK BESIDE A LAMP. The dusk gives a lamp's light to a thing's own colour, whole; a metre from the kept
  // lamp that turned plum bark to lit sandstone. Wood drinks most of a lamp's light (pale paint, the limewash, does not):
  // under the lamp the limb is a warm dark brown with the light caught on the crests of its ridges. (After shared.dusk.)
  const barkLamp = { light: 'c -= ownColour * (pointLight(uLanternPos, uLanternColor, uLanternRadius, N) + pointLight(uLampPos, uLampColor, uLampRadius, N)) * 0.5 * (1.0 - duskPale);' };
  // NO RIM OF THE AFTERGLOW IN A CRACK. shared.dusk rims whatever is seen edge-on against the band, which is right for
  // the outline of a limb. But the wall of a crack, the flank of a plate of bark and the lip of the hollow where it
  // turns in are edge-on too, and each took a line of apricot: the bole was ruled with orange. What is painted dark
  // (the floor of a crack, the inside of a lip) gives its rim back. (After shared.dusk: it reads dusk's uRimLit.)
  const noCrackRim = { light: `{ float rimK = pow(1.0 - clamp(abs(dot(N, V)), 0.0, 1.0), 3.0) * smoothstep(0.15, 0.8, dot(-V, uWest)) * (1.0 - smoothstep(0.1, 0.34, abs(V.y))) * (1.0 - smoothstep(0.2, 0.6, abs(N.y)));
      c -= uRimLit * rimK * (0.3 + 0.7 * ownColour) * (1.0 - smoothstep(0.012, 0.045, dot(ownColour, vec3(0.3, 0.5, 0.2)))); }` };
  const woodLook = { brush: 0.85, shade: 0.8, sway, extend: [barkGrain, shared.dusk, holdsWash, barkLamp, noCrackRim] };
  // thin wood against the sky: a dark line, barely lit. `crisp` keeps it out of the painter's filter, which wipes out
  // anything thinner than its brush (the twigs of a 33 m tree seen from 20 to 80 m are a pixel or two wide)
  const twigLook = { brush: 0.35, shade: 0.5, crisp: !Q.has('nocrisp') };
  const blossomSelf = { uniforms: { uSelf: shared.blossomSelf }, fragmentPars: 'uniform vec3 uSelf;', light: 'glow += uSelf * (0.55 + 0.45 * ownColour) * (0.3 + 0.7 * smoothstep(-0.7, 0.35, N.y));' };
  // (petals stuck at the water's line are wet flecks: they take the hour like everything else and hold no light of their own;
  //  with blossom's self-light on them they shone like a row of lamps beside the prow lantern)
  const petalLook = { brush: 0.3, shade: 0.6, side: THREE.DoubleSide, extend: [shared.dusk] };
  const wood = async (file, opts = {}) => {
    try { return await kit.model('models/orchard/' + file, { position: treeAt, ...woodLook, ...opts }); }
    catch (err) { console.error(`INVALID_MODEL orchard/heroes: ${file} did not load, its stand-in stays (${(err && err.message) || err})`); return null; }
  };
  // THE HOLLOW STAYS DARK (the layout's rule: the kept lamp is read against it). Its inside is a slot of its own: it
  // takes the hour and nothing else. No lamp reaches into it, no rim, no last light, no light of the sky's: what
  // shows in it is its own paint, dark plum on darker. (After shared.dusk: it throws away what dusk worked out.)
  const hollowDark = { light: 'c = albedo * 0.85; glow *= 0.0;' };
  const hollowLook = { brush: 0.3, shade: 0.3, extend: [shared.dusk, hollowDark] };
  // THE IRON HOOPS ARE DRAWN CRISP (kept out of the painter's filter, like every thin thing of the ride): a band 15 cm
  // wide is five pixels tall from the lane at the lamp and under two from the reveal, and the filter wiped both hoops
  // off the bole. Old iron takes little light: it stays the dark line across the bark that the key painting has.
  // (&softhoops=1 shows them through the filter, as they were.)
  const ironLamp = { light: 'c -= ownColour * (pointLight(uLanternPos, uLanternColor, uLanternRadius, N) + pointLight(uLampPos, uLampColor, uLampRadius, N)) * 0.86;' };
  const ironLook = { brush: 0.2, shade: 0.7, crisp: !Q.has('softhoops'), extend: [shared.dusk, ironLamp] };
  const tree = { trunk: await wood('oldest_trunk.glb', { materials: { petals: petalLook, hollow: hollowLook, iron: ironLook } }) };
  // ---- STAND-IN for `oldest_trunk` (Blender hero): the bole, 4.4 m thick at the water, flaring to roots 7.2 m across,
  // 5.5 m to the first fork; limewashed to 1.8 m; the hollow on the east face, on the axis; the iron tie-band at 4.3 m.
  if (!tree.trunk) {
    const B = T.bole, p = new Pile();
    p.cyl([ts, td, -1.1], [B.roots, 1.5, B.roots], plan.chip.limewash, 0, null, 20);                       // the root flare, mostly under water
    p.cyl([ts, td, 0.2], [B.thick + 1.0, 0.5, B.thick + 1.0], plan.chip.limewash, 0, null, 20);
    p.cyl([ts, td, 0.5], [B.thick, B.wash - 0.5, B.thick], plan.chip.limewash, 0, null, 20);               // the white drum
    p.cyl([ts, td, B.wash], [B.thick * 0.97, B.fork - B.wash + 0.8, B.thick * 0.97], plan.chip.bark, 0, null, 20);
    p.cyl([ts, td, B.band], [B.thick + 0.05, 0.08, B.thick + 0.05], '#141218', 0, null, 20);               // the iron tie-band
    // the hollow: a slit 1.1 m wide from 1.0 m to 4.2 m up, 1.5 m deep, dark plum inside (the kept lamp is seen against it)
    p.box([ts - B.thick / 2 + 0.6, td, B.hollow.from], [B.hollow.width, B.hollow.to - B.hollow.from, 1.3], '#0e0a10');
    p.build(ctx, 'oldest_trunk', M.wood);
  }

  // ---- the islet (code, kit.island; `root_knuckles` are a kit model): 13 m across, 0.5 m high at the bole, grass and bluebells
  // (modelled now, with the roots that cross it: root_knuckles.glb keeps the layout's profile, so what is planted on it stands on it)
  const c = F.at(ts, td);
  // (earth and turf drink the lamp's light: without this the whole islet, 5 to 14 m from the kept lamp, glows like sand)
  // (and the bow lantern's, on what is painted dark: the great roots that reach the water on the lane's side lie two to
  //  four metres from the bow, and in the lantern they were sandstone fingers. Wood never glows: the page.)
  const drinksLamp = { light: 'c -= albedo * pointLight(uLampPos, uLampColor, uLampRadius, N) * 0.5; c -= ownColour * pointLight(uLanternPos, uLanternColor, uLanternRadius, N) * 0.62 * (1.0 - duskPale);' };
  // GROUND TAKES NO RIM. shared.dusk puts a rim of the band's apricot on whatever is seen edge-on toward the west. From
  // an eye 1.1 m up, level ground IS edge-on: the whole islet went orange in the afterglow (the director's note 4).
  // This takes that rim off again wherever the surface faces the sky, and leaves it on upright silhouettes. It must
  // stand AFTER shared.dusk in the list (it reads dusk's own uRimC, uWest and ownColour).
  const noGroundRim = { light: `{ float rimG = pow(1.0 - clamp(abs(dot(N, V)), 0.0, 1.0), 3.0) * smoothstep(0.15, 0.8, dot(-V, uWest)) * (1.0 - smoothstep(0.1, 0.34, abs(V.y)));
      c -= uRimC * rimG * (0.3 + 0.7 * ownColour) * smoothstep(0.25, 0.7, N.y); }` };
  tree.roots = await wood('root_knuckles.glb', { brush: 0.7, extend: [barkGrain, shared.dusk, holdsWash, drinksLamp, noGroundRim] });
  if (!tree.roots) kit.island({ position: [c.x, c.z], profile: [[0, 0.55], [2.4, 0.5], [4.4, 0.32], [T.islet.across / 2, 0.02], [7.6, -0.55], [9.4, -1.1]], roughness: 0.5, segments: 30, collide: false, material: M.grass, seed: 6 }).name = 'islet';

  // ---- STAND-IN for `oldest_limbs` (Blender hero): seven primary limbs, 1.1 to 1.5 m thick where they leave the bole.
  // The three that matter to the route follow the page's points (heights are of their undersides).
  tree.limbs = await wood('oldest_limbs.glb');                       // the lamp limb, its bark modelled plate by plate; the eye and chain the lamp hangs by
  tree.arch = tree.limbs && await wood('oldest_arch.glb');            // the arch, as far as its healed break
  tree.boughs = tree.limbs && await wood('oldest_boughs.glb');        // the west limb and the six skirt boughs on their crutches
  tree.limbTwigs = tree.limbs && await wood('oldest_limbs_twigs.glb', twigLook);
  if (!tree.limbs) {
    limb(ctx, { name: 'oldest_limbs: the lamp limb', line: T.lampLimb.line.slice(0, 5), thick: [T.lampLimb.thick, 0.6], under: true, material: M.plum });
    limb(ctx, { name: 'oldest_limbs: the arch', line: T.arch.line.slice(0, 5), thick: [T.arch.thick, 0.75], under: true, material: M.plum });
    limb(ctx, { name: 'oldest_limbs: the west limb', line: T.westLimb.line, thick: [T.westLimb.thick, 0.5], under: true, material: M.plum });
  }
  // ---- STAND-IN for `limb_ends` (Blender hero): the two places a limb meets the water. The dipped tip goes under at
  // (89, +4) and its last 2 m rise again to 1.3 m at (87.5, +4.8), in blossom at eye level; the arch goes under at
  // (114, -25.5), where it has rooted and sent up a daughter stem 5 m tall, limewashed like the rest.
  // (its `tip_flowers` part is the one blossom of this tree that is modelled flower by flower; its `petal_collar` is petals stuck at the waterline)
  // (the flowers are one layer seen from both sides: the back of a petal is flushed pink, as the page asks of blossom;
  //  the thin wood of the limb ends, spurs and flower stalks, is a slot of its own, kept out of the painter's filter)
  const petalBack = { albedo: 'if (!gl_FrontFacing) albedo *= vec3(1.0, 0.76, 0.82);' };
  // THE MODELLED BLOSSOM IS NEVER STILL (the page: "sprays tremble 4 mm at 2 to 3 Hz"; every card of the orchard's
  // blossom does, and these flowers, an arm's length from the rider, stood dead among them). The flowers and the thin
  // wood they stand on (the slots `blossom` and `thin`) move by one rule of where a point is, so a flower stays on its
  // stalk: a tremble of a few millimetres, each truss to its own time, and a slower nod. Only round the dipped tip
  // (uTipAt: the model's own `tip_end`), and not where the wood stands in the water.
  const tipStir = { uniforms: { uTipAt: { value: new THREE.Vector3(0, -99, 0) } }, vertexPars: 'uniform vec3 uTipAt;',
    vertexWorld: `{ float stirK = (1.0 - smoothstep(1.5, 2.6, distance(wp.xyz, uTipAt))) * smoothstep(0.35, 1.0, wp.y);
      if (stirK > 0.0) { vec3 ph = wp.xyz * 9.0;
        wp.xyz += stirK * (vec3(sin(uTime * 14.5 + ph.x + ph.z * 1.3), 0.6 * sin(uTime * 17.0 + ph.y * 1.1 + ph.x), sin(uTime * 13.1 + ph.z + ph.y * 0.7)) * 0.0022
                           + vec3(sin(uTime * 2.1 + ph.x * 0.3), 0.0, sin(uTime * 1.7 + ph.z * 0.3 + 1.0)) * 0.004); } }` };
  tree.ends = await wood('limb_ends.glb', { materials: { petals: petalLook, thin: { ...twigLook, extend: [...woodLook.extend, tipStir] },
    blossom: { brush: 0.25, steps: 2, shade: 0.6, backlight: 0.35, backColor: plan.chip.apricot, side: THREE.DoubleSide, extend: [petalBack, shared.dusk, blossomSelf, tipStir] } } });
  if (tree.ends && tree.ends.points && tree.ends.points.tip_end) tipStir.uniforms.uTipAt.value.copy(tree.ends.point('tip_end'));
  if (!tree.ends) {
    limb(ctx, { name: 'limb_ends: the dipped tip', line: T.lampLimb.line.slice(4), thick: [0.6, 0.16], under: true, material: M.plum });
    limb(ctx, { name: 'limb_ends: the arch goes under', line: T.arch.line.slice(4), thick: [0.75, 0.5], under: true, material: M.plum });
    const [ds, dd] = T.arch.daughter.at;
    stand(ctx, { name: 'limb_ends: the daughter stem (limewash)', at: [ds + 0.9, dd - 0.9, -1], size: [0.3, 2.8, 0.3], shape: 'cylinder', color: plan.chip.limewash });
    stand(ctx, { name: 'limb_ends: the daughter stem', at: [ds + 0.9, dd - 0.9, 1.8], size: [0.26, T.arch.daughter.height - 1.8, 0.26], shape: 'cylinder', color: plan.chip.bark });
  }
  // the four upper limbs that carry the dome, the leader, and the wood of the dome down to its twigs
  tree.crown = await wood('oldest_crown.glb');
  tree.crownTwigs = tree.crown && await wood('oldest_crown_twigs.glb', twigLook);
  // (in blossom the crown's twigs are not drawn in the water's mirror: under the blossom's sprays, 12 to 33 m up and
  // upside down in a rippled mirror, none of them shows, and they are 58,000 triangles. Bare, they are drawn there too.)
  if (tree.crownTwigs && !Q.has('bare') && Q.get('twigmirror') !== '1') ctx.only(tree.crownTwigs.group, 'direct');
  const fork = [ts, td, T.bole.fork - 0.4];
  if (!tree.crown) T.upperLimbs.forEach(([az, reach, top], i) => {
    const a = az * Math.PI / 180, out = (r) => [ts + Math.cos(a) * r, td + Math.sin(a) * r];
    const p1 = out(reach * 0.22), p2 = out(reach * 0.55), p3 = out(reach);
    limb(ctx, { name: i === 0 ? 'oldest_limbs: upper limbs' : null, line: [fork, [p1[0], p1[1], 5.5 + (top - 5.5) * 0.34], [p2[0], p2[1], 5.5 + (top - 5.5) * 0.72], [p3[0], p3[1], top - 2]], thick: [1.4, 0.3], material: M.plum });
    // second-order boughs, so the vault reads as a tree from under it
    for (let k = 0; k < 3; k++) {
      const u = 0.4 + 0.2 * k, b0 = out(reach * u), a2 = a + (k % 2 ? 1 : -1) * (0.7 + 0.3 * rnd()), len = 7 + rnd() * 6, h0 = 5.5 + (top - 5.5) * (u * 1.1);
      limb(ctx, { line: [[b0[0], b0[1], h0], [b0[0] + Math.cos(a2) * len * 0.5, b0[1] + Math.sin(a2) * len * 0.5, h0 + len * 0.28], [b0[0] + Math.cos(a2) * len, b0[1] + Math.sin(a2) * len, h0 + len * 0.42]], thick: [0.5, 0.14], radial: 6, material: M.plum });
    }
  });

  // ---- STAND-IN for the crown: about 110 blossom lobes (`lobe_01` .. `lobe_12`, sculpted in Blender, placed by rule on
  // the limbs' `lobe_001` .. `lobe_110` empties) in seven tiers: a cumulus with a level base 5 to 7 m above the water
  // and a domed top, 58 m across, highest (33 m) at s 114, with two sky windows on the west side. Instanced: one draw.
  // NOT THE PAGE'S SIZES: the page gives lobes 2 to 7 m across. A hundred and ten of those cover about half of the
  // dome's shell, and from the avenue it is a scatter of puffs, not a mountain. These are 4.5 to 10 m (see 1-layout.md).
  const lobes = [], WIN = { eye: [172, 0, 1.1], through: [[124, 7.5, 20.5], [125, -8.5, 18.5]] };
  {
    const CR = T.crown, cs = ts + 1.6;
    // [height of the tier's undersides, how many, the ring's radius, lobe width from, to]
    const tiers = [[5.6, 24, 25.6, 8.0, 10.0], [9.6, 22, 25.0, 7.8, 9.6], [13.6, 19, 23.4, 7.0, 9.0], [17.6, 16, 20.8, 6.5, 8.5], [21.6, 13, 17.2, 6.0, 8.0], [25.0, 9, 12.6, 5.2, 7.0], [28.0, 5, 6.8, 4.6, 6.4]];
    // the two sky windows, kept clear along the sight lines of the look back from (172, 0): the first stars stand in them
    const eye = WIN.eye, windows = WIN.through;
    const blocked = (s, d, y, r) => windows.some(([ws, wd, wy]) => {
      const ax = ws - eye[0], ay = wd - eye[1], az = wy - eye[2], l = Math.hypot(ax, ay, az), px = s - eye[0], py = d - eye[1], pz = y + r * 0.5 - eye[2];
      const t = (px * ax + py * ay + pz * az) / (l * l), dx = px - ax * t, dy = py - ay * t, dz = pz - az * t;
      return t > 0.3 && Math.hypot(dx, dy, dz) < r * 0.8 + 1.6;
    });
    tiers.forEach(([h, n, ring, w0, w1], ti) => {
      for (let i = 0; i < n; i++) {
        const a = (i + 0.25 + rnd() * 0.5) / n * Math.PI * 2 + ti * 0.9, w = w0 + rnd() * (w1 - w0), rr = ring - w * 0.3 + (rnd() - 0.5) * 1.2;
        let s = cs + Math.cos(a) * rr, d = td + Math.sin(a) * rr; const y = h + (rnd() - 0.5) * 1.2;
        if (blocked(s, d, y, w / 2)) { s = cs + Math.cos(a + 0.5) * rr; d = td + Math.sin(a + 0.5) * rr; if (blocked(s, d, y, w / 2)) continue; }
        const p = F.at(s, d, y);
        lobes.push({ x: p.x, y: p.y, z: p.z, r: w / 2, turn: rnd() * 6.283, tall: 0.85 + rnd() * 0.4 });
      }
    });
    // the crest
    for (let i = 0; i < 2; i++) { const p = F.at(CR.top[0] + (i ? 2.5 : -1.5), (i ? -1.8 : 1.6), 29.6 + i * 0.5), w = 5.5 + rnd(); lobes.push({ x: p.x, y: p.y, z: p.z, r: w / 2, turn: rnd() * 6.283, tall: 1.0 }); }
    // (painted a little paler than the avenue's clouds, so that from the reveal the dome stands off from the crowns in front of it)
    const mesh = kit.instances(lobeGeometry(12, 7, 4, { top: '#fbf1ef', side: '#dcd6e8', under: '#8e8aa8' }), M.blossom, lobes.map((l) => ({ position: [l.x, l.y, l.z], rotation: l.turn, scale: [l.r * 2, l.r * 2 * l.tall, l.r * 2] })));
    mesh.name = 'standin:crown of the oldest tree (lobes)';
    nameAt(ctx, `crown: ${lobes.length} lobes (lobe_01..12)`, [ts, td, 33]);
    shared.counts = { ...(shared.counts || {}), crownLobes: lobes.length };
  }
  // (limbs: the three that matter to the route, as points along their UNDERSIDES; windows: the eye of the look back and
  // the two points its sight lines pass through; all in the world, like everything shared)
  const along = (line) => line.map(([s, d, y]) => F.at(s, d, y));
  shared.tree = {
    centre: F.at(ts, td), top: F.at(T.crown.top[0], T.crown.top[1], T.crown.top[2]), lobes, roosts: T.roosts.map(([s, d, y]) => F.at(s, d, y)),
    limbs: { lamp: along(T.lampLimb.line), arch: along(T.arch.line), west: along(T.westLimb.line) },
    windows: { eye: F.at(...WIN.eye), through: WIN.through.map((w) => F.at(...w)) },
  };

  // ================================================================================================ what the wood publishes
  // For the people who dress the tree and bring it to life. Everything is in the WORLD, like all of shared.tree. It
  // comes from the models themselves (their named points) and from the numbers their scripts wrote beside them
  // (assets/models/orchard/oldest_limbs.json, oldest_crown.json, limb_ends.json): nothing here is copied by hand.
  // The list of fields is at the top of this file and in docs/build/orchard/2-monument.md.
  {
    const numbers = async (file) => { try { const r = await fetch('assets/models/orchard/' + file); return r.ok ? await r.json() : null; } catch (err) { return null; } };
    const [nL, nC, nE] = await Promise.all([tree.limbs ? numbers('oldest_limbs.json') : null, tree.crown ? numbers('oldest_crown.json') : null, tree.ends ? numbers('limb_ends.json') : null]);
    const at = (a) => new THREE.Vector3(a[0] + treeAt.x, a[1] + treeAt.y, a[2] + treeAt.z);         // the models stand at treeAt with no turn
    const Tr = shared.tree;
    Tr.at = treeAt.clone(); Tr.wood = tree; Tr.sway = sway; Tr.bare = Q.has('bare');
    Tr.point = (name) => { for (const m of Object.values(tree)) if (m && m.points && m.points[name]) return m.point(name); return null; };
    Tr.tips = [];
    for (const [n, low] of [[nC, false], [nL, true], [nE, true]]) if (n && n.tips) for (const t of n.tips) Tr.tips.push({ x: t[0] + treeAt.x, y: t[1] + treeAt.y, z: t[2] + treeAt.z, dx: t[3], dy: t[4], dz: t[5], limb: t[6], low });
    Tr.paths = [];
    for (const n of [nL, nC]) if (n && n.limbs) for (const l of n.limbs) if (!Tr.paths.some((q) => q.name === l.name)) Tr.paths.push({ name: l.name, limb: l.no, path: l.path.map(at), radius: l.path.map((q) => q[3]) });
    if (nC && nC.lobes) {
      Tr.standinLobes = Tr.lobes;                                        // (the layout's 106, on rings: the stand-in crown is still drawn from them)
      const rl = ctx.rng(112);
      Tr.lobes = nC.lobes.map(([x, y, z, r, limbNo, n]) => ({ x: x + treeAt.x, y: y + treeAt.y - 0.3 * r, z: z + treeAt.z, r, turn: rl() * 6.283, tall: 0.85 + rl() * 0.4, limb: limbNo, n, cx: x + treeAt.x, cy: y + treeAt.y, cz: z + treeAt.z }));
      Tr.top = at([3, 33, 0].map((v, i) => (i === 0 ? 0 : i === 1 ? nC.dome.top : -3)));
      Tr.roosts = nC.roosts.map(at); Tr.perches = nC.perches.map(at); Tr.apples = nC.apples.map(at);
      Tr.loads = nC.loads.map((l) => ({ limb: l.limb, on: l.on, width: l.width, top: l.top.map(at) }));
    }
    if (tree.limbs) {
      Tr.props = Array.from({ length: 9 }, (_, k) => tree.limbs.point('prop_' + (k + 1)));
      Tr.ladder = { top: tree.limbs.point('ladder_top'), foot: tree.limbs.point('ladder_foot') };
      Tr.lampHook = tree.limbs.point('lamp_hook');
    }
    if (nE) { Tr.flowers = nE.flowers.map(at); Tr.marks = Object.fromEntries(Object.entries(nE.marks).map(([k, v]) => [k, at(v)])); }
    // the islet's ground under a place of the world (the model's own profile, without its small lumps)
    const prof = [[0, 0.55], [2.4, 0.5], [4.4, 0.32], [6.5, 0.02], [7.6, -0.55], [9.4, -1.1], [12, -1.15]];
    Tr.islet = { shore: (a) => 6.5 + 0.28 * Math.sin(2 * a + 0.6) + 0.22 * Math.sin(3 * a + 2.1) + 0.12 * Math.sin(7 * a + 0.3),
      heightAt(x, z) { const bx = x - treeAt.x, by = -(z - treeAt.z), rn = Math.hypot(bx, by) * 6.5 / this.shore(Math.atan2(bx, by)); let i = 1; while (i < prof.length - 1 && prof[i][0] < rn) i++; const [r0, h0] = prof[i - 1], [r1, h1] = prof[i]; return h0 + (h1 - h0) * Math.min(1, Math.max(0, (rn - r0) / (r1 - r0))); } };
    // the flowers of the dipped tip hang at the rider's eye: shallows there keep the hull an arm's length off them
    if (Tr.marks && Tr.marks.tip_end) ctx.addCollider({ x: Tr.marks.tip_end.x, z: Tr.marks.tip_end.z, r: 0.55, soft: 0.6 });
    // &bare=1 (developer): the wood with no blossom on it, as the orchard in snow will show it (hides the stand-in crown)
    if (Tr.bare) ctx.group.traverse((o) => { if (o.name && o.name.startsWith('standin:crown of the oldest tree')) o.visible = false; });
  }

  // ================================================================================================ the kept lamp
  // The ride's one storm lantern, the same object as everywhere, hung by its ring from a wrought S-hook and 0.8 m of
  // chain under the lamp limb at (96, -1): flame 2.2 m above the water, in front of the dark of the hollow. F4.
  // (When `oldest_limbs` is modelled, hang it from its `lamp_hook` empty.)
  //
  // TWO LAMPS EXIST while this is written. The ride's own (src/engine/lamp.js) hangs a lantern by its ring and knows no
  // hook: for it the S-hook and chain are a stand-in here. The remodelled one (src/engine/lamp-hero.js, docs/life/boat.md)
  // brings the smith's S-hook and chain as a holding and is placed by its flame. Its page asks whoever keeps the engine
  // to make lamp.js that file; the day that happens this area takes it with no change here (it is known by its HOLDINGS).
  // Until then `&lamp=hero` shows it in place.
  // (the eye it hangs from is a named point of the limb's model, 3.34 m up: 0.8 m of chain then puts the flame at 2.2 m)
  const hook = tree.limbs ? tree.limbs.point('lamp_hook') : F.at(plan.lamp.hook[0], plan.lamp.hook[1], plan.lamp.hook[2]), ring = plan.lamp.flame[2] + 0.2;
  const ownChain = tree.limbs && tree.limbs.parts.lamp_chain;          // the model's own S-hook and eight links (a part of oldest_limbs.glb)
  let lamps = lampFile;
  if (!lamps.HOLDINGS && Q.get('lamp') === 'hero') lamps = await import('../../engine/lamp-hero.js');
  const remodelled = !!lamps.HOLDINGS, lampOpts = { note: plan.lamp.note, reach: plan.lamp.reach, moths: plan.lamp.moths, near: plan.lamp.near };
  if (remodelled) {
    if (lamps.loadLamp) await lamps.loadLamp(['hook']);                 // the lantern and its hook, before the first picture
    // Placed by its flame, which is the composed thing (2.2 m). Its bail is 0.2 m above the flame and its eye bolt 0.14 m
    // above the chain, so under a limb whose underside is 3.2 m here the chain is 0.66 m, not the page's 0.8: the limb's
    // modeller can give the page its chain by putting `lamp_hook` at 3.34 m.
    shared.lamp = lamps.makeKeptLamp(ctx.engine, ctx, { ...lampOpts, holding: 'hook', flame: [hook.x, plan.lamp.flame[2], hook.z], chain: Math.max(0.3, hook.y - ring - 0.14) });
    if (ownChain) ownChain.visible = false;                              // the remodelled lamp brings its own hook and chain
  } else {
    if (!ownChain) limb(ctx, { name: 'S-hook and chain', line: [[plan.lamp.hook[0], plan.lamp.hook[1], plan.lamp.hook[2] + 0.1], [plan.lamp.hook[0], plan.lamp.hook[1], ring]], thick: 0.035, smooth: false, radial: 5, color: '#17151c' });
    shared.lamp = lamps.makeKeptLamp(ctx.engine, ctx, { ...lampOpts, hang: [hook.x, ring, hook.z] });
  }
  shared.lamp.remodelled = remodelled;
  // From the reveal the lamp is composed as "one amber point" 65 m off, and at that distance the lantern's own halo is three
  // pixels, inside the glow of the lantern on the rider's own bow. So it is given a far glow of the same amber, which
  // hands over to the lantern itself as the boat comes near (nothing of it is left inside 14 m). See 1-layout.md.
  {
    // (a disc 2.4 m across, not 3.4: the remodelled lamp has a point of its own that never shrinks under a pixel, and
    //  the larger disc covered the dark of the hollow that the lamp is composed against)
    const far = kit.glow({ position: [hook.x, plan.lamp.flame[2], hook.z], color: '#ffb45e', size: Q.has('farglow') ? +Q.get('farglow') : 2.4, intensity: 2.2 });
    far.name = 'kept lamp: far glow';
    ctx.onUpdate(() => { const d = Math.hypot(ctx.boat.x - hook.x, ctx.boat.z - hook.z), k = Math.min(1, Math.max(0, (d - 14) / 30)); far.material.opacity = k * k * (3 - 2 * k) * (shared.lamp.lit ?? 1); far.visible = far.material.opacity > 0.01; });
  }

  // ================================================================================================ hero pieces
  // ---- STAND-IN for `loft_door` (Blender hero): the opening 16 x 9 m; two posts 0.45 m square and a lintel; four plank
  // leaves folded back outside on strap hinges.
  {
    const L = plan.left.loft, p = new Pile(), dark = '#17141a';
    for (const side of [-1, 1]) {
      p.box([L.door, side * (L.water / 2 + 0.22), -1], [0.45, L.doorHeight + 1, 0.45], dark);
      for (let k = 0; k < 2; k++) p.box([L.door + 0.3 + 0.16 * k, side * (L.water / 2 + 2.5 + k * 0.3), 0.5], [3.9, L.doorHeight - 0.9, 0.12], '#1d1a22', side * (0.06 + 0.05 * k));
    }
    p.box([L.door, 0, L.doorHeight], [L.water + 0.9, 0.5, 0.45], dark);
    p.build(ctx, 'loft_door', M.wood);
  }

  // ---- STAND-IN for `wall_gap` (Blender hero): two square gate piers 0.7 m thick with 2.5 m showing, pyramid caps; the
  // iron gate leaf (2.2 m wide, 1.4 m showing) swung open toward the boat on the left pier, leaning; the fallen stones
  // lying pale under the keel, 0.5 to 0.9 m down, from s 212 to 220.
  {
    const Wl = plan.left.wall, p = new Pile();
    for (const side of [-1, 1]) {
      const d = side * (Math.abs(Wl.gap[0]) + Wl.pier.thick / 2);
      p.box([Wl.s, d, -1], [Wl.pier.thick, Wl.pier.showing + 1, Wl.pier.thick], plan.chip.stone);
      p.cone([Wl.s, d, Wl.pier.showing], [Wl.pier.thick + 0.2, 0.42, Wl.pier.thick + 0.2], plan.chip.stone);
    }
    p.box([Wl.s - 1.05, Wl.gap[0] + 0.38, -0.4], [0.06, Wl.gate.showing + 0.4, Wl.gate.width], '#17151c', -0.32, [0, 0.07]);     // the gate leaf, swung open toward the boat, leaning
    for (let i = 0; i < 26; i++) {
      const s = Wl.fallen[0] + rnd() * (Wl.fallen[1] - Wl.fallen[0]), d = (rnd() * 2 - 1) * 7.5, w = 0.35 + rnd() * 0.5;
      p.box([s, d, -(0.5 + rnd() * 0.4) - w * 0.4], [w * (1 + rnd() * 0.6), w * 0.6, w], '#9aa3ad', rnd() * 3);                 // the fallen stones
    }
    p.build(ctx, 'wall_gap', M.wood);
  }

  // ---- STAND-IN for `handcart` (Blender hero): 2.0 m long, wheels 0.84 m, tipped on its shafts beside the tree at
  // (84.5, -10), shafts 1.6 m out of the water.
  {
    const [hs, hd] = plan.left.handcart.at, p = new Pile(), turn = 0.5;
    p.box([hs, hd, -0.45], [1.1, 0.5, 2.0], '#5d5058', turn, [-0.62, 0]);
    for (const side of [-1, 1]) {
      p.cyl([hs - 0.25, hd + side * 0.62, -0.58], [0.84, 0.09, 0.84], '#2a2530', turn, [0, Math.PI / 2]);        // (the wheels stand on the bed, under water)
      p.limb({ line: [[hs + 0.4, hd + side * 0.42 + 0.3, 0.3], [hs + 1.5, hd + side * 0.36 + 0.9, plan.left.handcart.shaftsOut]], thick: 0.07, smooth: false, radial: 5 }, '#6a5c62');
    }
    p.build(ctx, 'handcart', M.wood);
  }

  // ---- STAND-IN for `hive_stand` (Blender hero): a trestle platform 4.2 x 0.8 m, 0.5 m above the water, six white box
  // hives 0.46 m square facing the channel, a brick on each roof.
  {
    const Hv = plan.left.hives, [hs, hd] = Hv.at, p = new Pile();
    p.box([hs, hd, Hv.deck - 0.06], [0.8, 0.06, Hv.length], '#5d5058');
    for (let i = 0; i < 4; i++) for (const side of [-1, 1]) p.box([hs - Hv.length / 2 + 0.3 + i * (Hv.length - 0.6) / 3, hd + side * 0.3, -1], [0.07, 1.0 + Hv.deck, 0.07], '#4a4048');
    for (let i = 0; i < Hv.count; i++) {
      const s = hs - Hv.length / 2 + 0.38 + i * (Hv.length - 0.76) / (Hv.count - 1), tilt = (rnd() - 0.5) * 0.12;
      p.box([s, hd, Hv.deck], [0.46, 0.5, 0.46], '#e6e0dc', tilt);
      p.box([s, hd, Hv.deck + 0.5], [0.56, 0.06, 0.54], '#5d5058', tilt + (rnd() - 0.5) * 0.1);
      p.box([s + (rnd() - 0.5) * 0.1, hd, Hv.deck + 0.56], [0.11, 0.07, 0.22], '#7a4a40', rnd());
    }
    p.build(ctx, 'hive_stand', M.wood);
  }
  return {};
}
