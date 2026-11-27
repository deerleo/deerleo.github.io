'use strict';
/* Player convertible (lofted body) and simple traffic vehicles. Car space: +Z forward, +Y up, +X left. */
(function () {
  const U = G.U;

  function spline(keys) {
    const n = keys.length, m = new Array(n);
    for (let k = 0; k < n; k++) {
      const a = keys[Math.max(0, k - 1)], b = keys[Math.min(n - 1, k + 1)];
      m[k] = (b[1] - a[1]) / ((b[0] - a[0]) || 1);
    }
    return function (x) {
      if (x <= keys[0][0]) return keys[0][1];
      if (x >= keys[n - 1][0]) return keys[n - 1][1];
      let k = 0; while (keys[k + 1][0] < x) k++;
      const x0 = keys[k][0], x1 = keys[k + 1][0], h = x1 - x0, t = (x - x0) / h, t2 = t * t, t3 = t2 * t;
      return (2 * t3 - 3 * t2 + 1) * keys[k][1] + (t3 - 2 * t2 + t) * h * m[k] + (-2 * t3 + 3 * t2) * keys[k + 1][1] + (t3 - t2) * h * m[k + 1];
    };
  }
  const gauss = x => Math.exp(-x * x);

  /* ---------------- convertible body: lofted from side/plan curves ----------------
     Long hood with a centre bulge between raised front fenders, a waistline crease that kicks up into
     wide rear haunches, a ducktail and twin fairings flowing back from the headrests. */
  const ZF = 1.36, ZR = -1.26, RA = 0.405, WR = 0.35, ZC0 = -0.72, ZC1 = 0.40, ZT = -2.16, ZN = 2.22;
  const fTop = spline([[-2.16, 0.895], [-2.02, 0.902], [-1.8, 0.897], [-1.3, 0.902], [-0.74, 0.918], [0.42, 0.925], [0.8, 0.897], [1.36, 0.818], [1.8, 0.716], [2.05, 0.612], [2.22, 0.515]]);
  const fSh = spline([[-2.16, 0.84], [-2.0, 0.872], [-1.7, 0.906], [-1.26, 0.926], [-0.9, 0.902], [-0.3, 0.866], [0.42, 0.868], [0.9, 0.861], [1.36, 0.846], [1.75, 0.758], [2.03, 0.632], [2.22, 0.505]]);
  const fBot = spline([[-2.16, 0.36], [-1.95, 0.27], [-1.7, 0.18], [-1.5, 0.15], [1.65, 0.15], [1.95, 0.19], [2.22, 0.27]]);
  const fW = spline([[-2.16, 0.8], [-2.1, 0.874], [-1.95, 0.92], [-1.26, 0.956], [-0.6, 0.926], [0.3, 0.914], [1.36, 0.946], [1.8, 0.902], [2.03, 0.824], [2.15, 0.705], [2.22, 0.565]]);
  const fCr = spline([[-2.16, 0.66], [-1.26, 0.705], [-0.2, 0.628], [1.36, 0.602], [2.0, 0.5], [2.22, 0.425]]);
  const fDip = z => 0.012 + 0.022 * U.smooth(0.3, 0.8, z);
  G.carShape = { fW, fSh, fTop };
  const KS = 11, KD = 8, K = KS + KD;
  const ZH0 = 0.62, ZH1 = 2.0, JH = 13; // hood panel: between these stations, inboard of ring point JH on both sides

  function section(z, cabin, archY) {
    const w = fW(z), yt = fTop(z), ys = fSh(z), yb = fBot(z), yc = Math.min(fCr(z), ys - 0.07), pts = [];
    pts.push([0, yb], [0.55 * w, yb], [w - 0.085, yb], [w - 0.045, yb + 0.02], [w - 0.02, yb + 0.09], [w - 0.003, yb + (yc - yb) * 0.6],
      [w, yc - 0.035], [w - 0.008, yc], [w - 0.04, yc + (ys - yc) * 0.5], [w - 0.09, yc + (ys - yc) * 0.88], [w - 0.15, ys]);
    if (archY > 0) for (const p of pts) if (p[1] < archY) p[1] = archY; // wheel arch: the lower panel collapses onto the arch line
    if (cabin) {
      pts.push([w - 0.215, ys + 0.003], [w - 0.225, ys - 0.25], [w - 0.235, 0.34], [0.5 * (w - 0.235) + 0.1, 0.33], [0.2, 0.33], [0.17, 0.55], [0.1, 0.575], [0, 0.58]);
    } else {
      const xe = w - 0.15, yv = Math.min(ys, yt) - fDip(z), hz = z < ZC0 ? U.smooth(-1.75, -0.85, z) : 0;
      for (let k = 1; k <= KD; k++) {
        const u = 1 - k / KD, x = xe * u;
        let y = u > 0.7 ? yv + (ys - yv) * U.smooth(0.7, 1.0, u) : yt + (yv - yt) * U.smooth(0.12, 0.7, u);
        y += 0.044 * hz * gauss((x - 0.375) / 0.18);
        pts.push([x, y]);
      }
    }
    return pts;
  }
  /* point on the upper body surface: f = 0 (waist crease) .. 1 (centre line) */
  function surfPoint(z, f) {
    const s = section(z, false, 0), n = K - 1 - 7, t = 7 + f * n, i = Math.min(K - 2, Math.floor(t)), u = t - i;
    return [s[i][0] + (s[i + 1][0] - s[i][0]) * u, s[i][1] + (s[i + 1][1] - s[i][1]) * u];
  }
  function bodyGeometry() {
    const special = [];
    for (const z of [ZT, -2.135, -2.09, -2.02, 2.06, 2.12, 2.17, 2.2, ZN]) special.push({ z, cabin: false, arch: 0 });
    for (const za of [ZF, ZR]) {
      special.push({ z: za - 0.3725, cabin: false, arch: 0 }, { z: za + 0.3725, cabin: false, arch: 0 });
      for (let k = 0; k <= 14; k++) { const dz = -0.37 * Math.cos(Math.PI * k / 14); special.push({ z: za + dz, cabin: false, arch: WR + Math.sqrt(RA * RA - dz * dz) }); }
    }
    special.push({ z: ZH0, cabin: false, arch: 0 }, { z: ZH1, cabin: false, arch: 0 });
    special.push({ z: ZC0 - 0.004, cabin: false, arch: 0 }, { z: ZC0 + 0.004, cabin: true, arch: 0 }, { z: ZC1 - 0.004, cabin: true, arch: 0 }, { z: ZC1 + 0.004, cabin: false, arch: 0 });
    const stn = special.slice();
    for (let z = -1.96; z < 2.03; z += 0.066) {
      let ok = true;
      for (const s of special) if (Math.abs(s.z - z) < 0.03) ok = false;
      if (Math.abs(z - ZF) < 0.38 || Math.abs(z - ZR) < 0.38) ok = false;
      if (ok) stn.push({ z, cabin: z > ZC0 && z < ZC1, arch: 0 });
    }
    stn.sort((a, b) => a.z - b.z);
    const RING = 2 * K - 2, S = stn.length;
    const ring = stn.map(s => {
      const h = section(s.z, s.cabin, s.arch), r = [];
      for (let j = 0; j < K; j++) r.push([h[j][0], h[j][1], s.z]);
      for (let j = K - 2; j >= 1; j--) r.push([-h[j][0], h[j][1], s.z]);
      return r;
    });
    const paint = [], black = [], hood = [], hoodIn = [], dP = { 1: [], '-1': [] }, dB = { 1: [], '-1': [] };
    const tri = (list, a, b, c) => list.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
    for (let i = 0; i < S - 1; i++) for (let j = 0; j < RING; j++) {
      const j2 = (j + 1) % RING, a = ring[i][j], b = ring[i][j2], c = ring[i + 1][j], d = ring[i + 1][j2];
      const jj = j < K - 1 ? j : RING - 1 - j, sx = j < K - 1 ? 1 : -1, zm = (stn[i].z + stn[i + 1].z) / 2;
      const cab = stn[i].cabin && stn[i + 1].cabin;
      const tub = jj >= KS && (stn[i].cabin || stn[i + 1].cabin);
      const well = jj <= 2 && (stn[i].arch > 0 || stn[i + 1].arch > 0);
      let list = tub || well ? black : paint;
      if (!stn[i].cabin && !stn[i + 1].cabin && zm > ZH0 && zm < ZH1 && jj >= JH) list = hood;   // hood skin
      else if (cab && jj >= 3 && jj <= 12) list = jj >= KS ? dB[sx] : dP[sx];                     // door: outer skin, top, inner card
      tri(list, a, b, c); tri(list, b, d, c);
    }
    for (let k = 0; k < hood.length; k += 9) hoodIn.push(hood[k], hood[k + 1] - 0.004, hood[k + 2], hood[k + 6], hood[k + 7] - 0.004, hood[k + 8], hood[k + 3], hood[k + 4] - 0.004, hood[k + 5]); // underside
    // the ends of each door, and the matching faces of the door opening in the body
    {
      let i0 = 0; while (!stn[i0].cabin) i0++; let i1 = S - 1; while (!stn[i1].cabin) i1--;
      const fan = (list, pts) => { let cx = 0, cy = 0; for (const p of pts) { cx += p[0]; cy += p[1]; } const c = [cx / pts.length, cy / pts.length, pts[0][2]]; for (let k = 0; k < pts.length; k++) { const a = pts[k], b = pts[(k + 1) % pts.length]; tri(list, c, a, b); tri(list, c, b, a); } };
      for (const sx of [1, -1]) for (const i of [i0, i1]) { const pts = []; for (let j = 3; j <= 13; j++) pts.push(sx > 0 ? ring[i][j] : ring[i][RING - j]); fan(dB[sx], pts); fan(black, pts); }
    }
    const cap = (i, list, flip) => {
      const r = ring[i]; let cy = 0; for (const p of r) cy += p[1]; cy /= r.length; const c = [0, cy, r[0][2]];
      for (let j = 0; j < RING; j++) { const a = r[j], b = r[(j + 1) % RING]; if (flip) tri(list, c, b, a); else tri(list, c, a, b); }
    };
    cap(0, paint, true); cap(S - 1, black, false);
    const mk = (arr, ang) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3)); return U.crease(g, ang); };
    return { paint: mk(paint, 0.72), black: mk(black, 0.9), hood: { paint: mk(hood, 0.72), black: mk(hoodIn, 0.72) },
      door: { 1: { paint: mk(dP[1], 0.72), black: mk(dB[1], 0.9) }, '-1': { paint: mk(dP['-1'], 0.72), black: mk(dB['-1'], 0.9) } } };
  }
  /* lens that follows the body surface (headlights) */
  function lensPatch(sx, z0, z1, f0, f1, lift) {
    const NA = 9, NB = 6, pos = [], idx = [];
    for (let a = 0; a <= NA; a++) {
      const t = a / NA, z = z0 + (z1 - z0) * t, k = Math.sqrt(Math.sin(t * Math.PI * 0.5)), lo = U.lerp((f0 + f1) / 2, f0, k), hi = U.lerp((f0 + f1) / 2, f1, k);
      for (let b = 0; b <= NB; b++) { const p = surfPoint(z, lo + (hi - lo) * b / NB); pos.push(sx * (p[0] + lift * 0.4), p[1] + lift, z + lift * 0.5); }
    }
    for (let a = 0; a < NA; a++) for (let b = 0; b < NB; b++) {
      const v = a * (NB + 1) + b;
      if (sx > 0) idx.push(v, v + 1, v + NB + 1, v + 1, v + NB + 2, v + NB + 1); else idx.push(v, v + NB + 1, v + 1, v + 1, v + NB + 1, v + NB + 2);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    return g;
  }

  function wheelGeo() {
    const prof = [[0.25, -0.125], [0.302, -0.131], [0.338, -0.112], [0.35, -0.07], [0.35, 0.07], [0.338, 0.112], [0.302, 0.131], [0.25, 0.125]];
    const tire = new THREE.LatheGeometry(prof.map(p => new THREE.Vector2(p[0], p[1])), 36);
    tire.rotateZ(-Math.PI / 2);
    const rim = [], face = [];
    const barrel = new THREE.CylinderGeometry(0.252, 0.252, 0.235, 30, 1, true); barrel.rotateZ(Math.PI / 2); rim.push(barrel);
    const back = new THREE.CircleGeometry(0.252, 24); back.rotateY(Math.PI / 2); back.translate(-0.04, 0, 0); rim.push(back);
    const lip = new THREE.TorusGeometry(0.246, 0.011, 6, 32); lip.rotateY(Math.PI / 2); lip.translate(0.118, 0, 0); face.push(lip);
    for (let a = 0; a < 10; a++) { // concave ten-spoke face
      const g = new THREE.BoxGeometry(0.02, 0.2, 0.03); g.rotateZ(-0.25); g.translate(0.088, 0.148, 0);
      g.rotateX(a * Math.PI / 5); face.push(g);
    }
    const hub = new THREE.CylinderGeometry(0.05, 0.062, 0.05, 16); hub.rotateZ(-Math.PI / 2); hub.translate(0.066, 0, 0); face.push(hub);
    for (let a = 0; a < 5; a++) { const nut = new THREE.CylinderGeometry(0.008, 0.008, 0.012, 6); nut.rotateZ(-Math.PI / 2); nut.translate(0.094, 0.034, 0); nut.rotateX(a * Math.PI * 0.4 + 0.3); face.push(nut); }
    return { tire, rim: U.merge(rim), face: U.merge(face) };
  }

  G.buildCar = function (env, tex) {
    const M = {};
    M.paint = new THREE.MeshPhysicalMaterial({ color: 0xa60205, metalness: 0.0, roughness: 0.62, specularIntensity: 0.25, clearcoat: 1, clearcoatRoughness: 0.012, envMap: env, envMapIntensity: 0.4 });
    // candy paint: colour deepens towards grazing angles, metallic flakes sparkle under the clear coat
    M.paint.onBeforeCompile = sh => {
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vPP;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvPP = position;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vPP;')
        .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
{
  float pNV = saturate( dot( normal, normalize( vViewPosition ) ) );
  diffuseColor.rgb *= mix( 0.55, 1.0, pow( pNV, 0.7 ) );
  vec3 fp = floor( vPP * 2600.0 );
  vec3 fh = fract( sin( vec3( dot( fp, vec3( 12.9898, 78.233, 37.719 ) ), dot( fp, vec3( 39.346, 11.135, 83.155 ) ), dot( fp, vec3( 73.156, 52.235, 9.151 ) ) ) ) * 43758.5453 ) - 0.5;
  normal = normalize( normal + fh * ( 0.11 * smoothstep( 5.0, 1.2, length( vViewPosition ) ) ) );
}`);
    };
    M.black = new THREE.MeshStandardMaterial({ color: 0x0d0d0f, roughness: 0.55, metalness: 0.1, envMap: env, envMapIntensity: 0.6 });
    M.leather = new THREE.MeshStandardMaterial({ color: 0x121214, roughness: 0.48, metalness: 0.0, envMap: env, envMapIntensity: 0.7 });
    M.trim = new THREE.MeshStandardMaterial({ color: 0x08080a, roughness: 0.16, metalness: 0.5, envMap: env, envMapIntensity: 1.0 });
    M.chrome = new THREE.MeshStandardMaterial({ color: 0xe6e6e6, roughness: 0.1, metalness: 1, envMap: env, envMapIntensity: 0.5 });
    M.glass = new THREE.MeshStandardMaterial({ color: 0x1c262c, roughness: 0.03, metalness: 0.7, transparent: true, opacity: 0.3, envMap: env, envMapIntensity: 1.0, side: THREE.DoubleSide, depthWrite: false });
    M.tail = new THREE.MeshStandardMaterial({ color: 0x3a0103, emissive: 0xff1608, emissiveIntensity: 0.55, roughness: 0.2, envMap: env, envMapIntensity: 1 });
    M.head = new THREE.MeshStandardMaterial({ color: 0xaab2ba, emissive: 0xfff2dc, emissiveIntensity: 0.1, roughness: 0.05, metalness: 0.9, envMap: env, envMapIntensity: 1.2 });
    const tt = G.T.tire(); for (const t of [tt.map, tt.bump]) { t.repeat.set(5, 1); t.wrapT = THREE.ClampToEdgeWrapping; }
    M.tire = new THREE.MeshStandardMaterial({ color: 0x6a6a6c, map: tt.map, bumpMap: tt.bump, bumpScale: 2.2, roughness: 0.6, metalness: 0, envMap: env, envMapIntensity: 0.35, side: THREE.DoubleSide });
    G.tireMat = M.tire;
    M.rim = new THREE.MeshStandardMaterial({ color: 0x101113, roughness: 0.45, metalness: 0.8, envMap: env, envMapIntensity: 0.6, side: THREE.DoubleSide });
    M.rimFace = new THREE.MeshStandardMaterial({ color: 0x26282c, roughness: 0.26, metalness: 0.95, envMap: env, envMapIntensity: 0.9 });
    M.disc = new THREE.MeshStandardMaterial({ color: 0x2c2e31, roughness: 0.45, metalness: 0.9, envMap: env, envMapIntensity: 0.5 });
    M.caliper = new THREE.MeshStandardMaterial({ color: 0xb01010, roughness: 0.4, metalness: 0.3, envMap: env });
    M.blur = new THREE.MeshStandardMaterial({ color: 0x1b1c1f, roughness: 0.35, metalness: 0.9, envMap: env, envMapIntensity: 0.8, transparent: true, opacity: 0, depthWrite: false });
    M.plate = new THREE.MeshStandardMaterial({ map: G.T.plate('RDC 482'), roughness: 0.5, metalness: 0.1, envMap: env, envMapIntensity: 0.5 });

    // live reflections of the surroundings: (F0, strength, blur, alpha boost, fresnel power, use the smooth clear-coat normal)
    G.dynRefl(M.paint, 0.06, 1.5, 0.12, 0, 4.2, true); G.dynRefl(M.glass, 0.08, 1.5, 0.0, 0.9); G.dynRefl(M.chrome, 0.85, 1.1, 0.2);
    G.dynRefl(M.rimFace, 0.3, 0.85, 1.0); G.dynRefl(M.trim, 0.05, 1.0, 0.5); G.dynRefl(M.head, 0.5, 1.0, 0.3); G.dynRefl(M.tail, 0.06, 0.9, 0.8);
    G.dynRefl(M.leather, 0.02, 0.35, 3.0); G.dynRefl(M.disc, 0.1, 0.4, 3.0);
    const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
    const add = (g, m, parent) => { const ms = new THREE.Mesh(g, m); ms.castShadow = true; ms.receiveShadow = true; (parent || body).add(ms); return ms; };
    const P = [], Bk = [], Tr = [], Le = [], Ch = [], Tl = [], Hd = []; // geometry lists per material
    const bg = bodyGeometry();
    P.push(bg.paint); Bk.push(bg.black);
    const rb = (w, h, d, r, x, y, z, rx, ry, rz) => U.tf(U.roundedBox(w, h, d, r, 2), x, y, z, rx || 0, ry || 0, rz || 0);
    const bx = (w, h, d, x, y, z, rx, ry, rz) => U.tf(new THREE.BoxGeometry(w, h, d), x, y, z, rx || 0, ry || 0, rz || 0);

    // underbody, wheel-arch lips, sills
    Bk.push(bx(1.2, 0.14, 3.8, 0, 0.245, 0));
    Bk.push(bx(1.2, 0.48, 0.76, 0, 0.41, ZF - 0.02)); Bk.push(bx(1.2, 0.56, 0.8, 0, 0.45, ZR));
    for (const za of [ZF, ZR]) for (const sx of [-1, 1]) {
      const t = new THREE.TorusGeometry(RA + 0.012, 0.026, 8, 30, Math.PI); t.rotateY(Math.PI / 2); t.scale(0.75, 1, 1);
      P.push(U.tf(t, sx * (fW(za) - 0.022), WR, za));
    }
    for (const sx of [-1, 1]) {
      Tr.push(rb(0.06, 0.07, 1.72, 0.02, sx * 0.885, 0.185, 0.05));                         // sill
      Tr.push(rb(0.018, 0.085, 0.34, 0.008, sx * (fW(0.82) - 0.002), 0.5, 0.82));           // fender vent
      Ch.push(rb(0.02, 0.012, 0.3, 0.005, sx * (fW(0.82) + 0.004), 0.5, 0.82));
      Tr.push(bx(0.006, 0.46, 0.012, sx * (fW(ZC0) + 0.0005), 0.46, ZC0 + 0.002));           // door shut lines
      Tr.push(bx(0.006, 0.44, 0.012, sx * (fW(ZC1) + 0.0005), 0.44, ZC1 - 0.002));
    }
    // hood shut line, engine bay and engine (seen once the hood has gone)
    {
      const edge = z => section(z, false, 0)[JH];
      const across = z => { const h = section(z, false, 0), o = []; for (let j = JH; j < K; j++) o.push([-h[j][0], h[j][1], z]); for (let j = K - 2; j >= JH; j--) o.push([h[j][0], h[j][1], z]); return o; };
      const quad = (a, b, c, d) => { const p = []; for (const t of [[a, b, c], [a, c, d], [a, c, b], [a, d, c]]) for (const v of t) p.push(v[0], v[1], v[2]); const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.computeVertexNormals(); return g; };
      const YB = 0.305, NZ = 12;
      for (const sx of [-1, 1]) {
        const line = [];
        for (let k = 0; k <= NZ; k++) {
          const z = ZH0 + (ZH1 - ZH0) * k / NZ, e = edge(z); line.push(new THREE.Vector3(sx * e[0], e[1] + 0.0015, z));
          if (k < NZ) { const z1 = ZH0 + (ZH1 - ZH0) * (k + 1) / NZ, e1 = edge(z1); Bk.push(quad([sx * e[0], e[1] - 0.005, z], [sx * e1[0], e1[1] - 0.005, z1], [sx * e1[0], YB, z1], [sx * e[0], YB, z])); }
        }
        Tr.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(line), 40, 0.0035, 5, false));
      }
      for (const z of [ZH0, ZH1]) {
        const a = across(z);
        Tr.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(a.map(p => new THREE.Vector3(p[0], p[1] + 0.0015, p[2]))), 30, 0.0035, 5, false));
        for (let k = 0; k < a.length - 1; k++) Bk.push(quad([a[k][0], a[k][1] - 0.005, z], [a[k + 1][0], a[k + 1][1] - 0.005, z], [a[k + 1][0], YB, z], [a[k][0], YB, z]));
      }
      Bk.push(quad([-0.52, YB, ZH0], [0.52, YB, ZH0], [0.52, YB, ZH1], [-0.52, YB, ZH1]));
      Tr.push(bx(0.5, 0.3, 0.74, 0, 0.47, 1.22));                                              // engine block
      Tr.push(bx(0.78, 0.2, 0.05, 0, 0.43, 1.9));                                              // radiator
      Ch.push(rb(0.1, 0.05, 0.52, 0.02, 0, 0.645, 1.22));                                      // intake
      for (const sx of [-1, 1]) for (let k = 0; k < 4; k++) { const c = new THREE.CylinderGeometry(0.018, 0.018, 0.2, 8); c.rotateZ(Math.PI / 2); c.rotateY(sx * 0.5); Ch.push(U.tf(c, sx * 0.3, 0.52, 1.0 + k * 0.15)); } // headers
    }
    // nose: grille slats, splitter, headlights
    Tr.push(rb(1.16, 0.03, 0.16, 0.012, 0, 0.245, 2.15));
    for (const k of [0.335, 0.385, 0.435]) Tr.push(rb(1.0, 0.012, 0.02, 0.004, 0, k, 2.224));
    Ch.push(rb(0.9, 0.012, 0.016, 0.004, 0, 0.485, 2.226));
    for (const sx of [-1, 1]) {
      Hd.push(lensPatch(sx, 1.62, 2.09, 0.16, 0.5, 0.007));
      Tr.push(rb(0.24, 0.07, 0.03, 0.012, sx * 0.4, 0.33, 2.2));                             // outer intake
    }
    // tail: four round lamps in chrome bezels, plate recess, black valance with diffuser and four exhaust tips
    const lamp = (x, y, r) => {
      const z = ZT - 0.002;
      const cup = new THREE.CylinderGeometry(r + 0.016, r + 0.016, 0.028, 30); cup.rotateX(Math.PI / 2); Tr.push(U.tf(cup, x, y, z));
      Ch.push(U.tf(new THREE.TorusGeometry(r + 0.01, 0.0085, 8, 30), x, y, z - 0.014));
      const lens = new THREE.SphereGeometry(1, 26, 10, 0, Math.PI * 2, 0, Math.PI / 2); lens.rotateX(-Math.PI / 2);
      Tl.push(U.tf(lens, x, y, z - 0.012, 0, 0, 0, r, r, r * 0.3));
      Ch.push(U.tf(new THREE.TorusGeometry(r * 0.56, 0.0045, 6, 24), x, y, z - 0.012 - r * 0.25));
      const hubc = new THREE.SphereGeometry(1, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2); hubc.rotateX(-Math.PI / 2);
      Ch.push(U.tf(hubc, x, y, z - 0.012 - r * 0.27, 0, 0, 0, r * 0.2, r * 0.2, r * 0.12));
    };
    // one round lamp per corner at the end of a dark tapering vent, clean lid, plate on the body-colour centre,
    // black lower bumper with corner pods for the twin exhausts and a finned diffuser between them
    for (const sx of [-1, 1]) {
      lamp(sx * 0.625, 0.742, 0.08);
      { // dark vent tapering inwards from the lamp (flat plate, both windings)
        const xo = sx * 0.56, xi = sx * 0.25, z = ZT - 0.0125, q = [xo, 0.706, z, xo, 0.778, z, xi, 0.75, z, xi, 0.735, z], pp = [];
        for (const t of [[0, 1, 2], [0, 2, 3], [0, 2, 1], [0, 3, 2]]) for (const v of t) pp.push(q[v * 3], q[v * 3 + 1], q[v * 3 + 2]);
        const vg = new THREE.BufferGeometry(); vg.setAttribute('position', new THREE.Float32BufferAttribute(pp, 3));
        vg.setAttribute('normal', new THREE.Float32BufferAttribute(new Array(12).fill(0).flatMap(() => [0, 0, -1]), 3)); Tr.push(vg);
      }
      for (const f of [0.08, 0.14, 0.2]) Bk.push(bx(0.006, 0.05 - f * 0.12, 0.012, sx * (0.56 - f), 0.742, ZT - 0.014));     // vent slats
      Tl.push(rb(0.012, 0.03, 0.12, 0.005, sx * (fW(-1.93) + 0.001), 0.62, -1.93));          // side markers
      Tr.push(rb(0.46, 0.25, 0.1, 0.06, sx * 0.53, 0.325, ZT + 0.045));                      // corner pod
      for (const ox of [0.46, 0.585]) {
        const ex = new THREE.CylinderGeometry(0.047, 0.051, 0.16, 20, 1, true); ex.rotateX(Math.PI / 2); Ch.push(U.tf(ex, sx * ox, 0.3, ZT + 0.03));
        Ch.push(U.tf(new THREE.TorusGeometry(0.049, 0.006, 6, 20), sx * ox, 0.3, ZT - 0.05));
        const exIn = new THREE.CircleGeometry(0.045, 16); exIn.rotateY(Math.PI); Bk.push(U.tf(exIn, sx * ox, 0.3, ZT + 0.06));
      }
      Tl.push(rb(0.09, 0.018, 0.02, 0.006, sx * 0.53, 0.47, ZT - 0.004));                    // reflectors on the pods
      // trunk lid shut line following the deck surface
      const pts = [];
      for (let z = ZT + 0.07; z <= -1.02; z += 0.07) { const p = surfPoint(z, 0.5); pts.push(new THREE.Vector3(sx * p[0], p[1] + 0.0015, z)); }
      for (let f = 0.5; f <= 1.001; f += 0.05) { const p = surfPoint(-1.0, f); pts.push(new THREE.Vector3(sx * p[0], p[1] + 0.0015, -1.0)); }
      Tr.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, 0.0035, 5, false));
    }
    Tl.push(rb(0.3, 0.014, 0.022, 0.006, 0, 0.887, ZT - 0.002));                              // high brake light
    Tr.push(rb(0.37, 0.19, 0.03, 0.02, 0, 0.5, ZT + 0.006));                                  // plate backing
    const plate = new THREE.Mesh(U.tf(new THREE.PlaneGeometry(0.31, 0.155), 0, 0.5, ZT - 0.0105, 0, Math.PI, 0), M.plate); body.add(plate);
    for (const sx of [-1, 1]) Hd.push(rb(0.03, 0.012, 0.014, 0.004, sx * 0.09, 0.598, ZT - 0.008));  // plate lamps
    Tr.push(rb(1.5, 0.19, 0.16, 0.04, 0, 0.255, ZT + 0.09));                                  // lower valance
    for (const k of [-0.2, -0.1, 0, 0.1, 0.2]) Tr.push(bx(0.014, 0.1, 0.2, k, 0.2, ZT + 0.07));
    Hd.push(rb(0.1, 0.026, 0.02, 0.008, 0, 0.31, ZT + 0.004));                                // reverse lamp

    // cabin
    Le.push(rb(1.34, 0.18, 0.3, 0.07, 0, 0.77, 0.27));
    Le.push(rb(0.34, 0.1, 0.2, 0.04, 0.37, 0.86, 0.22));
    Le.push(rb(0.24, 0.2, 0.75, 0.05, 0, 0.56, -0.26));
    Ch.push(U.tf(new THREE.SphereGeometry(0.026, 10, 8), 0, 0.72, -0.1));
    Tr.push(U.tf(new THREE.CylinderGeometry(0.008, 0.008, 0.1, 6), 0, 0.67, -0.1));
    for (const sx of [-1, 1]) {
      const x = sx * 0.37;
      Le.push(rb(0.46, 0.14, 0.5, 0.06, x, 0.42, -0.28));
      Le.push(rb(0.46, 0.6, 0.13, 0.06, x, 0.72, -0.58, -0.2, 0, 0));
      Le.push(rb(0.25, 0.2, 0.1, 0.045, x, 1.04, -0.655, -0.14, 0, 0));
      for (const b of [-1, 1]) Le.push(rb(0.07, 0.5, 0.15, 0.03, x + b * 0.215, 0.7, -0.545, -0.2, 0, 0));
      const hoop = new THREE.TorusGeometry(0.135, 0.018, 8, 20, Math.PI); Ch.push(U.tf(hoop, x, 0.94, -0.752, -0.1, 0, 0));
    }

    // windshield
    const wsB = 0.52, wsT = 0.1, yB = fSh(wsB) - 0.006, yT = 1.21, xB = fW(wsB) - 0.165, xT = 0.66, yBc = surfPoint(wsB + 0.06, 1)[1] - 0.004;
    {
      const pts = [new THREE.Vector3(xB, yB, wsB), new THREE.Vector3(xT, yT, wsT), new THREE.Vector3(xT - 0.06, yT + 0.012, wsT - 0.012), new THREE.Vector3(-xT + 0.06, yT + 0.012, wsT - 0.012), new THREE.Vector3(-xT, yT, wsT), new THREE.Vector3(-xB, yB, wsB)];
      const path = new THREE.CurvePath();
      for (let k = 0; k < pts.length - 1; k++) path.add(new THREE.LineCurve3(pts[k], pts[k + 1]));
      Tr.push(new THREE.TubeGeometry(path, 40, 0.021, 6, false));
    }
    const glassPos = [], GX = 10, GY = 4;
    for (let b = 0; b <= GY; b++) for (let a = 0; a <= GX; a++) {
      const u = a / GX * 2 - 1, v = b / GY, hw = U.lerp(xB, xT, v) - 0.005;
      glassPos.push(u * hw, U.lerp(yB + (yBc - yB) * (1 - u * u), yT, v), U.lerp(wsB, wsT, v) + 0.07 * (1 - u * u) * (1 - v * 0.4));
    }
    const gIdx = [];
    for (let b = 0; b < GY; b++) for (let a = 0; a < GX; a++) { const v0 = b * (GX + 1) + a; gIdx.push(v0, v0 + 1, v0 + GX + 1, v0 + 1, v0 + GX + 2, v0 + GX + 1); }
    const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.Float32BufferAttribute(glassPos, 3)); gg.setIndex(gIdx); gg.computeVertexNormals();
    const glass = new THREE.Mesh(gg, M.glass); glass.renderOrder = 3; body.add(glass);
    Tr.push(rb(0.16, 0.05, 0.03, 0.012, 0, yT - 0.06, wsT + 0.05));
    for (const sx of [-1, 1]) { // mirrors
      P.push(rb(0.1, 0.085, 0.17, 0.036, sx * (xB + 0.2), yB + 0.085, wsB - 0.06, 0, sx * 0.22, 0));
      Tr.push(rb(0.16, 0.022, 0.05, 0.01, sx * (xB + 0.1), yB + 0.05, wsB - 0.05));
    }

    const strip = l => l.map(g => { const o = g.index ? g.toNonIndexed() : g; const r = new THREE.BufferGeometry(); r.setAttribute('position', o.attributes.position); r.setAttribute('normal', o.attributes.normal); return r; });
    const mergeN = l => {
      const s = strip(l); let n = 0; for (const g of s) n += g.attributes.position.count;
      const p = new Float32Array(n * 3), nm = new Float32Array(n * 3); let o = 0;
      for (const g of s) { p.set(g.attributes.position.array, o * 3); nm.set(g.attributes.normal.array, o * 3); o += g.attributes.position.count; }
      const r = new THREE.BufferGeometry(); r.setAttribute('position', new THREE.BufferAttribute(p, 3)); r.setAttribute('normal', new THREE.BufferAttribute(nm, 3)); return r;
    };
    add(mergeN(P), M.paint); add(mergeN(Bk), M.black); add(mergeN(Tr), M.trim); add(mergeN(Le), M.leather); add(mergeN(Ch), M.chrome);
    add(mergeN(Tl), M.tail); add(mergeN(Hd), M.head);
    add(mergeN([rb(0.15, 0.07, 0.66, 0.025, 0.14, 0.655, 1.22), rb(0.15, 0.07, 0.66, 0.025, -0.14, 0.655, 1.22)]), M.caliper);   // valve covers

    /* panels that can work loose: each hangs in its own group at its hinge (c: panel centre relative to the hinge) */
    const parts = {};
    const part = (name, px, py, pz, cx, cy, cz, sx, list) => {
      const g = new THREE.Group(); g.position.set(px, py, pz);
      for (const [geo, m] of list) add(geo.translate(-px, -py, -pz), m, g);
      body.add(g); parts[name] = { g, home: [px, py, pz], c: [cx - px, cy - py, cz - pz], sx };
    };
    part('hood', 0, fTop(ZH0) - 0.03, ZH0, 0, fTop(1.31) - 0.03, 1.31, 0, [[bg.hood.paint, M.paint], [bg.hood.black, M.black]]);   // hinged at the scuttle
    for (const sx of [1, -1]) part(sx > 0 ? 'doorL' : 'doorR', sx * (fW(ZC1) - 0.03), 0.5, ZC1 - 0.004, sx * (fW(-0.16) - 0.11), 0.55, -0.16, sx,
      [[bg.door[sx].paint, M.paint], [bg.door[sx].black, M.black], [rb(0.016, 0.02, 0.13, 0.007, sx * (fW(-0.45) + 0.003), 0.56, -0.45), M.chrome]]);   // hinged at the front edge

    // wheels
    const wg = wheelGeo(), wheels = [];
    for (const [sx, z, front] of [[1, ZF, true], [-1, ZF, true], [1, ZR, false], [-1, ZR, false]]) {
      const steer = new THREE.Group(); steer.position.set(sx * 0.815, WR, z); root.add(steer);
      const flip = new THREE.Group(); flip.scale.x = sx; steer.add(flip);
      const spin = new THREE.Group(); flip.add(spin);
      add(wg.tire, M.tire, spin); add(wg.rim, M.rim, spin); add(wg.face, M.rimFace, spin);
      const disc = new THREE.CylinderGeometry(0.19, 0.19, 0.02, 24); disc.rotateZ(Math.PI / 2); add(U.tf(disc, 0.03, 0, 0), M.disc, flip);
      add(rb(0.05, 0.1, 0.17, 0.02, 0.045, 0.085, -0.155, 0.5, 0, 0), M.caliper, flip);
      steer.userData.y0 = WR;
      const bl = new THREE.Mesh(new THREE.RingGeometry(0.066, 0.243, 36).rotateY(Math.PI / 2), M.blur); bl.position.x = 0.1; bl.renderOrder = 4; flip.add(bl);
      wheels.push({ steer, spin, front, sx, z });
    }
    return { root, body, wheels, M, parts };
  };

  G.wheelGeo = wheelGeo;
})();
