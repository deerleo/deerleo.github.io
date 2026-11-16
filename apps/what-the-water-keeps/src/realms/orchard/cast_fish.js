// The orchard in flood: the cast, group "Swimmers" (stage 3): THE CARP UNDER THE PETALS, and what the carp do to THE
// THINGS LEFT (docs/art/orchard.md, sections 5 and 7; the fish family, docs/life/fish.md). The log of this module is
// docs/build/orchard/3-cast-swimmers.md.
//
// The carp are what lifts the skin from beneath: the cheapest proof that the petals float. Twenty-four dark fish
// 0.7 m long, olive-bronze, every one of them dark (the ride's one pale fish is the town's old carp), in five schools
// on closed loops laid between the planting mounds (plan.js, CARP_ROUTES: read its heading for where each loop goes and
// why): five on the lane, four round the crate, six on the north side of the pond, five round the plank walk, four over
// the fallen stones. A rider sees them as a window that moves in the petals, and within about four metres of the eye
// as dark backs; they turn aside from the bow at three metres with one stroke and a boil, and take up their file again
// behind it (all of that is the family's: the hull's room, the fright, the boils). They never face the hull and never
// wait at the boat: the lane's five hang head to the current, a metre and a half to port of the keel line, and when
// they are let go they pass the bow on that side.
//
// THEIR ORDINARY LIFE runs by itself here: the loops, the sips, the turn from the bow, the windows; the lane's five
// hang up the lane until the boat passes the page's s 54 and are then let go (the page's moment "The carp"); the four
// round the crate are found in the crate's raft and the four over the fallen stones beside the boat in the gap; the
// pond's six and the walk's five, which the lane never comes near, are put before a boat that steers into their water
// while they are still too far off to be seen (GATES, below). THE STAGING TAKES IT OVER with
//     const carp = shared.cast.carp;  carp.staged = true;
//     stage.cue('carpring', { s: F.pathS(49.8) }, () => carp.roll('lane'));      // the ring ahead of the bow (RING_AT)
//     stage.cue('carp', { s: F.pathS(54), settle: () => carp.settle() }, () => carp.release(3));
//     stage.cue('hives', { s: F.pathS(152) }, () => carp.roll('walk'));          // the page's "carp turn under the planks"
//     carp.on('sip', (x, z) => ctx.audio.play('drop', { x, z, pitch: 0.6, gain: 0.4 }));
//
// THE SECOND PAIR OF EYES (a fourth person, 8 November) laid every carp's place by hand (COMPANY: loose company, no
// two in one pose, a file that fans apart in a fright), made the window over a back close behind it in seven or eight
// seconds (CLOSE: it was the hull's twenty-one), and gave the schools their rolls (ROLL, RING_AT): each is argued where
// it stands, below; the log's last part, "Second look", has the pictures.
//
// shared.cast.carp IS THE FAMILY'S HANDLE (schools[k]: centre, pace, hold; burst, threat, lock, rise, fishAt, setHull,
// uniforms: docs/life/fish.md), with these added:
//   .names                ['lane', 'crate', 'pond', 'walk', 'stones']: schools[k] in that order
//   .school(name)         the family's school of that name ({ centre (live), speed, pace, hold, L, ... })
//   .put(name, metres)    put a school so that its TAIL is that far round its loop (the family's put, by name or number)
//   .burst(name, at)      a fright in that school (the family's burst, by name, number or 'all')
//   .staged               false: the lane's five are let go by this module at s 54.  true: the staging lets them go
//   .hang()               the lane's five back up the lane, held (hold 0)
//   .release(seconds)     ... let go: they swim east along the lane's south bank toward the bow (3 s by default)
//   .settle()             a cue's settle: the world as a boat that came by the lane would find it now
//   .roll(name)           one carp of that school rolls at the surface now: a back, the long fin, a ring that travels (true if
//                         one did; name left out: the school nearest the boat; of the five while they hang: the first of them)
//   .on(kind, fn)         to hear them (this module plays no sound):
//                           'sip'    fn(x, z, name)        a carp's lips at the surface: the page's `drop`, pitch 0.6, gain 0.4
//                           'boil'   fn(x, z, name)        each small ring where a carp turned from the bow
//                           'burst'  fn(x, z, name, why)   once, where the fright began; why: 'hull' | 'threat' | 'cue'
//                           'roll'   fn(x, z, name)        a back come over, as its ring leaves it (the page gives it no sound:
//                                                          a `drop` lower and softer than a sip's would serve, pitch 0.45, gain 0.3)
//   .marks                { radius, strength, soft, within, near }: the window over a back (live: change it to try another)
//   .closing              { rate, from, to, step, pad, hull }: how the window closes behind a back (live; rate 0: the sheet's own pace)
//   .company              true: every carp's place in its school is this module's (COMPANY)
// shared.cast.left: the things left, as far as the cast reaches them (they are heroes_b.js's: shared.made)
//   .floats, .hangs       shared.made's own lists (the crate, the loose plank, the basket afloat; the three hung baskets)
//   .wake(x, z, strength, reach)   rock what is within reach of a place, each thing as late as a ring takes to reach it
//   .on('rock', fn)       fn(x, z, name, strength): a thing afloat has just been set rocking by a wake (the moment
//                         heroes_b.js rings the water round it). NOT FOR A `knock`: since 23:46 on 7 November heroes_b.js
//                         plays the page's `knock` itself at that moment, for the crate, the loose plank, the basket
//                         afloat, the fallen ladder's head and the hung baskets (shared.made.knocks === true: "do not
//                         play it again from a cue"). `rock` is for whatever else the staging wants to hang on it.
//
// Developer switches:
//   &carpshow=1                  the loops drawn a hand above the water, a red bead over every carp where the script says it is
//   &carpput=crate:0.3,lane:0.1  a school's tail that share of the way round its loop when the area starts
//   &carppace=walk:0             a school held (0) or hurried (2)
//   &carpfree=1                  the lane's five never hang: they are on their loop from the start
//   &carpmeet=0                  the four round the crate and the four over the stones are left wherever their loops have them (not met),
//                                and the pond's six and the walk's five are not put before a boat that comes into their water (GATES)
//   &carpmark=0.8 &carpmarkr=0.26 &carpmarks=0.3 &carpwithin=0.4   the window over a back: strength, radius, the soft share of the radius, the deepest back that opens one
//   &carplift=0                  the window written straight above each carp (not where the rider sees its back: 0.32 m at most toward the eye)
//   &carplamps=0.2 &carplampsb=0.14 &carpgold=3a3012 &carpgoldb=2c250d   a lamp's light on them, and the gold of their scales, afterglow and blue hour
//   &carpcompany=0               the family's own places and numbers for every carp (not COMPANY's)
//   &carpclose=0 | 0.4           the window does not close behind a back but at the sheet's own pace (0), or at another rate a second
//   &carprolls=0                 no carp rolls by itself, and no ring ahead of the bow;  &carproll=<seconds>[:name]  a roll at that time
//                                (the nearest carp to the boat, or one of the named school)
//   &carpsip=<seconds>           the nearest carp to the boat sips at that time (to photograph a sip)
//   &carpburst=<seconds>[:name]  a fright at that time in the school nearest the boat, from the boat's place (or in the named school, from its own middle)
//   &carptrack=<name>            with &carplog: a thing afloat ('crate', 'loose plank', 'basket afloat') followed four times a second:
//                                how rocked it is, its height, its tilt (to judge its weight: how late it answers, how long it takes to settle);
//                                or a hung basket (hang0: on the ladder at (48.5, -10); hang1: at (75.5, +10); hang2: on the pole ladder):
//                                how rocked it is, how far off its rung, how often it has tapped back, metres from the boat
//   &carpeye=x,y,z               the eye moved off the rider's seat: metres to starboard, up, aft (study only: to look down on a loop)
//   &carplog=<name>.json         writes what was heard (sips, boils, frights, rocks), where the schools are and where every carp is
//                                (page s, d, the height of its middle, metres from the boat), at &t seconds (or at &carplogat=<seconds>: the end of a strip)
import * as THREE from 'three';
import { makeSchool } from '../../engine/life/fish.js';
import { CARP_ROUTES } from './plan.js';

const Q = new URLSearchParams(location.search);
const num = (k, d) => (Q.has(k) && isFinite(+Q.get(k)) ? +Q.get(k) : d);
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const NAMES = ['lane', 'crate', 'pond', 'walk', 'stones'];

// THE PAGE'S MOMENT AT s 54, "The carp". The lane's five hang with their tail this far round their loop and are let go
// when the boat passes LET_GO.
// (the third holder) WHERE THEY HANG DECIDES WHERE THEY ARE MET, and nothing else does: the hull frightens them when the
// bow is three metres from the first of them, which is 5.4 m ahead of the rider's eye, wherever that happens. They hung
// with their tail 0.2 m short of the loop's first point (the file from s 68 to s 63.2), and a boat on the current met
// them from s 61 to s 66, where the lane's south bank is a few loose rafts tonight: five dark backs in open water
// (.shots/orchard_sy_01_meet_crop.png). The page has them come "under the petals, lifting the skin", and the bank of
// petals along this leg is whole only from s 54 to s 60.4 (the petals' standing map, read under the loop: the log).
// So they hang 3.4 m further down the lane, the file from s 65 to s 60 with its head just inside the thick of that bank:
// let go at s 54 they are met from s 57 to s 62, the first of them breaking out of the bank beside the port bow
// (.shots/orchard_sy_02_meet_bank_crop.png, _f05.png; the approach in quarter seconds: orchard_sy_04_approach_crop.png).
// The price: at s 54 the bow is 3.8 m from the first of them (it was 7.2 m), so for a boat on the current the hull turns
// them a quarter of a second after they are let go, before they have begun to swim (they used to swim for two seconds:
// a third of a metre). A rider cannot tell: all that water comes at the bow at 2 m/s, and a carp's window cannot be made
// out beyond five metres. A boat that creeps past s 54 (0.35 m/s) turns them at three metres all the same, and then has
// them filing down the bank past its port bow for seven seconds, backs in the petals: .shots/orchard_sy_32_slow_crop.png.
// (THE STAGING: a cue for them belongs at the page's s 54 or a little before; one placed later finds the hull already
// among them.)
const LET_GO = 54, HANG = 3.2;
// THE FOUR ROUND THE CRATE ARE FOUND IN ITS RAFT. Their loop is 22.7 m and they are 5 m of it: left to the realm's clock
// a rider would find them wherever it had them, as often as not on the far side, unseen. So while they are still far
// off (the boat passing s 30: a carp cannot be seen beyond 5 m, nor its window beyond about 12), the school is put
// where it will have its middle in the crate's lee, in the raft, 3 m to starboard, as the boat draws level (the boat at
// s 56: the tail 4.75 m round the loop). It is not held and does not wait: it is only met.
// THE FOUR OVER THE FALLEN STONES ARE FOUND BESIDE THE BOAT IN THE GAP (the second holder). Their oval is 24.7 m and a
// boat on the current is through the gap in five seconds: on the clock alone the ride that was photographed met only
// the last of them, for a moment (.shots/orchard_sx_14_stones.png). They are put, as the boat passes s 180 (36 m short of the
// wall, at blue hour), so that the file is filing west along the oval's north side, three metres to starboard of the
// keel and outside the room the hull asks for, as the boat comes level with the piers: dark backs going the boat's own
// way over the pale stones, and overtaken. (Beyond the piers their oval turns in across the lane: if the bow catches
// the leaders there they turn aside with a boil, as carp do.)
// (`at`: the page's s of the boat when they are met; `tail`: metres round the loop of the school's tail then; `from`,
// `to`: the school is put when the boat passes `from`, unless it is set down beyond `to`. The time the boat takes from
// here to there is the current's own: plan.currentAt.)
const MEETS = [{ school: 'crate', at: 56, tail: 4.75, from: 30, to: 46 }, { school: 'stones', at: 216, tail: 4.4, from: 180, to: 196 }];
// THE POND'S SIX AND THE WALK'S FIVE ARE MET BY A RIDER WHO LEAVES THE LANE (the third holder). The lane passes 31 m from
// the pond's six and 11 to 17 m from the walk's five: a boat left to the current never sees either, and nothing of a
// carp shows beyond about five metres on open water (.shots/orchard_sy_12_pond_crop.png: a boat lying 9 m from all six,
// and a mirror). They are there for the rider who steers round the north of the islet, or over to the hives and the
// plank walk; and on the clock alone such a rider crosses a loop of 40 m (or 32) with five metres of carp somewhere on
// it: one visit in seven finds them. So each has a GATE: the water by which a boat comes into theirs from up the route
// (the page's s and d). On the frame a boat is first found in a gate, if no carp of that school is within FAR metres
// of it (nothing of them can be seen from further), the school is put where its loop comes nearest the water AHEAD
// metres on along the boat's own line: on whichever leg that is, going whichever way that leg goes, and nowhere within
// FAR of the boat. It is not held and does not wait: by the time the boat is there the file has swum on a metre or two,
// and is met; a boat that turns away never knows. (A gate is armed again once the boat has left it and is 30 m from
// the school. &carpmeet=0: none of this.)
const GATES = [{ school: 'pond', s: [93, 104], d: [6, 26] }, { school: 'walk', s: [144, 157], d: [4.5, 13.5] }], FAR = 9, AHEAD = 12;
// THE COMPANY EACH SCHOOL KEEPS, LAID BY HAND (the fourth holder: the second pair of eyes). The family gives a file its
// places by chance: one after another 0.5 to 2 m apart, each anywhere across the file, and each with four numbers of
// its own drawn from the seed. Chance had put the lane's two leaders abreast and given them the same swing in a fright:
// at the page's one staged moment two carp lay side by side at the port bow in one pose, one fish drawn twice
// (.shots/orchard_sz_02_burst_f08.png; the third holder's orchard_sy_27_gold_a_crop.png), and a follower ran up to
// within a hand of the tail before it when that one slowed to sip (orchard_sy_29_sipring_crop.png: a train). Carp keep
// a length and a half between them and travel in loose company: a leader, a staggered pair, a straggler; no two the
// same distance apart, none in another's wake. So every carp's place is given here, and its four numbers with it:
//   [metres ahead of the school's tail, metres to the LEFT of the way they swim, metres ABOVE the loop's own depth (every
//    back then lies 6 to 22 cm under the surface at rest: the page's 5 to 25 with the family's slow wobble),
//    h0, h1, h2, h3]
// The rule kept in every row: no two nearer than 0.9 m as they are placed (each surges a quarter of a metre either way
// along its file, so 0.6 m at the least), and two that follow within 1.4 m of each other lie at least 0.45 m apart
// across. Nothing is wider than the family's own file (0.67 m either side: the loops were measured with that) or longer
// (a school's first and last carp are where the family's would be, so the meetings above stand as they were).
// The four numbers are the family's (0..1 each; fish.js, fishPos): h0 its tail's phase, and which way it swings round
// after a fright (above or below 0.5: neighbours are given opposite sides, so a file FANS apart); h1 how far it darts
// (0.55 to 1.45 of the species' 1.3 m) and how slowly it surges; h2 how soon and how far it swings; h3 how long it
// takes to come home, and which of five tail beats it keeps. No two of a school share any of them.
// (&carpcompany=0: the family's own places and numbers, as it was.)
const COMPANY = {
  lane: [[0.30, 0.38, 0.01, 0.42, 0.60, 0.45, 0.70], [1.75, -0.08, 0.06, 0.83, 0.42, 0.62, 0.28], [3.25, 0.46, -0.01, 0.27, 0.90, 0.16, 0.86], [3.90, -0.44, 0.06, 0.71, 0.22, 0.80, 0.52], [5.30, 0.10, 0.03, 0.14, 0.74, 0.33, 0.08]],
  crate: [[0.35, -0.30, 0.06, 0.62, 0.35, 0.70, 0.40], [1.55, 0.42, -0.01, 0.18, 0.80, 0.25, 0.92], [3.10, -0.12, 0.05, 0.90, 0.55, 0.50, 0.15], [4.55, 0.30, 0, 0.36, 0.15, 0.88, 0.63]],
  pond: [[0.30, 0.25, 0.06, 0.55, 0.50, 0.35, 0.22], [1.20, -0.45, -0.01, 0.08, 0.85, 0.72, 0.77], [2.65, 0.05, 0.06, 0.76, 0.28, 0.12, 0.48], [4.60, -0.25, 0.01, 0.31, 0.66, 0.90, 0.05], [5.50, 0.48, 0.03, 0.95, 0.12, 0.55, 0.60], [7.00, -0.05, 0.06, 0.47, 0.93, 0.28, 0.35]],
  walk: [[0.40, -0.20, 0, 0.24, 0.45, 0.60, 0.82], [1.80, 0.35, 0.06, 0.68, 0.88, 0.20, 0.30], [3.15, -0.40, 0.03, 0.05, 0.30, 0.78, 0.58], [4.50, 0.15, -0.01, 0.86, 0.62, 0.42, 0.12], [5.80, -0.10, 0.05, 0.44, 0.10, 0.95, 0.72]],
  stones: [[0.30, 0.20, 0.05, 0.78, 0.70, 0.30, 0.50], [1.60, -0.35, -0.01, 0.33, 0.20, 0.85, 0.18], [2.50, 0.45, 0.06, 0.59, 0.95, 0.48, 0.90], [4.30, -0.05, 0.02, 0.11, 0.48, 0.66, 0.36]],
};
// THE WINDOW CLOSES BEHIND THE BACK (the fourth holder). The page: "a moving window 0.35 m wide that closes in 8 s".
// On this water a window that is clean over the back (0.8: MARK, below) is half closed 13 s behind the last back and
// shut after 21 (the third holder's measure): the sheet heals at the hull's pace, and three holders asked set.js for
// another. What that makes of a carp is a LANE: five in file left one dark lead, as a hull does, and the thing a rider
// is meant to see, the petals COMING BACK behind a back, was a third of a minute away. It can be had from here: the
// water's own trace.stamp (docs/water.md) brings a patch of the trace toward a value. Four times in every 1.6 s each
// carp's own trail, the stretch its window lay over between `from` and `to` seconds ago, is brought a little toward
// closed (`rate` a second, on top of the sheet's own healing): the petals over it are half back about 3.5 s behind the
// back and all back in 7 to 8 s, one by one, raggedly, as this sheet lets them go; in a file each back has open water of
// its own and the petals return between one carp and the next. NEVER IN THE HULL'S OWN LANE: the patch is a rectangle
// (the trail's bounds, `pad` wider), and it would close whatever else stood open inside it; so no patch is laid that
// comes within `hull` metres of where the hull has been in the last 27 s (there a carp's trail runs into the hull's
// lane and closes with it, as before). One small draw a carp a step, for the carp within the marks' own 45 m: at most
// 60 a second, mostly 15 to 25. (&carpclose=0: none, the sheet's own 21 s; &carpclose=0.4: another rate.
// IF set.js EVER GIVES A CARP'S MARK A QUICKER HEALING OF ITS OWN, set CLOSE.rate to 0: the two would add up.)
const CLOSE = { rate: 0.2, from: 1.6, to: 8, step: 0.4, pad: 0.3, hull: 0.72 };
// A CARP ROLLS (the fourth holder). Nothing of a carp shows beyond about five metres, and a sip's ring (0.2) cannot be
// found beyond a few: the pond's six and the walk's five gave a boat on the lane no sign at all (the page's moment at
// s 152 has "carp turn under the planks", 11 to 17 m off at blue hour), and a rider lying still beside the plank walk
// saw only water. Carp roll at dusk: a back and the long fin come over at the surface and go down, and a ring travels
// from it (the family's `rise`: 1.6 s, a ring of (0.5, 0.35)). So in each school that is near enough to be seen across
// the water and too far for its backs to be made out (its nearest carp between `near[0]` and `near[1]` metres from the
// boat) one carp rolls every `every` seconds or so, a different one each time, never two schools together, never the
// lane's five while they hang. It is their own life, at their own times (from the realm's clock and a count: the same in
// every run); the staging may ask for one with carp.roll(name) (s 152: carp.roll('walk')). (&carprolls=0: none.)
const ROLL = { every: [15, 28], near: [5.5, 30], first: [4, 16] };
// THE RING AHEAD OF THE BOW (the fourth holder). The page's moment has the five "come up the lane toward the bow under
// the petals"; what a rider on the current got of it was the last two seconds, at the bow: a carp's window cannot be
// made out beyond five metres (.shots/orchard_sz_10_hang_crop.png: the five hanging 6 to 11 m ahead, and nothing to
// see), so nothing told the eye where to look before they were there. As the boat passes RING_AT the first of the five
// rolls where it hangs, nine metres ahead on the port bow: a ring opens in the bank's petals and widens toward the
// boat, the bow runs into it, and a second and a half later the five are turning aside in it
// (.shots/orchard_sz_23_prelude_crop.png). (The staging, with carp.staged: a cue at F.pathS(49.8) for carp.roll('lane'),
// which is the first of them while they hang.)
const RING_AT = 49.8;

export async function build(ctx, plan, shared) {
  shared.cast = shared.cast || {};
  const here = shared.here, R = CARP_ROUTES, boat = ctx.boat, made = shared.made;
  const realm = (way) => way.map(([s, d, y, w]) => { const p = plan.xz(s, d); return w === undefined ? [p[0], y, p[1]] : [p[0], y, p[1], w]; });
  // (WHERE THE BOAT IS cannot be asked here: an area is built while the area before it is still on the screen, and the
  // boat is then somewhere in THAT area's coordinates (in a picture: at the origin). It is asked on the first frame this
  // area is the one being ridden: `arrive` below.)

  // (developer) the eye moved off the rider's seat
  if (Q.has('carpeye')) { const q = Q.get('carpeye').split(',').map(Number), cam = ctx.engine.camera; if (q.length === 3 && q.every(Number.isFinite)) { cam.position.set(q[0], q[1], q[2]); ctx.onDispose(() => cam.position.set(0, 0, 0)); } }
  const put0 = {}, paceOf = {};
  for (const kv of (Q.get('carpput') || '').split(',')) { const [k, v] = kv.split(':'); if (k in R && isFinite(+v)) put0[k] = +v; }
  for (const kv of (Q.get('carppace') || '').split(',')) { const [k, v] = kv.split(':'); if (k in R && isFinite(+v)) paceOf[k] = +v; }

  // ---------------------------------------------------------------------------------------------- the carp
  const heard = { sip: [], boil: [], burst: [], roll: [], rock: [] }, log = [];
  const tell = (kind, ...a) => { if (log.length < 400) log.push([+ctx.time.toFixed(2), kind, ...a.map((v) => (typeof v === 'number' ? +v.toFixed(2) : v))]); for (const fn of heard[kind]) fn(...a); };
  // THE HOUR ON THEM. The family's fish take no `extend`, so they cannot wear shared.dusk: they are brought into the dusk
  // with what the family gives. Under water the light comes down from above (the realm's sky light and what its key sends
  // straight down, which follow the dusk by themselves); a lamp's light is the one warm thing, and at the family's own
  // share of it (0.55) a carp inside the prow lantern's reach was an orange-brown fish, brighter than the petals over
  // it. So: a fifth of a lamp's light in the afterglow, less at blue hour (the lantern burns higher then), and a duller
  // gold on the scales than the family's page gives: dark backs, with a dull glint beside the hull.
  // (the fourth holder: the gold a shade duller still, 0.18 and #30280f for 0.2 and #3a3012. The gold lies between the
  // scales' dark edges, and two metres from the lantern it stood out as a pale speckle on a brown flank: a speckled
  // fish is a trout, and the page has these "never patterned". .shots/orchard_sz_13_tone_a_crop.png as it was,
  // _b_crop.png with none at all; this is between the two: a dark fish with a warmth in its flank.)
  const LOOK = { lampsA: num('carplamps', 0.18), lampsB: num('carplampsb', 0.14), goldA: new THREE.Color('#' + (Q.get('carpgold') || '30280f')), goldB: new THREE.Color('#' + (Q.get('carpgoldb') || '2c250d')) };
  const carp = makeSchool(ctx, {
    species: 'carp', gold: LOOK.goldA, floor: -0.86,          // (the bed is a metre down: a carp the hull pushes under stops on the meadow)
    exact: true,                                               // (24 fish are not a multitude: at low quality a file of five must still be five)
    under: { sky: 1.6, key: 0.6, belly: 0.4, lamps: LOOK.lampsA },
    rises: { kind: 'sip', every: [20, 40], near: 30 },
    schools: NAMES.map((k) => ({ count: R[k].n, route: realm(R[k].way), speed: R[k].speed, start: put0[k] ?? R[k].start })),
    onTouch: (x, z, kind, k, why) => {
      if (kind === 'sip') { sipped(x, z); tell('sip', x, z, NAMES[k]); }
      else if (kind === 'boil') { wake(x, z, 0.62, 7); tell('boil', x, z, NAMES[k]); }
      else if (kind === 'burst') { wake(x, z, 0.5, 6); tell('burst', x, z, NAMES[k], why); }
      // (a roll: the ring leaves the place where the back came over. It lifts what floats within four metres a little and
      // NEVER ENOUGH TO KNOCK: heroes_b.js knocks a thing when it is rocked past 0.22 and not again until it has
      // settled, and a roll beside the crate eight seconds before the page's moment left it unsettled when the boils
      // came: the crate kept silent at s 54 (.shots/orchard_sz_30a.json). 0.18 at the most.)
      else if (kind === 'rise') { wake(x, z, 0.18, 4); tell('roll', x, z, NAMES[k]); }
    },
  });
  const n = carp.count, sizes = carp.fish.St, lane = carp.schools[0];
  // the company each school keeps (COMPANY, above): every carp's place in its file and its four numbers, by hand.
  // (They are the family's own arrays: fish.St [along, across, deep, length] and fish.Rnd, four numbers a carp, which
  // the shader and the script both read. Nothing else of the family holds a copy. If the family's arrays are ever laid
  // out otherwise, nothing is changed and the family's own places stand.)
  const company = (() => {
    const F = carp.fish, att = F && F.geometry && F.geometry.attributes;
    if (Q.get('carpcompany') === '0' || !F || !F.St || !F.Rnd || F.St.length !== n * 4 || F.Rnd.length !== n * 4 || !att || !att.aSt || !att.aRnd) return false;
    if (NAMES.some((k) => !COMPANY[k] || COMPANY[k].length !== R[k].n)) return false;
    let first = 0;
    for (const k of NAMES) {
      COMPANY[k].forEach((row, j) => { const o = (first + j) * 4; F.St[o] = row[0]; F.St[o + 1] = row[1]; F.St[o + 2] = row[2]; for (let q = 0; q < 4; q++) F.Rnd[o + q] = row[3 + q]; });
      first += COMPANY[k].length;
    }
    att.aSt.needsUpdate = true; att.aRnd.needsUpdate = true;
    return true;
  })();
  NAMES.forEach((k, i) => { if (k in paceOf) carp.schools[i].pace = paceOf[k]; });
  const index = (k) => (typeof k === 'string' && k !== 'all' ? NAMES.indexOf(k) : k);
  const familyPut = carp.put, familyBurst = carp.burst;
  carp.put = (k, metres) => familyPut(index(k), metres);
  carp.burst = (k = 'all', at = null) => familyBurst(index(k), at);

  // ---------------------------------------------------------------------------------------------- their marks on the petals
  // THE WINDOW OVER A BACK. The petals on this water are set.js's own sheet, which parts where the water's trace (its
  // lane channel) is open: each petal leaves at a threshold of its own, so that a mark of 0.4 has parted a third of
  // them, 0.55 three fifths, 0.7 all but a few; and the trace fades here by 0.026 a second (skin.close 25: the hull's
  // lane). The family's own mark (radius 0.175 with four fifths of it soft edge, strength 0.55) is narrower than one
  // cell of this trace (0.14 m: the orchard is 290 m long): it arrived as a dotted thread that could not be found from
  // the lane. So the marks are written here (the first holder: a core as wide as a carp's shoulders and a half, 0.35 m
  // with its edge, at 0.7, which half closed 9 s behind the back; how it is written now is said below). No mark where
  // the water over a back is more than 0.4 m: a carp the hull has pushed under opens nothing. At most one line a carp a
  // frame: 24 of the trace's 512.
  //
  // (the second holder) THE WINDOW LIES WHERE THE RIDER SEES THE BACK, AND IS AS LONG AS THE CARP. Two things were found
  // in enlargements beside the hull (.shots/orchard_sx_03_close_crop.png): the petals lay unparted across the near half
  // of every carp, and its window stood open beyond it. A mark written straight above a carp is not above what is SEEN
  // of it: the family draws a fish as the surface shows it (lifted to a third or a half of its depth), and a thing a
  // hand under the surface, seen from an eye 1.1 m up and a few metres off, shows through the surface 0.15 to 0.3 m
  // nearer the eye than the place it lies under. So each mark is moved that far toward the eye (worked out from the
  // family's own rule for the lift; never more than `lift` metres). And the mark was a round dab at the carp's middle:
  // its head and shoulders, where the back stands highest, led under closed petals. It is a short line now, from
  // behind the dorsal fin to the shoulders, along the way the carp is going.
  // AND NO PETAL IS LEFT HALF THERE OVER A CARP. This sheet's petals leave one by one, each at a threshold of its own,
  // and between 0.08 and 0.85 of the trace a petal is drawn part see-through. At the first holder's 0.7 a third of the
  // petals over a back were such ghosts, and a pale see-through petal on a dark back is a pale blotch ON THE FISH: a
  // patterned carp (.shots/orchard_sx_21_sip_crop.png), which the page forbids. So the mark is now flat and strong over
  // the whole of what is seen of the carp (0.8 over a core 0.36 m wide, which is all the petals gone but a few at a
  // twentieth; a short steep edge), and the ghosts lie in its rim and in its trail, on open water. The price is time:
  // at this sheet's own pace of healing (skin.close 25: the hull's lane) a window that was clean is four fifths open
  // for 5 s behind the back, half closed at 13 s and shut at about 18 s, where the page asks 8 s (see the log, "Asked
  // of the set"). Seen from the boat the five of a file leave one dark lead behind them, which the petals take back
  // one by one (.shots/orchard_sx_25_close86_crop.png, at 0.86).
  // (the fourth holder: THAT PRICE IS NO LONGER PAID. The mark is written as strong as before, and the trail behind
  // each back is brought toward closed by `closing`, below (CLOSE, at the top): half the petals are back about four
  // seconds behind a back and all of them in seven or eight, and each carp of a file has open water of its own.)
  const MARK = { radius: num('carpmarkr', 0.26), strength: num('carpmark', 0.8), soft: num('carpmarks', 0.3), within: num('carpwithin', 0.44), near: 45, lift: num('carplift', 0.32), fore: 0.3, aft: 0.34 };
  const prev = new Float32Array(n * 2).fill(NaN), way = new Float32Array(n * 2), P = [0, 0, 0], P5 = [0, 0, 0, 0, 0], eye = ctx.engine.shared.uCameraPos.value, school = carp.fish;
  const wrote = new Float32Array(n * 2).fill(NaN);              // where each carp's window was written this frame (NaN: it wrote none)
  const marks = () => {
    wrote.fill(NaN);
    const tr = ctx.water.trace; if (!tr || !tr.active || !tr.line) return;
    const radius = Math.max(MARK.radius, 1.7 * (tr.cell || 0.125)), E = Math.max(0.4, eye.y);
    for (let i = 0; i < n; i++) {
      school.posAt(i, school.now, P5);
      const x = P5[0], y = P5[1], z = P5[2], size = sizes[i * 4 + 3], o = i * 2, mx = x - prev[o], mz = z - prev[o + 1], ml = Math.hypot(mx, mz);
      prev[o] = x; prev[o + 1] = z;
      // the way it is going: the way it has moved, while it moves; the way it faces while it hangs
      if (!(ml < 1.5) || (way[o] === 0 && way[o + 1] === 0)) { way[o] = P5[3]; way[o + 1] = P5[4]; if (!(ml < 1.5)) continue; }
      if (ml > 1e-3) { const a = Math.min(1, ml / 0.03), wx = way[o] + (mx / ml - way[o]) * a, wz = way[o + 1] + (mz / ml - way[o + 1]) * a, wl = Math.hypot(wx, wz) || 1; way[o] = wx / wl; way[o + 1] = wz / wl; }
      if (Math.hypot(x - boat.x, z - boat.z) > MARK.near) continue;
      // (the fourth holder: WHOLE OVER EVERY BACK THE PAGE GIVES. The mark used to weaken from 22 cm of water over a back,
      // and while a file's one lead stood open for twenty seconds nobody saw it: a deeper carp swam in the leader's
      // water. Now that the petals come back between one carp and the next, a carp 26 cm down under its own half-strength
      // mark wore the petals that had half returned: a patterned carp again (.shots/orchard_sz_31_sip_crop.png, +8.4 s).
      // Whole to 31 cm, nothing below 44: only a carp the hull has pushed under opens less. And the mark reaches a
      // hand further back (`aft`), past the tip of the tail.)
      const back = -y - 0.132 * size, k = 1 - smooth(MARK.within * 0.7, MARK.within, back);      // metres of water over its back
      if (k <= 0.03) continue;
      // where the rider sees it: nearer the eye than where it lies, by the depth it is DRAWN at times the slope of the sight line
      const ex = eye.x - x, ez = eye.z - z, D = Math.hypot(ex, ez), sinE = E / Math.hypot(E, D), shown = Math.max(sinE / Math.sqrt(0.769 + sinE * sinE), 0.12) * Math.max(0, -y);
      const off = D > 0.05 ? Math.min(MARK.lift, shown * D / (E + shown)) / D : 0, cx = x + ex * off, cz = z + ez * off, hx = way[o], hz = way[o + 1];
      tr.line(cx - hx * MARK.aft * size, cz - hz * MARK.aft * size, cx + hx * MARK.fore * size, cz + hz * MARK.fore * size, { radius, strength: MARK.strength * k, soft: MARK.soft });
      wrote[o] = cx; wrote[o + 1] = cz;
    }
  };
  // THE WINDOW CLOSES BEHIND THE BACK (CLOSE, above). Every `step` seconds each carp's window place is kept (21 of them:
  // eight seconds and one); in between, one carp after another (all of them within one step, so the draws are spread
  // over the frames) has the bounds of its own trail from `from` to `to` seconds ago brought toward closed.
  const SM = Math.round(CLOSE.to / CLOSE.step) + 1, trail = new Float32Array(n * SM * 2).fill(NaN), hullAt = new Float32Array(160 * 3).fill(NaN);
  const closeRate = Q.has('carpclose') ? Math.max(0, num('carpclose', CLOSE.rate)) : CLOSE.rate;
  CLOSE.rate = closeRate;
  let newest = 0, sampleAt = 0, closed = 0, hullN = 0, hullX = NaN, hullZ = NaN, stamps = 0, skipped = 0;
  const closing = (t) => {
    const tr = ctx.water.trace;
    // where the hull has been: its stem's place every 0.4 m, kept 27 s (the hull's own lane takes 25 s to close; the rest
    // of the hull follows its stem, and the hull as it lies now is asked about below)
    const fx = -Math.sin(boat.heading), fz = -Math.cos(boat.heading), bx = boat.x + fx * 1.84, bz = boat.z + fz * 1.84;
    if (!(Math.hypot(bx - hullX, bz - hullZ) < 0.4)) { hullX = bx; hullZ = bz; const o = (hullN++ % 160) * 3; hullAt[o] = hullX; hullAt[o + 1] = hullZ; hullAt[o + 2] = t; }
    if (t >= sampleAt) {
      sampleAt = Math.max(sampleAt + CLOSE.step, t - CLOSE.step); newest = (newest + 1) % SM;
      for (let i = 0; i < n; i++) { const o = (i * SM + newest) * 2; trail[o] = wrote[i * 2]; trail[o + 1] = wrote[i * 2 + 1]; }
      // the holes where carp sipped are kept open a while against the closing round them (`sipped`, below)
      if (tr && tr.active && tr.inject) for (let h = holes.length - 1; h >= 0; h--) { const q = holes[h]; if (t > q[2]) { holes[h] = holes[holes.length - 1]; holes.pop(); } else tr.inject(q[0], q[1], HOLE); }
    }
    if (!(CLOSE.rate > 0) || !tr || !tr.active || !tr.stamp) return;
    const due = Math.floor(t / (CLOSE.step / n)), give = 1 - Math.exp(-CLOSE.rate * CLOSE.step), k0 = Math.round(CLOSE.from / CLOSE.step);
    if (due - closed > n) closed = due - n;                      // (a long frame: one round at the most)
    for (let turns = 0; closed < due && turns < 6; turns++, closed++) {
      const i = closed % n; let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
      for (let k = k0; k < SM; k++) { const o = (i * SM + ((newest - k) % SM + SM) % SM) * 2, x = trail[o]; if (x === x) { const z = trail[o + 1]; if (x < x0) x0 = x; if (x > x1) x1 = x; if (z < z0) z0 = z; if (z > z1) z1 = z; } }
      if (x1 < x0) continue;                                     // it has opened nothing in that time
      x0 -= CLOSE.pad; x1 += CLOSE.pad; z0 -= CLOSE.pad; z1 += CLOSE.pad;
      let clear = true;
      for (let q = -1.5; q <= 1.85 && clear; q += 0.67) { const hx = boat.x + fx * q, hz = boat.z + fz * q; if (hx > x0 - CLOSE.hull && hx < x1 + CLOSE.hull && hz > z0 - CLOSE.hull && hz < z1 + CLOSE.hull) clear = false; }      // the hull as it lies, stern to stem
      for (let h = 0; h < 160 && clear; h++) { const o = h * 3, hx = hullAt[o]; if (hx === hx && t - hullAt[o + 2] < 27 && hx > x0 - CLOSE.hull && hx < x1 + CLOSE.hull && hullAt[o + 1] > z0 - CLOSE.hull && hullAt[o + 1] < z1 + CLOSE.hull) clear = false; }
      if (!clear) { skipped++; continue; }
      if (tr.stamp(0, { channel: 'lane', x: (x0 + x1) / 2, z: (z0 + z1) / 2, width: x1 - x0, depth: z1 - z0, give })) stamps++;
    }
  };
  // A SIP TAKES ONE FLOATING PETAL (the page). Floating petals keep no state, so none can be taken away: the skin is
  // opened where the lips were, a hole a hand across that OUTLASTS THE WINDOW ROUND IT: it is held open for six seconds
  // while the window closes over the carp's trail (CLOSE, above), and then heals at the sheet's own pace (twenty seconds
  // more): a small dark place in the petals where one was taken.
  const holes = [], HOLE = { radius: 0.2, strength: 0.92, soft: 0.6 };
  const sipped = (x, z) => { const tr = ctx.water.trace; if (tr && tr.active && tr.inject) { HOLE.radius = Math.max(0.2, 1.5 * (tr.cell || 0.125)); tr.inject(x, z, HOLE); if (holes.length < 24) holes.push([x, z, ctx.time + 6]); } };

  // ---------------------------------------------------------------------------------------------- the things left
  // The crate, the loose plank, the hung baskets and the rest are heroes_b.js's and move there (shared.made: they ride
  // the water, bob, lag a wake, settle slowly, are shouldered by the hull). What the carp add: a boil rocks whatever
  // floats or hangs within seven metres of it, EACH THING AS LATE AS THE RING TAKES TO REACH IT (1.6 m/s: shared.made.wake
  // by itself rocks everything at once). And, for the staging's sound: 'rock' when a thing afloat is set rocking.
  const due = [];
  const wake = (x, z, strength = 0.5, reach = 6) => {
    if (!made || !made.wake) return;
    for (const list of [made.floats, made.hangs]) for (const o of list || []) {
      const ox = o.at ? o.at.x : o.x, oz = o.at ? o.at.z : o.z, d = Math.hypot(ox - x, oz - z);
      if (d < reach && due.length < 64) due.push({ at: ctx.time + d / 1.6, o, s: strength * (1 - d / reach) });
    }
  };
  // THE CRATE CAN BE SHOULDERED ONTO THE CARP'S OWN LOOP (a hull that runs into it pushes it up to three metres: it was
  // pushed from (58, +3) to (59.2, +5.8), which is on the loop, in .shots/orchard_sx_27_nudge.png). Fish see no scenery;
  // the family lets them keep clear of a thing that is named to them, without fright: so wherever the crate lies, the
  // four part round it. (Where it was left it is beyond their reach, and nothing is changed.)
  { const c = made && (made.floats || []).find((f) => f.name === 'crate'); if (c && carp.threat) carp.threat(() => [c.x, -0.12, c.z], { radius: 0.6, scare: false }); }
  const rocking = new Map(), coming = new Map();                // (coming: how hard each thing is about to be rocked by a ring that is arriving now)
  const left = shared.cast.left = {
    floats: made ? made.floats : [], hangs: made ? made.hangs : [], wake,
    on: (kind, fn) => { if (kind === 'rock') heard.rock.push(fn); return left; },
  };

  // ---------------------------------------------------------------------------------------------- for the staging
  let holdTo = 1, holdRate = 0, letGo = false, ringed = false;
  // seconds the current takes to carry a boat from the page's s to `to` (negative: it is past it already)
  const carried = (s, to) => { let t = 0; const step = s < to ? 0.5 : -0.5; for (let q = s; step > 0 ? q < to : q > to; q += step) t += step / plan.currentAt(q + step / 2); return t; };
  const meets = MEETS.map((m) => ({ ...m, k: NAMES.indexOf(m.school), done: Q.get('carpmeet') === '0' }));
  const meet = (m, s) => { m.done = true; familyPut(m.k, m.tail - carp.schools[m.k].speed * carried(Math.min(s, m.at + 24), m.at)); };      // the school's tail, for a boat on the current at the page's s
  // the gates (GATES, above): a loop as the family lays it (the same closed curve through the same points), 240 places
  // round it, to find where it comes nearest a place in the water; and which carp are which school's
  const loops = {}, firstOf = NAMES.map((_, i) => NAMES.slice(0, i).reduce((a, k) => a + R[k].n, 0));
  const loopOf = (name) => loops[name] || (loops[name] = (() => { const c = new THREE.CatmullRomCurve3(realm(R[name].way).map((q) => new THREE.Vector3(q[0], q[1], q[2])), true, 'centripetal'); c.arcLengthDivisions = 600; return c.getSpacedPoints(240); })());
  const gates = GATES.map((g) => ({ ...g, k: NAMES.indexOf(g.school), armed: Q.get('carpmeet') !== '0', inside: false, put: null }));
  const gate = (g) => {
    const sc = carp.schools[g.k], pts = loopOf(g.school), N = pts.length - 1, long = sc.long > 0 ? sc.long : 4.8;
    for (let i = firstOf[g.k]; i < firstOf[g.k] + R[g.school].n; i++) { carp.fishAt(i, P); if (Math.hypot(P[0] - boat.x, P[2] - boat.z) < FAR) return; }      // one of them is near enough to be seen: they are here already
    const T = plan.xz(here.s + AHEAD, here.d);                   // the water the boat is making for, if it holds its line
    let best = 0, gap = 1e9; for (let j = 0; j < N; j++) { const d = Math.hypot(pts[j].x - T[0], pts[j].z - T[1]); if (d < gap) { gap = d; best = j; } }
    if (gap > 6) return;                                         // their loop does not come near that line
    const mid = best / N * sc.L;
    for (let a = -0.5; a <= 0.5; a += 0.25) { const q = pts[((Math.round((mid + a * long) / sc.L * N) % N) + N) % N]; if (Math.hypot(q.x - boat.x, q.z - boat.z) < FAR) return; }      // (nor may they be put where they could be seen arriving)
    familyPut(g.k, mid - long / 2); g.put = +(mid - long / 2).toFixed(1);
  };
  // A CARP ROLLS (ROLL, above): one of school k comes over at the surface now (the family's `rise`); false if none could
  // (all of them are in the middle of a sip, or the school has just been frightened). Which carp: a different one each
  // time, from a count. By itself: each school on a clock of its own, only while its nearest carp is at a distance to
  // be seen across the water and not as a back; never two schools within four seconds of each other.
  const hash = (a, b) => { let h = Math.imul((a + 1) | 0, 374761393) ^ Math.imul((b + 7) | 0, 668265263); h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
  const rollN = NAMES.map(() => 0), rollAt = NAMES.map((_, k) => ROLL.first[0] + (ROLL.first[1] - ROLL.first[0]) * hash(k, 0)), rollsOn = Q.get('carprolls') !== '0';
  let lastRoll = -1e6;
  const roll = (k) => {
    const sc = carp.schools[k]; if (!sc || ctx.time - sc.lastBurst < 9) return false;
    const cnt = R[NAMES[k]].n, j0 = k === 0 && lane.hold < 0.5 ? cnt - 1 : Math.floor(hash(k, 500 + rollN[k]) * cnt);      // (of the five that hang up the lane: the first of them, the one the boat is coming to)
    for (let q = 0; q < cnt; q++) { const i = firstOf[k] + (j0 + q) % cnt; if (!school.busy(i, ctx.time)) { rollN[k]++; lastRoll = ctx.time; carp.rise(i, 'rise'); return true; } }
    return false;
  };
  const nearestOf = (k) => { let m = 1e9; for (let i = firstOf[k]; i < firstOf[k] + R[NAMES[k]].n; i++) { carp.fishAt(i, P); const d = Math.hypot(P[0] - boat.x, P[2] - boat.z); if (d < m) m = d; } return m; };
  const rolls = (t) => {
    if (t - lastRoll < 4) return;
    for (let k = 0; k < NAMES.length; k++) {
      if (t < rollAt[k]) continue;
      const d = nearestOf(k);
      // (not now: too near, too far, held, or just frightened: it is asked again in a few seconds)
      if (d < ROLL.near[0] || d > ROLL.near[1] || (k === 0 && lane.hold < 1) || !roll(k)) { rollAt[k] = t + 2 + 3 * hash(k, 900 + Math.floor(t)); continue; }
      rollAt[k] = t + ROLL.every[0] + (ROLL.every[1] - ROLL.every[0]) * hash(k, rollN[k]);
      return;
    }
  };
  Object.assign(carp, {
    names: NAMES, staged: false, marks: MARK, closing: CLOSE, company,
    school: (name) => carp.schools[NAMES.indexOf(name)],
    on: (kind, fn) => { if (heard[kind]) heard[kind].push(fn); return carp; },
    /** One carp of that school rolls at the surface now: a back, the long fin, a ring that travels (name or number; left out: the school nearest the boat). True if one did. */
    roll(k) { if (k === undefined) { let b = 0, bd = 1e9; for (let i = 0; i < NAMES.length; i++) { const d = nearestOf(i); if (d < bd) { bd = d; b = i; } } k = b; } const did = roll(index(k)); if (did) rollAt[index(k)] = Math.max(rollAt[index(k)], ctx.time + ROLL.every[0]); return did; },
    /** The lane's five back up the lane, held. */
    hang() { letGo = false; holdTo = 0; holdRate = 0; lane.hold = 0; familyPut(0, (lane.L + HANG) % lane.L); return carp; },
    /** ... let go: they swim east along the lane's south bank, toward the bow. */
    release(seconds = 3) { letGo = true; holdTo = 1; holdRate = seconds > 0 ? 1 / seconds : 1e3; if (!(seconds > 0)) lane.hold = 1; return carp; },
    /** A cue's settle (and what this module does for a boat that is set down part-way): the world as a boat that came by the lane finds it. */
    settle() {
      const s = plan.locate(boat.x, boat.z, {}).s;
      if (s < LET_GO) return carp.hang();
      letGo = true; holdTo = 1; holdRate = 0; lane.hold = 1;
      // the five are met at about s 61: a boat set down between s 54 and s 66 is in the middle of it (they lie along the
      // bank beside it, a metre ahead of its middle); further on they have gone by, round their loop
      familyPut(0, clamp(64.3 - s, -12, 10));
      for (const m of meets) if (!m.done && s >= m.from) meet(m, s);
      return carp;
    },
  });
  shared.cast.carp = carp;
  carp.hang();                                                 // until the area is entered: the lane's five up the lane, held
  // THE FIRST FRAME THE AREA IS RIDDEN: where has the boat been set down? At the door (the ride): the five hang and wait
  // for s 54. Part-way (a rider coming back in from the town; a picture taken at &s=120): the world as a boat that came
  // by the lane would find it. (The staging's own cue does the same through `settle`: once is enough, twice is harmless.)
  let arrived = false;
  const arrive = () => {
    arrived = true;
    const s = plan.locate(boat.x, boat.z, {}).s;
    if (Q.has('carpfree')) carp.release(0); else if (s >= LET_GO) carp.settle();
    for (const m of meets) if (!m.done && s >= m.from) meet(m, s);      // (a boat set down part-way came by the lane)
    for (const name in put0) { const k = NAMES.indexOf(name); familyPut(k, put0[name] * carp.schools[k].L); for (const m of meets) if (m.k === k) m.done = true; for (const g of gates) if (g.k === k) g.armed = false; }
  };

  // (developer) &carpshow=1: the loops drawn a hand above the water, and a bead over every carp where the script says it is
  if (Q.has('carpshow')) {
    const beads = new THREE.InstancedMesh(new THREE.SphereGeometry(0.06, 8, 6), new THREE.MeshBasicMaterial({ color: '#ff3030' }), n);
    beads.frustumCulled = false; ctx.add(beads);
    const m = new THREE.Matrix4(), p = [0, 0, 0];
    ctx.onUpdate(() => { for (let i = 0; i < n; i++) { carp.fishAt(i, p); m.makeTranslation(p[0], 0.12, p[2]); beads.setMatrixAt(i, m); } beads.instanceMatrix.needsUpdate = true; });
    for (const k of NAMES) {
      const pts = realm(R[k].way).map((q) => new THREE.Vector3(q[0], 0.1, q[2])), curve = new THREE.CatmullRomCurve3(pts, true, 'centripetal');
      const line = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(curve.getSpacedPoints(200)), new THREE.LineBasicMaterial({ color: '#ffe060' }));
      line.frustumCulled = false; ctx.add(line);
    }
  }
  // (developer) a sip, a fright, a report
  const sipAt = num('carpsip', -1), burstQ = (Q.get('carpburst') || '').split(':'), burstAt = burstQ[0] !== '' && isFinite(+burstQ[0]) ? +burstQ[0] : -1, burstIn = NAMES.indexOf(burstQ[1]), trackName = Q.get('carptrack'), logTo = /^[\w-]+\.json$/.test(Q.get('carplog') || '') ? Q.get('carplog') : null, logAt = num('carplogat', Math.min(60, num('t', 2)) - 0.3);
  const rollQ = (Q.get('carproll') || '').split(':'), rollAtQ = rollQ[0] !== '' && isFinite(+rollQ[0]) ? +rollQ[0] : -1, rollIn = NAMES.indexOf(rollQ[1]);
  let sipDone = false, burstDone = false, rollDone = false, logDone = false, trackNext = 0;
  const nearestFish = () => { let b = 0, bd = 1e9; for (let i = 0; i < n; i++) { carp.fishAt(i, P); const d = Math.hypot(P[0] - boat.x, P[2] - boat.z); if (d < bd) { bd = d; b = i; } } return b; };

  // (developer, with &carplog) WHAT STANDS IN THE WATER AS THE OTHER MODULES BUILT IT (not as the plan has it): every foot of
  // every crutch and prop (kit_trees.js sets forked poles aslant and stands shear legs with their feet apart), the plank
  // walk's trestles, the things afloat; and for each loop the least water left beside the file at any of them.
  const standing = () => {
    const pg = (x, z) => { const l = plan.locate(x, z, {}); return [+l.s.toFixed(2), +l.d.toFixed(2)]; };
    const feet = (shared.crutchFeet || []).map((f) => ({ what: 'crutch foot', x: f.x, z: f.z, r: f.r || 0.09 }));
    const walk = ((made && made.walk) || []).map((w) => ({ what: 'trestle', x: w.at.x, z: w.at.z, r: 0.55, planks: w.planks }));
    const afloat = ((made && made.floats) || []).map((f) => ({ what: f.name, x: f.x, z: f.z, r: f.r || 0.4 }));
    const things = [...feet, ...walk, ...afloat], clear = {};
    for (const name of NAMES) {
      const c = new THREE.CatmullRomCurve3(realm(R[name].way).map((q) => new THREE.Vector3(q[0], q[1], q[2])), true, 'centripetal'); c.arcLengthDivisions = 800;
      const pts = c.getSpacedPoints(600), near = [];
      for (const th of things) { let m = 1e9; for (const q of pts) m = Math.min(m, Math.hypot(q.x - th.x, q.z - th.z)); if (m - th.r < 2.2) near.push([th.what, ...pg(th.x, th.z), +(m - th.r).toFixed(2)]); }
      clear[name] = near.sort((p, q) => p[3] - q[3]).slice(0, 8);
    }
    return { crutchFeet: feet.map((f) => [...pg(f.x, f.z), f.r]), walk: walk.map((w) => [...pg(w.x, w.z), w.planks]), afloat: afloat.map((f) => [f.what, ...pg(f.x, f.z)]), clear };
  };

  return {
    update(dt) {
      const t = ctx.time, k = shared.hour || 0, u = carp.uniforms;
      if (!arrived) arrive();
      // the hour on them
      u.uUnder.value.w = LOOK.lampsA + (LOOK.lampsB - LOOK.lampsA) * k;
      u.uGold.value.copy(LOOK.goldA).lerp(LOOK.goldB, k);
      // the lane's five: let go at s 54 unless the staging does it; eased, never jumped
      if (!carp.staged && !letGo && !ringed && here.s >= RING_AT) { ringed = true; if (here.s < LET_GO && lane.hold < 0.5 && rollsOn) roll(0); }      // the ring ahead of the bow (RING_AT)
      if (!carp.staged && !letGo && here.s >= LET_GO) carp.release(3);
      if (holdRate > 0 && lane.hold !== holdTo) lane.hold = holdTo > lane.hold ? Math.min(holdTo, lane.hold + holdRate * dt) : Math.max(holdTo, lane.hold - holdRate * dt);
      // the four round the crate: found in its raft (chosen while they are still far off)
      for (const m of meets) if (!m.done && here.s >= m.from) { if (here.s <= m.to) meet(m, here.s); else m.done = true; }
      // the pond's six and the walk's five: met by a boat that comes into their water (the gates)
      for (const g of gates) {
        const inside = here.s >= g.s[0] && here.s <= g.s[1] && here.d >= g.d[0] && here.d <= g.d[1];
        if (inside && !g.inside && g.armed) { g.armed = false; gate(g); }
        else if (!inside && !g.armed && !Q.has('carpput') && Q.get('carpmeet') !== '0') { const c = carp.schools[g.k].centre; if (Math.hypot(c.x - boat.x, c.z - boat.z) > 30) g.armed = true; }
        g.inside = inside;
      }
      marks();
      closing(t);
      if (rollsOn) rolls(t);
      // the boils' rings reach the things left
      // (the ring lifts a thing over most of a second, it does not kick it: given all at once, the crate's tilt jumped by
      // up to a degree and a half between one frame and the next)
      coming.clear();
      for (let i = due.length - 1; i >= 0; i--) {
        const e = due[i], q = (t - e.at) / 0.8; if (q < 0) continue;
        made.wake(e.o.at ? e.o.at.x : e.o.x, e.o.at ? e.o.at.z : e.o.z, e.s * smooth(0, 1, q), 0.5);
        coming.set(e.o, Math.max(coming.get(e.o) || 0, e.s));
        if (q >= 1) { due[i] = due[due.length - 1]; due.pop(); }
      }
      // a thing afloat set rocking (heroes_b.js rings the water round it at the same moment: exc passing 0.22)
      if (made && made.floats) for (const f of made.floats) { const was = rocking.get(f) || false; if (!was && f.exc > 0.22) { rocking.set(f, true); tell('rock', f.x, f.z, f.name, Math.max(f.exc, coming.get(f) || 0)); } else if (was && f.exc < 0.08) rocking.set(f, false); }
      // (developer)
      if (sipAt >= 0 && !sipDone && t >= sipAt) { sipDone = true; carp.rise(nearestFish(), 'sip'); }
      if (rollAtQ >= 0 && !rollDone && t >= rollAtQ) { rollDone = true; if (rollIn >= 0) roll(rollIn); else { lastRoll = t; carp.rise(nearestFish(), 'rise'); } }
      if (burstAt >= 0 && !burstDone && t >= burstAt) {
        burstDone = true;
        if (burstIn >= 0) familyBurst(burstIn, null);
        else { let b = 0, bd = 1e9; carp.schools.forEach((sc, i) => { const d = Math.hypot(sc.centre.x - boat.x, sc.centre.z - boat.z); if (d < bd) { bd = d; b = i; } }); familyBurst(b, { x: boat.x, z: boat.z }); }
      }
      if (trackName && logTo && !logDone && t >= trackNext && made) {
        trackNext = t + 0.25;
        const f = (made.floats || []).find((q) => q.name === trackName);
        if (f && f.model) { const g = f.model.group, l = plan.locate(f.x, f.z, {}); log.push([+t.toFixed(2), 'is', +f.exc.toFixed(3), +(g.position.y * 100).toFixed(2), +(g.rotation.x * 57.3).toFixed(2), +(g.rotation.z * 57.3).toFixed(2), +l.s.toFixed(2), +l.d.toFixed(2), +(f.yaw * 57.3).toFixed(1)]); }
        // (&carptrack=hang0 | hang1 | hang2: a hung basket: how rocked it is, how far off its rung in degrees, how often it has tapped back, metres from the boat)
        const h = /^hang\d$/.test(trackName) ? (made.hangs || [])[+trackName.slice(4)] : null;
        if (h) log.push([+t.toFixed(2), 'is', +h.exc.toFixed(3), +(h.phi * 57.3).toFixed(2), h.taps, +Math.hypot(h.at.x - boat.x, h.at.z - boat.z).toFixed(1)]);
      }
      if (logTo && !logDone && t >= logAt) {
        logDone = true;
        const page = (v) => { const l = plan.locate(v.x, v.z, {}); return [+l.s.toFixed(1), +l.d.toFixed(1)]; };
        fetch('/__shot/' + logTo, { method: 'POST', body: JSON.stringify({ t: +t.toFixed(2), boat: page(boat), eye: [+eye.x.toFixed(2), +eye.y.toFixed(2), +eye.z.toFixed(2)], heading: +(boat.heading * 57.3).toFixed(1), schools: NAMES.map((name, i) => ({ name, centre: page(carp.schools[i].centre), hold: +carp.schools[i].hold.toFixed(2), L: +carp.schools[i].L.toFixed(1) })),
          fish: Array.from({ length: n }, (_, i) => { carp.fishAt(i, P); const l = plan.locate(P[0], P[2], {}); return [+l.s.toFixed(2), +l.d.toFixed(2), +P[1].toFixed(3), +Math.hypot(P[0] - boat.x, P[2] - boat.z).toFixed(2)]; }), heard: log,
          // the things left as they stand at that moment: how rocked each is (0..1), and for a hung basket whether it is off its rung and how often it has tapped back
          left: made ? { floats: (made.floats || []).map((f) => [f.name, ...page(f), +f.exc.toFixed(3), +Math.hypot(f.x - boat.x, f.z - boat.z).toFixed(1)]), hangs: (made.hangs || []).map((h) => [h.name, ...page(h.at), +h.exc.toFixed(3), +(h.phi * 57.3).toFixed(1), h.taps, +Math.hypot(h.at.x - boat.x, h.at.z - boat.z).toFixed(1)]) } : null,
          gates: gates.map((g) => ({ school: g.school, armed: g.armed, inside: g.inside, put: g.put })),      // (put: the metres round its loop a gate put that school's tail; null if it has not)
          company,                                                                                           // (true: every carp's place is COMPANY's)
          // the least distance between any two carp of each school at that moment, and which two (to see that none rides in another's wake)
          apart: NAMES.map((name, k) => { let m = 1e9, a = -1, b = -1; const A = [0, 0, 0], B = [0, 0, 0]; for (let i = firstOf[k]; i < firstOf[k] + R[name].n; i++) for (let j = i + 1; j < firstOf[k] + R[name].n; j++) { carp.fishAt(i, A); carp.fishAt(j, B); const d = Math.hypot(A[0] - B[0], A[2] - B[2]); if (d < m) { m = d; a = i; b = j; } } return [name, +m.toFixed(2), a, b]; }),
          closing: { rate: CLOSE.rate, stamps, skipped, holes: holes.length },                               // (stamps: patches of trail brought toward closed so far; skipped: those left alone because the hull had been there)
          set: standing() }, null, 1) }).catch(() => {});
      }
    },
  };
}
