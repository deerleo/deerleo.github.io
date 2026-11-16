// The race loop: centre line and racing line both come from data/map.json, where
// they were routed over the real OSM road graph (see tools/build_map.py).

const NAME_EN = {
  'بلوار گرد روضه': 'Rawza Ring Boulevard',
  'سرک چینی فروشی': 'Chini-Feroshi Street',
  'قالین فروشی': 'Qalin-Feroshi (Carpet Sellers) Street',
  'چوک مخابرات': 'Chowk-e Mukhaberat',
  'چوک مندوی': 'Chowk-e Mandawi',
  'میدان دروازه بلخ': 'Balkh Gate Square',
  'میدان شهید': 'Shahid Square',
};

export class Track {
  constructor(t) {
    const n = this.n = t.center.length / 2;
    this.step = t.step;
    this.length = t.length;
    this.cx = new Float32Array(n); this.cz = new Float32Array(n);
    this.lx = new Float32Array(n); this.lz = new Float32Array(n);
    this.tx = new Float32Array(n); this.tz = new Float32Array(n);
    this.hw = Float32Array.from(t.hw);
    for (let i = 0; i < n; i++) {
      this.cx[i] = t.center[2 * i]; this.cz[i] = t.center[2 * i + 1];
      this.lx[i] = t.line[2 * i]; this.lz[i] = t.line[2 * i + 1];
    }
    for (let i = 0; i < n; i++) {
      const a = (i + n - 1) % n, b = (i + 1) % n;
      const dx = this.cx[b] - this.cx[a], dz = this.cz[b] - this.cz[a];
      const l = Math.hypot(dx, dz) || 1;
      this.tx[i] = dx / l; this.tz[i] = dz / l;
    }
    // curvature of the racing line
    const k = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const a = (i + n - 2) % n, b = (i + 2) % n;
      const ax = this.lx[a], az = this.lz[a], bx = this.lx[i], bz = this.lz[i], cx = this.lx[b], cz = this.lz[b];
      const cross = (bx - ax) * (cz - az) - (bz - az) * (cx - ax);
      const d = Math.hypot(bx - ax, bz - az) * Math.hypot(cx - bx, cz - bz) * Math.hypot(cx - ax, cz - az);
      k[i] = d > 1e-6 ? Math.abs(2 * cross / d) : 0;
    }
    this.curv = new Float32Array(n);
    for (let i = 0; i < n; i++) this.curv[i] = (k[(i + n - 1) % n] + 2 * k[i] + k[(i + 1) % n]) / 4;

    this.names = t.names.map(([i, nm]) => ({ i, name: nm, en: NAME_EN[nm] || '' }));

    // Ordered checkpoints. Two are pinned to the far side of each roundabout so
    // that going round the short (wrong) way, or cutting through side streets,
    // misses them.
    const K = 18;
    let iWest = 0, iSouth = 0;
    for (let i = 0; i < n; i++) {
      if (this.cx[i] < this.cx[iWest]) iWest = i;
      if (this.cz[i] > this.cz[iSouth]) iSouth = i;
    }
    const idx = [];
    for (let j = 0; j < K; j++) idx.push(Math.round((j * n) / K));
    for (const special of [iWest, iSouth]) {
      let best = 1;
      for (let j = 1; j < K; j++) if (Math.abs(idx[j] - special) < Math.abs(idx[best] - special)) best = j;
      idx[best] = special;
    }
    idx.sort((a, b) => a - b);
    this.checkpoints = idx.map((i) => ({
      i, x: this.cx[i], z: this.cz[i], tx: this.tx[i], tz: this.tz[i], hw: this.hw[i], s: i * this.step,
    }));
  }

  wrap(i) {
    const n = this.n;
    return ((i % n) + n) % n;
  }

  // Nearest centre-line sample, searching only a window around a known index.
  nearest(x, z, hint, back = 6, fwd = 30) {
    let best = hint, bd = Infinity;
    for (let k = -back; k <= fwd; k++) {
      const i = this.wrap(hint + k);
      const dx = x - this.cx[i], dz = z - this.cz[i];
      const d = dx * dx + dz * dz;
      if (d < bd) { bd = d; best = i; }
    }
    return best;
  }

  nearestGlobal(x, z) {
    let best = 0, bd = Infinity;
    for (let i = 0; i < this.n; i++) {
      const dx = x - this.cx[i], dz = z - this.cz[i];
      const d = dx * dx + dz * dz;
      if (d < bd) { bd = d; best = i; }
    }
    return best;
  }

  nameAt(i) {
    let cur = this.names[this.names.length - 1];
    for (const nm of this.names) { if (nm.i <= i) cur = nm; else break; }
    return cur;
  }

  // Target speed at every sample for a car that can corner at aLat and brake at decel.
  speedProfile(aLat, vmax, decel) {
    const n = this.n, v = new Float32Array(n);
    for (let i = 0; i < n; i++) v[i] = Math.min(vmax, Math.sqrt(aLat / Math.max(this.curv[i], 1e-4)));
    for (let pass = 0; pass < 2; pass++) {
      for (let i = n - 1; i >= 0; i--) {
        const nxt = v[(i + 1) % n];
        v[i] = Math.min(v[i], Math.sqrt(nxt * nxt + 2 * decel * this.step));
      }
    }
    return v;
  }
}
