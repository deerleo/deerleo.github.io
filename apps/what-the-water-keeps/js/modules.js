// A realm built from modules, so that several people can work on one area at once and one broken part does not
// take the whole area down.
//
//   // src/realms/orchard.js
//   import { buildModules } from '../engine/modules.js';
//   import { PLAN } from './orchard/plan.js';
//   export default {
//     id: 'orchard', path: PLAN.path, look: {...}, water: {...},
//     async build(ctx) {
//       await buildModules(ctx, PLAN, [
//         ['set',    () => import('./orchard/set.js')],       // the place and its light: land, sky, backdrops, mist, light states
//         ['heroes', () => import('./orchard/heroes.js')],    // the monument and the hero pieces
//         ['kit',    () => import('./orchard/kit.js')],       // kit pieces, multitudes, the close band
//         ['cast',   () => import('./orchard/cast.js')],      // everything alive and moving
//         ['stage',  () => import('./orchard/stage.js')],     // the route of moments, the showstopper, sound
//       ]);
//     },
//   };
//
//   // src/realms/orchard/heroes.js
//   export async function build(ctx, plan, shared) {
//     const tree = await ctx.kit.model('models/orchard/oldest_trunk.glb', { position: plan.tree.at });
//     shared.tree = tree;                                    // what a later module needs from this one
//     return { update(dt, ctx) { ... } };                    // optional
//   }
//
// Modules are built one after another in the order given (a later one may use what an earlier one put in `shared`).
// A module that throws is left out and reported (the line starts INVALID_MODULE, which tools/shot.py prints), and
// the rest of the area still builds. Each module's update is guarded separately by the realm manager.
//
// A stand-in (standIn below) marks where something not yet made will stand; removeStandIn takes one out again from
// another module once the real thing is in.
//
// Developer switches in the address:
//   &only=set,heroes     build only these modules        &skip=cast     build all but these
//   &labels=1            show the name of every stand-in (see standIn below) above it
// The time each module took to build is in ctx.state.modules and in the perf probe's output (&perf=name.json).
import * as THREE from 'three';
import { again, unfetched } from './net.js';

const params = new URLSearchParams(typeof location !== 'undefined' ? location.search : '');
const pick = (k) => (params.get(k) || '').split(',').map((v) => v.trim()).filter(Boolean);

/** Let the page draw a frame if one is due (a new task, at once: not a timer, which a hidden tab holds back a second). */
const breathe = () => new Promise((resolve) => { const c = new MessageChannel(); c.port1.onmessage = () => { c.port1.close(); resolve(); }; c.port2.postMessage(0); });

/** Build a realm's modules in order. list: [[name, () => import('./file.js')], ...]. Resolves to the `shared` object. */
export async function buildModules(ctx, plan, list) {
  const only = pick('only'), skip = pick('skip');
  const shared = ctx.state.shared || (ctx.state.shared = {});
  const report = ctx.state.modules || (ctx.state.modules = []);
  for (const [name, load] of list) {
    if ((only.length && !only.includes(name)) || skip.includes(name)) { report.push({ name, skipped: true }); continue; }
    const t0 = performance.now();
    try {
      const mod = await again(load, `src/realms/${ctx.id}/${name}`, unfetched);      // (a part that was not fetched is asked for again: src/engine/net.js)
      const built = mod.build ? await mod.build(ctx, plan, shared) : null;
      const update = (built && built.update) || mod.update;
      if (update) ctx.onUpdate((dt) => update(dt, ctx, plan, shared));
      report.push({ name, ms: Math.round(performance.now() - t0) });
      // An area is built while the boat rides the one before it: between two modules the ride gets its frame (two
      // modules whose waits were already answered used to run on as one long stop).
      await breathe();
    } catch (err) {
      report.push({ name, failed: String((err && err.message) || err) });
      console.error(`INVALID_MODULE ${ctx.id}/${name} failed to build and was left out: ${(err && err.stack) || err}`);
    }
  }
  return shared;
}

function label(text) {
  const cv = document.createElement('canvas'), g = cv.getContext('2d');
  g.font = '600 28px system-ui, sans-serif';
  cv.width = Math.ceil(g.measureText(text).width) + 20; cv.height = 40;
  g.font = '600 28px system-ui, sans-serif';
  g.fillStyle = 'rgba(0,0,0,0.72)'; g.fillRect(0, 0, cv.width, cv.height);
  g.fillStyle = '#fff'; g.textBaseline = 'middle'; g.fillText(text, 10, 21);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, fog: false, sizeAttenuation: false }));
  s.scale.set(0.045 * cv.width / cv.height, 0.045, 1); s.renderOrder = 999;
  return s;
}

/**
 * A stand-in: a plain solid of the true size, standing where a thing that is not modelled yet will stand, so that an
 * area's composition, scale and light can be judged before anything is made. Later, the code that makes the stand-in
 * is replaced by the real thing.
 *   standIn(ctx, { name: 'oldest tree bole', at: [111, 0, 0], size: [4.4, 5.5, 4.4], shape: 'cylinder', color: '#f4e6e3' });
 *   name       what it stands for (shown above it with &labels=1)
 *   at         [s, d, y] path coordinates of the middle of its foot;  or position: [x, y, z] in the realm's own
 *   size       [width, height, depth] in metres;  shape: 'box' (default) | 'cylinder' | 'cone' | 'dome' | 'sphere'
 *   color      its local colour (mid values; the realm's light does the rest);  turn: radians about the vertical
 *   emissive   for a stand-in of something that gives off light;  collide: radius of a collider to add
 * Returns the mesh (already added to the realm).
 */
export function standIn(ctx, o) {
  const [w, h, d] = o.size || [1, 1, 1];
  let geo;
  if (o.shape === 'cylinder') { geo = new THREE.CylinderGeometry(0.5, 0.5, 1, 20); geo.translate(0, 0.5, 0); }
  else if (o.shape === 'cone') { geo = new THREE.ConeGeometry(0.5, 1, 20); geo.translate(0, 0.5, 0); }
  else if (o.shape === 'dome') { geo = new THREE.SphereGeometry(0.5, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2); geo.scale(1, 2, 1); }
  else if (o.shape === 'sphere') { geo = new THREE.SphereGeometry(0.5, 24, 16); geo.translate(0, 0.5, 0); }
  else { geo = new THREE.BoxGeometry(1, 1, 1); geo.translate(0, 0.5, 0); }
  const mat = ctx.kit.gouache({ color: o.color || '#8a8494', emissive: o.emissive || '#000000', emissiveIntensity: o.emissiveIntensity ?? 1, brush: 0.5 });
  const m = new THREE.Mesh(geo, mat);
  m.name = 'standin:' + (o.name || '');
  m.scale.set(w, h, d);
  if (o.position) m.position.set(o.position[0], o.position[1], o.position[2]); else { const p = ctx.kit.at(o.at[0], o.at[1] || 0, o.at[2] || 0); m.position.copy(p); }
  m.rotation.y = o.turn || 0;
  ctx.add(m);
  if (o.collide) m.userData.collider = ctx.addCollider({ x: m.position.x, z: m.position.z, r: o.collide });
  if (params.has('labels') && o.name) { const s = label(o.name); s.position.set(m.position.x, m.position.y + h + 0.6, m.position.z); ctx.add(s); }
  return m;
}

/**
 * Take stand-ins out of the realm: every object whose name begins 'standin:' and contains `match` (a string, or a
 * RegExp tested against the name after 'standin:'). For the person whose real model now stands where a stand-in
 * made in SOMEONE ELSE'S module stood: call it from your own module, after the real thing is in, instead of
 * editing their file (say so in your log; the stand-in's own line is deleted later).
 *   removeStandIn(ctx, 'wreck');   removeStandIn(ctx, /^lighthouse/);
 * Returns how many were removed (0 means the name is wrong: `&labels=1` shows the names). Their colliders go too.
 */
export function removeStandIn(ctx, match) {
  const hit = [];
  ctx.group.traverse((o) => {
    if (!o.name || !o.name.startsWith('standin:')) return;
    const n = o.name.slice(8);
    if (match instanceof RegExp ? match.test(n) : n.includes(match)) hit.push(o);
  });
  for (const o of hit) {
    if (o.parent) o.parent.remove(o);
    const c = o.userData && o.userData.collider;
    if (c) c.r = -1e6;                                              // a collider that can never be touched
    o.traverse((q) => { if (q.geometry) q.geometry.dispose(); const m = q.material; if (m) (Array.isArray(m) ? m : [m]).forEach((x) => x.dispose && x.dispose()); });
  }
  return hit.length;
}
