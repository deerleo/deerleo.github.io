// The rower: the lamplighter's apprentice, who stands on the stern bench behind the rider's seat and rows the boat as
// a gondolier does: facing the bow, one long oar out to starboard in a tall crutch, pushed with her weight. The client
// asked for her on 8 November ("a character like the [Gilt & Gutter] styled characters, but dressed more appropriately
// for this experience ... maybe they'd be rowing the boat"), and on 9 November, of the film, for "the rowing [to look]
// more natural" with "proper / realistic water physics when rowing": until then she sculled over the transom. She
// stands BEHIND the rider, so that nothing an area composes ahead is covered: the rider sees her on turning round,
// and the film sees her from outside. Her page is docs/life/rower.md.
//
// boat-hero.js builds her with every boat (the address switch &rower=0 leaves her ashore); nothing else has to know.
//   loadRower()                 fetch her model (assets/models/life/rower.glb) and its numbers; boat-hero's loadBoat awaits it
//   buildRower(own, direct)     -> { group, materials, update(dt, state), lookAt(point, seconds), ... } or null
//
// The model (source-art/models/life/rower.py) is in the boat's own frame: x starboard, y up, z aft. It holds her
// (one skinned mesh with her painted picture), the oar (a part that turns in the crutch) and the crutch, and two
// clips made so that her hands never leave the loom: `scull` (2.2 s, one stroke: the catch, the push, the release, the
// way back with the blade laid over) and `rest` (8 s, the oar held abeam, its blade just clear of the water).
//
// What she does:
//   * the two clips are mixed by how hard the boat is being driven through the water (the paddle, not the current):
//     she rows while the rider paddles, faster the faster the boat goes, and rests on her oar when the water carries it;
//   * the boat answers her: it is driven while her blade pushes and runs on while she comes back (`force`, `run`:
//     src/engine/boat.js, engine.js);
//   * her head is her own: it follows what a realm gives her to look at (rower.lookAt), the kept lamp when the boat
//     comes near one (she is the lamplighter's apprentice), and, at rest, the water to either side. She never looks
//     at the rider, and never turns her head further than a person would;
//   * the oar works the water, in the same simulation as the hull's wake (water-final-sim.js, blade()). Where the
//     blade pushes and where the shaft cuts the surface are two small moving pressure patches: short ripples run
//     from them for as long as the oar is in the water, as from anything drawn through water; what the blade has
//     worked is churned and shows pale for a few seconds (the puddle, which stays where it was made while the boat
//     goes on); it throws a few drops as it goes in, sheds water as it comes out, and drips along its way back.
//     (The first version, of the same morning, stamped a ring as the blade went in and a larger one as it came out
//     and did nothing in between. The client: "the rings ... are a bit too harsh", "the oar isn't causing any water
//     physics effects".)
// With reduced motion the stroke is slower and smaller and her head moves more slowly.
// &rowerlook=60,10 (a developer's switch) holds her gaze 60 degrees to starboard of the bow and 10 up, for looking at her.
//
// An area's last word on her is `look.rower` (read when the area is entered; all optional):
//   { own: 0.4,            how much of her own colours she keeps under the area's light (0 = she takes its colour wholly,
//                          as its buildings do; 1 = her painted colours at the area's brightness)
//     tone: '#ffffff',     one colour over all of her
//     rim: '#66d8e8', rimStrength: 0.4, rimPower: 2.6    an edge of light round her (a dark figure against a dark place) }
// There is one of her however many boats the engine keeps (a look whose boat follows its light has a boat of its own):
// whichever boat is on the water adopts her, so her stroke never starts over.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js';
import { makeGouache } from './gouache.js';
import { AREA_RAMP } from './lamp-hero.js';

const QS = typeof location !== 'undefined' ? location.search : '';
const num = (name, d) => { const m = new RegExp('[?&]' + name + '=(-?[\\d.]+)').exec(QS); return m ? +m[1] : d; };
/** Developer's switches: &rower=0 (she is not aboard), &rowersteps=3 (the steps of her paint's light), &rowerlamp=0.4. */
const LOOK_HELD = (() => { const v = new URLSearchParams(QS).get('rowerlook'), m = v && /^(-?[\d.]+)[,_ ](-?[\d.]+)$/.exec(v); return m ? [+m[1], +m[2]] : null; })();
// How strongly the oar marks the water (tuned by eye on the film's pictures; &rowermark=heap:0.3,shaft:0.2 tries others):
//   heap     metres of water the blade's face heaps before it (the strength of the ripples that run from the blade)
//   push     the least way through the water the blade is taken to make while it pushes, m/s at full force (a blade that
//            holds the water hardly moves through it, and would leave nothing to see)
//   shaft    the same as `heap` for the shaft where it cuts the surface
//   churn    how churned the blade leaves the water at full force (above 1 shows pale: water.js)
//   catch, release, drip   what is left of the stamped rings: a pin ring where it goes in, where it comes out, per drop
//   drops    how many drops (1 = as made; 0 = none)
//   rough    how unevenly the blade pushes from frame to frame, 0..1 (worked water turns over: an even push leaves
//            clean round rings, as a stone does; an uneven one leaves small broken ripples)
const MARK = { heap: 0.15, push: 0.5, shaft: 0.13, churn: 1.45, catch: 0.015, release: 0.02, drip: 0.02, drops: 1, rough: 0.7 };
{ const v = new URLSearchParams(QS).get('rowermark'); if (v) for (const kv of v.split(',')) { const [k, x] = kv.split(':'); if (k in MARK && Number.isFinite(+x)) MARK[k] = +x; } }
const LOG = (() => { const v = new URLSearchParams(QS).get('rowerlog'); return v && /^[\w.-]+$/.test(v) ? { name: v, rows: [] } : null; })();
export const ROWER_OPTIONS = { on: !/[?&]rower=0/.test(QS), steps: num('rowersteps', 10), lamp: num('rowerlamp', 0.3), scull: num('rowerscull', -1) };

let SRC = null, loading = null, ONE = null;
const LOOK = { own: 0.4, tone: '#ffffff', rim: '#ffffff', rimStrength: 0, rimPower: 2.6 };
/** An area's `look.rower` (see the top of this file). Safe to call when she is not aboard. */
export function setRowerLook(look) { if (ONE) ONE.setLook(look); else PENDING = look || null; }
let PENDING = null;
/** Fetch her model and its numbers before the first boat is built. Resolves to { data, gltf } (null when she is not aboard). */
export function loadRower() {
  if (!ROWER_OPTIONS.on) return Promise.resolve(null);
  if (SRC) return Promise.resolve(SRC);
  if (!loading) {
    loading = Promise.all([
      fetch('assets/models/life/rower.json').then((r) => { if (!r.ok) throw new Error('rower.json: ' + r.status); return r.json(); }),
      new GLTFLoader().loadAsync('assets/models/life/rower.glb'),
    ]).then(([data, gltf]) => { SRC = { data, gltf }; return SRC; });
    loading.catch((err) => { console.error('INVALID_MODEL the rower could not be loaded: ' + (err && err.message)); loading = null; });
  }
  return loading;
}

const DEG = Math.PI / 180;
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3(), _d = new THREE.Vector3(), _e = new THREE.Vector3();
const CLEAR = 26 * Math.PI / 180;                                    // how far her gaze keeps from the rider's eye
const _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _q3 = new THREE.Quaternion(), _q4 = new THREE.Quaternion(), _q5 = new THREE.Quaternion(), _q6 = new THREE.Quaternion(), _ID = new THREE.Quaternion();

/**
 * Build her for one boat. own: the stand-in engine boat-hero.js makes its paint on (tied to the real engine with the
 * boat's). direct(obj): boat-hero's rule for what is left out of the water's mirror. boatPaint: the boat's own material:
 * the oar and the crutch carry the boat's colour families (boat_common.py) and are painted, and repainted, with it.
 */
export function buildRower(own) {
  if (!SRC) return null;
  if (ONE) return ONE;
  const { data, gltf } = SRC;
  const root = cloneSkinned(gltf.scene); root.name = 'rower';
  const materials = [];
  // The area's light first (AREA_RAMP: in a dim area her paint comes down with it), then the boat's own lantern, which
  // falls away along the boat as it does on the boat's planks: she stands at the stern, where the night is kept, with
  // the lamplight faint and warm on whatever of her faces the bow.
  const U = { uRowerAir: { value: new THREE.Vector4(0, 0, 0, 0) }, uRowerOwn: { value: LOOK.own }, uRowerTone: { value: new THREE.Color(LOOK.tone) }, uRowerRim: { value: new THREE.Vector4(1, 1, 1, 0) }, uRowerRimPower: { value: LOOK.rimPower } };
  const light = AREA_RAMP + `{ vec3 toL = uLanternPos - vWPos;
      c += albedo * pointLight(uLanternPos, uLanternColor, uLanternRadius, N) * (1.35 / (1.0 + ${Number(ROWER_OPTIONS.lamp).toFixed(3)} * dot(toL, toL)) - 1.0); }
    { // her own colours, at the brightness the area gives her: a person keeps her face under any light
      const vec3 LUM = vec3(0.2126, 0.7152, 0.0722);
      vec3 mine = albedo * (dot(c, LUM) / max(dot(albedo, LUM), 0.03));
      c = mix(c, mine, uRowerOwn);
      c += uRowerRim.rgb * (uRowerRim.a * pow(1.0 - clamp(abs(dot(N, V)), 0.0, 1.0), uRowerRimPower)) * (0.35 + 0.65 * albedo); }`;
  // Her coat's hem, her scarf's tails and the outer locks of her hair hang loose (the model says how loose each point is:
  // aSway.x, made by rower.py): they trail in the air the boat moves through and stir a little, after her bones have
  // placed them. uRowerAir: the air's way past her in her own frame (xyz, metres of trail), and how hard it blows (w).
  const vertexPars = 'attribute vec2 aSway; uniform vec4 uRowerAir;';
  const vertexLocal = `{ float loose = aSway.x;
      if (loose > 0.002) {
        float ph = dot(transformed, vec3(9.1, 5.3, 7.7));
        float stir = sin(uTime * 2.3 + ph) * 0.6 + sin(uTime * 3.7 + ph * 1.7) * 0.4;
        vec3 across = normalize(cross(vec3(0.0, 1.0, 0.0), uRowerAir.xyz + vec3(0.0003, 0.0, 0.0001)));
        transformed += loose * (uRowerAir.xyz * (1.0 + 0.3 * stir) + across * (0.006 * stir) * (0.5 + uRowerAir.w) + vec3(0.0, 0.004 * stir * uRowerAir.w, 0.0));
      } }`;
  const figureExtend = { uniforms: U, vertexPars, vertexLocal, fragmentPars: 'uniform float uRowerOwn, uRowerRimPower; uniform vec3 uRowerTone; uniform vec4 uRowerRim;', albedo: 'albedo *= uRowerTone;', light };
  let oar = null, figure = null;
  const bones = {}, props = [], all = [];
  root.traverse((o) => {
    if (o.isBone) bones[o.name] = o;
    if (!o.isMesh) return;
    all.push(o);
    const src = o.material;
    // her figure wears her painted picture, in soft steps (a face in three hard steps is a mask); the oar and the crutch
    // are vertex paint, like the boat
    if (o.isSkinnedMesh) {
      const g = o.geometry, loose = g.getAttribute('uv1') || g.getAttribute('uv2');
      g.setAttribute('aSway', loose || new THREE.BufferAttribute(new Float32Array(g.getAttribute('position').count * 2), 2));
      o.material = makeGouache(own, { map: src.map, brush: 0, steps: ROWER_OPTIONS.steps, extend: figureExtend }); materials.push(o.material);
      figure = o;
    }
    else props.push(o);                                               // the oar and the crutch wear the boat's own paint: see adopt()
    o.frustumCulled = false;
    if (o.name === 'rower_oar') oar = o;
  });
  const head = bones.Head, neck = bones.Neck;

  const mixer = new THREE.AnimationMixer(root);
  const clip = (n) => gltf.animations.find((a) => a.name === n);
  const scull = clip('scull') ? mixer.clipAction(clip('scull')) : null, rest = clip('rest') ? mixer.clipAction(clip('rest')) : null;
  if (scull) { scull.play(); scull.setEffectiveWeight(0); }
  if (rest) { rest.play(); rest.setEffectiveWeight(1); }
  mixer.update(0);

  // which way her face looks, in her head's own frame (measured once, as the clips hold her)
  root.updateMatrixWorld(true);
  const face = (data.face ?? 42) * DEG, gz = ((data.gaze && data.gaze[0]) ?? -7) * DEG, gd = ((data.gaze && data.gaze[1]) ?? 5) * DEG;
  const headFwd = new THREE.Vector3(Math.sin(gz) * Math.cos(gd), -Math.sin(gd), -Math.cos(gz) * Math.cos(gd));
  if (head) headFwd.applyQuaternion(head.getWorldQuaternion(_q).invert());
  const tipLocal = new THREE.Vector3().fromArray(data.tip).sub(new THREE.Vector3().fromArray(data.pivot));
  // the middle of the blade, in the oar's own frame: what works the water (the blade is the oar's last 0.84 m)
  const bladeLocal = tipLocal.clone().multiplyScalar(1 - 0.40 / Math.max(0.5, tipLocal.length()));
  // the blade's shoulders (where it begins, 0.84 m from the tip) and the way its face looks, in the oar's own frame
  const rootLocal = tipLocal.clone().multiplyScalar(1 - 0.84 / Math.max(0.9, tipLocal.length()));
  const BLADE = 0.84;
  let seedB = 99; const rndB = () => { seedB = (seedB * 16807) % 2147483647; return seedB / 2147483647; };
  const blade = { turn: 0, gust: 1, c: new THREE.Vector3(), was: new THREE.Vector3(), cut: new THREE.Vector3(), cutWas: new THREE.Vector3(), tipWas: new THREE.Vector3(), tipV: new THREE.Vector3(), has: false, under: false, part: 0, wet: 0, owed: 0, n: 0, slip: 0 };
  // The water the blade throws and sheds: a few dozen drops, each a soft pale point that falls as a drop falls and is
  // gone where it meets the water (the heavier ones leave a pin ring there). They are in the world, not in the boat:
  // a drop that has left the blade is left behind by the boat.
  const DROPS = 120;
  let drops = null;
  const makeDrops = (eng) => {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(DROPS * 3).fill(-999), aux = new Float32Array(DROPS * 2);        // aux: size in metres, how much of it shows (0 = not in the air)
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('aAux', new THREE.BufferAttribute(aux, 2).setUsage(THREE.DynamicDrawUsage));
    const mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, fog: false,
      uniforms: { uScale: { value: 600 }, uColor: { value: new THREE.Color(0.8, 0.85, 0.9) } },
      vertexShader: /* glsl */`attribute vec2 aAux; uniform float uScale; varying float vA;
        void main() { vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv;
          float px = aAux.x * uScale / max(0.1, -mv.z);
          vA = aAux.y * min(1.0, px * px * 0.5);                 // smaller than a pixel: fainter, not a hard dot
          gl_PointSize = clamp(px, 1.0, 26.0); }`,
      fragmentShader: /* glsl */`uniform vec3 uColor; varying float vA;
        void main() { float r = length(gl_PointCoord - 0.5) * 2.0; float a = smoothstep(1.0, 0.2, r) * vA; if (a < 0.004) discard; gl_FragColor = vec4(uColor, a); }`,
    });
    const points = new THREE.Points(geo, mat); points.frustumCulled = false; points.renderOrder = 5; points.name = 'oar drops';
    const size = new THREE.Vector2();
    points.onBeforeRender = (renderer, scene, camera) => { const t = renderer.getRenderTarget(), h = t ? t.height : renderer.getDrawingBufferSize(size).y; mat.uniforms.uScale.value = 0.5 * h * camera.projectionMatrix.elements[5]; mat.uniformsNeedUpdate = true; };
    eng.scene.add(points);
    return { points, mat, geo, pos, aux, vel: new Float32Array(DROPS * 3), next: 0, live: 0, seed: 7 };
  };
  const rnd2 = () => { const d = drops; d.seed = (d.seed * 16807) % 2147483647; return d.seed / 2147483647; };
  const throwDrop = (x, y, z, vx, vy, vz, size) => {
    const d = drops, i = d.next; d.next = (d.next + 1) % DROPS;
    d.pos[i * 3] = x; d.pos[i * 3 + 1] = y; d.pos[i * 3 + 2] = z; d.vel[i * 3] = vx; d.vel[i * 3 + 1] = vy; d.vel[i * 3 + 2] = vz;
    d.aux[i * 2] = size; d.aux[i * 2 + 1] = 0.75;
  };
  // The stroke's own shape, from the model's numbers (rower.py): how hard the blade pushes, at even times round the clip.
  // `RUN` is what a boat driven by those pushes does about its mean speed: it gains while the blade pushes harder than
  // its average and loses the rest of the time (-1 at the catch .. 1 at the release).
  const STROKE = data.stroke && Array.isArray(data.stroke.force) && data.stroke.force.length > 3 ? data.stroke : null;
  const FORCE = STROKE ? STROKE.force : Array.from({ length: 48 }, (_, i) => Math.abs(Math.cos(i / 48 * Math.PI * 2)));
  const FORCE_MEAN = FORCE.reduce((a, b) => a + b, 0) / FORCE.length;
  const RUN = (() => { let acc = 0; const r = FORCE.map((f) => (acc += f - FORCE_MEAN)); const lo = Math.min(...r), hi = Math.max(...r), mid = (lo + hi) / 2, half = Math.max(1e-6, (hi - lo) / 2); return r.map((v) => (v - mid) / half); })();
  const table = (arr, t) => { const n = arr.length, x = (((t % 1) + 1) % 1) * n, i = Math.floor(x) % n, f = x - Math.floor(x); return arr[i] + (arr[(i + 1) % n] - arr[i]) * f; };

  let w = 0, clock = 0, sweeps = 0, lastHalf = -1, draw = 1;
  const DRAW = STROKE ? 0.4 : 0, oarHome = oar ? oar.position.clone() : new THREE.Vector3(), oarAxis = tipLocal.clone().normalize();
  const air = { last: new THREE.Vector3(), v: new THREE.Vector3(), has: false };
  // what hangs loose from her follows her chest on a spring: w, how quick (radians a second: a swing of about 0.8 s);
  // z, how soon it settles (0.3: it swings past once); gain, how much of the lag shows; most, metres
  const FOLLOW = { w: num('rowerfollow', 7.5), z: 0.3, gain: num('rowerfollowgain', 1.0), most: 0.09 };
  const follow = { pos: new THREE.Vector3(), vel: new THREE.Vector3(), has: false };
  const look = { point: null, hold: 0, weight: 0, dir: new THREE.Vector3(0, 0, -1), idleAt: 7, idleFor: 0, idleDir: new THREE.Vector3(), lampSeen: 0 };
  const rnd = (() => { let s = 20261108; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); })();

  /**
   * Bring a direction (unit, in the boat's own frame; changed in place) within what her neck can do: she turns her head
   * at most 80 degrees to her left and 74 to her right of the way her body faces, and 50 up or down; a thing further
   * round than that she looks toward as far as she can. What would fall on the rider (who sits 13 degrees to starboard
   * of her, below her eye) is carried 26 degrees clear of the rider's eye: she looks past, never at. Always true.
   */
  const allowed = (v) => {
    let yaw = Math.atan2(v.x, -v.z) / DEG, pitch = Math.asin(Math.max(-1, Math.min(1, v.y))) / DEG;      // degrees to starboard of the bow; degrees up
    const f = face / DEG;
    let rel = ((yaw - f + 540) % 360) - 180;                                   // from the way she faces, -180 .. 180
    rel = Math.max(-80, Math.min(74, rel)); pitch = Math.max(-24, Math.min(50, pitch));        // (further down and her chin is lost in her scarf)
    yaw = (f + rel) * DEG; pitch *= DEG;
    v.set(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch));
    // the rider: what would fall on the rider's eye is carried out to the edge of a cone round it (26 degrees: with eyes
    // as large as hers anything nearer reads as a look at the lens), on the side it was already on; over the head if dead on
    _d.set(0 - data.head[0], 1.12 - data.head[1], 0.45 - data.head[2]).normalize();
    if (v.angleTo(_d) < CLEAR) {
      _e.copy(v).addScaledVector(_d, -v.dot(_d));                              // the side it was on ...
      _e.y += 2.0 * Math.max(0.05, _e.length()) + 0.02; _e.addScaledVector(_d, -_e.dot(_d));   // ... and, mostly, up: she looks over the rider's head
      _e.normalize();
      v.copy(_d).multiplyScalar(Math.cos(CLEAR)).addScaledVector(_e, Math.sin(CLEAR)).normalize();
    }
    return true;
  };

  const api = {
    group: root, materials, oar, bones, mixer, data,
    /** A boat takes her aboard: group = the boat model's group, boatPaint = its material (the oar and the crutch are painted with
     *  it: they carry the boat's colour families), direct = the boat's rule for what stays out of the water's mirror. */
    adopt(group, boatPaint, direct) {
      for (const o of props) if (boatPaint) o.material = boatPaint;
      if (direct) for (const o of all) if (o !== oar) direct(o);          // (the oar reaches out over the water: it is in the mirror)
      group.add(root);
      return api;
    },
    /** The area's word on her (`look.rower`); what it leaves out goes back to the default. */
    setLook(l) {
      const k = { ...LOOK, ...(l || {}) };
      U.uRowerOwn.value = k.own; U.uRowerTone.value.set(k.tone); U.uRowerRimPower.value = k.rimPower;
      const c = new THREE.Color(k.rim); U.uRowerRim.value.set(c.r, c.g, c.b, k.rimStrength);
      return api;
    },
    /** How hard she is sculling, 0 (the oar trails) .. 1. */
    get effort() { return w; },
    /** How many sweeps of the oar she has made while working (the boat's sound plays one stroke for each). */
    get sweeps() { return sweeps; },
    /** Where she is in the stroke, 0..1 of the clip (0: the blade furthest forward, about to go in). */
    get phase() { return scull ? (scull.time / Math.max(1e-3, scull.getClip().duration)) % 1 : 0; },
    /** How hard her blade is pushing on the water now, 0..1 (her effort included), and its mean over a stroke at full effort. */
    get force() { return w * table(FORCE, api.phase); },
    get forceMean() { return FORCE_MEAN; },
    /** What the boat's speed does about its mean because it is driven by pushes: -1 (at the catch) .. 1 (at the release), times her effort. */
    get run() { return w * table(RUN, api.phase); },
    /** How fast the stroke goes at a speed through the water (1 = the clip's own length). */
    rate(u, calm = false) { return Math.min(1.35, Math.max(0.62, 0.62 + 0.38 * Math.abs(u || 0) / 1.3)) * (calm ? 0.8 : 1); },
    /**
     * For the film: put her where she must be now to reach `phase` (0..1 of the clip, 0 the catch) in `seconds` at a boat
     * speed of u through the water; with seconds = 0, put her at that phase now. (src/cine.js: a shot says where in her
     * stroke its first frame finds her, so that the catch and what it leaves fall inside the shot.)
     */
    setPhase(phase, seconds = 0, u = 0) {
      if (!scull) return api;
      const len = scull.getClip().duration, t = ((((phase - seconds * api.rate(u) / len) % 1) + 1) % 1) * len;
      scull.time = t; return api;
    },
    /** Is her stroke a push with one catch (the oar out to the side), or the old sculling sweep (two a clip)? */
    get push() { return !!STROKE; },
    /**
     * Give her something to look at: a point in the area (THREE.Vector3 or [x, y, z]) for `seconds` (default 6), or
     * null to let her go back to her own thoughts. She turns only as far as a person would, and never to the rider.
     */
    lookAt(point, seconds = 6) {
      if (!point) { look.point = null; look.hold = 0; return api; }
      look.point = (look.point || new THREE.Vector3()); if (Array.isArray(point)) look.point.fromArray(point); else look.point.copy(point);
      look.hold = seconds; return api;
    },
    update(dt, st = {}) {
      if (!(dt > 0)) return;
      clock += dt;
      const m = st.motion ?? 1, calm = m < 1;
      const drive = ROWER_OPTIONS.scull >= 0 ? ROWER_OPTIONS.scull : Math.min(1, Math.max(0, (Math.abs(st.u || 0) - 0.12) / 0.45));
      w += (drive * (calm ? 0.7 : 1) - w) * (1 - Math.exp(-dt * 1.6));
      if (scull && rest) {
        scull.setEffectiveWeight(w); rest.setEffectiveWeight(1 - w);
        // the faster the boat goes through the water, the quicker the stroke: the blade has to keep up with the water
        // going by (at 1.3 m/s, the film's pace, one stroke in 2.2 s; never slower than 3.5 s nor quicker than 1.6)
        scull.timeScale = api.rate(st.u, calm);
      }
      mixer.update(dt);
      // At rest she draws the oar in through its crutch (40 cm of the loom slides through her hands): its blade then
      // reaches 2.1 m from the boat's middle and not 2.5. (The ride comes to rest beside things, the last lamp's jetty
      // above all: 2.2 m to starboard. Rowing, the oar is out to its full reach, and goes through what stands that near.)
      if (oar && DRAW > 0) {
        draw += ((1 - Math.min(1, w * 2.5)) - draw) * (1 - Math.exp(-dt * 1.2));
        _a.copy(oarAxis).applyQuaternion(oar.quaternion);
        oar.position.copy(oarHome).addScaledVector(_a, -DRAW * draw);
      }
      // the air past her: the boat's own way through it, turned into her frame; a breath even when she lies still
      if (figure) {
        root.getWorldPosition(_a);
        if (air.has) { _b.subVectors(_a, air.last).divideScalar(dt); if (_b.lengthSq() > 64) _b.setLength(0); air.v.lerp(_b, 1 - Math.exp(-dt * 2.5)); }
        air.last.copy(_a); air.has = true;
        const sp = Math.min(3.2, air.v.length()), blow = Math.min(1, 0.12 + sp / 3.0) * (calm ? 0.5 : 1);
        _c.copy(air.v).multiplyScalar(-1); if (sp < 0.05) _c.set(0, 0, 0); _c.y = 0;
        _c.applyQuaternion(figure.getWorldQuaternion(_q).invert());
        const trail = 0.016 * Math.min(1, sp / 2.2) * (calm ? 0.5 : 1);           // metres her loosest hem trails, in her own (smaller) units
        if (sp > 1e-3) _c.multiplyScalar(trail / sp);
        // ... and her own movement: what hangs loose from her (the coat's skirt, the scarf's tails, her outer hair) comes
        // after her chest as a weight on a short spring comes after the hand that carries it: it trails while she leans
        // into the push, swings on past as she stops, and settles. (Until 9 November her clothes knew only the air the
        // boat moved through: her body rocked and nothing on it answered, which is half of what read as stiff.)
        const chest = bones.Spine2 || bones.Spine1 || bones.Spine;
        if (chest) {
          chest.getWorldPosition(_d); root.worldToLocal(_d);                        // her chest, in the boat's frame
          if (!follow.has || _d.distanceToSquared(follow.pos) > 1) { follow.pos.copy(_d); follow.vel.set(0, 0, 0); follow.has = true; }
          for (let left = Math.min(dt, 0.1); left > 1e-5; left -= 1 / 120) {         // (short steps: the spring is quick)
            const h = Math.min(left, 1 / 120);
            _e.subVectors(_d, follow.pos).multiplyScalar(FOLLOW.w * FOLLOW.w).addScaledVector(follow.vel, -2 * FOLLOW.z * FOLLOW.w);
            follow.vel.addScaledVector(_e, h); follow.pos.addScaledVector(follow.vel, h);
          }
          _e.subVectors(follow.pos, _d); _e.y *= 0.35;                              // how far the weight is behind her chest (it hardly rises or falls)
          if (_e.lengthSq() > FOLLOW.most * FOLLOW.most) _e.setLength(FOLLOW.most);
          _e.applyQuaternion(root.getWorldQuaternion(_q2)).applyQuaternion(_q);     // into her own frame (_q: her figure's turn in the world, inverted, from above)
          figure.getWorldScale(_b);
          _c.addScaledVector(_e, FOLLOW.gain * (calm ? 0.5 : 1) / Math.max(0.2, _b.x));
        }
        U.uRowerAir.value.set(_c.x, _c.y, _c.z, blow);
      }
      // a sweep is counted as the blade passes the middle of its way (twice a clip), while she is working
      // (the push stroke is counted where it is heard: as the blade goes in, below)
      if (scull && !STROKE) { const half = Math.floor((scull.time / Math.max(1e-3, scull.getClip().duration)) * 2) % 2; if (half !== lastHalf) { if (lastHalf >= 0 && w > 0.25) sweeps++; lastHalf = half; } }

      // ---- her head
      if (head && neck) {
        const boat = root.parent;
        let want = 0;
        if (boat) {
          boat.updateWorldMatrix(true, false);
          const eng = st.engine;
          // what there is to look at, in order: what a realm gave her; the kept lamp, near; at rest, the water
          let target = null;
          if (LOOK_HELD) {                                                          // &rowerlook=yaw,pitch: held there, for looking at her
            const y = LOOK_HELD[0] * DEG, pch = LOOK_HELD[1] * DEG;
            head.getWorldPosition(_b);
            target = _a.set(Math.sin(y) * Math.cos(pch), Math.sin(pch), -Math.cos(y) * Math.cos(pch)).multiplyScalar(30).applyQuaternion(boat.getWorldQuaternion(_q)).add(_b);
          } else if (look.hold > 0 && look.point) { look.hold -= dt; target = _a.copy(look.point); }
          else if (eng && eng.shared && eng.shared.uLampPos && eng.shared.uLampPos.value.y > -50) {
            const lp = eng.shared.uLampPos.value;
            head.getWorldPosition(_b);
            const dist = _b.distanceTo(lp);
            if (dist < 30 && dist > 2.5) target = _a.copy(lp);
          }
          if (target) {
            head.getWorldPosition(_b);
            _c.copy(target).sub(_b).normalize();
            const d2 = _c.clone().applyQuaternion(boat.getWorldQuaternion(_q).invert());     // in the boat's frame
            if (allowed(d2)) {                                                     // (as far round as her neck goes)
              d2.applyQuaternion(boat.getWorldQuaternion(_q));
              if (look.weight < 0.05) look.dir.copy(d2); else look.dir.lerp(d2, 1 - Math.exp(-dt * (calm ? 1.6 : 2.6))).normalize();   // her eyes travel: no jump from one thing to the next
              want = 1;
            }
          } else if (w < 0.3) {
            // her own thoughts: now and then the water to one side, for a few seconds
            if (look.idleFor > 0) { look.idleFor -= dt; _c.copy(look.idleDir).applyQuaternion(boat.getWorldQuaternion(_q)); look.dir.copy(_c); want = 1; }
            else if ((look.idleAt -= dt) <= 0) {
              const yaw = (rnd() < 0.5 ? -38 + rnd() * 26 : 44 + rnd() * 50) * DEG, down = (6 + rnd() * 14) * DEG;
              look.idleDir.set(Math.sin(yaw) * Math.cos(down), -Math.sin(down), -Math.cos(yaw) * Math.cos(down));
              look.idleFor = 3.5 + rnd() * 4; look.idleAt = 9 + rnd() * 9;
            }
          }
        }
        look.weight += (want - look.weight) * (1 - Math.exp(-dt * (calm ? 0.9 : 1.5)));
        if (look.weight > 0.002) {
          // turn the head from where the clip holds it toward what she looks at: two fifths at the neck, the rest at the head
          // (each quaternion below has a name of its own: slerping one into itself gave no turn at all, which is why her
          //  head did not move for the first stagers on 8 November)
          head.getWorldQuaternion(_q);                                                // where the clip holds her head
          _a.copy(headFwd).applyQuaternion(_q).normalize();
          _q2.setFromUnitVectors(_a, look.dir);                                       // the whole turn, in the world
          _q5.copy(_ID).slerp(_q2, look.weight);                                      // as much of it as she has made so far
          _q3.copy(_ID).slerp(_q5, 0.4);                                              // the neck's share of that
          neck.parent.getWorldQuaternion(_q4);
          neck.getWorldQuaternion(_q6).premultiply(_q3);                              // the neck, turned
          neck.quaternion.copy(_q4.invert()).multiply(_q6);
          head.quaternion.copy(_q6.invert()).multiply(_q5).multiply(_q);              // the head makes up the rest
        }
      }

      // ---- the oar works the water. (9 November. The client, of the film: "proper / realistic water physics when
      // rowing"; and of the first answer to that, which stamped a ring as the blade went in and a larger one as it came
      // out: "the rings ... are a bit too harsh", "the oar isn't causing any water physics effects".)
      // A stamped ring is what a stone leaves: all of its water goes down at once, and every wavelength answers, the
      // long ones in wide hard rings. An oar moves water sideways, and what answers is short and stays near. So:
      //   - where the blade's face pushes, and where the shaft cuts the surface, are two small pressure patches in
      //     the wave simulation (water.blade), each carried with its own way through the water. Short ripples run from
      //     them for as long as the oar is in the water. The blade's way is its way square to its face through the
      //     water the boat rides on (the water's own drift taken out), and never less than `push` while it pushes; the
      //     shaft's is its way over the water as it lies in the picture;
      //   - what the blade works is churned: it shows pale for a few seconds and then is wash like the hull's. That is
      //     the puddle, which stays where it was made while the boat goes on;
      //   - it throws a few drops as it goes in, sheds water as it comes out, and drips along its way back; a drop
      //     that falls leaves a pin ring where it falls.
      // Where an area's water wears a skin, a film or its own light, the trace takes the same marks.
      const eng = st.engine;
      if (oar && eng && eng.water && eng.water.ripple) {
        const water = eng.water, hb = eng.boat;
        if (!drops && eng.scene && MARK.drops > 0) drops = makeDrops(eng);
        oar.getWorldPosition(_a);                                                    // the pivot (and this brings the oar's place in the world up to date)
        _b.copy(tipLocal); oar.localToWorld(_b);                                     // the tip
        _c.copy(rootLocal); oar.localToWorld(_c);                                    // the blade's shoulders
        const level = (x, z) => { const h = water.heightAt ? water.heightAt(x, z) : 0; return Number.isFinite(h) ? h : 0; };
        const dTip = _b.y - level(_b.x, _b.z), dRoot = _c.y - level(_c.x, _c.z);
        if (blade.has) blade.tipV.subVectors(_b, blade.tipWas).divideScalar(dt); else blade.tipV.set(0, 0, 0);
        let part = 0;                                                                // how much of the blade is under, 0..1
        if (dTip < 0) {
          const k = dRoot <= 0 ? 0 : dRoot / (dRoot - dTip);                         // where the water crosses it, from the shoulders
          part = 1 - k;
          _d.lerpVectors(_c, _b, k).add(_b).multiplyScalar(0.5);                     // the middle of the part that is under
          // where the oar cuts the surface: on the blade, or up the shaft if the whole blade is under
          const dPiv = _a.y - level(_a.x, _a.z), kc = dPiv / Math.max(1e-3, dPiv - dTip);
          blade.cut.lerpVectors(_a, _b, kc);
        }
        const working = w > 0.12, force = api.force;
        // (an area says how strongly its water answers the boat, `wake`: the sky's mirror shows a fifth of what the
        // landing's water shows, because a mirror shows everything. The oar's ripples follow the same word, between a
        // half and the whole: at a fifth the oar left nothing to see in the sky.)
        const answer = Math.min(1.0, Math.max(0.5, water.P && Number.isFinite(water.P.wake) ? water.P.wake : 1));
        const cx = hb ? (hb.vx || 0) - (hb.wx || 0) : 0, cz = hb ? (hb.vz || 0) - (hb.wz || 0) : 0;        // the water's own drift where the boat is
        if (part > 0.02 && working) {
          if (!blade.under) {                                                        // the catch: it goes in
            water.ripple(_d.x, _d.z, MARK.catch * answer * w * m, 0.25);
            if (STROKE && w > 0.25) sweeps++;
            blade.was.copy(_d); blade.cutWas.copy(blade.cut);
            if (drops) for (let i = 0, n = Math.round(9 * MARK.drops * w * m); i < n; i++) {     // a few drops thrown up where it meets the water, the way it was going
              const a2 = rnd2() * Math.PI * 2, sp = 0.25 + 0.5 * rnd2();
              throwDrop(blade.cut.x + Math.cos(a2) * 0.06, 0.02, blade.cut.z + Math.sin(a2) * 0.06, blade.tipV.x * 0.3 + Math.cos(a2) * sp, 0.7 + 1.0 * rnd2(), blade.tipV.z * 0.3 + Math.sin(a2) * sp, 0.014 + 0.012 * rnd2());
            }
          }
          // the blade's way through the water this frame, square to its face; never less than `push` while she pushes;
          // always toward the face she pushes with, the one that looks astern (at the ride's top speed the boat outruns
          // the stroke and the blade is drawn forward through the water, which would heap it on the wrong side)
          let mx = _d.x - blade.was.x - cx * dt, mz = _d.z - blade.was.z - cz * dt;
          _e.set(0, 0, -1).transformDirection(oar.matrixWorld); _e.y = 0;
          const nl = _e.length();
          let slip = 0;
          if (nl > 1e-3) {
            _e.multiplyScalar(1 / nl);
            const along = -Math.max(Math.abs(mx * _e.x + mz * _e.z), MARK.push * force * dt) * nl;
            slip = Math.min(2.5, Math.abs(along) / dt);
            // (the water a blade works turns over: the push wanders a little to either side and comes in gusts)
            blade.turn += (rndB() - 0.5) * 2.2 * MARK.rough; blade.turn *= 0.8; blade.gust += ((0.55 + 0.9 * rndB()) - blade.gust) * 0.5;
            const g = 1 + (blade.gust - 1) * MARK.rough, ca = Math.cos(blade.turn), sa = Math.sin(blade.turn);
            mx = (_e.x * ca - _e.z * sa) * along * g; mz = (_e.x * sa + _e.z * ca) * along * g;
          }
          blade.slip += (slip - blade.slip) * (1 - Math.exp(-dt * 10));
          const k = Math.min(1, blade.slip / 0.8) * w * m, deep = Math.min(1, part * 1.8);
          if (water.blade) {
            water.blade(0, _d.x + (rndB() - 0.5) * 0.06 * MARK.rough, _d.z + (rndB() - 0.5) * 0.06 * MARK.rough, mx, mz, { width: 0.09 + 0.05 * part, heap: MARK.heap * answer * deep * w * m, wash: (0.55 + (MARK.churn - 0.55) * k) * deep, stir: (0.35 + 0.8 * k) * deep });
            // the shaft where it cuts the surface: its way over the water as the picture has it
            const sx = Math.max(-0.4, Math.min(0.4, blade.cut.x - blade.cutWas.x)), sz = Math.max(-0.4, Math.min(0.4, blade.cut.z - blade.cutWas.z));
            water.blade(1, blade.cut.x, blade.cut.z, sx, sz, { width: 0.06, heap: MARK.shaft * answer * w * m, wash: 0.3 * deep, stir: Math.min(1, 0.25 + Math.hypot(sx, sz) / dt * 0.5) });
          }
          const tr = water.trace;
          if (tr && tr.line && k > 0.05) {
            tr.line(blade.was.x, blade.was.z, _d.x, _d.z, { channel: 'lane', radius: 0.24, strength: 0.75 * Math.min(1, k * 1.5) });
            tr.line(blade.was.x, blade.was.z, _d.x, _d.z, { channel: 'glow', radius: 0.28, strength: 0.85 * Math.min(1, k * 1.5) });
          }
          // (hard at work it spits a drop or two off the top of the blade)
          if (drops && k > 0.5 && (blade.owed += 7 * k * MARK.drops * dt) >= 1) { blade.owed -= 1; const a2 = rnd2() * Math.PI * 2; throwDrop(blade.cut.x, 0.02, blade.cut.z, -_e.x * 0.5 + Math.cos(a2) * 0.3, 0.5 + 0.5 * rnd2(), -_e.z * 0.5 + Math.sin(a2) * 0.3, 0.012 + 0.008 * rnd2()); }
          blade.was.copy(_d); blade.cutWas.copy(blade.cut); blade.c.copy(_d); blade.part = part; blade.under = true;
        } else if (blade.under) {                                                    // the release: it comes out
          blade.under = false;
          if (working) {
            water.ripple(blade.c.x, blade.c.z, MARK.release * answer * w * m, 0.3);
            const tr = water.trace;
            if (tr && tr.inject) {
              // two eddies, one off each end of the blade, turning opposite ways (what is left of the water it held)
              _e.subVectors(_b, _c).setY(0).normalize();
              tr.inject(blade.c.x + _e.x * 0.3, blade.c.z + _e.z * 0.3, { channel: 'swirl', radius: 0.5, strength: 0.55 * w });
              tr.inject(blade.c.x - _e.x * 0.3, blade.c.z - _e.z * 0.3, { channel: 'swirl', radius: 0.5, strength: -0.55 * w });
              tr.inject(blade.c.x, blade.c.z, { channel: 'glow', radius: 0.5, strength: 0.8 * w });
            }
            blade.wet = 1; blade.owed = 0;
          }
        }
        // the water it sheds on its way back: a curtain off the blade's lower edge at first, then single drops; each
        // leaves the blade with some of the blade's own way and falls
        if (drops) {
          if (blade.wet > 0.02 && !blade.under && dTip > 0) {
            blade.wet *= Math.exp(-dt / 0.42);
            blade.owed += 95 * blade.wet * MARK.drops * w * m * dt;
            while (blade.owed >= 1) {
              blade.owed -= 1;
              const t = 1 - 0.75 * rnd2() * rnd2(), jx = (rnd2() - 0.5) * 0.04, jz = (rnd2() - 0.5) * 0.04;      // (more of it from the tip, where the water runs to)
              _e.lerpVectors(_c, _b, t);
              throwDrop(_e.x + jx, _e.y - 0.03, _e.z + jz, blade.tipV.x * 0.3 * t + jx * 4, -0.15 - 0.5 * rnd2() + Math.min(0, blade.tipV.y) * 0.3, blade.tipV.z * 0.3 * t + jz * 4, 0.011 + 0.014 * rnd2() * blade.wet + 0.004);
            }
          }
          // every drop in the air falls; where it meets the water it is gone, and the heavier ones leave a pin ring
          const d = drops; let live = 0, rings = 3;
          for (let i = 0; i < DROPS; i++) {
            if (!(d.aux[i * 2 + 1] > 0)) continue;
            const j = i * 3;
            d.vel[j + 1] -= 8.6 * dt;
            d.pos[j] += d.vel[j] * dt; d.pos[j + 1] += d.vel[j + 1] * dt; d.pos[j + 2] += d.vel[j + 2] * dt;
            if (d.pos[j + 1] < level(d.pos[j], d.pos[j + 2])) {
              if (rings > 0 && d.aux[i * 2] > 0.017) { rings--; water.ripple(d.pos[j], d.pos[j + 2], MARK.drip * Math.min(1, answer * 2) * m, 0.09); }
              d.aux[i * 2 + 1] = 0; d.pos[j + 1] = -999;
            } else live++;
          }
          if (live || d.live) {
            d.geo.attributes.position.needsUpdate = true; d.geo.attributes.aAux.needsUpdate = true;
            // lit as a pale matte thing is lit in this area (the water's own measure of the area's light), and a little more: water catches the sky
            const paint = water.material && water.material.uniforms.uPaint ? water.material.uniforms.uPaint.value : null;
            if (paint) d.mat.uniforms.uColor.value.setRGB(0.05 + paint.r * 0.95, 0.06 + paint.g * 0.95, 0.07 + paint.b * 0.95);
          }
          d.live = live; d.points.visible = live > 0;
        }
        blade.tipWas.copy(_b); blade.has = true;
        // &rowerlog=<name>.json (a developer's switch): what the blade did, frame by frame, posted to .shots after 240 frames
        if (LOG) { LOG.rows.push([+clock.toFixed(3), +api.phase.toFixed(3), +w.toFixed(2), +part.toFixed(2), +blade.slip.toFixed(2), +dTip.toFixed(3), +dRoot.toFixed(3), +(_b.x).toFixed(2), +(_b.z).toFixed(2), hb ? +hb.u.toFixed(2) : 0, drops ? drops.live : 0]); if (LOG.rows.length === 240) fetch('/__shot/' + LOG.name, { method: 'POST', body: JSON.stringify({ columns: ['t', 'phase', 'effort', 'under', 'slip m/s', 'tip above water', 'shoulders above water', 'tip x', 'tip z', 'boat u', 'drops in the air'], rows: LOG.rows }) }).catch(() => {}); }
      }
    },
  };
  ONE = api;
  if (PENDING) { api.setLook(PENDING); PENDING = null; }
  return api;
}
