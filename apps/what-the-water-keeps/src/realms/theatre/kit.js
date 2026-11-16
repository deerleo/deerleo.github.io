// The theatre of leaves: kit pieces, multitudes, the close band.
//
// STAGE 1 (layout): every kit piece and multitude of the page's model list (section 9) stands here as an instanced
// STAND-IN at the planned count, carrying the triangles of its allowance, in the place the page gives it.
// Whoever builds a piece replaces its block (kit.models(url, placements, H.dress('gilt'))) and deletes the stand-in.
// STAGE 2: the horseshoe (tier fronts, bays, piers, girandoles, lustres, flames, beads, tassels) is real and lives in
// kit_tiers.js; the kit at the water is taken out from kit_floor.js; what is left here is the stage's and the fly tower's.
// A piece's own space: front +Z (into the room, or toward the house), right +X, up +Y.
import * as THREE from 'three';
import { at, house, solid, solids, many, grid, cloths, dev } from './lib.js';
import { makeLeaves, makeRain, leafGeometry } from './kit_multitudes.js';

const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

export async function build(ctx, plan, shared) {
  const { kit } = ctx, H = house(ctx, plan, shared), V = (s, d, y) => at(ctx, s, d, y), T = plan.tiers, show = shared.show || { c: -1 };
  const rnd = ctx.rng(190);

  // ============================================================================================ the tier fronts
  // THE HORSESHOE IS IN kit_tiers.js (the tier fronts bay by bay, the piers, the girandoles, the lustres, the flames, beads and
  // tassels: docs/build/theatre/2-kit-tiers.md). What is left here is the kit of the water, the stage and the fly tower.

  // ============================================================================================ the boxes
  // (the tiers' bays, piers, colonnettes, girandoles and the partitions between the tier boxes are real now: kit_tiers.js)
  // ---- the partitions between the parterre boxes (code: part of the plain building)
  many(ctx, shared, { name: 'box partitions', paint: 'damask', parts: [{ box: [0.1, 1, 1], p: [0, 0, -0.5] }],
    items: plan.parterreBoxes.map((b) => ({ at: [b.pier.s, b.pier.d, -0.7], turn: b.turn, scale: [1, 3.7, plan.parterre.depth] })) });

  // ---- STAND-IN for parterre_box_a..e.glb (1,200, five designs): 34 boxes at water level. The velvet rail's top is 0.25 m
  // above the water, the opening goes to 2.9 m, the box is 1.9 m deep. Here in two paints: velvet (rail, pelmet, curtains
  // tied back) and gilt (the pilaster on its pier, with an unlit three-armed bracket: no parterre candle is ever lit).
  const PB = plan.parterreBoxes, PR = plan.parterre;
  many(ctx, shared, { name: 'parterre_box: rail, pelmet, curtains', paint: 'velvet', tris: 700, items: PB.map((b) => ({ at: [b.s, b.d, 0], turn: b.turn })), parts: [
    { box: [3.3, 0.95, 0.3], p: [0, -0.7, 0.12] }, { box: [3.3, 0.42, 0.14], p: [0, PR.top - 0.42, 0.06] }, { box: [0.34, 2.3, 0.22], p: [-1.42, 0.25, -0.12] }, { box: [0.34, 2.3, 0.22], p: [1.42, 0.25, -0.12] }] });
  many(ctx, shared, { name: 'parterre_box: pilaster and bracket', paint: 'gilt', tris: 500, items: PB.map((b) => ({ at: [b.pier.s, b.pier.d, 0], turn: b.turn })), parts: [
    { box: [0.22, PR.top + 0.7, 0.22], p: [0, -0.7, 0.14] }, { box: [0.44, 0.07, 0.1], p: [0, 1.5, 0.32] }, { box: [0.3, 0.22, 0.3], p: [0, PR.top - 0.3, 0.14] }] });
  // ---- STAND-IN for chair.glb x 70 (300): gilt chairs standing in water to their seats, two to four in a box
  {
    const items = [];
    PB.forEach((b, i) => { const ns = -Math.cos(b.turn), nd = Math.sin(b.turn); for (let k = 0; k < (i % 17 === 5 ? 4 : 2); k++) { const e = (k % 2 ? 0.62 : -0.62) + (k > 1 ? 0.15 : 0), back = 0.75 + (k > 1 ? 0.6 : 0);
      items.push({ at: [b.s - ns * back - nd * e, b.d - nd * back + ns * e, -0.42], turn: b.turn + (rnd() - 0.5) * 0.5 }); } });
    many(ctx, shared, { name: 'chair', paint: 'gilt', tris: 300, parts: [{ box: [0.45, 0.46, 0.45], p: [0, 0, 0] }, { box: [0.45, 0.5, 0.06], p: [0, 0.46, -0.2] }], items });
  }
  // (the ten lustres and their lights are real now: kit_tiers.js)

  // ============================================================================================ under the water
  // ---- STAND-IN for seat.glb (60): a pool of 420 velvet seat backs laid out from the seating plan round the boat
  // (46 rows 0.9 m apart, seats 0.5 m wide, none under the mound, the centre aisle clear). Beyond about 12 m the water is a mirror.
  const Sp = plan.seats, seatGeo = solids(ctx, [{ box: [Sp.width - 0.06, Sp.back, 0.14], p: [0, 0, 0], local: true }], 60);
  const seats = new THREE.InstancedMesh(seatGeo, H.paint('velvet', { color: '#285c4c', wake: false, take: [0, 0, 0.3, 0] }), Sp.pool);
  seats.name = 'standin:seat (pool of 420)'; seats.frustumCulled = false; ctx.only(seats, 'direct'); ctx.add(seats);
  const seatM = new THREE.Matrix4(), seatP = new THREE.Vector3(), seatQ = new THREE.Quaternion(), seatS = new THREE.Vector3(1, 1, 1); let seatCell = '';
  const laySeats = () => {
    const b = ctx.boat, q = ctx.path.locate(b.x, b.z), row0 = Math.round((q.s - Sp.from) / Sp.pitch), col0 = Math.round(q.d / Sp.width), cell = row0 + ':' + col0;
    if (cell === seatCell) return; seatCell = cell;
    let n = 0;
    for (let r = row0 - 7; r <= row0 + 6 && n < Sp.pool; r++) {
      if (r < 0 || r > Sp.rows) continue;
      const s = Sp.from + r * Sp.pitch, edge = plan.frontD(s) - 1.3, y = plan.stallsFloor(s);
      for (let k = col0 - 15; k <= col0 + 14 && n < Sp.pool; k++) {
        const d = (k + 0.5) * Sp.width;
        if (Math.abs(d) < plan.runner.width / 2 + 0.1 || Math.abs(d) > edge || Math.hypot(s - plan.beech.s, d - plan.beech.d) < plan.beech.mound.onSeats / 2) continue;
        seats.setMatrixAt(n++, seatM.compose(at(ctx, s, d, y, seatP), seatQ, seatS));
      }
    }
    seats.count = n; seats.instanceMatrix.needsUpdate = true;
  };
  laySeats();
  // ---- STAND-IN for dome_fragment_a..f.glb (300 to 500): the fallen sky, six pieces of painted plaster lying across the seat backs, 0.2 to 0.6 m down
  many(ctx, shared, { name: 'dome_fragment (the fallen sky)', paint: H.paint('sky', { color: '#6f8486', take: [0, 0, 0.35, 0] }), tris: 400, only: 'direct', parts: [{ box: [1, 0.12, 1], p: [0, 0, 0] }],
    items: plan.fallenSky.map(([s, d], i) => ({ at: [s, d, -0.22 - 0.07 * i], turn: i * 1.1, scale: [1.2 + (i % 3) * 0.8, 1, 1.0 + ((i + 1) % 3) * 0.7] })) });
  // ---- STAND-IN for footlight_trough.glb (2,400) and prompt_shell.glb (600): awash at the front of the stage. Never lit.
  solid(ctx, shared, { name: 'footlight_trough and prompt_shell', paint: 'brass', tris: 3000, only: 'direct', at: [plan.footlights.s, 0, 0], high: 0.3, parts: [
    { box: [plan.footlights.length, 0.25, 0.45], at: [plan.footlights.s, 0, -0.3] }, { dome: [0.8, 0.35, 0.5], at: [plan.footlights.s - 0.2, 0, -0.5] }] });
  // ---- the three open traps and the long shaft turning 2.2 m down (code). The first thing to cut.
  solid(ctx, shared, { name: 'traps and the long shaft', paint: 'dark', only: 'direct', at: [106, 3, 0], high: 0.3, parts: [
    ...plan.traps.map(([s, d]) => ({ box: [1.2, 0.03, 1.2], at: [s, d, plan.levels.stage + 0.005] })), { cyl: [0.25, 0.25, 16], at: [106, 0, -2.2], axis: 's' }] });

  // ============================================================================================ the orchestra
  // ---- STAND-IN for music_stand.glb x 14 (260): tops 0.15 m clear of the water, in two arcs from (80, +-9.8) to (88, +-11.6)
  many(ctx, shared, { name: 'music_stand', paint: 'brass', tris: 260, items: plan.orchestra.stands.map(([s, d]) => ({ at: [s, d, plan.levels.orchestra], turn: d > 0 ? -0.5 : 0.5 })), parts: [
    { pole: [0.03, 0.02], from: [0, 0, 0], to: [0, 1.1, 0], radial: 6 }, { box: [0.5, 0.34, 0.03], p: [0, 1.02, 0], tilt: [-0.35, 0] }] });

  // ============================================================================================ the stage
  const W = plan.wings, stageY = plan.levels.stage;
  // ---- STAND-IN for wing_flat_a..c.glb (1,200; ten placed): five pairs of flats cut to the outline of blossom, 4.2 m wide,
  // 9.5 to 7.5 m tall, inner edges at d +-10.6; and their backs: raw canvas on a timber frame with a brace and a stage weight
  {
    const flat = [], backs = [];
    W.s.forEach((s, i) => { for (const sign of [-1, 1]) { const it = { at: [s, sign * (W.inner + W.width / 2), stageY], scale: [1, W.heights[i], 1] }; flat.push(it); backs.push({ ...it, scale: [sign, W.heights[i], 1] }); } });
    many(ctx, shared, { name: 'wing_flat (painted face)', paint: 'rose', tris: 700, items: flat, parts: [{ box: [W.width, 1, 0.03], p: [0, 0, 0.02] }, { box: [W.width * 0.5, 0.16, 0.03], p: [-W.width * 0.3, 0.9, 0.02] }] });
    many(ctx, shared, { name: 'wing_flat (back: canvas and frame)', paint: H.paint('canvas', { side: THREE.DoubleSide }), tris: 500, items: backs, parts: [
      { box: [W.width, 1, 0.02], p: [0, 0, -0.02] }, { box: [0.07, 1, 0.05], p: [-W.width / 2 + 0.05, 0, -0.06] }, { box: [0.07, 1, 0.05], p: [W.width / 2 - 0.05, 0, -0.06] }, { box: [W.width, 0.012, 0.05], p: [0, 0.5, -0.06] },
      { bar: [0.06, 0.05], from: [1.2, 0.72, -0.08], to: [1.2, 0.0, -1.6] }, { box: [0.4, 0.03, 0.3], p: [1.2, 0, -1.6] }] });
  }
  // ---- STAND-IN for wave_roller.glb x 8 (2,600) on two trestle.glb each (420): 4.4 m long, 0.78 m across the crest, axis at y 0.06,
  // from d +-10.8 to +-15.2: half in the water, 1.8 m from the gunwale. (They turn once in 6, 7, 8.5 and 10 s: the cast's.)
  {
    const R = plan.rollers, mid = (R.d[0] + R.d[1]) / 2, len = R.d[1] - R.d[0], roll = [], tr = [];
    for (const s of R.s) for (const sign of [-1, 1]) { roll.push({ at: [s, sign * mid, R.axisY] }); for (const e of [-1, 1]) tr.push({ at: [s, sign * (mid + e * (len / 2 - 0.1)), stageY] }); }
    many(ctx, shared, { name: 'wave_roller', paint: 'petrol', tris: 2600, items: roll, parts: [{ cyl: [R.across / 2, R.across / 2, len], p: [0, 0, 0], axis: 'd', radial: 20 }] });
    many(ctx, shared, { name: 'trestle', paint: 'timber', tris: 420, items: tr, parts: [{ box: [0.16, 0.62, 1.0], p: [0, 0, 0] }, { box: [0.2, 0.1, 0.16], p: [0, 0.56, 0] }] });
  }
  // ---- STAND-IN for the house curtain: a festoon cloth 25 by 14.5 m (a shader of the cast's, lifted on nine lines into nine
  // scallops) and its 160 tassels (24 triangles each). Here: a plain slab whose hem follows the show clock (3 m, then up 11 m
  // between c 13 and 27), so that the pictures before, during and after the rise can be composed.
  let curtain = null;
  if (plan.standIn.curtain) {
    const Cu = plan.curtain, top = 17.3;
    curtain = new THREE.Group(); curtain.position.copy(V(Cu.s + 0.15, 0, 0)); ctx.add(curtain);
    const slab = new THREE.Mesh(solids(ctx, [{ box: [Cu.width, 1, 0.3], p: [0, 0, 0], local: true }], 16000), H.paint('velvet', { wake: false }));
    slab.name = 'standin:house curtain (festoon)'; curtain.add(slab);
    const tg = solids(ctx, [{ cone: [0.07, 0.3], p: [0, -0.3, 0], local: true }], 24), tassels = new THREE.InstancedMesh(tg, H.paint('gilt', { wake: false }), Cu.tassels), m = new THREE.Matrix4();
    for (let i = 0; i < Cu.tassels; i++) tassels.setMatrixAt(i, m.makeTranslation((i / (Cu.tassels - 1) - 0.5) * (Cu.width - 0.3), 0, 0.18));
    tassels.name = 'standin:tassel x 160'; tassels.frustumCulled = false; curtain.add(tassels);
    curtain.userData = { slab, tassels, top };
  }
  // ---- STAND-INS for the cloths (makeCloth on the page; here lib.js `cloths`, in the house's light): five blossom borders
  // 26 m wide hanging from 14 m to a scalloped edge at 9.5 to 11 m; the backcloth, 26 by 12 m in six sewn widths, split down the
  // middle seam, which the prow parts; three old cloths in the fly tower, 14 by 9 m, each dimmer than the last. One draw.
  let cloth = null;
  if (plan.standIn.cloths) {
    const Bo = plan.borders, Bc = plan.backcloth, F = plan.fly, list = [];
    Bo.s.forEach((s, i) => list.push({ at: [s, 0, Bo.top], width: Bo.width, drop: Bo.top - (Bo.edge[0] + (Bo.edge[1] - Bo.edge[0]) * (i / 4)), color: '#C99AA0', stiff: 0.6 }));
    for (let i = 0; i < Bc.widths; i++) list.push({ at: [Bc.s, (i - 2.5) * (Bc.width / Bc.widths), stageY + Bc.height], width: Bc.width / Bc.widths, drop: Bc.height + 0.25, color: i % 2 ? '#bf9f9a' : '#c7a79f', stiff: 0.75 });
    F.cloths.forEach((c, i) => list.push({ at: [c.s, 0, i === 2 ? 10.2 : 12.4], width: F.cloth[0], drop: F.cloth[1], color: ['#8f9aa6', '#b9b4c4', '#d0a890'][i], stiff: 0.6, tilt: i === 2 ? 0.26 : 0 }));      // the third hangs by one corner, its low end trailing in the water at d -8
    cloth = cloths(ctx, shared, list, { part: true, sway: 0.05, wake: false });
  }
  // ---- STAND-IN for ladder.glb (380): leaning on the back of the proscenium
  solid(ctx, shared, { name: 'ladder', paint: 'timber', tris: 380, at: [91.6, -13.4, 4.6], high: 0.3, parts: [
    { bar: [0.05, 0.05], from: [92.4, -13.7, stageY], to: [91.0, -13.7, 4.6] }, { bar: [0.05, 0.05], from: [92.4, -13.2, stageY], to: [91.0, -13.2, 4.6] }, { bar: [0.5, 0.03], from: [91.9, -13.45, 1.4], to: [91.5, -13.45, 2.8] }] });

  // ============================================================================================ the fly tower
  {
    const F = plan.fly, SH = plan.stageHouse;
    // ---- STAND-IN for pin_rail.glb x 6 (1,400): 6 m rails with rope coiled on every pin; two on the stage's fly galleries, four at the water in the fly tower
    many(ctx, shared, { name: 'pin_rail', paint: 'timber', tris: 1400, parts: [{ box: [0.16, 0.14, 6], p: [0, 0.9, 0] }, { box: [0.12, 0.9, 0.12], p: [0, 0, -2.6] }, { box: [0.12, 0.9, 0.12], p: [0, 0, 2.6] }, ...[-2, -1, 0, 1, 2].map((k) => ({ ball: [0.11, 0.2, 0.11], p: [0.1, 0.72, k] }))],
      items: [...[-1, 1].map((sg) => ({ at: [103, sg * (SH.wall - 1.0), SH.gallery.y + 0.18] })), ...[130, 150].flatMap((s) => [-1, 1].map((sg) => ({ at: [s, sg * 11.75, 0.15] })))] });
    // ---- STAND-IN for counterweight.glb x 10 (500): cast weights stacked unevenly, sliding in timber guides on the walls
    many(ctx, shared, { name: 'counterweight', paint: 'iron', tris: 500, parts: [{ box: [0.34, 1.4, 0.3], p: [0, 0, 0] }, { box: [0.08, 9, 0.08], p: [0.2, -3, 0.22] }, { box: [0.08, 9, 0.08], p: [0.2, -3, -0.22] }],
      items: Array.from({ length: F.counterweights }, (_, i) => ({ at: [125 + i * 3.6, (i % 2 ? 1 : -1) * (F.wall - 0.35), 2.5 + ((i * 37) % 9)] })) });
    // ---- STAND-IN for sandbag.glb x 14 (180): canvas bags turning slowly at 2.5 to 9 m, d +-8 to +-10.5, each on its rope
    const bags = Array.from({ length: F.sandbags }, (_, i) => ({ s: 123 + i * 2.7, d: (i % 2 ? 1 : -1) * (8 + ((i * 53) % 26) / 10), y: 2.5 + ((i * 29) % 66) / 10 }));
    many(ctx, shared, { name: 'sandbag', paint: 'canvasBag', tris: 180, parts: [{ ball: [0.2, 0.3, 0.2], p: [0, 0, 0] }, { cone: [0.09, 0.22], p: [0, 0.2, 0] }], items: bags.map((b) => ({ at: [b.s, b.d, b.y] })) });
    // ---- STAND-IN for sheave.glb x 30 (120): grooved wheels on the grid
    many(ctx, shared, { name: 'sheave', paint: 'iron', tris: 120, parts: [{ cyl: [0.2, 0.2, 0.06], p: [0, 0, 0], axis: 'd', radial: 12 }], items: Array.from({ length: 30 }, (_, i) => ({ at: [96 + i * 2.1, (i % 2 ? 1 : -1) * (3 + (i * 7) % 8), F.grid - 0.3] })) });
    // ---- STAND-IN for batten.glb x 3 (300): the 14 m battens the old cloths hang from
    many(ctx, shared, { name: 'batten', paint: 'timber', tris: 300, parts: [{ cyl: [0.045, 0.045, F.cloth[0] + 0.6], p: [0, 0, 0], axis: 'd', radial: 8 }], items: F.cloths.map((c, i) => ({ at: [c.s, 0, i === 2 ? 10.25 : 12.45], rotation: i === 2 ? [0, 0, 0.26] : 0 })) });
    // ---- the rope walls: 30 ropes a side, 25 mm thick, d 10.3 to 11.5, s 122 to 160; the bags' ropes; and the last rope,
    // to the water at s 160, 2.5 m left of the line (the side the sea's page trails its rope end on). One mesh (code).
    const ropes = [];
    for (const sg of [-1, 1]) for (let i = 0; i < F.ropes.perSide; i++) { const s = F.ropes.s[0] + (F.ropes.s[1] - F.ropes.s[0]) * (i + 0.5 * ((i * 13) % 3)) / F.ropes.perSide, d = sg * (F.ropes.d[0] + (F.ropes.d[1] - F.ropes.d[0]) * (((i * 17) % 10) / 9));
      ropes.push({ pole: [0.0125, 0.0125], from: [s, d, 0.6 + ((i * 7) % 5) * 0.12], to: [s + 0.05, d, F.grid], radial: 5 }); }
    for (const b of bags) ropes.push({ pole: [0.012, 0.012], from: [b.s, b.d, b.y + 0.4], to: [b.s, b.d, F.grid], radial: 5 });
    ropes.push({ pole: [0.02, 0.02], from: [F.lastRope.s, F.lastRope.d, -0.4], to: [F.lastRope.s - 0.3, F.lastRope.d + 0.1, F.grid], radial: 6 });
    solid(ctx, shared, { name: 'rope walls, bag ropes, the last rope', paint: 'rope', parts: ropes, at: [140, 11.5, 3], high: 0.5 });
  }

  // ============================================================================================ the foyer and the mound
  {
    const St = plan.foyer.stairs, bal = [], ros = [];
    // ---- STAND-IN for baluster.glb (60), 60 a side, along the open edge of each stair
    for (const sign of [-1, 1]) for (let i = 0; i < St.balusters; i++) { const u = i / (St.balusters - 1) * 0.78, k = u * (St.line.length - 1), j = Math.min(St.line.length - 2, Math.floor(k)), f = k - j, a = St.line[j], b = St.line[j + 1];
      bal.push({ at: [a[0] + (b[0] - a[0]) * f, sign * (a[1] + (b[1] - a[1]) * f - St.width / 2 + 0.08), a[2] + (b[2] - a[2]) * f] }); }
    many(ctx, shared, { name: 'baluster', paint: 'plaster', tris: 60, parts: [{ cyl: [0.05, 0.035, 0.9], p: [0, 0, 0], radial: 6 }], items: bal });
    // ---- STAND-IN for lamp_standard.glb x 2 (900): an unlit bronze lamp standard 2.2 m tall on each newel
    many(ctx, shared, { name: 'lamp_standard', paint: 'brass', tris: 900, parts: [{ box: [0.36, 1.1, 0.36], p: [0, -0.4, 0] }, { pole: [0.06, 0.035], from: [0, 0.7, 0], to: [0, 2.6, 0], radial: 10 }, { ball: [0.17, 0.2, 0.17], p: [0, 2.75, 0] }],
      items: [-1, 1].map((sg) => ({ at: [plan.foyer.newel.s, sg * plan.foyer.newel.d, 0] })) });
    // ---- STAND-IN for rosette.glb (120): a leaf rosette in each of the ceiling's eighteen coffers
    for (let i = 0; i < 6; i++) for (const d of [-6.67, 0, 6.67]) ros.push({ at: [1.45 + i * 5.3, d, plan.foyer.height - 0.05], rotation: [Math.PI / 2, 0, 0] });
    many(ctx, shared, { name: 'rosette', paint: 'gilt', tris: 120, parts: [{ cyl: [0.5, 0.3, 0.12], p: [0, 0, 0], axis: 's', radial: 12 }], items: ros });
    // ---- STAND-IN for fern.glb x 18 (160): hart's-tongue on the mound
    const B = plan.beech;
    many(ctx, shared, { name: 'fern', paint: H.paint({ color: '#2f5238', wake: false }), tris: 160, parts: [{ cone: [0.34, 0.6], p: [0, 0, 0] }],
      items: Array.from({ length: 18 }, (_, i) => { const a = i * 2.4, r = 2.3 + (i % 5) * 0.62; return { at: [B.s + Math.cos(a) * r, B.d + Math.sin(a) * r, 1.75 * (1 - Math.pow(r / 5.25, 2)) - 0.05], scale: 0.8 + (i % 3) * 0.25 }; }) });
    // ---- STAND-IN for trinkets.glb (60 to 220; forty placements): opera glasses, a fan, a shawl, a posy, a card, left on the box rails
    many(ctx, shared, { name: 'trinkets', paint: 'card', tris: 140, parts: [{ box: [0.22, 0.06, 0.1], p: [0, 0, 0] }],
      items: Array.from({ length: 40 }, (_, i) => { const b = PB[(i * 5) % PB.length], ns = -Math.cos(b.turn), nd = Math.sin(b.turn), e = ((i * 7) % 9 - 4) * 0.3; return { at: [b.s + ns * 0.18 - nd * e, b.d + nd * 0.18 + ns * e, PR.rail + 0.01], turn: b.turn + i }; }) });
  }

  // ============================================================================================ multitudes
  // ---- STAND-IN for the leaf sprays (36 triangles, 2,000): a twig with leaves, studding the crown's masses so that its edge is leaves, not a hull
  if (shared.crown) {
    const one = leafGeometry(3.2), parts = [], m = new THREE.Matrix4(), e = new THREE.Euler(), items = [], cols = ['#B5522A', '#9c4526', '#7A3B22', '#C08A3A', '#5A2630', '#c9602c'];
    for (let i = 0; i < 6; i++) { const g = one.clone(); g.applyMatrix4(m.makeRotationFromEuler(e.set((i % 2 ? 0.5 : -0.4), i * 1.05, (i - 2.5) * 0.25)).setPosition((i - 2.5) * 0.09, 0, i * 0.07)); parts.push({ mesh: g }); }
    const spray = solids(ctx, parts, 0);
    for (let i = 0; i < kit.count(plan.beech.sprays); i++) {
      const c = shared.crown[i % shared.crown.length], a = rnd() * Math.PI * 2, el = Math.asin(Math.min(1, rnd() * 1.75 - 0.9)), k = 1.03;       // more of them low and round the rim than on top
      const p = V(c.at[0] + Math.cos(a) * Math.cos(el) * c.r[2] * k, c.at[1] + Math.sin(a) * Math.cos(el) * c.r[0] * k, c.at[2] + Math.sin(el) * c.r[1] * k);
      items.push({ position: p, rotation: [rnd() * 6.28, rnd() * 6.28, rnd() * 6.28], scale: 0.8 + rnd() * 0.7, color: cols[Math.floor(rnd() * cols.length)] });
    }
    many(ctx, shared, { name: 'leaf spray', paint: H.paint('leaf', { color: '#ffffff', side: THREE.DoubleSide, brush: 0.3 }), geo: spray, items });
  }
  // (the beads of the chandelier in the tree and of the lustres are real now: kit_tiers.js)
  // ---- the cast's multitudes, standing in (kit_multitudes.js): leaves, rain. (The candle flames are real: kit_tiers.js makes them.)
  const flames = null;
  const leaves = (plan.standIn.leaves || plan.standIn.sitters || plan.standIn.company) ? makeLeaves(ctx, plan, shared) : null;
  const rain = plan.standIn.rain ? makeRain(ctx, plan, shared) : null;
  shared.standIns = { flames, leaves, rain, curtain, cloth };
  void dev;

  return {
    update() {
      const c = show.c;
      laySeats();
      if (curtain) {                                                       // the stand-in curtain's hem follows the show clock
        const hem = plan.curtainHem(c), u = curtain.userData;
        u.slab.position.y = hem; u.slab.scale.y = u.top - hem; u.tassels.position.y = hem;
      }
      if (rain) rain.visible = ctx.look.house.shaft > 0.004;
      // Through the painting: as the cloth sweeps over the eye the picture washes to the fly tower's plum-black (the page: to 1
      // over 1 s, back over 1.5 s; here by the eye's distance from the cloth). The rest of that moment is the staging's.
      if (cloth) {
        const eye = ctx.engine.shared.uCameraPos.value, q = ctx.path.locate(eye.x, eye.z, ctx.s), s0 = plan.backcloth.s;
        const w = q.s < s0 ? smooth(s0 - 2.4, s0 - 0.2, q.s) : 1 - smooth(s0 + 0.1, s0 + 3.4, q.s);
        if (w > 0.002 && Math.abs(q.d) < plan.backcloth.width / 2 + 0.5) ctx.wash('#17111A', w);
      }
    },
  };
}
