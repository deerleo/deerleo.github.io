/* EduLab · 光学实验台（optics）—— Micro 级深改版
 * 章节：光的反射定律 / 平面镜成像 / 光的折射 / 全反射与光纤 / 棱镜色散 / 凸透镜成像规律 /
 *       眼睛与视力矫正 / 双缝干涉 / 单缝衍射与光栅 / 薄膜干涉（肥皂膜 · 牛顿环）/
 *       光的偏振（马吕斯 · 液晶屏）/ 自由光学台 / 随堂检测
 * 深改：三栏布局适配（左大纲 / 中暗室画布 / 右详解+控件+数据坞）+ 全元素折叠 + 键盘快捷键；
 *       数据坞（逐组记入数据表 / sinθ 与 1/u 关系图像 / CSV 下载）；
 *       功能补全：量角盘折转与光路可逆、玻璃板双蜡烛重合、半圆玻璃砖与钻石、倒置棱镜合成白光、
 *       光具座记数与 1/u-1/v 图像、验光度数、测量头测条纹、白光光栅光谱、钠光与牛顿环、液晶屏、
 *       自由台七种元件 + 金色圆环旋转 + Delete 删除；
 *       2D 暗室工艺密度升级：光学导轨 / 全圆量角盘 / 激光器壳体 / 蜡烛烛焰 / 玻璃板与支架 /
 *       光屏支座 / 接触阴影 / 暗角氛围，全部程序化矢量绘制。
 * 技术：全 2D canvas，自实现 world↔screen 视图变换（拖拽平移 + 滚轮缩放，world y 轴向上）；
 *       rAF 自驱动动画；追迹引擎支持镜面 / 薄透镜（含凹） / 棱镜 / 水面 / 半圆砖 / 长方砖 / 光屏挡光。
 */
import { clamp, makeLoader, createControlsPanel, makeHUD } from './edu-core.js';

const DGR = Math.PI / 180;
const TAU_ = Math.PI * 2;
const N_WATER = 1.33;
const N_GLASS = 1.50;
const N_DIAMOND = 2.42;
const N_SOAP = 1.33;

/* ---------------- 本实验专属样式 ---------------- */

const style = document.createElement('style');
style.textContent = `
canvas.optics-canvas { touch-action: none; cursor: default; }
canvas.optics-canvas.grab { cursor: grab; }
canvas.optics-canvas.grabbing { cursor: grabbing; }
canvas.optics-canvas.rotating { cursor: alias; }
canvas.optics-canvas.measuring { cursor: col-resize; }
`;
document.head.appendChild(style);

/* ---------------- 画布与视图变换 ---------------- */

const stage = document.getElementById('stage');
const loader = makeLoader(stage, '正在布置光学暗室…');
const canvas = document.createElement('canvas');
canvas.className = 'optics-canvas';
stage.insertBefore(canvas, stage.firstChild);
const ctx = canvas.getContext('2d');

let cw = 1, chh = 1, DPR = 1;
const view = { cx: 0, cy: 0, k: 1 }; // 世界中心 + 缩放（世界 y 轴向上）
let viewReset = null; // 当前章视角复位（R 键），由各章 enter() 登记

function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  const w = stage.clientWidth || 1, h = stage.clientHeight || 1;
  cw = w; chh = h;
  canvas.width = Math.max(1, Math.round(w * DPR));
  canvas.height = Math.max(1, Math.round(h * DPR));
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
}
new ResizeObserver(resize).observe(stage);
resize();

function W2S(x, y) { return [(x - view.cx) * view.k + cw / 2, chh / 2 - (y - view.cy) * view.k]; }
function S2W(px, py) { return [(px - cw / 2) / view.k + view.cx, (chh / 2 - py) / view.k + view.cy]; }
function fitView(w, h, cx = 0, cy = 0) {
  view.cx = cx; view.cy = cy;
  view.k = Math.min(cw / w, chh / h) * 0.94;
}
function makeReset(w, h, cx, cy) {
  return () => fitView(w, h, cx, cy);
}

/* ---------------- 绘制助手 ---------------- */

function lineW(x1, y1, x2, y2, color, lw = 1.2, alpha = 1) {
  const [sx1, sy1] = W2S(x1, y1), [sx2, sy2] = W2S(x2, y2);
  ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.globalAlpha = alpha;
  ctx.beginPath(); ctx.moveTo(sx1, sy1); ctx.lineTo(sx2, sy2); ctx.stroke();
  ctx.globalAlpha = 1;
}

function dashW(x1, y1, x2, y2, color, alpha = 1, lw = 1.2) {
  ctx.save();
  ctx.setLineDash([6, 6]);
  lineW(x1, y1, x2, y2, color, lw, alpha);
  ctx.restore();
}

/** 辉光光线：宽半透明 + 中间层 + 亮芯，三重描边 */
function rayGlow(x1, y1, x2, y2, color, alpha = 1, coreW = 1.8) {
  const [sx1, sy1] = W2S(x1, y1), [sx2, sy2] = W2S(x2, y2);
  const g = clamp(view.k, 0.6, 1.8);
  ctx.save();
  ctx.lineCap = 'round';
  ctx.strokeStyle = color;
  ctx.beginPath(); ctx.moveTo(sx1, sy1); ctx.lineTo(sx2, sy2);
  ctx.globalAlpha = alpha * 0.13; ctx.lineWidth = coreW * 7.5 * g; ctx.stroke();
  ctx.globalAlpha = alpha * 0.3; ctx.lineWidth = coreW * 3 * g; ctx.stroke();
  ctx.globalAlpha = alpha; ctx.lineWidth = coreW; ctx.stroke();
  ctx.restore();
}

/** 路径（世界坐标点数组 → 屏幕 path，不描不填） */
function pathW(pts, close = false) {
  ctx.beginPath();
  pts.forEach((p, i) => {
    const [sx, sy] = W2S(p[0], p[1]);
    if (i === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
  });
  if (close) ctx.closePath();
}

function fillPolyW(pts, fill, stroke, lw = 1.4) {
  pathW(pts, true);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
}

function circleW(x, y, r, stroke, lw = 1.4, fill = null) {
  const [sx, sy] = W2S(x, y);
  ctx.beginPath(); ctx.arc(sx, sy, r * view.k, 0, TAU_);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
}

function fillRectW(x0, y0, x1, y1, fill) {
  const [sx0, syT] = W2S(x0, Math.max(y0, y1));
  const [sx1, syB] = W2S(x1, Math.min(y0, y1));
  ctx.fillStyle = fill;
  ctx.fillRect(sx0, syT, sx1 - sx0, syB - syT);
}

/** 圆角矩形（世界坐标，w 全宽，r 圆角半径） */
function roundRectW(x, y, w, h, r, fill, stroke, lw = 1.4, alpha = 1) {
  const [sx, sy] = W2S(x - w / 2, y + h / 2);
  const sw = w * view.k, sh = h * view.k, sr = Math.min(r * view.k, sw / 2, sh / 2);
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.moveTo(sx + sr, sy);
  ctx.arcTo(sx + sw, sy, sx + sw, sy + sh, sr);
  ctx.arcTo(sx + sw, sy + sh, sx, sy + sh, sr);
  ctx.arcTo(sx, sy + sh, sx, sy, sr);
  ctx.arcTo(sx, sy, sx + sw, sy, sr);
  ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
  ctx.globalAlpha = 1;
}

/** 世界坐标采样弧（CCW 从 a1 到 a2） */
function arcW(cx, cy, r, a1, a2, color, lw = 1.4, alpha = 1) {
  const span = a2 - a1;
  const n = Math.max(6, Math.ceil(Math.abs(span) * r * view.k / 10));
  ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.globalAlpha = alpha;
  ctx.beginPath();
  for (let i = 0; i <= n; i++) {
    const a = a1 + span * i / n;
    const [sx, sy] = W2S(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    if (i === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
  }
  ctx.stroke(); ctx.globalAlpha = 1;
}

function arrowHeadW(x, y, ang, size, color) {
  const [sx, sy] = W2S(x, y);
  const s = size;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(sx + Math.cos(ang) * s * 1.4, sy - Math.sin(ang) * s * 1.4);
  ctx.lineTo(sx + Math.cos(ang + 2.5) * s, sy - Math.sin(ang + 2.5) * s);
  ctx.lineTo(sx + Math.cos(ang - 2.5) * s, sy - Math.sin(ang - 2.5) * s);
  ctx.closePath(); ctx.fill();
}

function arrowW(x1, y1, x2, y2, color, lw = 2) {
  lineW(x1, y1, x2, y2, color, lw);
  arrowHeadW(x2, y2, Math.atan2(y2 - y1, x2 - x1), 7.5, color);
}

function textW(str, x, y, o = {}) {
  const [sx, sy] = W2S(x, y);
  ctx.font = (o.bold ? '600 ' : '') + (o.size || 12) + 'px -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillStyle = o.color || '#c7d2de';
  ctx.textAlign = o.align || 'center';
  ctx.textBaseline = o.baseline || 'middle';
  ctx.fillText(str, sx + (o.dx || 0), sy + (o.dy || 0));
}

/** 接触阴影：径向渐变贴片（rx 横向半径，ry 纵向压扁比） */
function shadowBlob(x, y, rx, ry, alpha = 0.32) {
  const [sx, sy] = W2S(x, y);
  const r = Math.max(rx * view.k, 2);
  const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, r);
  g.addColorStop(0, 'rgba(4,7,12,' + alpha + ')');
  g.addColorStop(0.55, 'rgba(4,7,12,' + alpha * 0.5 + ')');
  g.addColorStop(1, 'rgba(4,7,12,0)');
  ctx.save();
  ctx.translate(sx, sy);
  ctx.scale(1, clamp(ry, 0.05, 1));
  ctx.translate(-sx, -sy);
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(sx, sy, r, 0, TAU_); ctx.fill();
  ctx.restore();
}

/** 平面镜：粗线 + 背面斜纹 + 端帽。side: +1 取 (ey,-ex) 方向为背面 */
function drawMirrorSeg(ax, ay, bx, by, side = 1) {
  lineW(ax, ay, bx, by, '#bcc9d9', 5);
  const ex = bx - ax, ey = by - ay;
  const len = Math.hypot(ex, ey) || 1;
  const ux = ex / len, uy = ey / len;
  let nx = ey / len * side, ny = -ux / len * side;
  ctx.globalAlpha = 0.45;
  for (let s = 0.06; s <= 0.98; s += 1 / 14) {
    const px = ax + ex * s, py = ay + ey * s;
    lineW(px + nx * 3, py + ny * 3, px + nx * 14, py + ny * 14, '#8b98a8', 1.3);
  }
  ctx.globalAlpha = 1;
  circleW(ax, ay, 2.6, '#9fb2c8', 1, '#39424e');
  circleW(bx, by, 2.6, '#9fb2c8', 1, '#39424e');
}

/** 薄透镜外形（rx 为鼓出程度，rx<0 画凹透镜） */
function lensShape(x, y, rx, h, fill, stroke, lw = 1.6) {
  const pts = [];
  const quad = (p0, c, p1, n0) => {
    for (let i = 0; i <= n0; i++) {
      const t = i / n0, mt = 1 - t;
      pts.push([mt * mt * p0[0] + 2 * mt * t * c[0] + t * t * p1[0], mt * mt * p0[1] + 2 * mt * t * c[1] + t * t * p1[1]]);
    }
  };
  quad([x, y + h], [x - rx, y], [x, y - h], 16);
  quad([x, y - h], [x + rx, y], [x, y + h], 16);
  fillPolyW(pts, fill, stroke, lw);
}

/* ---------------- 物理助手 ---------------- */

function norm2(x, y) { const L = Math.hypot(x, y) || 1; return [x / L, y / L]; }
function rot2(x, y, a) { const c = Math.cos(a), s = Math.sin(a); return [x * c - y * s, x * s + y * c]; }
function reflectD(dx, dy, nx, ny) {
  const d = dx * nx + dy * ny;
  return [dx - 2 * d * nx, dy - 2 * d * ny];
}
/** Snell 折射。n 需与 d 相向（d·n<0）；全反射返回 null */
function refractD(dx, dy, nx, ny, n1, n2) {
  let cosi = -(dx * nx + dy * ny);
  if (cosi > 1) cosi = 1;
  const eta = n1 / n2;
  const s2 = eta * eta * (1 - cosi * cosi);
  if (s2 > 1) return null;
  const cost = Math.sqrt(1 - s2);
  return [eta * dx + (eta * cosi - cost) * nx, eta * dy + (eta * cosi - cost) * ny];
}
/** 自动定向的折射 */
function refractO(dx, dy, nx, ny, n1, n2) {
  if (dx * nx + dy * ny > 0) { nx = -nx; ny = -ny; }
  const r = refractD(dx, dy, nx, ny, n1, n2);
  if (r) return r;
  const rr = reflectD(dx, dy, nx, ny);
  return [rr[0], rr[1], true]; // 第三项 = 发生全反射
}

/** 波长(nm) → 近似 RGB（可见光谱彩虹色） */
function wl2rgb(wl) {
  let r = 0, g = 0, b = 0;
  if (wl >= 380 && wl < 440) { r = -(wl - 440) / 60; b = 1; }
  else if (wl < 490) { g = (wl - 440) / 50; b = 1; }
  else if (wl < 510) { g = 1; b = -(wl - 510) / 20; }
  else if (wl < 580) { r = (wl - 510) / 70; g = 1; }
  else if (wl < 645) { r = 1; g = -(wl - 645) / 65; }
  else if (wl <= 780) { r = 1; }
  let f = 1;
  if (wl >= 380 && wl < 420) f = 0.3 + 0.7 * (wl - 380) / 40;
  else if (wl > 700 && wl <= 780) f = 0.3 + 0.7 * (780 - wl) / 80;
  const c = (v) => Math.round(255 * Math.pow(Math.max(0, v) * f, 0.85));
  return [c(r), c(g), c(b)];
}

function raySegHit(px, py, dx, dy, ax, ay, bx, by) {
  const ex = bx - ax, ey = by - ay;
  const den = dx * ey - dy * ex;
  if (Math.abs(den) < 1e-9) return null;
  const t = ((ax - px) * ey - (ay - py) * ex) / den;
  const s = ((ax - px) * dy - (ay - py) * dx) / den;
  if (t <= 1e-4 || s < -0.002 || s > 1.002) return null;
  return { t, x: px + dx * t, y: py + dy * t, ex, ey };
}

function pointInTri(px, py, v) {
  const s1 = (v[1].x - v[0].x) * (py - v[0].y) - (v[1].y - v[0].y) * (px - v[0].x);
  const s2 = (v[2].x - v[1].x) * (py - v[1].y) - (v[2].y - v[1].y) * (px - v[1].x);
  const s3 = (v[0].x - v[2].x) * (py - v[2].y) - (v[0].y - v[2].y) * (px - v[2].x);
  const neg = s1 < 0 || s2 < 0 || s3 < 0;
  const pos = s1 > 0 || s2 > 0 || s3 > 0;
  return !(neg && pos);
}

function toLocal(el, px, py) {
  const a = (el.ang || 0) * DGR;
  const c = Math.cos(a), s = Math.sin(a);
  const dx = px - el.x, dy = py - el.y;
  return [dx * c + dy * s, -dx * s + dy * c];
}

/* ---------------- 光学元件（自由台 & 各章共用） ---------------- */

function prismVerts(el) {
  const A = el.apex || 60;
  const hb = Math.tan(A / 2 * DGR) * el.H;
  const ca = Math.cos(el.ang * DGR), sa = Math.sin(el.ang * DGR);
  return [{ x: 0, y: el.H }, { x: -hb, y: -el.hB }, { x: hb, y: -el.hB }]
    .map((p) => ({ x: el.x + p.x * ca - p.y * sa, y: el.y + p.x * sa + p.y * ca }));
}

const ARC_SEGS = 40;

/** 半圆砖：局部坐标平面向上（直径沿 X），半圆在直径下方 */
function semicircEdges(el) {
  const edges = [];
  const pts = [];
  for (let i = 0; i <= ARC_SEGS; i++) {
    const a = Math.PI + i / ARC_SEGS * Math.PI; // 下半圆
    pts.push([Math.cos(a) * el.R, Math.sin(a) * el.R]);
  }
  const ca = Math.cos(el.ang * DGR), sa = Math.sin(el.ang * DGR);
  const map = (p) => ({ x: el.x + p[0] * ca - p[1] * sa, y: el.y + p[0] * sa + p[1] * ca });
  const w = pts.map(map);
  edges.push({ ax: w[ARC_SEGS].x, ay: w[ARC_SEGS].y, bx: w[0].x, by: w[0].y }); // 直径
  for (let i = 0; i < ARC_SEGS; i++) {
    edges.push({ ax: w[i].x, ay: w[i].y, bx: w[i + 1].x, by: w[i + 1].y });
  }
  return edges;
}

function brickEdges(el) {
  const ca = Math.cos(el.ang * DGR), sa = Math.sin(el.ang * DGR);
  const hw = el.w / 2, hh = el.h / 2;
  const cs = [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]]
    .map((p) => ({ x: el.x + p[0] * ca - p[1] * sa, y: el.y + p[0] * sa + p[1] * ca }));
  return [0, 1, 2, 3].map((i) => ({ ax: cs[i].x, ay: cs[i].y, bx: cs[(i + 1) % 4].x, by: cs[(i + 1) % 4].y }));
}

function elementEdges(el) {
  if (el.type === 'mirror') {
    const a = el.ang * DGR, hx = Math.cos(a) * el.len, hy = Math.sin(a) * el.len;
    return [{ ax: el.x - hx, ay: el.y - hy, bx: el.x + hx, by: el.y + hy }];
  }
  if (el.type === 'lens') return [{ ax: el.x, ay: el.y - el.h, bx: el.x, by: el.y + el.h }];
  if (el.type === 'water') return [{ ax: el.x - el.half, ay: el.y, bx: el.x + el.half, by: el.y }];
  if (el.type === 'screen') {
    const a = el.ang * DGR, hx = Math.cos(a) * el.h, hy = Math.sin(a) * el.h;
    return [{ ax: el.x - hx, ay: el.y - hy, bx: el.x + hx, by: el.y + hy }];
  }
  if (el.type === 'semicirc') return semicircEdges(el);
  if (el.type === 'brick') return brickEdges(el);
  const v = prismVerts(el);
  return [
    { ax: v[0].x, ay: v[0].y, bx: v[1].x, by: v[1].y },
    { ax: v[1].x, ay: v[1].y, bx: v[2].x, by: v[2].y },
    { ax: v[2].x, ay: v[2].y, bx: v[0].x, by: v[0].y },
  ];
}

/** 点是否在元件介质内（折射定内外的判据） */
function insideEl(el, px, py) {
  if (el.type === 'prism') return pointInTri(px, py, prismVerts(el));
  if (el.type === 'semicirc') {
    const [lx, ly] = toLocal(el, px, py);
    return lx * lx + ly * ly <= el.R * el.R && ly <= 0.01;
  }
  if (el.type === 'brick') {
    const [lx, ly] = toLocal(el, px, py);
    return Math.abs(lx) <= el.w / 2 + 0.01 && Math.abs(ly) <= el.h / 2 + 0.01;
  }
  return false;
}

/** 屏上光斑收集器（自由台光屏接收光） */
const screenHits = [];

/** 通用光线追踪：镜面反射 / 棱镜·水面·半圆砖·长方砖折射(含全反射) / 薄透镜偏折(含凹) / 光屏挡光 */
function traceRay(px, py, dx, dy, elements, opts = {}) {
  const maxSeg = opts.maxSeg || 16;
  const collectScreens = opts.collectScreens === true;
  if (collectScreens) screenHits.length = 0;
  const segs = [];
  let x = px, y = py, ux = dx, uy = dy;
  for (let i = 0; i < maxSeg; i++) {
    let best = null;
    for (const el of elements) {
      for (const e of elementEdges(el)) {
        const h = raySegHit(x, y, ux, uy, e.ax, e.ay, e.bx, e.by);
        if (h && h.t > 1e-4 && (!best || h.t < best.t)) best = Object.assign(h, { el });
      }
    }
    if (!best) {
      segs.push({ ax: x, ay: y, bx: x + ux * 900, by: y + uy * 900 });
      break;
    }
    segs.push({ ax: x, ay: y, bx: best.x, by: best.y });
    x = best.x; y = best.y;
    const el = best.el;
    if (el.type === 'mirror') {
      const L = Math.hypot(best.ex, best.ey) || 1;
      const r = reflectD(ux, uy, best.ey / L, -best.ex / L);
      ux = r[0]; uy = r[1];
    } else if (el.type === 'lens') {
      if (Math.abs(ux) > 1e-6) {
        const m = uy / ux;
        const hh = y - el.y;
        const m2 = m - hh / el.f;
        const inv = 1 / Math.hypot(1, m2);
        const s = ux > 0 ? 1 : -1;
        ux = s * inv; uy = m2 * s * inv;
      }
    } else if (el.type === 'water') {
      const fromWater = uy > 0; // 向上运动 = 从水中射向空气
      const r = refractO(ux, uy, 0, 1, fromWater ? N_WATER : 1, fromWater ? 1 : N_WATER);
      ux = r[0]; uy = r[1];
    } else if (el.type === 'screen') {
      if (collectScreens) screenHits.push({ x, y, el });
      break;
    } else if (el.type === 'prism' || el.type === 'semicirc' || el.type === 'brick') {
      const fromIn = insideEl(el, x - ux * 0.8, y - uy * 0.8);
      const nP = opts.nPrism || el.n || 1.52;
      const eL = Math.hypot(best.ex, best.ey) || 1;
      const r = refractO(ux, uy, best.ey / eL, -best.ex / eL, fromIn ? nP : 1, fromIn ? 1 : nP);
      ux = r[0]; uy = r[1];
    }
    const Ln = Math.hypot(ux, uy) || 1;
    ux /= Ln; uy /= Ln;
    x += ux * 0.02; y += uy * 0.02;
    if (Math.abs(x) > 1500 || Math.abs(y) > 1100) break;
  }
  return segs;
}

/* ---------------- 暗室工艺：台面 / 导轨 / 仪器造型（程序化矢量） ---------------- */

/** 光学导轨：底座横梁 + 双轨 + 标尺刻度与数字 + 支脚 + 接触阴影 */
function drawBenchRail(y0, halfLen, opts = {}) {
  shadowBlob(0, y0 - 3, halfLen * 0.94, 0.22, 0.34);
  const beamH = 7;
  fillRectW(-halfLen, y0 - beamH, halfLen, y0, '#232c38');
  fillRectW(-halfLen, y0 - beamH, halfLen, y0 - beamH * 0.45, '#2d3948');
  lineW(-halfLen, y0 - beamH, halfLen, y0 - beamH, '#3d4a5c', 1);
  // 双轨
  for (const dy of [beamH * 0.62, beamH * 0.24]) {
    lineW(-halfLen, y0 - dy, halfLen, y0 - dy, '#5a6b82', 2);
    lineW(-halfLen, y0 - dy - 1.1, halfLen, y0 - dy - 1.1, 'rgba(200,220,240,0.28)', 0.7);
  }
  // 标尺刻度（每 5 一小格，每 10 一大格 + 数字）
  const step = opts.step || 50;
  ctx.font = '9px -apple-system, "PingFang SC", sans-serif';
  ctx.textAlign = 'center';
  for (let t = -halfLen + step / 2; t < halfLen; t += step / 2) {
    const major = Math.round(t / step) % 2 === 0;
    const [sx, sy] = W2S(t, y0 - beamH);
    ctx.strokeStyle = major ? 'rgba(190,205,225,0.5)' : 'rgba(150,170,195,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx, sy + (major ? 7 : 4)); ctx.stroke();
    if (major && (t / step) % 4 === 0) {
      ctx.fillStyle = 'rgba(150,168,192,0.55)';
      ctx.fillText(String(t), sx, sy + 16);
    }
  }
  // 支脚
  for (const px of [-halfLen * 0.82, halfLen * 0.82]) {
    fillRectW(px - 16, y0 - beamH - 2, px + 16, y0 - beamH + 3, '#1c2430');
    lineW(px - 10, y0, px + 10, y0, '#161d27', 4);
  }
}

/** 滑块底座（导轨上的可动件底座） */
function drawBenchCarriage(x, y0, w = 44, label) {
  fillRectW(x - w / 2, y0 - 26, x + w / 2, y0 - 6, '#2a3543');
  fillRectW(x - w / 2, y0 - 26, x + w / 2, y0 - 20, '#39465a');
  lineW(x - w / 2, y0 - 6, x + w / 2, y0 - 6, '#161d27', 3);
  circleW(x - 12, y0 - 16, 3.4, '#6d7f97', 1.2, '#1e2631');
  circleW(x + 12, y0 - 16, 3.4, '#6d7f97', 1.2, '#1e2631');
  if (label) textW(label, x, y0 + 14, { color: '#7d8fa6', size: 10.5 });
}

/** 激光器壳体：散热鳍片 + 出光筒 + 指示灯 + 标签 + 调整架 */
function drawLaserBox(x, y, angDeg, col, label) {
  const a = angDeg * DGR;
  const c = Math.cos(a), s = Math.sin(a);
  const L = 64, H = 26;
  const local = (lx, ly) => [x + lx * c - ly * s, y + lx * s + ly * c];
  // 接触阴影与支杆
  shadowBlob(x, y - 22, 44, 0.24, 0.4);
  const [px1, py1] = local(-L * 0.28, 0);
  const [px2, py2] = local(L * 0.3, 0);
  lineW(px1, py1 - 4, px1, py1 - 22, '#43506a', 4);
  lineW(px2, py2 - 4, px2, py2 - 22, '#43506a', 4);
  circleW(px1, py1 - 22, 4, '#5a6b85', 1.3, '#232c3a');
  circleW(px2, py2 - 22, 4, '#5a6b85', 1.3, '#232c3a');
  // 壳体（旋转矩形）
  const corn = [[-L / 2, -H / 2], [L / 2, -H / 2], [L / 2, H / 2], [-L / 2, H / 2]].map((p) => local(p[0], -p[1]));
  fillPolyW(corn, '#31405480', null);
  const grad = ctx.createLinearGradient(...W2S(x, y + H), ...W2S(x, y - H));
  grad.addColorStop(0, '#3d4e68');
  grad.addColorStop(0.45, '#2b3850');
  grad.addColorStop(1, '#1d2838');
  fillPolyW(corn, grad, '#56678a', 1.3);
  // 散热鳍片
  for (let i = -2; i <= 2; i++) {
    if (Math.abs(i) < 0.5) continue;
    const [fx1, fy1] = local(i * 11 - 3, H / 2);
    const [fx2, fy2] = local(i * 11 + 3, H / 2);
    lineW(fx1, fy1, fx2, fy2, '#44546e', 2.4);
  }
  // 出光筒
  const [nx1, ny1] = local(L / 2, -4);
  const [nx2, ny2] = local(L / 2 + 16, -4);
  lineW(nx1, ny1, nx2, ny2, '#7488a8', 5);
  lineW(nx1, ny1 - 3.5, nx2, ny2 - 3.5, 'rgba(210,225,245,0.4)', 1);
  circleW(nx2, ny2, 2.6, null, 0, col);
  // 指示灯 + 标签
  const [lx, ly] = local(-L / 2 + 12, H / 2 - 7);
  circleW(lx, ly, 2.4, null, 0, '#7dff9e');
  const [tx, ty] = local(-L * 0.06, -2);
  ctx.save();
  ctx.translate(...W2S(tx, ty));
  ctx.rotate(-a);
  ctx.font = '9.5px -apple-system, "PingFang SC", sans-serif';
  ctx.fillStyle = 'rgba(200,215,235,0.75)';
  ctx.textAlign = 'center';
  ctx.fillText(label || 'LASER', 0, 0);
  ctx.restore();
}

/** 全圆量角盘：双圈刻度 + 数字 + 中心销 + 可折转半盘（fold: 0..1） */
function drawProtractor(cx, cy, R, rotDeg, fold = 0, foldSide = 1) {
  const rot = rotDeg * DGR;
  // 盘体底盘
  ctx.globalAlpha = 0.9;
  circleW(cx, cy, R, 'rgba(150,175,205,0.5)', 1.6, 'rgba(120,150,190,0.05)');
  circleW(cx, cy, R - 9, 'rgba(150,175,205,0.28)', 1);
  ctx.globalAlpha = 1;
  // 刻度：全圆双排（法线为 0/180，镜向为 ±90），下半圈镜像读数
  ctx.font = '9px -apple-system, "PingFang SC", sans-serif';
  ctx.textAlign = 'center';
  for (let d = -180; d < 180; d += 5) {
    const a = rot + Math.PI / 2 - d * DGR;
    const mag = Math.abs(d);
    const major = mag % 30 === 0;
    const mid = mag % 10 === 0;
    const r1 = R - 9;
    const r0 = r1 - (major ? 13 : mid ? 9 : 5);
    const [x1, y1] = W2S(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
    const [x2, y2] = W2S(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
    ctx.strokeStyle = major ? 'rgba(185,205,230,0.6)' : mid ? 'rgba(160,180,205,0.42)' : 'rgba(140,160,185,0.24)';
    ctx.lineWidth = major ? 1.3 : 0.8;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    if (major && mag > 0 && mag < 180 && mag % 20 === 0) {
      const val = mag <= 90 ? mag : 180 - mag; // 下半圈镜像刻度
      const [nx, ny] = W2S(cx + Math.cos(a) * (r1 - 24), cy + Math.sin(a) * (r1 - 24));
      ctx.fillStyle = 'rgba(165,185,212,0.7)';
      ctx.fillText(String(val), nx, ny);
    }
  }
  // 0°（法线两端，青色）与 90°（镜面两端，金色）
  for (const sd of [0, 180]) {
    const a = rot + Math.PI / 2 - sd * DGR;
    const [zx, zy] = W2S(cx + Math.cos(a) * (R - 30), cy + Math.sin(a) * (R - 30));
    ctx.fillStyle = 'rgba(127,209,255,0.85)';
    ctx.font = '600 9.5px -apple-system, sans-serif';
    ctx.fillText('0', zx, zy);
  }
  for (const sd of [-90, 90]) {
    const a = rot + Math.PI / 2 - sd * DGR;
    const [mx2, my2] = W2S(cx + Math.cos(a) * (R - 22), cy + Math.sin(a) * (R - 22));
    ctx.fillStyle = 'rgba(255,212,121,0.8)';
    ctx.font = '600 9px -apple-system, sans-serif';
    ctx.fillText('90', mx2, my2);
  }
  // 可折转的反射侧半盘（绕法线轴向下翻 → 纵向压扁模拟）
  if (fold > 0.01) {
    const a0 = rot + Math.PI / 2;
    const n = 30;
    ctx.globalAlpha = 0.55 * fold + 0.18;
    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const a = a0 - Math.PI * i / n;
      const [sx, sy] = W2S(cx + Math.cos(a) * (R - 4), cy + Math.sin(a) * (R - 4) * (1 - fold * 0.86));
      if (i === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
    }
    for (let i = n; i >= 0; i--) {
      const a = a0 - Math.PI * i / n;
      const [sx, sy] = W2S(cx + Math.cos(a) * (R - 13), cy + Math.sin(a) * (R - 13) * (1 - fold * 0.86));
      ctx.lineTo(sx, sy);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(120,150,190,0.10)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(150,175,205,0.35)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  // 中心销
  circleW(cx, cy, 5.5, '#9fb2c8', 1.6, '#2b3646');
  circleW(cx, cy, 2, null, 0, '#ffd479');
}

/** 蜡烛：烛身 + 烛泪 + 烛芯 + 火焰（随 t 摇曳）+ 接触阴影 */
function drawCandle(x, baseY, h, lit, t, label, dim = false) {
  const w = 13;
  shadowBlob(x, baseY, w * 1.6, 0.3, 0.42);
  fillRectW(x - w / 2, baseY, x + w / 2, baseY + h, '#e8dbc2');
  fillRectW(x - w / 2, baseY, x + w / 2, baseY + 5, '#d9c9a8');
  lineW(x - w / 2, baseY + h, x + w / 2, baseY + h, 'rgba(120,100,75,0.4)', 1);
  // 烛泪
  fillPolyW([[x - w / 2, baseY + h - 4], [x - w / 2 + 2.5, baseY + h + 3], [x - w / 2 + 4.5, baseY + h - 2]], '#f2e8d2', null);
  fillPolyW([[x + w / 2, baseY + h - 6], [x + w / 2 - 2, baseY + h + 1], [x + w / 2 - 4, baseY + h - 3]], '#f2e8d2', null);
  // 烛芯
  lineW(x, baseY + h, x, baseY + h + 6, '#3a3128', 1.4);
  if (lit) {
    const fl = Math.sin(t * 9.7) * 1.6 + Math.sin(t * 23.3) * 0.9;
    const fy = baseY + h + 6;
    const fh = 17 + fl;
    const g = ctx.createRadialGradient(...W2S(x, fy + fh * 0.42), 1, ...W2S(x, fy + fh * 0.42), fh * view.k * 0.85);
    g.addColorStop(0, 'rgba(255,244,205,0.95)');
    g.addColorStop(0.5, 'rgba(255,190,92,0.75)');
    g.addColorStop(1, 'rgba(255,140,50,0)');
    pathW([[x - 4.5, fy], [x - 2.5, fy + fh * 0.55], [x, fy + fh], [x + 2.5, fy + fh * 0.55], [x + 4.5, fy]]);
    ctx.fillStyle = g; ctx.fill();
    pathW([[x - 2.2, fy], [x, fy + fh * 0.62], [x + 2.2, fy]]);
    ctx.fillStyle = 'rgba(255,252,235,0.95)'; ctx.fill();
    // 烛光晕
    circleW(x, fy + fh * 0.3, 26 + fl * 2, null, 0, 'rgba(255,190,100,0.05)');
  }
  if (label) textW(label, x, baseY - 12, { color: dim ? 'rgba(255,176,143,0.7)' : '#ff8f6b', size: 11.5, bold: true });
}

/** 玻璃板：半透明面板 + 边缘高光 + 底座支架 */
function drawGlassPane(x, topY, botY, label) {
  const w = 9;
  fillRectW(x - w / 2, botY, x + w / 2, topY, 'rgba(150,195,235,0.10)');
  lineW(x - w / 2, botY, x - w / 2, topY, 'rgba(190,220,245,0.55)', 1.6);
  lineW(x + w / 2, botY, x + w / 2, topY, 'rgba(190,220,245,0.4)', 1.2);
  lineW(x - w / 2, topY, x + w / 2, topY, 'rgba(190,220,245,0.5)', 1.4);
  lineW(x - w / 2, botY, x + w / 2, botY, 'rgba(190,220,245,0.5)', 1.4);
  // 斜高光
  ctx.save();
  ctx.globalAlpha = 0.16;
  for (let yy = topY + 16; yy < botY - 12; yy += 34) {
    lineW(x - w / 2 + 1.5, yy, x + w / 2 - 1.5, yy + 13, '#bcd8ef', 2);
  }
  ctx.restore();
  // 底座
  fillRectW(x - 30, botY - 4, x + 30, botY, '#2a3543');
  shadowBlob(x, botY, 42, 0.28, 0.4);
  if (label) textW(label, x, topY - 14, { color: '#9fc4e0', size: 12 });
}

/** 白屏光屏 + 支架（自由台 / 光具座共用） */
function drawScreenStand(x, y0, h, label) {
  shadowBlob(x, y0, 30, 0.28, 0.4);
  lineW(x, y0, x, y0 + h * 0.4, '#43506a', 4);
  fillRectW(x - 5, y0 + h / 2 - 4, x + 5, y0 + h / 2 + 4, '#39465a');
  fillRectW(x - 4.5, y0 + h * 0.4, x + 4.5, y0 + h * 0.4 + h, '#c9d4e2');
  fillRectW(x - 4.5, y0 + h * 0.4, x + 2, y0 + h * 0.4 + h, 'rgba(255,255,255,0.16)');
  lineW(x - 4.5, y0 + h * 0.4, x - 4.5, y0 + h * 0.4 + h, '#eef3f9', 1);
  lineW(x + 4.5, y0 + h * 0.4, x + 4.5, y0 + h * 0.4 + h, '#8b98a8', 1);
  if (label) textW(label, x, y0 + h * 0.4 + h + 14, { color: '#aebdd0', size: 11 });
}

/** 透镜支架：框架 + 上下夹爪 + 底杆 */
function drawLensHolder(x, y0, h, label, concave = false) {
  shadowBlob(x, y0, 34, 0.28, 0.4);
  lineW(x, y0 - 4, x, y0 + h / 2 + 6, '#43506a', 4);
  fillRectW(x - 20, y0 + h / 2, x + 20, y0 + h / 2 + 7, '#2a3543');
  const cw2 = 12;
  lineW(x - cw2, y0 + h / 2 + 2, x - cw2, y0 + h / 2 + 2 - 14, '#5a6b82', 2.4);
  lineW(x + cw2, y0 + h / 2 + 2, x + cw2, y0 + h / 2 + 2 - 14, '#5a6b82', 2.4);
  circleW(x - cw2, y0 + h / 2 - 12, 2.2, null, 0, '#8b98a8');
  circleW(x + cw2, y0 + h / 2 - 12, 2.2, null, 0, '#8b98a8');
  if (label) textW(label, x, y0 + h / 2 + 22, { color: '#9fc4e0', size: 11 });
  return concave;
}

/** 暗角氛围：四角渐晕 + 顶部微暗（每帧最后叠加，保持画面叙事统一） */
function vignette() {
  const g = ctx.createRadialGradient(cw / 2, chh / 2, Math.min(cw, chh) * 0.42, cw / 2, chh / 2, Math.max(cw, chh) * 0.78);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(2,4,8,0.30)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, cw, chh);
}

/* ---------------- HUD / 提示 ---------------- */

const hudSlot = document.createElement('div');
hudSlot.className = 'lab-hud';
document.getElementById('lcData').appendChild(hudSlot);
let hud = null;
function setHUD(rows) {
  hudSlot.innerHTML = '';
  hud = rows && rows.length ? makeHUD(hudSlot, rows) : null;
  if (!hud) hudSlot.classList.add('dock-hud-hidden');
  else hudSlot.classList.remove('dock-hud-hidden');
}
function hideHUD() { hudSlot.innerHTML = ''; hud = null; hudSlot.classList.add('dock-hud-hidden'); }

let hintEl = null;
function setHint(text) {
  if (!text) { if (hintEl) { hintEl.remove(); hintEl = null; } return; }
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

/* ---------------- 数据坞：逐组记入数据表 + 关系图像 + CSV 下载 ---------------- */

const dock = (() => {
  const lcData = document.getElementById('lcData');
  const box = document.createElement('div');
  box.className = 'dock';
  lcData.appendChild(box);
  let st = { header: [], rows: [], chart: null, note: '', title: '', onRecord: null, csvName: 'optics' };
  let chartCv = null;

  function fmtCell(v) {
    if (typeof v === 'number') return Number.isInteger(v) ? String(v) : v.toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
    return String(v);
  }

  function render() {
    box.innerHTML = '';
    box.classList.toggle('dock-empty', st.header.length === 0);
    if (!st.header.length) return;
    const head = document.createElement('div');
    head.className = 'dock-head';
    head.innerHTML = '实验数据表<span class="dock-name"></span>';
    head.querySelector('.dock-name').textContent = st.title;
    box.appendChild(head);
    // 按钮行
    const btns = document.createElement('div');
    btns.className = 'dock-btns';
    if (st.onRecord) {
      const bRec = document.createElement('button');
      bRec.type = 'button';
      bRec.className = 'dock-btn primary';
      bRec.textContent = '记入数据表';
      bRec.addEventListener('click', () => {
        const row = st.onRecord();
        if (row) st.rows.push(row);
        render();
      });
      btns.appendChild(bRec);
    }
    if (st.rows.length) {
      const bCsv = document.createElement('button');
      bCsv.type = 'button';
      bCsv.className = 'dock-btn';
      bCsv.textContent = '下载 CSV';
      bCsv.addEventListener('click', exportCsv);
      btns.appendChild(bCsv);
      const bClr = document.createElement('button');
      bClr.type = 'button';
      bClr.className = 'dock-btn';
      bClr.textContent = '清空';
      bClr.addEventListener('click', () => { st.rows = []; render(); });
      btns.appendChild(bClr);
    }
    box.appendChild(btns);
    // 数据表
    if (st.rows.length) {
      const wrapEl = document.createElement('div');
      wrapEl.className = 'dock-table-wrap';
      const tb = document.createElement('table');
      tb.className = 'dock-table';
      const trh = document.createElement('tr');
      st.header.forEach((h) => {
        const th = document.createElement('th');
        th.textContent = h;
        trh.appendChild(th);
      });
      tb.appendChild(trh);
      st.rows.slice(-40).forEach((row) => {
        const tr = document.createElement('tr');
        row.forEach((v) => {
          const td = document.createElement('td');
          td.textContent = fmtCell(v);
          tr.appendChild(td);
        });
        tb.appendChild(tr);
      });
      wrapEl.appendChild(tb);
      box.appendChild(wrapEl);
    } else {
      const emp = document.createElement('div');
      emp.className = 'dock-empty-row';
      emp.textContent = st.onRecord ? '调整实验状态后点「记入数据表」，逐组保存测量值。' : '（本章无记数项，上方为实时读数）';
      box.appendChild(emp);
    }
    // 关系图像
    if (st.chart && st.rows.length >= 2) {
      if (!chartCv) {
        chartCv = document.createElement('canvas');
        chartCv.className = 'dock-chart';
      }
      const w = 316, hh = 178, r = Math.min(window.devicePixelRatio || 1, 2);
      chartCv.width = w * r; chartCv.height = hh * r;
      chartCv.style.height = hh + 'px';
      const c2 = chartCv.getContext('2d');
      c2.setTransform(r, 0, 0, r, 0, 0);
      c2.clearRect(0, 0, w, hh);
      if (st.chart === 'sin') drawSinChart(c2, w, hh, st.rows);
      else drawUvChart(c2, w, hh, st.rows);
      box.appendChild(chartCv);
    }
    if (st.note) {
      const note = document.createElement('div');
      note.className = 'dock-note';
      note.innerHTML = st.note;
      box.appendChild(note);
    }
  }

  function exportCsv() {
    const lines = [st.header.join(',')].concat(st.rows.map((r) => r.map(fmtCell).join(',')));
    const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = st.csvName + '-' + new Date().toISOString().slice(0, 10) + '.csv';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    setHint('已下载数据表 ' + a.download);
  }

  function drawSinChart(c2, w, hh, rows) {
    const mL = 34, mB = 24, mT = 12, mR = 10;
    const pw = w - mL - mR, ph = hh - mB - mT;
    // 轴 + 网格
    c2.strokeStyle = 'rgba(150,170,195,0.3)';
    c2.lineWidth = 1;
    c2.beginPath();
    for (let i = 0; i <= 4; i++) {
      const gx = mL + pw * i / 4;
      c2.moveTo(gx, mT); c2.lineTo(gx, mT + ph);
      const gy = mT + ph - ph * i / 4;
      c2.moveTo(mL, gy); c2.lineTo(mL + pw, gy);
    }
    c2.stroke();
    c2.strokeStyle = 'rgba(190,205,230,0.6)';
    c2.beginPath(); c2.moveTo(mL, mT + ph); c2.lineTo(mL + pw, mT + ph); c2.moveTo(mL, mT); c2.lineTo(mL, mT + ph); c2.stroke();
    c2.font = '9.5px -apple-system, sans-serif';
    c2.fillStyle = 'rgba(160,178,200,0.85)';
    c2.textAlign = 'center';
    for (let i = 0; i <= 4; i++) c2.fillText((i / 4).toFixed(2), mL + pw * i / 4, hh - 10);
    c2.textAlign = 'right';
    for (let i = 0; i <= 4; i++) c2.fillText((i / 4).toFixed(2), mL - 4, mT + ph - ph * i / 4 + 3);
    c2.textAlign = 'left';
    c2.fillText('sinθ₁', mL + pw - 2, mT + ph + 14);
    c2.save();
    c2.translate(10, mT + 2);
    c2.fillText('sinθ₂', 0, 8);
    c2.restore();
    // 拟合：过原点直线 slope = Σxy / Σx²
    let sxy = 0, sxx = 0;
    rows.forEach((r) => { sxy += r[2] * r[3]; sxx += r[2] * r[2]; });
    const slope = sxx > 1e-9 ? sxy / sxx : 0;
    c2.strokeStyle = 'rgba(255,212,121,0.85)';
    c2.lineWidth = 1.4;
    c2.beginPath();
    c2.moveTo(mL, mT + ph - ph * clamp(0, 0, 1));
    c2.lineTo(mL + pw, mT + ph - ph * clamp(slope, 0, 1.05));
    c2.stroke();
    // 散点
    rows.forEach((r) => {
      const px = mL + pw * clamp(r[2], 0, 1);
      const py = mT + ph - ph * clamp(r[3], 0, 1.05);
      c2.fillStyle = '#8dffb0';
      c2.beginPath(); c2.arc(px, py, 3, 0, TAU_); c2.fill();
    });
    // 标注
    c2.fillStyle = 'rgba(255,212,121,0.95)';
    c2.font = '600 10.5px -apple-system, sans-serif';
    c2.textAlign = 'left';
    c2.fillText('斜率 k = ' + slope.toFixed(3) + ' ≈ n', mL + 8, mT + 13);
  }

  function drawUvChart(c2, w, hh, rows) {
    const mL = 40, mB = 24, mT = 12, mR = 10;
    const pw = w - mL - mR, ph = hh - mB - mT;
    let xmax = 0.12, ymin = -0.05, ymax = 0.14;
    rows.forEach((r) => { xmax = Math.max(xmax, r[2] * 1.08); ymax = Math.max(ymax, r[3] * 1.12); ymin = Math.min(ymin, r[3] * 1.12 - 0.01); });
    const X = (v) => mL + pw * v / xmax;
    const Y = (v) => mT + ph - (v - ymin) / (ymax - ymin) * ph;
    c2.strokeStyle = 'rgba(150,170,195,0.3)';
    c2.lineWidth = 1;
    c2.beginPath();
    const ny = 4;
    for (let i = 0; i <= ny; i++) {
      const gy = mT + ph * i / ny;
      c2.moveTo(mL, gy); c2.lineTo(mL + pw, gy);
    }
    for (let i = 0; i <= 4; i++) {
      const gx = mL + pw * i / 4;
      c2.moveTo(gx, mT); c2.lineTo(gx, mT + ph);
    }
    c2.stroke();
    c2.strokeStyle = 'rgba(190,205,230,0.6)';
    c2.beginPath();
    c2.moveTo(mL, Y(0)); c2.lineTo(mL + pw, Y(0));
    c2.moveTo(X(0), mT); c2.lineTo(X(0), mT + ph);
    c2.stroke();
    c2.font = '9.5px -apple-system, sans-serif';
    c2.fillStyle = 'rgba(160,178,200,0.85)';
    c2.textAlign = 'center';
    for (let i = 0; i <= 4; i++) c2.fillText((xmax * i / 4).toFixed(2), mL + pw * i / 4, hh - 10);
    c2.textAlign = 'right';
    c2.fillText('0', mL - 4, Y(0) + 3);
    c2.fillText('1/v', mL + pw - 2, Y(0) - 6);
    c2.save();
    c2.translate(10, mT + 10);
    c2.fillText('1/u', 0, 0);
    c2.restore();
    // 最小二乘拟合 y = kx + b
    const n = rows.length;
    let sx = 0, sy = 0, sxx = 0, sxy = 0;
    rows.forEach((r) => { sx += r[2]; sy += r[3]; sxx += r[2] * r[2]; sxy += r[2] * r[3]; });
    const k = (n * sxy - sx * sy) / Math.max(n * sxx - sx * sx, 1e-9);
    const b = (sy - k * sx) / n;
    c2.strokeStyle = 'rgba(255,212,121,0.85)';
    c2.lineWidth = 1.4;
    c2.beginPath();
    c2.moveTo(X(0), Y(b));
    c2.lineTo(X(xmax), Y(k * xmax + b));
    c2.stroke();
    rows.forEach((r) => {
      c2.fillStyle = '#8dffb0';
      c2.beginPath(); c2.arc(X(r[2]), Y(r[3]), 3, 0, TAU_); c2.fill();
    });
    c2.fillStyle = 'rgba(255,212,121,0.95)';
    c2.font = '600 10.5px -apple-system, sans-serif';
    c2.textAlign = 'left';
    c2.fillText('截距 b = ' + b.toFixed(4) + ' ≈ 1/f', mL + 8, mT + 13);
  }

  return {
    el: box,
    build(cfg) {
      st = {
        header: cfg.header || [], rows: [], chart: cfg.chart || null,
        note: cfg.note || '', title: cfg.title || '', onRecord: cfg.onRecord || null,
        csvName: cfg.csvName || 'optics',
      };
      render();
    },
    hide() {
      st.header = [];
      box.innerHTML = '';
    },
    note(t) { st.note = t; const el = box.querySelector('.dock-note'); if (el) el.innerHTML = t; },
  };
})();

/* ---------------- 全局章节状态 ---------------- */

const S = { ch: 0 };
const C1 = { i: 40, tilt: 0, showN: true, showVals: true, fold: false, foldA: 0, revOn: false, revT: 0 };
const C2 = { dist: 130, showRays: true, showImg: true, anim: false, animT: 0, screen: false, bx: 305, over: false };
const C3 = { th1: 45, medium: 'water', showAngles: true, green: false };
const C4 = { th: 50, medium: 'water', mode: 'interface', play: true, fT: 0 };
const C5 = { apex: 60, inc: 45, white: true, labels: true, recombine: false };
const C6 = { u: 24, f: 12, showRays: true, screenX: 24, tween: null };
const C7 = { axial: 80, curv: 0.54, corr: 'none' };
const C8 = { lam: 550, d: 0.2, L: 30, white: false, mx1: -150, mx2: 150 };
const C9 = { mode: 'single', a: 0.1, lam: 550, N: 4, white: false };
const C10 = { grad: 280, light: 'white', mode: 'film', play: false, drain: 0 };
const C11 = { thA: 30, polA: 0, on: true, viz: true, mode: 'malus', volts: false };
const C12 = { angle: 15, height: 30, srcType: 'laser', selType: 'mirror', elements: [], selected: -1, dragging: null, rotating: null, addN: 0 };

const MEDIA3 = [
  { id: 'water', label: '水 n=1.33', n: N_WATER, fill: 'rgba(96,165,220,0.13)', name: '水' },
  { id: 'glass', label: '玻璃 n=1.50', n: N_GLASS, fill: 'rgba(190,215,235,0.10)', name: '玻璃' },
  { id: 'diamond', label: '钻石 n=2.42', n: N_DIAMOND, fill: 'rgba(150,220,255,0.14)', name: '钻石' },
];

/* ---------------- 光纤折线（预计算） ---------------- */

const FIBER = (() => {
  const R = 200, w = 24, p0 = -70 * DGR, p1 = 70 * DGR;
  let px = Math.cos(p0) * R, py = Math.sin(p0) * R;
  let v = norm2(-py + px * (-0.55), px + py * (-0.55)); // 切向 + 向内径向
  const pts = [[px, py]];
  const cum = [0];
  let total = 0;
  for (let i = 0; i < 5000; i++) {
    px += v[0] * 3.5; py += v[1] * 3.5;
    const r = Math.hypot(px, py);
    const ang = Math.atan2(py, px);
    if (ang > p1) { pts.push([px, py]); break; }
    const nx = px / r, ny = py / r;
    const vd = v[0] * nx + v[1] * ny;
    if (r > R + w - 1 && vd > 0) { v = norm2(v[0] - 2 * vd * nx, v[1] - 2 * vd * ny); pts.push([px, py]); }
    else if (r < R - w + 1 && vd < 0) { v = norm2(v[0] - 2 * vd * nx, v[1] - 2 * vd * ny); pts.push([px, py]); }
    total += 3.5;
    cum.push(total);
  }
  return { R, w, p0, p1, pts, cum, total };
})();

function polyPoint(pts, cum, total, f) {
  const target = clamp(f, 0, 1) * total;
  let i = 1;
  while (i < cum.length - 1 && cum[i] < target) i++;
  const t = (target - cum[i - 1]) / Math.max(cum[i] - cum[i - 1], 1e-6);
  return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t];
}

function drawPolyGlow(pts, color, alpha, coreW, from = 0, to = pts.length - 1) {
  for (let i = from; i < to; i++) {
    rayGlow(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], color, alpha, coreW);
  }
}

/* ================= 绘制：第 1 章 光的反射定律 ================= */

function drawReflection(dt) {
  const C = C1;
  const T = C.tilt * DGR;
  const nAng = Math.PI / 2 + T;
  const nx = Math.cos(nAng), ny = Math.sin(nAng);
  const cy0 = 14;
  // 台面导轨 + 支架氛围
  drawBenchRail(cy0 - 168, 240);
  // 量角盘（刻度以法线为 0°，直接读出 i 与 r）
  drawProtractor(0, cy0, 148, nAng, C.foldA, -1);
  // 平面镜（沿盘直径，可倾斜）+ 镜座
  drawMirrorSeg(-Math.cos(T) * 168, cy0 - Math.sin(T) * 168, Math.cos(T) * 168, cy0 + Math.sin(T) * 168, 1);
  textW('平面镜', Math.cos(T) * 214, cy0 + Math.sin(T) * 214, { color: '#aebdd0', size: 12 });
  if (C.showN) {
    dashW(-nx * 152, cy0 - ny * 152, nx * 152, cy0 + ny * 152, '#7fd1ff', 0.75);
    textW('法线', nx * 168, cy0 + ny * 168, { color: '#7fd1ff', size: 11.5 });
  }
  // 入射 / 反射光线
  const iAng = C.i * DGR;
  const dinAng = nAng + iAng + Math.PI;
  const dxi = Math.cos(dinAng), dyi = Math.sin(dinAng);
  const dot = dxi * nx + dyi * ny;
  const dxo = dxi - 2 * dot * nx, dyo = dyi - 2 * dot * ny;
  const L1 = 196, L2 = 196;
  rayGlow(-dxi * L1, cy0 - dyi * L1, 0, cy0, '#ff5d5d', 1, 2);
  arrowHeadW(0, cy0, dinAng, 9, '#ff5d5d');
  rayGlow(0, cy0, dxo * L2, cy0 + dyo * L2, '#ff5d5d', 1, 2);
  arrowHeadW(dxo * L2, cy0 + dyo * L2, Math.atan2(dyo, dxo), 9, '#ff5d5d');
  textW('入射光线', -dxi * L1 * 0.6, cy0 - dyi * L1 * 0.6 + 20, { color: '#ffb0a0', size: 11.5 });
  textW('反射光线', dxo * L2 * 0.6, cy0 + dyo * L2 * 0.6 + 20, { color: '#ffb0a0', size: 11.5 });
  // 激光器壳体（随滑杆在盘缘转动）
  const [lx, ly] = [-dxi * (L1 + 42), cy0 - dyi * (L1 + 42)];
  drawLaserBox(lx, ly + 6, dinAng / DGR, '#ff5d5d', '激光器');
  // 等角弧 i = r
  arcW(0, cy0, 56, nAng, nAng + iAng, '#ffd479', 1.6);
  arcW(0, cy0, 56, nAng - iAng, nAng, '#8dffb0', 1.6);
  if (C.showVals) {
    textW('i=' + C.i + '°', Math.cos(nAng + iAng / 2) * 82, cy0 + Math.sin(nAng + iAng / 2) * 82, { color: '#ffd479', size: 12.5, bold: true });
    textW('r=' + C.i + '°', Math.cos(nAng - iAng / 2) * 82, cy0 + Math.sin(nAng - iAng / 2) * 82, { color: '#8dffb0', size: 12.5, bold: true });
  }
  // 半盘折转动画（反射侧半盘向下翻）
  const tgt = C.fold ? 1 : 0;
  C.foldA += (tgt - C.foldA) * clamp(dt * 5, 0, 1);
  if (C.foldA > 0.03) {
    const fx = -Math.cos(nAng), fy = -Math.sin(nAng); // 折转半盘朝向（法线反向 = 盘下方）
    textW('折下后半盘上看不见反射光', fx * 118, cy0 + fy * 118 - 22, { color: '#8b98a8', size: 11.5 });
    textW('（光仍在，只是不在盘面所在平面）', fx * 118, cy0 + fy * 118 - 6, { color: 'rgba(139,152,168,0.7)', size: 10 });
  }
  // 光路可逆演示：绿光逆着反射光射入，沿原入射方向射出
  if (C.revOn) {
    C.revT = (C.revT + dt * 0.42) % 1;
    const f = C.revT;
    const R2 = L2 + 30;
    const sx = dxo * R2, sy2 = cy0 + dyo * R2;
    const ex = -dxi * R2, ey2 = cy0 - dyi * R2;
    rayGlow(sx, sy2, 0, cy0, '#6dffa8', 0.9, 1.8);
    rayGlow(0, cy0, ex, ey2, '#6dffa8', 0.9, 1.8);
    arrowHeadW(-dxo * 30, cy0 - dyo * 30, Math.atan2(-dyo, -dxo), 7, '#6dffa8');
    arrowHeadW(dxi * 30, cy0 + dyi * 30, Math.atan2(dyi, dxi), 7, '#6dffa8');
    // 光子点沿路径行进
    let p;
    if (f < 0.5) p = [sx + (0 - sx) * f * 2, sy2 + (cy0 - sy2) * f * 2];
    else p = [ex * ((f - 0.5) * 2), ey2 + (cy0 - ey2) * 0 + (cy0 - ey2) * ((f - 0.5) * 2)];
    circleW(p[0], p[1], 4, null, 0, 'rgba(180,255,200,0.95)');
    textW('逆着反射光射入 → 沿原入射方向射出（光路可逆）', 0, cy0 + 178, { color: '#8dffb0', size: 12 });
  }
  hud.set('i', C.i + '°');
  hud.set('r', C.i + '°');
  hud.set('t', C.tilt + '°');
}

/* ================= 绘制：第 2 章 平面镜成像（玻璃板 · 双蜡烛） ================= */

function drawGhostCandle(x, baseY, h, label) {
  const w = 13;
  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.setLineDash([5, 4]);
  fillRectW(x - w / 2, baseY, x + w / 2, baseY + h, 'rgba(255,176,143,0.10)');
  ctx.strokeStyle = '#ffb08f'; ctx.lineWidth = 1.2;
  pathW([[x - w / 2, baseY], [x + w / 2, baseY], [x + w / 2, baseY + h], [x - w / 2, baseY + h]], true);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
  lineW(x, baseY + h, x, baseY + h + 6, 'rgba(255,176,143,0.5)', 1.2);
  if (label) textW(label, x, baseY + h + 20, { color: 'rgba(255,176,143,0.85)', size: 11.5, bold: true });
}

function drawMirrorImage(dt, t) {
  const C = C2;
  const mx = 150, top = 168, bot = -168, floorY = -96;
  // 台面 + 标尺
  drawBenchRail(floorY, 300);
  drawGlassPane(mx, top, bot, '玻璃板');
  const h = 72, baseY = floorY + 5, tipy = baseY + h;
  const ax = mx - C.dist;
  const ix = 2 * mx - ax;
  // 物体蜡烛 A（点燃，位置固定）
  drawCandle(ax, baseY, h, true, t, '蜡烛 A（点燃）');
  // 虚像（A 关于玻璃板对称的虚像）
  if (C.showImg) drawGhostCandle(ix, baseY, h, 'A 的虚像');
  // 蜡烛 B（未点燃，可拖动；与像完全重合时如同被点亮）
  const bOver = Math.abs(C.bx - ix) < 7;
  C.over = bOver;
  drawCandle(C.bx, baseY, h, false, t, null, true);
  if (bOver) {
    // 重合态：B 处出现烛焰光晕，仿佛 B 也被点燃
    const fl = Math.sin(t * 9.7) * 1.4;
    circleW(C.bx, tipy + 14, 30 + fl, null, 0, 'rgba(255,190,100,0.10)');
    drawCandle(C.bx, baseY, h, true, t * 0 + t, null, true);
    textW('蜡烛 B（与像完全重合！）', C.bx, baseY - 14, { color: '#ffd479', size: 12, bold: true });
  } else {
    textW('蜡烛 B（拖动我）', C.bx, baseY - 14, { color: '#c7d2de', size: 11.5 });
  }
  // 光屏放到像点位置：验证虚像无法被承接
  if (C.screen) {
    drawScreenStand(ix, floorY + 2, 96, null);
    fillRectW(ix - 4.5, floorY + 2 + 40, ix + 4.5, floorY + 2 + 40 + 84, '#dde5ee');
    textW('屏上无像（虚像不能被承接）', ix, floorY + 2 + 34, { color: '#8b98a8', size: 11, bold: true });
  }
  // 成像光路
  if (C.showRays) {
    const RC = '#ffe066';
    dashW(mx, tipy - 30, mx, tipy + 30, '#7fd1ff', 0.7);
    dashW(mx, -24 - 30, mx, -24 + 30, '#7fd1ff', 0.7);
    // 光线 A：垂直入射，原路折返
    rayGlow(ax, tipy, mx, tipy, RC, 1, 1.6);
    rayGlow(mx, tipy, ax - 108, tipy, RC, 0.72, 1.6);
    arrowHeadW(ax - 108, tipy, Math.PI, 7, RC);
    if (C.showImg) dashW(mx, tipy, ix, tipy, 'rgba(255,224,102,0.55)', 1);
    // 光线 B：斜入射，反射光线的反向延长线过像点
    let dx = mx - ax, dy = -24 - tipy;
    const L = Math.hypot(dx, dy); dx /= L; dy /= L;
    rayGlow(ax, tipy, mx, -24, RC, 1, 1.6);
    rayGlow(mx, -24, mx - dx * 228, -24 + dy * 228, RC, 0.72, 1.6);
    arrowHeadW(mx - dx * 228, -24 + dy * 228, Math.atan2(dy, -dx), 7, RC);
    if (C.showImg) dashW(mx, -24, ix, tipy, 'rgba(255,224,102,0.55)', 1);
    // 光线动画
    if (C.anim) {
      C.animT = (C.animT + dt * 0.55) % 1;
      const f = C.animT;
      let p;
      if (f < 0.5) p = [ax + (mx - ax) * (f * 2), tipy];
      else p = [mx - (108 + (mx - ax)) * ((f - 0.5) * 2), tipy];
      circleW(p[0], p[1], 3.4, null, 0, 'rgba(255,224,102,0.95)');
      let q;
      if (f < 0.5) q = [ax + (mx - ax) * (f * 2), tipy + (-24 - tipy) * (f * 2)];
      else q = [mx - dx * 228 * ((f - 0.5) * 2), -24 + dy * 228 * ((f - 0.5) * 2)];
      circleW(q[0], q[1], 3.4, null, 0, 'rgba(255,224,102,0.95)');
    }
  }
  hud.set('p', C.dist + ' 单位');
  hud.set('q', C.dist + ' 单位');
  hud.set('ov', bOver ? '完全重合 ✓（像距 = 物距）' : '未重合（偏差 ' + Math.abs(C.bx - ix).toFixed(0) + '）');
  hud.set('scr', C.screen ? '光屏在像点处：无像' : '光屏关闭');
}

/* ================= 绘制：第 3 章 光的折射（半圆玻璃砖） ================= */

function drawSemiBlock(cx, cy, R, fill, nName) {
  // 半圆砖：直径在上（界面），半圆在下；玻璃质感 + 高光弧
  const pts = [[cx - R, cy]];
  for (let i = 0; i <= 42; i++) {
    const a = Math.PI + i / 42 * Math.PI;
    pts.push([cx + Math.cos(a) * R, cy + Math.sin(a) * R]);
  }
  pts.push([cx + R, cy]);
  fillPolyW(pts, fill, 'rgba(200,225,245,0.6)', 1.6);
  arcW(cx, cy, R - 5, Math.PI * 1.06, Math.PI * 1.94, 'rgba(230,245,255,0.35)', 1.4);
  arcW(cx, cy, R - 9, Math.PI * 1.12, Math.PI * 1.6, 'rgba(230,245,255,0.2)', 1);
  textW(nName, cx, cy - R * 0.52, { color: '#9fc4e0', size: 11.5 });
}

function drawRefraction() {
  const C = C3;
  const med = MEDIA3.find((m) => m.id === C.medium) || MEDIA3[0];
  const n2 = med.n;
  const RR = 158;
  const cy0 = 8;
  // 界面直线（直径）+ 上半空气
  lineW(-380, cy0, 380, cy0, '#9fb2c8', 2);
  drawSemiBlock(0, cy0, RR, med.fill, med.name + ' n=' + n2.toFixed(2));
  dashW(0, cy0 - 172, 0, cy0 + 40, '#7fd1ff', 0.75);
  textW('法线', 0, cy0 - 186, { color: '#7fd1ff', size: 11.5 });
  textW('空气 n=1.00', -330, cy0 + 105, { color: '#9fb2c8', size: 12.5 });
  // 激光器（随入射角绕 O 转动）
  const th1 = C.th1 * DGR;
  const col = C.green ? '#6dffa8' : '#ff5d5d';
  const dxin = Math.sin(th1), dyin = -Math.cos(th1); // 指向圆心 O
  const L1 = 228;
  const [lx, ly] = [-dxin * (L1 + 40), cy0 - dyin * (L1 + 40) + 0];
  drawLaserBox(lx, ly + 6, Math.atan2(dyin, dxin) / DGR, col, '激光器');
  // 入射光线
  rayGlow(-dxin * L1, cy0 - dyin * L1, 0, cy0, col, 1, 2);
  arrowHeadW(0, cy0, Math.atan2(dyin, dxin), 9, col);
  textW('入射光线', -dxin * L1 * 0.6, cy0 - dyin * L1 * 0.6 + 20, { color: col === '#ff5d5d' ? '#ffb0a0' : '#a0ffd0', size: 11.5 });
  // 折射：进入玻璃偏向法线；此后沿半径方向直达弧面，出射不偏折
  const sin2 = Math.sin(th1) / n2;
  const th2 = Math.asin(clamp(sin2, 0, 1));
  const dxr = Math.sin(th2), dyr = -Math.cos(th2);
  const L2 = RR + 62;
  rayGlow(0, cy0, dxr * RR, cy0 + dyr * RR, col, 1, 2);
  rayGlow(dxr * RR, cy0 + dyr * RR, dxr * L2, cy0 + dyr * L2, col, 0.85, 2);
  arrowHeadW(dxr * (RR + 40), cy0 + dyr * (RR + 40), Math.atan2(dyr, dxr), 8, col);
  textW('折射光线（沿半径出弧面，不再偏折）', dxr * L2 * 0.72, cy0 + dyr * L2 * 0.72 + 20, { color: col === '#ff5d5d' ? '#ffb0a0' : '#a0ffd0', size: 11 });
  if (C.showAngles) {
    arcW(0, cy0, 52, Math.PI / 2, Math.PI / 2 + th1, '#ffd479', 1.6);
    textW('θ₁=' + C.th1 + '°', Math.cos(Math.PI / 2 + th1 / 2) * 80, cy0 + Math.sin(Math.PI / 2 + th1 / 2) * 80, { color: '#ffd479', size: 12.5, bold: true });
    arcW(0, cy0, 52, -Math.PI / 2, -Math.PI / 2 + th2, '#8dffb0', 1.6);
    textW('θ₂=' + (th2 / DGR).toFixed(1) + '°', Math.cos(-Math.PI / 2 + th2 / 2) * 80, cy0 + Math.sin(-Math.PI / 2 + th2 / 2) * 80, { color: '#8dffb0', size: 12.5, bold: true });
  }
  hud.set('t1', C.th1 + '°');
  hud.set('t2', (th2 / DGR).toFixed(1) + '°');
  hud.set('eq', Math.sin(th1).toFixed(3) + ' = ' + (n2 * Math.sin(th2)).toFixed(3));
}

/* ================= 绘制：第 4 章 全反射与光纤 ================= */

function drawTIR() {
  const C = C4;
  if (C.mode === 'fiber') { drawFiber(); return; }
  const med = MEDIA3.find((m) => m.id === C.medium) || MEDIA3[0];
  const n1 = med.n;
  const thC = Math.asin(1 / n1) / DGR;
  fillRectW(-430, -260, 430, 0, med.fill);
  lineW(-430, 0, 430, 0, '#9fb2c8', 2);
  dashW(0, -175, 0, 175, '#7fd1ff', 0.75);
  textW('法线', 0, 190, { color: '#7fd1ff', size: 11.5 });
  textW('空气 n=1.00', 330, 105, { color: '#9fb2c8', size: 12.5 });
  textW(med.name + ' n=' + n1.toFixed(2), 330, -105, { color: '#9fb2c8', size: 12.5 });
  const th = C.th * DGR;
  // 入射：来自下方（光密介质），朝右上
  const backAng = -Math.PI / 2 - th;
  const dinAng = backAng + Math.PI;
  const dxi = Math.cos(dinAng), dyi = Math.sin(dinAng);
  const L1 = 240, L2 = 245;
  rayGlow(-dxi * L1, -dyi * L1, 0, 0, '#ff5d5d', 1, 2);
  arrowHeadW(0, 0, dinAng, 9, '#ff5d5d');
  const isTIR = C.th >= thC - 0.05;
  // 反射光
  const rr = reflectD(dxi, dyi, 0, -1);
  const ra = Math.atan2(rr[1], rr[0]);
  rayGlow(0, 0, rr[0] * L2, rr[1] * L2, '#ff5d5d', isTIR ? 1 : 0.45, 2);
  arrowHeadW(rr[0] * L2, rr[1] * L2, ra, 9, '#ff5d5d');
  textW('反射光线', rr[0] * L2 * 0.6, rr[1] * L2 * 0.6 + 20, { color: '#ffb0a0', size: 11.5 });
  // 折射光
  if (!isTIR) {
    const dt2 = refractD(dxi, dyi, 0, -1, n1, 1);
    const aR = Math.atan2(dt2[1], dt2[0]);
    const fade = clamp((thC - C.th) / 12, 0.18, 1);
    rayGlow(0, 0, dt2[0] * L2, dt2[1] * L2, '#ff5d5d', fade, 1.2 + fade);
    arrowHeadW(dt2[0] * L2, dt2[1] * L2, aR, 9 * fade + 4, '#ff5d5d');
    textW('折射光线', dt2[0] * L2 * 0.55, dt2[1] * L2 * 0.55 + 18, { color: '#ffb0a0', size: 11.5 });
    arcW(0, 0, 52, dt2 ? aR : 0, Math.PI / 2, '#8dffb0', 1.6);
    textW('θ₂=' + ((Math.PI / 2 - aR) / DGR).toFixed(1) + '°', Math.cos((Math.PI / 2 + aR) / 2) * 80, Math.sin((Math.PI / 2 + aR) / 2) * 80, { color: '#8dffb0', size: 12 });
  } else {
    textW('✕ 折射光消失（全反射）', 0, 120, { color: '#ff9d76', size: 13.5, bold: true });
  }
  // 入射角弧（介质内侧）
  arcW(0, 0, 52, backAng, -Math.PI / 2, '#ffd479', 1.6);
  textW('θ₁=' + C.th + '°', Math.cos((backAng - Math.PI / 2) / 2) * 80, Math.sin((backAng - Math.PI / 2) / 2) * 80, { color: '#ffd479', size: 12.5, bold: true });
  hud.set('tc', thC.toFixed(1) + '°');
  hud.set('ti', C.th + '°');
  hud.set('st', isTIR ? '全反射！' : (thC - C.th < 8 ? '折射光贴近界面变弱' : '部分反射 + 折射'));
}

function drawFiber() {
  const C = C4;
  const F = FIBER;
  // 内部填充
  const inner = [], outer = [];
  const nArc = 48;
  for (let i = 0; i <= nArc; i++) {
    const a = F.p0 + (F.p1 - F.p0) * i / nArc;
    inner.push([Math.cos(a) * (F.R - F.w), Math.sin(a) * (F.R - F.w)]);
    outer.push([Math.cos(a) * (F.R + F.w), Math.sin(a) * (F.R + F.w)]);
  }
  fillPolyW(inner.concat(outer.reverse()), 'rgba(140,200,255,0.07)', null);
  arcW(0, 0, F.R - F.w, F.p0, F.p1, '#8fb7d8', 2.2);
  arcW(0, 0, F.R + F.w, F.p0, F.p1, '#8fb7d8', 2.2);
  // 包层剖面斜纹
  for (let i = 0; i <= 26; i++) {
    const a = F.p0 + (F.p1 - F.p0) * i / 26;
    lineW(Math.cos(a) * (F.R + F.w), Math.sin(a) * (F.R + F.w), Math.cos(a + 0.03) * (F.R + F.w + 7), Math.sin(a + 0.03) * (F.R + F.w + 7), 'rgba(143,183,216,0.35)', 1);
  }
  for (const p of [F.p0, F.p1]) {
    lineW(Math.cos(p) * (F.R - F.w), Math.sin(p) * (F.R - F.w), Math.cos(p) * (F.R + F.w), Math.sin(p) * (F.R + F.w), '#8fb7d8', 2);
  }
  textW('纤芯 n≈1.5', 0, F.R - F.w - 26, { color: '#9fc4e0', size: 12 });
  textW('包层（界面每次都满足全反射角）', 0, F.R + F.w + 34, { color: '#8b98a8', size: 11.5 });
  textW('光在纤芯内每次撞壁都发生全反射，弯曲也能传导', 0, -F.R - F.w - 30, { color: '#8b98a8', size: 12 });
  if (C.play) C.fT = (C.fT + 0.00045) % 1;
  drawPolyGlow(F.pts, '#6dffa8', 0.22, 2.4);
  const head = polyPoint(F.pts, F.cum, F.total, C.fT);
  const tail = polyPoint(F.pts, F.cum, F.total, C.fT - 0.055);
  rayGlow(tail[0], tail[1], head[0], head[1], '#6dffa8', 1, 3);
  circleW(head[0], head[1], 4, null, 0, 'rgba(180,255,200,1)');
  hud.set('tc', '41.8°（近似）');
  hud.set('ti', '—');
  hud.set('st', '锯齿形全反射传播' + (C.play ? '中…' : '（已暂停）'));
}

/* ================= 绘制：第 5 章 棱镜色散 ================= */

const SPEC = [680, 645, 610, 575, 545, 510, 475, 430];
const RED_LASER = 633;
function nPrism(lam) { return 1.51 + 0.02 * (700 - lam) / 300; }

function drawPrism() {
  const C = C5;
  const prismEl = { type: 'prism', x: 0, y: -30, ang: 0, apex: C.apex, H: 150, hB: 42, n: 1.52 };
  // 倒置棱镜（白光还原）：顶点朝下，摆到中色散光路上，各色光经它后重新并拢
  const prism2 = { type: 'prism', x: 208, y: -128, ang: 180, apex: C.apex, H: 150, hB: 42, n: 1.52 };
  if (C.recombine) {
    const P0 = { x: prismEl.x, y: prismEl.y };
    const vT = prismVerts(prismEl);
    const Pt = { x: vT[0].x + (vT[1].x - vT[0].x) * 0.45, y: vT[0].y + (vT[1].y - vT[0].y) * 0.45 };
    const cenT = { x: (vT[0].x + vT[1].x + vT[2].x) / 3, y: (vT[0].y + vT[1].y + vT[2].y) / 3 };
    let nT = norm2((vT[1].y - vT[0].y), -(vT[1].x - vT[0].x));
    if ((cenT.x - Pt.x) * nT[0] + (cenT.y - Pt.y) * nT[1] > 0) nT = [-nT[0], -nT[1]];
    const incT = C.inc * DGR;
    const cT1 = rot2(nT[0], nT[1], incT), cT2 = rot2(nT[0], nT[1], -incT);
    const backT = cT1[0] < cT2[0] ? cT1 : cT2;
    const st0 = [Pt.x - (-backT[0]) * 265, Pt.y - (-backT[1]) * 265];
    const tMid = traceRay(st0[0], st0[1], -backT[0], -backT[1], [prismEl], { maxSeg: 5, nPrism: nPrism(545) });
    if (tMid.length >= 2) {
      const s = tMid[tMid.length - 1];
      const dl = norm2(s.bx - s.ax, s.by - s.ay);
      prism2.x = s.ax + dl[0] * 128;
      prism2.y = s.ay + dl[1] * 128 + 6;
    }
  }
  const els = C.recombine ? [prismEl, prism2] : [prismEl];
  const v = prismVerts(prismEl);
  fillPolyW([v[0], v[1], v[2]].map((p) => [p.x, p.y]), 'rgba(180,210,235,0.10)', 'rgba(200,225,245,0.55)', 1.6);
  textW('三棱镜 n=1.51~1.53', (v[1].x + v[2].x) / 2, v[1].y - 16, { color: '#9fc4e0', size: 11.5 });
  // 顶角弧
  const aL = Math.atan2(v[1].y - v[0].y, v[1].x - v[0].x);
  const aR = Math.atan2(v[2].y - v[0].y, v[2].x - v[0].x);
  arcW(v[0].x, v[0].y, 30, aL, aR, '#ffd479', 1.4);
  textW('A=' + C.apex + '°', v[0].x + Math.cos((aL + aR) / 2) * 52, v[0].y + Math.sin((aL + aR) / 2) * 52, { color: '#ffd479', size: 12, bold: true });
  // 倒置棱镜绘制
  if (C.recombine) {
    const v2 = prismVerts(prism2);
    fillPolyW([v2[0], v2[1], v2[2]].map((p) => [p.x, p.y]), 'rgba(180,210,235,0.10)', 'rgba(200,225,245,0.55)', 1.6);
    textW('倒置棱镜（合成白光）', (v2[1].x + v2[2].x) / 2, v2[2].y + 18, { color: '#9fc4e0', size: 11.5 });
  }
  // 入射点：左棱 45% 处
  const P = { x: v[0].x + (v[1].x - v[0].x) * 0.45, y: v[0].y + (v[1].y - v[0].y) * 0.45 };
  const cen = { x: (v[0].x + v[1].x + v[2].x) / 3, y: (v[0].y + v[1].y + v[2].y) / 3 };
  let nout = norm2((v[1].y - v[0].y), -(v[1].x - v[0].x));
  if ((cen.x - P.x) * nout[0] + (cen.y - P.y) * nout[1] > 0) nout = [-nout[0], -nout[1]];
  const inc = C.inc * DGR;
  const c1 = rot2(nout[0], nout[1], inc), c2 = rot2(nout[0], nout[1], -inc);
  const back = c1[0] < c2[0] ? c1 : c2;
  const dxi = -back[0], dyi = -back[1];
  const start = [P.x - dxi * 265, P.y - dyi * 265];
  dashW(P.x + nout[0] * 42, P.y + nout[1] * 42, P.x - nout[0] * 42, P.y - nout[1] * 42, '#7fd1ff', 0.65);
  const aBack = Math.atan2(-dyi, -dxi), aN = Math.atan2(nout[1], nout[0]);
  arcW(P.x, P.y, 26, Math.min(aBack, aN), Math.max(aBack, aN), '#ffd479', 1.4);
  textW('i=' + C.inc + '°', P.x + Math.cos((aBack + aN) / 2) * 46, P.y + Math.sin((aBack + aN) / 2) * 46, { color: '#ffd479', size: 11.5 });
  // 光源图形（白光 / 红色激光）
  const srcCol = C.white ? '#fffbe8' : wl2rgb(RED_LASER);
  const srcColCss = C.white ? srcCol : 'rgb(' + srcCol[0] + ',' + srcCol[1] + ',' + srcCol[2] + ')';
  fillRectW(start[0] - 16, start[1] - 12, start[0] + 2, start[1] + 12, '#3a4656');
  circleW(start[0] + 2, start[1], 5, null, 0, srcColCss);
  textW(C.white ? '白光光源' : '红色激光', start[0] - 12, start[1] + 26, { color: '#aebdd0', size: 11.5 });
  // 追迹（倒置棱镜一并纳入，各色光自然再折射）
  const tr = (lam) => traceRay(start[0], start[1], dxi, dyi, els, { maxSeg: 8, nPrism: nPrism(lam) });
  const trace0 = tr(C.white ? SPEC[0] : RED_LASER);
  if (trace0.length) rayGlow(trace0[0].ax, trace0[0].ay, trace0[0].bx, trace0[0].by, C.white ? '#fffbe8' : srcColCss, 1, 2);
  const lams = C.white ? SPEC : [RED_LASER];
  let devMid = null;
  lams.forEach((lam) => {
    const segs = tr(lam);
    const rgb = wl2rgb(lam);
    const col = 'rgb(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ')';
    const inPrism2 = C.recombine && C.white && segs.length >= 4;
    for (let i = 1; i < segs.length; i++) {
      // 第二棱镜之后的各色光已重新并拢：降透明度叠出「合成白光」
      const after2 = inPrism2 && i >= segs.length - 1;
      rayGlow(segs[i].ax, segs[i].ay, segs[i].bx, segs[i].by, col, after2 ? 0.3 : 0.95, 1.7);
    }
    if (inPrism2) {
      const s = segs[segs.length - 1];
      rayGlow(s.ax, s.ay, s.bx, s.by, '#fffbe8', 0.85, 2.2);
    }
    if (!C.white && segs.length >= 2) {
      const s = segs[segs.length - 1];
      const [lx, ly] = norm2(s.bx - s.ax, s.by - s.ay);
      devMid = Math.acos(clamp(lx * dxi + ly * dyi, -1, 1)) / DGR;
    }
    if (C.white && lam === 545) {
      const s = segs[segs.length - 1];
      const [lx, ly] = norm2(s.bx - s.ax, s.by - s.ay);
      devMid = Math.acos(clamp(lx * dxi + ly * dyi, -1, 1)) / DGR;
    }
    if (C.labels && C.white) {
      const s = segs[segs.length - 1];
      if (lam === 680 || lam === 430) {
        textW(lam === 680 ? '红（偏折最小）' : '紫（偏折最大）', s.bx, s.by + (lam === 680 ? 22 : -22), { color: col, size: 12, bold: true });
      }
    }
  });
  if (!C.white) {
    textW('最小偏向角：转动棱镜或改变入射角，δ 最小时光路对称', 20, -218, { color: '#8b98a8', size: 12 });
  }
  hud.set('A', C.apex + '°');
  hud.set('i', C.inc + '°');
  hud.set('d', devMid === null ? '—' : devMid.toFixed(1) + '°');
}

/* ================= 绘制：第 6 章 凸透镜成像规律（光具座） ================= */

function drawLensBench(dt, t) {
  const C = C6;
  const f = C.f, u = C.u, h = 42;
  const denom = u - f;
  const v = Math.abs(denom) < 0.05 ? Infinity : u * f / denom;
  const railY = -158;
  // 主光轴 + 刻度
  lineW(-340, 0, 350, 0, 'rgba(160,180,200,0.5)', 1.2);
  for (let tk = -330; tk <= 330; tk += 20) lineW(tk, -5, tk, 5, 'rgba(160,180,200,0.35)', 1);
  textW('主光轴（刻度单位：cm）', 312, -18, { color: '#8b98a8', size: 11 });
  // 光具座导轨 + 三只滑块（物 / 镜 / 屏）
  drawBenchRail(railY, 330);
  drawBenchCarriage(-u, railY, 46, '物');
  drawBenchCarriage(0, railY, 50, '镜');
  drawBenchCarriage(clamp(C.screenX, -330, 330), railY, 46, '屏');
  // 滑块到光轴的细 guides
  dashW(-u, railY - 28, -u, 2, 'rgba(150,170,195,0.18)', 1);
  dashW(0, railY - 28, 0, -98, 'rgba(150,170,195,0.18)', 1);
  dashW(C.screenX, railY - 28, C.screenX, -98, 'rgba(150,170,195,0.18)', 1);
  // 蜡烛物（焰心高度 = 物高 h，光线从焰尖出发）
  drawCandle(-u, railY - 30, h, true, t, null);
  textW('物体', -u, h + 20, { color: '#ff8f6b', size: 12, bold: true });
  // 透镜 + 支架
  lensShape(0, 0, 26, 92, 'rgba(180,210,235,0.12)', 'rgba(200,225,245,0.7)', 1.8);
  drawLensHolder(0, railY - 30, 60, null);
  textW('凸透镜 f=' + f + 'cm', 0, -110, { color: '#9fc4e0', size: 12 });
  // 焦点
  [[-f, 'F'], [f, "F'"], [-2 * f, '2F'], [2 * f, "2F'"]].forEach(([x, lab]) => {
    if (Math.abs(x) <= 330) {
      circleW(x, 0, 3, null, 0, '#ffd479');
      textW(lab, x, -16, { color: '#ffd479', size: 11.5 });
    }
  });
  const isVirtual = v < 0;
  const imgY = v === Infinity ? 0 : -h * v / u;
  // 三条特殊光线
  if (C.showRays && v !== Infinity) {
    const RC = '#ffe066';
    if (!isVirtual) {
      rayGlow(-u, h, 0, h, RC, 1, 1.6);
      arrowHeadW(0, h, 0, 7, RC);
      rayGlow(0, h, v, imgY, RC, 0.9, 1.6);
      rayGlow(-u, h, v, imgY, RC, 0.9, 1.6);
      rayGlow(-u, h, -f, 0, RC, 1, 1.6);
      rayGlow(-f, 0, v, imgY, RC, 0.9, 1.6);
    } else {
      // 虚像：光线发散，反向延长线（虚线）交于虚像点
      let d1 = norm2(f, -h);
      rayGlow(-u, h, 0, h, RC, 1, 1.6);
      rayGlow(0, h, d1[0] * 300, h + d1[1] * 300, RC, 0.9, 1.6);
      dashW(0, h, v, imgY, 'rgba(255,224,102,0.55)', 1);
      const d2 = norm2(u, -h);
      rayGlow(-u, h, -u + d2[0] * 340, h + d2[1] * 340, RC, 0.9, 1.6);
      const yF = -h * f / denom;
      rayGlow(-u, h, -f, 0, RC, 1, 1.6);
      rayGlow(-f, 0, 0, yF, RC, 1, 1.6);
      rayGlow(0, yF, 310, yF, RC, 0.9, 1.6);
      dashW(0, yF, v, imgY, 'rgba(255,224,102,0.55)', 1);
    }
  }
  // 虚像箭头（虚线）
  if (isVirtual) drawArrowDashed(v, 0, v, imgY, '#ffb08f');
  // 光屏（白屏 + 支架）
  const sx = clamp(C.screenX, -330, 330);
  drawScreenStand(sx, railY - 30, 128 - 95 + 95, null);
  fillRectW(sx - 4.5, -95, sx + 4.5, 95, '#c9d4e2');
  fillRectW(sx - 4.5, -95, sx - 1, 95, 'rgba(255,255,255,0.2)');
  if (isVirtual || v === Infinity) {
    textW('光屏无像', sx, 0, { color: '#5b6673', size: 11.5, bold: true });
  } else if (Math.abs(sx - v) < 4) {
    // 清晰像：屏上倒立缩微像
    const imgH = clamp(Math.abs(imgY), 8, 86);
    const dir = imgY > 0 ? 1 : -1;
    fillRectW(sx - 3.6, -imgH, sx + 3.6, imgH, 'rgba(255,143,107,0.20)');
    arrowW(sx + 1.5, 0, sx + 1.5, dir * imgH * 0.9, '#e26d4a', 1.6);
    textW('清晰像', sx + 10, dir * imgH + (dir > 0 ? 16 : -16), { color: '#ff8f6b', size: 11.5 });
  } else {
    const spread = Math.min(88, Math.abs(sx - v) * 0.5);
    fillRectW(sx - 3, -spread, sx + 3, spread, 'rgba(255,143,107,0.30)');
    textW('模糊', sx - 14, spread + 14, { color: '#ffb08f', size: 11 });
  }
  // 对焦动画
  if (C.tween) {
    C.tween.t += dt / 0.6;
    const e = C.tween.t >= 1 ? 1 : (C.tween.t < 0.5 ? 2 * C.tween.t * C.tween.t : 1 - Math.pow(-2 * C.tween.t + 2, 2) / 2);
    C.screenX = C.tween.from + (C.tween.to - C.tween.from) * e;
    if (C.tween.t >= 1) C.tween = null;
  }
  // HUD
  let nat;
  if (v === Infinity) nat = '不成像（平行光射出）';
  else if (isVirtual) nat = '正立放大虚像（放大镜）';
  else if (u < 2 * f) nat = '倒立放大实像（投影仪）';
  else if (Math.abs(u - 2 * f) < 0.3) nat = '倒立等大实像';
  else nat = '倒立缩小实像（照相机）';
  hud.set('u', u.toFixed(1) + ' cm');
  hud.set('v', v === Infinity ? '∞' : v.toFixed(1) + ' cm');
  hud.set('m', v === Infinity ? '—' : Math.abs(v / u).toFixed(2) + '×');
  hud.set('nat', nat);
}

function drawArrowDashed(x1, y1, x2, y2, color) {
  dashW(x1, y1, x2, y2, color, 0.85, 1.8);
  arrowHeadW(x2, y2, Math.atan2(y2 - y1, x2 - x1), 7, color);
}

/* ================= 绘制：第 7 章 眼睛与视力矫正 ================= */

function drawEye() {
  const C = C7;
  const L = C.axial;
  const fe = 150 - 65 * C.curv;
  const LX = -35;
  // 眼球轮廓：巩膜渐变 + 角膜凸起 + 虹膜瞳孔 + 视网膜衬里 + 视神经
  const gEye = ctx.createRadialGradient(...W2S(-30, 26), 8, ...W2S(0, 0), 104 * view.k);
  gEye.addColorStop(0, 'rgba(235,242,250,0.10)');
  gEye.addColorStop(0.72, 'rgba(150,180,205,0.05)');
  gEye.addColorStop(1, 'rgba(120,150,180,0.03)');
  circleW(0, 0, 100, 'rgba(190,205,220,0.55)', 2, null);
  ctx.fillStyle = gEye;
  ctx.beginPath();
  const [ex, ey] = W2S(0, 0);
  ctx.arc(ex, ey, 100 * view.k, 0, TAU_);
  ctx.fill();
  // 角膜（前凸）
  arcW(-95, 0, 13, 100 * DGR, 260 * DGR, 'rgba(190,205,220,0.5)', 1.4);
  ctx.save();
  ctx.globalAlpha = 0.3;
  arcW(-96, 0, 12, 130 * DGR, 230 * DGR, 'rgba(235,245,255,0.9)', 2.2);
  ctx.restore();
  textW('角膜', -114, 34, { color: '#9fb2c8', size: 11 });
  // 虹膜 + 瞳孔（角膜后方）
  arcW(-84, 0, 15, 115 * DGR, 245 * DGR, '#7a5c9e', 3.2);
  arcW(-84, 0, 15, 125 * DGR, 235 * DGR, '#4a3568', 2);
  textW('虹膜·瞳孔', -86, -40, { color: '#a89bc4', size: 10 });
  // 晶状体（曲率改变形状）+ 睫状体
  lensShape(LX, 0, 7, 20 + 12 * C.curv, 'rgba(180,210,235,0.16)', '#9fc4e0', 1.6);
  for (const sd of [-1, 1]) {
    fillPolyW([[LX - 12, sd * (22 + 12 * C.curv)], [LX - 22, sd * (34 + 10 * C.curv)], [LX - 10, sd * (36 + 10 * C.curv)]], 'rgba(226,120,138,0.4)', null);
  }
  textW('晶状体', LX, -50 - 12 * C.curv, { color: '#9fc4e0', size: 11.5 });
  textW('睫状体', LX - 30, 34 + 12 * C.curv, { color: '#e28a92', size: 9.5 });
  // 玻璃体折射率标注
  textW('玻璃体 n≈1.34', 18, -64, { color: 'rgba(159,196,224,0.6)', size: 10 });
  // 视网膜（竖线 + 衬里小齿 + 中心凹）
  lineW(L, -70, L, 70, '#ff9d76', 2.5);
  for (let y = -63; y <= 63; y += 13) lineW(L + 2, y, L + 8, y + 4, '#ff9d76', 1, 0.6);
  circleW(L, 0, 3.4, '#ffd479', 1.2, 'rgba(255,212,121,0.35)');
  textW('视网膜（中心凹）', L, 88, { color: '#ff9d76', size: 12, bold: true });
  // 视神经
  lineW(L + 2, -46, L + 22, -58, 'rgba(255,157,118,0.5)', 3.4);
  circleW(L + 26, -60, 5, 'rgba(255,157,118,0.55)', 1.2, 'rgba(255,157,118,0.12)');
  textW('视神经', L + 30, -74, { color: 'rgba(255,157,118,0.7)', size: 9.5 });
  // 矫正镜片 + 眼镜架
  let fc = Infinity;
  if (C.corr !== 'none') {
    const needed = 1 / (L + 35) - 1 / fe;
    fc = Math.abs(needed) < 2e-4 ? (needed > 0 ? 6000 : -6000) : 1 / needed;
    const concave = fc < 0;
    lensShape(-108, 0, concave ? 7 : -7, 24, 'rgba(255,212,121,0.12)', '#ffd479', 1.6);
    circleW(-108, 0, 28, 'rgba(255,212,121,0.45)', 1.4, null);
    lineW(-108 - 28, -6, -128, -26, 'rgba(255,212,121,0.45)', 1.6);
    textW(concave ? '凹透镜（近视矫正）' : '凸透镜（远视矫正）', -108, -44, { color: '#ffd479', size: 11 });
  }
  // 三条平行入射光线
  const isCon = C.corr !== 'none';
  [-28, 0, 28].forEach((yh) => {
    const m1 = isCon ? -yh / fc : 0;
    const yL = yh + m1 * (LX - (-108));
    const m2 = m1 - yL / fe;
    const x0 = isCon ? -108 : LX;
    if (isCon) rayGlow(-195, yh, -108, yh, '#ff5d5d', 0.95, 1.5);
    else rayGlow(-195, yh, LX, yh, '#ff5d5d', 0.95, 1.5);
    if (isCon) { rayGlow(-108, yh, LX, yL, '#ff5d5d', 0.95, 1.5); }
    if (Math.abs(m2) < 1e-4) {
      rayGlow(LX, yL, LX + 250, yL, '#ff5d5d', 0.9, 1.5);
      return;
    }
    const xf = LX - yL / m2;
    rayGlow(LX, yL, xf, 0, '#ff5d5d', 0.9, 1.5);
    const dd = norm2(xf - LX, -yL);
    rayGlow(xf, 0, xf + dd[0] * 46, dd[1] * 46, '#ff5d5d', 0.55, 1.3);
    if (yh === 0) {
      const diff = xf - L;
      const okCol = Math.abs(diff) <= 4 ? '#7dff9e' : (diff < 0 ? '#ffb35c' : '#ff7a6b');
      circleW(xf, 0, 6, okCol, 1.6, okCol);
      textW('像点', xf, -20, { color: okCol, size: 12, bold: true });
      C.lastDiff = diff;
    }
  });
  // 验光处方：应配镜片度数（度数 = 光焦度 × 100）
  const needed = 1 / (L + 35) - 1 / fe;
  const diopter = needed * 100; // m⁻¹
  const deg100 = Math.round(diopter * 100 / 25) * 25;
  hud.set('ax', ((L - 80) / 80 * 100 >= 0 ? '+' : '') + ((L - 80) / 80 * 100).toFixed(0) + '%');
  hud.set('fe', fe.toFixed(0) + '（' + (C.curv < 0.33 ? '扁平·看远' : C.curv > 0.66 ? '较凸·看近' : '适中') + '）');
  const diff = C.lastDiff || 0;
  hud.set('pos', Math.abs(diff) <= 4 ? '视网膜上 ✓' : (diff < 0 ? '视网膜前 ' + Math.abs(diff).toFixed(0) : '视网膜后 ' + diff.toFixed(0)));
  hud.set('deg', '应配 ' + (diopter >= 0 ? '+' : '') + diopter.toFixed(2) + ' D（' + (deg100 >= 0 ? '+' : '') + deg100 + ' 度）');
  const onRetina = Math.abs(diff) <= 4;
  hud.set('st', onRetina ? (C.corr === 'none' ? '正常' : '已矫正 ✓') : (diff < 0 ? '近视倾向' : '远视倾向'));
}

/* ================= 干涉 / 衍射 共用 ================= */

function sincSq(x) { return x === 0 ? 1 : Math.pow(Math.sin(x) / x, 2); }

function renderStrip(x0, x1, yBot, hh, colorFn) {
  const [sx0, syT] = W2S(x0, yBot + hh);
  const [sx1, syB] = W2S(x1, yBot);
  const n = Math.max(8, Math.round(sx1 - sx0));
  const wpx = sx1 - sx0;
  for (let i = 0; i < n; i++) {
    const xn = i / (n - 1);
    const c = colorFn(xn);
    ctx.fillStyle = 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')';
    ctx.fillRect(sx0 + wpx * xn, syT, wpx / n + 0.8, syB - syT);
  }
}

/** 白光模式：对采样波长求和（中央白纹 / 各级彩色光谱通用） */
function whiteMix(xn, intenFn) {
  let r = 0, g = 0, b = 0;
  for (let k = 0; k < 14; k++) {
    const lj = 405 + k * 22;
    const I = intenFn(lj);
    const c = wl2rgb(lj);
    r += c[0] * I; g += c[1] * I; b += c[2] * I;
  }
  return [Math.min(255, r / 14 * 2.4), Math.min(255, g / 14 * 2.4), Math.min(255, b / 14 * 2.4)];
}

function drawCurve(x0, x1, yBase, amp, ifn, color) {
  const n = 160;
  ctx.strokeStyle = color; ctx.lineWidth = 1.6; ctx.globalAlpha = 0.9;
  ctx.beginPath();
  for (let i = 0; i <= n; i++) {
    const xn = i / n;
    const [sx, sy] = W2S(x0 + (x1 - x0) * xn, yBase + clamp(ifn(xn), 0, 1.04) * amp);
    if (i === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
  }
  ctx.stroke(); ctx.globalAlpha = 1;
  lineW(x0, yBase, x1, yBase, 'rgba(160,180,200,0.4)', 1);
}

/** 光源 + 带缝挡板 + 屏示意 + 波前弧 */
function drawSlitSetup(x, y0, y1, gaps, slitLabel) {
  // 光源（激光器壳体造型）
  drawLaserBox(-322, 130 + 4, 0, '#fff6d8', '单色光源');
  const muzzle = -322 + 38;
  gaps.forEach((g) => {
    dashW(muzzle, 130, x, g.c, 'rgba(255,224,102,0.35)', 1);
  });
  // 挡板：由缝列表生成实心段（自上而下遍历，防止实心段跨越缝隙）
  const sorted = gaps.slice().sort((p, q) => q.c - p.c);
  const segs = [];
  let cur = y1;
  sorted.forEach((g) => {
    segs.push([cur, g.c + g.h / 2]);
    cur = g.c - g.h / 2;
  });
  segs.push([cur, y0]);
  segs.forEach(([a, b]) => { if (b - a > 1) lineW(x, a, x, b, '#bcc9d9', 4); });
  // 挡板支架 + 底座
  lineW(x, y0, x, y0 - 16, '#43506a', 3);
  fillRectW(x - 18, y0 - 20, x + 18, y0 - 14, '#2a3543');
  shadowBlob(x, y0 - 18, 30, 0.26, 0.38);
  textW(slitLabel, x, y0 - 34, { color: '#aebdd0', size: 12 });
  // 波前弧
  gaps.forEach((g) => {
    for (let r = 36; r <= 116; r += 40) {
      arcW(x, g.c, r, -0.85, 0.85, 'rgba(120,200,255,0.22)', 1.1);
    }
  });
  // 屏（侧视线）+ 支架
  lineW(152, y0, 152, y1, '#8b98a8', 4);
  lineW(152, y0, 152, y0 - 14, '#43506a', 3);
  fillRectW(152 - 18, y0 - 20, 152 + 18, y0 - 14, '#2a3543');
  shadowBlob(152, y0 - 18, 30, 0.26, 0.38);
  textW('屏', 152, y0 - 34, { color: '#aebdd0', size: 12 });
}

/* ================= 绘制：第 8 章 双缝干涉（含测量头） ================= */

function fringePos(wx, Lmm) { return (wx / 330) * 3.2 / Lmm; } // wx → s（几何量 pos/L）

function drawMeasureHead(Lmm) {
  const C = C8;
  const yBar = -6;
  const dh = 10 + C.d * 80;
  // 游标卡尺横梁
  fillRectW(C.mx1, yBar - 4, C.mx2, yBar + 4, 'rgba(80,96,120,0.35)');
  lineW(C.mx1, yBar, C.mx2, yBar, '#9fb2c8', 1.6);
  // 两只游标（可拖）
  [C.mx1, C.mx2].forEach((mx, i) => {
    const [sx, sy] = W2S(mx, yBar);
    fillRectW(mx - 3.4, yBar - 15, mx + 3.4, yBar + 15, '#39465a');
    lineW(mx, yBar - 15, mx, yBar + 15, '#ffd479', 2);
    dashW(mx, yBar + 15, mx, -42, 'rgba(255,212,121,0.6)', 1, 1.2);
    circleW(mx, yBar + 22, 5, '#ffd479', 1.6, '#2b3646');
  });
  // 读数窗
  const a_mm = Math.abs((C.mx2 - C.mx1) * 3.2 / 330);
  const dxmm = C.lam * 1e-6 * Lmm / C.d;
  const k = Math.max(1, Math.round(a_mm / dxmm));
  const lamMeas = a_mm / k * C.d / Lmm * 1e6;
  const midx = (C.mx1 + C.mx2) / 2;
  roundRectW(midx, yBar - 46, 236, 24, 5, 'rgba(20,26,34,0.85)', 'rgba(255,212,121,0.5)', 1.2);
  textW('a=' + a_mm.toFixed(2) + 'mm · ' + k + ' 条 · λ测≈' + lamMeas.toFixed(0) + 'nm', midx, yBar - 46, { color: '#ffe066', size: 11, bold: true });
  textW('游标对齐亮纹中心，跨 k 条亮纹反推波长', midx, yBar + 42, { color: '#8b98a8', size: 10.5 });
}

function drawDoubleSlit() {
  const C = C8;
  const Lmm = C.L * 10;
  const lam = C.lam;
  const dh = 10 + C.d * 80;
  drawSlitSetup(-70, 20, 240, [{ c: 130 + dh, h: 13 }, { c: 130 - dh, h: 13 }], '双缝 d=' + C.d.toFixed(2) + 'mm');
  const a = C.d / 4;
  const lam_mm = lam * 1e-6;
  const ifn = (xn) => {
    const pos = (xn * 2 - 1) * 3.2;
    const s = pos / Lmm;
    return Math.pow(Math.cos(Math.PI * C.d * s / lam_mm), 2) * sincSq(Math.PI * a * s / lam_mm);
  };
  const stripY = -70, stripH = 30;
  // 屏上亮纹位置标线（几何光学预期，连接波前与条纹）
  const dxmm = lam * 1e-6 * Lmm / C.d;
  ctx.save();
  for (let k = -6; k <= 6; k++) {
    const wx = k * dxmm / 3.2 * 330;
    if (Math.abs(wx) > 325) continue;
    const [px] = W2S(wx, 0);
    const c = wl2rgb(lam);
    ctx.strokeStyle = 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',0.28)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px, W2S(0, stripY)[1]);
    ctx.lineTo(px, W2S(0, stripY + stripH)[1]);
    ctx.stroke();
  }
  ctx.restore();
  if (C.white) {
    renderStrip(-330, 330, stripY, stripH, (xn) => {
      const pos = (xn * 2 - 1) * 3.2;
      const s = pos / Lmm;
      return whiteMix(xn, (lj) => {
        const lj_mm = lj * 1e-6;
        return Math.pow(Math.cos(Math.PI * C.d * s / lj_mm), 2) * sincSq(Math.PI * a * s / lj_mm);
      });
    });
  } else {
    const c = wl2rgb(lam);
    renderStrip(-330, 330, stripY, stripH, (xn) => {
      const I = ifn(xn);
      return [c[0] * I, c[1] * I, c[2] * I];
    });
    drawCurve(-330, 330, stripY - 16, -62, ifn, 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')');
  }
  textW('屏上强度分布 I(x) ∝ cos²(πdx/λL)', 0, stripY - 96, { color: '#8b98a8', size: 12 });
  drawMeasureHead(Lmm);
  hud.set('lam', lam + ' nm');
  hud.set('dx', dxmm.toFixed(2) + ' mm');
  hud.set('wm', C.white ? '白光（中央白纹）' : '单色');
}

/* ================= 绘制：第 9 章 单缝衍射与光栅 ================= */

function drawDiffraction() {
  const C = C9;
  const Lmm = 300;
  const lam_mm = C.lam * 1e-6;
  const d = 0.25; // 双缝 / 光栅缝间距（固定）
  let gaps;
  let label;
  if (C.mode === 'single') {
    gaps = [{ c: 130, h: 30 }];
    label = '单缝 a=' + C.a.toFixed(3) + 'mm';
  } else if (C.mode === 'double') {
    gaps = [{ c: 130 + 30, h: 13 }, { c: 130 - 30, h: 13 }];
    label = '双缝 d=0.25mm';
  } else {
    gaps = [];
    const sv = 30, nSlit = C.N;
    for (let i = 0; i < nSlit; i++) gaps.push({ c: 130 + (i - (nSlit - 1) / 2) * sv, h: 11 });
    label = '光栅 N=' + C.N + ' 缝';
  }
  drawSlitSetup(-70, 20, 240, gaps, label);
  const ifn = (xn) => {
    const pos = (xn * 2 - 1) * 3.2;
    const s = pos / Lmm;
    const env = sincSq(Math.PI * C.a * s / lam_mm);
    if (C.mode === 'single') return env;
    if (C.mode === 'double') return env * Math.pow(Math.cos(Math.PI * d * s / lam_mm), 2);
    const al = Math.PI * d * s / lam_mm;
    const sa = Math.sin(al);
    let g;
    if (Math.abs(sa) < 1e-9) g = 1;
    else g = Math.pow(Math.sin(C.N * al) / (C.N * sa), 2);
    return env * g;
  };
  const c = wl2rgb(C.lam);
  if (C.white) {
    renderStrip(-330, 330, -70, 30, (xn) => {
      const pos = (xn * 2 - 1) * 3.2;
      const s = pos / Lmm;
      return whiteMix(xn, (lj) => {
        const lj_mm = lj * 1e-6;
        const env = sincSq(Math.PI * C.a * s / lj_mm);
        if (C.mode === 'single') return env;
        if (C.mode === 'double') return env * Math.pow(Math.cos(Math.PI * d * s / lj_mm), 2);
        const al = Math.PI * d * s / lj_mm;
        const sa = Math.sin(al);
        if (Math.abs(sa) < 1e-9) return env;
        return env * Math.pow(Math.sin(C.N * al) / (C.N * sa), 2);
      });
    });
  } else {
    renderStrip(-330, 330, -70, 30, (xn) => {
      const I = ifn(xn);
      return [c[0] * I, c[1] * I, c[2] * I];
    });
    drawCurve(-330, 330, -86, -62, ifn, 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')');
  }
  textW(C.white ? '白光：中央白亮，两侧为彩色光谱（紫偏折小、红偏折大）' : '屏上强度分布', 0, -164, { color: '#8b98a8', size: 12 });
  const cw2 = 2 * C.lam * 1e-6 / C.a; // 中央亮纹角宽度（rad）
  const modeName = C.mode === 'single' ? '单缝衍射' : C.mode === 'double' ? '双缝衍射' : '光栅衍射';
  hud.set('mode', modeName + (C.white ? ' · 白光' : ''));
  hud.set('cw', (cw2 * 1000).toFixed(1) + ' mrad（' + (cw2 / DGR).toFixed(2) + '°）');
  hud.set('dx', C.mode === 'single' ? '—' : (lam_mm * Lmm / d).toFixed(2) + ' mm');
}

/* ================= 绘制：第 10 章 薄膜干涉（肥皂膜 / 牛顿环） ================= */

const SODIUM = [255, 214, 90];

function filmIntensity(dd, lam) {
  return Math.pow(Math.sin(Math.PI * 2 * N_SOAP * dd / lam), 2);
}

function filmColor(dd) {
  const C = C10;
  if (dd <= 0.5) return [12, 14, 18];
  if (C.light === 'white') {
    const r = 255 * filmIntensity(dd, 610);
    const g2 = 255 * filmIntensity(dd, 550);
    const b = 255 * filmIntensity(dd, 465);
    return [r, g2, b];
  }
  if (C.light === 'sodium') {
    const I = filmIntensity(dd, 589);
    return [SODIUM[0] * I, SODIUM[1] * I, SODIUM[2] * I];
  }
  const I = filmIntensity(dd, 550);
  const cc = wl2rgb(550);
  return [cc[0] * I, cc[1] * I, cc[2] * I];
}

function drawFilm(dt) {
  const C = C10;
  if (C.mode === 'newton') { drawNewton(); return; }
  if (C.play) {
    C.drain += dt * 0.12;
    if (C.drain >= 1) { C.drain = 1; C.play = false; }
  }
  const filmD = (wy) => {
    let base = 25 + C.grad * (170 - wy) / 340;
    if (C.drain > 0) {
      const yBlack = 170 - C.drain * 340;
      base *= clamp((yBlack - wy) / 28 + 1, 0, 1);
    }
    return base;
  };
  // 竖直膜改用线性渐变着色（顶部薄 → 底部厚，逐高度取色）
  const [sx0, syT] = W2S(-45, 170);
  const [sx1, syB] = W2S(45, -170);
  const lin = ctx.createLinearGradient(0, syT, 0, syB);
  const ROWS = 90;
  for (let i = 0; i <= ROWS; i++) {
    const sy = syT + (syB - syT) * i / ROWS;
    const wy = S2W(0, sy)[1];
    const cc = filmColor(filmD(wy));
    lin.addColorStop(i / ROWS, 'rgb(' + (cc[0] | 0) + ',' + (cc[1] | 0) + ',' + (cc[2] | 0) + ')');
  }
  ctx.fillStyle = lin;
  ctx.fillRect(sx0, syT, sx1 - sx0, syB - syT);
  // 金属丝框 + 顶夹持
  fillPolyW([[-45, -170], [45, -170], [45, 170], [-45, 170]], null, '#8fb7d8', 2.5);
  lineW(-45, 170, -45, 196, '#8fb7d8', 2.5);
  lineW(45, 170, 45, 196, '#8fb7d8', 2.5);
  fillRectW(-58, 194, 58, 202, '#39465a');
  textW('肥皂膜竖直剖面（n=1.33）', 0, 222, { color: '#9fc4e0', size: 12.5 });
  arrowW(78, 140, 78, 40, '#8b98a8', 1.6);
  textW('厚度渐增', 92, 90, { color: '#8b98a8', size: 11.5 });
  textW('上薄下厚 → 顶部近黑', 92, 68, { color: '#8b98a8', size: 11.5, align: 'left' });
  const lightName = C.light === 'white' ? '白光' : C.light === 'sodium' ? '钠黄光' : '绿光 550nm';
  hud.set('wm', lightName);
  hud.set('th', Math.round(25 + C.grad) + ' nm');
  hud.set('st', C.play ? '重力排液中…' : (C.drain >= 1 ? '膜已排薄，即将破裂' : '静止观察'));
}

/** 牛顿环：平凸透镜压平板玻璃，空气膜 t = r²/2R，径向渐变直接绘同心环 */
function drawNewton() {
  const C = C10;
  const RR = 172;      // 显示半径（世界单位）
  const FNM = 0.115;   // 世界单位² → nm 的厚度换算（调环数密度）
  const [sx, sy] = W2S(0, 0);
  const rad = RR * view.k;
  const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, Math.max(rad, 2));
  const STOPS = 130;
  for (let i = 0; i <= STOPS; i++) {
    const rr = RR * i / STOPS;
    const tnm = rr * rr / (2 * 1) * FNM; // t = r²/2R（R 取 1 个示意单位）
    let col;
    if (C.light === 'white') {
      let r = 0, g2 = 0, b = 0;
      for (let k = 0; k < 14; k++) {
        const lj = 405 + k * 22;
        const I = filmIntensity(tnm, lj);
        const cc = wl2rgb(lj);
        r += cc[0] * I; g2 += cc[1] * I; b += cc[2] * I;
      }
      col = [(r / 14 * 2.1) | 0, (g2 / 14 * 2.1) | 0, (b / 14 * 2.1) | 0];
    } else {
      const lam = C.light === 'sodium' ? 589 : 550;
      const I = filmIntensity(tnm, lam);
      const base = C.light === 'sodium' ? SODIUM : wl2rgb(550);
      col = [base[0] * I, base[1] * I, base[2] * I];
    }
    g.addColorStop(i / STOPS, 'rgb(' + clamp(col[0] | 0, 0, 255) + ',' + clamp(col[1] | 0, 0, 255) + ',' + clamp(col[2] | 0, 0, 255) + ')');
  }
  // 暗场底盘
  ctx.fillStyle = 'rgb(10,12,16)';
  ctx.beginPath(); ctx.arc(sx, sy, rad, 0, TAU_); ctx.fill();
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(sx, sy, rad, 0, TAU_); ctx.fill();
  // 中心暗斑标注 + 半径标线
  circleW(0, 0, 4.6, 'rgba(255,157,118,0.9)', 1.2, null);
  dashW(0, 0, RR * 0.94, 0, 'rgba(255,157,118,0.55)', 1, 1.2);
  textW('中心暗斑', 0, 26, { color: '#ff9d76', size: 11, bold: true });
  textW('r', RR * 0.5, -14, { color: '#ff9d76', size: 11, italic: false });
  // 外框（平凸透镜视场边缘）
  circleW(0, 0, RR, 'rgba(150,175,205,0.5)', 1.6);
  // 侧视示意：平凸透镜压在平板玻璃上
  const bx = -300, by = -60;
  ctx.save();
  ctx.globalAlpha = 0.9;
  const pts = [];
  for (let i = 0; i <= 26; i++) {
    const a = Math.PI + i / 26 * Math.PI;
    pts.push([bx + Math.cos(a) * 62, by + 44 + Math.sin(a) * 40]); // 凸面朝下，顶点在 by+4
  }
  pts.push([bx + 62, by + 44], [bx - 62, by + 44]);
  fillPolyW(pts, 'rgba(180,210,235,0.14)', 'rgba(200,225,245,0.6)', 1.4);
  // 平板玻璃垫在凸面顶点下（顶点 y = by+4），空气膜在顶点处 t≈0
  fillRectW(bx - 78, by - 6, bx + 78, by + 4, 'rgba(150,175,205,0.16)');
  lineW(bx - 78, by + 4, bx + 78, by + 4, '#9fb2c8', 1.6);
  circleW(bx, by + 4, 2.6, null, 0, '#ff9d76');
  lineW(bx, by + 8, bx, by + 38, 'rgba(255,157,118,0.3)', 1);
  textW('平凸透镜', bx, by + 62, { color: '#9fc4e0', size: 10.5 });
  textW('平板玻璃', bx + 98, by - 1, { color: '#9fc4e0', size: 10.5 });
  ctx.restore();
  textW('牛顿环：空气膜厚 t = r²/2R，内疏外密', 0, RR + 26, { color: '#8b98a8', size: 12 });
  textW('公式 r² = 2R·t', 0, RR + 44, { color: 'rgba(139,152,168,0.8)', size: 11 });
  const lightName = C.light === 'white' ? '白光（彩色环）' : C.light === 'sodium' ? '钠黄光（黄黑环）' : '绿光（绿黑环）';
  hud.set('wm', lightName);
  hud.set('th', '中心 t≈0 → 暗');
  hud.set('st', '反射光干涉：中心暗、内疏外密');
}

/* ================= 绘制：第 11 章 光的偏振（马吕斯 / 液晶屏） ================= */

function drawDoubleArrow(x, y, angDeg, len, color) {
  const a = angDeg * DGR;
  const dx = Math.cos(a) * len / 2, dy = Math.sin(a) * len / 2;
  lineW(x - dx, y - dy, x + dx, y + dy, color, 2);
  arrowHeadW(x + dx, y + dy, a, 5.5, color);
  arrowHeadW(x - dx, y - dy, a + Math.PI, 5.5, color);
}

function drawPolarizerDisc(x, y, angDeg, viz, accent) {
  const r = 48;
  circleW(x, y, r, accent, 1.8, 'rgba(122,138,158,0.10)');
  const a = angDeg * DGR;
  const ca = Math.cos(a), sa = Math.sin(a);
  lineW(x - ca * r, y - sa * r, x + ca * r, y + sa * r, accent, 2.4);
  if (viz) {
    for (let off = -40; off <= 40; off += 10) {
      if (off === 0) continue;
      const half = Math.sqrt(Math.max(0, r * r - off * off));
      const px = -sa * off, py = ca * off;
      lineW(x + px - ca * half, y + py - sa * half, x + px + ca * half, y + py + sa * half, accent, 1, 0.5);
    }
  }
}

/** 竖板式偏振片（LCD 模式用）：板体 + 透振栅线 */
function drawPolarizerPlate(x, axisDeg, accent, label, labelDy = -96) {
  fillRectW(x - 7, -78, x + 7, 78, 'rgba(122,138,158,0.16)');
  fillPolyW([[x - 7, -78], [x + 7, -78], [x + 7, 78], [x - 7, 78]], null, accent, 1.4);
  const a = axisDeg * DGR;
  const dx = Math.cos(a), dy = Math.sin(a);
  const nx = -dy, ny = dx;
  ctx.save();
  ctx.globalAlpha = 0.55;
  for (let off = -64; off <= 64; off += 9) {
    if (Math.abs(off) < 2) continue;
    lineW(x + nx * off - dx * 72, ny * off - dy * 72, x + nx * off + dx * 72, ny * off + dy * 72, accent, 1);
  }
  ctx.restore();
  fillRectW(x - 24, 78, x + 24, 88, '#2a3543');
  shadowBlob(x, 90, 34, 0.26, 0.36);
  textW(label, x, labelDy, { color: accent, size: 11.5, bold: true });
}

function drawPolarization(dt, t) {
  const C = C11;
  if (C.mode === 'lcd') { drawLCD(t); return; }
  const rel = (C.thA - C.polA) * DGR;
  const Irel = Math.pow(Math.cos(rel), 2);
  // 光源
  if (C.on) {
    circleW(-330, 0, 10, null, 0, 'rgba(255,246,216,0.9)');
    circleW(-330, 0, 20, 'rgba(255,246,216,0.3)', 1.4, 'rgba(255,246,216,0.10)');
  } else {
    circleW(-330, 0, 10, '#5b6673', 1.6, 'rgba(122,138,158,0.10)');
  }
  fillRectW(-344, -14, -318, 14, '#3a4656');
  textW('光源', -330, -34, { color: '#aebdd0', size: 11.5 });
  // 主光束
  if (C.on) rayGlow(-300, 0, 196, 0, '#fff2c8', 0.5 + 0.5 * Irel, 3.4);
  // 起偏器 / 检偏器 / 屏
  drawPolarizerDisc(-110, 0, C.polA, C.viz, '#7fd1ff');
  drawPolarizerDisc(70, 0, C.thA, C.viz, '#ff9d76');
  textW('起偏器', -110, -64, { color: '#7fd1ff', size: 12, bold: true });
  textW('检偏器', 70, -64, { color: '#ff9d76', size: 12, bold: true });
  textW('屏', 206, -84, { color: '#aebdd0', size: 12 });
  // 屏
  fillRectW(200, -70, 212, 70, C.on ? 'rgba(255,244,214,' + (0.08 + 0.82 * Irel) + ')' : 'rgba(255,244,214,0.05)');
  fillPolyW([[200, -70], [212, -70], [212, 70], [200, 70]], null, '#5b6673', 1.4);
  // 光矢量示意
  if (C.on) {
    const osc = Math.abs(Math.sin(t * 4));
    [[-285, 0.5], [-252, 1.9], [-219, 3.6]].forEach(([xx, aa]) => drawDoubleArrow(xx, 0, aa * 57.3, 15, 'rgba(255,242,200,0.75)'));
    drawDoubleArrow(-20, 0, C.polA, 4 + 24 * osc, '#ffe066');
    textW('只沿起偏器方向振动', -20, 40, { color: '#ffe066', size: 10.5 });
    const ampA = 4 + 24 * Math.abs(Math.cos(rel)) * osc;
    drawDoubleArrow(140, 0, C.thA, ampA, '#ff9d76');
    textW('I ∝ cos²θ', 140, 40, { color: '#ff9d76', size: 10.5 });
  }
  // 强度标注
  if (C.on) {
    textW('I₀', -180, -24, { color: '#c7d2de', size: 11.5 });
    textW('I₀/2', -20, -40, { color: '#ffe066', size: 11.5 });
    textW('I₀·cos²θ/2', 140, -40, { color: '#ff9d76', size: 11.5 });
  }
  hud.set('ang', Math.abs(C.thA - C.polA) + '°');
  hud.set('int', C.on ? Math.round(Irel * 100) + '%' : '0%（光源关闭）');
  hud.set('st', !C.on ? '光源关闭' : (Math.abs(Math.abs(C.thA - C.polA) - 90) < 1 ? '消光！两透振方向垂直' : Irel > 0.9 ? '几乎全透' : '部分透过'));
}

/** 液晶显示屏原理：背光 → 起偏片 → 扭曲液晶（转 90°）→ 检偏片（正交）→ 像素 */
function drawLCD(t) {
  const C = C11;
  const volts = C.volts;
  // 背光板（常亮白光）
  fillRectW(-338, -84, -320, 84, 'rgba(255,248,228,0.9)');
  fillRectW(-344, -90, -320, 90, 'rgba(255,248,228,0.16)');
  for (let yy = -76; yy <= 76; yy += 22) circleW(-329, yy, 2.2, null, 0, 'rgba(255,255,245,0.8)');
  textW('背光板', -329, -104, { color: '#aebdd0', size: 11.5, bold: true });
  if (C.on) rayGlow(-318, 0, -236, 0, '#fff6dc', 0.8, 3);
  // 起偏片（透振方向竖直 90°）
  drawPolarizerPlate(-220, 90, '#7fd1ff', '起偏片（竖直）');
  if (C.on) rayGlow(-204, 0, -158, 0, '#cfe9ff', 0.5, 3);
  drawDoubleArrow(-180, 0, 90, 18, '#ffe066');
  textW('竖直线偏振', -180, -40, { color: '#ffe066', size: 10.5 });
  // 液晶盒
  fillRectW(-140, -64, -52, 64, 'rgba(140,190,235,0.10)');
  fillPolyW([[-140, -64], [-52, -64], [-52, 64], [-140, 64]], null, '#9fc4e0', 1.5);
  if (!volts) {
    // 无电压：分子扭曲 90°，把偏振面跟着转 90°
    for (let i = 0; i < 3; i++) {
      const yy = -34 + i * 34;
      const cxm = -96;
      ctx.save();
      ctx.strokeStyle = '#8dffb0'; ctx.lineWidth = 1.8; ctx.globalAlpha = 0.8;
      ctx.beginPath();
      for (let s = 0; s <= 20; s++) {
        const tt = s / 20;
        const px = cxm + (tt - 0.5) * 74;
        const py = yy + Math.sin(tt * Math.PI) * 14 * (i % 2 === 0 ? 1 : -1);
        const [a1, b1] = W2S(px, py);
        if (s === 0) ctx.moveTo(a1, b1); else ctx.lineTo(a1, b1);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.restore();
    }
    textW('液晶分子扭曲 90°（未加电压）', -96, 84, { color: '#8dffb0', size: 11, bold: true });
    drawDoubleArrow(-24, 0, 0, 18, '#ffe066');
    textW('被转成水平', -24, -40, { color: '#ffe066', size: 10.5 });
  } else {
    // 加电压：分子竖直排列，不再旋转偏振面
    for (let xx = -132; xx <= -60; xx += 12) {
      lineW(xx, -48, xx, 48, 'rgba(141,255,176,0.55)', 1.6);
    }
    textW('分子竖排 · 偏振面不转（已加电压）', -96, 84, { color: '#ff9d76', size: 11, bold: true });
    drawDoubleArrow(-24, 0, 90, 18, '#ffe066');
    textW('仍是竖直', -24, -40, { color: '#ffe066', size: 10.5 });
  }
  if (C.on) rayGlow(-50, 0, 24, 0, volts ? 'rgba(255,246,220,0.15)' : '#fff2cf', volts ? 0.25 : 0.75, 3);
  // 检偏片（透振方向水平 0°，与起偏片正交）
  drawPolarizerPlate(40, 0, '#ff9d76', '检偏片（水平）');
  // 像素屏
  const bright = !volts;
  fillRectW(96, -70, 210, 70, C.on ? (bright ? 'rgba(255,244,214,0.9)' : 'rgba(255,244,214,0.07)') : 'rgba(255,244,214,0.04)');
  fillPolyW([[96, -70], [210, -70], [210, 70], [96, 70]], null, '#5b6673', 1.4);
  // 像素网格
  ctx.save();
  ctx.globalAlpha = 0.35;
  for (let xx = 122; xx < 210; xx += 38) lineW(xx, -70, xx, 70, '#3a424e', 1);
  for (let yy = -32; yy <= 70; yy += 35) lineW(96, yy, 210, yy, '#3a424e', 1);
  ctx.restore();
  textW(bright ? '像素亮（光通过了）' : '像素暗（被挡住）', 153, 88, { color: bright ? '#ffe066' : '#8b98a8', size: 11.5, bold: true });
  hud.set('ang', volts ? '0°（未转）' : '90°（被液晶扭转）');
  hud.set('int', C.on ? (bright ? '≈100%（透）' : '≈0%（挡）') : '0%（背光关闭）');
  hud.set('st', !C.on ? '背光关闭' : (bright ? '亮点：偏振面被转 90°，能穿出检偏片' : '暗点：竖直偏振被水平检偏片挡住'));
}

/* ================= 绘制：第 12 章 自由光学台（七种元件 + 金环旋转） ================= */

function distToSeg(px, py, ax, ay, bx, by) {
  const ex = bx - ax, ey = by - ay;
  const L2 = ex * ex + ey * ey || 1;
  const t = clamp(((px - ax) * ex + (py - ay) * ey) / L2, 0, 1);
  return Math.hypot(px - (ax + ex * t), py - (ay + ey * t));
}

const SANDBOX_TYPES = ['mirror', 'prism', 'lens', 'concave', 'semicirc', 'brick', 'screen', 'water'];
const SANDBOX_NAMES = { mirror: '平面镜', prism: '三棱镜', lens: '凸透镜', concave: '凹透镜', semicirc: '半圆砖', brick: '长方砖', screen: '光屏', water: '水面' };

function elTopY(el) {
  if (el.type === 'mirror' || el.type === 'screen') return el.y + (el.type === 'screen' ? el.h : el.len) + 18;
  if (el.type === 'lens' || el.type === 'concave') return el.y + el.h + 18;
  if (el.type === 'prism') return el.y + el.H + 18;
  if (el.type === 'semicirc') return el.y + 18;
  if (el.type === 'brick') return el.y + el.h / 2 + 18;
  if (el.type === 'water') return el.y + 18;
  return el.y + 30;
}

function hitElement(wx, wy) {
  const els = C12.elements;
  for (let i = els.length - 1; i >= 0; i--) {
    const el = els[i];
    if (el.type === 'mirror') {
      const a = el.ang * DGR, hx = Math.cos(a) * el.len, hy = Math.sin(a) * el.len;
      if (distToSeg(wx, wy, el.x - hx, el.y - hy, el.x + hx, el.y + hy) < 14) return i;
    } else if (el.type === 'lens' || el.type === 'concave') {
      if (Math.abs(wx - el.x) < 16 && Math.abs(wy - el.y) < el.h + 8) return i;
    } else if (el.type === 'water') {
      if (Math.abs(wy - el.y) < 58 && Math.abs(wx - el.x) < el.half + 10) return i;
    } else if (el.type === 'screen') {
      const a = el.ang * DGR, hx = Math.cos(a) * el.h, hy = Math.sin(a) * el.h;
      if (distToSeg(wx, wy, el.x - hx, el.y - hy, el.x + hx, el.y + hy) < 14) return i;
    } else if (el.type === 'prism') {
      const v = prismVerts(el);
      if (pointInTri(wx, wy, v)) return i;
      for (const e of elementEdges(el)) {
        if (distToSeg(wx, wy, e.ax, e.ay, e.bx, e.by) < 12) return i;
      }
    } else if (el.type === 'semicirc') {
      const [lx, ly] = toLocal(el, wx, wy);
      if (lx * lx + ly * ly <= (el.R + 8) * (el.R + 8) && ly <= 10) return i;
    } else if (el.type === 'brick') {
      const [lx, ly] = toLocal(el, wx, wy);
      if (Math.abs(lx) <= el.w / 2 + 8 && Math.abs(ly) <= el.h / 2 + 8) return i;
    }
  }
  return -1;
}

function hitRotateRing(wx, wy) {
  if (C12.selected < 0) return false;
  const el = C12.elements[C12.selected];
  if (!el) return false;
  const ty = elTopY(el);
  return Math.hypot(wx - el.x, wy - ty) < 18;
}

function drawSandbox(dt, t) {
  const C = C12;
  const white = C.srcType === 'white';
  // 光源（激光器 / 白光光源壳体）
  drawLaserBox(-398, C.height + 6, C.angle, white ? '#fffbe8' : '#67e0ff', white ? '白光光源' : '激光光源');
  const ang = C.angle * DGR;
  const emit = [-398 + 46 * Math.cos(ang), C.height + 6 + 46 * Math.sin(ang)];
  const lams = white ? SPEC : [470];
  const allSegs = lams.map((lam) => traceRay(emit[0], emit[1], Math.cos(ang), Math.sin(ang), C.elements, { maxSeg: 16, collectScreens: true, nPrism: nPrism(lam) }));
  const hits = screenHits.slice();
  allSegs.forEach((segs, li) => {
    const rgb = wl2rgb(lams[li]);
    const col = 'rgb(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ')';
    segs.forEach((sg) => rayGlow(sg.ax, sg.ay, sg.bx, sg.by, white ? col : '#67e0ff', white ? 0.3 : 0.95, 2));
  });
  hits.forEach((h) => {
    circleW(h.x, h.y, 7, null, 0, white ? 'rgba(255,250,235,0.95)' : 'rgba(150,235,255,0.95)');
    circleW(h.x, h.y, 16, null, 0, white ? 'rgba(255,250,235,0.25)' : 'rgba(150,235,255,0.22)');
  });
  // 光点行进动画（沿第一束光的折线）
  const segs0 = allSegs[0];
  if (white) {
    // 白光主体沿主光线叠白色亮芯：未色散段读作白光，色散处彩色边缘自然露出
    segs0.forEach((sg) => rayGlow(sg.ax, sg.ay, sg.bx, sg.by, '#fffbe8', 0.6, 2));
  }
  const pts = [[emit[0], emit[1]]];
  const cum = [0];
  let total = 0;
  segs0.forEach((sg) => {
    total += Math.hypot(sg.bx - sg.ax, sg.by - sg.ay);
    pts.push([sg.bx, sg.by]);
    cum.push(total);
  });
  if (total > 0) {
    const f = (t * 0.35) % 1;
    const p = polyPoint(pts, cum, total, f);
    circleW(p[0], p[1], 3.4, null, 0, 'rgba(190,240,255,0.95)');
  }
  // 元件
  C.elements.forEach((el, i) => {
    const sel = i === C.selected;
    const selCol = sel ? '#ffd479' : null;
    if (el.type === 'mirror') {
      const a = el.ang * DGR, hx = Math.cos(a) * el.len, hy = Math.sin(a) * el.len;
      drawMirrorSeg(el.x - hx, el.y - hy, el.x + hx, el.y + hy, 1);
      if (sel) lineW(el.x - hx, el.y - hy, el.x + hx, el.y + hy, '#ffd479', 2, 0.9);
    } else if (el.type === 'lens') {
      lensShape(el.x, el.y, el.h * 0.3, el.h, 'rgba(180,210,235,0.12)', selCol || 'rgba(200,225,245,0.7)', sel ? 2.2 : 1.6);
      circleW(el.x - el.f, el.y, 2.6, null, 0, '#ffd479');
      circleW(el.x + el.f, el.y, 2.6, null, 0, '#ffd479');
      textW('f=' + el.f, el.x + el.f, el.y - 12, { color: '#ffd479', size: 10.5 });
    } else if (el.type === 'concave') {
      lensShape(el.x, el.y, -el.h * 0.22, el.h, 'rgba(180,210,235,0.12)', selCol || 'rgba(200,225,245,0.7)', sel ? 2.2 : 1.6);
      textW('凹透镜', el.x, el.y + el.h + 14, { color: sel ? '#ffd479' : '#9fc4e0', size: 10.5 });
    } else if (el.type === 'water') {
      fillRectW(el.x - el.half, el.y - 55, el.x + el.half, el.y, 'rgba(96,165,220,0.16)');
      lineW(el.x - el.half, el.y, el.x + el.half, el.y, selCol || '#7fb6dd', 2.4);
      for (let k = -el.half + 14; k <= el.half - 14; k += 28) {
        lineW(el.x + k, el.y - 8, el.x + k + 10, el.y - 12, 'rgba(150,200,235,0.5)', 1.2);
      }
    } else if (el.type === 'screen') {
      const a = el.ang * DGR, hx = Math.cos(a) * el.h, hy = Math.sin(a) * el.h;
      fillRectW(el.x - 3.6, el.y - Math.abs(hy) - 4, el.x + 3.6, el.y + Math.abs(hy) + 4, '#c9d4e2');
      lineW(el.x - hx, el.y - hy, el.x + hx, el.y + hy, selCol || '#dde5ee', 2.6);
      fillRectW(el.x - 16, el.y - Math.abs(hy) - 12, el.x + 16, el.y - Math.abs(hy) - 6, '#2a3543');
      textW('光屏', el.x, el.y + Math.abs(hy) + 16, { color: sel ? '#ffd479' : '#aebdd0', size: 10.5 });
    } else if (el.type === 'prism') {
      const v = prismVerts(el);
      fillPolyW([v[0], v[1], v[2]].map((p) => [p.x, p.y]), 'rgba(180,210,235,0.12)', selCol || 'rgba(200,225,245,0.7)', sel ? 2.2 : 1.6);
    } else if (el.type === 'semicirc') {
      const ppts = [];
      for (let k = 0; k <= 36; k++) {
        const aa = Math.PI + k / 36 * Math.PI;
        const lxp = Math.cos(aa) * el.R, lyp = Math.sin(aa) * el.R;
        const ca = Math.cos(el.ang * DGR), sa = Math.sin(el.ang * DGR);
        ppts.push([el.x + lxp * ca - lyp * sa, el.y + lxp * sa + lyp * ca]);
      }
      const ca = Math.cos(el.ang * DGR), sa = Math.sin(el.ang * DGR);
      ppts.push([el.x + el.R * ca, el.y + el.R * sa], [el.x - el.R * ca, el.y - el.R * sa]);
      fillPolyW(ppts, 'rgba(180,210,235,0.12)', selCol || 'rgba(200,225,245,0.7)', sel ? 2.2 : 1.6);
      textW('半圆砖', el.x, el.y - 14, { color: sel ? '#ffd479' : '#9fc4e0', size: 10.5 });
    } else if (el.type === 'brick') {
      const v = brickEdges(el).map((e) => ({ x: e.ax, y: e.ay }));
      fillPolyW(v, 'rgba(180,210,235,0.12)', selCol || 'rgba(200,225,245,0.7)', sel ? 2.2 : 1.6);
      textW('长方砖', el.x, el.y - el.h / 2 - 14, { color: sel ? '#ffd479' : '#9fc4e0', size: 10.5 });
    }
  });
  // 选中元件的金色圆环旋转手柄
  if (C.selected >= 0 && C.elements[C.selected]) {
    const el = C.elements[C.selected];
    const ty = elTopY(el);
    circleW(el.x, ty, 12, 'rgba(255,212,121,0.95)', 2.2, 'rgba(255,212,121,0.12)');
    circleW(el.x, ty, 3, null, 0, '#ffd479');
    lineW(el.x, ty - 12, el.x, elTopY(el) - 24, 'rgba(255,212,121,0.4)', 1);
    lineW(el.x, ty, el.x, ty - 12, 'rgba(255,212,121,0.4)', 1);
    textW('拖环旋转', el.x + 30, ty, { color: 'rgba(255,212,121,0.8)', size: 10 });
  }
  hud.set('n', C.elements.length + ' 个');
  hud.set('sel', C.selected >= 0 ? (SANDBOX_NAMES[C.elements[C.selected].type] || '?') : '无');
  hud.set('tip', '拖元件移动 · 拖金环旋转 · Delete 删除');
}

/* ---------------- 背景网格 / 总绘制 ---------------- */

function drawGrid() {
  const [wx0, wy1] = S2W(0, 0);
  const [wx1, wy0] = S2W(cw, chh);
  ctx.strokeStyle = 'rgba(159,178,200,0.05)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = Math.ceil(wx0 / 50) * 50; x <= wx1; x += 50) {
    const [sx] = W2S(x, 0);
    ctx.moveTo(sx, 0); ctx.lineTo(sx, chh);
  }
  for (let y = Math.ceil(wy0 / 50) * 50; y <= wy1; y += 50) {
    const [, sy] = W2S(0, y);
    ctx.moveTo(0, sy); ctx.lineTo(cw, sy);
  }
  ctx.stroke();
}

function drawQuizBg(dt, t) {
  for (let i = 0; i < 4; i++) {
    const r = 130 + i * 90 + Math.sin(t * 0.8 + i) * 8;
    circleW(0, 0, r, 'rgba(120,170,220,' + (0.10 - i * 0.02) + ')', 1.2);
  }
}

const DRAW = [
  drawReflection, drawMirrorImage, drawRefraction, drawTIR, drawPrism,
  drawLensBench, drawEye, drawDoubleSlit, drawDiffraction, drawFilm,
  drawPolarization, drawSandbox, drawQuizBg,
];

function drawScene(dt, t) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  // 暗室背景：上深下微亮的纵向渐变
  const bg = ctx.createLinearGradient(0, 0, 0, chh);
  bg.addColorStop(0, '#0b0f16');
  bg.addColorStop(0.72, '#0d1117');
  bg.addColorStop(1, '#12161d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, cw, chh);
  drawGrid();
  const fn = DRAW[S.ch];
  if (fn) fn(dt, t);
  vignette();
}

/* ---------------- 章节定义 ---------------- */

const ctl = createControlsPanel(document.getElementById('controls'));

const SECTIONS = [
  {
    title: '光的反射定律',
    html: `<p>光射到<b>平面镜</b>上会发生反射。反射定律：<span class="hl">反射角等于入射角</span>（i = r），入射光线、反射光线与法线<b>在同一平面内</b>，且分居法线两侧。</p>
<p>① 拖动<b>入射角</b>滑杆（或直接拖动量角盘上的激光器），激光器绕盘心转动，观察黄色角 i 与绿色角 r 始终相等；② 拖动<b>镜面倾角</b>，法线始终垂直于镜面，两角依然相等；③ 点<b>「折下反射侧半盘」</b>——盘面折下去就看不到反射光了，折回来又能看到：三线<b>共面</b>的实验证据。</p>
<p>点<b>「光路可逆演示」</b>：让绿光逆着反射光射入，它会沿原入射方向射出。每组 i、r 用「记入数据表」保存，验证 i = r。</p>`,
    enter() {
      S.ch = 0;
      Object.assign(C1, { i: 40, tilt: 0, showN: true, showVals: true, fold: false, foldA: 0, revOn: false, revT: 0 });
      fitView(880, 600, 0, 10);
      viewReset = makeReset(880, 600, 0, 10);
      setHUD([['i', '入射角 i'], ['r', '反射角 r'], ['t', '镜面倾角']]);
      ctl.clear();
      ctl.slider({ label: '入射角', min: 0, max: 85, step: 1, value: C1.i, fmt: (v) => v + '°', onInput: (v) => { C1.i = v; } });
      ctl.slider({ label: '镜面倾角', min: -45, max: 45, step: 1, value: C1.tilt, fmt: (v) => v + '°', onInput: (v) => { C1.tilt = v; } });
      ctl.toggle({ label: '显示法线', value: true, onChange: (v) => { C1.showN = v; } });
      ctl.toggle({ label: '显示角度值', value: true, onChange: (v) => { C1.showVals = v; } });
      ctl.button({ label: '折下反射侧半盘', onClick: () => { C1.fold = !C1.fold; } });
      ctl.button({ label: '光路可逆演示', onClick: () => { C1.revOn = !C1.revOn; } });
      dock.build({
        title: 'i 与 r 逐组对照',
        header: ['入射角 i/°', '反射角 r/°'],
        csvName: 'optics-reflection',
        onRecord: () => [C1.i, C1.i],
        note: '验证：<b>r = i</b>，与镜面倾角无关。',
      });
      setHint('反射角 = 入射角；三线共面、两角相等、光路可逆；可直接拖动量角盘上的激光器改变入射角');
    },
  },
  {
    title: '平面镜成像',
    html: `<p>用<b>玻璃板</b>代替平面镜做成像实验：玻璃板既能透光（看到板后的蜡烛 B），又能反射成像（看到 A 的像）。</p>
<p><b>拖动未点燃的蜡烛 B</b>，直到它与 A 的像<span class="hl">完全重合</span>（B 好像也被点燃了）。此时量一量：<span class="hl">像距 = 物距，像高 = 物高</span>——平面镜成<b>等大、正立的虚像</b>，与物关于镜面对称。</p>
<p>打开「把光屏放到像点」：光屏上<b>接收不到</b>任何光斑——虚像由反射光线的<b>反向延长线</b>会聚而成，像点处并没有真实的光会聚。这就是「水中倒影」「穿衣镜」的原理。</p>`,
    enter() {
      S.ch = 1;
      Object.assign(C2, { dist: 130, showRays: true, showImg: true, anim: false, animT: 0, screen: false, bx: 305, over: false });
      fitView(900, 580, 30, -10);
      viewReset = makeReset(900, 580, 30, -10);
      setHUD([['p', '物距'], ['q', '像距'], ['ov', 'B 与像'], ['scr', '光屏']]);
      ctl.clear();
      ctl.slider({ label: '物距', min: 40, max: 280, step: 2, value: C2.dist, fmt: (v) => v + '', onInput: (v) => { C2.dist = v; } });
      ctl.toggle({ label: '显示光路', value: true, onChange: (v) => { C2.showRays = v; } });
      ctl.toggle({ label: '显示虚像', value: true, onChange: (v) => { C2.showImg = v; } });
      ctl.toggle({ label: '把光屏放到像点', value: false, onChange: (v) => { C2.screen = v; } });
      const btn = ctl.button({
        label: '▶ 光线动画',
        onClick: () => {
          C2.anim = !C2.anim;
          btn.textContent = C2.anim ? '⏸ 暂停动画' : '▶ 光线动画';
          btn.classList.toggle('active', C2.anim);
        },
      });
      setHint('按住蜡烛 B 拖动，直到它与 A 的像完全重合（B 像被点亮）');
    },
  },
  {
    title: '光的折射',
    html: `<p>激光从空气斜射入<b>半圆形玻璃砖</b>的平直界面中心 O。光进入玻璃后偏向法线，折射角 θ₂ 小于入射角 θ₁；此后沿<b>半径方向</b>直达弧面，出射时不再偏折——正好便于读数。</p>
<p>多测几组 θ₁、θ₂ 会发现两者并不成正比，而是<span class="hl">正弦成正比</span>——折射定律 n₁·sinθ₁ = n₂·sinθ₂。用「记入数据表」存几组，下方图像自动画出 <b>sinθ₁–sinθ₂</b> 直线，<b>斜率就是折射率 n</b>。</p>
<p>切换「水 / 玻璃 / 钻石」对比：水的 n=1.33，玻璃约 1.5，<b>钻石高达 2.42</b>——折射率越大，偏折越明显。生活中的折射：池水看起来变浅、斜插水中的筷子像折弯了。</p>`,
    enter() {
      S.ch = 2;
      Object.assign(C3, { th1: 45, medium: 'water', showAngles: true, green: false });
      fitView(900, 580, 0, -20);
      viewReset = makeReset(900, 580, 0, -20);
      setHUD([['t1', '入射角 θ₁'], ['t2', '折射角 θ₂'], ['eq', 'n₁sinθ₁ = n₂sinθ₂']]);
      ctl.clear();
      ctl.slider({ label: '入射角', min: 5, max: 85, step: 1, value: C3.th1, fmt: (v) => v + '°', onInput: (v) => { C3.th1 = v; } });
      ctl.seg({
        options: MEDIA3.map((m) => ({ label: m.label, value: m.id })),
        value: 'water',
        onChange: (v) => { C3.medium = v; },
      });
      ctl.toggle({ label: '显示角度', value: true, onChange: (v) => { C3.showAngles = v; } });
      ctl.toggle({ label: '绿色激光', value: false, onChange: (v) => { C3.green = v; } });
      dock.build({
        title: 'sinθ₁–sinθ₂ 关系',
        header: ['θ₁/°', 'θ₂/°', 'sinθ₁', 'sinθ₂'],
        chart: 'sin',
        csvName: 'optics-refraction',
        onRecord: () => {
          const med = MEDIA3.find((m) => m.id === C3.medium);
          const th2 = Math.asin(clamp(Math.sin(C3.th1 * DGR) / med.n, 0, 1)) / DGR;
          return [C3.th1, +th2.toFixed(1), +Math.sin(C3.th1 * DGR).toFixed(4), +Math.sin(th2 * DGR).toFixed(4)];
        },
        note: '画 sinθ₁–sinθ₂ 图像，过原点直线斜率 = 折射率 n（换介质后重记，比较斜率）。',
      });
      setHint('HUD 显示 n₁sinθ₁ = n₂sinθ₂ —— 两边数值始终相等；换钻石看看偏折有多明显');
    },
  },
  {
    title: '全反射与光纤',
    html: `<p>光从<b>光密介质射向光疏介质</b>（水→空气、玻璃→空气、钻石→空气）时，折射角大于入射角。当入射角达到<span class="hl">临界角 C</span>（sinC = n₂/n₁）时，折射光沿界面掠出；<b>超过临界角，折射光完全消失</b>，只剩反射光——这就是<b>全反射</b>。</p>
<p>水的临界角约 <b>48.8°</b>，玻璃约 <b>41.8°</b>，钻石折射率最大（2.42），临界角只有 <b>24°</b>——光线在里面稍一斜就全反射弹回来，所以钻石格外闪亮。逐渐增大入射角，观察折射光如何变弱、贴近界面直至消失。</p>
<p><b>光纤通信</b>正是利用全反射：光在纤细的玻璃纤芯内一次次全反射，锯齿形前进，即使光纤弯曲也能从另一端射出（内窥镜、装饰灯也是同样原理）。切到「光纤演示」观看。</p>`,
    enter() {
      S.ch = 3;
      Object.assign(C4, { th: 50, medium: 'water', mode: 'interface', play: true, fT: 0 });
      fitView(900, 580, 0, -30);
      viewReset = makeReset(900, 580, 0, -30);
      setHUD([['tc', '临界角 C'], ['ti', '入射角'], ['st', '状态']]);
      ctl.clear();
      ctl.slider({ label: '入射角', min: 5, max: 85, step: 1, value: C4.th, fmt: (v) => v + '°', onInput: (v) => { C4.th = v; } });
      ctl.seg({
        options: MEDIA3.map((m) => ({ label: m.label.replace('n=', '→空气 n='), value: m.id })),
        value: 'water',
        onChange: (v) => { C4.medium = v; },
      });
      ctl.seg({
        options: [{ label: '界面', value: 'interface' }, { label: '光纤演示', value: 'fiber' }],
        value: 'interface',
        onChange: (v) => { C4.mode = v; },
      });
      const btn = ctl.button({
        label: '⏸ 暂停动画',
        onClick: () => {
          C4.play = !C4.play;
          btn.textContent = C4.play ? '⏸ 暂停动画' : '▶ 播放动画';
          btn.classList.toggle('active', !C4.play);
        },
      });
      dock.hide();
      setHint('入射角 > 临界角 → 折射光消失，只剩反射光；钻石临界角只有 24°');
    },
  },
  {
    title: '棱镜色散',
    html: `<p><b>白光是复色光</b>。通过三棱镜时，不同波长的色光折射率不同（红光 n≈1.51 最小、紫光 n≈1.53 最大），偏折程度不同，白光被<span class="hl">分解成红橙黄绿蓝靛紫</span>的彩色光谱——这就是<b>色散</b>。牛顿用这个实验证明：白光是由各种色光混合而成的。</p>
<p>红端偏折<b>最小</b>，紫端偏折<b>最大</b>。关掉白光，改用<b>红色激光</b>：经过棱镜只偏折、不再分开。勾选<b>「加倒置棱镜」</b>——顶点朝下的第二块棱镜把各色光重新并拢，<b>还原成白光</b>：分解与合成互为逆过程。</p>
<p>改变棱镜顶角 A 与入射角 i，观察光谱扇形如何张开、收拢。单色模式下 HUD 给出<b>偏向角 δ</b>，缓慢调整入射角可找到 δ 的最小值（此时光路对称）——精密测折射率就用最小偏向角。</p>`,
    enter() {
      S.ch = 4;
      Object.assign(C5, { apex: 60, inc: 45, white: true, labels: true, recombine: false });
      fitView(1000, 640, 60, 20);
      viewReset = makeReset(1000, 640, 60, 20);
      setHUD([['A', '棱镜顶角 A'], ['i', '入射角 i'], ['d', '偏向角 δ']]);
      ctl.clear();
      ctl.slider({ label: '棱镜顶角 A', min: 40, max: 70, step: 1, value: C5.apex, fmt: (v) => v + '°', onInput: (v) => { C5.apex = v; } });
      ctl.slider({ label: '入射角', min: 20, max: 65, step: 1, value: C5.inc, fmt: (v) => v + '°', onInput: (v) => { C5.inc = v; } });
      ctl.toggle({ label: '白光（关=红激光）', value: true, onChange: (v) => { C5.white = v; } });
      ctl.toggle({ label: '光谱标注', value: true, onChange: (v) => { C5.labels = v; } });
      ctl.toggle({ label: '加倒置棱镜（合成白光）', value: false, onChange: (v) => { C5.recombine = v; } });
      dock.hide();
      setHint('白光 → 七彩扇形；红偏折最小、紫最大；倒置棱镜把各色光并回白光');
    },
  },
  {
    title: '凸透镜成像规律',
    html: `<p>把<b>蜡烛、凸透镜、光屏</b>依次架在光具座上，烛焰、透镜、光屏中心调到同一高度。移动光屏直到屏上的像<b>最清晰</b>，读出物距 u 和像距 v。成像满足<span class="hl">1/f = 1/u + 1/v</span>，放大率 m = v/u。</p>
<p>成像规律：<b>u&gt;2f</b> 倒立缩小实像（照相机）；<b>u=2f</b> 倒立等大；<b>f&lt;u&lt;2f</b> 倒立放大实像（投影仪）；<b>u=f</b> 不成像；<b>u&lt;f</b> 正立放大虚像（放大镜，光屏接不到）。</p>
<p>每组 u、v 用「记入数据表」保存，下方自动画出 <b>1/u–1/v</b> 图像：<span class="hl">直线截距就是 1/f</span>。移动光屏后点「自动对焦」，光屏会滑到成清晰像的位置。</p>`,
    enter() {
      S.ch = 5;
      Object.assign(C6, { u: 24, f: 12, showRays: true, screenX: 24, tween: null });
      fitView(860, 560, 20, -20);
      viewReset = makeReset(860, 560, 20, -20);
      setHUD([['u', '物距 u'], ['v', '像距 v'], ['m', '放大率'], ['nat', '像的性质']]);
      ctl.clear();
      ctl.slider({ label: '物距 u', min: 3, max: 80, step: 0.5, value: C6.u, fmt: (v) => v.toFixed(1) + ' cm', onInput: (v) => { C6.u = v; } });
      ctl.slider({ label: '焦距 f', min: 8, max: 16, step: 1, value: C6.f, fmt: (v) => v + ' cm', onInput: (v) => { C6.f = v; } });
      ctl.toggle({ label: '显示光路', value: true, onChange: (v) => { C6.showRays = v; } });
      ctl.button({
        label: '🎯 自动对焦',
        onClick: () => {
          const denom = C6.u - C6.f;
          const v = Math.abs(denom) < 0.05 ? Infinity : C6.u * C6.f / denom;
          if (v > 0 && v !== Infinity && Math.abs(v) <= 380) {
            C6.tween = { from: C6.screenX, to: v, t: 0 };
            setHint('光屏正在移向清晰成像位置 v = ' + v.toFixed(1) + ' cm');
          } else {
            setHint(v < 0 ? '虚像不能呈现在光屏上' : '像在无穷远，光屏无法承接');
          }
        },
      });
      dock.build({
        title: '1/u–1/v 关系',
        header: ['u/cm', 'v/cm', '1/u', '1/v'],
        chart: 'uv',
        csvName: 'optics-lens',
        onRecord: () => {
          const denom = C6.u - C6.f;
          const v = Math.abs(denom) < 0.05 ? Infinity : C6.u * C6.f / denom;
          if (!(v > 0) || v === Infinity) { setHint('当前不成实像（u≤f），不能记入数据表'); return null; }
          return [C6.u, +v.toFixed(1), +(1 / C6.u).toFixed(4), +(1 / v).toFixed(4)];
        },
        note: '1/u–1/v 图像为直线，截距 ≈ 1/f；改焦距后重记一组试试。',
      });
      setHint('u>2f 缩小实像 · f<u<2f 放大实像 · u<f 放大虚像；光屏可沿导轨滑动');
    },
  },
  {
    title: '眼睛与视力矫正',
    html: `<p>眼睛像一台自动对焦的相机：<b>角膜与晶状体</b>相当于凸透镜，<b>视网膜</b>是底片。睫状体改变晶状体曲率：<span class="hl">看远变扁平（焦距变长）、看近变凸（焦距变短）</span>，让像恰好成在视网膜上。</p>
<p><b>近视</b>：眼轴过长（或晶状体过凸），平行光会聚在<b>视网膜前</b> → 戴<b>凹透镜</b>（发散）矫正；<b>远视</b>：眼轴过短，像成在<b>视网膜后</b> → 戴<b>凸透镜</b>（会聚）矫正。</p>
<p>拖动眼轴长度与晶状体曲率，观察像点跑到视网膜前还是后；再选择矫正镜片，看像点回到视网膜上。HUD 给出按当前眼状态算出的<span class="hl">验光处方</span>：度数 = 光焦度 × 100 = 100/f（f 以 m 计）。</p>`,
    enter() {
      S.ch = 6;
      Object.assign(C7, { axial: 80, curv: 0.54, corr: 'none', lastDiff: 0 });
      fitView(700, 500, 10, 0);
      viewReset = makeReset(700, 500, 10, 0);
      setHUD([['ax', '眼轴（相对正常）'], ['fe', '晶状体焦距'], ['pos', '像点位置'], ['deg', '验光处方'], ['st', '状态']]);
      ctl.clear();
      ctl.slider({ label: '眼轴长度', min: 56, max: 104, step: 1, value: C7.axial, fmt: (v) => ((v - 80) / 80 * 100 >= 0 ? '+' : '') + ((v - 80) / 80 * 100).toFixed(0) + '%', onInput: (v) => { C7.axial = v; } });
      ctl.slider({ label: '晶状体曲率', min: 0, max: 1, step: 0.01, value: C7.curv, fmt: (v) => (v < 0.33 ? '扁平·看远' : v > 0.66 ? '较凸·看近' : '适中'), onInput: (v) => { C7.curv = v; } });
      ctl.seg({
        options: [{ label: '无矫正', value: 'none' }, { label: '凹透镜·近视', value: 'concave' }, { label: '凸透镜·远视', value: 'convex' }],
        value: 'none',
        onChange: (v) => { C7.corr = v; },
      });
      dock.hide();
      setHint('像在视网膜前 → 近视 → 凹透镜；像在后 → 远视 → 凸透镜；HUD 直接给验光度数');
    },
  },
  {
    title: '双缝干涉',
    html: `<p>1801 年<b>杨氏双缝实验</b>：光通过两条窄缝后互相叠加，屏上出现<span class="hl">明暗相间的条纹</span>——这是光具有<b>波动性</b>的决定性证据。两列波<b>波峰遇波峰</b>→相长→亮纹；<b>波峰遇波谷</b>→相消→暗纹。缝前画的同心弧就是两列波的波前（波长已放大），弧线交叠处即亮纹方向。</p>
<p>条纹间距：<span class="hl">Δx = λL/d</span>（λ 波长、L 缝屏距、d 双缝间距）。波长越长、L 越大、d 越小，条纹越宽。拖动三个滑杆验证公式（HUD 实时计算 Δx）。</p>
<p>屏下方是<b>测量头</b>：把两只游标对齐亮纹中心，跨 k 条亮纹，读出总宽度 a，即可反推<span class="hl">λ测 = a·d/(k·L)</span>，与设定波长对照。打开白光——中央是白色亮纹，两侧是彩色条纹（长波红在外侧）。</p>`,
    enter() {
      S.ch = 7;
      Object.assign(C8, { lam: 550, d: 0.2, L: 30, white: false, mx1: -150, mx2: 150 });
      fitView(940, 600, 0, 30);
      viewReset = makeReset(940, 600, 0, 30);
      setHUD([['lam', '波长 λ'], ['dx', 'Δx = λL/d'], ['wm', '模式']]);
      ctl.clear();
      ctl.slider({ label: '波长 λ', min: 400, max: 700, step: 5, value: C8.lam, fmt: (v) => v + ' nm', onInput: (v) => { C8.lam = v; } });
      ctl.slider({ label: '缝间距 d', min: 0.1, max: 0.5, step: 0.01, value: C8.d, fmt: (v) => v.toFixed(2) + ' mm', onInput: (v) => { C8.d = v; } });
      ctl.slider({ label: '缝屏距 L', min: 15, max: 60, step: 1, value: C8.L, fmt: (v) => v + ' cm', onInput: (v) => { C8.L = v; } });
      ctl.toggle({ label: '白光', value: false, onChange: (v) => { C8.white = v; } });
      dock.hide();
      setHint('拖动测量头两只游标对齐亮纹中心，跨 k 条反推波长 λ测');
    },
  },
  {
    title: '单缝衍射与光栅',
    html: `<p>光绕过障碍物边缘传播的现象叫<b>衍射</b>。「发生明显衍射的条件」是缝宽与波长可比拟。</p>
<p><b>单缝</b>：屏上出现宽大的中央亮纹（两侧对称的弱亮纹），<span class="hl">中央亮纹角宽度 ≈ 2λ/a</span>，缝越窄条纹越宽。</p>
<p><b>光栅</b>（N 条等宽等距的缝）：条纹变得<span class="hl">又细又亮</span>——N 缝干涉主极大强度含 N² 因子、宽度反比于 N，次极大很弱。光栅光谱仪靠它精确分辨波长（CD 彩虹就是衍射光栅）。</p>
<p>切换三种模式，调节缝宽 a 与缝数 N；打开<b>白光</b>：单缝中央白亮、两侧见彩边，光栅则拉出<span class="hl">一级级彩色光谱</span>（紫偏折小、红偏折大）。</p>`,
    enter() {
      S.ch = 8;
      Object.assign(C9, { mode: 'single', a: 0.1, lam: 550, N: 4, white: false });
      fitView(940, 600, 0, 30);
      viewReset = makeReset(940, 600, 0, 30);
      setHUD([['mode', '模式'], ['cw', '中央亮纹角宽度'], ['dx', '条纹间距']]);
      ctl.clear();
      ctl.seg({
        options: [{ label: '单缝', value: 'single' }, { label: '双缝', value: 'double' }, { label: '光栅 N 缝', value: 'grating' }],
        value: 'single',
        onChange: (v) => { C9.mode = v; },
      });
      ctl.sep();
      ctl.slider({ label: '缝宽 a', min: 0.05, max: 0.2, step: 0.005, value: C9.a, fmt: (v) => v.toFixed(3) + ' mm', onInput: (v) => { C9.a = v; } });
      ctl.slider({ label: '波长 λ', min: 400, max: 700, step: 5, value: C9.lam, fmt: (v) => v + ' nm', onInput: (v) => { C9.lam = v; } });
      ctl.slider({ label: '缝数 N', min: 2, max: 8, step: 1, value: C9.N, fmt: (v) => v + ' 缝', onInput: (v) => { C9.N = v; } });
      ctl.toggle({ label: '白光', value: false, onChange: (v) => { C9.white = v; } });
      dock.hide();
      setHint('单缝：a 越小中央亮纹越宽；光栅：N 越大条纹越细锐；白光看彩色光谱');
    },
  },
  {
    title: '薄膜干涉',
    html: `<p><b>肥皂膜</b>：竖直铁丝圈上的膜在重力下<b>上薄下厚</b>。光在膜的前、后两个表面反射，两列反射光叠加：厚度 t 满足 2nt = kλ 附近相互减弱，(k + ½)λ 附近相互加强。同一厚度对应同一颜色 → 水平彩色条纹；膜不断排液变薄，条纹向下移动，最上方厚度趋近零、所有色光都相消 → 出现<b>黑区</b>（膜即将破裂的标志）。用<b>钠黄光</b>照射，只看到黄黑相间的条纹。</p>
<p><b>牛顿环</b>：平凸透镜压在平板玻璃上，空气膜厚度 t = r²/2R，形成<span class="hl">内疏外密的同心圆环</span>，中心是暗斑（r² = 2R·t，t=0 全消光）。白光下是彩色环，钠光下是黄黑环。</p>
<p>应用：<b>增透膜</b>厚度取 λ/4，使膜两面反射光相消（镜头镀膜的蓝紫色）；蜻蜓翅膀、水面油膜的彩色也都是薄膜干涉。</p>`,
    enter() {
      S.ch = 9;
      Object.assign(C10, { grad: 280, light: 'white', mode: 'film', play: false, drain: 0 });
      fitView(760, 640, -20, 0);
      viewReset = makeReset(760, 640, -20, 0);
      setHUD([['wm', '入射光'], ['th', '厚度口径'], ['st', '状态']]);
      ctl.clear();
      ctl.seg({
        options: [{ label: '肥皂膜', value: 'film' }, { label: '牛顿环', value: 'newton' }],
        value: 'film',
        onChange: (v) => { C10.mode = v; },
      });
      ctl.sep();
      ctl.slider({ label: '膜厚梯度', min: 100, max: 500, step: 10, value: C10.grad, fmt: (v) => '+' + v + ' nm', onInput: (v) => { C10.grad = v; } });
      ctl.seg({
        options: [{ label: '白光', value: 'white' }, { label: '绿光', value: 'green' }, { label: '钠黄光', value: 'sodium' }],
        value: 'white',
        onChange: (v) => { C10.light = v; },
      });
      const btn = ctl.button({
        label: '▶ 重力排液',
        onClick: () => {
          if (C10.drain >= 1) C10.drain = 0;
          C10.play = !C10.play;
          btn.textContent = C10.play ? '⏸ 暂停排液' : '▶ 重力排液';
          btn.classList.toggle('active', C10.play);
        },
      });
      ctl.button({ label: '↺ 复原膜', onClick: () => { C10.drain = 0; C10.play = false; btn.textContent = '▶ 重力排液'; btn.classList.remove('active'); } });
      dock.hide();
      setHint('肥皂膜排液后顶部先变黑；切牛顿环看同心圆环（中心暗、内疏外密）');
    },
  },
  {
    title: '光的偏振',
    html: `<p><b>只有横波才有偏振</b>——光的偏振证明光是横波。自然光沿各方向振动；通过<span class="hl">起偏器</span>后只剩一个振动方向；再过<b>检偏器</b>，透射强度服从<span class="hl">马吕斯定律 I = I₀·cos²θ</span>。旋转检偏器：θ=0° 全透，θ=90° <b>完全消光</b>。</p>
<p><b>液晶显示屏（LCD）</b>：两块<b>正交</b>的偏振片之间夹着扭曲排列的液晶。不加电压时，液晶把偏振方向<span class="hl">扭转 90°</span>，光恰好能穿出第二片（像素亮）；加电压后分子改为竖直排列、不再旋转，竖直偏振被水平检偏片挡住（像素暗）——屏幕上每个像素就是这样被开关的。</p>
<p>应用：偏振太阳镜削弱水面/路面眩光、摄影偏振镜消除反光。切到「液晶屏」模式，用「加电压」按钮开关一个像素。</p>`,
    enter() {
      S.ch = 10;
      Object.assign(C11, { thA: 30, polA: 0, on: true, viz: true, mode: 'malus', volts: false });
      fitView(960, 480, -40, 0);
      viewReset = makeReset(960, 480, -40, 0);
      setHUD([['ang', '偏振状态'], ['int', '透过率'], ['st', '状态']]);
      ctl.clear();
      ctl.seg({
        options: [{ label: '马吕斯定律', value: 'malus' }, { label: '液晶屏', value: 'lcd' }],
        value: 'malus',
        onChange: (v) => { C11.mode = v; },
      });
      ctl.sep();
      ctl.slider({ label: '检偏器角度 θ', min: 0, max: 180, step: 1, value: C11.thA, fmt: (v) => v + '°', onInput: (v) => { C11.thA = v; } });
      ctl.slider({ label: '起偏器角度', min: 0, max: 180, step: 1, value: C11.polA, fmt: (v) => v + '°', onInput: (v) => { C11.polA = v; } });
      const btn = ctl.button({
        label: '💡 关闭光源',
        onClick: () => {
          C11.on = !C11.on;
          btn.textContent = C11.on ? '💡 关闭光源' : '💡 打开光源';
          btn.classList.toggle('active', !C11.on);
        },
      });
      ctl.button({ label: '⚡ 加电压 / 断电压', onClick: () => { C11.volts = !C11.volts; setHint(C11.volts ? '已加电压：分子竖排，像素变暗' : '已断电压：分子扭曲，像素变亮'); } });
      ctl.toggle({ label: '偏振片可视化', value: true, onChange: (v) => { C11.viz = v; } });
      dock.hide();
      setHint('θ=90° 完全消光——横波的独家证据；LCD 模式点「加电压」开关像素');
    },
  },
  {
    title: '自由光学台',
    html: `<p>沙盒模式：像真正的光学实验台一样<span class="hl">自由搭建光路</span>。元件库开放七种：平面镜 / 三棱镜 / 凸透镜 / <b>凹透镜</b> / <b>半圆砖</b> / <b>长方砖</b> / <b>光屏</b>，另有水面与白光光源。</p>
<p>· 选元件类型后点「＋添加」放到台上；<b>按住元件拖动</b>移动，激光实时重算光路（反射、折射、全反射、透镜偏折自动发生）<br>· 点选元件后，元件上方出现<span class="hl">金色圆环</span>：<b>按住金环拖动即可旋转</b>元件<br>· 选中后按 <b>Delete</b> 键（或点「删除选中」）移除<br>· 光源可在「激光 / 白光」间切换：白光穿过棱镜会现场色散</p>
<p>试试：棱镜后面接一面镜子把光反射回去（会不会再次折射？）；让光从水下向上射向水面，调到全反射；两面镜子搭一个潜望镜；白光穿过三棱镜再落到光屏上。</p>`,
    enter() {
      S.ch = 11;
      C12.angle = -5; C12.height = 30; C12.srcType = 'laser';
      C12.elements = [{ type: 'mirror', x: 80, y: -10, ang: 25, len: 75 }];
      C12.selected = -1; C12.dragging = null; C12.rotating = null; C12.addN = 0; C12.selType = 'mirror';
      fitView(1000, 580, -60, 0);
      viewReset = makeReset(1000, 580, -60, 0);
      setHUD([['n', '台面元件'], ['sel', '选中元件'], ['tip', '操作']]);
      ctl.clear();
      ctl.seg({
        options: SANDBOX_TYPES.map((t) => ({ label: SANDBOX_NAMES[t], value: t })),
        value: 'mirror',
        onChange: (v) => { C12.selType = v; },
      });
      ctl.button({
        label: '＋添加',
        onClick: () => {
          if (C12.elements.length >= 8) { setHint('元件太多啦，先删除一些'); return; }
          const t = C12.selType;
          const n = C12.addN++;
          const px = -140 + (n % 4) * 90, py = 70 - (n % 3) * 40;
          if (t === 'mirror') C12.elements.push({ type: 'mirror', x: px, y: py, ang: 20, len: 75 });
          else if (t === 'prism') C12.elements.push({ type: 'prism', x: px, y: py - 20, ang: 0, apex: 60, H: 85, hB: 25, n: 1.52 });
          else if (t === 'lens') C12.elements.push({ type: 'lens', x: px, y: py, f: 110, h: 60 });
          else if (t === 'concave') C12.elements.push({ type: 'concave', x: px, y: py, f: -110, h: 60 });
          else if (t === 'semicirc') C12.elements.push({ type: 'semicirc', x: px, y: py + 10, ang: 0, R: 70, n: 1.5 });
          else if (t === 'brick') C12.elements.push({ type: 'brick', x: px, y: py, ang: 0, w: 130, h: 56, n: 1.5 });
          else if (t === 'screen') C12.elements.push({ type: 'screen', x: px, y: py, ang: 90, h: 80 });
          else C12.elements.push({ type: 'water', x: px, y: py, half: 110 });
        },
      });
      ctl.button({
        label: '🗑 删除选中',
        onClick: () => {
          if (C12.selected < 0) { setHint('先在台面上点选一个元件'); return; }
          C12.elements.splice(C12.selected, 1);
          C12.selected = -1;
        },
      });
      ctl.sep();
      ctl.seg({
        options: [{ label: '激光', value: 'laser' }, { label: '白光', value: 'white' }],
        value: 'laser',
        onChange: (v) => { C12.srcType = v; },
      });
      ctl.slider({ label: '光源角度', min: -60, max: 60, step: 1, value: C12.angle, fmt: (v) => v + '°', onInput: (v) => { C12.angle = v; } });
      ctl.slider({ label: '光源高度', min: -170, max: 170, step: 2, value: C12.height, fmt: (v) => v + '', onInput: (v) => { C12.height = v; } });
      ctl.button({
        label: '✕ 清空台面',
        onClick: () => { C12.elements = []; C12.selected = -1; },
      });
      dock.hide();
      setHint('按住元件拖动 · 按住上方金环旋转 · 选中后按 Delete 删除 · 拖空白平移 · 滚轮缩放');
    },
  },
  {
    title: '随堂检测',
    html: `<p>8 道选择题，覆盖反射定律与光路可逆、折射与折射率、全反射条件、凸透镜成像区间、干涉条纹间距、薄膜与牛顿环、偏振与液晶屏。</p>`,
    enter() {
      S.ch = 12;
      hideHUD();
      dock.hide();
      setHint(null);
      ctl.clear();
      showQuiz();
    },
  },
];

/* ---------------- 随堂检测 ---------------- */

const QUIZ = [
  {
    q: '一束光射向平面镜，入射光线与镜面的夹角为 30°，则反射角是？',
    opts: ['30°', '60°', '90°', '15°'],
    a: 1,
    ex: '入射角是入射光线与法线的夹角：90° − 30° = 60°。反射定律：反射角等于入射角，所以也是 60°。注意「与镜面的夹角」和「入射角」不是一回事。',
  },
  {
    q: '让光沿原来反射光的方向逆着射向平面镜，反射后会怎样？',
    opts: ['沿新的方向反射', '沿原入射方向射出', '发生全反射', '被镜面吸收'],
    a: 1,
    ex: '反射时光路是可逆的：逆着反射光射入，必沿原入射方向射出。第 1 章的「光路可逆演示」按钮就是这条规律的动画。',
  },
  {
    q: '光从空气斜射入水中时，下列说法正确的是？',
    opts: ['折射角等于入射角', '折射角小于入射角', '折射角大于入射角', '折射光线与入射光线一定平行'],
    a: 1,
    ex: '光从光疏介质进入光密介质（n 变大），折射光线偏向法线，折射角小于入射角（n₁sinθ₁ = n₂sinθ₂）。池水「变浅」、筷子「折弯」都是这个道理。',
  },
  {
    q: '发生全反射的条件是？',
    opts: ['光从光疏介质射向光密介质，且入射角大于临界角', '光从光密介质射向光疏介质，且入射角大于或等于临界角', '只要入射角足够大就会发生全反射', '光从光密介质射向光疏介质就一定发生全反射'],
    a: 1,
    ex: '两个条件缺一不可：① 光从光密介质射向光疏介质（水→空气、玻璃→空气）；② 入射角 ≥ 临界角（sinC = n₂/n₁）。水的临界角约 48.8°，玻璃约 41.8°，钻石只有 24°。',
  },
  {
    q: '把物体放在凸透镜前 f < u < 2f 处，所成的像是？',
    opts: ['倒立缩小的实像', '倒立放大的实像', '正立放大的虚像', '倒立等大的实像'],
    a: 1,
    ex: 'u>2f 倒立缩小实像（照相机）；u=2f 倒立等大；f<u<2f 倒立放大实像（投影仪）；u<f 正立放大虚像（放大镜）。',
  },
  {
    q: '在双缝干涉实验中，要使屏上的条纹间距变大，可以？',
    opts: ['增大双缝间距 d', '减小缝到屏的距离 L', '改用波长更长的光', '把缝宽 a 变窄'],
    a: 2,
    ex: 'Δx = λL/d：波长 λ 越长、缝屏距 L 越大，条纹越宽；双缝间距 d 越大条纹越窄。缝宽 a 只影响亮度包络，不改变条纹间距。',
  },
  {
    q: '竖直肥皂膜在重力下上薄下厚，用白光照射，薄膜顶部（最薄处）看起来是？',
    opts: ['最亮的一片白色', '水平的黑色区域', '红色条纹', '和底部颜色一样'],
    a: 1,
    ex: '厚度趋近零时，前后两面反射光的光程差趋近零，所有色光都近似相消——顶部出现黑区，这是膜即将破裂的标志。牛顿环中心（t=0）同理是暗斑。',
  },
  {
    q: '关于液晶显示屏（LCD）的像素开关，正确的说法是？',
    opts: ['不加电压时光能通过，加电压后像素变暗', '不加电压时像素变暗，加电压后变亮', '偏振方向始终不变，靠液晶吸光调亮暗', '液晶屏不需要偏振片'],
    a: 0,
    ex: 'LCD 用两块正交偏振片夹扭曲液晶：不加电压时液晶把偏振面转 90°，光能穿出第二片（亮）；加电压后分子竖排、不再旋转，竖直偏振被水平检偏片挡住（暗）。',
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
    item.opts.forEach((op, oi) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'q-opt';
      b.textContent = op;
      b.addEventListener('click', () => {
        if (card.dataset.done) return;
        card.dataset.done = '1';
        const ok = oi === item.a;
        if (ok) score++;
        b.classList.add(ok ? 'right' : 'wrong');
        optsBox.children[item.a].classList.add('right');
        card.querySelector('.q-explain').textContent = item.ex;
        card.querySelector('.q-score').textContent = '得分：' + score;
        const foot = document.createElement('button');
        foot.type = 'button';
        foot.className = 'ctl-btn';
        foot.textContent = idx === QUIZ.length - 1 ? '查看成绩' : '下一题';
        foot.addEventListener('click', () => {
          idx++;
          if (idx < QUIZ.length) renderQ();
          else renderResult();
        });
        card.querySelector('.q-foot').appendChild(foot);
      });
      optsBox.appendChild(b);
    });
    panel.appendChild(card);
  }

  function renderResult() {
    panel.innerHTML = '';
    const card = document.createElement('div');
    card.className = 'quiz-card';
    const lv = score === QUIZ.length ? '满分！光学台已被你点亮' : score >= QUIZ.length - 2 ? '很稳，再扫一眼错题解析' : '把错题对应的章节回去再玩一遍';
    card.innerHTML = `
      <h3>测验完成</h3>
      <div class="q-result">${score} / ${QUIZ.length}</div>
      <p class="q-remark"></p>
      <div class="q-foot"></div>`;
    card.querySelector('.q-remark').textContent = lv;
    const again = document.createElement('button');
    again.type = 'button';
    again.className = 'ctl-btn';
    again.textContent = '重新作答';
    again.addEventListener('click', () => { idx = 0; score = 0; renderQ(); });
    const back = document.createElement('button');
    back.type = 'button';
    back.className = 'ctl-btn';
    back.textContent = '回到第一章';
    back.addEventListener('click', () => selectChapter(0));
    card.querySelector('.q-foot').append(again, back);
    panel.appendChild(card);
  }

  renderQ();
}

/* ---------------- 章节管理（左栏课程大纲列表驱动） ---------------- */

const chapNav = document.getElementById('chapNav');
const chapCount = document.getElementById('chapCount');
const detailNo = document.getElementById('detailNo');
const detailTitle = document.getElementById('detailTitle');
const lessonEl = document.getElementById('lesson');
const detailBody = document.getElementById('detailBody');
let chapterIdx = 0;

/* 13 章竖排按钮：序号 + 标题，点击切章，当前章 .on 高亮 */
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
  b.append(n, tt);
  b.addEventListener('click', () => selectChapter(i));
  chapNav.appendChild(b);
  return b;
});

function stepChapter(delta) {
  const n = SECTIONS.length;
  selectChapter((chapterIdx + delta + n) % n);
}

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
  ptr.dragIdx = -1; ptr.panning = false; ptr.down = false;
  canvas.classList.remove('grabbing');
  setHUD(null);
  if (sec.enter) sec.enter();
  /* 本章无控件时整块手风琴收走（不动用户的手风琴偏好）；读数块随 HUD+数据坞是否为空收走 */
  accSecs.controls.classList.toggle('acc-empty', !controlsEl.children.length);
  accSecs.data.classList.toggle('acc-empty', !hudSlot.childElementCount && !dock.el.childElementCount);
  detailBody.scrollTop = 0;
}

/* ---------------- 栏折叠（左右独立 28px 竖条）× 专注模式（双栏同折）统一管理 ---------------- */

const foldLBtn = document.getElementById('foldLBtn');
const unfoldLBtn = document.getElementById('unfoldLBtn');
const foldRBtn = document.getElementById('foldRBtn');
const unfoldRBtn = document.getElementById('unfoldRBtn');
const railNoL = document.getElementById('railNoL');
const railTitleR = document.getElementById('railTitleR');
const optShell = document.getElementById('optShell');
const focusBtn = document.getElementById('focusBtn');
const controlsEl = document.getElementById('controls');

const FOLD_KEY = { l: 'optics.foldL', r: 'optics.foldR' };
let foldL = false;
let foldR = false;
let focusSaved = null; /* 进入专注模式前的独立折叠状态 [foldL, foldR]，退出时恢复 */
try {
  foldL = localStorage.getItem(FOLD_KEY.l) === '1';
  foldR = localStorage.getItem(FOLD_KEY.r) === '1';
} catch (e) { /* localStorage 不可用（隐私模式等）时仅本次会话内生效 */ }

/* 把折叠状态落到 shell 类名与按钮 aria 态（布局/竖条显隐全在 CSS） */
function applyFold() {
  optShell.classList.toggle('fold-l', foldL);
  optShell.classList.toggle('fold-r', foldR);
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
  optShell.classList.toggle('focus-mode', on);
  focusBtn.textContent = on ? '退出专注' : '专注模式';
  focusBtn.setAttribute('aria-pressed', String(on));
  applyFold();
}

/* 独立折叠翻转并持久化；专注模式中点竖条展开钮 = 先退出专注（恢复原状）再翻转该侧 */
function toggleFold(side) {
  if (focusSaved !== null) setFocus(false);
  if (side === 'l') foldL = !foldL;
  else foldR = !foldR;
  try {
    localStorage.setItem(FOLD_KEY[side], (side === 'l' ? foldL : foldR) ? '1' : '0');
  } catch (e) { /* 同上，忽略持久化失败 */ }
  applyFold();
}

foldLBtn.addEventListener('click', () => toggleFold('l'));
unfoldLBtn.addEventListener('click', () => toggleFold('l'));
foldRBtn.addEventListener('click', () => toggleFold('r'));
unfoldRBtn.addEventListener('click', () => toggleFold('r'));
focusBtn.addEventListener('click', () => setFocus(focusSaved === null));
document.getElementById('chapPrev').addEventListener('click', () => stepChapter(-1));
document.getElementById('chapNext').addEventListener('click', () => stepChapter(1));
applyFold();

/* ---------------- 右栏三块手风琴（详解 / 控件 / 读数）：每块独立 key 记忆，切章不重置 ---------------- */

const ACC_KEYS = { lesson: 'optics.accLesson', controls: 'optics.accControls', data: 'optics.accData' };
const accSecs = {
  lesson: document.getElementById('accLesson'),
  controls: document.getElementById('accControls'),
  data: document.getElementById('accData'),
};
const NARROW_VIEW = window.innerWidth <= 1100;   /* 小屏首访清爽态判据 */
const accClosed = {};
for (const name of Object.keys(accSecs)) {
  let saved = null;
  try { saved = localStorage.getItem(ACC_KEYS[name]); } catch (e) { /* 同上，忽略 */ }
  /* 无记忆：默认全展开，仅小屏首访把「数据读数」默认收起；用户操作后按记忆走 */
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

/* ---------------- 指针交互：平移缩放 / 拖激光器 / 拖蜡烛 / 拖游标 / 沙盒拖动与金环旋转 ---------------- */

let ptr = { down: false, panning: false, lastX: 0, lastY: 0, dragIdx: -1, dragOff: [0, 0], mode: null };

function canvasPos(e) {
  const r = canvas.getBoundingClientRect();
  return [e.clientX - r.left, e.clientY - r.top];
}

canvas.addEventListener('pointerdown', (e) => {
  if (e.button !== 0 && e.pointerType === 'mouse') return;
  canvas.setPointerCapture(e.pointerId);
  const [px, py] = canvasPos(e);
  const [wx, wy] = S2W(px, py);
  ptr.down = true;
  /* 第 12 章：先试金环（旋转），再试元件（移动） */
  if (S.ch === 11) {
    if (hitRotateRing(wx, wy)) {
      const el = C12.elements[C12.selected];
      C12.rotating = { a0: el.ang, w0: Math.atan2(wy - el.y, wx - el.x) };
      ptr.mode = 'rotating-handle';
      canvas.classList.add('rotating');
      return;
    }
    const idx = hitElement(wx, wy);
    if (idx >= 0) {
      C12.selected = idx;
      ptr.dragIdx = idx;
      ptr.mode = 'sandbox-el';
      ptr.dragOff = [C12.elements[idx].x - wx, C12.elements[idx].y - wy];
      canvas.classList.add('grabbing');
      return;
    }
    C12.selected = -1;
  }
  /* 第 8 章：拖测量头游标 */
  if (S.ch === 7) {
    const near = (mx) => Math.abs(wx - mx) < 14 && wy > -70 && wy < 40;
    if (near(C8.mx1)) { ptr.mode = 'meas-1'; canvas.classList.add('measuring'); return; }
    if (near(C8.mx2)) { ptr.mode = 'meas-2'; canvas.classList.add('measuring'); return; }
  }
  /* 第 2 章：拖蜡烛 B */
  if (S.ch === 1) {
    const ix = 2 * 150 - (150 - C2.dist);
    const baseY = -96 + 5;
    if (Math.abs(wx - C2.bx) < 22 && wy > baseY - 14 && wy < baseY + 96) {
      ptr.mode = 'candle-b';
      canvas.classList.add('grabbing');
      return;
    }
  }
  /* 第 1 章：拖量角盘上的激光器（改入射角） */
  if (S.ch === 0) {
    const T = C1.tilt * DGR;
    const nAng = Math.PI / 2 + T;
    const iAng = C1.i * DGR;
    const dinAng = nAng + iAng + Math.PI;
    const dxi = Math.cos(dinAng), dyi = Math.sin(dinAng);
    const lx = -dxi * 238, ly = 14 - dyi * 238;
    if (Math.hypot(wx - lx, wy - ly) < 46) {
      ptr.mode = 'laser-drag';
      canvas.classList.add('grabbing');
      return;
    }
  }
  ptr.mode = 'pan';
  ptr.panning = true;
  ptr.lastX = px; ptr.lastY = py;
  canvas.classList.add('grabbing');
});

canvas.addEventListener('pointermove', (e) => {
  const [px, py] = canvasPos(e);
  const [wx, wy] = S2W(px, py);
  if (ptr.down && ptr.mode === 'sandbox-el' && ptr.dragIdx >= 0) {
    const el = C12.elements[ptr.dragIdx];
    if (el) { el.x = wx + ptr.dragOff[0]; el.y = wy + ptr.dragOff[1]; }
    return;
  }
  if (ptr.down && ptr.mode === 'rotating-handle' && C12.rotating) {
    const el = C12.elements[C12.selected];
    if (el) {
      const a = Math.atan2(wy - el.y, wx - el.x);
      el.ang = C12.rotating.a0 + (a - C12.rotating.w0) / DGR;
    }
    return;
  }
  if (ptr.down && ptr.mode === 'meas-1') { C8.mx1 = clamp(wx, -325, 325); return; }
  if (ptr.down && ptr.mode === 'meas-2') { C8.mx2 = clamp(wx, -325, 325); return; }
  if (ptr.down && ptr.mode === 'candle-b') { C2.bx = clamp(wx, 170, 420); return; }
  if (ptr.down && ptr.mode === 'laser-drag') {
    /* 拖激光器 = 改入射角：激光器绕盘心转，入射角 = 激光器方位与法线的夹角 */
    const T = C1.tilt * DGR;
    const nAng = Math.PI / 2 + T;
    const angToPtr = Math.atan2(wy - 14, wx - 0);
    let d = (angToPtr - nAng) / DGR;
    d = ((d % 360) + 360) % 360;
    if (d > 180) d -= 360;
    C1.i = clamp(Math.abs(d) < 90 ? Math.abs(d) : 180 - Math.abs(d), 0, 85);
    return;
  }
  if (ptr.down && ptr.panning) {
    view.cx -= (px - ptr.lastX) / view.k;
    view.cy += (py - ptr.lastY) / view.k;
    ptr.lastX = px; ptr.lastY = py;
    return;
  }
  if (!ptr.down) {
    if (S.ch === 11) {
      const hot = hitRotateRing(wx, wy) || hitElement(wx, wy) >= 0;
      canvas.classList.toggle('grab', hot);
      canvas.classList.toggle('rotating', hitRotateRing(wx, wy));
    } else if (S.ch === 7) {
      const near = (mx) => Math.abs(wx - mx) < 14 && wy > -70 && wy < 40;
      canvas.classList.toggle('measuring', near(C8.mx1) || near(C8.mx2));
    } else if (S.ch === 1) {
      const baseY = -91;
      canvas.classList.toggle('grab', Math.abs(wx - C2.bx) < 22 && wy > baseY - 14 && wy < baseY + 96);
    }
  }
});

function ptrEnd() {
  ptr.down = false; ptr.panning = false; ptr.dragIdx = -1; ptr.mode = null;
  C12.rotating = null;
  canvas.classList.remove('grabbing');
  canvas.classList.remove('rotating');
  canvas.classList.remove('measuring');
}
canvas.addEventListener('pointerup', ptrEnd);
canvas.addEventListener('pointercancel', ptrEnd);

canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const [px, py] = canvasPos(e);
  const [wx, wy] = S2W(px, py);
  const factor = Math.exp(-e.deltaY * 0.0012);
  view.k = clamp(view.k * factor, 0.3, 5);
  view.cx = wx - (px - cw / 2) / view.k;
  view.cy = wy - (chh / 2 - py) / view.k;
}, { passive: false });

/* ---------------- 键盘：←→ 切章 · R 复位视角 · F 全屏 · ] 收放数据读数 · Delete 删元件 ---------------- */

document.addEventListener('keydown', (e) => {
  const tag = (e.target && e.target.tagName) || '';
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
  if (S.ch === 11 && (e.key === 'Delete' || e.key === 'Backspace') && C12.selected >= 0) {
    C12.elements.splice(C12.selected, 1);
    C12.selected = -1;
    e.preventDefault();
    return;
  }
  if (e.key === 'ArrowLeft') { stepChapter(-1); e.preventDefault(); }
  else if (e.key === 'ArrowRight') { stepChapter(1); e.preventDefault(); }
  else if (e.key === 'r' || e.key === 'R') {
    if (viewReset) { viewReset(); setHint('视角已复位'); }
  } else if (e.key === 'f' || e.key === 'F') {
    try {
      if (document.fullscreenElement) document.exitFullscreen();
      else document.documentElement.requestFullscreen();
    } catch (err) { /* 全屏不可用时静默 */ }
  } else if (e.key === ']') {
    toggleAcc('data');
  }
});

/* ---------------- 帧循环与启动 ---------------- */

let rafId = 0;
let lastT = 0;
let labReady = false;

function frame(ts) {
  rafId = requestAnimationFrame(frame);
  if (!labReady) return;
  const dt = clamp((ts - lastT) / 1000, 0, 0.1);
  lastT = ts;
  drawScene(dt, ts / 1000);
}

requestAnimationFrame(frame);

loader.hide();
window.__eduSections = { select: selectChapter };
selectChapter(0);
labReady = true;

/* QA 探针（验收脚本用；与 analysis.__anl 同例） */
window.__opticsProbe = {
  w2s: (x, y) => W2S(x, y),
  s2w: (x, y) => S2W(x, y),
  view: () => ({ ...view }),
  st: () => ({
    ch: S.ch,
    i: C1.i, foldA: +C1.foldA.toFixed(2), revOn: C1.revOn,
    bx: C2.bx, over: C2.over, dist: C2.dist,
    th1: C3.th1, medium: C3.medium,
    mode4: C4.mode, medium4: C4.medium,
    recombine: C5.recombine, white5: C5.white,
    u: C6.u, f6: C6.f, screenX: +C6.screenX.toFixed(1),
    meas: [C8.mx1, C8.mx2], white8: C8.white,
    mode9: C9.mode, white9: C9.white,
    mode10: C10.mode, light10: C10.light, drain10: +C10.drain.toFixed(2),
    mode11: C11.mode, volts: C11.volts,
    sel: C12.selected, n: C12.elements.length, types: C12.elements.map((e) => e.type), angle12: C12.elements[0] ? C12.elements[0].ang : null,
  }),
};
