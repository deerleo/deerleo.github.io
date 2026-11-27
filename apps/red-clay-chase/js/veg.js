'use strict';
/* Vegetation: procedural tree / bush / grass geometry and instanced placement along the road. */
(function () {
  const U = G.U;
  const nV = U.makeNoise(77);

  /* ---------- geometry builder ---------- */
  class B {
    constructor() { this.p = []; this.n = []; this.u = []; this.c = []; this.w = []; this.i = []; }
    get count() { return this.p.length / 3; }
    v(x, y, z, nx, ny, nz, u, v, r, g, b, w) { this.p.push(x, y, z); this.n.push(nx, ny, nz); this.u.push(u, v); this.c.push(r, g, b); this.w.push(w); }
    /* leaf card: quad facing dir, shaded as part of a crown */
    card(cx, cy, cz, dx, dy, dz, half, roll, rect, shade, wind) {
      let ax = 0, ay = dz, az = -dy; // cross(dir, (1,0,0))
      let al = Math.hypot(ax, ay, az);
      if (al < 0.2) { ax = -dz; ay = 0; az = dx; al = Math.hypot(ax, ay, az); } // cross(dir,(0,1,0))
      ax /= al; ay /= al; az /= al;
      const bx = dy * az - dz * ay, by = dz * ax - dx * az, bz = dx * ay - dy * ax;
      const cr = Math.cos(roll), sr = Math.sin(roll);
      const ux = (ax * cr + bx * sr) * half, uy = (ay * cr + by * sr) * half, uz = (az * cr + bz * sr) * half;
      const vx = (-ax * sr + bx * cr) * half, vy = (-ay * sr + by * cr) * half, vz = (-az * sr + bz * cr) * half;
      const base = this.count, o = [0, 0, 0, 0, 0, 0];
      const cs = [[-1, -1, 0, 0], [1, -1, 1, 0], [1, 1, 1, 1], [-1, 1, 0, 1]];
      for (const k of cs) {
        const x = cx + ux * k[0] + vx * k[1], y = cy + uy * k[0] + vy * k[1], z = cz + uz * k[0] + vz * k[1];
        shade(x, y, z, o);
        this.v(x, y, z, o[0], o[1], o[2], rect[0] + (rect[2] - rect[0]) * k[2], rect[1] + (rect[3] - rect[1]) * k[3], o[3], o[4], o[5], wind);
      }
      this.i.push(base, base + 1, base + 2, base, base + 2, base + 3);
    }
    /* solid lumpy blob (icosahedron) */
    blob(cx, cy, cz, r, sy, rect, shade, wind, dark) {
      const g = new THREE.IcosahedronGeometry(1, 0), p = g.attributes.position, base = this.count, o = [0, 0, 0, 0, 0, 0];
      for (let k = 0; k < p.count; k++) {
        let x = p.getX(k), y = p.getY(k), z = p.getZ(k);
        const f = r * (1 + 0.22 * nV.n2(x * 2.3 + cx, (y + z) * 2.3 + cz));
        const wx = cx + x * f, wy = cy + y * f * sy, wz = cz + z * f;
        shade(wx, wy, wz, o);
        this.v(wx, wy, wz, o[0], o[1], o[2], rect[0] + (rect[2] - rect[0]) * (x * 0.5 + 0.5), rect[1] + (rect[3] - rect[1]) * (y * 0.5 + 0.5), o[3] * dark, o[4] * dark, o[5] * dark, wind);
        this.i.push(base + k);
      }
      g.dispose();
    }
    geo(g, rect, r, gg, b) {
      const p = g.attributes.position, n = g.attributes.normal, uv = g.attributes.uv, base = this.count;
      for (let k = 0; k < p.count; k++) {
        const u = Math.min(Math.max(uv.getX(k), 0), 1), v = Math.min(Math.max(uv.getY(k), 0), 1);
        this.v(p.getX(k), p.getY(k), p.getZ(k), n.getX(k), n.getY(k), n.getZ(k), rect[0] + (rect[2] - rect[0]) * u, rect[1] + (rect[3] - rect[1]) * v, r, gg, b, 0);
      }
      if (g.index) { const a = g.index.array; for (let k = 0; k < a.length; k++) this.i.push(base + a[k]); }
      else for (let k = 0; k < p.count; k++) this.i.push(base + k);
      g.dispose();
    }
    build() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(this.u, 2));
      g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
      g.setAttribute('aWind', new THREE.Float32BufferAttribute(this.w, 1));
      g.setIndex(this.i);
      return g;
    }
  }
  function crownShade(C, Rc, tint) {
    return function (x, y, z, o) {
      const dx = x - C[0], dy = y - C[1], dz = z - C[2], l = Math.hypot(dx, dy, dz) || 1, t = Math.min(1, l / Rc);
      let nx = dx / l, ny = dy / l + 0.42, nz = dz / l; const nl = Math.hypot(nx, ny, nz);
      const hf = U.clamp((dy / Rc + 1) * 0.5, 0, 1);
      const s = (0.34 + 0.66 * t * t) * (0.55 + 0.5 * hf);
      o[0] = nx / nl; o[1] = ny / nl; o[2] = nz / nl;
      o[3] = tint[0] * s * (1 + 0.14 * hf); o[4] = tint[1] * s; o[5] = tint[2] * s * (1 - 0.18 * hf);
    };
  }
  function trunk(h, rb, rt, rad, seg, bend, rnd) {
    const g = new THREE.CylinderGeometry(rt, rb, h, rad, seg, true);
    g.translate(0, h / 2, 0);
    const p = g.attributes.position, bx = (rnd() - 0.5) * bend, bz = (rnd() - 0.5) * bend;
    for (let k = 0; k < p.count; k++) {
      const y = p.getY(k), t = y / h;
      const flare = 1 + 0.4 * Math.pow(1 - t, 7);
      p.setXYZ(k, p.getX(k) * flare + bx * Math.sin(t * 2.4), y, p.getZ(k) * flare + bz * Math.sin(t * 2.0 + 0.5));
    }
    g.computeVertexNormals();
    return g;
  }
  function randUnit(rnd) { const u = rnd() * 2 - 1, a = rnd() * Math.PI * 2, s = Math.sqrt(1 - u * u); return [s * Math.cos(a), u, s * Math.sin(a)]; }

  /* ---------- tree models: returns {hi, lo} ---------- */
  function broadleaf(seed, o) {
    const rnd = U.rng(seed), A = G.T.ATLAS;
    const C = [0, o.trunkH + o.Rc * 0.42 * o.sy, 0], Rall = o.Rc * 1.25;
    const cl = [];
    for (let k = 0; k < o.n; k++) {
      let u; do { u = [rnd() * 2 - 1, rnd() * 2 - 1, rnd() * 2 - 1]; } while (u[0] * u[0] + u[1] * u[1] + u[2] * u[2] > 1);
      const r = o.Rc * (0.42 + 0.2 * rnd());
      const cards = [];
      for (let c = 0; c < 10; c++) {
        const ru = randUnit(rnd);
        let dx = u[0] * 0.9 + ru[0], dy = u[1] * 0.6 + ru[1] + 0.25, dz = u[2] * 0.9 + ru[2]; const l = Math.hypot(dx, dy, dz) || 1;
        cards.push([dx / l, dy / l, dz / l, rnd() * 6.28, 0.62 + rnd() * 0.3, 0.45 + rnd() * 0.25]);
      }
      cl.push({ x: u[0] * o.Rc * 0.74, y: C[1] + u[1] * o.Rc * 0.58 * o.sy, z: u[2] * o.Rc * 0.74, r, cards });
    }
    cl.push({ x: 0, y: C[1] + o.Rc * 0.1, z: 0, r: o.Rc * 0.6, cards: cl[0].cards });
    const sh = crownShade([C[0], C[1] - o.Rc * 0.15, C[2]], Rall * Math.max(1, o.sy * 0.85), [1, 1, 1]);
    const make = (hi) => {
      const b = new B();
      b.geo(trunk(o.trunkH + o.Rc * 0.5, o.rb, o.rb * 0.45, hi ? 8 : 5, hi ? 3 : 1, 0.5, U.rng(seed + 1)), A.bark, 0.62, 0.58, 0.54);
      if (hi) for (let k = 0; k < 3; k++) {
        const c = cl[k], g = new THREE.CylinderGeometry(0.05, 0.11, 1, 5, 1, true);
        const from = new THREE.Vector3(0, o.trunkH * 0.86, 0), to = new THREE.Vector3(c.x, c.y, c.z), d = to.clone().sub(from), len = d.length();
        g.translate(0, 0.5, 0); g.scale(1, len, 1);
        g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize())); g.translate(from.x, from.y, from.z);
        b.geo(g, A.bark, 0.56, 0.52, 0.48);
      }
      cl.forEach((c, ci) => {
        if (hi || ci % 2 === 0 || ci === cl.length - 1) b.blob(c.x, c.y, c.z, c.r * (hi ? 0.7 : 0.82), 0.9, A.fill, sh, 0.35, 0.8);
        const nc = hi ? 10 : 3;
        for (let k = 0; k < nc; k++) {
          const cd = c.cards[k], off = c.r * cd[5] * (hi ? 1 : 0.8), half = c.r * cd[4] * (hi ? 1.08 : 1.45);
          b.card(c.x + cd[0] * off, c.y + cd[1] * off, c.z + cd[2] * off, cd[0], cd[1], cd[2], half, cd[3], A.leaf, sh, 1);
        }
      });
      return b.build();
    };
    return { hi: make(true), lo: make(false) };
  }
  function pine(seed, o) {
    const rnd = U.rng(seed), A = G.T.ATLAS, H = o.h;
    const cl = [], levels = 5;
    for (let lv = 0; lv < levels; lv++) {
      const t = lv / (levels - 1), y = H * (0.56 + 0.4 * t), rad = o.spread * (1 - 0.72 * t), n = lv === levels - 1 ? 1 : 3, a0 = rnd() * 6.28;
      for (let k = 0; k < n; k++) {
        const a = a0 + k * 2.094 + (rnd() - 0.5) * 0.7, rr = n === 1 ? 0 : rad * (0.7 + rnd() * 0.4);
        const cards = [];
        for (let c = 0; c < 6; c++) { const ru = randUnit(rnd); let dx = ru[0] * 0.8, dy = Math.abs(ru[1]) + 0.55, dz = ru[2] * 0.8; const l = Math.hypot(dx, dy, dz); cards.push([dx / l, dy / l, dz / l, rnd() * 6.28, 0.8 + rnd() * 0.35, 0.3 + rnd() * 0.3]); }
        cl.push({ x: Math.cos(a) * rr, y: y + (rnd() - 0.5) * 0.8 - rr * 0.12, z: Math.sin(a) * rr, r: o.cr * (1.15 - 0.45 * t), cards });
      }
    }
    const C = [0, H * 0.76, 0], sh = crownShade(C, H * 0.3, [0.8, 0.9, 0.84]);
    const make = hi => {
      const b = new B();
      b.geo(trunk(H * 0.98, o.rb, o.rb * 0.34, hi ? 7 : 5, hi ? 3 : 1, 0.7, U.rng(seed + 1)), A.bark, 0.74, 0.6, 0.5);
      cl.forEach((c, ci) => {
        if (hi && c.x !== 0) {
          const g = new THREE.CylinderGeometry(0.03, 0.06, 1, 4, 1, true), from = new THREE.Vector3(0, c.y - 0.5, 0), to = new THREE.Vector3(c.x, c.y, c.z), d = to.clone().sub(from), len = d.length();
          g.translate(0, 0.5, 0); g.scale(1, len, 1); g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize())); g.translate(from.x, from.y, from.z);
          b.geo(g, A.bark, 0.6, 0.5, 0.42);
        }
        if (hi || ci % 3 === 0) b.blob(c.x, c.y, c.z, c.r * 0.7, 0.55, A.fill, sh, 0.35, 0.72);
        const nc = hi ? 5 : 2;
        for (let k = 0; k < nc; k++) {
          const cd = c.cards[k], off = c.r * cd[5], half = c.r * cd[4] * (hi ? 1.05 : 1.5);
          b.card(c.x + cd[0] * off, c.y + cd[1] * off * 0.5, c.z + cd[2] * off, cd[0], cd[1], cd[2], half, cd[3], A.pine, sh, 1);
        }
      });
      return b.build();
    };
    return { hi: make(true), lo: make(false) };
  }
  function bush(seed) {
    const rnd = U.rng(seed), A = G.T.ATLAS, b = new B();
    const sh = crownShade([0, 0.5, 0], 1.7, [1, 1, 1]);
    for (let k = 0; k < 3; k++) {
      const a = rnd() * 6.28, rr = k === 0 ? 0 : 0.5 + rnd() * 0.4, x = Math.cos(a) * rr, z = Math.sin(a) * rr, r = 0.7 + rnd() * 0.35, y = r * 0.75;
      b.blob(x, y * 0.85, z, r * 0.5, 0.85, A.fill, sh, 0.3, 0.8);
      for (let c = 0; c < 8; c++) {
        const ru = randUnit(rnd); let dx = ru[0], dy = Math.abs(ru[1]) * 0.9 + 0.2, dz = ru[2]; const l = Math.hypot(dx, dy, dz);
        b.card(x + dx / l * r * 0.42, y + dy / l * r * 0.42, z + dz / l * r * 0.42, dx / l, dy / l, dz / l, r * (0.7 + rnd() * 0.3), rnd() * 6.28, A.leaf, sh, 0.8);
      }
    }
    return b.build();
  }
  function grassTuft() {
    const p = [], n = [], u = [], c = [], w = [], idx = [];
    for (let k = 0; k < 3; k++) {
      const a = k * Math.PI / 3 + 0.2, cx = Math.cos(a) * 0.55, cz = Math.sin(a) * 0.55, b = k * 4;
      const ox = Math.cos(a + 1.57) * 0.12 * (k - 1), oz = Math.sin(a + 1.57) * 0.12 * (k - 1);
      for (const [sx, sy] of [[-1, 0], [1, 0], [1, 1], [-1, 1]]) {
        p.push(cx * sx + ox + (sy ? Math.cos(a + 1.57) * 0.16 : 0), sy * 0.8, cz * sx + oz + (sy ? Math.sin(a + 1.57) * 0.16 : 0));
        n.push(0, 1, 0); u.push(sx * 0.5 + 0.5, 1 - sy); const s = 0.7 + 0.3 * sy; c.push(s, s, s); w.push(sy);
      }
      idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(n, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(u, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(c, 3));
    g.setAttribute('aWind', new THREE.Float32BufferAttribute(w, 1)); g.setIndex(idx);
    return g;
  }

  /* ---------- materials ---------- */
  function foliageMaterial(map, amp, alphaTest, back) {
    const m = new THREE.MeshLambertMaterial({ map, alphaTest, vertexColors: true, side: THREE.DoubleSide, alphaToCoverage: true });
    m.customProgramCacheKey = () => 'fol' + amp + '_' + back; // constants are baked into the shader
    m.onBeforeCompile = sh => {
      sh.uniforms.uTime = G.uTime; sh.uniforms.uSunV = G.uSunV; sh.uniforms.uSunCol = G.uSunCol;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aWind;\nuniform float uTime;')
        .replace('#include <begin_vertex>', `#include <begin_vertex>
#ifdef USE_INSTANCING
  vec3 ip = instanceMatrix[3].xyz;
#else
  vec3 ip = vec3(0.0);
#endif
float ph = ip.x * 0.37 + ip.z * 0.23;
float wv = sin(uTime * 1.3 + ph + position.y * 0.3) * 0.6 + sin(uTime * 3.1 + ph * 1.7 + position.x * 1.1 + position.z * 0.7) * 0.3;
transformed.x += wv * aWind * ${amp.toFixed(3)};
transformed.z += cos(uTime * 1.1 + ph * 1.3 + position.y * 0.4) * aWind * ${(amp * 0.7).toFixed(3)};`);
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 uSunV;\nuniform vec3 uSunCol;')
        .replace('#include <normal_fragment_begin>', '#include <normal_fragment_begin>\nnormal = normalize(vNormal);')
        .replace('#include <opaque_fragment>', `float bl = pow(max(dot(-normalize(vViewPosition), uSunV), 0.0), 3.0);
outgoingLight += diffuseColor.rgb * uSunCol * (bl * ${back.toFixed(2)});
#include <opaque_fragment>`);
    };
    return m;
  }

  /* ---------- placement ---------- */
  G.buildVegetation = function (scene, tex) {
    const R = G.road, N = R.N, DS = R.DS, CH = G.CH;
    const mats = G.mats;
    mats.tree = foliageMaterial(tex.foliage, 0.07, 0.4, 0.22);
    mats.grass = foliageMaterial(tex.blades, 0.09, 0.3, 0.08);
    mats.tree.color.setRGB(0.62, 0.68, 0.5); mats.grass.color.setRGB(0.66, 0.66, 0.46);
    mats.treeDepth = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: tex.foliage, alphaTest: 0.4, side: THREE.DoubleSide });
    const models = [
      broadleaf(1001, { trunkH: 4.4, Rc: 4.3, sy: 0.85, n: 8, rb: 0.2 }),
      broadleaf(1002, { trunkH: 6.2, Rc: 3.5, sy: 1.45, n: 8, rb: 0.18 }),
      broadleaf(1003, { trunkH: 5.2, Rc: 3.9, sy: 1.1, n: 7, rb: 0.19 }),
      pine(2001, { h: 16.5, spread: 3.0, cr: 1.75, rb: 0.19 }),
      pine(2002, { h: 13.5, spread: 2.6, cr: 1.6, rb: 0.17 }),
    ];
    const bushGeo = bush(3001), tuft = grassTuft();
    const dummy = new THREE.Object3D(), col = new THREE.Color();
    const f = {}, info = {};
    G.colliders = new Map();
    const addCol = (x, z, r) => { const k = Math.floor(x / 8) + ',' + Math.floor(z / 8); let l = G.colliders.get(k); if (!l) { l = []; G.colliders.set(k, l); } l.push(x, z, r); };
    G.addCollider = addCol;
    function inst(geo, mat, list, shadow, depth) {
      const m = new THREE.InstancedMesh(geo, mat, list.length);
      for (let k = 0; k < list.length; k++) {
        const t = list[k];
        dummy.position.set(t[0], t[1], t[2]); dummy.rotation.set(t[7] || 0, t[3], t[8] || 0); dummy.scale.set(t[4], t[5], t[4]); dummy.updateMatrix();
        m.setMatrixAt(k, dummy.matrix); col.setRGB(t[6][0], t[6][1], t[6][2]); m.setColorAt(k, col);
      }
      m.instanceMatrix.needsUpdate = true; m.instanceColor.needsUpdate = true;
      m.castShadow = !!shadow; m.receiveShadow = true; m.matrixAutoUpdate = false;
      if (depth) m.customDepthMaterial = depth;
      m.computeBoundingSphere();
      scene.add(m);
      return m;
    }
    let nTrees = 0, nGrass = 0;
    for (const ch of G.chunks) {
      const rnd = U.rng(5000 + ch.i0);
      const near = models.map(() => []), far = models.map(() => []), bushes = [], grass = [];
      const s0 = ch.i0 * DS, len = CH * DS;
      for (const side of [-1, 1]) {
        // trees
        for (let a = 0; a < len; a += 5) for (let dd = (side < 0 ? 12.5 : 9.5); dd < 76; dd += 5.2) {
          const s = s0 + a + rnd() * 4.6, d = side * (dd + rnd() * 4.6);
          const r1 = rnd(), r2 = rnd(), r3 = rnd(), r4 = rnd(), r5 = rnd();
          R.frame(s, f);
          const x = f.x + f.rx * d, z = f.z + f.rz * d;
          const h = G.terrain(x, z, f.i, info);
          if (info.clay > 0.12 || Math.abs(info.d) < 9.5 || (h < R.river.wy + 0.5 && R.riverDist(x, z) < 30)) continue;
          const fm = G.forest(x, z, info.s, info.dm);
          if (r1 > (fm < 0.25 ? (Math.abs(d) < 24 ? 0.2 : 0.03) : fm) * (Math.abs(d) < 40 ? 0.86 : 0.64)) continue;
          if (Math.abs(G.terrain(x + f.rx * side * 1.2, z + f.rz * side * 1.2, f.i) - h) > 1.3) continue;
          let dv = false; for (const dr of R.drives) if (dr.side === side && Math.abs(R.dS(s, dr.s)) < 4.2 && Math.abs(d) < 46) dv = true; if (dv) continue;
          const pf = U.smooth(-0.12, 0.3, nV.n2(x / 170, z / 170)) * 0.62 + 0.14;
          let type = r2 < pf ? (r3 < 0.6 ? 3 : 4) : (r3 < 0.4 ? 0 : r3 < 0.72 ? 1 : 2);
          let sc = 0.82 + r4 * 0.52;
          if (type < 3 && r5 < 0.16) sc *= 0.5; // understory
          if (Math.abs(d) < 15) sc *= 0.86;
          const sy = sc * (0.9 + rnd() * 0.3);
          let tint;
          if (type >= 3) { const v = 0.82 + rnd() * 0.3; tint = [v * 0.95, v, v * 0.95]; }
          else { const v = 0.8 + rnd() * 0.36, yel = rnd(); tint = [v * (0.9 + yel * 0.32), v * (0.96 + yel * 0.08), v * (0.82 - yel * 0.22)]; }
          const t = [x, h - 0.25, z, rnd() * 6.28, sc, sy, tint, (rnd() - 0.5) * 0.06, (rnd() - 0.5) * 0.06];
          (Math.abs(d) < 40 ? near : far)[type].push(t);
          addCol(x, z, 0.3 * sc + 0.1);
          nTrees++;
        }
        // bushes along the forest edge and cut rims
        for (let a = 0; a < len; a += 3.4) for (let dd = 7.9; dd < 26; dd += 3.6) {
          const r1 = rnd(), s = s0 + a + rnd() * 3.2, d = side * (dd + rnd() * 3.4);
          if (r1 > 0.34) continue;
          R.frame(s, f); const x = f.x + f.rx * d, z = f.z + f.rz * d, h = G.terrain(x, z, f.i, info);
          if (info.clay > 0.25 || info.dirt > 0.8 || Math.abs(info.d) < 7.9 || (h < R.river.wy + 0.3 && R.riverDist(x, z) < 30)) continue;
          const fm = G.forest(x, z, info.s, info.dm); if (rnd() > fm * 0.9 + 0.08) continue;
          const sc = 0.7 + rnd() * 0.9, v = 0.75 + rnd() * 0.35, yel = rnd();
          bushes.push([x, h - 0.12, z, rnd() * 6.28, sc, sc * (0.8 + rnd() * 0.4), [v * (0.9 + yel * 0.25), v, v * (0.8 - yel * 0.15)]]);
        }
        // tall grass on the shoulders
        const pw = R.pastureW(s0 + len / 2, side);
        const n0 = 1250, n1 = n0 + (pw > 0.5 ? 500 : 0), fkO = R.off[R.wrapI(ch.i0 + (CH >> 1))], ng = n1 + (fkO * side > 12 ? 1250 : 0);
        for (let k = 0; k < ng; k++) {
          const s = s0 + rnd() * len, rr = rnd(); let d = side * (k < n0 ? 5.0 + rr * rr * 15 : 9 + rr * 34);
          const r1 = rnd(), r2 = rnd(), r3 = rnd(), r4 = rnd(), r5 = rnd();
          R.frame(s, f);
          if (k >= n1) d = R.off[f.i] + (r1 < 0.5 ? -1 : 1) * (5.0 + rr * rr * 15); // shoulders of the side road
          const x = f.x + f.rx * d, z = f.z + f.rz * d, h = G.terrain(x, z, f.i, info);
          if (info.clay > 0.2 || Math.abs(info.d) < 4.9) continue;
          if (info.dirt > 0.25 && r1 < info.dirt * 1.2 - 0.06) continue;
          if (h < R.river.wy + 0.15 && R.riverDist(x, z) < 30) continue;
          const dry = U.clamp(0.42 + nV.n2(x * 0.05, z * 0.05) * 1.2 + (r2 - 0.5) * 0.5, 0, 1), v = 0.72 + r3 * 0.22;
          const tall = r4 < 0.18 ? 1.7 : 1, sc = (0.55 + r5 * 0.6) * (Math.abs(info.d) < 6.5 ? 0.7 : 1);
          grass.push([x, h - 0.06, z, rnd() * 6.28, sc, sc * (0.6 + rnd() * 0.6) * tall, [v * (0.94 + dry * 0.3), v * (0.98 + dry * 0.1), v * (0.92 - dry * 0.14)]]);
          nGrass++;
        }
      }
      models.forEach((m, k) => {
        if (near[k].length) { ch.hi.push(inst(m.hi, mats.tree, near[k], true, mats.treeDepth)); const lo = inst(m.lo, mats.tree, near[k], true, mats.treeDepth); lo.visible = false; ch.lo.push(lo); }
        if (far[k].length) ch.objs.push(inst(m.lo, mats.tree, far[k], false, null));
      });
      if (bushes.length) ch.objs.push(inst(bushGeo, mats.tree, bushes, true, mats.treeDepth));
      if (grass.length) ch.near.push(inst(tuft, mats.grass, grass, false, null));
    }
    G.stats.trees = nTrees; G.stats.grass = nGrass;
  };
})();
