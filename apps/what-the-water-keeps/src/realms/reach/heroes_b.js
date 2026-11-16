// The dyers' reach: the other one-of-a-kind pieces. Page: docs/art/reach.md, section 9, "Hero pieces" (the monument is
// heroes.js). Stage 2 (docs/build/reach/2-heroes-houses.md): THE HOUSES are modelled and stand here in place of their
// stand-ins; the three machines below them are still the layout's STAND-INS, and belong to the person who models them
// (heroes_c.js takes them out).
//
//   west front frame          masts 23 m, heads at d +-13.6, the tie 20.5 m up in the cloth's plane, a pointed arch   (s 92)     west_front.glb
//   west door                 two masts 23 m at world x 13.4 and 35.4, the line a yard 19 m up                       (z -206)   west_door.glb
//   the lamp's standing       the mooring dolphin the kept lamp's pole is lashed to                                  (16.8, -203.5)   lamp_standing.glb
//   indigo house              28 by 14 m, open-sided, on the left bank's quay and over the ford on piles              (124, -37) indigo_house.glb
//   cloth loft                the first 20 m of the shed and 26 m of shell: THE MASTER SECTION plan.loft              (s 240 on) cloth_loft.glb
//   chimney                   30 m, far                                                                               (-61, -386) chimney.glb
//   'wringing gallery', 'tipping copper', 'lifting wheel'     STAND-INS (not the houses': left as the layout made them)
//
// Models: source-art/models/reach/hh_*.py -> assets/models/reach/. Each names its own places (points), published for the
// kit and the cast as shared.indigoHouse, shared.loft, shared.westFront, shared.westDoor, shared.lampStanding, shared.chimney.
// Stand-ins of the houses' that are made in kit.js ('door masts', 'chimney') are taken out from here.
import * as THREE from 'three';
import { Pile } from './standins.js';
import { removeStandIn } from '../../engine/modules.js';
import { houseSkin } from './house_skin.js';

export async function build(ctx, plan, shared) {
  const { kit, path } = ctx, C = plan.colors, solid = shared.mat ? shared.mat.solid : null;
  // what every model of the houses wears: the reach's solid material (set.js), so that it takes the dyed light only inside the bar
  // (&hrim=<strength>, &hrimp=<power>: try another edge of light on the houses without editing this line)
  const QS = new URLSearchParams(typeof location !== 'undefined' ? location.search : '');
  const WEAR = { brush: 0.6, rim: { color: '#FFB878', strength: QS.has('hrim') ? +QS.get('hrim') : 0.22, power: QS.has('hrimp') ? +QS.get('hrimp') : 4.5, toward: 1 }, caustics: { intensity: 0.3, height: 0.8, scale: 0.4, color: '#FFD2A6' }, extend: shared.sun ? shared.sun.extend : undefined };
  const made = {};
  // (third holder) THE LAST LIGHT on what stands against the sun (house_skin.js, LIGHT): the sun's own colour on every face
  // seen nearly edge-on by an eye that looks toward it. The loft most (the boat is carried at it for 35 m with the sun
  // behind it; inside the shed it fades: `inside`, in the model's own z); the house, the masts and the standing less.
  const LAST = {
    loft: { strength: 1.5, power: 3, color: '#ffd0b0', inside: [-6.0, -0.6, 0.3] },
    // (fifth holder) `roof`: how much of it the SHINGLES take. On the house's roof, which the low eye sees nearly edge-on from
    // everywhere, the full edge lit the half of the slope that leans toward the sun and left the rest: two roofs with a hard
    // line between them, the lit one paler than the key painting's (#9d5a4e against #7e4a56). A quarter of it: one dusky roof
    // with a little of the last light toward its west end. (&hroofedge=<0..1> tries another.)
    house: { strength: 0.9, power: 3, color: '#ffd0b0', roof: QS.has('hroofedge') ? +QS.get('hroofedge') : 0.25 },
    mast: { strength: 0.8, power: 3, color: '#ffd0b0' },
  };
  // (second look) THE SKIN: the area's painted tiles laid over the models' paint by the grain, and the water's marks drawn
  // as the yards draw theirs (house_skin.js). `dyes`: the bank's own dye and the other bank's, where a model stands.
  const skin = await houseSkin(ctx, plan, shared), DYE = plan.dye;
  const hw = (s) => kit.halfWidth(s), P = {};
  /** A frame of its own for a building: (u along the route from s0, v to the right from d0, y) -> the realm's coordinates. */
  const frame = (s0, d0) => { const o = kit.at(s0, d0), a = path.at(s0, P), tx = a.tx, tz = a.tz, rx = a.rx, rz = a.rz; return (u, v, y = 0) => new THREE.Vector3(o.x + tx * u + rx * v, y, o.z + tz * u + rz * v); };
  const build = (p, name) => p.build(ctx, name, { material: solid });

  // ---- THE WEST FRONT FRAME (hero), THE WEST DOOR (its two masts and its line) and THE LAMP'S STANDING
  // (source-art/models/reach/hh_masts.py -> west_front.glb, west_door.glb, lamp_standing.glb).
  // West front: masts 23 m with their heads at d +-13.6 (the kit ties silks and swags there), the tie's axis 20.5 m up in
  // the cloth's plane, wing spars at 19.9 m. Its frame: origin at s 92 on the water, front toward the nave.
  // West door: masts at world x 13.4 and 35.4, standing 0.45 m east (upwind) of the cloth's plane z -206 and leaning
  // back to it; the line is a yard 19 m up in the plane. The south mast stands on the wheel pier's north arch.
  // The ropes of all three are a material slot of their own, drawn crisp (they are thinner than the painter's brush).
  {
    const F = plan.westFront, W = plan.westDoor, K = plan.lamp;
    // (the skin: the left mast stands on the indigo bank, the right on the madder bank: the marks' dyes change places on the model's +x side;
    // the door's north mast, its +x, stands in the terrace's violet water; its south mast on the pier, above every mark)
    const front = await kit.model('models/reach/west_front.glb', { at: [F.s, 0, 0], face: 'back', ...WEAR, materials: skin.materials({ dyes: [DYE.INDIGO, DYE.MADDER], bothBanks: true, edge: LAST.mast }) });
    const door = await kit.model('models/reach/west_door.glb', { position: [(W.masts[0][0] + W.masts[1][0]) / 2, 0, W.z], ...WEAR, materials: skin.materials({ dyes: [DYE.INDIGO, DYE.VIOLET], bothBanks: true, edge: LAST.mast }) });
    // the lamp's standing: an old mooring dolphin the kept lamp's pole is lashed to (the lamp itself is stage.js's)
    // (remade at the second look: source-art/models/reach/hh_standing.py. A king pile 2 m out of the water with two rakers,
    // seized with five turns of hawser; the pole stands in front of the king pile and is held to it by an iron holdfast and
    // a seizing. Its piles reach 0.8 m either side of the pole at the water: one circle keeps the hull off all three.)
    const standing = await kit.model('models/reach/lamp_standing.glb', { position: [K.world[0], 0, K.world[1]], ...WEAR, materials: skin.materials({ dyes: [DYE.INDIGO, DYE.VIOLET], more: { rope: { crisp: true, color: '#b4a496' } } }) });      // (old rope: it must not outshine the lamp)
    ctx.addCollider({ x: K.world[0] - 0.05, z: K.world[1] - 0.36, r: 0.95 });
    made.front = front; made.door = door; made.standing = standing;
    for (const m of [front, door, standing]) skin.dress(m);      // (the skin works in each mesh's own space: house_skin.js)
    const pt = (m, name) => { const v = m.point(name); return { x: v.x, y: v.y, z: v.z }; };
    shared.westFront = { model: front, heads: [pt(front, 'head_l'), pt(front, 'head_r')], cleats: [pt(front, 'cleat_l'), pt(front, 'cleat_r')], feet: [pt(front, 'foot_l'), pt(front, 'foot_r')], hoist: pt(front, 'hoist') };
    shared.westDoor = { model: door, heads: [pt(door, 'head_s'), pt(door, 'head_n')], cleats: [pt(door, 'cleat_s'), pt(door, 'cleat_n')], feet: [pt(door, 'foot_s'), pt(door, 'foot_n')], line: [pt(door, 'line_s'), pt(door, 'line_n')] };
    shared.lampStanding = { model: standing, lash: pt(standing, 'lash'), piles: [pt(standing, 'pile_a'), pt(standing, 'pile_b')] };
    // (the south door mast stands on the pier's north arch: the pier names the place)
    const pier = shared.wheel && shared.wheel.points && shared.wheel.points.pier;
    if (pier && pier.points && pier.points.mast_step) { const st = pier.point('mast_step'), ft = shared.westDoor.feet[0]; if (Math.abs(st.y - ft.y) > 0.12) console.warn(`reach/heroes_b: the door's south mast is modelled to stand ${ft.y.toFixed(2)} m up; the pier's mast step is at ${st.y.toFixed(2)} m`); }
  }

  // ---- THE INDIGO HOUSE (hero; source-art/models/reach/hh_indigo_house.py -> assets/models/reach/indigo_house.glb):
  // an open-sided timber dye house 28 by 14 m on the left bank's quay, its west half over the ford on piles. King-post
  // trusses, a shingle roof that sags between them, a louvred ridge vent, six sunk vats, a water stair, racks.
  // The model's own frame: x along the route from s 124 (downstream +), -y toward the channel, placed with face 'channel'.
  {
    const H = plan.indigoHouse;
    // (the skin: oak by the grain, the stair's stone, the roof's shingles up the slope; the ridge runs along the model's x.
    // A course of its shingles is 0.49 m: the tile's four painted rows are laid 1.97 m to a repeat, so the rows keep step with them)
    // (fifth holder: the stair is seen at 3 m, where the stone tile at the yards' 2.4 m to a repeat is a soft wash on smooth slabs: 1.3 m here; &hstone=<m> tries another)
    // (sixth holder) THE LIQUOR. The indigo in the tubs and the vats, and the froth on it, are a slot of their own in the model
    // (`liquor`). The painted material adds water-light to whatever stands under its height, whatever its paint, so a tub's
    // liquor could never be dark: from the hull, 1 m off, it was a pale lilac lid. In its own slot it takes no water-light
    // and no rim, and is what a liquid is: blue-black where the eye looks down into it; where the eye looks along it, the
    // evening lying on it (the haze's colour low, the sky's higher), or the dark of the house where the mirrored ray goes in
    // under the roof; the bronze flower gives the light back coppery. It stirs a little (nothing in view is wholly still).
    // (&hliq=0: as any painted thing, for comparison.)
    const mid = kit.at(H.at[0], H.at[1]), edge0 = kit.at(H.at[0], 0), inward = new THREE.Vector3(mid.x - edge0.x, 0, mid.z - edge0.z).normalize();
    const liquor = QS.get('hliq') === '0' ? {} : { caustics: null, rim: null, brush: 0.35, extend: {
      uniforms: { uLqIn: { value: inward } },
      fragmentPars: 'uniform vec3 uLqIn;',
      light: /* glsl */`{
        float lqUp = smoothstep(0.7, 0.96, N.y);
        vec3 lqN = normalize(N + lqUp * vec3(0.03 * sin(vWPos.x * 7.3 + uTime * 0.61) + 0.018 * sin(vWPos.z * 17.0 - uTime * 0.9), 0.0, 0.03 * sin(vWPos.z * 6.1 - uTime * 0.47) + 0.018 * sin(vWPos.x * 15.0 + uTime * 0.8)));
        float lqF = min(0.03 + 0.97 * pow(1.0 - clamp(dot(lqN, V), 0.0, 1.0), 4.0), 0.55);
        vec3 lqR = reflect(-V, lqN);
        float lqIn = smoothstep(-0.15, 0.55, dot(normalize(lqR.xz + vec2(1e-5)), uLqIn.xz));
        vec3 lqSee = mix(mix(uFogColor, uSkyLight * 1.3, smoothstep(0.05, 0.6, lqR.y)), uRampShadow * 0.3, lqIn);
        float lqBr = smoothstep(0.0, 0.1, albedo.r - albedo.b);
        float lqMatte = smoothstep(0.045, 0.12, albedo.b);                      // froth and wet cloth are matte: only the liquor and its film mirror
        c = c * 0.6 + lqSee * mix(vec3(1.0), vec3(1.25, 0.82, 0.5), lqBr) * lqF * mix(0.4, 1.0, lqUp) * mix(0.8, 0.14, lqMatte);
      }`,
    } };
    const house = await kit.model('models/reach/indigo_house.glb', { at: [H.at[0], H.at[1], 0], face: 'channel', ...WEAR, materials: skin.materials({ dyes: [DYE.INDIGO, DYE.MADDER], ridge: [1, 0, 0], shingle: 1.97, stone: QS.has('hstone') ? +QS.get('hstone') : 1.3, roofTint: QS.get('hroof') ? '#' + QS.get('hroof') : '#bea0ca', edge: LAST.house, more: { liquor } }) });      // (the roof a shade darker than its paint, toward the key painting's dusky violet: it stood as pale as the sky behind it; &hroof=rrggbb tries another. Fifth holder: measured in postcard 4 against the key's #7e4a56: #814746 with #c2a2ba, a little short of blue)
    made.indigo = house; skin.dress(house);
    // What it offers the kit and the cast (the model names its own places: docs/build/reach/2-heroes-houses.md):
    const pt = (name) => { const v = house.point(name); return { x: v.x, y: v.y, z: v.z }; }, I = plan.houses.indigo;
    shared.indigoHouse = {
      model: house,
      vats: I.vats.map((_, i) => ({ ...pt('vat' + i), across: 2.04, rim: I.vatRim, dye: plan.dye.INDIGO, sunk: true })),      // the middle of each vat's liquor
      poles: I.poles.map((_, i) => ({ front: pt(`pole${i}_front`), back: pt(`pole${i}_back`) })),                               // where the eight bolts hang
      nests: [0, 1, 2, 3, 4, 5, 6, 7].map((i) => pt('nest' + i)),                                                                // under the water-side eaves
      stair: { top: pt('stair_top'), foot: pt('stair_foot') }, moor: [pt('moor_a'), pt('moor_b')], vent: pt('ridge_vent'),
      drips: [pt('drip_drape')],                                                                                                // where a wet cloth drips into the ford
      // (second look) two staved tubs stand in the ford west of the stair: THEIR liquor is seen from the boat (the six vats' is
      // not: the floor is 0.86 m up and the eye 1.1). A foam raft, a drip, a ring belongs here first. `y` is the liquor's surface.
      tubs: [0, 1].map((i) => ({ ...pt('tub' + i), across: i ? 1.26 : 1.54, dye: plan.dye.INDIGO, seen: true })),
    };
  }

  // ---- STAND-IN for `wringing gallery` (Blender hero, 28,000): a timber gallery on eighteen piles over the water
  {
    const p = new Pile(), G = plan.gallery, L = frame(G.at[0], G.at[1]), [len, deep] = G.size, hl = len / 2, hd = deep / 2;
    for (let i = 0; i < 9; i++) for (const v of [-hd + 0.3, hd - 0.3]) { const u = -hl + 0.6 + i * (len - 1.2) / 8; p.stick(L(u, v, -1.6), L(u, v, v < 0 ? 4.4 : G.roof), [0.42 - (i % 3) * 0.05, 0.3], C.oakWet, 7); }
    p.box(L(0, 0, G.floor - 0.18), [deep, 0.18, len], C.planks, kit.headingAt(G.at[0]));
    { // the lean-to roof: 6 m at the back, 4.4 m over the water
      const g = new THREE.BufferGeometry(), a = L(-hl - 0.5, -hd - 0.7, 4.25), b = L(hl + 0.5, -hd - 0.7, 4.25), c = L(hl + 0.5, hd + 0.3, G.roof + 0.1), d = L(-hl - 0.5, hd + 0.3, G.roof + 0.1), t = 0.2;
      const v8 = [a, b, c, d].map((v) => [v.x, v.y, v.z]).concat([a, b, c, d].map((v) => [v.x, v.y + t, v.z])).flat();
      g.setAttribute('position', new THREE.Float32BufferAttribute(v8, 3));
      g.setIndex([0, 2, 1, 0, 3, 2, 4, 5, 6, 4, 6, 7, 0, 5, 4, 0, 1, 5, 1, 6, 5, 1, 2, 6, 2, 7, 6, 2, 3, 7, 3, 4, 7, 3, 0, 4]);
      const gg = g.toNonIndexed(); gg.computeVertexNormals(); p.geo(gg, C.shingle);
    }
    p.stick(L(-hl, -hd + 0.3, G.floor + 1.0), L(hl, -hd + 0.3, G.floor + 1.0), 0.12, C.oak, 4);        // the balustrade
    p.stick(L(-hl, 0.4, 3.9), L(hl, 0.4, 3.9), 0.18, C.iron, 6);                                        // the line shaft, the whole length
    p.box(L(0, hd - 0.2, G.floor), [0.3, G.roof - G.floor, len], C.oak, kit.headingAt(G.at[0]));        // the back wall
    build(p, 'wringing gallery');
    shared.gallery = { frame: L, floor: G.floor };
  }

  // ---- STAND-IN for `tipping copper and slipway` (Blender hero, 13,000; two meshes: cradle and tub)
  {
    const p = new Pile(), K = plan.copper, s = K.tub[0], top = 3.0;
    p.cyl(kit.at(s, K.tub[1], top + 0.9), [K.across * 0.86, K.deep, K.across], C.copper, 16);           // the tub: oak staves and copper bands
    for (const du of [-K.across / 2 - 0.35, K.across / 2 + 0.35]) p.box(kit.at(s + du, K.tub[1], top), [0.6, 2.6, 1.6], C.oak, kit.headingAt(s) + Math.PI / 2);      // the cradle's cheeks
    // the slipway: 2.4 m wide, down three lips from the top terrace to the water
    const d0 = K.tub[1] - K.across / 2 - 0.4, d1 = K.foot[1], lips = [[d0, 3.0], [d0 - (d0 - d1) * 0.36, 1.9], [d0 - (d0 - d1) * 0.7, 0.9], [d1, -0.15]];
    for (let i = 0; i < 3; i++) {
      const a = lips[i], b = lips[i + 1], g = new THREE.BufferGeometry(), h = K.slip / 2;
      const q = [kit.at(s - h, a[0], a[1] + 0.06), kit.at(s + h, a[0], a[1] + 0.06), kit.at(s + h, b[0], b[1] + 0.12), kit.at(s - h, b[0], b[1] + 0.12)];
      const v8 = q.map((v) => [v.x, v.y, v.z]).concat(q.map((v) => [v.x, v.y - 0.5, v.z])).flat();
      g.setAttribute('position', new THREE.Float32BufferAttribute(v8, 3));
      g.setIndex([0, 2, 1, 0, 3, 2, 4, 5, 6, 4, 6, 7, 0, 1, 5, 0, 5, 4, 1, 2, 6, 1, 6, 5, 2, 3, 7, 2, 7, 6, 3, 0, 4, 3, 4, 7]);
      const gg = g.toNonIndexed(); gg.computeVertexNormals(); p.geo(gg, i === 1 ? '#9A5A52' : '#A0605A');      // worn smooth and stained deep red down its middle
    }
    build(p, 'tipping copper');
  }

  // ---- STAND-IN for `lifting wheel and header` (Blender hero, 18,000; two meshes): 9 m across in its race, its plane along the bank
  {
    const p = new Pile(), Wl = plan.liftingWheel, L = frame(Wl.at[0], Wl.at[1]), R = Wl.across / 2, hubY = R - 0.25;
    const a2 = path.at(Wl.at[0], P), axis = [a2.rx, 0, a2.rz];                                           // its axle lies across the bank
    for (const v of [-0.55, 0.55]) p.ring(L(0, v, hubY), R, axis, 0.3, C.oakWet, 40);
    for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; p.stick(L(0, 0, hubY), L(Math.cos(a) * R, 0, hubY + Math.sin(a) * R), 0.2, C.oakWet, 4); p.box(L(Math.cos(a) * (R - 0.1), 0, hubY + Math.sin(a) * (R - 0.1) - 0.3), [1.3, 0.6, 0.7], C.oakWet, kit.headingAt(Wl.at[0])); }
    for (const v of [-1.3, 1.3]) { p.stick(L(-3.4, v, -1.2), L(0, v, hubY + 0.5), 0.36, C.oak, 4); p.stick(L(3.4, v, -1.2), L(0, v, hubY + 0.5), 0.36, C.oak, 4); }      // its frame
    p.stick(L(0, -1.6, hubY), L(0, 1.6, hubY), 0.4, C.iron, 8);
    p.box(L(0, 2.6, Wl.header - 0.5), [0.9, 0.55, 5.5], C.oak, kit.headingAt(Wl.at[0]));                 // the header trough at 8.5 m
    for (const u of [-2.4, 2.4]) p.stick(L(u, 2.6, 0.9), L(u, 2.6, Wl.header - 0.5), 0.3, C.oak, 4);
    build(p, 'lifting wheel');
  }

  // ---- THE CLOTH LOFT (hero; source-art/models/reach/hh_cloth_loft.py -> assets/models/reach/cloth_loft.glb). THE MASTER
  // SECTION is plan.loft and the model is built to it: bents at kit.at(s, +-9.6) for s 240 .. 260 (the model follows the
  // path: its script reads the path), tie beams at 9 m, ridge 13 m, walks 0.6 m up, walls at 11.4 m; the shell (roof and
  // walls) runs on 26 m beyond the path's end. Its own frame: origin on the water at s 240, +y (Blender) into the shed.
  // Moving parts: `bale` (hangs from the hoist), `door` (the left aisle's door leaf), `hung0` (the length of cloth over the gable's pole).
  {
    const T = plan.loft;
    // (the skin: the ridge runs along the model's y, into the shed; a course of its shingles is 0.66 to 0.70 m: the tile's four rows
    // 2.7 m to a repeat. The left posts stand in indigo water, the right in the terrace's violet: the dyes change places on +x)
    const loft = await kit.model('models/reach/cloth_loft.glb', { at: [T.from, 0, 0], face: 'back', ...WEAR, materials: skin.materials({ dyes: [DYE.INDIGO, DYE.VIOLET], bothBanks: true, ridge: [0, 1, 0], shingle: 2.7, roofTint: '#c4a6a2', edge: LAST.loft }) });
    made.loft = loft; skin.dress(loft);
    // (fifth holder) THE BALE AND THE HUNG LENGTH TAKE A THIRD OF THE LAST LIGHT. The loft's edge (LAST.loft, 1.5) is for its
    // frame, which stands flat against the sun; on a small round thing hanging in front of the gable it made a pale cap of the
    // whole top. The edge's strength is a uniform of the slot's material, which the body shares: each mesh sets its own share
    // as it is drawn (after skin.dress's own hook, which sends the uniforms again).
    {
      const share = (root, k) => root && root.traverse((o) => {
        if (!o.isMesh) return;
        const before = o.onBeforeRender;
        o.onBeforeRender = function (r, sc, cam, geo, m, grp) {
          if (before) before.call(this, r, sc, cam, geo, m, grp);
          const u = m && m.uniforms && m.uniforms.uHsEdge;
          if (u) { if (u.hhBase === undefined) u.hhBase = u.value.x; u.value.x = u.hhBase * k; m.uniformsNeedUpdate = true; }
        };
      });
      const small = [loft.parts.bale, loft.parts.hung0].filter(Boolean);
      loft.group.traverse((o) => { if (o.isMesh && !small.some((p) => { let q = o; while (q) { if (q === p) return true; q = q.parent; } return false; })) share(o, 1); });
      for (const p of small) share(p, 0.3);
    }
    const pt = (name) => { const v = loft.point(name); return { x: v.x, y: v.y, z: v.z }; };
    shared.loft = {
      model: loft,
      rails: [0, 1, 2, 3].map((i) => ({ left: pt(`rail${i}_l`), right: pt(`rail${i}_r`) })),      // the four cloth rails (the ranks at s 242 .. 257 hang from them)
      nests: [pt('nest_a'), pt('nest_b')], hoist: pt('hoist'), doors: [pt('door_l'), pt('door_r')], mouth: [pt('mouth_l'), pt('mouth_r')],
      baleDrip: (target) => loft.point('bale_drip', target),      // under the hanging bale, now (it swings): ask each frame
      // (third holder) the hem of the length thrown over the pole on the gable (0: it rides on a moving part, ask each frame) and
      // (fourth holder: there is one length now) the coil of line on the pole's other end (1); `hoodTip`: the top of the hay hood's pendant, a perch
      gableDrip: (i, target) => loft.point('drip_gable' + (i ? 1 : 0), target),
      hoodTip: pt('hood_tip'),
    };
  }

  // ---- THE CHIMNEY of the far works (kit, plain: never nearer than 200 m; source-art/models/reach/hh_chimney.py). It stands
  // on the ground south of the sun road; its stand-in (kit.js) is taken out below. `shared.chimney.top`: where its plume begins.
  {
    const K = plan.chimney;
    const chimney = await kit.model('models/reach/chimney.glb', { position: [K.at[0], 0.4, K.at[1]], rotation: [0, 0.35, 0], ...WEAR });
    made.chimney = chimney;
    const v = chimney.point('top');
    shared.chimney = { model: chimney, top: { x: v.x, y: v.y, z: v.z } };
  }

  // ---- the first motions (slow, by the realm's clock, so that a picture at &t=4 is the same picture twice): the bale on
  // the loft's hoist swings a hand either way in the evening wind and turns on its fall; the loft's door stands open and
  // stirs on its hinges; the indigo house's loose gablet board swings on its nail; the west front's hook sways. (Blender's z is the ride's y: the door turns about its hinge line; the bale's pivot is the hook.)
  // (third holder) WHAT HANGS FREE ANSWERS THE AREA'S AIR (set.js: shared.wind). The length of cloth thrown over the loft's
  // pole (`hung0`; there were two), the bale, the door, the loose board: each sways with the breeze, and a FRONT (the first breath, the
  // great gust; &gust=1 holds every cloth up) pushes it downwind and holds it there until the wind drops, like the cloth
  // round it. `held` is eased: a gust throws a thing up in a third of a second and lets it fall in a second and a half.
  const calm = ctx.reducedMotion ? 0.5 : 1;
  const frontAt = (p) => { const w = shared.wind; if (!w || !w.frontAt || !p) return 0; const f = w.frontAt(p.x, p.z); return f > 0 ? Math.min(f, 1.2) : 0; };
  const air = { loft: 0, house: 0, front: 0 };
  const where = { loft: kit.at(plan.loft.from, 0), house: kit.at(plan.indigoHouse.at[0], plan.indigoHouse.at[1]), front: kit.at(plan.westFront.s, 0) };
  const ease = (key, dt) => { const f = frontAt(where[key]), v = air[key]; air[key] = v + (f - v) * (1 - Math.exp(-dt / (f > v ? 0.35 : 1.5))); return air[key]; };
  // stand-ins of the houses' pieces that are made in kit.js (it builds after this module): taken out when they appear
  const mine = ['door masts', 'chimney'];
  let looked = 0;
  const update = (dt) => {
    const t = ctx.time, step = Math.min(0.1, Math.max(0, dt || 0.016));
    if (mine.length && looked++ < 300) for (let i = mine.length - 1; i >= 0; i--) if (removeStandIn(ctx, mine[i]) > 0) mine.splice(i, 1);
    const gH = ease('house', step), gF = ease('front', step), gL = ease('loft', step);
    if (made.indigo) {
      const P = made.indigo.parts;
      if (P.loose_board) P.loose_board.rotation.x = 0.13 + calm * (0.06 * Math.sin(t * 1.3) + 0.03 * Math.sin(t * 2.9 + 1) + gH * (0.3 + 0.08 * Math.sin(t * 7.1)));      // the gablet's loose board, on its one nail
    }
    if (made.front && made.front.parts.hook) { const h = made.front.parts.hook; h.rotation.x = calm * (0.03 * Math.sin(t * 1.25 + 0.4) + gF * 0.12); h.rotation.z = calm * 0.02 * Math.sin(t * 1.17); }      // the west front's hook, 17 m up
    if (made.loft) {
      const { bale, door, hung0, hung1 } = made.loft.parts;
      if (bale) { bale.rotation.x = calm * (0.035 * Math.sin(t * 2.05) + 0.012 * Math.sin(t * 0.61 + 1.3) + gL * (0.1 + 0.03 * Math.sin(t * 2.6))); bale.rotation.z = calm * 0.022 * Math.sin(t * 1.93 + 0.8); bale.rotation.y = 0.25 * Math.sin(t * 0.23); }
      if (door) door.rotation.y = -1.86 + calm * (0.07 * Math.sin(t * 0.37) + 0.025 * Math.sin(t * 1.1 + 2) - gL * (0.22 + 0.05 * Math.sin(t * 5.3)));
      // the two lengths over the pole: wet and heavy, a slow swing about the pole's line; +x is downwind (toward the gable)
      if (hung0) hung0.rotation.x = calm * (0.035 + 0.03 * Math.sin(t * 0.83 + 0.6) + 0.014 * Math.sin(t * 2.3 + 2.1) + gL * (0.52 + 0.06 * Math.sin(t * 3.1)));
      if (hung1) hung1.rotation.x = calm * (0.03 + 0.026 * Math.sin(t * 0.91 + 2.4) + 0.016 * Math.sin(t * 2.05 + 0.3) + gL * (0.6 + 0.07 * Math.sin(t * 2.7 + 1.2)));
    }
  };

  void hw;
  return { update };

}
