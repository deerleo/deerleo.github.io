// The town below: kit pieces, multitudes and the close band. This was stage 1's module of STAND-INS; every piece of it
// is real now, in kit_houses.js (the town itself and its windows), kit_street.js (street, square, lamps, cloth, trees,
// stalls, skiffs, the vista, the small things on the walk) and kit_roofs.js (the roofs at the waterline). What is left
// here is what stage 1 handed on in `shared` and that others read: the cormorants' perches, the skiffs' places, the lamp
// domes, the poplars' colliders and places. Use light.mat() (or kit.model(url, { extend: light.extend })) for anything new.
import { ensureLight } from './light.js';
import { frameAt } from './standins.js';

export async function build(ctx, plan, shared) {
  const { kit } = ctx;
  const light = ensureLight(ctx, plan, shared), town = light.town, P = plan.local, F = plan.floorAt;
  const rnd = ctx.rng(4242);

  // ---------------------------------------------------------------------------------------------- the town under the water
  // (house_a .. house_h, back_house_1 .. _4, mansard_1 .. _5, upper_house_1 .. _4 and the multitude "windows" are real:
  // kit_houses.js. Their stand-ins are gone.)

  // (stack_1 .. _7 and their pots, the pots of the houses under the keel, the dovecote and the arrow vane are real: kit_roofs.js)
  shared.perches = town.stacks.filter((s) => s.perch).map((s) => { const q = town.sd(s.x, s.z); return { x: s.x, y: s.y1 + 0.65, z: s.z, s: q.s, d: q.d }; });      // the cast's cormorants stand here (and on the church ridge end); s, d: the stack's own place
  // (dormers are real: instanced parts of the houses, kit_houses.js)
  // (gable_1 .. _4, the cross wings with their half-lit attic windows, are real: kit_roofs.js. The one at s 58 is THE half-lit gable.)
  // (the edge marks, fourteen weed-hung copings awash, are real: kit_street.js)

  // ---------------------------------------------------------------------------------------------- the street
  // (the raised walk, leat_and_quay, the footbridge, the basin, square_paving and the street of steps are real: kit_street.js)
  // The skiffs (skiff_1, _2: real, kit_street.js) hang where stage 1 hung them; their places are left here for whoever wants
  // them without the models (each { at, ring }; kit_street.js works out the same places and publishes shared.kitSkiffs).
  { const B = plan.street.basin, mid = frameAt(town, (B.s0 + B.s1) / 2, (B.d0 + B.d1) / 2), fl = F(138);
    shared.skiffs = [];
    for (let i = 0; i < plan.street.skiffs; i++) {
      const ls = -6.5 + i * 2.1 + (rnd() - 0.5), ld = -4.5 + ((i * 5) % 7) * 1.5, y = -3 - (i % 4) * 0.95, at = mid.at(ls, y, ld), ring = mid.at(ls + 3 + rnd() * 2, fl + 1.0, ld + (rnd() - 0.5) * 2);
      shared.skiffs.push({ at, ring });
    } }
  // (the multitude "cloth pieces": ten lines of washing, twenty-four curtains and the stalls' awnings are real: kit_street.js)
  // (the multitude "weed ribbons" from the pots of the deeper roofs is real: kit_roofs.js)
  // (the weed fringes on eaves and copings are real: kit_street.js)

  // ---------------------------------------------------------------------------------------------- lamps
  // (lamp_standard_1, _2, harp_lamp and lamp_steps are real: kit_street.js, sixty standards. The lamp domes stay here.)
  {
    // the lamp domes: the five heads that burn 0.4 m under the surface (three in the row, two at the steps) each carry a
    // dome of rose-gold light 3 m across under the water
    const domes = town.lamps.filter((l) => l.kind === 'row' && l.y > -1).map((l) => ({ x: l.x, y: l.y, z: l.z, size: 3.0, color: '#F3A77E' }));
    shared.lampDomes = { list: domes, glows: kit.glows(domes, { intensity: 0.7, flicker: 0.04, underwater: true }) };
  }

  // ---------------------------------------------------------------------------------------------- the square
  // (stall_1 .. _3, twelve in the square and twenty-four in the market hall, lime_tree and the street of steps are real: kit_street.js)

  // ---------------------------------------------------------------------------------------------- the poplar road
  // (poplar_tip_1 .. _3 and their leaves are real: kit_street.js.) Here: each tree's collider, and shared.poplars for the cast
  // (x, z; y: where the crown begins; sx, sz: its width; sy: its height; tip: how far its tip stands clear of the water).
  { const Pp = plan.poplars, trees = [];
    for (let i = 0; i < Pp.count; i++) for (const side of [-1, 1]) {
      const s = Pp.s0 + i * Pp.step, d = side * Pp.d, tip = Pp.clear[0] + ((i * 5 + (side > 0 ? 2 : 0)) % 7) * 0.5, floor = Math.min(F(s), -15), [x, z] = town.xz(s, d);
      const crownFrom = floor + (tip - floor) * 0.18, hgt = tip - crownFrom, rad = hgt * 0.085 + 0.25;
      trees.push({ x, z, y: crownFrom, sx: rad * 2, sy: hgt, sz: rad * 2, tip });
      ctx.addCollider({ x, z, r: 1.15 });
    }
    shared.poplars = trees;
  }

  // ---------------------------------------------------------------------------------------------- the vista
  // (viaduct_arch, seventeen bays, and theatre_bulk are real: kit_street.js)

  // ---------------------------------------------------------------------------------------------- small things a rider finds when he stops
  // (roof_ladder, the propped skylight, balcony_rail and the eaves gutter of the right bank are real: kit_roofs.js)
  // (the multitude "waterline tiles and slates" is real: every tile and slate of the roofs awash, in kit_roofs.js)

  return {};
}
