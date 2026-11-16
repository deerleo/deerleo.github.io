// The town below: the cast, group "Small" (stage 3). docs/build/town/3-cast-small.md is this module's log.
//
//   motes          3,000 specks of silt under the water in a box that follows the boat: the body of the glass
//   bubble chains  thirteen chimney pots and the ridge of the first dormer; the fountain's plume, 17.5 m to its boil;
//                  a pool of spare beads for the cormorants' sheaths
//   sedge flies    3,243 pale caddis in seventeen low wheels, each over a light it cannot reach: the five lamp domes,
//                  three lancets on each flank of the church, five along the glass ridge, the loggia; and the dozen
//                  that come over to the prow lantern as it passes a lit wheel
// All three are the insects family (docs/life/insects.md: makeMotes, makeBubbles, makeSedgeFlies). This module places
// them, gives them the town's light and water, writes their marks on the surface, and leaves the staging its handles.
// What the family cannot be told is laid into its materials from here, all or nothing, and said in the page errors if
// the family's shader has changed: the town's water for motes and beads (dress), the bead's look, the plume's sway,
// and the sedge fly's own way, pose and number (townFly: "the town's sedge fly", below).
//
// IN shared.cast AFTER THIS MODULE (none of it plays a sound; nothing here places a cue):
//   sedges     the family's handle for the seventeen wheels: settle(1, 2) (the warning: all down on the water and still),
//              settle(0, 3), part(x, y, z, r, seconds) (a bird surfacing), wheel(i)
//   bubbles    the family's handle: burst(x, y, z, n, spread) (a sheath behind a diving cormorant: 160 spare beads, the
//              oldest reused: three every 0.15 s from as deep as 2.5 m all reach the surface; a few pin rings are
//              written where they arrive)
//   motes      the family's handle
//   small      this group's own:
//     onTouch(x, z, kind, near)    ASSIGN a function. Something of this group has touched the water at (x, z), `near` metres
//                                  from the boat; its ring is already written. kind 'pop': a bubble has broken (handed on at
//                                  most twice a second and only within 14 m of the boat: the page's `drop`, pitch 1.6, gain
//                                  0.4); 'sedge': a fly has come down on the water (at most three a second, within 12 m)
//     wheels[i]                    { name, kind: 'dome' | 'lancet' | 'glass' | 'loggia', x, z, s, radius, lamp, level, gate, at }
//                                  0 to 4 the domes, 5 to 7 the church's right flank, 8 to 12 the glass ridge, 13 the loggia,
//                                  14 to 16 the church's left flank. `lamp`: a dome's number in shared.lampDomes.list.
//                                  `level`: give it a function () => 0..1.4 (or a number) and the wheel takes that as its
//                                  own light's brightness in place of the town's there (a dome that kindles: the Presences
//                                  group gives the five domes theirs). `gate` 0..1 thins the wheel away. `at`: where it is
//                                  drawn now ({ x, z }: where the picture shows its light); x, z are the light's own
//     fade(i, k, seconds)          wheel i (or 'all', or a kind, or a name) thinned to k of itself
//     toLanterns({ wheels, ... })  THE STROKE'S RISING (t 20 on): from now on the wheels leave their lights, one after
//                                  another, for the Deep group's lanterns that lie within a metre of the surface near the
//                                  boat: a small wheel over each, kept as the lantern glides, left as it sinks (then to
//                                  another, or home). wheels: which (default: all but the loggia's); the rest of the
//                                  numbers are small.lanterns (live): within, hull, apart, depth, lose, radius, share,
//                                  seconds, stagger, color; small.lanterns.held: how many wheels have a lantern now
//     fromLanterns(seconds = 8)    it ends: every wheel goes home, one after another
//     send(i, { x, z, seconds = 6, color, level = 1, depth = 0, radius, share = 1, cross = false })   wheel i leaves its
//                                  light for another and takes the new light's colour, level (a number or a function)
//                                  and depth under the water: its flies leave one by one, each lifting a hand's breadth
//                                  as it goes, and gather a few at a time at the new light, `radius` wide and `share` of
//                                  their number. cross: true: the whole wheel slides over the water instead (for a move
//                                  of a metre or two only: further, it is a thing on rails). seconds 0: there at once
//     home(i = 'all', seconds = 6, cross)   back to its own light, its own width and number
//     bow                          the flies at the prow lantern (they come over while it passes within 7.5 m of a lit
//                                  wheel, about a dozen in its light at a time, and fall astern): bow.on = false keeps
//                                  them home; bow.range (metres); bow.present (are any in its light now)
//     chains                       where the bubbles rise: [{ kind: 'pot' | 'vent' | 'plume', x, y, z, s, d }]
//     boil                         the fountain's boil: { x, z, radius, rate, strength, swell: { every, strength, radius } }
//                                  (live: change them at will; swell.strength 0 for pin rings only)
//
// Developer switches:  &small=motes,bubbles,sedges  only these     &smraw=1  the family's own look, nothing laid in
//                      &smlog=1 (or =pots, or =lanterns)  print the places; the held lanterns every &smlogevery= s from &smlogat=
//                      &smtest=warning | send | away | dive | lanterns  try the controls (lanterns: with &dprisen=75, the Deep
//                      group's lanterns up; &smtestat= when, &smtestback= when they go home again)
//                      &smfbow=0  no flies at the prow lantern       &smfbob=0  no hole round the pendulum's bob
//                      &smfown=0  the family's own sedge fly (each on its circle)      &smfcount=<n>  flies a wheel
//                      &smfshift=0  the wheels at their lights' true places            &smfov=<degrees>  a long lens
//                      numbers: &smfsize= &smfpx= &smffarpx= &smfsweep= &smfdash= &smfwiden= (the fly), &smfland= &smflandr=
//                      &smflandn= &smfkick= &smfkickr= &smfkickn= &smfkickt= &smfreach= (its marks), &smbsilver= &smbsway= &smbpx=
//                      &smbplume=<times> (beads: the last, so many times the plume's number)
import * as THREE from 'three';
import { makeSedgeFlies, makeBubbles, makeMotes, makeMoths, pixelOnScreen } from '../../engine/life/insects.js';
import { ensureLight } from './light.js';

const Q = new URLSearchParams(typeof location !== 'undefined' ? location.search : '');
const ONLY = (Q.get('small') || '').split(',').map((v) => v.trim()).filter(Boolean);
const want = (k) => !ONLY.length || ONLY.includes(k);
const note = (msg) => console.error('INVALID_ note (cast_small): ' + msg);
const num = (k, d) => (Q.has(k) && Q.get(k) !== '' && !Number.isNaN(+Q.get(k)) ? +Q.get(k) : d);
const RAW = Q.has('smraw');
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// ------------------------------------------------------------------------------------------------ what was chosen
// (s, d as the page gives them; depths are the models' own, read from shared.pots)
const SMALL = {
  // the chimney pots that breathe a chain: the pot of shared.pots nearest each of these is taken. Two at s 21 beside the
  // keel (the first chain "climbs past" the hull), eleven of the street's left row from s 33 to 115, a metre deeper every
  // ten: the last seven rise through their own weed
  chains: [[21, 1.67], [21, 4.92], [33, -10.25], [44.8, -10.25], [51.6, -10.25], [62, -10.25], [64.7, -10.25], [74.3, -10.25], [82.1, -10.25], [86.3, -10.25], [95.2, -10.25], [103.1, -10.25], [115.5, -10.25]],
  // beads are drawn large enough to be seen from where they are seen (metres, radius at the mouth; they grow 30 per cent):
  // near: the pots that pass at arm's length; far: the left row's, seen from 4 to 12 m
  bead: { near: 0.024, far: 0.032, vent: 0.028, minPixels: 6, wobble: 0.06, burst: 2.2, pearl: [400, 600, 0.45, 0.84] },      // (pearl: a bead is a pearl at EVERY size on the screen. It was to open into a ring with a window through a stipple from a radius of 18 pixels, "which none reaches where the hull can go": the square is free to roam, and beside the fountain's boil the plume's large beads pass 2 m from the eye at 20 to 45 pixels: hatched balls, town_s5_14_plume_above_f00.png)   // (wobble: a bead rocks a whole diameter from side to side as it climbs; the family's 3.5 cm made a chain a ruled line)                 // (and never drawn under six pixels across: the plume is seen from 13 m)
  vent: { beads: 8 },                                                           // the ridge of the first dormer (layout: town.dormers, `first`)
  plume: [{ beads: 300, size: 0.018, spread: 0.75 }, { beads: 130, size: 0.036, spread: 0.6 }],      // the fountain: many small, fewer large
  pool: 160,                                                                    // spare beads for bursts (the cormorants' sheaths). 72 were reused before they had reached the surface: a bird that sheds three every 0.15 s (20 a second) from 2.5 m down needs its beads for seven seconds, or they vanish in open water under the eye
  // the page's rain disc; and `swell`: the boil's own slow rings, about one a second, wide enough to travel (a pin ring lives
  // only in the water's fine window, within about 12 m of the boat: the hands-off line passes the boil at 13 m)
  boil: { radius: 0.9, rate: 14, strength: 0.12, swell: { every: [0.6, 1.4], strength: 0.7, radius: 0.5 } },
  sway: { reach: 0.35, rate: 0.25 },                                             // the plume sways as a whole: metres at its top, radians a second
  wheels: { count: 213, lancets: ['s0', 's3', 's6'], lancetsLeft: ['n1', 'n4', 'n7'], lancetCount: 150, glassAlong: [-17, -8.5, 0.5, 8.5, 17.5], glassOut: 2.6, radius: { dome: 1.35, lancet: 1.1, glass: 1.15, loggia: 1.2 },
    // how far under the water the top of each kind's light burns (metres): a wheel is drawn where the picture shows that
    // (the lamp heads and the gable tops of the church's lucarnes are 0.4 m down; the glass ridge stands above the water)
    depth: { dome: 0.4, lancet: 0.4, glass: 0, loggia: 0 } },
  // a fly: drawn 1.5 times the family's (a tent 3.2 cm long on the water, 6 cm across on the wing: twice life, as the
  // ride draws its mayflies); never under 4 pixels near, 2 far off (a far wheel is fine dust, not glitter)
  fly: { size: 1.5, minPixels: 4, farPixels: 0.5, cap: 0.55, gain: 0.62, pale: 0.7, far: 34, farOver: 14,
    wing: { sweep: 1.05, dash: 0.3, widen: 1.7 },
    rest: [0.45, 0.4],                                                           // of every stretch of its way a fly sits out the last 45 to 85 per cent: at any moment most are sitting
    tone: [0.15, 0.3, 0.9, 1.15],
    thin: [10, 28, 0.45, 0.5] },                                                   // far off: between 10 and 28 m a wheel is thinned to this share of its flies on the wing, and they are this much dimmer                                                 // a sitting fly from the ridge of its tent to its margin; a flying one from wing root to tip (of the wheel's light)                              // on the wing: how far the wings swing out (radians), how much of that while it dashes on the water, how much wider the opened wing is (the hind wing comes out from under the fore wing)
  // what the flies write on the water, within the water's fine window round the boat: `land` a pin ring where one comes
  // down, `kick` a slighter one where one sets off on a dash (and `trail` more along the dash: its V); aSecond: how many a
  // wheel at most. Few and slight on purpose: this water shows the least ring whole, and thirty a second a wheel was rain
  // (`afar`: a pin ring lives only in the water's fine window, within about 12 m of the boat, so a wheel further off wrote nothing at all. From `from` to `to` metres a lit
  // wheel writes one wider ring every `every` seconds somewhere under its flies: wide enough for the water's far window, slight, and seldom: the water under a far wheel is seen to be touched)
  afar: { from: 11, to: 34, every: [1.4, 3.2], strength: 0.3, radius: 0.5 },
  land: { strength: 0.28, radius: 0.2, aSecond: 3 }, kick: { strength: 0.07, radius: 0.1, aSecond: 6, trail: 1, every: 0.08 }, reach: 12.5,
  // the flies over the risen lanterns (small.toLanterns): a lantern counts when it lies shallower than `depth` (metres) on open water within `within` of the boat, further
  // than `hull` from it, `edge` inside the navigable water and `tower` from the tower's middle; no two wheels nearer than `apart`; a wheel there is `radius` wide and
  // `share` of its flies; one wheel sets out every `stagger` seconds and takes `seconds` over it; it keeps its lantern (at `follow` m/s at most) until that lies deeper than `lose`
  lanterns: { within: 22, hull: 3.6, edge: 1.5, tower: 6.4, apart: 3.4, depth: 1.0, lose: 1.7, radius: 0.9, share: 0.42, seconds: 7, stagger: 0.9, every: 0.25, follow: 0.25, color: '#F3A77E', level: 1 },      // (follow: the Deep group's lanterns glide at 0.12 to 0.19 m/s under the surface; at 0.06 a wheel was two metres behind its lantern in ten seconds)
  // the flies at the prow lantern (the family's small moth, in the sedge fly's cream): how many; from how far off a lit wheel they come; how large (1 = 6 cm across the
  // spread wings: these are 3.3 cm, a caddis a third over life); their ways round the flame (metres; a turn in and out takes `cycle` seconds); how the flame lights them;
  // how far from the flame one is still seen; how many set out at a time and how often; how long each takes to come and to go; how long out of range before they leave
  bow: { count: 14, range: 7.5, size: 0.7, minPixels: 5, out: 0.12, up: 0.06, orbit: { wide: 0.5, tight: 0.13, speed: 0.85, cycle: 16 }, flame: 0.75, cap: 0.8, pale: 0.55, seen: [1.3, 2.2], party: 3, every: 2.2, arrive: 4.5, leave: 5, linger: 1.5 },
  // motes: specks of silt (drawn 1 to 2.5 cm; never under 2.2 pixels, and fainter by as much as that floor enlarges them). `own`: how much of the water's own
  // light one shows where no lamp reaches it (little: a mote is seen by the light it scatters); `warm`: how much of the street's lamplight; `near`: a mote
  // drawn larger than this many pixels is beside the eye and out of its focus, and is fainter by as much
  mote: { count: 3000, box: [24, 7, 24], size: 0.034, minPixels: 3.4, opacity: 0.8, own: 0.5, warm: 2.0, grey: 0.45, near: 9, far: 1.0 },
};

/**
 * Lay the town's water into a shader of the creature toolkit that takes no `extend` (makeMotes and makeBubbles build
 * their own THREE.ShaderMaterial). edits: [['v' | 'f', the family's own text, what stands there instead], ...]. All or
 * nothing: if the family's shader no longer has one of the texts, it is left exactly as the family draws it and the
 * page says so (the thing is then lit by nothing of the town's and swallowed only by the engine's water).
 */
function dress(material, edits, uniforms, what) {
  let vs = material.vertexShader, fs = material.fragmentShader;
  for (const [which, find, put] of edits) {
    const src = which === 'v' ? vs : fs;
    if (!src.includes(find)) { note(`the insects family's ${what} shader has changed (no "${find.slice(0, 48)}"): drawn as the family draws it, without the town's water`); return false; }
    if (which === 'v') vs = vs.replace(find, () => put); else fs = fs.replace(find, () => put);
  }
  material.vertexShader = vs; material.fragmentShader = fs; Object.assign(material.uniforms, uniforms); material.needsUpdate = true;
  return true;
}

// ------------------------------------------------------------------------------------------------ the town's sedge fly
// The family's sedge fly runs on a circle of its own about its lamp: two hundred of them are the grooves of a record, and
// from the rider's low eye they slide past each other in lanes. A caddis over a light does not do that. Here each fly
//   - runs a looping way of its own: an ellipse about a point near the lamp, which itself turns as the fly goes, so
//     that its track is a rosette, it crosses the bright middle fast and at every angle, and slows where it turns at
//     the rim; one in five goes the other way round;
//   - goes in dashes, sits for a second or three at the end of each stretch (a small tent on the water, wings shut),
//     and sets off again; now and then it lifts and comes down a little further on (the family's hop);
//   - has its wings OUT when it is on the wing or dashing (they swing out from the roof they make at rest, the hind
//     wing opening from under the fore wing, and flick), so that a flying fly and a sitting one are two shapes;
//   - leaves one by one as its light fails (the family shrinks the whole wheel together);
//   - is never drawn inside a thing that stands in its water (the glass ridge, the church's roof): pushed there by the
//     hull, it is simply not there;
//   - draws no V of its own: what it writes on the water, the water draws (see "the flies on the water").
// The family's attributes, uniforms and controls are all kept (settle, part, wheel(i).set / moveTo / strength, the
// hull): only what its vertex shader works out is replaced, at the material's own //@vertexLocal mark, after the
// family's sums. If the family's shader no longer has what this reads, its flies are left exactly as it draws them.
const FLY_NEEDS = ['attribute float aWheel; attribute vec4 aSeed, aHop;', 'uWheel[', 'uWheelK[', 'uFlick', 'uMinPx', 'uPx', 'uSize', 'uKeep', 'uniform float uT', 'aPivot', 'aPart', 'aMem', 'vThin', 'vCover', 'vLit', 'liShove(', 'liKeepOut(', 'liLit(', 'liRz(', 'liRy(', '//@vertexLocal'];
const FLY_GLSL = /* glsl */`
    { // the town's sedge fly (src/realms/town/cast_small.js): what was worked out above is replaced
      int smI = int(aWheel); vec4 smW = uWheel[smI], smK = uWheelK[smI];
      smW.xy += uSmOff[smI];                                                         // (the wheel is drawn where the picture shows its light: see "where a wheel is drawn")
      float smLive = 1.0 - smK.y;                                                    // (settled: nothing runs, nothing lifts)
      float smU = smW.w * (0.75 + 0.5 * aSeed.y) + aSeed.z * 61.0;                   // its own run so far, in metres
      float smCyc = 2.0 + 3.6 * fract(aSeed.w * 7.73), smRf = uSmGait.x + uSmGait.y * fract(aSeed.x * 13.37);
      float smN = floor(smU / smCyc), smF = smU / smCyc - smN;
      float smD = smCyc * ((1.0 - smRf) * smN + min(smF, 1.0 - smRf));               // of which it sits out the last part of each stretch
      float smMove = smoothstep(0.0, 0.02, smF) * (1.0 - smoothstep(1.0 - smRf - 0.03, 1.0 - smRf, smF)) * smLive;
      float smStep = 0.22 + 0.2 * aSeed.z, smQ = smD / smStep + aSeed.w * 10.0, smFq = fract(smQ);
      float smDash = (floor(smQ) + smoothstep(0.12, 0.88, smFq)) * smStep;           // it goes in dashes
      // now and then it lifts, flies a little way on and comes down (on the wheel's own clock, so that a settled wheel
      // is still; each flight carries it on along its way, never straight up and down)
      float smHc = smW.w / (0.6 * aHop.x) + aHop.y, smHx = fract(smHc) / aHop.z;
      float smHop = smHx < 1.0 ? 4.0 * smHx * (1.0 - smHx) * smLive : 0.0;
      float smFly = smHx < 1.0 ? smoothstep(0.0, 0.18, smHx) * (1.0 - smoothstep(0.82, 1.0, smHx)) * smLive : 0.0;
      float smS = mix(smDash, smQ * smStep, smFly)                                   // (on the wing it does not stop and start)
        + (0.35 + 0.55 * fract(aSeed.y * 17.3)) * (floor(smHc) + (smHx < 1.0 ? smoothstep(0.0, 1.0, smHx) : 1.0));
      // (a fly that is leaving its wheel, or coming to it, is on the wing: it lifts a hand's breadth as it goes and comes
      // down as it arrives; smIn: how much it is there by its wheel's number, each fly at its own moment)
      float smIn = smoothstep(fract(aSeed.x * 91.7 + aSeed.w * 3.1) * 0.86, fract(aSeed.x * 91.7 + aSeed.w * 3.1) * 0.86 + 0.14, smK.x);
      smFly = max(smFly, 1.0 - smIn);
      // (uSmMode.x: all on the wing, low, never sitting: the few that keep a lantern company beside a hull under way)
      float smAl = uSmMode.x * smLive, smHigh = mix(aHop.w * smHop, uSmMode.y + uSmMode.z * (0.5 + 0.5 * sin(smU * 1.9 + aSeed.x * 40.0)), smAl);
      smS = mix(smS, smU + aSeed.w * 10.0 * smStep, smAl); smFly = max(smFly, smAl); smHigh = max(smHigh, (1.0 - smIn) * 0.3);
      // its way: an ellipse about a point near the lamp, turning as it goes
      float smA = smW.z * mix(0.38, 0.92, aSeed.x), smB = smA * mix(0.28, 0.72, fract(aSeed.y * 5.3)), smL = sqrt(0.5 * (smA * smA + smB * smB));
      float smDir = aSeed.w < 0.22 ? -1.0 : 1.0, smKap = (fract(aSeed.x * 3.7) - 0.35) * 0.7;
      float smTh = aSeed.x * 44.0 + smDir * smS / smL, smPr = aSeed.z * 19.0 + smKap * smS;
      vec2 smE = vec2(smA * cos(smTh), smB * sin(smTh)), smEt = vec2(-smA * sin(smTh), smB * cos(smTh)) * (smDir / smL);
      float smC = cos(smPr), smSn = sin(smPr);
      vec2 smRo = vec2(smC * smE.x - smSn * smE.y, smSn * smE.x + smC * smE.y);
      vec2 smVe = vec2(smC * smEt.x - smSn * smEt.y, smSn * smEt.x + smC * smEt.y) + smKap * vec2(-smRo.y, smRo.x);
      vec2 smOf = (smW.z - smA) * 0.85 * fract(aSeed.z * 9.1) * vec2(cos(aSeed.y * 31.0), sin(aSeed.y * 31.0));
      vec3 smP = vec3(smW.x + smOf.x + smRo.x, smHigh, smW.y + smOf.y + smRo.y);
      smP = liShove(smP, 1.0); smP = liKeepOut(smP, uCameraPos, uKeep); smP.y = max(smP.y, 0.0);
      float smVl = length(smVe);
      vec3 smFw = smVl > 1e-4 ? vec3(smVe.x, 0.0, smVe.y) / smVl : vec3(1.0, 0.0, 0.0), smUp = vec3(0.0, 1.0, 0.0), smLf = cross(smUp, smFw);
      // is it there at all: its light, its wheel's number, and what stands in the water
      vec4 smLt = liLit(smP + vec3(0.0, 0.02, 0.0));
      float smDist = distance(smP, uCameraPos);
      float smShow = smIn * smoothstep(0.10, 0.36, smLt.a);
      for (int si = 0; si < 4; si++) {
        vec4 sa = uSmSolidA[si], sb = uSmSolidB[si];
        if (sb.w > 0.5) { vec2 ab = sb.xy - sa.xy, ap = smP.xz - sa.xy; float tt = clamp(dot(ap, ab) / max(dot(ab, ab), 1e-4), 0.0, 1.0);
          smShow *= smoothstep(sa.z, sa.z + 0.3, length(ap - ab * tt)); }
      }
      // its pose: a tent on the water; wings out and flicking on the wing (and the hind wing out from under the fore
      // wing: wider); in a dash they buzz a little way open
      float smGo = smMove * mix(0.6, 1.0, smoothstep(0.08, 0.3, smFq) * (1.0 - smoothstep(0.7, 0.92, smFq)));      // (through a whole run of dashes the wings stay a little open; widest in the middle of each dash)
      float smAir = max(smFly, smGo * uSmWing.y), smBeat = step(0.5, fract(uFlick + aSeed.x * 7.0));
      vec3 smV = position, smNm = normal; float smEdge = 0.0;
      if (aPart > 0.5 && aPart < 2.5) {
        float smSd = aPart < 1.5 ? 1.0 : -1.0;
        smEdge = clamp(abs(position.x) / 0.0046, 0.0, 1.0);                          // 0 along the ridge of the tent .. 1 at the wing's margin
        smV.xy *= mix(1.0, uSmWing.z, smFly);
        mat3 smH = liRz(smSd * smAir * mix(-0.25, 0.95, smBeat)) * liRy(-smSd * smAir * uSmWing.x);
        smV = smH * smV; smNm = smH * smNm;
      } else if (aPart > 5.5 || aMem > 0.5) { smShow = 0.0; }                        // (no V: the water draws it. No feelers: a hair of 0.6 pixels, dark brown, which the floor on the screen enlarged into a black speck beside every fly)
      smV += aPivot;
      // (far off a fly is smaller than a pixel and is drawn up to its floor on the screen: two hundred of those in a
      // sliver six pixels high were a line of glitter. So the far wheel is thinned: beyond eight metres the sitting
      // flies, which are dark and still, go first, and of the rest a growing share: what is left over a far lamp is a
      // few dozen pale specks that come and go as flies take wing and settle.)
      float smFar = smoothstep(uSmFar.x, uSmFar.y, smDist);
      smShow *= mix(1.0, smoothstep(0.0, 0.2, smAir), smoothstep(8.0, 18.0, smDist)) * step(fract(aSeed.z * 57.3 + aSeed.x * 11.9), mix(1.0, uSmFar.z, smFar));
      float smGrow = max(1.0, uMinPx * mix(1.0, uSmWing.w, smoothstep(9.0, 30.0, smDist)) * uPx * smDist / (0.024 * uSize));
      transformed = smP + (smLf * smV.x + smUp * smV.y + smFw * smV.z) * (uSize * smShow * smGrow);
      objectNormal = smLf * smNm.x + smUp * smNm.y + smFw * smNm.z;
      // (no two flies the same pale: each takes its own share of the light, between uSmMode.w and all of it)
      vLit = vec4(smLt.rgb * mix(1.0, uSmFar.w, smFar) * mix(uSmMode.w, 1.0, fract(aSeed.w * 23.7 + aSeed.y * 5.1)), smLt.a); vThin = aMem; vCover = 1.0;
      // What the fragment is told. x: how near (1 within four metres: a fly is then more than a fleck, and its body is
      // drawn as the dark dash it is). y: its tone. The light comes from under the water: a fly that sits has its wings
      // shut over its back and shows the eye their unlit side, darkest along the ridge where the body lies under them;
      // a fly on the wing holds them open against the light, and they are thin: it is the pale one.
      // z: how much it is on the wing (a sitting fly is fawn, a warm brown-cream; the open wing is the paler cream).
      float smOpen = smoothstep(0.0, 0.2, smAir);                                    // (a run of dashes is made with the wings buzzing a little way open: the fly is pale while it runs and dark when it sits)
      vSm = vec3(1.0 - smoothstep(4.0, 9.0, smDist), mix(mix(uSmTone.x, uSmTone.y, smEdge), mix(uSmTone.z, uSmTone.w, smEdge), smOpen), smOpen);
    }`;
const fr = (x) => x - Math.floor(x);
/**
 * Give a handle of makeSedgeFlies the town's fly. solids: { A: [Vector4 x 4], B: [Vector4 x 4] } (shared uniforms: the
 * things no fly is drawn inside). Returns null if the family's shader has changed (the flies are then the family's), or
 * the same sums on the CPU: { lists: [[fly numbers of wheel i]], at(k) -> { x, z, q, fq, move, fly }, land(k, phase) }
 * (where fly k is now, before the hull has pushed it; q: the number of its dash; move: 1 under way .. 0 sitting; fly:
 * 1 on the wing).
 */
function townFly(h, solids, wing, offs, gait, tone, far, mode = { value: new THREE.Vector4(0, 0, 0, 0.6) }) {
  const m = h.object.material, geo = h.object.geometry, U = h.uniforms;
  const missing = FLY_NEEDS.filter((s) => !m.vertexShader.includes(s));
  if (missing.length || !U || !U.uWheel || !U.uWheelK || !geo.attributes.aSeed || !geo.attributes.aHop || !geo.attributes.aWheel) {
    note(`the insects family's sedge fly has changed (${missing.length ? 'no "' + missing[0] + '"' : 'its uniforms or attributes'}): its flies are drawn as the family draws them, each on its own circle`);
    return null;
  }
  m.vertexShader = m.vertexShader.replace('//@vertexPars', 'uniform vec4 uSmSolidA[4], uSmSolidB[4], uSmWing, uSmMode, uSmGait, uSmTone, uSmFar; uniform vec2 uSmOff[24]; varying vec3 vSm;\n  //@vertexPars').replace('//@vertexLocal', FLY_GLSL + '\n    //@vertexLocal');
  m.uniforms.uSmSolidA = solids.A; m.uniforms.uSmSolidB = solids.B; m.uniforms.uSmWing = wing; m.uniforms.uSmMode = mode; m.uniforms.uSmOff = offs; m.uniforms.uSmGait = gait; m.uniforms.uSmTone = tone; m.uniforms.uSmFar = far; m.needsUpdate = true;
  const OF = offs.value;
  const S = geo.attributes.aSeed.array, HP = geo.attributes.aHop.array, WI = geo.attributes.aWheel.array, n = h.count, lists = [];
  for (let k = 0; k < n; k++) (lists[WI[k]] = lists[WI[k]] || []).push(k);
  const st = { x: 0, z: 0, q: 0, fq: 0, move: 0, fly: 0 };
  const at = (k) => {
    const sx = S[k * 4], sy = S[k * 4 + 1], sz = S[k * 4 + 2], sw = S[k * 4 + 3], Wv = U.uWheel.value[WI[k]], live = 1 - U.uWheelK.value[WI[k]].y;
    const u = Wv.w * (0.75 + 0.5 * sy) + sz * 61, cyc = 2 + 3.6 * fr(sw * 7.73), rf = gait.value.x + gait.value.y * fr(sx * 13.37), nn = Math.floor(u / cyc), f = u / cyc - nn;
    const D = cyc * ((1 - rf) * nn + Math.min(f, 1 - rf)), step = 0.22 + 0.2 * sz, q = D / step + sw * 10, qf = Math.floor(q), fq = q - qf;
    const dash = (qf + smooth(0.12, 0.88, fq)) * step;
    const hc = Wv.w / (0.6 * HP[k * 4]) + HP[k * 4 + 1], hx = fr(hc) / HP[k * 4 + 2], fly = hx < 1 ? smooth(0, 0.18, hx) * (1 - smooth(0.82, 1, hx)) * live : 0;
    const s = dash + (q * step - dash) * fly + (0.35 + 0.55 * fr(sy * 17.3)) * (Math.floor(hc) + (hx < 1 ? smooth(0, 1, hx) : 1));
    const A = Wv.z * (0.38 + 0.54 * sx), B = A * (0.28 + 0.44 * fr(sy * 5.3)), L = Math.sqrt(0.5 * (A * A + B * B)), dir = sw < 0.22 ? -1 : 1, kap = (fr(sx * 3.7) - 0.35) * 0.7;
    const th = sx * 44 + dir * s / L, pr = sz * 19 + kap * s, ex = A * Math.cos(th), ez = B * Math.sin(th), c = Math.cos(pr), sn = Math.sin(pr), of = (Wv.z - A) * 0.85 * fr(sz * 9.1);
    st.x = Wv.x + OF[WI[k]].x + of * Math.cos(sy * 31) + c * ex - sn * ez; st.z = Wv.y + OF[WI[k]].y + of * Math.sin(sy * 31) + sn * ex + c * ez;
    st.q = qf; st.fq = fq; st.fly = fly;
    st.move = smooth(0, 0.02, f) * (1 - smooth(1 - rf - 0.03, 1 - rf, f)) * live;
    return st;
  };
  const land = (k, phase) => Math.floor(phase / (0.6 * HP[k * 4]) + HP[k * 4 + 1] - HP[k * 4 + 2]);     // (a whole number that changes when fly k comes down; phase: its wheel's)
  return { lists, at, land, n };
}

export async function build(ctx, plan, shared) {
  shared.cast = shared.cast || {};
  const light = shared.light || ensureLight(ctx, plan, shared), town = light.town, U = light.U, sh = ctx.engine.shared, stage = ctx.stage;
  const at = (s, d) => { const [x, z] = town.xz(s, d); return { x, z }; };
  const boatDist = (x, z) => Math.hypot(x - ctx.boat.x, z - ctx.boat.z);
  // every part's own work each frame: one that throws is taken off and named, and the others go on
  const updates = [];
  const each = (name, fn) => { let dead = false; updates.push((dt) => { if (dead) return; try { fn(dt); } catch (err) { dead = true; note(`${name} threw and was switched off: ${(err && err.stack) || err}`); } }); };

  // ---------------------------------------------------------------------------------------------- the town's light and water, for small things
  // The area's material gives everything built here the town's light and water (light.extendFor); these three are not
  // gouache under the water, so the same sums are laid into their own shaders: smTown(p) = the lamplight that reaches a
  // place (the light of the town there, dying upward from the height its lamps and windows burn at, in the street's
  // colour or the glass's jade), smOwn(p) = the water's own light there (green-teal in the top metres, bluer and less
  // below), smWater(p) = what the water between dissolves a thing into, and smThrough = how much of it comes through
  // (light.GLSL's townThrough, and the deep's own dark). Everything is read from light.U, so the four light states, the waking and sleeping, the breath and
  // the stroke's ring all reach them.
  const NEED = ['tTownGlow', 'uTownRect', 'uTownWake', 'uTownTower', 'uTownFlare', 'uTownShallow', 'uTownDeep', 'uTownTop', 'uTownStreet', 'uTownJade', 'uTownWaterA', 'uTownWaterB', 'uTownWater'];
  const TOWN_OK = !RAW && typeof light.GLSL === 'string' && ['townGlow', 'townS', 'townWake', 'townThrough'].every((f) => light.GLSL.includes(f + '(')) && NEED.every((k) => U[k]);
  if (!TOWN_OK && !RAW) note('light.js no longer gives what the small things read (townGlow, townS, townWake, townThrough, the state colours): they are drawn as the family draws them');
  // (two things the light may or may not have, as it is reworked: the height its lights burn at, and uTownPool: lamplight
  // as pools with an edge, and the water swallowing with depth itself. Each is used if it is there.)
  const HAS_HEIGHT = !!U.tTownHeight, HAS_POOL = !!(U.uTownPool && U.uTownPool.value && U.uTownPool.value.isVector4);
  const TOWN_SMALL = !TOWN_OK ? '' : light.GLSL + /* glsl */`
    uniform vec3 uTownShallow, uTownDeep, uTownTop, uTownStreet, uTownJade, uTownWaterA, uTownWaterB; uniform vec4 uTownWater;
    ${HAS_HEIGHT ? 'uniform sampler2D tTownHeight;' : ''} ${HAS_POOL ? 'uniform vec4 uTownPool;' : ''}
    vec3 smTown(vec3 p) {
      vec4 g = townGlow(p.xz); float l = g.r * townWake(townS(g), p.xz, -1.0, g.a);
      ${HAS_HEIGHT ? 'float dy = p.y - (texture2D(tTownHeight, clamp((p.xz - uTownRect.xy) * uTownRect.zw + 0.5, 0.0, 1.0)).r * 26.0 - 26.0);' : 'float dy = p.y + 6.0;'}
      float lamp = min(l, 1.4) * (dy > 0.0 ? exp(-dy / 4.5) : exp(dy / 10.0));
      ${HAS_POOL ? 'lamp *= smoothstep(uTownPool.y * 0.5, uTownPool.z, lamp);' : ''}
      return mix(uTownStreet, uTownJade, clamp(g.g * 1.4, 0.0, 1.0)) * lamp;
    }
    vec3 smOwn(vec3 p) { float dk = smoothstep(uTownWater.y, uTownWater.z, max(-p.y, 0.0)); return mix(uTownShallow, uTownDeep, dk) + uTownTop * (1.0 - 0.65 * dk); }
    vec3 smWater(vec3 p) { return mix(uTownWaterA, uTownWaterB, smoothstep(uTownWater.y, uTownWater.z, max(-p.y, 0.0))); }
    float smThrough(vec3 p, vec3 eye) { return townThrough(p, eye, uTownWater.w)${HAS_POOL ? ' * exp(-uTownPool.w * max(-p.y, 0.0))' : ''}; }
  `;
  const townU = () => { const o = {}; for (const k of [...NEED, 'tTownHeight', 'uTownPool']) if (U[k]) o[k] = U[k]; return o; };

  // ---------------------------------------------------------------------------------------------- what the staging takes hold of
  const small = shared.cast.small = { onTouch: null, wheels: [], chains: [] };
  let popTokens = 1;
  const touched = (x, z, kind) => {
    if (!small.onTouch) return;
    const near = boatDist(x, z);
    if (kind === 'pop') { if (near > 14 || popTokens < 1) return; popTokens -= 1; }
    try { small.onTouch(x, z, kind, near); } catch (err) { small.onTouch = null; note('onTouch threw and was taken off: ' + err); }
  };
  each('the pops\' count', (dt) => { popTokens = Math.min(1, popTokens + dt * 2); });

  // ---------------------------------------------------------------------------------------------- motes
  // Silt in the water: what gives the glass a body, and slides against the town beneath as the boat moves. The family's
  // own colours (rose near the surface, violet with depth) are what shows if its shader ever changes under this module.
  if (want('motes')) {
    const M = SMALL.mote;
    // (added to the picture as light, as the family's lint in a shaft is: a mote scatters light, it never darkens what is behind it. Laid over a lamp's glow
    // as paint, a mote dimmer than the glow was a dark speck in it.)
    const ADD = Q.get('smadd') !== '0';
    const motes = makeMotes(ctx, { under: true, additive: ADD, count: M.count, box: M.box, color: '#f3a77e', colorDeep: '#7850a6', size: num('smsize', M.size), minPixels: num('smpx', M.minPixels), opacity: num('smop', M.opacity) });
    const uSmMote = { value: new THREE.Vector4(num('smown', M.own), num('smwarm', M.warm), num('smgrey', M.grey), num('smnear', M.near)) }, uSmPale = { value: new THREE.Color('#e9e4f2') }, uSmFar = { value: num('smfarp', M.far) };
    // (A point is a number of pixels. The engine draws "what lies beneath the water" into a picture three quarters the
    // size of the screen, and the water takes away there what it adds here: a mote drawn a third larger in that picture
    // than on the screen left a dark fleck beside itself wherever the water tints what is under it. uSmPass: how much
    // smaller the picture being drawn is than the screen; the point is drawn smaller by as much.)
    const uSmPass = { value: 1 };
    { const obj = motes.object, fam = obj.onBeforeRender, sz = new THREE.Vector2();
      obj.onBeforeRender = function (renderer, scene, camera, geometry, material, group) {
        if (fam) fam.call(this, renderer, scene, camera, geometry, material, group);
        const rt = renderer.getRenderTarget(); renderer.getDrawingBufferSize(sz);
        uSmPass.value = rt && sz.y > 0 ? Math.min(1, rt.height / sz.y) : 1; obj.material.uniformsNeedUpdate = true;
      }; }
    if (TOWN_OK) dress(motes.object.material, [
      ['v', 'void main() {', `${TOWN_SMALL} uniform vec4 uSmMote; uniform vec3 uSmPale; uniform float uSmFar, uSmPass;\n      void main() {`],
      ['v', 'gl_PointSize = clamp(px * 1.5, uMinPx, 48.0);', 'gl_PointSize = clamp(px * 1.5, uMinPx, 48.0) * uSmPass;'],
      // a mote is a pale speck in the town's water: it shows the water's own light (taken half way to grey: silt, not
      // plankton, it must never read as a light), the lamplight of the street it hangs over (rose beside a window,
      // nothing in a dark lane), and it is swallowed by the water between like everything else down there
      ['v', 'vec4 ahead = ', `{ vec3 smO = smOwn(p); smO = mix(smO, vec3(0.88, 0.96, 1.0) * dot(smO, vec3(0.3, 0.5, 0.2)), uSmMote.z);
          vCol = uSmPale * (smO * uSmMote.x + smTown(p) * uSmMote.y);
          // (the family holds a far mote at its floor on the screen at full strength, and draws one beside the eye as a disc of twenty
          // pixels: two thousand even white dots, which is snow. Here a far mote fades by as much as the floor enlarges it, and a
          // near one is out of the eye's focus: large and faint. What is left to see is what a lamp lights.)
          float smPt = clamp(px * 1.5, uMinPx, 48.0);
          vAlpha *= smThrough(p, uCameraPos) * pow(clamp(thinM, 0.0, 1.0), uSmFar) * min(1.0, uSmMote.w / smPt); }\n        vec4 ahead = `],
      ADD ? ['f', 'gl_FragColor = vec4(vCol * a * (1.0 - f), 1.0);', 'gl_FragColor = vec4(vCol * a, 1.0);'] : ['f', 'gl_FragColor = vec4(mix(vCol, uFogColor, f), a);', 'gl_FragColor = vec4(vCol, a);'],      // (under the surface nothing takes the air's fog: the water over it carries that)
    ], { ...townU(), uSmMote, uSmPale, uSmFar, uSmPass }, 'motes');
    shared.cast.motes = motes;
  }

  // ---------------------------------------------------------------------------------------------- bubble chains
  if (want('bubbles')) {
    const pots = (shared.pots || []).filter((p) => !p.clear && p.y < -0.2);
    const near = (s, d) => { let best = null, bd = 1e9; for (const p of pots) { const dd = Math.hypot(p.s - s, p.d - d); if (dd < bd) { bd = dd; best = p; } } return bd < 2.5 ? best : null; };
    const sources = [], B = SMALL.bead;
    for (const [s, d] of SMALL.chains) {
      const p = near(s, d); if (!p) continue;
      // a pot a hand's breadth under the surface ticks (three beads on the way at once); a deep one carries a chain of up to ten
      const depth = -p.y;
      sources.push({ position: [p.x, p.y, p.z], count: depth < 0.8 ? 3 : Math.min(10, Math.round(4 + depth)), spread: 0.04 + 0.01 * depth, size: Math.abs(p.d) < 7 ? B.near : B.far });
      small.chains.push({ kind: 'pot', x: p.x, y: p.y, z: p.z, s: p.s, d: p.d });
    }
    if (!pots.length) note('shared.pots is empty (was kit_roofs skipped?): no chimney chains');
    // the ridge of the first dormer (s 17.6, d -3.7): the page's first postcard and its first moment both put a chain of
    // bubbles beside the first window, and no pot stands there
    { const dm = town.dormers.find((q) => q.first), p = dm ? { x: dm.x + 0.35 * Math.sin(dm.yaw), y: dm.y + dm.h + 0.05, z: dm.z + 0.35 * Math.cos(dm.yaw) } : { ...at(17.6, -3.7), y: -1.2 };
      sources.push({ position: [p.x, p.y, p.z], count: SMALL.vent.beads, spread: 0.05, size: B.vent });
      const q = town.sd(p.x, p.z); small.chains.push({ kind: 'vent', x: p.x, y: p.y, z: p.z, s: q.s, d: q.d }); }
    // the fountain still plays: a plume from its spout, 17.5 m down, widening to the boil's 1.5 m
    const sp = (shared.fountain && shared.fountain.spout) || { ...at(plan.fountain.s, plan.fountain.d), y: plan.fountain.floor + plan.fountain.height };
    SMALL.plume.forEach((pl, i) => sources.push({ position: [sp.x, sp.y, sp.z], count: Math.round(pl.beads * num('smbplume', 1)), spread: pl.spread, size: pl.size }));
    small.chains.push({ kind: 'plume', x: sp.x, y: sp.y, z: sp.z, s: plan.fountain.s, d: plan.fountain.d });
    const bubbles = makeBubbles(ctx, { sources, pool: SMALL.pool, onTouch: touched, wobble: num('smbwob', SMALL.bead.wobble) });
    // A bubble under water is a mirror at its rim: it shows what light there is round it. The family paints it one
    // silver everywhere (and fogs it as a thing in air); here its lower rim shows the lamplight of the street beneath it,
    // its upper rim the water's own pale light, and it dissolves into the water between like the roofs it rises past.
    const uSmBead = { value: new THREE.Vector4(num('smbown', 1.25), num('smbwarm', 3.0), num('smbfloor', 0.10), num('smbsilver', 0.6)) }, uSmPx = { value: 0 };
    const uSmPlume = { value: new THREE.Vector4(num('smbsway', SMALL.sway.reach), SMALL.sway.rate, num('smbburst', SMALL.bead.burst), 0) };
    // (a pearl up to a radius of `pearl[0]` pixels, a ring with a window from `pearl[1]`; its middle this much of its rim; its outline fades from this far out)
    const uSmPearl = { value: new THREE.Vector4(num('smbpearl0', B.pearl[0]), num('smbpearl1', B.pearl[1]), num('smbbody', B.pearl[2]), num('smbedge', B.pearl[3])) }, uSmP1 = { value: 0.001 };
    if (TOWN_OK && dress(bubbles.object.material, [
      ['v', 'void main() {', 'varying vec3 vSmW; varying float vSmR; uniform float uSmPx, uSmP1; uniform vec4 uSmPlume;\n      void main() {'],
      // (a bead deep in the water is never drawn smaller than a few pixels: the plume and the deep chains stay beads from
      // across the street, and the water between takes them away; a bead in the top metre is its own size: a pot that
      // ticks thirty metres off is not seen)
      // (and beyond fifty metres there are no beads at all: a column of single pixels would glitter in the far mirror)
      // (the plume, a source with a wide spread, sways as a whole, slowly, as smoke does: more toward its top; and its beads
      // keep their size on the screen to the surface, where they break. The floor follows the bead's own size, so that a
      // chain is large and small beads, and it is smaller far off: at thirty metres six pixels would be a bead as large as a pot)
      ['v', 'vec4 mv = viewMatrix * vec4(c, 1.0);', `if (aTime.w > 0.3) c.xz += uSmPlume.x * k * vec2(sin(c.y * 0.33 + uT * uSmPlume.y), cos(c.y * 0.27 + uT * uSmPlume.y * 0.83));
        vSmW = c; vec4 mv = viewMatrix * vec4(c, 1.0);
        if (aTime.y < 0.0) r *= uSmPlume.z;                                         // (a bead let go by burst(): the family makes those a third the size of a chain's)
        if (r > 0.0) r = max(r, uSmPx * (0.35 + 1.3 * clamp(aSrc.w * (aTime.y < 0.0 ? uSmPlume.z : 1.0) / 0.045, 0.0, 1.0)) * mix(1.0, 0.6, smoothstep(12.0, 30.0, -mv.z)) * -mv.z * max(smoothstep(0.4, 1.6, -c.y), step(0.3, aTime.w))) * (1.0 - smoothstep(38.0, 52.0, -mv.z));
        // (its radius on the screen, in pixels: nothing may follow this statement on its line but the family's own text)
        vSmR = r / max(uSmP1 * -mv.z, 1e-6);`],
      // (a bead is drawn as a painter draws one: a bright crescent on the side the surface's light comes from, a thin rim
      // round the rest, a glint. A ring of one width all round was a scribbled letter o at arm's length.)
      ['f', 'float ring = smoothstep(0.62, 0.8, r),', 'float ring = smoothstep(mix(0.74, 0.40, smoothstep(-0.7, 0.8, dot(vQ / max(r, 1e-3), vec2(-0.42, 0.91)))), 0.84, r),'],
      // (A bead is a PEARL: its middle is drawn too, dimmer than its rim. As a ring with nothing in it, a bead of six
      // pixels was a white o with a dark hole, and the water, which draws what lies beneath it from a coarser picture,
      // broke the ring and blackened the hole: the chains were strings of small eyes. Only a bead very large on the
      // screen (a radius of eighteen pixels and more: none is, where the hull can go) would open into a ring with a
      // window in it, through a stipple; tried from six pixels, the stipple showed as a grille in every bead at arm's
      // length.)
      ['f', 'if (ring + glint < 0.5) discard;', `float smBody = clamp(ring + glint, 0.0, 1.0);
        { vec2 smF = floor(gl_FragCoord.xy); float smDith = mod(smF.x, 2.0) * 0.5 + mod(smF.x + smF.y, 2.0) * 0.25 + 0.125;
          if (smBody < 0.5 && smoothstep(uSmPearl.x, uSmPearl.y, vSmR) > smDith) discard; }`],
      ['f', 'void main() {', `${TOWN_SMALL} uniform vec3 uCameraPos; uniform vec4 uSmBead, uSmPearl; varying vec3 vSmW; varying float vSmR;\n      void main() {`],
      ['f', 'gl_FragColor = vec4(mix(c, uFogColor, liFog(vDist)), 1.0);', `{
          float sup = smoothstep(-1.0, 1.0, vQ.y);
          vec3 smO = smOwn(vSmW); smO = mix(smO, vec3(0.92, 0.96, 1.0) * dot(smO, vec3(0.3, 0.5, 0.2)), uSmBead.w);      // silver: it mirrors the water's light, it is not dyed by it
          vec3 sc = uColor * ((smO + uSmBead.z) * (mix(0.7, 1.5, sup) * uSmBead.x) + smTown(vSmW) * (mix(1.6, 0.6, sup) * uSmBead.y)) * mix(0.8, 1.35, glint) * mix(uSmPearl.z, 1.0, smBody);
          // (its outline goes into the water's own colour: a bead is cut out pixel by pixel, and a hard pale edge was a jagged one)
          gl_FragColor = vec4(mix(smWater(vSmW), sc, smThrough(vSmW, uCameraPos) * (1.0 - smoothstep(uSmPearl.w, 1.0, r))), 1.0);
        }`],
    ], { ...townU(), uSmBead, uSmPearl, uSmPx, uSmP1, uSmPlume, uCameraPos: sh.uCameraPos }, 'bubbles')) {
      const half = num('smbpx', B.minPixels) / 2, obj = bubbles.object, mat = obj.material;
      obj.onBeforeRender = (renderer, scene, camera) => { uSmP1.value = pixelOnScreen(renderer, camera); uSmPx.value = half * uSmP1.value; mat.uniformsNeedUpdate = true; };
    }
    shared.cast.bubbles = bubbles;
    // A sheath of beads let go by burst() (a diving cormorant's) breaks the surface too: the family writes no ring for
    // those. A few pin rings are written here where and when they arrive (their own rise at about 0.35 m/s), within
    // the water's reach of the boat, so that the bird's way under water is written on the surface a moment behind it.
    { const burst0 = bubbles.burst.bind(bubbles), rb = ctx.rng(911), due = [];
      bubbles.burst = (x, y, z, n = 8, spread = 0.2) => {
        burst0(x, y, z, n, spread);
        const rings = Math.min(4, Math.max(1, Math.round(n / 3)));
        for (let i = 0; i < rings && due.length < 40; i++) due.push({ t: ctx.time + Math.max(0, -y) / (0.3 + 0.12 * rb()) + 0.2 * rb(), x: x + (rb() - 0.5) * (spread + 0.1), z: z + (rb() - 0.5) * (spread + 0.1) });
        return bubbles;
      };
      each('the sheaths\' rings', () => {
        for (let i = due.length - 1; i >= 0; i--) if (ctx.time >= due[i].t) { const e = due[i]; due.splice(i, 1); if (boatDist(e.x, e.z) < 30) { ctx.water.ripple(e.x, e.z, 0.15, 0.3); touched(e.x, e.z, 'pop'); } }
      }); }
    // The fountain's boil. The plume's beads are the ones large enough to draw; with them comes a fizz of small ones,
    // which is written on the water only: the page's disc of radius 0.9 m, 14 drops a second, strength 0.12 (bounded:
    // nothing is written while the boat is out of the water's reach of it).
    { const boil = small.boil = { x: sp.x, z: sp.z, ...SMALL.boil, swell: { ...SMALL.boil.swell } }, rr = ctx.rng(907); let acc = 0, next = 1;
      const swayed = bubbles.object.material.uniforms.uSmPlume === uSmPlume;      // (the plume sways only if the town's water was laid into its shader)
      each('the fountain\'s boil', (dt) => {
        // the boil is where the plume breaks the surface: it wanders with the plume's own slow sway
        if (swayed) { const ph = ctx.time * uSmPlume.value.y; boil.x = sp.x + uSmPlume.value.x * Math.sin(ph); boil.z = sp.z + uSmPlume.value.x * Math.cos(ph * 0.83); }
        if (boatDist(boil.x, boil.z) > 46) { acc = 0; return; }
        acc = Math.min(4, acc + dt * boil.rate);
        while (acc >= 1) { acc -= 1; const a = rr() * 6.2832, r = boil.radius * Math.sqrt(rr()), x = boil.x + Math.cos(a) * r, z = boil.z + Math.sin(a) * r; ctx.water.ripple(x, z, boil.strength, 0.16 + 0.16 * rr()); touched(x, z, 'pop'); }
        const sw = boil.swell; next -= dt;
        if (sw && sw.strength > 0 && next <= 0) { next = sw.every[0] + (sw.every[1] - sw.every[0]) * rr(); const a = rr() * 6.2832, r = 0.4 * boil.radius * rr(); ctx.water.ripple(boil.x + Math.cos(a) * r, boil.z + Math.sin(a) * r, sw.strength * (0.7 + 0.6 * rr()), sw.radius * (0.8 + 0.4 * rr())); }
      }); }
  }

  // ---------------------------------------------------------------------------------------------- sedge flies
  // Seventeen low wheels, each over a light it cannot reach. The family draws the flies and lights them from beneath by
  // the lights it is told of; it draws no lamp. So every wheel here is told, each frame, what the town's light under
  // it is doing (light.level: drowsing ahead, awake near the boat, asleep behind, the breath, the stroke's ring), and
  // there are no flies over a light that sleeps: no insect is seen in the dark between lights.
  flies: if (want('sedges')) {
    const defs = small.wheels, PALE = new THREE.Color('#fff2e0'), WH = SMALL.wheels, F = SMALL.fly;
    const add = (name, kind, x, z, o = {}) => defs.push({ name, kind, x, z, s: town.sd(x, z).s, radius: WH.radius[kind], count: num('smfcount', WH.count), color: '#F3A77E', rnd: -1, stay: 0.6, level: null, gate: 1, depth: num('smfdepth', WH.depth[kind] || 0) * (WH.depth[kind] > 0 ? 1 : 0), at: { x, z }, ...o });
    // the five lamp domes: three in the row (s 36, 48, 60), two at the foot of the theatre steps (s 214)
    const domes = (shared.lampDomes && shared.lampDomes.list) || town.lamps.filter((l) => l.kind === 'row' && l.y > -1);
    domes.forEach((l, i) => add('dome ' + i, 'dome', l.x, l.z, { lamp: i }));
    // three lancets of the church on the route's side, each on its own window's clock (heroes_b.js: WINDOW_CLOCK)
    const lancets = (shared.church && shared.church.lancets) || [];
    for (const name of WH.lancets) {
      const l = lancets.find((q) => q.name === name); if (!l) continue;
      const clock = l.win ? { rnd: (l.win * 0.618034) % 1, stay: (l.win * 0.754877) % 1 > 0.78 ? 1 : 0 } : { rnd: -1, stay: 0.2 };
      add('lancet ' + name, 'lancet', l.at.x, l.at.z, { color: l.jade ? '#4AA391' : '#F29A62', count: num('smfcount', WH.lancetCount), ...clock });
    }
    // five along the glass ridge, on the square's side of it, 0.4 m clear of the glass (which stands 0.99 m either side
    // of the ridge line at the water); where a pane is missing on that side a wheel stands before the gap. The hall
    // wakes and sleeps as one light at s 176.
    const g = shared.glassRidge;
    if (g && g.frame && g.frame.local) {
      const gaps = (g.gaps || []).map((q) => g.frame.local(q.x, q.z)).filter((q) => q[1] > 0).map((q) => q[0]);
      WH.glassAlong.forEach((ls, i) => {
        const by = gaps.filter((q) => Math.abs(q - ls) < 2.2); if (by.length) ls = Math.max(-20, Math.min(20, by.reduce((a, q) => a + q, 0) / by.length));
        const p = g.frame.at(ls, 0, WH.glassOut); add('glass ' + i, 'glass', p[0], p[2], { color: '#7ADCC6', s: 176 });
      });
    }
    // the loggia: under the vault, round the place where the bob kisses the lake
    if (shared.tower) { const p = shared.tower.point('loggia'); add('loggia', 'loggia', p.x, p.z, { s: plan.tower.s, stay: 0.9 }); }
    // ... and three over the lancets of the church's LEFT flank, for the rider who takes the left passage: the roof stands
    // 1.2 m clear between the two flanks and hides each one's wheels from the other side (a rider there had sixteen metres
    // of lit lancets under the gunwale and not a fly). The six lancet wheels are 150 flies each (they were three of 213: on
    // 3.8 square metres that was half as dense again as a dome's). They stand LAST in the list, so that wheels 0 to 13
    // keep the numbers the log gives them.
    for (const name of WH.lancetsLeft) {
      const l = lancets.find((q) => q.name === name); if (!l) continue;
      const clock = l.win ? { rnd: (l.win * 0.618034) % 1, stay: (l.win * 0.754877) % 1 > 0.78 ? 1 : 0 } : { rnd: -1, stay: 0.2 };
      add('lancet ' + name, 'lancet', l.at.x, l.at.z, { color: l.jade ? '#4AA391' : '#F29A62', count: num('smfcount', WH.lancetCount), ...clock });
    }
    const NW = defs.length;
    if (!NW) { note('no lamp, lancet, glass ridge or loggia was found to wheel over (were the set\'s modules skipped?): no sedge flies'); break flies; }

    const flyOpts = { size: num('smfsize', F.size), minPixels: num('smfpx', F.minPixels), cap: num('smfcap', F.cap), material: Q.get('smfcrisp') === '0' ? {} : { crisp: true } };
    // What no fly is drawn inside: the hull pushes a wheel 2.5 m from the boat's line, and beside the glass ridge that is
    // through the panes, into the lantern roof (beside the church: into the slates). Segments with a half width, in the
    // realm's own coordinates; a fly pushed into one is not there.
    const solids = { A: { value: [0, 1, 2, 3].map(() => new THREE.Vector4()) }, B: { value: [0, 1, 2, 3].map(() => new THREE.Vector4()) } }, solidList = [];
    const solid = (x0, z0, x1, z1, half) => { const i = solidList.length; if (i >= 4) return; solids.A.value[i].set(x0, z0, half, 0); solids.B.value[i].set(x1, z1, 0, 1); solidList.push({ x0, z0, x1, z1, half }); };
    { const g = shared.glassRidge, H = plan.hall;
      if (g && g.frame && g.frame.at) { const a = g.frame.at(-(g.length || 44) / 2 - 0.3, 0, 0), b = g.frame.at((g.length || 44) / 2 + 0.3, 0, 0); solid(a[0], a[2], b[0], b[2], (g.width || 2) / 2 + 0.12); }
      else { const a = at(H.s0, H.d), b = at(H.s1, H.d); solid(a.x, a.z, b.x, b.z, 1.15); }
      const C = plan.church, out = C.ridge / Math.tan(C.pitch * Math.PI / 180), a = at(C.s0, C.d), b = at(C.s1, C.d); solid(a.x, a.z, b.x, b.z, out + 0.12); }
    const inSolid = (x, z) => { for (const s of solidList) { const abx = s.x1 - s.x0, abz = s.z1 - s.z0, t = Math.max(0, Math.min(1, ((x - s.x0) * abx + (z - s.z0) * abz) / Math.max(1e-4, abx * abx + abz * abz))); if (Math.hypot(x - s.x0 - abx * t, z - s.z0 - abz * t) < s.half + 0.2) return true; } return false; };
    const uSmOff = { value: Array.from({ length: 24 }, () => new THREE.Vector2()) };      // (per wheel: from its light's true place to where it is drawn)
    const uSmGait = { value: new THREE.Vector4(num('smfrest', F.rest[0]), num('smfrests', F.rest[1]), 0, 0) }, uSmTone = { value: new THREE.Vector4(num('smfsit0', F.tone[0]), num('smfsit1', F.tone[1]), num('smffly0', F.tone[2]), num('smffly1', F.tone[3])) };
    const uSmFarU = { value: new THREE.Vector4(num('smfthin0', F.thin[0]), num('smfthin1', F.thin[1]), num('smfthink', F.thin[2]), num('smfthinb', F.thin[3])) };
    const WG = F.wing, uSmWing = { value: new THREE.Vector4(num('smfsweep', WG.sweep), num('smfdash', WG.dash), num('smfwiden', WG.widen), num('smffarpx', F.farPixels)) };
    // Pale and matte. The family multiplies a cream fly by a rose-gold light (and by the bow lantern's amber within its
    // reach), which in this town comes out a saturated orange: sparks. A caddis is cream whatever lamp is under it: it
    // takes the light's brightness and only a part of its hue. And its wings are drawn whole: stippled, at this size,
    // they are confetti.
    const uSmFly = { value: new THREE.Vector4(1.0, 0.86, 0.66, num('smfpale', F.pale)) };
    const pale = (h) => {
      if (RAW) return h;
      const m = h.object.material;
      if (m.fragmentShader.includes('//@fragmentPars') && m.fragmentShader.includes('//@light')) {
        // (its brown body is lifted to three fifths of its wings where a fly is a fleck: at four pixels a dark body is a
        // speck of dirt on a pale fleck; near, it is the dark dash between the wings that makes an insect of two pale
        // triangles. vSm: the town's fly's nearness and tone; the family's own fly has neither and is drawn as before.)
        const own = m.vertexShader.includes('varying vec3 vSm;');
        m.fragmentShader = m.fragmentShader.replace('//@fragmentPars', `uniform vec4 uSmFly; uniform vec3 uSmSit; ${own ? 'varying vec3 vSm;' : ''}\n    //@fragmentPars`).replace('//@light', `{ float smM = max(c.r, max(c.g, c.b)); c = mix(c, uSmFly.rgb * smM, uSmFly.w); float smB = clamp(0.5 / max(max(albedo.r, albedo.g), albedo.b), 1.0, 2.2); ${own ? 'c *= mix(smB, 1.0 + (smB - 1.0) * 0.3, vSm.x) * vSm.y * mix(uSmSit, vec3(1.0), vSm.z);' : 'c *= smB;'} }\n    //@light`);
        m.uniforms.uSmFly = uSmFly; m.uniforms.uSmSit = { value: new THREE.Color().setRGB(1.0, num('smfsitg', 0.8), num('smfsitb', 0.56)) }; m.needsUpdate = true;
      } else note('the sedge flies\' material has no //@light mark: they keep the family\'s colour');
      if (h.uniforms && h.uniforms.uPale && Q.get('smfstip') !== '1') h.uniforms.uPale.value.set(4, 5);
      return h;
    };
    // (the family writes nothing on the water here and is told of no touch: its sums of where a fly is are not this
    // module's; the rings are written below, from the town's own)
    const sedges = makeSedgeFlies(ctx, { ...flyOpts, ripples: false, onTouch: null,
      wheels: defs.map((d) => ({ position: [d.x, d.z], count: d.count, radius: d.radius, color: d.color, gain: F.gain })) });
    const own = RAW || Q.get('smfown') === '0' ? null : townFly(sedges, solids, uSmWing, uSmOff, uSmGait, uSmTone, uSmFarU);
    pale(sedges);                                           // (after the town's fly is laid in: the fragment reads what its vertex gives)
    // (a fly is above the water: it has no place in the engine's picture of what lies beneath it, where the water bent a
    // second fly out of every one that stood beside a ring: fine pale scratches round the wheel)
    { const obj = sedges.object, fam = obj.onBeforeRender, geo = obj.geometry;
      if (Q.get('smfpre') !== '1') obj.onBeforeRender = function (renderer, scene, camera, geometry, material, group) {
        if (fam) fam.call(this, renderer, scene, camera, geometry, material, group);
        if (renderer.getRenderTarget() === ctx.engine.pre) geo.instanceCount = 0;
      }; }
    shared.cast.sedges = sedges;

    // ---- each wheel's light
    const W = defs.map((d, i) => sedges.wheel(i)), GAIN = num('smfgain', F.gain), rule = sedges.rule, FAR = [num('smffar', F.far), num('smffar', F.far) + F.farOver];
    const lvl = (v) => (typeof v === 'function' ? v() : v);
    defs.forEach((d) => { d.light = new THREE.Color(d.color).lerp(PALE, 0.62); d.present = 1; d.lv = 1; d.away = null; });
    const ownLevel = (d) => (d.level == null ? light.level(d.s, d.x, d.z, d.rnd, d.stay) : lvl(d.level));
    // the light a wheel is in now: its own, or the one it was sent to (crossing: from the one to the other)
    const levelOf = (d) => { const a = d.away; if (!a) return ownLevel(d); const to = a.back ? ownLevel(d) : lvl(a.level); return a.k >= 1 ? to : a.from + (to - a.from) * a.k; };
    const depthOf = (d) => { const a = d.away; if (!a) return d.depth; const to = a.back ? d.depth : a.depth; return a.k >= 1 ? to : a.fromDepth + (to - a.fromDepth) * a.k; };      // how far under the water the light it is over now burns
    const colourOf = (d, out) => { const a = d.away; return a ? out.copy(a.fromColor).lerp(a.back ? d.light : a.color, Math.min(1, a.k)) : out.copy(d.light); };
    const which = (i) => (i === 'all' ? defs.map((_, k) => k) : typeof i === 'string' ? defs.map((d, k) => (d.kind === i || d.name === i ? k : -1)).filter((k) => k >= 0) : [i]);
    small.fade = (i, k, seconds = 3) => { for (const j of which(i)) if (defs[j]) stage.tween(defs[j], 'gate', k, seconds); return small; };
    // (cross: false, the default: the wheel thins away fly by fly where it is and gathers at the new light, `radius` wide
    // and `share` of its number there. cross: true: the whole wheel slides over the water, for a move of a metre or two.
    // seconds 0: it is there at once, for a cue's settle)
    const go = (i, d, x, z, seconds, cross, a, radius, share = 1, done) => {
      const fin = () => { if (done) done(); };
      if (cross === true && seconds > 0) {
        W[i].moveTo(x, z, seconds);
        if (radius && Math.abs(radius - W[i].radius) > 0.01) stage.tween((v) => { W[i].set({ radius: v }); }, W[i].radius, radius, seconds);
        stage.tween(a, 'k', 1, seconds).then(fin); return;
      }
      const arrive = () => { W[i].set(radius ? { x, z, radius } : { x, z }); a.k = 1; };
      if (!(seconds > 0)) { arrive(); stage.tween(d, 'gate', share, 0); fin(); return; }
      stage.tween(d, 'gate', 0, seconds * 0.45).then(() => { arrive(); stage.tween(d, 'gate', share, seconds * 0.55).then(fin); });
    };
    small.send = (i, o = {}) => {
      const d = defs[i]; if (!d || o.x == null || o.z == null) return small;
      d.away = { level: o.level ?? 1, depth: Math.max(0, o.depth ?? 0), fromDepth: depthOf(d), color: o.color ? new THREE.Color(o.color).lerp(PALE, 0.62) : colourOf(d, new THREE.Color()), from: levelOf(d), fromColor: colourOf(d, new THREE.Color()), k: 0, back: false };
      go(i, d, o.x, o.z, o.seconds ?? 6, o.cross, d.away, o.radius, o.share ?? 1);
      return small;
    };
    small.home = (i = 'all', seconds = 6, cross) => {
      for (const j of which(i)) {
        const d = defs[j]; if (!d || !d.away) continue;
        const a = d.away = { ...d.away, from: levelOf(d), fromDepth: depthOf(d), fromColor: colourOf(d, new THREE.Color()), k: 0, back: true };
        go(j, d, d.x, d.z, seconds, cross, a, d.radius, 1, () => { if (d.away === a) d.away = null; });
      }
      return small;
    };
    // ---- the flies over the risen lanterns (the page, the stroke, t 20 on: "the sedge flies leave the lamp domes for the
    // new lights: wherever a lantern comes within a metre of the surface a low wheel of them forms over it, flat on the
    // water, and the square is dotted with their touches. They do not rise."). small.toLanterns() begins it and
    // small.fromLanterns() ends it; between the two this module does the choosing: one wheel after another (never two in
    // step) thins away where it is and gathers, smaller, over a lantern that lies near the surface on open water near the
    // boat, no two of them close together; it keeps that lantern as it glides; when the lantern sinks its flies thin
    // with its light, and the wheel goes to another lantern, or home when none is left. The lanterns are the Deep
    // group's (shared.cast.lanterns: the lights family's nearSurface); without them nothing happens.
    { const LN = SMALL.lanterns, lan = small.lanterns = { on: false, wheels: [], held: 0, ...LN };
      const CAP = 640, ids = new Int32Array(CAP), xs = new Float32Array(CAP), ys = new Float32Array(CAP), zs = new Float32Array(CAP), of = [];
      let n = 0, tick = 0, gap = 0, told = false, turn = 0, logAt = num('smlogat', 6); const LOGLAN = Q.get('smlog') === 'lanterns';
      const gather = (x, y, z, i) => { if (n < CAP) { ids[n] = i; xs[n] = x; ys[n] = y; zs[n] = z; n++; } };
      const tw = shared.tower && shared.tower.point ? shared.tower.point('loggia') : null;
      const hullDist = (x, z) => { const b = ctx.boat, fx = -Math.sin(b.heading), fz = -Math.cos(b.heading), dx = x - b.x, dz = z - b.z, t = Math.max(-1.7, Math.min(2.6, dx * fx + dz * fz)); return Math.hypot(dx - fx * t, dz - fz * t); };
      const open = (x, z) => { const q = town.sd(x, z); return Math.abs(q.d) < town.hw(q.s) - lan.edge && !inSolid(x, z) && (!tw || Math.hypot(x - tw.x, z - tw.z) > lan.tower); };
      const top = (y) => Math.max(0.15, -y - 0.2);                 // how far under the water a lantern's crown lies (its middle is at y)
      small.toLanterns = (o = {}) => {
        const { wheels, ...rest } = o; Object.assign(lan, rest);
        lan.wheels = (wheels != null ? [].concat(wheels).flatMap((w) => which(w)) : defs.map((d, k) => (d.kind === 'loggia' ? -1 : k)).filter((k) => k >= 0)).filter((k) => defs[k]);
        lan.on = true; tick = 0; gap = 0; return small;
      };
      small.fromLanterns = (seconds = 8) => {
        lan.on = false; let k = 0;
        for (const j of lan.wheels) if (of[j] || (defs[j].away && !defs[j].away.back)) { of[j] = null; const jj = j; stage.after(k++ * lan.stagger * 0.5, () => { if (!lan.on && defs[jj].away && !defs[jj].away.back) small.home(jj, seconds); }); }
        lan.held = 0; return small;
      };
      each('the flies over the lanterns', (dt) => {
        if (!lan.on) return;
        gap -= dt; tick -= dt; if (tick > 0) return; tick = lan.every;
        const h = shared.cast.lanterns;
        if (!h || typeof h.nearSurface !== 'function') { if (!told) { told = true; note('small.toLanterns: shared.cast.lanterns (the Deep group\'s) is not there: the wheels stay over their own lights'); } return; }
        n = 0; h.nearSurface(lan.lose, gather);
        let held = 0;
        for (const j of lan.wheels) {                               // the wheels that have a lantern: keep it, or let it go
          const e = of[j]; if (!e) continue;
          let c = -1; for (let q = 0; q < n; q++) if (ids[q] === e.id) { c = q; break; }
          if (c >= 0) { e.x = xs[c]; e.y = ys[c]; e.z = zs[c]; } else e.y = Math.min(e.y, -lan.lose);
          const d = defs[j], a = d.away;
          if (c < 0 || !a || a.back || boatDist(e.x, e.z) > lan.within + 9) { of[j] = null; continue; }
          held++;
          if (a.k >= 1) {                                           // it is there: it keeps its lantern as the lantern glides
            a.depth = top(e.y);
            const dx = e.x - W[j].x, dz = e.z - W[j].z, dl = Math.hypot(dx, dz), st = Math.min(dl, lan.follow * lan.every);
            if (dl > 0.03) W[j].set({ x: W[j].x + dx / dl * st, z: W[j].z + dz / dl * st });
          }
        }
        lan.held = held;
        if (LOGLAN && ctx.time >= logAt) { logAt = ctx.time + num('smlogevery', 5); note('&smlog=lanterns t ' + ctx.time.toFixed(1) + ': ' + n + ' within ' + lan.lose + ' m of the surface; held ' + held + ': ' + lan.wheels.filter((j) => of[j]).map((j) => `${j}[${of[j].x.toFixed(2)},${of[j].z.toFixed(2)} y ${of[j].y.toFixed(2)} | wheel ${W[j].x.toFixed(2)},${W[j].z.toFixed(2)} k ${defs[j].away ? defs[j].away.k : -1} gate ${defs[j].gate.toFixed(2)} lv ${defs[j].lv.toFixed(2)}]`).join(' ')); }
        if (gap > 0) return;
        for (let u = 0; u < lan.wheels.length; u++) {               // one wheel without a lantern sets out, or goes home
          const j = lan.wheels[(u + turn) % lan.wheels.length]; if (of[j]) continue;
          let best = -1, bd = lan.within;
          for (let q = 0; q < n; q++) {
            if (ys[q] < -lan.depth) continue;
            const x = xs[q], z = zs[q], dd = boatDist(x, z); if (dd >= bd || hullDist(x, z) < lan.hull || !open(x, z)) continue;
            let free = true; for (const o2 of of) if (o2 && Math.hypot(o2.x - x, o2.z - z) < lan.apart) { free = false; break; }
            if (free) { best = q; bd = dd; }
          }
          if (best >= 0) {
            const e = of[j] = { id: ids[best], x: xs[best], y: ys[best], z: zs[best] };
            small.send(j, { x: e.x, z: e.z, seconds: lan.seconds, color: lan.color, depth: top(e.y), radius: lan.radius, share: lan.share,
              level: () => lan.level * smooth(-lan.lose, -lan.depth, e.y) });
            gap = lan.stagger; turn = (u + turn + 1) % lan.wheels.length; return;
          }
          if (defs[j].away && !defs[j].away.back) { small.home(j, lan.seconds); gap = lan.stagger; turn = (u + turn + 1) % lan.wheels.length; return; }
        }
      });
    }
    // ---- where a wheel is drawn. This water shows what lies beneath it straight along the eye's line (it bends things
    // only by its ripples), so a lamp head 0.4 m down is seen a quarter of the way toward the rider from where it
    // stands: two metres short from eight, five from twenty. The lights family's lamp domes are drawn there for that
    // reason (lights.js, makeLampDomes: "the dome then sits round the lamp as the picture shows it"). A wheel drawn at
    // the lamp's true place lay on dark water beyond its light, a line of sparks over nothing; so a wheel is drawn
    // where the sight line to the top of its light crosses the surface, as the dome is, and its rings are written
    // there. d.at is that place (live); d.x, d.z stay the light's own. A light above the water has depth 0.
    const eye = new THREE.Vector3(), SHIFT = Q.get('smfshift') !== '0';
    // (A light whose sight line is cut by a thing that stands in the water is not seen at all, and neither is its wheel
    // behind that thing: it stays at its light's true place. Found from the church's LEFT passage: the three wheels of
    // the right flank's lancets were drawn a quarter of the way toward the rider, which is through the roof and out
    // on the near side of it, over the left flank's water, and slid along it as the boat went. 1 = in plain sight;
    // eased over the last three metres of the roof, where a wheel can be half in sight round its end.)
    const inSight = (ex, ez, wx, wz) => {
      let k = 1; const rx = wx - ex, rz = wz - ez;
      for (const s of solidList) {
        const sx = s.x1 - s.x0, sz = s.z1 - s.z0, den = rx * sz - rz * sx; if (Math.abs(den) < 1e-6) continue;
        const qx = s.x0 - ex, qz = s.z0 - ez, t = (qx * sz - qz * sx) / den, u = (qx * rz - qz * rx) / den;
        if (t > 0 && t < 1 && u > 0 && u < 1) k = Math.min(k, 1 - smooth(0, 3, Math.min(u, 1 - u) * Math.hypot(sx, sz)));
      }
      return k;
    };
    const place = () => {
      eye.copy(sh.uCameraPos.value); if (ctx.group) ctx.group.worldToLocal(eye);
      const ey = Math.max(0.3, eye.y);
      for (let i = 0; i < NW; i++) {
        const d = defs[i], w = W[i], h = SHIFT ? depthOf(d) : 0, o = uSmOff.value[i];
        let k = h > 0 ? h / (ey + h) : 0; if (k > 0) k *= inSight(eye.x, eye.z, w.x, w.z);
        o.set((eye.x - w.x) * k, (eye.z - w.z) * k); d.at.x = w.x + o.x; d.at.z = w.z + o.y;
      }
    };
    const tmpC = new THREE.Color();
    // (the family lays all its lights again, at the wheels' true places, whenever a wheel is moved or thinned: what this
    // module knows of each light is written over them every time, and once more each frame)
    const relight = () => {
      for (let i = 0; i < NW; i++) {
        const d = defs[i], L = rule.lights[i]; if (!L) continue;
        colourOf(d, tmpC); L.color.copy(tmpC); L.gain = GAIN * d.present * Math.min(d.lv, 1.3); L.x = d.at.x; L.z = d.at.z;
      }
      rule.push();
    };
    { const set0 = rule.setLights; rule.setLights = (list) => { set0(list); relight(); }; }
    each('the sedge wheels\' light', () => {
      place();
      // how many flies there are at each wheel (the family's `strength`: set only when it has changed, since setting it
      // makes the family lay all its lights again), then what light they are in. None over a light that sleeps; and none
      // far off: the family draws a far fly no smaller than five pixels, which at sixty metres is a spark on the water
      // where no insect could be seen (the page: seen to about 30 m).
      for (let i = 0; i < NW; i++) {
        const d = defs[i]; d.lv = levelOf(d);
        const pr = smooth(0.2, 0.5, d.lv) * Math.max(0, Math.min(1, d.gate)) * (1 - smooth(FAR[0], FAR[1], boatDist(W[i].x, W[i].z)));
        if (Math.abs(pr - d.present) > 0.03 || (pr !== d.present && (pr === 0 || pr === 1))) { d.present = pr; W[i].strength = pr; }
      }
      relight();
    });

    // ---- the flies on the water. A fly that comes down writes a pin ring; one that sets off on a dash writes a slighter
    // one and two more along the dash, so that the water itself draws its V and the lamp beneath trembles where they
    // touch. Only within the water's fine window round the boat (a pin ring lives nowhere else), only where the fly is
    // drawn (not where the hull has pushed it from, not inside the glass), and bounded: a wheel writes about thirty a
    // second at most, each of them slight.
    const writers = [];
    if (own) writers.push({ own, flies: sedges, wheels: defs, state: [] });
    { const LD = SMALL.land, KK = SMALL.kick, REACH = num('smfreach', SMALL.reach), trail = [];
      const landS = num('smfland', LD.strength), kickS = num('smfkick', KK.strength), landN = num('smflandn', LD.aSecond), kickN = num('smfkickn', KK.aSecond), landR = num('smflandr', LD.radius), kickR = num('smfkickr', KK.radius), kickT = num('smfkickt', KK.trail);
      let tPrev = -1, turn = 0, sedgeTokens = 1;
      const hull = { x: 0, z: 0, fx: 0, fz: 0 };
      const clear = (x, z) => {                              // is a fly drawn where its sums put it? (not if the hull has pushed it away, nor inside a solid thing, nor beyond the fine water)
        const dx = x - hull.x, dz = z - hull.z, a = Math.max(-1.7, Math.min(2.6, dx * hull.fx + dz * hull.fz));
        return Math.hypot(dx - hull.fx * a, dz - hull.fz * a) > 2.7 && dx * dx + dz * dz < REACH * REACH && !inSolid(x, z);
      };
      each('the flies on the water', (dt) => {
        const t = ctx.time, boat = ctx.boat; hull.x = boat.x; hull.z = boat.z; hull.fx = -Math.sin(boat.heading); hull.fz = -Math.cos(boat.heading);
        sedgeTokens = Math.min(1, sedgeTokens + dt * 3); turn++;
        if (tPrev < 0 || t - tPrev > 0.5 || t < tPrev) { tPrev = t; for (const w of writers) for (const s of w.state) if (s) s.fresh = true; trail.length = 0; return; }
        for (let a = trail.length - 1; a >= 0; a--) {                               // the dashes already begun: their next marks
          const e = trail[a]; if (t < e.next) continue;
          const f = e.own.at(e.k);
          if (f.move > 0.5 && f.fly < 0.2 && clear(f.x, f.z)) ctx.water.ripple(f.x, f.z, kickS * 0.8, kickR);
          e.next += KK.every; if (--e.left <= 0) trail.splice(a, 1);
        }
        for (const w of writers) {
          const U = w.flies.uniforms;
          for (let i = 0; i < w.own.lists.length; i++) {
            const list = w.own.lists[i]; if (!list) continue;
            const st = w.state[i] || (w.state[i] = { q: new Int32Array(list.length), land: 0, kick: 0, fresh: true, phase: 0 });
            const Wv = U.uWheel.value[i], Kv = U.uWheelK.value[i];
            if ((w.wheels[i] ? w.wheels[i].present : 1) < 0.3 || Kv.y > 0.9 || boatDist(w.wheels[i] ? w.wheels[i].at.x : Wv.x, w.wheels[i] ? w.wheels[i].at.z : Wv.y) > REACH + Wv.z) { st.fresh = true; continue; }
            const few = w.wheels[i] ? Math.max(0, Math.min(1, w.wheels[i].gate)) : 1;      // (a wheel thinned to a share of itself, as over a lantern, writes that share: thirteen full wheels' worth of rings round the boat shook every lantern under them out of its shape)
            st.land = Math.min(1.5, st.land + dt * landN * few); st.kick = Math.min(1.5, st.kick + dt * kickN * few);
            const n = list.length, off = (turn * 37) % n;
            for (let j = 0; j < n; j++) {
              const jj = (j + off) % n, k = list[jj], f = w.own.at(k), started = f.q !== st.q[jj];
              st.q[jj] = f.q;
              if (st.fresh) continue;                        // (the first frame within reach: nothing has "just" happened)
              if (st.land >= 1 && w.own.land(k, Wv.w) !== w.own.land(k, st.phase)) {
                if (!clear(f.x, f.z)) continue;
                st.land -= 1; ctx.water.ripple(f.x, f.z, landS, landR);
                if (sedgeTokens >= 1) { sedgeTokens -= 1; touched(f.x, f.z, 'sedge'); }
              } else if (started && st.kick >= 1 && f.move > 0.5 && f.fly < 0.2) {
                if (!clear(f.x, f.z)) continue;
                st.kick -= 1; ctx.water.ripple(f.x, f.z, kickS, kickR);
                if (kickT > 0 && trail.length < 48) trail.push({ own: w.own, k, next: t + KK.every, left: kickT });
              }
            }
            st.fresh = false; st.phase = Wv.w;
          }
        }
        tPrev = t;
      });
    }

    // ---- the far wheels' rings (SMALL.afar): one wider ring now and then under a lit wheel that is beyond the reach of
    // pin rings, where its flies are drawn; none while they lie settled, none inside a thing that stands in the water
    { const AF = SMALL.afar, ra = ctx.rng(919), due = defs.map(() => AF.every[0] + (AF.every[1] - AF.every[0]) * ra()), afS = num('smfafar', AF.strength), afR = num('smfafarr', AF.radius);
      if (afS > 0) each('the far wheels\' rings', (dt) => {
        const settled = sedges.uniforms && sedges.uniforms.uWheelK ? sedges.uniforms.uWheelK.value[0].y : 0; if (settled > 0.5) return;
        for (let i = 0; i < NW; i++) {
          const d = defs[i]; if (d.present < 0.5) continue;
          const near = boatDist(d.at.x, d.at.z); if (near < AF.from || near > AF.to) continue;
          if ((due[i] -= dt) > 0) continue;
          due[i] = (AF.every[0] + (AF.every[1] - AF.every[0]) * ra()) / Math.max(0.3, Math.min(1, d.gate));
          const a = ra() * 6.2832, r = W[i].radius * 0.8 * Math.sqrt(ra()), x = d.at.x + Math.cos(a) * r, z = d.at.z + Math.sin(a) * r;
          if (!inSolid(x, z)) ctx.water.ripple(x, z, afS * (0.7 + 0.6 * ra()), afR * (0.8 + 0.4 * ra()));
        }
      }); }

    // ---- the flies at the prow lantern. The page: "a dozen at a time drift into the prow lantern's light and out". A
    // caddis at a lantern is a small moth at a flame, and the insects family has those, reviewed in motion: they come
    // in on loops that tighten by fits, are thrown out and come in again, never on rails (makeMoths: the lamp may
    // move, and they keep it, because they are in the air). So the lantern's flies are fourteen of the family's small
    // moth in the sedge fly's cream, half its size: they set out from the rim of a lit wheel while the lantern passes
    // within `range` of it, a few at a time, and fall back toward that wheel when it is out of range, or when the
    // wheels settle. They are lit from beneath while they are over a wheel's light, by the lantern when they are at
    // it, and between the two there is nothing to see: a fly that no light reaches is not drawn.
    // small.bow.on = false keeps them home.
    if (Q.get('smfbow') !== '0') {
      const BW = SMALL.bow, BOW = small.bow = { on: true, range: BW.range, present: 0, from: -1, hold: false }, lp = new THREE.Vector3();
      const flame = () => {                                        // the lantern's flame in the realm's own coordinates; their ways turn a hand outboard of it and a little above, clear of the bow's planks
        const boat = ctx.boat, model = ctx.engine.boat && ctx.engine.boat.model, fx = -Math.sin(boat.heading), fz = -Math.cos(boat.heading);
        if (model && model.light) { model.light.getWorldPosition(lp); if (ctx.group) ctx.group.worldToLocal(lp); } else lp.set(boat.x + fx * 2.3 - fz * 0.335, 0.765, boat.z + fz * 2.3 + fx * 0.335);
        lp.x += -fz * BW.out; lp.z += fx * BW.out; lp.y += BW.up;
        return lp;
      };
      const moths = await makeMoths(ctx, { species: 'lamp', size: num('smfbsize', BW.size), minPixels: num('smfbpx', BW.minPixels), color: '#f6e3c8', hind: '#eadcc6', rest: 'roof', beat: 11, exact: true, seed: 43,
        lamps: [{ at: flame, seat: false }], count: 0, spare: BW.count, orbit: BW.orbit, flameColor: '#ffb45e', flameGain: num('smfbflame', BW.flame), wake: 0,
        lit: { rule: 'under', lights: defs.map((d) => ({ x: d.x, z: d.z, radius: d.radius * 1.35, color: '#f3a77e', gain: 0 })), dark: 0, height: 0.9, cap: num('smfbcap', BW.cap) },
        material: Q.get('smfbcrisp') === '1' ? { crisp: true } : {} });
      // a fly that no light reaches is not there: over a wheel's light, or within two metres of the lantern, or nothing
      { const m = moths.object.material, find = 'vFl = flame.w * (1.0 - smoothstep(0.1, 1.4, distance(c, flame.xyz)));';
        if (!RAW && m.vertexShader.includes(find)) { m.vertexShader = m.vertexShader.replace(find, () => find + `
        { float smSeen = max(flame.w * (1.0 - smoothstep(${BW.seen[0].toFixed(2)}, ${BW.seen[1].toFixed(2)}, distance(c, flame.xyz))), liLit(c).a); transformed = c + (transformed - c) * smoothstep(0.03, 0.25, smSeen); }`); m.needsUpdate = true; }
        else if (!RAW) note('the insects family\'s moth has changed: the lantern\'s flies are seen as dark specks on their way between a wheel and the lantern'); }
      // (pale and matte like the wheels' flies: cream times the lantern's amber is an orange spark beside a flame)
      { const m = moths.object.material;
        if (!RAW && m.fragmentShader.includes('//@fragmentPars') && m.fragmentShader.includes('//@light')) {
          m.fragmentShader = m.fragmentShader.replace('//@fragmentPars', 'uniform vec4 uSmFly;\n    //@fragmentPars').replace('//@light', '{ float smM = max(c.r, max(c.g, c.b)); c = mix(c, uSmFly.rgb * smM, uSmFly.w); }\n    //@light');
          m.uniforms.uSmFly = { value: new THREE.Vector4(1.0, 0.86, 0.66, num('smfbpale', BW.pale)) }; m.needsUpdate = true;
        } }
      BOW.flies = moths;
      const L0 = moths.lamp(0), ML = moths.rule.lights || [], SL = rule.lights; let wait = 0, lost = 0;
      { const settle0 = sedges.settle; sedges.settle = (k, seconds) => { BOW.hold = k > 0.5; return settle0(k, seconds); }; }      // (when the wheels settle, the lantern's flies go down to the water with them)
      each('the flies at the prow lantern', (dt) => {
        const model = ctx.engine.boat && ctx.engine.boat.model, lit = model && model.lit != null ? Math.max(0, Math.min(1, model.lit)) : 1, q = flame();
        L0.lit = lit;
        for (let i = 0; i < ML.length && i < SL.length; i++) { const a = ML[i], b = SL[i]; a.x = b.x; a.z = b.z; a.radius = b.radius; a.gain = b.gain; a.on = b.on; a.color.copy(b.color); }      // (they are lit from beneath by the wheels' own lights, as the wheels' flies are)
        if (ML.length) moths.rule.push();
        let best = -1, bd = BOW.range;
        if (BOW.on && !BOW.hold && lit > 0.3) for (let i = 0; i < NW; i++) { if (defs[i].present < 0.5) continue; const dd = Math.hypot(defs[i].at.x - q.x, defs[i].at.z - q.z); if (dd < bd) { bd = dd; best = i; } }
        BOW.present = L0.moths.length; wait -= dt;
        if (best >= 0) {                                           // a few at a time set out from the rim of that wheel, on the lantern's side of it
          lost = 0; BOW.from = best;
          if (wait <= 0 && L0.moths.length < BW.count) {
            const w = defs[best].at, wr = W[best].radius, dx = q.x - w.x, dz = q.z - w.z, dl = Math.hypot(dx, dz) || 1;
            moths.arrive(0, BW.party, { seconds: BW.arrive, from: [w.x + dx / dl * wr * 0.8, 0.12, w.z + dz / dl * wr * 0.8] }); wait = BW.every;
          }
        } else if ((lost += dt) > BW.linger && L0.moths.length && wait <= 0) {      // out of range for a while: they fall back toward the wheel they came from (it lies astern by then), and are gone
          const w = BOW.from >= 0 ? defs[BOW.from].at : null;
          moths.leave(0, { seconds: BW.leave, to: w ? [w.x, 0.12, w.z] : null }); wait = 1;
        }
      });
    }

    // ---- the loggia: the bob sweeps the wheel's own water every three seconds, a gilt lens 1.1 m across. The flies give
    // it room: a hole that follows it (the family's `part`), written only while the boat is near enough to see it.
    { const clock = shared.clock, bobAt = new THREE.Vector3(), lg = defs.findIndex((d) => d.kind === 'loggia'); let wait = 0;
      if (lg >= 0 && clock && clock.bob && Q.get('smfbob') !== '0') each('the hole round the bob', (dt) => {
        wait -= dt; if (wait > 0) return; wait = 0.2;
        const d = defs[lg]; if (d.present < 0.05 || boatDist(d.x, d.z) > 45) return;
        clock.bob(bobAt); if (bobAt.y < 1.6) sedges.part(bobAt.x, 0.3, bobAt.z, 0.72, 0.45);
      }); }

    // ---- developer switches for looking at the staging's controls before there is a staging (the cues themselves are
    // the staging's): &smtest=warning  the flies settle at 2 s and lift again at 8 s;  &smtest=send  the glass ridge's
    // five wheels and the loggia's cross to six places round the boat at 2 s, as to risen lanterns, and go home at 16 s
    if (Q.has('smtest')) {
      const t = Q.get('smtest');
      if (t === 'warning') { stage.after(2, () => sedges.settle(1, 2)); stage.after(8, () => sedges.settle(0, 3)); }
      if (t === 'lanterns') { stage.after(num('smtestat', 1), () => small.toLanterns()); if (num('smtestback', 0) > 0) stage.after(num('smtestback', 0), () => small.fromLanterns()); }      // (with &dprisen=75: the Deep group's lanterns up)
      if (t === 'send' || t === 'away') {                     // (send: they slide across the water; away: they leave one by one and gather at the new lights)
        const idx = defs.map((d, i) => (d.kind === 'glass' || d.kind === 'loggia' ? i : -1)).filter((i) => i >= 0);
        stage.after(2, () => idx.forEach((i, k) => { const a = k / idx.length * 6.2832 + 0.4, r = 5 + 2.5 * (k % 3); small.send(i, { x: ctx.boat.x + Math.cos(a) * r, z: ctx.boat.z + Math.sin(a) * r, seconds: 6, color: '#F3A77E', level: 1, cross: t === 'send' }); }));
        stage.after(16, () => small.home('all', 6, t === 'send'));
      }
    }
  }

  // &smtest=dive: a sheath as a diving cormorant would leave it, until there is a cormorant: from 2 s on, for 7 s, a
  // point 1.2 to 2.4 m under the surface travels 12 m at 1.7 m/s across the water ahead of the boat, to its left,
  // and lets go of five beads every fifth of a second (this is what the Birds group calls: shared.cast.bubbles.burst)
  if (Q.get('smtest') === 'dive' && shared.cast.bubbles) {
    const b0 = { x: ctx.boat.x, z: ctx.boat.z, h: ctx.boat.heading }, fx = -Math.sin(b0.h), fz = -Math.cos(b0.h); let acc = 0;
    each('the test dive', (dt) => {
      const u = ctx.time - 2; if (u < 0 || u > 7) return;
      acc += dt; if (acc < 0.2) return; acc = 0;
      const along = 3 + 1.7 * u, side = num('smdiveside', -4.5) - 0.6 * Math.sin(u * 0.9);              // metres ahead of the boat's middle, metres to its right (negative: left)
      shared.cast.bubbles.burst(b0.x + fx * along - fz * side, -(1.2 + 1.2 * Math.sin(Math.min(1, u / 7) * Math.PI)), b0.z + fz * along + fx * side, 5, 0.25);
    });
  }

  // &smfov=<degrees>: a long lens, to look at a small thing where it is (the ride's is 60 degrees top to bottom). For
  // form and motion only: every floor on the screen is a number of pixels, and a long lens lies about them.
  { const fov = num('smfov', 0); if (fov > 0) each('the long lens', () => { const c = ctx.engine.camera; if (c.fov !== fov) { c.fov = fov; c.updateProjectionMatrix(); } }); }

  if (Q.has('smlog') && Q.get('smlog') !== 'lanterns') {
    const f2 = (v) => (Math.round(v * 100) / 100);
    const sd = (x, z) => { const q = town.sd(x, z); return `s ${f2(q.s)} d ${f2(q.d)}`; };
    const lines = [];
    if (Q.get('smlog') === 'pots') { const pp = (shared.pots || []).map((p, i) => `${i}:${sd(p.x, p.z)} y ${f2(p.y)}${p.clear ? ' C' : ''}`); for (let i = 0; i < pp.length; i += 7) lines.push('pots ' + pp.slice(i, i + 7).join(' | ')); }
    lines.push('wheels: ' + small.wheels.map((w, i) => `${i} ${w.name} [${sd(w.x, w.z)}] r ${w.radius}`).join(' | '));
    lines.push('chains: ' + small.chains.map((c) => `${c.kind} [s ${f2(c.s)} d ${f2(c.d)} y ${f2(c.y)}]`).join(' | '));
    const g = shared.glassRidge;
    if (g && g.frame && g.frame.local) lines.push('glass (ls, ld in its own frame): gaps ' + g.gaps.map((p) => `[${g.frame.local(p.x, p.z).map(f2).join(', ')}]`).join(' '));
    lines.push('lights: domes ' + ((shared.lampDomes && shared.lampDomes.list) || []).map((l) => `[${sd(l.x, l.z)} y ${f2(l.y)}]`).join(' ') + ' | lancets ' + ((shared.church && shared.church.lancets) || []).map((l) => `${l.name} y ${f2(l.at.y)}`).join(' '));
    lines.push('counts: flies ' + (shared.cast.sedges ? shared.cast.sedges.count : 0) + (small.bow && small.bow.flies ? ' + ' + small.bow.flies.count : '') + ', beads ' + (shared.cast.bubbles ? shared.cast.bubbles.count : 0) + ', motes ' + (shared.cast.motes ? shared.cast.motes.count : 0));
    lines.push('cast keys: ' + Object.keys(shared.cast).join(',') + ' | shared keys: ' + Object.keys(shared).join(','));
    for (const l of lines) note('&smlog: ' + l);
  }
  return { update(dt) { for (const f of updates) f(dt); } };
}
