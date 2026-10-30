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
  const a = TAPE.F / TAPE.m;                 // m/s²（桌面尺度 1:1）
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
  ctx.fillText('a = ' + (TAPE.F / TAPE.m).toFixed(2) + ' m/s²（斜率）', ox + 8, oy - ph * 0.85);
  hset('fit', 'v–t 是一条过原点的直线 → 匀加速');
}
function tapeCtl() {
  ctl.clear();
  ctl.slider({ label: '挂重质量', min: 0.1, max: 1.2, step: 0.05, value: TAPE.F, fmt: (v) => v.toFixed(2) + ' kg→' + (v * 9.8).toFixed(1) + 'N', onInput: (v) => { TAPE.F = v; } });
  ctl.slider({ label: '小车质量', min: 0.2, max: 1.5, step: 0.05, value: TAPE.m, fmt: (v) => v.toFixed(2) + ' kg', onInput: (v) => { TAPE.m = v; } });
  ctl.sep();
  ctl.button({ label: '▶ 释放小车', onClick() { resetTape(); TAPE.t = 0; } });
  ctl.button({ label: '↺ 复位', onClick() { resetTape(); } });
  setHUD([['a', '加速度 a=F/m'], ['dots', '计数点'], ['fit', '图线判断'], ['tip', '提示']]);
  hset('a', (TAPE.F / TAPE.m).toFixed(2) + ' m/s²');
  hset('dots', '0');
  hset('fit', '释放后自动绘制');
  hset('tip', '相邻计数点间距越来越大');
}

/* ============ 02 光电门测速度 ============ */

const GATE = { v: 0.8, w: 0.05, L: 2.0, t: -1, t1: 0, t2: 0 };
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
  GATE.cart.position.x += GATE.v * dt;
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
      if (i === 0) GATE.v1v = v; else GATE.v2v = v;
      hset('t', 'Δt1=' + (GATE.tt0 * 1000).toFixed(1) + 'ms  Δt2=' + (GATE.tt1 * 1000).toFixed(1) + 'ms');
      hset('v', 'v1=' + (GATE.v1v || 0).toFixed(2) + '  v2=' + (GATE.v2v || 0).toFixed(2) + ' m/s');
    }
  });
  if (x > 5) GATE.t = -2;
}
function gatesCtl() {
  ctl.clear();
  ctl.slider({ label: '初速度', min: 0.2, max: 2.5, step: 0.05, value: GATE.v, fmt: (v) => v.toFixed(2) + ' m/s', onInput: (v) => { GATE.v = v; } });
  ctl.slider({ label: '挡光片宽度', min: 0.02, max: 0.2, step: 0.01, value: GATE.w, fmt: (v) => v.toFixed(2) + ' m', onInput: (v) => { GATE.w = v; updGates(true); } });
  ctl.slider({ label: '两门间距', min: 0.6, max: 4, step: 0.1, value: GATE.L, fmt: (v) => v.toFixed(1) + ' m', onInput: (v) => { GATE.L = v; updGates(true); } });
  ctl.sep();
  ctl.button({ label: '▶ 释放', onClick() { resetGates(); GATE.t = 0; } });
  setHUD([['d', '挡光片宽度 d'], ['L', '门间距'], ['t', '挡光时间'], ['v', '平均速度≈瞬时']]);
  hset('v', '极短时间内的平均速度 = 瞬时速度');
  updGates(true);
}

/* ============ 03 自由落体 ============ */

const DROP = { h: 4.5, g: 9.8, slow: false, t: -1, ghosts: [], ghostT: 0 };
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
  const y = Math.max(DROP.h - 0.5 * g * DROP.t * DROP.t, 0.16);
  DROP.ball.position.y = y;
  // 频闪残影
  DROP.ghostT += dt;
  if (DROP.ghostT > 0.12 && DROP.ghosts.length < 26) {
    DROP.ghostT = 0;
    const gm = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), new THREE.MeshBasicMaterial({ color: 0xd0763a, transparent: true, opacity: 0.25 }));
    gm.position.copy(DROP.ball.position);
    DROP.ghostsGroup.add(gm);
    DROP.ghosts.push(gm);
  }
  const tLand = Math.sqrt(2 * DROP.h / g);
  if (y <= 0.17) {
    DROP.t = -2;
    const v = g * tLand;
    hset('t', tLand.toFixed(2) + ' s');
    hset('v', v.toFixed(1) + ' m/s');
    hset('eq', 'h=½gt² → t=√(2h/g)');
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
  const a = NEWT.F / NEWT.m;
  const x0 = -4.4;
  NEWT.cart.position.x = clamp(x0 + 0.5 * a * NEWT.t * NEWT.t, -4.4, 4.4);
  NEWT.hanger.position.y = clamp(1.72 - (NEWT.cart.position.x - x0) * 0.35, 0.5, 1.72);
  NEWT.rope.set(new THREE.Vector3(5.15, 1.78, 0), new THREE.Vector3(5.15, NEWT.hanger.position.y, 0));
  NEWT.ropeH.set(new THREE.Vector3(NEWT.cart.position.x + 0.1, 1.5, 0), new THREE.Vector3(5.15, 1.78, 0));
  const x = NEWT.cart.position.x;
  [NEWT.g1, NEWT.g2].forEach((gt, i) => {
    const gx = i === 0 ? -0.5 : 2.5;
    if (!NEWT['p' + i] && x >= gx) {
      NEWT['p' + i] = true;
      NEWT['tt' + i] = NEWT.t;
      flashGate(gt);
      if (i === 1) {
        const dtm = NEWT.tt1 - NEWT.tt0;
        const v1 = a * NEWT.tt0, v2 = a * NEWT.tt1;
        const aMeas = (v2 * v2 - v1 * v1) / (2 * 3.0);
        hset('a', a.toFixed(2) + ' m/s²（理论 F/m）');
        hset('meas', aMeas.toFixed(2) + ' m/s²（光电门实测）');
        NEWT.t = -2;
      }
    }
  });
}

/* ============ 05 滑动摩擦力 ============ */

const FRIC = { G: 20, mu: 0.5, pulling: false, x: -2.5 };
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
  const F = mu * Gt;
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
  hset('n', Gt.toFixed(1) + ' N');
  hset('f', F.toFixed(1) + ' N');
  hset('mu', 'μ = F/N = ' + mu.toFixed(2));
  hset('law', 'N 一定：接触面越粗糙，μ 越大');
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
      btn.classList.toggle('active', FRIC.pulling);
      btn.textContent = FRIC.pulling ? '⏸ 停止' : '▶ 匀速拉动';
      updFric();
    },
  });
  setHUD([['n', '压力 N=G'], ['f', '滑动摩擦力'], ['mu', '动摩擦因数'], ['law', '规律']]);
  updFric();
}

/* ============ 06 斜面与力的分解 ============ */

const INC = { ang: 25, G: 30, show: true };
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
  hset('note', INC.ang > 30 ? '倾角大：下滑分力明显' : '倾角小：物体被压得更紧');
}
function inclineCtl() {
  ctl.clear();
  ctl.slider({ label: '倾角 θ', min: 10, max: 45, step: 1, value: INC.ang, fmt: (v) => v + '°', onInput: (v) => { INC.ang = v; updIncline(); } });
  ctl.slider({ label: '物重 G', min: 10, max: 50, step: 1, value: INC.G, fmt: (v) => v + ' N', onInput: (v) => { INC.G = v; updIncline(); } });
  ctl.sep();
  ctl.toggle({ label: '显示两分力', value: true, onChange: (v) => { INC.show = v; updIncline(); } });
  setHUD([['g1', '下滑分力 G1'], ['g2', '垂直分力 G2'], ['th', '倾角'], ['note', '观察']]);
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
  const N = m * (9.8 + LIFT.a);
  LIFT.cab.position.y = LIFT.y;
  const state = idle ? '静止' : Math.abs(LIFT.a) < 0.15 ? '匀速/静止：N = mg' : LIFT.a > 0 ? '向上加速：N > mg（超重）' : '向下加速：N < mg（失重）';
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
  if (COL.kind === 'elas') {
    return [((m1 - m2) * v1 + 2 * m2 * v2) / (m1 + m2), ((m2 - m1) * v2 + 2 * m1 * v1) / (m1 + m2)];
  }
  const v = (m1 * v1 + m2 * v2) / (m1 + m2);
  return [v, v];
}
function updCollide(idle = false) {
  const s = COL.kind === 'elas' ? '弹性（碰后分开）' : '完全非弹性（粘在一起）';
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
      const vc = (COL.m1 * COL.v1 + COL.m2 * COL.v2) / (COL.m1 + COL.m2);
      COL.v1n = COL.v2n = vc;
      COL.c2.position.x = COL.c1.position.x + half;
      hset('post', '共同速度 v′=' + vc.toFixed(2) + ' m/s');
    } else {
      hset('post', '碰后 v1′=' + u1.toFixed(2) + '  v2′=' + u2.toFixed(2));
    }
    hset('law', 'p后 = ' + (COL.m1 * COL.v1n + COL.m2 * COL.v2n).toFixed(2) + ' kg·m/s ✓');
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
  [['elas', '弹性碰撞'], ['inel', '完全非弹性']].forEach(([v, t]) => {
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
  if (FREE.fric) FREE.vCur = Math.max(FREE.vCur - 0.35 * dt, 0);
  FREE.cart.position.x += FREE.vCur * dt;
  if (!FREE.p1 && FREE.cart.position.x >= -1.5) { FREE.p1 = true; flashGate(FREE.g1); hset('x', FREE.cart.position.x.toFixed(2) + ' m（过门）'); }
  hset('v', FREE.vCur.toFixed(2) + ' m/s');
  if (FREE.cart.position.x > 4.8) FREE.t = -2;
}
function freeCtl() {
  ctl.clear();
  ctl.slider({ label: '初速度', min: 0.3, max: 2.5, step: 0.05, value: FREE.v, fmt: (v) => v.toFixed(2) + ' m/s', onInput: (v) => { FREE.v = v; } });
  ctl.toggle({ label: '开摩擦（减速）', value: false, onChange: (v) => { FREE.fric = v; } });
  ctl.sep();
  ctl.button({ label: '▶ 推出小车', onClick() { resetFree(); FREE.t = 0; FREE.p1 = false; } });
  setHUD([['x', '小车位置'], ['v', '当前速度'], ['tip', '自由试'], ['tip2', '改变初速与摩擦观察']]);
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
<p>用刻度尺量出间距，就能算出各点速度，画出 <span class="hl">v–t 图</span>：图线是过原点的直线 → 匀加速直线运动，<b>斜率就是加速度</b>。</p>
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
<p>改变挡光片宽度、初速度与门距，点「释放」：两只门的读数 v1、v2 几乎相同 → 气垫导轨上小车做匀速运动。</p>`,
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
    html: `<p>气垫导轨上，小车被跨过滑轮的细绳牵引，绳的拉力约等于挂钩砝码的重力（挂钩质量远小于小车时）。</p>
<p><span class="hl">a = F / m</span>：力一定，质量加倍则加速度减半；质量一定，力加倍则加速度加倍。</p>
<p>两只光电门测出小车经过时的速度，用 <b>v₂²−v₁² = 2aL</b> 算出实测加速度——与理论值 F/m 对比。</p>`,
    enter() {
      useScene('newton', buildNewton);
      app.setCamera([0.5, 3.0, 8.6], [0.2, 1.6, 0]);
      resetNewton();
      newtonCtl();
    },
  },
  {
    id: 'fric', title: '滑动摩擦力',
    html: `<p>用弹簧测力计沿水平方向<b>匀速</b>拉动物块：拉力与滑动摩擦力平衡，测力计示数 = 摩擦力大小。</p>
<p><span class="hl">f = μN</span>（N 为压力，水平面上 N=G）。接触面越粗糙 μ 越大；与接触面积大小无关。</p>
<p>切换棉布/木板/毛巾接触面，观察示数变化；点「匀速拉动」看物块滑动中示数保持恒定。</p>`,
    enter() {
      useScene('fric', buildFric);
      app.setCamera([1.5, 2.6, 5.6], [-0.5, 1.3, 0]);
      fricCtl();
    },
  },
  {
    id: 'incline', title: '斜面与力的分解',
    html: `<p>斜面上的物体，重力产生两个效果：<b>沿斜面下滑</b>（G₁ = G·sinθ）和<b>压紧斜面</b>（G₂ = G·cosθ）。</p>
<p>倾角 θ 增大：G₁ 变大（更容易下滑），G₂ 变小（压得不紧）。两个分力的矢量和恰好等于重力 G。</p>
<p>拖动倾角滑杆，观察两支分力箭头此消彼长——这就是「按效果分解」。</p>`,
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
<p><span class="hl">m₁v₁ + m₂v₂ = m₁v₁′ + m₂v₂′</span>。弹性碰撞还保持动能不变；完全非弹性碰撞碰后共速，动能损失最大（变形与发热）。</p>
<p>改变两车质量与速度，点「发射」：碰前碰后的总动量始终相等。</p>`,
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
  ctl.slider({ label: '挂重 F', min: 0.1, max: 1.2, step: 0.05, value: NEWT.F, fmt: (v) => v.toFixed(2) + ' kg→' + (v * 9.8).toFixed(1) + 'N', onInput: (v) => { NEWT.F = v; } });
  ctl.slider({ label: '小车质量 m', min: 0.2, max: 1.5, step: 0.05, value: NEWT.m, fmt: (v) => v.toFixed(2) + ' kg', onInput: (v) => { NEWT.m = v; } });
  ctl.sep();
  ctl.button({ label: '▶ 释放', onClick() { NEWT.p0 = NEWT.p1 = false; resetNewton(); NEWT.t = 0; } });
  setHUD([['a', '理论加速度 F/m'], ['meas', '光电门实测 a'], ['tip', '对比'], ['tip2', '两值应一致']]);
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
    if (FRIC.pulling) { FRIC.x += dt * 0.45; if (FRIC.x > 2.6) FRIC.x = -2.5; updFric(); }
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
