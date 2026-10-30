/* EduLab · 运动与力（motion）
 * 章节：纸带与 v-t 图 / 光电门测速度 / 自由落体 / 牛顿第二定律 / 滑动摩擦力 / 斜面与力的分解
 *       超重与失重 / 机械能守恒 / 动量守恒 / 自由实验台
 * 场景：力学实验台——气垫导轨、小车、打点计时器与纸带、光电门、弹簧测力计、电梯与单摆。
 */
import {
  THREE, clamp,
  loadTexture, loadAll, createApp, cameraTweenTick, makeLoader,
  createSections, createControlsPanel, makeHUD, makeTextSprite, setSpriteText,
} from './edu-core.js';

/* ---------------- 基础 ---------------- */

const stage = document.getElementById('stage');
const loader = makeLoader(stage, '正在布置力学实验台…');
const app = createApp({
  container: stage,
  fov: 40, near: 0.1, far: 400,
  cameraPos: [2, 4.2, 9.5], target: [0, 1.2, 0],
  minDistance: 1.5, maxDistance: 50,
  keepBackground: true,
});
const { scene, camera, controls } = app;

scene.add(new THREE.HemisphereLight(0xe8eef5, 0x8a8074, 0.85));
const sun = new THREE.DirectionalLight(0xfff2e0, 2.0);
sun.position.set(-6, 12, 8);
scene.add(sun);
const fill = new THREE.DirectionalLight(0xdde8ff, 0.7);
fill.position.set(8, 6, -6);
scene.add(fill);

const lerp = (a, b, t) => a + (b - a) * t;

/* ---------------- 通用小件 ---------------- */

const M = (color, rough = 0.8, metal = 0) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal });
const box = (w, h, d, mat) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
const cyl = (rt, rb, h, mat, seg = 20) => new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
function makeRope(color = 0xd8ccb0, thick = 0.03) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(thick, thick, 1, 8), M(color, 0.9));
  m.geometry.translate(0, 0.5, 0);
  const d = new THREE.Vector3();
  m.set = (p1, p2) => {
    d.subVectors(p2, p1);
    m.position.copy(p1);
    m.scale.set(1, Math.max(d.length(), 0.01), 1);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize());
  };
  return m;
}
function lbl(text, color = '#e8f0fa', scale = 0.007) {
  return makeTextSprite(text, { fontSize: 30, color, scale, bg: 'rgba(12,18,26,0.6)' });
}
function makeArrow(color) {
  const g = new THREE.Group();
  const hex = '#' + new THREE.Color(color).getHexString();
  const mat = new THREE.MeshBasicMaterial({ color });
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 1, 10), mat);
  shaft.geometry.translate(0, 0.5, 0);
  const head = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.3, 12), mat);
  g.add(shaft, head);
  const l = makeTextSprite('', { fontSize: 30, color: hex, scale: 0.0062, bg: 'rgba(12,18,26,0.66)' });
  g.add(l);
  const up = new THREE.Vector3(0, 1, 0), q = new THREE.Quaternion(), dir = new THREE.Vector3();
  g.set = (from, to, text) => {
    dir.subVectors(to, from);
    const len = Math.max(dir.length(), 0.01);
    q.setFromUnitVectors(up, dir.clone().normalize());
    g.quaternion.copy(q);
    g.position.copy(from);
    shaft.scale.y = Math.max(len - 0.28, 0.05);
    head.position.y = len - 0.15;
    g.visible = true;
    if (text !== undefined) setSpriteText(l, text, { fontSize: 30, color: hex, scale: 0.0062, bg: 'rgba(12,18,26,0.66)' });
    l.position.set(0, len + 0.32, 0);
  };
  g.hide = () => { g.visible = false; };
  return g;
}

/* ---------------- 共享景物：实验台 + 气垫导轨 ---------------- */

let tableMat;
function buildBench(g, len = 12) {
  const top = box(len, 0.16, 3.2, tableMat);
  top.position.y = 1.02;
  g.add(top);
  for (let i = 0; i <= 3; i++) {
    const leg = box(0.18, 0.94, 0.18, M(0x4a5158, 0.7));
    leg.position.set(-len / 2 + 0.6 + i * (len - 1.2) / 3, 0.47, 0);
    g.add(leg);
  }
  return top;
}
function buildTrack(g, len = 10, y = 1.32) {
  const rail = box(len, 0.1, 0.14, M(0xb8bcc2, 0.35, 0.75));
  rail.position.set(0, y, 0);
  g.add(rail);
  const base = box(len - 0.6, 0.07, 0.4, M(0x6f747b, 0.6));
  base.position.set(0, y - 0.12, 0);
  g.add(base);
  // 标尺刻度
  for (let m = -4; m <= 4; m++) {
    const tick = box(0.02, 0.05, 0.16, M(0x46505a, 0.6));
    tick.position.set(m, y + 0.08, 0);
    g.add(tick);
  }
  const zLbl = lbl('x = 0', '#c3cfe0', 0.004);
  zLbl.position.set(0, y + 0.4, 0);
  g.add(zLbl);
  return rail;
}
function buildCart(g, color = 0x3f7fd0) {
  const cart = new THREE.Group();
  const body = box(0.55, 0.14, 0.24, M(color, 0.45, 0.3));
  body.position.y = 0.07;
  const top = box(0.4, 0.05, 0.2, M(0xd8dce2, 0.5));
  top.position.y = 0.165;
  cart.add(body, top);
  g.add(cart);
  return cart;
}
function buildGate(g, x, y = 1.32) {
  const gate = new THREE.Group();
  const post = box(0.06, 0.5, 0.06, M(0x46505a, 0.6));
  post.position.set(0, 0.25, 0.26);
  const armT = box(0.05, 0.05, 0.3, M(0x46505a, 0.6));
  armT.position.set(0, 0.48, 0.1);
  const armB = box(0.05, 0.05, 0.3, M(0x46505a, 0.6));
  armB.position.set(0, 0.2, 0.1);
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), new THREE.MeshBasicMaterial({ color: 0x33ff66 }));
  led.position.set(0, 0.55, 0.26);
  gate.add(post, armT, armB, led);
  gate.position.set(x, y, 0);
  const t = lbl('G', '#8fd3a0', 0.004);
  t.position.set(0, 0.85, 0.26);
  gate.add(t);
  gate.userData.led = led;
  g.add(gate);
  return gate;
}
function flashGate(gate) {
  gate.userData.led.material.color.set(0xffe066);
  setTimeout(() => { gate.userData.led.material.color.set(0x33ff66); }, 180);
}

/* ---------------- 简单图表卡（2D canvas） ---------------- */

function makePlotCard(title, w = 258, h = 190) {
  const card = document.createElement('div');
  card.className = 'hud-card';
  card.style.cssText = `position:absolute;top:186px;right:14px;z-index:10;width:${w + 24}px;`;
  card.innerHTML = `<div style="margin-bottom:6px"><b>${title}</b></div>`;
  const canvas = document.createElement('canvas');
  canvas.width = w * 2; canvas.height = h * 2;
  canvas.style.cssText = 'width:100%;display:block;border-radius:8px;background:color-mix(in srgb, var(--bg) 55%, transparent);';
  card.appendChild(canvas);
  stage.appendChild(card);
  const ctx = canvas.getContext('2d');
  function axes(xl, yl) {
    ctx.setTransform(2, 0, 0, 2, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const st = getComputedStyle(document.documentElement);
    const grid = st.getPropertyValue('--card-border').trim() || '#8899aa88';
    const fg = st.getPropertyValue('--text-dim').trim() || '#889';
    ctx.strokeStyle = grid; ctx.fillStyle = fg;
    ctx.lineWidth = 1; ctx.font = '10px sans-serif';
    const ox = 38, oy = h - 26;
    ctx.beginPath();
    ctx.moveTo(ox, 12); ctx.lineTo(ox, oy); ctx.lineTo(w - 8, oy);
    ctx.stroke();
    ctx.fillText(yl, 8, 14);
    ctx.fillText(xl, w - 26, oy + 14);
    return { ox, oy, pw: w - ox - 10, ph: oy - 16 };
  }
  return { el: card, ctx, axes, w, h,
    hide(v = false) { card.style.display = v ? 'none' : ''; } };
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

/* ============ 01 纸带与 v-t 图 ============ */

const TAPE = { F: 0.6, m: 0.5, t: -1, dots: [], plot: null };
function buildTape(g) {
  buildBench(g, 12);
  buildTrack(g, 10, 1.32);
  // 打点计时器（左端）
  const timer = box(0.5, 0.32, 0.3, M(0x35404a, 0.6));
  timer.position.set(-4.7, 1.62, 0);
  g.add(timer);
  const timerLbl = lbl('打点计时器', '#c3cfe0', 0.004);
  timerLbl.position.set(-4.7, 2.1, 0);
  g.add(timerLbl);
  TAPE.cart = buildCart(g);
  // 纸带（从计时器到小车）
  TAPE.tape = box(1, 0.015, 0.16, M(0xf2ecd8, 0.9));
  TAPE.tape.geometry.translate(0.5, 0, 0);
  g.add(TAPE.tape);
  TAPE.dotsGroup = new THREE.Group();
  g.add(TAPE.dotsGroup);
  // 滑轮 + 挂钩砝码（右端）
  const pulPost = box(0.06, 0.5, 0.06, M(0x46505a, 0.6));
  pulPost.position.set(5.15, 1.55, 0);
  g.add(pulPost);
  const pul = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.03, 8, 20), M(0xb8a06a, 0.5, 0.4));
  pul.position.set(5.15, 1.78, 0);
  g.add(pul);
  TAPE.pulley = pul;
  TAPE.hanger = new THREE.Group();
  const plate = cyl(0.09, 0.09, 0.03, M(0x8a8f96, 0.5, 0.6), 16);
  TAPE.hanger.add(plate);
  for (let i = 0; i < 3; i++) {
    const wgt = cyl(0.07, 0.07, 0.05, M(0x9aa2ab, 0.4, 0.6), 16);
    wgt.position.y = -0.05 - i * 0.055;
    TAPE.hanger.add(wgt);
  }
  g.add(TAPE.hanger);
  TAPE.rope = makeRope(0xd8ccb0, 0.022);
  g.add(TAPE.rope);
  TAPE.ropeH = makeRope(0xd8ccb0, 0.022);
  g.add(TAPE.ropeH);
  TAPE.plot = makePlotCard('纸带算出的 v–t 图');
  TAPE.plot.hide(true);
  resetTape();
}
function resetTape() {
  TAPE.t = -1;
  TAPE.cart.position.set(-3.8, 1.42, 0);
  TAPE.dots.forEach((d) => TAPE.dotsGroup.remove(d));
  TAPE.dots = [];
  TAPE.tape.scale.x = 0.9;
  TAPE.tape.position.set(-4.45, 1.55, 0);
  TAPE.hanger.position.set(5.15, 1.62, 0);
  TAPE.hanger.visible = true;
  TAPE.rope.set(new THREE.Vector3(5.15, 1.78, 0), new THREE.Vector3(5.15, 1.62, 0));
  TAPE.ropeH.set(new THREE.Vector3(TAPE.cart.position.x + 0.1, 1.5, 0), new THREE.Vector3(5.15, 1.78, 0));
  TAPE.vt = [];
  if (TAPE.plot) TAPE.plot.hide(true);
}
const TAPE_DT = 0.1;   // 每 5 个计时周期取一个计数点（0.02×5）
function stepTape(dt) {
  if (TAPE.t < 0) return;
  TAPE.t += dt;
  const a = TAPE.F * 9.8 / (TAPE.m + TAPE.F);   // 系统整体：a = m钩·g / (M车 + m钩)
  const x0 = -3.8;
  const x = clamp(x0 + 0.5 * a * TAPE.t * TAPE.t * 0.55, -3.8, 4.4);
  TAPE.cart.position.x = x;
  // 纸带随小车伸出
  TAPE.tape.scale.x = x - (-4.45) + 0.35;
  // 挂钩随绳下降
  const drop = clamp((x - x0) * 0.55, 0, 1.4);
  TAPE.hanger.position.y = 1.62 - drop;
  TAPE.rope.set(new THREE.Vector3(5.15, 1.78, 0), new THREE.Vector3(5.15, TAPE.hanger.position.y, 0));
  TAPE.ropeH.set(new THREE.Vector3(x + 0.1, 1.5, 0), new THREE.Vector3(5.15, 1.78, 0));
  // 计数点
  const nShould = Math.floor(TAPE.t / TAPE_DT);
  while (TAPE.dots.length < nShould && TAPE.dots.length < 70) {
    const i = TAPE.dots.length;
    const ti = (i + 1) * TAPE_DT;
    const xi = clamp(x0 + 0.5 * a * ti * ti * 0.55, -3.8, 4.4);
    if (xi >= 4.35) break;   // 小车到头，纸带不再打点
    const dot = cyl(0.018, 0.018, 0.005, M(0x333a40, 0.8), 8);
    dot.rotation.x = Math.PI / 2;
    dot.position.set(xi - 0.32, 1.565, 0.04);
    TAPE.dotsGroup.add(dot);
    TAPE.dots.push(dot);
    TAPE.vt.push({ t: ti, v: a * ti, x: xi });
  }
  if (x >= 4.39 || TAPE.t > 3.2) { TAPE.t = -2; drawTapePlot(); }
}
function drawTapePlot() {
  const plot = TAPE.plot;
  plot.hide(false);
  const { ctx, axes, w, h } = plot;
  const vmax = Math.max(...TAPE.vt.map((p) => p.v), 0.5);
  const tmax = Math.max(...TAPE.vt.map((p) => p.t), 1);
  const { ox, oy, pw, ph } = axes('t/s', 'v/(m·s⁻¹)');
  const st = getComputedStyle(document.documentElement);
  ctx.strokeStyle = st.getPropertyValue('--accent').trim() || '#e8674a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  TAPE.vt.forEach((p, i) => {
    const px = ox + (p.t / tmax) * pw;
    const py = oy - (p.v / vmax) * ph;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  });
  ctx.stroke();
  ctx.fillStyle = st.getPropertyValue('--text-dim').trim() || '#889';
  ctx.font = '10px sans-serif';
  ctx.fillText('a = ' + (TAPE.F * 9.8 / (TAPE.m + TAPE.F)).toFixed(2) + ' m/s²（斜率）', ox + 8, oy - ph * 0.85);
  hset('fit', 'v–t 是一条过原点的直线 → 匀加速');
}
function tapeCtl() {
  ctl.clear();
  ctl.slider({ label: '挂重质量', min: 0.1, max: 1.2, step: 0.05, value: TAPE.F, fmt: (v) => v.toFixed(2) + ' kg→' + (v * 9.8).toFixed(1) + 'N', onInput: (v) => { TAPE.F = v; } });
  ctl.slider({ label: '小车质量', min: 0.2, max: 1.5, step: 0.05, value: TAPE.m, fmt: (v) => v.toFixed(2) + ' kg', onInput: (v) => { TAPE.m = v; } });
  ctl.sep();
  ctl.button({ label: '▶ 释放小车', onClick() { resetTape(); TAPE.t = 0; } });
  ctl.button({ label: '↺ 复位', onClick() { resetTape(); } });
  setHUD([['a', '加速度 a=m钩g/(M+m钩)'], ['dots', '计数点'], ['fit', '图线判断'], ['tip', '提示']]);
  hset('a', (TAPE.F * 9.8 / (TAPE.m + TAPE.F)).toFixed(2) + ' m/s²');
  hset('dots', '0');
  hset('fit', '释放后自动绘制');
  hset('tip', '相邻计数点间距越来越大');
}

/* ============ 02 光电门测速度 ============ */

const GATE = { v: 0.8, w: 0.05, L: 2.0, acc: 0, t: -1, t1: 0, t2: 0 };
function buildGates(g) {
  buildBench(g, 12);
  buildTrack(g, 10, 1.32);
  GATE.cart = buildCart(g);
  GATE.vane = box(0.05, 0.18, 0.26, M(0x2c333a, 0.6));
  GATE.vane.position.y = 0.28;
  GATE.cart.add(GATE.vane);
  GATE.g1 = buildGate(g, -1, 1.32);
  GATE.g2 = buildGate(g, 1, 1.32);
  GATE.lbl1 = lbl('', '#8fd3a0', 0.0045); GATE.lbl1.position.set(-1, 2.6, 0.3); g.add(GATE.lbl1);
  GATE.lbl2 = lbl('', '#8fd3a0', 0.0045); GATE.lbl2.position.set(1, 2.6, 0.3); g.add(GATE.lbl2);
  resetGates();
}
function resetGates() {
  GATE.t = -1;
  GATE.vCur = GATE.v;
  GATE.cart.position.set(-4.4, 1.42, 0);
  GATE.t1 = GATE.t2 = 0;
  setSpriteText(GATE.lbl1, 'G1', { fontSize: 30, color: '#8fd3a0', scale: 0.0045, bg: 'rgba(12,18,26,0.6)' });
  setSpriteText(GATE.lbl2, 'G2', { fontSize: 30, color: '#8fd3a0', scale: 0.0045, bg: 'rgba(12,18,26,0.6)' });
  updGates(true);
}
function updGates(idle = false) {
  GATE.g1.position.x = -GATE.L / 2;
  GATE.g2.position.x = GATE.L / 2;
  GATE.lbl1.position.x = -GATE.L / 2;
  GATE.lbl2.position.x = GATE.L / 2;
  if (idle) {
    hset('d', GATE.w.toFixed(2) + ' m');
    hset('L', GATE.L.toFixed(1) + ' m');
    hset('t', '–');
    hset('v', '–');
  }
}
function stepGates(dt) {
  if (GATE.t < 0) return;
  GATE.t += dt;
  GATE.vCur = (GATE.vCur ?? GATE.v) + GATE.acc * dt;   // 导轨微倾 → 匀加速
  GATE.cart.position.x += GATE.vCur * dt;
  const x = GATE.cart.position.x;
  const w = GATE.w;
  [GATE.g1, GATE.g2].forEach((gt, i) => {
    const gx = i === 0 ? -GATE.L / 2 : GATE.L / 2;
    const entered = x >= gx - w / 2 && x <= gx + w / 2;
    if (entered && !GATE['in' + i]) {
      GATE['in' + i] = true;
      GATE['tStart' + i] = GATE.t;
      flashGate(gt);
    }
    if (GATE['in' + i] && x > gx + w / 2) {
      GATE['in' + i] = false;
      GATE['tt' + i] = GATE.t - GATE['tStart' + i];
      const v = w / GATE['tt' + i];
      setSpriteText(i === 0 ? GATE.lbl1 : GATE.lbl2, 'v' + (i + 1) + '=' + v.toFixed(2) + ' m/s', { fontSize: 30, color: '#ffd166', scale: 0.0045, bg: 'rgba(12,18,26,0.66)' });
      if (i === 0) GATE.v1v = v; else {
        GATE.v2v = v;
        const aMeas = (v * v - (GATE.v1v || 0) * (GATE.v1v || 0)) / (2 * GATE.L);   // a = (v2²−v1²)/2L
        hset('a', aMeas.toFixed(3) + ' m/s²（=(v2²−v1²)/2L）');
      }
      hset('t', 'Δt1=' + (GATE.tt0 * 1000).toFixed(1) + 'ms  Δt2=' + (GATE.tt1 * 1000).toFixed(1) + 'ms');
      hset('v', 'v1=' + (GATE.v1v || 0).toFixed(2) + '  v2=' + (GATE.v2v || 0).toFixed(2) + ' m/s');
    }
  });
  if (x > 5) GATE.t = -2;
}
function gatesCtl() {
  ctl.clear();
  ctl.slider({ label: '初速度', min: 0.2, max: 2.5, step: 0.05, value: GATE.v, fmt: (v) => v.toFixed(2) + ' m/s', onInput: (v) => { GATE.v = v; } });
  ctl.slider({ label: '导轨加速度', min: 0, max: 0.6, step: 0.05, value: GATE.acc, fmt: (v) => v.toFixed(2) + ' m/s²', onInput: (v) => { GATE.acc = v; } });
  ctl.slider({ label: '挡光片宽度', min: 0.02, max: 0.2, step: 0.01, value: GATE.w, fmt: (v) => v.toFixed(2) + ' m', onInput: (v) => { GATE.w = v; updGates(true); } });
  ctl.slider({ label: '两门间距', min: 0.6, max: 4, step: 0.1, value: GATE.L, fmt: (v) => v.toFixed(1) + ' m', onInput: (v) => { GATE.L = v; updGates(true); } });
  ctl.sep();
  ctl.button({ label: '▶ 释放', onClick() { resetGates(); GATE.t = 0; } });
  setHUD([['d', '挡光片宽度 d'], ['L', '门间距'], ['t', '挡光时间'], ['v', 'v1 / v2'], ['a', '由速度求加速度']]);
  hset('v', '极短时间内的平均速度 = 瞬时速度');
  updGates(true);
}

/* ============ 03 自由落体 ============ */

const DROP = { h: 4.5, g: 9.8, slow: false, t: -1, ghosts: [], ghostT: 0, obj: 'ball', vac: false };
/* 终端速度（示意量级）：钢球几乎不受空气阻力，乒乓球次之，羽毛很快到达终端速度 */
const DROP_OBJS = { ball: { name: '钢球', vt: 60 }, pp: { name: '乒乓球', vt: 6.5 }, feather: { name: '羽毛', vt: 1.3 } };
function buildDrop(g) {
  // 落体塔
  const tower = box(0.5, 6.4, 0.5, M(0x6f747b, 0.7));
  tower.position.set(0, 3.2, -0.5);
  g.add(tower);
  const armTop = box(1.6, 0.1, 0.1, M(0x46505a, 0.6));
  armTop.position.set(0.6, 6.2, -0.2);
  g.add(armTop);
  DROP.ball = new THREE.Mesh(new THREE.SphereGeometry(0.16, 18, 14), M(0xd0763a, 0.5));
  g.add(DROP.ball);
  DROP.ghostsGroup = new THREE.Group();
  g.add(DROP.ghostsGroup);
  const floorY = 0;
  DROP.floorLbl = lbl('地面', '#c3cfe0', 0.004);
  DROP.floorLbl.position.set(1.6, 0.25, 0);
  g.add(DROP.floorLbl);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(14, 8), M(0xcabf9f, 0.95));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.01;
  g.add(ground);
  DROP.marker = box(0.5, 0.02, 0.2, M(0xe86a5a, 0.6));
  g.add(DROP.marker);
  resetDrop();
}
function resetDrop() {
  DROP.t = -1;
  DROP.v = 0;
  DROP.y = DROP.h;
  DROP.ghosts.forEach((m) => DROP.ghostsGroup.remove(m));
  DROP.ghosts = [];
  DROP.ball.visible = true;
  DROP.ball.position.set(0.6, DROP.h, 0);
  DROP.marker.position.set(0.6, 0.01, 0);
  DROP.marker.scale.x = 1;
  hset('t', '–');
  hset('v', '–');
}
function stepDrop(dt) {
  if (DROP.t < 0) return;
  const g = DROP.g;
  DROP.t += dt;
  const vt = DROP.vac ? Infinity : DROP_OBJS[DROP.obj].vt;
  // a = g·(1 − v²/vt²)：空气阻力随速度增大，v 达到终端速度后匀速下落
  DROP.v = Math.min((DROP.v ?? 0) + g * dt, vt);
  DROP.y = Math.max((DROP.y ?? DROP.h) - DROP.v * dt, 0.16);
  DROP.ball.position.y = DROP.y;
  // 频闪残影
  DROP.ghostT += dt;
  if (DROP.ghostT > 0.12 && DROP.ghosts.length < 26) {
    DROP.ghostT = 0;
    const gm = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), new THREE.MeshBasicMaterial({ color: 0xd0763a, transparent: true, opacity: 0.25 }));
    gm.position.copy(DROP.ball.position);
    DROP.ghostsGroup.add(gm);
    DROP.ghosts.push(gm);
  }
  if (DROP.y <= 0.17) {
    DROP.t = -2;
    hset('t', DROP.t.toFixed(2) + ' s');
    hset('v', DROP.v.toFixed(1) + ' m/s' + (!DROP.vac && vt < 10 ? '（≈终端速度）' : ''));
    hset('eq', DROP.vac || vt > 50 ? 'h=½gt² → t=√(2h/g)' : '阻力 F=½ρC_dAv²，v 大后 a→0');
  }
}

/* ============ 04 牛顿第二定律 ============ */

const NEWT = { F: 0.5, m: 0.5, t: -1 };
function buildNewton(g) {
  buildBench(g, 12);
  buildTrack(g, 10, 1.32);
  NEWT.cart = buildCart(g, 0xc06838);
  NEWT.g1 = buildGate(g, -0.5, 1.32);
  NEWT.g2 = buildGate(g, 2.5, 1.32);
  const pulPost = box(0.06, 0.5, 0.06, M(0x46505a, 0.6));
  pulPost.position.set(5.15, 1.55, 0);
  g.add(pulPost);
  const pul = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.03, 8, 20), M(0xb8a06a, 0.5, 0.4));
  pul.position.set(5.15, 1.78, 0);
  g.add(pul);
  NEWT.hanger = new THREE.Group();
  const plate = cyl(0.09, 0.09, 0.03, M(0x8a8f96, 0.5, 0.6), 16);
  NEWT.hanger.add(plate);
  const wgt = cyl(0.07, 0.07, 0.05, M(0x9aa2ab, 0.4, 0.6), 16);
  wgt.position.y = -0.06;
  NEWT.hanger.add(wgt);
  g.add(NEWT.hanger);
  NEWT.rope = makeRope(0xd8ccb0, 0.022);
  g.add(NEWT.rope);
  NEWT.ropeH = makeRope(0xd8ccb0, 0.022);
  g.add(NEWT.ropeH);
  NEWT.mLbl = lbl('', '#ffd166', 0.0045);
  g.add(NEWT.mLbl);
  resetNewton();
}
function resetNewton() {
  NEWT.t = -1;
  NEWT.cart.position.set(-4.4, 1.42, 0);
  NEWT.hanger.position.set(5.15, 1.72, 0);
  NEWT.rope.set(new THREE.Vector3(5.15, 1.78, 0), new THREE.Vector3(5.15, 1.72, 0));
  NEWT.ropeH.set(new THREE.Vector3(NEWT.cart.position.x + 0.1, 1.5, 0), new THREE.Vector3(5.15, 1.78, 0));
  setSpriteText(NEWT.mLbl, '', { fontSize: 30, color: '#ffd166', scale: 0.0045, bg: 'rgba(12,18,26,0.6)' });
  hset('a', '–');
  hset('meas', '释放后由光电门测出');
}
function stepNewton(dt) {
  if (NEWT.t < 0) return;
  NEWT.t += dt;
  // 整体法：a = (m·g − 未平衡的摩擦) / (M + m)；绳拉力 T = M·(a + f/M)…
  const mh = NEWT.F, Mc = NEWT.m, bal = NEWT.bal ?? true;
  const fFric = bal ? 0 : 0.3 * Mc * 9.8;           // 未平衡摩擦力时 μ≈0.3
  const drive = mh * 9.8 - fFric;
  const a = Math.max(drive / (Mc + mh), 0);
  const T = Mc * a + fFric;                          // 对小车用牛顿第二定律：T − f = M·a
  NEWT.aCur = a; NEWT.tCur = T;
  if (a <= 0) {                                      // 拉不动
    hset('a', '0 m/s²（拉不动）');
    hset('tension', 'T ≤ mg = ' + (mh * 9.8).toFixed(2) + ' N');
    NEWT.t = -2;
    return;
  }
  const x0 = -4.4;
  NEWT.cart.position.x = clamp(x0 + 0.5 * a * NEWT.t * NEWT.t, -4.4, 4.4);
  NEWT.hanger.position.y = clamp(1.72 - (NEWT.cart.position.x - x0) * 0.35, 0.5, 1.72);
  NEWT.rope.set(new THREE.Vector3(5.15, 1.78, 0), new THREE.Vector3(5.15, NEWT.hanger.position.y, 0));
  NEWT.ropeH.set(new THREE.Vector3(NEWT.cart.position.x + 0.1, 1.5, 0), new THREE.Vector3(5.15, 1.78, 0));
  hset('a', a.toFixed(2) + ' m/s²（=驱动/(M+m)）');
  hset('tension', 'T=' + T.toFixed(2) + ' N ' + (T < mh * 9.8 - 0.01 ? '< mg=' + (mh * 9.8).toFixed(2) : '≈ mg'));
  const x = NEWT.cart.position.x;
  [NEWT.g1, NEWT.g2].forEach((gt, i) => {
    const gx = i === 0 ? -0.5 : 2.5;
    if (!NEWT['p' + i] && x >= gx) {
      NEWT['p' + i] = true;
      NEWT['tt' + i] = NEWT.t;
      flashGate(gt);
      if (i === 1) {
        const v1 = a * NEWT.tt0, v2 = a * NEWT.tt1;
        const aMeas = (v2 * v2 - v1 * v1) / (2 * 3.0);
        hset('meas', aMeas.toFixed(2) + ' m/s²（光电门实测）');
        NEWT.t = -2;
      }
    }
  });
}

/* ============ 05 滑动摩擦力 ============ */

const FRIC = { G: 20, mu: 0.5, pulling: false, x: -2.5, pullT: 0 };
function buildFric(g) {
  buildBench(g, 12);
  // 木板
  const board = box(6, 0.08, 1.4, M(0xb98d5f, 0.85));
  board.position.set(0, 1.14, 0);
  g.add(board);
  // 物块
  FRIC.blk = box(0.7, 0.45, 0.7, M(0x8a6845, 0.85));
  FRIC.blk.position.set(-2.5, 1.4, 0);
  g.add(FRIC.blk);
  // 弹簧测力计（圆环 + 壳 + 指针读数）
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.02, 8, 16), M(0xb8bdc4, 0.4, 0.6));
  FRIC.scaleBody = new THREE.Group();
  const shell = box(0.55, 0.09, 0.05, M(0xd8dcE0, 0.4));
  const hook = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.015, 8, 14), M(0xb8bdc4, 0.4, 0.6));
  hook.position.x = 0.32;
  FRIC.scaleBody.add(shell, hook);
  g.add(FRIC.scaleBody);
  FRIC.scaleLbl = lbl('', '#ffb46e', 0.0048);
  g.add(FRIC.scaleLbl);
  FRIC.hand = makeArrow(0xffa23e);
  g.add(FRIC.hand);
  FRIC.faceLbl = lbl('木板', '#d8c8a8', 0.0042);
  FRIC.faceLbl.position.set(0, 1.55, 0.85);
  g.add(FRIC.faceLbl);
  updFric();
}
function updFric() {
  const mu = FRIC.mu;
  const Gt = FRIC.G;
  const F = FRIC.pulling ? (FRIC.fCur ?? mu * Gt) : mu * Gt;
  FRIC.blk.position.x = FRIC.x;
  const sx = FRIC.x - 0.35 - 0.55;
  FRIC.scaleBody.position.set(sx, 1.42, 0);
  FRIC.scaleLbl.position.set(sx, 1.85, 0);
  setSpriteText(FRIC.scaleLbl, 'F拉 = ' + F.toFixed(1) + ' N', { fontSize: 30, color: '#ffb46e', scale: 0.0048, bg: 'rgba(12,18,26,0.66)' });
  const names = { 0.3: '棉布', 0.5: '木板', 0.7: '毛巾' };
  setSpriteText(FRIC.faceLbl, names[mu] || '木板', { fontSize: 30, color: '#d8c8a8', scale: 0.0042, bg: 'rgba(12,18,26,0.6)' });
  if (FRIC.pulling) {
    FRIC.hand.set(new THREE.Vector3(sx - 1.6, 1.42, 0), new THREE.Vector3(sx - 0.4, 1.42, 0), '匀速拉动');
  } else FRIC.hand.hide();
  // 阶段：静摩擦（随拉力增大）→ 最大静摩擦 → 滑动摩擦（回落并恒定）
  let stage = '待拉动';
  if (FRIC.pulling) {
    const t = FRIC.pullT ?? 0;
    stage = t < 1.4 ? '静摩擦：随拉力增大（物块未动）' : t < 1.6 ? '达到最大静摩擦！物块被拉动' : '滑动摩擦：示数回落并保持恒定';
  }
  hset('n', Gt.toFixed(1) + ' N');
  hset('f', F.toFixed(1) + ' N');
  hset('mu', 'μ = F/N = ' + mu.toFixed(2));
  hset('law', stage);
}
function fricCtl() {
  ctl.clear();
  ctl.slider({ label: '物块重 G', min: 5, max: 50, step: 1, value: FRIC.G, fmt: (v) => v + ' N', onInput: (v) => { FRIC.G = v; updFric(); } });
  ctl.sep();
  const btns = [];
  const paint = () => btns.forEach(({ b, v }) => b.classList.toggle('active', v === FRIC.mu));
  [[0.3, '棉布面'], [0.5, '木板面'], [0.7, '毛巾面']].forEach(([v, t]) => {
    const b = ctl.button({ label: t, onClick: () => { FRIC.mu = v; updFric(); paint(); } });
    btns.push({ b, v });
  });
  paint();
  ctl.button({
    label: '▶ 匀速拉动', onClick(btn) {
      FRIC.pulling = !FRIC.pulling;
      FRIC.pullT = 0; FRIC.fCur = undefined;
      btn.classList.toggle('active', FRIC.pulling);
      btn.textContent = FRIC.pulling ? '⏸ 停止' : '▶ 匀速拉动';
      updFric();
    },
  });
  setHUD([['n', '压力 N=G'], ['f', '滑动摩擦力'], ['mu', '动摩擦因数'], ['law', '规律']]);
  updFric();
}

/* ============ 06 斜面与力的分解 ============ */

const INC = { ang: 25, G: 30, mu: 0, show: true };
function buildIncline(g) {
  buildBench(g, 12);
  INC.wedge = new THREE.Group();
  g.add(INC.wedge);
  INC.blk = box(0.6, 0.4, 0.6, M(0x8a6845, 0.85));
  g.add(INC.blk);
  INC.gArrow = makeArrow(0x5aa7e8);
  INC.g1Arrow = makeArrow(0xe86a5a);
  INC.g2Arrow = makeArrow(0x8f7fe8);
  g.add(INC.gArrow, INC.g1Arrow, INC.g2Arrow);
  INC.lbl = lbl('', '#ffd166', 0.0045);
  g.add(INC.lbl);
  updIncline();
}
function updIncline() {
  const th = INC.ang * Math.PI / 180;
  const len = 4.2, hgt = Math.sin(th) * len;
  INC.wedge.rotation.z = 0;
  INC.wedge.children.forEach(() => {});
  if (!INC.wedge.userData.plank) {
    const plank = box(len, 0.09, 1.2, M(0xb98d5f, 0.85));
    plank.geometry.translate(len / 2, 0, 0);
    INC.wedge.add(plank);
    INC.wedge.userData.plank = plank;
    const support = cyl(0.05, 0.05, 1, M(0x6f747b, 0.6), 10);
    support.geometry.translate(0, 0.5, 0);
    INC.wedge.add(support);
    INC.wedge.userData.support = support;
  }
  INC.wedge.position.set(-len / 2 - 1.2, 1.1 + 0.05, 0);
  INC.wedge.rotation.z = th;
  INC.wedge.userData.support.scale.y = hgt;
  INC.wedge.userData.support.position.set(len * 0.75, 0, 0);
  // 物块放在斜面中部
  const d = len * 0.55;
  const bx = Math.cos(th) * d, by = Math.sin(th) * d;
  INC.blk.position.set(-len / 2 - 1.2 + bx, 1.1 + 0.09 + by + 0.2, 0);
  INC.blk.rotation.z = th;
  const c0 = new THREE.Vector3(INC.blk.position.x, INC.blk.position.y + 0.28, 0.62);
  const Gt = INC.G;
  INC.gArrow.set(c0, c0.clone().add(new THREE.Vector3(0, -1.0, 0)), 'G=' + Gt + ' N');
  if (INC.show) {
    const g1 = Gt * Math.sin(th), g2 = Gt * Math.cos(th);
    const dirDown = new THREE.Vector3(-Math.cos(th), -Math.sin(th), 0);
    const dirPress = new THREE.Vector3(Math.sin(th), -Math.cos(th), 0);
    INC.g1Arrow.set(c0, c0.clone().addScaledVector(dirDown, 0.25 + g1 / 40), 'G1=G·sinθ=' + g1.toFixed(1) + ' N');
    INC.g2Arrow.set(c0, c0.clone().addScaledVector(dirPress, 0.25 + g2 / 40), 'G2=G·cosθ=' + g2.toFixed(1) + ' N');
  } else { INC.g1Arrow.hide(); INC.g2Arrow.hide(); }
  setSpriteText(INC.lbl, 'θ=' + INC.ang + '°', { fontSize: 30, color: '#ffd166', scale: 0.0045, bg: 'rgba(12,18,26,0.6)' });
  INC.lbl.position.set(-len / 2 - 0.4, 1.35, 0);
  hset('g1', (Gt * Math.sin(th)).toFixed(1) + ' N（下滑分力）');
  hset('g2', (Gt * Math.cos(th)).toFixed(1) + ' N（压紧斜面）');
  hset('th', INC.ang + '°');
  // 摩擦与临界角：G·sinθ > μ·G·cosθ（即 tanθ > μ）时开始下滑，临界角与质量无关
  if (INC.mu > 0) {
    const slide = Math.tan(th) > INC.mu;
    const a = slide ? 9.8 * (Math.sin(th) - INC.mu * Math.cos(th)) : 0;
    hset('note', slide
      ? 'tanθ=' + Math.tan(th).toFixed(2) + ' > μ=' + INC.mu + '：下滑，a=' + a.toFixed(2) + ' m/s²'
      : 'tanθ=' + Math.tan(th).toFixed(2) + ' ≤ μ=' + INC.mu + '：静止，静摩擦平衡 G·sinθ');
    hset('crit', '临界角 arctanμ = ' + (Math.atan(INC.mu) * 180 / Math.PI).toFixed(1) + '°（与质量无关）');
  } else {
    hset('note', INC.ang > 30 ? '倾角大：下滑分力明显' : '倾角小：物体被压得更紧');
    hset('crit', '–');
  }
}
function inclineCtl() {
  ctl.clear();
  ctl.slider({ label: '倾角 θ', min: 10, max: 45, step: 1, value: INC.ang, fmt: (v) => v + '°', onInput: (v) => { INC.ang = v; updIncline(); } });
  ctl.slider({ label: '物重 G', min: 10, max: 50, step: 1, value: INC.G, fmt: (v) => v + ' N', onInput: (v) => { INC.G = v; updIncline(); } });
  ctl.slider({ label: '静摩擦因数 μ', min: 0, max: 1, step: 0.05, value: INC.mu, fmt: (v) => v.toFixed(2), onInput: (v) => { INC.mu = v; updIncline(); } });
  ctl.sep();
  ctl.toggle({ label: '显示两分力', value: true, onChange: (v) => { INC.show = v; updIncline(); } });
  setHUD([['g1', '下滑分力 G1'], ['g2', '垂直分力 G2'], ['th', '倾角'], ['crit', '临界角'], ['note', '状态']]);
  updIncline();
}

/* ============ 07 超重与失重 ============ */

const LIFT = { a: 0, y: 0, v: 0, mode: 0 };
function buildLift(g) {
  const shaft = box(2.2, 8, 0.3, M(0x8f8a80, 0.9));
  shaft.position.set(0, 4, -0.9);
  g.add(shaft);
  const cab = new THREE.Group();
  const cabBody = new THREE.Mesh(new THREE.BoxGeometry(1.9, 2.2, 1.6),
    new THREE.MeshPhysicalMaterial({ color: 0xcfd8e2, roughness: 0.4, transparent: true, opacity: 0.55 }));
  cabBody.position.y = 1.1;
  cab.add(cabBody);
  // 秤 + 砝码
  const scaleP = box(0.7, 0.08, 0.5, M(0xd8dcE0, 0.4));
  scaleP.position.set(0, 0.06, 0.2);
  const wgt = box(0.4, 0.4, 0.4, M(0x46505a, 0.6));
  wgt.position.set(0, 0.3, 0.2);
  cab.add(scaleP, wgt);
  LIFT.readLbl = lbl('', '#ffd166', 0.006);
  LIFT.readLbl.position.set(0, 0.62, 0.45);
  cab.add(LIFT.readLbl);
  g.add(cab);
  LIFT.cab = cab;
  // 楼层标记
  [1, 2, 3].forEach((f) => {
    const t = lbl(f + 'F', '#c3cfe0', 0.004);
    t.position.set(1.9, f * 2.4, 0);
    g.add(t);
  });
  LIFT.y = 2.4;
  updLift(true);
}
function updLift(idle = false) {
  const m = 2;   // 砝码 2 kg
  const N = Math.max(m * (9.8 + LIFT.a), 0);   // a = −g（缆绳断开）时示数为 0：完全失重
  LIFT.cab.position.y = LIFT.y;
  const state = idle ? '静止'
    : LIFT.a <= -9.7 ? '完全失重：a = −g，N = 0'
      : Math.abs(LIFT.a) < 0.15 ? '匀速/静止：N = mg'
        : LIFT.a > 0 ? '向上加速：N > mg（超重）' : '向下加速：N < mg（失重）';
  setSpriteText(LIFT.readLbl, 'N = ' + N.toFixed(1) + ' N', { fontSize: 34, color: '#ffd166', scale: 0.006, bg: 'rgba(12,18,26,0.7)' });
  hset('n', N.toFixed(1) + ' N');
  hset('mg', (m * 9.8).toFixed(1) + ' N');
  hset('a', LIFT.a.toFixed(1) + ' m/s²');
  hset('st', state);
}
function liftCtl() {
  ctl.clear();
  ctl.slider({ label: '加速度 a', min: -3, max: 3, step: 0.1, value: 0, fmt: (v) => v.toFixed(1) + ' m/s²', onInput: (v) => { LIFT.a = v; LIFT.mode = 1; updLift(); } });
  ctl.sep();
  ctl.button({
    label: '▲ 上升', onClick(btn) {
      LIFT.v = 1.2; LIFT.dir = 1;
      btn.setActive = null;
    },
  });
  ctl.button({
    label: '▼ 下降', onClick() { LIFT.v = -1.2; LIFT.dir = -1; },
  });
  ctl.button({ label: '■ 停', onClick() { LIFT.v = 0; } });
  ctl.button({ label: '⚠ 缆绳断开', onClick() { LIFT.v = 0; LIFT.a = -9.8; updLift(); } });
  setHUD([['n', '秤的示数 N'], ['mg', '砝码重 mg'], ['a', '加速度'], ['st', '状态']]);
  updLift(true);
}

/* ============ 08 机械能守恒（单摆） ============ */

const PEN = { ang: 40, len: 2.2, t: 0, playing: true, bars: null };
function buildPend(g) {
  const stand = box(0.14, 3.6, 0.14, M(0x46505a, 0.7));
  stand.position.set(0, 1.8, -0.6);
  g.add(stand);
  const baseP = box(1.2, 0.12, 0.8, M(0x6f747b, 0.7));
  baseP.position.set(0, 0.06, -0.6);
  g.add(baseP);
  const armB = box(1.4, 0.1, 0.1, M(0x46505a, 0.7));
  armB.position.set(0.5, 3.55, -0.6);
  g.add(armB);
  PEN.pivot = new THREE.Vector3(1.1, 3.5, 0);
  PEN.rod = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1, 8), M(0xb8bdc4, 0.5, 0.5));
  PEN.rod.geometry.translate(0, 0.5, 0);
  g.add(PEN.rod);
  PEN.bob = new THREE.Mesh(new THREE.SphereGeometry(0.22, 20, 16), M(0xc2743a, 0.5, 0.3));
  g.add(PEN.bob);
  const bars = document.createElement('div');
  bars.className = 'hud-card';
  bars.style.cssText = 'position:absolute;top:186px;right:14px;width:250px;z-index:10;';
  bars.innerHTML = `
    <div style="margin-bottom:4px"><b>能量转化</b>（E总 保持不变）</div>
    <div class="bar-row"><span class="bar-label">动能</span><div class="bar-track"><div class="bar-fill" id="pe-ek" style="background:#e2934a"></div></div><span class="bar-val" id="pe-vk">–</span></div>
    <div class="bar-row"><span class="bar-label">势能</span><div class="bar-track"><div class="bar-fill" id="pe-ep" style="background:#4f9d8a"></div></div><span class="bar-val" id="pe-vp">–</span></div>
    <div class="bar-row"><span class="bar-label">总</span><div class="bar-track"><div class="bar-fill" id="pe-et" style="background:#5aa7e8"></div></div><span class="bar-val" id="pe-vt">–</span></div>`;
  stage.appendChild(bars);
  PEN.bars = bars;
}
function stepPend(dt) {
  if (!PEN.playing) return;
  const w0 = Math.sqrt(9.8 / PEN.len);
  PEN.t += dt * w0;
  const th = PEN.ang * Math.PI / 180 * Math.cos(PEN.t);
  const bx = PEN.pivot.x + Math.sin(th) * PEN.len;
  const by = PEN.pivot.y - Math.cos(th) * PEN.len;
  PEN.rod.position.copy(PEN.pivot);
  PEN.rod.scale.y = PEN.len;
  PEN.rod.rotation.z = -th;
  PEN.bob.position.set(bx, by, 0);
  const hRef = PEN.len * (1 - Math.cos(PEN.ang * Math.PI / 180));   // 最高点相对最低点的高
  const elev = (PEN.pivot.y - by) - (PEN.pivot.y - PEN.len);        // 当前相对最低点高度
  const Ep = Math.max(elev, 0) * 9.8;    // 单位质量能量
  const v2 = 2 * 9.8 * Math.max(elev, 0);
  const Ek = 9.8 * hRef - Ep;
  const Emax = 9.8 * hRef;
  const q = (id) => document.getElementById(id);
  if (q('pe-ek') && Emax > 1e-6) {
    q('pe-ek').style.width = (Ek / Emax * 100).toFixed(0) + '%';
    q('pe-ep').style.width = (Ep / Emax * 100).toFixed(0) + '%';
    q('pe-et').style.width = '100%';
    q('pe-vk').textContent = (Ek / Emax * 100).toFixed(0) + '%';
    q('pe-vp').textContent = (Ep / Emax * 100).toFixed(0) + '%';
  }
  hset('ek', (Ek / Emax * 100).toFixed(0) + ' %');
  hset('ep', (Ep / Emax * 100).toFixed(0) + ' %');
  hset('sum', '100 %（守恒）');
  hset('v', 'v=' + Math.sqrt(Math.max(v2, 0)).toFixed(2) + ' m/s（单位质量）');
}
function pendCtl() {
  ctl.clear();
  ctl.slider({ label: '初始摆角', min: 10, max: 70, step: 2, value: PEN.ang, fmt: (v) => v + '°', onInput: (v) => { PEN.ang = v; PEN.t = 0; } });
  ctl.slider({ label: '摆长', min: 1.2, max: 3, step: 0.1, value: PEN.len, fmt: (v) => v.toFixed(1) + ' m', onInput: (v) => { PEN.len = v; PEN.t = 0; } });
  ctl.sep();
  ctl.toggle({ label: '摆动', value: true, onChange: (v) => { PEN.playing = v; } });
  setHUD([['ek', '动能 Ek'], ['ep', '重力势能 Ep'], ['sum', '机械能总和'], ['v', '最低点速率']]);
}

/* ============ 09 动量守恒 ============ */

const COL = { m1: 1, v1: 1.5, m2: 2, v2: -0.5, kind: 'elas', t: -1, done: false };
const COL_E = { elas: 1, partial: 0.5, inel: 0 };   // 恢复系数：弹性 / 一般（橡胶） / 完全非弹性（魔术贴）
function buildCollide(g) {
  buildBench(g, 12);
  buildTrack(g, 10, 1.32);
  COL.c1 = buildCart(g, 0x3f7fd0);
  COL.c2 = buildCart(g, 0xc06838);
  COL.buf = box(0.1, 0.2, 0.24, M(0x8a8f96, 0.5, 0.6));
  COL.c2.add(COL.buf);
  COL.buf.position.x = -0.33;
  COL.lbl1 = lbl('', '#8fc6ff', 0.0045);
  COL.lbl2 = lbl('', '#ffb46e', 0.0045);
  g.add(COL.lbl1, COL.lbl2);
  resetCollide();
}
function resetCollide() {
  COL.t = -1;
  COL.done = false;
  COL.c1.position.set(-4, 1.42, 0);
  COL.c2.position.set(2.2, 1.42, 0);
  updCollide(true);
}
function afterV() {
  const { m1, v1, m2, v2 } = COL;
  const e = COL_E[COL.kind] ?? 1;
  // 一维碰撞通式（含恢复系数 e）：弹性 e=1，一般碰撞 0<e<1，完全非弹性 e=0
  const dv = v1 - v2;
  const u1 = v1 - (1 + e) * m2 * dv / (m1 + m2);
  const u2 = v2 + (1 + e) * m1 * dv / (m1 + m2);
  return [u1, u2];
}
function updCollide(idle = false) {
  const s = COL.kind === 'elas' ? '弹性（弹簧圈，动能也守恒）' : COL.kind === 'partial' ? '一般碰撞（橡胶块，动能有损失）' : '完全非弹性（魔术贴，粘在一起）';
  if (idle) {
    const [u1, u2] = afterV();
    hset('pre', 'p前 = ' + (COL.m1 * COL.v1 + COL.m2 * COL.v2).toFixed(2) + ' kg·m/s');
    hset('post', '碰后 v1′=' + u1.toFixed(2) + '  v2′=' + u2.toFixed(2));
    hset('kind', s);
    hset('law', 'p后 = p前（系统不受外力）');
  }
  setSpriteText(COL.lbl1, 'm=' + COL.m1.toFixed(1) + 'kg', { fontSize: 30, color: '#8fc6ff', scale: 0.0045, bg: 'rgba(12,18,26,0.6)' });
  setSpriteText(COL.lbl2, 'm=' + COL.m2.toFixed(1) + 'kg', { fontSize: 30, color: '#ffb46e', scale: 0.0045, bg: 'rgba(12,18,26,0.6)' });
  COL.lbl1.position.set(COL.c1.position.x, 2.2, 0);
  COL.lbl2.position.set(COL.c2.position.x, 2.2, 0);
}
function stepCollide(dt) {
  if (COL.t < 0) return;
  COL.t += dt;
  const scale = 1.1;
  const [u1, u2] = afterV();
  const x1 = COL.c1.position.x + COL.v1 * scale * dt;
  const x2 = COL.c2.position.x + COL.v2 * scale * dt;
  const half = 0.62;
  if (!COL.done && x2 - x1 <= half) {
    COL.done = true;
    COL.v1n = u1; COL.v2n = u2;
    if (COL.kind === 'inel') {
      COL.c2.position.x = COL.c1.position.x + half;
      hset('post', '共同速度 v′=' + u1.toFixed(2) + ' m/s');
    } else {
      hset('post', '碰后 v1′=' + u1.toFixed(2) + '  v2′=' + u2.toFixed(2));
    }
    const ek0 = 0.5 * COL.m1 * COL.v1 * COL.v1 + 0.5 * COL.m2 * COL.v2 * COL.v2;
    const ek1 = 0.5 * COL.m1 * u1 * u1 + 0.5 * COL.m2 * u2 * u2;
    hset('law', 'p后=' + (COL.m1 * u1 + COL.m2 * u2).toFixed(2) + ' ✓ · E_k损失 ' + ((ek0 - ek1) / ek0 * 100).toFixed(0) + '%');
  }
  if (COL.done) {
    COL.c1.position.x += COL.v1n * scale * dt;
    if (!(COL.kind === 'inel')) COL.c2.position.x += COL.v2n * scale * dt;
    else COL.c2.position.x = COL.c1.position.x + half;
  } else {
    COL.c1.position.x = x1;
    COL.c2.position.x = x2;
  }
  COL.c1.position.x = clamp(COL.c1.position.x, -4.6, 4.6);
  COL.c2.position.x = clamp(COL.c2.position.x, -4.6, 4.6);
  updCollide();
}
function collideCtl() {
  ctl.clear();
  ctl.slider({ label: 'm1', min: 0.5, max: 3, step: 0.1, value: COL.m1, fmt: (v) => v.toFixed(1) + ' kg', onInput: (v) => { COL.m1 = v; updCollide(true); } });
  ctl.slider({ label: 'v1', min: 0.5, max: 3, step: 0.1, value: COL.v1, fmt: (v) => v.toFixed(1) + ' m/s', onInput: (v) => { COL.v1 = v; updCollide(true); } });
  ctl.slider({ label: 'm2', min: 0.5, max: 3, step: 0.1, value: COL.m2, fmt: (v) => v.toFixed(1) + ' kg', onInput: (v) => { COL.m2 = v; updCollide(true); } });
  ctl.slider({ label: 'v2（向左）', min: -2, max: 0, step: 0.1, value: COL.v2, fmt: (v) => v.toFixed(1) + ' m/s', onInput: (v) => { COL.v2 = v; updCollide(true); } });
  ctl.sep();
  const btns = [];
  const paint = () => btns.forEach(({ b, v }) => b.classList.toggle('active', v === COL.kind));
  [['elas', '弹性（弹簧圈）'], ['partial', '一般（橡胶块）'], ['inel', '完全非弹性（魔术贴）']].forEach(([v, t]) => {
    const b = ctl.button({ label: t, onClick: () => { COL.kind = v; updCollide(true); paint(); } });
    btns.push({ b, v });
  });
  paint();
  ctl.button({ label: '▶ 发射', onClick() { resetCollide(); COL.t = 0; } });
  setHUD([['pre', '碰前总动量'], ['post', '碰后'], ['kind', '类型'], ['law', '动量守恒']]);
  updCollide(true);
}

/* ============ 10 自由实验台 ============ */

const FREE = { v: 1.2, m: 0.6, fric: false, t: -1 };
function buildFree(g) {
  buildBench(g, 12);
  buildTrack(g, 10, 1.32);
  FREE.cart = buildCart(g, 0x4f9d5f);
  FREE.g1 = buildGate(g, -1.5, 1.32);
  resetFree();
}
function resetFree() {
  FREE.t = -1;
  FREE.cart.position.set(-4.4, 1.42, 0);
  FREE.vCur = FREE.v;
  hset('x', '–');
  hset('v', '–');
}
function stepFree(dt) {
  if (FREE.t < 0) return;
  FREE.t += dt;
  const aIncline = 9.8 * Math.sin((FREE.th ?? 0) * Math.PI / 180);
  const aFric = FREE.fric ? -0.35 : 0;
  const a = aIncline + aFric;
  FREE.vCur = Math.max(FREE.vCur + a * dt, 0);
  FREE.cart.position.x += FREE.vCur * dt;
  if (!FREE.p1 && FREE.cart.position.x >= -1.5) { FREE.p1 = true; flashGate(FREE.g1); hset('x', FREE.cart.position.x.toFixed(2) + ' m（过门）'); }
  hset('v', FREE.vCur.toFixed(2) + ' m/s');
  hset('a', a.toFixed(2) + ' m/s²');
  if (FREE.cart.position.x > 4.8) FREE.t = -2;
}
function freeCtl() {
  ctl.clear();
  ctl.slider({ label: '初速度', min: 0.3, max: 2.5, step: 0.05, value: FREE.v, fmt: (v) => v.toFixed(2) + ' m/s', onInput: (v) => { FREE.v = v; } });
  ctl.slider({ label: '导轨倾角', min: 0, max: 8, step: 0.5, value: FREE.th ?? 0, fmt: (v) => v.toFixed(1) + '°', onInput: (v) => { FREE.th = v; } });
  ctl.toggle({ label: '开摩擦（减速）', value: false, onChange: (v) => { FREE.fric = v; } });
  ctl.sep();
  ctl.button({ label: '▶ 推出小车', onClick() { resetFree(); FREE.t = 0; FREE.p1 = false; } });
  setHUD([['x', '小车位置'], ['v', '当前速度'], ['a', '加速度'], ['tip', '倾角给小车加 g·sinθ']]);
}

/* ============ HUD ============ */

let hud = null;
function setHUD(rows) {
  if (hud) hud.el.remove();
  hud = makeHUD(stage, rows);
  hud.el.style.cssText = 'position:absolute;top:14px;right:14px;z-index:10;min-width:210px;';
  rows.forEach(([k]) => hud.set(k, '–'));
}
function hset(key, text) { if (hud) hud.set(key, text); }

/* ============ 控制条与章节 ============ */

const ctl = createControlsPanel(document.getElementById('controls'));

const SECTIONS = [
  {
    id: 'tape', title: '纸带与 v-t 图',
    html: `<p>打点计时器每隔 <b>0.02 s</b> 在纸带上打一个点。小车拖动纸带做加速运动时，<b>相邻计数点的间距越来越大</b>。</p>
<p>用刻度尺量出间距，就能算出各点速度，画出 <span class="hl">v–t 图</span>：图线是过原点的直线 → 匀加速直线运动，<b>斜率就是加速度</b>。小车与挂钩一起加速，加速度是 <span class="hl">a = m<sub>钩</sub>g / (M<sub>车</sub> + m<sub>钩</sub>)</span>。</p>
<p>调整挂重与小车质量，点「释放小车」：纸带自动打出计数点，右上角同步画出 v–t 图。</p>`,
    enter() {
      useScene('tape', buildTape);
      app.setCamera([0.5, 3.2, 8.8], [0, 1.6, 0]);
      resetTape();
      tapeCtl();
    },
  },
  {
    id: 'gates', title: '光电门测速度',
    html: `<p>光电门记录挡光片遮光的时间 <b>Δt</b>。挡光片宽度 d 很小时：</p>
<p><span class="hl">v = d / Δt</span> —— 极短时间（极短位移）内的平均速度，就是<b>瞬时速度</b>。这是极限思想的实验体现。</p>
<p>改变挡光片宽度、初速度与门距，点「释放」：加速度为 0 时两只门的读数 v1、v2 相同 → 匀速运动。把「导轨加速度」调大（导轨微倾），v2 > v1，就能用 <span class="hl">a = (v₂² − v₁²) / 2L</span> 算出加速度。</p>`,
    enter() {
      useScene('gates', buildGates);
      app.setCamera([0, 2.8, 8.2], [0, 1.6, 0]);
      resetGates();
      gatesCtl();
    },
  },
  {
    id: 'drop', title: '自由落体',
    html: `<p>只受重力、由静止下落的运动叫<b>自由落体运动</b>：初速为 0 的匀加速直线运动，加速度是重力加速度 g。</p>
<p><span class="hl">h = ½gt²，v = gt</span>。频闪照片上，相邻残影的间距越落越大——和纸带上的计数点一样。</p>
<p>换到月球（g≈1.6）再试：同样的高度，下落时间明显变长——g 只随天体而变，与物体质量无关。</p>`,
    enter() {
      useScene('drop', buildDrop);
      app.setCamera([3.2, 3.4, 7.5], [0.4, 2.6, 0]);
      dropCtl();
    },
  },
  {
    id: 'newton', title: '牛顿第二定律',
    html: `<p>探究 <span class="hl">a = F / m</span> 要<b>控制变量</b>：保持 M 不变改变拉力，或保持拉力不变改变 M。先把导轨左端垫高<b>平衡摩擦力</b>（重力沿斜面的分力抵消摩擦）。</p>
<p>用钩码重力 mg 代替绳的拉力其实有系统误差——实际上 <span class="hl">T = M·m·g / (M + m) &lt; mg</span>，只有 <b>m ≪ M</b> 时才近似相等。钩码越重，T 偏离 mg 越多，a–F 图线会向下弯。关掉「平衡摩擦力」试试：小车可能根本拉不动。</p>
<p>两只光电门测出小车经过时的速度，用 <b>v₂²−v₁² = 2aL</b> 算出实测加速度——与理论值对比。</p>`,
    enter() {
      useScene('newton', buildNewton);
      app.setCamera([0.5, 3.0, 8.6], [0.2, 1.6, 0]);
      resetNewton();
      newtonCtl();
    },
  },
  {
    id: 'fric', title: '滑动摩擦力',
    html: `<p>用弹簧测力计沿水平方向拉物块：刚开始物块不动，示数逐渐增大——这是<b>静摩擦力</b>；示数达到<b>最大静摩擦</b>的瞬间物块被拉动，示数回落并保持稳定，等于<b>滑动摩擦力</b>。</p>
<p><span class="hl">f = μN</span>（N 为压力，水平面上 N=G）。接触面越粗糙 μ 越大；改变拉动速度，滑动摩擦力几乎不变。</p>
<p>点「匀速拉动」完整看一遍「静摩擦爬升 → 最大静摩擦 → 回落恒定」；切换棉布/木板/毛巾接触面，观察恒定示数的变化。</p>`,
    enter() {
      useScene('fric', buildFric);
      app.setCamera([1.5, 2.6, 5.6], [-0.5, 1.3, 0]);
      fricCtl();
    },
  },
  {
    id: 'incline', title: '斜面与力的分解',
    html: `<p>斜面上的物体，重力产生两个效果：<b>沿斜面下滑</b>（G₁ = G·sinθ）和<b>压紧斜面</b>（G₂ = G·cosθ = N）。</p>
<p>倾角较小时，静摩擦力与 G₁ 平衡，物体静止。逐渐增大倾角，当 <span class="hl">G·sinθ &gt; μ·G·cosθ，即 tanθ &gt; μ</span> 时物体开始下滑，下滑加速度 <span class="hl">a = g(sinθ − μcosθ)</span>。注意：<b>临界角只由 μ 决定，与质量无关</b>——加砝码再找一次临界角，角度一个样。</p>
<p>拖动倾角滑杆找临界角，再拖 μ 滑杆看临界角怎么移动——这就是「按效果分解」+ 摩擦条件的合奏。</p>`,
    enter() {
      useScene('incline', buildIncline);
      app.setCamera([1.2, 3.0, 7.0], [-0.8, 1.4, 0]);
      inclineCtl();
    },
  },
  {
    id: 'lift', title: '超重与失重',
    html: `<p>电梯里的台秤示数 N 并不总等于 mg：<b>视重</b>取决于加速度。</p>
<p>向上加速：N = m(g+a) > mg，<b>超重</b>；向下加速：N = m(g−a) < mg，<b>失重</b>；a = g 时完全失重（N=0）。</p>
<p>拖动加速度滑杆（或点上升/下降按钮），看砝码的「体重」怎么变——物体实际重力没变，变的是支持力。</p>`,
    enter() {
      useScene('lift', buildLift);
      app.setCamera([5.2, 4.6, 8.0], [0, 3.4, 0]);
      LIFT.v = 0; LIFT.a = 0; LIFT.y = 2.4;
      liftCtl();
    },
  },
  {
    id: 'pend', title: '机械能守恒',
    html: `<p>单摆摆动中，动能与重力势能相互转化，但<b>总和保持不变</b>（只有重力做功时）：</p>
<p><span class="hl">Ek + Ep = 恒量</span>。最低点势能最小、动能最大；最高点动能为零、势能最大。</p>
<p>右侧能量条实时显示两者的占比。改变摆角与摆长——总和始终是同一条 100% 的横线。</p>`,
    enter() {
      useScene('pend', buildPend);
      app.setCamera([1.6, 3.4, 6.8], [0.6, 2.4, 0]);
      PEN.t = 0; PEN.playing = true;
      pendCtl();
      if (PEN.bars) PEN.bars.style.display = '';
    },
  },
  {
    id: 'collide', title: '动量守恒',
    html: `<p>气垫导轨上两车相碰，系统所受合外力为零，<b>总动量保持不变</b>：</p>
<p><span class="hl">m₁v₁ + m₂v₂ = m₁v₁′ + m₂v₂′</span>。· 装<b>弹簧圈</b>：弹性碰撞，动能也守恒，质量相等时两车交换速度；· 装<b>橡胶块</b>：一般碰撞，动能有损失；· 装<b>魔术贴</b>：碰后粘在一起，完全非弹性碰撞，动能损失最大（变形与发热）。</p>
<p>改变两车质量与速度，点「发射」：碰前碰后的总动量始终相等，动能却只有弹性碰撞守恒。</p>`,
    enter() {
      useScene('collide', buildCollide);
      app.setCamera([0, 3.0, 8.4], [0, 1.6, 0]);
      resetCollide();
      collideCtl();
    },
  },
  {
    id: 'free', title: '自由实验台',
    html: `<p>把导轨留给你：设定初速度，选择有无摩擦，推出小车，看它掠过光电门。</p>
<p>光滑导轨 → 匀速直线（牛顿第一定律：不受力/合外力为零时，运动状态不变）；开摩擦 → 匀减速直到停止。</p>
<p>这就是整节课的落点：<b>力不是维持运动的原因，而是改变运动状态的原因</b>。</p>`,
    enter() {
      useScene('free', buildFree);
      app.setCamera([0, 3.0, 8.4], [0, 1.6, 0]);
      resetFree();
      freeCtl();
    },
  },
];

/* 控制条构造函数（对应各章节） */

function dropCtl() {
  ctl.clear();
  ctl.slider({ label: '下落高度', min: 2, max: 6, step: 0.5, value: DROP.h, fmt: (v) => v.toFixed(1) + ' m', onInput: (v) => { DROP.h = v; resetDrop(); } });
  ctl.sep();
  const obtns = [];
  const paintO = () => obtns.forEach(({ b, v }) => b.classList.toggle('active', v === DROP.obj));
  [['ball', '钢球'], ['pp', '乒乓球'], ['feather', '羽毛']].forEach(([v, t]) => {
    const b = ctl.button({ label: t, onClick: () => { DROP.obj = v; resetDrop(); paintO(); } });
    obtns.push({ b, v });
  });
  paintO();
  ctl.toggle({ label: '牛顿管抽真空', value: false, onChange: (v) => { DROP.vac = v; resetDrop(); } });
  const btns = [];
  const paint = () => btns.forEach(({ b, v }) => b.classList.toggle('active', v === DROP.g));
  [[9.8, '地球 g=9.8'], [3.7, '火星 g=3.7'], [1.6, '月球 g=1.6']].forEach(([v, t]) => {
    const b = ctl.button({ label: t, onClick: () => { DROP.g = v; resetDrop(); paint(); } });
    btns.push({ b, v });
  });
  paint();
  ctl.button({ label: '▶ 释放', onClick() { resetDrop(); DROP.t = 0; DROP.ghostT = 0; } });
  setHUD([['t', '下落时间'], ['v', '落地速度'], ['eq', '公式'], ['tip', '残影为等时频闪']]);
}
function newtonCtl() {
  ctl.clear();
  ctl.slider({ label: '挂重质量 m', min: 0.1, max: 1.2, step: 0.05, value: NEWT.F, fmt: (v) => v.toFixed(2) + ' kg→' + (v * 9.8).toFixed(1) + 'N', onInput: (v) => { NEWT.F = v; } });
  ctl.slider({ label: '小车质量 M', min: 0.2, max: 1.5, step: 0.05, value: NEWT.m, fmt: (v) => v.toFixed(2) + ' kg', onInput: (v) => { NEWT.m = v; } });
  ctl.toggle({ label: '平衡摩擦力', value: NEWT.bal ?? true, onChange: (v) => { NEWT.bal = v; } });
  ctl.sep();
  ctl.button({ label: '▶ 释放', onClick() { NEWT.p0 = NEWT.p1 = false; resetNewton(); NEWT.t = 0; } });
  setHUD([['a', '加速度 a'], ['tension', '绳拉力 T'], ['meas', '光电门实测 a'], ['tip', '对比']]);
  hset('tip', 'm≪M 时 T ≈ mg');
}

/* ============ 帧循环 ============ */

app.onFrame((dt) => {
  cameraTweenTick(app, dt);
  if (!activeScene || !activeScene.visible) return;
  if (activeScene === scenes.tape) stepTape(dt);
  else if (activeScene === scenes.gates) stepGates(dt);
  else if (activeScene === scenes.drop) stepDrop(dt);
  else if (activeScene === scenes.newton) stepNewton(dt);
  else if (activeScene === scenes.fric) {
    if (FRIC.pulling) {
      FRIC.pullT += dt;
      const N = FRIC.G, muS = FRIC.mu * 1.25;   // 最大静摩擦略大于滑动摩擦
      if (FRIC.pullT < 1.4) FRIC.fCur = muS * N * (FRIC.pullT / 1.4);          // 静摩擦爬升
      else if (FRIC.pullT < 1.6) FRIC.fCur = FRIC.mu * N + (muS * N - FRIC.mu * N) * (1.6 - FRIC.pullT) / 0.2;  // 落回滑动摩擦
      else FRIC.fCur = FRIC.mu * N;                                              // 滑动摩擦恒定
      if (FRIC.pullT >= 1.4) { FRIC.x += dt * 0.45; if (FRIC.x > 2.6) { FRIC.x = -2.5; FRIC.pullT = 0; } }
      updFric();
    }
  } else if (activeScene === scenes.lift) {
    if (LIFT.v !== 0) {
      LIFT.y = clamp(LIFT.y + LIFT.v * dt, 0.4, 6.8);
      if (LIFT.y <= 0.4 || LIFT.y >= 6.8) LIFT.v = 0;
      updLift();
    }
  } else if (activeScene === scenes.pend) stepPend(dt);
  else if (activeScene === scenes.collide) stepCollide(dt);
  else if (activeScene === scenes.free) stepFree(dt);
});

/* ============ 启动 ============ */

loadAll([
  { key: 'sky', label: '天空', job: loadTexture('../assets/textures/sky/sky_court-BKHrsJQE.webp') },
  { key: 'wood', label: '台面', job: loadTexture('../assets/textures/pbr/plank_diff-DPUnSb0W.webp', { colorSpace: null, wrap: true }) },
  { key: 'woodN', label: '台面细节', job: loadTexture('../assets/textures/pbr/plank_nor-BoGKkjWD.webp', { colorSpace: null, wrap: true }) },
], (d, t, label) => loader.setText(`正在加载实验台 ${d}/${t}（${label}）`)).then((t) => {
  t.sky.mapping = THREE.EquirectangularReflectionMapping;
  scene.background = t.sky;
  scene.environment = t.sky;
  t.wood.repeat.set(4, 1.2); t.woodN.repeat.set(4, 1.2);
  tableMat = new THREE.MeshStandardMaterial({ map: t.wood, normalMap: t.woodN, color: 0xcbb897, roughness: 0.8 });

  loader.hide();
  const sections = createSections({
    nav: document.getElementById('sideNav'),
    descPanel: document.getElementById('descPanel'),
    sections: SECTIONS,
    onSelect(i, sec) {
      if (TAPE.plot) TAPE.plot.hide(true);
      if (PEN.bars) PEN.bars.style.display = 'none';
      sec.enter();
    },
  });
  window.__eduSections = sections;
  sections.select(0);
}).catch((err) => {
  loader.setText('资源加载失败：' + err.message);
  console.error(err);
});
