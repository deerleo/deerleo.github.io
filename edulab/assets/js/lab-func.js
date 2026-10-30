/* EduLab · 函数图像实验室（func）
 * 章节：图像变换 / 指数与对数 / 单位圆与三角函数 / 正弦型函数 / 导数的几何意义 / 单调性与极值 / 零点与二分法 / 定积分（拓展）/ 随堂检测
 * 实现：2D canvas 坐标系绘图（拖拽平移 + 滚轮/双指缩放），每章一组控件与联动演示。
 */
import {
  createSections, createControlsPanel, makeHUD,
} from './edu-core.js';

/* ---------------- 画布脚手架 ---------------- */

const stage = document.getElementById('stage');
const canvas = document.createElement('canvas');
canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;touch-action:none;cursor:grab;';
stage.appendChild(canvas);
const ctx = canvas.getContext('2d');
const DPR = Math.min(window.devicePixelRatio || 1, 2);

function resize() {
  canvas.width = Math.max(1, stage.clientWidth * DPR);
  canvas.height = Math.max(1, stage.clientHeight * DPR);
}
new ResizeObserver(resize).observe(stage);
resize();

/* 主题色（跟随浅/深切换） */
const palette = {};
function refreshPalette() {
  const cs = getComputedStyle(document.documentElement);
  palette.bg = cs.getPropertyValue('--bg').trim() || '#f5f6f8';
  palette.card = cs.getPropertyValue('--card').trim() || '#fff';
  palette.text = cs.getPropertyValue('--text').trim() || '#2a3441';
  palette.dim = cs.getPropertyValue('--text-dim').trim() || '#66717e';
  palette.faint = cs.getPropertyValue('--text-faint').trim() || '#98a2ad';
  palette.accent = cs.getPropertyValue('--accent').trim() || '#e8674a';
  palette.grid = document.documentElement.getAttribute('data-theme') === 'dark'
    ? 'rgba(255,255,255,0.07)' : 'rgba(20,32,44,0.07)';
  palette.axis = document.documentElement.getAttribute('data-theme') === 'dark'
    ? 'rgba(255,255,255,0.35)' : 'rgba(20,32,44,0.35)';
}
refreshPalette();
window.addEventListener('edulabtheme', refreshPalette);
const themeMQ = window.matchMedia('(prefers-color-scheme: dark)');
themeMQ.addEventListener?.('change', refreshPalette);

const C = {
  blue: '#4a90d9', green: '#3fa96f', purple: '#9b6fd9', gold: '#d9a13f',
  teal: '#2fb3a5', red: '#d9534f', pink: '#d9649b',
};

/* ---------------- 坐标变换与绘图工具 ---------------- */

const view = {
  cx: 0, cy: 0,        // 世界坐标中心
  scale: 48,           // 每单位像素
};
function W2S(x, y, vw = canvas.width, vh = canvas.height, offX = 0, offY = 0) {
  return [vw / 2 + (x - view.cx) * view.scale + offX, vh / 2 - (y - view.cy) * view.scale + offY];
}
function S2W(sx, sy, vw = canvas.width, vh = canvas.height, offX = 0, offY = 0) {
  return [(sx - vw / 2 - offX) / view.scale + view.cx, -(sy - vh / 2 - offY) / view.scale + view.cy];
}

function clearCanvas() {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.fillStyle = palette.bg;
  ctx.fillRect(0, 0, canvas.width / DPR, canvas.height / DPR);
}

function niceStep(raw) {
  const p = Math.pow(10, Math.floor(Math.log10(raw)));
  const r = raw / p;
  return (r < 1.5 ? 1 : r < 3.5 ? 2 : r < 7.5 ? 5 : 10) * p;
}

function drawGrid(vw, vh, offX = 0, offY = 0, region = null) {
  // region: 可选 {x,y,w,h} 限定绘制区域（像素）
  const step = niceStep(90 / view.scale);
  const clip = () => {
    if (!region) return;
    ctx.beginPath();
    ctx.rect(region.x, region.y, region.w, region.h);
    ctx.clip();
  };
  ctx.save();
  clip();
  ctx.lineWidth = 1;
  ctx.strokeStyle = palette.grid;
  const [wx0, wy1] = S2W(0, 0, vw, vh, offX, offY);
  const [wx1, wy0] = S2W(vw, vh, vw, vh, offX, offY);
  const x0 = Math.floor(wx0 / step) * step, x1 = Math.ceil(wx1 / step) * step;
  const y0 = Math.floor(wy0 / step) * step, y1 = Math.ceil(wy1 / step) * step;
  ctx.beginPath();
  for (let x = x0; x <= x1 + step / 2; x += step) {
    const [sx] = W2S(x, 0, vw, vh, offX, offY);
    ctx.moveTo(sx, 0); ctx.lineTo(sx, vh);
  }
  for (let y = y0; y <= y1 + step / 2; y += step) {
    const [, sy] = W2S(0, y, vw, vh, offX, offY);
    ctx.moveTo(0, sy); ctx.lineTo(vw, sy);
  }
  ctx.stroke();
  // 坐标轴
  ctx.strokeStyle = palette.axis;
  ctx.lineWidth = 1.4;
  const [ox, oy] = W2S(0, 0, vw, vh, offX, offY);
  if (oy > -30 && oy < vh + 30) { ctx.beginPath(); ctx.moveTo(0, oy); ctx.lineTo(vw, oy); ctx.stroke(); }
  if (ox > -30 && ox < vw + 30) { ctx.beginPath(); ctx.moveTo(ox, 0); ctx.lineTo(ox, vh); ctx.stroke(); }
  // 刻度数字
  ctx.fillStyle = palette.faint;
  ctx.font = '11px -apple-system, "PingFang SC", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  for (let x = x0; x <= x1 + step / 2; x += step) {
    if (Math.abs(x) < step / 2) continue;
    const [sx, sy] = W2S(x, 0, vw, vh, offX, offY);
    if (sy > -12 && sy < vh + 12) ctx.fillText(fmtTick(x), sx, Math.min(Math.max(oy + 4, 2), vh - 16));
  }
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  for (let y = y0; y <= y1 + step / 2; y += step) {
    if (Math.abs(y) < step / 2) continue;
    const [sx, sy] = W2S(0, y, vw, vh, offX, offY);
    if (sx > -40 && sx < vw + 40) ctx.fillText(fmtTick(y), Math.min(Math.max(ox + 5, 2), vw - 34), sy);
  }
  ctx.restore();
}
function fmtTick(v) {
  const s = Math.abs(v) < 1e9 ? +v.toFixed(6) : v;
  return String(s);
}

/** 在世界坐标下绘制函数曲线（自动断点处理） */
function plotCurve(f, color, opts = {}) {
  const vw = opts.vw ?? canvas.width / DPR, vh = opts.vh ?? canvas.height / DPR;
  const offX = opts.offX || 0, offY = opts.offY || 0;
  ctx.save();
  if (opts.region) {
    ctx.beginPath();
    ctx.rect(opts.region.x, opts.region.y, opts.region.w, opts.region.h);
    ctx.clip();
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = opts.width || 2.4;
  ctx.lineJoin = 'round';
  ctx.setLineDash(opts.dash || []);
  const [wx0] = S2W(0, 0, vw, vh, offX, offY);
  const [wx1] = S2W(vw, 0, vw, vh, offX, offY);
  const n = Math.ceil(vw / 1.5);
  let began = false;
  let prevY = null;
  ctx.beginPath();
  for (let i = 0; i <= n; i++) {
    const x = wx0 + (wx1 - wx0) * (i / n);
    const y = f(x);
    if (!isFinite(y)) { began = false; prevY = null; continue; }
    const [sx, sy] = W2S(x, y, vw, vh, offX, offY);
    // 跳变检测：相邻像素落差过大视为间断
    if (began && prevY !== null && Math.abs(y - prevY) > (vw / view.scale) * 2) began = false;
    if (!began) { ctx.moveTo(sx, sy); began = true; }
    else ctx.lineTo(sx, sy);
    prevY = y;
  }
  ctx.stroke();
  ctx.restore();
}

/** 世界坐标两点连线 */
function wline(x1, y1, x2, y2, color, opts = {}) {
  const vw = canvas.width / DPR, vh = canvas.height / DPR;
  const offX = opts.offX || 0, offY = opts.offY || 0;
  ctx.save();
  if (opts.region) {
    ctx.beginPath();
    ctx.rect(opts.region.x, opts.region.y, opts.region.w, opts.region.h);
    ctx.clip();
  }
  const [ax, ay] = W2S(x1, y1, vw, vh, offX, offY);
  const [bx, by] = W2S(x2, y2, vw, vh, offX, offY);
  ctx.strokeStyle = color;
  ctx.lineWidth = opts.width || 1.6;
  ctx.setLineDash(opts.dash || []);
  ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
  ctx.setLineDash([]);
  if (opts.arrow) {
    const ang = Math.atan2(by - ay, bx - ax), L = 8;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx - L * Math.cos(ang - 0.42), by - L * Math.sin(ang - 0.42));
    ctx.lineTo(bx - L * Math.cos(ang + 0.42), by - L * Math.sin(ang + 0.42));
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

/** 世界坐标圆点 */
function wdot(x, y, color, r = 4, opts = {}) {
  const vw = canvas.width / DPR, vh = canvas.height / DPR;
  const offX = opts.offX || 0, offY = opts.offY || 0;
  const [sx, sy] = W2S(x, y, vw, vh, offX, offY);
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.fill();
  if (opts.ring) {
    ctx.strokeStyle = opts.ring; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(sx, sy, r + 2.5, 0, Math.PI * 2); ctx.stroke();
  }
}

/** 世界坐标文字（带描边光晕） */
function wtext(text, x, y, color, opts = {}) {
  const vw = canvas.width / DPR, vh = canvas.height / DPR;
  const offX = opts.offX || 0, offY = opts.offY || 0;
  const [sx, sy] = W2S(x, y, vw, vh, offX, offY);
  ctx.save();
  if (opts.region) {
    ctx.beginPath();
    ctx.rect(opts.region.x, opts.region.y, opts.region.w, opts.region.h);
    ctx.clip();
  }
  ctx.font = (opts.bold ? '600 ' : '') + (opts.size || 13) + 'px -apple-system, "PingFang SC", sans-serif';
  ctx.textAlign = opts.align || 'center';
  ctx.textBaseline = opts.baseline || 'bottom';
  ctx.lineWidth = 3.5;
  ctx.strokeStyle = opts.halo || palette.bg;
  ctx.strokeText(text, sx + (opts.dx || 0), sy + (opts.dy || 0));
  ctx.fillStyle = color;
  ctx.fillText(text, sx + (opts.dx || 0), sy + (opts.dy || 0));
  ctx.restore();
}

/* ---------------- 平移 / 缩放交互 ---------------- */

const pointers = new Map();
let pinchD0 = 0, pinchScale0 = 1;
canvas.addEventListener('pointerdown', (e) => {
  canvas.setPointerCapture(e.pointerId);
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    pinchD0 = Math.hypot(a.x - b.x, a.y - b.y);
    pinchScale0 = view.scale;
  }
});
canvas.addEventListener('pointermove', (e) => {
  if (!pointers.has(e.pointerId)) return;
  const p = pointers.get(e.pointerId);
  const dx = e.clientX - p.x, dy = e.clientY - p.y;
  p.x = e.clientX; p.y = e.clientY;
  if (pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    const d = Math.hypot(a.x - b.x, a.y - b.y);
    if (pinchD0 > 0) setScale(pinchScale0 * d / pinchD0, e.clientX, e.clientY);
    return;
  }
  if (chapterDrag && chapterDrag(e, dx, dy)) return;
  view.cx -= dx / view.scale;
  view.cy += dy / view.scale;
  clampView();
});
function endPointer(e) {
  pointers.delete(e.pointerId);
  if (pointers.size < 2) pinchD0 = 0;
}
canvas.addEventListener('pointerup', endPointer);
canvas.addEventListener('pointercancel', endPointer);
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  setScale(view.scale * Math.exp(-e.deltaY * 0.0016), e.clientX, e.clientY);
}, { passive: false });

function setScale(s, px, py) {
  const rect = canvas.getBoundingClientRect();
  const lx = px !== undefined ? px - rect.left : canvas.width / DPR / 2;
  const ly = py !== undefined ? py - rect.top : canvas.height / DPR / 2;
  const [wx, wy] = S2W(lx, ly, canvas.width / DPR, canvas.height / DPR);
  view.scale = Math.min(400, Math.max(10, s));
  const [nx, ny] = S2W(lx, ly, canvas.width / DPR, canvas.height / DPR);
  view.cx += wx - nx; view.cy += wy - ny;
  clampView();
}
function clampView() {
  view.cx = Math.max(-60, Math.min(60, view.cx));
  view.cy = Math.max(-60, Math.min(60, view.cy));
}
function resetView(cx = 0, cy = 0, scale = 48) { view.cx = cx; view.cy = cy; view.scale = scale; }

/* ---------------- 章节框架 ---------------- */

const ctl = createControlsPanel(document.getElementById('controls'));
let chapterDrag = null;           // 章节自定义拖拽（返回 true 表示已消费）
let chapterTick = null;           // 每帧绘制回调
let activeCleanup = null;
const hud = makeHUD(stage, [['v1', '读数'], ['v2', ''], ['v3', '']]);
hud.show(false);

function funcPresets() {
  return {
    x2: { label: 'y = x²', f: (x) => x * x, fp: (x) => 2 * x, tex: 'x²' },
    abs: { label: 'y = |x|', f: Math.abs, fp: (x) => (x > 0 ? 1 : x < 0 ? -1 : NaN), tex: '|x|' },
    sqrt: { label: 'y = √x', f: (x) => (x >= 0 ? Math.sqrt(x) : NaN), fp: (x) => (x > 0 ? 1 / (2 * Math.sqrt(x)) : NaN), tex: '√x' },
    x3: { label: 'y = x³', f: (x) => x * x * x, fp: (x) => 3 * x * x, tex: 'x³' },
    inv: { label: 'y = 1/x', f: (x) => 1 / x, fp: (x) => -1 / (x * x), tex: '1/x' },
    sin: { label: 'y = sin x', f: Math.sin, fp: Math.cos, tex: 'sin x' },
    cubic: { label: 'x³−3x', f: (x) => x * x * x - 3 * x, fp: (x) => 3 * x * x - 3, tex: 'x³−3x' },
    quart: { label: 'x⁴−4x²+2', f: (x) => x * x * x * x - 4 * x * x + 2, fp: (x) => 4 * x * x * x - 8 * x, tex: 'x⁴−4x²+2' },
  };
}

/* ================= 章节 1：图像变换 ================= */

const trState = { base: 'x2', a: 1, h: 0, k: 0, ghost: true, animT: 1 };

function transformed(x) {
  const p = funcPresets()[trState.base];
  const y = p.f(x - trState.h);
  if (!isFinite(y)) return NaN;
  const y2 = trState.a >= 0 ? y * trState.a : -y * trState.a; // a<0 兼含翻折
  return y2 + trState.k;
}

const secTransform = {
  id: 'transform', title: '图像变换',
  html: `<p>从基本函数 <b>f(x)</b> 出发，图像按 <span class="hl">y = a·f(x−h) + k</span> 变换：</p>
<p>① <b>h</b>：左右平移（左加右减，x−h 向右移 h）；② <b>k</b>：上下平移；③ <b>a</b>：纵向伸缩，|a|&gt;1 拉伸、0&lt;|a|&lt;1 压缩；④ <b>a&lt;0</b> 时额外关于 x 轴翻折。</p>
<p>规律口诀：<b>平移沿坐标轴方向，伸缩沿 y 值倍数</b>。灰色虚线是母函数 f(x)，拖动滑杆观察每一步的变化。画布支持拖拽平移与缩放。</p>`,
  enter() {
    Object.assign(trState, { base: 'x2', a: 1, h: 0, k: 0, ghost: true, animT: 0 });
    resetView(0, 0, 48);
    chapterDrag = null;
    hud.show(false);
    ctl.clear();
    const baseNames = Object.keys(funcPresets());
    ctl.seg({
      options: baseNames.map((k) => ({ label: funcPresets()[k].label.replace('y = ', ''), value: k })),
      value: trState.base,
      onChange: (v) => { trState.base = v; trState.animT = 0; },
    });
    ctl.sep();
    ctl.slider({ label: 'a', min: -3, max: 3, step: 0.1, value: 1, fmt: (v) => v.toFixed(1), onInput: (v) => { trState.a = v; trState.animT = 0; } });
    ctl.slider({ label: 'h', min: -5, max: 5, step: 0.1, value: 0, fmt: (v) => v.toFixed(1), onInput: (v) => { trState.h = v; trState.animT = 0; } });
    ctl.slider({ label: 'k', min: -5, max: 5, step: 0.1, value: 0, fmt: (v) => v.toFixed(1), onInput: (v) => { trState.k = v; trState.animT = 0; } });
    ctl.sep();
    ctl.toggle({ label: '母函数', value: true, onChange: (v) => { trState.ghost = v; } });
    ctl.toggle({
      label: '动画演示', value: false, onChange: (v) => { trState.animT = v ? 0 : 1; },
    });
    chapterTick = (dt) => {
      if (trState.animT < 1) trState.animT = Math.min(1, trState.animT + dt * 0.7);
      drawTransform();
    };
    drawTransform();
  },
};

function lerpF(x) {
  // 母函数 → 变换函数的插值动画
  const t = trState.animT;
  const p = funcPresets()[trState.base];
  const y0 = p.f(x);
  const y1 = transformed(x);
  if (!isFinite(y0)) return y1;
  return y0 + (y1 - y0) * t;
}

function drawTransform() {
  clearCanvas();
  drawGrid(canvas.width / DPR, canvas.height / DPR);
  const p = funcPresets()[trState.base];
  if (trState.ghost) plotCurve(p.f, palette.faint, { width: 1.6, dash: [6, 5] });
  plotCurve(lerpF, palette.accent);
  wtext(`y = a·f(x−h) + k，母函数 f(x) = ${p.tex}`, 0, 6.2, palette.text, { size: 14, bold: true, halo: palette.bg });
  wtext(describeTransform(), 0, 5.1, palette.dim, { size: 12, halo: palette.bg });
}

function describeTransform() {
  const parts = [];
  const p = funcPresets()[trState.base];
  if (Math.abs(trState.h) > 1e-9) parts.push(trState.h > 0 ? `右移 ${trState.h.toFixed(1)}` : `左移 ${(-trState.h).toFixed(1)}`);
  if (Math.abs(trState.k) > 1e-9) parts.push(trState.k > 0 ? `上移 ${trState.k.toFixed(1)}` : `下移 ${(-trState.k).toFixed(1)}`);
  if (Math.abs(Math.abs(trState.a) - 1) > 1e-9) parts.push(Math.abs(trState.a) > 1 ? `纵向拉伸 ${Math.abs(trState.a).toFixed(1)}×` : `纵向压缩 ${Math.abs(trState.a).toFixed(1)}×`);
  if (trState.a < 0) parts.push('x 轴翻折');
  return parts.join(' · ') || '未变换（a=1, h=0, k=0）';
}

/* ================= 章节 2：指数与对数 ================= */

const exState = { b: 2, t: 0, showMirror: true, anim: false, px: 1 };

const secExpln = {
  id: 'expln', title: '指数与对数',
  html: `<p>指数函数 <b>y = bˣ</b>（b&gt;0，b≠1）与对数函数 <b>y = log<sub>b</sub> x</b> 互为<b>反函数</b>：图像关于直线 <span class="hl">y = x</span> 对称。</p>
<p>道理很直接：把 y = bˣ 改写成 x = log<sub>b</sub> y，交换 x、y 就是 y = log<sub>b</sub> x——交换坐标 (a, bˣ) → (bˣ, a) 正好是关于 y = x 的镜像。</p>
<p>拖动「底数 b」观察两支曲线如何变化；打开「镜像点演示」看点 P(x, bˣ) 与它的镜像 P′(bˣ, x) 沿 y = x 对称移动。b&gt;1 时都单调递增；0&lt;b&lt;1 时都单调递减（本实验限 b&gt;1）。</p>`,
  enter() {
    Object.assign(exState, { b: 2, t: 0, showMirror: true, anim: false, px: 1 });
    resetView(-1, 1, 44);
    chapterDrag = null;
    hud.show(true);
    ctl.clear();
    ctl.slider({ label: '底数 b', min: 1.2, max: 6, step: 0.1, value: 2, fmt: (v) => v.toFixed(1), onInput: (v) => { exState.b = v; } });
    ctl.slider({ label: '演示点 x', min: -2.5, max: 2.5, step: 0.05, value: 1, fmt: (v) => v.toFixed(2), onInput: (v) => { exState.px = v; exState.anim = false; } });
    ctl.toggle({ label: '对称轴 y=x', value: true, onChange: (v) => { exState.showMirror = v; } });
    ctl.button({
      label: '▶ 镜像点动画',
      onClick() { exState.anim = !exState.anim; },
    });
    chapterTick = (dt) => {
      if (exState.anim) {
        exState.t += dt * 0.5;
        exState.px = 2.4 * Math.sin(exState.t);
      }
      drawExpln();
    };
    drawExpln();
  },
};

function drawExpln() {
  clearCanvas();
  drawGrid(canvas.width / DPR, canvas.height / DPR);
  const b = exState.b;
  if (exState.showMirror) wline(-8, -8, 8, 8, palette.gold, { dash: [7, 5], width: 1.6 });
  plotCurve((x) => Math.pow(b, x), C.blue);
  plotCurve((x) => (x > 0 ? Math.log(x) / Math.log(b) : NaN), C.green);
  // 演示点与镜像
  const x = exState.px;
  const y = Math.pow(b, x);
  if (isFinite(y) && Math.abs(y) < 60) {
    wdot(x, y, C.blue, 5, { ring: '#fff' });
    wdot(y, x, C.green, 5, { ring: '#fff' });
    wline(x, y, y, x, palette.faint, { dash: [4, 4] });
    wtext(`P(${x.toFixed(2)}, ${y.toFixed(2)})`, x, y + 0.6, C.blue, { size: 12, bold: true });
    wtext(`P′(${y.toFixed(2)}, ${x.toFixed(2)})`, y, x - 0.6, C.green, { size: 12, bold: true, baseline: 'top' });
  }
  wtext(`y = ${b.toFixed(1)}ˣ`, -6.5, 7.5, C.blue, { size: 14, bold: true, align: 'left', baseline: 'bottom' });
  wtext(`y = log${b.toFixed(1)} x`, 7.5, -6.2, C.green, { size: 14, bold: true, align: 'right' });
  hud.set('v1', `bˣ: b=${b.toFixed(1)} 处 b⁰=1`);
  hud.set('v2', `log₁ᵦ 1 = 0`);
  hud.set('v3', `P 与 P′ 关于 y=x 对称`);
}

/* ================= 章节 3：单位圆与三角函数 ================= */

const ucState = { theta: 0, playing: true, speed: 0.8, showCos: false, showFive: false };

const secUnit = {
  id: 'unit', title: '单位圆与三角函数',
  html: `<p>角 θ 的终边与<b>单位圆</b>交于点 P，则 <span class="hl">cos θ = P 的横坐标，sin θ = P 的纵坐标，tan θ = 斜率</span>。</p>
<p>让 P 沿圆周匀速转动，右侧画出 sin θ 随 θ 的图像——圆周运动"展开"成正弦曲线。这就是<span class="hl">单位圆定义法</span>，也是"五点法"作图的来历：θ = 0、π/2、π、3π/2、2π 五个关键点确定一个周期。</p>
<p>打开「余弦曲线」对照：同一段圆周运动，横坐标投影的相位与纵坐标相差 π/2。</p>`,
  enter() {
    Object.assign(ucState, { theta: 0, playing: true, speed: 0.8, showCos: false, showFive: false });
    resetView(0, 0, 42);
    chapterDrag = null;
    hud.show(true);
    ctl.clear();
    const playBtn = ctl.button({
      label: '⏸ 暂停', onClick() {
        ucState.playing = !ucState.playing;
        playBtn.textContent = ucState.playing ? '⏸ 暂停' : '▶ 播放';
      },
    });
    ctl.slider({ label: '速度', min: 0.2, max: 2.5, step: 0.1, value: 0.8, fmt: (v) => v.toFixed(1) + '×', onInput: (v) => { ucState.speed = v; } });
    ctl.sep();
    ctl.toggle({ label: '余弦曲线', value: false, onChange: (v) => { ucState.showCos = v; } });
    ctl.toggle({ label: '五点法', value: false, onChange: (v) => { ucState.showFive = v; } });
    chapterTick = (dt) => {
      if (ucState.playing) ucState.theta += dt * ucState.speed * Math.PI;
      drawUnitCircle();
    };
    drawUnitCircle();
  },
};

function drawUnitCircle() {
  const vw = canvas.width / DPR, vh = canvas.height / DPR;
  clearCanvas();
  // 布局：左侧单位圆（像素坐标绘制），右侧波形（世界坐标，半幅偏移）
  const splitX = Math.min(vw * 0.42, 360);
  const R = Math.min(splitX, vh) * 0.34;
  const ccx = splitX / 2, ccy = vh / 2;
  const th = ucState.theta % (Math.PI * 2);
  const px = Math.cos(th), py = Math.sin(th);
  // 左区：坐标轴 + 圆
  ctx.strokeStyle = palette.axis;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(ccx - R * 1.5, ccy); ctx.lineTo(ccx + R * 1.5, ccy);
  ctx.moveTo(ccx, ccy - R * 1.5); ctx.lineTo(ccx, ccy + R * 1.5);
  ctx.stroke();
  ctx.strokeStyle = palette.dim;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(ccx, ccy, R, 0, Math.PI * 2); ctx.stroke();
  const psx = ccx + px * R, psy = ccy - py * R;
  ctx.strokeStyle = palette.accent; ctx.lineWidth = 2.2;
  ctx.beginPath(); ctx.moveTo(ccx, ccy); ctx.lineTo(psx, psy); ctx.stroke();
  ctx.strokeStyle = C.blue; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(psx, psy); ctx.lineTo(psx, ccy); ctx.stroke();
  ctx.strokeStyle = C.green;
  ctx.beginPath(); ctx.moveTo(psx, ccy); ctx.lineTo(ccx, ccy); ctx.stroke();
  ctx.fillStyle = palette.accent;
  ctx.beginPath(); ctx.arc(psx, psy, 5, 0, Math.PI * 2); ctx.fill();
  // 左区标注（像素坐标 + 描边）
  const label = (text, lx, ly, color, size = 12, bold = false) => {
    ctx.font = (bold ? '600 ' : '') + size + 'px -apple-system, "PingFang SC", sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineWidth = 3; ctx.strokeStyle = palette.bg;
    ctx.strokeText(text, lx, ly);
    ctx.fillStyle = color;
    ctx.fillText(text, lx, ly);
  };
  label('P', psx + Math.sign(px || 1) * 16, psy - Math.sign(py || 1) * 12 - 4, palette.text, 12, true);
  label(`θ = ${(th / Math.PI).toFixed(2)}π`, ccx, ccy - R * 1.32, palette.dim);
  label('sin θ', (psx + ccx) / 2 + (px >= 0 ? 26 : -26), (psy + ccy) / 2, C.blue, 11);
  label('1', ccx + 14, ccy - R - 6, palette.faint, 11);
  label('O', ccx - 12, ccy + 12, palette.faint, 11);
  // 分隔线
  ctx.strokeStyle = palette.grid;
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(splitX, 0); ctx.lineTo(splitX, vh); ctx.stroke();
  // 右区：波形（世界坐标绘制，右半区中心偏移 = splitX/2）
  const offX = splitX / 2;
  drawGrid(vw, vh, offX, 0, { x: splitX, y: 0, w: vw - splitX, h: vh });
  plotCurve(Math.sin, C.blue, { offX, region: { x: splitX, y: 0, w: vw - splitX, h: vh } });
  if (ucState.showCos) plotCurve(Math.cos, C.green, { offX, dash: [6, 4], region: { x: splitX, y: 0, w: vw - splitX, h: vh } });
  const [cx0] = W2S(th, 0, vw, vh, offX);
  ctx.save();
  ctx.beginPath(); ctx.rect(splitX, 0, vw - splitX, vh); ctx.clip();
  ctx.strokeStyle = palette.faint; ctx.setLineDash([4, 4]); ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(cx0, 0); ctx.lineTo(cx0, vh); ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
  wdot(th, py, C.blue, 4.5, { offX });
  if (ucState.showCos) wdot(th, px, C.green, 4.5, { offX });
  if (ucState.showFive) {
    const five = [0, Math.PI / 2, Math.PI, Math.PI * 1.5, Math.PI * 2];
    const names = ['(0,0)', '(π/2,1)', '(π,0)', '(3π/2,−1)', '(2π,0)'];
    five.forEach((t, i) => {
      wdot(t, Math.sin(t), C.gold, 5, { offX });
      wtext(names[i], t, Math.sin(t) + (Math.sin(t) >= 0 ? 0.35 : -0.35), C.gold, { size: 10.5, offX, baseline: Math.sin(t) >= 0 ? 'bottom' : 'top' });
    });
    wtext('五点法：五个关键点定一个周期', Math.PI, -1.75, C.gold, { size: 12, bold: true, offX });
  }
  label('单位圆（左）→ 正弦曲线（右）', splitX + (vw - splitX) / 2, 16, palette.text, 13, true);
  hud.set('v1', `sin θ = ${py.toFixed(3)}`);
  hud.set('v2', `cos θ = ${px.toFixed(3)}`);
  hud.set('v3', Math.abs(px) < 0.02 ? 'tan θ 不存在' : `tan θ = ${(py / px).toFixed(3)}`);
}

/* ================= 章节 4：正弦型函数 ================= */

const sfState = { A: 1, w: 1, phi: 0, k: 0, ghost: true, phaseAnim: false };

const secSine = {
  id: 'sine', title: '正弦型函数',
  html: `<p><span class="hl">y = A·sin(ωx + φ) + k</span>（A&gt;0，ω&gt;0）是正弦曲线的"全家福"：</p>
<p>① <b>A</b>：振幅，值域 [k−A, k+A]；② <b>ω</b>：角频率，周期 <span class="hl">T = 2π/ω</span>；③ <b>φ</b>：初相，图像左移 φ/ω（φ&gt;0 时左移）；④ <b>k</b>：上下平移。</p>
<p>变换顺序的关键：先平移（φ 作用于 x）再伸缩（ω 倍）时，平移量是 <b>φ/ω</b> 而不是 φ——这是考试最容易出错的地方。</p>
<p>打开「相位滚动」看波形整体向左流动；灰色虚线为 y = sin x 对照。</p>`,
  enter() {
    Object.assign(sfState, { A: 1, w: 1, phi: 0, k: 0, ghost: true, phaseAnim: false });
    resetView(0, 0, 42);
    chapterDrag = null;
    hud.show(true);
    ctl.clear();
    ctl.slider({ label: 'A 振幅', min: 0.2, max: 3, step: 0.1, value: 1, fmt: (v) => v.toFixed(1), onInput: (v) => { sfState.A = v; } });
    ctl.slider({ label: 'ω 频率', min: 0.25, max: 4, step: 0.05, value: 1, fmt: (v) => v.toFixed(2), onInput: (v) => { sfState.w = v; } });
    ctl.slider({ label: 'φ 初相', min: 0, max: Math.PI * 2, step: 0.05, value: 0, fmt: (v) => (v / Math.PI).toFixed(2) + 'π', onInput: (v) => { sfState.phi = v; } });
    ctl.slider({ label: 'k 平移', min: -2, max: 2, step: 0.1, value: 0, fmt: (v) => v.toFixed(1), onInput: (v) => { sfState.k = v; } });
    ctl.sep();
    ctl.toggle({ label: 'sin x 对照', value: true, onChange: (v) => { sfState.ghost = v; } });
    ctl.toggle({ label: '相位滚动', value: false, onChange: (v) => { sfState.phaseAnim = v; } });
    chapterTick = (dt) => {
      if (sfState.phaseAnim) sfState.phi = (sfState.phi + dt * 0.6) % (Math.PI * 2);
      drawSine();
    };
    drawSine();
  },
};

function drawSine() {
  clearCanvas();
  drawGrid(canvas.width / DPR, canvas.height / DPR);
  const { A, w, phi, k } = sfState;
  if (sfState.ghost) plotCurve(Math.sin, palette.faint, { width: 1.6, dash: [6, 5] });
  plotCurve((x) => A * Math.sin(w * x + phi) + k, palette.accent);
  // 值域带
  const vw = canvas.width / DPR, vh = canvas.height / DPR;
  ctx.save();
  ctx.fillStyle = 'rgba(232,103,74,0.06)';
  const [yt] = W2S(0, k + A, vw, vh), [yb] = W2S(0, k - A, vw, vh);
  ctx.fillRect(0, yt, vw, yb - yt);
  ctx.restore();
  // 平移参考：sin x 上的 (0,0) 移动到 (−φ/w, k)
  wline(-phi / w, k - A - 0.5, -phi / w, k + A + 0.5, palette.faint, { dash: [3, 4] });
  wdot(-phi / w, k, C.gold, 4.5);
  wtext(`起点 (−φ/ω, k) = (${(-phi / w).toFixed(2)}, ${k.toFixed(1)})`, -phi / w, k - A - 0.7, C.gold, { size: 11.5, baseline: 'top' });
  wtext(`y = ${A.toFixed(1)}·sin(${w.toFixed(2)}x + ${(phi / Math.PI).toFixed(2)}π) + ${k.toFixed(1)}`, 0, k + A + 1.15, palette.text, { size: 14, bold: true });
  wtext(`周期 T = 2π/ω = ${(Math.PI * 2 / w).toFixed(2)}`, 6.2, k - A - 1, palette.dim, { size: 12.5, align: 'left', baseline: 'top' });
  hud.set('v1', `T = ${(Math.PI * 2 / w).toFixed(2)}`);
  hud.set('v2', `值域 [${(k - A).toFixed(1)}, ${(k + A).toFixed(1)}]`);
  hud.set('v3', `左移 ${Math.abs(phi / w).toFixed(2)}（φ${phi > Math.PI ? '>' : '≤'}π）`);
}

/* ================= 章节 5：导数的几何意义 ================= */

const dvState = { fn: 'cubic', x0: 1, h: 1.2, showDeriv: false, anim: false, trail: [] };

const secDeriv = {
  id: 'deriv', title: '导数的几何意义',
  html: `<p>过曲线上两点 P(x₀, f(x₀))、Q(x₀+h, f(x₀+h)) 的直线叫<b>割线</b>，斜率 = <span class="hl">[f(x₀+h) − f(x₀)] / h</span>。</p>
<p>让 h 越来越小，Q 沿曲线滑向 P，割线的极限位置就是<b>切线</b>——这个极限值就是<b>导数 f′(x₀)</b>：切线斜率，即瞬时变化率。</p>
<p>拖动「h」滑杆从大到小看割线贴近切线；点「动画逼近」自动演示极限过程；打开「导函数曲线」看切线斜率扫出的整条 f′(x)。黄色圆点标记了正在扫描的位置。</p>`,
  enter() {
    Object.assign(dvState, { fn: 'cubic', x0: 1, h: 1.2, showDeriv: false, anim: false, trail: [] });
    resetView(0, 0, 46);
    chapterDrag = (e, dx, dy) => {
      const presets = funcPresets();
      const f = presets[dvState.fn].f;
      const rect = canvas.getBoundingClientRect();
      const [wx] = S2W(e.clientX - rect.left, 0, canvas.width / DPR, canvas.height / DPR);
      dvState.x0 = Math.max(-4.5, Math.min(4.5, wx));
      dvState.anim = false; dvState.trail = [];
      return true;
    };
    hud.show(true);
    ctl.clear();
    const presets = ['cubic', 'x2', 'sin', 'quart'];
    ctl.seg({
      options: presets.map((k) => ({ label: funcPresets()[k].label.replace('y = ', ''), value: k })),
      value: dvState.fn,
      onChange: (v) => { dvState.fn = v; dvState.trail = []; },
    });
    ctl.sep();
    ctl.slider({ label: 'x₀', min: -4.5, max: 4.5, step: 0.05, value: 1, fmt: (v) => v.toFixed(2), onInput: (v) => { dvState.x0 = v; dvState.anim = false; dvState.trail = []; } });
    ctl.slider({ label: 'h', min: 0.01, max: 2, step: 0.01, value: 1.2, fmt: (v) => v.toFixed(2), onInput: (v) => { dvState.h = v; dvState.anim = false; dvState.trail = []; } });
    ctl.sep();
    ctl.button({
      label: '▶ 动画逼近',
      onClick() { dvState.anim = !dvState.anim; dvState.trail = []; },
    });
    ctl.toggle({ label: '导函数曲线', value: false, onChange: (v) => { dvState.showDeriv = v; dvState.trail = []; } });
    chapterTick = (dt) => {
      if (dvState.anim) {
        dvState.h = Math.max(0.01, dvState.h * Math.exp(-dt * 1.4));
        if (dvState.h <= 0.011) dvState.anim = false;
      }
      if (dvState.showDeriv) {
        // 扫描点动画
        dvState.scan = (dvState.scan === undefined ? 0 : dvState.scan + dt * 1.5) % 9;
        const xx = dvState.scan - 4.5;
        dvState.trail.push(xx);
        if (dvState.trail.length > 260) dvState.trail.shift();
      }
      drawDeriv();
    };
    drawDeriv();
  },
};

function drawDeriv() {
  clearCanvas();
  drawGrid(canvas.width / DPR, canvas.height / DPR);
  const presets = funcPresets();
  const { f, fp } = presets[dvState.fn];
  const x0 = dvState.x0, h = Math.max(0.01, dvState.h);
  const y0 = f(x0);
  const slope = (f(x0 + h) - y0) / h;
  const trueSlope = fp(x0);
  // 割线（延长线）
  const xq = x0 + h, yq = f(xq);
  wline(x0 - 5, y0 + slope * ((x0 - 5) - x0), x0 + 5, y0 + slope * ((x0 + 5) - x0), C.blue, { width: 1.8 });
  plotCurve(f, palette.accent);
  if (dvState.showDeriv) {
    plotCurve(fp, C.purple, { width: 2, dash: [7, 4] });
    // 扫描点
    if (dvState.trail.length) {
      for (let i = 1; i < dvState.trail.length; i++) {
        const a = dvState.trail[i - 1], b = dvState.trail[i];
        wline(a, fp(a), b, fp(b), 'rgba(155,111,217,0.5)', { width: 1.4 });
      }
    }
    const xx = dvState.trail.length ? dvState.trail[dvState.trail.length - 1] : 0;
    wdot(xx, fp(xx), C.gold, 5);
  }
  wdot(x0, y0, palette.text, 5, { ring: '#fff' });
  if (h > 0.015) {
    wdot(xq, yq, C.blue, 4.5, { ring: '#fff' });
    wtext('Q', xq + 0.15, yq, C.blue, { size: 12, bold: true, align: 'left' });
  }
  wtext('P', x0 - 0.2, y0, palette.text, { size: 12, bold: true, align: 'right' });
  wtext(`割线斜率 = ${slope.toFixed(3)}`, x0 + 1.6, y0 - 1.2, C.blue, { size: 12.5, bold: true, align: 'left' });
  if (h <= 0.05) wtext(`→ 极限（导数）= ${trueSlope.toFixed(3)}`, x0 + 1.6, y0 - 1.75, C.purple, { size: 12.5, bold: true, align: 'left' });
  hud.set('v1', `h = ${h.toFixed(2)}`);
  hud.set('v2', `割线斜率 ${slope.toFixed(3)}`);
  hud.set('v3', `f′(x₀) = ${isFinite(trueSlope) ? trueSlope.toFixed(3) : '不存在'}`);
}

/* ================= 章节 6：单调性与极值 ================= */

const moState = { fn: 'quart', showDeriv: true, selected: -1 };

const secMono = {
  id: 'mono', title: '单调性与极值',
  html: `<p>判断单调性不必描点：<b>f′(x) &gt; 0 ⇒ 增；f′(x) &lt; 0 ⇒ 减</b>。f′ 的零点是<b>临界点</b>——两侧导数同号则只是拐点变号处（极值点需两侧异号）。</p>
<p>下图把 f（上）与 f′（下）叠在同一个坐标系：橙色区间 f′&gt;0（f 递增），蓝色区间 f′&lt;0（f 递减）；金色圆点是极值点。可以清楚看到<b>f 的峰谷恰好对准 f′ 的零点</b>。</p>
<p>切换函数对比：三次函数 x³−3x 有极大和极小各一个；四次函数 x⁴−4x²+2 有三个临界点、两个极值点。</p>`,
  enter() {
    Object.assign(moState, { fn: 'quart', showDeriv: true, selected: -1 });
    resetView(0, 0, 46);
    chapterDrag = null;
    hud.show(true);
    ctl.clear();
    ctl.seg({
      options: [
        { label: 'x³−3x', value: 'cubic' },
        { label: 'x⁴−4x²+2', value: 'quart' },
        { label: 'sin x', value: 'sin' },
        { label: 'x³', value: 'x3' },
      ],
      value: moState.fn,
      onChange: (v) => { moState.fn = v; },
    });
    ctl.sep();
    ctl.toggle({ label: '显示 f′', value: true, onChange: (v) => { moState.showDeriv = v; } });
    chapterTick = () => drawMono();
    drawMono();
  },
};

function drawMono() {
  clearCanvas();
  drawGrid(canvas.width / DPR, canvas.height / DPR);
  const presets = funcPresets();
  const { f, fp } = presets[moState.fn];
  // 采样找临界点
  const vw = canvas.width / DPR;
  const [wx0, wx1] = S2W(0, 0, vw, 0);
  const crits = [];
  const N = 400;
  let px = wx0, py = fp(wx0);
  for (let i = 1; i <= N; i++) {
    const x = wx0 + (wx1 - wx0) * (i / N);
    const y = fp(x);
    if (isFinite(py) && isFinite(y) && py === 0) crits.push(x);
    if (isFinite(py) && isFinite(y) && py * y < 0) {
      // 二分精化
      let a = px, b = x;
      for (let k = 0; k < 40; k++) {
        const m = (a + b) / 2;
        (fp(a) * fp(m) <= 0) ? b = m : a = m;
      }
      crits.push((a + b) / 2);
    }
    px = x; py = y;
  }
  // 符号区间着色（f 高度处）
  const vh = canvas.height / DPR;
  ctx.save();
  ctx.beginPath(); ctx.rect(0, 0, vw, vh); ctx.clip();
  const stepX = (wx1 - wx0) / 240;
  for (let x = wx0; x < wx1; x += stepX) {
    const d = fp(x + stepX / 2);
    if (!isFinite(d)) continue;
    ctx.fillStyle = d > 0 ? 'rgba(232,103,74,0.10)' : 'rgba(74,144,217,0.10)';
    const [sx] = W2S(x, 0, vw, vh);
    ctx.fillRect(sx, 0, Math.ceil(vw / 240) + 1, vh);
  }
  ctx.restore();
  // 曲线
  if (moState.showDeriv) plotCurve(fp, C.purple, { width: 1.8, dash: [7, 4] });
  plotCurve(f, palette.accent);
  // 极值点
  crits.forEach((x, i) => {
    const isExt = i > 0 && i < crits.length - 1;
    const side1 = fp(x - 0.01), side2 = fp(x + 0.01);
    const isPeak = side1 > 0 && side2 < 0;
    const isValley = side1 < 0 && side2 > 0;
    if (isPeak || isValley) {
      const y = f(x);
      wdot(x, y, C.gold, 5.5, { ring: '#fff' });
      wtext(isPeak ? `极大值 f(${x.toFixed(2)})=${y.toFixed(2)}` : `极小值 f(${x.toFixed(2)})=${y.toFixed(2)}`, x, y + (isPeak ? 0.5 : -0.5), C.gold, { size: 11.5, bold: true, baseline: isPeak ? 'bottom' : 'top' });
    }
  });
  // 图例（左下角，避让说明卡与控制条）
  ctx.font = '12px -apple-system, "PingFang SC", sans-serif';
  ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
  ctx.fillStyle = 'rgba(232,103,74,0.35)'; ctx.fillRect(14, vh - 34, 12, 12);
  ctx.fillStyle = palette.dim; ctx.fillText('f′>0 增区间', 30, vh - 24);
  ctx.fillStyle = 'rgba(74,144,217,0.35)'; ctx.fillRect(110, vh - 34, 12, 12);
  ctx.fillStyle = palette.dim; ctx.fillText('f′<0 减区间', 126, vh - 24);
  hud.set('v1', `f′ 零点：${crits.length} 个`);
  hud.set('v2', `极值点：${crits.filter((x, i) => { const s1 = fp(x - 0.01), s2 = fp(x + 0.01); return s1 * s2 < 0; }).length} 个`);
  hud.set('v3', moState.showDeriv ? '紫虚线 = f′(x)' : '未显示 f′');
}

/* ================= 章节 7：零点与二分法 ================= */

const biState = { playing: false, steps: [], tol: 0.05 };

function bisectInit() {
  const f = (x) => x * x * x - x - 2;   // 根 ≈ 1.5214
  const steps = [];
  let a = 1, b = 2;
  for (let i = 0; i < 24; i++) {
    const m = (a + b) / 2, fm = f(m);
    steps.push({ n: i + 1, a, b, m, fm, fa: f(a), fb: f(b) });
    if (f(a) * fm <= 0) b = m; else a = m;
  }
  return { f, steps };
}
const bisectData = bisectInit();

const secBisect = {
  id: 'bisect', title: '零点与二分法',
  html: `<p>求 f(x) = x³ − x − 2 的零点：若 <b>f(a)·f(b) &lt; 0</b>，由零点存在定理，(a, b) 内必有零点。</p>
<p><b>二分法</b>：取中点 c=(a+b)/2，看 f(c) 与哪端同号，丢弃同号的一半——区间每次减半，<span class="hl">|根的误差 ≤ (b−a)/2ⁿ</span>。这是计算机求方程近似解的朴素而可靠的方法。</p>
<p>点「下一部」或「自动播放」逐步收窄区间；当前保留区间 [a, b] 高亮显示，右侧读数给出误差上界。精度滑杆控制自动停止的 |b−a|。</p>`,
  enter() {
    Object.assign(biState, { playing: false, idx: 0, tol: 0.05 });
    resetView(1.4, -1, 100);
    chapterDrag = null;
    hud.show(true);
    ctl.clear();
    const nextBtn = ctl.button({
      label: '下一步',
      onClick() { biState.idx = Math.min(biState.idx + 1, bisectData.steps.length - 1); biState.playing = false; },
    });
    const playBtn = ctl.button({
      label: '▶ 自动播放',
      onClick() {
        biState.playing = !biState.playing;
        playBtn.classList.toggle('active', biState.playing);
        if (biState.idx >= bisectData.steps.length - 1) biState.idx = 0;
      },
    });
    ctl.slider({ label: '精度 |b−a| ≤', min: 0.005, max: 0.5, step: 0.005, value: 0.05, fmt: (v) => v.toFixed(3), onInput: (v) => { biState.tol = v; } });
    ctl.sep();
    ctl.button({
      label: '↺ 重新开始',
      onClick() { biState.idx = 0; biState.playing = false; playBtn.classList.remove('active'); },
    });
    chapterTick = (dt) => {
      if (biState.playing) {
        biState.acc = (biState.acc || 0) + dt;
        if (biState.acc > 0.55) {
          biState.acc = 0;
          const st = bisectData.steps[biState.idx];
          if (st.b - st.a <= biState.tol || biState.idx >= bisectData.steps.length - 1) {
            biState.playing = false; playBtn.classList.remove('active');
          } else biState.idx++;
        }
      }
      drawBisect();
    };
    drawBisect();
  },
};

function drawBisect() {
  clearCanvas();
  drawGrid(canvas.width / DPR, canvas.height / DPR);
  const { f, steps } = bisectData;
  const st = steps[biState.idx];
  plotCurve(f, palette.accent);
  const vw = canvas.width / DPR, vh = canvas.height / DPR;
  // 保留区间底带
  ctx.save();
  ctx.beginPath(); ctx.rect(0, 0, vw, vh); ctx.clip();
  const [ax] = W2S(st.a, 0, vw, vh), [bx] = W2S(st.b, 0, vw, vh);
  const [oy] = W2S(0, 0, vw, vh);
  ctx.fillStyle = 'rgba(63,169,111,0.13)';
  ctx.fillRect(ax, 0, bx - ax, vh);
  ctx.restore();
  wline(st.a, f(st.a), st.a, -2.6, C.green, { width: 2 });
  wline(st.b, f(st.b), st.b, -2.6, C.green, { width: 2 });
  wdot(st.a, f(st.a), C.green, 4.5);
  wdot(st.b, f(st.b), C.green, 4.5);
  wtext('a', st.a, -2.8, C.green, { size: 12.5, bold: true });
  wtext('b', st.b, -2.8, C.green, { size: 12.5, bold: true });
  // 中点
  wline(st.m, f(st.m), st.m, -2.6, C.blue, { dash: [5, 4], width: 1.8 });
  wdot(st.m, f(st.m), C.blue, 4.5);
  wtext(`c=${st.m.toFixed(5)}`, st.m, f(st.m) + 0.5, C.blue, { size: 11.5, bold: true });
  wtext('f(x) = x³ − x − 2（零点约 1.5214）', 0.4, 3.4, palette.text, { size: 13.5, bold: true });
  // 步骤表（画在左上）
  ctx.save();
  ctx.font = '11.5px ui-monospace, monospace';
  ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  const tx = 14, ty = 64;
  const rows = [
    `n = ${st.n}`,
    `区间 [${st.a.toFixed(5)}, ${st.b.toFixed(5)}]`,
    `宽度 ${(st.b - st.a).toFixed(5)}`,
    `c = ${st.m.toFixed(5)}  f(c) = ${st.fm.toFixed(4)}`,
    `f(c)${st.fm > 0 ? '>' : '<'}0 → 保留${st.fm * st.fa <= 0 ? '[a,c]' : '[c,b]'}`,
    `误差 ≤ ${(st.b - st.a) / 2 ** st.n < 1e-4 ? '<0.0001' : ((st.b - st.a) / 2 ** st.n).toFixed(5)}`,
  ];
  ctx.fillStyle = palette.dim;
  rows.forEach((r, i) => ctx.fillText(r, tx, ty + i * 17));
  ctx.restore();
  hud.set('v1', `第 ${st.n} 次二分`);
  hud.set('v2', `近似根 c = ${st.m.toFixed(5)}`);
  hud.set('v3', st.b - st.a <= biState.tol ? '✓ 已达精度' : `|b−a| = ${(st.b - st.a).toFixed(4)}`);
}

/* ================= 章节 8：定积分（拓展） ================= */

const igState = { fn: 'x2', n: 12, method: 'mid', a: 0, b: 2 };

const INTEGRALS = {
  x2: { f: (x) => x * x, F: (x) => x * x * x / 3, label: 'x²', a: 0, b: 2 },
  sin: { f: Math.sin, F: (x) => -Math.cos(x), label: 'sin x', a: 0, b: Math.PI },
  cubic: { f: (x) => x * x * x - 3 * x, F: (x) => x ** 4 / 4 - 3 * x * x / 2, label: 'x³−3x', a: 0, b: 2 },
  exp: { f: Math.exp, F: Math.exp, label: 'eˣ', a: 0, b: 2 },
};

const secIntegral = {
  id: 'integral', title: '定积分（拓展）',
  html: `<p>求曲边梯形面积：把 [a, b] 切成 n 小段，每段用<b>矩形</b>近似（取左端点 / 中点 / 右端点的高），n → ∞ 时矩形面积之和的极限就是<span class="hl">定积分 ∫ₐᵇ f(x)dx</span>（黎曼和）。</p>
<p>拖动「n」从 4 到 200：矩形越细，和越贴近真实面积——这就是"以直代曲、无限逼近"。</p>
<p>读数对比黎曼和与牛顿—莱布尼茨公式 F(b) − F(a) 的精确值；x³−3x 这类会变号的函数还能看到"<b>负面积</b>"（x 轴下方计数为负）。</p>`,
  enter() {
    Object.assign(igState, { fn: 'x2', n: 12, method: 'mid' });
    const def = INTEGRALS[igState.fn];
    igState.a = def.a; igState.b = def.b;
    resetView(1, 1, Math.min(160, 340 / (def.b - def.a + 0.6)));
    chapterDrag = null;
    hud.show(true);
    ctl.clear();
    ctl.seg({
      options: Object.keys(INTEGRALS).map((k) => ({ label: INTEGRALS[k].label, value: k })),
      value: igState.fn,
      onChange: (v) => {
        igState.fn = v;
        const d = INTEGRALS[v];
        igState.a = d.a; igState.b = d.b;
        resetView((d.a + d.b) / 2, Math.max(0.6, (Math.max(0, d.F(d.b) - d.F(d.a))) * 0.35), Math.min(160, 340 / (d.b - d.a + 0.6)));
      },
    });
    ctl.sep();
    ctl.slider({ label: 'n 段数', min: 1, max: 200, step: 1, value: 12, fmt: (v) => String(v), onInput: (v) => { igState.n = v; } });
    ctl.seg({
      options: [{ label: '左端点', value: 'left' }, { label: '中点', value: 'mid' }, { label: '右端点', value: 'right' }],
      value: igState.method,
      onChange: (v) => { igState.method = v; },
    });
    chapterTick = () => drawIntegral();
    drawIntegral();
  },
};

function drawIntegral() {
  clearCanvas();
  drawGrid(canvas.width / DPR, canvas.height / DPR);
  const { f, F, label } = INTEGRALS[igState.fn];
  const { a, b, n, method } = igState;
  plotCurve(f, palette.accent);
  const vw = canvas.width / DPR, vh = canvas.height / DPR;
  const dx = (b - a) / n;
  let sum = 0;
  ctx.save();
  ctx.beginPath(); ctx.rect(0, 0, vw, vh); ctx.clip();
  for (let i = 0; i < n; i++) {
    const x0 = a + i * dx;
    const xs = method === 'left' ? x0 : method === 'right' ? x0 + dx : x0 + dx / 2;
    const y = f(xs);
    sum += y * dx;
    const [sx] = W2S(x0, 0, vw, vh);
    const [sw] = W2S(x0 + dx, 0, vw, vh);
    const [sy] = W2S(y, 0, vw, vh);
    const [oy] = W2S(0, 0, vw, vh);
    ctx.fillStyle = y >= 0 ? 'rgba(63,169,111,0.30)' : 'rgba(74,144,217,0.30)';
    ctx.strokeStyle = y >= 0 ? 'rgba(63,169,111,0.85)' : 'rgba(74,144,217,0.85)';
    ctx.lineWidth = 1;
    ctx.fillRect(sx, Math.min(sy, oy), sw - sx, Math.abs(sy - oy));
    ctx.strokeRect(sx, Math.min(sy, oy), sw - sx, Math.abs(sy - oy));
  }
  ctx.restore();
  const exact = F(b) - F(a);
  wline(a, -3, a, 4, palette.faint, { dash: [5, 4] });
  wline(b, -3, b, 4, palette.faint, { dash: [5, 4] });
  wtext('a', a, -3.2, palette.dim, { size: 13, bold: true });
  wtext('b', b, -3.2, palette.dim, { size: 13, bold: true });
  wtext(`∫₀ᵇ ${label} dx（黎曼和，n=${n}）`, (a + b) / 2, 4.4, palette.text, { size: 13.5, bold: true });
  hud.set('v1', `黎曼和 = ${sum.toFixed(5)}`);
  hud.set('v2', `精确值 = ${exact.toFixed(5)}`);
  hud.set('v3', `误差 ${Math.abs(sum - exact).toExponential(2)}`);
}

/* ================= 章节 9：随堂检测 ================= */

const QUIZ = [
  {
    q: '把 y = x² 的图像向左平移 2 个单位，得到的解析式是？',
    opts: ['y = (x+2)²', 'y = (x−2)²', 'y = x²+2', 'y = x²−2'],
    a: 0,
    ex: '左移 h=2 即 x−h=x−(−2)=x+2，得 y=(x+2)²。"左加右减"作用在括号内的 x 上。',
  },
  {
    q: 'y = 2ˣ 与 y = log₂x 的图像关系是？',
    opts: ['关于 y 轴对称', '关于 x 轴对称', '关于直线 y = x 对称', '关于原点对称'],
    a: 2,
    ex: '互为反函数的两个函数图像关于直线 y = x 对称——交换每点的 (x, y) 坐标即得镜像点。',
  },
  {
    q: 'y = 3sin(2x + π/3) 的最小正周期是？',
    opts: ['2π', 'π', 'π/3', '4π'],
    a: 1,
    ex: 'T = 2π/ω = 2π/2 = π。振幅 A 与初相 φ 不影响周期。',
  },
  {
    q: 'f′(x₀) 的几何意义是？',
    opts: ['曲线在 x₀ 处的纵坐标', '曲线在 x₀ 处切线的斜率', '割线的斜率', '曲线在 x₀ 处的极值'],
    a: 1,
    ex: '导数 = 切线斜率 = 割线斜率当 h→0 的极限。极值点对应 f′ 为 0，但 f′(x₀) 本身是斜率。',
  },
  {
    q: '用二分法求根，若初始区间宽度为 1，二分 10 次后误差上界约为？',
    opts: ['0.01', '0.001', '0.0001', '0.1'],
    a: 1,
    ex: '每次二分区间减半，误差上界 = 1/2¹⁰ = 1/1024 ≈ 0.00098，最接近 0.001。',
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
      <p style="color:var(--text-dim);margin:4px 0 18px">正确率 ${pct}%${pct >= 80 ? '，掌握得很扎实！' : pct >= 60 ? '，大部分概念已经清楚了，回顾一下错题。' : '，建议回到前面章节再看一遍哦。'}</p>`;
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
  activeCleanup = () => panel.remove();
}

/* ---------------- 启动 ---------------- */

const SECTIONS = [secTransform, secExpln, secUnit, secSine, secDeriv, secMono, secBisect, secIntegral, {
  id: 'quiz', title: '随堂检测',
  html: `<p>5 道核心概念题，检验本章掌握情况。答完可重新开始。</p>`,
  enter() {
    resetView(0, 0, 48);
    chapterDrag = null;
    hud.show(false);
    ctl.clear();
    clearCanvas();
    drawGrid(canvas.width / DPR, canvas.height / DPR);
    // 背景画一条装饰正弦
    plotCurve(Math.sin, palette.faint, { width: 1.4, dash: [6, 5] });
    showQuiz();
  },
}];

const sections = createSections({
  nav: document.getElementById('sideNav'),
  descPanel: document.getElementById('descPanel'),
  sections: SECTIONS,
  onSelect(i, sec) {
    if (activeCleanup) { activeCleanup(); activeCleanup = null; }
    chapterTick = null;
    sec.enter();
  },
});
window.__eduSections = sections;
sections.select(0);

/* 主循环 */
let lastTs = 0;
function appLoop(ts) {
  requestAnimationFrame(appLoop);
  const dt = Math.min((ts - lastTs) / 1000 || 0.016, 0.1);
  lastTs = ts;
  if (chapterTick) chapterTick(dt);
}
requestAnimationFrame(appLoop);
