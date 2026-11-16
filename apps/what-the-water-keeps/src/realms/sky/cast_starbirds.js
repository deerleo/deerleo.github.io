// The standing sky: the cast, group "Starbirds" (stage 3; docs/build/sky/3-cast-plan.md, rows 10 to 12).
// Its log: docs/build/sky/3-cast-starbirds.md.
//
// THE GREAT WADER'S LIFE. Its drawing is the monument's (heroes.js: 22 stars, 22 hairlines, the dust in its kite, the
//   ring under each foot) and is not touched. What stood in for the animal there was three held poses melting into each
//   other point by point (bones shortening on the way, a foot sliding five metres). Here it has a SKELETON on the same
//   numbers (plan.monument.wader.poses): a body that keeps its shape (the kite), a neck of twelve bones whose every
//   joint passes from one pose's bend to the next's in its own time, base first (so it is one curve at every moment
//   and unrolls like a fern), two legs whose feet are pinned where they stand and whose ankles fold backward. The
//   pose it computes each frame is handed to heroes.js through shared.wader.poses (heroes.js reads its three poses
//   every frame: all three are now this module's one living pose, so its stars, hairs, dust and rings follow; the
//   three held poses as they were are shared.cast.wader.held). One frame late. Nothing of its ordinary life is quicker
//   than 4 s (in the letting go its run has the plan's own steps of 3 and 2 s).
//     asleep        on one leg, the neck a coil on its shoulders; it leans a third of a degree and back in 16 s
//     wake (16 s)   the folded leg comes down (the foot touches at 8 s: a ring), the body settles between its feet,
//                   the neck stands up and unrolls from its base; a shiver of brightness runs from tail to head
//     stand         a 20 s sway through the neck (the preen every other cycle is not here)
//     bow (9 s)     the body tips forward, the neck reaches out and goes down across the route to the water
//     feed          the head sweeps along the water between d -8 and d -22 and back in 9 s; a small ring every 1.5 m
//     head_up       the boat within 8 m of the head: it lifts to 18 m in 6 s, and goes down again when the boat has
//                   been 15 m off for 4 s
//   Always in profile (it moves only in its own plane, square to the route) until the letting go, when it turns east,
//   walks two strides, opens its wings, runs and flies ("THE LETTING GO" below: one timeline on the show's clock).
//   Not here: the beads up the neck, the preen.
// THE RING OF STANDERS (row 10): twelve star-birds asleep on one leg, drawn here (the stand-in is taken out by name) on
//   the same skeleton in the monument's sleeping pose; their lines draw a bird at a time (cue 'standers', s 76), two
//   raise their heads (cue 'standers.heads', s 150), one opens a wing once (cue 'standers.wing', s 160: a fan 40 m
//   long, 5 s out, 6 s back), and they go out from the east with the dawn (lines first, then stars).
// THE SKEIN (row 11): still the stand-in of heroes.js (it flies there); see the log.
//
// shared.cast.wader / shared.cast.standers: the handles for staging (listed where they are made, and in the log).
// For looking: &wader=wake:0.5 | bow:0.4 | up:1 | reach:-34 | show:14 (several with commas) holds a control there.
import { removeStandIn } from '../../engine/modules.js';
import { smooth, lerp, clamp01 } from './plan.js';

const DEG = Math.PI / 180, TAU = Math.PI * 2;
const ez = (t) => t * t * t * (t * (6 * t - 15) + 10);          // a passage with no start and no stop to it
const span = (x, a, b) => clamp01((x - a) / (b - a));
const CHAIN = [6, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21], KITE = [4, 5, 6, 7, 8, 9];
const F0 = [-3, 0, 4], G1 = [3, 0, -4];                         // where its two feet stand ([u, y, w] as plan.wader says)
const dist3 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

// A held pose (22 stars) as joints: the kite's middle, its attitude and its six stars in its own frame; the neck as the
// first bone's direction and then the bend at every joint, with every bone's length.
function joints(pose) {
  const c = [0, 0, 0]; for (const i of KITE) for (let j = 0; j < 3; j++) c[j] += pose[i][j] / 6;
  let phi = Math.atan2(pose[6][1] - pose[8][1], pose[6][0] - pose[8][0]); if (phi < 0) phi += TAU;
  const cs = Math.cos(phi), sn = Math.sin(phi);
  const toLocal = (p) => { const du = p[0] - c[0], dy = p[1] - c[1]; return [du * cs + dy * sn, -du * sn + dy * cs, p[2] - c[2]]; };
  const ang = [], len = [];
  for (let k = 0; k < 12; k++) {
    const a = pose[CHAIN[k]], b = pose[CHAIN[k + 1]]; let t = Math.atan2(b[1] - a[1], b[0] - a[0]);
    if (k === 0) { if (t < 0) t += TAU; } else { while (t - ang[k - 1] > Math.PI) t -= TAU; while (t - ang[k - 1] < -Math.PI) t += TAU; }
    ang.push(t); len.push(Math.hypot(b[0] - a[0], b[1] - a[1]));
  }
  return { c, phi, local: KITE.map((i) => toLocal(pose[i])), bend: ang.map((t, k) => (k === 0 ? t : t - ang[k - 1])), len, toLocal };
}

// The ankle between a hip and a foot: it folds BACKWARD (toward the tail, +u), never forward.
function ankle(out, H, F, L1, L2, kx = 1, ky = 0, kz = 0) {
  let dx = H[0] - F[0], dy = H[1] - F[1], dz = H[2] - F[2]; const d = Math.hypot(dx, dy, dz) || 1e-6; dx /= d; dy /= d; dz /= d;
  if (d >= L1 + L2) { const a = d * L1 / (L1 + L2); out[0] = F[0] + dx * a; out[1] = F[1] + dy * a; out[2] = F[2] + dz * a; return out; }
  const a = Math.max(-L1, Math.min(L1, (d * d + L1 * L1 - L2 * L2) / (2 * d))), h = Math.sqrt(Math.max(0, L1 * L1 - a * a));
  const kd = kx * dx + ky * dy + kz * dz; let bx = kx - kd * dx, by = ky - kd * dy, bz = kz - kd * dz; const bl = Math.hypot(bx, by, bz) || 1; bx /= bl; by /= bl; bz /= bl;
  out[0] = F[0] + dx * a + bx * h; out[1] = F[1] + dy * a + by * h; out[2] = F[2] + dz * a + bz * h; return out;
}

// The skeleton. pose(out, s) writes the 22 stars for the state s:
//   s.wake 0..1 (asleep to awake, as time), s.bow 0..1 (awake to bowed; head up is the bow run part of the way back),
//   s.reach (where the crown lies on the water while it is bowed, u), s.tilt (radians added to the body's attitude),
//   s.bends (radians added at each of the neck's twelve joints), s.neckOnly (true: only the neck wakes)
function makeRig(POSES, T = {}) {
  const asleep = POSES.asleep.map((p) => [p[0] + F0[0] - POSES.asleep[0][0], p[1], p[2] + F0[2] - POSES.asleep[0][2]]);      // the sleeper stands on the foot it will keep
  const JA = joints(asleep), JB = joints(POSES.awake), JD = joints(POSES.bowed);
  const bones = (q, f, a, h) => [dist3(q[f], q[a]), dist3(q[a], q[h])];      // a leg's two bones as a held pose has them (they differ by a metre between the poses: each is kept as it was set)
  const LA = bones(asleep, 0, 2, 4), LB = [bones(POSES.awake, 0, 2, 4), bones(POSES.awake, 1, 3, 5)], LD = [bones(POSES.bowed, 0, 2, 4), bones(POSES.bowed, 1, 3, 5)];
  const fold = { foot: JA.toLocal(asleep[1]), L: bones(asleep, 1, 3, 5) };      // the folded leg: a bump under the belly, carried by the body
  const HEAD_ABS = JD.bend.slice(0, 11).reduce((a, b) => a + b, 0), sh = [POSES.bowed[6][0], POSES.bowed[6][1]], Y0 = POSES.bowed[19][1], U0 = POSES.bowed[19][0];
  // the passages' own times, as shares of each: [first joint's start, a later joint's delay, how long each joint takes]
  // in flight: the neck straight on from the body's own line, drooping a little, the bill hooked down
  const JF = [JB.phi, ...new Array(9).fill(1.5 * DEG), 12 * DEG, 35 * DEG];
  const WK = T.wake || [0.12, 0.03, 0.5], BW = T.bow || [0, 0.012, 0.868], ez3 = (t) => t * t * (3 - 2 * t);
  // the bowed neck reaching: the whole neck turned by a at the shoulder and its curve tightened or eased by c, so that
  // the crown lies on the water at u as it sweeps
  const crownAt = (a, c) => { let th = JD.bend[0] + a, u = sh[0], y = sh[1]; for (let k = 0; k < 10; k++) { if (k) th += c * JD.bend[k]; u += JD.len[k] * Math.cos(th); y += JD.len[k] * Math.sin(th); } return [u, y]; };
  const reachOf = JD.len.slice(0, 10).reduce((a, b) => a + b, 0) - 0.6;
  let sa = 0, sc = 1;                                            // the last answer: the next is never far from it
  const solve = (U, Y = Y0) => {
    { const du = U - sh[0], dy = Y - sh[1], d = Math.hypot(du, dy); if (d > reachOf) { U = sh[0] + du * reachOf / d; Y = sh[1] + dy * reachOf / d; } }      // never further than the neck is long
    let a = sa, c = sc;
    for (let it = 0; it < 30; it++) {
      const [u, y] = crownAt(a, c), fu = u - U, fy = y - Y; if (Math.abs(fu) + Math.abs(fy) < 1e-4) break;
      const e = 1e-4, [u1, y1] = crownAt(a + e, c), [u2, y2] = crownAt(a, c + e), j11 = (u1 - u) / e, j21 = (y1 - y) / e, j12 = (u2 - u) / e, j22 = (y2 - y) / e, det = j11 * j22 - j12 * j21;
      if (Math.abs(det) < 1e-9) break;
      a -= 0.7 * (j22 * fu - j12 * fy) / det; c -= 0.7 * (-j21 * fu + j11 * fy) / det;
    }
    if (Number.isFinite(a) && Number.isFinite(c) && c > 0.05 && c < 3) { sa = a; sc = c; }
    return [sa, sc];
  };
  const nD = { bend: new Array(12).fill(0), len: JD.len.slice() }, body = { c: [0, 0, 0], phi: 0, local: KITE.map(() => [0, 0, 0]) }, tmp = [0, 0, 0], foot = [0, 0, 0];
  function pose(out, s) {
    const xw = s.wake, xb = s.bow, wB = s.neckOnly ? 0 : ez(span(xw, 0.04, 0.72)), wLeg = s.neckOnly ? 0 : ez(span(xw, 0.08, 0.5)), bB = ez(span(xb, 0, 0.8));
    // the bowed neck as it is now
    if (xb > 0) { const [a, c] = solve(s.reach === undefined ? U0 : s.reach); let sum = JD.bend[0] + a; nD.bend[0] = sum;
      for (let k = 1; k < 10; k++) { nD.bend[k] = c * JD.bend[k]; sum += nD.bend[k]; }
      nD.bend[10] = HEAD_ABS - sum; nD.bend[11] = JD.bend[11]; }      // the head lies level on the water, the bill turned back toward the feet
    // the body: the kite keeps its shape
    for (let j = 0; j < 3; j++) body.c[j] = lerp(lerp(JA.c[j], JB.c[j], wB), JD.c[j], bB);
    body.phi = lerp(lerp(JA.phi, JB.phi, wB), JD.phi, bB) + (s.tilt || 0);
    for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) body.local[i][j] = lerp(lerp(JA.local[i][j], JB.local[i][j], wB), JD.local[i][j], bB);
    const cs = Math.cos(body.phi), sn = Math.sin(body.phi);
    const toWorld = (l, o) => { o[0] = body.c[0] + l[0] * cs - l[1] * sn; o[1] = body.c[1] + l[0] * sn + l[1] * cs; o[2] = body.c[2] + l[2]; return o; };
    KITE.forEach((i, n) => toWorld(body.local[n], out[i]));
    // the neck: each joint in its own time, base first
    let th = s.tilt || 0, p = out[6];
    for (let k = 0; k < 12; k++) {
      const pw = ez(span(xw, WK[0] + WK[1] * k, WK[0] + WK[1] * k + WK[2])), pb = xb > 0 ? ez3(span(xb, BW[0] + BW[1] * k, BW[0] + BW[1] * k + BW[2])) : 0;
      const pf = s.fly ? ez(span(s.fly, 0.02 * k, 0.78 + 0.02 * k)) : 0;
      th += lerp(lerp(lerp(JA.bend[k], JB.bend[k], pw), nD.bend[k], pb), JF[k], pf) + (s.bends ? s.bends[k] : 0);
      const l = lerp(lerp(lerp(JA.len[k], JB.len[k], pw), nD.len[k], pb), JB.len[k], pf), q = out[CHAIN[k + 1]];
      q[0] = p[0] + l * Math.cos(th); q[1] = p[1] + l * Math.sin(th); q[2] = p[2]; p = q;
    }
    if (s.noLegs) return out;
    // the legs: the standing foot never moves; the folded one comes down to its place and stays
    out[0][0] = F0[0]; out[0][1] = F0[1]; out[0][2] = F0[2];
    ankle(out[2], out[4], F0, lerp(lerp(LA[0], LB[0][0], wB), LD[0][0], bB), lerp(lerp(LA[1], LB[0][1], wB), LD[0][1], bB));
    toWorld(fold.foot, tmp); for (let j = 0; j < 3; j++) foot[j] = lerp(tmp[j], G1[j], wLeg);
    out[1][0] = foot[0]; out[1][1] = foot[1]; out[1][2] = foot[2];
    ankle(out[3], out[5], foot, lerp(lerp(fold.L[0], LB[1][0], wLeg), LD[1][0], bB), lerp(lerp(fold.L[1], LB[1][1], wLeg), LD[1][1], bB));
    return out;
  }
  const blank = () => Array.from({ length: 22 }, () => [0, 0, 0]);
  // head up: the bow run back to where the crown is 18 m above the water (the upper neck takes its S again, the bill hangs)
  let X_UP = 0.5; { const o = blank(); let lo = 0.3, hi = 1; for (let i = 0; i < 26; i++) { X_UP = (lo + hi) / 2; pose(o, { wake: 1, bow: X_UP }); if (o[19][1] > 18) lo = X_UP; else hi = X_UP; } }
  return { pose, blank, U0, asleep, X_UP, centre: JB.c.slice(), phi: JB.phi, legs: LB };
}

export async function build(ctx, plan, shared) {
  shared.cast = shared.cast || {};
  const { THREE, kit, stage } = ctx, P = plan, sky = shared.sky, W = shared.wader, path = ctx.path;
  if (!sky || !W) { console.warn('sky/cast_starbirds: no shared.sky or shared.wader (set or heroes was left out): nothing built'); return {}; }
  const MW = P.monument.wader, Wd = P.wader, calm = !!stage.calm;
  const held = { asleep: W.poses.asleep, awake: W.poses.awake, bowed: W.poses.bowed };
  const rig = makeRig(held), live = rig.blank();
  const hold = {};                                               // a control held at a number (by staging, or by &wader=)
  { const q = new URLSearchParams(typeof location !== 'undefined' ? location.search : '').get('wader');
    if (q) for (const pair of q.split(',')) { const [k, v] = pair.split(':'); if (k && v !== undefined && !Number.isNaN(+v)) hold[k] = +v; } }
  const T_WAKE = 16, T_BOW = 9, T_UP = 6, T_SWEEP = 9;
  const state = { wake: 0, bow: 0, up: 0, reach: rig.U0, tilt: 0, bends: new Array(12).fill(0) };
  const on = { footfall: null, release: null, sweep: null, glean: null, wingOpen: null, downBeat: null };
  let upRaw = 0, wantUp = false, farFor = 0, feed = 0, stand = 0, prevWake = -1, lastSweep = 0, trail = 0, shiverOn = false;
  const bill = new THREE.Vector3(), lastBill = new THREE.Vector3();
  rig.pose(live, state);
  W.poses.asleep = W.poses.awake = W.poses.bowed = live;         // heroes.js reads these three every frame: they are now one living pose
  // (the monument's own things, found by name: the second foot's ring comes when that foot is down; the shiver is in its stars)
  const ringMeshes = [], find = (name) => { let hit = null; ctx.group.traverse((o) => { if (o.name === name) { if (name.includes('ring')) ringMeshes.push(o); else hit = o; } }); return hit; };
  find('great wader (standing ring)'); const starPts = find('great wader (stars)');
  const starLight = (i) => MW.light[0] + MW.light[1] * MW.mags[i], SHIVER = [8, 7, 6, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];

  const wader = shared.cast.wader = {
    held,                                                        // the monument's three held poses, as plan.monument.wader.poses had them
    state, hold, on,
    /** It wakes (16 s): the cue 'wake' of heroes.js, fired by hand. */
    wake() { stage.fire('wake'); return wader; },
    /** It bows across the route (9 s) and feeds: the cue 'bow', fired by hand. */
    bow() { stage.fire('bow'); return wader; },
    /** The bowed head lifts to 18 m (6 s) and stays until head_up(false); head_up(null) gives it back to the boat's nearness. */
    head_up(v = true) { if (v === null) delete hold.upWant; else hold.upWant = !!v; return wader; },
    /** Put it in a state at once: settle({ wake: 1, bow: 0, up: 0 }); settle(null) gives the controls back to the cues. */
    settle(o) { if (!o) { for (const k of Object.keys(hold)) delete hold[k]; } else Object.assign(hold, o); return wader; },
    bill,                                                        // the bill's tip now (the realm's own metres)
    get feet() { return W.feet; }, get head() { return W.head; }, get crown() { return W.crown; }, get keel() { return W.keel; },
    feeding: 0,                                                  // 0..1: how much of the sweep is there
    todo: ['beads', 'preen'],
  };

  // ---------------------------------------------------------------------------------------------- the ring of standers
  const St = P.standers, PICK = [0, 2, 4, 3, 6, 7, 8, 9, 10, 12, 14, 16, 18, 20];
  const LINKS = [[0, 1], [1, 2], [2, 3], [4, 5], [5, 6], [6, 2], [2, 7], [7, 4], [4, 8], [8, 9], [9, 10], [10, 11], [11, 12], [12, 13]];
  const STEP = [0, 1, 7, 4, 5, 6, 2, 3, 8, 9, 10, 11, 12, 13];    // the order in which a bird's lines draw: up the leg, round the kite, the folded leg, up the neck
  const ARRIVE = new Array(14).fill(-1); LINKS.forEach(([a, b], n) => { if (ARRIVE[b] < 0 || STEP[n] < STEP[ARRIVE[b]]) ARRIVE[b] = n; }); ARRIVE[0] = -1;
  const centre = kit.at(St.centre[0], St.centre[1]), fc = path.at(St.centre[0]);
  const order = St.birds.map((b, i) => i).sort((a, b) => Math.abs(St.birds[a][0]) - Math.abs(St.birds[b][0]));
  const FAN = 3, HEADS = [1, 8];                                  // which bird opens a wing; which two raise their heads
  const birds = St.birds.map(([bearing, dist, high, lean], bi) => {
    const a = bearing * DEG, dir = new THREE.Vector3(fc.tx, 0, fc.tz).multiplyScalar(Math.cos(a)).add(new THREE.Vector3(fc.rx, 0, fc.rz).multiplyScalar(Math.sin(a)));
    const o = centre.clone().addScaledVector(dir, dist), side = new THREE.Vector3(-dir.z, 0, dir.x).multiplyScalar(bi % 2 ? 1 : -1);      // its profile lies square to the line from the lake's centre
    return { o, side, dir, k: high / 50, lean, rank: order.indexOf(bi), east: (Math.abs(bearing) - 26) / 128, head: 0, headTo: 0, fan: -1, pose: rig.blank(), pts: PICK.map(() => new THREE.Vector3()), s: { wake: 0, bow: 0, neckOnly: true, tilt: 0 } };
  });
  const sStars = [], sLines = [], baseLight = [];
  birds.forEach((b, bi) => {
    PICK.forEach((pi, j) => { const mag = Wd.mags[pi]; baseLight.push(0.55 * mag); sStars.push({ x: 0, y: 500, z: 0, size: 2.4 + 0.9 * mag, light: 0, rank: b.east, rate: 0.1 + 0.04 * (j % 5), phase: (bi * 7 + j) * 0.21 }); });
    LINKS.forEach(() => sLines.push({ a: [0, 500, 0], b: [0, 500, 1], light: 0.4, width: 1.5 }));
  });
  // the one wing that opens: an arm from the shoulder to a wrist and four long feathers from it (5 stars, 5 hairs), dark until then
  const N_S = sStars.length, N_L = sLines.length, FAN_RAYS = 4;
  for (let j = 0; j < FAN_RAYS + 1; j++) { sStars.push({ x: 0, y: 500, z: 0, size: j ? 2.6 : 3.0, light: 0, rank: birds[FAN].east, rate: 0.1, phase: j * 0.3 }); sLines.push({ a: [0, 500, 0], b: [0, 500, 1], light: 0, width: 1.5 }); }
  const stStars = sky.dabs(sStars, { twinkle: 0.1, fog: 0, fade: St.fade }); stStars.points.name = 'ring of standers (stars)';
  const stLines = sky.hairlines(sLines, { fog: 0 }); stLines.mesh.name = 'ring of standers (hairlines)';
  const removed = removeStandIn(ctx, 'ring of standers');
  if (!removed) console.warn('sky/cast_starbirds: the stand-in "ring of standers" was not found');
  const DRAW_GAP = 1.2, LINE_GAP = 0.4, LINE_T = 1.6, T_HEAD = 12, FAN_OUT = 5, FAN_BACK = 6;
  let drawAt = -1;                                               // the stage time at which the first bird began to draw (-1: not yet; -Infinity: long ago)
  stage.cue('standers', { s: St.drawFrom, settle() { drawAt = -Infinity; } }, () => { drawAt = stage.time; });
  stage.cue('standers.heads', { s: 150, settle() { for (const i of HEADS) birds[i].head = birds[i].headTo = 1; } }, () => { for (const i of HEADS) birds[i].headTo = 1; });
  stage.cue('standers.wing', { s: 160, settle() {} }, () => { birds[FAN].fan = stage.time; });
  shared.cast.standers = {
    birds,                                                       // each: { o (where it stands), k (its size against the 50 m sleeper), rank (its turn to draw), east, head, pts (its 14 stars now) }
    /** Their lines draw, a bird at a time (1.2 s apart): the cue 'standers', fired by hand. */
    draw() { stage.fire('standers'); return shared.cast.standers; },
    /** These birds raise their heads (12 s) or lay them back: raiseHeads([1, 8]), raiseHeads([1], false). */
    raiseHeads(list = HEADS, v = true) { for (const i of list) if (birds[i]) birds[i].headTo = v ? 1 : 0; return shared.cast.standers; },
    /** Bird 3 opens its wing once (5 s out, 6 s back). */
    openWing() { birds[FAN].fan = stage.time; if (on.wingOpen) on.wingOpen(birds[FAN].o); return shared.cast.standers; },
    drawSeconds: DRAW_GAP * 11 + LINE_GAP * 13 + LINE_T,         // how long the whole ring takes to draw
  };

  const v3 = new THREE.Vector3(), A3 = [0, 0, 0], B3 = [0, 0, 0];
  const lineSet = (h, i, a, b, k) => {                            // a hair between two stars, stopping 2 per cent short of each, drawn k of its length
    const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z, e = 0.02 + 0.96 * k;
    A3[0] = a.x + dx * 0.02; A3[1] = a.y + dy * 0.02; A3[2] = a.z + dz * 0.02; B3[0] = a.x + dx * e; B3[1] = a.y + dy * e; B3[2] = a.z + dz * e; h.set(i, A3, B3);
  };
  const fanPts = Array.from({ length: FAN_RAYS + 1 }, () => new THREE.Vector3());

  // ============================================================================== THE LETTING GO: the wader's part
  // One timeline on the showstopper's clock (shared.sky.T by itself; staging may hold or start it: shared.cast.wader.show(t),
  // turn_walk(), wings_open(), takeoff(), fly()). t 0 to 9.5: the head comes up from the water and the neck takes its S
  // again. 5 to 9.5: it turns east over its rear foot while the forward foot swings round to the first footfall
  // (s 216, d +21). 9.5 to 14: the second stride (s 238, d +24). 12 to 16: the wings open (84 m; 18 stars and 18 hairs
  // of this module, dark until then). 14 to 21: it runs (footfalls at 17, 19, 21: s 264, 294, 328), the neck going out
  // straight. 21: it leaves the water; then a long cross climbing east at 12 degrees, its wings beating once in 4.5 s,
  // going out from the tail forward (24.5 to 31). Each foot is pinned to its footfall while it is down; the body is
  // never higher than its legs are long, so it dips into every stride.
  const SH = { unbow: 9.5, turn: [5, 9.5], steps: [[5, 9.5], [9.5, 14], [14, 17], [17, 19], [19, 21]], places: [[216, 21], [238, 24], [264, 26], [294, 28], [328, 30]],
    wings: [12, 16], neck: [15, 21], pitch: [20, 24], off: [21.5, 21], lift: 21, climb: 12 * DEG, speed: 22, beat: 4.5, out: [24.5, 4, 2.5], gone: 31.5 };
  const fr = path.at(Wd.at[0]), R3 = new THREE.Vector3(fr.rx, 0, fr.rz), T3 = new THREE.Vector3(fr.tx, 0, fr.tz);
  const toFrame = ([ps, pd]) => { v3.subVectors(sky.at(ps, pd, 0), W.at); return [v3.dot(R3), 0, v3.dot(T3)]; };
  const toWorld = (q, out) => out.copy(W.at).addScaledVector(R3, q[0]).addScaledVector(T3, q[2]).setY(q[1]);
  const PL = SH.places.map(toFrame), START = [F0, G1], C0 = rig.centre, LEGS = rig.legs, LMAX = LEGS[0][0] + LEGS[0][1] - 0.05;
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[2] + b[2]) / 2];
  const wayT = [5, 9.5, 14, 17, 19, 21, 31], way = [[C0[0], C0[2]], mid(G1, PL[0]), mid(PL[0], PL[1]), mid(PL[1], PL[2]), mid(PL[2], PL[3]), mid(PL[3], PL[4])];
  way.push([way[5][0] + 0.07 * SH.speed * 10, way[5][1] + SH.speed * 10]);
  const slope = (i, j) => (i === 0 ? 0 : i === wayT.length - 1 ? (way[i][j] - way[i - 1][j]) / (wayT[i] - wayT[i - 1]) : (way[i + 1][j] - way[i - 1][j]) / (wayT[i + 1] - wayT[i - 1]));
  const herm = (t, j) => {                                       // where the body is over the water: a smooth way through the middle of every pair of footfalls
    const n = wayT.length; if (t <= wayT[0]) return way[0][j]; if (t >= wayT[n - 1]) return way[n - 1][j] + (t - wayT[n - 1]) * slope(n - 1, j);
    let i = 0; while (t > wayT[i + 1]) i++;
    const h = wayT[i + 1] - wayT[i], x = (t - wayT[i]) / h, x2 = x * x, x3 = x2 * x;
    return (2 * x3 - 3 * x2 + 1) * way[i][j] + (x3 - 2 * x2 + x) * slope(i, j) * h + (3 * x2 - 2 * x3) * way[i + 1][j] + (x3 - x2) * slope(i + 1, j) * h;
  };
  const foot = [[0, 0, 0], [0, 0, 0]], ringAt = [[0, 0], [0, 0]], ringOn = [0, 0], REL0 = [null, null], trailV = [0, 0, 0];
  // (the forward leg leads: foot 0, whose hip is the forward one, takes the first, third and fifth footfalls. With the
  // rear leg leading the two legs stood crossed at the first footfall, the stride nearest the boat.)
  const footAt = (f, ts) => {                                    // where foot f is by the schedule, and its ring
    const o = foot[f]; let from = START[f]; o[0] = from[0]; o[1] = 0; o[2] = from[2]; ringAt[f][0] = from[0]; ringAt[f][1] = from[2]; ringOn[f] = 1;
    for (let k = f ? 1 : 0; k < 5; k += 2) { const [a, b] = SH.steps[k];
      if (ts <= a) return;
      if (ts < b) { const p = (ts - a) / (b - a), q = p * p * (3 - 2 * p), L = Math.hypot(PL[k][0] - from[0], PL[k][2] - from[2]), up = Math.sin(Math.PI * p);
        o[0] = lerp(from[0], PL[k][0], q); o[2] = lerp(from[2], PL[k][2], q); o[1] = (3 + 0.1 * L) * up * up; ringOn[f] = 1 - span(ts - a, 0, 1.2); return; }
      from = PL[k]; o[0] = from[0]; o[2] = from[2]; ringAt[f][0] = from[0]; ringAt[f][1] = from[2]; ringOn[f] = span(ts - b, 0, 0.8); }
  };
  const fig = rig.blank(), sS = { wake: 1, bow: 0, fly: 0, tilt: 0, reach: rig.U0, noLegs: true }, TILT = (Math.PI - SH.climb) - rig.phi;
  const show = { ts: -1, bow0: 1, reach0: rig.U0, was: false, psi: 0, raw: 0, clock: null, prev: -1 };
  let DROP0 = 0;
  const showPose = (ts, out) => {
    sS.bow = show.bow0 * (1 - span(ts, 0, SH.unbow)); sS.reach = lerp(show.reach0, rig.U0, span(ts, 0, 3)); sS.fly = span(ts, SH.neck[0], SH.neck[1]); sS.tilt = TILT * ez(span(ts, SH.pitch[0], SH.pitch[1]));
    rig.pose(fig, sS);
    const psi = show.psi = 0.5 * Math.PI * ez(span(ts, SH.turn[0], SH.turn[1])), cs = Math.cos(psi), sn = Math.sin(psi), bu = herm(ts, 0), bw = herm(ts, 1);
    for (let i = 4; i < 22; i++) { const q = fig[i], du = q[0] - C0[0], dw = q[2] - C0[2], o = out[i]; o[0] = bu + du * cs + dw * sn; o[1] = q[1]; o[2] = bw - du * sn + dw * cs; }
    let acc = 1; const flying = [ts > SH.off[0], ts > SH.off[1]];
    for (let f = 0; f < 2; f++) { footAt(f, Math.min(ts, SH.off[f])); if (flying[f]) continue; const H = out[4 + f], F = foot[f], dh = Math.hypot(H[0] - F[0], H[2] - F[2]); acc += Math.exp(3 * (H[1] - F[1] - Math.sqrt(Math.max(1, LMAX * LMAX - dh * dh)))); }
    show.raw = Math.log(acc) / 3;
    const tau = ts - SH.lift, lift = tau > 0 ? Math.tan(SH.climb) * SH.speed * (tau < 3 ? tau * tau / 6 : tau - 1.5) : 0, dy = lift - Math.max(0, show.raw - DROP0);
    for (let i = 4; i < 22; i++) out[i][1] += dy;
    const ta = sS.tilt - 6 * DEG, tl = LMAX - 0.1; trailV[0] = Math.cos(ta) * tl * cs; trailV[1] = Math.sin(ta) * tl; trailV[2] = -Math.cos(ta) * tl * sn;      // in the air the legs trail in the body's own line, drooping
    for (let f = 0; f < 2; f++) {
      const F = foot[f], H = out[4 + f];
      if (flying[f]) { const q = ez(span(ts, SH.off[f], SH.off[f] + 3.5)), r0 = REL0[f] || trailV; for (let j = 0; j < 3; j++) F[j] = H[j] + lerp(r0[j], trailV[j], q); ringOn[f] = 1 - span(ts - SH.off[f], 0, 1.2); }
      out[f][0] = F[0]; out[f][1] = F[1]; out[f][2] = F[2];
      ankle(out[2 + f], H, F, LEGS[f][0], LEGS[f][1], cs, 0, -sn);
    }
  };
  { const o = rig.blank(); show.bow0 = 0; showPose(0, o); DROP0 = show.raw;
    showPose(SH.off[1], o); REL0[1] = [0, 1, 2].map((j) => o[1][j] - o[5][j]); showPose(SH.off[0], o); REL0[0] = [0, 1, 2].map((j) => o[0][j] - o[4][j]); show.bow0 = 1; }
  // the wings: each a line of five stars from the star of the back out to the tip, and four long feathers hanging from it
  const WX = [6, 14, 23.5, 33, 42], WC = [0, -1.5, -2.5, 1, 6], FL = [9, 10.5, 11.5, 10], FA = [6, 15, 27, 42].map((v) => v * DEG), WRIST = 23.5,      // (the feathers fan: the inner ones lie back along the body, the outer ones turn toward the tip; parallel, they were the teeth of a comb)
    wingStars = [], wingLines = [], wingBase = [];
  for (let side = 0; side < 2; side++) for (let j = 0; j < 9; j++) { const mag = j < 5 ? (j === 4 ? 1.7 : 1.45) : 1.1; wingBase.push(MW.light[0] + MW.light[1] * mag);
    wingStars.push({ x: 0, y: 500, z: 0, size: MW.size[0] + MW.size[1] * mag, light: 0, rank: 1, rate: 0.12 + 0.04 * (j % 4), phase: side * 0.5 + j * 0.23 }); wingLines.push({ a: [0, 500, 0], b: [0, 500, 1], light: 0, width: MW.line.width }); }
  const wgStars = sky.dabs(wingStars, { twinkle: 0.1, fog: 0.5 }), wgLines = sky.hairlines(wingLines, { fog: 0.5 });
  wgStars.points.name = 'great wader (wing stars)'; wgLines.mesh.name = 'great wader (wing hairlines)'; wgStars.points.visible = wgLines.mesh.visible = false;
  const wingP = Array.from({ length: 18 }, () => new THREE.Vector3()), rootV = new THREE.Vector3(), qW = [0, 0, 0];
  const ORDER = [0, 0, 0.1, 0.1, 0.32, 0.32, 0.5, 0.4, 0.22, 0.4, 0.55, 0.59, 0.63, 0.67, 0.71, 0.75, 0.79, 0.83, 0.87, 0.92, 0.96, 1];      // going out from the tail forward
  const outAt = (ord, ts) => 1 - smooth(SH.out[0] + SH.out[1] * ord, SH.out[0] + SH.out[1] * ord + SH.out[2], ts);
  const hairMesh = find('great wader (hairlines)'), dustMesh = find('great wader (dust)');
  const starBase = starPts ? Float32Array.from({ length: starPts.geometry.attributes.aDab.count }, (_, i) => starPts.geometry.attributes.aDab.getY(i)) : null;
  const hairBase = hairMesh ? Float32Array.from(hairMesh.geometry.attributes.aHair.array) : null;
  const fadeWas = starPts && hairMesh ? [starPts.material.uniforms.uFade.value.clone(), hairMesh.material.uniforms.uFade.value.clone()] : null;
  let lastBeat = 0;
  const showDraw = (ts, boat) => {                               // after heroes.js has drawn its own: the lights, the rings, the wings
    if (!starPts || !hairMesh) return;
    const ad = starPts.geometry.attributes.aDab, ah = hairMesh.geometry.attributes.aHair, body = outAt(0.36, ts);
    starPts.material.uniforms.uGain.value = 1; hairMesh.material.uniforms.uGain.value = 1; starPts.material.uniforms.uFade.value.set(2, 3); hairMesh.material.uniforms.uFade.value.set(2, 3);
    for (let i = 0; i < ad.count; i++) ad.setY(i, starBase[i] * (i < 22 ? outAt(ORDER[i], ts) : body)); ad.needsUpdate = true;
    Wd.lines.forEach(([a, b], i) => { const k = Math.min(outAt(ORDER[a], ts), outAt(ORDER[b], ts)); ah.setXYZ(i, hairBase[i * 4] * k, hairBase[i * 4 + 1] * k, hairBase[i * 4 + 2] * k); }); ah.needsUpdate = true;
    if (dustMesh) { dustMesh.material.uniforms.uGain.value = body; dustMesh.visible = body > 0.004; }
    ringMeshes.forEach((m, f) => { const g = ringOn[f] * (ts < SH.gone ? 1 : 0); m.material.uniforms.uGain.value = g; m.visible = g > 0.01; qW[0] = ringAt[f][0]; qW[1] = 0.02; qW[2] = ringAt[f][1]; toWorld(qW, m.position); });
    // a footfall: a ring on the water and staging's callback; a foot leaving: its standing ring let go
    SH.steps.forEach(([a, b], k) => { const f = k % 2;
      for (const [t, down] of [[a, false], [b, true]]) if (show.prev >= 0 && show.prev < t && ts >= t && ts - show.prev < 1) { qW[0] = down ? PL[k][0] : ringAt[f][0]; qW[1] = 0; qW[2] = down ? PL[k][2] : ringAt[f][1]; toWorld(qW, v3);
        if (Math.hypot(v3.x - boat.x, v3.z - boat.z) < 48) ctx.water.ripple(v3.x, v3.z, down ? 1.2 : 0.8, 6);
        if (down && on.footfall) on.footfall(f, v3.clone()); if (!down && on.release) on.release(f, v3.clone()); } });
    // the wings
    const o = ez(span(ts, SH.wings[0], SH.wings[1])), vis = o > 0.001 && body > 0.002; wgStars.points.visible = wgLines.mesh.visible = vis; if (!vis) return;
    const beat = ez(span(ts, SH.wings[1] - 0.5, SH.wings[1] + 3)) * (calm ? 0.6 : 1), ph = TAU * (ts - SH.wings[1]) / SH.beat, rest = lerp(70, 30, o);
    const th1 = (rest * (1 - beat) + beat * (10 + 24 * Math.sin(ph))) * DEG, th2 = (rest * (1 - beat) + beat * (10 + 30 * Math.sin(ph - 0.9))) * DEG;
    const a = [live[6][0] - live[8][0], live[6][1] - live[8][1], live[6][2] - live[8][2]], al = Math.hypot(a[0], a[1], a[2]) || 1; a[0] /= al; a[1] /= al; a[2] /= al;
    const l = [Math.sin(show.psi), 0, Math.cos(show.psi)], d = [a[1] * l[2] - a[2] * l[1], a[2] * l[0] - a[0] * l[2], a[0] * l[1] - a[1] * l[0]], wf = outAt(0.42, ts);
    toWorld(live[7], rootV);
    for (let side = 0; side < 2; side++) {
      const sg = side ? -1 : 1, c1 = sg * Math.cos(th1), s1 = Math.sin(th1), c2 = sg * Math.cos(th2), s2 = Math.sin(th2);
      const at = (x, c, out) => { const xi = Math.min(x, WRIST) * o, xo = Math.max(0, x - WRIST) * o; for (let j = 0; j < 3; j++) qW[j] = live[7][j] - a[j] * c * o + xi * (c1 * l[j] + s1 * d[j]) + xo * (c2 * l[j] + s2 * d[j]); toWorld(qW, out); };
      for (let j = 0; j < 5; j++) at(WX[j], WC[j], wingP[side * 9 + j]);
      for (let j = 0; j < 4; j++) at(WX[j] + FL[j] * Math.sin(FA[j]), WC[j] + FL[j] * Math.cos(FA[j]), wingP[side * 9 + 5 + j]);
      for (let j = 0; j < 9; j++) { const n = side * 9 + j, k = (j < 5 ? smooth(0.1 + 0.12 * j, 0.45 + 0.12 * j, o) : smooth(0.5 + 0.08 * (j - 5), 0.8 + 0.08 * (j - 5), o)) * wf, q = wingP[n];
        wgStars.set(n, q.x, q.y, q.z); wgStars.setLight(n, wingBase[n] * k);
        lineSet(wgLines, n, j === 0 ? rootV : (j < 5 ? wingP[n - 1] : wingP[n - 5]), q, 1); wgLines.setLight(n, MW.line.light * k); }
    }
    { const sgn = Math.cos(ph) > 0 ? 1 : -1; if (beat > 0.5 && lastBeat > 0 && sgn < 0 && on.downBeat) on.downBeat(rootV); lastBeat = sgn; }
  };
  const showEnd = () => {                                        // the lights as the monument set them
    if (!starPts || !hairMesh) return;
    const ad = starPts.geometry.attributes.aDab, ah = hairMesh.geometry.attributes.aHair;
    for (let i = 0; i < ad.count; i++) ad.setY(i, starBase[i]); ad.needsUpdate = true; ah.array.set(hairBase); ah.needsUpdate = true;
    starPts.material.uniforms.uFade.value.copy(fadeWas[0]); hairMesh.material.uniforms.uFade.value.copy(fadeWas[1]); wgStars.points.visible = wgLines.mesh.visible = false;
  };
  const startAt = (t0) => { if (!(show.ts >= t0)) { show.clock = { at: stage.time, t0 }; delete hold.show; } return wader; };
  Object.assign(wader, {
    /** Its part in the letting go, held at t seconds of the showstopper's clock; show(null) gives it back to shared.sky.T; show(-1) keeps it out of the show. */
    show(t) { show.clock = null; if (t === null || t === undefined) delete hold.show; else hold.show = t; return wader; },
    /** The same timeline entered by hand and run by the clock from there: the turn and two strides (t 5), the wings (t 12), the run (t 15), the flight (t 21). */
    turn_walk: () => startAt(5), wings_open: () => startAt(12), takeoff: () => startAt(15), fly: () => startAt(21),
    showTimes: SH, footfalls: PL.map((q) => toWorld(q, new THREE.Vector3())),
  });

  return {
    update(dt, c) {
      const time = c.time, e = sky.e, boat = c.boat, soft = calm ? 0.5 : 1;
      // ================================================================================== the great wader
      const tw = stage.since('wake'), tb = stage.since('bow');
      const xw = state.wake = hold.wake !== undefined ? clamp01(hold.wake) : (tw < 0 ? 0 : clamp01(tw / T_WAKE));
      const xb = hold.bow !== undefined ? clamp01(hold.bow) : (tb < 0 ? 0 : clamp01(tb / T_BOW));
      // the head comes up when the boat is within 8 m of it and goes down when the boat has been 15 m off for 4 s
      { const hx = W.crown.x - boat.x, hz = W.crown.z - boat.z, d = Math.hypot(hx, hz);
        if (d < 8 && xb >= 1) { wantUp = true; farFor = 0; } else if (d > 15) { farFor += dt; if (farFor > 4) wantUp = false; } else farFor = 0;
        const want = hold.upWant !== undefined ? hold.upWant : wantUp;
        upRaw = hold.up !== undefined ? clamp01(hold.up) : clamp01(upRaw + (want ? dt : -dt) / T_UP);
        state.up = ez(upRaw); state.bow = xb * (1 - state.up * (1 - rig.X_UP)); }
      // feeding: the sweep comes in over 6 s once it is bowed and its head is down
      feed = clamp01(feed + (xb >= 1 && upRaw <= 0 ? dt / 6 : -dt / 4)); wader.feeding = feed;
      stand = clamp01(stand + (xw >= 1 && xb <= 0 ? dt / 5 : -dt / 3));
      const ph = TAU * time / T_SWEEP, sw = Math.sin(ph);
      state.reach = hold.reach !== undefined ? hold.reach : rig.U0 + ez(feed) * soft * (-2 + 7 * sw);
      // the slow life: asleep it leans and comes back; standing, a sway climbs the neck
      state.tilt = 0.3 * DEG * Math.sin(TAU * time / 16) * (1 - span(xw, 0, 0.1));
      // (a preen every other cycle is not here: the head tipped down by 24 degrees laid its own line along the neck's, a doubled line)
      { const st = ez(stand) * (calm ? 0.6 : 1), w = TAU * time / 20, B = state.bends;
        B.fill(0);
        B[0] = 1.0 * DEG * Math.sin(w) * st; B[4] = 0.9 * DEG * Math.sin(w - 1.1) * st; B[8] = 1.4 * DEG * Math.sin(w - 2.3) * st; }
      // the letting go: its clock is the showstopper's, unless staging holds it or has started it by hand
      { const raw = hold.show !== undefined ? hold.show : (show.clock ? show.clock.t0 + stage.time - show.clock.at : (sky.T >= 0 ? sky.T : -1)), act = raw >= 0;
        if (act && !show.was) { show.bow0 = state.bow; show.reach0 = state.reach; }
        if (!act && show.was) showEnd();
        show.was = act; show.prev = show.ts; show.ts = act ? Math.min(raw, SH.gone + 1) : -1; }
      if (show.ts >= 0) { showPose(show.ts, live); showDraw(show.ts, boat); bill.copy(W.head); prevWake = xw; return birdsUpdate(dt, c); }
      rig.pose(live, state);
      // the second foot's ring: there when that foot is down (heroes.js has set both rings this frame)
      if (ringMeshes.length === 2) { const g = ringMeshes[0].material.uniforms.uGain.value * ez(span(xw, 0.47, 0.6)), m = ringMeshes[1]; m.material.uniforms.uGain.value = g; m.visible = g > 0.01; }
      // the foot comes down: a ring on the water (and staging's callback)
      if (prevWake >= 0 && prevWake < 0.5 && xw >= 0.5 && xw - prevWake < 0.2) {
        const f = W.feet[1]; if (Math.hypot(f.x - boat.x, f.z - boat.z) < 48) ctx.water.ripple(f.x, f.z, 1.2, 6);
        if (on.footfall) on.footfall(1, f);
      }
      prevWake = xw;
      // a shiver of brightness from tail to head as it wakes
      if (starPts) { const t = xw * T_WAKE, ad = starPts.geometry.attributes.aDab, act = xw > 0 && t < 10.5;
        if (act || shiverOn) { SHIVER.forEach((i, n) => { if (i === W.lit) return; const q = span(t, 0.5 + n * 0.45, 3.5 + n * 0.45); ad.setY(i, starLight(i) * (1 + (act ? 0.55 * Math.pow(Math.sin(Math.PI * q), 2) : 0))); }); ad.needsUpdate = true; }
        shiverOn = act; }
      // the bill on the water: a small ring every 1.5 m of its sweep; the turn of each sweep is staging's to hear
      bill.copy(W.head);
      if (feed > 0.05 && bill.y < 1.5) { trail += Math.hypot(bill.x - lastBill.x, bill.z - lastBill.z); if (trail > 1.5) { trail = 0; if (Math.hypot(bill.x - boat.x, bill.z - boat.z) < 48) ctx.water.ripple(bill.x, bill.z, 0.15, 0.6); } }
      lastBill.copy(bill);
      { const side = Math.cos(ph) > 0 ? 1 : -1; if (feed > 0.5 && lastSweep && side !== lastSweep && on.sweep) on.sweep(side, bill); lastSweep = side; }
      return birdsUpdate(dt, c);
    },
  };

  function birdsUpdate(dt, c) {
    { const time = c.time, e = sky.e;
      // ================================================================================== the ring of standers
      const since = drawAt < 0 && drawAt !== -Infinity ? -1 : (drawAt === -Infinity ? 1e6 : stage.time - drawAt);
      birds.forEach((b, bi) => {
        // its pose: asleep on one leg, leaning a little and back; its head up if it has been asked
        b.head = clamp01(b.head + (b.headTo > b.head ? dt : -dt) / T_HEAD);
        b.s.wake = b.head; b.s.tilt = 0.3 * DEG * Math.sin(TAU * time / (14 + 0.5 * bi) + bi * 1.7);
        rig.pose(b.pose, b.s);
        const tB = since < 0 ? -1 : since - DRAW_GAP * b.rank, lo = St.fade[0] + b.east * 0.6 * (St.fade[1] - St.fade[0]), lineOut = 1 - smooth(lo - 0.04, lo + 0.05, e);
        PICK.forEach((pi, j) => {
          const p = b.pose[pi], u = (p[0] - F0[0]) + b.lean * p[1], w = p[2] - F0[2];
          b.pts[j].copy(b.o).addScaledVector(b.side, u * b.k).addScaledVector(b.dir, w * b.k).setY(p[1] * b.k);
          stStars.set(bi * 14 + j, b.pts[j].x, b.pts[j].y, b.pts[j].z);
          // until its lines draw only its principal stars are there, as ordinary stars; the rest kindle as the hairs reach them
          const n = ARRIVE[j], reach = tB < 0 ? 0 : (n < 0 ? span(tB, 0, 1) : smooth(0.7, 1, span(tB, STEP[n] * LINE_GAP, STEP[n] * LINE_GAP + LINE_T)));
          stStars.setLight(bi * 14 + j, baseLight[bi * 14 + j] * lerp(Wd.mags[pi] >= 1.9 ? St.asleepGain : 0, 1, reach));
        });
        LINKS.forEach(([i, j], n) => {
          const k = tB < 0 ? 0 : ez(span(tB, STEP[n] * LINE_GAP, STEP[n] * LINE_GAP + LINE_T));
          lineSet(stLines, bi * 14 + n, b.pts[i], b.pts[j], k); stLines.setLight(bi * 14 + n, k > 0 ? 0.4 * lineOut : 0);
        });
      });
      // the one wing: an arm lifts from along the back and four feathers open from its wrist (5 s), then it folds (6 s)
      // (it lifts from just above the line of the back, never through the kite; every hair draws in along its length and goes the same way)
      { const b = birds[FAN], t = b.fan < 0 ? -1 : stage.time - b.fan, END = FAN_OUT + 1.5 + FAN_BACK, open = t < 0 ? 0 : ez(span(t, 0, FAN_OUT)) * (1 - ez(span(t, FAN_OUT + 1.5, END))) * (calm ? 0.6 : 1);
        const kA = t < 0 ? 0 : ez(span(t, 0, 2)) * (1 - ez(span(t, END - 2, END))), kR = t < 0 ? 0 : ez(span(t, 1, 3)) * (1 - ez(span(t, END - 3, END - 1)));
        const L = 40 / b.k, sh = b.pose[6], tail = b.pose[8], back = Math.atan2(tail[1] - sh[1], tail[0] - sh[0]), arm = back + (48 + 36 * open) * DEG, wr = [sh[0] + 0.36 * L * Math.cos(arm), sh[1] + 0.36 * L * Math.sin(arm)];
        const place = (out, u, y) => out.copy(b.o).addScaledVector(b.side, ((u - F0[0]) + b.lean * y) * b.k).addScaledVector(b.dir, (sh[2] - F0[2]) * b.k).setY(y * b.k);
        place(fanPts[0], wr[0], wr[1]);
        for (let r = 0; r < FAN_RAYS; r++) { const a = arm + (-27 + 18 * r) * DEG * open; place(fanPts[r + 1], wr[0] + 0.64 * L * Math.cos(a), wr[1] + 0.64 * L * Math.sin(a)); }
        const lineOut = 1 - smooth(St.fade[0], St.fade[0] + 0.1, e);
        for (let j = 0; j <= FAN_RAYS; j++) {
          const k = j ? kR : kA;
          stStars.set(N_S + j, fanPts[j].x, fanPts[j].y, fanPts[j].z); stStars.setLight(N_S + j, (j ? 0.6 : 0.75) * smooth(0.7, 1, k));
          lineSet(stLines, N_L + j, j ? fanPts[0] : b.pts[4], j ? fanPts[j] : fanPts[0], k); stLines.setLight(N_L + j, k > 0 ? 0.34 * lineOut : 0);
        } }
    }
  }
}
