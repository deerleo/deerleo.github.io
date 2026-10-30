/* EduLab · 原子轨道 / 电子云（orbital）
 * 章节：电子云 / 轨道形状 / 径向分布与节面 / 能级与构造原理 / 电子排布 / 量子数 / 轨道库 / 随堂检测
 * 波函数引擎：氢原子类 ψ_nlm（a0=1 归一化单位，只取形状与相位，不含归一化常数）
 *   径向 R_nl ∝ r^l · L(拉盖尔多项式) · e^(-r/n)，手写 n≤4 全部多项式；
 *   角向取实轨道（实球谐）：s 常数 / p·d·f 按标准实球谐展开（f 用 cubic 组）。
 * 采样：径向按 D(r)=r²R² 的 CDF 逆变换抽 r，角向在单位球面拒绝采样（接受率 ∝ |Y|²/max|Y|²），
 *   相位着色 ψ>0 红 / ψ<0 蓝，点云密度 ∝ |ψ|²；随机数用固定种子 mulberry32，同一轨道每次重建完全一致。
 */
import {
  THREE, TAU, clamp,
  createApp, cameraTweenTick, makeLoader,
  createSections, createControlsPanel, makeHUD,
} from './edu-core.js';

/* ---------------- 波函数数据 ---------------- */

// 径向函数 R_nl(r)（a0=1，只差常数因子）
const RAD = {
  '1,0': (r) => Math.exp(-r),
  '2,0': (r) => (2 - r) * Math.exp(-r / 2),
  '2,1': (r) => r * Math.exp(-r / 2),
  '3,0': (r) => (27 - 18 * r + 2 * r * r) * Math.exp(-r / 3),
  '3,1': (r) => r * (6 - r) * Math.exp(-r / 3),
  '3,2': (r) => r * r * Math.exp(-r / 3),
  '4,0': (r) => (192 - 144 * r + 24 * r * r - r * r * r) * Math.exp(-r / 4),
  '4,1': (r) => r * (80 - 20 * r + r * r) * Math.exp(-r / 4),
  '4,2': (r) => r * r * (14 - r) * Math.exp(-r / 4),
  '4,3': (r) => r * r * r * Math.exp(-r / 4),
};

// 角向函数（输入为单位向量分量，已吸收 1/r^l）
const ANG_FN = {
  s: () => 1,
  px: (x) => x, py: (x, y) => y, pz: (x, y, z) => z,
  dz2: (x, y, z) => 3 * z * z - 1,                       // (3z²−r²)/r²
  dxz: (x, y, z) => x * z, dyz: (x, y, z) => y * z, dxy: (x, y, z) => x * y,
  dx2y2: (x, y, z) => x * x - y * y,                     // (x²−y²)/r²
  fz3: (x, y, z) => z * (5 * z * z - 3),                 // (5z³−3zr²)/r³
  fxz2: (x, y, z) => x * (5 * z * z - 1),
  fyz2: (x, y, z) => y * (5 * z * z - 1),
  fxyz: (x, y, z) => x * y * z,
  fzx2y2: (x, y, z) => z * (x * x - y * y),
  fx2m3y2: (x, y, z) => x * (x * x - 3 * y * y),         // x(x²−3y²)/r³
  fy3x2my2: (x, y, z) => y * (3 * x * x - y * y),        // y(3x²−y²)/r³
};

const L_LETTER = ['s', 'p', 'd', 'f'];
// 每个 l 的实轨道选项（k=角向函数键，name=显示用方向记号）
const ORB_OPTS = [
  [{ k: 's', name: '' }],
  [{ k: 'px', name: 'x' }, { k: 'py', name: 'y' }, { k: 'pz', name: 'z' }],
  [{ k: 'dz2', name: 'z²' }, { k: 'dxz', name: 'xz' }, { k: 'dyz', name: 'yz' }, { k: 'dxy', name: 'xy' }, { k: 'dx2y2', name: 'x²−y²' }],
  [{ k: 'fz3', name: 'z³' }, { k: 'fxz2', name: 'xz²' }, { k: 'fyz2', name: 'yz²' }, { k: 'fxyz', name: 'xyz' },
   { k: 'fzx2y2', name: 'z(x²−y²)' }, { k: 'fx2m3y2', name: 'x(x²−3y²)' }, { k: 'fy3x2my2', name: 'y(3x²−y²)' }],
];
function orbName(n, l, i) {
  if (l === 0) return `${n}s`;
  if (l === 3) return `${n}f ${ORB_OPTS[3][i].name}`;
  return `${n}${L_LETTER[l]}${ORB_OPTS[l][i].name}`;
}

// 角向节面描述：{v:角度}=竖直平面（法线在 xy 面内）/{h}=水平面/{c:tanθ}=绕 z 双圆锥
const NODES = {
  s: [],
  px: [{ v: 0 }], py: [{ v: 90 }], pz: [{ h: 1 }],
  dz2: [{ c: Math.SQRT2 }],
  dxz: [{ v: 0 }, { h: 1 }], dyz: [{ v: 90 }, { h: 1 }], dxy: [{ v: 0 }, { v: 90 }],
  dx2y2: [{ v: 45 }, { v: -45 }],
  fz3: [{ h: 1 }, { c: Math.sqrt(2 / 3) }],
  fxz2: [{ v: 0 }, { c: Math.sqrt(2 / 3) }],
  fyz2: [{ v: 90 }, { c: Math.sqrt(2 / 3) }],
  fxyz: [{ v: 0 }, { v: 90 }, { h: 1 }],
  fzx2y2: [{ v: 45 }, { v: -45 }, { h: 1 }],
  fx2m3y2: [{ v: 0 }, { v: 60 }, { v: -60 }],
  fy3x2my2: [{ v: 90 }, { v: 30 }, { v: -30 }],
};

// 轨道一句话描述
function orbDesc(n, l) {
  if (l === 0) return `${n}s：球形对称，无角向节面，全正相位`;
  if (l === 1) return `${n}p：哑铃双瓣，两瓣相位相反，中间 1 个角向节面`;
  if (l === 2) return `${n}d：四瓣交替（z² 为双瓣+环），2 个角向节面`;
  return `${n}f：多瓣复杂花样，3 个角向节面`;
}

/* ---------------- 元素数据（1-36） ---------------- */

const EL36 = ['H', 'He', 'Li', 'Be', 'B', 'C', 'N', 'O', 'F', 'Ne', 'Na', 'Mg', 'Al', 'Si', 'P', 'S', 'Cl', 'Ar',
  'K', 'Ca', 'Sc', 'Ti', 'V', 'Cr', 'Mn', 'Fe', 'Co', 'Ni', 'Cu', 'Zn', 'Ga', 'Ge', 'As', 'Se', 'Br', 'Kr'];
const CN36 = ['氢', '氦', '锂', '铍', '硼', '碳', '氮', '氧', '氟', '氖', '钠', '镁', '铝', '硅', '磷', '硫', '氯', '氩',
  '钾', '钙', '钪', '钛', '钒', '铬', '锰', '铁', '钴', '镍', '铜', '锌', '镓', '锗', '砷', '硒', '溴', '氪'];
// 构造原理填充顺序（cap=容量）
const SUBS = [
  { n: 1, l: 0, label: '1s', cap: 2 }, { n: 2, l: 0, label: '2s', cap: 2 }, { n: 2, l: 1, label: '2p', cap: 6 },
  { n: 3, l: 0, label: '3s', cap: 2 }, { n: 3, l: 1, label: '3p', cap: 6 }, { n: 4, l: 0, label: '4s', cap: 2 },
  { n: 3, l: 2, label: '3d', cap: 10 }, { n: 4, l: 1, label: '4p', cap: 6 },
];
const SUP = ['', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹'];
const sup = (v) => (v === 10 ? '¹⁰' : SUP[v] || String(v));
// 排布：Madelung 填充 + Cr/Cu 洪特特例
function fillCounts(Z) {
  const cnt = {};
  SUBS.forEach((s) => { cnt[s.label] = 0; });
  let left = Z;
  for (const s of SUBS) {
    const take = Math.min(left, s.cap);
    cnt[s.label] = take; left -= take;
    if (!left) break;
  }
  if (Z === 24 || Z === 29) { cnt['4s'] -= 1; cnt['3d'] += 1; }
  return cnt;
}
function configFull(Z) {
  const cnt = fillCounts(Z);
  return SUBS.filter((s) => cnt[s.label] > 0).map((s) => s.label + sup(cnt[s.label])).join(' ');
}
function configShort(Z) {
  const cores = [[2, '[He]'], [10, '[Ne]'], [18, '[Ar]']];
  let core = null;
  cores.forEach(([z, tag]) => { if (Z >= z) core = { z, tag }; });
  if (!core) return configFull(Z);
  const cnt = fillCounts(Z);
  const coreOrder = core.z === 2 ? ['1s'] : core.z === 10 ? ['1s', '2s', '2p'] : ['1s', '2s', '2p', '3s', '3p'];
  coreOrder.forEach((k) => { cnt[k] = 0; });
  const rest = SUBS.filter((s) => cnt[s.label] > 0).map((s) => s.label + sup(cnt[s.label])).join(' ');
  return core.tag + (rest ? ' ' + rest : '');
}

/* ---------------- 采样工具 ---------------- */

function mulberry32(seed) {
  let a = seed | 0;
  return function () {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function rMaxOf(n) { return clamp(4.5 + n * n * 2.1, 8, 38); }

// D(r)=r²R² 的 CDF（梯形，480 段），返回 {cdf,total,dr}
function radialTable(n, l, rMax) {
  const NB = 480, dr = rMax / NB;
  const R = RAD[n + ',' + l];
  const D = new Float64Array(NB + 1);
  for (let i = 0; i <= NB; i++) {
    const r = i * dr, v = R(r);
    D[i] = v * v * r * r;
  }
  const cdf = new Float64Array(NB + 1);
  let s = 0;
  for (let i = 1; i <= NB; i++) { s += (D[i - 1] + D[i]) * 0.5 * dr; cdf[i] = s; }
  return { cdf, total: s, dr };
}
function sampleR(tab, u) {
  const t = u * tab.total;
  let lo = 0, hi = tab.cdf.length - 1;
  while (lo < hi) { const m = (lo + hi) >> 1; if (tab.cdf[m] < t) lo = m + 1; else hi = m; }
  const c1 = tab.cdf[lo], c0 = lo > 0 ? tab.cdf[lo - 1] : 0;
  const f = (c1 - c0) > 1e-15 ? (t - c0) / (c1 - c0) : 0.5;
  return (lo - 1 + f) * tab.dr;
}
// |Y|² 在球面网格上的最大值
function angMax2(fn) {
  let mx = 0;
  for (let i = 0; i <= 90; i++) {
    const z = -1 + (2 * i) / 90, s = Math.sqrt(Math.max(0, 1 - z * z));
    for (let j = 0; j < 180; j++) {
      const p = (j / 180) * TAU;
      const v = fn(s * Math.cos(p), s * Math.sin(p), z);
      const v2 = v * v;
      if (v2 > mx) mx = v2;
    }
  }
  return Math.max(mx, 1e-12);
}
// 生成点云：径向 CDF + 角向拒绝采样，密度 ∝ |ψ|²，返回 {pos,col,count}
function sampleCloud(n, l, k, count, seed) {
  const rng = mulberry32(seed);
  const tab = radialTable(n, l, rMaxOf(n));
  const A = ANG_FN[k];
  const mA2 = angMax2(A);
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const cP = [1.0, 0.32, 0.25], cN = [0.25, 0.55, 1.0]; // 红 ψ>0 / 蓝 ψ<0
  let got = 0, guard = count * 80 + 8000;
  while (got < count && guard-- > 0) {
    const r = sampleR(tab, rng());
    const z = 2 * rng() - 1;
    const phi = TAU * rng();
    const s = Math.sqrt(Math.max(0, 1 - z * z));
    const ux = s * Math.cos(phi), uy = s * Math.sin(phi);
    const v = A(ux, uy, z);
    if (v * v < rng() * mA2) continue;
    pos[got * 3] = r * ux; pos[got * 3 + 1] = r * uy; pos[got * 3 + 2] = r * z;
    const c = v >= 0 ? cP : cN;
    col[got * 3] = c[0]; col[got * 3 + 1] = c[1]; col[got * 3 + 2] = c[2];
    got++;
  }
  return { pos, col, count: got };
}
// 径向节点（R 的符号变化 + 二分精化）
function radialNodes(n, l) {
  if (n - l - 1 <= 0) return [];
  const R = RAD[n + ',' + l];
  const rMax = rMaxOf(n), nodes = [];
  const step = 0.004;
  let prev = R(0.001);
  for (let r = step; r < rMax; r += step) {
    const cur = R(r);
    if (prev === 0) { prev = cur; continue; }
    if (prev * cur < 0) {
      let a = r - step, b = r, fa = prev;
      for (let i = 0; i < 24; i++) {
        const m = (a + b) / 2, fm = R(m);
        if (fa * fm <= 0) { b = m; } else { a = m; fa = fm; }
      }
      nodes.push((a + b) / 2);
    }
    prev = cur;
  }
  return nodes;
}
// 最概然半径 r*（D(r) 最大处）
function rStar(n, l) {
  const R = RAD[n + ',' + l];
  const rMax = rMaxOf(n);
  let best = 0, bd = -1;
  for (let i = 1; i <= 1600; i++) {
    const r = (i / 1600) * rMax, v = R(r), d = v * v * r * r;
    if (d > bd) { bd = d; best = r; }
  }
  return best;
}

/* ---------------- 专属样式 ---------------- */

const style = document.createElement('style');
style.textContent = `
.lab-controls:empty { display: none; }
.orb-card {
  position: absolute; z-index: 12;
  background: color-mix(in srgb, var(--card) 88%, transparent);
  backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
  border: 1px solid var(--card-border); border-radius: 14px;
  box-shadow: var(--shadow); color: var(--text); font-size: 13px;
}
.orb-card.hide { display: none; }
.orb-card h3 { margin: 0 0 8px; font-size: 14.5px; }
.orb-card .cap { font-size: 11.5px; line-height: 1.6; color: var(--text-dim); margin-top: 6px; }
.orb-card canvas { display: block; max-width: 100%; }
.orb-rchart { left: 14px; bottom: 14px; width: min(392px, calc(100% - 28px)); padding: 10px 12px 9px; }
.orb-rchart canvas { width: 100%; }
.orb-edu { left: 50%; top: 50%; transform: translate(-50%, -50%); width: min(720px, calc(100% - 24px)); padding: 12px 14px 10px; }
.orb-edu canvas { width: 100%; }
.orb-conf { left: 50%; top: 50%; transform: translate(-50%, -50%); width: min(880px, calc(100% - 24px)); padding: 12px 14px; max-height: calc(100% - 108px); overflow: auto; }
.orb-elgrid { display: grid; grid-template-columns: repeat(18, 1fr); gap: 3px; margin-bottom: 10px; }
.orb-elgrid button {
  border: 1px solid var(--card-border); background: var(--bg, transparent); color: var(--text);
  border-radius: 6px; padding: 2px 0 1px; font-size: 10.5px; line-height: 1.25; cursor: pointer; text-align: center;
}
.orb-elgrid button i { display: block; font-style: normal; font-size: 9px; color: var(--text-dim); }
.orb-elgrid button:hover { border-color: var(--accent); }
.orb-elgrid button.on { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 18%, transparent); }
.orb-elgrid button.special { border-color: #e59b3c; }
.orb-flex { display: flex; gap: 16px; align-items: flex-start; flex-wrap: wrap; }
.orb-flex .left { flex: 1 1 430px; min-width: 260px; }
.orb-flex .right { flex: 0 1 260px; min-width: 220px; }
.orb-conf-line { font-size: 15px; font-weight: 600; letter-spacing: .3px; margin: 3px 0; }
.orb-conf-line.short { color: var(--accent); }
.orb-tag { display: inline-block; font-size: 11px; color: #e59b3c; border: 1px solid #e59b3c; border-radius: 6px; padding: 0 6px; margin-left: 6px; }
.orb-principles { margin-top: 8px; font-size: 11.5px; line-height: 1.7; color: var(--text-dim); }
.orb-principles b { color: var(--text); }
.orb-q { left: 50%; top: 50%; transform: translate(-50%, -50%); width: min(600px, calc(100% - 24px)); padding: 14px 16px 12px; max-height: calc(100% - 110px); overflow: auto; }
.orb-q .row { display: flex; align-items: center; gap: 8px; margin: 8px 0; flex-wrap: wrap; }
.orb-q .row label { color: var(--text-dim); font-size: 12.5px; flex: none; }
.orb-q select {
  background: var(--card); color: var(--text); border: 1px solid var(--card-border);
  border-radius: 8px; padding: 4px 8px; font-size: 13px;
}
.orb-q .status { font-size: 12.5px; line-height: 1.7; margin-top: 8px; min-height: 40px; }
.orb-q .status.ok { color: #3aa88f; }
.orb-q .status.bad { color: #e0684b; }
.orb-q .qdesc { font-size: 14px; font-weight: 600; margin: 8px 0; min-height: 22px; }
.orb-lib { left: 50%; bottom: 64px; transform: translateX(-50%); width: min(760px, calc(100% - 24px)); padding: 10px 12px; }
.orb-libgrid { display: flex; flex-wrap: wrap; gap: 4px; }
.orb-libgrid button {
  border: 1px solid var(--card-border); background: transparent; color: var(--text);
  border-radius: 7px; padding: 3px 8px; font-size: 12px; cursor: pointer;
}
.orb-libgrid button:hover { border-color: var(--accent); }
.orb-libgrid button.on { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 18%, transparent); }
.orb-libinfo { margin-top: 7px; font-size: 12px; line-height: 1.65; color: var(--text-dim); }
.orb-libinfo b { color: var(--text); }
@media (max-width: 640px) {
  .orb-rchart { left: 10px; bottom: 10px; width: calc(100% - 20px); }
  .orb-elgrid { grid-template-columns: repeat(9, 1fr); }
  .orb-edu, .orb-conf, .orb-q { top: 54%; }
}
`;
document.head.appendChild(style);

/* ---------------- 场景 ---------------- */

const stage = document.getElementById('stage');
const loader = makeLoader(stage, '正在构建波函数…');

const app = createApp({
  container: stage,
  fov: 50, near: 0.1, far: 500,
  cameraPos: [4, 9, 26],
  target: [0, 0, 0],
  minDistance: 4, maxDistance: 90,
  toneMapping: THREE.NoToneMapping, // 相位红蓝保真
});
const { scene, camera, controls } = app;

const cloudGroup = new THREE.Group();
scene.add(cloudGroup);

const st = {
  n: 2, l: 1, i: 2,               // 当前轨道（默认 2pz）
  pointCount: 40000,
  pointSize: 0.13,
  phase: true,
  showNodes: false,
  spin: false,
  exposeT0: -10,                  // 曝光动画起点（elapsed 秒）
  cloudN: 0,
  nodeMark: true,
  edu: { count: 0, playing: false, speed: 3, acc: 0 },
  cfg: { Z: 19, shown: 0, playing: false, speed: 12, acc: 0 },
  section: 0,
};

const ptMat = new THREE.PointsMaterial({
  size: st.pointSize, sizeAttenuation: true, vertexColors: true,
  transparent: true, opacity: 0.9, depthWrite: false,
});
let points = null;
let nodeGroup = null;

function setPhaseColors() {
  ptMat.vertexColors = st.phase;
  ptMat.color.set(st.phase ? 0xffffff : 0x9fb2c8);
  ptMat.needsUpdate = true;
}

function buildNodal() {
  if (nodeGroup) { cloudGroup.remove(nodeGroup); nodeGroup.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); }); nodeGroup = null; }
  if (!st.showNodes) return;
  const S = rMaxOf(st.n) * 0.86;
  const mat = new THREE.MeshBasicMaterial({ color: 0x6fbfae, transparent: true, opacity: 0.13, side: THREE.DoubleSide, depthWrite: false });
  nodeGroup = new THREE.Group();
  const kind = ORB_OPTS[st.l][st.i].k;
  for (const nd of NODES[kind]) {
    if (nd.v !== undefined) {
      const geo = new THREE.PlaneGeometry(S, S);
      geo.rotateY(Math.PI / 2);
      geo.rotateZ((nd.v * Math.PI) / 180);
      nodeGroup.add(new THREE.Mesh(geo, mat));
    } else if (nd.h) {
      const geo = new THREE.PlaneGeometry(S, S);
      geo.rotateX(Math.PI / 2);
      nodeGroup.add(new THREE.Mesh(geo, mat));
    } else if (nd.c) {
      const len = S * 0.9;
      const geo = new THREE.ConeGeometry(nd.c * len, len, 40, 1, true);
      geo.translate(0, -len / 2, 0);
      const m1 = new THREE.Mesh(geo, mat);
      const m2 = new THREE.Mesh(geo, mat);
      m2.scale.y = -1;
      const g = new THREE.Group();
      g.add(m1); g.add(m2);
      g.rotation.x = Math.PI / 2;
      nodeGroup.add(g);
    }
  }
  cloudGroup.add(nodeGroup);
}

function frameOrbital(instant = false) {
  const d = clamp(rMaxOf(st.n) * 1.42, 7, 64);
  const dir = new THREE.Vector3(1.15, 0.55, 0.75).normalize().multiplyScalar(d);
  app.setCamera([dir.x, dir.y, dir.z], [0, 0, 0], instant);
}

let currentHud = null;
function rebuildCloud(opts = {}) {
  const { expose = false, instant = false } = opts;
  if (points) {
    cloudGroup.remove(points);
    points.geometry.dispose();
    points = null;
  }
  const kind = ORB_OPTS[st.l][st.i].k;
  const { pos, col, count } = sampleCloud(st.n, st.l, kind, st.pointCount, 20261030 + st.n * 1000 + st.l * 100 + st.i);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setDrawRange(0, expose ? 0 : count);
  points = new THREE.Points(geo, ptMat);
  points.frustumCulled = false;
  cloudGroup.add(points);
  st.cloudN = count;
  st.exposeT0 = expose ? performance.now() * 0.001 : -10;
  buildNodal();
  if (!opts.noFrame) frameOrbital(instant);
  if (currentHud) {
    currentHud.set('pts', count.toLocaleString() + ' 点');
  }
  updateHudOrb();
}
function updateHudOrb() {
  if (!currentHud) return;
  currentHud.set('orb', orbName(st.n, st.l, st.i));
}
function setOrb(n, l, i, opts = {}) {
  st.n = n; st.l = l; st.i = i;
  rebuildCloud(opts);
  if (st.section === 2) drawRChart();
  if (st.section === 6) updateLibInfo();
}

/* ---------------- DOM 覆盖层 ---------------- */

const hudWrap = document.createElement('div');
hudWrap.className = 'lab-hud';
stage.appendChild(hudWrap);
function buildHud(rows) {
  hudWrap.innerHTML = '';
  currentHud = makeHUD(hudWrap, rows);
  return currentHud;
}

// 径向分布图卡片（3D 视区左下角）
const rchartCard = document.createElement('div');
rchartCard.className = 'orb-card orb-rchart hide';
rchartCard.innerHTML = '<h3>径向分布 D(r) = r²R²</h3>';
const rcCanvas = document.createElement('canvas');
rcCanvas.width = 760; rcCanvas.height = 380;
rchartCard.appendChild(rcCanvas);
const rcCap = document.createElement('div');
rcCap.className = 'cap';
rchartCard.appendChild(rcCap);
stage.appendChild(rchartCard);
const rcCtx = rcCanvas.getContext('2d');

function drawRChart() {
  const W = 380, H = 190;
  const ctx = rcCtx;
  ctx.setTransform(2, 0, 0, 2, 0, 0);
  ctx.clearRect(0, 0, W, H);
  const n = st.n, l = st.l;
  const R = RAD[n + ',' + l];
  const rMax = rMaxOf(n);
  const pad = { l: 34, r: 8, t: 8, b: 24 };
  const pw = W - pad.l - pad.r, ph = H - pad.t - pad.b;
  // 采样曲线
  const NP = 300;
  const D = new Float64Array(NP + 1);
  let dMax = 0;
  for (let i = 0; i <= NP; i++) {
    const r = (i / NP) * rMax, v = R(r), d = v * v * r * r;
    D[i] = d; if (d > dMax) dMax = d;
  }
  const xOf = (r) => pad.l + (r / rMax) * pw;
  const yOf = (d) => pad.t + ph - (d / dMax) * ph * 0.96;
  // 网格与坐标轴
  ctx.strokeStyle = 'rgba(128,142,158,0.22)';
  ctx.lineWidth = 1;
  const tick = rMax > 30 ? 10 : rMax > 15 ? 5 : 2;
  ctx.fillStyle = 'rgba(140,152,166,0.95)';
  ctx.font = '10px -apple-system, "PingFang SC", sans-serif';
  ctx.textAlign = 'center';
  for (let r = 0; r <= rMax; r += tick) {
    const x = xOf(r);
    ctx.beginPath(); ctx.moveTo(x, pad.t); ctx.lineTo(x, pad.t + ph); ctx.stroke();
    ctx.fillText(String(r), x, H - 9);
  }
  ctx.textAlign = 'right';
  ctx.fillText('r/a₀', W - pad.r, H - 9);
  // 曲线填充 + 描线
  ctx.beginPath();
  ctx.moveTo(xOf(0), yOf(0));
  for (let i = 0; i <= NP; i++) ctx.lineTo(xOf((i / NP) * rMax), yOf(D[i]));
  ctx.lineTo(xOf(rMax), yOf(0));
  ctx.closePath();
  ctx.fillStyle = 'rgba(232,103,74,0.14)';
  ctx.fill();
  ctx.beginPath();
  for (let i = 0; i <= NP; i++) {
    const x = xOf((i / NP) * rMax), y = yOf(D[i]);
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  }
  ctx.strokeStyle = '#e8674a';
  ctx.lineWidth = 1.8;
  ctx.stroke();
  // 径向节点虚线
  const nodes = radialNodes(n, l);
  if (st.nodeMark) {
    ctx.setLineDash([4, 3]);
    ctx.strokeStyle = 'rgba(90,160,255,0.85)';
    ctx.lineWidth = 1.2;
    ctx.font = '10.5px -apple-system, "PingFang SC", sans-serif';
    ctx.fillStyle = 'rgba(90,160,255,1)';
    ctx.textAlign = 'center';
    nodes.forEach((r, i) => {
      const x = xOf(r);
      ctx.beginPath(); ctx.moveTo(x, pad.t + 4); ctx.lineTo(x, pad.t + ph); ctx.stroke();
      ctx.fillText('r' + (i + 1) + '=' + r.toFixed(1), x, pad.t + 13 + (i % 2) * 12);
    });
    ctx.setLineDash([]);
  }
  // 说明
  rcCap.textContent = `${orbName(n, l, st.i)}：径向节点 ${n - l - 1} 个（n−l−1，蓝虚线）· 角节面 ${l} 个${nodes.length === 0 ? ' · 该轨道无径向节点' : ''}`;
}

// 能级图卡片
const eduCard = document.createElement('div');
eduCard.className = 'orb-card orb-edu hide';
eduCard.innerHTML = '<h3>构造原理 · 能级图 <span id="orbEduCount" style="font-weight:500;font-size:12px;color:var(--text-dim)"></span></h3>';
const eduCanvas = document.createElement('canvas');
eduCanvas.width = 1360; eduCanvas.height = 680;
eduCard.appendChild(eduCanvas);
const eduCap = document.createElement('div');
eduCap.className = 'cap';
eduCap.textContent = '能级由低到高：1s 2s 2p 3s 3p 4s 3d 4p —— n+l 越小越先填；n+l 相同则 n 小者先填。注意能级交错：E(4s)＜E(3d)，所以钾、钙先填 4s 再填 3d。';
eduCard.appendChild(eduCap);
stage.appendChild(eduCard);
const eduCtx = eduCanvas.getContext('2d');

function drawEdu() {
  const W = 680, H = 340;
  const ctx = eduCtx;
  ctx.setTransform(2, 0, 0, 2, 0, 0);
  ctx.clearRect(0, 0, W, H);
  const x0 = 92, boxW = 30, boxH = 26, rowH = 38;
  const yBase = H - 34;
  const fill = st.edu.count;
  let rem = fill;
  ctx.font = '600 13px -apple-system, "PingFang SC", sans-serif';
  SUBS.forEach((s, idx) => {
    const y = yBase - idx * rowH;
    const take = Math.min(rem, s.cap); rem -= take;
    const boxes = s.cap / 2;
    // 标签
    ctx.fillStyle = 'rgba(140,152,166,1)';
    ctx.textAlign = 'right';
    ctx.fillText(s.label, x0 - 8, y + boxH / 2 + 4.5);
    // 交错高亮
    if (s.label === '4s' || s.label === '3d') {
      ctx.strokeStyle = 'rgba(229,155,60,0.9)';
      ctx.lineWidth = 1.4;
      ctx.strokeRect(x0 - 56, y - 4, boxes * boxW + 4 + 52, boxH + 8);
    }
    for (let b = 0; b < boxes; b++) {
      const x = x0 + b * boxW;
      ctx.strokeStyle = 'rgba(140,152,166,0.75)';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(x, y, boxW - 4, boxH);
      const hasUp = b < take;
      const hasDown = b < take - boxes;
      ctx.textAlign = 'center';
      ctx.font = '15px -apple-system, sans-serif';
      if (hasUp) { ctx.fillStyle = '#e8674a'; ctx.fillText('↑', x + (boxW - 4) / 2, y + boxH / 2 + 5.5); }
      if (hasDown) { ctx.fillStyle = '#4a90c4'; ctx.fillText('↓', x + (boxW - 4) / 2 + 6, y + boxH / 2 + 5.5); }
      ctx.font = '600 13px -apple-system, "PingFang SC", sans-serif';
    }
    // 已填电子数
    if (take > 0) {
      ctx.fillStyle = 'rgba(140,152,166,0.9)';
      ctx.textAlign = 'left';
      ctx.font = '10.5px -apple-system, sans-serif';
      ctx.fillText(String(take), x0 + boxes * boxW + 4, y + boxH / 2 + 4);
      ctx.font = '600 13px -apple-system, "PingFang SC", sans-serif';
    }
  });
  // 交错标注
  ctx.fillStyle = '#e59b3c';
  ctx.textAlign = 'left';
  ctx.font = '600 11.5px -apple-system, "PingFang SC", sans-serif';
  ctx.fillText('能级交错：E(4s)＜E(3d)', x0 + 118, yBase - 5 * rowH + 6);
  const cnt = document.getElementById('orbEduCount');
  if (cnt) cnt.textContent = `已填 ${fill} / 36 e⁻`;
}

// 电子排布卡片
const confCard = document.createElement('div');
confCard.className = 'orb-card orb-conf hide';
confCard.innerHTML = `
  <h3>电子排布 <span class="orb-tag hide" id="orbSpecialTag">洪特规则特例：半满 / 全满更稳定</span></h3>
  <div class="orb-elgrid" id="orbElGrid"></div>
  <div class="orb-flex">
    <div class="left"><canvas id="orbBoxCanvas" width="880" height="330"></canvas></div>
    <div class="right">
      <div style="font-size:12.5px;color:var(--text-dim)" id="orbConfElem"></div>
      <div class="orb-conf-line" id="orbConfFull">—</div>
      <div class="orb-conf-line short" id="orbConfShort">—</div>
      <div class="orb-principles">
        <b>三条原则</b>：① 能量最低——先填低能级（构造原理）；② 泡利不相容——每个轨道最多 2 个电子、自旋相反；③ 洪特规则——等价轨道先分占、自旋平行，半满 / 全满更稳定。
      </div>
    </div>
  </div>`;
stage.appendChild(confCard);

const elBtns = [];
{
  const grid = confCard.querySelector('#orbElGrid');
  for (let z = 1; z <= 36; z++) {
    const b = document.createElement('button');
    b.type = 'button';
    b.innerHTML = `${EL36[z - 1]}<i>${z}</i>`;
    b.addEventListener('click', () => selectElement(z));
    if (z === 24 || z === 29) b.classList.add('special');
    grid.appendChild(b);
    elBtns.push(b);
  }
}
const boxCanvas = confCard.querySelector('#orbBoxCanvas');
const boxCtx = boxCanvas.getContext('2d');

function drawConfBoxes() {
  const W = 440, H = 165;
  const ctx = boxCtx;
  ctx.setTransform(2, 0, 0, 2, 0, 0);
  ctx.clearRect(0, 0, W, H);
  const Z = st.cfg.Z;
  const cnt = fillCounts(Z);
  const shown = st.cfg.shown;
  // 展示顺序分两行：1s 2s 2p 3s 3p | 4s 3d 4p（能量顺序）
  const rows = [SUBS.slice(0, 5), SUBS.slice(5)];
  let used = 0; // 已展示电子数
  const boxW = 22, boxH = 24, rowH = 74, x0 = 6;
  ctx.font = '600 12px -apple-system, "PingFang SC", sans-serif';
  rows.forEach((row, ri) => {
    const y = 14 + ri * rowH;
    let x = x0;
    row.forEach((s) => {
      const take = cnt[s.label];
      const boxes = s.cap / 2;
      // 子层标签
      ctx.fillStyle = 'rgba(140,152,166,1)';
      ctx.textAlign = 'left';
      ctx.fillText(s.label, x, y + boxH + 13);
      for (let b = 0; b < boxes; b++) {
        ctx.strokeStyle = 'rgba(140,152,166,0.7)';
        ctx.lineWidth = 1.1;
        ctx.strokeRect(x + b * boxW, y, boxW - 4, boxH);
        // 该格内已展示的电子数
        let up = 0, down = 0;
        if (take > 0) {
          const subShown = clamp(shown - (usedBefore(rows, ri, s) ), 0, take);
          up = Math.min(subShown, Math.min(take, boxes)) > b ? 1 : 0;
          down = (subShown > boxes && b < subShown - boxes) ? 1 : 0;
        }
        ctx.textAlign = 'center';
        ctx.font = '13px -apple-system, sans-serif';
        if (up) { ctx.fillStyle = '#e8674a'; ctx.fillText('↑', x + b * boxW + (boxW - 4) / 2 - 2.5, y + boxH / 2 + 5); }
        if (down) { ctx.fillStyle = '#4a90c4'; ctx.fillText('↓', x + b * boxW + (boxW - 4) / 2 + 3.5, y + boxH / 2 + 5); }
        ctx.font = '600 12px -apple-system, "PingFang SC", sans-serif';
      }
      x += boxes * boxW + 8;
    });
  });
  // 计算某行之前累计容量（用于顺序揭示）
  function usedBefore(rowsArr, ri, s) {
    let c = 0;
    for (let r = 0; r <= ri; r++) {
      for (const ss of rowsArr[r]) {
        if (ss === s) return c;
        c += fillCounts(st.cfg.Z)[ss.label];
      }
    }
    return c;
  }
}

function selectElement(z, animate = true) {
  st.cfg.Z = z;
  st.cfg.shown = animate ? 0 : z;
  st.cfg.playing = animate;
  st.cfg.acc = 0;
  elBtns.forEach((b, i) => b.classList.toggle('on', i + 1 === z));
  const d = confCard.querySelector('#orbConfElem');
  d.textContent = `${z} 号 · ${CN36[z - 1]} ${EL36[z - 1]}（${z} 个电子）`;
  confCard.querySelector('#orbSpecialTag').classList.toggle('hide', !(z === 24 || z === 29));
  confCard.querySelector('#orbConfFull').textContent = configFull(z);
  confCard.querySelector('#orbConfShort').textContent = configShort(z);
  drawConfBoxes();
  if (currentHud) currentHud.set('elem', `${CN36[z - 1]} ${EL36[z - 1]}（${z} 号）`);
}

// 量子数卡片
const qCard = document.createElement('div');
qCard.className = 'orb-card orb-q hide';
qCard.innerHTML = `
  <h3>量子数练习 <span style="font-weight:500;font-size:12px;color:var(--text-dim)" id="orbQScore"></span></h3>
  <div class="qdesc" id="orbQDesc">自由探究：随意组合四个量子数，看看什么是合法组合。</div>
  <div class="row">
    <label>n 主量子数</label><select id="orbQn"></select>
    <label>l 角量子数</label><select id="orbQl"></select>
    <label>m 磁量子数</label><select id="orbQm"></select>
    <label>s 自旋</label><select id="orbQs"></select>
  </div>
  <div class="status" id="orbQStatus"></div>
  <div class="row" style="margin-top:10px">
    <button class="ctl-btn" type="button" id="orbQSubmit">提交答案</button>
    <button class="ctl-btn active" type="button" id="orbQNext">随机出一题</button>
  </div>`;
stage.appendChild(qCard);

const QZ_BANK = [
  { desc: '「3p¹ 的那个电子」—— n 与 l 应为多少？（m、s 取任一合法值即可）', n: 3, l: 1, m: null, s: null,
    ex: '3p：n=3（第 3 电子层）、l=1（p 轨道，哑铃形）；m 可取 −1/0/+1，s 可取 ±½。' },
  { desc: '2p_z 轨道（m=0）上自旋向上的那个电子 —— 四个量子数？', n: 2, l: 1, m: 0, s: 0.5,
    ex: '2p_z 沿 z 轴取向对应 m=0；自旋向上 s=+½。即 (2, 1, 0, +½)。' },
  { desc: '4f 轨道（l=3）中 m=+2、自旋向下的电子 —— 四个量子数？', n: 4, l: 3, m: 2, s: -0.5,
    ex: 'f 轨道 l=3，m 合法取值 −3…+3，m=+2 是其中一个取向；自旋向下 s=−½。' },
  { desc: '某电子 n=3、l=2（3d 轨道）—— 请给出一组完整的合法量子数（m、s 任一合法值）', n: 3, l: 2, m: null, s: null,
    ex: '3d：n=3、l=2，m ∈ {−2,−1,0,+1,+2}，s = ±½，五条 d 轨道共可容纳 10 个电子。' },
  { desc: '1s 轨道里的任一电子 —— n、l、m 是多少？（s 任一合法值）', n: 1, l: 0, m: 0, s: null,
    ex: '1s：n=1、l=0，m 只能取 0（球形无取向），自旋可上可下——所以 1s 最多 2 个电子（泡利原理）。' },
];
const qz = { active: false, idx: 0, score: 0 };
function qSel(id) { return qCard.querySelector(id); }
function fillSelect(sel, opts) {
  sel.innerHTML = '';
  opts.forEach(([v, t]) => {
    const o = document.createElement('option');
    o.value = v; o.textContent = t;
    sel.appendChild(o);
  });
}
fillSelect(qSel('#orbQn'), [[1, '1'], [2, '2'], [3, '3'], [4, '4']]);
fillSelect(qSel('#orbQl'), [[0, '0（s）'], [1, '1（p）'], [2, '2（d）'], [3, '3（f）']]);
fillSelect(qSel('#orbQm'), [[-3, '−3'], [-2, '−2'], [-1, '−1'], [0, '0'], [1, '+1'], [2, '+2'], [3, '+3']]);
fillSelect(qSel('#orbQs'), [[0.5, '+½（向上）'], [-0.5, '−½（向下）']]);
['#orbQn', '#orbQl', '#orbQm', '#orbQs'].forEach((id) => qSel(id).addEventListener('change', () => qStatus()));
function qVals() {
  return { n: +qSel('#orbQn').value, l: +qSel('#orbQl').value, m: +qSel('#orbQm').value, s: +qSel('#orbQs').value };
}
function qStatus() {
  const el = qSel('#orbQStatus');
  const v = qVals();
  if (v.l >= v.n) { el.className = 'status bad'; el.textContent = `✗ 不合法：l 必须 ＜ n（n=${v.n} 时 l 最大取 ${v.n - 1}）`; return false; }
  if (Math.abs(v.m) > v.l) { el.className = 'status bad'; el.textContent = `✗ 不合法：|m| 必须 ≤ l（l=${v.l} 时 m 只能取 ${-v.l}…+${v.l}）`; return false; }
  el.className = 'status ok';
  const shape = ['球形（s）', '哑铃形（p）', '花瓣形（d）', '复杂多瓣（f）'][v.l];
  el.textContent = `✓ 合法：第 ${v.n} 电子层 · ${v.l ? ['p', 'd', 'f'][v.l - 1] : 's'} 轨道（${shape}）· ${v.l ? '空间取向 m=' + (v.m > 0 ? '+' : '') + v.m : '无方向性 m=0'} · 自旋${v.s > 0 ? '向上' : '向下'}`;
  return true;
}
qSel('#orbQSubmit').addEventListener('click', () => {
  const stEl = qSel('#orbQStatus');
  if (!qz.active) { qz.active = true; qz.idx = 0; qz.score = 0; qLoad(); return; }
  const item = QZ_BANK[qz.idx];
  const v = qVals();
  const ok = v.n === item.n && v.l === item.l && Math.abs(v.m) <= v.l
    && (item.m == null || v.m === item.m)
    && (item.s == null || v.s === item.s);
  if (ok) qz.score++;
  stEl.className = 'status ' + (ok ? 'ok' : 'bad');
  const right = `（${item.n}, ${item.l}, ${item.m == null ? '任意' : (item.m > 0 ? '+' + item.m : item.m)}, ${item.s == null ? '任意' : (item.s > 0 ? '+½' : '−½')}）`;
  stEl.textContent = (ok ? '✓ 正确。' : '✗ 不对，参考答案 ' + right + '。') + item.ex;
  qSel('#orbQScore').textContent = `第 ${qz.idx + 1}/${QZ_BANK.length} 题 · 得分 ${qz.score}`;
});
qSel('#orbQNext').addEventListener('click', () => { qz.active = true; qz.idx = 0; qz.score = 0; qLoad(); });
function qLoad() {
  const item = QZ_BANK[qz.idx];
  qSel('#orbQDesc').textContent = `第 ${qz.idx + 1}/${QZ_BANK.length} 题：${item.desc}`;
  qSel('#orbQScore').textContent = `得分 ${qz.score}`;
  const stEl = qSel('#orbQStatus');
  stEl.className = 'status';
  stEl.textContent = '设置四个量子数后点「提交答案」。';
}

// 轨道库卡片
const libCard = document.createElement('div');
libCard.className = 'orb-card orb-lib hide';
libCard.innerHTML = '<div class="orb-libgrid" id="orbLibGrid"></div><div class="orb-libinfo" id="orbLibInfo"></div>';
stage.appendChild(libCard);
const LIB_ITEMS = [
  [1, 0, 0], [2, 0, 0], [3, 0, 0], [4, 0, 0],
  [2, 1, 0], [2, 1, 1], [2, 1, 2], [3, 1, 2],
  [3, 2, 0], [3, 2, 1], [3, 2, 2], [3, 2, 3], [3, 2, 4],
  [4, 3, 0], [4, 3, 1], [4, 3, 2], [4, 3, 3], [4, 3, 4], [4, 3, 5], [4, 3, 6],
];
const libBtns = [];
{
  const grid = libCard.querySelector('#orbLibGrid');
  LIB_ITEMS.forEach(([n, l, i], idx) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = orbName(n, l, i);
    b.addEventListener('click', () => libSelect(idx));
    grid.appendChild(b);
    libBtns.push(b);
  });
}
function libSelect(idx) {
  const [n, l, i] = LIB_ITEMS[idx];
  libBtns.forEach((b, j) => b.classList.toggle('on', j === idx));
  setOrb(n, l, i);
}
function updateLibInfo() {
  const [n, l] = [st.n, st.l];
  const info = libCard.querySelector('#orbLibInfo');
  if (!info) return;
  const nodes = radialNodes(n, l);
  const nodeTxt = nodes.length ? nodes.map((r) => r.toFixed(1)).join('、') + ' a₀' : '无';
  info.innerHTML = `<b>${orbName(n, l, st.i)}</b> — ${orbDesc(n, l)}。角节面 <b>${l}</b> 个 · 径向节点 <b>${n - l - 1}</b> 个（位于 ${nodeTxt}）· 最概然半径 r* ≈ <b>${rStar(n, l).toFixed(1)} a₀</b>`;
}

/* ---------------- 随堂检测 ---------------- */

const QUIZ = [
  {
    q: '电子云图中的小黑点，其疏密表示的是？',
    opts: ['电子出现的机会（概率密度）大小', '电子个数的多少', '电子运动的固定轨迹', '电子质量的大小'],
    a: 0,
    ex: '电子云不是电子真的像云一样摊开：小黑点表示电子在核外各处出现的机会，点越密 = 概率密度 |ψ|² 越大，氢原子 1s 只有一个电子。',
  },
  {
    q: '2p 轨道的角向节面（ψ=0 的平面）有几个？',
    opts: ['0 个', '1 个', '2 个', '3 个'],
    a: 1,
    ex: '角向节面数 = l。2p 的 l=1，只有一个节面（如 2pz 的节面是 xy 平面），节面两侧两瓣相位相反。',
  },
  {
    q: '3s 电子的径向节点数是？',
    opts: ['0 个', '1 个', '2 个', '3 个'],
    a: 2,
    ex: '径向节点数 = n−l−1 = 3−0−1 = 2。3s 的径向分布曲线上有两个 D(r)=0 的位置（r≈1.9 与 7.1 a₀）。',
  },
  {
    q: '按构造原理，钾（19 号）的最后一个电子应先填入？',
    opts: ['3d 轨道', '4s 轨道', '4p 轨道', '3p 轨道'],
    a: 1,
    ex: '能级交错使 E(4s)＜E(3d)：3p 填满后先填 4s（所以 K 是 [Ar]4s¹ 而不是 [Ar]3d¹），再开始填 3d。',
  },
  {
    q: 'Cr（24 号）的价层电子排布是？',
    opts: ['3d⁴4s²', '3d⁵4s¹', '3d⁶4s⁰', '4s²4p⁴'],
    a: 1,
    ex: '洪特规则特例：3d⁵ 为半满、更稳定，所以 4s 的一个电子调入 3d，实际排布为 [Ar]3d⁵4s¹。Cu（29 号）同理是 3d¹⁰4s¹。',
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
      <p style="color:var(--text-dim);margin:4px 0 18px">正确率 ${pct}%${pct >= 80 ? '，轨道与排布你已经掌握了！' : pct >= 60 ? '，大部分概念已经清楚，回顾一下错题。' : '，建议回到前面章节再看一遍哦。'}</p>`;
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
    row.appendChild(back);
    row.appendChild(again);
    card.appendChild(row);
    panel.appendChild(card);
  }

  renderQ();
  activeSectionCleanup = () => panel.remove();
}

/* ---------------- 章节复位与控件 ---------------- */

const ctl = createControlsPanel(document.getElementById('controls'));
let activeSectionCleanup = null;

function showOnly(cards) {
  rchartCard.classList.toggle('hide', !cards.rchart);
  eduCard.classList.toggle('hide', !cards.edu);
  confCard.classList.toggle('hide', !cards.conf);
  qCard.classList.toggle('hide', !cards.q);
  libCard.classList.toggle('hide', !cards.lib);
  if (!cards.q && qz.active) { qz.active = false; }
  // 纯 DOM 卡片章节（能级/排布/量子数）没有 3D 内容：隐藏点云避免背景残留
  const domOnly = cards.edu || cards.conf || cards.q;
  if (cloudGroup) cloudGroup.visible = !domOnly;
}

// 轨道三滑杆（n / l / 方向）
function addOrbitSliders(n0, l0, i0, onChange) {
  const cur = { n: n0, l: l0, i: i0 };
  let sL = null, sI = null;
  const apply = () => onChange(cur.n, cur.l, cur.i);
  const sN = ctl.slider({
    label: '主量子数 n', min: 1, max: 4, value: n0,
    fmt: (v) => `n=${v}`,
    onInput: (v) => {
      cur.n = v;
      if (cur.l > cur.n - 1) { cur.l = cur.n - 1; if (sL) sL.set(cur.l); }
      const maxI = ORB_OPTS[cur.l].length - 1;
      if (cur.i > maxI) { cur.i = maxI; if (sI) sI.set(cur.i); }
      apply();
    },
  });
  sL = ctl.slider({
    label: '角量子数 l', min: 0, max: 3, value: l0,
    fmt: (v) => {
      const lv = Math.min(v, cur.n - 1);
      return `l=${lv}（${L_LETTER[lv]}）`;
    },
    onInput: (v) => {
      cur.l = Math.min(v, cur.n - 1);
      if (v !== cur.l && sL) sL.set(cur.l);
      const maxI = ORB_OPTS[cur.l].length - 1;
      cur.i = Math.min(cur.i, maxI);
      if (sI) sI.set(cur.i);
      apply();
    },
  });
  sI = ctl.slider({
    label: '方向（实轨道）', min: 0, max: 6, value: i0,
    fmt: (v) => {
      const list = ORB_OPTS[cur.l];
      const iv = Math.min(v, list.length - 1);
      return list[iv].name || '球形';
    },
    onInput: (v) => {
      const maxI = ORB_OPTS[cur.l].length - 1;
      cur.i = Math.min(v, maxI);
      if (v !== cur.i && sI) sI.set(cur.i);
      apply();
    },
  });
  return { cur, sN, sL, sI };
}

const SECTIONS = [
  {
    title: '电子云',
    html: `<p>解出氢原子的薛定谔方程，得到波函数 <span class="hl">ψ</span>，而 |ψ|² 给出电子在空间各点出现的<b>概率密度</b>——把无数个「可能的位置」撒成点，就成了<b>电子云</b>。本实验用真实波函数撒点：<span class="hl">ψ&gt;0 红色、ψ&lt;0 蓝色</span>，点的密度正比于 |ψ|²。</p>
<p>拖动 n / l / 方向三个滑杆切换轨道（1s ~ 4f），点「曝光重播」看点云逐点长出来的过程。</p>`,
    enter() {
      resetWorld();
      st.section = 0;
      showOnly({});
      setOrb(2, 1, 2, { expose: true, instant: true });
      app.setCamera([4.5, 9, 24], [0, 0, 0]);
      buildHud([['orb', '当前轨道'], ['pts', '显示点数']]);
      currentHud.set('pts', st.cloudN.toLocaleString() + ' 点');
      ctl.clear();
      addOrbitSliders(st.n, st.l, st.i, (n, l, i) => setOrb(n, l, i, { expose: false }));
      ctl.sep();
      ctl.button({ label: '⏳ 曝光重播', onClick: () => { st.exposeT0 = performance.now() * 0.001; if (points) points.geometry.setDrawRange(0, 0); } });
      ctl.slider({
        label: '点数', min: 10000, max: 60000, step: 5000, value: st.pointCount,
        fmt: (v) => (v / 1000) + 'k',
        onInput: (v) => { st.pointCount = v; rebuildCloud({ expose: false, instant: true }); },
      });
      ctl.slider({
        label: '点大小', min: 0.02, max: 0.14, step: 0.005, value: st.pointSize,
        fmt: (v) => v.toFixed(2),
        onInput: (v) => { st.pointSize = v; ptMat.size = v; },
      });
    },
  },
  {
    title: '轨道形状',
    html: `<p>轨道的<b>形状</b>由角向波函数决定：<span class="hl">s 球形全正</span>；<b>p 哑铃两瓣、相位相反</b>，中间夹着一个节面（yoz 等坐标平面）；<b>d 四瓣交替</b>（dz² 是「双瓣+环」），f 更复杂。</p>
<p>打开「显示节面」看 ψ=0 的平面 / 双圆锥；关掉「相位着色」再看一眼——节面两侧本该是两种颜色。红色为 ψ&gt;0、蓝色为 ψ&lt;0。</p>`,
    enter() {
      resetWorld();
      st.section = 1;
      showOnly({});
      buildHud([['orb', '当前轨道'], ['surf', '角节面']]);
      ctl.clear();
      let fam = '3d', fidx = 0;
      const FAM = { '1s': [1, 0], '2s': [2, 0], '2p': [2, 1], '3p': [3, 1], '3d': [3, 2], '4f': [4, 3] };
      const build = () => {
        const [n, l] = FAM[fam];
        setOrb(n, l, fidx);
        currentHud.set('surf', `${l} 个`);
      };
      ctl.seg({
        options: Object.keys(FAM).map((k) => ({ label: k, value: k })),
        value: fam,
        onChange: (v) => { fam = v; fidx = 0; build(); buildShapeSecond(); },
      });
      const second = document.createElement('span');
      second.className = 'ctl-sep';
      const buildShapeSecond = () => {
        // 重建方向段：插入到控件条末尾（先清掉旧的方向段）
        const host = ctl.el;
        while (host.lastChild && host.lastChild !== second && host.children.length > 2) host.removeChild(host.lastChild);
        const l = FAM[fam][1];
        ctl.seg({
          options: ORB_OPTS[l].map((o, i) => ({ label: o.name || '球', value: i })),
          value: fidx,
          onChange: (v) => { fidx = v; build(); },
        });
        host.appendChild(second);
      };
      buildShapeSecond();
      ctl.sep();
      ctl.toggle({ label: '显示节面', value: st.showNodes, onChange: (v) => { st.showNodes = v; buildNodal(); } });
      ctl.toggle({ label: '相位着色', value: st.phase, onChange: (v) => { st.phase = v; setPhaseColors(); } });
      ctl.toggle({ label: '自动旋转', value: st.spin, onChange: (v) => { st.spin = v; } });
      ctl.button({ label: '⌂ 复位视角', onClick: () => frameOrbital() });
      build();
    },
  },
  {
    title: '径向分布与节面',
    html: `<p>把波函数拆成<b>径向</b>与<b>角向</b>两部分看：<span class="hl">径向分布 D(r)=r²R²</span>（左下角图）回答「电子在距核 r 处出现的总机会」。曲线碰到的零点叫<b>径向节点</b>，个数 = <span class="hl">n−l−1</span>；角向的 ψ=0 面叫<b>角节面</b>，个数 = l。</p>
<p>对比 3s（2 个径向节点）与 2p（0 个）：左下角曲线上的蓝色虚线就是节点位置。换轨道，看曲线怎么变。</p>`,
    enter() {
      resetWorld();
      st.section = 2;
      showOnly({ rchart: true });
      setOrb(3, 0, 0, { instant: true });
      app.setCamera([4, 8, 20], [0, 0, 0]);
      buildHud([['orb', '当前轨道'], ['pts', '显示点数']]);
      drawRChart();
      ctl.clear();
      addOrbitSliders(st.n, st.l, st.i, (n, l, i) => setOrb(n, l, i));
      ctl.sep();
      ctl.toggle({
        label: '节点标注', value: st.nodeMark,
        onChange: (v) => { st.nodeMark = v; drawRChart(); },
      });
      ctl.button({ label: '⌂ 复位视角', onClick: () => frameOrbital() });
    },
  },
  {
    title: '能级与构造原理',
    html: `<p>多电子原子里能级高低遵守<span class="hl">构造原理（Madelung 规则）</span>：按 <b>1s → 2s → 2p → 3s → 3p → 4s → 3d → 4p</b> 的顺序填入电子（n+l 越小越先填）。</p>
<p>注意图中<span class="hl">能级交错：E(4s)＜E(3d)</span>（橙框）——所以 K、Ca 先填 4s，填满后才开始填 3d。点「自动填充」看 36 个电子依次入座。</p>`,
    enter() {
      resetWorld();
      st.section = 3;
      showOnly({ edu: true });
      app.setCamera([0, 2, 30], [0, 0, 0]);
      buildHud([['stat', '状态']]);
      currentHud.set('stat', '能级图');
      st.edu.count = 0;
      st.edu.playing = false;
      st.edu.acc = 0;
      drawEdu();
      ctl.clear();
      ctl.button({ label: '⏭ 单步 +1e⁻', onClick: () => { st.edu.playing = false; paintPlayBtn(); if (st.edu.count < 36) { st.edu.count++; drawEdu(); } } });
      st.eduPlayBtn = ctl.button({
        label: '▶ 自动填充',
        onClick: () => {
          if (st.edu.playing) { st.edu.playing = false; }
          else {
            if (st.edu.count >= 36) { st.edu.count = 0; }
            st.edu.playing = true;
          }
          paintPlayBtn();
        },
      });
      ctl.slider({
        label: '速度', min: 1, max: 12, step: 1, value: st.edu.speed,
        fmt: (v) => v + ' e⁻/s',
        onInput: (v) => { st.edu.speed = v; },
      });
      ctl.button({
        label: '↺ 重置',
        onClick: () => { st.edu.playing = false; paintPlayBtn(); st.edu.count = 0; drawEdu(); },
      });
    },
  },
  {
    title: '电子排布',
    html: `<p>点选 <b>1–36 号元素</b>，右侧按构造原理逐盒填入电子（等价轨道先 singly 再 pair，符合洪特规则），同时给出<b>电子排布式</b>与<b>简式</b>。</p>
<p>留意两个「不听话」的：<span class="hl">Cr（24 号）是 3d⁵4s¹</span>、<span class="hl">Cu（29 号）是 3d¹⁰4s¹</span>——半满 / 全满更稳定（点「看特例」直达）。书写的顺序按 n、l 排（3d 写在 4s 前），但填充顺序仍是先 4s 后 3d。</p>`,
    enter() {
      resetWorld();
      st.section = 4;
      showOnly({ conf: true });
      app.setCamera([0, 2, 30], [0, 0, 0]);
      buildHud([['elem', '元素'], ['pts', '显示点数']]);
      currentHud.set('pts', '—');
      selectElement(11, false);
      ctl.clear();
      ctl.slider({
        label: '填充速度', min: 4, max: 40, step: 2, value: st.cfg.speed,
        fmt: (v) => v + ' e⁻/s',
        onInput: (v) => { st.cfg.speed = v; },
      });
      ctl.button({
        label: '↺ 重播填充',
        onClick: () => selectElement(st.cfg.Z, true),
      });
      let specialTurn = 0;
      ctl.button({
        label: '⭐ 看特例（Cr / Cu）',
        onClick: () => { specialTurn = (specialTurn + 1) % 2; selectElement(specialTurn === 0 ? 24 : 29, true); },
      });
    },
  },
  {
    title: '量子数',
    html: `<p>一套量子数（n, l, m, s）<b>唯一确定</b>一个电子状态：<span class="hl">n</span> 定电子层与能量轮廓；<span class="hl">l</span> 定轨道形状（0/1/2/3 → s/p/d/f），必须 l＜n；<span class="hl">m</span> 定空间取向，必须 |m|≤l；<span class="hl">s</span> 自旋只能 ±½。</p>
<p>先自由拖四个下拉框体会合法性（下面会实时判对错并解释），再点「随机出一题」做 5 道小题计分。例：2p_z 上自旋向上的电子 = (2, 1, 0, +½)。</p>`,
    enter() {
      resetWorld();
      st.section = 5;
      showOnly({ q: true });
      app.setCamera([0, 2, 30], [0, 0, 0]);
      buildHud([['stat', '模式']]);
      currentHud.set('stat', '量子数练习');
      qz.active = false;
      qSel('#orbQDesc').textContent = '自由探究：随意组合四个量子数，看看什么是合法组合。';
      qSel('#orbQScore').textContent = '';
      qStatus();
      ctl.clear();
      ctl.button({ label: '🎲 随机出一题', onClick: () => { qz.active = true; qz.idx = 0; qz.score = 0; qLoad(); } });
      ctl.button({ label: '✓ 提交答案', onClick: () => qSel('#orbQSubmit').click() });
      ctl.button({ label: '⌂ 复位视角', onClick: () => app.setCamera([0, 2, 30], [0, 0, 0]) });
    },
  },
  {
    title: '轨道库',
    html: `<p>20 条常用轨道速查：<b>1s–4s、2p 三向、3pz、3d 五向、4f 七向</b>。点按钮切换 3D 点云，下方给出每条轨道的<span class="hl">节面数、径向节点位置与最概然半径 r*</span>（D(r) 峰值处，电子最常出现的地方）。</p>
<p>试着横向对比：同为 p，3pz 与 2pz 的 r* 差多少？为什么 4f 的云这么「散」？</p>`,
    enter() {
      resetWorld();
      st.section = 6;
      showOnly({ lib: true });
      buildHud([['orb', '当前轨道'], ['pts', '显示点数']]);
      libSelect(0);
      ctl.clear();
      ctl.toggle({ label: '显示节面', value: st.showNodes, onChange: (v) => { st.showNodes = v; buildNodal(); } });
      ctl.toggle({ label: '相位着色', value: st.phase, onChange: (v) => { st.phase = v; setPhaseColors(); } });
      ctl.toggle({ label: '自动旋转', value: st.spin, onChange: (v) => { st.spin = v; } });
      ctl.slider({
        label: '点大小', min: 0.02, max: 0.14, step: 0.005, value: st.pointSize,
        fmt: (v) => v.toFixed(2),
        onInput: (v) => { st.pointSize = v; ptMat.size = v; },
      });
      ctl.button({ label: '⌂ 复位视角', onClick: () => frameOrbital() });
    },
  },
  {
    title: '随堂检测',
    html: `<p>5 道选择题，检验电子云、节面与排布规则的掌握情况。</p>`,
    enter() {
      resetWorld();
      st.section = 7;
      showOnly({});
      if (cloudGroup) cloudGroup.visible = false;
      app.setCamera([0, 2, 34], [0, 0, 0]);
      hudWrap.innerHTML = '';
      currentHud = null;
      ctl.clear();
      ctl.button({ label: '⌂ 复位视角', onClick: () => app.setCamera([0, 2, 34], [0, 0, 0]) });
      showQuiz();
    },
  },
];

function paintPlayBtn() {
  if (st.eduPlayBtn) {
    st.eduPlayBtn.textContent = st.edu.playing ? '⏸ 暂停' : '▶ 自动填充';
    st.eduPlayBtn.classList.toggle('active', st.edu.playing);
  }
}

function resetWorld() {
  st.spin = false;
  st.showNodes = false;
  st.edu.playing = false;
  st.cfg.playing = false;
  showOnly({});
  setPhaseColors();
  if (points) points.geometry.setDrawRange(0, st.cloudN);
}

/* ---------------- 帧循环 ---------------- */

let labReady = false;
app.onFrame((dt) => {
  if (!labReady) return;
  cameraTweenTick(app, dt);
  if (st.spin && cloudGroup) cloudGroup.rotation.y += dt * 0.45;

  // 曝光动画（约 4s 从 0 长到 N）
  if (points && st.exposeT0 > 0) {
    const k = Math.min((performance.now() * 0.001 - st.exposeT0) / 4, 1);
    points.geometry.setDrawRange(0, Math.round(k * st.cloudN));
    if (k >= 1) st.exposeT0 = -10;
  }

  // 能级自动填充
  if (st.edu.playing && st.section === 3) {
    st.edu.acc += dt * st.edu.speed;
    let dirty = false;
    while (st.edu.acc >= 1 && st.edu.count < 36) { st.edu.count++; st.edu.acc -= 1; dirty = true; }
    if (dirty) drawEdu();
    if (st.edu.count >= 36) { st.edu.playing = false; paintPlayBtn(); }
  }

  // 排布逐盒填充
  if (st.cfg.playing && st.section === 4) {
    st.cfg.acc += dt * st.cfg.speed;
    let dirty = false;
    while (st.cfg.acc >= 1 && st.cfg.shown < st.cfg.Z) { st.cfg.shown++; st.cfg.acc -= 1; dirty = true; }
    if (dirty) drawConfBoxes();
    if (st.cfg.shown >= st.cfg.Z) st.cfg.playing = false;
  }
});

/* ---------------- 启动 ---------------- */

labReady = true;
rebuildCloud({ expose: true, instant: true });
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
