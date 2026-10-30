/* EduLab · 勾股定理实验室（pythagoras）
 * 章节：拼图挑战 / 出入相补 / 欧几里得的证明 / 更多证法 / 倒水 / 勾股数 / 随堂检测
 * 实现：2D canvas 几何作图 + 多边形裁剪（倒水）+ 拼图拖拽（出入相补/弦图）。
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

const palette = {};
function refreshPalette() {
  const cs = getComputedStyle(document.documentElement);
  palette.bg = cs.getPropertyValue('--bg').trim() || '#f5f6f8';
  palette.text = cs.getPropertyValue('--text').trim() || '#2a3441';
  palette.dim = cs.getPropertyValue('--text-dim').trim() || '#66717e';
  palette.faint = cs.getPropertyValue('--text-faint').trim() || '#98a2ad';
  palette.accent = cs.getPropertyValue('--accent').trim() || '#e8674a';
  palette.dark = document.documentElement.getAttribute('data-theme') === 'dark';
  palette.grid = palette.dark ? 'rgba(255,255,255,0.07)' : 'rgba(20,32,44,0.08)';
}
refreshPalette();
window.addEventListener('edulabtheme', refreshPalette);

const C = { blue: '#4a90d9', green: '#3fa96f', purple: '#9b6fd9', gold: '#d9a13f', teal: '#2fb3a5', red: '#d9534f', water: '#4aa3e8', waterDeep: '#2f7fc4' };
const ACCENTS = ['rgba(232,103,74,0.30)', 'rgba(74,144,217,0.30)', 'rgba(63,169,111,0.30)', 'rgba(155,111,217,0.30)'];

/* ---------------- 世界坐标板（每章自定中心与比例） ---------------- */

const view = { cx: 0, cy: 0, scale: 60, yUp: true };
function setBoard(cx, cy, scale) { view.cx = cx; view.cy = cy; view.scale = scale; }
function W2S(x, y) {
  const vw = canvas.width / DPR, vh = canvas.height / DPR;
  return [vw / 2 + (x - view.cx) * view.scale, vh / 2 - (y - view.cy) * view.scale];
}
function S2W(sx, sy) {
  const vw = canvas.width / DPR, vh = canvas.height / DPR;
  return [(sx - vw / 2) / view.scale + view.cx, -(sy - vh / 2) / view.scale + view.cy];
}

function clearCanvas() {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.fillStyle = palette.bg;
  ctx.fillRect(0, 0, canvas.width / DPR, canvas.height / DPR);
}
function grid() {
  const vw = canvas.width / DPR, vh = canvas.height / DPR;
  const step = view.scale > 90 ? 0.5 : view.scale > 45 ? 1 : 2;
  const [wx0, wy1] = S2W(0, 0), [wx1, wy0] = S2W(vw, vh);
  ctx.strokeStyle = palette.grid;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = Math.floor(wx0); x <= wx1; x += step) { const [sx] = W2S(x, 0); ctx.moveTo(sx, 0); ctx.lineTo(sx, vh); }
  for (let y = Math.floor(wy0); y <= wy1; y += step) { const [, sy] = W2S(0, y); ctx.moveTo(0, sy); ctx.lineTo(vw, sy); }
  ctx.stroke();
}
function poly(pts, fill, opts = {}) {
  ctx.save();
  ctx.beginPath();
  pts.forEach(([x, y], i) => {
    const [sx, sy] = W2S(x, y);
    i ? ctx.lineTo(sx, sy) : ctx.moveTo(sx, sy);
  });
  ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (opts.stroke !== false) {
    ctx.strokeStyle = opts.color || palette.dim;
    ctx.lineWidth = opts.width || 2;
    ctx.setLineDash(opts.dash || []);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.restore();
}
function seg(x1, y1, x2, y2, color, opts = {}) {
  const [ax, ay] = W2S(x1, y1), [bx, by] = W2S(x2, y2);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = opts.width || 1.8;
  ctx.setLineDash(opts.dash || []);
  ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
  ctx.restore();
}
function dot(x, y, color, r = 4) {
  const [sx, sy] = W2S(x, y);
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.fill();
}
function label(text, x, y, color, opts = {}) {
  const [sx, sy] = W2S(x, y);
  ctx.font = (opts.bold ? '600 ' : '') + (opts.size || 13) + 'px -apple-system, "PingFang SC", sans-serif';
  ctx.textAlign = opts.align || 'center';
  ctx.textBaseline = opts.baseline || 'middle';
  ctx.lineWidth = 3.5;
  ctx.strokeStyle = opts.halo || palette.bg;
  ctx.strokeText(text, sx + (opts.dx || 0), sy + (opts.dy || 0));
  ctx.fillStyle = color;
  ctx.fillText(text, sx + (opts.dx || 0), sy + (opts.dy || 0));
}
function centroid(pts) {
  let x = 0, y = 0;
  pts.forEach(([px, py]) => { x += px; y += py; });
  return [x / pts.length, y / pts.length];
}
function movePoly(pts, dx, dy) { return pts.map(([x, y]) => [x + dx, y + dy]); }

/* ---------------- 平移 / 缩放 ---------------- */

const pointers = new Map();
let pinchD0 = 0, pinchS0 = 1;
canvas.addEventListener('pointerdown', (e) => {
  canvas.setPointerCapture(e.pointerId);
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    pinchD0 = Math.hypot(a.x - b.x, a.y - b.y); pinchS0 = view.scale;
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
    if (pinchD0 > 0) view.scale = Math.min(200, Math.max(16, pinchS0 * d / pinchD0));
    return;
  }
  if (chapterDrag && chapterDrag(e, dx, dy)) return;
  view.cx -= dx / view.scale;
  view.cy += dy / view.scale;
});
let chapterPointerUp = null;
function endPointer(e) {
  pointers.delete(e.pointerId);
  if (pointers.size < 2) pinchD0 = 0;
  if (chapterPointerUp) chapterPointerUp(e);
}
canvas.addEventListener('pointerup', endPointer);
canvas.addEventListener('pointercancel', endPointer);
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  view.scale = Math.min(200, Math.max(16, view.scale * Math.exp(-e.deltaY * 0.0016)));
}, { passive: false });

/* ---------------- 章节框架 ---------------- */

const ctl = createControlsPanel(document.getElementById('controls'));
let chapterDrag = null;
let chapterTick = null;
let activeCleanup = null;
chapterPointerUp = null;
const hud = makeHUD(stage, [['v1', '读数'], ['v2', ''], ['v3', '']]);
hud.show(false);

/* ================= 工具：三角形布局生成 ================= */

// 直角三角形：直角顶点 (0,0)，短腿 a 沿 +x，长腿 b 沿 +y
function triPts(a, b) { return [[0, 0], [a, 0], [0, b]]; }

/** 4 个全等三角形 + 小方块的「弦图拼图」目标位（外方边长 c，原点在左下，y 向上） */
function puzzleTargets(a, b) {
  const c = Math.hypot(a, b);
  const t1 = [[0, 0], [b, 0], [b, a]].map(([x, y]) => [x, c - y]);      // 翻到 y-up
  const t2 = [[c, 0], [c, b], [c - a, b]].map(([x, y]) => [x, c - y]);
  const t3 = [[c, c], [c - b, c], [c - b, c - a]].map(([x, y]) => [x, c - y]);
  const t4 = [[0, c], [0, c - b], [a, c - b]].map(([x, y]) => [x, c - y]);
  const s = b - a, u = [-a / c, b / c], v = [b / c, a / c];
  const cen = [c / 2, c / 2];
  const sq = [
    [cen[0] + s / 2 * u[0] + s / 2 * v[0], cen[1] + s / 2 * u[1] + s / 2 * v[1]],
    [cen[0] - s / 2 * u[0] + s / 2 * v[0], cen[1] - s / 2 * u[1] + s / 2 * v[1]],
    [cen[0] - s / 2 * u[0] - s / 2 * v[0], cen[1] - s / 2 * u[1] - s / 2 * v[1]],
    [cen[0] + s / 2 * u[0] - s / 2 * v[0], cen[1] + s / 2 * u[1] - s / 2 * v[1]],
  ];
  return [t1, t2, t3, t4, sq];
}

/* ================= 章节 1：拼图挑战 ================= */

const pz = { a: 3, b: 4, pieces: [], locked: 0, dragIdx: -1, animIdx: -1, animT: 0, done: false };

function puzzleScatter() {
  const [t1, t2, t3, t4, sq] = puzzleTargets(pz.a, pz.b);
  const c = Math.hypot(pz.a, pz.b);
  const offs = [[c + 2.2, 0.4], [c + 2.2, c + 1.2], [-2.8, c + 1.2], [-2.8, 0.4], [c + 2.2, c / 2]];
  const src = [t1, t2, t3, t4, sq];
  pz.pieces = src.map((pts, i) => ({
    target: pts,
    pos: movePoly(pts, offs[i][0], offs[i][1] - centroid(pts)[1]),
    locked: false,
    color: ACCENTS[i],
  }));
  pz.locked = 0; pz.done = false; pz.animIdx = -1;
  const ext = c + 5;
  setBoard(ext / 2 - 0.8, c / 2, Math.min(52, 560 / ext));
}
function puzzleDrop() {
  if (pz.dragIdx >= 0) {
    puzzleSnapCheck();
    pz.dragIdx = -1;
    canvas.style.cursor = 'grab';
  }
}

function puzzleSnapCheck() {
  pz.pieces.forEach((p, i) => {
    if (p.locked) return;
    const [pcx, pcy] = centroid(p.pos), [tcx, tcy] = centroid(p.target);
    const tol = Math.max(0.55, Math.hypot(pz.a, pz.b) * 0.09);
    if (Math.hypot(pcx - tcx, pcy - tcy) < tol) {
      p.locked = true;
      p.pos = p.target.map(([x, y]) => [x, y]);
      pz.locked++;
      if (pz.locked === 5) pz.done = true;
    }
  });
}

const secPuzzle = {
  id: 'puzzle', title: '拼图挑战',
  html: `<p>目标是中间的 <b>斜边正方形 c²</b>：把右边的碎片——<b>4 个全等直角三角形</b>和 1 个小正方形（边长 b−a）——<b>拖</b>进大正方形里拼满它。</p>
<p>拼满的一刻你会发现：4 个三角形的面积 = 4 × ½ab，小正方形面积 = (b−a)²，正好铺满 c²：</p>
<p><span class="hl">c² = 4·½ab + (b−a)² = 2ab + a² − 2ab + b² = a² + b²</span></p>
<p>这就是<b>赵爽弦图</b>的拼法（东汉·《周髀算经》注）。拖到目标附近会自动吸附；点「自动演示」看机器人拼一遍；切换不同勾股数再试。</p>`,
  enter() {
    Object.assign(pz, { a: 3, b: 4, locked: 0, dragIdx: -1, done: false });
    puzzleScatter();
    chapterPointerUp = puzzleDrop;
    chapterDrag = (e, dx, dy) => {
      const rect = canvas.getBoundingClientRect();
      const [wx, wy] = S2W(e.clientX - rect.left, e.clientY - rect.top);
      if (pz.dragIdx >= 0) {
        const p = pz.pieces[pz.dragIdx];
        if (!p.locked) p.pos = movePoly(p.pos, dx / view.scale, -dy / view.scale);
        return true;
      }
      // 起手：拾取未锁定的碎片（拾取当次也应用位移，避免丢首帧 delta）
      for (let i = pz.pieces.length - 1; i >= 0; i--) {
        const p = pz.pieces[i];
        if (p.locked) continue;
        if (pointInPoly(wx, wy, p.pos)) {
          pz.dragIdx = i;
          canvas.style.cursor = 'grabbing';
          p.pos = movePoly(p.pos, dx / view.scale, -dy / view.scale);
          return true;
        }
      }
      return false;
    };
    hud.show(true);
    ctl.clear();
    ctl.seg({
      options: [{ label: '3,4,5', value: '3,4' }, { label: '6,8,10', value: '6,8' }, { label: '5,12,13', value: '5,12' }],
      value: '3,4',
      onChange: (v) => { const [a, b] = v.split(',').map(Number); pz.a = a; pz.b = b; puzzleScatter(); },
    });
    ctl.sep();
    const demoBtn = ctl.button({
      label: '▶ 自动演示',
      onClick() {
        if (pz.animIdx === -1) { pz.animIdx = 0; pz.animT = 0; demoBtn.textContent = '⏸ 演示中'; }
        else { pz.animIdx = -1; demoBtn.textContent = '▶ 自动演示'; }
      },
    });
    ctl.button({
      label: '↺ 打乱重来',
      onClick() { puzzleScatter(); demoBtn.textContent = '▶ 自动演示'; },
    });
    chapterTick = (dt) => {
      if (pz.animIdx >= 0) {
        pz.animT += dt / 0.7;
        const i = pz.animIdx;
        const p = pz.pieces[i];
        if (p && !p.locked) {
          const k = Math.min(1, pz.animT);
          const e = 1 - Math.pow(1 - k, 3);
          const from = centroid(p.pos), to = centroid(p.target);
          const cur = [from[0] + (to[0] - from[0]) * e - (k < 1 ? 0 : 0), from[1] + (to[1] - from[1]) * e];
          const shift = [cur[0] - centroid(p.pos)[0], cur[1] - centroid(p.pos)[1]];
          p.pos = movePoly(p.pos, shift[0], shift[1]);
          if (k >= 1) { puzzleSnapCheck(); pz.animIdx++; pz.animT = 0; }
        } else { pz.animIdx++; pz.animT = 0; }
        if (pz.animIdx >= 5) { pz.animIdx = -1; demoBtn.textContent = '▶ 自动演示'; }
      }
      drawPuzzle();
    };
    drawPuzzle();
  },
  leave() { canvas.style.cursor = 'grab'; },
};

function pointInPoly(x, y, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function drawPuzzle() {
  const c = Math.hypot(pz.a, pz.b);
  clearCanvas();
  grid();
  const outline = [[0, 0], [c, 0], [c, c], [0, c]];
  poly(outline, null, { color: palette.text, width: 2.4 });
  label(`c²（${pz.a * pz.a + pz.b * pz.b}）`, c / 2, c + 0.5, palette.dim, { size: 12.5 });
  pz.pieces.forEach((p, i) => {
    poly(p.pos, p.locked ? p.color : palette.dark ? 'rgba(255,255,255,0.10)' : 'rgba(20,32,44,0.10)',
      { color: p.locked ? palette.dim : palette.text, width: p.locked ? 1.2 : 1.8, dash: p.locked ? [] : [5, 4] });
    if (!p.locked) {
      const [cx, cy] = centroid(p.pos);
      label(['甲', '乙', '丙', '丁', '戊'][i], cx, cy, palette.dim, { size: 13, bold: true });
    }
  });
  if (pz.done) {
    label(`✓ 拼满！c² = 4×½×${pz.a}×${pz.b} + (${pz.b - pz.a})² = ${pz.a}² + ${pz.b}² = ${c * c}`,
      c / 2, -1.2, C.green, { size: 15, bold: true });
  }
  hud.set('v1', `已拼 ${pz.locked} / 5 块`);
  hud.set('v2', `a=${pz.a}  b=${pz.b}  c=${c}`);
  hud.set('v3', pz.done ? 'a² + b² = c² ✓' : '拖动碎片进大正方形');
}

/* ================= 章节 2：出入相补 ================= */

const cb = { a: 3, b: 4, t: 0, step: 0, moving: false };

function chuBuConfigs(a, b) {
  const S = a + b;
  // 配置 A：四三角形（顶点序：直角点 → a 端 → b 端）
  const A = [
    [[0, 0], [0, a], [b, 0]],
    [[S, 0], [S, a], [b, 0]],
    [[S, S], [a, S], [S, a]],
    [[0, S], [b, S], [0, a]],
  ];
  // 配置 B：两条矩形各沿对角线切成两个三角形
  const B = [
    [[S, a], [S, S], [b, a]],          // ← T1 去右上矩形
    [[b, 0], [b, a], [0, 0]],          // ← T2
    [[0, a], [0, 0], [b, a]],          // ← T3
    [[b, S], [b, a], [S, S]],          // ← T4
  ];
  const cSq = [[b, 0], [S, b], [a, S], [0, b]];
  return { A, B, cSq, S };
}

const secChubu = {
  id: 'chubu', title: '出入相补',
  html: `<p>刘徽的<b>出入相补原理</b>（公元 263 年，《九章算术》注）：图形经过割补拼接，<b>总面积不变</b>。</p>
<p>大正方形边长 (a+b)，面积 (a+b)²。<b>配置一</b>：4 个直角三角形摆在四角，剩下的空隙是一个斜放的正方形——面积恰好 c²。<b>配置二</b>：同样的 4 个三角形重新排列，空隙变成两个方方正正的正方形——a² 和 b²。</p>
<p>三角形没多没少，空隙面积当然相等：<span class="hl">c² = a² + b²</span>。点「移动一块」逐步把三角形从配置一搬到配置二，亲自完成这次"出入相补"。</p>`,
  enter() {
    Object.assign(cb, { a: 3, b: 4, t: 0, step: 0, moving: false });
    setBoard((3 + 4) / 2, (3 + 4) / 2, 40);
    chapterDrag = null;
    hud.show(true);
    ctl.clear();
    ctl.seg({
      options: [{ label: '3,4,5', value: '3,4' }, { label: '5,12,13', value: '5,12' }, { label: '8,15,17', value: '8,15' }],
      value: '3,4',
      onChange: (v) => { const [a, b] = v.split(',').map(Number); cb.a = a; cb.b = b; cb.step = 0; cb.t = 0; setBoard((a + b) / 2, (a + b) / 2, 300 / (a + b) / 1.15); },
    });
    ctl.sep();
    ctl.button({
      label: '移动一块 →',
      onClick() { if (cb.step < 4) { cb.step++; cb.t = 0; cb.moving = true; } },
    });
    ctl.button({
      label: '← 退回一块',
      onClick() { if (cb.step > 0) { cb.step--; cb.t = 0; cb.moving = true; } },
    });
    ctl.toggle({ label: '辅助线', value: true, onChange: (v) => { cb.guides = v; } });
    cb.guides = true;
    chapterTick = (dt) => {
      if (cb.moving) {
        cb.t += dt / 0.6;
        if (cb.t >= 1) { cb.t = 1; cb.moving = false; }
      }
      drawChubu();
    };
    drawChubu();
  },
};

function drawChubu() {
  const { a, b, step, t } = cb;
  const { A, B, cSq, S } = chuBuConfigs(a, b);
  clearCanvas();
  grid();
  poly([[0, 0], [S, 0], [S, S], [0, S]], null, { color: palette.text, width: 2.4 });
  const e = cb.moving ? 1 - Math.pow(1 - Math.min(1, t), 3) : 1;
  // 空隙高亮：step 完成数决定显示 c² 还是 a²/b²
  const [tcx, tcy] = centroid(cSq);
  if (cb.guides) {
    if (step === 0 && !cb.moving) {
      poly(cSq, 'rgba(63,169,111,0.14)', { color: C.green, width: 2, dash: [6, 4] });
      label(`剩余 = c² = ${a * a + b * b}`, tcx, tcy, C.green, { size: 14, bold: true });
    } else if (step === 4 && !cb.moving) {
      poly([[0, 0], [b, 0], [b, b], [0, b]], 'rgba(74,144,217,0.12)', { color: C.blue, width: 2, dash: [6, 4] });
      poly([[b, 0], [S, 0], [S, a], [b, a]], 'rgba(155,111,217,0.12)', { color: C.purple, width: 2, dash: [6, 4] });
      label(`b² = ${b * b}`, b / 2, b / 2, C.blue, { size: 14, bold: true });
      label(`a² = ${a * a}`, b + a / 2, a / 2, C.purple, { size: 14, bold: true });
      label(`剩余 = a² + b² = ${a * a + b * b}`, S / 2, -1, palette.text, { size: 14, bold: true });
    }
  }
  A.forEach((tri, i) => {
    // 前 step 块已到位（插值向 B[i]），其余在 A 位
    const dst = i < step ? B[i] : A[i];
    const src = i < step ? A[i] : A[i];
    const moving = i === step && cb.moving;
    const from = moving ? A[i] : src;
    const to = moving ? B[i] : dst;
    const pts = from.map(([x, y], k) => [x + (to[k][0] - x) * (moving ? e : 1), y + (to[k][1] - y) * (moving ? e : 1)]);
    poly(pts, ACCENTS[i], { color: palette.dim, width: 1.6 });
  });
  // 面积恒等式
  const eq = step < 4 && !cb.moving && step === 0
    ? `(a+b)² = c² + 4×½ab`
    : step === 4 && !cb.moving ? `(a+b)² = a² + b² + 4×½ab` : '三角形搬运中…';
  label(eq, S / 2, S + 1.1, palette.dim, { size: 13 });
  if (step === 4 && !cb.moving) label('两个空隙一样大 → c² = a² + b²', S / 2, -1, C.green, { size: 15, bold: true });
  hud.set('v1', `已搬 ${step} / 4 块`);
  hud.set('v2', `(a+b)² = ${S * S}`);
  hud.set('v3', `a²+b² = ${a * a + b * b} = c²`);
}

/* ================= 章节 3：欧几里得的证明 ================= */

const eu = { a: 3, b: 4, step: 0, t: 1, playing: false };

function euclidLayout(a, b) {
  // 直角三角形 A(0,0) B(b,0) C(0,a)；三侧正方形向外
  return { A: [0, 0], B: [b, 0], C: [0, a] };
}

const secEuclid = {
  id: 'euclid', title: '欧几里得的证明',
  html: `<p>《几何原本》命题 I.47（约公元前 300 年）：直角三角形斜边上的正方形 = 两直角边上的正方形之和。</p>
<p>关键一步是<b>剪切变换（出入相补的极端形式）</b>：b² 正方形先剪切变成同底等高的平行四边形（面积不变），再剪切一次落到斜边上的矩形里——面积仍不变。这个矩形恰好是 c² 正方形被「BC 的延长线」分出的一半。</p>
<p>六步演示：① 全图 → ② 连辅助线 → ③ 剪切 b² → ④ 落到斜边 → ⑤ 剪切 a² → ⑥ 合并结论。每一步面积都严格守恒。</p>`,
  enter() {
    Object.assign(eu, { a: 3, b: 4, step: 0, t: 1, playing: false });
    setBoard(2.1, 1.6, Math.min(760 / (4 + 3 * 4), 560 / (3 + 4 + 2.5)));
    chapterDrag = null;
    hud.show(true);
    ctl.clear();
    ctl.seg({
      options: [{ label: '3,4,5', value: '3,4' }, { label: '5,12,13', value: '5,12' }],
      value: '3,4',
      onChange: (v) => { const [a, b] = v.split(',').map(Number); eu.a = a; eu.b = b; eu.step = 0; eu.t = 1; eu.playing = false; setBoard(b * 0.62 - a * 0.38, (a - b) * 0.42, Math.min(760 / (a + 2 * b + 3), 560 / (a + b + 2))); },
    });
    ctl.sep();
    const playBtn = ctl.button({
      label: '▶ 自动播放',
      onClick() { eu.playing = !eu.playing; playBtn.classList.toggle('active', eu.playing); },
    });
    ctl.button({ label: '下一步 →', onClick() { eu.step = Math.min(6, eu.step + 1); eu.t = 0; } });
    ctl.button({ label: '← 上一步', onClick() { eu.step = Math.max(0, eu.step - 1); eu.t = 1; } });
    chapterTick = (dt) => {
      if (eu.playing) {
        eu.t += dt / 1.1;
        if (eu.t >= 1) { eu.t = 0; eu.step++; if (eu.step > 6) { eu.step = 0; eu.t = 1; eu.playing = false; playBtn.classList.remove('active'); } }
      } else if (eu.t < 1) eu.t = Math.min(1, eu.t + dt / 0.5);
      drawEuclid();
    };
    drawEuclid();
  },
};

function drawEuclid() {
  const { a, b, step, t } = eu;
  const c = Math.hypot(a, b);
  const A = [0, 0], B = [b, 0], Cc = [0, a];
  // c² 正方形（斜边外侧）：顶点 B, C, C+(a,b), B+(a,b)
  const Cq = [[B[0], B[1]], [Cc[0], Cc[1]], [a, a + b], [a + b, b]];
  clearCanvas();
  grid();
  const e = 1 - Math.pow(1 - Math.min(1, t), 3);
  const showAll = step === 0;
  // 三角形
  poly([A, B, Cc], 'rgba(232,103,74,0.25)', { color: palette.accent, width: 2 });
  label('直角三角形', b * 0.28, a * 0.42, palette.accent, { size: 11.5, bold: true });
  // c² 恒在（step≥0）
  poly(Cq, showAll || step >= 1 ? 'rgba(63,169,111,0.16)' : null, { color: C.green, width: 2 });
  label(`c² = ${c * c}`, (a + b) / 2 + a * 0.18, (a + b) / 2 + b * 0.18, C.green, { size: 13, bold: true });
  // 辅助线（step≥1）：BC 延长线 & 顶点连线
  if (step >= 1) {
    // 过 C 平行于 AB 的线 与 过 B 平行于 AC 的线（剪切参考线）
    seg(-a * 1.1, a, (a + b) * 1.15, a, palette.faint, { dash: [5, 4], width: 1.2 });
    seg(b, -b * 1.1, b, (a + b) * 0.9, palette.faint, { dash: [5, 4], width: 1.2 });
    // D = BC 延长线与过 B 竖线交点（用于标记矩形分界）
    seg(Cc[0], Cc[1], a + b, b, palette.accent, { width: 2 }); // BC 延长（把 c² 切成两块矩形）
  }
  // b² → 剪切成平行四边形（step 2 动画；step≥3 淡出表示已搬走）
  if (step < 4) {
    const k = step === 2 ? e : step >= 3 ? 1 : 0;
    const para = [[0, 0], [b, 0], [b + k * b, -b], [k * b, -b]];
    poly(para, step >= 3 ? 'rgba(74,144,217,0.07)' : 'rgba(74,144,217,0.16)', { color: C.blue, width: 2 });
    label('b²', b * 0.5 + k * b * 0.5, -b * 0.5, C.blue, { size: 13, bold: true });
    if (step === 2 && k > 0.05) label('剪切①：同底等高，面积不变', b + k * b + 0.4, -b * 0.5, palette.dim, { size: 11, align: 'left' });
  }
  // a² → 剪切成平行四边形（step 4 动画；step≥5 淡出）
  if (step < 6) {
    const k = step === 4 ? e : step >= 5 ? 1 : 0;
    const para = [[-a, 0], [0, 0], [0, a], [-a + k * a, a]];
    poly(para, step >= 5 ? 'rgba(155,111,217,0.07)' : 'rgba(155,111,217,0.16)', { color: C.purple, width: 2 });
    label('a²', -a * 0.5 + k * a * 0.5, a * 0.5, C.purple, { size: 13, bold: true });
    if (step === 4 && k > 0.05) label('剪切②', -a + k * a - 0.4, a * 1.15, palette.dim, { size: 11, align: 'right' });
  }
  // step≥5：c² 内两块落位矩形高亮（BC 延长线切开的下半块 = b² 的落位）
  if (step >= 5) {
    poly([B, [a + b, b], [a, a + b], Cc], 'rgba(74,144,217,0.10)', { color: C.blue, width: 1.6, dash: [5, 4] });
    label('下半块 ← b² 的面积', (a + b) / 2 + 0.75, b / 2 + a * 0.28, C.blue, { size: 11.5, bold: true });
    label('上半块 ← a² 的面积', a / 2 - 0.2, (a + b) / 2 + a * 0.45, C.purple, { size: 11.5, bold: true });
  }
  if (step >= 6) {
    label(`→ c² = a² + b² = ${a * a} + ${b * b} = ${a * a + b * b}`, (a + b) / 2, a + b + 0.5, C.green, { size: 15, bold: true });
  }
  // 顶点标签
  label('A', -0.32, -0.3, palette.dim, { size: 12 });
  label('B', b + 0.3, -0.3, palette.dim, { size: 12 });
  label('C', -0.3, a + 0.28, palette.dim, { size: 12 });
  hud.set('v1', `第 ${step} / 6 步：${['全图', '辅助线', '剪切 b²', '向斜边搬', '剪切 a²', '落位', '结论'][step]}`);
  hud.set('v2', `剪切变换：同底等高 → 面积不变`);
  hud.set('v3', `c² = a² + b² = ${a * a + b * b}`);
}

/* ================= 章节 4：更多证法 ================= */

const mp = { which: 'xiantu', step: 0 };

const secMore = {
  id: 'more', title: '更多证法',
  html: `<p>勾股定理有 400 多种证明，这里选三个最有味道的：</p>
<p><b>赵爽弦图</b>：大正方形 (a+b)² 挖去 4 个三角形：c² = (a+b)² − 4·½ab = a² + 2ab + b² − 2ab = a² + b²。用代数恒等式 kills 几何。</p>
<p><b>加菲尔德梯形</b>（1876，美国第 20 任总统）：直角梯形面积 ½(a+b)(a+b) = 两个三角形 ½ab + ½ab + ½c²，展开即得。据说是国会杂志上的"副业成果"。</p>
<p><b>面积减法</b>：(a+b)² 里放 4 个三角形的两种摆法：一种剩 c²，一种剩 a²+b²——与「出入相补」章节同源，但用减法一眼看穿。</p>`,
  enter() {
    mp.which = 'xiantu';
    mp.step = 0;
    setBoard(3.5, 3.3, 46);
    chapterDrag = null;
    hud.show(false);
    ctl.clear();
    ctl.seg({
      options: [{ label: '弦图', value: 'xiantu' }, { label: '总统梯形', value: 'trapezoid' }, { label: '面积减法', value: 'subtract' }],
      value: 'xiantu',
      onChange: (v) => { mp.which = v; },
    });
    ctl.sep();
    ctl.button({ label: '下一步 →', onClick() { mp.step = Math.min(3, mp.step + 1); } });
    ctl.button({ label: '← 重来', onClick() { mp.step = 0; } });
    chapterTick = () => drawMore();
    drawMore();
  },
};

function drawMore() {
  const a = 3, b = 4, S = a + b;
  clearCanvas();
  grid();
  if (mp.which === 'xiantu') {
    poly([[0, 0], [S, 0], [S, S], [0, S]], null, { color: palette.text, width: 2.2 });
    const tris = [
      [[0, 0], [b, 0], [0, a]], [[S, 0], [S, a], [b, 0]],
      [[S, S], [a, S], [S, a]], [[0, S], [b, S], [0, a]],
    ];
    tris.forEach((t, i) => poly(t, ACCENTS[i], { color: palette.dim, width: 1.5 }));
    const cSq = [[b, 0], [S, b], [a, S], [0, b]];
    if (mp.step >= 1) poly(cSq, 'rgba(63,169,111,0.15)', { color: C.green, width: 2, dash: [6, 4] });
    if (mp.step >= 1) label(`c²`, (a + b) / 2, (a + b) / 2, C.green, { size: 16, bold: true });
    if (mp.step >= 2) label(`(a+b)² − 4×½ab = c²`, S / 2, S + 1, palette.text, { size: 13.5, bold: true });
    if (mp.step >= 3) label(`= a² + 2ab + b² − 2ab = a² + b²`, S / 2, S + 0.35, C.green, { size: 13.5, bold: true });
    label('大正方形边长 a+b', S / 2, -0.7, palette.dim, { size: 12 });
  } else if (mp.which === 'trapezoid') {
    // 加菲尔德梯形：底边 (a+b) 上放两个全等直角三角形，中间夹出等腰三角形（两腰 = c）
    // 外轮廓 (0,0),(a+b,0),(a+b,a),(0,b)，总面积 ½(a+b)²
    const quad = [[0, 0], [a + b, 0], [a + b, a], [0, b]];
    poly(quad, 'rgba(217,161,63,0.08)', { color: palette.text, width: 2.2 });
    poly([[0, 0], [a, 0], [0, b]], 'rgba(232,103,74,0.30)', { color: palette.dim, width: 1.5 });
    poly([[a, 0], [a + b, 0], [a + b, a]], 'rgba(74,144,217,0.30)', { color: palette.dim, width: 1.5 });
    poly([[0, b], [a, 0], [a + b, a]], 'rgba(63,169,111,0.30)', { color: palette.dim, width: 1.5 });
    if (mp.step >= 1) seg(a, 0, a, a + 0.45, C.gold, { width: 1.4, dash: [4, 3] });
    label('½ab', a * 0.42, b * 0.30, palette.dim, { size: 12 });
    label('½ab', a + b * 0.42, a * 0.42, palette.dim, { size: 12 });
    label(`½c²`, a * 0.82, b * 0.62, C.green, { size: 13, bold: true });
    label(`c`, a * 0.32, b * 0.72, C.green, { size: 11.5, bold: true });
    label(`c`, a + b * 0.55, a * 0.78, C.green, { size: 11.5, bold: true });
    if (mp.step >= 1) label(`总面积 = ½(a+b)²`, (a + b) / 2, -0.8, palette.text, { size: 13.5, bold: true });
    if (mp.step >= 2) label(`= ½ab + ½ab + ½c²`, (a + b) / 2, -1.6, palette.text, { size: 13 });
    if (mp.step >= 3) label(`展开：a² + 2ab + b² = 2ab + c² → c² = a² + b²`, (a + b) / 2, a + 0.9, C.green, { size: 13, bold: true });
  } else {
    poly([[0, 0], [S, 0], [S, S], [0, S]], null, { color: palette.text, width: 2.2 });
    const t1 = [[0, 0], [b, 0], [0, a]], t2 = [[b, 0], [S, 0], [S, a]];
    const t3 = [[0, a], [0, S], [b, S]], t4 = [[b, S], [S, a], [S, S]];
    [t1, t2, t3, t4].forEach((t, i) => poly(t, ACCENTS[i], { color: palette.dim, width: 1.5 }));
    if (mp.step >= 1) {
      poly([[0, a], [b, 0], [S, a], [b, S]], 'rgba(63,169,111,0.15)', { color: C.green, width: 2, dash: [6, 4] });
      label('这种放法剩下：斜的正方形 c²', S / 2, S + 1, palette.dim, { size: 12.5 });
    }
    if (mp.step >= 2) {
      const alt = [t1, [[b, 0], [b, a], [0, 0]], [[0, a], [0, 0], [b, a]], [[b, a], [S, a], [S, S]], [[b, a], [b, S], [S, a]]];
      alt.slice(1).forEach((t, i) => poly(t, ACCENTS[(i + 1) % 4], { color: palette.dim, width: 1.2 }));
      poly([[b, 0], [S, 0], [S, a], [b, a]], 'rgba(155,111,217,0.15)', { color: C.purple, width: 2 });
      label('换一种放法剩下：a² + b²', S / 2, S + 1, C.purple, { size: 12.5, bold: true });
    }
    if (mp.step >= 3) label('同样的三角形，同样的剩余面积 → c² = a² + b²', S / 2, -1, C.green, { size: 13.5, bold: true });
  }
}

/* ================= 章节 5：倒水 ================= */

const wt = { a: 3, b: 4, theta: 0, playing: false, lockWater: false };

function clipBelow(pts, w) {
  // 保留 y <= w 的部分（Sutherland–Hodgman）
  const out = [];
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i], q = pts[(i + 1) % pts.length];
    const pin = p[1] <= w, qin = q[1] <= w;
    if (pin) out.push(p);
    if (pin !== qin) {
      const t = (w - p[1]) / (q[1] - p[1]);
      out.push([p[0] + (q[0] - p[0]) * t, w]);
    }
  }
  return out;
}
function polyArea(pts) {
  let s = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length];
    s += x1 * y2 - x2 * y1;
  }
  return Math.abs(s) / 2;
}

/** 船体三个正方形（未旋转）：b² 在 x 轴下方，a² 在 y 轴左侧，c² 在斜边外侧 */
function vesselSquares(a, b) {
  const c = Math.hypot(a, b);
  const sqB = [[0, 0], [b, 0], [b, -b], [0, -b]];
  const sqA = [[0, 0], [-a, 0], [-a, a], [0, a]];
  const sqC = [[b, 0], [0, a], [a, a + b], [a + b, b]];
  return [sqB, sqA, sqC];
}
function rotPts(pts, th) {
  const cos = Math.cos(th), sin = Math.sin(th);
  return pts.map(([x, y]) => [x * cos - y * sin, x * sin + y * cos]);
}

const secWater = {
  id: 'water', title: '倒水',
  html: `<p>做一个「勾股水槽」：直角三角形三条边外侧各焊一个正方形浅槽（深度相同），<b>a² 和 b² 两槽灌满水</b>。</p>
<p>整体旋转水槽：水在重力下保持水平面，但水槽在转——于是水从 a²、b² 流出，沿着斜边槽汇聚。转到<b>斜边槽 c² 正好朝下</b>时：水量一点没变（a² + b²），而 c² 槽的深度恰好是 c——</p>
<p><span class="hl">a² + b² 的水，不多不少正好灌满 c²。</span></p>
<p>拖动「旋转角」慢慢转，或点「自动旋转」；蓝色就是水（始终等于 a²+b² 面积，读数可见）。</p>`,
  enter() {
    Object.assign(wt, { a: 3, b: 4, theta: 0, playing: false });
    setBoard(2.5, 1.5, 42);
    chapterDrag = null;
    hud.show(true);
    ctl.clear();
    ctl.seg({
      options: [{ label: '3,4,5', value: '3,4' }, { label: '5,12,13', value: '5,12' }, { label: '6,8,10', value: '6,8' }],
      value: '3,4',
      onChange: (v) => { const [a, b] = v.split(',').map(Number); wt.a = a; wt.b = b; wt.theta = 0; wt.playing = false; setBoard(b * 0.55, 0, 300 / (a + b + Math.hypot(a, b))); },
    });
    ctl.sep();
    ctl.slider({
      label: '旋转', min: 0, max: 1, step: 0.005, value: 0, fmt: (v) => Math.round(v * endTheta(wt.a, wt.b) / Math.PI * 180) + '°',
      onInput: (v) => { wt.theta = v * endTheta(wt.a, wt.b); wt.playing = false; },
    });
    const playBtn = ctl.button({
      label: '▶ 自动旋转',
      onClick() { wt.playing = !wt.playing; playBtn.classList.toggle('active', wt.playing); },
    });
    ctl.button({ label: '↺ 归零', onClick() { wt.theta = 0; wt.playing = false; playBtn.classList.remove('active'); } });
    chapterTick = (dt) => {
      if (wt.playing) {
        wt.theta += dt * endTheta(wt.a, wt.b) / 7;
        if (wt.theta >= endTheta(wt.a, wt.b)) { wt.theta = endTheta(wt.a, wt.b); wt.playing = false; playBtn.classList.remove('active'); }
        // 同步滑杆
        const input = ctl.el.querySelector('input[type=range]');
        if (input) {
          input.value = wt.theta / endTheta(wt.a, wt.b);
          input.dispatchEvent(new Event('input', { bubbles: false }));
        }
      }
      drawWater();
    };
    drawWater();
  },
};

function endTheta(a, b) {
  const c = Math.hypot(a, b);
  const phi = Math.atan2(b, a);           // c² 外法线初始方向角
  return -(Math.PI / 2 + phi);            // 旋转到外法线朝下
}

function drawWater() {
  const { a, b, theta } = wt;
  const c = Math.hypot(a, b);
  const squares = vesselSquares(a, b).map((s) => rotPts(s, theta));
  clearCanvas();
  grid();
  // 水面高度二分：水量 = a²+b²
  const target = a * a + b * b;
  let lo = -30, hi = 30;
  for (let i = 0; i < 42; i++) {
    const mid = (lo + hi) / 2;
    const area = squares.reduce((s, sq) => s + polyArea(clipBelow(sq, mid)), 0);
    if (area < target) lo = mid; else hi = mid;
  }
  const w = (lo + hi) / 2;
  squares.forEach((sq, i) => {
    const col = ['rgba(74,144,217,0.10)', 'rgba(155,111,217,0.10)', 'rgba(63,169,111,0.12)'][i];
    poly(sq, col, { color: palette.dim, width: 2 });
    const wpoly = clipBelow(sq, w);
    if (wpoly.length >= 3) poly(wpoly, i === 2 ? 'rgba(74,163,232,0.55)' : 'rgba(74,163,232,0.5)', { stroke: false });
    const [cx, cy] = centroid(sq);
    label(['b²', 'a²', 'c²'][i], cx, cy, [C.blue, C.purple, C.green][i], { size: 14, bold: true });
  });
  // 水面线
  const [wx0] = S2W(-50, w), [wx1] = S2W(50, w);
  const [, swy] = W2S(0, w);
  ctx.save();
  ctx.strokeStyle = C.water;
  ctx.lineWidth = 1.6;
  ctx.setLineDash([6, 4]);
  ctx.beginPath(); ctx.moveTo(0, swy); ctx.lineTo(canvas.width / DPR, swy); ctx.stroke();
  ctx.restore();
  // 三角形描边
  const tri = rotPts([[0, 0], [b, 0], [0, a]], theta);
  poly(tri, null, { color: palette.accent, width: 1.8 });
  const deg = Math.round(theta / Math.PI * 180);
  label(`旋转 ${deg}°`, 0, -(b + 1.4), palette.dim, { size: 13 });
  if (Math.abs(theta - endTheta(a, b)) < 0.01) {
    label(`✓ c² 槽恰好被灌满：水深 = c`, 2, a + b + 1.2, C.green, { size: 14, bold: true });
  }
  hud.set('v1', `水量 = a²+b² = ${target}`);
  hud.set('v2', `水面下面积 = ${target.toFixed(1)}（守恒 ✓）`);
  hud.set('v3', `c² = ${Math.round(c * c)}`);
}

/* ================= 章节 6：勾股数 ================= */

const tp = { maxC: 60, primitiveOnly: false, pick: 0, triples: [] };

function genTriples(maxC, primitiveOnly) {
  const out = [];
  for (let m = 2; m * m + 1 <= maxC * maxC; m++) {
    for (let n = 1; n < m; n++) {
      const a = m * m - n * n, bb = 2 * m * n, c = m * m + n * n;
      if (c > maxC) continue;
      if (primitiveOnly && gcd(m, n) !== 1) continue;
      if ((m - n) % 2 === 0 && primitiveOnly) continue;
      const k = Math.max(1, Math.floor(maxC / c));
      for (let t = 1; t <= k; t++) {
        const A = a * t, B = bb * t, Cc = c * t;
        if (Cc <= maxC) out.push({ a: Math.min(A, B), b: Math.max(A, B), c: Cc, m, n, prim: t === 1 && gcd(m, n) === 1 && (m - n) % 2 === 1 });
      }
    }
  }
  // 去重
  const seen = new Set();
  return out.filter((t) => {
    const key = `${t.a},${t.b}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).sort((x, y) => x.c - y.c || x.a - y.a);
}
function gcd(x, y) { while (y) { [x, y] = [y, x % y]; } return x; }

const secTriples = {
  id: 'triples', title: '勾股数',
  html: `<p>满足 <b>a² + b² = c²</b> 的正整数组叫<b>勾股数</b>：3,4,5 → 5,12,13 → 6,8,10 → 8,15,17 …</p>
<p>它们全部由<span class="hl">a = m²−n²，b = 2mn，c = m²+n²</span> 生成（m&gt;n）——这条公式能生成全部基本勾股数（a、b、c 两两互质），乘以倍数得到其余。</p>
<p>把每组勾股数画成 (a, b) 平面上的一个点：点阵呈现清晰的<b>双曲线族</b>轮廓（因为 a²+b²=c² 是四条双曲线弧）。拖动「c 上限」看点阵生长；勾选「只看基本勾股数」过滤倍数组；拖动「选取」逐个查看 m、n 分解。</p>`,
  enter() {
    Object.assign(tp, { maxC: 60, primitiveOnly: false, pick: 0 });
    tp.triples = genTriples(tp.maxC, tp.primitiveOnly);
    chapterDrag = null;
    hud.show(true);
    ctl.clear();
    ctl.slider({ label: 'c 上限', min: 15, max: 300, step: 5, value: 60, fmt: (v) => `≤${v}`, onInput: (v) => { tp.maxC = v; tp.triples = genTriples(v, tp.primitiveOnly); tp.pick = 0; } });
    ctl.toggle({ label: '只看基本勾股数', value: false, onChange: (v) => { tp.primitiveOnly = v; tp.triples = genTriples(tp.maxC, v); tp.pick = 0; } });
    ctl.sep();
    ctl.slider({ label: '选取', min: 1, max: Math.max(1, tp.triples.length), step: 1, value: 1, fmt: (v) => String(v), onInput: (v) => { tp.pick = v - 1; } });
    ctl.toggle({ label: '显示双曲线参考', value: true, onChange: (v) => { tp.curves = v; } });
    tp.curves = true;
    setBoard(0, 0, 1);
    chapterDrag = null;
    // 该章用固定屏幕坐标散点（不用世界板），直接绘制
    chapterTick = () => drawTriples();
    drawTriples();
  },
};

function drawTriples() {
  clearCanvas();
  const vw = canvas.width / DPR, vh = canvas.height / DPR;
  const pad = 46;
  const maxAB = Math.max(20, tp.triples.length ? tp.triples[tp.triples.length - 1].b : 20);
  const X = (v) => pad + (vw - pad - 16) * (v / maxAB);
  const Y = (v) => vh - pad - (vh - pad - 30) * (v / maxAB);
  // 网格
  ctx.strokeStyle = palette.grid;
  ctx.lineWidth = 1;
  const tick = maxAB > 120 ? 40 : maxAB > 60 ? 20 : 10;
  ctx.beginPath();
  for (let v = 0; v <= maxAB; v += tick) {
    ctx.moveTo(X(v), Y(0)); ctx.lineTo(X(v), Y(maxAB));
    ctx.moveTo(X(0), Y(v)); ctx.lineTo(X(maxAB), Y(v));
  }
  ctx.stroke();
  // 轴
  ctx.strokeStyle = palette.axis || palette.faint;
  ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(X(0), Y(0)); ctx.lineTo(X(maxAB), Y(0)); ctx.moveTo(X(0), Y(0)); ctx.lineTo(X(0), Y(maxAB)); ctx.stroke();
  ctx.fillStyle = palette.faint;
  ctx.font = '11.5px sans-serif';
  ctx.textAlign = 'center';
  for (let v = 0; v <= maxAB; v += tick) ctx.fillText(v, X(v), Y(0) + 15);
  ctx.textAlign = 'right';
  for (let v = 0; v <= maxAB; v += tick) ctx.fillText(v, X(0) - 6, Y(v) + 4);
  ctx.textAlign = 'left';
  ctx.fillText('a', X(maxAB) + 4, Y(0) + 4);
  ctx.fillText('b', X(0) + 8, Y(maxAB) - 6);
  // 双曲线参考（c = 若干档）
  if (tp.curves) {
    ctx.save();
    ctx.strokeStyle = 'rgba(217,161,63,0.4)';
    ctx.setLineDash([5, 5]);
    [25, 50, 100, 200, 300].filter((v) => v <= maxAB * 1.42).forEach((cv) => {
      ctx.beginPath();
      let first = true;
      for (let av = 1; av <= Math.min(maxAB, cv - 1); av += Math.max(1, maxAB / 200)) {
        const bv = Math.sqrt(cv * cv - av * av);
        if (bv > maxAB) break;
        const sx = X(av), sy = Y(bv);
        first ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
        first = false;
      }
      ctx.stroke();
    });
    ctx.restore();
  }
  // 散点
  tp.triples.forEach((t, i) => {
    const sel = i === tp.pick;
    ctx.fillStyle = t.prim ? 'rgba(232,103,74,0.85)' : 'rgba(74,144,217,0.6)';
    ctx.beginPath();
    ctx.arc(X(t.a), Y(t.b), sel ? 6 : 3, 0, Math.PI * 2);
    ctx.fill();
    if (sel) {
      ctx.strokeStyle = palette.accent;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(X(t.a), Y(t.b), 9, 0, Math.PI * 2); ctx.stroke();
      ctx.font = '600 12px sans-serif';
      ctx.fillStyle = palette.text;
      ctx.fillText(`${t.a}²+${t.b}²=${t.c}²`, X(t.a) + 12, Y(t.b) - 10);
      ctx.font = '11.5px sans-serif';
      ctx.fillStyle = palette.dim;
      ctx.fillText(t.prim ? `基本（m=${t.m}, n=${t.n}）` : `倍数组（×${t.c / (t.m * t.m + t.n * t.n) || 1}）`, X(t.a) + 12, Y(t.b) + 8);
    }
  });
  // 图例与统计
  ctx.font = '12px -apple-system, "PingFang SC", sans-serif';
  ctx.fillStyle = 'rgba(232,103,74,0.9)';
  ctx.fillRect(vw - 150, 46, 10, 10);
  ctx.fillStyle = palette.dim;
  ctx.fillText('基本勾股数', vw - 136, 55);
  ctx.fillStyle = 'rgba(74,144,217,0.7)';
  ctx.fillRect(vw - 150, 62, 10, 10);
  ctx.fillStyle = palette.dim;
  ctx.fillText('倍数组（×k）', vw - 136, 71);
  ctx.fillStyle = palette.text;
  ctx.font = '600 13px sans-serif';
  ctx.fillText(`c ≤ ${tp.maxC}：共 ${tp.triples.length} 组`, 16, 22);
  hud.set('v1', `勾股数 ${tp.triples.length} 组`);
  const t = tp.triples[tp.pick];
  hud.set('v2', t ? `${t.a}² + ${t.b}² = ${t.c}² = ${t.c * t.c}` : '–');
  hud.set('v3', t ? `m=${t.m}, n=${t.n}：a=m²−n², b=2mn` : '–');
}

/* ================= 章节 7：随堂检测 ================= */

const QUIZ = [
  {
    q: '直角三角形两直角边为 6 和 8，斜边长是？',
    opts: ['9', '10', '12', '14'],
    a: 1,
    ex: 'c = √(6²+8²) = √100 = 10。这是 3-4-5 的 2 倍勾股数。',
  },
  {
    q: '赵爽弦图中，边长为 c 的正方形里拼入了什么？',
    opts: ['4 个全等直角三角形 + 1 个边长 (b−a) 的小正方形', '2 个直角三角形', '4 个正方形', '1 个圆和 2 个三角形'],
    a: 0,
    ex: 'c² = 4×½ab + (b−a)² = 2ab + a² − 2ab + b² = a² + b²，这正是弦图证明的核心。',
  },
  {
    q: '「出入相补」原理的含义是？',
    opts: ['图形剪开再拼回，总面积不变', '面积可以相加但不能相减', '三角形面积是底乘高', '正方形面积最大'],
    a: 0,
    ex: '刘徽的出入相补：图形经过分割、移动、拼接，总面积保持不变——这是中国古代证明面积恒等式的基本工具。',
  },
  {
    q: '下列哪组是「基本勾股数」（三个数两两互质）？',
    opts: ['6, 8, 10', '9, 12, 15', '5, 12, 13', '10, 24, 26'],
    a: 2,
    ex: '5,12,13 两两互质。其余分别是 3-4-5 的 2 倍、3 倍、4 倍，不是基本勾股数。',
  },
  {
    q: '欧几里得证明的关键技巧是？',
    opts: ['代数展开', '剪切变换（同底等高面积不变）', '相似三角形', '反证法'],
    a: 1,
    ex: '把 b² 正方形两次剪切：先变平行四边形再变斜边上的矩形，每次剪切同底等高、面积不变，最后恰好拼进 c² 的一半。',
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

const SECTIONS = [secPuzzle, secChubu, secEuclid, secMore, secWater, secTriples, {
  id: 'quiz', title: '随堂检测',
  html: `<p>5 道题检验本章掌握情况。答完可重新开始。</p>`,
  enter() {
    chapterDrag = null;
    hud.show(false);
    ctl.clear();
    clearCanvas();
    grid();
    // 背景装饰：3-4-5 直角三角形与三侧正方形线稿
    const a = 3, b = 4, c = 5;
    poly([[0, 0], [b, 0], [0, a]], null, { color: palette.faint, width: 1.5 });
    poly([[b, 0], [0, a], [a, a + b], [a + b, b]], null, { color: palette.faint, width: 1.5, dash: [6, 5] });
    poly([[0, 0], [-a, 0], [-a, a], [0, a]], null, { color: palette.faint, width: 1.5, dash: [6, 5] });
    poly([[0, 0], [b, 0], [b, -b], [0, -b]], null, { color: palette.faint, width: 1.5, dash: [6, 5] });
    setBoard(2.2, 1.8, 52);
    showQuiz();
  },
}];

const sections = createSections({
  nav: document.getElementById('sideNav'),
  descPanel: document.getElementById('descPanel'),
  sections: SECTIONS,
  onSelect(i, sec) {
    if (activeCleanup) { activeCleanup(); activeCleanup = null; }
    chapterDrag = null;
    chapterTick = null;
    chapterPointerUp = null;
    if (sec.leave) sec.leave();
    sec.enter();
  },
});
window.__eduSections = sections;
window.__pz = pz;  // 调试钩子（自动化测试用）
window.__view = view;
sections.select(0);

let lastTs = 0;
function appLoop(ts) {
  requestAnimationFrame(appLoop);
  const dt = Math.min((ts - lastTs) / 1000 || 0.016, 0.1);
  lastTs = ts;
  if (chapterTick) chapterTick(dt);
}
requestAnimationFrame(appLoop);
