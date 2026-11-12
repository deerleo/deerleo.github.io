/* EduLab · 大气运动粒子课堂（atmos）
 * 章节：大气运动总览 / 热力环流原理 / 城市热岛环流 / 海陆风 / 山谷风 /
 *       单圈环流 / 三圈环流 / 气压带与风带 / 季节移动 / 海陆分布与季风 / 随堂检测
 * 场景：竖直截面粒子对流实验箱 + 三维地球（气压带/风带/季节移动/季风）
 */
import {
  THREE, DEG, TAU, clamp, loadTexture, loadHDR, loadAll, createApp,
  makeLoader, createControlsPanel, makeHUD, makeTextSprite, setSpriteText,
  circleLine, makeStars, makeGlowTexture,
} from './edu-core.js';
import {
  PAL, matStd, matCoat, matGlow, matGlass, makeWoodTexture, makeLabelTexture, fbm3, attachVFX,
} from './edu-vfx.js';

const TEXDIR = '../assets/textures/';
const CW = 10, CH = 4.4;            // 截面实验箱宽高

/* ---------------- 场景 ---------------- */

const stage = document.getElementById('stage');
const loader = makeLoader(stage, '正在准备大气环流实验…');

const app = createApp({
  container: stage, fov: 44, near: 0.1, far: 600,
  cameraPos: [0, 2.3, 11.5], target: [0, 2.1, 0],
  minDistance: 2, maxDistance: 30, exposure: 1.02,
  keepBackground: true,
});
const { scene, camera, controls } = app;
/* 视觉工艺接入：后处理管线接管渲染与相机缓动（setCamera 升级为 cubic 运镜） */
const vfx = attachVFX(app, 'illus');

scene.add(new THREE.AmbientLight(0x99a8cc, 1.15));
const sunLight = new THREE.DirectionalLight(0xfff0d8, 1.8);
sunLight.position.set(5, 8, 6);
scene.add(sunLight);

const crossG = new THREE.Group();
const globeG = new THREE.Group();
globeG.visible = false;
scene.add(crossG, globeG);

/* ---------------- 截面实验箱 ---------------- */

const groundCanvas = document.createElement('canvas');
groundCanvas.width = 1024; groundCanvas.height = 128;
const groundTex = new THREE.CanvasTexture(groundCanvas);
groundTex.colorSpace = THREE.SRGBColorSpace;
const groundMesh = new THREE.Mesh(
  new THREE.PlaneGeometry(CW + 0.02, 1.15),
  new THREE.MeshBasicMaterial({ map: groundTex })
);
groundMesh.position.y = -0.58;
crossG.add(groundMesh);

// 地面起伏剖面（山谷模式）：返回地形高度，用于画布与风场
function valleyProfile(x) {
  return 0.55 * Math.exp(-Math.pow((x - 0.8) / 1.5, 2)) + 0.5 * Math.exp(-Math.pow((x - 9.2) / 1.5, 2)) + 0.08;
}

const boxHelper = new THREE.LineSegments(
  new THREE.EdgesGeometry(new THREE.BoxGeometry(CW, CH, 0.9)),
  new THREE.LineBasicMaterial({ color: 0x8fa0b8, transparent: true, opacity: 0.5 })
);
boxHelper.position.y = CH / 2;
crossG.add(boxHelper);

const skySprite = makeTextSprite('☀', { fontSize: 64, color: '#ffcf5a', scale: 0.02 });
skySprite.position.set(-4.2, 3.7, 0.5);
crossG.add(skySprite);

const crossLabels = [];
function addCrossLabel(text, x, y, color, size = 26) {
  const sp = makeTextSprite(text, { fontSize: size, color: color || '#dfe8ff', scale: 0.0042 });
  sp.position.set(x, y, 0.5);
  crossG.add(sp);
  crossLabels.push(sp);
  return sp;
}
function clearCrossLabels() {
  crossLabels.forEach((s) => { s.visible = false; });
}

/* ---------------- 粒子系统（截面） ---------------- */

const CROSS_N = 1300;
const crossSim = new Float32Array(CROSS_N * 2);   // x∈[0,10] y∈[0,4.4]
const crossZ = new Float32Array(CROSS_N);
const crossPos = new Float32Array(CROSS_N * 3);
const crossCol = new Float32Array(CROSS_N * 3);
for (let i = 0; i < CROSS_N; i++) {
  crossSim[i * 2] = Math.random() * CW;
  crossSim[i * 2 + 1] = Math.random() * CH;
  crossZ[i] = (Math.random() - 0.5) * 0.7;
}
const crossGeo = new THREE.BufferGeometry();
crossGeo.setAttribute('position', new THREE.BufferAttribute(crossPos, 3));
crossGeo.setAttribute('color', new THREE.BufferAttribute(crossCol, 3));
const crossPts = new THREE.Points(crossGeo, new THREE.PointsMaterial({
  size: 0.06, vertexColors: true, transparent: true, opacity: 0.92, depthWrite: false,
}));
crossPts.frustumCulled = false;
crossG.add(crossPts);

/* ---------------- 粒子系统（地球表面） ---------------- */

const GLOBE_N = 1500;
const globeLat = new Float32Array(GLOBE_N);
const globeLon = new Float32Array(GLOBE_N);
const globePos = new Float32Array(GLOBE_N * 3);
const globeCol = new Float32Array(GLOBE_N * 3);
for (let i = 0; i < GLOBE_N; i++) {
  globeLat[i] = (Math.random() * 2 - 1) * 84;
  globeLon[i] = Math.random() * 360;
}
const globeGeo = new THREE.BufferGeometry();
globeGeo.setAttribute('position', new THREE.BufferAttribute(globePos, 3));
globeGeo.setAttribute('color', new THREE.BufferAttribute(globeCol, 3));
const globePts = new THREE.Points(globeGeo, new THREE.PointsMaterial({
  size: 0.028, vertexColors: true, transparent: true, opacity: 0.95, depthWrite: false,
}));
globePts.frustumCulled = false;
globeG.add(globePts);

function latLonPos(lat, lon, r, out) {
  const la = lat * DEG, lo = lon * DEG;
  out[0] = Math.cos(la) * Math.cos(lo) * r;
  out[1] = Math.sin(la) * r;
  out[2] = -Math.cos(la) * Math.sin(lo) * r;
  return out;
}

/* ---------------- 地球与气压带 ---------------- */

const GR = 1.6;
let earthMesh = null;
const beltG = new THREE.Group();      // 气压带（可整体随季节平移纬度）
globeG.add(beltG);
const BELTS = [
  { lat: 0, name: '赤道低气压带', low: true, half: 4 },
  { lat: 30, name: '副热带高气压带', low: false, half: 4 },
  { lat: 60, name: '副极地低气压带', low: true, half: 4 },
  { lat: 88, name: '极地高气压带', low: false, half: 5 },
  { lat: -30, name: '', low: false, half: 4 },
  { lat: -60, name: '', low: true, half: 4 },
  { lat: -88, name: '', low: false, half: 5 },
];
const beltMeshes = [];
for (const b of BELTS) {
  const m = new THREE.Mesh(
    new THREE.SphereGeometry(GR * 1.012, 64, 8, 0, TAU,
      (90 - b.lat - b.half) * DEG, b.half * 2 * DEG),
    new THREE.MeshBasicMaterial({
      color: b.low ? 0x4a9fe8 : 0xf0a24a, transparent: true, opacity: 0.42,
      depthWrite: false, side: THREE.DoubleSide,
    })
  );
  beltG.add(m);
  beltMeshes.push(m);
}
const beltLabels = [];
for (const b of BELTS) {
  if (!b.name) continue;
  const sp = makeTextSprite(b.name, { fontSize: 26, color: b.low ? '#9fd0ff' : '#ffcf9a', scale: 0.0035 });
  const la = (b.lat - 12) * DEG;
  sp.position.set(0, Math.sin(la) * GR * 1.22, Math.cos(la) * GR * 1.1);
  beltG.add(sp);
  beltLabels.push(sp);
}
// 风带标注
const windLabels = [];
[['低纬信风带', 15], ['中纬西风带', 45], ['极地东风带', 75]].forEach(([name, lat]) => {
  for (const s of [1, -1]) {
    const sp = makeTextSprite(name, { fontSize: 20, color: '#c9d6ea', scale: 0.0026 });
    const la = (s * lat - 14) * DEG;
    sp.position.set(GR * 0.15, Math.sin(la) * GR * 1.18, Math.cos(la) * GR * 1.08);
    beltG.add(sp);
    windLabels.push(sp);
  }
});

// 参考纬线
const refLines = [];
for (const lat of [0, 23.5, -23.5, 30, -30, 60, -60]) {
  const r = Math.cos(lat * DEG) * GR;
  const line = circleLine(r, lat === 0 ? 0xffd166 : 0x7f8ca0, 128);
  line.position.y = Math.sin(lat * DEG) * GR;
  line.rotation.x = Math.PI / 2;    // 圆环平放在水平面
  line.material.transparent = true;
  line.material.opacity = lat === 0 ? 0.55 : 0.28;
  globeG.add(line);
  refLines.push(line);
}

const sunSprite = new THREE.Sprite(new THREE.SpriteMaterial({
  color: 0xffe9a8, transparent: true, opacity: 0.95, depthWrite: false,
}));
sunSprite.scale.set(1.2, 1.2, 1);
globeG.add(sunSprite);

/* 季风箭头（海陆分布与季风章） */
const monsoonG = new THREE.Group();
monsoonG.visible = false;
globeG.add(monsoonG);
const monsoonArrows = [];
for (let i = 0; i < 6; i++) {
  const a = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(), 0.5, 0xff8c42, 0.14, 0.08);
  monsoonArrows.push(a);
  monsoonG.add(a);
}
function layoutMonsoon(season) {
  // 东亚区域（lon 100~135, lat 20~45）：冬季大陆→海洋（西北风），夏季海洋→大陆（东南风）
  const ptsWinter = [[115, 42, 30, 30], [125, 38, 40, 26], [108, 34, 26, 34], [120, 28, 34, 20], [130, 46, 36, 38], [102, 24, 22, 26]];
  const ptsSummer = ptsWinter.map(([lo, la, lo2, la2]) => [lo2 + 8, la2 - 6, lo - 4, la + 4]);
  const P = season >= 0 ? ptsSummer : ptsWinter;
  monsoonArrows.forEach((a, i) => {
    const [lo1, la1, lo2, la2] = P[i];
    const p1 = latLonPos(la1, lo1, GR * 1.03, [0, 0, 0]);
    const p2 = latLonPos(la2, lo2, GR * 1.03, [0, 0, 0]);
    const dir = new THREE.Vector3(p2[0] - p1[0], p2[1] - p1[1], p2[2] - p1[2]).normalize();
    a.position.set(p1[0], p1[1], p1[2]);
    a.setDirection(dir);
    a.setLength(0.55, 0.16, 0.09);
    a.setColor(season >= 0 ? 0xff8c42 : 0x6fb6ff);
  });
}

/* ================= 场景工艺增补（台面叙事道具 / 城市海陆山谷情景模型 / 三圈环流放样 / 支架与接触阴影） ================= */

const BENCH_TOP_Y = -1.2;   // 台面高度（截面箱下方）
const DIOR_Z = 1.0;         // 前景情景道具带（箱体与相机之间）

/* 确定性伪随机：道具摆位每次刷新一致 */
function srnd(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/* ---- 接触阴影贴片：径向渐变黑斑 ---- */
let blobTexCache = null;
function shadowBlobTexture() {
  if (blobTexCache) return blobTexCache;
  const cv = document.createElement('canvas');
  cv.width = 128; cv.height = 128;
  const c = cv.getContext('2d');
  const g = c.createRadialGradient(64, 64, 6, 64, 64, 62);
  g.addColorStop(0, 'rgba(5,9,15,0.6)');
  g.addColorStop(0.55, 'rgba(5,9,15,0.28)');
  g.addColorStop(1, 'rgba(5,9,15,0)');
  c.fillStyle = g;
  c.fillRect(0, 0, 128, 128);
  blobTexCache = new THREE.CanvasTexture(cv);
  return blobTexCache;
}
function shadowPatch(w, d, opacity = 0.5) {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(w, d),
    new THREE.MeshBasicMaterial({ map: shadowBlobTexture(), transparent: true, opacity, depthWrite: false })
  );
  m.rotation.x = -Math.PI / 2;
  return m;
}

/* ---- 放样蒙皮：同点数截面环序列 → 蒙皮 + 两端扇形封口（小帆船船壳用） ---- */
function loftSkin(stations) {
  const rows = stations.length, cols = stations[0].length;
  const pos = [], idx = [];
  for (const st of stations) for (const p of st) pos.push(p.x, p.y, p.z);
  for (let r = 0; r < rows - 1; r++) {
    for (let c = 0; c < cols; c++) {
      const c2 = (c + 1) % cols;
      const a = r * cols + c, b = r * cols + c2;
      const d = (r + 1) * cols + c, e = (r + 1) * cols + c2;
      idx.push(a, d, b, b, d, e);
    }
  }
  /* 两端封口：质心扇面 */
  for (const [ri, flip] of [[0, true], [rows - 1, false]]) {
    const ring = stations[ri];
    const ctr = new THREE.Vector3();
    for (const p of ring) ctr.add(p);
    ctr.multiplyScalar(1 / cols);
    const ci = pos.length / 3;
    pos.push(ctr.x, ctr.y, ctr.z);
    const base = ri * cols;
    for (let c = 0; c < cols; c++) {
      const c2 = (c + 1) % cols;
      if (flip) idx.push(ci, base + c2, base + c);
      else idx.push(ci, base + c, base + c2);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

/* 小帆船船壳：6 站 × 8 点 U 形环，舯部最深、首尾收窄上翘 */
function boatHullGeo(L = 0.62, H = 0.17, W = 0.2) {
  const stations = [];
  const NST = 6, NC = 8;
  for (let s = 0; s < NST; s++) {
    const t = s / (NST - 1);
    const x = (t - 0.5) * L;
    const pinch = 0.25 + 0.75 * Math.sin(Math.PI * Math.min(Math.max((t - 0.06) / 0.88, 0), 1));
    const keel = -H * (0.3 + 0.7 * Math.sin(Math.PI * (0.18 + 0.64 * t)));
    const ring = [];
    for (let k = 0; k < NC; k++) {
      const a = (k / NC) * Math.PI;
      const y = H - (H - keel) * Math.sin(a);
      const z = Math.cos(a) * (W / 2) * (k === 0 || k === NC - 1 ? 0.02 : pinch);
      ring.push(new THREE.Vector3(x, y, z));
    }
    stations.push(ring);
  }
  return loftSkin(stations);
}

/* ================= 实验台（木面 + 钢腿 + 台面小件阵列） ================= */

const benchG = new THREE.Group();
crossG.add(benchG);

const benchTopTex = makeWoodTexture({ seed: 31, bands: 6, streaks: 130 });
benchTopTex.repeat.set(1.5, 1.05);
const benchEdgeMat = matCoat(0x4e3820, { clearcoat: 0.55, clearcoatRoughness: 0.42 });
const benchTop = new THREE.Mesh(
  new THREE.BoxGeometry(11.9, 0.14, 3.6),
  [benchEdgeMat, benchEdgeMat,
    new THREE.MeshStandardMaterial({ map: benchTopTex, roughness: 0.4, metalness: 0.04 }),
    benchEdgeMat, benchEdgeMat, benchEdgeMat]
);
benchTop.position.set(0, BENCH_TOP_Y - 0.07, 0.1);
benchG.add(benchTop);
const benchShadow = shadowPatch(12.6, 4.0, 0.42);
benchShadow.position.set(0, BENCH_TOP_Y - 0.145, 0.1);
benchG.add(benchShadow);

const legMat = matStd(PAL.steel, { metalness: 0.85, roughness: 0.34 });
const footMat = matStd(PAL.ink, { roughness: 0.85 });
for (const [lx, lz] of [[-5.3, 1.2], [5.3, 1.2], [-5.3, -1.0], [5.3, -1.0]]) {
  const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.048, 1.7, 10), legMat);
  leg.position.set(lx, BENCH_TOP_Y - 0.92, lz);
  benchG.add(leg);
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.085, 0.05, 10), footMat);
  foot.position.set(lx, BENCH_TOP_Y - 1.78, lz);
  benchG.add(foot);
  const lp = shadowPatch(0.5, 0.5, 0.5);
  lp.position.set(lx, BENCH_TOP_Y - 1.805, lz);
  benchG.add(lp);
}
for (const az of [1.2, -1.0]) {
  const apron = new THREE.Mesh(new THREE.BoxGeometry(10.4, 0.16, 0.06), matStd(0x3c2c18, { roughness: 0.7 }));
  apron.position.set(0, BENCH_TOP_Y - 0.24, az);
  benchG.add(apron);
}
const benchPlate = new THREE.Mesh(
  new THREE.PlaneGeometry(0.9, 0.3),
  new THREE.MeshBasicMaterial({ map: makeLabelTexture(['ATMOS LAB', 'BENCH · NO.07'], { w: 256, h: 96, accent: '#6e5530' }), transparent: false })
);
benchPlate.position.set(3.6, BENCH_TOP_Y + 0.002, 1.72);
benchPlate.rotation.x = -Math.PI / 2;
benchG.add(benchPlate);

/* 三杯风速仪：转速联动播放速度 */
const anemo = new THREE.Group();
anemo.position.set(4.35, BENCH_TOP_Y, 0.8);
benchG.add(anemo);
{
  const aBase = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 0.05, 14), legMat);
  aBase.position.y = 0.025;
  anemo.add(aBase);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.026, 0.6, 8), legMat);
  pole.position.y = 0.32;
  anemo.add(pole);
  const hub = new THREE.Group();
  hub.position.y = 0.66;
  anemo.add(hub);
  const hubBall = new THREE.Mesh(new THREE.SphereGeometry(0.032, 10, 8), matStd(PAL.brass, { metalness: 0.8, roughness: 0.3 }));
  hub.add(hubBall);
  for (let k = 0; k < 3; k++) {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.012, 0.012), legMat);
    arm.position.x = 0.08;
    const spokes = new THREE.Group();
    spokes.rotation.y = (k / 3) * Math.PI * 2;
    spokes.add(arm);
    const cup = new THREE.Mesh(
      new THREE.SphereGeometry(0.036, 10, 8, 0, Math.PI * 2, Math.PI * 0.5, Math.PI * 0.5),
      matCoat(0xc4552e, { clearcoat: 0.7 })
    );
    cup.rotation.z = Math.PI;
    cup.position.x = 0.165;
    spokes.add(cup);
    hub.add(spokes);
  }
  const vane = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.09, 0.16), matCoat(0xc4552e, { clearcoat: 0.5 }));
  vane.position.set(0, 0.76, 0);
  anemo.add(vane);
}
const anemoHub = anemo.children[2];

/* 台面小件：示踪烟雾瓶 ×2 + 观测仪木箱 */
const bottleGlass = matGlass(0xd8ecf0, { transmission: 0.86, roughness: 0.08 });
function benchBottle(x, z, lines, accent) {
  const g = new THREE.Group();
  g.position.set(x, BENCH_TOP_Y, z);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.085, 0.26, 14), bottleGlass);
  body.position.y = 0.13;
  g.add(body);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.045, 0.07, 10), bottleGlass);
  neck.position.y = 0.29;
  g.add(neck);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.035, 10), matStd(PAL.brass, { metalness: 0.85, roughness: 0.32 }));
  cap.position.y = 0.335;
  g.add(cap);
  const lbl = new THREE.Mesh(
    new THREE.PlaneGeometry(0.13, 0.1),
    new THREE.MeshBasicMaterial({ map: makeLabelTexture(lines, { w: 128, h: 96, accent }) })
  );
  lbl.position.set(0, 0.14, 0.087);
  g.add(lbl);
  const bp = shadowPatch(0.3, 0.3, 0.45);
  bp.position.y = 0.004;
  g.add(bp);
  benchG.add(g);
  return g;
}
benchBottle(-4.3, 0.85, ['示踪粒子试剂', 'TRACE·A'], '#8a4030');
benchBottle(-3.85, 1.18, ['温湿记录液', 'TH·07'], '#2e6a8a');
const caseWood = makeWoodTexture({ seed: 58, bands: 4, streaks: 60 });
const obsCase = new THREE.Group();
obsCase.position.set(3.4, BENCH_TOP_Y, 1.32);
{
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.16, 0.3),
    new THREE.MeshStandardMaterial({ map: caseWood, roughness: 0.55 }));
  box.position.y = 0.08;
  obsCase.add(box);
  const lid = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.045, 0.32), matStd(0x4e3820, { roughness: 0.6 }));
  lid.position.set(0.02, 0.18, 0);
  lid.rotation.z = -0.12;
  obsCase.add(lid);
  const dial = new THREE.Mesh(
    new THREE.CircleGeometry(0.075, 20),
    new THREE.MeshBasicMaterial({ map: makeLabelTexture(['气压 hPa', '1013±5'], { w: 96, h: 96, accent: '#555' }) })
  );
  dial.position.set(-0.12, 0.165, 0.152);
  obsCase.add(dial);
  const cp = shadowPatch(0.72, 0.5, 0.45);
  cp.position.y = 0.004;
  obsCase.add(cp);
}
benchG.add(obsCase);

/* ================= 城市热岛情景模型（楼群窗灯 / 行道树 / 路灯 / 车行道） ================= */

const cityG = new THREE.Group();
cityG.visible = false;
crossG.add(cityG);

function makeFacadeMaps(cols, rows, seed) {
  const rnd = srnd(seed);
  const cvA = document.createElement('canvas');
  const cvB = document.createElement('canvas');
  cvA.width = cvA.height = cvB.width = cvB.height = 256;
  const ca = cvA.getContext('2d');
  const cb = cvB.getContext('2d');
  ca.fillStyle = '#31404e';
  ca.fillRect(0, 0, 256, 256);
  cb.fillStyle = '#000';
  cb.fillRect(0, 0, 256, 256);
  const cw = 256 / cols, rh = 256 / rows;
  for (let r = 0; r < rows; r++) {
    ca.fillStyle = 'rgba(12,20,30,0.5)';
    ca.fillRect(0, r * rh, 256, 1.6);
    for (let q = 0; q < cols; q++) {
      const lit = rnd() < 0.5;
      const wx = q * cw + cw * 0.18, wy = r * rh + rh * 0.22, ww = cw * 0.64, wh = rh * 0.52;
      ca.fillStyle = lit ? '#c9a468' : '#141e28';
      ca.fillRect(wx, wy, ww, wh);
      if (lit) {
        cb.fillStyle = '#ffc880';
        cb.fillRect(wx, wy, ww, wh);
      }
    }
  }
  const mk = (cv) => {
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };
  return { map: mk(cvA), glow: mk(cvB) };
}

const facA = makeFacadeMaps(6, 9, 101);
const facB = makeFacadeMaps(4, 7, 202);
const cityWinMatA = new THREE.MeshStandardMaterial({
  map: facA.map, emissiveMap: facA.glow, emissive: new THREE.Color(0xffc880),
  emissiveIntensity: 0.9, roughness: 0.62, metalness: 0.05,
});
const cityWinMatB = new THREE.MeshStandardMaterial({
  map: facB.map, emissiveMap: facB.glow, emissive: new THREE.Color(0xffc880),
  emissiveIntensity: 0.9, roughness: 0.62, metalness: 0.05,
});

const cityRnd = srnd(20261106);
const bldSpots = [];
for (const [rowZ, n, wSpread] of [[DIOR_Z - 0.3, 12, 1.9], [DIOR_Z + 0.18, 9, 1.55]]) {
  for (let i = 0; i < n; i++) {
    const x = -wSpread + (2 * wSpread) * (i + 0.5) / n + (cityRnd() - 0.5) * 0.1;
    const w = 0.2 + cityRnd() * 0.12;
    const d = 0.18 + cityRnd() * 0.1;
    const h = 0.3 + (0.55 + cityRnd() * 0.75) * Math.exp(-Math.pow(x / 1.5, 2)) + cityRnd() * 0.14;
    bldSpots.push({ x, z: rowZ + (cityRnd() - 0.5) * 0.08, w, d, h, far: rowZ > DIOR_Z });
  }
}
const bldGeo = new THREE.BoxGeometry(1, 1, 1);
bldGeo.translate(0, 0.5, 0);
const bldNear = new THREE.InstancedMesh(bldGeo, cityWinMatA, bldSpots.filter((b) => !b.far).length);
const bldFar = new THREE.InstancedMesh(bldGeo, cityWinMatB, bldSpots.filter((b) => b.far).length);
{
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = new THREE.Vector3(), P = new THREE.Vector3();
  let ni = 0, fi = 0;
  const roofTint = new THREE.Color();
  for (const b of bldSpots) {
    S.set(b.w, b.h, b.d);
    P.set(b.x, BENCH_TOP_Y, b.z);
    M.compose(P, Q, S);
    const mesh = b.far ? bldFar : bldNear;
    const k = b.far ? fi++ : ni++;
    mesh.setMatrixAt(k, M);
    roofTint.setHSL(0.58, 0.08, 0.5 + cityRnd() * 0.25);
    mesh.setColorAt(k, roofTint);
  }
  bldNear.instanceMatrix.needsUpdate = true;
  bldFar.instanceMatrix.needsUpdate = true;
  if (bldNear.instanceColor) bldNear.instanceColor.needsUpdate = true;
  if (bldFar.instanceColor) bldFar.instanceColor.needsUpdate = true;
}
cityG.add(bldFar, bldNear);

const bldShadowMat = new THREE.MeshBasicMaterial({ map: shadowBlobTexture(), transparent: true, opacity: 0.4, depthWrite: false });
const bldShadows = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), bldShadowMat, bldSpots.length);
{
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));
  const S = new THREE.Vector3(), P = new THREE.Vector3();
  bldSpots.forEach((b, i) => {
    S.set(b.w * 2.6, b.d * 3.2, 1);
    P.set(b.x, BENCH_TOP_Y + 0.004, b.z);
    M.compose(P, Q, S);
    bldShadows.setMatrixAt(i, M);
  });
  bldShadows.instanceMatrix.needsUpdate = true;
}
cityG.add(bldShadows);

/* 车行道：沥青 + 中线虚线 */
const asphaltCv = document.createElement('canvas');
asphaltCv.width = 512; asphaltCv.height = 96;
{
  const c = asphaltCv.getContext('2d');
  c.fillStyle = '#262e36';
  c.fillRect(0, 0, 512, 96);
  for (let i = 0; i < 900; i++) {
    c.fillStyle = cityRnd() > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.22)';
    c.fillRect(cityRnd() * 512, cityRnd() * 96, 1.6, 1.2);
  }
  c.fillStyle = '#c8b458';
  for (let x = 8; x < 512; x += 56) c.fillRect(x, 45, 30, 5);
  c.fillStyle = 'rgba(220,225,230,0.6)';
  c.fillRect(0, 6, 512, 3);
  c.fillRect(0, 87, 512, 3);
}
const roadTex = new THREE.CanvasTexture(asphaltCv);
roadTex.colorSpace = THREE.SRGBColorSpace;
const road = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 1.02), new THREE.MeshStandardMaterial({ map: roadTex, roughness: 0.9 }));
road.rotation.x = -Math.PI / 2;
road.position.set(0, BENCH_TOP_Y + 0.002, DIOR_Z - 0.02);
cityG.add(road);

/* 行道树：干 + 冠 两级 InstancedMesh */
const treeRnd = srnd(777);
const treeSpots = [];
for (let i = 0; i < 16; i++) {
  const side = treeRnd() > 0.5 ? 1 : -1;
  treeSpots.push({
    x: side * (2.15 + treeRnd() * 0.85),
    z: DIOR_Z - 0.5 + treeRnd() * 1.15,
    s: 0.75 + treeRnd() * 0.6,
  });
}
const trunkMesh = new THREE.InstancedMesh(
  new THREE.CylinderGeometry(0.018, 0.028, 0.16, 6),
  matStd(PAL.membraneDeep, { roughness: 0.85 }), treeSpots.length
);
const crownMesh = new THREE.InstancedMesh(
  new THREE.ConeGeometry(0.11, 0.3, 7),
  matStd(PAL.cellWall, { roughness: 0.7 }), treeSpots.length
);
{
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = new THREE.Vector3(), P = new THREE.Vector3();
  const tint = new THREE.Color();
  treeSpots.forEach((t, i) => {
    S.setScalar(t.s);
    P.set(t.x, BENCH_TOP_Y + 0.08 * t.s, t.z);
    M.compose(P, Q, S);
    trunkMesh.setMatrixAt(i, M);
    P.y = BENCH_TOP_Y + 0.26 * t.s;
    M.compose(P, Q, S);
    crownMesh.setMatrixAt(i, M);
    tint.setHSL(0.29 + treeRnd() * 0.06, 0.5, 0.3 + treeRnd() * 0.14);
    crownMesh.setColorAt(i, tint);
  });
  trunkMesh.instanceMatrix.needsUpdate = true;
  crownMesh.instanceMatrix.needsUpdate = true;
  crownMesh.instanceColor.needsUpdate = true;
}
cityG.add(trunkMesh, crownMesh);

/* 路灯 ×2（夜间发光暖点） */
const lampGlowMat = matGlow(0xffd9a0, 1.1);
for (const lx of [-2.35, 2.35]) {
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.02, 0.62, 8), legMat);
  pole.position.set(lx, BENCH_TOP_Y + 0.31, DIOR_Z - 0.52);
  cityG.add(pole);
  const armM = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.012, 0.012), legMat);
  armM.position.set(lx - Math.sign(lx) * 0.07, BENCH_TOP_Y + 0.6, DIOR_Z - 0.52);
  cityG.add(armM);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.032, 10, 8), lampGlowMat);
  head.position.set(lx - Math.sign(lx) * 0.15, BENCH_TOP_Y + 0.585, DIOR_Z - 0.52);
  cityG.add(head);
}

/* ================= 海陆风情景模型（波动海面 shader + 陆块 + 放样帆船） ================= */

const seaG = new THREE.Group();
seaG.visible = false;
crossG.add(seaG);

const waterMat = new THREE.ShaderMaterial({
  uniforms: { uT: { value: 0 }, uDay: { value: 1 } },
  vertexShader: `
    uniform float uT;
    varying vec3 vWp;
    varying vec2 vUv;
    void main() {
      vUv = uv;
      vec3 p = position;
      p.z += sin(p.x * 4.4 + uT * 1.7) * 0.032 + sin(p.y * 6.3 - uT * 1.15) * 0.02;
      vec4 wp = modelMatrix * vec4(p, 1.0);
      vWp = wp.xyz;
      gl_Position = projectionMatrix * viewMatrix * wp;
    }`,
  fragmentShader: `
    uniform float uT;
    uniform float uDay;
    varying vec3 vWp;
    varying vec2 vUv;
    void main() {
      vec3 col = mix(vec3(0.05, 0.1, 0.18), vec3(0.15, 0.42, 0.6), uDay);
      float sp = sin(vWp.x * 9.0 + uT * 2.2) * sin(vWp.z * 11.0 - uT * 1.6);
      col += vec3(0.5, 0.62, 0.7) * pow(max(sp, 0.0), 6.0) * (0.16 + 0.3 * uDay);
      float foam = smoothstep(0.87, 0.995, vUv.x) * (0.3 + 0.18 * sin(vUv.y * 42.0 + uT * 2.6));
      col += vec3(0.85, 0.92, 0.95) * foam;
      float shallow = smoothstep(0.55, 1.0, vUv.x);
      col += vec3(0.1, 0.16, 0.12) * shallow * uDay;
      gl_FragColor = vec4(col, 0.94);
    }`,
  transparent: true,
});
const water = new THREE.Mesh(new THREE.PlaneGeometry(2.7, 1.4, 52, 20), waterMat);
water.rotation.x = -Math.PI / 2;
water.rotation.z = Math.PI;
water.position.set(-2.0, BENCH_TOP_Y + 0.01, DIOR_Z - 0.05);
seaG.add(water);

const sandCv = document.createElement('canvas');
sandCv.width = 128; sandCv.height = 64;
{
  const c = sandCv.getContext('2d');
  c.fillStyle = '#c9b283';
  c.fillRect(0, 0, 128, 64);
  for (let i = 0; i < 260; i++) {
    c.fillStyle = srnd(9)() > 0.5 ? 'rgba(90,70,40,0.25)' : 'rgba(240,225,190,0.3)';
    c.fillRect(srnd(9)() * 128, srnd(9)() * 64, 1.4, 1.2);
  }
}
const sandTex = new THREE.CanvasTexture(sandCv);
sandTex.colorSpace = THREE.SRGBColorSpace;
const beach = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 1.4), new THREE.MeshStandardMaterial({ map: sandTex, roughness: 0.9 }));
beach.rotation.x = -Math.PI / 2;
beach.position.set(-0.5, BENCH_TOP_Y + 0.006, DIOR_Z - 0.05);
seaG.add(beach);

/* 陆块：起伏草坡（fbm 细节 + 草石贴图） */
function makeTurfTexture(seed = 21) {
  const cv = document.createElement('canvas');
  cv.width = 256; cv.height = 256;
  const c = cv.getContext('2d');
  const g = c.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, '#5e8a40');
  g.addColorStop(0.6, '#476e33');
  g.addColorStop(1, '#6b6f52');
  c.fillStyle = g;
  c.fillRect(0, 0, 256, 256);
  const rnd = srnd(seed);
  for (let i = 0; i < 480; i++) {
    c.strokeStyle = rnd() > 0.5 ? 'rgba(180,210,130,0.2)' : 'rgba(30,52,26,0.3)';
    const x = rnd() * 256, y = rnd() * 256;
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x + (rnd() - 0.5) * 5, y - 3 - rnd() * 5);
    c.stroke();
  }
  for (let i = 0; i < 40; i++) {
    c.fillStyle = 'rgba(120,118,110,0.5)';
    c.beginPath();
    c.ellipse(rnd() * 256, 170 + rnd() * 80, 3 + rnd() * 7, 2 + rnd() * 4, rnd() * 3, 0, Math.PI * 2);
    c.fill();
  }
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const turfTex = makeTurfTexture(21);
const landGeo = new THREE.PlaneGeometry(2.7, 1.4, 46, 20);
{
  const lp = landGeo.attributes.position;
  for (let i = 0; i < lp.count; i++) {
    const u = lp.getX(i) / 1.35, v = lp.getY(i) / 0.7;
    const h = 0.2 * (u * 0.5 + 0.5) + 0.05 * fbm3(u * 2.4, v * 2.4, 3.1, 9);
    lp.setZ(i, Math.max(h, 0.012) * (0.72 + 0.28 * Math.cos(v * 1.25)));
  }
  landGeo.computeVertexNormals();
}
const landMesh = new THREE.Mesh(landGeo, new THREE.MeshStandardMaterial({ map: turfTex, roughness: 0.85 }));
landMesh.rotation.x = -Math.PI / 2;
landMesh.rotation.z = Math.PI;
landMesh.position.set(2.05, BENCH_TOP_Y, DIOR_Z - 0.05);
seaG.add(landMesh);
const landShadow = shadowPatch(3.0, 1.7, 0.4);
landShadow.position.set(2.05, BENCH_TOP_Y + 0.003, DIOR_Z - 0.05);
seaG.add(landShadow);

/* 帆船 ×2（放样船壳 + 桅杆 + 三角帆 + 尾旗） */
const boats = [];
const hullMat = matCoat(0x8a4a2a, { clearcoat: 0.8, clearcoatRoughness: 0.3 });
const sailMat = matStd(PAL.starch, { roughness: 0.8, side: THREE.DoubleSide });
function makeBoat(x, z, sailHue) {
  const g = new THREE.Group();
  g.position.set(x, BENCH_TOP_Y + 0.05, z);
  const hull = new THREE.Mesh(boatHullGeo(0.6, 0.16, 0.2), hullMat);
  g.add(hull);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.016, 0.5, 8), legMat);
  mast.position.y = 0.28;
  g.add(mast);
  const sailShape = new THREE.Shape();
  sailShape.moveTo(0, 0);
  sailShape.lineTo(0.26, 0.02);
  sailShape.lineTo(0, 0.42);
  sailShape.closePath();
  const sail = new THREE.Mesh(new THREE.ShapeGeometry(sailShape, 6), sailMat);
  sail.position.set(0.015, 0.1, 0.005);
  sail.rotation.y = Math.PI / 2;
  g.add(sail);
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.05),
    matStd(sailHue, { roughness: 0.7, side: THREE.DoubleSide }));
  flag.position.set(0.05, 0.55, 0);
  g.add(flag);
  seaG.add(g);
  boats.push(g);
  return g;
}
makeBoat(-2.5, DIOR_Z - 0.15, 0xd75a92);
makeBoat(-1.55, DIOR_Z + 0.28, 0x4a9fe8);
for (const [bx, bz] of [[-2.0, DIOR_Z + 0.42], [-0.9, DIOR_Z - 0.42]]) {
  const buoy = new THREE.Group();
  buoy.position.set(bx, BENCH_TOP_Y + 0.02, bz);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), matCoat(0xc4552e, { clearcoat: 0.6 }));
  buoy.add(ball);
  const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.09, 6), legMat);
  stick.position.y = 0.06;
  buoy.add(stick);
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 6), lampGlowMat);
  tip.position.y = 0.115;
  buoy.add(tip);
  seaG.add(buoy);
}

/* ================= 山谷风情景模型（双坡山体 + 坡面树列 + 谷底夜雾） ================= */

const valleyG = new THREE.Group();
valleyG.visible = false;
crossG.add(valleyG);

function ridgeHeight(u, v, side) {
  const slope = 0.3 * (0.5 - 0.5 * u * side);
  const crest = 0.3 * Math.exp(-Math.pow((u + side * 0.38) / 0.42, 2));
  return (slope + crest) * (0.8 + 0.2 * Math.cos(v * 1.35)) + 0.03 * fbm3(u * 2.6, v * 2.6, side * 5, 17);
}
const ridgeGeoL = new THREE.PlaneGeometry(2.8, 1.5, 64, 20);
const ridgeGeoR = new THREE.PlaneGeometry(2.8, 1.5, 64, 20);
for (const [geo, side] of [[ridgeGeoL, -1], [ridgeGeoR, 1]]) {
  const rp = geo.attributes.position;
  for (let i = 0; i < rp.count; i++) {
    const u = rp.getX(i) / 1.4, v = rp.getY(i) / 0.75;
    rp.setZ(i, Math.max(ridgeHeight(u, v, side), 0.01));
  }
  geo.computeVertexNormals();
}
const ridgeMat = new THREE.MeshStandardMaterial({ map: turfTex, roughness: 0.88 });
const ridgeL = new THREE.Mesh(ridgeGeoL, ridgeMat);
ridgeL.rotation.x = -Math.PI / 2;
ridgeL.position.set(-3.35, BENCH_TOP_Y, DIOR_Z - 0.1);
const ridgeR = new THREE.Mesh(ridgeGeoR, ridgeMat);
ridgeR.rotation.x = -Math.PI / 2;
ridgeR.position.set(3.35, BENCH_TOP_Y, DIOR_Z - 0.1);
valleyG.add(ridgeL, ridgeR);
const valleyShadowL = shadowPatch(3.1, 1.8, 0.38);
valleyShadowL.position.set(-3.35, BENCH_TOP_Y + 0.003, DIOR_Z - 0.1);
const valleyShadowR = shadowPatch(3.1, 1.8, 0.38);
valleyShadowR.position.set(3.35, BENCH_TOP_Y + 0.003, DIOR_Z - 0.1);
valleyG.add(valleyShadowL, valleyShadowR);

/* 坡面树列：按高度场采样落点 */
const vTreeRnd = srnd(4242);
const vTreeSpots = [];
for (let tries = 0; tries < 220 && vTreeSpots.length < 26; tries++) {
  const side = vTreeRnd() > 0.5 ? 1 : -1;
  const u = -1 + vTreeRnd() * 2, v = -0.8 + vTreeRnd() * 1.6;
  const h = ridgeHeight(u, v, side);
  if (h < 0.14 || h > 0.52) continue;
  const wx = (side === -1 ? -3.35 : 3.35) + u * 1.4;
  vTreeSpots.push({ x: wx, z: DIOR_Z - 0.1 + v * 0.75, y: BENCH_TOP_Y + h, s: 0.5 + vTreeRnd() * 0.35 });
}
const vTrunkMesh = new THREE.InstancedMesh(
  new THREE.CylinderGeometry(0.014, 0.02, 0.13, 6),
  matStd(PAL.membraneDeep, { roughness: 0.85 }), vTreeSpots.length
);
const vCrownMesh = new THREE.InstancedMesh(
  new THREE.ConeGeometry(0.085, 0.24, 6),
  matStd(PAL.chloroplast, { roughness: 0.72 }), vTreeSpots.length
);
{
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = new THREE.Vector3(), P = new THREE.Vector3();
  const tint = new THREE.Color();
  vTreeSpots.forEach((t, i) => {
    S.setScalar(t.s);
    P.set(t.x, t.y + 0.065 * t.s, t.z);
    M.compose(P, Q, S);
    vTrunkMesh.setMatrixAt(i, M);
    P.y = t.y + 0.2 * t.s;
    M.compose(P, Q, S);
    vCrownMesh.setMatrixAt(i, M);
    tint.setHSL(0.3 + vTreeRnd() * 0.05, 0.48, 0.28 + vTreeRnd() * 0.12);
    vCrownMesh.setColorAt(i, tint);
  });
  vTrunkMesh.instanceMatrix.needsUpdate = true;
  vCrownMesh.instanceMatrix.needsUpdate = true;
  vCrownMesh.instanceColor.needsUpdate = true;
}
valleyG.add(vTrunkMesh, vCrownMesh);

/* 谷底夜雾：横向柔雾带，夜半更浓 */
const mistCv = document.createElement('canvas');
mistCv.width = 256; mistCv.height = 64;
{
  const c = mistCv.getContext('2d');
  const g = c.createRadialGradient(128, 40, 8, 128, 40, 120);
  g.addColorStop(0, 'rgba(214,226,238,0.85)');
  g.addColorStop(0.6, 'rgba(214,226,238,0.3)');
  g.addColorStop(1, 'rgba(214,226,238,0)');
  c.fillStyle = g;
  c.fillRect(0, 0, 256, 64);
}
const mistTex = new THREE.CanvasTexture(mistCv);
const mistMat = new THREE.MeshBasicMaterial({ map: mistTex, transparent: true, opacity: 0.16, depthWrite: false });
const mist = new THREE.Mesh(new THREE.PlaneGeometry(5.4, 1.1), mistMat);
mist.rotation.x = -Math.PI / 2;
mist.position.set(0, BENCH_TOP_Y + 0.1, DIOR_Z - 0.15);
valleyG.add(mist);

/* ================= 日月灯组（昼/夜连续过渡，海陆风与山谷风共用） ================= */

const luminaryG = new THREE.Group();
luminaryG.visible = false;
crossG.add(luminaryG);
const sunHaloTex = makeGlowTexture('255,232,170');
const moonHaloTex = makeGlowTexture('205,220,240');
const sunArm = new THREE.Group();
const sunBall = new THREE.Mesh(new THREE.SphereGeometry(0.3, 22, 16), matGlow(0xffd76e, 1.7));
const sunHalo = new THREE.Sprite(new THREE.SpriteMaterial({
  map: sunHaloTex, color: 0xffe2a0, transparent: true, opacity: 0.85,
  depthWrite: false, blending: THREE.AdditiveBlending,
}));
sunHalo.scale.set(2.0, 2.0, 1);
sunArm.add(sunBall, sunHalo);
luminaryG.add(sunArm);
const moonArm = new THREE.Group();
const moonBall = new THREE.Mesh(new THREE.SphereGeometry(0.24, 22, 16), matStd(0xdfe6f2, { roughness: 0.92, emissive: 0x9fb2cc, emissiveIntensity: 0.5 }));
const moonHalo = new THREE.Sprite(new THREE.SpriteMaterial({
  map: moonHaloTex, color: 0xcfdcee, transparent: true, opacity: 0.5,
  depthWrite: false, blending: THREE.AdditiveBlending,
}));
moonHalo.scale.set(1.5, 1.5, 1);
moonArm.add(moonBall, moonHalo);
luminaryG.add(moonArm);
function positionLuminary() {
  const k = state.dayK;
  const sx = -3.8 + 7.6 * k;
  sunArm.position.set(sx, 2.3 + Math.sin(Math.PI * k) * 1.2, 1.15);
  sunArm.visible = k > 0.3;
  const mx = 3.8 - 7.6 * k;
  moonArm.position.set(mx, 2.3 + Math.sin(Math.PI * (1 - k)) * 1.1, 1.15);
  moonArm.visible = k < 0.7;
}

/* ================= 受热暖柱（热力/热岛章：强度滑杆联动呼吸） ================= */

const heatColMat = new THREE.ShaderMaterial({
  uniforms: { uK: { value: 0.55 }, uT: { value: 0 } },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
  fragmentShader: `
    uniform float uK;
    uniform float uT;
    varying vec2 vUv;
    void main() {
      float a = pow(1.0 - vUv.y, 1.8) * uK * (0.72 + 0.28 * sin(vUv.y * 8.0 - uT * 2.4));
      gl_FragColor = vec4(1.0, 0.6, 0.28, a);
    }`,
  transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
});
const heatCol = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.8, 1.5, 22, 1, true), heatColMat);
heatCol.position.set(0, BENCH_TOP_Y + 0.72, DIOR_Z + 0.02);
heatCol.visible = false;
crossG.add(heatCol);
function updateHeatVisuals() {
  const a = state.amp / 2.2;
  heatCol.scale.set(0.82 + 0.34 * a, 0.5 + 0.55 * a, 0.82 + 0.34 * a);
  heatColMat.uniforms.uK.value = 0.3 + 0.55 * a;
  cityWinMatA.emissiveIntensity = 0.4 + 1.0 * a;
  cityWinMatB.emissiveIntensity = 0.4 + 1.0 * a;
}

/* ================= 三圈环流放样管（CatmullRom 闭合样条 + 沿线脉动光点） ================= */

const cellsG = new THREE.Group();
cellsG.visible = false;
globeG.add(cellsG);
const cellPulses = [];
const CELLS_DEF = [
  { latA: 2, latB: 28, color: PAL.mitoShell },
  { latA: 32, latB: 58, color: PAL.cellWall },
  { latA: 62, latB: 82, color: PAL.microtubule },
];
function loopPoints(latA, latB, sgn) {
  const P = [];
  const push = (lat, r) => P.push(new THREE.Vector3(0, Math.sin(lat * DEG) * r, Math.cos(lat * DEG) * r));
  for (let k = 0; k <= 3; k++) {
    const f = k / 3;
    push(sgn * latA, GR * (1.04 + 0.3 * f * (0.6 + 0.4 * f)));
  }
  for (let k = 1; k <= 3; k++) push(sgn * (latA + (latB - latA) * (k / 3) * 0.92), GR * 1.34);
  for (let k = 0; k <= 3; k++) push(sgn * latB, GR * (1.34 - 0.3 * (k / 3)));
  for (let k = 1; k <= 4; k++) push(sgn * (latB - (latB - latA) * (k / 4)), GR * 1.045);
  return P;
}
{
  const pulseDotTex = makeGlowTexture('255,244,210');
  let idx = 0;
  for (const sgn of [1, -1]) {
    for (const def of CELLS_DEF) {
      const curve = new THREE.CatmullRomCurve3(loopPoints(def.latA, def.latB, sgn), true, 'catmullrom', 0.6);
      const tubeMat = matStd(def.color, {
        transparent: true, opacity: 0.42, emissive: def.color,
        emissiveIntensity: 0.35, depthWrite: false, roughness: 0.5,
      });
      const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 150, 0.02, 6, true), tubeMat);
      cellsG.add(tube);
      const pGeo = new THREE.BufferGeometry();
      pGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(9), 3));
      const pMat = new THREE.PointsMaterial({
        size: 0.08, map: pulseDotTex, transparent: true, depthWrite: false,
        blending: THREE.AdditiveBlending, color: 0xfff2cf,
      });
      const pts = new THREE.Points(pGeo, pMat);
      pts.frustumCulled = false;
      cellsG.add(pts);
      cellPulses.push({ curve, geo: pGeo, phase: idx * 0.11 });
      idx++;
    }
  }
}
function tickCellPulses(t) {
  const tmp = new THREE.Vector3();
  for (const cp of cellPulses) {
    const arr = cp.geo.attributes.position.array;
    for (let k = 0; k < 3; k++) {
      const tt = (t * 0.045 * Math.max(state.speed, 0.2) + k / 3 + cp.phase) % 1;
      cp.curve.getPointAt(tt, tmp);
      arr[k * 3] = tmp.x; arr[k * 3 + 1] = tmp.y; arr[k * 3 + 2] = tmp.z;
    }
    cp.geo.attributes.position.needsUpdate = true;
  }
}

/* ================= 地球仪支架（木座 + 黄铜子午半环 + 轴端旋钮 + 铭牌） ================= */

const standG = new THREE.Group();
globeG.add(standG);
const standWoodTex = makeWoodTexture({ seed: 71, bands: 5, streaks: 80 });
const standBase = new THREE.Mesh(
  new THREE.CylinderGeometry(1.04, 1.16, 0.17, 44),
  [new THREE.MeshStandardMaterial({ map: standWoodTex, roughness: 0.5 }),
    matCoat(0x2a2018, { roughness: 0.45 }), matCoat(0x2a2018, { roughness: 0.45 })]
);
standBase.position.y = -GR - 0.13;
standG.add(standBase);
const brassMat = matStd(PAL.brass, { metalness: 0.88, roughness: 0.28 });
const meridian = new THREE.Mesh(new THREE.TorusGeometry(GR * 1.03, 0.026, 10, 90, Math.PI), brassMat);
meridian.rotation.z = -Math.PI / 2;
standG.add(meridian);
for (const py of [GR * 1.03, -GR * 1.03]) {
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 10), brassMat);
  knob.position.y = py;
  standG.add(knob);
}
const standPlate = new THREE.Mesh(
  new THREE.PlaneGeometry(0.6, 0.3),
  new THREE.MeshBasicMaterial({ map: makeLabelTexture(['ATMOS · GLOBE', 'UNIT 03'], { w: 220, h: 110, accent: '#7c5a2e' }) })
);
standPlate.position.set(0, -GR - 0.045, 0.98);
standPlate.rotation.x = -0.5;
standG.add(standPlate);

/* ================= 昼夜视觉联动（供控件回调即时刷新） ================= */

function updateDayNightVisuals() {
  positionLuminary();
  waterMat.uniforms.uDay.value = state.dayK;
  mistMat.opacity = 0.1 + 0.26 * (1 - state.dayK);
}

/* 统一逐帧工艺更新（onFrame 尾部调用） */
function craftTick(dt, t) {
  anemoHub.rotation.y += dt * (0.6 + state.speed * 1.5);
  waterMat.uniforms.uT.value = t;
  heatColMat.uniforms.uT.value = t;
  updateHeatVisuals();
  updateDayNightVisuals();
  for (let i = 0; i < boats.length; i++) {
    const b = boats[i];
    b.position.y = BENCH_TOP_Y + 0.05 + Math.sin(t * 1.25 + i * 2.1) * 0.026;
    b.rotation.z = Math.sin(t * 0.85 + i * 1.7) * 0.05;
    b.rotation.x = Math.sin(t * 0.6 + i) * 0.02;
  }
  if (cellsG.visible) tickCellPulses(t);
}

/* ---------------- 风场模型 ---------------- */

const state = {
  mode: 'thermal',         // thermal | island | seam | valley | cell | globe
  playing: true, speed: 1,
  amp: 1,                  // 受热强度
  dayK: 1,                 // 海陆风：1=白天 0=夜晚（自动循环时连续变化）
  autoDay: false,
  season: 0,               // 直射点纬度（度）
  showBelts: true, showBeltLabels: true, showWindLabels: false,
  monoSeason: 1, monoAuto: true,
  showCells: false,       // 三圈环流放样管（threecell 章可开关）
};

// 热力环流：受热柱位于 hx（0~10），amp 为强度
function uvThermal(x, y, hx, amp) {
  const Lr = x < hx ? Math.max(hx, 0.4) : Math.max(CW - hx, 0.4);
  const s = Math.PI * Math.abs(x - hx) / Lr;
  const w = amp * 0.55 * Math.sin(Math.PI * y / CH) * Math.cos(s);
  const u = -amp * 0.9 * Math.cos(Math.PI * y / CH) * Math.sin(s) * (x < hx ? -1 : 1);
  return [u, w];
}

function uvAt(x, y, t) {
  switch (state.mode) {
    case 'thermal': return uvThermal(x, y, 5, 1.15 * state.amp);
    case 'island': return uvThermal(x, y, 5, 1.5 * state.amp);
    case 'seam': {
      const a = uvThermal(x, y, 7.4, 1.25 * state.amp);
      const b = uvThermal(x, y, 2.6, 1.25 * state.amp);
      const k = state.dayK;
      return [a[0] * k + b[0] * (1 - k), a[1] * k + b[1] * (1 - k)];
    }
    case 'valley': {
      // 白天：谷风沿两侧坡向上（指向山脊）；夜晚：山风向下滑到谷底
      const wallL = Math.exp(-Math.pow((x - 1.2) / 1.6, 2));
      const wallR = Math.exp(-Math.pow((x - 8.8) / 1.6, 2));
      const slopeL = -(x - 0.1) * 0.5, slopeR = -(x - 9.9) * 0.5;
      const k = state.dayK;
      const uL = (k > 0.5 ? -0.85 : 0.85) * wallL * (0.3 + 0.7 * Math.min(y / 1.6, 1));
      const uR = (k > 0.5 ? 0.85 : -0.85) * wallR * (0.3 + 0.7 * Math.min(y / 1.6, 1));
      const u = (uL + uR) * 0.78 * (k > 0.5 ? 1.15 : 1.0);
      const w = (uL !== 0 ? Math.sign(uL) * Math.abs(uL) * 0.9 : 0) + (uR !== 0 ? Math.sign(uR) * Math.abs(uR) * 0.9 : 0);
      return [u * (0.9 + 0.3 * state.amp), w * (0.9 + 0.3 * state.amp) + 0.03 * Math.sin(t + x)];
    }
    default: return [0, 0];
  }
}

// 地球表面风场（三圈环流），decl 为气压带偏移（度）
function globeUV(lat, lon, decl) {
  const a = Math.abs(lat);
  const sgn = lat >= 0 ? 1 : -1;
  let u, v;   // u: 向东为正（zonal），v: 向北为正（meridional，度/秒）
  const aa = a - decl * 0.7;
  if (aa < 30) {
    u = -13 * Math.cos(clamp(aa, 0, 30) / 30 * Math.PI / 2);
    v = -4.5 * sgn * (1 - clamp(aa, 0, 30) / 30);
  } else if (aa < 62) {
    const t = (aa - 30) / 32;
    u = 15 * Math.sin(t * Math.PI);
    v = 4.5 * sgn * Math.sin(t * Math.PI);
  } else {
    const t = clamp((aa - 62) / 28, 0, 1);
    u = -7 * Math.sin(t * Math.PI / 2);
    v = -2.5 * sgn * t;
  }
  return [u, v];
}

/* ---------------- 粒子推进 ---------------- */

const _p3 = [0, 0, 0];
function tickCross(dt, t) {
  for (let i = 0; i < CROSS_N; i++) {
    let x = crossSim[i * 2], y = crossSim[i * 2 + 1];
    if (state.mode === 'cell') { tickCell(i, dt); continue; }
    const [u, w] = uvAt(x, y, t);
    x += u * dt * state.speed;
    y += w * dt * state.speed;
    x += (Math.random() - 0.5) * 0.012;
    y += (Math.random() - 0.5) * 0.008;
    if (x < 0) x += CW; if (x > CW) x -= CW;
    if (y < 0.06) y = CH - 0.2;
    if (y > CH - 0.05) y = 0.1;
    crossSim[i * 2] = x; crossSim[i * 2 + 1] = y;
    crossPos[i * 3] = x - CW / 2;
    crossPos[i * 3 + 1] = y + 0.08;
    crossPos[i * 3 + 2] = crossZ[i];
    // 颜色：按模式给温度色
    let r, g, b;
    if (state.mode === 'seam') {
      const hotRight = state.dayK > 0.5;
      const d = hotRight ? Math.exp(-Math.pow((x - 7.4) / 2.2, 2)) : Math.exp(-Math.pow((x - 2.6) / 2.2, 2));
      r = 0.35 + 0.6 * d; g = 0.55 + 0.1 * (1 - d); b = 0.95 - 0.5 * d;
    } else if (state.mode === 'valley') {
      const d = Math.exp(-Math.pow((x - 5) / 3.2, 2));
      r = 0.45 + 0.35 * (1 - d); g = 0.62; b = 0.55 + 0.35 * d;
    } else {
      const d = Math.exp(-Math.pow((x - 5) / 2.6, 2));
      r = 0.4 + 0.58 * d; g = 0.6 - 0.15 * d; b = 0.95 - 0.55 * d;
    }
    crossCol[i * 3] = r; crossCol[i * 3 + 1] = g; crossCol[i * 3 + 2] = b;
  }
  crossGeo.attributes.position.needsUpdate = true;
  crossGeo.attributes.color.needsUpdate = true;
}

// 单圈环流（半球截面，r-θ 极坐标）
const cellPolar = new Float32Array(CROSS_N * 2);   // [theta(0~90°), r(0.2R~R)]
const CELLR = 4.1;
function initCell() {
  for (let i = 0; i < CROSS_N; i++) {
    cellPolar[i * 2] = Math.random() * Math.PI / 2;
    cellPolar[i * 2 + 1] = CELLR * (0.35 + 0.65 * Math.sqrt(Math.random()));
  }
}
function tickCell(i, dt) {
  let th = cellPolar[i * 2], r = cellPolar[i * 2 + 1];
  const vr = 0.5 * state.amp * Math.cos(2 * th) * Math.sin(Math.PI * (CELLR - r) / CELLR);
  const vth = 0.42 * Math.cos(Math.PI * r / CELLR / 1.0);
  th += (vth / Math.max(r, 0.4)) * dt * state.speed;
  r += vr * dt * state.speed;
  if (th < 0.03) th = 0.03; if (th > Math.PI / 2 - 0.03) th = Math.PI / 2 - 0.03;
  if (r < CELLR * 0.3) r = CELLR * 0.3; if (r > CELLR * 0.99) r = CELLR * 0.99;
  cellPolar[i * 2] = th; cellPolar[i * 2 + 1] = r;
  const cx = 0, cy = 0.15;
  crossPos[i * 3] = cx + Math.sin(th) * r;
  crossPos[i * 3 + 1] = cy + Math.cos(th) * r;
  crossPos[i * 3 + 2] = crossZ[i];
  const warm = Math.cos(th);
  crossCol[i * 3] = 0.95; crossCol[i * 3 + 1] = 0.45 + 0.35 * (1 - warm); crossCol[i * 3 + 2] = 0.25 + 0.6 * (1 - warm);
}

function tickGlobe(dt) {
  const decl = state.season;
  for (let i = 0; i < GLOBE_N; i++) {
    let la = globeLat[i], lo = globeLon[i];
    const [u, v] = globeUV(la, lo, decl);
    lo += u * dt * state.speed * 1.15;
    la += v * dt * state.speed * 1.15;
    lo += (Math.random() - 0.5) * 0.15;
    la += (Math.random() - 0.5) * 0.1;
    if (lo < 0) lo += 360; if (lo > 360) lo -= 360;
    la = clamp(la, -86, 86);
    globeLat[i] = la; globeLon[i] = lo;
    latLonPos(la, lo, GR * 1.018, _p3);
    globePos[i * 3] = _p3[0]; globePos[i * 3 + 1] = _p3[1]; globePos[i * 3 + 2] = _p3[2];
    // 颜色按纬度风带：信风橙、西风绿、极地蓝
    const a = Math.abs(la - decl * 0.7);
    let c;
    if (a < 30) c = [1.0, 0.62, 0.3];
    else if (a < 62) c = [0.45, 0.9, 0.55];
    else c = [0.5, 0.72, 1.0];
    globeCol[i * 3] = c[0]; globeCol[i * 3 + 1] = c[1]; globeCol[i * 3 + 2] = c[2];
  }
  globeGeo.attributes.position.needsUpdate = true;
  globeGeo.attributes.color.needsUpdate = true;
}

/* ---------------- 地面纹理绘制 ---------------- */

function paintGround(kind) {
  const c = groundCanvas.getContext('2d');
  const W = groundCanvas.width, Hh = groundCanvas.height;
  c.clearRect(0, 0, W, Hh);
  const grad = c.createLinearGradient(0, 0, 0, Hh);
  if (kind === 'sea') {
    grad.addColorStop(0, '#7fb4d8'); grad.addColorStop(0.45, '#3a7fb8'); grad.addColorStop(0.5, '#d8c48a'); grad.addColorStop(1, '#b8a05e');
    c.fillStyle = grad; c.fillRect(0, 0, W, Hh);
    c.fillStyle = '#1d5e94';
    c.font = '600 34px -apple-system,"PingFang SC",sans-serif';
    c.fillText('海洋（左）', 40, Hh / 2 + 12);
    c.fillStyle = '#7a5c22';
    c.fillText('陆地（右）', W - 260, Hh / 2 + 12);
  } else if (kind === 'valley') {
    c.fillStyle = '#c9b98a'; c.fillRect(0, 0, W, Hh);
    c.fillStyle = '#8a7448';
    c.beginPath();
    c.moveTo(0, Hh);
    for (let i = 0; i <= 40; i++) {
      const x = i / 40 * CW;
      const h = valleyProfile(x);
      c.lineTo(x / CW * W, Hh - h / 1.15 / CH * Hh * 2.4);
    }
    c.lineTo(W, Hh); c.closePath(); c.fill();
    c.fillStyle = '#5e4a20';
    c.font = '600 30px -apple-system,"PingFang SC",sans-serif';
    c.fillText('山坡', 30, 52); c.fillText('山坡', W - 130, 52);
    c.fillText('谷底', W / 2 - 30, Hh - 14);
  } else {
    // 热力 / 热岛：中央受热
    const g2 = c.createLinearGradient(0, 0, W, 0);
    g2.addColorStop(0, '#8aa8c8'); g2.addColorStop(0.32, '#a89a78');
    g2.addColorStop(0.5, kind === 'island' ? '#c85a3a' : '#c88a4a');
    g2.addColorStop(0.68, '#a89a78'); g2.addColorStop(1, '#8aa8c8');
    c.fillStyle = g2; c.fillRect(0, 0, W, Hh);
    c.fillStyle = 'rgba(120,60,30,0.85)';
    c.font = '600 32px -apple-system,"PingFang SC",sans-serif';
    const label = kind === 'island' ? '城区（热岛）' : '受热地面';
    c.fillText(label, W / 2 - 70, Hh - 12);
    c.fillStyle = 'rgba(50,70,110,0.9)';
    c.fillText(kind === 'island' ? '郊区（较冷）' : '较冷地面', 30, Hh - 12);
    c.fillText(kind === 'island' ? '郊区（较冷）' : '较冷地面', W - 220, Hh - 12);
    if (kind === 'island') {
      // 城市剪影
      c.fillStyle = 'rgba(40,32,28,0.88)';
      for (let i = 0; i < 14; i++) {
        const bw = 18 + Math.random() * 26, bh = 24 + Math.random() * 62;
        const bx = W / 2 - 150 + i * 22 + Math.random() * 6;
        c.fillRect(bx, Hh - 10 - bh, bw, bh);
      }
    }
  }
  groundTex.needsUpdate = true;
}

/* 单圈环流截面：半圆弧线 */
const cellArc = new THREE.Line(
  new THREE.BufferGeometry().setFromPoints(
    Array.from({ length: 65 }, (_, i) => {
      const th = i / 64 * Math.PI / 2;
      return new THREE.Vector3(Math.sin(th) * CELLR, 0.15 + Math.cos(th) * CELLR, 0);
    })
  ),
  new THREE.LineBasicMaterial({ color: 0xffd166, transparent: true, opacity: 0.9 })
);
cellArc.visible = false;
crossG.add(cellArc);
const cellEq = new THREE.Line(
  new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-0.6, 0.15, 0), new THREE.Vector3(CELLR * 1.12, 0.15, 0)]),
  new THREE.LineDashedMaterial({ color: 0x9fd0ff, dashSize: 0.14, gapSize: 0.09, transparent: true, opacity: 0.8 })
);
cellEq.computeLineDistances();
cellEq.visible = false;
crossG.add(cellEq);

/* ---------------- HUD ---------------- */

const hud = makeHUD(document.getElementById('lcData'), [['a', '读数'], ['b', ''], ['x', '']]);
hud.show(false);

/* ---------------- 控制条 ---------------- */

const ctl = createControlsPanel(document.getElementById('controls'));

function baseCtl() {
  ctl.clear();
  const playBtn = ctl.button({
    label: state.playing ? '⏸ 暂停' : '▶ 播放',
    onClick() {
      state.playing = !state.playing;
      playBtn.textContent = state.playing ? '⏸ 暂停' : '▶ 播放';
    },
  });
  ctl.slider({
    label: '速度', min: 0.2, max: 3, step: 0.1, value: state.speed,
    fmt: (v) => v.toFixed(1) + '×',
    onInput: (v) => { state.speed = v; },
  });
  return playBtn;
}
function ampCtl(label = '受热强度') {
  return ctl.slider({
    label, min: 0.3, max: 2.2, step: 0.1, value: state.amp,
    fmt: (v) => v.toFixed(1),
    onInput: (v) => { state.amp = v; updateHeatVisuals(); },
  });
}
function dayNightCtl(withAuto = true) {
  const seg = ctl.seg({
    options: [{ label: '白天', value: 1 }, { label: '夜晚', value: 0 }],
    value: 1,
    onChange: (v) => { state.dayK = v; state.autoDay = false; skySpriteSet(); updateDayNightVisuals(); },
  });
  state._daySeg = seg;
  if (withAuto) {
    ctl.toggle({
      label: '昼夜自动', value: false,
      onChange: (v) => { state.autoDay = v; },
    });
  }
}
function skySpriteSet() {
  const night = state.mode === 'seam' || state.mode === 'valley' ? state.dayK < 0.5 : false;
  setSpriteText(skySprite, night ? '☾' : '☀', { fontSize: 64, color: night ? '#cfd8ee' : '#ffcf5a', scale: 0.02 });
}
function enterCross(kind) {
  crossG.visible = true; globeG.visible = false;
  state.mode = kind;
  clearCrossLabels();
  crossPts.visible = true;
  boxHelper.visible = true;
  groundMesh.visible = true;
  cellArc.visible = kind === 'cell';
  cellEq.visible = kind === 'cell';
  groundMesh.visible = kind !== 'cell';
  skySprite.visible = kind === 'seam' || kind === 'valley';
  /* 情景道具按章显隐（台面道具常驻；海陆/山谷/城市/暖柱各归其章） */
  cityG.visible = kind === 'island';
  seaG.visible = kind === 'seam';
  valleyG.visible = kind === 'valley';
  heatCol.visible = kind === 'thermal' || kind === 'island';
  luminaryG.visible = kind === 'seam' || kind === 'valley';
  if (kind === 'cell') initCell();
  paintGround(kind === 'seam' ? 'sea' : kind === 'valley' ? 'valley' : kind === 'island' ? 'island' : 'plain');
  skySpriteSet();
  updateHeatVisuals();
  updateDayNightVisuals();
}
function enterGlobe() {
  crossG.visible = false; globeG.visible = true;
  state.mode = 'globe';
  clearCrossLabels();
  state.showCells = false;
  cellsG.visible = false;
}

/* ---------------- 章节 ---------------- */

const SECTIONS = [
  {
    id: 'overview', title: '大气运动总览',
    html: `<p>大气运动的根本原因：太阳辐射在<b>地表分布不均</b>，造成高低纬度之间、海陆之间的<b>冷热差异</b>，空气便由高压一侧流向低压一侧，环流由此成形。</p>
<p>左侧实验箱里，中央地面受热 → 空气膨胀<b>上升</b> → 近地面形成<b>低气压</b>，两侧较冷空气下沉 → 近地面为<b>高气压</b> → 风从两侧吹向中央。这一简单的「热力环流」是一切大气运动的基础。</p>`,
    enter() {
      enterCross('thermal');
      baseCtl(); ctl.sep(); ampCtl(); ctl.sep();
      ctl.toggle({ label: '边框', value: true, onChange: (v) => { boxHelper.visible = v; } });
      hud.show(false);
      app.setCamera([0, 2.3, 11.5], [0, 2.1, 0]);
    },
  },
  {
    id: 'thermal', title: '热力环流原理',
    html: `<p>热力环流四步：<b>① 受热不均</b>（中央热、两侧冷）→ <b>② 垂直运动</b>（热处上升、冷处下沉）→ <b>③ 同一水平面产生气压差</b>（热处近地面低压、高空高压）→ <b>④ 大气水平运动</b>（风：近地面吹向热处，高空吹离）。</p>
<p>调「受热强度」观察环流快慢。要留意：同一地点上空与地面的气压形势恰好<b>相反</b>——受热处地面为低压、上空反而高压。</p>`,
    enter() {
      enterCross('thermal');
      addCrossLabel('上升', 0, 3.1, '#ffb28a', 28);
      addCrossLabel('下沉', -4.6, 3.1, '#9fd0ff', 28);
      addCrossLabel('下沉', 4.6, 3.1, '#9fd0ff', 28);
      addCrossLabel('近地面：低压 ← 风 → 高压', 0, 0.55, '#ffe0b0', 22);
      baseCtl(); ctl.sep(); ampCtl(); ctl.sep();
      ctl.toggle({
        label: '标注', value: true,
        onChange: (v) => crossLabels.forEach((s) => { s.visible = v; }),
      });
      hud.show(true);
      hud.set('a', '热处近地面：低气压');
      hud.set('b', '冷处近地面：高气压');
      hud.set('x', '风：高压 → 低压');
      app.setCamera([0, 2.3, 11.5], [0, 2.1, 0]);
    },
  },
  {
    id: 'island', title: '城市热岛环流',
    html: `<p>城区人口密集、生产生活排放废热多，气温比郊区高，像一座<b>热的岛屿</b>——「城市热岛」。城区空气上升，郊区空气下沉，地面的风便由<b>郊区一侧吹进城区</b>。</p>
<p>这有利有弊：污染物在城区上升后向郊区扩散，但若郊区有污染源，近地面风又可能把污染物带回城区。调「热岛强度」看环流变化。</p>`,
    enter() {
      enterCross('island');
      addCrossLabel('城区', 0, 0.6, '#ffcf9a', 26);
      addCrossLabel('郊区', -4.4, 0.6, '#c9d6ea', 24);
      addCrossLabel('郊区', 4.4, 0.6, '#c9d6ea', 24);
      baseCtl(); ctl.sep(); ampCtl('热岛强度'); ctl.sep();
      ctl.toggle({ label: '标注', value: true, onChange: (v) => crossLabels.forEach((s) => { s.visible = v; }) });
      ctl.toggle({ label: '建筑剪影', value: true, onChange: (v) => { paintGround(v ? 'island' : 'plain'); cityG.visible = v; } });
      hud.show(true);
      hud.set('a', '地面风：郊区 → 城区');
      hud.set('b', '高空风：城区 → 郊区');
      hud.set('x', '');
      app.setCamera([0, 2.3, 11.5], [0, 2.1, 0]);
    },
  },
  {
    id: 'seam', title: '海陆风',
    html: `<p>海洋热容量大、升温和降温都慢；陆地升温快降温也快。<b>白天</b>：陆地升温快 → 陆地上升气流 → 地面风转由海洋吹往陆地（<b>海风</b>）；<b>夜晚</b>：陆地降温快 → 陆地下沉气流 → 地面风改由陆地吹往海洋（<b>陆风</b>）。</p>
<p>切换「白天/夜晚」或开「昼夜自动」，看风向昼夜反转。沿海地区的海陆风是最典型的小尺度热力环流。</p>`,
    enter() {
      enterCross('seam');
      addCrossLabel('海风 →', 2.4, 0.75, '#9fd8ff', 26);
      baseCtl(); ctl.sep(); ampCtl(); ctl.sep();
      dayNightCtl();
      ctl.toggle({ label: '标注', value: true, onChange: (v) => crossLabels.forEach((s) => { s.visible = v; }) });
      hud.show(true);
      hud.set('a', '白天：海风（海→陆）');
      hud.set('b', '夜晚：陆风（陆→海）');
      hud.set('x', '');
      app.setCamera([0, 2.3, 11.5], [0, 2.1, 0]);
    },
    tick(dt) {
      if (state.autoDay) {
        state._dayPhase = (state._dayPhase || 0) + dt * 0.3;
        state.dayK = 0.5 + 0.5 * Math.sin(state._dayPhase);
        if (state._daySeg) state._daySeg.set(state.dayK > 0.5 ? 1 : 0);
        skySpriteSet();
        refreshSeamLabel();
      }
    },
  },
  {
    id: 'valley', title: '山谷风',
    html: `<p>山地中坡地与谷底受热差异造成风向昼夜变化：<b>白天</b>山坡受热快，风沿山坡<b>向上</b>吹向山顶——<b>谷风</b>；<b>夜晚</b>山坡冷却快，冷而重的空气顺着坡面<b>下泄</b>、灌进谷底——<b>山风</b>。</p>
<p>切换昼/夜观察两侧山坡上的气流翻转。山谷风与海陆风一样，都是热力环流的局地表现。</p>`,
    enter() {
      enterCross('valley');
      addCrossLabel('谷风 ↑', -2.6, 2.2, '#ffe0b0', 26);
      addCrossLabel('↑ 谷风', 2.6, 2.2, '#ffe0b0', 26);
      baseCtl(); ctl.sep(); ampCtl(); ctl.sep();
      dayNightCtl();
      ctl.toggle({ label: '标注', value: true, onChange: (v) => crossLabels.forEach((s) => { s.visible = v; }) });
      hud.show(true);
      hud.set('a', '白天：谷风（坡向上）');
      hud.set('b', '夜晚：山风（坡向下）');
      hud.set('x', '');
      app.setCamera([0, 2.3, 11.5], [0, 2.1, 0]);
    },
    tick(dt) {
      if (state.autoDay) {
        state.dayK = Math.floor(t_global / 6) % 2 === 0 ? 1 : 0;
        if (state._daySeg) state._daySeg.set(state.dayK > 0.5 ? 1 : 0);
        skySpriteSet();
        refreshValleyLabel();
      }
    },
  },
  {
    id: 'cell', title: '单圈环流',
    html: `<p>假设地球<b>不自转</b>、表面均匀，赤道受热多、极地受热少，大气只在<b>高低纬之间</b>形成一个闭合环流——<b>单圈环流</b>：赤道上升 → 高空流向极地 → 极地下沉 → 近地面流回赤道。</p>
<p>实际情况下，地球自转还会带来地转偏向的作用，单圈环流因此被打散成三圈——下一节看它怎样碎裂。</p>`,
    enter() {
      enterCross('cell');
      addCrossLabel('赤道（直射，上升）', 3.6, 0.65, '#ffb28a', 24);
      addCrossLabel('极点（下沉）', -2.2, 4.0, '#9fd0ff', 24);
      baseCtl(); ctl.sep(); ampCtl(); ctl.sep();
      ctl.toggle({ label: '标注', value: true, onChange: (v) => crossLabels.forEach((s) => { s.visible = v; }) });
      hud.show(false);
      app.setCamera([0, 2.3, 11.5], [0, 2.1, 0]);
    },
  },
  {
    id: 'threecell', title: '三圈环流',
    html: `<p>加入<b>地球自转</b>（地转偏向力）后，每个半球形成<b>三个环流圈</b>：低纬环流圈（哈德莱）、中纬环流圈（费雷尔）、高纬环流圈（极地）。地面上随之划出<b>七条气压带与六条风带</b>。</p>
<p>旋转地球看表面粒子：<span style="color:#ffa564">橙色＝信风</span>、<span style="color:#79e68c">绿色＝西风</span>、<span style="color:#8fc4ff">蓝色＝极地东风</span>。北半球右偏、南半球左偏。</p>`,
    enter() {
      enterGlobe();
      baseCtl(); ctl.sep();
      ctl.toggle({ label: '气压带', value: true, onChange: (v) => { state.showBelts = v; beltMeshes.forEach((m) => { m.visible = v; }); } });
      ctl.toggle({ label: '风带粒子', value: true, onChange: (v) => { globePts.visible = v; } });
      ctl.toggle({
        label: '环流圈', value: true,
        onChange: (v) => { state.showCells = v; cellsG.visible = v; },
      });
      state.showCells = true;
      cellsG.visible = true;
      hud.show(true);
      hud.set('a', '环流圈 3×2（放样管）');
      hud.set('b', '低纬·中纬·高纬');
      hud.set('x', '光点沿圈流动');
      app.setCamera([2.6, 1.7, 4.2], [0, 0, 0]);
    },
  },
  {
    id: 'belts', title: '气压带与风带',
    html: `<p><b>七个气压带</b>：赤道低气压带、两副热带高气压带、两副极地低气压带、两极地高气压带。<b>六个风带</b>：低纬信风带、中纬西风带、极地东风带（南北各一）。</p>
<p>记忆口诀：「高压带下沉干燥、低压带上升多雨」；气流由高压区流向低压区，还要叠上地转偏向的效应。开「风带标注」对照看南北半球对称的分布。</p>`,
    enter() {
      enterGlobe();
      baseCtl(); ctl.sep();
      ctl.toggle({ label: '气压带标注', value: true, onChange: (v) => { state.showBeltLabels = v; beltLabels.forEach((s) => { s.visible = v; }); } });
      ctl.toggle({ label: '风带标注', value: true, onChange: (v) => { state.showWindLabels = v; windLabels.forEach((s) => { s.visible = v; }); } });
      ctl.sep();
      ctl.toggle({ label: '气压带', value: true, onChange: (v) => beltMeshes.forEach((m) => { m.visible = v; }) });
      hud.show(true);
      hud.set('a', '气压带 7 · 风带 6');
      hud.set('b', '高压带：下沉 · 干燥');
      hud.set('x', '低压带：上升 · 多雨');
      app.setCamera([1.8, 1.2, 5.4], [0, 0, 0]);
    },
  },
  {
    id: 'season', title: '季节移动',
    html: `<p>黄赤交角的存在使太阳直射点在南北回归线间往返，气压带风带也随之<b>随季节移动</b>：北半球夏季<b>北移</b>、冬季<b>南移</b>（大致移动 5~10 个纬度）。</p>
<p>拖动「直射纬度」滑杆或点节气按钮，观察气压带（橙色高气压带、蓝色低气压带）与阳光直射的同步移动。</p>`,
    enter() {
      enterGlobe();
      baseCtl(); ctl.sep();
      ctl.slider({
        label: '直射纬度', min: -23.5, max: 23.5, step: 0.5, value: state.season,
        fmt: (v) => Math.abs(v).toFixed(1) + '°' + (v >= 0 ? 'N' : 'S'),
        onInput: (v) => { state.season = v; },
      });
      ctl.sep();
      ctl.button({ label: '夏至 23.5°N', onClick: () => { state.season = 23.5; } });
      ctl.button({ label: '春秋分 0°', onClick: () => { state.season = 0; } });
      ctl.button({ label: '冬至 23.5°S', onClick: () => { state.season = -23.5; } });
      hud.show(true);
      hud.set('a', '北移上限：23.5°N');
      hud.set('b', '南移下限：23.5°S');
      hud.set('x', '');
      app.setCamera([2.6, 1.7, 4.2], [0, 0, 0]);
    },
    hudTick() {
      hud.set('x', '当前直射：' + Math.abs(state.season).toFixed(1) + '°' + (state.season >= 0 ? 'N' : 'S'));
    },
  },
  {
    id: 'monsoon', title: '海陆分布与季风',
    html: `<p>巨大的海陆差异叠加气压带风带的季节移动，形成大范围随季节反转的风——<b>季风</b>。<b>冬季</b>：亚洲腹地散热迅猛、冷性高压在此筑成（蒙古—西伯利亚高压），风从大陆吹向海洋（我国盛行<b>西北风</b>）；<b>夏季</b>：大陆升温形成低压，风从海洋吹向大陆（东部盛行<b>东南风</b>，南亚为越赤道的<b>西南季风</b>）。</p>
<p>切「冬季/夏季」看东亚上空箭头反转。季风带来我国雨热同期的气候。</p>`,
    enter() {
      enterGlobe();
      monsoonG.visible = true;
      baseCtl(); ctl.sep();
      const seg = ctl.seg({
        options: [{ label: '冬季（西北风）', value: -1 }, { label: '夏季（东南风）', value: 1 }],
        value: 1,
        onChange: (v) => { state.monoSeason = v; layoutMonsoon(v); },
      });
      state._monoSeg = seg;
      ctl.toggle({
        label: '自动交替', value: true,
        onChange: (v) => { state.monoAuto = v; },
      });
      layoutMonsoon(1);
      hud.show(true);
      hud.set('a', '冬：大陆 → 海洋');
      hud.set('b', '夏：海洋 → 大陆');
      hud.set('x', '');
      app.setCamera([3.4, 2.2, 3.0], [0.7, 0.4, -1.1]);
    },
    hudTick() {
      hud.set('x', '当前季节：' + (state.monoSeason > 0 ? '夏（东南风）' : '冬（西北风）'));
    },
    tick(dt) {
      if (state.monoAuto && Math.floor(t_global / 7) % 2 !== Math.sign(state.monoSeason)) {
        state.monoSeason = -state.monoSeason;
        layoutMonsoon(state.monoSeason);
        if (state._monoSeg) state._monoSeg.set(state.monoSeason);
      }
    },
  },
  {
    id: 'quiz', title: '随堂检测',
    html: `<p>5 道选择题，检验大气环流的掌握情况。</p>`,
    enter() {
      enterGlobe();
      monsoonG.visible = false;
      baseCtl();
      app.setCamera([2.6, 1.7, 4.2], [0, 0, 0]);
      showQuiz();
    },
  },
];

let t_global = 0;
function refreshSeamLabel() {
  const sp = crossLabels[0];
  if (!sp) return;
  const day = state.dayK > 0.5;
  setSpriteText(sp, day ? '海风 →' : '← 陆风', { fontSize: 26, color: day ? '#9fd8ff' : '#ffd9a0', scale: 0.0042 });
  sp.position.set(day ? 2.4 : -2.4, 0.75, 0.5);
}
function refreshValleyLabel() {
  const day = state.dayK > 0.5;
  if (crossLabels[0]) setSpriteText(crossLabels[0], day ? '谷风 ↑' : '山风 ↓', { fontSize: 26, color: day ? '#ffe0b0' : '#9fd0ff', scale: 0.0042 });
  if (crossLabels[1]) setSpriteText(crossLabels[1], day ? '↑ 谷风' : '↓ 山风', { fontSize: 26, color: day ? '#ffe0b0' : '#9fd0ff', scale: 0.0042 });
}

/* ---------------- 随堂检测 ---------------- */

const QUIZ = [
  {
    q: '热力环流中，近地面受热处的气压状况与气流运动是？',
    opts: ['高压、下沉', '低压、上升', '高压、上升', '低压、下沉'],
    a: 1,
    ex: '受热 → 空气膨胀上升 → 近地面空气密度减小形成低气压；冷却处相反（高压、下沉）。',
  },
  {
    q: '白天海边的风向是？',
    opts: ['陆风：从陆地吹向海洋', '海风：从海洋吹向陆地', '高空吹向海洋', '无风'],
    a: 1,
    ex: '白天陆地升温快、近地面形成低压，海洋为高压，风从高压（海洋）吹向低压（陆地），即海风。',
  },
  {
    q: '形成三圈环流的重要因素是？',
    opts: ['海陆分布', '地球自转产生的地转偏向力', '地形起伏', '人类活动'],
    a: 1,
    ex: '假设地表均匀、地球不自转时只有单圈环流；自转产生的地转偏向力使气流偏转，把单圈打散为三圈。',
  },
  {
    q: '关于气压带，下列正确的是？',
    opts: ['赤道低气压带盛行下沉气流', '副热带高压带的气流以下沉为主、普遍少雨', '极地高气压带气流上升多雨', '副极地低气压带盛行下沉气流'],
    a: 1,
    ex: '高压带盛行下沉气流、水汽不易凝结，一般干燥少雨；低压带盛行上升气流、多阴雨。赤道低压带多雨、副极地低压带也是上升气流。',
  },
  {
    q: '我国东部夏季盛行东南风，主要原因是？',
    opts: ['气压带风带的位置没有变化', '夏季陆地升温快形成低压，风由海面吹向大陆', '夏季海洋是高压', '地形阻挡'],
    a: 1,
    ex: '夏季大陆升温快、近地面形成热低压（亚洲低压），风从高压（海洋）吹向大陆，叠加地转偏向形成东南季风；海陆热力差异是主因。',
  },
];

function showQuiz() {
  let idx = 0, score = 0;
  const panel = document.createElement('div');
  panel.className = 'quiz-panel';
  stage.appendChild(panel);
  function renderQ() {
    const item = QUIZ[idx];
    panel.innerHTML = '';
    const card = document.createElement('div');
    card.className = 'quiz-card';
    card.innerHTML = `
      <div class="q-progress">第 ${idx + 1} / ${QUIZ.length} 题</div>
      <h3></h3><div class="q-opts"></div><div class="q-explain"></div>
      <div class="q-foot"><span class="q-score">得分：${score}</span></div>`;
    card.querySelector('h3').textContent = item.q;
    const optsBox = card.querySelector('.q-opts');
    item.opts.forEach((opt, i) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'quiz-opt';
      b.textContent = String.fromCharCode(65 + i) + '. ' + opt;
      b.addEventListener('click', () => {
        const correct = i === item.a;
        if (correct) score++;
        optsBox.querySelectorAll('.quiz-opt').forEach((bb, j) => {
          bb.disabled = true;
          if (j === item.a) bb.classList.add('correct');
          else if (j === i) bb.classList.add('wrong');
        });
        const ex = card.querySelector('.q-explain');
        ex.textContent = (correct ? '✓ 回答正确。' : '✗ 再想想。') + item.ex;
        ex.classList.add('show');
        card.querySelector('.q-score').textContent = `得分：${score}`;
        const next = document.createElement('button');
        next.type = 'button'; next.className = 'ctl-btn active';
        next.textContent = idx < QUIZ.length - 1 ? '下一题 →' : '查看成绩 →';
        next.addEventListener('click', () => { idx++; idx < QUIZ.length ? renderQ() : renderResult(); });
        card.querySelector('.q-foot').appendChild(next);
      });
      optsBox.appendChild(b);
    });
    panel.appendChild(card);
  }
  function renderResult() {
    panel.innerHTML = '';
    const card = document.createElement('div');
    card.className = 'quiz-card q-result';
    const pct = Math.round((score / QUIZ.length) * 100);
    card.innerHTML = `
      <div class="q-progress">检测完成</div>
      <div class="big">${score} / ${QUIZ.length}</div>
      <p style="color:var(--text-dim);margin:4px 0 18px">正确率 ${pct}%${pct >= 80 ? '，大气环流这一章你已经吃得相当透了！' : pct >= 60 ? '，大部分概念已清楚，回顾一下错题。' : '，建议回到前面章节再看一遍哦。'}</p>`;
    const again = document.createElement('button');
    again.type = 'button'; again.className = 'ctl-btn active'; again.textContent = '重新测验';
    again.addEventListener('click', () => { idx = 0; score = 0; renderQ(); });
    const back = document.createElement('button');
    back.type = 'button'; back.className = 'ctl-btn'; back.textContent = '返回第一章节';
    back.addEventListener('click', () => { panel.remove(); selectChapter(0); });
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:10px;justify-content:center';
    row.appendChild(back); row.appendChild(again);
    card.appendChild(row);
    panel.appendChild(card);
  }
  renderQ();
  activeSectionCleanup = () => panel.remove();
}

/* ---------------- 启动 ---------------- */

loadAll([
  { key: 'day', label: '地球', job: loadTexture(TEXDIR + 'earth/day-DmukkgAy.webp') },
  { key: 'sky', label: '环境光', job: loadHDR(TEXDIR + 'sky/sky_court-BLHJ2ADI.hdr') },
], (d, t, label) => loader.setText(`正在加载 ${d}/${t}（${label}）`)).then((t) => {
  earthMesh = new THREE.Mesh(
    new THREE.SphereGeometry(GR, 72, 48),
    new THREE.MeshPhongMaterial({ map: t.day, shininess: 4, specular: new THREE.Color(0x1c2733) })
  );
  globeG.add(earthMesh);
  globeG.add(makeStars(120, 900));
  scene.environment = t.sky;

  beltLabels.forEach((s) => { s.visible = false; });
  windLabels.forEach((s) => { s.visible = false; });

  loader.hide();
  initLayoutShell();
  selectChapter(0);

  app.onFrame((dt) => {
    if (!state.playing) return;
    t_global += dt;
    const sec = SECTIONS[chapterIdx] || SECTIONS[0];
    if (state.mode === 'globe') {
      tickGlobe(dt);
      // 气压带随季节移动
      beltG.rotation.z = -state.season * DEG * 0.85;
      // 太阳方向
      const sd = new THREE.Vector3(Math.cos(state.season * DEG), Math.sin(state.season * DEG), 0.55).normalize();
      sunLight.position.copy(sd).multiplyScalar(12);
      sunSprite.position.copy(sd).multiplyScalar(GR * 3.2);
      craftTick(dt, t_global);
      if (sec.hudTick) sec.hudTick();
    } else {
      tickCross(dt, t_global);
      if (sec.tick) sec.tick(dt);
      craftTick(dt, t_global);
    }
  });
}).catch((err) => {
  loader.setText('资源加载失败：' + err.message);
  console.error(err);
});

let activeSectionCleanup = () => {};

/* ================= 三栏布局驱动（左栏章节列表 / 右栏详解联动 / 栏折叠 / 专注模式） ================= */

const chapNav = document.getElementById('chapNav');
const chapCount = document.getElementById('chapCount');
const detailNo = document.getElementById('detailNo');
const detailTitle = document.getElementById('detailTitle');
const lessonEl = document.getElementById('lesson');
const detailBody = document.getElementById('detailBody');
const controlsEl = document.getElementById('controls');
let chapterIdx = 0;

/* 11 章竖排按钮：序号 + 标题，点击切章，当前章 .on 高亮 */
const chapBtns = SECTIONS.map((s, i) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'chap-btn';
  b.dataset.idx = String(i);
  const n = document.createElement('span');
  n.className = 'chap-n';
  n.textContent = String(i + 1).padStart(2, '0');
  const t = document.createElement('span');
  t.className = 'chap-t';
  t.textContent = s.title;
  b.append(n, t);
  b.addEventListener('click', () => selectChapter(i));
  chapNav.appendChild(b);
  return b;
});

function selectChapter(i) {
  chapterIdx = clamp(i, 0, SECTIONS.length - 1);
  const sec = SECTIONS[chapterIdx];
  chapBtns.forEach((b, j) => {
    const on = j === chapterIdx;
    b.classList.toggle('on', on);
    if (on) {
      b.setAttribute('aria-current', 'true');
      b.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    } else {
      b.removeAttribute('aria-current');
    }
  });
  chapCount.textContent = `${String(chapterIdx + 1).padStart(2, '0')}/${SECTIONS.length}`;
  detailNo.textContent = String(chapterIdx + 1).padStart(2, '0');
  detailTitle.textContent = sec.title;
  /* 折叠竖条上的章节信息同步（左栏序号 / 右栏竖排标题） */
  railNoL.textContent = String(chapterIdx + 1).padStart(2, '0');
  railTitleR.textContent = sec.title;
  lessonEl.innerHTML = sec.html || '';
  if (activeSectionCleanup) { activeSectionCleanup(); activeSectionCleanup = () => {}; }
  /* 切章先收读数卡：需要读数的章在 enter() 里自行 show+set（避免上一章读数残留） */
  hud.show(false);
  monsoonG.visible = false;
  sec.enter();
  /* 本章无控件 / 读数隐藏时整块手风琴收走（不动用户的手风琴偏好） */
  accSecs.controls.classList.toggle('acc-empty', !controlsEl.children.length);
  accSecs.data.classList.toggle('acc-empty', hud.el.style.display === 'none');
  detailBody.scrollTop = 0;
}

/* ---------------- 栏折叠（左右独立 28px 竖条）× 专注模式（双栏同折）统一管理 ---------------- */

const foldLBtn = document.getElementById('foldLBtn');
const unfoldLBtn = document.getElementById('unfoldLBtn');
const foldRBtn = document.getElementById('foldRBtn');
const unfoldRBtn = document.getElementById('unfoldRBtn');
const railNoL = document.getElementById('railNoL');
const railTitleR = document.getElementById('railTitleR');
const atmosShell = document.getElementById('atmosShell');
const focusBtn = document.getElementById('focusBtn');

const FOLD_KEY = { l: 'atmos.foldL', r: 'atmos.foldR' };
let foldL = false;
let foldR = false;
let focusSaved = null; /* 进入专注模式前的独立折叠状态 [foldL, foldR]，退出时恢复 */

try {
  foldL = localStorage.getItem(FOLD_KEY.l) === '1';
  foldR = localStorage.getItem(FOLD_KEY.r) === '1';
} catch (e) { /* localStorage 不可用（隐私模式等）时仅本次会话内生效 */ }

function applyFold() {
  atmosShell.classList.toggle('fold-l', foldL);
  atmosShell.classList.toggle('fold-r', foldR);
  for (const [btn, folded] of [[foldLBtn, foldL], [unfoldLBtn, foldL], [foldRBtn, foldR], [unfoldRBtn, foldR]]) {
    btn.setAttribute('aria-expanded', String(!folded));
  }
}

/* 专注模式：双栏同时折叠；退出恢复进入前状态（不写 localStorage，保持独立折叠记忆不变） */
function setFocus(on) {
  if (on && focusSaved === null) {
    focusSaved = [foldL, foldR];
    foldL = true;
    foldR = true;
  } else if (!on && focusSaved !== null) {
    [foldL, foldR] = focusSaved;
    focusSaved = null;
  }
  atmosShell.classList.toggle('focus-mode', on);
  focusBtn.textContent = on ? '退出专注' : '专注模式';
  focusBtn.setAttribute('aria-pressed', String(on));
  applyFold();
}

function toggleFold(side) {
  if (focusSaved !== null) setFocus(false);
  if (side === 'l') foldL = !foldL;
  else foldR = !foldR;
  try {
    localStorage.setItem(FOLD_KEY[side], (side === 'l' ? foldL : foldR) ? '1' : '0');
  } catch (e) { /* 忽略持久化失败 */ }
  applyFold();
}

foldLBtn.addEventListener('click', () => toggleFold('l'));
unfoldLBtn.addEventListener('click', () => toggleFold('l'));
foldRBtn.addEventListener('click', () => toggleFold('r'));
unfoldRBtn.addEventListener('click', () => toggleFold('r'));
focusBtn.addEventListener('click', () => setFocus(focusSaved === null));
applyFold();

/* ---------------- 右栏三块手风琴（详解 / 控件 / 读数），localStorage 记忆、切章不重置 ---------------- */

const ACC_KEYS = { lesson: 'atmos.accLesson', controls: 'atmos.accControls', data: 'atmos.accData' };
const accSecs = {
  lesson: document.getElementById('accLesson'),
  controls: document.getElementById('accControls'),
  data: document.getElementById('accData'),
};

const NARROW_VIEW = window.innerWidth <= 1100;   /* 小屏首访清爽态判据 */
const accClosed = {};
for (const name of Object.keys(accSecs)) {
  let saved = null;
  try { saved = localStorage.getItem(ACC_KEYS[name]); } catch (e) { /* 忽略 */ }
  /* 首访（无记忆）：≤1100px 默认收起数据读数；此后记忆优先，不随视口变 */
  accClosed[name] = saved !== null ? saved === '1' : (name === 'data' && NARROW_VIEW);
}
function applyAcc(name) {
  const sec = accSecs[name];
  sec.classList.toggle('closed', accClosed[name]);
  sec.querySelector('.acc-head').setAttribute('aria-expanded', String(!accClosed[name]));
}
function toggleAcc(name) {
  accClosed[name] = !accClosed[name];
  try { localStorage.setItem(ACC_KEYS[name], accClosed[name] ? '1' : '0'); } catch (e) { /* 忽略 */ }
  applyAcc(name);
}
for (const name of Object.keys(accSecs)) {
  accSecs[name].querySelector('.acc-head').addEventListener('click', () => toggleAcc(name));
  applyAcc(name);
}

function initLayoutShell() { /* 资源就绪后调用：折叠/手风琴监听已就位，占位保证加载失败路径不炸 */ }

window.__eduSections = { select: selectChapter };
/* 调试句柄（自动化验收/像素级自查用） */
window.__labDebug = { vfx, app };

