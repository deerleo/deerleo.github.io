// The answering sea: the cast, group "Deep" (stage 3; docs/build/sea/3-cast-deep.md). What lives under the keel:
//
//   small bells   2,600 medusae of 0.25 to 0.45 m (the lights family's makeMedusae): few from the black reach to the
//                 gate, then the galaxy under the sound, from 1.4 to 22 m down. Each pulses on its own time, all sway
//                 on the swell's orbit, and the hull (a dolphin, the whale) wakes those it comes within 5 m of
//   great ones    nine medusae with bells of 1.4 to 2.0 m and 9 m of arms and tentacles (makeGreatMedusae), at the
//                 page's nine places
//   the far galaxy   a bell is a thing only near the boat (the page: "as objects within about 6 m, as glimmer beyond
//                 10 m"). Beyond that it is its light alone: a soft level dab of violet where the bell is SEEN through
//                 the surface, on the bell's own clock, never under six pixels wide; dimmer and bluer the more water
//                 lies over it, hidden by the back of a swell, gone by some fifty metres (the galaxy lies under and
//                 about the keel and recedes into the dark); broken by the marks that lie on the surface over it
//                 (shared.sea.fleck: the area's own). One draw call for all of them, this module's own
//   shoals        eight balls of 600 fish drawn as light (the fish family's makeSchool, look 'light'), turning once in
//                 20 s, each bursting when its own cause arrives
//
// Everything this module gives staging is under shared.cast.deep: see the end of build(). It plays no sound: every
// sound has an event (deep.on(name, fn)).
//
// Numbers: DEEP, below (plan.js is being edited by the set's people: this group keeps its numbers here).
// Switches for looking: &deep=bells,great,shoals,far builds some of its parts only; &deepsee=6,11 tries other distances
// for the change from thing to light; &deepburst=<k>:<seconds> bursts shoal k (the page's number, 1 to 8) that many
// seconds in; &deepwake=<seconds> wakes every bell within 30 m of the boat then; &deeptune=far.gain:2,bells.see.0:7
// tries other numbers of DEEP; &deepbare=1 builds nothing of the group and takes the kit's stand-ins out (the baseline
// for its cost).
// (9 November: the second pass, the bells drawn as light, is this file; there is no copy beside it any more. docs/build/sea/6-deep.md)
import * as THREE from 'three';
import { makeMedusae, makeGreatMedusae } from '../../engine/life/jellies.js';
import { makeSchool } from '../../engine/life/fish.js';
import { WATER_GLSL, waterUniforms } from '../../engine/water-final.js';
import { FOG_PARS } from '../../engine/kit.js';
import { removeStandIn } from '../../engine/modules.js';
import { SEA_CORE } from './light.js';

const DEEP = {
  litLift: 0.7,                 // how much brighter the bells that are things are under the lit sea (the sea's L where the boat is): they hang under rings and flecks there
  glance: [0.5, 0.2, 0.55],     // a bell that is a thing, seen at a low glance: what is left of its light, and the sines of the glance between which (the water's mirror lies over it there: a cluster of bells ten degrees under the horizon stood as bright as the one beside the boat, purple caps on the sea)
  grow: 0.6,                    // a bell giving way to its light keeps its size until this much of it is left a thing, then draws in on its middle
  flare: [0.4, 1.5, 0.78, 0.97], // a woken bell: what its dome and its arms keep of the family's flare (0.4 where the family gives 1.5 times more), and from where on the bell (0 crown .. 1 margin) the family's whole flare stands: the margin flares, the dome stirs
  seen: 1,                      // how much of the surface's law every bell is drawn with (1: as the eye sees it through the water; 0: along the straight line, as the engine draws things beneath)
  // (fourth holder) a bell is glass: the film of its wall seen square on; how sharply its light gathers where the sight runs along the wall, and how much; its canals; its
  // four-lobed stomach; its margin; how far the margin goes to the cold colour at the pulse; the hot edge of a woken one
  glass: { film: 0.035, limbPow: 2.0, limb: 0.55, canal: 0.22, stomach: 0.3, margin: 0.55, cold: 1.0, hot: 0.4 },
  arm: [1.2, 1.5],              // what the family's light of an arm and of a tentacle is multiplied by, now that they are light added to the picture (a thread is soft across: its middle 1.5 times)
  wob: [0.5, 0.03, 1],          // how far the living water's slope bends the sight to a thing (metres a metre of seen depth, for a slope of one); the breath of water at rest; in depth it lies this share of the way to where its light leaves the water
  // (9 November) in depth every light of this module lies `under` metres below the water where ITS OWN sight enters the sea (the swell's height there, not over the bell's own
  // place some metres on). Before, a far light stood up to a third of a metre too high in depth: nearer than the boat's planking above the waterline, and it was drawn on the
  // inside of the hull beside the rider (looking down over the gunwale: violet dabs on the planks)
  under: 0.15,
  // reduced motion: a pulse takes this many times longer, and the bell closes this share of the way (the family halves the hop and the sway by itself)
  calm: { period: 1.5, close: 0.6 },
  bells: {
    // the galaxy under the sound: how many, metres along, the widest they lie (d, left and right), depths, and where the field thins away (d)
    // lane, wide: they are thickest within `lane` metres of the composed line, where the boat is carried (a bell is a thing only within a few metres of the eye), and
    // `wide` of that far out to the sides (where they are seen as light)
    // drift: they gather in drifts (how thin the water between is, as a share of a drift's own; the two levels of the drift field between which a drift comes up)
    sound: { count: 2300, s: [106, 196], d: [-54, 40], depth: [1.6, 22], thinLeft: [-26, -54], thinRight: [28, 40], lane: 15, wide: 0.3, drift: [0.2, 0.36, 0.6] },
    // before the gate: few (the black reach is bare water; the galaxy must be news at s 106)
    thin: { count: 300, s: [26, 104], d: 34, depth: [1.6, 8.6], rise: 4 },      // rise: how many times denser at the gate's face than in the reach
    apart: 0.9,                 // metres no two bells hang nearer than (one seen through another is a bell with two storeys)
    cell: 16,                   // metres along and across the route to a system: a system is drawn only while the eye is within reach of it. (9 November: 24 before. A cell in reach sends every bell of it, and only those within eleven metres of the eye are things: with cells of 16 m a third fewer are sent for two draw calls more; of 12 m, 45 per cent fewer for six more)
    clear: 1.5,                 // metres under STILL water that the family keeps the top of a bell at the top of its hop. (Third holder: 1.4 before. The page's 1.2 m is from the water AS IT STANDS: a bell rides the swell's circle at its own depth, a fifth of a metre less than the surface over it does; it wanders 0.08 m up, and woken it hops a little higher than the family allows for: 1.2 + 0.2 + 0.08 + 0.03)
    sides: 12,                  // the director's twelve-sided dome
    period: [3.2, 5.5],         // seconds a pulse (the family's own; the bells that are their light alone, which this module gives their clocks, keep the same)
    glow: [0.36, 0.78], flare: 2.5, near: 5,
    wakeBy: { dolphin: 2 },     // metres round the dolphins' lead that count as the animal (the family adds its own 5 m to it)
    see: [6, 11],               // metres from the eye: a bell is a thing to the first, and only its light from the second
    broken: [0.85, 3.5, 9, 0.34],   // the surface between breaks its light: how much at most, from and to which distance from the eye (metres), and what shows between the marks
    cap: [0.5, 0.3, 0.35, 0],    // above the first its light rises only by the second (a woken bell flares in its own colours, not to white); what the arms keep of theirs at a low glance; the least light a part of a bell that is giving way to its dab must have to be drawn
  },
  great: {
    sizes: [1.6, 2.0, 1.5, 1.8, 1.4, 1.9, 1.7, 1.5, 2.0],
    lobes: 32, tentacles: 24,   // the page's 16 lappets and 24 tentacles is not an animal: a sea nettle has 32 and 24 (the family's default); 16 and 8 is the other true pattern
    period: [6, 7],             // seconds a pulse (the family's own: contraction 0.9 s, glide 2 s, relaxation 3 s)
    clear: 2.0, keep: 3.4,      // clear: as for the small bells, and a great one wanders 0.38 m up and down (a quarter of its 1.5 m) and hops 0.2 of its radius more when woken than the family allows for: 1.2 + 0.2 + 0.38 + 0.2. So the nine hang 0.1 to 0.7 m deeper than the page's depths (which were written for a swell of 0.65 m), and no part of one ever comes within 1.2 m of the water as it stands. keep: metres round each (and to the ends of its tentacles) that no small bell hangs in
    glow: [0.32, 0.72], flare: 2.5,
    see: [6.5, 10],             // (third holder: 8.5 and 14 before. A great one ten metres off, seen through the surface from a metre up, is a flat oval two hundred pixels long and thirty high: scored by the marks it was a scribbled stain. It is its light from there)
    broken: [0.6, 6.5, 10, 0.45],
    cap: [0.55, 0.3, 1, 0],
    threads: [5.5, 10.5],       // metres off (level) between which its tentacles go: a thread a finger thick is thinner than the screen can draw from there, and 24 of them kept visible are scratches on the water
  },
  // the far galaxy (this module's own light): how bright a bell's dab against the bell itself; the least it is drawn across and deep on the screen (pixels: half sizes);
  // how much of its light a dab that had to be drawn larger than it is keeps (1: all of it, spread thin; 0: as bright as a near one); how much of it is left behind the
  // rain front (the lit sea speaks there); metres across of the dab in bell diameters
  far: { gain: 2.8, edge: [1.6, 0.08, 0.3], minPx: [5.5, 2.0], keep: 0.55, lit: 0.5, spread: 2.2, greatGain: 0.5, cap: 0.2, halo: [0.3, 2.4], shape: [0.8, 0.14, 0.5, 6.5],      // (fourth holder) spread: the quad is the whole skirt now (bell radii); minPx: so that the core is never under six pixels wide; halo: the bloom of a bell that is a thing (how much of its dab, how wide in bell radii); shape: the core, the skirt, the skirt of a bloom, how tight the core
         // gain: a bell's light looked down on, against the bell itself (a deep bell beside the boat is dimmer than a near one). edge: seen at a glance the same light lies in a thin dash and is that much brighter (how many times more at most; the sines of the glance between which)      // cap: what a dab's light tends to and never passes (a soft knee: a bell's light seen through water is never as bright as a bell beside the boat; brighter, the galaxy is confetti strewn on the sea). With much gain under a low ceiling the field is many dim lights of nearly one strength, not a few bright ones
    broken: [0.45, 4, 10, 0.12],   // the surface between breaks a dab's light: how much at most, from and to which distance from the eye (level metres), and what shows between the marks
    // (third holder) the galaxy lies under and about the keel and recedes into the dark:
    recede: [20, 56],           // metres off (level) between which a bell's light goes out
    mirror: 0.5,                // how much of the mirror's share its light loses (1: all that the water's law takes at that glance)
    deep: '#4a40e0',            // what its violet has turned to through much water (the page's dark violet of dying light): a deep bell is a deeper colour, not only a dimmer one
    back: [-0.05, 0.03],          // the sine of the glance at the water over it (the swell's own slope counted) between which it shows: nothing under the back of a swell that is turned from the eye is seen
    glimmer: [0.3, 8, 20],
    glints: [7.5, 11, 0.62, 2.4],
    flare: [1.45, 0.3] },        // a woken bell seen as its light: how many times brighter (the family's bell: 2.5, at its margin), and how far it goes to the cold colour  // a great one far off is a handful of level dashes that come and go (the sheet's own far hand: marks cannot be told there, and its light, two metres across, broken by them was a scribble): from and to which distance (level metres), the share of places that hold a dash, how bright   // far off its light comes and goes with the small sea over it: how much of it, from and to which distance (level metres)
  shoals: {
    // [s, d, depth of the ball's middle], as the page numbers them (1 to 8)
    // (shoal 6 is the page's (160, -42) moved 8 m up the route: that place is on the wreck's reef, 6 m from her sternpost, and the ball hung half inside the rock)
    at: [[76, 8, 2.8], [112, -10, 2.7], [134, 16, 3.0], [141, -14, 2.9], [150, -62, 2.8], [152, -41, 3.0], [166, -16, 2.7], [229, -2, 2.6]],
    count: 600, length: 0.14, spin: 0.31, spread: [3, 1.1, 3],
    burst: { radius: 3.8, out: 1.5, back: 12, reach: 60, wave: 12, onHull: false, boost: 0 },      // boost 0: the species' own is 2.4 (after a fright a school on a route runs on at 2.4 m/s for two seconds); a ball that stands in one place was whirled round its own middle by it, 600 streaks running one circle: the 'wheel of wires'
    glow: { color: '#3fe0d0', intensity: 3.2 },
    bow: [4, 11.5, 4, 4, 4, 4, 4, 9.5],      // metres from a ball's middle at which the bow bearing down on it sets it off (2 and 8 are the page's; the others only when steered onto). (Shoal 8 lies 2 m off the line: set off nearer than this it opens under the bow, which hides the water for five metres ahead)
    front: [5, 6, 7],           // these burst as the foot of the rain front comes on them ...
    frontLead: 1.0,             // ... this many seconds before its line crosses the ball's middle: the bloom is half open on dark water when the fire reaches it, and whole under the foot (the page's beats 7.2, 8.5 and 10.4 are the foot's crossings; the 'burst' event is this much earlier)
    apart: 4,                   // seconds: never two within this, except under the front
    again: 15,                  // seconds before a ball that has burst can burst again (it has re-formed)
    keep: 3.6,                  // metres round a ball (to 5 m down) that no small bell hangs in
    ring: [0.5, 2.5],           // the page's one ripple over a burst
    marks: { count: 24, from: 1, to: 6, radius: 0.4, age: 0.5 },      // and its 24 dabs of light going outward (age: on the area's scale 0.6 is new light, the hull's own; 0.5 is light a few seconds old)
    whale: 8,                   // metres (level) from the whale's snout to a ball's middle at which its pressure sets the ball off
  },
  // the shoals seen from far off (this module's own light): streaks to a ball; metres from the eye between which they take over from the fish themselves; the least
  // a streak is drawn across (pixels, half); how bright against the family's fish
  // hot: the first of a fright seen from far off is white-hot (how much of it, from and to which distance, how many times brighter): it must carry to the foot of the front
  shoalsFar: { streaks: 64, see: [9, 18], minPx: 1.0, gain: 1.0, hot: [1, 24, 44, 2.4] },
};

// ---- seen through the surface. Water makes what is under it look shallower than it is, the more so the lower the eye looks (the fish family draws its fish so: docs/life/fish.md,
// "Fish are drawn as the surface shows them"). The engine draws what is under the water along the straight line of sight: a bell eight metres off then shows its side, a toadstool
// standing in the sea, and a far light lies three times nearer the eye than it is seen. So every point of a bell, every far dab and every far streak of this module is put where the
// eye SEES it: on the straight line from the eye through the place where its light leaves the water (Snell's law, n = 1.333). E: metres the eye stands above the water there;
// h: metres the point lies under it; q: metres off, level. Returns the depth at which it is seen: three quarters of h straight down, a third at 6 m, a sixth at 10 m (for a
// bell 2 m down). Solved by halving (ten steps: the crossing to a thousandth of q).
const SEEN_GLSL = /* glsl */`
  float deepSeen(float E, float h, float q) {
    float lo = 0.0, hi = q;
    for (int i = 0; i < 10; i++) {
      float x = 0.5 * (lo + hi), r = q - x;
      if (x * inversesqrt(x * x + E * E) < 1.333 * r * inversesqrt(r * r + h * h)) lo = x; else hi = x;
    }
    float x = 0.5 * (lo + hi);
    return min(h, E * (q - x) / max(x, 1e-5));
  }`;

// ---- the bells seen as light alone. One quad for each bell, lying level in the water where the bell is SEEN, on the bell's own clock (the family's numbers, read
// from its own meshes), carried by the same wander, the same hop and the same orbit of the swell.
const FAR_VERT = /* glsl */`${WATER_GLSL} ${FOG_PARS} ${SEEN_GLSL}
  attribute vec4 aHome, aClock; attribute vec2 aMore;
  uniform float uTime, uFarPx; uniform vec4 uCycS, uCycG, uMove, uSeeFar, uWaterK, uFarK, uFarGlowS, uFarGlowG, uFarBrk, uFarGain, uFarBack, uFarEdge, uFarHalo, uGreatAt[9]; uniform float uGreatK[9];
  varying vec2 vQ; varying vec3 vWorld; varying float vFogDist;
  flat varying vec4 vLit;       // x: the bell's light, y: its pulse, z: its flare, w: how much the surface between breaks it
  flat varying float vTone;     // how far its violet has gone to the deep colour
  flat varying float vGreat;
  flat varying float vHalo;     // 1 while its bell is a thing: this is then only the bloom of the bell's light in the water round it
  float farHop(float f, vec4 cyc) { float b = cyc.x + cyc.y; return f < b ? smoothstep(0.0, 1.0, pow(f / b, 0.7)) : 1.0 - smoothstep(0.0, 1.0, (f - b) / (1.0 - b)); }
  void main() {
    float great = aMore.y, R = aHome.w * 0.5, sd = aClock.z * 6.2831853;
    vec4 cyc = great > 0.5 ? uCycG : uCycS;
    float f = fract(uTime / aClock.x + aClock.y), aw = uTime - aMore.x;
    float wake = smoothstep(0.0, 0.45, aw) * (1.0 - smoothstep(1.6, 4.4, aw));
    // where the animal is now (as the family moves it): its wander, the hop of its pulse, the swell's orbit at its depth
    vec3 c = aHome.xyz + aClock.w * vec3(sin(uTime * 0.11 + sd), 0.25 * sin(uTime * 0.07 + sd * 2.1), cos(uTime * 0.09 + sd * 1.7));
    c.y += (farHop(f, cyc) + 0.5 * wake) * (great > 0.5 ? uMove.y : uMove.x) * R + 0.35 * R;      // (the light lies in the middle of the bell, where the eye sees the cap)
    for (int i = 0; i < 3; i++) {
      vec4 sv = uSwell[i]; float kk = length(sv.xy);
      if (kk > 1e-5) { float phs = dot(sv.xy, c.xz) - sv.z, e = sv.w * exp(kk * min(c.y, 0.0)) * uMove.z; c.y += e * cos(phs); c.xz -= sv.xy / kk * e * sin(phs); }
    }
    vec3 toEye = cameraPosition - c; float q = length(toEye.xz), away = length(toEye);      // away: metres to the bell itself, through air and water
    // seen through the surface: the light lies where the eye sees the bell, not where the bell hangs
    float hs = waterSwell(c.xz), eyeUp = max(cameraPosition.y - hs, 0.05), depth = max(hs - c.y, 0.0);
    c.y = hs - deepSeen(eyeUp, depth, max(q, 0.01));
    toEye = cameraPosition - c; float dist = max(length(toEye), 0.1);
    vec2 h = toEye.xz / max(q, 1e-3), sdir = vec2(-h.y, h.x);
    float sinE = clamp(toEye.y / dist, 0.03, 1.0);                         // how steeply the eye looks down on the water over it
    // (the water over it leans with the swell: on a face turned to the eye the sight goes in more steeply, and the back of a swell hides what is under it altogether)
    float glance = toEye.y / dist - dot(waterSwellSlope(c.xz), toEye.xz / dist);
    // a level dab of light (a little wider the deeper its bell hangs: the water between spreads it), never drawn smaller than the screen can hold as a soft thing: fainter instead
    // ---- how much of its light is this dab's: beyond the second distance all of it (a small core in a wide faint skirt); while the bell itself is seen (the family's mesh, drawn as
    // light), only the bloom of that light in the water round the bell (uFarHalo: how much, how wide in bell radii)
    vec2 see = great > 0.5 ? uSeeFar.zw : uSeeFar.xy;
    float beyond = smoothstep(see.x - 1.5, see.y - 1.5, away);              // (it comes up a little before the thing begins to go: the water itself has begun to hide the thing by then)
    vHalo = 1.0 - beyond;
    float halfW = R * mix(uFarHalo.y, uFarK.w * (1.0 + 0.03 * depth), beyond), halfD = halfW;
    float wPx = max(halfW, uFarK.x * dist / uFarPx), dPx = max(halfD, uFarK.y * dist / (uFarPx * sinE));
    float thin = pow(clamp((halfW * halfD) / (wPx * dPx), 0.0, 1.0), uFarK.z);
    vec3 wp = c + vec3(sdir.x, 0.0, sdir.y) * (position.x * wPx) + vec3(h.x, 0.0, h.y) * (position.y * dPx);
    // what the water lets through of a light at that depth, at that glance (the water's own law: its clarity, its mirror)
    float vy = clamp(glance, 0.0, 1.0);                                     // (depth: the bell's true depth; bend: how far the sight runs through the water for each metre down)
    float bend = 1.0 / sqrt(max(1.0 - (1.0 - vy * vy) * 0.565, 0.2));
    float toll = exp(-uWaterK.x * depth * bend);
    float through = toll * (1.0 - uFarGain.z * (uWaterK.y + (uWaterK.z - uWaterK.y) * pow(1.0 - vy, uWaterK.w))) * smoothstep(uFarBack.x, uFarBack.y, glance);
    // it recedes into the dark: gone by uFarGain.y metres off
    through *= 1.0 - smoothstep(uFarGain.x, uFarGain.y, q);
    // far off it glimmers: it comes and goes with the small sea over it, each in its own time (slowly: nothing blinks)
    float gl1 = sin(uTime * (0.9 + 1.3 * aClock.z) + aClock.z * 91.0), gl2 = sin(uTime * (0.37 + 0.6 * fract(aClock.z * 7.3)) + aClock.y * 40.0);
    through *= mix(1.0, 1.5 * smoothstep(0.2, 0.8, 0.5 + 0.5 * gl1 * gl2), uFarGain.w * smoothstep(uFarBack.z, uFarBack.w, q));
    // a great one that hangs nearer on the same line of sight hides it (this light is drawn at the water's surface in depth, see below: nothing under the water can)
    if (great < 0.5) for (int i = 0; i < 9; i++) {
      vec4 gb = uGreatAt[i];
      if (uGreatK[i] > 0.0 && c.y < gb.y - 0.05) {
        vec3 ln = c - cameraPosition; vec2 pp = cameraPosition.xz + ln.xz * ((gb.y - cameraPosition.y) / min(ln.y, -1e-3));
        through *= 1.0 - uGreatK[i] * (1.0 - smoothstep(0.8 * gb.w, 1.1 * gb.w, distance(pp, gb.xz)));
      }
    }
    vTone = clamp(1.0 - toll * (1.0 - 0.5 * smoothstep(uFarGain.x * 0.5, uFarGain.y, q)), 0.0, 1.0); vGreat = great;
    vec4 gl = great > 0.5 ? uFarGlowG : uFarGlowS;
    float pulse = smoothstep(0.0, cyc.x, f) * (1.0 - smoothstep(cyc.x, cyc.x + cyc.y + 0.3 * cyc.z, f));
    float flare = smoothstep(0.0, 0.4, aw) * (1.0 - smoothstep(1.2, 5.0, aw));
    float level = mix(gl.x, gl.y, pulse) * (1.0 + (gl.z - 1.0) * flare);
    float edgeK = 1.0 + uFarEdge.x * (1.0 - smoothstep(uFarEdge.y, uFarEdge.z, sinE));      // (a disc of light seen on its edge is a brighter line)
    vLit = vec4(level * (beyond + uFarHalo.x * vHalo) * through * thin * gl.w * edgeK, pulse, flare, uFarBrk.x * smoothstep(uFarBrk.y, uFarBrk.z, q));
    if (vLit.x < 0.0015) wp = vec3(0.0, -9999.0, 0.0);                      // (nothing to draw)
    vQ = position.xy; vWorld = wp;
    vec4 mv = viewMatrix * vec4(wp, 1.0); vFogDist = fogDistance(mv);
    gl_Position = projectionMatrix * mv;
    // (in depth only, it lies where its light leaves the water: whatever stands above the water hides it, as it must; nothing under the water does: its own bell
    // thinning away under it must not cut a hole in it, nor the tentacles of a great one score it with black lines)
    // (the water's level where this very sight enters the sea, and uFarHalo.z metres under it: the boat's planks, her lid and whatever floats are then surely nearer)
    float down = max(cameraPosition.y - wp.y, 0.05);
    vec2 enter = cameraPosition.xz + (wp.xz - cameraPosition.xz) * clamp(eyeUp / down, 0.0, 1.0);
    vec4 nearer = projectionMatrix * viewMatrix * vec4(cameraPosition + (wp - cameraPosition) * clamp((cameraPosition.y - waterSwell(enter) + uFarHalo.z) / down, 0.0, 1.0), 1.0);
    gl_Position.z = nearer.z / nearer.w * gl_Position.w;
  }`;
const FAR_FRAG = /* glsl */`${WATER_GLSL} ${SEA_CORE} ${FOG_PARS}
  uniform sampler2D tSeaFleck, tSeaStip; uniform vec3 uBody, uRim, uHot, uDeepCol; uniform vec4 uFleck, uFarLit, uFarBrk, uHull, uGlints, uFarShape; uniform float uTime, uFarPx;
  varying vec2 vQ; varying vec3 vWorld; varying float vFogDist;
  flat varying vec4 vLit; flat varying float vTone; flat varying float vGreat; flat varying float vHalo;
  // light on water too far off to tell marks apart: short level dashes that come and go, laid out by the direction they are seen in (the sheet's own far hand: light.js, seaGlints)
  vec3 deepHash3(vec2 p) { return fract(sin(vec3(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)), dot(p, vec2(419.2, 371.9)))) * 43758.5453); }
  float deepGlints(vec2 ang, vec2 cell, float dens, float seed, float time) {
    vec2 g = ang / cell, id = floor(g), f = g - id;
    vec3 h = deepHash3(id + seed);
    float cyc = time * (0.28 + 0.4 * h.z) + h.x * 9.0, n = floor(cyc), ph = cyc - n;
    vec3 k = deepHash3(id + seed + n * 7.13 + 3.0);
    if (k.z > dens) return 0.0;
    vec2 dq = (f - vec2(0.22 + 0.56 * k.x, 0.28 + 0.44 * k.y)) * cell;
    float halfLen = cell.x * (0.14 + 0.26 * h.y), th = max(cell.y * (0.2 + 0.16 * k.x), 0.6 / uFarPx);
    float life = sin(3.14159 * ph);
    return (1.0 - smoothstep(0.5, 1.0, length(vec2(dq.x / halfLen, dq.y / th)))) * life * life;
  }
  vec3 seaMark(sampler2D t, vec2 uv) { vec4 m = texture2D(t, uv); float c = max(m.g, 0.004); return vec3(m.g, m.r / c, m.b / c); }
  float seaLit(vec3 m, float cut) { return m.x * smoothstep(cut, cut + 0.14, m.y); }
  void main() {
    float r = length(vQ);
    if (r > 1.0) discard;
    float pulse = vLit.y, flare = vLit.z;
    // the bell's light as the water lets it through: a soft dab with no edge, fullest in its middle (never a ring: the rain's drops own that shape here), violet; at the
    // pulse a little colder and brighter, and colder still when its bell has been woken
    // (fourth holder) a small core, the bell's own size, in a wide faint skirt that falls away to nothing: light in water. One even lozenge with an edge was a sequin
    // lying on the sea. While the bell itself is seen there is no core (the bell is the core): only the skirt, the bloom of its light in the water round it.
    float core = exp(-uFarShape.w * r * r), skirt = exp(-1.8 * r * r) * (1.0 - smoothstep(0.55, 1.0, r));
    float body = mix(uFarShape.x * core + uFarShape.y * skirt, uFarShape.z * skirt, vHalo);
    // (the pulse shows: for the moment of the stroke the core goes to the cold colour, as the margin of a near bell does)
    vec3 hue = mix(mix(uBody, uDeepCol, vTone), uRim, min(1.0, (0.2 + 0.6 * core * (1.0 - vHalo)) * pulse * (1.0 - 0.6 * vTone) + uFarLit.w * flare));
    hue /= max(hue.r, max(hue.g, hue.b));
    // ---- broken by the marks that lie on the water over it (the more, the lower the eye looks: beside the boat the water is a clear pane): the place where this line of
    // sight enters the sea
    vec3 ray = vWorld - cameraPosition;
    float k = clamp(cameraPosition.y / max(cameraPosition.y - vWorld.y, 0.05), 0.0, 1.0);
    vec2 ps = cameraPosition.xz + ray.xz * k;
    k = clamp((cameraPosition.y - waterSwell(ps)) / max(cameraPosition.y - vWorld.y, 0.05), 0.0, 1.0); ps = cameraPosition.xz + ray.xz * k;
    // (a sight that enters the sea inside the boat's own waterline has gone through her planks: in depth this light lies at the surface, and her floor lies under it)
    // (the water round the hull follows the hull, not the swell: within its waterline no sum of mine says which of the two is nearer. What is cut away with it lies under the gunwale from the rider's seat)
    { vec2 hb = ps - uHull.xy; float al = dot(hb, uHull.zw), ac = hb.x * uHull.w - hb.y * uHull.z; if (length(vec2(ac, al - clamp(al, -1.6, 1.9))) < 0.85) discard; }
    float marks = 1.0;
    if (vLit.w > 0.003) {
      // (the sheet's own marks at the sheet's own scales, and its dabs once more at twice the coarse scale: a bell's light is half a metre across, and marks a finger
      // long cannot break it where the eye can see: it stayed a whole pale oval, a petal on a pond. Broken by marks of a hand's length and more it is two or three
      // flecks of violet, as every light of this sea is flecks)
      vec3 m1 = seaMark(tSeaFleck, ps * uFleck.x), m2 = seaMark(tSeaFleck, ps.yx * uFleck.y + 0.37), m3 = seaMark(tSeaFleck, ps * (uFleck.y * 0.45) + 0.11), st = seaMark(tSeaStip, ps * uFleck.w);
      float tw = 0.7 + 0.3 * sin(uTime * (1.3 + 3.2 * st.z) + st.z * 47.0);
      marks = mix(1.0, uFarBrk.w + 0.9 * seaLit(m1, 0.16) + 2.0 * seaLit(m2, 0.2) + 1.8 * seaLit(m3, 0.2) + 0.9 * seaLit(st, 0.2) * tw, vLit.w);      // (far off, where no mark can be told, this is their mean: an even soft dab)
    }
    if (vGreat > 0.5) {
      float gk = smoothstep(uGlints.x, uGlints.y, length(ray.xz));
      if (gk > 0.003) {
        vec2 ang = vec2(atan(ray.x, ray.z), atan(-ray.y, length(ray.xz)));
        marks = mix(marks, uGlints.w * (deepGlints(ang, vec2(0.021, 0.0046), uGlints.z, 13.0, uTime) + 0.8 * deepGlints(ang + vec2(0.37, 0.0019), vec2(0.014, 0.0034), uGlints.z * 0.9, 31.0, uTime * 1.2)), gk);
      }
    }
    // the sea's own light takes over behind the rain front; nothing answers in the first dark; the lee round the kept lamp
    float lit = seaFront(ps) * uSeaL.x;
    float amount = vLit.x * mix(1.0, uFarLit.x, lit) * uSeaL.y * seaLee(ps) * uFarLit.y;
    // (never a lamp: the middle of a dab tends to uFarLit.z and never passes it, however hard its bell is woken. The knee is laid on the dab's own strength, not on
    // each of its points: cut off or pressed flat point by point, every bright dab was one even tone with an edge round it, a plate, a petal lying on the sea. So a
    // dab keeps its form, a middle that falls away to nothing: a light in the water)
    amount /= 1.0 + amount / uFarLit.z;
    vec3 col = hue * (amount * body * marks);
    col *= (1.0 - fogAmount(vFogDist)) * (1.0 - uVeil);
    gl_FragColor = vec4(col, 1.0);
  }`;

// ---- the shoals seen from far off: a few dozen streaks to a ball, on the fish family's own law (a ball that turns; a fright that spreads at `wave` metres a second;
// every fish darts away from where it began, sweeps round and is home again), drawn as level dashes of light where the fish themselves are beyond the water's reach.
const SHOAL_VERT = /* glsl */`${WATER_GLSL} ${FOG_PARS} ${SEEN_GLSL}
  attribute vec4 aSeed; attribute float aBall;
  uniform float uTime, uFarPx; uniform vec4 uBall[8], uFright[8], uShape, uDart, uGlow, uSeeFar, uWaterK, uHot;
  varying vec2 vQ; varying float vFogDist; flat varying vec2 vLit;       // x: its light; y: how new its fright is (1: darting out now)
  // where a fish of ball k is at time t (xz from the ball's middle), and how new its fright is
  vec3 shoalAt(int k, float t) {
    float th = aSeed.x * 6.2831853 + uShape.z * t, rho = uShape.x * sqrt(aSeed.y);
    vec2 p = rho * vec2(cos(th), sin(th));
    vec4 fr = uFright[k];
    vec2 r = uBall[k].xz + p - fr.xy; float dist = length(r), hot = 0.0;
    float tau = t - fr.z - dist / uShape.w - 0.15 * aSeed.z;
    if (tau > 0.0 && tau < uDart.y + uDart.z) {
      hot = 1.0 - smoothstep(0.3 * uDart.y, 1.2 * uDart.y, tau);
      float To = uDart.y, Tb = uDart.z;
      float outK = tau < To ? 1.0 - (1.0 - tau / To) * (1.0 - tau / To) : 1.0, home = 1.0 - smoothstep(0.0, 1.0, (tau - To) / Tb);
      float zz = clamp((tau - 0.5 * To) / (0.5 * To + Tb), 0.0, 1.0), an = (aSeed.z > 0.5 ? 1.0 : -1.0) * uDart.w * (0.5 + aSeed.w) * zz * zz * (3.0 - 2.0 * zz);
      vec2 u = r / max(dist, 0.05); u = vec2(u.x * cos(an) - u.y * sin(an), u.x * sin(an) + u.y * cos(an));
      p += u * (uDart.x * (0.55 + 0.9 * aSeed.w) * outK * home);
    }
    return vec3(p, hot);
  }
  void main() {
    int k = int(aBall + 0.5);
    vec3 pNow = shoalAt(k, uTime); vec2 p0 = pNow.xy, p1 = shoalAt(k, uTime - 0.06).xy;
    vec2 vel = (p0 - p1) / 0.06; float speed = length(vel);
    vec3 c = uBall[k].xyz + vec3(p0.x, uShape.y * (aSeed.w * 2.0 - 1.0), p0.y);
    // it rides the swell's orbit at its depth, as everything in this water does
    for (int i = 0; i < 3; i++) { vec4 sv = uSwell[i]; float kk = length(sv.xy); if (kk > 1e-5) { float phs = dot(sv.xy, c.xz) - sv.z, e = sv.w * exp(kk * min(c.y, 0.0)); c.y += e * cos(phs); c.xz -= sv.xy / kk * e * sin(phs); } }
    vec3 toEye = cameraPosition - c; float q = length(toEye.xz);
    float hs = waterSwell(c.xz), depth = max(hs - c.y, 0.0);                // seen through the surface (as the bells are)
    c.y = hs - deepSeen(max(cameraPosition.y - hs, 0.05), depth, max(q, 0.01));
    toEye = cameraPosition - c; float dist = max(length(toEye), 0.1);
    // a streak: the light a fish leaves behind it, as long as it is fast
    vec3 dir = speed > 0.02 ? vec3(vel.x, 0.0, vel.y) / speed : vec3(1.0, 0.0, 0.0);
    float len = clamp(speed * uGlow.w, 0.14, 1.3) * 0.5;
    vec3 side = cross(dir, toEye / dist); float sl = length(side); side = sl > 0.05 ? side / sl : vec3(0.0, 1.0, 0.0);
    float halfW = max(0.03, uSeeFar.z * dist / uFarPx), halfL = max(len, 1.6 * uSeeFar.z * dist / uFarPx);
    vec3 wp = c - dir * (position.x * halfL) + side * (position.y * halfW);
    float vy = clamp(toEye.y / dist, 0.03, 1.0), bend = 1.0 / sqrt(max(1.0 - (1.0 - vy * vy) * 0.565, 0.2));
    float through = exp(-uWaterK.x * depth * bend) * (1.0 - 0.5 * (uWaterK.y + (uWaterK.z - uWaterK.y) * pow(1.0 - vy, uWaterK.w)));
    float bright = uGlow.x + (1.0 - uGlow.x) * smoothstep(uGlow.y, uGlow.z, speed);
    // (the first of a fright seen from far off is white-hot, as the first of every touch is here: it must carry forty and sixty metres, to the very foot of the front)
    float hot = pNow.z * uHot.x * smoothstep(uHot.y, uHot.z, q);
    vLit = vec2(bright * through * smoothstep(uSeeFar.x, uSeeFar.y, q) * uSeeFar.w * min(1.0, 0.03 / halfW + 0.35) * min(1.0, len / halfL + 0.3) * (1.0 + uHot.w * hot), hot);
    if (vLit.x < 0.002) wp = vec3(0.0, -9999.0, 0.0);
    vQ = position.xy;
    vec4 mv = viewMatrix * vec4(wp, 1.0); vFogDist = fogDistance(mv);
    gl_Position = projectionMatrix * mv;
  }`;
const SHOAL_FRAG = /* glsl */`${WATER_GLSL} ${SEA_CORE} ${FOG_PARS}
  uniform vec3 uColor, uCore;
  varying vec2 vQ; varying float vFogDist; flat varying vec2 vLit;
  void main() {
    // brightest at its head, thinning to its tail; soft across
    float along = 0.5 - 0.5 * vQ.x, a = smoothstep(0.0, 0.25, along) * (1.0 - smoothstep(0.75, 1.0, along)) * (0.35 + 0.65 * along);
    float across = 1.0 - smoothstep(0.2, 1.0, abs(vQ.y));
    vec3 col = mix(uColor, uCore, 0.5 * vLit.y) * (3.2 * vLit.x * a * across) * uSeaL.y;
    col = min(col, vec3(3.0)) * ((1.0 - fogAmount(vFogDist)) * (1.0 - uVeil));
    gl_FragColor = vec4(col, 1.0);
  }`;

// ---- the family's bell, as this sea shows it: DRAWN AS LIGHT (fourth holder). A medusa in this sea is light in clear jelly. The family draws it as solid paint in the
// engine's picture of what lies beneath (three quarters of the screen's size, not smoothed): an opaque matte cap with a staircase edge, its arms hidden behind it, its
// tentacles dashes: a button on the water, a parasol with a stalk. Here its material is turned into light: added to the picture after the water, at the screen's own size
// and smoothed, writing no depth. So a bell is clear (its far wall, its arms and whatever hangs under it show through it), its edge is soft, and the water's toll is taken
// here, where each point's depth and glance are known. One more extension of the family's gouache material at the material's own hooks (src/engine/gouache.js), after
// the family's own lines:
//   - every point of it is drawn where the eye sees it through the surface (SEEN_GLSL; uDeepSee.w: how much of that, 1 as built), and wavers with the living water over
//     it (the ripples' slope where its light leaves the sea: the wake, a ring, the rain; uDeepWob.x), a breath even on water at rest (uDeepWob.y);
//   - in depth it lies a hand under the place where its light leaves the water (dpNear; uDeepWob.z metres under, uDeepWob.w of the way): whatever stands above the water or
//     floats on it hides it (the boat's planks first of all), nothing deeper does;
//   - beyond uDeepSee.y metres from the eye it is not drawn; from uDeepSee.x its light goes down (the far galaxy draws its light from there); uDeepSee.z scales all of it;
//   - the bell is glass (SEE_LIGHT): brightest where the sight runs along its wall (the limb) and at its margin, all but clear at the crown, its canals and its four-lobed
//     stomach as fine marks. vDeepF: how squarely the sight UNDER the water meets the true wall;
//   - the surface between breaks its light with distance (uDeepBrk: how much, from and to which distance): the area's own marks at the sheet's scales.
const SEE_VERT = /* glsl */`{
      dpNear = 1.0;
      float dpQ = distance(aHome.xyz, uCameraPos); vDeepK = 1.0 - smoothstep(uDeepSee.x, uDeepSee.y, dpQ);      // (metres to it through air and water: a bell far below the keel is no more a thing than one far off)
      vDeepS = vec4(wp.xz, 1.0, dpQ); vDeepA = 1.0; vDeepF = 1.0;
      if (vDeepK < 0.02) wp.xyz = vec3(aHome.x, -9999.0, aHome.z);
      else {
        // as it gives way to its light it draws in on its own middle, and comes up out of its light as the boat nears (the family's own sums for where that middle is)
        float dpGrow = smoothstep(0.0, ${DEEP.grow.toFixed(3)}, vDeepK);
        if (dpGrow < 0.999) {
          float dpSd = aSeed.x * 6.2831853;
          vec3 dpC = aHome.xyz + aLife.w * vec3(sin(uTime * 0.11 + dpSd), 0.25 * sin(uTime * 0.07 + dpSd * 2.1), cos(uTime * 0.09 + dpSd * 1.7));
          dpC.y += (medusaHop(fract(uTime / aLife.x + aSeed.y)) + 0.5 * medusaWake(uTime - aLife.y)) * uMoveM.x * aHome.w * 0.5 + 0.175 * aHome.w;
          for (int i = 0; i < 3; i++) { vec4 sv = uSwell[i]; float kk = length(sv.xy); if (kk > 1e-5) { float phs = dot(sv.xy, dpC.xz) - sv.z, e = sv.w * exp(kk * min(dpC.y, 0.0)) * uMoveM.y; dpC.y += e * cos(phs); dpC.xz -= sv.xy / kk * e * sin(phs); } }
          wp.xyz = dpC + (wp.xyz - dpC) * dpGrow;
        }
        float dpHs = waterSwell(wp.xz), dpUp = uCameraPos.y - dpHs, dpDown = dpHs - wp.y;
        if (dpUp > 0.05 && dpDown > 0.0) {
          vec2 dpTo = uCameraPos.xz - wp.xz; float dpLv = max(length(dpTo), 0.01);
          float dpSeen = mix(dpDown, deepSeen(dpUp, dpDown, dpLv), uDeepSee.w);
          float dpAir = dpUp / (dpUp + dpSeen);                                 // the share of the sight that runs through the air
          vec2 dpOut = uCameraPos.xz - dpTo * dpAir;                            // where its light leaves the water
          float dpE = atan(dpUp + dpSeen, dpLv);                                // how steeply the eye looks down at that place
          // how squarely the sight under the water meets this wall: the true wall and the true sight (from the point up to where its light leaves the sea)
          vDeepF = abs(dot(normalize(wn), normalize(vec3(dpOut.x - wp.x, dpDown, dpOut.y - wp.z))));
          // the living water over it bends the sight: it wavers with every ring and with the wake, and breathes on water at rest
          vec2 dpBend = waterRipple(dpOut).xy * uDeepWob.x + uDeepWob.y * vec2(sin(dot(dpOut, vec2(1.7, 1.1)) + uTime * 1.3), cos(dot(dpOut, vec2(-1.2, 1.9)) + uTime * 1.1));
          wp.xz += clamp(dpBend, vec2(-0.4), vec2(0.4)) * dpSeen;
          wp.y = dpHs - dpSeen;
          vDeepS = vec4(dpOut, sin(dpE), dpLv);                                 // where its light leaves the water; the sine of the glance; metres off (level)
          // the water's toll on the whole of the sight under water (this light is no longer in the water's own picture of what lies beneath: nothing else takes it)
          vDeepA = exp(-uDeepWater.x * dpDown / sqrt(max(1.0 - cos(dpE) * cos(dpE) * 0.5625, 0.2)));
          // (in depth: the water's level where this very sight enters the sea, and uDeepWob.z metres under it)
          dpNear = clamp((uCameraPos.y - waterSwell(dpOut) + uDeepWob.z) / max(dpUp + dpSeen, 0.05), 0.0, 1.0);
        }
      }
    }`;
// (after the material's own gl_Position: in depth the point lies on its sight where that leaves the water, a little nearer)
const SEE_DEPTH = /* glsl */`
    if (dpNear < 0.9999) { vec4 dpC4 = projectionMatrix * viewMatrix * vec4(uCameraPos + (wp.xyz - uCameraPos) * (dpNear * uDeepWob.w), 1.0); gl_Position.z = dpC4.z / dpC4.w * gl_Position.w; }`;
const SEE_LIGHT = /* glsl */`{
      float dpPart = vM.z, dpPulse = vM.w, dpFlr = vM2.x;
      if (dpPart < 1.5) {
        // ---- the bell, and a great one's lappets: clear jelly. What shows of it is where the sight runs along its wall (the limb), the thick margin, the canals from
        // the stomach to the margin and the four-lobed stomach under the crown; the crown itself is all but clear (what hangs under it shows through). The margin turns
        // to the cold colour at the pulse (the page: violet body, aqua rim at the pulse). Woken, the margin flares in full and the dome only stirs (uDeepFlare.x)
        float dpU = min(vM.x, 1.0), dpLimb = pow(1.0 - clamp(vDeepF, 0.0, 1.0), uDeepGlass.y);
        float dpTh = atan(vMq.y, vMq.x);
        float dpCanal = smoothstep(0.84, 0.985, cos(dpTh * uCanalsM)) * smoothstep(0.2, 0.42, dpU) * (1.0 - smoothstep(0.93, 1.0, dpU));
        float dpStom = (1.0 - smoothstep(0.12, 0.36, dpU)) * (0.35 + 0.65 * (0.5 + 0.5 * cos(dpTh * 4.0)));
        float dpMarg = smoothstep(0.66, 0.97, vM.x);
        float dpWall = uDeepGlass.x + uDeepGlass.z * dpLimb + uDeepGlass.w * dpCanal + uDeepGlassB.x * dpStom + uDeepGlassB.y * dpMarg;
        float dpLevel = mix(uGlowM.x, uGlowM.y, dpPulse) * (1.0 + (uGlowM.z - 1.0) * dpFlr * mix(uDeepFlare.x, 1.0, dpMarg));
        glow = mix(uBodyM, uRimM, clamp(dpMarg * dpPulse * uDeepGlassB.z, 0.0, 1.0)) * (dpWall * dpLevel) + uHotM * (uDeepGlassB.w * dpFlr * smoothstep(0.8, 1.05, vM.x));
      } else if (dpPart < 2.5) {
        // ---- an arm: the family's light (a folded curtain, brighter along its frilled edges); woken it stirs as the dome does; under a small bell, seen at a low
        // glance, it is a dim trail and never a stalk as bright as its cap
        glow *= uDeepArm.x * (1.0 + uDeepFlare.x * dpFlr) / (1.0 + uDeepFlare.y * dpFlr) * mix(uDeepCap.z, 1.0, smoothstep(0.3, 0.8, vDeepS.z));
      } else {
        // ---- a tentacle: a soft thread, brightest along its middle; a few metres off it is thinner than the screen can draw, and it goes
        glow *= uDeepArm.y * (1.0 - vM2.z * vM2.z) * (1.0 - smoothstep(uDeepWater.y, uDeepWater.z, vDeepS.w));
      }
      // the surface between breaks its light with distance (beside the boat the water is a clear pane)
      float dpBk = uDeepBrk.x * smoothstep(uDeepBrk.y, uDeepBrk.z, vDeepS.w), dpMk = 1.0;
      if (dpBk > 0.003) {
        vec4 dp1 = texture2D(tDeepFleck, vDeepS.xy * uDeepFleck.x), dp2 = texture2D(tDeepFleck, vDeepS.yx * uDeepFleck.y + 0.37), dp3 = texture2D(tDeepStip, vDeepS.xy * uDeepFleck.w);
        dpMk = uDeepBrk.w + 1.5 * dp1.g * smoothstep(0.16, 0.30, dp1.r / max(dp1.g, 0.004)) + 1.0 * dp2.g * smoothstep(0.25, 0.39, dp2.r / max(dp2.g, 0.004)) + 1.2 * dp3.g * smoothstep(0.2, 0.34, dp3.r / max(dp3.g, 0.004));
      }
      // seen at a low glance the water's own mirror lies over it: it gives less of its light the lower the eye looks
      glow *= mix(${DEEP.glance[0].toFixed(3)}, 1.0, smoothstep(${DEEP.glance[1].toFixed(3)}, ${DEEP.glance[2].toFixed(3)}, vDeepS.z));
      // as it gives way to its light it dims (the far galaxy's dab comes up over it); the water's toll; the marks
      glow *= vDeepK * uDeepSee.z * vDeepA * mix(1.0, dpMk, dpBk);
      // a woken bell flares in its own colours: above uDeepCap.x its light rises more slowly (never a white plate)
      float dpTop = max(glow.r, max(glow.g, glow.b)); if (dpTop > uDeepCap.x) glow *= (uDeepCap.x + (dpTop - uDeepCap.x) * uDeepCap.y) / dpTop;
    }`;
// (it is light, added to the picture: nothing of the material's paint, and no alpha. A sight that enters the sea inside the boat's own waterline has gone through her
// planks: in depth this light lies at the surface, and her floor lies under it)
const SEE_FINAL = /* glsl */`{
      vec2 dpHb = vDeepS.xy - uDeepHull.xy; float dpAl = dot(dpHb, uDeepHull.zw), dpAc = dpHb.x * uDeepHull.w - dpHb.y * uDeepHull.z;
      if (vDeepK < 0.02 || length(vec2(dpAc, dpAl - clamp(dpAl, -1.6, 1.9))) < 0.85) discard;
      gl_FragColor = vec4(max(glow, 0.0) * (1.0 - fog), 0.0);
    }`;
const GL_POS = 'gl_Position = projectionMatrix * mv;';
function tellDistance(mat, see, U) {
  if (!mat || !mat.isGouache || mat.uniforms.uDeepSee) return !!(mat && mat.uniforms && mat.uniforms.uDeepSee);
  const v = mat.vertexShader, f = mat.fragmentShader;
  if (!(v.includes('//@vertexPars') && v.includes('//@vertexWorld') && v.includes(GL_POS) && v.includes('aHome') && v.includes('waterSwell') && v.includes('waterRipple') && f.includes('//@fragmentPars') && f.includes('//@light') && f.includes('//@final')
    && /varying vec4 vM\b/.test(f) && f.includes('vMq') && f.includes('uGlowM') && f.includes('uCanalsM') && f.includes('uBodyM'))) return false;
  mat.vertexShader = v.replace('//@vertexPars', `uniform vec4 uDeepSee, uDeepWater, uDeepWob; varying float vDeepK, vDeepA, vDeepF; varying vec4 vDeepS; float dpNear; ${SEEN_GLSL}\n  //@vertexPars`)
    .replace('//@vertexWorld', `${SEE_VERT}\n    //@vertexWorld`).replace(GL_POS, GL_POS + SEE_DEPTH);
  mat.fragmentShader = f.replace('//@fragmentPars', 'uniform vec4 uDeepSee, uDeepBrk, uDeepFleck, uDeepCap, uDeepWater, uDeepFlare, uDeepGlass, uDeepGlassB, uDeepArm, uDeepHull; uniform sampler2D tDeepFleck, tDeepStip; varying float vDeepK, vDeepA, vDeepF; varying vec4 vDeepS;\n  //@fragmentPars')
    .replace('//@light', `${SEE_LIGHT}\n    //@light`).replace('//@final', `${SEE_FINAL}\n    //@final`);
  mat.uniforms.uDeepSee = see; Object.assign(mat.uniforms, U);
  // light, added after the water: no depth written, both walls of the bell in one pass
  mat.transparent = true; mat.blending = THREE.AdditiveBlending; mat.premultipliedAlpha = true; mat.depthWrite = false; mat.forceSinglePass = true;
  mat.needsUpdate = true;
  return true;
}

// ---- the family's fish of light, as this sea shows them: every streak is drawn where the eye sees it through the surface (as the bells are; the fish family draws its
// solid fish so, but not its fish of light), at the gouache material's vertexWorld hook, after the family's own lines (whose names it reads: fC a point of the streak, fF the
// way the fish goes, fW the streak's width, fOn whether it shows, uStreak.z the angle of a pixel). A ball ten metres off is then a grainy patch lying under the surface,
// not a ball standing in the sea, and it agrees with this module's own far streaks.
const FISH_SEEN = /* glsl */`{
      float dpHs = fishSwell(fC.xz), dpUp = uCameraPos.y - dpHs, dpDown = dpHs - fC.y;
      if (uDeepSeen > 0.0 && dpUp > 0.05 && dpDown > 0.0) {
        float dpK = mix(1.0, deepSeen(dpUp, dpDown, max(distance(fC.xz, uCameraPos.xz), 0.01)) / dpDown, uDeepSeen);
        vec3 dpC = vec3(fC.x, dpHs - dpDown * dpK, fC.z), dpF = normalize(vec3(fF.x, fF.y * dpK, fF.z) + vec3(0.0, 0.0, 1e-6));
        vec3 dpV = dpC - uCameraPos, dpL = cross(dpF, dpV); float dpLl = length(dpL);
        dpL = dpLl > 1e-4 * length(dpV) ? dpL / dpLl : normalize(vec3(dpF.z, 0.0, -dpF.x) + vec3(1e-4, 0.0, 0.0));
        wp.xyz = dpC + dpL * (position.x * max(fW, length(dpV) * uStreak.z) * fOn);
      }
    }`;
function tellFish(mat, seen) {
  if (!mat || !mat.isGouache) return false;
  if (mat.uniforms.uDeepSeen) return true;
  const v = mat.vertexShader;
  if (!(v.includes('//@vertexPars') && v.includes('//@vertexWorld') && v.includes('fishSwell') && /vec3 fC = /.test(v) && /\bfF\b/.test(v) && /float fW = /.test(v) && /float fOn = /.test(v) && v.includes('uStreak'))) return false;
  mat.vertexShader = v.replace('//@vertexPars', `uniform float uDeepSeen; ${SEEN_GLSL}\n  //@vertexPars`).replace('//@vertexWorld', `${FISH_SEEN}\n    //@vertexWorld`);
  mat.uniforms.uDeepSeen = seen; mat.needsUpdate = true;
  return true;
}

export async function build(ctx, plan, shared) {
  const params = new URLSearchParams(typeof location !== 'undefined' ? location.search : '');
  // (&deepbare=1: nothing of this group is built, and the kit's stand-ins for it are taken out all the same: the clean baseline for measuring what the group costs)
  if (params.has('deepbare')) { removeStandIn(ctx, 'small jellies'); removeStandIn(ctx, 'greatjelly'); return {}; }
  const { kit } = ctx, engine = ctx.engine, P = plan, D = DEEP;
  const cast = shared.cast = shared.cast || {};
  const parts = (params.get('deep') || '').split(',').filter(Boolean), want = (k) => !parts.length || parts.includes(k);
  if (parts.length) { removeStandIn(ctx, 'small jellies'); removeStandIn(ctx, 'greatjelly'); }      // (measuring a part: the kit's stand-ins must not stand in for the parts left out)
  if (params.has('deepseen')) D.seen = Math.min(1, Math.max(0, +params.get('deepseen') || 0));
  // (&deeptune=far.gain:2,far.recede.1:60,bells.see.0:7 tries other numbers of DEEP without editing this file)
  if (params.has('deeptune')) for (const pair of params.get('deeptune').split(',')) {
    const [key, raw] = pair.split(':'), path = (key || '').split('.'); let o = D;
    while (path.length > 1 && o) o = o[path.shift()];
    if (o && path.length === 1 && raw !== undefined && raw !== '' && !Number.isNaN(+raw)) o[path[0]] = +raw;
  }
  if (params.has('deepsee')) { const [a, b] = params.get('deepsee').split(',').map(Number); if (b > a) { D.bells.see = [a, b]; D.great.see = [a + 2, b + 3]; } }
  const tmp = {}, v3 = new THREE.Vector3();
  const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const problems = [];                                                            // what could not be done as meant (said once, in the console, as INVALID_ so that the picture tool prints it)
  // the script's twin of deepSeen (SEEN_GLSL): the depth at which the eye, E metres above the water, sees a thing h metres under it and q metres off
  const seenDepth = (E, h, q) => { let lo = 0, hi = q; for (let i = 0; i < 10; i++) { const x = 0.5 * (lo + hi), r = q - x; if (x / Math.hypot(x, E) < 1.333 * r / Math.hypot(r, h)) lo = x; else hi = x; } const x = 0.5 * (lo + hi); return Math.min(h, E * (q - x) / Math.max(x, 1e-5)); };

  // ---------------------------------------------------------------------------------------------- where nothing hangs
  // Rock: every collider of the kit (stacks, reefs, steps, stumps), and what the heroes stand on, from the plan.
  const solids = ((shared.rocks && shared.rocks.colliders) || []).map((c) => ({ x: c.x, z: c.z, r: c.r }));
  { const b = kit.at(P.buoy.at[0], P.buoy.at[1]); solids.push({ x: b.x, z: b.z, r: 2.6 }); }
  { const e = kit.at(P.eastReef.at[0], P.eastReef.at[1]); solids.push({ x: e.x, z: e.z, r: 9 }); }
  const inRect = (s, d, r) => s > r.s[0] - 1 && s < r.s[1] + 1 && d > r.d[0] - 1 && d < r.d[1] + 1;
  const skerry = P.skerry.outline;
  const inPoly = (s, d, poly) => { let hit = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [si, di] = poly[i], [sj, dj] = poly[j]; if ((di > d) !== (dj > d) && s < (sj - si) * (d - di) / (dj - di) + si) hit = !hit; } return hit; };
  const great = P.jellies.great.map(([s, d, depth]) => ({ p: kit.at(s, d, -depth), depth }));
  const balls = D.shoals.at.map(([s, d, depth], i) => ({ n: i + 1, p: kit.at(s, d, -depth), last: -1e9, due: null, bowIn: false }));
  const lamp = kit.at(P.lamp.at[0], P.lamp.at[1]);
  // (a ball of fish must hang in open water too)
  for (const [i, [bs, bd]] of D.shoals.at.entries()) {
    const b = balls[i].p, R = D.shoals.spread[0] + 0.3;
    let hit = inRect(bs, bd, { s: [P.wreck.reef.s[0] - R + 1, P.wreck.reef.s[1] + R - 1], d: [P.wreck.reef.d[0] - R + 1, P.wreck.reef.d[1] + R - 1] }) || (bs > 85 - R && bs < 107 + R && Math.abs(bd) > 9.5 - R && bs < 107);
    for (const c of solids) if (Math.hypot(b.x - c.x, b.z - c.z) < c.r + R) hit = true;
    if (hit) problems.push(`shoal ${i + 1} at (${bs}, ${bd}) stands in rock`);
  }
  // may a small bell hang at (s, d, y)?
  const free = (s, d, x, y, z) => {
    if (s > 85 && s < 107 && Math.abs(d) > 9.5) return false;                      // the gate's wall
    if (inRect(s, d, P.wreck.reef) || (s > 195 && inPoly(s, d, skerry))) return false;
    for (const c of solids) { const dx = x - c.x, dz = z - c.z, r = c.r + 0.7; if (dx * dx + dz * dz < r * r) return false; }
    for (const g of great) { const dx = x - g.p.x, dz = z - g.p.z; if (dx * dx + dz * dz < D.great.keep * D.great.keep && y > -(g.depth + 9.5)) return false; }      // a great one's bell, arms and tentacles
    for (const b of balls) { const dx = x - b.p.x, dz = z - b.p.z; if (dx * dx + dz * dz < D.shoals.keep * D.shoals.keep && y > -5) return false; }                  // a ball of fish
    if (Math.hypot(x - lamp.x, z - lamp.z) < 14) return false;                      // the amber stroke lies on that water
    return true;
  };

  // ---------------------------------------------------------------------------------------------- small bells
  const wakers = [];                                                              // dolphins, the whale: { position: Vector3 (live), radius } (eight at most; the families read this very list)
  const systems = [];                                                             // [{ handle, s0, s1, d0, d1 }]
  const events = { burst: [], wake: [] }, fire = (name, ...a) => { for (const fn of events[name]) fn(...a); };
  const seeS = { value: new THREE.Vector4(D.bells.see[0], D.bells.see[1], 1, D.seen) }, seeG = { value: new THREE.Vector4(D.great.see[0], D.great.see[1], 1, D.seen) };
  // the surface between a bell and the eye: the area's own marks (the sheet's scales), and how much they break a bell's light with distance
  const fleckK = new THREE.Vector4(...(P.seaLight.fleck.length > 3 ? P.seaLight.fleck : [0.37, 0.16, 0.047, 0.75]));
  const blank = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1); blank.needsUpdate = true;
  const waterK = { value: new THREE.Vector4(0.13, D.great.threads[0], D.great.threads[1], 0) };      // what a metre of this water takes (set every frame from its look: 1.1 / clarity); metres off (level) between which a great one's tentacles go
  const hullU = { value: new THREE.Vector4(0, 0, 0, -1) };                          // the boat: where (x, z) and the way she heads (x, z); set every frame
  const glassU = { value: new THREE.Vector4(D.glass.film, D.glass.limbPow, D.glass.limb, D.glass.canal) }, glassB = { value: new THREE.Vector4(D.glass.stomach, D.glass.margin, D.glass.cold, D.glass.hot) };
  const wobU = { value: new THREE.Vector4(D.wob[0] * (ctx.reducedMotion ? 0.5 : 1), D.wob[1] * (ctx.reducedMotion ? 0.5 : 1), D.under, D.wob[2]) }, armU = { value: new THREE.Vector4(D.arm[0], D.arm[1], 0, 0) };
  const marksOf = (brk, cap) => ({ uDeepBrk: { value: new THREE.Vector4(...brk) }, uDeepCap: { value: new THREE.Vector4(...cap) }, uDeepFlare: { value: new THREE.Vector4(D.flare[0], D.flare[1], D.flare[2], D.flare[3]) }, uDeepWater: waterK, uDeepFleck: { value: fleckK }, tDeepFleck: { value: (shared.sea && shared.sea.fleck) || blank }, tDeepStip: (shared.sea && shared.sea.uniforms.tSeaStip) || { value: blank },
    uDeepHull: hullU, uDeepGlass: glassU, uDeepGlassB: glassB, uDeepWob: wobU, uDeepArm: armU });
  const brkS = marksOf(D.bells.broken, D.bells.cap), brkG = marksOf(D.great.broken, D.great.cap);
  const farList = [];                                                             // every bell as the far galaxy draws it: { home: [x, y, z, d], period, phase, sd, wander, great }
  const lone = [];                                                                // the bells that hang too deep ever to be things: { i (in farList), x, y, z, r, last, inside }
  const farIndex = new Map();                                                     // a bell's home -> its place in farList (the family tells a wake by where the bell hangs)
  const keyOf = (x, y, z) => x + ',' + y + ',' + z;
  // read a system's bells back from its own meshes (their places as the family clamped them, their clocks as the family drew them)
  const readBack = (handle, isGreat) => {
    let n = 0;
    handle.object.traverse((o) => {
      const g = o.geometry; if (!g || !g.attributes || !g.attributes.aHome || !g.attributes.aSeed || !g.attributes.aLife) return;
      const H = g.attributes.aHome.array, S = g.attributes.aSeed.array, L = g.attributes.aLife.array, m = g.instanceCount ?? (H.length / 4);
      for (let i = 0; i < m; i++) {
        const o4 = i * 4; farIndex.set(keyOf(H[o4], H[o4 + 1], H[o4 + 2]), farList.length);
        farList.push({ home: [H[o4], H[o4 + 1], H[o4 + 2], H[o4 + 3]], period: L[o4], phase: S[o4 + 1], sd: S[o4], wander: L[o4 + 3], great: isGreat ? 1 : 0 }); n++;
      }
    });
    return n;
  };
  let farWake = null;                                                             // the far galaxy's own record of when each bell was woken
  const woke = (x, y, z, kind) => { const i = farIndex.get(keyOf(x, y, z)); if (i !== undefined && farWake) { farWake.array[i * 2] = engine.shared.uTime.value; farWake.needsUpdate = true; } fire('wake', x, y, z, kind); };
  // ---- reduced motion: a slower and a smaller pulse. The family halves the hop and the sway; it has no word for the stroke itself. So each kind is given a longer period
  // (D.calm.period times the family's own), and its closed shape is drawn back toward its open one in the family's own mesh (aCon: where each point is when the bell is
  // shut), so that the bell closes D.calm.close of the way, woken or not
  const calmK = ctx.reducedMotion ? D.calm : null, slower = (period) => (calmK ? period.map((v) => v * calmK.period) : period);
  const eased = new WeakSet();
  const easeStroke = (handle) => {
    if (!calmK) return;
    handle.object.traverse((o) => {
      const g = o.geometry, con = g && g.attributes && g.attributes.aCon, pos = g && g.attributes && g.attributes.position;
      if (!con || !pos || con.count !== pos.count || eased.has(con)) return;
      eased.add(con);
      for (let i = 0; i < con.array.length; i++) con.array[i] = pos.array[i] + (con.array[i] - pos.array[i]) * calmK.close;
      con.needsUpdate = true;
    });
  };
  const hear = (handle, kind) => {
    easeStroke(handle);
    handle.onWake = (x, y, z) => woke(x, y, z, kind);
    const wake0 = handle.wake, at = new THREE.Vector3();
    handle.wake = (i) => { wake0(i); if (i >= 0 && i < handle.count) { handle.positionOf(i, at); woke(at.x, at.y, at.z, kind); } return handle; };      // (woken by name: the far galaxy must hear of it too)
  };
  if (want('bells')) {
    const rnd = ctx.rng(5106), B = D.bells, places = [];                          // [s, d, x, y, z]
    const grid = new Map(), cellOf = (x, y, z) => Math.floor(x / B.apart) + ':' + Math.floor(y / B.apart) + ':' + Math.floor(z / B.apart);
    const alone = (x, y, z) => {
      const cx = Math.floor(x / B.apart), cy = Math.floor(y / B.apart), cz = Math.floor(z / B.apart);
      for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) for (let k = -1; k <= 1; k++) { const q = grid.get((cx + i) + ':' + (cy + j) + ':' + (cz + k)); if (q) for (const p of q) if ((p[0] - x) ** 2 + (p[1] - y) ** 2 + (p[2] - z) ** 2 < B.apart * B.apart) return false; }
      return true;
    };
    const put = (s, d, x, y, z) => { places.push([s, d, x, y, z]); const k = cellOf(x, y, z); (grid.get(k) || grid.set(k, []).get(k)).push([x, y, z]); };
    // the galaxy: along the sound, thinning away to the left (the open sea) and to the right (rock), crowded toward the surface; and gathered in drifts, as medusae are
    // (windrows lying along the swell's way, some seven to twelve metres apart, broken along their length, with thin water between: a field with clouds and lanes in it)
    { const S = B.sound, n = kit.count(S.count); let tries = 0, got = 0;
      const sw = P.water.swellDir || [0.9, 0.42], swl = Math.hypot(sw[0], sw[1]) || 1, ax = sw[0] / swl, az = sw[1] / swl;
      const hash = (i, j) => { const h = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return h - Math.floor(h); };
      const vnoise = (x, y) => { const i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j, ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy); return (hash(i, j) * (1 - ux) + hash(i + 1, j) * ux) * (1 - uy) + (hash(i, j + 1) * (1 - ux) + hash(i + 1, j + 1) * ux) * uy; };
      const drift = (x, z) => { const a = x * ax + z * az, c = -x * az + z * ax, m = 0.65 * vnoise(a / 26, c / 8) + 0.35 * vnoise(a / 9 + 7.3, c / 4.5 + 2.1); return S.drift[0] + (1 - S.drift[0]) * smooth(S.drift[1], S.drift[2], m); };
      while (got < n && tries++ < n * 200) {
        const s = S.s[0] + (S.s[1] - S.s[0]) * rnd(), d = S.d[0] + (S.d[1] - S.d[0]) * rnd();
        const keep = (1 - smooth(S.thinLeft[0], S.thinLeft[1], d)) * (1 - smooth(S.thinRight[0], S.thinRight[1], d)) * (0.35 + 0.65 * smooth(104, 116, s)) * (S.wide + (1 - S.wide) * Math.exp(-d * d / (S.lane * S.lane)));
        const u = rnd(), depth = S.depth[0] + (S.depth[1] - S.depth[0]) * u * u;
        if (rnd() > keep) continue;
        kit.at(s, d, -depth, v3); if (rnd() > drift(v3.x, v3.z) || !free(s, d, v3.x, v3.y, v3.z) || !alone(v3.x, v3.y, v3.z)) continue;
        put(s, d, v3.x, v3.y, v3.z); got++;
      }
      if (got < n) problems.push(`only ${got} of ${n} small bells found a place under the sound`);
    }
    // before the gate: few, more toward the gate
    { const T = B.thin, n = kit.count(T.count); let tries = 0, got = 0;
      while (got < n && tries++ < n * 60) {
        const s = T.s[0] + (T.s[1] - T.s[0]) * rnd(), d = (rnd() * 2 - 1) * T.d;
        if (rnd() > (1 + (T.rise - 1) * smooth(T.s[0], 88, s)) / T.rise) continue;
        const depth = T.depth[0] + (T.depth[1] - T.depth[0]) * rnd();
        kit.at(s, d, -depth, v3); if (!free(s, d, v3.x, v3.y, v3.z) || !alone(v3.x, v3.y, v3.z)) continue;
        put(s, d, v3.x, v3.y, v3.z); got++;
      } }
    // A bell that hangs deeper than the eye can ever come within `see` of is never a thing: it is its light alone (the far galaxy's dab), and no mesh is made for it
    // (a third of the bells: they were drawn, collapsed to nothing, in every cell within reach). This module gives it its clock, as the family gives its own theirs.
    { const rl = ctx.rng(5107), deepest = -(B.see[1] - 0.4);
      for (let i = places.length - 1; i >= 0; i--) {
        const q = places[i]; if (q[3] > deepest) continue;
        const dia = 0.25 + 0.2 * rl(), b = { i: farList.length, x: q[2], y: q[3], z: q[4], r: dia * 0.5, last: -1e9, inside: false };
        farList.push({ home: [q[2], q[3], q[4], dia], period: (B.period[0] + (B.period[1] - B.period[0]) * rl()) * (calmK ? calmK.period : 1), phase: rl(), sd: rl(), wander: 0.3 * (0.6 + 0.4 * rl()), great: 0 });
        lone.push(b); places[i] = places[places.length - 1]; places.pop();
      } }
    // one system for each cell of the route (a bell is drawn as a thing only within `see` of the eye: a cell out of reach is not drawn at all)
    const byCell = new Map();
    for (const p of places) { const k = Math.floor(p[0] / B.cell) + ':' + Math.floor((p[1] + 240) / B.cell); (byCell.get(k) || byCell.set(k, []).get(k)).push(p); }
    let told = true;
    for (const [k, list] of [...byCell.entries()].sort()) {
      const [ks, kd] = k.split(':').map(Number);
      const points = new Float32Array(list.length * 3); list.forEach((p, i) => points.set([p[2], p[3], p[4]], i * 3));
      // (nearDepth: every bell that can be a thing wears the twelve-sided mesh: one draw call a cell and a pass, not two)
      const handle = makeMedusae(ctx, { points, exact: true, seed: 5200 + ks * 37 + kd, disturb: wakers, clear: B.clear, sides: B.sides, nearDepth: 99, glow: B.glow, flare: B.flare, near: B.near, period: slower(B.period) });
      handle.object.traverse((o) => { if (o.material) { const ok = tellDistance(o.material, seeS, brkS); told = ok && told; if (ok) o.renderOrder = 1; } });      // (light: drawn after the water)
      ctx.only(handle.object, 'direct');                                          // (under the water, small: never in the mirror. The family says so too)
      hear(handle, 'small'); readBack(handle, false);
      const box = [1e9, -1e9, 1e9, -1e9]; for (const q of list) { box[0] = Math.min(box[0], q[2]); box[1] = Math.max(box[1], q[2]); box[2] = Math.min(box[2], q[4]); box[3] = Math.max(box[3], q[4]); }
      systems.push({ handle, s0: ks * B.cell, s1: (ks + 1) * B.cell, d0: kd * B.cell - 240, d1: (kd + 1) * B.cell - 240, count: handle.count, box });
    }
    if (!told) problems.push('the small bells could not be told their distance (the gouache hooks have changed): they are drawn as things at every distance');
    removeStandIn(ctx, 'small jellies');
  }

  // ---------------------------------------------------------------------------------------------- the nine great ones
  // (one system for each: a great one is drawn as a thing only within `see` of the eye, and one that is out of reach is not sent to be drawn at all)
  const greatOnes = [];
  if (want('great')) {
    const G = D.great; let told = true;
    great.forEach((g, i) => {
      const handle = makeGreatMedusae(ctx, { points: [g.p], sizes: [G.sizes[i % G.sizes.length]], lobes: G.lobes, tentacles: G.tentacles, clear: G.clear, glow: G.glow, flare: G.flare, disturb: wakers, seed: 5152 + i * 7, period: slower(G.period) });
      handle.object.traverse((o) => { if (o.material) { const ok = tellDistance(o.material, seeG, brkG); told = ok && told; if (ok) o.renderOrder = 1; } });
      ctx.only(handle.object, 'direct');
      hear(handle, 'great'); readBack(handle, true);
      greatOnes.push({ handle, at: handle.positionOf(0, new THREE.Vector3()), far: farList.length - 1 });
    });
    if (!told) problems.push('the great jellies could not be told their distance (the gouache hooks have changed): they are drawn as things at every distance');
    removeStandIn(ctx, 'greatjelly');
  }

  // ---------------------------------------------------------------------------------------------- the far galaxy
  let far = null;
  if (want('far') && farList.length && shared.sea) {
    const n = farList.length, home = new Float32Array(n * 4), clock = new Float32Array(n * 4), more = new Float32Array(n * 2);
    farList.forEach((b, i) => { home.set(b.home, i * 4); clock.set([b.period, b.phase, b.sd, b.wander], i * 4); more[i * 2] = -1e9; more[i * 2 + 1] = b.great; });
    const geo = new THREE.InstancedBufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); geo.setIndex([0, 1, 2, 0, 2, 3]);
    geo.setAttribute('aHome', new THREE.InstancedBufferAttribute(home, 4)); geo.setAttribute('aClock', new THREE.InstancedBufferAttribute(clock, 4));
    farWake = new THREE.InstancedBufferAttribute(more, 2); farWake.setUsage(THREE.DynamicDrawUsage); geo.setAttribute('aMore', farWake);
    geo.instanceCount = n;
    const sh = engine.shared, SU = shared.sea.uniforms, calm = ctx.reducedMotion ? 0.5 : 1, col = (c) => new THREE.Color(c);
    const uniforms = {
      ...waterUniforms(engine), uTime: sh.uTime, uFogColor: sh.uFogColor, uFogDensity: sh.uFogDensity, uVeil: sh.uVeil, uVeilColor: sh.uVeilColor,
      uSeaOmega: SU.uSeaOmega, uSeaFront: SU.uSeaFront, uSeaLee: SU.uSeaLee, uSeaL: SU.uSeaL, tSeaFleck: { value: shared.sea.fleck }, tSeaStip: SU.tSeaStip,
      uFleck: { value: new THREE.Vector4(...(P.seaLight.fleck.length > 3 ? P.seaLight.fleck : [0.37, 0.16, 0.047, 0.75])) },
      uCycS: { value: new THREE.Vector4(0.15, 0.33, 0.47, 1.5) }, uCycG: { value: new THREE.Vector4(0.14, 0.31, 0.47, 3) },
      uMove: { value: new THREE.Vector4(0.4 * calm, 0.3 * calm, calm, 0) },      // the hop of a small bell and of a great one (bell radii), and the share of the swell's orbit they ride (the family halves all three with reduced motion)
      uSeeFar: { value: new THREE.Vector4(D.bells.see[0], D.bells.see[1], D.great.see[0], D.great.see[1]) },
      uWaterK: { value: new THREE.Vector4(0.13, 0.03, 0.9, 6) },                 // the water's own law, set every frame from its look: 1.1 / clarity; its mirror looking down and at a glance; the mirror's exponent
      uFarK: { value: new THREE.Vector4(D.far.minPx[0], D.far.minPx[1], D.far.keep, D.far.spread) }, uFarPx: { value: 800 },
      uFarGlowS: { value: new THREE.Vector4(D.bells.glow[0], D.bells.glow[1], D.far.flare[0], D.far.gain) }, uFarGlowG: { value: new THREE.Vector4(D.great.glow[0], D.great.glow[1], D.far.flare[0], D.far.gain * D.far.greatGain) },
      uFarLit: { value: new THREE.Vector4(D.far.lit, 1, D.far.cap, D.far.flare[1]) },          // what is left of it behind the rain front; all of it (staging's level); the most any dab shows
      uFarGain: { value: new THREE.Vector4(D.far.recede[0], D.far.recede[1], D.far.mirror, D.far.glimmer[0]) },      // metres off between which its light goes out; how much of the mirror's share it loses; how much it glimmers far off
      uFarBack: { value: new THREE.Vector4(D.far.back[0], D.far.back[1], D.far.glimmer[1], D.far.glimmer[2]) },      // the glance at the leaning water over it between which it shows; metres off between which it begins to glimmer
      uGreatAt: { value: great.map(() => new THREE.Vector4(0, -99, 0, 0)) }, uGreatK: { value: great.map(() => 0) },   // the great ones that are things now, as the eye sees them (the plane of the margin: x, y, z; its radius), and how much each hides
      uFarEdge: { value: new THREE.Vector4(D.far.edge[0], D.far.edge[1], D.far.edge[2], 0) }, uDeepCol: { value: col(D.far.deep) }, uGlints: { value: new THREE.Vector4(...D.far.glints) }, uHull: { value: new THREE.Vector4(0, 0, 0, -1) },      // the boat: where (x, z) and the way she heads (x, z)
      uFarHalo: { value: new THREE.Vector4(D.far.halo[0], D.far.halo[1], D.under, 0) }, uFarShape: { value: new THREE.Vector4(...D.far.shape) },
      uFarBrk: { value: new THREE.Vector4(...D.far.broken) },                      // the surface between breaks it: how much at most, from and to which distance (level), and what shows between the marks
      uBody: { value: col('#6f55e6') }, uRim: { value: col('#3fe0d0') }, uHot: { value: col('#d2fbf2') },
    };
    const mat = new THREE.ShaderMaterial({ uniforms, vertexShader: FAR_VERT, fragmentShader: FAR_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = 'sea-deep-galaxy'; mesh.frustumCulled = false; mesh.renderOrder = 1;      // after the water and the sea's own sheet of light: it is light seen through the surface
    const size = new THREE.Vector2();
    mesh.onBeforeRender = (renderer, scene, camera) => { const rt = renderer.getRenderTarget(), hgt = rt ? rt.height : renderer.getDrawingBufferSize(size).y; const px = hgt * 0.5 * camera.projectionMatrix.elements[5]; if (uniforms.uFarPx.value !== px) { uniforms.uFarPx.value = px; mat.uniformsNeedUpdate = true; } };
    ctx.add(mesh); ctx.only(mesh, 'direct');
    far = { mesh, uniforms, count: n };
  }

  // ---------------------------------------------------------------------------------------------- the eight shoals
  let shoals = null, farShoals = null;
  const calmly = !!ctx.reducedMotion;
  if (want('shoals')) {
    const S = D.shoals;
    // (one system for each ball: the water shows nothing of a fish beyond a stone's throw, and a ball out of reach is not sent to be drawn at all)
    shoals = balls.map((b, i) => makeSchool(ctx, {
      species: 'school', look: 'light', length: S.length, spin: S.spin, hull: false, seed: 5177 + i * 3,
      schools: [{ count: S.count, at: [b.p.x, b.p.y, b.p.z], spread: S.spread }],
      burst: S.burst, glow: S.glow,      // (no ring and no marks of the family's: they are written at the place the fright came from; here they belong over the ball, and on the area's scale: below)
    }));
    { const seen = { value: D.seen }; let told = true;
      for (const h of shoals) h.object.traverse((o) => { if (o.material) told = tellFish(o.material, seen) && told; });
      if (!told) problems.push('the shoals could not be drawn as the surface shows them (the fish family\'s lines have changed): each ball is drawn along the straight line of sight'); }
    // ---- the balls seen from far off: the water shows nothing of a fish beyond a stone's throw, so each ball has a few dozen streaks of this module's own, on the
    // family's own law of motion, that are drawn only where the fish themselves cannot be seen
    if (want('far') && shared.sea) {
      const F = D.shoalsFar, n = balls.length * F.streaks, seed = new Float32Array(n * 4), ball = new Float32Array(n), rnd = ctx.rng(5188);
      for (let i = 0; i < n; i++) { ball[i] = Math.floor(i / F.streaks); seed.set([rnd(), rnd(), rnd(), rnd()], i * 4); }
      const geo = new THREE.InstancedBufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); geo.setIndex([0, 1, 2, 0, 2, 3]);
      geo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seed, 4)); geo.setAttribute('aBall', new THREE.InstancedBufferAttribute(ball, 1));
      geo.instanceCount = n;
      const sh = engine.shared, SU = shared.sea.uniforms, B = S.burst;
      const uniforms = {
        ...waterUniforms(engine), uTime: sh.uTime, uFogColor: sh.uFogColor, uFogDensity: sh.uFogDensity, uVeil: sh.uVeil, uVeilColor: sh.uVeilColor,
        uSeaOmega: SU.uSeaOmega, uSeaFront: SU.uSeaFront, uSeaLee: SU.uSeaLee, uSeaL: SU.uSeaL,
        uBall: { value: balls.map((b) => new THREE.Vector4(b.p.x, b.p.y, b.p.z, 0)) },                 // each ball's middle
        uFright: { value: balls.map(() => new THREE.Vector4(0, 0, -1e6, 0)) },                         // where its last fright came from (x, z), and when (the shader's clock)
        uShape: { value: new THREE.Vector4(S.spread[0], S.spread[1], S.spin, B.wave) },
        uDart: { value: new THREE.Vector4(B.radius, B.out * (calmly ? 2 : 1), B.back * (calmly ? 1.2 : 1), 1.1) },      // how far, seconds out, seconds home, how far round they sweep
        uGlow: { value: new THREE.Vector4(0.28, 0.9, 3.2, 0.17) },                                     // the family's: what a fish at rest shows; m/s between which it shows all; seconds of light behind it
        uSeeFar: { value: new THREE.Vector4(F.see[0], F.see[1], F.minPx, F.gain) }, uWaterK: { value: new THREE.Vector4(0.13, 0.03, 0.9, 6) }, uFarPx: { value: 800 },
        uColor: { value: new THREE.Color(S.glow.color) }, uCore: { value: new THREE.Color('#d2fbf2') },
        uHot: { value: new THREE.Vector4(...F.hot) },      // the first of a far fright: how much of it is white-hot, from and to which distance (metres), and how many times brighter
      };
      const mat = new THREE.ShaderMaterial({ uniforms, vertexShader: SHOAL_VERT, fragmentShader: SHOAL_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.name = 'sea-deep-shoals-far'; mesh.frustumCulled = false; mesh.renderOrder = 1;
      const size = new THREE.Vector2();
      mesh.onBeforeRender = (renderer, scene, camera) => { const rt = renderer.getRenderTarget(), hgt = rt ? rt.height : renderer.getDrawingBufferSize(size).y; const px = hgt * 0.5 * camera.projectionMatrix.elements[5]; if (uniforms.uFarPx.value !== px) { uniforms.uFarPx.value = px; mat.uniformsNeedUpdate = true; } };
      ctx.add(mesh); ctx.only(mesh, 'direct');
      farShoals = { mesh, uniforms, count: n };
    }
  }
  // ---- a burst. Ball n (the page's number, 1 to 8) bursts away from a place ({ x, y, z }; default: its own middle); `why` is told with the event.
  // opts.front: one of the three under the rain front (they may follow one another closely); opts.force: whatever the guards say.
  // Returns true if it burst now, false if it must wait (never two within `apart` seconds: it bursts when it may) or has not re-formed.
  let lastBurst = -1e9;
  const dabs = [];                                                                // light still to be written on the water: { at, x, z }
  const light = (x, z, radius, age) => {                                          // a dab of light on the water, on the area's scale (an age: 0.6 is new light, the hull's own)
    const sl = cast.seaLight;
    if (sl && sl.dab) { sl.dab(x, z, radius, age); return; }
    const tr = ctx.water.trace, a = shared.sea ? shared.sea.uniforms.uSeaL.value.y : 1;
    if (tr && tr.inject && a > 0.02) tr.inject(x, z, { channel: 'glow', radius: Math.max(0.3, radius), strength: Math.min(0.6, age) * a, soft: 0.8 });
  };
  const burst = (n, from = null, { front = false, force = false, why = 'cue' } = {}) => {
    const b = balls[n - 1]; if (!b || !shoals) return false;
    const t = ctx.time, S = D.shoals;
    if (!force && t - b.last < S.again) return false;
    if (!force && !front && t - lastBurst < S.apart) { b.due = { from, why, at: lastBurst + S.apart }; return false; }
    b.last = t; b.due = null; if (!front) lastBurst = t;
    // the fright comes from the ball's own edge on the side its cause is (the fish go the other way); with no cause given, from its middle
    let ox = b.p.x, oy = b.p.y, oz = b.p.z;
    if (from) { const dx = from.x - b.p.x, dz = from.z - b.p.z, l = Math.hypot(dx, dz); if (l > 0.5) { const k = Math.min(l, S.spread[0] + 0.4) / l; ox = b.p.x + dx * k; oz = b.p.z + dz * k; oy = Math.min(-0.2, from.y ?? -0.2); } }
    shoals[n - 1].burst(0, { x: ox, y: oy, z: oz });
    if (farShoals) farShoals.uniforms.uFright.value[n - 1].set(ox, oz, engine.shared.uTime.value, 1);
    // on the water over it: one ripple, and 24 dabs of light going outward as the bloom opens (the page's; old light from the first: a burst is not the hull)
    if (ctx.water.ripple) ctx.water.ripple(b.p.x, b.p.z, S.ring[0], S.ring[1]);
    const M = S.marks, out = S.burst.out * (calmly ? 2 : 1);
    for (let j = 0; j < M.count; j++) { const a = Math.PI * 2 * (j + 0.5 * (j % 2)) / M.count, r = M.from + (M.to - M.from) * (((j * 7) % M.count) / M.count); dabs.push({ at: t + r / (S.burst.radius / out) * 0.6, x: b.p.x + Math.cos(a) * r, z: b.p.z + Math.sin(a) * r }); }
    fire('burst', b.p.x, b.p.z, n, why);
    return true;
  };

  // ---------------------------------------------------------------------------------------------- who else is in the water
  // The dolphins (shared.cast.comets) and the whale (shared.cast.whale) are other groups': they are read when they are there, and nothing here needs them.
  const others = { comets: null, whale: null, struck: false, whaleBody: null };
  const leadW = { position: new THREE.Vector3(0, -50, 0), radius: 0 }, bodyW = [0, 1].map(() => ({ position: new THREE.Vector3(0, -50, 0), radius: 0 }));
  const meet = () => {
    if (!others.comets && cast.comets && cast.comets.lead && cast.comets.lead.isVector3) { others.comets = cast.comets; wakers.push(leadW); }
    if (!others.whale && cast.whale && cast.whale.waker && cast.whale.waker.position && cast.whale.waker.position.isVector3) { others.whale = cast.whale; if (!wakers.includes(cast.whale.waker)) wakers.push(cast.whale.waker); wakers.push(...bodyW); }
  };
  meet();

  // ---------------------------------------------------------------------------------------------- for staging
  const auto = { bow: true, front: true, whale: true, dolphins: true };
  const deep = cast.deep = {
    numbers: D,
    /** The family's own handles: the small bells' systems (one for each cell of the route), the nine great ones (one system each, in the page's order), the eight shoals (one system each: shoals[n - 1] is the page's shoal n; its one school is school 0). */
    bells: systems.map((q) => q.handle), great: greatOnes.map((q) => q.handle), shoals,
    /** The balls as the page numbers them: balls[n - 1] = { n, p (Vector3: its middle), last (ctx.time of its last burst) }. */
    balls,
    /** The far galaxy and the far shoals (this module's own light): { mesh, uniforms, count }. level(v) sets how much of both shows (1 as built). */
    far, farShoals,
    level(v) { if (far) far.uniforms.uFarLit.value.y = v; if (farShoals) farShoals.uniforms.uSeeFar.value.w = D.shoalsFar.gain * v; return deep; },
    /** Whatever wakes the bells it comes near: { position: Vector3 (read every frame), radius (0: at rest) }. Eight at most: the whale takes three, the dolphins' lead one. */
    wakers,
    waker(position, radius = 3) { const w = position && position.position ? position : { position, radius }; if (wakers.includes(w)) return w; if (wakers.length < 8) wakers.push(w); else console.error('INVALID_ sea/cast_deep: more than eight wakers'); return w; },
    /** Wake every bell within `radius` metres of (x, z) now (they contract at once and flare). */
    wakeNear(x, z, radius = 5) {
      for (const q of systems) { if (x < q.box[0] - radius || x > q.box[1] + radius || z < q.box[2] - radius || z > q.box[3] + radius) continue; for (let i = 0; i < q.count; i++) { q.handle.positionOf(i, v3); if ((v3.x - x) ** 2 + (v3.z - z) ** 2 < radius * radius) q.handle.wake(i); } }
      for (const g of greatOnes) if ((g.at.x - x) ** 2 + (g.at.z - z) ** 2 < radius * radius) g.handle.wake(0);
      if (farWake) for (const b of lone) if ((b.x - x) ** 2 + (b.z - z) ** 2 < radius * radius) { b.last = farWake.array[b.i * 2] = engine.shared.uTime.value; farWake.needsUpdate = true; fire('wake', b.x, b.y, b.z, 'small'); }
      return deep;
    },
    /** Burst shoal n (1 to 8, the page's numbers) away from a place: burst(n, { x, y, z }, { front, force, why }). */
    burst,
    /** What sets the shoals off by itself: the bow (2 and 8; any ball steered onto), the foot of the rain front (5, 6, 7), the whale beneath (3, 4), the dolphins' strike (1). Set one false to drive it by hand. */
    auto,
    /** 0..1: how full of bells the water round the boat is (for the layer 'shimmer': the page's 0.22 from s 106). */
    galaxy: 0,
    /** deep.on('burst', (x, z, n, why) => ...): a shoal has burst (the page: 'sparkle', pitch 0.6, gain 0.7, placed at it; why: 'bow' | 'front' | 'whale' | 'dolphins' | 'cue').
     *  deep.on('wake', (x, y, z, kind) => ...): a bell has been woken (kind: 'small' | 'great'). No sound is asked for it by the page. */
    on(name, fn) { if (events[name]) events[name].push(fn); return deep; },
  };
  for (const p of problems) console.error('INVALID_ sea/cast_deep: ' + p);

  const bowAt = { x: 0, y: -0.2, z: 0 };
  const frontLead = D.shoals.frontLead * (calmly ? P.front.calmSpeed : P.front.speed);      // metres ahead of the foot's line at which a ball under the front is set off
  const wasBehind = balls.map(() => true);
  const dbgBurst = params.has('deepburst') ? params.get('deepburst').split(':').map(Number) : null, dbgWake = params.has('deepwake') ? +params.get('deepwake') : null;
  let dbgB = false, dbgW = false, meetAt = 0, loneIn = 0;
  // how many bells hang within 25 m of each metre of the route (for `galaxy`)
  const along = new Float32Array(270); for (const b of farList) { if (b.great) continue; const l = ctx.path.locate(b.home[0], b.home[2], null, tmp); const k = Math.round(l.s); for (let j = Math.max(0, k - 25); j <= Math.min(269, k + 25); j++) along[j] += 1; }
  const alongMax = Math.max(1, ...along);
  return {
    update(dt, c) {
      const boat = c.boat, t = c.time, sea = shared.sea, W = c.waterLook;
      // ---- a cell of bells is drawn only while the eye is within reach of it
      const loc = c.path.locate(boat.x, boat.z, boat.s, tmp), reach = D.bells.see[1] + 2.2;
      for (const q of systems) { const ds = Math.max(q.s0 - loc.s, 0, loc.s - q.s1), dd = Math.max(q.d0 - loc.d, 0, loc.d - q.d1); q.handle.object.visible = ds * ds + dd * dd < reach * reach; }
      const eye = engine.shared.uCameraPos.value;
      for (const g of greatOnes) g.handle.object.visible = Math.hypot(g.at.x - eye.x, g.at.z - eye.z) < D.great.see[1] + 3;
      // (the water shows nothing of a fish beyond its seeDistance, 15 m here: a ball further off is its far streaks alone; a ball that is bursting reaches seven metres further)
      if (shoals) for (let i = 0; i < balls.length; i++) shoals[i].object.visible = Math.hypot(balls[i].p.x - eye.x, balls[i].p.z - eye.z) < (t - balls[i].last < 16 ? 30 : 23);
      deep.galaxy = along[Math.max(0, Math.min(269, Math.round(loc.s)))] / alongMax;
      // nothing answers in the first dark, nor deep in the cave (the sea's own number)
      const answer = sea ? sea.uniforms.uSeaL.value.y : 1;
      // (under the lit sea a bell must hold its own against the light lying on the water over it: the page's jellies under the near swell)
      { const lift = 1 + D.litLift * (sea ? sea.L || 0 : 0); seeS.value.z = answer * lift; seeG.value.z = answer * lift; }
      const cl = W && W.clarity > 0 ? 1.1 / W.clarity : 0.13;
      waterK.value.x = cl;
      if (far && W) far.uniforms.uWaterK.value.set(cl, W.reflectFloor ?? 0.03, W.reflectivity ?? 0.9, W.fresnel ?? 6);
      // ---- the great ones that are things now, as the eye sees them: each hides the light of the small bells behind it (the far galaxy's shader asks)
      hullU.value.set(boat.x, boat.z, -Math.sin(boat.heading), -Math.cos(boat.heading));
      if (far) {
        far.uniforms.uHull.value.copy(hullU.value);
        const now = engine.shared.uTime.value, U = far.uniforms, sw = U.uSwell.value, calm = c.reducedMotion ? 0.5 : 1, kv = U.uGreatK.value;
        for (let i = 0; i < greatOnes.length && i < kv.length; i++) {
          const g = greatOnes[i], b = farList[g.far]; kv[i] = 0;
          if (!b || !b.great || !g.handle.object.visible) continue;
          const K = 1 - smooth(D.great.see[0], D.great.see[1], Math.hypot(b.home[0] - eye.x, b.home[1] - eye.y, b.home[2] - eye.z)); if (K < 0.02) continue;
          const sd = b.sd * 6.2831853, R = b.home[3] * 0.5, f = (((now / b.period + b.phase) % 1) + 1) % 1;
          let x = b.home[0] + b.wander * Math.sin(now * 0.11 + sd), y = b.home[1] + b.wander * 0.25 * Math.sin(now * 0.07 + sd * 2.1), z = b.home[2] + b.wander * Math.cos(now * 0.09 + sd * 1.7);
          y += (f < 0.45 ? smooth(0, 1, Math.pow(f / 0.45, 0.7)) : 1 - smooth(0, 1, (f - 0.45) / 0.55)) * 0.3 * calm * R;
          for (const v of sw) { const kk = Math.hypot(v.x, v.y); if (kk > 1e-5) { const phs = v.x * x + v.y * z - v.z, e = v.w * Math.exp(kk * Math.min(y, 0)) * calm; y += e * Math.cos(phs); x -= v.x / kk * e * Math.sin(phs); z -= v.y / kk * e * Math.sin(phs); } }
          const hs = c.water.heightAt(x, z), up = eye.y - hs, down = hs - y;
          if (up > 0.05 && down > 0) y = hs - (down + (seenDepth(up, down, Math.max(0.01, Math.hypot(eye.x - x, eye.z - z))) - down) * D.seen);
          U.uGreatAt.value[i].set(x, y, z, R * 0.95); kv[i] = K;
        }
      }
      if (farShoals && W) farShoals.uniforms.uWaterK.value.set(cl, W.reflectFloor ?? 0.03, W.reflectivity ?? 0.9, W.fresnel ?? 6);
      // ---- the others in the water: the dolphins' lead and the whale wake the bells they pass
      if (t >= meetAt && (!others.comets || !others.whale)) { meetAt = t + 1; meet(); }
      const co = others.comets, wh = others.whale;
      if (co) { leadW.radius = co.leadOn ? D.bells.wakeBy.dolphin : 0; if (co.leadOn) leadW.position.copy(co.lead); }
      if (wh) {
        // (its own waker is the middle of its head; two more of this module's lie along its back, so that bells flare along the whole of it)
        const sw = wh.handle && wh.handle.swimmers && wh.handle.swimmers[0], body = sw && sw.body, on = wh.waker.radius > 0 && body && body.length >= 8;
        for (let k = 0; k < bodyW.length; k++) {
          bodyW[k].radius = on ? wh.waker.radius : 0;
          if (on) { const st = Math.min(body.length / 4 - 1, Math.round((body.length / 4 - 1) * (k + 1) / (bodyW.length + 0.6))) * 4; bodyW[k].position.set(body[st], body[st + 1], body[st + 2]); }
        }
      }
      // the bells that are their light alone are woken by the same (the hull never comes within five metres of one)
      if (lone.length && farWake) {
        let any = loneIn > 0; for (const w of wakers) if (w && w.radius > 0) { any = true; break; }
        if (any) {
          const now = engine.shared.uTime.value; loneIn = 0;
          for (const b of lone) {
            let hit = false;
            for (const w of wakers) { if (!w || !(w.radius > 0) || !w.position) continue; const q = w.position, dx = b.x - q.x, dy = b.y - q.y, dz = b.z - q.z, r = w.radius + D.bells.near + b.r; if (dx * dx + dy * dy + dz * dz < r * r) { hit = true; break; } }
            if (hit && !b.inside && now - b.last >= 4.5) { b.last = farWake.array[b.i * 2] = now; farWake.needsUpdate = true; fire('wake', b.x, b.y, b.z, 'small'); }
            b.inside = hit; if (hit) loneIn++;
          }
        }
      }
      if (dbgWake != null && !dbgW && t >= dbgWake) { dbgW = true; deep.wakeNear(boat.x, boat.z, 30); }
      // ---- light the bursts have still to write on the water
      for (let i = dabs.length - 1; i >= 0; i--) { const m = dabs[i]; if (t < m.at) continue; light(m.x, m.z, D.shoals.marks.radius, D.shoals.marks.age); dabs[i] = dabs[dabs.length - 1]; dabs.pop(); }
      if (!shoals) return;
      // ---- the shoals' causes
      if (dbgBurst && !dbgB && t >= (dbgBurst[1] || 0)) { dbgB = true; burst(dbgBurst[0], null, { force: true }); }
      const fx = -Math.sin(boat.heading), fz = -Math.cos(boat.heading);
      bowAt.x = boat.x + fx * 2.0; bowAt.z = boat.z + fz * 2.0;
      const fr = sea && sea.front;
      // the dolphins have driven into the ball they hunt (the comets' own word for it)
      if (co && co.state) { const struck = !!co.state.struck; if (struck && !others.struck && auto.dolphins && co.state.hunting) { let best = 0, bd = 1e9; for (let i = 0; i < balls.length; i++) { const d2 = Math.hypot(balls[i].p.x - co.state.hunting.x, balls[i].p.z - co.state.hunting.z); if (d2 < bd) { bd = d2; best = i; } } if (bd < 12) burst(best + 1, co.leadOn ? co.lead : null, { why: 'dolphins' }); } others.struck = struck; }
      for (let i = 0; i < balls.length; i++) {
        const b = balls[i];
        if (b.due && t >= b.due.at) { const due = b.due; b.due = null; burst(b.n, due.from, { why: due.why }); }
        // the bow bearing down on it
        const dx = b.p.x - bowAt.x, dz = b.p.z - bowAt.z, dist = Math.hypot(dx, dz);
        if (auto.bow && dist < D.shoals.bow[i] && boat.speed > 0.25 && dx * fx + dz * fz > 0 && !b.bowIn) { b.bowIn = true; burst(b.n, bowAt, { why: 'bow' }); }
        if (dist > D.shoals.bow[i] + 2) b.bowIn = false;
        // the foot of the rain front crossing it
        if (fr && D.shoals.front.includes(b.n)) {
          const behind = fr.behind(b.p.x, b.p.z) > -frontLead;                      // (the fish feel it coming: a bloom that opens under the foot itself is lost in the foot's fire)
          if (auto.front && behind && !wasBehind[i] && sea.T >= 0) burst(b.n, { x: b.p.x - fr.nx * 6, y: -0.2, z: b.p.z - fr.nz * 6 }, { front: true, why: 'front' });
          wasBehind[i] = behind;
        }
        // the whale passing beneath: its pressure goes before it
        if (auto.whale && wh && wh.head && wh.waker.radius > 0) {
          const hd = wh.head, near = Math.hypot(hd.x - b.p.x, hd.z - b.p.z) < D.shoals.whale && hd.y > -20 && hd.y < b.p.y - 1.5;
          if (near && !b.whaleIn) burst(b.n, hd, { why: 'whale' });
          b.whaleIn = near;
        }
      }
    },
  };
}
