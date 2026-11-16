// The orchard in snow: the area's numbers, taken from docs/art/snow.md. Plain data and small functions; no three.js.
// Every module reads this file, so that a thing is where the page says in all of them. ADD to it under a heading of
// your own; change a number that is here only when the page says it is wrong, and say so in your log.
//
// ---------------------------------------------------------------------------------------------------------------------
// WHERE A THING IS. Read this before you place anything.
//
// THE PAGE'S FRAME (s, d, y): what docs/art/snow.md is written in, and what every number in this file is in.
//     s   metres along the route's REFERENCE centre line from the area's own start, inside the sea cave
//     d   metres to the right of that line (north); negative = left (south).   y   metres above the water
//   From s 58 the reference line is dead straight and is the orchard's own centre line:
//           this s = the flood orchard's s + 78 (SHIFT), with the same d
//   and there the realm's own coordinates are simply  x = d,  z = -s.  Before s 58 (the cave and the birch river) the line
//   bends, and the page's (s, d) are the engine path's own (kit.at).
//
//     shared.frame.at(s, d, y)  -> THREE.Vector3   USE THIS for everything (set.js makes it): kit.at before s 58,
//                                                   (d, y, -s) from s 58 on
//     plan.xz(s, d) -> [x, z]                       the same as numbers, for s >= 58 only (no path needed)
//
// THE ENGINE'S PATH (kit.at, ctx.s, `&s=`, stage cues) is the COMPOSED LINE: where the current carries a boat left alone.
// It is the reference line to s 58, stands a metre to its right across the plain and down the first avenue, crosses it
// at s 148 to pass the kept lamp 3.6 m to the lamp's left (s 174), and goes round the south side of the islet under the
// arch (to s 214), which is about 9 m longer (LINE below says why). So from s 58 on, kit.at(s, d) is NOT the page's
// (s, d), and from s 178 the path's arc length runs ahead of the page's s (table PATH_S below; shared.frame.pathS(s)
// and shared.frame.toPath(s, d) turn one into the other for cues and for a picture's address).
// ---------------------------------------------------------------------------------------------------------------------
import { orchardPlan, OLDEST_TREE, FURNITURE, LOW_BOUGHS, RANKS, ROWS, OLDEST } from '../orchard-plan.js';

const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const steps = (table, s) => {                                    // a table of [s, value], eased between its rows
  if (s <= table[0][0]) return table[0][1];
  for (let i = 0; i < table.length - 1; i++) { const [s0, v0] = table[i], [s1, v1] = table[i + 1]; if (s <= s1) return v0 + (v1 - v0) * smooth(s0, s1, s); }
  return table[table.length - 1][1];
};

/** This area's s = the flood orchard's s + SHIFT (same d). */
export const SHIFT = 78;
/** From here on the reference line is straight: x = d, z = -s. */
export const STRAIGHT = 58;
/** The page's length of route (the reference line); the engine's path, with its detour round the islet, is about 273 m. */
export const LENGTH = 264;

/** The page's (s, d) as the realm's own [x, z], for s >= 58. (Before that the river bends: shared.frame.at.) */
export function xz(s, d = 0) { return [d, -s]; }
/** The page's (s, d, y) as [x, y, z], for s >= 58. */
export function at(s, d = 0, y = 0) { return [d, y, -s]; }
/** The realm's own (x, z) as the page's { s, d }, for places beyond the birch river (z <= -58). */
export function locate(x, z, out = {}) { out.s = -z; out.d = x; return out; }

// ---- the reference centre line before s 58 (the cave and the birch river), as x at a world z. One easy S-bend in the
// river (5 m to the left at its widest, between the cave's mouth and the plain), and one bend in the cave.
// (the river comes out on to the plain a metre to the right of the orchard's centre line, where the composed line then runs: `out`)
const RIVER = { from: -58, to: -18, swing: 5, out: 1 }, CAVE_LINE = { from: -18, bend: 2.5, over: 16.3 };
export function centreX(z) {
  if (z <= RIVER.from) return RIVER.out;
  if (z <= RIVER.to) { const u = (z - RIVER.from) / (RIVER.to - RIVER.from), q = Math.sin(Math.PI * u); return -RIVER.swing * q * q + RIVER.out * (1 - smooth(0, 0.5, u)); }
  const v = (z - CAVE_LINE.from) / CAVE_LINE.over; return CAVE_LINE.bend * v * v;
}

// ---- the composed line (page section 3): [s, d]. The current carries a boat left alone along it; it is the path.
// NOT THE PAGE'S, in two ways, both for the one light of the area (1-layout.md has the pictures):
//   s 70 to 138: a metre to the RIGHT of the orchard's centre line. The kept lamp hangs a metre left of that line, and
//     a boat on the line itself has the lamp's reflection, and its stroke, exactly behind the stem of its own prow
//     lantern from the plain to the pond. From a metre to the right the amber stroke stands clear, just left of the crook.
//   s 138 to 182: the page brings the line past the lamp a metre to its left ((173, -2), (178, -5)), as in the flood
//     orchard, where the lamp burns in the air. Here the lamp that burns is in the water, and a reflection lies a third
//     of the way from the eye to the thing: from a metre off its line the lit lamp is under the rider's own bow from
//     16 m out until it is astern, and the picture the page asks for ("exactly under it in the water the same lantern
//     burning") is never seen by a rider left to the current. The line passes 3.6 m to the lamp's left: the cold lamp
//     and the lit one then stand together to the right of the bow all the way in.
export const LINE = [[58, 1], [138, 1], [148, 0.2], [156, -1.4], [164, -3.1], [170, -4.1], [174, -4.6], [178, -6.3], [182, -10], [189, -15], [196, -13.5], [206, -6], [214, 0]];
/** The composed line's d at the page's s (straight between its points; 0 outside them). */
export function lineD(s) {
  if (s <= LINE[0][0]) return LINE[0][1];
  if (s >= LINE[LINE.length - 1][0]) return 0;
  for (let i = 0; i < LINE.length - 1; i++) { const [s0, d0] = LINE[i], [s1, d1] = LINE[i + 1]; if (s <= s1) return d0 + (d1 - d0) * (s - s0) / (s1 - s0); }
  return 0;
}

// ---- the pond under the oldest tree (page: 46 m across, the tree on its islet at s 189). Its outer 3 m is skin ice.
// NOT THE PAGE'S: one small bay in its south rim. The page has the arch go into the water at (192, -25.5), which is
// 2.7 m outside a pond 46 m across: the rim is let out round the arch's foot and its daughter stem.
export const POND = { at: [189, 0], r: 23, ice: 3, bays: [{ at: [192.3, -23.3], r: 4.6 }] };

// ---- THE WATER'S EDGE: the shelf (0.15 to 0.3 m of ice standing above the water), which stops the hull.
// Before s 58: the river's banks and the cave's walls, HALF(s) either side of the path. From s 58: the page's frame,
// d from -shelfLeft(s) to +shelfRight(s). The pond and its bay are let into both.
const BAND = [[0, 8], [24, 8], [30, 10], [58, 10], [64, 12], [100, 12], [104, 13], [222, 13], [232, 9], [400, 9]];
/** Half width of the navigable water, without the pond: about the path before s 58, about the reference line from s 64 (and between them about `mid`). */
export function band(s) { return steps(BAND, s); }
/** The middle of that water, as d: the river's mouth stands a metre right of the reference line (RIVER.out) and the shelf takes six metres to come back to it. */
export function mid(s) { return s >= 64 ? 0 : RIVER.out * (1 - smooth(58, 64, s)); }
const chord = (c, r, s) => { const k = r * r - (s - c[0]) * (s - c[0]); return k > 0 ? Math.sqrt(k) : -1; };
/** How far the water reaches to the left (south) of the reference line at the page's s (a positive number). */
export function shelfLeft(s) {
  let w = band(s) - mid(s); const c = chord(POND.at, POND.r, s); if (c > 0) w = Math.max(w, c - POND.at[1]);
  for (const b of POND.bays) { const k = chord(b.at, b.r, s); if (k > 0 && b.at[1] < 0) w = Math.max(w, k - b.at[1]); }
  return w;
}
/** How far the water reaches to the right (north). */
export function shelfRight(s) {
  let w = band(s) + mid(s); const c = chord(POND.at, POND.r, s); if (c > 0) w = Math.max(w, c + POND.at[1]);
  for (const b of POND.bays) { const k = chord(b.at, b.r, s); if (k > 0 && b.at[1] > 0) w = Math.max(w, k + b.at[1]); }
  return w;
}
/**
 * Metres from a place to the shelf, measured into the water (positive = on the water, negative = on the ice), for
 * places beyond the birch river (page s >= 58). The boat's own leash (snow.js) and anything that floats use it.
 */
export function waterRoom(s, d) {
  let room = band(s) - Math.abs(d - mid(s));
  room = Math.max(room, POND.r - Math.hypot(s - POND.at[0], d - POND.at[1]));
  for (const b of POND.bays) room = Math.max(room, b.r - Math.hypot(s - b.at[0], d - b.at[1]));
  return room;
}

// ---- OPEN WATER and SKIN ICE (page sections 3 and 7). The skin lies wall to wall; the realm keeps the black road open.
// Half width of water that is ALWAYS open about the reference line: all of the river; 9 m of the road with 3 m of
// skin each side; nothing in the bay (s 95 to 116: the boat breaks its own road); 9 m down the avenues, with skin in
// among the inner trunks; all of the thaw, where the margins have broken up.
const OPEN = [[0, 8], [24, 8], [30, 10], [56, 10], [64, 9], [99.5, 9], [103.5, 0], [114.5, 0], [119, 9], [222, 9], [232, 9.6], [400, 9.6]];
export function openHalf(s) { return steps(OPEN, s); }
// The bay is the page's: s 102 to 116. (The first layout began it at s 95, so that the page's postcard of the gate could
// be had with the bow already in the ice. But a reflection lies a third of the way from the eye to the thing: from the
// plain's first image, s 58 to 66, the kept lamp's reflection falls at s 97 to 102, and a bay that begins at 95 lays
// ice over the one amber point of "the black road". The gate's postcard is taken from s 96, with the bow still in
// black water and the white bay ahead: see postcards.json.)
export const BAY = { from: 102, to: 116 };
/** The pond's open disc (inside its ring of skin ice). */
export const POND_OPEN = { at: POND.at, r: POND.r - POND.ice };

// ---- the engine's waterway: control points [x, z, halfWidth] along the composed line, every 6 to 8 m (evenly, so
// that the path's arc length is true). The engine's half width is measured from the composed line and its walls are
// the river's banks, the cave's walls and the shelf wherever the line is the reference line; in the pond, where the
// line leaves it, the engine's wall is let out beyond the rim and the rim itself is kept by the leash in snow.js.
const START_Z = -2.09;                                         // tuned so that the path's arc length is 58 at z = -58 (set.js checks it)
function controlPoints() {
  const pts = [];
  const p = (x, z, hw) => pts.push([+x.toFixed(3), +z.toFixed(3), hw]);
  for (const z of [START_Z, -7, -12.5, -18, -23, -28, -33, -38, -43, -48, -53]) p(centreX(z), z, z > -24 ? 8 : z > -30 ? 9 : 10);
  p(lineD(58), -58, 10); p(lineD(64), -64, 13.3);
  for (let s = 72; s <= 100; s += 7) p(lineD(s), -s, 13.3);                                              // (the line stands a metre off the centre: the wall is let out by as much, and the leash keeps the true edge)
  p(lineD(104), -104, 14.3);
  for (let s = 112; s <= 152; s += 8) p(lineD(s), -s, +(13.3 + Math.abs(lineD(s))).toFixed(2));
  p(lineD(160), -160, 18); p(lineD(166), -166, 26);
  p(lineD(172), -172, 36); p(-6.3, -178, 40); p(-10, -182, 42); p(-15, -189, 44); p(-13.5, -196, 44); p(-6, -206, 40); p(0, -214, 36);
  p(0, -220, 26); p(0, -226, 14); p(0, -232, 9); p(0, -240, 9); p(0, -248, 9); p(0, -256, 9); p(0, -264, 9);
  return pts;
}
export const PATH = {
  points: controlPoints(),
  softEdges: false,                                            // the shelf is a wall: it stops the hull with a knock (page section 3)
};
/** The path's arc length where the composed line reaches the page's s, measured on the built path (set.js checks it at load). */
export const PATH_S = [[0, 0], [58, 58], [104, 104.1], [140, 140.2], [166, 166.6], [173, 173.7], [178, 179.0], [182, 184.5], [189, 193.2], [196, 200.4], [206, 213.0], [214, 223.0], [224, 233.1], [238, 247.1], [264, 273.2]];

// ---- the current (page sections 2, 3 and 6): m/s by the page's s, eased between the stretches.
// NOT THE PAGE'S in one place: its look block gives 3.0 for narrow water, and by the engine's rule the birch river
// (20 m wide) is narrow. At 3 m/s the river, the owl and the bridge are over in eleven seconds; the river runs at 2.
export const CURRENT = [[0, 3.0], [20, 3.0], [32, 2.0], [152, 2.0], [164, 0.9], [206, 0.9], [216, 2.0], [224, 2.0], [240, 3.5], [400, 3.5]];
export function currentAt(s) { return steps(CURRENT, s); }

// ---- the trees, placed (the shared plan, src/realms/orchard-plan.js, shifted by 78 m; nothing bends here).
// Each: the shared plan's fields (variant, turn, scale, lean, leanDir, tint, wash, row, rank, low) with s and d in THIS
// area's frame, x and z in the realm, and
//   lost     the first pair of the colonnade, (108.5, +/-10): two stumps in winter, whole trees in the water
//   memory   carries blossom in the water: every tree within 40 m of the road
function placeTrees() {
  const plan = orchardPlan();
  const put = (list, kind) => list.map((t) => {
    const s = t.s + SHIFT, d = t.d;
    return { ...t, kind, s, d, x: d, z: -s, lost: kind === 'sail' && t.rank === 0 && Math.abs(t.row) === 10, memory: Math.abs(t.row) <= 37 };
  });
  return { trees: put(plan.trees, 'sail'), far: put(plan.far, 'far'), motes: put(plan.motes, 'mote') };
}
export const TREES = placeTrees();
/** The ranks' s in this area's frame (108.5, 117.5, ... 288.5: the last three stand beyond the path's end, in the mist). */
export const RANK_S = RANKS.map((s) => s + SHIFT);
/** The thirteen long low boughs, in this area's frame: [s, d]. Four of them let their snow slide (page cast 13). */
export const LOW = LOW_BOUGHS.map(([s, d]) => [s + SHIFT, d]);
export const SLIDES = [[117.5, -10], [135.5, 10], [144.5, -10], [162.5, 10]];
/** The hedge: bare, laid, 3 m tall, at d -82 and +82, from the first rank on into the mist. */
export const HEDGE = { height: 3, piece: 6, d: 82, from: 100, to: 300 };

// ---- the oldest tree and what was left for the night, in THIS area's frame (the shared plan's, shifted)
const sh = (p) => [p[0] + SHIFT, ...p.slice(1)];
const T0 = OLDEST_TREE;
export const TREE = {
  at: sh(T0.at), height: T0.height, crown: T0.crown, bole: T0.bole, islet: T0.islet,
  lampLimb: { thick: T0.lampLimb.thick, line: T0.lampLimb.line.map(sh), hook: sh(T0.lampLimb.hook), colliders: T0.lampLimb.colliders.map(sh) },
  arch: { thick: T0.arch.thick, line: T0.arch.line.map(sh), daughter: { at: sh(T0.arch.daughter.at), height: T0.arch.daughter.height }, colliders: T0.arch.colliders.map(sh) },
  westLimb: { thick: T0.westLimb.thick, line: T0.westLimb.line.map(sh) },
  upperLimbs: T0.upperLimbs, props: T0.props.map(sh), propCollide: T0.propCollide,
  poleLadder: { foot: sh(T0.poleLadder.foot), length: T0.poleLadder.length },
  crownMemory: { ...T0.crown, top: sh(T0.crown.top) },                 // the blossom it carries in the water (the orchard's 110 lobes)
  roosts: T0.roosts.map(sh),                                           // the two egrets in the reflected crown (page cast 17)
  loads: 44,                                                           // loads of snow on it, 2 to 9 m long (oldest_snow)
  apples: 70, waxwings: 60,                                            // the last apples at 10 to 28 m, and the birds on them
  keel: [182.6, -1.5], footprints: 14,                                 // the keel mark in the islet's ice rim; one line of footprints to the bole and back
};
export const LEFT = {
  ladders: FURNITURE.ladders.map((l) => ({ tree: sh(l.tree), foot: sh(l.foot), length: l.length, basketRung: l.basketRung })),      // in the trees at (126.5, -10) and (153.5, +10)
  crate: [136, 10],                                                    // frozen into the skin ice (in spring it floated at (136, 3))
  handcart: { at: sh(FURNITURE.handcart.at), tree: sh(FURNITURE.handcart.tree), shaftsOut: FURNITURE.handcart.shaftsOut },     // (164.5, -11.8), drifted to its rim
  hives: { at: sh(FURNITURE.hives.at), length: FURNITURE.hives.length, deck: FURNITURE.hives.deck, count: FURNITURE.hives.count },     // (230, +13.5)
  plankWalk: { d: FURNITURE.plankWalk.d, from: FURNITURE.plankWalk.from + SHIFT, to: 300, deck: FURNITURE.plankWalk.deck },         // from s 232.5 along d +14.5, on into the mist
};
/** The kept lamp: the same hook on the same limb. Cold above the water, alight in it. D5, heard as if from under water. */
export const LAMP = { hook: [174, -1, 3.2], chain: 0.8, flame: [174, -1, 2.2], note: 74, lowpass: 500, reach: 14, moths: 4, near: 8, stroke: 13 };      // stroke: metres of light standing over the lit lamp in the mirror (heroes.js): its stroke down the water

// ---- what only this area has (page sections 3 and 9), in the page's frame
export const CAVE = { to: 26, water: 16, roof: [9, 12], bend: 12, seep: 8, snowFrom: 18, grey: 8, white: 16 };
export const CLIFF = { s: 26, wide: 70, high: 34, mouth: { wide: 16, high: 9 }, icefalls: [[-19, 20], [9.5, 12], [24, 6]], icicles: 60 };     // icefalls: [d, metres long]
export const BIRCHES = { from: 26, to: 60, back: [12, 71], count: 220, tall: [16, 26], thick: [0.2, 0.45], crownFrom: 9, nests: 7, sprays: 1300 };
export const BANK = { from: 26, to: 60, top: 11, high: [1, 2.5], cornice: [0.3, 0.5], earth: '#221C2C' };
export const BRIDGE = { s: 46, span: 22, trestles: 11, deck: 3.9, clear: 3.5, wide: 1.4, rail: 1, icicles: 30, snow: { rail: 0.2, deck: 0.15 } };
export const OWL = { perch: [40, -10, 5.5], go: 32, path: [[40, -10, 5.5], [43, -3, 2.8], [46, -1, 2.4], [60, 16, 9]], speed: 5.5 };      // (the cast's; the broken birch it sits on is the kit's)
export const FENCE = { from: [62, -14], to: [150, -150], posts: 58, apart: 2.7, showing: 0.6, strainerEvery: 8 };
export const POLLARDS = { from: [70, -60], to: [124, -146], count: 12, trunk: 2.5, thick: 0.7, whips: [2, 3] };
export const DEER = { d: -170, count: 9, leaderAt: 104, whenBoatAt: 56, speed: 1.2, gaps: [3, 9] };                                   // (the cast's)
export const OUTLIER = {                                       // one tree outside the grid: an old apple tree tipped toward the road
  foot: [85, 12.5], long: 11, tip: 60, mound: 1.2, crutch: [84.2, 8],
  bough: { s: 84, from: 10.5, to: -2, y: 3.0, thick: 0.22, spring: 0.45 },      // level, 3.0 m over the centre line; springs up 0.45 m at the tip when its snow slides
  apples: [-1, 0.3, 1.4], crownApples: 6, waxwings: 5,
};
export const STUMPS = { at: [[108.5, -10], [108.5, 10]], across: 0.45, tall: 0.5, logs: { at: [106, -14], size: [2.4, 1.0, 0.9] }, sawhorse: [105.2, -12.6] };
export const VEILS = { count: 6, near: 240, far: 520, wide: [300, 500], tall: 220, drift: 0.5 };            // curtains of far snowfall, 40 to 140 degrees to the left and to the right
export const FAR_SHORE = { radius: 480, tall: 26, about: [140, 0] };                                         // a painted ring
export const ICE_FOG = { from: 60, deep: [0.2, 0.9] };
export const PANS = { road: 60, thaw: 12, across: [0.8, 2.5] };

// ---- colliders, in the realm's own coordinates: { x, z, r, flow }. Trunks and props 0.4 m, limbs that enter the
// water 0.9 m, as in the flood orchard. `flow`: a thing that stands alone in the water, round which a drifting boat
// is carried (snow.js); rows of posts are not. (The banks, the cave and the shelf are not here: they are the water's edge.)
export function colliders() {
  const list = [];
  const add = (s, d, r, flow = true) => list.push({ x: d, z: -s, r, flow });
  for (const t of TREES.trees) if (!t.lost && waterRoom(t.s, t.d) > -0.6) add(t.s, t.d, 0.4);          // trunks standing in sailable skin ice
  add(TREE.at[0], TREE.at[1], TREE.islet.collide);
  for (const [s, d, r] of TREE.lampLimb.colliders) add(s, d, r);
  for (const [s, d, r] of TREE.arch.colliders) add(s, d, r);
  for (const [s, d] of TREE.props) add(s, d, TREE.propCollide);
  for (const [s, d] of LOW) if (s < 290) add(s, d + (d > 0 ? -4.6 : 4.6), 0.4);                         // the crutch under each long low bough
  for (const l of LEFT.ladders) add(l.foot[0], l.foot[1], 0.45);
  add(LEFT.handcart.at[0], LEFT.handcart.at[1], 1.1);
  add(LEFT.crate[0], LEFT.crate[1], 0.6);
  add(OUTLIER.crutch[0], OUTLIER.crutch[1], 0.4);
  for (const [s, d] of STUMPS.at) add(s, d, 0.5);
  return list;
}

// ---- light (page section 2). Three states by where the boat is, and the cave before them. `look` keys as the engine
// names them; what is common to all states is in LOOK below. Colours here are the page's chips: what the rider is to
// SEE. light.js turns them into what must be drawn (shared.seen), because the ride's last pass shifts them.
export const LIGHT = {
  veil: '#11111a',
  // the stretches (page s): the cave to 22, then out into white by 32; the birch river to 56; the plain from 68; the thaw from 228 to 246
  cave: { until: 22, by: 32, deepUntil: 9, deepBy: 21 }, birch: { until: 56, by: 65 }, thaw: { from: 228, to: 246 },      // (deepUntil, deepBy: 2-light.md, the cave's own dark air, eased to the river's by the mouth)      // (the page clears the air by s 68; its own postcard of the cleared plain is at s 64)
  states: {
    birch: { flakes: 20000, fog: { color: '#D6D1E0', density: 0.011 }, sky: { top: '#A39EC0', mid: '#C2BDD6', horizon: '#DDD7E2', below: '#E6E0E6' } },
    plain: { flakes: 12000, fog: { color: '#DFDBE8', density: 0.0042 }, sky: { top: '#A9A5C4', mid: '#C6C1D9', horizon: '#E4DEE6', below: '#E9E3E8' } },
    thaw: { flakes: 3000, fog: { color: '#DADDEE', density: 0.004 }, sky: { top: '#9DA6CC', mid: '#C2C8E2', horizon: '#E0E3F0', below: '#E4E6F0' } },
  },
  background: '#D9D4E2',
  skyMidAt: 0.5,                                               // where the sky's middle stop stands, 0..1 of the way to the zenith (45 degrees: NOT the engine's usual 25; see 1-layout.md)
  // the remembered evening, which only the water shows (the orchard's blue hour in this area's own violet ink)
  // (2-light.md, fourth holder: mid and low a step toward aubergine, from #1F203C and #2B2A44. The director: "water that stays deep aubergine all round". Sampled, the open road was a blue ink, #1D1B2F.)
  memory: { sky: { top: '#141126', mid: '#231D3B', low: '#2F2847', band: '#5A4674', bars: 5 }, fog: '#2C2644' },      // (low: added, and mid greyed from the page's #1B2247, which makes a navy road. The page's band, if it were more than a hair high, would be the colour of the whole road)
};

// ---- the chips (page section 2), as they are to be seen
export const CHIP = {
  paper: '#F3ECE8', frost: '#D6DDEF', lavender: '#B4AED0', wash: '#7A7194', washFar: '#A49EBE', ink: '#14111E', apple: '#A8242A', blossom: '#E3A8B0', lamp: '#FFB45E', lampCore: '#FFE2A8',
  pearl: '#E4DEE6', bark: '#3A3142', barkPaint: '#2A2331', inkPaint: '#19141F', limewash: '#DAD3D2', birch: '#EDE7E6', firefly: '#D6EE8C', blossomLit: '#F4E6E3', blossomShade: '#8E8AA8', buff: '#A9958F', tail: '#D9B24C',
  timber: '#5d5058', basalt: '#17142A', earth: '#221C2C', globe: '#FFD79A',
};

// ---- the water (page section 7), as the page gives it. set.js lays the realm's look over it.
export const WATER = {
  // (2-light.md: streak 1.6 -> 0.35 and rain 0.16 -> 0.05. The water softens its mirror upward and downward by the
  // roughness the pin rings stand for, times streak squared: at the page's figures everything in the water was drawn
  // out twenty-five pixels, and the blossom was a pink fog. The lamp's stroke is the area's own now and needs no streak.
  // reflectFloor 0.55 -> 0.68: looking down beside the hull the water gave back three quarters of what stood over it,
  // and the blossom there, the lie at arm's length, was a quarter darker than the same blossom seen far off.)
  deep: '#0A0913', shallow: '#16131F', reflectivity: 0.97, fresnel: 1.6, reflectFloor: 0.68, roughness: 0.035, waveHeight: 0.07, waveScale: 0.6, waveSpeed: 0.5, streak: 0.35,
  sparkle: 0, foam: 0.04, wake: 0.8, opacity: 0.985, mirror: 0.75, rain: 0.05, rippleLife: 6,
  skin: { scale: 3.5, close: 60, lead: 2.0, plate: 1.0, sheen: 0.3, tint: '#f1ecf6', width: 2.0 },      // width: NOT in the page. Metres the hull's lane is wider than the hull, each side: as the engine breaks ice the lane is the hull's own width and cannot be seen past the gunwale; the lie at the gate of stumps is read in that lane (1-layout.md)
  thaw: { waveHeight: 0.22 },
};

// ---- the multitudes, at the counts the page plans
export const COUNT = {
  trees: 110, far: 84, motes: 126, birches: 220, pollards: 12, fencePosts: 58, sprays: 4000, spraySnow: 4000, oldestSprays: 900, birchSprays: 1300, apples: 100, umbels: 1600, frostFlowers: 4000,
  icicles: 600, pans: 72, flakes: 20000, petals: 4000, powder: 30000, steam: 48, lobesOldest: 110, loads: 44, waxwings: 74, deer: 9,
  // the orchard's cast, on the memory layer
  firefliesMirror: 2500, starlingsMirror: 4000, petalsGreatFall: 9000, bats: 8,
};

// ---- postcards (page section 4), in the page's frame; yaw is degrees to the left of the reference line's heading.
// docs/build/snow/postcards.json holds the same views as addresses on the engine's path.
export const POSTCARDS = [
  { n: 1, name: 'the black river', s: 30, d: 0, yaw: 0, pitch: 4 },
  { n: 2, name: 'the frozen fall', s: 52, d: 2, yaw: 180, pitch: 12 },
  { n: 3, name: 'the black road', s: 64, d: 0, yaw: 0, pitch: 2 },
  { n: 4, name: 'the plain', s: 70, d: -6, yaw: 75, pitch: 1 },
  { n: 5, name: 'the lie', s: 78, d: 0, yaw: 0, pitch: -6 },
  { n: 6, name: 'the gate of stumps', s: 105, d: 0, yaw: 0, pitch: -8 },      // (6b, at s 97, is the one that can be composed: see BAY)
  { n: 7, name: 'the cross aisle', s: 140, d: -3, yaw: 88, pitch: 0 },
  { n: 8, name: 'the lamp and its twin', s: 166, d: -1, yaw: -3, pitch: 3 },
  { n: 9, name: 'the net', s: 191, d: -14.5, yaw: -100, pitch: 42 },
  { n: 10, name: 'under the keel', s: 189, d: -15, yaw: 70, pitch: -30 },
  { n: 11, name: 'the tree written clean', s: 222, d: 0, yaw: 180, pitch: 10 },
  { n: 12, name: 'the water lets go', s: 236, d: 0, yaw: 0, pitch: 0 },
];

export const PLAN = {
  id: 'snow', length: LENGTH, shift: SHIFT, straight: STRAIGHT,
  xz, at, locate, centreX, lineD, band, mid, shelfLeft, shelfRight, waterRoom, openHalf, currentAt, colliders,
  path: PATH, pathS: PATH_S, line: LINE, current: CURRENT, pond: POND, pondOpen: POND_OPEN, bay: BAY,
  trees: TREES, rankS: RANK_S, rows: ROWS, low: LOW, slides: SLIDES, hedge: HEDGE, oldest: OLDEST,
  tree: TREE, left: LEFT, lamp: LAMP,
  cave: CAVE, cliff: CLIFF, birches: BIRCHES, bank: BANK, bridge: BRIDGE, owl: OWL, fence: FENCE, pollards: POLLARDS, deer: DEER, outlier: OUTLIER, stumps: STUMPS, veils: VEILS, farShore: FAR_SHORE, iceFog: ICE_FOG, pans: PANS,
  light: LIGHT, chip: CHIP, water: WATER, count: COUNT, postcards: POSTCARDS,
};

// ---------------------------------------------------------------------------------------------------------------------
// THE TREES (group "Trees" of the kit stage: kit_trees.js, kit_close.js; docs/build/snow/2-kit-trees.md). Added, nothing
// above changed.
/**
 * The side the weather came from, as a direction in the realm (x = north, z = east): east by a little north, so that a
 * boat coming west sees the plastered side of every trunk and, looking back, the bare one. The plaster of snow on the
 * boles, the drift at each trunk's foot and the hoar on the labels all take it.
 */
export const WEATHER = { x: 0.33, z: 0.944 };
PLAN.weather = WEATHER;
/** Cow parsley in winter (the page's 1,600 umbels): stems round the avenue's trunks and along the margins. */
export const UMBELS = { stems: 1600, atTrunks: 0.4, margin: 2.6, from: 60, to: 252 };
PLAN.umbels = UMBELS;
/** The last apples the kit hangs (page cast 7): nine on the low bough at (216.5, +10), two or three on every other low bough, five windfalls in the ice. */
export const KIT_APPLES = { most: [216.5, 10], mostCount: 9, windfalls: [[96, -9.6], [112, 11.2], [133, -11.5], [158, 11.9], [171, -19.5]] };
PLAN.kitApples = KIT_APPLES;

export default PLAN;
