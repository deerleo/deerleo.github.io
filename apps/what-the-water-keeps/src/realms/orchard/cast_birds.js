// The orchard in flood: the cast, group "Birds" (stage 3). The log is docs/build/orchard/3-cast-birds.md.
//
// What lives here (docs/art/orchard.md, section 5; docs/life/birds.md is the family's page):
//   THE MURMURATION     12,000 starlings and the 3,000 larger ones the mirror draws (the page's ceilings: 16,000 and 4,000).
//                       It works the sky far off to the right of the oldest tree's dome, comes nearer as the boat travels
//                       (by the boat's place, like the dusk: stop, and it stays where it is), and at s 98 it roosts: it
//                       draws out into a ribbon, goes once round the crown clockwise at 35 m, over the boat, and pours
//                       down a funnel into the top of the dome. It comes to the tree, never to the boat.
//   THE ROOSTED         300 starlings on the upper wood of the oldest tree (shared.tree.perches without the two egret
//                       roosts), after the roost only: they shuffle, sidestep, preen, and one flits to another limb about
//                       every two seconds. They ride the wood's own sway.
//   THE BATS            16, each on a beat of its own kind: 4 in the strip of sky over the first avenue's lane, 5 on a ring
//                       round the oldest tree under the hem of its crown, 4 over the second avenue, 3 skimming the lane
//                       (the pool and the pond; s 136 to 172; s 178 to 208). Fourteen hang under the loft's tie beams and
//                       leave in ones and twos when the boat passes s 14. Only the skimmers touch the water.
//
// THE FAMILY'S BAT SEES NO SCENERY and hunts an upright cylinder (a `zone`). So every beat here is a CHAIN OF SMALL ZONES
// laid in air that is measured free at load (against shared.blossom's lobes, the oldest tree's limbs, its props, the
// trunks: "the air", below), and this module walks each bat along its chain by giving it the next zone in turn.
//
// THEIR ORDINARY LIFE runs by itself: the flock's approach by the boat's place, the roost on a clock of this module's
// own from s 98 (a boat set down further on finds it as far gone as its place asks, or over), the bats' release at s 14.
// THE STAGING TAKES THE ROOST OVER with
//     const B = shared.cast.birds;  B.staged = true;                 // in its build(): this module then starts nothing at s 98
//     stage.cue('roost', { s: F.pathS(98), settle: () => B.roost.settle() }, () => {});
//     B.roost.run(stage.clock('roost', (s) => (s - F.pathS(98)) / 1.6));        // every frame, in update (it does nothing before 0)
// or beat by beat with the family's own controls on B.flock and B.roosted and the places in B.roost (ring, mouth, into).
// The bats need no staging; what the tide may ask of them is B.skim (see the foot of build()).
// NOTHING HERE PLAYS A SOUND AND NOTHING HERE PLACES A CUE: the sound hooks are B.on.* (null until somebody sets them).
//
// The page's frame everywhere (shared.frame.at / plan.xz), never the engine's path.
//
// Developer switches of this module (in the address):
//   &bskip=flock,roosted,bats   leave some of it out (for measuring what each costs)
//   &broost=<s>      the roost's clock reads 0 at that many seconds of the realm's time, wherever the boat is
//   &bbats=<s>       the bats leave the loft at that many seconds of the realm's time, wherever the boat is
//   &bmix=<0..1>     the flock held that far between its far loop (0) and its near loop (1)
//   &bshow=1         draws the bats' zones (rings at the foot and the top of each) and the roost's ring, mouth and places
//   &beye=x,y,z      the developer's eye moved off the rider's seat: metres to starboard, up, aft (to look down on a beat)
//   &bfov=<degrees>  a long lens (study only)
//   &bwatch=<i>      the eye turns to bat i every frame (study only);  &bwatch=flock: to the flock's centre
//   &bdebug=<s>      writes .shots/orchard_bi_debug.json at that many seconds: the zones as fitted, where every bat is and
//                    what it has done (dips, how near the eye, how near any wood), the perches and their boughs, the roost
//   &bn=<count>      the flock's count (the mirror's flock a quarter of it)
//   &bdip=<s>        seconds between a skimmer's dips (12: every 9 to 15 s), to catch one in a picture;  &bmark=1 paints the roosted red, to find them
//   &bdabs= &bveil= &bscale= &bfog= &binto=      the flock's ink, its far birds' size, its size, its share of the fog; the height its pour ends at
import * as THREE from 'three';
import { makeFlock, makeMurmuration, loop, Route } from '../../engine/life/birds.js';

const Q = new URLSearchParams(location.search);
const num = (k, d) => (Q.has(k) && Q.get(k) !== '' && isFinite(+Q.get(k)) ? +Q.get(k) : d);
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const SKIP = new Set((Q.get('bskip') || '').split(',').map((v) => v.trim()).filter(Boolean));

// ---- the numbers (the page's, and what was settled in pictures: see the log)
const FLOCK = {
  count: 12000, mirror: 3000, keepOut: 30,
  // THE FAR LOOP, as the reveal sees it (page: "300 m off, 25 degrees right of the axis, 9 to 13 degrees up"). From the lane
  // the right-hand row's crowns stand 17 to 22 degrees high at that bearing, so the page's 9 to 13 degrees is behind
  // blossom from every place on the lane: the flock works the first sky ABOVE them, in the notch between the dome's right
  // shoulder and the row. `from`, `d`: the page's (s, d) of the eye it is laid out from; `off` (metres along the ground),
  // `right` (degrees right of the avenue's axis), `up` (degrees): where its middle is from there; size: along the line
  // of sight, across it (it is seen broadside); tilt: metres its far side is higher.
  far: { from: 28, d: 0, off: 300, right: 20, up: 23, size: [60, 126], tilt: 12 },
  // THE NEAR LOOP (page: "from s 70: 140 m off, just right of the oldest tree's top"; and by s 98 "120 m beyond the tree
  // and 40 m up"). Neither can be seen: from s 60 on the dome itself fills the sky ahead to 55 degrees, and from under
  // the crown nothing beyond the tree shows at all. The one sky a rider under the crown's east side has is to the SOUTH,
  // over the rows beside the pond, between the skirts of the great crown: so the flock comes round to there, about
  // 125 m off, and is seen in it as the boat passes the lamp, before it draws out and comes to the tree.
  near: { from: num('bnfrom', 72), d: -1.5, off: num('bnoff', 117), right: num('bnright', 12), up: num('bnup', 33), size: [40, 84], tilt: 10 },
  approach: [44, 76],                                      // the boat's page s over which it comes from the one to the other
  cloud: { length: 120, width: 40, depth: 14 },            // the page: a cloud 120 m long and 40 m deep
  dabs: 2.0, veil: 2.4, scale: 1.3, fog: 0.1,              // how much ink the far flock lays down, and how little of the realm's fog it takes (with the family's 1 and 0.3 it is a pale smoke on this dusk's deep teal: see the log)
  ribbon: { length: 200, width: 12, depth: 6, fold: 3, speed: 20 },      // the page: a band 12 m deep, 200 m long, 20 m/s
  join: num('bjoin', 6),                                    // seconds it takes to come from its loop in the sky onto the ring round the crown
  // THE ROOST (page, "The roost"): seconds on its clock
  at: 98,                                                  // the page's s where it begins
  pace: 1.6,                                               // m/s of path that keeps a paddling rider's clock in step (the pond's current)
  times: { round: 4, pour: 11, pourFor: 7, roost: 13, roostFor: 5, gone: 19.5, over: 30 },
  // ROUND THE CROWN, clockwise seen from above (west, north, east, south). The rider is UNDER the crown for the whole of the
  // roost and looks ahead: south-west as far as the arch, then west and north-west for the mouth of the second avenue. A level
  // ring 35 m up over the roof is over the rider's head and out of the picture (pictures: the log). So the ring is a
  // tilted, lopsided loop: 30 to 37 m up where it crosses the dome's east shoulder and passes over the boat, and out beyond
  // the crown's hem and down to about 20 m over the south-west and the west, where the forward view has sky above the rows:
  // there the ribbon crosses the picture, 40 to 50 m off. off: its middle from the dome's top, metres [west, north];
  // mid, tilt: metres up at its middle height, and how much lower its lowest place is (lowAt: degrees from west through north)
  ring: { off: [num('bringds', 12), num('bringdd', -6)], radius: num('bringr', 36), mid: num('bringy', 28), tilt: num('bringtilt', 9), lowAt: num('bringlow', 330) },
  close: { radius: num('bcloser', 22), height: num('bclosey', 35), at: num('bcloseat', 9.5), over: num('bcloseover', 4) },      // before the pour the loop closes in over the top of the dome: from so many seconds on the roost's clock, over so many
  ringScale: num('bringscale', 2.0), roostScale: num('broostscale', 1.6),      // round the crown every bird is drawn this much larger than life (the cloud: `scale`): it is seen through the gaps of the vault only, against a deep sky, with nothing to measure it by; coming down inside the tree, where the limbs measure it, less
  // THE FUNNEL (see "the funnel" in build()). mouth: where the stream gathers, over the highest point of the dome: metres
  // up, radius. into: where the birds end: the page's (s, d) and metres up of the middle of that place, and its radii
  // [across, up, along]. share: how much of the pour one bird's own descent takes. shell: where in that place a bird ends
  // (the family's own number is 0.3: near its rim; 1: evenly out from its middle). swirl: how hard the stream turns.
  mouth: { y: num('bmouthy', 36.5), radius: num('bmouthr', 10) },
  into: { s: num('bintos', 129), d: num('bintod', 4), y: num('bintoy', 10), radii: [num('bintor', 5), num('bintoh', 3), num('bintor', 5)] },
  share: num('bshare', 0.45), shell: num('bshell', 0.5), swirl: num('bswirl', 1),
  keepIn: num('bkeepin', 13),                              // how near the eye a bird that is entering the tree may come (the flock in the air: keepOut)
  calm: { keepOut: 60, speed: 17, pourFor: 14, share: 0.6, hold: { off: 78, bearing: 315, height: 46, size: [40, 30] } },      // reduced motion: beyond 60 m, in from the far side at half speed (bearing: degrees from north through east, about the tree's top: 315 is north-west, the far side from the pond's lane)
};
const ROOSTED = { count: 300, room: 3, rooms: [3, 1, 2, 3, 2, 1, 3, 2], spread: 0.16, flit: { every: 1.5, range: [2, 6] }, clearOfEgret: 1.3, scale: num('brscale', 1.6), minPixels: 8,
  // the wood they sit on (see "where they sit"): above so many metres; no steeper than `slope` (the rise of a metre of it);
  // between these radii; `clear` of blossom by so much; a place every `step` metres tried, none within `apart` of another;
  // `most` places taken (three seats each), and at `least` so many (the model's perches fill up what is wanting)
  wood: { above: 9.2, slope: 0.62, thick: [0.035, 0.6], clear: 0.12, step: 0.45, apart: 0.7, most: 165, least: 118 },
  land: { over: 6.5, from: [4.5, 8], tries: 7 } };        // they come down out of the stream to their own places over so many seconds, each from so many metres up the way to the funnel
const BAT = {
  count: 16, scale: 1.4, keepOut: 3, calmKeepOut: 10,
  beats: ['av1', 'av1', 'av1', 'av1', 'tree', 'tree', 'tree', 'tree', 'tree', 'av2', 'av2', 'av2', 'av2', 'skimA', 'skimB', 'skimC'],
  out: [12, 15],                                           // the two that are out already
  leave: 14,                                               // the boat passes this page s: they leave
  // seconds after that at which one lets go (ones and twos, six seconds in all), and who: those with furthest to go first
  drops: [[0.0, 9], [0.3, 10], [1.0, 11], [1.75, 14], [1.95, 4], [2.6, 5], [3.1, 6], [3.3, 7], [3.95, 8], [4.5, 13], [4.65, 0], [5.2, 1], [5.7, 2], [5.9, 3]],
  hang: 8.52,                                              // metres up: under the tie beams (their undersides are at 8.7)
  door: { s: 30.5, y: [3.6, 5.6] },                        // the first zone outside the door, and how high they go out through it
  av1: { s: [34, 41, 48, 55, 62, 69, 76], r: 3.0, band: [2.5, 8.5], thick: 2.0, must: [3.0, 4.6] },       // the strip of sky over the lane: every place holds 3.0 to 4.6 m, so a bat can go on from any to the next
  av2: { s: [140, 147, 154, 161, 168, 175, 182, 189, 196, 203, 209], r: 3.0, band: [2.5, 8.5], thick: 2.0, must: [3.0, 4.6] },
  bridge: { s1: [81], s2: [136], r: 2.4, band: [0.9, 4.8], thick: 1.6 },      // between an avenue's strip of sky and the low way through the pond
  mid: { s: [86, 91, 96, 101, 106, 111, 116, 121, 126, 131], r: 2.2, band: [0.9, 3.0], thick: 0.9 },      // the way through the pond: along the lane, under the lamp limb and the arch
  ring: { radius: 19, n: 16, r: 3.4, band: [1.2, 10], thick: 1.3 },
  skim: { r: 2.4, band: [0.3, 0.9], A: [86, 91, 96, 101, 106, 111, 116, 121, 126, 131], B: [136, 142, 148, 154, 160, 166, 172], C: [178, 184, 190, 196, 202, 208] },
  dip: num('bdip', 12),                                    // seconds between a skimmer's dips (the family: 0.75 to 1.25 of it: 9 to 15 s). &bdip=<s> (developer): another interval, to catch one in a picture
  mark: { channel: 'lane', radius: num('bmarkr', 0.16), strength: num('bmarks', 0.8) },  // the pinhole it leaves in the petals (&bmarkr=, &bmarks=: to try others)
};

export async function build(ctx, plan, shared) {
  const { kit } = ctx, F = shared.frame, here = shared.here || { s: 0, d: 0 };
  const cast = shared.cast = shared.cast || {};
  const tree = shared.tree || {}, calm = !!ctx.reducedMotion;
  const V = (s, d, y = 0) => F.at(s, d, y);
  const rnd = ctx.rng(981);
  const debug = { notes: [], zones: [], bats: [], perches: {}, roost: {} };
  const treeAt = tree.centre ? tree.centre.clone() : V(plan.tree.at[0], plan.tree.at[1]);
  const treeTop = tree.top ? tree.top.clone() : V(114, 0, 33);
  const pathS98 = F.pathS(FLOCK.at);

  // &beye=x,y,z, &bfov=<degrees> (developer): the eye moved off the rider's seat; a long lens
  if (Q.has('beye')) { const q = Q.get('beye').split(',').map(Number), cam = ctx.engine.camera; if (q.length === 3 && q.every(Number.isFinite)) { cam.position.set(q[0], q[1], q[2]); ctx.onDispose(() => cam.position.set(0, 0, 0)); } }
  const bfov = num('bfov', 0);
  if (bfov) { const cam = ctx.engine.camera, was = cam.fov; ctx.onDispose(() => { cam.fov = was; cam.updateProjectionMatrix(); }); }

  // ============================================================================================== the air
  // What stands in a bat's way, as balls and round timbers, kept in a grid of the plan: every lobe of blossom
  // (shared.blossom.all: the avenue's crowns and the oldest tree's), the twig ends of the oldest tree's low limbs (a spray
  // of flowers grows on each), its limbs and great boughs along their axes with their radii (shared.tree.paths), its bole,
  // its props, the pole ladder, the daughter stem, the kept lamp, every avenue trunk and crutch. solid(x, y, z, m) says
  // whether a point is within m metres of any of them (or under the islet's ground).
  const air = (() => {
    const CELL = 4, REACH = 1.3, grid = new Map();
    const key = (i, j) => (i + 4096) * 8192 + (j + 4096);
    const put = (x0, x1, z0, z1, it) => { for (let i = Math.floor(x0 / CELL); i <= Math.floor(x1 / CELL); i++) for (let j = Math.floor(z0 / CELL); j <= Math.floor(z1 / CELL); j++) { const k = key(i, j); let l = grid.get(k); if (!l) grid.set(k, l = []); l.push(it); } };
    let balls = 0, caps = 0;
    const ball = (x, y, z, r) => { balls++; put(x - r - REACH, x + r + REACH, z - r - REACH, z + r + REACH, [0, x, y, z, r]); };
    const cap = (a, b, ra, rb = ra) => { caps++; const r = Math.max(ra, rb) + REACH; put(Math.min(a.x, b.x) - r, Math.max(a.x, b.x) + r, Math.min(a.z, b.z) - r, Math.max(a.z, b.z) + r, [1, a.x, a.y, a.z, b.x - a.x, b.y - a.y, b.z - a.z, ra, rb]); };
    const P = (x, y, z) => ({ x, y, z });
    if (shared.blossom && shared.blossom.all) for (const L of shared.blossom.all) if (L.kind !== 'mote') ball(L.c.x, L.c.y, L.c.z, L.rad);
    if (tree.tips) for (const t of tree.tips) if (t.low) ball(t.x, t.y, t.z, 0.4);
    if (tree.paths) for (const l of tree.paths) for (let i = 0; i < l.path.length - 1; i++) cap(l.path[i], l.path[i + 1], l.radius[i], l.radius[i + 1]);
    cap(P(treeAt.x, -1, treeAt.z), P(treeAt.x, 7.2, treeAt.z), 2.7);                                                    // the bole to its fork
    const props = tree.props && tree.props.every(Boolean) ? tree.props : plan.tree.props.map(([s, d]) => V(s, d, 4));
    for (const p of props) cap(P(p.x, -1, p.z), P(p.x, p.y, p.z), 0.22);
    if (tree.ladder && tree.ladder.top && tree.ladder.foot) cap(tree.ladder.foot, tree.ladder.top, 0.35);
    if (tree.marks && tree.marks.daughter_foot && tree.marks.daughter_top) cap(tree.marks.daughter_foot, tree.marks.daughter_top, 0.3);
    const lamp = shared.lamp && shared.lamp.position ? shared.lamp.position : V(plan.lamp.flame[0], plan.lamp.flame[1], plan.lamp.flame[2]);
    ball(lamp.x, lamp.y, lamp.z, 0.45); cap(P(lamp.x, lamp.y, lamp.z), P(lamp.x, lamp.y + 1.2, lamp.z), 0.12);
    for (const t of plan.trees.trees) cap(P(t.x, -1, t.z), P(t.x, 3.0, t.z), 0.32);
    for (const c of shared.crutchFeet || []) cap(P(c.x, -1, c.z), P(c.x, 3.6, c.z), 0.2);
    const islet = tree.islet || null;
    const solid = (x, y, z, m) => {
      if (islet && y < 1.6 && Math.hypot(x - treeAt.x, z - treeAt.z) < 9.5 && y < islet.heightAt(x, z) + 0.35 + m) return true;
      const l = grid.get(key(Math.floor(x / CELL), Math.floor(z / CELL))); if (!l) return false;
      for (const it of l) {
        if (it[0] === 0) { const r = it[4] + m; if ((x - it[1]) * (x - it[1]) + (y - it[2]) * (y - it[2]) + (z - it[3]) * (z - it[3]) < r * r) return true; }
        else {
          const ux = it[4], uy = it[5], uz = it[6], l2 = ux * ux + uy * uy + uz * uz || 1e-9, t = clamp(((x - it[1]) * ux + (y - it[2]) * uy + (z - it[3]) * uz) / l2, 0, 1);
          const r = lerp(it[7], it[8], t) + m, ex = x - it[1] - ux * t, ey = y - it[2] - uy * t, ez = z - it[3] - uz * t;
          if (ex * ex + ey * ey + ez * ez < r * r) return true;
        }
      }
      return false;
    };
    // the points of a disc that a zone's bats may reach: its middle, a ring at half way, a ring at its edge
    const DISC = [[0, 0]]; for (let k = 0; k < 6; k++) DISC.push([0.55 * Math.cos(k * 1.047 + 0.3), 0.55 * Math.sin(k * 1.047 + 0.3)]); for (let k = 0; k < 12; k++) DISC.push([Math.cos(k * 0.5236), Math.sin(k * 0.5236)]);
    /** The free heights over a disc at (x, z), within `band`: [[lo, hi], ...] (0.2 m steps); reach: the disc's radius as flown. */
    const free = (x, z, reach, band, m = 0.45) => {
      const runs = []; let lo = null;
      for (let y = band[0]; y <= band[1] + 1e-6; y += 0.2) {
        let ok = true; for (const [ox, oz] of DISC) if (solid(x + ox * reach, y, z + oz * reach, m)) { ok = false; break; }
        if (ok) { if (lo == null) lo = y; } else if (lo != null) { runs.push([lo, y - 0.2]); lo = null; }
      }
      if (lo != null) runs.push([lo, band[1]]);
      return runs;
    };
    /** A zone fitted to free air: a free run of heights over the disc at (x, z) within `band`, at least `thick` metres tall
     *  (the tallest; or with `near` the one nearest that height); with `must: [lo, hi]` the run has to hold those heights
     *  (so that neighbours on a chain share them). The zone narrows (to half of r) before it gives up.
     *  Returns { x, z, r, y: [lo, hi] } or null. */
    const fit = (x, z, r, band, { thick = 1.2, near = null, must = null } = {}) => {
      for (let rr = r; rr >= r * 0.5 - 1e-6; rr *= 0.85) {
        const runs = free(x, z, rr * 1.15 + 0.3, band).filter((q) => q[1] - q[0] >= thick && (!must || (q[0] <= must[0] && q[1] >= must[1])));
        if (!runs.length) continue;
        runs.sort((a, b) => (near == null ? (b[1] - b[0]) - (a[1] - a[0]) : Math.abs((a[0] + a[1]) / 2 - near) - Math.abs((b[0] + b[1]) / 2 - near)));
        const q = runs[0], pad = q[1] - q[0] > 2 ? 0.25 : 0.1;
        return { x, z, r: +rr.toFixed(2), y: [+(q[0] + pad).toFixed(2), +(q[1] - pad).toFixed(2)] };
      }
      return null;
    };
    /** Is a point within m of WOOD (a limb, a bough, the bole, a prop, a trunk)? Blossom does not count. */
    const wood = (x, y, z, m) => {
      const l = grid.get(key(Math.floor(x / CELL), Math.floor(z / CELL))); if (!l) return false;
      for (const it of l) if (it[0] === 1) { const ux = it[4], uy = it[5], uz = it[6], l2 = ux * ux + uy * uy + uz * uz || 1e-9, t = clamp(((x - it[1]) * ux + (y - it[2]) * uy + (z - it[3]) * uz) / l2, 0, 1), r = lerp(it[7], it[8], t) + m; if ((x - it[1] - ux * t) ** 2 + (y - it[2] - uy * t) ** 2 + (z - it[3] - uz * t) ** 2 < r * r) return true; }
      return false;
    };
    /** Is a point within m of BLOSSOM (a lobe, a spray's twig end)? */
    const blossom = (x, y, z, m) => {
      const l = grid.get(key(Math.floor(x / CELL), Math.floor(z / CELL))); if (!l) return false;
      for (const it of l) if (it[0] === 0) { const r = it[4] + m; if ((x - it[1]) ** 2 + (y - it[2]) ** 2 + (z - it[3]) ** 2 < r * r) return true; }
      return false;
    };
    /** (developer) what stands within m of a point: 'islet', or the ball / timber itself; null if nothing. */
    const what = (x, y, z, m) => {
      if (islet && y < 1.6 && Math.hypot(x - treeAt.x, z - treeAt.z) < 9.5 && y < islet.heightAt(x, z) + 0.35 + m) return 'islet';
      const l = grid.get(key(Math.floor(x / CELL), Math.floor(z / CELL))); if (!l) return null;
      for (const it of l) {
        if (it[0] === 0) { const r = it[4] + m; if ((x - it[1]) ** 2 + (y - it[2]) ** 2 + (z - it[3]) ** 2 < r * r) return it.map((v) => +v.toFixed(2)); }
        else { const ux = it[4], uy = it[5], uz = it[6], l2 = ux * ux + uy * uy + uz * uz || 1e-9, t = clamp(((x - it[1]) * ux + (y - it[2]) * uy + (z - it[3]) * uz) / l2, 0, 1), r = lerp(it[7], it[8], t) + m; if ((x - it[1] - ux * t) ** 2 + (y - it[2] - uy * t) ** 2 + (z - it[3] - uz * t) ** 2 < r * r) return it.map((v) => +v.toFixed(2)); }
      }
      return null;
    };
    return { solid, wood, blossom, free, fit, what, count: { balls, caps } };
  })();
  debug.air = air.count;
  // &bsky=98,104,... (developer): WHAT SKY THE RIDER HAS at those page s on the composed line, written to
  // .shots/orchard_bi_sky.json: rows of elevation (87 degrees down to 0, by 3), columns of bearing (-180 to 177 by 3:
  // 0 is west, down the avenue; +90 north, the rider's right); '#' blossom or wood on that line of sight, '.' sky.
  if (Q.has('bsky')) {
    const out = {};
    for (const s of Q.get('bsky').split(',').map(Number)) {
      const e = V(s, plan.lineD(s), 1.1), rows = [];
      for (let el = 87; el >= 0; el -= 3) {
        let row = '';
        for (let az = -180; az < 180; az += 3) {
          const a = az * Math.PI / 180, ce = Math.cos(el * Math.PI / 180), dx = Math.sin(a) * ce, dy = Math.sin(el * Math.PI / 180), dz = -Math.cos(a) * ce;
          let hit = false; for (let t = 2.5; t < 170 && !hit; t += 0.7) if (air.solid(e.x + dx * t, e.y + dy * t, e.z + dz * t, 0)) hit = true;
          row += hit ? '#' : '.';
        }
        rows.push(row);
      }
      out[s] = { heading: +(Math.atan2(plan.lineD(s + 1) - plan.lineD(s - 1), 2) * 180 / Math.PI).toFixed(0), rows };
    }
    fetch('/__shot/orchard_bi_sky.json', { method: 'POST', body: JSON.stringify(out) }).catch(() => {});
  }

  // ============================================================================================== the bats
  // One flock of sixteen (the family's bat: 10 beats a second, the hand late, a jink of up to 70 degrees every 0.6 to
  // 1.4 s, never a glide), drawn 1.4 times life as the page asks (a span of 0.4 m).
  let bats = null; const batWalk = [], ZONES = [], chains = {}, batStat = { dips: 0, nearestEye: 1e9, inWood: 0, drops: 0 };
  const skimIds = [];
  let DOOR = -1, batClock = -1, batsBegun = false;
  if (!SKIP.has('bats')) {
    const lineD = (s) => plan.lineD(s);
    const OFF = BAT.count, Z0 = [];                                   // the chains' zones: they stand behind the sixteen homes (the family sets bat i down in zone i)
    const add = (z, tag, s = null) => { if (!z) return -1; z.tag = tag; z.s = s; Z0.push(z); return OFF + Z0.length - 1; };
    const zoneOf = (id) => (id >= OFF ? Z0[id - OFF] : ZONES[id]);
    // ---- MAY A BAT GO FROM ONE PLACE TO THE NEXT? Only at a height that is free over both, along a line that is free
    // at that height. Returns the heights it may travel at, [lo, hi], or null.
    const link = (A, B) => {
      let lo = Math.max(A.y[0], B.y[0]), hi = Math.min(A.y[1], B.y[1]); const dist = Math.hypot(A.x - B.x, A.z - B.z);
      if (dist > 12.5) return null;
      if (hi - lo < 0.2) { if (dist < 1 && lo - hi < 0.6) { const m = (lo + hi) / 2; lo = m - 0.1; hi = m + 0.1; } else return null; }      // (one place above the other, with nothing between them, will do)
      // of the heights both hold, the tallest run at which the straight way between them is free
      const n = Math.max(1, Math.round((hi - lo) / 0.3)); let best = null, run = null;
      for (let k = 0; k <= n; k++) {
        const y = lo + (hi - lo) * k / n; let ok = true;
        for (let j = 1; j < 8 && ok; j++) { const t = j / 8; if (air.solid(lerp(A.x, B.x, t), y, lerp(A.z, B.z, t), 0.5)) ok = false; }
        if (ok) { run = run ? [run[0], y] : [y, y]; if (!best || run[1] - run[0] > best[1] - best[0]) best = run; } else run = null;
      }
      return best ? (best[1] - best[0] < 0.1 ? [best[0] - 0.05, best[0] + 0.05] : best) : null;
    };
    const LINK = new Map();
    const linked = (a, b) => { const A = zoneOf(a), B = zoneOf(b), ia = A.src ?? a, ib = B.src ?? b; if (ia === ib) return A.y; const k = ia < ib ? ia * 4096 + ib : ib * 4096 + ia; if (!LINK.has(k)) LINK.set(k, link(A, B)); return LINK.get(k); };
    /** Places in order, as runs in which each is joined to the one before it. */
    const arcsOf = (ids) => { const out = []; let run = []; for (const id of ids) { if (id < 0) { if (run.length) out.push(run); run = []; continue; } if (run.length && !linked(run[run.length - 1], id)) { out.push(run); run = []; } run.push(id); } if (run.length) out.push(run); return out; };

    // ---- THE TRUNK: from the door down the first avenue's strip of sky, through the pond along the lane (under the lamp
    // limb and the arch), down the second avenue's strip to the wall. The avenues' beats are stretches of it, and those
    // that leave the loft for the tree and beyond go by it.
    const station = (s, B, tag) => { const p = V(s, lineD(s)); return add(air.fit(p.x, p.z, B.r, B.band, B), tag, s); };
    const trunkIds = [];
    { const p = V(BAT.door.s, 0); trunkIds.push(add({ x: p.x, z: p.z, r: 2.6, y: BAT.door.y.slice() }, 'door', BAT.door.s)); }
    for (const s of BAT.av1.s) trunkIds.push(station(s, BAT.av1, 'av1'));
    for (const s of BAT.bridge.s1) trunkIds.push(station(s, BAT.bridge, 'mid'));
    for (const s of BAT.mid.s) trunkIds.push(station(s, BAT.mid, 'mid'));
    for (const s of BAT.bridge.s2) trunkIds.push(station(s, BAT.bridge, 'mid'));
    for (const s of BAT.av2.s) trunkIds.push(station(s, BAT.av2, 'av2'));
    const trunkArcs = arcsOf(trunkIds.filter((id) => id >= 0)), trunk = trunkArcs[0] || [];      // (a place with no free air is stepped over, if the next can be reached from the last)
    DOOR = trunk[0];
    const stretch = (tag) => { const all = trunkIds.filter((id) => id >= 0 && zoneOf(id).tag === tag), arcs = arcsOf(all).sort((a, b) => b.length - a.length); return { ids: arcs[0] || [], ring: false }; };
    chains.av1 = stretch('av1'); chains.av2 = stretch('av2'); chains.mid = stretch('mid'); chains.trunk = { ids: trunk, ring: false };
    debug.notes.push(`the trunk: ${trunk.length} of ${trunkIds.length} places in one run from the door (${trunkArcs.length} runs in all), to s ${trunk.length ? zoneOf(trunk[trunk.length - 1]).s : '-'}`);
    if (Q.has('bdebug')) {                                               // (developer) where the trunk breaks, and on what
      const ok = trunkIds.filter((id) => id >= 0);
      for (let k = 0; k < ok.length - 1; k++) if (!linked(ok[k], ok[k + 1])) {
        const A = zoneOf(ok[k]), B = zoneOf(ok[k + 1]), lo = Math.max(A.y[0], B.y[0]), hi = Math.min(A.y[1], B.y[1]), hits = [];
        for (let y = lo; y <= hi + 1e-6; y += 0.4) for (let j = 1; j < 8; j++) { const t = j / 8, w = air.what(lerp(A.x, B.x, t), y, lerp(A.z, B.z, t), 0.5); if (w) { hits.push({ y: +y.toFixed(2), t, w }); break; } }
        debug.notes.push({ broken: [A.s, B.s], ya: A.y, yb: B.y, dist: +Math.hypot(A.x - B.x, A.z - B.z).toFixed(1), hits: hits.slice(0, 6) });
      }
    }

    // ---- ROUND THE OLDEST TREE: a ring 19 m out, under the hem of its crown, each place fitted to the air that is free
    // there (between the props, under the skirts of blossom). Where the lamp limb comes down to the water and where the
    // arch crosses there is no way on at a bat's height: the ring is then arcs, and the bats are dealt out over them.
    {
      const R = BAT.ring, ids = []; let prev = 3;
      for (let k = 0; k < R.n; k++) {
        const a = k / R.n * Math.PI * 2, x = treeAt.x + Math.cos(a) * R.radius, z = treeAt.z + Math.sin(a) * R.radius;
        const zn = air.fit(x, z, R.r, R.band, { thick: R.thick, near: prev });
        if (zn) { if (zn.y[1] - zn.y[0] > 5) zn.y[1] = +(zn.y[0] + 5 + 3 * rnd()).toFixed(2); prev = (zn.y[0] + zn.y[1]) / 2; }
        ids.push(add(zn, 'tree', k));
      }
      let arcs = arcsOf(ids);
      const whole = arcs.length === 1 && arcs[0].length === R.n && !!linked(ids[R.n - 1], ids[0]);
      if (!whole && arcs.length > 1 && ids[0] >= 0 && ids[R.n - 1] >= 0 && linked(ids[R.n - 1], ids[0])) arcs = [arcs[arcs.length - 1].concat(arcs[0]), ...arcs.slice(1, -1)];      // (the run that crosses the ring's own start)
      arcs = arcs.filter((a) => a.length >= 2).sort((a, b) => b.length - a.length);
      chains.tree = { ids: arcs[0] || [], ring: whole, parts: whole ? null : arcs.map((a) => ({ ids: a, ring: false })) };
      debug.notes.push(`the tree's ring: ${ids.filter((i) => i >= 0).length} of ${R.n} places free; ${whole ? 'a whole ring' : arcs.length + ' arcs of ' + arcs.map((a) => a.length).join(', ')}`);
    }
    // ---- THE SKIMMERS: low over the lane itself (the pool under the lamp and the pond; then the second avenue's lane)
    const S = BAT.skim;
    for (const k of ['A', 'B', 'C']) { const arcs = arcsOf(S[k].map((s) => station(s, { r: S.r, band: S.band, thick: 0.35 }, 'skim' + k)).filter((id) => id >= 0)).sort((a, b) => b.length - a.length); chains['skim' + k] = { ids: arcs[0] || [], ring: false }; }
    // ---- WITH REDUCED MOTION (fourth holder) no bat comes within ten metres of the eye (the page), and the family keeps that
    // by pushing a bat straight aside: but a beat here is three metres wide in a strip of air between crowns, and ten metres
    // aside is inside the blossom (measured: a skimmer ended 20 m up in the great crown). So with reduced motion:
    //   - the pond's skimmer works the open water NORTH of the islet (page d +17.5, s 96 to 126: 30 m from the composed line, 4 m clear of the props),
    //     because the pond's lane is where the eye itself goes;
    //   - the five round the tree all keep to its long arc (the short one lies across the lane);
    //   - a bat moves on along its beat as the boat comes (stepBat), and where it is cornered at the end of an avenue's beat it
    //     goes OVER the boat: up through the strip of sky to 12 m, above the crowns and ten metres clear of the eye, along
    //     the sky places below to the first of its own places beyond the boat, and down again.
    const SKY = { ids: [], of: new Map() };
    if (calm) {
      const north = arcsOf([96, 101, 106, 111, 116, 121, 126].map((s) => { const p = V(s, 17.5); return add(air.fit(p.x, p.z, S.r, S.band, { thick: 0.35 }), 'skimA', s); }).filter((id) => id >= 0)).sort((a, b) => b.length - a.length);
      if (north[0] && north[0].length >= 3) chains.skimA = { ids: north[0], ring: false }; else debug.notes.push('reduced motion: no free water north of the islet for the pond\'s skimmer');
      for (const tag of ['av1', 'av2']) for (const id of chains[tag].ids) {
        const z = zoneOf(id), col = air.free(z.x, z.z, 2.4, [z.y[1] - 0.3, 13.2]);
        if (col.length !== 1 || col[0][1] < 13.1 || col[0][0] > z.y[1]) continue;      // (the whole column from its own air up to 13 m is free: sky)
        SKY.of.set(id, add({ x: z.x, z: z.z, r: 2.6, y: [11.7, 12.9] }, 'sky', z.s));
      }
      SKY.ids = [...SKY.of.values()];
      debug.notes.push(`reduced motion: ${SKY.ids.length} sky places over the avenues; the pond's skimmer has ${chains.skimA.ids.length} places`);
    }
    for (const k of Object.keys(chains)) if (!chains[k].ids.length) debug.notes.push(`NO FREE AIR for the beat '${k}'`);

    // ---- WHERE THE TRUNK IS LEFT for a beat that does not lie on it: the first place of the trunk (from the door) that is
    // joined to a place of the beat. { at: index in the trunk, chain, idx } or null (then that bat is out already).
    const hopTo = (ch, from = 0) => { for (let t = from; t < trunk.length; t++) { let best = -1, bd = 1e9; ch.ids.forEach((c, k) => { if (!linked(trunk[t], c)) return; const d = Math.hypot(zoneOf(trunk[t]).x - zoneOf(c).x, zoneOf(trunk[t]).z - zoneOf(c).z); if (d < bd) { bd = d; best = k; } }); if (best >= 0) return { at: t, chain: ch, idx: best }; } return null; };
    const onTrunk = (ch) => { const t = trunk.indexOf(ch.ids[0]); return t >= 0 ? { at: t, chain: ch, idx: 0 } : null; };

    // ---- sixteen homes first (the family sets bat i down in zone i), then the chains' own zones
    const n = BAT.count, homeOf = [];
    const perBeat = {}; BAT.beats.forEach((b) => { perBeat[b] = (perBeat[b] || 0) + 1; });
    const seen = {};
    for (let i = 0; i < n; i++) {
      const beat = BAT.beats[i], k = seen[beat] = (seen[beat] || 0) + 1;
      let ch = chains[beat] && chains[beat].ids.length ? chains[beat] : chains.av1, share = perBeat[beat], kk = k;
      if (ch.parts && ch.parts.length && calm) ch = ch.parts[0];        // (reduced motion: all on the long arc)
      else if (ch.parts && ch.parts.length) {                           // (the tree's ring in arcs: its bats are dealt out over them by their length)
        const total = ch.parts.reduce((a, q) => a + q.ids.length, 0); let acc = 0, pick = ch.parts[0], before = 0, mine = share;
        for (const q of ch.parts) { const hi = Math.round((acc + q.ids.length) / total * share), lo = Math.round(acc / total * share); if (k > lo && k <= hi) { pick = q; before = lo; mine = hi - lo; } acc += q.ids.length; }
        ch = pick; kk = k - before; share = Math.max(1, mine);
      }
      const idx = Math.min(ch.ids.length - 1, Math.floor((kk - 0.5) / share * ch.ids.length)), z = zoneOf(ch.ids[idx]);
      homeOf.push({ chain: ch, idx }); ZONES.push({ x: z.x, z: z.z, r: z.r, y: z.y.slice(), tag: 'home ' + beat, src: ch.ids[idx] });
    }
    for (const z of Z0) ZONES.push(z);
    // how each leaves the trunk for its beat
    const enter = homeOf.map((h, i) => { const beat = BAT.beats[i]; return beat === 'av1' ? onTrunk(chains.av1) : beat === 'av2' ? onTrunk(chains.av2) : hopTo(h.chain, beat === 'tree' ? (i % 2 ? 9 : 0) : 0) || hopTo(h.chain); });
    debug.enter = enter.map((e, i) => (e ? { i, beat: BAT.beats[i], leavesTrunkAt: zoneOf(trunk[e.at]).s, into: e.chain.ids[e.idx] } : { i, beat: BAT.beats[i], out: true }));

    // ---- what the family steers them round besides (a second guard: the places themselves are laid in free air): the
    // bole, the low limbs, the props, the kept lamp; and one ball that goes with the stag
    const avoid = [];
    avoid.push({ x: treeAt.x, y: 1.6, z: treeAt.z, r: 4.4 }, { x: treeAt.x, y: 6.0, z: treeAt.z, r: 3.4 });
    if (tree.paths) for (const l of tree.paths) {
      let last = null;
      for (let i = 0; i < l.path.length; i++) {
        const p = l.path[i], r = l.radius[i];
        if (p.y > 9.5 || Math.hypot(p.x - treeAt.x, p.z - treeAt.z) < 3.5) continue;
        if (last && last.distanceTo(p) < Math.max(0.9, 1.3 * (r + 0.45))) continue;
        avoid.push({ x: p.x, y: p.y, z: p.z, r: r + 0.45 }); last = p;
      }
    }
    { const props = tree.props && tree.props.every(Boolean) ? tree.props : []; for (const p of props) for (let y = 0.5; y < p.y; y += 1.0) avoid.push({ x: p.x, y, z: p.z, r: 0.6 }); }
    { const lamp = shared.lamp && shared.lamp.position ? shared.lamp.position : V(plan.lamp.flame[0], plan.lamp.flame[1], plan.lamp.flame[2]); avoid.push({ x: lamp.x, y: lamp.y + 0.2, z: lamp.z, r: 0.9 }); }
    const stagBall = { x: 0, y: -50, z: 0, r: 2.4 }; avoid.push(stagBall);
    debug.avoid = avoid.length;

    bats = makeFlock(ctx, {
      species: 'bat', count: n, exact: true, scale: BAT.scale, seed: 5, hidden: true, habit: 'wander',
      zones: ZONES.map((z) => ({ x: z.x, z: z.z, r: z.r * (calm ? 0.62 : 1), y: z.y })),      // (with reduced motion the family's bat turns half as fast and overshoots its beat by two metres: it is given less of each place, and stays inside the air that was measured free)
      keepOut: BAT.keepOut, calmKeepOut: BAT.calmKeepOut, avoid,
      dip: { every: BAT.dip }, mark: BAT.mark,
      onTouch: (x, z, kind, i) => { batStat.dips++; batStat.lastDip = [+x.toFixed(2), +z.toFixed(2), i, +ctx.time.toFixed(2)]; if (Q.has('bdebug')) (batStat.log = batStat.log || []).push(batStat.lastDip); if (api.on.batDip) api.on.batDip(x, z, i); },
    });
    bats.object.name = 'bats';
    // only the skimmers come down to the water
    bats.birds.forEach((b, i) => { if (!BAT.beats[i].startsWith('skim')) b.dipT = Infinity; else skimIds.push(i); });
    for (let i = 0; i < n; i++) batWalk.push({ beat: BAT.beats[i], chain: homeOf[i].chain, idx: homeOf[i].idx, dir: rnd() < 0.5 ? -1 : 1, t: 0, max: 5 + rnd() * 4, dwell: rnd() * 2, mode: 'hidden', plan: null, pi: 0, loft: false, age: 0, ov: null });

    // ---- walking a chain: a bat is given the next place when it has come to the one it has; on the way it keeps to a
    // height that is free over both
    const birds = bats.birds, eye = ctx.engine.shared.uCameraPos.value, _loc = {};
    const go = (i, zi) => {
      const b = birds[i], w = batWalk[i], Z = ZONES[zi], ov = linked(b.zone, zi);
      b.zone = zi; w.t = 0; w.max = 4.5 + rnd() * 4; w.dwell = rnd() < 0.3 ? 0.6 + rnd() * 2.4 : 0; w.ov = ov || null;
      const lo = ov ? ov[0] : Z.y[0], hi = ov ? ov[1] : Z.y[1];
      if (b.yTo < lo || b.yTo > hi) b.yTo = lerp(lo, hi, rnd());
    };
    const nearEye = (zi) => { const N = ZONES[zi]; return Math.hypot(N.x - eye.x, N.z - eye.z) - N.r; };      // how near the eye a place's edge is, on the plan
    const skyNear = (zi) => { const Z = ZONES[zi]; let best = -1, bd = 3.6; for (const id of SKY.ids) { const dd = Math.hypot(ZONES[id].x - Z.x, ZONES[id].z - Z.z); if (dd < bd) { bd = dd; best = id; } } return best; };
    const stepBat = (i, dt) => {
      const b = birds[i], w = batWalk[i];
      if (w.mode === 'hidden') return;
      const Z = ZONES[b.zone], d = Math.hypot(b.x - Z.x, b.z - Z.z);
      w.t += dt; w.age += dt;
      if (w.ov) { if (d < Z.r * 0.9) w.ov = null; else b.yTo = clamp(b.yTo, w.ov[0], w.ov[1]); }      // (between two places: at a height free over both)
      if (w.mode !== 'beat' && isFinite(b.dipT)) b.dipT = Math.max(b.dipT, 1.5);        // (a skimmer on its way to its beat does not come down to the water)
      else if (b.dipT < 0.9 && b.dip <= 0) b.yTo = Math.min(b.yTo, Z.y[0] + 0.12);      // (about to dip: it is already low, or the family's dip gives up before it has touched)
      if (w.loft) {                                                      // inside the loft: a drop from the beam, then straight out between the hanging cloth, with no jink
        b.jink = Math.max(b.jink, 0.35); b.spd = lerp(1.6, 6.6, smooth(0, 0.45, w.age));
        if (plan.locate(b.x, b.z, _loc).s > plan.left.loft.door + 1.5) w.loft = false;
      }
      if (w.mode === 'transit') {
        if ((d < Z.r * 0.95 && (!w.climb || w.pi > 0 || b.y > Z.y[0] - 0.8)) || w.t > 6) {      // (going over the boat: not on until it is up in the sky)
          w.pi++;
          if (w.pi < w.plan.length) go(i, w.plan[w.pi]);
          else { w.mode = 'beat'; w.climb = false; w.chain = w.enter.chain; w.idx = w.enter.idx; go(i, w.chain.ids[w.idx]); }
        }
        return;
      }
      if (calm && w.t > 0.8) {                                           // reduced motion: on along its beat as the boat comes (see above)
        const ids = w.chain.ids, m = ids.length, keep = bats.keepOut + 2.5, mine = nearEye(b.zone);
        if (mine < keep && m > 1) {
          let best = -1, bd = mine + 0.5, way = w.dir;
          for (const dir of [-1, 1]) { let k = w.idx + dir; if (w.chain.ring) k = (k + m) % m; else if (k < 0 || k >= m) continue; const dn = nearEye(ids[k]); if (dn > bd) { bd = dn; best = k; way = dir; } }
          if (best >= 0) { w.dir = way; w.idx = best; go(i, ids[best]); w.dwell = 0; return; }
          const here = skyNear(b.zone);                                   // cornered: over the boat, if there is sky here
          if (here >= 0) {
            const k0 = SKY.ids.indexOf(here), eyeS = plan.locate(eye.x, eye.z, _loc).s, dir = eyeS > ZONES[here].s ? 1 : -1, route = [here];
            let end = -1;
            for (let k = k0 + dir; k >= 0 && k < SKY.ids.length; k += dir) {
              const zi = SKY.ids[k]; if (Math.abs(ZONES[zi].s - ZONES[SKY.ids[k - dir]].s) > 9) break;      // (never across the great crown)
              route.push(zi); if ((ZONES[zi].s - eyeS) * dir > 0 && nearEye(zi) > keep + 2) { end = zi; break; }
            }
            if (end >= 0) {
              let land = -1, ld = 4; ids.forEach((zi, k) => { const dd = Math.hypot(ZONES[zi].x - ZONES[end].x, ZONES[zi].z - ZONES[end].z); if (dd < ld) { ld = dd; land = k; } });
              if (land >= 0) { w.mode = 'transit'; w.climb = true; w.enter = { chain: w.chain, idx: land }; w.plan = route; w.pi = 0; go(i, route[0]); batStat.overs = (batStat.overs || 0) + 1; return; }
            }
          }
        }
      }
      if (d < Z.r * 0.8 || w.t > w.max) {
        if (w.dwell > 0) { w.dwell -= dt; return; }
        const ids = w.chain.ids, m = ids.length; if (m < 2) { w.t = 0; return; }
        if (rnd() < 0.12) w.dir = -w.dir;
        let next = w.idx + w.dir;
        if (w.chain.ring) next = (next + m) % m; else if (next < 0 || next >= m) { w.dir = -w.dir; next = w.idx + w.dir; }
        // with reduced motion a skimmer does not try to pass the boat along the lane (it would be pushed ten metres aside, into the rows): it turns back
        if (calm && nearEye(ids[next]) < bats.keepOut + 1) { w.dir = -w.dir; next = w.chain.ring ? (w.idx + w.dir + m) % m : clamp(w.idx + w.dir, 0, m - 1); if (nearEye(ids[next]) < bats.keepOut + 1) { w.t = 0; return; } }      // (reduced motion: never on to a place the eye is at; if both ways are closed it stays)
        w.idx = next; go(i, ids[next]);
      }
    };
    // ---- leaving the loft
    const L = plan.left.loft, beams = [16, 21].filter((s) => L.postEvery.includes(s)).concat(L.postEvery.includes(16) ? [] : L.postEvery.slice(-2));
    const hangAt = (k) => { const s = beams[k % beams.length], d = [-1.9, 1.3, -0.5, 2.0, 0.4, -1.2, 1.7][Math.floor(k / beams.length) % 7] * (k % 2 ? -1 : 1) * 0.95; return V(s + 0.05, d, BAT.hang); };
    const letGo = (i, k) => {
      const b = birds[i], w = batWalk[i], p = hangAt(k), door = ZONES[DOOR];
      b.zone = DOOR;
      bats.release({ from: [[p.x, p.y, p.z]], who: [i], stagger: 0, toward: [door.x, lerp(BAT.door.y[0], BAT.door.y[1], 0.45), door.z] });
      w.mode = 'transit'; w.enter = enter[i]; w.plan = trunk.slice(0, enter[i].at + 1); w.pi = 0; w.t = 0; w.age = 0; w.loft = true; w.ov = null; batStat.drops++;
      if (api.on.batLeave) api.on.batLeave(p.x, p.y, p.z, i, k);
    };
    const settleBat = (i) => { if (batWalk[i].mode !== 'hidden') return; bats.release({ who: [i], stagger: 0 }); batWalk[i].mode = 'beat'; };
    let dropK = 0;
    batWalk.update = (dt, first) => {
      if (first) {
        // a boat set down beyond the loft finds them on their beats; inside it, those that are out already are out
        const hangNow = Q.has('bbats') || here.s < L.door + 1;
        for (let i = 0; i < n; i++) if (!hangNow || BAT.out.includes(i) || !enter[i]) settleBat(i);
        if (!hangNow) batsBegun = true;
        else if (!Q.has('bbats') && here.s >= BAT.leave) { batsBegun = true; batClock = 0; }      // set down between the beams and the door: they are leaving now
      }
      if (!batsBegun && (Q.has('bbats') ? ctx.time >= num('bbats', 0) : here.s >= BAT.leave)) { batsBegun = true; batClock = 0; }
      if (batClock >= 0) {
        batClock += dt;
        while (dropK < BAT.drops.length && batClock >= BAT.drops[dropK][0]) { const i = BAT.drops[dropK][1]; if (batWalk[i].mode === 'hidden') letGo(i, dropK); dropK++; }
        if (dropK >= BAT.drops.length) { for (let i = 0; i < n; i++) settleBat(i); batClock = -1; }
      }
      // the stag is in nobody's way but a skimmer's: one ball goes with him
      const st = cast.stag; if (st && st.position && st.position.isVector3) { stagBall.x = st.position.x; stagBall.y = 0.9; stagBall.z = st.position.z; } else stagBall.y = -50;
      for (let i = 0; i < n; i++) {
        stepBat(i, dt);
        const b = birds[i]; if (batWalk[i].mode === 'hidden' || batWalk[i].age < 1) continue;
        const de = Math.hypot(b.x - eye.x, b.y - eye.y, b.z - eye.z); if (de < batStat.nearestEye) batStat.nearestEye = de;
        if (air.wood(b.x, b.y, b.z, 0.1)) { batStat.inWood++; if (Q.has('bdebug')) (batStat.woodLog = batStat.woodLog || []).push([i, +ctx.time.toFixed(2), ...Object.values(plan.locate(b.x, b.z, {})).map((v) => +v.toFixed(1)), +b.y.toFixed(2)]); } else if (air.solid(b.x, b.y, b.z, 0.1)) batStat.inBlossom = (batStat.inBlossom || 0) + 1;      // (wood: a limb, the bole, a prop, a trunk, a crutch; blossom: a mass of it taken as a ball, or the islet's ground)
      }
    };
  }

  // ============================================================================================== the murmuration
  const roostStat = { flits: 0 }, mirrorDrawn = { reflecting: 0, other: 0 };
  let flock = null; const roost = { T: -1, on: false, begun: false, in: false, hidden: false, forced: false, settled: false };
  const loops = {};
  if (!SKIP.has('flock')) {
    // a loop laid out from an eye on the lane: its middle `off` metres away (along the ground), `right` degrees right of the
    // avenue's axis and `up` degrees above the horizon; its long axis along the line of sight. In the realm: x is to
    // the right (north), z is back up the avenue (the first avenue is straight: the page's (s, d) is (-z, x) there).
    const laid = (o) => {
      const a = o.right * Math.PI / 180, x = (o.d || 0) + Math.sin(a) * o.off, z = -(o.from + Math.cos(a) * o.off), y = 1.1 + Math.tan(o.up * Math.PI / 180) * o.off;
      return { at: [x, y, z], pts: loop({ at: [x, y, z], size: o.size, turn: Math.PI / 2 - a, tilt: o.tilt, points: 12 }) };
    };
    loops.far = laid(FLOCK.far); loops.near = laid(FLOCK.near);
    // the ring round the crown: clockwise seen from above (north, east, south, west: loop() runs from +x through +z)
    { const R = FLOCK.ring, top = plan.locate(treeTop.x, treeTop.z, {}), pts = [];
      for (let k = 0; k < 16; k++) { const th = k / 16 * Math.PI * 2, p = V(top.s + R.off[0] + R.radius * Math.cos(th), top.d + R.off[1] + R.radius * Math.sin(th), R.mid - R.tilt * Math.cos(th - R.lowAt * Math.PI / 180)); pts.push([p.x, p.y, p.z]); }
      loops.ring = pts; loops.ringRoute = new Route(pts, true);
      // and the ring it closes into before it pours: level, over the top of the dome (the page's own ring: 22 m out, 35 m up)
      loops.close = loop({ at: [treeTop.x, FLOCK.close.height, treeTop.z], size: [FLOCK.close.radius * 2, FLOCK.close.radius * 2], points: 16 }); }
    // reduced motion: it holds on the far side of the tree from the pond's lane, beyond 60 m, and goes in from there
    { const H = FLOCK.calm.hold, a = H.bearing * Math.PI / 180; loops.hold = loop({ at: [treeTop.x + Math.cos(a) * H.off, H.height, treeTop.z + Math.sin(a) * H.off], size: H.size, points: 12 }); }
    const count = num('bn', FLOCK.count);
    flock = makeMurmuration(ctx, {
      species: 'starling', count, mirror: { count: Q.has('bn') ? Math.round(count / 4) : num('bmcount', FLOCK.mirror), scale: num('bmscale', 2), dabs: num('bmdabs', FLOCK.dabs) }, seed: 3,
      path: loops.far.pts, speed: 10, ...FLOCK.cloud, keepOut: FLOCK.keepOut, calmKeepOut: FLOCK.calm.keepOut, dabs: num('bdabs', FLOCK.dabs), veil: num('bveil', FLOCK.veil), scale: num('bscale', FLOCK.scale), fog: num('bfog', FLOCK.fog),
    });
    flock.object.name = 'murmuration';
    if (Q.get('bmirror') === '2' && flock.mirror) { flock.mirror.layers.enable(1); flock.mesh.layers.enable(2); }      // (developer: the mirror's birds drawn in the direct view too, and the flock's own in the mirror)
    if (Q.has('bdebug') && flock.mirror) { const was = flock.mirror.onBeforeRender; flock.mirror.onBeforeRender = function (...a) { if (ctx.engine.reflecting) mirrorDrawn.reflecting++; else mirrorDrawn.other++; return was.apply(this, a); }; }      // (developer: is the mirror's flock drawn, and in which picture)
  }
  // ---- THE FUNNEL. The boat is under the great crown for the whole of the roost (the crown's hem is at s 82, the roost
  // begins at s 98): whatever happens over the roof of blossom is seen through its gaps only. So the roost's picture is
  // made INSIDE the tree. The stream gathers inside the dome, round the leader under the roof (the mouth): to get there
  // every bird dives from the ring through the roof's blossom, which hides it as it passes ("gone between lobes" is
  // kept from outside by the blossom itself). From the mouth the birds come down the inside of the dome as a cone,
  // under the shell and in front of it (dark on pale, and doubled in the pond's open water), to its skirts all round,
  // where each ends among the lowest masses of blossom and is gone over its last three metres.
  const funnel = (() => {
    // the leader at the mouth's height (the dome's top stands 3 m west of the bole: the leader leans there)
    let mx = FLOCK.mouth.y > 30 ? treeTop.x : lerp(treeAt.x, treeTop.x, 0.6), mz = FLOCK.mouth.y > 30 ? treeTop.z : lerp(treeAt.z, treeTop.z, 0.6);
    const lead = tree.paths && tree.paths.find((l) => l.name === 'leader');
    if (lead) for (let i = 0; i < lead.path.length - 1; i++) { const a = lead.path[i], b = lead.path[i + 1]; if ((a.y - FLOCK.mouth.y) * (b.y - FLOCK.mouth.y) <= 0) { const t = (FLOCK.mouth.y - a.y) / ((b.y - a.y) || 1e-6); mx = lerp(a.x, b.x, t); mz = lerp(a.z, b.z, t); break; } }
    // WHERE THE STREAM ENDS (fourth holder). One place with a shape, in the great crown's own masses of blossom, taken from
    // shared.blossom at load (the blossom's maker is still at work: nothing here is a number of mine unless there is no
    // blossom at all): the WEST SKIRT, the lowest masses over the mouth of the second avenue (page s 135 to 145, within
    // 8 m of the centre line, 7 to 13 m up). A boat left to the current has them dead ahead from 12 s to 18 s of the roost
    // (30 m off and 16 degrees up, then 21 m and 23 degrees), so the stream comes down through the roof on the rider's right,
    // crosses over the lane ahead and goes into the blossom in the middle of the forward view; from postcard 6 it crosses the
    // left of the vault. Its axis clears the leader by 4 m and the high west bough (w_b) by 2.5 m (the log has the numbers).
    // With reduced motion the stream goes down the FAR side of the crown from the lane instead (the north face, 36 m from
    // the composed line), as the page asks.
    const massesAt = (pick, least) => {
      const all = shared.blossom && shared.blossom.all ? shared.blossom.all.filter((L) => L.old && L.kind !== 'mote' && L.c && L.rad > 0) : [];
      const got = all.filter((L) => { const l = plan.locate(L.c.x, L.c.z, {}); return pick(l.s, l.d, L.c.y, L.rad); });
      if (got.length < least) return null;
      let w = 0, x = 0, y = 0, z = 0; for (const L of got) { const m = L.rad ** 3; w += m; x += L.c.x * m; y += L.c.y * m; z += L.c.z * m; }
      x /= w; y /= w; z /= w;
      let rx = 0, ry = 0, rz = 0; for (const L of got) { rx = Math.max(rx, Math.abs(L.c.x - x) + 0.6 * L.rad); ry = Math.max(ry, Math.abs(L.c.y - y) + 0.45 * L.rad); rz = Math.max(rz, Math.abs(L.c.z - z) + 0.6 * L.rad); }
      return { at: [x, y, z], radii: [rx, ry, rz], masses: got.length };
    };
    const q = V(FLOCK.into.s, FLOCK.into.d, FLOCK.into.y), given = Q.has('bintos') || Q.has('bintod') || Q.has('bintoy');
    const ws = (Q.get('bws') || '135,145,8').split(',').map(Number);      // (&bws=from,to,across: developer, to try another stretch of the skirt)
    const west = given ? null : massesAt((s, d, y) => s >= ws[0] && s <= ws[1] && Math.abs(d) <= (ws[2] || 8) && y >= 7 && y <= 13, 2);
    const far = massesAt((s, d, y) => d >= 15 && s >= 100 && s <= 124 && y >= 8 && y <= 21, 6);
    const into = west ? { at: west.at, radii: [Math.min(west.radii[0], 12), Math.min(west.radii[1], 2.6), Math.min(west.radii[2], 9)] } : { at: [q.x, q.y, q.z], radii: FLOCK.into.radii.slice() };
    const intoFar = far ? { at: far.at, radii: [Math.min(far.radii[0], 9), Math.min(far.radii[1], 5), Math.min(far.radii[2], 12)] } : into;
    debug.roost.masses = { west: west && { ...west, at: west.at.map((v) => +v.toFixed(1)) }, far: far && { ...far, at: far.at.map((v) => +v.toFixed(1)) } };
    return { mouth: [mx, FLOCK.mouth.y, mz], radius: FLOCK.mouth.radius, into: calm ? intoFar : into, near: into, far: intoFar };
  })();

  // ============================================================================================== the roosted
  // WHERE THEY SIT. The page roosts them on the model's own perches (shared.tree.perches: 120 points on top of near-level
  // wood). Nearly all of those are on the thin branches INSIDE the crown's masses of blossom: three hundred starlings
  // sat on them could not be found from anywhere (pictures: the log). So their places are taken from the wood that
  // SHOWS: along the upper limbs, the leader, the great boughs (shared.tree.paths) and every pad's own bough (the
  // tree's numbers: oldest_crown.json), 9 m up and more, where the wood runs near enough level, stands clear of every
  // mass of blossom and can be seen from the lane under the tree or from the look back. The model's perches fill up
  // what is wanting. The first two of the model's perches are the egrets' roosts: no starling sits within 1.3 m of them.
  let roosted = null;
  if (!SKIP.has('roosted') && tree.perches && tree.perches.length > 2) {
    const all = tree.perches, egrets = all.slice(0, 2), clearOfEgrets = (p) => egrets.every((e) => Math.hypot(p.x - e.x, p.y - e.y, p.z - e.z) > ROOSTED.clearOfEgret);
    const R = ROOSTED.wood, woods = [];
    if (tree.paths) for (const l of tree.paths) woods.push({ pts: l.path, r: l.radius });
    try {
      const res = await fetch('assets/models/orchard/oldest_crown.json'), nC = res.ok ? await res.json() : null, at = tree.at || treeAt;
      if (nC && nC.boughs) for (const q of nC.boughs) woods.push({ pts: q.path.map((v) => new THREE.Vector3(v[0] + at.x, v[1] + at.y, v[2] + at.z)), r: q.path.map((v) => v[3]) });
    } catch (err) { debug.notes.push('the crown\'s numbers could not be read: the roost is on the limbs and the model\'s perches only'); }
    // (the places it is looked at from: the lane under the tree, where they are 10 to 30 m off, and the look back)
    const laneEyes = [100, 104, 108, 112, 116, 120, 124, 128].map((s) => V(s, plan.lineD(s), 1.1)), backEyes = [[150, 0], [172, 0]].map(([s, d]) => V(s, d, 1.1));
    // (a bird on top of a bough is hidden from below by the bough itself: on wood of radius r, seen from an angle a above
    // the level, r (1 / cos a - 1) of its height is behind the wood. A starling sits 13 cm tall.)
    // seenFrom: how many pixels of its height show from an eye (0: hidden by its own bough, by blossom or by other wood)
    const TALL = 0.13 * ROOSTED.scale;
    const seenFrom = (p, e) => { const d = Math.hypot(p.x - e.x, p.y - e.y, p.z - e.z), n = Math.ceil(d / 0.9), flat = Math.hypot(p.x - e.x, p.z - e.z) / d;
      const shows = TALL - p.r * (1 / Math.max(0.05, flat) - 1); if (shows < 0.4 * TALL) return 0;
      for (let k = 2; k < n - 1; k++) { const t = k / n; if (air.solid(lerp(e.x, p.x, t), lerp(e.y, p.y, t), lerp(e.z, p.z, t), 0.05)) return 0; } return shows / d * 800; };
    const cand = [];
    for (const w of woods) {
      for (let i = 0; i < w.pts.length - 1; i++) {
        const a = w.pts[i], b2 = w.pts[i + 1], len = a.distanceTo(b2); if (len < 1e-4) continue;
        const tx = (b2.x - a.x) / len, ty = (b2.y - a.y) / len, tz = (b2.z - a.z) / len, n = Math.max(1, Math.round(len / R.step));
        if (Math.abs(ty) > R.slope) continue;
        for (let k = 0; k < n; k++) {
          const t = (k + 0.5) / n, r = lerp(w.r[i], w.r[i + 1], t), x = lerp(a.x, b2.x, t), z = lerp(a.z, b2.z, t), y = lerp(a.y, b2.y, t) + r / Math.sqrt(1 - ty * ty) - 0.005;
          if (y < R.above || r < R.thick[0] || r > R.thick[1]) continue;
          if (air.blossom(x, y + 0.06, z, R.clear)) continue;                    // (inside a mass of blossom, or under its skirt: not seen)
          cand.push({ x, y, z, along: [tx, ty, tz], r });
        }
      }
    }
    // those that are seen from the lane under the tree first, the nearest and the most often seen before the rest (a
    // starling 25 m up is five pixels: the three hundred are found on the wood within 20 m or not at all); then those
    // the look back sees; never two within `apart` of each other
    for (const c of cand) {
      c.lane = 0; c.back = 0; c.near = 1e9; c.px = 0; c.score = 0;
      for (const e of laneEyes) { const px = seenFrom(c, e); if (px >= 3) { c.lane++; c.near = Math.min(c.near, Math.hypot(c.x - e.x, c.y - e.y, c.z - e.z)); c.px = Math.max(c.px, px); c.score += Math.min(px, 12); } }
      for (const e of backEyes) if (seenFrom(c, e) > 0) { c.back++; c.score += 2; }
      c.seen = c.lane + c.back;                                                // (score: the pixels of it that show, from every place on the lane that sees it: a bird seen whole from the side, a little further off, before one seen from underneath as a sliver on its bough)
    }
    cand.sort((a, b) => b.score - a.score || a.r - b.r);
    const places = [];
    const far = (c) => places.every((q) => Math.hypot(q.x - c.x, q.y - c.y, q.z - c.z) > R.apart) && clearOfEgrets(c);
    for (const c of cand) { if (places.length >= R.most) break; if (c.seen > 0 && far(c)) places.push({ x: c.x, y: c.y, z: c.z, along: c.along, room: ROOSTED.rooms[places.length % ROOSTED.rooms.length], spread: ROOSTED.spread, seen: c.seen, lane: c.lane, near: c.near, r: c.r, px: c.px }); }      // (one, two or three to a place: never an even row)
    const shown = places.length;
    // (what is wanting, from the model's own perches)
    if (places.length < R.least) {
      const pts = all.slice(2).filter(clearOfEgrets), dirs = boughDirs(ctx, tree, pts, debug);
      pts.forEach((q, i) => { if (places.length < R.least && far(q)) places.push({ x: q.x, y: q.y, z: q.z, room: ROOSTED.room, spread: ROOSTED.spread, ...(dirs[i] ? { along: dirs[i] } : {}) }); });
    }
    roosted = makeFlock(ctx, {
      species: 'starling', count: ROOSTED.count, seed: 14, perches: places.map(({ seen, lane, near, r, px, ...q }) => q), hidden: true, flit: ROOSTED.flit, keepOut: 3,
      scale: ROOSTED.scale, minPixels: ROOSTED.minPixels,
      prePass: false,                                                  // (they sit 9 m up and more: never low over the water near the rider)
      material: tree.sway ? { sway: tree.sway } : {},                 // the high wood sways: they ride it
      onLeave: (i, x, y, z) => { roostStat.flits++; if (api.on.flit) api.on.flit(x, y, z, i); }, onLand: (i, x, y, z) => { if (api.on.land) api.on.land(x, y, z, i); },
    });
    roosted.object.name = 'roosted starlings';
    debug.perches = { ...debug.perches, candidates: cand.length, onShownWood: shown, places: places.length, seats: roosted.perches.length, seenFrom: places.reduce((o, q) => { const k = q.seen || 0; o[k] = (o[k] || 0) + 1; return o; }, {}), heights: [Math.min(...places.map((q) => q.y)), Math.max(...places.map((q) => q.y))].map((v) => +v.toFixed(1)),
      fromTheLane: places.filter((q) => q.lane > 0).length, nearest: [10, 14, 18, 22, 26, 30, 99].map((m, k, a) => places.filter((q) => q.lane > 0 && q.near < m && q.near >= (k ? a[k - 1] : 0)).length), candidatesFromTheLane: cand.filter((c) => c.lane > 0).length, candidatesNear: [10, 14, 18, 22, 26, 30, 99].map((m, k, a) => cand.filter((q) => q.lane > 0 && q.near < m && q.near >= (k ? a[k - 1] : 0)).length), radii: places.slice(0, 40).map((q) => +(q.r || 0).toFixed(2)), pixels: [3, 5, 7, 9, 12, 99].map((m, k, a) => places.filter((q) => (q.px || 0) < m && (q.px || 0) >= (k ? a[k - 1] : 0)).length) };
  } else if (!SKIP.has('roosted')) debug.notes.push('no perches in shared.tree: the roosted starlings are left out');

  // ============================================================================================== the roost, on one clock
  const TM = FLOCK.times, _c = new THREE.Vector3();
  const ringAt = (T) => {
    // how far round the ring (0..1) its middle is at T, had it come the whole way: it joins where the ring is nearest the
    // near loop (the ring is a circle walked from +x through +z: its place is an angle), and speeds up from 10 m/s over 4 s
    const v = FLOCK.ribbon.speed, L = loops.ringRoute.length, u0 = loops.ringRoute.nearest(loops.near.at[0], loops.near.at[1], loops.near.at[2]) / L;
    return ((u0 + (T < 4 ? (10 + (v - 10) * T / 8) * T : (10 + v) * 2 + v * (T - 4)) / L) % 1 + 1) % 1;
  };
  const scales = flock ? [flock.mesh, flock.mirror].filter(Boolean).map((m) => ({ u: m.material.uniforms.uBirdScale, was: m.material.uniforms.uBirdScale.value })) : [];
  // ---- the three hundred come down out of the stream: each from a few metres up the way to the funnel's mouth, by a line
  // that is free of wood and blossom, to its own place, where it lands as a bird lands (the family's flight and flare).
  const landing = { queue: [], t: 0, on: false, flown: 0, inPlace: 0 }, _d = new THREE.Vector3(), _q = new THREE.Vector3();
  const landOne = (i) => {
    const b = roosted.birds[i], p = b && b.home >= 0 ? roosted.perches[b.home] : null, L = ROOSTED.land;
    if (!b || b.state !== 9) return;                                                               // (9: the family's "not there")
    if (p) for (let k = 0; k < L.tries; k++) {
      _d.set(funnel.mouth[0] - p.x, funnel.mouth[1] - p.y, funnel.mouth[2] - p.z).normalize();
      _d.x += (rnd() - 0.5) * (0.5 + 0.25 * k); _d.z += (rnd() - 0.5) * (0.5 + 0.25 * k); _d.y = Math.max(0.35, _d.y + (rnd() - 0.3) * 0.5); _d.normalize();
      const far = lerp(L.from[0], L.from[1], rnd()) * (k > 3 ? 0.7 : 1); _q.set(p.x + _d.x * far, p.y + _d.y * far, p.z + _d.z * far);
      let ok = true; for (let j = 0; j <= 8 && ok; j++) { const t = j / 8, m = far * (1 - t); if (m < 0.8) break; if (air.wood(lerp(_q.x, p.x, t), lerp(_q.y, p.y, t), lerp(_q.z, p.z, t), 0.3)) ok = false; }      // (through blossom, never through wood)
      if (!ok) continue;
      b.vx = -_d.x; b.vy = -_d.y - 0.4; b.vz = -_d.z;                                               // (it is coming down the stream's way)
      roosted.release({ from: [[_q.x, _q.y, _q.z]], who: [i], stagger: 0 }); landing.flown++;
      return;
    }
    roosted.release({ who: [i], stagger: 0 }); landing.inPlace++;                                  // (no free way down: it is simply there)
  };
  const beginLanding = (over) => {
    if (!roosted || landing.on) return; landing.on = true; landing.t = 0;
    const order = roosted.birds.map((b, i) => i).filter((i) => roosted.birds[i].state === 9);
    for (let k = order.length - 1; k > 0; k--) { const j = Math.floor(rnd() * (k + 1)), t = order[k]; order[k] = order[j]; order[j] = t; }
    order.forEach((i, k) => landing.queue.push({ i, at: over * (k + rnd()) / Math.max(1, order.length) }));
  };
  const beginRoost = (T) => {
    roost.begun = true;
    if (!flock) return;
    const late = T > 0.5, rib = { ...FLOCK.ribbon }; if (calm) rib.speed = FLOCK.calm.speed;
    flock.shape(rib, late ? Math.max(0, TM.round - T) : TM.round);
    if (calm) flock.follow(loops.hold, { seconds: late ? 0.05 : 7 });
    else if (T >= FLOCK.close.at) { flock.follow(loops.close, { seconds: 0.05 }); roost.closed = true; }
    else if (late) flock.follow(loops.ring, { seconds: Math.max(0.05, FLOCK.join - T), at: ringAt(T) }); else flock.follow(loops.ring, { seconds: FLOCK.join });
    flock.funnel({ mouth: funnel.mouth, radius: funnel.radius, into: funnel.into, order: 'head', swirl: FLOCK.swirl, share: calm ? FLOCK.calm.share : FLOCK.share });
    // (where in its place each bird ends: the family spreads them all through the ellipsoid; here they end near its rim, which
    // is the dome's skirts. The family has no option for it: this is its own uniform, uSkew.y. See the log, "Asked of the toolkit")
    if (flock.uniforms && flock.uniforms.uSkew) flock.uniforms.uSkew.value.y = FLOCK.shell;
    if (api.on.roost) api.on.roost('ribbon', T);
  };
  /** The roost, driven by its clock: call it every frame with the seconds since the roost began (it does nothing before 0). */
  const runRoost = (T) => {
    roost.T = T;
    if (!(T >= 0) || roost.settled) return;
    if (T >= TM.over + (calm ? 8 : 0)) { settleRoost(); return; }
    if (!roost.begun) beginRoost(T);
    const pourFor = calm ? FLOCK.calm.pourFor : TM.pourFor;
    if (flock) {
      if (!calm && !roost.closed && T >= FLOCK.close.at) { roost.closed = true; flock.follow(loops.close, { seconds: FLOCK.close.over }); if (api.on.roost) api.on.roost('close', T); }
      flock.poured = clamp((T - TM.pour) / pourFor, 0, 1);
      // in the air no bird comes within 30 m of the eye (60 with reduced motion); going into the tree, which stands nearer than that, it may
      const k = smooth(TM.pour - 1.5, TM.pour + 1.5, T), big = lerp(lerp(1, FLOCK.ringScale / FLOCK.scale, smooth(0, TM.round, T)), FLOCK.roostScale / FLOCK.scale, smooth(TM.pour - 0.5, TM.pour + 1.2, T));
      for (const q of scales) q.u.value = q.was * big;
      flock.uniforms.uKeep.value = lerp(calm ? FLOCK.calm.keepOut : FLOCK.keepOut, FLOCK.keepIn, k);
      if (!roost.hidden && T >= TM.pour + pourFor + 1.5) { roost.hidden = true; flock.hide(); }
    }
    if (!roost.pouring && T >= TM.pour) { roost.pouring = true; if (api.on.roost) api.on.roost('pour', T); }
    if (!roost.in && T >= TM.roost + (calm ? 3 : 0)) { roost.in = true; const late = T - TM.roost - (calm ? 3 : 0); if (late > ROOSTED.land.over) { if (roosted) roosted.appear({ over: 0 }); } else beginLanding((ROOSTED.land.over - late) * (calm ? 1.6 : 1)); if (api.on.roost) api.on.roost('roosted', T); }
    if (!roost.last && T >= TM.pour + pourFor) { roost.last = true; if (api.on.roost) api.on.roost('last', T); }
  };
  /** The roost is over: the flock is in the tree and gone, the three hundred are on its limbs (a cue's settle). */
  const settleRoost = () => {
    if (roost.settled) return;
    const wasIn = roost.in; roost.settled = roost.begun = roost.in = roost.hidden = true;
    if (flock) { flock.hide(); flock.state.show = 0; }
    landing.queue.length = 0;
    if (roosted && !wasIn) roosted.appear({ over: 0 }); else if (roosted) roosted.release({ stagger: 0 });      // (any that had not yet come down are simply there)
  };

  // ============================================================================================== published
  const api = cast.birds = {
    /** The family's handles (docs/life/birds.md): makeMurmuration's, makeFlock's (the 300), makeFlock's (the 16). Any may be null (&bskip). */
    flock, roosted, bats,
    /** false: the roost runs by itself from s 98. true: the staging runs it (roost.run(T) every frame, roost.settle() in the cue's settle). */
    staged: false,
    roost: {
      run: runRoost, settle: settleRoost,
      /** Seconds on the roost's clock: the ribbon is drawn out by `round`; the pour runs from `pour` for `pourFor`; the 300 appear from `roost` over `roostFor`. */
      times: TM,
      /** The page's s it begins at, and the pace (m/s of path) that keeps a paddling rider's clock in step: T = max(time since, (path s - F.pathS(at)) / pace). */
      at: FLOCK.at, pace: FLOCK.pace,
      /** For staging it by hand: flock.shape(ribbon, 4); flock.follow(ring, { seconds: 7 }); flock.funnel({ mouth, radius, into }); flock.poured = k; flock.hide(); roosted.appear({ over: 5 }). */
      ribbon: { ...FLOCK.ribbon }, ring: loops.ring || null, hold: loops.hold || null, mouth: funnel.mouth, radius: funnel.radius, into: funnel.into,
      get T() { return roost.T; }, get over() { return roost.settled; },
    },
    /** The flock's two loops ([[x, y, z], ...]) and the boat's page s over which it comes from the far one to the near one. */
    loops: { far: loops.far ? loops.far.pts : null, near: loops.near ? loops.near.pts : null, approach: FLOCK.approach.slice() },
    /** The skimming bats (the tide: their rings double the fireflies' light). ids: which of bats.birds they are.
     *  dip(k): the skimmer nearest ahead of the boat (or skimmer k of 0..2) comes down to the water now; its ring opens about 0.8 s later.
     *  work(k, from, to): skimmer k works the lane between those page s from now on (default: A the pool and the pond, B s 136 to 172, C s 178 to 208). */
    skim: {
      ids: skimIds,
      dip(k = null) {
        if (!bats || !skimIds.length) return -1;
        let i = k != null ? skimIds[k] : -1;
        if (i < 0 || i == null) { let bd = 1e9; for (const j of skimIds) { const b = bats.birds[j], d = Math.hypot(b.x - ctx.boat.x, b.z - ctx.boat.z) + (plan.locate(b.x, b.z, {}).s < here.s ? 30 : 0); if (d < bd) { bd = d; i = j; } } }
        const b = bats.birds[i]; if (b && b.dip <= 0) b.dipT = 0;
        return i;
      },
      work(k, from, to) {
        const i = skimIds[k]; if (!bats || i == null) return;
        const w = batWalk[i], all = [...chains.skimA.ids, ...chains.skimB.ids, ...chains.skimC.ids].filter((zi) => { const s = plan.locate(ZONES[zi].x, ZONES[zi].z, {}).s; return s >= from - 0.5 && s <= to + 0.5; });
        if (all.length < 2) return;
        w.chain = { ids: all, ring: false }; w.idx = clamp(w.idx, 0, all.length - 1); w.mode = w.mode === 'hidden' ? 'hidden' : 'beat';
      },
    },
    /** For the midges (cast_lights.js parts a column for a passing bat): the bats as it looks for them. */
    batsNear: bats ? { species: 'bat', position: (i, out) => bats.position(i, out), nearest: (x, z, count) => bats.nearest(x, z, count) } : null,
    /** SOUND HOOKS, all null: set them to hear the birds. This module plays nothing.
     *   batDip(x, z, i)          a skimmer's dip (the page: `drop`, pitch 1.6, gain 0.3)
     *   batLeave(x, y, z, i, k)  bat i lets go of its beam, the k-th of fourteen (the page: `flutter` x 3, gain 0.5, overhead to ahead)
     *   roost(what, T)           'ribbon' (0 s: `wind` up, the far hiss), 'pour' (11 s: `rustle` from the tree's position), 'roosted' (13 s), 'last' (18 s: the wings stop)
     *   flit(x, y, z, i), land(x, y, z, i)      one of the three hundred leaves its limb, lands on another
     *  The flock's place for panning its `flutter`s: flock.centre(). */
    on: { batDip: null, batLeave: null, roost: null, flit: null, land: null },
    zones: ZONES, chains, stat: batStat,
  };
  // (aliases: each system under a name of its own, as the family returns it)
  if (flock) cast.murmuration = flock; if (roosted) cast.roosted = roosted; if (bats) cast.bats = bats;

  // ============================================================================================== &bshow=1: the zones, the ring, the funnel
  if (Q.has('bshow')) {
    const pos = [], col = [], C = { av1: [1, 0.8, 0.2], av2: [1, 0.5, 0.2], tree: [0.3, 1, 0.5], skimA: [0.3, 0.8, 1], skimB: [0.5, 0.6, 1], skimC: [0.7, 0.5, 1], mid: [1, 0.3, 0.8], door: [1, 1, 1], home: [0.4, 0.4, 0.4] };
    const seg = (a, b, c) => { pos.push(a[0], a[1], a[2], b[0], b[1], b[2]); col.push(c[0], c[1], c[2], c[0], c[1], c[2]); };
    const circle = (x, y, z, r, c, n = 20) => { for (let k = 0; k < n; k++) { const a0 = k / n * 6.2832, a1 = (k + 1) / n * 6.2832; seg([x + Math.cos(a0) * r, y, z + Math.sin(a0) * r], [x + Math.cos(a1) * r, y, z + Math.sin(a1) * r], c); } };
    ZONES.forEach((z, i) => { if (i < BAT.count) return; const c = C[z.tag] || [1, 1, 1]; circle(z.x, z.y[0], z.z, z.r, c); circle(z.x, z.y[1], z.z, z.r, c); seg([z.x, z.y[0], z.z], [z.x, z.y[1], z.z], c); });
    if (loops.ring) loops.ring.forEach((p, k) => seg(p, loops.ring[(k + 1) % loops.ring.length], [1, 0.2, 0.2]));
    circle(funnel.mouth[0], funnel.mouth[1], funnel.mouth[2], funnel.radius, [1, 0.2, 0.2]);
    for (const [ry, rr] of [[0, 1], [0.7, 0.71], [-0.7, 0.71]]) circle(funnel.into.at[0], funnel.into.at[1] + ry * funnel.into.radii[1], funnel.into.at[2], funnel.into.radii[0] * rr, [1, 0.6, 0.6], 28);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    const lines = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ vertexColors: true, fog: false, depthTest: false })); lines.name = 'bshow'; lines.renderOrder = 50; lines.frustumCulled = false; ctx.add(lines);
  }

  // ============================================================================================== every frame
  let first = true, approached = false, wrote = false, lastS = null, pinned = false;
  const _fw = new THREE.Vector3(), _tc = new THREE.Vector3(), _cp = new THREE.Vector3();
  const tintA = new THREE.Color('#ffffff'), tintB = new THREE.Color('#c9d3ee'), tint = new THREE.Color();
  return {
    update(dt) {
      const s = here.s;
      if (first) debug.first = { s: +s.toFixed(2), path: +ctx.s.toFixed(2), time: +ctx.time.toFixed(3), boat: [+ctx.boat.x.toFixed(1), +ctx.boat.z.toFixed(1)] };
      // ---- the bats
      if (bats) batWalk.update(dt, first);
      // ---- the flock comes nearer by the boat's place (the dusk advances only with travel, and so does this)
      if (flock && !approached && !roost.begun) {
        const m = Q.has('bmix') ? num('bmix', 0) : smooth(FLOCK.approach[0], FLOCK.approach[1], s), S = flock.state;
        if (first) { if (m >= 0.999 || Q.has('broost')) { flock.follow(loops.near.pts, { seconds: 0.05 }); approached = true; } else flock.follow(loops.near.pts, { seconds: 1e7 }); }
        else if (S.mixRate > 0) { S.mix = Math.min(m, 1); } else approached = true;
      }
      // ---- the roost, by itself
      if (!api.staged && (flock || roosted)) {
        const forced = Q.has('broost'), f = (ctx.s - pathS98) / FLOCK.pace;
        if (!roost.on) {
          if (forced) { if (ctx.time >= num('broost', 0)) { roost.on = true; roost.clock = ctx.time - num('broost', 0); roost.forced = true; } }
          else if (first ? s >= FLOCK.at : (lastS != null && lastS < FLOCK.at && s >= FLOCK.at)) { roost.on = true; roost.clock = first ? Math.max(0, f) : 0; }
        }
        if (roost.on) { roost.clock = roost.forced ? roost.clock + dt : Math.max(roost.clock + dt, f); runRoost(roost.clock); }
      }
      if (landing.queue.length) { landing.t += dt; let n = 0; while (landing.queue.length && landing.queue[0].at <= landing.t && n++ < 12) landOne(landing.queue.shift().i); }
      // ---- what is not there is not drawn (fourth holder): the flock once it has gone into the tree (12,000 birds of no size
      // are still 210,000 triangles a frame, for the whole of the second avenue and the tide), the three hundred until the
      // first of them comes. Both by what the family's own handles say, so the staging may show() or appear() them as it likes.
      if (flock) flock.object.visible = flock.state.show > 0.002 || flock.state.showTo > 0;
      if (roosted) {
        let any = false; const B = roosted.birds; for (let i = 0; i < B.length; i++) if (B[i].state !== 9) { any = true; break; }
        // (and not while the great tree is behind the rider's head: three hundred birds in two forms are 78,000 triangles a
        // frame, which the tide, looking west down the second avenue, has better uses for. The family's birds are not culled
        // by the view: this is that test, made once for all of them, with the whole crown's width to spare.)
        if (any) {
          const cam = ctx.engine.camera; cam.getWorldDirection(_fw); _tc.set(treeTop.x, 18, treeTop.z).applyMatrix4(ctx.group.matrixWorld).sub(cam.getWorldPosition(_cp));
          const dist = _tc.length(); any = dist < 45 || Math.acos(clamp(_tc.dot(_fw) / dist, -1, 1)) < 1.05 + Math.atan(32 / dist);
        }
        roosted.object.visible = any;
      }
      // ---- the hour on them: dark shapes that sink a little further as the light goes (they take no shared.dusk: see the log)
      {
        tint.copy(tintA).lerp(tintB, shared.hour || 0);
        if (roosted) { roosted.material.uniforms.uColor.value.copy(tint); if (roosted.perched) roosted.perched.material.uniforms.uColor.value.copy(tint); }
        if (Q.has('bmark') && roosted && roosted.perched) roosted.perched.material.uniforms.uColor.value.setRGB(60, 3, 3);      // (developer: &bmark=1 paints the roosted red, to find them)
        if (Q.has('bmirror') && flock && flock.mirror && flock.mirror.material.uniforms.uColor) flock.mirror.material.uniforms.uColor.value.setRGB(60, 3, 3);      // (developer: &bmirror=1 paints the flock's mirror birds red, to find them in the water)
        if (bats) bats.material.uniforms.uColor.value.copy(tint);
      }
      // ---- developer
      if (Q.has('bpin')) {                                               // &bpin=<s>[,ahead,side]: what a skimmer's dip leaves, written 6 m ahead of the boat (or so far ahead and to starboard) at that time
        const q = Q.get('bpin').split(',').map(Number), at = q[0] || 0;
        if (!pinned && ctx.time >= at) { pinned = true; const h = ctx.boat.heading, a = q[1] ?? 6, sd = q[2] ?? -2, x = ctx.boat.x - Math.sin(h) * a + Math.cos(h) * sd, z = ctx.boat.z - Math.cos(h) * a - Math.sin(h) * sd; ctx.water.ripple(x, z, 0.12, 0.15); if (ctx.water.trace && ctx.water.trace.inject) ctx.water.trace.inject(x, z, BAT.mark); }
      }
      if (bfov) { const c = ctx.engine.camera; if (c.fov !== bfov) { c.fov = bfov; c.updateProjectionMatrix(); } }
      if (Q.has('bwatch')) {
        const who = Q.get('bwatch'), cam = ctx.engine.camera, p = who === 'flock' ? (flock ? flock.centre(_c) : null) : bats ? bats.position(+who || 0, _c) : null;
        if (p) { p.applyMatrix4(ctx.group.matrixWorld); cam.lookAt(p); }
      }
      if (Q.has('bdebug') && !wrote && ctx.time >= num('bdebug', 3)) {
        wrote = true;
        debug.zones = ZONES.map((z, i) => ({ i, tag: z.tag, s: +plan.locate(z.x, z.z, {}).s.toFixed(1), d: +plan.locate(z.x, z.z, {}).d.toFixed(1), r: z.r, y: z.y }));
        if (bats) debug.bats = bats.birds.map((b, i) => { const l = plan.locate(b.x, b.z, {}); return { i, beat: BAT.beats[i], mode: batWalk[i].mode, zone: b.zone, s: +l.s.toFixed(1), d: +l.d.toFixed(1), y: +b.y.toFixed(2), inWood: air.solid(b.x, b.y, b.z, 0.2) }; });
        debug.stat = batStat; debug.chains = Object.fromEntries(Object.entries(chains).map(([k, c]) => [k, { ids: c.ids, ring: c.ring }]));
        debug.roost = { ...debug.roost, T: roost.T, on: roost.on, settled: roost.settled, mouth: funnel.mouth, into: funnel.into, here: { s: +s.toFixed(1), path: +ctx.s.toFixed(1) } };
        if (flock && flock.mirror) { const w = ctx.engine.water, vc = w && w.virtualCamera; debug.mirror = { layers: flock.mirror.layers.mask, visible: flock.mirror.visible, parentVisible: flock.object.visible, instances: flock.mirror.geometry.instanceCount, drawn: mirrorDrawn, waterClass: w && w.constructor && w.constructor.name, vcLayers: vc ? vc.layers.mask : null, scale: flock.mirror.material.uniforms.uBirdScale.value, show: flock.mirror.material.uniforms.uShow.value }; }
        if (flock) { const c = flock.centre(_c), l = plan.locate(c.x, c.z, {}); debug.flock = { count: flock.count, mirror: flock.mirrorCount, centre: [+c.x.toFixed(1), +c.y.toFixed(1), +c.z.toFixed(1)], s: +l.s.toFixed(1), d: +l.d.toFixed(1), fromEye: +Math.hypot(c.x - ctx.boat.x, c.y - 1.1, c.z - ctx.boat.z).toFixed(1), mix: flock.state.mix, poured: flock.poured, far: loops.far.at, near: loops.near.at }; }
        if (roosted) debug.roosted = { flits: roostStat.flits, count: roosted.count, sitting: roosted.birds.filter((b) => b.state === 1).length, flying: roosted.birds.filter((b) => b.state === 3).length, flown: landing.flown, inPlace: landing.inPlace };
        if (Q.get('bdump') === 'tree') {                                   // (developer) the oldest tree as numbers: its masses of blossom, its limbs, its perches
          const r2 = (v) => +v.toFixed(2);
          debug.tree = { at: [r2(treeAt.x), r2(treeAt.z)], top: [r2(treeTop.x), r2(treeTop.y), r2(treeTop.z)],
            lobes: (shared.blossom && shared.blossom.all ? shared.blossom.all.filter((L) => L.old) : []).map((L) => [r2(L.c.x), r2(L.c.y), r2(L.c.z), r2(L.rad)]),
            pads: (tree.lobes || []).map((l) => [r2(l.cx), r2(l.cy), r2(l.cz), r2(l.r)]),
            paths: (tree.paths || []).map((l) => ({ name: l.name, limb: l.limb, pts: l.path.map((q, i) => [r2(q.x), r2(q.y), r2(q.z), r2(l.radius[i])]) })),
            perches: (tree.perches || []).map((q) => [r2(q.x), r2(q.y), r2(q.z)]),
            seats: roosted ? roosted.perches.map((q) => [r2(q.x), r2(q.y), r2(q.z)]) : [] };
        }
        fetch('/__shot/orchard_bi_debug.json', { method: 'POST', body: JSON.stringify(debug, null, 1) }).catch(() => {});
      }
      lastS = s; first = false;
    },
  };
}

// The way the wood runs under each perch: shared.tree.perches are points on top of wood, and a perched bird sits ACROSS
// its bough and sidles along it only if it is told which way the bough runs. Most perches are on the thin branches of
// the crown's pads, whose lines the tree's numbers do not carry, so the direction is read from the wood itself: the
// nearest long edge of the crown's own triangles (a bough is a tube of long thin triangles: its long edges run along it).
// Returns [[dx, dy, dz] | null, ...].
function boughDirs(ctx, tree, pts, debug) {
  const out = pts.map(() => null), best = pts.map(() => 0.42);        // (no further than this from the perch, or it is somebody else's wood)
  try {
    const meshes = [];
    for (const k of ['crownTwigs', 'crown']) { const m = tree.wood && tree.wood[k]; if (m && m.group) m.group.traverse((o) => { if (o.isMesh && o.geometry && o.geometry.attributes && o.geometry.attributes.position) meshes.push(o); }); }
    if (!meshes.length) return out;
    const CELL = 2, grid = new Map(), key = (i, j, k) => `${i},${j},${k}`;
    pts.forEach((p, n) => { const k = key(Math.floor(p.x / CELL), Math.floor(p.y / CELL), Math.floor(p.z / CELL)); (grid.get(k) || grid.set(k, []).get(k)).push(n); });
    ctx.group.updateWorldMatrix(true, true);
    const inv = new THREE.Matrix4().copy(ctx.group.matrixWorld).invert(), rel = new THREE.Matrix4(), v = new THREE.Vector3();
    let tris = 0;
    for (const mesh of meshes) {
      const pos = mesh.geometry.attributes.position, idx = mesh.geometry.index, n = pos.count, P = new Float32Array(n * 3);
      rel.multiplyMatrices(inv, mesh.matrixWorld);
      for (let i = 0; i < n; i++) { v.fromBufferAttribute(pos, i).applyMatrix4(rel); P[i * 3] = v.x; P[i * 3 + 1] = v.y; P[i * 3 + 2] = v.z; }
      const count = idx ? idx.count : n;
      for (let t = 0; t < count; t += 3) {
        const ia = idx ? idx.getX(t) : t, ib = idx ? idx.getX(t + 1) : t + 1, ic = idx ? idx.getX(t + 2) : t + 2;
        // its longest edge
        let a = ia, b = ib, l2 = 0;
        for (const [p, q] of [[ia, ib], [ib, ic], [ic, ia]]) { const dx = P[q * 3] - P[p * 3], dy = P[q * 3 + 1] - P[p * 3 + 1], dz = P[q * 3 + 2] - P[p * 3 + 2], d2 = dx * dx + dy * dy + dz * dz; if (d2 > l2) { l2 = d2; a = p; b = q; } }
        if (l2 < 0.09) continue;                                         // (shorter than 0.3 m: an end cap, a knuckle: it says nothing of the way the wood runs)
        tris++;
        const ax = P[a * 3], ay = P[a * 3 + 1], az = P[a * 3 + 2], ux = P[b * 3] - ax, uy = P[b * 3 + 1] - ay, uz = P[b * 3 + 2] - az;
        const i0 = Math.floor((Math.min(ax, ax + ux) - 0.45) / CELL), i1 = Math.floor((Math.max(ax, ax + ux) + 0.45) / CELL), j0 = Math.floor((Math.min(ay, ay + uy) - 0.45) / CELL), j1 = Math.floor((Math.max(ay, ay + uy) + 0.45) / CELL), k0 = Math.floor((Math.min(az, az + uz) - 0.45) / CELL), k1 = Math.floor((Math.max(az, az + uz) + 0.45) / CELL);
        for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) for (let k = k0; k <= k1; k++) {
          const list = grid.get(key(i, j, k)); if (!list) continue;
          for (const m of list) {
            const p = pts[m], tt = clamp(((p.x - ax) * ux + (p.y - ay) * uy + (p.z - az) * uz) / l2, 0, 1), d = Math.hypot(p.x - ax - ux * tt, p.y - ay - uy * tt, p.z - az - uz * tt);
            if (d < best[m]) { best[m] = d; const l = Math.sqrt(l2); out[m] = [ux / l, uy / l, uz / l]; }
          }
        }
      }
    }
    // a bough that climbs steeply is not one to sidle along: the bird sits where it is
    for (let m = 0; m < out.length; m++) if (out[m] && Math.abs(out[m][1]) > 0.62) out[m] = null;
    if (debug) { debug.perches.edges = tris; debug.perches.far = best.filter((d) => d >= 0.42).length; }
  } catch (err) { console.error('INVALID_ (birds) the boughs under the perches could not be read: ' + ((err && err.message) || err)); }
  return out;
}
