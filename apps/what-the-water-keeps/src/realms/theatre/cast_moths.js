// The theatre of leaves: the cast, group "Moths" (stage 3). Log: docs/build/theatre/3-cast-moths.md.
//
//   GILT MOTHS   600 at high quality (the page, section 5): 420 at rest on the gilding of the parterre and of tier 1, 180 on
//                the wing in loops by a perch. At rest a low tent that shrugs now and then; where the walls' water-light
//                arrives at one it opens flat and shows a copper hind wing (1.2 s), and folds again a few seconds later (2 s);
//                the hull's coming lifts six to twelve, which circle and settle 3 to 6 m further on; when their tier kindles
//                they leave the gilt for its flames; a gust throws them and they gather again. Never in the water's mirror.
//   PEARL MOTHS  nine large pale moths (the family's makePearlMoths), each on a crossing of its own between two places that were
//                looked at; one crosses the middle arch ahead of the bow; one comes to the lantern's crook when the boat holds
//                still: see `makePearls` below.
//   WAKE-LIGHT   lives in the house's paint (lib.js, light.js): this module reads its record and judges it in the log.
//
// THE GILT MOTH IS THE TOOLKIT'S ANIMAL, MOVED BY THIS HOUSE. Its body and wings are the insects family's small moth
// (assets/models/life/moth_far.glb, 34 triangles), merged and hinged with the family's own helpers (loadInsectParts,
// buildInsectGeometry, liHingeM), and its poses are the family's numbers (makeMoths in src/engine/life/swarm.js: the roof-wise
// tent, opened with the fore wings carried forward off the hind wings, the beat through 62 degrees, the body hanging and
// bobbing under the wing roots). What is this module's own is WHERE IT GOES. The family's moths weave half a metre either
// way in the world's own x and z on every journey, loop through the plane of their perch, and circle a flame all the way
// round: on open timber that is right; here every perch is on a wall, every flame stands on a bracket on a wall, and a
// journey from the parterre to a flame passes four bellied fronts. So a place here carries the way INTO THE ROOM, and
//   - a journey is a curve that leaves the gilt outward, bows into the room (and to one side, clear of the pier's own
//     ironwork) and comes in to its end from the room, circling on its way; never straight, never through a front;
//   - the loops of those on the wing lie between 0.65 and 1.45 m in front of the wall (the parterre's unlit brackets reach
//     half a metre out);
//   - at a bracket they keep to the room's side of its three flames; round a lustre, which hangs free, they go all the way;
//   - each opens by the water-light AT ITS OWN PERCH (the walls' record of the wake, shared.house.wake: the ripple field
//     never carries a wake to the walls), on its own nerve, over the page's 1.2 s and 2 s;
//   - where a moth may rest is FOUND ON THE MODELS as they stand (rays cast at the gilt at build time): see "where a gilt moth may rest";
//   - a third of a second of flutter joins every take-off and landing, and the body turns from the wall's frame to the air's.
// What the family would need for its own makeMoths to do this is in the log under "Asked of the toolkit".
//
// Published for the staging (shared.cast.moths; shared.cast.pearls): see the end of `makeGilt` and of `makePearls`.
// Developer switches (with ?realm=theatre):  &mfov=10 a long lens;  &msteady=1 the boat does not rock;  &mopen=1 all open;
//   &mgust=3 a gust at 3 s;  &mlift=2 the moths by the hull lift at 2 s;  &mdbg=1 counts and the first moths' places;
//   &mfollow=0 the moths do not follow the show clock to the flames;  &mcount=0.5 a share of them.
import * as THREE from 'three';
import { loadInsectParts, buildInsectGeometry, instanced, INSECT_GLSL, pixelOnScreen, makePearlMoths } from '../../engine/life/insects.js';
import { at, house, dev } from './lib.js';

const TAU = Math.PI * 2;
// THE GILT MOTH AS IT IS DRAWN (see `gSize` in the shader, and the log). The page's tent is 30 by 26 mm, watched from a metre; the channel keeps the eye
// 2.6 m and more from every pilaster. So it is drawn up with distance: life size within 1.15 m of the eye, MID times at three metres (a large underwing:
// a tent 60 by 52 mm, 11 cm across when it opens: the size of the pilaster's own carved leaves, and still the smaller of the house's two moths), SIZE
// times from six and a half metres. (It was SIZE from 2.8 m: an opened moth 14 cm across on a colonnette 15 cm thick, larger than the pearl moth.)
// FOOT: half its breadth and half its length at rest, and how far an opened fore wing reaches from its middle, at its largest: what a place on the gilt must offer.
const SIZE = 2.4, MID = 2.0, FOOT = [0.013 * SIZE, 0.015 * SIZE, 0.035 * SIZE];
const PALE = '#eadcb4', COPPER = dev.has('mhind') ? '#' + dev.get('mhind') : '#b0592c';      // the gilt moth: pale straw gold; its hind wing (the page's copper)
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const num = (k, d) => (dev.has(k) && dev.get(k) !== '' && Number.isFinite(+dev.get(k)) ? +dev.get(k) : d);
const hash01 = (x) => { const v = Math.sin(x * 12.9898 + 4.1414) * 43758.5453; return v - Math.floor(v); };

/** How far the house's light draws the bow lantern in to a pool (light.js `uLanternK`: the very uniform, so it follows the light states; 0 under the first light, which does not). */
const lanternDrawnIn = (H) => (dev.second && H.U && H.U.uLanternK ? H.U.uLanternK : { value: 0 });

// ================================================================================================ where a gilt moth may rest
// A perch must be ON the gilding, to a few millimetres: a moth that hangs a finger off a pilaster, or sits half inside a
// carved leaf, is seen at once from the rail. The parterre's models name nine places a bay (shared.kitFloor.perches); the
// tiers' models name none. So the places are FOUND ON THE MODELS THEMSELVES, as they stand when the area is built: each
// model is looked at from the room (the piers from five ways round), and wherever the nearest surface is gilt, faces the
// eye, and is even over a moth's breadth, there is a place, with the way the gilding faces there. Every copy of a model
// then keeps a few of its places, its own few: no two pilasters carry their moths alike. (Rays are cast against the
// triangles sorted into a grid, in the model's own space: some thousands of rays in a few milliseconds.)

/**
 * Every triangle of some meshes: positions (9 a triangle), what each is made of (the u of its paint), and whether it is cloth.
 * In the meshes' own space (a kit.models result: the model's), or set by `matrixOf(mesh)` (one copy of it; a kit.model as it stands in the realm).
 */
function trianglesOf(meshes, matrixOf = null) {
  let n = 0; for (const m of meshes) n += (m.geometry.index ? m.geometry.index.count : m.geometry.attributes.position.count) / 3;
  const pos = new Float32Array(n * 9), cls = new Float32Array(n), cloth = new Uint8Array(n), v3 = new THREE.Vector3(); let t = 0;
  for (const m of meshes) {
    const g = m.geometry, P = g.attributes.position, U = g.attributes.uv, I = g.index, cnt = (I ? I.count : P.count) / 3, isCloth = /:(cloth|velvet|silk)/.test(m.name || '') ? 1 : 0, mx = matrixOf ? matrixOf(m) : null, flip = !!mx && mx.determinant() < 0;
    for (let k = 0; k < cnt; k++, t++) {
      for (let c = 0; c < 3; c++) {
        const v = I ? I.getX(k * 3 + c) : k * 3 + c; v3.set(P.getX(v), P.getY(v), P.getZ(v)); if (mx) v3.applyMatrix4(mx);
        const cc = flip && c ? 3 - c : c;                                  // (a mirrored copy: its triangles are wound the other way round)
        pos[t * 9 + cc * 3] = v3.x; pos[t * 9 + cc * 3 + 1] = v3.y; pos[t * 9 + cc * 3 + 2] = v3.z;
      }
      cls[t] = U ? U.getX(I ? I.getX(k * 3) : k * 3) : 0; cloth[t] = isCloth;
    }
  }
  return { pos, cls, cloth, n };
}
/**
 * The model seen from the way (sin a, 0, cos a): cast(x, y) gives the surface nearest that eye on the line through (x, y) of the
 * eye's own plane (x to its right-hand side as the model's x runs when a = 0, y up), or null: { z (toward the eye), t (the triangle), nx, ny, nz (in the eye's axes) }.
 */
function viewOf(T, a, cell = 0.05) {
  const n = T.n, ca = Math.cos(a), sa = Math.sin(a), q = new Float32Array(n * 9);
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  for (let i = 0; i < n * 3; i++) {
    const x = T.pos[i * 3], y = T.pos[i * 3 + 1], z = T.pos[i * 3 + 2], xe = x * ca - z * sa, ze = x * sa + z * ca;
    q[i * 3] = xe; q[i * 3 + 1] = y; q[i * 3 + 2] = ze;
    if (xe < x0) x0 = xe; if (xe > x1) x1 = xe; if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  const nx = Math.max(1, Math.ceil((x1 - x0) / cell)), ny = Math.max(1, Math.ceil((y1 - y0) / cell)), count = new Int32Array(nx * ny + 1);
  const span = (t) => {
    const ax = q[t * 9], ay = q[t * 9 + 1], bx = q[t * 9 + 3], by = q[t * 9 + 4], cx = q[t * 9 + 6], cy = q[t * 9 + 7];
    return [Math.max(0, Math.floor((Math.min(ax, bx, cx) - x0) / cell)), Math.min(nx - 1, Math.floor((Math.max(ax, bx, cx) - x0) / cell)), Math.max(0, Math.floor((Math.min(ay, by, cy) - y0) / cell)), Math.min(ny - 1, Math.floor((Math.max(ay, by, cy) - y0) / cell))];
  };
  for (let t = 0; t < n; t++) { const [i0, i1, j0, j1] = span(t); for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) count[j * nx + i + 1]++; }
  for (let k = 0; k < nx * ny; k++) count[k + 1] += count[k];
  const list = new Int32Array(count[nx * ny]), fill = count.slice(0, nx * ny);
  for (let t = 0; t < n; t++) { const [i0, i1, j0, j1] = span(t); for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) list[fill[j * nx + i]++] = t; }
  const hit = { z: 0, t: -1, nx: 0, ny: 0, nz: 0 };
  const cast = (x, y, zMax = 1e9) => {                                   // (zMax: nothing nearer the eye than this counts: to look past what stands in front)
    const i = Math.floor((x - x0) / cell), j = Math.floor((y - y0) / cell);
    if (i < 0 || j < 0 || i >= nx || j >= ny) return null;
    let best = -1e9, bt = -1;
    for (let k = count[j * nx + i]; k < count[j * nx + i + 1]; k++) {
      const t = list[k], ax = q[t * 9], ay = q[t * 9 + 1], bx = q[t * 9 + 3], by = q[t * 9 + 4], cx = q[t * 9 + 6], cy = q[t * 9 + 7];
      const det = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy);
      if (Math.abs(det) < 1e-12) continue;
      const l1 = ((by - cy) * (x - cx) + (cx - bx) * (y - cy)) / det, l2 = ((cy - ay) * (x - cx) + (ax - cx) * (y - cy)) / det, l3 = 1 - l1 - l2;
      if (l1 < -1e-5 || l2 < -1e-5 || l3 < -1e-5) continue;
      const z = l1 * q[t * 9 + 2] + l2 * q[t * 9 + 5] + l3 * q[t * 9 + 8];
      if (z > best && z <= zMax) { best = z; bt = t; }
    }
    if (bt < 0) return null;
    const t = bt, ux = q[t * 9 + 3] - q[t * 9], uy = q[t * 9 + 4] - q[t * 9 + 1], uz = q[t * 9 + 5] - q[t * 9 + 2], vx = q[t * 9 + 6] - q[t * 9], vy = q[t * 9 + 7] - q[t * 9 + 1], vz = q[t * 9 + 8] - q[t * 9 + 2];
    const mx = uy * vz - uz * vy, my = uz * vx - ux * vz, mz = ux * vy - uy * vx, l = Math.hypot(mx, my, mz) || 1;
    hit.z = best; hit.t = bt; hit.nx = mx / l; hit.ny = my / l; hit.nz = mz / l;
    return hit;
  };
  return { cast, x0, x1, y0, y1, ca, sa };
}
/**
 * The places on a model where a moth may rest, in the model's own space: [{ x, y, z, nx, ny, nz }].
 *   ways      the ways round it is looked at from (radians about the vertical; 0: from the room, square on). A place is kept only where
 *             the surface looks at that eye nearly squarely (`square`: the least of its normal toward the eye), so that every test below
 *             is made as the moth's own back would see it: what is found is in plain sight from the side it faces
 *   gilt(u)   is a surface whose paint has this u gilding?      box: [x0, x1, y0, y1] the part looked at (the eye's own plane)
 *   zMin      nothing further back than this (the model's z: into the room) counts: no place inside a box
 *   foot      the animal as it is drawn (metres): [half its breadth at rest, half its length at rest, how far an opened wing reaches]
 *   T, zMax   triangles ready made instead of `meshes` (the places are then in their space); nothing nearer the eye than zMax counts (to look past what stands in front)
 */
function placesOn(meshes, { ways = [0], gilt, box, step = 0.06, zMin = -1e9, clear = 0.004, square = 0.93, foot = FOOT, down = -0.3, T: given = null, zMax = 1e9 }) {
  const T = given || trianglesOf(meshes), out = [], [fw, fl, reach] = foot;      // (T: the triangles ready made, in whatever space the caller wants its places in; zMax: nothing nearer the eye than this counts)
  // under the tent: its two shoulders, its head and its tail, and the two corners of its hind edge
  const under = [[fw, 0], [-fw, 0], [0, fl], [0, -fl], [fw * 0.8, -fl * 0.8], [-fw * 0.8, -fl * 0.8], [0.012, 0], [-0.012, 0]];
  for (const a of ways) {
    const V = viewOf(T, a);
    for (let y = Math.max(box[2], V.y0) + step * 0.37; y < Math.min(box[3], V.y1); y += step) for (let x = Math.max(box[0], V.x0) + step * 0.61; x < Math.min(box[1], V.x1); x += step) {
      const h = V.cast(x, y, zMax);
      if (!h || h.nz < 0.5 || T.cloth[h.t] || !gilt(T.cls[h.t])) continue;
      const z0 = h.z, hx = h.nx, hy = h.ny, hz = h.nz; let nx = hx, ny = hy, nz = hz, ok = true, zTop = z0;      // (cast() gives the same object every time: what is needed of a hit is taken at once)
      // even under the whole tent, and gilt all the way (a fluted shaft is even: its arrises stand a few millimetres proud of its hollows)
      for (const [dx, dy] of under) {
        const g = V.cast(x + dx, y + dy, zMax);
        if (!g || Math.abs(g.z - z0) > 0.016 || T.cloth[g.t] || !gilt(T.cls[g.t]) || g.nx * hx + g.ny * hy + g.nz * hz < 0.6) { ok = false; break; }
        nx += g.nx; ny += g.ny; nz += g.nz; if (g.z > zTop) zTop = g.z;
      }
      if (!ok) continue;
      const l = Math.hypot(nx, ny, nz); nx /= l; ny /= l; nz /= l;
      if (nz < square || ny < down) continue;                              // it looks at this eye squarely; nothing hangs under a soffit here
      // and with something to stand on a little further out all round: not the tip of a leaf that stands out in the air, not a candle arm
      // (from the side such a moth is seen to hang beside its perch)
      for (const [dx, dy] of [[fw * 1.5, 0], [-fw * 1.5, 0], [0, fl * 1.4], [0, -fl * 1.4]]) { const g = V.cast(x + dx, y + dy, zMax); if (!g || Math.abs(g.z - z0) > 0.045) { ok = false; break; } }
      // and with room for its wings when it opens them: nothing within their reach stands prouder than a thumb's breadth (a carved leaf, a
      // bracket's plate, the garland that winds round a shaft), and nothing at all stands before it (it is in plain sight)
      for (let k = 0; ok && k < 12; k++) for (const r of [reach, reach * 0.55]) { const g = V.cast(x + r * Math.cos(k * 0.5236), y + r * Math.sin(k * 0.5236), zMax); if (g && g.z > z0 + 0.02) { ok = false; break; } }
      if (!ok) continue;
      const zs = zTop + clear, px = x * V.ca + zs * V.sa, pz = -x * V.sa + zs * V.ca, wx = nx * V.ca + nz * V.sa, wz = -nx * V.sa + nz * V.ca;      // back from the eye's axes to the model's
      if (pz < zMin) continue;
      out.push({ x: px, y, z: pz, nx: wx, ny, nz: wz });
    }
  }
  return out;
}

/**
 * Every place a gilt moth may rest: [{ x, y, z (just clear of the surface), nx, ny, nz (the way the surface faces),
 * room (the level way into the room there, as an angle: sin, cos), level (0 the parterre, 1 tier 1), on, s, side (0 left, 1 right) }].
 *   the parterre   the places its models name themselves (shared.kitFloor.perches), and places found on its piers (pedestal,
 *                  colonnette, capital, from five ways round) and on the gilt of its boxes' fronts
 *   tier 1         places found on the gilt of its bays' fronts (garlands, shield, mouldings) and on its piers and colonnettes
 * `keep` of each model's places are kept for each of its copies.
 */
function gatherPerches(ctx, plan, shared, rnd) {
  const out = [], m4 = new THREE.Matrix4(), v = new THREE.Vector3(), nv = new THREE.Vector3(), rv = new THREE.Vector3();
  let copies = 0, copy = -1;                                                // (which copy of which model a place is on: no pilaster carries more moths than its own share)
  const add = (x, y, z, nx, ny, nz, room, level, on) => { if (y > 0.13) out.push({ x, y, z, nx, ny, nz, room, level, on, copy, s: -z, side: x < 0 ? 0 : 1, taken: false }); };
  const pick = (list, k) => { const a = list.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a.slice(0, k); };
  // one model, many copies: `places` in the model's own space, set where each copy stands (and, for a bay, bent to the front's curve as kit_tiers.js bends it)
  const spread = (res, places, keep, level, on, only = null) => {
    if (!res || !res.meshes || !res.meshes.length || !places.length) return 'no places';
    const mesh = res.meshes[0], g = mesh.geometry, A = g.attributes.aBendA, B = g.attributes.aBendB; let n = 0;
    for (let i = 0; i < mesh.count; i++) {
      mesh.getMatrixAt(i, m4);
      if (only && !only(m4.elements[13])) continue;
      copy = copies++;
      for (const p of pick(places, keep)) {
        let x = p.x, z = p.z, nx = p.nx, nz = p.nz, rx = 0, rz = 1;
        if (A && B) {
          const u = (p.x + 1.65) / 3.3, u2 = u * u, u3 = u2 * u, h0 = 2 * u3 - 3 * u2 + 1, h1 = u3 - 2 * u2 + u, h2 = 3 * u2 - 2 * u3, h3 = u3 - u2, d0 = 6 * u2 - 6 * u, d1 = 3 * u2 - 4 * u + 1, d2 = 6 * u - 6 * u2, d3 = 3 * u2 - 2 * u;
          const cx = h0 * A.getX(i) + h1 * A.getZ(i) + h2 * B.getX(i) + h3 * B.getZ(i), cz = h0 * A.getY(i) + h1 * A.getW(i) + h2 * B.getY(i) + h3 * B.getW(i);
          let tx = d0 * A.getX(i) + d1 * A.getZ(i) + d2 * B.getX(i) + d3 * B.getZ(i), tz = d0 * A.getY(i) + d1 * A.getW(i) + d2 * B.getY(i) + d3 * B.getW(i); const tl = Math.hypot(tx, tz) || 1; tx /= tl; tz /= tl;
          rx = -tz; rz = tx;                                               // into the room
          x = cx + rx * p.z; z = cz + rz * p.z; nx = tx * p.nx + rx * p.nz; nz = tz * p.nx + rz * p.nz;
        }
        v.set(x, p.y, z).applyMatrix4(m4); nv.set(nx, p.ny, nz).transformDirection(m4); rv.set(rx, 0, rz).transformDirection(m4);
        add(v.x, v.y, v.z, nv.x, nv.y, nv.z, Math.atan2(rv.x, rv.z), level, on); n++;
      }
    }
    return n;
  };
  const K = shared.kitFloor, Hs = shared.horseshoe, floor1 = plan.tiers[1].floor, report = {};
  const tierGilt = (u) => Math.abs(u - 0.28) < 0.09, floorGilt = (u) => { const k = Math.round(u); return k === 1 || k === 10 || k === 6; };
  const tier1 = (y) => Math.abs(y - floor1) < 0.2;
  // (A pier is looked at from eleven ways round, at uneven angles. A place is kept only where the surface looks squarely at the eye that found it, so on a
  // round shaft each way gives ONE upright line of places: from seven ways, evenly spaced, the moths of a colonnette stood in a ruled row up its middle
  // from wherever the boat lay: .shots/theatre_mo6_12_drift_look_crop.png. From more ways, unevenly, some sit a little round the shaft and are seen aslant.)
  const ways7 = [0, 0.19, -0.24, 0.43, -0.5, 0.68, -0.77, 0.93, -1.0, 1.15, -1.2];
  const safe = (name, fn) => { try { report[name] = fn(); } catch (err) { report[name] = 'failed: ' + ((err && err.message) || err); } };
  // (a builder's handle on a model is a kit.models result, or, where a piece has a near and a far version, { near, far }: the near one is read.
  // It is read NOW, as the area is built: the floor's module re-packs its instances by distance once the ride runs.)
  const set = (res) => (res && res.meshes ? res : res && res.near && res.near.meshes ? res.near : null);
  const found = (res, o, keep, level, on, only) => { const q = set(res); if (!q) return 'not a model'; const pl = placesOn(q.meshes, o).filter((pt) => !(o.not && o.not(pt))), n = spread(q, pl, keep, level, on, only); return typeof n === 'number' ? n + ' (' + pl.length + ' a copy)' : n; };
  // ---- the parterre: the places its models name, then those found on its piers and box fronts
  // (The places the parterre's models name themselves, shared.kitFloor.perches, are no longer sat on: they were written for a moth a third this size
  // and stand a finger off the remodelled surfaces, or in the garland that winds round the shaft. Every place is found on the models as they stand.)
  if (K && K.perches) report.named = K.perches.length + ' (not used)';
  if (K && K.pierModels) K.pierModels.forEach((res, k) => safe('parterre pier ' + k, () => found(res, { ways: ways7, gilt: floorGilt, box: [-0.45, 0.45, 0.3, 3.4], step: 0.04, zMin: -0.05 }, 30, 0, 'pier')));
  if (K && K.boxes) for (const [design, res] of Object.entries(K.boxes)) safe('parterre box ' + design, () => found(res, { gilt: floorGilt, box: [-1.6, 1.6, 0.3, 3.2], step: 0.05, zMin: -0.12 }, 16, 0, 'box front'));
  // ---- tier 1: the gilt of its fronts, its piers and colonnettes
  // (only the bays the PICTURE draws: `a_far` stand on tiers 3 to 5, and `a_mirror` are far bays that stand on tiers 1 and 2 in the water's mirror
  // alone (kit_tiers.js): a moth seated by a mirror bay's surface sits inside the near bay's carving, or off it)
  // NOT ON THE BLANK SHIELD. The shield in the middle of every bay is the evenest gilt a front has, so that is where a search for even gilt seats a moth:
  // and a delta in the middle of an oval is a nose, and the two copper fans of an opened one at its foot are a mouth (.shots/theatre_mo6_05_drift_crop.png,
  // the third crop). The carving has no faces and the cast must not draw one: nothing sits within the shield's frame (tier_bay.py SHIELDS: a quarter of a
  // metre either side of the bay's middle, 0.18 to 0.70 m above the floor line), nor on the shell that crowns it.
  const onShield = (pt) => Math.abs(pt.x) < 0.27 && pt.y > 0.12 && pt.y < 0.86;
  if (Hs && Hs.bays) for (const [k, res] of Object.entries(Hs.bays)) if (!/far|broken|mirror/.test(k)) safe('tier bay ' + k, () => found(res, { gilt: tierGilt, box: [-1.62, 1.62, -0.25, 1.0], step: 0.04, zMin: 0.0, square: 0.6, not: onShield }, 26, 1, 'front', tier1));
  if (Hs && Hs.piers && Hs.piers.near) safe('tier pier', () => found(Hs.piers.near, { ways: ways7, gilt: tierGilt, box: [-0.4, 0.4, -0.25, 3.15], step: 0.04, zMin: 0.0 }, 24, 1, 'pier', tier1));
  // (if the tiers' piers could not be read: the colonnettes as the tiers' log gives them: a shaft from 1.24 to 2.94 m above the floor line, 0.06 m in front of the line, 0.058 m in radius)
  if (!out.some((p) => p.level === 1 && p.on === 'pier')) {
    const C = plan.horseshoe.colonnette, R = 0.058 + 0.005;
    for (const p of plan.piers()) {
      if (p.tier !== 1 || p.rear) continue;
      const base = at(ctx, p.s, p.d, floor1), c = Math.cos(p.turn), sn = Math.sin(p.turn);
      copy = copies++;
      for (let k = 0; k < 8; k++) {
        const h = 1.34 + rnd() * 1.5, a = (rnd() * 2 - 1) * 1.15, lx = R * Math.sin(a), lz = C.z + R * Math.cos(a), nx = Math.sin(a), nz = Math.cos(a);
        add(base.x + lx * c + lz * sn, base.y + h, base.z - lx * sn + lz * c, nx * c + nz * sn, 0, -nx * sn + nz * c, p.turn, 1, 'pier');
      }
    }
    report.colonnettes = 'from the plan';
  }
  out.report = report; out.copies = copies;
  return out;
}

/** Every light a gilt moth goes to: the 170 three-armed brackets of the side fronts and the ten lustres. */
function gatherLights(ctx, plan) {
  const out = [];
  for (const g of plan.girandoles()) {
    if (g.bay && g.bay.rear) continue;                                    // (the page: s 33 to 84, both sides)
    const w = g.wicks[1], y = (g.wicks[0].y + g.wicks[1].y + g.wicks[2].y) / 3 + 0.02, p = at(ctx, w.s, w.d, y);
    out.push({ x: p.x, y: p.y, z: p.z, room: g.turn, tier: g.tier, side: p.x < 0 ? 0 : 1, s: w.s, t: g.t, kind: 2, ring: 0, arc58: g.bay ? g.bay.arc58 : 0 });
  }
  for (const L of plan.lustresAt()) {
    const p = at(ctx, L.centre.s, L.centre.d, L.centre.y + 0.16);
    out.push({ x: p.x, y: p.y, z: p.z, room: L.turn, tier: 6, side: p.x < 0 ? 0 : 1, s: L.centre.s, t: plan.kindleTime('lustre', L.pair) + 0.3, kind: 3, ring: plan.horseshoe.lustre.ring, arc58: 0 });
  }
  return out;
}

/**
 * THE ARCH'S MOTHS: places on the two faces of the middle arch's reveal, where the boat comes into the house.
 * The gilt moths live on the box fronts, and the box fronts stand twenty metres from the middle of the house: a rider left to the current never
 * comes within a stone's throw of one, and the thing they do (open, copper, as the boat's own water-light climbs to them) happens too far off to
 * be seen. The one carved wall every rider passes at arm's length is the arch's reveal: three and a half metres to either side as the boat comes
 * through, its coffers at the edges of the first image, and lit by the boat's own wake as it comes (the house's paint: what stands in open water
 * answers a moving boat directly). So a handful rest there, on the stiles between the coffers and on the plain stone under them, and open as the
 * boat's light reaches them. They keep to the arch: they do not lift for the hull and do not go to the flames (a journey from the reveal to a
 * box front would pass through the arch's own pier). Found on the wall's own model, as every place is.
 */
function archPlaces(ctx, plan, rnd, keepClear = [], want = 6) {
  const walls = []; ctx.group.traverse((o) => { if (o.name && /royal_wall/.test(o.name) && !/^standin/.test(o.name) && o.parent === ctx.group) walls.push(o); });
  if (!walls.length || want <= 0) return [];
  const T = trianglesOf(meshesUnder(walls), (o) => o.matrixWorld);
  const AW = plan.archWall, s0 = AW.s[0] + 0.22, s1 = AW.s[1] - 0.22, half = AW.archWidth / 2, out = [];
  for (const side of [0, 1]) {
    // the left face looks toward +x: an eye that stands the way (1, 0, 0) from it sees it (the eye's own x is then s); the right face, from (-1, 0, 0) (its x is -s).
    // The other pier of the arch stands between that eye and the face: it is looked past (zMax).
    const a = side ? -Math.PI / 2 : Math.PI / 2;
    const found = placesOn(null, { T, ways: [a], gilt: () => true, box: side ? [-s1, -s0, 0.55, 2.75] : [s0, s1, 0.55, 2.75], step: 0.05, zMax: -half + 0.45, square: 0.9 });
    for (let i = found.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [found[i], found[j]] = [found[j], found[i]]; }
    const mine = [];
    for (const q of found) {
      if (mine.length >= want) break;
      if (Math.abs(Math.abs(q.x) - half) > 0.35) continue;                    // (on the reveal's own face, not on something that stands behind it)
      if (mine.some((m) => Math.hypot(m.x - q.x, m.y - q.y, m.z - q.z) < 0.34) || keepClear.some((m) => Math.hypot(m.x - q.x, m.y - q.y, m.z - q.z) < 0.4)) continue;
      mine.push({ x: q.x, y: q.y, z: q.z, nx: q.nx, ny: q.ny, nz: q.nz, room: Math.atan2(q.nx, q.nz), level: 0, on: 'arch', copy: -1, s: -q.z, side: q.x < 0 ? 0 : 1, taken: true, stay: true });
    }
    out.push(...mine);
  }
  return out;
}

// ================================================================================================ the gilt moth's shader
// A place is (xyz, kind) with a frame (xyz, w):
//   kind 0  a perch: frame.xyz the way the surface faces, frame.w the level way into the room (an angle)
//   kind 1  on the wing by a home: loops between 0.65 and 1.45 m in front of the wall there
//   kind 2  at a bracket on a wall: a loop that keeps to the room's side of its flames
//   kind 3  at a light that hangs free: all the way round it; frame.x the radius of its ring of candles
// A moth is at B, or on its way from A to B: aGmMove = (when it lets go, seconds on the wing, how far it bows into the room, how far to one side).
const GM_VERT_PARS = /* glsl */`
  attribute vec3 aPivot; attribute float aPart, aMem;
  attribute vec4 aGmA, aGmAf, aGmB, aGmBf, aGmMove, aGmSeed; attribute float aGmOpen;
  uniform float uGmT, uGmBeat, uGmKeep, uGmPx, uGmSize, uGmMid, uGmNear, uGmMinPx, uGmAll, uGmSlow, uGmJig; uniform vec4 uGmGust;
  varying float vGmHind; varying vec3 vGmW, vGmFl;
  float gmJw;                                                     // how far a moth is free to be thrown about (set by gmMoth): nothing on a perch, a third at a flame
  ${INSECT_GLSL}
  vec3 gmRoom(float a) { return vec3(sin(a), 0.0, cos(a)); }
  // The flight of a small moth is a scribble, not a line: its body is thrown a hand's breadth this way and that two or three
  // times a second, more by fits (it jinks, then goes steadier), and it drops and climbs more than it swerves. Photographed
  // ten times a second its track must never be evenly spaced beads on a smooth curve.
  vec3 gmJig(float t) {
    float f1 = t * (8.6 + 3.4 * aGmSeed.x) + aGmSeed.y * 50.0, f2 = t * (17.0 + 6.0 * aGmSeed.z) + aGmSeed.w * 50.0;
    float fit = 0.55 + 0.45 * sin(t * (0.9 + 0.6 * aGmSeed.w) + aGmSeed.x * 40.0);
    return (uGmJig * fit) * (0.055 * vec3(sin(f1), 1.25 * sin(f1 * 1.31 + 1.7), cos(f1 * 0.83)) + 0.028 * vec3(sin(f2 + 0.7), 1.25 * cos(f2 * 1.13), sin(f2 * 0.91 + 2.0)));
  }
  vec3 gmPlace(vec4 P, vec4 F, float t) {
    if (P.w < 0.5) return P.xyz;
    t *= uGmSlow;                                                 // (reduced motion: its loops at six tenths of their speed)
    vec3 n = gmRoom(F.w), tg = vec3(n.z, 0.0, -n.x);
    if (P.w < 1.5) {
      // loops within a metre and a half of its perch, never the same loop twice, always clear of the wall and of what stands out from it
      float a = t * (0.45 + 0.4 * aGmSeed.x) + aGmSeed.y * 40.0;
      a += 0.55 * sin(a * 0.37 + aGmSeed.z * 20.0) + 0.3 * sin(a * 2.3 + aGmSeed.w * 20.0);
      return P.xyz + n * (1.05 + 0.3 * sin(a * 1.7 + 2.0) + 0.1 * sin(a * 3.1 + aGmSeed.y * 9.0))
        + tg * (0.62 * sin(a * 1.3) + 0.2 * sin(a * 2.9 + aGmSeed.w * 9.0))
        + vec3(0.0, 0.3 * sin(a * 0.9 + 1.0) + 0.12 * sin(a * 3.7 + aGmSeed.x * 9.0), 0.0);
    }
    // at a light a moth is no planet: it surges and stalls, its loop swells, shrinks and tips over
    float q1 = t * (1.05 + 0.5 * aGmSeed.z) + aGmSeed.x * 40.0, q2 = t * (2.6 + 0.9 * aGmSeed.w) + aGmSeed.y * 40.0;
    float r = mix(0.2, 0.5, 0.5 + 0.5 * sin(q1 * 0.31 + aGmSeed.w * 6.2832)) * (1.0 + 0.2 * sin(q1 * 1.31 + 2.0) + 0.1 * sin(q2 + 0.5));
    float way = aGmSeed.z > 0.5 ? 1.0 : -1.0;
    float th = way * (t * 2.57 * (0.8 + 0.4 * aGmSeed.y) + 0.85 * sin(q1) + 0.38 * sin(q2 * 1.17 + 1.0)) + aGmSeed.w * 6.2832;
    float tip = 0.45 * sin(q1 * 0.53 + aGmSeed.w * 6.2832);
    float y = 0.05 + (0.05 + 0.2 * r) * sin(t * 1.9 + aGmSeed.x * 30.0) + r * tip * sin(th + aGmSeed.y * 6.2832) + 0.04 * sin(q2 * 1.43);
    if (P.w < 2.5) {
      // Round a bracket's three flames, clear of each by a hand and more: wide along the wall (0.3 to 0.55 m), out into the room,
      // and close behind them, between the flames and the colonnette (never lower than the wicks there: the arms are beneath)
      float a = 0.3 + 0.5 * r, sn = sin(th), out_ = sn > 0.0 ? 0.6 * a * sn : 0.2 * sn;
      y = mix(y, abs(y) + 0.03, 1.0 - smoothstep(-0.1, 0.05, out_));
      return P.xyz + tg * (a * cos(th)) + n * (out_ - 0.03) + vec3(0.0, y, 0.0);
    }
    float R = F.x + r, tr = th * 0.36;
    return P.xyz + vec3(cos(tr) * R, y, sin(tr) * R);
  }
  // thrown by a gust: along the wall toward the stage and out into the room, each a little late; then each gathers again
  vec3 gmThrow(float t, float n0) {
    float g = t - uGmGust.x - 1.5 * aGmSeed.y;
    float env = uGmGust.y * smoothstep(0.0, 0.9, g) * (1.0 - smoothstep(1.8, 1.8 + uGmGust.z, g));
    vec3 n = gmRoom(n0), tg = vec3(n.z, 0.0, -n.x); if (tg.z > 0.0) tg = -tg;
    return env * (tg * (1.4 + 1.6 * aGmSeed.z) + n * (0.15 + 0.5 * aGmSeed.w) + vec3(0.0, (aGmSeed.x - 0.4) * 0.8, 0.0));
  }
  // where it is at t; sit: how far it has hold of a perch (1 at rest); k: how far along its journey; hint: the level way it sets off or comes in
  vec3 gmMoth(float t, out float sit, out float k, out vec3 hint) {
    float pa = step(aGmA.w, 0.5), pb = step(aGmB.w, 0.5), tf = 0.3;
    float t1 = aGmMove.x + tf * pa, D = max(aGmMove.y, 0.01);
    k = clamp((t - t1) / D, 0.0, 1.0);
    float e = k * k * (3.0 - 2.0 * k), m = 1.0 - e;
    vec3 nA = gmRoom(aGmAf.w), nB = gmRoom(aGmBf.w), up = vec3(0.0, 1.0, 0.0);
    vec3 pA = gmPlace(aGmA, aGmAf, t), pB = gmPlace(aGmB, aGmBf, t);
    sit = pa * (1.0 - smoothstep(0.0, tf, t - aGmMove.x)) + pb * smoothstep(0.0, tf, t - (t1 + D));
    hint = k < 0.5 ? nA : -nB;
    // what has no hold of its perch stands a finger off it: the wings need room
    pA += pa * normalize(aGmAf.xyz) * (0.03 * (1.0 - sit)); pB += pb * normalize(aGmBf.xyz) * (0.03 * (1.0 - sit));
    vec3 c1 = pA + nA * aGmMove.z + vec3(nA.z, 0.0, -nA.x) * aGmMove.w + up * (0.25 * aGmMove.z);
    vec3 c2 = pB + nB * (0.8 * aGmMove.z) + vec3(nB.z, 0.0, -nB.x) * aGmMove.w - up * (0.2 * aGmMove.z);
    vec3 p = m * m * m * pA + 3.0 * m * m * e * c1 + 3.0 * m * e * e * c2 + e * e * e * pB;
    // never straight: it circles on its way, across its line of travel and out into the room, never toward the wall
    vec3 nM = normalize(nA + nB + vec3(0.0, 0.0, 1e-4)), across = normalize(cross(pB - pA + vec3(1e-4, 2e-4, 0.0), nM));
    float w = sin(3.14159 * k), ph = t * 1.3 + aGmSeed.x * 20.0;
    p += w * min(0.42, 0.1 * distance(pA, pB)) * (across * sin(ph) + nM * (0.55 + 0.45 * cos(ph)));
    // on the wing it can be thrown
    float air = (1.0 - sit) * (pb > 0.5 ? w : mix(w, 1.0, e));
    if (uGmGust.y > 0.0) p += gmThrow(t, k < 0.5 ? aGmAf.w : aGmBf.w) * air;
    // how far it is free to be jogged about: not at all on a perch, growing over a second as it leaves one and dying over the
    // last second before it reaches one (the gilt is a finger away there); whole in the open; a third at a light (the flames,
    // the bracket's arms and the colonnette are a hand away)
    float jA = aGmA.w > 1.5 ? 0.35 : 1.0, jB = aGmB.w > 1.5 ? 0.35 : 1.0;
    gmJw = mix(jA, jB, e) * (1.0 - pa * (1.0 - smoothstep(0.1, 1.3, t - aGmMove.x))) * (1.0 - pb * (1.0 - smoothstep(0.1, 1.3, t1 + D - t)));
    return p;
  }`;
const GM_VERT_LOCAL = /* glsl */`
  float gSit, gSit2, gK, gK2; vec3 gHint, gHint2;
  vec3 gAhead = gmMoth(uGmT + 0.06, gSit2, gK2, gHint2), gC = gmMoth(uGmT, gSit, gK, gHint);      // (gmJw is left as it is NOW)
  float gFly = 1.0 - gSit, gAir = smoothstep(0.5, 1.0, gFly);
  vec3 gVel = gAhead - gC, gUp = vec3(0.0, 1.0, 0.0);
  // the flutter of a small body on big wings: thrown about as it goes (gmJig); its heading follows half of that (a moth does not
  // spin to face every jolt, and it does not slide sideways through one either)
  vec3 gJ0 = gmJig(uGmT), gJ1 = gmJig(uGmT + 0.06);
  gC += (gAir * gmJw) * gJ0; gVel += (0.5 * gAir * gmJw) * (gJ1 - gJ0);
  gC = liKeepOut(gC, uCameraPos, uGmKeep);
  // how near its light it is (for the flame's light on it, in the fragment shader): the square of its distance from a bracket's flames, or from a lustre's
  // ring of candles; and whether it is bound for a light at all
  { vec3 gLv = aGmB.xyz - gC; float gD2 = dot(gLv, gLv);
    if (aGmB.w > 2.5) { float gRr = length(gLv.xz) - aGmBf.x; gD2 = gRr * gRr + gLv.y * gLv.y; }
    vGmFl = vec3(gD2, step(1.5, aGmB.w), gAir); }      // (and how far it is on the wing: the bow lantern's light, below)
  // on the wing: heading follows the level way it travels, the nose up or down with its climb (never on end), a roll that comes and goes
  vec3 gVh = vec3(gVel.x, 0.0, gVel.z) + gHint * 2e-3; float gHl = length(gVh);
  vec3 gFwdF = normalize(gVh / gHl + gUp * clamp(gVel.y / gHl, -1.2, 1.2));
  vec3 gUpF = normalize(gUp + cross(gFwdF, gUp) * (0.35 * sin(uGmT * 1.3 + aGmSeed.x * 20.0)));
  vec3 gLftF = normalize(cross(gUpF, gFwdF)); gUpF = cross(gFwdF, gLftF);
  // at rest: on an upright face head up, as a moth that climbed there sits; on a level one any way round
  vec3 gNs = normalize(gK < 0.5 ? aGmAf.xyz : aGmBf.xyz), gFwdP;
  if (abs(gNs.y) > 0.75) gFwdP = vec3(sin(aGmSeed.x * 6.2832), 0.0, cos(aGmSeed.x * 6.2832));
  else { vec3 gT0 = normalize(gUp - gNs * gNs.y), gT1 = cross(gNs, gT0); float gQ = aGmSeed.x * 2.0 - 1.0, gA = 0.3 * gQ + 0.7 * gQ * gQ * gQ * gQ * gQ; gFwdP = gT0 * cos(gA) + gT1 * sin(gA); }      // (seven in ten within twenty degrees of upright, a few well askew)
  vec3 gLftP = normalize(cross(gNs, gFwdP)); gFwdP = cross(gLftP, gNs);
  // The body turns from the wall's frame to the air's while the wings flutter (and back as it takes hold). On a wall the two are
  // half a turn apart (belly to the wall and head up; belly down and head to the room): it goes round by ONE side, its own, the
  // head swinging along the wall as the back comes uppermost, so that the turn is the same turn every frame.
  float gW = smoothstep(0.1, 0.9, gFly);
  vec3 gUpV = normalize(mix(gNs, gUpF, gW));
  vec3 gFwdV = mix(gFwdP, gFwdF, gW) + gLftP * ((aGmSeed.w > 0.5 ? 0.9 : -0.9) * sin(3.14159 * gW));
  vec3 gLftV = normalize(cross(gUpV, gFwdV)); gFwdV = cross(gLftV, gUpV);
  // ---- the pose (the family's numbers): a tent at rest, opened flat by water-light, beating on the wing
  float gPer = 10.0 + 20.0 * aGmSeed.y, gPh = fract(uGmT / gPer + aGmSeed.z) * gPer;
  float gShrug = smoothstep(0.0, 0.5, gPh) * (1.0 - smoothstep(0.6, 1.6, gPh));              // a slow shrug of the wings every ten to thirty seconds
  float gO = max(aGmOpen, uGmAll), gOpen = clamp(gO * gO * (3.0 - 2.0 * gO) + 0.22 * gShrug, 0.0, 1.0);
  float gBp = (uGmBeat + aGmSeed.x) * 6.2832, gBeat = sin(gBp);
  float gTent = gSit * (1.0 - gOpen);
  float gFlap = gFly * 1.08 * gBeat, gTwist = mix(mix(0.0, -0.436, gTent), 0.14 * cos(gBp), gFly);
  float gSwF = mix(mix(-0.2, 1.222, gTent), 0.03, gFly), gSwH = mix(mix(0.14, 1.222, gTent), 0.03, gFly);
  vec3 gP = transformed, gN = objectNormal;
  vGmW = vec3(abs(gP.x), gP.z, aPart);                                                        // (a wing's own span and chord, from its root: for its markings)
  if (aPart > 0.5) {
    float gSide = (aPart < 1.5 || (aPart > 2.5 && aPart < 3.5)) ? 1.0 : -1.0, gHindW = step(2.5, aPart);
    gP.z *= mix(1.0, 0.4, gTent * gHindW);                                                    // the hind wing pleats away under the fore wing
    mat3 gHm = liHingeM(gSide, gFlap, mix(gSwF, gSwH, gHindW), gTwist); gP = gHm * gP; gN = gHm * gN;
  }
  gP += aPivot;
  gP.y += gFly * (-0.006 * sin(gBp - 0.9) - 0.003);                                           // the body hangs below the wing roots and bobs with every beat
  mat3 gPm = liRx(-0.3 * gFly); gP = gPm * gP; gN = gPm * gN;
  // Drawn up with distance: the page's 30 by 26 mm within uGmNear of the lens (never larger than life there), uGmMid times at three metres (a large
  // underwing), uGmSize times from six and a half; and far off never under uGmMinPx pixels across its spread wings
  float gDist = distance(gC, uCameraPos);
  float gSize = 1.0 + (uGmMid - 1.0) * clamp((gDist - uGmNear) / (3.0 - uGmNear), 0.0, 1.0) + (uGmSize - uGmMid) * clamp((gDist - 3.0) / 3.5, 0.0, 1.0);
  float gShow = max(1.0, uGmMinPx * uGmPx * gDist / (0.06 * gSize));
  transformed = gC + (gLftV * gP.x + gUpV * gP.y + gFwdV * gP.z) * (gSize * gShow); objectNormal = gLftV * gN.x + gUpV * gN.y + gFwdV * gN.z;
  // (the hind wing's copper comes with its showing: folded away under the tent it is the fore wing's own straw, or a hairline of
  // copper showed along the ridge where the two fore wings meet over it; on the wing it is a breath of copper)
  vGmHind = step(2.5, aPart) * mix(1.0, 0.15, gFly) * (1.0 - 0.9 * gTent);`;

/**
 * The gilt moths. Returns { api, update(dt) }.
 */
async function makeGilt(ctx, plan, shared, H, keepClear = []) {
  const rnd = ctx.rng(4601), calm = !!ctx.reducedMotion, engine = ctx.engine, show = shared.show || { c: -1 };
  const perches = gatherPerches(ctx, plan, shared, ctx.rng(4602)), lights = gatherLights(ctx, plan);
  if (!perches.length) throw new Error('theatre moths: no perches (the floor and the tiers did not build)');
  const share = num('mcount', 1), n0 = (n) => Math.max(1, Math.round(ctx.kit.count(n) * share));
  let nRest = dev.get('mrest') === '0' ? 0 : n0(420), nFly = dev.get('mfly') === '0' ? 0 : n0(180);      // (&mrest=0, &mfly=0: only the others, to look at them)
  nRest = Math.min(nRest, Math.floor(perches.length * 0.6));               // (never more at rest than three perches in five: a lifted moth must find a free one)
  const LONG_AGO = -1e5;

  // ---- the animal: the family's small moth, its parts on their hinges
  const parts = await loadInsectParts(ctx, 'models/life/moth_far.glb');
  const geo = buildInsectGeometry(parts, (nm) => ({ wing_fl: 1, wing_fr: 2, wing_hl: 3, wing_hr: 4 }[nm] ?? 0));
  // ---- who sits where. Those at rest: a share on the parterre's piers (the ones a rider at the rail can watch), a share on its box
  // fronts, a share on tier 1's gilt fronts and on its colonnettes; never two within a hand's breadth; no order to it. Those on the
  // wing take a perch for a home (a metre and more above the water, so that no loop comes near it), no two homes within reach.
  // (no small moth sits where a large one comes down: a forearm round each of the pearl moths' places is left free, for good)
  for (const p of perches) for (const q of keepClear) if (Math.abs(q.x - p.x) < 0.3 && Math.abs(q.z - p.z) < 0.3 && Math.abs(q.y - p.y) < 0.3) { p.taken = true; break; }
  const order = perches.map((_, i) => i); for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
  const groupOf = (p) => (p.level === 1 ? (p.on === 'pier' ? 3 : 2) : (p.on === 'box front' || p.on === 'rail' || p.on === 'pelmet' ? 1 : 0));
  const quota = [0.36, 0.14, 0.3, 0.2].map((k) => Math.round(k * nRest)), got = [0, 0, 0, 0], seats = [];
  // THE WET SIDE (the left fronts behind the tree, s 48 to 68): rain runs down tier 1's fronts there and drips from its soffit. No moth
  // sits on a front that water runs down, and none flies its loops before one: there they keep to the piers and the parterre, under the tier's belly.
  const wet = (p) => p.side === 0 && p.s > 47.5 && p.s < 68.5;
  const clearOf = (p, list, gap) => { for (const q of list) if (Math.abs(q.x - p.x) < gap && Math.abs(q.z - p.z) < gap && Math.abs(q.y - p.y) < gap) return false; return true; };
  // NO PILASTER BREAKS OUT IN MOTHS. Seated by lot alone, a pier that had drawn the short straw carried nine or ten (the postcard's own colonnette did:
  // .shots/theatre_m4_00_pc2.png), and when the water-light came it was a column of red spots. Each copy of a model has its own share, by lot: a
  // parterre pier two to six (four on average), a pier of tier 1 none to three, a bay of tier 1's front two to six, a box front two; a share is not
  // passed by those that settle there later either (`room`). So there are fewer at rest than the page's 420 (about 300 at high quality): see the log.
  const shareOf = (g) => { const r = rnd(); return g === 0 ? (r < 0.15 ? 2 : r < 0.45 ? 3 : r < 0.75 ? 4 : r < 0.92 ? 5 : 6) : g === 3 ? (r < 0.15 ? 0 : r < 0.45 ? 1 : r < 0.75 ? 2 : 3) : g === 2 ? (r < 0.2 ? 2 : r < 0.45 ? 3 : r < 0.7 ? 4 : r < 0.9 ? 5 : 6) : 2; };
  const cap = new Int8Array(Math.max(1, perches.copies || 1)).fill(-1), held = new Int16Array(cap.length);
  for (const p of perches) if (p.copy >= 0 && cap[p.copy] < 0) cap[p.copy] = Math.round(shareOf(groupOf(p)) * (dev.has('mshare') ? num('mshare', 1) : 1));
  const room = (p, over = 0) => p.copy < 0 || held[p.copy] < cap[p.copy] + over;      // may one more settle on the thing this place is on?
  const take = (p) => { p.taken = true; if (p.copy >= 0) held[p.copy]++; }, leave = (p) => { p.taken = false; if (p.copy >= 0 && held[p.copy] > 0) held[p.copy]--; };
  for (const pass of [0, 1]) for (const k of order) {
    if (seats.length >= nRest) break;
    const p = perches[k], g = groupOf(p);
    if (p.taken || !room(p) || (pass === 0 && got[g] >= quota[g]) || !clearOf(p, seats, 0.16) || (wet(p) && p.level === 1 && p.on !== 'pier')) continue;
    take(p); got[g]++; seats.push(p);
  }
  // the arch's moths (see archPlaces): a handful on either face of the middle arch's reveal, beside those of the boxes
  let archReport = 'none';
  if (nRest > 0 && dev.get('march') !== '0') { try { const arch = archPlaces(ctx, plan, ctx.rng(4603), keepClear, Math.max(2, Math.round(n0(12) / 2))); seats.push(...arch); archReport = arch.length + ' on the arch'; } catch (err) { archReport = 'failed: ' + ((err && err.message) || err); } }
  nRest = seats.length;
  const homes = [];
  for (const gap of [0.9, 0.3, 0]) for (const k of order) {
    if (homes.length >= nFly) break;
    const p = perches[k];
    if (p.y < 1.0 || p.on === 'pelmet' || homes.includes(p) || !clearOf(p, homes, gap) || (wet(p) && p.level === 1)) continue;
    homes.push(p);
  }
  const N = nRest + homes.length; nFly = homes.length;
  const aA = new Float32Array(N * 4), aAf = new Float32Array(N * 4), aB = new Float32Array(N * 4), aBf = new Float32Array(N * 4), aMove = new Float32Array(N * 4), aSeed = new Float32Array(N * 4), aOpen = new Float32Array(N);
  const setPlace = (arr, frm, i, pl) => {
    arr.set([pl.x, pl.y, pl.z, pl.kind], i * 4);
    if (pl.kind === 0) frm.set([pl.nx, pl.ny, pl.nz, pl.room], i * 4);
    else frm.set([pl.kind === 3 ? pl.ring : 0, 1, 0, pl.room], i * 4);
  };
  const moths = [];
  for (let i = 0; i < N; i++) {
    const resting = i < nRest, p = resting ? seats[i] : homes[i - nRest];
    const pl = resting ? { ...p, kind: 0 } : { x: p.x, y: p.y, z: p.z, kind: 1, room: p.room };
    setPlace(aA, aAf, i, pl); setPlace(aB, aBf, i, pl);
    aMove.set([LONG_AGO, 1, 0.6, 0], i * 4);
    aSeed.set([rnd(), rnd(), rnd(), rnd()], i * 4);
    moths.push({ i, perch: resting ? p : null, home: p, x: p.x, y: p.y, z: p.z, s: p.s, side: p.side, level: p.level, kind: pl.kind, nerve: 0.3 + 0.35 * rnd(), open: 0, lit: false, openFrom: 1e9, openUntil: -1, again: 1e9,
      busyUntil: -1e9, landed: -1e9, seen: false, light: null, gone: false, stay: !!(resting && p.stay) });      // (stay: one of the arch's: it neither lifts for the hull nor goes to the flames)
  }
  const A = { a: instanced(geo, 'aGmA', aA, 4), af: instanced(geo, 'aGmAf', aAf, 4), b: instanced(geo, 'aGmB', aB, 4), bf: instanced(geo, 'aGmBf', aBf, 4), move: instanced(geo, 'aGmMove', aMove, 4) };
  // &mspec=s,d,y,turn: SPECIMENS, for looking at the animal itself (anatomy, paint) where no carving, light or neighbour's edit is in the way: the first
  // moths are set in a row in the open air at that place of the house, on an upright face that is not there, facing `turn` degrees (0: back up the route,
  // at a boat that comes; 90: toward the left wall). 0 at rest; 1 opened; 2 at rest, then it flies to a place a forearm higher at 2 s and lands at about 4.5 s; 3 askew
  const specimen = dev.has('mspec') ? dev.get('mspec').split(',').map(Number) : null, specFly = [];
  if (specimen && specimen.length >= 3 && N >= 4) {
    const c = at(ctx, specimen[0], specimen[1], specimen[2]), az = (specimen[3] || 0) * Math.PI / 180, nx = -Math.sin(az), nz = Math.cos(az), tx = nz, tz = -nx;
    const sp = (k, up = 0) => ({ x: c.x + tx * k, y: c.y + up, z: c.z + tz * k, nx, ny: 0, nz, room: Math.atan2(nx, nz), level: 0, on: 'specimen', s: -(c.z + tz * k), side: c.x < 0 ? 0 : 1, taken: true, kind: 0 });
    [sp(-0.21), sp(-0.07), sp(0.09), sp(0.23)].forEach((P, i) => { setPlace(aA, aAf, i, P); setPlace(aB, aBf, i, P); const m = moths[i]; if (m.perch) leave(m.perch); Object.assign(m, { perch: P, home: P, x: P.x, y: P.y, z: P.z, s: P.s, side: P.side, level: 0, kind: 0, spec: i === 1 ? 'open' : 'rest' }); });
    aSeed[0] = 0.5; aSeed[4] = 0.5; aSeed[8] = 0.5; aSeed[12] = 0.93;      // (upright, upright, upright, askew)
    specFly.push([2, sp(0.09, 0.3)]);
  }
  instanced(geo, 'aGmSeed', aSeed, 4);
  const openAttr = instanced(geo, 'aGmOpen', aOpen, 1, true);
  geo.instanceCount = N;

  // ---- its paint: the house's own light (lib.js, light.js), as a pale thing that keeps its colour in the dark, takes the
  // moon, the candle pools, the lustres' and the lantern's light and the walls' water-light like the gilt it sits on. A moth
  // by a flame is lit by it and is never itself a light: nothing of it is brighter than paper.
  const body = new THREE.Color(PALE), hind = new THREE.Color(COPPER);
  const U = {
    uGmT: { value: 0 }, uGmBeat: { value: 0 }, uGmKeep: { value: 0.75 }, uGmPx: { value: 0.001 }, uGmSize: { value: num('msize', SIZE) }, uGmMid: { value: num('mmid', MID) }, uGmNear: { value: num('mnear', 1.15) }, uGmMinPx: { value: num('mminpx', 5) }, uGmAll: { value: dev.has('mopen') ? 1 : 0 }, uGmSlow: { value: calm ? 0.6 : 1 },
    uGmGust: { value: new THREE.Vector4(LONG_AGO, 0, 5, 0) }, uGmJig: { value: num('mjig', calm ? 0.55 : 1) },
    uGmCap: { value: num('mcap', 0.6) }, uGmWarm: { value: num('mwarm', 0.6) }, uGmLanK: lanternDrawnIn(H), uGmMark: { value: dev.has('mmark') ? 1 : 0 },      // (&mmark=1: every moth in magenta, to find them in a picture)
    // the hind wing's copper as a hue alone (at a luminance of one), and how light it is beside the fore wing it lies under; a flame's light through a wing, and how light a moth by a flame may be
    uGmHind: { value: (() => { const l = 0.3 * hind.r + 0.55 * hind.g + 0.15 * hind.b; return new THREE.Color(hind.r / l, hind.g / l, hind.b / l); })() }, uGmHindRel: { value: num('mhindrel', 0.72) }, uGmHindSat: { value: num('mhindsat', 0.55) },
    uGmFlame: { value: num('mflame', 0.62) }, uGmCapFl: { value: num('mcapfl', 0.85) },
  };
  const ext = {
    uniforms: U, vertexPars: GM_VERT_PARS, vertexLocal: GM_VERT_LOCAL,
    fragmentPars: 'varying float vGmHind; varying vec3 vGmW, vGmFl; uniform vec3 uGmHind; uniform float uGmCap, uGmWarm, uGmMark, uGmLanK, uGmHindRel, uGmHindSat, uGmFlame, uGmCapFl; float gmPoolF(float d2) { return exp(-d2 / 1.44) / (1.0 + d2); }',
    // A MOTH, NOT A SCRAP OF PAPER. The family's small moth is one pale sheet a wing; here each wing is marked, by its own span from
    // the root: the fore wing dusky at the shoulder, a broad browner bar across it, a pale line outside the bar and a dusky fringe
    // (on the folded tent the two bars make a chevron across the delta); the hind wing copper with a dark border inside its fringe;
    // the body furred and darker. No spots: two dots on a delta under two feelers would be a face.
    albedo: `{ float gmU = vGmW.x / (vGmW.z > 2.5 ? 0.0191 : 0.0282);
      if (vGmW.z < 0.5) albedo *= 0.72;
      else if (vGmW.z < 2.5) {
        float gmBar = smoothstep(0.38, 0.46, gmU) * (1.0 - smoothstep(0.64, 0.72, gmU)), gmLine = smoothstep(0.72, 0.76, gmU) * (1.0 - smoothstep(0.80, 0.86, gmU));
        albedo *= (1.0 - 0.22 * (1.0 - smoothstep(0.0, 0.3, gmU))) * (1.0 - 0.32 * smoothstep(0.92, 1.0, gmU)) * (1.0 + 0.10 * gmLine);
        albedo *= mix(vec3(1.0), vec3(0.60, 0.47, 0.32), gmBar);
      } else {
        // (the hind wing is left as pale as the fore wing HERE, so that the room lights the two alike; its copper is given in the light hook, as a hue, at a share of that light)
        albedo *= 1.0 - 0.72 * vGmHind * smoothstep(0.58, 0.70, gmU) * (1.0 - smoothstep(0.90, 0.98, gmU));
      } }`,
    // It is lit by the room like the gilt it sits on (the first paint took the room's dark five times over and was then bleached: a white cut-out in
    // any light). What is its own:
    //  - THE LANTERN, WHOLE, ON THE WING ONLY. The house draws the bow lantern in to a pool for walls; a moth on the wing by the boat is the one thing that
    //    should catch it. One at rest takes the lantern as the gilt under it does (vGmFl.z: how far it is on the wing): lit whole, the moths of a pier
    //    six metres off were yellow flecks on a column the lantern hardly reached, each in a light of its own.
    //  - AT A FLAME IT HAS NO DARK SIDE. A wing a forearm from three flames lets their light through: the faces that look away from them glow too. The
    //    house's pool lights only what looks at the flames (right for carving), so a moth in a halo had one pink-tan side and one side the slate of
    //    the room's dark: a scrap of confetti (.shots/theatre_mo6_04_pc2B_crop.png). Here the flame's light THROUGH the wing (`uGmFlame` of what a
    //    face square to the flames takes, by the moth's distance from its own light: vGmFl) takes the place of whatever is darker than it; and by a
    //    flame a moth may be as light as the gilt beside it (`uGmCapFl`: the page's 0.85 for gilt under candles), not held to 0.6.
    //  - IT KEEPS ITS OWN STRAW IN EVERY LIGHT (`uGmWarm`: six tenths of the way to its own hue at the light's value). In the lantern's amber, where the
    //    gilt goes orange, that keeps it the PALE thing and not a chip of the gilding; under the moon and the pearl water-light, which take the colour
    //    out of what they fall on (light.js), it keeps it a warm animal on a cool wall. Greyed with the wall, an opened moth's fore wings were the silver
    //    of the colonnette and all that was seen of it was its hind wings: two red dots (.shots/theatre_mo6_05_drift_crop.png).
    //  - THE HIND WING IS COPPER AT A SHARE OF THE FORE WING'S LIGHT (`uGmHindRel`), whatever lights it. It is painted as pale as the fore wing (the albedo
    //    hook), so the room lights the two alike; here it takes copper's hue at seven tenths of that value. (Painted copper and lit by the room it was a
    //    quarter as light as the fore wing: black under the moon; "taken back to its own hue at the same value" it was the one saturated thing on the wall.)
    //    And under a cold light it is greyed as the room's copper leaves are (`uGmHindSat`: a little over half its hue under the moon and the pearl web,
    //    all of it by the lantern and by a flame): pure copper on a moonlit wall is red, and a red spot is the first thing the eye finds there.
    //  - IT IS NEVER THE LIGHTEST THING IN THE FRAME: held to a cream that keeps its colour (what burns out goes white on the way).
    light: `{ vec3 gmLv = uLanternPos - vWPos; c += albedo * pointLight(uLanternPos, uLanternColor, uLanternRadius, N) * (vGmFl.z * uGmLanK * (1.0 - 1.0 / (1.0 + dot(gmLv, gmLv) / 6.0)));
      float gmPool = vGmFl.y * gmPoolF(vGmFl.x) * smoothstep(5.5, 7.0, uShow);
      vec3 gmThru = albedo * uCandleCol * (uGmFlame * gmPool); c = max(c, gmThru / (1.0 + 0.5 * max(gmThru.r, max(gmThru.g, gmThru.b))));
      float gmL = dot(c, vec3(0.3, 0.55, 0.15)), gmHot = clamp((c.r - c.b) / max(gmL, 1e-3) * 1.5, 0.0, 1.0);      // (how warm the light on it is: 0 under the moon and the pearl web, 1 by a flame)
      c = mix(c, albedo * (gmL / max(dot(albedo, vec3(0.3, 0.55, 0.15)), 0.02)), uGmWarm);
      float gmLh = uGmHindRel * dot(c, vec3(0.3, 0.55, 0.15));
      c = mix(c, mix(vec3(1.12, 0.98, 0.78) * gmLh, uGmHind * gmLh, mix(uGmHindSat, 1.0, gmHot)), vGmHind);      // (greyed toward a brown, not toward a neutral grey: greyed copper is tan, never rose)
      float gmMax = max(c.r, max(c.g, c.b)); c *= min(1.0, mix(uGmCap, uGmCapFl, min(1.0, 1.6 * gmPool)) / max(gmMax, 1e-3));
      c = mix(c, vec3(3.0, 0.0, 3.0), uGmMark); }`,
  };
  // keep: its own straw in the dark (half), half as much again of the room's dark as a dark thing takes (a pale thing: it is found, it does not glow), dry (no wet gleam), no glint
  // (take: a sixth of the water-light. Gilding throws the web back like a mirror; a moth's wing is dust. At seven tenths the moth went the same silver as the
  // colonnette under the web and all that was left of an opened one was two rust spots: .shots/theatre_m4_04_drift_look_crop.png; at a third its fore
  // wings were still the web's pale grey on silver (.shots/theatre_mo6_05_drift_crop.png). At a sixth it is a straw moth on shining gilt: darker than
  // its perch while the light plays, paler than it in the dark; what is seen of it is its whole shape, and the copper it shows is part of it.)
  const mat = H.paint({ color: PALE, vertexColors: true, side: THREE.DoubleSide, brush: 0, crisp: dev.get('mcrisp') !== '0', wake: true, take: [num('mtake', 0.16), 1, 1, 1], keep: [num('mkeep', 0.5), num('mdark', 1.6), num('mgleam', 0.12), 0.05], extend: ext });
  const object = new THREE.Mesh(geo, mat); object.name = 'gilt moths x ' + N; object.frustumCulled = false;
  // never in the water's mirror, and not in the picture the engine takes first (nothing reads a moth's depth)
  object.onBeforeRender = (renderer, scene, camera) => {
    U.uGmPx.value = pixelOnScreen(renderer, camera);
    geo.instanceCount = engine.reflecting || renderer.getRenderTarget() === engine.pre ? 0 : N;
    mat.uniformsNeedUpdate = true;
  };
  object.onAfterRender = () => { geo.instanceCount = N; };
  ctx.only(object, 'direct'); ctx.add(object);

  // ---- journeys
  const now = () => ctx.time;
  let dirty = false;
  /** Moth q leaves for a place at `when` (the realm's clock), `seconds` on the wing. False if it is still on an earlier journey. */
  const move = (q, pl, when, seconds, bow, side) => {
    const m = moths[q];
    if (when < m.busyUntil) return false;
    aA.set(aB.subarray(q * 4, q * 4 + 4), q * 4); aAf.set(aBf.subarray(q * 4, q * 4 + 4), q * 4);
    setPlace(aB, aBf, q, pl);
    aMove.set([when, seconds, bow, side], q * 4);
    const flutter = (m.kind === 0 ? 0.3 : 0) + (pl.kind === 0 ? 0.3 : 0);
    m.busyUntil = when + seconds + flutter; m.landed = m.busyUntil; m.kind = pl.kind;
    m.x = pl.x; m.y = pl.y; m.z = pl.z; m.s = -pl.z; m.side = pl.x < 0 ? 0 : 1;
    dirty = true;
    return true;
  };
  const flush = () => { if (dirty) { for (const k of Object.values(A)) k.needsUpdate = true; dirty = false; } };

  // ---- the callback where they lift (the page's `flutter`: at most once a second)
  let lastLift = -1e9;
  const lifted = (x, y, z, n, why) => { if (now() - lastLift < 1) return; lastLift = now(); if (api.onLift) { try { api.onLift({ x, y, z, n, why }); } catch (e) { console.error(e); } } };

  // ---- to the flames. Each light wants a few moths: more on the tiers near the eye, fewer high up; each takes those nearest
  // along its own wall. A moth leaves when the edge of flame on its tier has reached ITS light, a breath after the flame has risen.
  const want = [0, 3, 2.5, 2, 1.5, 1.5, 3].map((k) => k * N / 600);      // (about 390 of 600 go to the lights: some 150 stay at rest on the gilt and 60 on the wing by it, so that the rail keeps its moths when the house is lit)
  const byTier = [[], [], [], [], [], [], []];
  for (const L of lights) byTier[L.tier].push(L);
  const plans = [];                                                       // { q, L, c (the show clock at which it leaves) }
  {
    const free = moths.map(() => true), carry = [0, 0, 0, 0, 0, 0, 0];
    for (const tier of [1, 2, 6, 3, 4, 5]) for (const L of byTier[tier]) {
      carry[tier] += want[tier]; const k = Math.floor(carry[tier]); carry[tier] -= k;
      const cand = [];
      for (const m of moths) if (free[m.i] && !m.spec && !m.stay && m.side === L.side) { const ds = Math.abs(m.s - L.s); if (ds < 9) cand.push([ds + rnd() * 2.2 + (tier > 2 && m.level === 0 ? 1.5 : 0), m]); }
      cand.sort((p, q) => p[0] - q[0]);
      for (const [, m] of cand.slice(0, k)) { free[m.i] = false; m.light = L; plans.push({ q: m.i, L, c: L.t + 0.5 + 1.6 * rnd(), done: false }); }
    }
    plans.sort((p, q) => p.c - q.c);
  }
  const sendToLight = (pl, when) => {
    const m = moths[pl.q], L = pl.L, dist = Math.hypot(L.x - m.x, L.y - m.y, L.z - m.z);
    const speed = (1.0 + 0.5 * rnd() + Math.min(0.5, dist * 0.04)) * (calm ? 0.7 : 1), seconds = Math.max(2.5, dist / speed);
    const ok = move(pl.q, { x: L.x, y: L.y, z: L.z, kind: L.kind, room: L.room, ring: L.ring }, when, seconds, Math.min(1.3, 0.6 + 0.05 * dist), (rnd() < 0.5 ? -1 : 1) * (0.35 + 0.5 * rnd()));
    if (ok) { if (m.perch) { leave(m.perch); m.perch = null; } m.gone = true; }
    return ok;
  };
  let nextPlan = 0, liftFlames = { n: 0, x: 0, y: 0, z: 0 };
  /** Follow the show clock: every moth whose light has caught leaves for it. `c` is the clock now; one that should have left long ago is already there. */
  const followClock = (c) => {
    const t = now();
    for (let j = nextPlan; j < plans.length; j++) {
      const pl = plans[j];
      if (pl.c > c) break;
      if (pl.done) { if (j === nextPlan) nextPlan++; continue; }
      const late = c - pl.c, m = moths[pl.q], wasPerch = m.kind === 0;
      if (sendToLight(pl, late > 1.5 ? t - late : Math.max(t, m.busyUntil))) {
        pl.done = true; if (j === nextPlan) nextPlan++;
        if (late <= 1.5 && wasPerch) { liftFlames.n++; liftFlames.x += m.x; liftFlames.y += m.y; liftFlames.z += m.z; }
      } else if (late > 1.5) { m.busyUntil = -1e9; if (sendToLight(pl, t - late)) { pl.done = true; if (j === nextPlan) nextPlan++; } }
    }
    if (liftFlames.n) { const k = liftFlames.n; lifted(liftFlames.x / k, liftFlames.y / k, liftFlames.z / k, k, 'flames'); liftFlames = { n: 0, x: 0, y: 0, z: 0 }; }
  };

  // ---- the hull. It is the hull's COMING that lifts them, and only the nervous two in five: the rest sit it out, so a boat lying
  // by the gilding keeps moths to look at. Six to twelve lift together, circle, and settle on free perches 3 to 6 m further on (the
  // way the boat is going), eight seconds later; then a pause before the next lift.
  const nervous = []; let hullT = 0, hullPause = 0, uneasy = 0;
  const hull = (dt, force = false) => {
    hullPause -= dt;
    if ((hullT -= dt) > 0 && !force) return;
    hullT = 0.5;
    const boat = ctx.boat, t = now(), R = 4 + 0.75, fx = -Math.sin(boat.heading), fz = -Math.cos(boat.heading);
    // (the page's four metres are from the HULL: four metres of planks a metre and a half wide, not a point. So: four metres and half the beam
    // from its middle line, stern to bow. Counted from the boat's middle alone, a boat going along a wall three metres off had two moths in
    // reach, and two lifted where the page has six to twelve)
    const off = (m) => { const dx = m.x - boat.x, dz = m.z - boat.z, al = clamp(dx * fx + dz * fz, -1.6, 2.4); return Math.hypot(dx - fx * al, m.y - 0.5, dz - fz * al); };
    for (const m of moths) {
      if (m.kind !== 0 || m.gone || m.spec || m.stay || t < m.landed) continue;
      const d = off(m);
      if (d > R + 2) m.seen = false;
      else if (d < R && (force || (!m.seen && t > m.landed + 20))) { m.seen = true; if (force || rnd() < 0.55) nervous.push(m); }      // (rather more than the family's two in five: there are fewer on each pier now, and one in two still sits it out)
    }
    // (one the boat has left behind is uneasy no longer: without this a moth eleven metres astern lifted when its turn came)
    for (let k = nervous.length - 1; k >= 0; k--) { const m = nervous[k]; if (m.kind !== 0 || m.gone || t < m.landed || off(m) > R + 1.5) nervous.splice(k, 1); }
    uneasy = nervous.length ? uneasy + 0.5 : 0;
    if (num('mdbg', 0) === 7 && Math.floor(t) !== Math.floor(t - 0.5)) { let reach = 0, seen = 0; for (const m of moths) if (m.kind === 0 && !m.gone && off(m) < R) { reach++; if (m.seen) seen++; } console.log('INVALID_ debug hull at ' + t.toFixed(1) + ' s, boat s ' + (-boat.z).toFixed(1) + ' d ' + boat.x.toFixed(1) + ': in reach ' + reach + ', seen ' + seen + ', uneasy ' + nervous.length + ' for ' + uneasy.toFixed(1) + ' s, pause ' + hullPause.toFixed(1)); }
    // they go as a handful: when six are uneasy; or, where the gilt has few moths, two after two seconds, one after three and a half
    // (a handful: with a share of four to a pier there are a dozen at rest within the hull's four metres, six or seven of them uneasy: the page's
    // "6 to 12 lift" is here four to eight, or two or three where the gilt has few)
    if (force || (hullPause <= 0 && (nervous.length >= 4 || (nervous.length >= 2 && uneasy > 1.5) || uneasy > 3.5))) {
      uneasy = 0;
      const going = boat.speed > 0.2 ? (Math.cos(boat.heading) > 0 ? 1 : -1) : 0;      // +1: toward the stage (s grows as z falls; the boat's nose is its -Z)
      const wantN = Math.min(nervous.length, 4 + Math.floor(rnd() * 5)); let n = 0, sx = 0, sy = 0, sz = 0;
      for (const m of nervous.splice(0, wantN)) {
        const cand = [];
        for (const p of perches) {
          if (p.taken || !room(p, 1) || p.side !== m.side || p.level !== m.level) continue;      // (one over its share may land on a thing: every pier is full to its share, and a moth that lifts must come down somewhere)
          const ds = p.s - m.s, far = Math.abs(ds);
          if (far < 3 || far > 6 || (going && ds * going < 0)) continue;
          if (Math.hypot(p.x - boat.x, p.z - boat.z) < 2.2) continue;
          cand.push(p);
        }
        if (!cand.length) continue;
        const p = cand[Math.floor(rnd() * cand.length)], dist = Math.hypot(p.x - m.x, p.y - m.y, p.z - m.z), ox = m.x, oy = m.y, oz = m.z;
        // (never as one: two or three go at once, the rest after them over two seconds; each is seven to nine seconds about it, its own way out and round)
        if (move(m.i, { ...p, kind: 0 }, t + 0.05 + 2.0 * rnd() * rnd(), (6.2 + 0.25 * dist + 1.6 * rnd()) * (calm ? 1.2 : 1), 0.5 + 0.08 * dist + 0.25 * rnd(), (rnd() - 0.5) * 0.7)) {
          sx += ox; sy += oy; sz += oz; n++;                                   // (where it lifted from)
          if (m.perch) leave(m.perch); take(p); m.perch = p; m.level = p.level;
        }
      }
      nervous.length = Math.min(nervous.length, 24);
      if (n) { hullPause = 2.5 + rnd() * 2.5; lifted(sx / n, sy / n, sz / n, n, 'hull'); if (dev.has('mdbg')) console.log('INVALID_ debug hull lift at ' + t.toFixed(1) + ' s (boat s ' + (-boat.z).toFixed(1) + '): ' + n + ' moths'); }
    }
  };

  // ---- water-light opens them. The light on a moth is what the walls' paint shows at its perch: a fifth on still water,
  // more and higher as the wake arrives (lib.js: the walls' own record of it). Each opens when that passes its own nerve.
  const wake = H.wake, WN = wake.live.length / 2, wakeH = [4, 12], len = plan.length;
  const lightAt = (m) => {
    // (the arch's moths rest on what stands in open water: there the paint answers a moving boat directly, by its distance (light.js: `hBy`), not by the walls' record)
    const live = m.stay ? Math.min(1, (wake.stir || 0) * (1 - smooth(3, 13, Math.hypot(m.x - ctx.boat.x, m.z - ctx.boat.z))))
      : Math.min(1, wake.live[Math.min(WN - 1, Math.max(0, Math.round(m.s / len * (WN - 1)))) * 2 + m.side] || 0);
    return (1 - smooth(0, wakeH[0] + (wakeH[1] - wakeH[0]) * live, m.y)) * (0.2 + 0.8 * live);
  };
  // A moth with coloured hind wings shows them when it is disturbed, and folds again when it is left alone, or when it has grown used
  // to what disturbed it. So: the light's ARRIVAL at a moth opens it (1.2 s) and it stays open three to eight seconds of its own, then
  // folds (2 s) though the light still plays on it; while the light lasts it shows again now and then; when the light has sunk and
  // comes again, it opens again. A boat under way carries a flush of copper along the gilt beside it; a boat lying still sees tents.
  // EACH IN ITS OWN TIME. The light comes to a whole pier within a second, and every moth on it opened within that second and a half: a
  // mechanism. Now each starts when its own nerve gives: most within a second of the light, some two or three seconds late, and three in ten
  // sit this arrival out (they may show later, while the light lasts). On a pier of three they open one after another, or two of them do.
  const waterLight = (dt) => {
    const t = now(); let changed = false;
    for (const m of moths) {
      if (m.kind !== 0 || m.gone) continue;
      // (one on its way to another perch is already judged by the light THERE: by the time it has hold it is as that light would have it, and nothing snaps as it lifts)
      const l = lightAt(m);
      if (!m.lit && l > m.nerve) {
        m.lit = true; m.again = 1e9;
        if (rnd() < 0.7) { m.openFrom = t + 0.1 + 2.8 * rnd() * rnd(); m.openUntil = m.openFrom + 2.5 + 5.5 * rnd(); }
        else { m.openFrom = 1e9; m.openUntil = -1; m.again = t + 4 + 12 * rnd(); }
      }
      else if (m.lit && l < m.nerve - 0.07) { m.lit = false; m.openUntil = -1; m.openFrom = 1e9; }
      else if (m.lit && t > m.openUntil && m.again > 1e8) m.again = t + 9 + 16 * rnd();
      else if (m.lit && t > m.again) { m.openFrom = t; m.openUntil = t + 2 + 2.5 * rnd(); m.again = 1e9; }
      const o = m.spec ? (m.spec === 'open' ? Math.min(1, m.open + dt / 1.2) : 0) : m.lit && t >= m.openFrom && t < m.openUntil ? Math.min(1, m.open + dt / 1.2) : Math.max(0, m.open - dt / 2);
      if (o !== m.open) { m.open = o; aOpen[m.i] = o; changed = true; }
    }
    if (changed) openAttr.needsUpdate = true;
  };

  // ---- where moth q is now, worked out here as the shader works it out (without its flutter and the gust): for the developer's eye (&mwatch=)
  const whereIs = (q, t, out) => {
    const sx = aSeed[q * 4], sy = aSeed[q * 4 + 1], sz = aSeed[q * 4 + 2], sw = aSeed[q * 4 + 3];
    const place = (P, F, o, res, t) => {
      const kind = P[o + 3], px = P[o], py = P[o + 1], pz = P[o + 2];
      if (kind < 0.5) { res[0] = px; res[1] = py; res[2] = pz; return; }
      t *= calm ? 0.6 : 1;
      const nx = Math.sin(F[o + 3]), nz = Math.cos(F[o + 3]), tx = nz, tz = -nx;
      if (kind < 1.5) {
        let a = t * (0.45 + 0.4 * sx) + sy * 40; a += 0.55 * Math.sin(a * 0.37 + sz * 20) + 0.3 * Math.sin(a * 2.3 + sw * 20);
        const dn = 1.05 + 0.3 * Math.sin(a * 1.7 + 2) + 0.1 * Math.sin(a * 3.1 + sy * 9), dt = 0.62 * Math.sin(a * 1.3) + 0.2 * Math.sin(a * 2.9 + sw * 9);
        res[0] = px + nx * dn + tx * dt; res[1] = py + 0.3 * Math.sin(a * 0.9 + 1) + 0.12 * Math.sin(a * 3.7 + sx * 9); res[2] = pz + nz * dn + tz * dt; return;
      }
      const q1 = t * (1.05 + 0.5 * sz) + sx * 40, q2 = t * (2.6 + 0.9 * sw) + sy * 40;
      const r = (0.2 + 0.3 * (0.5 + 0.5 * Math.sin(q1 * 0.31 + sw * TAU))) * (1 + 0.2 * Math.sin(q1 * 1.31 + 2) + 0.1 * Math.sin(q2 + 0.5));
      const th = (sz > 0.5 ? 1 : -1) * (t * 2.57 * (0.8 + 0.4 * sy) + 0.85 * Math.sin(q1) + 0.38 * Math.sin(q2 * 1.17 + 1)) + sw * TAU;
      const y = 0.05 + (0.05 + 0.2 * r) * Math.sin(t * 1.9 + sx * 30) + r * 0.45 * Math.sin(q1 * 0.53 + sw * TAU) * Math.sin(th + sy * TAU) + 0.04 * Math.sin(q2 * 1.43);
      if (kind < 2.5) {
        const a = 0.3 + 0.5 * r, sn = Math.sin(th), out = sn > 0 ? 0.6 * a * sn : 0.2 * sn, dt = a * Math.cos(th), dn = out - 0.03, yy = y + (Math.abs(y) + 0.03 - y) * (1 - smooth(-0.1, 0.05, out));
        res[0] = px + tx * dt + nx * dn; res[1] = py + yy; res[2] = pz + tz * dt + nz * dn; return;
      }
      const R = F[o] + r, tr = th * 0.36; res[0] = px + Math.cos(tr) * R; res[1] = py + y; res[2] = pz + Math.sin(tr) * R;
    };
    const o = q * 4, pa = aA[o + 3] < 0.5 ? 1 : 0, pb = aB[o + 3] < 0.5 ? 1 : 0, t1 = aMove[o] + 0.3 * pa, D = Math.max(aMove[o + 1], 0.01), k = clamp((t - t1) / D, 0, 1), e = k * k * (3 - 2 * k), m = 1 - e;
    const A3 = [0, 0, 0], B3 = [0, 0, 0]; place(aA, aAf, o, A3, t); place(aB, aBf, o, B3, t);
    const nAx = Math.sin(aAf[o + 3]), nAz = Math.cos(aAf[o + 3]), nBx = Math.sin(aBf[o + 3]), nBz = Math.cos(aBf[o + 3]), bow = aMove[o + 2], side = aMove[o + 3];
    const c1 = [A3[0] + nAx * bow + nAz * side, A3[1] + 0.25 * bow, A3[2] + nAz * bow - nAx * side], c2 = [B3[0] + nBx * 0.8 * bow + nBz * side, B3[1] - 0.2 * bow, B3[2] + nBz * 0.8 * bow - nBx * side];
    const w0 = m * m * m, w1 = 3 * m * m * e, w2 = 3 * m * e * e, w3 = e * e * e;
    return out.set(w0 * A3[0] + w1 * c1[0] + w2 * c2[0] + w3 * B3[0], w0 * A3[1] + w1 * c1[1] + w2 * c2[1] + w3 * B3[1], w0 * A3[2] + w1 * c1[2] + w2 * c2[2] + w3 * B3[2]);
  };

  // ---- the staging's controls
  const api = {
    object, count: N, resting: nRest, flying: nFly, perches, lights, moths, whereIs,
    /** The way moth q's place faces (a perch: the surface's own way; on the wing or at a light: the level way into the room). */
    facing(q, out) { const o = q * 4; return aB[o + 3] < 0.5 ? out.set(aBf[o], aBf[o + 1], aBf[o + 2]).normalize() : out.set(Math.sin(aBf[o + 3]), 0, Math.cos(aBf[o + 3])); },
    /** Follows shared.show.c by itself: as the edge of flame passes its light, each moth leaves the gilt for it; and at c 29 (the fall) those on the wing are thrown, once. Set false to drive toFlames and gust yourself. */
    follow: dev.get('mfollow') !== '0',
    /** fn({ x, y, z, n, why: 'hull' | 'flames' }) where moths lift from the gilt: the place for the page's `flutter`. Called at most once a second. */
    onLift: null,
    /**
     * Tier `tier`'s moths (1..5; 6: the lustres'; 'all') leave for its flames, in a front that runs both ways along the fronts
     * from the bracket nearest s 58 at `speed` m/s, beginning now (or `at`, the realm's clock; far in the past: they are there).
     */
    toFlames(tier = 'all', { at: when = null, speed = plan.show.speed } = {}) {
      const t0 = when ?? now(); let n = 0;
      for (const pl of plans) {
        if (pl.done || (tier !== 'all' && pl.L.tier !== tier)) continue;
        const m = moths[pl.q], tAt = t0 + pl.L.arc58 / speed + 0.5 + (pl.c - pl.L.t - 0.5);
        if (tAt < now() - 1.5) m.busyUntil = -1e9;
        if (sendToLight(pl, Math.max(tAt, tAt < now() - 1.5 ? -1e9 : m.busyUntil))) { pl.done = true; n++; }
      }
      flush(); return n;
    },
    /** Those on the wing are thrown along their walls toward the stage (up to 3 m) and out into the room, and gather again over `seconds`. strength 1 is the fall's. */
    gust(strength = 1, seconds = 5) { U.uGmGust.value.set(now(), strength * (calm ? 0.4 : 1), seconds, 0); return api; },
    /** Open them all flat (1) or let them be (0): for a picture. */
    open(k = 1) { U.uGmAll.value = k; return api; },
    /** The moths at rest within `radius` metres of the hull lift now (as they do of themselves when it comes). */
    lift() { hull(0, true); flush(); return api; },
    /** How many are where, now: { resting, flying, atLights, onTheWay }. */
    census() { const t = now(), r = { resting: 0, flying: 0, atLights: 0, onTheWay: 0, open: 0 }; for (const m of moths) { if (t < m.busyUntil) r.onTheWay++; else if (m.kind === 0) { r.resting++; if (m.open > 0.5) r.open++; } else if (m.kind === 1) r.flying++; else r.atLights++; } return r; },
  };
  // THE FALL (the show clock at 29: the draught strengthens for eight seconds and "the moths are thrown and gather again"). While they follow the
  // house's clock they are thrown by it too, once, as the flames lean and the leaves pour: so that the fall is whole before anybody stages it. The
  // staging may fire `gust` itself as well (a second call a moment later only begins the same gust again), or take both over with `follow = false`.
  // (An area entered after c 37 has had its fall: nothing is thrown.)
  let gustAt = num('mgust', -1), liftAt = num('mlift', -1), first = true, fallen = false;
  const update = (dt) => {
    const t = now();
    U.uGmT.value = t; U.uGmBeat.value = (t * 9 * (calm ? 0.7 : 1)) % 1;
    if (api.follow && show.c > 0) followClock(show.c);
    if (api.follow && !fallen && show.c >= 29) { fallen = true; if (show.c < 37) api.gust(1, 8); }
    if (dev.get('mhull') !== '0') hull(dt);                                // (&mhull=0: the hull lifts nobody, to look at them where they sit)
    waterLight(dt);
    if (gustAt >= 0 && t >= gustAt) { gustAt = -1; api.gust(1, 5); }
    while (specFly.length && t >= num('mspecfly', 2)) { const [q, P] = specFly.shift(); move(q, P, t, num('mspecsec', 2.2), 0.3, 0.12); moths[q].perch = P; }
    if (liftAt >= 0 && t >= liftAt) { liftAt = -1; hull(0, true); }
    flush();
    if (first && (num('mdbg', 0) === 1 || num('mdbg', 0) === 2)) {
      first = false; const lk = dev.has('mlook') ? dev.get('mlook').split(',').map(Number) : null, boat = lk ? { x: lk[1], z: -lk[0] } : ctx.boat;      // (nearest to where &mlook looks, or to the boat)
      const f1 = (v) => +v.toFixed(2), by = (kind) => moths.filter((m) => m.kind === kind).map((m) => [Math.hypot(m.x - boat.x, m.z - boat.z), m]).sort((p, q) => p[0] - q[0]);
      console.log('INVALID_ debug gilt moths ' + JSON.stringify({ N, nRest, nFly, arch: archReport, perches: perches.length, found: perches.report, seats: got, lights: lights.length, plans: plans.length, tris: geo.userData.triangles, census: api.census() }));
      { const byG = [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]], seen = new Set(); for (const p of perches) if (p.copy >= 0 && !seen.has(p.copy)) { seen.add(p.copy); const g = groupOf(p); byG[g][0]++; byG[g][1] += cap[p.copy]; byG[g][2] += held[p.copy]; }
        console.log('INVALID_ debug seats [things, their shares, held] parterre piers ' + byG[0] + ' | box fronts ' + byG[1] + ' | tier-1 fronts ' + byG[2] + ' | tier-1 piers ' + byG[3] + ' | at rest ' + nRest + ', on the wing ' + nFly + ', lights ' + lights.length + ', to the lights ' + plans.length); }
      console.log('INVALID_ debug at rest [i,s,d,y,on,nx,ny,nz] ' + JSON.stringify(by(0).slice(0, num('mdbg', 1) > 1 ? 40 : 9).map(([, m]) => [m.i, f1(m.s), f1(m.x), f1(m.y), m.perch.on.slice(0, 3), f1(m.perch.nx), f1(m.perch.ny), f1(m.perch.nz)])));
      console.log('INVALID_ debug on the wing [i,s,d,y of the loop] ' + JSON.stringify(by(1).slice(0, 8).map(([, m]) => [m.i, f1(m.s - 1.05 * Math.cos(m.home.room)), f1(m.x + 1.05 * Math.sin(m.home.room)), f1(m.y)])));
    }
  };
  return { api, update };
}

// ================================================================================================ pearl moths
// The large pale kind: the insects family's makePearlMoths (its moth.glb, its flight: a crossing that weaves and arcs, the body
// rising and dipping with every slow beat, a third of a second of flutter as it takes hold, flat and open at rest), drawn half as
// large again as the family's 8 cm so that it is the larger moth here, and dressed in the house's light.
//   WHERE THEY LIVE is this module's. The family flies a straight line from perch to perch, two metres wide and two and a half
//   high, and picks its next perch by distance alone; in this room that would take a moth through the trunk, the rain, a hanging
//   cloth. So each moth here has ITS OWN CROSSING between two places that were looked at (below), rests 20 to 60 s at either
//   end, and is told when to go (the family's own take-off flutter, then its flight, re-aimed at the place meant).
//   The lantern's crook is a place like any other: when the boat has held still five seconds, the nearest one at rest within
//   25 m comes to it, lies flat on the stem facing the rider, and leaves when the boat makes way.

/** A ctx for a toolkit family whose creatures must wear the house's light: what the family asks of kit.gouache is dressed in the house's paint (lib.js). */
function inTheHouse(ctx, H, kind, also) {
  const kit = Object.create(ctx.kit);
  // (The families call the lens's keep-out `uKeep`, a float in the vertex shader; the house's light has a `uKeep` of its own, a vec4 in
  // the fragment shader, and one program cannot hold both: the family's is given another name here, in its own text, with its own value.)
  const renamed = (ex) => {
    if (!ex) return ex;
    const out = { ...ex };
    for (const k of ['vertexPars', 'vertexLocal', 'vertexWorld', 'fragmentPars', 'albedo', 'light', 'fog', 'final']) if (typeof out[k] === 'string') out[k] = out[k].replace(/\buKeep\b/g, 'uLifeKeep');
    if (ex.uniforms && 'uKeep' in ex.uniforms) { out.uniforms = { ...ex.uniforms, uLifeKeep: ex.uniforms.uKeep }; delete out.uniforms.uKeep; }
    return out;
  };
  kit.gouache = (o = {}) => ctx.kit.gouache(H.dress(kind, { ...o, crisp: true, extend: [].concat(o.extend || []).map(renamed).concat(also || []) }));
  const c2 = Object.create(ctx); c2.kit = kit;
  return c2;
}
/** The plain meshes under some objects (no instanced multitudes, no sprites), and each one's place in the realm. */
function meshesUnder(roots) {
  const out = [];
  for (const r of [].concat(roots || [])) if (r) { r.updateWorldMatrix(true, true); r.traverse((o) => { if (o.isMesh && !o.isInstancedMesh && o.geometry && !o.geometry.isInstancedBufferGeometry && o.geometry.attributes.position) out.push(o); }); }
  return out;
}
/**
 * A place on an upright face of something, as an eye standing the way (sin a, 0, cos a) from it sees it: the even, supported
 * spot nearest height `prefer` within `reach` metres either side of `near` ([x, z]): { x, y, z, nx, ny, nz }, or null.
 */
function uprightPlace(T, a, o) {
  if (!T.n) return null;
  const V = viewOf(T, a, 0.04), xc = o.near[0] * V.ca - o.near[1] * V.sa, zc = o.near[0] * V.sa + o.near[1] * V.ca, e = o.e ?? 0.035;
  let best = null, bs = 1e9;
  const zMax = zc + (o.depth ?? 0.7);                                        // (what stands between the eye and the place is looked past: the other pier of an arch, a neighbour)
  for (let y = o.y[0]; y <= o.y[1]; y += 0.025) for (let x = xc - o.reach; x <= xc + o.reach; x += 0.025) {
    const h = V.cast(x, y, zMax);
    if (!h || h.nz < 0.6 || Math.abs(h.z - zc) > (o.depth ?? 0.7)) continue;
    const z0 = h.z, hx = h.nx, hy = h.ny, hz = h.nz; let ok = true;
    for (const [dx, dy] of [[e, 0], [-e, 0], [0, e], [0, -e]]) { const g = V.cast(x + dx, y + dy, zMax); if (!g || Math.abs(g.z - z0) > 0.02) { ok = false; break; } }
    if (!ok) continue;
    const score = Math.abs(y - o.prefer) + (o.xw ?? 0.4) * Math.abs(x - xc) + (o.nw ?? 1) * (1 - hz);      // (xw, nw: on a round post what counts is the strip that looks straight at the eye, not how near it is to where the post's foot stands)
    if (score < bs) { bs = score; best = [x, y, z0, hx, hy, hz]; }
  }
  if (!best) return null;
  const [xe, y, ze, hx, hy, hz] = best, nx = hx * V.ca + hz * V.sa, nz = -hx * V.sa + hz * V.ca, c = 0.006;
  return { x: xe * V.ca + ze * V.sa + nx * c, y: y + hy * c, z: -xe * V.sa + ze * V.ca + nz * c, nx, ny: hy, nz };
}

/**
 * Where the pearl moths rest: { perches: [{ x, y, z, nx, ny, nz } | a place on the boat], named: { name: index }, notes }.
 * Found before the gilt moths are seated, so that no small moth sits where a large one comes down.
 */
function pearlPlaces(ctx, plan, shared) {
  const K = shared.kitFloor, rig = shared.stageRig, m4 = new THREE.Matrix4(), inv = new THREE.Matrix4();
  const perches = [], named = {}, notes = {};
  const add = (name, p) => { if (p) { if (p.askew == null && Math.abs(p.ny || 0) < 0.75) p.askew = (hash01(perches.length * 2.9 + 0.4) - 0.5) * (/^lampPost|^pin/.test(name) ? 0.3 : 0.7); named[name] = perches.length; perches.push(p); } else notes[name] = 'not found'; return !!p; };
  const tryTo = (name, fn) => { try { add(name, fn()); } catch (err) { notes[name] = 'failed: ' + ((err && err.message) || err); } };
  const group = (re) => { let hit = null; ctx.group.traverse((o) => { if (!hit && o.name && re.test(o.name)) hit = o; }); return hit; };
  const copyOf = (res, i) => { const q = res && res.meshes ? res : res && res.near && res.near.meshes ? res.near : null; if (!q) return null; q.meshes[0].getMatrixAt(i, m4); const mx = m4.clone(); return trianglesOf(q.meshes, () => mx); };
  const standing = (roots) => trianglesOf(meshesUnder(roots), (o) => o.matrixWorld);

  // ---- the places.
  // AT A RAIL: THE PIER'S PEDESTAL, NOT THE VELVET. A moth that rests flat on the top of a rail a hand above the water is seen from the
  // boat at fifteen degrees and from mid-channel edge-on: a sliver (the family's page says as much: give it an upright face). So the
  // house's moths rest on the face of a pier's pedestal where it stands in the rail, a forearm above the water, head up, seen whole
  // from the boat and from across the house. The place is found on the pier's own model, where it stands.
  const piersUsed = new Set();
  const pier = (side, sWant) => {
    if (!K || !K.piers || !K.pierModels) return null;
    let P = null, bd = 1e9; for (const q of K.piers) if (q.side === side && !piersUsed.has(q) && Math.abs(q.s - sWant) < bd) { bd = Math.abs(q.s - sWant); P = q; }
    if (!P) return null;
    // which of the two pier models stands here: the one that has a copy at this very place (else the floor's own rule: every third is b)
    const sets = K.pierModels.map((res) => (res && res.meshes ? res : res && res.near && res.near.meshes ? res.near : null));
    let k = -1;
    sets.forEach((q, j) => { if (!q) return; const mesh = q.meshes[0]; for (let i = 0; i < mesh.count && k < 0; i++) { mesh.getMatrixAt(i, m4); if (Math.hypot(m4.elements[12] - P.pos.x, m4.elements[14] - P.pos.z) < 0.05) k = j; } });
    if (k < 0) k = (P.i + (P.side > 0 ? 1 : 0)) % 3 === 1 ? 1 : 0;
    if (!sets[k]) return null;
    const mx = new THREE.Matrix4().makeRotationY(P.turn).setPosition(P.pos), T = trianglesOf(sets[k].meshes, () => mx), ox = Math.sin(P.turn), oz = Math.cos(P.turn);
    // NOT AN INLAY. In the middle of the panel, upright, straight above the painted rosette, a pale moth was a gilt ornament in the shape of a
    // moth, the same on six pedestals (.shots/theatre_mo5_08_near_rest.png). A moth that has come down on a pedestal lies where it came down: a
    // hand to one side of the middle, higher or lower, and askew (`askew`, radians about the way the face looks: see `settleAskew` in makePearls).
    const h1 = hash01(P.i * 7.13 + (P.side > 0 ? 3.7 : 0.9)), h2 = hash01(P.i * 3.31 + (P.side > 0 ? 8.2 : 5.5)), off = (h1 < 0.5 ? -1 : 1) * (0.045 + 0.03 * h2);
    for (const [e, lo, o] of [[0.05, 0.36, off], [0.05, 0.3, 0], [0.035, 0.26, 0]]) {      // (even over the moth's body and a little more; the middle if the side is carved; a narrower spot if the face is carved all over)
      const q = uprightPlace(T, P.turn, { near: [P.pos.x + ox * 0.26 + oz * o, P.pos.z + oz * 0.26 - ox * o], reach: o ? 0.05 : 0.17, y: [lo, 0.56], prefer: o ? 0.41 + 0.11 * h1 : 0.45, depth: 0.3, e });
      if (q) { piersUsed.add(P); q.askew = (h2 < 0.5 ? -1 : 1) * (0.3 + 0.4 * hash01(P.i * 5.77 + 1.3)); return q; }
    }
    return null;
  };
  // (the velvet top of a rail: kept for a pier on which no even face is found)
  const railsUsed = new Set();
  const rail = (side, sWant) => {
    if (!K || !K.bays || !K.bays.length) return null;
    let bay = null, bd = 1e9; for (const b of K.bays) if (b.side === side && b.design !== 'c' && !railsUsed.has(b) && Math.abs(b.s - sWant) < bd) { bd = Math.abs(b.s - sWant); bay = b; }      // (not a box whose curtains are drawn; never two moths' places on one rail)
    if (!bay) return null;
    railsUsed.add(bay);
    const pt = (K.points || {})['parterre_box_' + (bay.design || 'a')] || (K.points || {}).parterre_box_a, top = pt && pt.rail ? pt.rail[0] : [-1.5, -0.11, 0.252];
    const things = (K.trinkets || []).filter((t) => t.bay === bay).map((t) => t.at);
    let best = null, bs = -1;
    for (let x = -1.2; x <= 1.2; x += 0.2) { const p = bay.at(x, top[2] + 0.006, -top[1]); let d = 9; for (const q of things) d = Math.min(d, Math.hypot(q.x - p.x, q.z - p.z)); d -= 0.15 * Math.abs(x); if (d > bs) { bs = d; best = p; } }
    return bs > 0.3 ? { x: best.x, y: best.y, z: best.z, nx: 0, ny: 1, nz: 0 } : null;
  };
  // the three arches: the two faces of the middle arch's reveal, 7 m apart, a head above the water. The moth that "crosses the bow" crosses
  // here, inside the arch, against the lit house: in the foyer proper the veil's dark hides a pale mote (tried between the lamp standards).
  {
    const walls = []; ctx.group.traverse((o) => { if (o.name && /royal_wall/.test(o.name) && !/^standin/.test(o.name) && o.parent === ctx.group) walls.push(o); });
    const AW = plan.archWall, sMid = (AW.s[0] + AW.s[1]) / 2, half = AW.archWidth / 2;
    if (walls.length) { const T = (() => { try { return standing(walls); } catch (err) { return { n: 0 }; } })();
      // (AT THE RIDER'S OWN HEIGHT. The family's crossing rises three quarters of a metre over its ends. From places a man's height up the
      // moth passed the middle of the arch 2.6 m above the water: from a boat four metres short of it that is twenty degrees up, at the top
      // edge of a level view and against the lit rain and the crown, and no picture taken from the boat showed it. From a metre above the
      // water it passes at 1.6 to 2.2 m: nine degrees up from a boat five and a half metres short, against the dark of the far house, two
      // strides beyond the lantern and lit by it. It is never in the lane the family keeps clear for the hull: see `autos.bow` in makePearls.)
      tryTo('archL', () => uprightPlace(T, Math.PI / 2, { near: [-half, -sMid], reach: 0.7, y: [0.35, 1.3], prefer: num('parchy', 0.5), depth: 0.5 }));
      tryTo('archR', () => uprightPlace(T, -Math.PI / 2, { near: [half, -sMid], reach: 0.7, y: [0.3, 1.3], prefer: num('parchy', 0.36), depth: 0.5 })); }      // (the bow's moth starts here: from a forearm above the water its crossing comes over the boat's line a metre and a half up)
    else notes.arch = 'no arch wall';
  }
  // the foyer: the two bronze lamp standards on the newels, their shafts where they face the water
  [['foyerL', 0], ['foyerR', 1]].forEach(([name, i]) => tryTo(name, () => { const T = copyOf(K && K.lampStandards, i); if (!T) return null; const x = (i ? 1 : -1) * plan.foyer.newel.d; return uprightPlace(T, i ? -Math.PI / 2 : Math.PI / 2, { near: [x, -plan.foyer.newel.s], reach: 0.35, y: [1.2, 2.05], prefer: 1.7 }); }));
  // the house: rails either side, clear of the rain and of the tree; the left one by the tree stands at the edge of the shaft
  for (const [name, side, sv] of [['pierL36', -1, 37], ['pierR36', 1, 37], ['pierL48', -1, 48.5], ['pierR44', 1, 44], ['pierL66', -1, 66], ['pierR58', 1, 58.5], ['pierR68', 1, 68], ['pierL76', -1, 77], ['pierR76', 1, 76], ['pierL40', -1, 40.5], ['pierR52', 1, 52], ['pierL45', -1, 45.5]]) tryTo(name, () => { const q = pier(side, sv); if (q) return q; notes[name + ' on'] = 'the rail (no even face on the pier)'; return rail(side, sv); });
  // the pit: the harp's column on the left, a kettledrum's bowl on the right, where they face the channel
  const O = plan.orchestra;
  {
    const T = (() => { try { return standing(rig && rig.harp ? rig.harp.group : group(/^harp$/)); } catch (err) { return { n: 0 }; } })(), near = [O.harp[1], -O.harp[0]];
    tryTo('harp', () => uprightPlace(T, Math.PI / 2, { near, reach: 0.9, y: [0.3, 1.1], prefer: 0.62, depth: 1.2, xw: 0.1, nw: 4 }));
    // (a second place on it, a forearm from the first: two moths have the harp for an end of their crossings; the kettledrums and the bass show no upright face above the water)
    tryTo('harp2', () => { const h = named.harp != null ? perches[named.harp] : null; if (!h) return null; for (const prefer of [h.y - 0.24, h.y + 0.26, h.y - 0.34]) { const q = uprightPlace(T, Math.PI / 2, { near, reach: 0.9, y: [Math.max(0.24, prefer - 0.05), prefer + 0.05], prefer, depth: 1.2, xw: 0.1, nw: 4 }); if (q && Math.hypot(q.x - h.x, q.y - h.y, q.z - h.z) > 0.19) return q; } return null; });
  }
  // the stage: the kept lamp's post, where it faces the house
  tryTo('lampPost', () => { const L = shared.lamp; if (!L || !L.group) return null; const f = at(ctx, plan.lamp.s, dev.has('lampd') ? +dev.get('lampd') : plan.lamp.d, 0); const T = standing(L.group), o = { near: [f.x, f.z], reach: 0.45, y: [0.95, 1.7], prefer: 1.3, depth: 0.8 }, a = Math.atan2(-f.x, 10); return postPlace(T, a, o) || uprightPlace(T, a, o); });      // (the side of the post that looks down the stage at a boat coming up the middle)
  // the fly tower: the pin rails either side, between the first cloth and the second, clear of any bag that hangs low
  {
    const pins = group(/^pin_rail x/), bags = rig && rig.bags ? rig.bags.list || [] : [];
    let sBest = 131.5, clear = -1;
    for (let sv = 130.6; sv <= 132.7; sv += 0.3) { let d = 9; for (const b of bags) if (b.y < 5) d = Math.min(d, Math.abs(b.s - sv)); if (d > clear) { clear = d; sBest = sv; } }
    if (pins && pins.children.length) [['pinL', 0, -1], ['pinR', 1, 1]].forEach(([name, i, sg]) => tryTo(name, () => { const q = { meshes: pins.children.filter((o) => o.isInstancedMesh) }; const T = copyOf(q, i); return T && uprightPlace(T, sg > 0 ? -Math.PI / 2 : Math.PI / 2, { near: [sg * 11.6, -sBest], reach: 0.7, y: [0.5, 1.5], prefer: 0.95, depth: 1.0 }); }));
    else notes.pins = 'no pin rails';
  }
  // The lantern's crook: the upright iron of the crook at the bow, on the side that faces the rider; found on the boat itself.
  //  - THE BOAT IN THE RIG IS NOT ALWAYS THE SAME OBJECT. An area that gives look.boat (this one gives a tone) has a recoloured copy
  //    of the model put in the rig when it becomes current, which is after this is built: the perch therefore asks the engine for
  //    the boat every time it is read (a getter), and never keeps the one that stood there at build time.
  //  - It is looked for on the boat's own body alone, between the stem head and the arch of the crook: the lamp that hangs there
  //    has a halo, a sheet behind the crook, which a search of everything under the boat took for a hand's breadth of iron.
  let lantern = null;
  try {
    const bm = ctx.engine.boat.model, g = bm.group, PT = bm.points || {}; g.updateWorldMatrix(true, true); inv.copy(g.matrixWorld).invert();
    const hung = new Set(); if (bm.lantern) bm.lantern.traverse((o) => hung.add(o));
    const solid = (o) => { const m = Array.isArray(o.material) ? o.material[0] : o.material; return o.visible && !hung.has(o) && !(m && (m.transparent || m.colorWrite === false)); };
    const body = meshesUnder(g).filter(solid), stemY = PT.stemHead ? PT.stemHead.y : 0.699, stemZ = PT.stemHead ? PT.stemHead.z : -2.4035, topY = PT.crookTop ? PT.crookTop.y : 1.078;
    let found = null;
    if (body.length) {
      const T = trianglesOf(body, (o) => new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld)), V = viewOf(T, 0, 0.02);
      const y0 = stemY + 0.07, y1 = topY - 0.17, zNear = stemZ + 0.3; let bs = 1e9;      // (the bar stands plain between its two collars: a finger thick, nothing beside it)
      for (let y = y0; y <= y1 + 1e-6; y += 0.01) {
        let xa = null, xb = null, zn = -1e9;
        for (let x = -0.06; x <= 0.0601; x += 0.002) { const h = V.cast(x, y, zNear); if (h) { if (xa == null) xa = x; xb = x; if (h.z > zn) zn = h.z; } }
        if (xa == null || xb - xa < 0.008 || xb - xa > 0.036) continue;
        const score = Math.abs(y - (y0 + y1) / 2); if (score < bs) { bs = score; found = [(xa + xb) / 2, y, zn]; }
      }
    }
    if (!found) { found = [-0.006, stemY + 0.12, stemZ + 0.097]; notes.crook = 'by the numbers'; }      // (the boat's script: a bar 2 cm thick standing 8.5 cm aft of the stem head's point)
    lantern = { get object() { return ctx.engine.boat.model.group; }, offset: [found[0], found[1], found[2] + 0.006], normal: [0, 0, 1] };
  } catch (err) { notes.crook = 'failed: ' + ((err && err.message) || err); }
  if (lantern) { named.crook = perches.length; perches.push(lantern); }
  return { perches, named, notes };
}

/**
 * A place on a round upright (a post, a column), as an eye standing the way (sin a, 0, cos a) from it sees it: the middle of its
 * outline at the height nearest `prefer`, on the side toward the eye: { x, y, z, nx, ny, nz }, or null. (uprightPlace looks for an even
 * FACE; on a post of eight flat sides that leans, it took the edge of a side: the moth sat a thumb off the middle.)
 */
function postPlace(T, a, o) {
  if (!T.n) return null;
  const V = viewOf(T, a, 0.04), xc = o.near[0] * V.ca - o.near[1] * V.sa, zc = o.near[0] * V.sa + o.near[1] * V.ca, depth = o.depth ?? 0.7;
  let best = null, bs = 1e9;
  for (let y = o.y[0]; y <= o.y[1] + 1e-6; y += 0.02) {
    // the runs of surface across the outline at this height; the one nearest where the thing stands
    let run = null, runs = [];
    for (let x = xc - o.reach; x <= xc + o.reach + 1e-6; x += 0.005) {
      const h = V.cast(x, y, zc + depth);
      if (h && Math.abs(h.z - zc) <= depth) { if (!run) runs.push(run = { a: x, b: x, z: h.z }); else { run.b = x; if (h.z > run.z) run.z = h.z; } } else run = null;
    }
    for (const r of runs) {
      const w = r.b - r.a; if (w < (o.thick ? o.thick[0] : 0.04) || w > (o.thick ? o.thick[1] : 0.3)) continue;
      const score = Math.abs(y - o.prefer) + 0.3 * Math.abs((r.a + r.b) / 2 - xc);
      if (score < bs) { bs = score; best = [(r.a + r.b) / 2, y, r.z]; }
    }
  }
  if (!best) return null;
  const [xe, y, ze] = best, c = 0.006;
  return { x: xe * V.ca + (ze + c) * V.sa, y, z: -xe * V.sa + (ze + c) * V.ca, nx: V.sa, ny: 0, nz: V.ca };
}

async function makePearls(ctx, plan, shared, H, places) {
  const rnd = ctx.rng(4711), show = shared.show || { c: -1 }, boat = ctx.boat, { perches, named, notes } = places;

  // ---- the crossings: [one end, the other, when it may be flown]. Each was drawn on the plan against the tree (a collider of 6.8 m at
  // s 58, d -9), the rain (9.5 m round the same), the lustres (2.2 m inside the fronts, 7 m up), the curtain and the cloths.
  const hemUp = () => plan.curtainHem(show.c) > 9;                            // the curtain is up: the way between the pit and the stage is open
  const want = [
    // the one that crosses the bow: from the right face of the middle arch's reveal ASLANT down the house to a pier of the left-hand boxes, 30 m (see
    // `autos.bow`); or, without that pier, straight across the arch, 7 m; or, without the arch wall, across the foyer between its lamp standards, 15 m
    named.archR != null && named.pierL45 != null ? ['archR', 'pierL45'] : named.archL != null && named.archR != null ? ['archL', 'archR'] : ['foyerL', 'foyerR'],
    ['pierL36', 'pierR36'],                                                   // across the rear stalls, 40 m, in front of the arches
    ['pierR44', 'pierL48'],                                                   // 44 m, past the rain's rear hem (11 m from the trunk)
    ['pierL66', 'pierR68'],                                                   // 41 m from the left fronts at the edge of the shaft, through the rain's stage-side hem (9.4 m from the trunk), to the right
    ['pierR58', 'harp'],                                                      // 40 m, slantwise down the house to the harp's column
    ['pierL76', 'pierR76'],                                                   // across the front stalls, 39 m
    ['pierL40', 'pierR52'],                                                   // 45 m, slantwise across the rear stalls (14 m from the trunk)
    ['lampPost', 'harp2', hemUp],                                             // the lamp's post and the harp, 31 m, through the arch: only once the curtain is up
    ['pinL', 'pinR'],                                                         // across the fly tower, 23 m, between the first cloth and the second
  ].filter(([a, b]) => named[a] != null && named[b] != null);
  if (named.lampPost != null && !want.some((w) => w[0] === 'lampPost')) notes.lamp = 'no second place: the lamp has no moth';
  if (!want.length) { shared.cast.pearls = { count: 0, notes }; return { api: shared.cast.pearls, update() {} }; }

  // ---- the animals: one for each crossing, each starting at one end of its own
  // Its paint: the room's own light on a pale thing. It keeps a little of its pearl in warm light (a fifth toward its own grey) and is held
  // to a cream that keeps its colour: on the crook, a forearm from the lantern's flame, it was a white cut-out at the first cap of 0.92.
  // And it takes the bow lantern's light WHOLE: the house draws the lantern in to a pool for walls and piers (light.js), but a pale moth that
  // passes the bow three metres off is the one thing there that should catch it.
  const PALE = { uniforms: { uPmLanK: lanternDrawnIn(H) }, fragmentPars: 'uniform float uPmLanK;', light: `{ vec3 pmLv = uLanternPos - vWPos; c += albedo * pointLight(uLanternPos, uLanternColor, uLanternRadius, N) * (uPmLanK * (1.0 - 1.0 / (1.0 + dot(pmLv, pmLv) / 6.0)));
    float pmL = dot(c, vec3(0.3, 0.55, 0.15)); c = mix(c, vec3(pmL) * vec3(1.04, 1.0, 0.92), ${num('ppale', 0.6).toFixed(3)}); float pmM = max(c.r, max(c.g, c.b)); c *= min(1.0, ${num('pcap', 0.66).toFixed(3)} / max(pmM, 1e-3)); }` };
  // IN THE DARK IT IS THE PALEST THING THERE. A pearl moth crossing the unlit house away from the lantern took twice the room's dark, as a wall
  // takes it once: it came out as dark as the box behind it, and a crossing followed from the boat showed nothing at all until the moth was
  // over the lantern (.shots/theatre_m4_10_pearl_cross_crop.png). A pale moth in a dim room is seen because it gives back five or six times
  // what the walls give: `pdark` is that (4.5: at 7 one at rest on a dark pedestal was a lit sign). And it keeps its own pearl in the dark
  // (`pkeep`: at a third, the room's green dark made it cyan). Still held under `pcap` of white: lit, never a light.
  const ctxH = inTheHouse(ctx, H, { take: [0, 1, 1, 1], keep: [num('pkeep', 0.85), num('pdark', 4.5), 0.15, 0.05] }, PALE);
  const speed = 1.5, SIZE = num('psize', 1.5);
  // (the family seats its moths on perches chosen at random: a list of the starting places alone, in order, would not do; so every place is given, and each moth is set down on its own before the first frame)
  // (on the screen: never under 18 pixels across the spread wings, and never drawn up more than 2.6 times: 31 cm, reached 13 m off. A moth on the
  // wing seen from the side shows a third of its span; at the family's 10 pixels a crossing 15 m off was a mark of four pixels, under the painter's brush)
  const pearls = await makePearlMoths(ctxH, { count: want.length, perches, size: SIZE, minPixels: num('pminpx', 18), maxGrow: num('pgrow', 2.6), speed, beat: 7, dip: 0.06, rest: [1e9, 1e9], lantern: null, mirror: false, seed: 4712 });
  const v = new THREE.Vector3(), w = new THREE.Vector3();
  const pointOf = (pi, out) => { const P = perches[pi]; if (P.object) { out.fromArray(P.offset); P.object.updateWorldMatrix(true, false); return out.applyMatrix4(P.object.matrixWorld); } return out.set(P.x, P.y, P.z); };
  const STARTS = ['pierR36', 'pierR68', 'harp', 'pierR76', 'pierR52'];                          // (which end each begins at: by these, half the house's moths are on either side at the start)
  const moths = want.map(([a, b, may], i) => { const ag = pearls.agents[i], start = STARTS.includes(b) ? b : a; ag.perch = named[start]; ag.state = 0; ag.t = 0; ag.wait = 1e9; ag.fly = 0;
    return { i, ag, ends: [named[a], named[b]], names: [a, b], may: may || null, at: named[start], pending: null, aimed: false, next: 4 + rnd() * 45, visiting: false }; });
  // TWO CROSSINGS THE BOAT'S COMING SETS OFF, once each (a moth disturbed by a light that comes: it does not wait for the boat, it goes when
  // the light is near, as the gilt moths lift for the hull). Until then these two keep still, so that they are there to go.
  //   bow     THE MOTH THAT CROSSES THE BOW. The arch's moth leaves the RIGHT face of the reveal and goes ASLANT down the house, to a pier of the
  //           left-hand boxes 16 m further on. A crossing gets under way slowly, so for the three seconds before it comes across the boat's line it
  //           is ahead and a little to starboard, against the dark aisle, coming in toward the lantern and growing; it comes across `lead` metres
  //           ahead of the eye, a little above the lantern and lit by it; then it is gone into the pale of the lit rain, toward the tree. It goes
  //           the boat's way as well as across it, at half a boat's pace: it leads nobody. (As it was, straight across the arch from left to
  //           right: pale on the lit rain until it was half way over, then ahead of the bow for two frames of twelve while a boat on the foyer's
  //           current closed on its line at 2.6 m/s: .shots/theatre_mo5_06_bow_crop.png. And before that: over the stem 2.6 m up, twenty degrees
  //           above a level view: in no picture from the boat.) See `flightOf`, `B.slant` below.
  //   tower   (off unless `&pride=0`: the tower's moth comes to the lantern instead, see `ride`) the fly tower's moth crosses the middle of the
  //           tower ahead of the lantern; its crossing is 23 m and rises 2.8 m, which from the boat is a speck at the top of the view.
  // Each is timed by the boat's own way, not by a place: the moth leaves when the boat will be `lead` metres short of the crossing's line at the
  // moment the moth is half way over, reckoned along the plan's own current at the share of it the boat is making (a boat on the current alone
  // sets the bow's off at s 19.4; a rider who paddles sets it off sooner; one who dawdles, when the boat is `lead` + 1 m short of the line at the
  // latest). `at` is where a boat on the current sets it off (told to the staging; a boat that enters the area beyond `at` + 4 m does not set it off).
  const lineS = (m) => { if (!m) return 0; pointOf(m.ends[0], v); pointOf(m.ends[1], w); return -(v.z + w.z) / 2; };
  const halfT = (m) => { if (!m) return 0; pointOf(m.ends[0], v); pointOf(m.ends[1], w); return 0.3 + 0.5 * Math.max(1.5, v.distanceTo(w) / (speed * (ctx.reducedMotion ? 0.8 : 1))); };
  const auto = (m, lead, at) => ({ moth: m || null, lead, line: 0, half: 0, at, on: dev.get('pauto') !== '0', done: false, seen: false });
  const autos = { bow: auto(moths[0] && moths[0].names[0].startsWith('arch') ? moths[0] : null, num('pbowlead', 3.7), num('pbow', 19.4)),
    tower: auto(moths.find((m) => m.names[0] === 'pinL'), num('ptowerlead', 4.4), num('ptower', 113.9)) };
  // THE FLY TOWER: A MOTH AT THE LANTERN (the page's three-second check for the tower: "a pearl moth at the lantern"). In the tower the boat's
  // lantern is the only light, and a moth comes to a light: as the boat comes to the painting (s 116 to 134, at no more than a brisk walk) the
  // tower's moth leaves its pin rail for the crook, comes in over the port bow, settles on the iron and rides there down the tower; where the walls
  // end (s 157) it lets go and goes back into the dark. It is drawn by the lamp, not by the rider: it lies on the stem as on any perch, and a boat
  // that stops keeps it. (The staging may turn it off: `ride.on = false` before the boat is at `ride.from`.)
  const ride = { moth: moths.find((m) => m.names[0] === 'pinL') || null, on: dev.get('pride') !== '0' && named.crook != null, from: num('pridefrom', 116), until: 134, off: num('prideoff', 157), state: 0, seen: false };
  if (ride.moth && ride.on) autos.tower.on = false;
  for (const a of Object.values(autos)) if (a.moth && a.on) { a.moth.next = 1e9; a.line = lineS(a.moth); a.half = halfT(a.moth); }
  // WHERE THE FAMILY'S CROSSING GOES (insects.js, makePearlMoths, the crossing: an eased line from where the moth lets go to its perch, a weave across
  // it of up to 1.8 m, an arc of up to 2.2 m and a wave of a third of a metre on that), worked out here from the same numbers, so that a crossing can
  // be timed to the boat and its weave chosen: at(t, seed, out) is where the moth is t seconds after it lets go. If the family changes its flight,
  // &pdbg=20 says where the moth really passed the boat's line ("... m from the eye, ... degrees up").
  const flightOf = (m) => {
    const P = perches[m.ends[0]], from = pointOf(m.ends[0], new THREE.Vector3()), to = pointOf(m.ends[1], new THREE.Vector3());
    if (P.nx != null) from.x += P.nx * 0.04, from.y += P.ny * 0.04, from.z += P.nz * 0.04;      // (it stands a finger off its perch as it lets go)
    const L = from.distanceTo(to), dur = Math.max(1.5, L / (speed * (ctx.reducedMotion ? 0.8 : 1))), dx = to.x - from.x, dz = to.z - from.z, l = Math.hypot(dx, dz) || 1, rise = Math.min(2.2, 0.4 + L * 0.05);
    return { dur, L, from, dir: Math.sign(dx) || 1, at(t, seed, out) {
      const u = clamp(t / dur, 0, 1), e = u * u * (3 - 2 * u), arc = Math.sin(Math.PI * u), d = e * L, side = (Math.sin(d * 0.42 + seed) * 1.3 + Math.sin(d * 1.1 + seed * 1.7) * 0.5) * arc;
      out.lerpVectors(from, to, e); out.x += -dz / l * side; out.z += dx / l * side;
      out.y += arc * rise + Math.sin(d * 0.7 + seed * 2.3) * 0.35 * arc; out.y = Math.max(out.y, 0.35 * arc + 0.02);
      return out;
    } };
  };
  /** When and where a moth on that flight first comes across the line x = d (the boat's own line down the house): { t (seconds after it lets go), s, y, vx (m/s across, the way it is going) }, or null. */
  const crossesAt = (F, seed, d) => {
    let pq = null, ps = 0, py = 0;
    for (let t = 0; t <= F.dur; t += 0.1) {
      F.at(t, seed, v); const q = (v.x - d) * F.dir;                       // (how far past the line it is, the way it is going)
      if (pq != null && pq < 0 && q >= 0) { const k = -pq / Math.max(1e-6, q - pq); return { t: t - 0.1 + 0.1 * k, s: ps + (-v.z - ps) * k, y: py + (v.y - py) * k, vx: (q - pq) / 0.1 }; }
      pq = q; ps = -v.z; py = v.y;
    }
    return null;
  };
  // THE BOW'S CROSSING, ASLANT. Its weave is chosen (of forty) so that it comes in steadily over the three seconds before (never back the way it
  // came, never hanging on the boat's line), comes across the middle of the house a forearm and more above the lantern (1.55 to 1.9 m) going
  // briskly, and keeps going. The moth is then let go by the boat's own time of arrival, as before: so that it comes across the boat's line `lead`
  // metres ahead of the boat's middle: 2.2, over the lantern itself, half a metre above it and lit by it from beneath, two and a half metres
  // from the eye; then down the port side, a boat's breadth off and above the rider's head, and away into the rain's light. (At 4.2 m and more,
  // outside the lane the family keeps clear for the hull, a moth 12 cm across on the wing was a fleck of eight or ten pixels among leaves of that
  // size: .shots/theatre_mo5_15_bow_f06.png. A moth crosses a bow over the bow.) See `bowFlight`.
  {
    const B = autos.bow;
    if (B.moth && B.on && B.moth.names[1] === 'pierL45') {
      const F = flightOf(B.moth); let best = null, bs = 1e9;
      const past = (t, seed) => { F.at(t, seed, v); return v.x * F.dir; };      // how far past the middle of the house it is, the way it is going
      for (let k = 0; k < 40; k++) {
        const seed = 1.7 + k * 2.39, c = crossesAt(F, seed, 0); if (!c) continue;
        let score = Math.abs(c.y - 1.52) + (c.y < 1.42 || c.y > 1.72 ? 3 : 0) + 0.2 * Math.abs(c.vx - 1.4) + (c.vx < 0.8 ? 3 : 0), q0 = past(c.t - 3, seed);
        for (const dt of [-2, -1, 0]) { const q = past(c.t + dt, seed); if (q - q0 < 0.4) score += 2; q0 = q; if (dt === -1 && v.y < 1.2) score += 1.5; }      // (a second before, a metre and a half to starboard, it is already above the gunwale and the lantern's top)
        for (const dt of [0.5, 1, 1.5, 2]) { const q = past(c.t + dt, seed); if (q - q0 < 0.25) score += 2; q0 = q; if (v.y < 1.25 || v.y > 2.5) score += 1; }
        if (score < bs) { bs = score; best = seed; }
      }
      if (best != null) {
        B.moth.ag.seed = dev.has('pbowseed') ? num('pbowseed', best) : best; B.flight = F; B.slant = true; B.lead = num('pbowlead', 2.2);
        const c = crossesAt(F, B.moth.ag.seed, 0) || { t: 5, s: 32.6, y: 1.7, vx: 1.4 }; B.line = c.s; B.half = c.t + 0.33;
        if (!dev.has('pbow')) { let q = c.s - B.lead, T = B.half; while (T > 0 && q > 0) { T -= 0.25 / Math.max(0.3, plan.currentAt(q - 0.125)); q -= 0.25; } B.at = q; }      // (where a boat on the current alone sets it off)
        if (dev.has('pdbg')) console.log('INVALID_ debug pearl bow aslant: ' + F.L.toFixed(1) + ' m in ' + F.dur.toFixed(1) + ' s, weave ' + B.moth.ag.seed.toFixed(2) + ' (score ' + bs.toFixed(2) + '); it comes across the middle at s ' + c.s.toFixed(1) + ', ' + c.y.toFixed(2) + ' m up, ' + c.t.toFixed(1) + ' s after it lets go, ' + c.vx.toFixed(1) + ' m/s across; a boat on the current sets it off at s ' + B.at.toFixed(1));
      }
    }
  }
  // (while the bow's moth waits for the boat, the other moths of the rear stalls keep still too: two pale moths crossing the entrance within a few
  // seconds of each other would be a troupe. They go about their own lives once it has gone, or at once if the area is entered further on.)
  const early = autos.bow.moth && autos.bow.on ? moths.filter((m) => m !== autos.bow.moth && m.names.some((nm) => /^pier[LR](3\d|4\d|5[0-2])$/.test(nm))) : [];
  for (const m of early) { m.held = m.next; m.next = 1e9; }
  autos.bow.after = (t, fired) => { for (const m of early) if (m.held != null) { m.next = fired ? t + 10 + 28 * rnd() : Math.max(t, m.held); m.held = null; } };
  const go = (m, pi) => { if (m.pending != null || m.ag.state !== 0) return false; m.pending = pi; m.aimed = false; m.ag.wait = -1; m.ag.t = Math.max(m.ag.t, 0); return true; };      // the family's own take-off: a third of a second of flutter, then it lets go
  // THE LAST METRE TO THE CROOK IS THIS MODULE'S. The family keeps a moth out of the hull's lane (a metre either side of the boat's middle line,
  // below 1.9 m), and the crook stands in that lane: a moth coming to it was held a metre off the bow until its crossing ended, and which side
  // it was held on turned on which side of the middle line the rocking bar stood in that instant: one that came in from starboard was put a metre
  // to port in a single frame and landed from there (.shots/theatre_m4_18_crook_land_crop.png: gone from the right at +0.75 s, on the left at
  // +1.05 s); and a straight line in from starboard goes through the lantern. So when a moth bound for the crook is within a metre and a half of
  // it, it is taken from the family's crossing into its landing, and the landing's start is carried along a curve of this module's, in the BOAT'S
  // OWN SPACE (the boat may be under way): from where the moth is, over the arch of the crook and the lantern if it comes from starboard, to a hand
  // above and aft of its place on the bar; from there the family's own landing takes hold of the iron, given half a second and not a third.
  const toCrook = (m) => named.crook != null && go(m, named.crook);
  const cr = { m: null, stage: 0, t0: 0, T1: num('pcrook1', 1.15), T2: num('pcrook2', 0.55), p: [0, 1, 2, 3].map(() => new THREE.Vector3()), q: new THREE.Vector3(), was: new THREE.Vector3() };
  const crookFlight = (t, dt) => {
    if (named.crook == null) return;
    const P = perches[named.crook], g = P.object;
    if (!cr.stage) {
      for (const m of moths) {
        const a = m.ag;
        if (a.state !== 1 || !m.aimed || a.perch !== named.crook) continue;
        pointOf(named.crook, v);
        if (Math.hypot(a.pos.x - v.x, a.pos.z - v.z) > 1.5) continue;
        g.updateWorldMatrix(true, false);
        cr.p[0].copy(a.pos); g.worldToLocal(cr.p[0]);                        // where it is, in the boat's own space (x to starboard, z aft)
        const [px, py, pz] = P.offset;
        cr.p[3].set(px, py + 0.24, pz + 0.22);
        if (cr.p[0].x > 0) { cr.p[1].set(cr.p[0].x * 0.6, Math.max(cr.p[0].y, 1.3) + 0.25, cr.p[0].z + 0.15); cr.p[2].set(0.12, py + 0.75, pz + 0.3); }      // over the crook's arch and the lantern
        else { cr.p[1].set(cr.p[0].x * 0.55, cr.p[0].y + 0.1, cr.p[0].z + 0.1); cr.p[2].set(-0.2, py + 0.4, pz + 0.25); }
        cr.m = m; cr.stage = 1; cr.t0 = t; cr.was.copy(a.pos); a.state = 2; a.t = -0.05; a.from.copy(a.pos);
        break;
      }
      return;
    }
    const a = cr.m.ag;
    if (a.state !== 2) { cr.stage = 0; cr.m = null; return; }                 // it has hold (or something else has taken it)
    g.updateWorldMatrix(true, false);
    if (cr.stage === 1 || cr.stage === 3) {
      const k = clamp((t - cr.t0) / cr.T1, 0, 1), e = cr.stage === 1 ? k * k * (3 - 2 * k) : k * k * (2 - k), n = 1 - e;      // (leaving: it gathers way and does not stop at the curve's end)
      cr.q.set(0, 0, 0).addScaledVector(cr.p[0], n * n * n).addScaledVector(cr.p[1], 3 * n * n * e).addScaledVector(cr.p[2], 3 * n * e * e).addScaledVector(cr.p[3], e * e * e);
      g.localToWorld(cr.q);
      // its heading follows the way it goes through the air (the family's own rule for that does not run in a landing)
      const vx = cr.q.x - cr.was.x, vz = cr.q.z - cr.was.z;
      if (Math.hypot(vx, vz) > 1e-5) { let yd = Math.atan2(vx, vz) - a.yaw; yd = ((yd + Math.PI) % TAU + TAU) % TAU - Math.PI; a.yaw += clamp(yd, -5 * dt, 5 * dt); }
      a.pitch = 0.3; cr.was.copy(cr.q); a.from.copy(cr.q); a.t = -0.05;
      if (k >= 1 && cr.stage === 1) { cr.stage = 2; a.t = 0; }
      else if (k >= 1) {                                                     // clear of the hull's lane: the family's crossing takes it from here to where it was bound
        pointOf(a.perch, v); a.pos.copy(cr.q); a.from.copy(cr.q); a.state = 1; a.t = 0; a.dur = Math.max(1.5, a.from.distanceTo(v) / (speed * (ctx.reducedMotion ? 0.8 : 1)));
        cr.stage = 0; cr.m = null;
      }
    } else {
      cr.q.copy(cr.p[3]); g.localToWorld(cr.q); a.from.copy(cr.q);
      a.t -= dt * (1 - 0.3 / cr.T2);
    }
  };
  // AND THE FIRST METRE AWAY FROM IT. A moth that let go of the crook was in the hull's lane at once and was put a metre to one side in its
  // first frame on the wing (.shots/theatre_m4_31_ride_leave_crop.png as it was: on the bar at +0.6 s, a metre and a half to starboard at +0.8 s).
  // So its first second is this module's too, in the boat's own space: up off the iron (over the crook's arch and the lantern if it is bound to
  // starboard) and out to a point clear of the lane on the side it is bound for; from there the family's crossing has it.
  const offCrook = (m, t) => {
    if (named.crook == null || cr.stage) return;
    const a = m.ag, g = perches[named.crook].object; g.updateWorldMatrix(true, false);
    cr.p[0].copy(a.pos); g.worldToLocal(cr.p[0]);
    pointOf(a.perch, v); g.worldToLocal(v);                                     // where it is bound, in the boat's own space
    const x0 = cr.p[0].x, y0 = cr.p[0].y, z0 = cr.p[0].z;
    if (v.x > 0) { cr.p[1].set(x0, y0 + 0.6, z0 + 0.3); cr.p[2].set(0.7, y0 + 0.85, z0 + 0.25); cr.p[3].set(1.4, y0 + 0.65, z0 + 0.2); }
    else { cr.p[1].set(x0 - 0.1, y0 + 0.3, z0 + 0.25); cr.p[2].set(-0.8, y0 + 0.6, z0 + 0.2); cr.p[3].set(-1.4, y0 + 0.6, z0 + 0.2); }
    cr.m = m; cr.stage = 3; cr.t0 = t; cr.was.copy(a.pos); a.state = 2; a.t = -0.05; a.from.copy(a.pos);
  };
  // OVER THE BOW. The family steps a moth aside from the hull's lane (a metre either side of the boat's middle line, to 3.65 m ahead of its middle,
  // below 1.9 m): right for a moth that happens on the boat, wrong for the one whose way lies over the bow (it would be held a metre to starboard
  // and then put a metre to port). So while the bow's moth, on the crossing the boat set off, is within a metre and a half of the boat's own line,
  // it flies the family's very crossing (`flightOf`: the same line, weave, arc and wave, so there is no seam going in or coming out) without the
  // sidestep. Only if it is high enough as it comes within that reach (1.15 m, a metre and a half to starboard: it is still climbing, and over the
  // boat's line it is at a metre and a half; the crook's top is at 1.08, the lantern's at one metre, a sitting rider's head at 1.2) and the boat
  // is not being driven hard (3.4 m/s): otherwise the family's rule stands. The lens's own keep-out (three quarters of a metre) always does.
  const wrapPi = (x) => ((x + Math.PI) % TAU + TAU) % TAU - Math.PI;
  const bw = { on: false, done: false, checked: null, tau: 0, roll: 0, lift: 0, was: new THREE.Vector3() };
  const bowFlight = (t, dt) => {
    const B = autos.bow; if (!B.slant || B.fired == null || bw.done) return;
    const m = B.moth, a = m.ag, F = B.flight;
    // (only the crossing the boat set off, from the arch: if the moth was elsewhere when its moment came (on the lantern's crook of a boat that had lain
    // still in the foyer, say) it crosses when it is back, in its own time, and the family's rule stands)
    if (bw.checked !== B.fired) { bw.checked = B.fired; if (a.state !== 0 || m.visiting || m.pending != null || m.at !== m.ends[0]) { bw.done = true; return; } }
    if (!bw.on) {
      if (a.state !== 1 || !m.aimed) { if (t > B.fired + 4) bw.done = true; return; }      // (not yet let go; or it never went)
      if (a.perch !== m.ends[1] || a.from.distanceTo(F.from) > 0.25) { bw.done = true; return; }
      const lat = (a.pos.x - boat.x) * F.dir;                                 // how far past the boat's line it is, the way it is going
      if (lat > 0.5 || a.t > F.dur * 0.5) { bw.done = true; return; }
      if (lat < -1.6) return;
      if (a.pos.y < 1.15 || sRate > 3.4) { bw.done = true; return; }
      bw.on = true; bw.tau = a.t; bw.roll = a.roll; bw.was.copy(a.pos);
      // NEVER IN THE RIDER'S FACE. The crossing is timed to pass two metres ahead of the boat's middle, over the lantern. A boat that was set down
      // late (a picture taken from s 20: .shots/theatre_mo6_19_through.png, "0.78 m from the eye, 32 degrees up"), or a rider who digs in after the
      // moth has let go, is further on than was reckoned when the moth comes to its line, and without the family's sidestep the moth would come
      // across at the rider's own head. So where it will come across is reckoned again here, at the pace the boat is making now: less than 1.8 m
      // ahead of the boat's middle, and the moth climbs as it comes in and goes over well above the rider (2.6 m up, a metre and a half over the eye).
      { const cx = crossesAt(F, a.seed, clamp(boat.x, -2.5, 2.5)); let lead = 9;
        if (cx) {                                                             // (where the boat will be then: along the plan's own current, at the share of it the boat is making now)
          const share = clamp(Math.max(0.4, sRate) / Math.max(0.3, plan.currentAt(ctx.s)), 0.4, 4); let q = ctx.s;
          for (let T = Math.max(0, cx.t - bw.tau); T > 0; T -= 0.1) q += share * Math.max(0.3, plan.currentAt(q)) * Math.min(T, 0.1);
          lead = cx.s - q;
        }
        bw.lift = cx && lead < 1.8 ? clamp(2.6 - cx.y, 0, 1.3) : 0;
        if (dev.has('pdbg')) console.log('INVALID_ debug pearl bow: it will come across ' + lead.toFixed(2) + ' m ahead of the boat\'s middle' + (bw.lift ? ': too near, it goes over ' + bw.lift.toFixed(2) + ' m higher' : '')); }
      if (dev.has('pdbg')) { F.at(bw.tau, a.seed, v); console.log('INVALID_ debug pearl bow: over the bow from ' + t.toFixed(2) + ' s (boat s ' + ctx.s.toFixed(1) + ', pace ' + sRate.toFixed(1) + '), ' + (-lat).toFixed(2) + ' m to come, ' + a.pos.y.toFixed(2) + ' m up; the family had it ' + v.distanceTo(a.pos).toFixed(3) + ' m from where this flight has it'); }
    } else bw.tau += dt;
    F.at(bw.tau + dt, a.seed, v);                                             // where it is in the frame to come (the family draws what is set here then)
    if (bw.lift) v.y += bw.lift * (1 - smooth(0.45, 1.5, Math.abs(v.x - boat.x)));      // (over the rider, if it would have come across at the rider's head: nothing of it where the family takes it back)
    if ((v.x - boat.x) * F.dir > 1.5 || bw.tau > F.dur * 0.6 || a.state === 0) {      // clear of the lane on the far side: the family's crossing has it again, where it left off
      if (a.state !== 0) { a.state = 1; a.t = bw.tau; a.from.copy(F.from); a.dur = F.dur; }
      if (dev.has('pdbg')) console.log('INVALID_ debug pearl bow: the family has it again at ' + t.toFixed(2) + ' s (boat s ' + ctx.s.toFixed(1) + '), ' + ((v.x - boat.x) * F.dir).toFixed(2) + ' m past the boat\'s line, ' + v.y.toFixed(2) + ' m up, ' + v.distanceTo(ctx.engine.shared.uCameraPos.value).toFixed(2) + ' m from the eye');
      bw.on = false; bw.done = true; return;
    }
    a.state = 2; a.t = -1; a.from.copy(v);                                    // (held at the start of a landing that never begins: the family draws it at `from`, on the wing)
    const vx = v.x - bw.was.x, vz = v.z - bw.was.z;
    if (Math.hypot(vx, vz) > 1e-5) { const yd = wrapPi(Math.atan2(vx, vz) - a.yaw); a.yaw += clamp(yd, -4 * dt, 4 * dt); bw.roll += (clamp(yd * 2.5, -0.6, 0.6) - bw.roll) * Math.min(1, dt * 5); }
    a.roll = bw.roll; a.pitch = 0.3; bw.was.copy(v);
  };
  let still = 0;
  const api = {
    object: pearls.object, count: moths.length, agents: pearls.agents, perches, named, notes, moths,
    /** Moth i (or the moth whose crossing has the place called `name`) leaves now for the other end of its crossing (or for `to`, a place's name). False if it is on the wing. */
    send(which, to = null) {
      const m = typeof which === 'number' ? moths[which] : moths.find((q) => q.names.includes(which));
      if (!m) return false;
      return go(m, to != null && named[to] != null ? named[to] : m.at === m.ends[0] ? m.ends[1] : m.ends[0]);
    },
    /** The arch's moth crosses the bow now (the page's first moment: s 0 to 26). It also goes by itself, once, when the boat first comes to `auto.bow.at` (see `auto`). */
    crossBow() { autos.bow.done = true; autos.bow.fired = ctx.time; if (autos.bow.after) autos.bow.after(ctx.time, true); return api.send(0); },
    /** The two crossings the boat's coming sets off: auto.bow and auto.tower, each { at (the boat's s), lead, on, done }. Set `on` false to fire them yourself (crossBow(), send('pinL')). */
    auto: autos,
    /** The fly tower's moth that comes to the lantern's crook and rides there: { on, from, until, off (the boat's s), state: 0 waiting, 1 coming or riding, 2 gone back, 3 not this time }. */
    ride,
    /** What moth i is doing: 'rest', 'crossing', 'landing', 'lifting'. */
    state: (i) => ['rest', 'crossing', 'landing', 'lifting'][moths[i].ag.state] || 'rest',
    /** The moth on the lantern's crook, or null. */
    visitor: () => moths.find((m) => m.visiting) || null,
  };
  let sWas = null, sRate = 0;                                                 // the boat's pace along the route (metres of s a second), eased over half a second
  const update = (dt) => {
    const t = ctx.time;
    still = boat.speed < 0.15 ? still + dt : 0;
    // (a boat set down somewhere, or the first frames of the area: a jump is no pace; then the boat's own speed along its heading is taken)
    if (sWas != null && dt > 1e-4 && Math.abs(ctx.s - sWas) < 0.6 && t > 0.3) sRate += (clamp((ctx.s - sWas) / dt, -2, 9) - sRate) * Math.min(1, dt * 2);
    else sRate = clamp(boat.speed * Math.max(0, Math.cos(boat.heading)), 0, 9);
    sWas = ctx.s;
    for (const a of Object.values(autos)) {
      if (!a.moth || !a.on || a.done) continue;
      if (!a.seen) { a.seen = true; if (ctx.s > a.at + 4) { a.done = true; a.moth.next = t + 6 + 30 * rnd(); if (a.after) a.after(t, false); continue; } }      // (the area was entered further on: it goes about its own life)
      if (a.slant) { const c = crossesAt(a.flight, a.moth.ag.seed, clamp(boat.x, -2.5, 2.5)); if (c) { a.line = c.s; a.half = c.t + 0.33; } }      // (where it will come across the boat's own line, wherever in the channel the boat is)
      // how far the boat still has to go to be `lead` short of the line, and how long that takes at the pace it is making along the route
      // (the current is not the same all the way: the pace the boat is making now is taken as its share of the current here, kept to the line)
      const togo = a.line - a.lead - ctx.s, share = clamp(Math.max(0.4, sRate) / Math.max(0.3, plan.currentAt(ctx.s)), 0.4, 4);
      if (togo < -4) { a.done = true; a.moth.next = t + 6 + 30 * rnd(); if (a.after) a.after(t, false); continue; }      // (it came another way and is past: the moth goes about its own life)
      let eta = 0; for (let q = ctx.s; q < a.line - a.lead && eta < 60; q += 0.5) eta += Math.min(0.5, a.line - a.lead - q) / (share * Math.max(0.3, plan.currentAt(q + 0.25)));
      if (t > 0.5 && (eta <= a.half || togo <= 1)) { a.done = true; a.fired = t; a.moth.next = t; if (a.after) a.after(t, true); }      // (its own rule sends it: at rest it goes now; `may` is asked as for any crossing)
    }
    if (ride.moth && ride.on) {
      const m = ride.moth, a = m.ag;
      if (ride.state === 0) {
        if (!ride.seen) { ride.seen = true; if (ctx.s > ride.until) { ride.state = 3; } else m.next = 1e9; }      // (the area was entered further on: it goes about its own life)
        if (ride.state === 0 && ctx.s > ride.until) { ride.state = 3; m.next = t + 5 + 20 * rnd(); }
        else if (ride.state === 0 && ctx.s >= ride.from && sRate < 3.3 && t > 0.5 && !moths.some((q) => q.visiting) && toCrook(m)) { m.visiting = true; m.riding = true; ride.state = 1; }
      } else if (ride.state === 1 && (ctx.s >= ride.off || ctx.s < ride.from - 3) && a.state === 0 && m.pending == null && m.visiting) {
        m.riding = false; m.visiting = false; ride.state = 2; pointOf(m.ends[0], v); pointOf(m.ends[1], w); if (go(m, a.pos.distanceTo(v) < a.pos.distanceTo(w) ? m.ends[0] : m.ends[1])) m.offCrook = true;
      }
    }
    if (dev.has('pdbg')) for (const [name, a] of Object.entries(autos)) {       // (&pdbg: where each of the two passed the boat's own line, once)
      if (!a.moth || a.said || (a.moth.ag.state !== 1 && a.moth.ag.state !== 2)) continue;
      const q = a.moth.ag.pos, fx = -Math.sin(boat.heading), fz = -Math.cos(boat.heading), lat = (q.x - boat.x) * fz - (q.z - boat.z) * fx, was = a.lat; a.lat = lat;
      if (was != null && was * lat <= 0) { a.said = true; const eye = ctx.engine.shared.uCameraPos.value; console.log('INVALID_ debug pearl ' + name + ' crossed the boat\'s line at ' + t.toFixed(2) + ' s: moth s ' + (-q.z).toFixed(1) + ' y ' + q.y.toFixed(2) + ', boat s ' + ctx.s.toFixed(1) + ', ' + eye.distanceTo(q).toFixed(2) + ' m from the eye, ' + (Math.atan2(q.y - eye.y, Math.hypot(q.x - eye.x, q.z - eye.z)) * 57.3).toFixed(0) + ' degrees up'); }
    }
    crookFlight(t, dt); bowFlight(t, dt);
    for (const m of moths) {
      const a = m.ag;
      if (a.state === 1 && m.pending != null && !m.aimed) {                    // it has just let go: the family chose a perch by distance; it goes where it was meant to
        a.perch = m.pending; a.visiting = false; pointOf(m.pending, v);
        a.dur = Math.max(1.5, a.from.distanceTo(v) / (speed * (ctx.reducedMotion ? 0.8 : 1)));
        m.aimed = true; m.at = m.pending;
        if (m.offCrook) { m.offCrook = false; offCrook(m, t); }
      } else if (a.state === 0 && m.aimed) {                                   // it has hold again: 20 to 60 s of rest (the page)
        m.aimed = false; m.pending = null; m.next = t + 20 + 40 * rnd();
      } else if (a.state === 0 && m.pending == null) {
        if (m.visiting) { if (boat.speed > 0.3 && !m.riding) { m.visiting = false; pointOf(m.ends[0], v); pointOf(m.ends[1], w); if (go(m, a.pos.distanceTo(v) < a.pos.distanceTo(w) ? m.ends[0] : m.ends[1])) m.offCrook = true; } }
        else if (t >= m.next && (!m.may || m.may())) go(m, m.at === m.ends[0] ? m.ends[1] : m.ends[0]);
      }
    }
    // ASKEW AT REST. The family lays a moth on an upright face exactly head up; a moth that has come down on a wall lies as it came down. Each place
    // has its own turn (`askew`, about the way the face looks); the moth turns into it as its feet take hold and out of it as it lets go. (This runs
    // after the family's own step of the frame, which has just written the moth's attitude: it is turned here, in what the family wrote.)
    {
      const qa = pearls.object.geometry.attributes.aQuat; let turned = false;
      if (qa) for (const m of moths) {
        const a = m.ag, P = perches[a.perch], th = P && P.askew && a.state !== 1 && a.up && Math.abs(a.up.y) < 0.75 ? P.askew * (1 - a.fly) : 0;
        if (!th) continue;
        const o = m.i * 4, x = qa.array[o], y = qa.array[o + 1], z = qa.array[o + 2], w0 = qa.array[o + 3], sn = Math.sin(th / 2), cs = Math.cos(th / 2);
        qa.array[o] = x * cs - z * sn; qa.array[o + 1] = y * cs + w0 * sn; qa.array[o + 2] = z * cs + x * sn; qa.array[o + 3] = w0 * cs - y * sn;
        turned = true;
      }
      if (turned) qa.needsUpdate = true;
    }
    // the boat holds still: after five seconds the nearest one at rest within 25 m comes to the lantern's crook
    if (named.crook != null && still > 5 && !moths.some((m) => m.visiting)) {
      pointOf(named.crook, v); let best = null, bd = 25;
      for (const m of moths) if (m.ag.state === 0 && m.pending == null) { const d = m.ag.pos.distanceTo(v); if (d < bd) { bd = d; best = m; } }
      if (best && toCrook(best)) best.visiting = true;
    }
  };
  return { api, update };
}

export async function build(ctx, plan, shared) {
  shared.cast = shared.cast || {};
  const H = house(ctx, plan, shared);
  let places = null;
  try { places = pearlPlaces(ctx, plan, shared); } catch (err) { console.error('INVALID_ theatre moths: the pearl moths\' places could not be found: ' + ((err && err.stack) || err)); }
  const gilt = await makeGilt(ctx, plan, shared, H, places ? places.perches.filter((q) => q.x != null) : []);
  shared.cast.moths = gilt.api;
  let pearls = { update() {} };
  try { if (places) { pearls = await makePearls(ctx, plan, shared, H, places); shared.cast.pearls = pearls.api; } } catch (err) { console.error('INVALID_ theatre moths: the pearl moths were left out: ' + ((err && err.stack) || err)); }
  // developer's lens: &mfov=10 looks at a small thing where it is; &msteady=1 stills the boat's rocking for it; &mlook=s,d,y keeps the rider's
  // eye on that place of the house (path coordinates) whatever the boat does
  const fov = num('mfov', 0), look = dev.has('mlook') ? dev.get('mlook').split(',').map(Number) : null, lookAt0 = look && look.length === 3 ? new THREE.Vector3(look[1], look[2], -look[0]) : dev.has('mwatch') || dev.has('pwatch') ? new THREE.Vector3() : null;
  const pwatch = dev.has('pwatch') ? num('pwatch', 0) : -1;                  // &pwatch=3: the eye follows pearl moth 3;  &psend=3,2: pearl moth 3 is sent across at 2 s
  let psend = dev.has('psend') ? dev.get('psend').split(',').map(Number) : null;
  const watch = dev.has('mwatch') ? Math.min(gilt.api.count - 1, Math.max(0, num('mwatch', 0))) : -1;      // &mwatch=490: the eye follows gilt moth 490 (its middle: the circling on a journey is not followed)
  // &mcam=x,y,z: the developer's eye moved off the rider's seat (metres to starboard, up, aft): to look at a flight path from above or from along the wall
  if (dev.has('mcam')) { const q = dev.get('mcam').split(',').map(Number), cam = ctx.engine.camera; if (q.length === 3 && q.every(Number.isFinite)) { cam.position.set(q[0], q[1], q[2]); ctx.onDispose(() => cam.position.set(0, 0, 0)); } }
  if (dev.has('msteady')) { const boat = ctx.engine.boat, was = boat.motion; boat.motion = 0; if (boat.tilt) { boat.tilt.rotation.set(0, 0, 0); boat.tilt.position.y = 0; } ctx.onDispose(() => { boat.motion = was; }); }
  // &mface=i,dist,turn,lift (a gilt moth) and &pface=i,dist,turn,lift (a pearl moth): the developer's eye stands `dist` metres before moth i on the
  // side its place faces (turned `turn` degrees round it, lifted `lift` degrees) and looks at it: for anatomy, which the rider's seat never shows so near
  const mface = dev.has('mface') ? dev.get('mface').split(',').map(Number) : null, pface = dev.has('pface') ? dev.get('pface').split(',').map(Number) : null;
  const faceEye = new THREE.Vector3(), faceN = new THREE.Vector3(), faceAt = mface || pface ? new THREE.Vector3() : null;
  let first = true, frames = 0;
  return {
    update(dt) {
      if (faceAt) {
        const q = mface || pface, dist = q[1] || 0.5, turn = (q[2] || 0) * Math.PI / 180, lift = (q[3] || 0) * Math.PI / 180, P = shared.cast.pearls;
        if (mface) { gilt.api.whereIs(Math.min(gilt.api.count - 1, Math.max(0, q[0])), ctx.time, faceAt); gilt.api.facing(Math.min(gilt.api.count - 1, Math.max(0, q[0])), faceN); }
        else if (P && P.agents && P.agents[q[0]]) { const a = P.agents[q[0]]; faceAt.copy(a.pos); if (a.up) faceN.copy(a.up); else faceN.set(0, 1, 0); }
        const a0 = Math.atan2(faceN.x, faceN.z) + turn, e0 = Math.min(1.5, Math.max(-1.5, Math.atan2(faceN.y, Math.hypot(faceN.x, faceN.z)) + lift));
        faceEye.set(Math.sin(a0) * Math.cos(e0), Math.sin(e0), Math.cos(a0) * Math.cos(e0)).multiplyScalar(dist).add(faceAt);
        const cam = ctx.engine.camera; cam.parent.updateWorldMatrix(true, false); cam.position.copy(cam.parent.worldToLocal(faceEye));
      }
      if (dev.has('mdbg') && frames >= 0 && (ctx.engine.renderer.info.programs || []).length) {                           // (&mdbg=1 also says which shader programs failed to build, and why)
        const r = ctx.engine.renderer, bad = [];
        for (const pr of r.info.programs || []) { const d = pr.diagnostics; if (d && !d.runnable) bad.push((pr.name || '?') + ': ' + (d.programLog || '') + ' V: ' + ((d.vertexShader && d.vertexShader.log) || '') + ' F: ' + ((d.fragmentShader && d.fragmentShader.log) || '')); }
        frames = -1;
        if (bad.length) console.log('INVALID_ debug programs that failed: ' + bad.join(' || ').replace(/\s+/g, ' ').slice(0, 1800));
      }
      if (fov) { const c = ctx.engine.camera; if (c.fov !== fov) { c.fov = fov; c.updateProjectionMatrix(); } }
      if (watch >= 0) gilt.api.whereIs(watch, ctx.time, lookAt0);
      if (pwatch >= 0 && shared.cast.pearls && shared.cast.pearls.agents && shared.cast.pearls.agents[pwatch]) lookAt0.copy(shared.cast.pearls.agents[pwatch].pos);
      if (psend && ctx.time >= psend[1] && shared.cast.pearls && shared.cast.pearls.send) { shared.cast.pearls.send(psend[0]); psend = null; }
      const lookAt = faceAt || lookAt0;
      if (lookAt) {
        const eng = ctx.engine, eye = eng.shared.uCameraPos.value, dx = lookAt.x - eye.x, dy = lookAt.y - eye.y, dz = lookAt.z - eye.z;
        const yaw = Math.atan2(-dx, -dz) - eng.boat.heading, pitch = Math.atan2(dy, Math.hypot(dx, dz));
        eng.input.lookYaw = yaw; eng.input.lookPitch = pitch; eng.camera.rotation.y = yaw; eng.camera.rotation.x = pitch;
      }
      gilt.update(dt); pearls.update(dt);
      if (first && (num('mdbg', 0) === 1 || num('mdbg', 0) === 2) && shared.cast.pearls) {
        first = false; const P = shared.cast.pearls, f2 = (q) => +q.toFixed(2), ent = Object.entries(P.named || {}).map(([k, i]) => [k, ...(P.perches[i].object ? P.perches[i].offset.map(f2) : [f2(-P.perches[i].z), f2(P.perches[i].x), f2(P.perches[i].y)])]);
        console.log('INVALID_ debug pearl moths ' + JSON.stringify({ count: P.count, notes: P.notes, crossings: (P.moths || []).map((m) => m.names.join('-')) }));
        for (let k = 0; k < ent.length; k += 6) console.log('INVALID_ debug pearl places [name, s, d, y] ' + JSON.stringify(ent.slice(k, k + 6)));
      }
      if (num('mdbg', 0) === 3 && Math.floor(ctx.time / 2) !== Math.floor((ctx.time - dt) / 2)) console.log('INVALID_ debug gilt census at ' + ctx.time.toFixed(1) + ' s (boat s ' + ctx.s.toFixed(1) + ', c ' + (shared.show ? shared.show.c.toFixed(1) : '-') + '): ' + JSON.stringify(gilt.api.census()));
      if ((num('mdbg', 0) === 3 ? Math.floor(ctx.time / 5) !== Math.floor((ctx.time - dt) / 5) : dev.has('pdbg') && ctx.time >= num('pfrom', 0) && Math.floor(ctx.time / num('pdbg', 2)) !== Math.floor((ctx.time - dt) / num('pdbg', 2))) && shared.cast.pearls && shared.cast.pearls.moths) console.log('INVALID_ debug pearls at ' + ctx.time.toFixed(1) + ' s [state, s, d, y, visiting] ' + JSON.stringify(shared.cast.pearls.moths.map((m) => [shared.cast.pearls.state(m.i).slice(0, 4), +(-m.ag.pos.z).toFixed(1), +m.ag.pos.x.toFixed(1), +m.ag.pos.y.toFixed(1), m.visiting ? 1 : 0])));
    },
  };
}
