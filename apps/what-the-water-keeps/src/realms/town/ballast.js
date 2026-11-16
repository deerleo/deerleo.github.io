// The town below: BALLAST, for measuring only (&ballast=1). Not part of the area and never loaded in the ride.
//
// Stage 1's stand-ins are a few thousand triangles; the finished area is planned at about 745,000 (the page, section 9:
// heroes 188,000, kit 380,000, multitudes 176,000), and its costly part is drawing the town under the water twice a
// frame. This module adds still solids in the town's own material with the triangle counts the page plans, in the
// places where the real things will be (inside the stand-ins, so the picture hardly changes), so that
//   python3 tools/shot.py "/?realm=town&s=150&d=1.5&yaw=-10&pitch=-6&ballast=1&perf=town_perf_ballast.json" town_perf_ballast.json
// measures the frame the finished area will cost. Delete it when the real models are in.
import * as THREE from 'three';
import { ensureLight } from './light.js';
import { frameAt } from './standins.js';

/** a box of about `tris` triangles (it stands on its base, 1 m each way) */
function dense(tris) { const n = Math.max(1, Math.round(Math.sqrt(tris / 12))); return new THREE.BoxGeometry(1, 1, 1, n, n, n).translate(0, 0.5, 0); }
/** a spindle of about `tris` triangles, 1 m long along X (a fish, a jelly) */
function spindle(tris) { const seg = Math.max(3, Math.round(Math.sqrt(tris / 2))), g = new THREE.SphereGeometry(0.5, seg, Math.max(2, Math.round(tris / (2 * seg)))); g.scale(1, 0.28, 0.14); return g; }

export async function build(ctx, plan, shared) {
  const light = ensureLight(ctx, plan, shared), town = light.town, rnd = ctx.rng(99);
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), V = new THREE.Vector3(), S = new THREE.Vector3();
  let total = 0;
  const many = (geo, list, { under = true, lit = 0.4 } = {}) => {
    if (!list.length) return;
    const mesh = new THREE.InstancedMesh(geo, light.mat({ color: '#6a5a78', lit }), list.length);
    list.forEach((o, i) => { M.compose(V.set(o.x, o.y, o.z), Q.setFromEuler(E.set(0, o.yaw || 0, 0)), S.set(o.sx ?? 1, o.sy ?? 1, o.sz ?? 1)); mesh.setMatrixAt(i, M); });
    mesh.frustumCulled = false; mesh.name = 'ballast'; ctx.add(mesh); if (under) ctx.only(mesh, 'direct');
    total += list.length * (geo.index ? geo.index.count : geo.attributes.position.count) / 3;
  };
  const inside = (h) => ({ x: h.x, y: h.floor + 0.2, z: h.z, yaw: h.yaw, sx: h.w * 0.9, sy: (h.eaves - h.floor) * 0.9, sz: h.dep * 0.9 });
  // the kit: 46 front-row houses of 3,250 triangles, 110 back-row houses of 600, 40 upper houses of 400
  many(dense(3250), town.houses.filter((h) => h.front && !h.awash).map(inside));
  many(dense(3250), town.houses.filter((h) => h.front && h.awash).map(inside), { under: false });
  many(dense(600), town.houses.filter((h) => !h.front).map(inside));
  many(dense(400), town.upper.map(inside), { under: false });
  // the rest of the kit (roofs awash, stacks, lamps, skiffs, stalls, bridge, quay, paving, poplars, viaduct ...): about 130,000,
  // as 65 pieces of 2,000 at the lamps
  many(dense(2000), town.lamps.concat(town.lamps.slice(0, 5)).map((l) => ({ x: l.x + 0.5, y: l.foot, z: l.z, sx: 0.4, sy: 1.2, sz: 0.4 })));
  // the heroes: tower shell 48,000 + movement 30,000 + dials 6,000 + pendulum, bell, hour ring 16,000; church 12,000;
  // market hall 14,000; theatre front 16,000; fountain 4,000
  { const T = plan.tower, f = frameAt(town, T.s, T.d);
    many(dense(60000), [{ x: f.x, y: 7.6, z: f.z, yaw: f.yaw, sx: 6.6, sy: 11.6, sz: 6.6 }], { under: false });
    many(dense(40000), [{ x: f.x, y: -21.8, z: f.z, yaw: f.yaw, sx: 6.6, sy: 21.6, sz: 6.6 }]);
    const c = frameAt(town, 133, plan.church.d); many(dense(12000), [{ x: c.x, y: -16.8, z: c.z, yaw: c.yaw, sx: 26, sy: 10, sz: 11 }]);
    const h = frameAt(town, 174, plan.hall.d); many(dense(14000), [{ x: h.x, y: -21.8, z: h.z, yaw: h.yaw, sx: 42, sy: 9, sz: 20 }]);
    const p = frameAt(town, 233, 0); many(dense(16000), [{ x: p.x, y: 13.2, z: p.z, yaw: p.yaw, sx: 13, sy: 1.8, sz: 35 }], { under: false });
    const fo = frameAt(town, plan.fountain.s, plan.fountain.d); many(dense(4000), [{ x: fo.x, y: -21.9, z: fo.z, sx: 2, sy: 0.8, sz: 2 }]); }
  // the cast: 1,800 school fish of 28 triangles and 520 fry of 12; 560 lantern-jellies of 120; the carp 14,000; five cormorants of 5,500
  { const fish = [], fry = [], jel = [];
    for (let i = 0; i < 1800; i++) { const s = 30 + rnd() * 180, d = (rnd() - 0.5) * 24, p = town.xz(s, d); fish.push({ x: p[0], y: Math.max(plan.floorAt(s) + 1, -3 - rnd() * 9), z: p[1], yaw: town.along(s) + (rnd() - 0.5), sx: 0.26, sy: 0.26, sz: 0.26 }); }
    for (let i = 0; i < 520; i++) { const s = 30 + rnd() * 190, d = (rnd() < 0.5 ? -1 : 1) * (town.hw(s) - 1 - rnd() * 3), p = town.xz(s, d); fry.push({ x: p[0], y: -0.2 - rnd() * 0.6, z: p[1], yaw: rnd() * 6.28, sx: 0.06, sy: 0.06, sz: 0.06 }); }
    for (let i = 0; i < 560; i++) { const s = 150 + rnd() * 60, d = -20 + rnd() * 48, p = town.xz(s, d); jel.push({ x: p[0], y: -4 - rnd() * 12, z: p[1], yaw: rnd() * 6.28, sx: 0.42, sy: 1.2, sz: 2.4 }); }
    many(spindle(28), fish); many(spindle(12), fry); many(spindle(120), jel);
    const c = town.xz(160, 2); many(spindle(14000), [{ x: c[0], y: -4, z: c[1], yaw: town.along(160), sx: 3.2, sy: 3.2, sz: 4 }]);
    many(spindle(5500), (shared.perches || []).concat([{ x: c[0] + 20, y: 0.2, z: c[1] }, { x: c[0] - 14, y: 0.2, z: c[1] - 20 }, { x: c[0] + 4, y: 1.4, z: c[1] + 30 }]).slice(0, 5).map((p) => ({ x: p.x, y: p.y, z: p.z, sx: 0.85, sy: 2.4, sz: 3 })), { under: false }); }
  ctx.state.ballastTriangles = Math.round(total);
  console.info(`town ballast: ${Math.round(total)} triangles added for measuring`);
  return {};
}
