/* EduLab · 振动与波（waves）
 * 章节：弹簧振子 / 单摆 / 简谐运动的能量 / 受迫振动与共振 / 机械波的形成 / 波的反射 /
 *       波的叠加与驻波 / 水波的干涉与衍射 / 多普勒效应 / 声音的特性与共鸣 / 自由实验 / 随堂检测
 * 实现：3D 程序化建模 + 角落 2D 曲线窗（纸带/能量柱/共振曲线/示波器）+ 全屏 2D 水波槽。
 * 物理：T=2π√(m/k)、T=2π√(L/g)、共振 f驱=f固、驻波 L=nλ/2、多普勒 f′=fv/(v∓vs)、
 *       固定端反射翻转（半波损失）；波形时间轴一律累加相位（改参数不跳变）。
 */
import {
  THREE, clamp, TAU,
  loadTexture, loadHDR, loadAll, createApp, cameraTweenTick, makeLoader,
  createSections, createControlsPanel, makeHUD, makeTextSprite,
} from './edu-core.js';

/* ---------------- 本实验专属样式 ---------------- */

const style = document.createElement('style');
style.textContent = `
.waves-toast {
  position: absolute; top: 14px; left: 50%; transform: translate(-50%, -8px);
  z-index: 26; max-width: min(430px, calc(100% - 28px));
  padding: 9px 16px; border-radius: 12px; font-size: 13.5px; line-height: 1.55;
  background: color-mix(in srgb, var(--card) 92%, transparent);
  border: 1px solid var(--card-border); box-shadow: var(--shadow);
  color: var(--text); opacity: 0; pointer-events: none;
  transition: opacity .25s, transform .25s;
}
.waves-toast.show { opacity: 1; transform: translate(-50%, 0); }
.waves-toast.ok { border-color: color-mix(in srgb, #3fa96f 55%, transparent); }
.waves-toast.warn { border-color: color-mix(in srgb, #d9534f 60%, transparent); color: #c96b62; }
/* 修正共享 lab.css 的 .lab-stage canvas { position:absolute; inset:0 } 对小窗画布的误伤 */
.coastal-window canvas { position: static; inset: auto; }
.waves-tank {
  position: absolute; inset: 0; z-index: 5;
  width: 100%; height: 100%;
  cursor: grab; touch-action: none;
}
.waves-tank:active { cursor: grabbing; }
`;
document.head.appendChild(style);

/* ---------------- 纹理 ---------------- */

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
const DOMDIR = '../assets/textures/pbr/';

/* ---------------- 场景脚手架 ---------------- */

const stage = document.getElementById('stage');
const loader = makeLoader(stage, '正在搭建波动实验台…');

const app = createApp({
  container: stage,
  fov: 42, near: 0.05, far: 60,
  cameraPos: [0.7, 1.6, 2.6],
  target: [0, 1.05, 0],
  minDistance: 0.5, maxDistance: 12,
  exposure: 1.0,
  keepBackground: true,
});
const { scene, camera, controls } = app;

scene.add(new THREE.AmbientLight(0xbcc6d4, 0.6));
const sunLight = new THREE.DirectionalLight(0xfff2e2, 1.6);
sunLight.position.set(3.5, 5, 3);
scene.add(sunLight);
const fillLight = new THREE.DirectionalLight(0xdfe8ff, 0.5);
fillLight.position.set(-4, 3, -2.5);
scene.add(fillLight);

/* ---------------- 材质与建模工具 ---------------- */

const BENCH_Y = 0.9;   // 台面高度
const TRACK_Y = 1.0;   // 气垫导轨滑块中心高度
const STR_Y = 1.02;    // 绳/弦基准高度

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
const metalMat = stdMat({ color: 0x8f979f, roughness: 0.4, metalness: 0.75 });
const darkMetal = stdMat({ color: 0x454b52, roughness: 0.45, metalness: 0.7 });
const accentMat = stdMat({ color: 0xe8674a, roughness: 0.55, metalness: 0.05 });
const lightMat = stdMat({ color: 0xe8eaf0, roughness: 0.6, metalness: 0.05 });

function box(w, h, d, mat) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); }
function cyl(rt, rb, h, mat, seg = 16) { return new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat); }

/** 沿 x 轴的螺旋线（弹簧），自定义 Curve */
function helixX(x0, x1, y, r, coils) {
  const c = new THREE.Curve();
  c.getPoint = (u) => new THREE.Vector3(
    x0 + (x1 - x0) * u,
    y + Math.cos(u * coils * TAU) * r,
    Math.sin(u * coils * TAU) * r
  );
  return c;
}
/** 沿 y 轴的螺旋线（竖直弹簧） */
function helixY(y0, y1, x, r, coils) {
  const c = new THREE.Curve();
  c.getPoint = (u) => new THREE.Vector3(
    x + Math.cos(u * coils * TAU) * r,
    y0 + (y1 - y0) * u,
    Math.sin(u * coils * TAU) * r
  );
  return c;
}
/** 每帧重建 TubeGeometry（记得 dispose 旧 geometry 防泄漏） */
function rebuildTube(mesh, curve, tub, rad, radius) {
  const old = mesh.geometry;
  mesh.geometry = new THREE.TubeGeometry(curve, tub, radius, rad, false);
  if (old) old.dispose();
}
/** 沿一排采样点的绳（CatmullRom） */
function stringCurve(pts) {
  return new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.4);
}

/* ---------------- 实验室环境 ---------------- */

const worldG = new THREE.Group();
scene.add(worldG);
const pbr = {};

function buildWorld() {
  pbr.slabDiff.wrapS = pbr.slabDiff.wrapT = THREE.RepeatWrapping;
  pbr.slabDiff.repeat.set(6, 5);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(16, 12), stdMat({
    color: 0xaeb4ba, roughness: 0.85, metalness: 0.05,
    map: pbr.slabDiff, roughnessMap: pbr.slabArm, normalMap: pbr.slabNor,
  }));
  floor.rotation.x = -Math.PI / 2;
  worldG.add(floor);

  pbr.wallDiff.wrapS = pbr.wallDiff.wrapT = THREE.RepeatWrapping;
  pbr.wallDiff.repeat.set(5, 1.6);
  pbr.wallNor.wrapS = pbr.wallNor.wrapT = THREE.RepeatWrapping;
  pbr.wallNor.repeat.set(5, 1.6);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(16, 5), stdMat({
    color: 0xd9dde2, roughness: 0.9, map: pbr.wallDiff, normalMap: pbr.wallNor,
  }));
  wall.position.set(0, 2.5, -2.4);
  worldG.add(wall);

  const benchBody = box(5.4, 0.85, 1.3, stdMat({
    color: 0xe4e7ea, roughness: 0.55, metalness: 0.08,
    map: pbr.paintDiff, roughnessMap: pbr.paintArm, normalMap: pbr.paintNor,
  }));
  benchBody.position.set(0, 0.425, -0.15);
  worldG.add(benchBody);

  pbr.plankDiff.wrapS = pbr.plankDiff.wrapT = THREE.RepeatWrapping;
  pbr.plankDiff.repeat.set(5, 1.2);
  pbr.plankArm.wrapS = pbr.plankArm.wrapT = THREE.RepeatWrapping;
  pbr.plankArm.repeat.set(5, 1.2);
  pbr.plankNor.wrapS = pbr.plankNor.wrapT = THREE.RepeatWrapping;
  pbr.plankNor.repeat.set(5, 1.2);
  const benchTop = box(5.4, 0.05, 1.4, stdMat({
    color: 0xcfa976, roughness: 0.6, metalness: 0.05,
    map: pbr.plankDiff, roughnessMap: pbr.plankArm, normalMap: pbr.plankNor,
  }));
  benchTop.position.set(0, 0.875, -0.15);
  worldG.add(benchTop);
}

/* ---------------- 2D 曲线窗（coastal-window） / 提示 / toast / HUD / 音频 ---------------- */

const cwBox = document.createElement('div');
cwBox.className = 'coastal-window';
cwBox.innerHTML = '<div class="cw-head"><b>曲线窗</b><span class="cw-info"></span></div>';
const cwCanvas = document.createElement('canvas');
cwCanvas.width = 560; cwCanvas.height = 280;
cwBox.appendChild(cwCanvas);
stage.appendChild(cwBox);
cwBox.style.display = 'none';
const cwc = cwCanvas.getContext('2d');
let cwDraw = null;
function showCW(title, info, drawFn) {
  cwBox.querySelector('.cw-head b').textContent = title;
  cwBox.querySelector('.cw-info').textContent = info || '';
  cwDraw = drawFn;
  cwBox.style.display = '';
}
function hideCW() { cwDraw = null; cwBox.style.display = 'none'; }

let toastTimer = null;
function toast(text, kind = '') {
  let el = stage.querySelector('.waves-toast');
  if (!el) {
    el = document.createElement('div');
    el.className = 'waves-toast';
    stage.appendChild(el);
  }
  el.textContent = text;
  el.className = 'waves-toast show' + (kind ? ' ' + kind : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3600);
}

let hintEl = null;
function setHint(text) {
  if (!text) { if (hintEl) hintEl.remove(); hintEl = null; return; }
  if (!hintEl) {
    hintEl = document.createElement('div');
    hintEl.className = 'legend';
    stage.appendChild(hintEl);
  }
  hintEl.innerHTML = '';
  const row = document.createElement('div');
  row.className = 'lg-row';
  row.textContent = text;
  hintEl.appendChild(row);
}

const hudWrap = document.createElement('div');
hudWrap.className = 'lab-hud';
stage.appendChild(hudWrap);
let hud = null;
function setHUD(rows) {
  if (hud) hud.el.remove();
  hud = rows && rows.length ? makeHUD(hudWrap, rows) : null;
}

/** WebAudio：必须在用户点击手势里创建；增益 ≤0.1；离开章节 stop/close */
function createTone() {
  const AC = window.AudioContext || window.webkitAudioContext;
  const ctx = new AC();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  gain.gain.value = 0.0001;
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  return {
    ctx, osc, gain,
    set(freq, vol) {
      if (freq > 20) osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setTargetAtTime(clamp(vol, 0.0001, 0.1), ctx.currentTime, 0.04);
    },
    stop() {
      try {
        gain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.03);
        setTimeout(() => { try { osc.stop(); ctx.close(); } catch (e) { /* noop */ } }, 280);
      } catch (e) { /* noop */ }
    },
  };
}

/* ================= 第一章/第三章 · 弹簧振子（共用台） ================= */

const springMat = stdMat({ color: 0xc7ced6, roughness: 0.35, metalness: 0.85 });

function makeRulerTexture() {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 26;
  const x = c.getContext('2d');
  x.fillStyle = '#f2f4f8';
  x.fillRect(0, 0, c.width, c.height);
  x.strokeStyle = '#3a4250';
  x.fillStyle = '#3a4250';
  x.lineWidth = 3;
  for (let i = 0; i <= 20; i++) { // 每 0.1 m 一刻度（全程 2 m）
    const px = 12 + i * ((c.width - 24) / 20);
    const h = i % 5 === 0 ? 16 : 9;
    x.beginPath();
    x.moveTo(px, 4); x.lineTo(px, 4 + h);
    x.stroke();
    if (i % 5 === 0 && i <= 20) {
      x.font = '600 13px sans-serif';
      x.textAlign = 'center';
      x.fillText(String(i / 10), px, 24);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const stSpring = {
  group: new THREE.Group(), playing: true,
  A: 0.18, m: 0.8, k: 24, gamma: 0, phase: 0, tEnv: 0,
  x: 0, v: 0, tape: [], tapeAcc: 0, eHist: [], eAcc: 0,
};
scene.add(stSpring.group);

let S = {};
function buildSpring() {
  const g = stSpring.group;
  const rail = box(2.3, 0.035, 0.09, metalMat);
  rail.position.set(0, 0.945, 0);
  const leg1 = box(0.05, 0.06, 0.09, darkMetal); leg1.position.set(-0.9, 0.912, 0);
  const leg2 = box(0.05, 0.06, 0.09, darkMetal); leg2.position.set(0.9, 0.912, 0);
  const glider = box(0.2, 0.07, 0.1, lightMat);
  glider.position.set(0, TRACK_Y, 0);
  const post = cyl(0.02, 0.024, 0.14, darkMetal); post.position.set(-1.06, 0.98, 0);
  const postCap = new THREE.Mesh(new THREE.SphereGeometry(0.024, 12, 10), darkMetal);
  postCap.position.set(-1.06, 1.06, 0);
  const spring = new THREE.Mesh(new THREE.BufferGeometry(), springMat);
  const ruler = box(2.0, 0.026, 0.002, new THREE.MeshBasicMaterial({ map: makeRulerTexture() }));
  ruler.position.set(0, 0.927, 0.047);
  g.add(rail, leg1, leg2, glider, post, postCap, spring, ruler);
  S = { glider, spring, x0: -1.03 };
}

/* ================= 第二章 · 单摆 ================= */

const stPen = {
  group: new THREE.Group(), L: 0.6, th0: 12 * Math.PI / 180, g: 9.8,
  th: 0, w: 0, t: 0, prevTh: 0, playing: true,
  meas: null, Tm: null, gm: null,
};
scene.add(stPen.group);
const PEN_PIVOT = new THREE.Vector3(0, 2.0, 0);
const UP = new THREE.Vector3(0, 1, 0);

let P = {};
function buildPendulum() {
  const g = stPen.group;
  const base = box(0.34, 0.03, 0.26, darkMetal); base.position.set(0, 0.915, -0.18);
  const rod = cyl(0.015, 0.015, 1.12, metalMat); rod.position.set(0, 1.46, -0.18);
  const arm = box(0.02, 0.02, 0.2, metalMat); arm.position.set(0, 2.0, -0.09);
  // 量角弧（±35°）与每 10° 刻度
  const arcPts = [];
  for (let a = -35; a <= 35; a += 2) {
    const r = a * Math.PI / 180;
    arcPts.push(new THREE.Vector3(Math.sin(r) * 0.32, PEN_PIVOT.y - Math.cos(r) * 0.32, 0));
  }
  const arcLine = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(arcPts),
    new THREE.LineBasicMaterial({ color: 0x8a94a4, transparent: true, opacity: 0.7 })
  );
  const tickPts = [];
  for (let a = -30; a <= 30; a += 10) {
    const r = a * Math.PI / 180;
    tickPts.push(new THREE.Vector3(Math.sin(r) * 0.30, PEN_PIVOT.y - Math.cos(r) * 0.30, 0));
    tickPts.push(new THREE.Vector3(Math.sin(r) * 0.35, PEN_PIVOT.y - Math.cos(r) * 0.35, 0));
  }
  const ticks = new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints(tickPts),
    new THREE.LineBasicMaterial({ color: 0x8a94a4, transparent: true, opacity: 0.9 })
  );
  g.add(base, rod, arm, arcLine, ticks);
  for (const a of [-30, -20, -10, 10, 20, 30]) {
    const r = a * Math.PI / 180;
    const lbl = makeTextSprite(Math.abs(a) + '°', { fontSize: 22, color: '#cfd6e2', scale: 0.0021 });
    lbl.position.set(Math.sin(r) * 0.43, PEN_PIVOT.y - Math.cos(r) * 0.43, 0);
    g.add(lbl);
  }
  const str = cyl(0.004, 0.004, 1, stdMat({ color: 0xd8dde6, roughness: 0.8 }));
  const bob = new THREE.Mesh(new THREE.SphereGeometry(0.048, 24, 18), stdMat({ color: 0xd9a441, roughness: 0.35, metalness: 0.55 }));
  g.add(str, bob);
  P = { str, bob };
}

function resetPendulum() {
  stPen.th = stPen.th0;
  stPen.w = 0;
  stPen.t = 0;
  stPen.prevTh = stPen.th;
  stPen.meas = null;
  stPen.Tm = null;
  stPen.gm = null;
}

/* ================= 第四章 · 受迫振动与共振 ================= */

const stRes = {
  group: new THREE.Group(), f0: 0.9, fd: 0.9, gam: 0.16, amp: 0.8,
  x: 0, v: 0, phiD: 0, sweeping: false, sweepT: 0, Aest: 0,
};
scene.add(stRes.group);

let R = {};
function buildResonance() {
  const g = stRes.group;
  const post1 = cyl(0.02, 0.024, 1.08, metalMat); post1.position.set(-0.45, 1.44, -0.06);
  const post2 = cyl(0.02, 0.024, 1.08, metalMat); post2.position.set(0.45, 1.44, -0.06);
  const bar = box(1.0, 0.05, 0.06, metalMat); bar.position.set(0, 1.955, -0.06);
  const disc = cyl(0.05, 0.05, 0.018, darkMetal);
  disc.rotation.x = Math.PI / 2;
  disc.position.set(0, 1.87, 0.02);
  const pin = cyl(0.008, 0.008, 0.03, accentMat);
  pin.rotation.x = Math.PI / 2;
  const hanger = cyl(0.006, 0.006, 0.05, darkMetal); hanger.position.set(0, 1.80, 0);
  const spring = new THREE.Mesh(new THREE.BufferGeometry(), springMat);
  const mass = new THREE.Mesh(new THREE.SphereGeometry(0.065, 24, 18), stdMat({ color: 0x5a7fa8, roughness: 0.4, metalness: 0.5 }));
  mass.position.set(0, 1.15, 0);
  g.add(post1, post2, bar, disc, pin, hanger, spring, mass);
  R = { disc, pin, spring, mass };
}

/* ================= 第五章 · 机械波的形成（质点列） ================= */

const ROW_N = 24;
const ROW_DX = 0.08;
const ROW_X0 = -0.92;
const ROW_V = 1.5; // 介质波速（固定，λ = v/f）

const stRow = {
  group: new THREE.Group(), f: 0.8, A: 0.08, phi: 0, slow: false, playing: true,
  balls: [], arrows: [], labels: [], line: null, markIdx: 12,
};
scene.add(stRow.group);

let W5 = {};
function buildRow() {
  const g = stRow.group;
  const base = box(2.1, 0.006, 0.02, darkMetal);
  base.position.set(0, STR_Y, 0);
  const ballGeo = new THREE.SphereGeometry(0.034, 16, 12);
  const ballMat = stdMat({ color: 0x9fb6cf, roughness: 0.5, metalness: 0.1 });
  const markMat = stdMat({ color: 0xe8674a, roughness: 0.5 });
  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(ROW_N * 3), 3));
  const line = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: 0x8fd3ff, transparent: true, opacity: 0.75 }));
  line.frustumCulled = false;
  g.add(base, line);
  for (let i = 0; i < ROW_N; i++) {
    const x = ROW_X0 + i * ROW_DX;
    const b = new THREE.Mesh(ballGeo, i === stRow.markIdx ? markMat : ballMat);
    b.position.set(x, STR_Y, 0);
    g.add(b);
    stRow.balls.push(b);
    const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.055, 10), accentMat);
    arrow.position.set(x, STR_Y + 0.14, 0);
    arrow.visible = false;
    g.add(arrow);
    stRow.arrows.push(arrow);
    const lbl = makeTextSprite(String(i), { fontSize: 24, color: '#ffd9a8', scale: 0.0021 });
    lbl.position.set(x, STR_Y + 0.22, 0);
    lbl.visible = false;
    g.add(lbl);
    stRow.labels.push(lbl);
  }
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.004, 8, 24), accentMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.set(ROW_X0 + stRow.markIdx * ROW_DX, STR_Y - 0.004, 0);
  g.add(ring);
  // 波源（左端小振动杆）
  const driver = box(0.03, 0.16, 0.03, darkMetal);
  driver.position.set(ROW_X0 - 0.12, STR_Y, 0);
  g.add(driver);
  W5 = { line, ring };
}

/* ================= 绳波数值引擎（第一章 第六章 / 第十一章 共用算法） ================= */

function makeStringEngine(N, L) {
  const dx = L / (N - 1);
  const y = new Float32Array(N);
  const v = new Float32Array(N);
  return {
    N, L, dx, y, v, c: 1.2, damp: 0.01,
    reset() { y.fill(0); v.fill(0); },
    /** 注入一个纯右行高斯脉冲：y += G，v += −c·G′（保证只向右传播） */
    emit(x0 = 0.3, w = 0.15, amp = 0.09) {
      for (let i = 0; i < N; i++) {
        const x = i * dx;
        const g = Math.exp(-((x - x0) * (x - x0)) / (w * w));
        const dg = -(2 * (x - x0) / (w * w)) * g;
        y[i] += amp * g;
        v[i] += -this.c * dg * amp;
      }
    },
    /** 显式波动方程步进（子步保证 CFL 稳定）；drive: [左端位移, 左端速度] 或 null（左端固定） */
    step(dt, rightMode, drive) {
      const c2 = this.c * this.c;
      const nSub = Math.max(1, Math.ceil((this.c * dt) / (0.4 * dx)));
      const h = dt / nSub;
      for (let s = 0; s < nSub; s++) {
        for (let i = 1; i < N - 1; i++) {
          v[i] += (c2 * h) * (y[i - 1] - 2 * y[i] + y[i + 1]) / (dx * dx) - this.damp * v[i] * h;
        }
        for (let i = 1; i < N - 1; i++) y[i] += v[i] * h;
        if (drive) { const d = drive(); y[0] = d[0]; v[0] = d[1]; }
        else { y[0] = 0; v[0] = 0; }
        if (rightMode === 'fixed') { y[N - 1] = 0; v[N - 1] = 0; }
        else { y[N - 1] = y[N - 2]; v[N - 1] = v[N - 2]; }
      }
    },
  };
}

/** 绳波台（两端立柱 + 右端固定板/自由环 + 绳） */
function buildStringStation(g) {
  const postL = cyl(0.014, 0.018, 0.16, darkMetal); postL.position.set(-1.0, 0.99, 0);
  const postR = cyl(0.014, 0.018, 0.16, darkMetal); postR.position.set(1.0, 0.99, 0);
  const plate = box(0.03, 0.2, 0.07, stdMat({ color: 0x39404a, roughness: 0.7 }));
  plate.position.set(1.04, 1.05, 0);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.006, 8, 20), accentMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.set(1.0, 1.07, 0);
  const string = new THREE.Mesh(new THREE.BufferGeometry(), stdMat({ color: 0xd6dee9, roughness: 0.5, metalness: 0.15 }));
  const pts = [];
  for (let i = 0; i < 90; i++) pts.push(new THREE.Vector3(-1 + (i * 2) / 89, STR_Y, 0));
  g.add(postL, postR, plate, ring, string);
  return { string, pts, plate, ring };
}

const stRef = {
  group: new THREE.Group(), eng: makeStringEngine(90, 2.0),
  end: 'fixed', cont: false, contAcc: 0, nPulse: 0,
};
scene.add(stRef.group);
const stFree = {
  group: new THREE.Group(), eng: makeStringEngine(90, 2.0),
  end: 'fixed', driveOn: false, f: 1.2, phi: 0, v: 1.2,
};
scene.add(stFree.group);

let ST6 = null;
let ST11 = null;

/* ================= 第七章 · 波的叠加与驻波 ================= */

const STA_L = 1.8;
const STA_M = 100;
const STA_V = 2.0;

const stSta = {
  group: new THREE.Group(), f: 1.667, phi: 0, A: 0.09,
  showComp: true, showNodes: true, playing: true,
};
scene.add(stSta.group);

let STA = {};
function buildStanding() {
  const g = stSta.group;
  const wallL = box(0.06, 0.24, 0.1, darkMetal); wallL.position.set(-0.95, STR_Y, 0);
  const wallR = box(0.06, 0.24, 0.1, darkMetal); wallR.position.set(0.95, STR_Y, 0);
  const string = new THREE.Mesh(new THREE.BufferGeometry(), stdMat({ color: 0xeadfae, roughness: 0.5, metalness: 0.1 }));
  const pts = [];
  for (let i = 0; i < STA_M; i++) pts.push(new THREE.Vector3(-STA_L / 2 + (i * STA_L) / (STA_M - 1), STR_Y, 0));
  // 两列分量（半透明 Line，位置属性每帧原地更新）
  function compLine(color) {
    const geo = new THREE.BufferGeometry();
    const attr = new THREE.BufferAttribute(new Float32Array(STA_M * 3), 3);
    attr.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('position', attr);
    const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.42 }));
    line.frustumCulled = false;
    return line;
  }
  const inc = compLine(0x7fd0ff);
  const ref = compLine(0xffb35c);
  const nodeRings = [];
  for (let i = 0; i < 6; i++) {
    const r = new THREE.Mesh(new THREE.TorusGeometry(0.034, 0.005, 8, 22), accentMat);
    r.rotation.x = Math.PI / 2;
    r.position.y = STR_Y;
    r.visible = false;
    g.add(r);
    nodeRings.push(r);
  }
  g.add(wallL, wallR, string, inc, ref);
  STA = { string, pts, inc, ref, nodeRings };
}

/* ================= 第八章 · 水波的干涉与衍射（全屏 2D 水波槽） ================= */

const RW = 240, RH = 160;
const LUTN = 2048, LUTK = LUTN / TAU;
const sinLUT = new Float32Array(LUTN);
for (let i = 0; i < LUTN; i++) sinLUT[i] = Math.sin(i / LUTK);
const colLUT = new Uint8Array(511 * 3 + 3);
for (let i = 0; i <= 510; i++) {
  const t = (i - 255) / 255;
  colLUT[i * 3] = 14 + (t + 1) * 60;
  colLUT[i * 3 + 1] = 46 + (t + 1) * 85;
  colLUT[i * 3 + 2] = 100 + (t + 1) * 75;
}

const tankCanvas = document.createElement('canvas');
tankCanvas.className = 'waves-tank';
stage.appendChild(tankCanvas);
tankCanvas.style.display = 'none';
const tctx = tankCanvas.getContext('2d');
const off = document.createElement('canvas');
off.width = RW; off.height = RH;
const octx = off.getContext('2d');
const img = octx.createImageData(RW, RH);

const tank = {
  mode: 'double', lambda: 0.2, sep: 0.5, slitW: 0.16, v: 0.6,
  phi: 0, paused: false, dirty: true,
  cx: 0, cy: 0, viewW: 2.2, viewH: 1.1,
  wx: null, wy: null, plane: null, rs: [null, null, null, null, null],
};
const TANK_XB = -0.35; // 单缝模式屏障位置

function tankRebuild() {
  const cssW = tankCanvas.clientWidth || 640;
  const cssH = tankCanvas.clientHeight || 320;
  tank.viewH = tank.viewW * cssH / cssW;
  const n = RW * RH;
  if (!tank.wx) {
    tank.wx = new Float32Array(n);
    tank.wy = new Float32Array(n);
    tank.plane = new Uint8Array(n);
  }
  const { wx, wy } = tank;
  for (let j = 0; j < RH; j++) {
    const wyv = tank.cy + (0.5 - j / (RH - 1)) * tank.viewH;
    const base = j * RW;
    for (let i = 0; i < RW; i++) {
      wx[base + i] = tank.cx + (i / (RW - 1) - 0.5) * tank.viewW;
      wy[base + i] = wyv;
    }
  }
  if (tank.mode === 'double') {
    const s1 = -tank.sep / 2, s2 = tank.sep / 2;
    if (!tank.rs[0]) { tank.rs[0] = new Float32Array(n); tank.rs[1] = new Float32Array(n); }
    for (let p = 0; p < n; p++) {
      const dy = wy[p];
      const dx1 = wx[p] - s1, dx2 = wx[p] - s2;
      tank.rs[0][p] = Math.sqrt(dx1 * dx1 + dy * dy);
      tank.rs[1][p] = Math.sqrt(dx2 * dx2 + dy * dy);
    }
  } else {
    for (let q = 0; q < 5; q++) if (!tank.rs[q]) tank.rs[q] = new Float32Array(n);
    const sx = TANK_XB + 0.012;
    for (let q = 0; q < 5; q++) {
      const sy = -tank.slitW / 2 + q * (tank.slitW / 4);
      const r = tank.rs[q];
      for (let p = 0; p < n; p++) {
        const dxy = wx[p] - sx, dyy = wy[p] - sy;
        r[p] = Math.sqrt(dxy * dxy + dyy * dyy);
      }
    }
    for (let p = 0; p < n; p++) tank.plane[p] = wx[p] < TANK_XB ? 1 : 0;
  }
  tank.dirty = false;
}

function tankDrawFrame(dt) {
  if (!tank.paused) tank.phi += (TAU / tank.lambda) * tank.v * dt;
  if (tank.dirty) tankRebuild();
  const k = TAU / tank.lambda;
  const ph = tank.phi;
  const mask = LUTN - 1;
  const d = img.data;
  const { wx, wy, plane, rs } = tank;
  const slit = tank.mode === 'slit';
  const halfW = tank.slitW / 2;
  const n = RW * RH;
  for (let p = 0, o = 0; p < n; p++, o += 4) {
    const X = wx[p], Y = wy[p];
    if (slit && Math.abs(X - TANK_XB) < 0.016 && Math.abs(Y) > halfW + 0.004) {
      d[o] = 56; d[o + 1] = 60; d[o + 2] = 70; d[o + 3] = 255;
      continue;
    }
    let h = 0, s = 0.12;
    if (slit) {
      if (plane[p]) {
        h = 0.95 * sinLUT[(((k * X - ph) * LUTK) | 0) & mask];
        s += 0.95;
      } else {
        for (let q = 0; q < 5; q++) {
          const r = rs[q][p];
          const a = 1 / (1 + 4 * r);
          s += a;
          h += a * sinLUT[(((k * r - ph) * LUTK) | 0) & mask];
        }
      }
    } else {
      for (let q = 0; q < 2; q++) {
        const r = rs[q][p];
        const a = 1 / (1 + 4 * r);
        s += a;
        h += a * sinLUT[(((k * r - ph) * LUTK) | 0) & mask];
      }
    }
    const t = h / s;
    let ci = ((t * 255) | 0) + 255;
    if (ci < 0) ci = 0; else if (ci > 510) ci = 510;
    const c3 = ci * 3;
    d[o] = colLUT[c3]; d[o + 1] = colLUT[c3 + 1]; d[o + 2] = colLUT[c3 + 2]; d[o + 3] = 255;
  }
  octx.putImageData(img, 0, 0);
  const cw = tankCanvas.width, chh = tankCanvas.height;
  tctx.imageSmoothingEnabled = true;
  tctx.drawImage(off, 0, 0, cw, chh);
  // 源标记与比例尺
  const px = (X) => ((X - tank.cx) / tank.viewW) * cw + cw / 2;
  const py = (Y) => chh / 2 - ((Y - tank.cy) / tank.viewH) * chh;
  tctx.fillStyle = 'rgba(255,255,255,0.95)';
  tctx.font = '600 12px sans-serif';
  tctx.lineWidth = 2;
  if (tank.mode === 'double') {
    tctx.strokeStyle = 'rgba(255,255,255,0.9)';
    const marks = [[-tank.sep / 2, 'S₁'], [tank.sep / 2, 'S₂']];
    for (const [sx, nm] of marks) {
      tctx.beginPath();
      tctx.arc(px(sx), py(0), 5, 0, TAU);
      tctx.fill();
      tctx.stroke();
      tctx.fillText(nm, px(sx) + 8, py(0) - 8);
    }
  } else {
    tctx.fillText('缝', px(TANK_XB) + 6, py(0) - 6);
  }
  const barPx = (0.5 / tank.viewW) * cw;
  const bx = 16, by = chh - 16;
  tctx.strokeStyle = 'rgba(255,255,255,0.85)';
  tctx.beginPath();
  tctx.moveTo(bx, by - 5); tctx.lineTo(bx, by);
  tctx.lineTo(bx + barPx, by);
  tctx.lineTo(bx + barPx, by - 5);
  tctx.stroke();
  tctx.fillText('0.5 m', bx + barPx + 6, by);
}

let tankDrag = null;
tankCanvas.addEventListener('pointerdown', (e) => {
  tankDrag = { x: e.clientX, y: e.clientY };
  try { tankCanvas.setPointerCapture(e.pointerId); } catch (err) { /* noop */ }
});
tankCanvas.addEventListener('pointermove', (e) => {
  if (!tankDrag) return;
  const cw = tankCanvas.clientWidth || 1, chh = tankCanvas.clientHeight || 1;
  tank.cx -= ((e.clientX - tankDrag.x) / cw) * tank.viewW;
  tank.cy += ((e.clientY - tankDrag.y) / chh) * tank.viewH;
  tankDrag.x = e.clientX;
  tankDrag.y = e.clientY;
  tank.dirty = true;
});
tankCanvas.addEventListener('pointerup', () => { tankDrag = null; });
tankCanvas.addEventListener('pointercancel', () => { tankDrag = null; });
tankCanvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  tank.viewW = clamp(tank.viewW * Math.exp(e.deltaY * 0.0012), 0.5, 5);
  tank.dirty = true;
}, { passive: false });
new ResizeObserver(() => {
  const w = tankCanvas.clientWidth, h = tankCanvas.clientHeight;
  if (w && h && (tankCanvas.width !== w || tankCanvas.height !== h)) {
    tankCanvas.width = w;
    tankCanvas.height = h;
    tank.dirty = true;
  }
}).observe(tankCanvas);

/* ================= 第九章 · 多普勒效应 ================= */

const DP_V = 1.5;

const stDop = {
  group: new THREE.Group(), vf: 0.4, fEmit: 3, cartX: -1.2, cartV: 0.6,
  rings: [], ringIdx: 0, emitAcc: 0, waveOn: true,
  soundOn: false, tone: null, shockToasted: false,
};
scene.add(stDop.group);

let DP = {};
function buildDoppler() {
  const g = stDop.group;
  const ground = box(4.4, 0.008, 2.2, stdMat({ color: 0xa9b0b8, roughness: 0.9 }));
  ground.position.set(0, 0.904, 0);
  const trkGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-1.6, 0.912, 0), new THREE.Vector3(1.6, 0.912, 0),
  ]);
  const track = new THREE.Line(trkGeo, new THREE.LineDashedMaterial({ color: 0x5a626c, dashSize: 0.08, gapSize: 0.06 }));
  track.computeLineDistances();
  const cart = new THREE.Group();
  const body = box(0.24, 0.09, 0.13, accentMat);
  body.position.y = 0.062;
  const wheelGeo = new THREE.CylinderGeometry(0.024, 0.024, 0.02, 12);
  for (const sx of [-0.08, 0.08]) {
    for (const sz of [-0.062, 0.062]) {
      const w = new THREE.Mesh(wheelGeo, darkMetal);
      w.rotation.x = Math.PI / 2;
      w.position.set(sx, 0.024, sz);
      cart.add(w);
    }
  }
  const spk = cyl(0.03, 0.03, 0.05, darkMetal);
  spk.position.set(0.06, 0.135, 0);
  const cartLbl = makeTextSprite('声源', { fontSize: 26, color: '#ffb09a', scale: 0.0026 });
  cartLbl.position.y = 0.24;
  cart.add(body, spk, cartLbl);
  cart.position.set(-1.2, 0.908, 0);
  const pole = cyl(0.008, 0.01, 0.26, darkMetal); pole.position.set(0, 1.035, 0.42);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.032, 16, 12), stdMat({ color: 0xd9a441, roughness: 0.4, metalness: 0.5 }));
  head.position.set(0, 1.19, 0.42);
  const obsLbl = makeTextSprite('观测者', { fontSize: 26, color: '#ffd9a8', scale: 0.0026 });
  obsLbl.position.set(0, 1.3, 0.42);
  g.add(ground, track, cart, pole, head, obsLbl);
  const ringGeo = new THREE.RingGeometry(0.96, 1, 48);
  for (let i = 0; i < 24; i++) {
    const m = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({
      color: 0x8fd3ff, transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false,
    }));
    m.rotation.x = -Math.PI / 2;
    m.position.y = 0.95;
    m.visible = false;
    g.add(m);
    stDop.rings.push({ mesh: m, r: 0, active: false });
  }
  DP = { cart };
}

function stopDopTone() {
  if (stDop.tone) { stDop.tone.stop(); stDop.tone = null; }
  stDop.soundOn = false;
}
function resetDoppler() {
  stDop.cartX = -1.2;
  stDop.cartV = stDop.vf * DP_V;
  stDop.emitAcc = 0;
  stDop.rings.forEach((r) => { r.active = false; r.mesh.visible = false; });
  stopDopTone();
  stDop.shockToasted = false;
}

/* ================= 第十章 · 声音的特性与共鸣 ================= */

const TUBE_BOT = 0.94, TUBE_H = 1.05;

const stTube = {
  group: new THREE.Group(), f: 440, amp: 0.6, shape: 'sine', L: 0.34,
  phiS: 0, phiV: 0, phiR: 0, soundOn: false, tone: null,
};
scene.add(stTube.group);

let T10 = {};
function buildTube() {
  const g = stTube.group;
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, TUBE_H, 24, 1, true), glassMat(0.16));
  tube.position.set(0.28, TUBE_BOT + TUBE_H / 2, 0);
  const water = cyl(0.046, 0.046, 1, liquidMat(0x4f8fb8, 0.55), 20);
  const fork = new THREE.Group();
  const stem = box(0.012, 0.09, 0.012, metalMat); stem.position.y = -0.115;
  const p1 = box(0.015, 0.15, 0.01, metalMat); p1.position.set(-0.02, 0, 0);
  const p2 = box(0.015, 0.15, 0.01, metalMat); p2.position.set(0.02, 0, 0);
  const handle = cyl(0.008, 0.008, 0.05, stdMat({ color: 0x2e3642, roughness: 0.7 }));
  handle.position.y = -0.185;
  fork.add(stem, p1, p2, handle);
  fork.position.set(-0.1, 2.04, 0);
  const volBar = box(0.045, 1, 0.022, new THREE.MeshBasicMaterial({ color: 0xe8674a }));
  const ripples = [];
  for (let i = 0; i < 3; i++) {
    const r = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 32), new THREE.MeshBasicMaterial({
      color: 0x8fd3ff, transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false,
    }));
    r.rotation.x = -Math.PI / 2;
    r.position.set(0.28, TUBE_BOT + TUBE_H + 0.004, 0);
    g.add(r);
    ripples.push(r);
  }
  const forkLbl = makeTextSprite('音叉', { fontSize: 26, color: '#cfd6e2', scale: 0.0026 });
  forkLbl.position.set(-0.1, 2.22, 0);
  const tubeLbl = makeTextSprite('共鸣管', { fontSize: 26, color: '#9fd4e8', scale: 0.0026 });
  tubeLbl.position.set(0.28, 2.12, 0);
  g.add(tube, water, fork, volBar, forkLbl, tubeLbl);
  T10 = { water, fork, p1, p2, volBar, ripples };
}

function stopTubeTone() {
  if (stTube.tone) { stTube.tone.stop(); stTube.tone = null; }
  stTube.soundOn = false;
}

/* ================= 各章仿真更新 ================= */

let curSec = 0;
let labReady = false;

/* —— 第一/三章：弹簧振子 —— */
function springSim(dt) {
  const s = stSpring;
  const w0 = Math.sqrt(s.k / s.m);
  const om = s.gamma > 0 ? Math.sqrt(Math.max(w0 * w0 - s.gamma * s.gamma, 0.04)) : w0;
  if (s.playing) {
    s.phase += om * dt;
    if (s.gamma > 0) s.tEnv += dt;
  }
  const env = s.gamma > 0 ? s.A * Math.exp(-s.gamma * s.tEnv) : s.A;
  s.x = env * Math.cos(s.phase);
  s.v = s.gamma > 0
    ? env * (-s.gamma * Math.cos(s.phase) - om * Math.sin(s.phase))
    : -env * om * Math.sin(s.phase);
  S.glider.position.x = s.x;
  const x1 = Math.max(s.x - 0.1, S.x0 + 0.06);
  rebuildTube(S.spring, helixX(S.x0, x1, TRACK_Y, 0.05, 9), 96, 6, 0.011);
}

function updateSpringChapter(dt) {
  springSim(dt);
  const s = stSpring;
  const w0 = Math.sqrt(s.k / s.m);
  const T = (TAU / w0).toFixed(2);
  if (curSec === 0) {
    if (s.playing) {
      s.tapeAcc += dt;
      while (s.tapeAcc >= 0.02) {
        s.tapeAcc -= 0.02;
        s.tape.push(s.x);
        if (s.tape.length > 320) s.tape.shift();
      }
    }
    if (hud) {
      hud.set('x', s.x.toFixed(3) + ' m');
      hud.set('v', s.v.toFixed(2) + ' m/s');
      hud.set('T', T + ' s');
      hud.set('f', (w0 / TAU).toFixed(2) + ' Hz');
    }
  } else {
    const Ep = 0.5 * s.k * s.x * s.x;
    const Ek = 0.5 * s.m * s.v * s.v;
    if (s.playing) {
      s.eAcc += dt;
      while (s.eAcc >= 0.03) {
        s.eAcc -= 0.03;
        s.eHist.push(Ep + Ek);
        if (s.eHist.length > 170) s.eHist.shift();
      }
    }
    if (hud) {
      const E0 = 0.5 * s.k * s.A * s.A;
      hud.set('x', s.x.toFixed(3) + ' m');
      hud.set('Ep', (Ep / E0 * 100).toFixed(0) + '%');
      hud.set('Ek', (Ek / E0 * 100).toFixed(0) + '%');
      hud.set('E', ((Ep + Ek) / E0 * 100).toFixed(0) + '%');
    }
  }
}

function drawTape() {
  const W = cwCanvas.width, H = cwCanvas.height;
  cwc.fillStyle = '#f5efdd';
  cwc.fillRect(0, 0, W, H);
  cwc.fillStyle = '#dcd5c2';
  for (let y = 10; y < H; y += 24) {
    cwc.beginPath(); cwc.arc(12, y, 3.5, 0, TAU); cwc.fill();
    cwc.beginPath(); cwc.arc(W - 12, y, 3.5, 0, TAU); cwc.fill();
  }
  const midY = H / 2;
  cwc.strokeStyle = 'rgba(90,96,108,0.4)';
  cwc.setLineDash([5, 6]);
  cwc.beginPath(); cwc.moveTo(24, midY); cwc.lineTo(W - 24, midY); cwc.stroke();
  cwc.setLineDash([]);
  const tape = stSpring.tape;
  const step = (W - 60) / 319;
  cwc.strokeStyle = '#c9402e';
  cwc.lineWidth = 2.2;
  cwc.beginPath();
  for (let i = 0; i < tape.length; i++) {
    const px = W - 30 - (tape.length - 1 - i) * step;
    const py = midY - (tape[i] / 0.32) * (H * 0.38);
    if (i === 0) cwc.moveTo(px, py); else cwc.lineTo(px, py);
  }
  cwc.stroke();
  if (tape.length) {
    cwc.fillStyle = '#c9402e';
    cwc.beginPath(); cwc.arc(W - 30, midY - (tape[tape.length - 1] / 0.32) * (H * 0.38), 4, 0, TAU); cwc.fill();
    cwc.fillStyle = '#8a8272';
    cwc.font = '12px sans-serif';
    cwc.fillText('笔（固定）→ 纸带匀速左移', 30, 20);
  }
}

function drawEnergy() {
  const W = cwCanvas.width, H = cwCanvas.height;
  cwc.fillStyle = '#131a24';
  cwc.fillRect(0, 0, W, H);
  cwc.strokeStyle = 'rgba(255,255,255,0.12)';
  cwc.lineWidth = 1;
  for (let gy = 1; gy < 5; gy++) {
    cwc.beginPath(); cwc.moveTo(170, (H - 50) * gy / 5 + 20); cwc.lineTo(W - 16, (H - 50) * gy / 5 + 20); cwc.stroke();
  }
  const E0 = 0.5 * stSpring.k * stSpring.A * stSpring.A || 1;
  const barH = H - 70;
  function bar(x, frac, color, name) {
    frac = clamp(frac, 0, 1);
    cwc.fillStyle = color;
    cwc.fillRect(x, 20 + (1 - frac) * barH, 46, frac * barH);
    cwc.fillStyle = '#dfe6ee';
    cwc.font = '600 13px sans-serif';
    cwc.textAlign = 'center';
    cwc.fillText(name, x + 23, H - 28);
  }
  const Ep = 0.5 * stSpring.k * stSpring.x * stSpring.x;
  const Ek = 0.5 * stSpring.m * stSpring.v * stSpring.v;
  bar(50, Ep / E0, '#ffb35c', 'Ep 势能');
  bar(118, Ek / E0, '#7fd0ff', 'Ek 动能');
  // 总能量历史线
  cwc.strokeStyle = '#7ee2a8';
  cwc.lineWidth = 2.2;
  cwc.beginPath();
  const hist = stSpring.eHist;
  for (let i = 0; i < hist.length; i++) {
    const px = 190 + (i / 169) * (W - 220);
    const py = 20 + (1 - clamp(hist[i] / E0, 0, 1)) * barH;
    if (i === 0) cwc.moveTo(px, py); else cwc.lineTo(px, py);
  }
  cwc.stroke();
  cwc.fillStyle = '#8a94a4';
  cwc.textAlign = 'left';
  cwc.font = '12px sans-serif';
  cwc.fillText('总机械能 E（绿色线，无阻尼时应为水平直线）', 190, H - 28);
}

/* —— 第二章：单摆（完整非线性方程） —— */
function updatePendulum(dt) {
  const p = stPen;
  if (p.playing) {
    const accel = p.meas && p.meas.on ? 5 : 1;
    const dtSim = dt * accel;
    const steps = Math.max(1, Math.ceil(dtSim / 0.008));
    const h = dtSim / steps;
    for (let i = 0; i < steps; i++) {
      p.prevTh = p.th;
      p.w += -(p.g / p.L) * Math.sin(p.th) * h;
      p.th += p.w * h;
      p.t += h;
      if (p.meas && p.meas.on) {
        if (p.prevTh < 0 && p.th >= 0 && p.w > 0) {
          if (!p.meas.armed) { p.meas.armed = true; p.meas.t0 = p.t; p.meas.count = 1; }
          else {
            p.meas.count++;
            if (p.meas.count > 30) {
              p.meas.on = false;
              const Tm = (p.t - p.meas.t0) / 30;
              p.Tm = Tm;
              p.gm = (4 * Math.PI * Math.PI * p.L) / (Tm * Tm);
              toast(`测量完成：T = ${Tm.toFixed(3)} s，g实测 = ${p.gm.toFixed(2)} m/s²${p.th0 > 10 * Math.PI / 180 ? '（摆角偏大，结果略小于真值——小角度近似的误差）' : ''}`, 'ok');
              const btn = document.getElementById('measBtn');
              if (btn) btn.textContent = '⏱ 测 g 实验（30T）';
            }
          }
        }
      }
    }
  }
  const bx = PEN_PIVOT.x + p.L * Math.sin(p.th);
  const by = PEN_PIVOT.y - p.L * Math.cos(p.th);
  P.bob.position.set(bx, by, 0);
  const dir = new THREE.Vector3(bx - PEN_PIVOT.x, by - PEN_PIVOT.y, 0).normalize();
  P.str.scale.y = p.L;
  P.str.position.copy(PEN_PIVOT).addScaledVector(dir, p.L / 2);
  P.str.quaternion.setFromUnitVectors(UP, dir);
  if (hud) {
    const T = TAU * Math.sqrt(p.L / p.g);
    hud.set('th', (p.th * 180 / Math.PI).toFixed(1) + '°');
    hud.set('T', T.toFixed(2) + ' s');
    hud.set('g', p.g.toFixed(1) + ' m/s²');
    if (p.meas && p.meas.on) hud.set('Tm', p.meas.armed ? `测量中 ${Math.max(0, p.meas.count - 1)}/30` : '待过零…');
    else hud.set('Tm', p.Tm ? p.Tm.toFixed(3) + ' s' : '—');
    hud.set('gm', p.gm ? p.gm.toFixed(2) + ' m/s²' : '—');
  }
}

/* —— 第四章：受迫振动 —— */
function updateResonance(dt) {
  const r = stRes;
  const w0 = TAU * r.f0;
  const wd = TAU * r.fd;
  const ad = 0.35 * r.amp;
  if (r.sweeping) {
    r.sweepT += dt;
    r.fd = r.f0 * (0.25 + 1.75 * Math.min(r.sweepT / 16, 1));
    if (window.__waveSweepSlider) window.__waveSweepSlider.set(r.fd.toFixed(2));
    if (r.sweepT > 17) { r.sweeping = false; const b = document.getElementById('sweepBtn'); if (b) b.textContent = '⏱ 自动扫频'; }
  }
  if (true) { /* 数值积分：x″ = −ω₀²x − 2γx′ + a_d·cos(φd) */
    const a = -w0 * w0 * r.x - 2 * r.gam * r.v + ad * Math.cos(r.phiD);
    r.v += a * dt;
    r.x += r.v * dt;
    r.phiD += wd * dt;
  }
  r.Aest = Math.hypot(r.x, Math.abs(wd) > 0.01 ? r.v / wd : 0);
  const xv = 0.3 * Math.tanh(r.x / 0.3);
  const topA = 0.028 * r.amp;
  const yTop = 1.78 + topA * Math.sin(r.phiD);
  const massY = 1.15 + xv;
  R.mass.position.y = massY;
  R.pin.position.set(Math.cos(r.phiD) * 0.03, 1.87 + Math.sin(r.phiD) * 0.03, 0.037);
  rebuildTube(R.spring, helixY(yTop, massY + 0.068, 0, 0.045, 8), 90, 6, 0.011);
  if (hud) {
    const Ass = ad / (2 * r.gam * w0);
    hud.set('fd', r.fd.toFixed(2) + ' Hz');
    hud.set('f0', r.f0.toFixed(2) + ' Hz');
    hud.set('Ass', Ass.toFixed(2) + ' m');
    hud.set('An', Math.min(r.Aest, 1.5).toFixed(2) + ' m');
  }
}

function drawResCurve() {
  const W = cwCanvas.width, H = cwCanvas.height;
  cwc.fillStyle = '#131a24';
  cwc.fillRect(0, 0, W, H);
  const mL = 40, mR = 14, mT = 16, mB = 30;
  const pw = W - mL - mR, ph2 = H - mT - mB;
  const r = stRes;
  const w0 = TAU * r.f0;
  const ad = 0.35 * r.amp;
  const Aof = (fr) => {
    const w = TAU * r.f0 * fr;
    return ad / Math.sqrt(Math.pow(w0 * w0 - w * w, 2) + Math.pow(2 * r.gam * w, 2));
  };
  const A1 = ad / (2 * r.gam * w0);
  cwc.strokeStyle = 'rgba(255,255,255,0.14)';
  cwc.fillStyle = '#8a94a4';
  cwc.font = '11px sans-serif';
  cwc.lineWidth = 1;
  for (const fr of [0.5, 1, 1.5, 2]) {
    const px = mL + ((fr - 0.2) / 1.8) * pw;
    cwc.beginPath(); cwc.moveTo(px, mT); cwc.lineTo(px, mT + ph2); cwc.stroke();
    cwc.fillText(fr === 1 ? 'f₀' : fr + 'f₀', px - 8, H - 12);
  }
  cwc.strokeStyle = '#ffc46b';
  cwc.lineWidth = 2.4;
  cwc.beginPath();
  for (let i = 0; i <= 120; i++) {
    const fr = 0.2 + (i / 120) * 1.8;
    const py = mT + (1 - clamp(Aof(fr) / A1, 0, 1.05)) * ph2;
    const px = mL + ((fr - 0.2) / 1.8) * pw;
    if (i === 0) cwc.moveTo(px, py); else cwc.lineTo(px, py);
  }
  cwc.stroke();
  const frNow = r.fd / r.f0;
  const mx = mL + ((frNow - 0.2) / 1.8) * pw;
  cwc.strokeStyle = 'rgba(126,226,168,0.8)';
  cwc.setLineDash([4, 5]);
  cwc.beginPath(); cwc.moveTo(mx, mT); cwc.lineTo(mx, mT + ph2); cwc.stroke();
  cwc.setLineDash([]);
  cwc.fillStyle = '#7ee2a8';
  cwc.beginPath();
  cwc.arc(mx, mT + (1 - clamp(r.Aest / A1, 0, 1.05)) * ph2, 4.5, 0, TAU);
  cwc.fill();
  cwc.fillText('A/A稳态最大', 6, 14);
}

/* —— 第五章：质点列 —— */
function updateRow(dt) {
  const s = stRow;
  const rate = (s.slow ? 0.25 : 1) * (s.playing ? 1 : 0);
  s.phi += TAU * s.f * dt * rate;
  const k = TAU / (ROW_V / s.f);
  const pos = W5.line.geometry.attributes.position;
  for (let i = 0; i < ROW_N; i++) {
    const x = ROW_X0 + i * ROW_DX;
    const y = STR_Y + s.A * Math.sin(s.phi - k * (x - ROW_X0));
    s.balls[i].position.y = y;
    pos.setXYZ(i, x, y, 0);
    const vy = s.A * TAU * s.f * Math.cos(s.phi - k * (x - ROW_X0)) * rate;
    const arr = s.arrows[i];
    if (arr.visible) {
      arr.position.y = y + 0.1;
      arr.rotation.x = vy >= 0 ? 0 : Math.PI;
      arr.scale.setScalar(clamp(0.5 + Math.abs(vy) * 0.9, 0.4, 1.6));
    }
  }
  pos.needsUpdate = true;
  if (hud) {
    hud.set('f', s.f.toFixed(2) + ' Hz');
    hud.set('lam', (ROW_V / s.f).toFixed(2) + ' m');
    hud.set('v', ROW_V.toFixed(1) + ' m/s');
  }
}

/* —— 第六/十一章：绳波引擎 —— */
function updateRef(dt) {
  const s = stRef;
  if (s.cont) {
    s.contAcc += dt;
    if (s.contAcc >= 1.4) { s.contAcc = 0; s.eng.emit(); s.nPulse++; }
  }
  s.eng.step(dt, s.end, null);
  const pts = ST6.pts;
  for (let i = 0; i < 90; i++) pts[i].y = STR_Y + s.eng.y[i];
  rebuildTube(ST6.string, stringCurve(pts), 110, 5, 0.011);
  if (hud) {
    hud.set('end', s.end === 'fixed' ? '固定端' : '自由端');
    hud.set('c', s.eng.c.toFixed(1) + ' m/s');
    hud.set('flip', s.end === 'fixed' ? '翻转（π）' : '不翻转');
    hud.set('n', String(s.nPulse));
  }
}

function updateFree(dt) {
  const s = stFree;
  if (s.driveOn) s.phi += TAU * s.f * dt;
  s.eng.c = s.v;
  s.eng.step(dt, s.end, s.driveOn
    ? () => [0.07 * Math.sin(s.phi), 0.07 * TAU * s.f * Math.cos(s.phi)]
    : null);
  const pts = ST11.pts;
  for (let i = 0; i < 90; i++) pts[i].y = STR_Y + s.eng.y[i];
  rebuildTube(ST11.string, stringCurve(pts), 110, 5, 0.011);
  if (hud) {
    hud.set('end', s.end === 'fixed' ? '固定端' : '自由端');
    hud.set('f', s.f.toFixed(2) + ' Hz');
    hud.set('v', s.v.toFixed(1) + ' m/s');
    hud.set('lam', (s.v / s.f).toFixed(2) + ' m');
  }
}

/* —— 第七章：驻波 —— */
function updateStanding(dt) {
  const s = stSta;
  if (s.playing) s.phi += TAU * s.f * dt;
  const k = TAU * s.f / STA_V;
  const A = s.A;
  const pts = STA.pts;
  const pInc = STA.inc.geometry.attributes.position;
  const pRef = STA.ref.geometry.attributes.position;
  for (let i = 0; i < STA_M; i++) {
    const xi = (i * STA_L) / (STA_M - 1);
    const y1 = A * Math.sin(s.phi - k * xi);
    const y2 = -A * Math.sin(s.phi + k * xi - 2 * k * STA_L);
    pts[i].y = STR_Y + y1 + y2;
    pInc.setXYZ(i, pts[i].x, STR_Y + y1, 0);
    pRef.setXYZ(i, pts[i].x, STR_Y + y2, 0);
  }
  pInc.needsUpdate = true;
  pRef.needsUpdate = true;
  rebuildTube(STA.string, stringCurve(pts), 120, 5, 0.012);
  const nFloat = (2 * STA_L * s.f) / STA_V;
  const n = Math.round(nFloat);
  const matched = n >= 1 && Math.abs(nFloat - n) < 0.03;
  STA.nodeRings.forEach((r, i) => {
    if (matched && s.showNodes && i < n - 1) {
      r.visible = true;
      r.position.x = (STA_L * (n - (i + 1)) / n) - STA_L / 2;
    } else r.visible = false;
  });
  if (hud) {
    hud.set('f', s.f.toFixed(2) + ' Hz');
    hud.set('lam', (STA_V / s.f).toFixed(2) + ' m');
    hud.set('node', matched ? String(n + 1) + '（含两端）' : '—');
    hud.set('anti', matched ? String(n) : '—');
    hud.set('st', matched ? '驻波已形成 ✓' : '失谐游移…');
  }
}

/* —— 第八章：水波槽 —— */
function updateTank(dt) {
  if (!tank.paused) tankDrawFrame(dt);
  if (hud) {
    hud.set('mode', tank.mode === 'double' ? '双源干涉' : '单缝衍射');
    hud.set('lam', tank.lambda.toFixed(2) + ' m');
    hud.set('v', tank.v.toFixed(1) + ' m/s');
    hud.set('f', (tank.v / tank.lambda).toFixed(1) + ' Hz');
  }
}

/* —— 第九章：多普勒 —— */
function updateDoppler(dt) {
  const s = stDop;
  s.cartX += s.cartV * dt;
  if (s.cartX > 1.55) { s.cartX = 1.55; s.cartV = -Math.abs(s.cartV); }
  if (s.cartX < -1.55) { s.cartX = -1.55; s.cartV = Math.abs(s.cartV); }
  DP.cart.position.x = s.cartX;
  // 发射波前
  s.emitAcc += dt;
  const period = 1 / s.fEmit;
  while (s.emitAcc >= period) {
    s.emitAcc -= period;
    const ring = s.rings[s.ringIdx];
    s.ringIdx = (s.ringIdx + 1) % 24;
    ring.active = true;
    ring.r = 0.03;
    ring.mesh.position.x = s.cartX;
    ring.mesh.position.z = 0;
  }
  for (const ring of s.rings) {
    if (!ring.active) continue;
    ring.r += DP_V * dt;
    if (ring.r > 2.3) { ring.active = false; ring.mesh.visible = false; continue; }
    ring.mesh.visible = s.waveOn;
    ring.mesh.scale.set(ring.r, ring.r, 1);
    ring.mesh.material.opacity = 0.55 * (1 - ring.r / 2.3);
  }
  // 多普勒：观测者在 x=0，f′ = f·v/(v + vr)，vr = 距离变化率
  const sgn = s.cartX >= 0 ? 1 : -1;
  const vr = s.cartV * sgn;
  const den = DP_V + vr;
  const shock = den < 0.15;
  const fp = shock ? 0 : (s.fEmit * DP_V) / den;
  const status = shock ? '激波！' : vr < -0.01 ? '靠近（音调升高）' : vr > 0.01 ? '远离（音调降低）' : '经过观测者';
  if (s.tone) {
    if (shock) {
      s.tone.set(200, 0.0001);
      if (!s.shockToasted) { s.shockToasted = true; toast('源速达到波速：波前叠加成激波，无法正常发声。', 'warn'); }
    } else {
      s.tone.set(s.fEmit * 110 * (DP_V / den), 0.07); // 折算到可听频段（×110）
    }
  }
  if (hud) {
    hud.set('f', s.fEmit.toFixed(1) + ' Hz');
    hud.set('vs', (s.cartV / DP_V).toFixed(2));
    hud.set('fp', shock ? '∞' : fp.toFixed(1) + ' Hz');
    hud.set('st', status);
  }
}

/* —— 第十章：共鸣管 —— */
function updateTube(dt) {
  const s = stTube;
  s.phiS += TAU * s.f / 10 * dt;
  s.phiV += TAU * 14 * dt;
  const lam = 340 / s.f;
  const ratio = (4 * s.L) / lam;
  const mo = Math.round((ratio - 1) / 2) * 2 + 1;
  const err = Math.abs(ratio - mo);
  const res = 1 / (1 + (err * 7) * (err * 7));
  s.phiR += dt * (0.5 + 1.4 * res);
  // 水位（空气柱 = L）
  const fillH = TUBE_H - s.L;
  T10.water.scale.y = Math.max(fillH, 0.001);
  T10.water.position.y = TUBE_BOT + Math.max(fillH, 0.001) / 2;
  // 音叉振动
  const vib = s.soundOn ? 0.0045 * Math.sin(s.phiV) : 0;
  T10.p1.position.x = -0.02 - vib;
  T10.p2.position.x = 0.02 + vib;
  // 音量条
  const loud = s.amp * (0.2 + 1.6 * res);
  const barH = clamp(0.04 + 0.75 * loud, 0.04, 0.92);
  T10.volBar.scale.y = barH;
  T10.volBar.position.set(0.52, TUBE_BOT + barH / 2, 0);
  // 管口波纹
  for (let i = 0; i < 3; i++) {
    const prog = (s.phiR + i / 3) % 1;
    const rr = 0.03 + prog * 0.12;
    T10.ripples[i].scale.set(rr, rr, 1);
    T10.ripples[i].material.opacity = res * 0.55 * (1 - prog);
    T10.ripples[i].visible = res > 0.04;
  }
  if (s.tone) s.tone.set(s.f, Math.min(0.1, 0.05 * s.amp * (1 + 0.8 * res)));
  if (hud) {
    hud.set('f', s.f.toFixed(0) + ' Hz');
    hud.set('lam', lam.toFixed(2) + ' m');
    hud.set('L', s.L.toFixed(2) + ' m');
    hud.set('res', res > 0.5 ? (mo === 1 ? '共鸣！基频 λ/4' : `共鸣！${(mo + 1) / 2} 次谐频`) : err < 0.25 ? '接近共鸣' : '失谐');
  }
}

function drawScope() {
  const W = cwCanvas.width, H = cwCanvas.height;
  cwc.fillStyle = '#10161f';
  cwc.fillRect(0, 0, W, H);
  cwc.strokeStyle = 'rgba(255,255,255,0.1)';
  cwc.lineWidth = 1;
  for (let gx = 0; gx <= 8; gx++) {
    cwc.beginPath(); cwc.moveTo(gx * W / 8, 0); cwc.lineTo(gx * W / 8, H - 40); cwc.stroke();
  }
  const midY = (H - 40) / 2;
  cwc.strokeStyle = 'rgba(255,255,255,0.2)';
  cwc.beginPath(); cwc.moveTo(0, midY); cwc.lineTo(W, midY); cwc.stroke();
  const shape = (ph2) => {
    if (stTube.shape === 'square') return Math.sin(ph2) >= 0 ? 0.9 : -0.9;
    if (stTube.shape === 'sawtooth') return 2 * ((ph2 / TAU) % 1) - 1;
    return Math.sin(ph2);
  };
  cwc.strokeStyle = '#7fd0ff';
  cwc.lineWidth = 2.2;
  cwc.beginPath();
  for (let px = 0; px <= W; px += 2) {
    const ph2 = stTube.phiS + (px / W) * TAU * 3;
    const y = midY - shape(ph2) * stTube.amp * 0.34 * (H - 40) * 0.5;
    if (px === 0) cwc.moveTo(px, y); else cwc.lineTo(px, y);
  }
  cwc.stroke();
  // 共鸣增益条
  const lam = 340 / stTube.f;
  const ratio = (4 * stTube.L) / lam;
  const mo = Math.round((ratio - 1) / 2) * 2 + 1;
  const err = Math.abs(ratio - mo);
  const res = 1 / (1 + (err * 7) * (err * 7));
  cwc.fillStyle = 'rgba(255,255,255,0.15)';
  cwc.fillRect(16, H - 26, W - 32, 12);
  cwc.fillStyle = res > 0.5 ? '#7ee2a8' : '#e8674a';
  cwc.fillRect(16, H - 26, (W - 32) * clamp(res, 0.02, 1), 12);
  cwc.fillStyle = '#dfe6ee';
  cwc.font = '600 11px sans-serif';
  cwc.fillText(res > 0.5 ? '空气柱共鸣！声强大增' : '共鸣增益', 18, H - 30);
}

/* ================= 帧循环（先过就绪守卫） ================= */

app.onFrame((dt) => {
  if (!labReady) return;
  cameraTweenTick(app, dt);
  switch (curSec) {
    case 0:
    case 2: updateSpringChapter(dt); break;
    case 1: updatePendulum(dt); break;
    case 3: updateResonance(dt); break;
    case 4: updateRow(dt); break;
    case 5: updateRef(dt); break;
    case 6: updateStanding(dt); break;
    case 7: updateTank(dt); break;
    case 8: updateDoppler(dt); break;
    case 9: updateTube(dt); break;
    case 10: updateFree(dt); break;
    default: break;
  }
  if (cwDraw && cwBox.style.display !== 'none') cwDraw();
});

/* ================= 章节定义 ================= */

const ctl = createControlsPanel(document.getElementById('controls'));
let activeSectionCleanup = null;

function hideAllStations() {
  stSpring.group.visible = false;
  stPen.group.visible = false;
  stRes.group.visible = false;
  stRow.group.visible = false;
  stRef.group.visible = false;
  stSta.group.visible = false;
  stDop.group.visible = false;
  stTube.group.visible = false;
  stFree.group.visible = false;
  hideCW();
  tankCanvas.style.display = 'none';
  setHint(null);
  window.__waveSweepSlider = null;
}

function playBtn(state, obj) {
  const b = ctl.button({
    label: state.playing ? '⏸ 暂停' : '▶ 播放',
    onClick: () => {
      state.playing = !state.playing;
      b.textContent = state.playing ? '⏸ 暂停' : '▶ 播放';
      b.classList.toggle('active', state.playing);
    },
    active: true,
  });
  return b;
}

const SECTIONS = [
  {
    title: '弹簧振子',
    html: `<p><b>弹簧振子</b>是简谐运动的模型：轻弹簧（劲度系数 k）一端固定，另一端连质量 m 的滑块，在气垫导轨上不计摩擦。</p>
<p>回复力 F = <span class="hl">−kx</span>，x = A·cos(ωt)，ω = <span class="hl">√(k/m)</span>，周期 T = <span class="hl">2π√(m/k)</span>。</p>
<p>右侧「纸带」模拟匀速左移的记录纸——笔在纸上画出的就是 x–t 图像（正弦曲线）。</p>
<p>试试改变 m 或 k 看周期怎么变；改变振幅 A，周期<span class="hl">不变</span>（等时性）。</p>`,
    enter() {
      hideAllStations();
      stSpring.group.visible = true;
      Object.assign(stSpring, { A: 0.18, m: 0.8, k: 24, gamma: 0, phase: 0, tEnv: 0, playing: true, tape: [], tapeAcc: 0, eHist: [], eAcc: 0 });
      app.setCamera([0.5, 1.5, 2.5], [0, 1.0, 0]);
      setHUD([['x', '位移 x'], ['v', '速度 v'], ['T', 'T 理论'], ['f', '频率 f']]);
      showCW('纸带记录', 'x–t 图像', drawTape);
      ctl.clear();
      ctl.slider({ label: '振幅 A', min: 0.05, max: 0.3, step: 0.01, value: stSpring.A, fmt: (v) => v.toFixed(2) + ' m', onInput: (v) => { stSpring.x *= v / stSpring.A; stSpring.A = v; } });
      ctl.slider({ label: '质量 m', min: 0.2, max: 2, step: 0.05, value: stSpring.m, fmt: (v) => v.toFixed(2) + ' kg', onInput: (v) => { stSpring.m = v; } });
      ctl.slider({ label: '劲度 k', min: 5, max: 60, step: 1, value: stSpring.k, fmt: (v) => v + ' N/m', onInput: (v) => { stSpring.k = v; } });
      playBtn(stSpring);
      ctl.toggle({ label: '纸带', value: true, onChange: (v) => { if (v) showCW('纸带记录', 'x–t 图像', drawTape); else hideCW(); } });
      setHint('周期 T = 2π√(m/k)，与振幅无关');
    },
  },
  {
    title: '单摆',
    html: `<p><b>单摆</b>：细线（长 L）下拴小球。摆角很小（≤10°）时回复力近似 F ≈ −(mg/L)x，做简谐运动。</p>
<p>周期 T = <span class="hl">2π√(L/g)</span>——与摆球质量、振幅无关。</p>
<p>本仿真按<span class="hl">完整非线性方程</span> θ″ = −(g/L)·sinθ 计算：把摆角调到 10° 以上，实测周期会比公式偏大，「测 g」结果也会偏小——这正是小角度近似的局限。</p>
<p>点「测 g 实验」自动计时 30 个全振动（已 5 倍速播放），由 g = 4π²L/T² 算出重力加速度。</p>`,
    enter() {
      hideAllStations();
      stPen.group.visible = true;
      Object.assign(stPen, { L: 0.6, g: 9.8, playing: true });
      resetPendulum();
      app.setCamera([1.0, 1.8, 2.3], [0, 1.5, 0]);
      setHUD([['th', '摆角 θ'], ['T', 'T 理论'], ['g', 'g 设定'], ['Tm', 'T 实测'], ['gm', 'g 实测']]);
      ctl.clear();
      ctl.slider({ label: '摆长 L', min: 0.3, max: 1.0, step: 0.02, value: stPen.L, fmt: (v) => v.toFixed(2) + ' m', onInput: (v) => { stPen.L = v; } });
      ctl.slider({ label: '初始摆角 θ₀', min: 2, max: 30, step: 1, value: 12, fmt: (v) => v + '°', onInput: (v) => { stPen.th0 = v * Math.PI / 180; if (!stPen.meas || !stPen.meas.on) resetPendulum(); } });
      ctl.seg({
        options: [{ label: '地球 9.8', value: 9.8 }, { label: '月球 1.6', value: 1.6 }, { label: '火星 3.7', value: 3.7 }],
        value: 9.8,
        onChange: (v) => { stPen.g = v; },
      });
      const mb = ctl.button({
        label: '⏱ 测 g 实验（30T）',
        onClick: () => {
          if (stPen.meas && stPen.meas.on) { stPen.meas = null; mb.textContent = '⏱ 测 g 实验（30T）'; return; }
          resetPendulum();
          stPen.meas = { on: true, armed: false, count: 0, t0: 0 };
          mb.textContent = '测量中…（再点取消）';
          toast('开始测量：自动计时 30 个全振动（5 倍速），从第一次经过最低点开始计时。', 'ok');
        },
      });
      mb.id = 'measBtn';
      playBtn(stPen);
      ctl.button({ label: '↺ 重新释放', onClick: () => resetPendulum() });
      setHint('摆角 ≤10° 时小角度近似才成立；θ₀ 越大实测 T 偏差越大');
    },
  },
  {
    title: '简谐运动的能量',
    html: `<p>简谐运动的能量在<b>动能</b>与<b>势能</b>之间周期性转化：</p>
<p>Ep = <span class="hl">½kx²</span>（最大位移处最大），Ek = <span class="hl">½mv²</span>（平衡位置最大），总机械能 E = ½kA² <span class="hl">保持不变</span>。</p>
<p>打开「阻尼」后，振幅按指数衰减，总能量逐渐耗散——这就是现实里振动慢慢停下来的原因。观察右侧能量柱与绿色总能量线。</p>`,
    enter() {
      hideAllStations();
      stSpring.group.visible = true;
      Object.assign(stSpring, { A: 0.2, m: 0.8, k: 24, gamma: 0, phase: 0, tEnv: 0, playing: true, tape: [], tapeAcc: 0, eHist: [], eAcc: 0 });
      app.setCamera([0.5, 1.5, 2.5], [0, 1.0, 0]);
      setHUD([['x', '位移 x'], ['Ep', '势能 Ep'], ['Ek', '动能 Ek'], ['E', '总能量 E']]);
      showCW('能量转化', '能量柱 × 总能量线', drawEnergy);
      ctl.clear();
      ctl.slider({ label: '振幅 A', min: 0.05, max: 0.3, step: 0.01, value: stSpring.A, fmt: (v) => v.toFixed(2) + ' m', onInput: (v) => { stSpring.x *= v / stSpring.A; stSpring.A = v; } });
      ctl.slider({ label: '劲度 k', min: 5, max: 60, step: 1, value: stSpring.k, fmt: (v) => v + ' N/m', onInput: (v) => { stSpring.k = v; } });
      ctl.toggle({ label: '阻尼', value: false, onChange: (v) => { stSpring.gamma = v ? 0.12 : 0; if (!v) stSpring.tEnv = 0; } });
      playBtn(stSpring);
      setHint('Ep 与 Ek 此消彼长，总能量守恒；开阻尼看衰减');
    },
  },
  {
    title: '受迫振动与共振',
    html: `<p>给弹簧振子加周期性驱动力，系统做<b>受迫振动</b>；稳定后振动频率等于<span class="hl">驱动频率</span>，与固有频率无关。</p>
<p>当驱动频率 f驱 等于固有频率 f固 时振幅最大——这就是<b>共振</b>。右侧是共振曲线（稳态振幅 vs 驱动频率）：阻尼越小，峰越尖。</p>
<p>改频率后振幅需要一段时间重新稳定（真实的暂态过程）。点「自动扫频」看幅度先增后减的全过程。</p>`,
    enter() {
      hideAllStations();
      stRes.group.visible = true;
      Object.assign(stRes, { fd: 0.9, gam: 0.16, amp: 0.8, x: 0, v: 0, phiD: 0, sweeping: false, sweepT: 0, Aest: 0 });
      app.setCamera([0.85, 1.75, 2.2], [0, 1.5, 0]);
      setHUD([['fd', 'f 驱动'], ['f0', 'f 固有'], ['Ass', 'A 稳态理论'], ['An', 'A 当前']]);
      showCW('共振曲线', 'A–f 频率响应', drawResCurve);
      ctl.clear();
      const sl = ctl.slider({ label: '驱动频率', min: 0.18, max: 1.8, step: 0.02, value: stRes.fd, fmt: (v) => v.toFixed(2) + ' Hz', onInput: (v) => { stRes.fd = v; stRes.sweeping = false; const b = document.getElementById('sweepBtn'); if (b) b.textContent = '⏱ 自动扫频'; } });
      window.__waveSweepSlider = { set: (v) => sl.set(parseFloat(v)) };
      ctl.slider({ label: '阻尼 γ', min: 0.05, max: 1.2, step: 0.01, value: stRes.gam, fmt: (v) => v.toFixed(2), onInput: (v) => { stRes.gam = v; } });
      ctl.slider({ label: '驱动幅度', min: 0.3, max: 1.5, step: 0.05, value: stRes.amp, fmt: (v) => v.toFixed(2) + '×', onInput: (v) => { stRes.amp = v; } });
      const sb = ctl.button({
        label: '⏱ 自动扫频',
        onClick: () => {
          if (stRes.sweeping) { stRes.sweeping = false; sb.textContent = '⏱ 自动扫频'; return; }
          stRes.sweeping = true;
          stRes.sweepT = 0;
          stRes.x = 0; stRes.v = 0;
          sb.textContent = '扫频中…（再点停止）';
        },
      });
      sb.id = 'sweepBtn';
      setHint('f驱 = f固 = 0.90 Hz 时共振；阻尼越小峰越尖');
    },
  },
  {
    title: '机械波的形成',
    html: `<p>一排质点被弹性介质联系起来，波源（最左端）振动时，振动状态由近及远传播，形成<b>横波</b>。</p>
<p>每个质点只在平衡位置附近<span class="hl">上下振动</span>，并不随波迁移——盯住橙色标记的质点验证！</p>
<p>y = A·sin(ωt − kx)，波长 λ = <span class="hl">v/f</span>（v 由介质决定）。</p>`,
    enter() {
      hideAllStations();
      stRow.group.visible = true;
      Object.assign(stRow, { f: 0.8, A: 0.08, phi: 0, slow: false, playing: true });
      app.setCamera([0.35, 2.0, 2.6], [0, 1.08, 0]);
      setHUD([['f', '频率 f'], ['lam', '波长 λ'], ['v', '波速 v']]);
      ctl.clear();
      ctl.slider({ label: '频率 f', min: 0.3, max: 2, step: 0.05, value: stRow.f, fmt: (v) => v.toFixed(2) + ' Hz', onInput: (v) => { stRow.f = v; } });
      ctl.slider({ label: '振幅 A', min: 0.02, max: 0.12, step: 0.005, value: stRow.A, fmt: (v) => v.toFixed(3) + ' m', onInput: (v) => { stRow.A = v; } });
      ctl.toggle({ label: '质点编号', value: false, onChange: (v) => { stRow.labels.forEach((l) => { l.visible = v; }); } });
      ctl.toggle({ label: '运动箭头', value: false, onChange: (v) => { stRow.arrows.forEach((a) => { a.visible = v; }); } });
      ctl.toggle({ label: '慢放', value: false, onChange: (v) => { stRow.slow = v; } });
      playBtn(stRow);
      setHint('橙色标记质点：只上下振动，不随波向右迁移');
    },
  },
  {
    title: '波的反射',
    html: `<p>绳端性质决定反射波形：</p>
<p><b>固定端</b>：端点被墙固定，反射脉冲<span class="hl">翻转</span>（半波损失，相位突变 π）；<b>自由端</b>：端点可自由运动，反射脉冲<span class="hl">不翻转</span>。</p>
<p>点「发射脉冲」看脉冲撞到右端如何返回；入射与反射波会短暂交叠（叠加原理）。打开「连续脉冲」反复观察。</p>`,
    enter() {
      hideAllStations();
      stRef.group.visible = true;
      stRef.eng.reset();
      stRef.eng.c = 1.2;
      stRef.eng.damp = 0.008;
      Object.assign(stRef, { end: 'fixed', cont: false, contAcc: 0, nPulse: 0 });
      ST6.plate.visible = true;
      ST6.ring.visible = false;
      app.setCamera([0.1, 1.6, 2.5], [0, 1.04, 0]);
      setHUD([['end', '右端'], ['c', '波速'], ['flip', '反射相位'], ['n', '已发脉冲']]);
      ctl.clear();
      ctl.seg({
        options: [{ label: '固定端', value: 'fixed' }, { label: '自由端', value: 'free' }],
        value: 'fixed',
        onChange: (v) => {
          stRef.end = v;
          ST6.plate.visible = v === 'fixed';
          ST6.ring.visible = v === 'free';
          stRef.nPulse = 0;
        },
      });
      ctl.button({ label: '发射脉冲', onClick: () => { stRef.eng.emit(); stRef.nPulse++; } });
      ctl.slider({ label: '波速', min: 0.5, max: 3, step: 0.1, value: 1.2, fmt: (v) => v.toFixed(1) + ' m/s', onInput: (v) => { stRef.eng.c = v; } });
      ctl.toggle({ label: '连续脉冲', value: false, onChange: (v) => { stRef.cont = v; } });
      ctl.toggle({ label: '阻尼', value: false, onChange: (v) => { stRef.eng.damp = v ? 0.06 : 0.008; } });
      setHint('固定端反射翻转 · 自由端反射不翻转');
    },
  },
  {
    title: '波的叠加与驻波',
    html: `<p>两列振幅、频率相同的波<span class="hl">相向传播</span>叠加：频率匹配时形成<b>驻波</b>——有的点永远不动（<b>波节</b>），有的点振幅最大（<b>波腹</b>）。</p>
<p>两端固定弦的驻波条件：L = <span class="hl">n·λ/2</span>（n = 1, 2, 3…）。失谐时合成波形游移，形不成稳定波节。</p>
<p>相邻波节（或波腹）间距 = <span class="hl">λ/2</span>。开「显示分量」对照入射波（青）与反射波（橙）如何合成。</p>`,
    enter() {
      hideAllStations();
      stSta.group.visible = true;
      Object.assign(stSta, { f: 1.667, phi: 0, A: 0.09, showComp: true, showNodes: true, playing: true });
      app.setCamera([0.55, 1.5, 2.5], [0, 1.04, 0]);
      setHUD([['f', '频率 f'], ['lam', '波长 λ'], ['node', '波节'], ['anti', '波腹'], ['st', '状态']]);
      ctl.clear();
      const slF = ctl.slider({ label: '频率 f', min: 0.4, max: 4, step: 0.01, value: stSta.f, fmt: (v) => v.toFixed(2) + ' Hz', onInput: (v) => { stSta.f = v; } });
      ctl.toggle({ label: '显示分量', value: true, onChange: (v) => { stSta.showComp = v; STA.inc.visible = v; STA.ref.visible = v; setHint(v ? '青色=入射波 · 橙色=反射波 · 亮色=合成波' : null); } });
      ctl.toggle({ label: '波节标注', value: true, onChange: (v) => { stSta.showNodes = v; } });
      ctl.button({
        label: '⇄ 自动匹配频率',
        onClick: () => {
          const n = Math.max(1, Math.round((2 * STA_L * stSta.f) / STA_V));
          const fNew = (n * STA_V) / (2 * STA_L);
          stSta.f = fNew;
          slF.set(fNew);
          toast(`已匹配第 ${n} 谐频：L = ${n}·λ/2（f = ${fNew.toFixed(2)} Hz）`, 'ok');
        },
      });
      playBtn(stSta);
      setHint('青色=入射波 · 橙色=反射波 · 亮色=合成波');
    },
  },
  {
    title: '水波的干涉与衍射',
    html: `<p><b>干涉</b>：两列同频波叠加，路径差为波长整数倍处相长（亮纹）、半整数倍处相消（暗纹）。</p>
<p><b>衍射</b>：波绕过障碍物继续传播；缝宽与波长相当时衍射最明显。</p>
<p>画面为水波槽俯视，亮度代表水面起伏。双源模式拖「源间距」看条纹疏密；单缝模式把缝宽从大调小，看波绕进缝后阴影区。</p>
<p><span class="hl">拖拽平移 · 滚轮缩放</span>。</p>`,
    enter() {
      hideAllStations();
      tankCanvas.style.display = '';
      tankCanvas.width = tankCanvas.clientWidth || 800;
      tankCanvas.height = tankCanvas.clientHeight || 400;
      Object.assign(tank, { mode: 'double', lambda: 0.2, sep: 0.5, slitW: 0.16, v: 0.6, phi: 0, paused: false, dirty: true, cx: 0, cy: 0, viewW: 2.2 });
      setHUD([['mode', '模式'], ['lam', '波长 λ'], ['v', '波速'], ['f', '频率 f']]);
      ctl.clear();
      ctl.seg({
        options: [{ label: '双源干涉', value: 'double' }, { label: '单缝衍射', value: 'slit' }],
        value: 'double',
        onChange: (v) => { tank.mode = v; tank.dirty = true; },
      });
      ctl.slider({ label: '波长 λ', min: 0.08, max: 0.4, step: 0.01, value: tank.lambda, fmt: (v) => v.toFixed(2) + ' m', onInput: (v) => { tank.lambda = v; } });
      ctl.slider({ label: '源间距 / 缝宽', min: 0.06, max: 1.0, step: 0.02, value: tank.sep, fmt: (v) => v.toFixed(2) + ' m', onInput: (v) => { if (tank.mode === 'double') tank.sep = v; else tank.slitW = v; tank.dirty = true; } });
      ctl.slider({ label: '波速', min: 0.3, max: 1.2, step: 0.05, value: tank.v, fmt: (v) => v.toFixed(2) + ' m/s', onInput: (v) => { tank.v = v; } });
      ctl.button({ label: '⏸ 暂停', onClick: (b) => { tank.paused = !tank.paused; b.textContent = tank.paused ? '▶ 播放' : '⏸ 暂停'; b.classList.toggle('active', !tank.paused); }, active: true });
      setHint('拖拽平移 · 滚轮缩放；缝宽 ≈ λ 时衍射最明显');
    },
  },
  {
    title: '多普勒效应',
    html: `<p>声源运动时，前方波前被<span class="hl">压缩</span>（波长变短、音调变高），后方被拉长（音调变低）。</p>
<p>f′ = f·v/(v ∓ vs)：靠近用 −、远离用 +。点 🔊 按钮，小车经过观测者时亲耳听音调先升后降（发声按 ×110 折算到可听频段）。</p>
<p>把源速推到接近波速（vs/v → 1）：波前叠成一堵「墙」——这就是<span class="hl">激波</span>，此时无法正常发声。</p>`,
    enter() {
      hideAllStations();
      stDop.group.visible = true;
      Object.assign(stDop, { vf: 0.4, fEmit: 3, waveOn: true });
      resetDoppler();
      app.setCamera([0, 2.9, 3.0], [0, 0.98, 0]);
      setHUD([['f', 'f 源'], ['vs', 'vs/v'], ['fp', "f′ 观测"], ['st', '状态']]);
      ctl.clear();
      ctl.slider({ label: '源速度 vs/v', min: -0.5, max: 0.9, step: 0.05, value: stDop.vf, fmt: (v) => v.toFixed(2), onInput: (v) => { stDop.vf = v; stDop.cartV = v * DP_V; stDop.shockToasted = false; } });
      ctl.slider({ label: '发射频率', min: 1, max: 5, step: 0.1, value: stDop.fEmit, fmt: (v) => v.toFixed(1) + ' Hz', onInput: (v) => { stDop.fEmit = v; } });
      ctl.toggle({ label: '波前显示', value: true, onChange: (v) => { stDop.waveOn = v; } });
      const ab = ctl.button({
        label: '🔊 发声',
        onClick: () => {
          if (stDop.soundOn) { stopDopTone(); ab.textContent = '🔊 发声'; return; }
          if (Math.abs(stDop.cartV) / DP_V >= 0.95) {
            toast('源速 ≥ 0.95 波速（接近激波），禁用发声。请先调低源速度。', 'warn');
            return;
          }
          stDop.tone = createTone();
          stDop.soundOn = true;
          ab.textContent = '🔇 停止';
          activeSectionCleanup = () => stopDopTone();
          toast('听：小车靠近时音调升高，远离时降低（经观测者时切换）。', 'ok');
        },
      });
      setHint('小车往复运动；vs/v 为当前实际值（含反向）');
    },
  },
  {
    title: '声音的特性与共鸣',
    html: `<p>声音三要素：<b>音调</b>由频率决定，<b>响度</b>由振幅（声强）决定，<b>音色</b>由波形（谐波成分）决定。</p>
<p>右侧示波器实时画出你设置的波形。玻璃管是<b>共鸣管</b>：空气柱长 L = <span class="hl">λ/4 的奇数倍</span>（λ = v/f，v = 340 m/s）时发生共鸣，管口声波明显增强。</p>
<p>调整管长寻找共鸣点（黄色 HUD 提示），点 🔊 听音调、响度、音色的差别。</p>`,
    enter() {
      hideAllStations();
      stTube.group.visible = true;
      Object.assign(stTube, { f: 440, amp: 0.6, shape: 'sine', L: 0.34, phiS: 0, phiV: 0, phiR: 0 });
      stopTubeTone();
      app.setCamera([0.9, 1.6, 2.0], [0.1, 1.45, 0]);
      setHUD([['f', '频率 f'], ['lam', '波长 λ'], ['L', '管长 L'], ['res', '共鸣判断']]);
      showCW('示波器', '波形 · 共鸣增益', drawScope);
      ctl.clear();
      ctl.slider({ label: '频率', min: 150, max: 1000, step: 5, value: stTube.f, fmt: (v) => v + ' Hz', onInput: (v) => { stTube.f = v; } });
      ctl.slider({ label: '振幅（响度）', min: 0.2, max: 1, step: 0.05, value: stTube.amp, fmt: (v) => v.toFixed(2), onInput: (v) => { stTube.amp = v; } });
      ctl.seg({
        options: [{ label: '正弦', value: 'sine' }, { label: '方波', value: 'square' }, { label: '锯齿', value: 'sawtooth' }],
        value: 'sine',
        onChange: (v) => { stTube.shape = v; if (stTube.tone) stTube.tone.osc.type = v; },
      });
      ctl.slider({ label: '管长 L', min: 0.15, max: 1.0, step: 0.01, value: stTube.L, fmt: (v) => v.toFixed(2) + ' m', onInput: (v) => { stTube.L = v; } });
      const ab = ctl.button({
        label: '🔊 发声',
        onClick: () => {
          if (stTube.soundOn) { stopTubeTone(); ab.textContent = '🔊 发声'; return; }
          stTube.tone = createTone();
          stTube.tone.osc.type = stTube.shape;
          stTube.soundOn = true;
          ab.textContent = '🔇 停止';
          activeSectionCleanup = () => stopTubeTone();
          toast('发声中：调「管长 L」到 λ/4 附近找共鸣点，管口波纹会明显增强。', 'ok');
        },
      });
      setHint('共鸣条件：L = λ/4（基频）；440 Hz 时 λ ≈ 0.77 m，L ≈ 0.19 m');
    },
  },
  {
    title: '自由实验',
    html: `<p>自由玩波！绳上可以发脉冲、加连续驱动，右端任意切换固定端 / 自由端。</p>
<p>建议玩法：① 打开「连续驱动」，点「自动匹配频率」看驻波如何形成；② 关驱动改发单个脉冲，对比不同端点的反射；③ 加大阻尼看波如何衰减。</p>
<p>驱动频率匹配驻波条件（右端固定：L = nλ/2；右端自由：L = (2n−1)λ/4）时才能形成稳定驻波。</p>`,
    enter() {
      hideAllStations();
      stFree.group.visible = true;
      stFree.eng.reset();
      stFree.eng.c = 1.2;
      stFree.eng.damp = 0.006;
      Object.assign(stFree, { end: 'fixed', driveOn: false, f: 1.2, phi: 0, v: 1.2 });
      ST11.plate.visible = true;
      ST11.ring.visible = false;
      app.setCamera([0.1, 1.6, 2.5], [0, 1.04, 0]);
      setHUD([['end', '右端'], ['f', '频率 f'], ['v', '波速'], ['lam', '波长 λ']]);
      ctl.clear();
      ctl.seg({
        options: [{ label: '固定端', value: 'fixed' }, { label: '自由端', value: 'free' }],
        value: 'fixed',
        onChange: (v) => {
          stFree.end = v;
          ST11.plate.visible = v === 'fixed';
          ST11.ring.visible = v === 'free';
          if (stFree.driveOn) stFree.eng.reset();
        },
      });
      ctl.button({ label: '发射脉冲', onClick: () => stFree.eng.emit(0.3, 0.15, 0.1) });
      ctl.toggle({ label: '连续驱动', value: false, onChange: (v) => { stFree.driveOn = v; stFree.phi = 0; if (!v) stFree.eng.reset(); } });
      const slFF = ctl.slider({ label: '频率 f', min: 0.3, max: 3, step: 0.05, value: stFree.f, fmt: (v) => v.toFixed(2) + ' Hz', onInput: (v) => { stFree.f = v; } });
      ctl.slider({ label: '波速', min: 0.4, max: 3, step: 0.1, value: stFree.v, fmt: (v) => v.toFixed(1) + ' m/s', onInput: (v) => { stFree.v = v; } });
      ctl.slider({ label: '阻尼', min: 0, max: 0.5, step: 0.01, value: 0.006, fmt: (v) => v.toFixed(2), onInput: (v) => { stFree.eng.damp = v; } });
      ctl.button({
        label: '⇄ 自动匹配频率',
        onClick: () => {
          let fNew;
          if (stFree.end === 'fixed') {
            // 右端固定（驱动端亦为波节）：L = n·λ/2 → f = n·v/(2L)
            const n = Math.max(1, Math.round((4.0 * stFree.f) / stFree.v));
            fNew = (n * stFree.v) / 4.0;
          } else {
            // 右端自由：L = (2n−1)·λ/4 → f = (2n−1)·v/(4L)，取最近的奇次谐波
            const m = Math.max(1, 2 * Math.round((8.0 * stFree.f / stFree.v - 1) / 2) + 1);
            fNew = (m * stFree.v) / 8.0;
          }
          fNew = clamp(fNew, 0.3, 3);
          stFree.f = fNew;
          slFF.set(fNew);
          toast(`已匹配：f = ${fNew.toFixed(2)} Hz，开「连续驱动」等几秒看驻波形成。`, 'ok');
        },
      });
      setHint('先「自动匹配频率」再开「连续驱动」，几秒后驻波浮现');
    },
  },
  {
    title: '随堂检测',
    html: `<p>5 道选择题，检验「振动与波」这一章的掌握情况。</p>`,
    enter() {
      hideAllStations();
      setHUD(null);
      app.setCamera([0.7, 1.6, 2.8], [0, 1.05, 0]);
      ctl.clear();
      showQuiz();
    },
  },
];

/* ================= 随堂检测 ================= */

const QUIZ = [
  {
    q: '弹簧振子做简谐运动，其周期 T 的正确表达式与说法是？',
    opts: ['T = 2π√(k/m)，劲度越大周期越大', 'T = 2π√(m/k)，且与振幅无关', 'T = 2π√(L/g)，与质量有关', 'T 与振幅成正比，振幅越大周期越长'],
    a: 1,
    ex: '弹簧振子 T = 2π√(m/k)：m 越大、k 越小，周期越长；周期与振幅无关（等时性）。√(L/g) 是单摆的公式。',
  },
  {
    q: '关于受迫振动与共振，下列说法正确的是？',
    opts: ['驱动频率越大，振幅一定越大', '驱动频率等于系统固有频率时，振幅达到最大', '阻尼越大共振越明显', '固有频率会随驱动频率改变而改变'],
    a: 1,
    ex: '受迫振动稳定后频率等于驱动频率；当 f驱 = f固 时振幅最大即共振。固有频率由系统本身决定（如 ω₀=√(k/m)），阻尼越小共振峰越尖。',
  },
  {
    q: '两端固定的弦形成驻波时，相邻波节之间的距离是？',
    opts: ['λ/4', 'λ/2', 'λ', '2λ'],
    a: 1,
    ex: '驻波中相邻波节相距 λ/2，相邻波节与波腹相距 λ/4。两端固定弦的驻波条件为 L = n·λ/2（n = 1, 2, 3…）。',
  },
  {
    q: '你站在路边，警车鸣着笛高速驶来又呼啸而过，你听到的警笛音调变化是？',
    opts: ['一直变高', '一直变低', '先变高后变低', '先变低后变高'],
    a: 2,
    ex: '多普勒效应：靠近时 f′ = fv/(v−vs) > f，音调升高；远离时 f′ = fv/(v+vs) < f，音调降低——所以是先升高后降低。',
  },
  {
    q: '机械波在介质中传播时，介质中的质点如何运动？',
    opts: ['随波一起向传播方向迁移', '只在各自平衡位置附近往复振动，不随波迁移', '沿波形曲线匀速滑动', '保持静止不动'],
    a: 1,
    ex: '波传播的是振动状态和能量，质点并不随波迁移——本实验「机械波的形成」一章里盯住橙色标记质点即可验证。',
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
        card.querySelector('.q-score').textContent = `得分：${score}`;
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
      <p style="color:var(--text-dim);margin:4px 0 18px">正确率 ${pct}%${pct >= 80 ? '，振动与波的要点你已经掌握了！' : pct >= 60 ? '，大部分概念已经清楚，回顾一下错题。' : '，建议回到前面章节再看一遍哦。'}</p>`;
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
    row.appendChild(back);
    row.appendChild(again);
    card.appendChild(row);
    panel.appendChild(card);
  }

  renderQ();
  activeSectionCleanup = () => panel.remove();
}

/* ================= 启动 ================= */

loadAll([
  { key: 'sky', label: '环境', job: loadHDR(TEX.skyHdr) },
  { key: 'skyBg', label: '背景', job: loadTexture(TEX.skyWebp) },
  { key: 'plankDiff', label: '台面', job: loadTexture(TEX.plankDiff) },
  { key: 'plankArm', label: '台面细节', job: loadTexture(TEX.plankArm, { colorSpace: null }) },
  { key: 'plankNor', label: '台面纹理', job: loadTexture(TEX.plankNor, { colorSpace: null }) },
  { key: 'paintDiff', label: '柜体', job: loadTexture(TEX.paintDiff) },
  { key: 'paintArm', label: '柜体细节', job: loadTexture(TEX.paintArm, { colorSpace: null }) },
  { key: 'paintNor', label: '柜体纹理', job: loadTexture(TEX.paintNor, { colorSpace: null }) },
  { key: 'slabDiff', label: '地面', job: loadTexture(TEX.slabDiff) },
  { key: 'slabArm', label: '地面细节', job: loadTexture(TEX.slabArm, { colorSpace: null }) },
  { key: 'slabNor', label: '地面纹理', job: loadTexture(TEX.slabNor, { colorSpace: null }) },
  { key: 'wallDiff', label: '墙面', job: loadTexture(TEX.wallDiff) },
  { key: 'wallNor', label: '墙面纹理', job: loadTexture(TEX.wallNor, { colorSpace: null }) },
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
  buildSpring();
  buildPendulum();
  buildResonance();
  buildRow();
  ST6 = buildStringStation(stRef.group);
  ST11 = buildStringStation(stFree.group);
  buildStanding();
  buildDoppler();
  buildTube();
  labReady = true;

  loader.hide();
  const sections = createSections({
    nav: document.getElementById('sideNav'),
    descPanel: document.getElementById('descPanel'),
    sections: SECTIONS,
    onSelect(i, sec) {
      if (activeSectionCleanup) { activeSectionCleanup(); activeSectionCleanup = null; }
      curSec = i;
      sec.enter();
    },
  });
  window.__eduSections = sections;
  sections.select(0);
}).catch((err) => {
  loader.setText('资源加载失败：' + err.message);
  console.error(err);
});
