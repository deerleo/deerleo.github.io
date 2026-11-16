// Great swimmers: the old carp, the whale, the dolphins, a pike. The family page is docs/life/swimmers.md.
//
//   import { makeSwimmer } from '../engine/life/swimmers.js';
//   const carp = await makeSwimmer(ctx, { species: 'carp', route: { points: [[x, y, z], ...], closed: true } });   // in build()
//   ctx.stage.cue('sip', { s: 190 }, () => carp.rise());
//
// THE RULE OF THE SPINE. A swimmer's body is not played from clips. Its model (source-art/models/life/<name>.py) is
// bound to a row of spine stations; every frame each station is put on the trail its own snout has drawn through the
// water, at its own distance behind the snout. So the body goes exactly where the head went: a back rolling at the
// surface slides through one place like the rim of a wheel, and nothing ever skates sideways. On top of that the
// body flexes in one plane only (side to side for fish, up and down for whales and dolphins): a swimming wave that
// grows toward the tail, timed by the distance travelled (so the stroke makes the travel and never the reverse), and
// a few named shapes (the whale's arched tailstock, the pike's coil), with a limit at every joint. Fins, flippers,
// jaws and barbels are driven by rule, with springs for follow-through.
//
// Drawing: one instanced mesh per call (one draw call for seven dolphins), skinned in the gouache material's vertex
// shader from a small float texture of bone matrices, so the creature takes the realm's light, lantern, fog and veil.
// It is solid, so under the surface the water bends, tints and swallows it as docs/water.md says, and it may cross
// the surface: the mirror cuts it at the waterline by itself.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FOG_PARS } from '../kit.js';
import { makeFleckTexture } from '../water-final-trace.js';

const TAU = Math.PI * 2, RAD = Math.PI / 180;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const softClip = (x, m) => { const a = Math.abs(x); return a <= 0.8 * m ? x : Math.sign(x) * (0.8 * m + 0.2 * m * Math.tanh((a - 0.8 * m) / (0.2 * m))); };
const ease = (cur, target, dt, tau) => cur + (target - cur) * (1 - Math.exp(-dt / Math.max(1e-4, tau)));

// ------------------------------------------------------------------------------------------------ model files
const loader = new GLTFLoader();
const files = new Map();
const _m = new THREE.Matrix4(), _m2 = new THREE.Matrix4(), _e = new THREE.Euler(0, 0, 0, 'ZXY'), _v = new THREE.Vector3(), _v2 = new THREE.Vector3();

/** Fetch a swimmer's model and its numbers once: assets/models/life/<file>.glb and .json. */
function loadFile(file) {
  let rec = files.get(file);
  if (!rec) {
    rec = { file, refs: 0 };
    const get = (ext) => fetch(`assets/models/life/${file}.${ext}`).then((r) => { if (!r.ok) throw new Error(`swimmers: assets/models/life/${file}.${ext}: ${r.status}`); return r; });
    rec.promise = Promise.all([get('glb').then((r) => r.arrayBuffer()).then((buf) => loader.parseAsync(buf, '')), get('json').then((r) => r.json())]).then(([gltf, spec]) => {
      gltf.scene.updateMatrixWorld(true);
      let mesh = null;
      gltf.scene.traverse((o) => { if (o.isSkinnedMesh && !mesh) mesh = o; });
      if (!mesh) throw new Error(`swimmers: ${file}.glb has no skinned mesh`);
      const sk = mesh.skeleton;
      rec.geometry = mesh.geometry; rec.spec = spec;
      // its general colour: what is left of its paint when it is seen as a shape under the surface and no more (the mean of its vertex paint)
      rec.plain = new THREE.Color(0.5, 0.5, 0.5);
      { const ca = mesh.geometry.attributes.color; if (ca && ca.count) { let r = 0, g = 0, b = 0; for (let i = 0; i < ca.count; i++) { r += ca.getX(i); g += ca.getY(i); b += ca.getZ(i); } rec.plain.setRGB(r / ca.count, g / ca.count, b / ca.count); } }
      rec.triangles = (mesh.geometry.index ? mesh.geometry.index.count : mesh.geometry.attributes.position.count) / 3;
      if (mesh.material && mesh.material.dispose) mesh.material.dispose();
      rec.bones = sk.bones.map((b, j) => ({ name: b.name, parent: sk.bones.indexOf(b.parent), restWorld: b.matrixWorld.clone(), inv: sk.boneInverses[j].clone(), local: null, station: -1, sign: /_R$/.test(b.name) ? -1 : 1 }));
      rec.index = {};
      let worst = 0;
      rec.bones.forEach((b, j) => {
        rec.index[b.name] = j;
        b.local = b.parent >= 0 ? new THREE.Matrix4().copy(rec.bones[b.parent].restWorld).invert().multiply(b.restWorld) : b.restWorld.clone();
        const m = /^spine(\d+)$/.exec(b.name);
        if (m) b.station = +m[1];
        _m.multiplyMatrices(b.restWorld, b.inv);
        for (let i = 0; i < 16; i++) worst = Math.max(worst, Math.abs(_m.elements[i] - (i % 5 === 0 ? 1 : 0)));
      });
      if (worst > 1e-3) console.error(`INVALID_MODEL swimmers: ${file}.glb is not bound at rest (off by ${worst.toFixed(4)})`);
      const nSt = rec.bones.filter((b) => b.station >= 0).length;
      if (nSt !== spec.stations.length) console.error(`INVALID_MODEL swimmers: ${file}.glb has ${nSt} spine bones, its JSON ${spec.stations.length} stations`);
      const depth = (j) => { let d = 0; for (let p = rec.bones[j].parent; p >= 0; p = rec.bones[p].parent) d++; return d; };
      rec.order = rec.bones.map((_, j) => j).sort((a, b) => depth(a) - depth(b));
      // a mark is a named point of the body, carried by one bone: its place in the model, in the ride's axes
      rec.marks = Object.entries(spec.marks || {}).map(([name, mk]) => ({ name, bone: rec.index[mk.bone] ?? 0, at: new THREE.Vector3(mk.at[0], mk.at[1], mk.at[2]) }));
      return rec;
    });
    files.set(file, rec);
    rec.promise.catch(() => { if (files.get(file) === rec) files.delete(file); });
  }
  return rec.promise;
}

// ------------------------------------------------------------------------------------------------ routes
/**
 * A route through the water: a smooth line through points [x, y, z] or [x, y, z, { speed, roll, amp }], in the realm's
 * coordinates (y = 0 is the water; a swimmer's spine follows the line, so its back is higher by the reach of its back).
 *   speed   m/s wanted from this point on (eased between points)
 *   roll    degrees the animal is rolled about its own length there, positive = its back tips to its own left
 *   amp     0..1 how hard it swims there (the size of the swimming wave)
 * closed: true joins the end to the start (a patrol). An open route runs on straight beyond both ends.
 */
export class SwimRoute {
  constructor(points, { closed = false, step = 0.25 } = {}) {
    if (!points || points.length < 2) throw new Error('a swim route needs at least two points');
    this.closed = closed; this.points = points;
    const pts = points.map((p) => new THREE.Vector3(p[0], p[1], p[2]));
    const curve = new THREE.CatmullRomCurve3(pts, closed, 'centripetal');
    const segs = closed ? pts.length : pts.length - 1;
    curve.arcLengthDivisions = segs * 48;
    const lens = curve.getLengths(segs * 48);
    this.length = lens[lens.length - 1];
    const n = Math.max(8, Math.ceil(this.length / step));
    this.n = n; this.step = this.length / n;
    this.xyz = new Float32Array((n + 1) * 3);
    const sp = curve.getSpacedPoints(n);
    for (let i = 0; i <= n; i++) { this.xyz[i * 3] = sp[i].x; this.xyz[i * 3 + 1] = sp[i].y; this.xyz[i * 3 + 2] = sp[i].z; }
    // what each control point asks for, carried along the line and eased between points
    const at = pts.map((_, i) => lens[i * 48]);                       // arc position of every control point
    if (closed) at.push(this.length);
    this.ctrlS = at;
    const attr = (key) => {
      const vals = points.map((p) => (p[3] && p[3][key] !== undefined ? p[3][key] : null));
      if (vals.every((v) => v === null)) return null;
      let last = vals.find((v) => v !== null);
      for (let i = 0; i < vals.length; i++) { if (vals[i] === null) vals[i] = last; else last = vals[i]; }
      if (closed) vals.push(vals[0]);
      const out = new Float32Array(n + 1);
      for (let i = 0, k = 0; i <= n; i++) {
        const s = i * this.step;
        while (k < at.length - 2 && s > at[k + 1]) k++;
        const f = smooth(at[k], at[k + 1], s);
        out[i] = vals[k] + (vals[Math.min(vals.length - 1, k + 1)] - vals[k]) * f;
      }
      return out;
    };
    this.speed = attr('speed'); this.roll = attr('roll'); this.amp = attr('amp');
    // the tightest turn on it, so that a route no body could follow is reported instead of drawn broken
    let kmax = 0;
    for (let i = 4; i < n - 4; i++) {
      const a = (i - 4) * 3, b = i * 3, c = (i + 4) * 3;
      const ux = this.xyz[b] - this.xyz[a], uy = this.xyz[b + 1] - this.xyz[a + 1], uz = this.xyz[b + 2] - this.xyz[a + 2];
      const vx = this.xyz[c] - this.xyz[b], vy = this.xyz[c + 1] - this.xyz[b + 1], vz = this.xyz[c + 2] - this.xyz[b + 2];
      const lu = Math.hypot(ux, uy, uz) || 1, lv = Math.hypot(vx, vy, vz) || 1;
      const cs = clamp((ux * vx + uy * vy + uz * vz) / (lu * lv), -1, 1);
      kmax = Math.max(kmax, Math.acos(cs) / (0.5 * (lu + lv)));
    }
    this.minRadius = kmax > 1e-6 ? 1 / kmax : Infinity;
  }

  /** The point `s` metres along (out: a Vector3). A closed route wraps; an open one runs on straight. Returns out. */
  at(s, out) {
    const L = this.length, X = this.xyz, n = this.n;
    if (this.closed) s = ((s % L) + L) % L;
    else if (s < 0 || s > L) {
      const e = s < 0 ? 0 : n, i = s < 0 ? 0 : n - 1, over = s < 0 ? s : s - L;
      const dx = X[(i + 1) * 3] - X[i * 3], dy = X[(i + 1) * 3 + 1] - X[i * 3 + 1], dz = X[(i + 1) * 3 + 2] - X[i * 3 + 2], l = Math.hypot(dx, dy, dz) || 1;
      return out.set(X[e * 3] + dx / l * over, X[e * 3 + 1] + dy / l * over, X[e * 3 + 2] + dz / l * over);
    }
    const f = Math.min(n - 1e-4, s / this.step), i = Math.floor(f), t = f - i, a = i * 3;
    return out.set(X[a] + (X[a + 3] - X[a]) * t, X[a + 1] + (X[a + 4] - X[a + 1]) * t, X[a + 2] + (X[a + 5] - X[a + 2]) * t);
  }

  /** What the route asks for at s: one of its attribute arrays (speed, roll, amp) or the fallback. */
  ask(arr, s, fallback) {
    if (!arr) return fallback;
    const L = this.length;
    if (this.closed) s = ((s % L) + L) % L;
    const f = clamp(s / this.step, 0, this.n - 1e-4), i = Math.floor(f);
    return arr[i] + (arr[i + 1] - arr[i]) * (f - i);
  }
}

// ------------------------------------------------------------------------------------------------ the swimming wave
/** Displacement (metres) and slope of the swimming wave `u` metres behind the snout: W[0], W[1]. */
const W = [0, 0];
function wave(spec, sc, u, phase, amp) {
  const L = spec.length * sc, F = spec.flex, lam = F.wavelength * L, u0 = F.from * L, k = TAU / lam, th = TAU * (u / lam - phase);
  let A = 0, dA = 0;
  if (u < u0) { const h = (F.head || 0) * L, e = 1 - u / u0; A = h * e * e; dA = -2 * h * e / u0; }
  else { const e = Math.min(1, (u - u0) / (L - u0)), p = F.power, t = F.tail * sc; A = t * Math.pow(e, p); dA = e > 0 ? t * p * Math.pow(e, p - 1) / (L - u0) : 0; }
  W[0] = amp * A * Math.sin(th); W[1] = amp * (dA * Math.sin(th) + A * k * Math.cos(th));
  return W;
}

// ------------------------------------------------------------------------------------------------ species
// What each kind is and does when left alone. Lengths in metres, speeds in m/s, angles in degrees.
//   cruise     its ordinary speed;  heavy: seconds its speed takes to follow a change (weight)
//   bank       [most it rolls into a turn, the turn radius at which it has rolled three quarters of that]
//   gait       how it spends its effort: beats then a glide (fish), or a steady stroke (whales)
//   minRadius  the tightest turn its joints allow at the model's own size
//   veilDeep   metres under the surface below which its body is drawn in full however flat the eye's ray to it (see SWIM_ALBEDO): 4 where
//              not given (a fish of clear inland water, seen among a drowned town); the animals of the open sea are veiled at every depth
//   lift       the depth down to which a point of it under water is drawn exactly where the eye sees it (see SWIM_SEEN_GLSL); below twice that it is
//              carried whole, only higher than it is: 1.2 m where not given (the same fish, which must stay among the things it swims among);
//              0 = at every depth, the true place (the open sea, where nothing else is drawn down there)
export const SPECIES = {
  carp: {
    file: 'carp', cruise: 0.6, top: 1.2, heavy: 2.6, bank: [9, 7], minRadius: 5,
    gait: { beats: [1, 2], glide: [3.5, 7.5], idle: 0.07, surge: 0.22 },
    ring: 0.35, mirror: true,
  },
  whale: {
    file: 'whale', cruise: 2.5, top: 4, heavy: 5, bank: [5, 90], minRadius: 45,
    gait: { surge: 0 }, ring: 1.5, ringWide: 6, mirror: true, traceDepth: 2, traceGain: 0.8, traceEvery: 1.2, veilDeep: 1e4,
    sheathShare: 1,      // its sheath is seen through six metres of water or not at all: twice as much of its skin is lit as a dolphin's
    lift: 0,
  },
  dolphin: {
    file: 'dolphin', cruise: 4, top: 9, heavy: 0.8, bank: [35, 3.5], minRadius: 2.4, turnGain: 2.4, turnTau: 0.28, maxPitch: 24, keepsPace: true,
    gait: { surge: 0 }, ring: 0.7, mirror: true, traceDepth: 1.2, traceGain: 0.35, traceEvery: 0.5, traceStride: 3, veilDeep: 1e4, lift: 0,
  },
  pike: {
    file: 'pike', cruise: 0.3, top: 3.4, heavy: 0.6, bank: [10, 0.9], minRadius: 0.38, turnGain: 2.0, turnTau: 0.35, maxPitch: 25,
    gait: { beats: [1, 2], glide: [1.2, 3], idle: 0.06, surge: 0.2 }, ring: 0.5, mirror: true, traceDepth: 0.3,
  },
};

// ------------------------------------------------------------------------------------------------ one swimmer
const WAKE = 32;                                       // points of comet kept per swimmer (option `wake`)
const CAP = 72;                                        // points of trail kept: the body samples it up to 1.1 lengths back

class Swimmer {
  constructor(sys, i) {
    const rec = sys.rec, spec = rec.spec, N = spec.stations.length;
    this.sys = sys; this.i = i; this.rnd = sys.ctx.rng((sys.seed | 0) * 131 + i * 17 + 3);
    this.scale = sys.scale; this.L = spec.length * sys.scale; this.h = this.L * 1.45 / (CAP - 8);
    this.trail = new Float32Array(CAP * 4); this.n = 0; this.odo = 0;
    this.head = new THREE.Vector3(); this.dir = new THREE.Vector3(0, 0, 1); this.velocity = new THREE.Vector3();
    this.speed = 0; this.want = sys.kind.cruise; this.speedTau = sys.kind.heavy; this.active = false;
    this.route = null; this.rs = 0; this.loop = false; this.onDone = null;
    this.phase = this.rnd(); this.amp = 0; this.effort = 1; this.gait = { beat: true, until: this.phase + 1.5, t: 0 };
    this.sink = 0; this.sinkWant = 0; this.sinkTau = 2; this.lift = 0;      // sink: the whole body lower by this (it settles); lift: the head's own path raised (it climbs)
    this.tip = 0; this.tipAt = 0;                                            // tip: the whole body turned nose-up by this angle (radians) about the point of its spine tipAt metres behind the snout, on top of the path's own slope (a rigid turn: nothing stretches)
    this.tipS = 0; this.tipC = 1; this.tipP = null;
    this.roll = 0; this.rollHead = 0; this.rollTail = 0;    // what the route asks at the snout; what the head has taken up; what the tail has (it follows late: a body twists a little, never like a screw)
    this.shapes = {}; for (const k in spec.shapes || {}) this.shapes[k] = 0;
    this.pose = new Float32Array(rec.bones.length * 3);
    this.D = Array.from({ length: N }, () => new THREE.Matrix4());
    this.Wm = rec.bones.map(() => new THREE.Matrix4());
    // station frames this frame, and where each was last frame (for what the fins feel)
    this.T = new Float64Array(N * 3); this.t = new Float64Array(N * 3); this.q = new Float64Array(N * 3); this.l1 = new Float64Array(N * 3); this.n1 = new Float64Array(N * 3);
    this.phi = new Float64Array(N); this.off = new Float64Array(N * 3); this.J = new Float64Array(N * 3); this.Jp = new Float64Array(N * 3); this.side = new Float64Array(N);
    this.turn = 0;                                    // how hard it is turning now: + to its left, about 1 at its tightest
    /** Per station: x, y, z of the spine and the body's radius there (realm coordinates): for drawing light round it. */
    this.body = new Float32Array(N * 4);
    this.above = new Uint8Array(N); this.wakeAt = 0; this.ringAt = -9;
    /** Named points of the body this frame (snout, eyes, fin tips, ...), as Vector3 in realm coordinates. */
    this.marks = {}; for (const mk of rec.marks) this.marks[mk.name] = new THREE.Vector3();
    this.springs = {};
    this.bornAt = -1e9;                               // when it was last put somewhere at once (the family's clock): what it lights fades in from then, and it lifts no swell at once
    this.state = {};                                  // the species' own memory
    /** Where its snout has been lately, for drawing a comet behind it: WAKE points of x, y, z, time (handle.time), newest at wakeAt - 1 (a ring). Kept when the option `wake` (seconds) is given. */
    this.wake = sys.wake ? new Float32Array(WAKE * 4).fill(-1e6) : null; this.wakeAt = 0; this.wakeT = 0;
  }

  /** Put it somewhere at once (it must be out of sight): the body is laid out behind the head along the route, or straight. */
  place(route, s = 0) {
    this.route = route; this.rs = s; this.n = CAP; this.odo = (CAP - 1) * this.h;
    for (let j = 0; j < CAP; j++) {
      const back = (CAP - 1 - j) * this.h;
      route.at(s - back, _v);
      const a = j * 4; this.trail[a] = _v.x; this.trail[a + 1] = _v.y + this.lift; this.trail[a + 2] = _v.z; this.trail[a + 3] = route.ask(route.roll, s - back, 0) * RAD;
    }
    route.at(s, this.head); this.head.y += this.lift;
    route.at(s + 0.1, _v).sub(route.at(s - 0.1, _v2)).normalize(); this.dir.copy(_v);
    this.roll = this.rollHead = this.rollTail = route.ask(route.roll, s, 0) * RAD;
    this.Jp.fill(NaN); this.above.fill(0); this.active = true; this.bornAt = this.sys.time;
  }

  /** Put it at a place at once, heading `yaw` (radians: 0 = toward +z), lying straight: for swimmers that steer themselves. */
  put(x, y, z, yaw = 0, pitch = 0) {
    this.route = null; this.next = null; this.n = CAP; this.odo = (CAP - 1) * this.h;
    this.dir.set(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch)); this.head.set(x, y, z); this.pitch = pitch; this.yawRate = 0;
    this.roll = this.rollHead = this.rollTail = 0; this.bornAt = this.sys.time;
    for (let j = 0; j < CAP; j++) { const back = (CAP - 1 - j) * this.h, a = j * 4; this.trail[a] = x - this.dir.x * back; this.trail[a + 1] = y - this.dir.y * back; this.trail[a + 2] = z - this.dir.z * back; this.trail[a + 3] = 0; }
    this.Jp.fill(NaN); this.above.fill(0); this.active = true;
  }

  /** At rest a body draws itself straight behind its head: ease the trail toward that line. */
  settle(dt, tau = 1.5) {
    const k = 1 - Math.exp(-dt / tau), tr = this.trail, h = this.h, lo = this.n - CAP, d = this.dir, H = this.head;
    for (let j = Math.max(0, lo); j < this.n; j++) {
      const back = this.odo - j * h, a = (j % CAP) * 4;
      tr[a] += (H.x - d.x * back - tr[a]) * k; tr[a + 1] += (H.y - d.y * back - tr[a + 1]) * k; tr[a + 2] += (H.z - d.z * back - tr[a + 2]) * k;
    }
  }

  /** The trail `u` metres behind the snout: writes x, y, z, roll into o[0..3]. */
  sample(u, o) {
    const h = this.h, tr = this.trail, target = this.odo - u, last = (this.n - 1) * h;
    let ax, ay, az, ar, bx, by, bz, br, t;
    if (target >= last) {
      const a = ((this.n - 1) % CAP) * 4; ax = tr[a]; ay = tr[a + 1]; az = tr[a + 2]; ar = tr[a + 3];
      bx = this.head.x; by = this.head.y; bz = this.head.z; br = this.roll;
      t = this.odo - last > 1e-9 ? (target - last) / (this.odo - last) : 0;
    } else {
      let j = Math.floor(target / h); const lo = this.n - CAP;
      t = target / h - j;
      if (j < lo) { t += j - lo; j = lo; }                                 // older than what is kept: run on straight
      const a = (((j % CAP) + CAP) % CAP) * 4, b = ((((j + 1) % CAP) + CAP) % CAP) * 4;
      ax = tr[a]; ay = tr[a + 1]; az = tr[a + 2]; ar = tr[a + 3]; bx = tr[b]; by = tr[b + 1]; bz = tr[b + 2]; br = tr[b + 3];
    }
    o[0] = ax + (bx - ax) * t; o[1] = ay + (by - ay) * t - this.sink; o[2] = az + (bz - az) * t; o[3] = ar + (br - ar) * clamp(t, 0, 1);
    if (this.tipS !== 0) {                                                 // the nose-up turn about the pivot (set up by lay)
      const P = this.tipP, rx = o[0] - P[0], ry = o[1] - P[1], rz = o[2] - P[2], a = rx * P[3] + rz * P[4], lx = rx - a * P[3], lz = rz - a * P[4];
      const a2 = a * this.tipC - ry * this.tipS, h2 = a * this.tipS + ry * this.tipC;
      o[0] = P[0] + a2 * P[3] + lx; o[1] = P[1] + h2; o[2] = P[2] + a2 * P[4] + lz;
    }
  }

  /** Move the head to (x, y, z), leaving trail behind it. */
  advance(x, y, z) {
    const hx = this.head.x, hy = this.head.y, hz = this.head.z, ds = Math.hypot(x - hx, y - hy, z - hz);
    if (ds < 1e-7) return 0;
    const o0 = this.odo, o1 = o0 + ds, h = this.h, tr = this.trail;
    while (this.n * h <= o1) {
      const t = (this.n * h - o0) / ds, a = (this.n % CAP) * 4;
      tr[a] = hx + (x - hx) * t; tr[a + 1] = hy + (y - hy) * t; tr[a + 2] = hz + (z - hz) * t; tr[a + 3] = this.roll;
      this.n++;
    }
    this.dir.set((x - hx) / ds, (y - hy) / ds, (z - hz) / ds);
    this.head.set(x, y, z); this.odo = o1;
    return ds;
  }

  /** Lay the spine on the trail and flex it: fills D (one matrix per station), J, body. */
  lay() {
    const spec = this.sys.rec.spec, S = spec.stations, N = S.length, sc = this.scale, L = this.L, F = spec.flex, sideways = F.plane === 'side';
    const T = this.T, t = this.t, q = this.q, l1 = this.l1, n1 = this.n1, phi = this.phi, off = this.off, J = this.J;
    const d = 0.02 * L, o = _o, kind = this.sys.kind;
    this.tipS = 0;
    if (this.tip) {                                                        // where the pivot is, and which way is forward there (level)
      const P = this.tipP || (this.tipP = [0, 0, 0, 0, 1]);
      this.sample(this.tipAt + d, o); const bx = o[0], bz = o[2];
      this.sample(this.tipAt - d, o); let fx = o[0] - bx, fz = o[2] - bz; const fl = Math.hypot(fx, fz) || 1;
      this.sample(this.tipAt, o); P[0] = o[0]; P[1] = o[1]; P[2] = o[2]; P[3] = fx / fl; P[4] = fz / fl;
      this.tipS = Math.sin(this.tip); this.tipC = Math.cos(this.tip);
    }
    let px = 0, py = 1, pz = 0;
    for (let k = 0; k < N; k++) {
      const u = S[k] * sc, a = k * 3;
      this.sample(u - d, o); const ax = o[0], ay = o[1], az = o[2];
      this.sample(u + d, o); let tx = ax - o[0], ty = ay - o[1], tz = az - o[2];
      const tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
      this.sample(u, o); T[a] = o[0]; T[a + 1] = o[1]; T[a + 2] = o[2];
      this.side[k] = this.rollHead + (this.rollTail - this.rollHead) * Math.min(1, u / L);     // the body lies over as one piece
      t[a] = tx; t[a + 1] = ty; t[a + 2] = tz;
      // the way up, with the back kept uppermost: n0 = up minus its part along t
      let nx = -tx * ty, ny = 1 - ty * ty, nz = -tz * ty; const nl = Math.hypot(nx, ny, nz);
      if (nl < 1e-4) { nx = px; ny = py; nz = pz; } else { nx /= nl; ny /= nl; nz /= nl; }
      px = nx; py = ny; pz = nz;
      n1[a] = nx; n1[a + 1] = ny; n1[a + 2] = nz;
    }
    // how hard the path turns at each station (to the animal's left is positive), and so how far it banks
    const bankMax = kind.bank[0] * RAD, bankR = kind.bank[1] * sc;
    let turnSum = 0;
    for (let k = 0; k < N; k++) {
      const a = k * 3, kp = Math.max(0, k - 1) * 3, kn = Math.min(N - 1, k + 1) * 3;
      const nx = n1[a], ny = n1[a + 1], nz = n1[a + 2], tx = t[a], ty = t[a + 1], tz = t[a + 2];
      const lx = ny * tz - nz * ty, ly = nz * tx - nx * tz, lz = nx * ty - ny * tx;                       // left = up x forward
      const span = Math.max(1e-6, (S[Math.min(N - 1, k + 1)] - S[Math.max(0, k - 1)]) * sc);
      const kappa = ((t[kp] - t[kn]) * lx + (t[kp + 1] - t[kn + 1]) * ly + (t[kp + 2] - t[kn + 2]) * lz) / span;
      turnSum += kappa;
      const b = bankMax * Math.tanh(kappa * bankR * 1.0) + this.side[k], c = Math.cos(b), s = Math.sin(b);
      n1[a] = nx * c + lx * s; n1[a + 1] = ny * c + ly * s; n1[a + 2] = nz * c + lz * s;
      l1[a] = lx * c - nx * s; l1[a + 1] = ly * c - ny * s; l1[a + 2] = lz * c - nz * s;
      const src = sideways ? l1 : n1; q[a] = src[a]; q[a + 1] = src[a + 1]; q[a + 2] = src[a + 2];
    }
    this.turn = clamp(turnSum / N * (kind.minRadius || 5) * sc, -1.5, 1.5);
    // the flex: the wave and the named shapes, as a lean at every station; no joint asked for more than its limit
    const amp = this.amp, lim = F.limit * RAD, u0 = F.from * L;
    let anchor = 0, best = 1e9;
    for (let k = 0; k < N; k++) {
      const u = S[k] * sc; let p = Math.atan(wave(spec, sc, u, this.phase, amp)[1]);
      for (const nm in this.shapes) { const w = this.shapes[nm]; if (w) p += spec.shapes[nm][k] * RAD * w; }
      phi[k] = p;
      if (Math.abs(u - u0) < best) { best = Math.abs(u - u0); anchor = k; }
    }
    const turnAt = (k) => { const a = k * 3, b = a + 3; return Math.abs(Math.asin(clamp(t[b] * q[a] + t[b + 1] * q[a + 1] + t[b + 2] * q[a + 2], -1, 1))); };
    for (let k = anchor; k < N - 1; k++) phi[k + 1] = phi[k] + softClip(phi[k + 1] - phi[k], Math.max(lim - turnAt(k), 0.25 * lim));
    for (let k = anchor; k > 0; k--) phi[k - 1] = phi[k] + softClip(phi[k - 1] - phi[k], Math.max(lim - turnAt(k - 1), 0.25 * lim));
    // places: each station is on the path, moved by what the flex between it and the pivot adds up to (so the body
    // keeps its length: where it leans across the path it also draws in along it)
    const y0 = wave(spec, sc, S[anchor] * sc, this.phase, amp)[0], aa = anchor * 3;
    off[aa] = q[aa] * y0; off[aa + 1] = q[aa + 1] * y0; off[aa + 2] = q[aa + 2] * y0;
    const stepTo = (i, j, sign) => {
      const a = i * 3, b = j * 3, du = (S[j] - S[i]) * sc * sign, pm = (phi[i] + phi[j]) / 2, c1 = 1 - Math.cos(pm), s1 = Math.sin(pm);
      let mx = t[a] + t[b], my = t[a + 1] + t[b + 1], mz = t[a + 2] + t[b + 2]; const ml = Math.hypot(mx, my, mz) || 1;
      let qx = q[a] + q[b], qy = q[a + 1] + q[b + 1], qz = q[a + 2] + q[b + 2]; const ql = Math.hypot(qx, qy, qz) || 1;
      const from = sign > 0 ? a : b, to = sign > 0 ? b : a;
      off[to] = off[from] + du * (mx / ml * c1 + qx / ql * s1); off[to + 1] = off[from + 1] + du * (my / ml * c1 + qy / ql * s1); off[to + 2] = off[from + 2] + du * (mz / ml * c1 + qz / ql * s1);
    };
    for (let k = anchor; k < N - 1; k++) stepTo(k, k + 1, 1);
    for (let k = anchor; k > 0; k--) stepTo(k - 1, k, -1);
    // frames
    const body = this.body, sec = spec.section;
    for (let k = 0; k < N; k++) {
      const a = k * 3, c = Math.cos(phi[k]), s = Math.sin(phi[k]);
      const fx = t[a] * c - q[a] * s, fy = t[a + 1] * c - q[a + 1] * s, fz = t[a + 2] * c - q[a + 2] * s;
      const qx = q[a] * c + t[a] * s, qy = q[a + 1] * c + t[a + 1] * s, qz = q[a + 2] * c + t[a + 2] * s;
      let lx, ly, lz, nx, ny, nz;
      if (sideways) { lx = qx; ly = qy; lz = qz; nx = n1[a]; ny = n1[a + 1]; nz = n1[a + 2]; } else { nx = qx; ny = qy; nz = qz; lx = l1[a]; ly = l1[a + 1]; lz = l1[a + 2]; }
      const jx = T[a] + off[a], jy = T[a + 1] + off[a + 1], jz = T[a + 2] + off[a + 2], us = S[k] * sc;
      J[a] = jx; J[a + 1] = jy; J[a + 2] = jz;
      const e = this.D[k].elements;
      e[0] = lx * sc; e[1] = ly * sc; e[2] = lz * sc; e[3] = 0; e[4] = nx * sc; e[5] = ny * sc; e[6] = nz * sc; e[7] = 0; e[8] = fx * sc; e[9] = fy * sc; e[10] = fz * sc; e[11] = 0;
      e[12] = jx + fx * us; e[13] = jy + fy * us; e[14] = jz + fz * us; e[15] = 1;
      body[k * 4] = jx; body[k * 4 + 1] = jy; body[k * 4 + 2] = jz; body[k * 4 + 3] = Math.max(sec[k][0], 0.5 * (sec[k][1] + sec[k][2])) * sc;
    }
  }

  /** Set a bone's turn for this frame: degrees, as in the model's script (x bends, y twists, z swings; _R mirrored for you). */
  bone(name, x, y, z) { const j = this.sys.rec.index[name]; if (j === undefined) return; const p = this.pose; p[j * 3] = x; p[j * 3 + 1] = y; p[j * 3 + 2] = z; }
  /** The same for a left and right pair: `name` without its _L or _R; l and r multiply the sideways parts for each side. */
  pair(name, x, y, z, xr = x, yr = y, zr = z) { this.bone(name + '_L', x, y, z); this.bone(name + '_R', xr, yr, zr); }

  /** A damped spring per name: returns its value after dt, pulled toward target. For fins that lag behind the body. */
  spring(name, target, dt, w0 = 5, zeta = 0.75) {
    const s = this.springs[name] || (this.springs[name] = { x: target, v: 0 });
    const steps = dt > 0.02 ? 2 : 1, h = dt / steps;
    for (let i = 0; i < steps; i++) { s.v += (-2 * zeta * w0 * s.v - w0 * w0 * (s.x - target)) * h; s.x += s.v * h; }
    return s.x;
  }

  /** How fast station k is moving to the animal's own left, m/s (what a fin there feels). */
  sideSpeed(k, dt) {
    const a = k * 3, J = this.J, Jp = this.Jp, l = this.l1;
    if (!(dt > 0) || Number.isNaN(Jp[a])) return 0;
    return ((J[a] - Jp[a]) * l[a] + (J[a + 1] - Jp[a + 1]) * l[a + 1] + (J[a + 2] - Jp[a + 2]) * l[a + 2]) / dt;
  }

  /** How fast station k is moving toward the animal's own back, m/s (what a fluke there feels). */
  upSpeed(k, dt) {
    const a = k * 3, J = this.J, Jp = this.Jp, n = this.n1;
    if (!(dt > 0) || Number.isNaN(Jp[a])) return 0;
    return ((J[a] - Jp[a]) * n[a] + (J[a + 1] - Jp[a + 1]) * n[a + 1] + (J[a + 2] - Jp[a + 2]) * n[a + 2]) / dt;
  }

  /** Bones to matrices, into the texture row. */
  write(out) {
    const rec = this.sys.rec, bones = rec.bones, Wm = this.Wm, pose = this.pose, D = this.D;
    for (const j of rec.order) {
      const b = bones[j], w = Wm[j];
      let m;
      if (b.station >= 0) { w.multiplyMatrices(D[b.station], b.restWorld); m = D[b.station]; }
      else {
        if (b.parent < 0) w.multiplyMatrices(D[0], b.restWorld); else w.multiplyMatrices(Wm[b.parent], b.local);
        const x = pose[j * 3], y = pose[j * 3 + 1], z = pose[j * 3 + 2];
        if (x !== 0 || y !== 0 || z !== 0) { _e.set(x * RAD, y * RAD * b.sign, z * RAD * b.sign, 'ZXY'); w.multiply(_m.makeRotationFromEuler(_e)); }
        m = _m2.multiplyMatrices(w, b.inv);
      }
      out.set(m.elements, j * 16);
    }
    for (const mk of rec.marks) {
      const b = bones[mk.bone];
      const m = b.station >= 0 ? D[b.station] : _m2.multiplyMatrices(Wm[mk.bone], b.inv);
      this.marks[mk.name].copy(mk.at).applyMatrix4(m);
    }
    this.Jp.set(this.J);
  }
}
const _o = [0, 0, 0, 0];
const GUARD_SPANS = [['fluke_L', 'notch'], ['fluke_R', 'notch'], ['flipper_L', 'shoulder_L'], ['flipper_R', 'shoulder_R'], ['tail_top', 'tail_low']];      // long parts between two marks: the keep-out guard looks half way along them too

// ------------------------------------------------------------------------------------------------ the shader
const SWIM_VERT_PARS = () => /* glsl */`${SWIM_SEEN_GLSL}
  attribute vec4 skinIndex; attribute vec4 skinWeight; attribute float aSwimmer; varying vec3 vSwimRest, vSwimRestN;      // the point and its normal as modelled (the snout at z = 0, the tail at -length, the back +y)
  varying float vSwimDeep, vSwimCos; varying vec3 vSwimTint;      // how far under the water this point really is; the cosine of the angle at which the eye's ray to it meets the surface (1 = straight down); the swimmer's own tint
  uniform highp sampler2D tSwimBones; uniform float uSwimLift;
  mat4 swimBone(float j, float row) {
    int x = int(j + 0.5) * 4, y = int(row + 0.5);
    return mat4(texelFetch(tSwimBones, ivec2(x, y), 0), texelFetch(tSwimBones, ivec2(x + 1, y), 0), texelFetch(tSwimBones, ivec2(x + 2, y), 0), texelFetch(tSwimBones, ivec2(x + 3, y), 0));
  }`;
const SWIM_VERT = /* glsl */`
    vSwimRest = transformed; vSwimRestN = objectNormal;
    #ifdef USE_INSTANCING_COLOR
      vSwimTint = instanceColor;
    #else
      vSwimTint = vec3(1.0);
    #endif
    mat4 swimM =swimBone(skinIndex.x, aSwimmer) * skinWeight.x + swimBone(skinIndex.y, aSwimmer) * skinWeight.y + swimBone(skinIndex.z, aSwimmer) * skinWeight.z + swimBone(skinIndex.w, aSwimmer) * skinWeight.w;
    transformed = (swimM * vec4(transformed, 1.0)).xyz;
    objectNormal = mat3(swimM) * objectNormal;`;
// Seen from above the water, what lies under it looks shallower than it is, because the surface bends the light: by a
// quarter looking straight down, by two thirds at 60 degrees, by nine tenths along the water. The ride's water does
// not do this (it draws what is beneath where it is, and only wavers it), so a body just under the surface ten metres
// off stood whole and side-on, like a toy on a sheet of glass, with nothing to show where the water cut it. Here every
// point of a swimmer under the surface is raised toward where the eye would see it. A back that breaks the surface
// then has a waterline: what is out keeps its shape, and what is under is drawn up thin beneath it. For the carp and
// the pike the lift is in full down to 1.2 m and lets go below it, until a deep fish is carried whole (they swim among things the ride
// draws where they are); the whale and the dolphins are drawn where the eye would truly see them at every depth: a
// whale seven metres under the keel is then seen beside the hull, where the rider can look, and one sounding forty
// metres off lies flat under the surface out there instead of standing in the water at the rider's feet. (Options
// refract: false, lift.) What the eye could not see at all through the surface is then taken away: SWIM_ALBEDO.
/**
 * GLSL, for a vertex shader (the engine's shared uCameraPos is the eye):
 *   float swimSeenY(vec3 p, vec3 eye)                               the height at which a point under the water (p.y < 0, the water at 0) is
 *                                                                   SEEN from an eye above it, exactly so down to 1.2 m (the carp, the pike)
 *   float swimSeenCap(vec3 p, vec3 eye, float cap, out float glance)   the same with that depth given (handle.lift; 0 = at every depth: the whale, the
 *                                                                   dolphins) and how flat the eye's ray to the point meets the water
 * A realm that draws something of its own at a swimmer's marks or along its wake, under the surface, must raise it the
 * same way or it will stand apart from the body: wp.y = swimSeenCap(wp.xyz, uCameraPos, lift, glance). On the CPU:
 * seenY(ctx, x, y, z, handle.lift).
 */
export const SWIM_SEEN_GLSL = /* glsl */`
  // cap: the depth, metres, down to which the point is drawn exactly where it is seen; below twice that it is carried rigidly (0 or less: no limit, the true place at every depth).
  // glance: the cosine of the angle (from straight down) at which the eye's ray to the point meets the surface: 1 looking
  // straight down on it, near 0 along the water, 1 for a point that is not under water at all
  float swimSeenCap(vec3 p, vec3 eye, float cap, out float glance) {
    glance = 1.0;
    if (p.y >= 0.0 || eye.y < 0.05) return p.y;
    float d = -p.y, run = length(p.xz - eye.xz), k = 0.6, c = 1.0;
    // how much of its depth is carried as it is (none down to the cap, all that lies below twice the cap), and the rest, which is bent
    float still = 0.0;
    if (cap > 0.0) { float u = clamp((d - cap) / cap, 0.0, 1.0); still = cap * u * u * u * (1.0 - 0.5 * u) + max(d - 2.0 * cap, 0.0); }
    float bent = d - still;
    for (int i = 0; i < 4; i++) {
      float rise = eye.y + k * bent; c = rise / sqrt(run * run + rise * rise);    // the cosine of the ray's angle from straight down, where it meets the surface
      k = 0.752 * c / sqrt(1.0 - (1.0 - c * c) * 0.565);                         // tan(refracted) / tan(incident), water's index 1.33
    }
    glance = c;
    // Without a cap (the animals of the open sea) the point is drawn where the eye would truly see it, at every depth.
    // With one, it is drawn so down to that many metres under the surface: where a body meets the water, where the eye
    // judges it against the waterline, and where a fish seen from ten metres off is truly no more than a streak under
    // the surface. Deeper, the bending is let go, until below twice that depth the body is simply carried higher than
    // it is, whole and undistorted (by 1.5 times the cap looking along the water, by a third of it looking straight
    // down): for a fish that swims among other things under clear water (a town, a school, a bed), which the ride
    // draws where they are: the true lift, which grows without end with depth, would float it far above them. Nothing
    // is ever stretched: a metre of fish is drawn as a metre or less.
    // (Tried and dropped: a lift that faded back to nothing with depth, which has to stretch the body on the way, and a
    // carp 4 m down came out a quarter too deep in the body; and a lift that began to let go at the surface itself,
    // cap * (1 - exp(-lift / cap)): a carp rising ten metres off kept two thirds of its depth under the water and stood
    // in it side-on, a fish cut out of card, where the eye would see a low streak with a wet back above it.)
    return -(still + bent * k);
  }
  float swimSeen(vec3 p, vec3 eye, out float glance) { return swimSeenCap(p, eye, 1.2, glance); }
  float swimSeenY(vec3 p, vec3 eye) { float g; return swimSeenCap(p, eye, 1.2, g); }`;
/**
 * The same on the CPU: the height at which the rider sees a point (x, y, z) of the realm that lies under the water.
 * cap: the depth down to which it is exactly so, metres (1.2: the carp's and the pike's; 0: at every depth, the whale's and the dolphins': a
 * swimmer's own is handle.lift).
 */
export function seenY(ctx, x, y, z, cap = 1.2) {
  const eye = ctx.engine.shared.uCameraPos.value;
  if (y >= 0 || eye.y < 0.05) return y;
  const d = -y, run = Math.hypot(x - eye.x, z - eye.z); let k = 0.6, still = 0;
  if (cap > 0) { const u = clamp((d - cap) / cap, 0, 1); still = cap * u * u * u * (1 - 0.5 * u) + Math.max(d - 2 * cap, 0); }
  const bent = d - still;
  for (let i = 0; i < 4; i++) { const rise = eye.y + k * bent, c = rise / Math.hypot(run, rise); k = 0.752 * c / Math.sqrt(1 - (1 - c * c) * 0.565); }
  return -(still + bent * k);
}
const SWIM_VERT_WORLD = /* glsl */`
    vSwimDeep = max(-wp.y, 0.0);
    float swimY = swimSeenCap(wp.xyz, uCameraPos, uSwimLift, vSwimCos);
    #ifdef SWIM_REFRACT
      wp.y = swimY;
    #endif`;
const SWIM_FRAG_PARS = /* glsl */`uniform float uSwimThin; uniform vec3 uSwimGlow; uniform vec4 uSwimGlowB; varying vec3 vSwimRest, vSwimRestN;
  varying float vSwimDeep, vSwimCos; varying vec3 vSwimTint;
  uniform vec3 uSwimPlain, uSwimWaterDeep, uSwimWaterShallow; uniform vec2 uSwimVeil;      // (how much is veiled 0..1, the depth below which the body is left as drawn)
  // Light the water makes where the body stirs it: the water's own flecks (the very mask its light from touch is cut
  // with: src/engine/water-final-trace.js), laid on the skin and sliding toward the tail. The mask is laid on the body
  // as modelled (the snout at z = 0, the tail at -length, the back +y): from above and below on what faces up or down
  // (the back, the belly, flukes, flippers), from the side on the flanks. Every fleck of it has its own threshold, so
  // as the light E rises they come one by one, and as the pattern slides through places where E is higher or lower
  // they kindle and go out. Never a wash, never a net.
  // (The sheath was first a camouflage of patches, then separate round dabs in a grid of cells: on a whale seen from
  // above through the water, green polka dots.)
  uniform sampler2D tSwimFleck;
  float swimFleckAt(vec2 uv, float lod, float E) {
    vec2 f = textureLod(tSwimFleck, uv, lod).rg; float cut = 1.02 - E * 0.8;
    return smoothstep(cut, cut + 0.2, f.r) * f.g * (0.55 + 0.75 * f.g);
  }
  float swimFlecks(vec3 r, vec3 n, float tile, float slide, float shift, float E) {
    float fp = max(length(dFdx(r)), length(dFdy(r))), lod = log2(max(fp * 512.0 / tile, 1.0));
    vec2 w = pow(abs(n.xy), vec2(6.0)); w /= max(w.x + w.y, 1e-5);                                  // how far this skin faces sideways (x) or up and down (y)
    float u = (r.z + slide) / tile + shift;
    float flecks = w.y * swimFleckAt(vec2(u, r.x / tile + shift * 1.7), lod, E) + w.x * swimFleckAt(vec2(u + 0.5, r.y / tile + shift * 2.3), lod, E);
    return mix(flecks, E * E * 0.16, smoothstep(1.5, 3.5, lod));                                    // too far off to tell flecks apart: a faint even light
  }`;
// WHAT THE EYE CANNOT SEE THROUGH THE SURFACE. A body under water is seen through the surface, and the flatter the eye's
// ray meets the water the less of it comes through: looking down beside the boat a fish is seen whole; eight metres
// off, along the water, it is a pale shape with nothing drawn on it; further still it is not seen at all, only what
// stands out of the water. The ride's water does not do this by itself (near the boat it is a clear window at every
// angle, on purpose: the town below is seen through it; and what lies deep is drawn straight below where it is, as if
// through glass). So a carp a hand under the surface ten metres off was drawn in full, every scale of it, squeezed
// flat by the bending of the light: a sticker of a fish laid on the water; and a whale sounding forty metres away was
// drawn under the sea at the rider's feet, a wedge of lit dots. Here the part of a swimmer that lies just under the
// surface loses its drawing and goes to the water's own colour as the ray to it flattens, and the light the water
// makes on its skin goes out with it (option `veil`; the ray is the true one, bent at the surface: swimSeen works it
// out for every point). For a fish of clear inland water the BODY is left as drawn once it is deeper than a few metres
// (option `veilDeep`): there it is whole and unsquashed, and it swims among whatever else the realm shows down there (a
// town seen through a clear window, which is drawn as if through glass). In the open sea there is nothing down there
// to agree with, and a great body is veiled at every depth.
const SWIM_ALBEDO = /* glsl */`
    float swimFlat = 1.0 - smoothstep(0.08, 0.36, vSwimCos);                                    // how flat the eye's ray to this point meets the water: 0 from above, 1 along it
    float swimDim = uSwimVeil.x * smoothstep(0.0, 0.12, vSwimDeep) * swimFlat;                  // how much of the light on its skin is lost
    float swimLost = swimDim * (1.0 - smoothstep(0.25 * uSwimVeil.y, uSwimVeil.y, vSwimDeep));  // how much of the body's own colours
    albedo = mix(albedo, uSwimPlain * vSwimTint, swimLost * 0.55);                              // (its drawing goes soft, not out: all the way to one plain colour, a dolphin four metres off by day was a grey slug without its cape)`;
// thin parts (the webs of fins: the model's vertex alpha) let the light through: lit from the far side, they glow in their own colour
const SWIM_LIGHT = /* glsl */`
    float swimMask = 0.0;
    #ifdef USE_COLOR_ALPHA
      swimMask = 1.0 - vColor.a;
      c += albedo * uRampLight * uKeyColor * (max(dot(N, uKeyDir), 0.0) * swimMask * uSwimThin * (1.0 - swimLost));
    #endif
    if (swimLost > 0.0) {
      // (the colour the water itself has there when nothing lies under it: src/engine/water-final.js, "the body of the water")
      vec3 swimWater = mix(uSwimWaterDeep, uSwimWaterShallow, pow(clamp(V.y, 0.0, 1.0), 1.5) * (1.0 - smoothstep(4.0, 70.0, length(uCameraPos - vWPos))));
      c = mix(c, swimWater, swimLost * 0.86);
    }
    if (uSwimGlowB.w > 0.0) {
      // The sheath is light the WATER makes: it lives on skin that is under water and along the line where water
      // sheets off a back, and there is none on skin that stands in the air (a body lit all over above the water is a
      // creature that glows of itself, which the sea forbids).
      float swimY = vWPos.y, swimWet = 1.0 - smoothstep(0.03, 0.4, swimY), swimLine = exp(-swimY * swimY / 0.02);
      float swimTile = 1.0 / uSwimGlowB.x, swimSlide = uTime * uSwimGlowB.y; vec3 swimN = normalize(vSwimRestN);
      // how lit the water is on this part of the skin: most where the body stirs it most (the model's mask: the snout, the
      // leading edges of flippers and flukes), and never the same in one place for long
      float swimPatch = 0.64 + 0.36 * sin(vSwimRest.z * 4.3 / swimTile + uTime * 0.31 + 1.7 * sin(vSwimRest.x * 3.1 / swimTile + vSwimRest.y * 2.3 / swimTile + uTime * 0.17));
      float swimE = clamp(uSwimGlowB.z * (0.34 + 0.66 * swimMask) * swimPatch, 0.0, 0.95);
      float flecks = swimFlecks(vSwimRest, swimN, swimTile, swimSlide, 0.0, swimE) + 0.7 * swimFlecks(vSwimRest, swimN, swimTile * 0.53, swimSlide * 1.35, 0.37, swimE * 0.9);
      // where the back meets the water: small flecks close together, a broken line and never two lone bright spots (a pair of lights on a dark body is a pair of eyes)
      float line = swimFlecks(vSwimRest, swimN, swimTile * 0.31, swimSlide * 1.7, 0.71, 0.86) + 0.7 * swimFlecks(vSwimRest, swimN, swimTile * 0.19, swimSlide * 2.1, 0.13, 0.8);
      glow += uSwimGlow * (uSwimGlowB.w * (1.0 - 0.94 * swimDim) * (flecks * swimWet * (1.0 - 0.6 * swimLine) + line * swimLine * 0.55));      // (light under the water is lost at a glance like the body it lies on)
    }`;

// ------------------------------------------------------------------------------------------------ the factory
/**
 * Make one kind of swimmer for a realm. Resolves to a handle. options:
 *   species      'carp' | 'whale' | 'dolphin' | 'pike'
 *   count        how many (default 1; they share one draw call)
 *   route        where it swims when left alone: { points: [[x, y, z, { speed, roll, amp }?], ...], closed } or a SwimRoute
 *   speed        its ordinary speed, m/s (default: the species' own)
 *   scale        size against the model's own (1 = the old carp's 3.2 m, the whale's 25 m)
 *   tint         a colour over its paint, or one per individual
 *   seed         for everything random about it
 *   ripples      true (default): it rings the water wherever it breaks or dents it
 *   trace        a channel of the water's trace to write where it breaks the surface: 'glow' (the sea) or 'lane'
 *   onTouch      (x, z, kind, swimmer) => {}   every mark it makes on the water, for a sound: 'emerge', 'submerge', 'wake', ...
 *   mirror       false keeps it out of the water's mirror (it never surfaces in this realm)
 *   stride       body lengths it travels in one stroke (default: the animal's own, from its model: carp 0.75, whale 0.6, dolphin 1.2, pike 0.55)
 *   exact        true: `count` is not thinned at lower quality
 *   wake         seconds of its snout's track to keep for drawing a comet behind it (swimmer.wake; the dolphins: 3)
 *   keepOut      metres it keeps from the rider's eye (default 0.7)
 *   sheath       { color, strength, size, share, stream }: flecks of light on its skin that slide aft, strongest where the body stirs
 *                the water most (the sea's whale: '#b4e86a', 2.5). size: metres to one repeat of the water's fleck mask on the skin
 *                (default 0.42 of its length); share: how much of them is lit, 0..1. Drive handle.sheath.strength from the realm
 *   material     gouache options (brush, shade, rim, caustics, emissive, extend, ...);  thin: 0..1 how much fins let the light through (0.6)
 *   refract      false: draw what is under water where it is, not lifted to where the eye sees it (see SWIM_SEEN_GLSL)
 *   lift         the depth, metres, down to which it is drawn exactly where the eye sees it; below twice that it is carried whole, at most
 *                1.5 times this higher than it is (carp and pike 1.2; whale and dolphin 0 = at every depth: the true place)
 *   veil         0..1 (default 1): how much of what the eye could not see through the surface is taken away (see SWIM_ALBEDO); false = 0
 *   veilDeep     metres down below which the body is drawn in full whatever the angle (carp and pike 4; whale and dolphin: never)
 *   parent       the group to add it to (default ctx.group);  hidden: true starts it unseen and still
 * and what each species adds (see its setup below): the whale's blow, pour, printDepth; the dolphins' stations, stem; the pike's at, toward, refuge, shy, away.
 */
export async function makeSwimmer(ctx, options = {}) {
  const kind = SPECIES[options.species];
  if (!kind) throw new Error(`makeSwimmer: no species called '${options.species}' (${Object.keys(SPECIES).join(', ')})`);
  const { kit, engine } = ctx;
  const rec = await loadFile(kind.file);
  rec.refs++;
  const count = Math.max(1, options.exact || !(options.count > 1) ? (options.count || 1) : kit.count(options.count));
  const nb = rec.bones.length;
  const sys = { ctx, rec, kind: { ...kind, cruise: options.speed ?? kind.cruise }, seed: options.seed ?? 1, scale: options.scale ?? 1, count, time: 0, calm: !!ctx.reducedMotion, wake: options.wake || 0 };

  // ---- the mesh: the model's own geometry, one instance per swimmer, bones from a float texture
  const geo = rec.geometry.clone();
  const idx = new Float32Array(count); for (let i = 0; i < count; i++) idx[i] = i;
  geo.setAttribute('aSwimmer', new THREE.InstancedBufferAttribute(idx, 1));
  const data = new Float32Array(nb * 16 * count);
  const tex = new THREE.DataTexture(data, nb * 4, count, THREE.RGBAFormat, THREE.FloatType);
  tex.minFilter = tex.magFilter = THREE.NearestFilter; tex.generateMipmaps = false; tex.needsUpdate = true;
  const uThin = { value: options.thin ?? 0.6 };
  const sh = options.sheath || null, L0 = rec.spec.length;
  const uGlow = { value: new THREE.Color(sh ? sh.color ?? '#b4e86a' : '#000000') };
  // 1 / the metres to one repeat of the water's fleck mask on the skin (0.42 of the body's length, about its girth: the flecks of a whale are 7 to 35 cm across, of a dolphin 1 to 4 cm), how fast they slide aft, how many of them are lit (0..1), strength
  const uGlowB = { value: new THREE.Vector4(1 / (sh && sh.size ? sh.size : Math.max(L0 * sys.scale * 0.42, 0.3)), sh ? sh.stream ?? 1.1 : 0, sh ? sh.share ?? kind.sheathShare ?? 0.5 : 0, sh ? sh.strength ?? 2.5 : 0) };
  const mopt = options.material || {};
  // what the eye cannot see through the surface (see SWIM_ALBEDO): how much of it (option `veil`, 0..1), the animal's general colour, the water's own two colours (kept in step with the realm's water every frame)
  const uVeil = { value: new THREE.Vector2(options.veil === false ? 0 : clamp(options.veil ?? 1, 0, 1), Math.max(0.5, options.veilDeep ?? kind.veilDeep ?? 4)) }, uPlain = { value: rec.plain.clone() };
  const uWaterDeep = { value: new THREE.Color('#06182b') }, uWaterShallow = { value: new THREE.Color('#17505f') };
  const uLift = { value: options.lift ?? kind.lift ?? 1.2 };            // the depth down to which a point under water is drawn exactly where the eye sees it (0: at every depth)
  const material = kit.gouache({ brush: 0.5, ...mopt, vertexColors: true,
    extend: [{ defines: options.refract === false ? {} : { SWIM_REFRACT: '' },
      uniforms: { tSwimBones: { value: tex }, tSwimFleck: { value: sh ? fleckTexture(ctx) : null }, uSwimLift: uLift, uSwimThin: uThin, uSwimGlow: uGlow, uSwimGlowB: uGlowB, uSwimVeil: uVeil, uSwimPlain: uPlain, uSwimWaterDeep: uWaterDeep, uSwimWaterShallow: uWaterShallow },
      vertexPars: SWIM_VERT_PARS(), vertexLocal: SWIM_VERT, vertexWorld: SWIM_VERT_WORLD, fragmentPars: SWIM_FRAG_PARS, albedo: SWIM_ALBEDO, light: SWIM_LIGHT }].concat(mopt.extend || []) });
  const mesh = new THREE.InstancedMesh(geo, material, count);
  mesh.name = `swimmers:${options.species}`;
  mesh.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6);
  mesh.matrixAutoUpdate = false;
  if (options.tint) { const c = new THREE.Color(); for (let i = 0; i < count; i++) mesh.setColorAt(i, c.set(Array.isArray(options.tint) ? options.tint[i % options.tint.length] : options.tint)); }
  if ((options.mirror ?? kind.mirror) === false) ctx.only(mesh, 'direct');
  (options.parent || ctx.group).add(mesh);
  const zero = new Float32Array(nb * 16);

  const list = Array.from({ length: count }, (_, i) => new Swimmer(sys, i));
  const toRoute = (r) => (r instanceof SwimRoute ? r : r ? new SwimRoute(r.points || r, { closed: !!r.closed }) : null);
  const touch = (x, z, strength, radius, kind_, sw) => {
    if (options.ripples !== false && strength > 0) ctx.water.ripple(x, z, strength, radius);
    if (options.onTouch) options.onTouch(x, z, kind_, sw);
  };
  sys.touch = touch; sys.options = options;

  const handle = {
    object: mesh, material, species: options.species, count, length: rec.spec.length * sys.scale, spec: rec.spec, triangles: rec.triangles * count,
    /** The swimmers themselves: each has head, dir, speed, body (x, y, z, radius per station), marks, active. */
    swimmers: list,
    /** The light the water makes on its skin (option `sheath`): set .strength (0 = none) and .color at any time, from the realm's own measure of how lit the sea is. */
    sheath: { color: uGlow.value, get strength() { return uGlowB.value.w; }, set strength(v) { uGlowB.value.w = v; } },
    /** How much of what the eye could not see through the surface is taken away (option `veil`): 1 = as the eye would see it, 0 = everything under water drawn in full. Live. */
    get veil() { return uVeil.value.x; }, set veil(v) { uVeil.value.x = clamp(v, 0, 1); },
    /** The depth down to which it is drawn exactly where the eye sees it, metres (the option `lift`; 0: at every depth). Pass it to seenY, or to swimSeenCap in a shader, for anything drawn at its marks. */
    lift: options.refract === false ? null : uLift.value,
    /** Marks it has left on the surface, newest last: { x, z, r, t, kind } with t on the clock `handle.time` ('fluke': a flukeprint; 'foot': the footprint where it sounded). */
    prints: [],
    get time() { return sys.time; },
    /** Seconds of each snout's track kept in swimmer.wake (the option `wake`). */
    wakeSeconds: sys.wake,
    /**
     * Send it along a route: { points, closed } or a SwimRoute. opts: speed (m/s), from (metres along the route to start
     * at), jump: true puts it there at once (only when it cannot be seen), onDone(swimmer), keep, who (index; default all).
     *   in, at    its snout reaches the route's point number `at` (0 = the first; default 0) `in` seconds from now: it is
     *             put that far back along the route at once (as jump: that place must be out of sight). On an open route
     *             it may start before the first point, on the straight line the route begins along
     */
    swim(route, opts = {}) {
      const r = toRoute(route);
      for (const sw of pick(opts.who)) {
        let from = opts.from || 0, jump = !!opts.jump;
        if (opts.in != null) { const v = (opts.speed ?? r.ask(r.speed, r.ctrlS[clamp(opts.at ?? 0, 0, r.ctrlS.length - 1)], sw.want)) * (sys.calm ? 0.85 : 1); from = r.ctrlS[clamp(opts.at ?? 0, 0, r.ctrlS.length - 1)] - v * opts.in; jump = true; }
        if (jump || !sw.active) { sw.place(r, from); sw.next = null; sw.speed = r.ask(r.speed, from, opts.speed ?? sw.want); }     // it is already under way
        else {                                             // from where it is: a smooth run-in that meets the new line a few lengths on
          const lead = sw.L * 0.6, h = sw.head, d = sw.dir;
          let se = from;
          if (r.closed && opts.from == null) {             // a patrol is joined at its nearest point ahead
            let best = 1e18; _v2.copy(h).addScaledVector(d, sw.L * 2);
            for (let q = 0; q < r.length; q += r.length / 64) { const dd = r.at(q, _v).distanceToSquared(_v2); if (dd < best) { best = dd; se = q; } }
          }
          const e0 = r.at(se, _v).clone(), e1 = r.at(se + lead, _v).clone();
          const run = new SwimRoute([[h.x - d.x * lead, h.y - d.y * lead - sw.lift, h.z - d.z * lead], [h.x, h.y - sw.lift, h.z], [h.x + d.x * lead, h.y + d.y * lead - sw.lift, h.z + d.z * lead],
            [e0.x, e0.y, e0.z], [e1.x, e1.y, e1.z]]);
          sw.route = run; sw.rs = run.ctrlS[1]; sw.next = { route: r, s: se, at: run.ctrlS[3] };
        }
        if (r.minRadius < (kind.minRadius || 0) * sys.scale * 0.8) console.warn(`swimmers: a route for the ${options.species} turns in ${r.minRadius.toFixed(1)} m; its body needs ${(kind.minRadius * sys.scale).toFixed(1)} m`);
        if (opts.speed != null) sw.want = opts.speed;
        sw.onDone = opts.onDone || null; sw.keep = !!opts.keep; sw.active = true;
      }
      return handle;
    },
    /** Ease its speed to v (m/s) over about `seconds`. */
    speedTo(v, seconds, who) { for (const sw of pick(who)) { sw.want = v; if (seconds != null) sw.speedTau = Math.max(0.2, seconds / 2.5); } return handle; },
    /** Let the whole body settle `depth` metres lower (0 = back to its line), over about `seconds`. */
    sink(depth, seconds = 4, who) { for (const sw of pick(who)) { sw.sinkWant = depth; sw.sinkTau = Math.max(0.3, seconds / 3); } return handle; },
    hide(who) { for (const sw of pick(who)) sw.active = false; return handle; },
    dispose() { /* the realm frees the mesh, the material and the texture when it is thrown away */ },
  };
  const pick = (who) => (who == null ? list : [list[who]]);
  sys.handle = handle;
  if (kind.setup) kind.setup(sys, handle, options);
  if (options.route && !options.hidden) handle.swim(options.route, { jump: true, from: options.from || 0 });

  const cam = new THREE.Vector3(), centre = new THREE.Vector3();
  ctx.onUpdate((dt) => {
    sys.time += dt; sys.calm = !!ctx.reducedMotion;
    { const WL = ctx.waterLook; if (WL) { if (WL.deep && WL.deep.isColor) uWaterDeep.value.copy(WL.deep); if (WL.shallow && WL.shallow.isColor) uWaterShallow.value.copy(WL.shallow); } }
    cam.copy(engine.shared.uCameraPos.value); mesh.parent.worldToLocal(cam);
    let seen = 0; centre.set(0, 0, 0);
    for (const sw of list) {
      const row = data.subarray(sw.i * nb * 16, (sw.i + 1) * nb * 16);
      if (!sw.active) { row.set(zero); continue; }
      step(sys, sw, dt, cam);
      sw.write(row);
      surface(sys, sw, dt);
      seen++; centre.add(sw.head);
    }
    tex.needsUpdate = true;
    mesh.visible = seen > 0;
    if (seen) { centre.multiplyScalar(1 / seen); let r = 0; for (const sw of list) if (sw.active) r = Math.max(r, sw.head.distanceTo(centre) + sw.L * 1.2); mesh.boundingSphere.center.copy(centre); mesh.boundingSphere.radius = r; }
  });
  ctx.onDispose(() => { if (--rec.refs <= 0) { files.delete(rec.file); rec.geometry.dispose(); } });
  return handle;
}

// ------------------------------------------------------------------------------------------------ a frame of one swimmer
function step(sys, sw, dt, cam) {
  const kind = sys.kind, ctx = sys.ctx, L = sw.L;
  if (kind.think) kind.think(sys, sw, dt, cam);
  // ---- effort: beats and glides
  const g = sw.gait, G = kind.gait;
  let effort = sw.effort;
  if (G && G.beats) {
    if (g.beat && sw.phase >= g.until) { g.beat = false; g.t = G.glide[0] + (G.glide[1] - G.glide[0]) * sw.rnd(); }
    else if (!g.beat) { g.t -= dt; if (g.t <= 0 || sw.state.push) { g.beat = true; sw.state.push = false; g.until = sw.phase + G.beats[0] + Math.round((G.beats[1] - G.beats[0]) * sw.rnd()); } }
    if (!g.beat) effort *= G.idle;
  }
  const stride = (sys.options.stride ?? sys.rec.spec.flex.stride) * L, period = stride / Math.max(0.05, sw.speed);
  sw.amp = ease(sw.amp, effort * smooth(0.02, 0.35, sw.speed / kind.cruise), dt, Math.min(1.6, 0.22 * period));
  sw.gliding = G && G.beats ? ease(sw.gliding || 0, g.beat ? 0 : 1, dt, 0.8) : 0;
  // ---- speed, with weight: a beat pushes it on a little, a glide lets it fall away
  const calmK = sys.calm ? 0.85 : 1;
  let want = sw.want * calmK;
  if (sw.route) want = sw.route.ask(sw.route.speed, sw.rs, sw.want) * calmK;      // (reduced motion slows a route's own speeds too)
  else if (sw.goal) want = sw.goal.speed * (sys.calm && !kind.keepsPace ? 0.85 : 1);      // (an animal that keeps station on the boat is calmed by what it may do OVER the boat's speed: see the dolphins)
  if (G && G.surge) want *= 1 + G.surge * (g.beat ? 0.6 : -0.6);
  sw.speed = ease(sw.speed, want * (sw.state.slow ?? 1), dt, sw.speedTau);
  // ---- the head moves on
  sw.sink = ease(sw.sink, sw.sinkWant + (sw.state.guard || 0), dt, sw.state.guard > sw.sink ? 0.35 : sw.sinkTau);
  let moved = 0;
  if (sw.route) {
    sw.rs += sw.speed * dt;
    if (sw.next && sw.rs >= sw.next.at) { sw.rs = sw.next.s + (sw.rs - sw.next.at); sw.route = sw.next.route; sw.next = null; }      // the run-in has met the new line
    const r = sw.route;
    sw.roll = r.ask(r.roll, sw.rs, 0) * RAD;
    sw.rollHead = ease(sw.rollHead, sw.roll, dt, kind.rollTau || 0.5); sw.rollTail = ease(sw.rollTail, sw.rollHead, dt, kind.twistTau || 0.8);
    if (r.amp) sw.effort = r.ask(r.amp, sw.rs, 1);
    r.at(sw.rs, _v);
    moved = sw.advance(_v.x, _v.y + sw.lift, _v.z);
    if (!r.closed && !sw.next && sw.rs > r.length + L * 1.5) {                 // an open route has been swum: it is gone (keep: true lets it run on)
      const fn = sw.onDone; sw.onDone = null;
      if (!sw.keep) sw.active = false;
      if (fn) fn(sw);
    }
  } else if (sw.goal) {
    // it steers itself toward a goal: it can only turn as tightly as its body bends, and its turning has weight
    const g = sw.goal, H = sw.head, d = sw.dir;
    const dx = g.x - H.x, dy = g.y - H.y, dz = g.z - H.z, hd = Math.hypot(dx, dz);
    if (sw.speed > 1e-3) {
      const yawNow = Math.atan2(d.x, d.z);
      let dyaw = hd > 1e-4 ? Math.atan2(dx, dz) - yawNow : 0; dyaw = Math.atan2(Math.sin(dyaw), Math.cos(dyaw));
      const maxRate = sw.speed / Math.max((kind.minRadius || 1) * sw.scale, sw.state.wide || 0);       // (state.wide: metres; a wheel wider than its tightest)
      sw.yawRate = ease(sw.yawRate || 0, clamp(dyaw * (kind.turnGain || 2), -maxRate, maxRate), dt, kind.turnTau || 0.3);
      const yaw = yawNow + sw.yawRate * dt, top = (kind.maxPitch || 20) * RAD;
      const wantPitch = g.pitch != null ? g.pitch : Math.atan2(dy, Math.max(hd, 0.6 * L));        // (goal.pitch: radians, when the animal flies an arc of its own)
      sw.pitch = ease(sw.pitch || 0, clamp(wantPitch, -top, top), dt, g.pitchTau || 0.35);
      const cp = Math.cos(sw.pitch), v = sw.speed * dt;
      moved = sw.advance(H.x + Math.sin(yaw) * cp * v, H.y + Math.sin(sw.pitch) * v, H.z + Math.cos(yaw) * cp * v);
    }
    if (sw.speed < 0.04 * kind.cruise + 0.01) sw.settle(dt, kind.settle || 1.5);
  }
  sw.velocity.copy(sw.dir).multiplyScalar(dt > 0 ? moved / dt : 0);
  if (sw.wake && (sw.wakeT -= dt) <= 0) {                                 // a point of comet
    sw.wakeT += sys.wake / WAKE; const a = (sw.wakeAt % WAKE) * 4, mk = sw.marks.snout || sw.head;
    sw.wake[a] = mk.x; sw.wake[a + 1] = mk.y; sw.wake[a + 2] = mk.z; sw.wake[a + 3] = sys.time; sw.wakeAt++;
  }
  sw.phase += moved / stride;
  sw.lay();
  // ---- never in the rider's face: if any part of it would come too near the eye, the whole animal settles lower.
  // Every part: the spine stations with their girth, the head ahead of the first of them (a whale's by five and a half
  // metres), and whatever stands out from the body (flukes six metres across, flippers, fins: the model's marks, and
  // half way along the long ones). It begins to settle while that part is still a metre and a half short of the
  // limit (a great one; a small one half a metre), and hard: a tailstock arching up under the hull rises two metres in
  // a second.
  // (As built the guard knew the spine alone, and began half a metre short: a whale told to sound under the boat put
  // its tailstock 8 cm from the lens, and its flukes, which the guard had never heard of, through it.)
  const keep = sys.options.keepOut ?? 0.7, body = sw.body; let need = 0;
  const early = clamp(0.25 * L, 0.5, 1.5), hard = 2.5 + 1.5 * (early - 0.5);      // (the larger the animal, the sooner and the harder: a pike half a metre short, a whale a metre and a half)
  const near = (x, y, z, r) => { const gap = Math.hypot(x - cam.x, y - cam.y, z - cam.z) - r - keep; if (gap < early) need = Math.max(need, (early - gap) * hard); };
  for (let k = 0; k < body.length; k += 4) near(body[k], body[k + 1], body[k + 2], body[k + 3] * 1.15);
  if (sw.frames > 1) {
    const mk = sw.marks, pad = Math.max(0.15, 0.02 * L), sn = mk.snout;
    if (sn) for (let i = 0; i < 2; i++) { const f = i * 0.5; near(sn.x + (body[0] - sn.x) * f, sn.y + (body[1] - sn.y) * f, sn.z + (body[2] - sn.z) * f, body[3] * (0.5 + 0.7 * f) * 1.15); }
    for (const name in mk) near(mk[name].x, mk[name].y, mk[name].z, pad);
    for (let i = 0; i < GUARD_SPANS.length; i++) {
      const a = mk[GUARD_SPANS[i][0]], b = mk[GUARD_SPANS[i][1]];
      if (a && b) near((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2, pad * 1.5);
    }
  }
  sw.state.guard = Math.max(need, (sw.state.guard || 0) - dt * 0.3);
  sw.frames = (sw.frames || 0) + 1;
  if (kind.fins) kind.fins(sys, sw, dt);
}

// ------------------------------------------------------------------------------------------------ at the surface
/** Where the body breaks the water: rings, the trace, callbacks. */
function surface(sys, sw, dt) {
  const ctx = sys.ctx, spec = sys.rec.spec, sec = spec.section, N = sec.length, sc = sw.scale, J = sw.J, n1 = sw.n1, l1 = sw.l1, kind = sys.kind, water = ctx.water;
  const channel = sys.options.trace, tr = channel && water.trace && water.trace.line ? water.trace : null, shallow = (kind.traceDepth || 1) * sc;
  const prev = sw.tracePrev || (sw.tracePrev = new Float64Array(N * 4).fill(NaN));     // while a station is out: its waterline last frame (x, z on each side); while it is under: [NaN, the distance travelled at its last dab]
  let any = false, first = -1, last = -1;
  for (let k = 0; k < N; k++) {
    const a = k * 3, y = J[a + 1], reach = sec[k][1] * sc, half = sec[k][0] * sc;
    let out = 0, level = 0;
    if (y + reach > -0.35 - shallow) {
      level = water.heightAt(J[a], J[a + 2]);
      out = y + reach * Math.max(0.2, n1[a + 1]) > level ? 1 : 0;
    }
    if (out !== sw.above[k]) {
      sw.above[k] = out;
      const lone = out ? !sw.atSurface && !any : false;                 // the first of it to come out
      if (lone || sys.time - sw.ringAt > 0.45) {
        sw.ringAt = sys.time;
        sys.touch(J[a], J[a + 2], (kind.ring || 0.4) * (lone ? 1 : 0.22), lone ? Math.max(half * 1.2, (kind.ringWide || 0.5) * sc) : Math.max(0.25, half * 0.8), out ? (lone ? 'emerge' : 'wake') : 'wake', sw);
      }
    }
    if (out) { any = true; if (first < 0) first = k; last = k; }
    if (tr) {
      const p = k * 4;
      if (out) {                                                       // the waterline down both sides of whatever is out: from this station to the one before it
        const lx = l1[a] * half, lz = l1[a + 2] * half, x0 = J[a] + lx, z0 = J[a + 2] + lz, x1 = J[a] - lx, z1 = J[a + 2] - lz;
        if (k > 0 && sw.above[k - 1] && !Number.isNaN(prev[p - 4])) {
          tr.line(prev[p - 4], prev[p - 3], x0, z0, { channel, radius: 0.25 + 0.12 * half, strength: 0.9, soft: 0.7 });
          tr.line(prev[p - 2], prev[p - 1], x1, z1, { channel, radius: 0.25 + 0.12 * half, strength: 0.9, soft: 0.7 });
        } else { tr.inject(x0, z0, { channel, radius: 0.3 + 0.12 * half, strength: 0.9 }); tr.inject(x1, z1, { channel, radius: 0.3 + 0.12 * half, strength: 0.9 }); }
        prev[p] = x0; prev[p + 1] = z0; prev[p + 2] = x1; prev[p + 3] = z1;
      } else {
        if (!Number.isNaN(prev[p]) || Number.isNaN(prev[p + 1])) { prev[p] = NaN; prev[p + 1] = -1e9; }
        const depth = level - (y + reach);                             // just under the surface it stirs it from below: a dab for every so much travelled, weaker the deeper it is
        if (depth < shallow && depth >= 0 && k % (kind.traceStride || 1) === 0 && sw.odo - prev[p + 1] >= (kind.traceEvery || 0.5) * sc) {
          prev[p + 1] = sw.odo;
          tr.inject(J[a], J[a + 2], { channel, radius: Math.max(0.25, half * 1.05), strength: (kind.traceGain ?? 0.5) * (1 - depth / shallow), soft: 0.8 });
        }
      }
    }
  }
  if (sw.atSurface && !any) sys.touch(J[(N >> 1) * 3], J[(N >> 1) * 3 + 2], (kind.ring || 0.4) * 0.5, sec[N >> 1][0] * sc * 1.2 + 0.3, 'submerge', sw);     // the last of it has gone under
  sw.atSurface = any; sw.outFirst = first; sw.outLast = last;
  if (kind.after) kind.after(sys, sw, dt);
}

// ================================================================================================ the old carp
// Fins by rule. The pectorals are modelled held out, as in a glide; they scull slowly, lie back a little while the
// tail works, and in a turn the inner one flares and the outer one tucks. The long dorsal leans away from the way
// the back is moving (a spring: it lags), and folds when the fish is rising or hurrying. Barbels trail.
SPECIES.carp.fins = (sys, sw, dt) => {
  const t = sys.time, glide = sw.gliding || 0, v = sw.speed / sys.kind.cruise, turn = sw.turn;
  const a = (0.55 + 0.45 * glide) * (sys.calm ? 0.6 : 1);                    // how much they scull
  const p1 = t * TAU / 3.1 + sw.i, p2 = p1 + TAU * 0.56;
  const spread = -0.45 + 0.95 * glide - 0.25 * clamp(v - 1, 0, 1);
  const sL = spread + 0.55 * clamp(turn, -1, 1), sR = spread - 0.55 * clamp(turn, -1, 1);       // the inner fin flares
  sw.bone('pec_L', 3 + 4 * Math.sin(p1 + 0.5) * a, 11 * Math.sin(p1 + 1.2) * a, -20 * sL + 6 * Math.sin(p1) * a);
  sw.bone('pec_R', 3 + 4 * Math.sin(p2 + 0.5) * a, 11 * Math.sin(p2 + 1.2) * a, -20 * sR + 6 * Math.sin(p2) * a);
  sw.bone('pecb_L', 5 * Math.sin(p1 - 0.4) * a, 8 * Math.sin(p1 + 0.3) * a, -6 * sL + 5 * Math.sin(p1 - 0.9) * a);
  sw.bone('pecb_R', 5 * Math.sin(p2 - 0.4) * a, 8 * Math.sin(p2 + 0.3) * a, -6 * sR + 5 * Math.sin(p2 - 0.9) * a);
  const pv = 0.8 - 0.8 * glide;
  sw.pair('pelv', 3 * pv + 2 * Math.sin(p1 * 0.7) * a, 0, -12 * pv + 3 * Math.sin(p1 * 0.7 + 1) * a, 3 * pv + 2 * Math.sin(p2 * 0.7) * a, 0, -12 * pv + 3 * Math.sin(p2 * 0.7 + 1) * a);
  const fold = clamp(Math.max(sw.state.fold || 0, 0.7 * clamp(v - 1.15, 0, 1) * 2), 0, 1);
  const st = [3, 5, 6];
  ['dors1', 'dors2', 'dors3'].forEach((nm, i) => {
    const lean = sw.spring(nm, clamp(-sw.sideSpeed(st[i], dt) * 55, -22, 22), dt, 4.2, 0.7);
    sw.bone(nm, 58 * fold, 0, lean * (1 - 0.6 * fold));
  });
  sw.bone('anal', 30 * fold, 0, sw.spring('anal', clamp(sw.sideSpeed(7, dt) * 45, -20, 20), dt, 4.5, 0.7));
  // barbels: they trail, and swing a little behind the head's own turning
  const drag = clamp(0.3 + 0.9 * v, 0, 1.4), sway = sw.spring('barb', clamp(-turn * 30, -25, 25), dt, 3.5, 0.6);
  for (const [nm, k] of [['barb1', 0.7], ['barb2', 1]]) {
    sw.bone(nm + '_L', -9 * drag * k, 0, sway * 0.5 * k); sw.bone(nm + '_R', -9 * drag * k, 0, -sway * 0.5 * k);
    sw.bone(nm + 'b_L', -13 * drag * k + 3 * Math.sin(t * 1.3 + k), 0, sway * 0.8 * k); sw.bone(nm + 'b_R', -13 * drag * k + 3 * Math.sin(t * 1.3 + 2 + k), 0, -sway * 0.8 * k);
  }
};

// What it does about the boat: nothing, except that when the hull comes straight over it while it is shallow it
// settles a metre and a half deeper with one slow beat, and comes back to its line when the hull has gone.
SPECIES.carp.think = (sys, sw, dt) => {
  const boat = sys.ctx.boat, st = sw.state, J = sw.J, k = 2 * 3;
  if (sw.frames > 1) {
    const near = Math.hypot(boat.x - J[k], boat.z - J[k + 2]), depth = -J[k + 1];
    if (!st.shy && near < 3 && depth < 4.5) { st.shy = true; sw.sinkWant += 1.5; sw.sinkTau = 1.3; st.push = true; }
    else if (st.shy && near > 7) { st.shy = false; sw.sinkWant -= 1.5; sw.sinkTau = 3.5; }
  }
  // The rise, as a carp takes something from the surface. It comes up its slope and, still under, tips its head up
  // until it hangs at thirty degrees with its lips at the surface (the nape of so deep a fish is a third of a metre
  // above its mouth: at any shallower angle the back of its head comes out first, and at none the lips never arrive).
  // It hangs so for a moment: one ring. Then it rolls forward about its lips: the head goes under as the back comes
  // up level behind it, the fin laid half back, and the back and the tail slide through the same place and are gone.
  const r = st.rise;
  if (r) {
    const p = sw.odo - r.d0, sc = sw.scale, pivot = 0.38 * sw.L;
    if (r.H === undefined) {
      const sec = sys.rec.spec.section; let reach = 0; for (const q of sec) reach = Math.max(reach, q[1]);
      const tan = Math.tan(r.tilt * RAD), th = r.nose * RAD; let H = 1;
      for (let i = 0; i < 3; i++) { const ahead = sw.route ? sw.route.at(sw.rs + 1.5 * H / tan, _v).y : sw.head.y - sw.lift; H = r.show - reach * sc - ahead + sw.sinkWant; }
      r.H = Math.max(0, H);                                              // the lift that stands the level back `show` out of the water
      r.dip = Math.min(r.H, Math.max(0, Math.sin(th) * pivot - 0.035 * sc + r.show - reach * sc + 0.01));      // how much lower its middle hangs while its lips are at the surface
      r.H1 = r.H - r.dip; r.up = 1.5 * r.H1 / tan;                       // the climb to the hang ...
      r.a0 = r.up + pivot; r.hold = 0.55 * sc; r.over = 2.0 * sc; r.flat = 0.7 * sc;      // ... (reckoned at the pivot, which follows the snout), the moment at the surface, the roll forward, the back awash
      r.down = 1.5 * r.H / Math.tan(r.tilt * 0.8 * RAD);
    }
    const e1 = r.a0 + r.hold, e2 = e1 + r.over, e3 = e2 + r.flat;
    sw.lift = r.H1 * smooth(0, r.up, p) + r.dip * smooth(e1 - pivot * 0.35, e2 - pivot * 0.35, p) - r.H * smooth(e3, e3 + r.down, p);
    sw.tipAt = pivot; sw.tip = r.nose * RAD * smooth(r.a0 - 2.4 * sc, r.a0 - 0.1 * sc, p) * (1 - smooth(e1, e2, p));
    st.fold = ease(st.fold || 0, p < e3 + r.down * 0.4 ? r.fin : 0, dt, 1.2);
    st.slow = 1 - 0.4 * smooth(r.a0 - 1.5 * sc, r.a0, p) * (1 - smooth(e2, e3 + r.down * 0.3, p));
    if (p > e3 + r.down) { st.rise = null; sw.lift = 0; sw.tip = 0; st.slow = 1; if (r.onDone) r.onDone(sw); }
  } else st.fold = ease(st.fold || 0, 0, dt, 1.5);
};
// Its lips at the surface: one ring, told to the realm as 'sip' (the back and the tail that follow are 'emerge' and 'wake' like any other body).
SPECIES.carp.after = (sys, sw) => {
  const st = sw.state, m = sw.marks.snout, lvl = m.y - sys.ctx.water.heightAt(m.x, m.z);
  if (st.rise && !st.sipped && lvl > -0.03) { st.sipped = true; sys.touch(m.x, m.z, sys.kind.ring, 0.45 * sw.scale, 'sip', sw); sw.ringAt = sys.time + 0.6; }
  else if (!st.rise) st.sipped = false;
};
SPECIES.carp.setup = (sys, handle) => {
  /**
   * The rise. It comes up a slope of `tilt` degrees (12); still under, it tips its head up to `nose` degrees (30) so
   * that its lips reach the surface and hangs there a moment (the 'sip' touch: one ring); then it rolls forward: the
   * head goes under as the back comes up level behind it, standing `show` metres out of the water (0.2), with the
   * dorsal fin laid back by `fin` (0.92: a low ridge along the back; 1 = flat, 0 = up); the back and the tail slide through the same
   * place, and it goes down again to its line. onDone(swimmer) when it is back on its line.
   * nose: 0 gives the plain rise (it comes up level: the back awash, the lips a hand under, no sip).
   * Call it when its route is within a few metres of the surface: the climb takes about seven metres of travel for
   * every metre it has to gain. From 2 m down the lips are at the surface about 20 s after the call.
   */
  handle.rise = (opts = {}) => {
    for (const sw of handle.swimmers) if (sw.active && !sw.state.rise) sw.state.rise = { d0: sw.odo, show: opts.show ?? 0.2, tilt: opts.tilt ?? 12, nose: opts.nose ?? 30, fin: opts.fin ?? 0.92, onDone: opts.onDone };
    return handle;
  };
};

// ================================================================================================ the whale
const trap = (k, q) => smooth(q[0], q[1], k) * (1 - smooth(q[2], q[3], k));
const softPlus = (z, k = 1.5) => k * Math.log1p(Math.exp(Math.min(z / k, 60)));
/**
 * The line a whale's spine follows when it comes up, rolls and sounds: height (the water at 0) against the distance x
 * travelled, the top of the roll at x = 0. It climbs at `climb` degrees from a level run `depth` down, turns over on
 * a circle of `radius` (the long wheel of the back), has its spine at `apex` at the top, then tips down on a tighter
 * circle, `turn`, to `dive` degrees and levels off `down` metres deep. (The same arithmetic as sw.surfacing_height in
 * tools/blender_lib/qc_swim.py, which the model's pose sheets use.)
 */
export function surfacingHeight(x, { depth = 9, apex = -1, climb = 11, dive = 35, radius = 30, turn = 14, down = 34 } = {}) {
  const t = Math.tan((x <= 0 ? climb : dive) * RAD), r = (x <= 0 ? radius : turn) * t * t;
  const h = apex - (Math.sqrt(x * t * x * t + r * r) - r), floor = -(x <= 0 ? depth : down);
  return floor + softPlus(h - floor, Math.min(1.5, 0.15 * (apex - floor)));           // how softly it levels off into its run
}

SPECIES.whale.setup = (sys, handle, options) => {
  const { ctx, rec } = sys, sw = handle.swimmers[0], L = sw.L, sc = sw.scale;
  let reach = 0; for (const q of rec.spec.section) reach = Math.max(reach, q[1] * sc);
  const blow = options.blow === false ? null : makeBlow(ctx, { ...(options.blow || {}), parent: options.parent });
  sys.blow = blow;
  sys.pour = options.pour === false ? null : makePour(ctx, { ...(options.pour || {}), parent: options.parent });
  /**
   * It comes up, blows, rolls its back through the surface like a wheel, shows its flukes and sounds.
   *   at: [x, z]        where the top of its roll is (where the back shows)
   *   toward: [x, z]    a point it is heading for (or dir: [dx, dz])
   *   in                seconds from now until the blowhole clears and it blows (it is put on its line that far back: out of sight, so give it 6 s or more)
   *   depth             how deep its run-in lies (9);  show: how far the highest of its back stands out of the water (0.9)
   *   climb, dive       degrees it comes up at (11) and goes down at (35);  down: how deep it levels off (34)
   *   flukes            true (default): it arches its tailstock and shows its flukes; false: a shallow roll and under again
   *   roll              degrees it lies over on its side as it rolls (0); 60 to 80 lifts a flipper clear of the water (positive: its left side down)
   *   speed             m/s (default: its own, 2.5); it slows of itself through the roll and the dive
   *   onDone(swimmer)   when it has gone
   * Returns { route, apex, times: { blow, fin, flukes, under } }: seconds from now, as it will happen if nothing changes its speed.
   */
  handle.surface = (o = {}) => {
    const p = { depth: 9, show: 0.9, climb: 11, dive: 35, radius: 30, turn: 14, down: 34, run: 40, speed: sys.kind.cruise, flukes: true, roll: 0, in: 12, ...o };
    if (!p.flukes) { p.dive = Math.min(p.dive, 13); p.turn = Math.max(p.turn, 26); p.down = Math.min(p.down, p.depth + 3); }
    const prof = { depth: p.depth, apex: p.show - reach, climb: p.climb, dive: p.dive, radius: p.radius, turn: p.turn, down: p.down };
    let dx, dz;
    if (p.toward) { dx = p.toward[0] - p.at[0]; dz = p.toward[1] - p.at[1]; } else { dx = p.dir[0]; dz = p.dir[1]; }
    const dl = Math.hypot(dx, dz) || 1; dx /= dl; dz /= dl;
    const x0 = -(p.depth + prof.apex) / Math.tan(p.climb * RAD) - p.run - p.speed * p.in, x1 = (p.down + prof.apex) / Math.tan(p.dive * RAD) + 30;
    const xs = [];
    for (let x = x0; x < -40; x += 6) xs.push(x);
    for (let x = -40; x < 0; x += 2.5) xs.push(x);
    const i0 = xs.length;
    for (let x = 0; x < 45; x += 2.5) xs.push(x);
    for (let x = 45; x < x1; x += 6) xs.push(x);
    const v = p.speed, slow = p.flukes ? 0.2 : 0.1;
    const pts = xs.map((x) => [p.at[0] + dx * x, surfacingHeight(x, prof), p.at[1] + dz * x, {
      speed: v * (1 - 0.14 * smooth(-12, 6, x) - slow * smooth(0.45 * L, 0.9 * L, x) + (0.14 + slow) * smooth(1.2 * L, 1.7 * L, x)),
      // it lies over as its head comes up and is upright again while its tail is still three metres down: lying on
      // its side with its flukes near the surface, one of them stands out of the water like a fin twenty metres astern
      roll: p.roll * smooth(-0.25 * L, 0.1 * L, x) * (1 - smooth(0.28 * L, 0.57 * L, x)),
    }]);
    const route = new SwimRoute(pts), apex = route.ctrlS[i0];
    // when things will happen, by walking the line at the speeds it asks for
    const mark = (name, fallback) => { const m = rec.marks.find((q) => q.name === name); return m ? [-m.at.z * sc, m.at.y * sc] : fallback; };
    const times = {}, bh = mark('blowhole', [0.19 * L, 1.2 * sc]), fin = mark('dorsal', [0.76 * L, 1.4 * sc]);
    const out = (m, by) => { let x = -60; while (x < 30 && surfacingHeight(x, prof) + m[1] < by) x += 0.25; return x + m[0]; };      // how far past the top the snout is when that mark clears the water
    const snd = rec.spec.sound || {}, when = snd.when || {};          // (the model's script works out, with the ride's own arithmetic, where the flukes break the surface and where the last of them goes under)
    const at = { blow: out(bh, 0.15), fin: out(fin, 0.05), flukes: (when.flukes ?? 0.72) * L, stand: (when.stand ?? 0.92) * L, under: (when.under ?? 1.2) * L };
    // when things will happen: a dry run of the ride's own speed law (the speed follows what the line asks with the animal's weight)
    const tau = sys.kind.heavy, h = 1 / 60, calmK = sys.calm ? 0.85 : 1;
    const dry = (from) => {
      const out_ = {}; let t = 0, q = from, sp = route.ask(route.speed, from, v);
      for (const key of ['blow', 'fin', 'flukes', 'stand', 'under']) {
        const goal = apex + at[key];
        while (q < goal && t < 240) { sp = ease(sp, Math.max(0.2, route.ask(route.speed, q, v)) * calmK, h, tau); q += sp * h; t += h; }
        out_[key] = t;
      }
      return out_;
    };
    let start = apex + at.blow - v * calmK * p.in, plan = dry(start);
    for (let i = 0; i < 3; i++) { start += v * calmK * (plan.blow - p.in); plan = dry(start); }      // so that the blow comes `in` seconds from now, to the tenth
    handle.swim(route, { jump: !o.join, from: start, speed: v, onDone: o.onDone });
    sw.state.sound = { route, apex, flukes: p.flukes ? 1 : 0 };
    for (const key in plan) times[key] = +plan[key].toFixed(1);
    if (!p.flukes) { delete times.flukes; delete times.stand; delete times.under; }
    return { route, apex, times };
  };
  /**
   * It passes: a straight line from `from` to `to` ([x, y, z], y its spine's depth, negative), coming from further
   * back and going on beyond, sinking away. opts: speed, lead (metres of run-in, 40), on (metres it runs on, 60), sink
   * (how much deeper it ends, 20), and whatever handle.swim takes (onDone).
   *   in, by    its snout is abreast of the point `by` ([x, z]; default: `from`) `in` seconds from now: it is put that
   *             far back on its line (the run-in is lengthened if need be), so that place must be out of sight
   */
  handle.pass = (o = {}) => {
    const a = o.from, b = o.to, on = o.on ?? 60, sink = o.sink ?? 20, v = o.speed ?? sys.kind.cruise;
    let dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2]; const l = Math.hypot(dx, dy, dz) || 1; dx /= l; dy /= l; dz /= l;
    const by = o.by ? clamp((o.by[0] - a[0]) * dx + (o.by[o.by.length - 1] - a[2]) * dz, 0, l) : 0;      // how far along from `from` the snout is when it is abreast of `by`
    const vk = v * (sys.calm ? 0.85 : 1), lead = o.in != null ? Math.max(o.lead ?? 40, vk * o.in - by + 6) : (o.lead ?? 40);
    const pts = [[a[0] - dx * lead, a[1] - dy * lead - 0.08 * lead, a[2] - dz * lead], a, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2], b,
      [b[0] + dx * on * 0.45, b[1] + dy * on * 0.45 - sink * 0.3, b[2] + dz * on * 0.45], [b[0] + dx * on, b[1] + dy * on - sink, b[2] + dz * on]];
    const route = new SwimRoute(pts);
    sw.state.sound = null;
    return handle.swim(route, { jump: !o.join, speed: v, onDone: o.onDone, from: o.in != null ? Math.max(0, route.ctrlS[1] + by - vk * o.in) : (o.fromS || 0) });
  };
};

SPECIES.whale.think = (sys, sw, dt) => {
  const st = sw.state, spec = sys.rec.spec, plan = st.sound, sh = sw.shapes;
  if (plan && (sw.route === plan.route)) {
    const k = (sw.rs - plan.apex) / sw.L;
    sh.hump = trap(k, spec.sound.hump) * plan.flukes; sh.arch = trap(k, spec.sound.arch) * plan.flukes;
    // It glides through the roll: its stroke would heave the back a third of a metre up or down as it passes, by
    // chance, and a back that shows nine tenths of a metre must not sink away and come back. The last upstroke is the arch.
    sw.effort = 0.8 * (1 - 0.86 * smooth(-0.3, 0.02, k) * (1 - smooth(plan.flukes ? 1.12 : 0.75, plan.flukes ? 1.45 : 1.1, k)));
  } else { sh.hump = ease(sh.hump, 0, dt, 1); sh.arch = ease(sh.arch, 0, dt, 1); sw.effort = ease(sw.effort, 0.8, dt, 2); }
};

// Flippers are carried swept back; they ease out a little when it slows and when it lies over on its side; the
// tips of the flukes bend behind the stroke.
SPECIES.whale.fins = (sys, sw, dt) => {
  const t = sys.time, N = sys.rec.spec.stations.length, roll = sw.rollHead;
  const slowing = clamp(1 - sw.speed / sys.kind.cruise, 0, 1), sway = Math.sin(t * TAU / 9.5), air = Math.sin(t * TAU / 5.3 + 1.1);
  // the flipper of the upper side reaches out as the body lies over: three metres of blade, so it comes late, slowly, and settles
  const upL = sw.spring('flipUpL', clamp(-roll / 1.15, 0, 1), dt, 1.5, 0.85), upR = sw.spring('flipUpR', clamp(roll / 1.15, 0, 1), dt, 1.5, 0.85);
  const outL = 0.25 * slowing + 0.9 * upL, outR = 0.25 * slowing + 0.9 * upR;
  sw.bone('flip_L', 3 * sway + 8 * outL + 3 * upL * air, 4 * sway, -26 * outL - 2 * sway); sw.bone('flipb_L', 2 * sway + 5 * outL + 4 * upL * air, 0, -9 * outL);
  sw.bone('flip_R', -3 * sway + 8 * outR + 3 * upR * air, -4 * sway, -26 * outR + 2 * sway); sw.bone('flipb_R', -2 * sway + 5 * outR + 4 * upR * air, 0, -9 * outR);
  const lag = sw.spring('fluke', clamp(-sw.upSpeed(N - 2, dt) * 7, -16, 16) * (1 - 0.7 * (sw.shapes.arch || 0)), dt, 3.2, 0.7) - 4 * (sw.shapes.arch || 0);
  sw.bone('fluke_L', lag, 0, 0); sw.bone('fluke_R', lag, 0, 0);
};

// What it leaves on the water, and what it tells the realm: the blow, the fin, the flukes, the footprint, flukeprints.
SPECIES.whale.after = (sys, sw, dt) => {
  const st = sw.state, mk = sw.marks, water = sys.ctx.water, handle = sys.handle;
  const lvl = (v) => v.y - water.heightAt(v.x, v.z);
  const b = lvl(mk.blowhole);
  if (!st.blown && b > 0.15) {
    st.blown = true; if (sys.blow) sys.blow.at(mk.blowhole, sw.velocity); sys.touch(mk.blowhole.x, mk.blowhole.z, 0, 0, 'blow', sw);
    st.spray = { x: mk.blowhole.x, z: mk.blowhole.z, t0: sys.time, n: 0, wind: (sys.options.blow && sys.options.blow.wind) || [0.5, 0.2] };
  } else if (st.blown && b < -1.5) st.blown = false;
  if (st.spray) {                                                       // its spray falls back over the next few seconds: thirty small rings within six metres
    const sp = st.spray, due = Math.min(30, Math.floor(smooth(1.3, 4.3, sys.time - sp.t0) * 30.001));
    for (; sp.n < due; sp.n++) {
      const a = sw.rnd() * TAU, r = 0.6 + 5 * Math.sqrt(sw.rnd()), age = sys.time - sp.t0;
      if (sys.options.ripples !== false) water.ripple(sp.x + sp.wind[0] * age * 0.6 + Math.cos(a) * r * 0.6, sp.z + sp.wind[1] * age * 0.6 + Math.sin(a) * r * 0.6, 0.1 + 0.08 * sw.rnd(), 0.16);
    }
    if (sp.n >= 30) st.spray = null;
  }
  const f = lvl(mk.dorsal);
  if (!st.fin && f > 0.05) { st.fin = true; sys.touch(mk.dorsal.x, mk.dorsal.z, 0, 0, 'fin', sw); } else if (st.fin && f < -1) st.fin = false;
  const fl = Math.max(lvl(mk.fluke_L), lvl(mk.fluke_R));
  if (!st.flukes && fl > 0.3) { st.flukes = true; sys.touch(mk.notch.x, mk.notch.z, 0.5, 3 * sw.scale, 'flukes', sw); }
  else if (st.flukes && fl < -0.6) {                                    // they have gone under: the footprint
    st.flukes = false;
    print(handle, mk.notch.x, mk.notch.z, 11 * sw.scale, 'foot');
    sys.touch(mk.notch.x, mk.notch.z, sys.calm ? 0.4 : 1.0, 11 * sw.scale, 'footprint', sw);
  }
  // Water runs off the flukes while they stand in the air: in runnels along their hind edge (from the notch out to
  // each tip), most in the first second and a half, thinning to a drip. Each drop is thrown with the edge's own motion
  // and falls as water falls; where it lands it rings the water.
  if (sys.pour) {
    const P = sys.pour, tipL = mk.fluke_L, tipR = mk.fluke_R, n = mk.notch, up = Math.max(lvl(tipL), lvl(tipR), lvl(n));
    const pv = st.pourPrev || (st.pourPrev = { l: tipL.clone(), r: tipR.clone(), n: n.clone(), ok: false });
    if (up > 0.3 && dt > 0 && pv.ok) {
      if (!st.pouring) { st.pouring = true; st.pourT = 0; st.pourDue = 0; sys.touch(n.x, n.z, 0, 0, 'pour', sw); }
      st.pourT += dt; st.pourDue += dt * (18 + 122 * Math.exp(-st.pourT / 1.5));
      for (; st.pourDue >= 1; st.pourDue -= 1) {
        const run = P.runnels[Math.floor(sw.rnd() * P.runnels.length)], tip = run.left ? tipL : tipR, was = run.left ? pv.l : pv.r, f = run.f;
        const x = n.x + (tip.x - n.x) * f, y = n.y + (tip.y - n.y) * f, z = n.z + (tip.z - n.z) * f, level = water.heightAt(x, z);
        if (y - level < 0.25) continue;                                 // that part of the edge is in the water
        const k = 0.85 / dt;                                             // (a drop keeps most of the edge's own speed as it lets go)
        P.drop(x, y - 0.03, z, (x - (pv.n.x + (was.x - pv.n.x) * f)) * k + (sw.rnd() - 0.5) * 0.35, (y - (pv.n.y + (was.y - pv.n.y) * f)) * k, (z - (pv.n.z + (was.z - pv.n.z) * f)) * k + (sw.rnd() - 0.5) * 0.35, level);
      }
    } else if (st.pouring && up < -0.3) st.pouring = false;
    pv.l.copy(tipL); pv.r.copy(tipR); pv.n.copy(n); pv.ok = true;
    P.land((x, z) => { if (sys.options.ripples !== false) water.ripple(x, z, 0.07 + 0.06 * sw.rnd(), 0.14); });
  }
  // a flukeprint at the top of each upstroke, while it swims within reach of the surface
  const beat = Math.floor(sw.phase + 0.5);
  if (st.beat !== undefined && beat !== st.beat && !sw.atSurface) {
    const d = -lvl(mk.notch);
    if (d > 1 && d < (sys.options.printDepth ?? 14) * sw.scale && sys.time - sw.bornAt > 3) { print(handle, mk.notch.x, mk.notch.z, 3.2 * sw.scale, 'fluke'); sys.touch(mk.notch.x, mk.notch.z, 0, 0, 'flukeprint', sw); }
  }
  st.beat = beat;
  // passing shallow under the boat, its bulk lifts the water once
  const boat = sys.ctx.boat, a = 5 * 3, near = Math.hypot(boat.x - sw.J[a], boat.z - sw.J[a + 2]);
  if (!st.swell && sys.time - sw.bornAt > 4 && near < 9 * sw.scale && sw.J[a + 1] > -14 * sw.scale && !sw.atSurface) { st.swell = true; sys.touch(sw.J[a], sw.J[a + 2], sys.calm ? 0.25 : 0.6, 9 * sw.scale, 'swell', sw); }
  else if (st.swell && near > 30 * sw.scale) st.swell = false;
};
function print(handle, x, z, r, kind) { handle.prints.push({ x, z, r, t: handle.time, kind }); if (handle.prints.length > 12) handle.prints.shift(); }

// ------------------------------------------------------------------------------------------------ the blow
// A whale's breath: a jet that stands up in under a second as one tall column, densest at its foot, and then hangs:
// its top drifts and thins as mist, its lower part falls back as spray. (A first version rose as loose puffs that
// left the water behind and floated off overhead like smoke from a chimney.) One draw call; nothing moves on the CPU.
function makeBlow(ctx, o = {}) {
  const { engine } = ctx, S = engine.shared;
  const PUFFS = 56, POOL = PUFFS * 3;
  const geo = new THREE.InstancedBufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0]), 3));
  geo.setIndex([0, 1, 2, 0, 2, 3]);
  const origin = new Float32Array(POOL * 4).fill(-1e6), seed = new Float32Array(POOL * 4), drift = new Float32Array(POOL * 3);
  const aO = new THREE.InstancedBufferAttribute(origin, 4), aS = new THREE.InstancedBufferAttribute(seed, 4), aD = new THREE.InstancedBufferAttribute(drift, 3);
  geo.setAttribute('aOrigin', aO); geo.setAttribute('aSeed', aS); geo.setAttribute('aDrift', aD);
  geo.instanceCount = POOL;
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: S.uTime, uFogColor: S.uFogColor, uFogDensity: S.uFogDensity, uVeil: S.uVeil, uVeilColor: S.uVeilColor, uSkyLight: S.uSkyLight, uGroundLight: S.uGroundLight, uRampLight: S.uRampLight, uKeyColor: S.uKeyColor,
      uColor: { value: new THREE.Color(o.color ?? '#e6ecf5') }, uTop: { value: new THREE.Color(o.top ?? o.color ?? '#cfd8e8') }, uGlow: { value: new THREE.Color(o.glow ?? '#000000').multiplyScalar(o.glowStrength ?? 1) },
      uHeight: { value: o.height ?? 9 }, uSize: { value: o.size ?? 1 }, uOpacity: { value: o.opacity ?? 0.5 }, uLife: { value: o.life ?? 6.5 } },
    transparent: true, depthWrite: false,
    vertexShader: /* glsl */`
      ${FOG_PARS}
      attribute vec4 aOrigin, aSeed; attribute vec3 aDrift;
      uniform float uTime, uHeight, uSize, uLife;
      varying vec2 vQ; varying float vAlpha, vDist, vUp;
      void main() {
        float age = uTime - aOrigin.w, hf = aSeed.x;                      // hf: how far up the column this part of the breath gets, 0..1
        vQ = position.xy;
        float life = uLife * mix(0.42, 1.0, hf * hf);                    // the spray at the foot is gone in two seconds; the mist at the top hangs
        if (age < 0.0 || age > life) { gl_Position = vec4(0.0, 0.0, -2.0, 1.0); vAlpha = 0.0; vDist = 0.0; vUp = 0.0; return; }
        float jet = 1.0 - exp(-age / (0.16 + 0.2 * hf));                 // it stands up at once
        float sag = (0.55 - 0.42 * hf) * pow(max(age - 0.7, 0.0), 1.7) + 0.05 * max(age - 1.2, 0.0);    // then it falls: the low, heavy part soonest
        float y = max(uHeight * hf * jet - sag, 0.05);
        float wide = (0.04 + 0.16 * hf + 0.2 * hf * age) * (0.5 + age * 0.5);
        vec3 p = aOrigin.xyz + vec3(0.0, y, 0.0) + aDrift * (age * (0.3 + 0.7 * hf)) + vec3(aSeed.y - 0.5, 0.0, aSeed.z - 0.5) * wide;
        float size = uSize * (0.85 + 0.6 * aSeed.w) * (0.5 + 0.95 * hf) * (1.0 + 1.7 * smoothstep(0.0, 4.0, age));       // large soft dabs that run together into one column
        vec4 mv = viewMatrix * modelMatrix * vec4(p, 1.0);
        mv.xy += position.xy * size * vec2(1.0, 1.5);
        vDist = length(mv.xyz); vUp = clamp(y / uHeight, 0.0, 1.0);
        vAlpha = smoothstep(0.0, 0.1, age) * (1.0 - smoothstep(life * 0.5, life, age)) * (0.68 + 0.32 * (1.0 - hf)) * 0.6;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      ${FOG_PARS}
      uniform vec3 uColor, uTop, uGlow, uSkyLight, uGroundLight, uRampLight, uKeyColor; uniform float uOpacity;
      varying vec2 vQ; varying float vAlpha, vDist, vUp;
      void main() {
        float l = length(vQ) * 2.0, a = smoothstep(1.0, 0.0, l); a *= a * vAlpha * uOpacity;
        if (a < 0.003) discard;
        vec3 light = min(uSkyLight * 1.25 + uGroundLight * 0.5 + uRampLight * uKeyColor * 0.5, vec3(0.92));     // breath is mist: it is lit by the whole place it stands in, and never shines
        vec3 col = mix(uColor, uTop, vUp) * light + uGlow * (1.0 - vUp);
        gl_FragColor = vec4(applyFog(col, vDist), a);
      }`,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = 'swimmers:blow'; mesh.frustumCulled = false; mesh.renderOrder = 3;
  (o.parent || ctx.group).add(mesh);
  const rnd = ctx.rng(o.seed ?? 77);
  let next = 0;
  return {
    object: mesh, material: mat,
    /** A blow from `pos` (a Vector3). The whale moves on while it breathes out (vel): the breath is left standing behind it, leaning, and drifts with the wind (wind: [x, z] m/s). */
    at(pos, vel) {
      const now = S.uTime.value, wind = o.wind || [0.5, 0.2], out = 1.1;                     // seconds the breath takes
      for (let i = 0; i < PUFFS; i++) {
        const j = (next + i) % POOL, k = i / PUFFS, t = k * out;
        origin[j * 4] = pos.x + (vel ? vel.x * t : 0); origin[j * 4 + 1] = pos.y - 0.25; origin[j * 4 + 2] = pos.z + (vel ? vel.z * t : 0); origin[j * 4 + 3] = now + t + rnd() * 0.05;
        seed[j * 4] = (0.08 + 0.92 * Math.pow(rnd(), 0.62)) * (1 - 0.5 * k * k);            // the whole column is filled, foot to top; the last of the breath has less force
        seed[j * 4 + 1] = rnd(); seed[j * 4 + 2] = rnd(); seed[j * 4 + 3] = rnd();
        drift[j * 3] = wind[0]; drift[j * 3 + 1] = 0; drift[j * 3 + 2] = wind[1];
      }
      next = (next + PUFFS) % POOL;
      aO.needsUpdate = aS.needsUpdate = aD.needsUpdate = true;
    },
  };
}

// ------------------------------------------------------------------------------------------------ the pour
// Water running off a whale's flukes as they lift and stand: strands of falling water, each a short streak drawn
// along the way it falls, born in runnels along the hind edge so that drop follows drop and the strands hang like a
// torn curtain. Lit by the place it falls through (it is water: by day pale, at dusk the sky's colour); `glow` is light
// it gives off besides (the sea, whose water is lit by touch). One draw call; the fall is worked out in the shader.
// o: { color, glow, glowStrength (1; above 1 it blooms), size: width of a strand in metres (0.1), opacity (0.75) }
function makePour(ctx, o = {}) {
  const S = ctx.engine.shared, POOL = 220;
  const geo = new THREE.InstancedBufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-0.5, 0, 0, 0.5, 0, 0, 0.5, 1, 0, -0.5, 1, 0]), 3));
  geo.setIndex([0, 1, 2, 0, 2, 3]);
  const origin = new Float32Array(POOL * 4).fill(-1e6), vel = new Float32Array(POOL * 4), due = new Float32Array(POOL * 3).fill(Infinity);
  const aO = new THREE.InstancedBufferAttribute(origin, 4), aV = new THREE.InstancedBufferAttribute(vel, 4);
  geo.setAttribute('aOrigin', aO); geo.setAttribute('aVel', aV);
  geo.instanceCount = POOL;
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: S.uTime, uFogColor: S.uFogColor, uFogDensity: S.uFogDensity, uVeil: S.uVeil, uVeilColor: S.uVeilColor, uSkyLight: S.uSkyLight, uGroundLight: S.uGroundLight, uRampLight: S.uRampLight, uKeyColor: S.uKeyColor,
      uColor: { value: new THREE.Color(o.color ?? '#e6ecf5') }, uGlow: { value: new THREE.Color(o.glow ?? '#000000').multiplyScalar(o.glowStrength ?? 1) }, uSize: { value: o.size ?? 0.1 }, uOpacity: { value: o.opacity ?? 0.75 } },
    transparent: true, depthWrite: false,
    vertexShader: /* glsl */`
      ${FOG_PARS}
      attribute vec4 aOrigin, aVel;
      uniform float uTime, uSize;
      varying vec2 vQ; varying float vAlpha, vDist;
      void main() {
        float age = uTime - aOrigin.w;
        vQ = position.xy;
        vec3 v = aVel.xyz + vec3(0.0, -9.8 * age, 0.0);
        vec3 p = aOrigin.xyz + aVel.xyz * age + vec3(0.0, -4.9 * age * age, 0.0);
        if (age < 0.0 || age > 4.0 || p.y < 0.03) { gl_Position = vec4(0.0, 0.0, -2.0, 1.0); vAlpha = 0.0; vDist = 0.0; return; }      // not yet let go, or in the water again
        // a strand as long as it falls in a quarter of a second (drop follows drop down a runnel: at forty metres they
        // read as threads, not as beads), and never longer than the way it has fallen
        float sp = length(v), len = min(clamp(sp * 0.25, 0.25, 2.4) * (0.7 + 0.6 * aVel.w), length(p - aOrigin.xyz) + 0.12);
        vec4 mv = viewMatrix * modelMatrix * vec4(p, 1.0);
        vec3 a = (viewMatrix * modelMatrix * vec4(v / max(sp, 1e-3), 0.0)).xyz;                              // the way it falls, as the eye sees it
        vec2 side = normalize(vec2(-a.y, a.x) + vec2(1e-5, 0.0));
        float dist = length(mv.xyz), wide = uSize * (0.6 + 0.8 * aVel.w), least = 0.0018 * dist;            // never drawn thinner than the screen can hold: fainter instead
        mv.xyz -= a * (position.y * len);                                                                    // the streak lies where the drop has just been
        mv.xy += side * (position.x * max(wide, least));
        vDist = dist; vAlpha = smoothstep(0.02, 0.2, age) * min(1.0, wide / least);                         // (it comes in as it lengthens: a new drop is a speck against the sky)
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      ${FOG_PARS}
      uniform vec3 uColor, uGlow, uSkyLight, uGroundLight, uRampLight, uKeyColor; uniform float uOpacity;
      varying vec2 vQ; varying float vAlpha, vDist;
      void main() {
        // full at the drop, thinning up its trail. (Every term is clamped: at a quad's edge the interpolated values run a
        // little past their ends, and the power of a negative number is not a number: black dots in the picture, and dark
        // blocks in the water's mirror under them.)
        float x = clamp(vQ.x * 2.0, -1.0, 1.0), y = clamp(vQ.y, 0.0, 1.0), a = clamp((1.0 - x * x) * pow(1.0 - y, 1.3) * smoothstep(0.0, 0.06, y) * vAlpha * uOpacity, 0.0, 1.0);
        if (a < 0.004) discard;
        vec3 light = min(uSkyLight * 1.25 + uGroundLight * 0.5 + uRampLight * uKeyColor * 0.5, vec3(0.92));
        gl_FragColor = vec4(applyFog(uColor * light + uGlow, vDist), a);
      }`,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = 'swimmers:pour'; mesh.frustumCulled = false; mesh.renderOrder = 3;
  (o.parent || ctx.group).add(mesh);
  const rnd = ctx.rng(o.seed ?? 91), runnels = [];
  for (let i = 0; i < 30; i++) runnels.push({ left: i % 2 === 0, f: 0.06 + 0.94 * Math.pow(rnd(), 0.8) });      // where along the hind edge the water gathers and runs off (0 at the notch, 1 at a tip)
  let next = 0, pending = 0;
  return {
    object: mesh, material: mat, runnels,
    /** One drop let go at (x, y, z) with the speed (vx, vy, vz); level: the height of the water under it. */
    drop(x, y, z, vx, vy, vz, level) {
      const j = next, now = S.uTime.value; next = (next + 1) % POOL;
      origin[j * 4] = x; origin[j * 4 + 1] = y; origin[j * 4 + 2] = z; origin[j * 4 + 3] = now;
      vel[j * 4] = vx; vel[j * 4 + 1] = vy; vel[j * 4 + 2] = vz; vel[j * 4 + 3] = rnd();
      const t = (vy + Math.sqrt(vy * vy + 19.6 * Math.max(0, y - level))) / 9.8;                            // when and where it meets the water
      if (due[j * 3 + 2] === Infinity) pending++;
      due[j * 3] = x + vx * t; due[j * 3 + 1] = z + vz * t; due[j * 3 + 2] = now + t;
      aO.needsUpdate = aV.needsUpdate = true;
    },
    /** Call every frame: fn(x, z) for each drop that has met the water since the last call. */
    land(fn) {
      if (!pending) return;
      const now = S.uTime.value;
      for (let j = 0; j < POOL; j++) if (due[j * 3 + 2] <= now) { fn(due[j * 3], due[j * 3 + 1]); due[j * 3 + 2] = Infinity; pending--; }
    },
  };
}

// ================================================================================================ the dolphins
// They keep station round the stem of the boat, change places by crossing under or ahead of it, and roll at the
// surface in turn. They are there for the fish the bow scatters: a boat that stops loses them to their hunting.
//
// (Second pass, after the critic's log of where each one was, second by second. With seven animals on seven stations
// no station was ever free, so none of them ever changed place: the pod travelled as one rigid frame, every animal at
// exactly the boat's speed, for as long as the boat moved. And the two that arrive from ahead swam straight at the
// bow and whipped round in a hairpin eight metres in front of the rider. Now: a place is CHANGED WITH its holder (two
// cross under the stem at once, in an X); on its place each one wanders about it on its own slow rhythm, so no two
// keep the same speed; and those from ahead pass down the side eleven metres off, wheel round abaft the beam and come
// up alongside like the rest. Nothing ever heads for the hull.)
const STATIONS = [[3, 0, 1.4], [5, 2.5, 1.6], [5, -2.5, 1.6], [1, 4, 1.2], [1, -4, 1.2], [-3, 6, 2.0], [-3, -6, 2.0]];   // metres ahead of the stem, to its right, down
const FROM = [-128, 132, -22, 150, -146, 24, -160];                                                                      // where each arrives from: degrees round from the bow (three astern to the left, two to the right, two ahead), by turns left and right, so that a thinned pod (four at low quality) is not all on one side

SPECIES.dolphin.setup = (sys, handle, options) => {
  const list = handle.swimmers, ctx = sys.ctx, boat = ctx.boat;
  const pod = sys.pod = { mode: 'away', stations: options.stations || STATIONS, still: 0, hunt: null, stem: options.stem ?? 2.4 };
  for (const sw of list) {
    sw.scale *= 0.94 + 0.12 * sw.rnd(); sw.L = sys.rec.spec.length * sw.scale; sw.h = sw.L * 1.45 / (CAP - 8); sw.goal = { x: 0, y: -1.5, z: 0, speed: 0 };
    sw.state.w = [sw.rnd() * TAU, sw.rnd() * TAU, sw.rnd() * TAU, sw.rnd() * TAU, sw.rnd() * TAU, 0.85 + 0.3 * sw.rnd()];      // its own slow rhythm about its place
  }
  const frame = () => { const h = boat.heading; return { fx: -Math.sin(h), fz: -Math.cos(h), rx: Math.cos(h), rz: -Math.sin(h) }; };
  /**
   * They come: each from `distance` metres off (60: out of sight), fast, and take up their stations round the stem.
   * Those that come from astern overhaul the boat; those from ahead pass down its side well clear, wheel round abaft
   * the beam and come up alongside. seconds: about how long the run-in takes (7).
   */
  handle.arrive = (o = {}) => {
    const F = frame(), dist = o.distance ?? 60, bs = boat.speed || 0, free = pod.stations.map((_, k) => k);
    list.forEach((sw, i) => {
      const deg = FROM[i % FROM.length], a = deg * RAD, bx = F.fx * Math.cos(a) + F.rx * Math.sin(a), bz = F.fz * Math.cos(a) + F.rz * Math.sin(a);
      const x = boat.x + bx * dist, z = boat.z + bz * dist, ahead = Math.abs(deg) < 70, st = sw.state;
      const v = clamp(dist / (o.seconds ?? 7) - bs * Math.cos(a), 3.5, 12);            // those that come up from astern must also overhaul the boat
      // a place on its own side of the boat, the forward ones for those that come from ahead
      const side = Math.sign(deg), mine = free.filter((k) => Math.sign(pod.stations[k][1]) === side || pod.stations[k][1] === 0);
      const pick = (mine.length ? mine : free).sort((p, q) => (ahead ? pod.stations[q][0] - pod.stations[p][0] : pod.stations[p][0] - pod.stations[q][0]))[0];
      free.splice(free.indexOf(pick), 1);
      st.station = pick ?? (i % pod.stations.length); st.hold = 5 + 5 * sw.rnd(); st.moving = false; st.swapTo = null; st.join = false; st.rush = v; st.gone = false; st.exit = null; st.spot = null; st.roll = null;
      st.gate = ahead ? side : 0;                                                      // from ahead: first down the side, to a point abeam eleven metres off
      st.nextRoll = sys.time + 6 + 10 * sw.rnd();
      const aim = ahead ? { x: boat.x + F.rx * side * 11 - F.fx * 2 + F.fx * bs * 5, z: boat.z + F.rz * side * 11 - F.fz * 2 + F.fz * bs * 5 } : { x: boat.x, z: boat.z };
      sw.put(x, -1.6 - 0.5 * sw.rnd(), z, Math.atan2(aim.x - x, aim.z - z));
      sw.speed = v;
    });
    pod.mode = 'escort'; pod.still = 0;
    return handle;
  };
  /** They go: each to `distance` metres off (60), where it is taken out. toward: [x, z] they all make for; else they scatter ahead. */
  handle.leave = (o = {}) => {
    const F = frame(), dist = o.distance ?? 60;
    list.forEach((sw, i) => {
      if (!sw.active) return;
      const a = (o.toward ? Math.atan2((o.toward[0] - boat.x) * F.rx + (o.toward[1] - boat.z) * F.rz, (o.toward[0] - boat.x) * F.fx + (o.toward[1] - boat.z) * F.fz) : 0) + (i - (list.length - 1) / 2) * 0.16;
      sw.state.exit = { x: boat.x + (F.fx * Math.cos(a) + F.rx * Math.sin(a)) * dist, z: boat.z + (F.fz * Math.cos(a) + F.rz * Math.sin(a)) * dist };
    });
    pod.mode = 'leave';
    return handle;
  };
  /** They drive at a place (a shoal): at: [x, z], depth (2), for `seconds` (6), wheeling through it; then they go (then: [x, z], as leave's toward). */
  handle.hunt = (o = {}) => { pod.hunt = { x: o.at[0], z: o.at[1], y: -(o.depth ?? 2), until: sys.time + (o.seconds ?? 6), then: o.then || null }; pod.mode = 'hunt'; return handle; };
  /** Back to the stem (after a hunt, or by hand). */
  handle.escort = () => { pod.mode = 'escort'; return handle; };
  Object.defineProperty(handle, 'mode', { get: () => pod.mode });
  sys.frame = frame;
};

SPECIES.dolphin.think = (sys, sw, dt) => {
  const pod = sys.pod, st = sw.state, g = sw.goal, boat = sys.ctx.boat, F = sys.frame(), list = sys.handle.swimmers;
  const H = sw.head, bs = boat.speed || 0, t = sys.time, w = st.w;
  // Their top speed: 6 m/s (4.5 with reduced motion), and always enough over the boat's own to come up to their places
  // and change them. (It was 6 and 4.5 whatever the boat did, and with reduced motion 3.8 in the end: beside a boat
  // doing 3.3 m/s all seven swam flat out in a row, each at exactly 3.8, five metres astern of the places they never
  // reached. What a rider who asked for calm must be spared is speed past the eye, which is speed over the boat's.)
  const top = Math.max(sys.calm ? 4.5 : 6, bs + (sys.calm ? 1.3 : 1.8));
  // the pod's own mind, once a frame (by its first swimmer)
  if (sw.i === 0) {
    // a boat that stops (or dawdles: they cannot hold still beside it) loses them to their hunting; one that moves on gets them back
    if (pod.mode === 'escort') { pod.still = bs < 0.3 ? pod.still + dt : bs < 1.2 ? pod.still + dt * 2 : 0; if (pod.still > 6) pod.mode = 'range'; }
    else if (pod.mode === 'range' && bs > 1.5) { pod.mode = 'escort'; pod.still = 0; for (const o of list) { o.state.hold = 3 + 5 * o.rnd(); o.state.moving = false; } }
    else if (pod.mode === 'hunt' && t > pod.hunt.until) { if (pod.hunt.then) sys.handle.leave({ toward: pod.hunt.then }); else pod.mode = 'escort'; }
  }
  const stemX = boat.x + F.fx * pod.stem, stemZ = boat.z + F.fz * pod.stem;
  let depth = 1.5; sw.state.wide = 0;
  if (pod.mode === 'escort') {
    if (st.swapTo != null && t >= st.swapAt) { st.station = st.swapTo; st.swapTo = null; }
    const S = pod.stations[st.station];
    // where it wants to be: its place, and its own slow wandering about it (so that no two ever keep the same speed)
    const wa = (0.75 * Math.sin(t * 0.23 * w[5] + w[0]) + 0.45 * Math.sin(t * 0.41 * w[5] + w[1])), wc = 0.42 * Math.sin(t * 0.31 * w[5] + w[2]) + 0.22 * Math.sin(t * 0.53 * w[5] + w[3]);
    const px = stemX + F.fx * (S[0] + wa) + F.rx * (S[1] + wc), pz = stemZ + F.fz * (S[0] + wa) + F.rz * (S[1] + wc);
    const along = (px - H.x) * F.fx + (pz - H.z) * F.fz, across = (px - H.x) * F.rx + (pz - H.z) * F.rz, far = Math.hypot(along, across);
    const facing = sw.dir.x * F.fx + sw.dir.z * F.fz;                                    // 1 = heading as the boat heads
    if (st.gate) {
      // from ahead: down the side, well clear of the hull, to a point abeam; then round, away from the bow, and up alongside
      const gx = boat.x + F.rx * st.gate * 11 - F.fx * 3, gz = boat.z + F.rz * st.gate * 11 - F.fz * 3;
      g.x = gx; g.z = gz; g.speed = Math.max(3.5, st.rush || 0); sw.state.wide = 4;
      if ((H.x - boat.x) * F.fx + (H.z - boat.z) * F.fz < 1.5 || Math.hypot(gx - H.x, gz - H.z) < 4) { st.gate = 0; st.join = true; }
    } else if (st.join || (far > 9 && along > 0.55 * far)) {
      g.x = px; g.z = pz; g.speed = Math.max(top, st.rush || 0); sw.state.wide = st.join ? 3.4 : 0;      // its place is well ahead of it (or it is wheeling round to join): straight for it
      if (st.join && facing > 0.35) st.join = false;
      if (far < 12) st.rush = 0;                                                         // the run-in ends as it nears its place
    } else {
      // near: it never turns back for its place. It steers for a point ahead of ITSELF, on its place's line, and lets
      // its speed take it forward or back along the boat. It crosses on a slant, never broadside.
      // (Worked out as a speed over the boat: sideways toward its place's line, at most 2.6 m/s; forward or back along
      // the boat at most 2.2 m/s back; and always enough way on through the water that the slant is under 35 degrees.)
      const vLat = clamp(across * 0.9, -2.6, 2.6);
      let vFwd = Math.max(bs + clamp(0.9 * along, -2.2, top), Math.abs(vLat) / 0.7, 1.2), v = Math.hypot(vFwd, vLat);
      if (v > top) { vFwd *= top / v; v = top; }
      const lead = 4, side = lead * vLat / vFwd * (top / Math.max(top, Math.hypot(vFwd, vLat)));
      g.x = H.x + F.fx * lead + F.rx * side; g.z = H.z + F.fz * lead + F.rz * side; g.speed = v;
      if (st.moving && far < 1.3) { st.moving = false; st.hold = 4 + 3 * sw.rnd(); }
      // its time on this place is up: it changes places WITH another, by choice one on the other side, so that the two cross under the stem
      if (!st.moving && !st.roll && (st.hold -= dt) <= 0) {
        const movers = list.reduce((n, o) => n + (o.active && o.state.moving ? 1 : 0), 0);
        const mySide = Math.sign(S[1]), settled = list.filter((o) => o !== sw && o.active && !o.state.moving && !o.state.gate && !o.state.join && !o.state.roll && o.state.station >= 0);
        const other = settled.filter((o) => Math.sign(pod.stations[o.state.station][1]) !== mySide);
        const pool = other.length ? other : settled;
        if (movers >= 2 || !pool.length) st.hold = 1 + 2 * sw.rnd();
        else {
          const o = pool[Math.floor(sw.rnd() * pool.length)], mine = st.station;
          st.station = o.state.station; st.moving = o.state.moving = true; st.hold = o.state.hold = 9;
          o.state.swapTo = mine; o.state.swapAt = t + 0.3 + 0.9 * sw.rnd();              // the other sets off a moment later: never two on one beat
        }
      }
    }
    depth = S[2] + 0.22 * Math.sin(t * 0.37 * w[5] + w[4]);
  } else if (pod.mode === 'range') {
    if (!st.spot || t > st.spot.until) {
      const a = (st.spot ? st.spot.a : sw.rnd() * TAU) + (0.6 + 0.9 * sw.rnd()) * (sw.i % 2 ? 1 : -1), r = 15 + 10 * sw.rnd();
      st.spot = { a, r, until: t + 4 + 4 * sw.rnd() };
    }
    g.x = boat.x + Math.sin(st.spot.a) * st.spot.r; g.z = boat.z + Math.cos(st.spot.a) * st.spot.r; g.speed = 3.2 + 0.5 * Math.sin(t * 0.3 + sw.i); depth = 2.2; st.moving = false; st.gate = 0; st.join = false;
    sw.state.wide = 3.2;
  } else if (pod.mode === 'hunt') {
    const a = t * 1.1 + sw.i * TAU / list.length, r = 2.5 + 1.5 * Math.sin(t * 0.7 + sw.i);
    g.x = pod.hunt.x + Math.sin(a) * r; g.z = pod.hunt.z + Math.cos(a) * r; g.speed = top; depth = -pod.hunt.y + 0.6 * Math.sin(a * 0.5); st.moving = false; st.gate = 0; st.join = false;
  } else if (pod.mode === 'leave' && st.exit) {
    g.x = st.exit.x; g.z = st.exit.z; g.speed = sys.calm ? 5 : 6.5; depth = 2.4;
    if (Math.hypot(H.x - boat.x, H.z - boat.z) > 52 || Math.hypot(H.x - st.exit.x, H.z - st.exit.z) < 5) { sw.active = false; st.gone = true; }
  }
  // the roll at the surface, in turn: up a low arc until the blowhole clears, and under again; never over the hull, never two at once side by side
  const offKeel = Math.abs((H.x - boat.x) * F.rx + (H.z - boat.z) * F.rz), alongKeel = (H.x - boat.x) * F.fx + (H.z - boat.z) * F.fz;
  const byHull = offKeel < 2.4 && alongKeel > -3.5 && alongKeel < 4.2;
  if (!st.roll && t > (st.nextRoll || 0) && !byHull && sw.speed > 1.4 && sw.speed < 5.2 && Math.abs(sw.turn) < 0.2 && pod.mode !== 'leave') {      // (never in a turn: banked, a fluke would come out; never at a rush: that would be a leap)
    if (list.some((o) => o !== sw && o.active && o.state.roll && (o.state.roll.up || o.atSurface))) st.nextRoll = t + 0.5 + 0.7 * sw.rnd();      // another is up: wait until it is under again
    else st.roll = { t: 0, up: true };
  }
  if (st.roll) {
    // One low arc: up at twenty degrees, over the top with its spine a hand under the water (so the blowhole clears by
    // a hand and the fin stands out, and the flukes, which follow the same line, never do), and down again as steeply.
    // (The first version steered for a point at the surface and crept up to it for two seconds or never arrived.)
    const r = st.roll, lvl = sys.ctx.water.heightAt(H.x, H.z), yTop = lvl - 0.09 * sw.scale, P = 21 * RAD, v = Math.max(1.5, sw.speed);
    r.t += dt;
    if (r.up) {
      g.pitch = P; g.pitchTau = 0.22;
      if (H.y >= yTop - 0.03 * v || r.t > 4 || byHull) r.up = false;                              // it rounds over (it rises a little more as its nose comes down)
    } else {
      g.pitch = -0.85 * P; g.pitchTau = 0.3;
      if (H.y < -0.6 * depth || r.t > 7) { st.roll = null; st.nextRoll = t + 7 + 6 * sw.rnd(); }      // (with the roll itself and the wait for a clear turn, each comes up every 12 to 18 s)
    }
    g.y = -depth;
  } else { g.pitch = null; g.y = byHull ? Math.min(-depth, -1.3) : -depth; g.pitchTau = 0.4; }
  sw.effort = ease(sw.effort, st.roll ? 0.2 : 1, dt, 0.25);                // it glides over the top: a stroke there would throw its flukes out of the water
  // they keep a body's width apart
  for (const o of list) {
    if (o === sw || !o.active) continue;
    const ex = H.x - o.head.x, ez = H.z - o.head.z, e = Math.hypot(ex, ez, H.y - o.head.y);
    if (e < 1.3 && e > 1e-3) { g.x += ex / e * (1.3 - e) * 4; g.z += ez / e * (1.3 - e) * 4; }
  }
};

SPECIES.dolphin.fins = (sys, sw, dt) => {
  const turn = clamp(sw.turn, -1, 1), fast = clamp(sw.speed / 6, 0, 1), sway = 3 * Math.sin(sys.time * 1.7 + sw.i);
  sw.bone('flip_L', 4 + sway, 0, -18 * Math.max(0, turn) + 8 * fast); sw.bone('flip_R', 4 - sway, 0, -18 * Math.max(0, -turn) + 8 * fast);
};

SPECIES.dolphin.after = (sys, sw, dt) => {
  const st = sw.state, mk = sw.marks, lvl = mk.blowhole.y - sys.ctx.water.heightAt(mk.blowhole.x, mk.blowhole.z);
  if (!st.blown && lvl > 0.02) {                                         // the breath: a ring, a line of light for the realm's trace, a sound for the realm
    st.blown = true;
    sys.touch(mk.blowhole.x, mk.blowhole.z, 0.7, 1.2, 'blow', sw);
    const tr = sys.options.trace && sys.ctx.water.trace;
    if (tr && tr.line) tr.line(mk.blowhole.x - sw.dir.x, mk.blowhole.z - sw.dir.z, mk.blowhole.x + sw.dir.x, mk.blowhole.z + sw.dir.z, { channel: sys.options.trace, radius: 0.5, strength: 1 });
  } else if (st.blown && lvl < -0.25) st.blown = false;
};

// ================================================================================================ the pike
// It hangs. Only its fins work: the pectorals scull in turn, the dorsal and anal ripple, the gill covers breathe.
// It strikes once when it is told to: draws into an S, shoots, gapes, shuts, glides, and comes slowly back to its lie.
// When the hull comes within 2.5 m it turns away without hurry to its refuge and is back in about twenty-five seconds.
SPECIES.pike.setup = (sys, handle, options) => {
  const list = handle.swimmers;
  for (const sw of list) sw.goal = { x: 0, y: 0, z: 0, speed: 0 };
  /**
   * Where it lies: at: [x, y, z] (y its depth, negative), toward: [x, z] the way it faces (or heading: radians, 0 = +z).
   * refuge: [x, y, z] where it goes when the boat comes too near (default: 6 m straight ahead of it).
   */
  handle.hang = (o = {}) => {
    for (const sw of (o.who == null ? list : [list[o.who]])) {
      const [x, y, z] = o.at, yaw = o.toward ? Math.atan2(o.toward[0] - x, o.toward[1] - z) : (o.heading ?? 0);
      sw.put(x, y, z, yaw); sw.speed = 0;
      sw.state.home = { x, y, z, yaw }; sw.state.mode = 'hang'; sw.state.t = 0;
      // the side of its lie on which the water is open (it turns only there): toward `open`, or toward the middle of the waterway
      let ox, oz; const op = o.open || options.open;
      if (op) { ox = op[0]; oz = op[1]; }
      else { let best = 1e18; const P = sys.ctx.path; for (let q = 0; q <= P.length; q += 2) { const c = P.at(q), dd = (c.x - x) * (c.x - x) + (c.z - z) * (c.z - z); if (dd < best) { best = dd; ox = c.x; oz = c.z; } } }
      sw.state.side = ((ox - x) * Math.cos(yaw) - (oz - z) * Math.sin(yaw)) >= 0 ? 1 : -1;        // +1: open water on its own left
      // the family knows nothing of timber: told what stands near (clear: [[x, z, radius], ...]), it says at once if its strike or its way back would touch it
      const room = handle.room(sw.i), hx = Math.sin(yaw), hz = Math.cos(yaw), nx = hz * sw.state.side, nz = -hx * sw.state.side;
      for (const c of (o.clear || options.clear || [])) {
        const a = (c[0] - x) * hx + (c[1] - z) * hz, b = (c[0] - x) * nx + (c[1] - z) * nz, r = c[2] || 0.1;
        if (a > -room.behind - r && a < room.ahead + r && b > -room.other - r && b < room.open + r)
          console.error(`INVALID_STAGING swimmers: the pike's lie at (${x.toFixed(1)}, ${z.toFixed(1)}) has something in its water at (${c[0].toFixed(1)}, ${c[1].toFixed(1)}): ${a.toFixed(2)} m ahead of its snout and ${b.toFixed(2)} m to its open side. It needs ${room.ahead.toFixed(1)} m ahead, ${room.behind.toFixed(1)} m behind and ${room.open.toFixed(1)} m on the open side clear`);
      }
      sw.state.refuge = o.refuge || options.refuge || [x + Math.sin(yaw) * 6, y - 0.1, z + Math.cos(yaw) * 6];
      {                                                        // and the straight way to its refuge and back
        const rf = sw.state.refuge, D = room.open - 0.15, ends = [[x, z], [x - hx * 0.5 * sw.L + nx * D, z - hz * 0.5 * sw.L + nz * D]];
        for (const c of (o.clear || options.clear || [])) for (const e of ends) {
          const ux = rf[0] - e[0], uz = rf[2] - e[1], ul = ux * ux + uz * uz || 1, t = clamp(((c[0] - e[0]) * ux + (c[1] - e[1]) * uz) / ul, 0, 1), gap = Math.hypot(c[0] - e[0] - ux * t, c[1] - e[1] - uz * t) - (c[2] || 0.1);
          if (gap < 0.2) console.error(`INVALID_STAGING swimmers: the pike's way between its lie and its refuge passes ${Math.max(0, gap).toFixed(2)} m from what stands at (${c[0].toFixed(1)}, ${c[1].toFixed(1)}): move the refuge or the lie (it needs 0.2 m)`);
        }
      }
    }
    return handle;
  };
  /** It strikes, once: at: [x, y, z] what it takes (default: 0.75 m ahead of its snout). It comes back to its lie by itself. */
  handle.strike = (o = {}) => {
    for (const sw of (o.who == null ? list : [list[o.who]])) {
      if (!sw.active || sw.state.mode !== 'hang') continue;
      const d = sw.dir, at = o.at || [sw.head.x + d.x * 0.75 * sw.scale, sw.head.y + d.y * 0.75 * sw.scale, sw.head.z + d.z * 0.75 * sw.scale];
      sw.state.mode = 'coil'; sw.state.t = 0; sw.state.prey = at; sw.state.onDone = o.onDone || null;
    }
    return handle;
  };
  /**
   * The clear water its lie needs, in metres from its snout as it lies: `ahead` (its strike, its glide and the turn at
   * the end of it), `behind` (the turn that brings it back onto its line: no further back than its own tail), `open`
   * (to the side on which the water is open: the width of its turn) and `other` (to the other side: nothing).
   * reach: how far off what it strikes at is (default 0.75 m).
   */
  handle.room = (who = 0, reach) => {
    const sw = list[who], D = 2.1 * (sys.kind.minRadius || 0.4) * sw.scale;
    return { ahead: (reach ?? 0.75 * sw.scale) + 1.05 * sw.scale + D / 2 + 0.2, behind: 0.5 * sw.L + D / 2 + 0.25, open: D + 0.15, other: 0.15, side: sw.state.side || 1 };
  };
  /** Send it to its refuge now (it does so by itself when the hull comes within `shy` metres: option shy, default 2.5). */
  handle.flee = (who) => { for (const sw of (who == null ? list : [list[who]])) if (sw.active && sw.state.mode === 'hang') { sw.state.mode = 'flee'; sw.state.t = 0; } return handle; };
  if (options.at) handle.hang({ at: options.at, toward: options.toward, heading: options.heading, refuge: options.refuge, open: options.open });
};

SPECIES.pike.think = (sys, sw, dt) => {
  const st = sw.state, g = sw.goal, home = st.home, H = sw.head, boat = sys.ctx.boat, slow = sys.calm ? 2 : 1, sh = sw.shapes;
  if (!home) return;
  st.t += dt;
  const hx = Math.sin(home.yaw), hz = Math.cos(home.yaw);
  let coil = 0, gape = 0, gill = 0, flare = 0, fold = 0;
  sw.speedTau = 0.6; g.pitchTau = 0.5;
  if (st.mode === 'hang') {
    g.speed = 0; g.x = H.x + hx; g.z = H.z + hz; g.y = home.y;
    sw.head.y = home.y + 0.004 * Math.sin(sys.time * 0.6 + sw.i);                               // it only breathes
    {                                                                                          // and settles the last centimetres onto its lie and its line, as a hanging fish drifts
      const k = 1 - Math.exp(-dt / 3), yawNow = Math.atan2(sw.dir.x, sw.dir.z), dy = Math.atan2(Math.sin(home.yaw - yawNow), Math.cos(home.yaw - yawNow)), yaw = yawNow + dy * k;
      sw.head.x += clamp(home.x - H.x, -0.2, 0.2) * k; sw.head.z += clamp(home.z - H.z, -0.2, 0.2) * k; sw.dir.set(Math.sin(yaw), 0, Math.cos(yaw));
    }
    const shy = sys.options.shy ?? 2.5;
    if (Math.hypot(boat.x - H.x, boat.z - H.z) < shy && st.t > 1) { st.mode = 'flee'; st.t = 0; }
  } else if (st.mode === 'coil') {                                                             // it draws into an S
    const T = 0.5 * slow; coil = smooth(0, T, st.t); flare = coil; gill = 0.5 * coil; g.speed = 0;
    if (st.t >= T) {
      st.mode = 'lunge'; st.t = 0; st.d0 = sw.odo; st.reach = Math.max(0.2, Math.hypot(st.prey[0] - H.x, st.prey[1] - H.y, st.prey[2] - H.z));
      // The boil is where its tail kicked off, as it goes (not over its head where the strike ends: the ring then
      // spread straight over the fish as it stopped, and for a tenth of a second the water showed two pike).
      const n3 = sw.J.length - 3, tx = Number.isFinite(sw.J[n3]) ? sw.J[n3] : H.x, tz = Number.isFinite(sw.J[n3 + 2]) ? sw.J[n3 + 2] : H.z;
      if (H.y > -0.7) sys.touch(tx, tz, 0.6, 0.6, 'strike', sw);                                 // a boil on the surface, if it lay near it
      else if (sys.options.onTouch) sys.options.onTouch(tx, tz, 'strike', sw);
    }
  } else if (st.mode === 'lunge') {                                                            // and goes
    const k = clamp((sw.odo - st.d0) / st.reach, 0, 1);
    coil = 1 - 1.3 * smooth(0, 0.5, k); gape = smooth(0.1, 0.6, k); gill = 0.5 + 0.5 * gape; fold = smooth(0, 0.3, k); flare = 1 - k;
    g.x = st.prey[0] + sw.dir.x; g.y = st.prey[1]; g.z = st.prey[2] + sw.dir.z; g.speed = sys.kind.top / slow; sw.speedTau = 0.05 * slow; g.pitchTau = 0.15; sw.effort = 0.6;
    if (k >= 1 || st.t > 1.5) { st.mode = 'glide'; st.t = 0; }
  } else if (st.mode === 'glide') {                                                            // the mouth shuts; it runs on a body's length, braking on its spread pectorals, and hangs a moment
    coil = -0.3 * (1 - smooth(0, 0.4, st.t)); gape = 1 - smooth(0, 0.09, st.t); gill = 1 - smooth(0.05, 0.6, st.t); fold = 1 - smooth(0.3, 1.5, st.t);
    flare = smooth(0.03, 0.2, st.t) * (1 - smooth(0.9, 1.8, st.t));
    g.x = H.x + sw.dir.x; g.z = H.z + sw.dir.z; g.y = H.y; g.speed = 0.06; sw.speedTau = 0.27; sw.effort = 0.2;
    if (st.t > 2.6) { st.mode = 'return'; st.t = 0; st.leg = 0; st.brisk = 1; sw.effort = 1; }
  } else if (st.mode === 'flee') {                                                             // away from the hull, without hurry
    const r = st.refuge; g.x = r[0]; g.y = r[1]; g.z = r[2]; g.speed = 0.7; flare = 0.3 * (1 - smooth(0.5, 2, st.t));
    if (!st.turned && st.t > 0.5) {                                                            // the one sweep of its tail that turns it away dents the surface over it: the landing's one ring
      st.turned = true;
      const n3 = sw.J.length - 3;
      if (H.y > -0.7) sys.touch(sw.J[n3], sw.J[n3 + 2], 0.6, 0.6, 'turn', sw); else if (sys.options.onTouch) sys.options.onTouch(sw.J[n3], sw.J[n3 + 2], 'turn', sw);
    }
    if (Math.hypot(r[0] - H.x, r[2] - H.z) < 0.25) { st.mode = 'wait'; st.t = 0; }
  } else if (st.mode === 'wait') {
    g.speed = 0;
    if (st.t > (sys.options.away ?? 4) && Math.hypot(boat.x - home.x, boat.z - home.z) > (sys.options.shy ?? 2.5) + 1) { st.mode = 'return'; st.t = 0; st.leg = 0; st.far = true; st.brisk = 1.4; }      // (it comes home from its refuge a little brisker than it settles after a strike)
  } else if (st.mode === 'return') {
    // Back to its lie, by a racetrack that lies wholly on the open side of it: it turns round toward open water, swims
    // back past its lie a body's width off, turns again the same way just behind it, and comes in along the way it
    // faces. (The first version looped round behind the lie on whichever side it happened to turn, through the piles
    // of the test staithe, and then hung wherever it drew level with its lie: half a metre to one side.)
    const sd = st.side || 1, nx = hz * sd, nz = -hx * sd, D = 2.1 * (sys.kind.minRadius || 0.4) * sw.scale;      // (nx, nz): across the lie, toward open water; D: the width of its turn
    const along = (H.x - home.x) * hx + (H.z - home.z) * hz, lat = (H.x - home.x) * nx + (H.z - home.z) * nz, face = sw.dir.x * hx + sw.dir.z * hz;
    g.y = home.y;
    if (st.leg === 0) {                                        // round, toward open water
      g.x = H.x + nx - hx * 0.3; g.z = H.z + nz - hz * 0.3; g.speed = 0.34 * (st.brisk || 1);
      if (face < -0.2 || along < -0.3 * sw.L) st.leg = 1;
    } else if (st.leg === 1) {                                 // back past its lie, a turn's width off
      const px = home.x - hx * 0.5 * sw.L + nx * D, pz = home.z - hz * 0.5 * sw.L + nz * D, far = Math.hypot(px - H.x, pz - H.z);
      g.x = px; g.z = pz; g.speed = st.far && far > 1.6 ? 0.7 : 0.34 * (st.brisk || 1);
      if (along < -0.38 * sw.L || far < 0.12) { st.leg = 2; st.far = false; }
    } else if (st.leg === 2) {                                 // round again, onto its own line
      g.x = home.x + hx * 0.8; g.z = home.z + hz * 0.8; g.speed = 0.3 * (st.brisk || 1);
      if (face > 0.7 && Math.abs(lat) < 0.25) st.leg = 3;
    } else {                                                   // and in along the way it faces
      const left = -along;
      g.x = home.x + hx * Math.max(0.35, 0.5 - left); g.z = home.z + hz * Math.max(0.35, 0.5 - left);
      g.speed = clamp(left * 1.1, 0.05, 0.28);
      if (left < 0.012) { st.mode = 'hang'; st.t = 0; sw.speed = 0; st.turned = false; if (st.onDone) { const fn = st.onDone; st.onDone = null; fn(sw); } }
    }
  }
  sh.coil = coil; st.gape = gape; st.gill = gill; st.flare = flare; st.fold = fold;
};

SPECIES.pike.fins = (sys, sw, dt) => {
  const st = sw.state, t = sys.time, still = 1 - clamp(sw.speed / 0.25, 0, 1), calm = sys.calm ? 0.7 : 1;
  const p1 = t * TAU * 1.2 + sw.i, s1 = Math.sin(p1) * still * calm, s2 = Math.sin(p1 + Math.PI * 0.92) * still * calm, fl = st.flare || 0, fold = st.fold || 0;
  sw.bone('pec_L', 10 * s1 + 6 * fl, 16 * s1, -20 * fl - 12 * s1 + 14 * (1 - still)); sw.bone('pec_R', 10 * s2 + 6 * fl, 16 * s2, -20 * fl - 12 * s2 + 14 * (1 - still));
  const q = Math.sin(t * TAU * 0.6 + 1.3) * still * 0.5;
  sw.bone('pelv_L', 4 * q + 3 * fl, 0, -10 * fl - 6 * q + 12 * (1 - still)); sw.bone('pelv_R', -4 * q + 3 * fl, 0, -10 * fl + 6 * q + 12 * (1 - still));
  const side = sw.sideSpeed(8, dt);
  sw.bone('dors', 38 * fold, 0, 6 * Math.sin(t * TAU * 0.8) * still * calm + sw.spring('dors', clamp(-side * 60, -18, 18), dt, 6, 0.7));
  sw.bone('anal', 38 * fold, 0, 6 * Math.sin(t * TAU * 0.8 + 2.2) * still * calm + sw.spring('anal', clamp(side * 60, -18, 18), dt, 6, 0.7));
  const breath = 0.5 + 0.5 * Math.sin(t * TAU * 0.85 + sw.i);
  const gill = Math.max(st.gill || 0, 0.14 * breath * (0.4 + 0.6 * still));
  sw.bone('gill_L', 20 * gill, 0, 0); sw.bone('gill_R', 20 * gill, 0, 0);
  sw.bone('jaw', -30 * (st.gape || 0) - 1.2 * breath * still, 0, 0);
};

// ================================================================================================ light round a swimmer
// The water's own picture of its flecks (src/engine/water-final-trace.js): the light drawn here is cut with the same
// mask at the same scale and place as the water's light from touch, so the two cannot be told apart. One per realm.
const _flecks = new WeakMap();
function fleckTexture(ctx) { let t = _flecks.get(ctx); if (!t) { t = makeFleckTexture(); _flecks.set(ctx, t); } return t; }
const FLECK_GLSL = /* glsl */`
  uniform sampler2D tSwimFleck; uniform float uSwimFleck, uSwimClock;
  // p: a place on the water (realm x, z). E: how lit the water is there, 0..1. Each fleck has its own threshold, so
  // they come one by one as E rises and go one by one as it falls (the water's own arithmetic).
  vec3 swimHash3(vec2 p) { vec3 q = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973)); q += dot(q, q.yzx + 33.33); return fract((q.xxy + q.yzz) * q.zyx); }
  float swimFlecks(vec2 p, float E) {
    vec2 u = p * uSwimFleck, f1 = texture2D(tSwimFleck, u).rg, f2 = texture2D(tSwimFleck, u.yx * 0.43 + 0.37).rg;
    float cut = 1.02 - E * 0.8;
    float flecks = smoothstep(cut, cut + 0.2, f1.r) * f1.g * (0.55 + 0.75 * f1.g) + 0.7 * smoothstep(cut + 0.1, cut + 0.3, f2.r) * f2.g * (0.55 + 0.75 * f2.g);
    // Too far off to tell flecks apart (a whale's footprint is seen at forty metres): soft points that come and go stand
    // in for them, about as many near as far, as the water itself does it
    vec2 fa = dFdx(p), fb = dFdy(p); float foot = max(length(fa), length(fb)), blurred = smoothstep(0.012, 0.05, foot * uSwimFleck);
    if (blurred > 0.0) {
      float det = fa.x * fb.y - fa.y * fb.x; mat2 toPx = mat2(fb.y, -fa.y, -fb.x, fa.x) / (abs(det) > 1e-12 ? det : 1e-12);
      float lv = max(log2(foot * 62.0), 0.0), l0 = floor(lv), fr = lv - l0, sum = 0.0, chance = clamp(E * 0.8, 0.0, 0.6);
      for (int i = 0; i < 2; i++) {
        float cell = 0.09 * exp2(l0 + float(i)); vec2 id = floor(p / cell);
        vec3 h = swimHash3(id + (l0 + float(i)) * 17.0);
        float cyc = uSwimClock * (0.55 + 0.7 * h.z) + h.x * 7.0, ph = fract(cyc), b = sin(3.14159 * ph);
        vec3 k = swimHash3(id + floor(cyc) * 3.7 + 5.0);
        vec2 dpx = toPx * (p - (id + 0.25 + 0.5 * k.xy) * cell);
        sum += (i == 0 ? 1.0 - fr : fr) * step(k.z, chance) * (1.0 - smoothstep(0.4, 1.8, length(dpx))) * b * b;
      }
      flecks = mix(flecks, sum * 1.5 + E * E * 0.05, blurred);
    }
    return flecks * (0.45 + 0.55 * E);
  }
  // a slow unevenness, so that no edge is a ruled circle
  float swimSoft(vec2 p) { return texture2D(tSwimFleck, p * uSwimFleck * 0.09 + 0.21).g; }
`;
/**
 * Light on and under the water round a swimmer, drawn from what the family reports: for a place where a creature is
 * seen by the light it stirs (the answering sea). Everything is broken into flecks by the water's own fleck mask, so
 * it sits in the water's light from touch as part of it:
 *   prints    where a whale's flukeprints and footprint are (handle.prints): a slick of smooth dark water with a
 *             ragged ring of flecks round it that opens, turns slowly and thins away
 *   smear     for a single great swimmer: one long patch of flecks on the surface over its body while it passes
 *             within `smear` metres of the surface (default 14; 0 = none): what shows of it when the eye cannot see
 *             down to it. Fullest over its middle, fading with its depth
 *   comets    a tapering ribbon of flecks under the water along each swimmer's track (needs the swimmer option `wake`)
 * o: { color, strength (2.5), comet: width in metres (0.5; 0 = none), seconds: how long a comet is (the swimmer's `wake`),
 *      prints: true, life: seconds a print lasts (18), smear, parent }
 * Returns { object, strength, color }: set .strength every frame from the realm's own measure of the sea's light.
 */
export function makeSwimLight(ctx, handle, o = {}) {
  const S = ctx.engine.shared, group = new THREE.Group(), NP = 12, big = handle.swimmers.length === 1 ? handle.swimmers[0] : null;
  const smear = big ? (o.smear ?? 14) : 0, NS = smear > 0 ? big.body.length / 4 : 0;
  const uColor = { value: new THREE.Color(o.color ?? '#b4e86a') }, uStrength = { value: o.strength ?? 2.5 }, uNow = { value: 0 };
  const uHull = { value: new THREE.Vector4(0, 0, 1, 0) };               // where the rider's boat is and how it is turned: nothing is drawn inside it
  const shared = { uFogColor: S.uFogColor, uFogDensity: S.uFogDensity, uVeil: S.uVeil, uVeilColor: S.uVeilColor, uCameraPos: S.uCameraPos, uColor, uStrength, uNow, uHull,
    tSwimFleck: { value: fleckTexture(ctx) }, uSwimFleck: { value: 1 / 3 }, uSwimClock: uNow, uSwimUnder: { value: 1 }, uSwimLift: { value: handle.lift === null ? -1 : handle.lift ?? 1.2 } };
  const HULL = /* glsl */`uniform vec4 uHull;
    bool swimInHull(vec2 w) { vec2 q = w - uHull.xy; q = vec2(q.x * uHull.z - q.y * uHull.w, q.x * uHull.w + q.y * uHull.z) / vec2(1.0, 2.5); return dot(q, q) < 1.0; }`;
  group.name = 'swimmers:light';
  // ---- prints: one flat quad each, lying on the water
  let prints = null, pAttr = null, rAttr = null;
  if (o.prints !== false && handle.prints) {
    const geo = new THREE.InstancedBufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1]), 3)); geo.setIndex([0, 2, 1, 0, 3, 2]);
    pAttr = new THREE.InstancedBufferAttribute(new Float32Array(NP * 4).fill(-1e6), 4); geo.setAttribute('aPrint', pAttr);
    rAttr = new THREE.InstancedBufferAttribute(new Float32Array(NP), 1); geo.setAttribute('aRadius', rAttr);
    geo.instanceCount = NP;
    prints = new THREE.Mesh(geo, new THREE.ShaderMaterial({
      uniforms: { ...shared, uLife: { value: o.life ?? 18 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */`${FOG_PARS}
        attribute vec4 aPrint; attribute float aRadius; uniform float uNow, uLife;
        varying vec2 vQ, vW, vC; varying float vAge, vDist, vR;
        void main() {
          float age = uNow - aPrint.w; vAge = age / uLife;
          float r = aRadius * (0.4 + 0.6 * smoothstep(0.0, 4.5, age) + 0.35 * vAge) * 1.25;       // it opens over four seconds and goes on widening slowly (the quad is a quarter larger than the slick: its edge is ragged)
          vec3 p = vec3(aPrint.x + position.x * r, 0.04, aPrint.z + position.z * r);
          vQ = position.xz * 1.25; vW = p.xz; vC = aPrint.xz; vR = r / 1.25;
          vec4 mv = viewMatrix * modelMatrix * vec4(p, 1.0); vDist = length(mv.xyz);
          gl_Position = (age < 0.0 || vAge > 1.0) ? vec4(0.0, 0.0, -2.0, 1.0) : projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */`${FOG_PARS}
        ${FLECK_GLSL}
        ${HULL}
        uniform vec3 uColor; uniform float uStrength, uNow, uLife; varying vec2 vQ, vW, vC; varying float vAge, vDist, vR;
        void main() {
          if (swimInHull(vW)) discard;                                          // never inside the rider's own boat
          // the flecks turn slowly about the middle of the slick (its water was pushed up from below and spreads)
          float a = vAge * uLife * 0.035, ca = cos(a), sa = sin(a); vec2 d = vW - vC, w = vC + vec2(d.x * ca - d.y * sa, d.x * sa + d.y * ca);
          float l = length(vQ) + (swimSoft(w) - 0.5) * 0.34;                    // a ragged edge
          // smooth dark water in the middle; the light stands in a ring where the upwelling meets the sea, brightest when new
          float ring = smoothstep(0.4, 0.88, l) * (1.0 - smoothstep(0.9, 1.12, l)), heart = 0.1 * (1.0 - smoothstep(0.0, 0.6, l));
          float life = smoothstep(0.0, 0.05, vAge) * pow(1.0 - vAge, 1.6);
          float E = clamp((ring * 0.62 + heart) * life, 0.0, 1.0);
          gl_FragColor = vec4(uColor * (swimFlecks(w, E) * uStrength * (1.0 - fogAmount(vDist))), 1.0);
        }`,
    }));
    prints.frustumCulled = false; prints.renderOrder = 3; group.add(prints);
    ctx.only(prints, 'direct');                                               // it lies on the water: the mirror has no use for it
  }
  // ---- ribbons: the smear over a great body (on the surface), and the comets (under it, along each swimmer's track)
  const ribbon = (rows, cols, under) => {
    const geo = new THREE.BufferGeometry(), idx = [], n = rows * cols;
    const pos = new THREE.BufferAttribute(new Float32Array(n * 2 * 3), 3), lit = new THREE.BufferAttribute(new Float32Array(n * 2 * 2), 2);
    pos.setUsage(THREE.DynamicDrawUsage); lit.setUsage(THREE.DynamicDrawUsage);
    for (let i = 0; i < rows; i++) for (let k = 0; k < cols - 1; k++) { const a = (i * cols + k) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    geo.setAttribute('position', pos); geo.setAttribute('aLit', lit); geo.setIndex(idx);
    const mesh = new THREE.Mesh(geo, new THREE.ShaderMaterial({
      uniforms: shared, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      vertexShader: /* glsl */`${FOG_PARS} ${SWIM_SEEN_GLSL}
        attribute vec2 aLit; uniform vec3 uCameraPos; uniform float uSwimLift; varying vec2 vA, vW; varying float vDist;
        void main() {
          vA = aLit; vW = position.xz;
          vec4 wp = modelMatrix * vec4(position, 1.0);
          ${under ? 'float g; if (uSwimLift > -0.5) wp.y = swimSeenCap(wp.xyz, uCameraPos, uSwimLift, g);' : ''}      // (seen through the surface like the body it trails from)
          vec4 mv = viewMatrix * wp; vDist = length(mv.xyz); gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */`${FOG_PARS}
        ${FLECK_GLSL}
        ${HULL}
        uniform vec3 uColor; uniform float uStrength, uSwimUnder; varying vec2 vA, vW; varying float vDist;
        void main() {
          ${under ? '' : 'if (swimInHull(vW)) discard;'}
          float across = 1.0 - vA.y * vA.y, E = clamp(vA.x * across * (0.75 + 0.5 * swimSoft(vW)), 0.0, 1.0);      // (vA: how lit along the ribbon; -1..1 across it)
          gl_FragColor = vec4(uColor * (swimFlecks(vW, E) * uStrength * ${under ? 'uSwimUnder' : '0.5'} * (1.0 - fogAmount(vDist))), 1.0);      // (the smear is a field of many flecks: each is half as bright as a print's or a comet's, or the whole would glare)
        }`,
    }));
    mesh.frustumCulled = false; mesh.renderOrder = under ? -2 : 3; group.add(mesh);
    ctx.only(mesh, 'direct');                                                 // on the water or under it: nothing of it belongs in the mirror
    return { mesh, pos, lit };
  };
  const list = handle.swimmers, WK = list[0].wake ? list[0].wake.length / 4 : 0, width = o.comet ?? 0.5;
  const over = NS ? ribbon(1, NS + 3, false) : null, comets = WK && width > 0 ? ribbon(list.length, WK, true) : null;
  (o.parent || ctx.group).add(group);
  ctx.onUpdate(() => {
    uNow.value = handle.time;
    uHull.value.set(ctx.boat.x, ctx.boat.z, Math.cos(ctx.boat.heading), -Math.sin(ctx.boat.heading));
    const touch = ctx.waterLook && ctx.waterLook.touch;
    shared.uSwimFleck.value = 1 / (3 * Math.max(0.2, (touch && touch.fleck) || 1));       // the water's own fleck scale
    // light drawn under the surface shows by the water's `underglow` (docs/water.md): make up for it, so that a comet is as bright as `strength` says
    const WL = ctx.waterLook || {}, ug = typeof WL.underglow === 'number' && WL.underglow >= 0 ? WL.underglow : 1 - (WL.opacity ?? 0.94);
    shared.uSwimUnder.value = clamp(1 / Math.max(0.05, ug), 1, 5);
    if (prints) {
      const P = handle.prints, a = pAttr.array, r = rAttr.array;
      for (let i = 0; i < NP; i++) { const q = P[i]; if (q) { a[i * 4] = q.x; a[i * 4 + 2] = q.z; a[i * 4 + 3] = q.t; r[i] = q.r; } else a[i * 4 + 3] = -1e6; }
      pAttr.needsUpdate = true; rAttr.needsUpdate = true;
    }
    if (over) {
      // The smear: one ribbon on the surface along the body, a little wider than it (and as wide as its flukes at the
      // tail), lit by how near the surface each part is. It is what shows of a great body passing under the keel when
      // the eye cannot see down to it, so it has to read as ONE long shape sliding by: dense along its middle, ragged
      // toward its edges. (As first repainted it lit a third of its flecks at the most: thirty separate petals of light
      // over twenty-five metres, which nobody could have taken for a whale.)
      // Rows, from ahead of the snout to behind the flukes: an unlit one a little ahead, one at the snout (the head is a
      // quarter of a whale, and the spine stations begin behind it), one at every station, an unlit one behind the tail.
      const b = big.body, pos = over.pos.array, lit = over.lit.array, n = NS + 3, mk = big.marks, sn = mk.snout || big.head;
      const flukes = mk.fluke_L && mk.fluke_R ? 0.5 * Math.hypot(mk.fluke_L.x - mk.fluke_R.x, mk.fluke_L.z - mk.fluke_R.z) : 0;
      const born = big.active ? smooth(0, 4, handle.time - big.bornAt) : 0;                    // (never an appearance in less than four seconds)
      for (let j = 0; j < n; j++) {
        const k = Math.min(NS - 1, Math.max(0, j - 2)), k0 = Math.max(0, k - 1), k1 = Math.min(NS - 1, k + 1);
        let dx = b[k0 * 4] - b[k1 * 4], dz = b[k0 * 4 + 2] - b[k1 * 4 + 2]; const dl = Math.hypot(dx, dz) || 1; dx /= dl; dz /= dl;      // the way it heads there, level
        const rad = b[k * 4 + 3], o3 = j * 6, o2 = j * 4;
        let x, z, y, half, on = 1;
        if (j < 2) { x = sn.x + dx * (j === 0 ? 1.6 : 0); z = sn.z + dz * (j === 0 ? 1.6 : 0); y = sn.y + 0.5 * rad; half = 0.62 * (rad * 1.5 + 0.9); on = j; }
        else if (j === n - 1) { x = b[k * 4] - dx * (rad + 1.6); z = b[k * 4 + 2] - dz * (rad + 1.6); y = b[k * 4 + 1]; half = flukes + 0.4; on = 0; }
        else { x = b[k * 4]; z = b[k * 4 + 2]; y = b[k * 4 + 1] + rad; half = Math.max(rad * 1.5 + 0.9, k === NS - 1 ? flukes + 0.4 : k === NS - 2 ? 0.45 * flukes : 0); }
        const depth = -y, g = on && depth > 0.15 ? Math.min(0.64, 0.9 * Math.pow(clamp(1 - depth / smear, 0, 1), 0.8)) * born : 0;
        pos[o3] = x - dz * half; pos[o3 + 1] = 0.04; pos[o3 + 2] = z + dx * half; pos[o3 + 3] = x + dz * half; pos[o3 + 4] = 0.04; pos[o3 + 5] = z - dx * half;
        lit[o2] = lit[o2 + 2] = g * (0.45 + 0.55 * clamp(depth / 2.5, 0, 1)); lit[o2 + 1] = -1; lit[o2 + 3] = 1;      // (shallower than a couple of metres the water's own light, written by the trace, takes over)
      }
      over.pos.needsUpdate = true; over.lit.needsUpdate = true;
    }
    if (comets) {
      const pos = comets.pos.array, lit = comets.lit.array, now = handle.time, life = o.seconds ?? (handle.wakeSeconds || 3);
      list.forEach((sw, i) => {
        for (let k = 0; k < WK; k++) {
          const j = (((sw.wakeAt - 1 - k) % WK) + WK) % WK, jn = (((sw.wakeAt - 2 - k) % WK) + WK) % WK, w = sw.wake, o3 = (i * WK + k) * 6, o2 = (i * WK + k) * 4;
          let dx = w[j * 4] - w[jn * 4], dz = w[j * 4 + 2] - w[jn * 4 + 2]; const dl = Math.hypot(dx, dz) || 1; dx /= dl; dz /= dl;
          const a = sw.active ? clamp((now - w[j * 4 + 3]) / life, 0, 1) : 1, young = 1 - a, half = width * (0.3 + 0.7 * young) * (dl > 6 ? 0 : 1);
          pos[o3] = w[j * 4] - dz * half; pos[o3 + 1] = w[j * 4 + 1]; pos[o3 + 2] = w[j * 4 + 2] + dx * half;
          pos[o3 + 3] = w[j * 4] + dz * half; pos[o3 + 4] = w[j * 4 + 1]; pos[o3 + 5] = w[j * 4 + 2] - dx * half;
          lit[o2] = lit[o2 + 2] = Math.pow(young, 1.4) * (dl > 6 ? 0 : 1); lit[o2 + 1] = -1; lit[o2 + 3] = 1;
        }
      });
      comets.pos.needsUpdate = true; comets.lit.needsUpdate = true;
    }
  });
  return { object: group, get strength() { return uStrength.value; }, set strength(v) { uStrength.value = v; }, color: uColor.value };
}
