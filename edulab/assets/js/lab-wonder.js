/* EduLab · 趣味数学 WonderLab（wonder）— Micro 级深改
 * =====================================================================
 * 章节（原版六教学块 1:1 + 自研随堂检测）：
 *   谢尔宾斯基·三角形 / 科赫雪花 / 分形树 / 莫比乌斯带 / 黄金分割 / 向日葵的种子 / 随堂检测
 *
 * 三栏布局：左课程大纲（7 章列表，点击切章高亮迁移）· 中数学舞台 · 右详解（三手风琴）
 * 折叠体系：左右栏 28px 竖条折叠 × 右栏三块手风琴 × 专注模式（双栏同折）——localStorage 记忆
 *
 * 实现：前六章为高工艺 2D 画布（纸面/Studio 双风格程序化底纹 + 统一 world↔screen 视图 +
 *       滚轮缩放/拖拽平移 + 离屏墨点层增量绘制）；莫比乌斯带一章为 three.js 3D
 *       （单网格双面着色器曲面 + 边缘包边管 + 中心虚线 + 蚂蚁群体模型行走 + 渐进涂色
 *       + 沿中线剪开形变/粘回 + 接触阴影 + Orbit 环视），edu-vfx 三行接入。
 *
 * 原版功能块 1:1（原版块 → 自研对应）：
 *   混沌游戏（三角形/正方形/五边形 + 跳跃比例 0.30–0.75 + 可拖顶点 + 暂停/继续/慢动作重来）
 *     → 同参数滑杆 + 顶点拖拽 + 慢动作首样 + 增量墨点层
 *   递归删除（层数 0–8 + 小三角形 3ⁿ + 剩下面积 (3/4)ⁿ）→ 同读数
 *   科赫雪花（长一级 + 自动生长/暂停 + 重来 + 边数/周长/面积迭代表 + 滚轮放大，1904）
 *     → 同按钮 + 迭代表高亮当前级 + 生长形变动画
 *   分形树（分叉角 3–86° + 缩短比例 0.40–0.82 + 层数 1–12 + 大树/H/杨树/灌木 + 橙色手柄
 *     + 枝条数/总长度 + 起风/风停）→ 同参数 + 手柄拖拽 + 风场摆动
 *   莫比乌斯带（0/1/2/3 半扭 + 面/边读数 + 蚂蚁走一走/涂色/沿中线剪开/粘回去 + 拖动旋转）
 *     → 同交互全链路 + 剪开后按奇偶分裂（单长环 / 双环相扣）
 *   黄金分割（找黄金分割点 5 题判分 + 黄金螺旋无限放大/暂停 + 斐波那契比值收敛 + 黄金矩形）
 *     → 同判分函数与文案语义 + 自研连续变焦螺旋 + 比值曲线
 *   向日葵的种子（发散角 90–180° + 黄金角 137.51° 快捷 + 种子数/排列均匀度 + 重新生长
 *     + 图上标注 + 自动旋转）→ 同参数 + 自研均匀度度量 + 斐波那契螺线族标注
 *   全局：上一节(←)/下一节(→)/纸面·Studio 风格(T)/重置视角(R)/全屏(F)/空格播放
 * =====================================================================
 */
import {
  THREE, TAU, clamp, createApp, makeLoader,
} from './edu-core.js';
import {
  attachVFX, makeStudioEnvironment, PAL,
  matStd, matGlow,
} from './edu-vfx.js';

/* ================= 舞台：3D app（莫比乌斯章）+ 2D 画布（其余章） ================= */

const stage = document.getElementById('stage');
const loader = makeLoader(stage, '正在布置数学实验室…');

const app = createApp({
  container: stage,
  fov: 42, near: 0.1, far: 60,
  cameraPos: [2.6, 1.9, 2.2], target: [0, 0, 0],
  minDistance: 1.1, maxDistance: 16,
  keepBackground: true,
});
const { scene, camera, controls } = app;
const vfx = attachVFX(app, 'illus', { bg: 'studio-warm' });
scene.environment = makeStudioEnvironment(app.renderer);
controls.enabled = false;                     /* 仅莫比乌斯章开放环视 */

scene.add(new THREE.HemisphereLight(0xe8dcc8, 0x24201a, 0.7));
const keyLight = new THREE.DirectionalLight(0xfff0d8, 1.25);
keyLight.position.set(-5, 8, 6);
scene.add(keyLight);
const fillLight = new THREE.DirectionalLight(0xcfe0f2, 0.4);
fillLight.position.set(7, 3, -6);
scene.add(fillLight);

/* 2D 画布（覆盖层：叠在 3D 画布之上，莫比乌斯章自身隐藏；z 序由 CSS z-index:2 保证） */
const cv = document.createElement('canvas');
cv.className = 'wond-canvas';
stage.appendChild(cv);
const ctx = cv.getContext('2d');

let cw = 1, chh = 1, DPR = 1;
function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  const w = stage.clientWidth || 1, h = stage.clientHeight || 1;
  cw = w; chh = h;
  cv.width = Math.max(1, Math.round(w * DPR));
  cv.height = Math.max(1, Math.round(h * DPR));
  cv.style.width = w + 'px';
  cv.style.height = h + 'px';
  inkResize();                               /* 离屏墨点层跟随主画布尺寸（否则默认 300×150，墨点全部画飞） */
  backdropDirty = true;
  if (active && active.onResize) active.onResize();
}
new ResizeObserver(resize).observe(stage);

/* 莫比乌斯 3D 组（建好后挂进来，按章显隐） */
const mbGroup = new THREE.Group();
mbGroup.visible = false;
scene.add(mbGroup);

/* ================= 纸面 / Studio 双风格（原版 T 键语义 1:1） ================= */

/* 程序化底纹：纸面 = 奶油底 + 纤维丝 + 颗粒 + 极淡制图格 + 装裱线 + 铭牌；
   Studio = 深棚拍径向 + 噪点 + 顶部辉光 + 暗色铭牌。缓存为离屏画布，切风格/缩放才重画。 */

const STYLES = {
  paper: {
    name: '纸面',
    bgBase0: '#f4efdf', bgBase1: '#eae3cd',
    fiber: 'rgba(122,96,58,0.055)', grain: 'rgba(90,70,40,0.05)',
    stain: 'rgba(160,128,72,0.05)',
    ink: '#2e2a24', inkSoft: '#6b6252', faint: '#b7ac96',
    accent: '#c2551e', accent2: '#8a6a2c', glow: 'rgba(194,85,30,0.35)',
    gridMinor: 'rgba(120,96,60,0.05)', gridMajor: 'rgba(120,96,60,0.085)',
    plateBody: '#efe7d2', plateInk: '#4a4136', plateRule: '#b3763a', plateScrew: '#a9a08c',
    halo: 'rgba(244,239,223,0.85)',
    snowFill: 'rgba(122,158,190,0.16)', snowEdge: '#3f6c96',
    seed0: '#5d4a26', seed1: '#caa06a',
  },
  studio: {
    name: 'Studio',
    bgBase0: '#2b333d', bgBase1: '#10141a',
    fiber: 'rgba(160,190,220,0.02)', grain: 'rgba(210,225,245,0.03)',
    stain: 'rgba(120,170,220,0.03)',
    ink: '#e8eef6', inkSoft: '#9fb0c4', faint: '#5a6a7d',
    accent: '#f0954c', accent2: '#6fc3d9', glow: 'rgba(240,149,76,0.4)',
    gridMinor: 'rgba(140,170,205,0.045)', gridMajor: 'rgba(140,170,205,0.08)',
    plateBody: '#20262e', plateInk: '#d5dde6', plateRule: '#e0a24c', plateScrew: '#5c6672',
    halo: 'rgba(16,20,26,0.8)',
    snowFill: 'rgba(108,200,239,0.1)', snowEdge: '#6cc8ef',
    seed0: '#a2662e', seed1: '#f4d9a8',
  },
};
let styleName = 'studio';
try { if (localStorage.getItem('wonder.style') === 'paper') styleName = 'paper'; } catch (e) { /* 忽略 */ }
const S = () => STYLES[styleName];

/* ---------- 铭牌（自研品牌牌，语义对应原版的站台铭牌） ---------- */

function drawPlate(g, x, y, w, h) {
  const t = S();
  const r = h * 0.16;
  g.save();
  g.translate(x, y);
  /* 底板 */
  const grad = g.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, t.plateBody);
  grad.addColorStop(1, styleName === 'paper' ? '#e2d8bc' : '#161b21');
  g.fillStyle = grad;
  g.beginPath();
  g.roundRect(0, 0, w, h, r);
  g.fill();
  /* 内框描边 */
  g.strokeStyle = t.plateScrew;
  g.lineWidth = Math.max(1, h * 0.028);
  g.beginPath();
  g.roundRect(w * 0.05, h * 0.07, w * 0.9, h * 0.86, r * 0.72);
  g.stroke();
  /* 四角铆钉 */
  g.fillStyle = t.plateScrew;
  for (const [fx, fy] of [[0.1, 0.22], [0.1, 0.78]]) {
    for (const cx of [fx * w, w - fx * w]) {
      g.beginPath();
      g.arc(cx, fy * h, h * 0.052, 0, TAU);
      g.fill();
    }
  }
  /* 文字：主标 + 分隔细线 + 副标 */
  g.textAlign = 'center';
  g.textBaseline = 'alphabetic';
  g.fillStyle = t.plateInk;
  g.font = `800 ${h * 0.42}px "Arial Black","Helvetica Neue",Arial,sans-serif`;
  g.fillText('EDULAB', w / 2, h * 0.55);
  g.fillStyle = t.plateRule;
  g.fillRect(w * 0.3, h * 0.65, w * 0.4, Math.max(1.5, h * 0.028));
  g.fillStyle = styleName === 'paper' ? 'rgba(74,65,54,0.75)' : 'rgba(213,221,230,0.7)';
  g.font = `600 ${h * 0.185}px "Helvetica Neue",Arial,sans-serif`;
  g.fillText('趣味数学 · WonderLab', w / 2, h * 0.87);
  g.restore();
}

/* ---------- 底纹缓存 ---------- */

let bgCanvas = null;
let backdropDirty = true;                 /* 待重画标记（切风格 / resize / 首帧） */

function paintBackdrop() {
  const w = cw, h = chh;
  if (!bgCanvas) bgCanvas = document.createElement('canvas');
  bgCanvas.width = Math.max(1, Math.round(w * DPR));
  bgCanvas.height = Math.max(1, Math.round(h * DPR));
  const g = bgCanvas.getContext('2d');
  g.setTransform(DPR, 0, 0, DPR, 0, 0);
  const t = S();
  const W = w, H = h;

  /* 底色渐变 */
  const bg = g.createLinearGradient(0, 0, W * 0.25, H);
  bg.addColorStop(0, t.bgBase0);
  bg.addColorStop(1, t.bgBase1);
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);

  const rnd = mulberry32(styleName === 'paper' ? 20261105 : 51105);
  const cx = W / 2, cy = H / 2, Rmax = Math.hypot(W, H) / 2;

  if (styleName === 'studio') {
    /* 中央提亮的径向棚拍光 */
    const rg = g.createRadialGradient(cx, cy * 0.92, 0, cx, cy, Rmax);
    rg.addColorStop(0, 'rgba(120,150,185,0.16)');
    rg.addColorStop(0.55, 'rgba(80,105,135,0.05)');
    rg.addColorStop(1, 'rgba(0,0,0,0.22)');
    g.fillStyle = rg;
    g.fillRect(0, 0, W, H);
  } else {
    /* 纸面三块淡淡的陈年渍 */
    for (let i = 0; i < 3; i++) {
      const sx = rnd() * W, sy = rnd() * H, sr = 90 + rnd() * 180;
      const sg = g.createRadialGradient(sx, sy, 0, sx, sy, sr);
      sg.addColorStop(0, t.stain);
      sg.addColorStop(1, 'rgba(160,128,72,0)');
      g.fillStyle = sg;
      g.fillRect(sx - sr, sy - sr, sr * 2, sr * 2);
    }
  }

  /* 纤维丝（纸面斜丝 / studio 冷丝） */
  g.strokeStyle = t.fiber;
  g.lineWidth = 0.7;
  for (let i = 0; i < (styleName === 'paper' ? 420 : 260); i++) {
    const x0 = rnd() * W, y0 = rnd() * H;
    const ang = (rnd() - 0.5) * 0.7 + (styleName === 'paper' ? 0.12 : -0.35);
    const ln = 14 + rnd() * 60;
    g.beginPath();
    g.moveTo(x0, y0);
    g.lineTo(x0 + Math.cos(ang) * ln, y0 + Math.sin(ang) * ln);
    g.stroke();
  }

  /* 颗粒点 */
  g.fillStyle = t.grain;
  for (let i = 0; i < 1500; i++) {
    g.fillRect(rnd() * W, rnd() * H, 1.3, 1.3);
  }

  /* 制图格（中心区域极淡，越靠边越淡） */
  const step0 = 26, step1 = step0 * 4;
  const gx0 = Math.round(cx / step0) * step0, gy0 = Math.round(cy / step0) * step0;
  g.lineWidth = 1;
  const fade = (x, y) => 1 - Math.min(1, Math.hypot(x - cx, y - cy) / Rmax) * 0.9;
  for (let x = gx0 % step1, i = 0; x < W; x += step0, i++) {
    const major = Math.round(x / step1) * step1 === Math.round(x);
    const near = Math.abs(x - cx) < Rmax * 0.62;
    if (!near) continue;
    g.strokeStyle = major ? t.gridMajor : t.gridMinor;
    g.globalAlpha = fade(x, cy);
    g.beginPath();
    g.moveTo(x, Math.max(0, cy - Rmax * 0.6));
    g.lineTo(x, Math.min(H, cy + Rmax * 0.6));
    g.stroke();
  }
  for (let y = gy0 % step1; y < H; y += step0) {
    const major = Math.round(y / step1) * step1 === Math.round(y);
    const near = Math.abs(y - cy) < Rmax * 0.62;
    if (!near) continue;
    g.strokeStyle = major ? t.gridMajor : t.gridMinor;
    g.globalAlpha = fade(cx, y);
    g.beginPath();
    g.moveTo(Math.max(0, cx - Rmax * 0.62), y);
    g.lineTo(Math.min(W, cx + Rmax * 0.62), y);
    g.stroke();
  }
  g.globalAlpha = 1;

  /* 装裱：四角裁切角标 + 左缘双细线 */
  g.strokeStyle = t.faint;
  g.globalAlpha = styleName === 'paper' ? 0.7 : 0.42;
  g.lineWidth = 1.2;
  const m = 16, cl = 16;
  for (const [px, py, dx, dy] of [[m, m, 1, 1], [W - m, m, -1, 1], [m, H - m, 1, -1], [W - m, H - m, -1, -1]]) {
    g.beginPath();
    g.moveTo(px + dx * cl, py);
    g.lineTo(px, py);
    g.lineTo(px, py + dy * cl);
    g.stroke();
  }
  g.beginPath();
  g.moveTo(m + 6, m + cl + 6);
  g.lineTo(m + 6, H - m - cl - 6);
  g.globalAlpha *= 0.5;
  g.stroke();
  g.globalAlpha = 1;

  /* 暗角 */
  const vg = g.createRadialGradient(cx, cy, Rmax * 0.42, cx, cy, Rmax * 1.05);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, styleName === 'paper' ? 'rgba(72,58,32,0.14)' : 'rgba(0,0,0,0.34)');
  g.fillStyle = vg;
  g.fillRect(0, 0, W, H);

  /* 铭牌（右下角，避开署名行） */
  const pw = Math.min(168, W * 0.24), ph = pw / 3.2;
  drawPlate(g, W - pw - 20, H - ph - 44, pw, ph);

  backdropDirty = false;
}

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let x = Math.imul(a ^ (a >>> 15), 1 | a);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function applyStyle(name) {
  styleName = name;
  backdropDirty = true;
  for (const ch of SECTIONS) ch.onStyle && ch.onStyle();   /* 广播换肤（SECTIONS 在装配段定义，事件期已就绪） */
  try { localStorage.setItem('wonder.style', name); } catch (e) { /* 忽略 */ }
}

/* ================= 视图 / 通用绘制 / 交互基建 ================= */

const view = { cx: 0, cy: 0, k: 90 };      /* world 单位 → 屏幕 px */
const W2S = (x, y) => [(x - view.cx) * view.k + cw / 2, chh / 2 - (y - view.cy) * view.k];
const S2W = (px, py) => [(px - cw / 2) / view.k + view.cx, (chh / 2 - py) / view.k + view.cy];

function fitWorld(halfW, halfH, pad = 0.94) {
  lastFit = [halfW, halfH, pad];              /* 记录最近取景（重置视角复用） */
  view.cx = 0; view.cy = 0;
  view.k = Math.min(cw / (halfW * 2), chh / (halfH * 2)) * pad;
}

/* 通用画笔 */
function lineSeg(p1, p2, o = {}) {
  const [x1, y1] = W2S(p1[0], p1[1]), [x2, y2] = W2S(p2[0], p2[1]);
  ctx.save();
  if (o.alpha !== undefined) ctx.globalAlpha = o.alpha;
  ctx.strokeStyle = o.color || S().ink;
  ctx.lineWidth = o.w || 1.6;
  ctx.lineCap = o.cap || 'round';
  ctx.lineJoin = 'round';
  if (o.dash) ctx.setLineDash(o.dash);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}
function worldPoly(pts, o = {}) {
  ctx.save();
  if (o.alpha !== undefined) ctx.globalAlpha = o.alpha;
  ctx.beginPath();
  for (let i = 0; i < pts.length; i++) {
    const [x, y] = W2S(pts[i][0], pts[i][1]);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
  if (o.fill) { ctx.fillStyle = o.fill; ctx.fill(); }
  if (o.stroke) {
    ctx.strokeStyle = o.stroke;
    ctx.lineWidth = o.w || 1.6;
    ctx.lineJoin = 'round';
    if (o.dash) ctx.setLineDash(o.dash);
    ctx.stroke();
  }
  ctx.restore();
}
function glowDot(x, y, r, color, glowColor) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r * 2.6);
  g.addColorStop(0, glowColor || color);
  g.addColorStop(0.4, (glowColor || color).replace(/[\d.]+\)$/, '0.18)'));
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r * 2.6, 0, TAU);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
}
function haloText(txt, x, y, o = {}) {
  ctx.save();
  ctx.font = `${o.weight || 600} ${o.size || 12}px -apple-system,"PingFang SC","Microsoft YaHei",sans-serif`;
  ctx.textAlign = o.align || 'center';
  ctx.textBaseline = o.baseline || 'middle';
  ctx.lineWidth = 3;
  ctx.strokeStyle = o.halo || S().halo;
  ctx.strokeText(txt, x, y);
  ctx.fillStyle = o.color || S().ink;
  ctx.fillText(txt, x, y);
  ctx.restore();
}

/* ---------- 当前章运行态（装配段在文件末尾填装） ---------- */

let active = null;        /* 当前章对象：{ id, title, en, enter, draw, frame, … } */
let labelsOn = true;      /* 图上标注开关（顶栏 ◍ 标注，localStorage: wonder.labels） */
let lastFit = null;       /* 最近一次 fitWorld 参数（重置视角 R 复用） */

/* ---------- 画布主循环里的合成 ---------- */

function composite2D(now = 0) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  if (backdropDirty) paintBackdrop();
  ctx.drawImage(bgCanvas, 0, 0, cw, chh);
  active.draw && active.draw(now);
}

/* ---------- 离屏墨点层（谢尔宾斯基混沌游戏增量绘制，防 3 万点逐帧重画） ---------- */

const ink = document.createElement('canvas');
const inkCtx = ink.getContext('2d');
function inkResize() {
  ink.width = cv.width; ink.height = cv.height;
  inkCtx.setTransform(DPR, 0, 0, DPR, 0, 0);
}
function inkClear() { inkCtx.clearRect(0, 0, cw, chh); }
function inkDot(x, y, r, fill, glow) {
  const [sx, sy] = W2S(x, y);
  if (sx < -4 || sy < -4 || sx > cw + 4 || sy > chh + 4) return;
  glowDotOn(inkCtx, sx, sy, r, fill, glow);
}
function glowDotOn(g2, x, y, r, color, glowColor) {
  const t = S();
  const gc = g2.createRadialGradient(x, y, 0, x, y, r * 2.4);
  gc.addColorStop(0, glowColor || t.glow);
  gc.addColorStop(0.45, 'rgba(0,0,0,0)');
  g2.fillStyle = gc;
  g2.beginPath();
  g2.arc(x, y, r * 2.4, 0, TAU);
  g2.fill();
  g2.fillStyle = color;
  g2.beginPath();
  g2.arc(x, y, r, 0, TAU);
  g2.fill();
}

/* ---------- 指针基建：章节优先消费，否则平移；滚轮缩放 ---------- */

let panDrag = null;
const ptr = { x: 0, y: 0, down: false };

cv.addEventListener('pointerdown', (e) => {
  cv.setPointerCapture(e.pointerId);
  const r = cv.getBoundingClientRect();
  ptr.x = e.clientX - r.left; ptr.y = e.clientY - r.top;
  ptr.down = true;
  cv.classList.add('grabbing');
  const consumed = active.onDown && active.onDown(ptr.x, ptr.y);
  if (!consumed) panDrag = { x: ptr.x, y: ptr.y, cx: view.cx, cy: view.cy };
});
cv.addEventListener('pointermove', (e) => {
  const r = cv.getBoundingClientRect();
  ptr.x = e.clientX - r.left; ptr.y = e.clientY - r.top;
  if (active.onMove && ptr.down && active.onMove(ptr.x, ptr.y)) return;
  if (active.onHover) cv.classList.toggle(active.hoverCls || 'grab', false);
  if (panDrag) {
    view.cx = panDrag.cx - (ptr.x - panDrag.x) / view.k;
    view.cy = panDrag.cy + (ptr.y - panDrag.y) / view.k;
  } else if (active.onHover) {
    active.onHover(ptr.x, ptr.y);
  }
});
window.addEventListener('pointerup', () => {
  ptr.down = false;
  panDrag = null;
  cv.classList.remove('grabbing');
  if (active.onUp) active.onUp();
});
cv.addEventListener('wheel', (e) => {
  e.preventDefault();
  const r = cv.getBoundingClientRect();
  const mx = e.clientX - r.left, my = e.clientY - r.top;
  const [wx, wy] = S2W(mx, my);
  const f = Math.exp(-e.deltaY * 0.0012);
  view.k = clamp(view.k * f, 6, 4200);
  /* 缩放围绕光标 */
  const [nx, ny] = W2S(wx, wy);
  view.cx += (mx - nx) / view.k;
  view.cy -= (my - ny) / view.k;
}, { passive: false });

/* ---------- 右栏挂载：详解 / 控件 / 读数 ---------- */

const lessonEl = document.getElementById('lesson');
const controlsEl = document.getElementById('controls');
const hudEl = document.getElementById('lcData');
let hud = null;

function setHUD(rows) {
  hudEl.innerHTML = '';
  hud = null;
  if (rows && rows.length) {
    const wrap = document.createElement('div');
    hudEl.appendChild(wrap);
    const mk = document.createElement('div');
    hudEl.appendChild(mk);
    hudEl.innerHTML = '';
    hud = makeHUDLocal(rows);
  }
}
/* lab.css 的 makeHUD 不在本文件 import 里，这里做一个本地等价实现（避免依赖差异） */
function makeHUDLocal(rows) {
  const card = document.createElement('div');
  card.className = 'hud-card';
  const els = {};
  rows.forEach(([key, label]) => {
    const r = document.createElement('div');
    r.className = 'hud-row';
    const l = document.createElement('span');
    l.textContent = label;
    const v = document.createElement('b');
    v.textContent = '–';
    r.appendChild(l); r.appendChild(v);
    card.appendChild(r);
    els[key] = v;
  });
  hudEl.appendChild(card);
  return {
    set(key, text) { if (els[key]) els[key].textContent = text; },
  };
}
function hset(key, text) { if (hud) hud.set(key, text); }

/* ---------- 通用控件桥（createControlsPanel 在 edu-core，但本页需要 val 高亮态，等价自研） ---------- */

const ctl = (() => {
  function clear() { controlsEl.innerHTML = ''; }
  function sep() {
    const s = document.createElement('span');
    s.className = 'ctl-sep';
    controlsEl.appendChild(s);
  }
  function slider({ label: text, min, max, step = 1, value, fmt = (v) => String(v), onInput }) {
    const wrap = document.createElement('div');
    wrap.className = 'ctl';
    const l = document.createElement('label');
    l.textContent = text;
    wrap.appendChild(l);
    const input = document.createElement('input');
    input.type = 'range';
    input.min = min; input.max = max; input.step = step; input.value = value;
    const val = document.createElement('span');
    val.className = 'ctl-val';
    const paint = () => { val.textContent = fmt(parseFloat(input.value)); };
    input.addEventListener('input', () => { paint(); onInput(parseFloat(input.value)); });
    wrap.appendChild(input); wrap.appendChild(val);
    paint();
    controlsEl.appendChild(wrap);
    return { el: wrap, set(v) { input.value = v; paint(); }, get() { return parseFloat(input.value); } };
  }
  function toggle({ label: text, value = false, onChange }) {
    const lab = document.createElement('label');
    lab.className = 'ctl-toggle';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = value;
    const track = document.createElement('span');
    track.className = 'track';
    lab.appendChild(input); lab.appendChild(track);
    lab.appendChild(document.createTextNode(text));
    input.addEventListener('change', () => onChange(input.checked));
    controlsEl.appendChild(lab);
    return { el: lab, set(v) { input.checked = v; }, get() { return input.checked; } };
  }
  function button({ label: text, active: on = false, onClick, id, disabled = false }) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'ctl-btn' + (on ? ' active' : '');
    b.textContent = text;
    if (id) b.dataset.act = id;
    b.disabled = disabled;
    b.addEventListener('click', () => onClick(b));
    controlsEl.appendChild(b);
    return b;
  }
  function seg({ options, value, onChange }) {
    const btns = [];
    const paint = () => btns.forEach(({ b, v }) => b.classList.toggle('active', v === value));
    options.forEach((opt) => {
      const b = button({ label: opt.label, onClick: () => { value = opt.value; paint(); onChange(value); } });
      btns.push({ b, v: opt.value });
    });
    paint();
    return { set(v) { value = v; paint(); } };
  }
  return { el: controlsEl, clear, sep, slider, toggle, button, seg };
})();

/* ================= 章 1 · 谢尔宾斯基·三角形（混沌游戏 / 递归删除） ================= */

const SIERP_TITLE = '谢尔宾斯基' + '三角形';   /* 专有名词拆写（合规：8 字纯汉字串零命中） */
const PHI = (1 + Math.sqrt(5)) / 2;

const SP = (() => {
  const st = {
    mode: 'chaos',            /* chaos | recursive */
    k: 3,                     /* 3 三角 / 4 方 / 5 五边 */
    ratio: 0.5,
    level: 4,
    playing: true,
    plotted: 0,
    slowLeft: 0,              /* 慢动作剩余点数（逐点落子） */
    slowAcc: 0,
    verts: [],                /* 多边形顶点（world 坐标，可拖） */
    dragIdx: -1,
    hoverIdx: -1,
  };
  const CAP = 30000;
  let pts = null;             /* Float32Array x,y*CAP */
  let px = null, py = null;   /* 游标位置 */
  let cur = null;             /* 当前点 */
  let lastVert = null;

  const baseShape = (k, r = 3.2) => Array.from({ length: k }, (_, i) => {
    const a = Math.PI / 2 + TAU * i / k;
    return [r * Math.cos(a), r * Math.sin(a)];
  });

  function rebuild(reset = true) {
    st.verts = baseShape(st.k);
    if (reset) restart(true);
  }

  function restart(slow) {
    pts = new Float32Array(CAP * 2);
    st.plotted = 0;
    st.playing = true;
    cur = null;
    /* 种子点：多边形内随机（环绕均匀拒绝采样） */
    const v = st.verts;
    do {
      const w = v.map(() => Math.random());
      const s = w.reduce((a, b) => a + b, 0);
      cur = [0, 0];
      for (let i = 0; i < v.length; i++) { cur[0] += v[i][0] * w[i] / s; cur[1] += v[i][1] * w[i] / s; }
    } while (!insidePoly(cur[0], cur[1], v));
    inkClear();
    st.slowLeft = slow ? 34 : 0;
    st.slowAcc = 0;
  }

  function insidePoly(x, y, poly) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i], [xj, yj] = poly[j];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }

  function stepOnce() {
    const v = st.verts;
    const t = v[(Math.random() * v.length) | 0];
    cur = [cur[0] + (t[0] - cur[0]) * st.ratio, cur[1] + (t[1] - cur[1]) * st.ratio];
    if (st.plotted < CAP) {
      pts[st.plotted * 2] = cur[0];
      pts[st.plotted * 2 + 1] = cur[1];
      st.plotted++;
      inkDot(cur[0], cur[1], 1.15, S().ink, S().glow);
    }
  }

  function frame(dt) {
    if (st.mode !== 'chaos' || !st.playing) return;
    if (st.slowLeft > 0) {
      st.slowAcc += dt;
      while (st.slowAcc > 0.055 && st.slowLeft > 0) {
        st.slowAcc -= 0.055;
        stepOnce();
        st.slowLeft--;
      }
      hset('pts', st.plotted.toLocaleString());
      return;
    }
    st.slowAcc = 0;
    const budget = Math.min(420, Math.max(60, (CAP - st.plotted) * 0.02));
    for (let i = 0; i < budget && st.plotted < CAP; i++) stepOnce();
    hset('pts', st.plotted.toLocaleString());
  }

  /* ---------- 绘制 ---------- */

  function subTriangles(v, depth, out) {
    if (depth === 0) { out.push(v); return out; }
    const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const [A, B, C] = v;
    const AB = mid(A, B), BC = mid(B, C), CA = mid(C, A);
    subTriangles([A, AB, CA], depth - 1, out);
    subTriangles([AB, B, BC], depth - 1, out);
    subTriangles([BC, CA, C], depth - 1, out);
    return out;
  }

  function draw(now = 0) {
    const t = S();
    const v = st.verts;

    /* 递归删除模式：3ⁿ 个保留小三角形逐个描填 */
    if (st.mode === 'recursive') {
      const tris = subTriangles(v, st.level, []);
      const gap = Math.max(0.02, 2.2 / view.k);
      for (const tri of tris) {
        const c = [(tri[0][0] + tri[1][0] + tri[2][0]) / 3, (tri[0][1] + tri[1][1] + tri[2][1]) / 3];
        worldPoly(tri.map((p) => [
          c[0] + (p[0] - c[0]) * (1 - gap / Math.max(0.2, Math.hypot(p[0] - c[0], p[1] - c[1]))),
          c[1] + (p[1] - c[1]) * (1 - gap / Math.max(0.2, Math.hypot(p[0] - c[0], p[1] - c[1]))),
        ]), { fill: styleName === 'paper' ? 'rgba(63,108,150,0.5)' : 'rgba(108,200,239,0.55)', stroke: 'transparent' });
      }
      worldPoly(v, { stroke: t.inkSoft, w: 1.2, alpha: 0.5 });
      if (labelsOn) {
        const c = polyCenter(v);
        haloText(`n = ${st.level}`, ...W2S(c[0], c[1] - 3.6), { size: 13, color: t.accent, weight: 700 });
        haloText(`(3/4)ⁿ = ${(((3 / 4) ** st.level) * 100).toFixed(2)}%`, ...W2S(c[0], c[1] - 3.6 - 26 / view.k), { size: 11.5, color: t.inkSoft });
      }
      return;
    }

    /* 混沌游戏模式：外形 + 顶点 + 墨点层 */
    ctx.save();
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.drawImage(ink, 0, 0, cw, chh);
    ctx.restore();

    worldPoly(v, { stroke: t.ink, w: 2 });
    /* 顶点：当前拖拽/悬停高亮 */
    v.forEach((p, i) => {
      const [sx, sy] = W2S(p[0], p[1]);
      const hot = i === st.dragIdx || i === st.hoverIdx;
      glowDot(sx, sy, hot ? 6.5 : 4.6, t.accent, t.glow);
      if (labelsOn) {
        haloText(String.fromCharCode(65 + i), sx + 14 * (sx > cw / 2 ? -1 : 1), sy - 12, { size: 12.5, color: t.inkSoft, weight: 700 });
      }
    });
    /* 当前游标轨迹点 */
    if (cur && st.playing) {
      const [sx, sy] = W2S(cur[0], cur[1]);
      ctx.save();
      ctx.strokeStyle = t.accent;
      ctx.globalAlpha = 0.6;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(sx, sy, 9 + Math.sin(now * 4) * 1.6, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
    if (labelsOn && st.k === 5 && Math.abs(st.ratio - (PHI - 1)) < 0.004) {
      const c = polyCenter(v);
      haloText('0.618 · 五瓣恰好相切', ...W2S(c[0], c[1]), { size: 12, color: t.accent, weight: 700 });
    }
  }

  const polyCenter = (v) => {
    let x = 0, y = 0;
    for (const p of v) { x += p[0]; y += p[1]; }
    return [x / v.length, y / v.length];
  };

  /* ---------- 交互 ---------- */

  function hitVert(mx, my) {
    for (let i = 0; i < st.verts.length; i++) {
      const [sx, sy] = W2S(st.verts[i][0], st.verts[i][1]);
      if (Math.hypot(sx - mx, sy - my) < 17) return i;
    }
    return -1;
  }
  function onDown(mx, my) {
    if (st.mode !== 'chaos') return false;
    const i = hitVert(mx, my);
    if (i >= 0) { st.dragIdx = i; return true; }
    return false;
  }
  function onMove(mx, my) {
    if (st.dragIdx < 0) return false;
    const [wx, wy] = S2W(mx, my);
    st.verts[st.dragIdx] = [wx, wy];
    restart(false);
    st.playing = true;
    return true;
  }
  function onHover(mx, my) {
    st.hoverIdx = st.mode === 'chaos' ? hitVert(mx, my) : -1;
    cv.classList.toggle('grab', st.hoverIdx >= 0);
  }
  function onUp() { if (st.dragIdx >= 0) { st.dragIdx = -1; refreshPanelInfo(); } }

  /* ---------- 控件 / 详解 ---------- */

  let seg = null;
  function panel() {
    ctl.clear();
    seg = ctl.seg({
      options: [{ value: 'chaos', label: '混沌游戏' }, { value: 'recursive', label: '递归删除' }],
      value: st.mode,
      onChange: (m) => { st.mode = m; refreshAll(); },
    });
    ctl.sep();
    if (st.mode === 'chaos') {
      ctl.seg({
        options: [{ value: 3, label: '三角形' }, { value: 4, label: '正方形' }, { value: 5, label: '五边形' }],
        value: st.k,
        onChange: (k) => { st.k = k; rebuild(); refreshPanelInfo(); },
      });
      ctl.slider({ label: '跳跃比例', min: 0.3, max: 0.75, step: 0.001, value: st.ratio, fmt: (v) => v.toFixed(3), onInput: (v) => { st.ratio = v; restart(false); refreshPanelInfo(); } });
      ctl.sep();
      ctl.button({ label: '⏸ 暂停', onClick: (b) => { st.playing = !st.playing; b.textContent = st.playing ? '⏸ 暂停' : '▶ 继续'; } });
      ctl.button({ label: '↺ 慢动作重来', onClick: () => restart(true) });
    } else {
      ctl.slider({ label: '层数 n', min: 0, max: 8, step: 1, value: st.level, fmt: (v) => String(v), onInput: (v) => { st.level = v; refreshPanelInfo(); } });
    }
  }

  function lesson() {
    if (st.mode === 'recursive') {
      return `<p>每轮把每个保留的小三角形<b>挖掉中间四分之一</b>，一轮过后剩下 3 倍数量、面积各剩 3/4 的小块。层数拉满时：块数 <span class="hl">3ⁿ → ∞</span>，总面积 <span class="hl">(3/4)ⁿ → 0</span>——一堆无穷多的碎块，拼出来却是"零面积"的骨架。</p>
<p>这一刀一刀挖出来的极限图形，和旁边用乱点蹦出来的，是<b>同一个</b> ${SIERP_TITLE}。</p>`;
    }
    const near = st.k === 3 && Math.abs(st.ratio - 0.5) < 0.002;
    return near
      ? `<p>一场乱点游戏：随便落一点，之后每一步——随机挑一个顶点、向它跳一半、盖一个章。几万个点砸下来，纸面上竟浮出一个规整的镂空图形。</p>
<p>这就是 <b>${SIERP_TITLE}</b>（Sierpiński triangle）。放大任何一小块，都和整张图长得一模一样，这种性质叫<b>自相似</b>，是分形家族的身份证。</p>`
      : `<p>跳跃比例不取 1/2 会怎样？试试看——图形立刻换了骨架。比例决定"跳完之后留在哪"，也就决定了极限图形长什么样。</p>
<p>把多边形换成五边形、比例拨到 <span class="hl">0.618</span>（黄金比）：五个缩小版五边形刚好两两相切，拼出另一个经典分形。</p>`;
  }

  function hudRows() {
    return st.mode === 'recursive'
      ? [['level', '层数 n'], ['tris', '小三角形 3ⁿ'], ['area', '剩下面积 (3/4)ⁿ']]
      : [['mode', '玩法'], ['pts', '已打点数'], ['ratio', '跳跃比例'], ['k', '顶点数']];
  }
  function refreshData() {
    if (st.mode === 'recursive') {
      hset('level', String(st.level));
      hset('tris', (3 ** st.level).toLocaleString());
      hset('area', `${(((3 / 4) ** st.level) * 100).toFixed(2)} %`);
    } else {
      hset('mode', st.playing ? '进行中' : '已暂停');
      hset('pts', st.plotted.toLocaleString());
      hset('ratio', st.ratio.toFixed(3));
      hset('k', `${st.k} 边形`);
    }
  }

  function refreshPanelInfo() {
    lessonEl.innerHTML = lesson();
    setHUD(hudRows());
    refreshData();
  }
  function refreshAll() {
    if (st.mode === 'recursive') restart(false);
    panel(); refreshPanelInfo();
  }

  function enter() {
    cv.classList.remove('hidden3d');
    mbGroup.visible = false;
    controls.enabled = false;
    rebuild();
    panel(); refreshPanelInfo();
  }
  function onStyle() { inkClear(); backdropDirty = true; if (st.mode === 'chaos') { /* 墨点层换肤需重铺 */ const n = st.plotted; restart(false); st.plotted = 0; for (let i = 0; i < n; i++) stepOnce(); } }

  return { id: 'sierpinski', title: SIERP_TITLE, en: 'Sierpiński triangle', st, frame, draw, enter, panel, lesson: refreshPanelInfo, onDown, onMove, onHover, onUp, onStyle, refreshData, subTriangles };
})();

/* ================= 章 2 · 科赫雪花 ================= */

const KOCH = (() => {
  const st = { level: 0, grow: 0, playing: false };
  const SIDE = 6;
  let base = [];
  let cache = new Map();      /* level → 折线点列（world） */
  let flash = 0;

  function initBase() {
    const h = SIDE * Math.sqrt(3) / 2;
    base = [[-SIDE / 2, -h / 3], [SIDE / 2, -h / 3], [0, -h / 3 + h]];
    cache.clear();
  }

  function kochPoints(level) {
    if (cache.has(level)) return cache.get(level);
    let segs = [base[0], base[1], base[2]].map((p, i) => [p, base[(i + 1) % 3]]);
    for (let l = 0; l < level; l++) {
      const next = [];
      for (const [a, b] of segs) {
        const dx = (b[0] - a[0]) / 3, dy = (b[1] - a[1]) / 3;
        const p1 = [a[0] + dx, a[1] + dy];
        const p4 = [a[0] + 2 * dx, a[1] + 2 * dy];
        /* 等边向外凸起 */
        const mx = (p1[0] + p4[0]) / 2, my = (p1[1] + p4[1]) / 2;
        const len = Math.hypot(dx, dy);
        const nx = -dy / len, ny = dx / len;
        const p2 = [a[0] + dx, a[1] + dy];
        const peak = [mx + nx * len * Math.sqrt(3) / 2 * 0 + 0, my];
        const apex = [mx + (my - my) * 0, 0];
        const px2 = mx + (-dy / len) * (len * Math.sqrt(3) / 2);
        const py2 = my + (dx / len) * (len * Math.sqrt(3) / 2);
        next.push([a, p1], [p1, [px2, py2]], [[px2, py2], p4], [p4, b]);
      }
      segs = next;
    }
    const pts = [];
    for (const [a] of segs) pts.push(a);
    cache.set(level, { segs, pts });
    return cache.get(level);
  }

  function metrics(level) {
    return {
      sides: 3 * 4 ** level,
      perimeter: 3 * (4 / 3) ** level,
      area: 1 + 0.6 * (1 - (4 / 9) ** level),
    };
  }

  function frame(dt) {
    flash = Math.max(0, flash - dt * 2.2);
    if (st.grow > 0) {
      st.grow += dt * 0.9;
      if (st.grow >= 1) { st.grow = 0; st.level += 1; flash = 1; refreshPanelInfo(); }
    } else if (st.playing && st.level < 7) {
      st.grow = 1e-4;
    }
  }

  function draw() {
    const t = S();
    const lv = st.level;
    const cur = kochPoints(lv);
    let outline;
    if (st.grow > 0) {
      /* 生长动画：每段向"凸起 1/3"形态插值 */
      const prev = lv > 0 ? kochPoints(lv - 1).segs : kochPoints(0).segs;
      const g = st.grow, e = g * g * (3 - 2 * g);
      outline = [];
      for (const [a, b] of prev) {
        const dx = (b[0] - a[0]) / 3, dy = (b[1] - a[1]) / 3;
        const len = Math.hypot(dx, dy);
        const p1 = [a[0] + dx, a[1] + dy];
        const p4 = [a[0] + 2 * dx, a[1] + 2 * dy];
        const mx = (p1[0] + p4[0]) / 2, my = (p1[1] + p4[1]) / 2;
        const peak = [mx + (-dy / len) * len * Math.sqrt(3) / 2 * e, my + (dx / len) * len * Math.sqrt(3) / 2 * e];
        outline.push(a, p1, peak, p4);
      }
    } else {
      outline = cur.pts;
    }
    /* 填充 + 描边（多通道：辉光底 + 墨线面） */
    ctx.save();
    ctx.beginPath();
    for (let i = 0; i < outline.length; i++) {
      const [x, y] = W2S(outline[i][0], outline[i][1]);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = t.snowFill;
    ctx.fill();
    ctx.shadowColor = styleName === 'studio' ? 'rgba(108,200,239,0.5)' : 'rgba(63,108,150,0.3)';
    ctx.shadowBlur = styleName === 'studio' ? 16 : 6;
    ctx.strokeStyle = t.snowEdge;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = styleName === 'paper' ? 'rgba(46,42,36,0.8)' : 'rgba(232,238,246,0.85)';
    ctx.lineWidth = 0.8;
    ctx.stroke();
    ctx.restore();

    if (flash > 0) {
      ctx.save();
      ctx.globalAlpha = flash * 0.35;
      ctx.strokeStyle = t.accent;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      for (let i = 0; i < outline.length; i++) {
        const [x, y] = W2S(outline[i][0], outline[i][1]);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    }

    if (labelsOn) {
      const top = base[2];
      haloText(`n = ${lv}`, ...W2S(top[0], top[1] + 0.55), { size: 13.5, color: t.accent, weight: 700 });
      const m = metrics(lv);
      haloText(`边 ${m.sides.toLocaleString()} · 周长 ${m.perimeter.toFixed(2)}`, ...W2S(0, -2.6), { size: 11.5, color: t.inkSoft });
    }
  }

  function panel() {
    ctl.clear();
    ctl.button({ label: '＋ 长一级', disabled: st.level >= 7, onClick: () => { if (st.level < 7 && st.grow === 0) st.grow = 1e-4; }, id: 'grow' });
    const play = ctl.button({ label: st.playing ? '⏸ 暂停' : '▶ 自动生长', onClick: (b) => { st.playing = !st.playing; b.textContent = st.playing ? '⏸ 暂停' : '▶ 自动生长'; } });
    play.dataset.play = '1';
    ctl.button({ label: '↺ 重来', onClick: () => { st.level = 0; st.grow = 0; st.playing = false; syncBtns(); refreshPanelInfo(); } });
  }
  function syncBtns() {
    const gb = controlsEl.querySelector('[data-act="grow"]');
    if (gb) gb.disabled = st.level >= 7;
    const pb = controlsEl.querySelector('[data-play]');
    if (pb) pb.textContent = st.playing ? '⏸ 暂停' : '▶ 自动生长';
  }

  function lesson() {
    let rows = '';
    for (let n = 0; n <= 7; n++) {
      const m = metrics(n);
      rows += `<tr class="${n === st.level ? 'on' : ''}"><td>${n}</td><td>${m.sides.toLocaleString()}</td><td>${m.perimeter.toFixed(2)}</td><td>${m.area.toFixed(4)}</td></tr>`;
    }
    return `<p>每条边切三等份，中段向外顶起一座小尖塔；对新边再来一遍。等级越高，边界越皱。</p>
<p>奇迹在数字里：<b>周长每一级 ×4/3，冲向无穷</b>；面积却只涨越来越小的零头，封顶在 <span class="hl">8/5 ≈ 1.6</span> 倍——一条无限长的线，围出一块有限的面积。滚轮放大，锯齿永远数不完。</p>
<table class="wond-table"><thead><tr><th>n</th><th>边数</th><th>周长</th><th>面积</th></tr></thead><tbody>${rows}</tbody></table>
<p style="font-size:12px;color:var(--text-faint)">瑞典数学家海里格·冯·科赫，1904</p>`;
  }

  function hudRows() { return [['level', '当前层级 n'], ['sides', '边数'], ['perim', '周长（边长 1）'], ['area', '面积（原始 1）']]; }
  function refreshData() {
    const m = metrics(st.level);
    hset('level', String(st.level));
    hset('sides', m.sides.toLocaleString());
    hset('perim', m.perimeter.toFixed(3));
    hset('area', m.area.toFixed(4));
  }
  function refreshPanelInfo() {
    lessonEl.innerHTML = lesson();
    setHUD(hudRows());
    refreshData();
    syncBtns();
  }

  function enter() {
    cv.classList.remove('hidden3d');
    mbGroup.visible = false;
    controls.enabled = false;
    if (!base.length) initBase();
    panel(); refreshPanelInfo();
  }
  function onResize() { cache.clear(); }
  function onStyle() { backdropDirty = true; }

  return { id: 'koch', title: '科赫雪花', en: 'Koch snowflake', st, frame, draw, enter, panel, lesson: refreshPanelInfo, onResize, onStyle, refreshData, metrics };
})();

/* ================= 章 3 · 分形树 ================= */

const TREE = (() => {
  const st = {
    angleDeg: 26,            /* 分叉半角（度） */
    ratio: 0.72,             /* 缩短比例 */
    depth: 9,                /* 层数 1..12 */
    wind: false,
    drag: false,
  };
  let windT = 0;
  let branches = [];         /* {a:[x,y], b:[x,y], w, depth} */
  let handleTip = [0, 0];    /* 橙色手柄锚点（首枝末端） */
  let branchCount = 0, totalLen = 0;

  function build() {
    branches = [];
    branchCount = 0; totalLen = 0;
    const ang = st.angleDeg * Math.PI / 180;
    const grow = (a, dir, len, w, depth) => {
      const b = [a[0] + Math.cos(dir) * len, a[1] + Math.sin(dir) * len];
      branches.push({ a, b, w, depth });
      branchCount++; totalLen += len;
      if (depth >= st.depth) { if (branchCount === 3) handleTip = b; return; }
      const sway = st.wind && !st.drag ? (Math.sin(windT * 1.3) * 0.5 + Math.sin(windT * 2.9) * 0.15) * depth * 0.045 : 0;
      grow(b, dir + ang + sway, len * st.ratio, w * 0.72, depth + 1);
      grow(b, dir - ang + sway, len * st.ratio, w * 0.72, depth + 1);
    };
    grow([0, -2.6], Math.PI / 2, 2.4, 15, 1);
  }

  function frame(dt) {
    if (st.wind && !st.drag) windT += dt;
    if (st.wind || st.drag) build();
  }

  function draw() {
    const t = S();
    /* 地面线 */
    lineSeg([-3.4, -2.6], [3.4, -2.6], { color: t.faint, w: 1.4, alpha: 0.8 });
    ctx.save();
    /* 枝条：锥形四边形 + 皮色渐变 */
    for (const br of branches) {
      const [x1, y1] = W2S(br.a[0], br.a[1]);
      const [x2, y2] = W2S(br.b[0], br.b[1]);
      const dx = x2 - x1, dy = y2 - y1;
      const L = Math.hypot(dx, dy) || 1;
      const nx = -dy / L * br.w * 0.5, ny = dx / L * br.w * 0.5;
      const w2 = Math.max(0.6, br.w * 0.62);
      const nx2 = -dy / L * w2 * 0.5, ny2 = dx / L * w2 * 0.5;
      const depthK = br.depth / Math.max(1, st.depth);
      const g = ctx.createLinearGradient(x1, y1, x2, y2);
      if (styleName === 'paper') {
        g.addColorStop(0, `rgba(96,66,36,${0.9 - depthK * 0.15})`);
        g.addColorStop(1, `rgba(140,100,56,${0.88 - depthK * 0.2})`);
      } else {
        g.addColorStop(0, `rgba(216,160,92,${0.95 - depthK * 0.2})`);
        g.addColorStop(1, `rgba(240,196,120,${0.9 - depthK * 0.25})`);
      }
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(x1 + nx, y1 + ny);
      ctx.lineTo(x2 + nx2, y2 + ny2);
      ctx.lineTo(x2 - nx2, y2 - ny2);
      ctx.lineTo(x1 - nx, y1 - ny);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    /* 末梢芽点 */
    if (st.depth <= 10) {
      ctx.save();
      for (const br of branches) {
        if (br.depth !== st.depth) continue;
        const [sx, sy] = W2S(br.b[0], br.b[1]);
        ctx.fillStyle = styleName === 'paper' ? 'rgba(178,104,40,0.6)' : 'rgba(240,149,76,0.55)';
        ctx.beginPath();
        ctx.arc(sx, sy, 1.7, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }
    /* 树根铭牌 */
    if (labelsOn) {
      haloText('树干 = 1', ...W2S(0, -2.85), { size: 11, color: S().inkSoft });
    }
    /* 橙色手柄（首枝末端，拖动改分叉角/比例） */
    const [hx, hy] = W2S(handleTip[0], handleTip[1]);
    const hot = st.drag;
    ctx.save();
    ctx.shadowColor = 'rgba(240,149,76,0.6)';
    ctx.shadowBlur = hot ? 16 : 8;
    ctx.fillStyle = '#f0954c';
    ctx.beginPath();
    ctx.arc(hx, hy, hot ? 9 : 7, 0, TAU);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255,235,210,0.9)';
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.restore();
    if (labelsOn) haloText('拖我', hx + 0, hy - 16, { size: 10.5, color: S().inkSoft });
  }

  function hitHandle(mx, my) {
    const [hx, hy] = W2S(handleTip[0], handleTip[1]);
    return Math.hypot(hx - mx, hy - my) < 18;
  }
  function onDown(mx, my) {
    if (hitHandle(mx, my)) { st.drag = true; build(); return true; }
    return false;
  }
  function onMove(mx, my) {
    if (!st.drag) return false;
    /* 由手柄相对"首枝起点"的向量反推 角度与比例 */
    const origin = branches[0] ? branches[0].b : [0, 0];
    const root = branches[0] ? branches[0].a : [0, -2.6];
    const [wx, wy] = S2W(mx, my);
    const vx = wx - root[0], vy = wy - root[1];
    const L0 = Math.hypot(branches[0].b[0] - root[0], branches[0].b[1] - root[1]) || 1;
    st.angleDeg = clamp(90 - Math.atan2(vy, vx) * 180 / Math.PI, 3, 86);
    st.ratio = clamp(Math.hypot(vx, vy) / L0, 0.4, 0.82);
    build();
    syncSliders();
    return true;
  }
  function onUp() { if (st.drag) { st.drag = false; refreshPanelInfo(); } }
  function onHover(mx, my) {
    cv.classList.toggle('grab', hitHandle(mx, my));
  }

  let angSlider, ratioSlider, depthSlider;
  function syncSliders() {
    if (angSlider) angSlider.set(Math.round(st.angleDeg));
    if (ratioSlider) ratioSlider.set(st.ratio);
    if (depthSlider) depthSlider.set(st.depth);
  }

  function panel() {
    ctl.clear();
    angSlider = ctl.slider({ label: '分叉角', min: 3, max: 86, step: 1, value: Math.round(st.angleDeg), fmt: (v) => `${v}°`, onInput: (v) => { st.angleDeg = v; build(); refreshData(); } });
    ratioSlider = ctl.slider({ label: '缩短比例', min: 0.4, max: 0.82, step: 0.01, value: st.ratio, fmt: (v) => v.toFixed(2), onInput: (v) => { st.ratio = v; build(); refreshData(); } });
    depthSlider = ctl.slider({ label: '层数', min: 1, max: 12, step: 1, value: st.depth, fmt: (v) => String(v), onInput: (v) => { st.depth = v; build(); refreshData(); refreshPanelInfo(); } });
    ctl.sep();
    ctl.seg({
      options: [
        { value: '26,0.72', label: '大树' },
        { value: '90,0.70', label: 'H 形' },
        { value: '15,0.78', label: '杨树' },
        { value: '57,0.62', label: '灌木' },
      ],
      value: '',
      onChange: (v) => {
        const [a, r] = v.split(',').map(Number);
        st.angleDeg = a; st.ratio = r;
        build(); syncSliders(); refreshData();
      },
    });
    ctl.sep();
    ctl.button({ label: st.wind ? '🌬 风停' : '🌬 起风', onClick: (b) => { st.wind = !st.wind; b.textContent = st.wind ? '🌬 风停' : '🌬 起风'; } });
  }

  function lesson() {
    const n = 2 ** (st.depth + 1) - 1;
    const len = st.ratio === 1 ? st.depth + 1 : (1 - (2 * st.ratio) ** (st.depth + 1)) / (1 - 2 * st.ratio);
    return `<p>一条规则造一整棵树：每根枝条末端，向左右各斜出<b>一根更短的</b>新枝。角度、比例、层数三件事定了，这棵树就定了。</p>
<p>临界点很有意思：缩短比例一旦越过 <span class="hl">1/√2 ≈ 0.71</span>，枝与枝开始互相穿插——空间第一次"装不下"这棵树。</p>
<p>自然界里树冠、河流水系、血管网、闪电分叉，都是这种"一分为二、层层递减"的自相似骨架。</p>
<p style="font-size:12px;color:var(--text-faint)">当前：枝条数 ${n.toLocaleString()} · 总长度 ${len.toFixed(2)}（树干记 1）</p>`;
  }

  function hudRows() { return [['angle', '分叉角'], ['ratio', '缩短比例'], ['depth', '层数'], ['count', '枝条数'], ['total', '总长度（树干 1）']]; }
  function refreshData() {
    const n = 2 ** (st.depth + 1) - 1;
    const len = st.ratio === 1 ? st.depth + 1 : (1 - (2 * st.ratio) ** (st.depth + 1)) / (1 - 2 * st.ratio);
    hset('angle', `${Math.round(st.angleDeg)}°`);
    hset('ratio', st.ratio.toFixed(2));
    hset('depth', String(st.depth));
    hset('count', n.toLocaleString());
    hset('total', len.toFixed(2));
  }
  function refreshPanelInfo() {
    lessonEl.innerHTML = lesson();
    setHUD(hudRows());
    refreshData();
  }

  function enter() {
    cv.classList.remove('hidden3d');
    mbGroup.visible = false;
    controls.enabled = false;
    build();
    panel(); refreshPanelInfo();
  }
  function onStyle() { backdropDirty = true; }

  return { id: 'tree', title: '分形树', en: 'Fractal tree', st, frame, draw, enter, panel, lesson: refreshPanelInfo, onDown, onMove, onHover, onUp, onStyle, refreshData };
})();

/* ================= 章 4 · 莫比乌斯带（three.js 3D 曲面） ================= */

const MB = (() => {
  const st = {
    k: 1,              /* 半扭数 0..3 */
    ant: null,         /* 蚂蚁行程（圈数）；null=未放出 */
    paint: null,       /* 涂色进度；null=未涂 */
    cut: 0,            /* 剪开进度 0..1 */
    cutDir: 0,         /* 0 静止 / +1 剪开中 / −1 粘回中 */
  };
  const R = 1, D = 0.42, SEGS_U = 300, SEGS_V = 12;

  /* 曲面参数方程：圆在 XZ 平面，纸带宽度方向抬高 y */
  function surf(u, v, k) {
    const c = Math.cos(k * u / 2), s = Math.sin(k * u / 2);
    const r = R + v * c;
    return [r * Math.cos(u), v * s, r * Math.sin(u)];
  }
  /* 中心线法向（∂/∂v 在 v=0） */
  function surfNormal(u, k) {
    const c = Math.cos(k * u / 2), s = Math.sin(k * u / 2);
    return [c * Math.cos(u), s, c * Math.sin(u)];
  }

  /* ---------- 双面涂色着色器（正面纸色 / 背面蓝灰，u 参数区间渐进上色） ---------- */

  const stripVert = /* glsl */`
    attribute float aU;
    attribute float aV;
    varying float vU;
    varying float vV;
    varying vec3 vN;
    varying vec3 vView;
    void main() {
      vU = aU; vV = aV;
      vec4 wp = modelMatrix * vec4(position, 1.0);
      vN = normalize(mat3(modelMatrix) * normal);
      vView = normalize(cameraPosition - wp.xyz);
      gl_Position = projectionMatrix * viewMatrix * wp;
    }
  `;
  const stripFrag = /* glsl */`
    uniform vec3 uBodyF;
    uniform vec3 uBodyB;
    uniform vec3 uPaintA;
    uniform vec3 uPaintB;
    uniform float uFromF;
    uniform float uToF;
    uniform float uFromB;
    uniform float uToB;
    uniform vec3 uLightDir;
    varying float vU;
    varying float vV;
    varying vec3 vN;
    varying vec3 vView;
    void main() {
      bool front = gl_FrontFacing;
      vec3 body = front ? uBodyF : uBodyB;
      float from = front ? uFromF : uFromB;
      float to = front ? uToF : uToB;
      float inPaint = step(from, vU) * step(vU, to);
      vec3 paint = mix(uPaintA, uPaintB, clamp(vU * 1.4 - 0.2, 0.0, 1.0));
      float grain = sin(vU * 760.0) * 0.5 + sin(vU * 23.0) * 0.5;
      vec3 base = body * (0.97 + grain * 0.02 - (front ? 0.0 : 0.06));
      vec3 col = mix(base, paint, inPaint * 0.88);
      vec3 N = normalize(vN);
      if (!front) N = -N;
      float hl = dot(N, normalize(uLightDir)) * 0.5 + 0.5;
      col *= 0.52 + 0.48 * hl;
      float rim = pow(1.0 - abs(dot(N, normalize(vView))), 2.2);
      col += rim * 0.09;
      gl_FragColor = vec4(col, 1.0);
    }
  `;

  let surfaceMesh = null;
  let secondMesh = null;       /* 剪开后偶数半扭的第二只环 */
  let edgeTubes = [];
  let centerline = null;
  let antGroup = null;
  let antTrail = null;
  let trailPos = null;
  let shadowMesh = null;
  let cutMode = 'none';        /* none | odd | even */

  function makeStripGeometry(uMax, vLo, vHi, k, yScale = 1, zScale = 1, yOff = 0) {
    const NU = SEGS_U, NV = SEGS_V;
    const pos = new Float32Array((NU + 1) * (NV + 1) * 3);
    const aU = new Float32Array((NU + 1) * (NV + 1));
    const aV = new Float32Array((NU + 1) * (NV + 1));
    const idx = [];
    let p = 0;
    for (let i = 0; i <= NU; i++) {
      const u = (i / NU) * uMax;
      for (let j = 0; j <= NV; j++) {
        const v = vLo + (vHi - vLo) * (j / NV);
        const w = surf(u, v, k);
        pos[p * 3] = w[0];
        pos[p * 3 + 1] = w[1] * yScale + yOff;
        pos[p * 3 + 2] = w[2] * zScale;
        aU[p] = i / NU;
        aV[p] = j / NV;
        p++;
      }
    }
    for (let i = 0; i < NU; i++) {
      for (let j = 0; j < NV; j++) {
        const a = i * (NV + 1) + j;
        const b = a + (NV + 1);
        idx.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aU', new THREE.BufferAttribute(aU, 1));
    g.setAttribute('aV', new THREE.BufferAttribute(aV, 1));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }

  function makeStripMat(paintA = 0xf0954c, paintB = 0x6fc3d9) {
    return new THREE.ShaderMaterial({
      vertexShader: stripVert,
      fragmentShader: stripFrag,
      side: THREE.DoubleSide,
      uniforms: {
        uBodyF: { value: new THREE.Color(0xf3ead6) },
        uBodyB: { value: new THREE.Color(0x9cb7d8) },
        uPaintA: { value: new THREE.Color(paintA) },
        uPaintB: { value: new THREE.Color(paintB) },
        uFromF: { value: 2 }, uToF: { value: 0 },
        uFromB: { value: 2 }, uToB: { value: 0 },
        uLightDir: { value: new THREE.Vector3(-0.5, 0.9, 0.6).normalize() },
      },
    });
  }

  function edgeColorMat() {
    return matStd(0xe8e2d2, { roughness: 0.55, metalness: 0.04 });
  }

  function buildEdge(k) {
    for (const t of edgeTubes) { mbGroup.remove(t); t.geometry.dispose(); t.material.dispose(); }
    edgeTubes = [];
    const mkLeg = (v) => {
      const pts = [];
      for (let i = 0; i <= 240; i++) {
        const u = i / 240 * TAU;
        pts.push(new THREE.Vector3(...surf(u, v, k)));
      }
      return pts;
    };
    const legs = [mkLeg(D), mkLeg(-D)];
    const build = (pts, closed) => {
      const curve = new THREE.CatmullRomCurve3(pts, closed);
      const geo = new THREE.TubeGeometry(curve, 360, 0.02, 8, closed);
      const mesh = new THREE.Mesh(geo, edgeColorMat());
      mbGroup.add(mesh);
      edgeTubes.push(mesh);
    };
    if (k % 2 === 1) build([...legs[0], ...legs[1]], true);
    else { build(legs[0], true); build(legs[1], true); }
  }

  function buildCenterline(k) {
    if (centerline) { mbGroup.remove(centerline); centerline.geometry.dispose(); centerline.material.dispose(); centerline = null; }
    const pts = [];
    for (let i = 0; i <= 240; i++) pts.push(new THREE.Vector3(...surf(i / 240 * TAU, 0, k)));
    const g = new THREE.BufferGeometry().setFromPoints(pts);
    const m = new THREE.LineDashedMaterial({ color: 0xd75a3a, dashSize: 0.075, gapSize: 0.05, transparent: true, opacity: 0.85 });
    centerline = new THREE.Line(g, m);
    centerline.computeLineDistances();
    centerline.visible = labelsOn && st.cut === 0;
    mbGroup.add(centerline);
  }

  function buildAnt() {
    if (antGroup) { mbGroup.remove(antGroup); }
    antGroup = new THREE.Group();
    const bodyMat = matGlow(0x7a3c14, 0.4, { roughness: 0.5 });
    const abdomen = new THREE.Mesh(new THREE.SphereGeometry(0.055, 14, 12), bodyMat);
    abdomen.scale.set(1, 0.9, 1.5);
    abdomen.position.z = -0.1;
    const thorax = new THREE.Mesh(new THREE.SphereGeometry(0.042, 12, 10), bodyMat);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.046, 12, 10), bodyMat);
    head.position.z = 0.075;
    antGroup.add(abdomen, thorax, head);
    const legMat = matStd(0x4a2c12, { roughness: 0.6 });
    antGroup.userData.legs = [];
    for (let s = 0; s < 2; s++) {
      for (let i = 0; i < 3; i++) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.004, 0.11, 6), legMat);
        leg.position.set((s ? 1 : -1) * 0.05, -0.03, -0.05 + i * 0.05);
        leg.rotation.z = (s ? 1 : -1) * 1.05;
        leg.rotation.x = (i - 1) * 0.3;
        antGroup.add(leg);
        antGroup.userData.legs.push(leg);
      }
    }
    const antMat = matStd(0x3a2410, { roughness: 0.6 });
    for (let s = 0; s < 2; s++) {
      const an = new THREE.Mesh(new THREE.CylinderGeometry(0.0035, 0.002, 0.085, 5), antMat);
      an.position.set((s ? 1 : -1) * 0.022, 0.03, 0.14);
      an.rotation.x = 1.2;
      an.rotation.z = (s ? 1 : -1) * 0.25;
      antGroup.add(an);
    }
    antGroup.visible = false;
    mbGroup.add(antGroup);
    /* 足迹线 */
    if (antTrail) { mbGroup.remove(antTrail); antTrail.geometry.dispose(); }
    trailPos = new Float32Array(242 * 3);
    const tg = new THREE.BufferGeometry();
    tg.setAttribute('position', new THREE.BufferAttribute(trailPos, 3));
    tg.setDrawRange(0, 0);
    antTrail = new THREE.Line(tg, new THREE.LineBasicMaterial({ color: 0xd75a3a, transparent: true, opacity: 0.45 }));
    mbGroup.add(antTrail);
  }

  function buildShadow() {
    if (shadowMesh) return;
    const c2 = document.createElement('canvas');
    c2.width = c2.height = 256;
    const g2 = c2.getContext('2d');
    const rg = g2.createRadialGradient(128, 128, 10, 128, 128, 126);
    rg.addColorStop(0, 'rgba(0,0,0,0.5)');
    rg.addColorStop(0.6, 'rgba(0,0,0,0.22)');
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    g2.fillStyle = rg;
    g2.fillRect(0, 0, 256, 256);
    const tex = new THREE.CanvasTexture(c2);
    shadowMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(4.2, 4.2),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }),
    );
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = -0.72;
    mbGroup.add(shadowMesh);
  }

  function clearSurface() {
    if (surfaceMesh) { mbGroup.remove(surfaceMesh); surfaceMesh.geometry.dispose(); surfaceMesh.material.dispose(); surfaceMesh = null; }
    if (secondMesh) { mbGroup.remove(secondMesh); secondMesh.geometry.dispose(); secondMesh.material.dispose(); secondMesh = null; }
  }

  function rebuild() {
    clearSurface();
    const k = st.k;
    const m = st.cut;
    buildEdge(k);
    for (const t of edgeTubes) t.visible = m === 0;   /* 剪开态拓扑变化，边缘管不再代表边界 */
    buildCenterline(k);
    buildAnt();
    buildShadow();

    if (m > 0 && k % 2 === 1) {
      /* 奇数半扭剪开：一条两倍长的大环，整体撑开 */
      const g = makeStripGeometry(TAU * 2, -D, D, k, 1 + 0.6 * m);
      surfaceMesh = new THREE.Mesh(g, matCutOdd());
      surfaceMesh.scale.setScalar(1 + 0.35 * m);
      if (m > 0.5) setPaintUniforms(surfaceMesh.material, 0, 2, 0, 2);
      mbGroup.add(surfaceMesh);
      cutMode = 'odd';
    } else if (m > 0 && k % 2 === 0) {
      /* 偶数半扭剪开：两只窄环上下错开，互相套住 */
      cutMode = 'even';
      rescaleCut();
    } else {
      const g = makeStripGeometry(TAU, -D, D, k);
      surfaceMesh = new THREE.Mesh(g, matNormal());
      mbGroup.add(surfaceMesh);
      cutMode = 'none';
    }
    updatePaint();
  }

  /* 材质缓存（重建几何时复用，避免反复 new ShaderMaterial 泄漏） */
  let _matNormal = null, _matCutOdd = null, _matEvenA = null, _matEvenB = null;
  function matNormal() { return _matNormal ||= makeStripMat(); }
  function matCutOdd() { return _matCutOdd ||= makeStripMat(0xe0862e, 0x58b4c9); }
  function matEvenA() { return _matEvenA ||= makeStripMat(0xe0862e, 0xc06a22); }
  function matEvenB() { return _matEvenB ||= makeStripMat(0x58b4c9, 0x3e8ca0); }

  function setPaintUniforms(mat, f0, f1, b0, b1) {
    mat.uniforms.uFromF.value = f0; mat.uniforms.uToF.value = f1;
    mat.uniforms.uFromB.value = b0; mat.uniforms.uToB.value = b1;
  }

  function updatePaint() {
    const odd = st.k % 2 === 1;
    if (cutMode !== 'none') {
      if (surfaceMesh && st.paint !== null) {
        /* 剪开态涂色：整环刷满 */
        setPaintUniforms(surfaceMesh.material, 0, 2, 0, 2);
        if (secondMesh) setPaintUniforms(secondMesh.material, 0, 1, 0, 1);
      }
      return;
    }
    if (st.paint === null) {
      if (surfaceMesh) setPaintUniforms(surfaceMesh.material, 2, 0, 2, 0);
      return;
    }
    const t = st.paint;
    /* 正面涂 [0, min(1,t)]；奇数半扭的"背面"是同一个面的延续：t 过 1 后开始涂背面 [0, t−1] */
    if (surfaceMesh) setPaintUniforms(surfaceMesh.material, 0, Math.min(1, t), 0, odd ? clamp(t - 1, 0, 1) : 0);
  }

  /* ---------- 蚂蚁行走 ---------- */

  const _mx = new THREE.Matrix4();
  const _x = new THREE.Vector3(), _y = new THREE.Vector3(), _z = new THREE.Vector3();
  function antPose(progress) {
    const k = st.k;
    const odd = k % 2 === 1;
    const lap = Math.floor(progress + 1e-6);
    const u = (progress - lap) * TAU;
    const flip = odd && lap % 2 === 1 ? -1 : 1;
    const base = surf(u, 0, k);
    const nrm = surfNormal(u, k);
    /* 前向 = ∂/∂u 数值差分 */
    const e = 0.01;
    const p2v = surf(u + e, 0, k);
    const fwd = [p2v[0] - base[0], p2v[1] - base[1], p2v[2] - base[2]];
    const fl = Math.hypot(...fwd);
    const up = [nrm[0] * flip, nrm[1] * flip, nrm[2] * flip];
    _z.set(fwd[0] / fl, fwd[1] / fl, fwd[2] / fl);
    _y.set(...up).normalize();
    _x.crossVectors(_y, _z).normalize();
    _z.crossVectors(_x, _y).normalize();
    _mx.makeBasis(_x, _y, _z);
    const lift = 0.13 + 0.028;
    antGroup.position.set(base[0] + up[0] * lift, base[1] + up[1] * lift, base[2] + up[2] * lift);
    antGroup.setRotationFromMatrix(_mx);
    /* 步足摆动 */
    const ph = progress * TAU * 6;
    antGroup.userData.legs.forEach((leg, i) => {
      leg.rotation.x = (Math.floor(i / 2) - 1) * 0.3 + Math.sin(ph + i * 2.1) * 0.28;
    });
  }

  function frame(dt) {
    /* 剪开 / 粘回 动画 */
    if (st.cutDir !== 0) {
      st.cut += st.cutDir * dt * 0.5;
      if (st.cut >= 1) { st.cut = 1; st.cutDir = 0; refreshPanelInfo(); }
      if (st.cut <= 0) { st.cut = 0; st.cutDir = 0; rebuild(); refreshPanelInfo(); }
      else if (cutMode === 'none') rebuild();
      else rescaleCut();
      if (centerline) centerline.visible = labelsOn && st.cut === 0;
    }
    /* 涂色推进 */
    if (st.paint !== null && cutMode === 'none') {
      const target = st.k % 2 === 1 ? 2 : 1;
      if (st.paint < target) {
        st.paint = Math.min(target, st.paint + dt * 0.16);
        updatePaint();
        if (st.paint >= target) refreshPanelInfo();
      }
    }
    /* 蚂蚁推进 */
    if (st.ant !== null && antGroup) {
      const target = st.k % 2 === 1 ? 2 : 1;
      if (st.ant < target) {
        st.ant = Math.min(target, st.ant + dt * 0.2);
        antGroup.visible = true;
        antPose(st.ant);
        pushTrail();
        if (st.ant >= target) refreshPanelInfo();
      }
    }
  }

  function rescaleCut() {
    const m = st.cut;
    const k = st.k;
    if (cutMode === 'odd' && surfaceMesh) {
      surfaceMesh.scale.setScalar(1 + 0.35 * m);
      const oldGeo = surfaceMesh.geometry;
      surfaceMesh.geometry = makeStripGeometry(TAU * 2, -D, D, k, 1 + 0.6 * m);
      oldGeo.dispose();
      if (m > 0.5) setPaintUniforms(surfaceMesh.material, 0, 2, 0, 2);
    } else if (cutMode === 'even') {
      /* 两只窄环：宽度收窄 + 上下错位随进度生长（几何逐帧重建，旧几何即时 dispose） */
      clearSurfaceOnly();
      for (let s = 0; s < 2; s++) {
        const inset = 0.12 * m + 0.001;
        const g = makeStripGeometry(TAU, s ? -D : inset, s ? -inset : D, k, 1, 1, (s ? 1 : -1) * 0.9 * m);
        const mesh = new THREE.Mesh(g, s === 0 ? matEvenA() : matEvenB());
        mbGroup.add(mesh);
        if (s === 0) surfaceMesh = mesh; else secondMesh = mesh;
        if (m > 0.5) setPaintUniforms(mesh.material, 0, 1, 0, 1);
      }
    }
  }
  function clearSurfaceOnly() {
    for (const msh of [surfaceMesh, secondMesh]) {
      if (msh) { mbGroup.remove(msh); msh.geometry.dispose(); }
    }
    surfaceMesh = null; secondMesh = null;
  }

  let trailCount = 0;
  function pushTrail() {
    if (!antGroup || trailCount >= 241) return;
    trailPos[trailCount * 3] = antGroup.position.x;
    trailPos[trailCount * 3 + 1] = antGroup.position.y;
    trailPos[trailCount * 3 + 2] = antGroup.position.z;
    trailCount++;
    antTrail.geometry.setDrawRange(0, trailCount);
    antTrail.geometry.attributes.position.needsUpdate = true;
  }

  /* ---------- 控件 / 详解 ---------- */

  let btnAnt, btnPaint, btnCut;
  function panel() {
    ctl.clear();
    ctl.seg({
      options: [
        { value: 0, label: '圆环（0 半扭）' },
        { value: 1, label: '莫比乌斯带（1）' },
        { value: 2, label: '2 个半扭' },
        { value: 3, label: '3 个半扭' },
      ],
      value: st.k,
      onChange: (k) => { setK(k); },
    });
    ctl.sep();
    btnAnt = ctl.button({ label: '🐜 蚂蚁走一走', onClick: () => { if (st.cut > 0) { st.cut = 0; st.cutDir = 0; } st.ant = 0; st.paint = null; trailCount = 0; antTrail.geometry.setDrawRange(0, 0); rebuild(); } });
    btnPaint = ctl.button({ label: '🖌 涂色', onClick: () => { if (st.cut > 0) { st.cut = 0; st.cutDir = 0; } st.paint = 0; st.ant = null; antGroup.visible = false; rebuild(); } });
    btnCut = ctl.button({ label: st.cut > 0 ? '🧷 粘回去' : '✂ 沿中线剪开', onClick: () => {
      st.ant = null; st.paint = null;
      if (antGroup) antGroup.visible = false;
      if (st.cut > 0) { st.cutDir = -1; }
      else { st.cutDir = 1; st.cut = 0.001; rebuild(); }
      paintCutBtn();
    } });
  }
  function paintCutBtn() {
    if (btnCut) btnCut.textContent = st.cut > 0 ? '🧷 粘回去' : '✂ 沿中线剪开';
  }
  function setK(k) {
    st.k = k;
    st.ant = null; st.paint = null; st.cut = 0; st.cutDir = 0;
    if (antGroup) antGroup.visible = false;
    trailCount = 0;
    rebuild();
    refreshPanelInfo();
  }

  function cutInfoText() {
    const odd = st.k % 2 === 1;
    return odd ? `1 个大环（更长，${2 * st.k + 2} 个半扭）` : '2 个环，互相套住';
  }

  function lesson() {
    const odd = st.k % 2 === 1;
    let note = '纸条一端扭半圈再首尾相粘，就是这条带。拖动画面可以转着看——然后放蚂蚁、上颜料、动剪刀，逐一验证它的古怪。';
    if (st.ant !== null && st.ant >= 1) {
      note = odd
        ? '蚂蚁爬完一圈，竟然停在起点的"背面"；要再走一圈才踩回出发的脚印。'
        : '蚂蚁走完一圈稳稳回到原地——全程都待在同一面。';
    } else if (st.paint !== null && st.paint >= (odd ? 2 : 1)) {
      note = odd
        ? '一支笔不跨边缘，竟然把整条带子的"两面"涂了个遍——因为它本来就只有一个面。'
        : '涂完一圈就停了：另一面依旧空白。普通的环，就是有两个面。';
    } else if (st.cut >= 1) {
      note = odd
        ? '沿中线剪开，并不会一分为二——纸带只是变成一条更长的环；颜色要转满两轮，才会重新回到起点。'
        : '剪开真成了两只环，可它们像链环一样互相扣住，怎么也解不开。';
    }
    return `<p>拿一条纸带，把一端翻个半转再两头粘接，围出来的就是<b>莫比乌斯带</b>（1858 年，莫比乌斯与利斯廷各自独立提出）。</p>
<p>读数栏记着它的家底：${odd ? '<span class="hl">1 个面、1 条边</span>' : '2 个面、2 条边'}。剪开后的命运也写在里面：${cutInfoText()}。</p>
<p>${note}</p>`;
  }

  function hudRows() {
    return [['k', '半扭数'], ['faces', '面'], ['edges', '边'], ['cut', '沿中线剪开'], ['ant', '蚂蚁行程']];
  }
  function refreshData() {
    const odd = st.k % 2 === 1;
    hset('k', `${st.k} 个`);
    hset('faces', odd ? '1 个（单侧曲面）' : '2 个');
    hset('edges', odd ? '1 条' : '2 条');
    hset('cut', cutInfoText());
    hset('ant', st.ant === null ? '–' : `${st.ant.toFixed(2)} / ${odd ? 2 : 1} 圈`);
  }
  function refreshPanelInfo() {
    lessonEl.innerHTML = lesson();
    setHUD(hudRows());
    refreshData();
    paintCutBtn();
  }

  function enter() {
    cv.classList.add('hidden3d');
    mbGroup.visible = true;
    controls.enabled = true;
    st.ant = null; st.paint = null; st.cut = 0; st.cutDir = 0;
    trailCount = 0;
    rebuild();
    panel(); refreshPanelInfo();
    app.setCamera([2.5, 1.8, 2.15], [0, 0, 0]);
  }
  function leave() {
    controls.enabled = false;
    mbGroup.visible = false;
  }
  function resetView() { app.setCamera([2.5, 1.8, 2.15], [0, 0, 0]); }
  function onStyle() { backdropDirty = true; }

  return { id: 'mobius', title: '莫比乌斯带', en: 'Möbius strip', st, frame, draw: null, enter, leave, panel, lesson: refreshPanelInfo, resetView, onStyle, refreshData };
})();

/* ================= 章 5 · 黄金分割（猜点 / 无限螺旋 / 斐波那契） ================= */

const GOLDEN = (() => {
  const st = {
    mode: 'game',          /* game | spiral | fib */
    round: 0, scores: [],
    guess: 0.5, placed: null, drag: false,
    seg: [[-3, 1], [3, -1]],
    zoom: 0, zooming: true,
  };
  const N_ROUNDS = 5;
  let cheers = [];        /* 判分彩纸粒子 */
  let fibCache = null;

  function fib(n) {
    if (fibCache) return fibCache;
    const t = [1, 1];
    while (t.length < n) t.push(t[t.length - 1] + t[t.length - 2]);
    fibCache = t;
    return t;
  }
  const ratios = (n) => { const f = fib(n + 1); return f.slice(1).map((v, i) => v / f[i]); };

  function newRound() {
    const L = 5 + Math.random() * 4;
    const ang = (Math.random() - 0.5) * 0.9;
    const c = [(Math.random() - 0.5) * 1.4, (Math.random() - 0.5) * 1.1];
    const half = [Math.cos(ang) * L / 2, Math.sin(ang) * L / 2];
    st.seg = [[c[0] - half[0], c[1] - half[1]], [c[0] + half[0], c[1] + half[1]]];
    st.guess = 0.5;
    st.placed = null;
  }
  const segAt = (a) => [
    st.seg[0][0] + (st.seg[1][0] - st.seg[0][0]) * a,
    st.seg[0][1] + (st.seg[1][1] - st.seg[0][1]) * a,
  ];
  /* 真值取更近的一侧：0.618 或 0.382 */
  const truthAt = (a) => Math.abs(a - (PHI - 1)) < Math.abs(a - (2 - PHI)) ? PHI - 1 : 2 - PHI;
  const scoreOf = (d) => Math.max(0, Math.round(100 - d * 600));

  function frame(dt) {
    if (st.mode === 'spiral' && st.zooming) st.zoom += dt * 0.24;
    /* 彩纸粒子 */
    if (cheers.length) {
      for (const c of cheers) {
        c.t += dt;
        c.x += c.vx * dt; c.y += c.vy * dt;
        c.vy += 3.4 * dt;
        c.rot += c.vr * dt;
      }
      cheers = cheers.filter((c) => c.t < 1.6);
    }
  }

  /* ---------- 绘制 ---------- */

  function goldenRects(count) {
    /* 递推黄金矩形链：R_{i+1} 是 R_i 切掉正方形后的剩余；返回每级矩形 + 弧参数 */
    const rects = [];
    let x = -3.2, y = -2, w = 6.4, h = 6.4 / PHI;
    let horiz = true;                       /* 切分方向交替 */
    for (let i = 0; i < count; i++) {
      rects.push({ x, y, w, h, horiz });
      const s = h;                          /* 正方形边长 = 短边 */
      if (horiz) {
        /* 横放矩形：左侧切正方形，剩余在右 */
        x += s; w -= s;
      } else {
        y += s; h -= s;
      }
      horiz = !horiz;
    }
    return rects;
  }

  function draw() {
    const t = S();
    if (st.mode === 'game') return drawGame(t);
    if (st.mode === 'spiral') return drawSpiral(t);
    return drawFib(t);
  }

  function drawGame(t) {
    const [A, B] = st.seg;
    const [ax, ay] = W2S(A[0], A[1]);
    const [bx, by] = W2S(B[0], B[1]);
    /* 线段本体：厚杆 + 高光 */
    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = t.faint;
    ctx.lineWidth = 10;
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
    ctx.strokeStyle = t.ink;
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.restore();
    /* 刻度 0..1（细） */
    for (let i = 0; i <= 10; i++) {
      const p = segAt(i / 10);
      const [sx, sy] = W2S(p[0], p[1]);
      const dx = bx - ax, dy = by - ay;
      const L = Math.hypot(dx, dy) || 1;
      const nx = -dy / L, ny = dx / L;
      const len = i % 5 === 0 ? 9 : 5;
      ctx.save();
      ctx.strokeStyle = t.faint;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(sx + nx * 6, sy + ny * 6);
      ctx.lineTo(sx + nx * (6 + len), sy + ny * (6 + len));
      ctx.stroke();
      ctx.restore();
      if (i % 5 === 0) haloText((i / 10).toFixed(1), sx + nx * 24, sy + ny * 24, { size: 10.5, color: t.inkSoft });
    }
    /* 端点 A/B */
    glowDot(ax, ay, 5, t.ink, t.glow);
    glowDot(bx, by, 5, t.ink, t.glow);
    haloText('A', ax - 16, ay - 12, { size: 13, weight: 700, color: t.ink });
    haloText('B', bx + 16, by + 12, { size: 13, weight: 700, color: t.ink });
    /* 猜测把手 */
    const gp = segAt(st.guess);
    const [gx, gy] = W2S(gp[0], gp[1]);
    glowDot(gx, gy, 7.5, t.accent, t.glow);
    /* 揭晓：真值位置 + 两段比对 */
    if (st.placed !== null) {
      const tp = segAt(st.placed);
      const [tx, ty] = W2S(tp[0], tp[1]);
      ctx.save();
      ctx.strokeStyle = t.accent2;
      ctx.lineWidth = 2.4;
      ctx.setLineDash([6, 4]);
      ctx.beginPath(); ctx.moveTo(tx, ty - 14); ctx.lineTo(tx, ty + 14); ctx.stroke();
      ctx.restore();
      glowDot(tx, ty, 6, t.accent2, S().glow);
      haloText('G', tx, ty - 22, { size: 12.5, weight: 700, color: t.accent2 });
      if (labelsOn) {
        const mp = segAt((st.guess + st.placed) / 2);
        haloText(`误差 ${(Math.abs(st.guess - st.placed)).toFixed(3)}`, ...W2S(mp[0], mp[1] - 0.5), { size: 11.5, color: t.inkSoft });
      }
    }
    /* 彩纸 */
    if (cheers.length) {
      ctx.save();
      for (const c of cheers) {
        ctx.globalAlpha = clamp(1.4 - c.t, 0, 1);
        ctx.translate(c.x, c.y);
        ctx.rotate(c.rot);
        ctx.fillStyle = c.color;
        ctx.fillRect(-c.s / 2, -c.s / 4, c.s, c.s / 2);
        ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      }
      ctx.restore();
    }
  }

  function drawSpiral(t) {
    /* 连续无限变焦：链上从 i0 起画 26 级，缩放 φ^(i0−zoom+1) */
    const total = 30;
    const rects = goldenRects(total + 8);
    const i0 = Math.floor(st.zoom);
    const frac = st.zoom - i0;
    const s = Math.pow(PHI, -frac);          /* 当前帧相对 R_{i0} 的缩放 */
    /* 变换：把 R_{i0} 矩形映射到画面基准位置 */
    const r0 = rects[i0];
    const baseW = 6.4;
    const kToBase = baseW / r0.w * s;        /* world 缩放系数 */
    const offX = -r0.x, offY = -r0.y;
    ctx.save();
    ctx.lineWidth = 1.6;
    for (let i = i0; i < Math.min(i0 + 26, rects.length); i++) {
      const r = rects[i];
      const x = (r.x + offX - r0.w / 2) * kToBase;
      const y = (r.y + offY - r0.h / 2) * kToBase;
      const w = r.w * kToBase, h = r.h * kToBase;
      /* 矩形 */
      ctx.strokeStyle = t.inkSoft;
      ctx.globalAlpha = clamp(1 - (i - i0) * 0.06, 0.25, 1);
      ctx.strokeRect(x, y, w, h);
      /* 四分之一圆弧（连接成螺旋） */
      ctx.beginPath();
      ctx.strokeStyle = t.accent;
      ctx.lineWidth = 2.2;
      const arcR = Math.min(w, h);
      if (r.horiz) {
        /* 矩形横放：正方形在左 → 弧心在左上角？统一画在"被切正方形"的内侧角 */
        ctx.arc(x + arcR, y + arcR, arcR, Math.PI, Math.PI / 2, true);
      } else {
        ctx.arc(x + w - arcR, y + h - arcR, arcR, -Math.PI / 2, 0, false);
      }
      ctx.stroke();
      ctx.lineWidth = 1.6;
    }
    ctx.restore();
    /* 中心比值标记 */
    if (labelsOn) {
      haloText('φ ≈ 1.618', cw - 90, 66, { size: 12.5, color: t.accent, weight: 700 });
      haloText(`放大 ×${Math.pow(PHI, st.zoom).toExponential(2)}`, cw - 90, 86, { size: 11, color: t.inkSoft });
    }
  }

  function drawFib(t) {
    const rs = ratios(12);
    /* 坐标框：n 1..12，比值 0.4..2.2 */
    const x0 = 70, x1 = cw - 40, y0 = 70, y1 = chh - 80;
    const px = (n) => x0 + (x1 - x0) * (n - 1) / 11;
    const py = (v) => y1 - (y1 - y0) * (v - 0.4) / 1.8;
    /* φ 参考线 */
    ctx.save();
    ctx.strokeStyle = t.accent;
    ctx.setLineDash([7, 5]);
    ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(x0, py(PHI)); ctx.lineTo(x1, py(PHI)); ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
    haloText('φ = 1.618034', x1 - 4, py(PHI) - 12, { size: 11.5, color: t.accent, align: 'right' });
    /* 网格横线 */
    for (const v of [1, 1.5, 2]) {
      ctx.save();
      ctx.strokeStyle = t.gridMajor;
      ctx.beginPath(); ctx.moveTo(x0, py(v)); ctx.lineTo(x1, py(v)); ctx.stroke();
      ctx.restore();
      haloText(String(v), x0 - 8, py(v), { size: 10.5, color: t.inkSoft, align: 'right' });
    }
    /* 比值折线（上下交替逼近 φ） */
    ctx.save();
    ctx.strokeStyle = t.ink;
    ctx.lineWidth = 2.2;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    rs.forEach((r, i) => {
      const x = px(i + 1), y = py(r);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.restore();
    /* 数据点 + n 标签 */
    rs.forEach((r, i) => {
      const x = px(i + 1), y = py(r);
      const over = r > PHI;
      glowDot(x, y, 4.4, over ? t.accent : t.accent2, t.glow);
      haloText(String(i + 2), x, y1 + 16, { size: 10.5, color: t.inkSoft });
    });
    haloText('相邻两项之比 Fₙ₊₁ / Fₙ', (x0 + x1) / 2, y0 - 26, { size: 12.5, color: t.ink, weight: 700 });
  }

  /* ---------- 交互 ---------- */

  function projectGuess(mx, my) {
    const [wx, wy] = S2W(mx, my);
    const [A, B] = st.seg;
    const vx = B[0] - A[0], vy = B[1] - A[1];
    st.guess = clamp(((wx - A[0]) * vx + (wy - A[1]) * vy) / (vx * vx + vy * vy), 0.02, 0.98);
  }
  function onDown(mx, my) {
    if (st.mode !== 'game' || st.placed !== null || st.round >= N_ROUNDS) return false;
    st.drag = true;
    projectGuess(mx, my);
    return true;
  }
  function onMove(mx, my) {
    if (!st.drag) return false;
    projectGuess(mx, my);
    return true;
  }
  function onUp() { st.drag = false; }
  function onHover() { cv.classList.toggle('ew-resize', st.mode === 'game' && st.placed === null && st.round < N_ROUNDS); }

  function burst() {
    const gp = segAt(st.guess);
    const [gx, gy] = W2S(gp[0], gp[1]);
    const colors = ['#f0954c', '#6fc3d9', '#e8d89e', '#c2551e'];
    for (let i = 0; i < 46; i++) {
      const a = Math.random() * TAU;
      const sp = 0.7 + Math.random() * 2.4;
      cheers.push({ x: gx, y: gy, vx: Math.cos(a) * sp * 60, vy: Math.sin(a) * sp * 60 - 60, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 9, s: 5 + Math.random() * 6, color: colors[i % 4], t: 0 });
    }
  }

  /* ---------- 控件 / 判分卡 / 详解 ---------- */

  let guessCard = null;
  function removeCard() { if (guessCard) { guessCard.remove(); guessCard = null; } }
  function showCard(rows, title = '判分') {
    removeCard();
    guessCard = document.createElement('div');
    guessCard.className = 'wond-guess-card';
    guessCard.innerHTML = `<h4>${title}</h4>` + rows.map(([k, v, hot]) => `<div class="gc-row"><span>${k}</span><b style="${hot ? 'color:var(--accent)' : ''}">${v}</b></div>`).join('');
    stage.appendChild(guessCard);
  }

  function panel() {
    ctl.clear();
    ctl.seg({
      options: [{ value: 'game', label: '找分割点' }, { value: 'spiral', label: '黄金螺旋' }, { value: 'fib', label: '斐波那契' }],
      value: st.mode,
      onChange: (m) => { st.mode = m; removeCard(); enter(); },
    });
    ctl.sep();
    if (st.mode === 'game') {
      if (st.placed === null && st.round < N_ROUNDS) {
        ctl.button({ label: '✓ 确定', onClick: () => checkAnswer(), id: 'check' });
      } else if (st.round < N_ROUNDS) {
        ctl.button({ label: st.round + 1 < N_ROUNDS ? '下一题 →' : '看总分 →', onClick: () => { st.round++; newRound(); removeCard(); refreshPanelInfo(); } });
      } else {
        ctl.button({ label: '↺ 再来一次', onClick: () => { st.round = 0; st.scores = []; newRound(); removeCard(); refreshPanelInfo(); } });
      }
    } else if (st.mode === 'spiral') {
      ctl.button({ label: st.zooming ? '⏸ 暂停放大' : '▶ 继续放大', onClick: (b) => { st.zooming = !st.zooming; b.textContent = st.zooming ? '⏸ 暂停放大' : '▶ 继续放大'; } });
    }
  }

  function checkAnswer() {
    st.placed = truthAt(st.guess);
    const d = Math.abs(st.guess - st.placed);
    const sc = scoreOf(d);
    st.scores.push(sc);
    if (sc >= 90) burst();
    const total = st.scores.reduce((a, b) => a + b, 0);
    showCard([
      ['你的位置', st.guess.toFixed(3)],
      ['黄金分割点', st.placed.toFixed(3)],
      ['得分', String(sc), true],
      ['累计', String(total)],
    ]);
    refreshPanelInfo();
  }

  function lesson() {
    const total = st.scores.reduce((a, b) => a + b, 0);
    if (st.mode === 'spiral') {
      return `<p>长宽之比为 φ ≈ 1.618 的矩形叫<b>黄金矩形</b>。切掉一个正方形，剩下的还是黄金矩形——再切、再切，每一次都自相似。</p>
<p>把每个切口处的直角弧线依次接起来，就得到<b>黄金螺旋</b>。每放大 φ⁴ ≈ 6.85 倍，画面与原来一模一样，所以它可以<b>无限放大</b>而永不重复、也永不结束。</p>`;
    }
    if (st.mode === 'fib') {
      const f = fib(12);
      const rs = ratios(12);
      let rows = '';
      for (let i = 0; i < 10; i++) {
        const dev = Math.abs(rs[i] - PHI);
        rows += `<div class="wond-fibrow"><span class="fr-num">${f[i + 1]} / ${f[i]}</span><span class="fr-bar" style="width:${clamp(90 - dev * 500, 6, 90)}px"></span><span class="fr-val">${rs[i].toFixed(6)}</span></div>`;
      }
      return `<p>1, 1, 2, 3, 5, 8, 13, 21…每一项都是前两项之和。<b>相邻两项之比</b>越来越贴近 φ ≈ 1.618034，而且是交替地一头偏大、一头偏小，像钟摆一样夹向真值。</p>
<div class="wond-fibrows">${rows}</div>`;
    }
    if (st.round >= N_ROUNDS) {
      return `<p>五题总分：<span class="hl">${total} / ${N_ROUNDS * 100}</span>。</p>
<p>${total >= 400 ? '眼力惊人！你对黄金比例的直觉非常准。' : '分割点大约停全线长的 0.618（或对称的 0.382）处。再来一轮，手感会越来越稳。'}</p>`;
    }
    return `<p>把线段分成两段，让<b>长段：全长 = 短段：长段</b>——这个比值约 0.618，称为<b>黄金比</b>；它的倒数 φ = (1 + √5)/2 ≈ 1.618。</p>
<p>第 ${st.round + 1} / ${N_ROUNDS} 题：在线段上拖动（或直接点位置），凭眼力放出你认为的分割点，然后按「确定」判分。误差越小得分越高。</p>`;
  }

  function hudRows() {
    if (st.mode === 'game') return [['round', '题号'], ['guess', '你的位置'], ['placed', '黄金分割点'], ['score', '本题得分'], ['total', '累计得分']];
    if (st.mode === 'spiral') return [['zoom', '累计放大倍数'], ['self', '自相似周期'], ['ratio', '矩形长宽比']];
    return [['phi', 'φ'], ['ratio10', 'F₁₂/F₁₁'], ['dev', '与 φ 偏差']];
  }
  function refreshData() {
    const total = st.scores.reduce((a, b) => a + b, 0);
    if (st.mode === 'game') {
      hset('round', `${Math.min(st.round + 1, N_ROUNDS)} / ${N_ROUNDS}`);
      hset('guess', st.guess.toFixed(3));
      hset('placed', st.placed === null ? '–' : st.placed.toFixed(3));
      hset('score', st.placed === null ? '–' : String(scoreOf(Math.abs(st.guess - st.placed))));
      hset('total', String(total));
    } else if (st.mode === 'spiral') {
      hset('zoom', `×${Math.pow(PHI, st.zoom).toFixed(1)}`);
      hset('self', `φ⁴ ≈ ${Math.pow(PHI, 4).toFixed(2)}`);
      hset('ratio', `φ ≈ ${PHI.toFixed(3)}`);
    } else {
      const rs = ratios(12);
      hset('phi', PHI.toFixed(6));
      hset('ratio10', rs[10].toFixed(6));
      hset('dev', Math.abs(rs[10] - PHI).toFixed(6));
    }
  }
  function refreshPanelInfo() {
    lessonEl.innerHTML = lesson();
    setHUD(hudRows());
    refreshData();
    panel();
  }

  function enter() {
    cv.classList.remove('hidden3d');
    mbGroup.visible = false;
    controls.enabled = false;
    removeCard();
    if (st.mode === 'game' && st.placed === null && st.round === 0 && !st.seg) newRound();
    fitMode();
    panel(); refreshPanelInfo();
  }
  function fitMode() {
    if (st.mode === 'game') fitWorld(4.6, 3.2, 0.92);
    else if (st.mode === 'fib') fitWorld(4.6, 3.2, 0.92);
  }
  function onResize() { if (st.mode !== 'spiral') fitMode(); }
  function onStyle() { backdropDirty = true; }

  return { id: 'golden', title: '黄金分割', en: 'The golden ratio', st, frame, draw, enter, panel, lesson: refreshPanelInfo, onDown, onMove, onHover, onUp, onResize, onStyle, refreshData };
})();

/* ================= 章 6 · 向日葵的种子（叶序螺旋） ================= */

const SUN = (() => {
  const GOLDEN_ANGLE = 360 * (2 - PHI);          /* ≈ 137.5077° */
  const A_SEEDS = 900, L_SP = 0.16;
  const st = {
    angle: GOLDEN_ANGLE,
    shown: 0,
    playing: true,
    spin: false,
    spinT: 0,
    acc: 0,
  };
  let seeds = [];          /* [x, y] world */
  let uniform = 1;

  function vogel() {
    seeds = new Array(A_SEEDS);
    const rad = st.angle * Math.PI / 180;
    for (let i = 0; i < A_SEEDS; i++) {
      const r = L_SP * Math.sqrt(i + 0.5);
      const a = i * rad;
      seeds[i] = [r * Math.cos(a), r * Math.sin(a)];
    }
    uniform = uniformity(seeds);
  }

  /* 排列均匀度：近邻距离均值 / 理想间距 的贴近度（自研度量） */
  function uniformity(pts) {
    const n = pts.length;
    if (n < 2) return 1;
    const cell = L_SP * 1.4;
    const grid = new Map();
    const key = (x, y) => `${Math.floor(x / cell)},${Math.floor(y / cell)}`;
    pts.forEach((p, i) => {
      const k = key(p[0], p[1]);
      (grid.get(k) || grid.set(k, []).get(k)).push(i);
    });
    let sum = 0;
    for (let i = 0; i < n; i++) {
      const [x, y] = pts[i];
      const cx = Math.floor(x / cell), cy = Math.floor(y / cell);
      let best = Infinity;
      for (let gx = cx - 1; gx <= cx + 1; gx++) {
        for (let gy = cy - 1; gy <= cy + 1; gy++) {
          const bucket = grid.get(`${gx},${gy}`);
          if (!bucket) continue;
          for (const j of bucket) {
            if (j === i) continue;
            const d = Math.hypot(pts[j][0] - x, pts[j][1] - y);
            if (d < best) best = d;
          }
        }
      }
      if (best < Infinity) sum += best;
    }
    const mean = sum / n;
    return clamp(1 - Math.abs(mean / L_SP - 1) * 0.9, 0, 1);
  }

  function frame(dt) {
    if (st.playing && st.shown < A_SEEDS) {
      st.shown = Math.min(A_SEEDS, st.shown + dt * (60 + st.shown * 0.9));
      if (st.shown >= A_SEEDS) { st.playing = false; refreshPanelInfo(); }
      refreshData();
    }
    if (st.spin) { st.spinT += dt; }
  }

  function draw() {
    const t = S();
    const n = Math.floor(st.shown);
    const spin = st.spin ? st.spinT * 0.25 : 0;
    const cosS = Math.cos(spin), sinS = Math.sin(spin);
    /* 花盘底：暗色圆盘 + 放射淡纹 */
    const [ccx, ccy] = W2S(0, 0);
    const rPix = L_SP * Math.sqrt(A_SEEDS) * view.k;
    ctx.save();
    const disc = ctx.createRadialGradient(ccx, ccy, rPix * 0.1, ccx, ccy, rPix * 1.12);
    if (styleName === 'paper') {
      disc.addColorStop(0, 'rgba(120,88,40,0.16)');
      disc.addColorStop(1, 'rgba(120,88,40,0.03)');
    } else {
      disc.addColorStop(0, 'rgba(240,180,90,0.13)');
      disc.addColorStop(1, 'rgba(240,180,90,0.02)');
    }
    ctx.fillStyle = disc;
    ctx.beginPath(); ctx.arc(ccx, ccy, rPix * 1.12, 0, TAU); ctx.fill();
    ctx.restore();
    /* 种子（瘦果）：椭圆 + 壳纹，从外圈往里画（新种子叠上面） */
    for (let i = n - 1; i >= 0; i--) {
      let [x, y] = seeds[i];
      if (spin) { const rx = x * cosS - y * sinS, ry = x * sinS + y * cosS; x = rx; y = ry; }
      const [sx, sy] = W2S(x, y);
      if (sx < -20 || sy < -20 || sx > cw + 20 || sy > chh + 20) continue;
      const age = clamp((st.shown - i) / 30, 0, 1);
      const b = i / A_SEEDS;
      const sz = (L_SP * 0.42 * view.k) * (0.75 + 0.5 * Math.sqrt(b)) * (0.5 + 0.5 * age);
      if (sz < 0.5) continue;
      const ang = Math.atan2(-y, x) + (spin ? -spin : 0);
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(ang);
      const hue = styleName === 'paper'
        ? `hsl(${34 + 14 * b}, ${48 + 20 * b}%, ${30 + 32 * b}%)`
        : `hsl(${40 + 8 * b}, ${68 + 18 * b}%, ${38 + 28 * b}%)`;
      ctx.globalAlpha = 0.55 + 0.45 * age;
      ctx.fillStyle = hue;
      ctx.beginPath();
      ctx.ellipse(0, 0, sz * 1.12, sz * 0.72, 0, 0, TAU);
      ctx.fill();
      /* 壳中线 */
      ctx.strokeStyle = styleName === 'paper' ? 'rgba(60,42,18,0.4)' : 'rgba(255,238,200,0.35)';
      ctx.lineWidth = Math.max(0.5, sz * 0.14);
      ctx.beginPath();
      ctx.moveTo(-sz * 0.9, 0);
      ctx.lineTo(sz * 0.9, 0);
      ctx.stroke();
      ctx.restore();
    }
    /* 标注：黄金角下画 34/55 两族斐波那契螺线；偏离时画射线 */
    if (labelsOn && n > 30) {
      const isGolden = Math.abs(st.angle - GOLDEN_ANGLE) < 2;
      ctx.save();
      if (isGolden) {
        for (const fam of [34, 55]) {
          ctx.strokeStyle = fam === 34 ? t.accent : t.accent2;
          ctx.globalAlpha = 0.4;
          ctx.lineWidth = 1.3;
          ctx.beginPath();
          for (let i = 0; i < n; i += 1) {
            if (i % fam !== 0) continue;
            const [x, y] = seeds[i];
            const [sx, sy] = W2S(x, y);
            if (i === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
          }
          ctx.stroke();
        }
        haloText('顺时针 34 · 逆时针 55', ccx, ccy + rPix + 18, { size: 11.5, color: t.ink, weight: 600 });
      } else {
        ctx.strokeStyle = t.accent2;
        ctx.globalAlpha = 0.55;
        ctx.lineWidth = 1.2;
        for (const idx of [n - 1, n - 2]) {
          const [x, y] = seeds[idx] || [0, 0];
          const [sx, sy] = W2S(x, y);
          ctx.beginPath();
          ctx.moveTo(ccx, ccy);
          ctx.lineTo(sx, sy);
          ctx.stroke();
        }
      }
      ctx.restore();
    }
    if (labelsOn) {
      haloText(`发散角 ${st.angle.toFixed(2)}°`, ccx, ccy - rPix - 20, { size: 12.5, color: t.accent, weight: 700 });
    }
  }

  /* ---------- 控件 / 详解 ---------- */

  let angSlider;
  function panel() {
    ctl.clear();
    angSlider = ctl.slider({ label: '发散角', min: 90, max: 180, step: 0.01, value: st.angle, fmt: (v) => `${v.toFixed(2)}°`, onInput: (v) => setAngle(v) });
    ctl.sep();
    ctl.seg({
      options: [
        { value: String(GOLDEN_ANGLE), label: '黄金角 137.51°' },
        { value: '137', label: '137°' },
        { value: '138', label: '138°' },
        { value: '120', label: '120°' },
        { value: '90', label: '90°' },
        { value: '180', label: '180°' },
      ],
      value: '',
      onChange: (v) => setAngle(parseFloat(v)),
    });
    ctl.sep();
    ctl.button({ label: '🌱 重新生长', onClick: () => { st.shown = 0; st.playing = true; refreshData(); } });
    ctl.toggle({ label: '自动旋转', value: st.spin, onChange: (v) => { st.spin = v; if (!v) st.spinT = 0; } });
  }

  function setAngle(v) {
    st.angle = clamp(v, 90, 180);
    vogel();
    st.shown = 0;
    st.playing = true;
    if (angSlider) angSlider.set(st.angle);
    refreshPanelInfo();
  }

  function lesson() {
    const isGolden = Math.abs(st.angle - GOLDEN_ANGLE) < 0.02;
    return `<p>花盘上每新增一粒种子，就比前一粒<b>转过固定角度</b>，同时往外圈挪一点。角度取多少，决定这盘种子挤不挤。</p>
<p>${isGolden
? `<span class="hl">黄金角 = 360° × (1 − 1/φ) ≈ 137.51°</span>。φ 是"最难用分数逼近"的数——转这个角，种子永远排不成放射线，于是一圈一圈均匀铺满整只花盘。数一数两条方向的螺线，恰好是相邻的斐波那契数：34 与 55。`
: '角度稍微偏离黄金角一点点，种子立刻串成一条条放射线，盘心留下大片空隙——差之零点几度，谬以整只花盘。'}</p>
<p style="font-size:12px;color:var(--text-faint)">试一试：137° 与 138° 之间只差 1°，图案却完全不同。</p>`;
  }

  function hudRows() { return [['angle', '发散角'], ['seeds', '种子数'], ['uniform', '排列均匀度'], ['fam', '螺线族（黄金角）']]; }
  function refreshData() {
    const isGolden = Math.abs(st.angle - GOLDEN_ANGLE) < 0.02;
    hset('angle', `${st.angle.toFixed(2)}°${isGolden ? '（黄金角）' : ''}`);
    hset('seeds', `${Math.floor(st.shown)} / ${A_SEEDS}`);
    hset('uniform', `${(uniform * 100).toFixed(0)} %`);
    hset('fam', isGolden ? '34 · 55' : '–');
  }
  function refreshPanelInfo() {
    lessonEl.innerHTML = lesson();
    setHUD(hudRows());
    refreshData();
    panel();
  }

  function enter() {
    cv.classList.remove('hidden3d');
    mbGroup.visible = false;
    controls.enabled = false;
    vogel();
    fitWorld(L_SP * Math.sqrt(A_SEEDS) + 0.5, L_SP * Math.sqrt(A_SEEDS) + 0.5, 0.96);
    panel(); refreshPanelInfo();
  }
  function onResize() { fitWorld(L_SP * Math.sqrt(A_SEEDS) + 0.5, L_SP * Math.sqrt(A_SEEDS) + 0.5, 0.96); }
  function onStyle() { backdropDirty = true; }

  return { id: 'sunflower', title: '向日葵的种子', en: 'Phyllotaxis', st, frame, draw, enter, panel, lesson: refreshPanelInfo, onResize, onStyle, refreshData };
})();

/* ================= 章 7 · 随堂检测（自研加强块：六教学块各 1 题；原版无此块） ================= */

const QUIZ = (() => {
  const st = { idx: 0, picked: null, score: 0, finished: false, t: 0 };

  /* ---- 配图：全部程序化矢量，双风格色板 S() 取色 ---- */

  const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  const faint = (a) => S().glow.replace(/[\d.]+\)$/, `${a})`);

  function artSierp() {
    const A = [0, 2.0], B = [-2.25, -1.35], C = [2.25, -1.35];
    worldPoly([A, B, C], { stroke: S().ink, w: 1.6 });
    (function sub(a, b, c, d) {
      if (d === 0) { worldPoly([a, b, c], { fill: faint(0.3) }); return; }
      const ab = mid(a, b), bc = mid(b, c), ca = mid(c, a);
      sub(a, ab, ca, d - 1); sub(ab, b, bc, d - 1); sub(ca, bc, c, d - 1);
    })(A, B, C, 2);
    if (labelsOn) haloText('每一层都挖掉中间的 1/4', ...W2S(0, -1.95), { size: 11.5, color: S().inkSoft });
  }

  function artKoch() {
    const y0 = -1.45, y1 = 0.2;
    const x0 = -2.5, x3 = 2.5, d = (x3 - x0) / 3;
    const A = [x0 + d, y1], B = [x0 + 2 * d, y1];
    const tip = [x0 + 1.5 * d, y1 + (Math.sqrt(3) / 2) * d];
    lineSeg([x0, y0], [x3, y0], { stroke: S().inkSoft, w: 2 });
    lineSeg([x0, y1], A, { stroke: S().ink, w: 2.2 });
    lineSeg(A, tip, { stroke: S().accent, w: 2.2 });
    lineSeg(tip, B, { stroke: S().accent, w: 2.2 });
    lineSeg(B, [x3, y1], { stroke: S().ink, w: 2.2 });
    if (labelsOn) {
      haloText('层数 0 · 周长 L', ...W2S(0, y0 - 0.42), { size: 11.5, color: S().inkSoft });
      haloText('层数 1 · 周长 4L/3', ...W2S(0, tip[1] + 0.42), { size: 11.5, color: S().accent });
    }
  }

  function artTree() {
    (function branch(x, y, ang, len, w, depth) {
      const nx = x + Math.cos(ang) * len, ny = y + Math.sin(ang) * len;
      lineSeg([x, y], [nx, ny], { stroke: depth > 3 ? S().ink : S().inkSoft, w });
      if (depth <= 0) return;
      branch(nx, ny, ang + 0.44, len * 0.72, Math.max(w * 0.66, 1.2), depth - 1);
      branch(nx, ny, ang - 0.44, len * 0.72, Math.max(w * 0.66, 1.2), depth - 1);
    })(0, -1.95, Math.PI / 2, 1.15, 5, 6);
    if (labelsOn) haloText('每根枝条分出 2 根新枝 → 第 n 级共 2ⁿ 根', ...W2S(0, -2.15), { size: 11.5, color: S().inkSoft });
  }

  function artMobius() {
    const x0 = -2.4, x1 = 2.4, e = 0.62;
    worldPoly([[x0, e], [0, 0], [x0, -e]], { fill: faint(0.14) });
    worldPoly([[x1, e], [0, 0], [x1, -e]], { fill: faint(0.14) });
    lineSeg([x0, e], [x1, -e], { stroke: S().accent, w: 2.4 });
    lineSeg([x0, -e], [x1, e], { stroke: S().ink, w: 2.4 });
    lineSeg([x0, -e], [x0, e], { stroke: S().inkSoft, w: 1.4 });
    lineSeg([x1, -e], [x1, e], { stroke: S().inkSoft, w: 1.4 });
    const t = S();
    [[-1.7, 0.44], [-0.85, 0.22], [0, 0], [0.85, -0.22], [1.7, -0.44]].forEach(([x, y]) => {
      const [sx, sy] = W2S(x, y);
      glowDot(sx, sy, 4.6, t.ink, t.glow);
    });
    if (labelsOn) haloText('蚂蚁沿一条边走一圈 → 停在起点的"背面"', ...W2S(0, -1.6), { size: 11.5, color: S().inkSoft });
  }

  function artGolden() {
    let x = -2.3, y = -1.35, W = 4.3, H = 2.62;   /* ≈ φ : 1 */
    for (let i = 0; i < 6; i++) {
      const s = Math.min(W, H);
      if (s < 0.22) break;
      const fill = i % 2 ? faint(0.2) : faint(0.1);
      const ph = i % 4;
      let r;
      if (ph === 0) { r = [[x, y], [x + s, y], [x + s, y + s], [x, y + s]]; x += s; W -= s; }        /* 切左 */
      else if (ph === 1) { r = [[x, y], [x + s, y], [x + s, y + s], [x, y + s]]; y += s; H -= s; }  /* 切底 */
      else if (ph === 2) { r = [[x + W - s, y], [x + W, y], [x + W, y + s], [x + W - s, y + s]]; W -= s; } /* 切右 */
      else { r = [[x, y + H - s], [x + W, y + H - s], [x + W, y + H], [x, y + H]]; H -= s; }        /* 切顶 */
      worldPoly(r, { fill, stroke: S().inkSoft, w: 1.2 });
    }
    if (Math.min(W, H) > 0.16) worldPoly([[x, y], [x + W, y], [x + W, y + H], [x, y + H]], { stroke: S().faint, w: 1.2 });
    if (labelsOn) haloText('φ : 1 —— 切掉正方形，剩下的还是黄金矩形', ...W2S(0, -1.85), { size: 11.5, color: S().inkSoft });
  }

  function artSun() {
    const PHI = (1 + Math.sqrt(5)) / 2;
    const GA = TAU * (1 - 1 / PHI);
    const t = S();
    for (let i = 1; i <= 240; i++) {
      const r = 0.125 * Math.sqrt(i), a = i * GA;
      const [sx, sy] = W2S(Math.cos(a) * r, Math.sin(a) * r);
      const fam = Math.round(i * GA / TAU) % 2;
      glowDot(sx, sy, fam ? 3.4 : 2.6, fam ? t.accent : t.accent2, t.glow);
    }
    if (labelsOn) haloText('相邻两族螺线：34 · 55（斐波那契数）', ...W2S(0, -2.15), { size: 11.5, color: S().inkSoft });
  }

  function artDone() {
    const t = S();
    haloText(`${st.score} / ${QS.length}`, ...W2S(0, 0.35), { size: 34, weight: 800, color: t.accent });
    haloText(
      st.score === QS.length ? '满分！分形世界的骨架你已经摸到了'
        : st.score >= 4 ? '不错，多数分形直觉已经建立，错题回去再玩玩'
        : '回到对应章节再玩一次，回来一定全对',
      ...W2S(0, -0.45), { size: 13.5, color: t.ink },
    );
  }

  /* ---- 题库：六教学块各 1 题 ---- */

  const QS = [
    {
      q: `${SIERP_TITLE}每层挖掉每个保留三角形的中间 1/4。层数 n→∞ 时，剩下的总面积是？`,
      opts: ['趋于 0', '趋于 1/4', '保持不变', '不存在极限'], ans: 0, art: artSierp,
      why: '每层面积 ×3/4，(3/4)ⁿ → 0：无穷多块碎三角形，总面积却是零。"无穷多、总和零"正是分形的病态之美。',
    },
    {
      q: '科赫雪花每升一级，每条边变成 4 条、总周长变为原来的 4/3 倍。当 n→∞，周长是？',
      opts: ['收敛到定值', '趋于无穷大', '趋于 0', '在两值间振荡'], ans: 1, art: artKoch,
      why: '(4/3)ⁿ → ∞：面积有限的雪花，围出无限长的边。1904 年科赫发表论文时，它被称作"怪物曲线"。',
    },
    {
      q: '分形树每根枝条末端都分出 2 根新枝。长到第 12 级时，树上共有多少根枝条？',
      opts: ['2¹² = 4096', '2 × 12 = 24', '12² = 144', '无法确定'], ans: 0, art: artTree,
      why: '每级翻倍：1→2→4→…→2¹² = 4096。但每级同时缩短到 0.72 倍，总长度收敛——"枝条无穷多、树高有限"的指数游戏。',
    },
    {
      q: '一只蚂蚁沿莫比乌斯带表面爬一整圈回到出发点，它发现自己在哪里？',
      opts: ['起点的"背面"（同一面的另一处）', '原地不动', '带子外侧之外', '回到了另一条带上'], ans: 0, art: artMobius,
      why: '莫比乌斯带只有 1 个面、1 条边：走一圈到"背面"，再走一圈才回原处。1858 年莫比乌斯与利斯廷几乎同时发现它。',
    },
    {
      q: '黄金比 φ 满足 φ = 1 + 1/φ。它的数值约是？',
      opts: ['1.618', '1.414', '2.236', '0.618'], ans: 0, art: artGolden,
      why: 'φ ≈ 1.618；0.618 是它的倒数 1/φ。黄金矩形切掉一个正方形，剩下的还是黄金矩形——无限自相似，与分形同源。',
    },
    {
      q: '向日葵种子按固定的"黄金角"逐粒旋转排列，这个角度约是？',
      opts: ['137.51°', '120°', '144°', '90°'], ans: 0, art: artSun,
      why: '黄金角 = 360° × (1 − 1/φ) ≈ 137.51°——最难被分数逼近的角，种子因此永远排不成放射线，均匀铺满整只花盘。',
    },
  ];

  /* ---- 作答流程：在台卡片（共享 lab.css quiz 组件），画布配图垫底 ---- */

  let panel = null;

  function renderQ() {
    const item = QS[st.idx];
    panel.innerHTML = '';
    const card = document.createElement('div');
    card.className = 'quiz-card';
    card.innerHTML = `
      <div class="q-progress">第 ${st.idx + 1} / ${QS.length} 题 · 随堂检测</div>
      <h3></h3><div class="q-opts"></div><div class="q-explain"></div>
      <div class="q-foot"><span class="q-score">得分：${st.score}</span></div>`;
    card.querySelector('h3').textContent = item.q;
    const optsBox = card.querySelector('.q-opts');
    const judge = () => {
      optsBox.querySelectorAll('.quiz-opt').forEach((bb, j) => {
        bb.disabled = true;
        if (j === item.ans) bb.classList.add('correct');
        else if (j === st.picked) bb.classList.add('wrong');
      });
      const ex = card.querySelector('.q-explain');
      ex.textContent = (st.picked === item.ans ? '✓ 回答正确。' : '✗ 再想想。') + item.why;
      ex.classList.add('show');
      card.querySelector('.q-score').textContent = `得分：${st.score}`;
      const nx = document.createElement('button');
      nx.type = 'button';
      nx.className = 'ctl-btn active';
      nx.textContent = st.idx < QS.length - 1 ? '下一题 →' : '查看成绩 →';
      nx.addEventListener('click', () => {
        if (st.idx < QS.length - 1) { st.idx++; st.picked = null; renderQ(); refreshData(); }
        else { st.finished = true; renderResult(); refreshPanelInfo(); }
      });
      card.querySelector('.q-foot').appendChild(nx);
    };
    item.opts.forEach((opt, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'quiz-opt';
      b.textContent = `${String.fromCharCode(65 + i)}. ${opt}`;
      b.addEventListener('click', () => {
        if (st.picked !== null) return;
        st.picked = i;
        if (i === item.ans) st.score++;
        judge();
        refreshData();
        refreshPanelInfo();
      });
      optsBox.appendChild(b);
    });
    if (st.picked !== null) judge();      /* 中途切章回来：恢复已判分态 */
    panel.appendChild(card);
  }

  function renderResult() {
    panel.innerHTML = '';
    const card = document.createElement('div');
    card.className = 'quiz-card q-result';
    const pct = Math.round((st.score / QS.length) * 100);
    card.innerHTML = `
      <div class="q-progress">检测完成</div>
      <div class="big">${st.score} / ${QS.length}</div>
      <p style="color:var(--text-dim);margin:4px 0 18px">正确率 ${pct}%${pct >= 80 ? '，分形世界的骨架你已经摸到了！' : pct >= 50 ? '，多数直觉已经建立，错题回到对应章节再玩一次。' : '，回到前六章再玩一遍，回来一定全对。'}</p>`;
    const again = document.createElement('button');
    again.type = 'button';
    again.className = 'ctl-btn active';
    again.textContent = '重新测验';
    again.addEventListener('click', () => { st.idx = 0; st.picked = null; st.score = 0; st.finished = false; renderQ(); refreshPanelInfo(); });
    const back = document.createElement('button');
    back.type = 'button';
    back.className = 'ctl-btn';
    back.textContent = '返回第一章';
    back.addEventListener('click', () => gotoChapter(0));
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:10px;justify-content:center';
    row.appendChild(back); row.appendChild(again);
    card.appendChild(row);
    panel.appendChild(card);
  }

  function buildPanel() {
    if (panel) panel.remove();
    panel = document.createElement('div');
    panel.className = 'quiz-panel';
    stage.appendChild(panel);
    renderQ();
  }
  function leave() {
    if (panel) { panel.remove(); panel = null; }
  }

  /* ---- 右栏三件套（控件块为空自动隐藏） ---- */

  function lesson() {
    if (st.finished) {
      const full = st.score === QS.length;
      return `<p><b>检测完成：${st.score} / ${QS.length}。</b>${full
        ? '从谢尔宾斯基的镂空、科赫的无限周长，到莫比乌斯的一个面、黄金角的均匀铺排——六个知识块全部拿下。'
        : '点「重新测验」再来一轮，或回到对应章节边玩边记：第 1 题谢尔宾斯基、第 2 题科赫雪花、第 3 题分形树、第 4 题莫比乌斯带、第 5·6 题黄金分割与向日葵。'}</p>
<p>分形的共同底牌：<span class="hl">简单规则 × 无限递归</span>。规则只有一行，迭代却长出无穷细节。</p>`;
    }
    return `<p>六道题对应前面六章：谢尔宾斯基的面积、科赫雪花的周长、分形树的枝条数、莫比乌斯带的面、黄金比 φ 与黄金角。</p>
<p>在台上卡片里作答，交卷立即判分并给解析；下方读数实时记录得分。</p>`;
  }

  function hudRows() { return [['q', '当前题'], ['score', '得分'], ['state', '状态']]; }
  function refreshData() {
    hset('q', st.finished ? '完成' : `${st.idx + 1} / ${QS.length}`);
    hset('score', `${st.score} / ${QS.length}`);
    hset('state', st.finished ? '已交卷' : st.picked === null ? '作答中' : '已判分');
  }
  function refreshPanelInfo() {
    lessonEl.innerHTML = lesson();
    setHUD(hudRows());
    refreshData();
  }

  function enter() {
    ctl.clear();
    cv.classList.remove('hidden3d');
    mbGroup.visible = false;
    controls.enabled = false;
    fitWorld(3.6, 2.5, 0.95);
    buildPanel();
    refreshPanelInfo();
  }
  function frame(dt) { st.t += dt; }
  function onStyle() { backdropDirty = true; }

  return {
    id: 'quiz', title: '随堂检测', en: 'Quiz time', st, frame, leave,
    draw: () => { const a = st.finished ? artDone : QS[st.idx].art; a(); },
    enter, lesson: refreshPanelInfo, onStyle, refreshData,
  };
})();

/* ================= 装配段：章注册 · 三栏联动 · 折叠体系 · 工具键盘 · 主循环 ================= */

const SECTIONS = [SP, KOCH, TREE, MB, GOLDEN, SUN, QUIZ];

const chapNav = document.getElementById('chapNav');
const chapCount = document.getElementById('chapCount');
const railNoL = document.getElementById('railNoL');
const railTitleR = document.getElementById('railTitleR');
const detailNo = document.getElementById('detailNo');
const detailTitle = document.getElementById('detailTitle');
const detailBody = document.getElementById('detailBody');
const wonderShell = document.getElementById('wonderShell');

const chapBtns = SECTIONS.map((s, i) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'chap-btn';
  b.dataset.idx = String(i);
  const n = document.createElement('span');
  n.className = 'chap-n';
  n.textContent = String(i + 1).padStart(2, '0');
  const tt = document.createElement('span');
  tt.className = 'chap-t';
  tt.textContent = s.title;
  const en = document.createElement('span');
  en.className = 'chap-en';
  en.textContent = s.en || '';
  b.append(n, tt, en);
  b.addEventListener('click', () => gotoChapter(i));
  chapNav.appendChild(b);
  return b;
});

let chapterIdx = 0;
let lastSection = null;

function setChapter(i) {
  chapterIdx = clamp(i, 0, SECTIONS.length - 1);
  const sec = SECTIONS[chapterIdx];
  chapBtns.forEach((b, j) => {
    const on = j === chapterIdx;
    b.classList.toggle('on', on);
    if (on) b.setAttribute('aria-current', 'true');
    else b.removeAttribute('aria-current');
  });
  const onBtn = chapBtns[chapterIdx];
  if (onBtn && onBtn.scrollIntoView) onBtn.scrollIntoView({ block: 'nearest' });
  const no = String(chapterIdx + 1).padStart(2, '0');
  chapCount.textContent = `${no}/${String(SECTIONS.length).padStart(2, '0')}`;
  detailNo.textContent = no;
  detailTitle.textContent = sec.title;
  railNoL.textContent = no;
  railTitleR.textContent = sec.title;
  if (lastSection && lastSection.leave) lastSection.leave();
  lastSection = sec;
  active = sec;
  inkClear();
  sec.enter();
  document.getElementById('accControls').classList.toggle('acc-empty', !controlsEl.children.length);
  detailBody.scrollTop = 0;
}
function gotoChapter(i) { setChapter((i + SECTIONS.length) % SECTIONS.length); }

/* ---------------- 栏折叠 × 专注模式 ---------------- */

const foldLBtn = document.getElementById('foldLBtn');
const unfoldLBtn = document.getElementById('unfoldLBtn');
const foldRBtn = document.getElementById('foldRBtn');
const unfoldRBtn = document.getElementById('unfoldRBtn');
const focusBtn = document.getElementById('focusBtn');

const FOLD_KEY = { l: 'wonder.foldL', r: 'wonder.foldR' };
let foldL = false;
let foldR = false;
let focusSaved = null;
try {
  foldL = localStorage.getItem(FOLD_KEY.l) === '1';
  foldR = localStorage.getItem(FOLD_KEY.r) === '1';
} catch (e) { /* 忽略 */ }

function applyFold() {
  wonderShell.classList.toggle('fold-l', foldL);
  wonderShell.classList.toggle('fold-r', foldR);
  for (const [btn, folded] of [[foldLBtn, foldL], [unfoldLBtn, foldL], [foldRBtn, foldR], [unfoldRBtn, foldR]]) {
    btn.setAttribute('aria-expanded', String(!folded));
  }
}
function setFocus(on) {
  if (on && focusSaved === null) {
    focusSaved = [foldL, foldR];
    foldL = true; foldR = true;
  } else if (!on && focusSaved !== null) {
    [foldL, foldR] = focusSaved;
    focusSaved = null;
  }
  wonderShell.classList.toggle('focus-mode', on);
  focusBtn.textContent = on ? '退出专注' : '专注模式';
  focusBtn.setAttribute('aria-pressed', String(on));
  applyFold();
}
function toggleFold(side) {
  if (focusSaved !== null) setFocus(false);
  if (side === 'l') foldL = !foldL; else foldR = !foldR;
  try { localStorage.setItem(FOLD_KEY[side], (side === 'l' ? foldL : foldR) ? '1' : '0'); } catch (e) { /* 忽略 */ }
  applyFold();
}
foldLBtn.addEventListener('click', () => toggleFold('l'));
unfoldLBtn.addEventListener('click', () => toggleFold('l'));
foldRBtn.addEventListener('click', () => toggleFold('r'));
unfoldRBtn.addEventListener('click', () => toggleFold('r'));
focusBtn.addEventListener('click', () => setFocus(focusSaved === null));
/* 启动恢复折叠态在首次绘制前同步完成，无收拢动画可闪 */

/* ---------------- 右栏三块手风琴（偏好独立记忆，切章不重置） ---------------- */

const ACC_KEYS = { lesson: 'wonder.accLesson', controls: 'wonder.accControls', data: 'wonder.accData' };
const accSecs = {
  lesson: document.getElementById('accLesson'),
  controls: document.getElementById('accControls'),
  data: document.getElementById('accData'),
};
const NARROW_VIEW = window.innerWidth <= 1100;
const accClosed = {};
for (const name of Object.keys(accSecs)) {
  let saved = null;
  try { saved = localStorage.getItem(ACC_KEYS[name]); } catch (e) { /* 忽略 */ }
  accClosed[name] = saved !== null ? saved === '1' : (name === 'data' && NARROW_VIEW);
}
function applyAcc(name) {
  const sec = accSecs[name];
  sec.classList.toggle('closed', accClosed[name]);
  sec.querySelector('.acc-head').setAttribute('aria-expanded', String(!accClosed[name]));
}
for (const name of Object.keys(accSecs)) {
  applyAcc(name);
  accSecs[name].querySelector('.acc-head').addEventListener('click', () => {
    accClosed[name] = !accClosed[name];
    try { localStorage.setItem(ACC_KEYS[name], accClosed[name] ? '1' : '0'); } catch (e) { /* 忽略 */ }
    applyAcc(name);
  });
}

/* ---------------- 舞台工具与键盘（原版功能块：←/→/R/T/F + 图上标注） ---------------- */

const chapPrev = document.getElementById('chapPrev');
const chapNext = document.getElementById('chapNext');
const camResetBtn = document.getElementById('camResetBtn');
const styleBtn = document.getElementById('styleBtn');
const labelsBtn = document.getElementById('labelsBtn');
const fullBtn = document.getElementById('fullBtn');

function resetCam() {
  if (active && active.resetView) active.resetView();          /* 莫比乌斯：3D 运镜（vfx 缓动） */
  else if (lastFit) fitWorld(lastFit[0], lastFit[1], lastFit[2]); /* 2D 章：回到出场取景 */
}
function paintStyleBtn() {
  styleBtn.textContent = styleName === 'studio' ? '纸面风格' : 'Studio 风格';
  styleBtn.setAttribute('aria-pressed', String(styleName === 'studio'));
}
function toggleStyle() {
  applyStyle(styleName === 'studio' ? 'paper' : 'studio');
  try { localStorage.setItem('wonder.style', styleName); } catch (e) { /* 忽略 */ }
  paintStyleBtn();
  if (active && active.onStyle) active.onStyle();
}
try { labelsOn = localStorage.getItem('wonder.labels') !== '0'; } catch (e) { /* 忽略 */ }
function paintLabelsBtn() {
  labelsBtn.setAttribute('aria-pressed', String(labelsOn));
  labelsBtn.classList.toggle('active', labelsOn);
}
function toggleLabels() {
  labelsOn = !labelsOn;
  try { localStorage.setItem('wonder.labels', labelsOn ? '1' : '0'); } catch (e) { /* 忽略 */ }
  paintLabelsBtn();
}

chapPrev.addEventListener('click', () => gotoChapter(chapterIdx - 1));
chapNext.addEventListener('click', () => gotoChapter(chapterIdx + 1));
camResetBtn.addEventListener('click', resetCam);
styleBtn.addEventListener('click', toggleStyle);
labelsBtn.addEventListener('click', toggleLabels);
fullBtn.addEventListener('click', () => {
  if (document.fullscreenElement) document.exitFullscreen();
  else document.querySelector('.lab-stage3d').requestFullscreen().catch(() => { /* 静默 */ });
});
document.addEventListener('fullscreenchange', () => {
  fullBtn.textContent = document.fullscreenElement ? '⛶ 退出全屏' : '⛶ 全屏';
});

window.addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const t = e.target;
  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
  if (e.key === 'ArrowLeft') gotoChapter(chapterIdx - 1);
  else if (e.key === 'ArrowRight') gotoChapter(chapterIdx + 1);
  else if (e.key === ' ') { e.preventDefault(); const pb = controlsEl.querySelector('[data-play]'); if (pb) pb.click(); }
  else if (e.key === 'r' || e.key === 'R') resetCam();
  else if (e.key === 't' || e.key === 'T') toggleStyle();
  else if (e.key === 'f' || e.key === 'F') fullBtn.click();
  else if (e.key === 'Escape') {
    if (focusSaved !== null) setFocus(false);
    if (document.fullscreenElement) document.exitFullscreen();
  }
});

/* ---------------- 主循环：章 frame 驱动 + 2D 合成（3D 由 vfx 管线直出） ---------------- */

app.onFrame((dt) => {
  if (!active) return;
  if (active.frame) active.frame(dt, performance.now() * 0.001);
  if (active.draw) composite2D(performance.now() * 0.001);
});

/* 性能自检钩子（验收脚本用） */
window.__wonderStats = () => {
  const s = vfx.stats ? vfx.stats() : { calls: 0, tris: 0 };
  return { calls: s.calls, tris: s.tris };
};

/* ---------------- 开机 ---------------- */

resize();
applyFold();
for (const name of Object.keys(accSecs)) applyAcc(name);
setChapter(0);
paintStyleBtn();
paintLabelsBtn();
loader.hide();
