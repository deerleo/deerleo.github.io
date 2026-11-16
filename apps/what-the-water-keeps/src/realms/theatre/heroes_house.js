// The theatre of leaves: the architecture of the house among the hero pieces (stage 2, "the other hero pieces: the house").
//
//   proscenium.glb         the arch between house and stage, its RIGHT HALF (the left is its mirror image, made when it loads): the giant
//                          column on its pedestal, half the archivolt, reveal, spandrel and entablature, six of the arch's twelve
//                          candle brackets; on the stage side, brick and the cleats with the curtain's line
//   proscenium_crown.glb   what sits on its centre line: the shield in its wreath, the ribbons, the boss at the crown of the soffit
//   stage_box.glb          a stage box, the right-hand one (and its mirror image)
//   pelmet.glb             the drapery in the head of the arch
//   royal_wall.glb         the arch wall between foyer and house, the right half of its arcade (and its mirror image)
//   royal_box.glb          the royal box over it, and the middle arch's keystones
//   dome.glb               the painted saucer with the tear; two broken ribs that hang and swing (parts)
//   foyer_stairs.glb       a foyer stair, the right-hand one (and its mirror image)
// shared.houseModels holds them by name; `<name>_left`.point(name) is a named point of a mirrored half. Points and parts: the log.
//
// Each model stands where its stand-in stood (heroes.js is the tree modeller's file: the stand-ins are taken out from
// here with removeStandIn once the model is in; a model that fails to load leaves its stand-in standing).
// How they were made, what the page asked that was changed, named points and moving parts: docs/build/theatre/2-heroes-house.md.
// The Blender scripts are source-art/models/theatre/<name>.py (helpers: househelp.py).
//
// Paint. Gold is a detail on green: every model has a slot `paint` (painted grounds: bottle green and petrol) and a slot
// `gilt` (everything carved and gilded), so that the house's light (light.js) gives a flame's glint and the wet gleam
// to the gilding and not to a painted wall. Other slots: `back` (the stage side: brick and timber), `velvet`, `picture`.
//
// Things that hang (tassels, cloth swags, a coil of rope, lath ends) sway a little all the time: in the models their
// points carry, as UVs, a phase and how many metres they hang below what holds them (househelp.hang), and HANG below
// swings them by that. shared.houseHang.value scales it (1 at rest): the staging raises it in a gust.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { removeStandIn } from '../../engine/modules.js';
import { at, house, dev } from './lib.js';

export async function build(ctx, plan, shared) {
  const { kit } = ctx, H0 = house(ctx, plan, shared);
  // (sixth holder) NO PAINT BELOW ZERO. A moulding painted by its profile changes from gilt to green across a facet a few millimetres wide. Far off such
  // a facet is thinner than a pixel, the pixel's centre lies outside it, and the paint is read beyond its end: gilt minus green, a NEGATIVE red. The
  // house's light then takes more red out than is there and the pixel comes out electric blue: the "row of blue dashes on the proscenium's cornice" in
  // the first image (2-light.md), which no vertex of the model is painted. Every paint of this module holds its colour at nothing or more.
  const SAFE = { albedo: 'albedo = max(albedo, vec3(0.0));' };
  const H = dev.has('housesafe') && +dev.get('housesafe') === 0 ? H0 : { ...H0, dress: (kind, over = null) => H0.dress(kind, { ...(over || {}), extend: [SAFE, ...[].concat((over && over.extend) || [])] }) };
  const hang = shared.houseHang = { value: dev.has('hang') ? +dev.get('hang') : 1 };      // (&hang=0 stills what hangs, &hang=8 swings it wide: to check which points move)
  const HANG = {
    uniforms: { uHang: hang },
    vertexPars: 'uniform float uHang;',
    // (wp is the world position; uv.x a phase 0..1, uv.y metres hung below the fixing: 0 for everything that stands still)
    vertexWorld: /* glsl */`{ float hw = uv.y; if (hw > 0.0005) { float ph = uv.x * 6.2831853;
      vec2 dir = vec2(cos(ph * 5.0), sin(ph * 5.0));
      float sw = sin(uTime * (0.95 + 0.5 * fract(uv.x * 7.31)) + ph * 3.0) * 0.65 + sin(uTime * 0.31 + ph) * 0.35;
      wp.xz += dir * (sw * hw * 0.035 * uHang); } }`,
  };
  const paints = () => ({
    ...H.dress('petrol', { extend: HANG }),                                        // the slot `paint`: painted grounds
    materials: {
      gilt: H.dress('gilt', { extend: HANG }),
      back: H.dress('brick', { detail: !(dev.has('backbrick') && +dev.get('backbrick') === 0) }),      // (sixth holder: with the courses, limewash and chalk that light.js paints on the stage house's own walls, which it stands between; &backbrick=0 is the plain paint)
      velvet: H.dress('velvet', { extend: HANG, side: THREE.DoubleSide }),
    },
  });
  // ---- THE FLAMES THE HOUSE'S LIGHT DOES NOT SEE (third holder: 2-heroes-house.md, "Second look"). light.js works the candle pools out from
  // the box-front line and from the proscenium opening's edge. Two of this module's pieces carry flames that arithmetic does not reach:
  // the shield at the crown of the arch (the pools lie on the opening's edge, 0.6 m below the innermost brackets and inside them: the
  // shield between those two brackets stayed dark, a ball in a ring), and the inside of the royal box. Such a piece takes, beside the
  // house's light, a pool FROM ITS OWN FLAMES: plan.flames() gives their places and kindle times, so they catch with the flames
  // themselves and move with the plan. Same colour, same law of distance (housePool) and same cap as the house's pools.
  // Only with the house's light, second version (light.js): &light=1 and &raw=1 have none of its uniforms.
  const flameGroups = (pick, by) => { const g = new Map();
    for (const f of plan.flames()) if (pick(f)) { const k = by(f), e = g.get(k) || g.set(k, { p: new THREE.Vector3(), t: 0, n: 0 }).get(k); e.p.add(at(ctx, f.s, f.d, f.y)); e.t += f.t; e.n++; }
    return [...g.values()].map((e) => new THREE.Vector4(e.p.x / e.n, e.p.y / e.n, e.p.z / e.n, e.t / e.n)); };
  // (warm: how far a cool surface is taken toward a warm grey under the flame, as the house's pools do it, 1; velvet takes 0.25 of it and
  // stays bottle green by candlelight, as the tier kit's hangings do)
  const ownFlames = (groups, gain = 1, reach = 1.3, warm = 1) => (!dev.second || !groups.length ? null : {
    defines: { HH_FLAMES: groups.length },
    uniforms: { uHhFlames: { value: groups }, uHhGain: { value: new THREE.Vector3(gain, reach, warm) } },
    fragmentPars: 'uniform vec4 uHhFlames[HH_FLAMES]; uniform vec3 uHhGain;',
    light: /* glsl */`{ if (uShow > 0.0) {
      float hhLum = dot(albedo, vec3(0.3, 0.55, 0.15));
      vec3 hhAlb = mix(albedo, vec3(hhLum) * vec3(1.14, 0.95, 0.76), uHhGain.z * uWarmP.x * clamp((max(albedo.g, albedo.b) - albedo.r) / max(hhLum, 0.03) * 2.0, 0.0, 1.0));
      for (int i = 0; i < HH_FLAMES; i++) {
        vec3 hhL = uHhFlames[i].xyz - vWPos; float hhD2 = dot(hhL, hhL);
        float hhK = housePool(hhD2, uPoolP.x * uHhGain.y) * smoothstep(0.0, 0.9, uShow - uHhFlames[i].w) * max(dot(N, hhL * inversesqrt(max(hhD2, 1e-4))) * 0.6 + 0.4, 0.0) * uHhGain.x;
        vec3 hhC = uCandleCol * uTake.y * hhAlb * hhK;
        c += hhC / (1.0 + max(hhC.r, max(hhC.g, hhC.b)) * uWarmP.z); } } }`,
  });
  const paintsWith = (own) => { const P0 = paints(); if (!own) return P0;
    return { ...H.dress('petrol', { extend: [HANG, own] }), materials: { ...P0.materials, gilt: H.dress('gilt', { extend: [HANG, own] }), velvet: H.dress('velvet', { extend: [HANG, own], side: THREE.DoubleSide }) } }; };
  // (the kindled house as one broad light, for what the house's candle pools do not reach: the pelmet, the royal box's canopy, a looking-glass.
  // update() sets it from the cloth cast's own numbers and the share of flames burning.)
  const houseLit = shared.houseLit = { value: new THREE.Color(0, 0, 0) };
  const M = shared.houseModels = {};
  /** Load one model; when it stands, take its stand-in out. A model that is not there yet leaves the stand-in. */
  const stand = async (name, standIn, make) => {
    try { M[name] = await make(); if (standIn) removeStandIn(ctx, standIn); }
    catch (err) { console.warn(`theatre/heroes_house: ${name} is not in yet (${(err && err.message) || err}); its stand-in stays`); }
  };

  // A piece that is the same left and right is modelled and written as its RIGHT HALF only (half the bytes). When it is
  // loaded every mesh of it is given its own mirror image as well, across the model's x = 0 (x is d): so both halves are
  // ONE draw call a slot, as a whole model would be. What sits on the centre line is a small file of its own.
  // (2-heroes-house.md, "halves". M.<name> is the model; M.<name>_left answers point(name) for the mirrored half.)
  const FLIP = new THREE.Matrix4().makeScale(-1, 1, 1);
  const mirrored = (model) => {
    const root = model.group; root.updateMatrixWorld(true);
    const toRoot = new THREE.Matrix4().copy(root.matrixWorld).invert(), a = new THREE.Matrix4(), b = new THREE.Matrix4();
    root.traverse((o) => {
      if (!o.isMesh) return;
      a.multiplyMatrices(toRoot, o.matrixWorld);                                   // the mesh in the model's own axes
      b.copy(a).invert().multiply(FLIP).multiply(a);                               // the mirror across the model's x = 0, as the mesh sees it
      let g = o.geometry;                                                          // (the file's own geometry is shared and stays as it is)
      if (!g.index) { g = g.clone(); g.setIndex([...Array(g.attributes.position.count).keys()]); }
      const m = g.clone().applyMatrix4(b), ix = m.index.array;
      for (let i = 0; i < ix.length; i += 3) { const t = ix[i + 1]; ix[i + 1] = ix[i + 2]; ix[i + 2] = t; }      // a mirror image is wound the other way
      o.geometry = mergeGeometries([g, m], false); m.dispose();
    });
    return { point(name, target = new THREE.Vector3()) {
      const node = model.points[name]; if (!node) return model.point(name, target);                 // (which reports the missing point)
      node.getWorldPosition(target).applyMatrix4(toRoot); target.x = -target.x; target.applyMatrix4(root.matrixWorld);
      return ctx.group ? ctx.group.worldToLocal(target) : target;
    } };
  };
  const both = async (name, file, place, dress = null) => { const m = await kit.model(file, { ...place, ...(dress || paints()) }); M[name + '_left'] = mirrored(m); return m; };

  // ---- the proscenium: placed by the middle of its house face at the water. In the model x = d, y = s - 89.2, z = height.
  // proscenium.glb is its right half (the giant column, half the arch, the stage side with its cleats); proscenium_crown.glb the shield in its wreath.
  const PRO = { at: [plan.proscenium.s[0], 0, 0], face: 'back' };
  await stand('proscenium', /^proscenium$/, async () => {
    // (the crown takes the light of the two brackets that flank it, the innermost of the arch's twelve)
    const crownFlames = flameGroups((f) => f.where === 'arch' && Math.abs(f.d) < 2.6, (f) => Math.sign(f.d));
    M.proscenium_crown = await kit.model('models/theatre/proscenium_crown.glb', { ...PRO, ...paintsWith(ownFlames(crownFlames, 1.0, 1.3)) });
    return both('proscenium', 'models/theatre/proscenium.glb', PRO);
  });

  // ---- the two stage boxes: the file is the right-hand box in the house's own axes (stage_box.py), placed by the middle of its
  // front line; the left-hand box is the same file mirrored
  // (third holder) What hangs in a stage box's opening (the pelmet, the great swag, the curtains) stands a metre over that level's own
  // five-candle branch. The house's pool turns bottle green to a warm grey: by it alone the largest swags of the house were pale grey
  // cloths. They take less of that and, from their own branch, candlelight that leaves velvet green (as kit_tiers.js lights its hangings).
  const boxFlames = flameGroups((f) => f.where === 'stagebox', (f) => Math.sign(f.d) * f.tier);
  const boxOwn = ownFlames(boxFlames, 0.85, 1.5, 0.25);
  // (sixth holder: the hangings' wet gleam and their share of the moon were 0.15 and 0.7: before the hour the great swags were flat dark shapes and the tied-back
  // curtains could not be seen beside the kit's, whose pleats the moon picks out. Kindled it makes no difference. &boxvel=<gleam>,<moon> tries others.)
  const BOXVEL = dev.has('boxvel') ? dev.get('boxvel').split(',').map(Number) : [0.35, 0.9];
  const boxDress = { ...paints() };
  boxDress.materials = { ...boxDress.materials, velvet: H.dress('velvet', { extend: [HANG, boxOwn].filter(Boolean), side: THREE.DoubleSide, take: [0.7, boxOwn ? 0.25 : 0.8, BOXVEL[1], 1], keep: [0.6, 1, BOXVEL[0], 0.12] }) };
  // (fifth holder) A branch of FIVE candles is a larger light than the house's three-armed girandoles, and it is the only light on six metres of
  // front: the house's own pool (one bracket's) left the garlands to either side of the shield in the grey of the wet gleam, and the grandest
  // box of each tier was the dullest stretch of the wall beside the kit's bays, which have a bracket every 3.3 m. Its carving takes, beside
  // the house's pool, a wider and gentler one from its own branch: gold by the shield, dying into the dark toward both ends. (&boxgilt=0: without)
  const boxGilt = dev.has('boxgilt') && +dev.get('boxgilt') === 0 ? null : ownFlames(boxFlames, 0.55, 2.1, 1);
  if (boxGilt) boxDress.materials.gilt = H.dress('gilt', { extend: [HANG, boxGilt] });
  // (sixth holder) THE ROOM BEHIND A STAGE BOX'S LOWEST OPENING is hung with the house's damask (the kit's painted swatch, as the foyer's walls
  // and the kit's own boxes are): the slot `lining`, whose UVs are the picture's own (stage_box.py; u below -50 marks woodwork: no figure).
  // It is woven in two tones as light.js weaves the foyer's, so that leaf and garland read at the back of the box by the moon; it takes
  // little water-light (on the plain wall that stood there the web lay as smoke) and more of the room's dark than its value alone would give.
  let silkTex = null;
  try { silkTex = await ctx.tex('art/theatre/gilt_damask.webp', { repeat: true }); silkTex.wrapS = silkTex.wrapT = THREE.RepeatWrapping; silkTex.needsUpdate = true; }
  catch (err) { console.warn('theatre/heroes_house: the damask did not load; the stage boxes are lined with plain silk'); }
  // THE PIER-GLASS in that room (u below -150) is old looking-glass: it holds a little of whatever light the house has. Before the hour the
  // moon's pearl, in step with the moon's own strength (the house's uShaft.w: it breathes as cloud crosses the tear); as the house kindles,
  // the lit tiers opposite, warm. (&boxglass=<moon>,<house> tries other shares.)
  const glassK = (dev.has('boxglass') ? dev.get('boxglass').split(',').map(Number) : [0.3, 2.8]);
  const SILK = { uniforms: { tHhSilk: { value: silkTex }, uHhLit: houseLit, uHhGlass: { value: new THREE.Vector2(glassK[0], glassK[1]) } },
    fragmentPars: 'uniform sampler2D tHhSilk; uniform vec3 uHhLit; uniform vec2 uHhGlass;',
    albedo: silkTex ? /* glsl */`if (vUv0.x > -50.0) { vec3 hhS = texture2D(tHhSilk, vUv0).rgb; float hhF = smoothstep(0.075, 0.17, dot(hhS, vec3(0.3, 0.55, 0.15)));
      albedo *= mix(vec3(0.6, 0.62, 0.64), vec3(2.0, 1.9, 1.45), hhF) * (0.8 + 0.2 * hhS / 0.11); }` : '',
    light: /* glsl */`if (vUv0.x < -150.0) { float hhGl = dot(albedo, vec3(0.3, 0.55, 0.15));
      c += mix(albedo, vec3(hhGl), 0.6) * vec3(0.7, 0.78, 0.74) * (uHhGlass.x * uShaft.w) + mix(albedo, vec3(hhGl), 0.5) * uHhLit * vec3(1.0, 0.84, 0.62) * uHhGlass.y; }` };
  boxDress.materials.lining = H.dress('damask', { wake: true, take: [dev.has('boxwake') ? +dev.get('boxwake') : 0.12, 0.8, 1, 1], keep: [0.5, 1.6, 0.14, 0.1], extend: SILK });
  await stand('stage_box', 'stage_box x 2', () => both('stage_box', 'models/theatre/stage_box.glb', { at: [plan.stageBoxLevels[0].s, 0, 0], face: 'back' }, boxDress));

  // ---- chairs left standing in the parterre level of each stage box, in water to their seats (the floor kit's own chair, chair.py: no
  // second chair is modelled). Places in the box's own axes (x along its front toward the house, y back from its line), as stage_box.py has them.
  if (M.stage_box) try {
    const SEATS = [[-1.15, 0.95, 0.25, 0.05], [0.15, 1.2, -0.35, 0], [2.25, 0.85, 0.1, -0.07]], chairs = [];      // x, y, a turn of its own, a lean
    for (const b of plan.stageBoxLevels) if (b.tier === 0) {
      const T = -Math.abs(b.turn), cs = Math.cos(T), sn = Math.sin(T);
      for (const [x, y, turn, lean] of SEATS) chairs.push({ at: [b.s + x * sn + y * cs, b.side * (x * cs - y * sn + Math.abs(b.d)), 0],
        rotation: [lean, b.side * (-2.675 + turn), lean * 0.6], tint: ['#ffffff', '#f2ead8', '#fff4e2'][chairs.length % 3] });
    }
    // (the kit reads the chair's surfaces one by one with an extension of its own; dressed as plain gilt its green pad and its gilding were both
    // the room's dark: it keeps more of its own colour here, so that a pale back shows over the rail before the hour as the kit's chairs do)
    M.stage_box_chairs = await kit.models('models/theatre/chair_a.glb', chairs, H.dress('gilt', { wake: true, keep: [0.6, 1.5, 0.8, 0.8] }));
  } catch (err) { console.warn(`theatre/heroes_house: the stage boxes' chairs are not in (${(err && err.message) || err})`); }

  // ---- the pelmet: in the head of the arch, before the house curtain; the same axes as the proscenium
  // (third holder) It hangs behind the arch, where the house's candle pools do not reach (they lie on the opening's edge on the house face):
  // lit by them alone it was a pale grey ribbon in front of a curtain of deep green and gold. It takes what the cloth cast's curtain
  // takes: the KINDLED HOUSE AS ONE BROAD LIGHT on its face (plan.castCloth.curtain.lit and litGain, times the share of flames burning),
  // modelled by the same one light up and to the left; gold thread answers it more than velvet does. And less of the moon's grey.
  const LIT = (k) => ({ uniforms: { uHhLit: houseLit, uHhLitK: { value: k } }, fragmentPars: 'uniform vec3 uHhLit; uniform float uHhLitK;',
    light: 'c += albedo * uHhLit * (uHhLitK * (0.2 + 0.8 * clamp(dot(N, vec3(-0.381, 0.381, 0.842)) * 0.6 + 0.4, 0.0, 1.0)));' });
  await stand('pelmet', /^pelmet$/, () => kit.model('models/theatre/pelmet.glb', { at: [plan.proscenium.s[0], 0, 0], face: 'back',
    ...H.dress('petrol', { extend: HANG }),
    materials: { gilt: H.dress('gilt', { extend: [HANG, LIT(2.0)], take: [0, 1, 0.65, 1], keep: [0.25, 1, 0.6, 1.0] }),      // (gold thread: less of the moon's grey and of the wet gleam than carved gilding, or it is cream beside the curtain's hem)
      velvet: H.dress('velvet', { extend: [HANG, LIT(1.0)], side: THREE.DoubleSide, take: [0, 0.8, 0.7, 1], keep: [0.6, 1, 0.12, 0.12] }) } }));

  // ---- the arch wall and the royal box: placed by the middle of its house face at the water. In the model x = d, y = s - 31.2, z = height.
  // royal_wall.glb is the right half of the arcade; royal_box.glb the royal box and the middle arch's keystones.
  const RW = { at: [plan.archWall.face, 0, 0], face: 'back' };
  // (third holder) THE ROYAL BOX was a dark hole in the lit rear wall: the house's pools on that wall stand at the bays' piers, 3.3 m from
  // the middle of a box 6.6 m wide, and no light entered it. It now has two brackets on its back wall beside the pier-glass (plan.js
  // flames(), 'royal'; royal_box.glb carries them) and is lit FROM ITS OWN FLAMES: those two and the five-candle branch on its front
  // (the brackets on its jambs stand where the house's own pools are and are left to them). Its canopy, which no candle is near,
  // takes the kindled house as one broad light, as the pelmet does (LIT): it looks down the whole lit horseshoe.
  // The arcade's gilding takes half the wet gleam: in the reveals the bow lantern is the light, and on carving at arm's length the
  // gleam was white blots beside the lantern's orange.
  const royalFlames = flameGroups((f) => f.where === 'royal' && Math.abs(f.d) < 2.5, (f) => (Math.abs(f.d) > 0.6 ? Math.sign(f.d) : 0) + 10 * Math.round(f.s));
  const royalOwn = ownFlames(royalFlames, 0.9, 1.6, 0.6), royalDress = paints();
  if (royalOwn) {
    Object.assign(royalDress, H.dress('petrol', { extend: [HANG, royalOwn] }));
    // (fifth holder: the canopy's wreath, crest and tassels were the grey of the wet gleam in the lit rear wall: the house's broad light counts for more
    // on the box's gilding (3.4; it was 1.6) and the gleam for a little less. &royalgilt=<k> tries another.)
    royalDress.materials = { ...royalDress.materials, gilt: H.dress('gilt', { extend: [HANG, royalOwn, LIT(dev.has('royalgilt') ? +dev.get('royalgilt') : 3.4)], keep: [0.12, 1, 0.7, 1.0] }),
      velvet: H.dress('velvet', { extend: [HANG, royalOwn, LIT(1.2)], side: THREE.DoubleSide, take: [0.7, 0.8, 0.7, 1], keep: [0.6, 1, 0.15, 0.12] }) };
  }
  const arcadeDress = paints();
  arcadeDress.materials = { ...arcadeDress.materials, gilt: H.dress('gilt', { extend: HANG, keep: [0.12, 1, 0.5, 1.0] }) };
  await stand('royal_wall', 'royal_wall', async () => {
    M.royal_box = await kit.model('models/theatre/royal_box.glb', { ...RW, ...royalDress });
    return both('royal_wall', 'models/theatre/royal_wall.glb', RW, arcadeDress);
  });

  // ---- the dome: placed by its centre at the water (the model's z is the height). Its inner face wears the ceiling painting on its own UVs;
  // it takes the moon and the room's warm fill as the stand-in did (take), no candle row and no water-light. Raw timber and lath at the tear.
  const high = { wake: false, take: [0, 0, 2.4, 5] };
  let domeMap = null;
  try { domeMap = await ctx.tex('art/theatre/dome.webp'); } catch (err) { console.warn('theatre/heroes_house: the dome painting did not load'); }
  // The painting is a dark picture 30 m overhead. So that its clouds read before a candle burns, it takes a little of the moonlit
  // sky that stands in the tear beside it: pearl, in step with the moon's own strength (the house's uShaft.w: cloud crossing the
  // moon dims it, the fly tower has none). shared.houseDome.moon is that share: the lighting may turn it down to 0.
  const domeMoon = shared.houseDome = { moon: { value: 0.11 } };
  const SKYLIT = { uniforms: { uDomeMoon: domeMoon.moon }, fragmentPars: 'uniform float uDomeMoon;', light: 'c += albedo * vec3(0.56, 0.76, 0.74) * (uDomeMoon * uShaft.w);' };
  // (the bare lath and the plaster's tongues at the tear lie in the open under that sky: they take more of it, or they are one dark with the wet painting)
  const OPEN = { uniforms: { uDomeMoon: domeMoon.moon }, fragmentPars: 'uniform float uDomeMoon;', light: 'c += albedo * vec3(0.62, 0.78, 0.74) * (3.5 * uDomeMoon * uShaft.w);' };      // (3.5: it was 5 for the second holder's pale sticks; the break's timber now stands dark against the sky and only its chalk and the slabs' backs are pale)
  const DOMEK = dev.has('domek') ? +dev.get('domek') : 1.2;      // (sixth holder: how light the dome's painting is laid on. At 1.5, from the stage, the saucer was a brighter, bluer disc than the cove's sky round it; at 1.2 they are one ceiling, lightest at the middle. &domek=<k> tries another)
  await stand('dome', 'dome (with the tear)', () => kit.model('models/theatre/dome.glb', { at: [plan.dome.s, plan.dome.d, 0], face: 'back',
    ...H.dress('timber', { ...high, extend: [HANG, OPEN] }),                       // (HANG: the slabs of plaster that hang from the break sway from where they hang)
    materials: { picture: { ...H.dress('sky', { wake: false, take: [0, 0, 2.4, 7], color: new THREE.Color(DOMEK, DOMEK, DOMEK), extend: SKYLIT }), map: domeMap, brush: 0.85 },      // (1.5: at 1.7, under the high room's blue pearl, the saucer was a turquoise disc inside the cove's quieter sky)
      // (the ribs, ring and rosettes are dressed as the cove's ribs are, which run on from them: cove.js, giltMat)
      gilt: H.dress('giltHigh', { wake: false, take: [0, 1, 1.6, 3.5], keep: [0.3, 1, 0.6, 0.8] }) } }));
  const hanging = M.dome ? ['rib_hang_a', 'rib_hang_b'].map((n) => M.dome.parts[n]).filter(Boolean) : [];

  // ---- the foyer's twin stairs: the file is the right-hand stair in the house's axes from s 9 (foyer_stairs.py); the left is its
  // mirror image. Stone, not painted ground.
  await stand('foyer_stairs', 'foyer_stairs x 2', async () => {
    const m = await kit.model('models/theatre/foyer_stairs.glb', { at: [9, 0, 0], face: 'back', ...H.dress('plaster'), materials: { gilt: H.dress('brass') } });
    M.foyer_stairs_left = mirrored(m); return m;
  });

  // ---- which passes draw what. The engine draws the scene three times a frame: the scene without the water, the mirror, the picture.
  // THE FIRST PICTURE is read by the water, for what lies beneath it, and by the painter's filter, for rays that go DOWN from the
  // eye (kit_tiers.js found this and proved it on the horseshoe; tree.js does the same for the crown). So of these models only
  // what reaches below PRE_Y is drawn in it: each mesh's triangles are put in order, those first, and that pass draws only them.
  // THE MIRROR shows the dome only to someone looking steeply down beside the boat, where the water is depth and seats: there it
  // is drawn as its painted face alone, without ribs, rosettes, lath and rafters.
  // (&housepre=1 draws everything in every pass: the picture is the same to the pixel. 2-heroes-house.md, "Measurements".)
  const PRE_Y = 2.4, everywhere = dev.has('housepre');
  const drawnIn = (model, { low = false, mirror = null } = {}) => { if (model && !everywhere) model.group.traverse((o) => {
    if (!o.isMesh) return;
    const g = o.geometry, range = g.drawRange; let n = 0;
    if (low && g.index) {                                                          // (only for the models whose geometry is this module's own: the mirrored ones)
      o.updateWorldMatrix(true, false);
      const pos = g.attributes.position, ix = g.index.array, e = o.matrixWorld.elements, y = new Float32Array(pos.count), lo = [], hi = [];
      for (let i = 0; i < pos.count; i++) y[i] = e[1] * pos.getX(i) + e[5] * pos.getY(i) + e[9] * pos.getZ(i) + e[13];
      for (let i = 0; i < ix.length; i += 3) (Math.min(y[ix[i]], y[ix[i + 1]], y[ix[i + 2]]) < PRE_Y ? lo : hi).push(ix[i], ix[i + 1], ix[i + 2]);
      ix.set(lo, 0); ix.set(hi, lo.length); g.index.needsUpdate = true; n = lo.length;
    }
    const inMirror = !mirror || mirror(o);
    o.onBeforeRender = (renderer) => {
      if (ctx.engine.reflecting) { if (!inMirror) range.count = -1; }              // (a count below zero: three.js leaves the draw out altogether)
      else if (renderer.getRenderTarget() === ctx.engine.pre) range.count = n || -1;
    };
    o.onAfterRender = () => { range.count = Infinity; };
  }); };
  for (const name of ['proscenium', 'stage_box', 'royal_wall', 'foyer_stairs']) drawnIn(M[name], { low: true });
  for (const name of ['proscenium_crown', 'pelmet', 'royal_box']) drawnIn(M[name]);          // (wholly above PRE_Y)
  drawnIn(M.dome, { mirror: (o) => o.userData.slot === 'picture' });

  void at;
  // Stand-ins made by modules that are built after this one are taken out on the first frame.
  const later = [];
  if (M.stage_box) later.push('tier fronts at the stage boxes');                  // kit_tiers.js: the fronts it sweeps there until stage_box.glb stands
  return {
    update() {
      while (later.length) removeStandIn(ctx, later.pop());
      // the kindled house's broad light on what hangs in the head of the arch: the curtain's own numbers, so that pelmet and curtain are one cloth
      { const Cu = (plan.castCloth && plan.castCloth.curtain) || {}, k = shared.show ? shared.show.k : 0;
        houseLit.value.set(Cu.lit || '#FFDDB0').multiplyScalar((Cu.litGain === undefined ? 0.24 : Cu.litGain) * (dev.second ? k : 0)); }
      // the two broken ribs hang by their straps and swing a little, each in its own time (more in a gust: shared.houseHang)
      const t = ctx.time, k = ctx.reducedMotion ? 0.4 : 1;
      hanging.forEach((part, i) => {
        part.rotation.x = 0.045 * k * hang.value * Math.sin(t * (0.52 + 0.11 * i) + i * 2.1);
        part.rotation.z = 0.035 * k * hang.value * Math.sin(t * (0.37 + 0.07 * i) + 1.3 + i);
      });
    },
  };
}
