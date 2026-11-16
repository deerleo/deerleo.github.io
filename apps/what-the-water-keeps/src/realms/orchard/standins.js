// Stand-ins in the page's frame. src/engine/modules.js gives standIn (a plain solid of the true size in the true place);
// these wrap it so that a stand-in is placed by the page's (s, d, y) and not by the engine's path (see plan.js), and
// add the two shapes the orchard needs that a box cannot stand for: a limb along a line, and a cloud of blossom.
// Everything made here is named 'standin:<what it stands for>' and shows its name with &labels=1.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { standIn } from '../../engine/modules.js';
import { xz, heading } from './plan.js';

const labels = new URLSearchParams(location.search).has('labels');

/**
 * A stand-in placed in the page's frame.  at: [s, d, y] (the middle of its foot);  turn: radians about the vertical,
 * added to the reference line's heading there (so 0 = square to the route);  everything else as standIn.
 */
export function stand(ctx, o) {
  const p = xz(o.at[0], o.at[1] || 0);
  return standIn(ctx, { ...o, at: undefined, position: [p[0], o.at[2] || 0, p[1]], turn: (o.turn || 0) + heading(o.at[0]) });
}

/** Only the name, floating over a place (for stand-ins made of many parts, or instanced). */
export function nameAt(ctx, name, at, lift = 1) {
  if (!labels) return;
  const m = stand(ctx, { name, at: [at[0], at[1], (at[2] || 0) + lift], size: [0.02, 0.02, 0.02], color: '#000000' });
  m.visible = true;
}

/**
 * A limb, a pole, a rail: a round timber along a line of the page's points.
 *   line: [[s, d, y], ...]   y is the height of its UNDERSIDE when `under` is true (the page gives limbs that way), else of its middle
 *   thick: metres, or [at the first point, at the last]
 */
export function limb(ctx, o) {
  const [t0, t1] = Array.isArray(o.thick) ? o.thick : [o.thick, o.thick];
  const n = o.line.length, pts = o.line.map(([s, d, y], i) => { const p = xz(s, d), t = t0 + (t1 - t0) * i / Math.max(1, n - 1); return new THREE.Vector3(p[0], y + (o.under ? t / 2 : 0), p[1]); });
  const curve = n > 2 && o.smooth !== false ? new THREE.CatmullRomCurve3(pts, false, 'centripetal') : null;
  const segs = o.segments || Math.max(2, (n - 1) * (curve ? 5 : 1)), radial = o.radial || 8;
  // a tube whose radius runs from t0 / 2 to t1 / 2
  const pos = [], idx = [], nor = [], up = new THREE.Vector3(), tan = new THREE.Vector3(), a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  const at = (u) => { if (curve) return curve.getPoint(u); const f = u * (n - 1), i = Math.min(n - 2, Math.floor(f)); return pts[i].clone().lerp(pts[i + 1], f - i); };
  for (let i = 0; i <= segs; i++) {
    const u = i / segs, p = at(u), q = at(Math.min(1, u + 0.01)), q0 = at(Math.max(0, u - 0.01)), r = (t0 + (t1 - t0) * u) / 2;
    tan.subVectors(q, q0).normalize(); up.set(0, 1, 0); if (Math.abs(tan.y) > 0.95) up.set(1, 0, 0);
    a.crossVectors(tan, up).normalize(); b.crossVectors(tan, a).normalize();
    for (let j = 0; j < radial; j++) { const ang = j / radial * Math.PI * 2; c.copy(a).multiplyScalar(Math.cos(ang)).addScaledVector(b, Math.sin(ang)); pos.push(p.x + c.x * r, p.y + c.y * r, p.z + c.z * r); nor.push(c.x, c.y, c.z); }
  }
  for (let i = 0; i < segs; i++) for (let j = 0; j < radial; j++) { const i0 = i * radial + j, i1 = i * radial + (j + 1) % radial, i2 = i0 + radial, i3 = i1 + radial; idx.push(i0, i1, i2, i1, i3, i2); }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); geo.setIndex(idx);
  if (o.geometryOnly) return geo;
  const m = new THREE.Mesh(geo, o.material || ctx.kit.gouache({ color: o.color || '#2a1e2c', brush: 0.5, extend: o.extend }));
  m.name = 'standin:' + (o.name || 'limb'); m.frustumCulled = false; ctx.add(m);
  if (o.name) { const mid = o.line[Math.floor(n / 2)]; nameAt(ctx, o.name, mid, t0 / 2 + 0.6); }
  return m;
}

/**
 * One cloud of blossom, unit size, as a geometry to be instanced: a small cumulus of three or four puffs with a level
 * underside, wider than tall, vertex-painted white above and lilac below (stand-in for lobe_01 .. lobe_12). Its origin
 * is the middle of its underside; it is about 1 across and 0.55 tall.
 */
export function lobeGeometry(segs = 12, rings = 8, seed = 1, colors = {}) {
  const top = new THREE.Color(colors.top || '#f4e6e3'), side = new THREE.Color(colors.side || '#bdb6d3'), under = new THREE.Color(colors.under || '#6f6e94'), c = new THREE.Color();
  let q = seed * 7919 + 17; const rnd = () => (q = (q * 16807) % 2147483647) / 2147483647;
  const puffs = [[0, 0, 0.78, 1]];                                             // x, z, width, height factor
  const n = 2 + Math.floor(rnd() * 2), a0 = rnd() * 6.283;
  for (let i = 0; i < n; i++) { const a = a0 + i / n * 6.283 + (rnd() - 0.5) * 0.8, r = 0.2 + rnd() * 0.08; puffs.push([Math.cos(a) * r, Math.sin(a) * r, 0.46 + rnd() * 0.16, 0.7 + rnd() * 0.25]); }
  const parts = puffs.map(([px, pz, w, hf], k) => {
    const g = new THREE.SphereGeometry(0.5, k ? Math.max(6, segs - 3) : segs, k ? Math.max(4, rings - 2) : rings), p = g.attributes.position, nrm = g.attributes.normal, col = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i++) {
      let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const ang = Math.atan2(z, x), wob = 1 + 0.1 * Math.sin(ang * 3 + seed * 1.7 + k) + 0.06 * Math.sin(ang * 5 + seed * 3.1 + y * 6);
      x *= wob * w; z *= wob * w;
      y = y < 0 ? y * 0.3 * w : y * 1.05 * w * hf;                              // a level base with a little belly, a domed top
      p.setXYZ(i, x + px, y + 0.11, z + pz);
      const up = nrm.getY(i);
      if (up > 0.1) c.copy(side).lerp(top, Math.min(1, (up - 0.1) / 0.45)); else c.copy(under).lerp(side, Math.max(0, (up + 0.75) / 0.85));
      col.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.deleteAttribute('uv'); g.computeVertexNormals();
    return g;
  });
  const out = mergeGeometries(parts, false);
  for (const g of parts) g.dispose();
  return out;
}

/** Give a geometry one vertex colour (for merging plain parts into a vertex-painted stand-in). */
export function tinted(geo, color) {
  const c = new THREE.Color(color), n = geo.attributes.position.count, col = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) col.set([c.r, c.g, c.b], i * 3);
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return geo;
}

/** A round timber between two points of a model's own space, as a geometry (for stand-ins grown by rule). */
export function stick(a, b, r0, r1 = r0, radial = 6) {
  const d = new THREE.Vector3().subVectors(b, a), len = d.length();
  const g = new THREE.CylinderGeometry(r1, r0, len, radial, 1, false);
  g.translate(0, len / 2, 0);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()));
  g.translate(a.x, a.y, a.z);
  return g;
}

/**
 * Many plain solids as ONE object (one draw call): a stand-in made of parts (a hive stand, a pair of piers, a loft bay).
 * Parts are placed in the page's frame like `stand`, each in its own colour (carried as vertex paint).
 *   const p = new Pile();  p.box([s, d, y], [w, h, depth], '#5d5058', turn);  p.cyl(...);  p.cone(...);  p.limb({ line, thick });
 *   p.build(ctx, 'hive_stand', shared.mat.wood);
 */
export class Pile {
  constructor() { this.parts = []; this.first = null; }
  solid(geo, at, size, color, turn = 0, tilt = null) {
    const p = xz(at[0], at[1] || 0), m = new THREE.Matrix4(), q = new THREE.Quaternion().setFromEuler(new THREE.Euler(tilt ? tilt[0] : 0, turn + heading(at[0]), tilt ? tilt[1] : 0, 'YXZ'));
    m.compose(new THREE.Vector3(p[0], at[2] || 0, p[1]), q, new THREE.Vector3(size[0], size[1], size[2]));
    geo.applyMatrix4(m);
    if (!this.first) this.first = at;
    return this.geo(geo, color);
  }
  /** A box standing on the middle of its foot at [s, d, y]; size [width (across the route), height, depth (along it)]. */
  box(at, size, color, turn = 0, tilt = null) { const g = new THREE.BoxGeometry(1, 1, 1); g.translate(0, 0.5, 0); return this.solid(g, at, size, color, turn, tilt); }
  cyl(at, size, color, turn = 0, tilt = null, radial = 12) { const g = new THREE.CylinderGeometry(0.5, 0.5, 1, radial); g.translate(0, 0.5, 0); return this.solid(g, at, size, color, turn, tilt); }
  cone(at, size, color, turn = 0, radial = 4) { const g = new THREE.ConeGeometry(0.5, 1, radial); g.rotateY(Math.PI / 4); g.translate(0, 0.5, 0); return this.solid(g, at, size, color, turn); }
  /** A round timber along a line of the page's points (see `limb`). */
  limb(o, color) { return this.geo(limb(null, { ...o, geometryOnly: true }), color); }
  /** A geometry already in the realm's own coordinates. */
  geo(g, color) { if (g.index === null) g = g.toNonIndexed(); g.deleteAttribute('uv'); if (!g.attributes.normal) g.computeVertexNormals(); this.parts.push(tinted(g, color)); return this; }
  build(ctx, name, material) {
    if (!this.parts.length) return null;
    const idx = this.parts.every((g) => g.index), parts = idx ? this.parts : this.parts.map((g) => (g.index ? g.toNonIndexed() : g));
    const geo = mergeGeometries(parts, false);
    for (const g of this.parts) g.dispose();
    const m = new THREE.Mesh(geo, material || ctx.kit.gouache({ color: '#ffffff', vertexColors: true, brush: 0.7 }));      // (pass shared.mat.wood: it takes the hour's light)
    m.name = 'standin:' + (name || ''); m.frustumCulled = false; ctx.add(m);
    if (name && this.first) nameAt(ctx, name, this.first, 2.2);
    return m;
  }
}
