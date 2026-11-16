import * as THREE from 'three';

export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const damp = (a, b, rate, dt) => a + (b - a) * (1 - Math.exp(-rate * dt));
export const wrapAngle = (a) => {
  a = (a + Math.PI) % (Math.PI * 2);
  if (a < 0) a += Math.PI * 2;
  return a - Math.PI;
};

// Small deterministic random generator so the city looks the same on every load.
export function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function signedArea(p) {
  let a = 0;
  const n = p.length / 2;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    a += p[2 * i] * p[2 * j + 1] - p[2 * j] * p[2 * i + 1];
  }
  return a / 2;
}

// Returns the ring ordered so that the outside is on the right of every edge
// (in x/z map coordinates) - the convention used for walls and colliders.
export function orientOutsideRight(p) {
  if (signedArea(p) <= 0) return p;
  const n = p.length / 2;
  const o = new Float32Array(p.length);
  for (let i = 0; i < n; i++) {
    o[2 * i] = p[2 * (n - 1 - i)];
    o[2 * i + 1] = p[2 * (n - 1 - i) + 1];
  }
  return o;
}

export function pointInPoly(x, z, p) {
  let inside = false;
  const n = p.length / 2;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = p[2 * i], zi = p[2 * i + 1], xj = p[2 * j], zj = p[2 * j + 1];
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
}

// Triangulate a flat ring (x,z pairs); returns index triples wound to face up (+Y).
export function triangulate(p) {
  const n = p.length / 2;
  const contour = [];
  for (let i = 0; i < n; i++) contour.push(new THREE.Vector2(p[2 * i], p[2 * i + 1]));
  const faces = THREE.ShapeUtils.triangulateShape(contour, []);
  const out = [];
  for (const f of faces) {
    const [a, b, c] = f;
    const up = (p[2 * b + 1] - p[2 * a + 1]) * (p[2 * c] - p[2 * a]) - (p[2 * b] - p[2 * a]) * (p[2 * c + 1] - p[2 * a + 1]);
    if (up >= 0) out.push(a, b, c);
    else out.push(a, c, b);
  }
  return out;
}

export function canvasTexture(w, h, draw, opts = {}) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = opts.data ? THREE.NoColorSpace : THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = opts.clamp ? THREE.ClampToEdgeWrapping : THREE.RepeatWrapping;
  t.anisotropy = opts.aniso || 4;
  return t;
}

// Concatenate geometries (position / normal / uv, optional flat colour each).
export function mergeGeoms(list) {
  const pos = [], nor = [], uv = [], col = [];
  let useCol = false;
  for (const item of list) {
    const g0 = item.geometry || item;
    const g = g0.index ? g0.toNonIndexed() : g0;
    if (item.matrix) g.applyMatrix4(item.matrix);
    const p = g.attributes.position, nn = g.attributes.normal, u = g.attributes.uv;
    const c = item.color ? new THREE.Color(item.color) : null;
    if (c) useCol = true;
    for (let i = 0; i < p.count; i++) {
      pos.push(p.getX(i), p.getY(i), p.getZ(i));
      nor.push(nn.getX(i), nn.getY(i), nn.getZ(i));
      if (u) uv.push(u.getX(i), u.getY(i)); else uv.push(0, 0);
      if (c) col.push(c.r, c.g, c.b); else col.push(1, 1, 1);
    }
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  out.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  if (useCol) out.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  return out;
}

export function fmtTime(t) {
  if (t == null || !isFinite(t)) return '--:--.---';
  const m = Math.floor(t / 60);
  const s = t - m * 60;
  return `${m}:${s.toFixed(3).padStart(6, '0')}`;
}

export const ORDINAL = ['1st', '2nd', '3rd', '4th'];
