// The orchard's plan, shared by the two areas that visit it: the orchard in flood (orchard.js, docs/art/orchard.md) and
// the orchard in snow (snow.js, docs/art/snow.md). Both build their trees and their furniture from this one file, so
// that the place is recognisably the same and, in winter, the bare tree above the water and the blossoming tree in its
// reflection register exactly.
//
// PURE DATA AND PURE FUNCTIONS: no three.js, nothing random that is not seeded, the same every time.
// EXTEND IT ONLY BY ADDING. Never change a number that is already here: the other area is built on it.
//
// Coordinates. Everything is in the ORCHARD'S OWN FRAME, the one docs/art/orchard.md is written in:
//   s   metres along the orchard's centre line, counted from the first point of the flood area's path, inside the
//       cloth loft (the loft's door is at s 26; the oldest tree at s 111; the wall at s 216)
//   d   metres to the right of that centre line (north), negative to the left (south)
//   a   the older name for the distance along the avenue from the loft's door: a = s - 26.  x = d.
// How (s, d) becomes a place in an area is that area's business: the flood area's centre line bends 25 degrees right
// between s 172 and s 200 (src/realms/orchard/plan.js maps it); the snow area's is dead straight and offset by 78 m
// (its page: `kit.at(s + 78, d)`).
//
// Moved here from the old test file src/realms/orchard-kit.js (first build): orchardPlan() returns the same 110 trees
// in the same places as it did there.

function rng(seed) { let s = (Math.imul(Math.floor(seed) ^ 0x9e3779b9, 0x85ebca6b) >>> 0) % 2147483646 + 1; const next = () => (s = (s * 48271) % 2147483647) / 2147483647; next(); next(); return next; }

/** The avenue's door (the loft's west door) in orchard s: a = s - DOOR. */
export const DOOR = 26;
/** Ranks stand every 9 m: s = 30.5 + 9k, k = 0..20 (a = 4.5 + 9k). */
export const RANKS = Array.from({ length: 21 }, (_, k) => 30.5 + 9 * k);
/** The rows, by what stands in them. */
export const ROWS = {
  sail: [-28, -19, -10, 10, 19, 28],     // full trees with water between them that a boat can enter (110 trees)
  far: [-46, -37, 37, 46],               // full trees, simplified (apple_far), in standing growth the boat cannot enter (84 trees)
  mote: [-73, -64, -55, 55, 64, 73],     // low models in mist (apple_mote) (126 trees)
  hedge: [-82, 82],                      // a hawthorn hedge in blossom, 3 m tall
};
/** The oldest tree stands on the centre line here, and no tree stands within 24 m of it. */
export const OLDEST = { s: 111, d: 0, clear: 24 };

/**
 * The thirteen trees of the inner rows that carry one long low bough (apple_low_A / apple_low_B), reaching toward the
 * centre line to 4.5 m from it at 3.2 to 3.8 m up, each bough on a crutch. They alternate, so that a boat on the lane
 * always has blossom within the prow lantern's reach on one hand.
 */
export const LOW_BOUGHS = [
  [39.5, -10], [39.5, 10], [57.5, 10], [66.5, -10], [66.5, 10], [84.5, 10],
  [138.5, 10], [147.5, -10], [165.5, -10], [165.5, 10], [183.5, 10], [192.5, -10], [201.5, 10],
];

/**
 * The orchard's plan.
 *   trees   the 110 trees of the six sailable rows, as the first build placed them:
 *           { a, x, variant (0..5: apple_A..apple_F), turn (radians), scale }            <- never change these five
 *           plus, added: s, d (the same place in the page's names), row, rank (k), low ('A' | 'B' | null: carries a
 *           long low bough toward the centre line), lean (radians, up to 3 degrees), leanDir (radians), tint (0..3: one
 *           of four wear tints), wash (metres: the limewash line, 1.8 +/- 0.15)
 *   far     the 84 trees of rows +/-37 and +/-46 (apple_far), the same fields (variant 0..5 picks a turn of one model)
 *   motes   the 126 low trees of rows +/-55, +/-64, +/-73 (apple_mote)
 *   pond, oldest, rows, spacing, ladders, hives, handcart, wall      as the first build returned them (kept for whoever
 *           read them; the flood page has since moved the furniture: use FURNITURE below)
 * Options (the first build's): length (of the avenue from the door, 190), pond ({ a, r }).
 */
export function orchardPlan({ length = 190, pond = { a: 85, r: 23 } } = {}) {
  const rnd = rng(77), trees = [];
  for (const x of [-28, -19, -10, 10, 19, 28]) for (let a = 4.5; a < length - 2; a += 9) {
    if (Math.hypot(a - pond.a, x) < pond.r + 1) continue;
    trees.push({ a: a + (rnd() - 0.5) * 0.8, x: x + (rnd() - 0.5) * 0.8, variant: Math.floor(rnd() * 6), turn: rnd() * Math.PI * 2, scale: 0.92 + rnd() * 0.16 });
  }
  // ---- added (second pass, docs/art/orchard.md): everything below draws from its own random streams, so that the
  // five numbers above stay exactly as they were
  const more = rng(1877);
  const dress = (t, row, a0) => {
    t.s = t.a + DOOR; t.d = t.x; t.row = row; t.rank = Math.round((a0 - 4.5) / 9);
    t.lean = more() * 3 * Math.PI / 180; t.leanDir = more() * Math.PI * 2; t.tint = Math.floor(more() * 4); t.wash = 1.8 + (more() - 0.5) * 0.3;
    return t;
  };
  { let i = 0; for (const x of [-28, -19, -10, 10, 19, 28]) for (let a = 4.5; a < length - 2; a += 9) { if (Math.hypot(a - pond.a, x) < pond.r + 1) continue; dress(trees[i++], x, a); } }
  for (const t of trees) {
    const k = LOW_BOUGHS.findIndex(([s, d]) => Math.abs(s - (30.5 + 9 * t.rank)) < 0.01 && d === t.row);
    t.low = k < 0 ? null : (k % 2 ? 'B' : 'A');
  }
  const rest = rng(2877), far = [], motes = [];
  for (const [list, rows, jit] of [[far, ROWS.far, 0.9], [motes, ROWS.mote, 1.6]]) for (const x of rows) for (let a = 4.5; a < length - 2; a += 9) {
    list.push(dress({ a: a + (rest() - 0.5) * jit, x: x + (rest() - 0.5) * jit, variant: Math.floor(rest() * 6), turn: rest() * Math.PI * 2, scale: 0.9 + rest() * 0.2 }, x, a));
  }
  return {
    trees, far, motes, pond, oldest: { a: pond.a, x: 0 }, rows: [-28, -19, -10, 10, 19, 28], spacing: 9,
    // (the first build's furniture, superseded by FURNITURE: kept only so that nothing that read it breaks)
    ladders: [{ a: 20, x: -10 }, { a: 50, x: 10 }, { a: 150, x: 10, sunk: true }], hives: { a: 130, x: 12 }, handcart: { a: 60, x: -11 }, wall: { a: 190, gap: 17 },
  };
}

/**
 * The oldest tree, as docs/art/orchard.md section 3 gives it. Heights are metres above the water; a limb's height is
 * the height of its UNDERSIDE. Every point is [s, d, y].
 */
export const OLDEST_TREE = {
  at: [111, 0], height: 33, crown: 58,                        // 33 m tall, crown 58 m across, highest at s 114
  bole: { thick: 4.4, roots: 7.2, fork: 5.5, wash: 1.8, band: 4.3,                 // limewashed to 1.8 m; the iron tie-band at 4.3 m
    hollow: { face: 'east', width: 1.1, from: 1.0, to: 4.2, depth: 1.5 } },        // on the axis, facing the arriving boat
  islet: { across: 13, height: 0.5, collide: 7.8 },
  // seven primary limbs, 1.1 to 1.5 m thick where they leave the bole; three of them matter to the route
  lampLimb: {                                                  // east, toward the rider; then north and down into the water
    thick: 1.3,
    line: [[109, -0.4, 4.6], [104, -1, 3.6], [99, -1, 3.2], [96, -1, 3.2], [93, 1.2, 2.2], [91, 2.8, 1.0], [89, 4, 0.0], [88.2, 4.4, 0.5], [87.5, 4.8, 1.3]],
    hook: [96, -1, 3.2],                                       // the wrought S-hook; 0.8 m of chain; the flame 2.2 m above the water
    colliders: [[93, 1.2, 0.9], [91, 2.8, 0.9], [89.3, 3.9, 0.9]],
  },
  arch: {                                                      // south; the composed line passes under it where it is 4.1 m up
    thick: 1.4,
    line: [[111, -2, 6.0], [111.5, -8, 5.0], [112.5, -14, 4.2], [113.3, -19, 3.4], [113.8, -22.5, 2.6], [114, -25.5, 0.0]],
    daughter: { at: [114, -25.5], height: 5 },                 // where it rooted: a stem 5 m tall, in blossom, limewashed
    colliders: [[113.9, -23.5, 0.9], [114, -25.5, 0.9]],
  },
  westLimb: { thick: 1.2, line: [[113, 0.3, 6.5], [120, 1, 6.8], [127, 1.6, 7.2], [133, 2, 7.5]] },     // level over the mouth of the second avenue
  // four upper limbs rise at 40 to 60 degrees to carry the dome, reaching 20 to 27 m out, tops 24 to 33 m up: [azimuth
  // degrees from west toward north, reach, top]. (Their exact place is the modeller's; these are the stand-ins'.)
  upperLimbs: [[35, 24, 31], [125, 27, 26], [215, 22, 28], [300, 25, 30]],
  // nine forked timber props standing in the water under the low limbs: [s, d, metres showing]
  props: [[100, -1, 3.2], [92.3, 1.8, 1.9], [112.2, -11, 4.6], [113.5, -20.5, 3.1], [108, 13, 6.0], [101, 9, 5.2], [121, -9, 5.6], [119, 11, 5.8], [125, 3, 6.0]],
  propCollide: 0.4,
  poleLadder: { foot: [106.2, 2.5, 0.4], length: 7 },         // from the islet up to the lamp limb; a basket on its top rung
  crown: { lobes: 110, tiers: 7, base: [5, 7], lobeSize: [2, 7], top: [114, 0, 33], windows: 2 },      // a cumulus with a level base, fullest on the east face
  roosts: [[108, 4, 15], [115, -6, 20]],                       // the two egrets that roost in it
};

/**
 * What was left for the night, the hives, the plank walk, the wall and the loft, as docs/art/orchard.md gives them
 * (all [s, d] or [s, d, y]; the orchard in snow finds the same things under snow in the same places).
 */
export const FURNITURE = {
  ladders: [
    { tree: [48.5, -10], foot: [47.3, -8.9], length: 4, basketRung: 9 },
    { tree: [75.5, 10], foot: [76.6, 8.9], length: 4, basketRung: 9 },
  ],
  fallenLadder: { tree: [174.5, 10], from: [175.5, 9.5], to: [177, 6.5], topOut: 0.5 },      // lying in the water, its top end 0.5 m out of it
  crate: [58, 3],                                              // afloat
  sunkBasket: [78, 7],
  handcart: { at: [86.5, -11.8], tree: [84.5, -10], shaftsOut: 1.6 },      // tipped on its shafts
  hives: { at: [152, 13.5], length: 4.2, deck: 0.5, count: 6 },            // six white box hives on a trestle platform, facing the channel
  plankWalk: { d: 14.5, from: 154.5, to: 214, deck: 0.35, missing: [[170, 176], [190, 193]], afloat: [172, 11] },    // it ends at a stone step-stile in the wall
  wall: { s: 216, showing: 1.2, gap: [-8.5, 8.5], pier: { thick: 0.7, showing: 2.5 }, gate: { width: 2.2, showing: 1.4, on: 'left' }, stile: [216, 14.5], fallen: [212, 220] },
  loft: { from: 0, door: 26, water: 16, posts: 9.6, postEvery: [1, 6, 11, 16, 21], tie: 9, ridge: 13, doorHeight: 9, bolts: [3.5, 8.5, 13.5, 18.5, 23.5], boltWidth: 2.4, clearCentre: 5 },
};
