// The answering sea: the cast, group "Birds" (docs/build/sea/3-cast-birds.md): the storm petrels, 48 in four parties
// of 12, the one thing alive in the air, seen mostly by what they write on black water. The page: docs/art/sea.md,
// sections 5 to 8.
//
// The bird, its three states (patter into the wind on the water, shear away low, flutter and settle), its lift when the
// boat comes within 9 m and its ways in and out of places are the family's (src/engine/life/birds.js, docs/life/birds.md).
// Made here, because this place needs them otherwise:
//   - where it may fly. The family knows nothing of rock: a shear is one bowed line to a chance place in a circle, and a
//     patter drifts upwind with no look ahead. Here every shear the family begins is led to clear water of the bird's own
//     party before it has gone a hand's breadth (`aim`): a landing with room to patter upwind, a line that passes no rock
//     and keeps its distance from where the boat will be. A patter is trimmed to the water ahead of it and ended at rock.
//     A bird that leaves a crevice is led out along the crevice's own way; one that enters is led in against it.
//   - its marks on the water: the stitches. The family writes a dab into the water's trace; in this area the trace is
//     drawn by the sea's own sheet as a dusting of fine specks (light.js), in which a dab a hand wide is a few grains: a
//     stitch written so cannot be seen from a boat's length. So every footfall is drawn here as ONE mark of the area's
//     own paint lying on the water (a comma: a round head and a tail drawn out downwind, dry-brushed), which is core for
//     its first third of a second, then aqua, ember and violet, and goes out through the sheet's own specks: `stitches`.
//     The trace still gets its dab, on the area's scale (a strength there is an AGE: docs/build/sea/2-light.md).
//   - its light. The family's bird takes the ride's global light, which here is the sea's aqua travelling upward by where
//     the BOAT is. A petrel is a dark bird in the sea's own night (the rock's sky, the rock's rain front), lit from
//     beneath only where the front has passed THAT bird: an extension laid over the family's material (`birdLight`).
//   - its moments: six out of the gate's crevices as the bow enters (moment 5), the left party towering as the weather
//     turns and coming down again (moment 8), the last party into the wall's crevices (moment 11), and in the gate, all
//     the time, a bird now and then into a crevice and out again.
//
// What this module gives staging is under shared.cast.birds (the end of build). It plays no sound: 'lift', 'emerge',
// 'home' and 'gone' are events (shared.cast.birds.on).
//
// Switches for looking: &bdplan=<name>.json&bdlog=<seconds> (after so many seconds, write the rock, the waters, the
// crevices and every frame of the boat and of every bird to .shots/: this group's plan.py draws it from above);
// &bdstudy=<n> (n birds feeding 8 m ahead of where the boat is put, that do not lift until it is 2.5 m off:
// &bdsa=<ahead>&bdsd=<right>); &bdpose=patter|shear|flutter|tower (one bird held in that pose,
// &bdpa=<ahead>,<right>,<up>&bdturn=<degrees>&bdroll=<radians>); &bdstitch=<gain>,<life>,<head>,<tail> (try other
// stitches); &bdtrace=0 (nothing into the water's trace); &bdmarks=0 (they write nothing at all);
// &bdpaint=<rest>,<sky>,<sea>,<high> (its light); &bdtouch=<own>,<reach>,<trace>,<gate>,<wrap> (the light of what it
// touches); &bdmark=<metres> (a bright point so far over every bird, to find them in a picture: pink in the air, yellow on
// the water); &bdscale=<k> (larger than life, for looking only); &bdall=1 (no
// party sleeps); &bdonly=left,wall (only these parties); &bdtraffic=0 (nobody goes in and out of crevices);
// &play=petrels-gate | petrels-weather | petrels-wall (the three moments at once); &bdtower=<seconds> (the left party, or
// &bdtowerwho=<party>, goes up at that time and stays up).
import * as THREE from 'three';
import { makeFlock } from '../../engine/life/birds.js';
import { WATER_GLSL, WATER_SURFACE_GLSL, waterUniforms } from '../../engine/water-final.js';
import { FOG_PARS } from '../../engine/kit.js';
import { SEA_GLSL } from './light.js';

// ------------------------------------------------------------------------------------------------ the group's numbers
// (kept here and not in plan.js, which the set's people are editing: nothing else reads them)
const BIRDS = {
  count: 12,                       // birds to a party (the page: 48 in four parties)
  // ---- the page's distances
  flush: 9, flushCalm: 13,         // a bird lifts when the boat is within this (with reduced motion: sooner, so that nothing quick is near the eye)
  settle: [20, 30],                // ... and settles this far from the boat
  shear: [12, 32],                 // metres of an ordinary shear (the page: 15 to 30)
  // The family's own guard round the eye is NOT used (keepOut 0). It bulges a path that would pass the eye, and where a
  // bird on a falling or rising course is at the rim of its reach it throws the bird metres aside for one frame (its rule
  // "never ducked under the eye" turns the push without shortening it: measured here, a bird 12 m from the eye thrown
  // 3.7 m up and back; the log, "Asked of the toolkit"). The page's 5 m is kept by where this module lets a shear pass:
  // no nearer than `boatClear` to where the boat will be then; and a bird that still finds itself within `shy` metres
  // of the boat and closing (the rider has turned or paddled) is led off again from where it is
  boatClear: 8, boatClearCalm: 13, boatLeast: 5.2, boatLeastCalm: 8, shy: 5.6, shyCalm: 8.5,
  // ---- rock
  landPad: 1.0,                    // metres of water between rock and a place a bird may come down on
  flyPad: 0.5,                     // ... and between rock and a shear's line
  run: 4.5,                        // metres of clear water upwind of a landing (4 to 9 s of patter at 0.5 m/s and more)
  // ---- the stitches: what a foot writes. One mark for every step (six a second; every second step at low quality).
  //   pool    marks alive at once (thinned by the quality setting)        life    seconds a mark lasts (each 0.7 to 1.3 of it)
  //   head    metres: the radius of a mark's head                           tail    metres of tail, by how fast the bird patters
  //           (the page's dab is 0.18 m: here a comma 0.12 to 0.22 m long, its head 0.09 m across: wider, the two feet's
  //           rows ran together into a ladder of bars)
  //   lean    radians a mark may lie either side of the wind (the area's marks all lean down the wind: light.js, makeMarks)
  //   gain    how bright against the sheet's own marks                      far     metres from the boat beyond which none is written
  //   pixel   far off, where a mark lying on the water is thinner than the screen can draw, its far edge is raised and its
  //           near edge lowered by this many pixels each
  //   trace   what goes into the water's trace beside it: one dab for every `every` steps, its radius (three cells of the
  //           trace at least: 2-light.md), its age (0.6 is new light and the hull's own; 0.5 is ember)
  //   miss    the share of steps that leave nothing (a foot that only brushes the water: no two stitch lines are ruled alike)
  //   weight  no two footfalls weigh the same: a mark is this many times the head and tail above, most of them light, a few heavy
  //           (every one the same oval at the same stride, a line of stitches was a string of beads: the Comets' log, and sea_b3_a04_crop.png)
  //   speck   the share of footfalls that also throw a speck of water down the wind: its place (metres), its size against the mark's
  stitch: { pool: 1536, life: 9, head: 0.045, tail: [0.07, 0.17], lean: 0.3, gain: 1.3, miss: 0.1, far: 70, pixel: 0.8, trace: { every: 2, radius: 0.3, age: 0.5 },
    weight: [0.42, 1.75, 1.9], speck: { share: 0.3, off: [0.06, 0.2], size: [0.3, 0.55] } },
  // ---- how it patters (third holder). The family walks every bird straight up the wind at one pace, so a party's lines
  // lay parallel like a ruled page, each an even zip. A petrel hangs, sidles and goes on:
  //   pace    its pace swells and slackens about its own mean, between these shares of it (and never outside `speed`, m/s:
  //           slow, the footfalls crowd into a knot; fast, they string out)
  //   bear    radians either side of the wind a patter's own way may lie (it faces the wind and crabs across it)
  //   slip    m/s it sidles to and fro besides
  //   hop     every so many seconds it lifts clear for so many steps: a gap in the line
  patter: { pace: [0.3, 1.7], speed: [0.28, 1.6], bear: 0.36, slip: 0.2, hop: { every: [1.4, 4.0], steps: [2, 5] } },
  tip: { length: 0.55, half: 0.028, life: 5, trace: { radius: 0.3, age: 0.5 } },      // a wingtip that cuts the water in a banked turn: a scratch
  // ---- its light: the paint's cast in this night, what is left of local colour at rest, how much of the sky a back
  // takes, how much of the lit sea a belly takes behind the front, how much of the lit cloud the whole bird
  // (sea was 1.0 and high 0.8: over the lit sea the bird was a teal paper shape of the water's own value, and could not be
  // found among the rings; it is a dark bird whose underside takes a breath of the sea's colour)
  paint: { tint: '#9aa6cf', rest: 0.5, sky: 0.3, sea: 0.2, high: 0.3 },
  // ---- the light of what it touches (third holder). At rest a sooty bird on black water could not be found at any
  // distance (at 7 m: a grey smudge with a pale dot), and the page counts the petrels among the inhabitants that can
  // be watched. The area's own law lights it: every solid is lit from its waterline upward by light that something has
  // just made. While its feet are on the water the bird is lit from beneath by what it writes: most on the rump, the
  // belly and the pale bar under the wing, dying up the raised wings, gone as it lifts. The water's own light under it
  // does the same in small: the hull's road and others' marks (the trace), and in the gate the floor that a crest floods.
  //   own     how bright its own footfalls light it        reach   metres up the bird over which that light dies
  //   trace   ... and the light the water's trace holds under it (0.36 of an age and less lights nothing)
  //   gate    ... and the gate's lit floor (the set's uSeaL.z), which reaches `gateReach` metres up
  //   wrap    how much of it a face that looks UP takes (thrown water and thin feathers: 0 = lit strictly from beneath)
  touch: { own: 0.5, reach: 0.17, trace: 0.3, gate: 3.2, gateReach: 7, wrap: 0.3 },
  far: [95, 112],                  // metres from the boat: a party wakes within the first and sleeps beyond the second (not drawn, not moved)
  size: { minPixels: 7, maxGrow: 1.05 },      // never drawn larger than 40 cm (the page), however far
  // ---- crevices. clear: the most metres of rock between a crevice and water a bird may fly over, along its way out
  // (further in, it is not used); boat: none is entered or left while the boat is this near it; pad: metres more of its
  // way that may lie in rock; rim, up: a bird is lost to sight this far out from the middle of a ledge (at its front
  // rim) and this far over it: the family brings a bird to a place from BELOW, steeply over its last metre, so a place
  // on the ledge or behind it would be reached through the column's own face; slow: seconds more of flight for each
  // metre of height lost or won
  crevice: { clear: 5.5, boat: 9, pad: 1.2, rim: 0.5, up: 0.3, slow: 0.3 },
  // ---- moment 5: six leave crevices as the bow enters the gate. s: where the boat is then (its bow is 2.4 m ahead of it);
  // over: seconds from the first to the last; ahead: metres from the boat their crevices lie, and off: no more than so many
  // radians off its bow (a ledge is chosen as its bird's moment comes: in a rider's forward view); ledge: which of the
  // kit's ledges serve (the jambs' front row inside the passage: by s, by |d|, by height: the stumps that stand free in
  // the water are not crevices, and nothing perches)
  gate: { s: 80, count: 6, over: 3.8, ahead: [13, 30], off: 0.68, ledge: { s: [86.5, 105.5], d: [11.6, 13.4], y: 4.5 } },
  // ---- ordinary life in the gate: every so many seconds one feeding bird goes into a crevice, stays, and comes out
  // (reach: metres a bird flies to one: not under 10, or it would still be low when it reaches the rock)
  traffic: { every: [5, 10], stay: [4, 11], most: 3, reach: [10, 30] },
  // ---- moment 8: the left party lifts and towers as the weather turns. height: metres they climb; over: seconds from
  // the first to the last; hold: seconds they hang if nothing calls them down (the show's clock does, at T 1.5: the
  // wind drops); down: seconds over which they come down
  weather: { s: 144, height: [5, 9], over: 2.5, hold: 10, down: 4 },
  // ---- moment 11: the last party flies into crevices of the wall. over: seconds from the first to the last; wait: seconds
  // a bird that has just come down feeds before it goes; points: places on the Prow's front (no crevice of the wall is
  // named by the set: see the log, "Asked of the set"), set in from its two corners by `inset` metres, `front` metres
  // in front of the faces of its front rank of columns, between these heights (over the plinth's stumps, which stand to 2 m).
  // (Third holder: the Prow's front is 55 to 75 degrees off the bow of a boat that has reached s 224, and at `over` 11 the
  // last bird went in when the boat was 10 m inside the cave: half the party was never seen to go. So: over 4 s; the Prow's
  // points only along its half nearest the cleft (`prow`: how many, and how far from its inner corner they reach); and
  // `cleft`: places on the two walls of the cleft's own mouth, which stands dead ahead: so many a side, from `in[0]` to
  // `in[1]` metres in from the face, `front` metres in front of the faces of the walls' columns (the kit: their axes stand
  // 8.55 m either side of the line, 1.0 to 1.3 m across, leaning in 0.05). `like`: how much rather a bird takes one of those.)
  // `near`: the shortest way a bird of this party may fly to its place (the family climbs over the second half of the way:
  // from nearer than this it would go up the wall like a lift)
  wall: { s: 224, over: 4, wait: [0.3, 1.2], near: 7, points: 11, inset: 1.5, front: 0.3, y: [3.6, 5.8], prow: { points: 6, reach: 7.5 },
    cleft: { points: 6, in: [0.6, 7.2], axis: 8.55, half: 0.6, lean: 0.05, front: 0.32, y: [3.4, 6.2], like: 5 } },
  // ---- the parties: their waters as discs [s, d, radius] of open water, in the order a rider meets them
  parties: [
    { name: 'reach', seed: 61, waters: [[33, 2, 9], [42, -7, 8], [50, -10.5, 6.5], [60, -5, 8], [69, -3, 7.5]] },      // s 30 to 76; the lee of stack 2 is its third water
    { name: 'gate', seed: 67, waters: [[79, -1, 7], [89, 0, 7.5], [99, 0, 8], [110, 0, 10], [118, -6, 8]], held: 6, traffic: true },   // the gate and its exit; six are in crevices until the bow enters
    { name: 'left', seed: 71, waters: [[129, -11, 8.5], [141, -12.5, 8.5], [153, -13.5, 8.5], [165, -14, 8.5]] },     // the left of the sound: 9 to 20 m from a boat on the line (further out, at 16 to 36 m, they could not be found)
    // under the tower's far side, along the wall, and in the mouth of the cleft. `ahead`: from this s on, a bird of this party that
    // the boat puts up comes down AHEAD of the boat while there is water there: the boat drives them before it to the wall, where
    // they go in (as first laid, with no water beyond s 236, every bird the boat put up came down behind it, and when their
    // moment came the whole party flew to the wall from astern: the third holder's log)
    { name: 'wall', seed: 73, waters: [[198, -12, 9], [209, -13, 9], [220, -13, 9], [229, -10, 7], [235.5, -1.5, 5.6], [241.5, 0, 5]], ahead: 196 },
  ],
};
// the family's own numbers for what a bird is doing (src/engine/life/birds.js, ST: not exported)
const ST = { PATTER: 5, SHEAR: 6, GONE: 9, MANUAL: 10, TOWER: 11, AWAY: 12 };
const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

export async function build(ctx, plan, shared) {
  const { kit, stage } = ctx, P = plan, sea = shared.sea, path = ctx.path;
  const cast = shared.cast = shared.cast || {};
  if (!sea || !sea.uniforms) return {};                     // (the place and its light did not build: nothing for the cast to stand in)
  const params = new URLSearchParams(typeof location !== 'undefined' ? location.search : '');
  const num = (k, d) => (params.has(k) && params.get(k) !== '' && !Number.isNaN(+params.get(k)) ? +params.get(k) : d);
  const list = (k) => (params.get(k) || '').split(',').map((v) => (v === '' ? NaN : +v));
  const U = sea.uniforms, answer = () => U.uSeaL.value.y;   // 0..1: whether the water answers at all (0 before the cue 'firstlight' and deep in the cave)
  const calm = !!ctx.reducedMotion, boat = ctx.boat, water = ctx.water;
  const within = calm ? BIRDS.flushCalm : BIRDS.flush, boatClear = calm ? BIRDS.boatClearCalm : BIRDS.boatClear;
  const bcLow = calm ? BIRDS.boatLeastCalm : BIRDS.boatLeast, shy = calm ? BIRDS.shyCalm : BIRDS.shy;      // (where no line keeps boatClear: the least it may keep; and when a bird in the air is led off again)
  const rnd = ctx.rng(4801);
  const lowQ = kit.count(100) < 75;                         // (low quality: half the birds, and a stitch for every second step)
  { const q = list('bdstitch'), S = BIRDS.stitch; if (q[0] > 0) S.gain = q[0]; if (q[1] > 0) S.life = q[1]; if (q[2] > 0) S.head = q[2]; if (q[3] > 0) S.tail = [q[3] * 0.42, q[3]]; }
  { const q = list('bdpaint'), S = BIRDS.paint; if (q[0] >= 0) S.rest = q[0]; if (q[1] >= 0) S.sky = q[1]; if (q[2] >= 0) S.sea = q[2]; if (q[3] >= 0) S.high = q[3]; }

  // ---------------------------------------------------------------------------------------------- the wind
  // The swell's own way (the page: wind and swell come from ahead-left): petrels feed facing into it.
  const wd = P.water.swellDir || [0.9, 0.42], wl = Math.hypot(wd[0], wd[1]) || 1, wind = [wd[0] / wl, wd[1] / wl], up = [-wind[0], -wind[1]];

  // ---------------------------------------------------------------------------------------------- rock
  // Everything a bird must not pass through, as discs on the water: the kit's colliders (each a rock and about a metre
  // of water round it: for a bird half a metre of that is taken off), and the hero pieces, whose colliders are not
  // published: taken from the plan (the skerry's outline, the wreck's reef, the buoy, the dans and the floats).
  const rock = [];
  for (const c of (shared.rocks && shared.rocks.colliders) || []) rock.push({ x: c.x, z: c.z, r: Math.max(0.5, c.r - 0.5) });
  {
    const disc = (s, d, r) => { const p = kit.at(s, d, 0); rock.push({ x: p.x, z: p.z, r }); };
    // the skerry: discs along its waterline and over its inside
    const poly = P.skerry.outline.map(([s, d]) => kit.at(s, d, 0));
    const inside = (x, z) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const a = poly[i], b = poly[j]; if ((a.z > z) !== (b.z > z) && x < (b.x - a.x) * (z - a.z) / (b.z - a.z) + a.x) c = !c; } return c; };
    for (let i = 0; i < poly.length; i++) { const a = poly[i], b = poly[(i + 1) % poly.length], n = Math.max(1, Math.round(a.distanceTo(b) / 2.4)); for (let k = 0; k < n; k++) rock.push({ x: a.x + (b.x - a.x) * k / n, z: a.z + (b.z - a.z) * k / n, r: 2.0 }); }
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const p of poly) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); z0 = Math.min(z0, p.z); z1 = Math.max(z1, p.z); }
    for (let x = x0; x <= x1; x += 3.4) for (let z = z0; z <= z1; z += 3.4) if (inside(x, z)) rock.push({ x, z, r: 2.6 });
    if (P.skerry.reefToWall) for (const d of [10.5, 16, 21.5]) disc(234, d, 3.2);
    // the wreck on its reef (awash: a bird that patters over it would stand in rock at every trough)
    const wr = P.wreck.reef; for (const s of [wr.s[0] + 4, (wr.s[0] + wr.s[1]) / 2, wr.s[1] - 4]) for (const d of [wr.d[0] + 5.5, wr.d[1] - 5.5]) disc(s, d, 6.2);
    disc(P.buoy.at[0], P.buoy.at[1], P.buoy.across / 2 + 1.0);      // the bell buoy swings on its chain
    for (const [s, d] of P.dans) disc(s, d, 0.8);
    for (const [s, d] of P.floats) disc(s, d, 0.6);
  }
  // (Third holder.) The kit's colliders are laid for a boat, and in two places they leave rock that a bird could cross:
  //   the gate: along each jamb a row of small circles with gaps of half a metre between them once a bird's half metre is taken
  //   off, and behind that row, at the corners of the passage, a strip of the wall that the great circles do not reach (the
  //   Comets' log found the same): closed here with discs over the whole of the wall's foot beside the passage;
  //   the cleft and its cave: the circles stand 9.5 m either side of the line and reach in to 8.5 m, and the faces of the walls'
  //   columns stand at 7.65 to 8.05 m: closed with a row of discs along each wall.
  // And the nine stumps that stand free in the water along the gate's left jamb, each as a disc of its own with its height
  // (`tall`): a bird on its way up to a ledge, or down from one, passes over them or not at all.
  const tall = [];
  {
    const g = (shared.rocks && shared.rocks.gate) || path.at(P.gate.s, {}), G = P.gate, half = (G.thickAt ? G.thickAt(0) : 20) / 2;
    for (const side of [-1, 1]) for (let d = G.open + 0.1; d <= G.open + 8.2; d += 2) for (let v = -(half - 1.4); v <= half - 1.39; v += (2 * half - 2.8) / 9) rock.push({ x: g.x + g.rx * side * d + g.tx * v, z: g.z + g.rz * side * d + g.tz * v, r: 1.5 });
    for (const st of (shared.rocks && shared.rocks.gateStumps) || []) { if (!(st.h > 0.3)) continue; const r = (st.w || 0.8) / 2 + 0.25; rock.push({ x: st.x, z: st.z, r }); tall.push({ x: st.x, z: st.z, r: r + 0.15, h: st.h }); }
    const tmpW = {};
    for (let sAt = P.wall.s - 0.6; sAt <= P.length + 3.5; sAt += 1.3) for (const side of [-1, 1]) {
      const a = path.at(Math.min(sAt, P.length), tmpW), over = Math.max(0, sAt - P.length), d = side * 8.95;
      rock.push({ x: a.x + a.rx * d + a.tx * over, z: a.z + a.rz * d + a.tz * over, r: 1.3 });
    }
  }
  const hit = (L, x, z, pad) => { for (let i = 0; i < L.length; i++) { const q = L[i], dx = x - q.x, dz = z - q.z, R = q.r + pad; if (dx * dx + dz * dz < R * R) return i; } return -1; };
  /** Is (x, z) on a party's own water (or within `pad` metres of it)? */
  const onWater = (W, x, z, pad) => { for (let i = 0; i < W.length; i++) { const w = W[i], dx = x - w.x, dz = z - w.z, R = w.r + pad; if (dx * dx + dz * dz < R * R) return true; } return false; };
  /** Metres a bird can patter from (x, z) upwind, or `bear` radians off the wind (a patter's own way): clear of rock, and on its party's water (it may leave that by `over` metres), up to 14. */
  const runAt = (party, x, z, over = 2, bear = 0) => {
    const c = Math.cos(bear), s = Math.sin(bear), ux = up[0] * c - up[1] * s, uz = up[0] * s + up[1] * c;
    for (let d = 0.5; d <= 14; d += 0.5) { const qx = x + ux * d, qz = z + uz * d; if (hit(party.rock, qx, qz, 0.45) >= 0 || !onWater(party.waters, qx, qz, over)) return d - 0.5; }
    return 14;
  };
  const waterY = (x, z) => (water && water.heightAt ? water.heightAt(x, z) : 0);

  // ---------------------------------------------------------------------------------------------- its light
  // A dark bird in the sea's own night. Laid over the family's material (the family builds it with kit.gouache: here it
  // is handed a kit whose gouache adds one more extension). What it does: the family's bird takes the ride's global
  // light, which in this area is the sea's aqua travelling upward by where the BOAT is; a petrel would stand at rest as
  // a teal ghost, and far from the boat would be lit by a front that has not reached it. Instead, as the sea's rock:
  //   at rest      local colour sunk toward the night; the sky's slate on what looks up; the bow lantern and the kept lamp
  //   behind the rain front (where the front has passed THIS bird): the lit sea from beneath, on bellies and underwings,
  //                aqua just over the water and ember higher, gone within a few metres; the lit cloud's slate on the rest
  // None of the rock's wash, threads or marks: a bird is not a foot of basalt, and nothing on it glows.
  const paintK = { value: new THREE.Vector4(BIRDS.paint.rest, BIRDS.paint.sky, BIRDS.paint.sea, BIRDS.paint.high) };
  // the light of what it touches: x its own footfalls, y the metres it reaches up the bird, z the trace under it, w the gate's floor; and the gate
  // itself (uPbGate: the middle of its passage, x and z, and the way through it; uPbGateB: half its length, half its width, metres its floor's light reaches up, wrap)
  const TC = BIRDS.touch;
  { const q = list('bdtouch'); if (q[0] >= 0) TC.own = q[0]; if (q[1] > 0) TC.reach = q[1]; if (q[2] >= 0) TC.trace = q[2]; if (q[3] >= 0) TC.gate = q[3]; if (q[4] >= 0) TC.wrap = q[4]; }
  const touchK = { value: new THREE.Vector4(TC.own, TC.reach, TC.trace, TC.gate) };
  const gateF = (shared.rocks && shared.rocks.gate) || path.at(P.gate.s, {});
  const gateK = { value: new THREE.Vector4(gateF.x, gateF.z, gateF.tx, gateF.tz) }, gateB = { value: new THREE.Vector4(P.gate.thickAt ? P.gate.thickAt(0) / 2 : 10, P.gate.open ?? 12, TC.gateReach, TC.wrap) };
  const birdLight = {
    uniforms: { uSwell: U.uSwell, uSeaFront: U.uSeaFront, uSeaL: U.uSeaL, uSeaLee: U.uSeaLee, uSeaRim: U.uSeaRim, uSeaAqua: U.uSeaAqua, uSeaEmber: U.uSeaEmber, uSeaCore: U.uSeaCore,
      uSeaFillLow: U.uSeaFillLow, uSeaFillHigh: U.uSeaFillHigh, uSeaSky0: U.uSeaSky0, uSeaSky1: U.uSeaSky1, uPbK: paintK,
      tTrace: U.tTrace, uTraceRect: U.uTraceRect, uPbT: touchK, uPbGate: gateK, uPbGateB: gateB },
    // (how much light its own footfalls are giving it now: a number for every bird, kept by this module (`lit`, below) and
    // hung on the family's own geometry. The family's "legs down" would not do: they come down before a bird has touched the water)
    vertexPars: /* glsl */`attribute float aPbLit; varying float vPbFeet;`,
    vertexLocal: /* glsl */`vPbFeet = aPbLit;`,
    fragmentPars: /* glsl */`
      uniform vec4 uSwell[3]; uniform vec4 uSeaFront, uSeaL, uSeaLee, uSeaRim, uPbK, uTraceRect, uPbT, uPbGate, uPbGateB; uniform vec3 uSeaAqua, uSeaEmber, uSeaCore, uSeaFillLow, uSeaFillHigh, uSeaSky0, uSeaSky1;
      uniform sampler2D tTrace; varying float vPbFeet;
      float pbSwell(vec2 xz) { float h = 0.0; for (int i = 0; i < 3; i++) h += uSwell[i].w * cos(dot(uSwell[i].xy, xz) - uSwell[i].z); return h; }`,
    light: /* glsl */`{
      // how lit the sea is under THIS bird: behind the rain front, by the sea's light along the route, less in the lee round the kept lamp
      float pbF = clamp((uSeaFront.z - dot(uSeaFront.xy, vWPos.xz)) * uSeaFront.w + 0.5, 0.0, 1.0); pbF = pbF * pbF * (3.0 - 2.0 * pbF);
      float pbLee = 1.0 - uSeaLee.w * (1.0 - smoothstep(uSeaLee.z * 0.35, uSeaLee.z, distance(vWPos.xz, uSeaLee.xy)));
      float pbLit = pbF * uSeaL.x * mix(1.0, pbLee, 0.45);
      float pbLum = dot(albedo, vec3(0.3, 0.6, 0.1));
      float pbTake = clamp(sqrt(pbLum / 0.04), 0.5, 2.6);                              // how readily this paint takes light: sooty feathers little, the rump and the underwing's bar much
      float pbUp = N.y;
      float pbRise = max(vWPos.y - pbSwell(vWPos.xz), 0.0);                            // metres over where the water stands under it now
      vec3 pbRest = albedo * uPbK.x + mix(uSeaSky0, uSeaSky1, pbLit) * (uPbK.y * (0.06 + 0.94 * smoothstep(0.0, 1.0, pbUp)) * (0.35 + 0.25 * pbTake));
      float pbDown = clamp(0.35 - 0.65 * pbUp, 0.0, 1.0);                              // from beneath: bellies and underwings take it, backs none
      vec3 pbSea = mix(uSeaEmber * 1.35, uSeaFillLow * 1.5 + uSeaAqua * 0.3, exp(-pbRise / 1.5)) * (exp(-pbRise / uSeaRim.z) * pbDown);
      vec3 pbHigh = uSeaFillHigh * (0.55 + 0.45 * pbUp);
      // ---- the light of what it touches: its own footfalls while its feet are down, and whatever light the water holds under
      // it (the trace: the hull's road, another's marks). From beneath, dying up the bird; a little of it on what looks up
      // (thrown water, thin feathers). It is light the water gives, not the bird: over dark water the bird is dark
      vec2 pbUv = (vWPos.xz - uTraceRect.xy) / uTraceRect.zw + 0.5, pbE = min(pbUv, 1.0 - pbUv);
      float pbTr = min(pbE.x, pbE.y) > 0.0 ? texture2D(tTrace, pbUv).b : 0.0;
      float pbUnder = max(vPbFeet * uPbT.x, smoothstep(0.36, 0.6, pbTr) * uPbT.z) * uSeaL.y * pbLee * (1.0 - 0.6 * pbLit);
      float pbWrap = clamp(mix(1.0, uPbGateB.w, smoothstep(-0.2, 0.7, pbUp)), 0.0, 1.0);
      vec3 pbTouch = (uSeaAqua * 0.92 + uSeaCore * 0.2) * (pbUnder * exp(-pbRise / uPbT.y) * pbWrap * pbTake);
      // ---- in the gate, the floor that a crest floods with light (the set's uSeaL.z): a wide light, from beneath only, to some metres up
      vec2 pbG = vWPos.xz - uPbGate.xy; float pbGa = abs(dot(pbG, uPbGate.zw)), pbGc = abs(dot(pbG, vec2(-uPbGate.w, uPbGate.z)));
      float pbIn = (1.0 - smoothstep(uPbGateB.x, uPbGateB.x + 5.0, pbGa)) * (1.0 - smoothstep(uPbGateB.y - 1.0, uPbGateB.y + 2.0, pbGc));
      // (most on what is seen against the rock, a metre and more up: low over the lit floor a bird stays the dark shape against it)
      float pbFace = clamp(0.6 - 0.5 * pbUp, 0.08, 1.1);
      vec3 pbFloor = mix(uSeaEmber * 2.6, uSeaAqua * 1.1, exp(-pbRise / 3.0)) * (uSeaL.z * uSeaL.y * pbIn * exp(-pbRise / uPbGateB.z) * smoothstep(0.4, 2.0, pbRise) * pbFace * pbTake * uPbT.w);
      // (over the lit sea: low, where it is seen against the burning water, it is the dark shape with a breath of the sea's colour
      // beneath (uPbK.z); a metre and more up, where it is seen against rock and cloud, the sea lights it from beneath in full)
      float pbSeaK = mix(uPbK.z, 1.0, smoothstep(0.6, 2.6, pbRise));
      c = pbRest + albedo * lamps + (pbSea * pbSeaK + pbHigh * uPbK.w) * (pbLit * pbTake) + pbTouch + pbFloor;
    }`,
  };
  const ctxB = Object.create(ctx);
  ctxB.kit = Object.create(ctx.kit);
  ctxB.kit.gouache = (opts = {}) => ctx.kit.gouache({ ...opts, extend: [].concat(opts.extend || [], birdLight) });

  // ---------------------------------------------------------------------------------------------- stitches
  // Each foot that comes down leaves one mark of light on the water; a wingtip that cuts the water in a banked turn
  // leaves a scratch. A mark is a comma of the area's own paint (light.js, makeMarks: a round head, a tail drawn out to a
  // point and a little bent, the brush missing the paper along the stroke), lying on the water where the foot touched,
  // its tail down the wind as all the area's marks lean. It is core as it is struck, aqua within half a second, ember by
  // the middle of its life and a dark violet as it dies; as it ages it breaks into the specks of the sheet's own stipple
  // where it lies, each going out at its own level. One pool, one draw call, not in the mirror, nothing while the sea
  // does not answer, less in the lee round the kept lamp. The water's trace gets a dab beside it, on the area's scale
  // (an age), counted with the Comets' marks (shared.cast.seaLight) so that the realm's 512 a frame can be watched in
  // one place.
  const marksOn = params.get('bdmarks') !== '0', traceOn = marksOn && params.get('bdtrace') !== '0';
  const state = { stitches: 0, dabs: 0, scratches: 0, lifts: 0, aims: 0, fallbacks: 0, trims: 0, stops: 0, shies: 0, outs: 0, ins: 0, homes: 0, nearest: 1e9, events: [] };
  const traceDab = (x, z, radius, age) => {
    const sl = cast.seaLight, a = answer();
    if (!traceOn || a < 0.02) return;
    if (sl && sl.dab) sl.dab(x, z, radius, age); else if (water.trace && water.trace.inject) water.trace.inject(x, z, { channel: 'glow', radius, strength: Math.min(0.6, age) * a, soft: 0.8 });
    state.dabs++;
  };
  const traceLine = (x0, z0, x1, z1, radius, age) => {
    const sl = cast.seaLight, a = answer();
    if (!traceOn || a < 0.02) return;
    if (sl && sl.line) sl.line(x0, z0, x1, z1, radius, age); else if (water.trace && water.trace.line) water.trace.line(x0, z0, x1, z1, { channel: 'glow', radius, strength: Math.min(0.6, age) * a, soft: 0.75 });
    state.dabs++;
  };
  const stitches = (() => {
    const S0 = BIRDS.stitch, N = Math.max(96, kit.count(S0.pool));
    const geo = new THREE.InstancedBufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]), 3));      // (x: along the mark, y: across it)
    geo.setIndex([0, 1, 2, 0, 2, 3]);
    // each mark: where its head lies (x, z), when it was struck, its own number; the way its tail runs (x, z), its tail's
    // length, its head's radius; how bright, how long it lasts
    const aAt = new THREE.InstancedBufferAttribute(new Float32Array(N * 4), 4), aDab = new THREE.InstancedBufferAttribute(new Float32Array(N * 4), 4), aK = new THREE.InstancedBufferAttribute(new Float32Array(N * 2), 2);
    for (const a of [aAt, aDab, aK]) a.setUsage(THREE.DynamicDrawUsage);
    for (let i = 0; i < N; i++) { aAt.array[i * 4 + 2] = -1e5; aDab.array[i * 4] = 1; aDab.array[i * 4 + 2] = 0.1; aDab.array[i * 4 + 3] = 0.05; aK.array[i * 2 + 1] = 1; }
    geo.setAttribute('aAt', aAt); geo.setAttribute('aDab', aDab); geo.setAttribute('aK', aK);
    geo.instanceCount = N;
    const Sh = ctx.engine.shared, F = (P.seaLight && P.seaLight.fleck) || [0.37, 0.16, 0.047, 0.75];
    const uni = {
      ...waterUniforms(ctx.engine), uSeaOmega: U.uSeaOmega, uSeaFront: U.uSeaFront, uSeaL: U.uSeaL, uSeaLee: U.uSeaLee, tSeaStip: U.tSeaStip,
      uSeaAqua: U.uSeaAqua, uSeaEmber: U.uSeaEmber, uSeaCore: U.uSeaCore, uSeaDying: U.uSeaDying,
      uFleck: { value: new THREE.Vector4(F[0], F[1], F[2], F[3] ?? 0.75) }, uNow: { value: 0 }, uGain: { value: S0.gain }, uPixel: { value: 0.0012 },
      uFogColor: Sh.uFogColor, uFogDensity: Sh.uFogDensity, uVeil: Sh.uVeil, uVeilColor: Sh.uVeilColor,
    };
    const mat = new THREE.ShaderMaterial({
      // (paint, not added light: the brighter of a mark and what lies behind it stands, as the sheet's thrown water does it (light.js, spray).
      // Added, the footfalls of a bird that hangs in one place summed to a white lamp with a halo: sea_b3_b06_crop.png, first frame)
      uniforms: uni, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false,
      blending: THREE.CustomBlending, blendEquation: THREE.MaxEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
      blendEquationAlpha: THREE.AddEquation, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
      vertexShader: /* glsl */`${WATER_GLSL} ${WATER_SURFACE_GLSL} ${FOG_PARS}
        attribute vec4 aAt, aDab; attribute vec2 aK;
        uniform float uNow, uPixel;
        varying vec2 vQ, vXZ, vDab; varying vec4 vK; varying float vFogDist;
        void main() {
          float life = max(aK.y, 0.1), age = (uNow - aAt.z) / life;
          vQ = vec2(0.0); vXZ = vec2(0.0); vDab = vec2(0.1, 0.05); vK = vec4(0.0); vFogDist = 0.0;
          if (age <= 0.0 || age >= 1.0 || aK.x <= 0.0) { gl_Position = vec4(0.0, 0.0, 2.0, 1.0); return; }      // (not there: outside the view)
          vec2 dir = aDab.xy, side = vec2(-dir.y, dir.x);
          float len = aDab.z, hw = aDab.w;
          // the mark's own space, in metres: x from behind its head to its tail's tip, y across (room for the tail's bend)
          vec2 q = vec2(mix(-1.3 * hw, len + 0.012, position.x * 0.5 + 0.5), position.y * (1.25 * hw + 0.36 * len));
          vec2 xz = aAt.xy + dir * q.x + side * q.y;
          vec3 w = waterSurface((modelMatrix * vec4(xz.x, 0.0, xz.y, 1.0)).xyz);
          w.y += 0.005;
          // far off a mark lying on the water is thinner than the screen can draw: its far edge is raised and its near edge
          // lowered by under a pixel each, so that it stays a dash and does not crawl
          vec3 toEye = cameraPosition - w; float dist = length(toEye);
          vec2 look = -toEye.xz / max(length(toEye.xz), 1e-3);
          float deep = clamp(dot(xz - aAt.xy, look) / max(len, hw), -1.0, 1.0);
          w.y += deep * uPixel * dist * smoothstep(5.0, 14.0, dist);
          vQ = q; vXZ = w.xz; vDab = vec2(len, hw); vK = vec4(age, fract(aAt.w), life, aK.x);
          vec4 mv = viewMatrix * vec4(w, 1.0); vFogDist = fogDistance(mv);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */`${SEA_GLSL} ${FOG_PARS}
        uniform sampler2D tSeaStip; uniform vec3 uSeaAqua, uSeaEmber, uSeaCore, uSeaDying; uniform vec4 uFleck; uniform float uGain;
        varying vec2 vQ, vXZ, vDab; varying vec4 vK; varying float vFogDist;
        // (the sheet's own way with a mark: SEA_INK in light.js, which is not exported: the same two lines)
        vec3 seaMark(sampler2D t, vec2 uv) { vec4 m = texture2D(t, uv); float c = max(m.g, 0.004); return vec3(m.g, m.r / c, m.b / c); }
        float seaLit(vec3 m, float cut) { return m.x * smoothstep(cut, cut + 0.14, m.y); }
        void main() {
          float u = vK.x, seed = vK.y, secs = u * vK.z, len = vDab.x, hw = vDab.y;
          // the comma: a round head, and a tail drawn out to a point, a little bent
          float t = clamp(vQ.x / len, 0.0, 1.0), bend = (fract(seed * 13.7) - 0.5) * 0.7 * len;
          float d = vQ.x < 0.0 ? length(vQ) - hw : (vQ.x > len ? length(vQ - vec2(len, bend)) : abs(vQ.y - bend * t * t) - hw * pow(1.0 - t, 0.72));
          float px = max(length(vec2(dFdx(d), dFdy(d))), 1e-5);
          float cover = clamp(0.5 - d / px, 0.0, 1.0);                                   // a hard edge: paint, not a glow
          if (cover <= 0.003) discard;
          // dry brush: the paint misses the water along the stroke (too far to see the scratches: their mean)
          float fine = max(length(dFdx(vQ)), length(dFdy(vQ)));
          float scr = seaNoise(vec2(vQ.x * 11.0 + seed * 31.0, vQ.y * 170.0 + seed * 77.0));
          cover *= mix(1.0 - 0.8 * smoothstep(0.64, 0.72, scr), 0.8, smoothstep(0.003, 0.012, fine));
          // its age: struck white-hot, aqua within half a second, ember by the middle of its life, a dark violet as it dies
          // (white-hot only at the middle of its head and only as it is struck: core is rationed in this area, 2-light.md)
          float hot = (1.0 - smoothstep(0.25 * hw, 0.85 * hw, length(vQ))) * (1.0 - smoothstep(0.12, 0.42, secs));
          float a = mix(0.9 * pow(1.0 - u, 1.25), 1.0, hot);
          // as it goes out it breaks into the specks of the sheet's own stipple where it lies, each at its own level
          vec3 st = seaMark(tSeaStip, vXZ * uFleck.w);
          cover *= mix(1.0, clamp(0.1 + 2.6 * seaLit(st, 0.2 + 0.7 * u), 0.0, 1.0), smoothstep(0.3, 0.8, u));
          vec3 col = seaAge(a, uSeaCore, uSeaAqua, uSeaEmber, uSeaDying) * (cover * smoothstep(0.0, 0.1, secs) * (1.0 - smoothstep(0.9, 1.0, u)));
          float k = uGain * vK.w * uSeaL.y * seaLee(vXZ) * (1.0 - fogAmount(vFogDist)) * (1.0 - uVeil);
          gl_FragColor = vec4(min(col * k, vec3(1.3)), 1.0);
        }`,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = 'sea-petrel-stitches'; mesh.frustumCulled = false; mesh.renderOrder = 1;      // after the water (-1) and the sheet of its light (0)
    const size2 = new THREE.Vector2();
    mesh.onBeforeRender = (renderer, scene, camera) => { const rt = renderer.getRenderTarget(), hgt = rt ? rt.height : renderer.getDrawingBufferSize(size2).y; uni.uPixel.value = S0.pixel * 2 / (camera.projectionMatrix.elements[5] * Math.max(1, hgt)); mat.uniformsNeedUpdate = true; };
    ctx.add(mesh); ctx.only(mesh, 'direct');
    let head = 0, dirty = false;
    return {
      mesh, uniforms: uni, count: N,
      /** One mark: its head at (x, z), its tail `len` metres along (dx, dz), its head's radius, how bright (0..1), how many seconds it lasts. */
      put(x, z, dx, dz, len, hw, gain, life) {
        const i = head, A = aAt.array, D = aDab.array, K = aK.array; head = (head + 1) % N;
        A[i * 4] = x; A[i * 4 + 1] = z; A[i * 4 + 2] = ctx.time; A[i * 4 + 3] = rnd();
        D[i * 4] = dx; D[i * 4 + 1] = dz; D[i * 4 + 2] = len; D[i * 4 + 3] = hw;
        K[i * 2] = gain; K[i * 2 + 1] = life;
        dirty = true; state.stitches++;
      },
      frame(t) { uni.uNow.value = t; if (dirty) { aAt.needsUpdate = aDab.needsUpdate = aK.needsUpdate = true; dirty = false; } },
    };
  })();
  /** A foot has come down at (x, z). */
  const stitch = (x, z, b) => {
    const S0 = BIRDS.stitch, a = answer();
    if (!marksOn || a < 0.02 || Math.hypot(x - boat.x, z - boat.z) > S0.far) return;
    // it has lifted clear for a few steps (a hop): a gap in the line, and nothing into the trace
    if (b._pbHop > 0) { b._pbHop--; return; }
    if (b._pbHopAt != null && b.stepN >= b._pbHopAt) { const H = BIRDS.patter.hop; b._pbHop = Math.round(lerp(H.steps[0], H.steps[1], rnd())); b._pbHopAt = b.stepN + b._pbHop + Math.round(6 * lerp(H.every[0], H.every[1], rnd())); return; }
    b._pbWrote = ctx.time;                                    // (its feet are on the water and the water answers: what it writes lights it)
    if ((!lowQ || b.stepN % 2 === 0) && rnd() >= S0.miss) {
      // no two alike: its lean, how hard the foot came down (most light, a few heavy), how bright
      const ang = (rnd() - 0.5) * 2 * S0.lean, c = Math.cos(ang), s = Math.sin(ang), W = S0.weight, k = lerp(W[0], W[1], Math.pow(rnd(), W[2]));
      const len = lerp(S0.tail[0], S0.tail[1], clamp(b.spd - 0.5, 0, 1)) * k, dx = wind[0] * c - wind[1] * s, dz = wind[0] * s + wind[1] * c;
      const px = x + (rnd() - 0.5) * 0.07, pz = z + (rnd() - 0.5) * 0.07, life = S0.life * (0.7 + 0.6 * rnd()), bright = a * clamp(0.3 + 0.35 * k + 0.35 * rnd(), 0, 1);
      stitches.put(px, pz, dx, dz, len, S0.head * k, bright, life);
      // ... and now and then a speck of water thrown down the wind beside it
      if (rnd() < S0.speck.share && !lowQ) {
        const K = S0.speck, off = lerp(K.off[0], K.off[1], rnd()), sd = (rnd() - 0.5) * 0.9, q = lerp(K.size[0], K.size[1], rnd());
        stitches.put(px + dx * off - dz * off * sd, pz + dz * off + dx * off * sd, dx, dz, len * q * 0.8, S0.head * k * q, bright * (0.6 + 0.4 * rnd()), life * (0.5 + 0.4 * rnd()));
      }
    }
    if (b.stepN % S0.trace.every === 0) traceDab(x, z, S0.trace.radius, S0.trace.age);
  };
  /** A wingtip has cut the water at (x, z), the bird heading `yaw`: a scratch, its tail where the tip has been. */
  const scratch = (x, z, yaw) => {
    const T = BIRDS.tip, a = answer();
    if (!marksOn || a < 0.02 || Math.hypot(x - boat.x, z - boat.z) > BIRDS.stitch.far) return;
    const fx = Math.sin(yaw), fz = Math.cos(yaw);
    stitches.put(x, z, -fx, -fz, T.length * (0.7 + 0.6 * rnd()), T.half, a, T.life * (0.7 + 0.6 * rnd()));
    traceLine(x - fx * T.length, z - fz * T.length, x, z, T.trace.radius, T.trace.age); state.scratches++;
  };

  // ---------------------------------------------------------------------------------------------- the parties
  let bvx = 0, bvz = 0, lastBx = boat.x, lastBz = boat.z;      // the boat's own way, m/s (for where it will be when a shear gets there)
  const listeners = {};
  const fire = (name, ...args) => { const L = listeners[name]; if (L) for (const fn of L) { try { fn(...args); } catch (err) { console.error(`sea/cast_birds: a listener of '${name}' threw: ${(err && err.stack) || err}`); } } };
  if (params.get('bdtraffic') === 'fast') { BIRDS.traffic.every = [1.2, 2.4]; BIRDS.traffic.stay = [2, 4]; BIRDS.traffic.most = 5; }      // (for looking: in and out all the time)
  const api = cast.birds = { numbers: BIRDS, auto: true, traffic: params.get('bdtraffic') !== '0', onLift: null, parties: {}, list: [], state, stitches };
  /** A party lifts (the sound 'flutter'): where its first bird went up, and why: 'boat' | 'crevice' | 'weather'. */
  const lifting = (x, z, party, why) => { state.events.push([+ctx.time.toFixed(2), 'lift:' + why, party.name, +x.toFixed(1), +z.toFixed(1)]); if (api.onLift) api.onLift(x, z, party, why); fire('lift', x, z, party, why); };
  const scale = num('bdscale', 1);

  /** A number for every bird of a flock, for its paint: how much light its own footfalls give it now (0..1). Hung on the family's geometry as aPbLit. */
  const litOf = (flock) => { const a = new THREE.InstancedBufferAttribute(new Float32Array(Math.max(1, flock.count)), 1); a.setUsage(THREE.DynamicDrawUsage); flock.mesh.geometry.setAttribute('aPbLit', a); return a; };
  function makeParty(def, k) {
    const waters = def.waters.map(([s, d, r]) => { const p = kit.at(s, d, 0); return { x: p.x, z: p.z, r, s, d }; });
    const near = rock.filter((q) => waters.some((w) => Math.hypot(q.x - w.x, q.z - w.z) < w.r + q.r + 46));      // the rock this party can ever meet
    const party = { name: def.name, def, waters, rock: near, flock: null, awake: true, gone: false, lifted: 0, liftAt: -10, liftX: 0, liftZ: 0, liftNew: false, held: [], crevices: [], inside: [], queue: [], nextIn: 6 + 6 * rnd(), tower: null, leaving: null,
      centre: { x: 0, z: 0 }, within: def.within ?? within, boatClear: def.boatClear ?? boatClear, shy: def.shy ?? shy, minD: def.minD ?? 6, run: def.run ?? BIRDS.run };
    for (const w of waters) { party.centre.x += w.x / waters.length; party.centre.z += w.z / waters.length; }
    const flock = party.flock = makeFlock(ctxB, {
      species: 'petrel', count: def.count ?? BIRDS.count, seed: def.seed, scale, zones: waters.map((w) => ({ x: w.x, z: w.z, r: w.r })), wind,
      keepOut: 0, calmKeepOut: 0, flush: { within: party.within }, hidden: !!def.held,
      minPixels: BIRDS.size.minPixels, maxGrow: BIRDS.size.maxGrow, color: BIRDS.paint.tint, material: { brush: 0.25 },
      onTouch: (x, z, kind, i) => {
        if (!party.awake) return;
        const b = flock.birds[i];
        if (kind === 'foot') stitch(x, z, b);
        else if (kind === 'wingtip') scratch(x, z, b.yaw);
      },
      onLeave: (i, x, y, z) => {
        const b = flock.birds[i];
        if (!b.flushed) return;                              // (the family says "leave" at every shear: only a bird the boat has put up is a party lifting)
        if (ctx.time - party.liftAt > 1.6) { party.lifted = 0; party.liftAt = ctx.time; party.liftX = x; party.liftZ = z; party.liftNew = true; }
        party.lifted++; state.lifts++;
      },
    });
    flock.object.name = `petrels:${def.name}`;
    party.lit = litOf(flock);
    // every bird has a home water (the family deals them out over the zones), and starts on clear water with room upwind
    for (const b of flock.birds) {
      b._pbHome = b.zone % waters.length;
      if (hit(near, b.x, b.z, BIRDS.landPad) >= 0 || runAt(party, b.x, b.z) < 2) { const w = waters[b._pbHome]; for (let t = 0; t < 40; t++) { const a = rnd() * TAU, r = Math.sqrt(rnd()) * w.r, x = w.x + Math.cos(a) * r, z = w.z + Math.sin(a) * r; if (hit(near, x, z, BIRDS.landPad) < 0 && runAt(party, x, z) >= 2) { b.x = b.px = x; b.z = b.pz = z; break; } } }
    }
    // (a party with birds held back in crevices: the family hides the whole flock; the others are let out at once, feeding)
    if (def.held) { const n = flock.count, keep = Math.min(n, Math.round(def.held * n / (def.count ?? BIRDS.count))), out = []; for (let i = 0; i < n - keep; i++) out.push(i); for (let i = n - keep; i < n; i++) party.held.push(i); flock.release({ who: out, stagger: 0 }); for (const i of out) { flock.birds[i].show = 1; } }
    api.parties[def.name] = party; api.list.push(party);
    return party;
  }

  // ---- where a shear may go
  const ease = (u) => { const s = u * u * (3 - 2 * u); return s + (1 - (1 - u) * (1 - u) - s) * 0.55; };      // the family's own pace along a shear
  /** How high over still water the family flies a bird at u (0..1) of a shear from y0: down to the water, or (y1 given) up to a place. wr: the bird's own number for how high it skims. */
  const flightY = (u, y0, y1, wr) => { const low = 0.04 + (0.3 + 0.6 * wr) * Math.pow(Math.sin(Math.min(1, u * 1.12) * Math.PI), 0.8); return lerp(y0, y1 != null ? lerp(low, y1, smooth(0.5, 1, u)) : low, smooth(0, 0.25, u)); };
  /**
   * Is the bowed line a -> d (control c) clear of rock and of the boat? freeA / freeD: metres at its start and end that may lie
   * over rock (out of, or into, a crevice: there it is in the air above the rock's foot). H: { y0, y1, wr } its heights, for those
   * stretches: where it crosses a standing stump (`tall`) it must be over the stump's top by half a metre (the swell lifts and
   * drops a bird by more than a stump's breadth), or the line will not do.
   */
  function lineOk(party, ax, az, cx, cz, dx, dz, dur, bc, freeA = 0, freeD = 0, H = null) {
    const N = 30;
    for (let k = 1; k <= N; k++) {
      const u = k / N, e = ease(u), i = 1 - e, x = i * i * ax + 2 * i * e * cx + e * e * dx, z = i * i * az + 2 * i * e * cz + e * e * dz;
      const free = Math.hypot(x - ax, z - az) <= freeA || Math.hypot(x - dx, z - dz) <= freeD;
      if (!free) { if (hit(party.rock, x, z, BIRDS.flyPad) >= 0) return false; }
      else if (H && tall.length) { const y = flightY(u, H.y0, H.y1, H.wr); for (const q of tall) if (y < q.h + 0.9 && (x - q.x) * (x - q.x) + (z - q.z) * (z - q.z) < (q.r + 0.25) * (q.r + 0.25)) return false; }
      if (bc > 0) { const t = u * dur; if (Math.hypot(x - (boat.x + bvx * t), z - (boat.z + bvz * t)) < bc) return false; }
    }
    return true;
  }
  /**
   * A place of this party's own water for bird b to shear to, and the line to it: { x, z, cx, cz, dur } or null.
   *   flushed   the boat has put it up: it comes down 20 to 30 m from the boat
   *   bc        metres its line keeps from where the boat will be
   *   from      a crevice it is leaving: its line goes out along the crevice's own way, and may begin in rock
   *   prefer    (water) => bool: waters to choose from first
   *   slow      seconds more than a shear of that length takes (a bird that comes down from a height)
   */
  function choose(party, b, o = {}) {
    const flushed = !!o.flushed, bc = o.bc ?? 0, tries = o.tries ?? 30, from = o.from || null, slow = o.slow || 0;
    const liked = o.prefer ? party.waters.filter(o.prefer) : null;
    let best = null, bestScore = -1e9;
    for (let k = 0; k < tries; k++) {
      const w = liked && liked.length && rnd() < 0.85 ? liked[Math.floor(rnd() * liked.length)] : party.waters[!flushed && !from && rnd() < 0.55 ? b._pbHome : Math.floor(rnd() * party.waters.length)];
      const a = rnd() * TAU, r = Math.sqrt(rnd()) * w.r, x = w.x + Math.cos(a) * r, z = w.z + Math.sin(a) * r;
      const ex = x - b.x, ez = z - b.z, D = Math.hypot(ex, ez);
      if (D < party.minD || D > 46) continue;
      if (hit(party.rock, x, z, BIRDS.landPad) >= 0) continue;
      const dur = D / 8.2 + 1.0 + slow, far = Math.hypot(x - (boat.x + bvx * dur), z - (boat.z + bvz * dur));      // how far from the boat it comes down
      if (far < party.within + (bc > 0 ? 4 : 1.5)) continue;
      if (runAt(party, x, z) < party.run) continue;
      let cx, cz;
      if (from) {
        // out of a crevice: first along its own way out, then round to where it is going
        const L1 = clamp(0.42 * D, 3.5, 10);
        cx = b.x + from.out[0] * L1 + ex * 0.22; cz = b.z + from.out[1] * L1 + ez * 0.22;
        if (!lineOk(party, b.x, b.z, cx, cz, x, z, dur, bc, from.clear + BIRDS.crevice.pad, 0, { y0: from.y, y1: null, wr: b.wr })) continue;
      } else {
        // a bowed line, banking one way (the bird's own side first, then the other)
        const bow = (0.14 + 0.2 * rnd()) * D;
        let side = b.side; cx = b.x + ex * 0.5 - ez / D * bow * side; cz = b.z + ez * 0.5 + ex / D * bow * side;
        if (!lineOk(party, b.x, b.z, cx, cz, x, z, dur, bc)) { side = -side; cx = b.x + ex * 0.5 - ez / D * bow * side; cz = b.z + ez * 0.5 + ex / D * bow * side; if (!lineOk(party, b.x, b.z, cx, cz, x, z, dur, bc)) continue; }
      }
      let score = rnd() * 0.6;
      if (flushed) score -= 0.25 * Math.abs(far - clamp(far, BIRDS.settle[0], BIRDS.settle[1]));
      else score -= 0.2 * Math.abs(D - clamp(D, BIRDS.shear[0], BIRDS.shear[1]));
      if (score > bestScore) { bestScore = score; best = { x, z, cx, cz, dur }; }
    }
    return best;
  }
  // (a shear's line is laid from where the bird is now, at the height it is at now: the family comes down from `ay` over the first quarter of the way)
  const setLine = (b, g) => { b.ax = b.x; b.ay = b.y; b.az = b.z; b.dx = g.x; b.dz = g.z; b.cx = g.cx; b.cz = g.cz; b.dur = g.dur; b.t = Math.min(b.t, 0.02); b._pbX = b.dx; b._pbZ = b.dz; };
  /** A shear the family has just begun: lead it to clear water (the family's own choice knows no rock and no party). */
  function aim(party, b) {
    state.aims++;
    const slow = Math.max(0, b.y - waterY(b.x, b.z) - 1.2) * BIRDS.crevice.slow;      // (down from a tower: not a stoop)
    // (a party that the boat drives before it: once the boat has reached `ahead`, its birds come down on water ahead of the boat while there is any)
    const prefer = party.def.ahead != null && ctx.s >= party.def.ahead ? (w) => w.s > ctx.s + 3 : null;
    let g = choose(party, b, { flushed: b.flushed, bc: party.boatClear, slow, prefer }) || choose(party, b, { flushed: b.flushed, bc: Math.min(bcLow, party.boatClear), tries: 40, slow, prefer }) || choose(party, b, { flushed: b.flushed, bc: 0, tries: 40, slow });
    if (!g) {
      // nowhere: a short hop upwind or down, in the water it stands on (it is on clear water, or it would not have been pattering)
      state.fallbacks++;
      for (let t = 0; t < 12 && !g; t++) { const a = rnd() * TAU, D = 3 + rnd() * 4, x = b.x + Math.cos(a) * D, z = b.z + Math.sin(a) * D; if (hit(party.rock, x, z, BIRDS.landPad) < 0 && lineOk(party, b.x, b.z, (b.x + x) / 2, (b.z + z) / 2, x, z, 2, 0)) g = { x, z, cx: (b.x + x) / 2, cz: (b.z + z) / 2, dur: D / 8.2 + 1.0 + slow }; }
      if (!g) g = { x: b.x, z: b.z, cx: b.x, cz: b.z, dur: 1.2 + slow };
    }
    setLine(b, g);
  }
  /**
   * A patter the family has just begun: its own way (a little off the wind, whichever side has the longer water), no faster and
   * no longer than the water ahead of it allows; and how it will go: where its pace swells and slackens, where it sidles,
   * when it first lifts clear for a step or two.
   */
  function trim(party, b) {
    const Pt = BIRDS.patter, want = (0.25 + 0.75 * rnd()) * Pt.bear * (rnd() < 0.5 ? -1 : 1);
    let bear = want, run = runAt(party, b.x, b.z, 2.5, bear);
    if (run < 3) { const r2 = runAt(party, b.x, b.z, 2.5, -want); if (r2 > run) { run = r2; bear = -want; } }
    if (run < 2) { const r0 = runAt(party, b.x, b.z, 2.5, 0); if (r0 > run) { run = r0; bear = 0; } }
    run = Math.max(0.6, run - 0.4);
    const far = b.spd * b.dur / Math.cos(bear);      // (the family's pace is the pace up the wind: slantwise it goes that much further)
    if (far > run) { state.trims++; b.spd = Math.max(0.5, run * Math.cos(bear) / b.dur); if (b.spd * b.dur / Math.cos(bear) > run) b.dur = Math.max(0.8, run * Math.cos(bear) / b.spd); }
    b._pbPat = b.dur; b._pbSpd = b.spd; b._pbBear = bear;
    b._pbW = [2.1 + 1.5 * rnd(), 5 + 3 * rnd(), 1.1 + 1.2 * rnd()]; b._pbP = [rnd() * TAU, rnd() * TAU, rnd() * TAU];
    b._pbHop = 0; b._pbHopAt = Math.round(6 * lerp(Pt.hop.every[0], Pt.hop.every[1], rnd()) * (0.3 + 0.7 * rnd()));
  }
  /** One frame of a patter: its pace now (the family walks it up the wind at b.spd) and its way across the wind (walked here). */
  function pace(b, dt) {
    if (b._pbSpd == null || !b._pbW) return;
    const Pt = BIRDS.patter, t = b.t, W = b._pbW, Q = b._pbP;
    const n = 0.5 + 0.34 * Math.sin(t * W[0] + Q[0]) + 0.16 * Math.sin(t * W[1] + Q[1]);      // 0..1, about its middle
    b.spd = clamp(b._pbSpd * lerp(Pt.pace[0], Pt.pace[1], n), Pt.speed[0], Pt.speed[1]);
    const across = b.spd * Math.tan(b._pbBear) + Pt.slip * Math.sin(t * W[2] + Q[2]);      // m/s to the left of upwind
    b.x += -up[1] * across * dt; b.z += up[0] * across * dt;
  }

  const onlyP = (params.get('bdonly') || '').split(',').filter(Boolean);      // (&bdonly=left,wall: only these parties; &bdonly=study: none but the study's)
  const parties = BIRDS.parties.filter((def) => !onlyP.length || onlyP.includes(def.name)).map((def, k) => makeParty(def, k));

  // ---------------------------------------------------------------------------------------------- crevices
  // Where a petrel is lost to sight against the rock and comes out of it again: a place (x, y, z) in the air at the
  // rock's face, the way out from it over the water (a unit, x and z), and how many metres of that way lie over rock.
  const CR = BIRDS.crevice, tmpL = {};
  const sdOf = (x, z) => { const l = path.locate(x, z, null, tmpL); return [l.s, l.d]; };
  const crevice = (x, y, z, ox, oz, kind) => {
    let clear = -1; for (let m = 0; m <= CR.clear; m += 0.25) if (hit(rock, x + ox * m, z + oz * m, BIRDS.flyPad) < 0) { clear = m; break; }
    if (clear < 0) return null;
    const [s, d] = sdOf(x, z);
    return { x, y, z, out: [ox, oz], clear, s, d, kind, taken: false };
  };
  if (api.parties.gate) {
    // the gate: the kit's ledges on the two jambs inside the passage (broken tops of the front row, 4.5 to 6 m up, the
    // jamb's taller columns and the dark under the haunch behind them). A bird is lost to sight at a ledge's front rim
    const party = api.parties.gate, G = BIRDS.gate.ledge;
    for (const c of (shared.rocks && shared.rocks.crevices) || []) {
      const [s, d] = sdOf(c.x, c.z);
      if (s < G.s[0] || s > G.s[1] || Math.abs(d) < G.d[0] || Math.abs(d) > G.d[1] || c.y < G.y || !c.out) continue;
      const ol = Math.hypot(c.out[0], c.out[1]) || 1, ox = c.out[0] / ol, oz = c.out[1] / ol, q = crevice(c.x + ox * CR.rim, c.y + CR.up, c.z + oz * CR.rim, ox, oz, 'ledge');
      if (q) party.crevices.push(q);
    }
    // (The vault's model names six dark gaps in its haunches, crevice_0 to crevice_5 of shared.heroesB.vault, about 10 m up by the
    // two mouths. They lie among the hanging ends, and a way in that passes none of them could not be made sure of from the
    // boat: no bird is sent there. See the log, "Asked of the set".)
  }
  if (api.parties.wall) {
    // the wall: no crevice of it is named by the set (the kit's ledges end at the gate). Places are taken from the plan:
    // along the Prow's front, at the faces of its front rank of columns, over the plinth of stumps, 3.6 to 5.8 m up (the half of it
    // nearest the cleft); and on the two walls of the cleft's own mouth, in the dark between two columns, where a rider is looking
    const party = api.parties.wall, Wl = BIRDS.wall, f = (shared.rocks && shared.rocks.wall) || path.at(P.wall.s, {}), pr = P.wall.prow;
    const at2 = (d, v) => [f.x + f.rx * d + f.tx * v, f.z + f.rz * d + f.tz * v];
    for (let i = 0; i < Wl.prow.points; i++) {
      const d = lerp(pr.to - Wl.inset - Wl.prow.reach, pr.to - Wl.inset, (i + 0.15 + 0.7 * rnd()) / Wl.prow.points), [x, z] = at2(d, -pr.out - (P.wall.col || 1.4) * 0.5 - Wl.front);
      const q = crevice(x, lerp(Wl.y[0], Wl.y[1], rnd()), z, -f.tx, -f.tz, 'wall');
      if (q) party.crevices.push(q);
    }
    const Cl = Wl.cleft, tmpC = {};
    for (const side of [-1, 1]) for (let i = 0; i < Cl.points; i++) {
      const sAt = P.wall.s + lerp(Cl.in[0], Cl.in[1], (i + 0.15 + 0.7 * rnd()) / Cl.points), y = lerp(Cl.y[0], Cl.y[1], rnd()), a = path.at(Math.min(sAt, P.length), tmpC);
      const d = side * (Cl.axis - Cl.half - Cl.lean * y - Cl.front);
      const q = crevice(a.x + a.rx * d, y, a.z + a.rz * d, -a.rx * side, -a.rz * side, 'cleft');
      if (q) { q.like = Cl.like; party.crevices.push(q); }
    }
  }
  if (params.has('bdshow')) {
    // (&bdshow=1: every crevice as a small lamp, with a tick along its way out: for looking only)
    const g = new THREE.SphereGeometry(0.09, 8, 6), tick = new THREE.BoxGeometry(0.03, 0.03, 0.8);
    for (const p of parties) for (const c of p.crevices) {
      const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: c.kind === 'cleft' ? '#ff5aa0' : c.kind === 'wall' ? '#ffd24a' : '#7dff6a' })); m.position.set(c.x, c.y, c.z); ctx.add(m);
      const k = new THREE.Mesh(tick, new THREE.MeshBasicMaterial({ color: '#ffffff' })); k.position.set(c.x + c.out[0] * 0.5, c.y, c.z + c.out[1] * 0.5); k.rotation.y = Math.atan2(c.out[0], c.out[1]); ctx.add(k);
    }
  }
  const boatFar = (c, m = CR.boat) => Math.hypot(c.x - boat.x, c.z - boat.z) > m;
  /** Let a hidden bird out of a crevice: it appears there, drops away along the crevice's own way and shears to water of its party. */
  function letOut(party, i, c, prefer) {
    const flock = party.flock, b = flock.birds[i];
    if (b.state !== ST.GONE) return true;
    flock.release({ who: [i], from: [[c.x, c.y, c.z]], stagger: 0 });      // (the family: it is there, and has begun a shear of its own choosing)
    if (b.state !== ST.SHEAR) return true;
    const slow = Math.max(0, c.y - 1) * CR.slow;
    const g = choose(party, b, { bc: party.boatClear, from: c, prefer, slow }) || choose(party, b, { bc: Math.min(bcLow, party.boatClear), from: c, prefer, slow, tries: 40 }) || choose(party, b, { bc: Math.min(bcLow, party.boatClear), from: c, slow, tries: 60 });
    if (!g) { b.state = ST.GONE; b.show = 0; b.showTo = 0; return false; }      // (no clear way just now: it stays in)
    setLine(b, g); b._pbIn = null; c.taken = false; state.outs++;
    state.events.push([+ctx.time.toFixed(2), 'out', party.name, +c.x.toFixed(1), +c.z.toFixed(1)]);
    fire('emerge', c.x, c.y, c.z, party);
    return true;
  }
  /** A crevice bird b can fly into from where it is, and the line to it: { c, cx, cz, dur } or null. any: the boat or no. */
  function wayIn(party, b, any = false) {
    let best = null, bestScore = -1e9;
    for (const c of party.crevices) {
      if (c.taken || (!any && !boatFar(c))) continue;
      const ex = c.x - b.x, ez = c.z - b.z, D = Math.hypot(ex, ez), R = BIRDS.traffic.reach;
      if (D < (party.leaving ? Math.min(R[0], BIRDS.wall.near) : R[0]) || D > R[1] + (party.leaving ? 14 : 0)) continue;
      // in against the crevice's own way: the last of its line runs at the rock; before that it banks in from one side (its own side first)
      const L1 = clamp(0.42 * D, 3.5, 10), bow = (0.08 + 0.16 * rnd()) * D, dur = D / 7.5 + 1.2 + c.y * CR.slow * 0.5, bc = any ? 0 : Math.min(bcLow, party.boatClear);
      let side = b.side, cx = c.x + c.out[0] * L1 - ex * 0.2 - ez / D * bow * side, cz = c.z + c.out[1] * L1 - ez * 0.2 + ex / D * bow * side;
      const H = { y0: b.y, y1: c.y, wr: b.wr };
      if (!lineOk(party, b.x, b.z, cx, cz, c.x, c.z, dur, bc, 0, c.clear + CR.pad, H)) { side = -side; cx = c.x + c.out[0] * L1 - ex * 0.2 - ez / D * bow * side; cz = c.z + c.out[1] * L1 - ez * 0.2 + ex / D * bow * side; if (!lineOk(party, b.x, b.z, cx, cz, c.x, c.z, dur, bc, 0, c.clear + CR.pad, H)) continue; }
      const score = rnd() * 6 - Math.abs(D - 16) * 0.3 + (c.like || 0);
      if (score > bestScore) { bestScore = score; best = { c, cx, cz, dur }; }
    }
    return best;
  }
  /** Send bird b into a crevice (w: from wayIn). */
  function sendIn(party, b, w) {
    const c = w.c;
    party.flock.leave({ to: [[c.x, c.y, c.z]], who: [b.i], stagger: 0 });      // (the family: a shear that ends at the place, where the bird shrinks to nothing)
    if (b.state !== ST.SHEAR || !b.toPoint) return false;
    b.cx = w.cx; b.cz = w.cz; b.dur = w.dur; b._pbX = b.dx; b._pbZ = b.dz; b._pbIn = c; c.taken = true; state.ins++;
    return true;
  }

  // ---------------------------------------------------------------------------------------------- for staging: the moments
  /**
   * Moment 5: birds held in the gate's crevices come out as the bow enters: { count (6), over (seconds from first to last) }.
   * Each drops out of a ledge on one jamb and the other in turn, and makes for the water beyond the gate. Its ledge is chosen
   * when its moment comes, from those that lie far enough AHEAD of the boat then to be in a rider's view (the jambs stand
   * 12 m either side of the line: a ledge nearer than 12 m ahead is more than 45 degrees off the bow. As first built the six
   * left ledges 0 to 10 m ahead, abeam of the rider, and were never seen to leave: the third holder's log).
   */
  api.emerge = (o = {}) => {
    const party = api.parties.gate; if (!party || party.gone) return api;
    const G = BIRDS.gate, n = Math.min(o.count ?? G.count, party.held.length), over = o.over ?? G.over, t = ctx.time;
    if (!party.crevices.length) { api.settleGate(); return api; }      // (no crevice at all: they are simply there, feeding)
    for (let k = 0; k < n; k++) party.queue.push({ t: t + over * (k + 0.15 + 0.5 * rnd()) / Math.max(1, n), i: party.held.shift(), c: null, side: k % 2 ? -1 : 1, ahead: true, first: k === 0, tries: 0 });
    party.nextIn = Math.max(party.nextIn, t + over + 8);      // (nobody goes in while they come out)
    party.outSaid = false;
    return api;
  };
  /** A free ledge of the gate on one jamb (side: +1 the right, -1 the left; the other if that has none) that lies in a rider's forward view now:
   *  so many metres off, and no further off the bow than G.off radians (the way the boat points; the path's own way if it lies still). */
  function ledgeAhead(party, side) {
    const G = BIRDS.gate, a = path.at(ctx.s, tmpL), sp = Math.hypot(bvx, bvz), hx = sp > 0.5 ? bvx / sp : a.tx, hz = sp > 0.5 ? bvz / sp : a.tz;
    for (const sd of [side, -side]) {
      const open = [];
      for (const c of party.crevices) {
        if (c.taken || c.kind !== 'ledge' || c.d * sd <= 0) continue;
        const ex = c.x - boat.x, ez = c.z - boat.z, D = Math.hypot(ex, ez), al = ex * hx + ez * hz;
        if (D < G.ahead[0] || D > G.ahead[1] || al < D * Math.cos(G.off)) continue;
        open.push([D, c]);
      }
      open.sort((p, q) => p[0] - q[0]);
      if (open.length) return open[Math.min(open.length - 1, Math.floor(rnd() * 2.2))][1];      // (the nearest of them, or the next)
    }
    return null;
  }
  /** The gate's held birds as the moment leaves them: out, feeding (for a ride entered beyond the gate). */
  api.settleGate = () => { const party = api.parties.gate; if (party && party.held.length) party.flock.release({ who: party.held.splice(0), stagger: 0 }); return api; };
  /**
   * Moment 8: a party (the left one) lifts where it feeds and hangs into the wind, climbing: { party, height: [5, 9], over
   * (seconds from first to last), hold (seconds until they come down by themselves; left out: until resume()) }.
   */
  api.tower = (o = {}) => {
    const party = api.parties[o.party || 'left']; if (!party || party.gone) return api;
    const W = BIRDS.weather, t = ctx.time;
    party.tower = { height: o.height || W.height, t0: t, hold: o.hold ?? Infinity, ending: false, lifted: false };
    for (const b of party.flock.birds) { b._pbUp = t + rnd() * (o.over ?? W.over); b._pbDown = 0; }
    return api;
  };
  /** ... and back to what they were doing, one after another over `over` seconds. */
  api.resume = (o = {}) => {
    const party = api.parties[o.party || 'left']; if (!party || !party.tower || party.tower.ending) return api;
    const t = ctx.time;
    for (const b of party.flock.birds) { b._pbUp = null; b._pbDown = t + rnd() * (o.over ?? BIRDS.weather.down); }
    party.tower.ending = true; party.tower.endAt = t;
    return api;
  };
  /** Moment 11: a party (the wall's) goes into crevices for good, one after another: { party, over (seconds from first to last) }. */
  api.home = (o = {}) => {
    const party = api.parties[o.party || 'wall']; if (!party || party.gone || party.leaving) return api;
    const Wl = BIRDS.wall, t = ctx.time, birds = party.flock.birds.filter((b) => b.state !== ST.GONE);
    for (let i = birds.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)), q = birds[i]; birds[i] = birds[j]; birds[j] = q; }
    birds.forEach((b, k) => { b._pbGo = t + (o.over ?? Wl.over) * (k + 0.6 * rnd()) / Math.max(1, birds.length); b._pbWait = lerp(Wl.wait[0], Wl.wait[1], rnd()); });
    party.leaving = { t0: t };
    return api;
  };
  /** The party as that moment leaves it: gone (for a ride entered beyond it). */
  api.settleHome = (name = 'wall') => { const party = api.parties[name]; if (party) { party.gone = true; party.flock.object.visible = false; party.flock.state.timeScale = 0; } return api; };
  /** birds.on(name, fn): 'lift' (x, z, party, why: a party lifts: 'boat', 'crevice' or 'weather': the sound 'flutter'), 'emerge' (x, y, z, party: one bird
   *  leaves a crevice), 'home' (x, y, z, party: one bird has gone into one), 'gone' (party: the last of a party is in). */
  api.on = (name, fn) => { (listeners[name] || (listeners[name] = [])).push(fn); return api; };
  // The moments begin here unless staging has taken them (api.auto = false: then it calls emerge(), tower(), resume(), home()).
  // Entered part-way, each is in its after-state.
  stage.cue('petrels-gate', { s: BIRDS.gate.s, settle() { api.settleGate(); } }, () => { if (api.auto) api.emerge(); });
  stage.cue('petrels-weather', { s: BIRDS.weather.s, settle() {} }, () => { if (api.auto) api.tower({ hold: BIRDS.weather.hold }); });
  stage.cue('petrels-wall', { s: BIRDS.wall.s, settle() { api.settleHome(); } }, () => { if (api.auto) api.home(); });

  // ---------------------------------------------------------------------------------------------- for looking
  // &bdstudy=<n>: a few birds feeding close ahead of where the boat is put, that let it come to 2.5 m: to look at the
  // patter, the shear and the flutter enlarged, in this area's own light.
  if (params.has('bdstudy')) {
    const s0 = num('s', 40) + num('bdsa', 8), d0 = num('d', 0) + num('bdsd', 0);
    parties.push(makeParty({ name: 'study', seed: 83, count: Math.max(1, num('bdstudy', 5)), waters: [[s0, d0, num('bdsr', 3.2)]], within: num('bdsw', 2.5), boatClear: 3, shy: 0, minD: 2, run: 2 }, 9));
  }
  // &bdpose=...: one bird held in a pose of the family's states, beside the boat
  let posed = null;
  if (params.has('bdpose')) {
    const f = makeFlock(ctxB, { species: 'petrel', count: 1, exact: true, habit: 'manual', keepOut: 0, scale, minPixels: 0, color: BIRDS.paint.tint, material: { brush: 0.25 }, seed: 5 });
    const q = list('bdpa'); posed = { f, kind: params.get('bdpose'), ahead: q[0] >= -99 ? q[0] : 4, right: q[1] >= -99 ? q[1] : 0, upY: q[2] >= -99 ? q[2] : 0.6, turn: num('bdturn', 90) * Math.PI / 180, t: 0 };
  }
  const planName = params.get('bdplan'), logAt = num('bdlog', 0), frames = [];
  let towerAt = num('bdtower', -1);
  // &bdmark=<metres>: a bright point that many metres over every bird that is there (pink in the air, yellow on the water): to find them in a picture
  let marks = null;
  if (params.has('bdmark')) {
    const n = parties.reduce((a, p) => a + p.flock.count, 0), g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3)); g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    marks = new THREE.Points(g, new THREE.PointsMaterial({ size: 5, sizeAttenuation: false, vertexColors: true, depthTest: false, transparent: true, fog: false }));
    marks.frustumCulled = false; marks.renderOrder = 50; marks.userData.up = num('bdmark', 0.5) || 0.5; ctx.add(marks); ctx.only(marks, 'direct');
  }
  let logged = false, frameNo = 0;

  // ---------------------------------------------------------------------------------------------- the frame
  const tmpA = {};
  let failed = false, begun = false;
  function update(dt) {
    if (failed) return;
    try {
      const t = ctx.time, k = 1 - Math.exp(-dt / 0.6), fdt = Math.min(0.05, dt);      // (fdt: the family's own step)
      if (dt > 1e-4) { bvx += ((boat.x - lastBx) / dt - bvx) * k; bvz += ((boat.z - lastBz) / dt - bvz) * k; if (Math.hypot(bvx, bvz) > 8) { bvx = 0; bvz = 0; } }      // (the boat was put somewhere: that is not speed)
      lastBx = boat.x; lastBz = boat.z;
      stitches.frame(t);
      stitches.uniforms.uGain.value = BIRDS.stitch.gain;
      if (towerAt >= 0 && t >= towerAt) { towerAt = -1; api.auto = false; api.tower({ party: params.get('bdtowerwho') || 'left' }); }      // (&bdtower=<seconds>: a party goes up then and stays up, for looking)
      // ---- the first frame: a boat that is PUT among feeding birds (a picture, a rider set down part-way) finds none within their
      // lifting distance: they are already feeding further off (on a ride they would have lifted as it came)
      if (!begun) {
        begun = true;
        // (the family has had its first frame: those within reach have just been put up. Each is set down again, feeding, as the family begins a patter)
        for (const party of parties) {
          // (a party that the boat drives before it is ahead of a boat that is put down past where the driving begins)
          const driven = party.def.ahead != null && ctx.s >= party.def.ahead, fore = driven ? party.waters.filter((w) => w.s > ctx.s + 3) : [], pool = fore.length ? fore : party.waters;
          for (const b of party.flock.birds) {
            if (b.state !== ST.PATTER && b.state !== ST.SHEAR) continue;
            if (Math.hypot(b.x - boat.x, b.z - boat.z) > party.within + 2.5 && !(fore.length && sdOf(b.x, b.z)[0] < ctx.s + 3)) continue;
            for (let n = 0; n < 60; n++) {
              const w = pool[Math.floor(rnd() * pool.length)], a = rnd() * TAU, r = Math.sqrt(rnd()) * w.r, x = w.x + Math.cos(a) * r, z = w.z + Math.sin(a) * r;
              if (Math.hypot(x - boat.x, z - boat.z) < party.within + 4 || hit(party.rock, x, z, BIRDS.landPad) >= 0 || runAt(party, x, z) < 2) continue;
              b.x = b.px = x; b.z = b.pz = z; b.y = b.py = waterY(x, z) + 0.04; b.yaw = Math.atan2(up[0], up[1]);
              b.state = ST.PATTER; b.t = rnd() * 3; b.dur = 4 + rnd() * 5; b.spd = 0.5 + rnd(); b.step = 0; b.stepN = 0; b.fresh = true; b.flushed = false; b._pbPat = -1;
              break;
            }
          }
          party.liftNew = false; party.lifted = 0;
        }
        state.lifts = 0;
      }
      for (const party of parties) {
        const flock = party.flock;
        if (party.gone) { flock.object.visible = false; continue; }
        // ---- a party far from the boat sleeps: not drawn, not moved, writing nothing
        let near = 1e9; for (const w of party.waters) near = Math.min(near, Math.hypot(w.x - boat.x, w.z - boat.z) - w.r);
        if (party.awake ? near > BIRDS.far[1] : near < BIRDS.far[0]) party.awake = !party.awake;
        if (params.has('bdall')) party.awake = true;
        flock.object.visible = party.awake; flock.state.timeScale = party.awake ? 1 : 0;
        if (!party.awake) continue;
        party.lit.needsUpdate = true;
        const tw = party.tower, lv = party.leaving;
        let here = 0, aloft = 0, goingIn = 0;      // (aloft: how many hang in a tower. It was named `up`, which hid the wind's own `up` from everything below: the guard against rock ahead of a patter read nothing and never fired)
        for (const b of flock.birds) {
          if (b.state === ST.GONE) {
            // ---- it has gone into a crevice
            if (b._pbIn) { const c = b._pbIn; b._pbIn = null; state.homes++; fire('home', c.x, c.y, c.z, party); if (!lv) party.inside.push({ i: b.i, c, until: t + lerp(BIRDS.traffic.stay[0], BIRDS.traffic.stay[1], rnd()) }); }
            continue;
          }
          here++;
          if (b._pbIn) goingIn++;
          // ---- the light of its own footfalls: on while it writes (a mark within the last half second), off as it lifts
          { const on = b.state === ST.PATTER && t - (b._pbWrote ?? -9) < 0.45 ? 1 : 0, l0 = b._pbLit || 0; b._pbLit = l0 + (on - l0) * (1 - Math.exp(-fdt / (on ? 0.14 : 0.24))); party.lit.array[b.i] = b._pbLit; }
          if (b.state === ST.SHEAR) {
            if (b.dx !== b._pbX || b.dz !== b._pbZ) { if (b.toPoint) { b._pbX = b.dx; b._pbZ = b.dz; } else aim(party, b); }
            if (b.toPoint && b.t > 0.45 * b.dur) { b.resting = false; if (b.flapLeft < 1) b.flapLeft = 1.5; }      // (up to a ledge: it beats its way up, it does not glide uphill)
            // ---- too near the boat and closing (its line was laid for a boat that has since turned or paddled): off again, from where it is
            if (!b.toPoint && t >= (b._pbShy || 0)) {
              const de = Math.hypot(b.x - boat.x, b.z - boat.z);
              if (de < party.shy && Math.hypot(b.x + b.vx * 0.4 - boat.x - bvx * 0.4, b.z + b.vz * 0.4 - boat.z - bvz * 0.4) < de) {
                b._pbShy = t + 1.5;
                const g = choose(party, b, { flushed: true, bc: Math.min(bcLow, party.boatClear), tries: 24 });
                if (g) { setLine(b, g); state.shies++; }
              }
            }
          } else if (b.state === ST.PATTER) {
            if (b._pbPat !== b.dur) trim(party, b);
            pace(b, fdt);
            // rock ahead on its own way (the trim's own guard: the water moves, the bird sidles): come up and go elsewhere
            { const cb = Math.cos(b._pbBear || 0), sb = Math.sin(b._pbBear || 0), ux = up[0] * cb - up[1] * sb, uz = up[0] * sb + up[1] * cb;
              if (b.t < b.dur && (hit(party.rock, b.x + ux * 0.7, b.z + uz * 0.7, 0.4) >= 0 || hit(party.rock, b.x, b.z, 0.3) >= 0 || !onWater(party.waters, b.x, b.z, 3.5))) { b.t = b.dur + 1; state.stops++; } }
            // ---- the weather turns: up where it feeds, into the wind (a bird in mid-shear goes when it has come down)
            if (tw && !tw.ending && b._pbUp != null && t >= b._pbUp && b.t > 0.35) {
              b._pbUp = null; flock.tower({ who: [b.i], height: tw.height, stagger: 0 });
              if (!tw.lifted) { tw.lifted = true; lifting(b.x, b.z, party, 'weather'); }
            }
            // ---- the last party goes into the wall
            if (lv && !b._pbIn && t >= b._pbGo && b.t >= b._pbWait) { const w = wayIn(party, b, t - b._pbGo > 25); if (!w || !sendIn(party, b, w)) b._pbGo = t + 0.5; }      // (no clear way from here: it feeds on, and tries again)
          } else if (b.state === ST.TOWER) {
            aloft++;
            if (tw && tw.ending && t >= b._pbDown) flock.resume({ who: [b.i] });
          }
        }
        if (tw) {
          if (!tw.ending && (t - tw.t0 > tw.hold || (api.auto && sea.T >= 1.5 && t - tw.t0 > 4))) api.resume({ party: party.name });
          if (tw.ending && aloft === 0 && t - tw.endAt > BIRDS.weather.down + 0.5) party.tower = null;
        }
        if (lv && here === 0) { party.gone = true; flock.object.visible = false; state.events.push([+t.toFixed(2), 'gone', party.name, 0, 0]); fire('gone', party); continue; }
        // ---- crevices: those whose time has come are let out; and now and then one feeding bird goes in
        for (let q = party.queue.length - 1; q >= 0; q--) {
          const e = party.queue[q];
          if (t < e.t) continue;
          if (!e.c && e.side) { e.c = ledgeAhead(party, e.side); if (e.c) e.c.taken = true; }
          if (e.c && boatFar(e.c, 6) && letOut(party, e.i, e.c, e.ahead ? (w) => w.s > ctx.s + 12 : null)) { party.queue.splice(q, 1); if (e.first || !party.outSaid) { party.outSaid = true; lifting(e.c.x, e.c.z, party, 'crevice'); } continue; }
          // (no ledge in view, or no clear way from it just now: try again shortly; a bird that finds none at all, the boat having gone by, is simply out and feeding)
          if (e.c && e.side) { e.c.taken = false; e.c = null; }
          e.t = t + 0.35; e.tries = (e.tries || 0) + 1;
          if (e.side && e.tries > 14) { party.queue.splice(q, 1); party.flock.release({ who: [e.i], stagger: 0 }); }
        }
        for (let q = party.inside.length - 1; q >= 0; q--) { const e = party.inside[q]; if (t >= e.until) { if (boatFar(e.c) && letOut(party, e.i, e.c, null)) party.inside.splice(q, 1); else e.until = t + 1; } }
        if (party.def.traffic && api.traffic && !lv && party.crevices.length && t >= party.nextIn) {
          party.nextIn = t + lerp(BIRDS.traffic.every[0], BIRDS.traffic.every[1], rnd());
          if (party.inside.length + goingIn < (party.held.length ? BIRDS.traffic.most - 1 : BIRDS.traffic.most)) {
            const feeding = flock.birds.filter((b) => b.state === ST.PATTER && b.t > 1.2 && !b._pbIn && Math.hypot(b.x - boat.x, b.z - boat.z) > party.within + 3);
            for (let tries = 0; tries < 3 && feeding.length; tries++) { const b = feeding.splice(Math.floor(rnd() * feeding.length), 1)[0], w = wayIn(party, b); if (w && sendIn(party, b, w)) break; }
          }
        }
        if (flock.state.nearest < state.nearest) state.nearest = flock.state.nearest;
        // ---- a party lifting from the boat (for the sound: once for a lift, placed where the first bird went up)
        if (party.liftNew) { party.liftNew = false; lifting(party.liftX, party.liftZ, party, 'boat'); }
      }
      if (posed) {
        const a = ctx.path.at(ctx.s, tmpA), q = posed, hd = Math.atan2(a.tx, a.tz); q.t += dt;
        const x = boat.x + a.tx * q.ahead + a.rx * q.right, z = boat.z + a.tz * q.ahead + a.rz * q.right, wy = waterY(x, z);
        const pose = q.kind === 'patter' ? { position: [x, wy + 0.042 * scale, z], yaw: hd + q.turn, pitch: 0.35, roll: 0, phase: q.t * 12, depth: 0.24, vee: 0.5, legs: 1, tail: 0.6, glide: 0, fold: 0 }
          : q.kind === 'shear' ? { position: [x, wy + q.upY, z], yaw: hd + q.turn, pitch: 0.02, roll: num('bdroll', 0.8), phase: 0.26, depth: 1, vee: 0, legs: 0, tail: 0.7, glide: 1, fold: 0 }
            : q.kind === 'tower' ? { position: [x, wy + q.upY, z], yaw: hd + q.turn, pitch: 0.3, roll: 0.1, phase: q.t * 5.5, depth: 1, vee: 0, legs: 0, tail: 0.5, glide: 0, fold: 0 }
              : { position: [x, wy + q.upY, z], yaw: hd + q.turn, pitch: 0.2, roll: num('bdroll', 0.15), phase: q.t * 5.5, depth: 1, vee: 0, legs: 0, tail: 0.5, glide: 0, fold: 0 };
        q.f.pose(0, pose);
        if (!q.lit) q.lit = litOf(q.f);
        q.lit.array[0] = q.kind === 'patter' ? num('bdlit', 1) : 0; q.lit.needsUpdate = true;
      }
      if (marks) {
        const A = marks.geometry.attributes.position.array, C = marks.geometry.attributes.color.array; let k = 0;
        for (const party of parties) for (const b of party.flock.birds) {
          const on = party.awake && !party.gone && b.state !== ST.GONE && b.show > 0.5, wet = b.state === ST.PATTER;
          A[k * 3] = b.x; A[k * 3 + 1] = on ? b.y + marks.userData.up : -500; A[k * 3 + 2] = b.z; C[k * 3] = 1; C[k * 3 + 1] = wet ? 0.9 : 0.2; C[k * 3 + 2] = wet ? 0.1 : 0.8; k++;
        }
        marks.geometry.attributes.position.needsUpdate = marks.geometry.attributes.color.needsUpdate = true;
      }
      // ---- &bdplan=<name>.json&bdlog=<seconds>: the rock, the waters, the crevices and every bird's way, for the plan from above
      if (planName && !logged) {
        if (frameNo++ % 2 === 0) { const row = []; for (const party of parties) for (const b of party.flock.birds) row.push(+b.x.toFixed(2), +b.z.toFixed(2), b.state, +b.y.toFixed(2)); frames.push({ t: +t.toFixed(2), boat: [+boat.x.toFixed(2), +boat.z.toFixed(2)], b: row }); }
        if (t >= logAt) {
          logged = true;
          const line = []; for (let s = 0; s <= P.length; s += 2) { const a = ctx.path.at(s, {}); line.push([+a.x.toFixed(2), +a.z.toFixed(2), s]); }
          const party = []; parties.forEach((p, i) => { for (let j = 0; j < p.flock.count; j++) party.push(i); });
          const mine = []; for (const p of parties) for (const c of p.crevices) mine.push({ x: +c.x.toFixed(2), y: +c.y.toFixed(2), z: +c.z.toFixed(2), out: c.out, clear: +c.clear.toFixed(2), s: +c.s.toFixed(1), d: +c.d.toFixed(1), kind: c.kind, party: p.name });
          fetch('/__shot/' + planName, { method: 'POST', body: JSON.stringify({
            colliders: rock.map((q) => [+q.x.toFixed(2), +q.z.toFixed(2), +q.r.toFixed(2)]), line, waters: parties.map((p) => p.waters.map((w) => [+w.x.toFixed(2), +w.z.toFixed(2), w.r])),
            crevices: ((shared.rocks && shared.rocks.crevices) || []).map((c) => ({ x: c.x, y: c.y, z: c.z, out: c.out })), mine, stride: 4,
            n: party.length, party, frames, events: state.events.map((e) => [e[1], e[3], e[4], e[0], e[2]]), state: { ...state, events: state.events.length },
          }) });
        }
      }
    } catch (err) {
      // absent is better than wrong: a guard that has failed leaves birds that fly through rock
      failed = true; for (const p of parties) p.flock.object.visible = false; stitches.mesh.visible = false;
      console.error(`INVALID_CAST sea/cast_birds: the petrels' guard threw and they were taken out: ${(err && err.stack) || err}`);
    }
  }
  return { update };
}
