'use strict';
/* Traffic vehicles: clean lofted bodies (sedan, pickup, van) with a glass greenhouse, real wheel arches,
   flush lights and proper wheels. Vehicle space: +Z forward, +Y up. */
(function () {
  const U = G.U;
  function spline(keys) {
    const n = keys.length, m = new Array(n);
    for (let k = 0; k < n; k++) { const a = keys[Math.max(0, k - 1)], b = keys[Math.min(n - 1, k + 1)]; m[k] = (b[1] - a[1]) / ((b[0] - a[0]) || 1); }
    return function (x) {
      if (x <= keys[0][0]) return keys[0][1];
      if (x >= keys[n - 1][0]) return keys[n - 1][1];
      let k = 0; while (keys[k + 1][0] < x) k++;
      const x0 = keys[k][0], x1 = keys[k + 1][0], h = x1 - x0, t = (x - x0) / h, t2 = t * t, t3 = t2 * t;
      return (2 * t3 - 3 * t2 + 1) * keys[k][1] + (t3 - 2 * t2 + t) * h * m[k] + (-2 * t3 + 3 * t2) * keys[k + 1][1] + (t3 - t2) * h * m[k + 1];
    };
  }
  const SPECS = {
    sedan: {
      L0: -2.4, L1: 2.4, zf: 1.46, zr: -1.4, wr: 0.33, ra: 0.385, crown: 0.05,
      W: [[-2.4, 0.76], [-2.32, 0.85], [-2.0, 0.905], [0, 0.925], [1.8, 0.905], [2.28, 0.84], [2.4, 0.74]],
      bot: [[-2.4, 0.42], [-2.2, 0.3], [-1.9, 0.21], [1.95, 0.21], [2.25, 0.3], [2.4, 0.4]],
      belt: [[-2.4, 0.86], [-2.2, 0.93], [-1.5, 0.955], [0, 0.94], [1.0, 0.91], [1.9, 0.82], [2.3, 0.72], [2.4, 0.66]],
      green: { z0: -1.78, zr0: -1.02, zr1: 0.3, z1: 1.08, roofY: 1.43, inset: 0.15, pillars: [-0.28, -1.0], glass: [-1.3, 0.86], rear: true },
      grille: [0.9, 0.12, 0.52], lampF: [0.34, 0.1, 0.72], lampR: [0.36, 0.1, 0.74],
    },
    pickup: {
      L0: -2.85, L1: 2.8, zf: 1.85, zr: -1.75, wr: 0.4, ra: 0.47, crown: 0.045,
      W: [[-2.85, 0.9], [-2.78, 0.965], [-2.4, 0.985], [0, 0.99], [2.2, 0.98], [2.7, 0.93], [2.8, 0.86]],
      bot: [[-2.85, 0.5], [-2.5, 0.4], [2.4, 0.4], [2.65, 0.46], [2.8, 0.55]],
      belt: [[-2.85, 1.2], [-0.8, 1.2], [1.2, 1.2], [2.3, 1.15], [2.7, 1.06], [2.8, 0.98]],
      green: { z0: -0.74, zr0: -0.5, zr1: 0.68, z1: 1.3, roofY: 1.85, inset: 0.12, pillars: [0.06], glass: [-0.52, 1.1], rear: true },
      bed: { z0: -2.74, z1: -0.82, depth: 0.42 },
      grille: [1.2, 0.3, 0.86], lampF: [0.3, 0.2, 0.92], lampR: [0.14, 0.34, 0.95],
    },
    van: {
      L0: -2.6, L1: 2.6, zf: 1.72, zr: -1.6, wr: 0.36, ra: 0.43, crown: 0.03,
      W: [[-2.6, 0.9], [-2.52, 0.965], [-2.2, 0.985], [1.9, 0.985], [2.45, 0.93], [2.6, 0.84]],
      bot: [[-2.6, 0.44], [-2.3, 0.34], [2.2, 0.34], [2.45, 0.4], [2.6, 0.5]],
      belt: [[-2.6, 1.22], [1.5, 1.22], [2.1, 1.1], [2.45, 0.98], [2.6, 0.86]],
      green: { z0: -2.58, zr0: -2.38, zr1: 1.42, z1: 2.16, roofY: 2.04, inset: 0.09, pillars: [0.82], glass: [0.9, 1.86], rear: false },
      grille: [1.1, 0.16, 0.6], lampF: [0.3, 0.16, 0.78], lampR: [0.13, 0.42, 1.0],
    },
  };
  let shared = null;
  G.buildTrafficCar = function (type, color, env) {
    const sp = SPECS[type], gr = sp.green, bed = sp.bed;
    const fW = spline(sp.W), fBot = spline(sp.bot), fBelt = spline(sp.belt);
    if (!shared) {
      shared = {
        glass: G.dynRefl(new THREE.MeshStandardMaterial({ color: 0x0b1014, roughness: 0.05, metalness: 0.85, envMap: env, envMapIntensity: 0.9 }), 0.09, 1.15, 0.4),
        black: new THREE.MeshStandardMaterial({ color: 0x0d0d0e, roughness: 0.62, metalness: 0.1, envMap: env, envMapIntensity: 0.4 }),
        tire: new THREE.MeshStandardMaterial({ color: 0x0c0c0d, roughness: 0.88, envMap: env, envMapIntensity: 0.3, side: THREE.DoubleSide }),
        rim: new THREE.MeshStandardMaterial({ color: 0x15161a, roughness: 0.5, metalness: 0.8, envMap: env, envMapIntensity: 0.5, side: THREE.DoubleSide }),
        face: G.dynRefl(new THREE.MeshStandardMaterial({ color: 0xa4a8ac, roughness: 0.28, metalness: 0.95, envMap: env, envMapIntensity: 0.8 }), 0.4, 0.7, 2.0),
        head: G.dynRefl(new THREE.MeshStandardMaterial({ color: 0xc4ccd4, emissive: 0xfff0d8, emissiveIntensity: 0.25, roughness: 0.08, metalness: 0.8, envMap: env, envMapIntensity: 1.2 }), 0.4, 0.9, 0.8),
        tail: new THREE.MeshStandardMaterial({ color: 0x4a0407, emissive: 0xff1a0a, emissiveIntensity: 0.45, roughness: 0.25, envMap: env }),
        wheel: G.wheelGeo(),
      };
    }
    const paintM = G.dynRefl(new THREE.MeshStandardMaterial({ color, roughness: 0.34, metalness: 0.5, envMap: env, envMapIntensity: 0.55 }), 0.05, 1.0, 0.9);
    const paint = [], black = [], glass = [];
    const tri = (list, a, b, c) => list.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
    const inBed = z => bed && z > bed.z0 && z < bed.z1;
    /* ---- lower body ---- */
    const KS = 9, K = 12;
    const section = (z, arch, isBed) => {
      const w = fW(z), yb = fBot(z), ys = fBelt(z), p = [];
      p.push([0, yb], [0.55 * w, yb], [w - 0.07, yb], [w - 0.03, yb + 0.03], [w - 0.008, yb + 0.1], [w, yb + (ys - yb) * 0.55], [w - 0.006, ys - 0.1], [w - 0.03, ys - 0.03], [w - 0.075, ys]);
      if (arch > 0) for (const q of p) if (q[1] < arch) q[1] = arch;
      if (isBed) p.push([w - 0.135, ys], [w - 0.145, ys - bed.depth], [0, ys - bed.depth]);
      else { const under = z < gr.z1 && z > gr.z0 ? 0.25 : 1, c = sp.crown * under; p.push([(w - 0.075) * 0.72, ys + c * 0.62], [(w - 0.075) * 0.36, ys + c * 0.94], [0, ys + c]); }
      return p;
    };
    const stn = [];
    for (const z of [sp.L0, sp.L0 + 0.025, sp.L0 + 0.08, sp.L1 - 0.08, sp.L1 - 0.025, sp.L1]) stn.push({ z, arch: 0 });
    const hw = Math.sqrt(sp.ra * sp.ra - Math.pow(sp.wr - fBot(0), 2)) - 0.012;
    for (const za of [sp.zf, sp.zr]) {
      stn.push({ z: za - hw - 0.003, arch: 0 }, { z: za + hw + 0.003, arch: 0 });
      for (let k = 0; k <= 12; k++) { const dz = -hw * Math.cos(Math.PI * k / 12); stn.push({ z: za + dz, arch: sp.wr + Math.sqrt(sp.ra * sp.ra - dz * dz) }); }
    }
    if (bed) for (const z of [bed.z0 - 0.004, bed.z0 + 0.004, bed.z1 - 0.004, bed.z1 + 0.004]) stn.push({ z, arch: 0 });
    const special = stn.slice();
    for (let z = sp.L0 + 0.2; z < sp.L1 - 0.15; z += 0.13) {
      let ok = true; for (const s of special) if (Math.abs(s.z - z) < 0.045) ok = false;
      if (Math.abs(z - sp.zf) < hw + 0.01 || Math.abs(z - sp.zr) < hw + 0.01) ok = false;
      if (ok) stn.push({ z, arch: 0 });
    }
    stn.sort((a, b) => a.z - b.z);
    const RING = 2 * K - 2;
    const rings = stn.map(s => { const h = section(s.z, s.arch, inBed(s.z)), r = []; for (let j = 0; j < K; j++) r.push([h[j][0], h[j][1], s.z]); for (let j = K - 2; j >= 1; j--) r.push([-h[j][0], h[j][1], s.z]); return r; });
    for (let i = 0; i < stn.length - 1; i++) for (let j = 0; j < RING; j++) {
      const j2 = (j + 1) % RING, a = rings[i][j], b = rings[i][j2], c = rings[i + 1][j], d = rings[i + 1][j2], jj = j < K - 1 ? j : RING - 1 - j;
      const well = jj <= 2 && (stn[i].arch > 0 || stn[i + 1].arch > 0), bd = jj >= KS && (inBed(stn[i].z) || inBed(stn[i + 1].z));
      const l = well || bd ? black : paint; tri(l, a, b, c); tri(l, b, d, c);
    }
    const cap = (i, flip) => { const r = rings[i]; let cy = 0; for (const p of r) cy += p[1]; cy /= r.length; const c = [0, cy, r[0][2]]; for (let j = 0; j < RING; j++) { const a = r[j], b = r[(j + 1) % RING]; if (flip) tri(paint, c, b, a); else tri(paint, c, a, b); } };
    cap(0, true); cap(stn.length - 1, false);
    /* ---- greenhouse ---- */
    const hAt = z => {
      let t = z >= gr.z1 || z <= gr.z0 ? 0 : z > gr.zr1 ? (gr.z1 - z) / (gr.z1 - gr.zr1) : z < gr.zr0 ? (z - gr.z0) / (gr.zr0 - gr.z0) : 1;
      return Math.pow(t, 0.9);
    };
    const gz = [gr.z0, gr.zr0, gr.zr1, gr.z1, gr.glass[0], gr.glass[1]];
    for (const p of gr.pillars) gz.push(p - 0.045, p + 0.045);
    const gsp = gz.slice();
    for (let z = gr.z0 + 0.1; z < gr.z1 - 0.06; z += 0.12) { let ok = true; for (const s of gsp) if (Math.abs(s - z) < 0.04) ok = false; if (ok) gz.push(z); }
    gz.sort((a, b) => a - b);
    const grow = gz.map(z => {
      const h = hAt(z), yb0 = fBelt(z) - 0.006, yr = yb0 + (gr.roofY - yb0) * h, wb = fW(z) - 0.082, wt = wb - gr.inset * h;
      const half = [[wb, yb0], [wt, yb0 + (yr - yb0) * 0.8], [wt - 0.06 * h, yb0 + (yr - yb0) * 0.965], [wt * 0.5, yr + 0.014 * h], [0, yr + 0.02 * h]], r = [];
      for (let j = 0; j < 5; j++) r.push([half[j][0], half[j][1], z]); for (let j = 3; j >= 0; j--) r.push([-half[j][0], half[j][1], z]);
      return r;
    });
    for (let i = 0; i < gz.length - 1; i++) {
      const zm = (gz[i] + gz[i + 1]) / 2;
      let pil = false; for (const p of gr.pillars) if (Math.abs(zm - p) < 0.045) pil = true;
      for (let j = 0; j < 8; j++) {
        const a = grow[i][j], b = grow[i][j + 1], c = grow[i + 1][j], d = grow[i + 1][j + 1], r = j < 4 ? j : 7 - j;
        let g = false;
        if (r === 0) g = zm > gr.glass[0] && zm < gr.glass[1] && !pil;
        else if (r >= 2) g = zm > gr.zr1 + 0.02 || (gr.rear && zm < gr.zr0 - 0.02);
        const l = g ? glass : paint; tri(l, a, b, c); tri(l, b, d, c);
      }
    }
    const mk = (arr, ang) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3)); return U.crease(g, ang); };
    const strip = l => l.map(g => { const o = g.index ? g.toNonIndexed() : g; const r = new THREE.BufferGeometry(); r.setAttribute('position', o.attributes.position); r.setAttribute('normal', o.attributes.normal); return r; });
    const mergeN = l => {
      const s = strip(l); let n = 0; for (const g of s) n += g.attributes.position.count;
      const p = new Float32Array(n * 3), nm = new Float32Array(n * 3); let o = 0;
      for (const g of s) { p.set(g.attributes.position.array, o * 3); nm.set(g.attributes.normal.array, o * 3); o += g.attributes.position.count; }
      const r = new THREE.BufferGeometry(); r.setAttribute('position', new THREE.BufferAttribute(p, 3)); r.setAttribute('normal', new THREE.BufferAttribute(nm, 3)); return r;
    };
    const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
    const mesh = (g, m, parent) => { const ms = new THREE.Mesh(g, m); ms.castShadow = true; ms.receiveShadow = true; (parent || body).add(ms); return ms; };
    const rb = (w, h, d, r, x, y, z, ry) => U.tf(U.roundedBox(w, h, d, r, 2), x, y, z, 0, ry || 0, 0);
    const P = [mk(paint, 0.75)], Bk = [mk(black, 0.9)], Hd = [], Tl = [];
    /* ---- details ---- */
    const wF = fW(sp.L1), wR = fW(sp.L0), yF = fBelt(sp.L1), yR = fBelt(sp.L0), ybF = fBot(sp.L1), ybR = fBot(sp.L0);
    Bk.push(U.tf(new THREE.BoxGeometry(1.24, 0.16, sp.zf - sp.zr + 0.4), 0, fBot(0) + 0.1, (sp.zf + sp.zr) / 2));
    for (const za of [sp.zf, sp.zr]) Bk.push(U.tf(new THREE.BoxGeometry(1.24, sp.ra + 0.15, sp.ra * 2), 0, sp.wr + 0.02, za));
    Bk.push(rb(sp.grille[0], sp.grille[1], 0.04, 0.02, 0, sp.grille[2], sp.L1 - 0.002));                         // grille
    Bk.push(rb(wF * 2 - 0.16, 0.09, 0.05, 0.02, 0, ybF + 0.075, sp.L1 - 0.008));                                      // front valance
    Bk.push(rb(wR * 2 - 0.16, 0.09, 0.05, 0.02, 0, ybR + 0.075, sp.L0 + 0.008));                                      // rear valance
    P.push(rb(0.36, 0.13, 0.012, 0.004, 0, (ybR + yR) / 2 - 0.02, sp.L0 - 0.004));                                 // plate
    for (const sx of [-1, 1]) {
      Hd.push(rb(sp.lampF[0], sp.lampF[1], 0.05, 0.022, sx * (wF - sp.lampF[0] / 2 - 0.05), sp.lampF[2], sp.L1 - 0.012));
      Tl.push(rb(sp.lampR[0], sp.lampR[1], 0.05, 0.022, sx * (wR - sp.lampR[0] / 2 - 0.04), sp.lampR[2], sp.L0 + 0.012));
      const zm = gr.z1 - (gr.z1 - gr.zr1) * 0.12, xm = fW(zm) + 0.06;
      P.push(rb(0.1, 0.085, 0.15, 0.03, sx * xm, fBelt(zm) + 0.07, zm, sx * 0.2));                                 // mirror
      for (const p of [gr.glass[1] + 0.02].concat(gr.pillars)) {                                                     // door shut lines
        if (p < sp.zr + sp.ra || p > sp.zf - sp.ra) continue;
        Bk.push(U.tf(new THREE.BoxGeometry(0.006, fBelt(p) - fBot(p) - 0.16, 0.012), sx * (fW(p) + 0.0005), (fBelt(p) + fBot(p)) / 2 + 0.02, p));
      }
    }
    mesh(mergeN(P), paintM); mesh(mergeN(Bk), shared.black); mesh(mk(glass, 0.6), shared.glass); mesh(mergeN(Hd), shared.head); mesh(mergeN(Tl), shared.tail);
    /* ---- wheels ---- */
    const wheels = [], k = sp.wr / 0.35, wMax = fW(0);
    for (const z of [sp.zf, sp.zr]) for (const sx of [-1, 1]) {
      const h = new THREE.Group(); h.position.set(sx * (wMax - 0.135 * k - 0.005), sp.wr, z); h.scale.set(sx * k, k, k); root.add(h);
      const spin = new THREE.Group(); h.add(spin);
      mesh(shared.wheel.tire, shared.tire, spin); mesh(shared.wheel.rim, shared.rim, spin); mesh(shared.wheel.face, shared.face, spin);
      wheels.push(spin);
    }
    return { root, body, wheels, r: sp.wr, len: sp.L1, w: wMax * 2 };
  };
})();
