'use strict';
/* Road spline, terrain height field (with clay road cuts, river valley), terrain + road meshes. */
(function () {
  const U = G.U;
  const DS = 2, N = 1800, L = N * DS, HALF = 4.3;
  const R = G.road = { N, DS, L, HALF };
  const px = R.px = new Float64Array(N), pz = R.pz = new Float64Array(N), Y = R.y = new Float64Array(N);
  const tx = R.tx = new Float64Array(N), tz = R.tz = new Float64Array(N);
  const curv = R.curv = new Float64Array(N), bank = R.bank = new Float64Array(N);
  const nA = U.makeNoise(7), nB = U.makeNoise(19), nC = U.makeNoise(43);
  const hills = [];
  const wrapI = i => ((i % N) + N) % N;
  R.wrapI = wrapI;
  R.wrapS = s => ((s % L) + L) % L;
  R.dS = (a, b) => { let d = (a - b) % L; if (d > L / 2) d -= L; if (d < -L / 2) d += L; return d; };

  /* ---------------- path ---------------- */
  (function buildPath() {
    const HM = [[2, 0.10, 0.6], [3, 0.07, 2.1], [5, 0.07, 1.0], [7, 0.05, 4.0]], RX = 640, RZ = 430, M = 40000;
    const X = new Float64Array(M), Z = new Float64Array(M), cum = new Float64Array(M + 1);
    for (let i = 0; i < M; i++) {
      const f = -i / M * Math.PI * 2; let r = 1;
      for (const h of HM) r += h[1] * Math.cos(h[0] * f + h[2]);
      X[i] = RX * r * Math.cos(f); Z[i] = RZ * r * Math.sin(f);
    }
    let len = 0;
    for (let i = 0; i < M; i++) { const j = (i + 1) % M; len += Math.hypot(X[j] - X[i], Z[j] - Z[i]); cum[i + 1] = len; }
    const sc = L / len; let k = 0;
    for (let i = 0; i < N; i++) {
      const t = i / N * len; while (cum[k + 1] < t) k++;
      const u = (t - cum[k]) / (cum[k + 1] - cum[k]), j = (k + 1) % M;
      px[i] = (X[k] + (X[j] - X[k]) * u) * sc; pz[i] = (Z[k] + (Z[j] - Z[k]) * u) * sc;
    }
    for (let i = 0; i < N; i++) {
      const a = wrapI(i - 1), b = wrapI(i + 1);
      const dx = px[b] - px[a], dz = pz[b] - pz[a], l = Math.hypot(dx, dz);
      tx[i] = dx / l; tz[i] = dz / l;
    }
    const raw = new Float64Array(N);
    for (let i = 0; i < N; i++) {
      const a = wrapI(i - 1), b = wrapI(i + 1);
      raw[i] = (tz[a] * tx[b] - tx[a] * tz[b]) / (2 * DS); // left turn positive
    }
    for (let i = 0; i < N; i++) { let s = 0; for (let k2 = -5; k2 <= 5; k2++) s += raw[wrapI(i + k2)]; curv[i] = s / 11; }
    for (let i = 0; i < N; i++) bank[i] = U.clamp(curv[i] * 7.5, -0.065, 0.065); // right edge raised in left curves
  })();

  /* start: just before the strongest left-hand curve */
  let S0 = 0;
  (function () {
    let best = -1;
    for (let i = 0; i < N; i++) { let s = 0; for (let k = -25; k <= 25; k++) s += curv[wrapI(i + k)]; if (s > best) { best = s; S0 = i; } }
    S0 = wrapI(S0 - 62);
  })();
  R.start = S0;
  const st = k => wrapI(S0 + k);
  const SO = R.overI = st(262);      // overpass station
  const SB = R.bridgeI = st(735);    // river bridge station
  R.pastures = [{ a: -30, b: 118, side: -1 }, { a: 318, b: 408, side: -1 }, { a: 425, b: 600, side: 1 }, { a: 560, b: 700, side: -1 }, { a: 780, b: 900, side: 1 }, { a: 800, b: 905, side: -1 },
    { a: 1130, b: 1290, side: -1 }, { a: 1185, b: 1300, side: 1 }, { a: 1330, b: 1450, side: 1 }, { a: 1500, b: 1640, side: 1 }, { a: 1600, b: 1745, side: -1 }];
  R.pastureW = function (s, side) {
    const k = R.dS(s, S0 * DS) / DS; let w = 0;
    for (const p of R.pastures) if (p.side === side) for (const kk of [k, k + N]) w = Math.max(w, U.smooth(p.a - 14, p.a + 6, kk) * U.smooth(p.b + 14, p.b - 6, kk));
    return w;
  };

  /* ---------------- forks: side roads that leave the main road on one side and rejoin it further on ----------------
     A fork lives in the (station, lateral offset) space of the main road: its centre line is the main one shifted sideways by off(k). */
  const FORKS = R.forks = [
    { a: 330, b: 500, side: 1, D: 36, ramp: 55, hgt: 4.6, wig: 0, wl: 100 },      // high road: climbs above the main one
    { a: 775, b: 955, side: 1, D: 40, ramp: 60, hgt: -2.4, wig: 0, wl: 100 },     // low road beside the river meadows
    { a: 1365, b: 1545, side: 1, D: 44, ramp: 60, hgt: 2.2, wig: 5, wl: 130 },    // winding back road
  ];
  const fOff = R.off = new Float64Array(N), fY = R.offY = new Float64Array(N), fCos = R.offC = new Float64Array(N).fill(1), fId = R.forkAt = new Int8Array(N).fill(-1);
  const bpx = R.bx = new Float64Array(N), bpz = R.bz = new Float64Array(N), bpy = R.by = new Float64Array(N), btx = R.btx = new Float64Array(N), btz = R.btz = new Float64Array(N);
  const buildForks = function () { // needs the vertical profile, so it runs after profile()
    for (let i = 0; i < N; i++) { bpx[i] = px[i]; bpz[i] = pz[i]; bpy[i] = Y[i]; btx[i] = tx[i]; btz[i] = tz[i]; }
    FORKS.forEach((F, n) => {
      F.i0 = st(F.a); F.n = F.b - F.a; F.s0 = F.i0 * DS; F.len = F.n * DS;
      for (let k = F.a; k <= F.b; k++) {
        const i = st(k), u0 = k - F.a, u1 = F.b - k, env = U.smooth(0, F.ramp, u0) * U.smooth(0, F.ramp, u1);
        const o = F.side * (F.D * env + F.wig * Math.sin(u0 * DS * 6.2832 / F.wl) * env * env), h0 = F.ramp * 0.45;
        fOff[i] = o; fId[i] = n; fY[i] = F.hgt * U.smooth(h0, h0 + 55, u0) * U.smooth(h0, h0 + 55, u1);
        bpx[i] = px[i] - tz[i] * o; bpz[i] = pz[i] + tx[i] * o; bpy[i] = Y[i] + bank[i] * U.clamp(o, -9, 9) + fY[i];
      }
      for (let k = F.a; k <= F.b; k++) {
        const i = st(k), a = st(Math.max(F.a, k - 1)), b = st(Math.min(F.b, k + 1)), dx = bpx[b] - bpx[a], dz = bpz[b] - bpz[a], l = Math.hypot(dx, dz);
        btx[i] = dx / l; btz[i] = dz / l; fCos[i] = btx[i] * tx[i] + btz[i] * tz[i];
      }
    });
  };
  /* which fork (or null) covers arc length s */
  R.forkOf = function (s) { const i = Math.floor(R.wrapS(s) / DS) % N; return fId[i] >= 0 ? FORKS[fId[i]] : null; };

  /* ---------------- natural terrain ---------------- */
  function addHill(i, lat, r, h) { i = wrapI(i); hills.push([px[i] - tz[i] * lat, pz[i] + tx[i] * lat, r, h]); }
  // hero cut at the start (outside of the first left curve), overpass ridge, a deep double cut, plus scattered ones
  for (const k of [-14, 22, 58, 94, 130, 164]) addHill(st(k), 60, 54, 12.5);
  addHill(st(175), -66, 52, 8);
  addHill(SO, 80, 95, 11); addHill(SO, -80, 95, 11);
  for (const k of [1010, 1046, 1082]) { addHill(st(k), 56, 52, 12); addHill(st(k), -56, 52, 11); }
  (function () {
    const r = U.rng(99);
    const inP = (kk, side) => { for (const p of R.pastures) if (p.side === side && kk > p.a - 25 && kk < p.b + 25) return true; return false; };
    for (let k = 330; k < N - 60; k += 96) {
      const kk = k + ((r() * 30) | 0), side = r() < 0.5 ? -1 : 1;
      if (kk > 690 && kk < 790) continue; if (kk > 980 && kk < 1120) continue; if (inP(kk, side)) continue;
      addHill(st(kk), side * (50 + r() * 18), 44 + r() * 28, 9 + r() * 8);
      if (r() < 0.45) addHill(st(kk + 12), -side * (54 + r() * 18), 44 + r() * 26, 8 + r() * 7);
    }
  })();
  const Hbase = (x, z) => 30 * nA.n2(x / 640 + 3.3, z / 640 + 1.1) + 12 * nA.n2(x / 250 + 40, z / 250 + 17) + 4.5 * nA.n2(x / 96 + 80, z / 96 + 3);
  function Hg(x, z) {
    let h = Hbase(x, z) + 0.9 * nC.n2(x / 27, z / 27);
    for (let i = 0; i < hills.length; i++) {
      const hl = hills[i], dx = x - hl[0], dz = z - hl[1], rr = hl[2] * hl[2], d2 = dx * dx + dz * dz;
      if (d2 < rr * 7) h += hl[3] * Math.exp(-d2 / rr);
    }
    return h;
  }
  (function profile() {
    const a = new Float64Array(N), b = new Float64Array(N), Wn = 46;
    for (let i = 0; i < N; i++) a[i] = Hbase(px[i], pz[i]); // the road ignores the designed hills, so it cuts through them
    for (let pass = 0; pass < 2; pass++) {
      let s = 0; for (let k = -Wn; k <= Wn; k++) s += a[wrapI(k)];
      for (let i = 0; i < N; i++) { b[i] = s / (2 * Wn + 1); s += a[wrapI(i + Wn + 1)] - a[wrapI(i - Wn)]; }
      a.set(b);
    }
    Y.set(a);
  })();
  buildForks();

  /* mailbox driveways: pick spots where the roadside is nearly level */
  R.drives = [];
  (function () {
    const want = [[150, -1], [505, 1], [640, -1], [850, -1], [1230, 1], [1390, -1], [1600, -1]];
    for (const [k0, side] of want) {
      for (let k = k0; k < k0 + 70; k++) {
        const i = wrapI(S0 + k), x = px[i] - tz[i] * 15 * side, z = pz[i] + tx[i] * 15 * side;
        if (Math.abs(Hg(x, z) - Y[i]) < 0.9 && Math.abs(curv[i]) < 1 / 300) { R.drives.push({ i, s: i * DS, side }); break; }
      }
    }
  })();

  /* interpolated frame at arc length s */
  R.frame = function (s, o) {
    s = ((s % L) + L) % L;
    const f = s / DS, i0 = Math.floor(f) % N, i1 = (i0 + 1) % N, t = f - Math.floor(f);
    o.x = px[i0] + (px[i1] - px[i0]) * t; o.z = pz[i0] + (pz[i1] - pz[i0]) * t;
    o.y = Y[i0] + (Y[i1] - Y[i0]) * t;
    let ax = tx[i0] + (tx[i1] - tx[i0]) * t, az = tz[i0] + (tz[i1] - tz[i0]) * t; const l = Math.hypot(ax, az);
    o.tx = ax / l; o.tz = az / l; o.rx = -o.tz; o.rz = o.tx; // right normal
    o.bank = bank[i0] + (bank[i1] - bank[i0]) * t;
    o.curv = curv[i0] + (curv[i1] - curv[i0]) * t;
    o.slope = (Y[i1] - Y[i0]) / DS;
    o.i = i0;
    return o;
  };
  /* the same for the side road of a fork (falls back to the main road where there is none) */
  R.frameB = function (s, o) {
    s = ((s % L) + L) % L;
    const f = s / DS, i0 = Math.floor(f) % N, i1 = (i0 + 1) % N, t = f - Math.floor(f);
    if (fOff[i0] === 0 && fOff[i1] === 0) { R.frame(s, o); o.br = 0; return o; }
    o.x = bpx[i0] + (bpx[i1] - bpx[i0]) * t; o.z = bpz[i0] + (bpz[i1] - bpz[i0]) * t; o.y = bpy[i0] + (bpy[i1] - bpy[i0]) * t;
    let ax = btx[i0] + (btx[i1] - btx[i0]) * t, az = btz[i0] + (btz[i1] - btz[i0]) * t; const l = Math.hypot(ax, az);
    o.tx = ax / l; o.tz = az / l; o.rx = -o.tz; o.rz = o.tx;
    o.bank = bank[i0] + (bank[i1] - bank[i0]) * t; o.curv = curv[i0] + (curv[i1] - curv[i0]) * t;
    const seg = Math.hypot(bpx[i1] - bpx[i0], bpz[i1] - bpz[i0]) || DS;
    o.slope = (bpy[i1] - bpy[i0]) / seg; o.stretch = seg / DS; // metres of side road per metre of main-road arc length
    o.i = i0; o.br = 1;
    return o;
  };
  R.frameOn = (s, br, o) => br ? R.frameB(s, o) : (R.frame(s, o), o.br = 0, o.stretch = 1, o);
  const _fq = {};
  /* nearest point on the road network: fills o.i (station), o.s (m), o.d (signed lateral offset from the centre of the NEAREST road, + = right),
     o.br (1 = that road is a fork's side road), o.dm (offset from the main road), o.db (from the side road), o.off (side road centre, 0 = no fork here) */
  R.query = function (x, z, hint, o) {
    let bi = -1, bd = 1e30;
    if (hint >= 0) {
      for (let k = -12; k <= 12; k++) { const i = wrapI(hint + k), dx = x - px[i], dz = z - pz[i], d2 = dx * dx + dz * dz; if (d2 < bd) { bd = d2; bi = i; } }
      if (bd > 80 * 80) bi = -1;
    }
    if (bi < 0) {
      bd = 1e30;
      for (let i = 0; i < N; i += 5) { const dx = x - px[i], dz = z - pz[i], d2 = dx * dx + dz * dz; if (d2 < bd) { bd = d2; bi = i; } }
      const c = bi;
      for (let k = -5; k <= 5; k++) { const i = wrapI(c + k), dx = x - px[i], dz = z - pz[i], d2 = dx * dx + dz * dz; if (d2 < bd) { bd = d2; bi = i; } }
    }
    let u = (x - px[bi]) * tx[bi] + (z - pz[bi]) * tz[bi];
    u = u < -DS ? -DS : u > DS ? DS : u;
    const s = ((bi * DS + u) % L + L) % L;
    R.frame(s, _fq);
    const d = (x - _fq.x) * _fq.rx + (z - _fq.z) * _fq.rz;
    o.i = bi; o.s = s; o.d = d; o.dm = d; o.db = d; o.br = 0; o.off = 0; o.offY = 0;
    if (fId[bi] >= 0) {
      const f = s / DS, i0 = Math.floor(f) % N, i1 = (i0 + 1) % N, t = f - Math.floor(f), of = fOff[i0] + (fOff[i1] - fOff[i0]) * t;
      if (of !== 0) {
        const db = (d - of) * (fCos[i0] + (fCos[i1] - fCos[i0]) * t);
        o.off = of; o.db = db; o.offY = fY[i0] + (fY[i1] - fY[i0]) * t;
        if (Math.abs(db) < Math.abs(d)) { o.d = db; o.br = 1; }
      }
    }
    return o;
  };

  /* river */
  const rv = R.river = { x: px[SB], z: pz[SB], tx: tx[SB], tz: tz[SB], nx: -tz[SB], nz: tx[SB], wy: Y[SB] - 6.4 };
  function riverAcross(along) { return 24 * Math.sin(along / 85) * U.smooth(25, 95, Math.abs(along)); }
  R.riverAcross = riverAcross;
  function riverRD(x, z, o) {
    const ax = x - rv.x, az = z - rv.z, along = ax * rv.nx + az * rv.nz;
    o.along = along; o.rd = Math.abs(ax * rv.tx + az * rv.tz - riverAcross(along));
    return o;
  }
  const _rr = {};
  function riverProfile(x, z) {
    riverRD(x, z, _rr); const rd = _rr.rd, al = Math.abs(_rr.along);
    if (rd > 110 || al > 520) return 1e9;
    let p = rd < 15 ? rv.wy - 1.6 * (1 - (rd / 15) * (rd / 15)) : rv.wy + (rd - 15) * 0.30 + Math.max(0, rd - 42) * 0.3;
    p += Math.max(0, al - 390) * 0.3;
    return p;
  }
  R.riverDist = (x, z) => { riverRD(x, z, _rr); return Math.abs(_rr.along) > 520 ? 999 : _rr.rd; };

  const yOver = R.overY = Y[SO] + 7.1;
  const sOver = SO * DS;

  const _q = {}, _f = {};
  let sClay = 0, sDirt = 0, sCt = 0;
  /* ground shaped by one road: platform, ditch, cut / fill slope back to the natural height hn */
  function shape(x, z, s, d, platY, bnk, hn, uo, seed) {
    const ad = Math.abs(d);
    let h = hn, clay = 0, dirt = 0, ct = 0;
    const plat = platY + bnk * (d < -9 ? -9 : d > 9 ? 9 : d);
    const dH = hn - plat, side = d < 0 ? -1 : 1;
    let b, tw, n1 = 0, cs = 0;
    if (dH > 0) {
      n1 = nB.n2(s * 0.045, side * 7.7 + seed);
      b = 7.7 + n1 * 1.3 + nB.n2(s * 0.21, side * 3.1 + 5 + seed) * 1.0 + nB.n2(s * 0.62, side * 1.3 + 9 + seed) * 0.55;
      if (b < 6.6) b = 6.6;
      // bank style: exposed clay cut (1) or a gentler grass-covered slope (0); the set pieces are always clay
      const ko = R.dS(s, S0 * DS) / DS, kq = ko < 0 ? ko + N : ko;
      cs = U.smooth(0.02, 0.3, nB.n2(s * 0.0042, side * 31.7 + 5.5 + seed));
      if (side > 0 && !seed) cs = Math.max(cs, U.smooth(-55, -35, ko) * U.smooth(215, 195, ko));
      cs = Math.max(cs, U.smooth(120, 80, uo), U.smooth(975, 995, kq) * U.smooth(1125, 1105, kq));
      b += (6.9 - b) * (1 - cs);
      tw = (1.6 + dH * 2.0) * (1 - cs) + (0.9 + dH * (0.52 + 0.24 * n1)) * cs;
    } else { b = 6.2; tw = 2 + (-dH) * 2.3; }
    let t = (ad - b) / tw;
    if (t < 1) {
      t = t < 0 ? 0 : t;
      let p = t * t * (3 - 2 * t);
      if (dH > 0) {
        p += 0.085 * cs * Math.sin(t * Math.PI) * nB.n2(s * 0.3, ad * 0.8 + side * 9);
        p = p < 0 ? 0 : p > 1 ? 1 : p;
        clay = U.smooth(0.9, 2.3, dH) * U.smooth(0.0, 0.07, t) * U.smooth(1.0, 0.94, t) * U.smooth(0.35, 0.65, cs);
        dirt = U.smooth(0.9, 2.3, dH) * U.smooth(0.2, 0.0, t) * 0.9 * cs;
        if (cs < 0.6) dirt = Math.max(dirt, U.smooth(0.2, 0.42, nC.n2(x * 0.085, z * 0.085 + 7)) * 0.8 * (1 - cs) * U.smooth(0, 0.15, t) * U.smooth(1, 0.8, t)); // eroded patches on grass banks
        ct = t;
      }
      h = plat + dH * p;
    }
    h -= 0.42 * U.bump((ad - 6.2) / 1.3) * U.smooth(-1.5, 0.3, dH);
    dirt = Math.max(dirt, U.smooth(6.7, 5.0, ad));
    if (ad < 22) dirt = Math.max(dirt, U.smooth(0.12, 0.34, nC.n2(x * 0.06 + 9, z * 0.06)) * U.smooth(20, 8, ad) * 0.9);
    if (ad < 44 && !seed) for (let k = 0; k < R.drives.length; k++) {
      const dr = R.drives[k]; if (dr.side !== side) continue;
      const u = Math.abs(R.dS(s, dr.s)); if (u < 2.8) dirt = Math.max(dirt, U.smooth(2.8, 1.5, u) * U.smooth(44, 34, ad));
    }
    if (ad < HALF) h -= 0.3 * U.smooth(HALF, HALF - 0.9, ad);
    sClay = clay; sDirt = dirt; sCt = ct;
    return h;
  }
  /* Terrain height at (x,z). info (optional) receives material weights and road-relative coords
     (d: offset from the nearest road, dm: from the main road, br: nearest road is a side road). */
  G.terrain = function (x, z, hint, info) {
    R.query(x, z, hint === undefined ? -1 : hint, _q);
    const dm = _q.dm, adm = Math.abs(dm), s = _q.s, d = _q.d, br = _q.br, qi = _q.i;
    let hn = Hg(x, z);
    const uo = Math.abs(R.dS(s, sOver));
    if (uo < 30 && adm < 200) { // ridge carrying the crossing road
      const w = U.smooth(27, 8, uo) * U.smooth(200, 150, adm);
      hn += (yOver - 0.14 - hn) * w;
    }
    let h = hn, clay = 0, dirt = 0, ct = 0;
    if (_q.off !== 0) {
      const db = _q.db, adb = Math.abs(db), off = _q.off, oy = _q.offY;
      if (adm < 80 || adb < 80) {
        R.frame(s, _f);
        const yM = _f.y, bk = _f.bank;
        const hA = shape(x, z, s, dm, yM, bk, hn, uo, 0), cA = sClay, dA = sDirt, tA = sCt;
        const hB = shape(x, z, s, db, yM + bk * U.clamp(off, -9, 9) + oy, bk, hn, uo, 13.7);
        const w = U.smooth(-4, 4, adm - adb); // 1 = the side road shapes this spot
        h = hA + (hB - hA) * w; clay = cA + (sClay - cA) * w; dirt = dA + (sDirt - dA) * w; ct = w > 0.5 ? sCt : tA;
      }
    } else if (adm < 80) {
      R.frame(s, _f);
      h = shape(x, z, s, dm, _f.y, _f.bank, hn, uo, 0); clay = sClay; dirt = sDirt; ct = sCt;
    }
    const rp = riverProfile(x, z);
    if (rp < h + 3) {
      if (rp < h) { h = rp; clay = 0; }
      dirt = Math.max(dirt, U.smooth(rv.wy + 1.6, rv.wy + 0.2, h));
    }
    if (info) { info.clay = clay; info.dirt = dirt; info.ct = ct; info.d = d; info.dm = dm; info.br = br; info.s = s; info.i = qi; info.hn = hn; }
    return h;
  };
  /* forest presence (0..1) */
  G.forest = function (x, z, s, d) { // d: offset from the main road (info.dm)
    const ad = Math.abs(d);
    let m = 1;
    const pw = R.pastureW(s, d < 0 ? -1 : 1);
    if (pw > 0) m *= 1 - pw * U.smooth(250 + 30 * nC.n2(x * 0.01, z * 0.01), 215, ad);
    const rd = R.riverDist(x, z); if (rd < 46) m *= U.smooth(30, 44, rd);
    const uo = Math.abs(R.dS(s, sOver)); if (uo < 20) m *= U.smooth(7, 13, uo);
    return m;
  };
  /* 0..1: how solid the forest is here. Past ~65 m from the roads the trees are no longer single models but one closed canopy, and nothing drives into that */
  const _cq = {};
  G.canopy = function (x, z, hint) {
    R.query(x, z, hint === undefined ? -1 : hint, _cq);
    const a = Math.abs(_cq.d); if (a < 61) return 0;
    return U.smooth(61, 79, a) * G.forest(x, z, _cq.s, _cq.dm); // (the canopy mesh has 10 m cells: it starts to rise up to 10 m before the 72 m line it is built from)
  };
  /* drivable surface: road ribbon / bridge deck / terrain */
  const _sq = {}, _sf = {};
  G.surface = function (x, z, hint, o) {
    R.query(x, z, hint, _sq);
    const ad = Math.abs(_sq.d);
    o.i = _sq.i; o.s = _sq.s; o.d = _sq.d; o.dm = _sq.dm; o.br = _sq.br;
    if (ad <= HALF + 0.02 || (R.onBridge(_sq.s) && ad < 4.95)) {
      R.frame(_sq.s, _sf); o.road = true;
      o.y = _sq.br ? _sf.y + _sf.bank * U.clamp(_sq.off, -9, 9) + _sq.offY + _sf.bank * _sq.d : _sf.y + _sf.bank * _sq.d;
    } else { o.y = G.terrain(x, z, _sq.i); o.road = false; }
    return o;
  };

  /* bridge span: stations where the river valley drops below the road */
  (function () {
    let a = 0, b = 0;
    while (a > -90 && riverProfile(px[wrapI(SB + a - 1)], pz[wrapI(SB + a - 1)]) < Y[wrapI(SB + a - 1)] - 0.5) a--;
    while (b < 90 && riverProfile(px[wrapI(SB + b + 1)], pz[wrapI(SB + b + 1)]) < Y[wrapI(SB + b + 1)] - 0.5) b++;
    R.bridge = { i0: wrapI(SB + a - 1), n: b - a + 2, s0: wrapI(SB + a - 1) * DS, len: (b - a + 2) * DS };
  })();
  R.onBridge = s => { const u = R.dS(s, R.bridge.s0); return u >= -0.5 && u <= R.bridge.len + 0.5; };

  /* ---------------- materials ---------------- */
  function terrainMaterial(tx_) {
    const m = new THREE.MeshStandardMaterial({ roughness: 1, metalness: 0, color: 0xffffff });
    m.customProgramCacheKey = () => 'terrain';
    m.onBeforeCompile = sh => {
      sh.uniforms.tGrass = { value: tx_.grass }; sh.uniforms.tDirt = { value: tx_.dirt };
      sh.uniforms.tClay = { value: tx_.clay.map }; sh.uniforms.tClayH = { value: tx_.clay.height };
      sh.uniforms.tCanopy = { value: tx_.canopy }; sh.uniforms.tNoise = { value: tx_.noise };
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nattribute vec4 aW;\nattribute vec2 aUv;\nvarying vec4 vW;\nvarying vec3 vWp;\nvarying vec2 vCu;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvW = aW; vWp = position; vCu = aUv;');
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>
uniform sampler2D tGrass; uniform sampler2D tDirt; uniform sampler2D tClay; uniform sampler2D tClayH; uniform sampler2D tCanopy; uniform sampler2D tNoise;
varying vec4 vW; varying vec3 vWp; varying vec2 vCu;`)
        .replace('#include <map_fragment>', `
vec2 gUv = vWp.xz;
vec3 nzA = texture2D(tNoise, gUv * 0.0117).rgb;
vec3 nzB = texture2D(tNoise, gUv * 0.093).rgb;
float nzC = texture2D(tNoise, gUv * 0.0031).b;
vec3 grassC = texture2D(tGrass, gUv * 0.19).rgb;
grassC = mix(grassC, texture2D(tGrass, gUv * 0.047 + 0.37).rgb, 0.45);
grassC *= 0.62 + 0.5 * nzA.r;
grassC = mix(grassC, grassC * vec3(1.4, 1.22, 0.74), smoothstep(0.42, 0.72, nzC * 0.6 + nzA.g * 0.4));
grassC *= vec3(0.86, 0.84, 0.66);
vec3 dirtC = texture2D(tDirt, gUv * 0.23).rgb * (0.66 + 0.36 * nzA.g);
dirtC = mix(vec3(dot(dirtC, vec3(0.35, 0.5, 0.15))), dirtC, 0.72 + 0.28 * vW.x);
vec2 cUv = vCu * 0.085;
vec3 clayC = texture2D(tClay, cUv).rgb;
clayC = mix(clayC, texture2D(tClay, cUv / 3.0 + 0.43).rgb, 0.45);
float cHgt = texture2D(tClayH, cUv).r;
float ct = vW.w + (nzB.b - 0.5) * 0.16;
// zoning: dark topsoil at the rim, saturated red body, paler washed-out foot; dark runoff streaks fade downward
clayC *= (0.76 + 0.5 * nzA.r) * vec3(1.05, 0.98, 0.94);
clayC = mix(clayC, clayC * vec3(1.22, 1.16, 1.08) + vec3(0.03, 0.022, 0.012), smoothstep(0.42, 0.05, ct) * 0.75);
clayC *= mix(1.0, 0.52, smoothstep(0.80, 0.97, ct));
clayC *= 1.0 - (1.0 - smoothstep(0.25, 0.75, cHgt)) * (0.16 + 0.42 * smoothstep(0.1, 0.9, ct)) * (0.45 + 0.9 * nzA.b);
clayC = mix(vec3(dot(clayC, vec3(0.3, 0.5, 0.2))), clayC, 0.8) * vec3(0.98, 0.97, 0.95);
float wc = smoothstep(0.3, 0.62, vW.x + (nzB.g - 0.5) * 0.55);
float wd = smoothstep(0.3, 0.7, vW.y + (nzB.r - 0.5) * 0.9);
vec3 tcol = mix(grassC, dirtC, wd);
tcol = mix(tcol, clayC, wc);
vec3 canC = texture2D(tCanopy, gUv * 0.0205).rgb;
canC = mix(canC, texture2D(tCanopy, gUv * 0.0067 + 0.21).rgb, 0.35) * (0.7 + 0.6 * nzA.r) * vec3(0.74, 0.76, 0.6);
tcol = mix(tcol, canC, smoothstep(0.25, 0.7, vW.z));
float dFade = smoothstep( 55.0, 6.0, length( vViewPosition ) );
float dtl = texture2D( tNoise, gUv * 1.9 ).g * 0.6 + texture2D( tNoise, gUv * 0.61 + 0.3 ).r * 0.4;
tcol *= mix( 1.0, 0.72 + 0.56 * dtl, dFade * ( 1.0 - 0.5 * wc ) );
float gHgt = dtl * 0.035 * dFade * ( 1.0 - wc );
diffuseColor.rgb *= tcol;`)
        .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
{
  vec2 dSx = dFdx(cUv), dSy = dFdy(cUv);
  vec2 dHb = vec2(texture2D(tClayH, cUv + dSx).r - cHgt, texture2D(tClayH, cUv + dSy).r - cHgt) * (0.42 * wc) + vec2(dFdx(gHgt), dFdy(gHgt));
  vec3 sX = dFdx(-vViewPosition), sY = dFdy(-vViewPosition);
  vec3 r1 = cross(sY, normal), r2 = cross(normal, sX);
  float fDet = dot(sX, r1) * faceDirection;
  vec3 pn = abs(fDet) * normal - sign(fDet) * (dHb.x * r1 + dHb.y * r2);
  if (dot(pn, pn) > 1e-14) normal = normalize(pn);
}`);
    };
    return m;
  }

  /* ---------------- build ---------------- */
  G.buildWorld = function (scene, tex, env) {
    const mats = G.mats = {};
    mats.terrain = terrainMaterial(tex);
    const group = new THREE.Group(); scene.add(group);
    const info = {};

    /* ---- corridor: road-aligned terrain strip ---- */
    const sideRows = [4.3, 5.0, 5.7, 6.3, 6.9, 7.5, 8.1, 8.7, 9.3, 9.9, 10.5, 11.1, 11.8, 12.6, 13.6, 14.9, 16.6, 19, 22, 26, 31, 37, 44];
    const rows = [];
    for (let j = sideRows.length - 1; j >= 0; j--) rows.push(-sideRows[j]);
    rows.push(-2.2, 0, 2.2);
    for (const v of sideRows) rows.push(v);
    const NR = rows.length;
    R.cutL = new Float32Array(N); R.cutR = new Float32Array(N);
    const a3 = new THREE.Vector3(), b3 = new THREE.Vector3();
    /* where a fork is open the ground is split between the two roads along a line between them (pm, measured from the main road);
       each strip stops there, so the main strip and the side-road strip tile the ground without overlapping */
    const partition = of => Math.abs(of) / 2 + 44 * (1 - U.smooth(0, 16, Math.abs(of)));
    function strip(list, cyc, isB) {
      const n = list.length, p = new Float32Array(n * NR * 3), w = new Float32Array(n * NR * 4), nm = new Float32Array(n * NR * 3), u = new Float32Array(n * NR * 2);
      for (let a = 0; a < n; a++) {
        const i = list[a], rx = -tz[i], rz = tx[i], of = fOff[i], sg = of < 0 ? -1 : 1, pm = partition(of);
        for (let j = 0; j < NR; j++) {
          let d = rows[j], clamped = false; const k = a * NR + j;
          if (isB) { d += of; if (sg * d < pm) { d = sg * pm; clamped = true; } }
          else if (of !== 0 && sg * d > pm) { d = sg * pm; clamped = true; }
          const x = px[i] + rx * d, z = pz[i] + rz * d;
          let h = G.terrain(x, z, i, info);
          if ((j === 0 || j === NR - 1) && !clamped) h -= 3.2;
          p[k * 3] = x; p[k * 3 + 1] = h; p[k * 3 + 2] = z;
          w[k * 4] = info.clay; w[k * 4 + 1] = info.dirt; w[k * 4 + 2] = 0; w[k * 4 + 3] = info.ct;
          u[k * 2] = i * DS; u[k * 2 + 1] = h;
          if (!isB) { if (rows[j] === -14.9) R.cutL[i] = h - Y[i]; if (rows[j] === 14.9) R.cutR[i] = h - Y[i]; }
        }
      }
      const same = (k1, k2) => Math.abs(p[k1 * 3] - p[k2 * 3]) + Math.abs(p[k1 * 3 + 2] - p[k2 * 3 + 2]) < 1e-4;
      for (let a = 0; a < n; a++) for (let j = 0; j < NR; j++) {
        const k = a * NR + j, ia = (cyc ? (a + n - 1) % n : Math.max(0, a - 1)) * NR + j, ib = (cyc ? (a + 1) % n : Math.min(n - 1, a + 1)) * NR + j;
        let ja = Math.max(0, j - 1), jb = Math.min(NR - 1, j + 1);
        while (ja > 0 && same(a * NR + ja, k)) ja--; while (jb < NR - 1 && same(a * NR + jb, k)) jb++; // rows folded onto the partition line
        ja += a * NR; jb += a * NR;
        a3.set(p[jb * 3] - p[ja * 3], p[jb * 3 + 1] - p[ja * 3 + 1], p[jb * 3 + 2] - p[ja * 3 + 2]);
        b3.set(p[ib * 3] - p[ia * 3], p[ib * 3 + 1] - p[ia * 3 + 1], p[ib * 3 + 2] - p[ia * 3 + 2]);
        a3.cross(b3); if (a3.lengthSq() < 1e-10) a3.set(0, 1, 0); a3.normalize();
        nm[k * 3] = a3.x; nm[k * 3 + 1] = a3.y; nm[k * 3 + 2] = a3.z;
      }
      return { p, w, n: nm, u };
    }
    const stripMesh = (S, a0, ns, v0) => {
      const nv = ns * NR, p = S.p.slice(a0 * NR * 3, (a0 + ns) * NR * 3), n = S.n.slice(a0 * NR * 3, (a0 + ns) * NR * 3), w = S.w.slice(a0 * NR * 4, (a0 + ns) * NR * 4), u = S.u.slice(a0 * NR * 2, (a0 + ns) * NR * 2);
      if (v0 !== undefined) for (let a = 0; a < ns; a++) for (let j = 0; j < NR; j++) u[(a * NR + j) * 2] = (v0 + a) * DS; // keeps the clay texture continuous over the loop seam
      const idx = new Uint16Array((ns - 1) * (NR - 1) * 6); let io = 0;
      for (let a = 0; a < ns - 1; a++) for (let j = 0; j < NR - 1; j++) {
        const q0 = a * NR + j, q1 = q0 + 1, q2 = q0 + NR, q3 = q2 + 1;
        idx[io++] = q0; idx[io++] = q1; idx[io++] = q2; idx[io++] = q1; idx[io++] = q3; idx[io++] = q2;
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(p, 3)); g.setAttribute('normal', new THREE.BufferAttribute(n, 3));
      g.setAttribute('aW', new THREE.BufferAttribute(w, 4)); g.setAttribute('aUv', new THREE.BufferAttribute(u, 2));
      g.setIndex(new THREE.BufferAttribute(idx, 1));
      const m = new THREE.Mesh(g, mats.terrain); m.receiveShadow = true; m.castShadow = true; m.matrixAutoUpdate = false;
      group.add(m); return m;
    };
    const all = []; for (let i = 0; i <= N; i++) all.push(wrapI(i));
    const SM = strip(all, false, false);
    // the list repeats station 0 at the end: make the seam normals agree
    for (let j = 0; j < NR; j++) for (let c = 0; c < 3; c++) { const v = SM.n[j * 3 + c] + SM.n[(N * NR + j) * 3 + c]; SM.n[j * 3 + c] = SM.n[(N * NR + j) * 3 + c] = v * 0.5; }
    const CH = 30;
    G.chunks = [];
    for (let c0 = 0; c0 < N; c0 += CH) {
      const m = stripMesh(SM, c0, CH + 1, c0);
      const mid = wrapI(c0 + CH / 2);
      G.chunks.push({ i0: c0, n: CH, cx: px[mid], cz: pz[mid], cy: Y[mid], terrain: m, objs: [], hi: [], lo: [], near: [] });
    }
    for (const F of FORKS) {
      const list = []; for (let k = 0; k <= F.n; k++) list.push(wrapI(F.i0 + k));
      const SB_ = strip(list, false, true);
      for (let a0 = 0; a0 < F.n; a0 += 60) stripMesh(SB_, a0, Math.min(61, F.n + 1 - a0));
    }
    G.CH = CH;

    /* ---- far terrain grid with forest canopy ---- */
    (function far() {
      let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
      for (let i = 0; i < N; i++) { x0 = Math.min(x0, px[i]); x1 = Math.max(x1, px[i]); z0 = Math.min(z0, pz[i]); z1 = Math.max(z1, pz[i]); }
      const C = 10, M = 950;
      x0 = Math.floor((x0 - M) / C) * C; z0 = Math.floor((z0 - M) / C) * C;
      const GX = Math.ceil((x1 + M - x0) / C), GZ = Math.ceil((z1 + M - z0) / C);
      R.bounds = { x0, z0, x1: x0 + GX * C, z1: z0 + GZ * C };
      const hh = new Float32Array((GX + 1) * (GZ + 1)), ww = new Float32Array((GX + 1) * (GZ + 1) * 3), ad = new Float32Array((GX + 1) * (GZ + 1));
      for (let j = 0; j <= GZ; j++) for (let i = 0; i <= GX; i++) {
        const x = x0 + i * C, z = z0 + j * C, k = j * (GX + 1) + i;
        let h = G.terrain(x, z, -1, info);
        const a = Math.abs(info.d); ad[k] = a;
        const can = U.smooth(72, 90, a) * G.forest(x, z, info.s, info.dm);
        h += can * (12.5 + 3.2 * nC.n2(x * 0.021, z * 0.021) + 2.6 * nB.n2(x * 0.09, z * 0.09));
        h -= 8 * U.smooth(36, 27, a);
        // sink the outer rim so the horizon hills take over
        const e = Math.min(i, GX - i, j, GZ - j) * C; if (e < 150) h -= (150 - e) * 0.25;
        hh[k] = h; ww[k * 3] = 0; ww[k * 3 + 1] = info.dirt * (1 - can); ww[k * 3 + 2] = can;
      }
      const TS = 40;
      for (let tj = 0; tj < GZ; tj += TS) for (let ti = 0; ti < GX; ti += TS) {
        const nx = Math.min(TS, GX - ti), nz = Math.min(TS, GZ - tj), nv = (nx + 1) * (nz + 1);
        const p = new Float32Array(nv * 3), n = new Float32Array(nv * 3), w = new Float32Array(nv * 4), u = new Float32Array(nv * 2);
        const idx = []; let any = false;
        for (let b = 0; b <= nz; b++) for (let a = 0; a <= nx; a++) {
          const i = ti + a, j = tj + b, k = j * (GX + 1) + i, v = b * (nx + 1) + a;
          p[v * 3] = x0 + i * C; p[v * 3 + 1] = hh[k]; p[v * 3 + 2] = z0 + j * C;
          const hl = hh[j * (GX + 1) + Math.max(0, i - 1)], hr = hh[j * (GX + 1) + Math.min(GX, i + 1)], hd = hh[Math.max(0, j - 1) * (GX + 1) + i], hu = hh[Math.min(GZ, j + 1) * (GX + 1) + i];
          a3.set(hl - hr, 2 * C, hd - hu).normalize();
          n[v * 3] = a3.x; n[v * 3 + 1] = a3.y; n[v * 3 + 2] = a3.z;
          w[v * 4] = 0; w[v * 4 + 1] = ww[k * 3 + 1]; w[v * 4 + 2] = ww[k * 3 + 2]; w[v * 4 + 3] = 0;
        }
        for (let b = 0; b < nz; b++) for (let a = 0; a < nx; a++) {
          const i = ti + a, j = tj + b, k = j * (GX + 1) + i;
          if (ad[k] < 22 && ad[k + 1] < 22 && ad[k + GX + 1] < 22 && ad[k + GX + 2] < 22) continue;
          const v0 = b * (nx + 1) + a, v1 = v0 + 1, v2 = v0 + nx + 1, v3 = v2 + 1;
          idx.push(v0, v2, v1, v1, v2, v3); any = true;
        }
        if (!any) continue;
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(p, 3)); g.setAttribute('normal', new THREE.BufferAttribute(n, 3));
        g.setAttribute('aW', new THREE.BufferAttribute(w, 4)); g.setAttribute('aUv', new THREE.BufferAttribute(u, 2));
        g.setIndex(idx);
        const m = new THREE.Mesh(g, mats.terrain); m.receiveShadow = true; m.matrixAutoUpdate = false;
        group.add(m);
      }
    })();

    /* ---- road ribbon ---- */
    const TILE = L / 105;
    tex.roadBump.repeat.set(9, 34);
    mats.road = new THREE.MeshStandardMaterial({ map: tex.road.map, roughnessMap: tex.road.rough, roughness: 0.94, metalness: 0, bumpMap: tex.roadBump, bumpScale: 1.4, envMap: env, envMapIntensity: 0.5 });
    mats.road.onBeforeCompile = sh => {
      sh.uniforms.tNoise = { value: tex.noise };
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWp;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvWp = position;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform sampler2D tNoise;\nvarying vec3 vWp;')
        .replace('#include <map_fragment>', `#include <map_fragment>
vec3 rn = texture2D(tNoise, vWp.xz * 0.0083).rgb;
vec3 rn2 = texture2D(tNoise, vWp.xz * 0.041).rgb;
diffuseColor.rgb *= (0.74 + 0.36 * rn.r + 0.2 * (rn2.g - 0.5)) * mix(vec3(1.0), vec3(1.07, 1.0, 0.92), rn.b);
float rFade = smoothstep( 40.0, 4.0, length( vViewPosition ) );
float rd = texture2D( tNoise, vWp.xz * 3.1 ).g * 0.55 + texture2D( tNoise, vWp.xz * 9.7 + 0.2 ).r * 0.45;
diffuseColor.rgb *= mix( 1.0, 0.8 + 0.4 * rd, rFade ) * vec3( 1.2, 1.17, 1.1 );`);
    };
    mats.road.customProgramCacheKey = () => 'road';
    G.dynRefl(mats.road, 0.0, 0.3, 3.4, 0, 6.5); // low-angle sheen: hot asphalt mirrors the sky and the scenery ahead
    const frames = [];
    for (let i = 0; i <= N; i++) { const k = wrapI(i); frames.push({ x: px[k], y: Y[k], z: pz[k], rx: -tz[k], rz: tx[k], bank: bank[k], v: i * DS / TILE }); }
    const rg = U.sweep(frames, [[-HALF, 0], [0, 0], [HALF, 0]], { uNorm: true });
    const road = new THREE.Mesh(rg, mats.road); road.receiveShadow = true; road.matrixAutoUpdate = false; road.frustumCulled = false;
    group.add(road);
    G.roadMesh = road;
    for (const F of FORKS) { // the side road slips out from under the main one, 2.5 cm lower while they overlap
      const fr = [];
      for (let k = 0; k <= F.n; k++) {
        const i = wrapI(F.i0 + k), ao = Math.abs(fOff[i]); if (ao < 0.4) continue;
        fr.push({ x: bpx[i], y: bpy[i] - 0.025 * U.smooth(2 * HALF + 1.5, 2 * HALF - 0.5, ao), z: bpz[i], rx: -btz[i], rz: btx[i], bank: bank[i], v: (F.i0 + k) * DS / TILE });
      }
      const m = new THREE.Mesh(U.sweep(fr, [[-HALF, 0], [0, 0], [HALF, 0]], { uNorm: true }), mats.road); m.receiveShadow = true; m.matrixAutoUpdate = false; m.frustumCulled = false;
      group.add(m);
    }

    /* repair patch decals */
    (function patches() {
      const rnd = U.rng(444), geos = [], f = {};
      for (let n = 0; n < 24; n++) {
        const s0 = rnd() * L, len = 5 + rnd() * 16, lane = rnd() < 0.5 ? -1 : 1, d0 = lane * (0.45 + rnd() * 0.8), d1 = d0 + lane * (1.6 + rnd() * 1.6);
        const fr = [];
        for (let u = 0; u <= len + 0.01; u += 1) { R.frame(s0 + u, f); fr.push({ x: f.x, y: f.y + 0.012, z: f.z, rx: f.rx, rz: f.rz, bank: f.bank, v: u / len }); }
        geos.push(U.sweep(fr, [[Math.min(d0, d1), 0], [Math.max(d0, d1), 0]], { uNorm: true }));
      }
      const g = U.merge(geos);
      mats.patch = new THREE.MeshStandardMaterial({ map: tex.patch, transparent: true, roughness: 0.93, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, envMap: env, envMapIntensity: 0.5 });
      G.dynRefl(mats.patch, 0.0, 0.3, 3.4, 0, 6.5);
      const m = new THREE.Mesh(g, mats.patch); m.receiveShadow = true; m.matrixAutoUpdate = false; m.frustumCulled = false; m.renderOrder = 1;
      group.add(m);
    })();

    /* ---- river water ---- */
    (function water() {
      const fr = [];
      for (let al = -470; al <= 470; al += 6) {
        const ac = riverAcross(al), ac2 = riverAcross(al + 1), dx = rv.nx + rv.tx * (ac2 - ac), dz = rv.nz + rv.tz * (ac2 - ac), l = Math.hypot(dx, dz);
        fr.push({ x: rv.x + rv.nx * al + rv.tx * ac, y: rv.wy, z: rv.z + rv.nz * al + rv.tz * ac, rx: -dz / l, rz: dx / l, v: al / 12 });
      }
      const g = U.sweep(fr, [[-21, 0], [21, 0]], { uScale: 1 / 26, vScale: 12 / 26 });
      tex.waterN.repeat.set(1, 1);
      mats.water = new THREE.MeshStandardMaterial({ color: 0x2b3322, roughness: 0.1, metalness: 0.0, normalMap: tex.waterN, normalScale: new THREE.Vector2(0.22, 0.22), envMap: env, envMapIntensity: 0.7 });
      G.dynRefl(mats.water, 0.03, 1.0, 1.2);
      const m = new THREE.Mesh(g, mats.water); m.receiveShadow = true; m.matrixAutoUpdate = false;
      group.add(m);
    })();

    return group;
  };
})();
