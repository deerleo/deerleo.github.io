// Stand-ins for the dyers' reach (stage 1, layout): plain solids of the true size in the true place, in local colour.
// src/engine/modules.js gives standIn (one solid, one draw call); a set piece of this area is usually many timbers,
// so this adds a Pile: many solids as ONE object, each part in its own colour (carried as vertex paint). A pile is
// named 'standin:<the model it stands for>' like any stand-in: `&labels=1` shows the name, and the person whose real
// model replaces it deletes its lines (or, from another module, calls removeStandIn(ctx, '<name>')).
// This file goes when the last stand-in has gone.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const labels = typeof location !== 'undefined' && new URLSearchParams(location.search).has('labels');
const _c = new THREE.Color(), UP = new THREE.Vector3(0, 1, 0);

function tinted(geo, color) {
  _c.set(color);
  const n = geo.attributes.position.count, col = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) col.set([_c.r, _c.g, _c.b], i * 3);
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return geo;
}

/** A name floating over a place (with &labels=1). */
export function nameAt(ctx, name, p, lift = 1) {
  if (!labels || !name) return;
  const cv = document.createElement('canvas'), g = cv.getContext('2d');
  g.font = '600 28px system-ui, sans-serif';
  cv.width = Math.ceil(g.measureText(name).width) + 20; cv.height = 40;
  g.font = '600 28px system-ui, sans-serif';
  g.fillStyle = 'rgba(0,0,0,0.72)'; g.fillRect(0, 0, cv.width, cv.height);
  g.fillStyle = '#fff'; g.textBaseline = 'middle'; g.fillText(name, 10, 21);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, fog: false, sizeAttenuation: false }));
  s.scale.set(0.045 * cv.width / cv.height, 0.045, 1); s.renderOrder = 999; s.position.set(p.x, p.y + lift, p.z);
  ctx.add(s);
}

/**
 * Many plain solids as one object. Positions are the realm's own (a THREE.Vector3 from kit.at(s, d, y), or [x, y, z]);
 * `turn` is rotation about the vertical (kit.headingAt(s) lays a box's depth along the route).
 *   const p = new Pile();
 *   p.box(kit.at(92, 13.6), [0.6, 23, 0.6], '#5A4250');         // foot at the point; size [width, height, depth]
 *   p.cyl(pos, [across, height], color);  p.stick(a, b, thick, color);  p.ring(centre, radius, axis, thick, color);
 *   p.build(ctx, 'west front frame');                             // -> the Mesh, named 'standin:west front frame'
 */
export class Pile {
  constructor() { this.parts = []; this.first = null; this.top = 0; }
  static v(p) { return p && p.isVector3 ? p : new THREE.Vector3(p[0], p[1], p[2]); }
  add(geo, color) {
    if (geo.index === null) { const n = geo.attributes.position.count, idx = new Uint32Array(n); for (let i = 0; i < n; i++) idx[i] = i; geo.setIndex(new THREE.BufferAttribute(idx, 1)); }
    geo.deleteAttribute('uv'); if (!geo.attributes.normal) geo.computeVertexNormals();
    this.parts.push(tinted(geo, color));
    return this;
  }
  note(p, h) { if (!this.first) this.first = Pile.v(p).clone(); this.top = Math.max(this.top, h); }
  /** A box standing on the middle of its foot. size [width, height, depth]; turn about the vertical; tilt [x, z] radians. */
  box(pos, size, color, turn = 0, tilt = null) {
    const p = Pile.v(pos), g = new THREE.BoxGeometry(1, 1, 1); g.translate(0, 0.5, 0);
    const m = new THREE.Matrix4().compose(p, new THREE.Quaternion().setFromEuler(new THREE.Euler(tilt ? tilt[0] : 0, turn, tilt ? tilt[1] : 0, 'YXZ')), new THREE.Vector3(size[0], size[1], size[2]));
    g.applyMatrix4(m); this.note(p, size[1]);
    return this.add(g, color);
  }
  /** An upright round thing standing on its foot. size [across, height] or [across at the foot, height, across at the top]. */
  cyl(pos, size, color, radial = 10) {
    const p = Pile.v(pos), g = new THREE.CylinderGeometry((size[2] ?? size[0]) / 2, size[0] / 2, size[1], radial); g.translate(p.x, p.y + size[1] / 2, p.z);
    this.note(p, size[1]);
    return this.add(g, color);
  }
  /** A timber between two points: round (`radial` sides; 4 = square). thick: metres, or [at a, at b]. */
  stick(a, b, thick, color, radial = 6) {
    const A = Pile.v(a), B = Pile.v(b), d = new THREE.Vector3().subVectors(B, A), len = d.length();
    if (len < 1e-4) return this;
    const [t0, t1] = Array.isArray(thick) ? thick : [thick, thick];
    const g = new THREE.CylinderGeometry(t1 / 2, t0 / 2, len, radial, 1, false);
    if (radial === 4) g.rotateY(Math.PI / 4);
    g.translate(0, len / 2, 0);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(UP, d.normalize()));
    g.translate(A.x, A.y, A.z); this.note(A, Math.abs(B.y - A.y));
    return this.add(g, color);
  }
  /** A ring (a rim, a hoop) about a centre: `axis` is the direction of its axle. */
  ring(centre, radius, axis, thick, color, segs = 48) {
    const c = Pile.v(centre), g = new THREE.TorusGeometry(radius, thick / 2, 6, segs);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), Pile.v(axis).clone().normalize()));
    g.translate(c.x, c.y, c.z); this.note(c, 0);
    return this.add(g, color);
  }
  /** A flat slab given by its outline on the level ([[x, z], ...], in order) from y0 up to y1. */
  slab(outline, y0, y1, color) {
    const sh = new THREE.Shape(outline.map(([x, z]) => new THREE.Vector2(x, -z)));
    const g = new THREE.ExtrudeGeometry(sh, { depth: y1 - y0, bevelEnabled: false });
    g.rotateX(-Math.PI / 2); g.translate(0, y0, 0);
    this.note(new THREE.Vector3(outline[0][0], y0, outline[0][1]), y1 - y0);
    return this.add(g, color);
  }
  /** Any geometry already in the realm's own coordinates. */
  geo(g, color) { return this.add(g, color); }
  get count() { return this.parts.length; }
  /**
   * Make the object. opts: material (default: gouache with the parts' colours), parent, label: false, add: false (to
   * place it yourself, in a group that turns).
   */
  build(ctx, name, opts = {}) {
    if (!this.parts.length) return null;
    const geo = mergeGeometries(this.parts, false);
    for (const g of this.parts) g.dispose();
    this.parts = [];
    const m = new THREE.Mesh(geo, opts.material || ctx.kit.gouache({ color: '#ffffff', vertexColors: true, brush: 0.6, ...(opts.gouache || {}) }));
    m.name = 'standin:' + (name || ''); m.frustumCulled = false;
    if (opts.add !== false) (opts.parent || ctx.group).add(m);
    if (opts.label !== false && this.first) nameAt(ctx, name, this.first, this.top + 0.8);
    return m;
  }
}
