// The orchard in snow: THE TREES (module `trees`, built before `kit`). Its log: docs/build/snow/2-kit-trees.md.
//
//   - THE WOOD of every tree of the shared plan (plan.trees: 108 of the avenues, 84 of the outer rows, 126 motes) is the
//     flood orchard's own: its eight designs (assets/models/orchard/apple_A .. apple_F, apple_low_A/B), each in its four
//     weights from one skeleton (near, _lo, _far, _mote), loaded AS THEY ARE and worn by distance from the boat exactly
//     as that area wears them (src/realms/orchard/kit_trees.js), with that area's own wood material (bark picture, lime
//     wash, thin wood crisp) under this area's dusk and wet. SHARED: the water shows the same wood at dusk.
//   - THE SNOW on it (WINTER) is this area's: one model for every wood file, laid on that very file by
//     source-art/models/snow/apple_snow.py (assets/models/snow/apple_snow_*.glb, listed in apple_snow.json), worn in
//     step with the wood: a tree and its snow always change weight together, and sway together.
//   - THE BLOSSOM in the water (MEMORY) is the flood orchard's and stays a STAND-IN here: clouds on each design's own
//     crown (apple_wood.json, `crown.lobes`), so that they sit on the real wood. The first pair of the colonnade,
//     (108.5, +/-10), stands in the water only: wood and blossom drawn in the mirror alone.
//   - the thirteen crutches under the long low boughs and the nine props under the oldest tree (the flood orchard's
//     crutch_A .. crutch_H, as they are and where that area stands them), each where its bough's own design says its cradle is.
//
// What it publishes: shared.orchard = { ends, models, trees, of(t), endsOf(t), spursOf(t), perches(t), toRealm(t, p), levelOf(t),
//   onBump(fn), stir, lampOnSnow, notInPre(mesh), sway(m), slide(t), slides }.
//
// Developer switches: &lod=near | lo | far | mote (every tree in one weight), &lodr=<m> (where the near weight ends), &lor=<m> (the second),
//   &treesnow=0 (the wood without its snow), &nowash=1 (no lime wash), &crisp=0 (thin wood through the painter's filter),
//   &slide=<seconds> (the four low boughs of plan.slides let their snow go at that time), &rose=1 (snow under a lamp as the
//   area's snow light alone gives it: without `lampOnSnow`), &prepass=1 (every batch in all three of a frame's pictures).
import * as THREE from 'three';
import { lobeGeometry, nameAt, merge } from './standins.js';

const Q = new URLSearchParams(location.search);
const WOOD_JSON = 'assets/models/orchard/apple_wood.json', SNOW_JSON = 'assets/models/snow/apple_snow.json';
const _e = new THREE.Euler(), _q = new THREE.Quaternion(), _p = new THREE.Vector3(), _s = new THREE.Vector3(), _c = new THREE.Color(), _v = new THREE.Vector3();

/** Which of the flood orchard's designs a tree of the plan wears (that area's own rule: kit_trees.js, modelOf). */
export const modelOf = (t) => (t.kind === 'sail' && t.low ? 'apple_low_' + t.low : 'apple_' + 'ABCDEF'[t.variant % 6]);
/** A tree's place: exactly as the flood orchard places it (this area's centre line is straight: its heading is 0). A
 *  low-bough tree is not leaned or scaled: its bough, along its own +X, points at the centre line and meets its crutch. */
export function matrixOf(t, out = new THREE.Matrix4()) {
  const low = t.kind === 'sail' && t.low;
  if (low) _e.set(0, t.d > 0 ? Math.PI : 0, 0, 'XYZ'); else _e.set(Math.sin(t.leanDir) * t.lean, t.turn, Math.cos(t.leanDir) * t.lean, 'XYZ');
  return out.compose(_p.set(t.x, 0, t.z), _q.setFromEuler(_e), _s.setScalar(low ? 1 : t.scale));
}

export async function build(ctx, plan, shared) {
  const { kit } = ctx, F = shared.frame, L = shared.light;
  const count = shared.counts = shared.counts || {};
  const data = await (await fetch(WOOD_JSON)).json(), models = data.models;
  // the snow's own list (written by apple_snow.py): { apple_A: { near: { file, triangles }, lo, far }, ... }; none yet = bare wood
  let snowList = {};
  if (Q.get('treesnow') !== '0') { try { const r = await fetch(SNOW_JSON); if (r.ok) snowList = (await r.json()).models || {}; } catch (err) { /* no snow made yet */ } }

  // ---------------------------------------------------------------------------------------------- the wood's material
  // The flood orchard's own (woodOptions): its bark picture over the model's paint, the lime wash on every bole, thin
  // wood kept out of the painter's filter by how thick it is on the screen, and its stir. `flood: 0` takes the flood's
  // marks off (the tide line, the silt, the wet, the petals stuck). Over it this area's dusk (the water shows shared
  // things at dusk) and its wet (the belly of every bough goes to ink). If that file cannot be read (someone is in the
  // middle of an edit) the trees wear plain crisp paint for this picture and say so.
  let orchard = null;
  try { orchard = await import('../orchard/kit_trees.js'); } catch (err) { console.error(`INVALID_MODULE snow trees: the flood orchard's wood material (src/realms/orchard/kit_trees.js) could not be read: ${err.message}. The trees wear plain paint.`); }
  // BARK IS INK AGAINST SNOW (the director). The flood orchard's bark is painted for an afterglow (#473a42 .. #3d2933
  // under a dim sky); under snow light, which lifts paint by about a third, it came out a warm grey-brown (#5b4d55).
  // INK multiplies the wood's own paint (not the lime wash, which the wood's material lays on afterwards).
  const INK = Q.get('ink') || '#8f8798';
  let wood, stirFx = null, bark = null;
  if (orchard) {
    let lime, foot;
    [bark, lime, foot] = await Promise.all([ctx.tex('art/orchard/bark.webp', { repeat: true }), ctx.tex('art/orchard/lime.webp', { repeat: true }), ctx.tex('art/orchard/limefoot.webp', { repeat: true })]);
    for (const t of [lime, foot]) t.anisotropy = 4;
    const base = orchard.woodOptions(ctx, null, bark, { lime, foot, flood: 0, bare: Q.get('nowash') === '1', dusk: null });
    wood = { ...base, color: INK, extend: [...base.extend, L.dusk, L.wet] };
    // the wood's stir, for everything that lies or hangs on it (snow, sprays, apples): the same words, the same uniforms
    const fx = base.extend[0], U = fx.uniforms;
    stirFx = { uniforms: { uBlow: U.uBlow, uBlowMore: U.uBlowMore, uFrontB: U.uFrontB, uShakeB: U.uShakeB, uShiverB: U.uShiverB }, vertexPars: fx.vertexPars, vertexWorld: 'wp.xyz += stirOf(wp.xyz);' };
    // WINTER AIR: almost none. Laden boughs barely move: a third of the spring's sway (the staging may raise it: shared.orchard.sway)
    U.uBlow.value.z = ctx.reducedMotion ? 0.02 : 0.055; U.uBlow.value.w = 0.45;
    wood.stir = U;
  } else {
    wood = { color: INK, brush: 0.6, crisp: true, extend: [L.dusk, L.wet] };
  }

  // ---------------------------------------------------------------------------------------------- every tree and its place
  const tints = ['#ffffff', '#efe9f2', '#f6eee6', '#e4e7ee'];                      // one of four wear tints (the flood orchard's)
  const entries = [], byTree = new Map(), lost = [];
  for (const [kind, list] of [['sail', plan.trees.trees], ['far', plan.trees.far], ['mote', plan.trees.motes]]) for (const t of list) {
    const e = { t, kind, model: modelOf(t), matrix: matrixOf(t), tint: tints[t.tint || 0], level: 9 };
    byTree.set(t, e);
    if (t.lost) lost.push(e); else entries.push(e);
  }
  const groups = {};
  for (const e of entries) (groups[e.model] || (groups[e.model] = [])).push(e);
  const spot = (list) => list.map((e) => ({ position: [e.t.x, 0, e.t.z], tint: e.tint }));        // (where each stands, for the batch's bounds; the true matrices are written below)
  const put = (mesh, k, e) => { mesh.setMatrixAt(k, e.matrix); if (mesh.instanceColor) mesh.setColorAt(k, _c.set(e.tint)); const sl = mesh.userData.slide; if (sl) { sl.setX(k, e.slideAt ?? -1000); sl.needsUpdate = true; } };
  // (&layer=winter | memory | shared, the page's debug key, hides whatever is not of that layer once, after the build;
  // these batches are shown and hidden every time the trees change weight, so they keep to it themselves)
  const LAYER = Q.get('layer'), ofLayer = (mesh) => !LAYER || (mesh.userData.layerIs || 'shared') === LAYER;
  const flush = (mesh, n) => { mesh.count = n; mesh.visible = n > 0 && ofLayer(mesh); mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true; };
  const batch = async (file, list, opts, name, layer) => {
    const set = await kit.models(file, spot(list), { ...opts, name });
    const mesh = set.meshes[0]; mesh.name = name; mesh.boundingSphere.radius += 2;
    if (layer) ctx.only(set.group, layer);
    mesh.userData.layerIs = layer === 'direct' ? 'winter' : layer === 'mirror' ? 'memory' : 'shared';
    return mesh;
  };

  // WHICH OF A FRAME'S THREE PICTURES A BATCH IS DRAWN IN (fourth holder; the flood orchard's way with its plants). A frame
  // is three pictures: the scene without the water (engine.pre: what the water shows beneath itself, and how the
  // painter's filter tells water from paint), the mirror, and the picture itself. The pre picture needs none of what
  // stands wholly above the water and is thin or far: left out of it, a thing is drawn exactly as before wherever it is
  // seen against the sky or the land (the painter's filter asks only whether the water lies in front of everything
  // solid), and is left crisp where it stands in front of open water, which thin and far things are anyway. So the
  // snow on the trees, the third weight of wood and the lightest are not drawn in it: a quarter of the trees'
  // triangles and some thirty draws a frame. The boles a rider passes (first and second weight) stay in all three.
  // &prepass=1 (developer) draws everything in every picture, to compare.
  const eng = ctx.engine;
  // (`mirror: false`: nor in the water's mirror: the lightest weight, specks beyond a hundred metres whose reflections would lie on water too far off to be seen)
  const notInPre = (mesh, { mirror = true } = {}) => {
    if (!mesh || Q.get('prepass') === '1' || !eng || !eng.pre) return mesh;
    let n = 0;
    mesh.onBeforeRender = (renderer) => { n = mesh.count; if (renderer.getRenderTarget() === eng.pre || (!mirror && eng.reflecting)) mesh.count = 0; };
    mesh.onAfterRender = () => { mesh.count = n; };
    return mesh;
  };

  // ---------------------------------------------------------------------------------------------- the snow's material
  // This area's snow paint (light.js: paper above, lavender wherever it looks down, a breath of its own light), with the
  // wood's stir, so that a ridge never leaves its bough.
  // Snow that is thin ON THE SCREEN stays out of the painter's filter, as the wood does (a line of snow on a twig seen
  // from six metres is two pixels wide: the filter turns it into a pale blade beside a crisp dark twig). The models'
  // UV u carries the snow's half width in metres: a ridge of half width w is thin beyond w x 200 metres.
  const thinSnow = { uniforms: { uSnowCrispAt: { value: Q.get('crisp') === '0' ? 1e9 : 200 } }, fragmentPars: 'uniform float uSnowCrispAt;', final: 'if (vUv0.x > 0.0 && vUv0.x * uSnowCrispAt < length(vViewPos)) gl_FragColor.a = -15.0;' };
  // THE PLASTER OF SNOW UP THE WEATHER SIDE OF EVERY BOLE (the page's close band). Every tree of a design is turned its
  // own way and the weather came from one side of the world (plan.weather): so each snow model carries a thin sleeve all
  // round its bole (UV v = -1 at its foot .. -1.4 at its top, under the knuckle), and here only what faces the weather
  // is shown: A TONGUE, a hand broad at the foot where it rises out of the drift, narrowing as it climbs, over the lime
  // wash and on up the dark bark to the snow in the knuckle (there, white on ink, is where it reads); swollen two
  // fingers proud of the bark in its middle, torn at its edges, with holes where it has fallen and streaks where it
  // has held in the bark's furrows. (The first making stopped under the wash line: white on white, it could not be
  // told from lime, and under the snow light, which puts everything turned from the brighter quarter in lavender,
  // it was a mauve patch DARKER than the wash. A crust that the wind has packed on is the whitest thing on a trunk:
  // it is lit as snow that looks up is lit, whichever way it faces.)
  // (THIRD MAKING. The second was one smooth white tongue from the drift to the knuckle, lit flat: at arm's length, in
  // the bow lantern, a blank paper cut-out with shards beside it; from the lane, poured wax. A crust the wind has
  // packed on is CLOTTED and it has an under side: it is a sheet only for the first metre; above that most of it has
  // fallen and what is left is clots and the upright streaks that the bark's furrows hold, fewer the higher they are,
  // the last of them under the knuckle. Its relief is laid in its paint (the sleeve has a point every twenty
  // centimetres: it cannot be modelled there): every clot is paper above and lavender beneath, its thin edge
  // lavender; and the lantern warms it without flattening it.)
  const wth = plan.weather || { x: 0.33, z: 0.944 };
  const plaster = {
    uniforms: { uWeather: { value: new THREE.Vector2(wth.x, wth.z).normalize() } },
    vertexPars: 'uniform vec2 uWeather; varying float vPlaster; varying float vPlasterUp;',
    vertexWorld: /* glsl */`vPlaster = 0.0; vPlasterUp = 0.0;
      if (uv.y < -0.5 && uv.y > -1.5) {
        vPlaster = dot(normalize(wn.xz + vec2(1e-5)), uWeather);
        vPlasterUp = clamp((-uv.y - 1.0) / 0.4, 0.0, 1.0);
        float needV = mix(0.5, 0.84, smoothstep(0.0, 0.9, vPlasterUp)) - 0.22 * (1.0 - smoothstep(0.0, 0.14, vPlasterUp));
        wp.xyz += normalize(wn) * 0.05 * smoothstep(needV - 0.14, needV + 0.3, vPlaster) * (1.0 - 0.6 * vPlasterUp);
      }`,
    fragmentPars: /* glsl */`varying float vPlaster; varying float vPlasterUp; float gPlaster, gPlasterUp, gPlasterEdge, gPlasterH;
      float plasterH(vec3 p) { p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
      float plasterN(vec3 p) { vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(mix(plasterH(i), plasterH(i + vec3(1.0, 0.0, 0.0)), f.x), mix(plasterH(i + vec3(0.0, 1.0, 0.0)), plasterH(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
                   mix(mix(plasterH(i + vec3(0.0, 0.0, 1.0)), plasterH(i + vec3(1.0, 0.0, 1.0)), f.x), mix(plasterH(i + vec3(0.0, 1.0, 1.0)), plasterH(i + vec3(1.0, 1.0, 1.0)), f.x), f.y), f.z); }
      float plasterClot(vec3 p) { p = vec3(p.x * 0.8 + p.y * 0.36 - p.z * 0.48, -p.x * 0.3 + p.y * 0.93 + p.z * 0.2, p.x * 0.52 - p.y * 0.06 + p.z * 0.85);      // (turned, so that no clot is square to the world)
        return plasterN(p * vec3(8.0, 5.5, 8.0)) * 0.7 + plasterN(p * vec3(21.0, 15.0, 21.0)) * 0.3; }`,
    albedo: /* glsl */`gPlaster = 0.0;
      if (vUv0.y < -0.5 && vUv0.y > -1.5) {
        float up = vPlasterUp;
        // a sheet for the first metre; above it, torn into clots and into the upright streaks the furrows hold
        float sheet = 1.0 - smoothstep(0.36, 0.74, up);
        float pn = plasterN(vWPos * vec3(5.0, 3.6, 5.0)) * 0.5 + plasterN(vWPos * vec3(15.0, 9.0, 15.0)) * 0.36 + plasterN(vWPos * vec3(41.0, 29.0, 41.0)) * 0.14;
        float furrow = plasterN(vec3(vWPos.x * 19.0, vWPos.y * 2.2, vWPos.z * 19.0));
        // how squarely it must face the weather: a third of the way round at the foot, where it rises out of the drift; a
        // hand's breadth higher up (the lime wash and its brush marks stand to either side of it)
        float need = mix(0.5, 0.84, smoothstep(0.0, 0.9, up)) - 0.22 * (1.0 - smoothstep(0.0, 0.14, up));
        float keep = vPlaster - need - (pn - 0.5) * mix(0.34, 0.95, 1.0 - sheet) - (furrow - 0.5) * 0.42 * (1.0 - sheet) - 0.16 * (1.0 - sheet) - 0.5 * smoothstep(0.88, 1.0, up);
        if (keep < 0.0) discard;
        // its relief, laid in the paint: does this place of a clot look up, or down?
        float h0 = plasterClot(vWPos), h1 = plasterClot(vWPos + vec3(0.0, 0.02, 0.0));
        gPlaster = 1.0; gPlasterUp = (h0 - h1) * 3.5; gPlasterH = h0; gPlasterEdge = smoothstep(0.0, 0.09, keep);
      }`,
    // (after the snow's own light, shared.light.lift, whose uniforms these are)
    light: L.lift ? /* glsl */`if (gPlaster > 0.5) {
        float pt = clamp(0.64 + gPlasterUp + stroke * 0.05, 0.0, 1.0);
        vec3 ptone = mix(uSnowShade, uSnowFrost, smoothstep(0.16, 0.4, pt));
        ptone = mix(ptone, uSnowWarm, smoothstep(0.5, 0.76, pt));
        ptone = mix(mix(uSnowShade, uSnowFrost, 0.25), ptone, gPlasterEdge);
        c = ptone * (1.0 + 0.5 * min(lamps, vec3(1.6)));
      }` : '',
  };
  // THE TWIGS BEYOND TWENTY METRES ride in the second weight's snow file (apple_snow.py, twig_blades: the page's "bare
  // twig sprays"), marked v = -2: wood, not snow.
  // (the snow's own light, shared.light.lift, lays snow tones over whatever wears it: those points are given back the
  // ride's plain light on their own dark paint, as the wood has it)
  const twigsIn = { light: 'if (vUv0.y < -1.5) c = albedo * mix(vec3(1.0), shade, uShade) + albedo * ambient + albedo * lamps;' };
  // A LAMP ON SNOW IS GOLD ON WHITE, NEVER ROSE (fourth holder). The area's snow light adds a lamp's amber to whatever
  // tone the snow stands in, and amber added to lavender is rose: under the bow lantern the lip of every ridge overhead
  // and the line of snow on every twig was a salmon shard, the one pink thing above the water (the page keeps pink for
  // the water). Where a lamp reaches, snow's blue is held under its green: lavender warmed goes to cream and peach.
  // (If the Light group mends this in the snow light itself, this does nothing: it only ever lowers the blue.)
  // Worn after shared.light.lift by every snow material of the Trees group (kit_close.js takes it from shared.orchard).
  const lampOnSnow = { light: 'if (vUv0.y > -1.5) { float lampK = clamp(max(lamps.r, max(lamps.g, lamps.b)) * 1.6, 0.0, 1.0); c.b = mix(c.b, min(c.b, c.g * 0.94), lampK); }' };
  const snowOpts = { color: '#ffffff', brush: 0.35, steps: 4, extend: [L.dusk, L.lift, stirFx, thinSnow, plaster, twigsIn, Q.get('rose') === '1' ? null : lampOnSnow].filter(Boolean) };
  // A LONG LOW BOUGH LETS ITS SNOW GO (page cast 13: four of them, plan.slides; the cast decides when: shared.orchard.slide).
  // The mechanism lives here because it is the wood's and the snow's own shape: every instance of the two low-bough
  // designs carries the time its bough let go (aSlide; -1000: never), and
  //   - the bough, relieved, RISES on its crutch: a quarter of a metre at its tip in a third of a second, then three
  //     slow swings (0.6 Hz) down to a rest a hand higher than it lay; everything that grows on it rides with it, and
  //     so does what snow is left (the same words in the wood's material and the snow's);
  //   - THE SLAB (the two metres of the bough's own ridge between 0.40 and 0.92 of its length: the snow models' UV v)
  //     cracks for a tenth of a second, rolls off to one side and falls into the water, and is not seen again.
  // The powder, the whump and the rings on the water are the cast's.
  const slideFx = {
    vertexPars: /* glsl */`attribute float aSlide;
      float lowLift(vec3 p) {                    // metres the low bough has risen here (p: the tree's own space; the bough runs along +x)
        float t = uTime - aSlide; if (aSlide < -500.0 || t < 0.0) return 0.0;
        float on = smoothstep(1.0, 2.2, p.x) * (1.0 - smoothstep(1.1, 1.5, abs(p.z))) * (1.0 - smoothstep(4.3, 4.8, p.y)), along = p.x / 5.5;
        return on * along * along * smoothstep(0.0, 0.35, t) * (0.08 + 0.17 * exp(-0.55 * t) * cos(3.77 * max(t - 0.35, 0.0)));
      }`,
    vertexLocal: 'transformed.y += lowLift(transformed);',
  };
  const slabFx = {
    // (a piece of the ridge carries one v, the place of its middle: it falls whole)
    vertexLocal: /* glsl */`if (uv.y > 0.40 && uv.y < 0.92) {
        float ts = uTime - aSlide - 0.1;
        if (aSlide > -500.0 && ts > 0.0) {
          float tf = max(ts - 0.35, 0.0);
          transformed.z += 0.07 * smoothstep(0.0, 0.35, ts) + 0.75 * tf;                  // it cracks along its crest, leans, and goes over the bough's side
          transformed.y -= 0.03 * smoothstep(0.0, 0.35, ts) + 4.9 * tf * tf;
          // within a metre and a half of falling it has broken up (the cast's powder takes its place): the piece draws
          // in upon its own middle (its v is where that is along the bough) and is gone
          float kc = smoothstep(0.15, 0.55, tf);
          transformed.x = mix(transformed.x, 0.9 + uv.y * 4.65, kc * 0.94);
          if (kc > 0.97 || transformed.y < 0.03) transformed.y = -0.7;
        }
      }`,
  };

  // ---------------------------------------------------------------------------------------------- four weights of every design
  // One skeleton, four weights of flesh (the flood orchard's files: about 7,800 triangles, 1,900, under 600, about 170).
  // Which one a tree wears goes by how far the boat is from it and by its row, as in the flood orchard; the snow on it
  // is the snow made for that very file, and changes with it. Each weight of each design is one draw of wood (shared)
  // and one of snow (winter); an empty one is not drawn.
  const WEIGHT = ['near', 'lo', 'far', 'mote'], forced = WEIGHT.indexOf(Q.get('lod')), R_IN = +(Q.get('lodr') || 20), SLACK = 3;
  // Where each weight ends, metres from the boat. The second weight (with its twigs and its fuller snow) reaches 58 m
  // while the boat is out on the plain, where the first rank is seen side-on from 44 m as a frieze and little else is
  // in range; inside the orchard, where eighty trees stand within 58 m and those beyond 44 are seen through the nearer
  // ones, it draws in to 44 m, and the third weight from 120 m to 95 (set every frame from where the boat is). Motes:
  // the third weight within 74 m.
  const REACH = { sail: [R_IN, 58, 120], far: [R_IN, 58, 120], mote: [0, 0, 74] };
  const LO = Q.has('lor') ? [+Q.get('lor'), +Q.get('lor')] : [58, 44];
  // (the page: "sprays ... are halved on medium quality". The twigs beyond twenty metres ride in the second weight: on
  // medium quality half as many trees wear it, a third as many on low: its ring is drawn in, the first twenty metres stay)
  const SHARE = ctx.quality && ctx.quality.density < 1 ? (ctx.quality.density >= 0.75 ? 0.5 : 0.33) : 1;
  const reachOf = (r0) => Math.sqrt(R_IN * R_IN + SHARE * Math.max(0, r0 * r0 - R_IN * R_IN));
  const weightAt = (R, d) => (d < R[0] ? 0 : d < R[1] ? 1 : d < R[2] ? 2 : 3);
  const levelOf = (kind, d, was) => {
    if (forced >= 0) return forced;
    const R = REACH[kind];
    return was <= 3 && was >= weightAt(R, d - SLACK) && was <= weightAt(R, d + SLACK) ? was : weightAt(R, d);
  };
  // MEMORY: the blossom every tree within 40 m of the road carries in the water. STAND-IN for the flood orchard's lobes
  // (`lobe_01..12`) and sprays: clouds where each design's own crown says its masses belong (apple_wood.json: crown.lobes:
  // x, y = its level underside, z, w = across, tall, turn), so that they sit on the real wood. Mirror only; they give
  // their own light (light.js, `blossom`). In two weights, like the wood: full as far as the second weight reaches, one plain puff a
  // mass beyond (the water softens what is far: 300,000 triangles of far stand-in clouds were a tenth of the frame).
  const HIGH = 0.52 / 0.55;                                          // (a lobe is 0.52 of its width tall in the flood orchard; the stand-in's unit lobe is 0.55)
  const B = L.blossom;
  const puff = () => {                                               // the light stand-in: one squashed ball, pink above, lilac shade below
    const g = new THREE.SphereGeometry(0.5, 6, 3), p = g.attributes.position, n = g.attributes.normal, col = new Float32Array(p.count * 3), c = new THREE.Color();
    for (let i = 0; i < p.count; i++) { const up = n.getY(i); if (up > 0.35) c.copy(B.side).lerp(B.top, Math.min(1, (up - 0.35) / 0.5)); else c.copy(B.under).lerp(B.side, Math.min(1, Math.max(0, (up + 0.3) / 0.65))); col.set([c.r, c.g, c.b], i * 3); p.setY(i, (p.getY(i) < 0 ? p.getY(i) * 0.35 : p.getY(i)) + 0.175); }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.deleteAttribute('uv');
    return g;
  };
  const crownOf = (name, light) => {
    const parts = [];
    models[name].crown.lobes.forEach((b, i) => { const g = light ? puff() : lobeGeometry(8, 5, i + 1 + name.length); g.rotateY(b.turn || 0); g.scale(b.w, b.w * (b.tall || 1) * HIGH * (light ? 0.8 : 1), b.w); g.translate(b.x, b.y, b.z); parts.push(g); });
    return merge(parts);
  };
  const lobesFor = (name, list, light) => {
    const geo = crownOf(name, light), m = kit.instances(geo, shared.mat.blossom, list.map((e) => ({ position: [e.t.x, 0, e.t.z] })));
    m.name = light ? 'standin:every far tree: lobes (memory)' : `standin:${name} lobes (memory)`; ctx.only(m, 'mirror');      // (the Light group's memory.js takes out whatever is named '... lobes (memory)' when the flood orchard's own blossom stands)
    m.userData.tris = geo.attributes.position.count / 3; m.userData.layerIs = 'memory';
    return m;
  };
  const groves = [];
  let woodTris = 0, snowTris = 0, lobeTris = 0;
  for (const name of Object.keys(groups)) {
    const list = groups[name], files = models[name].files, snow = snowList[name.replace('apple_', '')] || snowList[name] || {}, meshes = [], snows = [], tris = [], stris = [];
    const low = name.includes('_low_') && !!orchard;               // the two designs with a long low bough: their batches carry the slide's time
    const woodOf = low ? { ...wood, extend: [...wood.extend, slideFx] } : wood, snowOf = low ? { ...snowOpts, extend: [...snowOpts.extend, slideFx, slabFx] } : snowOpts;
    const timed = (mesh) => { if (low && mesh) { const a = new THREE.InstancedBufferAttribute(new Float32Array(list.length).fill(-1000), 1); a.setUsage(THREE.DynamicDrawUsage); mesh.geometry.setAttribute('aSlide', a); mesh.userData.slide = a; } return mesh; };
    for (const w of WEIGHT) {
      { const m = w === 'mote' ? null : timed(await batch(files[w].file, list, woodOf, name + (w === 'near' ? '' : '_' + w) + ' (wood, shared)')); meshes.push(w === 'far' ? notInPre(m) : m); }
      tris.push(files[w].triangles);
      if (snow[w]) { snows.push(notInPre(timed(await batch(snow[w].file, list, snowOf, name.replace('apple_', 'apple_snow_').replace('apple_snow_low_', 'apple_low_snow_') + (w === 'near' ? '' : '_' + w) + ' (winter)', 'direct')))); stris.push(snow[w].triangles); }
      else { snows.push(null); stris.push(0); }
    }
    const remembered = list.filter((e) => e.t.memory);
    const lobes = remembered.length ? lobesFor(name, remembered, false) : null;
    groves.push({ name, list, meshes, snows, tris, stris, lobes, dirty: true });
  }
  // ONE BATCH FOR THE WHOLE ORCHARD beyond the third weight's reach (in mist, a speck: the widest design's lightest file,
  // each tree still turned, leaned and scaled its own way), and one for every far tree's stand-in blossom (design A's
  // crown as plain puffs): a draw each, where a design of its own for each was twenty-four draws a frame.
  const MOTE = 'apple_C', moteFile = models[MOTE].files.mote;
  const moteMesh = notInPre(await batch(moteFile.file, entries, wood, `${MOTE}_mote: every tree beyond the third weight (wood, shared)`), { mirror: false });
  const farLobes = lobesFor('apple_A', entries.filter((e) => e.t.memory), true);
  const sortGroves = () => {
    const bx = ctx.boat.x, bz = ctx.boat.z;
    let changed = false;
    { const u = Math.min(1, Math.max(0, (-bz - 100) / 25)), k = u * u * (3 - 2 * u), lo = reachOf(LO[0] + (LO[1] - LO[0]) * k), far = 120 - 25 * k; REACH.sail[1] = lo; REACH.far[1] = lo; REACH.sail[2] = far; REACH.far[2] = far; }
    for (const g of groves) {
      for (const e of g.list) {
        const now = levelOf(e.kind, Math.hypot(e.t.x - bx, e.t.z - bz), e.level);
        if (now !== e.level) { e.level = now; g.dirty = true; }
      }
      if (!g.dirty) continue;
      const k = [0, 0, 0, 0];
      let lb = 0;
      for (const e of g.list) {
        const w = e.level, i = k[w]++;
        if (g.meshes[w]) put(g.meshes[w], i, e); if (g.snows[w]) put(g.snows[w], i, e);
        if (g.lobes && e.t.memory && w <= 1) g.lobes.setMatrixAt(lb++, e.matrix);
      }
      for (let w = 0; w < 4; w++) { if (g.meshes[w]) flush(g.meshes[w], k[w]); if (g.snows[w]) flush(g.snows[w], k[w]); }
      if (g.lobes) flush(g.lobes, lb);
      g.dirty = false; changed = true;
    }
    if (changed) {
      let nm = 0, nl = 0;
      for (const e of entries) { if (e.level === 3) put(moteMesh, nm++, e); if (e.level >= 2 && e.t.memory) farLobes.setMatrixAt(nl++, e.matrix); }
      flush(moteMesh, nm); flush(farLobes, nl);
      woodTris = nm * moteFile.triangles; snowTris = 0; lobeTris = nl * farLobes.userData.tris;
      for (const g of groves) {
        for (let w = 0; w < 4; w++) { if (g.meshes[w]) woodTris += g.meshes[w].count * g.tris[w]; snowTris += (g.snows[w] ? g.snows[w].count : 0) * g.stris[w]; }
        if (g.lobes) lobeTris += g.lobes.count * g.lobes.userData.tris;
      }
      count.trees = { sail: plan.trees.trees.length - lost.length, far: plan.trees.far.length, motes: plan.trees.motes.length, designs: groves.length, triangles: { wood: woodTris, snow: snowTris, lobes: Math.round(lobeTris) } };
    }
    return changed;
  };
  for (const g of groves) { for (let w = 0; w < 4; w++) { if (g.meshes[w]) flush(g.meshes[w], 0); if (g.snows[w]) flush(g.snows[w], 0); } if (g.lobes) flush(g.lobes, 0); }      // (nothing is drawn until the boat is somewhere: the first frame sorts them)
  flush(moteMesh, 0); flush(farLobes, 0);

  const world = (e, x, y, z, target = new THREE.Vector3()) => target.set(x, y, z).applyMatrix4(e.matrix);

  // ---------------------------------------------------------------------------------------------- MEMORY: the two lost trees
  // (108.5, +/-10). In winter two stumps stand there (heroes_b.js); in the water both stand whole, in blossom: the flood
  // orchard's wood (its second weight: the water softens thin wood) and the stand-in blossom, both drawn in the mirror only.
  if (lost.length) {
    const by = {};
    for (const e of lost) (by[e.model] || (by[e.model] = [])).push(e);
    for (const [name, list] of Object.entries(by)) {
      const mesh = await batch(models[name].files.lo.file, list, wood, `the two lost trees: ${name}_lo (wood, MEMORY)`, 'mirror');
      list.forEach((e, k) => put(mesh, k, e)); flush(mesh, list.length);
      const m = lobesFor(name, list, false);
      list.forEach((e, k) => m.setMatrixAt(k, e.matrix)); m.instanceMatrix.needsUpdate = true;
      m.name = `standin:the two lost trees: ${name} lobes (MEMORY)`;
    }
    nameAt(ctx, F, 'the two lost trees (memory only)', [108.5, 10, 9]);
  }

  // ---------------------------------------------------------------------------------------------- the crutches
  // The flood orchard's crutch_A .. crutch_H (source-art/models/orchard/crutch.py; assets/models/orchard/crutches.json says
  // how each design stands), AS THEY ARE AND WHERE THAT AREA STANDS THEM: this block is src/realms/orchard/kit_trees.js,
  // "the crutches", line for line (the same designs in the same order, the same draws from the same seed), so that the
  // pole a rider passed in spring is the pole that stands here in the ice, at the same slant. Two kinds:
  //   a forked pole (crutch_A; crutch_B, pieced out of two poles; crutch_H, a young tree's whole stem): modelled upright
  //     and SET ASLANT, as a prop is: 7 to 12 degrees in its bough's own plane;
  //   shear legs (crutch_C .. _G): two poles crossed under the bough and lashed where they cross, their feet apart
  //     ALONG the bough: the key painting's leaning pairs.
  // Thirteen stand under the avenues' long low boughs (each tree's own design says where its cradle is): A, C and B in
  // turn up the orchard. Nine stand under the oldest tree's limbs, where the monument says each limb bears
  // (shared.tree.props, turned to the limb that passes over: shared.tree.paths; without that module, by the plan's own
  // numbers): F, G, F, G, E, D, H, E, D. Where each leg goes into the water is worked out from the design's own numbers;
  // a foot that stands away from the plan's own collider keeps the hull off by itself.
  // Their winter (the snow on the prongs, the collar of ice round each pole): the nine under the oldest tree are the
  // Monument group's (heroes.js finds these batches by their names: keep `crutch_X ...`), the thirteen are kit_close.js's.
  if (orchard) {
    const T = plan.tree, rc = ctx.rng(4617);
    let how = null;
    try { how = (await (await fetch('assets/models/orchard/crutches.json')).json()).designs; } catch (err) { console.error(`INVALID_MODEL snow trees: assets/models/orchard/crutches.json could not be read (${err.message}): no crutches stand`); }
    const lists = Object.fromEntries(Object.keys(how || {}).map((k) => [k, []])), feet = [], stood = [];
    const wear = ['#ffffff', '#ece8f1', '#f5f0ea', '#e3e5ee', '#f8f3f5'];
    const P0 = new THREE.Vector3(), W = new THREE.Vector3();
    // name: the design; at: its cradle; way: the bough's heading there; lean: how far a forked pole is set aslant
    // (radians; +: its foot stands toward the bough's own +X end); prop: one of the nine under the oldest tree
    const add = (name, at, way, lean = 0, prop = false) => {
      const d = how[name];
      if (at.y > d.reach + 0.05) console.error(`snow/kit_trees: ${name} is made for a cradle up to ${d.reach} m and stands under one at ${at.y.toFixed(2)} m`);
      const m = new THREE.Matrix4().compose(at, _q.setFromEuler(_e.set((rc() - 0.5) * 0.05, way, d.kind === 'single' ? lean : (rc() - 0.5) * 0.04, 'YXZ')), _s.setScalar(1));
      lists[name].push({ matrix: m, tint: wear[Math.floor(rc() * wear.length)], t: { x: at.x, z: at.z } });
      stood.push({ name, matrix: m, prop });
      // where it meets the water: down the pole (or down each leg from where the two cross) to y = 0, in the realm
      const foot = (px, py, pz, dx, dy, dz) => { P0.set(px, py, pz).applyMatrix4(m); W.set(dx, dy, dz).transformDirection(m); const k = P0.y / -W.y; return { x: P0.x + W.x * k, z: P0.z + W.z * k, r: d.radius || 0.07, prop, name }; };
      const mine = d.kind === 'single' ? [foot(0, 0, 0, 0, -1, 0)] : [foot(0, -d.cross, -d.radius, -Math.sin(d.rake[0]), -Math.cos(d.rake[0]), 0), foot(0, -d.cross, d.radius, Math.sin(d.rake[1]), -Math.cos(d.rake[1]), 0)];
      for (const f of mine) {
        feet.push(f);
        if (Math.hypot(f.x - at.x, f.z - at.z) > 0.3) {             // (the plan's own collider stands under the cradle: a foot away from it keeps the hull off by itself)
          const c = { x: f.x, z: f.z, r: 0.25, flow: true };
          ctx.addCollider(c); if (ctx.state.colliders) ctx.state.colliders.push(c);      // (and the realm bends the current round it, as round every post: snow.js)
        }
      }
      return mine;
    };
    if (how) {
      // ---- the avenues: by their place up the orchard, A, C, B in turn (every tree of the plan in that area's order: the
      // two lost ones carry no low bough, so the turn is the same here)
      const low = [...entries, ...lost].filter((e) => models[e.model].crutch).sort((p, q) => (p.t.s - q.t.s) || (p.t.d - q.t.d));
      low.forEach((e, k) => {
        const c = models[e.model].crutch;
        _e.setFromRotationMatrix(e.matrix, 'YXZ');
        // (a forked pole leans back against the weight: three in five with the foot out toward the lane, the rest the other way)
        add(['crutch_A', 'crutch_C', 'crutch_B'][k % 3], world(e, c.top[0], c.top[1], c.top[2]), _e.y, (rc() < 0.6 ? 1 : -1) * (0.12 + rc() * 0.09));
      });
      // ---- the oldest tree's nine
      const given = shared.tree && shared.tree.props, paths = (shared.tree && shared.tree.paths) || [];
      const lines = [T.lampLimb.line, T.arch.line, T.westLimb.line];
      const PROPS = ['crutch_F', 'crutch_G', 'crutch_F', 'crutch_G', 'crutch_E', 'crutch_D', 'crutch_H', 'crutch_E', 'crutch_D'];
      T.props.forEach(([s, d, h], i) => {
        const g = given && given[i], at = g && Number.isFinite(g.x) ? new THREE.Vector3(g.x, g.y, g.z) : F.at(s, d, h);
        // which way the limb runs here: along the modelled limb that passes over the prop (shared.tree.paths); else along
        // the plan's own line if the prop stands under one; else out from the bole
        let way = null, best = 2.5;
        for (const q of paths) for (let k = 0; q.path && k + 1 < q.path.length; k++) {
          const a = q.path[k], b = q.path[k + 1], L2 = (b.x - a.x) ** 2 + (b.z - a.z) ** 2 || 1, u = Math.min(1, Math.max(0, ((at.x - a.x) * (b.x - a.x) + (at.z - a.z) * (b.z - a.z)) / L2));
          const off = Math.hypot(at.x - a.x - (b.x - a.x) * u, at.z - a.z - (b.z - a.z) * u, (at.y - (a.y + (b.y - a.y) * u)) * 0.5);
          if (off < best) { best = off; way = Math.atan2(-(b.z - a.z), b.x - a.x); }
        }
        if (way === null) {
          let ds = s - T.at[0], dd = d - T.at[1], near = 1.5;
          for (const line of lines) for (let k = 0; k < line.length - 1; k++) {
            const [s0, d0] = line[k], [s1, d1] = line[k + 1], L2 = (s1 - s0) ** 2 + (d1 - d0) ** 2, u = Math.min(1, Math.max(0, ((s - s0) * (s1 - s0) + (d - d0) * (d1 - d0)) / L2));
            const off = Math.hypot(s - s0 - (s1 - s0) * u, d - d0 - (d1 - d0) * u);
            if (off < near) { near = off; ds = s1 - s0; dd = d1 - d0; }
          }
          const a = F.at(s, d), b = F.at(s + ds * 0.1, d + dd * 0.1); way = Math.atan2(-(b.z - a.z), b.x - a.x);
        }
        add(PROPS[i], at, way, (i % 2 ? 1 : -1) * (0.07 + rc() * 0.05), true);
      });
      // (no lime wash on a prop, no flood's marks; old timber drinks half of a lantern's light, as in the flood orchard)
      const prop = orchard.woodOptions(ctx, null, bark, { still: true, flood: 0, dusk: null, drink: Q.has('drink') ? +Q.get('drink') : 0.5 });
      const timber = { ...prop, color: INK, extend: [...prop.extend, L.dusk, L.wet] };
      for (const [name, list] of Object.entries(lists)) {
        if (!list.length) continue;
        const mesh = await batch(`models/orchard/${name}.glb`, list, timber, `${name} x${list.length} (shared)`);
        mesh.boundingSphere.radius += 2;                                                        // (a pair's feet stand well away from its cradle)
        list.forEach((e, k) => put(mesh, k, e)); flush(mesh, list.length);
      }
    }
    count.crutches = Object.fromEntries(Object.entries(lists).filter(([, v]) => v.length).map(([k, v]) => [k, v.length]));
    shared.crutchFeet = feet;                                       // where each leg goes into the water: { x, z, r, prop, name } (prop: one of the nine under the oldest tree)
    shared.crutches = stood;                                        // every crutch as it stands: { name, matrix (its own frame -> the realm), prop }
  }

  // ---------------------------------------------------------------------------------------------- the hedge
  // hawthorn_bare_18m (SHARED) and hedge_snow_18m (WINTER): source-art/models/snow/hawthorn_bare.py. A laid hedge let go,
  // bare, 3 m tall, 82 m either side of the centre line from the first rank on into the mist: THE DARK LINE THAT CLOSES
  // EVERY CROSS AISLE. A thicket two metres and more tall (its body: broad, painted), a fringe of regrowth as thin
  // blades standing out of its top and face (the model marks them, UV u = 1: kept out of the painter's filter, which
  // would wipe them), the old laying still showing on its face (pleachers at every slant, stakes), snow lodged along
  // its top in broken lumps. Three six-metre variants set end to end in one file (a draw of wood and a draw of snow
  // for all of it), never mirrored (a hedge is laid one way); its face is turned to the orchard on both sides. Each
  // length: its own height, depth, tint and place in the line.
  {
    const H = plan.hedge, land = shared.land, rh = ctx.rng(8233), tintH = ['#ffffff', '#f1edf6', '#f8f1ee', '#e9e9f2'], list = [], LEN = 18;
    for (const side of [-1, 1]) for (let s0 = H.from; s0 < H.to; s0 += LEN) {
      const p = F.at(s0 + LEN / 2 + (rh() - 0.5) * 2, side * (H.d + (rh() - 0.5) * 0.8));
      list.push({ position: [p.x, land.snowHeight(p.x, p.z, 60, side) - 0.1, p.z], rotation: [0, -side * Math.PI / 2 + (rh() - 0.5) * 0.05, 0], scale: [1.0 + rh() * 0.05, 0.86 + rh() * 0.3, 0.9 + rh() * 0.3], tint: tintH[Math.floor(rh() * 4)] });
    }
    const thinTwigs = { final: 'if (vUv0.x > 0.5) gl_FragColor.a = -15.0;' };
    const w = await kit.models('models/snow/hawthorn_bare_18m.glb', list, { color: Q.get('hedgeink') ? '#' + Q.get('hedgeink').replace('#', '') : '#ffffff', brush: 0.6, name: 'hawthorn_bare_18m', extend: [L.dusk, L.wet, thinTwigs] });
    w.meshes[0].name = `hawthorn_bare_18m x${list.length} (shared)`;
    const sn = await kit.models('models/snow/hedge_snow_18m.glb', list.map((it) => ({ ...it, tint: '#ffffff' })), { brush: 0.35, steps: 4, crisp: true, name: 'hedge_snow_18m', extend: [L.dusk, L.lift] });
    sn.meshes[0].name = `hedge_snow_18m x${list.length} (winter)`; ctx.only(sn.group, 'direct'); notInPre(sn.meshes[0]);
    count.hedge = { lengths: list.length, metres: list.length * LEN };
    nameAt(ctx, F, `hawthorn_bare_18m: ${list.length} lengths, with hedge_snow_18m`, [130, 82, 3.5]);
  }

  // ---------------------------------------------------------------------------------------------- what the others hang things on
  const list6 = (e, a) => { const out = []; for (let i = 0; i < a.length; i += 6) { const p = world(e, a[i], a[i + 1], a[i + 2]), d = _v.set(a[i + 3], a[i + 4], a[i + 5]).transformDirection(e.matrix); out.push({ x: p.x, y: p.y, z: p.z, dx: d.x, dy: d.y, dz: d.z }); } return out; };
  // every fourth twig end of every avenue tree, in the realm (for perches and sifts: about 15,000 places); endsOf(t) has all of one tree's
  const ends = [];
  for (const e of entries) if (e.kind === 'sail') { const a = models[e.model].ends; for (let i = 0; i < a.length; i += 24) ends.push(world(e, a[i], a[i + 1], a[i + 2])); }
  const bumpFns = [];
  shared.orchard = {
    ends, models, trees: entries, lost,
    of: (t) => byTree.get(t),
    /** Which weight a tree wears now: 0 near, 1, 2, 3 (the lightest). */
    levelOf: (t) => byTree.get(t).level,
    toRealm: (t, p, target) => world(byTree.get(t), p[0], p[1], p[2], target),
    /** All of one tree's twig ends, in the realm: [{ x, y, z, dx, dy, dz }] (the tip, and the way the twig points). */
    endsOf: (t) => list6(byTree.get(t), models[byTree.get(t).model].ends),
    spursOf: (t) => list6(byTree.get(t), models[byTree.get(t).model].spurs),
    /** Places on top of near-level wood in one tree (for a bird that sits): [Vector3]. */
    perches: (t) => { const e = byTree.get(t), a = models[e.model].perch, out = []; for (let i = 0; i < a.length; i += 3) out.push(world(e, a[i], a[i + 1], a[i + 2])); return out; },
    /** fn(tree, strength): called when the boat bumps a trunk (the crown shakes: the cast lets a sift of powder go). */
    onBump: (fn) => { bumpFns.push(fn); },
    /** The stir of the wood and of everything on it (an extension for kit.gouache: snow, sprays, apples take it). */
    stir: stirFx,
    /** Leave an instanced batch out of the frame's pre picture (the scene without the water): for what is thin or far and stands wholly above the water. Returns the mesh. */
    notInPre,
    /** A lamp on snow is gold on white, never rose (an extension for kit.gouache, worn AFTER shared.light.lift; the model needs UVs: v < -1.5 marks what is not snow). */
    lampOnSnow,
    /**
     * A long low bough lets its snow go (page cast 13). t: the plan's tree (one of slides). The bough rises and swings,
     * its slab cracks, rolls off and falls (0.1 s to 0.9 s after the call); `settled: true` puts the tree in its
     * after-state at once (for a cue that is already behind the boat). Returns where the slab falls from, in the
     * realm: { x, y, z, alongX, alongZ, length } (for the powder, the whump and the rings), or null if t has no low bough.
     */
    slide: (t, { settled = false } = {}) => {
      const e = byTree.get(t); if (!e || !(e.kind === 'sail' && t.low) || !orchard) return null;
      e.slideAt = ctx.engine.shared.uTime.value - (settled ? 100 : 0);
      for (const g of groves) if (g.name === e.model) g.dirty = true;
      const a = world(e, 2.85, 3.75, 0.25), b = world(e, 5.05, 3.75, 0.25);
      return { x: (a.x + b.x) / 2, y: 3.7, z: (a.z + b.z) / 2, alongX: b.x - a.x, alongZ: b.z - a.z, length: 2.2 };
    },
    /** The four trees whose low boughs slide (plan.slides), as the plan's trees. */
    slides: plan.slides.map(([ss, dd]) => plan.trees.trees.find((t) => Math.abs(t.s - ss) < 1 && Math.abs(t.d - dd) < 1)).filter(Boolean),
    /** The air in the boughs: metres at the tips (0.055 in winter's stillness). */
    sway: (metres) => { if (wood.stir) wood.stir.uBlow.value.z = ctx.reducedMotion ? Math.min(metres, 0.02) : metres; },
  };
  count.twigEnds = ends.length;
  nameAt(ctx, F, 'apple_A..F, apple_low_A/B: the flood orchard\'s wood (shared), this area\'s snow (winter), stand-in lobes (memory)', [117.5, 10, 9.5]);

  let lastBump = -10; const own = { t: -1, amount: 0 };
  let slideAt = Q.has('slide') ? +Q.get('slide') : -1;                  // &slide=<seconds> (developer): the four low boughs let go at that time
  return {
    update(dt) {
      if (slideAt >= 0 && ctx.time >= slideAt) { slideAt = -1; for (const t of shared.orchard.slides) shared.orchard.slide(t); }
      sortGroves();
      // a bumped trunk shakes its crown (and the cast lets powder go: onBump)
      const boat = ctx.boat;
      if (boat.bumped > 0.04 && ctx.time - lastBump > 2.5) {
        const fx = boat.x - Math.sin(boat.heading) * 1.85, fz = boat.z - Math.cos(boat.heading) * 1.85;
        let hit = null, best = 2.1;
        for (const e of entries) { if (e.kind !== 'sail') continue; const t = e.t, d = Math.min(Math.hypot(t.x - boat.x, t.z - boat.z), Math.hypot(t.x - fx, t.z - fz) + 0.6); if (d < best) { best = d; hit = t; } }
        if (hit) {
          lastBump = ctx.time;
          if (wood.stir) { wood.stir.uShakeB.value.set(hit.x, hit.z, 5.5, 0); own.t = 0; own.amount = 0.03 + 0.04 * boat.bumped; }
          for (const fn of bumpFns) { try { fn(hit, boat.bumped); } catch (err) { console.error(err); } }
        }
      }
      if (own.t >= 0 && wood.stir) { own.t += dt; const u = own.t / 3; wood.stir.uShakeB.value.w = u >= 1 ? 0 : own.amount * Math.min(1, u * 8) * (1 - u) * (1 - u); if (u >= 1) own.t = -1; }
    },
  };
}
