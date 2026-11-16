// The answering sea: the cast, group "Comets" (docs/build/sea/3-cast-comets.md): the boat's own light, the fish the bow
// scatters as sparks, and the seven dolphins of light that come for those fish. The page: docs/art/sea.md, sections 5 to 8.
//
//   sea light      wherever water is moved, from the cue 'firstlight' (s 14) until the light dies in the cave (s 236 to
//                  256). Its base is the set's and is not rebuilt here: light.js (sea.sheet) draws the water's trace as
//                  marks by age, air.js writes the hull's lane. This module only gives the cast one way of writing into
//                  it on the area's own scale (shared.cast.seaLight), and writes its own marks through it.
//   fish sparks    the fish family's makeSparks: a pool of 300, six to fourteen a second with the boat's speed (none
//                  under 0.3 m/s), from moment 1 (s 26) for as long as the sea answers; each start a dab of old light.
//   dolphins       the swimmers family's seven, drawn as light: a dark body in a sheath of streaming specks with three
//                  seconds of comet. They come for the fish the bow scatters (s 34, once the boat moves), keep the page's
//                  seven stations round the stem, roll at the surface in turn, range off when the boat stops, drive into
//                  shoal 1 at (76, +8) and are gone by s 86, never to come back.
//
// What the family gives and what is made here. The animal, its stations, its roll and its breath are the family's
// (docs/life/swimmers.md). Made here, because this place needs them otherwise:
//   - where it is drawn. Every point of a body under the water, and every point of its comet, is drawn where the eye
//     would see it through the surface (a body a metre and a half down is seen a hand under the water from six metres
//     off), the depth taken under the water as it STANDS on this 1.4 m swell. The family's own lift takes the water to
//     stand at y = 0 and is left off. Drawn where they truly are, the animals ahead of the stem were hidden by the
//     rider's own bow, and from the seat the pod was a few specks (`skin`, `seen`).
//   - its light. The family's sheath and comets are cut with the water's own fleck mask, and its sheath takes "wet" to
//     mean under y = 0; this area draws every light with marks of its own (shared.sea: the dabs and the stipple). So
//     the light on its wet skin is drawn here in those marks, which lie in the water where they are while the body
//     slides through them (`skin`), and the comets are drawn here as the sheet draws its road, in small: a glitter of
//     specks, dense in the dabs, each mark cooling as it goes out; far off, dashes with a knot of light at the head.
//   - its marks on the water. In this area a trace strength is an AGE (0.6 is new light: the hull's own lane); the
//     family's 0.9 and 1.0 would be whiter than the hull's lane and outlast it. They are written here, on that scale.
//   - where it may swim. The family knows nothing of rock. Here every goal an animal steers for is first led round
//     the kit's colliders (`around`), the two that come from ahead come out of the gate's mouth (the family puts them 60 m
//     off at 22 degrees, which from s 34 is inside stack 10 and the gate's wall), a boat that stops sends them ranging in
//     clear water, and they leave through a real opening: between stacks 6 and 10 (the page's "between 9 and 11" is a
//     closed pocket: stacks 3, 7 and 9 stand as one wall on the right), or between 2 and 6, or out over the open reach.
//   - the weave. Pairs of them change places every two or three seconds, crossing under or ahead of the stem (`cross`).
//   - (third holder) a comet with a head. The strip of light is laid in rows of its own: along the body in the animal's own
//     outline from above (`N.pod.shape`), the snout white-hot in specks, then the wake from the flukes back, fainter, narrower
//     and cooler, with the strokes of the flukes in it; those from astern come strung out; the fish sparks are thin dashes.
//
// What this module gives staging is under shared.cast.comets, shared.cast.sparks and shared.cast.seaLight (the end of
// build). It plays no sound: 'blow', 'strike' and 'gone' are callbacks.
//
// Switches for looking: &play=comets (the moment at s 34 at once: with &drift=1, the boat must be moving),
// &play=firework (the hunt at shoal 1), &cplan=sea_cm_plan.json&clog=20 (after 20 s, write every frame of the boat and
// of every dolphin, and the rocks they keep clear of, to .shots/: .shots/sea_cm_plan.py, sea_cm_track.py and sea_cm_boatframe.py read
// it; with &cprof=1 also the milliseconds of this module's own script), &cmarks=0 (the dolphins write nothing on the
// water), &clift=0 (everything drawn where it truly is), &crefract=1 (the family's own lift, for flat water),
// &cgain=1.25 &csheath=1.25 &cfar=1 &cpx=2.2 &cspark=3 (other strengths of the comets, the light on the skin, the far
// look, the pixels a far comet's edges are parted, the sparks), &chide=tail,body,sparks (leave a part undrawn),
// &cone=-2.6,4.5,1.2 (one animal held on one station: metres ahead of the stem, to its right, down) with &crollat=14,
// &cforce=1 (they come though the boat lies still: then they range), &cleave=12 / &chunt=12 (they go, or hunt, 12 s in),
// &ccross=12 (the two abeam change places 12 s in), &cstop=14 / &cgo=30 (with &drift=1: the boat lies still from 14 s in, and goes on at 30),
// &csnout=0.85 &cheadfar=2.2 (how white the snout is; how bright the head of a far comet).
import * as THREE from 'three';
import { makeSwimmer } from '../../engine/life/swimmers.js';
import { makeSparks } from '../../engine/life/fish.js';
import { FOG_PARS } from '../../engine/kit.js';
import { SEA_GLSL } from './light.js';
import { lerp, clamp01 } from './plan.js';

// ------------------------------------------------------------------------------------------------ the group's numbers
// (kept here and not in plan.js, which the set's people are editing: nothing else reads them)
const N = {
  // ---- light written on the water, on the AREA's scale: a trace strength here is an age (docs/build/sea/2-light.md):
  // 0.6 is new light (the hull's own lane, air.js), 0.5 ember, under 0.42 violet; what is written at 0.6 is gone after
  // 27 s. Everything the cast writes is older (weaker) and narrower than the hull's lane (0.6 at 2.3 m half width).
  age: { hull: 0.6, blow: 0.56, back: 0.52, trail: [0.41, 0.5], spark: 0.5 },
  // ---- fish sparks (the page's row): from s 26; the dab each writes at its start: radius in metres
  // (as the family draws it a spark is a comet a hand wide with a fat head: under this area's tight bloom a tadpole in a halo, the brightest and the cutest thing at the bow.
  // A fish a hand long draws a hair of light: a shorter body, half the width (2.6 cm: thinner still and it was lost), a little more of its way behind it so that the dash
  // keeps the page's 0.3 to 0.6 m as it slows, and dim enough that the bloom leaves it a stroke)
  sparks: { from: 26, count: 300, rate: [6, 14], speedAt: [0.3, 3], ahead: [1.2, 5], spread: 1.6, fan: 1.22, depth: [0.2, 0.6], dash: [4, 6], seconds: 0.5, intensity: 2.3, length: 0.12, streak: 0.13, width: 0.22, dab: 0.34 },
  // ---- the dolphins
  pod: {
    count: 7, comet: 3, stride: 1.42, tint: '#26253c',
    sheath: { strength: 0, size: 2.7, share: 1.0, stream: 1.1 },       // (the family's own sheath: kept at nothing. It takes "wet" to mean under y = 0, and on this swell it lit a back that stood in the air in every trough: the light on the skin is drawn here, below)
    ride: 0.9,                    // how much of the swell's rise and fall an animal follows (the family holds a depth under STILL water: on a 1.4 m swell its fin cut every trough)
    // the light on its skin, drawn here: how bright (the page's "sheath 3" on the page's scale: the sheet's own new marks are about 1.1 times the aqua chip), how much of the wet skin
    // is lit (the snout and the leading edges of flippers and flukes take all of it, the rest of the body this share of it)
    skin: { strength: 1.25, share: 0.4 },
    // the comet: half its width behind the flukes (metres; it tapers to a third), how bright against the sheet's road, the depth over which light under water is lost;
    // and on the body: its greatest radius, the hand of lit water either side of it, how much brighter the snout; far: how much of a comet too far off to tell its marks apart
    // stands as a broken streak of its own colour (the rest is points that come and go), and how many pixels its two edges are parted there
    // (third holder: a comet has a HEAD. As found, the light on the body was a slipper 0.8 m wide over an animal of 0.4 m, and the tail was as wide, and its marks as bright
    // three metres back as on the snout: from the seat the pod was ribbons of one even glitter, the same as the hull's own road, and nothing said where the animal was in its
    // light or which end led. Now the light on the body has the animal's own outline (`shape`: beak, shoulders, stock, flukes), its snout is white-hot in specks as the hull's
    // own churn is, and the wake behind the flukes is `wake` times as bright, falling along its length, half as wide, cooler, with the strokes of the flukes standing in it
    // as knots `stroke` metres apart (1.42 lengths to a stroke, a knot for the upstroke and one for the downstroke))
    tail: { half: 0.25, gain: 1.25, deep: 3.5, hand: 0.06, head: 0.5, far: 1.0, pixels: 2.2, wake: [0.82, 0.36], fresh: 0.92, stroke: 1.56, snout: 0.85, skirt: 0.17, headFar: 2.2 },
    // the animal's outline from above, for the light that lies on it: how far behind the snout (in body lengths), its half width there, the height of its back over the line its snout drew (metres, for the model's 2.2 m)
    shape: { at: [0, 0.03, 0.07, 0.12, 0.18, 0.26, 0.36, 0.48, 0.6, 0.72, 0.82, 0.9, 0.94, 0.975, 1.0], half: [0.0, 0.035, 0.05, 0.08, 0.135, 0.185, 0.205, 0.195, 0.165, 0.12, 0.08, 0.05, 0.13, 0.25, 0.26], top: [0.0, 0.03, 0.06, 0.1, 0.15, 0.19, 0.21, 0.2, 0.17, 0.13, 0.09, 0.06, 0.04, 0.03, 0.03] },
    stations: [[3, 0, 1.4], [5, 2.5, 1.6], [5, -2.5, 1.6], [1, 4, 1.2], [1, -4, 1.2], [-3, 6, 2.0], [-3, -6, 2.0]],
    // the weave: pairs of stations that change places (each crossing passes under or ahead of the stem), and how long a place is held between crossings
    // (every two or three seconds: a boat left to the current has them at the bow for about nine seconds, from s 50 to 68. At one crossing in five seconds
    // that was two crossings in all, and three of the seven held one place the whole time)
    cross: { pairs: [[3, 4], [1, 2], [5, 2], [6, 1], [1, 4], [3, 2], [0, 3], [0, 4]], first: 5.5, every: [1.9, 3.2] },
    arrive: { s: 34, until: 56, moving: 0.8, distance: 60, seconds: 7, mouth: 58, abeam: 4, strung: [0.78, 1.08], fade: 1.4 },      // moment 2: from s 34 once the boat moves; not begun beyond `until`. The two from ahead: metres ahead along the route, metres either side of its centre line. strung: those from astern start between these shares of the distance, each with its own time to come (set off at one distance and one speed they came as a rank of three ticks of one length and one slant); fade: seconds a comet takes to show where it begins
    // moment 4: shoal 1; they drive at it and wheel through it this long, and go. (Third holder: begun at s 62, not the page's 68. They need a second and a half to reach
    // the shoal, in which the boat makes three metres: begun at 68 the shoal stood 63 degrees to starboard at the strike, out of a forward view, and when they left the
    // only real way out, between stacks 6 and 10, lay abeam: they went under the hull and the rider saw neither the firework nor the leaving. Begun at 62 the strike is
    // 36 degrees to starboard, and they leave when the boat is at s 69: across the bow, a boat's length ahead of the stem, and out to port. The director: "gone by s 76")
    hunt: { s: 62, at: [76, 8], depth: 2, seconds: 3.2 },
    leave: { s: 76, gone: 86, speed: [4.9, 5.15], file: 0.3, far: 55, hidden: [20, 3.3] },      // they go at s 76 whatever happened. Taken out beyond `far` metres of the boat, or behind rock for 3.3 s (their comets' length) and 20 m off
    range: { ring: [15, 25], speed: [3.2, 3.7], hold: [4, 8] },                 // a boat that stops: each to a place of clear water 15 to 25 m off, a new one every 4 to 8 s
    // what a dolphin writes on the water: a line at each surfacing (metres long, half width), and a stroke (half width `dab`) joined on for
    // every `step` metres travelled while its back is shallower than `shallow`
    line: [2, 0.44], dab: 0.38, step: 0.5, shallow: 1.2,
    tight: 3.6,                   // m/s it makes at most while it steers round rock
    clear: 2.0,                   // metres of water an animal's line is LAID from the kit's circles (it cannot turn tighter than three metres, and cuts a corner by about half of this: laid at 0.9 m, an animal ranging round a still boat among the pipes came a stride from a stack's columns)
  },
};
const TAU = Math.PI * 2;

export async function build(ctx, plan, shared) {
  const { kit, stage } = ctx, P = plan, C = P.colors, sea = shared.sea, S = ctx.engine.shared;
  const cast = shared.cast = shared.cast || {};
  if (!sea || !sea.uniforms) return {};                     // (the place and its light did not build: nothing for the cast to answer)
  const params = new URLSearchParams(typeof location !== 'undefined' ? location.search : '');
  const num = (k, d) => (params.has(k) && params.get(k) !== '' && !Number.isNaN(+params.get(k)) ? +params.get(k) : d);
  const U = sea.uniforms, answer = () => U.uSeaL.value.y;   // 0..1: whether the water answers at all (0 before the cue 'firstlight' and deep in the cave)

  // ---------------------------------------------------------------------------------------------- sea light
  // One way for the cast to write light on the water, on the area's own scale (an age, at most the hull's 0.6), and
  // nothing at all while the sea does not answer. The water takes 512 marks a frame from the whole realm: `frame` says
  // how many last frame's callers asked for through here.
  const seaLight = cast.seaLight = {
    age: N.age, written: 0, frame: 0,
    /** A dab of light at (x, z): radius in metres (0.3 at least: under three cells of the trace it flickers), age 0.42 (violet) .. 0.6 (new). */
    dab(x, z, radius = 0.4, age = 0.5, soft = 0.8) {
      const tr = ctx.water.trace, a = answer();
      if (!tr || !tr.inject || a < 0.02) return;
      tr.inject(x, z, { channel: 'glow', radius: Math.max(0.3, radius), strength: Math.min(N.age.hull, age) * a, soft }); seaLight.written++;
    },
    /** A stroke of light from (x0, z0) to (x1, z1), the same way. */
    line(x0, z0, x1, z1, radius = 0.4, age = 0.5, soft = 0.75) {
      const tr = ctx.water.trace, a = answer();
      if (!tr || !tr.line || a < 0.02) return;
      tr.line(x0, z0, x1, z1, { channel: 'glow', radius: Math.max(0.3, radius), strength: Math.min(N.age.hull, age) * a, soft }); seaLight.written++;
    },
  };

  // ---------------------------------------------------------------------------------------------- fish sparks
  // The family's sparks, in the area's aqua. The family's own dab (0.5 of a brightness) is left out: each start writes
  // a dab on the area's scale instead. They are fish seen by the light they stir, so they are not there before the
  // water answers at s 26, and they go out with the sea's light in the cave.
  const SP = N.sparks;
  let sparkOn = 0;
  const sparks = makeSparks(ctx, {
    count: SP.count, color: C.aqua, intensity: num('cspark', SP.intensity), rate: SP.rate, speedAt: SP.speedAt, ahead: SP.ahead, spread: SP.spread, fan: SP.fan, depth: SP.depth, dash: SP.dash, seconds: SP.seconds,
    length: num('csplen', SP.length), streak: num('cspstreak', SP.streak), width: num('cspwide', SP.width),
    trace: false, seed: 29,
    onTouch: (x, z) => { if (sparkOn > 0.5) { seaLight.dab(x, z, SP.dab, N.age.spark); if (cast.sparks.onSpark) cast.sparks.onSpark(x, z); } },
  });
  const sparkGlow = sparks.fish && sparks.fish.uniforms && sparks.fish.uniforms.uGlowCol ? sparks.fish.uniforms.uGlowCol.value : null, sparkGlow0 = sparkGlow ? sparkGlow.clone() : null;
  cast.sparks = { object: sparks.object, count: sparks.count, triangles: sparks.triangles, onSpark: null, gain: 1 };

  // ---------------------------------------------------------------------------------------------- clear water
  // The rocks an animal must keep out of: the kit's colliders (each a rock and about a metre of water round it), as
  // circles. `around` leads a goal round them: a goal inside rock is moved out to its edge, and with rock between an
  // animal and its goal it steers for the rock's shoulder on the side its goal lies.
  const D = N.pod, mid = kit.at(62, 0);
  const obs = ((shared.rocks && shared.rocks.colliders) || []).filter((q) => Math.hypot(q.x - mid.x, q.z - mid.z) < 115).map((q) => ({ x: q.x, z: q.z, r: Math.max(0.8, q.r - 0.3) }));
  // (the kit's circles are laid for a boat, which the row of small circles along each of the gate's jambs keeps out of the
  // jamb: between that row and the great circles of the wall behind it they leave a strip a metre or two wide that is rock.
  // An animal took it for water and swam the length of the jamb. It is closed here)
  { const g = shared.rocks && shared.rocks.gate;
    if (g && typeof g.x === 'number') for (const side of [-1, 1]) for (let v = -11; v <= 11.1; v += 2.75) { const d = side * (P.gate.open + 3.9); obs.push({ x: g.x + g.rx * d + g.tx * v, z: g.z + g.rz * d + g.tz * v, r: 3.9 }); } }
  const gapOf = (x, z) => { let g = 1e9; for (const o of obs) g = Math.min(g, Math.hypot(x - o.x, z - o.z) - o.r); return g; };      // metres of clear water round a place (negative: inside rock)
  // the first rock that stands within `pad` of the way from (x0, z0) to (x1, z1); null: the way is clear
  const crossed = (x0, z0, x1, z1, pad = 0.5) => {
    const vx = x1 - x0, vz = z1 - z0, L2 = vx * vx + vz * vz; let hit = null, best = 1e9;
    if (L2 < 1e-6) return null;
    for (const o of obs) {
      const t = ((o.x - x0) * vx + (o.z - z0) * vz) / L2;
      if (t <= 0 || t >= 1) continue;
      if (Math.hypot(o.x - x0 - vx * t, o.z - z0 - vz * t) < o.r + pad && t < best) { best = t; hit = o; }
    }
    return hit;
  };
  // the same for an animal's own look ahead: the nearest point of the way to each rock, its two ends included. (`crossed` counts a rock only where its
  // MIDDLE lies abeam of the way: a stack eight metres across that stood dead ahead, its middle beyond the end of the look, was never seen, and an
  // animal ranging round a still boat swam straight at stack 2 and wheeled away along its very columns)
  const ahead = (x0, z0, x1, z1, pad) => {
    const vx = x1 - x0, vz = z1 - z0, L2 = vx * vx + vz * vz || 1e-6; let hit = null, best = 1e9;
    for (const o of obs) {
      const t = Math.max(0, Math.min(1, ((o.x - x0) * vx + (o.z - z0) * vz) / L2)), g = Math.hypot(o.x - x0 - vx * t, o.z - z0 - vz * t) - o.r;
      if (g < pad && g < best) { best = g; hit = o; }
    }
    return hit;
  };
  // the least clear water along a way, its two ends included (metres from the circles; negative: through rock)
  const clearOf = (x0, z0, x1, z1) => {
    const vx = x1 - x0, vz = z1 - z0, L2 = vx * vx + vz * vz || 1e-6; let least = 1e9;
    for (const o of obs) { const t = Math.max(0, Math.min(1, ((o.x - x0) * vx + (o.z - z0) * vz) / L2)); least = Math.min(least, Math.hypot(o.x - x0 - vx * t, o.z - z0 - vz * t) - o.r); }
    return least;
  };
  // the middle of the channel nearest a place (the route's own line: always clear water), and whether a place lies in the channel
  const tmpP = {}, midOf = (x, z, out) => {
    let best = 1e18, bs = 0; const s0 = ctx.s || 0;
    for (let q = Math.max(6, s0 - 44); q <= Math.min(P.length - 6, s0 + 44); q += 2) { const c = ctx.path.at(q, tmpP), dd = (c.x - x) * (c.x - x) + (c.z - z) * (c.z - z); if (dd < best) { best = dd; bs = q; } }
    const c = ctx.path.at(bs, tmpP); out.x = c.x; out.z = c.z; out.off = Math.sqrt(best); out.half = c.halfWidth; out.s = bs; return out;
  }, nearMid = {};
  const around = (hx, hz, gx, gz, out) => {
    for (const o of obs) { const dx = gx - o.x, dz = gz - o.z, d = Math.hypot(dx, dz), R = o.r + D.clear * 0.5; if (d < R) { const k = R / Math.max(d, 1e-3); gx = o.x + dx * k; gz = o.z + dz * k; } }
    for (let pass = 0; pass < 2; pass++) {
      const hit = crossed(hx, hz, gx, gz, D.clear * 0.5);
      if (!hit) break;
      const cx = hit.x - hx, cz = hit.z - hz, dist = Math.hypot(cx, cz), R = hit.r + D.clear;
      const tc = Math.atan2(cx, cz); let dg = Math.atan2(gx - hx, gz - hz) - tc; dg = Math.atan2(Math.sin(dg), Math.cos(dg));
      const side = dg >= 0 ? 1 : -1;
      if (dist <= R + 0.05) { const a = tc + side * 1.75; gx = hx + Math.sin(a) * 4; gz = hz + Math.cos(a) * 4; break; }      // it is at the rock's very edge: away along it, and a little out
      const a = tc + side * Math.asin(Math.min(1, R / dist)), run = Math.sqrt(Math.max(0, dist * dist - R * R)) + 2.5;
      gx = hx + Math.sin(a) * run; gz = hz + Math.cos(a) * run;
    }
    out.x = gx; out.z = gz; return out;
  };

  // ---------------------------------------------------------------------------------------------- the dolphins
  const state = { begun: false, arrived: false, hunting: null, struck: false, leaving: false, gone: false, t0: -1, blows: 0, events: [] };
  const comets = cast.comets = {
    /** The moments are fired here from where the boat is (see update); set auto = false to drive arrive, hunt and leave by hand. */
    auto: true,
    onBlow: null,         // (x, z, swimmer): a dolphin's blowhole has cleared the water. The page: 'breath', pitch 2.2, gain 0.45, placed at the animal
    onStrike: null,       // (x, z): the first of them has reached the shoal they drive at (shoal 1 bursts from here)
    onGone: null,         // (): the last of them has left
    lead: new THREE.Vector3(), leadOn: false,      // the foremost of them (the one nearest what they hunt; else the one furthest ahead of the boat): for the shoals and the jellies' flare
    heads: new Float32Array(7 * 4),                // x, y, z, 1 while it is there: every animal, every frame
    state,
  };
  const marksOn = params.get('cmarks') !== '0';
  // the page's seven stations: metres ahead of the stem, to its right, down. The family reads them every frame, so two that
  // change places HERE send the two animals that hold them across under the stem (cross, below)
  const ST = D.stations.map((q) => q.slice());
  const one = params.get('cone') ? params.get('cone').split(',').map(Number) : null;      // &cone=ahead,right,down: one animal held on one station, for study (with &crollat=14: it rolls 14 s in)
  // ---- the skin. Two things the family cannot do on a sea that heaves 1.4 m, added to its material as one more
  // extension (after its own, at the gouache material's own hooks):
  //   seen through the surface   every point under the water is drawn where the eye would see it (light bends at the
  //       surface: what is under water looks shallower, by a quarter looking straight down, by five sixths at a glance).
  //       The family does this for water that stands at y = 0; here the depth is taken under the water AS IT STANDS at that
  //       place (the swell's own three waves), so a body is never lifted clear of a trough. Without it an animal a metre
  //       and a half down, six metres ahead, is drawn where the rider's own bow hides it: seen from the seat the pod was
  //       a few specks. (The comets below are raised by the same rule, on the CPU: `seen`.)
  //   light on wet skin   the sheet's own marks, lying in the water where they are while the body slides through them
  //       (so they stream aft at the animal's own speed), most on the snout and the leading edges of flippers and flukes
  //       (the model's own mask), and none on skin that stands in the air: its back and fin are dark against its own light.
  const lifted = params.get('clift') !== '0';
  const seen = (d, run, e) => { let k = 0.6; for (let i = 0; i < 4; i++) { const rise = e + k * d, c = rise / Math.hypot(run, rise); k = 0.752 * c / Math.sqrt(1 - (1 - c * c) * 0.565); } return k; };      // what is left of a depth d seen from an eye e over the water, run metres off (water's index 1.33)
  const Fk = P.seaLight.fleck, uSkin = { value: new THREE.Vector4(0, D.skin.share, lifted ? 1 : 0, 0) };      // x: how bright now; y: how much of the wet skin is lit; z: raised to where the eye sees it
  const skin = {
    uniforms: { uSwell: U.uSwell, uCmSkin: uSkin, uCmFleck: { value: new THREE.Vector4(Fk[0], Fk[1], Fk[2], Fk[3] ?? 0.75) }, tSeaFleck: U.tSeaFleck, tSeaStip: U.tSeaStip,
      uSeaAqua: U.uSeaAqua, uSeaEmber: U.uSeaEmber, uSeaCore: U.uSeaCore, uSeaDying: U.uSeaDying, uSeaOmega: U.uSeaOmega, uSeaFront: U.uSeaFront, uSeaLee: U.uSeaLee, uSeaL: U.uSeaL },
    vertexPars: /* glsl */`uniform vec4 uSwell[3]; uniform vec4 uCmSkin; varying float vCmDeep;`,
    vertexWorld: /* glsl */`
      float cmH = 0.0;                                                 // the water's own height here (the swell as the water has it: src/engine/water-final.js, waterSwell)
      for (int i = 0; i < 3; i++) { float cmPh = dot(uSwell[i].xy, wp.xz) - uSwell[i].z, cmA = uSwell[i].w; cmH += cmA * cos(cmPh) + 0.5 * length(uSwell[i].xy) * cmA * cmA * cos(2.0 * cmPh); }
      vCmDeep = cmH - wp.y;                                            // metres under the water as it stands here (negative: in the air)
      if (vCmDeep > 0.0 && uCmSkin.z > 0.5) {
        float cmRun = length(wp.xz - uCameraPos.xz), cmEye = max(uCameraPos.y - cmH, 0.3), cmK = 0.6;
        for (int i = 0; i < 4; i++) { float cmRise = cmEye + cmK * vCmDeep, cmC = cmRise / sqrt(cmRun * cmRun + cmRise * cmRise); cmK = 0.752 * cmC / sqrt(1.0 - (1.0 - cmC * cmC) * 0.565); }
        wp.y = cmH - vCmDeep * cmK;
      }`,
    fragmentPars: /* glsl */`${SEA_GLSL}
      uniform sampler2D tSeaFleck, tSeaStip; uniform vec3 uSeaAqua, uSeaEmber, uSeaCore, uSeaDying; uniform vec4 uCmSkin, uCmFleck; varying float vCmDeep;
      // (the sheet's own way with a mark: SEA_INK in light.js, which is not exported)
      vec3 cmMark(sampler2D t, vec2 uv) { vec4 m = texture2D(t, uv); float c = max(m.g, 0.004); return vec3(m.g, m.r / c, m.b / c); }
      vec3 cmInk(vec3 m, float cut, float a) { float mg = m.y - cut; return seaAge(a * (0.1 + 0.9 * smoothstep(0.02, 0.38, mg)), uSeaCore, uSeaAqua, uSeaEmber, uSeaDying) * (m.x * smoothstep(0.0, 0.14, mg)); }`,
    light: /* glsl */`
      {
        // light the WATER makes: on skin that is under it, none on skin in the air; and little on a body that lies at the surface (seen at a glance everything
        // within an arm's length under the surface is drawn into one band there: lit in full it was a tube of neon under a back that is out. The comet's
        // own marks lie round a back at the waterline: those are the light its fin stands dark against)
        float cmWet = smoothstep(0.12, 0.8, vCmDeep) * step(0.001, uCmSkin.x);
        float cmEdge = 0.0;
        #ifdef USE_COLOR_ALPHA
          // the model's mask: the snout, the leading edges of flippers and flukes. (It also marks the webs of every fin: the dorsal fin, lit all over while it was
          // under water, was a lamp on the animal's back. Only what faces up or down counts: flukes and flippers are level blades, the dorsal fin stands upright)
          cmEdge = (1.0 - vColor.a) * smoothstep(0.25, 0.7, abs(N.y));
        #endif
        float cmE = clamp(uCmSkin.y + (0.92 - uCmSkin.y) * cmEdge, 0.0, 1.0), cmAge = 0.64 + 0.16 * cmEdge;
        vec2 cmP = vWPos.xz, cmQ = vec2(vWPos.x + vWPos.z, vWPos.y * 1.7);                // from above; and as marks lie on an upright flank
        float cmCut = 1.06 - 0.92 * cmE;
        vec3 cmTop = cmInk(cmMark(tSeaFleck, cmP * uCmFleck.x), cmCut, cmAge) + 0.8 * cmInk(cmMark(tSeaFleck, cmP.yx * uCmFleck.x + 0.37), cmCut + 0.04, cmAge) + 0.9 * cmInk(cmMark(tSeaStip, cmP * uCmFleck.w), 1.03 - 0.9 * cmE, cmAge);
        vec3 cmSide = 1.2 * cmInk(cmMark(tSeaFleck, cmQ * uCmFleck.x + 0.19), cmCut, cmAge) + 0.9 * cmInk(cmMark(tSeaStip, cmQ * uCmFleck.w + 0.5), 1.03 - 0.9 * cmE, cmAge);
        glow += min(mix(cmSide, cmTop, pow(abs(N.y), 3.0)) * uCmSkin.x, vec3(1.5)) * cmWet;                 // (never so bright that the bloom makes a lamp of it: marks, not a glow)
      }`,
  };
  const pod = await makeSwimmer(ctx, {
    species: 'dolphin', count: one ? 1 : D.count, ...(one ? { exact: true, stations: [one] } : { stations: ST }), wake: D.comet, stride: D.stride, tint: D.tint, seed: 5,
    // (the family's own lift toward where the eye would see it takes the water to stand at y = 0: on this 1.4 m swell a body 1.4 m
    // down, lifted to 0.4, stood clear of every trough as a dark dolphin lying on the sea. It is left out, and done in `skin` above)
    refract: params.has('crefract'),
    // a dark body, lit by nothing but the water it moves: the realm's key light is the sea's aqua, and through the family's thin
    // fins it lit the dorsal fin from within; with the light ramp on, the whole animal stood in the water as a pale teal ghost
    thin: 0, material: { shade: num('cshade', 0), brush: 0.3, extend: [skin] },
    sheath: { color: C.aqua, strength: 0, size: num('csize', D.sheath.size), share: num('cshare', D.sheath.share), stream: D.sheath.stream }, trace: null,      // (what they write on the water is written below, on the area's scale)
    onTouch: (x, z, kind, sw) => {
      if (kind !== 'blow') return;
      state.blows++; state.events.push([+ctx.time.toFixed(2), 'blow', sw.i, +x.toFixed(2), +z.toFixed(2)]);
      if (marksOn) { const l = D.line[0] / 2; seaLight.line(x - sw.dir.x * l, z - sw.dir.z * l, x + sw.dir.x * l, z + sw.dir.z * l, D.line[1], N.age.blow, 1); }
      if (comets.onBlow) comets.onBlow(x, z, sw);
    },
  });
  // the light on its skin, in the area's own marks: the comma dabs and dashes every light here is broken by (the same coding as
  // the family's own mask: a mark's cover in green, its threshold times its cover in red), at the sheet's own size
  { const mu = pod.material && pod.material.uniforms; if (mu && mu.tSwimFleck && U.tSeaFleck && U.tSeaFleck.value) mu.tSwimFleck.value = U.tSeaFleck.value; }
  comets.pod = pod;
  const list = pod.swimmers, n = list.length, rnds = list.map((_, i) => ctx.rng(900 + i * 13));
  const odo = list.map(() => 0), was = list.map(() => new THREE.Vector3()), shown = list.map(() => 0), trip = list.map((_, i) => 97 * i);      // (trip: metres each has swum, for marks that keep their place in the water)
  const mark = list.map(() => ({ x: 0, z: 0, on: false }));      // where each last wrote on the water

  // ---- steering: every goal an animal makes for is led round the rocks, and while `own[i]` is set it is this module's
  // (ranging, leaving). The family keeps a swimmer's goal in sw.goal; if that ever changes, nothing here is installed,
  // the animals swim as the family alone has them, and leave() falls back on the family's own.
  const own = list.map(() => null), tmpG = { x: 0, z: 0 }, lv = list.map(() => null), rg = list.map(() => null);      // own: where it makes for; lv: its way out; rg: its place while it ranges
  let steered = true; const rule = list.map(() => 0), turnSide = list.map(() => 0), swing = list.map(() => null);      // (swing: it is coming round the long way: { side, until })
  const prof = { solve: 0, solves: 0, update: 0, frames: 0, obs: obs.length }, profOn = params.has('cprof');      // (&cprof=1 with &cplan=: milliseconds this module's own script took, in the dump)
  for (const sw of list) {
    const g = sw.goal;
    if (!g || typeof g !== 'object' || typeof g.x !== 'number' || typeof g.z !== 'number') { steered = false; continue; }
    let rx = g.x, rz = g.z, rs = g.speed || 0, fx = rx, fz = rz, dirty = true;
    const solve = () => {
      const t0 = profOn ? performance.now() : 0;
      const o = own[sw.i], hx = sw.head.x, hz = sw.head.z, dx = sw.dir.x, dz = sw.dir.z, dl = Math.hypot(dx, dz) || 1;
      around(hx, hz, o ? o.x : rx, o ? o.z : rz, tmpG); fx = tmpG.x; fz = tmpG.z; dirty = false;
      let why = Math.hypot(fx - (o ? o.x : rx), fz - (o ? o.z : rz)) > 0.05 ? 1 : 0;                      // (for the dump: which rule led it this frame)
      // and whatever its goal: an animal cannot turn tighter than its body bends (2.4 to 3.2 m), so rock straight ahead of it
      // within a few lengths turns it away at once, to the side the rock does not stand on (on a way out that was laid
      // through a gap and measured, only rock it would truly touch)
      const look = 4.5 + 0.6 * (sw.speed || 0), hit = lv[sw.i] ? crossed(hx, hz, hx + dx / dl * look, hz + dz / dl * look, 0.15) : ahead(hx, hz, hx + dx / dl * look, hz + dz / dl * look, D.clear);
      if (hit && lv[sw.i]) { const side = Math.sign(dx * (hit.z - hz) - dz * (hit.x - hx)) || 1, a = Math.atan2(dx, dz) + side * 1.25; fx = hx + Math.sin(a) * 4; fz = hz + Math.cos(a) * 4; why = 2; }
      else if (hit) {
        // It turns to whichever side has the clearer water (a little, more, or hard over: the least turn that is clear), and keeps to the side it chose.
        // (Turning away from the NEAREST rock, an animal that wheeled out of the shoal toward stacks 7 and 9, which stand as one wall, had one of them to
        // its left and the other to its right, turned from each in turn, and swam straight through the place where they touch)
        const cur = Math.atan2(dx, dz); let bestA = cur, bestS = -1e9, pickSide = 0;
        for (const sd of [1, -1]) for (const turn of [0.6, 1.2, 1.9]) {
          const a = cur + sd * turn, score = Math.min(clearOf(hx, hz, hx + Math.sin(a) * look, hz + Math.cos(a) * look), D.clear + 0.5) - 0.2 * turn + (sd === turnSide[sw.i] ? 0.5 : 0);
          if (score > bestS) { bestS = score; bestA = a; pickSide = sd; }
        }
        turnSide[sw.i] = pickSide; fx = hx + Math.sin(bestA) * 4; fz = hz + Math.cos(bestA) * 4; why = 2;
      } else {
        turnSide[sw.i] = 0;
        // (and it does not wheel INTO rock that stands beside it: turning for a place that lies behind a stack, an animal ranging round a still boat swept
        // 0.8 m inside the stack's circle, a stride from its columns. While rock stands on the side it would turn to, it holds its course until it is past)
        const cur = Math.atan2(dx, dz); let dd = Math.atan2(fx - hx, fz - hz) - cur; dd = Math.atan2(Math.sin(dd), Math.cos(dd));
        // (third holder. With rock on the side it would turn to it held its course, whatever lay ahead: an animal that came out of a crossing headed away from the
        // shoal when the hunt began, the gate's jamb on the side it would have turned, ran straight on for a second at six metres a second and rounded off 1.7 m
        // from the tall pipe. Now, when what it makes for lies behind it and the other side is clear water, it comes round the other way, and keeps to that)
        const sg = swing[sw.i];
        if (sg && (ctx.time > sg.until || Math.abs(dd) < 0.6 || lv[sw.i])) swing[sw.i] = null;
        if (swing[sw.i]) { const a2 = cur + swing[sw.i].side * 0.8; fx = hx + Math.sin(a2) * 4; fz = hz + Math.cos(a2) * 4; why = 6; }
        else if (Math.abs(dd) > 0.25) for (const f of [0.5, 1]) {
          const a2 = cur + Math.sign(dd) * Math.min(Math.abs(dd), 0.75) * f;
          if (!lv[sw.i] && ahead(hx, hz, hx + Math.sin(a2) * look * 0.85, hz + Math.cos(a2) * look * 0.85, D.clear * 0.8)) {
            const other = -Math.sign(dd), b1 = cur + other * 0.4, b2 = cur + other * 0.8;
            if (Math.abs(dd) > 1.5 && !ahead(hx, hz, hx + Math.sin(b1) * look * 0.85, hz + Math.cos(b1) * look * 0.85, D.clear * 0.8) && !ahead(hx, hz, hx + Math.sin(b2) * look * 0.85, hz + Math.cos(b2) * look * 0.85, D.clear * 0.8)) {
              swing[sw.i] = { side: other, until: ctx.time + 1.6 }; fx = hx + Math.sin(b2) * 4; fz = hz + Math.cos(b2) * 4; why = 6;
            } else { fx = hx + dx / dl * 5; fz = hz + dz / dl * 5; why = 3; }
            break;
          }
        }
      }
      // and should it ever find itself within a rock's own circle: straight out of it, before anything else
      let deep = lv[sw.i] ? 0.25 : 0.7, inC = null; for (const q of obs) { const g = Math.hypot(hx - q.x, hz - q.z) - q.r; if (g < deep) { deep = g; inC = q; } }
      if (inC) { const ox = hx - inC.x, oz = hz - inC.z, ol = Math.hypot(ox, oz) || 1; fx = hx + ox / ol * 4 + dx / dl; fz = hz + oz / ol * 4 + dz / dl; why = 4; }
      // (unless it is leaving by a measured way, it makes for the middle of the channel instead, which is always clear water: between two rocks that touch,
      // the way out of one circle is the way into the other)
      if (inC && !lv[sw.i]) { midOf(hx, hz, nearMid); fx = nearMid.x; fz = nearMid.z; why = 5; }
      rule[sw.i] = why;
      if (profOn) { prof.solve += performance.now() - t0; prof.solves++; }
    };
    Object.defineProperty(g, 'x', { get() { if (dirty) solve(); return fx; }, set(v) { rx = v; dirty = true; }, enumerable: true, configurable: true });
    Object.defineProperty(g, 'z', { get() { if (dirty) solve(); return fz; }, set(v) { rz = v; dirty = true; }, enumerable: true, configurable: true });
    // (and it slows where it steers round rock: at six metres a second it cannot turn in less than five, and the water between two stacks is twelve)
    Object.defineProperty(g, 'speed', { get() { const o = own[sw.i], v = o ? o.speed : rs; return rule[sw.i] >= 2 && rule[sw.i] !== 6 && !lv[sw.i] ? Math.min(v, D.tight) : v; }, set(v) { rs = v; }, enumerable: true, configurable: true });
    // the depth it holds is a depth under the water where it IS: it rides the swell
    let ry = typeof g.y === 'number' ? g.y : -1.5;
    Object.defineProperty(g, 'y', { get() { return ry + D.ride * ctx.water.heightAt(sw.head.x, sw.head.z); }, set(v) { ry = v; }, enumerable: true, configurable: true });
  }
  if (!steered) console.warn('sea/cast: the swimmers family no longer keeps a goal this module can lead round the rocks: the dolphins swim as the family has them');

  // ---- the ways out. A gap between two of the kit's stacks: its middle, the way out through it (away from the route),
  // and the way down the route along the line of the two rocks
  const stackN = (k) => ((shared.rocks && shared.rocks.stacks) || []).find((q) => q.n === k);
  const edgeOf = (q, ux, uz) => { const a = ux * q.tx + uz * q.tz, b = -ux * q.tz + uz * q.tx, r = 1 / Math.sqrt((a / q.A) ** 2 + (b / q.B) ** 2); return [q.x + ux * r, q.z + uz * r]; };
  const gapBetween = (k0, k1) => {
    const a = stackN(k0), b = stackN(k1); if (!a || !b) return null;
    let ux = b.x - a.x, uz = b.z - a.z; const l = Math.hypot(ux, uz) || 1; ux /= l; uz /= l;
    const e0 = edgeOf(a, ux, uz), e1 = edgeOf(b, -ux, -uz), x = (e0[0] + e1[0]) / 2, z = (e0[1] + e1[1]) / 2, c = ctx.path.at(a.s, {});
    let wx = -uz, wz = ux; if (Math.hypot(x + wx - c.x, z + wz - c.z) < Math.hypot(x - wx - c.x, z - wz - c.z)) { wx = -wx; wz = -wz; }
    return { x, z, wx, wz, ux, uz, width: Math.hypot(e1[0] - e0[0], e1[1] - e0[1]) };
  };
  // [metres out through the gap, metres down the route] from the gap's middle: in from the channel, through, and out to the open sea on the left
  const WAYS = {
    A: { gap: gapBetween(6, 10), pts: [[-6.5, 0], [0, 0], [8, 0], [16.5, -6], [32, -13], [58, -23]] },      // between the tall pipe and the left shoulder (5 m of water), then up-route of stack 8. (It is entered 6.5 m out in the channel: 9 m out stands the first of the circles that close the gate's left jamb, below)
    B: { gap: gapBetween(2, 6), pts: [[-10, 0], [0, 0], [10, 0], [24, 4], [45, 8], [70, 10]] },           // between the gatepost and the tall pipe (13 m), then down-route of the stump
  };
  for (const k of Object.keys(WAYS)) {
    const w = WAYS[k], g = w.gap;
    if (!g) { w.line = null; continue; }
    w.line = w.pts.map(([o, d]) => [g.x + g.wx * o + g.ux * d, g.z + g.wz * o + g.uz * d]);
    let least = 1e9; for (let i = 0; i < w.line.length - 1; i++) for (let f = 0; f <= 1; f += 0.1) least = Math.min(least, gapOf(lerp(w.line[i][0], w.line[i + 1][0], f), lerp(w.line[i][1], w.line[i + 1][1], f)));
    w.least = least;
    if (least < 0.7) console.error(`INVALID_STAGING sea/comets: the dolphins' way out ${k} passes ${least.toFixed(2)} m from rock (the kit's stacks have moved?): it is not used`), w.line = null;
  }

  // ---- the moments
  /** They come (moment 2): from 60 m, three from the left quarter, two from the right, two from ahead out of the gate's mouth. */
  const arrive = comets.arrive = () => {
    if (state.gone || state.arrived) return comets;
    const boat = ctx.boat, h = boat.heading, fx = -Math.sin(h), fz = -Math.cos(h), rx = Math.cos(h), rz = -Math.sin(h), A = D.arrive;
    pod.arrive({ distance: A.distance, seconds: A.seconds });
    for (const sw of list) {
      if (!sw.active) continue;
      const ax = (sw.head.x - boat.x) * fx + (sw.head.z - boat.z) * fz, lat = (sw.head.x - boat.x) * rx + (sw.head.z - boat.z) * rz;
      if (ax > 0.34 * Math.hypot(ax, lat)) {                // put ahead of the beam: there the pipes and the gate stand. It comes out of the gate's mouth instead, on its own side
        const side = lat >= 0 ? 1 : -1, q = kit.at(Math.min(P.length - 40, ctx.s + A.mouth), side * A.abeam);
        const aimX = boat.x + rx * side * 11 + fx * (boat.speed * 5 - 2), aimZ = boat.z + rz * side * 11 + fz * (boat.speed * 5 - 2);
        if (typeof sw.put === 'function' && gapOf(q.x, q.z) > 1.5) sw.put(q.x, sw.head.y, q.z, Math.atan2(aimX - q.x, aimZ - q.z)); else pod.hide(sw.i);
      } else if (gapOf(sw.head.x, sw.head.z) < 1) pod.hide(sw.i);      // (never begun inside rock)
      else if (typeof sw.put === 'function') {
        // from astern: strung out. (The family sets them all off at one distance and one speed: three ticks of one length and one slant, switched on together)
        const rnd = rnds[sw.i], d0 = Math.hypot(sw.head.x - boat.x, sw.head.z - boat.z) || 1, bx = (sw.head.x - boat.x) / d0, bz = (sw.head.z - boat.z) / d0;
        const d1 = d0 * lerp(A.strung[0], A.strung[1], rnd()), secs = A.seconds * (0.8 + 0.28 * rnd()), x = boat.x + bx * d1, z = boat.z + bz * d1;
        if (gapOf(x, z) > 1.5) {
          const v = Math.min(12, Math.max(3.5, d1 / secs - (boat.speed || 0) * (bx * fx + bz * fz)));      // (it must also overhaul the boat: the family's own rule)
          sw.put(x, sw.head.y, z, Math.atan2(boat.x - x, boat.z - z)); sw.speed = v; if (sw.state) sw.state.rush = v;
        }
      }
      was[sw.i].copy(sw.head); odo[sw.i] = 0; mark[sw.i].on = false; shown[sw.i] = 0;
    }
    state.arrived = true; state.t0 = ctx.time; state.events.push([+ctx.time.toFixed(2), 'arrive']); crossAt = ctx.time + D.cross.first;
    if (params.has('crollat')) list.forEach((sw, i) => { if (sw.state) sw.state.nextRoll = num('crollat', 12) + i * 1.7; });      // (for looking only)
    return comets;
  };
  /** They drive at a place and wheel through it (moment 4: shoal 1), then go. o: { at: [x, z], depth, seconds } */
  const hunt = comets.hunt = (o = {}) => {
    if (state.gone || !state.arrived || state.leaving || state.hunting) return comets;      // (once: a hunt that is on is not begun again, so staging may call it before the cue at s 68 does)
    const p = o.at ? { x: o.at[0], z: o.at[1] } : kit.at(D.hunt.at[0], D.hunt.at[1]), secs = o.seconds ?? D.hunt.seconds;
    for (let i = 0; i < n; i++) { own[i] = null; rg[i] = null; }
    pod.hunt({ at: [p.x, p.z], depth: o.depth ?? D.hunt.depth, seconds: secs });
    state.hunting = { x: p.x, z: p.z, until: ctx.time + secs }; state.struck = false; state.events.push([+ctx.time.toFixed(2), 'hunt']);
    return comets;
  };
  /** They go, for good: through the nearest real opening to the open sea on the left, in a file; each is taken out 55 m off or once it is behind rock. */
  const leave = comets.leave = () => {
    if (state.gone || !state.arrived || state.leaving) return comets;
    const boat = ctx.boat, t = ctx.time, s = ctx.s, L = D.leave;
    state.leaving = true; state.hunting = null; state.events.push([+t.toFixed(2), 'leave']);
    if (!steered) { const q = kit.at(Math.max(0, s - 45), -4); pod.leave({ toward: [q.x, q.z] }); return comets; }
    if (pod.mode === 'hunt' || pod.mode === 'range') pod.escort();
    const way = s >= 64 && WAYS.A.line ? WAYS.A : s >= 44 && WAYS.B.line ? WAYS.B : null;
    // the nearest to the way out goes first
    const order = list.filter((sw) => sw.active).sort((a, b) => (way ? Math.hypot(a.head.x - way.line[0][0], a.head.z - way.line[0][1]) - Math.hypot(b.head.x - way.line[0][0], b.head.z - way.line[0][1]) : a.i - b.i));
    order.forEach((sw, k) => {
      const i = sw.i, rnd = rnds[i], off = (k % 2 ? 1 : -1) * (0.25 + 0.3 * Math.floor((k + 1) / 2));
      let pts;
      if (way) {
        const g = way.gap; pts = way.line.map(([x, z], j) => { const wide = j <= 2 ? 1 : 1 + (j - 2) * 2.2; return [x + g.ux * off * wide, z + g.uz * off * wide]; });
      } else {                                              // open water (the black reach): out over the quarter it came by
        const h = boat.heading, side = ((sw.head.x - boat.x) * Math.cos(h) - (sw.head.z - boat.z) * Math.sin(h)) >= 0 ? 1 : -1, a = h + Math.PI - side * (2.0 + 0.5 * rnd());
        pts = [[boat.x + Math.sin(a) * 28, boat.z + Math.cos(a) * 28], [boat.x + Math.sin(a) * 75, boat.z + Math.cos(a) * 75]];
      }
      lv[i] = { pts, k: 0, at: t + k * L.file * (0.8 + 0.4 * rnd()), speed: lerp(L.speed[0], L.speed[1], rnd()) * (stage.calm ? 0.85 : 1), hid: 0 };      // (reduced motion: as the family calms its own speeds)
    });
    return comets;
  };
  /**
   * Two of them change places, crossing under or ahead of the stem in an X. pair: two of the seven stations (default: the
   * next pair of the weave whose two places are both held). The first sets off at once, the other a moment later (never two
   * on one beat). Returns true when a crossing began.
   */
  let crossN = 0, crossAt = 1e9, pend = null;
  const held = (k) => {                                     // is somebody on station k (within two metres of it)?
    const boat = ctx.boat, h = boat.heading, fx = -Math.sin(h), fz = -Math.cos(h), rx = Math.cos(h), rz = -Math.sin(h), q = ST[k];
    const x = boat.x + fx * (2.4 + q[0]) + rx * q[1], z = boat.z + fz * (2.4 + q[0]) + rz * q[1];
    for (const sw of list) if (sw.active && Math.hypot(sw.head.x - x, sw.head.z - z) < 2) return true;
    return false;
  };
  const cross = comets.cross = (pair) => {
    if (one || pend || !state.arrived || state.leaving || state.hunting || pod.mode !== 'escort') return false;
    let pick = pair && held(pair[0]) && held(pair[1]) ? pair : null;
    for (let k = 0; !pick && !pair && k < D.cross.pairs.length; k++) { const q = D.cross.pairs[(crossN + k) % D.cross.pairs.length]; if (held(q[0]) && held(q[1])) { pick = q; crossN += k + 1; } }
    if (!pick) return false;
    const a = ST[pick[0]], b = ST[pick[1]], was0 = a.slice();
    a[0] = b[0]; a[1] = b[1]; a[2] = b[2];
    pend = { at: ctx.time + 0.4 + 0.7 * rnds[1 % n](), q: b, to: was0 };
    state.events.push([+ctx.time.toFixed(2), 'cross', pick[0], pick[1]]);
    return true;
  };
  stage.cue('comets', { s: D.arrive.s, settle() { state.begun = true; } }, () => { state.begun = true; });
  stage.cue('firework', { s: D.hunt.s, settle() {} }, () => { if (comets.auto) hunt(); });

  // ---------------------------------------------------------------------------------------------- the comets
  // Three seconds of each snout's track, drawn as the sheet draws the hull's road, in small: the area's own marks, laid
  // on the water's own grid (they stay where the water was stirred while the animal goes on), a glitter of specks dense
  // in the dabs over a soft body of old light, aqua at the head and ember toward the tail, each mark going out through
  // ember and violet. It is drawn after the water (this water lets nothing under it be seen beyond 15 m, and the comets
  // are how the dolphins are seen coming from 60 m), where the eye would see light that lies at the depth the animal
  // swam at (`seen`: raised toward the surface as the body is). Far off, where a strip lying in the water is thinner
  // than the screen can draw, its edges are parted by a pixel or so and it becomes a broken streak with the sheet's own
  // far points on it: knots of light a few strides long, never a ruled line.
  // (Rows along each strip: first the body, at fixed places from the snout to the flukes, laid along the line the snout drew, which the body follows exactly; then the
  // wake, one row where the flukes are now and one for every older point of the track.)
  const WK = list[0] && list[0].wake ? list[0].wake.length / 4 : 0, SH = D.shape, NB = SH.at.length, ROWS = NB + WK + 1;
  const TX = new Float32Array(WK + 2), TY = new Float32Array(WK + 2), TZ = new Float32Array(WK + 2), TU = new Float32Array(WK + 2), TA = new Float32Array(WK + 2);      // one animal's track: where, how far along it, how old
  let tail = null;
  if (WK) {
    const geo = new THREE.BufferGeometry(), idx = [];
    const pos = new THREE.BufferAttribute(new Float32Array(n * ROWS * 2 * 3), 3), lit = new THREE.BufferAttribute(new Float32Array(n * ROWS * 2 * 4), 4);
    const acr = new THREE.BufferAttribute(new Float32Array(n * ROWS * 2 * 2), 2);      // the way across the strip there (level)
    const part = new THREE.BufferAttribute(new Float32Array(n * ROWS * 2 * 2), 2);     // x: where on the comet (0 the snout .. 1 the flukes; 1 .. 2 down the wake to its end); y: how bright against the body's own light
    pos.setUsage(THREE.DynamicDrawUsage); lit.setUsage(THREE.DynamicDrawUsage); acr.setUsage(THREE.DynamicDrawUsage); part.setUsage(THREE.DynamicDrawUsage);
    for (let i = 0; i < n; i++) for (let k = 0; k < ROWS - 1; k++) { const a = (i * ROWS + k) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    geo.setAttribute('position', pos); geo.setAttribute('aLit', lit); geo.setAttribute('aAcross', acr); geo.setAttribute('aPart', part); geo.setIndex(idx);
    const F = P.seaLight.fleck, uni = {
      uSwell: U.uSwell, uSeaOmega: U.uSeaOmega, uSeaFront: U.uSeaFront, uSeaL: U.uSeaL, uSeaLee: U.uSeaLee,
      tSeaFleck: U.tSeaFleck, tSeaStip: U.tSeaStip, uSeaAqua: U.uSeaAqua, uSeaEmber: U.uSeaEmber, uSeaCore: U.uSeaCore, uSeaDying: U.uSeaDying,
      uFleck: { value: new THREE.Vector4(F[0], F[1], F[2], F[3] ?? 0.75) }, uTime: S.uTime, uGain: { value: 0 }, uPixel: { value: 0.0012 }, uDeep: { value: D.tail.deep },
      uFar: { value: num('cfar', D.tail.far) }, uStroke: { value: D.tail.stroke }, uSnout: { value: num('csnout', D.tail.snout) }, uHeadFar: { value: num('cheadfar', D.tail.headFar) },
      uFogColor: S.uFogColor, uFogDensity: S.uFogDensity, uVeil: S.uVeil, uVeilColor: S.uVeilColor,
    };
    const mat = new THREE.ShaderMaterial({
      uniforms: uni, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
      vertexShader: /* glsl */`${FOG_PARS}
        attribute vec4 aLit; attribute vec2 aAcross, aPart; uniform float uPixel, uDeep;      // how lit (above 1: the head); -1 / +1: its two edges; how deep the light truly lies; metres along the animal's own way
        varying vec3 vWorld; varying vec2 vA, vP; varying float vFogDist, vDeep, vFar, vU;
        void main() {
          vec4 w = modelMatrix * vec4(position, 1.0);
          vWorld = w.xyz; vA = aLit.xy; vP = aPart; vDeep = exp(-max(aLit.z, 0.0) / uDeep);   // (aLit.z: how deep the light truly lies; the strip itself is drawn where the eye sees it)
          float dist = length((viewMatrix * w).xyz);
          vFar = smoothstep(16.0, 34.0, dist); vU = aLit.w;                      // (nearer than this its marks can be told apart: drawn as dashes there, a comet a dozen metres off was a string of beads)
          // far off its two edges are parted, so that it is never thinner than the screen can draw: the tail a few pixels, the head (the animal itself,
          // a body with depth, where the tail is a film of stirred water) a knot two and a half times that: a comet seen coming is a point of light with a line behind it
          // (only as far as it is seen ACROSS: a comet that comes straight at the eye has its two edges side by side on the screen already, and parted
          // up and down it was a slanting tick, a little bird on the horizon)
          vec2 toEye = w.xz - cameraPosition.xz; float seenAcross = abs(dot(aAcross, toEye)) / max(length(aAcross) * length(toEye), 1e-4);
          w.y += aLit.y * uPixel * dist * vFar * smoothstep(0.35, 0.9, seenAcross) * (1.0 + 3.0 * max(aLit.x - 1.0, 0.0));
          // (third holder: and a comet that comes at the eye, or goes from it, has its head drawn out a few pixels along its own length instead: snout and flukes
          // parted, not its two edges. Flat on the water thirty metres off the animal was two pixels deep: a comet seen coming was a scratch with no head)
          w.y += (clamp(aPart.x, 0.0, 1.0) - 0.5) * sign(dot(aAcross, vec2(toEye.y, -toEye.x))) * uPixel * dist * vFar * (1.0 - smoothstep(0.35, 0.9, seenAcross)) * 1.7;
          vec4 mv = viewMatrix * w; vFogDist = fogDistance(mv);
          // (It is drawn a little nearer the eye than it lies: a foot or so while the animal is under water, a stride far off. The dark body it clothes
          // stood in front of its own light: seen low across the water, a ring of marks round a dark middle; far off, a hollow lozenge. Not where the strip
          // lies at the waterline round a back that is out: there the body must hide it, or the back would wear its marks in the air)
          mv.xyz *= 1.0 - max(vFar * min(0.7 / max(dist, 1.0), 0.2), 0.35 * smoothstep(0.15, 0.6, aLit.z) / max(dist, 2.0));
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */`${SEA_GLSL} ${FOG_PARS}
        uniform sampler2D tSeaFleck, tSeaStip; uniform vec3 uSeaAqua, uSeaEmber, uSeaCore, uSeaDying; uniform vec4 uFleck; uniform float uTime, uGain, uFar, uStroke, uSnout, uHeadFar;
        varying vec3 vWorld; varying vec2 vA, vP; varying float vFogDist, vDeep, vFar, vU;
        // (the sheet's own way with a mark: SEA_INK in light.js, which is not exported: the same four lines)
        vec3 seaMark(sampler2D t, vec2 uv) { vec4 m = texture2D(t, uv); float c = max(m.g, 0.004); return vec3(m.g, m.r / c, m.b / c); }
        float seaLit(vec3 m, float cut) { return m.x * smoothstep(cut, cut + 0.14, m.y); }
        vec3 seaAged(float a) { return seaAge(a, uSeaCore, uSeaAqua, uSeaEmber, uSeaDying); }
        vec3 seaInk(vec3 m, float cut, float a) { float mg = m.y - cut; return seaAged(a * (0.1 + 0.9 * smoothstep(0.02, 0.38, mg))) * (m.x * smoothstep(0.0, 0.14, mg)); }
        void main() {
          vec2 p = vWorld.xz;
          float softB = texture2D(tSeaFleck, p * uFleck.z + 0.71, 4.0).g + 0.5 * texture2D(tSeaFleck, p.yx * uFleck.y + 0.37, 4.5).g;
          // how lit: most at the head, thinning all the way down the tail (lit evenly for two seconds, a comet thirty metres long behind an
          // animal at its run-in was a ruled line of light on the sea); fullest along its middle; ragged
          float head = max(vA.x - 1.0, 0.0), young = min(vA.x, 1.0);
          float onBody = 1.0 - step(1.0, vP.x), down = clamp(vP.x - 1.0, 0.0, 1.0);                 // on the animal; how far down its wake (0 at the flukes .. 1 where it ends)
          // the strokes of its flukes stand in its wake as knots, each in its own place in the water (a wake of one even glitter was a ribbon laid on the sea)
          float stroke = mix(1.0, 0.9 + 0.2 * cos(6.2832 * vU / uStroke), (1.0 - onBody) * smoothstep(0.0, 0.15, down));      // (gently: struck harder, the wake was a row of separate puffs, beads again)
          float E = clamp(pow(young, 0.85) * (1.0 - vA.y * vA.y) * (0.8 + 0.45 * softB + 0.9 * head) * stroke, 0.0, 1.0);
          // the sheet's fine dabs, twice over (a tail is a narrow thing: the same marks, more of them), and its stipple between them
          vec3 m1 = seaMark(tSeaFleck, p * uFleck.x), m2 = seaMark(tSeaFleck, p.yx * uFleck.x + 0.37);
          vec3 st = seaMark(tSeaStip, p * uFleck.w), st2 = seaMark(tSeaStip, p.yx * uFleck.w * 0.37 + 0.5);
          float tw = 0.6 + 0.4 * sin(uTime * (1.3 + 3.2 * st.z) + st.z * 47.0), tw2 = 0.7 + 0.3 * sin(uTime * (0.9 + 2.0 * st2.z) + st2.z * 31.0);
          float aE = min(0.15 + 0.6 * young + 0.5 * head, 0.9);                                                      // new light at the head (aqua; the snout alone is core, in specks, below), ember from the flukes back, violet as it goes out
          float c1 = 1.06 - E * 0.9, c2 = 1.1 - E * 0.88;
          float dens = clamp(E * (0.42 + 1.2 * seaLit(m1, c1) + 1.0 * seaLit(m2, c2) + 1.6 * softB), 0.0, 1.0);
          vec3 col = seaInk(m1, c1, aE) + seaInk(m2, c2, aE) * 0.85
                   + (seaInk(st, 1.03 - 0.95 * dens, aE) * tw + 0.8 * seaInk(st2, 1.08 - 0.92 * dens, aE) * tw2) * (0.7 + 1.2 * E)
                   + seaAged(clamp(aE * 0.6, 0.0, 0.4)) * (softB * E * 0.4);                              // (the soft body of old light under the marks, as the sheet's road has it)
          // the snout: the water it parts is new this instant, white-hot in specks, as the hull's own churn is in the sheet (core, the page's first half second of any touch):
          // the point of light a comet is led by
          float snout = onBody * (1.0 - smoothstep(0.02, 0.2, vP.x)) * (1.0 - vA.y * vA.y);
          col += uSeaCore * (uSnout * snout * (1.3 * seaLit(st, 0.35) * tw + 1.0 * seaLit(st2, 0.4) * tw2 + 0.35 * seaLit(m1, 0.55)));      // (specks and a few small dabs: with every mark of it white the snout was a bead in a halo, a headlamp)
          // Seen so low across the water that its marks are thinner than a pixel one way (from about ten metres): the sheet's own far points, which come and
          // go, about as many near as far, over what is left of the marks' own light in knots a few strides long (never an even band)
          vec2 fa = dFdx(p), fb = dFdy(p); float px = max(length(fa), length(fb)), farPx = smoothstep(0.05, 0.26, px);
          float det = fa.x * fb.y - fa.y * fb.x; mat2 toPx = mat2(fb.y, -fa.y, -fb.x, fa.x) / (abs(det) > 1e-12 ? det : 1e-12);
          float knots = smoothstep(0.22, 0.75, softB + 0.35 * head), mid = 1.0 - vA.y * vA.y;
          col = mix(col, seaAged(aE) * (1.9 * seaSparks(p, toPx, px, clamp(E * 0.9, 0.0, 0.7), 7.0, uTime) + 0.4 * E * (0.15 + 0.85 * knots)), farPx);
          // Far off (a strip whose edges had to be parted to be drawn at all): dashes lying along its own length, each a stride or so of stirred water in
          // its own place in the sea (they do not travel with the animal), some lit and some not, most of them short, more of them toward the head, each
          // glittering in its own time: the sheet's way with far light. And the head: one knot of new light.
          // (Evenly laid they were a ruled dashed line; nearer than this, a string of beads)
          float uu = vU + 0.9 * sin(vU * 0.53) + 0.5 * sin(vU * 1.31 + 1.7);
          float cu = uu / 0.8, ci = floor(cu), cf = cu - ci, h1 = seaHash1(vec2(ci, 3.0)), h2 = seaHash1(vec2(ci + 31.7, 11.0)), dl = 0.22 + 0.7 * h2 * h2;
          float dash = step(h1, 0.1 + 0.9 * E * E) * smoothstep(0.0, 0.1, cf) * (1.0 - smoothstep(dl, dl + 0.12, cf)) * (0.45 + 0.55 * fract(h1 * 7.3 + h2)) * (0.65 + 0.35 * sin(uTime * (1.2 + 2.6 * h2) + 40.0 * h1));
          dash = mix(dash, 0.4 * (0.1 + 0.9 * E * E), smoothstep(0.3, 0.9, fwidth(vU)));      // (a comet seen end-on: its dashes are thinner than a pixel, and what is left is their mean)
          // (the head itself: a handful of short marks in three lanes, some lit, glittering: filled in one colour it was a shard of glass on the sea)
          vec2 hc = vec2(floor(vU / 0.34), floor(vA.y * 1.5 + 1.5)); float hh = seaHash1(hc + 17.0), hk = seaHash1(hc.yx * 3.1 + 5.0);
          float knot = step(hh, 0.62) * (0.5 + 0.5 * sin(uTime * (1.5 + 3.0 * hk) + 31.0 * hh)) * smoothstep(0.0, 0.2, fract(vU / 0.34)) * (1.0 - smoothstep(0.55 + 0.4 * hk, 1.0, fract(vU / 0.34)));
          col = mix(col, seaAged(aE) * (uFar * (0.4 + 1.0 * E) * dash * mid) + seaAged(0.86) * (uFar * uHeadFar * head * mid * (0.3 + 2.2 * knot)), vFar);      // (uHeadFar: the animal itself is the brightest of a comet seen coming, a knot of light with a line behind it; at the same strength as its tail it was a scratch on the sea)
          if (E < 0.003) col = vec3(0.0);
          // (the wake is fainter than the animal, and fainter the further down it: near the eye, where its marks can be told apart. Far off it is the comet's whole light, as tuned)
          gl_FragColor = vec4(min(col * (uGain * mix(vP.y, 1.0, vFar)), vec3(1.7)) * (vDeep * (1.0 - fogAmount(vFogDist)) * (1.0 - uVeil)), 1.0);      // (capped: where its marks crowd, at the snout, the bloom made a lamp of it)
        }`,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = 'sea-comets'; mesh.frustumCulled = false; mesh.renderOrder = 1;          // after the water (-1) and the sheet of its light (0)
    const size2 = new THREE.Vector2();
    mesh.onBeforeRender = (renderer, scene, camera) => { const rt = renderer.getRenderTarget(), hgt = rt ? rt.height : renderer.getDrawingBufferSize(size2).y; uni.uPixel.value = 2 * num('cpx', D.tail.pixels) / (camera.projectionMatrix.elements[5] * Math.max(1, hgt)); mat.uniformsNeedUpdate = true; };
    ctx.add(mesh); ctx.only(mesh, 'direct');
    tail = { mesh, pos, lit, acr, part, uni };
  }
  comets.tail = tail ? tail.mesh : null;

  // ---- for looking: every frame of the boat and of every dolphin, and the rocks, to .shots/<name>
  const dump = params.get('cplan'), dumpAt = num('clog', 20), rows = []; let dumped = false;
  const gainTail = num('cgain', D.tail.gain), gainSkin = num('csheath', D.skin.strength), hide = (params.get('chide') || '').split(',');      // (&chide=tail,body,sparks: leave a part undrawn, for measuring)

  return {
    update(dt, c) {
      const tp0 = profOn ? performance.now() : 0;
      const s = c.s, boat = c.boat, a = answer(), t = c.time, L = D.leave;
      const h = boat.heading, fx = -Math.sin(h), fz = -Math.cos(h);
      seaLight.frame = seaLight.written; seaLight.written = 0;
      // ---- sparks: from s 26, while the sea answers
      sparkOn = s >= SP.from ? 1 : 0;
      sparks.object.visible = sparkOn > 0.5 && a > 0.02 && !hide.includes('sparks');
      if (hide.includes('body') && pod.object) pod.object.visible = false;
      if (sparkGlow) sparkGlow.copy(sparkGlow0).multiplyScalar(a * cast.sparks.gain);
      // ---- the dolphins' moments, by where the boat is
      if (comets.auto && !state.gone) {
        if (state.begun && !state.arrived && s >= D.arrive.s - 3 && s < D.arrive.until && (boat.speed > D.arrive.moving || params.has('cforce')) && a > 0.5) arrive();
        if (state.arrived && !state.leaving && !state.hunting && s >= L.s) leave();
        if (state.arrived && !state.leaving && s >= L.gone) leave();
      }
      if (state.hunting && t >= state.hunting.until && !state.leaving) { if (comets.auto) leave(); else state.hunting = null; }
      // ---- the weave: every few seconds two of them change places under the stem
      if (pend && t >= pend.at) { pend.q[0] = pend.to[0]; pend.q[1] = pend.to[1]; pend.q[2] = pend.to[2]; pend = null; }
      if (comets.auto && t >= crossAt && state.arrived && !state.leaving) crossAt = t + (cross() ? lerp(D.cross.every[0], D.cross.every[1], rnds[0]()) : 0.7);      // (nobody on station yet: asked again in a moment)
      if (params.has('ccross') && t >= num('ccross', 1e9) && !state.crossed) state.crossed = cross([3, 4]);
      if (params.has('cleave') && t >= num('cleave', 1e9)) leave();       // (for looking: &cleave=12 they go 12 s in; &chunt=12 they hunt 12 s in, where the page has the shoal)
      if (params.has('cstop') && ctx.engine) ctx.engine.frozen = t >= num('cstop', 1e9) && !(t >= num('cgo', 1e9));      // (for looking, with &drift=1: the boat lies still from &cstop= seconds, and goes on at &cgo=)
      if (params.has('chunt') && t >= num('chunt', 1e9) && !state.hunted) { state.hunted = true; hunt(); }
      // ---- where each makes for, when that is this module's: leaving, or ranging round a boat that has stopped
      const ranging = steered && state.arrived && !state.leaving && pod.mode === 'range';
      let active = 0, best = -1e9, lead = null; const H = comets.heads;
      for (const sw of list) {
        const i = sw.i, q = i * 4;
        if (!sw.active) { H[q + 3] = 0; own[i] = null; shown[i] = Math.max(0, shown[i] - dt * 2); continue; }
        active++; shown[i] = Math.min(1, shown[i] + dt / D.arrive.fade);
        const hx = sw.head.x, hz = sw.head.z, far = Math.hypot(hx - boat.x, hz - boat.z);
        H[q] = hx; H[q + 1] = sw.head.y; H[q + 2] = hz; H[q + 3] = 1;
        const w = lv[i];
        if (w && t >= w.at) {
          let p = w.pts[Math.min(w.k, w.pts.length - 1)];
          if (w.k < w.pts.length && Math.hypot(hx - p[0], hz - p[1]) < 3.2) { w.k++; p = w.pts[Math.min(w.k, w.pts.length - 1)]; }
          if (w.k >= w.pts.length) { const b = w.pts[w.pts.length - 2] || [hx, hz], e = w.pts[w.pts.length - 1], l = Math.hypot(e[0] - b[0], e[1] - b[1]) || 1; p = [e[0] + (e[0] - b[0]) / l * 40, e[1] + (e[1] - b[1]) / l * 40]; }      // past the last: straight on
          own[i] = own[i] || { x: 0, z: 0, speed: 0 }; own[i].x = p[0]; own[i].z = p[1]; own[i].speed = w.speed;
          // it is taken out where nobody can see it go: far off, or when it and the whole of its comet have been behind rock for the comet's length
          const eye = S.uCameraPos.value; w.hid = crossed(eye.x, eye.z, hx, hz, -1.0) ? w.hid + dt : 0;
          if (far > L.far || (far > L.hidden[0] && w.hid > L.hidden[1])) { pod.hide(i); lv[i] = null; own[i] = null; state.events.push([+t.toFixed(2), 'out', i, +hx.toFixed(1), +hz.toFixed(1)]); }
        } else if (ranging) {
          let r = rg[i];
          if (!r || t > r.until || Math.hypot(hx - r.x, hz - r.z) < 3.2) {      // (it is there, or its time is up: on to the next place. It never circles one)
            const rnd = rnds[i], a0 = Math.atan2(hx - boat.x, hz - boat.z), turn = r && r.turn ? r.turn : (i % 2 ? 1 : -1); r = null;      // (on round the boat from where it is, the way it was going)
            for (let k = 0; k < 8 && !r; k++) {
              const way = turn * (k % 2 ? -1 : 1), an = a0 + (0.6 + 0.9 * rnd()) * way * (1 + 0.3 * (k >> 1)), rad = lerp(D.range.ring[0], D.range.ring[1], rnd()), x = boat.x + Math.sin(an) * rad, z = boat.z + Math.cos(an) * rad;
              // a place of clear water that it can reach without rock in the way and without passing close by the boat
              const vx = x - hx, vz = z - hz, tb = clamp01(((boat.x - hx) * vx + (boat.z - hz) * vz) / (vx * vx + vz * vz || 1)), near = Math.hypot(hx + vx * tb - boat.x, hz + vz * tb - boat.z);
              // (among the pipes: only places in the channel itself, short of the gate. One that ranged behind the stacks found a pocket between stack 10 and the gate's wall.
              // Third holder: I tried letting them out between the outer stacks up-route of the tall pipe, where the stacks stand alone: steering by a look ahead is not
              // safe there. With stack 3 ahead one turned away toward stack 1 and its turning circle carried it a metre inside that stack's circle, to its very columns:
              // sea_c3_p10_46.json. So they keep the channel, and among the pipes a boat that lies still has them hunting in it ahead and astern)
              if (gapOf(x, z) > 4 && !crossed(hx, hz, x, z, 2.2) && (near > 13.5 || tb < 0.05) && (s < 44 || (midOf(x, z, nearMid).off < nearMid.half - 1.5 && nearMid.s < 84))) r = { a: an, x, z, turn: way };
            }
            // no clear place from where it is (among the pipes, most of the ring round the boat is rock or lies behind rock): a place in the channel itself,
            // on the side of the boat it is on, across the channel's whole clear width and a good way from where it is now (in a box eight metres by twelve
            // five of them milled in one knot astern)
            if (!r) {
              const up = (hx - boat.x) * fx + (hz - boat.z) * fz > 0 ? 1 : -1; let p = null;
              for (let k = 0; k < 5; k++) {
                const sq = Math.min(83, Math.max(4, s + up * lerp(14, 26, rnd()))), q = kit.at(sq, (rnd() - 0.5) * 2 * Math.max(3, kit.halfWidth(sq) - 3.5));
                if (gapOf(q.x, q.z) < 3) continue;
                if (!p || Math.hypot(q.x - hx, q.z - hz) > Math.hypot(p.x - hx, p.z - hz)) p = q;
                if (Math.hypot(p.x - hx, p.z - hz) > 9) break;
              }
              if (!p) p = kit.at(Math.max(4, s + up * 18), 0);
              r = { a: a0, x: p.x, z: p.z, turn: -turn };
            }
            r.until = t + lerp(D.range.hold[0], D.range.hold[1], rnd()); r.speed = lerp(D.range.speed[0], D.range.speed[1], rnd()) * (stage.calm ? 0.85 : 1); rg[i] = r;
          }
          own[i] = own[i] || { x: 0, z: 0, speed: 0 }; own[i].x = r.x; own[i].z = r.z; own[i].speed = r.speed;
        } else if (!w) { own[i] = null; rg[i] = null; }
        const score = state.hunting ? -Math.hypot(hx - state.hunting.x, hz - state.hunting.z) : (hx - boat.x) * fx + (hz - boat.z) * fz;
        if (score > best) { best = score; lead = sw; }
        // ---- what it writes on the water: a dab for every half metre travelled while its back is shallow
        const moved = Math.hypot(hx - was[i].x, hz - was[i].z); was[i].copy(sw.head);
        if (moved < 3) { odo[i] += moved; trip[i] += moved; }
        if (marksOn && odo[i] >= D.step) {
          odo[i] = 0;
          const mk = sw.marks.dorsal || sw.head, depth = c.water.heightAt(mk.x, mk.z) - mk.y;      // the root of its fin under the water there
          // (a stroke from where the last one ended, not a dab: dabs half a metre apart stood on the water as a string of beads behind every animal)
          const m = mark[i], lit = depth < D.shallow, joined = m.on && lit && Math.hypot(mk.x - m.x, mk.z - m.z) < 2.5;
          const age = depth <= -0.1 ? N.age.back : lerp(N.age.trail[0], N.age.trail[1], clamp01(1 - depth / D.shallow));
          // (soft to its middle: with a hard core two cells wide the stroke showed the trace's own squares, a stair of bright bars where an animal had rolled beside the boat: sea_c3_q02_crop.png)
          if (joined) seaLight.line(m.x, m.z, mk.x, mk.z, depth <= -0.1 ? D.dab + 0.06 : D.dab, age, 1);
          m.x = mk.x; m.z = mk.z; m.on = lit;
        }
      }
      comets.leadOn = !!lead; if (lead) comets.lead.copy(lead.head);
      if (state.hunting && !state.struck && lead && -best < 3.2) { state.struck = true; state.events.push([+t.toFixed(2), 'strike']); if (comets.onStrike) comets.onStrike(state.hunting.x, state.hunting.z); }
      if (state.arrived && !state.gone && active === 0 && t - state.t0 > 2) { state.gone = true; state.leaving = true; state.events.push([+t.toFixed(2), 'gone']); if (comets.onGone) comets.onGone(); }
      // ---- their light, only while the sea answers: the light on the skin, and the comets
      pod.sheath.strength = 0; uSkin.value.x = gainSkin * a;
      if (tail) {
        const pos = tail.pos.array, lit = tail.lit.array, acr = tail.acr.array, part = tail.part.array, now = pod.time, life = D.comet, T = D.tail, Lb = pod.length, eye = S.uCameraPos.value;
        tail.uni.uGain.value = gainTail * a; tail.mesh.visible = a > 0.02 && (active > 0 || shown.some((v) => v > 0)) && !hide.includes('tail');
        if (tail.mesh.visible) {
          for (const sw of list) {
            const i = sw.i, wk = sw.wake, sn = sw.marks.snout || sw.head, on = shown[i], sc = sw.scale || 1, L = Lb * sc, base = i * ROWS;
            // ---- its track: the snout now, then where the snout was, newest first, for as far back as it runs unbroken. (The animal was put somewhere else at once,
            // or its track is not yet three seconds long: the track ends there, and so does the comet. As first written the strip ran on to the old place: from every
            // animal a hairline of light stood off toward the far corner of the sea for three seconds after it was put, and after its arrival)
            let np = 1; TX[0] = sn.x; TY[0] = sn.y; TZ[0] = sn.z; TU[0] = 0; TA[0] = 0;
            for (let k = 1; k <= WK; k++) {
              const j = (((sw.wakeAt - k) % WK) + WK) % WK, x = wk[j * 4], y = wk[j * 4 + 1], z = wk[j * 4 + 2], age = now - wk[j * 4 + 3], dl = Math.hypot(x - TX[np - 1], z - TZ[np - 1]);
              if (!(age >= 0) || age > life || dl > 6) break;
              if (dl < 0.18 && k < WK) continue;                // (points nearer than a hand and a half are left out: behind an animal that dawdled the rows lay 8 cm apart, each turned a little off the last, and the strip folded on itself like a paper fan: sea_c3_q02_crop.png)
              TX[np] = x; TY[np] = y; TZ[np] = z; TU[np] = TU[np - 1] + dl; TA[np] = age; np++;
            }
            // a place on the track, `d` metres behind the snout (beyond its end: straight on, as a body lies that has only just been put)
            let seg = 0, ax = 0, ay = 0, az = 0, adx = sw.dir.x, adz = sw.dir.z, aage = 0;
            const at = (d) => {
              while (seg < np - 2 && TU[seg + 1] < d) seg++;
              if (np < 2 || d >= TU[np - 1]) {
                const e = np - 1, over = d - TU[e]; let ux = sw.dir.x, uz = sw.dir.z;
                if (np > 1) { ux = TX[e - 1] - TX[e]; uz = TZ[e - 1] - TZ[e]; }
                const ul = Math.hypot(ux, uz) || 1; adx = ux / ul; adz = uz / ul; ax = TX[e] - adx * over; az = TZ[e] - adz * over; ay = TY[e]; aage = TA[e] + over / Math.max(sw.speed || 1, 0.8);
              } else {
                const f = (d - TU[seg]) / Math.max(TU[seg + 1] - TU[seg], 1e-4), ux = TX[seg] - TX[seg + 1], uz = TZ[seg] - TZ[seg + 1], ul = Math.hypot(ux, uz) || 1;
                adx = ux / ul; adz = uz / ul; ax = lerp(TX[seg], TX[seg + 1], f); ay = lerp(TY[seg], TY[seg + 1], f); az = lerp(TZ[seg], TZ[seg + 1], f); aage = lerp(TA[seg], TA[seg + 1], f);
              }
            };
            // one row of the strip: its middle, the way it runs, half its width, how lit, where on the comet, how bright
            const row = (r, x, y, z, dx, dz, half, level, lv, where, gain, u) => {
              const o3 = (base + r) * 6, o4 = (base + r) * 8, o2 = (base + r) * 4;
              const deep = level - y;                                                 // how deep the light truly lies; it is drawn where the eye sees it (as the body is: `skin`)
              // (always, as the body is: the second holder's rule left a row where it truly lay whenever the water over it stood higher than the eye, which on this swell is
              // every time the boat lies in a trough with a crest beyond. Then one row of a comet was drawn two metres down and the next a hand under the crest: a bar of
              // light standing in the sea from the boat to the horizon, with hairlines off its top: sea_c3_f06_crop.png)
              if (lifted) y = level - deep * seen(deep, Math.hypot(x - eye.x, z - eye.z), Math.max(eye.y - level, 0.3));
              pos[o3] = x - dz * half; pos[o3 + 1] = y; pos[o3 + 2] = z + dx * half; pos[o3 + 3] = x + dz * half; pos[o3 + 4] = y; pos[o3 + 5] = z - dx * half;
              acr[o2] = acr[o2 + 2] = -dz; acr[o2 + 1] = acr[o2 + 3] = dx;
              lit[o4] = lit[o4 + 4] = lv; lit[o4 + 1] = -1; lit[o4 + 5] = 1; lit[o4 + 2] = lit[o4 + 6] = deep; lit[o4 + 3] = lit[o4 + 7] = trip[i] - Math.min(u, 200);
              part[o2] = part[o2 + 2] = where; part[o2 + 1] = part[o2 + 3] = gain;
              return deep;
            };
            // ---- the body: the light lies on its back, in its own outline (the beak, the shoulders, the stock, the flukes), brightest at the snout
            for (let j = 0; j < NB; j++) {
              const f = SH.at[j]; at(f * L);
              const level = c.water.heightAt(ax, az), back = ay + SH.top[j] * sc + 0.04, y = Math.min(back, level - 0.04);      // never above the water it is in: round a back that is out, it lies at the waterline
              // (above 1: the head, brightest at the snout. Round a back that is out the strip lies at the waterline, where a glance draws it into one line: less of it there)
              const lv = (1 + T.head * (1 - f)) * on * (0.5 + 0.5 * clamp01((level - y - 0.04) / 0.36)) * (f > 0.92 ? 0.78 : 1);      // (the flukes are thin blades: lit like the trunk, they flashed at every stroke)
              // (and there it is the water the back parts, a skirt of broken light a hand and a half wider than the animal: drawn to the animal's own outline it was a thin
              // line of light round a dark back, an outline, which this place forbids)
              const out = clamp01((back - level + 0.04) / 0.15);
              row(j, ax, y, az, adx, adz, SH.half[j] * 1.25 * sc + T.hand + T.skirt * out, level, lv, Math.min(f, 0.999), 1, f * L);
            }
            // ---- the wake: from the flukes back along where the snout went, narrowing, cooling, going out; it ends where the track ends
            // (it lies as high over the snout's line as the light on the flukes does, all the way down: where it began a hand lower at the very place the body's light
            // ended, the two were joined by a little upright wall across the comet, on which the sheet's marks stood as the teeth of a comb: sea_c3_q07_crop.png)
            at(L); const ageL = aage, span = Math.max(life - ageL, 0.4), up = SH.top[NB - 1] * sc + 0.04;
            let r = NB, lx = ax, ly = ay + up, lz = az, ldx = adx, ldz = adz, ll = c.water.heightAt(ax, az), lu = L;
            row(r++, ax, Math.min(ly, ll - 0.04), az, adx, adz, T.half * sc, ll, T.fresh * on, 1, T.wake[0], L);
            for (let k = 1; k < np && r < ROWS; k++) {
              if (TU[k] <= L + 0.2) continue;
              const down = clamp01((TA[k] - ageL) / span), kn = Math.min(k + 1, np - 1), ux = TX[k - 1] - TX[kn], uz = TZ[k - 1] - TZ[kn], ul = Math.hypot(ux, uz) || 1;      // (the way it runs there: from the point before to the point after)
              lx = TX[k]; ly = TY[k] + up; lz = TZ[k]; ldx = ux / ul; ldz = uz / ul; ll = c.water.heightAt(lx, lz); lu = TU[k];
              // (the last point of a track that was cut short goes out too, so that the comet runs out to nothing and never ends square)
              row(r++, lx, Math.min(ly, ll - 0.04), lz, ldx, ldz, T.half * sc * (0.34 + 0.66 * (1 - down)), ll, k === np - 1 ? 0 : T.fresh * (1 - down) * on, 1 + down, lerp(T.wake[0], T.wake[1], down), lu);
            }
            for (; r < ROWS; r++) row(r, lx, Math.min(ly, ll - 0.04), lz, ldx, ldz, 0, ll, 0, 2, 0, lu);      // (rows the track did not reach lie on its last point, unlit)
          }
          tail.pos.needsUpdate = true; tail.lit.needsUpdate = true; tail.acr.needsUpdate = true; tail.part.needsUpdate = true;
        }
      }

      if (profOn) { prof.update += performance.now() - tp0; prof.frames++; }
      if (dump && !dumped) {
        rows.push([+t.toFixed(3), +boat.x.toFixed(2), +boat.z.toFixed(2), +boat.heading.toFixed(3), +boat.speed.toFixed(2), +s.toFixed(2), pod.mode,
          list.map((sw) => (sw.active ? [+sw.head.x.toFixed(2), +sw.head.y.toFixed(2), +sw.head.z.toFixed(2), +sw.speed.toFixed(2), sw.atSurface ? 1 : 0, +((sw.marks.dorsal || sw.head).y - c.water.heightAt(sw.head.x, sw.head.z)).toFixed(2), +gapOf(sw.head.x, sw.head.z).toFixed(2), own[sw.i] ? 1 : 0, rule[sw.i], +Math.atan2(sw.dir.x, sw.dir.z).toFixed(2)] : null))]);
        if (t >= dumpAt) {
          dumped = true;
          const path = []; for (let q = 0; q <= P.length; q += 2) { const p = c.path.at(q, {}); path.push([+p.x.toFixed(2), +p.z.toFixed(2), +p.halfWidth.toFixed(1)]); }
          const rocks = shared.rocks || {};
          fetch('/__shot/' + dump, { method: 'POST', body: JSON.stringify({ rows, events: state.events, path, steered, prof,
            ways: Object.fromEntries(Object.keys(WAYS).map((k) => [k, { line: WAYS[k].line, least: WAYS[k].least, width: WAYS[k].gap && WAYS[k].gap.width }])),
            colliders: (rocks.colliders || []).map((q) => [+q.x.toFixed(2), +q.z.toFixed(2), +q.r.toFixed(2)]), obs: obs.map((q) => [+q.x.toFixed(2), +q.z.toFixed(2), +q.r.toFixed(2)]),
            stacks: (rocks.stacks || []).map((q) => ({ n: q.n, x: q.x, z: q.z, tx: q.tx, tz: q.tz, A: q.A, B: q.B })) }) });
        }
      }
    },
  };
}
