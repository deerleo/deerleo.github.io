// Beasts: the wading stag and the far deer. The family page is docs/life/beasts.md.
//
//   import { makeStag, makeFarDeer } from '../engine/life/beasts.js';
//   const stag = await makeStag(ctx, { at: [110, -32.5], heading: Math.PI / 2 });                        // in build()
//   ctx.stage.cue('stag', { s: 60 }, () => stag.go({ route: [[122, -32.5], [132, -23.5], [207.5, 12.5]], then: 'drink' }));
//   const deer = await makeFarDeer(ctx, { from: [20, -170], to: [330, -170], y: 0.3, mist: [0.5, 1.2, 0.9] });
//   ctx.stage.cue('icesong', { s: 62 }, () => deer.halt(3));
//
// THE RULE OF THE STRIDE. The stag is never moved: he moves himself. His model (source-art/models/life/stag.py) is a
// rigged red deer stag whose clips carry their own travel: in `wade` every hoof that stands on the bed stays where it
// was set down while the body passes over it, and the root bone goes forward by exactly what that gives (it surges
// twice a round, as each hind leg ends its push). Here the root's travel is taken off the bone and given to the whole
// animal, along his heading; nothing else can displace him. An area asks for a pace and a route; what it gets is the
// speed his stride makes (three clips, a short round, an ordinary one and a long one, played in step and mixed: he goes
// faster by reaching further, never by stepping quicker) and the arc his body can
// bend to (never tighter than 5 m, the head and neck turning into it first). He stops only where a hind hoof has just
// been set down (twice a round), in a clip that sets his last hooves down under him, and starts with one that lifts them
// in order. What shows of his stride above the water: he is punted along (a push and a glide, twice a round), his back
// rocks, withers and croup in turn, and his head, which is heavy, does not: the neck gives under it, and then nods once
// as each foreleg takes his weight. Over the loops his head drifts and his ears flick at times of their own.
//
// What an area sees of him: his back, neck, head and antlers; everything under the water is there (the water is
// clear in places) but is never shown on purpose: he keeps to a metre of water. What he leaves on it: a lane in a
// skin of petals, a bow wave that comes in pulses with his stride, rings from his muzzle when he drinks.
//
// The far deer are one instanced low form (source-art/models/life/deer_far.py) walking in single file a long way
// off: the gait, the lift of each head and the mist over their legs are in the vertex shader; a few numbers a deer
// (where it is, whether it has stopped, how far its head is up) are kept here.
import * as THREE from 'three';

const TAU = Math.PI * 2, RAD = Math.PI / 180;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const ease = (cur, target, dt, tau) => cur + (target - cur) * (1 - Math.exp(-dt / Math.max(1e-4, tau)));
const toward = (cur, target, step) => (cur < target ? Math.min(target, cur + step) : Math.max(target, cur - step));
const wrapPi = (a) => a - TAU * Math.round(a / TAU);
const _v = new THREE.Vector3(), _v2 = new THREE.Vector3(), _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _m = new THREE.Matrix4(), _loc = {}, _p = { x: 0, z: 0 }, _p2 = { x: 0, z: 0 };
const UP = new THREE.Vector3(0, 1, 0), FWD = new THREE.Vector3(0, 0, 1), SIDE = new THREE.Vector3(1, 0, 0);

// ================================================================================================ the stag
const STAG_FILE = 'models/life/stag.glb';
// Numbers that belong to the model (source-art/models/life/stag.py prints them as "for beasts.js"): keep the two in step.
const FPS = 24;
const FRAMES = { wade: 35, wade_slow: 46, wade_long: 30, start: 36, stop: 28, stop_b: 28, stand: 192, look: 108, drink: 132, shake: 42 };
const MARK = { look: [30 / FPS, 78 / FPS], drink: [48 / FPS, 84 / FPS] };       // each holds, as a loop, between these two times
const BEND = { hips: -0.30, spine1: 0.25, spine2: 0.25, chest: 0.20 };          // how a turn's bend is shared out along the trunk
const LEAD = { neck1: 0.30, neck2: 0.30, neck3: 0.22, head: 0.18 };             // and how the neck and head turn into it first
const REACH = { neck1: 0.36, neck2: 0.34, neck3: 0.30 };                         // and how the last of a reach to the water is shared out along the neck
const EAR_BACK = { ear_L: [-24 * RAD, 78 * RAD], ear_R: [-24 * RAD, -78 * RAD] }; // an ear laid back: folded (x) and turned on its root (y)
const PUSH = 0.36;                               // where in the round he is fastest, and again half a round later
const TRUNK = 1.1;                               // metres of spine between hips and shoulders: what an arc has to bend
const CHEST = 0.66, RUMP = -0.75, MID = 0.2;     // metres ahead of his middle, along his heading: front of the chest at the waterline, the tail, the middle of what shows
const BACK = [[-0.60, 0.309], [-0.40, 0.31], [-0.09, 0.294], [0.13, 0.296], [0.30, 0.334], [0.42, 0.363]];   // the line of his back: metres ahead, metres above the water (at depth 1)
const CLIPS = ['wade', 'wade_slow', 'wade_long', 'start', 'stop', 'stop_b', 'stand', 'look', 'drink', 'shake'];      // (stop_b: the stop from half a round on, left and right changed over)
const TRAVELS = ['wade', 'wade_slow', 'wade_long', 'start', 'stop', 'stop_b'];

function trackOf(clip, name) { return clip.tracks.find((t) => t.name === name) || null; }
/** How far a clip's root has travelled at time t (metres along `axis`), from its position track. */
function travelOf(track, axis, sign) {
  if (!track) return () => 0;
  const T = track.times, V = track.values, n = T.length, v0 = V[axis];
  const at = (i) => (V[i * 3 + axis] - v0) * sign;
  return (t) => {
    if (t <= T[0]) return 0;
    if (t >= T[n - 1]) return at(n - 1);
    let i = clamp(Math.floor((t - T[0]) / (T[n - 1] - T[0]) * (n - 1)), 0, n - 2);
    while (i > 0 && T[i] > t) i--;
    while (i < n - 2 && T[i + 1] < t) i++;
    return lerp(at(i), at(i + 1), (t - T[i]) / (T[i + 1] - T[i]));
  };
}

/** A route as a line of points with distances along it. */
function makeRoute(points) {
  const P = points, n = P.length, acc = [0];
  for (let i = 1; i < n; i++) acc.push(acc[i - 1] + Math.hypot(P[i].x - P[i - 1].x, P[i].z - P[i - 1].z));
  return {
    points: P, acc, length: acc[n - 1],
    /** The point `a` metres along (beyond the end the last stretch runs on). */
    at(a, out) {
      let i = 0;
      while (i < n - 2 && acc[i + 1] < a) i++;
      const k = (a - acc[i]) / ((acc[i + 1] - acc[i]) || 1);
      out.x = P[i].x + (P[i + 1].x - P[i].x) * k; out.z = P[i].z + (P[i + 1].z - P[i].z) * k;
      return out;
    },
    /** Distance along of the nearest point to (x, z), looking only a little behind and ahead of a0; never less than a0. */
    project(x, z, a0) {
      let best = a0, bd = Infinity;
      for (let i = 0; i < n - 1; i++) {
        if (acc[i + 1] < a0 - 1 || acc[i] > a0 + 6) continue;
        const dx = P[i + 1].x - P[i].x, dz = P[i + 1].z - P[i].z, L2 = dx * dx + dz * dz || 1;
        const k = clamp(((x - P[i].x) * dx + (z - P[i].z) * dz) / L2, 0, 1), d = (x - P[i].x - dx * k) ** 2 + (z - P[i].z - dz * k) ** 2;
        if (d < bd) { bd = d; best = acc[i] + k * Math.sqrt(L2); }
      }
      return Math.max(a0, Math.min(best, a0 + 6));
    },
  };
}

/**
 * The wading stag. Resolves to his handle (the model is loaded).
 *
 * options (all optional):
 *   at: [s, d] | position: [x, z]     where he stands to begin with (path coordinates, or the realm's own)
 *   heading                            which way he faces, as a rotation.y (0 looks toward +z); or
 *   face: [s, d] | toward: [x, z]      a point he faces
 *   route: [[s, d], ...]               the route he will walk when told to go (so that alongAt can be asked before he sets off)
 *   depth: 1.0                         metres of water he stands in (0.9 to 1.15: less would show a leg)
 *   speed: 1.25                        the pace he wades at when nothing asks otherwise, m/s (0.5 .. 1.8). Every pace is a stride of its
 *                                      own length: 1.25 m a round at 0.65 m/s, 1.8 m at 1.23, 2.25 m at 1.8
 *   slow: 0.68, quick: 1.8             his slow wade, and the pace he quickens to when the boat is close
 *   turnRadius: 5                      the tightest arc he walks (never under 5 m)
 *   dark: 4                            radius of the ring of dark he keeps among fireflies (he only reports it: stag.dark)
 *   ear: 12, shy: 7, yield: 9          metres: inside `ear` one ear turns to the boat; inside `shy` he angles away and quickens
 *                                      (or, standing, leaves); with the boat within `yield` of his route ahead he waits. 0 switches one off
 *   ahead: [27, 45]                    keep this far ahead of the boat along the waterway while following a route (default: off)
 *   marks: { wave, lane, rings }       what he writes on the water (all on; false for none). wave: the strength of the ripple each push of a
 *                                      hind leg renews at his chest (0.34), waveRadius: its radius (0.7 m); lane: half the width of the lane he
 *                                      opens in a skin of petals (0.75 m); rings: from his muzzle, his drips, his shake
 *   onTouch(x, z, kind)                called where he touches the water: 'wade' (each push of a hind leg), 'drink' (every 0.7 s), 'drip',
 *                                      'shake', 'stop' (his own wave catching him up), 'quicken' (the boat has come inside `shy`)
 *   onState(state, stag)               called when what he is doing changes: 'stand' | 'start' | 'wade' | 'stop' | 'look' | 'drink' | 'shake'
 *   only: 'mirror' | 'direct'          show him only in the water's reflection (the orchard in snow), or only in the direct view
 *   vanish: 0                          metres from the hull inside which he thins to nothing (the snow's mirror stag: 6)
 *   collide: true                      the boat cannot be steered through him (off when he is only in the mirror)
 *   tint: '#ffffff', gain: 1           multiply his paint (the snow's mirror wants about 2.1 times brighter)
 *   antlerPixels: 0.3                  the least half-thickness his antlers are drawn with, in pixels of the picture: beyond about 35 m
 *                                      a tine is thinner than that, and is kept that thick, a hairline (0: as modelled, and faint at 60 m;
 *                                      0.75 is bolder and begins to lose the branching at 40 m). Without multisampling: a whole pixel
 *   crisp: true                        his antlers (from 9 m) and his ears (from 18 m) are left as drawn by the painter's filter, which
 *                                      would otherwise round a rack two pixels thick into a clump. false: all of him is brushed
 *   scale: 1, seed: 3, parent
 *   brush, shade, rim ...              any gouache option for his material (his own defaults: brush 0.45, shade 0.6)
 *
 * the handle:
 *   object, bones                      the group and his bones by name
 *   position                           Vector3: his middle, at the waterline (realm coordinates); chest, muzzle: Vector3s too
 *   heading, speed, state, along       radians; m/s now; what he is doing; metres along his route. Also routeLength, stride (metres a round
 *                                      now), radius (his ring of dark), triangles, debug() (what his machinery is doing: for test stages)
 *   dark                               Vector4 (x, y, z, radius): the middle of what shows of him and the radius of his ring of dark
 *   go({ route, to, speed, then, seconds, repeat })   wade: along a route of points ([s, d] or { x, z }), or to one point; then: 'drink' | 'look' | 'shake' | null.
 *                                      go() with nothing in it: walk on (the route he has; it also ends a look or a drink early)
 *   stop()                             come to a halt where a hind hoof is next set down (twice a round: he is standing within 1.9 s and
 *                                      1.4 m at his ordinary pace, 1.8 m at his quickest), and forget what was to come after
 *   look(seconds, { resume })          stop if wading, lift his head and listen; then go on if he was going
 *   drink(seconds, { repeat })         stop if wading, lower his muzzle and drink (rings); seconds = Infinity: bouts, for as long as he is left alone
 *   shake()                            shake his head (standing)
 *   pace(speed)                        change the pace he wades at
 *   arrive(along, seconds)             be `along` metres down his route `seconds` from now: he lengthens or shortens his stride for it,
 *                                      between his slow wade and his quick one (for a show clock; null as `along` lets him off)
 *   keepAhead([near, far] | null)      switch the rule of `ahead` on or off
 *   ears(left, right)                  hold his ears back by hand, 0..1 each (null gives an ear back to him)
 *   only(where), fade(alpha, seconds)  the mirror switch; thin him away (0) or bring him back (1)
 *   place({ at | position | along, heading, going })   put him somewhere while he cannot be seen (at build, in a cue's settle)
 *   alongAt(s)                         how far along his route he is when he is level with `s` metres of the waterway
 *   attach(object, u, v)               stick a small thing to his back: u 0 (croup) .. 1 (withers), v -1 .. 1 across. Give it lying flat
 *                                      (its own +Y up): it is laid on his skin there and rides the bone under it
 */
export async function makeStag(ctx, options = {}) {
  const { kit } = ctx;
  const o = { depth: 1.0, speed: 1.25, slow: 0.68, quick: 1.8, turnRadius: 5, dark: 4, ear: 12, shy: 7, yield: 9, ahead: null, marks: {}, collide: true, vanish: 0,
    tint: '#ffffff', gain: 1, scale: 1, seed: 3, only: null, antlerPixels: 0.3, crisp: true, ...options };
  const marks = { wave: true, waveRadius: 0.7, lane: 0.75, rings: true, ...(o.marks === false ? { wave: false, lane: 0, rings: false } : o.marks) };
  if (marks.lane === true) marks.lane = 0.75;
  const waveK = marks.wave === true ? 0.34 : +marks.wave || 0;
  const rnd = ctx.rng(o.seed * 131 + 17);
  const uFade = { value: 1 }, uThin = { value: 0 }, uCrisp = { value: o.crisp ? 1 : 0 };
  const SOLID = !!(ctx.quality && ctx.quality.samples === 0);      // without multisampling (low quality) a line under a pixel wide breaks into dashes and twinkles as it moves: it is kept a whole pixel wide
  const mat = {};
  for (const k of ['brush', 'shade', 'steps', 'rim', 'emissive', 'emissiveIntensity', 'caustics', 'backlight']) if (o[k] !== undefined) mat[k] = o[k];
  const rig = await kit.animated(STAG_FILE, {
    brush: 0.45, shade: 0.6, ...mat, color: new THREE.Color(o.tint).multiplyScalar(o.gain),      // (shade 0.6: with all of the realm's three-step ramp a lantern at night made him a piebald; he is one dark coat)
    // thinning him away: his paint turns to glass while he fades (and only then: he is solid paint otherwise, in the
    // scene pre-pass and the mirror like everything else). What is under the water goes at once, so that nothing of
    // him is ever drawn over the surface
    extend: { uniforms: { uFade, uThin, uCrisp }, fragmentPars: 'uniform float uFade, uCrisp; varying float vThick;', vertexPars: 'uniform float uThin; varying float vThick;',
      // His antlers are five centimetres thick: at forty metres that is under a pixel, and the picture loses them. What would
      // be thinner than the picture can draw is kept `antlerPixels` thick instead (the model tells every point of an antler how
      // thick the antler is there: uv.x = 0.1 + 10 x its radius; 0 = not antler). Nearer than about 15 m nothing is changed.
      // (What is laid on is laid on in the antler's own dark: a point's last centimetres are worn pale and are its thinnest, so
      // they were thickened most, and at sixty metres the rack carried twelve white beads.)
      vertexWorld: `vThick = 0.0;
        if (uv.x > 0.05) { float r = (uv.x - 0.1) * 0.1, add = clamp(uThin * distance(wp.xyz, uCameraPos) - r, 0.0, 0.05), nl = length(wn); if (nl > 1e-6) wp.xyz += wn / nl * add; vThick = add / max(r + add, 1e-4); }`,
      // (At the very point of a tine the normals of all its sides meet and cancel: a normal of no length, a colour that is not a
      // number, and, now that the painter's filter no longer brushes it away, one black pixel that came and went. Such a pixel
      // is given a normal.)
      albedo: 'if (!(dot(N, N) > 0.25)) N = vec3(0.0, 1.0, 0.0); albedo = mix(albedo, uColor * vec3(0.102, 0.068, 0.065), vThick * 0.85); if (uFade < 0.999) { if (vWPos.y < 0.0) discard; alpha *= uFade; }',
      // The painter's brush is five pixels wide: it rounds off whatever is thinner, and made a clump of his antlers from twenty-five
      // metres on. His thin parts are therefore left as they are drawn (the mark in the picture's alpha that gouache's `crisp` writes;
      // the model says which they are in uv.y: 1 antler, from nine metres on; 0.5 an ear, from eighteen: nearer than that each is
      // broad enough to be painted like the rest of him)
      // (And nothing of him may leave here that is not a colour: at the rim of his silhouette, where a pixel's middle lies just
      // off the triangle it is shaded for, a number now and then comes out negative or is no number at all, and was one black pixel.)
      final: `if (!(gl_FragColor.r >= 0.0 && gl_FragColor.g >= 0.0 && gl_FragColor.b >= 0.0 && gl_FragColor.r + gl_FragColor.g + gl_FragColor.b < 1e4)) gl_FragColor.rgb = mix(max(albedo, vec3(0.0)) * 0.6, uFogColor, clamp(fog, 0.0, 1.0));
        if (uCrisp > 0.5 && ((vUv0.y > 0.75 && dist > 9.0) || (vUv0.y > 0.25 && dist > 18.0))) gl_FragColor.a = -15.0;` },
  });
  const group = rig.group, bones = rig.bones, mixer = rig.mixer, mats = [...new Set(Object.values(rig.materials))];
  if (o.parent && o.parent !== group.parent) o.parent.add(group);
  group.scale.setScalar(o.scale);
  for (const name of ['root', 'hips', 'spine1', 'spine2', 'chest', 'neck1', 'neck2', 'neck3', 'head', 'muzzle', 'ear_L', 'ear_R']) if (!bones[name]) throw new Error(`beasts: ${STAG_FILE} has no bone "${name}"`);
  for (const b of Object.values(bones)) b.matrixAutoUpdate = true;       // (kit.animated freezes them until a clip plays; here they are posed every frame)

  // ---- at rest: every bone's own turn, and the model's upright, forward and sideways as that bone sees them
  group.position.set(0, 0, 0); group.rotation.set(0, 0, 0); group.updateMatrixWorld(true);
  const rest = {}, axes = {};
  group.getWorldQuaternion(_q2).invert();
  for (const [name, b] of Object.entries(bones)) {
    rest[name] = { q: b.quaternion.clone(), p: b.position.clone() };
    b.getWorldQuaternion(_q).premultiply(_q2).invert();
    axes[name] = { up: UP.clone().applyQuaternion(_q), fwd: FWD.clone().applyQuaternion(_q), side: SIDE.clone().applyQuaternion(_q) };
  }
  const TOUCHED = ['hips', 'spine1', 'spine2', 'chest', 'neck1', 'neck2', 'neck3', 'head', 'ear_L', 'ear_R'];      // the bones this file turns on top of the clips
  const pure = {}, pureRoot = rest.root.p.clone();
  for (const name of TOUCHED) pure[name] = rest[name].q.clone();
  const restInv = {};
  for (const name of ['hips', 'spine1', 'spine2', 'chest']) restInv[name] = new THREE.Matrix4().copy(group.matrixWorld).invert().multiply(bones[name].matrixWorld).invert();

  // ---- the clips, played by hand: each has a weight and a time, and the travelling ones a table of how far the root has gone
  const clip = {};
  for (const name of CLIPS) {
    const a = rig.actions[name];
    if (!a) throw new Error(`beasts: ${STAG_FILE} has no clip "${name}"`);
    const c = a.getClip();
    if (Math.abs(c.duration - FRAMES[name] / FPS) > 0.03) console.error(`INVALID_CLIP beasts: "${name}" lasts ${c.duration.toFixed(3)} s in the file, ${(FRAMES[name] / FPS).toFixed(3)} s here: stag.py and beasts.js are out of step`);
    a.setLoop(THREE.LoopRepeat, Infinity); a.clampWhenFinished = false; a.enabled = true; a.setEffectiveWeight(0);
    clip[name] = { action: a, duration: c.duration, w: 0, target: 0, t: 0, on: false, travel: null, length: 0 };
  }
  {
    const tr = trackOf(clip.wade.action.getClip(), 'root.position');
    if (!tr) throw new Error('beasts: the wade clip carries no travel (root.position)');
    const n = tr.times.length, d = [0, 1, 2].map((k) => tr.values[(n - 1) * 3 + k] - tr.values[k]);
    const axis = Math.abs(d[2]) >= Math.abs(d[0]) ? 2 : 0, sign = Math.sign(d[axis]) || 1;
    if (axis !== 2 || sign < 0) console.error('INVALID_MODEL beasts: the stag does not travel toward +Z in his own file');
    for (const name of TRAVELS) { const c = clip[name]; c.travel = travelOf(trackOf(c.action.getClip(), 'root.position'), axis, sign); c.length = c.travel(c.duration); }
  }
  const L_WADE = clip.wade.length, L_SLOW = clip.wade_slow.length, L_LONG = clip.wade_long.length, T_WADE = clip.wade.duration, T_SLOW = clip.wade_slow.duration, T_LONG = clip.wade_long.duration;
  const V_WADE = L_WADE / T_WADE, V_SLOW = L_SLOW / T_SLOW, V_LONG = L_LONG / T_LONG, STOP_D = clip.stop.length;
  // His three rounds (the short one, the ordinary one, the long one) are played in step and mixed by one number, `mix`: 0 the
  // short round, 1 the ordinary, 2 the long. So every pace from 0.65 to 1.8 m/s is a stride of its own LENGTH, each taking the
  // time a round of that length takes: he goes faster by reaching further, never by stepping quicker.
  const strideOf = (m) => (m <= 1 ? lerp(L_SLOW, L_WADE, m) : lerp(L_WADE, L_LONG, m - 1));
  const periodOf = (m) => (m <= 1 ? lerp(T_SLOW, T_WADE, m) : lerp(T_WADE, T_LONG, m - 1));
  // How fast each round is going where one clip hands over to another (phase 0, and half a round on, of the rounds; the last
  // moment of the start; the first of a stop): the start and the stop were made for the ordinary round, and are stretched or
  // shortened to meet whatever stride he is in, so that his speed is one unbroken line through every hand-over.
  const slope = (c, t) => { const a = Math.max(0, t - 0.02), b = Math.min(c.duration, t + 0.02); return (c.travel(b) - c.travel(a)) / (b - a); };
  const V_EDGE = [slope(clip.wade_slow, 0), slope(clip.wade, 0), slope(clip.wade_long, 0)], V_START_END = slope(clip.start, clip.start.duration), V_STOP_0 = slope(clip.stop, 0);
  const edgeSpeed = (m) => (m <= 1 ? lerp(V_EDGE[0], V_EDGE[1], m) : lerp(V_EDGE[1], V_EDGE[2], m - 1));
  /** The mix of the rounds and the rate they are played at, for a speed through the water. */
  const _gait = [1, 1];                           // (one pair, written again each time: nothing is made anew while he lives)
  const gaitFor = (v) => {
    if (v >= V_LONG) { _gait[0] = 2; _gait[1] = Math.min(1.15, v / V_LONG); return _gait; }
    if (v <= V_SLOW) { _gait[0] = 0; _gait[1] = Math.max(0.6, v / V_SLOW); return _gait; }
    let a = v < V_WADE ? 0 : 1, b = a + 1;
    for (let i = 0; i < 18; i++) { const m = (a + b) / 2; if (strideOf(m) / periodOf(m) < v) a = m; else b = m; }
    _gait[0] = (a + b) / 2; _gait[1] = 1; return _gait;
  };

  // ---- state
  const pos = new THREE.Vector3(), chest = new THREE.Vector3(), muzzle = new THREE.Vector3(), dark = new THREE.Vector4(0, 0, 0, o.dark);
  const S = {
    mode: 'stand', act: null, state: 'stand', heading: 0, omega: 0, lead: 0, bend: 0, speed: 0,
    phi: 0, stopping: 'stop', kStop: 1, mix: 1, rate: 1, pace: clamp(o.speed, 0.5, 1.8), paceNow: clamp(o.speed, 0.5, 1.8),
    route: null, along: 0, aside: false, asides: 0, plan: null, going: false, halting: false, yielding: false, held: false, fleeing: 0, wary: false, hurry: false, resume: false, after: null, band: o.ahead, meet: null, stillT: 0, pathS: null,
    standT: 0, actT: 0, actLeft: 0, actPhase: 0, bout: 0, earL: 0, earR: 0, earHold: [null, null], earSide: 0, sip: 0, drips: 0, dripT: 0, sprays: 0, sprayT: 0,
    reach: 0, fade: 1, fadeTo: 1, fadeRate: 0, glass: false, lens: 1e9, lanePrev: null, sinceWave: 0, only: null, depth: clamp(o.depth, 0.9, 1.15),
    lifeT: rnd() * 40, flickT: [1.5 + rnd() * 5, 3 + rnd() * 6], flick: [0, 0], flickAmp: [0, 0],
  };
  const DRIFT = [rnd() * TAU, rnd() * TAU, rnd() * TAU, rnd() * TAU];      // where the slow drift of his head begins: his own
  const fwdX = () => Math.sin(S.heading), fwdZ = () => Math.cos(S.heading);
  const point = (p) => (Array.isArray(p) ? (() => { const v = kit.at(p[0], p[1] || 0, 0); return { x: v.x, z: v.z }; })() : p.isVector3 ? { x: p.x, z: p.z } : p.s !== undefined ? (() => { const v = kit.at(p.s, p.d || 0, 0); return { x: v.x, z: v.z }; })() : { x: p.x, z: p.z });
  const setState = (s) => { if (s !== S.state) { S.state = s; if (o.onState) { try { o.onState(s, handle); } catch (err) { console.error(err); } } } };
  const touch = (x, z, kind) => { if (o.onTouch) { try { o.onTouch(x, z, kind); } catch (err) { console.error(err); } } };
  const colliders = o.collide && o.only !== 'mirror' ? [ctx.addCollider({ x: 0, z: 0, r: 1.25 }), ctx.addCollider({ x: 0, z: 0, r: 1.0 })] : [];

  function settle() {                             // write where he is into the group and the things an area reads
    group.position.set(pos.x, -(S.depth - 1) * o.scale, pos.z); group.rotation.y = S.heading;
    const fx = fwdX(), fz = fwdZ();
    chest.set(pos.x + fx * CHEST * o.scale, 0, pos.z + fz * CHEST * o.scale);
    dark.set(pos.x + fx * MID * o.scale, 0.6, pos.z + fz * MID * o.scale, o.dark);
    if (colliders.length) {
      const on = S.fade > 0.5 && S.only !== 'mirror';
      colliders[0].x = pos.x + fx * 0.55; colliders[0].z = pos.z + fz * 0.55; colliders[0].r = on ? 1.25 : -9;
      colliders[1].x = pos.x - fx * 0.45; colliders[1].z = pos.z - fz * 0.45; colliders[1].r = on ? 1.0 : -9;
    }
  }

  // ---- what he is asked to do
  function beginAct(type, seconds, opts = {}) {
    S.act = type; S.actT = 0; S.actPhase = 0; S.actLeft = seconds; S.plan = null;
    if (type === 'drink') { S.sip = 0.2; S.bout = opts.repeat ? 1 : 0; S.reach = 0; }
    if (type === 'shake') { S.sprays = 7; S.sprayT = 0.35; }
    setState(type);
  }
  function endAct() {
    const was = S.act;
    S.act = null; S.standT = 0; S.hurry = false;
    if (was === 'drink' && S.bout && !S.going) { S.plan = { then: 'drink', seconds: 4.5 + rnd() * 4.5, repeat: true, wait: 2.5 + rnd() * 4 }; }
    setState('stand');
  }
  function plan(then, seconds, opts = {}) {
    if (S.mode === 'stand' && !S.act) { beginAct(then, seconds, opts); return; }
    if (S.mode === 'stand' && S.act) { S.plan = { then, seconds, ...opts }; if (S.act !== 'shake') S.actLeft = 0; return; }
    S.plan = { then, seconds, ...opts }; S.halting = true;
  }
  function setRoute(points) {
    const P = [{ x: pos.x, z: pos.z }];
    for (const p of points) { const q = point(p); if (Math.hypot(q.x - P[P.length - 1].x, q.z - P[P.length - 1].z) > 0.3) P.push(q); }
    if (P.length < 2) return false;
    S.route = makeRoute(P); S.along = 0; S.aside = false; S.asides = 0;
    return true;
  }

  const handle = {
    object: group, bones, position: pos, chest, muzzle, dark, radius: o.dark, triangles: rig.triangles,
    get heading() { return S.heading; }, get speed() { return S.speed; }, get state() { return S.state; }, get along() { return S.along; },
    get routeLength() { return S.route ? S.route.length : 0; }, get stride() { return strideOf(S.mix); },
    /** For test stages: what the machinery is doing now. */
    debug() { const w = {}; for (const name of CLIPS) if (clip[name].w > 0.001) w[name] = +clip[name].w.toFixed(2); return { mode: S.mode, act: S.act, t: +S.actT.toFixed(2), phase: S.actPhase, left: +S.actLeft.toFixed(2), phi: +S.phi.toFixed(3), mix: +S.mix.toFixed(2), rate: +S.rate.toFixed(2), reach: +S.reach.toFixed(3), going: S.going, w, muzzle: +muzzle.y.toFixed(3), lens: +Math.min(99, S.lens).toFixed(2), alpha: +uFade.value.toFixed(2), boat: +boatTo.d.toFixed(2), held: S.held, yielding: S.yielding, wary: S.wary, pace: +S.paceNow.toFixed(2) }; },
    go(opts = {}) {
      const fresh = !!(opts.route || opts.to);
      if (opts.route) setRoute(opts.route); else if (opts.to) setRoute([opts.to]);
      if (!S.route) { const fx = fwdX(), fz = fwdZ(); setRoute([{ x: pos.x + fx * 16, z: pos.z + fz * 16 }]); }
      if (opts.speed) S.pace = clamp(opts.speed, 0.5, 1.8);
      // (go() with nothing in it is "walk on": the route he has, and what he was going to do at its end, stand)
      if (fresh || opts.then !== undefined) S.after = opts.then ? { then: opts.then, seconds: opts.seconds ?? (opts.then === 'drink' ? Infinity : 5), repeat: opts.repeat ?? opts.then === 'drink' } : null;
      if (fresh) S.meet = null;
      S.going = true; S.halting = false; S.held = false; S.plan = null;
      if (S.act && S.act !== 'shake') S.actLeft = 0;                         // he finishes lifting his head first
      return handle;
    },
    stop() { S.going = false; S.after = null; if (S.mode === 'wade' || S.mode === 'start') S.halting = true; return handle; },
    look(seconds = 4, opts = {}) { const resume = opts.resume ?? S.going; plan('look', seconds); S.resume = resume; if (!resume) S.going = false; return handle; },
    drink(seconds = 6, opts = {}) { S.going = false; S.after = null; plan('drink', seconds === Infinity ? 5 + rnd() * 4 : seconds, { repeat: opts.repeat ?? seconds === Infinity }); return handle; },
    shake() { const resume = S.going; plan('shake', 0); S.resume = resume; return handle; },
    pace(v) { S.pace = clamp(v, 0.5, 1.8); return handle; },
    arrive(along, seconds = 0) { S.meet = along === null || along === undefined ? null : { along, at: ctx.time + Math.max(0, seconds) }; return handle; },
    keepAhead(band) { S.band = band || null; return handle; },
    ears(left, right) { S.earHold[0] = left ?? null; S.earHold[1] = right ?? null; return handle; },
    only(where) { S.only = where || null; ctx.only(group, where === 'mirror' || where === 'direct' ? where : 'both'); settle(); return handle; },
    fade(alpha, seconds = 2) { S.fadeTo = clamp(alpha, 0, 1); S.fadeRate = seconds > 0 ? 1 / seconds : 1e6; if (!(seconds > 0)) S.fade = S.fadeTo; return handle; },
    alongAt(s) {
      if (!S.route) return 0;
      let best = 0, bd = Infinity;
      for (let a = 0; a <= S.route.length; a += 0.5) { S.route.at(a, _p); const q = ctx.path.locate(_p.x, _p.z, null, _loc).s; if (Math.abs(q - s) < bd) { bd = Math.abs(q - s); best = a; } }
      return best;
    },
    place(p = {}) {
      if (p.route) setRoute(p.route);
      if (p.along !== undefined && S.route) {
        const a = clamp(p.along, 0, S.route.length); S.route.at(a, _p); S.route.at(Math.min(S.route.length, a + 1.5) + (a > S.route.length - 1.5 ? 0.01 : 0), _p2);
        pos.set(_p.x, 0, _p.z); S.along = a;
        if (a <= S.route.length - 1.5) S.heading = Math.atan2(_p2.x - _p.x, _p2.z - _p.z); else { S.route.at(a - 1.5, _p2); S.heading = Math.atan2(_p.x - _p2.x, _p.z - _p2.z); }
      } else if (p.at || p.position) { const q = point(p.at || (Array.isArray(p.position) ? { x: p.position[0], z: p.position[p.position.length - 1] } : p.position)); pos.set(q.x, 0, q.z); }
      if (p.heading !== undefined) S.heading = p.heading;
      if (p.face || p.toward) { const q = point(p.face || { x: p.toward[0], z: p.toward[1] }); S.heading = Math.atan2(q.x - pos.x, q.z - pos.z); }
      S.omega = 0; S.lead = 0; S.bend = 0; S.speed = 0; S.act = null; S.plan = null; S.halting = false; S.lanePrev = null; S.standT = 0;
      for (const name of CLIPS) clip[name].w = 0;
      if (p.going) { S.mode = 'wade'; S.going = true; S.phi = 0; const g = gaitFor(S.pace); S.mix = g[0]; S.rate = g[1]; clip.wade.w = 1 - Math.abs(S.mix - 1); clip.wade_slow.w = Math.max(0, 1 - S.mix); clip.wade_long.w = Math.max(0, S.mix - 1); setState('wade'); }
      else { S.mode = 'stand'; if (p.going === false) S.going = false; clip.stand.w = 1; setState('stand'); }
      settle();
      return handle;
    },
    attach(obj, u = 0.5, v = 0) {
      const f = lerp(BACK[0][0], BACK[BACK.length - 1][0], clamp(u, 0, 1));
      let i = 0; while (i < BACK.length - 2 && BACK[i + 1][0] < f) i++;
      const rise = (BACK[i + 1][1] - BACK[i][1]) / (BACK[i + 1][0] - BACK[i][0]);
      const h = lerp(BACK[i][1], BACK[i + 1][1], (f - BACK[i][0]) / (BACK[i + 1][0] - BACK[i][0])), w = clamp(v, -1, 1);
      const name = f < -0.22 ? 'hips' : f < 0.06 ? 'spine1' : f < 0.30 ? 'spine2' : 'chest';
      // It LIES on his back: the thing's own +Y is turned to point out of his skin there (his back falls away 3.5 cm to either
      // side and rises toward the withers), and it keeps the turn it was given about that. Then it is handed to the bone under
      // it, in that bone's own frame. (It used to keep its turn in the BONE's frame: petals laid flat stood on edge, a row of fins.)
      _q.setFromUnitVectors(UP, _v.set(0.538 * w, 1, -rise).normalize()).multiply(obj.quaternion);
      obj.quaternion.setFromRotationMatrix(restInv[name]).multiply(_q);
      obj.position.set(w * 0.13, h - 0.035 * w * w + 0.004, f).applyMatrix4(restInv[name]);
      bones[name].add(obj);
      return obj;
    },
  };

  // ---- to begin with
  {
    const q = o.at ? point(o.at) : o.position ? { x: o.position[0], z: o.position[o.position.length - 1] } : { x: 0, z: 0 };
    pos.set(q.x, 0, q.z);
    if (o.heading !== undefined) S.heading = o.heading;
    else if (o.face || o.toward) { const t = point(o.face || { x: o.toward[0], z: o.toward[1] }); S.heading = Math.atan2(t.x - pos.x, t.z - pos.z); }
    else if (o.at) S.heading = kit.headingAt(o.at[0]) + Math.PI;        // down the waterway
    clip.stand.w = 1; S.standT = rnd() * clip.stand.duration * 0.5;
    settle();
    if (o.only) handle.only(o.only);
    if (o.route) setRoute(o.route);
  }

  // ---- every frame (nothing is allocated here: what a frame needs is made once, below and above)
  const boatTo = { d: 1e9, bearing: 0 }, eye = ctx.engine.shared.uCameraPos.value;
  const went = { wade: 0, wade_slow: 0, wade_long: 0, start: 0, stop: 0, stop_b: 0 };
  const ran = (name, t0, t1, wraps = 0) => { const c = clip[name]; went[name] += c.travel(t1) - c.travel(t0) + wraps * c.length; };
  const LANE_HERE = { channel: 'lane', radius: marks.lane * 0.8, strength: 1, soft: 0.6 }, LANE_WAKE = { channel: 'lane', radius: marks.lane, strength: 1, soft: 0.55 };
  const earTurn = (name, k) => { if (k > 0.002) { const b = bones[name], e = EAR_BACK[name]; b.rotateY(e[1] * k); b.rotateX(e[0] * k); } };
  function update(dt) {
    if (!(dt > 0)) return;
    dt = Math.min(dt, 0.1);
    const calm = !!ctx.reducedMotion, boat = ctx.boat, W = ctx.water;
    {                                             // metres an antler's half-thickness must not fall below, for each metre from the eye
      const eng = ctx.engine, cam = eng.camera;
      uThin.value = o.antlerPixels > 0 && cam ? (SOLID ? Math.max(0.52, o.antlerPixels) : o.antlerPixels) * 2 * Math.tan(cam.fov * RAD / 2) / Math.max(1, (eng.height || 900) * (eng.pixelRatio || 1)) : 0;
    }
    const bx = boat.x - pos.x, bz = boat.z - pos.z;
    boatTo.d = Math.hypot(bx, bz); boatTo.bearing = wrapPi(Math.atan2(bx, bz) - S.heading);       // where the boat is from him: 0 ahead, positive to his left
    const real = S.only !== 'mirror';
    const wasWary = S.wary;
    if (real && o.shy > 0 && boatTo.d < o.shy) S.wary = true; else if (!real || !(o.shy > 0) || boatTo.d > o.shy + 5) S.wary = false;
    const close = S.wary;                         // the boat has come inside his distance, and has not yet gone well clear of it
    if (close && !wasWary) touch(chest.x, chest.z, 'quicken');

    // ---- the rules of the boat: how fast he wants to go, and whether he may go at all
    let want = S.pace, hold = false;
    if (S.band && S.route && S.going) {
      const mine = ctx.path.locate(pos.x, pos.z, S.pathS, _loc).s; S.pathS = mine;
      const gap = mine - ctx.s;
      S.stillT = boat.speed < 0.35 ? S.stillT + dt : Math.max(0, S.stillT - dt * 3);
      if (gap > 0) {
        if (gap < S.band[0]) want = Math.max(want, lerp(want, o.quick, smooth(S.band[0], S.band[0] - 7, gap)));
        else if (gap > S.band[1]) want = Math.min(want, lerp(want, o.slow, smooth(S.band[1], S.band[1] + 6, gap)));
        if (S.stillT > 2.5 && gap > S.band[0] - 6) hold = true;               // the boat has stopped: he stops, and listens
        if (gap > S.band[1] + 14) hold = true;
      }
    }
    if (S.meet && S.route && S.going) {                                       // a place to be at a time: the stride is made longer or shorter for it
      const left = S.meet.along - S.along;
      if (left <= 0.4) S.meet = null; else want = clamp(left / Math.max(0.5, S.meet.at - ctx.time), o.slow, o.quick);
    }
    if (real && o.yield > 0 && S.route && S.going && !close) {                // the boat lies close to his way ahead: he waits among the trunks
      let m = Infinity;
      for (let a = S.along + 2; a <= Math.min(S.route.length, S.along + 13); a += 1.25) { S.route.at(a, _p); m = Math.min(m, Math.hypot(boat.x - _p.x, boat.z - _p.z)); }
      S.yielding = m < boatTo.d - 0.5 && m < (S.yielding ? o.yield + 2.5 : o.yield);      // (only a way that leads nearer the boat is barred)
      if (S.yielding) hold = true;
    } else S.yielding = false;
    if (close) { want = o.quick; hold = false; }
    if (calm) want = Math.min(want, 1.3);
    if (hold && !S.held && (S.mode === 'wade' || S.mode === 'start')) { S.held = true; S.halting = true; S.plan = { then: 'look', seconds: 3.5 + rnd() * 2 }; S.resume = false; }
    if (!hold && S.held) { S.held = false; }
    // standing, with the boat too near: he leaves, without hurry and without looking
    if (close && S.mode === 'stand' && S.fleeing <= 0) {
      if (!S.route || S.along > S.route.length - 2) {
        const side = boatTo.bearing >= 0 ? -1 : 1, a = S.heading + side * clamp(Math.PI - Math.abs(boatTo.bearing), 0.2, 0.9);
        const again = S.act === 'drink' || (S.plan && S.plan.then === 'drink');
        setRoute([{ x: pos.x + fwdX() * 5 + Math.sin(a) * 11, z: pos.z + fwdZ() * 5 + Math.cos(a) * 11 }]);
        S.after = again ? { then: 'drink', seconds: 5 + rnd() * 4, repeat: true } : { then: 'look', seconds: 4 };
        S.aside = true;                           // (a way of his own choosing, to get out of the boat's: see where it is lengthened, below)
      }
      S.going = true; S.plan = null; S.fleeing = 6;
      if (S.act && S.act !== 'shake') { S.actLeft = 0; S.hurry = true; }
    }
    S.fleeing = Math.max(0, S.fleeing - dt);

    // ---- pace: the two rounds of the stride, mixed and played in step
    S.paceNow = ease(S.paceNow, clamp(want, 0.45, 1.85), dt, 1.1);
    const gait = gaitFor(S.paceNow);
    S.mix = ease(S.mix, gait[0], dt, 0.9); S.rate = ease(S.rate, gait[1], dt, 0.9);
    const period = periodOf(S.mix);

    // ---- advance what he is doing. Each travelling clip says how far its own root has gone this frame (`went`)
    for (const name of CLIPS) clip[name].target = 0;
    went.wade = 0; went.wade_slow = 0; went.wade_long = 0; went.start = 0; went.stop = 0; went.stop_b = 0;
    let fadeTime = 0.3, pulse = false;
    if (S.mode === 'stand') {
      if (S.act) {
        const c = clip[S.act], mark = MARK[S.act], half = calm && S.act === 'shake';
        // (leaving because the boat is too near, he does not wait out the held part, and lifts his head a little quicker: no more)
        S.actT += dt * (half ? 0.6 : S.hurry ? (S.actPhase === 1 ? 3 : 1.4) : 1);
        if (mark) {
          if (S.actPhase === 0 && S.actT >= mark[0]) S.actPhase = 1;
          if (S.actPhase === 1) {                 // the held part loops until the time asked for is up; then the clip runs out
            S.actLeft -= dt;
            if (S.actT >= mark[1]) {
              if (S.actLeft > 0) S.actT -= (mark[1] - mark[0]);
              else { S.actPhase = 2; if (S.act === 'drink') { S.drips = 4; S.dripT = 0.3; } }       // his lips leave the water: it runs off his muzzle as his head comes up, not after
            }
          }
        }
        c.target = half ? 0.5 : 1; clip.stand.target = 1 - c.target;        // reduced motion: the shake at half its size and slower
        c.t = Math.min(S.actT, c.duration - 1e-3);
        if (S.actT >= c.duration) { const res = S.resume; S.resume = false; endAct(); if (res) S.going = true; clip.stand.target = 1; c.target = 0; }
      } else {
        clip.stand.target = 1;
        if (S.plan && !(S.plan.wait > 0)) { const p = S.plan; if (S.going && p.then === 'drink') S.plan = null; else beginAct(p.then, p.seconds, p); }
        else if (S.plan) S.plan.wait -= dt;
        if (!S.act && !S.plan && S.going && !hold) {
          if (S.route && S.along < S.route.length - 0.6) { S.mode = 'start'; clip.start.t = 0; setState('start'); }
          else { S.going = false; if (S.after) { S.plan = S.after; S.after = null; } }
        }
      }
      S.standT = (S.standT + dt) % clip.stand.duration; clip.stand.t = S.standT;
    }
    if (S.mode === 'start') {
      const c = clip.start, t0 = c.t; c.t = Math.min(c.duration, c.t + dt * S.rate); c.target = 1; fadeTime = 0.25;
      ran('start', t0, c.t);
      if (c.t >= c.duration) {                    // (what is left of this frame is the wade's: nothing of his travel is dropped at the hand-over)
        const over = Math.max(0, (t0 + dt * S.rate - c.duration) / Math.max(0.1, S.rate));
        S.mode = 'wade'; S.phi = Math.min(0.2, over * S.rate / period); setState('wade');
        ran('wade', 0, S.phi * T_WADE); ran('wade_slow', 0, S.phi * T_SLOW); ran('wade_long', 0, S.phi * T_LONG);
      }
    } else if (S.mode === 'wade') {
      const phi0 = S.phi, step = dt * S.rate / period;
      // The boat is still at his heels where he meant to stop: he does not halt and set off again (that was a stutter), he
      // goes on a little further, bearing away from it. Three times at most: then he stands, and his colliders keep the hull off.
      if (S.aside && close && S.asides < 3 && S.route && S.route.length - S.along < 5) {
        const P = S.route.points, n = P.length, ex = P[n - 1].x, ez = P[n - 1].z, L0 = Math.hypot(ex - P[n - 2].x, ez - P[n - 2].z) || 1, bd = Math.hypot(boat.x - ex, boat.z - ez) || 1;
        P.push({ x: ex + (ex - P[n - 2].x) / L0 * 9 - (boat.x - ex) / bd * 3, z: ez + (ez - P[n - 2].z) / L0 * 9 - (boat.z - ez) / bd * 3 });
        S.route = makeRoute(P); S.asides++;
      }
      // the end of his route: he shortens his stride as he comes up to it, and stops at the end of the round that brings him nearest
      const left = S.route ? S.route.length - S.along : 1e9, L = strideOf(S.mix);
      if (left < 7 && !close) S.paceNow = ease(S.paceNow, Math.min(S.paceNow, o.slow + 0.1), dt, 0.7);
      if ((phi0 < PUSH && phi0 + step >= PUSH) || (phi0 < PUSH + 0.5 && phi0 + step >= PUSH + 0.5) || (phi0 < PUSH + 1 && phi0 + step >= PUSH + 1)) pulse = true;      // a hind leg ends its push
      // He can halt wherever a hind hoof has just been set down: at the end of the round (the clip `stop`) or half way round it
      // (`stop_b`, the same with left and right changed over). So he is never more than half a round from a halt.
      const edge = phi0 + step >= 1 ? 1 : phi0 < 0.5 && phi0 + step >= 0.5 ? 0.5 : 0;
      const kNow = clamp(edgeSpeed(S.mix) * S.rate / V_STOP_0, 0.4, 1.8);    // how fast he is going where a stop could begin, as a share of the pace the stop was made for
      if (edge && (S.halting || left <= STOP_D * kNow + L * 0.25)) {          // a hind hoof is down, and he is to stop: the stop begins here
        ran('wade', phi0 * T_WADE, edge * T_WADE); ran('wade_slow', phi0 * T_SLOW, edge * T_SLOW); ran('wade_long', phi0 * T_LONG, edge * T_LONG);
        S.stopping = edge === 1 ? 'stop' : 'stop_b'; S.kStop = kNow;
        const cs = clip[S.stopping]; cs.t = clamp((phi0 + step - edge) * period / Math.max(0.1, S.rate), 0, 0.1); ran(S.stopping, 0, cs.t);      // (the rest of this frame is the stop's)
        S.mode = 'stop'; cs.target = 1; S.phi = edge === 1 ? 0 : 0.5; S.halting = false; fadeTime = 0.18; setState('stop');
        if (left <= STOP_D * kNow + L * 0.25 + 0.3) { S.going = false; if (S.after && !S.plan) { S.plan = S.after; S.after = null; } }
      } else {
        const wraps = phi0 + step >= 1 ? 1 : 0, phi1 = phi0 + step - wraps;
        ran('wade', phi0 * T_WADE, phi1 * T_WADE, wraps); ran('wade_slow', phi0 * T_SLOW, phi1 * T_SLOW, wraps); ran('wade_long', phi0 * T_LONG, phi1 * T_LONG, wraps);
        S.phi = phi1; clip.wade.target = 1 - Math.abs(S.mix - 1); clip.wade_slow.target = Math.max(0, 1 - S.mix); clip.wade_long.target = Math.max(0, S.mix - 1);
      }
    } else if (S.mode === 'stop') {
      const c = clip[S.stopping], t0 = c.t; c.t = Math.min(c.duration, c.t + dt); c.target = 1; fadeTime = 0.18;
      ran(S.stopping, t0, c.t);
      if (c.t >= c.duration) {
        S.mode = 'stand'; S.standT = 0; clip.stand.t = 0; clip.stand.target = 1; c.target = 0; setState('stand');
        if (marks.rings) W.ripple(chest.x, chest.z, 0.3, 0.6);                // his own wave catches him up
        touch(chest.x, chest.z, 'stop');
      }
    }
    clip.wade.t = Math.min(S.phi * T_WADE, T_WADE - 1e-4); clip.wade_slow.t = Math.min(S.phi * T_SLOW, T_SLOW - 1e-4); clip.wade_long.t = Math.min(S.phi * T_LONG, T_LONG - 1e-4);

    // ---- weights: each clip eases toward what is asked of it; together they always make one whole pose
    let sum = 0;
    for (const name of CLIPS) { const c = clip[name]; c.w = toward(c.w, c.target, dt / fadeTime); sum += c.w; }
    if (!(sum > 1e-4)) { clip.stand.w = 1; sum = 1; }
    // (The mixer writes a bone only when its value has changed since last frame. The bones that are turned further below
    // are therefore handed back to it as it left them, so that what it leaves alone is still its own.)
    for (const name of TOUCHED) bones[name].quaternion.copy(pure[name]);
    bones.root.position.copy(pureRoot);
    for (const name of CLIPS) {
      const c = clip[name], w = c.w / sum;
      if (w > 1e-4) { if (!c.on) { c.action.play(); c.on = true; } c.action.setEffectiveWeight(w); c.action.time = c.t; }
      else if (c.on) { c.action.stop(); c.on = false; }
    }
    mixer.update(0);
    for (const name of TOUCHED) pure[name].copy(bones[name].quaternion);
    pureRoot.copy(bones.root.position);
    bones.root.position.z = rest.root.p.z;        // his travel is not the bone's: it is his own
    // His travel is that of the stride he is in, WHOLE, while the poses of two clips are faded into one another. (Shared out by
    // the fading weights, as it was, he stalled at every hand-over: from 1.2 m/s to 0.2 in one frame as the start gave way to
    // the wade, and again as a stop began.) The start and the stop were made for the ordinary round: at another pace they
    // carry him that much further or less far, so that his speed is one line through both.
    const mS = Math.max(0, 1 - S.mix), mL = Math.max(0, S.mix - 1), mW = 1 - mS - mL;
    let moved = went.start * clamp(edgeSpeed(S.mix) / V_START_END, 0.4, 1.8) + (went.stop + went.stop_b) * S.kStop + mS * went.wade_slow + mW * went.wade + mL * went.wade_long;
    if (calm && S.mode === 'wade') moved = strideOf(S.mix) * dt * S.rate / period;    // reduced motion: an even pace, no surge
    moved = Math.max(0, moved);

    // ---- where he goes: toward a point a little way along his route, on an arc his body can make; the head goes first
    const moving = S.mode !== 'stand';
    let turnTo = 0, leadTo = 0;
    if (moving && S.route) {
      S.along = S.route.project(pos.x, pos.z, S.along);
      S.route.at(S.along + 3.5, _p); S.route.at(S.along + 7.5, _p2);
      if (real && o.shy > 0 && boatTo.d < o.shy + 3 && boatTo.d > 0.01) {      // he angles away from the boat
        const push = 3.2 * smooth(o.shy + 3, o.shy * 0.5, boatTo.d);
        _p.x -= bx / boatTo.d * push; _p.z -= bz / boatTo.d * push; _p2.x -= bx / boatTo.d * push; _p2.z -= bz / boatTo.d * push;
      }
      turnTo = wrapPi(Math.atan2(_p.x - pos.x, _p.z - pos.z) - S.heading);
      leadTo = clamp(wrapPi(Math.atan2(_p2.x - pos.x, _p2.z - pos.z) - S.heading) * 0.9, -28 * RAD, 28 * RAD);
    }
    const v = moved / dt, R = Math.max(5, o.turnRadius), maxTurn = v / R;
    S.omega = ease(S.omega, moving ? clamp(turnTo * v / 2.6, -maxTurn, maxTurn) : 0, dt, calm ? 0.9 : 0.55);
    S.omega = clamp(S.omega, -maxTurn, maxTurn);
    S.heading = wrapPi(S.heading + S.omega * dt);
    S.lead = ease(S.lead, moving ? leadTo : 0, dt, 0.5);
    S.bend = ease(S.bend, v > 0.05 ? clamp(S.omega / v * TRUNK, -0.24, 0.24) : 0, dt, 0.4);
    pos.x += fwdX() * moved * o.scale; pos.z += fwdZ() * moved * o.scale;
    S.speed = ease(S.speed, v * o.scale, dt, 0.25);
    settle();

    // ---- on top of the clips: the bend of the turn, the neck that leads it, the ears, the last of the reach to the water
    for (const name in BEND) { const b = bones[name]; _q.setFromAxisAngle(axes[name].up, S.bend * BEND[name]); b.quaternion.multiply(_q); }
    for (const name in LEAD) { const b = bones[name]; _q.setFromAxisAngle(axes[name].up, (S.lead + S.bend) * LEAD[name]); b.quaternion.multiply(_q); }
    {
      // one ear answers the boat: the ear on its side turns back toward it; the head never does
      let wantL = 0, wantR = 0;
      if (real && o.ear > 0 && boatTo.d < o.ear) {
        if (S.earSide === 0 || Math.abs(boatTo.bearing) > 0.35) S.earSide = boatTo.bearing >= 0 ? 1 : -1;
        const back = smooth(35 * RAD, 150 * RAD, Math.abs(boatTo.bearing)) * smooth(o.ear, o.ear * 0.7, boatTo.d);
        if (S.earSide > 0) wantL = back; else wantR = back;
      } else S.earSide = 0;
      if (S.act === 'look') { wantL = 0; wantR = 0; } else if (S.act === 'drink') { wantL *= 0.45; wantR *= 0.45; }      // (those clips work the ears themselves)
      if (S.earHold[0] !== null) wantL = S.earHold[0];
      if (S.earHold[1] !== null) wantR = S.earHold[1];
      S.earL = ease(S.earL, wantL, dt, calm ? 0.7 : 0.32); S.earR = ease(S.earR, wantR, dt, calm ? 0.8 : 0.4);
      // Nothing alive repeats itself exactly, and his clips are loops. So an ear flicks when it will (each in its own time,
      // never the two alike; not while he listens, when the clip works them) ...
      for (let i = 0; i < 2; i++) {
        if ((S.flickT[i] -= dt) <= 0 && S.flick[i] <= 0) { S.flickT[i] = 2.6 + rnd() * 7.5; S.flickAmp[i] = (0.3 + 0.45 * rnd()) * (calm ? 0.6 : 1); S.flick[i] = 1e-4; }
        if (S.flick[i] > 0) { S.flick[i] += dt / 0.34; if (S.flick[i] >= 1) S.flick[i] = 0; }
      }
      const fl = (i) => { const u = S.flick[i]; return u <= 0 || S.act === 'look' || S.act === 'shake' ? 0 : S.flickAmp[i] * (u < 0.3 ? smooth(0, 0.3, u) : 1 - smooth(0.3, 1, u)); };      // out quickly, back more slowly
      earTurn('ear_L', S.earL + fl(0)); earTurn('ear_R', S.earR + fl(1));
    }
    {
      // ... and his head drifts a little as he goes: a few degrees, slowly, on no beat of his stride (and never round to the boat)
      S.lifeT += dt;
      const a = S.lifeT, k = (calm ? 0.5 : 1) * (S.act === 'shake' ? 0 : 1);
      const yaw = (Math.sin(a * 0.41 + DRIFT[0]) * 0.6 + Math.sin(a * 0.97 + DRIFT[1]) * 0.4) * 2.6 * RAD * k;
      const nodding = (Math.sin(a * 0.53 + DRIFT[2]) * 0.6 + Math.sin(a * 1.13 + DRIFT[3]) * 0.4) * 1.3 * RAD * k * (S.act === 'drink' ? 0.15 : 1);
      _q.setFromAxisAngle(axes.neck3.up, yaw * 0.4); bones.neck3.quaternion.multiply(_q);
      _q.setFromAxisAngle(axes.head.up, yaw * 0.6); bones.head.quaternion.multiply(_q);
      _q.setFromAxisAngle(axes.head.side, nodding); bones.head.quaternion.multiply(_q);
    }
    if (Math.abs(S.reach) > 1e-4) for (const name in REACH) { _q.setFromAxisAngle(axes[name].side, S.reach * REACH[name]); bones[name].quaternion.multiply(_q); }
    if (S.act === 'drink' && S.actPhase === 1 && clip.drink.w / sum > 0.9) {
      // his lips meet the water where the water is (the clip was made for a metre of it, lying flat)
      bones.muzzle.getWorldPosition(_v); group.parent.worldToLocal(_v);
      const err = _v.y - (W.heightAt(_v.x, _v.z) - 0.012);
      S.reach = clamp(S.reach + clamp(err, -0.05, 0.05) * dt * 6, -0.22, 0.22);
    } else S.reach = ease(S.reach, 0, dt, 0.5);
    bones.muzzle.getWorldPosition(muzzle); group.parent.worldToLocal(muzzle);      // (a frame old: good enough for a ring)

    // ---- thinning away
    let alpha = S.fade = toward(S.fade, S.fadeTo, dt * S.fadeRate);
    if (o.vanish > 0) alpha *= smooth(o.vanish, o.vanish + 3, Math.hypot(boat.x - (pos.x + fwdX() * MID), boat.z - (pos.z + fwdZ() * MID)));
    if (real) {
      // Never in the rider's face. His colliders keep the hull off him and he leaves before it comes near; should a cut, a route or
      // a rider's steering still bring any of him inside a metre and a half of the eye, he thins to nothing before 0.8 m of it.
      // (His trunk: a line from his tail to the root of his neck, a hand above the water, 0.3 m thick; his head and antlers: a ball of 0.7 m.)
      const e = _v.copy(eye); group.parent.worldToLocal(e);
      const k = o.scale, fx = fwdX(), fz = fwdZ(), ax = pos.x + fx * RUMP * k, az = pos.z + fz * RUMP * k, lx = fx * (0.6 - RUMP) * k, lz = fz * (0.6 - RUMP) * k;
      const t = clamp(((e.x - ax) * lx + (e.z - az) * lz) / (lx * lx + lz * lz), 0, 1);
      const body = Math.hypot(e.x - ax - lx * t, e.y - 0.2 * k, e.z - az - lz * t) - 0.3 * k;
      bones.head.getWorldPosition(_v2); group.parent.worldToLocal(_v2);
      const head = Math.hypot(e.x - _v2.x, e.y - _v2.y - 0.35 * k, e.z - _v2.z) - 0.7 * k;
      S.lens = Math.min(body, head);
      alpha *= smooth(0.8, 1.5, S.lens);
    }
    uFade.value = alpha; group.visible = alpha > 0.004;
    const glass = alpha < 0.999;
    if (glass !== S.glass) { S.glass = glass; for (const m of mats) m.transparent = glass; }
    uCrisp.value = o.crisp && !glass ? 1 : 0;       // (a blended material cannot carry the mark: its alpha is its thinness)

    // ---- what he writes on the water
    if (alpha > 0.3) {
      if (marks.lane > 0 && W.trace) {
        const rx = pos.x + fwdX() * RUMP * 0.6, rz = pos.z + fwdZ() * RUMP * 0.6;
        W.trace.line(rx, rz, chest.x, chest.z, LANE_HERE);      // the water he stands in is open
        if (S.lanePrev && (chest.x - S.lanePrev.x) ** 2 + (chest.z - S.lanePrev.z) ** 2 > 0.02) {
          W.trace.line(S.lanePrev.x, S.lanePrev.z, chest.x, chest.z, LANE_WAKE);
          S.lanePrev.x = chest.x; S.lanePrev.z = chest.z;
        } else if (!S.lanePrev) S.lanePrev = { x: chest.x, z: chest.z };
      }
      if (waveK > 0 && moving) {
        S.sinceWave += moved;
        if (pulse) {                             // a push: the bow wave is renewed, and the water closes behind him
          const k = clamp(S.speed / V_WADE, 0.4, 1.6);
          W.ripple(chest.x, chest.z, waveK * k * Math.sqrt(k), marks.waveRadius);
          W.ripple(pos.x + fwdX() * RUMP, pos.z + fwdZ() * RUMP, waveK * 0.35 * k, 0.5);
          touch(chest.x, chest.z, 'wade');
          S.sinceWave = 0;
        } else if (S.sinceWave > 0.32) {          // between pushes the chest still parts the water
          W.ripple(chest.x, chest.z, waveK * 0.26 * clamp(S.speed / V_WADE, 0.3, 1.5), 0.55);
          S.sinceWave = 0;
        }
      }
      if (S.act === 'drink' && S.actPhase === 1) {
        S.sip -= dt;
        if (S.sip <= 0) { S.sip = 0.7; if (marks.rings) W.ripple(muzzle.x, muzzle.z, 0.2, 0.16); touch(muzzle.x, muzzle.z, 'drink'); }
      }
      if (S.drips > 0) { S.dripT -= dt; if (S.dripT <= 0) { S.drips--; S.dripT = (0.3 + rnd() * 0.25) * (5 - S.drips) * 0.55; /* fewer and further between as it runs dry */ if (marks.rings) W.ripple(muzzle.x + (rnd() - 0.5) * 0.08, muzzle.z + (rnd() - 0.5) * 0.08, 0.07, 0.08); touch(muzzle.x, muzzle.z, 'drip'); } }
      if (S.sprays > 0) { S.sprayT -= dt; if (S.sprayT <= 0) { S.sprays--; S.sprayT = 0.07 + rnd() * 0.1; const a = rnd() * TAU, r = 0.5 + rnd() * 0.8; if (marks.rings) W.ripple(muzzle.x - fwdX() * 0.3 + Math.cos(a) * r, muzzle.z - fwdZ() * 0.3 + Math.sin(a) * r, 0.06, 0.07); if (S.sprays === 5) touch(muzzle.x, muzzle.z, 'shake'); } }
    }
  }
  ctx.onUpdate(update);
  ctx.onDispose(() => { for (const c of colliders) c.r = -9; });
  update(1e-3);                                   // so that he is posed before the first picture
  return handle;
}

// ================================================================================================ the far deer
const DEER_FILE = 'models/life/deer_far.glb';
// Where the far form hinges, in its own space (metres; +z is the way it walks), and what its UVs mean: u says which part
// a point belongs to, v how far along that part it lies. source-art/models/life/deer_far.py writes both and prints them.
const DEER = { shoulder: [0.88, 0.40], hip: [0.94, -0.42], knee: 0.44, hock: 0.50, neck: [1.04, 0.48], poll: [1.44, 0.94], stride: 1.5, height: 1.2 };

/**
 * A line of far deer, walking in single file a long way off. Resolves to the handle.
 *
 * options:
 *   count: 9                           how many (thinned at lower quality unless exact: true)
 *   from: [s, d] | {x, z}, to: ...     the line they walk, from its start to its end (path coordinates or the realm's own)
 *   lead: 0                            metres along the line where the leader is to begin with
 *   y: 0                               the height of the ground they walk on; or ground(x, z) -> height
 *   speed: 1.2                         m/s
 *   gaps: [3, 9]                       metres between one and the next (never even)
 *   stag: 'last'                       which one carries antlers: 'last' | 'first' | 'none' | an index
 *   color: '#7a7194'                   the one tone they are washed in (it multiplies a little modelling in the paint)
 *   flat: 0.85                         how far that tone stands as it is, like a wash of ink (1), and how far it takes the realm's light (0)
 *   air: 0.5                           how much of the realm's fog they take. Dabs eight pixels high are already thinned by the pixels
 *                                      themselves; with all of the air on top they are faint (measured: docs/life/beasts.md). Nearer
 *                                      than 100 m give them 1. The veil between two realms takes them whole whatever this is
 *   mist: [bottom, top, amount]        the mist their legs are lost in: world heights, and how far it takes them (0..1); null for none
 *   stops: true                        now and then one stops for two to four seconds and walks on
 *   watch: 14                          every so many seconds a head comes up, and perhaps one or two near it (0: never)
 *   end: 'stop'                        at the end of the line: 'stop' | 'wrap' (begin again: for a test stage)
 *   crisp: true                        the painter's filter leaves them as drawn: a neck 13 cm thick is half a pixel at 170 m, and the
 *                                      brush would take it. For a herd staged nearer than about 80 m give false (they are then broad
 *                                      enough to be painted like everything else)
 *   bold: 0.2                          pixels laid on all round every part, so that a leg is a line and not a row of dots (never more
 *                                      than 0.22 m; 0: as modelled). Without multisampling (low quality) it is at least 0.4
 *   scale: 1, seed: 5, parent, exact, shade, brush
 *
 * the handle:
 *   object, count
 *   positions                          Vector3 of every deer, leader first (realm coordinates)
 *   halt(seconds = 3)                  something sounds: each stops as it hears it (within about a second of the leader), its head coming
 *                                      up a moment after, no two alike; after `seconds` the leader walks on and the rest follow
 *   watch(from)                        one head comes up now (deer `from`, or any), and perhaps one or two near it
 *   place(metres)                      put the leader that far along the line (while they cannot be seen)
 *   walking                            (get/set) false holds them all where they stand
 *   lead                               metres along the line where the leader is
 */
export async function makeFarDeer(ctx, options = {}) {
  const { kit } = ctx;
  const o = { count: 9, lead: 0, y: 0, speed: 1.2, gaps: [3, 9], stag: 'last', color: '#7a7194', flat: 0.85, air: 0.5, mist: null, stops: true, watch: 14, end: 'stop', scale: 1, seed: 5, exact: false, shade: 0.55, brush: 0.3, bold: 0.2, crisp: true, ...options };
  const n = Math.max(1, o.exact ? o.count : Math.max(3, kit.count(o.count)));
  const pt = (p) => (Array.isArray(p) ? (() => { const v = kit.at(p[0], p[1] || 0, 0); return { x: v.x, z: v.z }; })() : { x: p.x, z: p.z });
  const A = pt(o.from || [0, 0]), B = pt(o.to || [100, 0]);
  const len = Math.hypot(B.x - A.x, B.z - A.z) || 1, dx = (B.x - A.x) / len, dz = (B.z - A.z) / len, heading = Math.atan2(dx, dz);
  const ground = typeof o.ground === 'function' ? o.ground : () => o.y;
  const rnd = ctx.rng(o.seed * 977 + 3);

  const src = await kit.model(DEER_FILE, { position: [0, -1000, 0] });
  src.group.removeFromParent();                   // only its geometry is wanted: it is drawn here, instanced
  const geo = src.body.geometry;
  if (!geo.attributes.uv) throw new Error(`beasts: ${DEER_FILE} has no part numbers (uv)`);
  const mist = o.mist ? new THREE.Vector3(o.mist[0], o.mist[1], o.mist[2] ?? 0.9) : new THREE.Vector3(-10, -9, 0);
  const uBold = { value: 0 }, SOLID = !!(ctx.quality && ctx.quality.samples === 0);      // (no multisampling: a line under a pixel wide would break into dashes and twinkle as it walks)
  const material = kit.gouache({
    color: o.color, vertexColors: true, shade: o.shade, brush: o.brush, crisp: !!o.crisp,
    extend: {
      uniforms: { uMist: { value: mist }, uFlat: { value: o.flat }, uAir: { value: o.air }, uVeilK: ctx.engine.shared.uVeil, uBold, uHinge: { value: new THREE.Vector4(DEER.shoulder[0], DEER.shoulder[1], DEER.hip[0], DEER.hip[1]) },
        uNeck: { value: new THREE.Vector4(DEER.neck[0], DEER.neck[1], DEER.poll[0], DEER.poll[1]) }, uKnee: { value: new THREE.Vector2(DEER.knee, DEER.hock) } },
      vertexPars: /* glsl */`
        attribute vec4 aDeer;                    // phase of the stride 0..1, how much it is walking 0..1, how far its head is up 0..1, 1 if it carries antlers
        uniform vec4 uHinge, uNeck; uniform vec2 uKnee; uniform float uBold;
        vec2 turnYZ(vec2 p, vec2 about, float a) { vec2 r = p - about; float c = cos(a), s = sin(a); return about + vec2(r.x * c - r.y * s, r.x * s + r.y * c); }`,
      // Parts by uv.x: 0 trunk, 1 neck, 2 head, 3..6 legs (left fore, right fore, left hind, right hind), 7 antlers.
      // The walk of a deer: left hind, left fore, right hind, right fore. Each leg swings from its shoulder or hip; from
      // the knee or hock down it folds as it is carried forward. The trunk rises a little twice a stride. A deer that has
      // stopped stands as its last stride left it, its hooves half as far apart: never four posts in a row, and no two alike.
      vertexLocal: /* glsl */`
        float part = floor(uv.x * 8.0 + 0.5), along = uv.y, walk = aDeer.y;
        float ph = aDeer.x * 6.2831853;
        if (part > 2.5 && part < 6.5) {
          float leg = part - 3.0, off = leg < 0.5 ? 0.25 : leg < 1.5 ? 0.75 : leg < 2.5 ? 0.0 : 0.5;
          float a = ph - off * 6.2831853;
          vec2 hinge = leg < 1.5 ? uHinge.xy : uHinge.zw; float knee = leg < 1.5 ? uKnee.x : uKnee.y;
          float swing = -0.34 * cos(a + 0.5) * mix(0.5, 1.0, walk);         // forward as it is set down, back as it leaves
          float fold = smoothstep(0.0, 1.0, sin(a - 2.5)) * (leg < 1.5 ? 0.85 : -0.55) * walk;   // carried forward: the knee folds back, the hock forward
          if (transformed.y < knee) transformed.yz = turnYZ(transformed.yz, vec2(knee, mix(hinge.y, transformed.z, 0.0) + (leg < 1.5 ? 0.02 : -0.06)), fold);
          transformed.yz = turnYZ(transformed.yz, hinge, swing);
        }
        if (part > 0.5 && part < 2.5 || part > 6.5) {
          float up = aDeer.z, nod = 0.05 * sin(2.0 * ph + 0.8) * walk;
          float lift = -(0.50 * up + nod - 0.14 * walk * (1.0 - up));       // the neck comes up, about the withers; walking it is carried forward
          if (part < 1.5) transformed.yz = turnYZ(transformed.yz, uNeck.xy, lift * along);
          else { transformed.yz = turnYZ(transformed.yz, uNeck.zw, 0.42 * up - 0.10 * walk * (1.0 - up)); transformed.yz = turnYZ(transformed.yz, uNeck.xy, lift); }   // the head stays level as it rises
          if (part > 6.5) transformed *= step(0.5, aDeer.w);                // antlers only for the stag
        }
        transformed.y += 0.03 * sin(2.0 * ph) * walk;`,
      // A leg is a fifth of a pixel wide at 170 m: each part is laid on `bold` pixels thicker all round (never more than 0.22 m),
      // so that it is drawn as a faint line and not as a row of dots.
      vertexWorld: 'float nl = length(wn); if (nl > 1e-6) wp.xyz += wn / nl * min(uBold * distance(wp.xyz, uCameraPos), 0.22);',
      albedo: 'if (!(dot(N, N) > 0.25)) N = vec3(0.0, 1.0, 0.0);',        // (a point where normals cancel must not become a pixel that is not a number: crisp, nothing would brush it away)
      fragmentPars: 'uniform vec3 uMist; uniform float uFlat, uAir, uVeilK;',
      light: 'c = mix(c, albedo, uFlat);',
      // (they are spared part of the realm's AIR, never the veil between two realms: that is fog too, and takes them whole)
      fog: 'fog = max(fog * mix(uAir, 1.0, uVeilK), uMist.z * (1.0 - smoothstep(uMist.x, uMist.y, vWPos.y)));',
    },
  });
  const mesh = new THREE.InstancedMesh(geo, material, n);
  mesh.name = 'far deer x' + n;
  const data = new Float32Array(n * 4), attr = new THREE.InstancedBufferAttribute(data, 4);
  attr.setUsage(THREE.DynamicDrawUsage); mesh.geometry = geo.clone(); mesh.geometry.setAttribute('aDeer', attr);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  (o.parent || ctx.group).add(mesh);

  // ---- the herd: where each is along the line, and a few numbers that ease
  const antlered = (i) => (o.stag === 'last' ? i === n - 1 : o.stag === 'first' ? i === 0 : o.stag === 'none' ? false : i === o.stag);
  const deer = [], positions = [];
  let back = 0;
  for (let i = 0; i < n; i++) {
    if (i) back += o.gaps[0] + (o.gaps[1] - o.gaps[0]) * (0.15 + 0.85 * rnd()) * (0.6 + 0.4 * rnd());
    const stagI = antlered(i);
    deer.push({ back, s: 0, phase: rnd(), walk: 1, head: 0, headV: 0, headTo: 0, headT: 0, headWait: 0, headAmt: 1, stopT: 0, stopWait: -1, stopFor: 0, nextStop: 8 + rnd() * 30,
      size: (stagI ? 1.08 : 0.86 + rnd() * 0.14) * o.scale, pace: 0.94 + rnd() * 0.12, stag: stagI ? 1 : 0 });
    positions.push(new THREE.Vector3());
  }
  const H = { lead: o.lead, walking: true, haltT: 0, nextWatch: o.watch > 0 ? o.watch * (0.4 + 0.6 * rnd()) : Infinity };
  for (const d of deer) d.s = H.lead - d.back;
  const _pos = new THREE.Vector3(), _scl = new THREE.Vector3(), _quat = new THREE.Quaternion().setFromAxisAngle(UP, heading);
  function write() {
    let cx = 0, cz = 0;
    for (let i = 0; i < n; i++) {
      const d = deer[i], x = A.x + dx * d.s, z = A.z + dz * d.s;
      positions[i].set(x, ground(x, z), z);
      _m.compose(_pos.copy(positions[i]), _quat, _scl.setScalar(d.size)); mesh.setMatrixAt(i, _m);
      data[i * 4] = d.phase; data[i * 4 + 1] = d.walk; data[i * 4 + 2] = d.head; data[i * 4 + 3] = d.stag;
      cx += x / n; cz += z / n;
    }
    mesh.instanceMatrix.needsUpdate = true; attr.needsUpdate = true;
    if (!mesh.boundingSphere) mesh.boundingSphere = new THREE.Sphere();
    mesh.boundingSphere.center.set(cx, positions[0].y + 1, cz); mesh.boundingSphere.radius = deer[n - 1].back * 0.6 + Math.abs(deer[0].s - deer[n - 1].s) * 0.5 + 6;
  }
  /** A head comes up `delay` seconds from now, by `amount` (0..1), and stays up `seconds`. One already up only stays up longer. */
  const lift = (i, seconds, delay = 0, amount = 1) => {
    const d = deer[i];
    if (d.headT > 0 && d.headWait <= 0) { d.headT = Math.max(d.headT, seconds); return; }
    d.headT = seconds; d.headWait = delay; d.headAmt = amount;
  };
  const handle = {
    object: mesh, count: n, positions,
    get lead() { return deer[0].s; },
    get walking() { return H.walking; }, set walking(v) { H.walking = !!v; },
    // A sound reaches them all at once, but no two deer answer alike: each stops when it has heard it (the leader at once, the
    // rest within about a second, raggedly down the line), its head comes up a moment after it has stopped, as far as that deer
    // lifts it, and stays up for as long as that deer listens. Then the leader walks on, and the others as the way opens.
    halt(seconds = 3) {
      H.haltT = Math.max(H.haltT, seconds + n * 0.4 + 1.5);
      for (let i = 0; i < n; i++) {
        const d = deer[i], hears = i === 0 ? 0 : 0.11 * i + rnd() * 0.4, goes = seconds + (i === 0 ? 0 : 0.35 * i + rnd() * 0.8);
        d.stopWait = hears; d.stopFor = Math.max(0.5, goes - hears);
        lift(i, seconds * (0.6 + 0.4 * rnd()), hears + 0.1 + rnd() * 0.6, 0.7 + 0.3 * rnd());
      }
      return handle;
    },
    // (left alone: one head, and perhaps one or two of its neighbours after it. Never a wave down the whole line.)
    watch(from = Math.floor(rnd() * n)) {
      let t = 0;
      for (let k = 1 + Math.floor(rnd() * 2.6); k > 0; k--) { lift(clamp(from + (t > 0 ? Math.round((rnd() - 0.5) * 5) : 0), 0, n - 1), 1.8 + rnd() * 2.2, t, 0.55 + 0.45 * rnd()); t += 0.5 + rnd() * 1.6; }
      return handle;
    },
    place(metres) { for (const d of deer) { d.s = metres - d.back; } write(); return handle; },
  };
  function update(dt) {
    if (!(dt > 0)) return;
    dt = Math.min(dt, 0.1);
    { const eng = ctx.engine, cam = eng.camera; uBold.value = o.bold > 0 && cam ? (SOLID ? Math.max(0.4, o.bold) : o.bold) * 2 * Math.tan(cam.fov * RAD / 2) / Math.max(1, (eng.height || 900) * (eng.pixelRatio || 1)) : 0; }
    H.haltT = Math.max(0, H.haltT - dt);
    if (o.watch > 0 && H.walking && H.haltT <= 0 && (H.nextWatch -= dt) <= 0) { H.nextWatch = o.watch * (0.7 + 0.6 * rnd()); handle.watch(); }
    for (let i = 0; i < n; i++) {
      const d = deer[i];
      if (d.stopWait >= 0 && (d.stopWait -= dt) < 0) d.stopT = Math.max(d.stopT, d.stopFor);       // it has heard it
      if (o.stops && H.walking && H.haltT <= 0 && (d.nextStop -= dt) <= 0) { d.nextStop = 18 + rnd() * 34; d.stopT = 2 + rnd() * 2; lift(i, d.stopT * 0.7, 0.35, 0.6 + 0.4 * rnd()); }
      d.stopT = Math.max(0, d.stopT - dt);
      // it walks unless it has stopped, has reached the end, or has come up too close behind the one ahead
      let go = H.walking && d.stopT <= 0 ? 1 : 0;
      if (i > 0) { const gap = deer[i - 1].s - d.s; go *= smooth(2.3, 3.2, gap); }
      if (o.end === 'stop' && i === 0 && d.s > len - 2) go *= smooth(len, len - 2, d.s);
      d.walk = ease(d.walk, go, dt, go > d.walk ? 0.7 : 0.5);
      const v = o.speed * d.pace * d.walk;
      d.s += v * dt; d.phase = (d.phase + v * dt / (DEER.stride * d.size)) % 1;
      if (d.headT > 0) { if (d.headWait > 0) d.headWait -= dt; else d.headT -= dt; }
      d.headTo = d.headT > 0 && d.headWait <= 0 ? d.headAmt : 0;
      // (a head has weight: it gathers way and settles, up in about a second, down more slowly; it does not start at full speed)
      const w = d.headTo > d.head ? 4.4 : 2.8;
      d.headV += ((d.headTo - d.head) * w * w - 2 * w * d.headV) * dt; d.head = clamp(d.head + d.headV * dt, 0, 1);
    }
    if (o.end === 'wrap' && deer[n - 1].s > len) { const shift = deer[0].s + 4; for (const d of deer) d.s -= shift; }
    write();
  }
  write();
  ctx.onUpdate(update);
  return handle;
}
