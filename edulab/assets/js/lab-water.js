/* EduLab · 水循环三维沙盘（water）
 * 章节：水循环环节 / 三类水循环 / 海绵城市 / 水量平衡
 * 场景：剖面地形沙盘（海洋-城市-水库-高山-内陆湖）+ 粒子演示各环节 + 海绵城市对比 + 水量平衡箭头。
 */
import {
  THREE, clamp,
  loadTexture, loadAll, createApp, cameraTweenTick, makeLoader,
  createSections, createControlsPanel, makeTextSprite, setSpriteText,
} from './edu-core.js';

const TEXDIR_SKY = '../assets/textures/sky/sky_court-BKHrsJQE.webp';
const TEXDIR_PBR_GROUND = '../assets/textures/pbr/ground_nor-c2-TseGf.webp';

/* ---------------- 地形函数 ---------------- */

function smoothstep(a, b, x) {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
}

function baseHeight(x) {
  if (x < -8) return -3 + Math.sin(x * 0.4) * 0.12;                        // 海洋盆地
  if (x < -6) return -3 + smoothstep(-8, -6, x) * 3.85;                    // 海滩
  if (x < 3.0) return 0.55 + Math.sin(x * 1.7) * 0.03;                     // 沿海平原（城市）
  if (x < 3.4) return 0.55 + smoothstep(3.0, 3.4, x) * 1.35;               // 大坝
  if (x < 5.2) {                                                           // 水库碗
    const bowl = smoothstep(3.4, 3.9, x) * smoothstep(5.2, 4.7, x);
    return 1.55 - bowl * 0.35;
  }
  if (x < 6.4) return 1.45 + smoothstep(5.2, 6.4, x) * 0.85;               // 山前过渡
  if (x < 13.5) {                                                          // 高山
    const t = (x - 6.4) / 7.1;
    const ridge = Math.sin(t * Math.PI) * (2.6 + 0.9 * Math.sin(x * 2.3 + 1));
    return 2.3 + Math.max(ridge, 0);
  }
  if (x < 15) return 2.3 + smoothstep(13.5, 15, x) * 0.2;                  // 山地→高原
  if (x < 21) return 2.5 + Math.sin(x * 1.3) * 0.1;                        // 内陆高原
  return 2.5 + smoothstep(21, 24, x) * 2.2;                                // 内陆边缘高地
}

// 河道下切（坝下 → 海洋，沿 z≈0）
function riverCarve(x, z) {
  if (x >= 3.0 || x < -7.6) return 0;
  const along = smoothstep(3.0, 2.4, x) * smoothstep(-7.6, -6.4, x);
  const width = Math.exp(-(z * z) / (2 * 0.8 * 0.8));
  return 0.46 * along * width;
}

// 内陆湖盆
function lakeCarve(x, z) {
  if (x < 15.6 || x > 19.8) return 0;
  const dx = (x - 17.7) / 2.1, dz = z / 2.4;
  const d2 = dx * dx + dz * dz;
  return d2 < 1 ? (1 - d2) * 0.42 : 0;
}

function terrainH(x, z) {
  return baseHeight(x) - riverCarve(x, z) - lakeCarve(x, z);
}

/* ---------------- 场景骨架 ---------------- */

const stage = document.getElementById('stage');
const loader = makeLoader(stage, '正在构建水循环沙盘…');

const app = createApp({
  container: stage,
  fov: 40, near: 0.1, far: 500,
  cameraPos: [1, 17, 37],
  target: [1, 0.5, 0],
  minDistance: 8, maxDistance: 80,
  keepBackground: true,
});
const { scene, camera, controls } = app;

scene.add(new THREE.HemisphereLight(0xcfe8ff, 0x8a7a5a, 0.5));
const sun = new THREE.DirectionalLight(0xfff1dc, 2.0);
sun.position.set(-14, 20, 10);
scene.add(sun);

const X0 = -24, X1 = 24, Z0 = -6, Z1 = 6;
let terrainMat;

function buildTerrain(normalMap) {
  const SEG_X = 260, SEG_Z = 72;
  const geo = new THREE.PlaneGeometry(X1 - X0, Z1 - Z0, SEG_X, SEG_Z);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const y = terrainH(x, z);
    pos.setY(i, y);
    if (x < -6.6) c.set(0xb9a77e).multiplyScalar(0.55 + Math.min(1, (x + 24) / 18) * 0.25);   // 海底
    else if (x < -5.2) c.set(0xdcc9a0);                                                       // 海滩
    else if (x < 2.9) c.set(0x71b25e);                                                        // 平原草地
    else if (x < 3.4) c.set(0xb5b0a4);                                                        // 大坝
    else if (x < 5.4) c.set(0x7fae62);                                                        // 水库岸边
    else if (y > 4.1) c.set(0xeef2f5);                                                        // 雪线
    else if (y > 2.9) c.set(0x8d8579);                                                        // 山地岩石
    else if (x < 13.8) c.set(0x979068);                                                       // 山麓
    else if (y < 2.32 && x > 15.5) c.set(0x88a06c);                                           // 内陆湖盆
    else c.set(0xa9af6d);                                                                     // 内陆高原
    c.offsetHSL(0, 0, (Math.random() - 0.5) * 0.035);
    colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  terrainMat = new THREE.MeshStandardMaterial({
    vertexColors: true, roughness: 0.92, metalness: 0,
    normalMap, normalScale: new THREE.Vector2(0.5, 0.5),
  });
  const mesh = new THREE.Mesh(geo, terrainMat);
  scene.add(mesh);
  return mesh;
}

/* ---------------- 水体 ---------------- */

const WATER_BLUE = 0x2f7bb5;
function makeWaterPlane(w, d, y, opacity = 0.72, segs = [8, 4]) {
  const g = new THREE.PlaneGeometry(w, d, segs[0], segs[1]);
  g.rotateX(-Math.PI / 2);
  const m = new THREE.MeshPhysicalMaterial({
    color: WATER_BLUE, transparent: true, opacity,
    roughness: 0.14, metalness: 0.05, clearcoat: 0.8, clearcoatRoughness: 0.18,
    envMapIntensity: 1.1,
  });
  const mesh = new THREE.Mesh(g, m);
  mesh.position.y = y;
  scene.add(mesh);
  return mesh;
}
const ocean = makeWaterPlane(17, Z1 - Z0, 0.02, 0.8, [24, 8]);
ocean.position.x = -15.45;
const oceanBase = ocean.geometry.attributes.position.clone();
const reservoir = makeWaterPlane(1.7, 4.6, 1.38, 0.75);
reservoir.position.x = 4.3;
const inlandLake = makeWaterPlane(3.4, 3.9, 2.34, 0.75);
inlandLake.position.x = 17.7;
const river = makeWaterPlane(9.6, 1.25, 0.24, 0.7, [30, 3]);
river.position.set(-2.7, 0.24, 0);

/* ---------------- 城市 ---------------- */

const cityG = new THREE.Group();
scene.add(cityG);
const buildings = [];
const spongeParts = [];
function makeBuilding(x, z, w, d, h) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({ color: 0xd8d3c8, roughness: 0.85 })
  );
  mesh.position.set(x, terrainH(x, z) + h / 2 - 0.03, z);
  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(w + 0.08, 0.07, d + 0.08),
    new THREE.MeshStandardMaterial({ color: 0x8f8f92, roughness: 0.9 })
  );
  roof.position.set(x, terrainH(x, z) + h, z);
  cityG.add(mesh, roof);
  buildings.push(roof);
}
[[1.9, 2.1, 0.85, 0.8, 0.85], [0.4, 2.3, 0.7, 0.7, 1.25], [-1.2, 2.0, 0.75, 0.9, 0.7],
 [1.7, 3.7, 0.8, 0.7, 0.6], [0.2, 3.9, 0.65, 0.75, 1.0], [-1.4, 3.7, 0.9, 0.7, 0.8],
 [-2.6, 2.2, 0.7, 0.8, 1.1], [-4.2, 2.4, 0.8, 0.8, 0.75], [-3.0, 3.8, 0.7, 0.7, 0.9],
 [-4.4, 3.7, 0.8, 0.65, 0.65],
].forEach(([x, z, w, d, h]) => makeBuilding(x, z, w, d, h));

const roadMat = new THREE.MeshStandardMaterial({ color: 0x5a5d63, roughness: 0.95 });
const spongeRoadMat = new THREE.MeshStandardMaterial({ color: 0x9c8f7a, roughness: 1 });
const road1 = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.05, 0.55), roadMat);
road1.position.set(-1.4, terrainH(-1.4, 0) + 0.06, 3.05);
const road2 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 4.4), roadMat);
road2.position.set(1.2, terrainH(1.2, 0) + 0.06, 2.2);
cityG.add(road1, road2);

// 海绵城市元素（默认隐藏）
const gardenMat = new THREE.MeshStandardMaterial({ color: 0x4f9d4a, roughness: 0.9 });
[[1.0, 2.95], [-1.8, 2.9], [2.0, 3.3]].forEach(([x, z]) => {
  const g = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.55, 0.1, 20), gardenMat);
  g.position.set(x, terrainH(x, z) + 0.09, z);
  g.visible = false;
  spongeParts.push(g);
  cityG.add(g);
});

/* ---------------- 粒子系统 ---------------- */

let _softDot = null;
function softDot() {
  if (_softDot) return _softDot;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.5, 'rgba(255,255,255,0.55)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  _softDot = new THREE.CanvasTexture(c);
  return _softDot;
}

function pathPoint(pts, t) {
  const segs = pts.length - 1;
  const f = clamp(t, 0, 0.99999) * segs;
  const i = Math.floor(f);
  return pts[i].clone().lerp(pts[i + 1], f - i);
}

const rnd = (a, b) => a + Math.random() * (b - a);

class Stream {
  constructor({ count, color, size = 2.6, opacity = 0.85, spawn, velocity, life, path = null, speed = 1, yFromTerrain = false }) {
    this.maxCount = count;
    this.factor = 1;
    this.opacity = opacity;
    this.spawn = spawn;
    this.velocity = velocity;
    this.life = life;
    this.path = path;
    this.speed = speed;
    this.yFromTerrain = yFromTerrain;
    this.geo = new THREE.BufferGeometry();
    this.geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    this.vel = new Float32Array(count * 3);
    this.age = new Float32Array(count);
    this.lifeArr = new Float32Array(count);
    this.tProg = new Float32Array(count);
    this.pathSpeed = new Float32Array(count);
    this.mat = new THREE.PointsMaterial({
      color, size, transparent: true, opacity,
      map: softDot(), depthWrite: false, sizeAttenuation: true,
    });
    this.points = new THREE.Points(this.geo, this.mat);
    this.points.frustumCulled = false;
    scene.add(this.points);
    for (let i = 0; i < count; i++) this.reset(i, true);
  }

  reset(i, scatter = false) {
    const p = this.spawn();
    const v = this.velocity();
    this.vel[i * 3] = v.x; this.vel[i * 3 + 1] = v.y; this.vel[i * 3 + 2] = v.z;
    const total = this.life * (0.6 + Math.random() * 0.8);
    this.lifeArr[i] = total;
    this.age[i] = scatter ? Math.random() * total : 0;
    this.tProg[i] = scatter ? Math.random() : 0;
    this.pathSpeed[i] = this.speed * (0.75 + Math.random() * 0.5);
    const posAttr = this.geo.attributes.position;
    if (this.path) {
      const pt = pathPoint(this.path, this.tProg[i]);
      const y = this.yFromTerrain ? terrainH(pt.x, pt.z) + 0.07 : pt.y;
      posAttr.setXYZ(i, pt.x, y, pt.z);
    } else {
      posAttr.setXYZ(i, p.x, p.y, p.z);
    }
  }

  update(dt) {
    const posAttr = this.geo.attributes.position;
    const alive = Math.max(0, Math.round(this.maxCount * this.factor));
    const v = new THREE.Vector3();
    for (let i = 0; i < this.maxCount; i++) {
      if (i >= alive) { posAttr.setXYZ(i, 0, -999, 0); continue; }
      this.age[i] += dt;
      if (this.age[i] >= this.lifeArr[i]) { this.reset(i); continue; }
      if (this.path) {
        this.tProg[i] += dt * this.pathSpeed[i];
        if (this.tProg[i] >= 1) { this.reset(i); continue; }
        const pt = pathPoint(this.path, this.tProg[i]);
        const y = this.yFromTerrain ? terrainH(pt.x, pt.z) + 0.07 : pt.y;
        posAttr.setXYZ(i, pt.x, y, pt.z);
      } else {
        let x = posAttr.getX(i) + this.vel[i * 3] * dt;
        let y = posAttr.getY(i) + this.vel[i * 3 + 1] * dt;
        const z = posAttr.getZ(i) + this.vel[i * 3 + 2] * dt;
        if (this.wiggle) {
          y += Math.sin(this.age[i] * 4 + i) * 0.12 * dt;
          x += Math.cos(this.age[i] * 3 + i) * 0.05 * dt;
        }
        if (this.dieBelow !== undefined && y < this.dieBelow) { this.reset(i); continue; }
        if (this.dieBelowX !== undefined && x < this.dieBelowX) { this.reset(i); continue; }
        if (this.dieOnTerrain && y <= terrainH(x, z) + 0.06) { this.reset(i); continue; }
        posAttr.setXYZ(i, x, y, z);
      }
    }
    posAttr.needsUpdate = true;
  }

  setDim(dim) {
    this.mat.opacity = dim ? 0.06 : this.opacity;
  }
}

const S = {};
let allStreams = [];

function buildStreams() {
  S.evapOcean = new Stream({
    count: 160, color: 0xbfe3ff, size: 2.4, opacity: 0.75, life: 4.2,
    spawn: () => ({ x: rnd(-15.5, -9.5), y: 0.06, z: rnd(-5.5, 5.5) }),
    velocity: () => new THREE.Vector3(rnd(0.3, 0.55), rnd(0.85, 1.25), rnd(-0.08, 0.08)),
  });
  S.evapOcean.wiggle = true;
  S.evapLake = new Stream({
    count: 60, color: 0xbfe3ff, size: 2.2, opacity: 0.7, life: 3.6,
    spawn: () => ({ x: rnd(16.4, 19.2), y: 2.42, z: rnd(-1.8, 1.8) }),
    velocity: () => new THREE.Vector3(rnd(-0.1, 0.2), rnd(0.8, 1.15), rnd(-0.08, 0.08)),
  });
  S.evapLake.wiggle = true;

  S.cloudCity = new Stream({
    count: 26, color: 0xffffff, size: 6.5, opacity: 0.85, life: 16,
    spawn: () => ({ x: rnd(-4.5, 1.5), y: rnd(5.4, 6.2), z: rnd(-2.6, 3.6) }),
    velocity: () => new THREE.Vector3(0.06, 0, rnd(-0.01, 0.01)),
  });
  S.cloudMountain = new Stream({
    count: 30, color: 0xf4f8fc, size: 7.5, opacity: 0.85, life: 18,
    spawn: () => ({ x: rnd(6.8, 12.2), y: rnd(6.6, 7.8), z: rnd(-3, 3) }),
    velocity: () => new THREE.Vector3(0.05, 0, 0),
  });
  S.cloudSea = new Stream({
    count: 16, color: 0xffffff, size: 6, opacity: 0.8, life: 14,
    spawn: () => ({ x: rnd(-13.5, -10.5), y: rnd(4.8, 5.6), z: rnd(-2.5, 2.5) }),
    velocity: () => new THREE.Vector3(0.04, 0, 0),
  });
  S.cloudLake = new Stream({
    count: 12, color: 0xf6f9fd, size: 5.5, opacity: 0.8, life: 14,
    spawn: () => ({ x: rnd(15.8, 19.6), y: rnd(5.6, 6.4), z: rnd(-2, 2) }),
    velocity: () => new THREE.Vector3(0.03, 0, 0),
  });

  S.rainCity = new Stream({
    count: 170, color: 0x9fd0f2, size: 2.2, opacity: 0.8, life: 1.5,
    spawn: () => ({ x: rnd(-4.2, 1.4), y: rnd(5.0, 5.6), z: rnd(-2.4, 3.4) }),
    velocity: () => new THREE.Vector3(0, -4.6, 0),
  });
  S.rainCity.dieBelow = 0.62;
  S.rainMountain = new Stream({
    count: 200, color: 0xa8d4f5, size: 2.2, opacity: 0.8, life: 1.6,
    spawn: () => ({ x: rnd(6.8, 12.4), y: rnd(6.2, 7.4), z: rnd(-3.2, 3.2) }),
    velocity: () => new THREE.Vector3(0, -5, 0),
  });
  S.rainMountain.dieOnTerrain = true;
  S.rainSea = new Stream({
    count: 120, color: 0x9fd0f2, size: 2.2, opacity: 0.8, life: 1.4,
    spawn: () => ({ x: rnd(-13.2, -10.6), y: rnd(4.4, 5.2), z: rnd(-2.4, 2.4) }),
    velocity: () => new THREE.Vector3(0, -4.2, 0),
  });
  S.rainSea.dieBelow = 0.04;
  S.rainLake = new Stream({
    count: 70, color: 0xa8d4f5, size: 2.2, opacity: 0.8, life: 1.5,
    spawn: () => ({ x: rnd(16, 19.4), y: rnd(5.2, 6), z: rnd(-1.8, 1.8) }),
    velocity: () => new THREE.Vector3(0, -4.4, 0),
  });
  S.rainLake.dieBelow = 2.42;

  const pathMountainA = [
    new THREE.Vector3(8.6, 0, 2.6), new THREE.Vector3(7.6, 0, 1.6), new THREE.Vector3(6.8, 0, 0.8),
    new THREE.Vector3(5.6, 0, 0.35), new THREE.Vector3(4.0, 0, 0.25), new THREE.Vector3(2.0, 0, 0.15),
    new THREE.Vector3(-0.5, 0, 0.1), new THREE.Vector3(-3.5, 0, 0.05), new THREE.Vector3(-6.2, 0, 0),
    new THREE.Vector3(-8.5, 0, -0.2),
  ];
  const pathMountainB = [
    new THREE.Vector3(11.8, 0, -2.4), new THREE.Vector3(10.6, 0, -1.5), new THREE.Vector3(9.4, 0, -0.8),
    new THREE.Vector3(8.2, 0, -0.3), new THREE.Vector3(6.6, 0, 0), new THREE.Vector3(4.6, 0, 0.2),
    new THREE.Vector3(2.2, 0, 0.15), new THREE.Vector3(-0.6, 0, 0.1), new THREE.Vector3(-3.6, 0, 0.05),
    new THREE.Vector3(-6.4, 0, 0), new THREE.Vector3(-8.6, 0, -0.25),
  ];
  const pathCity = [
    new THREE.Vector3(2.2, 0, 1.9), new THREE.Vector3(1.2, 0, 1.35), new THREE.Vector3(0.2, 0, 0.9),
    new THREE.Vector3(-1.2, 0, 0.5), new THREE.Vector3(-3.2, 0, 0.3), new THREE.Vector3(-6, 0, 0.05),
    new THREE.Vector3(-8.4, 0, -0.2),
  ];
  S.runoffMountain = new Stream({
    count: 130, color: 0x5fb0e8, size: 2.8, opacity: 0.9, life: 14,
    path: pathMountainA, speed: 0.085, yFromTerrain: true,
    spawn: () => new THREE.Vector3(), velocity: () => new THREE.Vector3(),
  });
  S.runoffMountain2 = new Stream({
    count: 110, color: 0x5fb0e8, size: 2.8, opacity: 0.9, life: 15,
    path: pathMountainB, speed: 0.08, yFromTerrain: true,
    spawn: () => new THREE.Vector3(), velocity: () => new THREE.Vector3(),
  });
  S.runoffCity = new Stream({
    count: 70, color: 0x6cb8ee, size: 2.8, opacity: 0.9, life: 10,
    path: pathCity, speed: 0.1, yFromTerrain: true,
    spawn: () => new THREE.Vector3(), velocity: () => new THREE.Vector3(),
  });

  S.infiltration = new Stream({
    count: 90, color: 0x7fd0a8, size: 2.4, opacity: 0.75, life: 2.2,
    spawn: () => ({ x: rnd(-5, 2.2), y: 0.52, z: rnd(-4.6, 4.6) }),
    velocity: () => new THREE.Vector3(0, -0.55, 0),
  });
  S.infiltration.dieBelow = -0.85;
  S.underground = new Stream({
    count: 90, color: 0x4aa8d8, size: 2.6, opacity: 0.7, life: 11,
    spawn: () => ({ x: rnd(-1.5, 2.2), y: rnd(-1.0, -0.5), z: rnd(-2.5, 2.5) }),
    velocity: () => new THREE.Vector3(-0.55, 0.02, 0),
  });
  S.underground.dieBelowX = -8.2;

  allStreams = Object.values(S);
}

/* ---------------- 环节标签 ---------------- */

const LABELS = {};
function buildLabels() {
  const mk = (text, x, y, z, color = '#eaf6ff') => {
    const s = makeTextSprite(text, { fontSize: 30, color, scale: 0.016, bg: 'rgba(15,30,45,0.55)' });
    s.position.set(x, y, z);
    scene.add(s);
    return s;
  };
  LABELS.evap = mk('蒸发', -12.5, 2.2, 0);
  LABELS.transport = mk('水汽输送', -1.6, 7.4, 0);
  LABELS.rain = mk('降水', -1.5, 4.7, 0);
  LABELS.runoff = mk('地表径流', -3.4, 1.15, 0);
  LABELS.infil = mk('下渗', -2.2, 0.3, 6.6);
  LABELS.underground = mk('地下径流', -4.5, -0.5, 6.6);
}

/* ---------------- 状态与模式 ---------------- */

const state = {
  sponge: false,
  cycleMode: 'all',
  processMode: 'all',
  statsCard: null,
};

const PROCESS_STREAMS = {
  evap: () => [S.evapOcean, S.evapLake],
  transport: () => [S.cloudCity, S.cloudMountain, S.cloudSea, S.cloudLake],
  rain: () => [S.rainCity, S.rainMountain, S.rainSea, S.rainLake],
  runoff: () => [S.runoffMountain, S.runoffMountain2, S.runoffCity],
  infil: () => [S.infiltration],
  underground: () => [S.underground],
};

function dimAllExcept(activeKeys) {
  allStreams.forEach((s) => s.setDim(false));
  if (!activeKeys) return;
  const active = new Set();
  activeKeys.forEach((k) => PROCESS_STREAMS[k]().forEach((s) => active.add(s)));
  allStreams.forEach((s) => { if (!active.has(s)) s.setDim(true); });
}

function applyProcessMode() {
  const m = state.processMode;
  if (m === 'all') dimAllExcept(null);
  else dimAllExcept([m]);
  Object.keys(LABELS).forEach((k) => { LABELS[k].visible = m === 'all' ? true : k === m; });
}

function applyCycleMode() {
  const m = state.cycleMode;
  fluxG.visible = false;
  Object.keys(LABELS).forEach((k) => { LABELS[k].visible = true; });
  dimAllExcept(null);
  if (m === 'landsea') {
    [S.cloudSea, S.cloudLake, S.rainSea, S.rainLake, S.evapLake].forEach((s) => s.setDim(true));
  } else if (m === 'sea') {
    [S.cloudCity, S.cloudMountain, S.cloudLake, S.rainCity, S.rainMountain, S.rainLake, S.evapLake].forEach((s) => s.setDim(true));
  } else if (m === 'land') {
    [S.evapOcean, S.cloudSea, S.cloudCity, S.cloudMountain, S.rainSea, S.rainCity, S.rainMountain].forEach((s) => s.setDim(true));
  }
}

/* ---------------- 海绵城市 ---------------- */

function setSponge(on) {
  state.sponge = on;
  buildings.forEach((roof) => roof.material.color.set(on ? 0x4f9d4a : 0x8f8f92));
  spongeParts.forEach((p) => { p.visible = on; });
  road1.material = road2.material = on ? spongeRoadMat : roadMat;
  S.runoffCity.factor = on ? 0.25 : 1;
  S.infiltration.factor = on ? 1.7 : 0.5;
  if (state.statsCard) updateStatsCard();
}

function makeStatsCard() {
  const card = document.createElement('div');
  card.className = 'hud-card';
  card.style.cssText = 'position:absolute;top:14px;right:14px;width:232px;z-index:10;';
  card.innerHTML = `
    <div style="margin-bottom:4px"><b id="wc-scenario">普通城市</b>（年降水量 630 mm）</div>
    <div class="bar-row"><span class="bar-label">径流</span><div class="bar-track"><div class="bar-fill" id="wc-bar-runoff" style="background:#e2934a"></div></div><span class="bar-val" id="wc-val-runoff">–</span></div>
    <div class="bar-row"><span class="bar-label">下渗</span><div class="bar-track"><div class="bar-fill" id="wc-bar-infil" style="background:#4f9d8a"></div></div><span class="bar-val" id="wc-val-infil">–</span></div>
    <div class="bar-row"><span class="bar-label">蒸散</span><div class="bar-track"><div class="bar-fill" id="wc-bar-et" style="background:#7aa6d9"></div></div><span class="bar-val" id="wc-val-et">–</span></div>`;
  stage.appendChild(card);
  state.statsCard = card;
  updateStatsCard();
}
function updateStatsCard() {
  const q = (s) => document.getElementById(s);
  if (!q('wc-bar-runoff')) return;
  const [r, i, e] = state.sponge ? [30, 45, 25] : [65, 15, 20];
  q('wc-scenario').textContent = state.sponge ? '海绵城市' : '普通城市';
  q('wc-bar-runoff').style.width = r + '%'; q('wc-val-runoff').textContent = r + '%';
  q('wc-bar-infil').style.width = i + '%'; q('wc-val-infil').textContent = i + '%';
  q('wc-bar-et').style.width = e + '%'; q('wc-val-et').textContent = e + '%';
}

/* ---------------- 水量平衡箭头 ---------------- */

const fluxG = new THREE.Group();
scene.add(fluxG);
const FLUXES = [
  { key: 'evapOcean', label: '海洋蒸发 E=505', at: [-13, 0.1, -3], v: 505, color: 0xcfe9ff, rot: 'up' },
  { key: 'precOcean', label: '海洋降水 P=458', at: [-10.5, 4.4, 3.4], v: 458, color: 0x9fd0f2, rot: 'down' },
  { key: 'precLand', label: '陆地降水 P=119', at: [-0.8, 4.6, -3.6], v: 119, color: 0x9fd0f2, rot: 'down' },
  { key: 'evapLand', label: '陆地蒸发 E=73', at: [3.4, 1.2, -4.6], v: 73, color: 0xd8ecd2, rot: 'up' },
  { key: 'runoffSea', label: '径流入海 R=46', at: [-4.2, 0.85, 2.4], v: 46, color: 0x5fb0e8, rot: 'left' },
];
const fluxMeshes = {};
function buildFluxArrows() {
  for (const f of FLUXES) {
    const g = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({
      color: f.color, transparent: true, opacity: 0.72, roughness: 0.5,
      emissive: f.color, emissiveIntensity: 0.15,
    });
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 2, 14), mat);
    shaft.position.y = 1.0;
    const head = new THREE.Mesh(new THREE.ConeGeometry(2.1, 1.2, 14), mat);
    head.position.y = 2.6;
    g.add(shaft, head);
    if (f.rot === 'down') g.rotation.x = Math.PI;
    else if (f.rot === 'left') g.rotation.z = Math.PI / 2;
    g.position.set(...f.at);
    const lbl = makeTextSprite(f.label, { fontSize: 26, color: '#ffffff', scale: 0.012, bg: 'rgba(15,30,45,0.55)' });
    lbl.position.set(0, 3.6, 0);
    g.add(lbl);
    fluxG.add(g);
    fluxMeshes[f.key] = { g, lbl, label: f.label, v: f.v };
  }
  updateFlux(1);
}
function updateFlux(k) {
  for (const f of FLUXES) {
    const m = fluxMeshes[f.key];
    const v = f.v * k;
    const r = Math.max(0.14, Math.sqrt(v / 505) * 0.52);
    m.g.children[0].scale.set(r, 1, r);
    m.g.children[1].scale.set(r, 1, r);
    setSpriteText(m.lbl, m.label.replace(/=\d+/, '=' + Math.round(v)), { fontSize: 26, color: '#ffffff', scale: 0.012, bg: 'rgba(15,30,45,0.55)' });
  }
}

/* ---------------- 控制条与章节 ---------------- */

const ctl = createControlsPanel(document.getElementById('controls'));

function hideCards() {
  if (state.statsCard) state.statsCard.style.display = 'none';
}

function setProcessControls() {
  ctl.clear();
  const items = [['all', '全部'], ['evap', '蒸发'], ['transport', '水汽输送'], ['rain', '降水'], ['runoff', '地表径流'], ['infil', '下渗'], ['underground', '地下径流']];
  const btns = [];
  const paint = () => btns.forEach(({ b, v }) => b.classList.toggle('active', v === state.processMode));
  items.forEach(([v, label]) => {
    const b = ctl.button({
      label,
      onClick: () => { state.processMode = v; applyProcessMode(); paint(); },
    });
    btns.push({ b, v });
  });
  paint();
}

function setTypeControls() {
  ctl.clear();
  const items = [['landsea', '海陆间循环'], ['land', '陆地内循环'], ['sea', '海上内循环'], ['all', '全部']];
  const btns = [];
  const paint = () => btns.forEach(({ b, v }) => b.classList.toggle('active', v === state.cycleMode));
  items.forEach(([v, label]) => {
    const b = ctl.button({
      label,
      onClick: () => { state.cycleMode = v; applyCycleMode(); paint(); },
    });
    btns.push({ b, v });
  });
  paint();
}

const SECTIONS = [
  {
    id: 'process',
    title: '水循环环节',
    html: `<p>水在地球上不断循环运动：<b>蒸发</b>、<b>水汽输送</b>、<b>降水</b>、<b>地表径流</b>、<b>下渗</b>、<b>地下径流</b>等环节把海洋与陆地联系起来。</p>
<p>在沙盘上看：蓝色粒子从海面升起（蒸发），白云向东输送水汽，在山地和城市上空成云致雨（降水），雨水沿坡面汇入河流奔向海洋（地表径流），一部分渗入土壤（下渗）并在地下缓慢流向海洋（地下径流）。</p>
<p>点下方按钮单独高亮一个环节，或选「全部」看完整循环。驱动水循环的能量来自<b>太阳辐射</b>和重力。</p>`,
    enter() {
      state.processMode = 'all';
      state.cycleMode = 'all';
      applyCycleMode();
      setProcessControls();
      hideCards();
      app.setCamera([1, 17, 37], [1, 0.5, 0]);
    },
  },
  {
    id: 'types',
    title: '三类水循环',
    html: `<p>按发生的空间范围，水循环分为三类：</p>
<p>① <b>海陆间循环</b>（大循环）：海洋蒸发 → 水汽输送到陆地上空 → 降水 → 径流回海，陆地水因此不断得到补充更新，与人类关系最密切；② <b>陆地内循环</b>：陆地水蒸发后在陆地上空降水（如内陆湖周边）；③ <b>海上内循环</b>：海洋蒸发后直接在海洋上空降水，参与水量最大。</p>
<p>点击按钮切换，被点亮的粒子就是该循环的参与环节。</p>`,
    enter() {
      state.cycleMode = 'landsea';
      state.processMode = 'all';
      applyCycleMode();
      setTypeControls();
      hideCards();
      app.setCamera([1, 17, 37], [1, 0.5, 0]);
    },
  },
  {
    id: 'sponge',
    title: '城市化与海绵城市',
    html: `<p>城市化使地面硬化：<b>下渗减少、地表径流增多</b>，雨季容易内涝；植被减少又让蒸腾减弱。</p>
<p><b>海绵城市</b>让城市像海绵一样：透水铺装、下凹绿地、雨水花园、绿色屋顶，让雨水「渗、滞、蓄、净、用、排」——下渗大幅增加、径流明显减少。</p>
<p>点击「切换」按钮对比城市外观（绿屋顶、雨水花园、透水路面）与右侧<b>径流/下渗比例条</b>的变化。</p>`,
    enter() {
      state.processMode = 'all';
      state.cycleMode = 'all';
      applyCycleMode();
      ctl.clear();
      ctl.button({
        label: state.sponge ? '当前：海绵城市（点此切回普通）' : '当前：普通城市（点此切换海绵）',
        onClick(btn) {
          setSponge(!state.sponge);
          btn.textContent = state.sponge ? '当前：海绵城市（点此切回普通）' : '当前：普通城市（点此切换海绵）';
        },
      });
      ctl.sep();
      ctl.toggle({
        label: '降雨', value: true,
        onChange: (v) => {
          S.rainCity.factor = v ? 1 : 0.03;
          S.rainMountain.factor = v ? 1 : 0.03;
        },
      });
      if (!state.statsCard) makeStatsCard();
      state.statsCard.style.display = '';
      app.setCamera([-4, 8, 16], [-1, 0.8, 0]);
    },
  },
  {
    id: 'balance',
    title: '水量平衡',
    html: `<p>从多年平均看，水循环遵循<b>水量平衡</b>：某区域降水量 = 蒸发量 + 径流量（的变化）。</p>
<p>全球尺度（单位：万 km³/年）：海洋降水 458 + 径流入海 46 = 海洋蒸发 505；陆地降水 119 = 陆地蒸发 73 + 径流 46。<b>海洋是水循环的源头与归宿</b>。</p>
<p>三维箭头的粗细表示通量大小。拖动「降水量变化」滑杆，看各通量如何联动——过度用水、砍伐森林都会打破局地水量平衡。</p>`,
    enter() {
      state.processMode = 'all';
      state.cycleMode = 'all';
      dimAllExcept(null);
      fluxG.visible = true;
      Object.values(S).forEach((s) => s.setDim(true));
      ctl.clear();
      ctl.slider({
        label: '降水量变化', min: -30, max: 30, step: 1, value: 0,
        fmt: (v) => (v > 0 ? '+' : '') + v + '%',
        onInput: (v) => updateFlux(1 + v / 100),
      });
      hideCards();
      app.setCamera([1, 18, 40], [1, 1.5, 0]);
    },
  },
];

/* ---------------- 帧循环 ---------------- */

app.onFrame((dt) => {
  cameraTweenTick(app, dt);
  const t = performance.now() * 0.001;
  const pos = ocean.geometry.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const bx = oceanBase.getX(i), bz = oceanBase.getZ(i);
    pos.setY(i, Math.sin(bx * 0.5 + t * 1.2) * 0.05 + Math.cos(bz * 0.8 + t * 0.9) * 0.04);
  }
  pos.needsUpdate = true;
  allStreams.forEach((s) => s.update(dt));
});

/* ---------------- 启动 ---------------- */

loadAll([
  { key: 'sky', label: '天空', job: loadTexture(TEXDIR_SKY) },
  { key: 'ground', label: '地表细节', job: loadTexture(TEXDIR_PBR_GROUND, { colorSpace: null, wrap: true, repeat: [22, 6] }) },
], (d, t, label) => loader.setText(`正在加载 ${d}/${t}（${label}）`)).then((t) => {
  t.sky.mapping = THREE.EquirectangularReflectionMapping;
  scene.background = t.sky;
  scene.environment = t.sky;

  buildTerrain(t.ground);
  buildStreams();
  buildLabels();
  buildFluxArrows();

  loader.hide();
  const sections = createSections({
    nav: document.getElementById('sideNav'),
    descPanel: document.getElementById('descPanel'),
    sections: SECTIONS,
    onSelect(i, sec) { sec.enter(); },
  });
  window.__eduSections = sections;
  sections.select(0);
}).catch((err) => {
  loader.setText('资源加载失败：' + err.message);
  console.error(err);
});
