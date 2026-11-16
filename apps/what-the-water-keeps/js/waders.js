// Waders: the large wading birds of the ride (grey heron, great egret; any species built on the shared wader skeleton
// of tools/blender_lib/qc_bird.py can be registered). The page for area builders is docs/life/waders.md.
//
//   import { makeWader } from '../engine/life/waders.js';
//   const egret = await makeWader(ctx, { species: 'egret', seed: 3, flush: 14, flushSlow: 10,
//     stations: [{ at: [48.5, 19], face: 'channel', depth: 0.12 }, { at: [163, 14.5], y: 0.35, dry: true }] });
//   ctx.stage.cue('trunk', { s: 40 }, () => egret.do('step', 'step', 'strike'));
//
// A bird has a slow private life (it stands, turns its head slowly aside and back, never toward the boat; walks a step
// or two, reaches and holds, strikes, preens, on a schedule of its own drawn from its seed), leaves without looking at
// the boat when the boat comes within its flush distance,
// flies a path with banking at a real heron's speed, and lands where the area names. The clips carry the travel on
// the ground (root motion: a stalking step, the leap of a take-off, the run-out of a landing) and this file moves the
// bird by it, so feet do not slide; it writes a ring on the water where a foot comes down, where the bill goes in and
// where a wingtip touches, and tells the realm (onTouch, onEvent) so that it can add a sound.
import * as THREE from 'three';

const SPECIES = {
  heron: { file: 'models/life/heron.glb', centre: 0.52, speed: 10.5, height: [2.5, 5.5], climb: 1.15, depth: 0.2 },
  egret: { file: 'models/life/egret.glb', centre: 0.54, speed: 9.0, height: [1.3, 2.5], climb: 1.15, depth: 0.12 },
};
/**
 * Add a species built on the wader skeleton (a flamingo, say): { file, centre (height of the middle of its body over
 * its feet, metres), speed (cruising, m/s), height [lo, hi] (of its body over the water in flight), climb (how much
 * quicker than cruising it beats as it climbs away), depth (water it likes to stand in) }.
 */
export function registerWader(name, spec) { SPECIES[name] = { centre: 0.5, speed: 9, height: [1.5, 3], climb: 1.15, depth: 0.12, ...spec }; }

const TAU = Math.PI * 2, G = 9.81;
const ACC = 2.3;        // m/s2 it gathers speed at after the leap. A heron is three or four seconds reaching its pace: at 3.2 it was gone like a pigeon
// A walk. Each step clip begins and ends with the feet together (so that anything can follow it); two steps played end
// to end are therefore a shuffle: step, close, step, close. When another step is to follow, this one is LEFT at 0.80
// of its length (the foot coming up from behind is in the air, a hand short of the standing foot) and the next, led by
// that same foot, is ENTERED at 0.12 of its length (that foot in the air, just lifted): the foot passes the standing
// foot without being set down, and the body is carried on over the standing foot by what both clips say (fuseTravel).
const STEP_OUT = 0.80, STEP_IN = 0.12, STEP_FADE = 0.25;
const isStep = (n) => n === 'step' || n === 'step_r';
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a || 1e-9), 0, 1); return t * t * (3 - 2 * t); };
const wrap = (a) => { a = (a + Math.PI) % TAU; return (a < 0 ? a + TAU : a) - Math.PI; };
const _v = new THREE.Vector3(), _v2 = new THREE.Vector3(), _v3 = new THREE.Vector3(), _e = new THREE.Euler(0, 0, 0, 'YXZ'), _up = new THREE.Vector3(0, 1, 0);

// ---------------------------------------------------------------------------------------------------- thin parts
// The painter's filter takes out whatever is thinner than its brush (about five pixels): at 14 m that is the bill, the
// legs and the neck; at 29 m it is the whole bird, which was left a pale smudge. So every part of the bird marks
// itself in the picture's alpha (the engine's `crisp`, src/engine/gouache.js) BY ITS SIZE IN THE PICTURE: a part
// thinner than the brush is left as drawn, at its true thickness; a part more than twice as thick is painted like
// everything else; between the two it is partly both, so nothing changes at a line as the boat comes nearer.
// Each point of the model carries the thickness, in metres, of the part it belongs to (`aThin`, worked out once a file
// from the bones: a bill 1 cm, a shin 1.3 cm, the neck 3 to 8, the trunk 14). Wings, tail and plumes are two things:
// folded on a standing bird they are part of its mass (and are painted with it: left as drawn, every gap between two
// feathers is a dark pixel that comes and goes); spread in the air they are blades, a hand wide and often edge on.
// Their points carry the blade's width as a negative number, and the bird says which it is now (uOpen).
// The EYES are never left as drawn (their points say 1 m): a dark dot a third of a pixel across, kept, is a speck on a
// far bird seen from the side, and two specks on one that faces the boat: a face. Painted, they are gone beyond 10 m.
const THIN = { value: new THREE.Vector4(935, 5, 9, 0.85) };   // pixels to a metre at 1 m (at 1080 lines: the brush is given so); thinner than y pixels = left as drawn; thicker than z = painted; w = the least width of a limb, pixels
// A part that is left as drawn is also LIT AS ONE TOUCH: its normal is turned toward the eye, so the whole of it takes
// one step of the light (lit if the rider is on the light's side of it, shaded if it stands against the light: a far
// heron against the sun is a dark shape, as it should be). Lit facet by facet, a body four pixels across is a scatter
// of light and dark specks, which the filter used to smooth away and no longer does once the part is left as drawn.
// And a limb is never drawn much thinner than a pixel (legs, toes, the bill: parts under 3.5 cm are swollen along
// their normals to 0.85 of a pixel across; 1.25 at low quality, which has no anti-aliasing): at 26 m a leg is a third
// of a pixel, which the anti-aliasing turns into a row of dots, the ankle knots darkest: two specks hanging under the
// bird. Inside 14 m a leg is its true thickness.
const THIN_EXT = {
  vertexPars: 'attribute float aThin; uniform float uOpen; uniform vec4 uThinPx; centroid varying float vThin;',
  vertexLocal: 'vThin = aThin < 0.0 ? mix(0.14, -aThin, uOpen) : aThin;',
  vertexWorld: 'if (aThin > 0.0 && aThin < 0.035) wp.xyz += normalize(wn) * max(0.0, uThinPx.w * distance(wp.xyz, uCameraPos) / uThinPx.x - aThin) * 0.5;',
  fragmentPars: 'centroid varying float vThin; uniform vec4 uThinPx; float kThin;',
  albedo: `kThin = 1.0 - smoothstep(uThinPx.y, uThinPx.z, vThin * uThinPx.x / max(length(vViewPos), 0.1));
      N = normalize(mix(N, normalize(uCameraPos - vWPos), 0.92 * kThin));`,
  final: 'if (kThin > 0.0) gl_FragColor.a = kThin > 0.995 ? -15.0 : 0.5 - 1.55 * kThin;',
};
// THE STRAY PIXEL (a black dot on a far bird's head, under its body, "inside the neck's loop"; or one pale blue-green
// pixel where its bill meets its head: the first was taken for a fault of the painter's filter). It is in the picture
// before any filter. A triangle much smaller than a pixel (an eye at 26 m is a third of a pixel, a facet of it a
// twentieth; the bill's tip a fifth) is shaded at the pixel's centre, which lies far OUTSIDE the triangle, so its
// paint is carried on past its corners. Carried on from near-black, it comes out below nothing: the light on it is
// negative and the tone curve makes of that a pixel that is not a number: pure black, or purple, coming and going
// with the angle. Carried on from the bill's orange through the head's grey, it comes out the colour opposite the
// orange: a pale blue-green pixel, on the bird or in its reflection. So the birds' paint is read INSIDE the triangle
// (a `centroid` varying of their own, vInk, in place of three.js's vColor, which is read at the pixel's centre), and is
// never less than nothing. (The same is true of every vertex-painted model seen small: src/engine/gouache.js should
// do both itself: docs/life/waders.md, "Thin parts and far birds".)
// And where a normal comes out with next to no length (across a face whose corners' normals point opposite ways: the
// crease of a neck folded right back on itself) it is turned toward the eye and not left to chance.
const GUARD_EXT = {
  vertexPars: `#ifdef USE_COLOR
      centroid varying vec3 vInk;
    #endif`,
  vertexWorld: `if (!(dot(wn, wn) > 1e-6)) wn = uCameraPos - wp.xyz;
    #ifdef USE_COLOR
      vInk = vColor.rgb;
    #endif`,
  fragmentPars: `#ifdef USE_COLOR
      centroid varying vec3 vInk;
    #endif`,
  albedo: `#if defined(USE_COLOR) && !defined(USE_MAP_UV) && !defined(USE_MAP_TRI)
      albedo = uColor * clamp(vInk, 0.0, 1.0);
    #endif
    albedo = max(albedo, vec3(0.0));
      { float nl = dot(vWNormal, vWNormal); vec3 toEye = normalize(uCameraPos - vWPos);
        N = nl > 1e-3 ? normalize(mix(toEye, N, smoothstep(0.0, 0.3, nl))) : toEye; }`,
};
const thinDone = new WeakSet();
function thinAttribute(mesh) {
  const g = mesh.geometry;
  if (thinDone.has(g) || !g.attributes.skinIndex) return;
  thinDone.add(g);
  const pos = g.attributes.position, si = g.attributes.skinIndex, sw = g.attributes.skinWeight, sk = mesh.skeleton, n = pos.count, out = new Float32Array(n);
  const org = [], dir = [], kind = [], m = new THREE.Matrix4(), p = new THREE.Vector3();
  for (let b = 0; b < sk.bones.length; b++) {
    m.copy(sk.boneInverses[b]).invert();                    // where the bone lay when the skin was bound: its head, and its own line (a bone points along its +Y)
    org.push(new THREE.Vector3().setFromMatrixPosition(m)); dir.push(new THREE.Vector3(0, 1, 0).transformDirection(m));
    const nm = sk.bones[b].name;
    kind.push(/^eye/.test(nm) ? 1 : /^(wing|ter_|sec_|pri_|tip_wing)/.test(nm) ? -0.07 : /^(plume|tail)/.test(nm) ? -0.05 : /^(foot|toe|hallux)/.test(nm) ? 0.009
      : /^(neck|head|tip_bill|shin|tarsus)/.test(nm) ? 9 : 0.14);           // 9: a limb, as thick as twice a point's distance from its bone's line
  }
  for (let i = 0; i < n; i++) {
    let best = 0, w = -1;
    for (let j = 0; j < 4; j++) { const wj = sw.getComponent(i, j); if (wj > w) { w = wj; best = si.getComponent(i, j); } }
    let t = kind[best];
    if (t === 9) { p.fromBufferAttribute(pos, i).applyMatrix4(mesh.bindMatrix).sub(org[best]); t = clamp(2 * p.addScaledVector(dir[best], -p.dot(dir[best])).length(), 0.006, 0.14); }
    out[i] = t;
  }
  g.setAttribute('aThin', new THREE.BufferAttribute(out, 1));
}

// ---------------------------------------------------------------------------------------------------- clips
// A file's clips are trimmed once: tracks that never leave the rest pose are dropped (two thirds of them), and the
// root's place is taken out and kept as a table: the TRAVEL, which moves the bird itself and is never blended.
const trimmed = new WeakMap();
function prepare(handle) {
  const first = handle.actions[handle.clips[0]].getClip();
  if (trimmed.has(first)) return trimmed.get(first);
  const rest = {};
  for (const [name, b] of Object.entries(handle.bones)) rest[name] = { position: b.position.toArray(), quaternion: b.quaternion.toArray(), scale: b.scale.toArray() };
  const out = { clips: {}, travel: {} };
  for (const name of handle.clips) {
    const clip = handle.actions[name].getClip(), keep = [];
    for (const tr of clip.tracks) {
      const dot = tr.name.lastIndexOf('.'), bone = tr.name.slice(0, dot), prop = tr.name.slice(dot + 1), n = tr.getValueSize(), v = tr.values;
      if (bone === 'root' && prop === 'position') { out.travel[name] = travelTable(tr, clip.duration); continue; }
      const r = rest[bone] && rest[bone][prop];
      let still = !!r;
      for (let k = 0; still && k < v.length; k += n) {
        if (prop === 'quaternion') still = Math.abs(v[k] * r[0] + v[k + 1] * r[1] + v[k + 2] * r[2] + v[k + 3] * r[3]) > 0.9999995;
        else for (let i = 0; i < n; i++) if (Math.abs(v[k + i] - r[i]) > 1e-4) still = false;
      }
      if (!still) keep.push(tr);
    }
    out.clips[name] = new THREE.AnimationClip(name, clip.duration, keep);
  }
  trimmed.set(first, out);
  return out;
}
function travelTable(track, duration) {
  const t = track.times, v = track.values, n = t.length;
  const moved = (i, j) => Math.hypot(v[j * 3] - v[i * 3], v[j * 3 + 1] - v[i * 3 + 1], v[j * 3 + 2] - v[i * 3 + 2]) > 1e-6;
  let start = 0, end = n - 1;
  while (start < n - 1 && !moved(start, start + 1)) start++;
  while (end > 0 && !moved(end - 1, end)) end--;
  const vel = (i, j) => { const dt = Math.max(1e-6, t[j] - t[i]); return new THREE.Vector3((v[j * 3] - v[i * 3]) / dt, (v[j * 3 + 1] - v[i * 3 + 1]) / dt, (v[j * 3 + 2] - v[i * 3 + 2]) / dt); };
  const moving = end > start;
  return {
    duration,
    total: new THREE.Vector3(v[(n - 1) * 3] - v[0], v[(n - 1) * 3 + 1] - v[1], v[(n - 1) * 3 + 2] - v[2]),      // where the clip leaves the bird
    tStart: moving ? t[start] : 0, tEnd: moving ? t[end] : 0,                                                    // when the travel begins and ends
    vStart: moving ? vel(start, start + 1) : new THREE.Vector3(), vEnd: moving ? vel(end - 1, end) : new THREE.Vector3(),
    at(time, out) {
      if (time <= t[0]) return out.set(v[0], v[1], v[2]);
      if (time >= t[n - 1]) return out.set(v[(n - 1) * 3], v[(n - 1) * 3 + 1], v[(n - 1) * 3 + 2]);
      let i = Math.min(n - 2, Math.max(0, Math.floor((time - t[0]) / (t[1] - t[0]))));
      while (i > 0 && t[i] > time) i--;
      while (i < n - 2 && t[i + 1] < time) i++;
      const k = (time - t[i]) / (t[i + 1] - t[i]), a = i * 3;
      return out.set(v[a] + (v[a + 3] - v[a]) * k, v[a + 1] + (v[a + 4] - v[a + 1]) * k, v[a + 2] + (v[a + 5] - v[a + 2]) * k);
    },
  };
}

// ---------------------------------------------------------------------------------------------------- a flight path
/** A smooth path through points, with the directions it leaves and arrives in; measured by arc length. */
function flightPath(points, dirIn, dirOut) {
  const n = points.length, tan = [];
  for (let i = 0; i < n; i++) {
    // the ends are short-handled: it leaves the leap's steep climb, and comes into the landing's steep descent, within a few metres
    if (i === 0) tan.push(dirIn.clone().multiplyScalar(Math.min(5, points[0].distanceTo(points[1]) * 0.9)));
    else if (i === n - 1) tan.push(dirOut.clone().multiplyScalar(Math.min(6, points[n - 1].distanceTo(points[n - 2]) * 0.9)));
    else tan.push(points[i + 1].clone().sub(points[i - 1]).multiplyScalar(0.5));
  }
  const P = [], S = [0], STEPS = 24;
  for (let i = 0; i < n - 1; i++) for (let j = i === 0 ? 0 : 1; j <= STEPS; j++) {
    const t = j / STEPS, t2 = t * t, t3 = t2 * t;
    const p = points[i].clone().multiplyScalar(2 * t3 - 3 * t2 + 1).addScaledVector(tan[i], t3 - 2 * t2 + t).addScaledVector(points[i + 1], -2 * t3 + 3 * t2).addScaledVector(tan[i + 1], t3 - t2);
    if (P.length) S.push(S[S.length - 1] + p.distanceTo(P[P.length - 1]));
    P.push(p);
  }
  const length = S[S.length - 1];
  let hint = 0;
  const at = (s, out) => {
    s = clamp(s, 0, length);
    while (hint > 0 && S[hint] > s) hint--;
    while (hint < S.length - 2 && S[hint + 1] < s) hint++;
    return out.copy(P[hint]).lerp(P[hint + 1], (s - S[hint]) / Math.max(1e-9, S[hint + 1] - S[hint]));
  };
  const a = new THREE.Vector3(), b = new THREE.Vector3();
  return {
    length, at,
    /** unit direction of travel at s */
    dir(s, out) { at(s - 0.4, a); at(s + 0.4, b); return out.copy(b).sub(a).normalize(); },
    /** how fast the heading turns at s, radians a metre (+ = to the bird's left) */
    turn(s) { const d = 1.5; at(s - d, a); at(s, b); const h0 = Math.atan2(b.x - a.x, b.z - a.z); at(s + d, a); return wrap(Math.atan2(a.x - b.x, a.z - b.z) - h0) / d; },
  };
}

// ---------------------------------------------------------------------------------------------------- the bird
/**
 * A wader. options:
 *   species        'heron' | 'egret' (or one registered with registerWader)
 *   seed           its own schedule, wanderings and choices (ctx.rng): the same seed, the same life
 *   stations       [{ at: [s, d] | position: [x, y, z], face, depth, dry, y, roam }, ...]: where it may stand, in ride order;
 *                  it starts on the first. Or give one place directly: at / position, face, depth, dry, y, roam.
 *                  (bird.stations[i] is what became of each: { position: Vector3, heading, s, d, dry, depth, roam })
 *                    face    which way it looks: 'channel' | 'back' | 'along' | radians (kit.faceAngle); turn adds to it.
 *                            Flying in, it lands the way it comes (bent toward this by up to 45 degrees) and then
 *                            turns to it on its feet
 *                    flush, flushSlow   this place's own flush distances (0 = here it lets the boat pass)
 *                    depth   metres of water it stands in (default: the species'; never more than 0.3): its feet are
 *                            that far under the surface
 *                    dry     true = a perch or dry ground at height y (a wall top, a plank, a bough): it does not
 *                            stalk or strike there
 *                    roam    metres it may wander from the place by stalking (default 1.2 in water, 0 when dry)
 *   life           { every: [12, 20], actions: { step: 2, reach: 1, strike: 1, preen: 2, alert: 1, shift: 0, stretch: 0, hunch: 0 } }:
 *                  seconds between doing something, and how often each thing is chosen; false = it only stands
 *                  (and does what cues tell it: do()). `hunch` changes its way of standing, there and back. A bird that
 *                  stands hunched does all of these out of its hunch and returns to it
 *   idle           'stand' (the neck up in its S: the default) or 'hunch' (the neck folded down, the head on the shoulders)
 *   gaze           false = its head is never turned aside while it stands (it is, slowly, by default: away from the boat)
 *   flush          metres at which it leaves (0 = never).  flushSlow: the same when the boat moves slower than 1 m/s
 *   clear          metres from the boat a station must be to be flown to (30)
 *   exit           [x, y, z] where it goes when no station is left (then it is gone); default: straight away from the boat
 *   speed, height  cruising speed (m/s) and the height band of its body over the water [lo, hi]
 *   keepOut        metres its body keeps from the rider's eye whatever its path says (3; never less than 1.6; half as
 *                  much again with reduced motion)
 *   ripples        false = write nothing on the water (the snow's memory birds)
 *   marks          how hard each touch marks the water: { step: 0.15, strike: 0.4, wingtip: 0.3, leap: 0.5, land: 0.6 };
 *                  a pair is [strength, radius in metres]: { strike: [0.7, 0.5] } (radii otherwise 0.22, 0.35, 0.3, 0.4, 0.45)
 *   onTouch(x, z, kind, strength)   something touched the water: 'step' | 'strike' | 'wingtip' | 'leap' | 'land'
 *   onEvent(name, bird)             'flush' | 'leap' | 'land' | 'settled' | 'gone' | 'act:<name>' (for sound)
 *   only           'mirror' | 'direct' (ctx.only);  scale;  optional: true = left out at low quality
 *   parent         a group of the realm's to put it in (default: the realm). The group must stay where it is, unturned
 *                  and unscaled: every place given to a bird and told by it is the realm's own
 *   material       gouache options for its paint (color as a tint, rim, brush, ...). crisp: true leaves the whole bird
 *                  as drawn by the painter's filter at any distance, false paints all of it; left out (the default),
 *                  each part is left as drawn or painted by its size in the picture (see "thin parts" above)
 * Resolves to the bird: see the object at the end of this function.
 */
export async function makeWader(ctx, options = {}) {
  const sp = SPECIES[options.species || 'egret'];
  if (!sp) throw new Error(`makeWader: no species called '${options.species}'`);
  if (options.optional && (ctx.quality.density || 1) < 0.7) return absent(options);
  const calm = !!ctx.reducedMotion;
  const o = { seed: 1, flush: 0, clear: 30, keepOut: 3, ripples: true, scale: 1, ...options };
  const rnd = ctx.rng(o.seed * 7919 + 13), kit = ctx.kit, water = ctx.water;
  const life = o.life === false ? null : { every: [12, 20], ...(o.life || {}), actions: { step: 2, reach: 1, strike: 1, preen: 2, alert: 1, shift: 0, stretch: 0, hunch: 0, ...((o.life && o.life.actions) || {}) } };
  const paint = { brush: 0.5, ...(o.material || {}) };
  const bySize = paint.crisp === undefined;                                   // (material.crisp: true = the whole bird left as drawn at any distance; false = all of it painted)
  const open = { value: 0 };                                                  // 0 = wings folded (part of its mass) .. 1 = spread (blades): see THIN_EXT
  paint.extend = [].concat(GUARD_EXT, paint.extend || [], bySize ? { ...THIN_EXT, uniforms: { uThinPx: THIN, uOpen: open } } : []);      // (the guard first: what a realm adds to the paint comes after it)
  const h = await kit.animated(sp.file, { name: o.name || o.species || 'egret', ...paint });
  const g = h.group;
  if (bySize) g.traverse((m) => { if (m.isSkinnedMesh) thinAttribute(m); });
  if (o.parent) o.parent.add(g);                                              // (a group of the realm's, to hide or mask a whole zone by; places stay the realm's own)
  g.rotation.order = 'YXZ'; g.scale.setScalar(o.scale);
  for (const b of Object.values(h.bones)) b.matrixAutoUpdate = true;          // this file runs the mixer itself (kit.animated's own play() is not used)
  if (o.only) ctx.only(g, o.only);
  const { clips, travel } = prepare(h), mixer = h.mixer, acts = {};
  for (const name of h.clips) mixer.uncacheClip(h.actions[name].getClip());  // the untrimmed clips are not needed on this copy
  for (const name in clips) acts[name] = mixer.clipAction(clips[name]);
  const dur = (name) => clips[name].duration;
  const cy = sp.centre * o.scale;                                             // the middle of its body over the point between its feet

  // ---- places
  function station(s) {
    const st = { face: s.face ?? 'channel', dry: !!s.dry, depth: s.dry ? 0 : Math.min(0.3, s.depth ?? sp.depth), roam: s.roam ?? (s.dry ? 0 : 1.2),
      flush: s === o ? undefined : s.flush, flushSlow: s === o ? undefined : s.flushSlow };
    const p = new THREE.Vector3();
    let y = s.y;
    if (s.at) { kit.at(s.at[0], s.at[1] ?? 0, 0, p); st.s = s.at[0]; st.d = s.at[1] ?? 0; }
    else if (s.position) {
      p.set(s.position[0], 0, s.position[2]);
      if (st.dry) y = y ?? s.position[1]; else if (s.depth == null) st.depth = clamp(-s.position[1], 0, 0.3);
    }
    p.y = st.dry ? (y ?? 0) : -st.depth;
    if (st.s == null) { const loc = ctx.path.locate(p.x, p.z, null, {}); st.s = loc.s; st.d = loc.d; }       // every station knows where it lies along the route (s) and to which side (d)
    st.heading = kit.faceAngle(st.face, st.s ?? 0, st.d ?? 0) + (s.turn || 0);
    st.position = p;
    return st;
  }
  const stations = (o.stations || [o]).map(station);

  // ---- state
  const pos = new THREE.Vector3();                                            // the point between its feet (in flight: the same point, under its body)
  const S = {
    state: 'stand', station: 0, clock: 0, heading: 0, bank: 0, pitch: 0, cur: null, curName: '', last: new THREE.Vector3(), queue: [], nextAt: 0,
    hold: 0, after: null, flight: null, pending: null, home: new THREE.Vector3(), turn: 0, turned: 0, debt: 0, turnAt: 0, tries: 0, visible: true, skip: 0, held: 0, carried: null,
    idle: o.idle === 'hunch' ? 'hunch' : 'stand', lead: 'step', fuse: null,
  };
  const marks = ['tip_bill', 'foot_L', 'foot_R', 'tip_wing_L', 'tip_wing_R'].map((name) => ({ name, bone: h.bones[name], p: new THREE.Vector3(), y: null, up: false }));
  const emit = (name) => { if (o.onEvent) { try { o.onEvent(name, bird); } catch (err) { console.error(err); } } };
  const touch = (x, z, kind, strength, radius) => {
    if (o.ripples && strength > 0) water.ripple(x, z, strength, radius);
    if (o.onTouch) { try { o.onTouch(x, z, kind, strength); } catch (err) { console.error(err); } }
  };

  // ---- clips: play, cross-fade, and move the bird by the clip's travel
  function play(name, { fade = 0.25, loop = false, time = 0, speed = 1 } = {}) {
    const a = acts[name];
    if (!a) { console.error(`INVALID_CLIP waders: ${sp.file} has no clip "${name}"`); return null; }
    const prev = S.cur;
    a.reset(); a.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, Infinity); a.clampWhenFinished = true; a.enabled = true;
    a.setEffectiveTimeScale(speed); a.setEffectiveWeight(1); a.time = time; a.play();
    if (prev && prev !== a) { if (fade > 0) a.crossFadeFrom(prev, fade, false); else prev.stop(); }
    S.cur = a; S.curName = name; S.fuse = null;
    if (travel[name]) travel[name].at(time, S.last); else S.last.set(0, 0, 0);
    return a;
  }
  const done = () => !!S.cur && S.cur.loop === THREE.LoopOnce && S.cur.paused;        // a clip played once has reached its end
  function carryBy(v) {                                                 // move the bird by a displacement given in its own frame (a clip's travel)
    if (v.lengthSq() === 0) return;
    const c = Math.cos(S.heading), s = Math.sin(S.heading), k = o.scale;
    pos.x += (v.x * c + v.z * s) * k; pos.z += (-v.x * s + v.z * c) * k; pos.y += v.y * k;
  }
  function applyTravel() {
    const tb = travel[S.curName];
    if (!tb) return;
    tb.at(S.cur.time, _v);
    _v2.copy(_v).sub(S.last); S.last.copy(_v);
    carryBy(_v2);
  }
  // Between two steps of a walk the pose is a mix of both clips, and so is the place of the body over the standing
  // foot: in the step being left it is (that clip's travel so far) - (its whole travel) from the foot, in the step
  // being entered it is that clip's travel so far. Mixed by the same weight as the poses, the standing foot stays put.
  function fuseTravel() {
    const F = S.fuse, w = clamp(S.cur.getEffectiveWeight(), 0, 1);
    F.A.at(F.a.time, _v).sub(F.A.total).multiplyScalar(1 - w);
    F.B.at(S.cur.time, _v2); _v.addScaledVector(_v2, w);
    _v2.copy(_v).sub(F.last); F.last.copy(_v);
    carryBy(_v2);
    if (w >= 1) { F.B.at(S.cur.time, S.last); S.fuse = null; }
  }
  // The hunch (the neck folded back on itself) and every other pose are joined by two clips, `rise` and `sink`, and
  // never by a cross-fade: from the fold to an open neck one joint has more than half a turn to go, a cross-fade takes
  // it the short way round, which is the wrong way, and the head goes down, round behind the neck and up over the top.
  const hunched = () => S.curName === 'hunch' || S.curName === 'sink';
  const idle = (fade) => {
    let name = acts[S.idle] ? S.idle : 'stand';
    if (name === 'hunch' && S.debt) name = 'stand';                         // it still has to turn on its feet: it does not settle into its hunch between two steps
    if (name === 'hunch' && fade > 0 && acts.sink && S.cur && !hunched()) { S.state = 'act'; S.after = null; return play('sink', { fade: Math.min(fade, 0.35) }); }
    return play(name, { fade, loop: true, time: rnd() * dur(name), speed: 0.92 + 0.16 * rnd() });
  };

  // ---- its own life on the ground
  const between = () => (life ? life.every[0] + rnd() * (life.every[1] - life.every[0]) : 1e9);
  function settle(i) {
    const st = stations[i];
    S.station = i; S.state = 'stand'; S.flight = null; S.pending = null; S.bank = 0; S.pitch = 0;
    pos.copy(st.position); S.heading = st.heading; S.home.copy(st.position);
    S.queue.length = 0; S.after = null; S.debt = 0; S.turn = 0;
    S.nextAt = S.clock + between() * (0.25 + 0.75 * rnd());
    idle(0);
    for (const m of marks) m.y = null;
  }
  function choose() {
    const st = stations[S.station], can = { step: !st.dry && st.roam >= 0.3, reach: !st.dry && st.depth >= 0.05, strike: !st.dry && st.depth >= 0.05, preen: true, alert: true, shift: true, stretch: true, hunch: true };
    let total = 0;
    const ok = (k) => can[k] && acts[k];
    for (const k in life.actions) if (ok(k)) total += life.actions[k];
    if (!(total > 0)) return null;
    let r = rnd() * total;
    for (const k in life.actions) if (ok(k)) { r -= life.actions[k]; if (r <= 0) return k; }
    return null;
  }
  function stepTurn(st) {
    // it turns toward somewhere inside its beat: the turn is made about whichever foot is on the ground
    const a = rnd() * TAU, r = Math.sqrt(rnd()) * st.roam, far = Math.hypot(pos.x - S.home.x, pos.z - S.home.z) > st.roam * 0.7;
    const want = Math.atan2((far ? S.home.x : S.home.x + Math.cos(a) * r) - pos.x, (far ? S.home.z : S.home.z + Math.sin(a) * r) - pos.z);
    S.turn = S.debt ? clamp(S.debt, -0.45, 0.45) : clamp(wrap(want - S.heading), -0.4, 0.4); S.turned = 0;
  }
  function walkOn() {                                                   // the next step of a walk, joined to this one (see STEP_OUT)
    const from = S.cur, A = travel[S.curName], clip = S.curName === 'step' ? 'step_r' : 'step';
    const F = { a: from, A, B: travel[clip], last: new THREE.Vector3() };
    A.at(from.time, F.last).sub(A.total);
    stepTurn(stations[S.station]);
    emit('act:step');
    play(clip, { fade: STEP_FADE, time: STEP_IN * dur(clip) });
    S.lead = clip === 'step' ? 'step_r' : 'step';
    S.fuse = F;
  }
  function begin(name) {
    const st = stations[S.station];
    if (name === 'hunch' || name === 'stand') {                         // the two ways of standing: change over (by `rise` or `sink`)
      if (S.idle === name) return false;
      S.idle = name; emit('act:' + name);
      if (name === 'stand' && hunched() && acts.rise) { S.state = 'act'; S.after = null; play('rise', { fade: 0.3 }); return true; }
      idle(0.35);
      return S.state === 'act';
    }
    if (!acts[name] || ((name === 'step' || name === 'reach' || name === 'strike') && st.dry)) return false;
    if (hunched() && acts.rise) {                                       // out of its hunch first; then what it was going to do
      S.queue.unshift(name); S.state = 'act'; S.after = null; play('rise', { fade: 0.3 });
      return true;
    }
    S.state = 'act'; S.after = null; S.hold = 0;
    emit('act:' + name);
    if (name === 'step') {
      stepTurn(st);
      const clip = S.lead === 'step_r' && acts.step_r ? 'step_r' : 'step';       // the feet take turns to lead
      S.lead = clip === 'step' ? 'step_r' : 'step';
      play(clip, { fade: 0.2 });
    } else if (name === 'reach') {
      play('reach', { fade: 0.25 });
      S.hold = 3 + rnd() * 3; S.after = rnd() < 0.55 ? 'strike' : 'withdraw';
    } else if (name === 'strike') {
      play('strike', { fade: 0.2, speed: calm ? 0.75 : 1 });
    } else {
      if (name === 'shift') { S.turn = clamp(S.debt, -0.45, 0.45); S.turned = 0; }    // resettling its feet, it turns what it still owes
      let clip = name;
      if (name === 'preen' && acts.preen_r) {                             // it preens over the shoulder AWAY from the boat (either, when the boat is far off):
        const boat = ctx.boat, dx = boat.x - pos.x, dz = boat.z - pos.z;  // the head goes round before the bill comes down, and must not go round toward the rider
        clip = (dx * dx + dz * dz < 2025 ? wrap(Math.atan2(dx, dz) - S.heading) > 0 : rnd() < 0.5) ? 'preen_r' : 'preen';
      }
      play(clip, { fade: 0.3 });
    }
    return true;
  }
  function ground(dt) {
    if (S.state === 'stand') {
      while (S.queue.length) if (begin(S.queue.shift())) return;
      // it landed the way it came: now it turns to face the way its place says, on its feet (stalking steps in water, a shuffle on a perch)
      if (S.debt && S.clock >= S.turnAt) {
        const st = stations[S.station], walk = !st.dry && st.roam >= 0.3 && acts.step;
        if (++S.tries > 8 || !begin(walk ? 'step' : 'shift')) { S.debt = 0; if (S.idle === 'hunch' && S.curName === 'stand') idle(0.35); }      // it turns no more: now it may sink into its hunch
        else S.turnAt = S.clock + dur(walk ? 'step' : 'shift') + 0.3 + rnd() * 0.9;
        return;
      }
      if (life && S.clock >= S.nextAt) {
        const k = choose();
        S.nextAt = S.clock + between();
        if (k === 'step' && rnd() < 0.45) S.queue.push('step');
        if (k === 'hunch') begin(S.idle === 'hunch' ? 'stand' : 'hunch'); else if (k) begin(k);
      }
      return;
    }
    // the held reach: stop at the AIM pose, wait, then strike from it (the two clips share that pose) or come back
    if (S.curName === 'reach' && S.after && S.cur.time >= 2.5) {
      if (S.hold > 0) { S.cur.setEffectiveTimeScale(0); S.hold -= dt; return; }
      if (S.after === 'strike' && acts.strike) { play('strike', { fade: 0.08, time: 0.5, speed: calm ? 0.75 : 1 }); emit('act:strike'); }
      else S.cur.setEffectiveTimeScale(1);
      S.after = null;
      return;
    }
    if (isStep(S.curName) && S.queue[0] === 'step' && !S.pending && !S.fuse && acts.step_r && travel.step && travel.step_r
      && S.cur.time >= STEP_OUT * dur(S.curName) && S.cur.getEffectiveTimeScale() === 1) { S.queue.shift(); walkOn(); return; }
    if (done()) {
      if (S.pending) return;                                            // it is about to leave: no settling
      S.state = 'stand';
      while (S.queue.length) if (begin(S.queue.shift())) return;
      idle(0.35);
    }
  }
  // a stalking step may turn the bird: about the foot that is on the ground, so nothing slides
  function turnOnFoot(dt) {
    const walk = isStep(S.curName);
    if ((!walk && S.curName !== 'shift') || !S.turn || S.turned === S.turn) return;
    const L = marks[1], R = marks[2], hl = L.p.y - pos.y, hr = R.p.y - pos.y, lift = (walk ? 0.03 : 0.012) * o.scale;
    const pivot = hl > lift && hr <= lift ? R : hr > lift && hl <= lift ? L : null;
    if (!pivot) return;
    let d = S.turn * dt / (walk ? 1.0 : 0.7);
    if (Math.abs(S.turned + d) >= Math.abs(S.turn)) d = S.turn - S.turned;                 // never more than was meant
    S.turned += d;
    if (S.debt) { S.debt -= d; if (Math.abs(S.debt) < 0.03) S.debt = 0; }
    const c = Math.cos(d), s = Math.sin(d), x = pos.x - pivot.p.x, z = pos.z - pivot.p.z;
    pos.x = pivot.p.x + x * c + z * s; pos.z = pivot.p.z - x * s + z * c; S.heading += d;
  }

  // ---- the gaze: while it stands, the head is turned slowly aside and back, at times of its own and NEVER toward the
  // boat. It is not in the clips (a turn baked into a loop comes round every eight seconds, always to the same side):
  // it is laid over whatever the clip does, as a turn about the upright axis shared along the neck, most of it near
  // the head (standing tall) or given to the head alone (hunched: the folded neck does not swing). Before the bird
  // does anything else the head comes back to the front, quickly and without a jolt.
  const rg = ctx.rng(o.seed * 104729 + 71);
  const gzBones = [];
  for (let i = 1; h.bones['neck' + i]; i++) gzBones.push(h.bones['neck' + i]);
  const gzN = gzBones.length;
  if (h.bones.head && h.bones.body && gzN && o.gaze !== false) gzBones.push(h.bones.head); else gzBones.length = 0;
  const gzChain = [];
  for (let p = h.bones.body; gzBones.length && p && p !== g; p = p.parent) gzChain.unshift(p);
  const GZ = { a: 0, v: 0, target: 0, next: 1.5 + rg() * 9, on: false, fold: o.idle === 'hunch' ? 1 : 0,
    base: gzBones.map(() => new THREE.Quaternion()), out: gzBones.map(() => new THREE.Quaternion()) };
  const _A = new THREE.Quaternion(), _Ai = new THREE.Quaternion(), _q = new THREE.Quaternion();
  function lookAside(boatNear, bearing) {
    const ahead = boatNear && Math.abs(bearing) < 0.6;                  // the boat is in front of it: straight ahead is then no place to look
    let side = rg() < 0.5 ? 1 : -1;
    if (boatNear && Math.abs(bearing) < 2.3) side = bearing > 0 ? -1 : 1;      // to the side the boat is not on
    if (Math.abs(GZ.target) > 0.05 && !ahead && rg() < 0.6) { GZ.target = 0; GZ.next = S.clock + 5 + rg() * 11; }
    else { GZ.target = side * (0.2 + rg() * 0.4); GZ.next = S.clock + 3 + rg() * 7; }
  }
  /** mode: 'life' (it looks about as it pleases), 'front' (the head comes back to the front), 'off' (at once). */
  function gaze(dt, mode) {
    if (!gzBones.length) return;
    if (mode === 'off') { GZ.a = 0; GZ.v = 0; GZ.target = 0; }
    else {
      if (mode === 'life') {
        const boat = ctx.boat, dx = boat.x - pos.x, dz = boat.z - pos.z, near = dx * dx + dz * dz < 2025;      // within 45 m
        const bearing = wrap(Math.atan2(dx, dz) - S.heading);           // where the boat is, seen from the bird: + is to its left
        const at = GZ.target * 1.3;                                     // where the bill will point
        if (S.clock >= GZ.next || (near && Math.abs(wrap(at - bearing)) < 0.6)) lookAside(near, bearing);
      } else GZ.target = 0;
      const w = mode === 'front' ? 8 : calm ? 2.4 : 3.2;                // a turn takes about a second and a half; the return before an action a third of one
      GZ.v += (w * w * (GZ.target - GZ.a) - 1.8 * w * GZ.v) * dt; GZ.a += GZ.v * dt;
      if (GZ.target === 0 && Math.abs(GZ.a) < 2e-4 && Math.abs(GZ.v) < 2e-3) { GZ.a = 0; GZ.v = 0; }
    }
    const folded = S.flight || S.carried ? 1 : (S.curName === 'hunch' || (S.state === 'stand' && S.idle === 'hunch')) ? 1 : 0;
    GZ.fold += (folded - GZ.fold) * Math.min(1, dt / 0.6);
    const active = GZ.a !== 0;
    if (!active && !GZ.on) return;
    // what the clip made of these bones this frame (a bone the mixer did not write still holds what was put there last time)
    for (let i = 0; i < gzBones.length; i++) if (!(GZ.on && gzBones[i].quaternion.equals(GZ.out[i]))) GZ.base[i].copy(gzBones[i].quaternion);
    if (!active) { for (let i = 0; i < gzBones.length; i++) gzBones[i].quaternion.copy(GZ.base[i]); GZ.on = false; return; }
    _A.identity();
    for (const p of gzChain) _A.multiply(p.quaternion);                 // how the trunk stands in the bird's own frame, in which up is +Y
    let before = 0;
    for (let i = 0; i < gzBones.length; i++) {
      const tall = i < gzN ? Math.pow((i + 1) / (gzN + 1), 1.5) : 1.3, low = i < gzN - 1 ? 0 : i < gzN ? 0.25 : 1.0;
      const psi = GZ.a * (tall + (low - tall) * GZ.fold) * (1 - 0.25 * GZ.fold), b = gzBones[i];
      _q.setFromAxisAngle(_up, psi - before); before = psi;
      _Ai.copy(_A).invert();
      GZ.out[i].copy(_Ai).multiply(_q).multiply(_A).multiply(GZ.base[i]);          // turned about the upright through its own joint
      _A.multiply(GZ.base[i]);
      b.quaternion.copy(GZ.out[i]);
    }
    GZ.on = true;
  }

  // ---- leaving
  function nextStation(boat) {
    for (let i = S.station + 1; i < stations.length; i++) if (Math.hypot(stations[i].position.x - boat.x, stations[i].position.z - boat.z) >= o.clear) return i;
    return -1;
  }
  function fly(target, opts = {}) {
    if (S.state !== 'stand' && S.state !== 'act') return bird;
    let dest = -1;
    if (typeof target === 'number') dest = target;
    else if (target) { stations.push(station(target)); dest = stations.length - 1; }
    S.pending = { dest, opts: { ...opts } };
    return bird;
  }
  function launch() {
    const { dest, opts } = S.pending; S.pending = null;
    const tk = travel.takeoff, ld = travel.land, boat = ctx.boat;
    const speed = (opts.speed ?? o.speed ?? sp.speed) * (calm ? 0.8 : 1), band = opts.height ?? o.height ?? sp.height, high = band[0] + rnd() * (band[1] - band[0]);
    const f = { dest, speed, s: 0, v: 0, stage: 'takeoff', headingLand: 0, glide: false, down: false, leapt: false, snapped: false, goal: new THREE.Vector3() };
    // where it is bound for. Heights given to this file are of its BODY over the water; the path is that of the point under it
    const goal = f.goal, via = (opts.via || []).map((p) => new THREE.Vector3(p[0], p[1] - cy, p[2]));
    if (dest >= 0) {
      const st = stations[dest], from = via.length ? via[via.length - 1] : pos;
      // it lands the way it comes, turned toward the way its place faces by no more than a gentle last bend allows
      // (45 degrees); the rest it turns on its feet once it is down
      const come = Math.atan2(st.position.x - from.x, st.position.z - from.z);
      f.headingLand = Math.hypot(st.position.x - from.x, st.position.z - from.z) < 0.5 ? st.heading : come + clamp(wrap(st.heading - come), -0.8, 0.8);
      // the landing clip's travel ends on the station: the path must bring the bird to where that travel begins
      goal.copy(st.position).sub(_v.copy(ld.total).multiplyScalar(o.scale).applyAxisAngle(_up, f.headingLand));
    } else if (opts.to) goal.set(opts.to[0], opts.to[1] - cy, opts.to[2]);
    else if (o.exit) goal.set(o.exit[0], o.exit[1] - cy, o.exit[2]);
    else { const a = Math.atan2(pos.x - boat.x, pos.z - boat.z); goal.set(pos.x + Math.sin(a) * 150, high + 4 - cy, pos.z + Math.cos(a) * 150); }
    // it turns while it crouches (its feet turn where they stand), toward where it is going
    const first = via[0] || goal;
    f.heading0 = S.heading; f.turn = clamp(wrap(Math.atan2(first.x - pos.x, first.z - pos.z) - S.heading), -0.7, 0.7);
    const head = S.heading + f.turn;
    const start = new THREE.Vector3().copy(tk.total).multiplyScalar(o.scale).applyAxisAngle(_up, head).add(pos);       // where the leap leaves it
    const pts = [start, ...via], span = Math.hypot(goal.x - start.x, goal.z - start.z);
    if (!via.length && span > 6) {                                      // no route given: one gentle arc at its own height
      const side = (rnd() - 0.5) * 0.2 * span, nx = (goal.z - start.z) / span, nz = -(goal.x - start.x) / span;
      pts.push(new THREE.Vector3((start.x + goal.x) / 2 + nx * side, Math.max(start.y + 0.2, goal.y, Math.min(high, 1.0 + span * 0.07) - cy), (start.z + goal.z) / 2 + nz * side));
    }
    pts.push(goal);
    const dirIn = tk.vEnd.clone().applyAxisAngle(_up, head).normalize();
    const dirOut = dest >= 0 ? ld.vStart.clone().applyAxisAngle(_up, f.headingLand).normalize() : goal.clone().sub(pts[pts.length - 2]).normalize();
    f.path = flightPath(pts, dirIn, dirOut);
    f.v0 = tk.vEnd.length() * o.scale; f.v1 = dest >= 0 ? ld.vStart.length() * o.scale : speed;
    S.flight = f; S.state = 'takeoff'; S.queue.length = 0; S.after = null; S.debt = 0; S.turn = 0;
    play('takeoff', { fade: 0.25, speed: calm ? 0.88 : 1 });
    emit('flush');
  }
  function flying(dt) {
    const f = S.flight, tk = travel.takeoff, ld = travel.land;
    if (f.stage === 'takeoff') {
      const t = S.cur.time;
      S.heading = f.heading0 + f.turn * smooth(0, tk.tStart, t);
      if (!f.leapt && t >= tk.tStart) { f.leapt = true; emit('leap'); }
      if (t < tk.tEnd) return;                                          // on the ground and in the leap the clip carries it
      f.stage = 'air'; S.state = 'fly'; f.v = f.v0; f.s = f.v0 * Math.max(0, t - tk.tEnd);
    }
    if (f.stage === 'air') {
      if (S.curName === 'takeoff' && done()) play('fly', { fade: 0.15, loop: true, speed: sp.climb });
      const L = f.path.length, left = L - f.s;
      // its speed: gathering from the leap, easing off before a landing
      const vAcc = Math.sqrt(f.v0 * f.v0 + 2 * ACC * f.s), vDec = f.dest >= 0 ? Math.sqrt(f.v1 * f.v1 + 2 * 3.4 * Math.max(0, left)) : 1e9;
      f.v = Math.min(f.speed, vAcc, vDec);
      f.s += f.v * dt;
      if (S.curName === 'fly') S.cur.setEffectiveTimeScale(1 + (sp.climb - 1) * (1 - smooth(8, 26, f.s)));     // the first beats are quicker
      // the approach: it stops beating and glides, then lets its legs down
      const eta = f.dest >= 0 ? (f.v - f.v1) / 3.4 : left / Math.max(1, f.v);        // seconds to the end
      const slowing = f.dest >= 0 ? vDec <= Math.min(f.speed, vAcc) : left < 16;
      if (!f.glide && slowing && S.curName !== 'takeoff') { f.glide = true; play('glide', { fade: 0.45, loop: true }); }
      if (f.glide && !f.down && eta < 1.3) { f.down = true; play('glide_down', { fade: 0.3 }); }
      if (f.dest >= 0 && !f.down) {                                     // a hop too short for a glide: the neck still comes out before the landing clip
        const tLand = (left - f.v * ld.tStart) / Math.max(0.5, f.v);    // takes over (the folded neck may not be cross-faded into the landing: see `rise`)
        if (tLand < 0.5) { f.down = f.glide = true; play('glide_down', { fade: 0.15, speed: Math.max(1, dur('glide_down') / Math.max(0.2, tLand)) }); }
      }
      if (f.dest >= 0) {
        if (left <= f.v * ld.tStart + 1e-3) {                           // the landing clip takes over just before its travel begins
          f.stage = 'land'; S.state = 'land';
          play('land', { fade: 0.12, time: clamp(ld.tStart - left / Math.max(0.1, f.v), 0, ld.tStart) });
          emit('land');
          return;
        }
      } else if (left <= 0.01) { gone(); return; }
      f.path.at(f.s, pos);
      f.path.dir(f.s, _v);
      const kb = 1 - Math.exp(-dt / 0.35), ease = (f.dest >= 0 ? smooth(0, 4, left) : 1) * smooth(0, 3, f.s);
      S.heading = Math.atan2(_v.x, _v.z);
      S.bank += (clamp(Math.atan(f.v * f.v * f.path.turn(f.s) / G) * (calm ? 0.4 : 0.85), -0.6, 0.6) * ease - S.bank) * kb;
      S.pitch += (Math.asin(clamp(_v.y, -1, 1)) * 0.55 * ease - S.pitch) * kb;
      return;
    }
    // landing: the path carries it until the clip's travel begins, exactly there; from then the clip brings it down
    const t = S.cur.time;
    S.bank *= Math.exp(-dt / 0.15); S.pitch *= Math.exp(-dt / 0.15); S.heading = f.headingLand;
    if (t < ld.tStart) { f.s = Math.min(f.path.length, f.s + f.v * dt); f.path.at(f.s, pos); return; }
    if (!f.snapped) { f.snapped = true; pos.copy(f.goal); ld.at(ld.tStart, S.last); applyTravel(); }
    if (done()) {
      const st = stations[f.dest];
      S.station = f.dest; S.state = 'stand'; S.flight = null; S.home.copy(st.position); pos.copy(st.position);
      S.debt = wrap(st.heading - S.heading); if (Math.abs(S.debt) < 0.15) S.debt = 0;       // what it still has to turn to face as its place says
      S.turnAt = S.clock + 1.2 + rnd() * 1.6; S.tries = 0;
      S.nextAt = S.clock + 4 + between() * 0.6;
      idle(0.4);
      emit('settled');
    }
  }
  function gone() { S.state = 'gone'; S.flight = null; g.visible = false; S.visible = false; mixer.stopAllAction(); S.cur = null; emit('gone'); }

  // ---- what touches the water
  const K = { step: [0.15, 0.22], strike: [0.4, 0.35], wingtip: [0.3, 0.3], leap: [0.5, 0.4], land: [0.6, 0.45] };      // how hard and how wide each kind of touch marks the water
  for (const k in K) { const m = o.marks && o.marks[k]; if (m != null) K[k] = Array.isArray(m) ? [m[0], m[1] ?? K[k][1]] : [m, K[k][1]]; }
  function watch() {
    g.updateMatrixWorld(true);
    const lift = 0.03 * o.scale, down = 0.015 * o.scale, wet = pos.y < -0.03;
    for (let i = 0; i < marks.length; i++) {
      const m = marks[i]; if (!m.bone) continue;
      m.p.setFromMatrixPosition(m.bone.matrixWorld); g.parent.worldToLocal(m.p);
      const y = m.p.y, was = m.y; m.y = y;                                      // the water is at 0
      if (was === null) { m.up = false; continue; }
      if (i === 0) { if (was > 0 && y <= 0) touch(m.p.x, m.p.z, 'strike', K.strike[0], K.strike[1]); continue; }
      if (i > 2) {                                                          // a wingtip: at the bottom of a beat low over the water it marks it (it need not go in: the air it drives does)
        const falling = y < was;
        if (m.falling && !falling && was < 0.6 && S.flight && (S.state === 'land' ? S.cur.time < 0.8 : S.flight.leapt)) touch(m.p.x, m.p.z, 'wingtip', K.wingtip[0] * (1 - Math.max(0, was) / 0.75), K.wingtip[1]);
        m.falling = falling;
        continue;
      }
      // a foot: through the surface (a landing, a leap), or lifted and set down again under it (a wading step)
      if (was > 0 && y <= 0) { touch(m.p.x, m.p.z, 'land', S.flight && S.flight.wet ? K.land[0] * 0.5 : K.land[0], K.land[1]); if (S.flight) S.flight.wet = true; }      // the second foot comes down in the first one's ring
      else if (was <= 0 && y > 0) touch(m.p.x, m.p.z, 'leap', K.leap[0], K.leap[1]);
      const hgt = y - pos.y;
      if (hgt > lift) m.up = true;
      else if (m.up && hgt < down) { m.up = false; if (S.state === 'act') touch(m.p.x, m.p.z, 'step', wet ? K.step[0] : 0, K.step[1]); }
    }
  }

  // ---- every frame
  function place() {
    _e.set(-S.pitch, S.heading, -S.bank, 'YXZ');                         // (nose up and left wing down are both negative turns here)
    g.rotation.copy(_e);
    if (S.bank || S.pitch) { _v.set(0, cy, 0).applyEuler(_e); g.position.set(pos.x - _v.x, pos.y + cy - _v.y, pos.z - _v.z); }      // it banks about the middle of its body
    else g.position.copy(pos);
  }
  function keepClear() {
    const eye = g.parent.worldToLocal(_v3.copy(ctx.engine.shared.uCameraPos.value));
    const R = Math.max(1.6, o.keepOut) * (calm ? 1.5 : 1), dx = pos.x - eye.x, dy = pos.y + cy - eye.y, dz = pos.z - eye.z, d = Math.hypot(dx, dy, dz);
    if (d < R && d > 1e-4) { const k = (R - d) / d; pos.x += dx * k; pos.y += dy * k; pos.z += dz * k; }
  }
  function update(dt) {
    if (S.state === 'gone' || !S.visible) return;
    S.clock += dt;
    if (bySize) {
      const e = ctx.engine, r = e.paintRadius || 4.5;
      THIN.value.set(540 / Math.tan(((e.camera && e.camera.fov) || 60) * Math.PI / 360), r * 1.1, r * 2, ctx.quality && ctx.quality.samples === 0 ? 1.25 : 0.85);
      const spread = S.flight || S.carried || S.curName === 'stretch' ? 1 : 0;
      open.value += (spread - open.value) * Math.min(1, dt / 0.25);
    }
    if (S.carried) {                                                    // driven from outside (the snow's egret that keeps exactly under the owl)
      const c = S.carried;
      if (c.phase != null && S.cur) { S.cur.setEffectiveTimeScale(0); S.cur.time = (((c.phase % 1) + 1) % 1) * S.cur.getClip().duration; mixer.update(1e-6); }
      else mixer.update(dt);
      gaze(dt, 'off');
      pos.set(c.position[0], c.position[1] - cy, c.position[2]);
      S.heading = c.heading ?? S.heading; S.bank = c.bank ?? 0; S.pitch = c.pitch ?? 0;
      keepClear(); place();
      return;
    }
    const boat = ctx.boat, away = Math.hypot(pos.x - boat.x, pos.z - boat.z), grounded = S.state === 'stand' || S.state === 'act';
    // it leaves when the boat comes too near, without looking at it
    if (grounded && !S.pending) {
      const st = stations[S.station], far = st.flush ?? o.flush, near = st.flushSlow ?? (st.flush != null ? st.flush : o.flushSlow);
      if (far > 0 && away < ((boat.speed ?? 2) < 1 && near ? near : far) * (calm ? 1.4 : 1)) flush();
    }
    if (grounded && S.pending) {
      if (S.pending.opts.wait > 0) S.pending.opts.wait -= dt;
      else if ((isStep(S.curName) || S.curName === 'strike') && S.state === 'act' && !done()) S.cur.setEffectiveTimeScale(2.4);     // a step ends on its feet first
      else if (hunched() && acts.rise) {                                // its neck comes out of the hunch first, quickly (`sink` is `rise` backward: it turns round where it is)
        const t = S.curName === 'sink' ? clamp(dur('rise') - S.cur.time, 0, dur('rise')) : 0;
        S.queue.length = 0; S.state = 'act'; S.after = null; play('rise', { fade: 0.15, time: t, speed: 2.2 });
      } else if (S.curName === 'rise' && !done()) S.cur.setEffectiveTimeScale(2.2);
      else launch();
    }
    // only standing (its slowest clip): beyond 25 m every other frame will do, beyond 70 m every fourth
    if (S.state === 'stand' && away > 25 && !S.queue.length && S.clock < S.nextAt && (++S.skip) % (away > 70 ? 4 : 2)) { S.held += dt; return; }
    const step = dt + S.held; S.held = 0;
    mixer.update(step);
    if (S.fuse) fuseTravel(); else if (S.cur) applyTravel();
    if (S.flight) flying(step); else ground(step);
    if (S.state === 'gone') return;
    // its head: free to look about only while it simply stands; before and during anything else it faces front
    gaze(step, S.state === 'stand' && !S.pending && !S.queue.length && !S.debt && (S.curName === 'stand' || S.curName === 'hunch') ? 'life' : 'front');
    if (S.state === 'fly' || S.state === 'land') keepClear();
    place();
    if (S.state !== 'stand' && (away < 62 || isStep(S.curName) || (S.curName === 'shift' && S.turn))) { watch(); turnOnFoot(step); }
    else if (marks[0].y !== null) for (const m of marks) m.y = null;
  }

  const flush = () => { const j = nextStation(ctx.boat); return fly(j >= 0 ? j : null); };
  const bird = {
    /** its Object3D (for ctx.only, visibility, a light that follows it) */
    object: g, species: o.species || 'egret', present: true, stations, handle: h,
    /** 'stand' | 'act' | 'takeoff' | 'fly' | 'land' | 'carried' | 'gone' */
    get state() { return S.state; },
    /** the station it stands on (or last stood on) */
    get station() { return S.station; },
    get heading() { return S.heading; },
    /** the clip it is in: 'stand', 'hunch', 'rise', 'sink', 'step', 'step_r', 'reach', 'strike', 'preen', 'preen_r', 'alert', 'shift', 'stretch', 'takeoff', 'fly', 'glide', 'glide_down', 'land' */
    get clip() { return S.curName; },
    /** the point between its feet (on the ground), or the point that far under its body (in the air) */
    position: pos,
    /** Do these in turn as soon as it stands idle: 'step' | 'reach' | 'strike' | 'preen' | 'alert' | 'shift' | 'stretch'; 'hunch' and 'stand' change its way of standing. */
    do(...names) { for (const n of names.flat()) S.queue.push(n); return bird; },
    /** Leave now for the next station far enough from the boat, or for good if there is none. */
    flush,
    /**
     * Fly to a station (its index) or to a place { at | position, face, depth, dry, y } and land there.
     * opts: via [[x, y, z], ...] (y = the height of its body over the water), speed, height [lo, hi], wait (seconds).
     */
    flyTo: (target, opts) => fly(target, opts),
    /** Fly away and be gone: { via, to: [x, y, z] (where it is last seen), speed, height, wait }. */
    leave: (opts) => fly(null, opts),
    /**
     * Take it over: the realm says where its body is. c = { position: [x, y, z], heading, bank, pitch, phase (0..1 of
     * the wingbeat: give it to keep two birds in time), clip ('fly' | 'glide') }. Keep changing c's numbers every
     * frame (it is read every frame), or call carry again.
     */
    carry(c) {
      if (!S.carried || (c.clip || 'fly') !== S.curName) play(c.clip || 'fly', { fade: S.cur && S.carried ? 0.3 : 0, loop: true });
      S.carried = c; S.state = 'carried'; S.flight = null; S.pending = null; g.visible = true; S.visible = true;
      return bird;
    },
    /** Give it back its own life, standing on a station. */
    release(i = S.station) { S.carried = null; settle(i); place(); return bird; },
    /** Put it on a station at once, standing (for a cue's settle()). */
    place(i = 0) { S.carried = null; g.visible = true; S.visible = true; settle(i); place(); return bird; },
    hide() { g.visible = false; S.visible = false; return bird; },
    show() { g.visible = true; S.visible = true; return bird; },
  };
  settle(0); place(); mixer.update(1e-6);
  if (o.profile) {                                                      // options.profile: bird.cost = { ms, frames }: the time this file spends on the bird (not the drawing)
    bird.cost = { ms: 0, frames: 0 };
    ctx.onUpdate((dt) => { const t0 = performance.now(); update(dt); bird.cost.ms += performance.now() - t0; bird.cost.frames++; });
  } else ctx.onUpdate(update);
  return bird;
}

/** What makeWader returns for an `optional` bird at low quality: every control is there and does nothing. */
function absent(o) {
  const bird = { object: null, species: o.species || 'egret', present: false, state: 'gone', station: -1, heading: 0, clip: '', position: new THREE.Vector3(), stations: [] };
  for (const k of ['do', 'flush', 'flyTo', 'leave', 'carry', 'release', 'place', 'hide', 'show']) bird[k] = () => bird;
  return bird;
}
