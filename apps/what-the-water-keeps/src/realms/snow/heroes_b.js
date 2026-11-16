// The orchard in snow: the other hero pieces (everything one of a kind that is not the monument).
// The log of the Outlier group, with every piece's pictures: docs/build/snow/2-heroes-outlier.md.
//
//   THE OUTLIER             an old apple tree tipped toward the road at (85, +12.5), its long bough across it at s 84:
//                           wood SHARED; the bough twice (WINTER: it springs; MEMORY: at rest, in blossom); snow, apples
//                           WINTER; its blossom MEMORY (a stand-in still: the lobes are the flood orchard's)
//   THE GATE OF STUMPS      two stumps, a cord of sawn logs, a sawhorse: WINTER (in the water the two trees stand whole)
//   LEFT FOR THE NIGHT      the flood orchard's ladders, baskets, crate, handcart, hive stand and plank walk, loaded as
//                           they are (SHARED), and this area's snow on them (WINTER)
//   the cliff, the bridge   STAND-INS of stage 1, left as they were: the River group's pieces (heroes_river.js takes
//                           these two blocks' stand-ins out from its own module)
// Models: source-art/models/snow/apple.py, outlier.py, gate.py, left_snow.py -> assets/models/snow/.
// Published for the cast and the staging: shared.outlier (listed where it is made), shared.left.
// Developer switches: &ink=%23rrggbb (the tint over the wood's paint, as kit_trees.js); &olspring=0.45 (the outlier's
// bough held sprung, metres at its tip); &olslide=0..1 (its snow held part-way through its going); &olgo=<seconds>
// (the whole moment played from that second of the realm's clock: the snow goes, the bough springs and settles).
import * as THREE from 'three';
import { stick, ridge, lobeGeometry, tinted, merge, nameAt, Pile, V } from './standins.js';

const Q = new URLSearchParams(location.search);

export async function build(ctx, plan, shared) {
  const { kit } = ctx, F = shared.frame, M = shared.mat, C = plan.chip, land = shared.land;
  const rnd = ctx.rng(4046);
  const winter = (m) => (m ? ctx.only(m, 'direct') : m), mem = (m) => (m ? ctx.only(m, 'mirror') : m);
  const L = shared.light;
  let outlierUpdate = null, springNow = 0, appleLift = -1;
  const later = [];            // things that can only be settled once a later module's wood is in the scene: each returns true when it is done
  let laterTries = 0;

  // ---- WHAT THIS MODULE'S MODELS WEAR
  // WOOD: the flood orchard's own wood material (woodOptions: its bark picture over the model's paint, thin wood kept
  // out of the painter's filter by how thick it is on the screen, its stir), exactly as the Trees group wears it on
  // the avenue (kit_trees.js: INK over the paint, this area's dusk and wet), so that the outlier and the avenue are one
  // wood. `bare`: no lime wash (nobody tends this tree but to prop it). If that file cannot be read (someone is in the
  // middle of an edit) the wood wears plain paint for this picture and says so.
  const INK = Q.get('ink') || '#8f8798';
  let WOOD, STILL, stirFx = null, stirU = null;
  let orchardTrees = null;
  try { orchardTrees = await import('../orchard/kit_trees.js'); } catch (err) { console.error(`INVALID_MODULE snow heroes_b: the flood orchard's wood material (src/realms/orchard/kit_trees.js) could not be read: ${err.message}. The outlier wears plain paint.`); }
  if (orchardTrees) {
    const bark = await ctx.tex('art/orchard/bark.webp', { repeat: true });
    const wb = orchardTrees.woodOptions(ctx, null, bark, { bare: true, flood: 0, dusk: null });
    const fx = wb.extend[0]; stirU = fx.uniforms;
    stirU.uBlow.value.z = ctx.reducedMotion ? 0.02 : 0.055; stirU.uBlow.value.w = 0.45;      // winter air, as the avenue's (kit_trees.js)
    stirFx = { uniforms: { uBlow: stirU.uBlow, uBlowMore: stirU.uBlowMore, uFrontB: stirU.uFrontB, uShakeB: stirU.uShakeB, uShiverB: stirU.uShiverB }, vertexPars: fx.vertexPars, vertexWorld: 'wp.xyz += stirOf(wp.xyz);' };
    WOOD = { ...wb, color: INK, extend: [...wb.extend, L.dusk, L.wet] };
    const sb = orchardTrees.woodOptions(ctx, null, bark, { still: true, flood: 0, dusk: null });
    STILL = { ...sb, color: INK, extend: [...sb.extend, L.dusk, L.wet] };
  } else { WOOD = { color: INK, brush: 0.6, extend: [L.dusk, L.wet] }; STILL = WOOD; }
  // SNOW: this area's snow paint as light.js makes it (shared.mat.snowPaint: brush 0.35, four steps, the snow's own
  // tones), with the wood's stir so that a ridge never leaves its bough, and whatever a piece adds.
  // THE LANTERN ON SNOW IS GOLD, NOT ROSE. This module's snow is the snow the boat passes nearest (the outlier's bough goes
  // two metres over the bow lantern), and what the rider sees of it is its shaded side: lavender. Amber light laid on
  // lavender is a rose, and a bough of rose snow over water full of blossom reads as blossom. The page: "a globe of
  // gold snow ... that warms the snow, ice and bark it passes". So where the lantern reaches this snow its light is
  // taken a step from rose toward cream: a little of the shade's blue is given up for green, by how strongly the lantern
  // falls there and never more than a weak lantern's worth (at full strength, two metres off, the amber does it alone;
  // without the limit the loaf over the bow was butter yellow).
  const goldSnow = { light: 'c += min((lamps.r + lamps.g + lamps.b) / 3.0, 0.2) * vec3(0.0, 0.2, -0.4) * min(albedo.g, 1.0);' };
  const SNOW = (extra = []) => ({ color: '#ffffff', brush: 0.35, steps: 4, extend: [L.dusk, L.lift, goldSnow, stirFx, ...extra].filter(Boolean) });
  /** Snow that is thin ON THE SCREEN keeps out of the painter's filter (the models' UV u is minus the ridge's half width in metres). */
  const thinSnow = { final: 'if (vUv0.x < -0.0004 && -vUv0.x * 230.0 < length(vViewPos)) gl_FragColor.a = -15.0;' };

  // ================================================================================================ the cliff and the cave's mouth
  // ---- STAND-IN for `cliff_icefall`: the face at s 26, 70 m wide and 34 m high, basalt columns of uneven height; the
  // mouth 16 m wide and 9 m high; rime on each column's top; three icefalls 6 to 20 m long as clustered organ pipes of
  // frost blue that thicken downward; a fringe of 60 icicles 0.4 to 2.2 m on the lip. Its face lies in the plane
  // z = shared.zFace and looks down the river at the orchard.
  {
    const K = plan.cliff, z0 = shared.zFace, x0 = land.xFace, half = K.wide / 2;
    const unit = tinted(new THREE.CylinderGeometry(0.5, 0.5, 1, 6), '#ffffff'); unit.translate(0, 0.5, 0);
    const tints = ['#17142A', '#1a1730', '#141126', '#1d1a33', '#121022', '#201c36'], cols = [], rime = [];
    // the arch of the mouth: 16 m wide and 9 m high where the cave comes out. The cave leaves the face askew (the river
    // is already turning), so the arch is taken about the cave's own middle at each column's depth in the rock
    const tmp = {}, caveX = (z) => { const sAt = K.s - (z - z0) / 0.94, a = ctx.path.at(Math.max(0, sAt), tmp); return a.x + (z - a.z) * (a.tx / a.tz); };
    const mouthAt = (x, z) => { const m = (x - caveX(z)) / (K.mouth.wide / 2 + 1.6); return Math.abs(m) < 1 ? K.mouth.high * Math.sqrt(1 - m * m * 0.55) + 0.3 : 0; };
    for (let row = 0; row < 3; row++) for (let x = -half; x <= half; x += 1.9) {
      const xx = x0 + x + (row % 2) * 0.95 + (rnd() - 0.5) * 0.3, zz = z0 + 0.9 + row * 1.7, edge = smooth(half, half - 13, Math.abs(x));
      const tall = (K.high - 7 + 7 * kit.fbm(x * 0.09, row * 3.1, 2, 26) + (rnd() < 0.2 ? -rnd() * 4 : 0)) * (0.3 + 0.7 * edge) - row * 0.6 + rnd() * 1.2;
      const w = 2.0 + rnd() * 0.5, from = mouthAt(xx, zz) * (1 + row * 0.03);
      const y0 = from > 0 ? from + rnd() * 0.9 : -1.2;                                                 // over the mouth the columns hang: their broken ends are its lip
      cols.push({ position: [xx, y0, zz + (rnd() - 0.5) * 0.3], rotation: [0, rnd() * 6.283, 0], scale: [w, Math.max(1, tall - y0), w], color: tints[Math.floor(rnd() * tints.length)] });
      rime.push({ position: [xx, tall - 0.02, zz], rotation: [0, rnd() * 6.283, 0], scale: [w * 1.04, 0.22 + rnd() * 0.15, w * 1.04] });
    }
    kit.instances(unit, M.basalt, cols).name = 'standin:cliff_icefall: basalt columns (shared)';
    winter(kit.instances(new THREE.CylinderGeometry(0.5, 0.5, 1, 6), M.snow, rime)).name = 'standin:cliff_icefall: rime on the column tops (winter)';
    // the icefalls and the fringe
    const ice = [];
    for (const [d, long] of K.icefalls) for (let k = 0; k < 7; k++) { const h = long * (0.55 + 0.45 * rnd()), top = K.high - 9 + rnd() * 2.5, x = x0 + d + (k - 3) * 0.55 + (rnd() - 0.5) * 0.3, g = new THREE.CylinderGeometry(0.16 + rnd() * 0.1, 0.34 + rnd() * 0.3, h, 5); g.translate(x, top - h / 2, z0 + 0.25 - rnd() * 0.3); ice.push(tinted(g, k % 3 ? C.frost : '#C2CBE6')); }
    for (let i = 0; i < K.icicles; i++) { const x = caveX(z0 + 0.9) + (rnd() * 2 - 1) * (K.mouth.wide / 2 + 1.2), l = 0.4 + rnd() * rnd() * 1.8, g = new THREE.ConeGeometry(0.05 + l * 0.035, l, 5); g.rotateX(Math.PI); g.translate(x, mouthAt(x, z0 + 0.9) + 0.35 - l / 2, z0 + 0.3 + rnd() * 0.5); ice.push(tinted(g, C.frost)); }
    const m = new THREE.Mesh(merge(ice), M.ice); m.name = 'standin:cliff_icefall: three icefalls, 60 icicles (winter)'; m.frustumCulled = false; winter(ctx.add(m));
    nameAt(ctx, F, 'cliff_icefall: 70 m wide, 34 m high', [K.s, 0, K.high + 1]);
    shared.counts = { ...(shared.counts || {}), cliffColumns: cols.length };
  }

  // ================================================================================================ the plank bridge
  // ---- STAND-IN for `bridge` (SHARED) and `bridge_snow` (WINTER): one span of 22 m square across the river at s 46, on
  // two trestles of four round piles at the banks' feet; deck 1.4 m wide at 3.9 m (3.5 m clear), three beams with a
  // 10 cm sag, rails 1 m with pegged posts, an empty iron lamp hook on the middle post; 0.2 m of snow on the rails and
  // 0.15 m on the deck, no footprints; 30 icicles 0.1 to 0.4 m under it.
  {
    const B = plan.bridge, p = new Pile(F), w = new Pile(F), wood = '#5d5058', pale = '#75676c', half = B.span / 2;
    for (const side of [-1, 1]) {
      const d = side * (plan.band(B.s) + 0.55);
      for (const [ds, dd] of [[-0.55, 0], [0.55, 0], [-0.4, 0.9], [0.4, 0.9]]) p.limb({ line: [[B.s + ds * 1.3, d + side * dd, -1.2], [B.s + ds, d + side * dd * 0.6, B.clear]], thick: [0.26, 0.22], smooth: false, radial: 7 }, wood);
      p.limb({ line: [[B.s - 0.75, d, 0.8], [B.s + 0.6, d + side * 0.5, B.clear - 0.5]], thick: 0.1, smooth: false, radial: 5 }, wood);            // cross braces
      p.limb({ line: [[B.s + 0.75, d, 0.8], [B.s - 0.6, d + side * 0.5, B.clear - 0.5]], thick: 0.1, smooth: false, radial: 5 }, wood);
      p.box([B.s, d + side * 0.3, B.clear - 0.14], [1.9, 0.2, 1.6], wood);                                                                    // the trestle's cap
      // the ramp of the bank path up to the deck's end
      p.box([B.s, side * (half + 1.6), B.clear - 0.5], [3.6, 0.14, B.wide], pale, 0, [0, side * 0.12]);
    }
    for (const k of [-0.5, 0, 0.5]) p.limb({ line: [[B.s + k, -half, B.clear + 0.1], [B.s + k, 0, B.clear], [B.s + k, half, B.clear + 0.1]], thick: 0.22, radial: 6 }, wood);      // three beams, sagging
    for (let d = -half; d < half - 0.01; d += 0.5) { const sag = 0.1 * (1 - Math.pow(d / half, 2)); p.box([B.s, d + 0.25, B.deck - 0.07 - sag], [0.48, 0.07, B.wide], Math.abs(d - 3) < 0.3 ? '#9a8c8c' : (Math.round(d * 2) % 3 ? wood : pale)); }      // planks of uneven tone, one newer and paler
    for (const k of [-1, 1]) {
      for (let d = -half; d <= half + 0.01; d += 2.2) p.box([B.s + k * (B.wide / 2 - 0.05), d, B.deck - 0.1], [0.09, B.rail + 0.1, 0.09], wood);
      p.limb({ line: [[B.s + k * (B.wide / 2 - 0.05), -half, B.deck + B.rail + 0.06], [B.s + k * (B.wide / 2 - 0.05), 0, B.deck + B.rail - 0.04], [B.s + k * (B.wide / 2 - 0.05), half, B.deck + B.rail + 0.06]], thick: 0.1, radial: 6 }, pale);
      w.limb({ line: [[B.s + k * (B.wide / 2 - 0.05), -half, B.deck + B.rail + 0.19], [B.s + k * (B.wide / 2 - 0.05), 0, B.deck + B.rail + 0.09], [B.s + k * (B.wide / 2 - 0.05), half, B.deck + B.rail + 0.19]], thick: [0.2, 0.2], radial: 6 }, C.paper);      // 0.2 m of snow on the rails
    }
    p.limb({ line: [[B.s - B.wide / 2 + 0.05, 0, B.deck + B.rail], [B.s - B.wide / 2 - 0.25, 0, B.deck + B.rail + 0.12], [B.s - B.wide / 2 - 0.3, 0, B.deck + B.rail - 0.1]], thick: 0.03, radial: 4 }, '#17151c');      // the empty iron lamp hook
    w.box([B.s, 0, B.deck - 0.04], [B.span, 0.15, B.wide - 0.16], C.paper);                                                                     // 0.15 m on the deck, untrodden
    for (let i = 0; i < B.icicles; i++) { const d = (rnd() * 2 - 1) * (half - 1), l = 0.1 + rnd() * 0.3; w.cone([B.s + (rnd() - 0.5) * 1.2, d, B.clear - 0.02], [0.03 + l * 0.08, l, 0.03 + l * 0.08], C.frost, 0, 5, [Math.PI, 0]); }
    for (const side of [-1, 1]) w.cyl([B.s, side * (plan.band(B.s) + 0.55), 0.0], [1.5, 0.1, 1.7], C.frost, 0, null, 10);                       // collars of ice at the waterline
    p.build(ctx, 'bridge (shared)', M.timber);
    winter(w.build(ctx, 'bridge_snow, its icicles and ice collars (winter)', M.ice));
  }

  // ================================================================================================ the outlier
  // `outlier` (source-art/models/snow/outlier.py; docs/build/snow/2-heroes-outlier.md): an old apple tree outside the
  // grid that went over long ago toward the road and has grown on. Its trunk lies out over the water at 60 degrees
  // from upright, propped on one crutch at d +8; upright stems have grown from its upper side into a low crown; one
  // long bough reaches on, level, 3 m over the road at s 84, to d -2.
  //   outlier.glb             root plate, trunk, crown: SHARED (the water shows the same wood at dusk)
  //   outlier_bough.glb       the low bough, loaded TWICE: WINTER (it carries the snow and springs when the snow slides)
  //                           and MEMORY (at rest, in blossom: it never moves)
  //   outlier_snow.glb, outlier_bough_snow.glb, the apples and their caps: WINTER
  //   the crutch              the flood orchard's own (crutch_D.glb, as it is): SHARED
  //   the blossom             STAND-IN still (the lobes are the flood orchard's): MEMORY
  // Everything is placed by outlier.json, which the script writes: no coordinate is typed in here.
  // shared.outlier (for the cast and the staging) is listed where it is made, at the end of this block.
  {
    const O = plan.outlier, at = F.at(O.foot[0], O.foot[1], 0);
    const info = await (await fetch('assets/models/snow/outlier.json')).json();
    /** A place of the model (outlier.json: its own space as the ride sees it) in the realm. The model's frame is the page's: no turn. */
    const R3 = (p, target = new THREE.Vector3()) => target.set(at.x + p[0], at.y + p[1], at.z + p[2]);
    const base = R3(info.bough.base), tip = R3(info.bough.tip);

    // ---- THE BOUGH SPRINGS. One number, in metres at the tip (uOutlierBough.z): the winter bough, its snow, its apples
    // and whatever perches on it rise by that much times the square of how far out along the bough they are (a bough
    // bends from its root). 0 = as modelled: level, under its snow, where the bough in the water is and stays.
    // The staging sets shared.outlier.spring.value (0.45 when the snow has gone; three swings at 0.6 Hz on the way).
    const uBough = { value: new THREE.Vector4(base.x, base.x - tip.x, 0, 0) };      // x of its root, its length toward -x, the spring (m), the snow's slide (0..1)
    const springGlsl = 'float obT = clamp((uOutlierBough.x - wp.x) / uOutlierBough.y, 0.0, 1.0); wp.y += uOutlierBough.z * obT * obT;';
    const springFx = { uniforms: { uOutlierBough: uBough }, vertexPars: 'uniform vec4 uOutlierBough;', vertexWorld: `{ ${springGlsl} }` };
    /** How far a place on the bough stands above where it was modelled, now (for apples, birds, crumbs). */
    const lift = (x) => { const t = Math.min(1, Math.max(0, (uBough.value.x - x) / uBough.value.y)); return uBough.value.z * t * t; };
    // ---- THE SNOW LETS GO (the staging's moment at s 80; here so that it can be played and looked at). One number,
    // shared.outlier.slide.value, 0 (the snow lies) .. 1 (it has gone): THE SLIDE'S OWN CLOCK, to be run from 0 to 1 in
    // 1.85 s, evenly. The bough's snow is modelled in lumps (outlier.py: the loaf cut along hidden lines, each lump
    // closed, every point of a lump carrying one v: where its middle lies along the bough, 0 at the knuckle .. 1 at
    // the tip; the lines on the small wood and the icicles likewise). The letting-go runs out along the bough from the
    // knuckle to the tip in three quarters of a second; each lump cracks and leans for a sixth of a second, rolls off
    // the bough's side (most to the far side from the arriving boat), goes on toward the tip as it falls, turns over,
    // and has broken up by the time it reaches the water: it draws in upon its own middle and is gone. The powder,
    // the whump and the rings on the water are the cast's and the staging's.
    const line = info.bough.line.map((q) => R3(q));
    const lineAt = (v) => {
      const x = base.x - v * (base.x - tip.x); let i = 0;
      while (i < line.length - 2 && line[i + 1].x > x) i++;
      const a = line[i], b = line[i + 1];
      return new THREE.Vector3().lerpVectors(a, b, Math.min(1, Math.max(0, (a.x - x) / Math.max(1e-6, a.x - b.x))));
    };
    const uLine = { value: Array.from({ length: 9 }, (_, j) => lineAt(j / 8)) };      // the bough's middle line at nine places, for the lumps to turn about
    const slideFx = { uniforms: { uOutlierLine: uLine },
      vertexPars: `uniform vec3 uOutlierLine[9];
        vec3 obLineAt(float v) { float f = clamp(v, 0.0, 1.0) * 8.0, fi = min(floor(f), 7.0); int k = int(fi); return mix(uOutlierLine[k], uOutlierLine[k + 1], f - fi); }`,
      vertexWorld: `{
        float osV = uv.y, osH = fract(sin(osV * 91.7) * 4373.3), osH2 = fract(sin(osV * 57.3 + 1.7) * 2311.7);
        float osTau = uOutlierBough.w * 1.85 - osV * 0.75 - osH * 0.04;
        if (uOutlierBough.w > 0.0 && osTau > 0.0) {
          float osU = clamp(osV, 0.0, 1.0), osLean = smoothstep(0.0, 0.16, osTau), osF = max(osTau - 0.16, 0.0), osSide = osH2 < 0.72 ? -1.0 : 1.0;
          vec3 osC = obLineAt(osV); osC.y += uOutlierBough.z * osU * osU;
          vec3 osP;
          if (-uv.x < 0.045) {
            // the line on a twig, an icicle (the models' u is minus the thing's half width): shaken off, it drops a hand or two and is powder
            osP = wp.xyz + vec3(-0.2 * osF, -0.015 * osLean - 4.9 * osF * osF, osSide * 0.25 * osF);
            if (osF > 0.3) osP.y = -1.0;
          } else {
            float osA = osSide * (0.5 * osLean + (2.2 + 2.0 * osH) * osF), osCs = cos(osA), osSn = sin(osA);
            vec3 osR = wp.xyz - osC;
            osR = vec3(osR.x, osR.y * osCs - osR.z * osSn, osR.y * osSn + osR.z * osCs);
            float osK = smoothstep(0.3, 0.78, osF);
            osP = osC + osR * (1.0 - 0.94 * osK);
            osP.x -= 0.25 * osF + 0.9 * osF * osF;
            osP.z += osSide * (0.08 * osLean + 0.5 * osF);
            osP.y -= 0.02 * osLean + 4.9 * osF * osF;
            if (osK > 0.985) osP.y = -1.0;
          }
          if (osP.y < 0.04) osP = vec3(osC.x, -0.8, osC.z);
          wp.xyz = osP;
        } }` };

    // ---- the wood
    const body = await kit.model('models/snow/outlier.glb', { ...WOOD, position: at });
    const bw = await kit.model('models/snow/outlier_bough.glb', { ...WOOD, extend: [...WOOD.extend, springFx], position: at });
    const bm = await kit.model('models/snow/outlier_bough.glb', { ...WOOD, position: at });
    winter(bw.group); mem(bm.group);
    body.group.name = 'outlier: root plate, trunk, crown (shared)'; bw.group.name = 'outlier: the low bough (WINTER; it springs)'; bm.group.name = 'outlier: the low bough at rest (MEMORY)';
    // ---- its crutch: the flood orchard's stout one, its cradle under the trunk at d +8, turned to the trunk, set a little aslant
    {
      const top = R3(info.crutch.top), on = R3(info.crutch.along), way = Math.atan2(-(on.z - top.z), on.x - top.x);
      const cr = await kit.models('models/orchard/crutch_D.glb', [{ position: top, rotation: [0.03, way, -0.07], tint: '#9d98a8' }], STILL);
      cr.group.name = 'outlier: its crutch (the flood orchard\'s crutch_D; shared)';
      // ---- THE CRUTCH IN WINTER: a collar of ice round each of its two poles where they go through the water (the page's
      // close band: where the orchard's things met the water with a wet band, here they meet it with a collar of ice).
      // The Monument group's heroes.js dresses only the nine crutches under the oldest tree (it did dress this one, once),
      // so this one is dressed here, with that group's own collar (crutch_ice.glb) and its table of where each design's
      // poles run (crutch_snow.json), both used as they are. (Its ridge of snow, crutch_D_snow.glb, lies on the bar lashed
      // across the legs, which under this low trunk is under the water: not hung. The sacking under the trunk carries none:
      // the trunk lies on it.)
      try {
        const table = await fetch('assets/models/snow/crutch_snow.json').then((r) => (r.ok ? r.json() : null));
        const legs = table && table.designs && table.designs.crutch_D && table.designs.crutch_D.legs, mesh = cr.meshes && cr.meshes[0];
        if (legs && mesh) {
          const m = new THREE.Matrix4(), toRealm = new THREE.Matrix4();
          ctx.group.updateWorldMatrix(true, false); mesh.updateWorldMatrix(true, false);
          mesh.getMatrixAt(0, m); m.premultiply(mesh.matrixWorld).premultiply(toRealm.copy(ctx.group.matrixWorld).invert());
          const places = [];
          legs.forEach((leg, li) => {
            let above = null, ra = 0;
            for (const ring of leg) {                                 // [depth under the cradle, x, z, radius] down the pole, in the crutch's own frame
              const q = new THREE.Vector3(ring[1], -ring[0], ring[2]).applyMatrix4(m);
              if (above && above.y > 0 && q.y <= 0) {
                const u = above.y / (above.y - q.y), r = Math.min(0.16, Math.max(0.07, ra + (ring[3] - ra) * u)), k = (0.5 + 0.5 * r / 0.1) * (0.94 + 0.2 * li);
                places.push({ position: [above.x + (q.x - above.x) * u, 0.004, above.z + (q.z - above.z) * u], rotation: [0, 1.3 + li * 2.4, 0], scale: [k, 1, k * (0.88 + 0.22 * li)] });
                break;
              }
              above = q; ra = ring[3];
            }
          });
          if (places.length) {
            const ice = await kit.models('models/snow/crutch_ice.glb', places, { brush: 0.4 });
            if (M.ice && ice.meshes && ice.meshes[0]) ice.meshes[0].material = M.ice;
            winter(ice.group); ice.group.name = 'outlier: collars of ice round its crutch\'s two poles (the Monument group\'s crutch_ice; winter)';
          }
        }
      } catch (err) { console.warn(`snow heroes_b: the outlier's crutch stands without its collars of ice (${err.message})`); }
    }
    // ---- the snow on it (winter): thin snow keeps out of the painter's filter as thin wood does (its UV u is minus its half width)
    const sn = await kit.model('models/snow/outlier_snow.glb', { ...SNOW([thinSnow]), position: at });
    const slab = await kit.model('models/snow/outlier_bough_snow.glb', { ...SNOW([thinSnow, springFx, slideFx]), position: at });
    winter(sn.group); winter(slab.group);
    sn.group.name = 'outlier: snow on the root plate, the trunk and the crown (winter)'; slab.group.name = 'outlier: the bough\'s snow (winter; it slides at s 80)';
    // ---- the apples (winter): three on short spurs under the bough at d -1, +0.3 and +1.4, six in the crown; one in three pecked
    const spots = [...info.apples.bough.map((p) => ({ at: R3(p), bough: true })), ...info.apples.crown.map((p) => ({ at: R3(p), bough: false }))];
    // (the near apple, apple_near*.glb: these nine pass two metres over the rider's head. Each hangs from the top of its stalk,
    // which is the model's origin: turned about the vertical and leaned a few degrees its own way, it hangs as an apple hangs)
    spots.forEach((a, i) => { a.turn = 0.7 + i * 2.4; a.lean = [(rnd() - 0.5) * 0.36, (rnd() - 0.5) * 0.36]; a.scale = 0.94 + 0.14 * rnd(); a.pecked = i % 3 === 1; a.rest = a.at.clone(); });
    // a thing nine pixels across is wiped out by the painter's filter: beyond five metres an apple is kept out of it; nearer, it is painted like everything else
    const farCrisp = { final: 'if (length(vViewPos) > 5.0) gl_FragColor.a = -15.0;' };
    // (the page: "apples do not glow", and the red is to stay its chip: three quarters of what the bow lantern lays on an apple is taken off again)
    const matte = { light: 'c -= albedo * lamps * 0.75;' };
    const appleOpts = { brush: 0.5, shade: 0.9, extend: [L.dusk, matte, farCrisp] };
    const placeOf = (a) => ({ position: a.at, rotation: [a.lean[0], a.turn, a.lean[1]], scale: a.scale });
    const sets = {};
    for (const [key, file, list] of [['whole', 'apple_near.glb', spots.filter((a) => !a.pecked)], ['pecked', 'apple_near_pecked.glb', spots.filter((a) => a.pecked)], ['caps', 'apple_near_cap.glb', spots]]) {
      sets[key] = await kit.models('models/snow/' + file, list.map(placeOf), key === 'caps' ? SNOW([farCrisp]) : appleOpts);
      sets[key].list = list; winter(sets[key].group); sets[key].group.name = `outlier: apples (${key}; winter)`;
    }
    /** Put an apple (0..8: the bough's three first) somewhere else: the staging drops one. Its cap stays unless `cap` is given. */
    const moveApple = (i, pos, cap = false) => {
      const a = spots[i]; a.at.copy(pos);
      const set = a.pecked ? sets.pecked : sets.whole; set.place(set.list.indexOf(a), placeOf(a));
      if (cap) sets.caps.place(i, placeOf(a));
    };
    // ---- MEMORY: the same bough heavy with blossom, and the crown in blossom. STAND-IN: the lobes are the flood
    // orchard's (lobe_01..12 and its sprays, hung by its own blossom module); until that is wired in, clouds of this
    // area's stand-in blossom lie where the script says the masses belong (outlier.json: masses), on the real wood.
    {
      const lobes = [];
      const cloud = (m, k, grow, seed) => { const g = lobeGeometry(10, 6, seed); g.rotateY(seed * 2.4); const w = 2 * Math.max(m.rx, m.rz) * grow, tall = Math.min(1.5, Math.max(0.75, 2 * m.ry * grow / (0.55 * w))); g.scale(2 * m.rx * grow, w * tall, 2 * m.rz * grow); g.translate(at.x + m.x, at.y + m.y - 0.3 * w * tall, at.z + m.z); lobes.push(g); };
      info.masses.bough.forEach((m, k) => cloud(m, k, 1.25, k + 3));          // (generous: this is the blossom the rider sees beside the hull as the boat passes under)
      info.masses.crown.forEach((m, k) => cloud(m, k, 1.2, k + 31));
      const bl = new THREE.Mesh(merge(lobes), M.blossom); bl.name = 'standin:outlier: blossom on the bough and the crown (MEMORY)'; bl.frustumCulled = false; mem(ctx.add(bl));
    }
    // ---- where a hull cannot pass: the trunk's first three metres lie lower than a rider's head
    for (const [x, z, r] of info.colliders) { const c = { x: at.x + x, z: at.z + z, r, flow: false }; ctx.addCollider(c); if (ctx.state.colliders) ctx.state.colliders.push(c); }
    nameAt(ctx, F, 'outlier: an old apple tree, tipped; its bough across the road', [O.foot[0], 7, 6.2]);
    // ---- for the cast and the staging
    shared.outlier = {
      bough: { winter: bw.group, memory: bm.group, snow: slab.group },       // (as the layout published them)
      apples: spots.slice(0, 3).map((a) => a.at),                            // the three under the bough (Vector3; they ride its spring)
      tip, base, crown: info.ends.crown.map((p) => R3(p)),                    // the bough's two ends; the crown's twig ends
      ends: info.ends.bough.map((p) => R3(p)),                               // the bough's own twig ends
      perches: info.perches.map((p) => R3(p)),                               // five places on the snow on its back (the waxwings'); add lift(x)
      crownApples: spots.slice(3).map((a) => a.at), line: info.bough.line.map((p) => ({ at: R3(p), r: p[3] })),
      masses: info.masses, at, info,
      spring: { get value() { return springNow; }, set value(v) { springNow = v; } },      // metres at the tip (0 under snow .. 0.45 sprung)
      slide: { get value() { return uBough.value.w; }, set value(v) { uBough.value.w = v; } },      // 0 the snow lies .. 1 it has gone
      lift, moveApple, apple: spots, uniform: uBough,
    };
    // ---- A FIRST PLAYING OF THE MOMENT, on the realm's clock (shared.outlier.letGo(); the staging may drive slide and
    // spring itself instead): the snow goes in 1.85 s; half a second in, the bough, relieved, rises to 0.45 m at its tip
    // and settles there in three slow swings (0.6 Hz). The bough in the water never moves. settle(): the after-state
    // at once (for a cue's settle, when the area is entered beyond the bough).
    const go = { t0: -1 };
    shared.outlier.letGo = (at = ctx.time) => { go.t0 = at; };
    shared.outlier.settle = () => { go.t0 = -1; uBough.value.w = 1; springNow = 0.45; };
    shared.outlier.reset = () => { go.t0 = -1; uBough.value.w = 0; springNow = 0; };
    if (Q.has('olspring')) springNow = +Q.get('olspring');            // (developer) &olspring=0.45: the bough held sprung
    if (Q.has('olslide')) uBough.value.w = +Q.get('olslide');          // (developer) &olslide=0.5: its snow held half-way through its going
    if (Q.has('olgo')) go.t0 = +Q.get('olgo');                         // (developer) &olgo=3: the moment played from the realm's third second (take a strip with &t=3)
    outlierUpdate = (t) => {
      if (go.t0 >= 0) {
        const ts = t - go.t0, tq = Math.max(0, ts - 0.5);
        uBough.value.w = Math.min(1, Math.max(0, ts / 1.85));
        springNow = 0.45 * (1 - Math.exp(-(ctx.reducedMotion ? 2.2 : 0.75) * tq) * (ctx.reducedMotion ? 1 : Math.cos(3.77 * tq)));
      }
      // the bough is never quite still: a breath of 6 mm at its tip, slowly (the apples and the caps ride it)
      uBough.value.z = springNow + (ctx.reducedMotion ? 0 : 0.006 * Math.sin(t * 0.37) + 0.003 * Math.sin(t * 0.83 + 1.3));
      const z = uBough.value.z;
      if (Math.abs(z - appleLift) > 0.0015) {
        appleLift = z;
        for (let i = 0; i < 3; i++) { const a = spots[i]; if (a.fallen) continue; a.at.y = a.rest.y + lift(a.rest.x); const set = a.pecked ? sets.pecked : sets.whole; set.place(set.list.indexOf(a), placeOf(a)); sets.caps.place(i, placeOf(a)); }
      }
    };
  }

  // ================================================================================================ the gate of stumps
  // `stumps`, `log_cord`, `sawhorse` (source-art/models/snow/gate.py), all WINTER: in the water the two trees stand
  // whole (kit_trees.js draws them in the mirror alone), so nothing here may be shared.
  //   stump_a, stump_b   where the plan's two lost trees stand ((108.5, -10) and (108.5, +10), each a hand off its grid
  //                      point as every tree is): the foot of an apple bole, 0.45 m across and 0.5 m tall, cut flat with
  //                      a hinge step toward the road; the left one's snow has slid half off and shows the rings. They
  //                      wear the avenue's own wood (the flood orchard's lime wash on the bole, as on every other trunk)
  //   log_cord           2.4 x 1.0 x 0.9 m of sawn apple wood on two bearers between four stakes, at (106, -14), its sawn
  //                      ends to the road, snow on top
  //   sawhorse           a pegged sawbuck with a half-sawn log left in it, beside the cord
  // SAWN AND SPLIT WOOD is marked in the models' UVs (u < -5) and drawn here: it keeps its own paint (bark is inked,
  // a sawn face is not), and an end (v = 8 j + ..., j >= 1) is drawn with its rings about the pith, a paler rim of
  // sapwood, the dark late wood of every ring, two or three checks, the saw's marks.
  // (j of 8 and over is a stump's cut: its rings are drawn fewer and bolder, to be read from a boat.)
  {
    const S = plan.stumps;
    const endGrain = { albedo: `if (vUv0.x < -5.0) {
        float egJ = floor(vUv0.y / 8.0 + 0.5);
        vec3 egC = vColor.rgb;
        if (egJ > 0.5) {
          vec2 eg = vec2(vUv0.x + 10.0, vUv0.y - 8.0 * egJ); float er = length(eg), ea = atan(eg.y, eg.x), eh = fract(egJ * 0.618 + 0.13);
          float ew = er * (1.0 + 0.07 * sin(ea * 3.0 + eh * 20.0) + 0.04 * sin(ea * 7.0 + eh * 9.0));
          // (j of 8 and over: a GREAT cut, a stump's: it is seen from a boat three to ten metres off, where a log end's fine
          // rings are a grey. Fewer and bolder, good years wide and lean years close, the heart a clear step darker)
          float egBig = step(7.5, egJ);
          ew += egBig * (0.035 * sin(ew * 8.0 + eh * 7.0) + 0.014 * sin(ew * 29.0 + eh * 3.0));
          float egRing = 0.5 + 0.5 * sin(ew * mix(50.0 + 44.0 * eh, 40.0 + 8.0 * eh, egBig));
          egC *= mix(vec3(0.74, 0.68, 0.66) * (1.0 - 0.1 * egBig), vec3(1.1, 1.08, 1.0), smoothstep(0.58, 0.82 - 0.1 * egBig, er));
          egC *= 1.0 - mix(0.34, 0.4, egBig) * smoothstep(0.5, 0.95 - 0.2 * egBig, egRing);
          egC *= 1.0 - 0.5 * (1.0 - smoothstep(0.0, 0.09, er));
          float egCk = abs(sin(ea * 1.5 + eh * 30.0));
          egC *= 1.0 - 0.55 * (1.0 - smoothstep(0.0, 0.035, egCk)) * smoothstep(0.05, 0.3, er) * (1.0 - smoothstep(0.55 + 0.3 * eh, 0.75 + 0.3 * eh, er));
          egC *= 0.96 + 0.08 * sin(eg.x * 70.0 + eg.y * 23.0);
        }
        albedo = egC;
      }` };
    const snowSlot = { ...SNOW(), shade: 1 }, iceSlot = { color: '#ffffff', brush: 0.4, shade: 1, steps: 3, extend: [L.dusk] };
    // the stumps wear the avenue's wood with its lime wash (the flood orchard's two pictures); the cord and the sawhorse the bark alone
    let washed = STILL;
    if (orchardTrees) {
      const [bark, lime, foot] = await Promise.all([ctx.tex('art/orchard/bark.webp', { repeat: true }), ctx.tex('art/orchard/lime.webp', { repeat: true }), ctx.tex('art/orchard/limefoot.webp', { repeat: true })]);
      for (const t of [lime, foot]) t.anisotropy = 4;
      // (the wash line stands a foot up, not at a man's shoulder: washed to its top a stump is a white block on white ice and
      // cannot be found. Nobody has washed a felled tree's stump since spring: the wash holds at its foot, ragged, and the bark above is ink)
      const wb = orchardTrees.woodOptions(ctx, null, bark, { lime, foot, flood: 0, still: true, dusk: null, wash: 0.2 });      // (0.34 in the first making: two thirds of the stump was white on white; at 0.2 it is a dark mark with a pale foot and a pale top)
      washed = { ...wb, color: INK, extend: [...wb.extend, L.dusk, L.wet] };
    }
    const withEnds = (o) => ({ ...o, extend: [...o.extend.slice(0, -2), endGrain, ...o.extend.slice(-2)], materials: { snow: snowSlot, ice: iceSlot } });      // (the sawn face before the dusk and the wet)
    const lost = plan.trees.trees.filter((t) => t.lost);
    const places = lost.length === 2 ? lost.map((t) => [t.x, t.z]) : S.at.map(([s, d]) => { const p = F.at(s, d, 0); return [p.x, p.z]; });
    for (const [x, z] of places) {
      const left = x < 0, toRoad = left ? 0.93 : -0.93;            // its notch (the model's front) toward the road and a little back up it, at the arriving boat
      const m = await kit.model(`models/snow/${left ? 'stump_a' : 'stump_b'}.glb`, { ...withEnds(washed), position: [x, 0, z], rotation: [0, toRoad, 0] });
      winter(m.group); m.group.name = `stumps: ${left ? 'stump_a (its snow slid half off)' : 'stump_b'} (winter)`;
    }
    const ground = (s, d) => land.snowHeight(d, -s, Math.abs(d) - plan.shelfLeft(s), d < 0 ? -1 : 1);
    {
      const [ls, ld] = S.logs.at, p = F.at(ls, ld, ground(ls, ld) - 0.04);
      const cord = await kit.model('models/snow/log_cord.glb', { ...withEnds(STILL), position: p, rotation: [0, Math.PI / 2, 0.012] });
      winter(cord.group); cord.group.name = 'log_cord (winter)';
      // NOT WHERE THE LAYOUT'S PLAN HAS IT ((105.2, -12.6): that is 0.4 m inside the skin ice a hull can break): it stands
      // on the shelf, upstream of the cord and in line with it, turned so that its crossed legs show from the road
      const hs = ls - 2.45, hd = ld + 0.1, q = F.at(hs, hd, ground(hs, hd) - 0.03);
      const horse = await kit.model('models/snow/sawhorse.glb', { ...withEnds(STILL), position: q, rotation: [0, Math.PI / 2 + 1.05, 0] });
      winter(horse.group); horse.group.name = 'sawhorse (winter)';
    }
    nameAt(ctx, F, 'stumps, log_cord, sawhorse', [S.at[0][0], S.at[0][1], 1.6]);
  }

  // ================================================================================================ left for the night, months ago
  // The flood orchard's furniture, LOADED AS IT IS from assets/models/orchard/ (never modelled here) and stood where
  // that area stands it, 78 m on (plan.left; src/realms/orchard/heroes_b.js is the placing this follows): the two 4 m
  // ladders in their trees with a basket on the ninth rung of each, the crate, the handcart, the hive stand, the plank
  // walk. SHARED: the water shows them as they were. And this area's snow on them (WINTER), made over those very files
  // by source-art/models/snow/left_snow.py and placed exactly as its piece is: rung_snow, basket_snow, cart_drift,
  // hive_caps, plank_snow, crate_snow.
  // Their paint: timber and wicker are worked in the material from the models' UVs, and the hives' lime wash from a
  // mark in the vertex colour's alpha, as in the flood orchard. (Those two extensions are that area's, word for word:
  // they are not exported from its module, so they are copied here; if that area changes them, change these.)
  {
    const Lf = plan.left, DIR = 'models/orchard/', SDIR = 'models/snow/';
    const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
    const TIMBER_PARS = `float tbH(vec2 p) { vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
      float tbN(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(tbH(i), tbH(i + vec2(1.0, 0.0)), f.x), mix(tbH(i + vec2(0.0, 1.0)), tbH(i + vec2(1.0, 1.0)), f.x), f.y); }`;
    const timber = { fragmentPars: TIMBER_PARS, albedo: `{
        vec2 tg = vUv0;
        if (tg.x > 0.5) {
          float tbJoint = 1.0 - smoothstep(0.004, 0.013, fract(tg.y));
          vec2 tcell = vec2(0.9, 0.25), tci = floor(tg / tcell), tcf = tg / tcell - tci;
          float tHas = step(0.7, tbH(tci + 7.7));
          vec2 tkd = (tcf - vec2(0.3 + 0.4 * tbH(tci + 1.3), 0.36 + 0.28 * tbH(tci + 4.1))) * tcell;
          float tkr = 0.011 + 0.014 * tbH(tci + 9.2), tke = length(vec2(tkd.x * 0.45, tkd.y)) / tkr;
          float tKnot = tHas * (1.0 - smoothstep(0.5, 1.0, tke));
          tg.y -= tkd.y * 0.72 * tHas * (1.0 - smoothstep(0.9, 2.2, tke));
          float ty = tg.y + (tbN(vec2(tg.x * 0.8, tg.y * 4.0)) - 0.5) * 0.03;
          float tFig = 0.5 * tbN(vec2(tg.x * 0.22, ty * 24.0)) + 0.32 * tbN(vec2(tg.x * 0.55 + 5.0, ty * 66.0)) + 0.18 * tbN(vec2(tg.x * 1.7 + 9.0, ty * 190.0));
          albedo *= mix(vec3(0.62, 0.60, 0.64), vec3(1.22, 1.21, 1.22), smoothstep(0.30, 0.70, tFig));
          float tCk = tbN(vec2(tg.x * 0.9 + 31.0, ty * 120.0)) * (0.5 + 0.5 * tbN(vec2(tg.x * 0.3 + 3.0, ty * 9.0)));
          albedo *= 1.0 - 0.6 * smoothstep(0.66, 0.76, tCk);
          albedo = mix(albedo, albedo * vec3(0.40, 0.36, 0.39), tKnot);
          albedo *= 1.0 - 0.62 * tbJoint;
        } else if (tg.x < -0.5) {
          vec2 wv = vec2(-tg.x - 2.0, tg.y) / vec2(0.0444, 0.022);
          float wi = floor(wv.x), wj = floor(wv.y), wOver = mod(wi + wj, 2.0);
          vec2 wf = fract(wv);
          float wz = (wOver * 2.0 - 1.0) * cos(3.14159 * (wf.x - 0.5));
          float wRod = sin(wf.y * 3.14159);
          float wShade = (0.36 + 0.64 * wRod) * (0.74 + 0.30 * wz);
          float wStake = (1.0 - wOver) * (1.0 - smoothstep(0.13, 0.22, abs(wf.x - 0.5)));
          wShade = mix(wShade, 0.82 + 0.3 * (1.0 - abs(wf.x - 0.5) * 6.0), wStake);
          albedo *= wShade * (0.86 + 0.28 * tbH(vec2(wi * 0.37 + 3.0, wj * 1.7)));
        } }` };
    const NOISE = `float hbHash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
      float hbNoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(hbHash(i), hbHash(i + vec2(1.0, 0.0)), f.x), mix(hbHash(i + vec2(0.0, 1.0)), hbHash(i + vec2(1.0, 1.0)), f.x), f.y); }
      float hbFbm(vec2 p) { return 0.5 * hbNoise(p) + 0.3 * hbNoise(p * 2.03 + 11.7) + 0.2 * hbNoise(p * 4.1 + 3.1); }
      vec2 hbFace(vec3 n, vec3 p) { return abs(n.y) > 0.6 ? p.xz : vec2(dot(p.xz, normalize(vec2(n.z, -n.x) + 1e-5)), p.y); }`;
    const chalk = { fragmentPars: NOISE, albedo: `{
        float hbWash = 0.0;
        #ifdef USE_COLOR_ALPHA
          hbWash = step(0.5, vColor.a) * (1.0 - step(0.88, vColor.a));
        #endif
        vec2 hq = hbFace(N, vWPos);
        float hbBrush = hbFbm(vec2(hq.x * 46.0, hq.y * 2.6)), hbPatch = hbFbm(hq * 7.0 + 3.7);
        float hbThin = smoothstep(0.50, 0.63, hbPatch * 0.62 + hbBrush * 0.38);
        albedo = mix(albedo, albedo * vec3(0.52, 0.50, 0.52), hbWash * hbThin * 0.9);
        albedo *= 1.0 + hbWash * (hbBrush - 0.5) * 0.3;
        albedo = mix(albedo, albedo * vec3(0.76, 0.84, 0.78), hbWash * smoothstep(0.52, 0.72, hbFbm(hq * 2.3 + 9.1)) * 0.55); }` };
    // The petals that lodged on these pieces in spring are part of the flood orchard's files (marked 0 in the vertex
    // colour's alpha). In winter they are gone; in the water, which shows that evening, they are still there.
    const petals = { albedo: '#ifdef USE_COLOR_ALPHA\n if (vColor.a < 0.5 && uSnowDusk > 0.99) discard;\n#endif' };
    const PAINT = { color: '#d9d4dc', brush: 0.85, shade: 1, extend: [timber, L.dusk, petals, L.wet] };      // (greyed a step: silvered timber under snow light; uSnowDusk is the dusk's own uniform, so `petals` comes after it)
    const THIN = { ...PAINT, crisp: true };
    const snowOn = (extra = []) => ({ ...SNOW([thinSnow, ...extra]), shade: 1 });
    /** A piece of the snow on what was left, if its file has been made (left_snow.py): placed exactly as its piece. */
    const snowList = await fetch('assets/models/snow/left_snow.json').then((r) => (r.ok ? r.json() : {})).catch(() => ({}));
    const has = (name) => !!(snowList.files && snowList.files[name]);
    const made = shared.left = { ladders: [], hangs: [], snow: {} };

    const trees = plan.trees.trees;
    const treeNear = (s, d) => trees.reduce((bst, t) => (Math.hypot(t.s - s, t.d - d) < Math.hypot(bst.s - s, bst.d - d) ? t : bst));
    /** Where a tree's bole really is between two heights above the water: its middle there, and how far its bark reaches
     *  from that middle in any direction (the flood orchard's `boleAt`, read here from the wood the Trees group stands:
     *  shared.orchard, the heaviest weight of the tree's own design). `found` is false until that wood is in the scene. */
    const boleAt = (t, y0, y1) => {
      const out = { x: t.x, z: t.z, found: false, reach: () => 0.21 };
      const O = shared.orchard, e = O && O.of && O.of(t), files = e && O.models && O.models[e.model] && O.models[e.model].files;
      const stem = files && files.near && String(files.near.file).split('/').pop().replace(/\.glb$/, '');
      const mesh = stem && ctx.group.getObjectByName(stem + ':paint'), pos = mesh && mesh.geometry && mesh.geometry.attributes.position;
      if (!pos || !e.matrix) return out;
      const v = new THREE.Vector3(), pts = []; let sx = 0, sz = 0;
      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i);
        if (v.x * v.x + v.z * v.z > 0.36 || v.y < y0 - 0.5 || v.y > y1 + 0.5) continue;      // (in the tree's own space: the bole, not its boughs)
        v.applyMatrix4(e.matrix);
        if (v.y < y0 || v.y > y1) continue;
        pts.push(v.x, v.z); sx += v.x; sz += v.z;
      }
      const n = pts.length / 2;
      if (n < 8 || Math.hypot(sx / n - t.x, sz / n - t.z) > 0.5) return out;
      out.x = sx / n; out.z = sz / n; out.found = true;
      out.reach = (dx, dz) => { let m = 0; for (let i = 0; i < pts.length; i += 2) m = Math.max(m, (pts[i] - out.x) * dx + (pts[i + 1] - out.z) * dz); return m; };
      return out;
    };
    // where a tree's trunk forks (the flood orchard's own design of that tree: apple_wood.json), for a ladder's head
    let woodJson = null;
    try { woodJson = await (await fetch('assets/models/orchard/apple_wood.json')).json(); } catch (err) { /* the page's 2.6 m of clear stem then */ }
    const crotchOf = (t) => {
      const m = orchardTrees && woodJson && woodJson.models[orchardTrees.modelOf(t)];
      return m && m.crotch ? V3(m.crotch[0], m.crotch[1], m.crotch[2]).applyMatrix4(orchardTrees.matrixOf(t, { heading: () => 0 })) : V3(t.x, 2.6 * (t.scale || 1), t.z);
    };
    const BED = -1.0, MOUND = { across: 2.6, top: -0.25 };          // the flood orchard's bed and planting mounds (src/realms/orchard/plan.js): a ladder's foot stands where it stood
    const moundY = (r) => BED + (MOUND.top - BED) * Math.sqrt(Math.max(0, 1 - Math.pow(r / (MOUND.across / 2 * 1.25), 2)));
    const yawAlong = (dx, dz) => Math.atan2(-dx, -dz);
    /** Lean a ladder (upright in its file: +Y foot to head, rungs along X, +Z the side a picker climbs) from foot to head. */
    const lean = (group, at, head) => {
      const y = head.clone().sub(at).normalize(), up = V3(0, 1, 0), z = up.addScaledVector(y, -up.dot(y)).normalize(), x = V3().crossVectors(y, z);
      group.position.copy(at); group.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z)); group.updateMatrix(); group.updateMatrixWorld(true);
      return { foot: at, head, across: x, face: z };
    };
    const same = (group, as) => { group.position.copy(as.position); group.quaternion.copy(as.quaternion); group.scale.copy(as.scale); group.updateMatrix(); group.updateMatrixWorld(true); };

    // ---- the two 4 m ladders in the trees at (126.5, -10) and (153.5, +10), a basket on the ninth rung of each
    const hangPlaces = [];
    for (const l of Lf.ladders) {
      const t = treeNear(l.tree[0], l.tree[1]), at = F.at(l.foot[0], l.foot[1], 0), fork = crotchOf(t);
      at.y = moundY(Math.hypot(at.x - t.x, at.z - t.z)) - 0.03;
      const r = Math.hypot(at.x - fork.x, at.z - fork.z), ux = (at.x - fork.x) / r, uz = (at.z - fork.z) / r, off = 0.2, run = r - off;
      const head = V3(fork.x + ux * off, at.y + Math.sqrt(l.length * l.length - run * run), fork.z + uz * off);
      const m = await kit.model(DIR + 'ladder_4m.glb', THIN), ld = { ...lean(m.group, at, head), model: m, tree: t };
      m.group.name = `ladder_4m in the tree at (${l.tree}) (the flood orchard's; shared)`;
      made.ladders.push(ld);
      if (has('rung_snow')) { const sm = await kit.model(SDIR + 'rung_snow.glb', snowOn()); same(sm.group, m.group); winter(sm.group); sm.group.name = 'rung_snow (winter)'; }
      // its basket hangs by its hook on the ninth rung, on the ladder's underside, its wall against the rungs below
      const hook = m.point('rung_9'), yaw = Math.atan2(-ld.across.z, ld.across.x), rest = (Math.sin(yaw) * ld.face.x + Math.cos(yaw) * ld.face.z > 0 ? 1 : -1) * 0.14;
      hangPlaces.push({ position: hook, rotation: [rest, yaw, 0] }); made.hangs.push({ at: hook, yaw, rest });
    }
    const baskets = await kit.models(DIR + 'basket.glb', hangPlaces, PAINT);
    baskets.group.name = 'baskets on the ladders (the flood orchard\'s; shared)';
    if (has('basket_snow')) { const bs = await kit.models(SDIR + 'basket_snow.glb', hangPlaces, snowOn()); winter(bs.group); bs.group.name = 'basket_snow (winter)'; }

    // ---- the crate, frozen into the skin ice beside the tree at (135.5, +10) (the page: at (136, +10), which is inside
    // that tree's trunk): it lies as it floated, tipped, 0.7 m off the trunk toward the lane
    {
      const t = treeNear(Lf.crate[0] - 0.5, Lf.crate[1]), p = V3(t.x - 0.66, -0.012, t.z - 0.3);
      const place = { position: p, rotation: (snowList.crate && snowList.crate.rotation) || [0.16, 0.5, 0.06] };      // (how it lies: the snow script's own number, so that the ice round it is level)
      const crate = await kit.model(DIR + 'crate.glb', { ...PAINT, ...place });
      crate.group.name = 'crate, frozen in (the flood orchard\'s; shared)';
      if (has('crate_snow')) { const cs = await kit.model(SDIR + 'crate_snow.glb', { ...snowOn(), materials: { ice: { color: '#ffffff', brush: 0.4, shade: 1, steps: 3, extend: [L.dusk] } }, ...place }); winter(cs.group); cs.group.name = 'crate_snow and its ice (winter)'; }
      const c = (ctx.state.colliders || []).find((q) => Math.hypot(q.x - Lf.crate[1], q.z + Lf.crate[0]) < 0.05);
      if (c) { c.x = p.x; c.z = p.z; }
    }

    // ---- the handcart, tipped back against the tree at (162.5, -10) as the flood orchard stands it (its fourth pass,
    // 7 November 22:50: on the trunk's up-route side, its wheels on the planting mound, its tail toward the arriving boat,
    // the front edge of its bed leaning on the bole, a shaft either side of the trunk). The placing is that area's
    // (src/realms/orchard/heroes_b.js, "the handcart"), step for step, so that the cart in the water is the cart the rider
    // saw in spring: its origin 1.3 m from the trunk's axis, then its point `rest` brought against the bark. The bark is
    // read from the tree's own mesh, which the Trees group loads AFTER this module: the cart is seated on the plan's
    // trunk first and on the true bark at the first frame (`later`). Its snow (cart_drift) is placed exactly as it is.
    // (Not at the page's (164.5, -11.8): that area's change, kept.)
    {
      const H = Lf.handcart, t = treeNear(H.tree[0], H.tree[1]);
      const a = F.at(H.tree[0], H.tree[1], 0), b = F.at(H.tree[0] - 1, H.tree[1] + 0.2, 0), u = b.sub(a).normalize();      // out from the trunk: back up the route, a little toward the lane
      const turn = yawAlong(u.x, u.z), cx = -u.z, cz = u.x;
      const start = (bole) => ({ position: [bole.x + u.x * 1.3, 0, bole.z + u.z * 1.3], rotation: [0, turn, 0] });
      const plain = { x: t.x, z: t.z, found: false, reach: () => 0.21 };
      const cart = made.cart = await kit.model(DIR + 'handcart.glb', { ...PAINT, materials: { wheel: { crisp: true } }, ...start(plain) });
      cart.group.name = 'handcart (the flood orchard\'s; shared)';
      let drift = null;
      // (cart_drift.glb carries the cart's own plate of ice in a slot `ice`, as crate_snow.glb does: the cart stands in skin ice,
      // which is the water's and opens under a hull; its drift lies on that plate and nowhere else)
      if (has('cart_drift')) { drift = await kit.model(SDIR + 'cart_drift.glb', { ...snowOn(), materials: { ice: { color: '#ffffff', brush: 0.4, shade: 1, steps: 3, extend: [L.dusk] } }, ...start(plain) }); winter(drift.group); drift.group.name = 'cart_drift and its ice (winter)'; }
      const old = F.at(H.at[0], H.at[1], 0), col = (ctx.state.colliders || []).find((q) => Math.hypot(q.x - old.x, q.z - old.z) < 0.05);
      const seat = (bole) => {
        cart.set(start(bole));
        let pos = V3(bole.x + u.x * 1.3, 0, bole.z + u.z * 1.3);
        if (cart.points && cart.points.rest) {
          const rest = cart.point('rest'), out = (rest.x - bole.x) * u.x + (rest.z - bole.z) * u.z - bole.reach(u.x, u.z) + 0.012, side = (rest.x - bole.x) * cx + (rest.z - bole.z) * cz;
          pos = V3(bole.x + u.x * (1.3 - out) - cx * side, 0, bole.z + u.z * (1.3 - out) - cz * side);
        }
        cart.set({ position: pos, rotation: [0, turn, 0] });
        if (drift) drift.set({ position: pos, rotation: [0, turn, 0] });
        if (col) { col.x = pos.x + u.x * 0.15; col.z = pos.z + u.z * 0.15; col.r = 1.0; }
        made.cartAt = { tree: t, bole, out: u.clone(), position: pos };
      };
      seat(plain);
      later.push(() => { const bole = boleAt(t, 0.72, 1.06); if (!bole.found) return false; seat(bole); return true; });
    }

    // ---- the hives: six white box hives on their trestle stand at (230, +13.5), entrances to the channel. The flood is
    // frozen under snow here: the stand is lifted with the snow it stands in (the layout's rule: its deck a hand over it)
    {
      const Hv = Lf.hives, [hs, hd] = Hv.at, gy = Math.max(0, land.snowHeight(hd, -hs, 4, 1) - 0.25);
      const place = { position: F.at(hs, hd, gy), rotation: [0, 0, 0] };
      const hv = made.hives = await kit.model(DIR + 'hive_stand.glb', { ...PAINT, extend: [timber, chalk, L.dusk, petals, L.wet], ...place });
      hv.group.name = 'hive_stand (the flood orchard\'s; shared)';
      made.entrances = [1, 2, 3, 4, 5, 6].map((i) => hv.point('entrance_' + i));      // (for the threads of vapour and the bees in the water: the cast's)
      if (has('hive_caps')) { const hc = await kit.model(SDIR + 'hive_caps.glb', { ...snowOn(), ...place }); winter(hc.group); hc.group.name = 'hive_caps (winter)'; }
    }

    // ---- the plank walk: duckboards on trestles along d +14.5 from s 233.1 on into the mist (the flood orchard's
    // twenty spans, 78 m on; planks missing where that area has them missing), lifted with the snow like the hives
    {
      const W = Lf.plankWalk, first = 155.1 + plan.shift, n = 20, missing = [[170 + plan.shift, 176 + plan.shift], [190 + plan.shift, 193 + plan.shift]];
      const runs = { a: [], b: [], c: [] }, tints = ['#ffffff', '#f4f0f2', '#f0f2f6', '#f8f4ee'], rw = ctx.rng(262);
      const at = (k) => { const s = first + 3 * k; return F.at(s, W.d, Math.max(0, land.snowHeight(W.d, -s, 5, 1) - 0.2)); };
      for (let k = 0; k < n; k++) {
        const s = first + 3 * k, bare = missing.some(([m0, m1]) => s + 1.5 > m0 && s + 1.5 < m1 + 1.2);
        const p = at(k), q = at(k + 1), kind = bare ? 'c' : (k * 7 + 3) % 5 < 3 ? 'a' : 'b';
        runs[kind].push({ position: p, rotation: [(rw() - 0.5) * 0.015, yawAlong(q.x - p.x, q.z - p.z) + (rw() - 0.5) * 0.02, (rw() - 0.5) * 0.03], tint: tints[k % 4] });
      }
      for (const k of 'abc') {
        if (!runs[k].length) continue;
        const set = await kit.models(DIR + `plank_span_${k}.glb`, runs[k], PAINT); set.group.name = `plank_span_${k} (the flood orchard's; shared)`;
        if (has('plank_snow_' + k)) { const ps = await kit.models(SDIR + `plank_snow_${k}.glb`, runs[k].map(({ position, rotation }) => ({ position, rotation })), snowOn()); winter(ps.group); ps.group.name = `plank_snow_${k} (winter)`; }
      }
    }
    nameAt(ctx, F, 'left for the night: ladders, baskets, crate, handcart, hives, plank walk; the snow on them', [Lf.ladders[0].foot[0], Lf.ladders[0].foot[1], 4.5]);
  }
  return {
    update() {
      if (outlierUpdate) outlierUpdate(ctx.time);
      if (later.length && laterTries < 240) { laterTries++; for (let i = later.length - 1; i >= 0; i--) if (later[i]()) later.splice(i, 1); }
    },
  };
}
function smooth(a, b, x) { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
