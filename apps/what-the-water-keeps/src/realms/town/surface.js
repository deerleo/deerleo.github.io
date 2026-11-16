// The town below: what lies ON the water (stage 2d: the place, its light and its water). The lake here is clear to the
// roofs, and clear water seen from a boat has no surface of its own to look at: nothing told the eye where the water
// was. So the surface carries a little, sparsely, the way still water does:
//   - fallen leaves: about a thousand small dark leaves lying flat on it, gathered where still water gathers them
//     (along the waterline of every roof awash, round stacks and columns, under the poplars) and a few adrift in the
//     open. Each turns in a slow eddy of its own, lies in the plane of the water where it floats (a ring passing under
//     it rocks it), and is shouldered aside by the hull. Against the lit town beneath they are dark; in the lantern's
//     reach they are warm. Hand-shaped (a poplar leaf with its stalk and a fold along the midrib), modelled, instanced.
//   - dust on the film: fine pale specks on the water round the boat, still in the world as the boat moves through
//     them, so that the plane of the water slides over the town beneath it. Matte, never glinting; seen only near.
// Nothing here is alive (the cast's sedge flies, fry and bubbles are theirs).
//
//   const surface = buildSurface(ctx, plan, shared, light);     // set.js calls it; returns { leaves, dust, update(dt, c) }
import * as THREE from 'three';

export function buildSurface(ctx, plan, shared, light) {
  const { kit } = ctx, town = light.town, sh = ctx.engine.shared, rnd = ctx.rng(5150);
  const out = {};
  const QS = new URLSearchParams(typeof location !== 'undefined' ? location.search : ''), off = (QS.get('afloat') || '').split(',');      // &afloat=0 none of it; &afloat=leaves,dust,sheen leaves those out
  const uBoat = { value: new THREE.Vector4(0, 0, 0, -1) };                     // the hull: x, z, and the way its bow points

  // ---------------------------------------------------------------------------------------------- leaves
  if (!off.includes('leaves')) {
    // a poplar leaf, 1 unit long from the base of its blade to its tip, lying in the XZ plane, its midrib along +Z:
    // broad and rounded low down, drawn out to a point; folded a little along the midrib; a short stalk
    const half = [[0.0, -0.02], [0.2, 0.0], [0.4, 0.16], [0.46, 0.36], [0.36, 0.6], [0.18, 0.82], [0.0, 1.0]], pos = [], idx = [];
    const rib = [[-0.02, 0], [0.0, 0.2], [0.02, 0.4], [0.03, 0.6], [0.02, 0.82], [0.0, 1.0]];        // the midrib, raised (y) along z
    const v = (x, y, z) => { pos.push(x, y, z); return pos.length / 3 - 1; };
    for (const side of [1, -1]) {
      const edge = half.map(([x, z]) => v(side * x, 0.0, z)), mid = [v(0, 0.035, 0.0), v(0, 0.05, 0.3), v(0, 0.045, 0.6), v(0, 0.02, 0.85), v(0, 0.0, 1.0)];
      const tri = (a, b, c) => (side > 0 ? idx.push(a, b, c) : idx.push(a, c, b));
      tri(mid[0], edge[1], edge[0]); tri(mid[0], edge[2], edge[1]); tri(mid[0], mid[1], edge[2]); tri(mid[1], edge[3], edge[2]); tri(mid[1], mid[2], edge[3]);
      tri(mid[2], edge[4], edge[3]); tri(mid[2], mid[3], edge[4]); tri(mid[3], edge[5], edge[4]); tri(mid[3], mid[4], edge[5]);
    }
    { const a = v(-0.012, 0.03, 0.0), b = v(0.012, 0.03, 0.0), c = v(0.01, 0.02, -0.32), d = v(-0.01, 0.02, -0.32); idx.push(a, c, b, a, d, c); }      // the stalk
    void rib;
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals();
    geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(pos.length).fill(1), 3));

    // where they lie: still water gathers them
    const list = [];
    const add = (x, z, k = 1) => list.push({ x, z, size: (0.06 + rnd() * 0.045) * k, yaw: rnd() * 6.283, eddy: 0.08 + rnd() * rnd() * 0.5 });
    const frame = (x, z, yaw) => { const c = Math.cos(yaw), s = Math.sin(yaw); return (lx, lz) => [x + lx * c + lz * s, z - lx * s + lz * c]; };
    for (const h of town.houses) {                                              // along the waterline of every roof awash
      if (!h.awash || h.roof === 'mansard' || !(h.ridge > 0.05) || !(h.eaves < 0)) continue;
      const W = frame(h.x, h.z, h.yaw), halfD = h.dep / 2 + 0.35, zc = halfD * h.ridge / (h.ridge - h.eaves), n = Math.round(h.w * 1.1);
      for (const side of [-1, 1]) for (let i = 0; i < n; i++) { const p = W((rnd() - 0.5) * (h.w + 0.6), side * (zc + 0.12 + rnd() * rnd() * 1.6)); add(p[0], p[1]); }
    }
    for (const s of town.stacks) if (s.clear) for (let i = 0; i < 7; i++) { const a = rnd() * 6.283, r = 0.75 + rnd() * 0.9; add(s.x + Math.cos(a) * r, s.z + Math.sin(a) * r); }
    { const C = plan.church, out0 = C.ridge / Math.tan(C.pitch * Math.PI / 180);      // either side of the church's ridge
      for (let i = 0; i < 70; i++) { const s = C.s0 + rnd() * (C.s1 - C.s0), side = rnd() < 0.5 ? -1 : 1, p = town.xz(s, C.d + side * (out0 + 0.15 + rnd() * rnd() * 1.8)); add(p[0], p[1]); } }
    { const H = plan.hall; for (let i = 0; i < 56; i++) { const s = H.s0 + rnd() * (H.s1 - H.s0), p = town.xz(s, H.d + H.ridgeWidth / 2 + 0.2 + rnd() * rnd() * 1.6); add(p[0], p[1]); } }      // along the glass ridge
    { const te = plan.square.terrace; for (let i = 0; i < 46; i++) { const s = te.s0 + rnd() * (te.s1 - te.s0), p = town.xz(s, te.d0 - 0.25 - rnd() * rnd() * 1.8); add(p[0], p[1]); } }           // along the terrace
    { const P = plan.poplars;                                                   // under the poplars, where they fell
      for (let i = 0; i < P.count; i++) for (const side of [-1, 1]) { const c = town.xz(P.s0 + i * P.step, side * P.d);
        for (let k = 0; k < 24; k++) { const a = rnd() * 6.283, r = 1.0 + rnd() * rnd() * 4.2; add(c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r, 1.1); } } }
    { const T = plan.theatre.portico;                                           // against the columns, and adrift under the portico: the current brings them here
      for (const d of T.columns) { const c = town.xz(T.s, d); for (let k = 0; k < 12; k++) { const a = Math.PI * (0.5 + rnd()), r = T.base / 2 + 0.12 + rnd() * rnd() * 0.9, up = town.along(T.s);
        add(c[0] + Math.cos(a + up) * r, c[1] - Math.sin(a + up) * r, 1.1); } }
      for (let k = 0; k < 70; k++) { const p = town.xz(221 + rnd() * 16, (rnd() * 2 - 1) * 16); add(p[0], p[1], 1.1); } }
    for (const c of town.copings) for (let k = 0; k < 5; k++) { const W = frame(c.x, c.z, c.yaw), side = c.d > 0 ? -1 : 1, p = W((rnd() - 0.5) * c.len, side * (0.45 + rnd() * 0.8)); add(p[0], p[1]); }
    // adrift in the open, a few (kept off the ridges and the piers the boat cannot cross)
    { const T = plan.tower, tw = town.xz(T.s, T.d), C = plan.church;
      for (let k = 0; k < 1700; k++) {
        const s = 16 + rnd() * 216, d = (rnd() * 2 - 1) * (town.hw(s) - 1.2), p = town.xz(s, d);
        if (Math.hypot(p[0] - tw[0], p[1] - tw[1]) < 5.2) continue;
        if (s > C.s0 - 1 && s < C.s1 + 2 && Math.abs(d - C.d) < 1.3) continue;
        add(p[0], p[1]);
      } }
    const n = list.length, mesh = new THREE.InstancedMesh(geo, null, n), aLeaf = new Float32Array(n * 4);
    const M = new THREE.Matrix4(), Qn = new THREE.Quaternion(), E = new THREE.Euler(), V = new THREE.Vector3(), S = new THREE.Vector3(), C = new THREE.Color();
    const hues = ['#2c2740', '#352b40', '#2a2a44', '#9a90ba', '#8a80aa', '#75698f', '#5c4a52'];      // dark tops; the lilac undersides of the poplar's leaves; one gone brown
    list.forEach((l, i) => {
      M.compose(V.set(l.x, 0, l.z), Qn.setFromEuler(E.set(0, l.yaw, 0)), S.setScalar(l.size)); mesh.setMatrixAt(i, M);
      mesh.setColorAt(i, C.set(hues[Math.floor(rnd() * hues.length)]).multiplyScalar(0.85 + rnd() * 0.3));
      aLeaf.set([rnd() * 100, l.eddy, (0.05 + rnd() * 0.09) * (rnd() < 0.5 ? -1 : 1), rnd()], i * 4);
    });
    geo.setAttribute('aLeaf', new THREE.InstancedBufferAttribute(aLeaf, 4));
    mesh.material = light.mat({ color: '#ffffff', vertexColors: true, side: THREE.DoubleSide, brush: 0.3, lit: 0, extend: {
      defines: { TOWN_AFLOAT: '' },                                             // (a thing afloat is all waterline: it takes no line of its own)
      uniforms: { uTownBoat: uBoat, tRipple: sh.tRipple, uRippleRect: sh.uRippleRect },
      vertexPars: 'attribute vec4 aLeaf; uniform vec4 uTownBoat, uRippleRect; uniform sampler2D tRipple;',
      vertexWorld: /* glsl */`
        #ifdef USE_INSTANCING
          vec3 lo = (modelMatrix * instanceMatrix[3]).xyz, lrel = wp.xyz - lo;                         // where the leaf lies, and this corner of it
          vec2 lh = lo.xz + vec2(cos(uTime * aLeaf.z + aLeaf.x), sin(uTime * aLeaf.z + aLeaf.x * 1.7)) * aLeaf.y;      // it turns in a slow eddy of its own
          float lturn = uTime * aLeaf.z * 0.7, lc = cos(lturn), ls = sin(lturn);
          lrel.xz = vec2(lrel.x * lc + lrel.z * ls, -lrel.x * ls + lrel.z * lc);
          { vec2 lf = uTownBoat.zw, lq = lh - uTownBoat.xy; float la = clamp(dot(lq, lf), -1.9, 2.3);  // the hull shoulders it aside
            vec2 lr = lq - lf * la; float ld = length(lr);
            lr = ld > 0.03 ? lr / ld : vec2(-lf.y, lf.x) * (aLeaf.w < 0.5 ? -1.0 : 1.0);
            lh += lr * (1.0 - smoothstep(0.7, 1.45, ld)) * 0.8; }
          vec2 luv = (lh - uRippleRect.xy) / uRippleRect.zw + 0.5;
          vec4 lrip = (luv.x > 0.0 && luv.x < 1.0 && luv.y > 0.0 && luv.y < 1.0) ? textureLod(tRipple, luv, 0.0) : vec4(0.0);
          wp.xz = lh + lrel.xz;
          wp.y = 0.014 + lrel.y + dot(lrip.xy, lrel.xz);                                                // it lies in the plane of the water where it floats
          wn = vec3(wn.x * lc + wn.z * ls, wn.y, -wn.x * ls + wn.z * lc); wn.xz -= lrip.xy * 0.8;
        #endif`,
    } });
    mesh.instanceMatrix.needsUpdate = true; mesh.instanceColor.needsUpdate = true; mesh.frustumCulled = false; mesh.name = 'town-leaves-afloat';
    ctx.add(mesh); ctx.only(mesh, 'direct');
    out.leaves = mesh;
  }

  // ---------------------------------------------------------------------------------------------- dust on the film
  if (!off.includes('dust')) {
    const n = kit.count(2600), box = 40, geo = new THREE.BufferGeometry(), seed = new Float32Array(n * 3), aux = new Float32Array(n * 2);
    for (let i = 0; i < n; i++) { seed.set([rnd() * box, 0, rnd() * box], i * 3); aux.set([0.6 + rnd() * 1.0, rnd() * 6.283], i * 2); }
    geo.setAttribute('position', new THREE.BufferAttribute(seed, 3)); geo.setAttribute('aAux', new THREE.BufferAttribute(aux, 2));
    const mat = new THREE.ShaderMaterial({
      uniforms: { ...light.U, uTime: sh.uTime, uFogColor: sh.uFogColor, uFogDensity: sh.uFogDensity, uVeil: sh.uVeil, uCameraPos: sh.uCameraPos, uLanternPos: sh.uLanternPos, uLanternColor: sh.uLanternColor, uLampPos: sh.uLampPos, uLampColor: sh.uLampColor, uLampRadius: sh.uLampRadius,
        tRipple: sh.tRipple, uRippleRect: sh.uRippleRect, uDust: { value: new THREE.Vector4(box, 900, 1, 0) }, uPale: { value: new THREE.Color('#b9b0d2') }, uDark: { value: new THREE.Color('#241c38') } },
      transparent: true, depthWrite: false, fog: false,
      vertexShader: /* glsl */`
        attribute vec2 aAux; uniform vec3 uCameraPos, uLanternPos, uLanternColor, uLampPos, uLampColor, uPale, uDark, uTownCloud; uniform float uTime, uLampRadius, uFogDensity, uVeil; uniform vec4 uDust, uRippleRect; uniform sampler2D tRipple;
        varying vec4 vCol;
        void main() {
          // still in the world: the field is one box of specks repeated, and each speck is drawn in the copy nearest the rider
          vec2 p = position.xz + vec2(sin(uTime * 0.021 + aAux.y), cos(uTime * 0.017 + aAux.y * 1.3)) * 0.35;      // the film creeps
          p = uCameraPos.xz + mod(p - uCameraPos.xz + uDust.x * 0.5, uDust.x) - uDust.x * 0.5;
          vec2 uv = (p - uRippleRect.xy) / uRippleRect.zw + 0.5;
          float wash = (uv.x > 0.0 && uv.x < 1.0 && uv.y > 0.0 && uv.y < 1.0) ? textureLod(tRipple, uv, 0.0).z : 0.0;       // churned water has shed its dust
          vec4 mv = viewMatrix * vec4(p.x, 0.008, p.y, 1.0); float d = length(mv.xyz);
          gl_Position = projectionMatrix * mv;
          float px = aAux.x * 0.011 * uDust.y / max(d, 0.3);                                                             // a speck of about a centimetre
          gl_PointSize = clamp(px, 1.2, 5.0);
          // the bow lantern and the kept lamp light it; otherwise it is a dark fleck against whatever burns beneath
          vec3 pw = vec3(p.x, 0.008, p.y), dl = uLanternPos - pw, dk = uLampPos - pw;
          float al = 1.0 - smoothstep(1.2, 6.5, length(dl)), ak = 1.0 - smoothstep(uLampRadius * 0.25, uLampRadius, length(dk));
          vec3 lamps = uLanternColor * (al * al) + uLampColor * (ak * ak * 0.8);
          float warm = clamp(dot(lamps, vec3(0.4, 0.4, 0.2)) * 1.6, 0.0, 1.0);
          vec3 tint = mix(vec3(1.0), lamps / max(max(lamps.r, max(lamps.g, lamps.b)), 1e-3), 0.45);                      // pale dust takes a little of the lamp's colour, never all of it
          float fade = (1.0 - smoothstep(9.0, 17.0, d)) * smoothstep(0.9, 2.2, d) * min(1.0, px * 0.8) * (1.0 - smoothstep(0.15, 0.6, wash)) * (1.0 - uVeil) * exp(-uFogDensity * uFogDensity * d * d);
          vCol = vec4(uPale * tint * mix(0.30, 0.85, warm), mix(0.30, 0.62, warm) * fade * uDust.z);
        }`,
      fragmentShader: /* glsl */`
        uniform vec4 uDust; varying vec4 vCol;
        void main() {
          if (uDust.w > 0.5) discard;
          float r = length(gl_PointCoord - 0.5) * 2.0, a = (1.0 - smoothstep(0.55, 1.0, r)) * vCol.a;
          if (a < 0.01) discard;
          gl_FragColor = vec4(vCol.rgb, a);
        }`,
    });
    const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; pts.renderOrder = 2; pts.name = 'town-dust-afloat';
    // the size of a speck follows the height of whatever picture it is being drawn into; it is not in the engine's picture of the scene without the water
    const size = new THREE.Vector2();
    pts.onBeforeRender = (renderer, scene, camera) => {
      const rt = renderer.getRenderTarget(); if (rt) size.set(rt.width, rt.height); else renderer.getDrawingBufferSize(size);
      mat.uniforms.uDust.value.y = size.y * 0.5 * camera.projectionMatrix.elements[5]; mat.uniforms.uDust.value.w = rt === ctx.engine.pre ? 1 : 0; mat.uniformsNeedUpdate = true;
    };
    ctx.add(pts); ctx.only(pts, 'direct');
    out.dust = pts;
  }

  // ---------------------------------------------------------------------------------------------- the sheen: what lies on the water as light
  // (Until the fifth holder of stage 2d this module drew its own sheet of sky-light over the water: fine crests on still
  // water, the far face of every ring. The water gives that itself now: `sheen`, `rest` and `tremor` among the look keys
  // of plan.js WATER (docs/water.md, "What the areas asked for"). The sheet is gone; docs/build/town/2-light.md says why
  // the water's own is the better picture here.)

  out.update = (dt, c) => { const b = c.boat; uBoat.value.set(b.x, b.z, -Math.sin(b.heading), -Math.cos(b.heading)); };
  shared.surface = out;
  return out;
}
