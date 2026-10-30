/* EduLab · 趣味数学 WonderLab（wonder）
 * 章节：谢尔宾斯基三角形 / 科赫雪花 / 分形树 / 莫比乌斯带 / 黄金分割 / 向日葵的种子 / 随堂检测
 * 技术：前六章为 2D canvas（统一 world↔screen 视图，拖拽平移 + 滚轮缩放）；
 *       莫比乌斯带一章为 three.js 3D（程序化参数曲面 + 蚂蚁行走 / 渐进涂色 / 剪开形变，
 *       OrbitControls 拖拽旋转缩放）。sections / controls / HUD / quiz 挂载模式与 lab-pythagoras.js 一致。
 */
import {
  THREE, TAU, clamp,
  loadHDR, createApp, cameraTweenTick, makeLoader,
  createSections, createControlsPanel, makeHUD,
} from './edu-core.js';

/* ---------------- 本实验专属样式 ---------------- */

const style = document.createElement('style');
style.textContent = `
canvas.wonder-canvas { touch-action: none; cursor: grab; }
canvas.wonder-canvas.grabbing { cursor: grabbing; }
canvas.wonder-canvas.hidden3d { display: none; }
.lab-controls:empty { display: none; }
`;
document.head.appendChild(style);

/* ---------------- 画布与视图 ---------------- */

const stage = document.getElementById('stage');
const loader = makeLoader(stage, '正在布置数学实验室…');
const canvas = document.createElement('canvas');
canvas.className = 'wonder-canvas';
stage.insertBefore(canvas, stage.firstChild);
const ctx = canvas.getContext('2d');

let cw = 1, chh = 1, DPR = 1;
const view = { cx: 0, cy: 0, k: 1 };

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

function fitView(w, h, cx = 0, cy = 0) {
  view.cx = cx; view.cy = cy;
  view.k = Math.min(cw / w, chh / h) * 0.92;
}
const W2S = (x, y) => [(x - view.cx) * view.k + cw / 2, chh / 2 - (y - view.cy) * view.k];
const S2W = (px, py) => [(px - cw / 2) / view.k + view.cx, (chh / 2 - py) / view.k + view.cy];

/* 主题色板（canvas 绘制用，随 data-theme 切换） */
const palette = { text: '#1c2430', dim: '#6b7787', faint: '#c9d2dd', accent: '#e8674a' };
function applyCanvasTheme() {
  const dark = document.documentElement.getAttribute('data-theme') === 'dark';
  palette.text = dark ? '#e8edf3' : '#1c2430';
  palette.dim = dark ? '#8a95a5' : '#6b7787';
  palette.faint = dark ? '#2a3340' : '#d5dce4';
}
window.addEventListener('edulabtheme', applyCanvasTheme);
applyCanvasTheme();

/* ---------------- 平移 / 缩放交互 ---------------- */

let drag = null;
canvas.addEventListener('pointerdown', (e) => {
  if (e.button !== 0 && e.pointerType === 'mouse') return;
  drag = { x: e.clientX, y: e.clientY, cx: view.cx, cy: view.cy };
  canvas.classList.add('grabbing');
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  view.cx = drag.cx - (e.clientX - drag.x) / view.k;
  view.cy = drag.cy + (e.clientY - drag.y) / view.k;
});
const endDrag = () => { drag = null; canvas.classList.remove('grabbing'); };
canvas.addEventListener('pointerup', endDrag);
canvas.addEventListener('pointercancel', endDrag);
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const k2 = clamp(view.k * (e.deltaY < 0 ? 1.12 : 0.9), 0.08, 60);
  const [wx, wy] = S2W(e.offsetX, e.offsetY);
  view.k = k2;
  view.cx = wx - (e.offsetX - cw / 2) / k2;
  view.cy = wy + (e.offsetY - chh / 2) / k2;
}, { passive: false });

/* ---------------- 章节骨架 ---------------- */

const ctl = createControlsPanel(document.getElementById('controls'));
let chapterTick = null;      // 每帧回调（dt 秒）
let activeCleanup = null;    // 离开章节时清理（移除 DOM 覆盖层等）
let curHud = null;           // 当前 HUD 卡（切章即换，防重复堆叠）
function setHud(rows) {
  if (curHud) curHud.el.remove();
  curHud = makeHUD(stage, rows);
  return curHud;
}

function clearCanvas(bg = true) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  if (bg) {
    const cs = getComputedStyle(document.documentElement);
    ctx.fillStyle = cs.getPropertyValue('--stage-bg') || (document.documentElement.getAttribute('data-theme') === 'dark' ? '#0b0f14' : '#e7edf3');
    ctx.fillRect(0, 0, cw, chh);
  }
}

/* ================= 章节 1：谢尔宾斯基三角形 ================= */

const sierp = { r: 0.5, pts: [], cur: [0, 0], perFrame: 260, showTri: true, warm: 0, total: 0 };
let sierpVerts = [];

function sierpEnter() {
  fitView(3.2, 2.9, 0, 0.72);
  // 等边三角形（边长 2.6）
  const s = 2.6, h = s * Math.sqrt(3) / 2;
  sierpVerts = [[-s / 2, -h / 3], [s / 2, -h / 3], [0, h * 2 / 3]];
  sierp.pts = []; sierp.total = 0;
  sierp.cur = [(sierpVerts[0][0] + sierpVerts[1][0]) / 2, (sierpVerts[0][1] + sierpVerts[1][1]) / 2];
  for (let i = 0; i < 18; i++) sierpJump(false); // 预热：跳过暂态
  ctl.clear();
  ctl.slider({ label: '压缩比 r', min: 0.3, max: 0.7, step: 0.005, value: sierp.r, fmt: (v) => v.toFixed(3),
    onInput(v) { sierp.r = v; } });
  ctl.slider({ label: '每帧点数', min: 10, max: 1200, step: 10, value: sierp.perFrame, fmt: (v) => String(v),
    onInput(v) { sierp.perFrame = v; } });
  ctl.toggle({ label: '显示三角形', value: true, onChange(v) { sierp.showTri = v; } });
  ctl.sep();
  ctl.button({ label: '重新开始', onClick() {
    sierp.pts = []; sierp.total = 0;
    sierp.cur = [(sierpVerts[0][0] + sierpVerts[1][0]) / 2, (sierpVerts[0][1] + sierpVerts[1][1]) / 2];
    for (let i = 0; i < 18; i++) sierpJump(false);
  } });
  ctl.button({ label: '回到 r=1/2', onClick() { sierp.r = 0.5; } });
  sierp.hud = setHud( [['v1', '已落点'], ['v2', '压缩比 r'], ['v3', '随机选顶点']]);
  chapterTick = () => {
    for (let i = 0; i < sierp.perFrame; i++) sierpJump(true);
    drawSierp();
  };
  drawSierp();
}

function sierpJump(plot) {
  const k = Math.floor(Math.random() * 3);
  const V = sierpVerts[k];
  sierp.cur = [sierp.cur[0] + (V[0] - sierp.cur[0]) * sierp.r, sierp.cur[1] + (V[1] - sierp.cur[1]) * sierp.r];
  if (plot) {
    sierp.pts.push([sierp.cur[0], sierp.cur[1], k]);
    if (sierp.pts.length > 90000) sierp.pts.splice(0, 8000);
    sierp.total++;
  }
}

function drawSierp() {
  clearCanvas();
  if (sierp.showTri) {
    ctx.strokeStyle = palette.faint; ctx.lineWidth = 1.4;
    ctx.beginPath();
    sierpVerts.forEach(([x, y], i) => { const [sx, sy] = W2S(x, y); i ? ctx.lineTo(sx, sy) : ctx.moveTo(sx, sy); });
    ctx.closePath(); ctx.stroke();
    ctx.font = '600 13px -apple-system, "PingFang SC", sans-serif';
    ctx.fillStyle = palette.dim;
    ['A', 'B', 'C'].forEach((t, i) => {
      const [x, y] = sierpVerts[i];
      const [sx, sy] = W2S(x + (i === 2 ? 0 : (x < 0 ? -0.14 : 0.14)), y + (i === 2 ? 0.12 : -0.1));
      ctx.fillText(t, sx, sy);
    });
  }
  const r0 = clamp(view.k * 0.012, 1.2, 4);
  sierp.pts.forEach(([x, y, k]) => {
    const [sx, sy] = W2S(x, y);
    ctx.fillStyle = k === 0 ? 'rgba(232,103,74,0.75)' : k === 1 ? 'rgba(64,132,201,0.75)' : 'rgba(58,168,143,0.75)';
    ctx.fillRect(sx - r0 / 2, sy - r0 / 2, r0, r0);
  });
  if (sierp.hud) {
    sierp.hud.set('v1', sierp.total.toLocaleString());
    sierp.hud.set('v2', sierp.r.toFixed(3) + (Math.abs(sierp.r - 0.5) < 0.001 ? '（谢尔宾斯基！）' : ''));
    sierp.hud.set('v3', sierp.pts.length ? ['A', 'B', 'C'][sierp.pts[sierp.pts.length - 1][2]] : '–');
  }
}

/* ================= 章节 2：科赫雪花 ================= */

const koch = { depth: 3, ghost: true, animT: -1, ghostPts: null };

function kochPts(depth) {
  // 从等边三角形出发，逐层科赫化；返回顶点数组
  let tri = [[0, 1.05], [-0.91, -0.525], [0.91, -0.525]];
  let pts = tri;
  for (let d = 0; d < depth; d++) {
    const next = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      const dx = (b[0] - a[0]) / 3, dy = (b[1] - a[1]) / 3;
      const p1 = [a[0] + dx, a[1] + dy];
      const p2 = [a[0] + 2 * dx, a[1] + 2 * dy];
      // 尖峰 = p1 + R(-60°)·(p2−p1)/3：等边小三角第三顶点（CCW 多边形外侧）
      const ca = Math.cos(-Math.PI / 3), sa = Math.sin(-Math.PI / 3);
      const peak = [p1[0] + dx * ca - dy * sa, p1[1] + dx * sa + dy * ca];
      next.push(a, p1, peak, p2);
    }
    pts = next;
  }
  return pts;
}

function kochEnter() {
  fitView(2.9, 2.9, 0, 0);
  koch.ghostPts = kochPts(Math.max(0, koch.depth - 1));
  ctl.clear();
  ctl.slider({ label: '迭代次数 n', min: 0, max: 6, step: 1, value: koch.depth, fmt: (v) => String(v),
    onInput(v) { koch.depth = v; koch.ghostPts = kochPts(Math.max(0, v - 1)); koch.animT = -1; } });
  ctl.toggle({ label: '叠加上一层（虚线）', value: true, onChange(v) { koch.ghost = v; } });
  ctl.sep();
  ctl.button({ label: '描绘动画', onClick() { koch.animT = 0; } });
  ctl.button({ label: '再看一层', onClick() {
    if (koch.depth < 6) {
      koch.depth++;
      const s = ctl.el.querySelector('input[type=range]');
      if (s) { s.value = koch.depth; s.dispatchEvent(new Event('input')); }
    }
    koch.animT = 0;
  } });
  koch.hud = setHud( [['v1', '边数 3·4ⁿ'], ['v2', '周长 ×(4/3)ⁿ'], ['v3', '面积比 →8/5']]);
  chapterTick = (dt) => {
    if (koch.animT >= 0) koch.animT = Math.min(koch.animT + dt * 0.28, 1);
    drawKoch();
  };
  drawKoch();
}

function drawKoch() {
  clearCanvas();
  const pts = kochPts(koch.depth);
  if (koch.ghost && koch.ghostPts && koch.depth > 0) {
    ctx.strokeStyle = palette.faint; ctx.lineWidth = 1.1; ctx.setLineDash([5, 5]);
    ctx.beginPath();
    koch.ghostPts.forEach(([x, y], i) => { const [sx, sy] = W2S(x, y); i ? ctx.lineTo(sx, sy) : ctx.moveTo(sx, sy); });
    ctx.closePath(); ctx.stroke();
    ctx.setLineDash([]);
  }
  const nSeg = pts.length;
  const frac = koch.animT >= 0 ? koch.animT : 1;
  const upto = Math.max(2, Math.floor(nSeg * frac));
  ctx.strokeStyle = palette.accent; ctx.lineWidth = 1.7;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  for (let i = 0; i <= (koch.animT >= 0 ? upto : nSeg); i++) {
    const [x, y] = pts[i % nSeg];
    const [sx, sy] = W2S(x, y);
    i ? ctx.lineTo(sx, sy) : ctx.moveTo(sx, sy);
  }
  if (koch.animT < 0) ctx.closePath();
  ctx.stroke();
  if (koch.animT >= 0 && koch.animT >= 1) koch.animT = -1;
  const per = Math.pow(4 / 3, koch.depth);
  if (koch.hud) {
    koch.hud.set('v1', (3 * Math.pow(4, koch.depth)).toLocaleString() + ' 条');
    koch.hud.set('v2', per.toFixed(3) + ' 倍 → 无限');
    koch.hud.set('v3', (areaRatio(koch.depth)).toFixed(4) + '（极限 1.6）');
  }
}

function areaRatio(depth) {
  // 面积比：初始三角形面积 1，每层新增 3·4^(n-1) 个边长 (1/3^n) 的小三角形
  let add = 0;
  for (let n = 1; n <= depth; n++) add += 3 * Math.pow(4, n - 1) / Math.pow(9, n);
  return 1 + add;
}

/* ================= 章节 3：分形树 ================= */

const tree = { depth: 9, angle: 24, ratio: 0.74, wind: 0.5, t: 0 };

function treeEnter() {
  fitView(5.4, 5.4, 0, 0.45);
  ctl.clear();
  ctl.slider({ label: '层数', min: 4, max: 12, step: 1, value: tree.depth, fmt: (v) => String(v),
    onInput(v) { tree.depth = v; } });
  ctl.slider({ label: '张角', min: 8, max: 80, step: 1, value: tree.angle, fmt: (v) => v + '°',
    onInput(v) { tree.angle = v; } });
  ctl.slider({ label: '长度比', min: 0.55, max: 0.82, step: 0.005, value: tree.ratio, fmt: (v) => v.toFixed(3),
    onInput(v) { tree.ratio = v; } });
  ctl.slider({ label: '风力', min: 0, max: 1, step: 0.02, value: tree.wind, fmt: (v) => v.toFixed(2),
    onInput(v) { tree.wind = v; } });
  tree.hud = setHud( [['v1', '分支数 2ⁿ−1'], ['v2', '当前层数'], ['v3', '风相位']]);
  chapterTick = (dt) => { tree.t += dt; drawTree(); };
  drawTree();
}

function drawTree() {
  clearCanvas();
  const n = tree.depth;
  const branches = Math.pow(2, n) - 1;
  // 自底向上迭代（避免深递归）：队列存 [x, y, 角度, 长度, 层]
  let count = 0;
  const sway = tree.wind * 0.16;
  const stack = [[0, -1.45, Math.PI / 2, 1.05, 0]];
  ctx.lineCap = 'round';
  while (stack.length) {
    const [x, y, a, len, d] = stack.pop();
    // 风：摆幅随层数加深、随高度相位错开
    const w = sway * (d / n) * Math.sin(tree.t * 1.7 + d * 0.9);
    const a2 = a + w;
    const x2 = x + Math.cos(a2) * len, y2 = y + Math.sin(a2) * len;
    const k = d / n;
    // 树干棕色 → 枝端绿色
    ctx.strokeStyle = `rgb(${Math.round(96 - 40 * k)},${Math.round(74 + 60 * k)},${Math.round(52 + 60 * k)})`;
    ctx.lineWidth = Math.max(0.8, (n - d) * 0.62 * view.k / 42);
    const [sx, sy] = W2S(x, y), [ex, ey] = W2S(x2, y2);
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
    count++;
    if (d + 1 <= n) {
      const spread = tree.angle * Math.PI / 180 * (1 - 0.25 * k);
      stack.push([x2, y2, a2 + spread, len * tree.ratio, d + 1]);
      stack.push([x2, y2, a2 - spread, len * tree.ratio, d + 1]);
    } else {
      // 叶
      ctx.fillStyle = 'rgba(88,181,88,0.85)';
      ctx.beginPath(); ctx.arc(ex, ey, Math.max(1.1, 0.018 * view.k), 0, TAU); ctx.fill();
    }
  }
  if (tree.hud) {
    tree.hud.set('v1', branches.toLocaleString());
    tree.hud.set('v2', n + ' 层');
    tree.hud.set('v3', (tree.t % TAU).toFixed(2) + ' rad');
  }
}

/* ================= 章节 4：莫比乌斯带（3D） ================= */

const mobi = { app: null, group: null, baseGeo: null, cutGeo: null, paintMesh: null, paintProg: 0,
  ant: null, antU: 0, antOn: false, paintOn: false, cutT: -1, spin: true, showCenter: true,
  centerLine: null, morphing: false };
const MOBI_U = 240, MOBI_V = 8, MOBI_R = 1.55, MOBI_W = 0.5;

function mobiPoint(u, v, out) {
  // 标准莫比乌斯参数曲面：半扭带
  const c = MOBI_R + v * Math.cos(u / 2);
  out.set(c * Math.cos(u), v * Math.sin(u / 2), c * Math.sin(u));
  return out;
}

function buildMobiGeo(mode) {
  // mode 'base'：u∈[0,2π] v∈[-1,1]；mode 'cut'：u∈[0,4π] v∈[-1,1]（剪开后：双倍长、整扭带）
  const g = new THREE.BufferGeometry();
  const pos = new Float32Array((MOBI_U + 1) * (MOBI_V + 1) * 3);
  const v3 = new THREE.Vector3();
  let p = 0;
  for (let i = 0; i <= MOBI_U; i++) {
    const u = (i / MOBI_U) * (mode === 'cut' ? 2 : 1) * Math.PI;
    for (let j = 0; j <= MOBI_V; j++) {
      const v = (j / MOBI_V) * 2 - 1;
      mobiPoint(u, v * MOBI_W, v3);
      pos[p++] = v3.x; pos[p++] = v3.y; pos[p++] = v3.z;
    }
  }
  const idx = [];
  for (let i = 0; i < MOBI_U; i++) {
    for (let j = 0; j < MOBI_V; j++) {
      const a = i * (MOBI_V + 1) + j, b = a + MOBI_V + 1;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

function mobiFrame(u) {
  // u 处的切向 / 法向 / 副法向（中心线 v=0）
  const e = 0.002;
  const p0 = mobiPoint(u, 0, new THREE.Vector3());
  const p1 = mobiPoint(u + e, 0, new THREE.Vector3());
  const t = p1.sub(p0).normalize();
  // 数值法向：v 方向差分 × u 方向差分
  const pv = mobiPoint(u, e, new THREE.Vector3());
  const nrm = pv.sub(p0).cross(p1.sub(p0)).normalize();
  const b = new THREE.Vector3().crossVectors(t, nrm).normalize();
  return { p: p0, t, n: nrm, b };
}

async function mobiEnter() {
  ctl.clear();
  if (!mobi.app) {
    const ld = stage.querySelector('.lab-loader') ? loader : makeLoader(stage, '正在展开莫比乌斯带…');
    ld.setText('正在展开莫比乌斯带…');
    try {
      const hdr = await loadHDR('../assets/textures/sky/sky_court-BLHJ2ADI.hdr');
      const app = createApp({ container: stage, cameraPos: [2.9, 1.7, 3.1], target: [0, 0, 0], minDistance: 1.4, maxDistance: 12 });
      app.scene.environment = hdr;
      app.renderer.toneMappingExposure = 1.05;
      mobi.app = app;
      const group = new THREE.Group();
      app.scene.add(group);
      mobi.group = group;
      const base = buildMobiGeo('base');
      mobi.baseGeo = base;
      mobi.cutGeo = buildMobiGeo('cut');
      const mat = new THREE.MeshStandardMaterial({ color: 0xd8dee9, metalness: 0.35, roughness: 0.32, side: THREE.DoubleSide });
      group.add(new THREE.Mesh(base, mat));
      // 涂色层：法向外偏 0.006，红色，drawRange 渐进揭示
      const paintGeo = base.clone();
      {
        const p = paintGeo.attributes.position, n = base.attributes.normal;
        for (let i = 0; i < p.count; i++) {
          p.setXYZ(i, p.getX(i) + n.getX(i) * 0.006, p.getY(i) + n.getY(i) * 0.006, p.getZ(i) + n.getZ(i) * 0.006);
        }
        p.needsUpdate = true;
      }
      paintGeo.setDrawRange(0, 0);
      mobi.paintMesh = new THREE.Mesh(paintGeo, new THREE.MeshBasicMaterial({ color: 0xe0483a, side: THREE.DoubleSide }));
      group.add(mobi.paintMesh);
      // 中心线（剪开线提示）
      const cpts = [];
      for (let i = 0; i <= 240; i++) cpts.push(mobiPoint((i / 240) * TAU, 0, new THREE.Vector3()));
      mobi.centerLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(cpts),
        new THREE.LineBasicMaterial({ color: 0xe8a13c }));
      mobi.centerLine.visible = true;
      group.add(mobi.centerLine);
      // 蚂蚁：三节身体 + 六条腿
      const ant = new THREE.Group();
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0x241d18, roughness: 0.6 });
      const abd = new THREE.Mesh(new THREE.SphereGeometry(0.052, 16, 12), bodyMat); abd.scale.set(1.5, 1, 1);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.036, 14, 10), bodyMat); head.position.x = 0.085;
      ant.add(abd, head);
      const legGeo = new THREE.CylinderGeometry(0.006, 0.004, 0.1, 6);
      for (let s = -1; s <= 1; s += 2) for (let l = 0; l < 3; l++) {
        const leg = new THREE.Mesh(legGeo, bodyMat);
        leg.position.set(-0.04 + l * 0.055, -0.03, s * 0.045);
        leg.rotation.z = s * 0.9;
        ant.add(leg);
      }
      ant.scale.setScalar(1.35);
      group.add(ant);
      mobi.ant = ant;
      app.onFrame((dt) => mobiTick(dt));
    } catch (err) {
      ld.setText('3D 场景加载失败：' + err.message);
      console.error(err);
      return;
    }
    ld.hide();
  }
  canvas.classList.add('hidden3d');
  mobi.app.dom.style.display = '';
  mobi.app.setPaused(false);
  buildMobiControls();
  mobi.hud = setHud( [['v1', '面数 / 边数'], ['v2', '蚂蚁行程'], ['v3', '状态']]);
  mobiSetHud();
}

function buildMobiControls() {
  ctl.clear();
  ctl.slider({ label: '自转速度', min: 0, max: 1, step: 0.02, value: 0.25, fmt: (v) => v.toFixed(2),
    onInput(v) { mobi.spinSpeed = v; } });
  mobi.spinSpeed = 0.25;
  ctl.toggle({ label: '蚂蚁行走', value: false, onChange(v) {
    mobi.antOn = v;
    if (!v) { mobi.ant.visible = false; }
    else { mobi.ant.visible = true; }
  } });
  ctl.toggle({ label: '沿途涂色', value: false, onChange(v) {
    mobi.paintOn = v;
    if (v) mobi.paintMesh.geometry.setDrawRange(0, 0);
    else mobi.paintMesh.geometry.setDrawRange(0, 0);
    mobi.paintProg = 0;
  } });
  ctl.sep();
  ctl.button({ label: '剪开演示', onClick() { if (!mobi.morphing) startCut(); } });
  ctl.button({ label: '复原', onClick() {
    if (mobi.morphing) return;
    mobi.cutT = -1;
    morphTo(mobi.baseGeo.attributes.position.array, () => {
      mobi.paintMesh.geometry.setDrawRange(0, 0);
      mobi.paintProg = 0; mobi.antU = 0;
      mobi.centerLine.visible = true;
      mobiSetHud();
    });
  } });
}

function startCut() {
  mobi.morphing = true;
  mobi.cutT = 0;
  mobi.centerLine.visible = false;
}

function morphTo(targetArr, done) {
  // 顶点位置线性形变（两几何网格拓扑一致）
  const from = mobi.baseGeo.attributes.position.array.slice();
  const to = targetArr;
  const steps = 90;
  let s = 0;
  const tickMorph = () => {
    s++;
    const k = s / steps;
    const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    const arr = mobi.baseGeo.attributes.position.array;
    for (let i = 0; i < arr.length; i++) arr[i] = from[i] + (to[i] - from[i]) * e;
    mobi.baseGeo.attributes.position.needsUpdate = true;
    mobi.baseGeo.computeVertexNormals();
    if (s < steps) requestAnimationFrame(tickMorph);
    else if (done) done();
  };
  tickMorph();
}

function mobiTick(dt) {
  const g = mobi.group;
  if (!g) return;
  if (mobi.spinSpeed > 0 && !mobi.morphing) g.rotation.y += dt * mobi.spinSpeed * 0.5;
  // 剪开形变
  if (mobi.cutT >= 0) {
    mobi.cutT = Math.min(mobi.cutT + dt * 0.5, 1);
    const k = mobi.cutT;
    const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    const arr = mobi.baseGeo.attributes.position.array;
    const from = mobi.baseGeo.userData.__from || (mobi.baseGeo.userData.__from = arr.slice());
    const to = mobi.cutGeo.attributes.position.array;
    for (let i = 0; i < arr.length; i++) arr[i] = from[i] + (to[i] - from[i]) * e;
    mobi.baseGeo.attributes.position.needsUpdate = true;
    if (k >= 1) {
      mobi.cutT = -1; mobi.morphing = false;
      mobi.baseGeo.userData.__from = null;
      mobi.paintMesh.geometry.setDrawRange(0, 0);
      mobi.paintProg = 0;
    }
    mobiSetHud();
  }
  // 蚂蚁行走（剪开形变期间暂停，避免解析轨迹贴合变形曲面的问题）
  if (mobi.antOn && mobi.ant && mobi.ant.visible && !mobi.morphing) {
    mobi.antU = (mobi.antU + dt * 0.28) % 1;
    const u = mobi.antU * TAU;
    const f = mobiFrame(u);
    const ant = mobi.ant;
    ant.position.copy(f.p).addScaledVector(f.n, 0.06);
    // 姿态：x 轴 = 行进切向，y 轴 = 面法向
    const m = new THREE.Matrix4().makeBasis(f.t, f.n, new THREE.Vector3().crossVectors(f.t, f.n).negate());
    ant.quaternion.setFromRotationMatrix(m);
    // 涂色
    if (mobi.paintOn) {
      const cols = Math.floor(mobi.antU * MOBI_U);
      const want = clamp(cols * MOBI_V * 6, 0, MOBI_U * MOBI_V * 6);
      if (want > mobi.paintProg) { mobi.paintProg = want; mobi.paintMesh.geometry.setDrawRange(0, want); }
      else if (mobi.antU < 0.02) { mobi.paintProg = 0; mobi.paintMesh.geometry.setDrawRange(0, 0); }
    }
    mobiSetHud();
  }
}

function mobiSetHud() {
  if (!mobi.hud) return;
  const cut = mobi.cutT >= 0 ? mobi.cutT : (mobi.morphing ? 0.5 : 0);
  mobi.hud.set('v1', cut > 0.6 ? '2 面 / 2 边（变普通带）' : '1 面 / 1 边');
  mobi.hud.set('v2', mobi.antOn ? (mobi.antU * 100).toFixed(0) + ' %' : '–');
  mobi.hud.set('v3', mobi.morphing ? '剪开中…' : mobi.antOn ? (mobi.paintOn ? '行走并涂色' : '行走') : '拖拽旋转观察');
}

/* ================= 章节 5：黄金分割 ================= */

const gold = { mode: 'game', split: 0.5, reveal: false, zoom: 0, autoZoom: true };

function goldEnter() {
  fitView(3.4, 2.3, 0, 0);
  goldBuildControls();
  gold.hud = setHud( [['v1', '你的比值'], ['v2', '黄金比 φ'], ['v3', '偏差']]);
  fitGoldView();
  drawGold();
  chapterTick = (dt) => {
    if (gold.mode === 'spiral' && gold.autoZoom) {
      gold.zoom += dt * 2.2;
      if (gold.zoom > 60) gold.zoom -= 60; // 自相似：模 2 循环无缝衔接
    }
    drawGold();
  };
}

function goldBuildControls() {
  ctl.clear();
  ctl.seg({ options: [{ label: '分割游戏', value: 'game' }, { label: '无限螺旋', value: 'spiral' }],
    value: gold.mode, onChange(v) {
      gold.mode = v; gold.reveal = false; gold.zoom = 0; gold.autoZoom = true;
      fitGoldView(); goldBuildControls();
    } });
  if (gold.mode === 'game') {
    ctl.slider({ label: '分割位置', min: 0.1, max: 0.9, step: 0.002, value: gold.split, fmt: (v) => (v * 100).toFixed(1) + '%',
      onInput(v) { gold.split = v; gold.reveal = false; } });
    ctl.button({ label: '揭晓答案', onClick() { gold.reveal = true; } });
  } else {
    ctl.slider({ label: '下潜深度', min: 0, max: 60, step: 0.2, value: gold.zoom, fmt: (v) => v.toFixed(1) + ' 级',
      onInput(v) { gold.zoom = v; gold.autoZoom = false; } });
    ctl.toggle({ label: '自动下潜', value: gold.autoZoom, onChange(v) { gold.autoZoom = v; } });
  }
}

function fitGoldView() {
  if (gold.mode === 'game') fitView(4.6, 2.7, -0.12, 0);
  else fitView(2.3, 2.3, 0, 0);
}

function drawGold() {
  clearCanvas();
  if (gold.mode === 'game') drawGoldGame();
  else drawGoldSpiral();
}

function drawGoldGame() {
  const W = 2.9, H = 1.79, x0 = -W / 2, y0 = -H / 2;
  const lx = x0 + W * gold.split;
  // 外框矩形
  ctx.strokeStyle = palette.text; ctx.lineWidth = 2;
  ctx.strokeRect(...W2S(x0, y0 + H), W * view.k, H * view.k);
  // 分割线
  ctx.strokeStyle = gold.reveal ? 'rgba(58,168,143,0.95)' : palette.accent;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(...W2S(lx, y0)); ctx.lineTo(...W2S(lx, y0 + H)); ctx.stroke();
  // 揭晓：画出 φ 真值线 + 数值
  ctx.font = '600 14px -apple-system, "PingFang SC", sans-serif';
  if (gold.reveal) {
    const xPhi = x0 + W / PHI;
    ctx.strokeStyle = 'rgba(232,103,74,0.55)';
    ctx.setLineDash([6, 5]); ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(...W2S(xPhi, y0)); ctx.lineTo(...W2S(xPhi, y0 + H)); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = palette.accent;
    ctx.fillText('φ 真值 ' + (W / PHI / W * 100).toFixed(1) + '%', ...W2S(xPhi + 0.05, y0 + H + 0.12));
    const mine = 1 / gold.split;
    const err = Math.abs(mine - PHI) / PHI * 100;
    if (gold.hud) {
      gold.hud.set('v1', mine.toFixed(4));
      gold.hud.set('v2', PHI.toFixed(7));
      gold.hud.set('v3', err < 1 ? '✓ 相差 ' + err.toFixed(2) + '%，眼光毒辣！' : '相差 ' + err.toFixed(1) + '%');
    }
  } else if (gold.hud) {
    gold.hud.set('v1', (1 / gold.split).toFixed(4));
    gold.hud.set('v2', '先别偷看');
    gold.hud.set('v3', '拖动滑杆，切出你觉得最舒服的比例');
  }
  // 参考物：帕特农神庙立面示意线稿
  ctx.strokeStyle = palette.faint; ctx.lineWidth = 1.2;
  const tx = x0 + W + 0.16, tw = 0.32, th = tw / PHI * 1.6;
  ctx.strokeRect(...W2S(tx, -th / 2), tw * view.k, th * view.k);
  ctx.beginPath();
  ctx.moveTo(...W2S(tx, th / 2)); ctx.lineTo(...W2S(tx + tw / 2, th / 2 + 0.12)); ctx.lineTo(...W2S(tx + tw, th / 2)); ctx.stroke();
  ctx.font = '11px sans-serif'; ctx.fillStyle = palette.dim;
  ctx.fillText('神庙立面 ≈ 1:φ', ...W2S(tx - 0.03, -th / 2 - 0.08));
}

/* 黄金螺旋构造（一次性预计算）：
 * 黄金矩形反复截去最大正方形 → 嵌套正方形序列 + 四分之一圆弧序列。
 * 相邻两级之间恰好差一个相似变换 S（绕极点旋转、缩放 φ），据此做无缝无限下潜：
 * 画面 = 全部层级经 S^t 变换后的像，t 连续增长，模 2 循环（S² 后画面完全重合）。
 */
const PHI = (1 + Math.sqrt(5)) / 2;
const GOLD_SQ = [];   // [{x,y,s}] 正方形（数学坐标，y 向上）
const GOLD_ARC = [];  // [{cx,cy,r,a0,exit}] 四分之一弧（顺时针 sweep −90°）
{
  let x = 0, y = 0, w = PHI, h = 1;
  // 0=横放（正方形截左侧） 1=竖放（截上侧） 2=横放（截右侧） 3=竖放（截下侧）
  let phase = 0;
  let prevExit = null;
  for (let i = 0; i < 30; i++) {
    const s = phase === 0 || phase === 2 ? h : w; // 正方形边长 = 短边
    const sx = phase === 2 ? x + w - s : x;
    const sy = phase === 1 ? y + h - s : y;
    GOLD_SQ.push({ x: sx, y: sy, s });
    // 圆弧：从「入口角」（与前一级共享的角；首级从外角 (0,0) 起）
    // 沿顺时针转 90° 到对角；圆心取正方形中到入口距离恰为边长的角（两个候选中
    // 能让出口落在本级角上的那个）。
    const corners = [[sx, sy], [sx + s, sy], [sx + s, sy + s], [sx, sy + s]];
    const entry = i === 0 ? corners[0] : prevExit;
    let placed = false;
    for (const C of corners) {
      if (Math.abs(Math.hypot(entry[0] - C[0], entry[1] - C[1]) - s) > 1e-9) continue;
      const a0 = Math.atan2(entry[1] - C[1], entry[0] - C[0]);
      const ex = C[0] + s * Math.cos(a0 - Math.PI / 2);
      const ey = C[1] + s * Math.sin(a0 - Math.PI / 2);
      const hit = corners.find(([cx2, cy2]) => Math.hypot(ex - cx2, ey - cy2) < 1e-6 * s);
      if (hit) {
        GOLD_ARC.push({ cx: C[0], cy: C[1], r: s, a0, exit: [ex, ey] });
        prevExit = [ex, ey];
        placed = true;
        break;
      }
    }
    if (!placed) break;
    // 切去正方形，余下矩形进入下一相位
    if (phase === 0) { x += s; w -= s; }
    else if (phase === 1) { h -= s; }
    else if (phase === 2) { w -= s; }
    else { y += s; h -= s; }
    phase = (phase + 1) % 4;
  }
}
// 数值拟合相似变换 S：S(第 i+1 级正方形四角) = 第 i 级四角（循环对位）。
// S(p) = P + k·R(θ)·(p − P)，k = φ；P 为不动点（极点）。
const GOLD_SIM = (() => {
  const a = GOLD_SQ[0], b = GOLD_SQ[1];
  const k = a.s / b.s;
  const cA = [[a.x, a.y], [a.x + a.s, a.y], [a.x + a.s, a.y + a.s], [a.x, a.y + a.s]];
  const cB = [[b.x, b.y], [b.x + b.s, b.y], [b.x + b.s, b.y + b.s], [b.x, b.y + b.s]];
  let best = null;
  for (let q = 0; q < 4; q++) {
    const th = q * Math.PI / 2;
    const R = [[Math.cos(th), -Math.sin(th)], [Math.sin(th), Math.cos(th)]];
    for (let shift = 0; shift < 4; shift++) {
      // 由一对对应点 b[shift] → cA[0] 解不动点 P：(I − kR) P = cA[0] − kR·cB[shift]
      const pB = cB[shift], pA = cA[0];
      const rx = k * (R[0][0] * pB[0] + R[0][1] * pB[1]);
      const ry = k * (R[1][0] * pB[0] + R[1][1] * pB[1]);
      const A11 = 1 - R[0][0] * k, A12 = -R[0][1] * k, A21 = -R[1][0] * k, A22 = 1 - R[1][1] * k;
      const det = A11 * A22 - A12 * A21;
      if (Math.abs(det) < 1e-9) continue;
      const P = [(A22 * (pA[0] - rx) - A12 * (pA[1] - ry)) / det,
                 (A11 * (pA[1] - ry) - A21 * (pA[0] - rx)) / det];
      // 全四角验证（b[(shift+j)%4] → cA[j]）
      let err = 0;
      for (let j = 0; j < 4; j++) {
        const src = cB[(shift + j) % 4];
        const dx = src[0] - P[0], dy = src[1] - P[1];
        const mx = P[0] + k * (R[0][0] * dx + R[0][1] * dy);
        const my = P[1] + k * (R[1][0] * dx + R[1][1] * dy);
        err += Math.hypot(mx - cA[j][0], my - cA[j][1]);
      }
      if (!best || err < best.err) best = { err, P, th, k };
    }
  }
  return best;
})();

function goldDiveXY(x, y, t) {
  // S^t：绕极点旋转 t·θ、缩放 φ^t
  const { P, th, k } = GOLD_SIM;
  const a = th * t;
  const c = Math.cos(a) * Math.pow(k, t), s = Math.sin(a) * Math.pow(k, t);
  const dx = x - P[0], dy = y - P[1];
  return [P[0] + c * dx - s * dy, P[1] + s * dx + c * dy];
}

function drawGoldSpiral() {
  clearCanvas();
  const t = gold.zoom % 2; // S² 不动 → 模 2 无缝循环
  // 正方形（淡）与圆弧（亮），全部层级经 S^t 变换
  ctx.lineJoin = 'round';
  for (let i = GOLD_SQ.length - 1; i >= 0; i--) {
    const q = GOLD_SQ[i];
    const p1 = goldDiveXY(q.x, q.y, t), p2 = goldDiveXY(q.x + q.s, q.y + q.s, t);
    ctx.strokeStyle = palette.faint; ctx.lineWidth = 1.1;
    ctx.strokeRect(...W2S(p1[0], p1[1]), (p2[0] - p1[0]) * view.k, (p1[1] - p2[1]) * view.k);
  }
  ctx.strokeStyle = palette.accent; ctx.lineWidth = 2;
  for (const arc of GOLD_ARC) {
    ctx.beginPath();
    const steps = 26;
    for (let j = 0; j <= steps; j++) {
      const a = arc.a0 - (j / steps) * Math.PI / 2;
      const [wx, wy] = goldDiveXY(arc.cx + arc.r * Math.cos(a), arc.cy + arc.r * Math.sin(a), t);
      const [sx, sy] = W2S(wx, wy);
      j ? ctx.lineTo(sx, sy) : ctx.moveTo(sx, sy);
    }
    ctx.stroke();
  }
  if (gold.hud) {
    gold.hud.set('v1', '下潜 ' + gold.zoom.toFixed(1) + ' 级（×' + Math.pow(PHI, gold.zoom).toFixed(1) + '）');
    gold.hud.set('v2', 'φ = 1.6180339887…');
    gold.hud.set('v3', '每一级都是上一级的 φ 缩影 → 永远下潜不到底');
  }
}


/* ================= 章节 6：向日葵的种子 ================= */

const sun = { angle: 137.508, count: 900, color: true, t: -1 };

function sunEnter() {
  fitView(3.2, 3.2, 0, 0);
  ctl.clear();
  ctl.slider({ label: '发散角', min: 130, max: 145, step: 0.008, value: sun.angle, fmt: (v) => v.toFixed(3) + '°',
    onInput(v) { sun.angle = v; } });
  ctl.slider({ label: '种子数', min: 100, max: 3000, step: 20, value: sun.count, fmt: (v) => String(v),
    onInput(v) { sun.count = v; } });
  ctl.toggle({ label: '按先后上色', value: true, onChange(v) { sun.color = v; } });
  ctl.sep();
  ctl.button({ label: '生长动画', onClick() { sun.t = 0; } });
  ctl.button({ label: '回到黄金角', onClick() { sun.angle = 137.508; } });
  sun.hud = setHud( [['v1', '发散角'], ['v2', '黄金角'], ['v3', '当前排布']]);
  chapterTick = (dt) => { if (sun.t >= 0) { sun.t += dt * 0.5; if (sun.t > 1) sun.t = 1; } drawSun(); };
  drawSun();
}

function drawSun() {
  clearCanvas();
  const N = Math.round(sun.t >= 0 ? sun.count * sun.t : sun.count);
  const alpha = sun.angle * Math.PI / 180;
  const R = 1.42, dotR = Math.max(1.2, 0.023 * view.k);
  for (let n = 1; n <= N; n++) {
    const th = n * alpha;
    const r = R * Math.sqrt(n / sun.count);
    const x = r * Math.cos(th), y = r * Math.sin(th);
    const [sx, sy] = W2S(x, y);
    if (sx < -20 || sx > cw + 20 || sy < -20 || sy > chh + 20) continue;
    if (sun.color) {
      const hue = (n * 0.09) % 1;
      ctx.fillStyle = `hsl(${30 + hue * 60} 62% ${44 + (n % 7) * 4}%)`;
    } else {
      ctx.fillStyle = 'rgba(160,120,50,0.9)';
    }
    ctx.beginPath(); ctx.arc(sx, sy, dotR, 0, TAU); ctx.fill();
  }
  // 中心与标注
  ctx.font = '600 13px -apple-system, "PingFang SC", sans-serif';
  ctx.fillStyle = palette.dim;
  const isGolden = Math.abs(sun.angle - 137.508) < 0.02;
  ctx.fillText(isGolden
    ? '黄金角：新种子永远落在既有种子最空的方向 → 不留缝隙'
    : '偏离黄金角 → 种子挤成若干条「臂」，浪费空间', 16, 26);
  if (sun.hud) {
    sun.hud.set('v1', sun.angle.toFixed(3) + '°');
    sun.hud.set('v2', '≈137.50776°（360×(1−1/φ)）');
    sun.hud.set('v3', isGolden ? '致密无隙' : '出现成臂/缝隙');
  }
}

/* ================= 章节 7：随堂检测 ================= */

const QUIZ = [
  {
    q: '混沌游戏（每步向随机顶点移动一半距离）画出谢尔宾斯基三角形，靠的是什么？',
    opts: ['随机过程没有规律，碰巧像', '确定性规则下的随机迭代被「吸引」到分形上', '三个顶点互相连线', '画了足够多点后随机噪声抹平了'],
    a: 1,
    ex: '每一步都是「线性压缩 + 随机选择」的确定性规则；无论从哪点出发，轨迹都被吸引子（谢尔宾斯基三角形）吸附。这类结构叫迭代函数系统（IFS）。',
  },
  {
    q: '科赫雪花的周长和面积，随着迭代次数增加会怎样？',
    opts: ['周长无限增大，面积趋于有限值', '都无限增大', '都趋于有限值', '周长有限，面积无限'],
    a: 0,
    ex: '每层周长 ×4/3 → 无限；新增面积每层 ×(4/9)（乘 4 个新三角但每个面积是 1/9），级数收敛 → 面积极限是最初三角形的 8/5 倍。「无限边长围出有限面积」。',
  },
  {
    q: '蚂蚁在莫比乌斯带上爬一整圈（沿带长方向 360°）回到起点，它会发现？',
    opts: ['回到了出发点的背面', '回到了出发点，且没翻面——因为整条带只有一个面', '永远回不到起点', '带子变成了两个环'],
    a: 1,
    ex: '莫比乌斯带只有 1 个面、1 条边。蚂蚁看似走完「两面」，实际一直在同一个面上——这正是它最惊人的性质。沿中线剪开后也不会一分为二，而是得到一条更长的、带整扭的环。',
  },
  {
    q: '黄金分割中，较长段与整段之比等于？',
    opts: ['0.618', '1.618', '1.414', '2.236'],
    a: 1,
    ex: '长段/整段 = 整段/长段 = φ = (1+√5)/2 ≈ 1.618；其倒数 1/φ ≈ 0.618 是短段与长段之比。',
  },
  {
    q: '向日葵种子按黄金角约 137.5° 逐个生长，能得到最致密的排布，原因是？',
    opts: ['137.5° 是整数度数，好记', '黄金角是最「无理」的角度，新种子总落在旧缝隙最空处', '向日葵会自动纠错', '√2 的近似值恰好合适'],
    a: 1,
    ex: '黄金角 = 360°×(1−1/φ)，它是「最难用分数逼近」的角度（连分数全为 1）。任何更接近简单分数的角度都会让种子排成明显的「臂」并留下缝隙。',
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
      <p style="color:var(--text-dim);margin:4px 0 18px">正确率 ${pct}%${pct >= 80 ? '，数学奇观尽收眼底！' : pct >= 60 ? '，大部分概念已经清楚了，回顾一下错题。' : '，建议回到前面章节再看一遍哦。'}</p>`;
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

/* ---------------- 组装 ---------------- */

const SECTIONS = [
  { id: 'sierp', title: '谢尔宾斯基三角形',
    html: `<p>随机选一个顶点跳过去，只走一半——重复几万次，点云竟自己排成谢尔宾斯基三角形。这叫「混沌游戏」：规则完全随机，图形却严格确定。</p>
      <p class="tip">试试把压缩比 r 拖离 1/2，看看三角形如何瓦解。</p>`,
    enter() {
      hide3D(); canvas.classList.remove('hidden3d');
      chapterTick = null; clearCanvas(); fitView(3.2, 2.9, 0, 0.72);
      sierpEnter();
    } },
  { id: 'koch', title: '科赫雪花',
    html: `<p>每条边三等分，中段换成向外凸的小尖角。迭代 6 次后：周长 4096 倍于原三角形，还在奔向无穷——可它围出的面积永远超不出最初圆的那么大。</p>
      <p class="tip">点「描绘动画」看曲线一笔画出来。</p>`,
    enter() {
      hide3D(); canvas.classList.remove('hidden3d');
      chapterTick = null; clearCanvas(); kochEnter();
    } },
  { id: 'tree', title: '分形树',
    html: `<p>一根主干，每次分出两根按比例缩短、按固定张角张开的枝。层数够多，就是一棵会随风摇曳的树——风只是给每个分支的相位加了点正弦。</p>
      <p class="tip">拖动画布平移、滚轮缩放，找找自相似的角度。</p>`,
    enter() {
      hide3D(); canvas.classList.remove('hidden3d');
      chapterTick = null; clearCanvas(); treeEnter();
    } },
  { id: 'mobi', title: '莫比乌斯带',
    html: `<p>把纸带扭半圈再粘合：只剩一个面、一条边。放一只蚂蚁沿带走一圈，它会经过「两面」回到原地；沿中线剪开，也不会一分为二。</p>
      <p class="tip">3D 场景可拖拽旋转缩放；先让蚂蚁边走边涂色，再剪开看看。</p>`,
    async enter() {
      canvas.classList.add('hidden3d');
      chapterTick = null; clearCanvas();
      await mobiEnter();
    },
    leave() {
      if (mobi.app) { mobi.app.setPaused(true); mobi.app.dom.style.display = 'none'; }
      canvas.classList.remove('hidden3d');
    } },
  { id: 'gold', title: '黄金分割',
    html: `<p>把一条线段分成长短两段，让「长段:整段 = 短段:长段」——这个比值就是黄金比 φ ≈ 1.618。凭手感你能切出它吗？切完再看黄金螺旋：每转 90° 放大 φ 倍，永远转不到头。</p>`,
    enter() {
      hide3D(); canvas.classList.remove('hidden3d');
      chapterTick = null; clearCanvas(); goldEnter();
    } },
  { id: 'sun', title: '向日葵的种子',
    html: `<p>每长一颗种子，就旋转 137.508°（黄金角）再往外挪一点。这个角度让每颗新种子都落在最空的地方——不重不漏。把角度偏离一点点，立刻挤出「臂」来。</p>
      <p class="tip">发散角滑杆精度 0.008°，试试它有多挑剔。</p>`,
    enter() {
      hide3D(); canvas.classList.remove('hidden3d');
      chapterTick = null; clearCanvas(); sunEnter();
    } },
  { id: 'quiz', title: '随堂检测',
    html: `<p>5 道题检验本章掌握情况。答完可重新开始。</p>`,
    enter() {
      hide3D(); canvas.classList.remove('hidden3d');
      chapterTick = null;
      if (curHud) { curHud.el.remove(); curHud = null; }
      ctl.clear(); clearCanvas();
      fitView(3.0, 2.6, 0, 0);
      // 背景装饰：淡淡的自相似方框
      let s = 1.1, x = -0.55, y = -0.55;
      ctx.strokeStyle = palette.faint; ctx.lineWidth = 1.2;
      for (let i = 0; i < 7; i++) {
        ctx.strokeRect(...W2S(x, y + s), s * view.k, s * view.k);
        s /= 1.618; x += s * 0.12; y += s * 0.12;
      }
      showQuiz();
    },
    leave() {
      if (activeCleanup) { activeCleanup(); activeCleanup = null; }
    } },
];

/* 3D 章节与 2D 画布互斥：进入任何 2D 章节前调用 */
function hide3D() {
  if (mobi.app) { mobi.app.setPaused(true); mobi.app.dom.style.display = 'none'; }
}

const sections = createSections({
  nav: document.getElementById('sideNav'),
  descPanel: document.getElementById('descPanel'),
  sections: SECTIONS,
  onSelect(i, sec) {
    if (activeCleanup) { activeCleanup(); activeCleanup = null; }
    chapterTick = null;
    if (sec.leave) sec.leave();
    Promise.resolve(sec.enter()).catch((e) => console.error(e));
  },
});
window.__eduSections = sections;
sections.select(0);

let lastTs = 0;
function appLoop(ts) {
  requestAnimationFrame(appLoop);
  const dt = Math.min((ts - lastTs) / 1000 || 0.016, 0.1);
  lastTs = ts;
  if (chapterTick) chapterTick(dt);
}
requestAnimationFrame(appLoop);
loader.hide();
