/* EduLab · 尺规作图实验室（construct）
 * 章节：尺规闯关 / 作图回放 / 全等判定 / 相似与位似 / 随堂检测
 * 实现：2D canvas 尺规引擎——只用「过两点的直线」与「以定 点/距 画圆」两种原语，
 *       交点（线×线 / 线×圆 / 圆×圆）自动生成并去重；12 关目标由几何谓词自动判定，
 *       按步数评星；回放模式逐步重演最少步解。
 * 布局（micro 三件套移植）：真·三栏教学布局——左栏课程大纲列表（点击切章）/
 *       中栏 2D 作图画布（ResizeObserver 跟随栏宽）/ 右栏知识点详解 + 本章控件 + 数据读数；
 *       左右栏独立折叠（28px 竖条）+ 专注模式 + 右栏三块手风琴（localStorage 记忆，切章不重置）。
 */
import {
  clamp, createControlsPanel, makeHUD,
} from './edu-core.js';

/* ---------------- 画布脚手架 ---------------- */

const stage = document.getElementById('stage');
const canvas = document.createElement('canvas');
canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;touch-action:none;cursor:crosshair;';
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
  palette.grid = palette.dark ? 'rgba(255,255,255,0.06)' : 'rgba(20,32,44,0.06)';
}
refreshPalette();
window.addEventListener('edulabtheme', refreshPalette);

const C = { blue: '#4a90d9', green: '#3fa96f', gold: '#d9a13f', purple: '#9b6fd9', teal: '#2fb3a5', red: '#d9534f' };

const view = { cx: 0, cy: 0, scale: 110 };
function W2S(x, y) {
  return [canvas.width / DPR / 2 + (x - view.cx) * view.scale, canvas.height / DPR / 2 - (y - view.cy) * view.scale];
}
function S2W(sx, sy) {
  return [(sx - canvas.width / DPR / 2) / view.scale + view.cx, -(sy - canvas.height / DPR / 2) / view.scale + view.cy];
}
function clearCanvas() {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.fillStyle = palette.bg;
  ctx.fillRect(0, 0, canvas.width / DPR, canvas.height / DPR);
}
function grid() {
  const vw = canvas.width / DPR, vh = canvas.height / DPR;
  const step = view.scale > 160 ? 0.25 : view.scale > 80 ? 0.5 : 1;
  const [wx0, wy1] = S2W(0, 0), [wx1, wy0] = S2W(vw, vh);
  ctx.strokeStyle = palette.grid;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = Math.floor(wx0); x <= wx1; x += step) { const [sx] = W2S(x, 0); ctx.moveTo(sx, 0); ctx.lineTo(sx, vh); }
  for (let y = Math.floor(wy0); y <= wy1; y += step) { const [, sy] = W2S(0, y); ctx.moveTo(0, sy); ctx.lineTo(vw, sy); }
  ctx.stroke();
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

/* 平移 / 缩放 */
const pointers = new Map();
canvas.addEventListener('pointerdown', (e) => {
  canvas.setPointerCapture(e.pointerId);
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
});
canvas.addEventListener('pointermove', (e) => {
  if (!pointers.has(e.pointerId)) { onMouseMove(e); return; }
  const p = pointers.get(e.pointerId);
  const dx = e.clientX - p.x, dy = e.clientY - p.y;
  p.x = e.clientX; p.y = e.clientY;
  if (pointers.size === 1 && !ch1.dragConsume(e, dx, dy)) {
    view.cx -= dx / view.scale;
    view.cy += dy / view.scale;
  }
});
function endPointer(e) { pointers.delete(e.pointerId); }
canvas.addEventListener('pointerup', (e) => { if (pointers.size === 1) ch1.onClick(e); endPointer(e); });
canvas.addEventListener('pointercancel', endPointer);
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  view.scale = Math.min(400, Math.max(40, view.scale * Math.exp(-e.deltaY * 0.0016)));
}, { passive: false });
canvas.addEventListener('dblclick', (e) => { view.cx = 0; view.cy = 0; view.scale = 110; });

/* ---------------- 尺规引擎 ---------------- */

const EPS = 1e-7;
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const near = (a, b, tol = 1e-4) => dist(a, b) < tol;

/** 无限直线：过 p、q */
function lineValue(l, x) {
  // y = kx + m（垂直线返回 NaN，另行处理）
  const [p, q] = l.pts;
  if (Math.abs(q.x - p.x) < 1e-9) return NaN;
  return p.y + (q.y - p.y) * (x - p.x) / (q.x - p.x);
}
function lineDir(l) {
  const [p, q] = l.pts;
  const dx = q.x - p.x, dy = q.y - p.y;
  const n = Math.hypot(dx, dy) || 1;
  return { x: dx / n, y: dy / n };
}
function ptLineDist(p, l) {
  const [a, b] = l.pts;
  const dx = b.x - a.x, dy = b.y - a.y;
  const n = Math.hypot(dx, dy) || 1;
  return Math.abs((p.x - a.x) * dy - (p.y - a.y) * dx) / n;
}

function computeIntersections(engine) {
  const found = [];
  const addPt = (x, y) => {
    if (!isFinite(x) || !isFinite(y)) return;
    if (Math.abs(x) > 40 || Math.abs(y) > 40) return;
    for (const p of engine.points) if (dist(p, { x, y }) < 1e-3) return;
    found.push({ x, y, constructed: true });
  };
  const L = engine.lines, Cc = engine.circles;
  for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) {
    const [p1, p2] = L[i].pts, [p3, p4] = L[j].pts;
    const d1x = p2.x - p1.x, d1y = p2.y - p1.y, d2x = p4.x - p3.x, d2y = p4.y - p3.y;
    const den = d1x * d2y - d1y * d2x;
    if (Math.abs(den) < 1e-9) continue;
    const t = ((p3.x - p1.x) * d2y - (p3.y - p1.y) * d2x) / den;
    addPt(p1.x + t * d1x, p1.y + t * d1y);
  }
  for (let i = 0; i < L.length; i++) for (let j = 0; j < Cc.length; j++) {
    const l = L[i], c = Cc[j];
    const [p, q] = l.pts;
    const dx = q.x - p.x, dy = q.y - p.y;
    const n2 = dx * dx + dy * dy || 1;
    const fx = p.x - c.c.x, fy = p.y - c.c.y;
    const b = 2 * (fx * dx + fy * dy) / n2;
    const cc = (fx * fx + fy * fy - c.r * c.r) / n2;
    const disc = b * b - 4 * cc;
    if (disc < 0) continue;
    const sq = Math.sqrt(disc);
    for (const t of [(-b - sq) / 2, (-b + sq) / 2]) addPt(p.x + t * dx, p.y + t * dy);
  }
  for (let i = 0; i < Cc.length; i++) for (let j = i + 1; j < Cc.length; j++) {
    const c1 = Cc[i], c2 = Cc[j];
    const d = dist(c1.c, c2.c);
    if (d < 1e-9 || d > c1.r + c2.r || d < Math.abs(c1.r - c2.r)) continue;
    const a = (c1.r * c1.r - c2.r * c2.r + d * d) / (2 * d);
    const h2 = c1.r * c1.r - a * a;
    if (h2 < 0) continue;
    const h = Math.sqrt(h2);
    const mx = c1.c.x + a * (c2.c.x - c1.c.x) / d;
    const my = c1.c.y + a * (c2.c.y - c1.c.y) / d;
    addPt(mx + h * (c2.c.y - c1.c.y) / d, my - h * (c2.c.x - c1.c.x) / d);
    addPt(mx - h * (c2.c.y - c1.c.y) / d, my + h * (c2.c.x - c1.c.x) / d);
  }
  engine.points.push(...found);
}

/* ---------------- 12 关定义 ---------------- */

const V = (x, y) => ({ x, y });
function circleInt(c1, c2) {
  const d = dist(c1.c, c2.c);
  const a = (c1.r * c1.r - c2.r * c2.r + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, c1.r * c1.r - a * a));
  const mx = c1.c.x + a * (c2.c.x - c1.c.x) / d;
  const my = c1.c.y + a * (c2.c.y - c1.c.y) / d;
  return [V(mx + h * (c2.c.y - c1.c.y) / d, my - h * (c2.c.x - c1.c.x) / d), V(mx - h * (c2.c.y - c1.c.y) / d, my + h * (c2.c.x - c1.c.x) / d)];
}

const distTol = 0.02;   // 距离判定容差（世界单位）

const LEVELS = [
  {
    name: '垂直平分线', given: [V(-1.6, 0), V(1.6, 0)], labels: ['A', 'B'],
    brief: '作线段 AB 的垂直平分线',
    hint: '分别以 A、B 为圆心、AB 为半径画两圆，连两圆交点。',
    par: 3,
    goal(e) {
      const [A, B] = this.given;
      return e.lines.some((l) => {
        const [p, q] = l.pts;
        if (dist(p, q) < 0.25) return false;
        return Math.abs(dist(p, A) - dist(p, B)) < distTol && Math.abs(dist(q, A) - dist(q, B)) < distTol;
      });
    },
    replay(e, done) {
      const [A, B] = this.given;
      const R = dist(A, B);
      const [i1, i2] = circleInt({ c: A, r: R }, { c: B, r: R });
      done.addCircle(A, B); done.addCircle(B, A); done.addLine(i1, i2);
    },
  },
  {
    name: '角平分线', given: [V(-1.5, 1.0), V(0, 0), V(1.8, 0.4)], labels: ['A', 'B', 'C'],
    brief: '作 ∠ABC 的角平分线（B 为顶点）',
    hint: '以 B 为圆心画弧交两边于 D、E；再以 D、E 为圆心画等半径圆，连 B 与交点。',
    par: 4,
    goal(e) {
      const [A, B, C] = this.given;
      return e.lines.some((l) => {
        const [p, q] = l.pts;
        const onB = Math.min(ptLineDist(B, l), dist(B, p), dist(B, q)) < distTol;
        if (!onB) return false;
        for (const m of [p, q]) {
          if (dist(m, B) < 0.25 || dist(m, B) > 6) continue;
          const dA = ptLineDist(m, { pts: [A, B] });
          const dC = ptLineDist(m, { pts: [C, B] });
          if (dA > 0.12 && dC > 0.12 && Math.abs(dA - dC) < 0.03) return true;
        }
        return false;
      });
    },
    replay(e, done) {
      const [A, B, C] = this.given;
      const R = dist(B, A);
      done.addCircle(B, A);                          // 弧交 BA 于 A、BC 于 E（等距）
      const E = V(B.x + (C.x - B.x) / dist(B, C) * R, B.y + (C.y - B.y) / dist(B, C) * R);
      const rr = dist(A, E);
      done.addCircle(A, E); done.addCircle(E, A);    // 等圆（半径 = AE）
      const [m1, m2] = circleInt({ c: A, r: rr }, { c: E, r: rr });
      // 取角内侧的交点：与 u = (BA方向 + BC方向) 同向者
      const uA = { x: (A.x - B.x) / R, y: (A.y - B.y) / R };
      const uC = { x: (C.x - B.x) / dist(B, C), y: (C.y - B.y) / dist(B, C) };
      const ux = uA.x + uC.x, uy = uA.y + uC.y;
      const M = (m1.x - B.x) * ux + (m1.y - B.y) * uy > 0 ? m1 : m2;
      done.addLine(B, M);
    },
  },
  {
    name: '过点作垂线', given: [V(0.2, 1.05), V(-2, -0.6), V(2, -0.25)], labels: ['P', '', ''],
    brief: '过直线外一点 P，作已知直线的垂线',
    hint: '以 P 为圆心画弧交直线于 D、E；再作 DE 的垂直平分线（两等圆），连线过 P。',
    par: 5,
    goal(e) {
      const [P] = this.given;
      const l = e.givenLines[0];
      return e.lines.some((m) => {
        if (Math.min(ptLineDist(P, m), dist(P, m.pts[0]), dist(P, m.pts[1])) > distTol) return false;
        const d1 = lineDir(m), d2 = lineDir(l);
        return Math.abs(d1.x * d2.x + d1.y * d2.y) < 0.03;
      });
    },
    replay(e, done) {
      const [P, l1, l2] = this.given;
      const l = { pts: [l1, l2] };
      const R = ptLineDist(P, l) * 1.45 + 0.15;
      done.addCircle(P, V(P.x + R * 0.5, P.y + R * 0.5));   // 以 P 为圆心（半径点任意方向，长 R）
      // D、E = 圆与直线的交点
      const d = lineDir(l);
      const foot = V(P.x - (ptLineDist(P, l)) * d.y * Math.sign((P.x - l1.x) * d.y - (P.y - l1.y) * d.x), P.y);
      // 数值求交：解 (X−P)² = R² 且 X 在直线上
      const t0 = ((P.x - l1.x) * d.x + (P.y - l1.y) * d.y);
      const f = V(l1.x + t0 * d.x, l1.y + t0 * d.y);
      const distF = dist(P, f);
      const half = Math.sqrt(Math.max(0, R * R - distF * distF));
      const D = V(f.x - half * d.x, f.y - half * d.y);
      const E = V(f.x + half * d.x, f.y + half * d.y);
      done.addCircle(D, E); done.addCircle(E, D);
      const [m1, m2] = circleInt({ c: D, r: dist(D, E) }, { c: E, r: dist(D, E) });
      done.addLine(P, dist(m1, P) > dist(m2, P) ? m1 : m2);
    },
  },
  {
    name: '过点作平行线', given: [V(0.2, 1.15), V(-2, -0.6), V(2, -0.25)], labels: ['P', '', ''],
    brief: '过直线外一点 P，作已知直线的平行线',
    hint: '先过 P 作垂线，再过 P 作这条垂线的垂线——两步垂线得平行。',
    par: 8,
    goal(e) {
      const [P] = this.given;
      const l = e.givenLines[0];
      return e.lines.some((m) => {
        if (Math.min(ptLineDist(P, m), dist(P, m.pts[0]), dist(P, m.pts[1])) > distTol) return false;
        const d1 = lineDir(m), d2 = lineDir(l);
        return Math.abs(Math.abs(d1.x * d2.x + d1.y * d2.y) - 1) < 0.02;
      });
    },
    replay(e, done) {
      const [P, l1] = this.given;
      const l = { pts: [l1, this.given[2]] };
      const d = lineDir(l);
      const R = ptLineDist(P, l) * 1.45 + 0.15;
      done.addCircle(P, V(P.x + R * 0.5, P.y + R * 0.5));
      const t0 = ((P.x - l1.x) * d.x + (P.y - l1.y) * d.y);
      const f = V(l1.x + t0 * d.x, l1.y + t0 * d.y);
      const half = Math.sqrt(Math.max(0, R * R - dist(P, f) * dist(P, f)));
      const D = V(f.x - half * d.x, f.y - half * d.y);
      const E = V(f.x + half * d.x, f.y + half * d.y);
      done.addCircle(D, E); done.addCircle(E, D);
      const [m1, m2] = circleInt({ c: D, r: dist(D, E) }, { c: E, r: dist(D, E) });
      const H = dist(m1, P) > dist(m2, P) ? m1 : m2;
      done.addLine(P, H);
      // 再作 ⊥PH：以 P 为圆心交 PH 于 S1、S2，两等圆，连线
      const R2 = 0.85;
      const dirH = lineDir({ pts: [P, H] });
      const S1 = V(P.x + dirH.x * R2, P.y + dirH.y * R2);
      const S2 = V(P.x - dirH.x * R2, P.y - dirH.y * R2);
      done.addCircle(P, S1);
      done.addCircle(S1, S2); done.addCircle(S2, S1);   // 半径 = |S1S2|，交点在过 P 的平行线上
      const [q1, q2] = circleInt({ c: S1, r: dist(S1, S2) }, { c: S2, r: dist(S1, S2) });
      done.addLine(P, dist(q1, P) > dist(q2, P) ? q1 : q2);
    },
  },
  {
    name: '等边三角形', given: [V(-1.5, -0.6), V(1.2, -0.6)], labels: ['A', 'B'],
    brief: '以 AB 为一边作等边三角形（60° 角）',
    hint: '两圆：以 A 为圆心过 B，以 B 为圆心过 A——交点即第三顶点。',
    par: 2,
    goal(e) {
      const [A, B] = this.given;
      const s = dist(A, B);
      return e.points.some((p) => {
        if (near(p, A) || near(p, B)) return false;
        return Math.abs(dist(p, A) - s) < distTol && Math.abs(dist(p, B) - s) < distTol;
      });
    },
    replay(e, done) {
      const [A, B] = this.given;
      done.addCircle(A, B); done.addCircle(B, A);
    },
  },
  {
    name: '45° 角', given: [V(-1.6, -0.7), V(1.2, -0.7)], labels: ['A', 'B'],
    brief: '在 A 处作 45° 角（AC = AB）',
    hint: '先在 A 作 AB 的垂线，再作直角的平分线；交点 C 满足 AC = AB。',
    par: 7,
    goal(e) {
      const [A, B] = this.given;
      const s = dist(A, B);
      return e.points.some((p) => {
        if (near(p, A) || near(p, B)) return false;
        if (Math.abs(dist(p, A) - s) > distTol) return false;
        const u = { x: (B.x - A.x) / s, y: (B.y - A.y) / s };
        const v = { x: (p.x - A.x) / (dist(p, A) || 1), y: (p.y - A.y) / (dist(p, A) || 1) };
        return Math.abs(u.x * v.x + u.y * v.y - Math.cos(Math.PI / 4)) < 0.02;
      });
    },
    replay(e, done) {
      const [A, B] = this.given;
      const s = dist(A, B);
      // 垂线于 A：等圆 D、E
      const D = V(A.x - s * 0.45, A.y), E = V(A.x + s * 0.45, A.y);
      done.addCircle(D, E); done.addCircle(E, D);
      const [u1, u2] = circleInt({ c: D, r: dist(D, E) }, { c: E, r: dist(D, E) });
      const up = u1.y > u2.y ? u1 : u2;
      done.addLine(A, up);
      // 平分直角：等弧交点
      const dirU = lineDir({ pts: [A, up] });
      const dirB = lineDir({ pts: [A, B] });
      const P45 = V(A.x + dirU.x * s * 0.7, A.y + dirU.y * s * 0.7);
      const P0 = V(A.x + dirB.x * s * 0.7, A.y + dirB.y * s * 0.7);
      done.addCircle(A, B);                        // 半径 s 的圆交平分线于 C（AC = AB）
      done.addCircle(P45, P0); done.addCircle(P0, P45);
      const [q1, q2] = circleInt({ c: P45, r: dist(P45, P0) }, { c: P0, r: dist(P45, P0) });
      const ux = dirU.x + dirB.x, uy = dirU.y + dirB.y;
      const inner = (q1.x - A.x) * ux + (q1.y - A.y) * uy > 0 ? q1 : q2;
      done.addLine(A, inner);
    },
  },
  {
    name: '30° 角', given: [V(-1.6, -0.7), V(1.2, -0.7)], labels: ['A', 'B'],
    brief: '在 A 处作 30° 角（AC = AB）',
    hint: '先作 60°（两圆），再平分它。',
    par: 6,
    goal(e) {
      const [A, B] = this.given;
      const s = dist(A, B);
      return e.points.some((p) => {
        if (near(p, A) || near(p, B)) return false;
        if (Math.abs(dist(p, A) - s) > distTol) return false;
        const u = { x: (B.x - A.x) / s, y: (B.y - A.y) / s };
        const v = { x: (p.x - A.x) / (dist(p, A) || 1), y: (p.y - A.y) / (dist(p, A) || 1) };
        return Math.abs(u.x * v.x + u.y * v.y - Math.cos(Math.PI / 6)) < 0.02;
      });
    },
    replay(e, done) {
      const [A, B] = this.given;
      const s = dist(A, B);
      done.addCircle(A, B); done.addCircle(B, A);
      const [c1] = circleInt({ c: A, r: s }, { c: B, r: s });
      const C60 = c1.y > A.y ? c1 : circleInt({ c: A, r: s }, { c: B, r: s })[1];
      // 等距弧点：T（AB 上）、C60'（AC60 方向上），同取 0.7s
      const T = V(A.x + s * 0.7, A.y);
      const C60d = dist(A, C60);
      const C60p = V(A.x + (C60.x - A.x) / C60d * s * 0.7, A.y + (C60.y - A.y) / C60d * s * 0.7);
      done.addCircle(A, B);                        // 半径 s 的圆交平分线于 C（AC = AB）
      done.addCircle(T, C60p); done.addCircle(C60p, T);
      const [q1, q2] = circleInt({ c: T, r: dist(T, C60p) }, { c: C60p, r: dist(T, C60p) });
      const ux = (T.x - A.x) + (C60p.x - A.x), uy = (T.y - A.y) + (C60p.y - A.y);
      const inner = (q1.x - A.x) * ux + (q1.y - A.y) * uy > 0 ? q1 : q2;
      done.addLine(A, inner);
    },
  },
  {
    name: '外接圆', given: [V(-1.5, -0.8), V(1.7, -0.6), V(0.2, 1.3)], labels: ['A', 'B', 'C'],
    brief: '作三角形 ABC 的外接圆',
    hint: '作 AB、BC 的垂直平分线，交点即圆心 O；以 O 为圆心过任一顶点画圆。',
    par: 7,
    goal(e) {
      const g = this.given;
      return e.circles.some((c) => {
        const r = dist(c.c, g[0]);
        return r > 0.4 && g.every((p) => Math.abs(dist(c.c, p) - r) < distTol * 2);
      });
    },
    replay(e, done) {
      const [A, B, Cc] = this.given;
      const perpBis = (P, Q) => {
        const R = dist(P, Q);
        done.addCircle(P, Q); done.addCircle(Q, P);
        const [i1, i2] = circleInt({ c: P, r: R }, { c: Q, r: R });
        done.addLine(i1, i2);
      };
      perpBis(A, B);
      perpBis(B, Cc);
      const O = e.points.find((p) => Math.abs(dist(p, A) - dist(p, B)) < 0.01 && Math.abs(dist(p, B) - dist(p, Cc)) < 0.01 && dist(p, A) > 0.4);
      if (O) done.addCircle(O, A);
    },
  },
  {
    name: '内切圆', given: [V(-1.5, -0.8), V(1.7, -0.6), V(0.2, 1.3)], labels: ['A', 'B', 'C'],
    brief: '作三角形 ABC 的内切圆',
    hint: '作 ∠A、∠B 的平分线，交点即内心 I；以 I 为圆心、I 到任一边的距离为半径画圆。',
    par: 9,
    goal(e) {
      const g = this.given;
      const sides = [[g[0], g[1]], [g[1], g[2]], [g[2], g[0]]].map(([a, b]) => ({ pts: [a, b] }));
      return e.circles.some((c) => {
        const r = c.r;
        if (r < 0.15) return false;
        return sides.every((sd) => Math.abs(ptLineDist(c.c, sd) - r) < distTol * 2);
      });
    },
    replay(e, done) {
      const [A, B, Cc] = this.given;
      const bis = (P, Q, R2) => {
        // 顶点 P，两边沿 PQ、PR2：取等距点 E1、E2，两等圆交点定平分线
        const d = dist(P, Q);
        const E1 = V(P.x + (Q.x - P.x) / d * d, P.y + (Q.y - P.y) / d * d);
        const E2 = V(P.x + (R2.x - P.x) / dist(P, R2) * d, P.y + (R2.y - P.y) / dist(P, R2) * d);
        done.addCircle(P, E1);
        done.addCircle(E1, E2); done.addCircle(E2, E1);
        const [i1, i2] = circleInt({ c: E1, r: dist(E1, E2) }, { c: E2, r: dist(E1, E2) });
        const M = dist(i1, P) < dist(i2, P) ? i1 : i2;
        done.addLine(P, M);
        return { pts: [P, M] };
      };
      const bA = bis(A, B, Cc);
      const bB = bis(B, A, Cc);
      // 内心 = 两平分线交点（引擎已生成）
      let O = null;
      for (const p of e.points) {
        if (Math.min(ptLineDist(p, bA), dist(p, bA.pts[0]), dist(p, bA.pts[1])) < 0.01 && dist(p, A) > 0.35
          && Math.min(ptLineDist(p, bB), dist(p, bB.pts[0]), dist(p, bB.pts[1])) < 0.01) { O = p; break; }
      }
      if (O) {
        const rIn = ptLineDist(O, { pts: [A, B] });
        done.addCircle(O, V(O.x + rIn, O.y));
      }
    },
  },
  {
    name: '正方形', given: [V(-1.3, -0.7), V(1.3, -0.7)], labels: ['A', 'B'],
    brief: '以 AB 为一边作正方形 ABCD',
    hint: '在 A、B 处分别作 AB 的垂线，再用圆规截取 AD = BC = AB，连 CD。',
    par: 9,
    goal(e) {
      const [A, B] = this.given;
      const s = dist(A, B);
      const cands = e.points.filter((p) => !near(p, A) && !near(p, B));
      for (const Cc of cands) for (const D of cands) {
        if (near(Cc, D)) continue;
        const sq = [A, B, Cc, D];
        let ok = true;
        for (let i = 0; i < 4; i++) {
          if (Math.abs(dist(sq[i], sq[(i + 1) % 4]) - s) > distTol * 2) { ok = false; break; }
        }
        if (!ok) continue;
        const d1 = { x: B.x - A.x, y: B.y - A.y }, d2 = { x: Cc.x - B.x, y: Cc.y - B.y };
        if (Math.abs(d1.x * d2.x + d1.y * d2.y) > 0.02 * s * s) continue;
        return true;
      }
      return false;
    },
    replay(e, done) {
      const [A, B] = this.given;
      const s = dist(A, B);
      // A 处垂线
      const D0 = V(A.x - s * 0.45, A.y), E0 = V(A.x + s * 0.45, A.y);
      done.addCircle(D0, E0); done.addCircle(E0, D0);
      let [u1, u2] = circleInt({ c: D0, r: dist(D0, E0) }, { c: E0, r: dist(D0, E0) });
      const upA = u1.y > u2.y ? u1 : u2;
      done.addLine(A, upA);
      // 圆截 AD = AB
      done.addCircle(A, B);
      const Adir = lineDir({ pts: [A, upA] });
      const DD = V(A.x + Adir.x * s, A.y + Adir.y * s);
      // B 处垂线
      const D1 = V(B.x - s * 0.45, B.y), E1 = V(B.x + s * 0.45, B.y);
      done.addCircle(D1, E1); done.addCircle(E1, D1);
      [u1, u2] = circleInt({ c: D1, r: dist(D1, E1) }, { c: E1, r: dist(D1, E1) });
      const upB = u1.y > u2.y ? u1 : u2;
      done.addLine(B, upB);
      done.addCircle(B, DD);
      const Bdir = lineDir({ pts: [B, upB] });
      const CC = V(B.x + Bdir.x * s, B.y + Bdir.y * s);
      done.addLine(DD, CC);
    },
  },
  {
    name: '圆的切线', given: [V(0, 0), V(1.5, 0)], labels: ['O', 'A'],
    brief: '过圆上一点 A 作圆的切线（圆心 O）',
    hint: '连 OA，再过 A 作 OA 的垂线——切线垂直于过切点的半径。',
    par: 5,
    goal(e) {
      const [O, A] = this.given;
      const R = dist(O, A);
      // 圆必须仍存在（给定的）
      return e.lines.some((m) => {
        if (Math.min(ptLineDist(A, m), dist(A, m.pts[0]), dist(A, m.pts[1])) > distTol) return false;
        const d1 = lineDir(m);
        const u = { x: (A.x - O.x) / R, y: (A.y - O.y) / R };
        return Math.abs(d1.x * u.x + d1.y * u.y) < 0.02;
      });
    },
    replay(e, done) {
      const [O, A] = this.given;
      done.addLine(O, A);
      const R2 = 0.7;
      const u = lineDir({ pts: [O, A] });
      const S1 = V(A.x + u.x * R2, A.y + u.y * R2);
      const S2 = V(A.x - u.x * R2, A.y - u.y * R2);
      done.addCircle(A, S1);
      done.addCircle(S1, S2); done.addCircle(S2, S1);   // 半径 = |S1S2|，交点在过 A 的垂线上
      const [q1, q2] = circleInt({ c: S1, r: dist(S1, S2) }, { c: S2, r: dist(S1, S2) });
      done.addLine(A, dist(q1, A) > dist(q2, A) ? q1 : q2);
    },
  },
  {
    name: '正六边形的一边', given: [V(0, 0), V(1.4, 0)], labels: ['O', 'A'],
    brief: '在圆上找一点 B，使弦 AB = 半径（内接正六边形的一边）',
    hint: '以 A 为圆心、OA 为半径画弧，交圆于 B——弦 AB 恰等于半径。',
    par: 1,
    goal(e) {
      const [O, A] = this.given;
      const R = dist(O, A);
      return e.points.some((p) => {
        if (near(p, A) || near(p, O)) return false;
        return Math.abs(dist(p, O) - R) < distTol * 2 && Math.abs(dist(p, A) - R) < distTol * 2;
      });
    },
    replay(e, done) {
      const [O, A] = this.given;
      done.addCircle(A, O);
    },
  },
];

/* ---------------- 引擎状态（闯关） ---------------- */

const ch1 = {
  level: 0,
  points: [], lines: [], circles: [],
  givenLines: [],
  ops: [],              // {type:'line'|'circle', data, born}
  steps: 0,
  tool: 'circle',
  pending: null,        // 选中的第一个点
  mouse: null,          // 世界坐标
  solved: false,
  stars: 0,
  dragConsume: () => false,
  onClick: () => {},
};

function loadLevel(idx) {
  const lv = LEVELS[idx];
  ch1.level = idx;
  ch1.points = lv.given.map((p) => ({ ...p, constructed: false }));
  ch1.lines = [];
  ch1.circles = [];
  ch1.ops = [];
  ch1.steps = 0;
  ch1.pending = null;
  ch1.solved = false;
  ch1.stars = 0;
  // 给定直线（如作垂线/平行线的已知直线）
  ch1.givenLines = [];
  if (idx === 2 || idx === 3) ch1.givenLines.push({ pts: [lv.given[1], lv.given[2]] });
  if (idx === 10 || idx === 11) ch1.circles.push({ c: lv.given[0], r: dist(lv.given[0], lv.given[1]), given: true });   // 切线/六边形关给圆
  // 视野适配
  const xs = lv.given.map((p) => p.x), ys = lv.given.map((p) => p.y);
  view.cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  view.cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  view.scale = 110;
  ch1.updateHud?.();
}

function addLine(p, q) {
  if (near(p, q, 1e-6)) return false;
  ch1.lines.push({ pts: [p, q] });
  ch1.ops.push({ type: 'line', pts: [p, q], born: performance.now() });
  ch1.steps++;
  afterOp();
  return true;
}
function addCircle(c, rp) {
  const r = dist(c, rp);
  if (r < 1e-6) return false;
  ch1.circles.push({ c: { ...c }, r });
  ch1.ops.push({ type: 'circle', c: { ...c }, r, born: performance.now() });
  ch1.steps++;
  afterOp();
  return true;
}
function afterOp() {
  computeIntersections(ch1);
  const lv = LEVELS[ch1.level];
  if (!ch1.solved && lv.goal(ch1)) {
    ch1.solved = true;
    ch1.stars = ch1.steps <= lv.par ? 3 : ch1.steps <= lv.par + 2 ? 2 : 1;
    ch1.updateHud?.();
  }
}
function undoOp() {
  const op = ch1.ops.pop();
  if (!op) return;
  if (op.type === 'line') ch1.lines.pop();
  else ch1.circles.pop();
  ch1.steps--;
  ch1.solved = false;
  ch1.stars = 0;
  // 重建交点
  const givenPts = LEVELS[ch1.level].given.map((p) => ({ ...p, constructed: false }));
  ch1.points = givenPts;
  computeIntersections(ch1);
  ch1.updateHud?.();
}

/* 拾取 */
function pickPoint(e) {
  const rect = canvas.getBoundingClientRect();
  const [wx, wy] = S2W(e.clientX - rect.left, e.clientY - rect.top);
  let best = null, bestD = 0.22;
  for (const p of ch1.points) {
    const d = dist(p, { x: wx, y: wy });
    if (d < bestD) { bestD = d; best = p; }
  }
  return best;
}
ch1.dragConsume = (e, dx, dy) => {
  if (ch1.pending && ch1.tool) {
    const rect = canvas.getBoundingClientRect();
    const [wx, wy] = S2W(e.clientX - rect.left, e.clientY - rect.top);
    ch1.mouse = { x: wx, y: wy };
    return true;    // 拖动时预览，不平移画布
  }
  return false;
};
ch1.onClick = (e) => {
  if (!ch1.interactive) return;
  const p = pickPoint(e);
  if (ch1.tool === 'circle') {
    if (!ch1.pending) { ch1.pending = p; }
    else if (p && p !== ch1.pending) { addCircle(ch1.pending, p); ch1.pending = null; }
  } else if (ch1.tool === 'line') {
    if (!ch1.pending) { ch1.pending = p; }
    else if (p && p !== ch1.pending) { addLine(ch1.pending, p); ch1.pending = null; }
  }
};
function onMouseMove(e) {
  if (!ch1.interactive) return;
  const rect = canvas.getBoundingClientRect();
  const [wx, wy] = S2W(e.clientX - rect.left, e.clientY - rect.top);
  ch1.mouse = { x: wx, y: wy };
}

/* 渲染闯关 */
function drawEngine(engine, opts = {}) {
  const now = performance.now();
  const birth = (op) => clamp((now - op.born) / 450, 0, 1);
  // 给定直线
  (engine.givenLines || []).forEach((l) => {
    const [a, b] = l.pts;
    const [ax, ay] = W2S(a.x, a.y), [bx, by] = W2S(b.x, b.y);
    ctx.strokeStyle = palette.dim;
    ctx.lineWidth = 2;
    const L = Math.hypot(bx - ax, by - ay) * 3;
    ctx.beginPath();
    ctx.moveTo(ax - (bx - ax) * 2, ay - (by - ay) * 2);
    ctx.lineTo(bx + (bx - ax) * 2, by + (by - ay) * 2);
    ctx.stroke();
  });
  // 给定圆
  (engine.givenCircle || []).forEach((c) => {
    const [sx, sy] = W2S(c.c.x, c.c.y);
    ctx.strokeStyle = palette.dim;
    ctx.setLineDash([6, 5]);
    ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(sx, sy, c.r * view.scale, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
  });
  // 用户圆
  engine.circles.forEach((c) => {
    if (c.given) return;
    const [sx, sy] = W2S(c.c.x, c.c.y);
    ctx.strokeStyle = opts.replay ? C.gold : palette.accent;
    ctx.globalAlpha = 0.65;
    ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(sx, sy, c.r * view.scale, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 1;
  });
  // 用户直线
  engine.lines.forEach((l, i) => {
    const op = opts.replay ? engine.ops[i] : engine.ops.find((o) => o.type === 'line' && o.pts[0] === l.pts[0] && o.pts[1] === l.pts[1]);
    const [a, b] = l.pts;
    const d = lineDir(l);
    const big = 40;
    const [ax, ay] = W2S(a.x - d.x * big, a.y - d.y * big);
    const [bx, by] = W2S(a.x + d.x * big, a.y + d.y * big);
    ctx.strokeStyle = opts.replay ? C.gold : palette.accent;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.85;
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
    ctx.globalAlpha = 1;
  });
  // 点
  engine.points.forEach((p) => {
    const [sx, sy] = W2S(p.x, p.y);
    ctx.fillStyle = p.constructed ? (opts.replay ? C.gold : palette.accent) : palette.text;
    ctx.beginPath(); ctx.arc(sx, sy, p.constructed ? 3.4 : 4.4, 0, Math.PI * 2); ctx.fill();
    if (!p.constructed) {
      ctx.strokeStyle = palette.bg;
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(sx, sy, 6.5, 0, Math.PI * 2); ctx.stroke();
    }
  });
  // 点标签
  if (opts.labels) {
    engine.points.forEach((p, i) => {
      if (i >= opts.labels.length || !opts.labels[i]) return;
      label(opts.labels[i], p.x, p.y + 0.14, palette.dim, { size: 12.5, bold: true });
    });
  }
  // 预览
  if (opts.preview && ch1.pending && ch1.mouse) {
    const P = ch1.pending, M = ch1.mouse;
    ctx.strokeStyle = palette.faint;
    ctx.setLineDash([5, 4]);
    ctx.lineWidth = 1.4;
    if (ch1.tool === 'circle') {
      const [sx, sy] = W2S(P.x, P.y);
      ctx.beginPath(); ctx.arc(sx, sy, dist(P, M) * view.scale, 0, Math.PI * 2); ctx.stroke();
    } else {
      const [ax, ay] = W2S(P.x, P.y), [bx, by] = W2S(M.x, M.y);
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
    }
    ctx.setLineDash([]);
  }
}

/* ---------------- 章节框架 ---------------- */

const ctl = createControlsPanel(document.getElementById('controls'));
const hud = makeHUD(document.getElementById('lcData'), [['v1', '读数'], ['v2', ''], ['v3', '']]);
hud.show(false);
let chapterTick = null;
let activeCleanup = null;
ch1.interactive = false;

const savedView = { cx: 0, cy: 0, scale: 110 };

/* ================= 章节 1：尺规闯关 ================= */

const secChallenge = {
  id: 'challenge', title: '尺规闯关',
  html: `<p>只有两件工具：<b>直尺</b>画过两点的直线，<b>圆规</b>画以一点为心、过另一点的圆。<b>交点自动生成</b>，除此之外没有任何度量工具——这就是尺规作图的规则。</p>
<p>点选已有的点（亮点 = 给定点，橙点 = 作图生成的交点），依次放置工具的两脚。达成目标立刻判过关，按步数评星：<span class="hl">≤ 最少步数 = ★★★</span>。做错了点「撤销」，卡住了看「提示」或直接看「回放」章节。</p>
<p>12 关由浅入深：垂直平分线 → 角平分线 → 垂线/平行线 → 特殊角 → 外接圆/内切圆 → 正方形/切线/正六边形。</p>`,
  enter() {
    ctl.clear();
    Object.assign(view, { cx: 0, cy: 0, scale: 110 });
    ch1.interactive = true;
    hud.show(true);
    const rebuildControls = () => {
      ctl.clear();
      const toolBtn = ctl.seg({
        options: [{ label: '⭕ 圆规', value: 'circle' }, { label: '📏 直尺', value: 'line' }],
        value: ch1.tool,
        onChange: (v) => { ch1.tool = v; ch1.pending = null; },
      });
      ctl.sep();
      const lv = LEVELS[ch1.level];
      ctl.button({ label: '↶ 撤销', onClick: () => { if (!ch1.solved) undoOp(); } });
      ctl.button({ label: '↺ 重置', onClick: () => { loadLevel(ch1.level); rebuildControls(); } });
      ctl.button({
        label: '💡 提示', onClick() {
          ch1.toast = { text: lv.hint, until: performance.now() + 5000 };
        },
      });
      ctl.sep();
      // 关卡选择（两行数字）
      for (let i = 0; i < LEVELS.length; i++) {
        const b = ctl.button({
          label: String(i + 1),
          onClick: () => { if (ch1.level !== i) { loadLevel(i); rebuildControls(); } },
        });
        b.classList.toggle('active', i === ch1.level);
        b.title = LEVELS[i].name;
        if (localStorage.getItem('edulab-construct-clear-' + i)) b.textContent = i + 1 + '✓';
      }
    };
    ch1.updateHud = () => {
      const lv = LEVELS[ch1.level];
      hud.set('v1', `第 ${ch1.level + 1} 关 ${lv.name}：${lv.brief}`);
      hud.set('v2', ch1.solved
        ? `✓ 过关！${ch1.steps} 步 ${'★'.repeat(ch1.stars)}${'☆'.repeat(3 - ch1.stars)}（最少 ${lv.par} 步）`
        : `已用 ${ch1.steps} 步 · 最少 ${lv.par} 步 · 工具：${ch1.tool === 'circle' ? '圆规' : '直尺'}${ch1.pending ? '（已选第 1 点）' : ''}`);
      hud.set('v3', ch1.solved ? '点下一关编号继续' : '点击点放置工具 · 拖空白处平移 · 滚轮缩放');
    };
    loadLevel(ch1.level);
    rebuildControls();
    ch1.updateHud();
    chapterTick = () => {
      clearCanvas();
      grid();
      const lv = LEVELS[ch1.level];
      drawEngine(ch1, { preview: true, labels: lv.labels });
      // 给定直线（第 2/3 关）
      if (ch1.givenLines.length) {
        const [a, b] = ch1.givenLines[0].pts;
        const d = lineDir(ch1.givenLines[0]);
        const [ax, ay] = W2S(a.x - d.x * 40, a.y - d.y * 40);
        const [bx, by] = W2S(a.x + d.x * 40, a.y + d.y * 40);
        ctx.strokeStyle = palette.dim;
        ctx.lineWidth = 2.2;
        ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
      }
      if (ch1.toast && performance.now() < ch1.toast.until) {
        label(ch1.toast.text, view.cx, view.cy + 2.6, C.gold, { size: 14, bold: true });
      } else ch1.toast = null;
      if (ch1.solved) {
        const lv2 = LEVELS[ch1.level];
        label(`✓ ${ch1.steps} 步完成 ${'★'.repeat(ch1.stars)}（最少 ${lv2.par} 步）`, view.cx, view.cy + 2.3, C.green, { size: 15, bold: true });
        try { localStorage.setItem('edulab-construct-clear-' + ch1.level, '1'); } catch (err) { /* 忽略 */ }
      }
    };
    chapterTick();
  },
  leave() { ch1.interactive = false; },
};

/* ================= 章节 2：作图回放 ================= */

const rp = { level: 0, playing: false, applied: 0, engine: null };

const secReplay = {
  id: 'replay', title: '作图回放',
  html: `<p>每一关的<b>最少步数解法</b>逐步重演：金色的圆与直线按顺序画出，说明条同步讲解每一步在做什么。</p>
<p>建议的学习路径：先自己闯关，卡住再来回放偷看最少步数——回头再盲做一遍，步数压到 ★★★。</p>
<p>用下方编号选关，「播放」连续演示，「单步」一步一步看。</p>`,
  enter() {
    ctl.clear();
    ch1.interactive = false;
    hud.show(true);
    rp.playing = false;
    rp.applied = 0;
    rp.engine = { points: [], lines: [], circles: [], ops: [], givenLines: [], givenCircle: [] };
    const lv = LEVELS[rp.level];
    rp.engine.points = lv.given.map((p) => ({ ...p, constructed: false }));
    if (rp.level === 2 || rp.level === 3) rp.engine.givenLines.push({ pts: [lv.given[1], lv.given[2]] });
    if (rp.level === 10) rp.engine.givenCircle = [{ c: lv.given[0], r: dist(lv.given[0], lv.given[1]) }];
    const xs = lv.given.map((p) => p.x), ys = lv.given.map((p) => p.y);
    view.cx = (Math.min(...xs) + Math.max(...xs)) / 2;
    view.cy = (Math.min(...ys) + Math.max(...ys)) / 2;
    view.scale = 100;
    const captions = LEVEL_CAPTIONS[rp.level] || [];
    const applyStep = () => {
      if (rp.applied >= 1) return false;
      const done = {
        addLine: (p, q) => { rp.engine.lines.push({ pts: [{ ...p }, { ...q }] }); rp.engine.ops.push({ type: 'line', born: performance.now() }); rp.applied++; },
        addCircle: (c, rp2) => { rp.engine.circles.push({ c: { ...c }, r: dist(c, rp2) }); rp.engine.ops.push({ type: 'circle', born: performance.now() }); rp.applied++; },
      };
      lv.replay(rp.engine, done);
      computeIntersections(rp.engine);
      return true;
    };
    const rebuild = () => {
      rp.engine = { points: [], lines: [], circles: [], ops: [], givenLines: [], givenCircle: [] };
      rp.engine.points = lv.given.map((p) => ({ ...p, constructed: false }));
      if (rp.level === 2 || rp.level === 3) rp.engine.givenLines.push({ pts: [lv.given[1], lv.given[2]] });
      if (rp.level === 10) rp.engine.givenCircle = [{ c: lv.given[0], r: dist(lv.given[0], lv.given[1]) }];
      rp.applied = 0;
    };
    rebuild();
    const playBtn = ctl.button({
      label: '▶ 播放', onClick() {
        rp.playing = !rp.playing;
        playBtn.textContent = rp.playing ? '⏸ 暂停' : '▶ 播放';
        playBtn.classList.toggle('active', rp.playing);
      },
    });
    ctl.button({
      label: '单步 →', onClick() {
        rp.playing = false; playBtn.textContent = '▶ 播放'; playBtn.classList.remove('active');
        applyStep();
      },
    });
    ctl.button({
      label: '↺ 重来', onClick() { rebuild(); rp.playing = false; playBtn.textContent = '▶ 播放'; playBtn.classList.remove('active'); },
    });
    ctl.sep();
    for (let i = 0; i < LEVELS.length; i++) {
      const b = ctl.button({
        label: String(i + 1),
        onClick: () => {
          if (rp.level !== i) { rp.level = i; rebuild(); rp.playing = false; playBtn.textContent = '▶ 播放'; playBtn.classList.remove('active'); }
          [...ctl.el.querySelectorAll('.ctl-btn')].forEach((bb, j) => {
            if (/^\d+✓?$/.test(bb.textContent.trim()) && j >= 4) bb.classList.toggle('active', +bb.textContent.trim().replace('✓', '') - 1 === rp.level);
          });
        },
      });
      b.classList.toggle('active', i === rp.level);
    }
    let stepTimer = 0;
    chapterTick = (dt) => {
      if (rp.playing) {
        stepTimer += dt;
        if (stepTimer > 0.8) {
          stepTimer = 0;
          if (!applyStep()) { rp.playing = false; playBtn.textContent = '▶ 播放'; playBtn.classList.remove('active'); }
        }
      }
      clearCanvas();
      grid();
      drawEngine(rp.engine, { replay: true, labels: LEVELS[rp.level].labels });
      if (rp.level === 2 || rp.level === 3) {
        const [a, b] = rp.engine.givenLines[0].pts;
        const d = lineDir(rp.engine.givenLines[0]);
        const [ax, ay] = W2S(a.x - d.x * 40, a.y - d.y * 40);
        const [bx, by] = W2S(a.x + d.x * 40, a.y + d.y * 40);
        ctx.strokeStyle = palette.dim;
        ctx.lineWidth = 2.2;
        ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
      }
      if (rp.engine.givenCircle.length) {
        const c = rp.engine.givenCircle[0];
        const [sx, sy] = W2S(c.c.x, c.c.y);
        ctx.strokeStyle = palette.dim;
        ctx.setLineDash([6, 5]);
        ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.arc(sx, sy, c.r * view.scale, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
      }
      const cap = captions[Math.min(rp.applied, captions.length - 1)] || '';
      if (cap) label(cap, view.cx, view.cy + 2.6, C.gold, { size: 13.5, bold: true });
      hud.set('v1', `${LEVELS[rp.level].name}：${LEVELS[rp.level].brief}`);
      hud.set('v2', `最少 ${LEVELS[rp.level].par} 步 · 已演示 ${rp.applied} 步`);
      hud.set('v3', cap ? `第 ${rp.applied} 步：${cap}` : '播放或单步观看');
    };
    chapterTick(0);
  },
};

const LEVEL_CAPTIONS = [
  ['以 A 为圆心、AB 为半径画圆', '以 B 为圆心、AB 为半径画圆', '连接两圆的交点——垂直平分线！'],
  ['以 B 为圆心画弧，交两边于 D、E', '以 D 为圆心、DE 为半径画圆', '以 E 为圆心、DE 为半径画圆', '连接 B 与交点——平分线！'],
  ['以 P 为圆心画弧，交直线于 D、E', '以 D 为圆心、DE 为半径画圆', '以 E 为圆心、DE 为半径画圆', '连 P 与交点——垂线！'],
  ['过 P 作直线的垂线（三步）', '以 P 为圆心在垂线上取对称点', '两等圆作出垂线的垂线', '连接 P 与交点——平行线！'],
  ['以 A 为圆心、AB 为半径画圆', '以 B 为圆心、AB 为半径画圆', '交点 C：AC = BC = AB，等边三角形！'],
  ['作 AB 的垂直平分线找出对称点', '连出过 A 的垂线', '以 A 为圆心画弧（取公共半径）', '以两弧点为圆心画等圆', '连 A 与交点——45°！'],
  ['两圆作出 60°（等边三角形顶点）', '以 A 为圆心画弧', '以两弧点为圆心画等圆', '连 A 与交点——平分 60° 得 30°！'],
  ['作 AB 的垂直平分线', '作 BC 的垂直平分线', '两线交点 O：OA=OB=OC', '以 O 为圆心过 A 画圆——外接圆！'],
  ['作 ∠A 的平分线', '作 ∠B 的平分线', '交点 I 是内心（到三边等距）', '以 I 为圆心、I 到边的距离为半径——内切圆！'],
  ['作 A 处的垂线', '以 A 为圆心截 AD = AB', '作 B 处的垂线', '以 B 为圆心截 BC = AB', '连 CD——正方形！'],
  ['连半径 OA', '以 A 为圆心在 OA 上取对称点', '两等圆作出过 A 的垂线', '垂直于半径 = 切线！'],
  ['以 A 为圆心、OA 为半径画弧', '交点 B：AB = OA = 半径——正六边形的一边！'],
];

/* ================= 章节 3：全等判定 ================= */

const cg = { which: 0, fold: 0, anim: false };

function triPath(pts) {
  ctx.beginPath();
  pts.forEach(([x, y], i) => {
    const [sx, sy] = W2S(x, y);
    i ? ctx.lineTo(sx, sy) : ctx.moveTo(sx, sy);
  });
  ctx.closePath();
}
function drawTri(pts, fill, stroke, width = 2.2, dash = []) {
  triPath(pts);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = width;
  ctx.setLineDash(dash);
  ctx.stroke();
  ctx.setLineDash([]);
}

const secCongruence = {
  id: 'congruence', title: '全等判定',
  html: `<p>判定两个三角形全等，不需要全部六个元素：<b>SSS</b>（三边）、<b>SAS</b>（两边及夹角）、<b>ASA</b>（两角及夹边）、<b>AAS</b>（两角及其中一角的对边）、<b>HL</b>（斜边直角边，直角三角形专属）——五把钥匙。</p>
<p><b>SSA（边边角）不是钥匙</b>：已知两边与其中一边的对角，可能画出<b>两个不同的三角形</b>（"边边角"的钟摆歧义）。点「叠合演示」看两个三角形重合成一个；切到 SSA 反例看怎么画出两个。</p>`,
  enter() {
    ctl.clear();
    hud.show(true);
    cg.fold = 0;
    cg.anim = false;
    const specs = [
      { key: 'SSS', base: [[-1.9, -0.9], [1.1, -0.9], [-0.6, 0.9]], desc: '三边对应相等 → 全等' },
      { key: 'SAS', base: [[-1.9, -0.9], [1.1, -0.9], [-0.3, 0.8]], desc: '两边及其夹角对应相等 → 全等' },
      { key: 'ASA', base: [[-1.9, -0.9], [1.1, -0.9], [0.1, 1.0]], desc: '两角及其夹边对应相等 → 全等' },
      { key: 'AAS', base: [[-1.9, -0.9], [1.1, -0.9], [-0.1, 1.1]], desc: '两角及其中一角的对边 → 全等' },
      { key: 'HL', base: [[-1.9, -0.9], [1.1, -0.9], [-1.9, 0.9]], desc: '斜边和一条直角边 → 全等（直角三角形）' },
      { key: 'SSA反例', base: [[-1.9, -0.9], [1.1, -0.9], [0.45, 0.55]], desc: 'SSA：同样数据画出两个不同的三角形！', ambiguous: true },
    ];
    const draw = () => {
      clearCanvas();
      grid();
      const sp = specs[cg.which];
      const t = cg.fold;
      const e = 1 - Math.pow(1 - t, 3);
      const base = sp.base;
      const copy = base.map(([x, y]) => [x + 3.4, y + 0.15]);
      if (sp.ambiguous) {
        // SSA 两个解
        const A = [base[0][0] + 3.4, base[0][1] + 0.15], B = [base[1][0] + 3.4, base[1][1] + 0.15];
        const C1 = [base[2][0] + 3.4, base[2][1] + 0.15];
        const C2 = [C1[0], 2 * (base[0][1] + 0.15) - C1[1]];   // 关于 AB 对称的另一半
        drawTri([A, B, C1], 'rgba(232,103,74,0.20)', palette.accent);
        drawTri([A, B, C2], 'rgba(74,144,217,0.20)', C.blue, 2.2, [7, 5]);
        label('解 1', A[0] - 0.4, C1[1] + 0.3, palette.accent, { size: 12, bold: true });
        label('解 2', A[0] - 0.4, C2[1] - 0.3, C.blue, { size: 12, bold: true });
      } else {
        drawTri(base, 'rgba(232,103,74,0.20)', palette.accent);
        // 叠合动画：copy 向 base 飞过去
        const mixed = copy.map(([x, y], i) => [x + (base[i][0] - x) * e, y + (base[i][1] - y) * e]);
        drawTri(mixed, cg.fold > 0.95 ? 'rgba(63,169,111,0.25)' : 'rgba(74,144,217,0.22)', cg.fold > 0.95 ? C.green : C.blue);
        label('△1', base[0][0] - 0.15, base[2][1] + 0.3, palette.accent, { size: 12, bold: true });
        label('△2', cg.fold > 0.95 ? base[2][0] + 0.3 : copy[2][0], cg.fold > 0.95 ? base[2][1] - 0.35 : copy[2][1] + 0.35, C.blue, { size: 12, bold: true });
      }
      label(`${sp.key}：${sp.desc}`, view.cx, view.cy + 2.55, sp.ambiguous ? C.blue : C.green, { size: 14, bold: true });
      hud.set('v1', `${sp.key} 判定`);
      hud.set('v2', sp.ambiguous ? '同一组"边边角"：两个解' : '对应元素相等 → 完全重合');
      hud.set('v3', '点「叠合演示」看 △2 飞向 △1');
    };
    ctl.seg({
      options: specs.map((s, i) => ({ label: s.key, value: String(i) })),
      value: '0',
      onChange: (v) => { cg.which = +v; cg.fold = 0; },
    });
    ctl.sep();
    ctl.button({
      label: '▶ 叠合演示', onClick() { cg.fold = 0; cg.anim = true; },
    });
    chapterTick = (dt) => {
      if (cg.anim) {
        cg.fold += dt / 1.3;
        if (cg.fold >= 1) cg.anim = false;
      }
      draw();
    };
    draw();
  },
};

/* ================= 章节 4：相似与位似 ================= */

const sm = { k: 1.6, ox: -2.6, oy: 0.4, lines: true };

const secSimilar = {
  id: 'similar', title: '相似与位似',
  html: `<p><b>位似</b>是特殊的相似：任取一位似中心 O，把每个顶点沿 O 放缩 k 倍（A′ = O + k·(A−O)），得到的新三角形与原三角形<b>相似</b>——对应边平行且成比例、对应角相等。</p>
<p>拖动「位似比 k」：k&gt;1 放大、0&lt;k&lt;1 缩小、<b>k&lt;0 翻转到中心另一侧</b>（反像）。面积比 = <span class="hl">k²</span>——周长是 k 倍，面积却是平方倍，别记混。k 拖过 0 的一刻，看三角形如何"穿过"中心调头。</p>
<p>对应顶点的连线（A→A′、B→B′、C→C′）全都<b>经过位似中心 O</b>——这是位似的定义特征。</p>`,
  enter() {
    ctl.clear();
    hud.show(true);
    sm.k = 1.6;
    const base = [[-1.6, -1.0], [1.4, -1.0], [0.2, 0.9]];
    const O = V(sm.ox, sm.oy);
    const draw = () => {
      clearCanvas();
      grid();
      O.x = sm.ox; O.y = sm.oy;
      const img = base.map(([x, y]) => [O.x + sm.k * (x - O.x), O.y + sm.k * (y - O.y)]);
      drawTri(base, 'rgba(232,103,74,0.22)', palette.accent);
      drawTri(img, 'rgba(74,144,217,0.18)', C.blue, 2.2, [7, 5]);
      if (sm.lines) {
        base.forEach(([x, y], i) => {
          const [ix, iy] = img[i];
          const [ax, ay] = W2S(x, y), [bx, by] = W2S(ix, iy);
          ctx.strokeStyle = 'rgba(155,111,217,0.6)';
          ctx.lineWidth = 1.2;
          ctx.setLineDash([4, 4]);
          ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
          ctx.setLineDash([]);
        });
      }
      // 位似中心
      const [ox, oy] = W2S(O.x, O.y);
      ctx.fillStyle = C.gold;
      ctx.beginPath(); ctx.arc(ox, oy, 5, 0, Math.PI * 2); ctx.fill();
      label('O（位似中心）', O.x, O.y - 0.28, C.gold, { size: 12, bold: true });
      label(`k = ${sm.k.toFixed(2)}`, 1.9, 1.9, palette.text, { size: 15, bold: true });
      hud.set('v1', `相似比 k = ${sm.k.toFixed(2)}（${sm.k > 1 ? '放大' : sm.k > 0 ? '缩小' : '反向'}）`);
      hud.set('v2', `周长比 ${Math.abs(sm.k).toFixed(2)} · 面积比 ${sm.k * sm.k < 0.01 ? '<0.01' : (sm.k * sm.k).toFixed(2)}（= k²）`);
      hud.set('v3', '对应点连线都过位似中心 O');
    };
    ctl.slider({ label: '位似比 k', min: -2.5, max: 2.5, step: 0.05, value: 1.6, fmt: (v) => v.toFixed(2), onInput: (v) => { sm.k = v; } });
    ctl.sep();
    ctl.toggle({ label: '对应点连线', value: true, onChange: (v) => { sm.lines = v; } });
    ctl.button({
      label: 'k 反号（穿过中心）', onClick() {
        sm.k = -sm.k;
        const input = ctl.el.querySelector('input[type=range]');
        if (input) { input.value = sm.k; input.dispatchEvent(new Event('input', { bubbles: false })); }
      },
    });
    draw();
    chapterTick = () => draw();
  },
};

/* ================= 章节 5：随堂检测 ================= */

const QUIZ = [
  {
    q: '尺规作图中，直尺和圆规各自唯一允许的操作是？',
    opts: ['直尺量长度，圆规量角度', '过两点作直线；以定点为圆心、定长为半径作圆', '直尺可以画任意曲线', '圆规可以三等分角'],
    a: 1,
    ex: '尺规作图只有两种原语：过两已知点作直线；以已知点为圆心、过另一已知点作圆。其余一切图形都由交点生成。',
  },
  {
    q: '作线段 AB 的垂直平分线，最少需要几步（每画一个圆或一条直线算一步）？',
    opts: ['2 步', '3 步', '4 步', '5 步'],
    a: 1,
    ex: '以 A 为圆心过 B 画圆（1）+ 以 B 为圆心过 A 画圆（2）+ 连两圆交点（3）= 3 步。',
  },
  {
    q: '下列哪一项不能作为三角形全等的判定？',
    opts: ['SSS', 'SAS', 'ASA', 'SSA'],
    a: 3,
    ex: 'SSA（边边角）有歧义：同样的数据可以画出两个不同的三角形（钟摆摆到两个位置）。',
  },
  {
    q: '位似比为 k 的两个图形，面积比是？',
    opts: ['k', 'k²', 'k³', '√k'],
    a: 1,
    ex: '位似（相似）图形对应线段比为 k，面积比为 k²。例如 k=2 时面积是 4 倍。',
  },
  {
    q: '过圆上一点作圆的切线，依据的几何事实是？',
    opts: ['切线平行于半径', '切线垂直于过切点的半径', '切线平分圆', '切线长等于直径'],
    a: 1,
    ex: '切线的本质：切线 ⊥ 过切点的半径。所以作切线 = 连半径再作垂线。',
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

const SECTIONS = [secChallenge, secReplay, secCongruence, secSimilar, {
  id: 'quiz', title: '随堂检测',
  html: `<p>5 道题检验本章掌握情况。答完可重新开始。</p>`,
  enter() {
    ctl.clear();
    hud.show(false);
    ch1.interactive = false;
    clearCanvas();
    grid();
    // 背景装饰：一段垂直平分线作图
    const A = V(-1.4, -0.3), B = V(1.4, -0.3);
    ctx.strokeStyle = palette.faint;
    ctx.lineWidth = 1.4;
    const [ax, ay] = W2S(A.x, A.y), [bx, by] = W2S(B.x, B.y);
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
    const R = dist(A, B);
    const [i1, i2] = circleInt({ c: A, r: R }, { c: B, r: R });
    ctx.setLineDash([6, 5]);
    for (const c of [{ c: A, r: R }, { c: B, r: R }]) {
      const [sx, sy] = W2S(c.c.x, c.c.y);
      ctx.beginPath(); ctx.arc(sx, sy, c.r * view.scale, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.setLineDash([]);
    const [mx, my] = W2S(i1.x, i1.y), [mx2, my2] = W2S(i2.x, i2.y);
    ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(mx2, my2); ctx.stroke();
    showQuiz();
  },
}];

/* ================= 三栏布局驱动（左栏章节列表 / 右栏详解联动 / 栏折叠 / 专注模式） ================= */

const chapNav = document.getElementById('chapNav');
const chapCount = document.getElementById('chapCount');
const detailNo = document.getElementById('detailNo');
const detailTitle = document.getElementById('detailTitle');
const lessonEl = document.getElementById('lesson');
const detailBody = document.getElementById('detailBody');
const controlsEl = document.getElementById('controls');
const constructShell = document.getElementById('constructShell');
let chapterIdx = 0;
let lastSectionIdx = -1;

/* 5 章竖排按钮：序号 + 标题，点击切章，当前章 .on 高亮 */
const chapBtns = SECTIONS.map((s, i) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'chap-btn';
  b.dataset.idx = String(i);
  const n = document.createElement('span');
  n.className = 'chap-n';
  n.textContent = String(i + 1).padStart(2, '0');
  const t = document.createElement('span');
  t.className = 'chap-t';
  t.textContent = s.title;
  b.append(n, t);
  b.addEventListener('click', () => selectChapter(i));
  chapNav.appendChild(b);
  return b;
});

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
  if (activeCleanup) { activeCleanup(); activeCleanup = null; }
  chapterTick = null;
  if (lastSectionIdx >= 0 && SECTIONS[lastSectionIdx].leave) SECTIONS[lastSectionIdx].leave();
  lastSectionIdx = chapterIdx;
  sec.enter();
  /* 本章无控件时整块手风琴收走（不动用户的手风琴偏好；数据块由帧循环按 hud 显隐同步） */
  accSecs.controls.classList.toggle('acc-empty', !controlsEl.children.length);
  detailBody.scrollTop = 0;
}

/* ---------------- 栏折叠（左右独立 28px 竖条）× 专注模式（双栏同折）统一管理 ---------------- */

const foldLBtn = document.getElementById('foldLBtn');
const unfoldLBtn = document.getElementById('unfoldLBtn');
const foldRBtn = document.getElementById('foldRBtn');
const unfoldRBtn = document.getElementById('unfoldRBtn');
const railNoL = document.getElementById('railNoL');
const railTitleR = document.getElementById('railTitleR');
const focusBtn = document.getElementById('focusBtn');

const FOLD_KEY = { l: 'construct.foldL', r: 'construct.foldR' };
let foldL = false;
let foldR = false;
let focusSaved = null; /* 进入专注模式前的独立折叠状态 [foldL, foldR]，退出时恢复 */

try {
  foldL = localStorage.getItem(FOLD_KEY.l) === '1';
  foldR = localStorage.getItem(FOLD_KEY.r) === '1';
} catch (e) { /* localStorage 不可用（隐私模式等）时仅本次会话内生效 */ }

function applyFold() {
  constructShell.classList.toggle('fold-l', foldL);
  constructShell.classList.toggle('fold-r', foldR);
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
  constructShell.classList.toggle('focus-mode', on);
  focusBtn.textContent = on ? '退出专注' : '专注模式';
  focusBtn.setAttribute('aria-pressed', String(on));
  applyFold();
}

function toggleFold(side) {
  if (focusSaved !== null) setFocus(false);
  if (side === 'l') foldL = !foldL;
  else foldR = !foldR;
  try {
    localStorage.setItem(FOLD_KEY[side], (side === 'l' ? foldL : foldR) ? '1' : '0');
  } catch (e) { /* 忽略持久化失败 */ }
  applyFold();
}

foldLBtn.addEventListener('click', () => toggleFold('l'));
unfoldLBtn.addEventListener('click', () => toggleFold('l'));
foldRBtn.addEventListener('click', () => toggleFold('r'));
unfoldRBtn.addEventListener('click', () => toggleFold('r'));
focusBtn.addEventListener('click', () => setFocus(focusSaved === null));
applyFold();

/* ---------------- 右栏三块手风琴（详解 / 控件 / 读数），localStorage 记忆、切章不重置 ---------------- */

const ACC_KEYS = { lesson: 'construct.accLesson', controls: 'construct.accControls', data: 'construct.accData' };
const accSecs = {
  lesson: document.getElementById('accLesson'),
  controls: document.getElementById('accControls'),
  data: document.getElementById('accData'),
};

const NARROW_VIEW = window.innerWidth <= 1100;   /* 小屏首访清爽态判据 */
const accClosed = {};
for (const name of Object.keys(accSecs)) {
  let saved = null;
  try { saved = localStorage.getItem(ACC_KEYS[name]); } catch (e) { /* 忽略 */ }
  /* 首访（无记忆）：≤1100px 默认收起数据读数；此后记忆优先，不随视口变 */
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

window.__eduSections = { select: selectChapter };
window.__construct = { ch1, LEVELS, addLine, addCircle, loadLevel, computeIntersections };  // 调试钩子

selectChapter(0);

let lastTs = 0;
function appLoop(ts) {
  requestAnimationFrame(appLoop);
  const dt = Math.min((ts - lastTs) / 1000 || 0.016, 0.1);
  lastTs = ts;
  /* 数据读数隐藏（quiz 章等）时数据手风琴块一并收走 */
  accSecs.data.classList.toggle('acc-empty', hud.el.style.display === 'none');
  if (chapterTick) chapterTick(dt);
}
requestAnimationFrame(appLoop);
