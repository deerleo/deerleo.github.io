import { orientOutsideRight } from './util.js';

const CELL = 16;
const MARGIN = 2.0;      // every collider is filed in all cells within this distance
const MAX_SEG = 14;      // long edges are split so they stay local to a few cells

// Static world colliders: solid polygons (buildings, the shrine precinct) and
// circles (tree trunks, lamp posts, roundabout islands), in a uniform grid.
export class Colliders {
  constructor(bounds) {
    this.x0 = bounds[0] - 120;
    this.z0 = bounds[1] - 120;
    this.nx = Math.ceil((bounds[2] - bounds[0] + 240) / CELL);
    this.nz = Math.ceil((bounds[3] - bounds[1] + 240) / CELL);
    this._segs = [];     // ax, az, bx, bz, nx, nz
    this._circs = [];    // x, z, r
    this.segs = new Float32Array(0);
    this.circs = new Float32Array(0);
    this.start = new Int32Array(this.nx * this.nz + 1);
    this.items = new Int32Array(0);
    this.hit = { px: 0, pz: 0, nx: 0, nz: 0, depth: 0 };
  }

  addPolygon(pts) {
    const p = orientOutsideRight(pts);
    const n = p.length / 2;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const ax = p[2 * i], az = p[2 * i + 1], bx = p[2 * j], bz = p[2 * j + 1];
      const dx = bx - ax, dz = bz - az;
      const len = Math.hypot(dx, dz);
      if (len < 0.05) continue;
      const nx = -dz / len, nz = dx / len;
      const parts = Math.max(1, Math.ceil(len / MAX_SEG));
      for (let k = 0; k < parts; k++) {
        const t0 = k / parts, t1 = (k + 1) / parts;
        this._segs.push(ax + dx * t0, az + dz * t0, ax + dx * t1, az + dz * t1, nx, nz);
      }
    }
  }

  addCircle(x, z, r) {
    this._circs.push(x, z, r);
  }

  _cell(x, z) {
    const cx = Math.floor((x - this.x0) / CELL), cz = Math.floor((z - this.z0) / CELL);
    if (cx < 0 || cz < 0 || cx >= this.nx || cz >= this.nz) return -1;
    return cz * this.nx + cx;
  }

  // (Re)build the grid. Can be called again after adding more colliders.
  build() {
    const S = this.segs = new Float32Array(this._segs);
    const C = this.circs = new Float32Array(this._circs);
    const nCells = this.nx * this.nz;
    const count = new Int32Array(nCells + 1);
    const visit = (fn) => {
      for (let i = 0; i < S.length; i += 6) {
        this._range(Math.min(S[i], S[i + 2]) - MARGIN, Math.min(S[i + 1], S[i + 3]) - MARGIN,
          Math.max(S[i], S[i + 2]) + MARGIN, Math.max(S[i + 1], S[i + 3]) + MARGIN, fn, i / 6);
      }
      for (let i = 0; i < C.length; i += 3) {
        const r = C[i + 2] + MARGIN;
        this._range(C[i] - r, C[i + 1] - r, C[i] + r, C[i + 1] + r, fn, -1 - i / 3);
      }
    };
    visit((cell) => { count[cell + 1]++; });
    for (let i = 0; i < nCells; i++) count[i + 1] += count[i];
    const items = new Int32Array(count[nCells]);
    const fill = count.slice(0, nCells);
    visit((cell, id) => { items[fill[cell]++] = id; });
    this.start = count;
    this.items = items;
  }

  _range(x0, z0, x1, z1, fn, id) {
    const a = Math.max(0, Math.floor((x0 - this.x0) / CELL)), b = Math.min(this.nx - 1, Math.floor((x1 - this.x0) / CELL));
    const c = Math.max(0, Math.floor((z0 - this.z0) / CELL)), d = Math.min(this.nz - 1, Math.floor((z1 - this.z0) / CELL));
    for (let cz = c; cz <= d; cz++) for (let cx = a; cx <= b; cx++) fn(cz * this.nx + cx, id);
  }

  // Push a circle out of everything solid. Returns true on contact; the total
  // push and the deepest contact normal are left in this.hit.
  resolve(x, z, r) {
    const h = this.hit;
    h.px = 0; h.pz = 0; h.nx = 0; h.nz = 0; h.depth = 0;
    const cell = this._cell(x, z);
    if (cell < 0) return false;
    const S = this.segs, C = this.circs, items = this.items;
    const s0 = this.start[cell], s1 = this.start[cell + 1];
    let any = false;
    for (let pass = 0; pass < 2; pass++) {
      let moved = false;
      for (let k = s0; k < s1; k++) {
        const id = items[k];
        let pen = 0, nx = 0, nz = 0;
        if (id >= 0) {
          const o = id * 6;
          const ax = S[o], az = S[o + 1], bx = S[o + 2], bz = S[o + 3];
          const abx = bx - ax, abz = bz - az;
          const rx = x - ax, rz = z - az;
          const t = (rx * abx + rz * abz) / (abx * abx + abz * abz);
          if (t >= 0 && t <= 1) {
            const d = rx * S[o + 4] + rz * S[o + 5];
            // Only a shallow band behind the face counts, so thin buildings never
            // pull a car through from the far side.
            if (d < r && d > -0.8) { pen = r - d; nx = S[o + 4]; nz = S[o + 5]; }
          } else {
            const ex = t < 0 ? ax : bx, ez = t < 0 ? az : bz;
            const dx = x - ex, dz = z - ez;
            const d2 = dx * dx + dz * dz;
            if (d2 < r * r && d2 > 1e-8 && dx * S[o + 4] + dz * S[o + 5] > -0.05) {
              const d = Math.sqrt(d2);
              pen = r - d; nx = dx / d; nz = dz / d;
            }
          }
        } else {
          const o = (-1 - id) * 3;
          const dx = x - C[o], dz = z - C[o + 1];
          const rr = r + C[o + 2];
          const d2 = dx * dx + dz * dz;
          if (d2 < rr * rr && d2 > 1e-8) {
            const d = Math.sqrt(d2);
            pen = rr - d; nx = dx / d; nz = dz / d;
          }
        }
        if (pen > 0) {
          x += nx * pen; z += nz * pen;
          h.px += nx * pen; h.pz += nz * pen;
          if (pen > h.depth) { h.depth = pen; h.nx = nx; h.nz = nz; }
          any = moved = true;
        }
      }
      if (!moved) break;
    }
    return any;
  }

  // Distance along a ray to the first solid edge (used to keep the camera out of walls).
  raycast(ox, oz, dx, dz, maxT) {
    let best = maxT;
    const S = this.segs;
    let last = -2;
    const steps = Math.ceil(maxT / (CELL * 0.5));
    for (let s = 0; s <= steps; s++) {
      const t = Math.min(maxT, s * CELL * 0.5);
      const cell = this._cell(ox + dx * t, oz + dz * t);
      if (cell < 0 || cell === last) continue;
      last = cell;
      for (let k = this.start[cell]; k < this.start[cell + 1]; k++) {
        const id = this.items[k];
        if (id < 0) continue;
        const o = id * 6;
        const ex = S[o + 2] - S[o], ez = S[o + 3] - S[o + 1];
        const den = dx * ez - dz * ex;
        if (Math.abs(den) < 1e-9) continue;
        const wx = S[o] - ox, wz = S[o + 1] - oz;
        const t2 = (wx * ez - wz * ex) / den;
        const u = (wx * dz - wz * dx) / den;
        if (t2 > 0 && t2 < best && u >= 0 && u <= 1) best = t2;
      }
    }
    return best;
  }
}

// Paved-surface lookup: signed distance to the nearest road edge (negative = on the road).
export class Surface {
  constructor(bounds, roads) {
    const cell = this.cell = 24;
    this.x0 = bounds[0] - 150;
    this.z0 = bounds[1] - 150;
    this.nx = Math.ceil((bounds[2] - bounds[0] + 300) / cell);
    this.nz = Math.ceil((bounds[3] - bounds[1] + 300) / cell);
    const segs = [];
    for (const r of roads) {
      const p = r.pts, hw = r.w / 2;
      for (let i = 0; i + 3 < p.length; i += 2) segs.push(p[i], p[i + 1], p[i + 2], p[i + 3], hw);
    }
    const S = this.segs = new Float32Array(segs);
    const nCells = this.nx * this.nz;
    const count = new Int32Array(nCells + 1);
    const each = (fn) => {
      for (let i = 0; i < S.length; i += 5) {
        const m = S[i + 4] + 3;
        const a = Math.max(0, Math.floor((Math.min(S[i], S[i + 2]) - m - this.x0) / cell));
        const b = Math.min(this.nx - 1, Math.floor((Math.max(S[i], S[i + 2]) + m - this.x0) / cell));
        const c = Math.max(0, Math.floor((Math.min(S[i + 1], S[i + 3]) - m - this.z0) / cell));
        const d = Math.min(this.nz - 1, Math.floor((Math.max(S[i + 1], S[i + 3]) + m - this.z0) / cell));
        for (let cz = c; cz <= d; cz++) for (let cx = a; cx <= b; cx++) fn(cz * this.nx + cx, i);
      }
    };
    each((c) => { count[c + 1]++; });
    for (let i = 0; i < nCells; i++) count[i + 1] += count[i];
    const items = new Int32Array(count[nCells]);
    const fill = count.slice(0, nCells);
    each((c, i) => { items[fill[c]++] = i; });
    this.start = count;
    this.items = items;
  }

  // < 0 on a road, > 0 off it; capped at +3 m (we only need "how far off the edge").
  roadDist(x, z) {
    const cx = Math.floor((x - this.x0) / this.cell), cz = Math.floor((z - this.z0) / this.cell);
    if (cx < 0 || cz < 0 || cx >= this.nx || cz >= this.nz) return 3;
    const c = cz * this.nx + cx;
    const S = this.segs;
    let best = 3;
    for (let k = this.start[c]; k < this.start[c + 1]; k++) {
      const i = this.items[k];
      const ax = S[i], az = S[i + 1];
      const abx = S[i + 2] - ax, abz = S[i + 3] - az;
      let t = ((x - ax) * abx + (z - az) * abz) / (abx * abx + abz * abz || 1);
      t = t < 0 ? 0 : t > 1 ? 1 : t;
      const dx = x - ax - abx * t, dz = z - az - abz * t;
      const d = Math.sqrt(dx * dx + dz * dz) - S[i + 4];
      if (d < best) best = d;
    }
    return best;
  }
}
