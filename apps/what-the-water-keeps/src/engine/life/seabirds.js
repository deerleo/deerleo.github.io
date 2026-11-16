// Seabirds: the cormorant, the barn owl and the tern. Three more large birds on the shared bird skeleton and wing of
// tools/blender_lib/qc_bird.py (the heron and the egret are src/engine/life/waders.js). The page for area builders is
// docs/life/seabirds.md.
//
//   import { makeCormorant, makeOwl, makeTern } from '../engine/life/seabirds.js';
//   const drying = await makeCormorant(ctx, { at: [62, 14.5], y: 2.2, face: 'channel', seed: 3 });          // on its stack, wings hung out
//   const fishing = await makeCormorant(ctx, { mode: 'fish', water: { s: [66, 112], d: [-6, 6] }, under: [9, 14], seed: 5 });
//   const owl = await makeOwl(ctx, { position: [x, 5.5, z], face: 'channel', turn: Math.PI });              // its back to the river
//   ctx.stage.cue('owl', { s: 32, settle: () => owl.hide() }, () => owl.leave({ via: [...], to: [...], speed: 5.5 }));
//   const tern = await makeTern(ctx, { position: [x, 1.2, z], rest: 'doze', wake: 5, seed: 2 });             // asleep on a stake
//
// Each bird has a private life drawn from its seed, never looks at the boat, keeps its large movements for when the
// boat is far enough off (a cormorant folds its wings only beyond 12 m, a tern opens them only beyond 20 m), follows
// the paths an area gives it, marks the water where it touches it and reports what it does (onEvent, onTouch) so
// that an area can add a sound. The clips carry their own travel (the dive, the surfacing, an owl's drop from its
// perch, a tern's spring off a post) and this file moves the bird by it.
import * as THREE from 'three';

const SPECIES = {
  // size: how large the bird's parts are beside a heron's (for keeping thin parts out of the painter's filter); head: see thinAttribute;
  // centre: the middle of its body over its feet when it stands, and over its own origin in the air, metres
  cormorant: { file: 'models/life/cormorant.glb', size: 0.8, head: 0.6, centre: 0.3, air: 0.3 },
  owl: { file: 'models/life/owl.glb', size: 0.55, centre: 0.16, air: 0.16, speed: 5.0, beats: 2.18, acc: 3.0, keepOut: 3 },
  tern: { file: 'models/life/tern.glb', size: 0.4, head: 0.35, centre: 0.06, air: 0.06, speed: 8.0, beats: 3.2, acc: 5.0, keepOut: 2.5 },
};
const TAU = Math.PI * 2, G = 9.81;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a || 1e-9), 0, 1); return t * t * (3 - 2 * t); };
const wrap = (a) => { a = (a + Math.PI) % TAU; return (a < 0 ? a + TAU : a) - Math.PI; };
const between = (r, rnd) => (Array.isArray(r) ? r[0] + rnd() * (r[1] - r[0]) : r);
const _v = new THREE.Vector3(), _v2 = new THREE.Vector3(), _v3 = new THREE.Vector3(), _e = new THREE.Euler(0, 0, 0, 'YXZ'), _up = new THREE.Vector3(0, 1, 0);
const _A = new THREE.Quaternion(), _Ai = new THREE.Quaternion(), _q = new THREE.Quaternion(), _fwd = new THREE.Vector3(0, 0, 1);

// ---------------------------------------------------------------------------------------------------- thin parts
// As the waders do (src/engine/life/waders.js, "thin parts"): every part of the bird marks itself in the picture's
// alpha BY ITS SIZE IN THE PICTURE, so the painter's filter leaves a bill, a leg, a far bird as drawn and paints
// what is broad. Each point carries the thickness of the part it belongs to (aThin, worked out once a file from
// the bones); wings and tail carry theirs as a negative number, because folded on a standing bird they are part of
// its mass (uMass, metres) and spread they are blades. Eyes are never left as drawn: two kept specks on a far
// bird that faces the boat are a face.
const THIN = { value: new THREE.Vector4(935, 5, 9, 0.85) };   // pixels to a metre at 1 m; thinner than y pixels = left as drawn; thicker than z = painted; w = the least width of a limb, pixels
/** For the demo's studies only (&limb=): the least width of a limb in pixels, in place of 0.85 (1.25 at low quality). */
export const study = { limb: null };
// A part left as drawn is lit as one touch (its normal turned toward the eye: waders.js says why), EXCEPT the blades of
// a spread wing: a wing is two flat sides, and seen from the boat a flying bird shows the underside, which is in its
// own shade. Lit as one touch from where the rider sits, a far pale bird was as light underneath as on top and was lost
// against a pale sky; shaded as it is, it is a darker line against the sky, as a gull is.
const THIN_EXT = {
  vertexPars: 'attribute float aThin; uniform float uOpen; uniform float uMass; uniform vec4 uThinPx; centroid varying float vThin; varying float vBlade;',
  vertexLocal: 'vThin = aThin < 0.0 ? mix(uMass, -aThin, uOpen) : aThin; vBlade = aThin < 0.0 ? uOpen : 0.0;',
  vertexWorld: 'if (aThin > 0.0 && aThin < 0.035) wp.xyz += normalize(wn) * max(0.0, uThinPx.w * distance(wp.xyz, uCameraPos) / uThinPx.x - aThin) * 0.5;',
  fragmentPars: 'centroid varying float vThin; varying float vBlade; uniform vec4 uThinPx; float kThin;',
  albedo: `kThin = 1.0 - smoothstep(uThinPx.y, uThinPx.z, vThin * uThinPx.x / max(length(vViewPos), 0.1));
      N = normalize(mix(N, normalize(uCameraPos - vWPos), 0.92 * kThin * (1.0 - vBlade)));`,
  final: 'if (kThin > 0.0) gl_FragColor.a = kThin > 0.995 ? -15.0 : 0.5 - 1.55 * kThin;',
};
// The stray pixel (waders.js, "THE STRAY PIXEL"): paint read inside the triangle and never less than nothing, and a
// normal with next to no length turned toward the eye. The text is the waders' own, so the two share one program part.
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
// A pale bird beside the bow lantern must not burn out. White paint three metres from the lantern is lit to twice
// white: the bloom makes a lamp of the bird and washes its black cap and its eye away (a tern on a stake, 3 m from the
// line). What is brighter than 0.62 is eased toward 0.82: the bird is still the palest thing near the lantern, and is
// still paint. (options.glare: true leaves the light as it is.)
const KNEE_EXT = { light: 'vec3 over = max(c - 0.62, 0.0); c = min(c, vec3(0.62)) + over / (1.0 + over * 5.0);' };
// Black plumage has a sheen. Paint gives back light in proportion to its own colour, so a tern's black cap three
// metres from the lantern stayed as black as the night behind it, and the head read as a white face cut off flat
// above the eye. What is darkest in the paint gives back a twentieth of a lamp's light whatever its colour: by
// lantern light the cap is a dark cap against the sky; by day and at dusk (a weak lantern) nothing changes.
const SHEEN_EXT = { light: '{ float dark = 1.0 - smoothstep(0.02, 0.12, max(albedo.r, max(albedo.g, albedo.b))); c += lamps * 0.05 * dark; }' };
const thinDone = new WeakSet();
function thinAttribute(mesh, size, head = 1) {
  const g = mesh.geometry;
  if (thinDone.has(g) || !g.attributes.skinIndex) return;
  thinDone.add(g);
  const pos = g.attributes.position, si = g.attributes.skinIndex, sw = g.attributes.skinWeight, sk = mesh.skeleton, n = pos.count, out = new Float32Array(n);
  const org = [], dir = [], kind = [], m = new THREE.Matrix4(), p = new THREE.Vector3();
  for (let b = 0; b < sk.bones.length; b++) {
    m.copy(sk.boneInverses[b]).invert();                    // where the bone lay when the skin was bound: its head, and its own line (a bone points along its +Y)
    org.push(new THREE.Vector3().setFromMatrixPosition(m)); dir.push(new THREE.Vector3(0, 1, 0).transformDirection(m));
    const nm = sk.bones[b].name;
    kind.push(/^eye/.test(nm) ? 1 : /^(wing|ter_|sec_|pri_|tip_wing)/.test(nm) ? -0.07 * size : /^tail/.test(nm) ? -0.05 * size : /^(foot|toe|hallux)/.test(nm) ? 0.009
      : /^(neck|head|tip_bill|shin|tarsus)/.test(nm) ? 9 : 0.14 * size);       // 9: a limb, as thick as twice a point's distance from its bone's line
  }
  for (let i = 0; i < n; i++) {
    let best = 0, w = -1;
    for (let j = 0; j < 4; j++) { const wj = sw.getComponent(i, j); if (wj > w) { w = wj; best = si.getComponent(i, j); } }
    let t = kind[best];
    if (t === 9) {
      p.fromBufferAttribute(pos, i).applyMatrix4(mesh.bindMatrix).sub(org[best]); t = clamp(2 * p.addScaledVector(dir[best], -p.dot(dir[best])).length(), 0.006, 0.14 * size);
      if (/^(head|tip_bill)/.test(sk.bones[best].name)) t *= head;      // a head whose marks are smaller than the brush (a tern's cap) is counted thinner than it is: it stays as drawn
    }
    out[i] = t;
  }
  g.setAttribute('aThin', new THREE.BufferAttribute(out, 1));
}

// ---------------------------------------------------------------------------------------------------- clips
// A file's clips are trimmed once: tracks that never leave the rest pose are dropped, and the root's place is taken
// out and kept as a table: the TRAVEL, which moves the bird itself and is never blended (as the waders do).
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
/** A smooth path through points, with the directions it leaves and (when it does not close) arrives in; by arc length. */
function flightPath(points, dirIn, dirOut, closed = false) {
  const n = points.length, tan = [];
  for (let i = 0; i < n; i++) {
    if (closed) tan.push(points[(i + 1) % n].clone().sub(points[(i + n - 1) % n]).multiplyScalar(0.5));
    else if (i === 0) tan.push(dirIn.clone().multiplyScalar(Math.min(5, points[0].distanceTo(points[1]) * 0.9)));
    else if (i === n - 1) tan.push(dirOut.clone().multiplyScalar(Math.min(6, points[n - 1].distanceTo(points[n - 2]) * 0.9)));
    else tan.push(points[i + 1].clone().sub(points[i - 1]).multiplyScalar(0.5));
  }
  const P = [], S = [0], STEPS = 24, knots = [0], last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const a = points[i], b = points[(i + 1) % n], ta = tan[i], tb = tan[(i + 1) % n];
    for (let j = i === 0 ? 0 : 1; j <= STEPS; j++) {
      const t = j / STEPS, t2 = t * t, t3 = t2 * t;
      const p = a.clone().multiplyScalar(2 * t3 - 3 * t2 + 1).addScaledVector(ta, t3 - 2 * t2 + t).addScaledVector(b, -2 * t3 + 3 * t2).addScaledVector(tb, t3 - t2);
      if (P.length) S.push(S[S.length - 1] + p.distanceTo(P[P.length - 1]));
      P.push(p);
    }
    knots.push(S[S.length - 1]);                               // the arc length at which each given point is passed
  }
  const length = S[S.length - 1];
  let hint = 0;
  const at = (s, out) => {
    s = closed ? ((s % length) + length) % length : clamp(s, 0, length);
    while (hint > 0 && S[hint] > s) hint--;
    while (hint < S.length - 2 && S[hint + 1] < s) hint++;
    return out.copy(P[hint]).lerp(P[hint + 1], (s - S[hint]) / Math.max(1e-9, S[hint + 1] - S[hint]));
  };
  const a = new THREE.Vector3(), b = new THREE.Vector3();
  return {
    length, at, closed, knots,
    /** unit direction of travel at s */
    dir(s, out) { at(s - 0.4, a); at(s + 0.4, b); return out.copy(b).sub(a).normalize(); },
    /** how fast the heading turns at s, radians a metre (+ = to the bird's left) */
    turn(s) { const d = 1.5; at(s - d, a); at(s, b); const h0 = Math.atan2(b.x - a.x, b.z - a.z); at(s + d, a); return wrap(Math.atan2(a.x - b.x, a.z - b.z) - h0) / d; },
  };
}

// ---------------------------------------------------------------------------------------------------- what the three share
/**
 * The bird itself: the model in the ride's paint, its clips, its place, its head, what it tells the area.
 * Returns B, on which each species builds its own life (below).
 */
async function embody(ctx, name, options, defaults) {
  const sp = SPECIES[name], kit = ctx.kit, calm = !!ctx.reducedMotion;
  const o = { seed: 1, ripples: true, scale: 1, ...defaults, ...options };
  const rnd = ctx.rng(o.seed * 7919 + 13);
  const paint = { brush: 0.5, ...(o.material || {}) };
  const bySize = paint.crisp === undefined;                                   // (material.crisp: true = the whole bird left as drawn at any distance; false = all of it painted)
  const open = { value: 0 };                                                  // 0 = wings folded (part of its mass) .. 1 = spread (blades)
  // (an area's own extensions come before the sheen and the knee: its air and its own law for the lantern are part of the light the knee eases)
  paint.extend = [].concat(GUARD_EXT, paint.extend || [], SHEEN_EXT, o.glare ? [] : KNEE_EXT, bySize ? { ...THIN_EXT, uniforms: { uThinPx: THIN, uOpen: open, uMass: { value: 0.14 * sp.size } } } : []);
  const h = await kit.animated(sp.file, { name: o.name || name, ...paint });
  const g = h.group;
  if (bySize) g.traverse((m) => { if (m.isSkinnedMesh) thinAttribute(m, sp.size, sp.head ?? 1); });
  if (o.parent) o.parent.add(g);                                              // (a group of the realm's, to hide a whole zone by; it must stay where it is, unturned and unscaled)
  g.rotation.order = 'YXZ'; g.scale.setScalar(o.scale);
  for (const b of Object.values(h.bones)) b.matrixAutoUpdate = true;          // this file runs the mixer itself (kit.animated's own play() is not used)
  if (o.only) ctx.only(g, o.only);
  const { clips, travel } = prepare(h), mixer = h.mixer, acts = {};
  for (const nm of h.clips) mixer.uncacheClip(h.actions[nm].getClip());      // the untrimmed clips are not needed on this copy
  for (const nm in clips) acts[nm] = mixer.clipAction(clips[nm]);

  const pos = new THREE.Vector3(), where = new THREE.Vector3();
  const S = { clock: 0, heading: 0, bank: 0, pitch: 0, pivot: 0, cur: null, curName: '', last: new THREE.Vector3(), visible: true, wantOpen: 0, skip: 0, held: 0, level: 0 };
  const B = { ctx, o, sp, name, kit, calm, rnd, h, g, acts, clips, travel, pos, where, S, open, bySize, mixer };

  B.dur = (nm) => (clips[nm] ? clips[nm].duration : 0);
  B.emit = (ev) => { if (o.onEvent) { try { o.onEvent(ev, B.bird); } catch (err) { console.error(err); } } };
  B.touch = (x, z, kind, strength, radius) => {
    if (o.ripples && strength > 0 && S.visible) ctx.water.ripple(x, z, strength, radius);
    if (o.onTouch) { try { o.onTouch(x, z, kind, strength); } catch (err) { console.error(err); } }
  };
  B.marks = (table) => { const K = { ...table }; for (const k in K) { const m = o.marks && o.marks[k]; if (m != null) K[k] = Array.isArray(m) ? [m[0], m[1] ?? K[k][1]] : [m, K[k][1]]; } return K; };

  // ---- clips: play, cross-fade, and move the bird by the clip's travel
  B.play = (nm, { fade = 0.25, loop = false, time = 0, speed = 1 } = {}) => {
    const a = acts[nm];
    if (!a) { console.error(`INVALID_CLIP seabirds: ${sp.file} has no clip "${nm}"`); return null; }
    const prev = S.cur;
    a.reset(); a.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, Infinity); a.clampWhenFinished = true; a.enabled = true;
    a.setEffectiveTimeScale(speed); a.setEffectiveWeight(1); a.time = time; a.play();
    if (prev && prev !== a) { if (fade > 0) a.crossFadeFrom(prev, fade, false); else prev.stop(); }
    S.cur = a; S.curName = nm;
    if (travel[nm]) travel[nm].at(time, S.last); else S.last.set(0, 0, 0);
    return a;
  };
  B.done = () => !!S.cur && S.cur.loop === THREE.LoopOnce && S.cur.paused;        // a clip played once has reached its end
  B.carryBy = (v) => {                                                 // move the bird by a displacement given in its own frame (a clip's travel)
    if (v.lengthSq() === 0) return;
    const c = Math.cos(S.heading), s = Math.sin(S.heading), k = o.scale;
    pos.x += (v.x * c + v.z * s) * k; pos.z += (-v.x * s + v.z * c) * k; pos.y += v.y * k;
  };
  B.applyTravel = () => {
    const tb = travel[S.curName];
    if (!tb || !S.cur) return;
    tb.at(S.cur.time, _v);
    _v2.copy(_v).sub(S.last); S.last.copy(_v);
    B.carryBy(_v2);
  };

  // ---- where the rider is
  B.eye = (out) => g.parent.worldToLocal(out.copy(ctx.engine.shared.uCameraPos.value));
  // how far off the rider is: the nearer of the eye and the boat's own place at the eye's height (the engine sets the eye's
  // place after the realm's turn: it is a frame late, and in the first frame of a visit it is not the rider's at all)
  B.eyeDistance = () => { B.eye(_v3); return Math.min(Math.hypot(pos.x - _v3.x, pos.y + S.pivot - _v3.y, pos.z - _v3.z), Math.hypot(pos.x - ctx.boat.x, pos.y + S.pivot - 1.1, pos.z - ctx.boat.z)); };
  B.boatDistance = () => Math.hypot(pos.x - ctx.boat.x, pos.z - ctx.boat.z);
  B.boatBearing = () => wrap(Math.atan2(ctx.boat.x - pos.x, ctx.boat.z - pos.z) - S.heading);      // where the boat is, seen from the bird: + is to its left
  B.keepClear = (R) => {                                              // nothing of the bird comes nearer the rider's eye than this
    B.eye(_v3);
    const dx = pos.x - _v3.x, dy = pos.y + S.pivot - _v3.y, dz = pos.z - _v3.z, d = Math.hypot(dx, dy, dz);
    if (d < R && d > 1e-4) { const k = (R - d) / d; pos.x += dx * k; pos.y += dy * k; pos.z += dz * k; }
  };

  // ---- its place in the realm: it pitches and banks about a point S.pivot above its own origin (the middle of its body)
  B.place = () => {
    _e.set(-S.pitch, S.heading, -S.bank, 'YXZ');                         // (nose up and left wing down are both negative turns here)
    g.rotation.copy(_e);
    if (S.bank || S.pitch) { _v.set(0, S.pivot, 0).applyEuler(_e); g.position.set(pos.x - _v.x, pos.y + S.pivot - _v.y, pos.z - _v.z); }
    else g.position.copy(pos);
    where.set(pos.x, pos.y + S.pivot, pos.z);
  };

  // ---- the head. Two things are laid over what the clips do:
  // the GAZE: while it simply stands, the head is turned slowly aside and back, at times of the bird's own, and never
  // toward the boat (the boat's own side of it is no place to look, and the bill is never brought within 60 degrees
  // of the line to the boat); and LEVEL: in the air the head does not roll with the body (an owl's, a tern's: the
  // body banks under a head that stays level).
  const rg = ctx.rng(o.seed * 104729 + 71);
  const gzBones = [];
  for (let i = 1; h.bones['neck' + i]; i++) gzBones.push(h.bones['neck' + i]);
  const gzN = gzBones.length;
  if (h.bones.head && h.bones.body && gzN) gzBones.push(h.bones.head); else gzBones.length = 0;
  const gzChain = [];
  for (let p = h.bones.body; gzBones.length && p && p !== g; p = p.parent) gzChain.unshift(p);
  const gz = { every: [5, 12], angle: [0.2, 0.6], stay: [3, 8], share: 0.55, ...(o.gaze && typeof o.gaze === 'object' ? o.gaze : {}) };      // share: how much of the turn the neck takes (the rest is the head's own)
  const GZ = { a: 0, v: 0, target: 0, next: 1.5 + rg() * gz.every[1], on: false, roll: 0,
    base: gzBones.map(() => new THREE.Quaternion()), out: gzBones.map(() => new THREE.Quaternion()) };
  function lookAside(near, bearing) {
    if (Math.abs(GZ.target) > 0.05 && rg() < 0.55) { GZ.target = 0; GZ.next = S.clock + between(gz.every, rg); return; }
    let side = rg() < 0.5 ? 1 : -1;
    if (near && Math.abs(bearing) < 2.6) side = bearing > 0 ? -1 : 1;      // to the side the boat is not on
    let a = side * between(gz.angle, rg);
    if (near && Math.abs(wrap(a * 1.1 - bearing)) < 1.05) a = Math.abs(wrap(-a * 1.1 - bearing)) < 1.05 ? 0 : -a;      // never within 60 degrees of the line to the boat
    GZ.target = a; GZ.next = S.clock + between(gz.stay, rg);
  }
  /** mode: 'life' (it looks about as it pleases), 'rest' (the head comes slowly back to the front and stays), 'front' (it comes back quickly: an action follows), 'off' (at once). roll: radians the head is turned back against the body's bank. */
  B.gaze = (dt, mode, roll = 0) => {
    if (!gzBones.length) return;
    if (mode === 'off' || o.gaze === false) { GZ.a = 0; GZ.v = 0; GZ.target = 0; }
    else {
      if (mode === 'life') {
        const near = B.boatDistance() < 45, bearing = B.boatBearing();
        if (S.clock >= GZ.next || (near && GZ.target !== 0 && Math.abs(wrap(GZ.target * 1.1 - bearing)) < 0.9)) lookAside(near, bearing);
      } else GZ.target = 0;
      const w = mode === 'front' ? 7 : calm ? 2.2 : 3.0;                 // a turn takes about a second and a half; the return before an action a third of one
      GZ.v += (w * w * (GZ.target - GZ.a) - 1.8 * w * GZ.v) * dt; GZ.a += GZ.v * dt;
      if (GZ.target === 0 && Math.abs(GZ.a) < 2e-4 && Math.abs(GZ.v) < 2e-3) { GZ.a = 0; GZ.v = 0; }
    }
    GZ.roll = roll;
    const active = GZ.a !== 0 || roll !== 0;
    if (!active && !GZ.on) return;
    // what the clip made of these bones this frame (a bone the mixer did not write still holds what was put there last time)
    for (let i = 0; i < gzBones.length; i++) if (!(GZ.on && gzBones[i].quaternion.equals(GZ.out[i]))) GZ.base[i].copy(gzBones[i].quaternion);
    if (!active) { for (let i = 0; i < gzBones.length; i++) gzBones[i].quaternion.copy(GZ.base[i]); GZ.on = false; return; }
    _A.identity();
    for (const p of gzChain) _A.multiply(p.quaternion);                 // how the trunk stands in the bird's own frame, in which up is +Y and forward +Z
    let before = 0;
    for (let i = 0; i < gzBones.length; i++) {
      const isHead = i === gzN, b = gzBones[i];
      const psi = GZ.a * (isHead ? 1 : gz.share * Math.pow((i + 1) / gzN, 1.5));
      _q.setFromAxisAngle(_up, psi - before); before = psi;
      if (isHead && roll) { _Ai.setFromAxisAngle(_fwd, roll); _q.multiply(_Ai); }      // the head alone is rolled back to level
      _Ai.copy(_A).invert();
      GZ.out[i].copy(_Ai).multiply(_q).multiply(_A).multiply(GZ.base[i]);          // turned about the upright through its own joint
      _A.multiply(GZ.base[i]);
      b.quaternion.copy(GZ.out[i]);
    }
    GZ.on = true;
  };

  // ---- marker bones, for what touches the water
  const markers = {};
  for (const nm of ['tip_bill', 'head', 'foot_L', 'foot_R', 'tip_wing_L', 'tip_wing_R', 'tail', 'body']) if (h.bones[nm]) markers[nm] = { bone: h.bones[nm], p: new THREE.Vector3(), y: null };
  /** Where the marker bones are now (the realm's own space). Call after place(). Returns { name: { p, y (now), was (the frame before, or null) } }. */
  B.watch = () => {
    g.updateMatrixWorld(true);
    for (const nm in markers) { const m = markers[nm]; m.was = m.y; m.p.setFromMatrixPosition(m.bone.matrixWorld); g.parent.worldToLocal(m.p); m.y = m.p.y; }
    return markers;
  };
  B.unwatch = () => { for (const nm in markers) markers[nm].y = null; };

  // ---- every frame: the clock, the size of things in the picture, the mixer (a bird that only stands far off is advanced every other frame)
  B.tick = (dt, idleFar) => {
    S.clock += dt;
    if (bySize) {
      const e = ctx.engine, r = e.paintRadius || 4.5;
      THIN.value.set(540 / Math.tan(((e.camera && e.camera.fov) || 60) * Math.PI / 360), r * 1.1, r * 2, study.limb ?? (ctx.quality && ctx.quality.samples === 0 ? 1.25 : 0.85));
      open.value += (S.wantOpen - open.value) * Math.min(1, dt / 0.25);
    }
    if (idleFar) { const away = B.boatDistance(); if (away > 25 && (++S.skip) % (away > 70 ? 4 : 2)) { S.held += dt; return 0; } }
    const step = dt + S.held; S.held = 0;
    mixer.update(step);
    return step;
  };
  B.hide = () => { g.visible = false; S.visible = false; };
  B.show = () => { g.visible = true; S.visible = true; };
  B.profile = (update) => {
    if (o.profile) { B.bird.cost = { ms: 0, frames: 0 }; ctx.onUpdate((dt) => { const t0 = performance.now(); update(dt); B.bird.cost.ms += performance.now() - t0; B.bird.cost.frames++; }); }
    else ctx.onUpdate(update);
  };
  /** A perch from a placement: { at: [s, d], y } or { position: [x, y, z] }, face ('channel' | 'back' | 'along' | radians), turn. */
  B.perch = (p) => {
    const out = { position: new THREE.Vector3(), heading: 0, s: 0, d: 0 };
    if (p.at) { kit.at(p.at[0], p.at[1] ?? 0, p.y ?? p.at[2] ?? 0, out.position); out.s = p.at[0]; out.d = p.at[1] ?? 0; }
    else {
      const q = p.position || [0, 0, 0];
      out.position.set(q[0], p.y ?? q[1], q[2]);
      const loc = ctx.path.locate(out.position.x, out.position.z, null, {}); out.s = loc.s; out.d = loc.d;
    }
    out.heading = kit.faceAngle(p.face ?? 'channel', out.s, out.d) + (p.turn || 0);
    return out;
  };
  return B;
}

/** What a maker returns for an `optional` bird at low quality: every control is there and does nothing. */
function absent(name, controls) {
  const bird = { object: null, species: name, present: false, state: 'gone', clip: '', heading: 0, bank: 0, phase: 0, gliding: false, position: new THREE.Vector3() };
  for (const k of controls) bird[k] = () => bird;
  return bird;
}
const left = (ctx, o) => !!o.optional && (ctx.quality.density || 1) < 0.7;

// ---------------------------------------------------------------------------------------------------- the cormorant
/**
 * A cormorant. It never flies. Two ways of being, chosen by `mode`:
 *
 * mode 'perch' (the default): upright on a post, a ridge, a chimney stack. options:
 *   at: [s, d] + y, or position: [x, y, z]     where its feet stand (y: the height of the top it stands on)
 *   face, turn      which way it looks: 'channel' | 'back' | 'along' | radians, plus turn radians
 *   wings           'dry' (the default: hung out half open) or 'folded': how it begins
 *   life            { shiver: [4, 11], shake: [20, 40], dry: [50, 110], folded: [40, 90] }: seconds between shivers,
 *                   between shakes, how long it dries before it folds, how long it stands folded before it opens them
 *                   again (Infinity = it never changes by itself). false: it only does what it is told
 *   still           12: metres (from the rider's eye). Inside, it neither shivers nor shakes, holds its wings stiller,
 *                   does not turn its head, and begins no fold or spread: the one wing fold is never watched from close
 *
 * mode 'fish': it swims low, dives, travels under the water and comes up somewhere else. options:
 *   water           where it fishes: { s: [s0, s1], d: [d0, d1] } (a stretch of the route) or { at: [s, d], r }
 *   at: [s, d]      where it begins (default: a place of its own in its water)
 *   afloat          [11, 22]: seconds it swims between coming up and the next dive
 *   under           [20, 40]: seconds it stays down (a real cormorant's; the town asks [9, 14])
 *   depth           1.1: metres down it travels;  swim 0.45, pace 1.3: metres a second afloat and under the water
 *   shy             6: it never comes up within this many metres of the boat: it stays down four seconds longer
 *   flush           9: afloat, it dives when the boat comes within this (0 = it takes no notice)
 *
 * both: seed, ripples (false: nothing is written on the water), marks { wake, dive, surface, scatter } (strength or
 *   [strength, radius]), onTouch(x, z, kind, strength) with kind 'wake' | 'dive' | 'surface' | 'scatter',
 *   onEvent(name, bird) with 'shiver' | 'shake' | 'fold' | 'folded' | 'spread' | 'dry' | 'dive' | 'under' | 'surface' | 'afloat',
 *   gaze (false, or { every, angle, stay }), only ('mirror' | 'direct'), parent, scale, material, optional, profile.
 * Resolves to the bird: see the object at the end of this function.
 */
export async function makeCormorant(ctx, options = {}) {
  const controls = ['fold', 'spread', 'shake', 'shiver', 'dive', 'comeUp', 'set', 'hide', 'show'];
  if (left(ctx, options)) return absent('cormorant', controls);
  const B = await embody(ctx, 'cormorant', options, { mode: 'perch', wings: 'dry', still: 12, afloat: [11, 22], under: [20, 40], depth: 1.1, swim: 0.45, pace: 1.3, shy: 6, flush: 9 });
  const { o, S, pos, rnd, calm, kit } = B, water = ctx.water;
  const k = o.scale, deep = Math.max(o.depth, 0.6 * k);           // (a bird made larger travels at least deep enough to be hidden)
  const K = B.marks({ wake: [0.12, 0.2], dive: [0.7, 0.5], surface: [0.6, 0.5], scatter: [0.15, 0.15] });
  const life = o.life === false ? null : { shiver: [4, 11], shake: [20, 40], dry: [50, 110], folded: [40, 90], ...(o.life || {}) };
  const fishing = o.mode === 'fish';
  const L = { state: '', next: {}, want: null, pend: [], target: new THREE.Vector3(), timer: 0, wake: 0, v: 0, vy: 0, turn: 0, scatter: [], down: 0, wantUp: false, hold: 0, to: null };
  S.pivot = 0;

  // ---- on its post
  const schedule = (k) => { L.next[k] = S.clock + (life && Number.isFinite(between(life[k], rnd)) ? between(life[k], rnd) : 1e9); };
  function stand(wings, fade = 0, fresh = true) {
    L.state = wings === 'folded' ? 'perch' : 'dry';
    S.wantOpen = L.state === 'dry' ? 1 : 0;
    B.play(L.state, { fade, loop: true, time: fade ? 0 : rnd() * B.dur(L.state) });
    if (!fresh) return;
    if (L.state === 'dry') { schedule('shiver'); schedule('shake'); schedule('dry'); } else schedule('folded');
  }
  function begin(act) {                                               // 'shiver' | 'shake' from the drying pose; 'fold' from it; 'spread' from the folded one
    if ((act === 'shiver' || act === 'shake' || act === 'fold') && L.state !== 'dry') return false;
    if (act === 'spread' && L.state !== 'perch') return false;
    L.state = act; if (act === 'spread') S.wantOpen = 1;
    B.play(act, { fade: 0.3, speed: calm && act === 'shake' ? 0.7 : 1 });
    B.emit(act);
    return true;
  }
  function perched(dt) {
    const near = B.eyeDistance() < o.still * (calm ? 1.3 : 1);
    if (L.state === 'dry' || L.state === 'perch') {
      S.cur.setEffectiveTimeScale(near ? 0.45 : 1);                     // the boat is close: it holds stiller
      if (L.pend.length && (L.pend[0] === 'shiver' || L.pend[0] === 'shake')) { if (!begin(L.pend.shift())) return; return; }
      if (near) return;                                                 // nothing large is begun while the boat is close
      if (L.want && L.want !== L.state) { const w = L.want; L.want = null; if (begin(w === 'perch' ? 'fold' : 'spread')) return; }
      if (!life) return;
      if (L.state === 'dry') {
        if (S.clock >= L.next.dry) { begin('fold'); return; }
        if (S.clock >= L.next.shake) { begin('shake'); return; }
        if (S.clock >= L.next.shiver) { begin('shiver'); return; }
      } else if (S.clock >= L.next.folded) begin('spread');
      return;
    }
    if (B.done()) {
      const was = L.state;
      if (was === 'fold') { stand('folded', 0.3); B.emit('folded'); }
      else if (was === 'spread') { stand('dry', 0.3); B.emit('dry'); }
      else { stand('dry', 0.3, false); schedule(was); if (was === 'shake') L.next.shiver = Math.max(L.next.shiver, S.clock + 3); }
    }
  }

  // ---- fishing: where its water is
  const W = o.water || {}, box = W.s ? { s0: W.s[0], s1: W.s[1], d0: (W.d || [-5, 5])[0], d1: (W.d || [-5, 5])[1] } : null, pond = !box && W.at ? { c: kit.at(W.at[0], W.at[1] ?? 0, 0), r: W.r ?? 12 } : null;
  const _p = new THREE.Vector3();
  function somewhere(out, from, lo, hi) {                              // a place in its water, lo..hi metres from `from` if it can be had, never near the boat
    let best = null, score = -1e9;
    for (let i = 0; i < 12; i++) {
      if (box) kit.at(box.s0 + rnd() * (box.s1 - box.s0), box.d0 + rnd() * (box.d1 - box.d0), 0, _p);
      else if (pond) { const a = rnd() * TAU, r = Math.sqrt(rnd()) * pond.r; _p.set(pond.c.x + Math.cos(a) * r, 0, pond.c.z + Math.sin(a) * r); }
      else { const a = rnd() * TAU, r = 4 + rnd() * 10; _p.set(from.x + Math.cos(a) * r, 0, from.z + Math.sin(a) * r); }
      const d = Math.hypot(_p.x - from.x, _p.z - from.z), b = Math.hypot(_p.x - ctx.boat.x, _p.z - ctx.boat.z);
      const sc = -Math.abs(d - (lo + hi) / 2) / Math.max(1, hi - lo) - (b < o.shy + 4 ? (o.shy + 4 - b) * 2 : 0) + rnd() * 0.2;
      if (sc > score) { score = sc; best = best || new THREE.Vector3(); best.copy(_p); }
    }
    return out.copy(best);
  }
  function inside(x, z) {
    if (box) { const l = ctx.path.locate(x, z, null, {}); return l.s >= box.s0 && l.s <= box.s1 && l.d >= box.d0 && l.d <= box.d1; }
    if (pond) return Math.hypot(x - pond.c.x, z - pond.c.z) <= pond.r;
    return true;
  }
  function steer(dt, speed, rate) {                                    // turn toward L.target, and away from the boat when it is close
    let want = Math.atan2(L.target.x - pos.x, L.target.z - pos.z);
    const bx = pos.x - ctx.boat.x, bz = pos.z - ctx.boat.z, bd = Math.hypot(bx, bz), keep = L.state === 'afloat' ? o.shy + 3 : 2.6;
    if (bd < keep) want = Math.atan2(bx, bz);
    const d = clamp(wrap(want - S.heading), -rate * dt, rate * dt);
    S.heading += d; L.turn = d / Math.max(dt, 1e-4);
    L.v += (speed - L.v) * Math.min(1, dt / 0.8);
    pos.x += Math.sin(S.heading) * L.v * dt; pos.z += Math.cos(S.heading) * L.v * dt;
  }
  function float(fade = 0) {
    L.state = 'afloat'; S.wantOpen = 0; S.pitch = 0; S.bank = 0; pos.y = 0;
    B.play('swim', { fade, loop: true, time: fade ? 0 : rnd() * B.dur('swim') });
    L.timer = S.clock + between(o.afloat, rnd); L.v = Math.min(L.v, o.swim);
    somewhere(L.target, pos, 5, 14); L.hold = S.clock + 6 + rnd() * 6;
  }
  function plunge(to) {
    L.state = 'dive'; L.to = to || null; L.wantUp = !!L.upThere; L.upThere = false;      // (comeUp({ at }) from afloat: it dives, makes for the place and comes up there)
    B.play('dive', { fade: 0.22 });
    B.emit('dive');
  }
  function fish(dt) {
    const m = B.watch();
    if (L.state === 'afloat') {
      if (S.clock > L.hold || Math.hypot(L.target.x - pos.x, L.target.z - pos.z) < 1.5) { somewhere(L.target, pos, 5, 14); L.hold = S.clock + 6 + rnd() * 6; }
      steer(dt, o.swim, 0.5);
      S.cur.setEffectiveTimeScale(0.6 + 0.9 * L.v / Math.max(0.1, o.swim));
      if (L.v > 0.12 && S.clock >= L.wake) { L.wake = S.clock + 0.4; B.touch(pos.x + Math.sin(S.heading) * 0.16 * k, pos.z + Math.cos(S.heading) * 0.16 * k, 'wake', K.wake[0], K.wake[1]); }
      const close = o.flush > 0 && B.boatDistance() < o.flush * (calm ? 1.3 : 1);
      if (S.clock >= L.timer || close || L.pend[0] === 'dive') { if (L.pend[0] === 'dive') L.pend.shift(); plunge(L.to); }
      return;
    }
    if (L.state === 'dive') {
      B.applyTravel();
      const bill = m.tip_bill;
      if (bill && bill.was !== null && bill.was > 0 && bill.y <= 0) { B.touch(bill.p.x, bill.p.z, 'dive', K.dive[0], K.dive[1]); L.scatter.push([S.clock + 0.33, bill.p.x, bill.p.z, 'dive', K.dive[0] * 0.55, K.dive[1]]); }
      if (B.done()) {                                                   // under the water: it levels off and goes on
        L.state = 'under'; B.emit('under');
        B.play('underwater', { fade: 0.2, loop: true });
        L.v = o.pace; L.down = S.clock + between(o.under, rnd) - B.dur('dive');
        if (L.to) L.target.set(L.to[0], 0, L.to.length > 2 ? L.to[2] : L.to[1]); else somewhere(L.target, pos, 10, 20);
        L.hold = S.clock + 5 + rnd() * 5;
      }
      return;
    }
    if (L.state === 'under') {
      const due = S.clock >= L.down || L.wantUp, far = B.boatDistance() >= o.shy, home = inside(pos.x, pos.z);
      if (!L.to && (S.clock > L.hold || Math.hypot(L.target.x - pos.x, L.target.z - pos.z) < 2)) { somewhere(L.target, pos, 8, 18); L.hold = S.clock + 5 + rnd() * 5; }
      steer(dt, o.pace * (calm ? 0.85 : 1), 0.9);
      // its depth: down to its travelling depth; up to where the surfacing begins when it is time, the boat is far enough and it is in its own water
      const rising = due && far && (L.to ? Math.hypot(L.target.x - pos.x, L.target.z - pos.z) < 2.5 : home);      // (a place it was told may lie outside its own water)
      if (due && !far && !L.longer) { L.longer = true; L.down = S.clock + 4; }           // the boat is over it: it stays down four seconds longer
      const want = rising ? -0.45 * k : -deep, vy = clamp((want - pos.y) * 1.6, -0.7, 0.7);
      L.vy += (vy - L.vy) * Math.min(1, dt / 0.4); pos.y = Math.min(-0.3 * k, pos.y + L.vy * dt);
      S.pitch += (Math.atan2(L.vy, Math.max(0.3, L.v)) - S.pitch) * Math.min(1, dt / 0.3);
      S.bank += (clamp(-L.turn * 0.35, -0.4, 0.4) - S.bank) * Math.min(1, dt / 0.4);
      S.cur.setEffectiveTimeScale(0.75 + 0.25 * L.v / o.pace);
      if (rising && pos.y > -0.47 * k && Math.abs(L.vy) < 0.12) {
        L.state = 'surface'; L.longer = false; L.to = null; pos.y = -0.45 * k;
        B.play('surface', { fade: 0.18 });
      }
      return;
    }
    if (L.state === 'surface') {
      B.applyTravel();
      S.pitch *= Math.exp(-dt / 0.15); S.bank *= Math.exp(-dt / 0.15);
      const head = m.head;
      if (head && head.was !== null && head.was <= 0 && head.y > 0) {
        B.emit('surface'); B.touch(head.p.x, head.p.z, 'surface', K.surface[0], K.surface[1]);
        for (let i = 0; i < 4; i++) L.scatter.push([S.clock + 0.15 + rnd() * 0.6, head.p.x + (rnd() - 0.5) * 0.7 * k, head.p.z + (rnd() - 0.5) * 0.7 * k, 'scatter', K.scatter[0], K.scatter[1]]);
      }
      if (B.done()) { float(0.25); B.emit('afloat'); }
    }
  }

  function update(dt) {
    if (!S.visible) return;
    const step = B.tick(dt, L.state === 'dry' || L.state === 'perch');
    if (!step) return;
    if (fishing) fish(step); else perched(step);
    for (let i = L.scatter.length - 1; i >= 0; i--) if (S.clock >= L.scatter[i][0]) { const s = L.scatter[i]; L.scatter.splice(i, 1); B.touch(s[1], s[2], s[3], s[4], s[5]); }
    const idle = L.state === 'dry' || L.state === 'perch' || L.state === 'afloat';
    // (its head: free while it simply stands or swims; with the rider inside `still` it comes back to the front slowly and stays; before anything else, quickly)
    B.gaze(step, !idle ? 'front' : L.state !== 'afloat' && B.eyeDistance() < o.still * (calm ? 1.3 : 1) ? 'rest' : 'life');
    if (L.state === 'afloat' || L.state === 'surface') B.keepClear(0.7 + 1.5 * k);
    B.place();
  }

  const bird = B.bird = {
    /** its Object3D */
    object: B.g, species: 'cormorant', present: true, handle: B.h,
    /** 'dry' | 'perch' | 'shiver' | 'shake' | 'fold' | 'spread' on its post; 'afloat' | 'dive' | 'under' | 'surface' fishing */
    get state() { return L.state; },
    get clip() { return S.curName; },
    get heading() { return S.heading; },
    /** true while it is under the water (from the moment its tail has gone until its head comes out) */
    get submerged() { return L.state === 'under' || (L.state === 'surface' && pos.y < -0.2 * k); },
    /** where it is: its feet on a perch; afloat, the water under the middle of its body; under water, its body (y below 0) */
    position: B.where,
    /** Fold its wings (perched, drying). It waits until the rider is more than `still` metres off; { force: true } does not wait. */
    fold(opts) { if (opts && opts.force && L.state === 'dry') begin('fold'); else L.want = 'perch'; return bird; },
    /** Hang its wings out again (perched, folded). The same waiting. */
    spread(opts) { if (opts && opts.force && L.state === 'perch') begin('spread'); else L.want = 'dry'; return bird; },
    /** Shake itself now (2.5 s), or shiver (1.5 s): from the drying pose only. */
    shake() { L.pend.push('shake'); return bird; },
    shiver() { L.pend.push('shiver'); return bird; },
    /** Fishing: dive now. { to: [x, z] }: and come up there. */
    dive(opts) { if (fishing) { L.to = opts && opts.to ? opts.to : null; if (L.state === 'afloat') L.pend.push('dive'); } return bird; },
    /**
     * Fishing: come up as soon as it may (it still keeps `shy` metres from the boat, and stays in its own water).
     * { at: [x, z] }: it makes for that place under the water (1.3 m/s: allow for the way) and comes up there; afloat,
     * it dives first.
     */
    comeUp(opts) {
      if (!fishing) return bird;
      const at = opts && opts.at ? opts.at : null;
      if (L.state === 'afloat') { if (at) { L.to = at; L.upThere = true; L.pend.push('dive'); } return bird; }
      L.wantUp = true;
      if (at) { L.to = at; L.target.set(at[0], 0, at.length > 2 ? at[2] : at[1]); }
      return bird;
    },
    /**
     * Put it in a state at once (for a cue's settle(), or to have it where a moment needs it): on a perch 'folded' |
     * 'dry'; fishing: { at: [x, z] } afloat there, or { at: [x, z], under: true } under the water there, staying
     * down until its time is up or comeUp() is called; with hold: true it stays down, going round that place, until
     * comeUp(), however long, and comes up within 2.5 m of it.
     */
    set(what) {
      if (!fishing) { L.want = null; L.pend.length = 0; stand(what === 'folded' || what === 'perch' ? 'folded' : 'dry'); B.open.value = S.wantOpen; }
      else {
        if (what && what.at) pos.set(what.at[0], 0, what.at.length > 2 ? what.at[2] : what.at[1]);
        if (what && what.under) {
          L.state = 'under'; L.to = what.hold ? [pos.x, pos.z] : null; L.wantUp = false; L.longer = false; pos.y = -deep; L.v = o.pace; L.vy = 0; S.pitch = 0; S.bank = 0; S.wantOpen = 0;
          B.play('underwater', { fade: 0, loop: true }); L.down = what.hold ? 1e9 : S.clock + between(o.under, rnd); L.hold = S.clock + 5 + rnd() * 5;
          if (L.to) L.target.set(pos.x, 0, pos.z); else somewhere(L.target, pos, 8, 18);      // (held: it keeps to that place, going round it, and comes up there)
        } else float();
      }
      B.place(); return bird;
    },
    hide() { B.hide(); return bird; },
    show() { B.show(); return bird; },
  };
  if (fishing) {
    if (o.at) kit.at(o.at[0], o.at[1] ?? 0, 0, pos); else if (o.position) pos.set(o.position[0], 0, o.position[2]); else somewhere(pos, box ? kit.at((box.s0 + box.s1) / 2, (box.d0 + box.d1) / 2, 0) : pond ? pond.c : pos, 0, 6);
    S.heading = rnd() * TAU; float();
    L.timer = S.clock + between(o.afloat, rnd) * (0.3 + 0.7 * rnd());
  } else {
    const p = B.perch(o); pos.copy(p.position); S.heading = p.heading;
    stand(o.wings === 'folded' ? 'folded' : 'dry'); B.open.value = S.wantOpen;
  }
  B.place(); B.mixer.update(1e-6);
  B.profile(update);
  return bird;
}

// ---------------------------------------------------------------------------------------------------- in the air (owl, tern)
/**
 * A flier's travel: it follows a path (flightPath) at a speed of its own, banking with the path's turning; it beats
 * its wings and, if it is told to, sets them and glides by turns, or stops over a place and hovers. B: the bird.
 * cfg: { speed, acc, dec, beats (a second), glide: { flap: [s, s], glide: [s, s] } | null, hover: seconds range, bank }
 */
function aloft(B, cfg) {
  const { S, pos, rnd, calm } = B;
  const F = { on: false, path: null, s: 0, v: 0, speed: cfg.speed, closed: false, gliding: false, hovering: false, next: 0, stops: null, stop: 0, hoverUntil: 0, lap: 0,
    drift: rnd() * TAU, base: new THREE.Vector3(), endless: false, after: null };
  const beatScale = () => (cfg.beats ? cfg.beats * B.dur('fly') : 1) * (calm ? 0.9 : 1);
  F.flap = (fade = 0.3, at = 0.3) => { F.gliding = false; B.play('fly', { fade, loop: true, time: at * B.dur('fly'), speed: beatScale() }); F.next = S.clock + (cfg.glide ? between(cfg.glide.flap, rnd) : 1e9); };
  /** Begin to follow a path. o: { v0 (speed now), speed, stops: [{ s, hold }] (hover stops by arc length), closed, after (called at the end) } */
  F.begin = (path, o = {}) => {
    if (!F.on) F.next = S.clock + (cfg.glide ? between(cfg.glide.flap, rnd) : 1e9);      // (a new path while it is in the air does not restart its round of beats and glides)
    F.on = true; F.path = path; F.s = o.s0 || 0; F.v = o.v0 ?? F.v; F.speed = (o.speed ?? cfg.speed) * (calm ? 0.8 : 1); F.closed = !!path.closed;
    F.stops = o.stops || null; F.stop = 0; F.hovering = false; F.after = o.after || null; F.lap = 0;
  };
  F.end = () => { F.on = false; F.hovering = false; };
  /** 0..1 of the wingbeat (0 = the top of the upstroke) while it beats; 0 while it glides. */
  F.phase = () => (S.curName === 'fly' && S.cur ? (S.cur.time / B.dur('fly')) % 1 : 0);
  /** Advance along the path. free: true while a clip of its own still plays (the end of a launch): then no clip is changed here. Returns true when the path's end is reached. */
  F.update = (dt, free = false) => {
    const L = F.path.length;
    let vmax = F.speed, stopAt = -1;
    if (F.stops && F.stop < F.stops.length) {                           // slowing to a hover
      const st = F.stops[F.stop], ds = st.s + F.lap * L - F.s;
      if (ds < -0.5 && !F.hovering) { F.stop++; if (F.closed && F.stop >= F.stops.length) { F.stop = 0; F.lap++; } }      // (passed while it could not stop: the next one)
      stopAt = ds;
      if (!F.hovering) vmax = Math.min(vmax, Math.sqrt(Math.max(0, 2 * cfg.dec * 0.5 * (ds - 0.05))) + 0.05);
    }
    if (F.hovering) {
      F.v = Math.max(0, F.v - cfg.dec * dt);
      if (S.clock >= F.hoverUntil) { F.hovering = false; F.stop++; if (F.closed && F.stop >= F.stops.length) { F.stop = 0; F.lap++; } if (!free) F.flap(0.35, 0.05); B.emit('flap'); }
    } else {
      F.v += clamp(vmax - F.v, -cfg.dec * dt, cfg.acc * dt);
      if (stopAt >= 0 && stopAt < 0.25 && F.v < 0.6 && !free) {          // it is there: it hangs on its wings and looks down
        F.hovering = true; F.hoverUntil = S.clock + between(F.stops[F.stop].hold ?? cfg.hover ?? [1.5, 3.5], rnd) * (calm ? 0.8 : 1);
        B.play('hover', { fade: 0.35, loop: true }); F.gliding = false; B.emit('hover');
      }
    }
    F.s += F.v * dt;
    if (!F.closed && F.s >= L - 0.01) { F.s = L; F.path.at(L, pos); return true; }
    F.path.at(F.s, pos); F.path.dir(F.s, _v);
    const kb = 1 - Math.exp(-dt / 0.35), slow = smooth(0.3, 2.5, F.v);
    if (F.v > 0.3) S.heading += wrap(Math.atan2(_v.x, _v.z) - S.heading) * (1 - Math.exp(-dt / 0.12));
    const turn = F.path.turn(F.s), climb = Math.asin(clamp(_v.y, -1, 1));
    S.bank += (clamp(Math.atan(F.v * F.v * turn / G) * (calm ? 0.4 : 0.85), -cfg.bank, cfg.bank) * slow - S.bank) * kb;
    S.pitch += (climb * 0.55 * slow - S.pitch) * kb;
    if (F.hovering) {                                                    // held over its place: a breath of drift, a slow rise and fall
      F.drift += dt;
      pos.x += Math.sin(F.drift * 0.9) * 0.05; pos.z += Math.cos(F.drift * 0.7) * 0.05; pos.y += Math.sin(F.drift * 1.6) * 0.035;
    } else if (!free && cfg.glide && S.clock >= F.next) {                // beats and glides by turns: it never glides while it climbs, nor into a hover
      if (!F.gliding) {
        const ph = F.phase();
        if (climb < 0.1 && (stopAt < 0 || stopAt > 6) && F.v > F.speed * 0.8 && ph < 0.12) { F.gliding = true; B.play('glide', { fade: 0.4, loop: true, time: rnd() * B.dur('glide') }); F.next = S.clock + between(cfg.glide.glide, rnd); B.emit('glide'); }
        else if (climb >= 0.1) F.next = S.clock + 0.5;
      } else { F.flap(0.3, 0.28); B.emit('flap'); }
    }
    if (F.gliding && climb > 0.16 && !free) { F.flap(0.3, 0.28); B.emit('flap'); }
    return false;
  };
  return F;
}

/** A route for a flier from points given by an area: [[x, y, z], ...], y the height of its BODY over the water. */
const routePoints = (list, pivot) => (list || []).map((p) => new THREE.Vector3(p[0], p[1] - pivot, p[2]));

/**
 * The part the owl and the tern share: leaving a perch by a clip that carries its own travel (`launch`, `lift`),
 * following a route, going round a closed one, being carried from outside. Returns the controls; `rest()` is the
 * species' own way of being on its perch.
 */
function flyer(B, cfg, clip, hooks) {
  const { S, pos, o, rnd, calm } = B;
  const F = aloft(B, cfg);
  const A = { state: 'perch', pending: null, launch: null, carried: null, gone: false, F };
  const tk = B.travel[clip], f0 = cfg.f0, beat = B.dur('fly');
  A.phase = () => (A.carried && A.carried.phase != null ? A.carried.phase : S.curName === clip && S.cur ? (S.cur.time > f0 ? ((S.cur.time - f0) / beat) % 1 : 0) : F.phase());
  A.ask = (kind, opts = {}) => { if (!A.gone) A.pending = { kind, opts: { ...opts } }; };
  function build(kind, opts, from, dirIn) {                            // the path for a request, from a place and a direction of travel
    const via = routePoints(kind === 'patrol' ? opts.over : opts.via, S.pivot || B.sp.air);
    if (kind === 'patrol') {
      const loop = flightPath(via, null, null, true);
      const stops = (opts.hover || []).map((i) => ({ s: loop.knots[i] ?? 0, hold: opts.hold })).sort((a, b) => a.s - b.s);
      const tan = loop.dir(0.01, new THREE.Vector3());
      const lead = flightPath([from, via[0]], dirIn, tan);
      return { lead, loop, stops, speed: opts.speed };
    }
    const end = opts.to ? new THREE.Vector3(opts.to[0], opts.to[1] - (S.pivot || B.sp.air), opts.to[2]) : null;
    const pts = [from, ...via]; if (end) pts.push(end);
    if (pts.length < 2) { const a = Math.atan2(pos.x - B.ctx.boat.x, pos.z - B.ctx.boat.z); pts.push(new THREE.Vector3(pos.x + Math.sin(a) * 120, pos.y + 8, pos.z + Math.cos(a) * 120)); }      // nowhere given: straight away from the boat, climbing
    return { lead: flightPath(pts, dirIn, pts[pts.length - 1].clone().sub(pts[pts.length - 2]).normalize()), loop: null, stops: null, speed: opts.speed };
  }
  function follow(R, v0) {
    const then = R.loop ? () => { F.begin(R.loop, { v0: F.v, speed: R.speed, stops: R.stops.length ? R.stops : null }); return false; } : null;
    F.begin(R.lead, { v0, speed: R.speed, after: then });
  }
  function depart() {
    const { kind, opts } = A.pending; A.pending = null;
    const first = kind === 'patrol' ? opts.over[0] : (opts.via && opts.via[0]) || opts.to;
    const turn = first ? clamp(wrap(Math.atan2(first[0] - pos.x, first[2] - pos.z) - S.heading), -cfg.turn, cfg.turn) : 0;
    const head = S.heading + turn;
    S.pivot = B.sp.air;                                                 // (from now it turns about the middle of its body, and that is where `position` says it is)
    const start = new THREE.Vector3().copy(tk.total).multiplyScalar(o.scale).applyAxisAngle(_up, head).add(pos);
    const dirIn = tk.vEnd.clone().applyAxisAngle(_up, head).normalize();
    A.launch = { heading0: S.heading, turn, R: null, kind, opts, start, dirIn, let: false, handed: false };
    A.state = 'launch'; S.wantOpen = 1;
    B.play(clip, { fade: 0.2, speed: calm ? 0.9 : 1 });
    B.emit('leave');
  }
  A.update = (dt) => {
    if (A.carried) {                                                    // driven from outside
      const c = A.carried, name = c.clip || 'fly';
      if (name !== S.curName) B.play(name, { fade: S.cur ? 0.3 : 0, loop: true });
      if (c.phase != null && S.curName === 'fly') { S.cur.setEffectiveTimeScale(0); S.cur.time = (((c.phase % 1) + 1) % 1) * B.dur('fly'); B.mixer.update(1e-6); }
      pos.set(c.position[0], c.position[1] - S.pivot, c.position[2]);
      S.heading = c.heading ?? S.heading; S.bank = c.bank ?? 0; S.pitch = c.pitch ?? 0;
      return;
    }
    if (A.state === 'perch') {
      if (A.pending) {
        if (A.pending.opts.wait > 0) { A.pending.opts.wait -= dt; return; }
        if (!A.pending.opts.force && cfg.clear > 0 && B.eyeDistance() < cfg.clear) return;      // no wing is opened this near the rider
        if (hooks.ready && !hooks.ready()) return;                       // (a sleeper wakes first)
        depart();
      }
      return;
    }
    if (A.state === 'launch') {
      const Lc = A.launch, t = S.cur.time;
      if (!Lc.handed) {
        S.heading = Lc.heading0 + Lc.turn * smooth(0, Math.max(0.05, tk.tStart), t);
        B.applyTravel();
        if (!Lc.let && t >= tk.tStart) { Lc.let = true; B.emit('lift'); }
        if (t >= tk.tEnd) {                                             // the clip's own travel is over: from here the path carries it, at the speed the travel had
          Lc.handed = true; Lc.start.copy(pos);
          follow(build(Lc.kind, Lc.opts, Lc.start, Lc.dirIn), tk.vEnd.length() * o.scale);
        }
      } else if (F.update(dt, true) && F.after && F.after()) return;
      if (B.done()) { A.state = 'fly'; F.flap(0.12, 0); }
      return;
    }
    if (A.state === 'fly') {
      if (A.pending && !F.hovering) {                                   // a new errand in the air: from where it is, the way it is going
        const { kind, opts } = A.pending; A.pending = null;
        const dir = new THREE.Vector3(Math.sin(S.heading), 0, Math.cos(S.heading));
        follow(build(kind, opts, pos.clone(), dir), F.v);
      }
      if (F.update(dt)) {
        if (F.after && F.after() === false) return;                     // the lead is flown: now round the loop
        A.state = 'gone'; A.gone = true; F.end(); B.hide(); B.mixer.stopAllAction(); S.cur = null; B.emit('gone');
      }
    }
  };
  A.carry = (c) => { A.carried = c; A.state = 'carried'; A.pending = null; S.pivot = B.sp.air; S.wantOpen = 1; B.show(); };
  return A;
}

// ---------------------------------------------------------------------------------------------------- the barn owl
/**
 * A barn owl: perched, upright and still, turning its head (never its body, and never toward the boat); it leaves by
 * leaning and dropping off its perch, its legs hanging for a moment, and flies low with slow deep beats and long
 * glides along the route it is given; it can quarter a closed route for as long as it is left to. options:
 *   at: [s, d] + y, or position: [x, y, z]     its perch (where its feet stand)
 *   face, turn      which way it looks: 'channel' | 'back' | 'along' | radians, plus turn radians (turn: Math.PI on
 *                   'channel' gives its back to the water: a perched owl should not present its face to the boat)
 *   gaze            { every: [6, 9], angle: [0.3, 0.6], stay: [4, 9] } (radians) or false
 *   flush           0: metres at which it leaves by itself, straight away from the boat (0 = only when told)
 *   speed           5: metres a second;  beats: 2.18 wingbeats a second (the snow's egret keeps this time);
 *   glide           { flap: [1.6, 2.8], glide: [1.0, 2.2] }: seconds it beats and seconds it glides, by turns; false: it only beats
 *   keepOut         3: metres its body keeps from the rider's eye whatever its route says
 *   seed, onEvent(name, bird) with 'leave' | 'lift' (its feet let go) | 'glide' | 'flap' | 'gone', only, parent, scale,
 *   material, optional, profile. It writes nothing on the water and makes no sound.
 * Resolves to the bird: see the object at the end of this function.
 */
export async function makeOwl(ctx, options = {}) {
  const controls = ['leave', 'quarter', 'carry', 'place', 'hide', 'show'];
  if (left(ctx, options)) return absent('owl', controls);
  const sp = SPECIES.owl;
  const B = await embody(ctx, 'owl', { ...options, gaze: options.gaze === false ? false : { every: [6, 9], angle: [0.3, 0.6], stay: [4, 9], share: 0.25, ...(options.gaze || {}) } },
    { flush: 0, speed: sp.speed, beats: sp.beats, keepOut: sp.keepOut });
  const { o, S, pos, calm } = B;
  const glide = o.glide === false ? null : { flap: [1.6, 2.8], glide: [1.0, 2.2], ...(o.glide || {}) };
  const A = flyer(B, { speed: o.speed, acc: sp.acc, dec: 3, beats: o.beats, glide, bank: 0.5, turn: 1.2, clear: 0, f0: 15 / 24 }, 'launch', {});
  const perch = B.perch(o);
  function settle() { pos.copy(perch.position); S.heading = perch.heading; S.pitch = 0; S.bank = 0; S.pivot = 0; S.wantOpen = 0; A.state = 'perch'; A.carried = null; A.gone = false; A.F.end(); B.show(); B.play('perch', { fade: 0, loop: true, time: B.rnd() * B.dur('perch') }); }
  function update(dt) {
    if (!S.visible) return;
    const step = B.tick(dt, A.state === 'perch' && !A.pending);
    if (!step) return;
    if (A.state === 'perch' && !A.pending && o.flush > 0 && B.boatDistance() < o.flush * (calm ? 1.4 : 1)) A.ask('leave');
    A.update(step);
    if (A.state === 'gone') return;
    const flying = A.state !== 'perch';
    if (flying && !A.carried) B.keepClear(Math.max(1.6, o.keepOut) * (calm ? 1.5 : 1));
    B.gaze(step, A.state === 'perch' && !A.pending ? 'life' : 'front', flying ? S.bank * 0.9 : 0);      // in the air its head stays level while the body banks under it
    B.place();
  }
  const bird = B.bird = {
    object: B.g, species: 'owl', present: true, handle: B.h,
    /** 'perch' | 'launch' | 'fly' | 'carried' | 'gone' */
    get state() { return A.state; },
    get clip() { return S.curName; },
    get heading() { return S.heading; },
    /** radians it is banked (to hand to a wader's carry(), with heading and phase: the snow's egret under it) */
    get bank() { return S.bank; },
    /** 0..1 of its wingbeat (0 = the top of the upstroke); 0 while it glides */
    get phase() { return A.phase(); },
    /** true while its wings are set */
    get gliding() { return A.F.gliding; },
    /** where it is: its feet on the perch; in the air, the middle of its body */
    position: B.where,
    /** Leave the perch (or, in the air, its round) and fly away: { via: [[x, y, z], ...], to: [x, y, z] (where it is last seen), speed, wait }. y is the height of its body. */
    leave(opts) { A.ask('leave', opts); return bird; },
    /** Quarter a closed route for as long as it is left to: { over: [[x, y, z], ...] (three points or more, gone round in order), speed }. */
    quarter(opts) { A.ask('patrol', opts); return bird; },
    /** Take it over: c = { position: [x, y, z] (its body), heading, bank, pitch, phase (0..1), clip: 'fly' | 'glide' }, read every frame. */
    carry(c) { A.carry(c); return bird; },
    /** Put it back on its perch at once (for a cue's settle(), or to use it again). */
    place() { settle(); B.place(); return bird; },
    hide() { B.hide(); return bird; },
    show() { B.show(); return bird; },
  };
  settle(); B.place(); B.mixer.update(1e-6);
  B.profile(update);
  return bird;
}

// ---------------------------------------------------------------------------------------------------- the tern
/**
 * A tern: on a post, asleep (down on its feet, the head drawn in, or the bill tucked over a shoulder) or standing
 * awake; a sleeper stirs now and then, and draws its head out for a while when the boat comes very near, without
 * looking at it; it leaves by springing off the post (never while the rider is within `clear` metres: no wing is
 * opened that near), flies with deep elastic beats along the route it is given, and can go round a closed route,
 * stopping over given places to hover and look down. options:
 *   at: [s, d] + y, or position: [x, y, z]     the top of its post (where its feet stand)
 *   face, turn      which way it looks: 'channel' | 'back' | 'along' | radians, plus turn radians
 *   rest            'doze' | 'sleep' | 'sleep_r' | 'stand', or 'asleep' (the default: one of the three sleeping ways, by its seed)
 *   life            { every: [20, 50] }: seconds between a sleeper's stirrings (a shuffle, 1.5 s, or its head resettled, 2 s);
 *                   false: it does not stir by itself
 *   wake            5: metres (from the rider's eye) inside which a sleeper draws its head out (1 s), holds 4 to 8 s, and
 *                   settles again (1.5 s). 0: it sleeps on
 *   clear           20: metres. It does not open a wing while the rider is nearer: a leave() waits (unless { force: true })
 *   speed           8: metres a second;  beats: 3.2 wingbeats a second;  keepOut: 2.5 metres from the rider's eye
 *   seed, onEvent(name, bird) with 'wake' | 'settle' | 'shuffle' | 'nod' | 'leave' | 'lift' (its feet leave) | 'hover' | 'flap' | 'gone',
 *   gaze, only, parent, scale, material, optional, profile.
 * Resolves to the bird: see the object at the end of this function.
 */
export async function makeTern(ctx, options = {}) {
  const controls = ['leave', 'patrol', 'carry', 'place', 'rest', 'look', 'shuffle', 'hide', 'show'];
  if (left(ctx, options)) return absent('tern', controls);
  const sp = SPECIES.tern;
  const B = await embody(ctx, 'tern', options, { rest: 'asleep', wake: 5, clear: 20, speed: sp.speed, beats: sp.beats, keepOut: sp.keepOut });
  const { o, S, pos, rnd, calm } = B;
  const life = o.life === false ? null : { every: [20, 50], ...(o.life || {}) };
  const A = flyer(B, { speed: o.speed, acc: sp.acc, dec: 6, beats: o.beats, glide: null, hover: [1.5, 3.5], bank: 0.6, turn: 0.9, clear: o.clear, f0: 8 / 24 }, 'lift',
    { ready: () => { if (T.kind !== 'stand' || T.act) { if (!T.act) rouse(true); return false; } return true; } });
  const perch = B.perch(o);
  const r0 = rnd();
  const T = { kind: o.rest === 'asleep' ? (r0 < 0.5 ? 'doze' : r0 < 0.75 ? 'sleep' : 'sleep_r') : o.rest, home: '', act: '', next: 0, hold: 0, leaving: false, turn: 0 };
  T.home = T.kind;                                                     // the way of resting it goes back to
  const OUT = { doze: 'wake', sleep: 'untuck', sleep_r: 'untuck_r' }, IN = { doze: 'settle', sleep: 'tuck', sleep_r: 'tuck_r' }, STIR = { doze: ['shuffle', 'nod'], sleep: ['stir'], sleep_r: ['stir_r'], stand: ['shuffle'] };
  const idle = (fade = 0) => { T.act = ''; B.play(T.kind, { fade, loop: true, time: fade ? 0 : rnd() * B.dur(T.kind) }); T.next = S.clock + (life ? between(life.every, rnd) * (fade ? 1 : 0.3 + 0.7 * rnd()) : 1e9); };
  function rouse(toLeave = false) {                                    // out of its sleep, into standing
    if (T.kind === 'stand' || T.act) return;
    T.act = OUT[T.kind]; T.kind = 'stand'; T.leaving = toLeave;
    B.play(T.act, { fade: 0.25, speed: toLeave ? 1.3 : 1 }); B.emit('wake');
    T.hold = S.clock + B.dur(T.act) + (toLeave ? 0 : (4 + rnd() * 4));
  }
  function lie(kind) {                                                 // from standing down into a way of sleeping
    if (T.kind !== 'stand' || T.act || kind === 'stand') return;
    T.act = IN[kind]; T.kind = kind; B.play(T.act, { fade: 0.3 }); B.emit('settle');
  }
  function stir(name) {
    if (T.act) return;
    const list = STIR[T.kind] || [], act = name && list.includes(name) ? name : list[Math.floor(rnd() * list.length)];
    if (!act || (T.kind === 'stand' && act === 'shuffle' && !B.acts.shuffle)) return;
    if (T.kind === 'stand') return;                                    // (awake, it only stands and looks about)
    T.act = act; T.turn = act === 'shuffle' ? (rnd() - 0.5) * 0.35 : 0; B.play(act, { fade: 0.3 }); B.emit(act === 'shuffle' ? 'shuffle' : 'nod');
  }
  function resting(dt) {
    const near = o.wake > 0 && B.eyeDistance() < o.wake * (calm ? 1.2 : 1);
    if (T.act) {
      if (T.turn) S.heading += T.turn * dt / B.dur('shuffle');           // a shuffle turns it a little where it sits
      if (B.done()) { const was = T.act; T.act = ''; T.turn = 0; idle(0.3); if (was === OUT.doze || was === OUT.sleep || was === OUT.sleep_r) T.next = 1e9; }
      return;
    }
    if (T.kind === 'stand' && T.home !== 'stand') {                     // awake for a while: then down again, once the boat has gone by
      if (A.pending) return;
      if (S.clock >= T.hold && !near) lie(T.home);
      return;
    }
    if (T.kind !== 'stand' && near) { rouse(); return; }
    if (life && S.clock >= T.next) stir();
  }
  function settle(kind) {
    pos.copy(perch.position); S.heading = perch.heading; S.pitch = 0; S.bank = 0; S.pivot = 0; S.wantOpen = 0;
    A.state = 'perch'; A.carried = null; A.gone = false; A.pending = null; A.F.end(); B.show();
    if (kind) { T.kind = kind; T.home = kind; }
    idle(0);
  }
  function update(dt) {
    if (!S.visible) return;
    const step = B.tick(dt, A.state === 'perch' && !A.pending && !T.act);
    if (!step) return;
    if (A.state === 'perch') resting(step);
    A.update(step);
    if (A.state === 'gone') return;
    const flying = A.state !== 'perch';
    if (flying && !A.carried) B.keepClear(Math.max(1.4, o.keepOut) * (calm ? 1.5 : 1));
    B.gaze(step, !flying && T.kind === 'stand' && !T.act && T.home === 'stand' && !A.pending ? 'life' : 'front', flying ? S.bank * 0.8 : 0);
    B.place();
  }
  const bird = B.bird = {
    object: B.g, species: 'tern', present: true, handle: B.h,
    /** 'perch' | 'launch' | 'fly' | 'carried' | 'gone' */
    get state() { return A.state; },
    /** on its post: 'doze' | 'sleep' | 'sleep_r' | 'stand' */
    get resting() { return T.kind; },
    get clip() { return S.curName; },
    get heading() { return S.heading; },
    get bank() { return S.bank; },
    get phase() { return A.phase(); },
    /** true while it hangs over a place and looks down */
    get hovering() { return A.F.hovering; },
    /** where it is: its feet on the post; in the air, the middle of its body */
    position: B.where,
    /** Spring off the post and fly away: { via: [[x, y, z], ...], to: [x, y, z], speed, wait, force }. A sleeper wakes first (1 s). It waits while the rider is within `clear` metres. */
    leave(opts) { A.ask('leave', opts); return bird; },
    /** Go round a closed route: { over: [[x, y, z], ...], speed, hover: [indices of the points over which it stops to hover], hold: [1.5, 3.5] seconds }. */
    patrol(opts) { A.ask('patrol', opts); return bird; },
    /** Take it over: c = { position (its body), heading, bank, pitch, phase, clip: 'fly' | 'glide' | 'hover' }, read every frame. */
    carry(c) { A.carry(c); return bird; },
    /** Change its way of resting: 'doze' | 'sleep' | 'sleep_r' | 'stand' (it gets up or lies down by its own clips). */
    rest(kind) { T.home = kind; if (kind === 'stand') rouse(); else if (T.kind === 'stand') lie(kind); T.hold = 0; return bird; },
    /** A sleeper draws its head out now and holds it up a while (what it does by itself within `wake` metres). */
    look() { if (A.state === 'perch') rouse(); return bird; },
    /** A sleeper shifts on its feet now. */
    shuffle() { if (A.state === 'perch') stir('shuffle'); return bird; },
    /** Put it back on its post at once: place('doze') (for a cue's settle(), or to use it again). */
    place(kind) { settle(kind); B.place(); return bird; },
    hide() { B.hide(); return bird; },
    show() { B.show(); return bird; },
  };
  settle(); B.place(); B.mixer.update(1e-6);
  B.profile(update);
  return bird;
}
