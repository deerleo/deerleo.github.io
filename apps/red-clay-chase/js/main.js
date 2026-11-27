'use strict';
/* Renderer, sky, post-processing, driving physics, traffic, camera, HUD and the main loop. */
(function () {
  const U = G.U;
  G.stats = { fps: 60, scale: 1, ms: 16 };
  G.uTime = { value: 0 }; G.uRealTime = { value: 0 }; G.slowmo = false;
  G.uSunV = { value: new THREE.Vector3(0, 1, 0) };
  G.uSunCol = { value: new THREE.Color(1, 0.9, 0.72) };
  const FOG = new THREE.Color().setRGB(0.50, 0.60, 0.74);
  const FOG_D = 0.00105;
  const VMAX = 58;

  /* Real-time reflections: a cube map rendered around the car is added on top of the static environment
     lighting as a sharp Fresnel layer. p = (F0, strength, blur LOD, alpha boost). */
  G.uCarSh = { value: null }; G.uCarShM = { value: new THREE.Matrix4().set(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0) };
  G.uDynEnv = { value: null }; G.uDynOn = { value: 0 }; G.uDynPos = { value: new THREE.Vector3() }; G.uDynRt = { value: new THREE.Vector2(1, 0) };
  G.dynRefl = function (mat, f0, str, lod, alpha, fpow, smoothN) {
    const p = new THREE.Vector4(f0, str, lod, alpha || 0), q = { value: fpow || 5 }, prev = mat.onBeforeCompile;
    mat.onBeforeCompile = function (sh, r) {
      prev.call(mat, sh, r);
      sh.uniforms.uDynEnv = G.uDynEnv; sh.uniforms.uDynOn = G.uDynOn; sh.uniforms.uDynPos = G.uDynPos; sh.uniforms.uDynRt = G.uDynRt; sh.uniforms.uDynP = { value: p }; sh.uniforms.uDynPow = q;
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform samplerCube uDynEnv; uniform float uDynOn; uniform vec4 uDynP; uniform float uDynPow; uniform vec3 uDynPos; uniform vec2 uDynRt;')
        .replace('#include <opaque_fragment>', `{
  vec3 dN = normalize( ${smoothN ? 'nonPerturbedNormal' : 'normal'} ); vec3 dV = normalize( vViewPosition );
  float dNV = clamp( dot( dN, dV ), 0.0, 1.0 );
  vec3 dR = normalize( ( vec4( reflect( - dV, dN ), 0.0 ) * viewMatrix ).xyz );
  {
    vec3 dO = cameraPosition + ( vec4( - vViewPosition, 0.0 ) * viewMatrix ).xyz - uDynPos;
    float dT = 1.0e4, dG = 0.0;
    if ( dR.y < -0.03 ) { dT = ( - 0.9 - dO.y ) / dR.y; dG = 1.0; }
    float dl = dot( dR.xz, uDynRt );
    if ( abs( dl ) > 0.06 ) { float tw = ( sign( dl ) * 11.0 - dot( dO.xz, uDynRt ) ) / dl; if ( tw > 0.0 && tw < dT ) { dT = tw; dG = 0.0; } }
    if ( dT > 0.0 && dT < 90.0 ) { vec3 dH = dO + dR * dT; dR = normalize( mix( dR, normalize( dH ), max( dG, smoothstep( 15.0, 6.0, dH.y ) ) ) ); }
  }
  float dF = uDynP.x + ( 1.0 - uDynP.x ) * pow( 1.0 - dNV, uDynPow );
  vec3 dC = min( textureCube( uDynEnv, dR, uDynP.z ).rgb, vec3( 5.0 ) );
  outgoingLight += dC * ( dF * uDynP.y * uDynOn );
  diffuseColor.a = clamp( diffuseColor.a + dF * uDynP.w * uDynOn, 0.0, 1.0 );
}
#include <opaque_fragment>`);
    };
    const key = 'dyn' + prev.toString().length + (smoothN ? 's' : '');
    mat.customProgramCacheKey = () => key;
    return mat;
  };

  let renderer, scene, camera, sun, hemi, sky, car, post, hud;
  const input = { up: 0, down: 0, left: 0, right: 0, hand: 0, pSt: 0, pThr: 0, pBrk: 0, pHb: 0, pY: false };

  /* ================= sky ================= */
  const SKY_FRAG = `
uniform vec3 uSun; uniform float uTime; uniform sampler2D tNoise; uniform vec3 uFog; uniform float uEnv;
varying vec3 vDir;
float cloudN(vec2 p) { return texture2D(tNoise, p * 0.5).r * 0.6 + texture2D(tNoise, p * 1.63 + 0.31).g * 0.27 + texture2D(tNoise, p * 4.7 + 0.11).b * 0.13; }
void main() {
  vec3 d = normalize(vDir);
  float h = max(d.y, 0.0);
  float t = pow(1.0 - h, 4.2);
  vec3 col = mix(vec3(0.03, 0.095, 0.34), vec3(0.32, 0.48, 0.74), t);
  col = mix(col, uFog, pow(1.0 - h, 13.0));
  float sd = max(dot(d, uSun), 0.0);
  col += vec3(1.0, 0.74, 0.46) * (pow(sd, 7.0) * 0.20 + pow(sd, 48.0) * 0.55) * (0.35 + 0.65 * t);
  if (d.y > 0.0) {
    vec2 p = d.xz / (d.y + 0.11) * 0.33 + uTime * vec2(0.0035, 0.0012);
    float n = cloudN(p);
    float cov = smoothstep(0.6, 0.77, n);
    float n2 = cloudN(p + normalize(uSun.xz) * 0.035);
    float lit = clamp(0.55 + (n - n2) * 7.0, 0.0, 1.0);
    vec3 cc = mix(vec3(0.50, 0.57, 0.70), vec3(1.45, 1.32, 1.14), lit) * (0.85 + 0.3 * pow(sd, 4.0));
    col = mix(col, cc, cov * smoothstep(0.015, 0.2, d.y) * 0.94);
  } else {
    col = mix(uFog, vec3(0.10, 0.12, 0.07), smoothstep(0.0, -0.12, d.y) * uEnv);
  }
  col += vec3(1.0, 0.88, 0.70) * mix(smoothstep(0.99986, 0.99996, sd) * 70.0, pow(sd, 700.0) * 26.0, uEnv);
  gl_FragColor = vec4(col, uEnv);
}`;
  function makeSky(noise, sunDir, env) {
    const m = new THREE.ShaderMaterial({
      uniforms: { uSun: { value: sunDir }, uTime: G.uTime, tNoise: { value: noise }, uFog: { value: FOG }, uEnv: { value: env ? 1 : 0 } },
      vertexShader: 'varying vec3 vDir; void main(){ vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: SKY_FRAG, side: THREE.BackSide, depthWrite: false, depthTest: !env ? false : true, fog: false,
    });
    const s = new THREE.Mesh(new THREE.SphereGeometry(env ? 500 : 4800, 32, 20), m);
    s.frustumCulled = false; s.renderOrder = -10;
    return s;
  }
  function makeEnv(noise, sunDir) {
    const es = new THREE.Scene();
    es.add(makeSky(noise, sunDir, true));
    // treeline band + ground so the paint has something to reflect
    const band = new THREE.CylinderGeometry(120, 120, 46, 48, 3, true), bp = band.attributes.position, bc = new Float32Array(bp.count * 3), nz = U.makeNoise(4);
    for (let i = 0; i < bp.count; i++) {
      const y = bp.getY(i), a = Math.atan2(bp.getZ(i), bp.getX(i)), t = (y + 23) / 46;
      if (t > 0.9) bp.setY(i, y - 14 + 14 * nz.n2(a * 5, 1.5) + 6 * nz.n2(a * 17, 4));
      const lit = 0.5 + 0.5 * Math.max(0, Math.cos(a) * -sunDir.x + Math.sin(a) * -sunDir.z);
      bc[i * 3] = (0.03 + 0.07 * t) * (0.6 + lit); bc[i * 3 + 1] = (0.05 + 0.1 * t) * (0.6 + lit); bc[i * 3 + 2] = (0.02 + 0.03 * t) * (0.6 + lit);
    }
    band.setAttribute('color', new THREE.BufferAttribute(bc, 3)); band.translate(0, 14, 0);
    es.add(new THREE.Mesh(band, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));
    const gr = new THREE.Mesh(new THREE.CircleGeometry(130, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: new THREE.Color().setRGB(0.2, 0.185, 0.165) }));
    gr.position.y = -1.3; es.add(gr);
    const pm = new THREE.PMREMGenerator(renderer);
    const rt = pm.fromScene(es, 0.012, 1, 1000);
    pm.dispose();
    return rt.texture;
  }
  function makeHorizon(sunDir) {
    const g = new THREE.Group(), nz = U.makeNoise(909);
    const rings = [[1750, 150, 0.56, 3.1], [2500, 240, 0.74, 7.7], [3500, 330, 0.87, 13.3]];
    for (const [rad, hgt, haze, seed] of rings) {
      const SEG = 220, pos = [], col = [], idx = [];
      const base = new THREE.Color().setRGB(0.085, 0.13, 0.075);
      for (let i = 0; i <= SEG; i++) {
        const a = i / SEG * Math.PI * 2, per = 7;
        const n = nz.fbm(Math.cos(a) * per + seed, Math.sin(a) * per + seed, 4), top = hgt * (0.5 + 0.9 * (n + 0.35)), r = rad * (1 + 0.05 * nz.n2(a * 3 + seed, 2));
        const lit = 1 + 0.5 * Math.max(0, -(Math.cos(a) * sunDir.x + Math.sin(a) * sunDir.z));
        for (const [y, hz] of [[-80, Math.min(1, haze + 0.22)], [Math.max(20, top) * 0.55, haze + 0.07], [Math.max(20, top), haze]]) {
          pos.push(Math.cos(a) * r, y, Math.sin(a) * r);
          col.push(U.lerp(base.r * lit, FOG.r, hz), U.lerp(base.g * lit, FOG.g, hz), U.lerp(base.b * lit, FOG.b, hz));
        }
        if (i < SEG) { const v = i * 3; idx.push(v, v + 3, v + 1, v + 1, v + 3, v + 4, v + 1, v + 4, v + 2, v + 2, v + 4, v + 5); }
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); geo.setIndex(idx);
      const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, fog: false, side: THREE.DoubleSide }));
      m.frustumCulled = false; m.matrixAutoUpdate = false; g.add(m);
    }
    return g;
  }

  /* ================= post-processing ================= */
  const FS_VERT = 'varying vec2 vUv; void main(){ vUv = position.xy * 0.5 + 0.5; gl_Position = vec4(position.xy, 0.0, 1.0); }';
  function Post() {
    const tri = new THREE.BufferGeometry(); tri.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
    const quad = new THREE.Mesh(tri, null); quad.frustumCulled = false;
    const qs = new THREE.Scene(); qs.add(quad);
    const qc = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const mat = (frag, uni, extra) => new THREE.ShaderMaterial(Object.assign({ vertexShader: FS_VERT, fragmentShader: frag, uniforms: uni, depthTest: false, depthWrite: false }, extra || {}));
    const mBright = mat(`uniform sampler2D tex; uniform vec2 px; varying vec2 vUv;
void main(){ vec3 c = vec3(0.0);
  c += texture2D(tex, vUv + px * vec2(-1.0, -1.0)).rgb; c += texture2D(tex, vUv + px * vec2(1.0, -1.0)).rgb;
  c += texture2D(tex, vUv + px * vec2(-1.0, 1.0)).rgb; c += texture2D(tex, vUv + px * vec2(1.0, 1.0)).rgb; c *= 0.25;
  c = min(c, vec3(14.0)); float br = max(c.r, max(c.g, c.b)); float w = max(br - 1.05, 0.0) / max(br, 1e-4);
  gl_FragColor = vec4(c * w, 1.0); }`, { tex: { value: null }, px: { value: new THREE.Vector2() } });
    const mDown = mat(`uniform sampler2D tex; uniform vec2 px; varying vec2 vUv;
void main(){ vec3 c = texture2D(tex, vUv).rgb * 4.0;
  c += texture2D(tex, vUv + px * vec2(-1.0, -1.0)).rgb; c += texture2D(tex, vUv + px * vec2(1.0, -1.0)).rgb;
  c += texture2D(tex, vUv + px * vec2(-1.0, 1.0)).rgb; c += texture2D(tex, vUv + px * vec2(1.0, 1.0)).rgb;
  gl_FragColor = vec4(c / 8.0, 1.0); }`, { tex: { value: null }, px: { value: new THREE.Vector2() } });
    const mUp = mat(`uniform sampler2D tex; uniform vec2 px; varying vec2 vUv;
void main(){ vec3 c = vec3(0.0);
  c += texture2D(tex, vUv + px * vec2(-1.0, -1.0)).rgb; c += texture2D(tex, vUv + px * vec2(1.0, -1.0)).rgb;
  c += texture2D(tex, vUv + px * vec2(-1.0, 1.0)).rgb; c += texture2D(tex, vUv + px * vec2(1.0, 1.0)).rgb;
  gl_FragColor = vec4(c * 0.25, 1.0); }`, { tex: { value: null }, px: { value: new THREE.Vector2() } }, { blending: THREE.AdditiveBlending, transparent: true });
    // screen-space ambient occlusion from the depth buffer (half resolution)
    const mAO = mat(`uniform sampler2D tDepth; uniform vec4 uProj; varying vec2 vUv;
float linZ(vec2 uv){ float d = texture2DLodEXT(tDepth, uv, 0.0).x; return uProj.x * uProj.y / (uProj.y - d * (uProj.y - uProj.x)); }
vec3 vpos(vec2 uv, float z){ return vec3((uv * 2.0 - 1.0) * vec2(uProj.z * uProj.w, uProj.z) * z, -z); }
float ign(vec2 p){ return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))); }
void main(){
  float z = linZ(vUv);
  if (z > 150.0) { gl_FragColor = vec4(1.0, 1.0, 0.0, 1.0); return; }
  vec3 P = vpos(vUv, z);
  vec3 N = normalize(cross(dFdx(P), dFdy(P)));
  float rad = 0.75 + z * 0.012;
  float ruv = min(rad / (2.0 * z * uProj.z), 0.1);
  float a0 = ign(gl_FragCoord.xy) * 6.2832, occ = 0.0;
  for (int i = 0; i < 10; i++) {
    float fi = (float(i) + 0.5) / 10.0, ang = a0 + fi * 16.3;
    vec2 suv = vUv + vec2(cos(ang) / uProj.w, sin(ang)) * (ruv * sqrt(fi));
    vec3 v = vpos(suv, linZ(suv)) - P;
    float dd = dot(v, v);
    occ += max(dot(v, N) - 0.012 * z - 0.02, 0.0) / (dd + 0.015) * smoothstep(rad * rad * 5.0, rad * rad * 2.0, dd);
  }
  float ao = clamp(1.0 - occ * 0.05, 0.0, 1.0);
  gl_FragColor = vec4(mix(ao, 1.0, smoothstep(60.0, 150.0, z)), z / 150.0, 0.0, 1.0);
}`, { tDepth: { value: null }, uProj: { value: new THREE.Vector4() } });
    const mAOB = mat(`uniform sampler2D tex; uniform vec2 px; varying vec2 vUv;
void main(){ vec2 c = texture2D(tex, vUv).xy; float s = 0.0, w = 0.0;
  for (int j = 0; j < 2; j++) for (int i = 0; i < 2; i++) {
    vec2 t = texture2DLodEXT(tex, vUv + (vec2(float(i), float(j)) * 2.0 - 1.0) * px * 2.0, 0.0).xy;
    float k = 1.0 / (1.0 + abs(t.y - c.y) * 600.0); s += t.x * k; w += k; }
  gl_FragColor = vec4(s / w, c.y, 0.0, 1.0); }`, { tex: { value: null }, px: { value: new THREE.Vector2() } });
    // light shafts: open sky (alpha 0) near the sun is smeared away from the sun position
    const mRay0 = mat(`uniform sampler2D tex; uniform vec2 px; uniform vec3 uSun; uniform float uAspect; varying vec2 vUv;
void main(){ vec4 c = texture2D(tex, vUv); vec2 sd = (vUv - uSun.xy) * vec2(uAspect, 1.0);
  gl_FragColor = vec4(vec3((1.0 - c.a) / (1.0 + dot(sd, sd) * 2.2) * min(0.4 + dot(c.rgb, vec3(0.3, 0.5, 0.2)), 1.6)), 1.0); }`, { tex: { value: null }, px: { value: new THREE.Vector2() }, uSun: { value: new THREE.Vector3() }, uAspect: { value: 1.6 } });
    const mRay = mat(`uniform sampler2D tex; uniform vec2 px; uniform vec3 uSun; uniform float uLen; varying vec2 vUv;
void main(){ vec2 dir = (uSun.xy - vUv) * (uLen / 12.0), p = vUv; float acc = 0.0, w = 1.0, tot = 0.0;
  for (int i = 0; i < 12; i++) { acc += texture2DLodEXT(tex, p, 0.0).r * w; tot += w; w *= 0.94; p += dir; }
  gl_FragColor = vec4(vec3(acc / tot), 1.0); }`, { tex: { value: null }, px: { value: new THREE.Vector2() }, uSun: { value: new THREE.Vector3() }, uLen: { value: 0.9 } });
    const mFinal = mat(`uniform sampler2D tScene; uniform sampler2D tBloom; uniform sampler2D tAO; uniform sampler2D tRays; uniform float uAO; uniform float uRay; uniform float uTime; uniform float uExposure; uniform float uBloom;
uniform vec2 uPx; uniform float uSpeed; uniform vec3 uSun; uniform float uAspect; uniform float uMenu; varying vec2 vUv;
vec3 aces(vec3 x){ return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
float hash(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
void main(){
  vec2 d = vUv - vec2(0.5, 0.45);
  float r2 = dot(d, d);
  vec3 c0 = texture2D(tScene, vUv).rgb;
  // sharpen
  vec3 nb = texture2D(tScene, vUv + vec2(uPx.x, 0.0)).rgb + texture2D(tScene, vUv - vec2(uPx.x, 0.0)).rgb + texture2D(tScene, vUv + vec2(0.0, uPx.y)).rgb + texture2D(tScene, vUv - vec2(0.0, uPx.y)).rgb;
  vec3 c = c0 + clamp(c0 - nb * 0.25, -0.25, 0.25) * 0.55;
  if (uMenu > 0.002) { // settings menu: slight soft focus
    vec2 o = uPx * 1.7;
    vec3 bl = c0 * 0.2 + nb * 0.02;
    bl += (texture2D(tScene, vUv + o * vec2(1.0, 0.38)).rgb + texture2D(tScene, vUv - o * vec2(1.0, 0.38)).rgb + texture2D(tScene, vUv + o * vec2(-0.38, 1.0)).rgb + texture2D(tScene, vUv - o * vec2(-0.38, 1.0)).rgb) * 0.11;
    bl += (texture2D(tScene, vUv + o * vec2(1.2, -1.2)).rgb + texture2D(tScene, vUv - o * vec2(1.2, -1.2)).rgb + texture2D(tScene, vUv + o * vec2(1.2, 1.2)).rgb + texture2D(tScene, vUv - o * vec2(1.2, 1.2)).rgb) * 0.07;
    c = mix(c, bl, uMenu);
  }
  // radial blur that grows with speed, the car in the middle stays crisp
  float amt = uSpeed * 0.03 * smoothstep(0.04, 0.34, r2);
  float dj = hash(gl_FragCoord.xy + 3.7);
  vec3 cb = vec3(0.0);
  for (int i = 0; i < 7; i++) cb += texture2DLodEXT(tScene, vUv - d * (amt * (float(i) + dj) / 7.0), 0.0).rgb;
  c = mix(c, cb / 7.0, clamp(amt * 110.0, 0.0, 1.0));
  // slight lens fringe towards the corners
  vec2 ca = d * (0.0006 * smoothstep(0.06, 0.5, r2));
  c.r = mix(c.r, texture2D(tScene, vUv - ca).r, 0.6); c.b = mix(c.b, texture2D(tScene, vUv + ca).b, 0.6);
  float ao = texture2D(tAO, vUv).r;
  c *= mix(vec3(1.0), vec3(ao, mix(ao, 1.0, 0.04), mix(ao, 1.0, 0.1)), uAO);
  vec3 b = texture2D(tBloom, vUv).rgb;
  c += b * uBloom;
  float ry = texture2D(tRays, vUv).r;
  c += vec3(1.0, 0.8, 0.54) * (ry * ry * uRay);
  // sun flare (only when the disc itself is on screen and not hidden: the bloom buffer tells us)
  if (uSun.z > 0.001) {
    float occ = uSun.z;
    vec2 a = vec2(uAspect, 1.0), sd = (vUv - uSun.xy) * a; float sl = length(sd);
    vec3 fl = vec3(1.0, 0.8, 0.56) * (exp(-sl * 4.2) * 0.2 + exp(-sl * 14.0) * 0.5);
    fl += vec3(1.0, 0.66, 0.36) * exp(-abs(sd.y) * 80.0) * exp(-abs(sd.x) * 2.4) * 0.3;
    vec2 gv = vUv - 0.5, sv = uSun.xy - 0.5;
    fl += vec3(0.6, 0.34, 0.14) * smoothstep(0.045, 0.02, length((gv + sv * 0.62) * a)) * 0.1;
    fl += vec3(0.22, 0.3, 0.6) * smoothstep(0.15, 0.1, length((gv + sv * 0.9) * a)) * 0.05;
    c += fl * occ * 0.55;
  }
  c *= uExposure;
  c = aces(c);
  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  c = mix(vec3(l), c, 0.9 - 0.13 * uMenu);
  c = mix(c, c * c * (3.0 - 2.0 * c), 0.46);
  c *= mix(vec3(0.95, 0.99, 1.05), vec3(1.05, 1.0, 0.93), smoothstep(0.05, 0.75, l));
  c = pow(max(c, 0.0), vec3(1.0 / 2.2));
  vec2 q = (vUv - 0.5) * vec2(1.0, 0.86);
  c *= mix(0.3, 1.0, smoothstep(0.98, 0.26, length(q))) * (1.0 - 0.3 * smoothstep(0.5, 1.0, vUv.y));
  float g = hash(gl_FragCoord.xy + fract(uTime * 7.31) * 517.0) - 0.5;
  c += g * 0.038 * (1.0 - 0.55 * l);
  gl_FragColor = vec4(c, 1.0);
}`, { tScene: { value: null }, tBloom: { value: null }, tAO: { value: null }, tRays: { value: null }, uAO: { value: 0 }, uRay: { value: 0 }, uTime: G.uRealTime, uExposure: { value: 1.04 }, uBloom: { value: 0.06 }, uPx: { value: new THREE.Vector2() }, uSpeed: { value: 0 }, uSun: { value: new THREE.Vector3() }, uAspect: { value: 1.6 }, uMenu: { value: 0 } });
    const hdr = renderer.capabilities.isWebGL2 && (renderer.extensions.has('EXT_color_buffer_float') || renderer.extensions.has('EXT_color_buffer_half_float'));
    const type = hdr ? THREE.HalfFloatType : THREE.UnsignedByteType;
    const self = this;
    this.samples = 4; this.final = mFinal; this.fx = true;
    let rtScene = null, rtAO = null, rtAO2 = null, rtR1 = null, rtR2 = null; const mips = []; const NM = 6;
    const white = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1); white.needsUpdate = true;
    const black = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1); black.needsUpdate = true;
    this.resize = function (w, h) {
      for (const r of [rtScene, rtAO, rtAO2, rtR1, rtR2]) if (r) r.dispose();
      for (const m of mips) m.dispose(); mips.length = 0;
      const lin = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter };
      rtScene = new THREE.WebGLRenderTarget(w, h, Object.assign({ type, samples: self.samples, depthBuffer: true }, lin));
      rtAO = rtAO2 = rtR1 = rtR2 = null;
      if (self.fx) {
        const dt = new THREE.DepthTexture(w, h); dt.type = THREE.UnsignedIntType; dt.minFilter = dt.magFilter = THREE.NearestFilter; rtScene.depthTexture = dt;
        const hw = Math.max(2, w >> 1), hh = Math.max(2, h >> 1), qw = Math.max(2, w >> 2), qh = Math.max(2, h >> 2);
        rtAO = new THREE.WebGLRenderTarget(hw, hh, Object.assign({ depthBuffer: false }, lin)); rtAO2 = new THREE.WebGLRenderTarget(hw, hh, Object.assign({ depthBuffer: false }, lin));
        rtR1 = new THREE.WebGLRenderTarget(qw, qh, Object.assign({ type, depthBuffer: false }, lin)); rtR2 = new THREE.WebGLRenderTarget(qw, qh, Object.assign({ type, depthBuffer: false }, lin));
      }
      let mw = w, mh = h;
      for (let i = 0; i < NM; i++) {
        mw = Math.max(2, mw >> 1); mh = Math.max(2, mh >> 1);
        mips.push(new THREE.WebGLRenderTarget(mw, mh, Object.assign({ type, depthBuffer: false }, lin)));
      }
      self.w = w; self.h = h;
    };
    const pass = (m, src, dst) => {
      m.uniforms.tex.value = src.texture; m.uniforms.px.value.set(0.5 / src.width, 0.5 / src.height);
      quad.material = m; renderer.setRenderTarget(dst); renderer.render(qs, qc);
    };
    this.render = function (sc, cam, rayAmt) {
      renderer.setRenderTarget(rtScene); renderer.render(sc, cam);
      const ac = renderer.autoClear; renderer.autoClear = false; renderer.shadowMap.autoUpdate = false;
      const fu = mFinal.uniforms;
      if (self.fx && rtAO) {
        mAO.uniforms.tDepth.value = rtScene.depthTexture;
        mAO.uniforms.uProj.value.set(cam.near, cam.far, Math.tan(cam.fov * Math.PI / 360), cam.aspect);
        quad.material = mAO; renderer.setRenderTarget(rtAO); renderer.render(qs, qc);
        pass(mAOB, rtAO, rtAO2);
        fu.tAO.value = rtAO2.texture; fu.uAO.value = 0.85;
        if (rayAmt > 0.01) {
          mRay0.uniforms.uSun.value.copy(fu.uSun.value); mRay0.uniforms.uAspect.value = rtScene.width / rtScene.height; pass(mRay0, rtScene, rtR1);
          mRay.uniforms.uSun.value.copy(fu.uSun.value);
          mRay.uniforms.uLen.value = 0.9; pass(mRay, rtR1, rtR2);
          mRay.uniforms.uLen.value = 0.9 / 12; pass(mRay, rtR2, rtR1);
          fu.tRays.value = rtR1.texture; fu.uRay.value = rayAmt;
        } else { fu.tRays.value = black; fu.uRay.value = 0; }
      } else { fu.tAO.value = white; fu.uAO.value = 0; fu.tRays.value = black; fu.uRay.value = 0; }
      pass(mBright, rtScene, mips[0]);
      for (let i = 1; i < NM; i++) pass(mDown, mips[i - 1], mips[i]);
      for (let i = NM - 2; i >= 0; i--) pass(mUp, mips[i + 1], mips[i]);
      fu.tScene.value = rtScene.texture; fu.tBloom.value = mips[0].texture;
      fu.uPx.value.set(1 / rtScene.width, 1 / rtScene.height); fu.uAspect.value = rtScene.width / rtScene.height;
      quad.material = mFinal; renderer.setRenderTarget(null); renderer.render(qs, qc);
      renderer.autoClear = ac; renderer.shadowMap.autoUpdate = true;
    };
  }

  /* ================= car shadow =================
     The landscape shadow map has ~5 cm texels: far too coarse for the car the camera sits behind. The car (and the people in it)
     is drawn into its own small depth map instead, ~0.6 cm per texel, double-sided so open panels cannot leak light. */
  const CAR_SH = { half: 3.0, range: 16 };
  function CarShadow(weak) {
    const S = weak ? 512 : 1024, H = CAR_SH.half, RG = CAR_SH.range;
    const rt = new THREE.WebGLRenderTarget(S, S, { depthBuffer: true, depthTexture: new THREE.DepthTexture(S, S, THREE.UnsignedIntType), minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, generateMipmaps: false });
    const sc = new THREE.OrthographicCamera(-H, H, H, -H, 0, RG); sc.layers.set(2);
    const mat = new THREE.MeshBasicMaterial({ colorWrite: false, side: THREE.DoubleSide });
    const bias = new THREE.Matrix4().set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1), c = new THREE.Vector3();
    // receivers: the car itself and the ground / roadside it drives past (trees, signs, traffic and far scenery skip the extra shader work)
    const recv = (m, v) => { if (!m || m.isMeshBasicMaterial || (m.defines && m.defines.CAR_SH)) return; m.defines = m.defines || {}; m.defines.CAR_SH = v || 1; m.needsUpdate = true; };
    car.root.traverse(o => { if (!o.isMesh) return; if (o.castShadow && !o.material.transparent) o.layers.enable(2); o.castShadow = false; recv(o.material, o.material.side === THREE.DoubleSide ? 1 : 2); });
    for (const k of ['terrain', 'road', 'patch', 'grass', 'color', 'metal', 'concrete', 'wood']) recv(G.mats[k]);
    G.uCarSh.value = rt.depthTexture;
    sun.layers.enable(2); hemi.layers.enable(2); // same light set in this pass as in the main one, otherwise three.js re-validates every material twice a frame
    this.enabled = true;
    this.update = function () {
      if (!this.enabled) { G.uCarShM.value.elements.fill(0); return; }
      car.root.updateMatrixWorld();
      c.set(0, 0.6, 0).applyMatrix4(car.root.matrixWorld);
      sc.position.copy(c).addScaledVector(G.sunDir, RG * 0.5); sc.lookAt(c); sc.updateMatrixWorld();
      const om = scene.overrideMaterial, au = renderer.shadowMap.autoUpdate;
      scene.overrideMaterial = mat; renderer.shadowMap.autoUpdate = false;
      renderer.setRenderTarget(rt); renderer.render(scene, sc); renderer.setRenderTarget(null);
      scene.overrideMaterial = om; renderer.shadowMap.autoUpdate = au;
      G.uCarShM.value.multiplyMatrices(sc.projectionMatrix, sc.matrixWorldInverse).premultiply(bias);
    };
  }

  /* ================= reflection probe ================= */
  function Reflect(weak) {
    const self = this; let size = weak ? 128 : 512;
    this.size = size; this.mode = weak ? 1 : 2; // 2: every 2nd frame, long range; 1: every 4th frame, short range; 0: off
    const mk = () => new THREE.WebGLCubeRenderTarget(size, { type: THREE.HalfFloatType, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.LinearFilter });
    let a = mk(), b = mk();
    const cc = new THREE.CubeCamera(0.4, 700, a);
    cc.layers.set(1); cc.coordinateSystem = renderer.coordinateSystem; cc.updateCoordinateSystem();
    let face = 0; const nextPos = new THREE.Vector3();
    this.update = function (all) {
      // two buffers: materials read the finished cube while the next one is drawn a few faces per frame
      const range = self.mode === 2 ? 430 : 230, n = all ? 6 : self.mode === 2 ? 3 : 1;
      for (const ch of G.chunks) { const v = Math.hypot(ch.cx - P.x, ch.cz - P.z) < range; for (const m of ch.lo) m.visible = v; for (const m of ch.objs) m.visible = v; }
      if (face === 0) { cc.position.set(P.x + P.vx * 0.045, P.y + 0.9, P.z + P.vz * 0.045); cc.updateMatrixWorld(true); nextPos.copy(cc.position); }
      const au = renderer.shadowMap.autoUpdate; renderer.shadowMap.autoUpdate = false;
      for (let k = 0; k < n; k++) {
        b.texture.generateMipmaps = face === 5; renderer.setRenderTarget(b, face); renderer.render(scene, cc.children[face]);
        if (++face === 6) { face = 0; const t = a; a = b; b = t; G.uDynEnv.value = a.texture; G.uDynOn.value = 1; G.uDynPos.value.copy(nextPos); break; }
      }
      renderer.setRenderTarget(null); renderer.shadowMap.autoUpdate = au;
    };
    this.setSize = function (n, quiet) {
      if (n === size) return;
      size = self.size = n; a.dispose(); b.dispose(); a = mk(); b = mk(); face = 0; G.uDynOn.value = 0;
      if (!quiet && self.mode > 0) self.update(true);
    };
    this.setMode = function (m) { self.mode = m; if (m === 0) G.uDynOn.value = 0; if (G.car) G.car.M.paint.envMapIntensity = m === 0 ? 0.8 : 0.4; };
  }

  /* ================= effects: skid marks + smoke ================= */
  function Skids() {
    const MAX = 900, pos = new Float32Array(MAX * 12), col = new Float32Array(MAX * 16), idx = new Uint16Array(MAX * 6);
    for (let i = 0; i < MAX; i++) { const v = i * 4; idx.set([v, v + 1, v + 2, v + 1, v + 3, v + 2], i * 6); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 4)); g.setIndex(new THREE.BufferAttribute(idx, 1));
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3, side: THREE.DoubleSide }));
    m.frustumCulled = false; m.renderOrder = 2; scene.add(m);
    let n = 0; const last = [null, null];
    this.add = function (w, x, y, z, a) {
      const l = last[w];
      if (a <= 0.02) { last[w] = null; return; }
      if (!l) { last[w] = { x, y, z, a, px: 0, pz: 0, has: false }; return; }
      const dx = x - l.x, dz = z - l.z, d = Math.hypot(dx, dz);
      if (d < 0.3) return;
      if (d > 4) { last[w] = { x, y, z, a, px: 0, pz: 0, has: false }; return; }
      const nx = -dz / d * 0.11, nzz = dx / d * 0.11, o = (n % MAX) * 12, c = (n % MAX) * 16;
      const ax = l.has ? l.px : nx, az = l.has ? l.pz : nzz;
      pos[o] = l.x - ax; pos[o + 1] = l.y + 0.025; pos[o + 2] = l.z - az; pos[o + 3] = l.x + ax; pos[o + 4] = l.y + 0.025; pos[o + 5] = l.z + az;
      pos[o + 6] = x - nx; pos[o + 7] = y + 0.025; pos[o + 8] = z - nzz; pos[o + 9] = x + nx; pos[o + 10] = y + 0.025; pos[o + 11] = z + nzz;
      for (let k = 0; k < 4; k++) { col[c + k * 4] = 0.012; col[c + k * 4 + 1] = 0.012; col[c + k * 4 + 2] = 0.013; col[c + k * 4 + 3] = (k < 2 ? l.a : a) * 0.62; }
      g.attributes.position.needsUpdate = true; g.attributes.color.needsUpdate = true;
      n++;
      last[w] = { x, y, z, a, px: nx, pz: nzz, has: true };
    };
  }
  function Smoke(tex) {
    const MAX = 320, pos = new Float32Array(MAX * 3), dat = new Float32Array(MAX * 4), colr = new Float32Array(MAX * 3), vel = new Float32Array(MAX * 3), life = new Float32Array(MAX).fill(9);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aDat', new THREE.BufferAttribute(dat, 4)); g.setAttribute('aCol', new THREE.BufferAttribute(colr, 3));
    const m = new THREE.ShaderMaterial({
      uniforms: { tex: { value: tex }, uScale: { value: 800 }, uFog: { value: FOG }, uFogD: { value: FOG_D } },
      vertexShader: `attribute vec4 aDat; attribute vec3 aCol; uniform float uScale; varying float vA; varying vec3 vC; varying float vF; varying float vR;
void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = aDat.x * uScale / max(0.1, -mv.z); vA = aDat.y; vC = aCol; vF = -mv.z; vR = aDat.z; }`,
      fragmentShader: `uniform sampler2D tex; uniform vec3 uFog; uniform float uFogD; varying float vA; varying vec3 vC; varying float vF; varying float vR;
void main(){ vec2 p = gl_PointCoord - 0.5; float c = cos(vR), s = sin(vR); p = vec2(c * p.x - s * p.y, s * p.x + c * p.y) + 0.5;
  float a = texture2D(tex, p).a * vA; if (a < 0.003) discard; float f = 1.0 - exp(-uFogD * uFogD * vF * vF);
  gl_FragColor = vec4(mix(vC, uFog, f), a); }`,
      transparent: true, depthWrite: false,
    });
    const pts = new THREE.Points(g, m); pts.frustumCulled = false; pts.renderOrder = 5; scene.add(pts);
    let cur = 0;
    this.mat = m;
    this.emit = function (x, y, z, vx, vy, vz, size, a, r, gg, b) {
      const i = cur++ % MAX;
      pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z; vel[i * 3] = vx; vel[i * 3 + 1] = vy; vel[i * 3 + 2] = vz;
      life[i] = 0; dat[i * 4] = size; dat[i * 4 + 1] = a; dat[i * 4 + 2] = Math.random() * 6.28; dat[i * 4 + 3] = a;
      colr[i * 3] = r; colr[i * 3 + 1] = gg; colr[i * 3 + 2] = b;
    };
    this.update = function (dt) {
      for (let i = 0; i < MAX; i++) {
        if (life[i] > 1.6) { dat[i * 4 + 1] = 0; continue; }
        life[i] += dt; const t = life[i] / 1.6;
        pos[i * 3] += vel[i * 3] * dt; pos[i * 3 + 1] += vel[i * 3 + 1] * dt; pos[i * 3 + 2] += vel[i * 3 + 2] * dt;
        vel[i * 3] *= 1 - 1.8 * dt; vel[i * 3 + 2] *= 1 - 1.8 * dt;
        dat[i * 4] += dt * 1.25; dat[i * 4 + 1] = dat[i * 4 + 3] * (1 - t) * (1 - t) * Math.min(1, t * 10); dat[i * 4 + 2] += dt * 0.4;
      }
      g.attributes.position.needsUpdate = true; g.attributes.aDat.needsUpdate = true; g.attributes.aCol.needsUpdate = true;
    };
  }

  function Motes() {
    const N = 170, p = new Float32Array(N * 3), pos = new Float32Array(N * 6), colr = new Float32Array(N * 6), br = new Float32Array(N);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(colr, 3));
    const m = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    m.frustumCulled = false; m.renderOrder = 6; scene.add(m);
    const spawn = (i, fx, fz, near) => {
      const a = near ? Math.random() * 70 - 6 : 38 + Math.random() * 34, l = (Math.random() - 0.5) * 34;
      p[i * 3] = camera.position.x + fx * a - fz * l; p[i * 3 + 2] = camera.position.z + fz * a + fx * l;
      p[i * 3 + 1] = P.y + 0.25 + Math.random() * Math.random() * 6.5; br[i] = 0.35 + Math.random() * 0.65;
    };
    let init = false;
    this.update = function (dt) {
      const sp = Math.hypot(P.vx, P.vz), fx = Math.sin(cam.yaw), fz = Math.cos(cam.yaw), k = U.smooth(9, 42, sp) * 0.3, len = 0.008 + sp * 0.00025;
      if (!init) { for (let i = 0; i < N; i++) spawn(i, fx, fz, true); init = true; }
      for (let i = 0; i < N; i++) {
        const dx = p[i * 3] - camera.position.x, dz = p[i * 3 + 2] - camera.position.z, al = dx * fx + dz * fz, la = -dx * fz + dz * fx;
        if (al < -6 || al > 80 || Math.abs(la) > 19) spawn(i, fx, fz, false);
        p[i * 3 + 1] += Math.sin(G.uTime.value * 0.7 + i) * 0.05 * dt;
        const o = i * 6, x = p[i * 3], y = p[i * 3 + 1], z = p[i * 3 + 2];
        pos[o] = x; pos[o + 1] = y; pos[o + 2] = z; pos[o + 3] = x + P.vx * len; pos[o + 4] = y; pos[o + 5] = z + P.vz * len;
        const c = k * br[i] * U.smooth(-6, 4, al) * U.smooth(80, 50, al) * 0.5;
        colr[o] = c; colr[o + 1] = c * 0.93; colr[o + 2] = c * 0.78; colr[o + 3] = 0; colr[o + 4] = 0; colr[o + 5] = 0;
      }
      g.attributes.position.needsUpdate = true; g.attributes.color.needsUpdate = true;
    };
  }

  /* ================= sound: engine, wind, tyres (starts with the first key press or touch, M mutes) ================= */
  /* one gunshot at time t for a shooter d metres away, built from white noise wb; also used offline by the tests */
  G.synthShot = function (ctx, dest, wb, t, d) {
    const near = 1 / (1 + d * d / 900), r = 0.92 + Math.random() * 0.16;
    const bus = ctx.createGain(); bus.gain.value = 0.26 + 0.6 * near;
    const tone = ctx.createBiquadFilter(); tone.type = 'lowpass'; tone.frequency.value = 2200 + 11000 * near; bus.connect(tone); tone.connect(dest);
    const nz = (t0, dur, type, f0, f1, q, g0, atk, tau) => { // filtered noise: quick attack, then an exponential die-away with time constant tau
      const src = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
      src.buffer = wb; fl.type = type; fl.Q.value = q; fl.frequency.setValueAtTime(f0 * r, t0); fl.frequency.exponentialRampToValueAtTime(f1 * r, t0 + dur);
      g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(g0, t0 + atk); g.gain.setTargetAtTime(0, t0 + atk, tau);
      src.connect(fl); fl.connect(g); g.connect(bus); src.start(t0, Math.random() * 0.4, dur);
    };
    nz(t, 0.05, 'highpass', 2600, 2600, 0.7, 0.75, 0.0008, 0.007);      // crack
    nz(t, 0.34, 'bandpass', 1300, 300, 0.7, 1.0, 0.002, 0.05);          // report, falling in pitch
    nz(t + 0.01, 0.9, 'lowpass', 1100, 240, 0.6, 0.3, 0.02, 0.17);      // tail rolling away
    const o = ctx.createOscillator(), og = ctx.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(165 * r, t); o.frequency.exponentialRampToValueAtTime(48, t + 0.12);
    og.gain.setValueAtTime(0, t); og.gain.linearRampToValueAtTime(0.7, t + 0.003); og.gain.setTargetAtTime(0, t + 0.003, 0.045);
    o.connect(og); og.connect(bus); o.start(t); o.stop(t + 0.3);          // thump
    for (const [dl, g] of [[0.105, 0.3], [0.22, 0.16]]) {          // slap-back off the banks and the tree line
      const dn = ctx.createDelay(0.5), eg = ctx.createGain(), ef = ctx.createBiquadFilter(); dn.delayTime.value = dl; eg.gain.value = g; ef.type = 'lowpass'; ef.frequency.value = 1500;
      bus.connect(dn); dn.connect(ef); ef.connect(eg); eg.connect(dest);
    }
  };
  function Sound() {
    let ctx = null, n = null, muted = false, hitBuf = null, hitOut = null, sirenV = 0, whiteBuf = null, shotBus = null, meter = null;
    this.start = function () {
      if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      try {
        ctx = new AC();
        const master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
        meter = ctx.createAnalyser(); meter.fftSize = 2048; master.connect(meter);
        const comp = ctx.createDynamicsCompressor(); comp.connect(master);
        const nb = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate), d = nb.getChannelData(0); let lastV = 0;
        for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; lastV = lastV * 0.6 + w * 0.4; d[i] = lastV; }
        const noise = (type, f, q) => { const s = ctx.createBufferSource(); s.buffer = nb; s.loop = true; const fl = ctx.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q; const g = ctx.createGain(); g.gain.value = 0; s.connect(fl); fl.connect(g); g.connect(comp); s.start(); return { fl, g }; };
        const eg = ctx.createGain(); eg.gain.value = 0; const ef = ctx.createBiquadFilter(); ef.type = 'lowpass'; ef.frequency.value = 500; ef.Q.value = 1.2; ef.connect(eg); eg.connect(comp);
        const osc = (type, gain) => { const o = ctx.createOscillator(); o.type = type; o.frequency.value = 60; const g = ctx.createGain(); g.gain.value = gain; o.connect(g); g.connect(ef); o.start(); return o; };
        hitBuf = nb; hitOut = comp;
        whiteBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate); { const w = whiteBuf.getChannelData(0); for (let i = 0; i < w.length; i++) w[i] = Math.random() * 2 - 1; }
        // gunfire skips the compressor (it would flatten the crack) and goes through a soft clipper instead
        shotBus = ctx.createGain(); shotBus.gain.value = 0.8; { const ws = ctx.createWaveShaper(), cv = new Float32Array(257); for (let i = 0; i < 257; i++) cv[i] = Math.tanh((i / 128 - 1) * 1.6); ws.curve = cv; shotBus.connect(ws); ws.connect(master); }
        const so = ctx.createOscillator(); so.type = 'square'; so.frequency.value = 980; const sfl = ctx.createBiquadFilter(); sfl.type = 'lowpass'; sfl.frequency.value = 2100;
        const sg = ctx.createGain(); sg.gain.value = 0; const lfo = ctx.createOscillator(); lfo.frequency.value = 0.42; const lg = ctx.createGain(); lg.gain.value = 360;
        lfo.connect(lg); lg.connect(so.frequency); so.connect(sfl); sfl.connect(sg); sg.connect(comp); so.start(); lfo.start();
        n = { master, eg, ef, o1: osc('sawtooth', 0.5), o2: osc('square', 0.28), o3: osc('sawtooth', 0.22), wind: noise('bandpass', 500, 0.5), road: noise('lowpass', 160, 0.7), skid: noise('bandpass', 1700, 5), sg };
        master.gain.setTargetAtTime(muted ? 0 : 0.5, ctx.currentTime, 0.4);
      } catch (e) { ctx = null; n = null; }
    };
    this.hit = function (v) {
      if (!n) return;
      const t = ctx.currentTime, src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      src.buffer = hitBuf; f.type = 'lowpass'; f.frequency.value = 900; g.gain.setValueAtTime(Math.min(0.5, 0.15 + v * 0.01), t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
      src.connect(f); f.connect(g); g.connect(hitOut); src.start(t, Math.random() * 1.5, 0.2);
    };
    const burst = (dur, type, f0, f1, vol, qv) => { // filtered noise burst
      if (!n || vol < 0.004) return;
      const t = ctx.currentTime, src = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
      src.buffer = hitBuf; fl.type = type; fl.Q.value = qv || 0.7; fl.frequency.setValueAtTime(f0, t); fl.frequency.exponentialRampToValueAtTime(f1, t + dur);
      g.gain.setValueAtTime(Math.min(0.9, vol), t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      src.connect(fl); fl.connect(g); g.connect(hitOut); src.start(t, Math.random() * 1.5, dur + 0.05);
    };
    this.shot = function (d) { if (n) G.synthShot(ctx, shotBus, whiteBuf, ctx.currentTime + 0.002, d); };
    this.ping = function () { burst(0.07, 'bandpass', 4600, 2400, 0.3, 7); };
    this.crack = function (v) { const k = Math.min(1, 0.25 + v * 0.03); burst(0.07, 'bandpass', 2500, 900, 0.5 * k, 1.6); burst(0.16, 'lowpass', 800, 180, 0.4 * k); }; // splintering wood
    this.crash = function (v) { const k = Math.min(1, v / 14); burst(0.3 + k * 0.35, 'lowpass', 1500, 110, 0.12 + k * 0.6); burst(0.12, 'bandpass', 3200, 900, k * 0.3, 1.2); };
    this.siren = function (v) { sirenV = v; };
    this.state = () => ctx ? ctx.state : 'none';
    this.level = function () { if (!meter) return 0; const d = new Float32Array(meter.fftSize); meter.getFloatTimeDomainData(d); let s2 = 0; for (let i = 0; i < d.length; i++) s2 += d[i] * d[i]; return Math.sqrt(s2 / d.length); };
    this.toggle = function () { muted = !muted; if (n) n.master.gain.setTargetAtTime(muted ? 0 : 0.5, ctx.currentTime, 0.1); };
    this.update = function (dt, sp, thr, skid, paused) {
      if (!n) return;
      const t = ctx.currentTime, set = (prm, v, tc) => prm.setTargetAtTime(v, t, tc);
      set(n.sg.gain, paused ? 0 : sirenV, 0.12);
      if (paused) { set(n.eg.gain, 0, 0.1); set(n.wind.g.gain, 0, 0.1); set(n.road.g.gain, 0, 0.1); set(n.skid.g.gain, 0, 0.1); return; }
      const rn = P.rpmN, shiftT = P.shiftT, rpm = 950 + rn * 5600, f = rpm / 60 * 1.5;
      set(n.o1.frequency, f, 0.05); set(n.o2.frequency, f * 0.5, 0.05); set(n.o3.frequency, f * 2.01, 0.05);
      set(n.ef.frequency, 260 + rn * 1500 + thr * 900, 0.08);
      set(n.eg.gain, (0.05 + 0.1 * thr + 0.03 * rn) * (shiftT > 0 ? 0.35 : 1), 0.06);
      const w = sp / 58;
      set(n.wind.fl.frequency, 350 + w * 1500, 0.2); set(n.wind.g.gain, Math.min(0.5, w * w * 0.62), 0.2);
      set(n.road.g.gain, Math.min(0.5, w * 0.55), 0.2);
      set(n.skid.fl.frequency, 1500 + skid * 500, 0.1); set(n.skid.g.gain, skid * 0.16, 0.06);
    };
  }

  /* ================= roadside marker posts: the car can mow them down ================= */
  function Posts() {
    const items = G.postData.concat(G.fenceData || []), hash = new Map(), dm = new THREE.Object3D(), active = [];
    dm.rotation.order = 'YXZ';
    const up = new THREE.Vector3(0, 1, 0), ax = new THREE.Vector3(), tq = new THREE.Vector3(), dq = new THREE.Quaternion(), eu = new THREE.Euler(0, 0, 0, 'YXZ'), sf = {};
    items.forEach((p, i) => {
      const k = Math.floor(p.x / 8) + ',' + Math.floor(p.z / 8); let l = hash.get(k); if (!l) { l = []; hash.set(k, l); } l.push(i);
      // marker post: origin at its foot, 1 m tall. Fence piece: unit box scaled to size, origin at its centre, long axis Y (post) or Z (board)
      if (p.sx === undefined) { p.sx = p.sy = p.sz = 1; p.pitch = 0; p.off = 0.5; p.hl = 0.5; p.axis = 1; p.r = 0; p.fence = false; } else { p.off = 0; p.fence = true; }
      p.state = 0; p.c = new THREE.Vector3(); p.v = new THREE.Vector3(); p.q = new THREE.Quaternion(); p.w = new THREE.Vector3(); p.t = 0;
    });
    const write = p => {
      if (p.state === 0) { dm.position.set(p.x, p.y, p.z); dm.rotation.set(p.pitch, p.yaw, 0); }
      else { dm.quaternion.copy(p.q); dm.position.set(0, -p.off, 0).applyQuaternion(p.q).add(p.c); }
      dm.scale.set(p.sx, p.sy, p.sz); dm.updateMatrix(); p.mesh.setMatrixAt(p.idx, dm.matrix); p.mesh.instanceMatrix.needsUpdate = true;
    };
    let scan = 0;
    this.count = () => active.length;
    this.reset = function () { for (const p of active) { p.state = 0; write(p); } active.length = 0; };
    /* a vehicle at (bx, by, bz) ploughs through whatever stands inside its outline */
    function strike(bx, by, bz, yaw, vx, vz, player) {
      const sp = Math.hypot(vx, vz); if (sp < 1.2) return;
      const fx = Math.sin(yaw), fz = Math.cos(yaw), lx = fz, lz = -fx, cx = Math.floor(bx / 8), cz = Math.floor(bz / 8); let n = 0, wood = 0;
      for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) {
        const l = hash.get((cx + a) + ',' + (cz + b)); if (!l) continue;
        for (const i of l) {
          const p = items[i]; if (p.state) continue;
          const dx = p.x - bx, dz = p.z - bz, lf = dx * fx + dz * fz, ll = dx * lx + dz * lz;
          if (Math.abs(lf) > 2.3 + p.r || Math.abs(ll) > 1.0 + p.r || Math.abs(p.y - by) > 1.8) continue;
          // struck low by the bumper: thrown forward and up, spinning top-backwards, a little sideways off the car
          const sd = ll >= 0 ? 1 : -1, r1 = Math.random(), r2 = Math.random();
          p.state = 1; p.t = 0; p.c.set(p.x, p.y + p.off, p.z); p.q.setFromEuler(eu.set(p.pitch, p.yaw, 0));
          p.v.set(vx * 0.72 + lx * sd * (0.6 + r1 * 2.4), 2.2 + sp * 0.07 + r2 * 1.6, vz * 0.72 + lz * sd * (0.6 + r1 * 2.4));
          p.w.set(lx, 0, lz).multiplyScalar(-(4 + sp * 0.22) * (0.7 + r2 * 0.6)); p.w.y = (r1 - 0.5) * 8; p.w.addScaledVector(tq.set(fx, 0, fz), sd * (1 + r2 * 4));
          active.push(p); n++; if (p.fence) wood++;
        }
      }
      if (!n) return;
      if (player) { const k = Math.pow(0.988, n); P.vx *= k; P.vz *= k; cam.kick = Math.max(cam.kick, wood ? 0.6 : 0.45); G.sound.hit(sp); if (wood) G.sound.crack(sp); }
      else if (wood) G.sound.crack(sp / (1 + ((bx - P.x) * (bx - P.x) + (bz - P.z) * (bz - P.z)) / 900));
    }
    this.update = function (dt) {
      if (dt > 0) {
        strike(P.x, P.y, P.z, P.yaw, P.vx, P.vz, true);
        for (const t of G.traffic) if (t.on && t.mode !== 'lane' && Math.abs(t.x - P.x) < 220 && Math.abs(t.z - P.z) < 220) strike(t.x, t.y, t.z, t.yaw, t.vx, t.vz, false); // cruisers and wrecks too
      }
      for (const p of active) {
        if (p.state !== 1) continue;
        p.t += dt;
        p.v.y -= 15 * dt; p.c.addScaledVector(p.v, dt);
        const wl = p.w.length(); if (wl > 1e-4) { dq.setFromAxisAngle(tq.copy(p.w).multiplyScalar(1 / wl), wl * dt); p.q.premultiply(dq).normalize(); }
        if (p.axis === 2) ax.set(0, 0, 1); else ax.set(0, 1, 0);
        ax.applyQuaternion(p.q);
        const ext = p.hl * Math.abs(ax.y) + 0.06, gy = G.surface(p.c.x, p.c.z, P.hint, sf).y;
        if (p.c.y - ext < gy) {
          p.c.y = gy + ext;
          if (p.v.y < 0) p.v.y *= -0.3;
          const fr = Math.exp(-5 * dt); p.v.x *= fr; p.v.z *= fr; p.w.multiplyScalar(Math.exp(-4.5 * dt));
          tq.crossVectors(up, ax).multiplyScalar(ax.y >= 0 ? 1 : -1);
          if (tq.lengthSq() > 1e-5) p.w.addScaledVector(tq.normalize(), 14 * dt * Math.abs(ax.y));       // gravity lays it flat
          if (Math.abs(ax.y) < 0.07 && p.v.lengthSq() < 0.4 && wl < 1.5) p.state = 2;
        }
        if (p.t > 9) p.state = 2;
        write(p);
      }
      // whatever was knocked down far behind is put back up
      scan += dt;
      if (scan > 1.5) { scan = 0; for (let k = active.length - 1; k >= 0; k--) { const p = active[k]; if (p.state === 2 && Math.hypot(p.c.x - P.x, p.c.z - P.z) > 260) { p.state = 0; write(p); active.splice(k, 1); } } }
    };
  }

  G.traffic = [];
  /* ================= player car ================= */
  const P = G.player = { x: 0, y: 0, z: 0, yaw: 0, vx: 0, vz: 0, vy: 0, steer: 0, hint: 0, s: 0, d: 0, road: true, pitch: 0, roll: 0, bRoll: 0, bPitch: 0, spin: 0, slip: 0, acc: 0, latAcc: 0, slF: 0, slL: 0, inThr: 0, inBrk: 0, inHb: 0, lockT: 0, yawRate: 0, gear: 1, shiftT: 0, rpmN: 0, sz: 0, svz: 0, sp: 0, svp: 0, sr: 0, svr: 0, wb: [0, 0, 0, 0], braking: false, auto: true, air: false, speed: 0, br: 0, dm: 0, imp: 0, impX: 0, impZ: 0, yawImp: 0, up: false };
  const WB = 2.62, TRACK = 0.815, GEARS = [0, 12, 21, 30, 40, 50, 62], nzRoad = U.makeNoise(57);
  const _s = {}, _f = {}, _q = {};
  function placeOnRoad(i, speed) {
    const R = G.road; R.frame(i * R.DS, _f);
    const d = 1.85;
    P.x = _f.x + _f.rx * d; P.z = _f.z + _f.rz * d; P.y = _f.y + _f.bank * d;
    P.yaw = Math.atan2(_f.tx, _f.tz); P.vx = _f.tx * speed; P.vz = _f.tz * speed; P.vy = 0; P.steer = 0; P.hint = _f.i; P.s = i * R.DS; P.d = d;
    P.pitch = -Math.atan(_f.slope); P.roll = 0; P.yawImp = 0; P.imp = 0; P.impX = P.impZ = 0; P.gY = undefined; P.up = false; cam.init = false;
  }
  function autopilot(dt) {
    const R = G.road, vf = P.vx * Math.sin(P.yaw) + P.vz * Math.cos(P.yaw);
    const ld = 9 + vf * 0.55;
    R.frame(P.s + ld, _f);
    const tx = _f.x + _f.rx * 1.85 - P.x, tz = _f.z + _f.rz * 1.85 - P.z;
    const a = U.angDiff(Math.atan2(tx, tz), P.yaw);
    const delta = Math.atan(2 * WB * Math.sin(a) / Math.hypot(tx, tz));
    let vt = G.autoV || 22.5;
    for (const t of G.traffic) if (t.on && t.kind === 'civ' && t.dir > 0 && !t.br) { const gap = R.dS(t.s, P.s); if (gap > 0 && gap < 34) vt = Math.min(vt, t.v - 0.5 + (gap - 14) * 0.2); }
    input.steerA = U.clamp(delta / maxSteer(vf), -1, 1);
    input.thrA = U.clamp((vt - vf) * 0.5, 0, 1); input.brkA = vf > vt + 2 ? 0.4 : 0;
  }
  const maxSteer = v => Math.min(0.62, Math.atan(WB * 20 / Math.max(1, v * v)));
  function physics(dt) {
    const R = G.road;
    let thr, brk, st, hb;
    if (P.auto) { autopilot(dt); thr = input.thrA; brk = input.brkA; st = input.steerA; hb = 0; }
    else { thr = Math.max(input.up, input.pThr); brk = Math.max(input.down, input.pBrk); st = U.clamp(input.left - input.right + input.pSt, -1, 1); hb = (input.hand || input.pHb) ? 1 : 0; }
    if (G.touchMode && !P.auto && !brk && !hb) thr = Math.max(thr, U.clamp((27 - (P.vx * Math.sin(P.yaw) + P.vz * Math.cos(P.yaw))) * 0.5, 0, 1)); // phones: the car holds 60 mph by itself; the gas button is for more
    if (G.bot && !P.auto) { const o = G.bot(); thr = o.t; brk = o.b; st = o.s; hb = 0; } // test driver
    if (G.dead) { thr = 0; brk = 0.18; st = 0; hb = 0; } // wrecked: the car just rolls to a stop
    P.inThr = thr; P.inBrk = brk; P.inHb = hb;
    const fx = Math.sin(P.yaw), fz = Math.cos(P.yaw), lx = Math.cos(P.yaw), lz = -Math.sin(P.yaw);
    let vf = P.vx * fx + P.vz * fz, vl = P.vx * lx + P.vz * lz;
    const sp = Math.abs(vf);
    // steering
    const target = st * maxSteer(sp);
    // quick turn-in, even quicker return to centre
    const back = Math.abs(target) < Math.abs(P.steer) || target * P.steer < 0;
    P.steer += (target - P.steer) * Math.min(1, dt * (target * P.steer < 0 ? 45 : back ? 34 : 26));
    let yawRate = vf / WB * Math.tan(P.steer);
    P.yawRate += (yawRate - P.yawRate) * Math.min(1, dt * 20); yawRate = P.yawRate;
    let grip = P.road ? 20.5 : 9.5 * (1 - 0.6 * Math.min(1, Math.abs(P.slL)));
    if (P.air) grip = 0.5;
    // power slide: full throttle + full lock breaks the rear loose; handbrake does it at once
    P.lockT = (!P.auto && thr > 0.8 && Math.abs(st) > 0.75 && sp > 7 && sp < 36) ? Math.min(1.2, P.lockT + dt) : Math.max(0, P.lockT - dt * 3);
    grip *= 1 - 0.24 * U.smooth(0.45, 1.0, P.lockT);
    if (hb) { grip *= 0.3; yawRate *= 1.9; }
    const sl = Math.abs(vl);
    // the nose swings back towards the direction of travel (stronger the further it steps out): slides hold an angle instead of spinning
    const beta = Math.atan2(vl, sp + 2);
    if (sl > 0.6 && sp > 2) yawRate += beta * ((thr > 0.5 ? 1.0 : 1.6) + 2.2 * Math.abs(beta));
    if (sl > 1 && !P.auto) yawRate += st * (hb ? 0.5 : 0.24) * U.smooth(1, 4, sl); // steering keeps some authority while sliding
    P.yaw += (yawRate + P.yawImp) * dt; P.yawImp *= Math.exp(-dt * 2.6); // yawImp: spin picked up in collisions
    // gearbox: brief torque cut on each shift
    { let g = P.gear; while (g < 5 && sp > GEARS[g + 1] * 0.94) g++; while (g > 0 && sp < GEARS[g] * 0.8) g--;
      if (g !== P.gear) { if (g > P.gear && thr > 0.3) P.shiftT = 0.17; P.gear = g; }
      P.shiftT = Math.max(0, P.shiftT - dt);
      const lo = P.gear === 0 ? -6 : GEARS[P.gear] * 0.55; P.rpmN = U.clamp((sp - lo) / (GEARS[P.gear + 1] - lo), 0, 1.05); }
    // longitudinal
    let acc = 0; P.braking = false;
    if (!P.air) {
      if (thr > 0) {
        if (vf > -0.5) acc += thr * Math.min(10.2, 14 * (1 - Math.pow(Math.max(0, vf) / VMAX, 1.5)) + 0.5) * (P.road ? 1 : 0.6) * (P.shiftT > 0 ? 0.12 : 1);
        else { acc += 24 * thr; P.braking = true; }
      }
      if (brk > 0) {
        if (vf > 0.6) { acc -= 27 * brk * (P.road ? 1 : 0.6); P.braking = true; }
        else if (vf > -15) acc -= 9 * brk;
      }
      if (hb && sp > 0.3) { acc -= Math.sign(vf) * 6.5; P.braking = true; }
      const res = vf * Math.abs(vf) * 0.00115 + Math.sign(vf) * (P.road ? 0.22 : 2.6) + (thr > 0 ? 0 : vf * 0.045 + Math.sign(vf) * 0.35);
      if (Math.abs(vf) < 0.25 && thr === 0 && brk === 0) vf *= 1 - Math.min(1, dt * 6); else acc -= res;
    }
    vf += acc * dt;
    P.acc = acc;
    // gravity along the slope under the wheels: steep banks cannot be climbed and the car slides back down
    if (!P.air) {
      let gF = -9.8 * P.slF / Math.sqrt(1 + P.slF * P.slF);
      const gL = -9.8 * P.slL / Math.sqrt(1 + P.slL * P.slL);
      if (thr === 0 && brk === 0 && !hb && Math.abs(vf) < 0.5 && Math.abs(gF) < 1.4) gF = 0;
      if (hb && Math.abs(vf) < 0.5 && Math.abs(gF) < 5) gF = 0;
      vf += gF * dt; vl += gL * dt;
    }
    P.slip = Math.abs(vl);
    vl += U.clamp(-vl * 17, -grip, grip) * dt;
    P.vx = fx * vf + lx * vl; P.vz = fz * vf + lz * vl;
    P.latAcc = vf * yawRate;
    // integrate
    const ox = P.x, oz = P.z;
    P.x += P.vx * dt; P.z += P.vz * dt;
    const spd = Math.hypot(P.vx, P.vz), ivx = P.vx, ivz = P.vz;
    // steep terrain acts as a wall
    if (spd > 0.4) {
      const dx = P.vx / spd, dz = P.vz / spd, e = 1.7;
      const h0 = G.surface(P.x, P.z, P.hint, _s).y;
      const hF = G.surface(P.x + dx * e, P.z + dz * e, P.hint, _s).y;
      if ((hF - h0) / e > 0.78) {
        const hL = G.surface(P.x + dz * e, P.z - dx * e, P.hint, _s).y, hR = G.surface(P.x - dz * e, P.z + dx * e, P.hint, _s).y;
        let gx = dx * (hF - h0) + dz * (hL - hR) * 0.5, gz = dz * (hF - h0) - dx * (hL - hR) * 0.5; const gl = Math.hypot(gx, gz) || 1; gx /= gl; gz /= gl;
        const vn = P.vx * gx + P.vz * gz;
        if (vn > 0) { P.vx -= gx * vn * 1.25; P.vz -= gz * vn * 1.25; P.vx *= 0.93; P.vz *= 0.93; P.x = ox - gx * 0.03; P.z = oz - gz * 0.03; }
      }
    }
    // guardrails / bridge barriers
    R.query(P.x, P.z, P.hint, _q); P.hint = _q.i;
    for (let si = 0; si < 2; si++) {
      if (!R.rail[si][_q.i]) continue;
      const side = si ? 1 : -1, off = R.railOff(_q.i), rel = side * _q.dm - off;
      if (Math.abs(rel) < 0.98) {
        R.frame(_q.s, _f);
        const prel = side * ((ox - _f.x) * _f.rx + (oz - _f.z) * _f.rz) - off;
        const tgt = prel <= 0 ? -0.98 : 0.98, push = (tgt - rel) * side;
        P.x += _f.rx * push; P.z += _f.rz * push;
        const vn = (P.vx * _f.rx + P.vz * _f.rz) * side * (prel <= 0 ? 1 : -1);
        if (vn > 0) { const k = side * (prel <= 0 ? 1 : -1); P.vx -= _f.rx * k * vn * 1.3; P.vz -= _f.rz * k * vn * 1.3; P.vx *= 0.985; P.vz *= 0.985; P.yaw += U.clamp(-k * vn * 0.012, -0.03, 0.03) * Math.sign(vf || 1); }
      }
    }
    // trees, poles, piers: three circles along the car (nose, middle, tail)
    for (const co of [1.3, 0, -1.3]) {
      const bx = P.x + fx * co, bz = P.z + fz * co, cx = Math.floor(bx / 8), cz = Math.floor(bz / 8);
      for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) {
        const l = G.colliders.get((cx + a) + ',' + (cz + b)); if (!l) continue;
        for (let k = 0; k < l.length; k += 3) {
          const dx = P.x + fx * co - l[k], dz = P.z + fz * co - l[k + 1], rr = l[k + 2] + 0.9, d2 = dx * dx + dz * dz;
          if (d2 < rr * rr && d2 > 1e-6) {
            const d = Math.sqrt(d2), nx = dx / d, nz = dz / d; P.x += nx * (rr - d); P.z += nz * (rr - d);
            const vn = P.vx * nx + P.vz * nz; if (vn < 0) { P.vx -= nx * vn * 1.3; P.vz -= nz * vn * 1.3; P.vx *= 0.8; P.vz *= 0.8; P.yawImp = U.clamp(P.yawImp + (nx * fz - nz * fx) * co * vn * 0.05, -2.5, 2.5); }
          }
        }
      }
    }
    // the closed forest beyond the roadside trees
    if (Math.abs(P.d) > 55) {
      const c0 = G.canopy(P.x, P.z, P.hint);
      if (c0 > 0.05) { // (stop at its very edge: further in the canopy would close over the car)
        let gx = G.canopy(P.x + 2, P.z, P.hint) - G.canopy(P.x - 2, P.z, P.hint), gz = G.canopy(P.x, P.z + 2, P.hint) - G.canopy(P.x, P.z - 2, P.hint); const gl = Math.hypot(gx, gz);
        if (gl > 1e-4) { gx /= gl; gz /= gl; const vn = P.vx * gx + P.vz * gz; if (vn > 0) { P.vx -= gx * vn * 1.3; P.vz -= gz * vn * 1.3; P.vx *= 0.8; P.vz *= 0.8; } P.x = ox - gx * 0.04; P.z = oz - gz * 0.04; }
        else { P.x = ox; P.z = oz; P.vx *= -0.2; P.vz *= -0.2; }
      }
    }
    P.impX += P.vx - ivx; P.impZ += P.vz - ivz;
    P.imp += Math.hypot(P.vx - ivx, P.vz - ivz); // speed lost against walls, rails and trees this step (damage is worked out in game.js)
  }
  const wheelPos = [[TRACK, 1.36], [-TRACK, 1.36], [TRACK, -1.26], [-TRACK, -1.26]], wh = [0, 0, 0, 0], wroad = [true, true, true, true];
  function settle(dt) {
    const fx = Math.sin(P.yaw), fz = Math.cos(P.yaw), lx = Math.cos(P.yaw), lz = -Math.sin(P.yaw);
    let nroad = 0;
    for (let k = 0; k < 4; k++) {
      const wx = P.x + lx * wheelPos[k][0] + fx * wheelPos[k][1], wz = P.z + lz * wheelPos[k][0] + fz * wheelPos[k][1];
      G.surface(wx, wz, P.hint, _s); wh[k] = _s.y; wroad[k] = _s.road; if (_s.road) nroad++;
    }
    G.surface(P.x, P.z, P.hint, _s); P.s = _s.s; P.d = _s.d; P.hint = _s.i; P.br = _s.br; P.dm = _s.dm;
    P.road = nroad >= 2;
    const ground = (wh[0] + wh[1] + wh[2] + wh[3]) / 4;
    {
      const gv = P.gY === undefined ? 0 : (ground - P.gY) / Math.max(dt, 1e-3); P.gY = ground;   // vertical speed of the road under the car
      const vyF = P.vy - 22 * dt, yF = P.y + vyF * dt;                                            // where free fall would put it
      if (yF <= ground + 0.012) {
        if (P.up) P.svz += Math.max(-4, Math.min(0, vyF - gv)) * 0.45;                            // touchdown: the springs take the closing speed, not the slope of the hill
        P.y = ground; P.vy = U.clamp(gv, -30, 12); P.air = false; P.up = false;
      } else { P.y = yF; P.vy = vyF; if (P.y > ground + 0.06) P.up = true; P.air = P.y > ground + 0.25; }
    }
    P.slF = U.clamp(((wh[0] + wh[1]) / 2 - (wh[2] + wh[3]) / 2) / WB, -3, 3);
    P.slL = U.clamp(((wh[0] + wh[2]) / 2 - (wh[1] + wh[3]) / 2) / (TRACK * 2), -3, 3);
    const tp = U.clamp(Math.atan(-P.slF), -0.75, 0.75), tr = U.clamp(Math.atan(P.slL), -0.75, 0.75);
    const k = Math.min(1, dt * (P.air ? 2 : 11));
    P.pitch += (tp - P.pitch) * k; P.roll += (tr - P.roll) * k;
    // road surface under each wheel (small undulations on asphalt, rough off it)
    const spd = Math.hypot(P.vx, P.vz), rollOn = U.smooth(0.5, 4, spd);
    for (let k2 = 0; k2 < 4; k2++) {
      const wx = P.x + lx * wheelPos[k2][0] + fx * wheelPos[k2][1], wz = P.z + lz * wheelPos[k2][0] + fz * wheelPos[k2][1], a = wroad[k2] ? 1 : 3.4;
      P.wb[k2] = (nzRoad.n2(wx * 0.1, wz * 0.1) * 0.034 + nzRoad.n2(wx * 0.24 + 9, wz * 0.24) * 0.007) * a * rollOn;
    }
    const hT = (P.wb[0] + P.wb[1] + P.wb[2] + P.wb[3]) / 4;
    const pT = U.clamp(-P.acc * 0.0043, -0.06, 0.075) + (P.wb[2] + P.wb[3] - P.wb[0] - P.wb[1]) / 2 / WB;
    const rT = U.clamp(P.latAcc * 0.0046, -0.085, 0.085) + (P.wb[0] + P.wb[2] - P.wb[1] - P.wb[3]) / 2 / (TRACK * 2);
    const ns = Math.max(1, Math.ceil(dt / 0.006)), h = dt / ns;
    for (let i = 0; i < ns; i++) {
      P.svz += ((hT - P.sz) * 132 - P.svz * 8.6) * h; P.sz += P.svz * h;
      P.svp += ((pT - P.sp) * 100 - P.svp * 8.2) * h; P.sp += P.svp * h;
      P.svr += ((rT - P.sr) * 150 - P.svr * 10.5) * h; P.sr += P.svr * h;
    }
    P.sz = U.clamp(P.sz, -0.09, 0.09);
  }
  G.goB = function (k, speed) { P.gY = undefined; const R = G.road, f = R.frameB(R.wrapI(R.start + k) * R.DS, {}); P.x = f.x + f.rx * 1.85; P.z = f.z + f.rz * 1.85; P.y = f.y; P.yaw = Math.atan2(f.tx, f.tz); P.vx = f.tx * (speed || 0); P.vz = f.tz * (speed || 0); P.vy = 0; P.hint = f.i; P.auto = false; cam.init = false; };
  G.cameraPos = () => camera.position; // (tests)
  G.inputState = () => input;
  G.go = function (k, speed, auto) { placeOnRoad(G.road.wrapI(G.road.start + k), speed || 0); P.auto = !!auto; };
  /* leave the title screen: quick dip to black, everything back to the start line, opening shot */
  G.startGame = function () {
    if (!G.attract || G.starting) return; G.starting = true;
    const fd = document.getElementById('fade'); fd.textContent = ''; fd.style.transition = 'opacity 0.28s ease'; fd.classList.remove('gone');
    setTimeout(() => {
      G.attract = false; G.starting = false; G.camOrbit = 0; document.body.classList.remove('attract');
      G.game.restart(); G.game.intro(); cam.init = false;
      fd.style.transition = 'opacity 0.6s ease'; fd.classList.add('gone');
    }, 320);
  };
  function resetCar() {
    const R = G.road; R.query(P.x, P.z, -1, _q);
    placeOnRoad(_q.i, 0); P.auto = false;
  }

  /* ================= traffic ================= */
  /* ================= camera ================= */
  const cam = { yaw: 0, init: false, x: 0, y: 0, z: 0, fov: 56, shT: 0, pull: 0, tilt: 0, kick: 0, spd: 0 };
  const nzCam = U.makeNoise(31);
  function updateCamera(dt) {
    const sp = Math.hypot(P.vx, P.vz);
    if (!cam.init) { cam.yaw = P.yaw + (G.camOrbit || 0); }
    // steady follow camera on a fixed boom: it trails the direction of travel with a soft lag, so the car
    // stays in the middle of the frame and turns inside it; no zooming, rolling or speed tricks
    const vfc = P.vx * Math.sin(P.yaw) + P.vz * Math.cos(P.yaw);
    let aim = P.yaw;
    if (vfc > 4) aim = P.yaw + U.clamp(U.angDiff(Math.atan2(P.vx, P.vz), P.yaw), -0.6, 0.6) * 0.5;
    aim += G.camOrbit || 0; // title screen and wreck: the camera goes round the car
    cam.yaw += U.angDiff(aim, cam.yaw) * (1 - Math.exp(-dt * 3.0));
    cam.pull += (U.clamp(P.acc * 0.016, -0.2, 0.25) - cam.pull) * Math.min(1, dt * 2.2);
    cam.kick = Math.max(0, cam.kick - dt * 2.2);
    cam.spd += (sp - cam.spd) * Math.min(1, dt * 2.5);
    let dist = 5.4 + cam.spd * 0.034 + cam.pull, hgt = 2.0, lookF = 9.5, lookY = 0.76, fov = 50 + 6 * U.smooth(8, 55, sp), ie = 1;
    if (G.intro) {
      // opening shot: low in front of the car on the inside of the bend, looking back past it at whoever is behind, then a swing round to the driving position
      const KA = 0.3, k0 = G.intro.k;
      if (k0 < KA && G.intro.px !== undefined) {
        // shot one: a camera at the roadside; the car and the cruisers come at it flat out and blast past
        const t = G.uRealTime.value * 11, j = 0.03 + 0.05 * U.smooth(0.6, 1, k0 / KA);
        camera.position.set(G.intro.px + nzCam.n2(t, 3.1) * j, G.intro.py + nzCam.n2(t, 8.2) * j, G.intro.pz + nzCam.n2(t, 5.7) * j);
        camera.up.set(0, 1, 0); camera.lookAt(P.x + Math.sin(P.yaw) * 1.2, P.y + 0.72, P.z + Math.cos(P.yaw) * 1.2);
        cam.fov = 33; if (Math.abs(camera.fov - 33) > 0.01) { camera.fov = 33; camera.updateProjectionMatrix(); }
        cam.init = false; cam.yaw = P.yaw; cam.spd = sp; return;
      }
      const u = (k0 - KA) / (1 - KA); let e = U.clamp((u - 0.32) / 0.68, 0, 1); e = e * e * e * (e * (e * 6 - 15) + 10); ie = e;
      cam.yaw = P.yaw - (2.82 - 0.42 * Math.min(1, u / 0.32)) * (1 - e);
      dist = U.lerp(8.6, dist, e); hgt = U.lerp(1.25, hgt, e); lookF = U.lerp(5.5, lookF, e); lookY = U.lerp(1.05, lookY, e); fov = U.lerp(40, fov, e);
    }
    const rear = G.lookBack && !G.intro && !G.attract && !G.dead; // rear view: the same boom swung round to the front of the car
    if (rear) { dist += 0.6; lookF = 8; }
    const vyaw = cam.yaw + (rear ? Math.PI : 0), cfx = Math.sin(vyaw), cfz = Math.cos(vyaw);
    const tx = P.x - cfx * dist, tz = P.z - cfz * dist, ty = P.y + hgt;
    if (!cam.init) { cam.x = tx; cam.y = ty; cam.z = tz; cam.init = true; }
    const ky = 1 - Math.exp(-dt * 7);
    cam.x = tx; cam.z = tz; cam.y += (ty - cam.y) * (ie < 1 ? 1 : ky);
    const gy = G.surface(cam.x, cam.z, P.hint, _s).y + 0.75; if (cam.y < gy) cam.y = gy;
    { const pf = U.clamp(1.25 / camera.aspect, 1, 1.9); if (pf > 1) fov = 2 * Math.atan(Math.tan(fov * Math.PI / 360) * pf) * 180 / Math.PI; }
    cam.fov += (fov - cam.fov) * (ie < 1 ? 1 : Math.min(1, dt * 2));
    if (Math.abs(camera.fov - cam.fov) > 0.01) { camera.fov = cam.fov; camera.updateProjectionMatrix(); }
    const sh = U.smooth(38, VMAX, sp) * 0.01 + (P.road ? 0 : U.smooth(3, 20, sp) * 0.02) + cam.kick * 0.012 + (G.intro ? 0.014 : 0);
    cam.shT += dt * (9 + sp * 0.2);
    const sx = nzCam.n2(cam.shT, 1.3) * sh, sy = nzCam.n2(cam.shT, 7.7) * sh + P.sz * 0.3;
    camera.position.set(cam.x + sx, cam.y + sy, cam.z);
    camera.up.set(0, 1, 0);
    { let ax = P.x + cfx * lookF, az = P.z + cfz * lookF;
      if (ie < 1) { const c0 = G.game.cops[0]; if (c0.on) { const w = 0.3 * (1 - ie); ax += (c0.x - ax) * w; az += (c0.z - az) * w; } } // opening shot: keep the cruisers in frame
      camera.lookAt(ax, P.y + lookY + P.sz * 0.25, az); }
    if (G.camRel) { const o = G.camRel, f = Math.sin(P.yaw), c = Math.cos(P.yaw); camera.position.set(P.x - f * o[0] - c * o[1], P.y + o[2], P.z - c * o[0] + f * o[1]); camera.lookAt(P.x - c * o[3], P.y + o[4], P.z + f * o[3]); camera.fov = o[5]; camera.updateProjectionMatrix(); }
    if (G.camOverride) { const o = G.camOverride; camera.position.set(o[0], o[1], o[2]); camera.lookAt(o[3], o[4], o[5]); if (o[6]) { camera.fov = o[6]; camera.updateProjectionMatrix(); } }
  }

  /* ================= HUD ================= */
  function Hud() {
    const mm = document.getElementById('minimap'), sc = document.getElementById('speedo'), cp = document.getElementById('compass');
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const size = (c) => { c.width = Math.round(c.clientWidth * dpr); c.height = Math.round(c.clientHeight * dpr); };
    size(mm); size(sc); size(cp);
    const mx = mm.getContext('2d'), sx = sc.getContext('2d'), cx2 = cp.getContext('2d');
    const R = G.road, path = new Path2D(), river = new Path2D(), cross = new Path2D();
    for (let i = 0; i <= R.N; i += 3) { const k = i % R.N; if (i === 0) path.moveTo(R.px[k], R.pz[k]); else path.lineTo(R.px[k], R.pz[k]); }
    path.closePath();
    for (const F of R.forks) for (let k = 0; k <= F.n; k += 3) { const i = R.wrapI(F.i0 + k); if (k === 0) path.moveTo(R.bx[i], R.bz[i]); else path.lineTo(R.bx[i], R.bz[i]); }
    const rv = R.river;
    for (let al = -400; al <= 400; al += 20) { const ac = R.riverAcross(al), x = rv.x + rv.nx * al + rv.tx * ac, z = rv.z + rv.nz * al + rv.tz * ac; if (al === -400) river.moveTo(x, z); else river.lineTo(x, z); }
    { const i = R.overI, fx = -R.tz[i], fz = R.tx[i]; cross.moveTo(R.px[i] - fx * 140, R.pz[i] - fz * 140); cross.lineTo(R.px[i] + fx * 140, R.pz[i] + fz * 140); }
    const LAB = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'], FNT = '"Bahnschrift","Segoe UI","Helvetica Neue",Arial,sans-serif';
    let lastMph = -1;
    this.draw = function () {
      // map-style minimap: land, river, roads; it turns with the camera and carries a north marker
      const w = mm.width, h = mm.height, k = 0.34 * dpr, c = Math.cos(cam.yaw), s = Math.sin(cam.yaw), cx = w / 2, cy = h * 0.68;
      mx.setTransform(1, 0, 0, 1, 0, 0); mx.clearRect(0, 0, w, h);
      mx.fillStyle = 'rgba(92,116,97,0.9)'; mx.fillRect(0, 0, w, h);
      const a = -c * k, cc = s * k, b = -s * k, d = -c * k;
      mx.setTransform(a, b, cc, d, cx - (a * P.x + cc * P.z), cy - (b * P.x + d * P.z));
      mx.lineJoin = 'round'; mx.lineCap = 'round';
      mx.strokeStyle = 'rgba(122,168,198,0.95)'; mx.lineWidth = 30; mx.stroke(river);
      mx.strokeStyle = 'rgba(60,80,66,0.5)'; mx.lineWidth = 15; mx.stroke(cross); mx.lineWidth = 22; mx.stroke(path);
      mx.strokeStyle = 'rgba(226,229,220,0.95)'; mx.lineWidth = 10; mx.stroke(cross);
      mx.strokeStyle = 'rgba(240,241,234,1)'; mx.lineWidth = 16; mx.stroke(path);
      { const bl = (performance.now() * 0.004) % 1 < 0.5;
        for (const cp2 of G.game.cops) if (cp2.on && cp2.mode !== 'wreck') { mx.beginPath(); mx.arc(cp2.x, cp2.z, 13, 0, 6.2832); mx.fillStyle = bl ? '#ff4a36' : '#3d7bff'; mx.fill(); mx.lineWidth = 3; mx.strokeStyle = 'rgba(255,255,255,0.9)'; mx.stroke(); } }
      mx.setTransform(dpr, 0, 0, dpr, cx, cy);
      mx.beginPath(); mx.arc(0, 0, 10, 0, 6.2832); mx.fillStyle = 'rgba(22,28,26,0.92)'; mx.fill(); mx.strokeStyle = 'rgba(255,255,255,0.95)'; mx.lineWidth = 1.5; mx.stroke();
      mx.rotate(-U.angDiff(P.yaw, cam.yaw));
      mx.beginPath(); mx.moveTo(0, -6); mx.lineTo(4.6, 4.8); mx.lineTo(0, 2.2); mx.lineTo(-4.6, 4.8); mx.closePath(); mx.fillStyle = '#fff'; mx.fill();
      {
        mx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const W = w / dpr, H = h / dpr, nx = s, ny = -c, t = Math.min((W / 2 - 13) / Math.max(1e-3, Math.abs(nx)), (H / 2 - 13) / Math.max(1e-3, Math.abs(ny)));
        const bx = W / 2 + nx * t, by = H / 2 + ny * t;
        mx.beginPath(); mx.arc(bx, by, 8.5, 0, 6.2832); mx.fillStyle = 'rgba(22,28,26,0.92)'; mx.fill();
        mx.fillStyle = '#fff'; mx.font = '700 10px ' + FNT; mx.textAlign = 'center'; mx.textBaseline = 'middle'; mx.fillText('N', bx, by + 0.5);
      }
      // compass strip
      {
        const W = cp.width / dpr, mid = W / 2, ppd = W / 150, brg = ((-cam.yaw * 180 / Math.PI) % 360 + 360) % 360;
        cx2.setTransform(dpr, 0, 0, dpr, 0, 0); cx2.clearRect(0, 0, W, 40);
        cx2.shadowColor = 'rgba(0,0,0,0.65)'; cx2.shadowBlur = 4;
        const g = cx2.createLinearGradient(0, 0, W, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.25, 'rgba(255,255,255,0.55)'); g.addColorStop(0.75, 'rgba(255,255,255,0.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
        cx2.fillStyle = g; cx2.fillRect(0, 12, W, 1.5);
        cx2.textAlign = 'center'; cx2.textBaseline = 'alphabetic';
        for (let dg = 0; dg < 360; dg += 15) {
          const df = ((dg - brg + 540) % 360) - 180, x = mid + df * ppd; if (x < 10 || x > W - 10) continue;
          const al = 1 - Math.pow(Math.abs(x - mid) / mid, 2), major = dg % 45 === 0;
          cx2.fillStyle = `rgba(255,255,255,${(al * (major ? 0.95 : 0.5)).toFixed(3)})`;
          cx2.fillRect(x - 0.75, 12, 1.5, major ? 7 : 4);
          if (major) { cx2.font = (dg % 90 === 0 ? '700 13px ' : '600 10px ') + FNT; cx2.fillText(LAB[dg / 45], x, 34); }
        }
        cx2.fillStyle = '#fff'; cx2.beginPath(); cx2.moveTo(mid - 5, 1); cx2.lineTo(mid + 5, 1); cx2.lineTo(mid, 9); cx2.closePath(); cx2.fill();
        cx2.shadowBlur = 0; cx2.shadowColor = 'transparent';
      }
      // speed readout
      const mph = Math.round(Math.hypot(P.vx, P.vz) * 2.23694);
      if (mph !== lastMph) {
        lastMph = mph;
        sx.setTransform(dpr, 0, 0, dpr, 0, 0); sx.clearRect(0, 0, 130, 56);
        sx.shadowColor = 'rgba(0,0,0,0.65)'; sx.shadowBlur = 6; sx.shadowOffsetY = 1; sx.textBaseline = 'alphabetic';
        sx.fillStyle = '#fff'; sx.textAlign = 'right'; sx.font = '700 40px ' + FNT; sx.fillText(String(mph), 88, 46);
        sx.textAlign = 'left'; sx.font = '600 12px ' + FNT; sx.fillStyle = 'rgba(255,255,255,0.8)'; sx.fillText('MPH', 94, 46);
        sx.shadowBlur = 0; sx.shadowOffsetY = 0; sx.shadowColor = 'transparent';
      }
    };
  }

  /* ================= input ================= */
  let heldUp = {}, lookWas = false, lookT = 0;
  function setupInput() {
    const map = { KeyW: 'up', ArrowUp: 'up', KeyS: 'down', ArrowDown: 'down', KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right', Space: 'hand' };
    window.addEventListener('keydown', e => {
      if (G.won) { if (e.code === 'KeyR' || e.code === 'Enter' || e.code === 'NumpadEnter') G.game.restart(); else if (e.code === 'Escape' || e.code === 'Space') G.game.keepDriving(); e.preventDefault(); return; }
      if (e.code === 'Escape') { if (!e.repeat && G.menu) G.menu.toggle(); e.preventDefault(); return; }
      if (G.menu && G.menu.open) { G.menu.key(e); if (!e.ctrlKey && !e.metaKey && !/^F\d+$/.test(e.code)) e.preventDefault(); return; }
      G.sound.start();
      if (G.attract) { G.startGame(); e.preventDefault(); return; }
      if (e.code === 'KeyM') { G.sound.toggle(); return; }
      if (e.code === 'KeyE') { if (!e.repeat) { lookWas = !!G.lookBack; G.lookBack = true; lookT = performance.now(); } return; } // tap: switch, hold: look back while held
      if (e.code === 'KeyQ') { if (!e.repeat) G.people.next(); return; }
      if (/^Digit[1-6]$/.test(e.code)) { G.people.play(+e.code.slice(5) - 1); return; }
      if (G.dead) { if (e.code === 'KeyR' || e.code === 'Enter' || e.code === 'NumpadEnter') G.game.restart(); e.preventDefault(); return; }
      if (e.code === 'KeyR') { resetCar(); e.preventDefault(); return; }
      const k = map[e.code]; if (!k) return;
      input[k] = 1; input.touch = false; if (G.intro) G.game.skipIntro(); else P.auto = false; e.preventDefault();
    });
    window.addEventListener('keyup', e => { if (e.code === 'KeyE') { if (lookWas || performance.now() - lookT > 280) G.lookBack = false; return; } const k = map[e.code]; if (k) { if (G.slowmo) heldUp[k] = 1; else input[k] = 0; e.preventDefault(); } });
    window.addEventListener('pointerdown', e => { if (e.target && e.target.id === 'home') return; if (G.attract && !(G.menu && G.menu.open)) { G.sound.start(); G.startGame(); } });
    window.addEventListener('blur', () => { G.lookBack = false; input.up = input.down = input.left = input.right = input.hand = 0; });
    const touch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
    if (touch && window.matchMedia('(pointer: coarse)').matches) {
      document.body.classList.add('touch'); G.touchMode = true;
      const btns = Array.from(document.querySelectorAll('.tc')), HOLD = { left: 1, right: 1, up: 1, down: 1, hand: 1, look: 1 }, held = {};
      const btnAt = t => { const el = document.elementFromPoint(t.clientX, t.clientY); return el && el.closest ? el.closest('.tc') : null; };
      const scan = e => { // which hold-buttons have a finger on them right now
        const now = {}; for (const t of e.touches) { const bt = btnAt(t); if (bt) now[bt.dataset.k] = 1; }
        const playing = !(G.menu.open || G.attract || G.won || G.dead);
        for (const bt of btns) {
          const k = bt.dataset.k; if (!HOLD[k]) continue;
          const on = !!now[k] && playing; bt.classList.toggle('on', on);
          if (k === 'look') { G.lookBack = on; continue; }
          if (on && !held[k]) { input[k] = 1; if (G.intro) G.game.skipIntro(); else P.auto = false; }
          if (!on && held[k]) { if (G.slowmo) heldUp[k] = 1; else input[k] = 0; }
          held[k] = on;
        }
      };
      document.addEventListener('touchstart', e => {
        const bt = e.target.closest ? e.target.closest('.tc') : null;
        if (bt) {
          e.preventDefault(); const k = bt.dataset.k;
          if (k === 'menu') { if (!G.attract && !G.won) G.menu.toggle(); }
          else if (!(G.menu.open || G.attract || G.won)) { G.sound.start(); if (k === 'anim') G.people.next(); else if (k === 'reset') { if (G.dead) G.game.restart(); else resetCar(); } }
        }
        scan(e);
      }, { passive: false });
      document.addEventListener('touchmove', scan, { passive: true });
      for (const ev of ['touchend', 'touchcancel']) document.addEventListener(ev, e => { scan(e); G.sound.start(); }, { passive: true }); // (some browsers only let sound start on the finger coming up)
    }
  }

  function pollPad() {
    input.pSt = input.pThr = input.pBrk = 0; input.pHb = 0;
    if (!navigator.getGamepads) return;
    const pads = navigator.getGamepads();
    for (let i = 0; i < pads.length; i++) {
      const p = pads[i]; if (!p || !p.connected || p.axes.length < 2) continue;
      const bt = n => (p.buttons[n] ? p.buttons[n].value : 0);
      let x = p.axes[0]; x = Math.abs(x) < 0.1 ? 0 : (x - Math.sign(x) * 0.1) / 0.9;
      x += bt(15) - bt(14);
      input.pSt = U.clamp(-Math.sign(x) * Math.pow(Math.abs(x), 1.5), -1, 1);
      input.pThr = Math.max(bt(7), bt(0) > 0.5 && p.buttons.length < 8 ? 1 : 0); input.pBrk = bt(6); input.pHb = bt(0) > 0.5 || bt(1) > 0.5 || bt(5) > 0.5 ? 1 : 0;
      const y = bt(3) > 0.5; if (y && !input.pY) resetCar(); input.pY = y;
      if (Math.abs(input.pSt) > 0.2 || input.pThr > 0.15 || input.pBrk > 0.15 || input.pHb) P.auto = false;
      break;
    }
  }

  /* ================= init ================= */
  function init() {
    const canvas = document.getElementById('view');
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', stencil: false, depth: false });
    G.renderer = renderer;
    renderer.toneMapping = THREE.NoToneMapping;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.info.autoReset = false;
    // fade shadows out at the edge of the shadow frustum instead of a hard cut
    THREE.ShaderChunk.shadowmap_pars_fragment = THREE.ShaderChunk.shadowmap_pars_fragment.replace('return shadow;',
      'vec2 sfd = abs( shadowCoord.xy - 0.5 ); return mix( 1.0, shadow, smoothstep( 0.5, 0.4, max( sfd.x, sfd.y ) ) );');

    // drifting-cloud shade over the landscape: modulates the sun in every lit material (kept clear of the start)
    {
      const R0 = G.road, cn = (x, z, ox, oz) => { const qx = x * 0.0075 + ox, qz = z * 0.0075 + oz; return Math.sin(qx + Math.sin(qz * 1.3 + 1.7) * 1.4) * Math.sin(qz * 0.9 + Math.sin(qx * 1.1 + 0.4) * 1.6) + 0.45 * Math.sin(qx * 2.3 + qz * 1.7 + 2.0) * Math.sin(qz * 2.9 - qx * 1.1); };
      const rnd = U.rng(2024); let ox = 0, oz = 0, bestF = -1;
      for (let t = 0; t < 400; t++) {
        const cx = rnd() * 40, cz = rnd() * 40; let ok = true, sh = 0;
        for (let k = -50; k <= 200 && ok; k += 5) { const i = R0.wrapI(R0.start + k); if (cn(R0.px[i], R0.pz[i], cx, cz) > 0.3) ok = false; }
        if (!ok) continue;
        for (let i = 0; i < R0.N; i += 6) if (cn(R0.px[i], R0.pz[i], cx, cz) > 0.72) sh++;
        const f = sh / (R0.N / 6); if (f > bestF && f < 0.3) { bestF = f; ox = cx; oz = cz; }
        if (bestF > 0.16) break;
      }
      THREE.ShaderChunk.lights_pars_begin = `float csShade( vec3 p ) { vec2 q = p.xz * 0.0075 + vec2( ${ox.toFixed(4)}, ${oz.toFixed(4)} );
  float n = sin( q.x + sin( q.y * 1.3 + 1.7 ) * 1.4 ) * sin( q.y * 0.9 + sin( q.x * 1.1 + 0.4 ) * 1.6 ) + 0.45 * sin( q.x * 2.3 + q.y * 1.7 + 2.0 ) * sin( q.y * 2.9 - q.x * 1.1 );
  return 1.0 - 0.52 * smoothstep( 0.5, 0.95, n ); }
` + THREE.ShaderChunk.lights_pars_begin;
      THREE.ShaderChunk.lights_fragment_begin = THREE.ShaderChunk.lights_fragment_begin.replace('getDirectionalLightInfo( directionalLight, directLight );',
        'getDirectionalLightInfo( directionalLight, directLight );\n\t\tdirectLight.color *= csShade( cameraPosition + ( vec4( geometryPosition, 0.0 ) * viewMatrix ).xyz );');
    }
    // rough GPU class: integrated / mobile chips start with lighter settings
    let gpuName = '';
    try { const gl = renderer.getContext(), e = gl.getExtension('WEBGL_debug_renderer_info'); gpuName = String(e ? gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)); } catch (e) { gpuName = ''; }
    const qp = (/[?&]q=(low|high)/.exec(location.search) || [])[1];
    const weak = G.weakGPU = qp ? qp === 'low' : !gpuName || (/Intel|Iris|UHD|HD Graphics|Mali|Adreno|PowerVR|Apple GPU|SwiftShader|llvmpipe|Basic Render|Radeon\(TM\) Graphics|Vega/i.test(gpuName) && !/Arc\b|Arc\(TM\) A/i.test(gpuName));
    G.stats.gpu = gpuName; G.stats.weak = weak; // add ?q=low or ?q=high to the address to override


    scene = new THREE.Scene(); G.scene = scene;
    scene.fog = new THREE.FogExp2(FOG, FOG_D);
    camera = new THREE.PerspectiveCamera(56, 1, 0.3, 9000); G.camera = camera;

    const T = G.T, R = G.road;
    const tm = G.timing = {}; let t0 = performance.now(); const lap = n => { const t = performance.now(); tm[n] = Math.round(t - t0); t0 = t; };
    const aniso = Math.min(16, renderer.capabilities.getMaxAnisotropy());
    const tex = G.tex = { noise: T.noise(), road: T.road(aniso), roadBump: T.roadBump(aniso), patch: T.patch(), grass: T.grass(), dirt: T.dirt(), clay: T.clay(), canopy: T.canopy(), foliage: T.foliage(), blades: T.grassBlades(), concrete: T.concrete(), wood: T.wood(), waterN: T.waterNormal() };
    tex.road.map.anisotropy = aniso; tex.road.rough.anisotropy = aniso;
    lap('textures');

    // sun: late afternoon, front-left of the starting direction
    const h0 = Math.atan2(R.tx[R.start], R.tz[R.start]), az = h0 + 0.92, el = 0.68;
    const sunDir = new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
    G.sunDir = sunDir;
    {
      const RANGE = CAR_SH.range.toFixed(1), BOX = (CAR_SH.half * 2).toFixed(1), SZ = (weak ? 512 : 1024).toFixed(1), NT = weak ? 5 : 9;
      THREE.ShaderChunk.lights_pars_begin = `#ifdef CAR_SH
uniform sampler2D uCarSh; uniform mat4 uCarShM;
float carShTap( vec2 uv, float zr ) { // depth compare with bilinear weights: smooth edge even where the penumbra is a texel wide
  vec2 t = uv * ${SZ} - 0.5, f = fract( t ), b = ( floor( t ) + 0.5 ) / ${SZ}; const float e = 1.0 / ${SZ};
  vec4 d = vec4( texture2DLodEXT( uCarSh, b, 0.0 ).r, texture2DLodEXT( uCarSh, b + vec2( e, 0.0 ), 0.0 ).r, texture2DLodEXT( uCarSh, b + vec2( 0.0, e ), 0.0 ).r, texture2DLodEXT( uCarSh, b + vec2( e, e ), 0.0 ).r );
  vec4 c = step( d * ${RANGE}, vec4( zr ) );
  return mix( mix( c.x, c.y, f.x ), mix( c.z, c.w, f.x ), f.y );
}
float carShade( vec3 p, vec3 n ) {
  if ( uCarShM[ 3 ][ 3 ] < 0.5 ) return 1.0;
  float nl = clamp( dot( n, vec3( ${sunDir.x.toFixed(5)}, ${sunDir.y.toFixed(5)}, ${sunDir.z.toFixed(5)} ) ), 0.0, 1.0 );
  vec3 q = ( uCarShM * vec4( p + n * ( 0.006 + 0.03 * ( 1.0 - nl ) ), 1.0 ) ).xyz;
  if ( q.x < 0.03 || q.x > 0.97 || q.y < 0.03 || q.y > 0.97 || q.z < 0.0 ) return 1.0;
#if CAR_SH == 2
  if ( dot( n, vec3( ${sunDir.x.toFixed(5)}, ${sunDir.y.toFixed(5)}, ${sunDir.z.toFixed(5)} ) ) < -0.02 ) return 1.0;
#endif
  float zr = q.z * ${RANGE} - 0.012;
  float a = 6.2832 * fract( 52.9829189 * fract( dot( gl_FragCoord.xy, vec2( 0.06711056, 0.00583715 ) ) ) );
  float bs = 0.0, bn = 0.0;
  for ( int i = 0; i < 6; i ++ ) {
    float fi = float( i ), r = sqrt( ( fi + 0.5 ) / 6.0 ) * ( 0.13 / ${BOX} ), t = fi * 2.39996 + a;
    float d = texture2DLodEXT( uCarSh, q.xy + vec2( cos( t ), sin( t ) ) * r, 0.0 ).r * ${RANGE};
    if ( d < zr ) { bs += d; bn += 1.0; }
  }
  if ( bn < 0.5 ) return 1.0;
  float w = clamp( ( zr - bs / bn ) * 0.07, 0.009, 0.13 ) / ${BOX};
  float sh = 0.0;
  for ( int i = 0; i < ${NT}; i ++ ) {
    float fi = float( i ), r = sqrt( ( fi + 0.5 ) / ${NT}.0 ) * w, t = fi * 2.39996 + a + 1.3;
    sh += carShTap( q.xy + vec2( cos( t ), sin( t ) ) * r, zr );
  }
  return 1.0 - sh / ${NT}.0;
}
#endif
` + THREE.ShaderChunk.lights_pars_begin;
      THREE.ShaderChunk.lights_fragment_begin = THREE.ShaderChunk.lights_fragment_begin.replace('directLight.color *= csShade(',
        '\n#ifdef CAR_SH\n\t\tdirectLight.color *= carShade( cameraPosition + ( vec4( geometryPosition, 0.0 ) * viewMatrix ).xyz, normalize( ( vec4( geometryNormal, 0.0 ) * viewMatrix ).xyz ) );\n#endif\n\t\tdirectLight.color *= csShade(');
      // every material gets the two uniforms (shared objects); only those flagged CAR_SH compile the lookup
      THREE.Material.prototype.onBuild = function (o, sh) { if (sh && sh.uniforms) { sh.uniforms.uCarSh = G.uCarSh; sh.uniforms.uCarShM = G.uCarShM; } };
    }
    sun = new THREE.DirectionalLight(new THREE.Color().setRGB(1.0, 0.93, 0.80), 6.2);
    const SMAP = G.smap = weak ? 2048 : 4096, SH = G.shHalf = weak ? 110 : 104;
    sun.castShadow = true; sun.shadow.mapSize.set(SMAP, SMAP);
    const sc = sun.shadow.camera; sc.left = -SH; sc.right = SH; sc.top = SH; sc.bottom = -SH; sc.near = 20; sc.far = 640; sc.updateProjectionMatrix();
    sun.shadow.bias = -0.0005; sun.shadow.normalBias = weak ? 0.22 : 0.13;
    scene.add(sun); scene.add(sun.target);
    hemi = new THREE.HemisphereLight(new THREE.Color().setRGB(0.50, 0.66, 1.0), new THREE.Color().setRGB(0.36, 0.31, 0.22), 1.1);
    scene.add(hemi);
    G.uSunCol.value.setRGB(1.0, 0.88, 0.70).multiplyScalar(1.6);

    const env = makeEnv(tex.noise, sunDir); G.env = env;
    sky = makeSky(tex.noise, sunDir, false); scene.add(sky);
    scene.add(makeHorizon(sunDir));

    lap('sky');
    G.buildWorld(scene, tex, env); lap('world');
    G.buildVegetation(scene, tex); lap('veg');
    G.buildProps(scene, tex, env); lap('props');

    car = G.car = G.buildCar(env, tex);
    G.people = G.buildPeople(car, env);
    car.root.rotation.order = 'YXZ'; scene.add(car.root);
    const blobTex = T.radial(0.45, 0.55);
    const blob = new THREE.Mesh(new THREE.PlaneGeometry(3.08, 5.6).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: T.carAO(0.94, 2.2, 0.8, 1.36, -1.26), color: 0x000000, transparent: true, opacity: 0.9, depthWrite: false }));
    blob.position.set(0, 0.035, 0.03); blob.renderOrder = 2; car.root.add(blob);
    G.game = new G.Game({ scene, env, blobTex, cam, camera, input, placeOnRoad });

    G.skids = new Skids(); G.smoke = new Smoke(T.smoke()); G.motes = new Motes(); G.sound = new Sound(); G.posts = new Posts();
    post = G.post = new Post(); post.fx = !weak;
    // layer 1 = what the reflection probe sees: no player car, grass, detailed trees, wires or decals
    scene.traverse(o => { const m = o.material; if (!(o.isLine || o.isPoints || (m && (m.transparent || m === G.mats.grass)))) o.layers.enable(1); });
    car.root.traverse(o => o.layers.disable(1));
    for (const ch of G.chunks) for (const m of ch.hi) m.layers.disable(1);
    G.carShadow = new CarShadow(weak);
    G.refl = new Reflect(weak); G.refl.setMode(G.refl.mode);
    hud = new Hud();
    setupInput();
    placeOnRoad(R.start, 21.5);
    resize(); window.addEventListener('resize', resize);
    G.settings.load(); G.menu = new G.Menu(G.settings);
    if (/[?&]chase=0/.test(location.search)) G.game.setPolice(0); // ?chase=0: free roam for this visit, like the menu switch
    if (/[?&](start|chase)=0/.test(location.search)) G.game.intro(); // straight in (no sound until the first key press: browsers do not let a page play audio before that)
    else { G.attract = true; G.camOrbit = 2.35; document.body.classList.add('intro', 'attract'); if (document.body.classList.contains('touch')) document.getElementById('titleKey').textContent = 'Tap to start'; }
    settle(0.016); G.game.update(0, 0); updateCamera(0.016); syncCar(0.016); updateSun();
    G.carShadow.update();
    for (const ch of G.chunks) for (const m of ch.lo) m.visible = true;
    precompile();
    for (const ch of G.chunks) for (const m of ch.lo) m.visible = false;
    // warm-up: draw the whole world once (every LOD, every prop, a shadow map covering everything) so no shader
    // is compiled and no texture uploaded later, in the middle of driving
    {
      const sc2 = sun.shadow.camera, keep = [sc2.left, sc2.right, sc2.top, sc2.bottom, sc2.far];
      sc2.left = sc2.bottom = -2600; sc2.right = sc2.top = 2600; sc2.far = 3000; sc2.updateProjectionMatrix();
      const vis = [];
      scene.traverse(o => { if (!o.visible) { vis.push(o); o.visible = true; } });
      const oc = new THREE.OrthographicCamera(-2600, 2600, 2600, -2600, 1, 5000); oc.position.set(0, 2200, 0); oc.lookAt(0, 0, 0);
      const wrt = new THREE.WebGLRenderTarget(64, 64, { type: THREE.HalfFloatType, depthBuffer: true });
      renderer.setRenderTarget(wrt); renderer.render(scene, oc); renderer.setRenderTarget(null); wrt.dispose();
      for (const o of vis) o.visible = false;
      sc2.left = keep[0]; sc2.right = keep[1]; sc2.top = keep[2]; sc2.bottom = keep[3]; sc2.far = keep[4]; sc2.updateProjectionMatrix();
    }
    if (G.refl.mode > 0) G.refl.update(true);
    booting = false;
    lap('compile');
    last = performance.now();
    requestAnimationFrame(tick);
    requestAnimationFrame(() => requestAnimationFrame(() => { document.getElementById('fade').classList.add('gone'); G.ready = true; }));
  }
  let rscale = 1, viewW = 1, viewH = 1, basePR = 1;
  function resize() {
    viewW = window.innerWidth; viewH = window.innerHeight;
    basePR = Math.min(window.devicePixelRatio || 1, 1.5);
    if (viewW * viewH * basePR * basePR > 2560 * 1440) basePR = Math.sqrt(2560 * 1440 / (viewW * viewH));
    renderer.setPixelRatio(basePR); renderer.setSize(viewW, viewH, false);
    camera.aspect = viewW / viewH; camera.updateProjectionMatrix();
    applyScale();
  }
  function applyScale() {
    const w = Math.max(320, Math.round(viewW * basePR * rscale)), h = Math.max(180, Math.round(viewH * basePR * rscale));
    post.resize(w, h); G.smoke.mat.uniforms.uScale.value = G.game.uScale.value = h / (2 * Math.tan(camera.fov * Math.PI / 360));
    G.stats.scale = rscale; G.stats.w = w; G.stats.h = h;
  }
  /* keep 60 fps: lower internal resolution when frames run long, raise it back carefully */
  const dyn = { acc: 0, n: 0, slow: 0, cool: 0, ceil: 1, hold: 0, holdLen: 12, good: 0 };
  let booting = true;
  G.blurAmt = 1; G.detailLow = false; G.manualQ = false;
  /* build every shader for the HDR target the scene is really drawn into: all programs are issued at once and the driver compiles them in parallel */
  function precompile() {
    const crt = new THREE.WebGLRenderTarget(64, 64, { type: THREE.HalfFloatType, depthBuffer: true });
    renderer.setRenderTarget(crt); renderer.compile(scene, camera); renderer.setRenderTarget(null); crt.dispose();
  }
  /* 0 off, 1 low (2048, hard edge), 2 medium (2048, soft), 3 high (4096, soft); returns true when shaders have to be rebuilt */
  function setShadows(lv) {
    const on = lv > 0, size = lv >= 3 ? 4096 : 2048, type = lv >= 2 || !on ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap; let re = false;
    if (sun.castShadow !== on) { sun.castShadow = on; re = true; }
    G.carShadow.enabled = on;
    if (on && G.smap !== size) {
      G.smap = size; sun.shadow.mapSize.set(size, size); sun.shadow.normalBias = size > 2048 ? 0.13 : 0.22;
      if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; }
    }
    if (on && renderer.shadowMap.type !== type) { renderer.shadowMap.type = type; scene.traverse(o => { if (o.material) o.material.needsUpdate = true; }); re = true; }
    return re;
  }
  function shadowLevel() { return !sun.castShadow ? 0 : renderer.shadowMap.type === THREE.PCFShadowMap ? 1 : G.smap < 4096 ? 2 : 3; }
  /* 0 off, 1 low (128 px, slow refresh), 2 medium (256 px), 3 high (512 px) */
  function setRefl(lv, quiet) { G.refl.setMode(lv === 0 ? 0 : lv === 1 ? 1 : 2); if (lv > 0) G.refl.setSize(lv === 1 ? 128 : lv === 2 ? 256 : 512, quiet); }
  function reflLevel() { return G.refl.mode === 0 ? 0 : G.refl.size <= 128 ? 1 : G.refl.size <= 256 ? 2 : 3; }
  function setQuality(low) {
    G.lowQ = low; G.detailLow = low; post.samples = low ? 0 : 4; post.fx = !low && !G.weakGPU;
    if (sun.castShadow && setShadows(low ? 1 : G.weakGPU ? 2 : 3) && !booting) precompile();
    applyScale();
  }
  /* ---- settings menu backend ---- */
  const PRESETS = {
    low: { res: 0.7, aa: 0, shadows: 1, refl: 0, fx: 0, blur: 0, veg: 0 },
    medium: { res: 0.85, aa: 2, shadows: 2, refl: 2, fx: 0, blur: 1, veg: 1 },
    high: { res: 1, aa: 4, shadows: 3, refl: 3, fx: 1, blur: 1, veg: 1 },
  };
  const QS = { preset: 'auto', fps: 0, police: 1, s: null };
  const effective = () => ({ res: rscale, aa: post.samples, shadows: shadowLevel(), refl: reflLevel(), fx: post.fx ? 1 : 0, blur: G.blurAmt ? 1 : 0, veg: G.detailLow ? 0 : 1 });
  function applyManual(s, quiet) {
    G.manualQ = true;
    rscale = s.res; post.samples = s.aa; post.fx = !!s.fx; G.blurAmt = s.blur ? 1 : 0; G.detailLow = !s.veg; G.lowQ = false;
    const re = setShadows(s.shadows);
    setRefl(s.refl, quiet);
    if (re && !quiet) precompile();
    applyScale();
  }
  function applyAuto() {
    G.manualQ = false; G.blurAmt = 1; rscale = 1;
    dyn.acc = dyn.n = dyn.slow = dyn.cool = dyn.hold = dyn.good = 0; dyn.ceil = 1; dyn.holdLen = 12;
    const re = setShadows(G.weakGPU ? 2 : 3);
    setRefl(G.weakGPU ? 1 : 3, booting);
    G.lowQ = G.detailLow = false; post.samples = 4; post.fx = !G.weakGPU;
    if (re && !booting) precompile();
    applyScale();
  }
  const storeQ = () => { try { localStorage.setItem('rch-quality', JSON.stringify(QS)); } catch (e) { /* private mode / file:// without storage */ } };
  G.settings = {
    get() { return Object.assign({ preset: QS.preset, fps: QS.fps, police: QS.police }, QS.preset === 'auto' ? effective() : QS.s); },
    set(k, v) {
      if (k === 'fps') QS.fps = v ? 1 : 0;
      else if (k === 'police') { QS.police = v ? 1 : 0; G.game.setPolice(QS.police); }
      else if (k === 'preset') {
        if (v === 'auto') { QS.preset = 'auto'; QS.s = null; applyAuto(); }
        else if (PRESETS[v]) { QS.preset = v; QS.s = Object.assign({}, PRESETS[v]); applyManual(QS.s); }
      } else {
        if (QS.preset === 'auto') { QS.s = effective(); QS.s.res = Math.round(U.clamp(QS.s.res, 0.5, 1) * 20) / 20; }
        QS.s[k] = v; QS.preset = 'custom';
        for (const n in PRESETS) { let same = true; for (const f in PRESETS[n]) if (PRESETS[n][f] !== QS.s[f]) same = false; if (same) QS.preset = n; }
        applyManual(QS.s);
      }
      storeQ();
    },
    restart() { G.game.restart(); },
    pause(on) { // the menu does not stop the world: it drops it into extreme slow motion (see tick)
      G.slowmo = on; if (!on) for (const k in heldUp) input[k] = 0; heldUp = {};
    },
    load() { // saved manual settings are applied before the first shader build
      try {
        const o = JSON.parse(localStorage.getItem('rch-quality') || 'null'); if (!o) return;
        QS.fps = o.fps ? 1 : 0; QS.police = o.police === 0 ? 0 : 1; G.game.setPolice(QS.police);
        if (o.preset && o.preset !== 'auto' && o.s) {
          const d = PRESETS.high, s = {}; for (const f in d) s[f] = typeof o.s[f] === 'number' ? o.s[f] : d[f];
          s.res = U.clamp(s.res, 0.5, 1); s.aa = s.aa >= 4 ? 4 : s.aa >= 2 ? 2 : 0; s.shadows = U.clamp(s.shadows | 0, 0, 3); s.refl = U.clamp(s.refl | 0, 0, 3);
          QS.preset = PRESETS[o.preset] ? o.preset : 'custom'; QS.s = s; applyManual(s, true);
        }
      } catch (e) { /* ignore a broken record */ }
    },
  };
  function adapt(ms) {
    dyn.acc += Math.min(ms, 100); dyn.n++;
    if (dyn.acc < 700) return;
    const avg = dyn.acc / dyn.n; dyn.acc = 0; dyn.n = 0;
    G.stats.ms = avg; G.stats.fps = 1000 / avg;
    if (G.fixedScale || G.manualQ || document.hidden) return;
    if (dyn.cool > 0) dyn.cool--;
    if (avg > 18.6) {
      dyn.good = 0;
      if (++dyn.slow < 2) return;
      dyn.slow = 0;
      if (rscale > 0.56) {
        dyn.ceil = rscale * 0.97; dyn.hold = dyn.holdLen; dyn.holdLen = Math.min(90, dyn.holdLen * 2);
        rscale = Math.max(0.55, rscale * (avg > 24 ? 0.8 : 0.9)); applyScale(); dyn.cool = 4;
      } else if (!G.lowQ) { setQuality(true); if (G.refl.mode === 2) G.refl.setMode(1); dyn.cool = 6; }
      else if (G.refl.mode > 0) { G.refl.setMode(0); dyn.cool = 6; }
    } else {
      dyn.slow = 0;
      if (dyn.hold > 0) { if (--dyn.hold === 0) dyn.ceil = 1; }
      if (avg < 17.3) {
        if (dyn.cool === 0 && rscale < dyn.ceil - 0.005) { rscale = Math.min(dyn.ceil, rscale * 1.1); applyScale(); dyn.cool = 4; }
        // sustained headroom at full resolution: restore MSAA and soft shadows
        if (G.lowQ && rscale >= 0.995 && ++dyn.good > 45) { dyn.good = 0; setQuality(false); if (!G.weakGPU) G.refl.setMode(2); else if (G.refl.mode === 0) G.refl.setMode(1); dyn.cool = 8; }
      } else dyn.good = 0;
    }
  }

  const _v = new THREE.Vector3(), _ax = new THREE.Vector3(), _ay = new THREE.Vector3();
  function updateSun() {
    const d = G.sunDir, fx = Math.sin(cam.yaw), fz = Math.cos(cam.yaw);
    _v.set(P.x + fx * 62, P.y, P.z + fz * 62);
    _ax.set(0, 1, 0).cross(d).normalize(); _ay.copy(d).cross(_ax).normalize();
    const tex = 2 * G.shHalf / G.smap, a = Math.round(_v.dot(_ax) / tex) * tex, b = Math.round(_v.dot(_ay) / tex) * tex, c = _v.dot(d);
    _v.set(0, 0, 0).addScaledVector(_ax, a).addScaledVector(_ay, b).addScaledVector(d, c);
    sun.target.position.copy(_v); sun.position.copy(_v).addScaledVector(d, 300);
    sun.target.updateMatrixWorld(); sun.updateMatrixWorld();
    G.uSunV.value.copy(d).transformDirection(camera.matrixWorldInverse);
  }
  function syncCar(dt) {
    const r = car.root;
    r.position.set(P.x, P.y, P.z); r.rotation.set(P.pitch, P.yaw, P.roll);
    car.body.rotation.set(P.sp, 0, P.sr); car.body.position.y = P.sz - Math.abs(P.sr) * 0.12;
    const vf = P.vx * Math.sin(P.yaw) + P.vz * Math.cos(P.yaw);
    P.spin += vf / 0.35 * dt;
    const vis = U.clamp(P.steer * (1 + Math.abs(vf) * 0.11), -0.6, 0.6);
    car.wheels.forEach((w, i) => { w.spin.rotation.x = (P.inHb && !w.front && !P.auto) ? w.spin.rotation.x : P.spin; if (w.front) w.steer.rotation.y = vis; w.steer.position.y = w.steer.userData.y0 + P.wb[i]; });
    car.M.tail.emissiveIntensity += ((P.braking ? 8.0 : 0.55) - car.M.tail.emissiveIntensity) * Math.min(1, dt * 25);
    car.M.blur.opacity = U.smooth(9, 30, Math.abs(vf)) * 0.6;
    G.people.update(G.paused ? 0 : dt, { speed: Math.abs(vf), steerN: U.clamp(P.steer / maxSteer(Math.abs(vf)), -1, 1), latAcc: P.latAcc, acc: P.acc, slip: P.slip, air: P.air, bump: P.svz, hood: G.game ? G.game.panels.peek() : 0 });
  }
  function effects(dt) {
    const sp = Math.hypot(P.vx, P.vz), vf = P.vx * Math.sin(P.yaw) + P.vz * Math.cos(P.yaw);
    const spinning = !P.auto && P.inThr > 0.7 && vf < 8 && vf > -1 && P.road;
    const locked = !P.auto && P.inHb && sp > 3;
    let inten = Math.max(U.smooth(1.6, 5.5, P.slip), locked ? 0.9 : 0, spinning ? 0.6 : 0, (P.braking && sp > 30 && !P.auto && P.inBrk > 0.8) ? 0.25 : 0);
    if (P.air) inten = 0;
    const fx = Math.sin(P.yaw), fz = Math.cos(P.yaw), lx = Math.cos(P.yaw), lz = -Math.sin(P.yaw);
    for (let k = 2; k < 4; k++) {
      const wx = P.x + lx * wheelPos[k][0] + fx * wheelPos[k][1], wz = P.z + lz * wheelPos[k][0] + fz * wheelPos[k][1];
      G.skids.add(k - 2, wx, wh[k], wz, wroad[k] ? inten : 0);
      if (inten > 0.25 && Math.random() < dt * 60 * (wroad[k] ? 0.9 : 0.4) * inten) {
        if (wroad[k]) G.smoke.emit(wx + (Math.random() - 0.5) * 0.3, wh[k] + 0.12, wz + (Math.random() - 0.5) * 0.3, P.vx * 0.3 + (Math.random() - 0.5) * 1.4, 0.5 + Math.random() * 0.7, P.vz * 0.3 + (Math.random() - 0.5) * 1.4, 0.42 + Math.random() * 0.2, 0.17 * inten, 0.66, 0.65, 0.64);
        else G.smoke.emit(wx, wh[k] + 0.15, wz, P.vx * 0.3 + (Math.random() - 0.5), 0.5 + Math.random() * 0.8, P.vz * 0.3 + (Math.random() - 0.5), 0.9, 0.34, 0.62, 0.44, 0.3);
      }
    }
    if (P.road && sp > 17 && !P.air && Math.random() < dt * 14 * U.smooth(17, 45, sp)) {
      const k = 2 + ((Math.random() * 2) | 0), wx = P.x + lx * wheelPos[k][0] + fx * wheelPos[k][1], wz = P.z + lz * wheelPos[k][0] + fz * wheelPos[k][1];
      G.smoke.emit(wx - fx * 0.5, wh[k] + 0.1, wz - fz * 0.5, P.vx * 0.45, 0.35, P.vz * 0.45, 0.55, 0.05, 0.7, 0.62, 0.52);
    }
    if (!P.road && sp > 6 && !P.air && Math.random() < dt * 30) {
      const k = 2 + ((Math.random() * 2) | 0), wx = P.x + lx * wheelPos[k][0] + fx * wheelPos[k][1], wz = P.z + lz * wheelPos[k][0] + fz * wheelPos[k][1];
      G.smoke.emit(wx, wh[k] + 0.2, wz, P.vx * 0.3, 0.7, P.vz * 0.3, 1.0, 0.26, 0.6, 0.43, 0.3);
    }
    G.smoke.update(dt); G.motes.update(dt); G.posts.update(dt);
    G.sound.update(dt, sp, P.auto ? 0.35 : P.inThr, P.road ? U.clamp(inten, 0, 1) : 0, !!G.paused || G.slowmo);
  }
  function lod() {
    const cx = camera.position.x, cz = camera.position.z, gd = G.detailLow ? 110 : 165;
    for (const ch of G.chunks) {
      const d = Math.hypot(ch.cx - cx, ch.cz - cz), hi = d < 150, far = d < (G.detailLow ? 620 : 1000);
      for (const m of ch.hi) m.visible = hi;
      for (const m of ch.lo) m.visible = !hi && far;
      for (const m of ch.objs) m.visible = far;
      for (const m of ch.near) m.visible = d < gd;
    }
  }
  let last = 0, frame = 0, flareVis = 0, rayAmt = 0, dtS = 1 / 60, tScale = 1; const SLOWMO = 0.05; const _inf = {};
  function tick(now) {
    requestAnimationFrame(tick);
    const raw = now - last; last = now;
    let dt = Math.min(0.05, Math.max(0.001, raw / 1000));
    dtS += (dt - dtS) * (Math.abs(dt - dtS) > 0.02 ? 1 : 0.18); dt = dtS; // smoothed: uneven frame timestamps must not shake the simulation
    const rdt = dt, tsT = G.slowmo ? SLOWMO : G.game.timeScale;
    tScale += (tsT - tScale) * (1 - Math.exp(-rdt * (tsT < tScale ? 4.5 : 7))); if (Math.abs(tScale - tsT) < 0.002) tScale = tsT;
    dt *= tScale; G.timeScale = tScale;
    { const um = post.final.uniforms.uMenu, t = G.slowmo ? 1 : 0; um.value += (t - um.value) * (1 - Math.exp(-rdt * 6)); if (Math.abs(um.value - t) < 0.003) um.value = t; } G.uRealTime.value = (G.uRealTime.value + rdt) % 1000;
    const pf = G.prof, pm = pf ? [performance.now()] : null, mk = () => { if (pf) pm.push(performance.now()); };
    if (frame > 20) adapt(raw);
    frame++;
    if (!G.paused) {
      G.uTime.value += dt;
      pollPad();
      const n = dt > 0.012 ? 2 : 1;
      for (let k = 0; k < n; k++) physics(dt / n);
      settle(dt);
      G.game.update(dt, rdt);
      P.speed = Math.hypot(P.vx, P.vz);
      if (P.y < -200) resetCar();
    }
    if (G.attract) G.camOrbit = 2.35 + 0.3 * Math.sin(G.uRealTime.value * 0.35); // title screen: the camera drifts round the front of the car
    mk(); syncCar(dt);
    updateCamera(dt);
    effects(G.paused ? 0 : dt); mk();
    sky.position.copy(camera.position);
    camera.updateMatrixWorld();
    updateSun();
    lod();
    if (G.tex.waterN) G.tex.waterN.offset.set(G.uTime.value * 0.012, G.uTime.value * 0.03);
    // sun position on screen for the flare, speed for the radial blur
    {
      const u = post.final.uniforms, sd = G.sunDir;
      _v.copy(camera.position).addScaledVector(sd, 1000).project(camera);
      camera.getWorldDirection(_ax);
      const front = _ax.dot(sd) > 0.2 ? 1 : 0, ex = Math.max(Math.abs(_v.x), Math.abs(_v.y));
      let vis = front && ex < 2.7 ? 1 : 0;
      if (vis) for (const t of [7, 16, 30, 48, 72]) { // is the sun hidden behind a bank or the tree line?
        const x = camera.position.x + sd.x * t, z = camera.position.z + sd.z * t;
        let h = G.terrain(x, z, P.hint, _inf); const ad = Math.abs(_inf.d);
        if (ad > 11) h += 11 * G.forest(x, z, _inf.s, _inf.dm) * U.smooth(11, 16, ad);
        if (h > camera.position.y + sd.y * t) { vis = 0; break; }
      }
      flareVis += (vis - flareVis) * Math.min(1, rdt * 5);
      u.uSun.value.set(_v.x * 0.5 + 0.5, _v.y * 0.5 + 0.5, flareVis * U.smooth(2.7, 1.2, ex));
      rayAmt = front * U.smooth(3.4, 1.8, ex) * 0.28;
      u.uSpeed.value += (U.smooth(14, 52, P.speed) * G.blurAmt * tScale - u.uSpeed.value) * Math.min(1, rdt * 4); // slow motion = short exposure, no streaks
    }
    renderer.info.reset();
    G.carShadow.update();
    mk(); post.render(scene, camera, rayAmt); mk();
    G.stats.calls = renderer.info.render.calls; G.stats.tris = renderer.info.render.triangles;
    if (G.refl.mode > 0) G.refl.update(false);
    mk(); hud.draw();
    G.uDynRt.value.set(-Math.cos(P.yaw), Math.sin(P.yaw));
    if (pf) { mk(); const r = [raw]; for (let i = 1; i < pm.length; i++) r.push(pm[i] - pm[i - 1]); pf.push(r); }
  }
  window.addEventListener('load', () => { setTimeout(() => { try { init(); } catch (e) { console.error(e); document.getElementById('fade').textContent = 'Failed to start: ' + e.message; } }, 30); });
})();
