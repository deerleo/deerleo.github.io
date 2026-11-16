// The waterway of one realm: a smooth centreline with a width, in the realm's own local coordinates (metres).
// The boat enters at the first control point and leaves at the last. Everything that needs to know where the
// channel is (the boat, the banks, scenery placement) asks this object.
import * as THREE from 'three';

const STEP = 0.5;                                   // metres between samples of the lookup table

export class Waterway {
  /**
   * @param {Array<[number, number, number]>} points  control points [x, z, halfWidth], in ride order
   * @param {{softEdges?: boolean}} opts
   */
  constructor(points, opts = {}) {
    if (!points || points.length < 2) throw new Error('a waterway needs at least two control points');
    this.softEdges = !!opts.softEdges;
    this.startStop = !!opts.startStop;                 // the boat cannot go back past the start (the first realm's mooring)
    this.endStop = !!opts.endStop;                     // nor on past the end (the last water of the ride)
    const pts = points.map(([x, z]) => new THREE.Vector3(x, 0, z));
    const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
    const rough = curve.getLength();
    const n = Math.max(8, Math.ceil(rough / STEP));
    const sp = curve.getSpacedPoints(n);              // equally spaced along the curve
    // widths: interpolate the control widths over each control point's arc position
    const ctrlU = [];                                 // arc fraction of every control point
    {
      const fine = curve.getPoints(pts.length * 60), acc = [0];
      for (let i = 1; i < fine.length; i++) acc.push(acc[i - 1] + fine[i].distanceTo(fine[i - 1]));
      // CatmullRomCurve3.getPoints is uniform in t, and control point i sits at t = i / (count - 1)
      for (let i = 0; i < pts.length; i++) { const idx = Math.round(i / (pts.length - 1) * (fine.length - 1)); ctrlU.push(acc[idx] / acc[acc.length - 1]); }
    }
    const widthAt = (u) => {
      let k = 0;
      while (k < ctrlU.length - 2 && u > ctrlU[k + 1]) k++;
      const u0 = ctrlU[k], u1 = ctrlU[k + 1], f = u1 > u0 ? Math.min(1, Math.max(0, (u - u0) / (u1 - u0))) : 0;
      const e = f * f * (3 - 2 * f);
      return points[k][2] + (points[k + 1][2] - points[k][2]) * e;
    };
    this.count = n + 1;
    this.x = new Float32Array(this.count); this.z = new Float32Array(this.count);
    this.tx = new Float32Array(this.count); this.tz = new Float32Array(this.count);
    this.hw = new Float32Array(this.count);
    for (let i = 0; i <= n; i++) {
      this.x[i] = sp[i].x; this.z[i] = sp[i].z; this.hw[i] = widthAt(i / n);
      const a = sp[Math.max(0, i - 1)], b = sp[Math.min(n, i + 1)];
      const dx = b.x - a.x, dz = b.z - a.z, l = Math.hypot(dx, dz) || 1;
      this.tx[i] = dx / l; this.tz[i] = dz / l;
    }
    this.step = sp[0].distanceTo(sp[1]) || STEP;
    this.length = this.step * n;
  }

  /** Centreline sample at arc length s (clamped to the path). `right` is the unit vector to the rider's right. */
  at(s, out = {}) {
    const f = Math.min(this.count - 1.0001, Math.max(0, s / this.step)), i = Math.floor(f), t = f - i, j = i + 1;
    out.x = this.x[i] + (this.x[j] - this.x[i]) * t; out.z = this.z[i] + (this.z[j] - this.z[i]) * t;
    let tx = this.tx[i] + (this.tx[j] - this.tx[i]) * t, tz = this.tz[i] + (this.tz[j] - this.tz[i]) * t;
    const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l;
    out.tx = tx; out.tz = tz;
    out.rx = -tz; out.rz = tx;                        // right of travel (y up, so right = tangent rotated -90 degrees about y)
    out.halfWidth = this.hw[i] + (this.hw[j] - this.hw[i]) * t;
    out.heading = Math.atan2(-tx, -tz);              // rotation.y that makes an object's -Z axis point along the path
    out.s = Math.min(this.length, Math.max(0, s));
    return out;
  }

  /** World position (in the realm's local frame) at arc length s, `d` metres to the right of the centreline (negative = left). */
  point(s, d = 0, y = 0, target = new THREE.Vector3()) {
    const p = this.at(s, _tmp);
    return target.set(p.x + p.rx * d, y, p.z + p.rz * d);
  }

  /**
   * Project a position onto the path. Returns arc length s (may run past either end: s < 0 or s > length when the
   * position is beyond the first or last sample) and the signed lateral offset d (positive = right of travel).
   * `hint` is the previous s, which keeps the search local and stable where the path comes close to itself.
   */
  locate(x, z, hint = null, out = {}) {
    let i0 = 0, i1 = this.count - 1;
    if (hint !== null && Number.isFinite(hint)) { const c = Math.min(this.count - 1, Math.max(0, Math.round(hint / this.step))); i0 = Math.max(0, c - 40); i1 = Math.min(this.count - 1, c + 40); }
    let best = i0, bd = Infinity;
    for (let i = i0; i <= i1; i++) { const dx = x - this.x[i], dz = z - this.z[i], d2 = dx * dx + dz * dz; if (d2 < bd) { bd = d2; best = i; } }
    // refine along the tangent of the nearest sample
    const dx = x - this.x[best], dz = z - this.z[best];
    const along = dx * this.tx[best] + dz * this.tz[best];
    let s = best * this.step + along;
    if (best > 0 && best < this.count - 1) s = Math.min((best + 1) * this.step, Math.max((best - 1) * this.step, s));
    // one more projection step inside the path, so s moves smoothly even far out on the wide side of a bend
    if (s > 0 && s < this.length) { const a = this.at(s, _tmp); s = Math.min(this.length, Math.max(0, s + (x - a.x) * a.tx + (z - a.z) * a.tz)); }
    const p = this.at(s, _tmp);
    out.s = s; out.d = (x - p.x) * p.rx + (z - p.z) * p.rz; out.halfWidth = p.halfWidth;
    out.tx = p.tx; out.tz = p.tz; out.rx = p.rx; out.rz = p.rz;
    return out;
  }

  /** Points along one edge of the channel (side: -1 left, +1 right), `offset` metres outside the edge. */
  edge(side, s0 = 0, s1 = this.length, step = 2, offset = 0) {
    const out = [];
    for (let s = s0; s <= s1 + 1e-6; s += step) { const p = this.at(s, _tmp); const d = side * (p.halfWidth + offset); out.push(new THREE.Vector3(p.x + p.rx * d, 0, p.z + p.rz * d)); }
    return out;
  }
}

const _tmp = {};
