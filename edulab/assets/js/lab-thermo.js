/* EduLab · 热力学工作站（thermo）
 * 章节：热力学工作站 / 分子热运动与温度 / 气体压强从哪里来 / 玻意耳定律 /
 *       盖-吕萨克定律 / 查理定律 / 做功与内能 / 热力学第一定律 / 四冲程汽油机 /
 *       热机效率与卡诺循环 / 热力学第二定律 / 自由实验
 * 场景：傍晚工作室里的热学工作站——玻璃气缸（分子可见）、活塞、加热圈、
 *       两块屏幕（p–V 图 / 速率分布或定律图线）、控制旋钮；剖开的四冲程汽油机；
 *       自由扩散演示箱。全部程序化建模。
 */
import {
  THREE, clamp, TAU,
  loadHDR, loadTexture, loadAll, createApp, cameraTweenTick, makeLoader,
  createSections, createControlsPanel, makeHUD, makeTextSprite, setSpriteText,
} from './edu-core.js';

const lerp = (a, b, t) => a + (b - a) * t;

/* ---------------- 基础 ---------------- */

const stage = document.getElementById('stage');
const loader = makeLoader(stage, '正在布置热学工作站…');
const app = createApp({
  container: stage,
  fov: 42, near: 0.05, far: 200,
  cameraPos: [1.7, 2.3, 3.7], target: [0.35, 1.7, 0],
  minDistance: 0.6, maxDistance: 40,
  keepBackground: true,
});
const { scene, camera, controls } = app;

const R = 8.314;             // J/(mol·K)
const KV = (n, T, VL) => (n * R * T) / (VL * 1e-3) / 1000;   // kPa，V 单位 L

/* 气体状态（教学量程） */
const G = {
  N: 70,            // 示意分子数（滑杆）
  T: 300,           // K
  V: 1.0,           // L
  heat: false,
  nMol() { return this.N * 8.571e-4; },   // N=70 → 0.06 mol
  pKPa() { return KV(this.nMol(), this.T, this.V); },
};

/* ---------------- 本实验专属样式 ---------------- */

const style = document.createElement('style');
style.textContent = `
.th-thermo {
  position:absolute; top:14px; left:50%; transform:translateX(-50%);
  z-index:9; display:flex; gap:8px; flex-wrap:wrap; justify-content:center;
  max-width: calc(100% - 24px);
}
.th-thermo .tcell {
  padding:5px 12px; border-radius:10px; font-size:13px; line-height:1.4;
  background: color-mix(in srgb, var(--card) 88%, transparent);
  border:1px solid var(--card-border); color:var(--text);
}
.th-thermo .tcell b { color: var(--accent); font-size:14px; }
`;
document.head.appendChild(style);

/* ---------------- 通用小件 ---------------- */

const M = (color, rough = 0.8, metal = 0) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal });
const box = (w, h, d, mat) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
const cyl = (rt, rb, h, mat, seg = 20) => new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);

function lbl(text, color = '#ffd9a8', scale = 0.0055) {
  return makeTextSprite(text, { fontSize: 30, color, scale, bg: 'rgba(24,16,12,0.66)' });
}

/* ---------------- 场景注册（懒建） ---------------- */

const scenes = {};
let activeScene = null;
function useScene(key, build) {
  if (activeScene && activeScene !== scenes[key]) activeScene.visible = false;
  if (!scenes[key]) {
    const g = new THREE.Group();
    g.visible = false;
    scene.add(g);
    scenes[key] = g;
  }
  const g = scenes[key];
  if (!g.userData.built) { build(g); g.userData.built = true; }
  g.visible = true;
  activeScene = g;
  return g;
}

/* ---------------- 工作站场景（主场景） ---------------- */

const STN = { molecules: null, pollen: null, heater: null, piston: null, knobs: {}, screenA: null, screenB: null };

let deskMat;
function buildStudio(g, tex) {
  scene.background = new THREE.Color(0x27202a);      // 傍晚室内
  scene.environment = tex.env;
  deskMat = new THREE.MeshStandardMaterial({ map: tex.plank, normalMap: tex.plankN, color: 0xc9a97e, roughness: 0.75 });
  // 地板与后墙
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), M(0x4a3d3f, 0.95));
  floor.rotation.x = -Math.PI / 2;
  g.add(floor);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(30, 12), M(0x4e4249, 0.95));
  wall.position.set(0, 6, -6);
  g.add(wall);
  // 工作台
  const desk = box(3.9, 0.14, 1.7, deskMat);
  desk.position.y = 1.1;
  g.add(desk);
  for (const [lx, lz] of [[-1.7, -0.66], [1.7, -0.66], [-1.7, 0.66], [1.7, 0.66]]) {
    const leg = box(0.12, 1.03, 0.12, M(0x3a332f, 0.8));
    leg.position.set(lx, 0.515, lz);
    g.add(leg);
  }
  // 暖色吊灯 + 屏幕冷光
  const lampLight = new THREE.PointLight(0xffc07a, 18, 9, 2);
  lampLight.position.set(0.3, 3.2, 0.8);
  g.add(lampLight);
  const shade = cyl(0.3, 0.5, 0.28, M(0x35302c, 0.6), 20);
  shade.position.set(0.3, 3.3, 0.8);
  g.add(shade);
  g.add(new THREE.HemisphereLight(0x8a7a90, 0x2a2026, 0.55));
  const fill = new THREE.DirectionalLight(0xfff0e0, 0.9);
  fill.position.set(2, 4, 3);
  g.add(fill);

  buildCylinder(g);
  buildScreens(g, tex);
  buildKnobs(g);
  buildMolecules(g);
}

/* ---- 玻璃气缸 + 活塞 + 加热圈 ---- */
const CYL = { cx: -1.05, r: 0.34, y0: 1.32, hMax: 1.0, vMin: 0.2, vMax: 2.0 };

function buildCylinder(g) {
  const base = box(1.0, 0.16, 0.6, M(0x39332e, 0.7, 0.2));
  base.position.set(CYL.cx, 1.24, 0);
  g.add(base);
  // 玻璃筒
  const glass = new THREE.Mesh(
    new THREE.CylinderGeometry(CYL.r, CYL.r, CYL.hMax + 0.16, 28, 1, true),
    new THREE.MeshPhysicalMaterial({ color: 0xbfd8e8, roughness: 0.06, metalness: 0, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false })
  );
  glass.position.set(CYL.cx, CYL.y0 + (CYL.hMax + 0.16) / 2 - 0.02, 0);
  g.add(glass);
  // 底盘（导热底座）
  const plate = cyl(CYL.r + 0.04, CYL.r + 0.04, 0.05, M(0x6f7478, 0.4, 0.7), 28);
  plate.position.set(CYL.cx, CYL.y0 - 0.03, 0);
  g.add(plate);
  // 加热圈（3 环，发红光）
  STN.heater = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.22 - i * 0.05, 0.02, 8, 28),
      new THREE.MeshStandardMaterial({ color: 0x583030, roughness: 0.5, metalness: 0.6, emissive: 0xff4a1a, emissiveIntensity: 0 }));
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -0.06 - i * 0.045;
    STN.heater.add(ring);
  }
  STN.heater.position.set(CYL.cx, CYL.y0 + 0.02, 0);
  g.add(STN.heater);
  // 活塞 + 连杆 + 顶盖
  STN.piston = new THREE.Group();
  const disc = cyl(CYL.r - 0.02, CYL.r - 0.02, 0.07, M(0x9aa1a8, 0.35, 0.8), 28);
  const seal = cyl(CYL.r - 0.005, CYL.r - 0.005, 0.03, M(0x3a3f44, 0.6), 28);
  seal.position.y = -0.045;
  const rod = cyl(0.025, 0.025, 1.3, M(0xb8bec4, 0.3, 0.8), 12);
  rod.position.y = 0.6;
  const cap = cyl(0.09, 0.09, 0.05, M(0x8a9096, 0.4, 0.6), 16);
  cap.position.y = 1.24;
  STN.piston.add(disc, seal, rod, cap);
  g.add(STN.piston);
  // 支架柱
  for (const dx of [-0.42, 0.42]) {
    const post = box(0.05, 1.45, 0.05, M(0x4a443e, 0.6, 0.4));
    post.position.set(CYL.cx + dx, CYL.y0 + 0.68, -0.38);
    g.add(post);
  }
  const topBar = box(0.94, 0.06, 0.08, M(0x4a443e, 0.6, 0.4));
  topBar.position.set(CYL.cx, CYL.y0 + 1.42, -0.38);
  g.add(topBar);
  updPiston();
}
const pistonY = () => CYL.y0 + 0.06 + (G.V - CYL.vMin) / (CYL.vMax - CYL.vMin) * (CYL.hMax - 0.12);
function updPiston() {
  STN.piston.position.set(CYL.cx, pistonY(), 0);
  STN.piston.visible = G.V > CYL.vMin + 0.01;
}

/* ---- 双屏（CanvasTexture） ---- */
function buildScreens(g, tex) {
  function makeScreen(x, title) {
    const grp = new THREE.Group();
    const frame = box(1.24, 0.94, 0.05, M(0x2e2a27, 0.55, 0.3));
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 384;
    const ctx = canvas.getContext('2d');
    const texC = new THREE.CanvasTexture(canvas);
    texC.colorSpace = THREE.SRGBColorSpace;
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(1.16, 0.87),
      new THREE.MeshBasicMaterial({ map: texC }));
    scr.position.z = 0.032;
    const stand = box(0.3, 0.05, 0.3, M(0x39332e, 0.6, 0.3));
    stand.position.y = -0.5;
    const neck = box(0.05, 0.1, 0.05, M(0x39332e, 0.6, 0.3));
    neck.position.y = -0.43;
    const t = lbl(title, '#ffcf9c', 0.0042);
    t.position.y = 0.58;
    grp.add(frame, scr, stand, neck, t);
    grp.position.set(x, 1.86, -0.42);
    g.add(grp);
    return { canvas, ctx, tex: texC, screen: scr };
  }
  STN.screenA = makeScreen(0.35, 'p–V 图');
  STN.screenB = makeScreen(1.62, '速率分布');
}

/* ---- 控制旋钮（装饰联动） ---- */
function buildKnobs(g) {
  const panel = box(1.5, 0.06, 0.5, M(0x3a332e, 0.65, 0.2));
  panel.position.set(0.5, 1.16, 0.62);
  g.add(panel);
  ['N', 'T', 'V'].forEach((k, i) => {
    const knob = new THREE.Group();
    const body = cyl(0.075, 0.085, 0.06, M(0xd8d3ca, 0.4, 0.2), 22);
    body.rotation.x = Math.PI / 2;
    const notch = box(0.02, 0.012, 0.064, M(0xe8674a, 0.5));
    notch.position.set(0, 0.05, 0.01);
    knob.add(body, notch);
    knob.position.set(0.5 - 0.55 + i * 0.55, 1.165, 0.72);
    g.add(knob);
    const t = lbl(k, '#ffcf9c', 0.0035);
    t.position.set(knob.position.x, 1.34, 0.72);
    g.add(t);
    STN.knobs[k] = knob;
  });
  updKnobs();
}
function updKnobs() {
  STN.knobs.N.rotation.z = -(G.N - 80) / 60 * 1.3;
  STN.knobs.T.rotation.z = -(G.T - 360) / 240 * 1.3;
  STN.knobs.V.rotation.z = -(G.V - 1.2) / 0.8 * 1.3;
}

/* ---- 分子（InstancedMesh） ---- */
const NM_MAX = 140;
const mols = [];
for (let i = 0; i < NM_MAX; i++) {
  mols.push({ p: new THREE.Vector3(), v: new THREE.Vector3() });
}
function resetMols() {
  const py = pistonY();
  mols.forEach((m, i) => {
    const a = Math.random() * TAU, rr = Math.sqrt(Math.random()) * (CYL.r - 0.06);
    m.p.set(CYL.cx + Math.cos(a) * rr, CYL.y0 + 0.06 + Math.random() * Math.max(py - CYL.y0 - 0.12, 0.05), Math.sin(a) * rr);
    const th = Math.random() * TAU, ph = Math.acos(2 * Math.random() - 1);
    const sigma = 0.55 / 1.2533;                     // 瑞利分布 σ，均值 ≈ 0.55
    const sp = sigma * Math.sqrt(-2 * Math.log(Math.max(Math.random(), 1e-6)));
    m.v.set(sp * Math.sin(ph) * Math.cos(th), sp * Math.cos(ph), sp * Math.sin(ph) * Math.sin(th));
  });
}
function buildMolecules(g) {
  const geo = new THREE.SphereGeometry(0.028, 8, 6);
  const mat = new THREE.MeshStandardMaterial({ color: 0xffa25e, roughness: 0.4, emissive: 0x974a10, emissiveIntensity: 0.45 });
  STN.molecules = new THREE.InstancedMesh(geo, mat, NM_MAX);
  STN.molecules.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  STN.molecules.frustumCulled = false;
  g.add(STN.molecules);
  // 布朗花粉颗粒
  STN.pollen = new THREE.Mesh(new THREE.SphereGeometry(0.062, 12, 10),
    new THREE.MeshStandardMaterial({ color: 0xd8cfa8, roughness: 0.9 }));
  STN.pollen.position.set(CYL.cx, CYL.y0 + 0.4, 0);
  STN.pollen.visible = false;
  g.add(STN.pollen);
  resetMols();
}
const dummy = new THREE.Object3D();
function stepMols(dt) {
  const py = pistonY();
  const target = 0.55 * Math.sqrt(G.T / 300);
  let speedSum = 0;
  mols.forEach((m) => speedSum += m.v.length());
  const avg = speedSum / mols.length || 1;
  const k = clamp((target / avg - 1) * dt * 1.5, -0.06, 0.06);
  mols.forEach((m) => {
    m.v.multiplyScalar(1 + k);
    m.p.addScaledVector(m.v, dt * 1.6);
    // 碰壁反弹
    const dx = m.p.x - CYL.cx, dz = m.p.z;
    const rr = Math.sqrt(dx * dx + dz * dz);
    if (rr > CYL.r - 0.035) {
      const nx = dx / rr, nz = dz / rr;
      const dot = m.v.x * nx + m.v.z * nz;
      if (dot > 0) { m.v.x -= 2 * dot * nx; m.v.z -= 2 * dot * nz; }
      m.p.x = CYL.cx + nx * (CYL.r - 0.04);
      m.p.z = nz * (CYL.r - 0.04);
    }
    if (m.p.y < CYL.y0 + 0.05) { m.p.y = CYL.y0 + 0.05; if (m.v.y < 0) m.v.y *= -1; }
    if (m.p.y > py - 0.05) { m.p.y = py - 0.05; if (m.v.y > 0) m.v.y *= -1; }
  });
  const showN = Math.min(G.N, NM_MAX);
  for (let i = 0; i < NM_MAX; i++) {
    const m = mols[i];
    dummy.position.copy(m.p);
    const sc = i < showN ? 1 : 0.0001;
    dummy.scale.setScalar(sc);
    dummy.updateMatrix();
    STN.molecules.setMatrixAt(i, dummy.matrix);
  }
  STN.molecules.instanceMatrix.needsUpdate = true;
  // 布朗运动
  if (STN.pollen.visible) {
    const t = performance.now() * 0.001;
    STN.pollen.position.set(
      CYL.cx + Math.sin(t * 1.7) * 0.12 + Math.sin(t * 5.3) * 0.04,
      CYL.y0 + 0.42 + Math.sin(t * 2.3) * 0.1 + Math.sin(t * 6.1) * 0.03,
      Math.cos(t * 1.9) * 0.12 + Math.cos(t * 4.7) * 0.04
    );
  }
}

/* ---- 屏幕绘制 ---- */

function axes(ctx, x0, y0, w, h, xl, yl) {
  const st = getComputedStyle(document.documentElement);
  ctx.clearRect(0, 0, 512, 384);
  ctx.fillStyle = '#1d2126';
  ctx.fillRect(0, 0, 512, 384);
  ctx.strokeStyle = '#55606a'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(x0, y0 - h); ctx.lineTo(x0, y0); ctx.lineTo(x0 + w, y0); ctx.stroke();
  ctx.fillStyle = '#9aa8b4'; ctx.font = '17px sans-serif';
  ctx.fillText(xl, x0 + w - 46, y0 + 24);
  ctx.fillText(yl, x0 + 6, y0 - h + 8);
}
const AX = { x0: 56, y0: 330, w: 424, h: 270 };

function drawScreenA(mode) {
  const { ctx } = STN.screenA;
  const st = getComputedStyle(document.documentElement);
  const accent = '#ff9b5e';
  axes(ctx, AX.x0, AX.y0, AX.w, AX.h, 'V/L', 'p/kPa');
  const n = G.nMol();
  const vToX = (v) => AX.x0 + (v / 2.3) * AX.w;
  const pToY = (p) => AX.y0 - (p / 520) * AX.h;
  // 等温参考线（淡）
  ctx.strokeStyle = '#3d4a58'; ctx.setLineDash([4, 5]); ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let i = 0; i <= 60; i++) {
    const v = 0.25 + (i / 60) * 2.0;
    const p = KV(n, G.T, v);
    const x = vToX(v), y = pToY(Math.min(p, 520));
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.setLineDash([]);
  // 章节曲线
  if (mode === 'boyle') {
    ctx.strokeStyle = accent; ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i <= 60; i++) {
      const v = 0.25 + (i / 60) * 2.0;
      const x = vToX(v), y = pToY(Math.min(KV(n, G.T, v), 520));
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  } else if (mode === 'isobar') {
    const p = G.pKPa();
    ctx.strokeStyle = accent; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(vToX(0.2), pToY(p)); ctx.lineTo(vToX(2.2), pToY(p)); ctx.stroke();
    ctx.fillStyle = '#c9d6e2'; ctx.font = '15px sans-serif';
    ctx.fillText('p = ' + p.toFixed(0) + ' kPa（恒定）', vToX(0.35), pToY(p) - 10);
  } else if (mode === 'isochor') {
    ctx.strokeStyle = accent; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(vToX(G.V), AX.y0); ctx.lineTo(vToX(G.V), pToY(520)); ctx.stroke();
    ctx.fillStyle = '#c9d6e2'; ctx.font = '15px sans-serif';
    ctx.fillText('V = ' + G.V.toFixed(2) + ' L（恒定）', vToX(G.V) + 8, pToY(470));
  } else if (mode === 'carnot') {
    drawCarnotLoop(ctx, vToX, pToY, accent);
  }
  // 当前状态点
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(vToX(G.V), pToY(Math.min(G.pKPa(), 520)), 6, 0, TAU);
  ctx.fill();
  STN.screenA.tex.needsUpdate = true;
}

const CAR = { T1: 600, T2: 300, t: 0, animate: true };
function carnotPts() {
  const n = G.nMol();
  const VA = 0.5, VB = 1.35, ratio = Math.pow(CAR.T1 / Math.max(CAR.T2, 120), 1.5);
  const VC = Math.min(VB * ratio, 2.15), VD = Math.min(VA * ratio, 2.15);
  const P = (T, V) => KV(n, T, V);
  return {
    A: { v: VA, p: P(CAR.T1, VA) }, B: { v: VB, p: P(CAR.T1, VB) },
    C: { v: VC, p: P(CAR.T2, VC) }, D: { v: VD, p: P(CAR.T2, VD) },
    VA, VB, VC, VD,
  };
}
function drawCarnotLoop(ctx, vToX, pToY, accent) {
  const { A, B, C, D } = carnotPts();
  const n = G.nMol();
  const line = (pts) => {
    ctx.beginPath();
    pts.forEach((q, i) => { const x = vToX(q.v), y = pToY(Math.min(q.p, 520)); if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); });
    ctx.stroke();
  };
  const isoT = (T, v0, v1) => {
    const pts = [];
    for (let i = 0; i <= 30; i++) { const v = lerp(v0, v1, i / 30); pts.push({ v, p: KV(n, T, v) }); }
    line(pts);
  };
  const adiabat = (T0, v0, T1e, v1) => {
    const pts = [];
    for (let i = 0; i <= 30; i++) {
      const k = i / 30;
      const v = lerp(v0, v1, k);
      const T = T0 * Math.pow(v0 / v, 2 / 3);
      pts.push({ v, p: KV(n, T, v) });
    }
    line(pts);
  };
  ctx.strokeStyle = '#e8a15e'; ctx.lineWidth = 2.2;
  isoT(CAR.T1, A.v, B.v);
  ctx.strokeStyle = '#6fb3e0'; ctx.lineWidth = 2.2;
  adiabat(CAR.T1, B.v, CAR.T2, C.v);
  ctx.strokeStyle = '#5ec8a8'; ctx.lineWidth = 2.2;
  isoT(CAR.T2, C.v, D.v);
  ctx.strokeStyle = '#8f8fd0'; ctx.lineWidth = 2.2;
  adiabat(CAR.T2, D.v, CAR.T1, A.v);
  // 状态点沿线循环
  const pt = carnotState(CAR.t);
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(vToX(pt.v), pToY(Math.min(pt.p, 520)), 7, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#c9d6e2'; ctx.font = '16px sans-serif';
  ctx.fillText('η卡诺 = 1 − T₂/T₁ = ' + ((1 - CAR.T2 / CAR.T1) * 100).toFixed(0) + '%', AX.x0 + 150, 52);
}
function carnotState(t) {
  const n = G.nMol();
  const { VA, VB, VC, VD } = carnotPts();
  const seg = (t * 4) % 4;
  const isoP = (T, v) => KV(n, T, v);
  const adT = (T0, v0, v) => T0 * Math.pow(v0 / v, 2 / 3);
  if (seg < 1) { const v = lerp(VA, VB, seg); return { v, p: isoP(CAR.T1, v) }; }
  if (seg < 2) { const v = lerp(VB, VC, seg - 1); return { v, p: isoP(adT(CAR.T1, VB, v), v) }; }
  if (seg < 3) { const v = lerp(VC, VD, seg - 2); return { v, p: isoP(CAR.T2, v) }; }
  const v = lerp(VD, VA, seg - 3);
  return { v, p: isoP(adT(CAR.T2, VD, v), v) };
}

function drawScreenB(mode) {
  const { ctx } = STN.screenB;
  const X0 = 56, Y0 = 330, W = 424, H = 270;
  if (mode === 'vt' || mode === 'pt') {
    const isV = mode === 'vt';
    axes(ctx, X0, Y0, W, H, isV ? 'T/K' : 'T/K', isV ? 'V/L' : 'p/kPa');
    const T0 = HIST.T0 || 300;
    // 过原点的直线（T₀ → 当前）
    ctx.strokeStyle = '#ff9b5e'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(X0, Y0);
    if (isV) ctx.lineTo(X0 + (620 / 640) * W, Y0 - (Math.min(G.V * 640 / Math.max(G.T, 80), 1.9) / 2.0) * H);
    else ctx.lineTo(X0 + (620 / 640) * W, Y0 - (Math.min(G.pKPa() * 640 / Math.max(G.T, 80), 500) / 520) * H);
    ctx.stroke();
    // T₀ 参考点
    ctx.fillStyle = '#6fb3e0';
    const p0 = isV ? G.V * T0 / G.T : G.pKPa() * T0 / G.T;
    ctx.beginPath();
    ctx.arc(X0 + (T0 / 640) * W, Y0 - (isV ? Math.min(p0, 2) / 2 : Math.min(p0, 500) / 520) * H, 5, 0, TAU);
    ctx.fill();
    // 当前点
    ctx.fillStyle = '#ff9b5e';
    ctx.beginPath();
    ctx.arc(X0 + (G.T / 640) * W, Y0 - (isV ? Math.min(G.V, 2) / 2 : Math.min(G.pKPa(), 500) / 520) * H, 6, 0, TAU);
    ctx.fill();
    const ratio = isV ? 'V/T' : 'p/T';
    ctx.fillStyle = '#9aa8b4'; ctx.font = '16px sans-serif';
    ctx.fillText(ratio + ' = 常量（过原点的直线）', X0 + 130, 60);
    STN.screenB.tex.needsUpdate = true;
    return;
  }
  // 速率分布：麦克斯韦–玻尔兹曼
  axes(ctx, X0, Y0, W, H, 'v/(m·s⁻¹)', '分子数占比');
  const curve = (T, color, dash) => {
    const vp = Math.sqrt(2 * 1.38e-23 * T / (4.65e-26)) ;   // 最概然速率（氮气）
    ctx.strokeStyle = color; ctx.lineWidth = 2.4;
    if (dash) ctx.setLineDash([5, 5]);
    ctx.beginPath();
    for (let i = 0; i <= 80; i++) {
      const v = (i / 80) * 900;
      const x = v / vp;
      const f = x * x * Math.exp(-x * x);
      const px = X0 + (v / 900) * W;
      const py = Y0 - f * H * 0.92;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    return vp;
  };
  if (HIST.T0 && HIST.T0 !== G.T) curve(HIST.T0, '#4f7fa8', true);
  const vp = curve(G.T, '#ff9b5e', false);
  // 实际分子直方图
  const bins = new Array(15).fill(0);
  mols.slice(0, Math.min(G.N, NM_MAX)).forEach((m) => {
    const sp = m.v.length() / 0.55 * Math.sqrt(300 / 300);   // 场景速率 → 相对
    const vPhys = sp * vp;                                    // 映射到物理尺度
    const bi = Math.min(14, Math.floor(vPhys / 900 * 15));
    bins[bi]++;
  });
  const mx = Math.max(...bins, 1);
  ctx.fillStyle = 'rgba(255,155,94,0.4)';
  bins.forEach((b, i) => {
    const bw = W / 15;
    const hgt = (b / mx) * H * 0.85;
    ctx.fillRect(X0 + i * bw + 1, Y0 - hgt, bw - 2, hgt);
  });
  ctx.fillStyle = '#c9d6e2'; ctx.font = '16px sans-serif';
  ctx.fillText('最概然速率 ≈ ' + vp.toFixed(0) + ' m/s（T = ' + G.T.toFixed(0) + ' K）', X0 + 96, 58);
  STN.screenB.tex.needsUpdate = true;
}
/* 记录的参考温度/初态 */
const HIST = { T0: 0, pts: [] };

/* ---------------- HUD / 读数条 ---------------- */

let hud = null;
function setHUD(rows) {
  if (hud) hud.el.remove();
  hud = makeHUD(stage, rows);
  hud.el.style.cssText = 'position:absolute;top:14px;right:14px;z-index:10;min-width:215px;';
  rows.forEach(([k]) => hud.set(k, '–'));
}
function hset(key, text) { if (hud) hud.set(key, text); }

const thermoBar = document.createElement('div');
thermoBar.className = 'th-thermo';
thermoBar.style.display = 'none';
stage.appendChild(thermoBar);
function setBar(cells) {
  if (!cells) { thermoBar.style.display = 'none'; return; }
  thermoBar.style.display = 'flex';
  thermoBar.innerHTML = cells.map(([k, v]) => `<div class="tcell">${k} <b>${v}</b></div>`).join('');
}

/* ---------------- 控制条与章节 ---------------- */

const ctl = createControlsPanel(document.getElementById('controls'));

function gasBar() {
  setBar([
    ['p =', G.pKPa().toFixed(1) + ' kPa'],
    ['V =', G.V.toFixed(2) + ' L'],
    ['T =', G.T.toFixed(0) + ' K'],
    ['n =', G.nMol().toFixed(3) + ' mol'],
  ]);
}
function slidersGas(opts = {}) {
  if (opts.N !== false) ctl.slider({ label: '分子数 N', min: 20, max: 140, step: 5, value: G.N, fmt: (v) => v + ' 个', onInput: (v) => { G.N = v; syncGas(); } });
  if (opts.T !== false) ctl.slider({ label: '温度 T', min: 120, max: 600, step: 5, value: G.T, fmt: (v) => v + ' K', onInput: (v) => { G.T = v; syncGas(); } });
  if (opts.V !== false) ctl.slider({ label: '体积 V（活塞）', min: 0.2, max: 2.0, step: 0.02, value: G.V, fmt: (v) => v.toFixed(2) + ' L', onInput: (v) => { G.V = v; syncGas(); } });
}
function syncGas() {
  updPiston(); updKnobs(); gasBar();
}

const SECTIONS = [
  {
    id: 'station', title: '热力学工作站',
    html: `<p>欢迎来到傍晚的热学工作站。中央是<b>玻璃气缸</b>：里面每个橙色小球就是一个气体分子，正以几百米每秒的速度乱撞；顶上是<b>活塞</b>（控制体积 V），底下是<b>加热圈</b>；右边两块屏幕实时画出 <span class="hl">p–V 图</span>和分子<span class="hl">速率分布</span>。</p>
<p>三个旋钮分别拧「分子数 N、温度 T、体积 V」——理想气体状态方程 <b>pV = nRT</b> 把它们绑在一起。</p>
<p>拖动三个滑杆，看分子、活塞、屏幕三处怎么联动。</p>`,
    enter() {
      useScene('studio', (g) => buildStudio(g, TEX));
      resetMols();
      STN.pollen.visible = false;
      app.setCamera([1.7, 2.3, 3.7], [0.35, 1.7, 0]);
      ctl.clear();
      slidersGas({});
      ctl.sep();
      ctl.toggle({ label: '加热器', value: G.heat, onChange: (v) => { G.heat = v; } });
      gasBar();
      setHUD([['eq', '状态方程'], ['pv', 'pV 乘积'], ['p', '压强'], ['tip', '提示']]);
      hset('eq', 'pV = nRT');
      hset('pv', (G.pKPa() * G.V).toFixed(1) + ' kPa·L');
      hset('p', G.pKPa().toFixed(1) + ' kPa');
      hset('tip', '三处画面同步变化');
      drawScreenA('plain'); drawScreenB('dist');
    },
  },
  {
    id: 'brownian', title: '分子热运动与温度',
    html: `<p>一切物质的分子都在<b>永不停息地做无规则热运动</b>。1827 年布朗看到悬浮在水的花粉颗粒不停乱动——正是液体分子从四面八方撞击它的结果。</p>
<p>温度越高，分子运动越剧烈：<span class="hl">温度是分子平均动能的标志</span>。速率分布图上，温度升高时整条曲线向高速方向移动、峰值变矮变宽。</p>
<p>拖动温度滑杆，看分子「跑」得多快；比较两条参考曲线（蓝色虚线 = T₀）。</p>`,
    enter() {
      useScene('studio', (g) => buildStudio(g, TEX));
      app.setCamera([-0.6, 1.9, 2.5], [-1.05, 1.75, 0]);
      ctl.clear();
      ctl.slider({ label: '温度 T', min: 120, max: 600, step: 5, value: G.T, fmt: (v) => v + ' K', onInput: (v) => { G.T = v; syncGas(); } });
      ctl.slider({ label: '对比温度 T₀', min: 120, max: 600, step: 5, value: 300, fmt: (v) => v + ' K', onInput: (v) => { HIST.T0 = v; } });
      ctl.sep();
      ctl.toggle({ label: '花粉颗粒（布朗运动）', value: true, onChange: (v) => { STN.pollen.visible = v; } });
      ctl.toggle({ label: '加热器', value: false, onChange: (v) => { G.heat = v; } });
      setHUD([['ek', '分子平均动能'], ['vp', '最概然速率'], ['pollen', '花粉'], ['law', '结论']]);
      STN.pollen.visible = true;
      gasBar();
      hset('law', 'T↑ → 平均动能↑');
      drawScreenA('plain'); drawScreenB('dist');
    },
  },
  {
    id: 'pressure', title: '气体压强从哪里来',
    html: `<p>气缸壁每时每刻被亿万个分子撞击。<b>大量分子撞击器壁的集体效果，就是压强</b>——单个分子微不足道，密集「雨点」才顶得住活塞。</p>
<p>宏观量与微观量的联系：<span class="hl">p = nRT/V</span>。分子数 N 翻倍 → 撞击更频繁 → p 翻倍；温度 T 升高 → 每次撞得更狠 → p 升高。</p>
<p>分别拧「分子数」和「温度」旋钮，看压强读数怎么响应。</p>`,
    enter() {
      useScene('studio', (g) => buildStudio(g, TEX));
      app.setCamera([-0.2, 2.0, 2.9], [-1.0, 1.75, 0]);
      ctl.clear();
      slidersGas({ V: false });
      ctl.slider({ label: '体积 V（活塞）', min: 0.2, max: 2.0, step: 0.02, value: G.V, fmt: (v) => v.toFixed(2) + ' L', onInput: (v) => { G.V = v; syncGas(); } });
      ctl.sep();
      ctl.toggle({ label: '加热器', value: false, onChange: (v) => { G.heat = v; } });
      gasBar();
      setHUD([['hits', '撞击效果'], ['p', '压强'], ['law', '公式'], ['unit', '单位']]);
      hset('hits', '大量分子撞壁的集体效果');
      hset('law', 'p = nRT/V');
      hset('unit', '1 kPa = 1000 Pa');
      drawScreenA('plain'); drawScreenB('dist');
    },
  },
  {
    id: 'boyle', title: '玻意耳定律',
    html: `<p><b>等温过程</b>：温度不变时，一定质量气体的压强与体积成反比：</p>
<p><span class="hl">p₁V₁ = p₂V₂</span>（玻意耳–马略特定律，1662）。p–V 图上是一条<b>双曲线</b>——「压下去，压力反弹」；改用 p–1/V 作图则是一条过原点的直线（化曲为直好验证）。温度越高，等温线离原点越远。</p>
<p>锁住温度，拖动活塞，屏幕上描出整条等温线；点「记录数据点」攒几组 p·V 看乘积是否恒定。</p>`,
    enter() {
      useScene('studio', (g) => buildStudio(g, TEX));
      app.setCamera([0.6, 2.0, 3.1], [0.1, 1.75, 0]);
      ctl.clear();
      ctl.slider({ label: '体积 V（活塞）', min: 0.2, max: 2.0, step: 0.02, value: G.V, fmt: (v) => v.toFixed(2) + ' L', onInput: (v) => { G.V = v; syncGas(); drawScreenA('boyle'); updBoyleHUD(); } });
      ctl.slider({ label: '恒温 T（实验条件）', min: 200, max: 500, step: 10, value: G.T, fmt: (v) => v + ' K', onInput: (v) => { G.T = v; syncGas(); drawScreenA('boyle'); updBoyleHUD(); } });
      ctl.sep();
      ctl.button({ label: '⌘ 记录数据点', onClick() { HIST.pts.push({ V: G.V, p: G.pKPa() }); updBoyleHUD(); } });
      ctl.button({ label: '✕ 清除记录', onClick() { HIST.pts.length = 0; updBoyleHUD(); } });
      gasBar();
      setHUD([['law', '定律'], ['pv', 'pV 乘积'], ['pts', '已记录'], ['note', '观察']]);
      hset('law', 'pV = 常量（T、n 不变）');
      updBoyleHUD();
      drawScreenA('boyle'); drawScreenB('dist');
    },
  },
  {
    id: 'gay', title: '盖-吕萨克定律',
    html: `<p><b>等压过程</b>：压强不变（活塞上方挂砝码、可自由移动）时，体积与热力学温度成正比：</p>
<p><span class="hl">V₁/T₁ = V₂/T₂</span>（1802）。V–T 图是<b>过原点的直线</b>——外推到 V=0 得到 −273.15 °C，那就是<b>绝对零度</b>的由来。</p>
<p>拧温度旋钮，看活塞随温度升降；右屏画出 V–T 直线（蓝点 = T₀ 参考态）。</p>`,
    enter() {
      useScene('studio', (g) => buildStudio(g, TEX));
      app.setCamera([0.9, 2.1, 3.4], [0.6, 1.8, 0]);
      ctl.clear();
      HIST.T0 = 300; HIST.V0 = G.V;
      ctl.slider({ label: '温度 T', min: 120, max: 600, step: 5, value: G.T, fmt: (v) => v + ' K', onInput: (v) => { G.T = v; G.V = clamp(HIST.V0 * G.T / HIST.T0, 0.2, 2.0); syncGas(); drawScreenA('isobar'); drawScreenB('vt'); updGayHUD(); } });
      ctl.slider({ label: '初始温度 T₀', min: 150, max: 500, step: 10, value: 300, fmt: (v) => v + ' K', onInput: (v) => { HIST.T0 = v; HIST.V0 = G.V * HIST.T0 / G.T; drawScreenB('vt'); } });
      ctl.sep();
      ctl.button({ label: '⌘ 记录数据点', onClick() { HIST.pts.push({ T: G.T, V: G.V }); updGayHUD(); } });
      ctl.button({ label: '✕ 清除记录', onClick() { HIST.pts.length = 0; updGayHUD(); } });
      gasBar();
      setHUD([['law', '定律'], ['vt', 'V/T 比值'], ['pts', '已记录'], ['note', '等压条件']]);
      hset('law', 'V/T = 常量（p、n 不变）');
      hset('note', '活塞可自由移动');
      updGayHUD();
      drawScreenA('isobar'); drawScreenB('vt');
    },
  },
  {
    id: 'charles', title: '查理定律',
    html: `<p><b>等容过程</b>：活塞卡死、体积不变时，压强与热力学温度成正比：</p>
<p><span class="hl">p₁/T₁ = p₂/T₂</span>（1787）。p–T 图同样过原点——这也是<b>查理温度计</b>（定容气体温度计）的原理。</p>
<p>拧温度旋钮，看压强读数线性变化；右屏画出 p–T 直线。</p>`,
    enter() {
      useScene('studio', (g) => buildStudio(g, TEX));
      app.setCamera([0.9, 2.1, 3.4], [0.6, 1.8, 0]);
      ctl.clear();
      HIST.T0 = 300;
      ctl.slider({ label: '温度 T', min: 120, max: 600, step: 5, value: G.T, fmt: (v) => v + ' K', onInput: (v) => { G.T = v; syncGas(); drawScreenA('isochor'); drawScreenB('pt'); updCharlesHUD(); } });
      ctl.slider({ label: '初始温度 T₀', min: 150, max: 500, step: 10, value: 300, fmt: (v) => v + ' K', onInput: (v) => { HIST.T0 = v; drawScreenB('pt'); } });
      ctl.sep();
      ctl.button({ label: '⌘ 记录数据点', onClick() { HIST.pts.push({ T: G.T, p: G.pKPa() }); updCharlesHUD(); } });
      ctl.button({ label: '✕ 清除记录', onClick() { HIST.pts.length = 0; updCharlesHUD(); } });
      gasBar();
      setHUD([['law', '定律'], ['pt', 'p/T 比值'], ['pts', '已记录'], ['note', '等容条件']]);
      hset('law', 'p/T = 常量（V、n 不变）');
      hset('note', '活塞已卡死');
      updCharlesHUD();
      drawScreenA('isochor'); drawScreenB('pt');
    },
  },
  {
    id: 'work', title: '做功与内能',
    html: `<p>猛地压下活塞，外界对气体<b>做功 W</b>，分子被「追上」加速——温度骤升；气缸底的棉花会被点燃，这就是<b>压缩引火</b>（迪塞尔原理）。</p>
<p>反之快速抽回活塞，气体对外做功，内能被抽走，温度骤降。</p>
<p>点「猛推活塞」和「快速抽回」，盯住温度读数：绝热（不传热）时，<span class="hl">TV^(γ−1) = 常量</span>（γ = 5/3）。</p>`,
    enter() {
      useScene('studio', (g) => buildStudio(g, TEX));
      app.setCamera([-0.5, 1.9, 2.7], [-1.0, 1.75, 0]);
      ctl.clear();
      ctl.slider({ label: '体积 V（活塞）', min: 0.2, max: 2.0, step: 0.02, value: G.V, fmt: (v) => v.toFixed(2) + ' L', onInput: (v) => { G.V = v; syncGas(); } });
      ctl.sep();
      ctl.button({ label: '⬇ 猛推活塞（压缩引火）', onClick() { adiabatic(G.V * 0.55); } });
      ctl.button({ label: '⬆ 快速抽回（降温）', onClick() { adiabatic(Math.min(G.V * 1.8, 2.0)); } });
      ctl.button({ label: '↺ 复位', onClick() { G.V = 1.0; G.T = 300; syncGas(); } });
      gasBar();
      setHUD([['w', '外界做功'], ['du', '内能变化'], ['t', '温度'], ['law', '绝热关系']]);
      hset('law', 'TV^(γ−1) = 常量');
      updWorkHUD();
      drawScreenA('plain'); drawScreenB('dist');
    },
  },
  {
    id: 'first-law', title: '热力学第一定律',
    html: `<p>改变内能只有两条路：传热 <b>Q</b>（吸热为正）和做功 <b>W</b>（外界对气体做功为正）：</p>
<p><span class="hl">ΔU = Q + W</span>。内能变了，温度跟着变：对理想气体 ΔU = n·C<sub>V</sub>·ΔT（C<sub>V</sub> = 3R/2）。</p>
<p>分别给 Q 和 W 设定数值，点「施加」：加热圈亮起来（Q&gt;0）或活塞移动（W≠0），温度按上式变化——能量只会转移和转化，不会凭空产生。</p>`,
    enter() {
      useScene('studio', (g) => buildStudio(g, TEX));
      app.setCamera([0.4, 2.0, 3.2], [0.2, 1.75, 0]);
      ctl.clear();
      ctl.slider({ label: '吸热 Q (kJ)', min: -40, max: 40, step: 2, value: 10, fmt: (v) => (v > 0 ? '+' : '') + v, onInput: (v) => { FL.Q = v; } });
      ctl.slider({ label: '外界做功 W (kJ)', min: -40, max: 40, step: 2, value: 0, fmt: (v) => (v > 0 ? '+' : '') + v, onInput: (v) => { FL.W = v; } });
      ctl.sep();
      ctl.button({ label: '⚡ 施加（ΔU = Q + W）', onClick() { applyFirstLaw(); } });
      ctl.button({ label: '↺ 复位 T=300K', onClick() { G.T = 300; G.V = 1.0; syncGas(); updFLHUD(); drawScreenA('plain'); drawScreenB('dist'); } });
      gasBar();
      setHUD([['q', 'Q 吸热'], ['w', 'W 做功'], ['du', 'ΔU'], ['law', 'ΔU = Q + W']]);
      updFLHUD();
      drawScreenA('plain'); drawScreenB('dist');
    },
  },
  {
    id: 'engine', title: '四冲程汽油机',
    html: `<p>内能→机械能的转化现场。剖开的单缸汽油机，一个工作循环 = 活塞往复两次（曲轴转两圈）：</p>
<p><b>① 吸气</b>（进气门开，吸入油气混合物）→ <b>② 压缩</b>（两门全闭，气体被压缩升温：<b>机械能转化为内能</b>）→ <b>③ 做功</b>（火花塞点火，燃气猛推活塞：<b>内能转化为机械能</b>——四个冲程只有这个对外输出）→ <b>④ 排气</b>（排气门开，废气推出）。其余三个冲程靠飞轮的惯性完成。</p>
<p>对应的理想循环是<b>奥托循环</b>：压缩比 r 越大，理想效率 <span class="hl">η = 1 − 1/r<sup>γ−1</sup></span> 越高——这就是赛车发动机追求高压缩比的原因（汽油机怕爆震，r 一般不超过 13）。</p>
<p>点四个冲程按钮逐步观察，或开自动运转提速。</p>`,
    enter() {
      useScene('engine', (g) => buildEngine(g));
      setBar(null);
      app.setCamera([1.5, 1.35, 3.2], [0, 1.3, 0]);
      ctl.clear();
      [['吸气', 0], ['压缩', 180], ['做功', 360], ['排气', 540]].forEach(([t, deg]) => {
        ctl.button({ label: t, onClick() { ENG.theta = deg * Math.PI / 180; ENG.running = false; paintStageBtns(); } });
      });
      ctl.sep();
      ctl.toggle({ label: '自动运转', value: ENG.running, onChange: (v) => { ENG.running = v; } });
      ctl.slider({ label: '转速', min: 30, max: 240, step: 10, value: ENG.rpm, fmt: (v) => v + ' 转/min', onInput: (v) => { ENG.rpm = v; } });
      ctl.slider({ label: '压缩比', min: 6, max: 13, step: 0.5, value: ENG.cr, fmt: (v) => v.toFixed(1) + ' : 1', onInput: (v) => { ENG.cr = v; } });
      setHUD([['stroke', '当前冲程'], ['crank', '曲轴转角'], ['valve', '气门'], ['eta', '理想效率（奥托）'], ['note', '只有做功冲程输出功']]);
    },
  },
  {
    id: 'carnot', title: '热机效率与卡诺循环',
    html: `<p>热机把<b>吸收的热 Q₁</b> 一部分变成有用功 W，其余排给冷源 Q₂：<span class="hl">η = W/Q₁ = 1 − Q₂/Q₁</span>。</p>
<p>卡诺证明：在温度 T₁（热源）与 T₂（冷源）之间工作的理想热机，效率存在上限 <b>η = 1 − T₂/T₁</b>——与用什么工质无关。p–V 图上的闭合曲线（两条等温线 + 两条绝热线）围出的面积就是每次循环的净功。</p>
<p>拧 T₁、T₂ 旋钮看效率上限怎么变：想更高效，要么烧得更热，要么把废热排得更冷。</p>`,
    enter() {
      useScene('studio', (g) => buildStudio(g, TEX));
      app.setCamera([0.9, 2.0, 3.3], [0.75, 1.85, 0]);
      ctl.clear();
      ctl.slider({ label: '热源温度 T₁', min: 400, max: 900, step: 10, value: CAR.T1, fmt: (v) => v + ' K', onInput: (v) => { CAR.T1 = v; } });
      ctl.slider({ label: '冷源温度 T₂', min: 250, max: 400, step: 10, value: CAR.T2, fmt: (v) => v + ' K', onInput: (v) => { CAR.T2 = v; } });
      ctl.sep();
      ctl.toggle({ label: '循环动画', value: CAR.animate, onChange: (v) => { CAR.animate = v; } });
      ctl.button({ label: '↺ 回到 A 点', onClick() { CAR.t = 0; } });
      gasBar();
      setHUD([['eta', '卡诺效率'], ['w', '净功（围成面积）'], ['q2', '排给冷源'], ['note', '上限永远 < 100%']]);
      updCarnotHUD();
      drawScreenA('carnot'); drawScreenB('dist');
    },
  },
  {
    id: 'second-law', title: '热力学第二定律',
    html: `<p>隔板抽开，气体自由扩散充满整个箱子——<b>自发</b>；把过程「倒放」，让所有分子自己退回左半边——<b>从不发生</b>。</p>
<p>这不是不可能，而是<b>概率小到宇宙尺度都等不来</b>：N 个分子全部回到左半的概率约 (1/2)<sup>N</sup>。热量自发从高温流向低温、气体自发扩散，都是同一个道理：<span class="hl">孤立系统总是走向更「无序」（熵增）</span>。<b>热力学第二定律</b>的两种表述：热量不能自发地从低温物体传到高温物体（<b>克劳修斯表述</b>）；不可能从单一热源吸热使之完全变成功而不产生其他影响（<b>开尔文表述</b>）。一切与热现象有关的宏观自然过程都是<b>不可逆</b>的。</p>
<p>先播放扩散，再点「倒放」感受一下这种不自然；减少分子数（比如 5 个），倒放就不再那么不可思议了。</p>`,
    enter() {
      useScene('diffuse', (g) => buildDiffuse(g));
      setBar(null);
      app.setCamera([0, 1.7, 2.8], [0, 1.5, 0]);
      ctl.clear();
      ctl.slider({ label: '分子数 N', min: 5, max: 80, step: 5, value: DIFF.N, fmt: (v) => v + ' 个', onInput: (v) => { DIFF.N = v; resetDiff(); } });
      ctl.sep();
      ctl.button({ label: '▶ 抽开隔板（自发扩散）', onClick() { playDiff(false); } });
      ctl.button({ label: '◀ 倒放（回到左半）', onClick() { playDiff(true); } });
      ctl.button({ label: '↺ 复位', onClick() { resetDiff(); } });
      setHUD([['state', '状态'], ['prob', '全回左半概率'], ['ent', '熵'], ['law', '第二定律']]);
      resetDiff();
    },
  },
  {
    id: 'free', title: '自由实验',
    html: `<p>工作站交给你：分子数、温度、活塞、加热器全部开放。试试：</p>
<p>① 等温压缩：缓缓压活塞，看 p–V 双曲线；② 绝热压缩：加热器关闭时快速压活塞（温度会飘）；③ 自由发挥，验证 pV = nRT。</p>
<p>两块屏幕始终实时显示当前状态。</p>`,
    enter() {
      useScene('studio', (g) => buildStudio(g, TEX));
      resetMols();
      STN.pollen.visible = false;
      app.setCamera([1.5, 2.2, 3.6], [0.35, 1.7, 0]);
      ctl.clear();
      slidersGas({});
      ctl.sep();
      ctl.toggle({ label: '加热器', value: G.heat, onChange: (v) => { G.heat = v; } });
      ctl.button({ label: '↺ 全部复位', onClick() { G.N = 70; G.T = 300; G.V = 1.0; G.heat = false; resetMols(); syncGas(); } });
      gasBar();
      setHUD([['eq', 'pV = nRT'], ['pv', 'pV 乘积'], ['w', '自由实验'], ['tip', '两屏实时刷新']]);
      hset('tip', '试试上述三个挑战');
      drawScreenA('plain'); drawScreenB('dist');
    },
  },
];

/* ---- 各章 HUD 刷新 ---- */

function updBoyleHUD() {
  hset('pv', (G.pKPa() * G.V).toFixed(1) + ' kPa·L');
  hset('pts', HIST.pts.length ? HIST.pts.map((q) => (q.V * q.p).toFixed(0)).join(', ') + ' kPa·L' : '无');
  hset('note', HIST.pts.length >= 2 ? '比较各次 p·V —— 应当相等' : '压活塞：p 升，V 减');
  gasBar();
}
function updGayHUD() {
  hset('vt', (G.V / G.T * 1000).toFixed(2) + ' mL/K');
  hset('pts', HIST.pts.length ? HIST.pts.length + ' 组' : '无');
  gasBar();
}
function updCharlesHUD() {
  hset('pt', (G.pKPa() / G.T * 1000).toFixed(2) + ' Pa·L/K');
  hset('pts', HIST.pts.length ? HIST.pts.length + ' 组' : '无');
  gasBar();
}
function updWorkHUD() {
  hset('t', G.T.toFixed(0) + ' K');
  hset('du', (G.T > 305 ? '内能增加' : G.T < 295 ? '内能减少' : '基本不变') + '（ΔU = nCᵥΔT）');
  hset('w', G.T > 305 ? '外界对气体做功' : G.T < 295 ? '气体对外做功' : '–');
  gasBar();
}
function updFLHUD() {
  const dU = FL.Q + FL.W;
  hset('q', (FL.Q > 0 ? '吸热 ' : '放热 ') + Math.abs(FL.Q) + ' kJ');
  hset('w', FL.W > 0 ? '压缩 ' + FL.W + ' kJ' : FL.W < 0 ? '膨胀（对外做功）' + Math.abs(FL.W) + ' kJ' : '不做功');
  hset('du', (dU > 0 ? '+' : '') + dU + ' kJ → ΔT = ' + (dU * 1000 / (G.nMol() * 12.471)).toFixed(0) + ' K');
}
const FL = { Q: 10, W: 0 };
function applyFirstLaw() {
  const dU = FL.Q + FL.W;                       // kJ
  const dT = dU * 1000 / (G.nMol() * 12.471);   // Cv = 3R/2
  G.T = clamp(G.T + dT, 50, 900);
  if (FL.W > 0) G.V = clamp(G.V * 0.8, 0.2, 2.0);
  if (FL.W < 0) G.V = clamp(G.V * 1.25, 0.2, 2.0);
  syncGas();
  updFLHUD();
  drawScreenA('plain'); drawScreenB('dist');
}
/** 绝热压缩/膨胀（快速推拉活塞） */
function adiabatic(vNew) {
  const gamma1 = 2 / 3;
  G.T = clamp(G.T * Math.pow(G.V / vNew, gamma1), 30, 900);
  G.V = vNew;
  syncGas();
  updWorkHUD();
}
function updCarnotHUD() {
  const eta = 1 - CAR.T2 / CAR.T1;
  hset('eta', (eta * 100).toFixed(0) + ' %');
  hset('w', '每次循环输出净功');
  hset('q2', 'Q₂ = Q₁(1 − η)');
  hset('note', 'T₂ 越低或 T₁ 越高 → η 越大');
  gasBar();
}

/* ---------------- 四冲程汽油机（独立场景） ---------------- */

const ENG = { theta: 0, rpm: 90, running: false, built: false, cr: 10 };
function buildEngine(g) {
  const cx = 0, baseY = 0.95;
  const key = new THREE.DirectionalLight(0xfff0e0, 1.6);
  key.position.set(2, 3, 2.5);
  g.add(key);
  g.add(new THREE.HemisphereLight(0x8a7a90, 0x2a2026, 0.7));
  const pl = new THREE.PointLight(0xffc07a, 6, 6, 2);
  pl.position.set(-1.2, 2.8, 1.2);
  g.add(pl);
  const metal = M(0x9aa1a8, 0.4, 0.7);
  const dark = M(0x3a3f45, 0.6, 0.4);
  // 机座
  const bed = box(1.5, 0.22, 0.8, M(0x4a443e, 0.7, 0.3));
  bed.position.set(cx, baseY - 0.11, 0);
  g.add(bed);
  // 气缸（半剖透明）
  const bore = 0.42;
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(bore, bore, 0.9, 26, 1, true, Math.PI * 0.15, Math.PI * 1.7),
    new THREE.MeshPhysicalMaterial({ color: 0xbfd8e8, roughness: 0.1, transparent: true, opacity: 0.2, side: THREE.DoubleSide, depthWrite: false }));
  glass.position.set(cx, baseY + 0.85, 0);
  g.add(glass);
  const wallSolid = new THREE.Mesh(new THREE.CylinderGeometry(bore + 0.03, bore + 0.03, 0.9, 26, 1, true, Math.PI * 1.85, Math.PI * 0.3),
    M(0x6f7478, 0.45, 0.6));
  wallSolid.position.copy(glass.position);
  g.add(wallSolid);
  // 缸盖 + 火花塞
  const head = box(1.0, 0.14, 0.8, dark);
  head.position.set(cx, baseY + 1.35, 0);
  g.add(head);
  const plug = cyl(0.03, 0.03, 0.22, M(0xd8dcE0, 0.3, 0.6), 10);
  plug.position.set(cx, baseY + 1.5, 0);
  g.add(plug);
  const spark = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeGlow(), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  spark.scale.set(0.5, 0.5, 1);
  spark.position.set(cx, baseY + 1.28, 0);
  g.add(spark);
  // 进/排气门
  function valve(dx) {
    const vg = new THREE.Group();
    const stem = cyl(0.016, 0.016, 0.3, metal, 8);
    const discM = cyl(0.09, 0.07, 0.03, metal, 14);
    discM.position.y = 0.15;
    vg.add(stem, discM);
    vg.position.set(cx + dx, baseY + 1.32, 0);
    g.add(vg);
    return vg;
  }
  ENG.valveIn = valve(-0.18);
  ENG.valveEx = valve(0.18);
  // 活塞
  ENG.piston = new THREE.Group();
  const pbody = cyl(bore - 0.02, bore - 0.02, 0.24, M(0xc7ccd2, 0.35, 0.7), 26);
  ENG.piston.add(pbody);
  for (let i = 0; i < 2; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(bore - 0.015, 0.008, 6, 26), dark);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.08 - i * 0.07;
    ENG.piston.add(ring);
  }
  g.add(ENG.piston);
  // 连杆 + 曲轴 + 飞轮
  ENG.rod = box(0.06, 0.62, 0.05, metal);
  g.add(ENG.rod);
  ENG.crank = new THREE.Group();
  const shaft = cyl(0.05, 0.05, 0.62, metal, 14);
  shaft.rotation.x = Math.PI / 2;
  const crankArm = box(0.07, 0.22, 0.09, dark);
  crankArm.position.y = 0.1;
  ENG.crank.add(shaft, crankArm);
  ENG.crank.position.set(cx, baseY + 0.35, 0);
  g.add(ENG.crank);
  const flywheel = cyl(0.4, 0.4, 0.05, dark, 36);
  flywheel.rotation.x = Math.PI / 2;
  flywheel.position.set(cx, baseY + 0.35, -0.34);
  g.add(flywheel);
  ENG.flywheel = flywheel;
  // 燃烧粒子
  ENG.burst = [];
  for (let i = 0; i < 26; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({
      map: makeGlow(), color: 0xff8040, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    s.scale.set(0.1, 0.1, 1);
    g.add(s);
    ENG.burst.push(s);
  }
  ENG.spark = spark;
  ENG.cx = cx; ENG.baseY = baseY; ENG.bore = bore;
  ENG.built = true;
}
function makeGlow() {
  if (makeGlow.tex) return makeGlow.tex;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const x = c.getContext('2d');
  const gr = x.createRadialGradient(64, 64, 2, 64, 64, 62);
  gr.addColorStop(0, 'rgba(255,240,210,1)');
  gr.addColorStop(0.35, 'rgba(255,180,90,0.55)');
  gr.addColorStop(1, 'rgba(255,140,60,0)');
  x.fillStyle = gr;
  x.fillRect(0, 0, 128, 128);
  makeGlow.tex = new THREE.CanvasTexture(c);
  return makeGlow.tex;
}
function engKin() {
  const r = 0.17, L = 0.55;
  const th = ENG.theta;
  const crankY = ENG.baseY + 0.35;
  const px = ENG.cx;
  const py = crankY + r * Math.cos(th) + Math.sqrt(L * L - (r * Math.sin(th)) ** 2);
  ENG.piston.position.set(px, py, 0);
  const pinX = px + r * Math.sin(th), pinY = crankY + r * Math.cos(th);
  const midX = px, midY = (py - 0.1 + pinY) / 2;
  ENG.rod.position.set(midX, midY, 0);
  const dx = pinX - midX, dy = pinY - (py - 0.1);
  ENG.rod.rotation.z = Math.atan2(dy, dx) - Math.PI / 2;
  ENG.rod.scale.y = 1;
  ENG.crank.rotation.z = th;
  ENG.flywheel.rotation.z = -th;
}
function engStage() {
  const deg = ((ENG.theta * 180 / Math.PI) % 720 + 720) % 720;
  if (deg < 180) return { name: '① 吸气', valve: '进气门开', vin: 1, vex: 0 };
  if (deg < 360) return { name: '② 压缩', valve: '两门全闭', vin: 0, vex: 0 };
  if (deg < 540) return { name: '③ 做功', valve: '点火·两门全闭', vin: 0, vex: 0 };
  return { name: '④ 排气', valve: '排气门开', vin: 0, vex: 1 };
}
function stepEngine(dt) {
  if (ENG.running) {
    const radS = ENG.rpm * TAU / 60;
    ENG.theta += radS * dt * 0.12;   // 视觉减速
  }
  engKin();
  const st = engStage();
  // 气门升程
  const lift = 0.06;
  ENG.valveIn.position.y = ENG.baseY + 1.32 - (st.vin ? lift * Math.abs(Math.sin(ENG.theta * 2)) + 0.02 : 0);
  ENG.valveEx.position.y = ENG.baseY + 1.32 - (st.vex ? lift * Math.abs(Math.sin(ENG.theta * 2)) + 0.02 : 0);
  // 点火（做功冲程起始）
  const deg = ((ENG.theta * 180 / Math.PI) % 720 + 720) % 720;
  const firing = deg >= 360 && deg < 380;
  ENG.spark.material.opacity = firing ? 0.95 : 0;
  if (firing && !ENG.burstOn) {
    ENG.burstOn = true;
    ENG.burst.forEach((s) => {
      const a = Math.random() * TAU;
      s.position.set(ENG.cx + Math.cos(a) * 0.1, ENG.baseY + 1.2 + Math.random() * 0.1, Math.sin(a) * 0.1);
      s.material.opacity = 0.8;
      s.userData.vx = Math.cos(a) * 0.5;
      s.userData.vy = 0.6 + Math.random() * 0.4;
      s.userData.vz = Math.sin(a) * 0.5;
    });
  }
  if (!firing) ENG.burstOn = false;
  ENG.burst.forEach((s) => {
    if (s.material.opacity > 0) {
      s.material.opacity -= dt * 1.6;
      s.position.x += s.userData.vx * dt;
      s.position.y += s.userData.vy * dt;
      s.position.z += s.userData.vz * dt;
    }
  });
  hset('stroke', st.name);
  hset('crank', deg.toFixed(0) + '°（一循环 720°）');
  hset('valve', st.valve);
  // 奥托循环理想效率 η = 1 − 1/r^(γ−1)（空气标准，γ ≈ 1.4）：压缩比越高，效率越高
  const etaOtto = 1 - 1 / Math.pow(ENG.cr, 0.4);
  hset('eta', (etaOtto * 100).toFixed(0) + ' %（r=' + ENG.cr.toFixed(1) + '，γ=1.4）');
}
function paintStageBtns() {
  ENG.painted = true;
}

/* ---------------- 热力学第二定律：扩散箱（独立场景） ---------------- */

const DIFF = { N: 40, open: 0, door: 1, playing: false, rewinding: false, built: false, mols: [], saved: null };
function buildDiffuse(g) {
  const w = 1.5, h = 0.8, d = 0.7;
  const glassM = new THREE.MeshPhysicalMaterial({ color: 0xbfd8e8, roughness: 0.08, transparent: true, opacity: 0.14, side: THREE.DoubleSide, depthWrite: false });
  const bx = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), glassM);
  bx.position.set(0, 1.5, 0);
  g.add(bx);
  const frameM = M(0x5a5248, 0.6, 0.3);
  const edges = [
    [w, 0.05, 0.05, 0, h / 2, -d / 2], [w, 0.05, 0.05, 0, h / 2, d / 2],
    [w, 0.05, 0.05, 0, -h / 2, -d / 2], [w, 0.05, 0.05, 0, -h / 2, d / 2],
    [0.05, h, 0.05, -w / 2, 0, -d / 2], [0.05, h, 0.05, -w / 2, 0, d / 2],
    [0.05, h, 0.05, w / 2, 0, -d / 2], [0.05, h, 0.05, w / 2, 0, d / 2],
  ];
  edges.forEach(([ew, eh, ed, ex, ey, ez]) => {
    const e = box(ew, eh, ed, frameM);
    e.position.set(ex, 1.5 + ey, ez);
    g.add(e);
  });
  // 隔板（可下缩）
  DIFF.doorMesh = box(0.03, h, d, M(0x8a6a4a, 0.7));
  DIFF.doorMesh.position.set(0, 1.5, 0);
  g.add(DIFF.doorMesh);
  // 分子
  const geo = new THREE.SphereGeometry(0.03, 8, 6);
  const mat = new THREE.MeshStandardMaterial({ color: 0x6fb3e0, roughness: 0.4, emissive: 0x1a4a7a, emissiveIntensity: 0.6 });
  DIFF.inst = new THREE.InstancedMesh(geo, mat, 80);
  DIFF.inst.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  DIFF.inst.frustumCulled = false;
  g.add(DIFF.inst);
  const pl = new THREE.PointLight(0xfff0d8, 8, 6, 2);
  pl.position.set(0, 2.6, 1.4);
  g.add(pl);
  g.add(new THREE.HemisphereLight(0x8a7a90, 0x2a2026, 0.6));
  DIFF.built = true;
  resetDiff();
}
function resetDiff() {
  DIFF.mols = [];
  for (let i = 0; i < DIFF.N; i++) {
    const m = {
      p: new THREE.Vector3(-0.6 + Math.random() * 0.55, 1.5 + (Math.random() - 0.5) * (0.8 - 0.12), (Math.random() - 0.5) * (0.7 - 0.1)),
      v: new THREE.Vector3(), home: null,
    };
    const th = Math.random() * TAU, ph = Math.acos(2 * Math.random() - 1);
    m.v.set(Math.sin(ph) * Math.cos(th), Math.cos(ph), Math.sin(ph) * Math.sin(th)).multiplyScalar(0.5);
    m.home = m.p.clone();
    DIFF.mols.push(m);
  }
  DIFF.door = 1; DIFF.open = 0; DIFF.playing = false; DIFF.rewinding = false;
  hset('state', '隔板关闭，气体全在左半');
  hset('prob', '1 / 2^' + DIFF.N);
  hset('ent', '低（有序）');
  hset('law', '孤立系统：熵不减');
  paintDiff();
}
function playDiff(rewind) {
  if (rewind) {
    DIFF.rewinding = true; DIFF.playing = false;
    hset('state', '「倒放」中……分子正在退回左半');
  } else {
    DIFF.playing = true; DIFF.rewinding = false;
    hset('state', '隔板抽开——气体自发扩散');
  }
}
function paintDiff() {
  for (let i = 0; i < 80; i++) {
    const m = DIFF.mols[i];
    if (!m) { dummy.position.set(0, -100, 0); dummy.scale.setScalar(0.0001); }
    else { dummy.position.copy(m.p); dummy.scale.setScalar(1); }
    dummy.updateMatrix();
    DIFF.inst.setMatrixAt(i, dummy.matrix);
  }
  DIFF.inst.count = Math.min(DIFF.N, 80);
  DIFF.inst.instanceMatrix.needsUpdate = true;
  DIFF.doorMesh.scale.y = Math.max(DIFF.door, 0.02);
  DIFF.doorMesh.position.y = 1.5 - (1 - DIFF.door) * 0.4;
}
function stepDiffuse(dt) {
  if (DIFF.playing) DIFF.door = Math.min(DIFF.door - dt * 0.8, 0);
  if (DIFF.rewinding) {
    DIFF.door = Math.min(DIFF.door + dt * 0.8, 1);
    if (DIFF.door >= 0.99) {
      DIFF.rewinding = false;
      hset('state', '所有分子退回左半——现实中概率 1/2^N，等不到');
    }
  }
  const xLim = DIFF.door > 0.5 ? 0.7 : 0.0;   // 门开则全箱活动
  DIFF.mols.forEach((m) => {
    if (DIFF.rewinding) {
      m.p.lerp(m.home, Math.min(1, dt * 1.4));
    } else {
      m.p.addScaledVector(m.v, dt * 1.4);
      if (m.p.x < -0.68 + 0.03) { m.p.x = -0.68 + 0.03; m.v.x = Math.abs(m.v.x); }
      if (m.p.x > (xLim === 0 ? -0.03 : 0.68) - 0.03) {
        if (xLim === 0 && m.p.x > -0.03) { m.p.x = -0.03 - 0.03; m.v.x = -Math.abs(m.v.x); }
        else if (xLim > 0) { m.p.x = 0.68 - 0.03; m.v.x = -Math.abs(m.v.x); }
      }
      if (m.p.y < 1.5 - 0.34) { m.p.y = 1.5 - 0.34; m.v.y = Math.abs(m.v.y); }
      if (m.p.y > 1.5 + 0.34) { m.p.y = 1.5 + 0.34; m.v.y = -Math.abs(m.v.y); }
      if (m.p.z < -0.32) { m.p.z = -0.32; m.v.z = Math.abs(m.v.z); }
      if (m.p.z > 0.32) { m.p.z = 0.32; m.v.z = -Math.abs(m.v.z); }
      if (DIFF.playing && DIFF.door <= 0) {
        DIFF.playing = false;
        hset('state', '已均匀充满全箱（自发）');
        hset('ent', '高（无序）——不会自发复原');
      }
    }
  });
  paintDiff();
}

/* ---------------- 帧循环 ---------------- */

/* 各章屏幕刷新模式（enter 里最后一次 draw 调用即当前模式） */
let screenModeA = 'plain', screenModeB = 'dist';
const origDrawA = drawScreenA, origDrawB = drawScreenB;
drawScreenA = function (mode) { screenModeA = mode; return origDrawA(mode); };
drawScreenB = function (mode) { screenModeB = mode; return origDrawB(mode); };

app.onFrame((dt) => {
  cameraTweenTick(app, dt);
  const act = activeScene;
  if (act === scenes.studio) {
    if (G.heat) { G.T = Math.min(G.T + dt * 28, 650); syncGas(); }
    stepMols(dt);
  } else if (act === scenes.engine) {
    stepEngine(dt);
  } else if (act === scenes.diffuse) {
    stepDiffuse(dt);
  }
  /* 主场景内实时重绘（节流 0.12s；速率分布随分子速度演化持续刷新） */
  redrawT += dt;
  if (redrawT >= 0.12 && act === scenes.studio) {
    redrawT = 0;
    if (screenModeA === 'carnot' && CAR.animate) origDrawA('carnot');
    if (screenModeB === 'dist') origDrawB('dist');
  }
});
let redrawT = 0;

/* ---------------- 启动 ---------------- */

let TEX = null;
loadAll([
  { key: 'env', label: '室内环境', job: loadHDR('../assets/textures/sky/sky_court-BLHJ2ADI.hdr') },
  { key: 'plank', label: '工作台', job: loadTexture('../assets/textures/pbr/plank_diff-DPUnSb0W.webp', { colorSpace: null, wrap: true }) },
  { key: 'plankN', label: '台面细节', job: loadTexture('../assets/textures/pbr/plank_nor-BoGKkjWD.webp', { colorSpace: null, wrap: true }) },
], (d, t, label) => loader.setText(`正在加载工作室 ${d}/${t}（${label}）`)).then((t) => {
  TEX = t;
  loader.hide();
  const sections = createSections({
    nav: document.getElementById('sideNav'),
    descPanel: document.getElementById('descPanel'),
    sections: SECTIONS,
    onSelect(i, sec) {
      setBar(null);
      sec.enter();
    },
  });
  window.__eduSections = sections;
  sections.select(0);
}).catch((err) => {
  loader.setText('资源加载失败：' + err.message);
  console.error(err);
});
