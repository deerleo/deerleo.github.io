// The town below: several instanced models as ONE draw call.
//
// kit.models draws one model many times in one draw call per material slot; four variants of a house are then four
// draw calls, in each of the frame's passes. Where the copies never move, they can be poured into one still mesh:
//
//   const made = [await kit.models('models/town/upper_house_1.glb', placesA, opts), await kit.models('.../upper_house_2.glb', placesB, opts)];
//   bakeInstanced(ctx, made, { name: 'upper town' });      // one mesh per material slot; the instanced meshes are taken out
//
// Every copy's place, turn, size and tint are baked into the points (positions, normals, vertex colours). The first
// model's material is used for each slot, so give every call the same options. Things that must stay movable (the
// skiffs) or that carry per-copy attributes of their own (the houses' dressing) are not for this.
import * as THREE from 'three';

/**
 * results: what kit.models returned, for each model. opts.uv(u, v, sx, sy, sz) -> [u, v] may rewrite a copy's UVs from its
 * own size (for a material that used to read the copy's scale from the instance). Returns the meshes made.
 * opts.merge = { slots: ['paint', 'glass'], flag: { glass: 1 }, tint: { glass: '#2a2034' }, material }: these slots are
 * poured together into ONE mesh that wears `material`; every point's u (of its UV) says which slot it came from (its
 * flag, 0 unless given) and a slot's tint multiplies its paint. So a lamp's iron and its glass are one draw call: the
 * material lets what is flagged give off light.
 */
export function bakeInstanced(ctx, results, opts = {}) {
  const bySlot = new Map(), mg = opts.merge, flagOf = new Map(), tintOf = new Map(), tc = new THREE.Color();
  for (const res of results) for (const mesh of res.meshes) {
    const own = mesh.name.split(':')[1] || 'paint', slot = mg && mg.slots.includes(own) ? mg.slots[0] : own;
    if (mg && mg.slots.includes(own)) { flagOf.set(mesh, (mg.flag && mg.flag[own]) || 0); if (mg.tint && mg.tint[own]) tintOf.set(mesh, tc.set(mg.tint[own]).clone()); }
    if (!bySlot.has(slot)) bySlot.set(slot, []);
    bySlot.get(slot).push(mesh);
  }
  const out = [], M = new THREE.Matrix4(), N = new THREE.Matrix3(), v = new THREE.Vector3(), c = new THREE.Color();
  for (const [slot, meshes] of bySlot) {
    let nv = 0, ni = 0;
    for (const m of meshes) { const g = m.geometry, vc = g.attributes.position.count; nv += vc * m.count; ni += (g.index ? g.index.count : vc) * m.count; }
    const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), col = new Float32Array(nv * 3), uvs = new Float32Array(nv * 2), idx = new Uint32Array(ni);
    let vo = 0, io = 0;
    for (const m of meshes) {
      const g = m.geometry, P = g.attributes.position, Nn = g.attributes.normal, C = g.attributes.color, U = g.attributes.uv, I = g.index, vc = P.count;
      for (let k = 0; k < m.count; k++) {
        m.getMatrixAt(k, M); N.getNormalMatrix(M);
        if (m.instanceColor) m.getColorAt(k, c); else c.setRGB(1, 1, 1);
        if (tintOf.has(m)) c.multiply(tintOf.get(m));
        const e = M.elements, sx = Math.hypot(e[0], e[1], e[2]), sy = Math.hypot(e[4], e[5], e[6]), sz = Math.hypot(e[8], e[9], e[10]);
        for (let i = 0; i < vc; i++) {
          const o = (vo + i) * 3;
          v.fromBufferAttribute(P, i).applyMatrix4(M); pos[o] = v.x; pos[o + 1] = v.y; pos[o + 2] = v.z;
          v.fromBufferAttribute(Nn, i).applyMatrix3(N).normalize(); nor[o] = v.x; nor[o + 1] = v.y; nor[o + 2] = v.z;
          col[o] = (C ? C.getX(i) : 1) * c.r; col[o + 1] = (C ? C.getY(i) : 1) * c.g; col[o + 2] = (C ? C.getZ(i) : 1) * c.b;
          if (flagOf.has(m)) uvs[(vo + i) * 2] = flagOf.get(m);
          else if (U) { let a = U.getX(i), b = U.getY(i); if (opts.uv) [a, b] = opts.uv(a, b, sx, sy, sz); uvs[(vo + i) * 2] = a; uvs[(vo + i) * 2 + 1] = b; }
        }
        if (I) for (let i = 0; i < I.count; i++) idx[io + i] = I.getX(i) + vo; else for (let i = 0; i < vc; i++) idx[io + i] = vo + i;
        vo += vc; io += I ? I.count : vc;
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geo.setIndex(new THREE.BufferAttribute(idx, 1)); geo.computeBoundingSphere();
    const merged = mg && slot === mg.slots[0] && mg.material;
    const mesh = new THREE.Mesh(geo, merged || meshes[0].material);
    mesh.name = (opts.name || 'baked') + ':' + slot; mesh.frustumCulled = false; mesh.matrixAutoUpdate = false;
    ctx.add(mesh); out.push(mesh);
    for (const m of meshes) if (m.material !== meshes[0].material || merged) m.material.dispose();
  }
  for (const res of results) if (res.group.parent) res.group.parent.remove(res.group);
  return out;
}

// ------------------------------------------------------------------------------------------------ within reach of the boat
// WEIGHT (the second look, taken over a fourth time). Everything of the kit was drawn wherever the boat was: the street's
// seventy houses from the portico, the square's from the mist. But what lies UNDER this water is seen only near the boat:
// from an eye 1.1 m up, a roof five metres down and sixty metres off is looked at through two hundred metres of water and
// under a surface that is nine tenths mirror there; only its lights come through (the windows' panes and the halos, which
// are a few thousand triangles and stay). So a still mesh that lies under the water is drawn only where it is within reach:
//
//   const key = routeKey(ctx.path);                         // (x, z) -> metres along the route, cached
//   const set = reach();                                    // one set of things for a module
//   set.sorted(mesh, key);                                  // a still mesh in the realm's own place: its triangles are put in
//                                                           // the route's order once, and a draw range picks those in reach
//   set.instanced(mesh, keys);                              // an InstancedMesh: its copies likewise (keys[i]: where copy i is)
//   set.near(obj, s, r, far);                               // a whole thing: shown within r of s along the route; with `far`
//                                                           // a function, that is called instead (near -> true or false)
//   in update: set.update(ctx.s, metres)                    // (nothing changes until the boat has moved a cell on)
//
// One draw call each, as before; fewer triangles. &ksreach=<metres> tries another reach; &ksreach=0 draws everything.
export function routeKey(path) {
  const cache = new Map(), out = {};
  return (x, z) => { const k = Math.round(x * 0.5) * 8192 + Math.round(z * 0.5); let s = cache.get(k); if (s === undefined) { s = path.locate(x, z, null, out).s; cache.set(k, s); } return s; };
}

export function reach(cell = 5) {
  const ranges = [], windows = [], nears = [];
  let last = null;
  const lower = (arr, v) => { let a = 0, b = arr.length; while (a < b) { const m = (a + b) >> 1; if (arr[m] < v) a = m + 1; else b = m; } return a; };
  return {
    sorted(mesh, key) {
      const g = mesh.geometry; if (!g || !g.index) return mesh;
      const idx = g.index.array, pos = g.attributes.position.array, nt = idx.length / 3, cellOf = new Int32Array(nt);
      let lo = Infinity, hi = -Infinity;
      for (let t = 0; t < nt; t++) { const a = idx[t * 3] * 3, b = idx[t * 3 + 1] * 3, c = idx[t * 3 + 2] * 3;
        const s = key((pos[a] + pos[b] + pos[c]) / 3, (pos[a + 2] + pos[b + 2] + pos[c + 2]) / 3); cellOf[t] = Math.floor(s / cell); if (cellOf[t] < lo) lo = cellOf[t]; if (cellOf[t] > hi) hi = cellOf[t]; }
      if (!nt) return mesh;
      const nc = hi - lo + 1, first = new Uint32Array(nc + 1);
      for (let t = 0; t < nt; t++) first[cellOf[t] - lo + 1]++;
      for (let c = 0; c < nc; c++) first[c + 1] += first[c];
      const at = first.slice(0, nc), sortedIdx = new idx.constructor(idx.length);
      for (let t = 0; t < nt; t++) { const o = at[cellOf[t] - lo]++ * 3; sortedIdx[o] = idx[t * 3]; sortedIdx[o + 1] = idx[t * 3 + 1]; sortedIdx[o + 2] = idx[t * 3 + 2]; }
      idx.set(sortedIdx); g.index.needsUpdate = true;
      ranges.push({ g, lo, nc, first, total: idx.length }); last = null;
      return mesh;
    },
    instanced(mesh, keys) {
      const n = mesh.count; if (!n) return mesh;
      const order = Array.from({ length: n }, (_, i) => i).sort((a, b) => keys[a] - keys[b]);
      const atts = [mesh.instanceMatrix, mesh.instanceColor, ...Object.values(mesh.geometry.attributes).filter((a) => a.isInstancedBufferAttribute)].filter(Boolean);
      const master = atts.map((a) => { const sz = a.itemSize, src = a.array, m = new src.constructor(n * sz); order.forEach((o, k) => { for (let j = 0; j < sz; j++) m[k * sz + j] = src[o * sz + j]; }); return m; });
      windows.push({ mesh, atts, master, s: Float32Array.from(order, (o) => keys[o]), n, a: -1, b: -1 }); last = null;
      return mesh;
    },
    near(obj, s, r, fn) { nears.push({ obj, s, r, fn, on: null }); last = null; return obj; },
    /** s: where the boat is along the route; metres: how far each way things under the water are drawn (0 or less: everything) */
    update(s, metres) {
      const q = Math.round(s / cell), k = q + ':' + metres; if (k === last) return; last = k;
      const all = !(metres > 0), sLo = q * cell - metres, sHi = q * cell + metres;
      for (const r of ranges) {
        if (all) { r.g.setDrawRange(0, Infinity); continue; }
        const a = Math.min(r.nc, Math.max(0, Math.floor(sLo / cell) - r.lo)), b = Math.min(r.nc, Math.max(0, Math.floor(sHi / cell) - r.lo + 1));
        r.g.setDrawRange(r.first[a] * 3, (r.first[b] - r.first[a]) * 3);      // (first[] counts triangles)
      }
      for (const w of windows) {
        const a = all ? 0 : lower(w.s, sLo), b = all ? w.n : lower(w.s, sHi);
        if (a === w.a && b === w.b) continue; w.a = a; w.b = b;
        w.atts.forEach((att, j) => { const sz = att.itemSize; att.array.set(w.master[j].subarray(a * sz, b * sz), 0); att.needsUpdate = true; });
        w.mesh.count = b - a;
      }
      for (const n of nears) { const on = all || Math.abs(s - n.s) < n.r; if (on === n.on) continue; n.on = on; if (n.fn) n.fn(on); else n.obj.visible = on; }
    },
  };
}
