'use strict';
/* Roadside props: guardrails, utility poles + wires, signs, mailboxes, river bridge, overpass, fences. */
(function () {
  const U = G.U;
  G.buildProps = function (scene, tex, env) {
    const R = G.road, N = R.N, DS = R.DS, px = R.px, pz = R.pz, Y = R.y, tx = R.tx, tz = R.tz, bank = R.bank, curv = R.curv, wrapI = R.wrapI, S0 = R.start, SO = R.overI, SB = R.bridgeI;
    const mats = G.mats, T = G.T;
    mats.metal = new THREE.MeshStandardMaterial({ color: 0xb6babc, metalness: 0.9, roughness: 0.42, envMap: env, envMapIntensity: 1.0, side: THREE.DoubleSide });
    mats.concrete = new THREE.MeshStandardMaterial({ map: tex.concrete, roughness: 0.93, metalness: 0, envMap: env, envMapIntensity: 0.4 });
    mats.wood = new THREE.MeshStandardMaterial({ map: tex.wood, roughness: 0.9, metalness: 0, envMap: env, envMapIntensity: 0.3 });
    mats.color = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6, metalness: 0.25, envMap: env, envMapIntensity: 0.6 });
    G.dynRefl(mats.metal, 0.5, 0.5, 2.6);
    const L_ = { metal: [], concrete: [], wood: [], color: [], curveL: [], curveR: [], road2: [] };
    const st = k => wrapI(S0 + k);
    const yawAt = i => Math.atan2(tx[i], tz[i]);
    const f = {}, tin = {}, off = R.off;
    const roadGap = (x, z, i) => { G.terrain(x, z, i, tin); return Math.abs(tin.d); }; // distance to the centre of the nearest road (main or side road)
    const at = (g, x, y, z, yaw) => U.tf(g, x, y, z, 0, yaw, 0);
    const boxProf = (d0, d1, y0, y1) => [[d0, y1], [d1, y1], [d1, y0], [d0, y0]];

    /* ---------------- guardrails ---------------- */
    const rail = [new Uint8Array(N), new Uint8Array(N)], TH = 1 / 235;
    const b0 = R.bridge.i0, bn = R.bridge.n;
    for (let i = 0; i < N; i++) {
      if (curv[i] > TH) for (let k = -9; k <= 9; k++) rail[1][wrapI(i + k)] = 1;
      if (curv[i] < -TH) for (let k = -9; k <= 9; k++) rail[0][wrapI(i + k)] = 1;
    }
    for (let k = -16; k <= bn + 16; k++) { rail[0][wrapI(b0 + k)] = 1; rail[1][wrapI(b0 + k)] = 1; }
    for (let k = -17; k <= 17; k++) { rail[0][wrapI(SO + k)] = 1; rail[1][wrapI(SO + k)] = 1; }
    for (const dr of R.drives) for (let k = -3; k <= 3; k++) rail[dr.side < 0 ? 0 : 1][wrapI(dr.i + k)] = 0;
    for (let i = 0; i < N; i++) { const ao = Math.abs(off[i]); if (ao > 0 && ao < 15) rail[off[i] < 0 ? 0 : 1][i] = 0; }
    const railOff = i => {
      let k = wrapI(i - b0); if (k > N / 2) k -= N;
      const u = k < 0 ? -k : k > bn ? k - bn : 0;
      return U.lerp(4.62, 5.05, U.smooth(0, 9, u));
    };
    R.rail = rail; R.railOff = railOff;
    for (let si = 0; si < 2; si++) {
      const side = si ? 1 : -1, fl = rail[si];
      let i0 = 0; while (fl[i0] && i0 < N) i0++;
      let run = null; const runs = [];
      for (let k = 1; k <= N; k++) {
        const i = wrapI(i0 + k);
        if (fl[i]) { if (!run) run = []; run.push(i); } else if (run) { runs.push(run); run = null; }
      }
      for (const r of runs) {
        if (r.length < 7) { for (const i of r) fl[i] = 0; continue; }
        const fr = [];
        r.forEach((i, k) => {
          const o = railOff(i) * side, e = Math.min(k, r.length - 1 - k), drop = e === 0 ? 0.5 : e === 1 ? 0.16 : 0;
          fr.push({ x: px[i] - tz[i] * o, y: Y[i] + bank[i] * o - drop, z: pz[i] + tx[i] * o, rx: -tz[i], rz: tx[i], bank: 0, v: k * 0.5 });
          if (k % 2 === 0 && e > 0) L_.metal.push(at(new THREE.BoxGeometry(0.1, 0.8, 0.15), px[i] - tz[i] * (o + side * 0.09), Y[i] + bank[i] * o + 0.34, pz[i] + tx[i] * (o + side * 0.09), yawAt(i)));
        });
        const w = 0.05 * side;
        L_.metal.push(U.sweep(fr, [[0, 0.43], [-w, 0.47], [-w, 0.53], [0, 0.585], [-w, 0.64], [-w, 0.70], [0, 0.74]], {}));
      }
    }

    /* ---------------- utility poles + wires ---------------- */
    const wirePts = [];
    let prev = null;
    for (let k = 9; k < N; k += 22) {
      const i = st(k);
      let ko = wrapI(i - SO); if (ko > N / 2) ko -= N;
      let kb = wrapI(i - b0); if (kb > N / 2) kb -= N;
      if (Math.abs(ko) < 22) { prev = null; continue; }
      if (kb > -3 && kb < bn + 3) continue;
      const d = -7.35, x = px[i] - tz[i] * d, z = pz[i] + tx[i] * d, yaw = yawAt(i), base = G.terrain(x, z, i) - 0.5, H = 10.8;
      const pole = new THREE.CylinderGeometry(0.1, 0.16, H, 8); pole.translate(0, H / 2, 0);
      const uv = pole.attributes.uv; for (let q = 0; q < uv.count; q++) uv.setY(q, uv.getY(q) * 3);
      L_.wood.push(at(pole, x, base, z, yaw + k));
      L_.wood.push(at(new THREE.BoxGeometry(2.5, 0.11, 0.13), x, base + H - 0.75, z, yaw));
      const lx = tz[i], lz = -tx[i]; // local +X (left)
      const att = [];
      for (const ox of [-1.1, 0.38, 1.1]) {
        L_.color.push(U.paint(at(new THREE.CylinderGeometry(0.04, 0.055, 0.17, 6), x + lx * ox, base + H - 0.61, z + lz * ox, 0), 0.55, 0.57, 0.6));
        att.push([x + lx * ox, base + H - 0.52, z + lz * ox]);
      }
      att.push([x, base + 7.3, z]);
      if ((k / 22 | 0) % 4 === 1) {
        L_.color.push(U.paint(at(new THREE.CylinderGeometry(0.27, 0.27, 0.9, 12), x - lx * 0.4, base + 8.3, z - lz * 0.4, 0), 0.42, 0.45, 0.46));
      }
      G.addCollider(x, z, 0.32);
      if (prev) {
        for (let w = 0; w < 4; w++) {
          const a = prev[w], b = att[w], span = Math.hypot(b[0] - a[0], b[2] - a[2]), sag = (w === 3 ? 0.9 : 0.55) + span * span / 3200, SG = 12;
          for (let s = 0; s < SG; s++) for (const t of [s / SG, (s + 1) / SG]) wirePts.push(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - sag * 4 * t * (1 - t), a[2] + (b[2] - a[2]) * t);
        }
      }
      prev = att;
    }
    {
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(wirePts, 3));
      const m = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0x0b0b0c })); m.frustumCulled = false; m.matrixAutoUpdate = false; scene.add(m);
    }

    /* ---------------- signs ---------------- */
    const signMat = (map, alpha) => new THREE.MeshStandardMaterial({ map, roughness: 0.5, metalness: 0.1, alphaTest: alpha ? 0.5 : 0, envMap: env, envMapIntensity: 0.5 });
    const steel = (g) => U.paint(g, 0.36, 0.38, 0.39);
    function signPos(i, d) {
      let x = px[i] - tz[i] * d, z = pz[i] + tx[i] * d;
      if (off[i] * d > 0 && roadGap(x, z, i) < 5.6) { d = off[i] + Math.sign(d) * 5.85; x = px[i] - tz[i] * d; z = pz[i] + tx[i] * d; } // would stand on the side road: move to its far shoulder
      return [x, G.terrain(x, z, i), z];
    }
    function smallSign(i, side, fwd, w, h, cy, list, mat) {
      const p = signPos(i, side * 5.85), yaw = yawAt(i) + (fwd ? Math.PI : 0), nx = Math.sin(yaw), nz = Math.cos(yaw);
      L_.color.push(steel(at(new THREE.BoxGeometry(0.06, cy + h * 0.45, 0.05), p[0] - nx * 0.04, p[1] + (cy + h * 0.45) / 2 - 0.1, p[2] - nz * 0.04, yaw)));
      L_.color.push(U.paint(at(new THREE.PlaneGeometry(w * 0.7, h * 0.7), p[0] - nx * 0.012, p[1] + cy, p[2] - nz * 0.012, yaw + Math.PI), 0.5, 0.52, 0.53));
      const g = at(new THREE.PlaneGeometry(w, h), p[0], p[1] + cy, p[2], yaw);
      if (list) list.push(g); else { const m = new THREE.Mesh(g, mat); m.castShadow = true; m.receiveShadow = true; m.matrixAutoUpdate = false; scene.add(m); }
      G.addCollider(p[0], p[2], 0.15);
    }
    // curve warnings
    {
      let i0 = 0; while (Math.abs(curv[i0]) > TH) i0++;
      let a = -1, sg = 0;
      for (let k = 1; k <= N; k++) {
        const i = wrapI(i0 + k), on = Math.abs(curv[i]) > TH;
        if (on && a < 0) { a = i; sg = Math.sign(curv[i]); }
        else if (!on && a >= 0) {
          const len = wrapI(i - a);
          if (len > 12) {
            smallSign(wrapI(a - 36), 1, true, 0.95, 0.95, 2.3, sg > 0 ? L_.curveL : L_.curveR);
            smallSign(wrapI(i + 36), -1, false, 0.95, 0.95, 2.3, sg < 0 ? L_.curveL : L_.curveR);
          }
          a = -1;
        }
      }
    }
    const spd = signMat(T.speedSign(55));
    for (const k of [118, 930, 1520]) smallSign(st(k), 1, true, 0.62, 0.78, 2.25, null, spd);
    for (const k of [330, 1150]) smallSign(st(k), -1, false, 0.62, 0.78, 2.25, null, spd);
    function bigSign(k, side, fwd, rows, w, h) {
      let i = st(k);
      for (let t = 0; t < 90; t++) { const c = side > 0 ? R.cutR[i] : R.cutL[i]; if (Math.abs(c) < 1.3 && !rail[side > 0 ? 1 : 0][i]) break; i = wrapI(i + (fwd ? 1 : -1) * 2); }
      const p = signPos(i, side * 8.9), yaw = yawAt(i) + (fwd ? Math.PI : 0), nx = Math.sin(yaw), nz = Math.cos(yaw), cy = 2.1 + h / 2;
      const ax = Math.cos(yaw), az = -Math.sin(yaw);
      for (const o of [-w * 0.33, w * 0.33]) {
        L_.color.push(steel(at(new THREE.BoxGeometry(0.11, cy + h / 2 + 0.5, 0.09), p[0] + ax * o - nx * 0.07, p[1] + (cy + h / 2) / 2 - 0.25, p[2] + az * o - nz * 0.07, yaw)));
        G.addCollider(p[0] + ax * o, p[2] + az * o, 0.2);
      }
      L_.color.push(U.paint(at(new THREE.PlaneGeometry(w, h), p[0] - nx * 0.015, p[1] + cy, p[2] - nz * 0.015, yaw + Math.PI), 0.5, 0.52, 0.53));
      const m = new THREE.Mesh(at(new THREE.PlaneGeometry(w, h), p[0], p[1] + cy, p[2], yaw), signMat(rows.length ? T.greenSign(rows) : null));
      m.castShadow = true; m.receiveShadow = true; m.matrixAutoUpdate = false; scene.add(m);
    }
    bigSign(178, 1, true, [['Magnolia Springs', '7'], ['Pine Hollow', '15']], 3.7, 1.85);
    bigSign(1170, 1, true, [['Cedar Ridge', '4'], ['Harlow Junction', '22']], 3.7, 1.85);
    bigSign(1640, -1, false, [['Pine Hollow', '9'], ['Magnolia Springs', '31']], 3.7, 1.85);
    {
      const rm = signMat(T.smallSign('Sweetwater River', '#0b6a43', '#eef2ee'));
      smallSign(wrapI(b0 - 20), 1, true, 2.0, 0.5, 1.9, null, rm);
      smallSign(wrapI(b0 + bn + 20), -1, false, 2.0, 0.5, 1.9, null, rm);
    }

    /* ---------------- mailboxes ---------------- */
    R.drives.forEach((dr, n) => {
      R.frame(dr.s + 3.4, f);
      const d = dr.side * 5.8, x = f.x + f.rx * d, z = f.z + f.rz * d, y = G.terrain(x, z, dr.i), yaw = Math.atan2(f.tx, f.tz) + Math.PI / 2;
      L_.wood.push(at(new THREE.BoxGeometry(0.1, 1.15, 0.1), x, y + 0.5, z, yaw));
      const c = n % 3 === 0 ? [0.1, 0.1, 0.11] : n % 3 === 1 ? [0.62, 0.64, 0.66] : [0.16, 0.24, 0.2];
      L_.color.push(U.paint(at(U.roundedBox(0.2, 0.23, 0.48, 0.09, 2), x, y + 1.16, z, yaw), c[0], c[1], c[2]));
      L_.color.push(U.paint(at(new THREE.BoxGeometry(0.014, 0.1, 0.07), x + Math.cos(yaw) * 0.108, y + 1.24, z - Math.sin(yaw) * 0.108, yaw), 0.75, 0.08, 0.06));
      G.addCollider(x, z, 0.15);
    });

    /* ---------------- river bridge ---------------- */
    {
      const fr = [];
      for (let k = 0; k <= bn; k++) { const i = wrapI(b0 + k); fr.push({ x: px[i], y: Y[i], z: pz[i], rx: -tz[i], rz: tx[i], bank: bank[i], v: k * DS }); }
      const o = { sharp: true, closed: true, uScale: 0.13, vScale: 0.13 };
      L_.concrete.push(U.sweep(fr, boxProf(-4.98, 4.98, -0.75, -0.03), o));
      L_.concrete.push(U.sweep(fr, [[4.3, -0.03], [4.34, 0.26], [4.98, 0.26], [4.98, -0.03]], o));
      L_.concrete.push(U.sweep(fr, [[-4.98, 0.26], [-4.34, 0.26], [-4.3, -0.03], [-4.98, -0.03]], o));
      for (const c of [-3.7, -1.25, 1.25, 3.7]) L_.concrete.push(U.sweep(fr, boxProf(c - 0.28, c + 0.28, -1.75, -0.75), o));
      for (const k of [-10, 10]) {
        const i = wrapI(SB + k), yaw = yawAt(i);
        L_.concrete.push(at(new THREE.BoxGeometry(9.6, 1.0, 1.3), px[i], Y[i] - 2.25, pz[i], yaw));
        for (const lat of [-3.1, 3.1]) {
          const x = px[i] - tz[i] * lat, z = pz[i] + tx[i] * lat, bot = G.terrain(x, z, i) - 1.5, top = Y[i] - 2.75, h = top - bot;
          L_.concrete.push(at(new THREE.CylinderGeometry(0.52, 0.52, h, 14), x, bot + h / 2, z, 0));
        }
      }
      for (const k of [1, bn - 1]) { const i = wrapI(b0 + k); L_.concrete.push(at(new THREE.BoxGeometry(10.8, 4.6, 1.1), px[i], Y[i] - 0.75 - 2.3, pz[i], yawAt(i))); }
    }

    /* ---------------- overpass ---------------- */
    {
      const ox = px[SO], oz = pz[SO], fx = -tz[SO], fz = tx[SO], yO = R.overY, yaw = yawAt(SO);
      const mk = (u0, u1, step, vs) => { const a = []; for (let u = u0; u <= u1 + 0.01; u += step) a.push({ x: ox + fx * u, y: yO, z: oz + fz * u, rx: -fz, rz: fx, bank: 0, v: u * (vs || 1) }); return a; };
      L_.road2.push(U.sweep(mk(-140, 140, 5, 1 / (R.L / 105)), [[-3.7, 0], [0, 0], [3.7, 0]], { uNorm: true }));
      const o = { sharp: true, closed: true, uScale: 0.13, vScale: 0.13 };
      const deck = mk(-13.6, 13.6, 3.4);
      L_.concrete.push(U.sweep(deck, boxProf(-5.3, 5.3, -1.0, -0.02), o));
      const par = mk(-20, 20, 4);
      L_.concrete.push(U.sweep(par, boxProf(4.7, 5.25, -0.02, 0.92), o));
      L_.concrete.push(U.sweep(par, boxProf(-5.25, -4.7, -0.02, 0.92), o));
      for (const c of [-4, -2, 0, 2, 4]) L_.concrete.push(U.sweep(deck, boxProf(c - 0.24, c + 0.24, -1.9, -1.0), o));
      for (const sgn of [-1, 1]) {
        const u = sgn * 6.95, cx = ox + fx * u, cz = oz + fz * u;
        L_.concrete.push(at(new THREE.BoxGeometry(1.15, 0.9, 10.4), cx, yO - 2.35, cz, yaw));
        for (const a of [-3.8, 0, 3.8]) {
          const x = cx + tx[SO] * a, z = cz + tz[SO] * a, bot = Y[SO] - 1.0, top = yO - 2.8;
          L_.concrete.push(at(new THREE.CylinderGeometry(0.43, 0.43, top - bot, 14), x, (top + bot) / 2, z, 0));
          G.addCollider(x, z, 0.62);
        }
        const ua = sgn * 13.3;
        L_.concrete.push(at(new THREE.BoxGeometry(1.1, 5.6, 11.4), ox + fx * ua, yO - 1.0 - 2.8, oz + fz * ua, yaw));
      }
      // caps for the deck ends of the parapets (visual weight) and a route marker facing traffic
      const m = signMat(T.smallSign('CR 41  Old Mill Rd', '#0b6a43', '#eef2ee'));
      for (const sgn of [-1, 1]) {
        const g = at(new THREE.PlaneGeometry(3.2, 0.8), ox - tx[SO] * sgn * 5.28 + fx * sgn * 1.9, yO + 0.42, oz - tz[SO] * sgn * 5.28 + fz * sgn * 1.9, yaw + (sgn > 0 ? Math.PI : 0));
        const ms = new THREE.Mesh(g, m); ms.matrixAutoUpdate = false; ms.receiveShadow = true; scene.add(ms);
      }
    }

    /* ---------------- pasture fences and hay bales ---------------- */
    {
      const rnd = U.rng(808);
      /* every post and every board is its own instance, so the fence can be smashed piece by piece (see Posts in main.js) */
      const fence = [];
      const fencePieces = (fr, white) => {
        fr.forEach((a, n) => {
          fence.push({ x: a.ox, y: a.y + 0.6, z: a.oz, yaw: a.yaw, pitch: 0, sx: 0.12, sy: 1.45, sz: 0.12, white, hl: 0.72, axis: 1, r: 0.1 });
          if (n === fr.length - 1) return;
          const b = fr[n + 1], dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z, L = Math.hypot(dx, dz);
          for (const h of [0.42, 0.78, 1.14]) fence.push({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 + h, z: (a.z + b.z) / 2, yaw: Math.atan2(dx, dz), pitch: -Math.atan2(dy, L), sx: 0.05, sy: 0.13, sz: Math.hypot(L, dy) + 0.05, white, hl: L / 2, axis: 2, r: 0.9 });
        });
      };
      const cb = (g, c) => L_.color.push(U.paint(g, c[0], c[1], c[2]));
      const place = (i, d) => { if (off[i] * d > 0 && Math.abs(d - off[i]) < 30) d = off[i] + Math.sign(d) * Math.max(14.5, Math.abs(d) - 8); const x = px[i] - tz[i] * d, z = pz[i] + tx[i] * d; return [x, G.terrain(x, z, i), z]; };
      const barn = (i, d, red) => {
        const [x, y, z] = place(i, d), yaw = yawAt(i) + 0.35, fx = Math.sin(yaw), fz = Math.cos(yaw), lx = Math.cos(yaw), lz = -Math.sin(yaw);
        cb(at(new THREE.BoxGeometry(8.6, 5.6, 12), x, y + 1.8, z, yaw), red ? [0.34, 0.09, 0.06] : [0.5, 0.47, 0.42]);
        const roof = new THREE.CylinderGeometry(5.3, 5.3, 12.9, 3, 1); roof.rotateX(Math.PI / 2); roof.rotateZ(Math.PI); roof.scale(1, 0.5, 1);
        cb(at(U.crease(roof, 0.5), x, y + 4.6 + 1.32, z, yaw), [0.42, 0.44, 0.46]);
        cb(at(new THREE.BoxGeometry(3.3, 3.5, 0.14), x + fx * 6.02, y + 0.95, z + fz * 6.02, yaw), [0.82, 0.8, 0.74]);
        cb(at(new THREE.BoxGeometry(1.1, 1.0, 0.14), x + fx * 6.02, y + 3.7, z + fz * 6.02, yaw), [0.82, 0.8, 0.74]);
        const sx2 = x + lx * 6.6, sz2 = z + lz * 6.6;
        cb(at(new THREE.CylinderGeometry(1.7, 1.7, 9.5, 18), sx2, y + 3.75, sz2, 0), [0.6, 0.61, 0.6]);
        cb(at(new THREE.SphereGeometry(1.7, 18, 8, 0, Math.PI * 2, 0, Math.PI / 2), sx2, y + 8.5, sz2, 0), [0.52, 0.54, 0.55]);
        for (const k of [-4, 0, 4]) G.addCollider(x + fx * k, z + fz * k, 4.7); G.addCollider(sx2, sz2, 2.0);
      };
      const tower = (i, d) => {
        const [x, y, z] = place(i, d), c = [0.66, 0.69, 0.7];
        for (let a = 0; a < 4; a++) { const an = a * Math.PI / 2 + 0.4, g = new THREE.CylinderGeometry(0.12, 0.16, 12.4, 8); g.translate(0, 6.2, 0); g.rotateZ(0.13); g.rotateY(-an); cb(at(g, x + Math.cos(an) * 3.2, y - 0.4, z + Math.sin(an) * 3.2, 0), [0.4, 0.42, 0.43]); G.addCollider(x + Math.cos(an) * 3.2, z + Math.sin(an) * 3.2, 0.35); }
        cb(at(new THREE.CylinderGeometry(0.3, 0.3, 11.6, 10), x, y + 5.6, z, 0), [0.4, 0.42, 0.43]);
        cb(at(new THREE.CylinderGeometry(2.9, 2.9, 3.4, 22), x, y + 13.1, z, 0), c);
        cb(at(new THREE.ConeGeometry(3.05, 1.4, 22), x, y + 15.5, z, 0), [0.5, 0.52, 0.54]);
        cb(at(new THREE.CylinderGeometry(2.93, 2.93, 0.3, 22), x, y + 12.1, z, 0), [0.36, 0.2, 0.14]);
      };
      const billboard = (i, side, k) => {
        const [x, y, z] = place(i, side * 14.5), yaw = yawAt(i) + Math.PI - side * 0.22, nx = Math.sin(yaw), nz = Math.cos(yaw), ax = Math.cos(yaw), az = -Math.sin(yaw);
        for (const o of [-2.5, 2.5]) { L_.wood.push(at(new THREE.BoxGeometry(0.24, 7.6, 0.24), x + ax * o - nx * 0.2, y + 3.3, z + az * o - nz * 0.2, yaw)); G.addCollider(x + ax * o, z + az * o, 0.3); }
        L_.wood.push(at(new THREE.BoxGeometry(7.5, 3.5, 0.12), x - nx * 0.07, y + 5.3, z - nz * 0.07, yaw));
        const m = new THREE.Mesh(at(new THREE.PlaneGeometry(7.3, 3.2), x, y + 5.3, z, yaw), signMat(T.billboard(k)));
        m.castShadow = true; m.receiveShadow = true; m.matrixAutoUpdate = false; scene.add(m);
      };
      R.pastures.forEach((p, pi) => {
        const white = pi % 2 === 1;
        let fr = [];
        const flush = () => { if (fr.length > 1) fencePieces(fr, white); fr = []; };
        for (let k = p.a + 4; k <= p.b - 4; k++) {
          const i = st(k), d = p.side * 11.4, x = px[i] - tz[i] * d, z = pz[i] + tx[i] * d;
          let gap = false; for (const dr of R.drives) if (dr.side === p.side && Math.abs(wrapI(i - dr.i + N / 2) - N / 2) < 3) gap = true;
          if (off[i] * p.side > 0 && Math.abs(d - off[i]) < 7.6) gap = true; // a side road crosses the fence line
          if (gap) { flush(); continue; }
          const y = G.terrain(x, z, i);
          fr.push({ x, y, z, yaw: yawAt(i), ox: x - tz[i] * p.side * 0.07, oz: z + tx[i] * p.side * 0.07 });
        }
        flush();
        for (let n = 0; n < 9; n++) {
          const i = st(p.a + 12 + ((rnd() * (p.b - p.a - 24)) | 0)), d = p.side * (22 + rnd() * 70), x = px[i] - tz[i] * d, z = pz[i] + tx[i] * d;
          if (roadGap(x, z, i) < 8) continue;
          const g = new THREE.CylinderGeometry(0.82, 0.82, 1.5, 16); g.rotateZ(Math.PI / 2);
          L_.color.push(U.paint(at(g, x, G.terrain(x, z, i) + 0.74, z, rnd() * 3.14), 0.66, 0.54, 0.3));
          G.addCollider(x, z, 0.9);
        }
        const mid = st(((p.a + p.b) / 2) | 0);
        if (pi % 3 === 0) barn(mid, p.side * 50, pi % 2 === 0); else if (pi % 3 === 1) tower(mid, p.side * 44);
        if (pi % 2 === 0 || pi % 3 === 2) billboard(st(p.a + 34), p.side, pi);
      });
      {
        const ub = new THREE.BoxGeometry(1, 1, 1), dmF = new THREE.Object3D(); dmF.rotation.order = 'YXZ';
        for (const white of [false, true]) {
          const list = fence.filter(q => q.white === white); if (!list.length) continue;
          const m = new THREE.InstancedMesh(white ? U.paint(ub.clone(), 0.86, 0.86, 0.82) : ub, white ? mats.color : mats.wood, list.length);
          list.forEach((q, k) => { q.mesh = m; q.idx = k; dmF.position.set(q.x, q.y, q.z); dmF.rotation.set(q.pitch, q.yaw, 0); dmF.scale.set(q.sx, q.sy, q.sz); dmF.updateMatrix(); m.setMatrixAt(k, dmF.matrix); });
          m.instanceMatrix.needsUpdate = true; m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false; scene.add(m);
        }
        G.fenceData = fence;
      }
    }

    /* ---------------- road studs + delineator posts ---------------- */
    {
      const posts = [];
      const bnk = R.bridge, onBr = i => { let k = wrapI(i - bnk.i0); return k >= 0 && k <= bnk.n; };
      for (let i = 0; i < N; i += 5) {
        const yaw = yawAt(i);
        L_.color.push(U.paint(at(new THREE.BoxGeometry(0.085, 0.014, 0.085), px[i], Y[i] + 0.006, pz[i], yaw), 1.0, 0.62, 0.05));
        if (i % 10 === 0) for (const side of [-1, 1]) {
          const d = side * 3.98;
          L_.color.push(U.paint(at(new THREE.BoxGeometry(0.09, 0.018, 0.09), px[i] - tz[i] * d, Y[i] + bank[i] * d + 0.008, pz[i] + tx[i] * d, yaw), 0.9, 0.9, 0.86));
        }
        if (i % 10 === 5) for (const side of [-1, 1]) {
          if (rail[side > 0 ? 1 : 0][i] || onBr(i)) continue;
          if (off[i] * side > 0 && Math.abs(off[i]) < 12.5) continue; // mouth of a side road
          let dv = false; for (const dr of R.drives) if (dr.side === side && Math.abs(wrapI(i - dr.i + N / 2) - N / 2) < 4) dv = true; if (dv) continue;
          const d = side * 5.25, x = px[i] - tz[i] * d, z = pz[i] + tx[i] * d, y = Y[i] + bank[i] * d - 0.05;
          posts.push({ x, y, z, yaw, side });
        }
      }
      for (const F of R.forks) for (let k = 2; k < F.n; k += 5) { // along the side roads
        const i = wrapI(F.i0 + k), o = off[i], yaw = Math.atan2(R.btx[i], R.btz[i]);
        for (const side of [-1, 1]) {
          if (side * Math.sign(o) < 0 ? Math.abs(o) < 12.5 : Math.abs(o) < 2.5) continue;
          const d = side * 5.25; posts.push({ x: R.bx[i] - R.btz[i] * d, y: R.by[i] + bank[i] * d - 0.05, z: R.bz[i] + R.btx[i] * d, yaw, side });
        }
      }
      // one instanced mesh per side (orange reflector on the left, white on the right)
      const mkPost = rc => { const b1 = new THREE.BoxGeometry(0.1, 1.0, 0.035); b1.translate(0, 0.5, 0); const b2 = new THREE.BoxGeometry(0.104, 0.16, 0.039); b2.translate(0, 0.8, 0); const b3 = new THREE.BoxGeometry(0.06, 0.09, 0.045); b3.translate(0, 0.8, 0);
        return U.merge([U.paint(b1, 0.84, 0.84, 0.8), U.paint(b2, 0.05, 0.05, 0.05), U.paint(b3, rc[0], rc[1], rc[2])]); };
      const dm = new THREE.Object3D();
      for (const side of [-1, 1]) {
        const list = posts.filter(p => p.side === side), m = new THREE.InstancedMesh(mkPost(side > 0 ? [0.95, 0.95, 0.9] : [1.0, 0.55, 0.05]), mats.color, list.length);
        list.forEach((p, k) => { p.mesh = m; p.idx = k; dm.position.set(p.x, p.y, p.z); dm.rotation.set(0, p.yaw, 0); dm.updateMatrix(); m.setMatrixAt(k, dm.matrix); });
        m.instanceMatrix.needsUpdate = true; m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false; scene.add(m);
      }
      G.postData = posts;
    }

    /* ---------------- finalize ---------------- */
    mats.curveL = signMat(T.curveSign(true), true); mats.curveR = signMat(T.curveSign(false), true);
    const add = (list, mat, shadow) => {
      if (!list.length) return;
      const m = new THREE.Mesh(U.merge(list), mat); m.castShadow = shadow; m.receiveShadow = true; m.matrixAutoUpdate = false; m.frustumCulled = false; scene.add(m);
      for (const g of list) g.dispose();
    };
    add(L_.metal, mats.metal, true); add(L_.concrete, mats.concrete, true); add(L_.wood, mats.wood, true); add(L_.color, mats.color, true);
    add(L_.curveL, mats.curveL, true); add(L_.curveR, mats.curveR, true); add(L_.road2, mats.road, false);
  };
})();
