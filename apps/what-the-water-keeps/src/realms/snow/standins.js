// Stand-ins in the page's frame, for stage 1 (layout and light). src/engine/modules.js gives standIn (a plain solid);
// these place solids by the page's (s, d, y) through shared.frame, make many solids ONE object (one draw call), and add
// the shapes this area needs that a box cannot stand for: a limb along a line, a cloud of blossom, a ridge of snow.
// Everything made here is named 'standin:<what it stands for>' and shows its name with &labels=1.
// (The same helpers as the flood orchard's stage 1, copied: stand-ins are thrown away, and that file is not ours.)
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { standIn } from '../../engine/modules.js';

const labels = new URLSearchParams(location.search).has('labels');
export const V = (x, y, z) => new THREE.Vector3(x, y, z);

/** Only a name, floating over a place (for stand-ins made of many parts, or instanced). F: shared.frame. */
export function nameAt(ctx, F, name, at, lift = 1) {
  if (!labels) return;
  const p = F.at(at[0], at[1] || 0, (at[2] || 0) + lift);
  standIn(ctx, { name, position: [p.x, p.y, p.z], size: [0.02, 0.02, 0.02], color: '#000000' });
}

/** Give a geometry one vertex colour (for merging plain parts into a vertex-painted stand-in). */
export function tinted(geo, color) {
  const c = color && color.isColor ? color : new THREE.Color(color), n = geo.attributes.position.count, col = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) col.set([c.r, c.g, c.b], i * 3);
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return geo;
}

/** A round timber between two points of a model's own space, as a geometry. (A twig of three or four sides has no end caps: nobody sees them, and in sprays by the thousand they are half the triangles.) */
export function stick(a, b, r0, r1 = r0, radial = 6) {
  const d = new THREE.Vector3().subVectors(b, a), len = d.length() || 1e-4;
  const g = new THREE.CylinderGeometry(r1, r0, len, radial, 1, radial <= 4);
  g.translate(0, len / 2, 0);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()));
  g.translate(a.x, a.y, a.z);
  return g;
}

/**
 * A ridge of snow lying along the top of a timber from a to b (a model's own space): a flattened loaf a little wider
 * than the timber, white above and lavender in its belly (vertex paint). r: the timber's radius there; deep: its depth.
 */
export function ridge(a, b, r, deep = null, colors = {}) {
  const top = new THREE.Color(colors.top || '#F3ECE8'), under = new THREE.Color(colors.under || '#B4AED0');
  const d = new THREE.Vector3().subVectors(b, a), len = d.length() || 1e-4, flat = Math.hypot(d.x, d.z) / len;
  if (deep == null) deep = Math.min(0.2, 0.035 + r * 0.9);
  const g = new THREE.CylinderGeometry(1, 1, len, 6, 1, false);
  g.scale(r * 1.12 + 0.012, 1, deep * 0.5); g.translate(0, len / 2, 0);
  // lay it along the timber with its flat side up
  const dir = d.clone().normalize(), up = new THREE.Vector3(0, 1, 0), side = new THREE.Vector3().crossVectors(dir, up);
  if (side.lengthSq() < 1e-6) side.set(1, 0, 0); side.normalize();
  const nrm = new THREE.Vector3().crossVectors(side, dir).normalize();
  const m = new THREE.Matrix4().makeBasis(side, dir, nrm);
  g.applyMatrix4(m); g.translate(a.x, a.y, a.z); g.translate(nrm.x * (r * 0.75 + deep * 0.3), Math.abs(nrm.y) * (r * 0.75 + deep * 0.3), nrm.z * (r * 0.75 + deep * 0.3));
  const p = g.attributes.position, n = g.attributes.normal, col = new Float32Array(p.count * 3), c = new THREE.Color();
  for (let i = 0; i < p.count; i++) { c.copy(under).lerp(top, Math.min(1, Math.max(0, n.getY(i) * 1.6 + 0.75))); col.set([c.r, c.g, c.b], i * 3); }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return g;
}

/**
 * A limb, a pole, a rail: a round timber along a line of the page's points, as a geometry in the realm's coordinates.
 *   F       shared.frame
 *   line    [[s, d, y], ...]   y is the height of its UNDERSIDE when `under` is true (the page gives limbs that way)
 *   thick   metres, or [at the first point, at the last]
 */
export function limbGeometry(F, o) {
  const [t0, t1] = Array.isArray(o.thick) ? o.thick : [o.thick, o.thick];
  const n = o.line.length, pts = o.line.map(([s, d, y], i) => { const t = t0 + (t1 - t0) * i / Math.max(1, n - 1); return F.at(s, d, y + (o.under ? t / 2 : 0)); });
  const curve = n > 2 && o.smooth !== false ? new THREE.CatmullRomCurve3(pts, false, 'centripetal') : null;
  const segs = o.segments || Math.max(2, (n - 1) * (curve ? 5 : 1)), radial = o.radial || 8;
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
  geo.userData.points = Array.from({ length: segs + 1 }, (_, i) => ({ p: at(i / segs), r: (t0 + (t1 - t0) * i / segs) / 2 }));      // its spine, for whatever lies on it
  return geo;
}

// The three tones of blossom. set.js replaces them, before anything grows a lobe, with the tones as they must be DRAWN
// for the water to show the page's pink (shared.light.blossom: colours seen only in the mirror are authored through
// light.js's inWater). These are what stands in if nobody does.
let BLOSSOM = { top: '#EFC9C9', side: '#E0A3A7', under: '#A87C8E' };
export function setBlossomTones(tones) { BLOSSOM = tones; }

/**
 * One cloud of blossom, unit size, as a geometry to be instanced: a small cumulus of three or four puffs with a level
 * underside, wider than tall, vertex-painted (stand-in for the orchard's lobe_01 .. lobe_12). In this area blossom
 * exists only in the water, where it must read PINK, never white (white is snow): pink above, lilac shade below.
 * Its paint is its colour as the water shows it: the blossom material (light.js) gives its own light and takes none of
 * the dusk's, and the two lamps warm what they reach.
 * Its origin is the middle of its underside; it is about 1 across and 0.55 tall.
 */
export function lobeGeometry(segs = 12, rings = 8, seed = 1, colors = {}) {
  const top = new THREE.Color(colors.top || BLOSSOM.top), side = new THREE.Color(colors.side || BLOSSOM.side), under = new THREE.Color(colors.under || BLOSSOM.under), c = new THREE.Color();
  let q = seed * 7919 + 17; const rnd = () => (q = (q * 16807) % 2147483647) / 2147483647;
  const puffs = [[0, 0, 0.78, 1]];
  const n = 2 + Math.floor(rnd() * 2), a0 = rnd() * 6.283;
  for (let i = 0; i < n; i++) { const a = a0 + i / n * 6.283 + (rnd() - 0.5) * 0.8, r = 0.2 + rnd() * 0.08; puffs.push([Math.cos(a) * r, Math.sin(a) * r, 0.46 + rnd() * 0.16, 0.7 + rnd() * 0.25]); }
  const parts = puffs.map(([px, pz, w, hf], k) => {
    const g = new THREE.SphereGeometry(0.5, k ? Math.max(6, segs - 3) : segs, k ? Math.max(4, rings - 2) : rings), p = g.attributes.position, nrm = g.attributes.normal, col = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i++) {
      let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const ang = Math.atan2(z, x), wob = 1 + 0.1 * Math.sin(ang * 3 + seed * 1.7 + k) + 0.06 * Math.sin(ang * 5 + seed * 3.1 + y * 6);
      x *= wob * w; z *= wob * w;
      y = y < 0 ? y * 0.3 * w : y * 1.05 * w * hf;
      p.setXYZ(i, x + px, y + 0.11, z + pz);
      const up = nrm.getY(i);
      if (up > 0.35) c.copy(side).lerp(top, Math.min(1, (up - 0.35) / 0.5)); else c.copy(under).lerp(side, Math.min(1, Math.max(0, (up + 0.3) / 0.65)));      // (shade on everything that looks down at all; pink on the sides; the palest only on top)
      col.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.deleteAttribute('uv'); g.computeVertexNormals();
    return g;
  });
  const out = mergeGeometries(parts, false);
  for (const g of parts) g.dispose();
  return out;
}

/** Merge geometries that carry position, normal and colour (uv dropped, all made non-indexed alike). */
export function merge(list) {
  const parts = list.map((g) => { const h = g.index ? g.toNonIndexed() : g; h.deleteAttribute('uv'); if (!h.attributes.normal) h.computeVertexNormals(); return h; });
  const out = mergeGeometries(parts, false);
  for (const g of list) g.dispose(); for (const g of parts) g.dispose();
  return out;
}

/**
 * Many plain solids as ONE object (one draw call): a stand-in made of parts. Parts are placed in the page's frame,
 * each in its own colour (carried as vertex paint).
 *   const p = new Pile(F);  p.box([s, d, y], [w, h, depth], '#5d5058', turn);  p.cyl(...);  p.cone(...);  p.limb({ line, thick }, color);
 *   p.build(ctx, 'hive_stand', shared.mat.timber);          // -> the Mesh (already in the realm)
 * size: [width (across the route), height, depth (along it)]; turn: radians about the vertical, 0 = square to the route.
 */
export class Pile {
  constructor(F) { this.F = F; this.parts = []; this.first = null; }
  solid(geo, at, size, color, turn = 0, tilt = null) {
    const p = this.F.at(at[0], at[1] || 0, at[2] || 0), m = new THREE.Matrix4(), q = new THREE.Quaternion().setFromEuler(new THREE.Euler(tilt ? tilt[0] : 0, turn + this.F.heading(at[0]), tilt ? tilt[1] : 0, 'YXZ'));
    m.compose(p, q, new THREE.Vector3(size[0], size[1], size[2]));
    geo.applyMatrix4(m);
    if (!this.first) this.first = at;
    return this.geo(geo, color);
  }
  /** A box standing on the middle of its foot at [s, d, y]. */
  box(at, size, color, turn = 0, tilt = null) { const g = new THREE.BoxGeometry(1, 1, 1); g.translate(0, 0.5, 0); return this.solid(g, at, size, color, turn, tilt); }
  cyl(at, size, color, turn = 0, tilt = null, radial = 12) { const g = new THREE.CylinderGeometry(0.5, 0.5, 1, radial); g.translate(0, 0.5, 0); return this.solid(g, at, size, color, turn, tilt); }
  cone(at, size, color, turn = 0, radial = 4, tilt = null) { const g = new THREE.ConeGeometry(0.5, 1, radial); g.rotateY(Math.PI / 4); g.translate(0, 0.5, 0); return this.solid(g, at, size, color, turn, tilt); }
  dome(at, size, color, turn = 0) { const g = new THREE.SphereGeometry(0.5, 14, 7, 0, Math.PI * 2, 0, Math.PI / 2); g.scale(1, 2, 1); return this.solid(g, at, size, color, turn); }
  /** A round timber along a line of the page's points (see limbGeometry). */
  limb(o, color) { return this.geo(limbGeometry(this.F, o), color); }
  /** A geometry already in the realm's coordinates; `color` null keeps the vertex paint it has. */
  geo(g, color) { if (g.index !== null) { const h = g.toNonIndexed(); g.dispose(); g = h; } g.deleteAttribute('uv'); if (!g.attributes.normal) g.computeVertexNormals(); this.parts.push(color == null ? g : tinted(g, color)); return this; }
  get empty() { return !this.parts.length; }
  geometry() { const geo = mergeGeometries(this.parts, false); for (const g of this.parts) g.dispose(); this.parts = []; return geo; }
  build(ctx, name, material) {
    if (!this.parts.length) return null;
    const m = new THREE.Mesh(this.geometry(), material || ctx.kit.gouache({ color: '#ffffff', vertexColors: true, brush: 0.7 }));
    m.name = 'standin:' + (name || ''); m.frustumCulled = false; ctx.add(m);
    if (name && this.first) nameAt(ctx, this.F, name, this.first, 2.2);
    return m;
  }
}
