/* EduLab · 光学实验台（optics）
 * 章节：光的反射定律 / 平面镜成像 / 光的折射 / 全反射与光纤 / 棱镜色散 / 凸透镜成像规律 /
 *       眼睛与视力矫正 / 双缝干涉 / 单缝衍射与光栅 / 薄膜干涉 / 光的偏振 / 自由光学台 / 随堂检测
 * 技术：全 2D canvas 暗室风格光学台。自实现 world↔screen 视图变换（拖拽平移 + 滚轮缩放，
 *       world 坐标 y 轴向上，绘制时翻转到屏幕坐标）；rAF 自驱动动画。
 *       sections / controls / quiz / HUD 挂载模式与 lab-gas.js 一致。
 */
import { clamp, makeLoader, createSections, createControlsPanel, makeHUD } from './edu-core.js';

const DGR = Math.PI / 180;
const TAU_ = Math.PI * 2;
const N_WATER = 1.33;
const N_GLASS = 1.50;
const N_SOAP = 1.33;

/* ---------------- 本实验专属样式 ---------------- */

const style = document.createElement('style');
style.textContent = `
canvas.optics-canvas { touch-action: none; cursor: default; }
canvas.optics-canvas.grab { cursor: grab; }
canvas.optics-canvas.grabbing { cursor: grabbing; }
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

/** 平面镜：粗线 + 背面斜纹。side: +1 取 (ey,-ex) 方向为背面，-1 取反向 */
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
}

/** 薄透镜外形（双凸），rx 为鼓出程度 */
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

/* ---------------- 光学元件（自由台 & 棱镜共用） ---------------- */

function prismVerts(el) {
  const A = el.apex || 60;
  const hb = Math.tan(A / 2 * DGR) * el.H;
  const ca = Math.cos(el.ang * DGR), sa = Math.sin(el.ang * DGR);
  return [{ x: 0, y: el.H }, { x: -hb, y: -el.hB }, { x: hb, y: -el.hB }]
    .map((p) => ({ x: el.x + p.x * ca - p.y * sa, y: el.y + p.x * sa + p.y * ca }));
}

function elementEdges(el) {
  if (el.type === 'mirror') {
    const a = el.ang * DGR, hx = Math.cos(a) * el.len, hy = Math.sin(a) * el.len;
    return [{ ax: el.x - hx, ay: el.y - hy, bx: el.x + hx, by: el.y + hy }];
  }
  if (el.type === 'lens') return [{ ax: el.x, ay: el.y - el.h, bx: el.x, by: el.y + el.h }];
  if (el.type === 'water') return [{ ax: el.x - el.half, ay: el.y, bx: el.x + el.half, by: el.y }];
  const v = prismVerts(el);
  return [
    { ax: v[0].x, ay: v[0].y, bx: v[1].x, by: v[1].y },
    { ax: v[1].x, ay: v[1].y, bx: v[2].x, by: v[2].y },
    { ax: v[2].x, ay: v[2].y, bx: v[0].x, by: v[0].y },
  ];
}

/** 通用光线追踪：镜面反射 / 棱镜与水面折射(含全反射) / 薄透镜偏折。返回折线段列表 */
function traceRay(px, py, dx, dy, elements, opts = {}) {
  const maxSeg = opts.maxSeg || 16;
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
    } else if (el.type === 'prism') {
      const v = prismVerts(el);
      const fromIn = pointInTri(x - ux * 0.8, y - uy * 0.8, v);
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

/* ---------------- HUD / 提示 ---------------- */

const hudWrap = document.createElement('div');
hudWrap.className = 'lab-hud';
stage.appendChild(hudWrap);
let hud = null;
function setHUD(rows) {
  hudWrap.innerHTML = '';
  hud = rows.length ? makeHUD(hudWrap, rows) : null;
}
function hideHUD() { hudWrap.innerHTML = ''; hud = null; }

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

/* ---------------- 全局章节状态 ---------------- */

const S = { ch: 0 };
const C1 = { i: 40, tilt: 0, showN: true, showVals: true };
const C2 = { dist: 130, showRays: true, showImg: true, anim: false, animT: 0 };
const C3 = { th1: 45, medium: 'water', showAngles: true, green: false };
const C4 = { th: 50, medium: 'water', mode: 'interface', play: true, fT: 0 };
const C5 = { apex: 60, inc: 45, white: true, labels: true };
const C6 = { u: 24, f: 12, showRays: true, screenX: 24, tween: null };
const C7 = { axial: 80, curv: 0.54, corr: 'none' };
const C8 = { lam: 550, d: 0.2, L: 30 };
const C9 = { mode: 'single', a: 0.1, lam: 550, N: 4 };
const C10 = { grad: 280, white: true, play: false, drain: 0 };
const C11 = { thA: 30, polA: 0, on: true, viz: true };
const C12 = { angle: 15, height: 30, selType: 'mirror', elements: [], selected: -1, dragging: null, addN: 0 };

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

function drawReflection() {
  const C = C1;
  const T = C.tilt * DGR;
  const nAng = Math.PI / 2 + T;
  const nx = Math.cos(nAng), ny = Math.sin(nAng);
  drawMirrorSeg(-Math.cos(T) * 175, -Math.sin(T) * 175, Math.cos(T) * 175, Math.sin(T) * 175, 1);
  if (C.showN) {
    dashW(-nx * 155, -ny * 155, nx * 155, ny * 155, '#7fd1ff', 0.75);
    textW('法线', nx * 175, ny * 175, { color: '#7fd1ff', size: 11.5 });
  }
  // 量角盘（反射侧半圆刻度）
  arcW(0, 0, 138, nAng - Math.PI / 2, nAng + Math.PI / 2, 'rgba(165,195,220,0.35)', 1);
  for (let a = -80; a <= 80; a += 10) {
    const aa = nAng + a * DGR;
    const r1 = a % 90 === 0 ? 120 : (a % 30 === 0 ? 125 : 130);
    lineW(Math.cos(aa) * r1, Math.sin(aa) * r1, Math.cos(aa) * 138, Math.sin(aa) * 138, 'rgba(165,195,220,0.42)', 1);
  }
  // 入射 / 反射光线
  const iAng = C.i * DGR;
  const dinAng = nAng + iAng + Math.PI;
  const dxi = Math.cos(dinAng), dyi = Math.sin(dinAng);
  const dot = dxi * nx + dyi * ny;
  const dxo = dxi - 2 * dot * nx, dyo = dyi - 2 * dot * ny;
  const L1 = 205, L2 = 205;
  rayGlow(-dxi * L1, -dyi * L1, 0, 0, '#ff5d5d', 1, 2);
  arrowHeadW(0, 0, dinAng, 9, '#ff5d5d');
  rayGlow(0, 0, dxo * L2, dyo * L2, '#ff5d5d', 1, 2);
  arrowHeadW(dxo * L2, dyo * L2, Math.atan2(dyo, dxo), 9, '#ff5d5d');
  textW('入射光线', -dxi * L1 * 0.62, -dyi * L1 * 0.62 + 20, { color: '#ffb0a0', size: 11.5 });
  textW('反射光线', dxo * L2 * 0.62, dyo * L2 * 0.62 + 20, { color: '#ffb0a0', size: 11.5 });
  textW('平面镜', Math.cos(T) * 215, Math.sin(T) * 215, { color: '#aebdd0', size: 12 });
  // 等角弧 i = r
  arcW(0, 0, 56, nAng, nAng + iAng, '#ffd479', 1.6);
  arcW(0, 0, 56, nAng - iAng, nAng, '#8dffb0', 1.6);
  if (C.showVals) {
    textW('i=' + C.i + '°', Math.cos(nAng + iAng / 2) * 84, Math.sin(nAng + iAng / 2) * 84, { color: '#ffd479', size: 12.5, bold: true });
    textW('r=' + C.i + '°', Math.cos(nAng - iAng / 2) * 84, Math.sin(nAng - iAng / 2) * 84, { color: '#8dffb0', size: 12.5, bold: true });
  }
  hud.set('i', C.i + '°');
  hud.set('r', C.i + '°');
  hud.set('t', C.tilt + '°');
}

/* ================= 绘制：第 2 章 平面镜成像 ================= */

function drawArrowDashed(x1, y1, x2, y2, color) {
  dashW(x1, y1, x2, y2, color, 0.85, 1.8);
  arrowHeadW(x2, y2, Math.atan2(y2 - y1, x2 - x1), 7, color);
}

function drawMirrorImage(dt) {
  const C = C2;
  const mx = 140, top = 170, bot = -170, floorY = -90;
  lineW(-360, floorY, 380, floorY, 'rgba(150,170,190,0.25)', 1);
  drawMirrorSeg(mx, bot, mx, top, 1);
  textW('平面镜', mx + 52, 120, { color: '#aebdd0', size: 12 });
  const h = 75, baseY = floorY, tipy = floorY + h;
  const xo = mx - C.dist;
  const imgx = 2 * mx - xo;
  // 物体
  arrowW(xo, baseY, xo, tipy, '#ff8f6b', 2.4);
  textW('物体', xo, tipy + 20, { color: '#ff8f6b', size: 12, bold: true });
  // 虚像（虚线）
  if (C.showImg) {
    drawArrowDashed(imgx, baseY, imgx, tipy, '#ffb08f');
    textW('虚像', imgx, tipy + 20, { color: '#ffb08f', size: 12, bold: true });
  }
  if (C.showRays) {
    const tipx = xo;
    // 法线（两个入射点）
    dashW(mx, tipy - 32, mx, tipy + 32, '#7fd1ff', 0.7);
    dashW(mx, -55 - 32, mx, -55 + 32, '#7fd1ff', 0.7);
    // 光线 A：垂直镜面入射、原路折返
    rayGlow(tipx, tipy, mx, tipy, '#ffe066', 1, 1.6);
    rayGlow(mx, tipy, xo - 95, tipy, '#ffe066', 0.72, 1.6);
    arrowHeadW(xo - 95, tipy, Math.PI, 7, '#ffe066');
    if (C.showImg) dashW(mx, tipy, imgx, tipy, 'rgba(255,224,102,0.55)', 1);
    // 光线 B：任意入射，反射线的反向延长线过像点
    let dx = mx - tipx, dy = -55 - tipy;
    const L = Math.hypot(dx, dy); dx /= L; dy /= L;
    rayGlow(tipx, tipy, mx, -55, '#ffe066', 1, 1.6);
    rayGlow(mx, -55, mx - dx * 215, -55 + dy * 215, '#ffe066', 0.72, 1.6);
    arrowHeadW(mx - dx * 215, -55 + dy * 215, Math.atan2(dy, -dx), 7, '#ffe066');
    if (C.showImg) dashW(mx, -55, imgx, tipy, 'rgba(255,224,102,0.55)', 1);
    // 光线动画：亮点沿两条光路行进
    if (C.anim) {
      C.animT = (C.animT + dt * 0.55) % 1;
      const f = C.animT;
      let p;
      if (f < 0.5) p = [tipx + (mx - tipx) * (f * 2), tipy];
      else p = [mx - (95 + (mx - xo)) * ((f - 0.5) * 2), tipy];
      circleW(p[0], p[1], 3.4, null, 0, 'rgba(255,224,102,0.95)');
      let q;
      if (f < 0.5) q = [tipx + dx * L * 0 + (mx - tipx) * (f * 2), tipy + (-55 - tipy) * (f * 2)];
      else q = [mx - dx * 215 * ((f - 0.5) * 2), -55 + dy * 215 * ((f - 0.5) * 2)];
      circleW(q[0], q[1], 3.4, null, 0, 'rgba(255,224,102,0.95)');
    }
  }
  hud.set('p', C.dist + ' 单位');
  hud.set('q', C.dist + ' 单位');
  hud.set('c', '等大 · 正立 · 虚像');
}

/* ================= 绘制：第 3 章 光的折射 ================= */

function drawRefraction() {
  const C = C3;
  const n2 = C.medium === 'water' ? N_WATER : N_GLASS;
  const medName = C.medium === 'water' ? '水' : '玻璃';
  fillRectW(-430, -260, 430, 0, C.medium === 'water' ? 'rgba(96,165,220,0.13)' : 'rgba(190,215,235,0.10)');
  lineW(-430, 0, 430, 0, '#9fb2c8', 2);
  dashW(0, -175, 0, 175, '#7fd1ff', 0.75);
  textW('法线', 0, 190, { color: '#7fd1ff', size: 11.5 });
  textW('空气 n=1.00', -355, 105, { color: '#9fb2c8', size: 12.5, align: 'left', dx: -30 });
  textW(medName + ' n=' + n2.toFixed(2), -355, -105, { color: '#9fb2c8', size: 12.5, align: 'left', dx: -30 });
  const th1 = C.th1 * DGR;
  const col = C.green ? '#6dffa8' : '#ff5d5d';
  const nAng = Math.PI / 2;
  const backAng = nAng + th1; // -din 方向（朝左上）
  const dinAng = backAng + Math.PI;
  const dxi = Math.cos(dinAng), dyi = Math.sin(dinAng);
  const L1 = 240, L2 = 245;
  rayGlow(-dxi * L1, -dyi * L1, 0, 0, col, 1, 2);
  arrowHeadW(0, 0, dinAng, 9, col);
  textW('入射光线', -dxi * L1 * 0.6, -dyi * L1 * 0.6 + 20, { color: col === '#ff5d5d' ? '#ffb0a0' : '#a0ffd0', size: 11.5 });
  // Snell：n1·sinθ1 = n2·sinθ2
  const sin2 = Math.sin(th1) / n2;
  const th2 = Math.asin(clamp(sin2, 0, 1));
  const dt2 = refractD(dxi, dyi, 0, 1, 1, n2);
  const aR = Math.atan2(dt2[1], dt2[0]);
  rayGlow(0, 0, dt2[0] * L2, dt2[1] * L2, col, 1, 2);
  arrowHeadW(dt2[0] * L2, dt2[1] * L2, aR, 9, col);
  textW('折射光线', dt2[0] * L2 * 0.55, dt2[1] * L2 * 0.55 + 20, { color: col === '#ff5d5d' ? '#ffb0a0' : '#a0ffd0', size: 11.5 });
  if (C.showAngles) {
    arcW(0, 0, 52, nAng, backAng, '#ffd479', 1.6);
    textW('θ₁=' + C.th1 + '°', Math.cos(nAng + th1 / 2) * 80, Math.sin(nAng + th1 / 2) * 80, { color: '#ffd479', size: 12.5, bold: true });
    arcW(0, 0, 52, aR, -Math.PI / 2, '#8dffb0', 1.6);
    textW('θ₂=' + (th2 / DGR).toFixed(1) + '°', Math.cos((aR - Math.PI / 2) / 2) * 80, Math.sin((aR - Math.PI / 2) / 2) * 80, { color: '#8dffb0', size: 12.5, bold: true });
  }
  hud.set('t1', C.th1 + '°');
  hud.set('t2', (th2 / DGR).toFixed(1) + '°');
  hud.set('eq', (Math.sin(th1)).toFixed(3) + ' = ' + (n2 * Math.sin(th2)).toFixed(3));
}

/* ================= 绘制：第 4 章 全反射与光纤 ================= */

function drawTIR() {
  const C = C4;
  if (C.mode === 'fiber') { drawFiber(); return; }
  const n1 = C.medium === 'water' ? N_WATER : N_GLASS;
  const medName = C.medium === 'water' ? '水' : '玻璃';
  const thC = Math.asin(1 / n1) / DGR;
  fillRectW(-430, -260, 430, 0, C.medium === 'water' ? 'rgba(96,165,220,0.13)' : 'rgba(190,215,235,0.10)');
  lineW(-430, 0, 430, 0, '#9fb2c8', 2);
  dashW(0, -175, 0, 175, '#7fd1ff', 0.75);
  textW('法线', 0, 190, { color: '#7fd1ff', size: 11.5 });
  textW('空气 n=1.00', 330, 105, { color: '#9fb2c8', size: 12.5, align: 'left', dx: -30 });
  textW(medName + ' n=' + n1.toFixed(2), 330, -105, { color: '#9fb2c8', size: 12.5, align: 'left', dx: -30 });
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
  for (const p of [F.p0, F.p1]) {
    lineW(Math.cos(p) * (F.R - F.w), Math.sin(p) * (F.R - F.w), Math.cos(p) * (F.R + F.w), Math.sin(p) * (F.R + F.w), '#8fb7d8', 2);
  }
  textW('纤芯 n≈1.5', 0, F.R - F.w - 26, { color: '#9fc4e0', size: 12 });
  textW('光在纤芯内每次撞壁都发生全反射', 0, -F.R - F.w - 30, { color: '#8b98a8', size: 12 });
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
function nPrism(lam) { return 1.51 + 0.02 * (700 - lam) / 300; }

function drawPrism() {
  const C = C5;
  const prismEl = { type: 'prism', x: 0, y: -30, ang: 0, apex: C.apex, H: 150, hB: 42, n: 1.52 };
  const v = prismVerts(prismEl);
  fillPolyW([v[0], v[1], v[2]].map((p) => [p.x, p.y]), 'rgba(180,210,235,0.10)', 'rgba(200,225,245,0.55)', 1.6);
  textW('三棱镜 n=1.51~1.53', (v[1].x + v[2].x) / 2, v[1].y - 16, { color: '#9fc4e0', size: 11.5 });
  // 顶角弧
  const aL = Math.atan2(v[1].y - v[0].y, v[1].x - v[0].x);
  const aR = Math.atan2(v[2].y - v[0].y, v[2].x - v[0].x);
  arcW(v[0].x, v[0].y, 30, aL, aR, '#ffd479', 1.4);
  textW('A=' + C.apex + '°', v[0].x + Math.cos((aL + aR) / 2) * 52, v[0].y + Math.sin((aL + aR) / 2) * 52, { color: '#ffd479', size: 12, bold: true });
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
  // 光源图形
  fillRectW(start[0] - 16, start[1] - 12, start[0] + 2, start[1] + 12, '#3a4656');
  circleW(start[0] + 2, start[1], 5, null, 0, C.white ? '#fffbe8' : '#ffe97a');
  textW(C.white ? '白光光源' : '单色光', start[0] - 12, start[1] + 26, { color: '#aebdd0', size: 11.5 });
  // 追迹
  const tr = (lam) => traceRay(start[0], start[1], dxi, dyi, [prismEl], { maxSeg: 5, nPrism: nPrism(lam) });
  const trace0 = tr(C.white ? SPEC[0] : 580);
  if (trace0.length) rayGlow(trace0[0].ax, trace0[0].ay, trace0[0].bx, trace0[0].by, C.white ? '#fffbe8' : '#ffe97a', 1, 2);
  const lams = C.white ? SPEC : [580];
  let devMid = null;
  lams.forEach((lam, idx) => {
    const segs = tr(lam);
    const rgb = wl2rgb(lam);
    const col = 'rgb(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ')';
    for (let i = 1; i < segs.length; i++) {
      rayGlow(segs[i].ax, segs[i].ay, segs[i].bx, segs[i].by, col, 0.95, 1.7);
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
      if (lam === 680 || lam === 430) {
        const s = segs[segs.length - 1];
        textW(lam === 680 ? '红（偏折最小）' : '紫（偏折最大）', s.bx, s.by + (lam === 680 ? 22 : -22), { color: col, size: 12, bold: true });
      }
    }
  });
  if (!C.white) {
    const segs = tr(580);
    if (segs.length) {
      const s = segs[segs.length - 1];
      textW('最小偏向角：转动棱镜或改变入射角，δ 最小时光路对称', s.bx * 0.5 + 60, -200, { color: '#8b98a8', size: 12 });
    }
  }
  hud.set('A', C.apex + '°');
  hud.set('i', C.inc + '°');
  hud.set('d', devMid === null ? '—' : devMid.toFixed(1) + '°');
}

/* ================= 绘制：第 6 章 凸透镜成像规律 ================= */

function drawLensBench(dt) {
  const C = C6;
  const f = C.f, u = C.u, h = 42;
  const denom = u - f;
  const v = Math.abs(denom) < 0.05 ? Infinity : u * f / denom;
  // 主光轴 + 刻度
  lineW(-330, 0, 340, 0, 'rgba(160,180,200,0.5)', 1.2);
  for (let t = -320; t <= 320; t += 20) lineW(t, -5, t, 5, 'rgba(160,180,200,0.35)', 1);
  textW('主光轴（刻度单位：cm）', 300, -18, { color: '#8b98a8', size: 11, align: 'left', dx: -40 });
  // 透镜
  lensShape(0, 0, 26, 92, 'rgba(180,210,235,0.12)', 'rgba(200,225,245,0.7)', 1.8);
  textW('凸透镜 f=' + f + 'cm', 0, -108, { color: '#9fc4e0', size: 12 });
  // 焦点
  [[-f, 'F'], [f, "F'"], [-2 * f, '2F'], [2 * f, "2F'"]].forEach(([x, t]) => {
    if (Math.abs(x) <= 330) {
      circleW(x, 0, 3, null, 0, '#ffd479');
      textW(t, x, -16, { color: '#ffd479', size: 11.5 });
    }
  });
  // 物体
  arrowW(-u, 0, -u, h, '#ff8f6b', 2.4);
  textW('物体', -u, h + 18, { color: '#ff8f6b', size: 12, bold: true });
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
  // 光屏
  const sx = C.screenX;
  fillRectW(sx - 4, -95, sx + 4, 95, '#39414b');
  lineW(sx, -95, sx, -125, '#5b6673', 2);
  lineW(sx - 20, -125, sx + 20, -125, '#5b6673', 2);
  if (isVirtual || v === Infinity) {
    textW('光屏无像', sx, 0, { color: '#8b98a8', size: 11.5 });
  } else if (Math.abs(sx - v) < 4) {
    arrowW(sx + 9, 0, sx + 9, imgY, '#ff8f6b', 2);
    textW('清晰像', sx + 9, imgY + (imgY > 0 ? 16 : -16), { color: '#ff8f6b', size: 11.5 });
  } else {
    const spread = Math.min(90, Math.abs(sx - v) * 0.5);
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

/* ================= 绘制：第 7 章 眼睛与视力矫正 ================= */

function drawEye() {
  const C = C7;
  const L = C.axial;
  const fe = 150 - 65 * C.curv;
  const LX = -35;
  // 眼球轮廓 + 角膜
  circleW(0, 0, 100, 'rgba(190,205,220,0.55)', 2, 'rgba(150,180,205,0.05)');
  arcW(-95, 0, 13, 100 * DGR, 260 * DGR, 'rgba(190,205,220,0.5)', 1.4);
  textW('角膜', -112, 32, { color: '#9fb2c8', size: 11 });
  // 晶状体（曲率改变形状）
  lensShape(LX, 0, 7, 20 + 12 * C.curv, 'rgba(180,210,235,0.16)', '#9fc4e0', 1.6);
  textW('晶状体', LX, -46 - 12 * C.curv, { color: '#9fc4e0', size: 11.5 });
  // 视网膜（竖线）
  lineW(L, -70, L, 70, '#ff9d76', 2.5);
  for (let y = -63; y <= 63; y += 13) lineW(L + 2, y, L + 8, y + 4, '#ff9d76', 1, 0.6);
  textW('视网膜', L, 86, { color: '#ff9d76', size: 12, bold: true });
  // 矫正镜片
  let fc = Infinity;
  if (C.corr !== 'none') {
    const needed = 1 / (L + 35) - 1 / fe;
    fc = Math.abs(needed) < 2e-4 ? (needed > 0 ? 6000 : -6000) : 1 / needed;
    const concave = fc < 0;
    lensShape(-108, 0, concave ? 7 : -7, 24, 'rgba(255,212,121,0.12)', '#ffd479', 1.6);
    textW(concave ? '凹透镜（近视矫正）' : '凸透镜（远视矫正）', -108, -40, { color: '#ffd479', size: 11 });
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
  hud.set('ax', ((L - 80) / 80 * 100 >= 0 ? '+' : '') + ((L - 80) / 80 * 100).toFixed(0) + '%');
  hud.set('fe', fe.toFixed(0) + '（' + (C.curv < 0.33 ? '扁平·看远' : C.curv > 0.66 ? '较凸·看近' : '适中') + '）');
  const diff = C.lastDiff || 0;
  hud.set('pos', Math.abs(diff) <= 4 ? '视网膜上 ✓' : (diff < 0 ? '视网膜前 ' + Math.abs(diff).toFixed(0) : '视网膜后 ' + diff.toFixed(0)));
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
  // 光源
  fillRectW(-338, 118, -306, 142, '#3a4656');
  circleW(-306, 130, 6, null, 0, '#fff6d8');
  textW('单色光源', -322, 158, { color: '#aebdd0', size: 11.5 });
  gaps.forEach((g) => {
    dashW(-304, 130, x, g.c, 'rgba(255,224,102,0.35)', 1);
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
  textW(slitLabel, x, y0 - 20, { color: '#aebdd0', size: 12 });
  // 波前弧
  gaps.forEach((g) => {
    for (let r = 36; r <= 116; r += 40) {
      arcW(x, g.c, r, -0.85, 0.85, 'rgba(120,200,255,0.22)', 1.1);
    }
  });
  // 屏（侧视线）
  lineW(152, y0, 152, y1, '#8b98a8', 4);
  textW('屏', 152, y0 - 20, { color: '#aebdd0', size: 12 });
}

/* ================= 绘制：第 8 章 双缝干涉 ================= */

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
  if (C.white) {
    renderStrip(-330, 330, stripY, stripH, (xn) => {
      const pos = (xn * 2 - 1) * 3.2;
      const s = pos / Lmm;
      let r = 0, g = 0, b = 0;
      for (let k = 0; k < 14; k++) {
        const lj = 405 + k * 22;
        const I = Math.pow(Math.cos(Math.PI * C.d * s / (lj * 1e-6)), 2) * sincSq(Math.PI * a * s / (lj * 1e-6));
        const c = wl2rgb(lj);
        r += c[0] * I; g += c[1] * I; b += c[2] * I;
      }
      return [Math.min(255, r / 14 * 2.4), Math.min(255, g / 14 * 2.4), Math.min(255, b / 14 * 2.4)];
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
  const dxmm = lam * 1e-6 * Lmm / C.d;
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
  renderStrip(-330, 330, -70, 30, (xn) => {
    const I = ifn(xn);
    return [c[0] * I, c[1] * I, c[2] * I];
  });
  drawCurve(-330, 330, -86, -62, ifn, 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')');
  textW('屏上强度分布', 0, -164, { color: '#8b98a8', size: 12 });
  const cw2 = 2 * C.lam * 1e-6 / C.a; // 中央亮纹角宽度（rad）
  const modeName = C.mode === 'single' ? '单缝衍射' : C.mode === 'double' ? '双缝衍射' : '光栅衍射';
  hud.set('mode', modeName);
  hud.set('cw', (cw2 * 1000).toFixed(1) + ' mrad（' + (cw2 / DGR).toFixed(2) + '°）');
  hud.set('dx', C.mode === 'single' ? '—' : (lam_mm * Lmm / d).toFixed(2) + ' mm');
}

/* ================= 绘制：第 10 章 薄膜干涉 ================= */

function drawFilm(dt) {
  const C = C10;
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
  const [sx0, syT] = W2S(-45, 170);
  const [sx1, syB] = W2S(45, -170);
  const rows = Math.max(2, Math.round(syB - syT));
  for (let i = 0; i <= rows; i++) {
    const sy = syT + i;
    const wy = S2W(0, sy)[1];
    const dd = filmD(wy);
    let r = 12, g = 14, b = 18;
    if (dd > 0.5) {
      if (C.white) {
        const amp = (lam) => Math.pow(Math.sin(Math.PI * 2 * N_SOAP * dd / lam), 2);
        r = 255 * amp(610); g = 255 * amp(550); b = 255 * amp(465);
      } else {
        const I = Math.pow(Math.sin(Math.PI * 2 * N_SOAP * dd / 550), 2);
        const cc = wl2rgb(550);
        r = cc[0] * I; g = cc[1] * I; b = cc[2] * I;
      }
    }
    ctx.fillStyle = 'rgb(' + (r | 0) + ',' + (g | 0) + ',' + (b | 0) + ')';
    ctx.fillRect(sx0, sy, sx1 - sx0, 1.3);
  }
  // 金属丝框
  fillPolyW([[-45, -170], [45, -170], [45, 170], [-45, 170]], null, '#8fb7d8', 2.5);
  textW('肥皂膜竖直剖面（n=1.33）', 0, 196, { color: '#9fc4e0', size: 12.5 });
  arrowW(78, 140, 78, 40, '#8b98a8', 1.6);
  textW('厚度渐增', 92, 90, { color: '#8b98a8', size: 11.5, align: 'left' });
  textW('上薄下厚 → 顶部近黑', 92, 68, { color: '#8b98a8', size: 11.5, align: 'left' });
  hud.set('wm', C.white ? '白光' : '单色（绿 550nm）');
  hud.set('th', Math.round(25 + C.grad) + ' nm');
  hud.set('st', C.play ? '重力排液中…' : (C.drain >= 1 ? '膜已排薄，即将破裂' : '静止观察'));
}

/* ================= 绘制：第 11 章 光的偏振 ================= */

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

function drawPolarization(dt, t) {
  const C = C11;
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

/* ================= 绘制：第 12 章 自由光学台 ================= */

function distToSeg(px, py, ax, ay, bx, by) {
  const ex = bx - ax, ey = by - ay;
  const L2 = ex * ex + ey * ey || 1;
  const t = clamp(((px - ax) * ex + (py - ay) * ey) / L2, 0, 1);
  return Math.hypot(px - (ax + ex * t), py - (ay + ey * t));
}

function hitElement(wx, wy) {
  const els = C12.elements;
  for (let i = els.length - 1; i >= 0; i--) {
    const el = els[i];
    if (el.type === 'mirror') {
      const a = el.ang * DGR, hx = Math.cos(a) * el.len, hy = Math.sin(a) * el.len;
      if (distToSeg(wx, wy, el.x - hx, el.y - hy, el.x + hx, el.y + hy) < 14) return i;
    } else if (el.type === 'lens') {
      if (Math.abs(wx - el.x) < 16 && Math.abs(wy - el.y) < el.h + 8) return i;
    } else if (el.type === 'water') {
      if (Math.abs(wy - el.y) < 58 && Math.abs(wx - el.x) < el.half + 10) return i;
    } else if (el.type === 'prism') {
      const v = prismVerts(el);
      if (pointInTri(wx, wy, v)) return i;
      for (const e of elementEdges(el)) {
        if (distToSeg(wx, wy, e.ax, e.ay, e.bx, e.by) < 12) return i;
      }
    }
  }
  return -1;
}

function drawSandbox(dt, t) {
  const C = C12;
  // 光源
  fillRectW(-412, C.height - 12, -378, C.height + 12, '#3a4656');
  circleW(-378, C.height, 6, null, 0, '#bfeaff');
  textW('激光光源', -398, C.height + 28, { color: '#aebdd0', size: 11.5 });
  const ang = C.angle * DGR;
  const segs = traceRay(-376, C.height, Math.cos(ang), Math.sin(ang), C.elements, { maxSeg: 16 });
  segs.forEach((sg) => rayGlow(sg.ax, sg.ay, sg.bx, sg.by, '#67e0ff', 0.95, 2));
  // 光点行进动画
  const pts = [[-376, C.height]];
  const cum = [0];
  let total = 0;
  segs.forEach((sg) => {
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
    if (el.type === 'mirror') {
      const a = el.ang * DGR, hx = Math.cos(a) * el.len, hy = Math.sin(a) * el.len;
      drawMirrorSeg(el.x - hx, el.y - hy, el.x + hx, el.y + hy, 1);
      if (sel) lineW(el.x - hx, el.y - hy, el.x + hx, el.y + hy, '#ffd479', 2, 0.9);
    } else if (el.type === 'lens') {
      lensShape(el.x, el.y, el.h * 0.3, el.h, 'rgba(180,210,235,0.12)', sel ? '#ffd479' : 'rgba(200,225,245,0.7)', sel ? 2.2 : 1.6);
      circleW(el.x - el.f, el.y, 2.6, null, 0, '#ffd479');
      circleW(el.x + el.f, el.y, 2.6, null, 0, '#ffd479');
      textW('f=' + el.f, el.x + el.f, el.y - 12, { color: '#ffd479', size: 10.5 });
    } else if (el.type === 'water') {
      fillRectW(el.x - el.half, el.y - 55, el.x + el.half, el.y, 'rgba(96,165,220,0.16)');
      lineW(el.x - el.half, el.y, el.x + el.half, el.y, sel ? '#ffd479' : '#7fb6dd', 2.4);
      for (let k = -el.half + 14; k <= el.half - 14; k += 28) {
        lineW(el.x + k, el.y - 8, el.x + k + 10, el.y - 12, 'rgba(150,200,235,0.5)', 1.2);
      }
    } else if (el.type === 'prism') {
      const v = prismVerts(el);
      fillPolyW([v[0], v[1], v[2]].map((p) => [p.x, p.y]), 'rgba(180,210,235,0.12)', sel ? '#ffd479' : 'rgba(200,225,245,0.7)', sel ? 2.2 : 1.6);
    }
  });
  hud.set('n', C.elements.length + ' 个');
  hud.set('sel', C.selected >= 0 ? ['平面镜', '三棱镜', '凸透镜', '水面'][['mirror', 'prism', 'lens', 'water'].indexOf(C.elements[C.selected].type)] : '无');
  hud.set('tip', '拖元件移动 · 拖空白平移 · 滚轮缩放');
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
  ctx.fillStyle = '#0d1117';
  ctx.fillRect(0, 0, cw, chh);
  drawGrid();
  const fn = DRAW[S.ch];
  if (fn) fn(dt, t);
}

/* ---------------- 章节定义 ---------------- */

const ctl = createControlsPanel(document.getElementById('controls'));
let activeSectionCleanup = null;

const SECTIONS = [
  {
    title: '光的反射定律',
    html: `<p>光射到<b>平面镜</b>上会发生反射。反射定律：<span class="hl">反射角等于入射角</span>（i = r），入射光线、反射光线与法线<b>在同一平面内</b>，且分居法线两侧。</p>
<p>① 拖动<b>入射角</b>滑杆，观察黄色角 i 与绿色角 r 始终相等；② 拖动<b>镜面倾角</b>，法线始终垂直于镜面，两角依然相等；③ 垂直入射（i=0°）时，光沿原路返回。</p>
<p>反射时光路是<b>可逆</b>的：把光沿反射方向逆着射回去，它会沿原入射方向返回。</p>`,
    enter() {
      S.ch = 0;
      Object.assign(C1, { i: 40, tilt: 0, showN: true, showVals: true });
      fitView(860, 540);
      setHUD([['i', '入射角 i'], ['r', '反射角 r'], ['t', '镜面倾角']]);
      ctl.clear();
      ctl.slider({ label: '入射角', min: 0, max: 85, step: 1, value: C1.i, fmt: (v) => v + '°', onInput: (v) => { C1.i = v; } });
      ctl.slider({ label: '镜面倾角', min: -45, max: 45, step: 1, value: C1.tilt, fmt: (v) => v + '°', onInput: (v) => { C1.tilt = v; } });
      ctl.toggle({ label: '显示法线', value: true, onChange: (v) => { C1.showN = v; } });
      ctl.toggle({ label: '显示角度值', value: true, onChange: (v) => { C1.showVals = v; } });
      setHint('反射角 = 入射角；三线共面、两角相等、光路可逆');
    },
  },
  {
    title: '平面镜成像',
    html: `<p>平面镜所成的像：<span class="hl">等大、正立、虚像</span>，物与像关于镜面<b>对称</b>（物距 = 像距）。虚像由反射光线的<b>反向延长线</b>会聚而成，不能用光屏承接。</p>
<p>两条成像光路：<b>垂直镜面的光线</b>原路折返；<b>任意光线</b>反射后，其反向延长线（黄色虚线）恰好穿过像点。播放动画观察光线行进。</p>
<p>拖动物距滑杆，虚像始终与物体等距、等大——这就是「水中倒影」「穿衣镜」的原理。</p>`,
    enter() {
      S.ch = 1;
      Object.assign(C2, { dist: 130, showRays: true, showImg: true, anim: false, animT: 0 });
      fitView(900, 560, 140, 0);
      setHUD([['p', '物距'], ['q', '像距'], ['c', '成像特点']]);
      ctl.clear();
      ctl.slider({ label: '物距', min: 40, max: 280, step: 2, value: C2.dist, fmt: (v) => v + '', onInput: (v) => { C2.dist = v; } });
      ctl.toggle({ label: '显示光路', value: true, onChange: (v) => { C2.showRays = v; } });
      ctl.toggle({ label: '显示虚像', value: true, onChange: (v) => { C2.showImg = v; } });
      const btn = ctl.button({
        label: '▶ 光线动画',
        onClick: () => {
          C2.anim = !C2.anim;
          btn.textContent = C2.anim ? '⏸ 暂停动画' : '▶ 光线动画';
          btn.classList.toggle('active', C2.anim);
        },
      });
      setHint('黄色虚线 = 反射光线的反向延长线，交点即虚像');
    },
  },
  {
    title: '光的折射',
    html: `<p>光从空气斜射入<b>水或玻璃</b>时，传播方向在界面处发生偏折。折射定律（<span class="hl">Snell 定律</span>）：n₁·sinθ₁ = n₂·sinθ₂。</p>
<p>光从空气（n=1.00）进入光密介质（n 更大），<b>折射角小于入射角</b>，光线偏向法线；介质折射率越大，偏折越明显——切换「水 / 玻璃」对比。</p>
<p>生活中的折射：<b>池水看起来变浅</b>（池底反射的光在水面折射后进入眼睛，看到的池底是抬高的虚像）；<b>斜插水中的筷子像折弯了</b>。</p>`,
    enter() {
      S.ch = 2;
      Object.assign(C3, { th1: 45, medium: 'water', showAngles: true, green: false });
      fitView(900, 580, 0, -30);
      setHUD([['t1', '入射角 θ₁'], ['t2', '折射角 θ₂'], ['eq', 'n₁sinθ₁ = n₂sinθ₂']]);
      ctl.clear();
      ctl.slider({ label: '入射角', min: 5, max: 85, step: 1, value: C3.th1, fmt: (v) => v + '°', onInput: (v) => { C3.th1 = v; } });
      ctl.seg({
        options: [{ label: '水 n=1.33', value: 'water' }, { label: '玻璃 n=1.50', value: 'glass' }],
        value: 'water',
        onChange: (v) => { C3.medium = v; },
      });
      ctl.toggle({ label: '显示角度', value: true, onChange: (v) => { C3.showAngles = v; } });
      ctl.toggle({ label: '绿色激光', value: false, onChange: (v) => { C3.green = v; } });
      setHint('HUD 显示 n₁sinθ₁ = n₂sinθ₂ —— 两边数值始终相等');
    },
  },
  {
    title: '全反射与光纤',
    html: `<p>光从<b>光密介质射向光疏介质</b>（水→空气、玻璃→空气）时，折射角大于入射角。当入射角达到<span class="hl">临界角 C</span>（sinC = n₂/n₁）时，折射光沿界面掠出；<b>超过临界角，折射光完全消失</b>，只剩反射光——这就是<b>全反射</b>。</p>
<p>水的临界角约 <b>48.8°</b>，玻璃约 <b>41.8°</b>。逐渐增大入射角，观察折射光如何变弱、贴近界面直至消失。</p>
<p><b>光纤通信</b>正是利用全反射：光在纤细的玻璃纤芯内一次次全反射，锯齿形前进，把信息传到远方（内窥镜、装饰灯也是同样原理）。切到「光纤演示」观看。</p>`,
    enter() {
      S.ch = 3;
      Object.assign(C4, { th: 50, medium: 'water', mode: 'interface', play: true, fT: 0 });
      fitView(900, 580, 0, -30);
      setHUD([['tc', '临界角 C'], ['ti', '入射角'], ['st', '状态']]);
      ctl.clear();
      ctl.slider({ label: '入射角', min: 5, max: 85, step: 1, value: C4.th, fmt: (v) => v + '°', onInput: (v) => { C4.th = v; } });
      ctl.seg({
        options: [{ label: '水→空气', value: 'water' }, { label: '玻璃→空气', value: 'glass' }],
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
      setHint('入射角 > 临界角 → 折射光消失，只剩反射光');
    },
  },
  {
    title: '棱镜色散',
    html: `<p><b>白光是复色光</b>。通过三棱镜时，不同波长的色光折射率不同（红光 n≈1.51 最小、紫光 n≈1.53 最大），偏折程度不同，白光被<span class="hl">分解成红橙黄绿蓝靛紫</span>的彩色光谱——这就是<b>色散</b>。</p>
<p>红端偏折<b>最小</b>，紫端偏折<b>最大</b>。改变棱镜顶角 A 与入射角 i，观察光谱扇形如何张开、收拢。</p>
<p>切到「单色光」模式：只显示黄光光路，HUD 给出<b>偏向角 δ</b>。缓慢调整入射角可找到 δ 的最小值位置（此时光路对称），这就是<b>最小偏向角</b>——精密测折射率就用它。彩虹是水滴扮演了棱镜的角色。</p>`,
    enter() {
      S.ch = 4;
      Object.assign(C5, { apex: 60, inc: 45, white: true, labels: true });
      fitView(800, 640, 40, 20);
      setHUD([['A', '棱镜顶角 A'], ['i', '入射角 i'], ['d', '偏向角 δ']]);
      ctl.clear();
      ctl.slider({ label: '棱镜顶角 A', min: 40, max: 70, step: 1, value: C5.apex, fmt: (v) => v + '°', onInput: (v) => { C5.apex = v; } });
      ctl.slider({ label: '入射角', min: 20, max: 65, step: 1, value: C5.inc, fmt: (v) => v + '°', onInput: (v) => { C5.inc = v; } });
      ctl.toggle({ label: '白光（关=单色）', value: true, onChange: (v) => { C5.white = v; } });
      ctl.toggle({ label: '光谱标注', value: true, onChange: (v) => { C5.labels = v; } });
      setHint('白光 → 七彩扇形；红偏折最小、紫最大；单色模式看最小偏向角');
    },
  },
  {
    title: '凸透镜成像规律',
    html: `<p>凸透镜成像满足<span class="hl">1/f = 1/u + 1/v</span>（f 焦距、u 物距、v 像距），放大率 m = v/u。三条特殊光线：①平行主光轴→过像方焦点 F′；②过光心→方向不变；③过物方焦点 F→平行主光轴射出。</p>
<p>成像规律：<b>u&gt;2f</b> 倒立缩小实像（照相机）；<b>u=2f</b> 倒立等大；<b>f&lt;u&lt;2f</b> 倒立放大实像（投影仪）；<b>u=f</b> 不成像；<b>u&lt;f</b> 正立放大虚像（放大镜，光屏接不到）。</p>
<p>拖动 u 观察像的移动与性质变化；移动光屏后点<b>「自动对焦」</b>，光屏会滑到成清晰像的位置。</p>`,
    enter() {
      S.ch = 5;
      Object.assign(C6, { u: 24, f: 12, showRays: true, screenX: 24, tween: null });
      fitView(760, 500, 20, 0);
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
      setHint('u>2f 缩小实像 · f<u<2f 放大实像 · u<f 放大虚像');
    },
  },
  {
    title: '眼睛与视力矫正',
    html: `<p>眼睛像一台自动对焦的相机：<b>角膜与晶状体</b>相当于凸透镜，<b>视网膜</b>是底片。睫状体改变晶状体曲率：<span class="hl">看远变扁平（焦距变长）、看近变凸（焦距变短）</span>，让像正好落在视网膜上。</p>
<p><b>近视</b>：眼轴过长（或晶状体过凸），平行光会聚在<b>视网膜前</b> → 戴<b>凹透镜</b>（发散）矫正；<b>远视</b>：眼轴过短，像成在<b>视网膜后</b> → 戴<b>凸透镜</b>（会聚）矫正。</p>
<p>拖动眼轴长度与晶状体曲率，观察像点跑到视网膜前还是后；再选择矫正镜片，看像点回到视网膜上（HUD 显示按当前状态验配的处方焦距）。</p>`,
    enter() {
      S.ch = 6;
      Object.assign(C7, { axial: 80, curv: 0.54, corr: 'none', lastDiff: 0 });
      fitView(640, 470, 10, 0);
      setHUD([['ax', '眼轴（相对正常）'], ['fe', '晶状体焦距'], ['pos', '像点位置'], ['st', '状态']]);
      ctl.clear();
      ctl.slider({ label: '眼轴长度', min: 56, max: 104, step: 1, value: C7.axial, fmt: (v) => ((v - 80) / 80 * 100 >= 0 ? '+' : '') + ((v - 80) / 80 * 100).toFixed(0) + '%', onInput: (v) => { C7.axial = v; } });
      ctl.slider({ label: '晶状体曲率', min: 0, max: 1, step: 0.01, value: C7.curv, fmt: (v) => (v < 0.33 ? '扁平·看远' : v > 0.66 ? '较凸·看近' : '适中'), onInput: (v) => { C7.curv = v; } });
      ctl.seg({
        options: [{ label: '无矫正', value: 'none' }, { label: '凹透镜·近视', value: 'concave' }, { label: '凸透镜·远视', value: 'convex' }],
        value: 'none',
        onChange: (v) => { C7.corr = v; },
      });
      setHint('像在视网膜前 → 近视 → 凹透镜；像在后 → 远视 → 凸透镜');
    },
  },
  {
    title: '双缝干涉',
    html: `<p>1801 年<b>杨氏双缝实验</b>：光通过两条窄缝后互相叠加，屏上出现<span class="hl">明暗相间的条纹</span>——这是光具有<b>波动性</b>的决定性证据。</p>
<p>两列波<b>波峰遇波峰</b>→相长→亮纹；<b>波峰遇波谷</b>→相消→暗纹。条纹间距：<span class="hl">Δx = λL/d</span>（λ 波长、L 缝屏距、d 双缝间距）。波长越长、L 越大、d 越小，条纹越宽。</p>
<p>拖动三个滑杆验证公式（HUD 实时计算 Δx）；打开<b>白光</b>模式——中央是白色亮纹，两侧出现彩色条纹（不同波长条纹间距不同，长波红在外侧）。</p>`,
    enter() {
      S.ch = 7;
      Object.assign(C8, { lam: 550, d: 0.2, L: 30, white: false });
      fitView(940, 580, 0, 40);
      setHUD([['lam', '波长 λ'], ['dx', 'Δx = λL/d'], ['wm', '模式']]);
      ctl.clear();
      ctl.slider({ label: '波长 λ', min: 400, max: 700, step: 5, value: C8.lam, fmt: (v) => v + ' nm', onInput: (v) => { C8.lam = v; } });
      ctl.slider({ label: '缝间距 d', min: 0.1, max: 0.5, step: 0.01, value: C8.d, fmt: (v) => v.toFixed(2) + ' mm', onInput: (v) => { C8.d = v; } });
      ctl.slider({ label: '缝屏距 L', min: 15, max: 60, step: 1, value: C8.L, fmt: (v) => v + ' cm', onInput: (v) => { C8.L = v; } });
      ctl.toggle({ label: '白光', value: false, onChange: (v) => { C8.white = v; } });
      setHint('Δx = λL/d：红光条纹比紫光宽；d 越大条纹越密');
    },
  },
  {
    title: '单缝衍射与光栅',
    html: `<p>光绕过障碍物边缘传播的现象叫<b>衍射</b>。「发生明显衍射的条件」是缝宽与波长可比拟。</p>
<p><b>单缝</b>：屏上出现宽大的中央亮纹（两侧对称的弱亮纹），<span class="hl">中央亮纹角宽度 ≈ 2λ/a</span>，缝越窄条纹越宽。</p>
<p><b>光栅</b>（N 条等宽等距的缝）：条纹变得<span class="hl">又细又亮</span>——N 缝干涉主极大强度含 N² 因子、宽度反比于 N，次极大很弱。光栅光谱仪靠它精确分辨波长（牛顿环劈尖、CD 彩虹都是衍射光栅）。</p>
<p>切换三种模式，调节缝宽 a 与缝数 N，观察中央亮纹宽度与条纹锐度的变化。</p>`,
    enter() {
      S.ch = 8;
      Object.assign(C9, { mode: 'single', a: 0.1, lam: 550, N: 4 });
      fitView(940, 580, 0, 40);
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
      setHint('单缝：a 越小中央亮纹越宽；光栅：N 越大条纹越细锐');
    },
  },
  {
    title: '薄膜干涉',
    html: `<p>光射到<b>竖直肥皂膜</b>上，<span class="hl">前、后两个表面的反射光</span>相互叠加：膜厚恰好让两列波同相→亮，反相→暗。同一厚度对应同一颜色，于是出现<b>水平彩色条纹</b>。</p>
<p>膜在重力下<b>排液变薄</b>：上薄下厚。厚度趋近零时所有色光都相消——顶部出现<b>黑区</b>（这是肥皂膜即将破裂的标志）。彩色条纹随排液不断下移、变宽。</p>
<p>应用：<b>增透膜</b>厚度取 λ/4，使膜两面的反射光相消，反射减弱、透射增强（镜头镀膜的蓝紫色）；蜻蜓翅膀、水面油膜的彩色也都是薄膜干涉。</p>`,
    enter() {
      S.ch = 9;
      Object.assign(C10, { grad: 280, white: true, play: false, drain: 0 });
      fitView(560, 640, 30, 0);
      setHUD([['wm', '入射光'], ['th', '底部厚度'], ['st', '状态']]);
      ctl.clear();
      ctl.slider({ label: '膜厚梯度', min: 100, max: 500, step: 10, value: C10.grad, fmt: (v) => '+' + v + ' nm', onInput: (v) => { C10.grad = v; } });
      ctl.toggle({ label: '白光（关=单色）', value: true, onChange: (v) => { C10.white = v; } });
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
      setHint('白光→彩色水平条纹；排液后顶部先变黑（厚度→0 全消光）');
    },
  },
  {
    title: '光的偏振',
    html: `<p><b>只有横波才有偏振</b>——光的偏振证明光是横波。自然光沿各方向振动；通过<span class="hl">起偏器</span>后只剩一个振动方向；再过<b>检偏器</b>，透射强度服从<span class="hl">马吕斯定律 I = I₀·cos²θ</span>（θ 为两透振方向夹角）。</p>
<p>旋转检偏器：θ=0° 全透，θ=90° <b>完全消光</b>（屏全黑）。黄色箭头是光矢量：过起偏器后只沿一个方向振动，过检偏器后振幅按 cosθ 缩短。</p>
<p>应用：偏振太阳镜削弱水面/路面眩光、摄影偏振镜消除反光、液晶屏（LCD）用偏振片开关像素。打开「偏振片可视化」看透振方向栅格。</p>`,
    enter() {
      S.ch = 10;
      Object.assign(C11, { thA: 30, polA: 0, on: true, viz: true });
      fitView(960, 440, -50, 0);
      setHUD([['ang', '相对夹角 θ'], ['int', 'I / I₀'], ['st', '状态']]);
      ctl.clear();
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
      ctl.toggle({ label: '偏振片可视化', value: true, onChange: (v) => { C11.viz = v; } });
      setHint('I = I₀cos²θ；θ=90° 完全消光——这是横波的独家证据');
    },
  },
  {
    title: '自由光学台',
    html: `<p>沙盒模式：像真正的光学实验台一样<span class="hl">自由搭建光路</span>。从「元件」中选择平面镜 / 三棱镜 / 凸透镜 / 水面，点「＋添加」放到台上；<b>按住元件拖动</b>改变位置，激光会实时重算光路（反射、折射、全反射、透镜偏折自动发生）。</p>
<p>点选元件后可「删除选中」；调节<b>光源角度 / 高度</b>改变入射光；「清空」恢复空白台面。</p>
<p>试试：棱镜后面接一面镜子把光反射回去（会不会再次折射？）；让光从水下向上射向水面，调到全反射；两面镜子搭一个潜望镜。</p>
<p>视图操作：拖动空白处平移视野，滚轮缩放。</p>`,
    enter() {
      S.ch = 11;
      C12.angle = -5; C12.height = 30;
      C12.elements = [{ type: 'mirror', x: 80, y: -10, ang: 25, len: 75 }];
      C12.selected = -1; C12.dragging = null; C12.addN = 0; C12.selType = 'mirror';
      fitView(1000, 560, -60, 0);
      setHUD([['n', '台面元件'], ['sel', '选中元件'], ['tip', '操作']]);
      ctl.clear();
      ctl.seg({
        options: [{ label: '平面镜', value: 'mirror' }, { label: '三棱镜', value: 'prism' }, { label: '凸透镜', value: 'lens' }, { label: '水面', value: 'water' }],
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
      ctl.slider({ label: '光源角度', min: -60, max: 60, step: 1, value: C12.angle, fmt: (v) => v + '°', onInput: (v) => { C12.angle = v; } });
      // 默认光路校准：让激光恰好打在初始平面镜上（入射点 ≈ 镜面中心）
      ctl.slider({ label: '光源高度', min: -170, max: 170, step: 2, value: C12.height, fmt: (v) => v + '', onInput: (v) => { C12.height = v; } });
      ctl.button({
        label: '✕ 清空台面',
        onClick: () => { C12.elements = []; C12.selected = -1; },
      });
      setHint('按住元件拖动；拖空白处平移；滚轮缩放');
    },
  },
  {
    title: '随堂检测',
    html: `<p>5 道选择题，检验光学知识的掌握情况：反射定律、折射与介质折射率、全反射条件、凸透镜成像区间、干涉条纹间距。</p>`,
    enter() {
      S.ch = 12;
      hideHUD();
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
    q: '光从空气斜射入水中时，下列说法正确的是？',
    opts: ['折射角等于入射角', '折射角小于入射角', '折射角大于入射角', '折射光线与入射光线一定平行'],
    a: 1,
    ex: '光从光疏介质进入光密介质（n 变大），折射光线偏向法线，折射角小于入射角（n₁sinθ₁ = n₂sinθ₂）。池水「变浅」、筷子「折弯」都是这个道理。',
  },
  {
    q: '发生全反射的条件是？',
    opts: ['光从光疏介质射向光密介质，且入射角大于临界角', '光从光密介质射向光疏介质，且入射角大于或等于临界角', '只要入射角足够大就会发生全反射', '光从光密介质射向光疏介质就一定发生全反射'],
    a: 1,
    ex: '两个条件缺一不可：① 光从光密介质射向光疏介质（水→空气、玻璃→空气）；② 入射角 ≥ 临界角（sinC = n₂/n₁）。水的临界角约 48.8°，玻璃约 41.8°。',
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
      <p style="color:var(--text-dim);margin:4px 0 18px">正确率 ${pct}%${pct >= 80 ? '，几何光学与波动光学的要点你已经掌握了！' : pct >= 60 ? '，大部分概念已经清楚，回顾一下错题。' : '，建议回到前面章节再做一遍实验哦。'}</p>`;
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

/* ---------------- 指针交互：拖拽平移 / 滚轮缩放 / 沙盒拖元件 ---------------- */

let ptr = { down: false, panning: false, lastX: 0, lastY: 0, dragIdx: -1, dragOff: [0, 0] };

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
  if (S.ch === 11) {
    const idx = hitElement(wx, wy);
    if (idx >= 0) {
      C12.selected = idx;
      ptr.dragIdx = idx;
      ptr.dragOff = [C12.elements[idx].x - wx, C12.elements[idx].y - wy];
      canvas.classList.add('grabbing');
      return;
    }
    C12.selected = -1;
  }
  ptr.panning = true;
  ptr.lastX = px; ptr.lastY = py;
  canvas.classList.add('grabbing');
});

canvas.addEventListener('pointermove', (e) => {
  const [px, py] = canvasPos(e);
  if (ptr.down && ptr.dragIdx >= 0) {
    const [wx, wy] = S2W(px, py);
    const el = C12.elements[ptr.dragIdx];
    if (el) { el.x = wx + ptr.dragOff[0]; el.y = wy + ptr.dragOff[1]; }
    return;
  }
  if (ptr.down && ptr.panning) {
    view.cx -= (px - ptr.lastX) / view.k;
    view.cy += (py - ptr.lastY) / view.k;
    ptr.lastX = px; ptr.lastY = py;
    return;
  }
  if (S.ch === 11 && !ptr.down) {
    const [wx, wy] = S2W(px, py);
    canvas.classList.toggle('grab', hitElement(wx, wy) >= 0);
  }
});

function ptrEnd() {
  ptr.down = false; ptr.panning = false; ptr.dragIdx = -1;
  canvas.classList.remove('grabbing');
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
labReady = true;
