/* EduLab · 化学分析实验台（analysis / AnalytLab）
 * 章节：认识滴定管与移液管 / 中和滴定 / 指示剂与滴定曲线 / 误差分析 / 阳离子检验 / 阴离子检验 / 焰色反应 / 鉴定未知盐 / 随堂检测
 * 实现：全 2D canvas 夜间实验室仿真（仪器矢量绘制），复用 edu-core 的章节/控制条/HUD/quiz。
 */
import {
  createSections, createControlsPanel, makeHUD, clamp,
} from './edu-core.js';

/* ---------------- 专属样式（动态注入，不改共享 CSS） ---------------- */

const styleEl = document.createElement('style');
styleEl.textContent = `
.lab-controls:empty{display:none}
`;
document.head.appendChild(styleEl);

/* ---------------- 画布与设计坐标 ---------------- */

const stage = document.getElementById('stage');
const canvas = document.createElement('canvas');
canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;touch-action:none;';
stage.appendChild(canvas);
const ctx = canvas.getContext('2d');
const DPR = Math.min(window.devicePixelRatio || 1, 2);
function resize() {
  canvas.width = Math.max(1, stage.clientWidth * DPR);
  canvas.height = Math.max(1, stage.clientHeight * DPR);
}
new ResizeObserver(resize).observe(stage);
resize();

const VW = 1280, VH = 760;
const vs = { s: 1, ox: 0, oy: 0 };
function fitView() {
  const w = canvas.width / DPR, h = canvas.height / DPR;
  vs.s = Math.min(w / VW, h / VH);
  vs.ox = (w - VW * vs.s) / 2;
  vs.oy = (h - VH * vs.s) / 2;
}
function beginDraw() {
  ctx.setTransform(DPR * vs.s, 0, 0, DPR * vs.s, DPR * vs.ox, DPR * vs.oy);
}
function toDesign(cx, cy) {
  const r = canvas.getBoundingClientRect();
  return [(cx - r.left - vs.ox) / vs.s, (cy - r.top - vs.oy) / vs.s];
}

/* ---------------- 绘图小工具 ---------------- */

const FONT = '-apple-system, "PingFang SC", "Microsoft YaHei", sans-serif';
function txt(s, x, y, o = {}) {
  ctx.font = (o.bold ? '600 ' : '') + (o.size || 14) + 'px ' + FONT;
  ctx.textAlign = o.align || 'center';
  ctx.textBaseline = o.base || 'middle';
  if (o.halo !== null) {
    ctx.lineWidth = o.haloW || 4;
    ctx.strokeStyle = o.halo || 'rgba(5,8,12,0.85)';
    ctx.strokeText(s, x, y);
  }
  ctx.fillStyle = o.color || '#dfe6ee';
  ctx.fillText(s, x, y);
}
function card(x, y, w, h, o = {}) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, o.r || 14);
  ctx.fillStyle = o.fill || 'rgba(15,21,30,0.90)';
  ctx.fill();
  ctx.strokeStyle = o.line || 'rgba(255,255,255,0.10)';
  ctx.lineWidth = 1;
  ctx.stroke();
}
function wrapText(s, x, y, maxW, lh, o = {}) {
  ctx.font = (o.bold ? '600 ' : '') + (o.size || 13) + 'px ' + FONT;
  const lines = [];
  s.split('\n').forEach((seg) => {
    let line = '';
    for (const ch of seg) {
      if (ctx.measureText(line + ch).width > maxW && line) { lines.push(line); line = ch; }
      else line += ch;
    }
    lines.push(line);
  });
  let yy = y;
  lines.forEach((ln) => {
    txt(ln, x, yy, Object.assign({ halo: o.halo }, o));
    yy += lh;
  });
  return yy;
}
function hexA(h, a) {
  const n = parseInt(h.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
function mixHex(h1, h2, k) {
  const a = parseInt(h1.slice(1), 16), b = parseInt(h2.slice(1), 16);
  const r = Math.round(((a >> 16) & 255) + (((b >> 16) & 255) - ((a >> 16) & 255)) * k);
  const g = Math.round(((a >> 8) & 255) + (((b >> 8) & 255) - ((a >> 8) & 255)) * k);
  const c = Math.round((a & 255) + ((b & 255) - (a & 255)) * k);
  return '#' + ((r << 16) | (g << 8) | c).toString(16).padStart(6, '0');
}
function pill(s, x, y, color = '#ffd98a') {
  ctx.font = '600 13px ' + FONT;
  const w = ctx.measureText(s).width + 30;
  card(x - w / 2, y - 15, w, 30, { r: 15, fill: 'rgba(12,17,24,0.92)', line: 'rgba(255,255,255,0.14)' });
  txt(s, x, y, { size: 13, bold: true, color });
}

/* ---------------- 场景背景 / 台面 ---------------- */

function drawLabBG() {
  fitView();
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  const w = canvas.width / DPR, h = canvas.height / DPR;
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#0d1218');
  g.addColorStop(1, '#06090e');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  beginDraw();
  // 地面与网格弱纹理
  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  ctx.lineWidth = 1;
  for (let x = 0; x < VW; x += 64) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, VH); ctx.stroke(); }
  for (let y = 0; y < VH; y += 64) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(VW, y); ctx.stroke(); }
}
function bench(line = 690) {
  ctx.fillStyle = 'rgba(255,255,255,0.035)';
  ctx.fillRect(0, line, VW, VH - line);
  ctx.strokeStyle = 'rgba(255,255,255,0.09)';
  ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(40, line); ctx.lineTo(VW - 40, line); ctx.stroke();
}
function backlight(x, y, w, h) {
  ctx.save();
  ctx.shadowColor = 'rgba(220,232,255,0.5)';
  ctx.shadowBlur = 40;
  ctx.fillStyle = 'rgba(210,223,238,0.85)';
  ctx.beginPath(); ctx.roundRect(x, y, w, h, 16); ctx.fill();
  ctx.restore();
  txt('背光板', x + w / 2, y + h + 14, { size: 11, color: '#8fa0b2', halo: null });
}

/* ---------------- 仪器绘制 ---------------- */

function drawStand(x, groundY, topY, clamps) {
  ctx.fillStyle = '#272d35';
  ctx.beginPath(); ctx.roundRect(x - 62, groundY - 8, 124, 16, 6); ctx.fill();
  ctx.fillStyle = '#39414c';
  ctx.beginPath(); ctx.roundRect(x - 62, groundY - 8, 124, 6, 3); ctx.fill();
  ctx.fillStyle = '#3d4551';
  ctx.beginPath(); ctx.roundRect(x - 4.5, topY, 9, groundY - topY - 6, 4); ctx.fill();
  ctx.fillStyle = '#4b5462';
  ctx.fillRect(x - 4.5, topY, 3, groundY - topY - 6);
  (clamps || []).forEach((c) => {
    ctx.strokeStyle = '#59636f';
    ctx.lineWidth = 7;
    ctx.beginPath(); ctx.moveTo(x, c.y); ctx.lineTo(c.x - 15, c.y); ctx.stroke();
    ctx.strokeStyle = '#737e8e';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(c.x - 14, c.y, 9, -0.6, 0.7); ctx.stroke();
  });
}

function drawBurette(x, top, o = {}) {
  const TL = o.len || 330, r = 9.5;
  const y0 = top, y1 = top + TL;
  ctx.fillStyle = 'rgba(178,198,222,0.10)';
  ctx.beginPath(); ctx.roundRect(x - r, y0, r * 2, TL, 5); ctx.fill();
  const lvl = o.level == null ? 0 : clamp(o.level, 0, 1);
  if (o.level != null && lvl < 1) {
    const ly = y0 + TL * lvl;
    ctx.save();
    ctx.beginPath(); ctx.roundRect(x - r + 1.5, ly, r * 2 - 3, Math.max(2, y1 - ly), 4); ctx.clip();
    ctx.fillStyle = o.liquid || 'rgba(150,200,255,0.25)';
    ctx.fillRect(x - r, ly, r * 2, y1 - ly);
    ctx.restore();
    ctx.strokeStyle = 'rgba(230,240,255,0.65)';
    ctx.lineWidth = 1.3;
    ctx.beginPath(); ctx.ellipse(x, ly, r - 2.5, 3, 0, 0, 7); ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(205,222,240,0.9)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(x - r, y0, r * 2, TL, 5); ctx.stroke();
  // 高光
  ctx.strokeStyle = 'rgba(255,255,255,0.22)';
  ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(x - r + 3, y0 + 10); ctx.lineTo(x - r + 3, y1 - 10); ctx.stroke();
  // 刻度（0 在上，向下增大）
  for (let m = 0; m <= 50; m++) {
    const y = y0 + TL * m / 50;
    const major = m % 5 === 0;
    ctx.strokeStyle = m === 0 ? '#ff8a7a' : 'rgba(222,233,245,0.75)';
    ctx.lineWidth = m === 0 ? 2 : 1;
    ctx.beginPath(); ctx.moveTo(x - r + 1, y); ctx.lineTo(x - r + 1 + (major ? 11 : 6), y); ctx.stroke();
    if (m % 10 === 0) txt(String(m), x - r - 9, y, { size: 10.5, align: 'right', color: 'rgba(198,213,228,0.9)', halo: null });
  }
  const cy = y1 + 12;
  if (o.style === 'base') {
    ctx.fillStyle = 'rgba(198,198,208,0.92)';
    ctx.beginPath(); ctx.roundRect(x - 5, y1, 10, 24, 4); ctx.fill();
    ctx.fillStyle = '#cdd2dc';
    ctx.beginPath(); ctx.arc(x, y1 + 12, 6.5, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(120,132,152,0.9)';
    ctx.lineWidth = 1.4;
    ctx.stroke();
  } else {
    ctx.fillStyle = 'rgba(206,216,236,0.95)';
    ctx.beginPath(); ctx.roundRect(x - 15, cy - 7, 30, 14, 6); ctx.fill();
    ctx.strokeStyle = 'rgba(116,130,156,0.95)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(222,232,246,0.95)';
    ctx.lineWidth = 3.5;
    ctx.beginPath(); ctx.moveTo(x, cy); ctx.lineTo(x + 14, cy - 8); ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(205,222,240,0.9)';
  ctx.lineWidth = 2;
  const ty = o.style === 'base' ? y1 + 24 : y1 + 22;
  ctx.beginPath();
  ctx.moveTo(x - 5, ty); ctx.lineTo(x - 1.8, ty + 22);
  ctx.moveTo(x + 5, ty); ctx.lineTo(x + 1.8, ty + 22);
  ctx.stroke();
  return { tipY: ty + 22, tipX: x, y0, y1 };
}

function flaskPath(x, baseY, s = 1) {
  const w = 60 * s, nh = 14 * s, H = 150 * s;
  const p = new Path2D();
  p.moveTo(x - w, baseY);
  p.lineTo(x - w, baseY - H * 0.60);
  p.quadraticCurveTo(x - w, baseY - H * 0.74, x - nh, baseY - H * 0.82);
  p.lineTo(x - nh, baseY - H);
  p.lineTo(x + nh, baseY - H);
  p.lineTo(x + nh, baseY - H * 0.82);
  p.quadraticCurveTo(x + w, baseY - H * 0.74, x + w, baseY - H * 0.60);
  p.lineTo(x + w, baseY);
  p.closePath();
  return p;
}
function drawFlask(x, baseY, o = {}) {
  const s = o.s || 1;
  const p = flaskPath(x, baseY, s);
  ctx.save();
  ctx.fillStyle = 'rgba(178,198,222,0.10)';
  ctx.fill(p);
  const lh = o.liquidH == null ? 62 * s : o.liquidH;
  const surfY = baseY - lh;
  ctx.save();
  ctx.clip(p);
  ctx.fillStyle = o.color || 'rgba(150,200,255,0.18)';
  ctx.fillRect(x - 62 * s, surfY, 124 * s, lh + 2);
  (o.plumes || []).forEach((pl) => {
    if (pl.a <= 0) return;
    const g = ctx.createRadialGradient(x + pl.dx, surfY + pl.dy, 1, x + pl.dx, surfY + pl.dy, pl.r);
    g.addColorStop(0, `rgba(243,106,158,${Math.min(0.75, pl.a)})`);
    g.addColorStop(1, 'rgba(243,106,158,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x + pl.dx, surfY + pl.dy, pl.r, 0, 7); ctx.fill();
  });
  ctx.strokeStyle = 'rgba(235,244,255,0.75)';
  ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.ellipse(x, surfY, 42 * s, 5 * s, 0, 0, 7); ctx.stroke();
  ctx.restore();
  ctx.strokeStyle = 'rgba(205,222,240,0.88)';
  ctx.lineWidth = 2.2;
  ctx.stroke(p);
  ctx.strokeStyle = 'rgba(255,255,255,0.20)';
  ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(x - 42 * s, baseY - 8 * s); ctx.lineTo(x - 44 * s, baseY - lh - 12 * s); ctx.stroke();
  ctx.restore();
}

function drawPipette(x, top, o = {}) {
  const len = o.len || 330;
  ctx.strokeStyle = 'rgba(205,222,240,0.9)';
  ctx.lineWidth = 2;
  ctx.fillStyle = 'rgba(178,198,222,0.10)';
  ctx.beginPath(); ctx.roundRect(x - 4, top, 8, len * 0.32, 4); ctx.fill();
  ctx.beginPath(); ctx.roundRect(x - 4, top, 8, len * 0.32, 4); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(x, top + len * 0.45, 21, 31, 0, 0, 7); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.roundRect(x - 4, top + len * 0.58, 8, len * 0.40, 4); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - 4, top + len * 0.58); ctx.lineTo(x - 1.6, top + len);
  ctx.moveTo(x + 4, top + len * 0.58); ctx.lineTo(x + 1.6, top + len);
  ctx.stroke();
  const my = top + len * 0.13;
  ctx.strokeStyle = '#ff8a7a';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x - 7, my); ctx.lineTo(x + 7, my); ctx.stroke();
  txt('20℃', x + 13, my, { size: 9.5, align: 'left', color: '#c98f86', halo: null });
}

function drawTube(x, yTop, o = {}) {
  const w = o.w || 30, len = o.len || 130;
  const yb = yTop + len;
  ctx.beginPath();
  ctx.moveTo(x - w / 2, yTop);
  ctx.lineTo(x - w / 2, yb - 12);
  ctx.arc(x, yb - 12, w / 2, Math.PI, 0, true);
  ctx.lineTo(x + w / 2, yTop);
  ctx.closePath();
  ctx.fillStyle = 'rgba(178,198,222,0.10)';
  ctx.fill();
  // 液体
  if (o.liquid) {
    const lh = (o.liquidH == null ? len * 0.62 : o.liquidH);
    ctx.save();
    ctx.clip();
    ctx.fillStyle = o.liquid;
    ctx.fillRect(x - w / 2, yb - lh, w, lh);
    ctx.restore();
  }
  // 沉淀
  if (o.ppt && o.ppt.k > 0) {
    const ph = 8 + 16 * o.ppt.k;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x - w / 2, yb - ph);
    ctx.lineTo(x - w / 2, yb - 12);
    ctx.arc(x, yb - 12, w / 2, Math.PI, 0, true);
    ctx.lineTo(x + w / 2, yb - ph);
    ctx.closePath();
    ctx.fillStyle = o.ppt.color;
    ctx.globalAlpha = 0.92;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();
  }
  // 气泡
  (o.bubbles || []).forEach((b) => {
    ctx.strokeStyle = 'rgba(235,245,255,0.8)';
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(x + b.dx, yb - b.y, b.r, 0, 7); ctx.stroke();
  });
  ctx.strokeStyle = 'rgba(205,222,240,0.88)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - w / 2, yTop);
  ctx.lineTo(x - w / 2, yb - 12);
  ctx.arc(x, yb - 12, w / 2, Math.PI, 0, true);
  ctx.lineTo(x + w / 2, yTop);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(230,240,252,0.8)';
  ctx.beginPath(); ctx.ellipse(x, yTop, w / 2, 3.5, 0, 0, 7); ctx.stroke();
}

function drawDropper(x, yTop, o = {}) {
  ctx.fillStyle = 'rgba(196,206,222,0.9)';
  ctx.beginPath(); ctx.ellipse(x, yTop, 11, 13, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = 'rgba(120,132,152,0.9)';
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.fillStyle = 'rgba(178,198,222,0.16)';
  ctx.beginPath(); ctx.roundRect(x - 3.5, yTop + 11, 7, o.len || 44, 3); ctx.fill();
  ctx.strokeStyle = 'rgba(205,222,240,0.9)';
  ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.roundRect(x - 3.5, yTop + 11, 7, o.len || 44, 3); ctx.stroke();
  const tipY = yTop + 11 + (o.len || 44);
  (o.drops || []).forEach((dy) => {
    ctx.fillStyle = o.dropColor || 'rgba(200,225,250,0.9)';
    ctx.beginPath(); ctx.ellipse(x, tipY + dy, 2.6, 4, 0, 0, 7); ctx.fill();
  });
  return tipY;
}

function drawEye(x, y, s = 1) {
  ctx.strokeStyle = '#dfe6ee';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 9 * s, y);
  ctx.quadraticCurveTo(x, y - 8 * s, x + 9 * s, y);
  ctx.quadraticCurveTo(x, y + 8 * s, x - 9 * s, y);
  ctx.stroke();
  ctx.fillStyle = '#dfe6ee';
  ctx.beginPath(); ctx.arc(x, y, 3 * s, 0, 7); ctx.fill();
}

function drawFlame(x, baseY, t, o = {}) {
  const col = o.color || '#3f7fd9';
  const H = (o.h || 85) * (1 + 0.05 * Math.sin(t * 7.3) + 0.03 * Math.sin(t * 13.1));
  const W = (o.w || 30) * (1 + 0.05 * Math.sin(t * 9.7 + 1));
  const g = ctx.createRadialGradient(x, baseY - H * 0.45, 2, x, baseY - H * 0.45, H * 0.8);
  g.addColorStop(0, hexA(col, 0.9));
  g.addColorStop(0.55, hexA(col, 0.45));
  g.addColorStop(1, hexA(col, 0));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(x - W, baseY);
  ctx.quadraticCurveTo(x - W * 0.9, baseY - H * 0.55, x, baseY - H);
  ctx.quadraticCurveTo(x + W * 0.9, baseY - H * 0.55, x + W, baseY);
  ctx.closePath(); ctx.fill();
  const g2 = ctx.createRadialGradient(x, baseY - H * 0.25, 1, x, baseY - H * 0.25, W * 0.85);
  g2.addColorStop(0, 'rgba(255,255,242,0.95)');
  g2.addColorStop(1, hexA(col, 0.06));
  ctx.fillStyle = g2;
  ctx.beginPath(); ctx.ellipse(x, baseY - H * 0.28, W * 0.42, H * 0.34, 0, 0, 7); ctx.fill();
  if (o.root !== false) {
    ctx.fillStyle = 'rgba(84,144,255,0.5)';
    ctx.beginPath(); ctx.ellipse(x, baseY - 4, W * 0.5, 7, 0, 0, 7); ctx.fill();
  }
}

function drawBurner(x, baseY) {
  ctx.fillStyle = '#3a424e';
  ctx.beginPath(); ctx.roundRect(x - 34, baseY - 6, 68, 12, 5); ctx.fill();
  ctx.fillStyle = '#4c5563';
  ctx.beginPath(); ctx.roundRect(x - 7, baseY - 66, 14, 60, 4); ctx.fill();
  ctx.fillStyle = '#39414c';
  ctx.beginPath(); ctx.roundRect(x - 12, baseY - 74, 24, 10, 4); ctx.fill();
}

function drawBottle(x, y, o = {}) {
  const w = o.w || 34, h = o.h || 44;
  ctx.fillStyle = o.sel ? 'rgba(232,103,74,0.25)' : 'rgba(178,198,222,0.12)';
  ctx.strokeStyle = o.sel ? '#e8674a' : 'rgba(205,222,240,0.8)';
  ctx.lineWidth = o.sel ? 2.4 : 1.8;
  ctx.beginPath(); ctx.roundRect(x - w / 2, y - h, w, h, 7); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(198,208,222,0.9)';
  ctx.beginPath(); ctx.roundRect(x - 8, y - h - 8, 16, 9, 3); ctx.fill();
  if (o.fill) {
    ctx.save();
    ctx.beginPath(); ctx.roundRect(x - w / 2 + 2, y - h + 2, w - 4, h - 4, 6); ctx.clip();
    ctx.fillStyle = o.fill;
    ctx.fillRect(x - w / 2, y - h * (o.fillH || 0.55), w, h);
    ctx.restore();
  }
  if (o.label) txt(o.label, x, y + 14, { size: 11.5, color: o.sel ? '#ffb59f' : '#9fb0c2', halo: null });
}

function cobaltOverlay(on) {
  if (!on) return;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  const w = canvas.width / DPR, h = canvas.height / DPR;
  ctx.fillStyle = 'rgba(34,64,205,0.17)';
  ctx.fillRect(0, 0, w, h);
  ctx.setTransform(DPR * vs.s, 0, 0, DPR * vs.s, DPR * vs.ox, DPR * vs.oy);
  ctx.strokeStyle = 'rgba(80,120,240,0.85)';
  ctx.lineWidth = 5;
  ctx.beginPath(); ctx.roundRect(14, 14, VW - 28, VH - 28, 26); ctx.stroke();
  txt('蓝色钴玻璃', VW / 2, VH - 40, { size: 13, bold: true, color: '#9db8ff' });
}

/* ---------------- 章节框架 ---------------- */

const ctl = createControlsPanel(document.getElementById('controls'));
let chapterTick = null;
let activeCleanup = null;
let hits = [];
const hudBox = document.createElement('div');
hudBox.className = 'lab-hud';
stage.appendChild(hudBox);
let hud = null;
function setHud(rows) {
  hudBox.innerHTML = '';
  hud = null;
  if (rows) hud = makeHUD(hudBox, rows);
  return hud;
}
let downPos = null;
canvas.addEventListener('pointerdown', (e) => { downPos = [e.clientX, e.clientY]; });
canvas.addEventListener('pointerup', (e) => {
  if (!downPos) return;
  const dx = e.clientX - downPos[0], dy = e.clientY - downPos[1];
  downPos = null;
  if (dx * dx + dy * dy > 36) return;
  const [x, y] = toDesign(e.clientX, e.clientY);
  for (let i = hits.length - 1; i >= 0; i--) {
    const hh = hits[i];
    if (x >= hh.x && x <= hh.x + hh.w && y >= hh.y && y <= hh.y + hh.h) { hh.cb(); return; }
  }
});
canvas.addEventListener('pointermove', (e) => {
  const [x, y] = toDesign(e.clientX, e.clientY);
  canvas.style.cursor = hits.some((hh) => x >= hh.x && x <= hh.x + hh.w && y >= hh.y && y <= hh.y + hh.h) ? 'pointer' : 'default';
});

/* ================= 章节 1：认识滴定管与移液管 ================= */

const P1 = { part: null, view: 'level', showAll: false };
const PARTS = {
  zero: { name: '零刻度线', text: '滴定管的量程起点「0」刻度在最上方，刻度值自上而下增大（与量筒相反）。读数 = 终读数 − 初读数，从上往下读。' },
  scale: { name: '刻度', text: '常用滴定管总容量 50 mL，最小分度 0.1 mL，读数时须估读到 0.01 mL（如 12.34 mL）。' },
  stopcock: { name: '活塞（酸式滴定管）', text: '磨口玻璃活塞，旋转控制液滴。酸式滴定管盛酸性、中性或氧化性溶液；碱性溶液会腐蚀玻璃使活塞粘连，须改用碱式滴定管。' },
  bead: { name: '玻璃珠（碱式滴定管）', text: '碱式滴定管下端是橡胶管内嵌玻璃珠：用拇指与食指轻轻捏挤玻璃珠侧面，使胶管与玻璃珠间产生缝隙即可放液。用于盛碱性溶液（如 NaOH 标准液）。' },
  tip: { name: '尖嘴', text: '出口细管，控制液滴大小：约 20 滴/mL，即 1 滴 ≈ 0.05 mL，半滴 ≈ 0.025 mL——终点前正是靠「半滴」控制精度。' },
  pipette: { name: '移液管（单标线）', text: '中部有球泡的单标线移液管只能量取一个固定体积（如 20.00 mL），准确度高于量筒。使用前用待移取液润洗 2~3 次；放液时管尖靠壁、停留约 15 s，残留于尖嘴的少量液体属设计量取部分，不要吹出。' },
};
function p1PartHotspots() {
  return [
    { id: 'zero', x: 228, y: 96, w: 64, h: 22 },
    { id: 'scale', x: 228, y: 200, w: 64, h: 110 },
    { id: 'stopcock', x: 224, y: 446, w: 74, h: 28 },
    { id: 'tip', x: 244, y: 456, w: 34, h: 34 },
    { id: 'bead', x: 404, y: 428, w: 52, h: 30 },
    { id: 'pipette', x: 552, y: 250, w: 66, h: 170 },
  ];
}
const secTools = {
  id: 'tools', title: '认识滴定管与移液管',
  html: `<p>滴定分析的三件量器。左侧是<b>酸式滴定管</b>（玻璃活塞），中间是<b>碱式滴定管</b>（橡胶管+玻璃珠），右侧是 <b>20 mL 单标线移液管</b>。</p>
<p><b>点击部件</b>查看名称与用途（活塞 / 刻度 / 尖嘴 / 零刻度线）。注意滴定管刻度<b>自上而下增大</b>，读数须估读到 0.01 mL。</p>
<p>右侧下方是<b>读数误差演示</b>：切换「平视 / 俯视 / 仰视」，看视线落点如何让读数偏小或偏大——滴定管 0 在上，所以<b>仰视读数偏大、俯视读数偏小</b>（量筒正好相反）。</p>`,
  enter() {
    P1.part = null; P1.view = 'level'; P1.showAll = false;
    setHud([['part', '当前部件'], ['view', '读数视角'], ['verdict', '结论']]);
    ctl.clear();
    ctl.seg({
      options: [{ label: '平视', value: 'level' }, { label: '俯视', value: 'down' }, { label: '仰视', value: 'up' }],
      value: 'level',
      onChange: (v) => { P1.view = v; },
    });
    ctl.sep();
    ctl.button({ label: '显示全部标注', onClick(b) { P1.showAll = !P1.showAll; b.classList.toggle('active', P1.showAll); } });
    ctl.button({ label: '重置选择', onClick() { P1.part = null; P1.showAll = false; ctl.el.querySelectorAll('.ctl-btn')[1].classList.remove('active'); } });
    hits = p1PartHotspots().map((h) => ({
      x: h.x, y: h.y, w: h.w, h: h.h,
      cb: () => { P1.part = h.id; if (hud) hud.set('part', PARTS[h.id].name); },
    }));
    chapterTick = () => drawTools();
    drawTools();
  },
};
function drawTools() {
  drawLabBG();
  bench();
  drawStand(180, 700, 120, [{ y: 150, x: 260 }]);
  // 酸式滴定管
  const hot = {};
  p1PartHotspots().forEach((h) => { hot[h.id] = h; });
  const glow = (id, x, y, w, h) => {
    if (P1.part !== id && !(P1.showAll)) return;
    ctx.save();
    ctx.strokeStyle = P1.part === id ? '#ffb14e' : 'rgba(255,177,78,0.55)';
    ctx.lineWidth = P1.part === id ? 2.5 : 1.4;
    ctx.setLineDash([5, 4]);
    ctx.strokeRect(x, y, w, h);
    ctx.restore();
  };
  drawBurette(260, 110, { style: 'acid' });
  drawBurette(430, 140, { len: 290, style: 'base' });
  drawPipette(585, 150, { len: 330 });
  glow('zero', 236, 102, 50, 18);
  glow('scale', 240, 210, 42, 90);
  glow('stopcock', 236, 452, 50, 18);
  glow('tip', 250, 464, 20, 18);
  glow('bead', 420, 434, 20, 16);
  glow('pipette', 566, 260, 40, 150);
  txt('酸式滴定管', 260, 540, { size: 13, bold: true, color: '#c6d2df' });
  txt('碱式滴定管', 430, 540, { size: 13, bold: true, color: '#c6d2df' });
  txt('单标线移液管（20 mL）', 585, 540, { size: 13, bold: true, color: '#c6d2df' });
  // 全部标注
  if (P1.showAll) {
    const mark = (id, lx, ly, tx, ty, name) => {
      ctx.strokeStyle = 'rgba(255,177,78,0.7)';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(tx, ty); ctx.stroke();
      ctx.setLineDash([]);
      txt(name, tx, ty - 9, { size: 11.5, color: '#ffcf96' });
    };
    mark('zero', 262, 110, 330, 78, '零刻度线');
    mark('scale', 250, 250, 330, 230, '刻度（分度 0.1 mL）');
    mark('stopcock', 276, 459, 336, 500, '玻璃活塞');
    mark('tip', 262, 484, 336, 560, '尖嘴');
    mark('bead', 430, 444, 500, 560, '玻璃珠');
    mark('pipette', 606, 300, 668, 250, '球泡');
  }
  // 部件信息卡
  card(700, 88, 540, 250);
  const p = P1.part ? PARTS[P1.part] : null;
  txt(p ? p.name : '部件名称', 724, 122, { size: 17, bold: true, align: 'left', color: p ? '#ffcf96' : '#8a99a8', halo: null });
  ctx.strokeStyle = 'rgba(255,255,255,0.10)';
  ctx.beginPath(); ctx.moveTo(724, 142); ctx.lineTo(1216, 142); ctx.stroke();
  if (p) wrapText(p.text, 724, 170, 492, 24, { size: 13.5, color: '#d5dfe9', align: 'left', halo: null });
  else wrapText('点击左侧仪器的部件（活塞 / 刻度 / 尖嘴 / 零刻度线 / 玻璃珠 / 移液管），这里显示名称与用途。', 724, 170, 492, 24, { size: 13.5, color: '#93a3b3', align: 'left', halo: null });
  // 读数误差演示卡
  card(700, 360, 540, 330);
  txt('读数误差演示（滴定管：0 在上，刻度自上而下增大）', 970, 386, { size: 13, bold: true, color: '#c6d2df', halo: null });
  const zx = 800, top = 420, bot = 640;
  const actual = 12.00, span = 1.2;
  const Y = (v) => top + (bot - top) * ((actual + span / 2 - v) / span);
  ctx.strokeStyle = 'rgba(210,225,240,0.85)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(zx - 30, top); ctx.lineTo(zx - 30, bot); ctx.stroke();
  for (let k = 0; k <= 24; k++) {
    const v = actual - span / 2 + k * span / 24;
    const yy = Y(v);
    const isInt = Math.abs(v - Math.round(v)) < 1e-9;
    ctx.strokeStyle = isInt ? 'rgba(235,244,252,0.9)' : 'rgba(200,215,230,0.4)';
    ctx.lineWidth = isInt ? 1.6 : 1;
    ctx.beginPath(); ctx.moveTo(zx - 30, yy); ctx.lineTo(zx - 30 + (isInt ? 22 : 12), yy); ctx.stroke();
    if (isInt) txt(v.toFixed(0), zx - 40, yy, { size: 11, align: 'right', color: '#aebfcd', halo: null });
  }
  ctx.strokeStyle = 'rgba(210,225,240,0.5)';
  ctx.beginPath(); ctx.moveTo(zx + 30, top); ctx.lineTo(zx + 30, bot); ctx.stroke();
  // 实际液面
  const my = Y(actual);
  ctx.fillStyle = 'rgba(150,200,255,0.22)';
  ctx.fillRect(zx - 29, my, 58, bot - my);
  ctx.strokeStyle = '#cfe2f5';
  ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.arc(zx, my, 27, 0, Math.PI, false); ctx.stroke();
  txt('实际液面 12.00', zx - 44, my, { size: 11, align: 'right', color: '#bcd6ee', halo: null });
  // 视线
  const off = P1.view === 'level' ? 0 : (P1.view === 'down' ? -0.40 : 0.40);
  const py = Y(actual + off);
  const ey = P1.view === 'level' ? my : (P1.view === 'down' ? my - 130 : my + 130);
  ctx.save();
  ctx.setLineDash([6, 5]);
  ctx.strokeStyle = '#e8674a';
  ctx.lineWidth = 1.8;
  ctx.beginPath(); ctx.moveTo(zx - 90, ey); ctx.lineTo(py + 8, py); ctx.stroke();
  ctx.restore();
  ctx.fillStyle = '#e8674a';
  ctx.beginPath(); ctx.moveTo(py + 8, py); ctx.lineTo(py + 18, py - 5); ctx.lineTo(py + 18, py + 5); ctx.closePath(); ctx.fill();
  txt('视线落点 ' + (actual + off).toFixed(2), py + 26, py, { size: 11.5, bold: true, color: '#ffb59f', align: 'left' });
  drawEye(zx - 104, ey, 1.05);
  const vName = { level: '平视', down: '俯视', up: '仰视' }[P1.view];
  txt(vName, zx - 104, ey + 16, { size: 11.5, color: '#9fb0c2' });
  const verdicts = {
    level: '视线与凹液面最低处水平相切——读数 12.00 mL，正确 ✓',
    down: '视线斜向下：刻度交点在液面上方 → 读数 11.60 mL，偏小',
    up: '视线斜向上：刻度交点在液面下方 → 读数 12.40 mL，偏大',
  };
  wrapText(verdicts[P1.view], 900, 480, 320, 22, { size: 13, bold: true, color: '#ffe1b8', align: 'left', halo: null });
  wrapText('滴定管口诀：仰视偏大、俯视偏小。\n（量筒 0 在下，结论相反：仰视偏小、俯视偏大）', 900, 546, 320, 21, { size: 12, color: '#9fb0c2', align: 'left', halo: null });
  if (hud) {
    hud.set('part', p ? p.name : '—');
    hud.set('view', vName);
    hud.set('verdict', P1.view === 'level' ? '读数正确' : P1.view === 'down' ? '读数偏小' : '读数偏大');
  }
}

/* ================= 章节 2：中和滴定（核心交互） ================= */

const TIP_Y = 476, SURF_Y = 578, FLASK_X = 280;
const tit = {
  run: 1, cA: 0.0984, init: [0.02, null], final: [null, null], V: [null, null], c: [null, null],
  vAdd: 0, phase: 'ready', stopcock: 0, acc: 0, stream: false, hang: false, wash: 0,
  plumes: [], drops: [], swirl: 0, swirlPhase: 0, obsT: 0, msg: '',
};
const round2 = (v) => Math.round(v * 100) / 100;
const round4 = (v) => Math.round(v * 10000) / 10000;
function randInit() { return Math.floor(Math.random() * 6) / 100; }
tit.cA = round4(0.096 + Math.random() * 0.008);
function phAtTit(v) {
  const nA = tit.cA * 20.00, nB = 0.1000 * v, Vt = 20.00 + v;
  if (nA - nB > 1e-9) return -Math.log10((nA - nB) / Vt);
  if (nB - nA > 1e-9) return 14 + Math.log10((nB - nA) / Vt);
  return 7.00;
}
function liqColor(ph) {
  if (ph < 8.2) return 'rgba(150,200,255,0.16)';
  const k = ph >= 10 ? 1 : (ph - 8.2) / 1.8;
  return `rgba(238,72,128,${(0.18 + 0.40 * k).toFixed(3)})`;
}
function mkPlume(k = 1) {
  return { dx: Math.random() * 40 - 20, dy: 8 + Math.random() * 42, r: 5 + Math.random() * 4, a: 0.55 * k + 0.15 };
}
tit.ve = () => tit.cA * 20.00 / 0.1000;
function checkObs() {
  if (tit.phase === 'ready') tit.phase = 'run';
  if (tit.phase === 'run' && phAtTit(tit.vAdd) >= 8.2) {
    tit.phase = 'observe';
    tit.obsT = 30;
    tit.msg = '溶液变浅粉——摇匀后静置观察 30 s：不褪色即为终点';
  }
}
function titEndpoint() {
  const i = tit.run - 1;
  const noise = Math.random() * 0.03 - 0.015;
  const fin = round2(tit.init[i] + tit.vAdd + noise);
  tit.final[i] = fin;
  tit.V[i] = round2(fin - tit.init[i]);
  tit.c[i] = 0.1000 * tit.V[i] / 20.00;
  tit.phase = 'done';
  tit.stream = false;
  const over = tit.vAdd > tit.ve() + 0.6;
  tit.msg = tit.run === 1
    ? `第 1 次终点：V(NaOH)=${tit.V[0].toFixed(2)} mL，c(HCl)=${tit.c[0].toFixed(4)} mol/L —— 点「重新滴定」做平行测定`
    : `第 2 次终点：V(NaOH)=${tit.V[1].toFixed(2)} mL —— 记录本已给出平均值与相对偏差`;
  if (over) tit.msg += '（颜色过深，终点已过，结果偏大）';
}
function titReset(user) {
  const t = tit;
  const sync = () => {
    const inp = ctl.el.querySelector('input[type=range]');
    if (inp) { inp.value = 0; inp.dispatchEvent(new Event('input')); }
  };
  if (user && t.run === 1 && t.final[0] != null && t.final[1] == null) {
    t.run = 2; t.vAdd = 0; t.acc = 0; t.drops = []; t.plumes = [];
    t.hang = false; t.stream = false; t.phase = 'ready';
    t.init[1] = randInit();
    sync();
    t.msg = '第 2 次平行测定：重新移取 20.00 mL 待测液，初读数已记录';
  } else {
    if (user && t.final[1] != null) t.cA = round4(0.096 + Math.random() * 0.008);
    t.run = 1; t.vAdd = 0; t.acc = 0; t.drops = []; t.plumes = [];
    t.hang = false; t.stream = false; t.phase = 'ready';
    t.init = [randInit(), null]; t.final = [null, null]; t.V = [null, null]; t.c = [null, null];
    sync();
    t.msg = '推动「活塞开度」开始滴定（初读数已自动记录）';
  }
  if (hud) hud.set('run', '第 ' + t.run + ' 次');
}
function drawZoomCard(x, y, w, h, reading) {
  card(x, y, w, h);
  txt('平视读数窗（估读至 0.01 mL）', x + w / 2, y + 22, { size: 12.5, bold: true, color: '#9fb0c2', halo: null });
  const cx = x + w / 2, top = y + 44, bot = y + h - 42;
  const span = 0.7;
  const Y = (v) => top + (bot - top) * ((reading + span / 2 - v) / span);
  ctx.strokeStyle = 'rgba(210,225,240,0.85)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(cx - 56, top); ctx.lineTo(cx - 56, bot); ctx.stroke();
  for (let k = 0; k <= 14; k++) {
    const v = reading - span / 2 + k * span / 14;
    const yy = Y(v);
    const isTens = Math.abs(v - Math.round(v * 10) / 10) < 1e-9;
    ctx.strokeStyle = isTens ? 'rgba(235,244,252,0.9)' : 'rgba(200,215,230,0.4)';
    ctx.lineWidth = isTens ? 1.5 : 1;
    ctx.beginPath(); ctx.moveTo(cx - 56, yy); ctx.lineTo(cx - 56 + (isTens ? 20 : 11), yy); ctx.stroke();
    if (isTens) txt(v.toFixed(1), cx - 64, yy, { size: 10, align: 'right', color: '#aebfcd', halo: null });
  }
  ctx.strokeStyle = 'rgba(210,225,240,0.5)';
  ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(cx + 56, top); ctx.lineTo(cx + 56, bot); ctx.stroke();
  const my = Y(reading);
  ctx.fillStyle = 'rgba(150,200,255,0.25)';
  ctx.fillRect(cx - 54, my, 108, bot - my);
  ctx.strokeStyle = '#cfe2f5';
  ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.arc(cx, my, 44, 0, Math.PI, false); ctx.stroke();
  ctx.save();
  ctx.setLineDash([5, 4]);
  ctx.strokeStyle = '#e8674a';
  ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(cx + 96, my); ctx.lineTo(cx + 60, my); ctx.stroke();
  ctx.restore();
  drawEye(cx + 108, my, 0.9);
  txt('平视', cx + 108, my + 15, { size: 10.5, color: '#9fb0c2' });
  txt(`读数 ${reading.toFixed(2)} mL`, cx, y + h - 16, { size: 13.5, bold: true, color: '#ffe9b0' });
}
function drawRecord(x, y, w, h) {
  card(x, y, w, h, { fill: 'rgba(13,19,27,0.93)' });
  txt('实验记录本', x + 24, y + 32, { size: 17, bold: true, align: 'left', color: '#e8eef6' });
  txt('c(NaOH) = 0.1000 mol/L    V(HCl) = 20.00 mL    指示剂：酚酞', x + 24, y + 58, { size: 12, align: 'left', color: '#9fb0c2', halo: null });
  ctx.strokeStyle = 'rgba(255,255,255,0.10)';
  ctx.beginPath(); ctx.moveTo(x + 20, y + 76); ctx.lineTo(x + w - 20, y + 76); ctx.stroke();
  const c1 = x + w - 250, c2 = x + w - 110;
  txt(tit.run === 1 && tit.final[0] == null ? '第 1 次（进行中）' : '第 1 次', c1, y + 98, { size: 12, color: tit.run === 1 ? '#ffcf96' : '#9fb0c2', halo: null });
  txt(tit.run === 2 ? '第 2 次（进行中）' : '第 2 次', c2, y + 98, { size: 12, color: tit.run === 2 ? '#ffcf96' : '#9fb0c2', halo: null });
  const f2 = (v) => (v == null ? '—' : v.toFixed(2));
  const f4 = (v) => (v == null ? '—' : v.toFixed(4));
  const rows = [
    ['初读数 /mL', f2(tit.init[0]), f2(tit.init[1])],
    ['终读数 /mL', f2(tit.final[0]), f2(tit.final[1])],
    ['V(NaOH) /mL', f2(tit.V[0]), f2(tit.V[1])],
    ['c(HCl) /(mol/L)', f4(tit.c[0]), f4(tit.c[1])],
  ];
  rows.forEach((r, i) => {
    const yy = y + 130 + i * 34;
    txt(r[0], x + 24, yy, { size: 13.5, align: 'left', color: '#c6d2df', halo: null });
    txt(r[1], c1, yy, { size: 14, bold: true, color: '#ffffff', halo: null });
    txt(r[2], c2, yy, { size: 14, bold: true, color: '#ffffff', halo: null });
  });
  const dy = y + 282;
  ctx.strokeStyle = 'rgba(255,255,255,0.10)';
  ctx.beginPath(); ctx.moveTo(x + 20, dy); ctx.lineTo(x + w - 20, dy); ctx.stroke();
  if (tit.final[0] != null && tit.final[1] != null) {
    const vAvg = (tit.V[0] + tit.V[1]) / 2;
    const dev = Math.abs(tit.V[0] - tit.V[1]) / vAvg * 100;
    const cAvg = 0.1000 * vAvg / 20.00;
    txt(`V 平均 = ${vAvg.toFixed(2)} mL      c(HCl) 平均 = ${cAvg.toFixed(4)} mol/L`, x + 24, dy + 30, { size: 14, bold: true, align: 'left', color: '#ffe9b0', halo: null });
    txt(`相对偏差 = |V₁−V₂| / V̄ × 100% = ${dev.toFixed(2)} %  ${dev <= 0.2 ? '≤ 0.2%，合格 ✓' : '> 0.2%，超差——应重新滴定'}`, x + 24, dy + 62, { size: 13.5, align: 'left', color: dev <= 0.2 ? '#7fd6a4' : '#ff9d8f', halo: null });
  } else {
    wrapText('完成两次平行测定后，本栏给出 V 平均值、c(HCl) 平均值与相对偏差（要求 ≤ 0.2%）。', x + 24, dy + 34, 470, 22, { size: 12.5, color: '#93a3b3', align: 'left', halo: null });
  }
  txt('读数估读至 0.01 mL；1 滴 ≈ 0.05 mL，半滴 ≈ 0.025 mL', x + 24, y + h - 20, { size: 11.5, align: 'left', color: '#8a99a8', halo: null });
}
const secTitr = {
  id: 'titr', title: '中和滴定：测定盐酸的浓度',
  html: `<p>锥形瓶里是 <b>20.00 mL 待测盐酸</b> + 2 滴酚酞（无色）；碱式滴定管里是 <b>0.1000 mol/L NaOH 标准液</b>。</p>
<p><b>操作</b>：① 推动「活塞开度」控制滴速（先快后慢）；② 出现<b>局部粉色</b>时点「摇瓶」摇匀——不摇匀会误判终点；③ 接近终点时关活塞，用「半滴」（悬而不落）+「洗瓶冲下」控制到半滴；④ 瓶内变<b>浅粉且 30 s 不褪</b>即达终点，读数自动记入<b>实验记录本</b>。</p>
<p><span class="hl">c(HCl) = c(NaOH)·V(NaOH) / V(HCl)</span>。终点后点「重新滴定」做<b>两次平行测定</b>，相对偏差 ≤ 0.2% 才合格。</p>`,
  enter() {
    setHud([['run', '测定'], ['v', 'V(NaOH) 加入'], ['ph', 'pH'], ['st', '状态']]);
    ctl.clear();
    ctl.slider({
      label: '活塞开度', min: 0, max: 100, step: 1, value: 0,
      fmt: (v) => v + '%',
      onInput: (v) => {
        const t = tit;
        t.stopcock = v / 100;
        if (v > 0) {
          if (t.hang) { t.hang = false; t.vAdd += 0.025; t.plumes.push(mkPlume(0.7)); checkObs(); }
          if (t.phase === 'ready') { t.phase = 'run'; t.msg = '滴定开始——初读数已自动记录'; }
          if (t.phase === 'observe') { t.phase = 'run'; t.msg = '继续滴加（此前粉色未到终点或继续加深）'; }
        } else {
          t.msg = '活塞已关。接近终点时可用「半滴」+「洗瓶冲下」';
        }
      },
    });
    ctl.sep();
    ctl.button({
      label: '半滴（悬而不落）',
      onClick: () => {
        const t = tit;
        if (t.phase === 'done') { t.msg = '本次已到终点，请点「重新滴定」'; return; }
        if (t.stopcock > 0) { t.msg = '请先把活塞开度调到 0，再悬半滴'; return; }
        if (t.phase === 'ready') { t.phase = 'run'; t.msg = '滴定开始——初读数已自动记录'; }
        t.hang = true;
        t.msg = '半滴已悬于尖嘴（未落下）——点「洗瓶冲下」把它冲入锥形瓶';
      },
    });
    ctl.button({
      label: '洗瓶冲下',
      onClick: () => {
        const t = tit;
        if (!t.hang) { t.msg = '尖嘴没有悬滴：先点「半滴」让半滴悬住'; return; }
        t.hang = false; t.wash = 0.9;
        t.vAdd += 0.025; t.plumes.push(mkPlume(0.6));
        checkObs();
        t.msg = '半滴已用洗瓶（蒸馏水）冲入锥形瓶（+0.025 mL）';
      },
    });
    ctl.button({
      label: '摇瓶',
      onClick: () => {
        if (tit.phase === 'ready') { tit.msg = '尚未开始滴定'; return; }
        tit.swirl = 1.4; tit.swirlPhase = 0;
      },
    });
    ctl.button({ label: '↺ 重新滴定', onClick: () => titReset(true) });
    titReset(false);
    chapterTick = (dt) => titTick(dt);
    drawTit();
  },
};
function titTick(dt) {
  const t = tit;
  if (t.phase === 'run' || t.phase === 'observe') {
    if (!t.hang && t.stopcock > 0) {
      if (t.stopcock >= 0.92) {
        t.stream = true;
        const dv = 1.25 * dt;
        t.vAdd += dv; t.acc += dv;
        while (t.acc >= 0.05) { t.acc -= 0.05; t.plumes.push(mkPlume(0.8)); }
        checkObs();
      } else {
        t.stream = false;
        const rate = t.stopcock <= 0.12 ? 1 + t.stopcock * 5 : 2 + (t.stopcock - 0.12) * 14;
        t.acc += rate * dt;
        while (t.acc >= 1) {
          t.acc -= 1;
          t.drops.push({ y: TIP_Y, jit: Math.random() * 4 - 2 });
        }
      }
    } else t.stream = false;
    for (let i = t.drops.length - 1; i >= 0; i--) {
      const d = t.drops[i];
      d.y += 520 * dt;
      if (d.y >= SURF_Y) {
        t.drops.splice(i, 1);
        t.vAdd += 0.05;
        t.plumes.push(mkPlume());
        checkObs();
      }
    }
    for (let i = t.plumes.length - 1; i >= 0; i--) {
      const p = t.plumes[i];
      p.r += (t.swirl > 0 ? 110 : 16) * dt;
      p.a -= (t.swirl > 0 ? 1.5 : 0.085) * dt;
      if (p.a <= 0) t.plumes.splice(i, 1);
    }
    if (t.swirl > 0) { t.swirl -= dt; t.swirlPhase += dt; }
    if (t.wash > 0) t.wash -= dt;
    if (t.phase === 'observe') {
      t.obsT -= dt * 6;
      if (t.obsT <= 0) titEndpoint();
    }
    if (t.phase === 'run') {
      const ph = phAtTit(t.vAdd);
      if (ph < 8.2 && t.vAdd > t.ve() - 1) t.msg = '接近终点！放慢滴速（低开度），改用逐滴 / 半滴加入';
      else if (t.plumes.length >= 5 && t.swirl <= 0 && ph < 8.2) t.msg = '瓶内局部粉色未摇匀——点「摇瓶」摇匀后再观察';
    }
  }
  if (hud) {
    hud.set('run', '第 ' + t.run + ' / 2 次');
    hud.set('v', t.vAdd.toFixed(2) + ' mL');
    hud.set('ph', phAtTit(t.vAdd).toFixed(2));
    hud.set('st', t.phase === 'ready' ? '待开始' : t.phase === 'observe' ? `静置观察 ${Math.ceil(t.obsT)} s` : t.phase === 'done' ? '终点已记录' : '滴定中');
  }
  drawTit();
}
function drawTit() {
  drawLabBG();
  bench();
  drawStand(190, 700, 120, [{ y: 150, x: FLASK_X }]);
  backlight(190, 498, 180, 168);
  const t = tit;
  const reading = t.init[t.run - 1] != null ? t.init[t.run - 1] + t.vAdd : 0.00;
  // 锥形瓶（摇瓶摆动）
  const ang = t.swirl > 0 ? Math.sin(t.swirlPhase * 10) * 0.09 : 0;
  ctx.save();
  ctx.translate(FLASK_X, 640); ctx.rotate(ang); ctx.translate(-FLASK_X, -640);
  drawFlask(FLASK_X, 640, { liquidH: 62, color: liqColor(phAtTit(t.vAdd)), plumes: t.plumes });
  ctx.restore();
  txt('锥形瓶：20.00 mL 待测盐酸 + 2 滴酚酞', FLASK_X, 712, { size: 12, color: '#9fb0c2' });
  // 滴定管（碱式，NaOH）
  drawBurette(FLASK_X, 96, { level: reading / 50, liquid: 'rgba(150,200,255,0.24)', style: 'base' });
  txt('碱式滴定管：0.1000 mol/L NaOH 标准液', 470, 100, { size: 12, color: '#9fb0c2', align: 'left' });
  // 悬半滴
  if (t.hang) {
    ctx.fillStyle = 'rgba(200,230,255,0.95)';
    ctx.beginPath(); ctx.ellipse(FLASK_X, TIP_Y + 6, 3.4, 5, 0, 0, 7); ctx.fill();
    txt('半滴悬而不落', FLASK_X + 60, TIP_Y + 6, { size: 11, color: '#ffd98a' });
  }
  // 下落液滴 / 液流
  t.drops.forEach((d) => {
    ctx.fillStyle = 'rgba(175,215,255,0.9)';
    ctx.beginPath(); ctx.ellipse(FLASK_X + d.jit, d.y, 2.8, 4.4, 0, 0, 7); ctx.fill();
  });
  if (t.stream) {
    const g = ctx.createLinearGradient(0, TIP_Y, 0, SURF_Y);
    g.addColorStop(0, 'rgba(175,215,255,0.7)');
    g.addColorStop(1, 'rgba(175,215,255,0.25)');
    ctx.strokeStyle = g;
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(FLASK_X, TIP_Y + 4); ctx.lineTo(FLASK_X, SURF_Y); ctx.stroke();
  }
  // 洗瓶动画
  if (t.wash > 0) {
    drawBottle(FLASK_X - 130, 600, { fill: 'rgba(160,210,255,0.5)', fillH: 0.5, label: '洗瓶' });
    ctx.strokeStyle = 'rgba(175,220,255,0.85)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(FLASK_X - 112, 560);
    ctx.quadraticCurveTo(FLASK_X - 40, 500, FLASK_X + 2, TIP_Y + 10); ctx.stroke();
  }
  // 接近终点的酸色提示
  const ph = phAtTit(t.vAdd);
  if (t.phase !== 'ready' && ph >= 8.2) {
    txt(ph > 10.2 ? '红色过深（终点已过）' : '浅粉色（酚酞变色）', FLASK_X + 118, SURF_Y - 34, { size: 12, bold: true, color: '#ff9db8' });
  }
  drawZoomCard(436, 170, 254, 190, reading);
  drawRecord(726, 88, 526, 452);
  pill(t.msg, 640, 34);
  if (hud) hud.set('v', t.vAdd.toFixed(2) + ' mL');
}

/* ================= 章节 3：指示剂与滴定曲线 ================= */

const INDS = [
  { id: 'pp', name: '酚酞', lo: 8.2, hi: 10.0, color: '#f06292', note: '变色范围几乎全部落在突跃内——强碱滴强酸首选。酸中无色，碱中浅粉→红。', ok: '✔ 可用' },
  { id: 'mo', name: '甲基橙', lo: 3.1, hi: 4.4, color: '#ff8a3d', note: '变色范围在突跃下沿，仅 4.3~4.4 与突跃重叠——强碱滴强酸可用（终点红→橙），但误差比酚酞略大。', ok: '△ 勉强可用' },
  { id: 'lm', name: '石蕊', lo: 5.0, hi: 8.0, color: '#9b6fd9', note: '变色范围太宽（5.0~8.0），且红→紫→蓝过渡颜色难以观察，滴定误差大——不能用作中和滴定指示剂。', ok: '✘ 不可用' },
];
const cur3 = { ind: 'pp', jump: true, playing: false, v: 0 };
function phIdeal(v) {
  const nA = 2.0, nB = 0.1 * v, Vt = 20 + v;
  if (nA - nB > 1e-9) return -Math.log10((nA - nB) / Vt);
  if (nB - nA > 1e-9) return 14 + Math.log10((nB - nA) / Vt);
  return 7.00;
}
function vAtPH(target) {
  let lo = 0, hi = 25;
  for (let i = 0; i < 44; i++) {
    const mid = (lo + hi) / 2;
    if (phIdeal(mid) < target) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}
function indColor(ph, id) {
  const ind = INDS.find((d) => d.id === id);
  if (id === 'pp') {
    if (ph < 8.2) return null;
    if (ph < 10) return `rgba(240,98,146,${(0.15 + 0.5 * (ph - 8.2) / 1.8).toFixed(2)})`;
    return 'rgba(226,54,110,0.75)';
  }
  if (id === 'mo') {
    if (ph < 3.1) return 'rgba(216,60,50,0.7)';
    if (ph <= 4.4) return 'rgba(255,138,60,0.7)';
    return 'rgba(240,206,70,0.6)';
  }
  if (ph < 5) return 'rgba(216,70,60,0.65)';
  if (ph <= 8) return 'rgba(155,111,217,0.65)';
  return 'rgba(70,120,220,0.65)';
}
const secCurve = {
  id: 'curve', title: '指示剂与滴定曲线',
  html: `<p>0.1000 mol/L NaOH 滴定 20.00 mL 0.1000 mol/L 盐酸的<b>pH–V 曲线</b>：V=20.00 mL（pH=7.00）处发生<b>突跃</b>，pH 由约 4.3 跳到 9.7（±0.1% 内）。</p>
<p>指示剂选择原则：<b>变色范围全部或部分落在突跃范围内</b>。切换酚酞 / 甲基橙 / 石蕊，看它们的变色范围带与突跃的关系。</p>
<p>点「▶ 滴加动画」看滴加过程中 pH 沿曲线爬升、小锥形瓶颜色随指示剂变化。</p>`,
  enter() {
    Object.assign(cur3, { ind: 'pp', jump: true, playing: false, v: 0 });
    setHud([['v', 'V(NaOH)'], ['ph', 'pH'], ['ind', '指示剂'], ['st', '颜色']]);
    ctl.clear();
    ctl.seg({
      options: INDS.map((d) => ({ label: d.name, value: d.id })),
      value: 'pp',
      onChange: (v) => { cur3.ind = v; if (hud) hud.set('ind', INDS.find((d) => d.id === v).name); },
    });
    ctl.toggle({ label: '显示突跃范围', value: true, onChange: (v) => { cur3.jump = v; } });
    ctl.sep();
    ctl.button({
      label: '▶ 滴加动画', active: false,
      onClick(b) {
        cur3.playing = !cur3.playing;
        if (cur3.playing && cur3.v >= 25) cur3.v = 0;
        b.textContent = cur3.playing ? '⏸ 暂停' : '▶ 滴加动画';
        b.classList.toggle('active', cur3.playing);
      },
    });
    ctl.button({ label: '↺ 复位', onClick() { cur3.v = 0; cur3.playing = false; const b = ctl.el.querySelector('.ctl-btn.active'); if (b) { b.textContent = '▶ 滴加动画'; b.classList.remove('active'); } } });
    if (hud) hud.set('ind', '酚酞');
    chapterTick = (dt) => {
      if (cur3.playing) {
        cur3.v += dt * 1.9;
        if (cur3.v >= 25) { cur3.v = 25; cur3.playing = false; const b = ctl.el.querySelector('.ctl-btn.active'); if (b) { b.textContent = '▶ 滴加动画'; b.classList.remove('active'); } }
      }
      drawCurve();
    };
    drawCurve();
  },
};
function drawCurve() {
  drawLabBG();
  const px = 160, py = 170, pw = 540, ph_ = 430;
  const X = (v) => px + pw * v / 25;
  const Y = (p) => py + ph_ * (1 - p / 14);
  card(px - 20, py - 26, pw + 40, ph_ + 70, { fill: 'rgba(13,19,27,0.9)' });
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  for (let p = 0; p <= 14; p += 2) { ctx.beginPath(); ctx.moveTo(X(0), Y(p)); ctx.lineTo(X(25), Y(p)); ctx.stroke(); }
  for (let v = 0; v <= 25; v += 5) { ctx.beginPath(); ctx.moveTo(X(v), Y(0)); ctx.lineTo(X(v), Y(14)); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(200,214,228,0.8)';
  ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(X(0), Y(0)); ctx.lineTo(X(25), Y(0)); ctx.moveTo(X(0), Y(0)); ctx.lineTo(X(0), Y(14)); ctx.stroke();
  for (let v = 0; v <= 25; v += 5) txt(String(v), X(v), Y(0) + 16, { size: 11, color: '#9fb0c2', halo: null });
  for (let p = 0; p <= 14; p += 2) txt(String(p), X(0) - 14, Y(p), { size: 11, color: '#9fb0c2', halo: null });
  txt('V(NaOH) /mL', px + pw / 2, py + ph_ + 34, { size: 12, color: '#c6d2df', halo: null });
  txt('pH', px - 44, py + 8, { size: 12, color: '#c6d2df', halo: null });
  if (cur3.jump) {
    ctx.fillStyle = 'rgba(63,169,111,0.10)';
    ctx.fillRect(X(19.9), Y(9.7), X(20.1) - X(19.9), Y(4.3) - Y(9.7));
    ctx.strokeStyle = 'rgba(63,169,111,0.5)';
    ctx.setLineDash([4, 3]);
    ctx.strokeRect(X(19.9), Y(9.7), X(20.1) - X(19.9), Y(4.3) - Y(9.7));
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(63,169,111,0.14)';
    ctx.fillRect(X(0), Y(9.7), pw, Y(4.3) - Y(9.7));
    txt('突跃范围：pH 4.3 → 9.7', X(25) - 90, Y(11.5), { size: 11.5, color: '#7fd6a4', halo: null });
    txt('（V 19.98→20.02 mL，±0.1%）', X(25) - 90, Y(11.5) + 17, { size: 10.5, color: '#7fd6a4', halo: null });
  }
  // 指示剂变色带
  const ind = INDS.find((d) => d.id === cur3.ind);
  ctx.fillStyle = hexA(ind.color, 0.14);
  ctx.fillRect(X(0), Y(ind.hi), pw, Y(ind.lo) - Y(ind.hi));
  ctx.strokeStyle = hexA(ind.color, 0.7);
  ctx.setLineDash([5, 4]);
  ctx.beginPath(); ctx.moveTo(X(0), Y(ind.lo)); ctx.lineTo(X(25), Y(ind.lo)); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(X(0), Y(ind.hi)); ctx.lineTo(X(25), Y(ind.hi)); ctx.stroke();
  ctx.setLineDash([]);
  const va = vAtPH(ind.lo), vb = vAtPH(ind.hi);
  ctx.strokeStyle = hexA(ind.color, 0.85);
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(X(va), Y(0)); ctx.lineTo(X(va), Y(ind.lo)); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(X(vb), Y(0)); ctx.lineTo(X(vb), Y(ind.hi)); ctx.stroke();
  ctx.lineWidth = 1;
  txt(`${ind.name} ${ind.lo}~${ind.hi}`, X(25) - 70, Y((ind.lo + ind.hi) / 2), { size: 12, bold: true, color: ind.color, halo: null });
  txt(`变色对应 V：${va.toFixed(2)} → ${vb.toFixed(2)} mL`, px + 110, py + 12, { size: 11.5, color: ind.color, halo: null });
  // 曲线
  ctx.strokeStyle = '#ffd76e';
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  for (let i = 0; i <= 220; i++) {
    const v = i * 25 / 220;
    const sx = X(v), sy = Y(phIdeal(v));
    i ? ctx.lineTo(sx, sy) : ctx.moveTo(sx, sy);
  }
  ctx.stroke();
  // 等当点
  ctx.fillStyle = '#7fd6a4';
  ctx.beginPath(); ctx.arc(X(20), Y(7), 4.5, 0, 7); ctx.fill();
  txt('等当点 (20.00, 7.00)', X(20) + 4, Y(7) - 14, { size: 11.5, color: '#7fd6a4', align: 'left' });
  // 动画进度
  if (cur3.v > 0) {
    const p = phIdeal(cur3.v);
    ctx.strokeStyle = 'rgba(255,215,110,0.5)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(X(cur3.v), Y(0)); ctx.lineTo(X(cur3.v), Y(p)); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#ffd76e';
    ctx.beginPath(); ctx.arc(X(cur3.v), Y(p), 5.5, 0, 7); ctx.fill();
  }
  // 右侧面板
  card(730, 52, 522, 620);
  txt('指示剂选择', 754, 84, { size: 17, bold: true, align: 'left', color: '#e8eef6', halo: null });
  let yy = 122;
  INDS.forEach((d) => {
    const sel = d.id === cur3.ind;
    if (sel) {
      ctx.fillStyle = 'rgba(232,103,74,0.10)';
      ctx.beginPath(); ctx.roundRect(748, yy - 20, 484, 96, 10); ctx.fill();
    }
    ctx.fillStyle = d.color;
    ctx.beginPath(); ctx.roundRect(758, yy - 9, 26, 12, 3); ctx.fill();
    txt(`${d.name}（${d.lo} ~ ${d.hi}）`, 796, yy - 2, { size: 13.5, bold: true, align: 'left', color: sel ? '#ffffff' : '#c6d2df', halo: null });
    txt(d.ok, 1214, yy - 2, { size: 12.5, bold: true, align: 'right', color: d.ok.startsWith('✔') ? '#7fd6a4' : d.ok.startsWith('✘') ? '#ff9d8f' : '#ffd98a', halo: null });
    wrapText(d.note, 758, yy + 24, 460, 19, { size: 12, align: 'left', color: sel ? '#dfe6ee' : '#9fb0c2', halo: null });
    yy += 104;
  });
  ctx.strokeStyle = 'rgba(255,255,255,0.10)';
  ctx.beginPath(); ctx.moveTo(754, yy + 6); ctx.lineTo(1228, yy + 6); ctx.stroke();
  txt('滴加过程小瓶（当前颜色）', 754, yy + 34, { size: 12.5, color: '#9fb0c2', align: 'left', halo: null });
  const pNow = phIdeal(cur3.v);
  const col = indColor(pNow, cur3.ind);
  drawFlask(830, yy + 190, { s: 0.62, liquidH: 40, color: col || 'rgba(150,200,255,0.18)' });
  txt(`V = ${cur3.v.toFixed(2)} mL   pH = ${pNow.toFixed(2)}`, 1010, yy + 96, { size: 14, bold: true, align: 'left', color: '#ffe9b0', halo: null });
  txt(col ? '已变色' : (cur3.ind === 'pp' ? '无色' : '呈酸性色'), 1010, yy + 126, { size: 12.5, align: 'left', color: '#c6d2df', halo: null });
  wrapText('选择原则：指示剂变色范围应全部或部分落在滴定突跃范围内，否则终点误差大。', 754, yy + 250, 470, 21, { size: 12.5, align: 'left', color: '#9fb0c2', halo: null });
  if (hud) {
    hud.set('v', cur3.v.toFixed(2) + ' mL');
    hud.set('ph', pNow.toFixed(2));
    hud.set('ind', ind.name);
    hud.set('st', col ? '变色' : cur3.ind === 'pp' ? '无色' : '酸色');
  }
}

/* ================= 章节 4：误差分析 ================= */

const ERRS = [
  { t: '滴定管洗净后未用标准液润洗', ans: 0, chain: '残留蒸馏水稀释了标准液 → 装入的 c(NaOH) 实际偏低 → 消耗 V(NaOH) 偏大 → 由 c(HCl)=c(NaOH)·V(NaOH)/V(HCl)，结果偏高' },
  { t: '锥形瓶用待测液（盐酸）润洗', ans: 0, chain: '瓶内多出一部分待测 HCl → n(HCl) 增多 → 消耗 V(NaOH) 偏大 → 结果偏高（锥形瓶只能用蒸馏水洗）' },
  { t: '滴定前活塞下有气泡，滴定中消失', ans: 0, chain: '气泡被液体取代，其体积被计入读数 → 终读数偏大 → V(NaOH) 偏大 → 结果偏高（滴定前须赶尽气泡）' },
  { t: '终点时仰视读取终读数', ans: 0, chain: '滴定管刻度自上而下增大，仰视读数偏大 → 终读数偏大 → V(NaOH)=终−初 偏大 → 结果偏高' },
  { t: '滴定过程中锥形瓶内液体溅出', ans: 1, chain: '部分待测 HCl 损失 → n(HCl) 减少 → 消耗 V(NaOH) 偏小 → 结果偏低' },
  { t: '锥形瓶用蒸馏水洗净后残留少量水', ans: 2, chain: '瓶内 n(HCl) 不变（蒸馏水不消耗 NaOH）→ V(NaOH) 不变 → 对结果无影响' },
];
const ERR_OPTS = ['偏高', '偏低', '无影响'];
const err4 = { i: 0, picks: [null, null, null, null, null, null], revealed: [false, false, false, false, false, false] };
const secErr = {
  id: 'err', title: '误差分析',
  html: `<p>滴定结果 <span class="hl">c(HCl) = c(NaOH)·V(NaOH) / V(HCl)</span>，c(NaOH)、V(HCl) 都是定值，误差全看 <b>V(NaOH)</b> 是偏大还是偏小。</p>
<p>六个典型场景：<b>先自己判断「偏高 / 偏低 / 无影响」</b>，再点「揭晓答案」核对推理链。全部判断完看正确数。</p>`,
  enter() {
    setHud([['i', '场景'], ['pick', '我的判断'], ['res', '结果']]);
    ctl.clear();
    ctl.button({ label: '← 上一题', onClick: () => { err4.i = (err4.i + 5) % 6; } });
    ctl.button({ label: '下一题 →', onClick: () => { err4.i = (err4.i + 1) % 6; } });
    ctl.sep();
    ctl.button({ label: '偏高 ↑', onClick: () => errPick(0) });
    ctl.button({ label: '偏低 ↓', onClick: () => errPick(1) });
    ctl.button({ label: '无影响 —', onClick: () => errPick(2) });
    ctl.sep();
    ctl.button({ label: '揭晓答案', onClick() { err4.revealed[err4.i] = true; } });
    ctl.button({
      label: '↺ 重做本组',
      onClick() {
        err4.picks = [null, null, null, null, null, null];
        err4.revealed = [false, false, false, false, false, false];
        err4.i = 0;
      },
    });
    chapterTick = () => drawErr();
    drawErr();
  },
};
function errPick(v) {
  err4.picks[err4.i] = v;
  if (hud) hud.set('pick', ERR_OPTS[v]);
}
function drawErr() {
  drawLabBG();
  const i = err4.i;
  // 左侧场景列表
  card(60, 60, 360, 620);
  txt('误差场景（共 6 项）', 84, 92, { size: 15, bold: true, align: 'left', color: '#e8eef6', halo: null });
  ERRS.forEach((e, k) => {
    const y = 128 + k * 88;
    const sel = k === i;
    if (sel) {
      ctx.fillStyle = 'rgba(232,103,74,0.10)';
      ctx.beginPath(); ctx.roundRect(76, y - 26, 330, 74, 10); ctx.fill();
    }
    const done = err4.revealed[k];
    const good = done && err4.picks[k] === e.ans;
    txt(`①②③④⑤⑥`.charAt(k), 96, y - 2, { size: 15, bold: true, align: 'left', color: sel ? '#ffcf96' : '#8a99a8', halo: null });
    wrapText(e.t, 122, y - 4, 270, 20, { size: 12.5, align: 'left', color: sel ? '#ffffff' : '#b8c4d0', halo: null });
    const status = !err4.picks[k] ? '未判断' : !done ? '已判断，未揭晓' : good ? '✓ 判断正确' : '✗ 判断错误';
    txt(status, 384, y + 26, { size: 11.5, align: 'right', color: good ? '#7fd6a4' : (done ? '#ff9d8f' : '#8a99a8'), halo: null });
    hits = hits.filter((h) => h.id !== 'e' + k);
    hits.push({ id: 'e' + k, x: 76, y: y - 26, w: 330, h: 74, cb: () => { err4.i = k; } });
  });
  // 右侧：公式 + 当前场景 + 推理
  card(450, 60, 770, 240, { fill: 'rgba(13,19,27,0.93)' });
  txt('判据公式', 474, 92, { size: 13, color: '#9fb0c2', align: 'left', halo: null });
  txt('c(HCl) = c(NaOH) · V(NaOH) / V(HCl)', 835, 128, { size: 21, bold: true, color: '#ffe9b0' });
  wrapText('c(NaOH)（标准液浓度）与 V(HCl)（待测液体积）为定值 → 误差只取决于 V(NaOH)：偏大 → 结果偏高；偏小 → 结果偏低。', 474, 168, 720, 22, { size: 13, align: 'left', color: '#9fb0c2', halo: null });
  txt(`正确 ${err4.revealed.filter((r, k) => r && err4.picks[k] === ERRS[k].ans).length} / 6`, 1196, 128, { size: 15, bold: true, color: '#7fd6a4', halo: null });
  const e = ERRS[i];
  card(450, 320, 770, 360);
  txt(`场景 ${'①②③④⑤⑥'.charAt(i)}`, 474, 352, { size: 13, bold: true, align: 'left', color: '#ffcf96', halo: null });
  wrapText(e.t, 474, 384, 700, 24, { size: 16.5, bold: true, align: 'left', color: '#ffffff', halo: null });
  const pick = err4.picks[i];
  if (pick != null) txt(`我的判断：${ERR_OPTS[pick]}`, 1196, 384, { size: 13.5, bold: true, color: '#9fd8ff', halo: null });
  if (err4.revealed[i]) {
    const good = pick === e.ans;
    pill(good ? '✓ 判断正确' : `✗ 正确答案：${ERR_OPTS[e.ans]}`, 835, 442, good ? '#7fd6a4' : '#ff9d8f');
    txt('推理链', 474, 486, { size: 12.5, color: '#9fb0c2', align: 'left', halo: null });
    wrapText(e.chain, 474, 516, 716, 28, { size: 14.5, align: 'left', color: '#ffe1b8', halo: null });
  } else {
    wrapText('先在下方控制条选择你的判断（偏高 / 偏低 / 无影响），再点「揭晓答案」查看完整推理链。', 474, 500, 700, 24, { size: 13.5, align: 'left', color: '#93a3b3', halo: null });
  }
  if (hud) {
    hud.set('i', `第 ${i + 1} / 6 项`);
    hud.set('pick', pick == null ? '—' : ERR_OPTS[pick]);
    hud.set('res', err4.revealed[i] ? (pick === e.ans ? '正确 ✓' : `应为${ERR_OPTS[e.ans]}`) : '未揭晓');
  }
}

/* ================= 章节 5/6：离子检验（共用框架） ================= */

function ionRack(xs, yTop, sel, tubes, revealMap) {
  ctx.fillStyle = '#3a332a';
  ctx.beginPath(); ctx.roundRect(xs[0] - 58, yTop + 148, xs[xs.length - 1] - xs[0] + 116, 14, 5); ctx.fill();
  ctx.fillStyle = '#463d30';
  ctx.beginPath(); ctx.roundRect(xs[0] - 58, yTop + 148, xs[xs.length - 1] - xs[0] + 116, 5, 3); ctx.fill();
  tubes.forEach((T, k) => {
    const x = xs[k];
    const selG = k === sel;
    if (selG) {
      ctx.save();
      ctx.strokeStyle = '#ffb14e';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.strokeRect(x - 26, yTop - 18, 52, 186);
      ctx.restore();
    }
    drawTube(x, yTop, {
      w: 34, len: 140, liquid: T.sol, ppt: T.ppt, bubbles: T.bubbles,
    });
    txt(`未知液 ${T.lab}`, x, yTop + 172, { size: 12.5, bold: true, color: selG ? '#ffcf96' : '#c6d2df' });
    if (revealMap) txt(T.ion, x, yTop + 192, { size: 12.5, bold: true, color: '#7fd6a4' });
    hits.push({ id: 'tube' + k, x: x - 30, y: yTop - 16, w: 60, h: 180, cb: () => { ionSel = k; } });
    if (T.paper) {
      const py = yTop - 26;
      ctx.fillStyle = T.paperBlue ? '#4a80e0' : '#d9534f';
      ctx.beginPath(); ctx.roundRect(x + 22, py - 30, 11, 34, 2); ctx.fill();
      txt('试纸', x + 28, py + 14, { size: 9.5, color: '#c6d2df' });
    }
  });
}
function ionDropperAnim(x, yTop, t, color) {
  if (t.anim > 0) {
    const k = 0.9 - t.anim;
    const drops = [20, 45, 70].filter((d) => k * 100 > d);
    drawDropper(x, yTop - 108, { drops });
    if (color) {
      drops.forEach(() => {});
    }
  }
}
let ionSel = 0;

/* ---- 章节 5：阳离子 ---- */

const CAT = {
  tubes: [
    { lab: '甲', ion: 'Cu²⁺', sol: 'rgba(64,140,214,0.42)', ppt: null, bubbles: [], anim: 0, naoh: false, deep: false, feT: -1, paper: false, paperBlue: false, log: [], con: null },
    { lab: '乙', ion: 'Fe³⁺', sol: 'rgba(206,160,60,0.45)', ppt: null, bubbles: [], anim: 0, naoh: false, deep: false, feT: -1, paper: false, paperBlue: false, log: [], con: null },
    { lab: '丙', ion: 'Fe²⁺', sol: 'rgba(126,196,172,0.38)', ppt: null, bubbles: [], anim: 0, naoh: false, deep: false, feT: -1, paper: false, paperBlue: false, log: [], con: null },
    { lab: '丁', ion: 'NH₄⁺', sol: 'rgba(188,214,238,0.22)', ppt: null, bubbles: [], anim: 0, naoh: false, deep: false, feT: -1, paper: false, paperBlue: false, log: [], con: null },
  ],
  reagents: [
    { id: 'naoh', n: 'NaOH 溶液' },
    { id: 'nh3', n: '浓氨水' },
    { id: 'paper', n: '湿润红色石蕊试纸' },
  ],
  reg: 'naoh', reveal: false, msg: '点选试管 → 选试剂 → 滴加',
};
const catXs = [200, 340, 480, 620];
function catApply() {
  const T = CAT.tubes[ionSel];
  const reg = CAT.reg;
  const ion = T.ion;
  T.anim = 0.9;
  if (reg === 'naoh') {
    T.naoh = true;
    if (ion === 'Cu²⁺') {
      T.ppt = { color: '#3f6fd9', k: 1 };
      T.log.push('＋NaOH → 蓝色沉淀 Cu(OH)₂↓');
      T.con = '含 Cu²⁺：Cu²⁺ + 2OH⁻ = Cu(OH)₂↓（蓝色沉淀）';
    } else if (ion === 'Fe³⁺') {
      T.ppt = { color: '#a34a28', k: 1 };
      T.log.push('＋NaOH → 红褐色沉淀 Fe(OH)₃↓');
      T.con = '含 Fe³⁺：Fe³⁺ + 3OH⁻ = Fe(OH)₃↓（红褐色沉淀）';
    } else if (ion === 'Fe²⁺') {
      if (T.feT < 0) { T.feT = 0; T.ppt = { color: '#eceee8', k: 1 }; T.log.push('＋NaOH → 白色沉淀 Fe(OH)₂↓'); }
    } else {
      T.log.push('＋NaOH → 无明显现象（未加热不放氨）');
    }
  } else if (reg === 'nh3') {
    if (ion === 'Cu²⁺') {
      if (!T.ppt) {
        T.ppt = { color: '#3f6fd9', k: 1 };
        T.log.push('＋浓氨水 → 先出现蓝色沉淀');
      } else {
        T.deep = true; T.ppt = null;
        T.log.push('＋过量浓氨水 → 沉淀溶解，得深蓝色溶液');
        T.con = '含 Cu²⁺：Cu(OH)₂ + 4NH₃·H₂O = [Cu(NH₃)₄]²⁺ + 2OH⁻ + 4H₂O（深蓝色）';
      }
    } else if (ion === 'Fe³⁺') {
      T.ppt = { color: '#a34a28', k: 1 };
      T.log.push('＋浓氨水 → 红褐色沉淀（氨水是弱碱，同样沉淀 Fe³⁺）');
      T.con = '含 Fe³⁺：Fe³⁺ + 3NH₃·H₂O = Fe(OH)₃↓ + 3NH₄⁺';
    } else if (ion === 'Fe²⁺') {
      if (T.feT < 0) { T.feT = 0; T.ppt = { color: '#eceee8', k: 1 }; T.log.push('＋浓氨水 → 白色沉淀（随后氧化变色）'); }
    } else {
      T.log.push('＋浓氨水 → 无明显现象');
    }
  } else {
    if (!T.naoh) { CAT.msg = '检验 NH₄⁺：须先加 NaOH 溶液，再共热，湿润红色石蕊试纸置于管口'; return; }
    T.paper = true;
    if (ion === 'NH₄⁺') {
      T.paperBlue = true;
      T.log.push('＋NaOH，共热 → 湿润红色石蕊试纸变蓝');
      T.con = '含 NH₄⁺：NH₄⁺ + OH⁻ =Δ= NH₃↑ + H₂O（氨气使湿润红色石蕊试纸变蓝）';
    } else {
      T.log.push('＋NaOH，共热 → 试纸不变蓝（无 NH₄⁺）');
    }
  }
  CAT.msg = `已向 ${T.lab} 管滴加完成，观察现象 →`;
}
function drawIonPanelCation() {
  const T = CAT.tubes[ionSel];
  card(740, 52, 512, 620);
  txt(`未知液 ${T.lab} · 检验记录`, 764, 84, { size: 15.5, bold: true, align: 'left', color: '#e8eef6', halo: null });
  txt('试剂', 764, 118, { size: 12, color: '#9fb0c2', align: 'left', halo: null });
  let yy = 144;
  T.log.forEach((s) => {
    yy = wrapText(s, 764, yy, 460, 21, { size: 13, align: 'left', color: '#d5dfe9', halo: null }) + 8;
  });
  if (!T.log.length) wrapText('尚未加试剂。依次尝试：NaOH 溶液（Cu²⁺/Fe³⁺/Fe²⁺）、浓氨水（Cu²⁺ 深蓝络合物）、湿润红色石蕊试纸（先加 NaOH 共热检验 NH₄⁺）。', 764, yy, 452, 21, { size: 12.5, align: 'left', color: '#93a3b3', halo: null });
  ctx.strokeStyle = 'rgba(255,255,255,0.10)';
  ctx.beginPath(); ctx.moveTo(764, 480); ctx.lineTo(1228, 480); ctx.stroke();
  txt('结论', 764, 506, { size: 12.5, color: '#9fb0c2', align: 'left', halo: null });
  if (T.con) wrapText(T.con, 764, 534, 452, 23, { size: 14, bold: true, align: 'left', color: '#7fd6a4', halo: null });
  else wrapText('—', 764, 534, 452, 22, { size: 13, align: 'left', color: '#8a99a8', halo: null });
  txt(CAT.msg, 754, 640, { size: 12.5, color: '#ffd98a', align: 'left', halo: null });
}
const secCation = {
  id: 'cation', title: '阳离子的检验',
  html: `<p>四支试管分别含 <b>Cu²⁺ / Fe³⁺ / Fe²⁺ / NH₄⁺</b> 中的一种。点选试管，选择试剂滴加，观察现象：</p>
<p>• <b>NaOH</b>：Cu²⁺→蓝色沉淀；Fe³⁺→红褐色沉淀；Fe²⁺→<b>白色沉淀迅速变灰绿、最后红褐色</b>；NH₄⁺ 常温无现象<br>
• <b>浓氨水</b>：Cu²⁺ 先出蓝色沉淀、<b>过量后溶解成深蓝色</b> [Cu(NH₃)₄]²⁺<br>
• <b>湿润红色石蕊试纸</b>：先加 NaOH 共热，试纸变蓝 ⇒ NH₄⁺</p>
<p>点「显示答案」核对四支试管。</p>`,
  enter() {
    ionSel = 0;
    CAT.tubes.forEach((T) => Object.assign(T, { ppt: null, bubbles: [], anim: 0, naoh: false, deep: false, feT: -1, paper: false, paperBlue: false, log: [], con: null, sol: T.sol0 || T.sol }));
    CAT.reveal = false; CAT.msg = '点选试管 → 选试剂 → 滴加';
    setHud([['tube', '试管'], ['reg', '试剂'], ['st', '提示']]);
    ctl.clear();
    ctl.seg({
      options: CAT.reagents.map((r) => ({ label: r.n, value: r.id })),
      value: 'naoh',
      onChange: (v) => { CAT.reg = v; if (hud) hud.set('reg', CAT.reagents.find((r) => r.id === v).n); },
    });
    ctl.sep();
    ctl.button({ label: '滴加', onClick: () => catApply() });
    ctl.button({ label: '显示答案', onClick(b) { CAT.reveal = !CAT.reveal; b.classList.toggle('active', CAT.reveal); } });
    ctl.button({
      label: '↺ 重置',
      onClick() {
        CAT.tubes.forEach((T) => Object.assign(T, { ppt: null, bubbles: [], anim: 0, naoh: false, deep: false, feT: -1, paper: false, paperBlue: false, log: [], con: null }));
        CAT.reveal = false;
      },
    });
    if (hud) hud.set('reg', 'NaOH 溶液');
    chapterTick = (dt) => {
      CAT.tubes.forEach((T) => {
        if (T.anim > 0) T.anim -= dt;
        if (T.feT >= 0) {
          T.feT += dt;
          if (T.feT < 3) T.ppt = { color: '#eceee8', k: 1 };
          else if (T.feT < 6) { T.ppt = { color: mixHex('#eceee8', '#7f8d75', (T.feT - 3) / 3), k: 1 }; if (!T.g1) { T.g1 = 1; T.log.push('沉淀迅速变灰绿色'); } }
          else if (T.feT < 10) { T.ppt = { color: mixHex('#7f8d75', '#a34a28', (T.feT - 6) / 4), k: 1 }; if (!T.g2) { T.g2 = 1; T.log.push('灰绿色最终变为红褐色'); } }
          else if (!T.g3) {
            T.g3 = 1; T.ppt = { color: '#a34a28', k: 1 };
            T.log.push('4Fe(OH)₂ + O₂ + 2H₂O = 4Fe(OH)₃');
            T.con = '含 Fe²⁺：白色沉淀迅速变灰绿、最后红褐色（被 O₂ 氧化为 Fe(OH)₃）';
          }
        }
      });
      drawCation();
    };
    drawCation();
  },
};
function drawCation() {
  drawLabBG();
  bench();
  hits = hits.filter((h) => !h.id || !h.id.startsWith('tube'));
  ionRack(catXs, 400, ionSel, CAT.tubes, CAT.reveal);
  CAT.tubes.forEach((T, k) => {
    if (T.deep) { ctx.fillStyle = 'rgba(30,64,208,0.55)'; const x = catXs[k]; ctx.fillRect(x - 15, 470, 30, 60); }
    ionDropperAnim(catXs[k], 400, T);
  });
  txt('Cu²⁺ / Fe³⁺ / Fe²⁺ / NH₄⁺ 各其一（顺序见「显示答案」）', 410, 620, { size: 12, color: '#9fb0c2' });
  drawIonPanelCation();
  pill(CAT.msg, 410, 34);
  if (hud) {
    hud.set('tube', '未知液 ' + CAT.tubes[ionSel].lab);
    hud.set('reg', CAT.reagents.find((r) => r.id === CAT.reg).n);
    hud.set('st', CAT.tubes[ionSel].con ? '已有结论' : '观察现象中');
  }
}

/* ---- 章节 6：阴离子 ---- */

const AN = {
  tubes: [
    { lab: 'Ⅰ', ion: 'Cl⁻', sol: 'rgba(196,218,238,0.22)', ppt: null, bubbles: [], anim: 0, hcl: false, lastPpt: null, log: [], con: null },
    { lab: 'Ⅱ', ion: 'SO₄²⁻', sol: 'rgba(196,218,238,0.22)', ppt: null, bubbles: [], anim: 0, hcl: false, lastPpt: null, log: [], con: null },
    { lab: 'Ⅲ', ion: 'CO₃²⁻', sol: 'rgba(196,218,238,0.22)', ppt: null, bubbles: [], anim: 0, hcl: false, lastPpt: null, log: [], con: null },
  ],
  reagents: [
    { id: 'hcl', n: '稀盐酸' },
    { id: 'ag', n: 'AgNO₃ 溶液' },
    { id: 'ba', n: 'BaCl₂ 溶液' },
    { id: 'hno3', n: '稀硝酸' },
    { id: 'lime', n: '澄清石灰水' },
  ],
  reg: 'hcl', reveal: false, msg: '点选试管 → 选试剂 → 滴加',
};
const anXs = [230, 420, 610];
function anApply() {
  const T = AN.tubes[ionSel];
  const reg = AN.reg;
  const ion = T.ion;
  T.anim = 0.9;
  if (reg === 'hcl') {
    T.hcl = true;
    if (ion === 'CO₃²⁻') {
      T.bubbles = Array.from({ length: 6 }, (_, i) => ({ dx: Math.random() * 16 - 8, y: 8 + i * 14, r: 2 + Math.random() * 2 }));
      T.log.push('＋稀盐酸 → 冒气泡，气体使澄清石灰水变浑浊');
      T.con = '含 CO₃²⁻：CO₃²⁻ + 2H⁺ = H₂O + CO₂↑（CO₂ 使澄清石灰水变浑浊）';
    } else {
      T.log.push('＋稀盐酸 → 无沉淀（先酸化，排除 CO₃²⁻ 等干扰）');
    }
  } else if (reg === 'ag') {
    T.ppt = { color: '#f0f0e6', k: 1 };
    T.lastPpt = 'ag';
    if (ion === 'Cl⁻') T.log.push('＋AgNO₃ → 白色沉淀（再用稀硝酸验证）');
    else if (ion === 'SO₄²⁻') T.log.push('＋AgNO₃ → 白色沉淀（Ag₂SO₄ 微溶，现象不明显，不用此法检 SO₄²⁻）');
    else T.log.push('＋AgNO₃ → 白色沉淀（Ag₂CO₃，会溶于硝酸冒泡）');
  } else if (reg === 'ba') {
    if (ion === 'SO₄²⁻') {
      T.ppt = { color: '#f0f0e6', k: 1 };
      T.lastPpt = 'ba';
      if (T.hcl) {
        T.log.push('＋BaCl₂ → 白色沉淀（此前加盐酸无沉淀）');
        T.con = '含 SO₄²⁻：先加稀盐酸无沉淀（排除 CO₃²⁻ 等干扰），再加 BaCl₂ 出不溶于酸的白色沉淀 BaSO₄ —— 规范操作 ✓';
      } else {
        T.log.push('＋BaCl₂ → 白色沉淀（注意：未先酸化，CO₃²⁻ 也会生成 BaCO₃ 白色沉淀，无法下结论）');
      }
    } else if (ion === 'CO₃²⁻') {
      T.ppt = { color: '#f0f0e6', k: 1 };
      T.lastPpt = 'ba';
      T.log.push('＋BaCl₂ → 白色沉淀 BaCO₃（加稀硝酸会溶解并冒气泡）');
    } else {
      T.log.push('＋BaCl₂ → 无明显现象');
    }
  } else if (reg === 'hno3') {
    if (T.lastPpt === 'ag') {
      if (ion === 'Cl⁻') { T.log.push('＋稀硝酸 → 沉淀不溶解 ⇒ AgCl'); T.con = '含 Cl⁻：AgNO₃ 产生白色沉淀且不溶于稀硝酸（AgCl）'; }
      else if (ion === 'CO₃²⁻') T.log.push('＋稀硝酸 → 沉淀溶解并冒气泡 ⇒ 碳酸银（AgCl 不溶才是 Cl⁻）');
      else T.log.push('＋稀硝酸 → 沉淀无明显溶解');
    } else if (T.lastPpt === 'ba') {
      if (ion === 'SO₄²⁻') T.log.push('＋稀硝酸 → 沉淀不溶解（BaSO₄ 不溶于酸）');
      else T.log.push('＋稀硝酸 → 沉淀溶解并冒气泡（BaCO₃ 溶于酸）');
    } else {
      T.log.push('＋稀硝酸 → 无明显现象');
    }
  } else {
    if (ion === 'CO₃²⁻') T.log.push('＋澄清石灰水 → 白色沉淀 CaCO₃');
    else T.log.push('＋澄清石灰水 → 无明显现象');
  }
  AN.msg = `已向 Ⅰ/Ⅱ/Ⅲ 之 ${T.lab} 滴加完成，对照现象下结论`;
}
function drawIonPanelAnion() {
  const T = AN.tubes[ionSel];
  card(740, 52, 512, 620);
  txt(`未知液 ${T.lab} · 检验记录`, 764, 84, { size: 15.5, bold: true, align: 'left', color: '#e8eef6', halo: null });
  let yy = 120;
  T.log.forEach((s) => {
    yy = wrapText(s, 764, yy, 460, 21, { size: 13, align: 'left', color: '#d5dfe9', halo: null }) + 8;
  });
  if (!T.log.length) wrapText('尚未加试剂。推荐流程：Cl⁻ → AgNO₃ + 稀硝酸；SO₄²⁻ → 先稀盐酸后 BaCl₂；CO₃²⁻ → 稀盐酸（气泡→石灰水变浑浊）。', 764, yy, 452, 21, { size: 12.5, align: 'left', color: '#93a3b3', halo: null });
  ctx.strokeStyle = 'rgba(255,255,255,0.10)';
  ctx.beginPath(); ctx.moveTo(764, 462); ctx.lineTo(1228, 462); ctx.stroke();
  txt('结论', 764, 488, { size: 12.5, color: '#9fb0c2', align: 'left', halo: null });
  if (T.con) yy = wrapText(T.con, 764, 516, 452, 23, { size: 14, bold: true, align: 'left', color: '#7fd6a4', halo: null });
  else wrapText('—', 764, 516, 452, 22, { size: 13, align: 'left', color: '#8a99a8', halo: null });
  wrapText('为什么检验 SO₄²⁻ 要先酸化？若直接加 BaCl₂，CO₃²⁻、SO₃²⁻、Ag⁺ 等也会产生白色沉淀造成误判；先加稀盐酸无沉淀即可排除。检验 Cl⁻ 用稀硝酸酸化同理（Ag₂CO₃ 溶于硝酸而 AgCl 不溶）。', 764, 560, 452, 20, { size: 12, align: 'left', color: '#9fb0c2', halo: null });
  txt(AN.msg, 754, 650, { size: 12.5, color: '#ffd98a', align: 'left', halo: null });
}
const secAnion = {
  id: 'anion', title: '阴离子的检验',
  html: `<p>三支试管分别含 <b>Cl⁻ / SO₄²⁻ / CO₃²⁻</b> 中的一种（钠盐溶液）。</p>
<p>• <b>Cl⁻</b>：滴 AgNO₃ → 白色沉淀，加<b>稀硝酸不溶解</b> ⇒ AgCl<br>
• <b>SO₄²⁻</b>：<b>先加稀盐酸（无沉淀）</b>，再加 BaCl₂ → 白色沉淀 ⇒ BaSO₄（先酸化排除 CO₃²⁻ / Ag⁺ 干扰）<br>
• <b>CO₃²⁻</b>：滴稀盐酸 → 气泡 → 澄清石灰水变浑浊</p>
<p>故意「不按顺序」试试：直接对 SO₄²⁻ 管加 BaCl₂，看记录里怎么提醒你。</p>`,
  enter() {
    ionSel = 0;
    AN.tubes.forEach((T) => Object.assign(T, { ppt: null, bubbles: [], anim: 0, hcl: false, lastPpt: null, log: [], con: null }));
    AN.reveal = false; AN.msg = '点选试管 → 选试剂 → 滴加';
    setHud([['tube', '试管'], ['reg', '试剂'], ['st', '提示']]);
    ctl.clear();
    ctl.seg({
      options: AN.reagents.map((r) => ({ label: r.n, value: r.id })),
      value: 'hcl',
      onChange: (v) => { AN.reg = v; if (hud) hud.set('reg', AN.reagents.find((r) => r.id === v).n); },
    });
    ctl.sep();
    ctl.button({ label: '滴加', onClick: () => anApply() });
    ctl.button({ label: '显示答案', onClick(b) { AN.reveal = !AN.reveal; b.classList.toggle('active', AN.reveal); } });
    ctl.button({
      label: '↺ 重置',
      onClick() {
        AN.tubes.forEach((T) => Object.assign(T, { ppt: null, bubbles: [], anim: 0, hcl: false, lastPpt: null, log: [], con: null }));
        AN.reveal = false;
      },
    });
    if (hud) hud.set('reg', '稀盐酸');
    chapterTick = (dt) => {
      AN.tubes.forEach((T) => {
        if (T.anim > 0) T.anim -= dt;
        T.bubbles.forEach((b) => { b.y += 26 * dt; if (b.y > 108) b.y = 6; });
      });
      drawAnion();
    };
    drawAnion();
  },
};
function drawAnion() {
  drawLabBG();
  bench();
  hits = hits.filter((h) => !h.id || !h.id.startsWith('tube'));
  ionRack(anXs, 400, ionSel, AN.tubes, AN.reveal);
  AN.tubes.forEach((T, k) => {
    ionDropperAnim(anXs[k], 400, T);
    if (k === 2 && T.bubbles.length) {
      // CO₃²⁻ 管：气泡 + 右侧澄清石灰水小管变浑浊
      drawTube(anXs[2] + 96, 430, { w: 26, len: 100, liquid: 'rgba(232,230,220,0.75)', liquidH: 52 });
      txt('石灰水变浑浊', anXs[2] + 96, 548, { size: 10.5, color: '#c6d2df' });
    }
  });
  txt('Cl⁻ / SO₄²⁻ / CO₃²⁻ 各其一（钠盐溶液，顺序见「显示答案」）', 420, 620, { size: 12, color: '#9fb0c2' });
  drawIonPanelAnion();
  pill(AN.msg, 420, 34);
  if (hud) {
    hud.set('tube', '未知液 ' + AN.tubes[ionSel].lab);
    hud.set('reg', AN.reagents.find((r) => r.id === AN.reg).n);
    hud.set('st', AN.tubes[ionSel].con ? '已有结论' : '观察现象中');
  }
}

/* ================= 章节 7：焰色反应 ================= */

const FL = {
  elems: [
    { id: 'Na', name: '钠 Na', color: '#ffc63f', flame: '黄色', note: '焰色反应呈黄色——Na 元素的特征焰色。透过钴玻璃观察，黄光被滤去，火焰明显变暗。' },
    { id: 'K', name: '钾 K', color: '#ffc63f', realColor: '#a86ee0', flame: '紫色（需钴玻璃）', note: '钾的紫色火焰常被试剂与铂丝带入的微量 Na 杂质的黄光掩盖——直接观察只见黄光。透过蓝色钴玻璃滤去黄光，才能看到紫色。' },
    { id: 'Ca', name: '钙 Ca', color: '#e0492e', flame: '砖红色', note: '焰色反应呈砖红色——Ca 元素的特征焰色。' },
    { id: 'Cu', name: '铜 Cu', color: '#2fbf71', flame: '绿色', note: '焰色反应呈绿色（翠绿）——Cu 元素的特征焰色。' },
    { id: 'Sr', name: '锶 Sr', color: '#e0337c', flame: '洋红色', note: '焰色反应呈洋红色（品红）——Sr 元素的特征焰色（烟花红色即来自锶盐）。' },
    { id: 'Ba', name: '钡 Ba', color: '#a6d63a', flame: '黄绿色', note: '焰色反应呈黄绿色——Ba 元素的特征焰色。' },
  ],
  elem: null, phase: 'idle', t: 0, glass: false, time: 0, msg: '选择元素开始：灼烧 → 蘸取 → 观察 → 盐酸洗净',
};
const secFlame = {
  id: 'flame', title: '焰色反应',
  html: `<p>金属灼烧时火焰呈现<b>特征颜色</b>——焰色反应。操作四步：<b>灼烧（洗净铂丝）→ 蘸取待测液 → 置于火焰上观察 → 盐酸洗净铂丝</b>。</p>
<p>关键点：<b>观察 K 必须透过蓝色钴玻璃</b>——滤去 Na 杂质的黄光，才能看到 K 的紫色。勾选「透过钴玻璃观察」对比 K 火焰的变化。</p>`,
  enter() {
    Object.assign(FL, { elem: null, phase: 'idle', t: 0, glass: false, msg: '选择元素开始：灼烧 → 蘸取 → 观察 → 盐酸洗净' });
    setHud([['elem', '元素'], ['flame', '焰色'], ['glass', '钴玻璃'], ['st', '步骤']]);
    ctl.clear();
    ctl.seg({
      options: FL.elems.map((e) => ({ label: e.id, value: e.id })),
      value: '',
      onChange: (v) => flPick(v),
    });
    ctl.sep();
    ctl.toggle({ label: '透过钴玻璃观察', value: false, onChange: (v) => { FL.glass = v; if (hud) hud.set('glass', v ? '开' : '关'); } });
    ctl.button({ label: '盐酸洗净铂丝', onClick: () => { FL.elem = null; FL.phase = 'idle'; FL.msg = '铂丝已用盐酸洗净并灼烧——可蘸取下一种待测液'; } });
    if (hud) hud.set('glass', '关');
    chapterTick = (dt) => {
      FL.time += dt;
      if (FL.phase === 'dip') {
        FL.t += dt;
        if (FL.t >= 1) { FL.phase = 'burn'; FL.t = 0; FL.msg = '观察火焰颜色（K 需透过钴玻璃）'; }
      }
      drawFlameCh();
    };
    drawFlameCh();
  },
};
function flPick(id) {
  FL.elem = id;
  FL.phase = 'dip';
  FL.t = 0;
  FL.msg = '步骤② 蘸取待测液…';
}
function drawFlameCh() {
  drawLabBG();
  bench(640);
  // 酒精灯/煤气灯 + 火焰
  const bx = 380, by = 600;
  drawBurner(bx, by);
  const E = FL.elem ? FL.elems.find((e) => e.id === FL.elem) : null;
  let col = '#3f7fd9';
  if (E && FL.phase === 'burn') {
    col = E.color;
    if (E.id === 'K') col = FL.glass ? E.realColor : '#ffc63f';
    if (FL.glass && E.id !== 'K') col = mixHex(E.color, '#4a6fe0', 0.25);
  }
  drawFlame(bx, by - 70, FL.time, { color: col, h: 150, w: 44 });
  // 火星
  if (E && FL.phase === 'burn') {
    for (let i = 0; i < 5; i++) {
      const yy = (FL.time * 60 + i * 37) % 150;
      ctx.fillStyle = hexA(col, 0.7 * (1 - yy / 150));
      ctx.beginPath(); ctx.arc(bx + Math.sin(FL.time * 3 + i * 2) * 18, by - 80 - yy, 2, 0, 7); ctx.fill();
    }
  }
  // 铂丝
  const wx = FL.phase === 'dip' ? 560 - 40 * FL.t : bx + (FL.phase === 'burn' ? 6 : 120);
  const wy = FL.phase === 'dip' ? 620 - 30 * FL.t : by - 130;
  ctx.strokeStyle = '#c8ccd6';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(760, 330); ctx.lineTo(wx, wy); ctx.stroke();
  ctx.strokeStyle = '#e8ecf4';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(wx, wy, 7, 0, 7); ctx.stroke();
  txt('铂丝', 760, 312, { size: 11, color: '#9fb0c2' });
  // 待测液瓶
  drawBottle(560, 640, { w: 40, h: 50, fill: 'rgba(150,200,255,0.35)', label: '待测液', sel: FL.phase === 'dip' });
  // 步骤卡
  card(60, 60, 250, 190);
  txt('操作四步', 80, 90, { size: 14, bold: true, align: 'left', color: '#e8eef6', halo: null });
  const steps = [
    ['① 灼烧', FL.phase === 'idle' && !FL.elem],
    ['② 蘸取', FL.phase === 'dip'],
    ['③ 观察', FL.phase === 'burn'],
    ['④ 盐酸洗净', false],
  ];
  steps.forEach((s, i) => {
    const done = i < steps.findIndex((x) => x[1]) && steps.some((x) => x[1]);
    txt(s[0], 84, 122 + i * 30, {
      size: 13.5, align: 'left', bold: s[1],
      color: s[1] ? '#ffcf96' : done ? '#7fd6a4' : '#93a3b3', halo: null,
    });
  });
  // 观察卡
  card(740, 60, 512, 420);
  if (E) {
    txt(`${E.name}`, 764, 96, { size: 19, bold: true, align: 'left', color: '#e8eef6', halo: null });
    ctx.fillStyle = FL.phase === 'burn' ? (E.id === 'K' ? (FL.glass ? E.realColor : '#ffc63f') : E.color) : 'rgba(120,140,160,0.4)';
    ctx.beginPath(); ctx.roundRect(980, 82, 60, 24, 6); ctx.fill();
    txt('焰色', 1054, 94, { size: 12, color: '#9fb0c2', align: 'left', halo: null });
    ctx.strokeStyle = 'rgba(255,255,255,0.10)';
    ctx.beginPath(); ctx.moveTo(764, 122); ctx.lineTo(1228, 122); ctx.stroke();
    if (FL.phase === 'burn') {
      if (E.id === 'K') {
        wrapText(FL.glass
          ? '透过蓝色钴玻璃：滤去了黄光 → 火焰呈紫色 ⇒ K 元素 ✓'
          : '直接观察：只见黄光（铂丝与试剂带入的微量 Na 掩盖了 K 的紫色）。勾选「透过钴玻璃观察」再试。',
        764, 152, 450, 24, { size: 14, bold: true, align: 'left', color: FL.glass ? '#c9b0ff' : '#ffd98a', halo: null });
      } else {
        wrapText(`火焰呈${E.flame} ⇒ ${E.id} 元素 ✓`, 764, 152, 450, 24, { size: 14, bold: true, align: 'left', color: E.color, halo: null });
      }
    } else {
      wrapText(FL.phase === 'dip' ? '蘸取中……' : '已蘸取，置于火焰上灼烧观察', 764, 152, 450, 24, { size: 13.5, align: 'left', color: '#93a3b3', halo: null });
    }
    wrapText(E.note, 764, 226, 452, 22, { size: 13, align: 'left', color: '#c6d2df', halo: null });
  } else {
    wrapText('在下方控制条选择一种元素（Na / K / Ca / Cu / Sr / Ba），将自动完成「蘸取 → 灼烧观察」。', 764, 100, 450, 24, { size: 13.5, align: 'left', color: '#93a3b3', halo: null });
    wrapText('焰色反应是物理变化（原子外层电子受激发跃迁），可用于检验金属元素；观察 K 必须透过蓝色钴玻璃滤去 Na 的黄光。', 764, 200, 452, 22, { size: 12.5, align: 'left', color: '#9fb0c2', halo: null });
  }
  // 元素焰色速查
  txt('常见焰色：Na 黄 · K 紫（隔钴玻璃）· Ca 砖红 · Cu 绿 · Sr 洋红 · Ba 黄绿', 754, 448, { size: 12.5, color: '#8fa0b2', align: 'left', halo: null });
  pill(FL.msg, 410, 34);
  cobaltOverlay(FL.glass);
  if (hud) {
    hud.set('elem', E ? E.name : '—');
    hud.set('flame', E && FL.phase === 'burn' ? (E.id === 'K' && !FL.glass ? '黄光（被掩盖）' : E.flame) : '—');
    hud.set('glass', FL.glass ? '开' : '关');
    hud.set('st', { idle: '① 灼烧/待蘸取', dip: '② 蘸取', burn: '③ 观察' }[FL.phase] || '—');
  }
}

/* ================= 章节 8：鉴定一种未知的盐 ================= */

const SALTS = [
  { id: 'NaCl', name: 'NaCl', cat: 'Na', an: 'Cl', scheme: '取样溶解 → ① 焰色反应呈黄色（Na⁺）→ ② 加 AgNO₃：白色沉淀，加稀硝酸不溶解（Cl⁻）⇒ NaCl' },
  { id: 'KCl', name: 'KCl', cat: 'K', an: 'Cl', scheme: '取样溶解 → ① 焰色反应：直接看被黄光掩盖，透过蓝色钴玻璃呈紫色（K⁺）→ ② 加 AgNO₃：白色沉淀不溶于稀硝酸（Cl⁻）⇒ KCl' },
  { id: 'Na2SO4', name: 'Na₂SO₄', cat: 'Na', an: 'SO4', scheme: '取样溶解 → ① 焰色呈黄色（Na⁺）→ ② 先加稀盐酸：无沉淀（排除 CO₃²⁻ 干扰）→ ③ 加 BaCl₂：白色沉淀（SO₄²⁻）⇒ Na₂SO₄' },
  { id: 'NH42SO4', name: '(NH₄)₂SO₄', cat: 'NH4', an: 'SO4', scheme: '取样溶解 → ① 先加稀盐酸无沉淀，再加 BaCl₂：白色沉淀（SO₄²⁻）→ ② 加 NaOH 共热，湿润红色石蕊试纸变蓝（NH₄⁺）⇒ (NH₄)₂SO₄' },
  { id: 'Na2CO3', name: 'Na₂CO₃', cat: 'Na', an: 'CO3', scheme: '取样溶解 → ① 焰色呈黄色（Na⁺）→ ② 加稀盐酸：冒气泡，气体使石灰水变浑浊（CO₃²⁻）→ ③ 与 NaHCO₃ 区分：加 BaCl₂ 出白色沉淀（NaHCO₃ 无沉淀）⇒ Na₂CO₃' },
  { id: 'NaHCO3', name: 'NaHCO₃', cat: 'Na', an: 'HCO3', scheme: '① 加稀盐酸：冒气泡，石灰水变浑浊（HCO₃⁻）→ ② 加 BaCl₂：无沉淀（区别于 Na₂CO₃ 的 BaCO₃ 沉淀）→ ③ 焰色呈黄色（Na⁺）⇒ NaHCO₃' },
];
const SHELF = [
  { id: 'water', n: '蒸馏水' }, { id: 'hcl', n: '稀盐酸' }, { id: 'ba', n: 'BaCl₂' }, { id: 'ag', n: 'AgNO₃' },
  { id: 'hno3', n: '稀硝酸' }, { id: 'naoh', n: 'NaOH' }, { id: 'paper', n: '石蕊试纸' }, { id: 'wire', n: '铂丝+钴玻璃' },
];
const st8 = {
  salt: null, dissolved: false, pptFrom: null, naoh: false, log: [], sel: null, solved: false,
  fx: { ppt: null, bubbles: [] }, msg: '先取少量固体，加蒸馏水溶解后再检验', tries: 0,
};
function newSalt() {
  let s = SALTS[Math.floor(Math.random() * SALTS.length)];
  if (st8.salt && s.id === st8.salt.id) s = SALTS[(SALTS.indexOf(s) + 1) % SALTS.length];
  Object.assign(st8, {
    salt: s, dissolved: false, pptFrom: null, naoh: false, log: [], sel: null, solved: false,
    fx: { ppt: null, bubbles: [] }, msg: '未知白色固体 X——先加蒸馏水溶解，再规划检验顺序', tries: 0,
  });
}
st8.salt = SALTS[Math.floor(Math.random() * SALTS.length)];
function salt8Apply(reg) {
  const s = st8.salt;
  const isC = s.an === 'CO3' || s.an === 'HCO3';
  if (reg === 'water') {
    st8.dissolved = true;
    st8.log.push('＋蒸馏水 → 固体溶解，得无色溶液');
    st8.msg = '已溶解。接下来检验阴离子与阳离子（注意试剂顺序）';
    return;
  }
  if (reg === 'hcl') {
    if (isC) {
      st8.fx.bubbles = Array.from({ length: 6 }, (_, i) => ({ dx: Math.random() * 14 - 7, y: 8 + i * 13, r: 2 + Math.random() * 2 }));
      st8.log.push('＋稀盐酸 → 剧烈冒气泡，气体使澄清石灰水变浑浊');
      st8.msg = '冒气泡 ⇒ 含 CO₃²⁻ 或 HCO₃⁻（还需区分二者）';
    } else {
      st8.log.push(st8.dissolved ? '＋稀盐酸 → 无明显现象' : '＋稀盐酸 → 固体溶解，无明显现象');
      st8.msg = '加盐酸无气泡 ⇒ 不含 CO₃²⁻ / HCO₃⁻';
    }
    return;
  }
  if (reg === 'ba') {
    if (!st8.dissolved) { st8.msg = '固体未溶解，现象不可靠——请先加蒸馏水溶解'; return; }
    if (s.an === 'SO4') {
      st8.fx.ppt = { color: '#f0f0e6', k: 1 }; st8.pptFrom = 'ba';
      st8.log.push('＋BaCl₂ → 白色沉淀（BaSO₄，不溶于稀硝酸）');
    } else if (s.an === 'CO3') {
      st8.fx.ppt = { color: '#f0f0e6', k: 1 }; st8.pptFrom = 'ba';
      st8.log.push('＋BaCl₂ → 白色沉淀 BaCO₃（加稀硝酸会溶解冒泡）');
    } else if (s.an === 'HCO3') {
      st8.log.push('＋BaCl₂ → 无沉淀（Ba(HCO₃)₂ 可溶——这正是区分 Na₂CO₃ 与 NaHCO₃ 的方法）');
    } else {
      st8.log.push('＋BaCl₂ → 无明显现象');
    }
    return;
  }
  if (reg === 'ag') {
    if (!st8.dissolved) { st8.msg = '固体未溶解，现象不可靠——请先加蒸馏水溶解'; return; }
    if (s.an === 'Cl') {
      st8.fx.ppt = { color: '#f0f0e6', k: 1 }; st8.pptFrom = 'ag';
      st8.log.push('＋AgNO₃ → 白色沉淀（加稀硝酸验证是否溶解）');
    } else if (s.an === 'SO4') {
      st8.log.push('＋AgNO₃ → 无明显沉淀（Ag₂SO₄ 微溶，不用此法检验 SO₄²⁻）');
    } else {
      st8.fx.ppt = { color: '#f0f0e6', k: 1 }; st8.pptFrom = 'ag';
      st8.log.push('＋AgNO₃ → 白色沉淀（加稀硝酸溶解并冒气泡）');
    }
    return;
  }
  if (reg === 'hno3') {
    if (st8.pptFrom === 'ag') {
      if (s.an === 'Cl') st8.log.push('＋稀硝酸 → 白色沉淀不溶解 ⇒ AgCl，含 Cl⁻');
      else st8.log.push('＋稀硝酸 → 沉淀溶解并冒气泡 ⇒ 碳酸银（AgCl 不溶才说明含 Cl⁻）');
    } else if (st8.pptFrom === 'ba') {
      if (s.an === 'SO4') st8.log.push('＋稀硝酸 → 白色沉淀不溶解 ⇒ BaSO₄，含 SO₄²⁻');
      else st8.log.push('＋稀硝酸 → 沉淀溶解并冒气泡 ⇒ BaCO₃');
    } else {
      st8.log.push('＋稀硝酸 → 无明显现象');
    }
    return;
  }
  if (reg === 'naoh') {
    if (!st8.dissolved) { st8.msg = '固体未溶解，现象不可靠——请先加蒸馏水溶解'; return; }
    st8.naoh = true;
    if (s.cat === 'NH4') st8.log.push('＋NaOH（共热）→ 产生刺激性气味气体');
    else st8.log.push('＋NaOH → 无明显现象');
    return;
  }
  if (reg === 'paper') {
    if (!st8.naoh) { st8.msg = '检验 NH₄⁺：先加 NaOH 溶液共热，再把湿润红色石蕊试纸放管口'; return; }
    if (s.cat === 'NH4') st8.log.push('管口湿润红色石蕊试纸 → 变蓝 ⇒ 含 NH₄⁺');
    else st8.log.push('管口湿润红色石蕊试纸 → 不变蓝（无 NH₄⁺）');
    return;
  }
  if (reg === 'wire') {
    if (s.cat === 'Na') st8.log.push('焰色反应 → 黄色 ⇒ 含 Na⁺');
    else if (s.cat === 'K') st8.log.push('焰色反应 → 直接看黄光（Na 杂质掩盖）；透过蓝色钴玻璃 → 紫色 ⇒ 含 K⁺');
    else st8.log.push('焰色反应 → 无 Na / K 特征焰色（铵盐无焰色）');
    return;
  }
}
function draw8() {
  drawLabBG();
  bench(690);
  hits = hits.filter((h) => !h.id || (!h.id.startsWith('b') && !h.id.startsWith('a')));
  // 样品瓶 + 试管
  drawBottle(170, 620, { w: 44, h: 56, fill: 'rgba(232,230,222,0.9)', fillH: 0.32, label: '未知白色固体 X' });
  drawTube(320, 470, {
    w: 44, len: 150, liquid: st8.dissolved ? 'rgba(196,218,238,0.25)' : null,
    ppt: st8.fx.ppt, bubbles: st8.fx.bubbles,
  });
  txt('试管', 320, 646, { size: 11.5, color: '#9fb0c2' });
  // 试剂架（2 行 × 4）
  card(60, 200, 620, 260, { fill: 'rgba(15,21,30,0.85)' });
  txt('试剂架（点击试剂即滴加 / 操作）', 84, 228, { size: 13.5, bold: true, align: 'left', color: '#e8eef6', halo: null });
  SHELF.forEach((r, i) => {
    const x = 130 + (i % 4) * 150, y = i < 4 ? 330 : 430;
    drawBottle(x, y, { w: 56, h: 62, label: r.n });
    hits.push({ id: 'b' + r.id, x: x - 34, y: y - 90, w: 68, h: 100, cb: () => salt8Apply(r.id) });
  });
  // 结论候选
  card(60, 490, 620, 190);
  txt('我的结论（点选后提交）', 84, 518, { size: 13.5, bold: true, align: 'left', color: '#e8eef6', halo: null });
  SALTS.forEach((s, i) => {
    const x = 150 + (i % 3) * 190, y = 560 + Math.floor(i / 3) * 56;
    const sel = st8.sel === s.id;
    ctx.fillStyle = sel ? 'rgba(232,103,74,0.25)' : 'rgba(255,255,255,0.06)';
    ctx.strokeStyle = sel ? '#e8674a' : 'rgba(255,255,255,0.14)';
    ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.roundRect(x - 80, y - 18, 160, 38, 10); ctx.fill(); ctx.stroke();
    txt(s.name, x, y, { size: 14, bold: sel, color: sel ? '#ffd0a8' : '#c6d2df' });
    hits.push({ id: 'a' + s.id, x: x - 80, y: y - 18, w: 160, h: 38, cb: () => { if (!st8.solved) st8.sel = s.id; } });
  });
  // 右侧记录卡
  card(740, 52, 512, 620);
  txt('检验记录', 764, 84, { size: 15.5, bold: true, align: 'left', color: '#e8eef6', halo: null });
  let yy = 120;
  st8.log.forEach((s) => {
    yy = wrapText(s, 764, yy, 456, 21, { size: 13, align: 'left', color: '#d5dfe9', halo: null }) + 8;
  });
  if (!st8.log.length) wrapText('尚无操作记录。规划你的鉴定顺序：溶解 → 阴离子（CO₃²⁻/HCO₃⁻、SO₄²⁻、Cl⁻）→ 阳离子（Na⁺/K⁺ 焰色、NH₄⁺）。', 764, yy, 450, 21, { size: 12.5, align: 'left', color: '#93a3b3', halo: null });
  if (st8.solved) {
    ctx.strokeStyle = 'rgba(63,169,111,0.5)';
    ctx.beginPath(); ctx.moveTo(764, 470); ctx.lineTo(1228, 470); ctx.stroke();
    txt(`✓ 结论正确：${st8.salt.name}`, 764, 498, { size: 15, bold: true, align: 'left', color: '#7fd6a4', halo: null });
    wrapText('参考鉴定方案：', 764, 530, 456, 21, { size: 12.5, align: 'left', color: '#9fb0c2', halo: null });
    wrapText(st8.salt.scheme, 764, 556, 452, 21, { size: 12.5, align: 'left', color: '#c9e8d4', halo: null });
  } else if (st8.sel) {
    txt(`待提交结论：${SALTS.find((s) => s.id === st8.sel).name}`, 764, 640, { size: 13, color: '#ffd98a', align: 'left', halo: null });
  }
  pill(st8.msg, 420, 34);
}
const secSalt = {
  id: 'salt', title: '鉴定一种未知的盐',
  html: `<p>随机给出一种<b>白色固体</b>：NaCl / Na₂SO₄ / Na₂CO₃ / KCl / (NH₄)₂SO₄ / NaHCO₃ 之一。</p>
<p>自主规划检验顺序：<b>溶解 → 阴离子 → 阳离子</b>。点击试剂架即「滴加 / 操作」，系统只反馈<b>真实现象</b>：</p>
<p>• 稀盐酸冒气泡 ⇒ 碳酸盐 / 碳酸氢盐（BaCl₂ 沉淀区分二者）<br>
• 先盐酸后 BaCl₂ 白色沉淀 ⇒ SO₄²⁻；AgNO₃+稀硝酸白色沉淀不溶 ⇒ Cl⁻<br>
• NaOH 共热试纸变蓝 ⇒ NH₄⁺；焰色黄 / 隔钴玻璃紫 ⇒ Na⁺ / K⁺</p>
<p>点选结论候选 → 「提交结论」判定正误并给出参考方案；「换一试样」再练。</p>`,
  enter() {
    newSalt();
    setHud([['salt', '试样'], ['step', '已做操作'], ['sel', '当前结论']]);
    ctl.clear();
    ctl.button({ label: '提交结论', onClick: () => salt8Submit() });
    ctl.button({ label: '换一试样', onClick: () => newSalt() });
    ctl.button({
      label: '↺ 清空记录',
      onClick: () => {
        Object.assign(st8, { dissolved: false, pptFrom: null, naoh: false, log: [], sel: null, solved: false, fx: { ppt: null, bubbles: [] } });
        st8.msg = '已清空，重新规划';
      },
    });
    chapterTick = (dt) => {
      st8.fx.bubbles.forEach((b) => { b.y += 26 * dt; if (b.y > 110) b.y = 6; });
      draw8();
    };
    draw8();
  },
};
function salt8Submit() {
  if (!st8.sel) { st8.msg = '先在左下角点选一种结论'; return; }
  st8.tries++;
  if (st8.sel === st8.salt.id) {
    st8.solved = true;
    st8.msg = `✓ 正确！这就是 ${st8.salt.name}（${st8.tries} 次尝试）`;
  } else {
    st8.msg = '✗ 不正确——对照左侧「检验记录」里的现象再推理，或换一试样重练';
  }
}

/* ================= 章节 9：随堂检测 ================= */

const QUIZ = [
  {
    q: '用 0.1000 mol/L NaOH 标准液滴定 20.00 mL 未知浓度盐酸（酚酞作指示剂），消耗 NaOH 18.20 mL，则 c(HCl) = ？',
    opts: ['0.0910 mol/L', '0.09100 mol/L', '0.1099 mol/L', '0.1820 mol/L'],
    a: 1,
    ex: 'c(HCl) = c(NaOH)·V(NaOH)/V(HCl) = 0.1000×18.20/20.00 = 0.09100 mol/L（滴定计算保留 4 位有效数字）。',
  },
  {
    q: '强碱滴定强酸，下列指示剂中不宜选用的是？',
    opts: ['酚酞', '甲基橙', '石蕊', '酚酞和甲基橙都可'],
    a: 2,
    ex: '石蕊变色范围 5.0~8.0 太宽，且红→紫→蓝的过渡颜色难以观察，滴定误差大——中和滴定不用石蕊。',
  },
  {
    q: '下列操作会导致测定结果「偏高」的是？',
    opts: ['滴定管未用标准液润洗', '锥形瓶内有少量蒸馏水', '滴定中锥形瓶内液体溅出', '滴定终点时俯视读数'],
    a: 0,
    ex: '未润洗 → 标准液被残留水稀释 → V(NaOH) 偏大 → 偏高。B 无影响；C 偏低；滴定管俯视读数偏小 → 偏低。',
  },
  {
    q: '向某溶液中加入 NaOH 溶液，产生白色沉淀，沉淀迅速变灰绿色，最后变红褐色。该溶液含有的离子是？',
    opts: ['Cu²⁺', 'Fe³⁺', 'Fe²⁺', 'NH₄⁺'],
    a: 2,
    ex: 'Fe(OH)₂ 白色 → 灰绿色 → 红褐色 Fe(OH)₃（被 O₂ 氧化），这是 Fe²⁺ 的特征现象。',
  },
  {
    q: '焰色反应观察钾元素时必须「透过蓝色钴玻璃」，目的是？',
    opts: ['使火焰燃烧更充分', '滤去黄光，排除钠杂质干扰', '给火焰降温', '增强紫色光强度'],
    a: 1,
    ex: '钴玻璃吸收黄光：试剂和铂丝难免带入微量 Na，其黄色火焰会掩盖 K 的紫色，滤去黄光才能看清。',
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
    const card_ = document.createElement('div');
    card_.className = 'quiz-card';
    card_.innerHTML = `
      <div class="q-progress">第 ${idx + 1} / ${QUIZ.length} 题</div>
      <h3></h3>
      <div class="q-opts"></div>
      <div class="q-explain"></div>
      <div class="q-foot"><span class="q-score">得分：${score}</span></div>`;
    card_.querySelector('h3').textContent = item.q;
    const optsBox = card_.querySelector('.q-opts');
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
        const ex = card_.querySelector('.q-explain');
        ex.textContent = (correct ? '✓ 回答正确。' : '✗ 再想想。') + item.ex;
        ex.classList.add('show');
        card_.querySelector('.q-score').textContent = `得分：${score}`;
        const foot = card_.querySelector('.q-foot');
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
    panel.appendChild(card_);
  }
  function renderResult() {
    panel.innerHTML = '';
    const card_ = document.createElement('div');
    card_.className = 'quiz-card q-result';
    const pct = Math.round((score / QUIZ.length) * 100);
    card_.innerHTML = `
      <div class="q-progress">检测完成</div>
      <div class="big">${score} / ${QUIZ.length}</div>
      <p style="color:var(--text-dim);margin:4px 0 18px">正确率 ${pct}%${pct >= 80 ? '，滴定台上你已经很稳了！' : pct >= 60 ? '，基本概念清楚了，回看错题对应的章节。' : '，建议回到滴定与离子检验章节再操作一遍。'}</p>`;
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
    card_.appendChild(row);
    panel.appendChild(card_);
  }
  renderQ();
  activeCleanup = () => panel.remove();
}
const secQuiz = {
  id: 'quiz', title: '随堂检测',
  html: `<p>5 道题：中和滴定计算、指示剂选择、误差判断、离子检验与焰色操作。答完可重新开始。</p>`,
  enter() {
    setHud(null);
    ctl.clear();
    drawLabBG();
    bench();
    drawStand(340, 690, 160, [{ y: 200, x: 420 }]);
    drawBurette(420, 120, { style: 'base', level: 0.08, liquid: 'rgba(150,200,255,0.22)' });
    drawFlask(420, 640, { s: 0.85, liquidH: 50, color: 'rgba(238,110,160,0.35)' });
    txt('c(HCl) = c(NaOH)·V(NaOH)/V(HCl)', 900, 620, { size: 15, color: 'rgba(255,233,176,0.5)' });
    showQuiz();
  },
};

/* ---------------- 启动 ---------------- */

const SECTIONS = [secTools, secTitr, secCurve, secErr, secCation, secAnion, secFlame, secSalt, secQuiz];

const sections = createSections({
  nav: document.getElementById('sideNav'),
  descPanel: document.getElementById('descPanel'),
  sections: SECTIONS,
  onSelect(i, sec) {
    if (activeCleanup) { activeCleanup(); activeCleanup = null; }
    chapterTick = null;
    hits = [];
    setHud(null);
    canvas.style.cursor = 'default';
    if (sec.leave) sec.leave();
    sec.enter();
  },
});
window.__eduSections = sections;
window.__anl = {
  tit,
  phAt: phAtTit,
  ve: () => tit.cA * 20.00 / 0.1000,
  jump(v) { tit.vAdd = v; checkObs(); },
  records: () => ({ init: tit.init, final: tit.final, V: tit.V, c: tit.c, phase: tit.phase, cA: tit.cA }),
};
sections.select(0);

let lastTs = 0;
function appLoop(ts) {
  requestAnimationFrame(appLoop);
  const dt = Math.min((ts - lastTs) / 1000 || 0.016, 0.1);
  lastTs = ts;
  if (chapterTick) chapterTick(dt);
}
requestAnimationFrame(appLoop);
