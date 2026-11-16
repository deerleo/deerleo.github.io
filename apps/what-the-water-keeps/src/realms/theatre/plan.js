// The theatre of leaves: the area's numbers, taken from docs/art/theatre.md (the page). Plain data and small functions;
// no three.js objects. Every module reads this, so that a thing is where the page says in all of them.
//
// Coordinates, as on the page: `s` metres along the route from the area's entrance, `d` metres right of the centre
// line, `y` metres above the water. The route is one straight line, the axis of the building, so in the realm's own
// space x = d and z = -s. Convert with the kit (kit.at(s, d, y)); for the few things that stand behind the entrance
// (s < 0: the door wall, the portico, the far lake) use `at` from ./lib.js, which carries the line on.
//
// Added to, not rewritten: put your own numbers under a heading of your own (docs/building-an-area.md).

// ------------------------------------------------------------------------------------------------ small maths
const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = (t) => Math.min(1, Math.max(0, t));
const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
/** Piecewise-linear through [[x, y], ...] (held flat beyond the ends). */
export function pw(table, x) {
  if (x <= table[0][0]) return table[0][1];
  for (let i = 1; i < table.length; i++) if (x <= table[i][0]) return lerp(table[i - 1][1], table[i][1], (x - table[i - 1][0]) / (table[i][0] - table[i - 1][0]));
  return table[table.length - 1][1];
}
/** A smooth curve through points [[a, b], ...] (centripetal Catmull-Rom), sampled `per` times a span, with its arc lengths. */
function curveThrough(pts, per = 48) {
  const P = [[2 * pts[0][0] - pts[1][0], 2 * pts[0][1] - pts[1][1]], ...pts, [2 * pts.at(-1)[0] - pts.at(-2)[0], 2 * pts.at(-1)[1] - pts.at(-2)[1]]];
  const out = [];
  for (let i = 1; i < P.length - 2; i++) {
    const [p0, p1, p2, p3] = [P[i - 1], P[i], P[i + 1], P[i + 2]];
    const k = (a, b) => Math.pow(Math.hypot(b[0] - a[0], b[1] - a[1]), 0.5) || 1e-4;
    const t0 = 0, t1 = t0 + k(p0, p1), t2 = t1 + k(p1, p2), t3 = t2 + k(p2, p3);
    for (let j = 0; j < per + (i === P.length - 3 ? 1 : 0); j++) {
      const t = lerp(t1, t2, j / per), q = [0, 0];
      for (let c = 0; c < 2; c++) {
        const a1 = (t1 - t) / (t1 - t0) * p0[c] + (t - t0) / (t1 - t0) * p1[c], a2 = (t2 - t) / (t2 - t1) * p1[c] + (t - t1) / (t2 - t1) * p2[c], a3 = (t3 - t) / (t3 - t2) * p2[c] + (t - t2) / (t3 - t2) * p3[c];
        const b1 = (t2 - t) / (t2 - t0) * a1 + (t - t0) / (t2 - t0) * a2, b2 = (t3 - t) / (t3 - t1) * a2 + (t - t1) / (t3 - t1) * a3;
        q[c] = (t2 - t) / (t2 - t1) * b1 + (t - t1) / (t2 - t1) * b2;
      }
      out.push(q);
    }
  }
  const arc = [0];
  for (let i = 1; i < out.length; i++) arc.push(arc[i - 1] + Math.hypot(out[i][0] - out[i - 1][0], out[i][1] - out[i - 1][1]));
  return { pts: out, arc, length: arc.at(-1) };
}

// ------------------------------------------------------------------------------------------------ the route
const PATH = {
  // [x, z, halfWidth]. The centre line is the page's composed line: a boat left alone is carried down the axis.
  // Changed from the page: half width 8.0 (not 8.5) for the first 20 m, so that the hull stays clear of the stairs,
  // which stand 2.2 m out from foyer walls 10 m either side of the line (1-layout.md says why).
  points: [[0, 0, 8.0], [0, -20, 8.0], [0, -30, 11], [0, -40, 19.5], [0, -52, 20.5], [0, -66, 19.8], [0, -78, 16.5], [0, -86, 13], [0, -90, 10.5], [0, -96, 9], [0, -120, 9], [0, -150, 10], [0, -180, 12]],
  softEdges: false,
};

// ------------------------------------------------------------------------------------------------ the house
// The box-front line, right side (the left is its mirror), as (s, d): one smooth curve through these.
const BOX_LINE = [[30, 13.5], [33, 17.5], [37, 20.3], [43, 21.7], [50, 22.0], [62, 21.6], [72, 20.0], [80, 17.8], [84, 15.6], [90, 12.6]];
const FRONT = curveThrough(BOX_LINE);
/** The box-front line at `arc` metres along it from its rear end (30, 13.5): { s, d, ts, td } (tangent toward the stage). Right side. */
export function frontAt(arc) {
  const a = Math.min(FRONT.length, Math.max(0, arc)), A = FRONT.arc;
  let lo = 0, hi = A.length - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (A[m] <= a) lo = m; else hi = m; }
  const f = (a - A[lo]) / Math.max(1e-6, A[hi] - A[lo]), p = FRONT.pts[lo], q = FRONT.pts[hi], l = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1;
  return { s: lerp(p[0], q[0], f), d: lerp(p[1], q[1], f), ts: (q[0] - p[0]) / l, td: (q[1] - p[1]) / l };
}
/** Arc length along the box-front line at which it passes `s`. */
export function frontArcAtS(s) {
  const P = FRONT.pts;
  for (let i = 1; i < P.length; i++) if (P[i][0] >= s) return lerp(FRONT.arc[i - 1], FRONT.arc[i], clamp01((s - P[i - 1][0]) / Math.max(1e-6, P[i][0] - P[i - 1][0])));
  return FRONT.length;
}
/** How far the box fronts stand from the centre line at `s` (30..90). */
export const frontD = (s) => frontAt(frontArcAtS(Math.min(90, Math.max(30, s)))).d;

const REAR_FACE = 31.2;                                  // the house face of the arch wall: where the side fronts begin and the rear fronts run
const ARC_REAR = frontArcAtS(REAR_FACE), ARC_84 = frontArcAtS(84), BAY = 3.3;
const ARC_BAY0 = ARC_84 - 17 * BAY;                      // seventeen bays a side end at the stage box (s 84)
const ARC_58 = frontArcAtS(58);

/**
 * Tier `t`'s front as a polyline in plan: [{ s, d, ns, nd, arc58 }], a point every `step` metres. (ns, nd) points into
 * the room; arc58 is metres along the front from the bracket nearest s 58 on that side (what the kindling runs on).
 * t = 0 is the parterre line, tiers 1..5 stand 0.25 m further back each. Tiers 3 to 5 cross the rear wall.
 */
export function tierLine(t, step = 0.55) {
  const back = 0.25 * t, out = [];
  const side = (sign, from, to) => {
    const n = Math.max(2, Math.round(Math.abs(to - from) / step));
    for (let i = 0; i <= n; i++) {
      const a = lerp(from, to, i / n), p = frontAt(a);
      // into the room: the tangent runs toward the stage; on the right side the room is to its left
      out.push({ s: p.s - p.td * back, d: sign * (p.d + p.ts * back), ns: p.td, nd: -sign * p.ts, arc58: Math.abs(a - ARC_58), side: sign });
    }
  };
  if (t >= 3) {
    side(-1, FRONT.length, ARC_REAR);
    const a = out.at(-1), y0 = a.d, n = Math.round(2 * Math.abs(y0) / step);
    for (let i = 1; i < n; i++) { const d = lerp(y0, -y0, i / n); out.push({ s: REAR_FACE, d, ns: 1, nd: 0, arc58: ARC_58 - ARC_REAR + (Math.abs(y0) - Math.abs(d)), side: Math.sign(d) || 1, rear: true }); }
    side(1, ARC_REAR, FRONT.length);
    return [out];
  }
  const left = []; side(-1, FRONT.length, 0); left.push(...out.splice(0));        // tiers 1 and 2 run into the corner beside the arch wall's end
  side(1, 0, FRONT.length);
  return [left, out];
}

/**
 * The bays of the house, set out along the fronts. PLAN.bays: the 190 ordinary bays of tiers 1 to 5 ({ tier, s, d (the middle
 * of its front), turn (rotation.y that turns a bay's front into the room), pier (the pier it owns: its end nearer the rear),
 * side, arc58 (metres along the front from the bracket nearest s 58: what the kindling runs on) }); PLAN.parterreBoxes: the 34
 * boxes at water level; PLAN.stageBoxLevels: the two stage boxes, level by level (tier 0 is the parterre level).
 */
function layoutBays() {
  const bays = [], parterreBoxes = [], stageBoxLevels = [];
  for (const sign of [-1, 1]) {
    for (let i = 0; i < 17; i++) {
      const a0 = ARC_BAY0 + i * BAY, mid = frontAt(a0 + BAY / 2), pier = frontAt(a0);
      const turn = Math.atan2(-sign * mid.ts, -mid.td);      // rotation.y that turns a bay's front (+Z) into the room
      parterreBoxes.push({ s: mid.s, d: sign * mid.d, turn, pier: { s: pier.s, d: sign * pier.d }, side: sign, i, arc58: Math.abs(a0 - ARC_58) });
      for (let t = 1; t <= 5; t++) {
        const b = 0.25 * t;
        bays.push({ tier: t, s: mid.s - mid.td * b, d: sign * (mid.d + mid.ts * b), turn, pier: { s: pier.s - pier.td * b, d: sign * (pier.d + pier.ts * b) }, side: sign, i, arc58: Math.abs(a0 - ARC_58) });
      }
    }
    const sb = frontAt((ARC_84 + FRONT.length) / 2);
    for (let t = 0; t <= 5; t++) stageBoxLevels.push({ tier: t, s: sb.s, d: sign * sb.d, turn: Math.atan2(-sign * sb.ts, -sb.td), side: sign });
  }
  const yEdge = frontAt(ARC_REAR).d;
  for (let t = 3; t <= 5; t++) for (let i = 0; i < 8; i++) {
    const d = -4 * BAY + (i + 0.5) * BAY;
    if (t <= 4 && Math.abs(d) < BAY) continue;             // the royal box takes the middle two bays of tiers 3 and 4
    bays.push({ tier: t, s: REAR_FACE, d, turn: Math.PI, pier: { s: REAR_FACE, d: d - BAY / 2 }, side: Math.sign(d), i, rear: true, arc58: ARC_58 - ARC_REAR + (yEdge - Math.abs(d)) });
  }
  return { bays, parterreBoxes, stageBoxLevels };
}

// ------------------------------------------------------------------------------------------------ the show clock
// The house keeps its hour (the page, section 6): `c` starts at 0 when the boat first has s >= 54 and never resets.
// Each frame c = max(c + dt, f(s)): a rider who stops gets the whole show where they are, one who paddles gets it faster.
const SHOW_F = [[54, 0], [66, 13], [80, 27], [86, 29], [98, 40]];
const TIER_START = [0, 6, 8, 10, 12, 14];                  // c at which tier t's first bracket catches
const KINDLE_SPEED = 8;                                    // m/s the flame runs along a front
/** When a flame catches, on the show clock. kind: 'tier' (t, arc58) | 'chandelier' (ring 0..2, u 0..1 round it) | 'lustre' (pair 0..4) | 'stagebox' (level 1..5) | 'arch' (u 0 springing .. 1 crown) | 'royal' (u 0..1). */
export function kindleTime(kind, a = 0, b = 0) {
  if (kind === 'tier') return TIER_START[a] + b / KINDLE_SPEED;
  if (kind === 'chandelier') return [1, 3.5, 5][a] + [2.5, 1.5, 1][a] * b;      // lowest ring (48) in 2.5 s, the middle (32) in 1.5 s, the top (16) in 1 s
  if (kind === 'lustre') return 10 + 0.8 * a;                                   // in pairs from the rear toward the stage
  if (kind === 'stagebox') return 18 + 0.3 * a;
  if (kind === 'arch') return 18.2 + 1.8 * a;
  if (kind === 'royal') return 16 + 2 * a;
  return 0;
}
/** The house curtain's hem above the water at show clock c: 3 m, then up 11 m between c 13 and 27, eased, with one catch at 6 m. */
export function curtainHem(c) {
  if (!(c > 13)) return 3;
  const t = clamp01((c - 13) / 14), e = t * t * (3 - 2 * t);
  const caught = 0.5 * Math.exp(-Math.pow((3 + 11 * e - 6) / 0.6, 2));          // it hangs back a breath as it passes 6 m
  return 3 + 11 * e - caught;
}

// ------------------------------------------------------------------------------------------------ the plan
export const PLAN = {
  id: 'theatre',
  length: 180,
  path: PATH,
  stretches: { foyer: [0, 30], house: [30, 90], stage: [90, 120], fly: [120, 180], veilIn: [0, 26], veilOut: [154, 180] },

  /** The current, m/s, set live from the boat's distance (look.current and look.currentNarrow alike). Hands off: about 112 s. */
  current: [[0, 2.6], [28, 2.6], [32, 1.5], [51, 1.5], [55, 1.1], [116, 1.1], [120, 2.4], [180, 2.4]],
  currentAt: (s) => pw(PLAN.current, s),

  /** Where a rider who lets the current take them is asked to look: [s, yaw, pitch] (degrees; yaw positive to the left). For the interface's eased gaze. */
  gaze: [[30, 0, 12], [52, 50, 55], [60, 50, 55], [63, 0, 8], [84, 0, 14], [112, 0, 10], [126, 0, 35]],

  /** Solid things in the channel: { s, d, r, what }. The realm file adds them all. */
  colliders: [
    // the arch wall's two piers (2 m wide, 2.4 m thick): two circles each follow the pier closer than the page's one of 2.3 m, which left the middle arch 2.5 m of free water
    { s: 29.4, d: -4.5, r: 1.35, what: 'arch pier' }, { s: 30.6, d: -4.5, r: 1.35, what: 'arch pier' },
    { s: 29.4, d: 4.5, r: 1.35, what: 'arch pier' }, { s: 30.6, d: 4.5, r: 1.35, what: 'arch pier' },
    { s: 19.6, d: -7.75, r: 0.45, what: 'newel and lamp standard' }, { s: 19.6, d: 7.75, r: 0.45, what: 'newel and lamp standard' },
    { s: 58, d: -9, r: 6.8, what: 'the beech and its mound' },
    // the orchestra's two groups (stands, harp, bass, kettledrums): ONE round collider each, centred beyond the edge, so that a boat
    // coming down the side is turned in past the whole group. A hard circle on each instrument held a drifting boat fast between
    // the instruments and the narrowing edge (1-layout.md, with the logs). 18 m of free water stays between the two.
    { s: 83.5, d: -17, r: 7.9, what: 'the orchestra, left group' }, { s: 83.5, d: 17, r: 7.9, what: 'the orchestra, right group' },
    { s: 110, d: 2.4, r: 0.4, what: 'the kept lamp' },
  ],

  // ---- levels (y)
  levels: { water: 0, foyer: -1.0, stallsAt34: -1.25, stallsAt76: -1.75, orchestra: -1.2, stage: -0.5, underStage: -3.2 },
  stallsFloor: (s) => lerp(-1.25, -1.75, clamp01((s - 34) / 42)),

  // ---- the foyer and what is behind the entrance (s < 0 is behind the entrance: local z = -s is positive there)
  foyer: {
    halfWidth: 10, height: 10, flareFrom: 20, flareTo: 30, flareHalfWidth: 13.5, detailedFrom: 12, coffers: 18,
    wallAt: (s) => lerp(10, 13.5, clamp01((s - 20) / 10)),
    // twin stairs, 2.2 m wide: from the first-tier corridor (y 3.2) at s 9 down the walls; under the water they sweep in to the floor at s 23, d +-6.5.
    // Changed from the page: above the water they keep to the walls (see 1-layout.md); the sweep is the last ten steps, which are under water.
    stairs: { width: 2.2, line: [[9, 8.9, 3.2], [15, 8.9, 1.4], [19.7, 8.75, 0], [21.6, 7.6, -0.56], [23, 6.5, -1.0]], balusters: 60 },
    newel: { s: 19.6, d: 7.75, standard: 2.2 },
    doorWall: { s: -1, arches: [{ d: 0, w: 7, h: 8 }, { d: -7.5, w: 5, h: 7 }, { d: 7.5, w: 5, h: 7 }], pier: 1.5, width: 36, top: 16 },     // the town's arcade wall (its page: 7 m flanked by two of 5 m on 1.5 m piers; this page said three doorways of 4 m)
    portico: { s: -14, columns: [-17, -10.75, -4.5, 4.5, 10.75, 17], height: 14, base: 1.6, neck: 1.35 },                // the town's theatre_front column, six times
    farLake: { s: -200, width: 176, height: 33 },
  },
  archWall: { s: [28.8, 31.2], width: 27, arches: [-9, 0, 9], archWidth: 7, archHeight: 9, pier: 2, face: REAR_FACE, top: 19.6,
    royal: { width: 6.6, y: [9.6, 16], canopy: 8 } },

  // ---- the auditorium
  boxLine: BOX_LINE, frontLength: FRONT.length, bay: BAY, baysASide: 17, rearBays: 8,
  arc: { rearFace: ARC_REAR, bay0: ARC_BAY0, at58: ARC_58, at84: ARC_84, end: FRONT.length },
  parterre: { rail: 0.25, top: 2.9, depth: 1.9, opening: 2.65 },
  tiers: [null, { floor: 3.2, rail: 4.3 }, { floor: 6.4, rail: 7.5 }, { floor: 9.6, rail: 10.7 }, { floor: 12.8, rail: 13.9 }, { floor: 16.0, rail: 17.1 }],
  tierSetback: 0.25, boxDepth: 2.3,
  // the tier front's section: (o metres out from the line into the room, y above the tier's floor line); the top 0.12 m is the velvet pad
  tierSection: [[0, 1.10], [0.30, 1.10], [0.34, 1.04], [0.30, 0.98], [0.24, 0.94], [0.26, 0.86], [0.20, 0.80], [0.30, 0.62], [0.38, 0.45], [0.34, 0.26], [0.22, 0.12], [0.26, 0.06], [0.24, 0], [0.10, -0.06], [0, -0.22]],
  candleRow: (t) => 3.2 * t + 1.5,                        // height of tier t's flames (none in the house burns below y 4.6)
  cornice: 19.6, cove: [19.6, 26], windows: { n: 12, dia: 1.6, y: 22.5 },
  dome: { s: 56, d: 0, ring: 26, radius: 17, crown: 36 },
  tear: { s: 58, d: -9, r: 12 },
  /** Is the point (s, d) of the dome or cove inside the tear? A ragged outline, the same for every module. */
  inTear: (s, d) => {
    const x = s - 58, z = d + 9, a = Math.atan2(z, x);
    return Math.hypot(x, z) < 12 * (1 + 0.10 * Math.sin(a * 3 + 0.7) + 0.07 * Math.sin(a * 7 + 2.1) + 0.045 * Math.sin(a * 13 + 4.0));
  },

  // ---- the monument
  beech: { s: 58, d: -9, mound: { waterline: 10, onSeats: 18, height: 1.8 }, trunk: [[2, 2.6], [8, 2.0], [14, 1.8]], fork: 14, leaders: 3,
    limb: { from: [58, -9, 12.5], to: [51, -22.6, 13.6] }, leavesFrom: 15, crown: 22, throughTear: [34, 37], top: 44, masses: 44, sprays: 2000 },
  shaft: { across: 20, tiltDeg: 5, top: 38, rain: { radius: 9.5, fadeFrom: 8, fadeTo: 10.5, streaks: 6000 } },
  chandelier: { s: 60.5, d: -5.5, y: [15, 20.2], across: 6, hangsFrom: 22.7, outOfTrueDeg: 6, spareChain: 3, rings: [{ n: 48, r: 2.9, y: 16.1 }, { n: 32, r: 2.1, y: 17.6 }, { n: 16, r: 1.2, y: 19.0 }] },
  lustres: { s: [40, 50, 60, 70, 80], inside: 2.2, y: 7.7, across: 1.3, candles: 12, chain: 2.1 },

  // ---- under the water
  seats: { rows: 46, pitch: 0.9, width: 0.5, back: 0.95, from: 34, to: 76, pool: 420 },
  runner: { width: 2.2, s: [32, 77] },
  fallenSky: [[48, -3], [52, 1.5], [55, -17], [63, -1], [66, -14], [69, -5]],

  // ---- the orchestra
  orchestra: { s: [78, 90], harp: [82.5, -10.8, 1.9], bass: [86, -11.4, 2.0], timpani: [86.5, 11.2], rostrum: [79, 0], stand: 1.35,
    stands: (() => { const out = []; for (const sign of [-1, 1]) for (let i = 0; i < 7; i++) out.push([lerp(80, 88, i / 6), sign * lerp(9.8, 11.6, i / 6)]); return out; })() },

  // ---- the stage
  proscenium: { s: [89.2, 90.8], width: 30, height: 19.6, opening: [24, 16], springing: 11, reveal: 1.6 },
  /** Height of the proscenium opening's head at d (springing at y 11, crown at y 16). */
  archHead: (d) => 11 + 5 * Math.sqrt(Math.max(0, 1 - (d / 12) * (d / 12))),
  stageHouse: { s: [90.8, 120], wall: 16, gallery: { y: 9, depth: 1.2 }, roof: 31 },
  curtain: { s: 90.8, width: 25, drop: 14.5, pelmet: 2.4, scallops: 9, tassels: 160 },
  footlights: { s: 91, length: 24, shells: 24 },
  wings: { s: [94, 99.5, 105, 110.5, 116], width: 4.2, heights: [9.5, 9.0, 8.5, 8.0, 7.5], inner: 10.6 },
  rollers: { s: [96.7, 102.2, 107.7, 113.2], d: [10.8, 15.2], across: 0.78, axisY: 0.06, periods: [6, 7, 8.5, 10] },
  // (the page gives the borders 26 m; at that width the sight lines from the house over the wings' inner corners pass outside them into the dark: 31 m masks)
  borders: { s: [96, 101.5, 107, 112.5, 118], width: 31, top: 14, edge: [9.5, 11], page: { width: 26 } },
  cloudCars: [
    { name: 'A', width: 4.6, s: 104, from: [-9, 15], to: [-3.5, 4.2] },
    { name: 'B', width: 3.4, s: 104.5, from: [13, 14], to: [10.5, 5.5] },
    { name: 'C', width: 3.4, s: 115, from: [-8, 13], to: [-1, 6.5] },
  ],
  stageMoon: { across: 2.4, s: 117, from: [-13.5, 2.0], to: [-2.5, 12.5] },
  // The kept lamp. The page has it at d 6; it stands at d 2.4 because from the centre line the boat's own bow lantern hides
  // whatever lies 3 to 9 degrees right of the bow at the height of the far water, which is where d 6 is from the arches to s 62 (1-layout.md).
  lamp: { s: 110, d: 2.4, note: 69, moths: 4, reach: 17, page: { d: 6 } },
  traps: [[100, -2], [106, 3], [112, -4]],
  backcloth: { s: 120, width: 26, height: 12, widths: 6 },
  company: [[97.5, -4.5], [98.5, 4], [102.5, -1.5], [105, -6], [109.5, -3.5], [114.5, -3], [101, 6.5]],

  // ---- the fly tower
  fly: { s: [120, 165], wall: 13, gallery: 9, grid: 30, floorEnds: 160, ropes: { perSide: 30, d: [10.3, 11.5], s: [122, 160] }, sandbags: 14, counterweights: 10,
    cloths: [{ s: 128, shade: 0.5, what: 'a moon over waves' }, { s: 139, shade: 0.25, what: 'a tree in snow' }, { s: 150, shade: 0.1, what: 'a sunrise' }], cloth: [14, 9],
    lastRope: { s: 160, d: -2.5 } },

  // ---- the show
  show: { cueAt: 54, f: (s) => pw(SHOW_F, s), table: SHOW_F, tierStart: TIER_START, speed: KINDLE_SPEED, flames: 890, fullHouse: [25, 29], fall: [29, 40] },

  // ---- the light (the page's table, section 2). The realm file gives column A as `look`; set.js makes the three states.
  light: {
    veil: '#140f18',
    A: { background: '#07100E', fog: { color: '#0E211D', density: 0.009 }, exposure: 1.08, bloom: { strength: 0.50, radius: 0.75, threshold: 0.80 },
      light: { key: [0.07, -0.98, 0.20], keyColor: '#CFE0DA', gain: 0.45, shadow: '#12302A', lit: '#E9F3EE', sky: '#16302A', ground: '#0D1F1A', lanternRadius: 7, heightFog: 0.12, heightFogOver: 4 },
      grade: { tint: '#EEF6F1', saturation: 1.06, contrast: 1.04, lift: '#050C0A', vignette: 0.40, grain: 0.035 }, paint: 0.70, paintRadius: 4.2, lantern: 2.4 },
    B: { background: '#0A120C', fog: { color: '#1B2A1C', density: 0.009 }, exposure: 0.98, bloom: { strength: 0.72, radius: 0.80, threshold: 0.76 },
      light: { gain: 0.40, shadow: '#1C3526', lit: '#FFF0CF', sky: '#4A3C1C', ground: '#2A2410', heightFog: 0.08 },
      grade: { tint: '#FFF6E6', saturation: 1.10, lift: '#080D07', vignette: 0.34 }, lantern: 2.0 },
    C: { background: '#05060C', fog: { color: '#0B0A10', density: 0.016 }, exposure: 1.0, bloom: { strength: 0.45, radius: 0.70, threshold: 0.82 },
      light: { gain: 0, shadow: '#161224', lit: '#D8DCE6', sky: '#0F0E16', ground: '#08080D', heightFog: 0.20, heightFogOver: 3 },
      grade: { tint: '#E8ECF6', saturation: 0.95, lift: '#04050A', vignette: 0.46 }, paint: 0.75, paintRadius: 4.5, lantern: 2.6 },
    flyFrom: 118, flyTo: 150,                              // B turns into C by distance (the page: blend [0.655, 0.835])
    foyerExposure: 0.9, foyerTo: [20, 29],                 // the foyer is held a little under; it opens as the arches are reached
    sky: '#0A1512', moon: { elevationDeg: 85, leftDeg: 20, acrossDeg: 9, haloDeg: 25 }, clouds: [{ y: 70, speed: 0.5 }, { y: 110, speed: 0.8 }],
  },
  // the palette's chips (section 2), for stand-ins and for whoever paints a model
  chips: { houseDark: '#0B1D19', bottle: '#1F4A3E', gilt: '#A8843F', bole: '#7A3526', giltLit: '#E8B64C', candle: '#FFD27A', candleCore: '#FFF1C8', copper: '#B5522A', bronze: '#7A3B22', oldGold: '#C08A3A',
    purpleBronze: '#5A2630', vermilion: '#E0492B', runner: '#8E2F22', pearl: '#C4D6D0', bark: '#6F7A76', rose: '#C99AA0', plum: '#17111A', buff: '#C9A27E' },

  // ---- painted art as the ride loads it (assets/). The sky is the page's `sky` picture (generated at stage 1); the others on
  // the page's list are textures and are the kit's: dome, gilt, backcloth, wings, cloths, bark.
  art: { sky: 'art/theatre/sky.webp' },

  // ---- stand-ins that the people who follow replace. When the real thing exists, set its flag to false here and
  // delete the stand-in's code (kit.js builds the multitudes below only while their flag is true).
  standIn: { flames: true, leaves: true, rain: true, sitters: true, company: true, curtain: true, cloths: true },
};

Object.assign(PLAN, layoutBays());

// ------------------------------------------------------------------------------------------------ the flames and the sitters
const rng = (seed) => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
let _flames = null, _sitters = null;
/**
 * Every candle flame of the house (890): [{ s, d, y, t (the show clock at which it catches), out (when it goes out for good,
 * or Infinity), where: 'tier' | 'stagebox' | 'royal' | 'tree' | 'lustre' | 'arch', tier }]. None burns below y 4.6.
 * The flames, the light they throw (lib.js) and the share of them burning (set.js) all come from this one list.
 */
export function flames() {
  if (_flames) return _flames;
  const out = [], rnd = rng(890), add = (where, s, d, y, t, tier = 0) => out.push({ where, s, d, y, t: t + rnd() * 0.25, out: Infinity, tier });
  // 190 three-armed girandoles, one on the pier of every ordinary bay. Their wicks are the girandoles' own (girandoles(), under
  // "the horseshoe" at the end of this file: each has its own three candle lengths, and a few hang off true)
  for (const g of girandoles()) if (!g.late) for (const q of g.wicks) add('tier', q.s, q.d, q.y, g.t, g.tier);      // (the three `late` ones: at the end of this function)
  // the two stage boxes: a five-candle branch on each of five levels
  for (const b of PLAN.stageBoxLevels) if (b.tier > 0) {
    const ns = -Math.cos(b.turn), nd = Math.sin(b.turn);
    const fore = 0.46 + 0.29 - PLAN.tierSetback * b.tier;        // (2-heroes-house.md: the branch stands 0.46 m before its OWN tier's line, as light.js has it, and 0.29 m more since the fronts of the stage boxes are bowed ("Second look"): stage_box.py FORE; it was 0.5 m before the parterre line on every level, 1.75 m out in the air at tier 5)
    for (let k = -2; k <= 2; k++) add('stagebox', b.s + ns * fore - nd * k * 0.22, b.d + nd * fore + ns * k * 0.22, PLAN.candleRow(b.tier) + 0.05 * (2 - Math.abs(k)), kindleTime('stagebox', b.tier), b.tier);
  }
  // the royal box (royal_wall.glb carries these candles: 2-heroes-house.md): a five-candle branch on its front, and three brackets up each jamb.
  // Its jambs stand at d +-3.3. The right one is also the pier of the bay beside it, whose own girandoles (above) are its brackets at tiers 3 and 4:
  // so the model adds all three on the left jamb and only the middle one on the right. (It was 3 x 3 on each side at d +-3.55.)
  for (let k = -2; k <= 2; k++) add('royal', PLAN.archWall.face + 0.46, k * 0.22, 11.1 + 0.05 * (2 - Math.abs(k)), kindleTime('royal', 0.25));
  for (const [sign, ys] of [[-1, [11.1, 12.7, 14.3]], [1, [12.7]]]) for (const y of ys) for (let k = -1; k <= 1; k++) add('royal', PLAN.archWall.face + 0.47, sign * BAY + k * 0.17, y + 0.05 * (1 - Math.abs(k)), kindleTime('royal', (y - 11.1) / 3.2));
  // (2-heroes-house.md, "Second look": two more three-armed brackets INSIDE the royal box, on its back wall either side of the pier-glass, 0.2 m before that wall.
  // From the house the box was a dark hole in the lit rear wall; royal_box.glb carries them and heroes_house.js lights the box from them)
  for (const sign of [-1, 1]) for (let k = -1; k <= 1; k++) add('royal', PLAN.archWall.face - 1.98, sign * 0.985 + k * 0.17, 12.95 + 0.05 * (1 - Math.abs(k)), kindleTime('royal', 0.6));
  // the chandelier in the tree: three rings, hanging six degrees out of true
  { const C = PLAN.chandelier, tilt = Math.tan(C.outOfTrueDeg * Math.PI / 180);
    C.rings.forEach((ring, r) => { for (let i = 0; i < ring.n; i++) { const a = i / ring.n * Math.PI * 2 + r * 0.4, ds = Math.cos(a) * ring.r, dd = Math.sin(a) * ring.r;
      add('tree', C.s + ds, C.d + dd, ring.y + dd * tilt + 0.12, kindleTime('chandelier', r, ((i * 7) % ring.n) / ring.n)); } }); }
  // ten lustres of twelve candles, each hung from a pier of the third tier (lustresAt(), under "the horseshoe" at the end of this
  // file); `swing` says which lustre a flame hangs with (1..10), so that it can swing with it
  for (const L of lustresAt()) for (const q of L.wicks) { add('lustre', q.s, q.d, q.y, kindleTime('lustre', L.pair) + rnd() * 0.5); out[out.length - 1].swing = L.group; }
  // twelve brackets round the proscenium arch, from the springing up to the crown
  // (2-heroes-house.md, "Second look": the last two stood at 5.7 and 2.9, which left 5.8 m of the crown with no candle and the shield at the crown dark;
  // light.js lays this row's pools at 4.96 and 1.49. They now stand at 5.1 and 1.75, either side of the shield and the shell; proscenium.glb carries them)
  [12.9, 12.2, 10.6, 8.4, 5.1, 1.75].forEach((x, j) => { for (const sign of [-1, 1]) for (let k = -1; k <= 1; k++)
    add('arch', PLAN.proscenium.s[0] - 0.4, sign * (x + k * 0.17), PLAN.archHead(Math.min(11.6, x)) + 1.0 + 0.05 * (1 - Math.abs(k)), kindleTime('arch', j / 5)); });
  // during the fall one flame in ten on tiers 4 and 5 goes out and stays out
  for (const fl of out) if (fl.where === 'tier' && fl.tier >= 4 && rnd() < 0.1) fl.out = 30 + rnd() * 8;
  // (2-kit-tiers.md, sixth look: nine more, on the three brackets of the pier that closes the rear front of tiers 3 to 5 at d +13.2: girandoles(), `late`. They are
  // added LAST and with a random source of their own, so that no other flame of the house changes its time or its fate: 898 in all)
  { const r2 = rng(898); for (const g of girandoles()) if (g.late) for (const q of g.wicks) out.push({ where: 'tier', s: q.s, d: q.d, y: q.y, t: g.t + r2() * 0.25, out: Infinity, tier: g.tier }); }
  _flames = out;
  return out;
}
/** The share of the house's flames that are burning at show clock c (0..1): what eases the light from state A toward state B. */
export function shareBurning(c) {
  if (!(c > 0)) return 0;
  let n = 0; const F = flames();
  for (const fl of F) n += clamp01((c - fl.t) / 0.9) * (c > fl.out ? Math.max(0, 1 - (c - fl.out) / 1.5) : 1);
  return n / F.length;
}
/**
 * Where a presence sits: one in every box but one in six (about 170 of 204): [{ s, d, y (the rail top it shows above), turn,
 * t (the show clock at which it begins to form: 1.5 s behind its tier's flame; it takes 4 s), tier }].
 */
export function sitters() {
  if (_sitters) return _sitters;
  const out = [], rnd = rng(170), back = 0.75;
  const put = (s, d, turn, tier, t) => { if (rnd() < 1 / 6) return; out.push({ s: s + Math.cos(turn) * back, d: d - Math.sin(turn) * back, y: PLAN.tiers[tier].rail, turn, tier, t: t + 1.5, seed: rnd() }); };
  for (const b of PLAN.bays) put(b.s, b.d, b.turn, b.tier, kindleTime('tier', b.tier, b.arc58));
  for (const b of PLAN.stageBoxLevels) if (b.tier > 0) put(b.s + Math.cos(b.turn) * PLAN.tierSetback * b.tier, b.d - Math.sin(b.turn) * PLAN.tierSetback * b.tier, b.turn, b.tier, kindleTime('stagebox', b.tier));      // (2-heroes-house.md: behind its own tier's rail, not the parterre's)
  for (const d of [-1.65, 1.65]) put(PLAN.archWall.face, d, Math.PI, 3, kindleTime('royal', 0.5));      // (2-heroes-house.md: the royal box is one room 6.4 m high with one rail, tier 3's: the two sitters that stood at tier 4's height hung in the air)
  _sitters = out;
  return out;
}
PLAN.flames = flames; PLAN.sitters = sitters; PLAN.shareBurning = shareBurning; PLAN.kindleTime = kindleTime; PLAN.curtainHem = curtainHem;
PLAN.frontAt = frontAt; PLAN.frontD = frontD; PLAN.frontArcAtS = frontArcAtS; PLAN.tierLine = tierLine;
export default PLAN;

// ================================================================================================ the horseshoe
// Stage 2, kit and close band, the tiers (docs/build/theatre/2-kit-tiers.md; built in kit_tiers.js). Under this heading:
//   PLAN.horseshoe          the numbers of the bay, the pier and the girandole as they are modelled (source-art/models/theatre/)
//   PLAN.bayDesign(b)       which of the three designs a bay wears: 'a' beech, 'b' oak, 'c' laurel (no two neighbours alike, along a tier or up the house)
//   PLAN.sideFront(t, sign, arc)   a point of tier t's side front, with the way along it and the way into the room
//   PLAN.piers()            every pier of the five tiers: the 190 that own a bay's rear end (each carries a girandole), and those that close a run
//   PLAN.girandoles()       the 190 three-armed brackets: where each stands, how it hangs, its three candle lengths, and where its three wicks are
// flames() takes its 570 tier flames from girandoles(): move a candle there and its flame moves with it.
const HORSESHOE = {
  bay: { half: BAY / 2 },
  // The girandole in the pier's own axes (x along the front, y up from the tier's floor line, z into the room): the tops of its three
  // sockets (where a candle stands), the candle as modelled (the realm draws each to its own length), the wick above the wax, and the
  // fixing on the front that a crooked one hangs about. THE MODEL IS BUILT TO THESE: source-art/models/theatre/girandole.py prints its own.
  girandole: { sockets: [[-0.21, 1.36, 0.45], [0, 1.385, 0.52], [0.21, 1.36, 0.45]], candle: 0.14, wick: 0.014, fixing: [0, 0.93, 0.30], offTrue: 0.06, drop: [0, 0.742, 0.468] },      // (third look) drop: under the curl of the middle arm, where a pearl drop hangs (girandole.py prints it)      // (second look: the bracket is broader: its outer candles stood 0.17 m out)
  // (SECOND LOOK, 7 Nov 18:10: THE SHAFT IS THICKER. It was 0.058 m in radius; it is fluted now, its arrises at `radius` (0.074 at the foot,
  // 0.076 a third of the way up, 0.071 at 2.42 m, 0.062 under the necking) and its hollows at 0.8 of that. Anything that perches on it
  // (moths) must stand `radius` + its own clearance from the axis: use colonnette.r(h), h metres above the tier's floor line.)
  colonnette: { z: 0.06, foot: 1.10, top: 3.18, shaft: [1.24, 2.945], radius: 0.076,
    r: (h) => (h < 1.8 ? 0.074 + 0.002 * (h - 1.24) / 0.56 : h < 2.42 ? 0.076 - 0.005 * (h - 1.8) / 0.62 : 0.071 - 0.009 * Math.min(1, (h - 2.42) / 0.525)) },          // it stands on the rail and carries the corbel of the pier above
  box: { back: 2.22, top: 2.97 },                           // the bay's own back wall and ceiling, just inside the building's
  // (second look) the hanging in the head of every box: 0.03 m behind the front line, from under the bed of the tier above down to a
  // scalloped hem, gathered at hemHigh and lowest between (heights above the tier's floor line; a fringe of `fringe` hangs below the hem).
  // Design a: three even scallops down to hemLow; b: two wide ones down to 2.50; c: three, the middle one down to 2.49.
  // (third look: it is a festoon now: its folds billow up to `billow` into the room from the box-front line; under the hem a galloon and a fringe
  // reach `fringe` below it; a tassel on a cord hangs at each gathering between two scallops, down to `tassel` above the floor line.)
  hanging: { behind: 0.03, top: 3.165, hemHigh: 2.805, hemLow: 2.595, lowest: 2.49, fringe: 0.107, billow: 0.06, tassel: 2.41 },
};
/** A point of tier t's side front `arc` metres along the box-front line, on side `sign`: { s, d, ts, td (along it toward the stage), ns, nd (into the room), turn (rotation.y that looks into the room) }. */
export function sideFront(t, sign, arc) {
  const p = frontAt(arc), back = 0.25 * t, ns = p.td, nd = -sign * p.ts;
  return { s: p.s - p.td * back, d: sign * (p.d + p.ts * back), ts: p.ts, td: sign * p.td, ns, nd, turn: Math.atan2(nd, -ns) };
}
const bayDesign = (b) => 'abc'[(b.i + b.tier + (b.rear ? 1 : 0)) % 3];
let _piers = null, _girandoles = null;
/**
 * Every pier of the five tiers: [{ tier, s, d, turn (rotation.y: its front looks into the room, square to the front at the joint),
 * side, rear, bay (the bay whose rear end it owns: it carries that bay's girandole) | end ('stage box' | 'rear corner' | 'royal box':
 * it closes a run and carries no candles) }]. The pier's model is the colonnette, the strap over the joint of two bays, the corbel
 * under it and the partition between two boxes.
 */
export function piers() {
  if (_piers) return _piers;
  const out = [];
  for (const b of PLAN.bays) {
    if (b.rear) out.push({ tier: b.tier, s: b.pier.s, d: b.pier.d, turn: Math.PI, side: b.side, rear: true, bay: b });
    else { const p = sideFront(b.tier, b.side, ARC_BAY0 + b.i * BAY); out.push({ tier: b.tier, s: p.s, d: p.d, turn: p.turn, side: b.side, bay: b }); }
  }
  for (const sign of [-1, 1]) for (let t = 1; t <= 5; t++) { const p = sideFront(t, sign, ARC_84); out.push({ tier: t, s: p.s, d: p.d, turn: p.turn, side: sign, end: 'stage box' }); }
  for (let t = 3; t <= 5; t++) {
    out.push({ tier: t, s: REAR_FACE, d: 4 * BAY, turn: Math.PI, side: 1, rear: true, end: 'rear corner' });
    // (the closing piers at d -3.3 on tiers 3 and 4 are gone: the royal box has jambs of its own there, royal_wall.glb; 2-kit-tiers.md said to drop them then)
  }
  return (_piers = out);
}
/**
 * The 193 girandoles (190 on the piers that own a bay's end, and since the sixth look three `late` ones on the pier that closes the rear front of tiers 3 to 5):
 * [{ tier, s, d, turn (the pier's), roll (radians it hangs off true about its fixing: 0 for all but about six in
 * a hundred), lengths: [3] (each candle burnt to its own length, 8 to 22 cm, no two alike), wicks: [{ s, d, y } x 3], t (the show
 * clock at which it catches), bay, corner (it is fixed on a corner pier beside the arch wall), late }].
 */
export function girandoles() {
  if (_girandoles) return _girandoles;
  const G = HORSESHOE.girandole, rnd = rng(570), out = [], orders = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
  for (let p of piers()) {
    // (sixth look) THE PIER THAT CLOSES THE REAR FRONT of tiers 3 to 5 at d +13.2 carries a bracket too (`late`: three more, 193 in all). The house's light lays a pool
    // at every pier of a front, and its twin at d -13.2 has its bracket (it owns a bay's end): this one stood lit like its neighbours, gold from base to capital, with
    // no candle on it. They come last here and their flames last in flames(), so that nothing else in the house changes. `bay` is not a bay of the house for them:
    // { tier, rear, arc58, closing: true }.
    if (!p.bay && p.end !== 'rear corner') continue;
    if (!p.bay) p = { ...p, bay: { tier: p.tier, rear: true, closing: true, i: -1, arc58: ARC_58 - ARC_REAR + (frontAt(ARC_REAR).d - (Math.abs(p.d) - BAY / 2)) }, late: true };      // (arc58 as its twin's bay has it: the two catch together)
    const Bk = HORSESHOE.broken, knocked = !p.rear && p.tier === Bk.tier && p.side === Bk.side && (p.bay.i === Bk.i || p.bay.i === Bk.i + 1);      // (second look) the two brackets of the bay the limb broke: knocked well askew
    const r1 = rnd(), r2 = rnd(), r3 = rnd(), roll = knocked ? (p.bay.i === Bk.i ? -0.2 : 0.42) : r1 < G.offTrue ? (r2 < 0.5 ? -1 : 1) * (0.05 + 0.08 * r3) : 0;      // 3 to 7.5 degrees
    const L = [0.085 + 0.03 * rnd(), 0.125 + 0.04 * rnd(), 0.175 + 0.045 * rnd()], lengths = orders[Math.floor(rnd() * 6)].map((k) => L[k]);
    // (fifth look) the first pier of each side run stands inside the corner pier beside the arch wall: its girandole is fixed on that pier's own room face, on its
    // rail (HORSESHOE.corner: the five of a side stand in one upright line), no longer 0.12 m out from the buried front
    const K = HORSESHOE.corner, onCorner = !p.rear && p.bay.i === 0, back = G.fixing[2] - (K.face + 0.055);
    const gs = onCorner ? K.B[0] - K.dir[0] * K.bracket - K.n[0] * back : p.s, gd = onCorner ? p.side * (K.B[1] - K.dir[1] * K.bracket - K.n[1] * back) : p.d;
    const gt = onCorner ? Math.atan2(p.side * K.n[1], -K.n[0]) : p.turn;
    const cs = Math.cos(roll), sn = Math.sin(roll), cf = Math.cos(gt), sf = Math.sin(gt), floor = PLAN.tiers[p.tier].floor;
    const wicks = G.sockets.map(([x, y, z], k) => {
      const dx = x - G.fixing[0], dy = y + lengths[k] + G.wick - G.fixing[1];
      const lx = G.fixing[0] + dx * cs - dy * sn, ly = G.fixing[1] + dx * sn + dy * cs;
      return { s: gs + lx * sf - z * cf, d: gd + lx * cf + z * sf, y: floor + ly };
    });
    out.push({ tier: p.tier, s: gs, d: gd, turn: gt, roll, lengths, wicks, t: kindleTime('tier', p.bay.tier, p.bay.arc58), bay: p.bay, corner: onCorner, late: !!p.late });
  }
  return (_girandoles = out);
}
/**
 * The ten lustres: [{ pair (0..4 from the rear), side, group (1..10: which swinging thing it is), s, d, y, turn (the tier-3 pier its
 * bracket is fixed to: the lustre's model is in that pier's axes), hook: { s, d, y } (what it swings about), centre: { s, d, y }
 * (the middle of its ring of candles), wicks: [{ s, d, y } x 12] }]. The page puts them at s 40, 50, 60, 70, 80, 2.2 m inside the box
 * line, on 2.1 m chains; nothing of the house is there to hold a chain, so each hangs from a bracket on a pier of tier 3 (every third
 * pier: s 38.9, 48.7, 58.6, 68.5, 78.1), still 2.2 m inside the box line and with its middle 7.7 m above the water.
 */
let _lustres = null;
export function lustresAt() {
  if (_lustres) return _lustres;
  const Lz = HORSESHOE.lustre, out = [], floor = PLAN.tiers[Lz.tier].floor;
  Lz.bays.forEach((i, pair) => { for (const sign of [-1, 1]) {
    const p = sideFront(Lz.tier, sign, ARC_BAY0 + i * BAY), cf = Math.cos(p.turn), sf = Math.sin(p.turn);
    const to = ([x, y, z]) => ({ s: p.s + x * sf - z * cf, d: p.d + x * cf + z * sf, y: floor + y });      // the pier's axes (x along the front, y up, z into the room)
    const wicks = Lz.candles.map((len, k) => { const a = k / 12 * Math.PI * 2; return to([Lz.hook[0] + Math.cos(a) * Lz.ring, Lz.pan + len + Lz.wick, Lz.hook[2] - Math.sin(a) * Lz.ring]); });
    out.push({ pair, side: sign, group: out.length + 1, s: p.s, d: p.d, y: floor, turn: p.turn, hook: to(Lz.hook), centre: to([Lz.hook[0], Lz.pan, Lz.hook[2]]), wicks });
  } });
  return (_lustres = out);
}
// The lustre as modelled (source-art/models/theatre/lustre.py prints these), in the axes of the tier-3 pier its bracket is fixed to
// (x along the front, y up from that tier's floor line, z into the room): the hook it swings about, the ring its candles stand on,
// the height of their pans' tops, each candle's length, the wick above the wax; and where the bead skirt hangs from.
HORSESHOE.lustre = { tier: 3, bays: [3, 6, 9, 12, 15], hook: [0, 0.74, 2.95], ring: 0.6, pan: -1.93, candles: [0.13, 0.09, 0.15, 0.11, 0.16, 0.10, 0.14, 0.08, 0.15, 0.12, 0.10, 0.16], wick: 0.014,
  armEnd: -1.995, bowl: [0.2, -2.17], foot: -2.78, canopy: [0.09, -1.41],      // (second look: a larger bowl, a long pendant; the canopy the bead strings hang from)
  drop: -2.08, bag: [0.05, -2.655] };      // (fourth look: the foot of the turned drop under every pan; where the bag of beads closes on the pendant: radius, height)
// The 20 rear bays' boxes stand in the thickness of the arch wall. While that wall is a solid stand-in (or if its model is solid there)
// nothing of them can be seen and the fronts are ledges on a lit wall: 'auto' closes each rear box with a plain dark panel on the wall's
// face for as long as the stand-in 'royal_wall' stands; true keeps the panels whatever stands there; false never draws them.
HORSESHOE.rearBlind = 'auto';
HORSESHOE.nearTiers = 1;                                    // tiers 1..nearTiers wear the near versions of bay, pier and girandole (the reduction ladder's first rung: 1)
// (stage 6, 5-critique.md: taken. It was 2. At the fall the picture alone drew 2.2 million triangles; tier 2 in its far versions gives back 145,000 of them, and seven
// metres overhead the two cannot be told apart: .shots/theatre_crit_tier2_pair.jpg. &neartiers=2 shows it as it was.)
HORSESHOE.broken = { tier: 4, side: -1, i: 6 };            // the bay the great limb has grown into (s 48.7 to 52 on the left): it wears tier_bay_broken.glb
// (fifth look) THE CORNERS BESIDE THE ARCH WALL. The set's plain slab there (set.js 'rear corners': a beam 1.5 m wide from (frontAt(0).s - 1, frontAt(0).d + 0.55) to
// (frontAt(bay0 + 0.2).s, .d + 0.75), where the side fronts run in) is dressed by kit_tiers.js as a panelled pier. Its numbers for the right side (the left is its mirror
// in d): B, the corner where its room face meets its end face, as [s, d]; dir, the way the room face runs toward B; n, the way the room face looks; face, how far
// the dress stands proud of the slab; bracket, how far from B along the room face the pier's five girandoles are fixed (one to a tier, on its rail).
// THE SAME FORMULA AS set.js: if the slab moves there, move it here.
HORSESHOE.corner = (() => {
  const a0 = frontAt(0), a1 = frontAt(ARC_BAY0 + 0.2), p0 = [a0.s - 1.0, a0.d + 0.55], p1 = [a1.s, a1.d + 0.75];
  const L = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]), dir = [(p1[0] - p0[0]) / L, (p1[1] - p0[1]) / L], n = [dir[1], -dir[0]];
  return { B: [p1[0] + n[0] * 0.75, p1[1] + n[1] * 0.75], dir, n, thick: 1.5, face: 0.03, bracket: 0.64, panel: [0.22, 1.06] };      // (bracket: 0.64 is where the house's light lays tier 1's pool on this face: light.js works its pools out from the buried first pier; panel: the room face's panel, metres from B)
})();
PLAN.standIn.flames = false;                                // the candle flames are real now (kit_multitudes.js makeFlames, called from kit_tiers.js)
PLAN.horseshoe = HORSESHOE; PLAN.bayDesign = bayDesign; PLAN.sideFront = sideFront; PLAN.piers = piers; PLAN.girandoles = girandoles; PLAN.lustresAt = lustresAt;

// ------------------------------------------------------------------------------------------------ the stage and the pit: hero pieces
// (heroes_stage.js; docs/build/theatre/2-heroes-stage.md.) Numbers the page does not give and that module needs. The ten wing
// flats' own layout is in source-art/models/theatre/wing_flats.py (one file holds all ten, set out from the page's numbers).
// heroes_stage.js sets PLAN.standIn.cloths = false when its own cloths hang, so that kit.js leaves its stand-in cloths out.
PLAN.stageRig = {
  // painted scenery as the ride loads it (source-art/theatre/scenery_pack.py cuts it from the three generated paintings)
  art: { backcloth: ['art/theatre/backcloth_l.webp', 'art/theatre/backcloth_r.webp'], border: 'art/theatre/border.webp', fly: 'art/theatre/flycloths.webp',
    clouds: 'art/theatre/clouds.webp', wings: 'art/theatre/wings_atlas.webp', cells: 'assets/art/theatre/scenery.json' },
  border: { cellWidth: 13, cellHeight: 4.336 },            // one half of the border strip, in metres of the backcloth it was cut from
  fly: { top: 12.4, thirdTop: 10.2, thirdTilt: 0.26, shade: [0.5, 0.25, 0.1], travel: 3, lantern: 1.25, second: 0.3, nightSecond: 2.4, nightFirst: 1.6, nightLast: 4.5, last: 0.16, rake: [2.2, 0, 1, 0.3], hang: 2.1,
    head: { gone: [0.42, 0.5, 0.6], maxGap: 3.5, sag: 0.03, belly: 0.5, edge: 0.3 }, folded: [0.3, 0.14] },      // (seventh holder) head: the ties that have rotted through along each batten (heroes_stage.js headOf); folded: how far the panels between a cloth's old creases still lean, down and across (SC_ALBEDO)
    //      // (fourth holder: lantern is now the share of the bow lantern laid on the paint's own colour, 1: the engine's whole; it was 1.9 of it less 0.9 taken off again; last: the third cloth's share of that; rake: heroes_stage.js scenery())      // hang: how deep old cloth bags and pleats as it hangs (1: the backcloth's; these three have hung slack for years)      // lantern: how much of the bow lantern the old cloths take (1 is the engine's; they are seen by it alone)      // the first two cloths travel 3 m on their lines; the third hangs by one corner
  // the stage moon: it begins to rise at show clock 20 and takes 80 s (the page); its light on the stage's scenery reaches 34 m (heroes_stage.js, "stage moonlight")
  moon: { from: 20, takes: 80, reach: 34, light: 0.9, fill: 0.14, color: '#C4D6D0', face: 1.6 },      // face: how brightly its parchment glows (times its own paint; the page's 2.5 burns a pale disc out)
  // the cloud cars: their travellers run on tracks at 20.5 m; the page's cycle [down, held, up, out of sight]. A keeps the show clock from c 20;
  // B and C the realm's own, out of step. B stands at s 102.5, not the page's 104.5: there its back would stand in the flat at s 105.
  cars: { track: 20.5, cycle: [18, 10, 18, 14], timber: '#a4a6a8', lantern: 0.5, A: { clock: 'show', from: 20 }, B: { clock: 'realm', phase: 23, s: 102.5 }, C: { clock: 'realm', phase: 47, mirror: true } },
  glow: 0.05,                                               // the kindled house as it shows through canvas seen from behind (times candle gold, times the share of flames burning)
  night: { color: '#9fb4d0', through: 0.4 },                // (third holder: was '#5a6f92' at 0.09; heroes_stage.js SC_LIGHT says how it falls now)
  rollers: { lantern: 0.7, hue: 0.65, waterLight: 0.3, lamp: 0.6, lampGrey: 0.55 },
  backcloth: { lights: [0.62, 0.85], moon: 1.7, rake: [3, 1, 1, 0.3], side: [-6.5, 2, 0.3], hang: 1.5, folded: [0.5, 0.24], night: 0.6 },      // (fourth holder: lights[0] is now the lantern laid on the paint's own colour, in the house's pool; rake and side: heroes_stage.js scenery())            // the backcloth: the share it takes of the bow lantern and of the kept lamp; how much more of the stage moon than other scenery (the page: amber on its right from the lamp, pearl on its left from the moon)
  flats: { canvas: '#6c6553', back: [0.6, 0.5], timber: '#a9a79f' },      // back: (seventh holder) how much the painting shows through a raw back as a ghost of itself; the share of the paper moon's light taken off it                             // the raw backs of the wing flats (was '#8f866f': from the stage they were the palest shapes in the frame round the lit house)
  // the pin rails as they are modelled (source-art/models/theatre/fly_kit.py: keep the two the same). Their rope is made in the ride (heroes_stage.js railRope):
  // where each stands (four in the fly tower's water at s, d; two on the stage's galleries), the rail's top above the model's zero, its fourteen pins (the first's place along the
  // rail, their pitch, the two that stand bare), and where a pin's line passes behind the rail on its way down (metres behind the rail's middle, above its top: LINE_BACK, LINE_UP)
  rail: { s: [130, 150], d: 11.75, height: 0.95, dry: { s: 103, height: 1.0 }, pins: 14, first: -2.6, pitch: 0.4, bare: [3, 10], lineBack: 0.112, lineUp: -0.06 },
  // laid rope (heroes_stage.js "laid rope"; fourth holder): lay = [strands, a strand's pitch along the rope in rope diameters, how round it is shaded 0..1, its tone where the lay can no longer be seen];
  // last: the last rope's radius (a hawser: the fly tower's hanging ropes are 25 mm thick)
  rope: { lay: [3, 1.1, 1, 0.86], last: 0.021, up: [13, 24, 0.85],      // up: (seventh holder) a load line's light falls away between these two heights, by this much
    // (seventh holder) rope over the channel, between the cloths (s 128, 139, 150), its ends over the rider's head: [s, d, the height of its end, how it ends, its radius, which tint]
    over: [[122.7, -2.3, 3.0, 'knot', 0.0135, 0], [124.3, 3.2, 3.7, 'whip', 0.0125, 2], [125.6, -4.7, 2.8, 'eye', 0.0125, 4], [131.1, 1.8, 3.1, 'knot', 0.015, 1], [132.6, -3.5, 4.2, 'whip', 0.0125, 3],
      [134.5, 4.9, 2.9, 'knot', 0.0125, 5], [136.3, -1.5, 3.8, 'eye', 0.0135, 0], [142.4, 2.5, 3.0, 'knot', 0.0125, 2], [143.9, -4.3, 3.6, 'whip', 0.015, 4], [146.2, 5.4, 2.8, 'eye', 0.0125, 1],
      [153.6, -2.9, 3.3, 'knot', 0.0135, 3], [156.1, 3.7, 2.9, 'whip', 0.0125, 5]] },
  // (fifth holder) the fly tower by lantern light: what this module hangs and stands beyond the backcloth takes the bow lantern as a flame's light in a dark room:
  // `gain` of its strength at the flame, falling to a third of that every `reach` metres, coming in between the two s of `from` (the area's light gives the lantern
  // the house's short reach until s 150: heroes_stage.js towerExt)
  tower: { reach: 10, gain: 1.2, from: [119.5, 123] },
  // (seventh holder) two tackles hanging over the water in the fly tower (heroes_stage.js, "two tackles"; the block is source-art/models/theatre/tackle.py: keep hook, sheave
  // and lead the same as its HOOK_Z, SH_Z and SH_R). at: [s, d, the height of the lower hook's bowl, the distance between the two sheaves, the height the fall ends at, phase];
  // swing: radians either way from the grid; twist: radians the lower block turns either way
  bagsOver: [[124.9, 1.3, 2.95, 15, 0.9], [137.0, 2.4, 3.25, 19, 2.7], [154.9, 1.4, 2.85, 13, 4.4]],      // (seventh holder) three sandbags on spare lines over the channel: [s, d, the height of its middle, seconds for a turn there and back, phase]
  tackle: { hook: 0.51, sheave: 0.2, lead: 0.085, tint: '#8c8680', swing: 0.006, twist: 0.3, at: [[133.4, -2.2, 3.25, 3.1, 2.75, 0.4], [144.6, 3.1, 3.7, 2.4, 3.3, 2.1]] },
  // (fifth holder) sink: how a thing of the pit goes down into the water: [its paint just under the surface, per metre of depth, its light just under, per metre]; standSink: the
  // music stands', whose whole desk is in the first hand's breadth under the surface (heroes_stage.js PIT_PARS)
  pit: { color: '#FFBC70', candles: 0.75, house: 0.9, lantern: 0.5, edge: ['#C4D6D0', '#FFD9A0', 0.22], sink: [0.3, 3.2, 0.55, 3.6], standSink: [0.75, 0.6, 0.85, 2.6], standGain: 1.8, rostrumSink: [0.8, 0.5, 0.9, 1.2] },      // standGain: how much more of the pit's candlelight a stand's polished strap gives back than the carved things do   // the pit's instruments: the stage boxes' candle branches on them once they burn, and how much more of the bow lantern polished metal gives back (second holder)               // the night at the fly tower's open end, as it comes through the old cloths hung across it (second holder)
};

// ================================================================================================ stage 2, the place, its light and its water
// (docs/build/theatre/2-light.md; set.js and light.js use these.) PLAN.light above is the page's table, kept as it was written:
// `&light=1` shows the area in it with the first version of the house's light. PLAN.light2 IS THE LIGHT THE AREA WEARS.
// The page's table gave a room that was one yellow-gold over black (the measurements against the key painting are in the log);
// this one is built round the room's dark as a colour. What changed from the page, and why:
//   grade     toe 1 in every state (dark colours shown as typed); contrast 1.0 (1.04 took 0.02 off every dark and sent the house dark to black)
//             saturation 1.10 and 1.16: with the veil of the bloom gone the picture measured greyer than the key painting (0.31 against 0.36)
//   bloom     B: 0.14, 0.30, 0.90 (the page: 0.72, 0.80, 0.76). 890 flames through a wide bloom laid a yellow veil over every green in the room
//   fog       a tone lighter than the darkest darks and 0.008, so that far things take the air's colour instead of sinking, and the lamp's amber
//             under the curtain still reads from the arches
//   lantern   B 2.0 (and 0.55 of that on the stage, set.js); C's reaches 18 m (the page's 7 left the fly tower's walls black)
//   house     the area's own light values, blended between states like every other number (light.js says what each does)
PLAN.light2 = {
  A: { background: '#07110E', fog: { color: '#132A25', density: 0.008 }, exposure: 1.08, bloom: { strength: 0.40, radius: 0.70, threshold: 0.80 },
    light: { key: [0.07, -0.98, 0.20], keyColor: '#CFE0DA', gain: 0.45, shadow: '#12302A', lit: '#E9F3EE', sky: '#16302A', ground: '#0D1F1A', lanternRadius: 7, heightFog: 0.07, heightFogOver: 4 },
    grade: { tint: '#EEF6F1', saturation: 1.10, contrast: 1.0, lift: '#050C0A', vignette: 0.34, grain: 0.035, toe: 1 }, paint: 0.70, paintRadius: 4.2, lantern: 2.4 },
  B: { background: '#0A130E', fog: { color: '#18302B', density: 0.008 }, exposure: 1.0, bloom: { strength: 0.14, radius: 0.30, threshold: 0.90 },
    light: { gain: 0.40, shadow: '#16332A', lit: '#FFF0CF', sky: '#243A2E', ground: '#1A2A20', heightFog: 0.08 },
    grade: { tint: '#F2FAF8', saturation: 1.16, contrast: 1.0, lift: '#070E0A', vignette: 0.30, toe: 1 }, lantern: 2.0 },
  C: { background: '#05060C', fog: { color: '#0F0C14', density: 0.016 }, exposure: 1.0, bloom: { strength: 0.45, radius: 0.70, threshold: 0.82 },
    light: { gain: 0, shadow: '#161224', lit: '#D8DCE6', sky: '#0F0E16', ground: '#08080D', lanternRadius: 18, heightFog: 0.20, heightFogOver: 3 },
    grade: { tint: '#E8ECF6', saturation: 0.95, contrast: 1.0, lift: '#05050A', vignette: 0.42, toe: 1 }, paint: 0.75, paintRadius: 4.5, lantern: 2.6 },
  // the house's own light. level: the share of the realm's general light let in;  dark: the room's dark (what an unlit surface is), with
  // darkness, recess, top, form;  shaft: the moon's shaft as light in the air;  moon: moonlight on things, with grey, falloff, scatter (the lit
  // rain as a column of light that reaches the whole house) and gleam (the wet edge);  candle, candleGain, pool, wrap, glint: the pool round
  // each bracket;  lamps: the share taken of other people's ctx.light lights in the house;  bounce, fill: the kindled room's warm bounce;
  // stage: a pearl wash on the stage from c 19 (heroes_stage.js has the stage moon's own light: this is only a breath on what does not wear it);
  // lampMore: how much more the kept lamp counts on the stage;  lanternPool: how far the bow lantern's light is drawn in to a pool (1: whole at
  // arm's length, a third by 3.5 m; 0: the engine's seven metres of near-full light);  cloud: the sky through the tear;  wake, wakeBase: water-light
  house: {
    A: { level: 0.012, dark: '#0D2622', darkness: 1, recess: 0.42, top: 0.6, form: 0.22, shaft: 0.34, moon: 1.0, grey: 0.8, falloff: 1.8, scatter: 0.13, gleam: 4.2,
      candle: '#FFBC70', candleGain: 15.0, pool: 1.2, wrap: 0.7, glint: 0.85, lamps: 1, bounce: '#C8B48A', fill: 0, stage: 0.12, lampMore: 1.0, lanternPool: 0.7, cloud: 1, wake: '#CFE3DC', wakeBase: 0.2 },
    B: { level: 0.02, dark: '#0D383A', top: 0.8, shaft: 0.26, moon: 0.9, scatter: 0.08, gleam: 1.2, lamps: 0.6, fill: 0.012, lampMore: 0.3, lanternPool: 0.8, cloud: 0.9, wake: '#F2DDA6' },
    C: { level: 0.03, dark: '#17111A', top: 1, shaft: 0, moon: 0, scatter: 0, gleam: 0, fill: 0, lampMore: 0, lanternPool: 0.3, cloud: 0.08, wake: '#4a3c33' },
  },
  // the water by state (the realm file has A): kindled, a little livelier, so that the flames stand in it as longer broken columns
  water: { B: { mirror: 0.55, streak: 2.4 }, C: { deep: '#03050A', shallow: '#0C1A1C', waveHeight: 0.2, mirror: 0.3 } },
};

// ------------------------------------------------------------------------------------------------ the kit at the water
// Stage 2, kit and close band at the water (kit_floor.js; docs/build/theatre/2-kit-floor.md). What that module shares with
// the others while the ride runs is shared.kitFloor (the boxes' own spaces, piers, chairs, perches for moths, the draught
// that stirs its cloth, where things lie); these are its numbers, as built.
PLAN.kitFloor = {
  // a parterre box as it is modelled (source-art/models/theatre/parterre.py), in its own axes (x along the front, y up, z into the room)
  box: { floor: -0.45, back: -1.72, wall: 1.585, railTop: 0.25, head: [2.9, 3.2] },
  // each box's design from the rear end of a side: a both curtains tied back, b one let down, c drawn (one box in six), d tied high and low, e tied back tight
  order: { '-1': 'abdceadbecabedacb', '1': 'beacdbacedbaedcab' },
  tide: 0.5, wick: 0.78,                                    // metres above the water: the wet on wood, gilt and plaster; how far cloth has drunk it up
  // (no longer used: the rows the roots have lifted are worked out in kit_floor.js from the seating plan and the mound's own ground, shared.tree.moundHeight.
  // These were the first version's, set by hand on the stand-in mound: [s of the row, its first place's d, places, metres sunk in the rubble])
  heaved: [[52.5, -10.75, 6, 0.3], [53.4, -5.85, 3, 0.4], [63.7, -10.25, 5, 0.34], [56.4, -3.3, 2, 0.42], [57.45, -3.1, 2, 0.3], [58.5, -3.35, 2, 0.46], [59.3, -3.0, 2, 0.36], [58.6, -15.25, 2, 0.4], [59.5, -15.4, 2, 0.3]],
  // the fallen sky as it lies: [s, d, which piece]. The page's six places (two moved a hand's breadth so that each rests on seat backs),
  // and a seventh leaning on the rail of a drawn box: the right side, bay 7
  fallenSky: [[48, -3, 'a'], [52, 1.9, 'd'], [55, -17, 'e'], [63, -1.1, 'c'], [66, -14, 'b'], [69, -5, 'f']],
  // one more leans on the front of a box of the wet side, a low wide ramp of painted sky: [side, bay, piece, tint]
  // (dome_fragment_g is modelled where it stands in a box's own space, source-art/models/theatre/dome_fragment.py; kit_floor.js sets
  // that box's two chairs for it. Two upright slabs leaned on the rails in the second version, one on each side; nothing fell on the right of the house)
  leaning: [[-1, 10, 'g', '#f6f8f4']],
  art: { dome: 'art/theatre/dome.webp', swatches: ['gilt_gold', 'gilt_velvet', 'gilt_damask', 'gilt_boards'] },      // the page's picture 3 (generated for the fallen pieces and the dome); picture 4's four tiles
};

// ================================================================================================ stage 2, the place, its light and its water: SECOND ROUND
// (docs/build/theatre/2-light.md, "The second round". Added to PLAN.light2 here, key by key, so that the first round's table above stays as it was
// read. light.js reads these through set.js; light_next.js, with &next=1, is the same file as it is being worked on.)
//   warm, warmLamps   how far candlelight (and the lustres', the fire's, the bow lantern's) takes the green out of what it lights: amber on
//                     bottle green multiplies out to a sour yellow-green, and the pools and their reflections were lemon. 0: as it was
//   candleCap         a pool's core cannot pass 1 / this in the picture's light: an amber that burns out goes lemon on its way to white
//   poolOver          how fast a pool of candlelight takes the place of the room's dark under it (amber laid over petrol goes olive). 0: laid over, as it was
//   glow              the strength of the glow in the air round every bracket (air.js; what the glows and the flames count for in the water is there too)
//   cove, coveReach   the top tier's candles on the cove above them: the strength of the wash, and how many metres it takes to die upward
//   end               the night at the fly tower's open end, on whatever looks toward it (from s 130, growing to the end)
//   web, wakeGain     water-light on the walls: meshes of the web to a metre, and its strength
//   shaftWarm         how far the shaft's light in the air (and the mist at its foot) goes from pearl toward a warm pearl: 0 before the hour; kindled, the
//                     lit rain takes the candles' light as well as the moon's (the key painting's shaft is cream, hue 34 to 42, not grey-green)
Object.assign(PLAN.light2.house.A, { warm: 0.85, warmLamps: 0.6, candleCap: 0.7, poolOver: 4, glow: 1, cove: 0.14, coveReach: 2.6, end: 0.5, web: 0.5, wakeGain: 0.95, shaftWarm: 0 });
// The second round's own values for what the table above already has (`&round=1` shows the first round's, for comparison):
//   candle            the colour of candlelight ON THINGS: a deeper amber than the flame (the flame is the kit's candle gold). The picture's own
//                     curve lifts the weaker channels of a bright colour, so an amber typed #FFBC70 came out hue 43 (gold going lemon); typed
//                     #FF9A46 and held under the cap it comes out hue 33 to 34 (the key painting's lights: 31)
//   B grade           tint all but neutral (the cool tint was there to fight the olive, which is gone at its source), and a petrol LIFT: the darks
//                     of the kindled room are a blue-green, so that amber beside them is amber and not a neighbour of it (key painting: darks hue 172 to 184)
//   B water           the mirror no longer tinted green nor made richer (that turned gold columns lemon); a little less dark
//   A grade           the same petrol lift, a breath of it (#08161C): before the kindling the darks were a neutral grey-green
//   A lampMore        2.5 (it was 1): the kept lamp's pool on the painted orchard, seen under the curtain's hem from the arches, is the one warm thing
//                     in the house before the hour, and at 80 m it was a smudge
//   mist              the lit mist round the mound, a quarter less: from the arches it was a white bar across the picture
//   B shaft, shaftWarm, exposure, pool   see the notes on the lines below
PLAN.light2.round2 = {
  house: { A: { candle: '#FF9A46', candleGain: 9, pool: 1.4, lampMore: 2.5, mist: 0.72 }, B: { shaft: 0.17, mist: 0.5, shaftWarm: 0.35 } },      // (B: the shaft in the air at 0.17, it was 0.26: kindled, the far tiers must glow THROUGH the rain, as in the key painting; the pearl is in the rain, on the trunk and on the disc)
  A: { grade: { tint: '#EEF6F1', saturation: 1.10, contrast: 1.0, lift: '#08161C', vignette: 0.34, grain: 0.035, toe: 1 } },
  B: { exposure: 1.06, grade: { tint: '#FFFDF6', saturation: 1.16, contrast: 1.0, lift: '#0A1A22', vignette: 0.30, toe: 1 } },      // (exposure 1.06 and pool 1.4 m: the middle of the range measured darker than the key painting's, median 0.26 against 0.32)
  water: { B: { mirror: 0.55, streak: 2.4, reflectionTint: '#FFFFFF', mirrorSaturate: 0.1, mirrorDarken: 0.15 } },
};
if (!(typeof location !== 'undefined' && new URLSearchParams(location.search).get('round') === '1')) {
  Object.assign(PLAN.light2.house.A, PLAN.light2.round2.house.A);
  Object.assign(PLAN.light2.house.B, PLAN.light2.round2.house.B);
  PLAN.light2.A.grade = PLAN.light2.round2.A.grade;
  PLAN.light2.B.grade = PLAN.light2.round2.B.grade;
  PLAN.light2.B.exposure = PLAN.light2.round2.B.exposure;
  PLAN.light2.water.B = PLAN.light2.round2.water.B;
}


// ================================================================================================ the cast: presences
// Stage 3, the cast, group "Presences" (cast_presences.js; docs/build/theatre/3-cast-presences.md): the sitters in the boxes, the
// company on the stage, the fall. The sitters' places are sitters() above; these are the numbers the page gives in its text, the
// director's decisions, and what had to move.
//   leaves        how many leaves a sitter has, by tier (the director: about 150 on the two nearest tiers, 60 to 90 above); `low` is the
//                 share kept at low quality (the page's ladder: "sitters to 30 leaves")
//   behind, show  a sitter's axis stands 0.3 m behind its tier's line and shows 1.1 to 1.6 m above the rail (its foot hangs 0.4 m under the rail top).
//                 (The director: 0.9 to 1.6 m. From the water the rail hides the lowest 0.2 to 0.5 m of whatever stands behind it, and a sitter
//                 that showed 0.9 m read as a heap on the rail, not as something upright: the short end is 1.1 m.)
//   R, turn       the spindle's radius (the page: 0.32 m), seconds for one turn; breath: metres and seconds
//   shape         the outline R sin(pi u^k): k (the page: 0.8, which puts the belly 42 % of the way up, level with the rail that hides it; 1.25 puts
//                 it at 57 %, clear of the rail), and how wide the ragged open top stays (a share of R)
//   over          the share of a sitter that pours over the front in the fall (the rest sinks behind the rail; 7 % of each is its handful and
//                 never goes over): about 12,000 leaves leave the fronts in all, 8,000 to 9,000 of them in the air at once (the page: about
//                 9,000; the director: no more than about 12,000). A third of it with reduced motion
//   release       the fall on the show clock: tier 5 lets go at `at`, each tier below `gap` seconds later; every sitter takes `spread` seconds to come apart
//   gather        after the fall: `count` boxes gather a sitter again between show clock `from` and `from + over`
//   company       the seven figures of eight: [s, d, half-length along s, half-length along d, seconds a turn]. The page's centres are
//                 PLAN.company and its half-lengths are in its text; as the page has them five pairs of figures cross or touch (two presences
//                 would stand in one another), and the kept lamp now stands at d 2.4, not d 6, in the middle of two of them. These are the
//                 page's figures moved and sized so that no two paths come within 1.85 m of each other and none within 6 m of the lamp
//                 (worked out by search; the log has the table). speed: metres a second each glides at, wandering between the two (the page:
//                 0.4 to 0.8; the page's seconds round each figure follow from that and are no longer set: 32 to 43 s);
//                 keep: every path is clipped `lamp` metres from the kept lamp, to |d| <= `d` and to s within `s`
//   (fourth holder)  tone: how far a sitter's copper is taken toward a warm brown of its own value, before the hour and kindled (in the moon's dark the
//                 drifts on the rails came off the picture's curve as rose petals);  stage: the share of the leaves with a long way to fall that the
//                 draught carries through the arch onto the stage water;  keep.lamp 7.8 (it was 7.4: the clip is soft, figure 7 came to 7.19 m, and what
//                 rides outside a whirl reaches 1.4 m from its axis: the page's six metres are for all of it)
//   (fifth holder)   ride: the share of a box's leaves that ride in its whirl, at high, medium and low quality (the others lie on the floor of the box,
//                 out of sight, until the fall: a hundred leaves drawn 2.4 times life in one whirl were a solid ball of leaves, a posy on the rail);
//                 rideHigh: so much more of it by tier (tiers 3 to 5 have fewer leaves and are seen from across the house);
//                 belly: how much a leaf lingers at mid-height as it climbs (0.105 put five times as many there as at the ends: a ball, not a spindle);
//                 R 0.36 with shape[2] 1 (the leaves' middles ride at R; it was 0.32 at 0.85), show from 1.15 (it was 0.95), the open top 0.55 R (0.45);
//                 company.loses 4.2 to 4.8 s (the page: 2.5 to 3): the seconds from the first leaf let go to the last one down. Every leaf has let go
//                 of its place within about three seconds, the top first, as the page has it; but a leaf needs two and a half seconds to come down three
//                 metres as a leaf does (1 to 1.3 m/s), and with all of it over in 2.7 s the tops fell at three metres a second: stones
PLAN.presences = {
  sitters: { leaves: [0, 115, 115, 90, 75, 60], low: 0.4, behind: 0.3, foot: 0.12, show: [1.15, 1.6], R: 0.36, shape: [1.25, 0.55, 1.0], turn: [5, 9], breath: [0.2, 20, 40], over: 0.85,
    twist: [3.4, 5.4], trains: [0.085, 0.5, 0.07, 0.22], tone: [0.35, 0.1], stage: 0.55, ride: [0.62, 0.7, 0.8], rideHigh: [0, 0, 0, 0.08, 0.2, 0.26], belly: 0.03,
    release: { at: 29, gap: 0.8, spread: 2.6 }, gather: { count: 30, from: 46, over: 120 }, handful: { within: 5, rest: 40 } },
  company: { leaves: 380, R: 0.55, shape: [0.86, 0.4, 0.85], tall: [2.6, 3.4], formsAt: 20, forms: 6, loses: [4.2, 4.8], within: 9, past: 12, foot: { ring: [0.12, 0.35], every: 0.25 },
    twist: [6.3, 8.4], trains: [0.07, 0.46, 0.24, 0.0],
    figures: [[96.6, -4.8, 2.5, 3.5, 4.6], [96.8, 3.6, 2.5, 3.0, 5.4], [102.8, -0.8, 1.7, 2.4, 4.0], [106.2, -6.4, 1.5, 2.0, 5.8], [110.9, -7.2, 1.4, 2.1, 4.3], [115.4, -4.9, 1.5, 3.4, 5.1], [103.5, 6.5, 2.3, 2.0, 4.9]], speed: [0.42, 0.78],
    keep: { lamp: 7.8, d: 8.0, s: [94, 117] }, under: { figures: [2, 3], tall: 3.0 } },
};
// The first builder's stand-ins for these rows (kit_multitudes.js makeLeaves, kinds 2 and 3) no longer stand: the sitters and the company
// are real (cast_presences.js). `&presences=0` in the address brings the stand-ins back instead, for comparison.
{ const q = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('presences') : null;
  PLAN.presences.on = q !== '0';
  PLAN.standIn.sitters = PLAN.standIn.company = !PLAN.presences.on; }

// ================================================================================================ the cast: cloth, and the pages
// Stage 3, the Cloth group (cast_cloth.js; docs/build/theatre/3-cast-cloth.md): the house curtain (a festoon on nine lines), its lines
// and counterweights, the pages on the music stands; and the numbers by which that module drives the cloth other modules hang.
PLAN.standIn.curtain = false;                               // the house curtain is real now (cast_cloth.js): kit.js leaves its slab out
PLAN.castCloth = {
  // THE FESTOON hangs in a plane 0.32 m behind the proscenium's stage face (s 90.8; the pelmet's back is at s 90.85), and nothing of it
  // comes further toward the house than `forward` metres from that plane. Its top (17.5) is behind the wall over the arch (crown 16).
  //   lines     nine, 2.9 m apart (d 0, +-2.9 .. +-11.6), with 0.9 m of cloth beyond the outermost;  rings: metres between the rings on a line
  //   lag       seconds each line starts after the first: three groups of three, each group on one counterweight (the page: the right
  //             half 1.2 s behind the left). Line i's travel at the curtain's clock cc is plan.curtainHem(cc - lag[i]) - 3: 11 m between
  //             13 and 27, eased, one catch as the hem passes 6 m
  //   least     its own travel never takes less than this many seconds, however fast the show clock is pushed (the page)
  //   swing, bob   metres the gathered scallops swing toward the stage when the lines stop (twice, dying in 1.5 s; one swing in 2.4 s),
  //             and metres they bob (what shows of the stop from the house)
  //   stir      metres its hem stirs in still air: a slow wave across it, 0.18 Hz; four times that in a gust
  //   tassels   the s at which the 160 tassels hang (kit_tiers.js hangs them at 90.76: there they would stand in the pelmet)
  //   waterLight  how high water-light climbs its foot on still and on lively water (metres)
  //   lit, litGain   the light of the kindled house on its face (times the share of flames burning): the house's candle pools stop at the arch
  //   moon      how much of the moon's column falls, as one broad soft light, on its face (times the house's moon)
  //   (second look, 19:50)  rings 1.5 m apart (it was 0.9): fewer, bigger rolls, which read from the house;  sagBy: metres of travel by which a
  //             scallop is as deep as it will be (the family: the whole travel);  folds: how deep its hanging folds are modelled, how far a
  //             gathered roll turns the light, how dark a crease is, velvet's sheen where it turns from the eye;  key: the way to the one light
  //             that models it (d, up, toward the house);  model: how far (0 flat .. 1);  pelmetShade: the pelmet's shadow on its head
  curtain: { s: 91.12, top: 17.5, width: 25, height: 14.5, lines: 9, gap: 2.9, travel: 11, sag: [0.3, 1.6], rings: 1.5, sagBy: 4, forward: 0.24,
    lag: [0, 0, 0, 0.6, 0.6, 0.6, 1.2, 1.2, 1.2], from: 13, takes: 14, least: 6, swing: 0.3, bob: 0.14, stir: 0.03, tassels: 91.0, waterLight: [6.5, 13],
    lit: '#FFDDB0', litGain: 0.24, moon: 0.09, folds: [0.9, 1.0, 0.7, 0.5], key: [-0.38, 0.38, 0.84], model: 1, pelmetShade: 0.4 },
  // ITS RIGGING (the page: "its counterweights come down the stage-left wall"). Stage left is the house's right (d > 0). Its nine lines run up
  // its back to blocks on a batten at its head, along the batten to its stage-left end, and from there in three groups of three up to head
  // sheaves and down to three counterweights (counterweight.glb, the stage builder's model) that slide on guide wires in front of the first
  // brick pier of that wall, above the fly gallery (y 9.18): each comes down as far as its three lines go up.
  //   s, d      where the three weights hang;  top: a weight's height when the curtain is down (it comes down 11 m, to 10.2);  head: the sheaves
  //   batten, clear   the batten and the lines hang this far behind the cloth's plane: clear of it when a gust moves it 12 cm;  end: the d of the batten's end block
  rig: { s: [91.45, 92.05, 92.65], d: 15.3, top: 21.2, head: 22.3, groups: [[0, 1, 2], [3, 4, 5], [6, 7, 8]], batten: 0.18, clear: 0.16, end: 12.75 },
  // THE PAGES (the page's cast table: 14 parts on the stands, one score on the rostrum; a page lifts and turns every 20 to 50 s; when the
  // wake reaches a stand, a knock, and the page falls back; each harp string draws a pin ring).
  //   part, score   a leaf's width and height (metres): a part is one folded sheet, a leaf lying on the desk and a leaf that turns
  //   color     old card that has stood in the water (the bow lantern makes a paler one the brightest thing in the pit)
  //   every     seconds between one page's turns;  lift, turn: seconds it takes to lift, and to go over (it is half in the water: slow)
  //   wake      how the boat's wake is taken to reach a stand: it travels `speed` m/s from where the boat was and is felt within `reach` metres
  //             (whole at reach[0], gone by reach[1]); a stand is knocked when what reaches it passes `knock` (the walls' own record: lib.js)
  //   lean      the stands the hull can touch lean away from it: clear of it by `clear` metres, never more than `max` radians
  //   harp      each of its fourteen strings draws a ring when the wake reaches it: [strength, radius], `gap` seconds apart (a pin ring of
  //             0.12 to 0.25 does not show on this water; at 0.7 the harp's reflection shivers as the fourteen run across it)
  //   (second look)  color: cream card (it was a drab '#a6a08c');  keep: how it behaves in the room's dark (it keeps its own hue: by the house's
  //             own rule for card it went pale blue);  stir: between two turns the water lifts a leaf's fore edge and lets it fall back, every
  //             [from, to] seconds, by [from, to] radians
  pages: { part: [0.2, 0.3], score: [0.25, 0.33], color: '#dcd6c2', keep: [0.85, 0.85, 0.1, 0], every: [20, 50], lift: 0.9, turn: 2.3, stir: [7, 19, 0.22, 0.6],
    // (second look: a wake trails. `least`: the boat's speed below which it makes none; `late`: seconds each stand is knocked after the wake's front, its own)
    wake: { speed: 6, reach: [6, 20], knock: 0.2, rearm: 0.08, least: 0.25, late: [0.2, 1.8] }, lean: { clear: 0.12, max: 0.7 }, harp: { ring: [0.7, 0.16], gap: 0.08 } },
  // THE FLY CLOTHS' HOOKS (second look): heardFrom: the s from which a fly cloth setting off or stopping is told to the staging (the stage:
  // before it they are behind the painted cloth and sixty metres off);  cornerFrom: the s from which the third cloth's trailing corner rings the water
  fly: { heardFrom: 104, cornerFrom: 126 },
};

// ================================================================================================ the cast: leaves
// Stage 3, the cast, group "Leaves" (cast.js; docs/build/theatre/3-cast-leaves.md): the falling leaves and the floating leaves, on the
// toolkit's falls family (docs/life/falls.md). Counts are for high quality.
//   air        how many are in the air: let go from the crown's masses (they ride the column round the trunk), and from the tiers' rails
//              and the great limb's tufts; `pool`: the family's ring of instances they are all drawn from (every one is let go singly,
//              on a way down that has been checked against the set: see cast.js), with room for the staging's bursts
//   leaf       the falling leaf (the page: 0.9 to 1.3 m/s, half a metre either way at 0.4 to 0.6 Hz, over once in 1.5 to 3 s); shape: the
//              family's beech leaf in nine triangles ('leaf' is the same in thirteen: beside the hull, at life size, the two could not be told apart);
//              spread: how far the ones let go together wander apart (the family: 0.8; less here: the fronts are near)
//   column     the column of turning air round the trunk: one turn in 14 s within 12 m; a quarter are lifted for `lasts` seconds
//              (the family's 1.2 m only checks a leaf's fall; 2.4 m lets it climb for about a second and a half of the 4.5)
//   big        how many times life size a leaf in the air is drawn: beside the hull, across the stalls (22 m), across the house
//              (70 m). The page: 1.5 times beyond 12 m. The presences' leaves (cast_presences.js, uPrSize) are drawn at these sizes
//              because at 1.5 times neither a sitter nor the fall could be seen from the stalls, and the crown's own leaves are five
//              times life: the two groups' leaves fall through one another and must be one size.   low: the same for a leaf afloat
//              (life size beside the hull, a little larger from `low[2]` to `low[3]` metres)
//   mirror     the share of the falling leaves drawn in the water's mirror (the page: 40 per cent)
//   landings   every landing within `within` metres of the boat: a ring (the page: 0.15, 0.4) and the callback for the tick,
//              `perSecond` at most (a quarter of a second's worth may come in one frame: the page's 40 a frame)
//   afloat     rest, full: how many lie on the water before the house lets go and after (the page: 2,600; about 11,000);
//              drift: metres a second toward the stage before the hour and after it;  shuttle: metres a leaf travels before it
//              comes round again out of nothing (the family's way of drifting for ever);  pool, lies, within: how many that have just
//              landed near the boat can lie at once, for how many seconds before one has soaked and gone under, and how near the boat
//              a landing must be to be kept;  rafts: leaves laid by hand against the mound's up-current shore, each music stand, each
//              of the pit's instruments, each wave roller, the backcloth's hem and the box fronts where the house narrows
//   wind       metres a second toward the stage that the air carries falling leaves: before the hour, after it, in the fall (c 29 to 37)
//   crown      leaves the crown lets go at once: the gust's (s 38: the staging's), the fall's (c 29); through: the leaves that come
//              through the painting with the boat (s 120)
//   take, keep the house's light on them (lib.js: [water-light, candle rows, moon, room fill]; [hue kept in the dark, dark, gleam, metal])
//   script     milliseconds a frame, at most, that cast.js spends checking ways down and letting leaves go (what is not let go in
//              one frame is let go in the next, a little further on its way)
PLAN.castLeaves = {
  air: { tree: 1400, tiers: 600, pool: 6000 },
  leaf: { shape: 'leafkite', size: 0.085, speed: [0.9, 1.3], sway: 0.5, swings: [0.4, 0.6], stall: 0.45, rock: 0.3, turns: [0.33, 0.67], spread: 0.3, spreadOver: 3 },
  column: { radius: 12, seconds: 14, share: 0.25, rise: 2.4, lasts: 4.5 },
  big: [1, 2.9, 3.8], low: [1, 1.4, 6, 16], mirror: 0.4,
  landings: { within: 15, perSecond: 160, ring: [0.15, 0.4] },
  afloat: { rest: 2600, full: 11000, drift: [0.03, 0.15], shuttle: 16, pool: 700, lies: 34, within: 9,
    rafts: { shore: 520, stand: 30, instrument: 45, roller: 46, hem: 700, fronts: 300 } },
  wind: { still: 0, hour: 0.15, fall: 0.6, from: 29, to: 37 },
  crown: { gust: 400, fall: 600, through: 60 }, script: 1,
  take: { air: [0, 1, 0.5, 0], afloat: [0, 1, 0.5, 1] }, keep: { air: [0.85, 1, 0.5, 0.12], afloat: [0.7, 1, 0.12, 0.05] },
};
// The first builder's stand-in for these two rows (kit_multitudes.js makeLeaves, kinds 0 and 1) no longer stands: the leaves are real
// (cast.js). `&leaves=0` in the address brings the stand-in back instead, for comparison.
{ const q = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('leaves') : null;
  PLAN.castLeaves.on = q !== '0';
  PLAN.standIn.leaves = !PLAN.castLeaves.on; }
// ---- the cast: leaves, SECOND LOOK (cast.js as it is now; docs/build/theatre/3-cast-leaves.md, "Second look"). Keys that are new or
// that replace one above (the table above is left as the first holder wrote it):
//   column     the column of turning air round the trunk is the module's own now. A leaf goes round at ITS OWN rate: the page's one turn
//              in `seconds` at `core` metres from the axis, and the same pace along a longer way round further out (so fewer turns: at the
//              9 m where the boat passes, one in about 43 s, which is 1.3 m/s; one in 14 s there was 4 m/s, a gale under rain that falls
//              plumb), fading out between 0.75 `radius` and `radius`. `share` of them are lifted on the way: up for `up` seconds (the page:
//              3 to 5), then down over the rest of the fall, never faster than `fast` times their own fall
//   leave      a tier's leaf leaves its rail: it lies `on` metres out on the velvet, at least `pier` metres along from a pier and its
//              bracket, and slips `out` metres further into the room (and what its tier stands back) over `over` seconds as it begins to fall
//   afloat     the leaves on the water are ONE population: each has fallen, drifts at its own `pace` (its share of `drift`), comes to
//              rest against what stands in its way, and at last soaks and goes under. rest, full, drift: as above;  lives: seconds one
//              floats before the house lets go;  after: the same for what the fall brings down;  quiet: the same where nothing falls
//              (the foyer, the stage);  near: within this of the boat every landing stays on the water (within: as far as most do);
//              heap: metres deep the leaves gathered against a thing may lie;  laid: leaves that had gathered before the rider came
//              (they lie still and do not sink)
Object.assign(PLAN.castLeaves.column, { core: 2.9, up: [3, 5], fast: 1.5 });
PLAN.castLeaves.leave = { on: [0.1, 0.26], pier: 0.9, out: [1.15, 2.7], over: [3, 6.5] };
Object.assign(PLAN.castLeaves.afloat, { pace: [0.55, 1.2], lives: [90, 240], after: [240, 900], quiet: [600, 2400], near: 4.5, heap: 1.2,
  laid: { shore: 300, stand: 10, instrument: 20, roller: 14, hem: 260, fronts: 90 } });
// ---- the cast: leaves, SECOND LOOK TAKEN OVER (8 November; the log's last section). Keys that are new or replace one above:
//   afloat     WHICH LEAF FLOATS ON HAS NOTHING TO DO WITH THE RIDER. About a hundred leaves a second come down under the crown; if all that
//              land by the boat stay (as `near` had it) a boat that stops there sits in a disc of leaves of its own within a minute. So:
//              `stays` is the share of ALL landings, anywhere, that float on for minutes (those curled like boats; the share follows how many
//              should lie: `rest`, `full`); the others lie `brief` seconds and go under (in the column the rain presses them under, and
//              what lay on a rail for years was sodden before it fell), sinking `deep` metres, to and fro, as a leaf goes down through
//              water. `sight`: one that goes under within seconds is put down only where the rider could see it do so (all within the
//              first number of metres, none beyond the second). `near`, `within` are no longer read.
//              tip, most, lift: how a floating leaf rides a ring (the family: 5 times the water's slope, 0.24 at most, 5 mm clear: in the
//              rain's rings its low edge went under and was sawn into teeth by the ripples, and it fluttered ten times a second)
//              wet: how a wet leaf lying on the water takes a lamp: [its middle's tone, its curled edge's tone, how hard its lit colour is held in,
//              the share it takes of the kept lamp (a level thing under a low lamp seven metres off)]
//   laid       hem: [in a band against the cloth, in a looser fringe before it]; stand, instrument: against each of the pit's things
PLAN.castLeaves.afloat.laid = { shore: 320, stand: 16, instrument: 30, roller: 24, hem: [420, 170], fronts: 90 };
Object.assign(PLAN.castLeaves.afloat, { stays: 0.1, brief: [1.5, 11], deep: 1.0, sight: [10, 16], tip: 2.6, most: 0.13, lift: 0.004, wet: [0.68, 1.1, 2.2, 0.3] });
// ---- the cast: leaves, THE FOURTH HOLDER (8 November, from 01:20; the log's last section). Keys that are new or replace one above:
//   low        a leaf afloat is drawn the size it was in the air at every distance (big's first knee: life size at 2 m, 2.9 times at
//              22 m): at 1.4 times a leaf that landed far off shrank by almost half, and beyond five metres they were slivers
//   afloat     level: the share of the lit room's light a leaf lying level takes (in the air: 0.22; see cast.js, litOf);
//              rake: far off a leaf afloat is tipped a little toward the eye: [rise to a metre, from how many metres, in full from]
PLAN.castLeaves.low = [1, 2.9, 2, 22];
Object.assign(PLAN.castLeaves.afloat, { level: 0.5, rake: [0.16, 4, 12] });
//   column     inward: below `from` metres the column can draw `share` of the crown's leaves in toward the trunk as they come down, each by
//              `by` of its distance from the axis. SHARE IS 0: it is written (cast.js: the vertex extension and `where` agree) and not
//              used. The tree's heavy wood lets nothing straight down within six metres of the trunk, so the crown's leaves come down
//              in a ring; drawn in under the boughs they would come down on the mound, and there nineteen in twenty ways end in the
//              cell of a root, a seat, a slab or a joist (tried at 0.5: 288 of 5,869 let go, and the air bunched under the three
//              outer masses). It wants a surface of the mound's things to land ON (the log: Asked of the set).
PLAN.castLeaves.column.inward = { share: 0, by: [0.15, 0.55], from: 13 };
//   steps      how many places along leaves' ways cast.js may ask about in one frame (it was a millisecond by the clock, `script`: a
//              busy machine then let other leaves go than a quiet one, and a picture taken twice was not the same picture)
PLAN.castLeaves.steps = 6000;
//   afloat     fall: where the house's fall leaves its leaves on the water (cast.js, fallOn): from: it comes in between these s;
//              band, walls: in full within band[0] metres of the centre line, `walls` of that beyond band[1]; most: how many float on
//              for each leaf of the fall that comes down there; stage, end: with the clock held past the fall, how the fall thins over the stage
PLAN.castLeaves.afloat.fall = { from: [48, 60], band: [9, 19], walls: 0.3, most: 2, stage: [102, 112], end: 0.12 };      // (stage, end: as the fall itself leaves it, counted on a ride left to the current: thick to s 105, a few by the lamp, the hem's heap)


// ================================================================================================ stage 2, the place, its light and its water: SECOND LOOK
// (docs/build/theatre/2-light.md, "Second look": the third holder of the stage, a second pair of eyes. New keys of PLAN.light2.house, added here so that
// the tables above stay as they were read; set.js, light.js and air.js read them. While `&l3=1` is still asked for in the address, what they drive is being
// worked on and nobody else's picture has it; when the switch is gone from set.js they are what the area wears.)
//   thread, threadVeil   the rain in the moon's light (set.js, the shaft): how bright the threads of falling water are, and how much of the plain veil is left
//                        between them. 0 and 1: the veil alone, as it was
//   high, highWarm       THE HIGH ROOM (light.js): the night's own light on the cove, the dome and their ribs (a blue pearl: the moonlit cloud in the tear), and the
//                        share of the lit room's warm bounce (`fill`) that still reaches them. 0 and 1: as it was (a painted sky under amber alone: brown)
//   highGilt             how many times the warm bounce gilt takes above the cornice (the ribs: lines of old gold across the blue)
//   shaftMirror          the share of the shaft's veil that the water's mirror draws (1: all of it, as before the hour; kindled it laid milk over the mirrored tiers)
Object.assign(PLAN.light2.house.A, { thread: 7, threadVeil: 0.45, high: 0, highWarm: 1, highGilt: 1, shaftMirror: 1 });
Object.assign(PLAN.light2.house.B, { high: 0.22, highWarm: 0.2, highGilt: 5, shaftMirror: 0.3 });
// The second look's own values for numbers the tables above already have (they are laid over the second round's; `&round=1` no longer gives these back):
//   B shaft, shaftWarm   0.24 and 0.12 (the second round: 0.17 and 0.35). Kindled, the column was a khaki fog: warmed a third of the way to amber it measured
//                        #787462 where the key painting's shaft is a neutral pearl grey (#88867d), which the eye reads as cool beside the candles. With the light
//                        gathered into threads the far tiers glow through it at 0.24 as they did through the plain veil at 0.17
//   B mist               0.3 (0.5): the lit vapour round the mound, kindled: it lay over the water as milk
//   stage                0.5 (0.12): the pearl wash on the painted orchard from c 19. At 0.12 the open stage was a dim brown picture under the gold arch; the key
//                        painting's stage is the pale, cool half of the kindled house. It falls from the house now (light.js): backs and side walls take none
//   B water              mirror 0.45, streak 3.0 (0.55, 2.4): the candles' columns longer and less broken into blocks (the key painting: long strokes reaching the eye)
Object.assign(PLAN.light2.house.A, { stage: 0.5 });
Object.assign(PLAN.light2.house.B, { shaft: 0.24, shaftWarm: 0.12, mist: 0.3 });
//   A water              (the realm file, theatre.js) mirror 0.86, streak 1.3, waveHeight 0.10 (0.6, 2.2, 0.14): before the hour the water is glass and the dark
//                        house stands in it upside down; B keeps its livelier water, C's streak is given so that the fly tower is as it was
Object.assign(PLAN.light2.water.B, { mirror: 0.45, streak: 3.0, waveHeight: 0.14 });
Object.assign(PLAN.light2.water.C, { streak: 2.2 });


// ================================================================================================ the cast: weather
// Stage 3, the cast, group "Weather" (cast_weather.js; docs/build/theatre/3-cast-weather.md): the rain's streaks, the heavy drops
// under the limbs, the row of drips under the left tier-1 front, the keystones' drops, the steam over the flames that hang in the
// rain, and the one draught that moves the room's air (shared.cast.air). Counts are for high quality.
//   rain       streaks: how many (the page: 6,000);  top, comesIn: the height they fall from and the metres over which they come in
//              out of nothing (the shaft's own top is 38: above it they are seen only through the tear);  length (the page: 0.6 to
//              0.9 m), speed (7 m/s) and how much each one's own pace differs;  near: metres from the eye between which a streak
//              comes up out of nothing (nothing of the rain crosses the lens);  gain: how bright the brightest are (the page: lit
//              only inside the shaft, at 1.3);  veil: how much thinner the rain is between its denser sheets, which sink through the
//              column;  fire: the chandelier's gold on the rain beside it;  kindled: how much of its strength it keeps in the lit house
//   heavy      the drops that gather under the limbs (shared.tree.drips, the chandelier's spare chain, the tear's rim): one lets go
//              somewhere every `every` seconds; size (m), the most it falls at (the page: 9 m/s), seconds it swells where it hangs;
//              ring: what it writes on the water (the page: 0.8, 1.0);  crown: metres across the ring of droplets it throws up
//              (the page: 0.25);  clear: it does not let go while the rider's boat will be within this many metres of where it lands
//   drips      the row under the left tier-1 front (the page: 8 points, s 44 to 70, each every 2.2 to 3.5 s, in a sequence travelling
//              toward the stage at 5 m/s). They hang from the gilt bead of the parterre boxes' heads, where the water that runs down
//              the fronts comes off: `out` metres into the room from the box-front line, `y` above the water; and they land on the
//              velvet rail under it (`land`). boxes: the left parterre boxes that have one (plan.parterreBoxes' i);  along: where on
//              each box's rail, metres from its middle (clear of the ferns that grow there: kit_floor.js);  spray: the droplets it
//              throws off the rail into the water, where its ring is written (the page: 0.5, 0.8)
//   keystones  a drop from each of the three arches' keystones in turn (the page's moment at s 24: left, middle, right, 6 s, repeating)
//   glint      (drips, keystones) the lit column's glint in a drop that falls outside the shaft, as a share of the shaft's own light on
//              one inside it: without it the keystones' drops fell unseen (second holder)
//   planks     rain on the rider's own boat while it is in the column: how many drops a second strike it at the column's heart
//   steam      a thread over each of the 96 flames that hang in the rain: metres long (each 0.7 to 1.3 of it), metres a second it rises,
//              seconds a wick's steaming and its rest take, how bright; width: half its width at its foot and at its top (it widens as
//              it thins);  waver: metres it wanders at its top;  curl: metres from one curl to the next. (Second holder: remade; at life
//              size, a hand's breadth, nothing of it could be seen from the water 14 to 30 m below)
//   air        the column's lean in degrees: from the hour (the page: 4), through the fall (6), on the show clock;  the gust (the page's
//              moment at s 38: the column leans 5 degrees for 4 s and recovers over 6; the shaft dims 30 % for 3 s and returns at 120 %;
//              the crown tosses at three times its sway; lustres and swags swing): [seconds] for each part of it;  speed, front: its
//              wave round the horseshoe (the page: 9 m/s) and how it passes one place [comes in, holds until, gone by];  hang: the share
//              of the column's lean that what hangs on a chain (the lustres) takes
PLAN.castWeather = {
  rain: { streaks: 6000, top: 41, comesIn: 4, length: [0.6, 0.9], speed: 7, paces: 0.08, near: [1.0, 3.6], gain: 0.9, veil: 0.5, fire: 1.1, kindled: 0.8 },
  heavy: { every: 0.3, size: 0.018, speed: 9, swell: 0.7, ring: [0.8, 1.0], crown: 0.25, clear: 2.4, carried: 0.35 },      // (size: the pearl's width. Second look: 0.026 before, and 0.036 before that: see `tail`)
  drips: { boxes: [5, 6, 7, 8, 9, 10, 11, 12], along: [0.45, 0.42, 0.25, 0.65, 0.2, -0.25, 0.55, -0.5], out: 0.108, y: 2.89, land: 0.252, size: 0.016, swell: 0.9,
    every: [2.2, 3.5], speed: 5, ring: [0.5, 0.8], spray: 0.36, glint: 0.7, clear: [0.3, 0.45, 0.24] },      // (clear: metres a drop keeps from a fern, a shawl over the rail, any other thing left on it: cast_weather.js moves each to the nearest clear place, third holder)
  keystones: { every: 6, gap: 2, size: 0.022, swell: 0.8, ring: [0.6, 0.9], glint: 1.3 },      // (glint: 0.4, then 0.65 with a body 32 mm wide. Second look: as a pearl 14 mm wide it is all glint: a drop is a lens, and what it shows in the dark arch is the lit column, small and whole. drips: 0.5, it was 0.22)
  dropLight: 0.27,                                          // how bright a drop is in the light that reaches it (second holder: 0.38 made white darts of them)
  dropCap: 0.24,                                            // the most light one face of a bead gives, whatever reaches it (third holder: without it a drop in the shaft was a white dart as bright as the brightest streak, and its crown white beads; &wxdropcap=)
  // SECOND LOOK (the drops). A falling drop was a body that tapered from its full width to its tip: a white dart; and where it landed, a clutch of
  // white beads sat on the water. tail: seconds of its way that a falling drop's thread is long (0.04: 36 cm at nine metres a second), and a thrown
  // droplet's; how much of its head's light the jet's column keeps.  splash: what water throws up where a drop goes in: how many droplets in the low
  // coronet, how many thrown higher and further; speck: a droplet's radius (m); jet: [seconds after the drop, metres a second it stands up at, its bead's radius]
  tail: [0.04, 0.03, 0.5],
  dropFar: 0.6,                                             // a drop or droplet drawn n times its size (so as never to be under two pixels) is fainter by n to this power (it was 1.4: from eight metres a splash was nothing)
  splash: { coronet: 9, thrown: 6, speck: [0.0016, 0.0026], jet: [0.07, 1.2, 0.0042] },
  // hull: rain on the water round the rider's boat (second look: in the hem the rider was not rained on): within `reach` metres of the boat, `rate` drops
  // to a square metre a second (where the streaks are thickest; they thin as the streaks do) each throw up a speck or three and a jet (`jet` m/s:
  // a thumb high); each beyond the water's own rain zone writes its ring, and inside it (where the water rings itself, as data) one in sixteen (ringShare). planks.rate: 14 (it was 9): what 6,000 streaks at 7 m/s bring down on four square metres of boat
  hull: { rate: 2, reach: 6, jet: 0.85, strength: 1.1, ring: [0.3, 0.3], ringShare: 0.06 },
  planks: { rate: 14, foredeck: 0.3 },                       // (foredeck: the share of strikes that fall on the small deck behind the stem, in the rider's view; third holder)
  // (steam, second look: breath, not hair. It was a line two pixels wide at gain 10 with the painter's mark: one more pale streak among the rain's. Now a
  // finger of vapour that meanders wider as it rises and opens to a hand and a half across; `gain` is its light where it is `ref` metres half-wide (wider, it
  // is as much fainter); warm: its colour by its own flame. Before: length 0.8, gain 10, width [0.006, 0.07], waver 0.07, curl 0.45)
  steam: { length: 0.95, rise: 0.4, every: [2.6, 6], gain: 4, ref: 0.03, width: [0.014, 0.13], waver: 0.1, curl: 1.1, warm: '#FFD9A0' },
  air: { hour: 4, fall: 6, from: 29, to: 37, turn: 3, hang: 0.17,
    gust: { lean: 5, leans: [1.5, 4, 10], dim: 0.7, bright: 1.2, moon: [1, 3, 5, 9], crown: [1.5, 5, 11], swing: 2.2, lustres: [2.5, 5, 13], cloth: [0.3, 5, 6], speed: 9, front: [0.5, 1.5, 4] } },
};
// The first builder's stand-in for the rain's streaks (kit_multitudes.js makeRain) no longer stands: the rain is real (cast_weather.js).
// `&rain=0` in the address brings the stand-in back instead, for comparison.
{ const q = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('rain') : null;
  PLAN.castWeather.on = q !== '0';
  PLAN.standIn.rain = !PLAN.castWeather.on; }


// ================================================================================================ stage 2, the place, its light and its water: SECOND LOOK, CONTINUED
// (docs/build/theatre/2-light.md, "Second look, continued": the fourth holder of the stage. Laid over the tables above, key by key, so that they stay as
// they were read; set.js, light.js and the realm file read them. `&l4=0` in the address shows the area without these numbers, for comparison.)
//   flyFrom, flyTo       where the kindled house's light turns into the fly tower's (the page: s 118 to 150). The boat goes through the backcloth at s 120
//                        and the fly tower's own light was not whole until its far end: for its first twenty metres the bow lantern was still the tight pool
//                        it is in the lit house, and the rope walls ten metres off stood in a grey murk. Now the change is made by s 131
//   C lanternRadius, lanternPool, lantern    the bow lantern in the fly tower, where it is the only light: it reaches the rope walls (22 m, it was 18)
PLAN.light4 = { on: !(typeof location !== 'undefined' && new URLSearchParams(location.search).get('l4') === '0') };
if (PLAN.light4.on) {
  Object.assign(PLAN.light2, { flyFrom: 117, flyTo: 131 });
  Object.assign(PLAN.light2.C.light, { lanternRadius: 22 });
  Object.assign(PLAN.light2.house.C, { lanternPool: 0.45 });
  //   B water              KINDLED, THE WATER IS THE ROOM UPSIDE DOWN IN DARK GLASS. A long streak on lively water (3.0 on 0.45) drew the whole lit house out
  //                        into one veil, and amber over green is olive: from the key painting's place the near water measured hue 76 where the painting has
  //                        152, and from the stage the house lay on the water as a brown sheet. Now the mirror is stiller and its picture less drawn out
  //                        (mirror 0.55, streak 2.2, waveHeight 0.12), so the tiers stand in it as rows; it keeps a much darker copy of everything that is
  //                        not a light (mirrorDarken 0.55, mirrorSaturate 0.3) while the flames keep their own strength and amber (spareLights 1: new in
  //                        the engine since the evening of 7 November) and are given long columns of their own (column 2.9; before, 1.2 came from the streak);
  //                        and the water has a breath of petrol of its own (glow), so that its darks are a colour: the painting's are #18302f
  //   A, C column          the same strength of columns as their mirror and streak gave them (0.07, 1.29), said outright: a `column` left at -1 in one
  //                        state and given in another passes through 0 on the way, and the columns would go out as the house kindles
  //                        (column: 2.9 was right in a still picture; with the world running the living ripples break each column into dashes that
  //                        peak at twice its strength, and under the right tiers they ran together again: 2.4)
  Object.assign(PLAN.light2.water.B, { mirror: 0.55, streak: 2.2, waveHeight: 0.12, column: 2.4, mirrorDarken: 0.55, mirrorSaturate: 0.3, spareLights: 1, glow: '#071B18' });
  Object.assign(PLAN.light2.water.C, { column: 1.29 });
  PLAN.light4.waterA = { column: 0.07 };
  //   A scatter, gleam, falloff    before the hour: the lit rain's light on the house a little stronger and reaching a little further (0.16, 1.6; they were
  //                        0.13, 1.8), the wet gleam along rails and carving 5.2 (4.2): across the house the side views were one grey-green. (Tried further,
  //                        0.2 and 7.5: the tiers by the shaft turn into a lattice of white lines in the first image)
  //   B thread, threadVeil the rain in the shaft's light, kindled: brighter threads (9) with less of the plain veil between them (0.28; before the hour 7 and
  //                        0.45 stand): from the key painting's place the veil lay over the far tiers as milk (their darks 0.36 where the painting holds 0.22)
  Object.assign(PLAN.light2.house.A, { scatter: 0.16, gleam: 5.2, falloff: 1.6 });
  Object.assign(PLAN.light2.house.B, { thread: 9, threadVeil: 0.28 });
}


// ================================================================================================ stage 2, the place, its light and its water: FOURTH LOOK
// (docs/build/theatre/2-light.md, "Fourth look": the sixth holder of the stage, 8 November. Laid over the tables above, key by key, so that they stay as they
// were read; set.js, light.js and the realm file read them. `&l6=0` in the address shows the area without these numbers, for comparison.)
//   C cloud              the rain cloud over the open water beyond the fly tower's end (0.08 before: the night there was a flat navy sheet). It is the same cloud
//                        that stands over the tear; set.js carries it down the sky to the horizon there and takes half its green to slate
//   C end                the night's cold light on what looks toward the open end (0.5 before, as a wash on everything; light.js now rakes it up the tower from s 121)
//   C water sheen        sky-light on leaning water (docs/water.md, "What the areas asked for"): the night on the far water and on every fine crest, so that black water
//                        has a surface; and the bow lantern's light on those crests round the boat (`lamps`): by lantern the water is lit before anything else is
//   A, B water sheen     the same key in every state (a key one state lacks passes through nothing on the way). Before the hour, pearl: `rain` is the far look of
//                        the rain's zone (the tree stands on a pale disc of beaten water from the arches: the first round painted one by hand, which stays for its
//                        rings and glints at half its strength), `rings` shows the living ripples as fine pale arcs near the rain and round the hull (0.25 turned
//                        the glass into a rippled sheet: 0.1), `lamps` is the bow lantern's light on leaning water. Kindled, a little less of each, in a warm grey.
//                        NOT `still` or `glance` in the house: they grey the dark glass, and the glass is the picture there
//   waterline            a hairline of light where the water meets what stands in it (walls, piers, the mound, rails, the hull): the join, said quietly
//   rest                 a boat lying still breathes on the water: a fine ring from the bow and the stern in turn
//   A mist               0.5 (0.72): the lit vapour round the mound. With the disc of beaten water under the tree it can be less of a bar across the first image
PLAN.light6 = { on: !(typeof location !== 'undefined' && new URLSearchParams(location.search).get('l6') === '0') };
if (PLAN.light6.on) {
  Object.assign(PLAN.light2.house.C, { cloud: 0.7, end: 1.5 });
  Object.assign(PLAN.light2.water.C, { sheen: { color: '#1B2946', rings: 0.4, still: 0.3, glance: 0.55, rain: 0, hide: 0, lamps: 0.6 } });      // (a darker blue and more of the lantern: at #26365A and 0.35 the lit water round the boat was mauve, blue and amber in equal parts)
  Object.assign(PLAN.light2.water.C, { waterline: { color: '#5A5068', width: 0.012, gain: 0.3, reach: 30 } });
  Object.assign(PLAN.light2.water.B, { sheen: { color: '#8A9488', rings: 0.08, still: 0, glance: 0, rain: 0.2, hide: 0, lamps: 0.35 }, waterline: { color: '#A89878', width: 0.012, gain: 0.3, reach: 30 } });
  PLAN.light6.waterA = { sheen: { color: '#8FA39E', rings: 0.1, still: 0, glance: 0, rain: 0.3, hide: 0, lamps: 0.5 }, waterline: { color: '#8FA39E', width: 0.012, gain: 0.3, reach: 30 }, rest: 0.4 };
  Object.assign(PLAN.light2.house.A, { mist: 0.5 });
  PLAN.light6.disc = 0.5;                                    // the hand-painted disc of rings (set.js), now that the water itself gives the disc: what is left of it
  PLAN.light6.stageMirror = 2.2;                             // how much more the pearl wash on the stage counts in the water's mirror than above it (set.js: the pale stage in the water; &stagem=1 shows it without)
}

// ------------------------------------------------------------------------------------------------ the rower in this room (stage 5: 5-critique.md)
// The engine's rower takes each area's general light, and this room's general light is seven times what its walls show (the house's own light darkens
// everything built: lib.js). Left alone she stood in the dark house as a figure in daylight, the palest and warmest thing in it. `tone` multiplies her
// colours (as look.boat.tone does the boat's), `own` is how much of her own colour she keeps under the room's, `rim` edges her with the light the room
// has: the moon's pearl before the hour, candle gold when the house burns, next to nothing in the fly tower, where the bow lantern is all there is.
// theatre.js gives A as the look's `rower`; set.js gives B and C to their light states, so she kindles with the house; `follow` has the engine read it
// every frame. Judged over the left shoulder (&yaw=132&pitch=14) at s 40 (dark), s 72 with &c=28 (kindled) and s 140 (the tower).
PLAN.rower = {
  A: { own: 0.3, tone: '#7D8C87', rim: '#CFE3DC', rimStrength: 0.22, rimPower: 3.0, follow: true },
  B: { own: 0.45, tone: '#F2E4C8', rim: '#FFD27A', rimStrength: 0.22, rimPower: 3.0, follow: true },
  C: { own: 0.3, tone: '#8E8996', rim: '#8A86A0', rimStrength: 0.08, rimPower: 3.0, follow: true },
};
