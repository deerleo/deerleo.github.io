// The orchard in flood: the area's numbers, taken from docs/art/orchard.md. Plain data and small functions; no three.js.
// Every module reads this file, so that a thing is where the page says in all of them.
//
// ---------------------------------------------------------------------------------------------------------------------
// TWO WAYS OF SAYING WHERE A THING IS. Read this before you place anything.
//
// 1. THE PAGE'S FRAME (s, d): what docs/art/orchard.md is written in, and what every number in this file is in.
//      s   metres along the orchard's REFERENCE centre line from the path's first point, inside the cloth loft
//      d   metres to the right of that line (north); negative = left (south)
//    The reference line is straight to s 172, turns 25 degrees right on an arc between s 172 and s 200, and is straight
//    again to s 251. The tree grid, the wall, the hedges and every set piece are laid out against it.
//          at(s, d, y) -> [x, y, z]     xz(s, d) -> [x, z]     heading(s) -> rotation.y     locate(x, z) -> { s, d }
//
// 2. THE ENGINE'S PATH (kit.at, ctx.s, `&s=`, stage cues): the waterway the current follows. Its centre line IS the
//    page's COMPOSED LINE (where a boat left alone is carried, and where the lane of whoever went ahead lies), which
//    leaves the reference line at the pond to go round the south side of the oldest tree and under its arch. So on the
//    path, d = 0 is the composed line, and from the pond onward the path's arc length runs AHEAD of the page's s (the
//    detour is about 10 m longer). kit.at(s, d) is therefore NOT the page's (s, d) from s 88 on.
//          shared.frame.pathS(s)      the path's arc length where the composed line reaches the page's s (for cues: a
//                                     moment the page starts "at s 160" is  stage.cue(name, { s: F.pathS(160) }, ...))
//          shared.frame.toPath(s, d)  -> { s, d } on the path (for a picture's address, a `near` cue)
//          shared.frame.at(s, d, y)   -> THREE.Vector3, the page's frame (use this, not kit.at)
//    (shared.frame is made by set.js from ctx.path; the table PATH_S below is the same thing as numbers.)
// ---------------------------------------------------------------------------------------------------------------------
import { orchardPlan, OLDEST_TREE, FURNITURE, LOW_BOUGHS, RANKS, ROWS, OLDEST } from '../orchard-plan.js';

const rad = Math.PI / 180;
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// ---- the page's frame
export const BEND = { from: 172, to: 200, deg: 25 };
const TH = BEND.deg * rad, RB = (BEND.to - BEND.from) / TH;                  // the bend's radius: 64.17 m
const C2 = [RB * (1 - Math.cos(TH)), -BEND.from - RB * Math.sin(TH)];       // where the second straight begins
const T2 = [Math.sin(TH), -Math.cos(TH)], R2 = [Math.cos(TH), Math.sin(TH)];
export const LENGTH = 251;                                                    // of the reference line

/** The page's (s, d) as the realm's own [x, z]. (x = d and z = -s until the bend.) */
export function xz(s, d = 0) {
  if (s <= BEND.from) return [d, -s];
  if (s >= BEND.to) return [C2[0] + (s - BEND.to) * T2[0] + d * R2[0], C2[1] + (s - BEND.to) * T2[1] + d * R2[1]];
  const f = (s - BEND.from) / RB;
  return [RB - (RB - d) * Math.cos(f), -BEND.from - (RB - d) * Math.sin(f)];
}
/** The page's (s, d, y) as the realm's own [x, y, z]. */
export function at(s, d = 0, y = 0) { const p = xz(s, d); return [p[0], y, p[1]]; }
/** How far the reference line has turned by s (radians, to the right). */
export function turned(s) { return s <= BEND.from ? 0 : s >= BEND.to ? TH : (s - BEND.from) / RB; }
/** rotation.y that points an object's -Z down the reference line at s (as kit.headingAt does for the path). */
export function heading(s) { return -turned(s); }
/** rotation.y for a thing at (s, d) whose FRONT (+Z) should face: 'back' (the arriving boat), 'along', 'channel' (the centre line). */
export function face(mode, s, d = 0) { const h = heading(s); return mode === 'along' ? h + Math.PI : mode === 'channel' ? h + (d >= 0 ? -Math.PI / 2 : Math.PI / 2) : h; }
/** The realm's own (x, z) as the page's { s, d }. Exact for anything the boat can reach (|d| under 60 on the inside of the bend). */
export function locate(x, z, out = {}) {
  if (z >= -BEND.from) { out.s = -z; out.d = x; return out; }
  const vx = x - RB, vz = z + BEND.from, f = Math.atan2(-vz, -vx);            // the angle round the bend's centre
  if (f >= 0 && f <= TH) { out.s = BEND.from + f * RB; out.d = RB - Math.hypot(vx, vz); return out; }
  const px = x - C2[0], pz = z - C2[1];
  out.s = BEND.to + px * T2[0] + pz * T2[1]; out.d = px * R2[0] + pz * R2[1];
  return out;
}

// ---- the composed line (page section 3): [s, d]. The lane of whoever went ahead lies on it, and it is the path.
export const LINE = [[26, 0], [95, -2], [100, -5], [104, -10], [111, -15], [118, -13.5], [128, -6], [136, 0]];
/** The composed line's d at the page's s (straight between its points; 0 outside them). */
export function lineD(s) {
  if (s <= LINE[0][0] || s >= LINE[LINE.length - 1][0]) return 0;
  for (let i = 0; i < LINE.length - 1; i++) { const [s0, d0] = LINE[i], [s1, d1] = LINE[i + 1]; if (s <= s1) return d0 + (d1 - d0) * (s - s0) / (s1 - s0); }
  return 0;
}

// ---- the navigable water, in the page's frame: |d| <= halfWidth(s). (Plan table of the page: 16 m in the loft, 56 m
// in the avenues with the trunks as colliders, the pond inside the same band, drawn in from s 206 to the 17 m gap,
// 17 to 20 m beyond.)
// (The page draws the avenue in "from s 206 to the gap". The band is not narrowed there: it is the wall that stops a boat,
// and a band that closes in over the same water pins a drifting boat against the plank walk. orchard.js slides a boat
// that meets the wall along it into the gap instead.)
const WIDTHS = [[0, 8], [26, 8], [34, 28.5], [215.6, 28.5], [216.4, 8.5], [226, 9], [238, 10], [251, 10]];
export function halfWidth(s) {
  if (s <= WIDTHS[0][0]) return WIDTHS[0][1];
  for (let i = 0; i < WIDTHS.length - 1; i++) { const [s0, w0] = WIDTHS[i], [s1, w1] = WIDTHS[i + 1]; if (s <= s1) return w0 + (w1 - w0) * smooth(s0, s1, s); }
  return WIDTHS[WIDTHS.length - 1][1];
}

// ---- the engine's waterway: control points [x, z, halfWidth] along the composed line. The engine's half width is
// measured from the composed line, so in the pond it is the page's band plus the line's offset (the band's own edge is
// kept by the leash in orchard.js, which works in the page's frame).
const cp = (s, hw) => { const d = lineD(s), p = xz(s, d); return [+p[0].toFixed(3), +p[1].toFixed(3), hw ?? +(halfWidth(s) + Math.abs(d)).toFixed(2)]; };
export const PATH = {
  points: [cp(0), cp(13), cp(26), cp(34), cp(60), cp(84), cp(95), cp(100), cp(104), cp(111), cp(118), cp(128), cp(136), cp(154), cp(172), cp(186), cp(200), cp(208), cp(214.6), cp(217.4), cp(226), cp(238), cp(251)],
  softEdges: true,                                             // growth and mist hold the hull, not walls (orchard.js keeps the band)
};
/** The path's arc length where the composed line reaches the page's s, measured on the built path (set.js checks it at load). */
export const PATH_S = [[0, 0], [26, 26], [84, 83.9], [95, 95.1], [100, 100.9], [104, 107.4], [111, 116.1], [118, 123.4], [128, 135.8], [136, 146.0], [140, 150.0], [160, 170.0], [172, 182.0], [200, 210.0], [216, 226.0], [251, 261.0]];

// ---- the current (page section 3): m/s by the page's s, eased between the stretches
export const CURRENT = [[0, 3.0], [20, 3.0], [34, 2.0], [84, 2.0], [92, 1.6], [130, 1.6], [138, 2.0], [156, 2.0], [162, 1.2], [202, 1.2], [208, 2.2], [216, 2.2], [226, 3.0], [251, 3.0]];
export function currentAt(s) {
  if (s <= CURRENT[0][0]) return CURRENT[0][1];
  for (let i = 0; i < CURRENT.length - 1; i++) { const [s0, v0] = CURRENT[i], [s1, v1] = CURRENT[i + 1]; if (s <= s1) return v0 + (v1 - v0) * smooth(s0, s1, s); }
  return CURRENT[CURRENT.length - 1][1];
}

// ---- the trees, placed. The grid follows the reference line. On the inside of the bend the outer rows would crowd and
// fold (the bend's radius is 64 m and the rows run out to 73 m): there a tree is left out when it would stand nearer
// than `apart` to one already placed. The 110 trees of the sailable rows are never left out.
function placeTrees() {
  const plan = orchardPlan(), all = [];
  const put = (list, kind, apart) => {
    const out = [];
    for (const t of list) {
      const p = xz(t.s, t.d);
      if (apart && all.some((q) => Math.hypot(q.x - p[0], q.z - p[1]) < apart)) continue;
      const e = { ...t, kind, x: p[0], z: p[1], gx: t.x, turn: t.turn + heading(t.s) };       // gx: the grid's own x (= d)
      all.push(e); out.push(e);
    }
    return out;
  };
  const trees = put(plan.trees, 'sail', 0), far = put(plan.far, 'far', 5.6), motes = put(plan.motes, 'mote', 6.5);
  return { trees, far, motes };
}
export const TREES = placeTrees();

// ---- the hedge (hawthorn in blossom, 3 m tall) at d -82 and +82, as lines of [s, d] to be walked in 6 m pieces. On
// the inside of the bend the two straights meet in a corner (the arc would fold).
const MITRE = (82 - RB) * Math.tan(TH / 2);
export const HEDGE = {
  height: 3, piece: 6,
  left: { d: -82, from: 22, to: 216 },                                             // follows the bend on its outside
  right: [{ d: 82, from: 22, to: BEND.from - MITRE }, { d: 82, from: BEND.to + MITRE, to: 216 }],
};

// ---- set pieces (page sections 3 and 9), in the page's frame
export const TREE = OLDEST_TREE;                               // the oldest tree: shared with the orchard in snow
export const LEFT = FURNITURE;                                 // ladders, crate, cart, hives, plank walk, wall, loft: shared too
export const LAMP = { hook: [96, -1, 3.2], chain: 0.8, flame: [96, -1, 2.2], note: 65, reach: 16, moths: 4, near: 8 };      // F4; the lane passes a metre to its left
export const POOL = { from: 84, to: 98, width: 5 };            // the pool of open water under the lamp, where a hull lay still
export const STAG = {                                          // his one unbroken walk west (page section 5): [s, d]
  start: [110, -32.5], walk: [[110, -32.5], [122, -32.5], [125, -28], [132, -23.5], [184, -23.5], [188, -19], [197, -10], [206, 10], [207.5, 12.5]], drink: [207.5, 12.5],
};
export const EGRETS = {                                        // stations in turn (page section 5): [s, d] (or [s, d, y] for the two that roost)
  low: [
    [[48.5, 19], [163, 14.5], [216, 14.5]],
    [[66.5, -19], [138.5, -19], [216, -12]],
    [[107.5, 5.4], [147.5, 19], [216, 22]],
    [[114.9, -24.6], [192.5, -28]],
  ],
  roost: [[108, 4, 15], [115, -6, 20]],
};
export const MIDGES = [[38, -6], [55, 5], [73, -3], [92, 10], [140, 0], [165, -7]];            // six columns of 250, 2 to 4 m up
export const CARP = [{ n: 5, s: [50, 70], d: 0 }, { n: 4, at: [58, 3] }, { n: 6, at: [111, 16] }, { n: 5, s: [156, 176], d: 14.5 }, { n: 4, s: [212, 220], d: 0 }];
export const BACKDROPS = { about: [170, 0], windbreak: 250, meadow: 330, arc: 200 };            // painted rails: radii about (s 170, d 0), degrees of arc centred on the west

// ---- colliders, in the page's frame: [s, d, r]. Trunks and props are soft 0.4 m; limbs that enter the water 0.9 m.
export function colliders() {
  const list = [];
  // `flow`: a thing that stands alone in the water, which the current is bent round (orchard.js); rows of posts are not
  const add = (s, d, r, flow = true) => { const p = xz(s, d); list.push({ x: p[0], z: p[1], r, flow }); };
  for (const t of TREES.trees) list.push({ x: t.x, z: t.z, r: 0.4, flow: true });
  add(TREE.at[0], TREE.at[1], TREE.islet.collide);
  for (const [s, d, r] of TREE.lampLimb.colliders) add(s, d, r);
  for (const [s, d, r] of TREE.arch.colliders) add(s, d, r);
  for (const [s, d] of TREE.props) add(s, d, TREE.propCollide);
  for (const t of TREES.trees) if (t.low) add(t.s, t.d + (t.d > 0 ? -4.6 : 4.6), 0.4);                // the crutch under each long low bough
  for (const l of LEFT.ladders) add(l.foot[0], l.foot[1], 0.45);
  add(LEFT.handcart.at[0], LEFT.handcart.at[1], 1.1);
  for (let k = 0; k <= 3; k++) add(LEFT.fallenLadder.from[0] + (LEFT.fallenLadder.to[0] - LEFT.fallenLadder.from[0]) * k / 3, LEFT.fallenLadder.from[1] + (LEFT.fallenLadder.to[1] - LEFT.fallenLadder.from[1]) * k / 3, 0.4, false);
  for (let k = -1; k <= 1; k++) add(LEFT.hives.at[0] + k * 1.5, LEFT.hives.at[1], 0.95, false);
  // the plank walk: trestles every 1.5 m, with the two gaps where planks are missing left open (a boat can go through them)
  for (let s = LEFT.plankWalk.from; s <= LEFT.wall.s - 0.4; s += 1.5) if (!LEFT.plankWalk.missing.some(([a, b]) => s > a - 0.4 && s < b + 0.4)) add(s, LEFT.plankWalk.d, 0.6, false);      // (on to the stile in the wall: no way through at its end)
  // the wall's piers (the gap stays open). (The wall itself is kept in orchard.js: a row of circles has cusps a drifting boat sticks in.)
  const w = LEFT.wall;
  for (const side of [-1, 1]) add(w.s, side * (Math.abs(w.gap[0]) + w.pier.thick / 2), 0.65, false);
  add(w.s - 1.9, w.gap[0] + 0.45, 0.35, false);                                                    // the tip of the gate leaf, swung open toward the boat on the left pier
  // the loft: posts, the door's posts, and the gable either side of the door
  const L = LEFT.loft;
  for (const s of L.postEvery) for (const side of [-1, 1]) add(s, side * L.posts, 0.4, false);
  for (const side of [-1, 1]) { add(L.door, side * (L.water / 2 + 0.22), 0.5, false); for (let d = 11.2; d < 40; d += 3.2) add(L.door - 2.6, side * d, 3.0, false); }
  return list;
}

// ---- light. SECOND PASS (stage 2d, docs/build/orchard/2-light.md): these are no longer the page's table exactly.
// What changed, and why, in one place:
//   - THE DISPLAY IS NEUTRAL. grade { tint white, saturation 1, contrast 1, toe 1 } with exposure 0.78 shows a colour
//     as it is typed (within a level or two of sRGB from night petrol to lilac; whites roll off to about #ddd4d2). So
//     every colour below, and every colour anyone paints on a model, IS the colour the rider sees: no inverse of the
//     display pass any more (the first pass had one, shared.seen; it is kept as a name and now returns its argument).
//   - THE CONVENTION FOR PAINT IS UNCHANGED: a colour painted on a model is the colour it shows on an upright face in
//     the open light of the afterglow. The light then works on it, per state, as multipliers (shared.dusk, set.js):
//     `shade` on pale paint BELOW the last light's line (the orchard under its own roof is in blue shade), `high` above
//     it; `top` on a face turned to the sky and `under` on a face turned to the water (the orchard's own ramp, about
//     `key`, the way its light travels). Dark paint (boughs, bark, timber) keeps its own colour: `dark` is how much of it
//     shows, `darkShade` on a face turned down. The engine's own ramp (`look.light`) is left as the page's table: it
//     lights only what does not wear shared.dusk (the boat, the kept lamp, the loft's cloth).
//   - LAST LIGHT BY HEIGHT (`last`): above `line` metres pale paint shows at `high` and takes `color` on what faces
//     the sky; below it, `shade`. This is what stands the oldest tree's dome apart from the avenue (whose trees end at
//     9.2 m). The line climbs and the light fails as the dusk goes.
//   - `rim`: the thin apricot edge on what stands against the band (looking west only).
// `look` keys as the engine names them. Colours in `sky`, `fog`, `mist` are as seen.
//   - THE AFTERGLOW'S BANK (`bank`, third pass): the band of peach low in the west that the first avenue looks at is not
//     the sky (crowns close over the sky's band from everywhere in the first avenue) but MIST LYING ON THE WATER in the
//     second avenue, lit from behind by the band: an analytic bank (set.js, BANK_GLSL) that begins at `from` metres west
//     and never nearer than `ahead` metres to the boat (a bank of mist is always over there), rises to its whole density
//     over `rise` metres, thins by e every `height` metres up, and veils whatever stands in it with its own colour:
//     `west` looking into the band, `side` looking across it (`lobe`: how narrowly the light keeps to the west). The far
//     colonnade goes into it trunk by trunk; the oldest tree, its props and the stag stand dark against it; and the open
//     water in front of it mirrors it: the warm line on the water. It cools and thins as the dusk goes.
export const LIGHT = {
  blend: [90, 176],                                            // the dusk advances only with travel: afterglow until s 90, blue hour from s 176
  bank: { from: 134, ahead: 45, rise: 22, height: 6, density: 0.036, lobe: 8,
    // (sixth pass) `gap`: as the boat comes up to the wall (its last 20 m) the bank draws in to stand `ahead` metres off,
    // `thicken` times denser again, and takes the colour of the way out: the mist beyond the wall is the bank itself
    gap: { ahead: 24, thicken: 0.6 },
    // the band given back to the mirror (set.js, "THE WARM LINE ON THE WATER"): a curtain of the band's light standing
    // `into` metres inside the bank, in the water's picture only: the bank's `west` colour times `rgb` times `gain`,
    // thinning by e every `height` metres up. (`rgb` undoes the mirror's own grade, channel by channel.)
    // (sixth pass: `rgb` was [1.74, 1.18, 0.78], worked out against the third pass's grade. The mirror is now a third greyer
    // than the world and leans to the green side (WATER.afterglow), which took the band's line on the water to a grey
    // rose: these undo THAT grade, so the line comes back the band's own apricot.)
    // `veil` (sixth pass): how far the BANK'S OWN light is multiplied by `rgb` in the water's picture (set.js, bankColour):
    // the curtain shows only in the gaps under the far crowns; the band the water mirrors is mostly the bank's veil on the
    // far colonnade itself, and that went through the grade untouched.
    // (seventh pass: `rgb` [1.95, 1.65, 1.6], was [2.4, 1.1, 0.3]: the mirror's grade is now darker and hardly tinted or greyed
    // (WATER.afterglow), so what undoes it is nearly one number for the three channels.)
    mirror: { into: 26, height: 3.5, gain: 1.0, rgb: [1.95, 1.65, 1.6], veil: 1 } },
  // THE OLDEST TREE'S VAULT (third pass): under its crown the sky is shut out. Within `radius` of its bole and below
  // `height` (wholly below 0.45 of it) pale paint is multiplied by the state's `vault` and dark paint by 0.86: the bole,
  // the low limbs and their blossom stand in the crown's own shade, the dome's top in the last light, and the kept lamp
  // and the band are seen against that shade.
  vault: { radius: 28, height: 12.5 },
  // NOTHING THE SKY LIGHTS BLOOMS: lit paint is eased in from the first value so that it never passes the second (the
  // afterglow's bloom begins at 0.84). The page: blossom, limewash and petals are luminous without blooming.
  limit: [0.6, 0.8],
  // THE WATER KEEPS THE WHITE TRUNKS (third pass): in the water's picture of the world pale paint below the first height
  // (wholly) to the second (not at all) is brightened by each state's `mirrorKeep`, which gives the limewash back most
  // of what the mirror's deep grade takes from it.
  mirrorKeep: [2.0, 3.4],
  // THE SIDE AISLES' MIST ON THE WATER (third pass): beyond the avenues' own corridor (it comes in between `corridor[0]`
  // and `corridor[1]` metres off the reference line) far water goes into each state's `mist.water` colour, up to
  // `amount`, over about `range` metres of distance. Inside the corridor the water is left clear to the bank.
  // (sixth pass) `gap`: BEYOND THE WALL the water goes into the mist of the way out, as the air does: up to `amount`,
  // coming in over the first `rise` metres beyond the wall's line and with the distance from the eye (`range` metres),
  // in the gap mist's own colour times `tone` (water under mist is a shade deeper than the mist)
  mistOnWater: { amount: 0.72, range: 80, corridor: [15, 34], gap: { amount: 0.94, rise: 10, range: 24, tone: 0.9 } },
  veil: '#0b0d1e',
  exposure: 0.78,                                              // of the neutral display (both states; the loft is held under it)
  loft: { exposure: 0.62, until: 20, by: 30 },                 // inside the loft the exposure is held at 0.8 of the afterglow's and eased up by s 30
  afterglow: {
    // sky: elevation in degrees -> colour (the painted panorama's own column, so that the painting sits in it without a join)
    sky: { top: '#0e2942', mid: '#24637a', horizon: '#5f8792', below: '#13222E', midAt: 0.22, panoramaGlow: 1.12, grade: '#f6eaff',
      // (fourth pass) `east`, `west`: what the sky's own colour is multiplied by (linear r, g, b) looking east and looking
      // west, fading out toward the zenith: lighter and greener over the afterglow, deeper and bluer over the loft
      east: [0.74, 0.8, 0.92], west: [1.07, 1.1, 1.05],
      stops: [[-6, '#1c3f52'], [0, '#5f8792'], [6, '#4c7f8c'], [13, '#37708a'], [20, '#225d79'], [26, '#194b69'], [34, '#123857'], [42, '#0e2d48'], [90, '#0c263e']] },      // (third pass: a step deeper from 20 degrees up: the key painting's upper sky is #1d3a5f, and the warm dome stands against it)
    stars: 0,
    mist: { color: '#6d7499', opacity: 0.16, water: '#5b6790', bank: { color: '#C9A08E', opacity: 0 } },      // the side aisles' mist a step deeper than the page's lilac #8E8AA8 (pale mist behind white trunks flattens the colonnade; the key painting's far trunk zone is #455a86); `water`: where it lies on far water. (The low bank lit apricot is the afterglow's bank now, not cards: opacity 0)
    backdropTint: '#a8b0c8',                                             // (third pass: the far rails a third darker than painted. Against the band they are silhouettes, as the key painting's poplars are)
    blossomGlow: 0.05,
    shade: '#d0dcf6', high: '#f6e2da', top: '#edf3ff', under: '#bfcaea',   // white paint under the line shows a cool lilac white on an upright face (the avenue is in blue shade); above the line a warm white; `under`: what a face turned to the water keeps (the crowns are seen from below, by the rider and by the mirror: this is what makes the mirror deep)
    mirrorKeep: 0.25,                                                   // (fifth pass: 0.55 before. The mirror is a third darker than the world now, not two fifths, and all pale paint is given back by `mirrorCrowns`: with both at full the trunks' reflections outshone the trunks)
    mirrorCrowns: 0.3,                                                  // (fifth pass) in the water's picture ALL pale paint is given back by this much (set.js, uKeepAll): the mirror looks at the crowns from below, at their shade side, and without it the blossom cannot be found in the water
    // (seventh pass) THE MIRROR'S SPLIT TONE (set.js, uMirrorShade / uMirrorLight / uMirrorSplit): in the water's picture the
    // shade side of pale paint is multiplied by the first three numbers (r, g, b: toward the water's own petrol, and
    // deeper) and its lights by the next three (lilac, and lighter), between the two luminances that follow (linear);
    // the last is how much of it. With WATER.afterglow's grade (darker, a little richer, hardly tinted) this is the key
    // painting's water, measured: darks #21405b, mids #37556f, lights #6e7289 there; #26435a, #39556f, #757388 here
    // (as found: #2d475b, #425a72, #757589, one slate from dark to light).
    mirrorTone: [0.3, 0.77, 0.72, 1.24, 1.24, 1.28, 0.16, 0.52, 1],
    vault: '#9498c4',                                                   // what pale paint keeps under the oldest tree's crown (times `shade`)
    dark: 0.74, darkShade: '#c4c8e6',                                   // dark paint: this much of its own colour on an upright face (bark painted #5b4b50 shows the key's #3a3038); `darkShade` of that on a face turned down
    last: { color: '#ffc4ae', gain: 0.38, line: [11, 22], wrap: 0.5 },   // last light: above the avenue's crowns (they end at 9.2 m) what faces the sky or the west is warmed: the dome's upper lobes hold it, the avenue does not. (A rose light, toward the page's blossom pink: never the band's apricot, which the page keeps for the band alone)
    rim: { color: '#F2A769', gain: 0.55 },
    fogWest: { color: '#d39e70', gain: 0 },                              // (second pass: a warm tint on the fog toward the west. The bank below took its place: gain 0)
    bankLight: { west: '#ffa877', side: '#566a8a', density: 1 },         // the bank's colour looking into the band (shown as about #dea67c) and across it; how much of plan.light.bank.density
    key: [0.0, -0.9, 0.42],                                             // the sky is the lamp, a little brighter in the west: travels down and eastward
    look: {
      background: '#13222E',
      fog: { color: '#386a7c', density: 0.0065 },
      // the engine's own ramp: the page's table, exactly. It lights what does NOT wear shared.dusk: the boat, the kept
      // lamp, the loft's cloth. Everything of the orchard wears shared.dusk, which puts the light above in its place.
      light: { key: [0.12, -0.16, 1.0], keyColor: '#F2A769', gain: 1.0, shadow: '#1F4C5A', lit: '#FFDCC4', sky: '#4A8A93', ground: '#17304A', heightFog: 0.25, heightFogOver: 3, lanternRadius: 7 },
      exposure: 0.78,
      bloom: { strength: 0.45, radius: 0.70, threshold: 0.84 },
      paint: 0.80, paintRadius: 4.5,
      grade: { tint: '#FFFFFF', saturation: 1.0, contrast: 1.0, lift: '#07131C', vignette: 0.30, grain: 0.035, toe: 1 },
      lantern: 2.4,
      // (fourth pass) the rider's own boat (remodelled 7 Nov; it takes the engine's ramp above, the page's apricot key,
      // and its own lantern): under the avenue's roof it stood as pale tan wood, the lightest thing in the lower half.
      // `tone` multiplies the whole boat: worn wood in the orchard's blue shade, warm only where its lantern reaches
      boat: { tone: '#a9a6ba' },
    },
  },
  blue: {
    sky: { top: '#0a1929', mid: '#153a55', horizon: '#34647f', below: '#0B1722', midAt: 0.22, panoramaGlow: 0.3, east: [0.84, 0.88, 0.95], west: [1.08, 1.08, 1.04],
      stops: [[-6, '#0f2434'], [0, '#34647f'], [6, '#2a587a'], [13, '#1f4a6a'], [20, '#153a55'], [30, '#102c44'], [45, '#0c2136'], [90, '#0a1929']] },
    stars: 1.0,
    mist: { color: '#4c5f8a', opacity: 0.18, water: '#2f4468', bank: { color: '#4c5f8a', opacity: 0.12 } },
    backdropTint: '#527088',
    blossomGlow: 0.10,
    // (sixth pass: `high` #c4d2f8, was #a2b0d8; `shade` #8696c0, was #8e9cc6. In the look back the great tree was no paler
    // than the avenue's crowns either side of it and stood apart by its size alone: above the line it now holds a good
    // deal more of what light is left than the avenue under its own roof does: the page's "pale blue mountain against
    // the dark petrol east".)
    shade: '#8696c0', high: '#c4d2f8', top: '#fff6fb', topGain: 1.2, under: '#86a8c8',   // (fifth pass: the dusk FALLS TO BLUE. The fourth pass's blue hour was violet from crown to water (shade #9896c0, high #aeaad2, under #8fb2cc): the page's night is Prussian, on the green side, and lavender is the snow orchard's. Pale paint now shows a blue-lilac #8e9cc6)
    //   // white paint shows lilac #9896c0 on an upright face, holding what light is left (never the snow orchard's blue-white); its underside goes to petrol
    mirrorKeep: 0.4,
    mirrorCrowns: 0.3,
    mirrorTone: [0.42, 0.8, 0.8, 1.2, 1.18, 1.2, 0.05, 0.2, 1],            // (seventh pass: as the afterglow's, at blue hour's lower luminances)
    vault: '#bcc0de',
    dark: 0.62, darkShade: '#b9c4e6',
    last: { color: '#e8c9c2', gain: 0.0, line: [10, 20], wrap: 0.5 },
    rim: { color: '#c98f76', gain: 0.12 },
    bankLight: { west: '#6a6486', side: '#2c4664', density: 0.5 },      // at blue hour the bank is the mist creeping in, half as thick: blue to the sides, and to the west the dregs of the afterglow, a dim mauve (this dusk stays a warm lilac falling to blue; the snow orchard is white and ink)
    key: [0, -1, 0.12],
    look: {
      background: '#0B1722',
      fog: { color: '#1A3650', density: 0.0090 },
      light: { key: [0, -1, 0.15], keyColor: '#7FAED0', gain: 0.85, shadow: '#10263A', lit: '#C4DBEE', sky: '#2A587C', ground: '#0D2032', heightFog: 0.40, heightFogOver: 3, lanternRadius: 7 },
      exposure: 0.78,
      bloom: { strength: 0.80, radius: 0.85, threshold: 0.70 },
      paint: 0.70, paintRadius: 4.5,
      grade: { tint: '#FFFFFF', saturation: 1.0, contrast: 1.0, lift: '#08131E', vignette: 0.38, grain: 0.04, toe: 1 },
      lantern: 3.2,
      boat: { tone: '#a9a6ba' },
    },
  },
  stars: { count: 40, firstAt: 96, every: 8, first: 9, twinkle: 0.2 },      // the first nine come out one per 8 m of travel from s 96
  // THE WAY OUT (fourth pass): beyond the wall the page has "lilac mist, paler than anything behind ... then nothing".
  // The air was already lilac there (mist cards, the bank, the next area's veil), but the water went to the blue hour's
  // own fog, a dark navy: a hard line ran along the horizon between dark water and pale mist. So a fourth light state,
  // `mist`, comes in by distance from `from` to `to` (the page's s): the blue hour with its fog the mist's own lilac and
  // thicker, and a water body to match; water and air go into one mist together, and the engine's veil takes it from there.
  mist: { from: 214, to: 236, look: { background: '#5c5d82', fog: { color: '#7f7c9e', density: 0.02 } }, water: { deep: '#3d4a6e', shallow: '#2e506a' } },
};

// ---- the eight chips (page section 2)
export const CHIP = {
  teal: '#2B6F78', night: '#12283F', white: '#F4E6E3', pink: '#E3A8B0', lilac: '#8E8AA8', apricot: '#F2A769', plum: '#2A1E2C', firefly: '#D6EE8C',
  amber: '#FFB45E', limewash: '#E4DFDC', bark: '#3A2C36', skin: '#C9C3D6', skinShade: '#9C98B4', skinBlue: '#6F7FA0', carp: '#3B3A2E', stone: '#5E6C7C',
};

// ---- the water (page section 7). SECOND PASS (stage 2d): the key painting's water, measured, is three parts deep teal
// body to one part mirror (its open water is #1c4a63 where the sky above is #204a69; the dome #bfacb7 is mirrored as
// #3b5b73). So the mirror's cap comes down from the page's 0.95 and the body is a luminous deep teal, never a black floor;
// the reflection is cooled and darkened inside it, and trunks, crowns and sky stand in it with their own contrast.
// Colours are as seen (the display is neutral: see LIGHT).
export const WATER = {
  // THIRD PASS: the mirror is CLEANER AND RICHER. The second pass cooled it with a strong blue tint (#aed6ea) under a cap
  // of 0.74, which took the red out of everything mirrored (the band's line on the water came back grey, the white
  // trunks dull). Now: a higher cap, a tint only half as blue, more saturation, and a mirror that is deep because of
  // what it sees: it looks at the crowns from below, and their undersides are in shade (LIGHT, `under`). The orchard
  // upside down is a deep blue with the trunks standing pale in it, the sky a deep teal between, the band a rose line
  // down the lane; and the petals (lilac, 0.6 bright) lie a clear step above it (the mirrored crowns are 0.35; the
  // key painting's, 0.30 with lights of 0.48). A neutral tint was tried: the mirrored crowns come back as pale and as
  // lilac as the petals lying on them, and neither the drifts nor the lane can be read.
  // FOURTH PASS (the second look): THE WATER IS TEAL. The third pass's water was slate navy (open water #1f3e56) under a
  // blue tint; the key painting's open water is a luminous teal, #1c4a63 near and #2f5e72 to #345973 further off, lighter
  // than its own sky. So the body is a brighter teal and the mirror's tint leans to the green side of blue (the mirrored
  // crowns stay a deep blue-lilac, the mirrored sky a clear teal): with the sky this is the page's "petrol teal, about
  // 60 per cent of any frame and its reflection". The petals are told from it by hue (they are violet), not by being
  // white. (Third pass: deep #17445c, darken 0.44, tint #c6d9ee.)
  // FIFTH PASS (the second look, continued): A DEEP MIRROR, NOT A TEAL SHEET. With the fourth pass's bright body (#1f5a6e,
  // 0.31 bright, lighter than the sky it mirrors) and a mirror 40 per cent darker under a teal tint, the water ran from
  // 0.27 to 0.41 in one hue and the mirrored crowns were dark blue ghosts in it. The key painting's water is DARK where it
  // mirrors the sky (#163d56 to #1c4a63) and pale lilac where it mirrors the crowns (lights #817d90), and its reflections
  // are drawn out softly downward while the petals lying on them are crisp: that softness is what tells a raft from a
  // mirrored crown. So: a darker petrol body (the darks of the water are the mirrored sky and the body together), the
  // mirror a third darker than the world, hardly tinted and no richer (the crowns come back lilac, not teal), and
  // `mirror` down from 0.75 to 0.45 with a longer `streak`: the water's own downward smear (and longer columns under the
  // band and the lamp). (Fourth pass: deep #1f5a6e, shallow #2B6F78, mirror 0.75, streak 1.3, reflectivity 0.82, fresnel 2.8,
  // darken 0.40, saturate 0.28, tint #bfe0e6.)
  // SIXTH PASS (the third pair of eyes, 23:30 on 7 November): THE MIRROR IS CLEAN AGAIN. The fifth pass softened it
  // (`mirror` 0.55, `roughness` 0.08, `streak` 1.5) so that a raft could be told from a mirrored crown, forty minutes before
  // it found that the petals had been standing in the fog: with the petals in their own colours (crisp, mauve, on a deep
  // blue reflection) the softness is not needed for that, and it cost the picture its second half: at the reveal the
  // water was a blue haze with upright smears in it, and neither crown, trunk nor the oldest tree could be made out
  // upside down. Now the page's own stillness (`mirror` 0.75 there; 0.7 here, so the wavelets still move the reflections
  // a little), `roughness` 0.05, `streak` 1.3: the orchard stands in the water, trunk by trunk. The body, the cap and the
  // grade are the fifth pass's, unchanged.
  // SEVENTH PASS (the fourth pair of eyes, 01:40 on 8 November): DEPTH AND COLOUR. Laid beside the key painting the water
  // was a grey-teal glass: one slate from its darks to its lights (the sixth pass's grade: a third darker AND a third
  // greyer, tinted cyan, which is what made the stamp's share of teal come right). The key painting's water is deep where
  // it is dark (a saturated petrol navy) and lilac where it is light: the blossom is IN it. So the grade is darker, a
  // little richer and hardly tinted (`mirrorDarken` 0.46, `mirrorSaturate` 0.1, `reflectionTint` #e7f7ee; were 0.33, -0.35,
  // #c4e4ea), the body a step bluer (`deep` #103f58, was #164457), and the lights are given back in the paint itself, by
  // the mirror's split tone (LIGHT.*.mirrorTone, set.js): the shade of mirrored blossom leans to petrol, its lights stay lilac.
  afterglow: { deep: '#103f58', shallow: '#22606e', mirror: 0.7, streak: 1.3, roughness: 0.05, opacity: 0.90, reflectivity: 0.86, fresnel: 2.6, mirrorDarken: 0.46, mirrorSaturate: 0.1, reflectionTint: '#e7f7ee' },
  // (sixth pass, the mirror's grade: `mirrorSaturate` -0.35, was 0; `reflectionTint` #c4e4ea, was #d4e6f2. THE WATER HAD NO
  // TEAL IN IT. At stamp size the key painting's lower half is 22 per cent teal, 59 blue, 10 violet; ours was 4, 67, 15:
  // under a roof of blossom the mirror gives back the crowns' shaded undersides, which are periwinkle, and the water read
  // violet-blue from bank to bank. The reflection is now a third greyer than the world and leans to the green side: 16,
  // 56, 13 at the colonnade and 26, 36, 12 under the lamp; the mauve petals lie on it told apart by hue. The body is as
  // it was (a bright teal BODY was the fourth pass's "teal sheet": this is the reflection's own colour, not a veil).)
  // (fourth pass: at blue hour the water was one navy from edge to edge, 0.21 to 0.32 bright, the petals no lighter than
  // the leads and the crowns not to be found in it. Now a petrol body, a mirror 28 per cent darker than the world, not a
  // half, tinted to the green side as in the afterglow: the pale crowns and the white trunks stand in it, the leads are
  // the darks, and the drifts lie on it a clear step lighter: the page's "#6F7FA0, still lighter than the lanes".)
  // (fifth pass: the same mirror as the afterglow's, a step deeper: a Prussian body, the reflection a quarter darker than
  // the world, hardly tinted, drawn out softly. Fourth pass: deep #0f4050, shallow #1A4560, mirror 0.85, reflectivity 0.86,
  // fresnel 2.6, darken 0.28, saturate 0.3, tint #a8dede.)
  blue: { deep: '#0c2f44', shallow: '#164a5c', mirror: 0.75, streak: 1.3, roughness: 0.05, opacity: 0.92, reflectivity: 0.88, fresnel: 2.5, mirrorDarken: 0.36, mirrorSaturate: 0.05, reflectionTint: '#e4f4f0' },      // (seventh pass: the afterglow's grade at blue hour: were deep #0d3142, mirrorDarken 0.25, mirrorSaturate -0.3, reflectionTint #c4e2ec)      // (the page: this night is Prussian, on the green side)      // (third pass: the second's cyan tint #9fd4e2 turned the mirrored lilac to slate; at blue hour the pale crowns in the water are half the picture)
  loft: { deep: '#0a1826', shallow: '#102c3a' },                    // under the loft's roof the water's body is night
  both: { roughness: 0.05, waveHeight: 0.08, waveSpeed: 0.5, sparkle: 0, foam: 0, rain: 0, rippleSize: 96, rippleLife: 30, rippleSpeed: 1.5,
    // (seventh pass) the water's own sky-light on leaning water (docs/water.md, `sheen`): a ring arrives as a fine pale arc
    // (the key painting draws its rings so), the wake as two feathered arms; and a thin line of light where the water
    // meets a trunk, a prop, the hull (`waterline`): the join of every thing with the water
    sheen: { color: '#a8bcd8', rings: 0.22, still: 0, glance: 0, rain: 0, hide: 0, lamps: 0.25 },
    waterline: { color: '#aebbd8', width: 0.012, gain: 0.24, reach: 24 } },
  mirrorGrade: {},                                              // (the first pass's dark tinted mirror; now part of the two states above. Kept as a name)
  // within 4 m an opening shows the bed a metre down at about 60 per cent; past 6 m the mirror has taken over.
  // (`clarity` 2.2 is that 60 per cent. The table's `opacity` 0.90 lets a tenth of the bed through, which is nothing:
  // the two cannot both hold, and the page's words for the look-in are the ones kept. See 1-layout.md.)
  lookIn: { tint: '#1F5560', reach: 4, gone: 6, clarity: 2.2, seeDistance: 7 },
  bed: -1.0, mound: { across: 2.6, top: -0.25 },               // a metre deep between the planting mounds; each mound's top 0.25 m under
  // the skin's standing coverage (how much of the water the petals cover), by the page's s
  cover: { avenue1: { windrow: 0.9, middle: 0.55, all: 0.6 }, pond: 0.45, pondAfterFall: 0.9, avenue2: [0.8, 0.95], beyond: 0.2 },
  lane: { width: [0.5, 1.5], open: [0.3, 1.0], near: 6, far: 70, close: 25, quick: 10 },     // half healed at 6 m ahead of the bow, fully open from 70 m. (seventh pass) `quick`: the life in seconds of a mark written at 1 into the trace's 'glow' channel (set.js's petals part for it as for a lane): written at 0.9 its last petal is back after 8 s, the page's time for a carp's window; a hull's lane takes `close`
  // the petals as they lie on the water (set.js, "the petals"): one petal's length in metres (four times life, as stage
  // snow is), metres to a repeat of their picture, and their colour as seen at the two ends of the dusk
  // (third pass: the page's own #9C98B4 for the skin; `lantern`: how much of a lamp's light a petal takes.)
  // FOURTH PASS (the second look): THE PETALS ARE VIOLET RAFTS ON TEAL WATER, as the key painting's are (its rafts
  // measure #586086 with lights of #877e9a: hardly lighter than the water, and told from it by hue). `afterglow` / `blue`:
  // the colour a pale petal in a drift shows; `lilac`, `pink`: what a petal in shade and a petal on its face keep of it
  // (linear multipliers); `pale` / `paleBlue`: the few nearly white ones (a petal lying alone, the lights of a drift);
  // `glance`: how far a drift pales toward `warm` where it is seen edge-on toward the band (0.9 before: far drifts were
  // white streaks); `farTone`, `farAlpha`: what a drift keeps of its colour beyond 40 m, and how much of the mirror it
  // hides there; `length`, `tile`: one petal 7.5 cm long (five times life: at 6 cm a raft was sand from 4 m).
  // FIFTH PASS: THE COLOURS BELOW ARE AT LAST THE COLOURS SHOWN. Until 22:15 on 7 November every petal stood nine tenths in
  // the fog, whatever its distance (set.js: the sheet's distance was read between its four corners), so the fourth
  // pass's tints were chosen through a grey-teal veil (afterglow #9288ac, blue #9c9fce, lilac [0.82, 0.7, 1.0], pink
  // [1.0, 0.74, 0.86], pale #d9d0e2 / #c4c9ea): with the veil gone they were pink in the afterglow and a pale floor at
  // blue hour. Now: a cool grey violet in the afterglow (a pale petal shows about #7c7ea0 times its own light: the key
  // painting's rafts have lights of #877e9a), its shade and its pink kept close to it; at blue hour a slate blue a clear
  // step above the leads and well under the blossom (the page's #6F7FA0 is this tint at four fifths light).
  // (sixth pass) `lanternBlue`: how much of a lamp's light a petal takes at blue hour. The bow lantern is turned up a
  // third as the dusk goes (2.4 to 3.2) while everything else dims: at 0.12 the petals in its reach were the lightest
  // thing in the lower half of the picture (postcard 9: white floes round the bow again).
  petals: { length: 0.075, tile: 3.0, afterglow: '#7c7ea0', blue: '#62759f', warm: '#b9a8c4', lantern: 0.12, lanternBlue: 0.065,
    lilac: [0.86, 0.82, 1.0], pink: [1.0, 0.88, 0.94], pale: '#d0cee2', paleBlue: '#a4b2d6', glance: 0.3, farTone: '#f4ecff', farAlpha: 0.92,
    // (seventh pass, the fourth pair of eyes) THE FAR DRIFTS ARE TOUCHES, NOT A WASH. `farLay`: [petal lengths to a pixel at
    // which the next larger touch takes over (0.3 before: a touch was then 1.5 to 3 pixels tall, and with the drift's own
    // wash under it every drift further off than 8 m was a flat mauve film with soft edges), the last level of touches
    // (2 before: the touches ended at 19 m; 6 carries them to about 60 m), how much of the drift's wash is left under
    // the touches, and beyond the last of them]. A drift is now separate touches with open water between them for as far
    // as it can be seen, each still with its own threshold, so its edge thins touch by touch.
    farLay: [0.18, 6, 0.2, 0.5] },
  // the standing map's drifts (set.js, coverMap): `loose`: the threshold a loose raft is cut at (higher = fewer rafts
  // between the windrows; 0.715 is about one tenth of the open water), `avenue2`: the same for the second avenue's long
  // drifts (0.53 is a little under half of the water), `single`: how many single petals lie on open water
  drifts: { loose: 0.655, avenue2: 0.56, single: 0.0016 },
};

// ---- the multitudes, at the counts the page plans (ceilings in brackets where the page says to start lower)
export const COUNT = {
  trees: 110, far: 84, motes: 126, lobesOldest: 110, lobesPerTree: 12, sprays: 2400 /* (3000) */, umbels: 1200, narcissus: 600, bluebells: 500,
  grassTips: 6000, drownedGrass: 5000 /* (8000) */, petalsFall: 6000, petalsGreatFall: 9000, petalsFloat: 8000, fireflies: 7000, firefliesMirror: 2500,
  starlings: 12000 /* (16000) */, starlingsMirror: 3000 /* (4000) */, starlingsPerched: 300, bats: 16, midges: 1500, bees: 52, carp: 24, egrets: 6, labels: 110,
};

// ---- postcards (page section 4), in the page's frame; yaw is degrees left of the REFERENCE line's heading.
// docs/build/orchard/postcards.json holds the same views as addresses on the engine's path.
export const POSTCARDS = [
  { n: 1, name: 'the door of dusk', s: 16, d: 0, yaw: 0, pitch: 3 },
  { n: 2, name: 'the colonnade', s: 31, d: 0, yaw: 0, pitch: 6 },
  { n: 3, name: 'down at the bow', s: 60, d: -1, yaw: 0, pitch: -28 },
  { n: 4, name: 'the cross aisle', s: 62, d: -3, yaw: 88, pitch: 0 },
  { n: 5, name: 'under the lamp', s: 87, d: -1.5, yaw: 0, pitch: 5 },
  { n: 6, name: 'the vault', s: 114, d: -14.5, yaw: -100, pitch: 42 },
  { n: 7, name: 'the look back', s: 172, d: 0, yaw: 180, pitch: 10 },
  { n: 8, name: 'the tide', s: 180, d: 0, yaw: 4, pitch: 2 },
  { n: 9, name: 'the gate', s: 208, d: 0, yaw: 0, pitch: 2 },
];

export const PLAN = {
  id: 'orchard', length: LENGTH, bend: BEND,
  xz, at, heading, face, turned, locate, lineD, halfWidth, currentAt, colliders,
  path: PATH, pathS: PATH_S, line: LINE, current: CURRENT,
  trees: TREES, ranks: RANKS, rows: ROWS, lowBoughs: LOW_BOUGHS, oldest: OLDEST, hedge: HEDGE,
  tree: TREE, left: LEFT, lamp: LAMP, pool: POOL, stag: STAG, egrets: EGRETS, midges: MIDGES, carp: CARP, backdrops: BACKDROPS,
  light: LIGHT, chip: CHIP, water: WATER, count: COUNT, postcards: POSTCARDS,
};
export default PLAN;

// =====================================================================================================================
// PRESENCES (stage 3, the cast: src/realms/orchard/cast_stag.js; its log is docs/build/orchard/3-cast-presences.md).
// THE STAG'S ROUTE AS HE WALKS IT. STAG.walk (above) is the page's walk as written: a line with sharp corners, which the
// beasts family would cut by up to 2 m, onto the planting mounds. Here the same walk is laid as straights joined by
// arcs that he can follow without cutting anything (the tightest is 6.5 m; his own floor is 5): [s, d, the radius of
// the arc at that corner in metres (0: none)], in the page's frame. Measured (scratch: route.mjs) against every trunk
// and its mound (a mound is awash within 1.6 m of its trunk: the route keeps 3 m), the props, the crutches (2 m from
// the one under the low bough of (201.5, +10)), the plank walk (2.2 m from its middle) and the kept lamp (34 m).
//   s 110..120   along d -32.5, in the standing growth          s 125        through row -28
//   s 131..181   the side aisle at d -23.5, round the bend       s 188        half right through row -19
//   (197.3, -10) into the avenue, and across it a little squarer than the page's line, so that he can turn left
//   behind row +10 and come to the water beside the plank walk heading ALONG it, not at it: from the gate he is then
//   seen from the quarter and the flank (from dead astern, which the page's last leg gave the approaching boat, he is
//   a rump and a post), and his muzzle and antlers stay clear of the planks. He drinks at (206.8, +11.4) (the page:
//   (207.5, +12.5)). SECOND LOOK: the first holder had him drink at (208.8, +12.3): from a boat left to the current the
//   trunk of (210.5, +10) then stood on the line of sight to his head in the two seconds in which he lowers it (boat at
//   s 208 to 212). Two metres back, the line of sight to his head is clear of every trunk until the boat is in the gap
//   (scratch: design.mjs; pictures in the log). He drinks ON the last arc (6 m), heading about 40 degrees off the
//   avenue, his lips 2.5 m short of the planks. THE ROUTE RUNS ON 6 m BEYOND where he drinks, round to the west between
//   row +10 and the plank walk (`beyond`): the family holds him to his slow wade over the last 7 m of a route, which
//   cost three seconds on the way to the water, so the route's end is put out of the way and cast_stag.js stops him at
//   `drink` itself; and a stag whom a boat presses while he drinks has somewhere to go.
export const STAG_ROUTE = {
  way: [[110, -32.5, 0], [122.2, -32.5, 9], [127.4, -23.5, 9], [160, -23.5, 0], [172, -23.5, 0], [176, -23.5, 0], [180, -23.5, 0], [183.8, -23.5, 12],
    [197.3, -10, 0], [200.08, -7.22, 12], [206.07, 12.4, 6], [212.5, 12.4, 0]],
  // places on it that the staging names, in the page's frame (cast_stag.js turns each into metres along the route).
  // (Second look: `quicken`, `shown`, `past`: where he begins to lengthen his stride, where wave 3 of the tide leaves him
  // (the last place that is clear of the bow lantern's halo on its left) and where he is clear of it again on its right:
  // cast_stag.js, tide().)
  places: { row28: [124.8, -28], aisle: [131.4, -23.6], turnIn: [181.5, -23.3], row19: [187.6, -19], avenueIn: [197.3, -10], quicken: [200.4, -5.7], shown: [201.4, -2.9], mid: [202.3, 0], past: [203.2, 2.9], avenueOut: [205.5, 9.85], drink: [206.8, 11.4], beyond: [212.5, 12.4] },
  setOff: 60,                                                    // he sets off when the boat passes this page s
};
/** The stag's route as points [x, z] of the realm, about `step` metres apart: STAG_ROUTE.way with its corners rounded. */
export function stagRoute(step = 1.25, way = STAG_ROUTE.way) {
  const W = way.map(([s, d, r]) => { const p = xz(s, d); return { x: p[0], z: p[1], r: r || 0 }; }), pts = [];
  const push = (x, z) => { const l = pts[pts.length - 1]; if (!l || Math.hypot(x - l[0], z - l[1]) > 1e-6) pts.push([x, z]); };
  const line = (ax, az, bx, bz) => { const n = Math.max(1, Math.round(Math.hypot(bx - ax, bz - az) / step)); for (let i = 0; i <= n; i++) push(ax + (bx - ax) * i / n, az + (bz - az) * i / n); };
  let from = W[0];
  for (let i = 1; i < W.length; i++) {
    const a = W[i - 1], b = W[i], c = W[i + 1];
    if (!c || !b.r) { line(from.x, from.z, b.x, b.z); from = b; continue; }
    const ul = Math.hypot(b.x - a.x, b.z - a.z), vl = Math.hypot(c.x - b.x, c.z - b.z), u = [(b.x - a.x) / ul, (b.z - a.z) / ul], v = [(c.x - b.x) / vl, (c.z - b.z) / vl];
    const cross = u[0] * v[1] - u[1] * v[0], phi = Math.atan2(Math.abs(cross), u[0] * v[0] + u[1] * v[1]);
    if (phi < 1e-3) { line(from.x, from.z, b.x, b.z); from = b; continue; }
    // the arc: it leaves the first straight `t` metres short of the corner and joins the second `t` metres past it
    const t = Math.min(b.r * Math.tan(phi / 2), ul * 0.98, vl * 0.98), r = t / Math.tan(phi / 2), sgn = Math.sign(cross);
    const A = [b.x - u[0] * t, b.z - u[1] * t], C = [A[0] - u[1] * sgn * r, A[1] + u[0] * sgn * r], a0 = Math.atan2(A[1] - C[1], A[0] - C[0]), n = Math.max(2, Math.round(r * phi / step));
    line(from.x, from.z, A[0], A[1]);
    for (let k = 1; k <= n; k++) { const ang = a0 + sgn * phi * k / n; push(C[0] + Math.cos(ang) * r, C[1] + Math.sin(ang) * r); }
    from = { x: b.x + v[0] * t, z: b.z + v[1] * t };
  }
  return pts;
}

// =====================================================================================================================
// SWIMMERS (stage 3, the cast: src/realms/orchard/cast_fish.js; its log is docs/build/orchard/3-cast-swimmers.md).
// THE CARP'S FIVE LOOPS. CARP (above) says where the page puts each group; these are the closed loops they swim, in the
// page's frame: [s, d, y of a carp's MIDDLE (its back stands 0.09 m higher), width of the file there (1 unless given)],
// in the order they are swum. The fish family lays a smooth closed curve through the points (cast_fish.js gives them to
// it as realm positions, never as the family's own { s, d }, which are the engine's path). `speed` is m/s over the
// ground; `start` is how far round its loop a school's tail is when the area begins (0..1).
// Fish see no scenery, so each loop was measured (scratch: routes.mjs, which lays the same curve) against every planting
// mound (2.6 m across, its top 0.25 m under: a carp's belly would be in it), trunk, prop, crutch, trestle of the plank
// walk, the crate, the islet, the hive stand and the shallowest of the fallen stones, with the file's own half width
// (0.67 m) taken off: the least water left beside the file is given for each. They were laid over the petals' standing
// map (set.js, coverMap), so that each passes UNDER drifts (where its backs open windows) and through open water near
// the boat's line (where the backs themselves are seen).
//   lane    37.4 m. East along the lane's south bank a metre and a half to port of the keel line (a carp dead ahead on
//           the keel line is hidden by the rider's own bow from five metres in: this leg is in view to the left of it,
//           and under the bank's petals), round, west again in open water, round the crutch under the low bough of
//           (66.5, -10) and under its raft. 0.61 m beside the file at that tree's mound.
//   crate   22.7 m. West under the lane's north bank, round the crate's lee through its raft (2 m from the crate), north
//           of the crutch under the low bough of (57.5, +10), back east. 0.68 m at that crutch.
//   pond    40.2 m. A kidney on the pond's north side, outside the props: its outer leg under the arc of petals on the
//           pond's rim, its inner leg in open water. 2.3 m from the prop at (108, +13).
//   walk    31.2 m. Round four trestles of the plank walk: under the planks between the trestles at s 158.1 and 161.1,
//           under the bare trestles at s 170.1 and 173.1 (the file narrowed there), bulging out between the mounds
//           toward the rows' windrows. 0.53 m at the mound of (165.9, +19.1), 0.67 m at a trestle.
//   stones  24.7 m. An oval through the gap, astride the lane, over the fallen stones (their tops 0.4 to 0.8 m down;
//           the three that stand within 0.36 m of the surface, at (214, -3.2) and (216, -6.5), are kept off).
export const CARP_ROUTES = {
  lane: { n: 5, speed: 0.38, start: 0.995, way: [[68.4, -2.78, -0.23], [65.5, -2.69, -0.22], [61.5, -2.58, -0.21], [57.5, -2.46, -0.21], [55.2, -2.45, -0.22], [54.1, -2.86, -0.25], [53.7, -3.75, -0.27], [54.1, -4.66, -0.28], [55.2, -5.15, -0.29],
    [58.5, -5.29, -0.3], [61.5, -5.38, -0.3], [63.6, -5.99, -0.29], [65.2, -7.04, -0.27], [66.8, -7.38, -0.25], [68.3, -6.83, -0.24], [69.6, -5.76, -0.25], [70.25, -4.68, -0.26], [70.2, -3.78, -0.25], [69.6, -3.06, -0.24]] },
  crate: { n: 4, speed: 0.3, start: 0.5, way: [[54.6, 0.7, -0.26], [57, 0.45, -0.22], [58.9, 0.85, -0.22], [59.9, 2.1, -0.21], [59.95, 3.6, -0.21], [59.6, 5.1, -0.23], [58.3, 6.75, -0.27], [55.8, 6.7, -0.3], [53.5, 5.5, -0.3], [52.3, 3.5, -0.3], [52.8, 1.7, -0.28]] },
  pond: { n: 6, speed: 0.33, start: 0.2, way: [[117.49, 21.23, -0.22], [114.47, 21.93, -0.21], [111, 22.2, -0.21], [107.53, 21.93, -0.22], [104.51, 21.23, -0.23], [102.54, 19, -0.26], [103.72, 16.35, -0.29],
    [106.18, 15.78, -0.3], [108.7, 16.34, -0.3], [111, 16.5, -0.3], [113.3, 16.34, -0.3], [115.82, 15.78, -0.3], [118.28, 16.35, -0.29], [119.46, 19, -0.26]] },
  walk: { n: 5, speed: 0.3, start: 0.1, way: [[161.5, 11.3, -0.24], [162.6, 11.3, -0.22], [163.7, 11.85, -0.23], [164.6, 12.4, -0.24], [165.3, 12.55, -0.24], [166.0, 12.4, -0.24], [166.9, 11.85, -0.23], [168.0, 11.3, -0.22], [169.5, 11.2, -0.22], [170.9, 12.3, -0.24, 0.8], [171.6, 13.8, -0.24, 0.6], [171.6, 15.1, -0.25, 0.6], [171, 16.4, -0.27, 0.8],
    [169.4, 17.4, -0.28], [167.5, 17, -0.3], [165.8, 16.5, -0.3], [164, 17, -0.28], [161.6, 17.3, -0.28], [160.3, 16.3, -0.29, 0.8], [159.72, 15.1, -0.27, 0.6], [159.72, 13.9, -0.26, 0.6], [160.0, 12.8, -0.26, 0.8], [160.55, 11.8, -0.25]] },
  stones: { n: 4, speed: 0.4, start: 0.3, way: [[211.3, 0.9, -0.24], [212.25, 2.49, -0.226], [214.75, 3.47, -0.204], [217.85, 3.47, -0.204], [220.35, 2.49, -0.226], [221.3, 0.9, -0.24], [220.35, -0.69, -0.226], [217.85, -1.67, -0.204], [214.75, -1.67, -0.204], [212.25, -0.69, -0.226]] },
};

// =====================================================================================================================
// WADERS (stage 3, the cast: src/realms/orchard/cast_waders.js; its log is docs/build/orchard/3-cast-waders.md).
// THE EGRETS' PLACES AND THE WAYS THEY FLY. EGRETS (above) is the page's table as written; this is the same table as
// the birds use it. Everything is in the page's frame: a place [s, d], a point of a flight [s, d, h] with h the height
// of the bird's BODY over the water (the page: 1.2 to 2.5 m). The wader family knows no scenery and flies a smooth
// curve through whatever points it is given, so every flight is laid here, by hand, as
//       the way OUT of a place onto a lane  +  the lane  +  the way IN from the lane to a place.
// LANES run down the side aisles, where nothing stands: RI and LI between rows 10 and 19 (right and left), RO and LO
// between rows 19 and 28. Through the pond the right-hand lanes pass north of the islet and its props; the left-hand
// ones have one door only, under the arch between its two props (the boat's own way). From s 155 RI lies over the
// plank walk. LA (below) is the one lane that is not a side aisle. Each lane was measured (scratch: routes.mjs, which lays the family's own curve) against every trunk and
// limb of every tree, every twig end that carries blossom, the crutches, the oldest tree's props, limbs and islet,
// the hives, the wall and its piers, the ladders, the cart and the kept lamp; the log has the least clearances.
// A PLACE: `mound` is the page's name for a tree (its real trunk stands up to 0.44 m from that: plan.trees) and `by`
// where the bird stands from that trunk, in metres [down the aisle, to the right]: 1.2 m off, so that a wing clears the
// bark when it comes and goes; `at` a place given outright; `look` the way it faces [down the aisle, to the right];
// `depth` the water it stands in; `dry` + `y` a deck, a stone or the wall's top (the height is the model's: the module
// finds it); `flush: 0` where it lets the boat pass (`flush`, `flushSlow`: a place's own distances, where the page's 14 m
// and 10 m would not do); `out` / `in` the ways onto and off each lane.
export const EGRET_WAYS = {
  lanes: {
    RI: [[62, 14.6, 1.6], [71, 14.6, 1.6], [80, 14.6, 1.6], [89, 14.7, 1.6], [97, 16.3, 1.5], [105, 18.2, 1.45], [113, 18.6, 1.45], [121, 17.4, 1.45], [129, 15.3, 1.5], [137, 14.6, 1.6], [145, 15.3, 1.7],
      [151, 16.4, 2.0], [157, 15.9, 1.9], [163, 14.9, 1.9], [172, 14.5, 1.9], [181, 14.5, 1.9], [190, 14.5, 1.9], [199, 14.5, 1.9], [207, 14.5, 2.0]],
    RO: [[62, 23.5, 1.6], [71, 23.5, 1.6], [80, 23.5, 1.6], [89, 23.5, 1.6], [98, 23.5, 1.6], [107, 23.5, 1.6], [116, 23.5, 1.6], [125, 23.5, 1.6], [134, 23.5, 1.6], [143, 23.5, 1.6], [152, 23.5, 1.6],
      [161, 23.5, 1.6], [170, 23.5, 1.6], [179, 23.5, 1.6], [188, 23.5, 1.6], [197, 23.5, 1.6], [206, 23.5, 1.7]],
    LI: [[62, -14.6, 1.6], [71, -14.6, 1.6], [80, -15.1, 1.6], [89, -15.3, 1.6], [97, -15.4, 1.5], [105, -15.7, 1.45], [113, -15.75, 1.4], [121, -15.2, 1.45], [129, -14.6, 1.5], [137, -14.5, 1.6], [146, -14.5, 1.6],
      [155, -14.5, 1.6], [164, -14.5, 1.6], [173, -14.5, 1.6], [182, -14.5, 1.6], [191, -14.5, 1.6], [200, -14.5, 1.7], [207, -14.5, 1.8]],
    LO: [[62, -23.5, 1.6], [71, -23.5, 1.6], [80, -23.5, 1.6], [89, -23.5, 1.6], [97, -23.3, 1.6], [104, -21.5, 1.5], [109, -18.2, 1.45], [113.2, -16.2, 1.4], [118, -16.6, 1.45], [123, -19.5, 1.5], [129, -23.1, 1.55],
      [137, -23.5, 1.6], [146, -23.5, 1.6], [155, -23.5, 1.6], [164, -23.5, 1.6], [173, -23.5, 1.6], [182, -23.5, 1.6], [191, -23.5, 1.6], [200, -23.5, 1.7], [207, -23.5, 1.8]],
    // LA (the second holder's): the LEFT EDGE OF THE SECOND AVENUE ITSELF, 7.6 m from the centre line: inside row -10,
    // under its three long low boughs, between each one's trunk and its crutch (2.1 m either side of the bird's middle).
    // It is the one lane a rider who looks straight ahead can see a bird pass on (a bird on a side aisle comes abreast
    // 14.5 m off, outside the picture, and is on the wall before it has come into it): the second bird's way to the wall.
    LA: [[162, -7.6, 1.35], [171, -7.6, 1.35], [180, -7.6, 1.35], [189, -7.6, 1.35], [197, -7.7, 1.4]],
    // RA (the third holder's): the same on the RIGHT edge of the avenue, under the low boughs of (165.5, +10) and
    // (183.5, +10) between trunk and crutch, over the fallen ladder at s 176 (its top end stands 0.5 m out of the water:
    // the bird's wingtips come no lower than 0.95 m). The page has the egrets pass the boat "on either side": this is the
    // third bird's way to the wall. It leaves the avenue at s 190, half right through rows +10 and +19, 7 m and more
    // from where the stag drinks.
    RA: [[173, 7.6, 1.5], [176.6, 7.6, 1.7], [180, 7.6, 1.5], [184.5, 7.6, 1.35], [189, 7.6, 1.35]],
  },
  low: [
    { name: 'first', seed: 21, stations: [
      { name: 'the mound of (48.5, +19)', mound: [48.5, 19], by: [1.25, -0.35], look: [0.88, -0.48], depth: 0.25,
        out: { RI: [[58.5, 15.0, 1.5]], RO: [[55, 20.9, 1.4], [60.5, 23.3, 1.6]] } },
      { name: 'the plank walk at (163, +14.5)', at: [163, 14.5], look: [0.82, -0.57], dry: 'plank', y: 0.4, flush: 11.5, flushSlow: 9,      // (14.3 m from the lane's middle: it lets a boat on the lane go by)
        in: { RI: [[150.5, 16.4, 2.0], [157, 15.7, 1.8]], RO: [[143.5, 23.4, 1.65], [148.8, 21.4, 1.7], [153.4, 18.2, 1.75], [158.3, 15.7, 1.75]] },
        // (RO from here and into the stile: the second holder's. RI runs on over the plank walk, 3 m from where the stag
        // drinks at (206.8, +11.4): once he is near his water it is no way for a bird, and there was no other)
        out: { RI: [[171, 14.5, 1.9]], RO: [[166.6, 16.4, 1.8], [170, 19.0, 1.7], [174, 21.6, 1.65], [180, 23.2, 1.6]] } },
      { name: 'the stile at (216, +14.5)', at: [216, 14.5], look: [0.62, -0.78], dry: 'stile', y: 1.0, flush: 0,
        in: { RI: [[206.5, 14.5, 2.2]], RO: [[205.5, 23.4, 1.9], [211.4, 21.0, 2.2]] } },
    ] },
    { name: 'second', seed: 22, stations: [
      { name: 'the mound of (66.5, -19)', mound: [66.5, -19], by: [1.25, 0.35], look: [0.88, 0.48], depth: 0.25,
        out: { LI: [[76.5, -15.2, 1.5]], LO: [[73, -20.8, 1.4], [78.5, -23.2, 1.6]] } },
      { name: 'the mound of (138.5, -19)', mound: [138.5, -19], by: [0.15, 1.3], look: [0.97, 0.24], depth: 0.25,
        in: { LI: [[130.5, -15.0, 1.5]], LO: [[121, -15.6, 1.45], [130.5, -15.0, 1.5]] },
        out: { LA: [[144, -15.2, 1.35], [148.6, -12.6, 1.4], [152.1, -9.8, 1.4], [156.3, -8.0, 1.35]], LI: [[147.5, -14.7, 1.5]], LO: [[144.5, -19.3, 1.4], [150, -22.9, 1.6]] } },
      { name: 'the wall top at (216, -12)', at: [216, -12], look: [0.62, 0.78], dry: 'wall', y: 1.25, flush: 0,
        in: { LA: [[202, -8.4, 1.6], [205.6, -9.9, 1.95], [209.6, -12.4, 2.3]], LI: [[207, -14.0, 2.4]], LO: [[188, -23.4, 1.6], [193.5, -21.5, 1.6], [197.5, -18.6, 1.65], [202, -15.8, 1.9], [207.5, -14.0, 2.4]] } },
    ] },
    { name: 'third', seed: 23, stations: [
      { name: 'the islet shore at (107.5, +5.4)', at: [107.32, 5.68], look: [-0.3, 0.95], depth: 0.15, shore: true,
        out: { RI: [[110, 9.9, 1.3], [114, 12.6, 1.45], [119.5, 15.6, 1.45]], RO: [[110.5, 10.3, 1.3], [113.5, 15.5, 1.45], [118, 20.6, 1.5], [124, 23.3, 1.6]] } },
      { name: 'the mound of (147.5, +19)', mound: [147.5, 19], by: [0.15, -1.3], look: [0.97, -0.24], depth: 0.25,
        in: { RI: [[139, 15.4, 1.5]] },
        // (RA, last: behind the hives, across the plank walk where it begins, through row +10 midway between its trunks)
        out: { RO: [[153.5, 17.1, 1.4], [158.2, 17.6, 1.5], [162, 19.4, 1.55], [166.5, 21.6, 1.6], [172, 23.1, 1.6]], RI: [[156.5, 15.9, 1.9]],
          RA: [[152.6, 17.0, 1.5], [155.8, 16.0, 1.6], [158.4, 13.9, 1.6], [160.5, 11.4, 1.5], [162.6, 9.3, 1.42], [165.0, 8.0, 1.38], [168.5, 7.6, 1.4]] } },
      { name: 'the wall top at (216, +22)', at: [216, 22], look: [0.62, -0.78], dry: 'wall', y: 1.25, flush: 0,
        in: { RO: [[207, 23.0, 2.4]], RI: [[188.5, 14.6, 1.9], [193.5, 16.3, 1.9], [197.3, 19.1, 1.9], [201.5, 21.7, 2.0], [207, 23.0, 2.4]],
          RA: [[193.2, 8.1, 1.4], [196.6, 9.5, 1.5], [199.2, 11.9, 1.6], [201.2, 14.7, 1.75], [203.4, 17.6, 1.85], [206.2, 20.3, 2.0], [210.0, 22.1, 2.3]] } },
    ] },
    { name: 'fourth', seed: 24, stations: [
      { name: 'the daughter stem\'s mound at (114.9, -24.6)', at: [115.75, -24.3], look: [0.8, 0.6], depth: 0.25,      // (0.9 m further from the arch than the page's point: there a wing opens into the limb)
        out: { LI: [[120.5, -20.4, 1.3], [125.8, -16.6, 1.45]], LO: [[121.5, -23.6, 1.3], [129, -23.4, 1.5]] } },
      { name: 'the mound of (192.5, -28)', mound: [192.5, -28], by: [0.15, 1.3], look: [0.97, 0.24], depth: 0.25,
        in: { LI: [[168, -14.8, 1.6], [173.5, -16.6, 1.6], [178.6, -19.6, 1.55], [184.5, -22.8, 1.5]], LO: [[184.5, -23.6, 1.5]] },
        out: { LO: [[200.5, -23.6, 1.6]] } },
      // (not on the page, which gives this bird two places: where it settles when "the egrets go to the wall")
      { name: 'the wall top at (216, -24.5)', at: [216, -24.5], look: [0.62, 0.78], dry: 'wall', y: 1.25, flush: 0,
        in: { LO: [[207.5, -23.7, 2.4]], LI: [[188, -14.6, 1.7], [193.5, -16.4, 1.7], [197.3, -19.2, 1.75], [201.5, -21.8, 2.0], [207.5, -23.5, 2.4]] } },
    ] },
  ],
  // The two that roost in the oldest tree. The page puts them at (108, +4) 15 m up and (115, -6) 20 m up, and the tree's
  // model has those places (roost_1, roost_2: shared.tree.roosts). Neither can be seen from the water: the first stands
  // on top of a limb a metre thick and is hidden by it from everywhere below, the second is behind blossom from the whole
  // of the boat's line (strips: the log). The second holder stood them by two of the tree's perches (`perch`, `along`,
  // `face`: kept below as what is fallen back on); the crown was remade after that and both were behind blossom again.
  // (third holder) WHERE A WHITE BIRD CAN BE SEEN IN THIS TREE AT ALL: looked up at, an egret is a sliver of lilac white
  // among a thousand dabs of lilac white; on top of a great limb it is hidden by the limb itself. It reads in one kind
  // of place only: on the bare outer end of a slender bough that reaches out from under the crown, where the sky is
  // behind it. So: `limb`, the tree's own name for a limb (shared.tree.paths); `at`, metres from that limb's root;
  // `turn`, degrees it stands turned to its left from the way out along the limb (both stand side on to the boat's line,
  // looking away from it); `idle`, how it stands; `near`, about where that is on the page (s, d, metres up), for the
  // neighbours (the starlings' roost, the bats' beats: the module publishes the true place in shared.cast.waders.roosts).
  //   the first   the end of the south bough (s_w), 10.2 m up, over the boat's line at s 111.5: ahead and to the left of
  //               the bow against the sky from s 92 to s 106 (20 to 45 degrees up), overhead at the arch. It is the one
  //               that opens its wings when the starlings arrive
  //   the second  the outer part of the south-east skirt limb (sk_se), 8.4 m up, 12 m to the left of the boat's line at
  //               s 98: up and to the left from s 84 to s 100
  // If the tree has no such limb, or it has been cut back: `perch` and `along`; failing those, `roost`, the tree's own.
  roost: [
    { name: 'the end of the south bough', seed: 31, limb: 's_w', at: 13.4, turn: 45, idle: 'stand', near: [111.7, -17.4, 10.2], perch: 29, along: -1.4, face: 1, roost: 0 },
    { name: 'the south-east skirt limb', seed: 32, limb: 'sk_se', at: 16.5, turn: -135, idle: 'stand', near: [98.0, -14.2, 8.4], perch: 118, along: 0.5, face: 1, roost: 1 },
  ],
};
/** The reference line's own directions at s, in the realm: [down the aisle (x, z), to the right (x, z)]. */
function frameAt(s) { const th = turned(s); return [[Math.sin(th), -Math.cos(th)], [Math.cos(th), Math.sin(th)]]; }
/** Where an egret's place is, in the realm: { x, z, s, d, heading (rotation.y of a bird that faces as `look` says),
 *  tree ([x, z] of the trunk it stands by, or null) }. */
export function egretPlace(st) {
  let s, d, x, z, tree = null;
  if (st.mound) {
    let best = null, k = 1e9;
    for (const t of TREES.trees) { const q = Math.hypot(t.s - st.mound[0], t.d - st.mound[1]); if (q < k) { k = q; best = t; } }
    const [T, R] = frameAt(best.s), by = st.by || [0, 0];
    x = best.x + T[0] * by[0] + R[0] * by[1]; z = best.z + T[1] * by[0] + R[1] * by[1]; tree = [best.x, best.z];
    const l = locate(x, z); s = l.s; d = l.d;
  } else { [s, d] = st.at; [x, z] = xz(s, d); }
  const [T, R] = frameAt(s), look = st.look || [1, 0], lx = T[0] * look[0] + R[0] * look[1], lz = T[1] * look[0] + R[1] * look[1];
  return { x, z, s, d, heading: Math.atan2(lx, lz), tree };
}
/** The lanes two places of one bird share (the ways a flight between them can be laid), in the order they are given. */
export function egretLanes(bird, from, to) {
  const a = EGRET_WAYS.low[bird].stations[from], b = EGRET_WAYS.low[bird].stations[to];
  return a && b && a.out && b.in ? Object.keys(a.out).filter((k) => b.in[k]) : [];
}
/** A flight of the `bird`-th low egret from its place `from` to its place `to` down a lane: the points between, as the
 *  wader family takes them ([[x, y, z], ...] in the realm, y the height of its body over the water); null if no such way. */
export function egretRoute(bird, from, to, lane) {
  const a = EGRET_WAYS.low[bird].stations[from], b = EGRET_WAYS.low[bird].stations[to], L = EGRET_WAYS.lanes[lane];
  if (!a || !b || !L || !a.out || !a.out[lane] || !b.in || !b.in[lane]) return null;
  const out = a.out[lane], inn = b.in[lane], sIn = out[out.length - 1][0], sOut = inn[0][0];
  const pts = [...out, ...L.filter(([s]) => s > sIn + 4 && s < sOut - 4), ...inn];
  return pts.map(([s, d, h]) => { const p = xz(s, d); return [p[0], h, p[1]]; });
}
