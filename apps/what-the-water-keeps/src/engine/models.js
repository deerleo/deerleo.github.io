// Models: hand-made GLB files in the ride. The files are written by Blender scripts (tools/blender_lib/qc.py; the
// manual is docs/modelling.md): one mesh per model, vertex-painted, no textures, +Y up, front toward +Z. A realm
// reaches this through three kit helpers:
//
//   const jetty = await kit.model('models/examples/jetty.glb', { at: [40, -9, 0], face: 'channel', caustics: true });
//   jetty.parts.ring.rotation.z = 0.3;                         // named parts stay separate objects a realm can move
//   const drip = wheel.point('drip_lip');                      // a named place on a model (qc.export(points=...)), in the realm
//
//   await kit.models('models/examples/apple_tree_far.glb',     // the same model many times: one draw call per material
//     [{ at: [60, 14], turn: 1.2, scale: 0.9, tint: '#fff2e0' }, ...], { sway: { strength: 0.05, from: 3, to: 9 } });
//
//   const heron = await kit.animated('models/examples/heron.glb', { at: [50, 7, -0.1], face: 'channel', clip: 'stand' });
//   heron.play('takeoff', { loop: false, then: 'fly' });       // cross-fades; each call to kit.animated is its own copy
//
// Every mesh is dressed in the ride's gouache material with vertex colours on, so a model takes the realm's light,
// fog and veil like everything else built, and shows in the water's mirror and in the scene pre-pass because it is an
// ordinary object in the realm. A file is fetched and parsed once however many realms and copies use it, counted
// (modelReport), and dropped when the last realm that used it is thrown away.
//
// What it costs: a kit.model is one draw call per mesh in the file (the body, plus one per moving part), three times
// a frame (pre-pass, mirror, picture); kit.models is one per material however many copies; kit.animated is one per
// copy plus its bones. A model that stands still costs nothing else: its matrices are frozen once it is placed.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { makeGouache } from './gouache.js';

// (Problems are logged with a word that starts INVALID_, because tools/shot.py prints console lines that contain it:
// in the headless browser a plain console.error does not come through as an error.)
const cache = new Map();                       // file -> record
const loader = new GLTFLoader();
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _p = new THREE.Vector3(), _s = new THREE.Vector3(), _e = new THREE.Euler(), _c = new THREE.Color(), _loc = {};
const resolve = (url) => (url.startsWith('http') || url.startsWith('/') || url.startsWith('assets/') ? url : 'assets/' + url);
const stem = (url) => url.split('/').pop().replace(/\.glb$/i, '');
// gouache options a caller may pass straight through (src/engine/gouache.js lists what each does)
const PASS = ['color', 'map', 'triplanar', 'brush', 'shade', 'steps', 'emissive', 'emissiveIntensity', 'caustics', 'backlight', 'backColor', 'rim', 'sway', 'side', 'flat', 'cutout', 'transparent', 'opacity', 'crisp', 'extend'];

/** Fetch and parse a GLB once. Resolves to its record: { scene, clips, skinned, triangles, bytes, ... }. */
function load(url) {
  const key = resolve(url);
  let rec = cache.get(key);
  if (!rec) {
    rec = { key, name: stem(key), refs: 0, uses: 0, bytes: 0, triangles: 0, scene: null, clips: [], skinned: false, merged: null };
    rec.promise = fetch(key)
      .then((r) => { if (!r.ok) throw new Error(`model ${key}: ${r.status} ${r.statusText}`); return r.arrayBuffer(); })
      .then((buf) => { rec.bytes = buf.byteLength; return loader.parseAsync(buf, ''); })
      .then((gltf) => {
        rec.scene = gltf.scene; rec.clips = gltf.animations || [];
        rec.scene.updateMatrixWorld(true);
        const turned = new Set();
        rec.scene.traverse((o) => {
          if (!o.isMesh) return;
          if (o.isSkinnedMesh) rec.skinned = true;
          const g = o.geometry, src = o.material;
          rec.triangles += (g.index ? g.index.count : g.attributes.position.count) / 3;
          // a glTF file counts v downward from the top of a picture; Blender and the ride's textures count it upward.
          // Turn the model's UVs the ride's way, once, so a picture laid on them (`map`) arrives the right way up.
          const uv = g.attributes.uv;
          if (uv && !turned.has(uv)) { turned.add(uv); for (let i = 0; i < uv.count; i++) uv.setY(i, 1 - uv.getY(i)); }
          // all that is kept of the file's material is its name (the slot a realm can address) and whether it is two-sided
          o.userData.slot = (src && src.name) || 'paint';
          o.userData.twoSided = !!src && src.side === THREE.DoubleSide;
          if (src && src.dispose) src.dispose();
          o.material = null;
          if (!g.attributes.color) console.error(`INVALID_MODEL ${key}: mesh "${o.name}" has no vertex colours (it will be drawn in one flat colour)`);
        });
        return rec;
      });
    cache.set(key, rec);
    rec.promise.catch(() => { if (cache.get(key) === rec) cache.delete(key); });                 // a failed load may be tried again
  }
  return rec.promise;
}

/** A realm takes hold of a file (once per realm) and lets go when it is disposed. */
async function hold(ctx, held, url) {
  const rec = await load(url);
  rec.uses++;
  if (!held.has(rec)) {
    held.add(rec); rec.refs++;
    ctx.onDispose(() => {
      if (--rec.refs > 0) return;
      cache.delete(rec.key);
      rec.scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
      if (rec.merged) for (const set of rec.merged) set.geometry.dispose();
      rec.merged = null;
    });
  }
  return rec;
}

/** What is loaded now: [{ file, kB, triangles, realms, uses }] (for the console and for perf notes). */
export function modelReport() {
  return [...cache.values()].map((r) => ({ file: r.key, kB: Math.round(r.bytes / 1024), triangles: Math.round(r.triangles), realms: r.refs, uses: r.uses, clips: r.clips.map((c) => c.name) }));
}

function materialOptions(opts, slot, twoSided, hasColor) {
  const o = { vertexColors: hasColor };
  for (const k of PASS) if (opts[k] !== undefined) o[k] = opts[k];
  if (o.side === undefined && twoSided) o.side = THREE.DoubleSide;
  if (opts.materials && opts.materials[slot]) Object.assign(o, opts.materials[slot]);
  return o;
}

/** Give every mesh under root its gouache material: one material per slot name, shared by all meshes that use it. */
function dress(engine, root, opts) {
  const mats = {};
  root.traverse((o) => {
    if (!o.isMesh) return;
    const slot = o.userData.slot || 'paint', key = slot + (o.userData.twoSided ? '|2' : '');
    o.material = mats[key] || (mats[key] = makeGouache(engine, materialOptions(opts, slot, o.userData.twoSided, !!o.geometry.attributes.color)));
    mats[slot] = mats[key];
  });
  return mats;
}

/**
 * Where a thing goes. One placement, for all three helpers:
 *   at: [s, d, y]            along the waterway: s metres along, d metres right of the centreline, height y (default 0)
 *   position: [x, y, z]      or the realm's own coordinates
 *   face                     which way its front (+Z; Blender's -Y) looks: 'channel' | 'back' | 'along' (see kit.place) or radians
 *   turn                     extra turn about the vertical, radians (added to `face`)
 *   rotation: [x, y, z]      a full rotation instead, applied heading first (YXZ); `face` and `turn` add to its y
 *   scale                    a number or [x, y, z]
 */
function compose(ctx, kit, p, pos, quat, scl) {
  let s = 0, d = 0;
  if (p.at) { s = p.at[0]; d = p.at[1] ?? 0; kit.at(s, d, p.at[2] ?? 0, pos); }
  else if (p.position) { if (p.position.isVector3) pos.copy(p.position); else pos.set(p.position[0], p.position[1], p.position[2]); if (typeof p.face === 'string') { ctx.path.locate(pos.x, pos.z, null, _loc); s = _loc.s; d = _loc.d; } }
  else pos.set(0, 0, 0);
  const r = Array.isArray(p.rotation) ? p.rotation : [0, typeof p.rotation === 'number' ? p.rotation : 0, 0];
  const ry = r[1] + (p.face != null ? kit.faceAngle(p.face, s, d) : 0) + (p.turn || 0);
  quat.setFromEuler(_e.set(r[0], ry, r[2], 'YXZ'));
  const sc = p.scale == null ? 1 : p.scale;
  if (typeof sc === 'number') scl.setScalar(sc); else scl.set(sc[0], sc[1], sc[2]);
}

function settle(group, live) {
  group.updateMatrix(); group.updateMatrixWorld(true);
  if (!live) group.matrixAutoUpdate = false;
}

// A named point is a node of the file with nothing in it (qc.export(points={...})): a place a realm needs to find.
const isPoint = (o) => !o.isMesh && !o.isBone && o.children.length === 0;
/** point(name, target): where a named point is now, in the realm's own space like everything a realm places (it
 *  follows the model, its moving parts, its bones). Pass a Vector3 of your own to be filled if you ask every frame. */
function pointFinder(ctx, rec, group, points) {
  return (name, target = new THREE.Vector3()) => {
    let o = points[name];
    if (!o) { console.error(`INVALID_MODEL ${rec.key} has no point "${name}" (it has: ${Object.keys(points).join(', ') || 'none'})`); o = group; }
    o.getWorldPosition(target);
    return ctx.group ? ctx.group.worldToLocal(target) : target;
  };
}

/**
 * One model. opts: a placement (see compose), any gouache option (brush, shade, steps, caustics, backlight, emissive,
 * sway, color as a tint over the paint, ...), and
 *   materials: { slotName: { ...gouache options } }   options for one named material slot of the file (qc.material)
 *   live: true                                        the realm will move the whole model every frame (default: frozen)
 *   collide: radius                                   the boat steers round it: the thing's own radius at the waterline plus
 *                                                     about 0.3 m (the engine adds the boat's own 0.95 m). A long thing takes a
 *                                                     row of circles instead: collide: [[x, z, r], ...] in the model's own
 *                                                     metres as the ride sees it (x as in Blender, z = -(Blender y))
 * Resolves to { group, parts, points, point(name), body, materials, set(placement) }:
 *   parts       every named object in the file by name; moving parts (qc.export(..., parts=[...])) are live: set their
 *               rotation or position and they move. Blender (x, y, z) is (x, z, -y) here: a part that turns about
 *               Blender's Y turns about -Z in the ride.
 *   point(name) where a named point of the model (qc.export(..., points={...})) is in the realm now, as a Vector3: the
 *               lip a drip falls from, the hook a lamp hangs on. It follows the model and the moving part it rides on.
 *               (`points` holds the objects themselves, by name.) An instanced model (kit.models) has no points.
 *   set(p)      place the model again (it is frozen between calls unless `live`)
 */
export async function model(engine, ctx, kit, held, url, opts = {}) {
  const rec = await hold(ctx, held, url);
  const group = rec.skinned ? cloneSkinned(rec.scene) : rec.scene.clone(true);
  group.name = opts.name || rec.name;
  const materials = dress(engine, group, opts);
  const parts = {}, points = {};
  let body = null;
  group.traverse((o) => {
    if (o === group) return;
    if (o.name) parts[o.name] = o;
    if (o.name && isPoint(o)) points[o.name] = o;
    if (o.isMesh && (!body || o.name === rec.name)) body = o;
    // the body (named after the file) and anything inside it never moves by itself: freeze it. A named part is the
    // realm's to move, so it stays live. (A skinned file shown with kit.model stands in its rest pose, all frozen.)
    const fixed = rec.skinned || o.name === rec.name || (o.parent && o.parent !== group && o.parent.name === rec.name);
    o.updateMatrix();
    if (fixed) o.matrixAutoUpdate = false;
  });
  const api = {
    group, parts, points, point: pointFinder(ctx, rec, group, points), body, materials, triangles: Math.round(rec.triangles),
    set(p) { compose(ctx, kit, p, group.position, group.quaternion, group.scale); settle(group, opts.live); return api; },
  };
  api.set(opts);
  if (opts.collide) {
    const k = Math.max(Math.abs(group.scale.x), Math.abs(group.scale.z));
    for (const c of Array.isArray(opts.collide) ? opts.collide : [[0, 0, opts.collide]]) {
      _p.set(c[0], 0, c[1]).applyMatrix4(group.matrix);                      // (the realm's own space, like everything a realm places)
      ctx.addCollider({ x: _p.x, z: _p.z, r: c[2] * k });
    }
  }
  ctx.add(group);
  return api;
}

/** The file's meshes merged into one geometry per material slot, in the model's own space (made once per file). */
function mergedSets(rec) {
  if (rec.merged) return rec.merged;
  const bySlot = new Map();
  rec.scene.traverse((o) => {
    if (!o.isMesh) return;
    const key = (o.userData.slot || 'paint') + (o.userData.twoSided ? '|2' : '');
    if (!bySlot.has(key)) bySlot.set(key, { slot: o.userData.slot || 'paint', twoSided: o.userData.twoSided, list: [] });
    bySlot.get(key).list.push(o);
  });
  rec.merged = [];
  for (const set of bySlot.values()) {
    const keep = ['position', 'normal', 'color', 'uv'].filter((k) => set.list.every((o) => o.geometry.attributes[k]));
    const geos = set.list.map((o) => {
      const g = new THREE.BufferGeometry();
      for (const k of keep) g.setAttribute(k, o.geometry.attributes[k].clone());
      if (o.geometry.index) g.setIndex(o.geometry.index.clone());
      return g.applyMatrix4(o.matrixWorld);
    });
    const geometry = geos.length === 1 ? geos[0] : mergeGeometries(geos, false);
    if (geos.length > 1) geos.forEach((g) => g.dispose());
    geometry.computeBoundingSphere(); geometry.computeBoundingBox();
    rec.merged.push({ slot: set.slot, twoSided: set.twoSided, geometry });
  }
  return rec.merged;
}

/**
 * The same model many times, instanced: one draw call per material slot however many copies there are. For kit
 * pieces (bays of a balcony, posts of a fence) and multitudes (an orchard, a field of stones).
 *   placements   [{ at | position, face, turn, rotation, scale, tint }, ...]  (see compose); tint multiplies the
 *                model's paint, so '#ffffff' leaves it as painted and a pale colour shifts each copy a little
 *   opts         gouache options and materials: { slot: {...} }, as for kit.model
 * Moving parts are merged in where they stand (an instanced model has no parts), and skinned models cannot be
 * instanced this way. Resolves to { group, meshes, count, place(i, placement), tint(i, color) }.
 */
export async function models(engine, ctx, kit, held, url, placements, opts = {}) {
  const rec = await hold(ctx, held, url);
  if (rec.skinned) throw new Error(`kit.models: ${rec.key} is a skinned model; use kit.animated for each copy`);
  const sets = mergedSets(rec), n = placements.length;
  const group = new THREE.Group(); group.name = (opts.name || rec.name) + ' x' + n;
  const tinted = placements.some((p) => p.tint != null || p.color != null) || opts.tintable;
  const meshes = sets.map((set) => {
    const mesh = new THREE.InstancedMesh(set.geometry, makeGouache(engine, materialOptions(opts, set.slot, set.twoSided, !!set.geometry.attributes.color)), n);
    mesh.name = rec.name + ':' + set.slot;
    group.add(mesh);
    return mesh;
  });
  const write = (i, p) => {
    compose(ctx, kit, p, _p, _q, _s); _m.compose(_p, _q, _s);
    for (const mesh of meshes) mesh.setMatrixAt(i, _m);
    if (tinted) { _c.set(p.tint ?? p.color ?? '#ffffff'); for (const mesh of meshes) mesh.setColorAt(i, _c); }
  };
  const flush = () => {
    for (const mesh of meshes) {
      mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      mesh.computeBoundingSphere();                        // so the whole batch is skipped when none of it is in view
      if (opts.sway) mesh.boundingSphere.radius += 2;
    }
  };
  placements.forEach((p, i) => write(i, p));
  flush();
  settle(group, false);
  ctx.add(group);
  return {
    group, meshes, count: n, triangles: Math.round(rec.triangles) * n,
    place(i, p) { write(i, p); flush(); },
    tint(i, color) { if (!tinted) return; _c.set(color); for (const mesh of meshes) { mesh.setColorAt(i, _c); mesh.instanceColor.needsUpdate = true; } },
  };
}

/**
 * A rigged, animated model: its own copy of the skeleton, its clips on an AnimationMixer that the realm's update
 * advances, cross-fades between clips. Call it once per creature; every call is an independent copy.
 *   opts   a placement, gouache options, materials: {...}, and
 *          clip: 'name'      start in this clip (default: none: it stands in its rest pose and costs nothing)
 *          speed, phase      playback speed, and where in the clip to start (0..1), so copies are not in step
 * Resolves to {
 *   group                     move and turn this (it is live: animated things usually travel)
 *   clips                     the clip names;  duration(name)  seconds
 *   play(name, { fade = 0.35, loop = true, speed, phase, then, onDone })
 *                             cross-fade to a clip. loop: false plays it once and holds the last pose; `then` names the
 *                             clip to go on to when it ends (take-off into flight); onDone() is called when it ends
 *   pause(), resume()         stop and restart the clock (a paused creature costs no update)
 *   bones                     the bones by name (a realm may turn a head toward something, after the mixer has run)
 *   point(name)               where a named point (qc.export(..., points={'muzzle': ((x, y, z), 'head')})) is in the
 *                             realm now, as a Vector3: it rides on its bone, so it is where the muzzle is in this pose
 *   mixer, actions            three.js's own objects, for anything else
 * }
 * The clock needs nothing from the realm: every copy advances itself each frame while a clip is playing.
 * Names: the loader strips dots and spaces from bone and clip names ('wing.L' arrives as 'wingL'): use _L and _R.
 */
export async function animated(engine, ctx, kit, held, url, opts = {}) {
  const rec = await hold(ctx, held, url);
  const group = cloneSkinned(rec.scene);
  group.name = opts.name || rec.name;
  const materials = dress(engine, group, opts);
  const bones = {}, parts = {}, points = {}, skeletons = new Set();
  group.traverse((o) => {
    if (o.isBone) bones[o.name] = o; else if (o !== group && o.name) parts[o.name] = o;
    if (o !== group && o.name && isPoint(o)) points[o.name] = o;
    if (o.isSkinnedMesh) {
      skeletons.add(o.skeleton);
      // the mesh is culled by where it stood when it was bound; wings and necks reach further than that
      o.computeBoundingSphere(); o.boundingSphere.radius *= 1.6;
    }
  });
  const mixer = new THREE.AnimationMixer(group), actions = {};
  for (const clip of rec.clips) actions[clip.name] = mixer.clipAction(clip);
  let current = null, playing = false, speed = opts.speed ?? 1, next = null, done = null;
  // While no clip runs, the bones are frozen where they are (their matrices are not rebuilt every frame); the group
  // itself stays live, so a still creature can be carried about.
  const boneList = Object.values(bones);
  const live = (on) => { for (const b of boneList) { if (!on) b.updateMatrix(); b.matrixAutoUpdate = on; } };
  const run = (on) => { if (on !== playing) { playing = on; live(on); } };
  const api = {
    group, parts, bones, points, point: pointFinder(ctx, rec, group, points), materials, mixer, actions, clips: Object.keys(actions), triangles: Math.round(rec.triangles),
    get current() { return current ? current.getClip().name : null; },
    get playing() { return playing; },
    get time() { return current ? current.time : 0; },
    duration(name) { return actions[name] ? actions[name].getClip().duration : 0; },
    set(p) { compose(ctx, kit, p, group.position, group.quaternion, group.scale); return api; },
    play(name, o = {}) {
      const a = actions[name];
      if (!a) { console.error(`INVALID_CLIP ${rec.key} has no clip "${name}" (it has: ${api.clips.join(', ')})`); return api; }
      const fade = o.fade ?? 0.35, loop = o.loop ?? true;
      if (o.speed != null) speed = o.speed;
      next = o.then || null; done = o.onDone || null;
      if (a === current && playing && loop) return api;
      a.reset(); a.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, Infinity); a.clampWhenFinished = !loop; a.enabled = true; a.setEffectiveWeight(1);
      if (o.phase != null) a.time = (o.phase % 1) * a.getClip().duration;
      a.play();
      if (current && current !== a && fade > 0) a.crossFadeFrom(current, fade, false); else if (current && current !== a) current.stop();
      current = a; run(true);
      return api;
    },
    pause() { run(false); return api; },
    resume() { run(!!current); return api; },
    stop() { mixer.stopAllAction(); current = null; run(false); return api; },
  };
  mixer.addEventListener('finished', (e) => {
    if (e.action !== current) return;
    const fn = done, then = next; done = null; next = null;
    if (then) api.play(then, { fade: 0.3 }); else run(false);            // it holds its last pose and stops costing anything
    if (fn) { try { fn(api); } catch (err) { console.error(err); } }
  });
  ctx.onUpdate((dt) => { if (playing) mixer.update(dt * speed); });
  ctx.onDispose(() => { mixer.stopAllAction(); mixer.uncacheRoot(group); for (const sk of skeletons) sk.dispose(); });
  api.set(opts);
  live(false);
  if (opts.clip) api.play(opts.clip, { fade: 0, phase: opts.phase });
  ctx.add(group);
  return api;
}
