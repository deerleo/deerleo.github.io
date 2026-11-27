'use strict';
/* Driver and passenger: lofted bodies, anatomical limbs with hands, sculpted heads, strand hair, cloth/skin
   shading, two-bone IK and a small animation system. Car space: +Z forward, +Y up, +X left. */
(function () {
  const U = G.U;
  /* colour + surface kind (0 skin, 1 cloth, 2 short hair) */
  const col = (hex, kind) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b, kind || 0]; };
  const pc = (g, c) => {
    const o = g.index ? g.toNonIndexed() : g, n = o.attributes.position.count, cl = new Float32Array(n * 3), k = new Float32Array(n).fill(c[3]);
    for (let i = 0; i < n; i++) { cl[i * 3] = c[0]; cl[i * 3 + 1] = c[1]; cl[i * 3 + 2] = c[2]; }
    o.setAttribute('color', new THREE.BufferAttribute(cl, 3)); o.setAttribute('aCl', new THREE.BufferAttribute(k, 1));
    return o;
  };
  function mergeP(list) {
    let n = 0; for (const g of list) n += g.attributes.position.count;
    const p = new Float32Array(n * 3), nm = new Float32Array(n * 3), c = new Float32Array(n * 3), k = new Float32Array(n); let o = 0;
    for (const g of list) { const m = g.attributes.position.count; p.set(g.attributes.position.array, o * 3); nm.set(g.attributes.normal.array, o * 3); c.set(g.attributes.color.array, o * 3); k.set(g.attributes.aCl.array, o); o += m; }
    const r = new THREE.BufferGeometry();
    r.setAttribute('position', new THREE.BufferAttribute(p, 3)); r.setAttribute('normal', new THREE.BufferAttribute(nm, 3));
    r.setAttribute('color', new THREE.BufferAttribute(c, 3)); r.setAttribute('aCl', new THREE.BufferAttribute(k, 1));
    return r;
  }
  const Y = new THREE.Vector3(0, 1, 0), ZA = new THREE.Vector3(0, 0, 1), XA = new THREE.Vector3(1, 0, 0);

  /* stacked ellipses: rings = [y, rx, rz, zc, colour] */
  function loft(rings, seg, capBottom, capTop) {
    const pos = [], colr = [], kind = [], idx = [], rows = [];
    const row = r => { const b = pos.length / 3; for (let k = 0; k < seg; k++) { const a = k / seg * Math.PI * 2; pos.push(r[1] * Math.cos(a), r[0], r[3] + r[2] * Math.sin(a)); colr.push(r[4][0], r[4][1], r[4][2]); kind.push(r[4][3]); } return b; };
    for (let i = 0; i < rings.length; i++) {
      const a = row(rings[i]);
      if (i > 0) { const p = rows[rows.length - 1]; for (let k = 0; k < seg; k++) { const k2 = (k + 1) % seg; idx.push(p + k, a + k, p + k2, p + k2, a + k, a + k2); } }
      rows.push(a);
      if (i < rings.length - 1 && rings[i + 1][4] !== rings[i][4]) { const r2 = rings[i].slice(); r2[4] = rings[i + 1][4]; rows.push(row(r2)); }
    }
    const cap = (r, b, up) => { const c = pos.length / 3; pos.push(0, r[0], r[3]); colr.push(r[4][0], r[4][1], r[4][2]); kind.push(r[4][3]); for (let k = 0; k < seg; k++) { const k2 = (k + 1) % seg; if (up) idx.push(c, b + k2, b + k); else idx.push(c, b + k, b + k2); } };
    if (capBottom !== false) cap(rings[0], rows[0], false);
    if (capTop !== false) cap(rings[rings.length - 1], rows[rows.length - 1], true);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(colr, 3)); g.setAttribute('aCl', new THREE.Float32BufferAttribute(kind, 1));
    g.setIndex(idx); g.computeVertexNormals();
    return g.toNonIndexed();
  }
  /* limb along +Y with a radius profile [[t, r, colour]...], rounded ends */
  function limb(len, prof, flat) {
    const parts = [loft(prof.map(p => [p[0] * len, p[1], p[1] * (flat || 1), 0, p[2]]), 14, false, false)];
    const a = prof[0], b = prof[prof.length - 1];
    parts.push(pc(U.tf(new THREE.SphereGeometry(1, 14, 10), 0, 0, 0, 0, 0, 0, a[1], a[1], a[1] * (flat || 1)), a[2]));
    parts.push(pc(U.tf(new THREE.SphereGeometry(1, 14, 10), 0, len, 0, 0, 0, 0, b[1], b[1], b[1] * (flat || 1)), b[2]));
    return mergeP(parts);
  }
  /* hand: fingers along +Y, palm faces +Z, thumb on +X. curl 0 = open, 1 = fist/grip */
  function handGeo(s, curl, skin) {
    const parts = [], fr = 0.0092 * s;
    parts.push(pc(U.tf(U.roundedBox(0.078 * s, 0.092 * s, 0.027 * s, 0.012 * s, 2), 0, 0.046 * s, 0), skin));
    const seg = (len, r, ang, bx, by, bz) => {
      const c = new THREE.CylinderGeometry(r * 0.9, r, len, 7, 1, true); c.translate(0, len / 2, 0);
      const sp = new THREE.SphereGeometry(r * 0.92, 7, 5); sp.translate(0, len, 0);
      for (const g of [c, sp]) { g.rotateX(ang); g.translate(bx, by, bz); parts.push(pc(g, skin)); }
      return [bx, by + Math.cos(ang) * len, bz + Math.sin(ang) * len];
    };
    const fx = [-0.029, -0.0098, 0.0098, 0.029], fl = [0.06, 0.07, 0.066, 0.052];
    for (let i = 0; i < 4; i++) {
      const a1 = 0.12 + curl * 1.25, a2 = a1 + 0.15 + curl * 1.3, a3 = a2 + 0.1 + curl * 0.9, l = fl[i] * s;
      let t = seg(l * 0.46, fr, a1, fx[i] * s, 0.09 * s, 0); t = seg(l * 0.32, fr * 0.92, a2, t[0], t[1], t[2]); seg(l * 0.26, fr * 0.85, a3, t[0], t[1], t[2]);
    }
    const th = new THREE.CylinderGeometry(fr * 0.95, fr * 1.2, 0.055 * s, 7, 1, true); th.translate(0, 0.0275 * s, 0);
    const ts = new THREE.SphereGeometry(fr * 0.95, 7, 5); ts.translate(0, 0.055 * s, 0);
    for (const g of [th, ts]) { g.rotateX(0.3 + curl * 0.7); g.rotateZ(-0.75 + curl * 0.3); g.translate(0.036 * s, 0.03 * s, 0.004 * s); parts.push(pc(g, skin)); }
    return mergeP(parts);
  }
  function headGeo(o) {
    const parts = [], rx = o.rx, ry = o.ry, rz = o.rz;
    const h = new THREE.SphereGeometry(1, 36, 28), p = h.attributes.position, n = p.count, cl = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i), ax = Math.abs(x), dn = Math.max(0, -y);
      let sx = 1 - 0.36 * Math.pow(dn, 1.7), sz = 1 - 0.2 * Math.pow(dn, 1.7);
      if (z < 0) sz *= 1.05 + 0.07 * Math.max(0, y);
      let px = x * sx * rx, pz = z * sz * rz; const py = y * ry;
      let c = o.skin, shade = 1;
      if (z > 0.15) {
        const f = U.smooth(0.15, 0.7, z);
        pz += f * rz * (0.21 * Math.exp(-Math.pow(x / 0.14, 2) - Math.pow((y + 0.13) / 0.19, 2))
          + 0.07 * Math.exp(-Math.pow(x / 0.11, 2) - Math.pow((y - 0.1) / 0.17, 2))
          + 0.045 * Math.exp(-Math.pow((y - 0.23) / 0.07, 2)) * U.smooth(0.75, 0.5, ax)
          - 0.075 * Math.exp(-Math.pow((ax - 0.38) / 0.17, 2) - Math.pow((y - 0.07) / 0.09, 2))
          + 0.05 * Math.exp(-Math.pow(x / 0.26, 2) - Math.pow((y + 0.47) / 0.07, 2))
          + 0.1 * Math.exp(-Math.pow(x / 0.3, 2) - Math.pow((y + 0.82) / 0.17, 2)));
        if (Math.exp(-Math.pow(x / 0.25, 2) - Math.pow((y + 0.47) / 0.05, 2)) > 0.55 && z > 0.5) c = o.lips;
        if (Math.pow((ax - 0.38) / 0.2, 2) + Math.pow((y - 0.25) / 0.04, 2) < 1 && z > 0.45) c = o.brow;
        shade = 1 - 0.1 * Math.exp(-Math.pow((ax - 0.38) / 0.2, 2) - Math.pow((y - 0.07) / 0.1, 2));
      }
      if (o.stubble && y < -0.18 && z > -0.3 && c === o.skin) shade *= 1 - 0.2 * U.smooth(-0.18, -0.5, y) * U.smooth(-0.3, 0.1, z);
      p.setXYZ(i, px, py, pz);
      cl[i * 3] = c[0] * shade; cl[i * 3 + 1] = c[1] * shade * (c === o.skin && shade < 1 ? 0.97 : 1); cl[i * 3 + 2] = c[2] * shade;
    }
    h.setAttribute('color', new THREE.BufferAttribute(cl, 3)); h.setAttribute('aCl', new THREE.BufferAttribute(new Float32Array(n), 1));
    h.computeVertexNormals(); parts.push(h.toNonIndexed());
    for (const s of [-1, 1]) parts.push(pc(U.tf(new THREE.SphereGeometry(1, 10, 8), s * rx * 0.985, -ry * 0.04, -rz * 0.1, 0, s * 0.35, 0, 0.011, 0.03, 0.019), o.skin));
    if (o.glasses) {
      const gc = col(0x0b0b0d, 1), fm = col(o.frame || 0x101012, 1);
      for (const s of [-1, 1]) {
        parts.push(pc(U.tf(U.roundedBox(rx * 0.74, ry * 0.4, 0.012, 0.012, 2), s * rx * 0.42, ry * 0.09, rz * 0.985, 0.06, s * -0.14, 0), gc));
        parts.push(pc(U.tf(new THREE.BoxGeometry(0.006, 0.008, rz * 1.0), s * rx * 0.95, ry * 0.12, rz * 0.45), fm));
      }
      parts.push(pc(U.tf(new THREE.BoxGeometry(rx * 0.3, 0.007, 0.008), 0, ry * 0.16, rz * 1.03), fm));
    }
    // hair cap with some volume and an uneven edge
    const cap = new THREE.SphereGeometry(1, 30, 18, 0, Math.PI * 2, 0, o.capAngle), cp = cap.attributes.position, nz = U.makeNoise(o.seed || 5);
    cap.rotateX(-o.capTilt);
    for (let i = 0; i < cp.count; i++) {
      const x = cp.getX(i), y = cp.getY(i), z = cp.getZ(i);
      const vol = 1.07 + (o.volume || 0.05) * Math.max(0, y) + 0.035 * nz.n2(x * 4 + 3, (y + z) * 4) + (o.quiff || 0) * U.smooth(0.2, 0.9, z) * Math.max(0, y);
      cp.setXYZ(i, x * rx * vol, y * ry * vol + 0.004, z * rz * (vol + 0.02) - 0.004);
    }
    cap.computeVertexNormals(); parts.push(pc(cap, o.hair));
    return mergeP(parts);
  }

  /* long hair: a dozen locks, each a flattened tube bent in the vertex shader between gravity and wind */
  function hairGeo(o) {
    const NS = 11, NA = 6, pos = [], dat = [], nor = [], root = [], lk = [], idx = [], rnd = U.rng(71);
    for (let l = 0; l < o.locks; l++) {
      const th = (l / (o.locks - 1) - 0.5) * 3.9 + (rnd() - 0.5) * 0.2, len = o.len * (0.72 + rnd() * 0.36) * (1 - 0.18 * Math.abs(th) / 2), w = 0.03 + rnd() * 0.014;
      const rxp = Math.sin(th) * o.rx * 0.97, ryp = o.y0 + rnd() * 0.03 + Math.abs(Math.sin(th)) * 0.012, rzp = -Math.cos(th) * o.rz * 0.94, ph = rnd() * 6.28, sh = 0.8 + rnd() * 0.4, b = pos.length / 3;
      for (let i = 0; i <= NS; i++) {
        const t = i / NS, rw = w * (0.55 + 0.45 * Math.sin(Math.min(1, t * 2.5) * Math.PI / 2)) * (1 - 0.6 * t * t), rt = 0.012 * (1 - 0.6 * t);
        for (let k = 0; k < NA; k++) {
          const a = k / NA * Math.PI * 2, cx = Math.cos(a), sn = Math.sin(a);
          pos.push(rxp + rw * cx, ryp - t * len, rzp + rt * sn); dat.push(rw * cx, rt * sn, t); nor.push(cx * rt, sn * rw, 0); root.push(rxp, ryp, rzp); lk.push(len, ph, sh);
        }
      }
      for (let i = 0; i < NS; i++) for (let k = 0; k < NA; k++) { const a = b + i * NA + k, c = b + i * NA + (k + 1) % NA; idx.push(a, a + NA, c, c, a + NA, c + NA); }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aHair', new THREE.Float32BufferAttribute(dat, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('aRoot', new THREE.Float32BufferAttribute(root, 3)); g.setAttribute('aLk', new THREE.Float32BufferAttribute(lk, 3));
    g.setIndex(idx); g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1);
    return g;
  }
  const NOISE = `
float pH( vec3 p ) { return fract( sin( dot( p, vec3( 127.1, 311.7, 74.7 ) ) ) * 43758.5453 ); }
float pN( vec3 p ) { vec3 i = floor( p ), f = fract( p ); f = f * f * ( 3.0 - 2.0 * f );
  return mix( mix( mix( pH( i ), pH( i + vec3( 1, 0, 0 ) ), f.x ), mix( pH( i + vec3( 0, 1, 0 ) ), pH( i + vec3( 1, 1, 0 ) ), f.x ), f.y ),
              mix( mix( pH( i + vec3( 0, 0, 1 ) ), pH( i + vec3( 1, 0, 1 ) ), f.x ), mix( pH( i + vec3( 0, 1, 1 ) ), pH( i + vec3( 1, 1, 1 ) ), f.x ), f.y ), f.z ); }`;
  function hairMaterial(hex, env) {
    const m = new THREE.MeshStandardMaterial({ color: hex, roughness: 0.4, metalness: 0.0, envMap: env, envMapIntensity: 0.6, side: THREE.DoubleSide });
    const u = m.userData.u = { uHW: { value: new THREE.Vector3(0, 0, -1) }, uHG: { value: new THREE.Vector3(0, -1, 0) }, uHS: { value: 0 }, uHM: { value: new THREE.Matrix4() }, uHMi: { value: new THREE.Matrix4() } };
    m.onBeforeCompile = sh => {
      sh.uniforms.uHW = u.uHW; sh.uniforms.uHG = u.uHG; sh.uniforms.uHS = u.uHS; sh.uniforms.uTime = G.uTime; sh.uniforms.uHM = u.uHM; sh.uniforms.uHMi = u.uHMi;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', `#include <common>
uniform mat4 uHM; uniform mat4 uHMi;
attribute vec3 aHair; attribute vec3 aRoot; attribute vec3 aLk; uniform vec3 uHW; uniform vec3 uHG; uniform float uHS; uniform float uTime; varying vec3 vHr;`)
        .replace('#include <beginnormal_vertex>', `float ht = aHair.z, hStr = uHS * ( 0.85 + 0.3 * sin( aLk.y * 3.0 ) );
vec3 hD = normalize( mix( uHG, uHW, clamp( hStr * ( 0.15 + 0.85 * ht ), 0.0, 0.96 ) ) );
vec3 hC = aRoot + normalize( mix( uHG, uHW, clamp( hStr * ( 0.15 + 0.45 * ht ), 0.0, 0.96 ) ) ) * ( ht * aLk.x );
vec3 hS = normalize( vec3( 1.0, 0.0, 0.0 ) - hD * hD.x );
vec3 hN = cross( hS, hD );
float hw = ht * uHS;
hC += hN * ( sin( uTime * 10.0 + ht * 6.0 + aLk.y ) * 0.03 * hw ) + hS * ( sin( uTime * 6.7 + ht * 5.0 + aLk.y * 2.0 ) * 0.028 * hw );
vec3 hairPos = hC + hS * ( aHair.x * ( 1.0 + 0.3 * hw ) ) + hN * aHair.y;
{ // collide with the passenger seat (a plane along the front of the back rest and head rest, in car space)
  vec3 hB = ( uHM * vec4( hairPos, 1.0 ) ).xyz, hPn = vec3( 0.0, 0.199, 0.98 );
  float hk = smoothstep( 0.37, 0.27, abs( hB.x + 0.37 ) ) * smoothstep( 1.24, 1.12, hB.y );
  hB += hPn * ( max( 0.0, 0.03 - dot( hB - vec3( -0.37, 0.733, -0.516 ), hPn ) ) * hk );
  hairPos = ( uHMi * vec4( hB, 1.0 ) ).xyz;
}
vHr = vec3( aHair.x, aLk.y, aLk.z );
vec3 objectNormal = normalize( hS * normal.x + hN * normal.y );`)
        .replace('#include <begin_vertex>', 'vec3 transformed = hairPos;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vHr;' + NOISE)
        .replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb *= vHr.z * ( 0.72 + 0.5 * pN( vec3( vHr.x * 700.0, vHr.y * 3.0, 0.0 ) ) );');
    };
    m.customProgramCacheKey = () => 'hairLocks2';
    return m;
  }
  function bodyMaterial(env) {
    const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7, metalness: 0, envMap: env, envMapIntensity: 0.45 });
    m.onBeforeCompile = sh => {
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aCl; varying vec3 vPP; varying float vCl;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvPP = position; vCl = aCl;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vPP; varying float vCl;' + NOISE)
        .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
{
  float cl = clamp( vCl, 0.0, 1.0 ) * ( 1.0 - clamp( vCl - 1.0, 0.0, 1.0 ) ), hr = clamp( vCl - 1.0, 0.0, 1.0 );
  float hgt = pN( vPP * 24.0 ) * 0.01 * cl + pN( vec3( vPP.x * 110.0, vPP.y * 9.0, vPP.z * 110.0 ) ) * 0.0022 * hr;
  vec3 sX = dFdx( - vViewPosition ), sY = dFdy( - vViewPosition );
  vec3 r1 = cross( sY, normal ), r2 = cross( normal, sX ); float fDet = dot( sX, r1 ) * faceDirection;
  vec3 pn = abs( fDet ) * normal - sign( fDet ) * ( dFdx( hgt ) * r1 + dFdy( hgt ) * r2 );
  if ( dot( pn, pn ) > 1e-14 ) normal = normalize( pn );
  roughnessFactor = mix( mix( 0.52, 0.86, cl ), 0.6, hr );
}`)
        .replace('#include <opaque_fragment>', `{
  float sk = 1.0 - clamp( vCl, 0.0, 1.0 );
  float rim = pow( 1.0 - clamp( dot( normalize( normal ), normalize( vViewPosition ) ), 0.0, 1.0 ), 2.4 );
  outgoingLight += diffuseColor.rgb * vec3( 1.0, 0.46, 0.32 ) * ( rim * 0.55 * sk );
}
#include <opaque_fragment>`);
    };
    m.customProgramCacheKey = () => 'people';
    return m;
  }

  const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3(), _e = new THREE.Vector3(), _x = new THREE.Vector3(), _z = new THREE.Vector3(), _m = new THREE.Matrix4();
  /* height of the car's upper surface under a point (door tops, cowl, rear deck); far below inside the cabin opening or beside the car */
  function clearY(x, z) {
    const cs = G.carShape, ax = Math.abs(x), w = cs.fW(z); let top, k;
    if (z > -0.72 && z < 0.4) { top = cs.fSh(z) + 0.004; k = U.smooth(w + 0.03, w - 0.02, ax) * U.smooth(w - 0.275, w - 0.215, ax); }
    else { top = Math.max(cs.fSh(z), cs.fTop(z)) + 0.004; k = U.smooth(w + 0.03, w - 0.02, ax); }
    return top - (1 - k) * 0.6;
  }
  const _h = new THREE.Vector3(), _pl = new THREE.Vector3(), _sp = new THREE.Vector3(), _hp = new THREE.Vector3();
  function solve(arm, S, H, pole) {
    const la = arm.la, lb = arm.lb;
    _a.copy(H).sub(S); let d = _a.length(); const mx = (la + lb) * 0.995;
    if (d > mx) { _a.multiplyScalar(mx / d); d = mx; }
    if (d < 0.05) d = 0.05;
    _b.copy(_a).normalize();
    const al = (la * la - lb * lb + d * d) / (2 * d), hh = Math.sqrt(Math.max(0, la * la - al * al));
    _c.copy(pole).addScaledVector(_b, -pole.dot(_b)); if (_c.lengthSq() < 1e-6) _c.set(0, -1, 0); _c.normalize();
    _e.copy(S).addScaledVector(_b, al).addScaledVector(_c, hh);
  }
  function setArm(arm, S, H, pole, pn, curl) {
    const la = arm.la, lb = arm.lb;
    _h.copy(H); _pl.copy(pole);
    for (let it = 0; it < 7; it++) {          // lift the hand / swing the elbow up until nothing is inside the bodywork
      solve(arm, S, _h, _pl);
      _hp.copy(S).add(_a);
      let upH = 0, upE = 0;
      for (const t of [0.34, 0.67, 1, 1 + 0.11 / lb]) {
        _sp.lerpVectors(_e, _hp, t); const pen = clearY(_sp.x, _sp.z) + (t >= 1 ? 0.022 : 0.036) - _sp.y; if (pen <= 0) continue;
        if (t >= 1) upH = Math.max(upH, pen); else { upH = Math.max(upH, pen * t * 0.8); upE = Math.max(upE, pen * (1 - t) * 1.6); }
      }
      for (const t of [0.55, 1]) { _sp.lerpVectors(S, _e, t); upE = Math.max(upE, clearY(_sp.x, _sp.z) + 0.045 - _sp.y); }
      if (upH < 0.002 && upE < 0.002) break;
      _h.y += upH * 1.05; _pl.y += upE * 10;
      if (it === 6) solve(arm, S, _h, _pl);
    }
    arm.up.position.copy(S); arm.up.quaternion.setFromUnitVectors(Y, _c.copy(_e).sub(S).normalize());
    _c.copy(S).add(_a).sub(_e).normalize();                                  // forearm direction
    arm.fo.position.copy(_e); arm.fo.quaternion.setFromUnitVectors(Y, _c);
    // hand: fingers continue the forearm, palm turned towards pn
    _z.copy(pn).addScaledVector(_c, -pn.dot(_c)); if (_z.lengthSq() < 1e-6) _z.set(0, 0, 1).addScaledVector(_c, -_c.z); _z.normalize();
    _x.copy(_c).cross(_z);
    const grip = curl > 0.55, hm = grip ? arm.hg : arm.ho, other = grip ? arm.ho : arm.hg;
    hm.visible = true; other.visible = false;
    hm.position.copy(S).add(_a); hm.quaternion.setFromRotationMatrix(_m.makeBasis(_x, _c, _z));
  }

  G.buildPeople = function (car, env) {
    const body = car.body, mat = bodyMaterial(env);
    const mesh = (g, parent, m) => { const ms = new THREE.Mesh(g, m || mat); ms.castShadow = true; ms.receiveShadow = true; (parent || body).add(ms); return ms; };
    const person = (o) => {
      const root = new THREE.Group(); root.rotation.order = 'YZX'; body.add(root);
      const tparts = [loft(o.rings, 20)];
      if (o.extra) for (const g of o.extra) tparts.push(g);
      mesh(mergeP(tparts), root);
      const head = new THREE.Group(); head.rotation.order = 'YXZ'; head.position.set(0, o.neckY, 0); root.add(head);
      mesh(U.tf(headGeo(o), 0, o.ry - 0.014, 0.014), head);
      const arm = (side) => {
        const up = mesh(limb(o.la, o.upProf)), foParts = [limb(o.lb, o.foProf, 0.88)];
        if (o.wrist && o.wrist[side]) for (const g of o.wrist[side]) foParts.push(g);
        const fo = mesh(mergeP(foParts)), ho = mesh(handGeo(o.hs, 0.12, o.skin)), hg = mesh(handGeo(o.hs, 1, o.skin));
        if (side === 'L') { ho.scale.x = -1; hg.scale.x = -1; }
        return { la: o.la, lb: o.lb, up, fo, ho, hg };
      };
      const p = { root, head, L: arm('L'), R: arm('R'), sh: o.shW, shY: o.shY, sL: new THREE.Vector3(), sR: new THREE.Vector3(), hip: [new THREE.Vector3(), new THREE.Vector3()], th: [], knee: [], shin: [], foot: [] };
      for (const s of [-1, 1]) {
        p.th.push(mesh(limb(1, o.thProf)));
        p.knee.push(new THREE.Vector3(o.seatX + s * 0.105, 0.545, 0.085));
        p.shin.push(mesh(limb(1, o.shProf)));
        p.foot.push(new THREE.Vector3(o.seatX + s * 0.11, 0.385, 0.375));
      }
      p.objs = [root, p.L.up, p.L.fo, p.L.ho, p.L.hg, p.R.up, p.R.fo, p.R.ho, p.R.hg].concat(p.th, p.shin); // everything that makes up this person
      return p;
    };
    const frame = p => {
      p.root.updateMatrix(); p.sL.set(p.sh, p.shY, 0).applyMatrix4(p.root.matrix); p.sR.set(-p.sh, p.shY, 0).applyMatrix4(p.root.matrix);
      for (let k = 0; k < 2; k++) {
        const h = p.hip[k].set((k ? 1 : -1) * 0.085, -0.035, 0.03).applyMatrix4(p.root.matrix), t = p.th[k];
        _a.copy(p.knee[k]).sub(h); const l = _a.length();
        t.position.copy(h); t.scale.set(1, l, 1); t.quaternion.setFromUnitVectors(Y, _a.normalize());
        const sn = p.shin[k]; _a.copy(p.foot[k]).sub(p.knee[k]); const l2 = _a.length();
        sn.position.copy(p.knee[k]); sn.scale.set(1, l2, 1); sn.quaternion.setFromUnitVectors(Y, _a.normalize());
      }
    };

    /* ---------- driver ---------- */
    const dSkin = col(0xbd8560), dShirt = col(0xe9e5da, 1), dPants = col(0x27344a, 1), dHair = col(0x21160f, 2);
    const belt = pc(U.tf(new THREE.BoxGeometry(0.05, 0.56, 0.012), 0.02, 0.215, 0.116, -0.08, 0, 0.62), col(0x151517, 1));
    const collar = pc(U.tf(new THREE.TorusGeometry(0.062, 0.016, 8, 18), 0, 0.482, 0.004, Math.PI / 2 + 0.25, 0, 0), dShirt);
    const watch = [pc(U.tf(new THREE.CylinderGeometry(0.034, 0.034, 0.022, 14, 1, true), 0, 0.228, 0), col(0x141416, 1)), pc(U.tf(new THREE.CylinderGeometry(0.019, 0.019, 0.01, 14), 0, 0.228, -0.031, Math.PI / 2, 0, 0), col(0xc8ccd0, 1))];
    const D = person({
      seatX: 0.37, skin: dSkin, lips: col(0x9a5a48), brow: col(0x2a1c14), hair: dHair, glasses: true, stubble: true, seed: 11,
      rings: [[-0.10, 0.15, 0.105, 0, dPants], [0.0, 0.165, 0.112, 0, dPants], [0.02, 0.168, 0.114, 0, dShirt], [0.13, 0.156, 0.104, 0, dShirt], [0.25, 0.176, 0.118, 0.008, dShirt], [0.34, 0.196, 0.116, 0.004, dShirt], [0.4, 0.2, 0.104, -0.004, dShirt], [0.44, 0.176, 0.09, -0.006, dShirt], [0.466, 0.118, 0.074, -0.004, dShirt], [0.482, 0.062, 0.06, 0, dShirt], [0.484, 0.055, 0.056, 0, dSkin], [0.56, 0.051, 0.054, 0.006, dSkin]],
      extra: [belt, collar], neckY: 0.545, rx: 0.09, ry: 0.116, rz: 0.102, capAngle: 1.62, capTilt: 0.62, volume: 0.1, quiff: 0.1,
      la: 0.285, lb: 0.25, hs: 1.0, shW: 0.196, shY: 0.415,
      upProf: [[0, 0.056, dShirt], [0.2, 0.058, dShirt], [0.46, 0.055, dShirt], [0.47, 0.048, dSkin], [0.75, 0.043, dSkin], [1, 0.039, dSkin]],
      foProf: [[0, 0.04, dSkin], [0.22, 0.045, dSkin], [0.55, 0.039, dSkin], [0.88, 0.03, dSkin], [1, 0.029, dSkin]],
      thProf: [[0, 0.085, dPants], [0.5, 0.08, dPants], [1, 0.064, dPants]], shProf: [[0, 0.062, dPants], [0.55, 0.054, dPants], [1, 0.047, dPants]], wrist: { L: watch },
    });
    /* ---------- passenger ---------- */
    const gSkin = col(0xcf9672), gTop = col(0xf2efe8, 1), gShorts = col(0x4d72a2, 1), gHairHex = 0xc39850, gHair = col(gHairHex, 2);
    const bracelet = [pc(U.tf(new THREE.TorusGeometry(0.03, 0.005, 6, 16), 0, 0.2, 0, Math.PI / 2, 0, 0), col(0xd8b24a, 1))];
    const straps = [];
    for (const s of [-1, 1]) straps.push(pc(U.tf(new THREE.TorusGeometry(0.09, 0.008, 6, 16, Math.PI), s * 0.105, 0.365, -0.002, 0, Math.PI / 2, 0, 1, 0.84, 1), gTop));
    const Pg = person({
      seatX: -0.37, skin: gSkin, lips: col(0xb4483f), brow: col(0x7a5a30), hair: gHair, glasses: true, frame: 0x5a3a20, seed: 23,
      rings: [[-0.10, 0.152, 0.1, 0, gShorts], [0.0, 0.16, 0.106, 0, gShorts], [0.035, 0.152, 0.1, 0, gSkin], [0.1, 0.122, 0.086, 0, gSkin], [0.125, 0.12, 0.088, 0, gTop], [0.2, 0.128, 0.098, 0.006, gTop], [0.27, 0.146, 0.11, 0.016, gTop], [0.33, 0.158, 0.098, 0.006, gTop], [0.35, 0.163, 0.094, 0.002, gSkin], [0.4, 0.165, 0.086, -0.004, gSkin], [0.43, 0.146, 0.076, -0.006, gSkin], [0.452, 0.09, 0.062, -0.004, gSkin], [0.468, 0.047, 0.048, 0, gSkin], [0.545, 0.042, 0.045, 0.005, gSkin]],
      extra: straps, neckY: 0.53, rx: 0.083, ry: 0.106, rz: 0.096, capAngle: 1.9, capTilt: 0.5, volume: 0.06,
      la: 0.26, lb: 0.228, hs: 0.86, shW: 0.166, shY: 0.395,
      upProf: [[0, 0.045, gSkin], [0.3, 0.043, gSkin], [0.7, 0.037, gSkin], [1, 0.034, gSkin]],
      foProf: [[0, 0.035, gSkin], [0.25, 0.037, gSkin], [0.6, 0.031, gSkin], [0.9, 0.025, gSkin], [1, 0.024, gSkin]],
      thProf: [[0, 0.084, gShorts], [0.34, 0.08, gShorts], [0.35, 0.074, gSkin], [1, 0.058, gSkin]], shProf: [[0, 0.056, gSkin], [0.4, 0.052, gSkin], [1, 0.036, gSkin]], wrist: { R: bracelet },
    });
    const hairMat = hairMaterial(gHairHex, env);
    const hair = new THREE.Mesh(hairGeo({ locks: 13, len: 0.5, rx: 0.083, rz: 0.096, y0: 0.092 + 0.02 }), hairMat); hair.frustumCulled = false; hair.receiveShadow = true; Pg.head.add(hair);

    /* steering wheel with the rim in the driver's hands */
    const SW = new THREE.Vector3(0.37, 0.835, -0.015), TILT = 0.4, RIM = 0.168;
    const swG = new THREE.Group(); swG.position.copy(SW); swG.rotation.x = TILT; body.add(swG);
    const spin = new THREE.Group(); swG.add(spin);
    {
      const parts = [new THREE.TorusGeometry(RIM, 0.017, 8, 28)];
      parts.push(new THREE.BoxGeometry(RIM * 2, 0.026, 0.016)); parts.push(U.tf(new THREE.BoxGeometry(0.026, RIM, 0.016), 0, -RIM / 2, 0));
      const hub = new THREE.CylinderGeometry(0.045, 0.05, 0.03, 14); hub.rotateX(Math.PI / 2); parts.push(hub);
      mesh(U.merge(parts), spin, car.M.leather);
      const colm = new THREE.CylinderGeometry(0.028, 0.03, 0.3, 10); colm.rotateX(Math.PI / 2); colm.translate(0, 0, 0.16); mesh(colm, swG, car.M.leather);
    }

    /* ---------- passenger animations: each fills a pose (hip, torso, head, hand targets, elbow hints, grip, palm) ---------- */
    const NP = 30, SEAT = [-0.38, 0.53, -0.40];
    const set = (o, i, a, b, c) => { o[i] = a; o[i + 1] = b; o[i + 2] = c; };
    const A = {
      sit(t, o) {
        set(o, 0, SEAT[0], SEAT[1], SEAT[2]); set(o, 3, -0.17, 0, 0); set(o, 6, 0.02 + Math.sin(t * 0.7) * 0.03, Math.sin(t * 0.37) * 0.3, 0);
        set(o, 9, -0.775, 0.915, -0.18); set(o, 12, -0.26, 0.645, -0.12); set(o, 15, -0.3, -1, -0.5); set(o, 18, 0.6, -0.6, -0.5);
        o[21] = 0.35; o[22] = 0.3; set(o, 23, 0, -1, 0.1); set(o, 26, 0, -1, 0.2); o[29] = 0.7;
      },
      surf(t, o) {
        const wv = t * 2.3, sway = Math.sin(t * 1.3) * 0.03, br = 0.9 + 0.1 * Math.sin(t * 0.47);
        set(o, 0, -0.53, 0.81, -0.34); set(o, 3, 0.1, -0.34, 0.68 * br + sway); set(o, 6, -0.24 + Math.sin(t * 0.9) * 0.04, -0.3 + Math.sin(t * 0.61) * 0.14, -0.42);
        set(o, 9, -1.42 + Math.sin(wv * 0.5) * 0.03, 1.0 + Math.sin(wv) * 0.13, -0.16 + Math.cos(wv) * 0.06); set(o, 12, -0.5, 1.185, 0.075);
        set(o, 15, 0.1, -1, -0.45); set(o, 18, 0.5, -0.6, -0.6); o[21] = 0.12; o[22] = 1; set(o, 23, 0, -1, 0.45 * Math.cos(wv)); set(o, 26, 0, -0.4, 0.9); o[29] = 1;
      },
      armsUp(t, o) {
        const sw = Math.sin(t * 2.6) * 0.11;
        set(o, 0, -0.38, 0.64, -0.42); set(o, 3, -0.07, 0, sw * 0.9); set(o, 6, -0.22, Math.sin(t * 1.1) * 0.16, -sw * 0.5);
        set(o, 9, -0.64 + sw, 1.5 + Math.sin(t * 5.2) * 0.02, -0.44); set(o, 12, -0.12 + sw, 1.5 - Math.sin(t * 5.2) * 0.02, -0.44);
        set(o, 15, -0.7, -0.4, -0.6); set(o, 18, 0.7, -0.4, -0.6); o[21] = 0.12; o[22] = 0.12; set(o, 23, 0, 0, 1); set(o, 26, 0, 0, 1); o[29] = 0.95;
      },
      relax(t, o) {
        set(o, 0, SEAT[0], SEAT[1], SEAT[2]); set(o, 3, -0.27, -0.08, 0.07); set(o, 6, -0.3 + Math.sin(t * 0.6) * 0.03, -0.22 + Math.sin(t * 0.33) * 0.1, 0.05);
        set(o, 9, -0.82, 0.97, -0.02); set(o, 12, -0.25 + Math.sin(t * 1.9) * 0.012, 1.2 + Math.sin(t * 1.4) * 0.02, -0.57);
        set(o, 15, -1, -0.5, -0.4); set(o, 18, 1, 0.5, -0.3); o[21] = 0.4; o[22] = 0.45; set(o, 23, 0, -1, 0); set(o, 26, -1, 0, 0.3); o[29] = 0.8;
      },
      lookBack(t, o) {
        set(o, 0, -0.42, 0.58, -0.4); set(o, 3, -0.05, -0.95, 0.12); set(o, 6, -0.04, -1.0 + Math.sin(t * 0.8) * 0.08, 0);
        set(o, 9, -0.78 + Math.sin(t * 7) * 0.08, 1.3 + Math.abs(Math.sin(t * 7)) * 0.02, -0.72); set(o, 12, -0.37, 1.13, -0.61);
        set(o, 15, -0.3, -1, 0.3); set(o, 18, 0.4, -0.8, 0.4); o[21] = 0.1; o[22] = 0.8; set(o, 23, -0.2, 0, -1); set(o, 26, 0, -1, 0); o[29] = 0.85;
      },
      dance(t, o) {
        const b = t * 7.4, h = Math.sin(b / 2);
        set(o, 0, SEAT[0], SEAT[1] + 0.012 * Math.sin(b), SEAT[2]); set(o, 3, -0.1, 0.13 * h, 0.09 * h); set(o, 6, 0.1 * Math.sin(b), 0.16 * h, -0.05 * h);
        set(o, 9, -0.6, 1.03 + 0.1 * Math.sin(b), -0.15); set(o, 12, -0.16, 1.03 - 0.1 * Math.sin(b), -0.15);
        set(o, 15, -0.6, -1, -0.3); set(o, 18, 0.6, -1, -0.3); o[21] = 0.9; o[22] = 0.9; set(o, 23, 0.4, 0, 1); set(o, 26, -0.4, 0, 1); o[29] = 0.75;
      },
      hold(t, o) {
        set(o, 0, SEAT[0], SEAT[1], SEAT[2]); set(o, 3, -0.04, 0, 0); set(o, 6, 0.12, 0, 0);
        set(o, 9, -0.775, 0.915, -0.02); set(o, 12, -0.5, 1.185, 0.075); set(o, 15, -0.3, -1, -0.5); set(o, 18, 0.5, -0.6, -0.6);
        o[21] = 1; o[22] = 1; set(o, 23, 0, -1, 0.1); set(o, 26, 0, -0.4, 0.9); o[29] = 0.7;
      },
    };
    const LIST = ['surf', 'armsUp', 'surf', 'relax', 'lookBack', 'dance', 'sit'], ORDER = ['surf', 'armsUp', 'relax', 'lookBack', 'dance', 'sit'];
    const an = { cur: 'sit', prev: new Float32Array(NP), now: new Float32Array(NP), tgt: new Float32Array(NP), w: 1, timer: 0, holdT: 0, forced: null, req: null, last: null };
    A.sit(0, an.now); an.prev.set(an.now);
    const rnd = U.rng(4242);
    const go = (name) => { if (name === an.cur) return; an.prev.set(an.now); an.cur = name; an.w = 0; };

    const st = { dl: 0, dp: 0, hy: 0, gl: 0, gp: 0, t: 0, wheel: 0, rest: 0, straight: 0, glance: 0, lean: 0, peek: 0 };
    const vL = new THREE.Vector3(), vR = new THREE.Vector3(), pole = new THREE.Vector3(), pn = new THREE.Vector3(), qh = new THREE.Quaternion();
    const rimPoint = (th, out) => out.set(Math.sin(th) * RIM, Math.cos(th) * RIM, -0.045).applyAxisAngle(ZA, st.wheel).applyAxisAngle(XA, TILT).add(SW);

    /* out through the missing door: the figure leaves the car as one stiff body pivoting about its hips, tumbles along the road and ends up lying there */
    const fall = { on: false, g: new THREE.Group(), inner: new THREE.Group(), v: new THREE.Vector3(), w: new THREE.Vector3(), rest: false, t: 0, hint: -1 };
    fall.g.add(fall.inner);
    const fq1 = new THREE.Quaternion(), fq2 = new THREE.Quaternion(), fax = new THREE.Vector3(), fsf = {};
    function fallOut() {
      if (fall.on) return;
      const P = G.player, cr = car.root;
      { // go limp: body straight, legs out, arms flung wide (the seated pose would look wrong lying in the road)
        const r = Pg.root.position; Pg.root.rotation.set(0, 0, 0); Pg.head.rotation.set(-0.25, 0.3, 0.1);
        for (let k = 0; k < 2; k++) { const sd = k ? 1 : -1; if (!fall.kn) fall.kn = [Pg.knee[0].clone(), Pg.knee[1].clone(), Pg.foot[0].clone(), Pg.foot[1].clone()];
          Pg.knee[k].set(r.x + sd * 0.1, r.y - 0.44, r.z + 0.07 + k * 0.05); Pg.foot[k].set(r.x + sd * 0.15, r.y - 0.85, r.z + 0.0 + k * 0.1); }
        frame(Pg);
        setArm(Pg.R, Pg.sR, vR.set(r.x - 0.5, r.y + 0.52, r.z + 0.08), pole.set(0, -1, -0.4), pn.set(0, 0, 1), 0.2);
        setArm(Pg.L, Pg.sL, vL.set(r.x + 0.42, r.y + 0.2, r.z + 0.12), pole.set(0, -1, -0.4), pn.set(0, 0, 1), 0.2);
      }
      body.updateWorldMatrix(true, false);
      fall.g.position.copy(Pg.root.position).applyMatrix4(body.matrixWorld);
      fall.g.position.x += P.x - cr.position.x; fall.g.position.y += P.y - cr.position.y; fall.g.position.z += P.z - cr.position.z; // (the model is where the car was a frame ago)
      body.getWorldQuaternion(fall.g.quaternion); fall.inner.position.copy(Pg.root.position).multiplyScalar(-1);
      G.scene.add(fall.g);
      for (const o of Pg.objs) { fall.inner.add(o); o.traverse(m => { if (m.isMesh) { m.layers.disable(2); m.castShadow = true; } }); }
      const rx = -Math.cos(P.yaw), rz = Math.sin(P.yaw); // the car's right
      fall.v.set(P.vx * 0.82 + rx * 3.2, 1.6, P.vz * 0.82 + rz * 3.2);
      fall.w.set(Math.sin(P.yaw), 0, Math.cos(P.yaw)).multiplyScalar(5.5); fall.w.x += rx * 3; fall.w.z += rz * 3; // rolls out sideways, then head over heels
      fall.on = true; fall.rest = false; fall.t = 0; fall.hint = P.hint;
    }
    function seat() {
      if (!fall.on) return;
      for (const o of Pg.objs) { body.add(o); o.traverse(m => { if (m.isMesh) { m.layers.enable(2); m.castShadow = false; } }); }
      G.scene.remove(fall.g); fall.on = false;
      if (fall.kn) { Pg.knee[0].copy(fall.kn[0]); Pg.knee[1].copy(fall.kn[1]); Pg.foot[0].copy(fall.kn[2]); Pg.foot[1].copy(fall.kn[3]); }
    }
    function fallStep(dt) {
      if (dt <= 0 || fall.t > 60) return;
      const p = fall.g.position; fall.t += dt;
      fall.v.y -= 15 * dt; p.addScaledVector(fall.v, dt);
      const wl = fall.w.length(); if (wl > 1e-3 && !fall.rest) { fq1.setFromAxisAngle(fax.copy(fall.w).multiplyScalar(1 / wl), wl * dt); fall.g.quaternion.premultiply(fq1).normalize(); }
      const gy = G.surface(p.x, p.z, fall.hint, fsf).y + (fall.rest ? 0.13 : 0.3); fall.hint = fsf.i;
      if (p.y < gy) {
        p.y = gy; if (fall.v.y < -2) fall.v.y *= -0.25; else fall.v.y = 0;
        const fr = Math.exp(-dt * 2.2); fall.v.x *= fr; fall.v.z *= fr; fall.w.multiplyScalar(Math.exp(-dt * 1.6));
        if (fall.v.x * fall.v.x + fall.v.z * fall.v.z < 2.5) fall.rest = true;
      }
      if (fall.rest) { // on her back, wherever she ended up pointing
        fax.set(0, 1, 0).applyQuaternion(fall.g.quaternion); fq2.setFromAxisAngle(Y, Math.atan2(-fax.x, -fax.z)).multiply(fq1.setFromAxisAngle(XA, -Math.PI / 2));
        fall.g.quaternion.slerp(fq2, Math.min(1, dt * 7)); fall.v.x *= Math.exp(-dt * 6); fall.v.z *= Math.exp(-dt * 6);
      }
    }

    function update(dt, s) {
      const k = r => 1 - Math.exp(-dt * r);
      st.t += dt; const t = st.t, sp = s.speed, bump = s.bump || 0;
      /* --- driver --- */
      st.dl += (U.clamp(s.latAcc * 0.0085, -0.16, 0.16) - st.dl) * k(5);
      st.dp += (U.clamp(-s.acc * 0.006, -0.07, 0.09) - st.dp) * k(5);
      st.hy += (U.clamp(s.steerN * 0.42, -0.5, 0.5) - st.hy) * k(4);
      st.wheel += (-s.steerN * 1.25 - st.wheel) * k(18);
      spin.rotation.z = st.wheel;
      st.straight = Math.abs(s.steerN) < 0.22 && sp > 6 ? st.straight + dt : 0;
      // cruising on a straight: left elbow on the door, one hand on top of the wheel; any real steering brings both hands back
      const wantRest = st.straight > 2.2 && Math.sin(t * 0.21 + 1) > -0.3 ? 1 : 0;
      st.rest += (wantRest - st.rest) * k(wantRest ? 2.2 : 9);
      const gl = st.straight > 1.5 && (t % 13) > 11.4 ? 1 : 0;
      st.glance += (gl - st.glance) * k(5);
      const r = st.rest * st.rest * (3 - 2 * st.rest);
      st.peek += ((s.hood || 0) - st.peek) * k(3.5);          // hood up in front of him: he leans out over the door to see the road
      const pk = st.peek * st.peek * (3 - 2 * st.peek);
      if (pk > 0.3) st.rest *= 1 - k(8);
      D.root.position.set(0.37 + 0.09 * pk, 0.53 + 0.01 * pk, -0.41);
      D.root.rotation.set(-0.17 + st.dp - bump * 0.02 + 0.05 * pk, 0.04 * r - 0.1 * pk, st.dl + 0.035 * r - 0.36 * pk);
      D.head.rotation.set(0.1 - st.dp * 0.6 + bump * 0.05 - 0.06 * pk, st.hy - 0.55 * st.glance * (1 - pk) - 0.14 * pk, -st.dl * 0.7 - st.hy * 0.12 + 0.3 * pk);
      frame(D);
      rimPoint(1.05, vL); vL.x += (0.8 - vL.x) * r; vL.y += (0.925 - vL.y) * r; vL.z += (-0.2 - vL.z) * r;
      pn.copy(SW).sub(vL).multiplyScalar(1 - r); pn.y -= r;
      setArm(D.L, D.sL, vL, pole.set(0.5 + 0.6 * r, -1, -0.15 - 0.3 * r), pn, 1 - 0.55 * r);
      rimPoint(-1.05 + 0.85 * r, vR); pn.copy(SW).sub(vR);
      setArm(D.R, D.sR, vR, pole.set(-0.5, -1, -0.15), pn, 1);
      if (fall.on) { fallStep(dt); return; }
      /* --- passenger: pick an animation, cross-fade to it --- */
      if (s.air || s.slip > 10) an.holdT = 0.8; else an.holdT = Math.max(0, an.holdT - dt);
      an.timer -= dt;
      if (an.forced) go(an.forced);
      else if (an.holdT > 0) go('hold');
      else if (an.req) { go(an.req); an.last = an.req; an.req = null; an.timer = 9 + rnd() * 5; }
      else if (an.cur === 'hold' && an.last && an.timer > 0) go(an.last);
      else if (an.timer <= 0 || an.cur === 'hold') {
        let nx = an.cur; while (nx === an.cur || nx === 'hold') nx = LIST[(rnd() * LIST.length) | 0];
        if (!an.last) nx = 'surf';
        go(nx); an.last = nx; an.timer = 6.5 + rnd() * 5;
      }
      an.w = Math.min(1, an.w + dt / (an.cur === 'hold' ? 0.4 : 0.95));
      A[an.cur](t, an.tgt);
      const w = an.w * an.w * (3 - 2 * an.w), o = an.now;
      for (let i = 0; i < NP; i++) o[i] = an.prev[i] + (an.tgt[i] - an.prev[i]) * w;
      st.gl += (U.clamp(s.latAcc * 0.008, -0.13, 0.15) - st.gl) * k(4);
      st.gp += (U.clamp(-s.acc * 0.006, -0.08, 0.08) - st.gp) * k(4);
      Pg.root.position.set(o[0], o[1], o[2]);
      Pg.root.rotation.set(o[3] + st.gp - bump * 0.02, o[4], o[5] + st.gl);
      Pg.head.rotation.set(o[6] + bump * 0.05, o[7], o[8] - st.gl * 0.5);
      frame(Pg);
      setArm(Pg.R, Pg.sR, vR.set(o[9], o[10], o[11]), pole.set(o[15], o[16], o[17]), pn.set(o[23], o[24], o[25]), o[21]);
      setArm(Pg.L, Pg.sL, vL.set(o[12], o[13], o[14]), pole.set(o[18], o[19], o[20]), pn.set(o[26], o[27], o[28]), o[22]);
      st.lean = o[5];
      // hair: wind and gravity in head space
      qh.copy(Pg.root.quaternion).multiply(Pg.head.quaternion).invert();
      const u = hairMat.userData.u;
      Pg.head.updateMatrix(); u.uHM.value.multiplyMatrices(Pg.root.matrix, Pg.head.matrix); u.uHMi.value.copy(u.uHM.value).invert();
      u.uHW.value.set(0.1, 0.16, -1).normalize().applyQuaternion(qh);
      u.uHG.value.set(0, -1, -0.1).normalize().applyQuaternion(qh);
      u.uHS.value = U.smooth(2, 24, sp) * o[29];
    }
    return { update, driver: D, passenger: Pg, st, an, anims: Object.keys(A), fallOut, seat, fallen: () => fall.on, fall, force: n => { an.forced = n || null; },
      play: i => { an.req = ORDER[i] || null; }, next: () => { an.req = ORDER[(ORDER.indexOf(an.req || an.last) + 1) % ORDER.length]; } };
  };
})();
