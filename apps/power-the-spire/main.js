// "One Sentence" — a floating island city built entirely from code.
// Everything on screen is a pure function of time `t` (seconds), so the same scene can be
// rendered frame by frame for the video (?capture) or played live with orbit controls.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { createGame } from './game.js';

const W = 1080, H = 1920, FOV = 50, BLOOM = 0.42;
const query = new URLSearchParams(location.search);
const CAPTURE = query.has('capture');
const PARTICLES = Number(query.get('particles') ?? 40000);

// When each thing happens (seconds). Matched to the narration word timings.
const T = { pulse: 3.2, grid: 3.3, glyphs: 4.0, terrain: 10.2, towers: 12.2, lights: 14.9, traffic: 15.9,
            particles: 17.6, shadows: 20.1, wireOn: 22.1, wireOff: 23.3, reveal: 24.4, end: 30.05, duration: 33 };

// ---------- small math helpers ----------
const clamp01 = x => Math.min(1, Math.max(0, x));
const smooth = (a, b, x) => { const k = clamp01((x - a) / (b - a)); return k * k * (3 - 2 * k); };
const easeOutCubic = k => 1 - Math.pow(1 - clamp01(k), 3);
const easeOutBack = k => { k = clamp01(k); const c = 1.70158; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); };

function mulberry32(seed) {           // seeded random numbers, so the world is identical on every run
  return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let x = Math.imul(seed ^ seed >>> 15, 1 | seed);
    x = x + Math.imul(x ^ x >>> 7, 61 | x) ^ x; return ((x ^ x >>> 14) >>> 0) / 4294967296; };
}
const rand = mulberry32(20261113);

function hash2(ix, iz) { const s = Math.sin(ix * 127.1 + iz * 311.7) * 43758.5453; return s - Math.floor(s); }
function noise(x, z) {                // value noise
  const ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz;
  const u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
  const a = hash2(ix, iz), b = hash2(ix + 1, iz), c = hash2(ix, iz + 1), d = hash2(ix + 1, iz + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, z) { let sum = 0, amp = 0.5; for (let i = 0; i < 4; i++) { sum += amp * noise(x, z); x *= 2.03; z *= 2.03; amp *= 0.5; } return sum; }

// ---------- camera path: cubic Hermite through timed keys ----------
const ring = (deg, r, y) => [Math.cos(deg * Math.PI / 180) * r, y, Math.sin(deg * Math.PI / 180) * r];
const keys = [ // time, camera position, look-at target
  [0.0,  [0, 7, 52],        [0, 3, 0]],
  [3.4,  [0, 7, 48],        [0, 2, 0]],
  [6.6,  [16, 5, 36],       [0, 2, -4]],
  [9.8,  [34, 12, 34],      [0, 3, 0]],
  [12.4, [50, 26, 30],      [0, 6, 0]],
  [14.8, [44, 34, -22],     [0, 8, 0]],
  [16.6, [30, 16, -34],     [6, 8, -18]],
  [17.6, ring(-70, 22, 5.5),  ring(-112, 22, 6)],     // down onto the boulevard…
  [18.6, ring(-115, 22, 6),   ring(-160, 22, 7)],     // …and along it
  [19.6, ring(-160, 22, 12),  [-8, 12, 4]],           // climb out above the rooftops
  [21.0, [-34, 20, 18],     [0, 16, 0]],
  [22.6, [-22, 22, 38],     [0, 17, 0]],
  [24.4, [10, 24, 46],      [0, 15, 0]],
  [27.0, [92, 36, 124],     [0, -8, 0]],
  [30.0, [140, 30, 188],    [0, -12, 0]],
  [33.0, [150, 28, 193],    [0, -13, 0]],
];
function hermite(keys, t, slot, out) {
  t = Math.min(Math.max(t, keys[0][0]), keys[keys.length - 1][0]);
  let i = 0; while (i < keys.length - 2 && t > keys[i + 1][0]) i++;
  const k0 = keys[i], k1 = keys[i + 1], dt = k1[0] - k0[0], u = (t - k0[0]) / dt;
  const kp = keys[Math.max(i - 1, 0)], kn = keys[Math.min(i + 2, keys.length - 1)];
  const h00 = 2 * u * u * u - 3 * u * u + 1, h10 = u * u * u - 2 * u * u + u, h01 = -2 * u * u * u + 3 * u * u, h11 = u * u * u - u * u;
  for (let a = 0; a < 3; a++) {
    const m0 = (k1[slot][a] - kp[slot][a]) / (k1[0] - kp[0]), m1 = (kn[slot][a] - k0[slot][a]) / (kn[0] - k0[0]);
    out.setComponent(a, h00 * k0[slot][a] + h10 * dt * m0 + h01 * k1[slot][a] + h11 * dt * m1);
  }
  return out;
}

// ---------- renderer ----------
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: CAPTURE, powerPreference: 'high-performance' });
renderer.setPixelRatio(1);
renderer.setSize(W, H, false);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x050a1c, 0.008);
const camera = new THREE.PerspectiveCamera(FOV, W / H, 0.5, 3000);
const POINT_SCALE = H / (2 * Math.tan(FOV * Math.PI / 360));   // pixels per world unit at distance 1

const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 }));
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), BLOOM, 0.6, 0.86);
composer.addPass(bloom);
composer.addPass(new OutputPass());

// ---------- lights ----------
const hemi = new THREE.HemisphereLight(0x6f8cff, 0x3a1c7a, 0.55);
const key = new THREE.DirectionalLight(0xc4d6ff, 3.6);
key.castShadow = true;
key.shadow.mapSize.set(4096, 4096);
Object.assign(key.shadow.camera, { left: -75, right: 75, top: 75, bottom: -75, near: 1, far: 320 });
key.shadow.bias = -0.0004; key.shadow.normalBias = 0.35;
const rim = new THREE.DirectionalLight(0x8a4dff, 1.7);
rim.position.set(-60, 30, -70);
const spireLight = new THREE.PointLight(0x66aaff, 0, 90, 2);
spireLight.position.set(0, 30, 0);
const coreLight = new THREE.PointLight(0x9a5cff, 0, 190, 1.6);
coreLight.position.set(0, -62, 0);
scene.add(hemi, key, key.target, rim, spireLight, coreLight);

// ---------- sky and stars ----------
const sky = new THREE.Mesh(new THREE.SphereGeometry(1500, 32, 16), new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, fog: false, uniforms: { uSky: { value: 0 } },
  vertexShader: `varying vec3 vDir; void main(){ vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `uniform float uSky; varying vec3 vDir;
    void main(){ float h = normalize(vDir).y;
      vec3 col = mix(vec3(0.010, 0.018, 0.055), vec3(0.002, 0.004, 0.014), smoothstep(-0.3, 0.7, h));
      col += vec3(0.07, 0.035, 0.16) * exp(-abs(h + 0.12) * 5.0);          // violet haze near the horizon
      gl_FragColor = vec4(col * uSky, 1.0); }`,
}));
scene.add(sky);

const pointFragment = `varying float vAlpha; varying vec3 vColor;
  void main(){ float d = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.05, d) * vAlpha; if (a < 0.003) discard; gl_FragColor = vec4(vColor * a, 1.0); }`;
const additive = { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false };

const stars = (() => {
  const n = 2600, pos = new Float32Array(n * 3), seed = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const u = rand() * 2 - 1, a = rand() * Math.PI * 2, s = Math.sqrt(1 - u * u), r = 900 + rand() * 300;
    pos.set([Math.cos(a) * s * r, u * r, Math.sin(a) * s * r], i * 3); seed[i] = rand();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  return new THREE.Points(g, new THREE.ShaderMaterial({ ...additive, uniforms: { uFade: { value: 0 } },
    vertexShader: `attribute float aSeed; uniform float uFade; varying float vAlpha; varying vec3 vColor;
      void main(){ gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = mix(2.0, 5.0, aSeed * aSeed); vAlpha = uFade * mix(0.35, 1.0, fract(aSeed * 7.3));
        vColor = mix(vec3(0.6, 0.75, 1.0), vec3(0.85, 0.7, 1.0), fract(aSeed * 3.1)); }`,
    fragmentShader: pointFragment }));
})();
stars.frustumCulled = false;
scene.add(stars);

// ---------- terrain: one grid of vertices shared by the solid mesh and the wireframe ----------
const GRID = 140, SIZE = 130, DEPTH = 50;
const edgeRadius = a => 55 + 3.5 * Math.sin(3 * a + 1) + 2 * Math.sin(7 * a + 2.3);
function terrainHeight(x, z) {
  const r = Math.hypot(x, z), e = edgeRadius(Math.atan2(z, x));
  const rim = smooth(40, 50, r) * (1 - smooth(e - 7, e, r));     // flat city plateau, hills around it, flat edge
  const y = rim * (2 + 9 * fbm(x * 0.06, z * 0.06));
  return y;
}
const terrain = (() => {
  const side = GRID + 1, pos = new Float32Array(side * side * 3), rest = new Float32Array(side * side), inside = new Uint8Array(side * side);
  for (let j = 0; j < side; j++) for (let i = 0; i < side; i++) {
    const k = j * side + i, x = (i / GRID - 0.5) * SIZE, z = (j / GRID - 0.5) * SIZE;
    pos[k * 3] = x; pos[k * 3 + 2] = z; rest[k] = terrainHeight(x, z);
    inside[k] = Math.hypot(x, z) < edgeRadius(Math.atan2(z, x)) ? 1 : 0;
  }
  const tris = [], lines = [];
  for (let j = 0; j < GRID; j++) for (let i = 0; i < GRID; i++) {
    const a = j * side + i, b = a + 1, c = a + side, d = c + 1;
    if (inside[a] && inside[b] && inside[c] && inside[d]) tris.push(a, c, b, b, c, d);
    if (inside[a] && inside[b]) lines.push(a, b);
    if (inside[a] && inside[c]) lines.push(a, c);
  }
  const position = new THREE.BufferAttribute(pos, 3);
  const solidGeo = new THREE.BufferGeometry(); solidGeo.setAttribute('position', position); solidGeo.setIndex(tris);
  const lineGeo = new THREE.BufferGeometry(); lineGeo.setAttribute('position', position); lineGeo.setIndex(lines);
  solidGeo.boundingSphere = lineGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 100);

  const ground = new THREE.MeshStandardMaterial({ color: 0x2b3b6c, roughness: 0.9, metalness: 0.05, flatShading: true,
    polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
  const solid = new THREE.Mesh(solidGeo, ground); solid.receiveShadow = true; solid.castShadow = true;

  const wire = new THREE.ShaderMaterial({ ...additive, uniforms: { uReveal: { value: 0 }, uOpacity: { value: 0 } },
    vertexShader: `varying float vR; void main(){ vR = length(position.xz); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform float uReveal; uniform float uOpacity; varying float vR;
      void main(){ if (vR > uReveal) discard;
        float front = exp(-(uReveal - vR) * 0.35) * step(uReveal, 69.0);      // bright edge of the expanding pulse
        gl_FragColor = vec4(vec3(0.16, 0.45, 1.0) * uOpacity + vec3(0.5, 0.75, 1.0) * front * 1.6, 1.0); }` });
  const grid = new THREE.LineSegments(lineGeo, wire);

  const rising = []; for (let k = 0; k < rest.length; k++) if (rest[k] > 0.01) rising.push(k);
  let last = -1;
  function update(t) {
    const stage = clamp01((t - T.terrain) / 2.4);
    if (stage === last) return; last = stage;
    for (const k of rising) {
      const delay = (pos[k * 3] + SIZE / 2) / SIZE;                // the rise sweeps across the island
      pos[k * 3 + 1] = rest[k] * easeOutBack((t - T.terrain - delay) / 1.2);
    }
    position.needsUpdate = true;
  }
  return { solid, grid, ground, wire, update };
})();
scene.add(terrain.solid, terrain.grid);

// ---------- the rock underneath ----------
const rockMat = new THREE.MeshStandardMaterial({ color: 0x2a3260, roughness: 1, flatShading: true, side: THREE.DoubleSide });
const rock = (() => {
  const SEG = 44, RINGS = 9, pos = [], idx = [];
  for (let j = 0; j <= RINGS; j++) for (let i = 0; i < SEG; i++) {
    const a = i / SEG * Math.PI * 2, d = j / RINGS;
    const bump = j === 0 ? 1 : 0.82 + 0.4 * noise(Math.cos(a) * 3 + j * 1.7, Math.sin(a) * 3 + j * 0.9);
    const r = edgeRadius(a) * Math.pow(1 - d, 0.72) * bump;
    pos.push(Math.cos(a) * r, -DEPTH * Math.pow(d, 1.15) - (j ? 2.5 * noise(i * 0.9, j * 2.1) : 0), Math.sin(a) * r);
  }
  for (let j = 0; j < RINGS; j++) for (let i = 0; i < SEG; i++) {
    const a = j * SEG + i, b = j * SEG + (i + 1) % SEG, c = a + SEG, d = b + SEG;
    idx.push(a, b, c, b, d, c);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  const mesh = new THREE.Mesh(g, rockMat); mesh.position.y = -0.05;
  return mesh;
})();
scene.add(rock);

// ---------- towers ----------
const camProbe = new THREE.Vector3();
function nearCameraPath(x, z, radius, height) {      // keep buildings out of the camera's way
  for (let t = 9; t < T.duration; t += 0.05) {
    hermite(keys, t, 1, camProbe);
    if (camProbe.y < height + 3 && Math.hypot(camProbe.x - x, camProbe.z - z) < radius + 5.5) return true;
  }
  return false;
}
const towers = [];
for (let tries = 0; tries < 6000 && towers.length < 78; tries++) {
  const inner = rand() < 0.42, r = inner ? 6.5 + rand() * 10 : 27 + rand() * 8.5, a = rand() * Math.PI * 2;
  const x = Math.cos(a) * r, z = Math.sin(a) * r, w = 2.4 + rand() * 2.2, d = 2.4 + rand() * 2.2;
  const h = inner ? 9 + 16 * Math.pow(rand(), 1.4) : 4 + 9 * rand();
  const radius = Math.max(w, d) * 0.72;
  if (towers.some(o => Math.hypot(o.x - x, o.z - z) < radius + o.radius + 0.5)) continue;
  if (nearCameraPath(x, z, radius, h)) continue;
  towers.push({ x, z, w, d, h, radius, rot: -a + (rand() - 0.5) * 0.3, delay: r / 36 * 1.3 + rand() * 0.35, seed: rand() });
}
const towerMat = new THREE.MeshStandardMaterial({ color: 0x3d4c7c, roughness: 0.55, metalness: 0.15 });
const lightsUniform = { value: 0 };
towerMat.onBeforeCompile = shader => {          // lit windows, drawn procedurally on the tower walls
  shader.uniforms.uLights = lightsUniform;
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', `#include <common>
      attribute float aSeed; varying vec3 vLocal; varying vec3 vObjN; varying float vSeed; varying float vRad;`)
    .replace('#include <begin_vertex>', `#include <begin_vertex>
      vec3 size = vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz), length(instanceMatrix[2].xyz));
      vLocal = position * size; vObjN = normal; vSeed = aSeed; vRad = length(instanceMatrix[3].xz);`);
  shader.fragmentShader = shader.fragmentShader
    .replace('#include <common>', `#include <common>
      uniform float uLights; varying vec3 vLocal; varying vec3 vObjN; varying float vSeed; varying float vRad;
      float hash21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }`)
    .replace('#include <color_fragment>', `#include <color_fragment>
      diffuseColor.rgb *= mix(0.35, 1.0, smoothstep(0.0, 7.0, vLocal.y));      // darker towards the street
      float sideways = step(0.5, abs(vObjN.x));
      vec2 uv = mix(vLocal.xy, vLocal.zy, sideways);
      vec2 g = vec2(uv.x / 0.8 + 0.5, uv.y / 1.05);
      vec2 cell = floor(g), f = fract(g);
      float pane = step(0.2, f.x) * step(f.x, 0.8) * step(0.3, f.y) * step(f.y, 0.78);
      pane = mix(pane, 0.29, smoothstep(0.25, 0.7, max(fwidth(g.x), fwidth(g.y))));     // far away: average instead of shimmer
      pane *= step(abs(vObjN.y), 0.5);                                                  // walls only, not the roof
      diffuseColor.rgb *= 1.0 - 0.6 * pane;                                             // unlit windows are dark glass`)
    .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
      {
        float h = hash21(cell + vSeed * 91.7 + sideways * 17.0);
        float delay = vRad / 40.0 * 0.75 + h * 0.4;                                    // lights spread outward from the spire
        float on = step(fract(h * 13.7), 0.62) * smoothstep(delay, delay + 0.06, uLights);
        vec3 color = mix(vec3(0.3, 0.62, 1.0), vec3(0.72, 0.45, 1.0), step(0.78, fract(h * 7.3)));
        color = mix(color, vec3(1.0), step(0.9, fract(h * 29.1)) * 0.7);
        totalEmissiveRadiance += pane * on * color * 1.3;
      }`);
};
const box = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0);
box.setAttribute('aSeed', new THREE.InstancedBufferAttribute(new Float32Array(towers.map(o => o.seed)), 1));
const towerMesh = new THREE.InstancedMesh(box, towerMat, towers.length);
towerMesh.castShadow = towerMesh.receiveShadow = true; towerMesh.frustumCulled = false;
const crownMat = new THREE.MeshBasicMaterial({ color: 0x000000, fog: false });
const crownMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0), crownMat, towers.length);
crownMesh.frustumCulled = false;
scene.add(towerMesh, crownMesh);
const tower = new THREE.Object3D();
function updateTowers(t) {
  towers.forEach((tw, i) => {
    const k = (t - T.towers - tw.delay) / 1.15;
    tower.position.set(tw.x, 0, tw.z); tower.rotation.y = tw.rot;
    tower.scale.set(tw.w, 1, tw.d);
    tower.scale.y = tw.h * easeOutBack(k);
    tower.scale.y = Math.max(tower.scale.y, 0.001);
    tower.updateMatrix(); towerMesh.setMatrixAt(i, tower.matrix);
    tower.position.y = tower.scale.y; tower.scale.set(tw.w * 1.04, 0.14, tw.d * 1.04);
    tower.updateMatrix(); crownMesh.setMatrixAt(i, tower.matrix);
  });
  towerMesh.instanceMatrix.needsUpdate = crownMesh.instanceMatrix.needsUpdate = true;
}

// ---------- the central spire ----------
const SPIRE_H = 36;
const spire = new THREE.Group();
const spireMat = new THREE.MeshStandardMaterial({ color: 0x4a5fa8, roughness: 0.4, metalness: 0.3, flatShading: true });
const spireGeo = new THREE.CylinderGeometry(0.9, 3.4, SPIRE_H, 6).translate(0, SPIRE_H / 2, 0);
const spireBody = new THREE.Mesh(spireGeo, spireMat); spireBody.castShadow = true;
const glowMat = new THREE.MeshBasicMaterial({ color: 0x000000, fog: false });
const spireEdges = new THREE.LineSegments(new THREE.EdgesGeometry(spireGeo), new THREE.LineBasicMaterial({ color: 0x000000, fog: false }));
const beacon = new THREE.Mesh(new THREE.OctahedronGeometry(1.5), glowMat); beacon.position.y = SPIRE_H + 1.6;
const halo1 = new THREE.Mesh(new THREE.TorusGeometry(6.2, 0.13, 8, 96), glowMat);
const halo2 = new THREE.Mesh(new THREE.TorusGeometry(9.0, 0.09, 8, 96), glowMat);
spire.add(spireBody, spireEdges, beacon, halo1, halo2);
scene.add(spire);

// ---------- roads and traffic ----------
const ROADS = [{ r: 22, w: 7 }, { r: 38, w: 3.6 }];
const roadMat = new THREE.MeshStandardMaterial({ color: 0x141c3c, roughness: 0.9, metalness: 0, transparent: true, opacity: 0 });
const laneMat = new THREE.MeshBasicMaterial({ color: 0x000000, fog: false, ...additive });
for (const { r, w } of ROADS) {
  const road = new THREE.Mesh(new THREE.RingGeometry(r - w / 2, r + w / 2, 160).rotateX(-Math.PI / 2), roadMat);
  road.position.y = 0.05; road.receiveShadow = true; scene.add(road);
  for (const edge of [r - w / 2, r + w / 2]) {
    const lane = new THREE.Mesh(new THREE.RingGeometry(edge - 0.07, edge + 0.07, 160).rotateX(-Math.PI / 2), laneMat);
    lane.position.y = 0.09; scene.add(lane);
  }
}
const traffic = (() => {
  const TRAIL = 16, cars = [];
  for (const { r, w } of ROADS) for (let i = 0; i < r * 2.2; i++) {
    const dir = rand() < 0.5 ? 1 : -1;
    cars.push({ r: r + dir * w * (0.12 + rand() * 0.22), phase: rand() * Math.PI * 2, speed: dir * (7 + rand() * 5) / r, dir });
  }
  const n = cars.length * TRAIL, aCar = new Float32Array(n * 4), aCol = new Float32Array(n * 3);
  cars.forEach((c, i) => { for (let j = 0; j < TRAIL; j++) {
    aCar.set([c.r, c.phase, c.speed, j / (TRAIL - 1)], (i * TRAIL + j) * 4);
    aCol.set(c.dir > 0 ? [0.75, 0.88, 1.0] : [0.72, 0.42, 1.0], (i * TRAIL + j) * 3);
  } });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  g.setAttribute('aCar', new THREE.BufferAttribute(aCar, 4)); g.setAttribute('aColor', new THREE.BufferAttribute(aCol, 3));
  const mat = new THREE.ShaderMaterial({ ...additive, uniforms: { uTime: { value: 0 }, uFade: { value: 0 }, uScale: { value: POINT_SCALE } },
    vertexShader: `attribute vec4 aCar; attribute vec3 aColor; uniform float uTime; uniform float uFade; uniform float uScale;
      varying float vAlpha; varying vec3 vColor;
      void main(){ float aRing = aCar.x, aPhase = aCar.y, aSpeed = aCar.z, aTrail = aCar.w;
        float a = aPhase + aSpeed * uTime;
        a -= sign(aSpeed) * aTrail * 4.2 / aRing;                              // the trail stretches out behind each car
        vec4 mv = modelViewMatrix * vec4(cos(a) * aRing, 0.38, sin(a) * aRing, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = clamp(0.34 * (1.0 - aTrail * 0.5) * uScale / -mv.z, 1.6, 40.0);
        vAlpha = uFade * pow(1.0 - aTrail, 1.6); vColor = aColor * 2.4; }`,
    fragmentShader: pointFragment });
  const points = new THREE.Points(g, mat); points.frustumCulled = false;
  return points;
})();
scene.add(traffic);

// ---------- particles (all motion happens on the GPU, from a seed and the time) ----------
function makePoints(count, fill, vertexMotion, size) {
  const base = new Float32Array(count * 3), seed = new Float32Array(count * 4), extra = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) fill(i, base, seed, extra);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(base, 3)); g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4));
  g.setAttribute('aExtra', new THREE.BufferAttribute(extra, 3));
  const mat = new THREE.ShaderMaterial({ ...additive,
    uniforms: { uTime: { value: 0 }, uFade: { value: 0 }, uScale: { value: POINT_SCALE }, uWind: { value: new THREE.Vector2(0.92, 0.38) } },
    vertexShader: `attribute vec4 aSeed; attribute vec3 aExtra; uniform float uTime; uniform float uFade; uniform float uScale; uniform vec2 uWind;
      varying float vAlpha; varying vec3 vColor;
      void main(){ vec3 p = position; float life; float alpha;
        ${vertexMotion}
        vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mv;
        gl_PointSize = clamp(${size} * uScale / -mv.z, 1.6, 16.0);
        vAlpha = alpha * uFade;
        vColor = mix(mix(vec3(0.25, 0.55, 1.0), vec3(0.62, 0.38, 1.0), step(0.6, aSeed.w)), vec3(1.0), step(0.9, fract(aSeed.w * 9.7)) * 0.8); }`,
    fragmentShader: pointFragment });
  const points = new THREE.Points(g, mat); points.frustumCulled = false;
  return points;
}
const dust = makePoints(PARTICLES, (i, base, seed) => {
  const r = Math.sqrt(rand()) * 56, a = rand() * Math.PI * 2;
  base.set([Math.cos(a) * r, rand() * 1.5, Math.sin(a) * r], i * 3);
  seed.set([rand(), rand(), rand(), rand()], i * 4);
}, `float age = (uTime - aSeed.x * 1.6) * mix(0.07, 0.13, aSeed.y);      // lift off in a wave, then loop
    life = fract(max(age, 0.0));
    p.y += life * mix(16.0, 46.0, aSeed.z);
    p.xz += uWind * life * life * 26.0;
    p.x += sin(uTime * 0.7 + aSeed.w * 40.0 + p.y * 0.15) * 1.6 * life;
    p.z += cos(uTime * 0.6 + aSeed.w * 31.0 + p.y * 0.12) * 1.6 * life;
    alpha = step(0.0, age) * smoothstep(0.0, 0.1, life) * (1.0 - smoothstep(0.65, 1.0, life)) * mix(0.3, 1.0, aSeed.y);`,
  'mix(0.09, 0.22, aSeed.w)');
const FALLS = [0.4, 1.7, 2.9, 4.1, 5.3];
const falls = makePoints(7000, (i, base, seed, extra) => {
  const a = FALLS[i % FALLS.length] + (rand() - 0.5) * 0.11, r = edgeRadius(a) - 0.6 - rand() * 1.4;
  base.set([Math.cos(a) * r, 0.1, Math.sin(a) * r], i * 3);
  extra.set([Math.cos(a), 0, Math.sin(a)], i * 3);
  seed.set([rand(), rand(), rand(), rand()], i * 4);
}, `life = fract(aSeed.x + uTime * 0.2 * mix(0.8, 1.2, aSeed.y));           // waterfalls of light off the rim
    float fallTime = life * 4.6;
    p += aExtra * (1.5 + 3.0 * aSeed.z) * fallTime * 0.55;
    p.y -= 3.9 * fallTime * fallTime;
    alpha = smoothstep(0.0, 0.04, life) * (1.0 - smoothstep(0.45, 1.0, life)) * mix(0.35, 1.0, aSeed.z);`,
  'mix(0.2, 0.5, aSeed.w)');
scene.add(dust, falls);

// ---------- code glyphs that rain onto the grid ----------
const glyphs = (() => {
  const chars = '01{}()[]<>=+-*/;:.,#$&|!?xyzwtfnrgbauvijkmpsqcodelTHREEGLMathPI^%~', cell = 64;
  const cv = document.createElement('canvas'); cv.width = cv.height = cell * 8;
  const ctx = cv.getContext('2d'); ctx.fillStyle = '#fff'; ctx.font = 'bold 46px Menlo, monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (let i = 0; i < 64; i++) ctx.fillText(chars[i], (i % 8 + 0.5) * cell, (Math.floor(i / 8) + 0.5) * cell + 2);
  const n = 1500, base = new Float32Array(n * 3), seed = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const r = Math.sqrt(rand()) * 50, a = rand() * Math.PI * 2;
    base.set([Math.cos(a) * r, 0, Math.sin(a) * r], i * 3); seed.set([rand(), Math.floor(rand() * 64), rand()], i * 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(base, 3)); g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 3));
  const mat = new THREE.ShaderMaterial({ ...additive,
    uniforms: { uTime: { value: 0 }, uFade: { value: 0 }, uScale: { value: POINT_SCALE }, uAtlas: { value: new THREE.CanvasTexture(cv) } },
    vertexShader: `attribute vec3 aSeed; uniform float uTime; uniform float uFade; uniform float uScale;
      varying float vAlpha; varying float vGlow; varying float vGlyph;
      void main(){ vec3 glyph = position;
        float local = uTime - aSeed.x * 4.6;                 // each glyph starts falling at its own moment
        float fall = clamp(local / 0.9, 0.0, 1.0);
        glyph.y = mix(34.0, 0.3, fall * fall);
        float landed = max(local - 0.9, 0.0);
        vAlpha = step(0.0, local) * (fall < 1.0 ? 0.85 : exp(-landed * 1.3)) * uFade;
        vGlow = step(0.9, local) * exp(-landed * 7.0); vGlyph = aSeed.y;
        vec4 mv = modelViewMatrix * vec4(glyph, 1.0); gl_Position = projectionMatrix * mv;
        gl_PointSize = mix(0.9, 1.5, aSeed.z) * uScale / -mv.z; }`,
    fragmentShader: `uniform sampler2D uAtlas; varying float vAlpha; varying float vGlow; varying float vGlyph;
      void main(){ vec2 cell = vec2(mod(vGlyph, 8.0), floor(vGlyph / 8.0));
        float a = texture2D(uAtlas, (cell + vec2(gl_PointCoord.x, 1.0 - gl_PointCoord.y)) / 8.0).a * vAlpha;
        if (a < 0.01) discard;
        gl_FragColor = vec4(mix(vec3(0.25, 0.6, 1.0), vec3(1.6), vGlow) * a, 1.0); }` });
  const points = new THREE.Points(g, mat); points.frustumCulled = false;
  return points;
})();
scene.add(glyphs);

// ---------- a soft beam of light under the island ----------
const beam = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 0.5, 16, 24, 1, true).translate(0, -8, 0), new THREE.ShaderMaterial({ ...additive, side: THREE.DoubleSide,
  uniforms: { uFade: { value: 0 } },
  vertexShader: `varying float vY; void main(){ vY = -position.y / 16.0; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `uniform float uFade; varying float vY; void main(){ gl_FragColor = vec4(vec3(0.3, 0.5, 1.0) * (1.0 - vY) * (1.0 - vY) * 0.5 * uFade, 1.0); }` }));
beam.position.y = -DEPTH + 4;
scene.add(beam);

// ---------- text overlay ----------
const $ = id => document.getElementById(id);
const hud = { prompt: $('prompt'), typed: $('typed'), caret: $('caret'), chipcaret: $('chipcaret'), code: $('code'), title: $('title'),
              caption: $('caption'), endcard: $('endcard'), flash: $('flash'), hint: $('hint') };
const PROMPT = 'build me a world';
const FRAGMENTS = [   // real lines from this file, shown as the thing they build appears
  [3.6, 6.2, 'grid = new THREE.LineSegments(lineGeo, wire)'],
  [6.5, 9.5, 'glyph.y = mix(34.0, 0.3, fall * fall)'],
  [10.2, 12.1, 'y = rim * (2 + 9 * fbm(x * 0.06, z * 0.06))'],
  [12.3, 14.6, 'tower.scale.y = tw.h * easeOutBack(k)'],
  [14.9, 15.8, 'totalEmissiveRadiance += pane * on * color * 1.3'],
  [15.95, 17.4, 'a = aPhase + aSpeed * uTime'],
  [17.6, 19.8, 'p.xz += uWind * life * life * 26.0'],
  [20.1, 21.9, 'key.castShadow = true'],
  [24.5, 29.7, 'controls = new OrbitControls(camera, canvas)'],
];
const TITLES = [
  { from: 22.1, to: 24.2, lines: [[22.1, "IT'S ALL", ''], [22.38, 'MATH.', 'accent']] },
  { from: T.end, to: 99, lines: [[30.05, 'ONE PROMPT.', ''], [30.87, 'ONE WORLD.', 'accent']] },
];
let captions = [];          // [{from, to, words: [{w, at}]}], built from the narration timeline
function buildCaptions(timeline) {
  timeline.lines.forEach((line, li) => {
    let phrase = [];
    const flush = () => {
      const parts = Math.ceil(phrase.length / 4), per = Math.ceil(phrase.length / parts);   // at most 4 words on screen
      for (let i = 0; i < phrase.length; i += per) captions.push({ words: phrase.slice(i, i + per) });
      phrase = [];
    };
    line.words.forEach((word, wi) => {
      if (li === timeline.lines.length - 1 && wi < 4) return;        // "One prompt. One world." is shown as the big title instead
      phrase.push({ w: word.w, at: line.start + word.s, end: line.start + word.e });
      if (/[.,?!—]$/.test(word.w)) flush();
    });
    flush();
  });
  captions.forEach((c, i) => {
    c.from = c.words[0].at - 0.06;
    const lastEnd = c.words[c.words.length - 1].end + 0.4, next = captions[i + 1];
    c.to = next && next.words[0].at - 0.06 < lastEnd ? next.words[0].at - 0.06 : lastEnd;
  });
}
let shownCaption = null, shownTitle = null, shownCode = null;
const fade = (t, a, b, d = 0.25) => Math.min(smooth(a, a + d, t), 1 - smooth(b - d, b, t));
function updateHud(t, showText) {
  // the prompt being typed
  const typed = Math.round(clamp01((t - 0.55) / 1.9) * PROMPT.length);
  if (hud.typed.textContent.length !== typed) hud.typed.textContent = PROMPT.slice(0, typed);
  const blink = t < 2.5 || (t * 1.7) % 1 < 0.55;
  hud.caret.style.opacity = blink ? 1 : 0; hud.chipcaret.style.opacity = (t * 1.7) % 1 < 0.55 ? 1 : 0;
  const leave = smooth(T.pulse, T.pulse + 0.7, t);
  hud.prompt.style.opacity = showText ? smooth(0.15, 0.5, t) * (1 - leave) : 0;
  hud.prompt.style.transform = `scale(${1 + 0.04 * clamp01(t / T.pulse) + leave * 0.35})`;   // drifts closer, then bursts
  hud.flash.style.opacity = showText ? 0.75 * smooth(T.pulse - 0.08, T.pulse + 0.05, t) * (1 - smooth(T.pulse + 0.05, T.pulse + 0.7, t)) : 0;

  // code fragments
  const frag = showText ? FRAGMENTS.find(f => t >= f[0] && t < f[1]) : null;
  if (frag !== shownCode) { shownCode = frag; if (frag) hud.code.textContent = frag[2]; }
  hud.code.style.opacity = frag ? fade(t, frag[0], frag[1]) * 0.95 : 0;
  if (frag) hud.code.style.transform = `translateX(${(1 - smooth(frag[0], frag[0] + 0.3, t)) * -24}px)`;

  // big titles
  const title = showText ? TITLES.find(x => t >= x.from && t < x.to) : null;
  if (title !== shownTitle) {
    shownTitle = title; hud.title.replaceChildren();
    if (title) for (const [, text, cls] of title.lines) { const s = document.createElement('span'); s.textContent = text; s.className = cls; hud.title.append(s); }
  }
  hud.title.style.opacity = title ? 1 - smooth(title.to - 0.3, title.to, t) : 0;
  if (title) title.lines.forEach(([at], i) => {
    const k = easeOutCubic((t - at) / 0.32), el = hud.title.children[i];
    el.style.opacity = k; el.style.transform = `translateY(${(1 - k) * 34}px) scale(${1.12 - 0.12 * k})`;
  });

  // captions, highlighted word by word
  const cap = showText ? captions.find(c => t >= c.from && t < c.to) : null;
  if (cap !== shownCaption) {
    shownCaption = cap; hud.caption.replaceChildren();
    if (cap) cap.words.forEach((word, i) => { const s = document.createElement('span'); s.textContent = (i ? ' ' : '') + word.w; hud.caption.append(s); });
  }
  hud.caption.style.opacity = cap ? fade(t, cap.from, cap.to, 0.08) : 0;
  if (cap) cap.words.forEach((word, i) => {
    hud.caption.children[i].className = t >= word.end ? 'said' : t >= word.at - 0.03 ? 'now' : '';
  });

  // end card
  const end = showText ? smooth(T.end - 0.5, T.end + 0.3, t) : 0;
  hud.endcard.style.opacity = end; hud.endcard.style.transform = `translateY(${(1 - end) * 24}px)`;
}

// ---------- everything else, as a function of time ----------
const camTarget = new THREE.Vector3();
const wireMat = new THREE.MeshBasicMaterial({ wireframe: true, fog: false, color: new THREE.Color(0.22, 0.5, 1.0) });
const roofGlow = new THREE.Color(0.09, 0.19, 0.3), blue = new THREE.Color(0.3, 0.62, 1.0), violet = new THREE.Color(0.62, 0.36, 1.0);
function update(t) {
  const awake = smooth(T.pulse, T.pulse + 1.2, t);
  const lights = smooth(T.lights, T.lights + 1.5, t);
  const reveal = smooth(T.reveal, T.reveal + 4.5, t);
  const wireframe = t >= T.wireOn && t < T.wireOff;

  sky.material.uniforms.uSky.value = awake;
  stars.material.uniforms.uFade.value = awake * (0.45 + 0.55 * reveal);
  scene.fog.density = 0.0085 - 0.0068 * reveal;
  hemi.intensity = 0.55 * awake;

  // grid, glyphs, terrain, rock
  terrain.wire.uniforms.uReveal.value = 70 * easeOutCubic((t - T.grid) / 3.2);
  terrain.wire.uniforms.uOpacity.value = wireframe ? 0.9 : 0.8 - 0.62 * smooth(T.terrain, T.terrain + 2.5, t) - 0.08 * reveal;
  terrain.grid.visible = t >= T.grid;
  glyphs.material.uniforms.uTime.value = t - T.glyphs;
  glyphs.material.uniforms.uFade.value = 1 - smooth(T.terrain - 0.7, T.terrain + 0.3, t);
  glyphs.visible = t >= T.glyphs && t < T.terrain + 0.4;
  terrain.update(t);
  const solidIn = smooth(T.terrain - 0.7, T.terrain, t);
  terrain.solid.visible = rock.visible = solidIn > 0;
  terrain.ground.transparent = solidIn < 1; terrain.ground.opacity = solidIn;
  rock.scale.y = Math.max(easeOutCubic((t - T.terrain) / 2.4), 0.001);

  // city
  updateTowers(t);
  towerMesh.visible = crownMesh.visible = t >= T.towers;
  spire.visible = t >= T.towers;
  spire.scale.y = Math.max(easeOutBack((t - T.towers - 0.2) / 2.0), 0.001);
  lightsUniform.value = (t - T.lights) / 1.5;
  crownMat.color.setRGB(0.035, 0.05, 0.12).lerp(roofGlow, lights);
  glowMat.color.copy(violet).lerp(blue, 0.5 + 0.5 * Math.sin(t * 1.3)).multiplyScalar(1.7 * lights);
  spireEdges.material.color.copy(blue).multiplyScalar(0.35 + 1.5 * lights);
  spireLight.intensity = 500 * lights;
  halo1.visible = halo2.visible = beacon.visible = lights > 0;
  halo1.position.y = 21 + Math.sin(t * 0.9) * 1.2; halo1.rotation.set(Math.PI / 2 + Math.sin(t * 0.7) * 0.35, t * 0.5, 0);
  halo2.position.y = 27 + Math.cos(t * 0.8) * 1.0; halo2.rotation.set(Math.PI / 2 + Math.cos(t * 0.6) * 0.45, -t * 0.4, 0.3);
  halo1.scale.setScalar(lights); halo2.scale.setScalar(lights);
  beacon.rotation.y = t * 1.4;

  roadMat.opacity = smooth(T.towers - 0.6, T.towers + 0.6, t);
  laneMat.color.copy(blue).multiplyScalar(0.55 * lights);
  traffic.material.uniforms.uTime.value = t;
  traffic.material.uniforms.uFade.value = smooth(T.traffic, T.traffic + 0.9, t);
  dust.material.uniforms.uTime.value = t - T.particles;
  dust.material.uniforms.uFade.value = smooth(T.particles, T.particles + 0.5, t) * (0.5 - 0.1 * reveal);
  dust.visible = t >= T.particles;
  falls.material.uniforms.uTime.value = t;
  falls.material.uniforms.uFade.value = lights;
  falls.visible = lights > 0;
  coreLight.intensity = 5200 * lights;
  beam.material.uniforms.uFade.value = reveal;

  // the key light swings round, so the shadows sweep across the city
  const sun = 0.5 + 0.75 * smooth(T.shadows - 0.2, T.shadows + 2.6, t);
  key.position.set(Math.cos(sun) * 85, 80, Math.sin(sun) * 85);
  key.intensity = 3.6 * awake;
  rim.intensity = 1.7 * awake;

  // "it's all math": for a moment, show the bare triangles everything is made of
  terrain.solid.material = wireframe ? wireMat : terrain.ground;
  towerMesh.material = wireframe ? wireMat : towerMat;
  rock.material = wireframe ? wireMat : rockMat;
  spireBody.material = wireframe ? wireMat : spireMat;
  crownMesh.visible = crownMesh.visible && !wireframe;
  bloom.strength = wireframe ? 0.8 : BLOOM;
}

// ---------- drawing a frame ----------
let exploring = false;
const controls = new OrbitControls(camera, canvas);
controls.enabled = false; controls.enableDamping = true; controls.minDistance = 8; controls.maxDistance = 600;

function renderAt(t) {
  update(t);
  if (!exploring) {
    camera.position.copy(hermite(keys, t, 1, camera.position));
    camera.lookAt(hermite(keys, t, 2, camTarget));
  }
  updateHud(t, !exploring);
  composer.render();
}

// How close does the camera get to anything? Used by the render script as a safety check.
function checkPath() {
  const p = new THREE.Vector3(); let worst = Infinity, where = 0;
  for (let t = 9; t < T.duration; t += 1 / 30) {
    hermite(keys, t, 1, p);
    let gap = p.y - terrainHeight(p.x, p.z);
    for (const tw of towers) if (p.y < tw.h + 0.2) gap = Math.min(gap, Math.hypot(p.x - tw.x, p.z - tw.z) - tw.radius);
    if (p.y < SPIRE_H) gap = Math.min(gap, Math.hypot(p.x, p.z) - 3.4);
    if (gap < worst) { worst = gap; where = t; }
  }
  // largest frame-to-frame change in view direction (degrees), a simple smoothness measure
  const a = new THREE.Vector3(), b = new THREE.Vector3(), q = new THREE.Vector3(); let turn = 0, turnAt = 0;
  for (let f = 1; f < T.duration * 30; f++) {
    a.copy(hermite(keys, (f - 1) / 30, 2, q)).sub(hermite(keys, (f - 1) / 30, 1, p)).normalize();
    b.copy(hermite(keys, f / 30, 2, q)).sub(hermite(keys, f / 30, 1, p)).normalize();
    const deg = a.angleTo(b) * 180 / Math.PI; if (deg > turn) { turn = deg; turnAt = f / 30; }
  }
  return { towers: towers.length, particles: PARTICLES, closest: +worst.toFixed(2), at: +where.toFixed(2), maxTurnPerFrame: +turn.toFixed(2), turnAt: +turnAt.toFixed(2) };
}

await document.fonts.load('700 66px "Space Grotesk"'); await document.fonts.load('500 30px "Space Grotesk"');

// ---------- the game: the finished world, driven by game.js instead of the film ----------
// power 0..1 is how many orbs have been collected: it switches the city's lights on from the spire outwards.
function drawWorld(t, power, burst) {
  update(t);
  lightsUniform.value = power * 1.2;
  glowMat.color.multiplyScalar(0.12 + 0.88 * power + 1.6 * burst);
  spireLight.intensity = 500 * power * (1 + 2 * burst);
  coreLight.intensity = 5200 * (0.25 + 0.75 * power);
  halo1.scale.setScalar(Math.max(power * (1 + 0.5 * burst), 0.001)); halo2.scale.setScalar(Math.max(power * (1 + 0.8 * burst), 0.001));
  laneMat.color.multiplyScalar(0.3 + 0.7 * power);
  updateHud(t, false);
}
const stage = $('stage');
const fit = () => { const s = Math.min(innerWidth / W, innerHeight / H); stage.style.transform = `translate(${(innerWidth - W * s) / 2}px, ${(innerHeight - H * s) / 2}px) scale(${s})`; };
addEventListener('resize', fit); fit();
window.game = await createGame({ THREE, scene, camera, renderer, stage, terrainHeight, edgeRadius, towers, SPIRE_H, smooth,
  drawWorld, render: () => composer.render(), replayUrl: query.get('replay') });
