/* EduLab · 传热与物态变化（heat）
 * 章节：温度计的使用 / 摄氏温度 / 熔化和凝固 / 水的沸腾 / 蒸发和液化 / 升华和凝华 /
 *       比较不同物质的吸热能力 / 热传导 / 热对流 / 热辐射 / 从冰到沸腾 / 随堂检测
 * 场景：白色展厅实验台（plank 台面 + paint 柜体 + slab 地面 + wall 墙，sky_court 环境），
 *       每章台面上一套装置；摄氏温度章为 2D canvas 温标图；温度曲线用 coastal-window 小窗。
 */
import {
  THREE, clamp,
  loadTexture, loadHDR, loadAll, createApp, cameraTweenTick, makeLoader,
  createSections, createControlsPanel, makeHUD, makeTextSprite, makeGlowTexture,
} from './edu-core.js';

const TAU_ = Math.PI * 2;

/* ---------------- 纹理（路径已 ls 核对） ---------------- */

const TEX = {
  skyWebp: '../assets/textures/sky/sky_court-BKHrsJQE.webp',
  skyHdr: '../assets/textures/sky/sky_court-BLHJ2ADI.hdr',
  plankDiff: '../assets/textures/pbr/plank_diff-DPUnSb0W.webp',
  plankArm: '../assets/textures/pbr/plank_arm-CztMy41m.webp',
  plankNor: '../assets/textures/pbr/plank_nor-BoGKkjWD.webp',
  paintDiff: '../assets/textures/pbr/paint_diff-RYyGtI7R.webp',
  paintArm: '../assets/textures/pbr/paint_arm-BtvMA06a.webp',
  paintNor: '../assets/textures/pbr/paint_nor-DgERPfRh.webp',
  slabDiff: '../assets/textures/pbr/slab_diff-Bzxi6irn.webp',
  slabArm: '../assets/textures/pbr/slab_arm-OyJUI_RU.webp',
  slabNor: '../assets/textures/pbr/slab_nor-D2MZT0BN.webp',
  wallDiff: '../assets/textures/pbr/wall_diff-CNpUUuOJ.webp',
  wallNor: '../assets/textures/pbr/wall_nor-DS8uKrFH.webp',
};

/* ---------------- 本实验专属样式 ---------------- */

const style = document.createElement('style');
style.textContent = `
.heat-toast {
  position: absolute; top: 14px; left: 50%; transform: translate(-50%, -8px);
  z-index: 26; max-width: min(430px, calc(100% - 28px));
  padding: 9px 16px; border-radius: 12px; font-size: 13.5px; line-height: 1.55;
  background: color-mix(in srgb, var(--card) 92%, transparent);
  border: 1px solid var(--card-border); box-shadow: var(--shadow);
  color: var(--text); opacity: 0; pointer-events: none;
  transition: opacity .25s, transform .25s;
}
.heat-toast.show { opacity: 1; transform: translate(-50%, 0); }
.heat-toast.ok { border-color: color-mix(in srgb, #3fa96f 55%, transparent); }
.heat-toast.warn { border-color: color-mix(in srgb, #d98a4f 60%, transparent); }
.heat-cv2 { position: absolute; inset: 0; width: 100%; height: 100%; z-index: 6; display: none; touch-action: none; cursor: grab; }
.heat-cv2:active { cursor: grabbing; }
`;
document.head.appendChild(style);

/* ---------------- 场景 ---------------- */

const stage = document.getElementById('stage');
const loader = makeLoader(stage, '正在搭建传热实验台…');

const app = createApp({
  container: stage,
  fov: 42, near: 0.05, far: 60,
  cameraPos: [0.6, 1.5, 3.0],
  target: [0, 1.02, 0],
  minDistance: 0.45, maxDistance: 9,
  exposure: 1.05,
  keepBackground: true,
});
const { scene, camera, controls } = app;

scene.add(new THREE.AmbientLight(0xbcc6d4, 0.55));
const sunLight = new THREE.DirectionalLight(0xfff2e2, 1.7);
sunLight.position.set(3.5, 5, 3);
scene.add(sunLight);
const fillLight = new THREE.DirectionalLight(0xdfe8ff, 0.5);
fillLight.position.set(-4, 3, -2.5);
scene.add(fillLight);

/* ---------------- 材质与建模工具 ---------------- */

function stdMat(opts) { return new THREE.MeshStandardMaterial(opts); }
function glassMat(opacity = 0.18, color = 0xb9d2e2) {
  return new THREE.MeshPhysicalMaterial({
    color, metalness: 0, roughness: 0.04, transparent: true, opacity,
    envMapIntensity: 0.4, clearcoat: 0.6, clearcoatRoughness: 0.2,
    side: THREE.DoubleSide, depthWrite: false,
  });
}
function liquidMat(color, opacity = 0.45) {
  return new THREE.MeshPhysicalMaterial({
    color, metalness: 0, roughness: 0.12, transparent: true, opacity,
    envMapIntensity: 0.9, side: THREE.DoubleSide,
  });
}
const metalMat = stdMat({ color: 0x454b52, roughness: 0.42, metalness: 0.78 });

function lathe(pts, mat, seg = 40) {
  const geo = new THREE.LatheGeometry(pts.map((p) => new THREE.Vector2(p[0], p[1])), seg);
  return new THREE.Mesh(geo, mat);
}
function box(w, h, d, mat) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); }
function makeLabel(text, color = '#dfe6ee', scale = 0.0028) {
  return makeTextSprite(text, { fontSize: 26, color, scale });
}

/* 烧杯 */
function makeBeaker(r = 0.055, h = 0.1) {
  const pts = [
    [0.004, 0], [r * 0.55, 0.002], [r * 0.92, 0.006], [r, 0.012],
    [r, h - 0.006], [r * 1.06, h - 0.002], [r * 1.09, h + 0.002],
  ];
  return lathe(pts, glassMat());
}
function makeWater(r, h, color = 0x8ecbe2, op = 0.4) {
  return new THREE.Mesh(new THREE.CylinderGeometry(r - 0.004, r - 0.005, h, 24), liquidMat(color, op));
}

/* 温度计：细玻璃管 + 红色液柱 + 玻璃泡；setFrac(0..1) 控制液柱高度 */
function makeThermometer(len = 0.17) {
  const g = new THREE.Group();
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, len, 12), glassMat(0.28));
  tube.position.y = len / 2;
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.010, 12, 10), glassMat(0.32));
  bulb.position.y = 0.004;
  const colGeo = new THREE.CylinderGeometry(0.0026, 0.0026, 1, 8);
  colGeo.translate(0, 0.5, 0);
  const column = new THREE.Mesh(colGeo, stdMat({ color: 0xe0392e, roughness: 0.35 }));
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.0065, 0.0065, 0.012, 12), metalMat);
  cap.position.y = len + 0.004;
  g.add(tube, bulb, column, cap);
  g.userData.setFrac = (f) => {
    const h = Math.max(0.004, len * 0.92 * clamp(f, 0, 1));
    column.scale.y = h;
    column.position.y = 0.006;
  };
  return g;
}

/* 加热板：setOn(v, k) 控制顶面红热发光 */
function makeHotplate(w = 0.12, d = 0.12) {
  const g = new THREE.Group();
  const body = box(w, 0.018, d, stdMat({ color: 0x33363c, roughness: 0.6, metalness: 0.4 }));
  body.position.y = 0.009;
  const top = box(w - 0.014, 0.004, d - 0.014, stdMat({ color: 0x5a2018, roughness: 0.5, metalness: 0.2 }));
  top.position.y = 0.02;
  g.add(body, top);
  g.userData.setOn = (v, k = 1) => {
    top.material.emissive.setHex(v ? 0xd23c14 : 0x000000);
    top.material.emissiveIntensity = v ? 0.35 + k * 0.5 : 0;
  };
  return g;
}

/* 铁架台 + 环形夹（横臂沿 +z 伸出，末端圆环绕 x 轴放平） */
function makeStandHold(rodH = 0.42, armLen = 0.13) {
  const g = new THREE.Group();
  const base = box(0.2, 0.012, 0.26, metalMat);
  base.position.y = 0.006;
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, rodH, 12), metalMat);
  rod.position.y = rodH / 2;
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, armLen, 10), metalMat);
  arm.rotation.x = Math.PI / 2;
  arm.position.set(0, rodH - 0.25, armLen / 2);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.012, 0.0022, 8, 20), metalMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.set(0, rodH - 0.25, armLen);
  g.add(base, rod, arm, ring);
  g.userData.ringY = () => rodH - 0.25;
  return g;
}

/* 风扇：立杆 + 电机盒 + 两叶桨（绕 x 轴转，风向 +x）；spin 外部驱动 */
function makeFan() {
  const g = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.005, 0.14, 10), metalMat);
  pole.position.y = 0.07;
  const base = box(0.05, 0.008, 0.05, metalMat);
  base.position.y = 0.004;
  const head = new THREE.Group();
  const motor = box(0.022, 0.022, 0.02, stdMat({ color: 0x3c4048, roughness: 0.5, metalness: 0.5 }));
  const guard = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.0018, 8, 24), metalMat);
  guard.rotation.y = Math.PI / 2;
  guard.position.x = 0.014;
  const blades = new THREE.Group();
  for (let i = 0; i < 2; i++) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.0015, 0.05, 0.016), stdMat({ color: 0x9fb2c4, roughness: 0.4, metalness: 0.3 }));
    b.rotation.x = (i * Math.PI) / 2 + 0.35;
    blades.add(b);
  }
  blades.position.x = 0.012;
  head.add(motor, guard, blades);
  head.position.y = 0.145;
  g.add(pole, base, head);
  g.userData.blades = blades;
  return g;
}

/* 火柴（蜡粘在棒下）：蜡珠 + 木杆 + 红头 */
function makeMatch() {
  const g = new THREE.Group();
  const wax = new THREE.Mesh(new THREE.SphereGeometry(0.0038, 8, 6), stdMat({ color: 0xd9c27a, roughness: 0.6 }));
  const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.0011, 0.0011, 0.03, 6), stdMat({ color: 0xd8c49e, roughness: 0.9 }));
  stick.position.y = -0.015;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.0034, 8, 6), stdMat({ color: 0xb8362a, roughness: 0.55 }));
  head.position.y = -0.031;
  g.add(wax, stick, head);
  return g;
}

/* 火焰精灵（酒精灯用，照 gas 做法） */
function makeFlame() {
  const g = new THREE.Group();
  const outer = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeGlowTexture('255,150,50', [[0, 'rgba(C,0.9)'], [0.4, 'rgba(C,0.4)'], [1, 'rgba(C,0)']]),
    blending: THREE.AdditiveBlending, transparent: true, depthWrite: false,
  }));
  outer.scale.set(0.045, 0.075, 1);
  const inner = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeGlowTexture('255,236,190', [[0, 'rgba(C,1)'], [0.5, 'rgba(C,0.55)'], [1, 'rgba(C,0)']]),
    blending: THREE.AdditiveBlending, transparent: true, depthWrite: false,
  }));
  inner.scale.set(0.02, 0.036, 1);
  inner.position.y = 0.004;
  g.add(outer, inner);
  g.userData.outer = outer;
  return g;
}

/* ---------------- 实验室环境 ---------------- */

const worldG = new THREE.Group();
scene.add(worldG);
const pbr = {};

function buildWorld() {
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(16, 12),
    stdMat({ color: 0xaeb4ba, roughness: 0.85, metalness: 0.05, map: pbr.slabDiff, roughnessMap: pbr.slabArm, normalMap: pbr.slabNor })
  );
  floor.rotation.x = -Math.PI / 2;
  pbr.slabDiff.wrapS = pbr.slabDiff.wrapT = THREE.RepeatWrapping;
  pbr.slabDiff.repeat.set(6, 5);
  worldG.add(floor);

  pbr.wallDiff.wrapS = pbr.wallDiff.wrapT = THREE.RepeatWrapping;
  pbr.wallDiff.repeat.set(5, 1.6);
  pbr.wallNor.wrapS = pbr.wallNor.wrapT = THREE.RepeatWrapping;
  pbr.wallNor.repeat.set(5, 1.6);
  const wall = new THREE.Mesh(
    new THREE.PlaneGeometry(16, 5),
    stdMat({ color: 0xd9dde2, roughness: 0.9, map: pbr.wallDiff, normalMap: pbr.wallNor })
  );
  wall.position.set(0, 2.5, -2.6);
  worldG.add(wall);

  const benchBody = box(4.9, 0.85, 1.5, stdMat({
    color: 0xe4e7ea, roughness: 0.55, metalness: 0.08,
    map: pbr.paintDiff, roughnessMap: pbr.paintArm, normalMap: pbr.paintNor,
  }));
  benchBody.position.set(0, 0.425, -0.05);
  worldG.add(benchBody);

  pbr.plankDiff.wrapS = pbr.plankDiff.wrapT = THREE.RepeatWrapping;
  pbr.plankDiff.repeat.set(4, 1.3);
  pbr.plankArm.wrapS = pbr.plankArm.wrapT = THREE.RepeatWrapping;
  pbr.plankArm.repeat.set(4, 1.3);
  pbr.plankNor.wrapS = pbr.plankNor.wrapT = THREE.RepeatWrapping;
  pbr.plankNor.repeat.set(4, 1.3);
  const benchTop = box(5.0, 0.05, 1.6, stdMat({
    color: 0xcfa976, roughness: 0.6, metalness: 0.05,
    map: pbr.plankDiff, roughnessMap: pbr.plankArm, normalMap: pbr.plankNor,
  }));
  benchTop.position.set(0, 0.875, -0.05);
  worldG.add(benchTop);
}
const BENCH_Y = 0.9;

/* ---------------- 粒子池（气泡 / 碘蒸气 / 对流示踪 / 白气） ---------------- */

const _m4 = new THREE.Matrix4();
const _zero = new THREE.Matrix4().makeScale(0.0001, 0.0001, 0.0001);
const _q0 = new THREE.Quaternion();
const _s1 = new THREE.Vector3();

const MAX_BUB = 140;
const bubMesh = new THREE.InstancedMesh(
  new THREE.SphereGeometry(0.0035, 6, 5),
  new THREE.MeshPhysicalMaterial({ color: 0xdff2fa, transparent: true, opacity: 0.55, roughness: 0.1, metalness: 0 }),
  MAX_BUB
);
bubMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
bubMesh.frustumCulled = false;
scene.add(bubMesh);
const bubbles = Array.from({ length: MAX_BUB }, () => ({ on: false, p: new THREE.Vector3(), vy: 0, s: 1, g: 0, top: 1, wob: 0 }));
function spawnBubble(x, y, z, top, vy = 0.06, g = 0, s = 1) {
  const b = bubbles.find((q) => !q.on);
  if (!b) return;
  b.on = true;
  b.p.set(x + (Math.random() - 0.5) * 0.012, y, z + (Math.random() - 0.5) * 0.012);
  b.vy = vy * (0.75 + Math.random() * 0.5);
  b.s = s * (0.6 + Math.random() * 0.7);
  b.g = g;
  b.top = top;
  b.wob = Math.random() * TAU_;
}

const MAX_VAP = 80;
const vapMesh = new THREE.InstancedMesh(
  new THREE.SphereGeometry(0.0042, 6, 5),
  new THREE.MeshBasicMaterial({ color: 0x9b4fc2, transparent: true, opacity: 0.38, depthWrite: false }),
  MAX_VAP
);
vapMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
vapMesh.frustumCulled = false;
scene.add(vapMesh);
const vapors = Array.from({ length: MAX_VAP }, () => ({ on: false, p: new THREE.Vector3(), d: new THREE.Vector3(), v: 0.05, t: 0, life: 1.5, s: 1 }));
function spawnVapor(x, y, z, dir, v = 0.05, life = 1.6) {
  const p = vapors.find((q) => !q.on);
  if (!p) return;
  p.on = true;
  p.p.set(x, y, z);
  p.d.copy(dir);
  p.v = v * (0.7 + Math.random() * 0.6);
  p.t = 0;
  p.life = life * (0.8 + Math.random() * 0.4);
  p.s = 0.7 + Math.random() * 0.8;
}

const MAX_TR = 140;
const trMesh = new THREE.InstancedMesh(
  new THREE.SphereGeometry(0.0028, 6, 5),
  new THREE.MeshBasicMaterial({ color: 0x8b2fa8, transparent: true, opacity: 0.85 }),
  MAX_TR
);
trMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
trMesh.frustumCulled = false;
scene.add(trMesh);
const tracers = Array.from({ length: MAX_TR }, () => ({ on: false, s: 0, sp: 0.14, jx: 0, jz: 0 }));
let convCurve = null; // 当前对流环路（chapter 9 激活）
function spawnTracer() {
  const p = tracers.find((q) => !q.on);
  if (!p) return;
  p.on = true;
  p.s = Math.random() * 0.15;
  p.sp = 0.12 + Math.random() * 0.1;
  p.jx = (Math.random() - 0.5) * 0.008;
  p.jz = (Math.random() - 0.5) * 0.008;
}

/* 白气团（液化演示 / 沸腾蒸汽） */
const puffs = [];
for (let i = 0; i < 8; i++) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(0.013, 8, 6), new THREE.MeshBasicMaterial({
    color: 0xdfe3e8, transparent: true, opacity: 0.5, depthWrite: false,
  }));
  m.visible = false;
  scene.add(m);
  puffs.push({ mesh: m, t: -1 });
}
function puffAt(x, y, z, rise = 0.03) {
  const p = puffs.find((q) => q.t < 0);
  if (!p) return;
  p.t = 0;
  p.rise = rise;
  p.mesh.visible = true;
  p.mesh.position.set(x, y, z);
}

function resetParticles() {
  bubbles.forEach((b) => { b.on = false; });
  vapors.forEach((v) => { v.on = false; });
  tracers.forEach((t) => { t.on = false; });
  convCurve = null;
  puffs.forEach((p) => { p.t = -1; p.mesh.visible = false; });
}

function updateParticles(dt, time) {
  bubbles.forEach((b, i) => {
    if (b.on) {
      b.p.y += b.vy * dt;
      b.p.x += Math.sin(time * 6 + b.wob) * 0.0006;
      b.s += b.g * dt;
      if (b.p.y >= b.top || b.s < 0.1 || b.s > 3.2) b.on = false;
      _s1.setScalar(Math.max(b.s, 0.1));
      _m4.compose(b.p, _q0, _s1);
    } else _m4.copy(_zero);
    bubMesh.setMatrixAt(i, _m4);
  });
  bubMesh.instanceMatrix.needsUpdate = true;

  vapors.forEach((v, i) => {
    if (v.on) {
      v.t += dt;
      const k = v.t / v.life;
      if (k >= 1) v.on = false;
      else {
        v.p.addScaledVector(v.d, v.v * dt);
        v.p.x += Math.sin(time * 5 + i) * 0.0007;
        const sc = v.s * (k < 0.25 ? k / 0.25 : Math.max(0.05, 1.2 * (1 - k)));
        _s1.setScalar(sc);
        _m4.compose(v.p, _q0, _s1);
      }
    }
    if (!v.on) _m4.copy(_zero);
    vapMesh.setMatrixAt(i, _m4);
  });
  vapMesh.instanceMatrix.needsUpdate = true;

  tracers.forEach((p, i) => {
    if (p.on && convCurve) {
      p.s += p.sp * dt;
      if (p.s >= 1) p.on = false;
      else {
        const pt = convCurve.getPointAt(p.s % 1);
        _s1.setScalar(1);
        _m4.compose(new THREE.Vector3(pt.x + p.jx, pt.y, pt.z + p.jz), _q0, _s1);
      }
    }
    if (!p.on) _m4.copy(_zero);
    trMesh.setMatrixAt(i, _m4);
  });
  trMesh.instanceMatrix.needsUpdate = true;

  puffs.forEach((p) => {
    if (p.t >= 0) {
      p.t += dt;
      p.mesh.position.y += dt * (p.rise || 0.03);
      p.mesh.material.opacity = Math.max(0, 0.5 * (1 - p.t / 1.4));
      if (p.t > 1.4) { p.t = -1; p.mesh.visible = false; }
    }
  });
}

/* ---------------- 曲线小窗（coastal-window 样式） ---------------- */

function makeCurveWin(title, cfg) {
  const el = document.createElement('div');
  el.className = 'coastal-window';
  el.style.display = 'none';
  const head = document.createElement('div');
  head.className = 'cw-head';
  const b = document.createElement('b');
  b.textContent = title;
  const info = document.createElement('span');
  info.style.cssText = 'margin-left:auto;font-size:11.5px;font-variant-numeric:tabular-nums;color:var(--text-dim)';
  head.appendChild(b); head.appendChild(info);
  const cv = document.createElement('canvas');
  el.appendChild(head); el.appendChild(cv);
  stage.appendChild(el);
  return { el, cv, info, cfg, show(v) { el.style.display = v ? '' : 'none'; } };
}

let palCache = null;
function pal() {
  if (palCache) return palCache;
  const cs = getComputedStyle(document.documentElement);
  const g = (n, fb) => (cs.getPropertyValue(n) || fb).trim();
  palCache = {
    text: g('--text', '#2a3441'), dim: g('--text-dim', '#66717e'),
    accent: g('--accent', '#e8674a'), chip: g('--chip-bg', 'rgba(20,32,44,0.05)'),
    border: g('--card-border', 'rgba(20,32,44,0.09)'), card: g('--card', '#ffffff'),
  };
  return palCache;
}
window.addEventListener('edulabtheme', () => { palCache = null; });

function drawChart(win) {
  const cv = win.cv;
  const W = cv.clientWidth, H = 150;
  if (!W) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  if (cv.width !== Math.round(W * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
  const ctx = cv.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);
  const P = pal();
  const c = win.cfg;
  const L = 32, R = 10, T = 16, B = 18;
  const X = (t) => L + (t / c.xMax) * (W - L - R);
  const Y = (v) => T + (1 - (v - c.yMin) / (c.yMax - c.yMin)) * (H - T - B);
  // 色带（阶段背景）
  (c.bands || []).forEach((bd) => {
    ctx.fillStyle = bd.c;
    ctx.fillRect(X(bd.t0), T, X(bd.t1) - X(bd.t0), H - T - B);
    if (c.ann && bd.label) {
      ctx.fillStyle = P.dim; ctx.font = '10px -apple-system, "PingFang SC", sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(bd.label, (X(bd.t0) + X(bd.t1)) / 2, T + 11);
    }
  });
  // 网格与坐标
  ctx.font = '10px -apple-system, "PingFang SC", sans-serif';
  ctx.textAlign = 'right';
  for (let v = c.yMin; v <= c.yMax + 0.001; v += c.yStep) {
    const y = Y(v);
    ctx.strokeStyle = P.border;
    ctx.beginPath(); ctx.moveTo(L, y); ctx.lineTo(W - R, y); ctx.stroke();
    ctx.fillStyle = P.dim;
    ctx.fillText(String(Math.round(v)), L - 4, y + 3);
  }
  ctx.textAlign = 'center';
  for (let t = 0; t <= c.xMax + 0.001; t += c.xStep) {
    const x = X(t);
    ctx.fillStyle = P.dim;
    ctx.fillText(t + 's', x, H - 5);
  }
  ctx.strokeStyle = P.border;
  ctx.strokeRect(L, T, W - L - R, H - T - B);
  // 标注虚线
  (c.annLines || []).forEach((a) => {
    if (!c.ann) return;
    const y = Y(a.y);
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = a.c || P.accent;
    ctx.beginPath(); ctx.moveTo(L, y); ctx.lineTo(W - R, y); ctx.stroke();
    ctx.restore();
    if (a.label) {
      ctx.fillStyle = a.c || P.accent; ctx.textAlign = 'right';
      ctx.fillText(a.label, W - R - 2, y - 3);
    }
  });
  // 数据曲线
  c.series.forEach((s) => {
    if (s.pts.length < 2) return;
    ctx.globalAlpha = s.dim ? 0.28 : 1;
    ctx.strokeStyle = s.color;
    ctx.lineWidth = 1.7;
    ctx.beginPath();
    s.pts.forEach((p, i) => { const px = X(p[0]), py = Y(p[1]); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); });
    ctx.stroke();
    ctx.globalAlpha = 1;
  });
  // 图例
  let lx = L + 6;
  ctx.textAlign = 'left';
  c.series.forEach((s) => {
    ctx.fillStyle = s.color;
    ctx.fillRect(lx, 4, 10, 3);
    ctx.fillStyle = P.dim;
    ctx.fillText(s.label, lx + 13, 9);
    lx += 13 + ctx.measureText(s.label).width + 12;
  });
}

/* ---------------- 第二章：2D 摄氏温标图（可拖拽平移 + 滚轮缩放） ---------------- */

const cv2 = document.createElement('canvas');
cv2.className = 'heat-cv2';
stage.appendChild(cv2);
const c2 = { T: 25, conv: true, ann: true, zoom: 1, panX: 0, panY: 0, drag: null };
cv2.addEventListener('pointerdown', (e) => {
  c2.drag = { x: e.clientX, y: e.clientY, px: c2.panX, py: c2.panY };
  cv2.setPointerCapture(e.pointerId);
});
cv2.addEventListener('pointermove', (e) => {
  if (!c2.drag) return;
  c2.panX = c2.drag.px + (e.clientX - c2.drag.x);
  c2.panY = c2.drag.py + (e.clientY - c2.drag.y);
});
cv2.addEventListener('pointerup', () => { c2.drag = null; });
cv2.addEventListener('wheel', (e) => {
  e.preventDefault();
  const z0 = c2.zoom;
  c2.zoom = clamp(z0 * Math.exp(-e.deltaY * 0.0012), 0.5, 3);
  c2.panY = c2.panY * (c2.zoom / z0); // 围绕画布中心缩放
}, { passive: false });

function draw2d() {
  const W = cv2.clientWidth, H = cv2.clientHeight;
  if (!W || !H) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  if (cv2.width !== Math.round(W * dpr)) { cv2.width = Math.round(W * dpr); cv2.height = Math.round(H * dpr); }
  const ctx = cv2.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const P = pal();
  ctx.fillStyle = P.card;
  ctx.fillRect(0, 0, W, H);

  const cx = W * 0.38 + c2.panX;
  const cy = H * 0.56 + c2.panY;
  const ppc = (H * 0.62 / 100) * c2.zoom;
  const yOf = (t) => cy - (t - 45) * ppc;
  const font = (w, s) => `${w} ${s}px -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif`;

  // 玻璃管
  const yTop = yOf(112), yBot = yOf(-24);
  ctx.fillStyle = 'rgba(140,185,215,0.10)';
  ctx.strokeStyle = P.dim;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(cx - 13, yTop, 26, yBot - yTop, 10);
  ctx.fill(); ctx.stroke();
  // 玻璃泡 + 液柱
  const yBulb = yOf(-20);
  const yCol = yOf(c2.T);
  ctx.fillStyle = '#e0392e';
  ctx.beginPath();
  ctx.roundRect(cx - 4.5, yCol, 9, Math.max(6, yBulb - yCol), 4);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, yBulb, 24, 0, TAU_);
  ctx.fill();
  ctx.strokeStyle = P.dim;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, yBulb, 24, 0, TAU_);
  ctx.stroke();
  // 刻度：每 1℃ 小格、每 10℃ 标数（0 与 100 强调）
  ctx.textAlign = 'right';
  for (let t = -20; t <= 110; t++) {
    const y = yOf(t);
    if (y < 8 || y > H - 8) continue;
    const maj = t % 10 === 0, mid = t % 5 === 0;
    const len = maj ? 14 : mid ? 9 : 5;
    ctx.strokeStyle = maj ? P.text : mid ? P.dim : P.border;
    ctx.lineWidth = maj ? 1.6 : 1;
    ctx.beginPath();
    ctx.moveTo(cx - 13, y); ctx.lineTo(cx - 13 - len, y);
    ctx.stroke();
    if (maj) {
      const key = t === 0 || t === 100;
      ctx.fillStyle = key ? P.accent : P.dim;
      ctx.font = font(key ? '700' : '500', 11.5);
      ctx.fillText(String(t), cx - 30, y + 4);
    }
  }
  ctx.fillStyle = P.dim;
  ctx.font = font('600', 13);
  ctx.textAlign = 'center';
  ctx.fillText('℃', cx, yTop - 10);

  // 0℃ / 100℃ 标定虚线
  const bx = W * 0.74 + c2.panX * 0.4;
  ctx.save();
  ctx.setLineDash([5, 5]);
  [[0, '0℃'], [100, '100℃']].forEach(([t]) => {
    ctx.strokeStyle = P.accent;
    ctx.globalAlpha = 0.55;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(cx + 16, yOf(t)); ctx.lineTo(bx - 60, yOf(t));
    ctx.stroke();
  });
  ctx.restore();

  // 100 等分标注
  if (c2.ann) {
    const ax = cx + 34;
    const y0 = yOf(0), y100 = yOf(100);
    ctx.strokeStyle = P.dim;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(ax, y0); ctx.lineTo(ax, y100);
    ctx.stroke();
    [[y100, 1], [y0, -1]].forEach(([y, d]) => {
      ctx.beginPath();
      ctx.moveTo(ax, y); ctx.lineTo(ax - 4, y + 6 * d); ctx.lineTo(ax + 4, y + 6 * d);
      ctx.closePath();
      ctx.fillStyle = P.dim;
      ctx.fill();
    });
    ctx.save();
    ctx.fillStyle = P.text;
    ctx.font = font('600', 12.5);
    ctx.textAlign = 'left';
    ctx.fillText('0℃ 到 100℃ 分成 100 等份', ax + 8, (y0 + y100) / 2 - 8);
    ctx.fillStyle = P.dim;
    ctx.font = font('500', 11.5);
    ctx.fillText('每一等份就是 1 ℃', ax + 8, (y0 + y100) / 2 + 10);
    ctx.restore();
  }

  // 冰水混合物碗（0℃ 标定）
  const y0 = yOf(0);
  ctx.strokeStyle = P.dim;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(bx, y0 + 6, 52, 20, 0, 0, Math.PI);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(bx - 52, y0 + 6); ctx.lineTo(bx + 52, y0 + 6);
  ctx.stroke();
  ctx.fillStyle = '#bfe0f2';
  ctx.strokeStyle = '#8fc2e0';
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i++) {
    const ix = bx - 36 + i * 17 + (i % 2) * 4;
    const iy = y0 - 2 - (i % 3) * 4;
    ctx.save();
    ctx.translate(ix, iy);
    ctx.rotate((i - 2) * 0.4);
    ctx.beginPath();
    ctx.roundRect(-8, -6, 16, 12, 3);
    ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  if (c2.ann) {
    ctx.fillStyle = P.text;
    ctx.font = font('600', 12.5);
    ctx.textAlign = 'center';
    ctx.fillText('冰水混合物 0℃', bx, y0 + 40);
  }

  // 沸水瓶（100℃ 标定）
  const y100 = yOf(100);
  ctx.strokeStyle = P.dim;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(bx - 7, y100 - 46);
  ctx.lineTo(bx - 7, y100 - 30);
  ctx.lineTo(bx - 34, y100);
  ctx.lineTo(bx + 34, y100);
  ctx.lineTo(bx + 7, y100 - 30);
  ctx.lineTo(bx + 7, y100 - 46);
  ctx.stroke();
  ctx.fillStyle = 'rgba(140,190,220,0.35)';
  ctx.beginPath();
  ctx.moveTo(bx - 27, y100 - 9);
  ctx.lineTo(bx + 27, y100 - 9);
  ctx.lineTo(bx + 34, y100);
  ctx.lineTo(bx - 34, y100);
  ctx.closePath();
  ctx.fill();
  // 蒸汽
  ctx.strokeStyle = P.dim;
  ctx.globalAlpha = 0.6;
  ctx.lineWidth = 1.4;
  for (const dx of [-10, 8]) {
    ctx.beginPath();
    ctx.moveTo(bx + dx, y100 - 52);
    ctx.bezierCurveTo(bx + dx + 6, y100 - 60, bx + dx - 6, y100 - 68, bx + dx, y100 - 76);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  if (c2.ann) {
    ctx.fillStyle = P.text;
    ctx.font = font('600', 12.5);
    ctx.textAlign = 'center';
    ctx.fillText('沸水 100℃', bx, y100 + 22);
  }

  // 游标
  const yT = yOf(c2.T);
  ctx.strokeStyle = P.accent;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx + 16, yT); ctx.lineTo(cx + 30, yT);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx + 34, yT, 3.5, 0, TAU_);
  ctx.fillStyle = P.accent;
  ctx.fill();
  ctx.textAlign = 'left';
  ctx.fillStyle = P.text;
  ctx.font = font('700', 15);
  ctx.fillText(`${Math.round(c2.T)} ℃`, cx + 44, yT + 5);

  // 顶部读数与换算
  ctx.font = font('700', 16);
  ctx.fillText(`游标温度：${Math.round(c2.T)} ℃`, 16, 30);
  if (c2.conv) {
    const F = c2.T * 9 / 5 + 32;
    const K = c2.T + 273.15;
    ctx.fillStyle = P.chip;
    ctx.strokeStyle = P.border;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(W - 226, 14, 210, 60, 10);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = P.text;
    ctx.font = font('500', 12.5);
    ctx.fillText(`℉ = ℃×9/5 + 32 = ${F.toFixed(1)} ℉`, W - 212, 38);
    ctx.fillText(`K = ℃ + 273.15 = ${K.toFixed(1)} K`, W - 212, 60);
  }
  ctx.fillStyle = P.dim;
  ctx.font = font('500', 11.5);
  ctx.textAlign = 'left';
  ctx.fillText('拖拽平移 · 滚轮缩放 · 滑杆移动游标', 16, H - 12);
}

/* 小试管 */
function makeTube(len = 0.12, r = 0.02) {
  const pts = [
    [0, 0], [r * 0.45, 0], [r * 0.85, 0.003], [r * 0.98, 0.008],
    [r, 0.016], [r, len - 0.006], [r * 1.06, len - 0.002], [r * 1.1, len],
  ];
  return lathe(pts, glassMat());
}

/* ---------------- HUD 卡（每章一张，按需显示） ---------------- */

const hudWrap = document.createElement('div');
hudWrap.className = 'lab-hud';
stage.appendChild(hudWrap);
const HUDS = {
  t: makeHUD(hudWrap, [['read', '温度计示数'], ['real', '真实水温'], ['err', '偏差']]),
  melt: makeHUD(hudWrap, [['bath', '水浴温度'], ['s', '海波（晶体）'], ['w', '石蜡（非晶体）']]),
  boil: makeHUD(hudWrap, [['t', '水温'], ['tb', '沸点'], ['st', '状态']]),
  evap: makeHUD(hudWrap, [['dry', '干泡（室温）'], ['wet', '湿泡（蘸酒精）'], ['diff', '温差']]),
  sub: makeHUD(hudWrap, [['bot', '底部温度'], ['cold', '冷端温度'], ['sp', '凝华晶体']]),
  cp: makeHUD(hudWrap, [['w', '水温'], ['o', '油温'], ['diff', '温差']]),
  cond: makeHUD(hudWrap, [['t', '加热时间'], ['n', '已掉火柴']]),
  conv: makeHUD(hudWrap, [['st', '状态'], ['n', '示踪粒子']]),
  rad: makeHUD(hudWrap, [['b', '黑罐温度'], ['w', '白罐温度'], ['diff', '温差']]),
  story: makeHUD(hudWrap, [['ph', '阶段'], ['t', '温度'], ['time', '时间']]),
};
function showHUD(key) {
  for (const k in HUDS) HUDS[k].el.style.display = k === key ? '' : 'none';
}

/* ---------------- 曲线小窗 ---------------- */

const winMelt = makeCurveWin('熔化曲线 · 温度-时间', {
  xMax: 300, xStep: 60, yMin: 0, yMax: 80, yStep: 20, ann: true,
  annLines: [{ y: 48, label: '熔点 48℃ —— 晶体熔化吸热温度不变' }],
  series: [
    { label: '海波（晶体）', color: '#d98a2b', pts: [] },
    { label: '石蜡（非晶体）', color: '#5f9dd8', pts: [] },
  ],
});
const winBoil = makeCurveWin('沸腾曲线 · 温度-时间', {
  xMax: 240, xStep: 60, yMin: 20, yMax: 130, yStep: 20, ann: true, annLines: [],
  series: [{ label: '水温', color: '#3f8fd2', pts: [] }],
});
const winCp = makeCurveWin('升温曲线 · 相同加热条件', {
  xMax: 240, xStep: 60, yMin: 0, yMax: 110, yStep: 20, ann: true, annLines: [{ y: 100, label: '水沸腾 100℃' }],
  series: [
    { label: '水', color: '#3f8fd2', pts: [] },
    { label: '食用油', color: '#d98a2b', pts: [] },
  ],
});
const winRad = makeCurveWin('辐射加热 · 温度-时间', {
  xMax: 240, xStep: 60, yMin: 20, yMax: 100, yStep: 20, ann: false, annLines: [],
  series: [
    { label: '黑罐', color: '#444a52', pts: [] },
    { label: '白罐', color: '#c9ccd2', pts: [] },
  ],
});
const winStory = makeCurveWin('从冰到沸腾 · 完整曲线', {
  xMax: 160, xStep: 20, yMin: -30, yMax: 120, yStep: 20, ann: true,
  annLines: [
    { y: 0, label: '熔化平台：吸热温度不变' },
    { y: 100, label: '沸腾平台：吸热温度不变' },
  ],
  bands: [
    { t0: 0, t1: 44, c: 'rgba(110,160,215,0.14)', label: '固态 → 熔化' },
    { t0: 44, t1: 160, c: 'rgba(110,195,150,0.13)', label: '液态 → 沸腾' },
  ],
  series: [{ label: '温度', color: '#e8674a', pts: [] }],
});
const WINS = [winMelt, winBoil, winCp, winRad, winStory];
function hideWins() { WINS.forEach((w) => w.show(false)); }

/* ---------------- 章节 1 · 温度计的使用 ---------------- */

const stT = { group: new THREE.Group(), T: 25, place: 'ok', view: 'level' };
scene.add(stT.group);
function buildStT() {
  const g = stT.group, SX = -1.7;
  const hp = makeHotplate(0.13, 0.13);
  hp.position.set(SX, BENCH_Y, 0.02);
  const beaker = makeBeaker(0.055, 0.1);
  beaker.position.set(SX, BENCH_Y + 0.022, 0.02);
  const water = makeWater(0.052, 0.072);
  water.position.set(SX, BENCH_Y + 0.064, 0.02);
  const stand = makeStandHold(0.42, 0.18);
  stand.position.set(SX, BENCH_Y, -0.16);
  const th = makeThermometer(0.17);
  th.position.set(SX, BENCH_Y + 0.06, 0.02);
  const lbl = makeLabel('水', '#9fd4e8');
  lbl.position.set(SX - 0.1, BENCH_Y + 0.15, 0.02);
  g.add(hp, beaker, water, stand, th, lbl);
  stT.hp = hp; stT.water = water; stT.th = th; stT.lbl = lbl;
}
const PLACE_OK = new THREE.Vector3(0, BENCH_Y + 0.06, 0.02);
const PLACE_ERR = { bottom: '玻璃泡碰到容器底：容器底直接受热，温度比水温高，示数偏大约 +8℃（正确做法：悬浮在水中，不碰底不碰壁）', wall: '玻璃泡碰到容器壁：壁温受外界影响，示数偏大约 +5℃（正确做法：让玻璃泡完全浸没在水中）', ok: '✓ 玻璃泡完全浸没、不碰底不碰壁' };
const VIEW_ERR = {
  level: '✓ 视线与液柱上表面相平，读数准确（口诀：俯大仰小）',
  down: '俯视读数偏大——视线斜向下，看到的刻度比实际液面高约 +2℃（口诀：俯大仰小）',
  up: '仰视读数偏小——视线斜向上，看到的刻度比实际液面低约 -2℃（口诀：俯大仰小）',
};

/* ---------------- 章节 3 · 熔化和凝固 ---------------- */

const stMelt = { group: new THREE.Group(), Tb: 20, Ts: 20, Tw: 20, melt: 0, power: 1, playing: false, t: 0, rec: 0, sel: 's' };
scene.add(stMelt.group);
function buildStMelt() {
  const g = stMelt.group, SX = -1.05;
  const hp = makeHotplate(0.17, 0.14);
  hp.position.set(SX, BENCH_Y, 0.02);
  const beaker = makeBeaker(0.075, 0.12);
  beaker.position.set(SX, BENCH_Y + 0.022, 0.02);
  const water = makeWater(0.072, 0.085, 0x9fd2e6, 0.38);
  water.position.set(SX, BENCH_Y + 0.0705, 0.02);
  const lid = box(0.19, 0.004, 0.11, stdMat({ color: 0xf0f2f4, roughness: 0.6 }));
  lid.position.set(SX, BENCH_Y + 0.146, 0.02);
  const t1 = makeTube(0.12, 0.02); t1.position.set(SX - 0.032, BENCH_Y + 0.048, 0.02);
  const t2 = makeTube(0.12, 0.02); t2.position.set(SX + 0.032, BENCH_Y + 0.048, 0.02);
  const f1 = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.045, 14), stdMat({ color: 0xd9cba0, roughness: 0.85 }));
  f1.position.set(SX - 0.032, BENCH_Y + 0.072, 0.02);
  const f2 = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.045, 14), liquidMat(0xf2eee2, 0.7));
  f2.position.set(SX + 0.032, BENCH_Y + 0.072, 0.02);
  const l1 = makeLabel('海波（晶体）', '#e8c37d');
  l1.position.set(SX - 0.04, BENCH_Y + 0.21, 0.02);
  const l2 = makeLabel('石蜡（非晶体）', '#a9d3ee');
  l2.position.set(SX + 0.05, BENCH_Y + 0.24, 0.02);
  g.add(hp, beaker, water, lid, t1, t2, f1, f2, l1, l2);
  stMelt.hp = hp; stMelt.f1 = f1; stMelt.f2 = f2;
}

/* ---------------- 章节 4 · 水的沸腾 ---------------- */

const stBoil = { group: new THREE.Group(), P: 1, Tb: 100, T: 20, power: 1, playing: false, t: 0, rec: 0, boil: false };
scene.add(stBoil.group);
function bpAt(p) { // 沸点-气压经验插值：0.5→81 / 1.0→100 / 1.5→112 / 2.0→120 ℃
  const pts = [[0.5, 81], [1.0, 100], [1.5, 112], [2.0, 120]];
  if (p <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) {
    if (p <= pts[i][0]) {
      const [p0, t0] = pts[i - 1], [p1, t1] = pts[i];
      return t0 + ((p - p0) / (p1 - p0)) * (t1 - t0);
    }
  }
  return pts[pts.length - 1][1];
}
function buildStBoil() {
  const g = stBoil.group, SX = -0.45;
  const hp = makeHotplate(0.13, 0.13);
  hp.position.set(SX, BENCH_Y, 0.02);
  const beaker = makeBeaker(0.055, 0.1);
  beaker.position.set(SX, BENCH_Y + 0.022, 0.02);
  const water = makeWater(0.052, 0.07);
  water.position.set(SX, BENCH_Y + 0.063, 0.02);
  const stand = makeStandHold(0.42, 0.18);
  stand.position.set(SX, BENCH_Y, -0.16);
  const th = makeThermometer(0.17);
  th.position.set(SX + 0.02, BENCH_Y + 0.06, 0.02);
  g.add(hp, beaker, water, stand, th);
  stBoil.hp = hp; stBoil.water = water; stBoil.th = th;
}

/* ---------------- 章节 5 · 蒸发和液化 ---------------- */

const stEvap = { group: new THREE.Group(), fan: false, fspeed: 0, amb: 25, alcohol: 1, Tw: 25, mistT: 0 };
scene.add(stEvap.group);
function buildStEvap() {
  const g = stEvap.group, SX = 0.2;
  const panel = box(0.22, 0.26, 0.012, stdMat({ color: 0xeef1f4, roughness: 0.7 }));
  panel.position.set(SX, BENCH_Y + 0.13, -0.035);
  const wet = makeThermometer(0.15);
  wet.position.set(SX - 0.03, BENCH_Y + 0.141, 0);
  const dry = makeThermometer(0.15);
  dry.position.set(SX + 0.05, BENCH_Y + 0.141, 0);
  const cotton = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.012, 0.02, 10), stdMat({ color: 0xf5f3ec, roughness: 1 }));
  cotton.position.set(SX - 0.03, BENCH_Y + 0.145, 0);
  const fan = makeFan();
  fan.position.set(SX - 0.13, BENCH_Y, 0);
  // 酒精瓶
  const bottle = lathe([
    [0, 0.002], [0.014, 0.003], [0.024, 0.008], [0.025, 0.014],
    [0.025, 0.05], [0.01, 0.056], [0.01, 0.07], [0.013, 0.074],
  ], glassMat(0.3, 0xd8e4da));
  bottle.position.set(SX + 0.1, BENCH_Y, 0.05);
  const alc = new THREE.Mesh(new THREE.CylinderGeometry(0.021, 0.023, 0.032, 16), liquidMat(0xd9e9f2, 0.45));
  alc.position.set(SX + 0.1, BENCH_Y + 0.022, 0.05);
  // 白气演示：水杯 + 上方金属板（水蒸气遇冷液化）
  const cup = makeBeaker(0.03, 0.05);
  cup.position.set(SX + 0.16, BENCH_Y + 0.001, 0.03);
  const hotW = makeWater(0.027, 0.032, 0xa9d4e6, 0.4);
  hotW.position.set(SX + 0.16, BENCH_Y + 0.026, 0.03);
  const post1 = new THREE.Mesh(new THREE.CylinderGeometry(0.002, 0.002, 0.115, 8), metalMat);
  post1.position.set(SX + 0.135, BENCH_Y + 0.0575, 0.03);
  const post2 = post1.clone(); post2.position.x = SX + 0.185;
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.004, 20), stdMat({ color: 0x9fb0bd, roughness: 0.35, metalness: 0.6 }));
  plate.position.set(SX + 0.16, BENCH_Y + 0.116, 0.03);
  g.add(panel, wet, dry, cotton, fan, bottle, alc, cup, hotW, post1, post2, plate);
  stEvap.fan = fan; stEvap.cotton = cotton; stEvap.thW = wet; stEvap.thD = dry;
}

/* ---------------- 章节 6 · 升华和凝华（碘锤） ---------------- */

const stSub = { group: new THREE.Group(), on: false, Tb6: 25, cold: 5, speckAcc: 0, vapAcc: 0 };
scene.add(stSub.group);
function buildStSub() {
  const g = stSub.group, SX = 0.85;
  const stand = makeStandHold(0.38, 0.19);
  stand.position.set(SX - 0.18, BENCH_Y, -0.05);
  stand.rotation.y = 1.29;
  const tubeG = new THREE.Group();
  tubeG.position.set(SX, 1.03, 0);
  tubeG.rotation.z = 0.35;
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.16, 20), glassMat(0.2));
  const capB = new THREE.Mesh(new THREE.SphereGeometry(0.02, 16, 12), glassMat(0.2));
  capB.position.y = -0.08;
  const capT = capB.clone(); capT.position.y = 0.08;
  const solid = new THREE.Mesh(new THREE.IcosahedronGeometry(0.013, 0), stdMat({ color: 0x3a1250, roughness: 0.35, metalness: 0.15 }));
  solid.position.y = -0.06;
  const specks = [];
  for (let i = 0; i < 24; i++) {
    const sp = new THREE.Mesh(new THREE.TetrahedronGeometry(0.0026, 0), stdMat({ color: 0x2d0d40, roughness: 0.4 }));
    const a = Math.random() * TAU_;
    sp.position.set(Math.cos(a) * 0.0145, 0.02 + Math.random() * 0.045, Math.sin(a) * 0.0145);
    sp.rotation.set(Math.random() * 3, Math.random() * 3, 0);
    sp.visible = false;
    tubeG.add(sp);
    specks.push(sp);
  }
  tubeG.add(body, capB, capT, solid);
  const flame = makeFlame();
  flame.position.set(SX + 0.028, BENCH_Y + 0.052, 0);
  flame.visible = false;
  const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.024, 0.012, 16), metalMat);
  dish.position.set(SX + 0.028, BENCH_Y + 0.008, 0);
  const heatLight = new THREE.PointLight(0xffa040, 1.4, 0.5, 2);
  heatLight.position.set(SX + 0.028, BENCH_Y + 0.07, 0);
  heatLight.visible = false;
  const lbl = makeLabel('碘锤（密封玻璃管）', '#d5b6ea');
  lbl.position.set(SX + 0.02, 1.22, 0);
  g.add(stand, tubeG, flame, dish, heatLight, lbl);
  stSub.tubeG = tubeG; stSub.flame = flame; stSub.heatLight = heatLight;
  stSub.specks = specks; stSub.solid = solid;
}

/* ---------------- 章节 7 · 比较不同物质的吸热能力 ---------------- */

const stCp = { group: new THREE.Group(), m: 0.2, Tw: 20, To: 20, playing: false, t: 0, rec: 0, sel: 'both' };
scene.add(stCp.group);
function buildStCp() {
  const g = stCp.group, SX = 1.6;
  const hp1 = makeHotplate(0.1, 0.1);
  hp1.position.set(SX - 0.062, BENCH_Y, 0.02);
  const hp2 = makeHotplate(0.1, 0.1);
  hp2.position.set(SX + 0.062, BENCH_Y, 0.02);
  const bw = makeBeaker(0.045, 0.08);
  bw.position.set(SX - 0.062, BENCH_Y + 0.022, 0.02);
  const bo = makeBeaker(0.045, 0.08);
  bo.position.set(SX + 0.062, BENCH_Y + 0.022, 0.02);
  const wwater = makeWater(0.042, 0.05, 0x7fb8d8, 0.45);
  wwater.position.set(SX - 0.062, BENCH_Y + 0.049, 0.02);
  const oil = makeWater(0.042, 0.05, 0xd9a441, 0.7);
  oil.position.set(SX + 0.062, BENCH_Y + 0.049, 0.02);
  const l1 = makeLabel('水', '#9fd4e8');
  l1.position.set(SX - 0.062, BENCH_Y + 0.155, 0.02);
  const l2 = makeLabel('食用油', '#eecc8a');
  l2.position.set(SX + 0.062, BENCH_Y + 0.205, 0.02);
  g.add(hp1, hp2, bw, bo, wwater, oil, l1, l2);
  stCp.hp1 = hp1; stCp.hp2 = hp2; stCp.wwater = wwater; stCp.oil = oil;
  stCp.grpW = bw; stCp.grpO = bo; stCp.l1 = l1; stCp.l2 = l2;
}

/* ---------------- 章节 8 · 热传导（四棒 + 火柴） ---------------- */

const ROD_DEF = [
  { name: '铜', k: '401', color: 0xc47a3a, kn: 1.0 },
  { name: '铝', k: '237', color: 0xdfe3e8, kn: 0.59 },
  { name: '铁', k: '80', color: 0x6d7078, kn: 0.2 },
  { name: '玻璃', k: '≈1', color: 0xcfe4ee, kn: 0.003 },
];
const ROD_Y = [0.975, 1.02, 1.065, 1.11];
const MATCH_X = [-0.1, 0.0, 0.1];
const stCnd = { group: new THREE.Group(), on: false, time: 0, thermal: false, dropped: 0 };
scene.add(stCnd.group);
function buildStCond() {
  const g = stCnd.group;
  const panel = box(0.72, 0.42, 0.016, stdMat({ color: 0xeef1f4, roughness: 0.75 }));
  panel.position.set(0, BENCH_Y + 0.21, -0.1);
  const blockMat = stdMat({ color: 0x33363c, roughness: 0.5, metalness: 0.4 });
  const heater = box(0.06, 0.26, 0.05, blockMat);
  heater.position.set(-0.335, 1.06, 0);
  const glow = box(0.05, 0.26, 0.056, stdMat({ color: 0x5a2018, roughness: 0.5, emissive: 0x000000 }));
  glow.position.set(-0.335, 1.06, 0.004);
  g.add(panel, heater, glow);
  stCnd.glow = glow;
  stCnd.segs = [];
  stCnd.matches = [];
  ROD_DEF.forEach((rd, ri) => {
    const y = ROD_Y[ri];
    const segs = [];
    for (let i = 0; i < 8; i++) {
      const base = new THREE.Color(rd.color);
      const mat = rd.k === '≈1'
        ? new THREE.MeshPhysicalMaterial({ color: rd.color, metalness: 0, roughness: 0.08, transparent: true, opacity: 0.45, envMapIntensity: 0.5 })
        : stdMat({ color: rd.color, metalness: 0.88, roughness: 0.35 });
      mat.userData.base = base;
      const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.0625, 12), mat);
      seg.rotation.z = Math.PI / 2;
      seg.position.set(-0.3 + 0.0625 * (i + 0.5), y, 0.01);
      g.add(seg);
      segs.push({ mesh: seg, T: 23 });
    }
    const lbl = makeLabel(rd.name, '#dfe6ee');
    lbl.position.set(0.27, y + 0.012, 0.01);
    g.add(lbl);
    MATCH_X.forEach((mx, mi) => {
      const m = makeMatch();
      m.position.set(mx, y - 0.008, 0.01);
      g.add(m);
      stCnd.matches.push({ g: m, ri, si: [3, 4, 6][mi], fall: false, vy: 0, rot: 0 });
    });
    stCnd.segs.push(segs);
  });
}

/* ---------------- 章节 9 · 热对流（高锰酸钾示踪） ---------------- */

const stCnv = { group: new THREE.Group(), mode: 'bottom', power: 1, density: 0.6, lines: false, acc: 0 };
scene.add(stCnv.group);
function buildStConv() {
  const g = stCnv.group, SX = 0.05;
  const hp = makeHotplate(0.12, 0.12);
  hp.position.set(SX, BENCH_Y, 0.02);
  const side = box(0.028, 0.06, 0.05, stdMat({ color: 0x3a3d44, roughness: 0.5, metalness: 0.4 }));
  side.position.set(SX - 0.058, BENCH_Y + 0.055, 0.02);
  const sideGlow = box(0.02, 0.056, 0.052, stdMat({ color: 0x5a2018, roughness: 0.5, emissive: 0x000000 }));
  sideGlow.position.set(SX - 0.05, BENCH_Y + 0.055, 0.02);
  const beaker = makeBeaker(0.055, 0.1);
  beaker.position.set(SX, BENCH_Y + 0.022, 0.02);
  const water = makeWater(0.052, 0.075, 0xbfe2ef, 0.28);
  water.position.set(SX, BENCH_Y + 0.064, 0.02);
  // 高锰酸钾晶粒（底部 / 侧壁两套）
  function grains(cx) {
    const grp = new THREE.Group();
    for (let i = 0; i < 5; i++) {
      const c = new THREE.Mesh(new THREE.DodecahedronGeometry(0.0026 + Math.random() * 0.0015, 0), stdMat({ color: 0x4a1150, roughness: 0.6 }));
      c.position.set(cx + (Math.random() - 0.5) * 0.016, BENCH_Y + 0.031, 0.02 + (Math.random() - 0.5) * 0.016);
      grp.add(c);
    }
    return grp;
  }
  const grainsB = grains(SX);
  const grainsS = grains(SX - 0.034);
  g.add(hp, side, sideGlow, beaker, water, grainsB, grainsS);
  stCnv.hp = hp; stCnv.side = side; stCnv.sideGlow = sideGlow;
  stCnv.grainsB = grainsB; stCnv.grainsS = grainsS;
  // 两条对流环路（世界坐标，闭合）
  const y0 = BENCH_Y + 0.034, y1 = BENCH_Y + 0.096, x0 = SX;
  const ptsB = [
    [x0, y0 + 0.008, 0.02], [x0, y1 - 0.01, 0.02], [x0 + 0.016, y1 - 0.004, 0.032],
    [x0 + 0.036, (y0 + y1) / 2, 0.024], [x0 + 0.02, y0 + 0.006, 0.008], [x0 - 0.008, y0 + 0.008, 0.016],
  ];
  const ptsS = [
    [x0 - 0.034, y0 + 0.01, 0.02], [x0 - 0.032, y1 - 0.008, 0.028], [x0 - 0.01, y1 - 0.004, 0.02],
    [x0 + 0.02, y1 - 0.01, 0.012], [x0 + 0.034, y0 + 0.04, 0.02], [x0 + 0.012, y0 + 0.005, 0.026], [x0 - 0.012, y0 + 0.008, 0.02],
  ];
  stCnv.curveB = new THREE.CatmullRomCurve3(ptsB.map((p) => new THREE.Vector3(...p)), true);
  stCnv.curveS = new THREE.CatmullRomCurve3(ptsS.map((p) => new THREE.Vector3(...p)), true);
  function lineOf(curve) {
    const geo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(80));
    return new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0x9b4fc2, transparent: true, opacity: 0.5 }));
  }
  stCnv.lineB = lineOf(stCnv.curveB);
  stCnv.lineS = lineOf(stCnv.curveS);
  stCnv.lineB.visible = stCnv.lineS.visible = false;
  g.add(stCnv.lineB, stCnv.lineS);
}

/* ---------------- 章节 10 · 热辐射（红外灯 + 黑白罐） ---------------- */

const stRadS = { group: new THREE.Group(), on: false, power: 1, Tb: 25, Tw: 25, t: 0, rec: 0 };
scene.add(stRadS.group);
function buildStRad() {
  const g = stRadS.group, LX = -0.78;
  const base = box(0.09, 0.012, 0.12, metalMat);
  base.position.set(LX, BENCH_Y + 0.006, 0);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.16, 12), metalMat);
  pole.position.set(LX, BENCH_Y + 0.08, 0);
  const reflMat = stdMat({ color: 0xd7dde2, roughness: 0.3, metalness: 0.85, side: THREE.DoubleSide });
  const refl = new THREE.Mesh(new THREE.SphereGeometry(0.04, 18, 10, 0, TAU_, 0, Math.PI / 2), reflMat);
  refl.rotation.z = Math.PI / 2;
  refl.position.set(LX, 1.06, 0);
  const bulbMat = stdMat({ color: 0xff8a4a, emissive: 0xff7a30, emissiveIntensity: 0, roughness: 0.3 });
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.013, 14, 10), bulbMat);
  bulb.position.set(-0.755, 1.06, 0);
  const cone = new THREE.Mesh(
    new THREE.ConeGeometry(0.1, 0.55, 24, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xffb070, transparent: true, opacity: 0.05, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  cone.rotation.z = Math.PI / 2;
  cone.position.set(-0.48, 1.06, 0);
  const light = new THREE.PointLight(0xffa060, 0, 2.4, 2);
  light.position.set(-0.7, 1.06, 0);
  g.add(base, pole, refl, bulb, cone, light);
  stRadS.bulbMat = bulbMat; stRadS.cone = cone; stRadS.light = light;
  function can(color, z, name, lc) {
    const ped = box(0.028, 0.02, 0.028, stdMat({ color: 0x3a3d44, roughness: 0.5 }));
    ped.position.set(-0.12, BENCH_Y + 0.01, z);
    const bodyMat = stdMat({ color, roughness: 0.5, metalness: 0.1, emissive: 0x000000 });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.09, 22), bodyMat);
    body.position.set(-0.12, BENCH_Y + 0.065, z);
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.031, 0.031, 0.006, 22), stdMat({ color: 0x565b63, roughness: 0.4, metalness: 0.5 }));
    lid.position.set(-0.12, BENCH_Y + 0.113, z);
    const lbl = makeLabel(name, lc);
    lbl.position.set(-0.12, BENCH_Y + 0.16, z);
    g.add(ped, body, lid, lbl);
    return bodyMat;
  }
  stRadS.mB = can(0x1a1c20, -0.055, '黑罐', '#b9c2ca');
  stRadS.mW = can(0xe8eaee, 0.055, '白罐', '#e2e6ea');
}

/* ---------------- 章节 11 · 从冰到沸腾（综合剧情） ---------------- */

const TL = {
  p1: [0, 16], p2: [16, 44], p3: [44, 108], p4: [108, 150],
};
const stSty = { group: new THREE.Group(), playing: true, speed: 1, t: 0, T: -20, ann: true, rec: 0, recOn: true };
scene.add(stSty.group);
function buildStStory() {
  const g = stSty.group, SX = 0.05;
  const hp = makeHotplate(0.13, 0.13);
  hp.position.set(SX, BENCH_Y, 0.02);
  const beaker = makeBeaker(0.055, 0.1);
  beaker.position.set(SX, BENCH_Y + 0.022, 0.02);
  const water = makeWater(0.052, 0.075, 0xa9d8ea, 0.42);
  water.position.set(SX, BENCH_Y + 0.064, 0.02);
  const ice = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.03, 0.032), new THREE.MeshPhysicalMaterial({
    color: 0xeef7fb, transparent: true, opacity: 0.85, roughness: 0.25, envMapIntensity: 0.6,
  }));
  ice.position.set(SX, BENCH_Y + 0.09, 0.02);
  g.add(hp, beaker, water, ice);
  stSty.hp = hp; stSty.water = water; stSty.ice = ice;
}
function storyPhase(t) {
  if (t < TL.p2[0]) return { ph: 1, T: -20 + (t - TL.p1[0]) * (20 / (TL.p1[1] - TL.p1[0])) };
  if (t < TL.p3[0]) return { ph: 2, T: 0 };
  if (t < TL.p4[0]) return { ph: 3, T: (t - TL.p3[0]) * (100 / (TL.p3[1] - TL.p3[0])) };
  if (t < 150) return { ph: 4, T: 100 };
  return { ph: 4, T: 100 };
}
const PH_NAMES = { 1: '固态升温 -20→0℃', 2: '熔化平台 0℃（吸热温度不变）', 3: '液态升温 0→100℃', 4: '沸腾平台 100℃（吸热温度不变）' };

/* ---------------- UI：提示条 / 图例 ---------------- */

let toastTimer = null;
function toast(text, kind = '') {
  let el = stage.querySelector('.heat-toast');
  if (!el) { el = document.createElement('div'); el.className = 'heat-toast'; stage.appendChild(el); }
  el.textContent = text;
  el.className = 'heat-toast show' + (kind ? ' ' + kind : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3600);
}

let hintEl = null;
function setHint(text) {
  if (!text) { if (hintEl) { hintEl.remove(); hintEl = null; } return; }
  if (!hintEl) { hintEl = document.createElement('div'); hintEl.className = 'legend'; stage.appendChild(hintEl); }
  hintEl.innerHTML = '';
  const row = document.createElement('div');
  row.className = 'lg-row';
  row.textContent = text;
  hintEl.appendChild(row);
}

function hideAll() {
  [stT, stMelt, stBoil, stEvap, stSub, stCp, stCnd, stCnv, stRadS, stSty].forEach((s) => { s.group.visible = false; });
  for (const k in HUDS) HUDS[k].el.style.display = 'none';
  hideWins();
  cv2.style.display = 'none';
  setHint(null);
  resetParticles();
}

/* ---------------- 各章节逐帧状态更新 ---------------- */

function uT() {
  stT.th.userData.setFrac((stT.T + 20) / 130);
  stT.water.material.color.setHex(0x7fb8d8).lerp(new THREE.Color(0xbcdce8), clamp((stT.T - 20) / 80, 0, 1));
  const err = (stT.place === 'bottom' ? 8 : stT.place === 'wall' ? 5 : 0) + (stT.view === 'down' ? 2 : stT.view === 'up' ? -2 : 0);
  HUDS.t.set('read', (stT.T + err).toFixed(1) + ' ℃');
  HUDS.t.set('real', stT.T.toFixed(1) + ' ℃');
  HUDS.t.set('err', err === 0 ? '0 ℃' : (err > 0 ? '+' : '') + err + ' ℃');
}

function uMelt(dt) {
  const S = stMelt;
  if (S.playing) {
    S.Tb += (62 - S.Tb) * 0.10 * S.power * dt;
    if (S.melt < 1) {
      if (S.Ts < 48) {
        S.Ts += (S.Tb - S.Ts) * 0.14 * dt;
        if (S.Ts >= 47.6) S.Ts = 48; // 到达熔点后进入平台
      } else {
        S.melt = Math.min(1, S.melt + Math.max(0, S.Tb - 48) * 0.025 * S.power * dt);
      }
    } else {
      S.Ts += (S.Tb - S.Ts) * 0.14 * dt;
    }
    S.Tw += (S.Tb - S.Tw) * 0.14 * dt;
    S.t += dt; S.rec += dt;
    while (S.rec >= 0.4) {
      S.rec -= 0.4;
      winMelt.cfg.series[0].pts.push([S.t, S.Ts]);
      winMelt.cfg.series[1].pts.push([S.t, S.Tw]);
      if (winMelt.cfg.series[0].pts.length > 1600) { winMelt.cfg.series[0].pts.shift(); winMelt.cfg.series[1].pts.shift(); }
    }
  }
  S.hp.userData.setOn(S.playing, S.power);
  winMelt.cfg.series[0].dim = S.sel !== 's';
  winMelt.cfg.series[1].dim = S.sel !== 'w';
  HUDS.melt.set('bath', S.Tb.toFixed(1) + ' ℃');
  HUDS.melt.set('s', S.Ts.toFixed(1) + ' ℃' + (S.melt > 0 && S.melt < 1 ? ' · 熔化中' : S.melt >= 1 ? ' · 熔完' : ''));
  HUDS.melt.set('w', S.Tw.toFixed(1) + ' ℃');
}

function uBoil(dt) {
  const S = stBoil, SX = -0.45;
  S.Tb = bpAt(S.P);
  if (S.playing) {
    if (S.T < S.Tb) {
      S.T += (S.Tb - S.T) * 0.05 * S.power * dt;
      if (S.T > S.Tb - 0.4) S.T = S.Tb;
    } else if (S.T > S.Tb) {
      S.T -= (S.T - S.Tb) * 0.5 * dt; // 降压后快速回落到新沸点
    }
    S.t += dt; S.rec += dt;
    while (S.rec >= 0.4) {
      S.rec -= 0.4;
      winBoil.cfg.series[0].pts.push([S.t, S.T]);
      if (winBoil.cfg.series[0].pts.length > 1600) winBoil.cfg.series[0].pts.shift();
    }
    const topY = BENCH_Y + 0.092, botY = BENCH_Y + 0.034;
    const boiling = S.T >= S.Tb - 0.01;
    if (S.T > 75 && !boiling) {
      if (Math.random() < dt * 4) spawnBubble(SX, botY, 0.02, topY, 0.04, -0.4, 0.9); // 沸腾前：上升变小
    } else if (boiling) {
      if (Math.random() < dt * 20 * S.power) spawnBubble(SX, botY, 0.02, topY, 0.07, 0.9, 0.5); // 沸腾：底部生成上升变大
    }
  }
  S.th.userData.setFrac((S.T + 20) / 130);
  S.hp.userData.setOn(S.playing, S.power);
  winBoil.cfg.ann = true;
  winBoil.cfg.annLines = [{ y: S.Tb, label: '沸点 ' + Math.round(S.Tb) + '℃ · 沸腾吸热温度不变' }];
  HUDS.boil.set('t', S.T.toFixed(1) + ' ℃');
  HUDS.boil.set('tb', Math.round(S.Tb) + ' ℃ @ ' + S.P.toFixed(2) + ' atm');
  HUDS.boil.set('st', !S.playing ? '停止' : S.T >= S.Tb - 0.01 ? '沸腾中' : S.T > 75 ? '接近沸腾' : '加热中');
}

function uEvap(dt) {
  const S = stEvap, SX = 0.2;
  S.thD.userData.setFrac((S.amb + 20) / 130);
  S.thW.userData.setFrac((S.Tw + 20) / 130);
  S.fspeed += ((S.fan ? 15 : 0) - S.fspeed) * Math.min(1, dt * 3);
  if (S.fan && S.fan.userData.blades) S.fan.userData.blades.rotation.x += S.fspeed * dt;
  const dT = S.alcohol > 0 ? Math.min(8.5, (2.5 + S.alcohol * 2.2) * (S.fan ? 1.45 : 1)) : 0;
  S.Tw += ((S.amb - dT) - S.Tw) * (0.25 + (S.fan ? 0.35 : 0)) * dt;
  if (S.mistT > 0) {
    S.mistT -= dt;
    if (Math.random() < dt * 6) puffAt(SX + 0.16 + (Math.random() - 0.5) * 0.02, BENCH_Y + 0.06, 0.03, 0.045);
  }
  HUDS.evap.set('dry', S.amb.toFixed(1) + ' ℃');
  HUDS.evap.set('wet', S.Tw.toFixed(1) + ' ℃');
  HUDS.evap.set('diff', (S.amb - S.Tw).toFixed(1) + ' ℃');
}

function uSub(dt) {
  const S = stSub;
  S.Tb6 += ((S.on ? 120 : 25) - S.Tb6) * (S.on ? 0.25 : 0.06) * dt;
  S.flame.visible = S.on;
  if (S.on) {
    const s = 1 + Math.sin(performance.now() * 0.03) * 0.12;
    S.flame.userData.outer.scale.set(0.045 * s, 0.075 * s, 1);
  }
  S.heatLight.visible = S.on;
  const dir = new THREE.Vector3(-Math.sin(0.35), Math.cos(0.35), 0);
  const wp = new THREE.Vector3();
  S.solid.getWorldPosition(wp);
  const vapOn = S.Tb6 > 55;
  if (vapOn) {
    S.vapAcc += dt * 9 * ((S.Tb6 - 55) / 65);
    while (S.vapAcc >= 1) { S.vapAcc -= 1; spawnVapor(wp.x, wp.y, wp.z, dir, 0.055, 1.7); }
  }
  if (vapOn && S.cold < 22) S.speckAcc += dt * (22 - S.cold) * 0.012;
  const n = Math.min(24, Math.floor(S.speckAcc));
  S.specks.forEach((sp, i) => { sp.visible = i < n; });
  HUDS.sub.set('bot', Math.round(S.Tb6) + ' ℃');
  HUDS.sub.set('cold', Math.round(S.cold) + ' ℃');
  HUDS.sub.set('sp', n + ' / 24');
}

function uCp(dt) {
  const S = stCp;
  if (S.playing) {
    const rw = 0.55 * (0.2 / S.m);  // ΔT/Δt ∝ 1/c，c水 = 4.2×10³
    const ro = 1.10 * (0.2 / S.m);  // c油 ≈ 2.1×10³ → 相同吸热升温约 2 倍
    if (S.Tw < 100) S.Tw = Math.min(100, S.Tw + rw * dt);
    if (S.To < 105) S.To = Math.min(105, S.To + ro * dt);
    S.t += dt; S.rec += dt;
    while (S.rec >= 0.4) {
      S.rec -= 0.4;
      winCp.cfg.series[0].pts.push([S.t, S.Tw]);
      winCp.cfg.series[1].pts.push([S.t, S.To]);
      if (winCp.cfg.series[0].pts.length > 1600) { winCp.cfg.series[0].pts.shift(); winCp.cfg.series[1].pts.shift(); }
    }
  }
  S.hp1.userData.setOn(S.playing, 1);
  S.hp2.userData.setOn(S.playing, 1);
  winCp.info.textContent = '油升温 ≈ 2×水（Q=cmΔt）';
  HUDS.cp.set('w', S.Tw.toFixed(1) + ' ℃');
  HUDS.cp.set('o', S.To.toFixed(1) + ' ℃');
  HUDS.cp.set('diff', (S.To - S.Tw).toFixed(1) + ' ℃');
}

const HOTCOL = new THREE.Color(0xff5a22);
function uCond(dt) {
  const S = stCnd;
  if (S.on) S.time += dt;
  const heaterT = S.on ? 320 : 23;
  S.segs.forEach((segs, ri) => {
    let prev = heaterT;
    segs.forEach((sg) => {
      sg.T += (prev - sg.T) * (S.on ? 0.55 * ROD_DEF[ri].kn : 0.05) * dt;
      sg.T += (23 - sg.T) * 0.008 * dt;
      prev = sg.T;
      const f = clamp((sg.T - 24) / 280, 0, 1);
      if (S.thermal) sg.mesh.material.color.copy(sg.mesh.material.userData.base).lerp(HOTCOL, f);
      else sg.mesh.material.color.copy(sg.mesh.material.userData.base);
    });
  });
  S.glow.material.emissive.setHex(S.on ? 0xd23c14 : 0x000000);
  S.glow.material.emissiveIntensity = S.on ? 0.9 : 0;
  S.matches.forEach((m) => {
    if (!m.fall && S.on && S.segs[m.ri][m.si].T > 62) { m.fall = true; m.vy = 0; S.dropped++; }
    if (m.fall && m.g.position.y > BENCH_Y + 0.006) {
      m.vy += 3.5 * dt;
      m.g.position.y -= m.vy * dt;
      m.rot += dt * 2.5;
      m.g.rotation.z = Math.min(1.3, m.rot);
      if (m.g.position.y <= BENCH_Y + 0.006) m.g.position.y = BENCH_Y + 0.006;
    }
  });
  HUDS.cond.set('t', Math.floor(S.time) + ' s');
  HUDS.cond.set('n', S.dropped + ' / 12');
}

function uConv() {
  const S = stCnv;
  convCurve = S.mode === 'bottom' ? S.curveB : S.curveS;
  S.hp.visible = S.mode === 'bottom';
  S.side.visible = S.sideGlow.visible = S.mode === 'side';
  S.grainsB.visible = S.mode === 'bottom';
  S.grainsS.visible = S.mode === 'side';
  S.sideGlow.material.emissive.setHex(S.mode === 'side' ? 0xd23c14 : 0x000000);
  S.sideGlow.material.emissiveIntensity = S.mode === 'side' ? 0.8 : 0;
  S.hp.userData.setOn(S.mode === 'bottom', S.power);
  S.lineB.visible = S.lines && S.mode === 'bottom';
  S.lineS.visible = S.lines && S.mode === 'side';
  if (S.power > 0.05) {
    S.acc += 0.016 * 12 * S.density * S.power; // 近似每帧
    while (S.acc >= 1) { S.acc -= 1; spawnTracer(); }
  }
  HUDS.conv.set('st', S.power > 0.05 ? '对流中' : '停止加热');
  HUDS.conv.set('n', tracers.filter((p) => p.on).length + ' / 140');
}

function uRad(dt) {
  const S = stRadS;
  if (S.on) {
    S.Tb = Math.min(95, S.Tb + 1.9 * S.power * dt);
    S.Tw = Math.min(95, S.Tw + 0.8 * S.power * dt);
    S.t += dt; S.rec += dt;
    while (S.rec >= 0.4) {
      S.rec -= 0.4;
      winRad.cfg.series[0].pts.push([S.t, S.Tb]);
      winRad.cfg.series[1].pts.push([S.t, S.Tw]);
      if (winRad.cfg.series[0].pts.length > 1600) { winRad.cfg.series[0].pts.shift(); winRad.cfg.series[1].pts.shift(); }
    }
  } else {
    S.Tb += (23 - S.Tb) * 0.05 * dt;
    S.Tw += (23 - S.Tw) * 0.05 * dt;
  }
  S.bulbMat.emissiveIntensity = S.on ? 1.2 * S.power : 0;
  S.light.intensity = S.on ? 1.1 * S.power : 0;
  S.cone.material.opacity = S.on ? 0.03 + 0.045 * S.power : 0;
  S.mB.emissive.setHex(0xcc2200);
  S.mB.emissiveIntensity = clamp((S.Tb - 25) / 70, 0, 1) * 0.3;
  S.mW.emissive.setHex(0xcc2200);
  S.mW.emissiveIntensity = clamp((S.Tw - 25) / 70, 0, 1) * 0.12;
  HUDS.rad.set('b', S.Tb.toFixed(1) + ' ℃');
  HUDS.rad.set('w', S.Tw.toFixed(1) + ' ℃');
  HUDS.rad.set('diff', (S.Tb - S.Tw).toFixed(1) + ' ℃');
}

function uStory(dt) {
  const S = stSty, SX = 0.05;
  if (S.playing) {
    S.t = Math.min(150, S.t + dt * S.speed);
    S.rec += dt * S.speed;
    while (S.rec >= 0.4) {
      S.rec -= 0.4;
      winStory.cfg.series[0].pts.push([S.t, S.T]);
      if (winStory.cfg.series[0].pts.length > 800) winStory.cfg.series[0].pts.shift();
    }
  }
  const cur = storyPhase(S.t);
  S.T = cur.T;
  let lvl = 0.55, iceS = 1;
  if (cur.ph === 2) {
    const k2 = clamp((S.t - TL.p2[0]) / (TL.p2[1] - TL.p2[0]), 0, 1);
    iceS = 1 - k2 * 0.88;
    lvl = 0.55 + k2 * 0.45;
  } else if (cur.ph >= 3) { iceS = 0.12; lvl = 1; }
  S.water.scale.y = lvl;
  S.water.position.y = BENCH_Y + 0.028 + 0.0375 * lvl;
  S.ice.scale.setScalar(Math.max(iceS, 0.001));
  S.ice.position.y = BENCH_Y + 0.028 + 0.075 * lvl + 0.012 * iceS;
  S.ice.visible = iceS > 0.14;
  S.hp.userData.setOn(S.t > 0.5 && S.t < 150, 1.2);
  const topY = BENCH_Y + 0.028 + 0.075 * lvl - 0.004;
  if (cur.ph === 4 && S.playing) {
    if (Math.random() < dt * 16) spawnBubble(SX, BENCH_Y + 0.034, 0.02, topY, 0.06, 0.8, 0.5);
    if (Math.random() < dt * 2.5) puffAt(SX + (Math.random() - 0.5) * 0.03, topY + 0.01, 0.02, 0.035);
  }
  HUDS.story.set('ph', PH_NAMES[cur.ph]);
  HUDS.story.set('t', Math.round(S.T) + ' ℃');
  HUDS.story.set('time', Math.floor(S.t) + ' s');
}

/* ---------------- 帧循环（labReady 守卫，防黑屏） ---------------- */

let labReady = false;
app.onFrame((dt) => {
  if (!labReady) return;
  cameraTweenTick(app, dt);
  const time = performance.now() * 0.001;
  updateParticles(dt, time);
  if (stT.group.visible) uT();
  if (stMelt.group.visible) uMelt(dt);
  if (stBoil.group.visible) uBoil(dt);
  if (stEvap.group.visible) uEvap(dt);
  if (stSub.group.visible) uSub(dt);
  if (stCp.group.visible) uCp(dt);
  if (stCnd.group.visible) uCond(dt);
  if (stCnv.group.visible) uConv();
  if (stRadS.group.visible) uRad(dt);
  if (stSty.group.visible) uStory(dt);
  if (cv2.style.display !== 'none') draw2d();
  WINS.forEach((w) => { if (w.el.style.display !== 'none') drawChart(w); });
});

/* ---------------- 章节定义 ---------------- */

const ctl = createControlsPanel(document.getElementById('controls'));
let activeSectionCleanup = null;

const SECTIONS = [
  {
    title: '温度计的使用',
    html: `<p>实验室温度计的使用规则：<span class="hl">玻璃泡完全浸入被测液体，不碰容器底、不碰容器壁</span>；待示数稳定后再读数；读数时玻璃泡继续留在液体中，<span class="hl">视线与液柱上表面相平</span>（口诀：<b>俯大仰小</b>）。</p>
<p>试试左侧三种摆放与三种视线：错误摆放会让示数偏高，俯视 / 仰视会带来读数偏差，切到对应视角体会一下。</p>`,
    enter() {
      hideAll();
      stT.group.visible = true;
      stT.T = 25; stT.place = 'ok'; stT.view = 'level';
      stT.th.position.set(-1.7, PLACE_OK.y, 0.02);
      app.setCamera([-1.32, 1.2, 1.25], [-1.7, 1.04, 0]);
      showHUD('t');
      ctl.clear();
      ctl.slider({ label: '水温', min: 20, max: 100, step: 1, value: 25, fmt: (v) => v + ' ℃', onInput: (v) => { stT.T = v; } });
      ctl.seg({
        options: [{ label: '正确悬挂', value: 'ok' }, { label: '碰容器底', value: 'bottom' }, { label: '碰容器壁', value: 'wall' }],
        value: 'ok',
        onChange: (v) => {
          stT.place = v;
          stT.th.position.set(-1.7 + (v === 'wall' ? 0.041 : 0), v === 'bottom' ? BENCH_Y + 0.03 : PLACE_OK.y, 0.02);
          toast(PLACE_ERR[v], v === 'ok' ? 'ok' : 'warn');
        },
      });
      ctl.seg({
        options: [{ label: '平视 ✓', value: 'level' }, { label: '俯视', value: 'down' }, { label: '仰视', value: 'up' }],
        value: 'level',
        onChange: (v) => {
          stT.view = v;
          if (v === 'down') app.setCamera([-1.42, 1.66, 0.72], [-1.7, 1.06, 0.02]);
          else if (v === 'up') app.setCamera([-1.38, 0.74, 0.95], [-1.7, 1.02, 0.02]);
          else app.setCamera([-1.32, 1.2, 1.25], [-1.7, 1.04, 0]);
          toast(VIEW_ERR[v], v === 'level' ? 'ok' : 'warn');
        },
      });
      ctl.button({ label: '↺ 重置', onClick: () => SECTIONS[0].enter() });
      setHint('玻璃泡全浸没 · 不碰底不碰壁 · 稳定再读 · 视线相平');
    },
  },
  {
    title: '摄氏温度',
    html: `<p>摄氏温度的规定：<span class="hl">标准大气压下，冰水混合物 0℃，沸水 100℃</span>；把 0℃ 和 100℃ 之间分成 <b>100 等份</b>，每一等份就是 1℃。</p>
<p>拖动画布平移、滚轮缩放，移动游标看不同温度对应的刻度；打开换算可同时读出华氏温度（℉ = ℃×9/5+32）与热力学温度（K = ℃+273.15）。</p>`,
    enter() {
      hideAll();
      app.setCamera([0.6, 1.5, 3.0], [0, 1.02, 0]);
      cv2.style.display = 'block';
      ctl.clear();
      ctl.slider({ label: '游标温度', min: -20, max: 120, step: 1, value: c2.T, fmt: (v) => v + ' ℃', onInput: (v) => { c2.T = v; } });
      ctl.toggle({ label: '华氏 / 开氏换算', value: c2.conv, onChange: (v) => { c2.conv = v; } });
      ctl.toggle({ label: '标定与等分标注', value: c2.ann, onChange: (v) => { c2.ann = v; } });
      ctl.button({ label: '重置视图', onClick: () => { c2.zoom = 1; c2.panX = 0; c2.panY = 0; } });
    },
  },
  {
    title: '熔化和凝固',
    html: `<p>水浴法加热两支试管：<span class="hl">海波是晶体，熔点 48℃</span>——熔化时持续吸热但<b>温度保持不变</b>，曲线上出现一段平台；<span class="hl">石蜡是非晶体</span>——吸热过程中温度<b>持续上升</b>，没有固定熔点。</p>
<p>点「加热」开始记录曲线，对比两种物质的曲线形状；调节功率看平台长短变化。</p>`,
    enter() {
      hideAll();
      stMelt.group.visible = true;
      Object.assign(stMelt, { Tb: 20, Ts: 20, Tw: 20, melt: 0, power: 1, playing: false, t: 0, rec: 0, sel: 's' });
      winMelt.cfg.series.forEach((s) => { s.pts.length = 0; });
      app.setCamera([-0.62, 1.34, 1.42], [-1.05, 1.02, 0]);
      showHUD('melt');
      winMelt.show(true);
      ctl.clear();
      ctl.seg({ options: [{ label: '看海波', value: 's' }, { label: '看石蜡', value: 'w' }], value: 's', onChange: (v) => { stMelt.sel = v; } });
      ctl.slider({ label: '加热功率', min: 0.5, max: 2, step: 0.1, value: 1, fmt: (v) => v.toFixed(1) + '×', onInput: (v) => { stMelt.power = v; } });
      const run = ctl.button({ label: '▶ 加热', onClick: () => { stMelt.playing = !stMelt.playing; run.textContent = stMelt.playing ? '⏸ 暂停' : '▶ 加热'; run.classList.toggle('active', stMelt.playing); } });
      ctl.button({ label: '清曲线', onClick: () => { winMelt.cfg.series.forEach((s) => { s.pts.length = 0; }); stMelt.t = 0; stMelt.rec = 0; } });
      ctl.button({ label: '↺ 重置', onClick: () => SECTIONS[2].enter() });
      setHint('晶体：熔化吸热温度不变 · 非晶体：连续升温');
    },
  },
  {
    title: '水的沸腾',
    html: `<p>水沸腾时<span class="hl">持续吸热但温度保持在沸点不变</span>。沸腾前气泡上升过程中逐渐变小；沸腾时底部大量生成气泡、上升迅速变大，到液面破裂。</p>
<p>沸点与<span class="hl">气压</span>有关：气压越高沸点越高（高压锅原理），气压越低沸点越低（高山上煮不熟饭）。拖动气压滑杆，看沸点平台怎么移动。</p>`,
    enter() {
      hideAll();
      stBoil.group.visible = true;
      Object.assign(stBoil, { P: 1, Tb: 100, T: 20, power: 1, playing: false, t: 0, rec: 0 });
      winBoil.cfg.series[0].pts.length = 0;
      app.setCamera([-0.08, 1.32, 1.5], [-0.45, 1.0, 0]);
      showHUD('boil');
      winBoil.show(true);
      ctl.clear();
      ctl.slider({ label: '气压', min: 0.5, max: 2, step: 0.05, value: 1, fmt: (v) => v.toFixed(2) + ' atm', onInput: (v) => { stBoil.P = v; } });
      ctl.slider({ label: '加热功率', min: 0.5, max: 2, step: 0.1, value: 1, fmt: (v) => v.toFixed(1) + '×', onInput: (v) => { stBoil.power = v; } });
      const run = ctl.button({ label: '▶ 加热', onClick: () => { stBoil.playing = !stBoil.playing; run.textContent = stBoil.playing ? '⏸ 暂停' : '▶ 加热'; run.classList.toggle('active', stBoil.playing); } });
      ctl.button({ label: '↺ 重置', onClick: () => SECTIONS[3].enter() });
      setHint('沸腾前气泡上升变小 · 沸腾时气泡上升变大');
    },
  },
  {
    title: '蒸发和液化',
    html: `<p>蒸发是只在<span class="hl">液体表面</span>进行的缓慢汽化，<b>任何温度下</b>都能发生，<span class="hl">蒸发吸热有致冷作用</span>——湿泡温度计的棉团蘸了酒精，示数会低于室温；开风扇加快空气流动，蒸发更快、降温更明显。</p>
<p>「白气」不是水蒸气！水蒸气是无色透明看不见的，看得见的白气是水蒸气<b>遇冷液化</b>成的小水滴。点「白气演示」看杯口的水蒸气遇到冷金属板液化。</p>`,
    enter() {
      hideAll();
      stEvap.group.visible = true;
      Object.assign(stEvap, { fan: false, fspeed: 0, amb: 25, alcohol: 1, Tw: 25, mistT: 0 });
      app.setCamera([0.58, 1.32, 1.5], [0.2, 1.06, 0]);
      showHUD('evap');
      ctl.clear();
      ctl.toggle({ label: '风扇', value: false, onChange: (v) => { stEvap.fan = v; toast(v ? '空气流动加快，蒸发加快，湿泡降温更明显。' : '风扇停。', v ? 'ok' : ''); } });
      ctl.slider({ label: '环境温度', min: 10, max: 35, step: 1, value: 25, fmt: (v) => v + ' ℃', onInput: (v) => { stEvap.amb = v; } });
      ctl.slider({ label: '酒精量', min: 0, max: 2, step: 0.25, value: 1, fmt: (v) => v.toFixed(2) + '×', onInput: (v) => { stEvap.alcohol = v; } });
      ctl.button({ label: '💨 白气演示', onClick: () => { stEvap.mistT = 2.5; toast('白气 = 水蒸气遇冷液化成的小水滴（液化放热），不是水蒸气本身！', 'ok'); } });
      ctl.button({ label: '↺ 重置', onClick: () => SECTIONS[4].enter() });
      setHint('湿泡示数低于室温 = 蒸发吸热致冷');
    },
  },
  {
    title: '升华和凝华',
    html: `<p>固态碘受热<span class="hl">直接变成紫色碘蒸气</span>——这是<b>升华</b>（升华吸热）；碘蒸气上升遇到冷的管壁<span class="hl">直接变回固态晶体</span>——这是<b>凝华</b>（凝华放热）。</p>
<p>实验为什么用<b>热水浴</b>？碘的熔点约 <b>113.7℃</b>，热水最高不到 100℃——碘达不到熔点、不可能熔化，看到的紫色气体只能是固态碘<b>直接</b>升华来的。若直接加热超过熔点，碘会先熔化成液体再汽化，就说明不了「直接」变了。</p>
<p>生活实例：霜、雾凇、冰花是水蒸气凝华；衣柜里的樟脑丸变小、冬天冰冻的衣服变干是升华。</p>
<p>打开加热看紫色蒸气升腾；把冷端温度调得越低，凝华晶体出现得越快。点「视角拉近」凑近观察。</p>`,
    enter() {
      hideAll();
      stSub.group.visible = true;
      Object.assign(stSub, { on: false, Tb6: 25, cold: 5, speckAcc: 0, vapAcc: 0 });
      stSub.specks.forEach((sp) => { sp.visible = false; });
      app.setCamera([1.18, 1.32, 1.4], [0.85, 1.04, 0]);
      showHUD('sub');
      ctl.clear();
      ctl.toggle({ label: '加热', value: false, onChange: (v) => { stSub.on = v; if (v) toast('固态碘受热升华为紫色碘蒸气——升华吸热；蒸气在冷端凝华成晶体——凝华放热。', 'ok'); } });
      ctl.slider({ label: '冷端温度', min: -30, max: 25, step: 1, value: 5, fmt: (v) => v + ' ℃', onInput: (v) => { stSub.cold = v; } });
      ctl.button({ label: '🔍 视角拉近', onClick: () => app.setCamera([1.02, 1.12, 0.72], [0.87, 1.03, 0]) });
      ctl.button({ label: '↺ 重置', onClick: () => SECTIONS[5].enter() });
      setHint('升华：固→气（吸热）· 凝华：气→固（放热）');
    },
  },
  {
    title: '比较不同物质的吸热能力',
    html: `<p>两个相同的加热器加热<b>等质量</b>的水和食用油：相同吸热时间内，<span class="hl">油的升温约是水的 2 倍</span>——因为水的比热容更大（c<sub>水</sub> = 4.2×10³ J/(kg·℃)，c<sub>油</sub> ≈ 2.1×10³ J/(kg·℃)）。</p>
<p>吸热公式：<span class="hl">Q = cmΔt</span>。质量越大、升温越慢；调大质量再试一次。水到 100℃ 会沸腾，温度停在沸点不再上升。</p>`,
    enter() {
      hideAll();
      stCp.group.visible = true;
      Object.assign(stCp, { m: 0.2, Tw: 20, To: 20, playing: false, t: 0, rec: 0, sel: 'both' });
      stCp.grpW.visible = stCp.grpO.visible = stCp.l1.visible = stCp.l2.visible = true;
      winCp.cfg.series.forEach((s) => { s.pts.length = 0; });
      app.setCamera([1.88, 1.35, 1.62], [1.6, 0.99, 0]);
      showHUD('cp');
      winCp.show(true);
      ctl.clear();
      ctl.seg({
        options: [{ label: '水', value: 'w' }, { label: '油', value: 'o' }, { label: '双对比', value: 'both' }],
        value: 'both',
        onChange: (v) => {
          stCp.sel = v;
          stCp.grpW.visible = stCp.l1.visible = v !== 'o';
          stCp.grpO.visible = stCp.l2.visible = v !== 'w';
          winCp.cfg.series[0].dim = v === 'o';
          winCp.cfg.series[1].dim = v === 'w';
        },
      });
      ctl.slider({ label: '质量', min: 0.1, max: 0.4, step: 0.05, value: 0.2, fmt: (v) => v.toFixed(2) + ' kg', onInput: (v) => { stCp.m = v; } });
      const run = ctl.button({ label: '▶ 加热', onClick: () => { stCp.playing = !stCp.playing; run.textContent = stCp.playing ? '⏸ 暂停' : '▶ 加热'; run.classList.toggle('active', stCp.playing); } });
      ctl.button({ label: '↺ 重置', onClick: () => SECTIONS[6].enter() });
      setHint('等质量、相同加热 → 比热容大的升温慢');
    },
  },
  {
    title: '热传导',
    html: `<p>热量沿着物体从高温部分传向低温部分，这是<span class="hl">热传导</span>。四根棒（铜、铝、铁、玻璃）左端同时加热，蜡粘着的火柴按<span class="hl">导热系数从大到小</span>依次掉落：<b>铜 401 &gt; 铝 237 &gt; 铁 80 &gt; 玻璃 ≈1</b>（单位 W/(m·K)）。</p>
<p>金属是热的<b>良导体</b>，玻璃是热的不良导体（所以玻璃杯柄不烫手）。打开「热成像」看温度沿棒怎么传。</p>`,
    enter() {
      hideAll();
      stCnd.group.visible = true;
      Object.assign(stCnd, { on: false, time: 0, thermal: false, dropped: 0 });
      stCnd.matches.forEach((m) => {
        m.fall = false; m.vy = 0; m.rot = 0;
        m.g.rotation.z = 0;
        m.g.position.set(MATCH_X[m.si === 3 ? 0 : m.si === 4 ? 1 : 2], ROD_Y[m.ri] - 0.008, 0.01);
      });
      app.setCamera([0.35, 1.24, 1.78], [0, 1.05, 0]);
      showHUD('cond');
      ctl.clear();
      ctl.toggle({ label: '加热', value: false, onChange: (v) => { stCnd.on = v; if (v) stCnd.time = 0; toast(v ? '火柴将按 铜 → 铝 → 铁 顺序掉落，玻璃几乎不导热。' : '停止加热。', v ? 'ok' : ''); } });
      ctl.toggle({ label: '热成像', value: false, onChange: (v) => { stCnd.thermal = v; } });
      ctl.seg({
        options: [{ label: '全部', value: 'all' }, { label: '铜', value: '0' }, { label: '铝', value: '1' }, { label: '铁', value: '2' }, { label: '玻璃', value: '3' }],
        value: 'all',
        onChange: (v) => {
          if (v === 'all') app.setCamera([0.35, 1.24, 1.78], [0, 1.05, 0]);
          else {
            const ri = parseInt(v, 10);
            app.setCamera([-0.15, ROD_Y[ri] + 0.06, 1.3], [-0.08, ROD_Y[ri], 0]);
          }
        },
      });
      ctl.readout({ label: '导热系数 W/(m·K)', value: '铜 401 · 铝 237 · 铁 80 · 玻璃 ≈1' });
      ctl.button({ label: '↺ 重置', onClick: () => SECTIONS[7].enter() });
      setHint('金属是热的良导体 · 火柴按导热系数依次掉落');
    },
  },
  {
    title: '热对流',
    html: `<p>液体和气体主要靠<span class="hl">热对流</span>传热：受热部分体积膨胀、密度变小而<b>上升</b>，冷的部分下沉补充，形成循环流动。紫色的高锰酸钾就是示踪剂，跟着水流画出对流环。</p>
<p>切换「加热位置」看对流方向怎么变（底部加热 vs 侧面加热）；打开「流线」看流动路径。</p>`,
    enter() {
      hideAll();
      stCnv.group.visible = true;
      Object.assign(stCnv, { mode: 'bottom', power: 1, density: 0.6, lines: false, acc: 0 });
      app.setCamera([0.42, 1.32, 1.48], [0.05, 1.0, 0]);
      showHUD('conv');
      ctl.clear();
      ctl.seg({
        options: [{ label: '底部加热', value: 'bottom' }, { label: '侧面加热', value: 'side' }],
        value: 'bottom',
        onChange: (v) => { stCnv.mode = v; },
      });
      ctl.slider({ label: '加热功率', min: 0.2, max: 2, step: 0.1, value: 1, fmt: (v) => v.toFixed(1) + '×', onInput: (v) => { stCnv.power = v; } });
      ctl.toggle({ label: '显示流线', value: false, onChange: (v) => { stCnv.lines = v; } });
      ctl.slider({ label: '粒子密度', min: 0.2, max: 1, step: 0.1, value: 0.6, fmt: (v) => v.toFixed(1), onInput: (v) => { stCnv.density = v; } });
      ctl.button({ label: '↺ 重置', onClick: () => SECTIONS[8].enter() });
      setHint('受热膨胀密度变小 → 上升 · 冷的下沉 → 对流环');
    },
  },
  {
    title: '热辐射',
    html: `<p>红外灯不用接触、也不靠空气，直接把热<span class="hl">以电磁波的形式</span>传给罐子——这就是<b>热辐射</b>，真空里也能传（太阳的热就是这样到达地球的）。</p>
<p>黑色表面<span class="hl">吸收辐射的本领强</span>，白色表面反射强——所以黑罐升温明显比白罐快；关灯之后，<b>善于吸收的物体也善于辐射</b>，黑罐降温也更快。夏天穿浅色衣服更凉快就是这个道理。打开曲线窗记录两罐温差。</p>
<p><b>保温瓶</b>把三种传热方式一起挡住：夹层抽成<b>真空</b>阻断传导和对流，瓶口<b>瓶塞</b>减少对流与蒸发，玻璃壁<b>镀银</b>把热辐射反射回去。</p>`,
    enter() {
      hideAll();
      stRadS.group.visible = true;
      Object.assign(stRadS, { on: false, power: 1, Tb: 25, Tw: 25, t: 0, rec: 0 });
      winRad.cfg.series.forEach((s) => { s.pts.length = 0; });
      app.setCamera([-0.42, 1.3, 1.5], [-0.28, 1.0, 0]);
      showHUD('rad');
      winRad.show(true);
      ctl.clear();
      ctl.toggle({ label: '红外灯', value: false, onChange: (v) => { stRadS.on = v; if (v) stRadS.t = 0; } });
      ctl.slider({ label: '灯功率', min: 0.5, max: 2, step: 0.1, value: 1, fmt: (v) => v.toFixed(1) + '×', onInput: (v) => { stRadS.power = v; } });
      ctl.toggle({ label: '温度曲线窗', value: true, onChange: (v) => { winRad.show(v); } });
      ctl.button({ label: '↺ 重置', onClick: () => SECTIONS[9].enter() });
      setHint('辐射不需介质 · 黑吸白反');
    },
  },
  {
    title: '从冰到沸腾',
    html: `<p>综合剧情：一块 <b>-20℃ 的冰</b> → 升温到 <b>0℃ 熔化平台</b>（吸热温度不变）→ 水升温 → <b>100℃ 沸腾平台</b>（吸热温度不变）。3D 画面里冰块融化成水、水面上升、最后气泡翻滚。</p>
<p>完整曲线上的<b>两个平台</b>就是晶体熔化与液体沸腾的特征——两段都在吸热，热量用来改变物态而不是升温。比较平台的长短：汽化 1 kg 水约需 <b>2.26×10⁶ J</b>，熔化 1 kg 冰约需 <b>3.34×10⁵ J</b>——汽化热将近是熔化热的 <b>7 倍</b>，所以沸腾平台比熔化平台长得多。</p>
<p>可以随时跳转到任意阶段，或调速度观察。</p>`,
    enter() {
      hideAll();
      stSty.group.visible = true;
      Object.assign(stSty, { playing: true, speed: 1, t: 0, T: -20, ann: true, rec: 0 });
      winStory.cfg.series[0].pts.length = 0;
      app.setCamera([0.45, 1.36, 1.62], [0.05, 1.0, 0]);
      showHUD('story');
      winStory.show(true);
      ctl.clear();
      const playBtn = ctl.button({ label: '⏸ 暂停', onClick: () => { stSty.playing = !stSty.playing; playBtn.textContent = stSty.playing ? '⏸ 暂停' : '▶ 播放'; playBtn.classList.toggle('active', !stSty.playing); } });
      ctl.slider({ label: '速度', min: 0.5, max: 4, step: 0.5, value: 1, fmt: (v) => v.toFixed(1) + '×', onInput: (v) => { stSty.speed = v; } });
      const jumps = [['冰', 0], ['熔化', TL.p2[0]], ['水', TL.p3[0]], ['沸腾', TL.p4[0]]];
      jumps.forEach(([n, tt]) => {
        ctl.button({
          label: n,
          onClick: () => {
            stSty.t = tt; stSty.rec = 0;
            winStory.cfg.series[0].pts.length = 0;
          },
        });
      });
      ctl.toggle({ label: '平台标注', value: true, onChange: (v) => { winStory.cfg.ann = v; } });
      ctl.button({ label: '↺ 重置', onClick: () => SECTIONS[10].enter() });
      setHint('两个平台：熔化吸热温度不变 · 沸腾吸热温度不变');
    },
  },
  {
    title: '随堂检测',
    html: `<p>5 道选择题，覆盖本节课：温度计使用、晶体熔化、蒸发致冷、沸点与气压、热传递三方式。</p>`,
    enter() {
      hideAll();
      app.setCamera([0.7, 1.5, 2.9], [0.1, 1.0, 0]);
      ctl.clear();
      showQuiz();
    },
  },
];

/* ---------------- 随堂检测 ---------------- */

const QUIZ = [
  {
    q: '用温度计测烧杯中热水的温度，下列做法正确的是？',
    opts: [
      '玻璃泡碰到杯底，读数更准',
      '把温度计拿出来再读数',
      '玻璃泡完全浸没、不碰底不碰壁，示数稳定后视线与液柱上表面相平读数',
      '俯视读数可以消除误差',
    ],
    a: 2,
    ex: '玻璃泡要全部浸入被测液体、不碰容器底和容器壁；示数稳定后再读，且不能离开液体；视线要与液柱上表面相平——俯视读数偏大、仰视读数偏小（口诀：俯大仰小）。',
  },
  {
    q: '海波（晶体）熔化过程中，正确的说法是？',
    opts: [
      '持续吸热，温度不断上升',
      '持续吸热，温度保持在熔点 48℃ 不变',
      '放出热量，温度不变',
      '不需要吸热，温度不变',
    ],
    a: 1,
    ex: '晶体熔化的特点：持续吸热、温度保持在熔点不变（海波熔点约 48℃）。石蜡等非晶体没有固定熔点，熔化时温度持续上升。',
  },
  {
    q: '温度计的玻璃泡包上蘸了酒精的棉团后，示数会怎样变化？',
    opts: [
      '一直升高到超过室温',
      '先降到低于室温，酒精蒸干后回升到室温',
      '保持不变',
      '迅速升到 100℃',
    ],
    a: 1,
    ex: '酒精蒸发吸热，有致冷作用，所以湿泡示数先降到低于室温；酒精蒸干后停止蒸发，示数回升到室温。开风扇加快空气流动，蒸发更快，降温更明显。',
  },
  {
    q: '在高山上用普通锅煮饭不容易熟，主要原因是？',
    opts: [
      '高山上的火力不够大',
      '气压低，水的沸点低于 100℃',
      '水的比热容变大了',
      '米饭的熔点升高了',
    ],
    a: 1,
    ex: '液体的沸点随气压降低而降低（随气压升高而升高，高压锅就是利用这个原理）。高山上气压低，水不到 100℃ 就沸腾，沸腾后温度保持在较低的沸点不再上升，饭不容易熟。',
  },
  {
    q: '冬天摸铁栏杆觉得比木栏杆凉；晒太阳身体变暖；烧水时水上下翻滚——三个场景依次属于哪种传热方式？',
    opts: [
      '热传导、热辐射、热对流',
      '热对流、热传导、热辐射',
      '热辐射、热传导、热对流',
      '热传导、热对流、热辐射',
    ],
    a: 0,
    ex: '铁是热的良导体，传导带走手上的热快（传导）；太阳的热穿过真空以电磁波形式传来（辐射，黑罐比白罐吸得多也是这个道理）；烧水时受热的水膨胀密度变小上升、冷水下沉（对流）。',
  },
];

function showQuiz() {
  let idx = 0;
  let score = 0;
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
      <h3></h3>
      <div class="q-opts"></div>
      <div class="q-explain"></div>
      <div class="q-foot"><span class="q-score">得分：${score}</span></div>`;
    card.querySelector('h3').textContent = item.q;
    const optsBox = card.querySelector('.q-opts');
    item.opts.forEach((opt, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'quiz-opt';
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
        card.querySelector('.q-score').textContent = '得分：' + score;
        const foot = card.querySelector('.q-foot');
        const next = document.createElement('button');
        next.type = 'button';
        next.className = 'ctl-btn active';
        next.textContent = idx < QUIZ.length - 1 ? '下一题 →' : '查看成绩 →';
        next.addEventListener('click', () => {
          idx++;
          if (idx < QUIZ.length) renderQ();
          else renderResult();
        });
        foot.appendChild(next);
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
      <p style="color:var(--text-dim);margin:4px 0 18px">正确率 ${pct}%${pct >= 80 ? '，热与物态变化你已经掌握了！' : pct >= 60 ? '，大部分概念已经清楚，回顾一下错题。' : '，建议回到前面章节再看一遍哦。'}</p>`;
    const again = document.createElement('button');
    again.type = 'button';
    again.className = 'ctl-btn active';
    again.textContent = '重新测验';
    again.addEventListener('click', () => { idx = 0; score = 0; renderQ(); });
    const back = document.createElement('button');
    back.type = 'button';
    back.className = 'ctl-btn';
    back.textContent = '返回第一章节';
    back.addEventListener('click', () => { panel.remove(); window.__eduSections.select(0); });
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

const DOMDIR = '../assets/textures/pbr/';
loadAll([
  { key: 'sky', label: '环境', job: loadHDR(TEX.skyHdr) },
  { key: 'skyBg', label: '背景', job: loadTexture(TEX.skyWebp) },
  { key: 'plankDiff', label: '台面', job: loadTexture(DOMDIR + 'plank_diff-DPUnSb0W.webp') },
  { key: 'plankArm', label: '台面细节', job: loadTexture(DOMDIR + 'plank_arm-CztMy41m.webp', { colorSpace: null }) },
  { key: 'plankNor', label: '台面纹理', job: loadTexture(DOMDIR + 'plank_nor-BoGKkjWD.webp', { colorSpace: null }) },
  { key: 'paintDiff', label: '柜体', job: loadTexture(DOMDIR + 'paint_diff-RYyGtI7R.webp') },
  { key: 'paintArm', label: '柜体细节', job: loadTexture(DOMDIR + 'paint_arm-BtvMA06a.webp', { colorSpace: null }) },
  { key: 'paintNor', label: '柜体纹理', job: loadTexture(DOMDIR + 'paint_nor-DgERPfRh.webp', { colorSpace: null }) },
  { key: 'slabDiff', label: '地面', job: loadTexture(DOMDIR + 'slab_diff-Bzxi6irn.webp') },
  { key: 'slabArm', label: '地面细节', job: loadTexture(DOMDIR + 'slab_arm-OyJUI_RU.webp', { colorSpace: null }) },
  { key: 'slabNor', label: '地面纹理', job: loadTexture(DOMDIR + 'slab_nor-D2MZT0BN.webp', { colorSpace: null }) },
  { key: 'wallDiff', label: '墙面', job: loadTexture(DOMDIR + 'wall_diff-CNpUUuOJ.webp') },
  { key: 'wallNor', label: '墙面纹理', job: loadTexture(DOMDIR + 'wall_nor-DS8uKrFH.webp', { colorSpace: null }) },
], (d, t, label) => loader.setText(`正在加载 ${d}/${t}（${label}）`)).then((t) => {
  Object.assign(pbr, {
    plankDiff: t.plankDiff, plankArm: t.plankArm, plankNor: t.plankNor,
    paintDiff: t.paintDiff, paintArm: t.paintArm, paintNor: t.paintNor,
    slabDiff: t.slabDiff, slabArm: t.slabArm, slabNor: t.slabNor,
    wallDiff: t.wallDiff, wallNor: t.wallNor,
  });
  t.sky.mapping = THREE.EquirectangularReflectionMapping;
  scene.environment = t.sky;
  t.skyBg.mapping = THREE.EquirectangularReflectionMapping;
  scene.background = t.skyBg;

  buildWorld();
  buildStT();
  buildStMelt();
  buildStBoil();
  buildStEvap();
  buildStSub();
  buildStCp();
  buildStCond();
  buildStConv();
  buildStRad();
  buildStStory();
  labReady = true;

  loader.hide();
  const sections = createSections({
    nav: document.getElementById('sideNav'),
    descPanel: document.getElementById('descPanel'),
    sections: SECTIONS,
    onSelect(i, sec) {
      if (activeSectionCleanup) { activeSectionCleanup(); activeSectionCleanup = null; }
      sec.enter();
    },
  });
  window.__eduSections = sections;
  sections.select(0);
}).catch((err) => {
  loader.setText('资源加载失败：' + err.message);
  console.error(err);
});
