// The theatre of leaves: the cast, group "Presences" (stage 3; docs/build/theatre/3-cast-presences.md).
//
// The presences made of leaves are the area's reserved thing and its inhabitants (the page, section 5): a full house of
// them, and a company working the stage. Three rows of the cast table live here:
//
//   the sitters    one in every box but one in six (plan.sitters()): a drift of leaves lying on the rail until its tier
//                  kindles, then, 1.5 s behind the flame and over 4 s, a loose spindle of turning leaves behind the rail,
//                  one turn in 5 to 9 s, breathing; a boat passing beneath within 5 m makes those above shed a handful
//   the company    seven on the stage water, gliding on the page's figures of eight; within 9 m of the boat one loses
//                  hold and falls, and finds it again when the boat is 12 m off
//   the fall       once, from tier 5 down: every sitter lets go; most of each pours over its front and streams down and
//                  toward the stage, the rest sinks behind the rail; afterwards about thirty boxes gather a sitter again
//
// No family of the creature toolkit gives this (a spindle with lag, a mantle, strays, state per box, loss of hold and
// release by falling), so it is a shader of this module's own, on the house's paint (H.paint('leaf', { extend })): the
// arithmetic of the first builder's stand-in (kit_multitudes.js, kinds 2 and 3: copied, not edited) grown into the
// page's rules. From the toolkit it takes the hull and its lane (falls.js lifeHull, floaters.js LANE_GLSL: what lies on
// the water makes way for the boat) and the realm's clock (lifeTime).
//
// HOW IT IS MADE. Two instanced meshes of one eight-triangle beech leaf, two draws: the sitters, the company. Nothing is
// simulated: where a leaf is at any moment is a closed function of its own numbers, the show clock, the realm's time
// and a little state for each presence:
//   a sitter's state is one column of a small float texture (tBox): its place, when it forms, when it lets go, when it
//   gathers again, when it last shed a handful and round what, when the gust lifts its drift, the candles beside it;
//   about six tenths of a box's leaves ride in its whirl, the others lie on the floor of the box, out of sight, until the
//   fall takes all of them (a hundred leaves drawn two and a half times life in one whirl were a solid ball of leaves);
//   one of the company is four uniforms: how far round its figure it is, how fast it goes, its HOLD (0 lying on the
//   water .. 1 a spindle), how it turns. Every leaf's place is a function of that one hold, so nothing can pop: a
//   presence that is losing hold and finds the boat gone simply rises again from wherever its leaves are.
// The same arithmetic in script says when and where every leaf of the fall lands (a ring, a callback for the sound), and
// walks every leaf's way down, a tenth of a second at a time, through what is solid: the fronts and the arch from the plan,
// the tree, the chandelier, the lustres and what stands in the water from the Leaves group's model of them (cast.js builds
// first and publishes it as shared.cast.leaves.solid and .onWater; without it the plan's own arithmetic stands alone).
//
// WHAT MUST NEVER HAPPEN (the page): a head, shoulders, arms or a divided base (one spindle, a point at the foot,
// narrowing to a ragged open top: its outline never widens again once it has narrowed); stillness; rigid travel (the
// foot trails 0.6 s, a fifth of the leaves follow 0.8 to 1.5 s late); two turning at one rate; a front (nothing here
// knows where the boat is but the loss of hold, the handful and the hull's lane); a pop (a sitter takes 4 s to form
// and 2.6 s to come apart, the company 6 s and 2.5 to 3 s; leaves leave by falling, on the water they lie and then sink).
//
// WHAT THE STAGING DRIVES is shared.cast.presences (the list is at the end of build()). Left alone the module keeps the
// page's times on the show clock by itself (it forms behind the kindle front, lets go at c 29, gathers again from c 46).
//
// Developer switches (with ?realm=theatre):
//   &presences=0     the first builder's stand-ins instead of these
//   &pres=0.5        draw this share of the leaves (the page: "look at them ... with the leaves at half count")
//   &prlift=2        the gust's wave over the drifts, begun 2 s into the realm's time
//   &prshed=2        every box near the boat sheds a handful 2 s in
//   &prhold=0.4      hold every one of the company at this hold (to look at the stages of losing it)
//   &prlose=3        every one of the company loses hold 3 s in (as if the boat had come near);  &prfind=9  and finds it again 9 s in
//   &prgo=12         the fall begins at show clock 12 instead of 29;   &prover=0.23  the share that goes over the fronts
//   &prdots=1        (script check) a ring on the water wherever the script says a leaf of the fall lands, whatever the distance
//   &prlog=1         one line among the tool's page errors: how many sitters and leaves, how many go over the fronts, the most in the air at once, where they land
//   &prs=1.25,0.5,0.32,1.6,1.1,1.6   a sitter's shape and light, to try: the outline's exponent, its open top, its radius, the candles' strength, the least and most it shows
//   &prcheck=1       (script check) every way down of the fall walked finely through the Leaves group's model of what is solid: how many meet something, among the tool's page errors
//   &prtw=3.4,5.4,8  &prtr=0.085,0.5,0.07,0.22  how far a whirl's trains of leaves are wound, and a sitter's trains (width in turns, share of the leaves; twice)
//   &prtone=0.35,0.1 how far a sitter's copper is taken toward brown before the hour and kindled;   &prfar=0.55  the share of the high leaves carried onto the stage
//   &prsize=1,2.4,2.9,3.8   &prlamp=0.16,0.4,0.24   leaf sizes; the kept lamp on the company
//   &prride=0.5      the share of a box's leaves that ride in its whirl (the others lie on the floor of the box until the fall)
import * as THREE from 'three';
import { lifeHull, lifeTime } from '../../engine/life/falls.js';
import { LANE_GLSL } from '../../engine/life/floaters.js';
import { at, house, dev } from './lib.js';

const TAU = Math.PI * 2;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const S = (x) => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
const lerp = (a, b, t) => a + (b - a) * t;
const frac = (x) => x - Math.floor(x);
const f = (n) => { const s = Number(n).toFixed(4); return s.includes('.') ? s : s + '.0'; };      // a number as GLSL

// What the shader and the script must agree on (metres, seconds).
const K = {
  LEAF: 0.085,            // a beech leaf, 85 by 55 mm
  WATER: 0.012,           // where a leaf lies on the water
  BEHIND: 0.3,            // a sitter's axis stands this far behind its tier's line
  HAND: 0.11,             // the share of a sitter that is its handful: a dozen leaves (those never go over the front in the fall). (At 0.07, eight leaves a box at life size beside the hull, a rider did not see it)
  RISE: 0.6,              // a leaf that leaves over the front crosses the rail 0.14 to 0.42 m above it, and up to this much higher: over the cushion, under the hanging in the head of the box (its fringe hangs 1.3 m above the rail)
  OUT0: 0.55, OUT1: 1.5, OUTK: 2.6,   // a leaf that leaves over the front is carried out: 0.55 m in the first second, 1.5 m more with time constant 2.6 s (clear of the fronts and flames below)
  VF: [1.3, 2.0],         // metres a second a leaf falls in the fall (it streams on a draught), VH: one of a handful in still air (the page: 0.9 to 1.3)
  VH: [0.95, 1.3],
  SWING: 0.42,            // metres it swings to either side on the way down
  SINK: 6,                // seconds it takes to sink once it has soaked
  WIN0: 0.08, WIN1: 0.54, // the company: the share of the whole change of hold that one leaf's own fall or rise takes: this at the foot, and this much more at the top
};
// (the page's five: copper and its neighbours bronze, old gold and purple-bronze; copper and russet lead, old gold is one leaf in ten)
const LEAF_COLOURS = ['#B5522A', '#B5522A', '#A9482A', '#7A3B22', '#8C3D25', '#B07E36', '#5A2630', '#C4622E', '#9A4426', '#B5522A', '#B85A2C', '#8C4A28'];

/**
 * One beech leaf, one unit long: ovate, widest just below the middle, a short point, one side a little fuller than the other, folded
 * on the midrib. Eight triangles (eight points round its edge: drawn two or three times life, a six-pointed one was a chip of card).
 * Its stalk toward -Z, its tip +Z, its upper face +Y. uv: across it (0.5 on the midrib), along it (0 at the stalk).
 */
function leafCard() {
  const fold = Math.tan(11 * Math.PI / 180), y = (x) => Math.abs(x) * fold;
  const P = [[0, 0, -0.5], [0, 0, -0.06], [0, 0, 0.5],                                       // stalk end, the midrib's middle, the tip
    [-0.2, 0, -0.3], [-0.31, 0, -0.02], [-0.19, 0, 0.29],                                   // the fuller side
    [0.18, 0, -0.3], [0.28, 0, -0.02], [0.17, 0, 0.29]].map(([x, , z]) => [x, y(x), z]);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(P.flat(), 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(P.flatMap((p) => [p[0] / 0.62 + 0.5, p[2] + 0.5]), 2));
  geo.setIndex([0, 3, 1, 1, 3, 4, 1, 4, 5, 1, 5, 2, 0, 1, 6, 1, 7, 6, 1, 8, 7, 1, 2, 8]);
  geo.computeVertexNormals();
  return geo;
}

// A leaf's own paint (it is drawn two or three times life, so it must be a leaf and not a chip of card): a dark midrib, the veins
// that leave it on the slant, a margin a little darker than the blade, one half lighter than the other across the fold.
const LEAF_PAINT = /* glsl */`{
      float lfX = abs(vUv0.x - 0.5) * 2.0, lfV = abs(fract(vUv0.y * 5.0 - lfX * 1.6) - 0.5);
      albedo *= (0.74 + 0.26 * smoothstep(0.02, 0.13, lfX)) * (0.9 + 0.1 * smoothstep(0.06, 0.2, lfV)) * (1.0 - 0.2 * smoothstep(0.62, 1.0, lfX)) * (vUv0.x < 0.5 ? 1.0 : 0.9);
      // (the page's copper, #B5522A, comes off the ride's tone curve and its grade as scarlet: taken a quarter of the way toward a warm
      // brown of its own value, it comes off them as copper)
      albedo = mix(albedo, dot(albedo, vec3(0.3, 0.55, 0.15)) * vec3(1.3, 0.94, 0.62), uPrTone);
    }`;

// ================================================================================================ GLSL the two meshes share
const COMMON = /* glsl */`
  uniform float uShow, uLifeNow;
  uniform vec4 uPrA;                       // the share of a sitter that goes over the front, metres kept clear round the eye, motion (1, or less when calm), how many times life size a far leaf is drawn
  uniform vec4 uPrB;                       // the pass being drawn (0 the picture, 1 the picture without the water, 2 the mirror); the outline: its exponent, how wide its open top stays; how far out the leaves' middles ride (a share of R: a leaf drawn large reaches beyond its own middle)
  uniform vec3 uPrDraught;                 // the way the draught carries what floats (x, z) and how fast (metres a second)
  uniform vec4 uPrC;                       // a leaf of the fall floats for this many seconds, and up to this many more, before it soaks and sinks; -, -
  uniform vec4 uPrSize;                    // how many times life size a leaf is drawn: in the air beside the eye; riding in a whirl; in the air across the stalls; across the house
  uniform vec4 uPrShade;                   // a whirl's own shade: how dark what rides deep inside it is, how dark what rides on the side away from the light; -, -
  uniform vec2 uPrTwist;                   // radians a sitter's trains of leaves are wound round its axis from foot to top: at least, at most (each box its own)
  uniform vec4 uPrRide;                    // how much a leaf lingers in the belly as it climbs (0 an even climb .. 0.15 nearly all of them at mid-height); -, -, -
  const float PR_TAU = 6.2831853, PR_PI = 3.14159265;
  const float PR_UP = 0.82;                // the share of its round a leaf spends climbing the whirl (the rest it spends coming down the outside)
  float prS(float x) { x = clamp(x, 0.0, 1.0); return x * x * (3.0 - 2.0 * x); }
  float prHash(float n) { return fract(sin(n * 12.9898 + 4.1) * 43758.5453); }
  // A leaf in the air is drawn larger than life the further off it is, as stage snow is and as the beech's own leaves are (they are
  // five times life): life size beside the hull, twice at nine metres, three times across the stalls. At the page's one and a half
  // times a sitter was a sprinkle of three-pixel flecks and the fall could not be seen from the stalls (the log, "Second look").
  float prBig(float d) { return mix(mix(uPrSize.x, uPrSize.z, smoothstep(2.0, 22.0, d)), uPrSize.w, smoothstep(34.0, 70.0, d)); }
  // (a leaf riding in a whirl keeps one size from five metres to eight, and grows from there to the far wall: from the middle of the
  // house, twenty metres from either wall, a leaf of 2.4 times life is eight pixels, the painter's brush takes it into the dark of
  // its box, and a sitter was a dim scatter. Three times at twenty metres, 3.8 times at forty and beyond)
  float prWhirl(float d) { return mix(mix(0.7 * uPrSize.y, uPrSize.y, smoothstep(2.5, 5.5, d)), uPrSize.w, pow(clamp((d - 8.0) / 34.0, 0.0, 1.0), 0.8)); }
  // (what lies on the water is seen from beside the hull, among the Leaves group's own: nearly life size)
  float prLow(float d) { return mix(1.0, 1.4, smoothstep(6.0, 16.0, d)); }
  // The outline of a presence: R sin(pi u^k), a point at the foot; ragged and open at the top (it never closes to a point
  // there; and once it has narrowed it never widens again: no neck, no head).
  float prEnv(float u) { return max(sin(PR_PI * pow(max(u, 0.0), uPrB.y)), uPrB.z * prS((u - 0.45) / 0.45)); }
  // A presence is a whirl of leaves, and a leaf in a whirl does not keep its height: it is drawn in at the foot, climbs
  // the inside going round, is thrown out at the ragged top and comes down the outside (the page's strays, 1.5 to 2.5 R
  // out), to be drawn in at the foot again. Where a leaf is in that round: (how far up 0..1, 0 while it climbs and
  // 0..1 as it comes down the outside, how far through its round, seconds a round takes).
  // seat: (-, where in its round it began, its share of the radius, where round the axis it began); sd: its own four numbers.
  vec4 prRide(vec4 seat, vec4 sd, float t) {
    float Tc = mix(13.0, 24.0, sd.x), ph = fract(seat.y + t / Tc);
    float up = min(ph / PR_UP, 1.0), dn = clamp((ph - PR_UP) / (1.0 - PR_UP), 0.0, 1.0);
    // (it climbs a little more slowly through the belly, where more of the leaves therefore are, and more quickly at the foot and the top.
    // With uPrRide.x at 0.105, as it first was, five times as many rode at mid-height as at the ends: a ball of leaves, not a spindle)
    return vec4(dn > 0.0 ? 1.0 - dn * dn * (3.0 - 2.0 * dn) : up + uPrRide.x * sin(PR_TAU * up), dn, ph, Tc);
  }
  // Where it is. foot: the point at the whirl's foot; tall, R: its height and radius; w: radians a second (its sign is
  // the way it turns). Out: tang, the way the leaf is travelling; outside: 0 in the body .. 1 out among the strays.
  vec3 prSpin(vec3 foot, float tall, float R, float w, float twist, float t, vec4 seat, vec4 sd, vec4 ride, out vec3 tang, out float outside) {
    float u = ride.x, dn = ride.y, ph = ride.z, Tc = ride.w, rr = seat.z;
    float sg = w < 0.0 ? -1.0 : 1.0;
    // round the axis: 1.4 times the whirl's rate at the foot, 0.8 at the top (the page), half of it outside. (A: its mean over a
    // round, so that after every round a leaf is where it was among the others.)
    const float A = PR_UP * 1.1 + (1.0 - PR_UP) * 0.55;
    float G = ph < PR_UP ? (1.4 - A) * ph - 0.3 * ph * ph / PR_UP : (1.1 - A) * PR_UP + (0.55 - A) * (ph - PR_UP);
    // A whirl of leaves is not an even sleeve of them: leaves chase one another round it in trains, and the trains wind up it.
    // seat.w is where round the axis a leaf rides (most of them in two or three trains: see where the leaves are made); the
    // trains are wound round the axis by twist radians from foot to top, against the turning, so that as the whirl turns
    // they are seen to climb it. That, the far side seen through the gaps between them, and the lit side, are what let the eye
    // read one turning thing in a still picture and from across the house. Each leaf wanders a little in its train.
    float ang = seat.w * PR_TAU + w * (A * t + Tc * G) - sg * twist * u + 0.3 * sin(t * (0.17 + 0.3 * sd.w) + sd.y * 40.0);
    float top = prS((u - 0.6) / 0.4);
    float rin = R * uPrB.w * prEnv(u) * rr * (1.0 + top * (1.5 * sd.z - 0.5));                // (toward the top it is ragged: some of its leaves fly wide, some close in)
    // What rides outside comes down a shell of the whirl's own outline, one and a half to two and a half times as wide: widest round
    // the belly, closing on the foot all the way down (never a skirt there) and narrow at the top it left by. (As an upturned cone,
    // widest at the top, the whole thing was a small tree in leaf: a crown on a stem.)
    float back = max(prEnv(u), 0.3 * smoothstep(0.0, 0.2, u));
    outside = prS(dn / 0.3) * smoothstep(0.0, 0.3, u);
    float r = dn > 0.0 ? mix(R * uPrB.w * uPrB.z * rr * (0.5 + 1.5 * sd.z), R * mix(1.5, 2.5, sd.z) * back, prS(dn / 0.3)) : rin;
    r += outside * R * 0.14 * uPrA.z * sin(t * (1.3 + 0.8 * sd.w) + sd.y * 40.0);              // outside it swings as it comes down
    float toss = 0.07 * tall * (0.4 + 1.2 * sd.y) * sin(PR_PI * clamp(dn / 0.4, 0.0, 1.0));    // thrown out at the top, it rises a little before it falls
    vec2 lean = (u * u * 0.045 * tall) * vec2(sin(t * 0.61 + foot.x * 1.7), cos(t * 0.47 + foot.z * 1.3));      // the axis is never quite plumb
    vec2 cs = vec2(cos(ang), sin(ang));
    float vy = dn > 0.0 ? -tall * 6.0 * dn * (1.0 - dn) / ((1.0 - PR_UP) * Tc) : tall * (1.0 + PR_TAU * uPrRide.x * cos(PR_TAU * min(ph / PR_UP, 1.0))) / (PR_UP * Tc);
    float vr = max(r, 0.08) * abs(w) * (dn > 0.0 ? 0.55 : 1.1);
    tang = normalize(vec3(-cs.y * sg * vr, vy, cs.x * sg * vr));                                // round, and up the inside or down the outside: leaves lie along that stream
    return foot + vec3(lean.x + cs.x * r, u * tall + toss, lean.y + cs.y * r);
  }
  // How a leaf lies. along: its length; up: the way its face looks when it lies; beta: how far it has rolled about its
  // own length; air: 0 lying .. 1 free in the air (a lying leaf is flat however far it has rolled, so nothing snaps).
  mat3 prPose(vec3 along, vec3 up, float beta, float air) {
    vec3 L = normalize(along + vec3(1.0e-4, 0.0, 0.0));
    vec3 Uw = normalize(up - L * dot(up, L) + vec3(0.0, 1.0e-3, 2.0e-3));
    vec3 Sd = cross(L, Uw);
    vec3 N = normalize(cos(beta) * Uw + (air * sin(beta)) * Sd + vec3(0.0, 1.0e-4, 0.0));
    return mat3(cross(N, L), N, L);
  }
  // Nothing comes nearer the rider's eye than the room kept (it is eased aside, never switched off), and what comes down
  // over the rider's own boat lands on its deck instead of going through it.
  void prClear(inout vec3 p, inout float live) {
    vec3 e = p - uCameraPos; float d2 = dot(e, e), R = uPrA.y;
    if (d2 < 16.0 * R * R) {
      float d = sqrt(d2), k = 1.0 - smoothstep(0.0, 4.0 * R, d);
      p = uCameraPos + e * (sqrt(d2 + R * R * k * k) / max(d, 1.0e-3));
      live *= smoothstep(0.0, 0.25 * R, d);
    }
    vec2 hb = uLifeHull.zw - uLifeHull.xy, hp = p.xz - uLifeHull.xy;
    float hd = length(hp - hb * clamp(dot(hp, hb) / max(dot(hb, hb), 1.0e-4), -0.12, 1.3));
    float deck = 0.2 * (1.0 - smoothstep(uLifeHullB.x + 0.1, uLifeHullB.x + 0.3, hd));
    if (deck > 0.005) live *= smoothstep(deck, deck + 0.07, p.y);
  }
`;

// A leaf that has left its box over the front (the fall; a handful). Sitters only.
const OUT = /* glsl */`
  // tau: seconds since it let go; from: where it is carried from (its place in the whirl, or on the rail); rail: its
  // box's line at the rail top; nin: into the room; tgt: where it lands; vf: slowest and fastest fall; y0: the height
  // it crosses the rail at (over the cushion, under the hanging in the head of the box); lie: seconds it floats;
  // rest: 1 it stays on the bed when it has sunk, 0 it goes on down out of sight.
  // Returns its place; air: 1 in the air .. 0 lying; live: its size (1, or less as it goes); end: when all of it is
  // over; afloat: 0 until it lands .. 1 on the water and under it.
  vec3 prOut(float tau, vec3 from, vec3 rail, vec2 nin, vec2 tgt, vec2 vf, float y0, float lie, float rest, vec4 sd, float beta, out float air, out float live, out float end, out float afloat) {
    float v = mix(vf.x, vf.y, sd.x);
    float T = 1.0 + (y0 - ${f(K.WATER)}) / v;
    end = T + lie + ${f(K.SINK)};
    live = 1.0; afloat = prS((tau - T + 0.35) / 0.35);
    float q = clamp((tau - 0.6) / (T - 0.6), 0.0, 1.0), qs = q * q * (3.0 - 2.0 * q);
    float O = ${f(K.OUT0)} * prS(tau) + ${f(K.OUT1)} * (1.0 - exp(-tau / ${f(K.OUTK)})), OT = ${f(K.OUT0)} + ${f(K.OUT1)} * (1.0 - exp(-T / ${f(K.OUTK)}));
    vec2 xz = rail.xz + nin * O + (tgt - rail.xz - nin * OT) * mix(q, qs, 0.7);
    // it swings as it goes, and comes to rest over the place it lands
    vec2 dir = normalize(tgt - rail.xz + vec2(1.0e-4, 0.0)), side = vec2(-dir.y, dir.x);
    float sw = PR_TAU * mix(0.4, 0.6, sd.z) * tau + sd.w * 40.0, env = prS(q / 0.25) * prS((1.0 - q) / 0.2);
    xz += (side * sin(sw) + dir * (0.45 * cos(sw))) * (${f(K.SWING)} * (0.6 + 0.8 * sd.y) * env * uPrA.z);
    // it hangs each time it comes flat and dives edge on
    float y = ${f(K.WATER)} + (y0 - ${f(K.WATER)}) * (1.0 - mix(q, qs, 0.4)) + 0.12 * sin(2.0 * beta) * sin(PR_PI * q);
    // for its first second it still goes with the place it had: it comes to the height it crosses the rail at, then goes out over it
    // (so that a leaf from the top of the whirl goes out UNDER the hanging in the head of its box)
    float gy = prS(tau / 0.7), gx = prS((tau - 0.25) / 0.95);
    vec3 p = vec3(mix(from.x, xz.x, gx), mix(from.y, y, gy), mix(from.z, xz.y, gx));
    air = 1.0 - prS((tau - T + 0.35) / 0.35);
    if (tau > T) {
      // afloat: it drifts with the draught, makes way for the hull, and when it has soaked it sinks to the bed
      float fl = tau - T, sk = prS((fl - lie) / ${f(K.SINK)});
      p.xz = tgt + uPrDraught.xy * (uPrDraught.z * min(fl, lie + 2.0));
      vec2 toBoat = p.xz - uBoat.xz;
      if (dot(toBoat, toBoat) < 100.0) p.xz += lanePush(p.xz, 0.2, 1.2, 20.0, sd.x) * (1.0 - sk);
      float bed = -p.z > 90.8 ? 0.46 : 1.17;                                                    // the stage's boards lie half a metre down, the stalls and the pit deeper
      p.y = ${f(K.WATER)} - mix(1.9, bed, rest) * sk * sk + 0.003 * sin(uLifeNow * 1.3 + sd.y * 40.0) * (1.0 - sk);
      p.xz += side * (0.14 * sin(fl * 0.7 + sd.x * 20.0) * sin(PR_PI * sk));                    // it sways as it goes down
      air = 0.4 * sin(PR_PI * sk);
      live = mix(1.0 - prS((fl - lie - 3.0) / 3.0), 1.0, rest);
    }
    return p;
  }
`;

// ================================================================================================ the module
export async function build(ctx, plan, shared) {
  shared.cast = shared.cast || {};
  const PP = plan.presences;
  if (!PP || !PP.on) return {};                                             // (&presences=0: the first builder's stand-ins stand instead)
  const H = house(ctx, plan, shared), U = H.U, show = shared.show || { c: -1 };
  const clock = lifeTime(ctx), hull = lifeHull(ctx), sh = ctx.engine.shared;
  const calm = !!ctx.reducedMotion, dens = ctx.quality.density;
  const W = (s, d, y = 0) => at(ctx, s, d, y);
  // the route is one straight line: a metre along it and a metre to its right, in the realm's x and z
  const o0 = W(0, 0), TS = W(1, 0).sub(o0), RD = W(0, 1).sub(o0);
  const toXZ = (s, d) => [o0.x + TS.x * s + RD.x * d, o0.z + TS.z * s + RD.z * d];
  const lampD = dev.has('lampd') ? +dev.get('lampd') : plan.lamp.d;
  const share = dev.has('pres') ? clamp(+dev.get('pres') || 1, 0.05, 1) : 1;
  const passOf = (renderer) => (ctx.engine.reflecting ? 2 : renderer.getRenderTarget() === ctx.engine.pre ? 1 : 0);
  const leaf = leafCard();
  const colours = LEAF_COLOURS.map((h) => new THREE.Color(h));
  const pick = (rnd, out, i) => { const c = colours[Math.floor(rnd() * colours.length)], k = 0.86 + 0.28 * rnd(); out[i] = c.r * k; out[i + 1] = c.g * k; out[i + 2] = c.b * k; };
  const DRAUGHT = 0.15, LIE = [8, 22];                                      // metres a second what floats is carried toward the stage; seconds a leaf of the fall lies before it soaks: at least, and up to so many more
  // The presences keep their own time: the show clock, but never more than a third faster than the realm's own seconds. (The show
  // clock is pushed on by the boat's progress: a rider who paddles gets the show faster, up to three seconds of it in one. Leaves
  // that came apart and fell on that clock fell like stones. On their own time the sitters form, let go, fall, soak and gather at a
  // leaf's pace, a little behind a pushed clock, and catch it up. Left to the current the two are one.)
  const SHOW = { value: show.c }, RATE = 1.3; let cs = show.c;
  const A = { uShow: SHOW, uLifeNow: clock.uLifeNow, uLifeHull: hull.uniforms.uLifeHull, uLifeHullB: hull.uniforms.uLifeHullB, uLifeLane: hull.uniforms.uLifeLane,
    uPrA: { value: new THREE.Vector4(PP.sitters.over * (calm ? 1 / 3 : 1), calm ? 1.6 : 0.9, calm ? 0.5 : 1, 1.5) }, uPrB: { value: new THREE.Vector4(0, 0, 0, 0) },
    uPrDraught: { value: new THREE.Vector3(TS.x, TS.z, DRAUGHT) }, uPrC: { value: new THREE.Vector4(LIE[0], LIE[1], 0, 0) },
    uPrSize: { value: new THREE.Vector4(...(PP.size || [1, 2.4, 2.9, 3.8])) }, uPrShade: { value: new THREE.Vector4(0.36, 0.5, 0, 0) },
    uPrTwist: { value: new THREE.Vector2(...(PP.sitters.twist || [3.4, 5.4])) } };
  // (&prtw=3.4,5.4,8 : to try how far the trains are wound: a sitter's least and most, the company's)
  const tryTwist = (dev.get('prtw') || '').split(',').map((v) => (v === '' ? NaN : +v));
  if (Number.isFinite(tryTwist[0]) && Number.isFinite(tryTwist[1])) A.uPrTwist.value.set(tryTwist[0], tryTwist[1]);
  /**
   * Where round its whirl a leaf rides, in turns (0..1). `trains`: [[where, how wide, share of the leaves], ...]; what is left of the
   * leaves rides anywhere. (Leaves chase one another round a whirl in trains: see prSpin.)
   */
  const seatIn = (rnd, trains) => { let x = rnd(); for (const [c, wide, part] of trains) { if (x < part) return frac(c + wide * ((rnd() + rnd() + rnd()) / 1.5 - 1) + 2); x -= part; } return rnd(); };
  if (dev.has('prsize')) { const q = dev.get('prsize').split(',').map(Number); if (q.length === 4 && q.every(Number.isFinite)) A.uPrSize.value.set(q[0], q[1], q[2], q[3]); }
  // (with fewer leaves, at medium and low quality, each is drawn a little larger: a presence keeps its body)
  { const k = dens >= 1 ? 1 : dens >= 0.75 ? 1.08 : 1.22, v = A.uPrSize.value; v.set(v.x, v.y * k, v.z * k, v.w * k); }
  const ROOM = { value: new THREE.Color(0, 0, 0) }, roomCol = new THREE.Color('#FFF6DA'), MOON = { value: new THREE.Color(0, 0, 0) }, moonLit = new THREE.Color('#C4D6D0');      // the lit house's light on a leaf in its air (times the share of flames burning)
  if (dev.has('prover')) A.uPrA.value.x = clamp(+dev.get('prover'), 0, PP.sitters.over);

  // ============================================================================================ THE SITTERS
  const PS = PP.sitters, rnd = ctx.rng(1705);
  const qf = dens >= 1 ? 1 : dens >= 0.75 ? 0.75 : PS.low;                  // (the page's ladder: sitters to 30 leaves at low quality)
  // A sitter does not carry all the leaves of its box. Leaves are drawn two and a half times life (the painter's filter eats anything
  // smaller), and a hundred of that size in a spindle 0.64 m across have five times the area of its outline: a solid ball of leaves, a
  // posy on the rail. So about half of a box's leaves ride in its whirl (the page's own count: fifty a sitter; the key painting: some thirty
  // large leaves and the dark of the box seen through them) and the others lie on the floor of the box behind the parapet, out of sight
  // from the water, until the fall takes all of them over the front (the director: a fall of about 12,000). &prride=0.5 to try.
  const rideOf = PS.ride || [0.5, 0.6, 0.75], RIDE = dev.has('prride') ? clamp(+dev.get('prride'), 0.1, 1) : dens >= 1 ? rideOf[0] : dens >= 0.75 ? rideOf[1] : rideOf[2];
  // ---- the candles beside each box: the girandoles on its two piers; the five-candle branch of a stage box; the royal box's
  const candles = plan.girandoles().map((q) => ({ s: q.wicks[1].s, d: q.wicks[1].d, y: q.wicks[1].y, t: q.t }));
  for (const fl of plan.flames()) {
    if (fl.where !== 'stagebox' && fl.where !== 'royal') continue;
    if (!candles.some((q) => q.own && Math.hypot(q.s - fl.s, q.d - fl.d, q.y - fl.y) < 0.75)) candles.push({ s: fl.s, d: fl.d, y: fl.y, t: fl.t, own: true });
  }
  const lustres = plan.lustresAt().map((L) => L.centre);
  const tune0 = (dev.get('prs') || '').split(',').map((v) => (v === '' ? NaN : +v)), tuneShow = [Number.isFinite(tune0[4]) ? tune0[4] : PS.show[0], Number.isFinite(tune0[5]) ? tune0[5] : PS.show[1]];
  // ---- every box that has a sitter
  // (the box the tree's great limb has grown into has no sitter: the tree sits there)
  const limbEnd = plan.beech.limb.to, noLimb = (q) => !(Math.abs(q.y - limbEnd[2]) < 1.5 && Math.hypot(q.s - limbEnd[0], q.d - limbEnd[1]) < 2.2);
  const boxes = plan.sitters().filter(noLimb).map((q) => {
    const inS = -Math.cos(q.turn), inD = Math.sin(q.turn);                 // into the room, in (s, d)
    let lineS = q.s + inS * 0.75, lineD = q.d + inD * 0.75;                // its tier's line (plan.sitters() stands them 0.75 m behind it; the director: 0.3 m)
    const rear = Math.abs(Math.abs(q.turn) - Math.PI) < 1e-3;
    // (a stage box is six metres wide with its five-candle branch on the middle of its front: its sitter stands a metre and a half to
    // one side of the middle, a different side on each level, or it would turn right behind the flames)
    if (!rear && lineS > 84.6) { const k = (q.tier % 2 ? 1 : -1) * (lineD < 0 ? 1 : -1) * 1.5; lineS += -inD * k; lineD += inS * k; }
    const side = lineD < 0 ? -1 : 1, tall = PS.foot + lerp(tuneShow[0], tuneShow[1], q.seed);
    const axis = W(lineS - inS * PS.behind, lineD - inD * PS.behind, q.y), ln = toXZ(lineS, lineD);
    const nin = new THREE.Vector2(TS.x * inS + RD.x * inD, TS.z * inS + RD.z * inD).normalize();
    const arc58 = rear ? plan.arc.at58 - plan.arc.rearFace + Math.max(0, plan.frontD(plan.archWall.face) - Math.abs(lineD)) : Math.abs(plan.frontArcAtS(clamp(lineS, 30.2, 90)) - plan.arc.at58);
    const lit = candles.map((L) => ({ L, r: Math.hypot(L.s - lineS, L.d - lineD, (L.y - (q.y + 0.42)) * 1.5) })).filter((e) => e.r < 2.7).sort((a, b) => a.r - b.r).slice(0, 2).map((e) => e.L);
    const byLustre = q.tier === 2 && lustres.some((c) => Math.hypot(c.s - lineS, c.d - lineD) < 3.6);      // a lustre hangs in the way of anything that leaves this box toward the water
    const byMound = Math.hypot(lineS - plan.beech.s, lineD - plan.beech.d) < 14.5;
    return { tier: q.tier, s: lineS, d: lineD, inS, inD, rail: q.y, tall, rear, side, axis, lineX: ln[0], lineZ: ln[1], nin, arc58,
      R: (dev.has('prs') && +(dev.get('prs').split(',')[2] || 0) > 0 ? +dev.get('prs').split(',')[2] : PS.R) * (0.98 + 0.28 * rnd()), period: lerp(PS.turn[0], PS.turn[1], rnd()) * (rnd() < 0.5 ? -1 : 1), tForm: q.t, tGo: 1e9, tAgain: 1e9,
      lit, reach: byMound ? 1.4 : 3.0, sheds: q.tier <= 2 && !byLustre, shedAt: -1e9, shedOnce: false, rest: PS.handful.rest * (0.8 + 0.6 * rnd()), hand: [],
      rides: clamp(RIDE + ((PS.rideHigh || [])[q.tier] || 0) + 0.16 * (rnd() - 0.5), 0.2, 1) };      // the share of its box's leaves that ride in the whirl (each box its own; more on the high tiers, which have fewer leaves and are seen from across the house)
  });
  const nBox = boxes.length;

  // ---- where a leaf of the fall may land, and the way there (the page's coordinates: s along, d to the right, y up)
  const B = plan.beech, CH = plan.chandelier, limbA = [B.limb.from[0], B.limb.from[1], B.limb.from[2]], limbB = [B.limb.to[0], B.limb.to[1], B.limb.to[2]];
  const hangA = [B.s, B.d, B.fork], hangB = [CH.s, CH.d, CH.hangsFrom];                              // the limb the chandelier hangs from
  const segDist = (p, a, b) => { const ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], ap = [p[0] - a[0], p[1] - a[1], p[2] - a[2]], t = clamp((ap[0] * ab[0] + ap[1] * ab[1] + ap[2] * ab[2]) / (ab[0] * ab[0] + ab[1] * ab[1] + ab[2] * ab[2]), 0, 1); return Math.hypot(ap[0] - ab[0] * t, ap[1] - ab[1] * t, ap[2] - ab[2] * t); };
  const pit = [[plan.orchestra.harp[0], plan.orchestra.harp[1], 0.8], [plan.orchestra.bass[0], plan.orchestra.bass[1], 0.7], [plan.orchestra.timpani[0], plan.orchestra.timpani[1], 1.0], ...plan.orchestra.stands.map(([s, d]) => [s, d, 0.5])];
  // (the box fronts' line as a table, a point every five centimetres of s: how far it stands from the centre line, and the cosine of its
  // slant to the axis. Every way down asks it at seventy places; plan.frontD searches the curve each time it is asked)
  const FD0 = 30, FDN = 1201, frontTab = new Float32Array(FDN), frontCos = new Float32Array(FDN);
  for (let i = 0; i < FDN; i++) frontTab[i] = plan.frontD(FD0 + i * 0.05);
  for (let i = 0; i < FDN; i++) { const a = Math.max(0, i - 6), c = Math.min(FDN - 1, i + 6), slope = (frontTab[c] - frontTab[a]) / ((c - a) * 0.05); frontCos[i] = 1 / Math.sqrt(1 + slope * slope); }
  const fdAt = (s) => clamp(Math.round((s - FD0) * 20), 0, FDN - 1);
  /** Half the width of clear water at s: inside the box fronts, the proscenium's jambs, the wings. */
  const halfAt = (s) => (s < 88.9 ? frontTab[fdAt(Math.max(s, 30.2))] - 1.6 : s < 91.5 ? 10.6 : 9.6);
  /** May a leaf of box b be at (s, d, y) on its way down? */
  const clearAt = (b, s, d, y) => {
    const ad = Math.abs(d);
    if (s < 90.9) {
      // the fronts, the boxes and the flames below it: every tier stands a quarter of a metre further back than the one beneath
      const own = y >= b.rail - 1.4;
      if (!own || y < b.rail + 0.12) {
        const ty = own ? b.tier : clamp(Math.floor((y + 0.22) / 3.2), 0, b.tier - 1), need = own ? 0.42 : ty ? 0.95 : 0.45;
        const fi = fdAt(clamp(s, 30.5, 89.7));                                                            // (the fronts run obliquely to the axis at both ends of the house: metres into the room are measured square to them)
        if (Math.min((frontTab[fi] - ad) * frontCos[fi] + 0.25 * ty, s - plan.archWall.face) < need) return false;
      }
      if (y > 6.0 && y < 10.7) for (const c of lustres) if (Math.hypot(s - c.s, d - c.d) < 1.2) return false;
      // the beech: its mound at the water, its bole, its fork, the great limb, the limb the chandelier hangs from; the chandelier and its spare chain
      const r = Math.hypot(s - B.s, d - B.d);
      if (y < 2.4 ? r < 5.8 : y < 12 ? r < 2.2 : y < 15.5 ? r < 3.2 : false) return false;
      if (y > 10 && y < 26 && (segDist([s, d, y], limbA, limbB) < 0.95 || segDist([s, d, y], hangA, hangB) < 1.0)) return false;
      const rc = Math.hypot(s - CH.s, d - CH.d);
      if ((y > 14.3 && y < 23.5 && rc < 3.6) || (y > 11.3 && y <= 14.3 && rc < 0.9)) return false;
    }
    if (s > 88.9 && s < 91.3 && (ad > 11.2 || y > Math.min(plan.archHead(d) - 0.7, 11.6))) return false;      // through the arch, under the curtain's scallops
    if (s >= 91.3) {
      if (ad > 10.0 || (s > 95.2 && y > 9.2)) return false;                                              // the wings; the borders
      if (s > 103.2 && s < 105.0 && d > -11.6 && d < -0.8 && y > 3.9) return false;                      // cloud car A, wherever it is on its way
      if (s > 114.2 && s < 115.9 && d > -10 && d < 1 && y > 6.2) return false;                           // cloud car C
      if (y < 3.2 && Math.hypot(s - plan.lamp.s, d - lampD) < 0.75) return false;                        // the kept lamp
    }
    return true;
  };
  // What is solid, as the Leaves group has it (cast.js builds before this module and publishes its model: the trunk, every limb, the
  // chandelier and what lies on the mound as voxels of their own models, the lustres with their brackets, what stands in the water, the
  // stage's machines). Of its codes: 3 a lustre, 4 wood, 5 the chandelier, 6 something standing in the water, 8 the stage. (Its fronts and
  // its arch are this module's own above: a leaf of a sitter must leave its own box over its own rail, and that model knows no box as a leaf's own.)
  const LV = shared.cast.leaves || null, lvSolid = LV && typeof LV.solid === 'function' ? LV.solid : null, lvWater = LV && typeof LV.onWater === 'function' ? LV.onWater : null;
  const meets = (s, d, y) => { if (!lvSolid) return 0; const c = lvSolid(s, d, y); return c === 3 || c === 4 || c === 5 || c === 6 || c === 8 ? c : 0; };
  /**
   * The way down for a leaf of box b that leaves over the front at height fromY and lands at (sL, dL): is all of it clear? (The same
   * arithmetic as prOut.) Walked a tenth of a second at a time (a leaf on the draught goes three metres a second: at fourteen places a
   * way, as it was first walked, a limb or a lustre's bracket could stand between two of them, and 400 ways in 11,600 went through one).
   * `swing`: metres the leaf swings to either side of this way as it goes: near the tree that much room is asked on both sides of it.
   */
  const wayClear = (b, fromY, y0, T, sL, dL, swing = 0.45) => {
    const OT = K.OUT0 + K.OUT1 * (1 - Math.exp(-T / K.OUTK)), n = Math.max(14, Math.ceil(T / 0.1));
    const ws = sL - b.s, wd = dL - b.d, wl = Math.hypot(ws, wd) || 1, sideS = -wd / wl * swing, sideD = ws / wl * swing;
    let ps = b.s, pd = b.d, py = fromY;
    for (let k = 1; k <= n; k++) {
      const tau = T * k / n, q = clamp((tau - 0.6) / (T - 0.6), 0, 1), qs = q * q * (3 - 2 * q), e = lerp(q, qs, 0.7);
      const O = K.OUT0 * S(tau) + K.OUT1 * (1 - Math.exp(-tau / K.OUTK));
      const s = b.s + b.inS * O + (sL - b.s - b.inS * OT) * e, d = b.d + b.inD * O + (dL - b.d - b.inD * OT) * e;
      const y = K.WATER + (lerp(fromY, y0, S(tau / 0.8)) - K.WATER) * (1 - lerp(q, qs, 0.4));
      // (the proscenium is thinner than a step is long: where a step crosses it, look at the crossing itself)
      if ((ps - 90) * (s - 90) < 0) { const w = (90 - ps) / (s - ps); if (!clearAt(b, 90, lerp(pd, d, w), lerp(py, y, w))) return false; }
      if (k < n) {
        if (!clearAt(b, s, d, y)) return false;
        if (lvSolid && tau > 0.9) {
          if (meets(s, d, y)) return false;
          // (the swing dies away over the last fifth of the way: prOut)
          const sw = S(q / 0.25) * S((1 - q) / 0.2);
          if (sw > 0.05 && y < 30 && Math.abs(s - B.s) < 14 && Math.abs(d - B.d) < 14 && (meets(s + sideS * sw, d + sideD * sw, y) || meets(s - sideS * sw, d - sideD * sw, y))) return false;
        }
      }
      ps = s; pd = d; py = y;
    }
    return true;
  };
  /** (&prcheck=1) The same way walked finely through the Leaves group's model of what is solid (shared.cast.leaves.solid: the tree and the chandelier as voxels of their own models): what it meets, by that model's codes. */
  const wayMeets = (b, y0, T, sL, dL, solid, hits) => {
    const OT = K.OUT0 + K.OUT1 * (1 - Math.exp(-T / K.OUTK)), n = Math.max(30, Math.ceil(T / 0.08));
    for (let k = 1; k < n; k++) {
      const tau = T * k / n, q = clamp((tau - 0.6) / (T - 0.6), 0, 1), qs = q * q * (3 - 2 * q), e = lerp(q, qs, 0.7);
      const O = K.OUT0 * S(tau) + K.OUT1 * (1 - Math.exp(-tau / K.OUTK));
      const s = b.s + b.inS * O + (sL - b.s - b.inS * OT) * e, d = b.d + b.inD * O + (dL - b.d - b.inD * OT) * e;
      const y = K.WATER + (y0 - K.WATER) * (1 - lerp(q, qs, 0.4));
      const code = solid(s, d, y);
      if (code > 2 && code < 7) { hits[code] = (hits[code] || 0) + 1; return code; }
    }
    return 0;
  };
  /**
   * Is (s, d) a place on the water where a leaf may come down, lie, and drift `drift` metres toward the stage before it has gone under?
   * (A leaf afloat is carried 0.15 m/s for as long as it lies: one that came down four metres up the current from the mound's shore, a
   * root, a lifted seat or a music stand would drift into it. The whole of its drift must be open water.)
   */
  const lieAt = (s, d, drift = 0) => {
    if (s < 32.6 || s + drift > 119.2 || Math.abs(d) > halfAt(s)) return false;
    for (let a = 0; ; a = Math.min(drift, a + 0.35)) {
      const sa = s + a;
      if (Math.abs(d) > halfAt(sa) + 0.4) return false;                                                 // (the house narrows toward the stage)
      if (Math.hypot(sa - B.s, d - B.d) < 6.0) return false;                                            // the mound and its roots
      if (Math.hypot(sa - plan.lamp.s, d - lampD) < (a > 0 ? 0.7 : 1.3)) return false;                  // the kept lamp's post
      for (const [ps, pd, pr] of pit) if (Math.hypot(sa - ps, d - pd) < pr) return false;
      if (lvWater && !lvWater(sa, d)) return false;                                                     // (the Leaves group's plan of what stands in the water: the mound's own shore, roots, lifted seats, fallen sky, the pit)
      if (a >= drift) break;
    }
    return true;
  };
  /** Where a leaf of box b lands: carried toward the stage and in from its own wall. [s, d], or null if no way down is clear. */
  const landing = (b, fromY, y0, T, drift = 0) => {
    for (let tries = 0; tries < 9; tries++) {
      const carry = (1.3 + 1.4 * rnd()) * (T - 1);                                                       // the draught: a metre and a half to nearly three a second on the way down, toward the stage
      let sL = Math.min(115.5, b.s + carry * (0.84 + 0.16 * rnd()));
      // (half of those with a long way to fall are carried through the arch and come down on the stage water, if the draught can take them that far)
      if (tries < 3 && T > 5.5 && rnd() < FAR) { const far = 91.5 + 22 * rnd(); if ((far - b.s) / (T - 1) < 3.3 && far > sL) sL = far; }
      if (tries > 4 && sL > 88.4 && b.s < 88) sL = 88.4 - 6 * rnd();                                      // (it found no way through the arch: it comes down before it)
      const half = halfAt(sL), dL = b.rear ? clamp(b.d + (rnd() - 0.5) * 14, -half, half) : b.side * half * (1 - 1.6 * Math.pow(rnd(), 0.95));
      if (lieAt(sL, dL, drift) && wayClear(b, fromY, y0, T, sL, dL)) return [sL, dL];
    }
    for (let tries = 0; tries < 4; tries++) {                                                             // it lands short, by its own wall
      const o = 2.0 + 2.4 * rnd(), a = 0.3 + 2.4 * rnd(), ts = b.rear ? 0 : 1, td = b.rear ? (rnd() < 0.5 ? -1 : 1) : 0;
      const sL = b.s + b.inS * o + ts * a, dL = b.d + b.inD * o + td * a;
      if (lieAt(sL, dL, drift) && wayClear(b, fromY, y0, T, sL, dL)) { shortWay++; return [sL, dL]; }
    }
    return null;
  };

  const FAR = dev.has('prfar') ? +dev.get('prfar') : (PS.stage ?? 0.55);                // the share of the leaves with a long way to fall that the draught carries through the arch, onto the stage water (&prfar= to try)
  const TR = dev.has('prtr') ? dev.get('prtr').split(',').map(Number) : PS.trains;      // (&prtr=0.085,0.5,0.07,0.22 : to try a sitter's trains: the first's width in turns and its share of the leaves, the second's)
  // ---- the leaves
  // (Finding ten thousand ways down is a tenth of a second of sums. An area is built while the one before it is still on the screen:
  // so the work is done a few milliseconds at a time, and the picture before never stutters for it.)
  const recs = [];
  let noWay = 0, shortWay = 0, worked = performance.now(), h0q = 0;
  for (let bi = 0; bi < nBox; bi++) {
    const b = boxes[bi];
    if (performance.now() - worked > 5) { await new Promise((done) => setTimeout(done, 0)); worked = performance.now(); }
    const n = Math.max(12, Math.round(PS.leaves[b.tier] * qf));
    const heap = (rnd() - 0.5) * 0.9;                                                                     // where along the rail its drift lies thickest
    // its trains: one that holds half of it, a lesser one more or less across the axis from the first; the rest ride anywhere
    const t0 = rnd(), trains = [[t0, TR[0], TR[1]], [t0 + 0.5 + 0.3 * (rnd() - 0.5), TR[2], TR[3]]];
    for (let j = 0; j < n; j++) {
      // where in its round it begins; its share of the whirl's radius (a whirl of leaves is hollow: most of them ride near its skin); h0: how
      // high in its box it lets go from, in the fall (the top goes first)
      const ph0 = rnd(), rr = 0.3 + 0.7 * Math.sqrt(rnd()), h0 = rnd();
      const sd = [rnd(), rnd(), rnd(), rnd()];
      // its place in the drift on the rail: along it, out from the tier's line, above the cushion; how it lies
      // (a heap, deepest in its middle, a third of it hanging over the cushion's front edge and down its face: from the water only what
      // stands above that edge or hangs over it can be seen)
      const along = clamp(heap + ((rnd() + rnd() + rnd()) / 1.5 - 1) * 1.05, -1.38, 1.38), hang = rnd() < 0.34;
      const across = hang ? 0.3 + 0.1 * rnd() : -0.01 + 0.31 * rnd();
      const high = hang ? -0.01 - (across - 0.3) * 1.1 - 0.06 * rnd() : 0.012 + 0.24 * Math.pow(Math.max(0, 1 - Math.abs(along - heap) / 1.15), 0.8) * Math.pow(rnd(), 1.3);
      const rides = rnd() < b.rides;                                                                      // (a leaf that does not ride carries its share of the radius with a minus sign)
      const rec = { bi, ph0, rr: rides ? rr : -rr, th0: seatIn(rnd, trains), sd, home: [along, across, high, Math.floor(h0 * 1000) + 0.999 * rnd()], fall: [0, 0, 0, 2] };      // (home[3]: h0 in its thousands, how it lies in the drift in its fraction)
      h0q = Math.floor(h0 * 1000) / 1000;
      rec.fall[2] = PS.release.spread * clamp(0.75 * (1 - h0q) + 0.25 * rnd(), 0, 1);                      // the top goes first
      const hand = sd[1] < K.HAND, rank = rnd();
      if (hand) b.hand.push({ h0: h0q, sd, high });
      else if (rank < PS.over) {
        const y0 = b.rail + 0.14 + 0.28 * sd[2] + K.RISE * h0q, T = 1 + (y0 - K.WATER) / lerp(K.VF[0], K.VF[1], sd[0]);
        const to = landing(b, y0, y0, T, DRAUGHT * (LIE[0] + LIE[1] * sd[3] + 2));                           // (how far it will drift where it lies: prOut)
        if (to) { const xz = toXZ(to[0], to[1]); rec.fall[0] = xz[0]; rec.fall[1] = xz[1]; rec.fall[3] = rank; rec.T = T; rec.to = to; }
        else noWay++;
      } else rec.fall[3] = rank;
      recs.push(rec);
    }
  }
  for (let i = recs.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [recs[i], recs[j]] = [recs[j], recs[i]]; }      // shuffled: any share of them drawn is a fair sample
  const N = recs.length;
  const aLeaf = new Float32Array(N * 4), aSeed = new Float32Array(N * 4), aFall = new Float32Array(N * 4), aHome = new Float32Array(N * 4), aCol = new Float32Array(N * 3);
  const ev = { n: 0, box: new Int16Array(N), off: new Float32Array(N), from: new Float32Array(N), x: new Float32Array(N), z: new Float32Array(N), rank: new Float32Array(N), s: new Float32Array(N) };
  recs.forEach((r, i) => {
    aLeaf.set([r.bi, r.ph0, r.rr, r.th0], i * 4); aSeed.set(r.sd, i * 4); aFall.set(r.fall, i * 4); aHome.set(r.home, i * 4); pick(rnd, aCol, i * 3);
    if (r.to) { const e = ev.n++; ev.box[e] = r.bi; ev.from[e] = r.fall[2]; ev.off[e] = r.fall[2] + r.T; ev.x[e] = r.fall[0]; ev.z[e] = r.fall[1]; ev.rank[e] = r.fall[3]; ev.s[e] = r.to[0]; }
  });

  // ---- the state of every box: six rows of a small float texture, one column a box
  const ROWS = 6, data = new Float32Array(nBox * ROWS * 4);
  const put = (row, i, a, b2, c2, d2) => { const o = (row * nBox + i) * 4; data[o] = a; data[o + 1] = b2; data[o + 2] = c2; data[o + 3] = d2; };
  const tBox = new THREE.DataTexture(data, nBox, ROWS, THREE.RGBAFormat, THREE.FloatType);
  tBox.minFilter = tBox.magFilter = THREE.NearestFilter; tBox.generateMipmaps = false; tBox.needsUpdate = true;
  let dirty = false;
  boxes.forEach((b, i) => {
    put(0, i, b.axis.x, b.rail, b.axis.z, b.tall);
    put(1, i, b.nin.x, b.nin.y, b.R, b.period);
    put(3, i, -1e9, 0, 0, -1e9);
    const la = b.lit[0], lb = b.lit[1] || b.lit[0];
    if (la) { const pa = W(la.s, la.d, la.y), pb = W(lb.s, lb.d, lb.y); put(4, i, pa.x, pa.y, pa.z, Math.min(la.t, lb.t)); put(5, i, pb.x, pb.y, pb.z, b.lit[1] ? 1 : 0); }
    else { put(4, i, 0, -100, 0, 1e9); put(5, i, 0, -100, 0, 0); }
  });
  const writeTimes = (i) => { const b = boxes[i]; put(2, i, b.tForm, b.tGo, b.tAgain, b.low ? -b.reach : b.reach); dirty = true; };      // (the reach's sign: its last handful was shed from the drift on the rail)

  // ---- the order in which the leaves of the fall land (worked out again whenever the release changes)
  let order = new Uint32Array(0), ptr = 0, lastC = -1e9;
  const landAt = (e) => boxes[ev.box[e]].tGo + ev.off[e];
  const sortLandings = () => { order = Uint32Array.from({ length: ev.n }, (_, i) => i).sort((a, b2) => landAt(a) - landAt(b2)); ptr = 0; lastC = -1e9; };

  // (how far a leaf's copper is taken toward a warm brown of its own value: before the hour, and in the kindled house. &prtone=a,b to try)
  const TONE = dev.has('prtone') ? dev.get('prtone').split(',').map(Number) : (PS.tone || [0.1, 0.1]);
  // ---- the material: the house's paint for a leaf, with this extension
  const sitExt = {
    uniforms: { ...A, tBox: { value: tBox }, uPrRide: { value: new THREE.Vector4(PS.belly ?? 0.05, 0, 0, 0) }, uPrTone: { value: 0.1 }, uPrRoom: ROOM, uPrMoon: MOON, uPrCandle: { value: new THREE.Color('#FFFAE0').multiplyScalar(1.8) }, uPrBack: { value: new THREE.Color('#E0492B').multiplyScalar(1.8) } },
    vertexPars: /* glsl */`
      attribute vec4 aLeaf, aSeed, aFall, aHome; uniform sampler2D tBox; varying vec4 vPrLight; varying vec4 vPrRoom;
      ${LANE_GLSL}
      ${COMMON}
      ${OUT}`,
    vertexLocal: /* glsl */`{
      int bi = int(aLeaf.x + 0.5);
      vec4 b0 = texelFetch(tBox, ivec2(bi, 0), 0), b1 = texelFetch(tBox, ivec2(bi, 1), 0), b2 = texelFetch(tBox, ivec2(bi, 2), 0), b3 = texelFetch(tBox, ivec2(bi, 3), 0);
      float t = uLifeNow, c = uShow;
      vec2 nin = b1.xy, tan2 = vec2(-nin.y, nin.x);
      vec3 rail = vec3(b0.x + nin.x * ${f(K.BEHIND)}, b0.y, b0.z + nin.y * ${f(K.BEHIND)});          // its tier's line, at the rail top
      float h0 = floor(aHome.w) * 0.001, yaw0 = fract(aHome.w) * PR_TAU;                              // how high in its box it lets go from, in the fall; how it lies in the drift
      // ---- its place in the whirl (which breathes: a fifth of a metre in 20 to 40 s)
      float breath = 0.1 * sin(t * PR_TAU / (20.0 + 20.0 * prHash(aLeaf.x * 7.13)) + aLeaf.x * 2.4);
      vec4 seat = vec4(aLeaf.xy, abs(aLeaf.z), aLeaf.w); bool rider = aLeaf.z > 0.0;                  // (a leaf that does not ride in the whirl: see RIDE)
      vec4 ride = prRide(seat, aSeed, t);
      vec3 tang; float outside;
      vec3 spin = prSpin(vec3(b0.x, b0.y - ${f(PS.foot)} + breath, b0.z), b0.w, b1.z, PR_TAU / b1.w, mix(uPrTwist.x, uPrTwist.y, fract(abs(b1.w) * 13.37)), t, seat, aSeed, ride, tang, outside);
      spin.y = min(spin.y, b0.y + 1.76);                                                             // under the front of the tier above
      spin.xz -= nin * (max(dot(spin.xz - rail.xz, nin) + 0.07, 0.0) * (1.0 - smoothstep(-0.02, 0.12, spin.y - b0.y)));      // nothing of it passes through the parapet: under the rail top it keeps behind the line (what comes down the outside is drawn in over the cushion)
      spin.xz -= nin * (max(dot(spin.xz - rail.xz, nin) + 0.17, 0.0) * smoothstep(1.08, 1.26, spin.y - b0.y));              // nor through the hanging in the head of its box (its fringe hangs to 1.31 m above the rail, 3 cm behind the line): above that it keeps behind it
      // ---- its place in the drift on the rail; the gust lifts it and lets it settle
      vec3 drift = rail + vec3(tan2.x * aHome.x + nin.x * aHome.y, aHome.z, tan2.y * aHome.x + nin.y * aHome.y);
      float tl = (t - b3.w - 0.6 * aSeed.y) / (1.2 + 0.8 * aSeed.z), hop = (tl > 0.0 && tl < 1.0) ? sin(PR_PI * pow(tl, 0.6)) : 0.0;
      hop *= hop;
      drift.y += hop * (0.2 + 0.32 * aSeed.x) * step(-0.015, aHome.z); drift.xz += tan2 * (hop * 0.4 * (aSeed.w - 0.5));
      // A drift is never wholly still: every twenty seconds or so the house's air finds a box, and for a few seconds some of the leaves
      // on its rail lift at an edge, show a pale face, and settle back where they lay (each box in its own time, other leaves each time)
      float stP = 15.0 + 13.0 * prHash(aLeaf.x * 3.7), stE = t / stP + prHash(aLeaf.x * 9.1), stN = floor(stE);
      float stQ = prHash(aSeed.x * 91.0 + stN * 7.3), stX = (fract(stE) * stP - 3.2 * prHash(aSeed.z * 57.0 + stN * 3.1)) / (0.9 + 0.7 * aSeed.w);
      float stir = (stQ < 0.3 && stX > 0.0 && stX < 1.0) ? sin(PR_PI * stX) : 0.0;
      stir *= stir * uPrA.z;
      drift.y += stir * (0.05 + 0.1 * aSeed.z) * step(-0.015, aHome.z); drift.xz += tan2 * (stir * 0.09 * (aSeed.y - 0.5));
      hop = max(hop, 0.75 * stir);
      // ---- its place on the floor of its box (where what the fall leaves behind lies, and what comes home rises from)
      vec3 flr = vec3(b0.x, b0.y - 1.08, b0.z) + vec3(tan2.x, 0.0, tan2.y) * (aHome.x * 0.5) - vec3(nin.x, 0.0, nin.y) * (0.1 + 0.9 * aSeed.w);
      // ---- what has happened to it. L: 0 at home .. 1 where it belongs in a sitter: riding in the whirl, or lying on the floor of the box
      bool hand = aSeed.y < ${f(K.HAND)};
      float L = prS((c - b2.x - aSeed.y * 2.4) / 1.6);                                               // its tier has kindled: it rises from the rail (4 s for all of them), or slips back off the cushion into the box
      vec3 home = drift, perch = rider ? spin : flr;
      float hid = rider ? 0.0 : smoothstep(0.9, 1.0, L);                                             // lying on the floor of its box, where nothing can see it, it is drawn at no size
      float again = prS((c - b2.z - aSeed.y * 3.6) / 2.2);                                           // its box gathers a sitter again: it rises from the floor
      float tau = c - b2.y - aFall.z, tauO = -1.0, lie = uPrC.x + uPrC.y * aSeed.w, rest = 1.0;
      vec2 tgt = aFall.xy, vf = vec2(${f(K.VF[0])}, ${f(K.VF[1])});
      float y0 = b0.y + 0.14 + 0.28 * aSeed.z + ${f(K.RISE)} * h0;                                    // the height it crosses the rail at, if it leaves over the front
      if (tau > 0.0) {                                                                               // its box has let go
        home = flr;
        if (!hand && aFall.w < uPrA.x) { tauO = tau; L = 1.0; }                                      // over the front
        else { L = max(1.0 - prS(tau / (1.1 + 1.1 * aSeed.x)), again); hid = rider ? 0.0 : 1.0; }    // or down behind the rail
      }
      vec3 base = mix(home, perch, L); base.y += (rider ? 0.22 : 0.36) * sin(PR_PI * L);             // where it is when nothing has taken it (one that slips back into the box goes over the cushion's back edge, not through it)
      float tauH = t - b3.x - 1.2 * aSeed.z;
      if (hand && b3.x > -1.0e8 && tauH > 0.0) {                                                     // one of a handful, shed when a boat passed beneath: it falls round the hull
        tauO = tauH; rest = 0.0; lie = 5.0 + 7.0 * aSeed.w; vf = vec2(${f(K.VH[0])}, ${f(K.VH[1])});
        y0 = b0.y + 0.14 + 0.28 * aSeed.z + ${f(K.RISE)} * h0 * step(0.0, b2.w);                      // (shed from the drift on the rail it goes over the cushion low)
        tgt = b3.yz + tan2 * ((fract(aSeed.w * 7.31 + aSeed.z) - 0.5) * 6.0) + nin * (-0.5 + (abs(b2.w) + 0.5) * aSeed.x);
        home = flr;
      }
      // ---- how it lies, in the air and at rest
      // (in the whirl it turns slowly about its own length, so that the eye can follow it round; once it has let go it turns over
      // and over, once in a second and a half to three seconds, as a falling beech leaf does)
      float rate = (0.45 + 1.1 * aSeed.x) * mix(0.75, 1.0, uPrA.z), rx = rate * t + aSeed.w * 40.0 + (1.5 + 1.3 * aSeed.x) * mix(0.75, 1.0, uPrA.z) * max(tauO, 0.0), beta = rx - 0.31 * sin(2.0 * rx);
      vec3 P = base; float air = max(rider ? smoothstep(0.0, 0.25, L) : sin(PR_PI * L), hop), live = 1.0, fly = 0.0, afloat = 0.0, Lw = rider ? L : 0.0, wet = 0.0;      // Lw: how far it rides in the whirl; wet: how far it has soaked, lying on the water
      if (tauO > 0.0) {
        float airO, liveO, endO, aflO;
        vec3 po = prOut(tauO, base, rail, nin, tgt, vf, y0, lie, rest, aSeed, beta, airO, liveO, endO, aflO);
        // (a leaf of the fall rests on the bed when it has sunk; if its box gathers a sitter again it rises from the floor of the box,
        // but never before it has sunk. One of a handful comes home the same way two seconds after it has gone down.)
        float Lh = hand ? L * prS((tauO - endO) / 2.0) : prS((c - max(b2.z + aSeed.y * 3.6, b2.y + aFall.z + endO)) / 2.2);
        // (what sank on the stage's boards lies half a metre down, where the rider can see it: it stays there. Only what lies in
        // the deep of the stalls and the pit, out of sight, is the box's again)
        if (!hand && -tgt.y > 90.8) Lh = 0.0;
        if (Lh > 0.0 || (rest < 0.5 && tauO >= endO)) { P = mix(flr, perch, Lh); if (rider) { P.y += 0.22 * sin(PR_PI * Lh); air = smoothstep(0.0, 0.25, Lh); Lw = Lh; } else { air = 0.0; Lw = 0.0; live = 0.0; } }      // (one that does not ride lies on the floor of its box again, unseen: at no size)
        else { P = po; air = airO; live = liveO; fly = prS(tauO / 1.5); afloat = aflO; Lw = 1.0 - prS(tauO / 1.2); wet = aflO * clamp((tauO - (endO - lie - ${f(K.SINK)})) / (0.6 * lie), 0.0, 1.0); }
      }
      vec2 rv = P.xz - b0.xz; vec2 rad = rv / max(length(rv), 1.0e-3);                                // out from the whirl's axis
      float hang = step(0.3, aHome.y);                                                               // a leaf of the drift that hangs over the front edge of the cushion
      vec3 lieAlong = mix(vec3(cos(yaw0), 0.0, sin(yaw0)), vec3(nin.x * 0.4, -0.9, nin.y * 0.4) + vec3(tan2.x, 0.0, tan2.y) * (aSeed.x - 0.5), hang * (1.0 - step(0.5, fly + step(0.0, tau))));
      vec3 lieUp = vec3(0.0, 1.0, 0.0) + (1.0 - fly) * (vec3(nin.x, 0.0, nin.y) * (1.1 * hang) + 1.3 * vec3(aSeed.z - 0.5, 0.0, aSeed.x - 0.5));      // in the heap they lie propped on one another
      float hd = aSeed.w * 40.0 + 0.6 * sin(t * 0.8 + aSeed.y * 30.0);
      // in the whirl a leaf lies along the stream that carries it (round, and up the inside or down the outside) and turns about its own
      // length there, its face looking out from the axis as often as in; free in the air it wanders and turns over
      vec3 airAlong = mix(tang * (aSeed.z < 0.5 ? 1.0 : -1.0) + vec3(0.0, 0.3 * (aSeed.y - 0.5), 0.0), vec3(cos(hd), 0.25 * sin(t * 1.1 + aSeed.x * 20.0), sin(hd)), fly);
      vec3 airUp = mix(vec3(rad.x, 0.3, rad.y), vec3(0.0, 1.0, 0.0), fly);
      mat3 M = prPose(mix(lieAlong, airAlong, air), mix(lieUp, airUp, air), beta, air);
      // ---- its light. A whirl of leaves has a lit side and a side in its own shade: what rides round into the candles' light takes it,
      // what rides round behind goes dark, and what rides deep inside is in the others' shade. (That, and the far side hidden by the
      // near, is what lets the eye read it as one turning thing and not as a swarm.)
      float whirl = Lw * (1.0 - 0.75 * outside);
      float skin = mix(1.0, mix(uPrShade.x, 1.0, smoothstep(0.3, 0.95, abs(aLeaf.z))), whirl);
      vec4 la = texelFetch(tBox, ivec2(bi, 4), 0), lb = texelFetch(tBox, ivec2(bi, 5), 0);            // the candles beside its box
      vec3 da = la.xyz - P, db = lb.xyz - P;
      float ea = mix(1.0, smoothstep(-0.5, 0.45, dot(rad, normalize(la.xz - b0.xz + vec2(1.0e-4, 0.0)))), whirl), eb = mix(1.0, smoothstep(-0.5, 0.45, dot(rad, normalize(lb.xz - b0.xz + vec2(1.0e-4, 0.0)))), whirl);
      float ia = skin * ea * prS((c - la.w) / 0.9) / (1.0 + dot(da, da) / 1.7), ib = skin * eb * lb.w * prS((c - la.w - 0.3) / 0.9) / (1.0 + dot(db, db) / 1.7);
      vPrLight = vec4(normalize(da * ia + db * ib + vec3(0.0, 1.0e-4, 0.0)), ia + ib);
      // the lit house on a leaf: whole in the auditorium's air, less up the stage, little inside a box (its own candles light it there);
      // on a whirl in its box, from the room's side
      float eR = mix(1.0, smoothstep(-0.55, 0.45, dot(rad, nin)), whirl);
      float zone = smoothstep(27.0, 31.0, -P.z) * (1.0 - 0.6 * smoothstep(89.0, 100.0, -P.z)) * mix(0.3, 1.0, smoothstep(-0.5, 0.4, dot(P.xz - rail.xz, nin)));
      vPrRoom = vec4(zone * eR * skin, air, mix(1.0, skin * mix(uPrShade.y, 1.0, eR), whirl), wet);
      prClear(P, live);
      float dist = length(P - uCameraPos);
      float size = ${f(K.LEAF)} * (0.8 + 0.45 * aSeed.w) * mix(mix(prBig(dist), prWhirl(dist), max(Lw, 1.0 - air)), prLow(dist), afloat) * live;      // (the drift on the rail is seen from below and far off: as large as the whirl's)
      if (uPrB.x > 0.5 && uPrB.x < 1.5 && P.y > 0.7) size = 0.0;                                     // the picture the water reads as what lies beneath: only what is at the water
      if (tauO <= 0.0) size *= 1.0 - hid;
      transformed = P + M * (position * size);
      objectNormal = M * normal;
    }`,
    fragmentPars: 'varying vec4 vPrLight; varying vec4 vPrRoom; uniform vec3 uPrCandle, uPrBack, uPrRoom, uPrMoon; uniform float uPrTone;',
    albedo: LEAF_PAINT,
    light: /* glsl */`{
      c *= vPrRoom.z;                                                                                // the whirl's own shade on what the house's light gave the leaf
      // the candles beside its box: their light on the leaf and through it; a leaf that hangs between the eye and a flame glows
      vec3 prCl = albedo * uPrCandle * (vPrLight.w * (0.3 + 0.7 * abs(dot(N, vPrLight.xyz))));
      c += prCl / (1.0 + 0.6 * max(prCl.r, max(prCl.g, prCl.b)));                                     // (held in: copper under a flame at arm's length must stay copper, not burn to orange peel)
      float prThrough = max(dot(-V, vPrLight.xyz), 0.0); prThrough *= prThrough * prThrough;
      glow += uPrBack * (albedo.r + 0.1) * (prThrough * min(vPrLight.w, 1.2));
      // a leaf in the lit house takes the light of its hundreds of flames. Every one of them stands at the walls: a leaf turned
      // upright in the air takes them broadside, a leaf lying level shows its face to the dark dome. So a falling leaf glints
      // and goes dark as it turns over, whoever is looking and from wherever
      c += albedo * uPrRoom * (vPrRoom.x * (0.22 + 0.78 * (1.0 - N.y * N.y)));
      // and before the house is lit, a leaf in the air shows its pale face to the moon as it turns over
      float prFace = abs(dot(N, V));
      c += (0.3 + albedo) * uPrMoon * (vPrRoom.y * prFace * prFace);
      // a leaf that lies on the water soaks before it sinks: a wet leaf is a darker leaf (the Leaves group's are painted so, and the mound's litter)
      // (and a browner one: darkened only, copper went the red of a rose petal on this green water)
      c = mix(c, dot(c, vec3(0.3, 0.55, 0.15)) * vec3(1.28, 0.95, 0.6), 0.55 * vPrRoom.w) * (1.0 - 0.4 * vPrRoom.w); glow *= 1.0 - vPrRoom.w;
    }`,
  };
  const sitGeo = new THREE.InstancedBufferGeometry();
  sitGeo.index = leaf.index; for (const k of ['position', 'normal', 'uv']) sitGeo.setAttribute(k, leaf.attributes[k]);
  sitGeo.setAttribute('aLeaf', new THREE.InstancedBufferAttribute(aLeaf, 4)); sitGeo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(aSeed, 4));
  sitGeo.setAttribute('aFall', new THREE.InstancedBufferAttribute(aFall, 4)); sitGeo.setAttribute('aHome', new THREE.InstancedBufferAttribute(aHome, 4));
  sitGeo.setAttribute('color', new THREE.InstancedBufferAttribute(aCol, 3));
  sitGeo.instanceCount = N;
  const sitMat = H.paint('leaf', { color: '#ffffff', vertexColors: true, side: THREE.DoubleSide, brush: 0.3, take: [0, 1, 0.5, 0], extend: sitExt });
  const sitMesh = new THREE.Mesh(sitGeo, sitMat);
  sitMesh.name = `presences: sitters x ${nBox} (${N} leaves)`; sitMesh.frustumCulled = false;
  // mirror: the share of them the mirror draws; wet: whether any of them is at the water (only then are they in the picture the water
  // reads); shape: the outline's exponent and how wide its open top stays (the page: 0.8, a ragged open top)
  const tune = (dev.get('prs') || '').split(',').map((v) => (v === '' ? NaN : +v));      // &prs=exponent,top,radius,candle : to try a sitter's shape and light
  const SIT = { mirror: 0.45, wet: false, shape: [Number.isFinite(tune[0]) ? tune[0] : PS.shape[0], Number.isFinite(tune[1]) ? tune[1] : PS.shape[1], Number.isFinite(tune[6]) ? tune[6] : PS.shape[2]] };
  if (Number.isFinite(tune[3])) sitExt.uniforms.uPrCandle.value.set('#FFFAE0').multiplyScalar(tune[3]);
  sitMesh.onBeforeRender = (renderer) => {
    const pass = passOf(renderer);
    A.uPrB.value.set(pass, SIT.shape[0], SIT.shape[1], SIT.shape[2]); sitMat.uniformsNeedUpdate = true;
    // (stage 6, 5-critique.md: once they are wet the first picture took all 14,725 of them for the rest of the area, 118,000 triangles. It takes the mirror's share:
    // what that picture is read for is leaves seen sinking through the water within a few metres of the hull, and the page gives those up before anything else it lists.)
    sitGeo.instanceCount = pass === 1 ? (SIT.wet ? Math.round(N * share * SIT.mirror) : 0) : Math.round(N * share * (pass === 2 ? SIT.mirror : 1));
  };
  sitMesh.onAfterRender = () => { sitGeo.instanceCount = N; };
  ctx.add(sitMesh);

  // ---- what the staging drives, and what it hears
  const P_ = shared.cast.presences = { onLetGo: null, onLand: null, onForm: null };
  const now = () => ctx.time;
  const formed = (i, c) => { const b = boxes[i]; return (c >= b.tForm + 4.3 && c < b.tGo) || c >= b.tAgain + 7; };
  const timed = [];                                                          // the landings of handfuls, on the realm's time
  let settle = null, settleWithin = 14, allowance = 0;
  const sitters = P_.sitters = {
    object: sitMesh, count: nBox, leaves: N, boxes,
    /** The landings of the fall: within: metres from the boat inside which onLand is called; perSecond: at most so many calls a second (the page: 28); rings, ring, perFrame: the rings they write. */
    landings: { within: 40, perSecond: 28, rings: true, ring: [0.15, 0.4], perFrame: 24 },
    /** Seconds a leaf of the fall floats where it landed before it soaks and sinks: [at least, up to so many more]. */
    get lie() { return [A.uPrC.value.x, A.uPrC.value.y]; }, set lie(v) { A.uPrC.value.x = Math.max(0.5, v[0]); A.uPrC.value.y = Math.max(0, v[1]); },
    /** Hand what lands within `within` metres of the boat to a makeFloaters handle (the Leaves group's): each gets floaters.add(x, z). Then shorten `lie`, so that mine go under as theirs come up. */
    settleOn(floaters, within = 14) { settle = floaters; settleWithin = within; return sitters; },
    /** The fall: tier 5 lets go at show clock `at`, each tier below `gap` seconds later (every sitter of a tier within half a second of the others). */
    release({ at: a = PS.release.at, gap = PS.release.gap } = {}) { boxes.forEach((b, i) => { b.tGo = a + (5 - b.tier) * gap + 0.55 * prn(i * 3.7); writeTimes(i); }); sortLandings(); sitters.fallAt = a; return sitters; },
    /** No fall (until release() is called again). */
    keep() { boxes.forEach((b, i) => { b.tGo = 1e9; writeTimes(i); }); sortLandings(); sitters.fallAt = Infinity; return sitters; },
    /** After the fall: `count` boxes gather a sitter again between show clock `from` and `from + over`. */
    gather({ count = PS.gather.count, from = PS.gather.from, over = PS.gather.over } = {}) {
      const idx = boxes.map((_, i) => i).sort((a, b2) => prn(a * 9.1 + 0.3) - prn(b2 * 9.1 + 0.3)).slice(0, count);
      boxes.forEach((b, i) => { b.tAgain = 1e9; });
      idx.forEach((i, k) => { boxes[i].tAgain = from + over * (k + prn(i * 2.9)) / Math.max(1, count); });
      boxes.forEach((_, i) => writeTimes(i));
      return sitters;
    },
    /** The gust: the drifts on the rails lift and settle in a wave that runs from the tear round the horseshoe at `speed` metres a second. */
    lift({ speed = 9, at: t0 = now() } = {}) { boxes.forEach((b, i) => { const o = (3 * nBox + i) * 4; data[o + 3] = t0 + b.arc58 / speed + (5 - b.tier) * 0.2 + (b.side > 0 && !b.rear ? 1.3 : 0); }); dirty = true; return sitters; },
    /** Box i sheds a handful, which falls round (x, z). */
    shed(i, x, z) {
      const b = boxes[i], t0 = now(), o = (3 * nBox + i) * 4, c = cs, up = formed(i, c);
      data[o] = t0; data[o + 1] = x; data[o + 2] = z; dirty = true; b.shedAt = t0; if (!up) b.shedOnce = true;
      const tx = -b.nin.y, tz = b.nin.x;
      b.low = !up; writeTimes(i);                                              // (shed from the drift on the rail, its leaves go over the cushion low; shed from the whirl, from where they ride)
      for (const h of b.hand) {
        const y0 = b.rail + 0.14 + 0.28 * h.sd[2] + (up ? K.RISE * h.h0 : 0), T = 1 + (y0 - K.WATER) / lerp(K.VH[0], K.VH[1], h.sd[0]);
        const a = (frac(h.sd[3] * 7.31 + h.sd[2]) - 0.5) * 6, n2 = -0.5 + (b.reach + 0.5) * h.sd[0];
        timed.push({ at: t0 + 1.2 * h.sd[2] + T, x: x + tx * a + b.nin.x * n2, z: z + tz * a + b.nin.y * n2 });
      }
      if (P_.onLetGo) P_.onLetGo({ kind: 'handful', box: i, x: b.lineX, y: b.rail, z: b.lineZ, tier: b.tier });
      return sitters;
    },
    /** The share of each sitter that pours over the front in the fall (a third of it with reduced motion). */
    get over() { return A.uPrA.value.x; }, set over(v) { A.uPrA.value.x = clamp(v, 0, PS.over); },
    formed,
    /** The presences' own time: the show clock, never more than a third faster than real seconds (what `at`, `from` and `formed` are counted on). */
    get clock() { return cs; },
  };
  const prn = (n) => frac(Math.sin(n * 12.9898 + 4.1) * 43758.5453);
  sitters.release({ at: dev.has('prgo') ? +dev.get('prgo') : PS.release.at });
  sitters.gather();
  if (dev.has('prcheck')) {                                                 // (&prcheck=1: every way down of the fall, walked through the Leaves group's model of the tree, the chandelier, the lustres and what stands in the water)
    const solid = shared.cast.leaves && shared.cast.leaves.solid, hits = {}, where = [];
    let n = 0, bad = 0;
    if (solid) for (const r of recs) if (r.to) { n++; const b = boxes[r.bi], y0 = b.rail + 0.14 + 0.28 * r.sd[2] + K.RISE * (Math.floor(r.home[3]) * 0.001); const code = wayMeets(b, y0, r.T, r.to[0], r.to[1], solid, hits); if (code) { bad++; if (where.length < 12) where.push(`${code}: tier ${b.tier} box s ${b.s.toFixed(1)} d ${b.d.toFixed(1)} to s ${r.to[0].toFixed(1)} d ${r.to[1].toFixed(1)}`); } }
    console.error(`PRESENCES-CHECK (asked for with &prcheck): ${solid ? `${n} ways down walked through the Leaves group's model of what is solid; ${bad} meet something (3 a lustre, 4 wood, 5 the chandelier, 6 something standing in the water): ${JSON.stringify(hits)}; the first: ${where.join(' | ')}` : 'the Leaves group gives no model (shared.cast.leaves.solid)'}`);
  }
  if (dev.has('prlog')) {                                                   // (&prlog=1: what the script worked out, printed among the tool's page errors)
    const hist = new Array(10).fill(0), over = A.uPrA.value.x; let n = 0, most = 0, when = 0;
    for (let e = 0; e < ev.n; e++) if (ev.rank[e] < over) { n++; hist[clamp(Math.floor((ev.s[e] - 30) / 10), 0, 9)]++; }
    for (let c = sitters.fallAt; c < sitters.fallAt + 22; c += 0.25) { let k = 0; for (let e = 0; e < ev.n; e++) if (ev.rank[e] < over) { const t0 = boxes[ev.box[e]].tGo; if (c > t0 + ev.from[e] && c < t0 + ev.off[e]) k++; } if (k > most) { most = k; when = c; } }
    console.error(`PRESENCES-LOG (asked for with &prlog): ${nBox} sitters, ${N} leaves; over the fronts ${n} (${shortWay} of them landing short by their own wall; ${noWay} found no way and sink behind the rail); most in the air at once ${most}, at show clock ${when.toFixed(1)}; landings by ten metres of s from 30: ${hist.join(' ')}; the first boxes to gather a sitter again (tier, s, d, show clock): ${boxes.filter((b) => b.tAgain < 1e8).sort((a, b) => a.tAgain - b.tAgain).slice(0, 8).map((b) => `${b.tier} ${b.s.toFixed(1)} ${b.d.toFixed(1)} ${b.tAgain.toFixed(1)}`).join(' | ')}`);
  }

  // ============================================================================================ THE COMPANY
  const PC = PP.company, NC = PC.figures.length, rc = ctx.rng(380);
  const nEach = Math.max(60, Math.round(PC.leaves * (dens >= 1 ? 1 : dens >= 0.75 ? 0.8 : 0.5)));
  const coN = NC * nEach;
  const cLeaf = new Float32Array(coN * 4), cSeed = new Float32Array(coN * 4), cLie = new Float32Array(coN * 4), cCol = new Float32Array(coN * 3);
  const co = PC.figures.map(([s, d, hs, hd, turn], k) => ({ k, s, d, hs, hd, w: TAU / turn * (k % 2 ? -1 : 1), tall: Math.min(lerp(PC.tall[0], PC.tall[1], rc()), PC.under && PC.under.figures.includes(k) ? PC.under.tall : 99), R: PC.R * (0.94 + 0.12 * rc()),
    phase: rc() * TAU, speed: 0, rate: 0, wander: 23 + 18 * rc(), hold: 0, lost: false, formsAt: PC.formsAt + 0.7 * ((k * 3) % NC), loses: lerp(PC.loses[0], PC.loses[1], rc()), foot: 0, rings: 0, x: 0, z: 0,
    // its trains of leaves (three, unequal, unevenly spaced round it) and how far they are wound round it from foot to top
    twist: Number.isFinite(tryTwist[2]) ? tryTwist[2] : lerp(PC.twist[0], PC.twist[1], rc()),
    trains: ((a) => [[a, PC.trains[0], PC.trains[1]], [a + 0.3 + 0.12 * rc(), PC.trains[0], PC.trains[2]], [a + 0.62 + 0.14 * rc(), PC.trains[0], PC.trains[3]]])(rc()) }));
  {
    const order2 = Array.from({ length: coN }, (_, i) => i); for (let i = coN - 1; i > 0; i--) { const j = Math.floor(rc() * (i + 1)); [order2[i], order2[j]] = [order2[j], order2[i]]; }
    order2.forEach((slot, n) => {
      const k = n % NC, sd = [rc(), rc(), rc(), rc()];
      const mantle = sd[1] < 0.2;                                                                        // a fifth follow late, on the outside of the body
      // which presence; where in its round a leaf begins; its share of the whirl's radius; where round the axis it begins
      cLeaf.set([k, rc(), mantle ? 0.85 + 0.35 * rc() : 0.3 + 0.7 * Math.sqrt(rc()), mantle ? rc() : seatIn(rc, co[k].trains)], slot * 4); cSeed.set(sd, slot * 4);
      const r = 2.1 * Math.pow(rc(), 0.6), a = rc() * TAU;                                               // where it lies on the water when the presence has no hold: a loose raft four metres across, a little thicker toward its middle
      cLie.set([Math.cos(a) * r, Math.sin(a) * r, rc() * TAU, rc()], slot * 4);                          // (the last: its place in the order in which they let go: see the shader)
      pick(rc, cCol, slot * 3);
    });
  }
  const lampAt = [plan.lamp.s, lampD, PC.keep.lamp], keepD = PC.keep.d, keepS = PC.keep.s;
  const soft = (x, k) => 0.5 * (x + Math.sqrt(x * x + k));
  /** Where presence q's axis is at phase ph of its figure of eight, clipped: [s, d]. (The same arithmetic as coAt in the shader.) */
  const coAt = (q, ph, out = [0, 0]) => {
    let s = q.s + q.hs * Math.sin(2 * ph), d = q.d + q.hd * Math.sin(ph);
    const es = s - lampAt[0], ed = d - lampAt[1], r = Math.hypot(es, ed), push = soft(lampAt[2] - r, 0.36) / Math.max(r, 1e-3);
    s += es * push; d += ed * push;
    d -= soft(d - keepD, 0.09); d += soft(-keepD - d, 0.09); s -= soft(s - keepS[1], 0.09); s += soft(keepS[0] - s, 0.09);
    out[0] = s; out[1] = d; return out;
  };
  const uCo = Array.from({ length: NC }, () => new THREE.Vector4()), uCoFig = co.map((q) => new THREE.Vector4(q.s, q.d, q.hs, q.hd)), uCoB = co.map((q) => new THREE.Vector4(q.tall, q.R, q.twist, 0));
  const moonCol = new THREE.Color(0, 0, 0), SMn = (plan.stageRig && plan.stageRig.moon) || { reach: 34, light: 0.9, fill: 0.14, color: '#C4D6D0' };
  const lampXZ = toXZ(plan.lamp.s, lampD), coOn = new THREE.Vector2(0, 0);
  const coExt = {
    defines: { PR_CO: NC },
    uniforms: { ...A, uPrRide: { value: new THREE.Vector4(PC.belly ?? 0.105, 0, 0, 0) }, uPrTone: { value: 0.24 }, uPrRoom: ROOM, uCo: { value: uCo }, uCoFig: { value: uCoFig }, uCoB: { value: uCoB }, uCoLamp: { value: new THREE.Vector3(lampAt[0], lampAt[1], lampAt[2]) },
      uCoKeep: { value: new THREE.Vector3(keepD, keepS[0], keepS[1]) }, uCoHouse: { value: new THREE.Vector2(...toXZ(76, 0)) }, uCoO: { value: new THREE.Vector2(o0.x, o0.z) }, uCoAxes: { value: new THREE.Vector4(TS.x, TS.z, RD.x, RD.z) },
      uCoMoon: { value: new THREE.Vector4(0, -100, 0, SMn.reach) }, uCoMoonCol: { value: moonCol }, uCoMoonFill: { value: SMn.fill }, uCoLampAt: { value: new THREE.Vector2(lampXZ[0], lampXZ[1]) }, uCoOn: { value: coOn },
      uCoLampMore: U.uLampMore || { value: 0 }, uCoLampK: { value: new THREE.Vector4(0.16, 0.4, 0.24, 0) }, uPrBack: { value: new THREE.Color('#E0492B').multiplyScalar(1.8) } },
    vertexPars: /* glsl */`
      attribute vec4 aLeaf, aSeed, aLie; varying vec4 vPrRoom;
      uniform vec4 uCo[PR_CO], uCoFig[PR_CO], uCoB[PR_CO], uCoMoon; uniform vec3 uCoLamp, uCoKeep; uniform vec2 uCoO, uCoHouse, uCoLampAt, uCoOn; uniform vec4 uCoAxes, uCoLampK;
      ${LANE_GLSL}
      ${COMMON}
      float coSoft(float x, float k) { return 0.5 * (x + sqrt(x * x + k)); }
      // where a presence's axis is at phase ph of its figure of eight (metres along the route, metres to its right), clipped:
      // never within six metres of the kept lamp, never near a wing or a roller, never off the stage water
      vec2 coAt(int k, float ph) {
        vec4 fg = uCoFig[k];
        vec2 p = fg.xy + vec2(fg.z * sin(2.0 * ph), fg.w * sin(ph));
        vec2 e = p - uCoLamp.xy; float r = length(e);
        p += e * (coSoft(uCoLamp.z - r, 0.36) / max(r, 1.0e-3));
        p.y -= coSoft(p.y - uCoKeep.x, 0.09); p.y += coSoft(-uCoKeep.x - p.y, 0.09);
        p.x -= coSoft(p.x - uCoKeep.z, 0.09); p.x += coSoft(uCoKeep.y - p.x, 0.09);
        return p;
      }
      vec3 coWorld(vec2 sd, float y) { return vec3(uCoO.x + uCoAxes.x * sd.x + uCoAxes.z * sd.y, y, uCoO.y + uCoAxes.y * sd.x + uCoAxes.w * sd.y); }`,
    vertexLocal: /* glsl */`{
      int k = int(aLeaf.x + 0.5);
      vec4 cq = uCo[k], cb = uCoB[k];                                                                // how far round its figure, how fast, its hold, how it turns; its height and radius
      float t = uLifeNow;
      vec4 ride = prRide(aLeaf, aSeed, t);
      float u = ride.x;
      // ---- lying on the stage water where the presence stands, when it has no hold: it rocks, turns a little, and makes way for the hull
      vec3 lie = coWorld(coAt(k, cq.x), ${f(K.WATER)}) + vec3(aLie.x, 0.0, aLie.y);
      vec2 toBoat = lie.xz - uBoat.xz;
      if (dot(toBoat, toBoat) < 100.0) lie.xz += lanePush(lie.xz, 0.2, 1.2, 20.0, aSeed.x);
      lie.y += 0.003 * sin(t * 1.3 + aSeed.y * 40.0);
      // ---- in the whirl. Each leaf follows the path as it was a little earlier: the foot trails 0.6 s and the whole leans into
      // its travel; a fifth of them, the mantle, follow 0.8 to 1.5 s late, on the inside of every turn
      float late = 0.6 * (1.0 - u) + (aSeed.y < 0.2 ? 0.8 + 0.7 * aSeed.z : 0.0);
      vec3 foot = coWorld(coAt(k, cq.x - late * cq.y), ${f(K.WATER)} + 0.008);
      vec3 tang; float outside;
      vec3 spin = prSpin(foot, cb.x, cb.y, cq.w, cb.z, t, aLeaf, aSeed, ride, tang, outside);
      spin.y = max(spin.y, ${f(K.WATER)} + 0.01);
      // ---- its hold. Every leaf's place is a function of the presence's one hold: it cannot pop, whatever the boat does.
      // A leaf is in the whirl while the hold is above a number of its own, on the water while it is below another, and on its way
      // between; the way takes longer from the top than from the foot, so that all come down at about one speed. What rides outside
      // and what rides high let go first and the foot stands longest; forming, the foot rises first.
      float win = ${f(K.WIN0)} + ${f(K.WIN1)} * u;
      float turnOf = mix(clamp(0.2 * u + aLie.w * (0.37 + 0.43 * u), 0.0, 1.0), 0.85 + 0.15 * aLie.w, outside);
      float L = prS((cq.z - (1.0 - win) * turnOf) / win);
      vec3 P = mix(lie, spin, L);
      float mid = sin(PR_PI * L);
      P.xz += (mid * 0.3 * uPrA.z) * vec2(sin(t * 2.3 + aSeed.w * 30.0), cos(t * 1.9 + aSeed.x * 30.0));       // it swings as it falls or rises
      // (a whirl that loses its breath throws what it was carrying: a leaf let go high up goes wide of the axis before it comes down
      // to where it will lie, so that the column opens as it falls and does not sink into itself like a heap)
      vec2 flung = spin.xz - foot.xz; P.xz += flung / max(length(flung), 0.05) * (mid * (0.12 + 0.5 * u) * (0.5 + aSeed.z) * uPrA.z);      // (at most 0.93 m: with its place in the whirl, 1.5 m from the axis, no further than what rides outside)
      float air = smoothstep(0.0, 0.2, L), live = 1.0;
      float rate = (0.45 + 1.1 * aSeed.x) * mix(0.75, 1.0, uPrA.z), rx = rate * t + aSeed.w * 40.0, beta = rx - 0.31 * sin(2.0 * rx);
      float yaw = aLie.z + 0.05 * t * (aSeed.x - 0.5);
      vec2 rv = P.xz - foot.xz; vec2 rad = rv / max(length(rv), 1.0e-3);                              // out from the whirl's axis
      vec3 airAlong = tang * (aSeed.z < 0.5 ? 1.0 : -1.0) + vec3(0.0, 0.3 * (aSeed.y - 0.5), 0.0);
      mat3 M = prPose(mix(vec3(cos(yaw), 0.0, sin(yaw)), airAlong, air), mix(vec3(0.0, 1.0, 0.0), vec3(rad.x, 0.3, rad.y), air), beta, air);
      // ---- its light has sides: the lit house reaches the front of the stage through the arch, the stage moon stands to one side,
      // the kept lamp to another. What rides on the near side of the whirl to a light takes it; what rides on the far side, and
      // what rides deep inside, is in the whirl's own shade: a dark copper shape against the pale painted orchard, lit along one flank.
      float whirl = L * (1.0 - 0.75 * outside);
      float skin = mix(1.0, mix(uPrShade.x, 1.0, smoothstep(0.3, 0.95, aLeaf.z)), whirl);
      float eH = mix(1.0, smoothstep(-0.55, 0.45, dot(rad, normalize(uCoHouse - P.xz))), whirl);
      float eM = mix(1.0, smoothstep(-0.55, 0.45, dot(rad, normalize(uCoMoon.xz - P.xz + vec2(1.0e-4, 0.0)))), whirl);
      float eL = mix(1.0, smoothstep(-0.55, 0.45, dot(rad, normalize(uCoLampAt - P.xz + vec2(1.0e-4, 0.0)))), whirl);
      vPrRoom = vec4(uCoLampK.z * (1.0 - smoothstep(93.0, 112.0, -P.z)) * eH * skin, eM * skin, mix(1.0, skin * mix(uPrShade.y, 1.0, clamp(max(eM * uCoOn.x, eH * uCoOn.y), 0.0, 1.0)), whirl), eL * skin);
      prClear(P, live);
      float dist = length(P - uCameraPos);
      float size = ${f(K.LEAF)} * (0.8 + 0.45 * aSeed.w) * mix(prLow(dist), prWhirl(dist), L) * live;
      if (uPrB.x > 0.5 && uPrB.x < 1.5 && P.y > 0.7) size = 0.0;
      transformed = P + M * (position * size);
      objectNormal = M * normal;
    }`,
    fragmentPars: 'uniform vec4 uCoMoon; uniform vec3 uCoMoonCol, uPrRoom, uPrBack; uniform float uCoMoonFill, uCoLampMore, uPrTone; uniform vec4 uCoLampK; varying vec4 vPrRoom;',
    albedo: LEAF_PAINT,
    light: /* glsl */`{
      // The kept lamp: the house's paint has given the leaf the lamp's light whole, whichever side of the whirl it rides on (at six
      // metres that is nearly all of it, and copper under amber burns like an ember). It is taken off again and given back to the
      // side that faces the lamp; the rest of what the house's light gave stands in the whirl's own shade.
      float prSs = -vWPos.z, prSt = smoothstep(91.0, 94.0, prSs) * (1.0 - smoothstep(119.3, 121.0, prSs));
      vec3 prLamp = albedo * pointLight(uLampPos, uLampColor, uLampRadius, N) * (1.0 + prSt * uCoLampMore);
      c = max(c - prLamp, vec3(0.0)) * vPrRoom.z + prLamp * (vPrRoom.w * uCoLampK.x);
      // the stage has a moon of its own (heroes_stage.js lights its scenery with it): a broad pearl light from where the moon box is
      vec3 cmD = uCoMoon.xyz - vWPos; float cmR = length(cmD), cmA = 1.0 - smoothstep(uCoMoon.w * 0.15, uCoMoon.w, cmR);
      // (on the leaf's own copper: with a share of plain pearl added, a moonlit presence was a cloud of pink petals among the painted blossom)
      c += (0.035 + albedo) * uCoMoonCol * (cmA * cmA * vPrRoom.y * (0.45 + 0.55 * abs(dot(N, cmD / max(cmR, 1.0e-3)))) + uCoMoonFill * vPrRoom.z);
      // the lit house through the arch (its flames stand at the walls: a leaf turned upright takes them broadside)
      c += albedo * uPrRoom * (vPrRoom.x * (0.22 + 0.78 * (1.0 - N.y * N.y)));
      // a leaf that hangs between the eye and the kept lamp glows
      vec3 prTo = uLampPos - vWPos; float prD = length(prTo), prT = max(dot(-V, prTo / max(prD, 1.0e-3)), 0.0); prT *= prT; prT *= prT;
      glow += uPrBack * (albedo.r + 0.1) * (prT * uCoLampK.y * min(uLampColor.r, 1.0) * (1.0 - smoothstep(uLampRadius * 0.3, uLampRadius, prD)));
    }`,
  };
  if (dev.has('prlamp')) { const q = dev.get('prlamp').split(',').map(Number), v = coExt.uniforms.uCoLampK.value; if (Number.isFinite(q[0])) v.x = q[0]; if (Number.isFinite(q[1])) v.y = q[1]; if (Number.isFinite(q[2])) v.z = q[2]; }      // (&prlamp=0.32,1.1,0.24: to try the kept lamp's light on the company, its light through a leaf, the house's light through the arch)
  const coGeo = new THREE.InstancedBufferGeometry();
  coGeo.index = leaf.index; for (const k of ['position', 'normal', 'uv']) coGeo.setAttribute(k, leaf.attributes[k]);
  coGeo.setAttribute('aLeaf', new THREE.InstancedBufferAttribute(cLeaf, 4)); coGeo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(cSeed, 4));
  coGeo.setAttribute('aLie', new THREE.InstancedBufferAttribute(cLie, 4)); coGeo.setAttribute('color', new THREE.InstancedBufferAttribute(cCol, 3));
  coGeo.instanceCount = coN;
  const coMat = H.paint('leaf', { color: '#ffffff', vertexColors: true, side: THREE.DoubleSide, brush: 0.3, take: [0, 0, 1, 0], extend: coExt });
  const coMesh = new THREE.Mesh(coGeo, coMat);
  coMesh.name = `presences: company x ${NC} (${coN} leaves)`; coMesh.frustumCulled = false;
  coMesh.onBeforeRender = (renderer) => { const pass = passOf(renderer); A.uPrB.value.set(pass, PC.shape[0], PC.shape[1], PC.shape[2]); coMat.uniformsNeedUpdate = true; coGeo.instanceCount = Math.round(coN * share * (pass === 2 ? 0.7 : 1)); };
  coMesh.onAfterRender = () => { coGeo.instanceCount = coN; };
  ctx.add(coMesh);
  const heldHold = dev.has('prhold') ? clamp(+dev.get('prhold'), 0, 1) : null, loseAt = dev.has('prlose') ? +dev.get('prlose') : null, findAt = dev.has('prfind') ? +dev.get('prfind') : null;
  const company = P_.company = {
    object: coMesh, count: NC, leaves: coN, presences: co, formsAt: PC.formsAt,
    /** The company forms at show clock `at` (the page: c 20), one after another 0.7 s apart. */
    form({ at: a = PC.formsAt } = {}) { co.forEach((q) => { q.formsAt = a + 0.7 * ((q.k * 3) % NC); }); company.formsAt = a; return company; },
    /** Where presence k's foot is on the water now: { x, z } in the realm. */
    footOf(k, out = {}) { const q = co[k], p = coAt(q, q.phase - 0.6 * q.rate), xz = toXZ(p[0], p[1]); out.x = xz[0]; out.z = xz[1]; return out; },
  };
  // (settled at once when the realm is entered part-way or the clock is held: a picture at c 27 shows them formed, not forming)
  for (const q of co) { const p = coAt(q, q.phase), xz = toXZ(p[0], p[1]); q.x = xz[0]; q.z = xz[1]; if (show.c >= q.formsAt + PC.forms && Math.hypot(ctx.boat.x - q.x, ctx.boat.z - q.z) > PC.past) { q.hold = 1; q.speed = 1; } }

  // ============================================================================================ every frame
  const liftAt = dev.has('prlift') ? +dev.get('prlift') : null, shedAt = dev.has('prshed') ? +dev.get('prshed') : null, dots = dev.has('prdots');
  let lifted = false, shedDone = false, since = 0, first = true, lastShed = -1e9, prevC = show.c;
  const tmp = [0, 0], tmpA = [0, 0], tmpB = [0, 0], footP = {}, A_moon = coExt.uniforms.uCoMoon.value;
  return {
    update(dt) {
      const t = ctx.time, boat = ctx.boat, water = ctx.water;
      // (their own time: see SHOW. At once when the area is entered part-way, when the hour begins, when the clock is held or put back)
      { const cNow = show.c; cs = first || show.held || cNow < cs || (cs < 0 && cNow >= 0) ? cNow : Math.min(cNow, cs + dt * RATE); SHOW.value = cs; }
      const c = cs;
      hull.update(ctx);
      ROOM.value.copy(roomCol).multiplyScalar(0.9 * (show.k || 0));
      sitExt.uniforms.uPrTone.value = lerp(TONE[0], TONE[1], show.k || 0);
      MOON.value.copy(moonLit).multiplyScalar(0.16 * (ctx.look.house ? ctx.look.house.moon : 0) * (1 - 0.8 * (show.k || 0)));
      if (liftAt != null && !lifted && t >= liftAt) { lifted = true; sitters.lift(); }
      // ---- the fall: the landings, in the order the script worked out
      if (c < lastC - 0.5) { ptr = 0; while (ptr < order.length && landAt(order[ptr]) < c) ptr++; }      // (the clock was put back by hand)
      lastC = c;
      const Ld = sitters.landings, over = A.uPrA.value.x;
      let rings = 0;
      allowance = Math.min(allowance + dt * Ld.perSecond, Math.max(1, Ld.perSecond * 0.25));
      while (ptr < order.length) {
        const e = order[ptr], tl = landAt(e);
        if (tl > c) break;
        ptr++;
        if (c - tl > 1 || ev.rank[e] >= over) continue;                                                // long past (the area entered part-way, the clock pushed on): nothing replays
        const x = ev.x[e], z = ev.z[e], dist = Math.hypot(x - boat.x, z - boat.z);
        if ((Ld.rings && rings < Ld.perFrame && dist < 34) || dots) { water.ripple(x, z, dots ? 0.6 : Ld.ring[0], Ld.ring[1]); rings++; }
        if (P_.onLand && dist < Ld.within && allowance >= 1) { allowance -= 1; P_.onLand(x, z, { distance: dist, tier: boxes[ev.box[e]].tier, box: ev.box[e], c, kind: 'fall' }); }
        if (settle && dist < settleWithin) { try { settle.add(x, z, {}); } catch (err) { settle = null; console.error('theatre presences: the floaters handed to settleOn() could not take a leaf: ' + err); } }
      }
      // (are any of the sitters' leaves at the water? Only then does the picture the water reads need them)
      SIT.wet = c > sitters.fallAt + 1 || timed.length > 0 || t - lastShed < 40;
      // ---- a tier lets go: one callback a tier (the staging's rustle), from the middle of the house at that tier's height
      if (!first && P_.onLetGo) for (let tier = 5; tier >= 1; tier--) { const a = sitters.fallAt + (5 - tier) * PS.release.gap; if (prevC < a && c >= a && c - a < 1) P_.onLetGo({ kind: 'tier', tier, c, y: plan.tiers[tier].rail }); }
      // ---- handfuls: a boat passing beneath within five metres makes those above shed a handful
      since += dt;
      if (since > 0.25) {
        since = 0;
        const force = shedAt != null && !shedDone && t >= shedAt; if (force) shedDone = true;
        for (let i = 0; i < nBox; i++) {
          const b = boxes[i];
          if (!b.sheds) continue;
          const dist = Math.hypot(boat.x - b.lineX, boat.z - b.lineZ);
          if (dist > (force ? 7 : PS.handful.within) || t - b.shedAt < (force ? 1 : b.rest)) continue;
          const up = formed(i, c), drift = c < b.tForm - 2 && !b.shedOnce;
          if (!(up || drift) || (c < b.tGo && c > b.tGo - 3)) continue;
          sitters.shed(i, boat.x, boat.z); lastShed = t;
        }
      }
      for (let i = timed.length - 1; i >= 0; i--) if (t >= timed[i].at) {
        const e = timed[i]; timed.splice(i, 1);
        if (Ld.rings) water.ripple(e.x, e.z, Ld.ring[0], Ld.ring[1]);
        if (P_.onLand) P_.onLand(e.x, e.z, { distance: Math.hypot(e.x - boat.x, e.z - boat.z), kind: 'handful', c });
      }
      if (dirty) { dirty = false; tBox.needsUpdate = true; }
      // ---- the company: hold, travel, the foot's rings
      const rig = shared.stageRig;
      if (rig && rig.moonAt) { A_moon.set(rig.moonAt.x, rig.moonAt.y, rig.moonAt.z, SMn.reach); moonCol.set(SMn.color).multiplyScalar(SMn.light * (rig.moonOn || 0)); }
      coOn.set(rig ? (rig.moonOn || 0) : 0, 0.8 * (show.k || 0));
      for (const q of co) {
        const p = coAt(q, q.phase, tmp), xz = toXZ(p[0], p[1]); q.x = xz[0]; q.z = xz[1];
        const dist = Math.hypot(boat.x - q.x, boat.z - q.z), was = q.lost;
        if (dist < PC.within) q.lost = true; else if (dist > PC.past) q.lost = false;
        if (loseAt != null) q.lost = t >= loseAt && !(findAt != null && t >= findAt);                    // (&prlose=, &prfind=: to look at it losing and finding its hold)
        // (the area entered part-way, or the clock held: the show clock is first known here, not when the area is built. A presence that
        // formed long ago is formed, not forming)
        if (first && heldHold == null && loseAt == null && c >= q.formsAt + PC.forms && dist > PC.past) { q.hold = 1; q.speed = 1; }
        const want = heldHold != null ? heldHold : (c >= q.formsAt && !q.lost ? 1 : 0), before = q.hold;
        q.hold = heldHold != null ? heldHold : clamp(q.hold + clamp(want - q.hold, -dt / q.loses, dt / PC.forms), 0, 1);
        if (!first && q.lost && !was && before > 0.5 && P_.onLetGo) P_.onLetGo({ kind: 'company', k: q.k, x: q.x, y: q.tall * 0.5, z: q.z });
        if (!first && before < 1 && q.hold >= 1 && P_.onForm) P_.onForm({ kind: 'company', k: q.k, x: q.x, z: q.z });
        // it glides only while it has all its hold: it stops within a second of losing it (before the first leaf is down) and moves off again slowly
        const go = q.hold >= 0.999 ? 1 : 0;
        q.speed += (go - q.speed) * Math.min(1, dt * (go ? 0.7 : 3.2));
        // It glides at 0.4 to 0.8 m/s (the page), wandering between the two in its own time. A figure of eight travelled at an even
        // phase rate is two and a half times faster through its middle than round its ends, so the phase is advanced by the metres
        // it should cover: the speed is the page's wherever on the figure it is, and wherever the path has been clipped
        const v = lerp(PC.speed[0], PC.speed[1], 0.5 + 0.5 * Math.sin(t * TAU / q.wander + q.k * 1.9));
        coAt(q, q.phase - 0.01, tmpA); coAt(q, q.phase + 0.01, tmpB);
        q.rate = q.speed * Math.min(v / Math.max(Math.hypot(tmpB[0] - tmpA[0], tmpB[1] - tmpA[1]) / 0.02, 0.5), 0.6);
        q.phase += q.rate * dt;
        uCo[q.k].set(q.phase, q.rate, q.hold, q.w);
        // the foot draws a line of small rings; leaves that come down on the water ring it too
        q.foot += dt;
        if (q.hold > 0.8 && q.foot >= PC.foot.every) { q.foot = 0; const fp = company.footOf(q.k, footP); water.ripple(fp.x, fp.z, PC.foot.ring[0], PC.foot.ring[1]); }
        if (q.hold < before && q.hold < 0.5) {
          const due = Math.floor(Math.min(1, (0.5 - q.hold) / 0.31) * 14);
          while (q.rings < due) { q.rings++; const a = prn(q.rings * 7.7 + q.k) * TAU, r = 1.6 * Math.sqrt(prn(q.rings * 3.1 + q.k * 5)); water.ripple(q.x + Math.cos(a) * r, q.z + Math.sin(a) * r, 0.15, 0.4); }
        } else if (q.hold >= before) q.rings = 0;
      }
      prevC = c; first = false;
    },
  };
}
