/* EduLab · 大气环流粒子课堂（atmos）
 * 章节：大气运动总览 / 热力环流原理 / 城市热岛环流 / 海陆风 / 山谷风 /
 *       单圈环流 / 三圈环流 / 气压带与风带 / 季节移动 / 海陆分布与季风 / 随堂检测
 * 场景：竖直截面粒子对流实验箱 + 三维地球（气压带/风带/季节移动/季风）
 */
import {
  THREE, DEG, TAU, clamp, loadTexture, loadHDR, loadAll, createApp,
  makeLoader, createControlsPanel, makeHUD, makeTextSprite, setSpriteText,
  circleLine, makeStars,
} from './edu-core.js';
import { attachVFX } from './edu-vfx.js';

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
    onInput: (v) => { state.amp = v; },
  });
}
function dayNightCtl(withAuto = true) {
  const seg = ctl.seg({
    options: [{ label: '白天', value: 1 }, { label: '夜晚', value: 0 }],
    value: 1,
    onChange: (v) => { state.dayK = v; state.autoDay = false; skySpriteSet(); },
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
  if (kind === 'cell') initCell();
  paintGround(kind === 'seam' ? 'sea' : kind === 'valley' ? 'valley' : kind === 'island' ? 'island' : 'plain');
  skySpriteSet();
}
function enterGlobe() {
  crossG.visible = false; globeG.visible = true;
  state.mode = 'globe';
  clearCrossLabels();
}

/* ---------------- 章节 ---------------- */

const SECTIONS = [
  {
    id: 'overview', title: '大气运动总览',
    html: `<p>大气运动的根本原因：太阳辐射在<b>地表分布不均</b>，造成高低纬度之间、海陆之间的<b>冷热差异</b>，空气从高压流向低压，形成环流。</p>
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
<p>调「受热强度」观察环流快慢。注意：近地面与高空的气压状况<b>相反</b>——热处近地面低压、高空高压。</p>`,
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
    html: `<p>城区人口密集、生产生活排放废热多，气温比郊区高，像一座<b>热的岛屿</b>——「城市热岛」。城区空气上升，郊区空气下沉，近地面风从<b>郊区吹向城区</b>。</p>
<p>这有利有弊：污染物在城区上升后向郊区扩散，但若郊区有污染源，近地面风又可能把污染物带回城区。调「热岛强度」看环流变化。</p>`,
    enter() {
      enterCross('island');
      addCrossLabel('城区', 0, 0.6, '#ffcf9a', 26);
      addCrossLabel('郊区', -4.4, 0.6, '#c9d6ea', 24);
      addCrossLabel('郊区', 4.4, 0.6, '#c9d6ea', 24);
      baseCtl(); ctl.sep(); ampCtl('热岛强度'); ctl.sep();
      ctl.toggle({ label: '标注', value: true, onChange: (v) => crossLabels.forEach((s) => { s.visible = v; }) });
      ctl.toggle({ label: '建筑剪影', value: true, onChange: (v) => { paintGround(v ? 'island' : 'plain'); } });
      hud.show(true);
      hud.set('a', '近地面风：郊区 → 城区');
      hud.set('b', '高空风：城区 → 郊区');
      hud.set('x', '');
      app.setCamera([0, 2.3, 11.5], [0, 2.1, 0]);
    },
  },
  {
    id: 'seam', title: '海陆风',
    html: `<p>海洋热容量大、升温和降温都慢；陆地升温快降温也快。<b>白天</b>：陆地升温快 → 陆地上升气流 → 近地面风从海洋吹向陆地（<b>海风</b>）；<b>夜晚</b>：陆地降温快 → 陆地下沉气流 → 近地面风从陆地吹向海洋（<b>陆风</b>）。</p>
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
    html: `<p>山地中坡地与谷底受热差异造成风向昼夜变化：<b>白天</b>山坡受热快，风沿山坡<b>向上</b>吹向山顶——<b>谷风</b>；<b>夜晚</b>山坡冷却快，冷空气沿山坡<b>下滑</b>入谷——<b>山风</b>。</p>
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
<p>现实中由于地球自转产生地转偏向力，单圈环流会被打散成三圈——下一节看它如何破碎。</p>`,
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
    html: `<p>加入<b>地球自转</b>（地转偏向力）后，每个半球形成<b>三个环流圈</b>：低纬环流圈（哈德莱）、中纬环流圈（费雷尔）、高纬环流圈（极地）。近地面形成<b>七个气压带、六个风带</b>。</p>
<p>旋转地球看表面粒子：<span style="color:#ffa564">橙色＝信风</span>、<span style="color:#79e68c">绿色＝西风</span>、<span style="color:#8fc4ff">蓝色＝极地东风</span>。北半球右偏、南半球左偏。</p>`,
    enter() {
      enterGlobe();
      baseCtl(); ctl.sep();
      ctl.toggle({ label: '气压带', value: true, onChange: (v) => { state.showBelts = v; beltMeshes.forEach((m) => { m.visible = v; }); } });
      ctl.toggle({ label: '风带粒子', value: true, onChange: (v) => { globePts.visible = v; } });
      app.setCamera([2.6, 1.7, 4.2], [0, 0, 0]);
    },
  },
  {
    id: 'belts', title: '气压带与风带',
    html: `<p><b>七个气压带</b>：赤道低气压带、两副热带高气压带、两副极地低气压带、两极地高气压带。<b>六个风带</b>：低纬信风带、中纬西风带、极地东风带（南北各一）。</p>
<p>记忆口诀：「高压带下沉干燥、低压带上升多雨」；风从高压吹向低压，再叠加地转偏向。开「风带标注」对照看南北半球对称的分布。</p>`,
    enter() {
      enterGlobe();
      baseCtl(); ctl.sep();
      ctl.toggle({ label: '气压带标注', value: true, onChange: (v) => { state.showBeltLabels = v; beltLabels.forEach((s) => { s.visible = v; }); } });
      ctl.toggle({ label: '风带标注', value: true, onChange: (v) => { state.showWindLabels = v; windLabels.forEach((s) => { s.visible = v; }); } });
      ctl.sep();
      ctl.toggle({ label: '气压带', value: true, onChange: (v) => beltMeshes.forEach((m) => { m.visible = v; }) });
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
      app.setCamera([2.6, 1.7, 4.2], [0, 0, 0]);
    },
  },
  {
    id: 'monsoon', title: '海陆分布与季风',
    html: `<p>巨大的海陆差异叠加气压带风带的季节移动，形成大范围随季节反转的风——<b>季风</b>。<b>冬季</b>：亚洲大陆冷却形成高压（蒙古—西伯利亚高压），风从大陆吹向海洋（我国盛行<b>西北风</b>）；<b>夏季</b>：大陆升温形成低压，风从海洋吹向大陆（东部盛行<b>东南风</b>，南亚为越赤道的<b>西南季风</b>）。</p>
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
      app.setCamera([3.4, 2.2, 3.0], [0.7, 0.4, -1.1]);
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
    opts: ['赤道低气压带盛行下沉气流', '副热带高气压带气流下沉、一般少雨', '极地高气压带气流上升多雨', '副极地低气压带盛行下沉气流'],
    a: 1,
    ex: '高压带盛行下沉气流、水汽不易凝结，一般干燥少雨；低压带盛行上升气流、多阴雨。赤道低压带多雨、副极地低压带也是上升气流。',
  },
  {
    q: '我国东部夏季盛行东南风，主要原因是？',
    opts: ['气压带风带的位置没有变化', '夏季陆地升温快形成低压，风从海洋吹向陆地', '夏季海洋是高压', '地形阻挡'],
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
      <p style="color:var(--text-dim);margin:4px 0 18px">正确率 ${pct}%${pct >= 80 ? '，大气环流已经掌握得很扎实！' : pct >= 60 ? '，大部分概念已清楚，回顾一下错题。' : '，建议回到前面章节再看一遍哦。'}</p>`;
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
    } else {
      tickCross(dt, t_global);
      if (sec.tick) sec.tick(dt);
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

