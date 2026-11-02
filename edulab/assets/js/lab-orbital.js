/* EduLab · 原子轨道 / 电子云（orbital）— Micro 级深改
 * 章节：电子云 / 轨道形状 / 径向分布与节面 / 能级与构造原理 / 电子排布 / 量子数 / 轨道库 / 随堂检测
 * 波函数引擎：氢原子类 ψ_nlm（a0=1 归一化单位，只取形状与相位，不含归一化常数）
 *   径向 R_nl ∝ r^l · 拉盖尔多项式 · e^(-r/n)，手写 n≤4 全部多项式；
 *   角向取实轨道（实球谐）：s 常数 / p·d·f 按标准实球谐展开（f 用 cubic 组）。
 * 渲染三种形态：
 *   电子云   = Monte Carlo 点云（径向 CDF 逆变换 + 球面拒绝采样，密度 ∝ |ψ|²，圆点软边 shader）；
 *   等值面   = raymarch shader 直接采样 ψ 场，|ψ| = c 三层嵌套等概率壳（法线 = ∇ψ，相位着色 + 菲涅尔轮边）；
 *   截面热图 = CanvasTexture 逐像素采 ψ，节面处自然压暗（径向节点=暗环、角节面=暗线）。
 * 采样随机数固定种子 mulberry32，同一轨道每次重建完全一致；体量按等概率面包围半径归一，
 *   任何轨道的主体都落在展示转台正上方同一尺度（转台/道具为固定世界景）。
 * 场景叙事：圆形展示转台（刻度盘 CanvasTexture + 黄铜圈 + 铭牌）+ 木质台面 + 试剂瓶 /
 *   2p 轨道实体小模型 / 书堆，全部带接触阴影；光照主暖光 + 冷补光 + 台面反弹 + 半球环境。
 * 布局：真·三栏（章节目录 / 3D 舞台 / 详解+控件+读数），左右栏独立折叠 + 专注模式 +
 *   右栏三块手风琴（localStorage 记忆）；键盘 ←→ 切章、R 复位视角、F 全屏、] 折右栏。
 */
import {
  THREE, TAU, clamp,
  createApp, makeLoader, makeHUD, makeTextSprite, setSpriteText,
  createControlsPanel,
} from './edu-core.js';
import {
  attachVFX, PAL,
  matCoat, matStd, matGlow, ghostify,
  makeWoodTexture, makeLabelTexture, makeStudioEnvironment,
} from './edu-vfx.js';

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
// raymarch 用：多项式系数（低次 → 高次）与 exp 衰减指数
const RAD_COEF = {
  '1,0': [1, 0, 0, 0], '2,0': [2, -1, 0, 0], '2,1': [0, 1, 0, 0],
  '3,0': [27, -18, 2, 0], '3,1': [0, 6, -1, 0], '3,2': [0, 0, 1, 0],
  '4,0': [192, -144, 24, -1], '4,1': [0, 80, -20, 1], '4,2': [0, 0, 14, -1], '4,3': [0, 0, 0, 1],
};
const RAD_EXP = { 1: 1, 2: 2, 3: 3, 4: 4 };

// 角向函数（输入为单位向量分量，已吸收 1/r^l）
const ANG_FN = {
  s: () => 1,
  px: (x) => x, py: (x, y) => y, pz: (x, y, z) => z,
  dz2: (x, y, z) => 3 * z * z - 1,
  dxz: (x, y, z) => x * z, dyz: (x, y, z) => y * z, dxy: (x, y, z) => x * y,
  dx2y2: (x, y, z) => x * x - y * y,
  fz3: (x, y, z) => z * (5 * z * z - 3),
  fxz2: (x, y, z) => x * (5 * z * z - 1),
  fyz2: (x, y, z) => y * (5 * z * z - 1),
  fxyz: (x, y, z) => x * y * z,
  fzx2y2: (x, y, z) => z * (x * x - y * y),
  fx2m3y2: (x, y, z) => x * (x * x - 3 * y * y),
  fy3x2my2: (x, y, z) => y * (3 * x * x - y * y),
};
// raymarch shader 的角向分支序号（与 ANG_KEYS 对齐）
const ANG_KEYS = ['s', 'px', 'py', 'pz', 'dz2', 'dxz', 'dyz', 'dxy', 'dx2y2',
  'fz3', 'fxz2', 'fyz2', 'fxyz', 'fzx2y2', 'fx2m3y2', 'fy3x2my2'];

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
  if (l === 0) return n + 's';
  if (l === 3) return n + 'f ' + ORB_OPTS[3][i].name;
  return String(n) + L_LETTER[l] + ORB_OPTS[l][i].name;
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

// 截面平面选择：让切面同时穿过主体与节面结构（xz 水平 / yz、xy 竖直）
const SLICE_PLANE = {
  s: 'xz', px: 'xz', py: 'yz', pz: 'xz',
  dz2: 'xz', dxz: 'xz', dyz: 'yz', dxy: 'xy', dx2y2: 'xy',
  fz3: 'xz', fxz2: 'xz', fyz2: 'yz', fxyz: 'xy', fzx2y2: 'xz',
  fx2m3y2: 'xy', fy3x2my2: 'xy',
};

// 轨道一句话描述
function orbDesc(n, l) {
  if (l === 0) return n + 's：球形对称，无角向节面，全正相位';
  if (l === 1) return n + 'p：哑铃双瓣，两瓣相位相反，中间 1 个角向节面';
  if (l === 2) return n + 'd：四瓣交替（z² 为双瓣+环），2 个角向节面';
  return n + 'f：多瓣复杂花样，3 个角向节面';
}
function angDesc(k) {
  const d = NODES[k];
  if (!d.length) return '无角节面';
  const parts = d.map((nd) => {
    if (nd.h) return '水平面';
    if (nd.c !== undefined) return '圆锥面';
    const dirs = { 0: 'xz', 45: '对角', 90: 'yz', '-45': '对角', 60: '60°', '-60': '−60°', 30: '30°', '-30': '−30°' };
    return (dirs[nd.v] || nd.v + '°') + ' 竖直平面';
  });
  return parts.join(' + ');
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
// 书写序 = n 优先（3d 写在 4s 前）；填充序（SUBS 原序）只用于动画与盒图
const DISP_ORDER = [...SUBS].sort((a, b) => a.n - b.n || a.l - b.l);
function configFull(Z) {
  const cnt = fillCounts(Z);
  return DISP_ORDER.filter((s) => cnt[s.label] > 0).map((s) => s.label + sup(cnt[s.label])).join(' ');
}
function configShort(Z) {
  const cores = [[2, '[He]'], [10, '[Ne]'], [18, '[Ar]']];
  let core = null;
  cores.forEach(([z, tag]) => { if (Z >= z) core = { z, tag }; });
  if (!core) return configFull(Z);
  const cnt = fillCounts(Z);
  const coreOrder = core.z === 2 ? ['1s'] : core.z === 10 ? ['1s', '2s', '2p'] : ['1s', '2s', '2p', '3s', '3p'];
  coreOrder.forEach((k) => { cnt[k] = 0; });
  const rest = DISP_ORDER.filter((s) => cnt[s.label] > 0).map((s) => s.label + sup(cnt[s.label])).join(' ');
  return core.tag + (rest ? ' ' + rest : '');
}
// 周期表定位（1-36 → 周期 / 族）
function periodGroup(z) {
  if (z <= 2) return { period: 1, group: z === 1 ? 1 : 18 };
  if (z <= 18) {
    const n = z <= 10 ? z - 2 : z - 10;
    return { period: z <= 10 ? 2 : 3, group: n <= 2 ? n : n + 10 };
  }
  return { period: 4, group: z - 18 };
}
// 价层子壳（最外层 n + 3d 特例），返回 [{n,l,label,count}]
function valenceSubs(Z) {
  const cnt = fillCounts(Z);
  let maxN = 1;
  SUBS.forEach((s) => { if (cnt[s.label] > 0) maxN = Math.max(maxN, s.n); });
  return SUBS.filter((s) => cnt[s.label] > 0 && (s.n === maxN || s.label === '3d'))
    .map((s) => ({ n: s.n, l: s.l, label: s.label, count: cnt[s.label] }));
}

/* ---------------- 采样与场统计工具 ---------------- */

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
function rOf(n, l) { return RAD[n + ',' + l]; }

// D(r)=r²R² 的 CDF（梯形，480 段），返回 {cdf,total,dr}
function radialTable(n, l, rMax) {
  const NB = 480, dr = rMax / NB;
  const R = rOf(n, l);
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
function sampleCloud(n, l, k, count, seed, opts = {}) {
  const rng = mulberry32(seed);
  const tab = radialTable(n, l, rMaxOf(n));
  const A = ANG_FN[k];
  const mA2 = angMax2(A);
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const cP = opts.cP || [1.0, 0.37, 0.27], cN = opts.cN || [0.31, 0.55, 0.96];
  const flat = opts.flat || null;
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
    const c = flat ? flat : (v >= 0 ? cP : cN);
    col[got * 3] = c[0]; col[got * 3 + 1] = c[1]; col[got * 3 + 2] = c[2];
    got++;
  }
  return { pos, col, count: got };
}
// 径向节点（R 的符号变化 + 二分精化）
function radialNodes(n, l) {
  if (n - l - 1 <= 0) return [];
  const R = rOf(n, l);
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
  const R = rOf(n, l);
  const rMax = rMaxOf(n);
  let best = 0, bd = -1;
  for (let i = 1; i <= 1600; i++) {
    const r = (i / 1600) * rMax, v = R(r), d = v * v * r * r;
    if (d > bd) { bd = d; best = r; }
  }
  return best;
}

// 场统计（网格采 |ψ|：最大值 + 0.2·max 等值面包围半径），按轨道缓存
const statsCache = new Map();
function psiStats(n, l, k) {
  const key = n + ',' + l + ',' + k;
  if (statsCache.has(key)) return statsCache.get(key);
  const A = ANG_FN[k];
  const R = rOf(n, l);
  const rc = rMaxOf(n);
  const N = 52, h = rc / (N - 1);
  let mx = 0;
  const vals = new Float32Array(N * N * N);
  for (let i = 0; i < N; i++) {
    const x = -rc + i * h;
    for (let j = 0; j < N; j++) {
      const y = -rc + j * h;
      for (let m = 0; m < N; m++) {
        const z = -rc + m * h;
        const r = Math.sqrt(x * x + y * y + z * z);
        const v = r < 1e-6 ? 0 : R(r) * A(x / r, y / r, z / r);
        const a = Math.abs(v);
        vals[i + N * j + N * N * m] = a;
        if (a > mx) mx = a;
      }
    }
  }
  // 0.2·max 等值面的最大包围半径
  const th = mx * 0.2;
  let ext = rc * 0.6;
  for (let i = 0; i < N; i++) {
    const x = -rc + i * h;
    for (let j = 0; j < N; j++) {
      const y = -rc + j * h;
      for (let m = 0; m < N; m++) {
        if (vals[i + N * j + N * N * m] > th) {
          const z = -rc + m * h;
          const rr = Math.sqrt(x * x + y * y + z * z);
          if (rr > ext) ext = rr;
        }
      }
    }
  }
  // 径向概率分位点（CDF 98.5%）：点云与等值面共同的归一化基准
  const tab = radialTable(n, l, rc);
  const tq = tab.total * 0.985;
  let rq = rc;
  for (let i = 1; i < tab.cdf.length; i++) {
    if (tab.cdf[i] >= tq) {
      const c1 = tab.cdf[i], c0 = tab.cdf[i - 1];
      const f = (c1 - c0) > 1e-15 ? (tq - c0) / (c1 - c0) : 0.5;
      rq = (i - 1 + f) * tab.dr;
      break;
    }
  }
  const out = { max: mx, ext, rmax: rc, rq };
  statsCache.set(key, out);
  if (statsCache.size > 24) statsCache.delete(statsCache.keys().next().value);
  return out;
}

/* ---------------- 世界尺度与颜色 ---------------- */

const WORLD_R = 5.1;                 // 等值面包围半径的目标世界尺度
function scaleOf(n, l, k) { return (WORLD_R * 1.12) / Math.max(psiStats(n, l, k).rq, 0.8); }
const ORB = {
  pos: 0xff6a4d, neg: 0x4f8ef7,      // ψ>0 暖 / ψ<0 冷
  flat: 0x9fb2c8,                    // 关相位后的中性色
  node: 0x7fe0c4,                    // 节面
  valence: { s: 0x8fc2ff, p: 0xff9d4d, d: 0xc98aff },
};
// 径向分布对比曲线配色（每条曲线一族）
const CURVE_COLS = {
  '1s': '#ffb066', '2s': '#6fb2ff', '3s': '#c99bff',
  '2p': '#ff8fa8', '3p': '#7fe0c4', '3d': '#ffe08a',
};

/* ---------------- 场景 ---------------- */

const stage = document.getElementById('stage');
const loader = makeLoader(stage, '正在构建波函数…');

const app = createApp({
  container: stage,
  fov: 46, near: 0.1, far: 400,
  cameraPos: [10.5, 6.5, 9],
  target: [0, 0, -1.2],
  minDistance: 4, maxDistance: 90,
  toneMapping: THREE.NoToneMapping, // 相位红蓝保真
  keepBackground: true,
});
const vfx = attachVFX(app, 'illus');
const { scene, camera, controls } = app;
camera.up.set(0, 0, 1);              // 物理惯例：z 轴竖直（pz / dz² 的轴向即屏幕竖直方向）
controls.update();

scene.environment = makeStudioEnvironment(app.renderer);

const hemi = new THREE.HemisphereLight(0xcdd6e0, 0x2c2418, 0.8);
scene.add(hemi);
const keyLight = new THREE.DirectionalLight(0xfff0dc, 1.6);
keyLight.position.set(5, 4, 11);
scene.add(keyLight);
const fillLight = new THREE.DirectionalLight(0x93a7c4, 0.45);
fillLight.position.set(-7, -5, 3);
scene.add(fillLight);
const bounceLight = new THREE.DirectionalLight(0xe8b98a, 0.26);
bounceLight.position.set(0, 2, -6);
scene.add(bounceLight);

const world = new THREE.Group();
scene.add(world);
// 轨道主体组（点云 / 等值面 / 截面 / 节面随自动旋转一起转）
const orbGroup = new THREE.Group();
world.add(orbGroup);

/* ---------------- 程序化纹理工厂（接触阴影 / 转台刻度盘） ---------------- */

function makeShadowTexture() {
  const S = 256;
  const cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const ctx = cv.getContext('2d');
  const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, 'rgba(6,9,13,0.55)');
  g.addColorStop(0.55, 'rgba(6,9,13,0.28)');
  g.addColorStop(1, 'rgba(6,9,13,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// 展示转台刻度盘：暗色石面 + 同心刻度环 + 角度标注 + 径向标尺
function makeDialTexture() {
  const S = 1024;
  const cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const ctx = cv.getContext('2d');
  const C = S / 2;
  // 石面：深青灰径向渐变 + 中心微亮
  const g = ctx.createRadialGradient(C, C * 0.86, S * 0.08, C, C, S * 0.52);
  g.addColorStop(0, '#2c3a44');
  g.addColorStop(0.62, '#222d36');
  g.addColorStop(1, '#161f27');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(C, C, S * 0.5, 0, TAU); ctx.fill();
  // 环向细纹（车削痕）
  for (let i = 0; i < 46; i++) {
    const rr = S * (0.06 + 0.43 * (i / 46));
    ctx.strokeStyle = 'rgba(255,255,255,' + (0.008 + 0.012 * Math.random()).toFixed(3) + ')';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(C, C, rr, 0, TAU); ctx.stroke();
  }
  // 同心刻度环（径向标尺：r / a0，对齐 1s…4s 的特征半径位置）
  ctx.font = '600 17px -apple-system, "PingFang SC", sans-serif';
  ctx.textAlign = 'center';
  const rings = [[0.16, '0'], [0.25, '1'], [0.34, '2'], [0.43, '3'], [0.52, '4']];
  rings.forEach(([fr, label], ri) => {
    ctx.strokeStyle = ri === 0 ? 'rgba(159,178,200,0.5)' : 'rgba(159,178,200,0.26)';
    ctx.lineWidth = ri === 0 ? 2 : 1.2;
    ctx.beginPath(); ctx.arc(C, C, S * fr, 0, TAU); ctx.stroke();
    // 刻度齿
    for (let a = 0; a < 72; a++) {
      const ang = (a / 72) * TAU;
      const l1 = S * fr, l2 = S * fr - (a % 6 === 0 ? 9 : 5);
      ctx.strokeStyle = 'rgba(159,178,200,0.3)';
      ctx.lineWidth = a % 6 === 0 ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(C + Math.cos(ang) * l2, C + Math.sin(ang) * l2);
      ctx.lineTo(C + Math.cos(ang) * l1, C + Math.sin(ang) * l1);
      ctx.stroke();
    }
    // 标尺数字（右下 45° 方向）
    if (label) {
      const ang = Math.PI * 0.25;
      ctx.fillStyle = 'rgba(196,214,230,0.62)';
      ctx.fillText(label, C + Math.cos(ang) * S * fr - 14, C + Math.sin(ang) * S * fr + 5);
    }
  });
  // 角度标注（0/90/180/270）
  ctx.fillStyle = 'rgba(196,214,230,0.55)';
  ctx.font = '600 21px -apple-system, "PingFang SC", sans-serif';
  [['0°', 0, -1], ['90°', 1, 0], ['180°', 0, 1], ['270°', -1, 0]].forEach(([t, dx, dy]) => {
    ctx.fillText(t, C + dx * S * 0.455, C + dy * S * 0.455 + 7);
  });
  // 象限对角装饰线
  ctx.strokeStyle = 'rgba(159,178,200,0.14)';
  ctx.lineWidth = 1.4;
  for (let q = 0; q < 4; q++) {
    const ang = q * Math.PI / 2 + Math.PI / 4;
    ctx.beginPath();
    ctx.moveTo(C + Math.cos(ang) * S * 0.16, C + Math.sin(ang) * S * 0.16);
    ctx.lineTo(C + Math.cos(ang) * S * 0.52, C + Math.sin(ang) * S * 0.52);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/* ---------------- 场景叙事：台面 + 展示转台 + 道具 + 接触阴影 ---------------- */

const FLOOR_Y = -8.9;
const shadowTex = makeShadowTexture();

function makeContactShadow(w, l, opacity = 0.9) {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(w, l),
    new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, opacity })
  );
  return m;
}

function buildEnv() {
  const g = new THREE.Group();
  const woodFloor = makeWoodTexture({ base: '#4a3620', dark: '#332414', light: '#5f4830', streaks: 90, bands: 7, planks: 6, seed: 31 });
  woodFloor.repeat.set(7, 7);
  const floor = new THREE.Mesh(new THREE.CylinderGeometry(23, 23, 0.34, 72), new THREE.MeshStandardMaterial({ map: woodFloor, roughness: 0.72, metalness: 0.03 }));
  floor.rotation.x = Math.PI / 2;
  floor.position.z = FLOOR_Y - 0.17;
  g.add(floor);

  // 展示转台：底盘 + 刻度盘面 + 黄铜圈 + 铭牌
  const podium = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(8.35, 8.95, 0.92, 72), matStd(0x141b22, { roughness: 0.44, metalness: 0.35 }));
  base.rotation.x = Math.PI / 2;
  base.position.z = FLOOR_Y + 0.46;
  podium.add(base);
  const dialTex = makeDialTexture();
  const dial = new THREE.Mesh(new THREE.CylinderGeometry(8.2, 8.2, 0.2, 72), matStd(0x1a232b, { roughness: 0.72, metalness: 0.05 }));
  dial.rotation.x = Math.PI / 2;
  dial.position.z = FLOOR_Y + 1.0;
  podium.add(dial);
  // 刻度盘面：独立圆片贴纹理（CircleGeometry 平面 UV，避免圆柱盖 UV 的文字镜像）
  const dialFace = new THREE.Mesh(new THREE.CircleGeometry(8.19, 72), new THREE.MeshStandardMaterial({ map: dialTex, roughness: 0.78, metalness: 0.04 }));
  dialFace.position.z = FLOOR_Y + 1.105;
  podium.add(dialFace);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(8.2, 0.085, 12, 96), matStd(PAL.brass, { metalness: 0.78, roughness: 0.32 }));
  ring.position.z = FLOOR_Y + 1.11;
  podium.add(ring);
  // 铭牌（黄铜底 + 标签纹理，微倾向相机）
  const plaque = new THREE.Group();
  const plate = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.72, 0.1), matStd(PAL.brass, { metalness: 0.72, roughness: 0.4 }));
  plaque.add(plate);
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(2.94, 0.58),
    new THREE.MeshStandardMaterial({ map: makeLabelTexture(['原子轨道 · 电子云', 'ATOMIC ORBITALS'], { w: 512, h: 96, accent: '#4a3010', lineSizes: [40, 17] }), roughness: 0.62 })
  );
  face.position.z = 0.056;
  plaque.add(face);
  plaque.position.set(0, 8.28, FLOOR_Y + 1.32);
  plaque.rotation.x = -Math.PI / 2 + 0.42;
  podium.add(plaque);
  g.add(podium);
  const podSh = makeContactShadow(19.5, 19.5);
  podSh.position.set(0, 0, FLOOR_Y + 0.015);
  g.add(podSh);

  // 道具：玻璃试剂瓶（瓶身 + 内液 + 黄铜盖 + 弧面标签）
  const bottle = (x, z, name, sub, liquid, rotY) => {
    const bg = new THREE.Group();
    const R = 0.42, H = 1.3;
    const body = new THREE.Mesh(new THREE.CylinderGeometry(R, R * 1.06, H, 22), matCoat(0xdfeef2, { roughness: 0.1, transmission: 0.85, thickness: 0.5, ior: 1.5, opacity: 0.4, side: THREE.DoubleSide }));
    body.position.y = H / 2;
    bg.add(body);
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.23, 0.24, 16), body.material);
    neck.position.y = H + 0.12;
    bg.add(neck);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.16, 16), matStd(PAL.brass, { metalness: 0.72, roughness: 0.34 }));
    cap.position.y = H + 0.32;
    bg.add(cap);
    const liq = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.84, R * 0.88, H * 0.52, 18), matStd(liquid, { roughness: 0.28, emissive: liquid, emissiveIntensity: 0.16 }));
    liq.position.y = H * 0.3;
    bg.add(liq);
    const label = new THREE.Mesh(
      new THREE.CylinderGeometry(R + 0.015, R + 0.02, H * 0.44, 24, 1, true, Math.PI - 0.6, 1.2),
      new THREE.MeshStandardMaterial({ map: makeLabelTexture([name, sub], { w: 288, h: 168, accent: '#20565e' }), roughness: 0.85 })
    );
    label.position.y = H * 0.58;
    bg.add(label);
    bg.rotation.x = Math.PI / 2;        // 瓶身高度轴 y → 竖直 z
    const spinG = new THREE.Group();
    spinG.add(bg);
    spinG.rotation.z = rotY;            // 绕竖直轴摆角度（瓶签转向相机侧）
    spinG.position.set(x, z, FLOOR_Y);
    return spinG;
  };
  g.add(bottle(11.6, -3.2, '电子云', 'PROB. DENSITY', 0x3f7d8a, 0.42));
  const bSh = makeContactShadow(1.9, 1.9);
  bSh.position.set(11.6, -3.2, FLOOR_Y + 0.012);
  g.add(bSh);

  // 道具：2p 轨道实体小模型（两瓣红蓝泪滴 + 黄铜杆 + 木座）
  const mini = new THREE.Group();
  const mBase = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.7, 0.14, 28), new THREE.MeshStandardMaterial({ map: makeWoodTexture({ base: '#54391f', dark: '#3a2612', light: '#6b4c2c', streaks: 34, bands: 3, seed: 17 }), roughness: 0.55 }));
  mBase.position.y = 0.07;
  mini.add(mBase);
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.94, 10), matStd(PAL.brass, { metalness: 0.8, roughness: 0.3 }));
  rod.position.y = 0.6;
  mini.add(rod);
  const lobeMat = (hex) => matCoat(hex, { roughness: 0.3, metalness: 0.04, clearcoat: 1, clearcoatRoughness: 0.2 });
  const lobeGeo = new THREE.SphereGeometry(0.3, 22, 16);
  const lobeA = new THREE.Mesh(lobeGeo, lobeMat(ORB.pos));
  lobeA.scale.set(0.72, 1.5, 0.72);
  lobeA.position.set(0, 1.32, 0);
  mini.add(lobeA);
  const lobeB = new THREE.Mesh(lobeGeo, lobeMat(ORB.neg));
  lobeB.scale.set(0.72, 1.5, 0.72);
  lobeB.position.set(0, 0.18, 0);
  mini.add(lobeB);
  const knot = new THREE.Mesh(new THREE.SphereGeometry(0.085, 12, 10), matStd(PAL.steel, { metalness: 0.6, roughness: 0.4 }));
  knot.position.y = 0.76;
  mini.add(knot);
  const miniWrap = new THREE.Group();
  miniWrap.add(mini);
  miniWrap.rotation.x = Math.PI / 2;    // 模型瓣轴 y → 竖直 z（2p 小模型竖立）
  const miniSpin = new THREE.Group();
  miniSpin.add(miniWrap);
  miniSpin.rotation.z = -0.5;
  miniSpin.position.set(13.1, 1.9, FLOOR_Y);
  g.add(miniSpin);
  const mSh = makeContactShadow(1.9, 1.9);
  mSh.position.set(13.1, 1.9, FLOOR_Y + 0.012);
  g.add(mSh);

  // 道具：书堆 ×2（硬皮书脊 + 标签纹理）
  const book = (x, z, w, h, d, col, lines, rotY) => {
    const bg = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), matCoat(col, { roughness: 0.5, clearcoat: 0.5, clearcoatRoughness: 0.3 }));
    bg.add(body);
    const spine = new THREE.Mesh(
      new THREE.PlaneGeometry(d * 0.82, h * 0.66),
      new THREE.MeshStandardMaterial({ map: makeLabelTexture(lines, { w: 240, h: 100, accent: '#e8d9b0', paper: '#25344a' }), roughness: 0.7 })
    );
    spine.rotation.y = -Math.PI / 2;
    spine.position.set(-w / 2 - 0.005, 0, 0);
    bg.add(spine);
    bg.rotation.x = Math.PI / 2;        // 书高 y → 竖直 z（平躺）
    const wrap = new THREE.Group();
    wrap.add(bg);
    wrap.rotation.z = rotY;
    wrap.position.set(x, z, FLOOR_Y + h / 2);
    return wrap;
  };
  g.add(book(-12.4, -1.6, 2.3, 0.42, 1.6, 0x25344a, ['量子力学', 'QUANTUM'], 0.24));
  g.add(book(-12.2, -1.5, 2.1, 0.4, 1.5, 0x513a24, ['物质结构', 'STRUCTURE'], -0.18));
  const bkSh = makeContactShadow(3.2, 2.2);
  bkSh.position.set(-12.3, -1.5, FLOOR_Y + 0.012);
  g.add(bkSh);

  return g;
}
scene.add(buildEnv());

/* ---------------- 电子云点云（圆点软边 shader） ---------------- */

const CLOUD_VERT = [
  'attribute vec3 cloudColor;',
  'varying vec3 vColor;',
  'uniform float uSize;',
  'uniform float uScaleV;',
  'void main() {',
  '  vColor = cloudColor;',
  '  vec4 mv = modelViewMatrix * vec4(position, 1.0);',
  '  float px = uSize * uScaleV / max(0.6, -mv.z);',
  '  gl_PointSize = max(px, 1.0);',
  '  gl_Position = projectionMatrix * mv;',
  '}',
].join('\n');
const CLOUD_FRAG = [
  'varying vec3 vColor;',
  'uniform float uOpacity;',
  'uniform vec3 uFlat;',
  'uniform float uPhase;',
  'void main() {',
  '  vec2 c = gl_PointCoord - 0.5;',
  '  float d2 = dot(c, c);',
  '  if (d2 > 0.25) discard;',
  '  float a = pow(max(0.0, 1.0 - d2 * 4.0), 1.6);',
  '  gl_FragColor = vec4(mix(uFlat, vColor, uPhase), a * uOpacity);',
  '}',
].join('\n');

function makeCloudMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      uSize: { value: 0.12 },
      uScaleV: { value: 400 },
      uOpacity: { value: 0.85 },
      uFlat: { value: new THREE.Color(ORB.flat) },
      uPhase: { value: 1 },
    },
    vertexShader: CLOUD_VERT,
    fragmentShader: CLOUD_FRAG,
    transparent: true,
    depthWrite: false,
  });
}
function refreshCloudScale() {
  const h = app.renderer.domElement.height;
  cloudMats.forEach((m) => { m.uniforms.uScaleV.value = h * 0.5; });
}

let cloudMats = [];
let cloudObj = null;
let nodeGroup = null;
let shellsGroup = null;
let shellMats = [];
let sliceMesh = null;
let axesGroup = null;

function disposeCloud() {
  if (cloudObj) {
    orbGroup.remove(cloudObj);
    cloudObj.geometry.dispose();
    cloudMats = cloudMats.filter((m) => m !== cloudObj.material);
    cloudObj.material.dispose();
    cloudObj = null;
  }
}
function buildCloud(n, l, k, scale, opts = {}) {
  disposeCloud();
  const count = opts.count || st.pointCount;
  const flat = opts.flat ? [((ORB.flat >> 16) & 255) / 255, ((ORB.flat >> 8) & 255) / 255, (ORB.flat & 255) / 255] : null;
  const { pos, col, count: got } = sampleCloud(n, l, k, count, 20261030 + n * 1000 + l * 100 + ANG_KEYS.indexOf(k), { flat });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('cloudColor', new THREE.BufferAttribute(col, 3));
  geo.setDrawRange(0, opts.expose ? 0 : got);
  const mat = makeCloudMaterial();
  mat.uniforms.uPhase.value = opts.flat ? 0 : (st.phase ? 1 : 0);
  mat.uniforms.uOpacity.value = opts.opacity !== undefined ? opts.opacity : (st.view.slice ? 0.5 : 0.85);
  if (opts.size !== undefined) mat.uniforms.uSize.value = opts.size;
  cloudMats.push(mat);
  cloudObj = new THREE.Points(geo, mat);
  cloudObj.frustumCulled = false;
  cloudObj.scale.setScalar(scale);
  cloudObj.renderOrder = 10;
  orbGroup.add(cloudObj);
  st.cloudN = got;
  refreshCloudScale();
  return cloudObj;
}

/* ---------------- 等值面（raymarch ψ 场，三层嵌套等概率壳） ---------------- */

const SHELL_VERT = [
  'varying vec3 vWorld;',
  'void main() {',
  '  vec4 w = modelMatrix * vec4(position, 1.0);',
  '  vWorld = w.xyz;',
  '  gl_Position = projectionMatrix * viewMatrix * w;',
  '}',
].join('\n');
const SHELL_FRAG = [
  'precision highp float;',
  'varying vec3 vWorld;',
  'uniform float uHalf, uScale, uExpN, uAng, uIso, uPhase, uOpacity, uGlow;',
  'uniform vec4 uCoef;',
  'uniform vec3 uPosCol, uNegCol, uFlat, uLight;',
  'uniform mat3 uOrientI;',
  'float angY(vec3 d) {',
  '  int m = int(uAng + 0.5);',
  '  if (m == 0) return 1.0;',
  '  if (m == 1) return d.x;',
  '  if (m == 2) return d.y;',
  '  if (m == 3) return d.z;',
  '  if (m == 4) return 3.0 * d.z * d.z - 1.0;',
  '  if (m == 5) return d.x * d.z;',
  '  if (m == 6) return d.y * d.z;',
  '  if (m == 7) return d.x * d.y;',
  '  if (m == 8) return d.x * d.x - d.y * d.y;',
  '  if (m == 9) return d.z * (5.0 * d.z * d.z - 3.0);',
  '  if (m == 10) return d.x * (5.0 * d.z * d.z - 1.0);',
  '  if (m == 11) return d.y * (5.0 * d.z * d.z - 1.0);',
  '  if (m == 12) return d.x * d.y * d.z;',
  '  if (m == 13) return d.z * (d.x * d.x - d.y * d.y);',
  '  if (m == 14) return d.x * (d.x * d.x - 3.0 * d.y * d.y);',
  '  return d.y * (3.0 * d.x * d.x - d.y * d.y);',
  '}',
  'float psiAt(vec3 p) {',
  '  float r = length(p);',
  '  if (r < 1e-4) return 0.0;',
  '  float R = ((uCoef.w * r + uCoef.z) * r + uCoef.y) * r + uCoef.x;',
  '  R *= exp(-r / uExpN);',
  '  return R * angY(p / r);',
  '}',
  'float field(vec3 p) { return abs(psiAt(p)) - uIso; }',
  'vec2 boxHit(vec3 ro, vec3 rd) {',
  '  vec3 inv = 1.0 / rd;',
  '  vec3 t0 = -uHalf * inv - ro * inv;',
  '  vec3 t1 = uHalf * inv - ro * inv;',
  '  vec3 tn3 = min(t0, t1);',
  '  vec3 tf3 = max(t0, t1);',
  '  return vec2(max(max(tn3.x, tn3.y), tn3.z), min(min(tf3.x, tf3.y), tf3.z));',
  '}',
  'void main() {',
  '  vec3 ro = uOrientI * (cameraPosition / uScale);',
  '  vec3 rd = uOrientI * normalize(vWorld - cameraPosition);',
  '  vec2 hit = boxHit(ro, rd);',
  '  float tn = max(hit.x, 0.0);',
  '  float tf = hit.y;',
  '  if (tf <= tn) discard;',
  '  int STEPS = 46;',
  '  float stepLen = (tf - tn) / float(STEPS);',
  '  float tPrev = tn;',
  '  float fPrev = field(ro + rd * tn);',
  '  float tHit = -1.0;',
  '  for (int i = 1; i <= 46; i++) {',
  '    float t = tn + stepLen * float(i);',
  '    float f = field(ro + rd * t);',
  '    if (f * fPrev < 0.0) {',
  '      float a = tPrev;',
  '      float b = t;',
  '      for (int k = 0; k < 9; k++) {',
  '        float m2 = 0.5 * (a + b);',
  '        if (field(ro + rd * m2) * fPrev <= 0.0) b = m2; else a = m2;',
  '      }',
  '      tHit = 0.5 * (a + b);',
  '      break;',
  '    }',
  '    tPrev = t;',
  '    fPrev = f;',
  '  }',
  '  if (tHit < 0.0) discard;',
  '  vec3 p = ro + rd * tHit;',
  '  float e = 0.05;',
  '  vec3 g = normalize(vec3(',
  '    field(p + vec3(e, 0.0, 0.0)) - field(p - vec3(e, 0.0, 0.0)),',
  '    field(p + vec3(0.0, e, 0.0)) - field(p - vec3(0.0, e, 0.0)),',
  '    field(p + vec3(0.0, 0.0, e)) - field(p - vec3(0.0, 0.0, e))));',
  '  if (dot(g, rd) < 0.0) g = -g;',
  '  vec3 nW = normalize(g * uOrientI);',
  '  vec3 viewDir = normalize(vWorld - cameraPosition);',
  '  float psi = psiAt(p);',
  '  vec3 base = uPhase > 0.5 ? (psi > 0.0 ? uPosCol : uNegCol) : uFlat;',
  '  float diff = max(dot(nW, uLight), 0.0);',
  '  float rim = pow(1.0 - abs(dot(nW, -viewDir)), 2.2);',
  '  vec3 col = base * (0.32 + 0.72 * diff) + base * uGlow * (0.35 + 0.8 * rim);',
  '  gl_FragColor = vec4(col, uOpacity);',
  '}',
].join('\n');

// 三层嵌套壳参数：等概率阈值比例 / 不透明度 / 自发光（越靠内越亮）
const SHELL_LEVELS = [
  { frac: 0.2, opacity: 0.34, glow: 0.14 },
  { frac: 0.48, opacity: 0.5, glow: 0.55 },
  { frac: 0.78, opacity: 0.72, glow: 1.3 },
];

function disposeShells() {
  if (shellsGroup) {
    orbGroup.remove(shellsGroup);
    shellsGroup.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) { shellMats = shellMats.filter((m) => m !== o.material); o.material.dispose(); }
    });
    shellsGroup = null;
    shellMats = [];
  }
}
function buildShells(n, l, k, scale) {
  disposeShells();
  const stats = psiStats(n, l, k);
  const coef = RAD_COEF[n + ',' + l];
  const boxHalf = Math.min(stats.ext * 1.12, stats.rq * 1.04);   // a0 单位
  shellsGroup = new THREE.Group();
  const coefV = new THREE.Vector4(coef[0], coef[1], coef[2], coef[3]);
  SHELL_LEVELS.forEach((lv, idx) => {
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uHalf: { value: boxHalf },
        uScale: { value: scale },
        uCoef: { value: coefV.clone() },
        uExpN: { value: RAD_EXP[n] },
        uAng: { value: ANG_KEYS.indexOf(k) },
        uIso: { value: stats.max * lv.frac },
        uPosCol: { value: new THREE.Color(ORB.pos) },
        uNegCol: { value: new THREE.Color(ORB.neg) },
        uFlat: { value: new THREE.Color(ORB.flat) },
        uLight: { value: new THREE.Vector3(0.5, 0.85, 0.55).normalize() },
        uPhase: { value: st.phase ? 1 : 0 },
        uOpacity: { value: lv.opacity },
        uGlow: { value: lv.glow },
        uOrientI: { value: new THREE.Matrix3() },
      },
      vertexShader: SHELL_VERT,
      fragmentShader: SHELL_FRAG,
      transparent: true,
      depthWrite: false,
      side: THREE.BackSide,
    });
    shellMats.push(mat);
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), mat);
    const worldHalf = boxHalf * scale;
    mesh.scale.setScalar(worldHalf * 2);
    mesh.renderOrder = 14 - idx;      // 内层先画、外层后画（透明混合序）
    shellsGroup.add(mesh);
  });
  orbGroup.add(shellsGroup);
  syncShellOrient();
}
// 把 orbGroup 的世界旋转逆矩阵喂给 raymarch（自动旋转时逐帧刷新）
const _q = new THREE.Quaternion();
const _m3 = new THREE.Matrix3();
const _m4 = new THREE.Matrix4();
function syncShellOrient() {
  if (!shellMats.length) return;
  orbGroup.getWorldQuaternion(_q);
  _m4.makeRotationFromQuaternion(_q);
  _m3.setFromMatrix4(_m4).transpose();   // world → object
  shellMats.forEach((m) => { m.uniforms.uOrientI.value.copy(_m3); });
}

/* ---------------- 截面热图（CanvasTexture 逐像素采 ψ） ---------------- */

function disposeSlice() {
  if (sliceMesh) {
    orbGroup.remove(sliceMesh);
    sliceMesh.geometry.dispose();
    if (sliceMesh.material.map) sliceMesh.material.map.dispose();
    sliceMesh.material.dispose();
    sliceMesh = null;
  }
}
function buildSlice(n, l, k, scale) {
  disposeSlice();
  const stats = psiStats(n, l, k);
  const A = ANG_FN[k];
  const R = rOf(n, l);
  const plane = SLICE_PLANE[k] || 'xz';
  const S = 220;
  const cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const ctx = cv.getContext('2d');
  const img = ctx.createImageData(S, S);
  const ext = stats.rq * 0.92;
  const posC = [255, 128, 84], negC = [98, 152, 255], darkC = [14, 20, 28];
  // 三种平面分别写清楚（含平面旋转后的纹理轴向换算）：
  //   xz 水平（旋转 -90°x：纹理 u→世界 x，v→世界 −z）/ yz 竖直（旋转 90°y：u→−z，v→y）/ xy 竖直（不旋转：u→x，v→y）
  const psiXY = (u, v) => R(Math.hypot(u, v)) * A(u, v, 0);
  const psiXZ = (u, v) => R(Math.hypot(u, v)) * A(u, 0, -v);
  const psiYZ = (u, v) => R(Math.hypot(u, v)) * A(0, v, -u);
  const psiOf = plane === 'xz' ? psiXZ : plane === 'yz' ? psiYZ : psiXY;
  // 两趟：先采平面场并取「平面内局部最大值」归一（避免 3s 核尖峰把外瓣压暗），再上色
  const planeMax = (() => {
    let m2 = 0;
    for (let j = 0; j < S; j += 2) {
      const v = ext - (j / (S - 1)) * 2 * ext;
      for (let i = 0; i < S; i += 2) {
        const u = (i / (S - 1)) * 2 * ext - ext;
        const a = Math.abs(psiOf(u, v));
        if (a > m2) m2 = a;
      }
    }
    return Math.max(m2, 1e-9);
  })();
  for (let j = 0; j < S; j++) {
    const v = ext - (j / (S - 1)) * 2 * ext;   // 上行 = +v
    for (let i = 0; i < S; i++) {
      const u = (i / (S - 1)) * 2 * ext - ext;
      const psi = psiOf(u, v);
      const t = Math.min(1, Math.abs(psi) / planeMax);
      const g = Math.pow(t, 0.5);
      const c = psi >= 0 ? posC : negC;
      const o = (j * S + i) * 4;
      img.data[o] = Math.round(darkC[0] + (c[0] - darkC[0]) * g);
      img.data[o + 1] = Math.round(darkC[1] + (c[1] - darkC[1]) * g);
      img.data[o + 2] = Math.round(darkC[2] + (c[2] - darkC[2]) * g);
      img.data[o + 3] = Math.round(96 + 159 * Math.min(1, g * 1.35));   // 透明度下限：低概率区仍是可读的玻璃面
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  const worldHalf = ext * scale;
  const geo = new THREE.PlaneGeometry(worldHalf * 2, worldHalf * 2);
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.92, side: THREE.DoubleSide, depthWrite: false });
  sliceMesh = new THREE.Mesh(geo, mat);
  sliceMesh.renderOrder = 15;
  if (plane === 'xz') sliceMesh.rotation.x = -Math.PI / 2;
  else if (plane === 'yz') sliceMesh.rotation.y = Math.PI / 2;
  orbGroup.add(sliceMesh);
}

/* ---------------- 节面（ψ=0 平面 / 双圆锥，带亮边线） ---------------- */

function disposeNodes() {
  if (nodeGroup) {
    orbGroup.remove(nodeGroup);
    nodeGroup.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
    nodeGroup = null;
  }
}
function buildNodes(k, scale) {
  disposeNodes();
  if (!st.showNodes) return;
  const S = psiStats(st.n, st.l, k).rq * 1.22 * scale;
  const mat = new THREE.MeshBasicMaterial({ color: ORB.node, transparent: true, opacity: 0.1, side: THREE.DoubleSide, depthWrite: false });
  const edgeMat = new THREE.LineBasicMaterial({ color: ORB.node, transparent: true, opacity: 0.5 });
  nodeGroup = new THREE.Group();
  for (const nd of NODES[k]) {
    if (nd.v !== undefined) {
      const geo = new THREE.PlaneGeometry(S, S);
      geo.rotateY(Math.PI / 2);
      geo.rotateZ((nd.v * Math.PI) / 180);
      const m = new THREE.Mesh(geo, mat);
      m.renderOrder = 8;
      nodeGroup.add(m);
      const eg = new THREE.LineSegments(new THREE.EdgesGeometry(geo), edgeMat);
      nodeGroup.add(eg);
    } else if (nd.h) {
      const geo = new THREE.PlaneGeometry(S, S);
      geo.rotateX(Math.PI / 2);
      const m = new THREE.Mesh(geo, mat);
      m.renderOrder = 8;
      nodeGroup.add(m);
      const eg = new THREE.LineSegments(new THREE.EdgesGeometry(geo), edgeMat);
      nodeGroup.add(eg);
    } else if (nd.c) {
      const len = S * 0.9;
      const geo = new THREE.ConeGeometry(nd.c * len, len, 40, 1, true);
      geo.translate(0, -len / 2, 0);
      const m1 = new THREE.Mesh(geo, mat);
      const m2 = new THREE.Mesh(geo, mat);
      m2.scale.y = -1;
      const grp = new THREE.Group();
      grp.add(m1); grp.add(m2);
      grp.rotation.x = Math.PI / 2;
      nodeGroup.add(grp);
      const egA = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 20), edgeMat);
      const gA = new THREE.Group();
      gA.add(egA);
      const egB = egA.clone();
      egB.scale.y = -1;
      gA.add(egB);
      gA.rotation.x = Math.PI / 2;
      nodeGroup.add(gA);
    }
  }
  orbGroup.add(nodeGroup);
}

/* ---------------- 坐标轴（三向箭头 + 字母标签） ---------------- */

const AXIS_LEN_KEY = 'orbital.axes';
let axesOn = true;
try { axesOn = localStorage.getItem(AXIS_LEN_KEY) !== '0'; } catch (e) { /* 忽略 */ }

function disposeAxes() {
  if (axesGroup) {
    world.remove(axesGroup);
    axesGroup.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); } });
    axesGroup = null;
  }
}
function buildAxes(scale) {
  disposeAxes();
  axesGroup = new THREE.Group();
  const L = WORLD_R * 1.32;
  const shaftMat = matStd(PAL.steel, { metalness: 0.55, roughness: 0.35 });
  const tipMat = matStd(PAL.steel, { metalness: 0.55, roughness: 0.35 });
  const dirs = [
    { v: new THREE.Vector3(1, 0, 0), label: 'x' },
    { v: new THREE.Vector3(0, 1, 0), label: 'y' },
    { v: new THREE.Vector3(0, 0, 1), label: 'z' },
  ];
  dirs.forEach(({ v, label }) => {
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, L, 10), shaftMat);
    shaft.position.copy(v.clone().multiplyScalar(L / 2));
    shaft.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v);
    axesGroup.add(shaft);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.3, 12), tipMat);
    tip.position.copy(v.clone().multiplyScalar(L + 0.14));
    tip.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v);
    axesGroup.add(tip);
    const sp = makeTextSprite(label, { fontSize: 46, color: '#c9d6e2', scale: 0.011 });
    sp.position.copy(v.clone().multiplyScalar(L + 0.52));
    axesGroup.add(sp);
  });
  const originDot = new THREE.Mesh(new THREE.SphereGeometry(0.09, 14, 10), matGlow(0xffd28a, 1.1, { roughness: 0.4 }));
  axesGroup.add(originDot);
  axesGroup.visible = axesOn && st.view.axes;
  world.add(axesGroup);
}

/* ---------------- 全局状态与重建管线 ---------------- */

const st = {
  n: 2, l: 1, i: 2,               // 当前轨道（默认 2pz）
  pointCount: 40000,
  pointSize: 0.12,
  phase: true,
  showNodes: false,
  spin: false,
  view: { cloud: true, surface: false, phase: true, axes: true, slice: false },
  overlayP: false,                // 三个 2p 叠加（轨道形状章）
  exposeT0: -10,
  playing: false,
  cloudN: 0,
  nodeMark: true,
  section: 0,
  scale: 1,
  edu: { count: 0, playing: false, speed: 3, acc: 0 },
  cfg: { Z: 11, shown: 0, playing: false, speed: 12, acc: 0 },
  q: { n: 3, l: 2, m: 1 },
};

function currentK() { return ORB_OPTS[st.l][st.i].k; }

let valenceClouds = [];
function disposeValence() {
  valenceClouds.forEach((o) => {
    if (o.pts.parent) o.pts.parent.remove(o.pts);
    o.pts.geometry.dispose();
    o.mat.dispose();
  });
  valenceClouds = [];
}

// 按当前状态重建全部轨道可视物
function applyOrbital(opts = {}) {
  const { noFrame = false, instant = false } = opts;
  const k = currentK();
  const scale = scaleOf(st.n, st.l, k);
  st.scale = scale;
  disposeValence();
  if (st.overlayP) {
    // 三个 2p 叠加：px/py/pz 三份点云（等权、相位着色），展示「合起来近球形」
    ['px', 'py', 'pz'].forEach((kk, idx) => {
      const sc = scaleOf(2, 1, kk);
      const { pos, col, count } = sampleCloud(2, 1, kk, 15000, 20261030 + 2110 + idx, {});
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geo.setAttribute('cloudColor', new THREE.BufferAttribute(col, 3));
      const mat = makeCloudMaterial();
      mat.uniforms.uPhase.value = st.phase ? 1 : 0;
      mat.uniforms.uOpacity.value = 0.5;
      mat.uniforms.uSize.value = st.pointSize * 0.9;
      cloudMats.push(mat);
      const pts = new THREE.Points(geo, mat);
      pts.frustumCulled = false;
      pts.scale.setScalar(sc);
      pts.renderOrder = 10;
      orbGroup.add(pts);
      valenceClouds.push({ pts, mat });
    });
    disposeCloud();
    disposeShells();
    disposeSlice();
  } else {
    // 云点 / 等值面 / 截面三者独立开关（径向章 = 云 + 截面，量子数章 = 面 + 截面）
    if (st.view.cloud) buildCloud(st.n, st.l, k, scale, { expose: opts.expose, count: st.pointCount });
    else disposeCloud();
    if (st.view.surface) buildShells(st.n, st.l, k, scale);
    else disposeShells();
    if (st.view.slice && (st.view.cloud || st.view.surface)) buildSlice(st.n, st.l, k, scale);
    else disposeSlice();
  }
  buildNodes(k, scale);
  buildAxes(scale);
  axesGroup.visible = axesOn && st.view.axes;
  if (opts.expose) {
    st.exposeT0 = performance.now() * 0.001;
    st.reveal = 0;
  } else {
    st.exposeT0 = -10;
    st.cntStale = st.section === 0;
  }
  if (!noFrame) frameOrbital(instant);
  if (currentHud) {
    updateHudOrb();
    if (st.section === 0) currentHud.set('pts', st.cloudN.toLocaleString() + ' 点');
  }
}

function setPhaseMode(on) {
  st.phase = on;
  cloudMats.forEach((m) => { m.uniforms.uPhase.value = on ? 1 : 0; });
  shellMats.forEach((m) => { m.uniforms.uPhase.value = on ? 1 : 0; });
}

function frameOrbital(instant = false) {
  const preset = CAM_PRESETS[SEC_CAM[st.section]] || CAM_PRESETS.default;
  const d = preset.dist;
  const dir = new THREE.Vector3(...preset.dir).normalize().multiplyScalar(d);
  app.setCamera([dir.x, dir.y, dir.z], [0, 0, preset.tz], instant);
}
const CAM_PRESETS = {
  default: { dir: [1.0, 0.62, 0.48], dist: 14.6, tz: -0.2 },
  cloud: { dir: [0.85, 0.6, 0.52], dist: 13.8, tz: -0.2 },
  shape: { dir: [1.1, 0.62, 0.4], dist: 13.2, tz: -0.2 },
  radial: { dir: [0.32, 0.52, 0.42], dist: 14.2, tz: -0.2 },
  dom: { dir: [0.58, 0.52, 0.6], dist: 20.5, tz: -3.2 },
};
const SEC_CAM = ['cloud', 'shape', 'radial', 'dom', 'dom', 'shape', 'shape', 'dom'];

/* ---------------- HUD（数据读数坞）与能级梯小图 ---------------- */

const hudWrap = document.createElement('div');
const lcData = document.getElementById('lcData');
let currentHud = null;

function buildHud(rows) {
  lcData.innerHTML = '';
  currentHud = makeHUD(lcData, rows);
  return currentHud;
}
function ensureLadder() {
  let el = lcData.querySelector('.orb-ladder');
  if (!el) {
    el = document.createElement('div');
    el.className = 'orb-ladder';
    el.innerHTML = '<h4>能级梯 · 当前壳层</h4>';
    const cv = document.createElement('canvas');
    cv.width = 520; cv.height = 150;
    el.appendChild(cv);
    lcData.appendChild(el);
  }
  return el.querySelector('canvas');
}
function drawLadder() {
  const cv = ensureLadder();
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const W = 260, H = 75;
  ctx.setTransform(2, 0, 0, 2, 0, 0);
  ctx.clearRect(0, 0, W, H);
  const nMax = Math.max(st.n, 1);
  // 能级横杠：按 (n + l) 能量从左到右排
  const subs = [];
  for (let nn = 1; nn <= 4; nn++) {
    for (let ll = 0; ll < Math.min(nn, 4); ll++) subs.push({ n: nn, l: ll, label: nn + L_LETTER[ll] });
  }
  const shown = subs.filter((s) => s.n <= nMax);
  const x0 = 34, dx = 44, rowH = 17;
  shown.forEach((s) => {
    const y = H - 12 - (s.n - 1) * rowH - (s.l === 0 ? 0 : 0);
    const x = x0 + (s.n + s.l - 1) * dx * 0.62;
    const active = s.n === st.n && s.l === st.l;
    ctx.strokeStyle = active ? 'rgba(232,103,74,1)' : 'rgba(140,152,166,' + (s.n === nMax ? 0.8 : 0.34) + ')';
    ctx.lineWidth = active ? 2.6 : 1.6;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 26, y);
    ctx.stroke();
    ctx.fillStyle = active ? 'rgba(232,103,74,1)' : 'rgba(140,152,166,0.6)';
    ctx.font = (active ? '700 ' : '400 ') + '9.5px -apple-system, "PingFang SC", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(s.label, x + 30, y + 3.5);
  });
  ctx.fillStyle = 'rgba(140,152,166,0.55)';
  ctx.font = '9px -apple-system, "PingFang SC", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('能量 →（n+l 小者在左）', x0, 10);
}
function updateHudOrb() {
  if (!currentHud) return;
  const k = currentK();
  if (currentHud.set) currentHud.set('orb', orbName(st.n, st.l, st.i));
  if (st.section === 1) currentHud.set('surf', (shellsGroup ? String(SHELL_LEVELS.length) : '0') + ' 层');
  if (st.section === 1 || st.section === 6) currentHud.set('nodes', st.l + ' 角 / ' + (st.n - st.l - 1) + ' 径');
  if (st.section === 0 || st.section === 2 || st.section === 6) currentHud.set('rstar', '≈ ' + rStar(st.n, st.l).toFixed(1) + ' a₀');
  if (st.section === 2) currentHud.set('rnodes', radialNodes(st.n, st.l).map((r) => r.toFixed(1)).join(' / ') || '无');
}

/* ---------------- 径向分布对比图（多曲线 + 节点虚线） ---------------- */

const rchartCard = document.createElement('div');
rchartCard.className = 'orb-card orb-rchart hide';
rchartCard.innerHTML = '<h3>径向分布 D(r) = r²R²</h3>';
const rcCanvas = document.createElement('canvas');
rcCanvas.width = 780; rcCanvas.height = 380;
rchartCard.appendChild(rcCanvas);
const rcCap = document.createElement('div');
rcCap.className = 'cap';
rchartCard.appendChild(rcCap);
stage.appendChild(rchartCard);
const rcCtx = rcCanvas.getContext('2d');

function curveOf(label) {
  const n = +label[0], l = 'spdf'.indexOf(label[1]);
  return { n, l, label };
}
function drawRChart(spec) {
  const W = 390, H = 190;
  const ctx = rcCtx;
  ctx.setTransform(2, 0, 0, 2, 0, 0);
  ctx.clearRect(0, 0, W, H);
  const pad = { l: 30, r: 8, t: 10, b: 22 };
  const pw = W - pad.l - pad.r, ph = H - pad.t - pad.b;
  const rMax = Math.ceil(Math.max(...spec.curves.map((c) => rStar(c.n, c.l))) * 1.45);
  const NP = 320;
  // 归一化：各曲线按自己峰值缩放（对比形状而非量级）
  const series = spec.curves.map((c) => {
    const R = rOf(c.n, c.l);
    const D = new Float64Array(NP + 1);
    let dMax = 0;
    for (let i = 0; i <= NP; i++) {
      const r = (i / NP) * rMax, v = R(r), d = v * v * r * r;
      D[i] = d; if (d > dMax) dMax = d;
    }
    return { ...c, D, dMax };
  });
  const xOf = (r) => pad.l + (r / rMax) * pw;
  const yOf = (d, dm) => pad.t + ph - (d / dm) * ph * 0.94;
  // 网格
  ctx.strokeStyle = 'rgba(128,142,158,0.2)';
  ctx.lineWidth = 1;
  ctx.fillStyle = 'rgba(140,152,166,0.9)';
  ctx.font = '9.5px -apple-system, "PingFang SC", sans-serif';
  ctx.textAlign = 'center';
  const tick = rMax > 24 ? 5 : rMax > 12 ? 2 : 1;
  for (let r = 0; r <= rMax; r += tick) {
    const x = xOf(r);
    ctx.beginPath(); ctx.moveTo(x, pad.t); ctx.lineTo(x, pad.t + ph); ctx.stroke();
    ctx.fillText(String(r), x, H - 8);
  }
  ctx.textAlign = 'right';
  ctx.fillText('r/a₀', W - pad.r, H - 8);
  // 曲线：非当前章淡、当前章实
  series.forEach((s) => {
    const col = CURVE_COLS[s.label] || '#ffb066';
    const active = s.active;
    ctx.beginPath();
    ctx.moveTo(xOf(0), yOf(0, s.dMax));
    for (let i = 0; i <= NP; i++) ctx.lineTo(xOf((i / NP) * rMax), yOf(s.D[i], s.dMax));
    if (active) {
      ctx.lineTo(xOf(rMax), yOf(0, s.dMax));
      ctx.closePath();
      ctx.fillStyle = col + '2b';
      ctx.fill();
    }
    ctx.beginPath();
    for (let i = 0; i <= NP; i++) {
      const x = xOf((i / NP) * rMax), y = yOf(s.D[i], s.dMax);
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.strokeStyle = col;
    ctx.globalAlpha = active ? 1 : 0.38;
    ctx.lineWidth = active ? 2.1 : 1.2;
    ctx.stroke();
    ctx.globalAlpha = 1;
    if (active) {
      // 径向节点虚线 + 最概然半径标记
      const nodes = radialNodes(s.n, s.l);
      if (st.nodeMark) {
        ctx.setLineDash([4, 3]);
        ctx.strokeStyle = 'rgba(120,168,255,0.9)';
        ctx.lineWidth = 1.1;
        ctx.font = '9.5px -apple-system, "PingFang SC", sans-serif';
        ctx.fillStyle = 'rgba(120,168,255,1)';
        nodes.forEach((r, i) => {
          const x = xOf(r);
          ctx.beginPath(); ctx.moveTo(x, pad.t + 3); ctx.lineTo(x, pad.t + ph); ctx.stroke();
          ctx.fillText('r' + (i + 1) + '=' + r.toFixed(1), x, pad.t + 11 + (i % 2) * 11);
        });
        ctx.setLineDash([]);
      }
      const rs = rStar(s.n, s.l);
      const x = xOf(rs), y = yOf(s.dMax, s.dMax);
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(x, y, 3.2, 0, TAU); ctx.fill();
      ctx.font = '600 10px -apple-system, "PingFang SC", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('r* ≈ ' + rs.toFixed(1), x + 6, y - 4);
      ctx.textAlign = 'center';
    }
  });
  rcCap.textContent = spec.cap || ('虚线蓝 = 径向节点（D(r)=0，共 n−l−1 个）· 圆点 = 最概然半径 r*');
}

/* ---------------- 能级图卡（构造原理） ---------------- */

const eduCard = document.createElement('div');
eduCard.className = 'orb-card orb-edu hide';
eduCard.innerHTML = '<h3>构造原理 · 能级图 <span class="orb-sub" id="orbEduCount"></span></h3>';
const eduCanvas = document.createElement('canvas');
eduCanvas.width = 1360; eduCanvas.height = 680;
eduCard.appendChild(eduCanvas);
const eduCap = document.createElement('div');
eduCap.className = 'cap';
eduCap.textContent = '能级由低到高：1s 2s 2p 3s 3p 4s 3d 4p（n+l 越小越先填；n+l 相同则 n 小者先填）。注意能级交错：E(4s)＜E(3d)，所以钾、钙先填 4s 再填 3d。';
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
    ctx.fillStyle = 'rgba(140,152,166,1)';
    ctx.textAlign = 'right';
    ctx.fillText(s.label, x0 - 8, y + boxH / 2 + 4.5);
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
    if (take > 0) {
      ctx.fillStyle = 'rgba(140,152,166,0.9)';
      ctx.textAlign = 'left';
      ctx.font = '10.5px -apple-system, sans-serif';
      ctx.fillText(String(take), x0 + boxes * boxW + 4, y + boxH / 2 + 4);
      ctx.font = '600 13px -apple-system, "PingFang SC", sans-serif';
    }
  });
  ctx.fillStyle = '#e59b3c';
  ctx.textAlign = 'left';
  ctx.font = '600 11.5px -apple-system, "PingFang SC", sans-serif';
  ctx.fillText('能级交错：E(4s)＜E(3d)', x0 + 118, yBase - 5 * rowH + 6);
  const cnt = document.getElementById('orbEduCount');
  if (cnt) cnt.textContent = '已填 ' + fill + ' / 36 e⁻';
}

/* ---------------- 电子排布卡（周期表 + 轨道式 + 价层电子云） ---------------- */

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
      <div class="lc-lesson orb-phase-legend" style="margin-top:10px">
        <i style="--dot:#8fc2ff">s 涂蓝</i><i style="--dot:#ff9d4d">p 涂橙</i><i style="--dot:#c98aff">d 涂紫</i>
        <span style="font-size:11px">舞台上为该元素的<b>价层电子云</b></span>
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
    b.innerHTML = EL36[z - 1] + '<i>' + z + '</i>';
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
  const rows = [SUBS.slice(0, 5), SUBS.slice(5)];
  let used = 0;
  const boxW = 22, boxH = 24, rowH = 74, x0 = 6;
  ctx.font = '600 12px -apple-system, "PingFang SC", sans-serif';
  rows.forEach((row, ri) => {
    const y = 14 + ri * rowH;
    let x = x0;
    row.forEach((s) => {
      const take = cnt[s.label];
      const boxes = s.cap / 2;
      ctx.fillStyle = 'rgba(140,152,166,1)';
      ctx.textAlign = 'left';
      ctx.fillText(s.label, x, y + boxH + 13);
      const usedBefore = (() => {
        let c = 0;
        for (let r = 0; r <= ri; r++) {
          for (const ss of rows[r]) {
            if (ss === s) return c;
            c += fillCounts(st.cfg.Z)[ss.label];
          }
        }
        return c;
      })();
      for (let b = 0; b < boxes; b++) {
        ctx.strokeStyle = 'rgba(140,152,166,0.7)';
        ctx.lineWidth = 1.1;
        ctx.strokeRect(x + b * boxW, y, boxW - 4, boxH);
        let up = 0, down = 0;
        if (take > 0) {
          const subShown = clamp(shown - usedBefore, 0, take);
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
}

function selectElement(z, animate = true) {
  st.cfg.Z = z;
  st.cfg.shown = animate ? 0 : z;
  st.cfg.playing = animate;
  st.cfg.acc = 0;
  elBtns.forEach((b, i) => b.classList.toggle('on', i + 1 === z));
  confCard.querySelector('#orbConfElem').textContent = z + ' 号 · ' + CN36[z - 1] + ' ' + EL36[z - 1] + '（' + z + ' 个电子）';
  confCard.querySelector('#orbSpecialTag').classList.toggle('hide', !(z === 24 || z === 29));
  confCard.querySelector('#orbConfFull').textContent = configFull(z);
  confCard.querySelector('#orbConfShort').textContent = configShort(z);
  drawConfBoxes();
  buildValenceClouds(z);
  if (currentHud) {
    currentHud.set('elem', CN36[z - 1] + ' ' + EL36[z - 1] + '（' + z + ' 号）');
    currentHud.set('val', valenceSubs(z).map((s) => s.label + sup(s.count)).join(' '));
  }
}

// 价层电子云：最外层子壳 + 3d（s 蓝 / p 橙 / d 紫），统一按最大包围半径归一
function buildValenceClouds(Z) {
  disposeValence();
  const subs = valenceSubs(Z);
  if (!subs.length) return;
  const maxRq = Math.max(...subs.map((s) => psiStats(s.n, s.l, ORB_OPTS[s.l][0].k).rq));
  let ptsTotal = 0;
  subs.forEach((s) => {
    const k0 = ORB_OPTS[s.l][0].k;
    const perE = 5200;
    const { pos, count } = sampleCloud(s.n, s.l, k0, perE * Math.max(1, Math.ceil(s.count / 2)), 77000 + Z * 100 + s.n * 10 + s.l, { flat: colorToVec(ORB.valence[L_LETTER[s.l]]) });
    ptsTotal += count;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('cloudColor', new THREE.BufferAttribute(new Float32Array(pos.length), 3));
    const mat = makeCloudMaterial();
    mat.uniforms.uPhase.value = 0;
    mat.uniforms.uFlat.value = new THREE.Color(ORB.valence[L_LETTER[s.l]]);
    mat.uniforms.uOpacity.value = 0.5;
    mat.uniforms.uSize.value = 0.09;
    cloudMats.push(mat);
    const pts = new THREE.Points(geo, mat);
    pts.frustumCulled = false;
    pts.scale.setScalar((WORLD_R * 1.05) / maxRq);
    pts.renderOrder = 10;
    world.add(pts);
    valenceClouds.push({ pts, mat });
  });
  refreshCloudScale();
  if (currentHud) currentHud.set('pts', ptsTotal.toLocaleString() + ' 点');
}
function colorToVec(hex) {
  return [((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255];
}

/* ---------------- 量子数练习卡 ---------------- */

const qCard = document.createElement('div');
qCard.className = 'orb-card orb-q hide';
qCard.innerHTML = `
  <h3>量子数练习 <span class="orb-sub" id="orbQScore"></span></h3>
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
['#orbQn', '#orbQl', '#orbQm', '#orbQs'].forEach((id) => qSel(id).addEventListener('change', () => { qStatus(); qApplyToStage(); }));
function qVals() {
  return { n: +qSel('#orbQn').value, l: +qSel('#orbQl').value, m: +qSel('#orbQm').value, s: +qSel('#orbQs').value };
}
function qStatus() {
  const el = qSel('#orbQStatus');
  const v = qVals();
  if (v.l >= v.n) { el.className = 'status bad'; el.textContent = '✗ 不合法：l 必须 ＜ n（n=' + v.n + ' 时 l 最大取 ' + (v.n - 1) + '）'; return false; }
  if (Math.abs(v.m) > v.l) { el.className = 'status bad'; el.textContent = '✗ 不合法：|m| 必须 ≤ l（l=' + v.l + ' 时 m 只能取 ' + (-v.l) + '…+' + v.l + '）'; return false; }
  el.className = 'status ok';
  const shape = ['球形（s）', '哑铃形（p）', '花瓣形（d）', '复杂多瓣（f）'][v.l];
  el.textContent = '✓ 合法：第 ' + v.n + ' 电子层 · ' + (v.l ? ['p', 'd', 'f'][v.l - 1] : 's') + ' 轨道（' + shape + '）· ' + (v.l ? '空间取向 m=' + (v.m > 0 ? '+' : '') + v.m : '无方向性 m=0') + ' · 自旋' + (v.s > 0 ? '向上' : '向下');
  return true;
}
// 量子数章：下拉框联动 3D 舞台（l/m 决定取向，n 决定大小）
function qApplyToStage() {
  const v = qVals();
  st.q = { n: v.n, l: v.l, m: v.m };
  if (st.section === 5 && v.l < v.n && Math.abs(v.m) <= v.l) {
    const optsList = ORB_OPTS[v.l];
    const iMap = { px: 0, py: 1, pz: 2, dz2: 0, dxz: 1, dyz: 2, dxy: 3, dx2y2: 4,
      fz3: 0, fxz2: 1, fyz2: 2, fxyz: 3, fzx2y2: 4, fx2m3y2: 5, fy3x2my2: 6 };
    // m 到实轨道方向的映射（|m| 决定形状族，符号选镜像方向）
    let i = 0;
    if (v.l === 1) i = v.m === 0 ? 2 : (v.m > 0 ? 0 : 1);
    else if (v.l >= 2) i = clamp(Math.abs(v.m), 0, optsList.length - 1);
    st.n = v.n; st.l = v.l; st.i = i;
    st.view = { cloud: false, surface: true, phase: true, axes: true, slice: true };
    applyOrbital({ noFrame: true });
    drawRChart({
      curves: [{ n: v.n, l: v.l, label: v.n + L_LETTER[v.l], active: true }],
      cap: '该径向分布的峰值（最概然半径）r* ≈ ' + rStar(v.n, v.l).toFixed(1) + ' a₀ · 径向节点 ' + (v.n - v.l - 1) + ' 个',
    });
    updateHudOrb();
    if (currentHud) currentHud.set('mval', 'm = ' + (v.m > 0 ? '+' : '') + v.m + (v.l === 0 ? '（s 无取向）' : ''));
  }
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
  const right = '（' + item.n + ', ' + item.l + ', ' + (item.m == null ? '任意' : (item.m > 0 ? '+' + item.m : item.m)) + ', ' + (item.s == null ? '任意' : (item.s > 0 ? '+½' : '−½')) + '）';
  stEl.textContent = (ok ? '✓ 正确。' : '✗ 不对，参考答案 ' + right + '。') + item.ex;
  qSel('#orbQScore').textContent = '第 ' + (qz.idx + 1) + '/' + QZ_BANK.length + ' 题 · 得分 ' + qz.score;
});
qSel('#orbQNext').addEventListener('click', () => { qz.active = true; qz.idx = 0; qz.score = 0; qLoad(); });
function qLoad() {
  const item = QZ_BANK[qz.idx];
  qSel('#orbQDesc').textContent = '第 ' + (qz.idx + 1) + '/' + QZ_BANK.length + ' 题：' + item.desc;
  qSel('#orbQScore').textContent = '得分 ' + qz.score;
  const stEl = qSel('#orbQStatus');
  stEl.className = 'status';
  stEl.textContent = '设置四个量子数后点「提交答案」。舞台会实时摆出对应轨道。';
}

/* ---------------- 轨道库卡（n=1..4 全部 30 条轨道） ---------------- */

const libCard = document.createElement('div');
libCard.className = 'orb-card orb-lib hide';
libCard.innerHTML = '<div class="orb-libgrid" id="orbLibGrid"></div><div class="orb-libinfo" id="orbLibInfo"></div>';
stage.appendChild(libCard);
const LIB_ITEMS = [];
for (let n = 1; n <= 4; n++) {
  for (let l = 0; l < Math.min(n, 4); l++) {
    ORB_OPTS[l].forEach((o, i) => LIB_ITEMS.push([n, l, i]));
  }
}
const libBtns = [];
{
  const grid = libCard.querySelector('#orbLibGrid');
  for (let n = 1; n <= 4; n++) {
    const row = document.createElement('div');
    row.className = 'lg';
    const tag = document.createElement('span');
    tag.textContent = 'n = ' + n;
    row.appendChild(tag);
    LIB_ITEMS.forEach(([nn, l, i], idx) => {
      if (nn !== n) return;
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = orbName(nn, l, i);
      b.addEventListener('click', () => libSelect(idx));
      row.appendChild(b);
      libBtns.push({ b, idx });
    });
    grid.appendChild(row);
  }
}
function libSelect(idx) {
  libBtns.forEach(({ b, idx: j }) => b.classList.toggle('on', j === idx));
  const [n, l, i] = LIB_ITEMS[idx];
  setOrb(n, l, i);
}
function updateLibInfo() {
  const [n, l] = [st.n, st.l];
  const info = libCard.querySelector('#orbLibInfo');
  if (!info) return;
  const nodes = radialNodes(n, l);
  const nodeTxt = nodes.length ? nodes.map((r) => r.toFixed(1)).join('、') + ' a₀' : '无';
  const k = currentK();
  info.innerHTML = '<b>' + orbName(n, l, st.i) + '</b> — ' + orbDesc(n, l) + '。角节面 <b>' + l + '</b> 个（' + angDesc(k) + '）· 径向节点 <b>' + (n - l - 1) + '</b> 个（位于 ' + nodeTxt + '）· 最概然半径 r* ≈ <b>' + rStar(n, l).toFixed(1) + ' a₀</b>';
}

function setOrb(n, l, i, opts = {}) {
  st.n = n; st.l = l; st.i = i;
  applyOrbital(opts);
  if (st.section === 2) drawRadialChart();
  if (st.section === 6) updateLibInfo();
  if (st.section === 5) qApplyToStage();
  syncChips();
}

/* ---------------- 舞台速选 chips（对应原版 stageBar 交互位） ---------------- */

let chipsEl = null;
function ensureChips() {
  if (!chipsEl) {
    chipsEl = document.createElement('div');
    chipsEl.className = 'orb-chips';
    stage.appendChild(chipsEl);
  }
  return chipsEl;
}
let chipHandlers = [];
function syncChips() {
  const el = ensureChips();
  el.innerHTML = '';
  chipHandlers.forEach((h) => h.removeEventListener && h.removeEventListener('click', h.fn));
  chipHandlers = [];
  const mk = (html, fn, cls) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.innerHTML = html;
    if (cls) b.className = cls;
    const rec = { b, fn, removeEventListener: b.removeEventListener.bind(b) };
    b.addEventListener('click', fn);
    chipHandlers.push(rec);
    el.appendChild(b);
    return b;
  };
  if (st.section === 0) {
    const picks = [[1, 0, 0, '1s'], [2, 0, 0, '2s'], [2, 1, 2, '2pz']];
    picks.forEach(([n, l, i, label]) => {
      const on = st.n === n && st.l === l && st.i === i;
      const b = mk(label, () => setOrb(n, l, i), on ? 'on' : '');
      if (on) b.classList.add('on');
    });
    el.appendChild(Object.assign(document.createElement('i')));
    mk(st.playing ? '⏸ 暂停记录' : '⏵ 继续记录', () => { st.playing = !st.playing; syncChips(); });
    mk('↺ 重新记录', () => restartExpose());
  } else if (st.section === 1) {
    const picks = [[1, 0, 0], [2, 0, 0], [2, 1, 0], [2, 1, 1], [2, 1, 2],
      [3, 2, 0], [3, 2, 1], [3, 2, 2], [3, 2, 3], [3, 2, 4]];
    picks.forEach(([n, l, i]) => {
      const on = !st.overlayP && st.n === n && st.l === l && st.i === i;
      mk(orbName(n, l, i), () => { st.overlayP = false; setOrb(n, l, i); }, on ? 'on' : '');
    });
    el.appendChild(Object.assign(document.createElement('i')));
    mk(st.overlayP ? '✕ 退出叠加' : '三个 p 叠加', () => {
      st.overlayP = !st.overlayP;
      applyOrbital();
      syncChips();
      toast(st.overlayP ? '三个 2p 轨道叠加：合在一起的电子云近似球形（等价轨道各方向等概率）' : '已退出叠加。', 'ok');
    }, st.overlayP ? 'on' : '');
  } else if (st.section === 2) {
    ['1s', '2s', '3s', '2p', '3p', '3d'].forEach((label) => {
      const c = curveOf(label);
      const on = st.n === c.n && st.l === c.l;
      mk(label, () => {
        const oi = c.l === 1 ? 2 : 0;
        setOrb(c.n, c.l, oi);
      }, on ? 'on' : '');
    });
  }
  if (!el.children.length) el.style.display = 'none';
  else el.style.display = '';
  el.classList.toggle('raised', st.section === 2);
}
function restartExpose() {
  st.playing = true;
  st.reveal = 0;
  st.exposeT0 = performance.now() * 0.001;
  if (cloudObj) cloudObj.geometry.setDrawRange(0, 0);
  syncChips();
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
  st.quizPanel = panel;

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
}

/* ---------------- 控件工具（三滑杆 / 播放钮） ---------------- */

const ctl = createControlsPanel(document.getElementById('controls'));
let activeCleanup = null;

function showOnly(cards) {
  rchartCard.classList.toggle('hide', !cards.rchart);
  eduCard.classList.toggle('hide', !cards.edu);
  confCard.classList.toggle('hide', !cards.conf);
  qCard.classList.toggle('hide', !cards.q);
  libCard.classList.toggle('hide', !cards.lib);
  if (!cards.q && qz.active) qz.active = false;
}
function clearOrbital() {
  disposeCloud();
  disposeShells();
  disposeSlice();
  disposeNodes();
  disposeValence();
  disposeAxes();
}

// 轨道三滑杆（n / l / 方向）
function addOrbitSliders(n0, l0, i0, onChange) {
  const cur = { n: n0, l: l0, i: i0 };
  let sL = null, sI = null;
  const apply = () => onChange(cur.n, cur.l, cur.i);
  const sN = ctl.slider({
    label: '主量子数 n', min: 1, max: 4, value: n0,
    fmt: (v) => 'n=' + v,
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
      return 'l=' + lv + '（' + L_LETTER[lv] + '）';
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

function paintPlayBtn() {
  if (st.eduPlayBtn) {
    st.eduPlayBtn.textContent = st.edu.playing ? '⏸ 暂停' : '▶ 自动填充';
    st.eduPlayBtn.classList.toggle('active', st.edu.playing);
  }
}
function drawRadialChart() {
  const labels = ['1s', '2s', '3s', '2p', '3p', '3d'];
  const cur = st.n + L_LETTER[st.l];
  drawRChart({
    curves: labels.map((lb) => {
      const c = curveOf(lb);
      return { n: c.n, l: c.l, label: lb, active: lb === cur };
    }),
    cap: orbName(st.n, st.l, st.i) + '：径向节点 ' + (st.n - st.l - 1) + ' 个（n−l−1，蓝虚线）· 角节面 ' + st.l + ' 个 · 最概然半径 r* ≈ ' + rStar(st.n, st.l).toFixed(1) + ' a₀',
  });
}

/* ---------------- 章节复位 ---------------- */

function resetWorld() {
  st.spin = false;
  st.overlayP = false;
  st.showNodes = false;
  st.playing = false;
  st.edu.playing = false;
  st.cfg.playing = false;
  setPhaseMode(true);
}

/* ---------------- 章节装配（三个编组 + 随堂检测） ---------------- */

const GROUPS = [
  { name: '波函数与电子云', from: 0, to: 2 },
  { name: '能级与排布', from: 3, to: 4 },
  { name: '速查与检测', from: 5, to: 7 },
];

const SECTIONS = [
  {
    title: '电子云',
    group: '波函数与电子云',
    html: `<p>解出氢原子的薛定谔方程，得到波函数 <span class="hl">ψ</span>，而 |ψ|² 给出电子在空间各点出现的<b>概率密度</b>——把无数个「可能的位置」撒成点，就成了<b>电子云</b>。本实验用真实波函数撒点：<span class="hl">ψ&gt;0 红色、ψ&lt;0 蓝色</span>，点的密度正比于 |ψ|²。</p>
<p>点越密，只说明电子在那个位置<b>出现的概率越高</b>，不代表那里堆着一堆电子。拖 n / l / 方向三个滑杆换轨道（1s ~ 4f），底部 chips 快速跳 1s / 2s / 2pz，点「曝光重播」看点云逐点长出来的过程——像老照片一样慢慢显影。</p>
<div class="orb-phase-legend"><i style="--dot:#ff6a4d">ψ &gt; 0</i><i style="--dot:#4f8ef7">ψ &lt; 0</i></div>`,
    enter() {
      resetWorld();
      st.section = 0;
      st.playing = true;
      st.view = { cloud: true, surface: false, phase: true, axes: true, slice: false };
      showOnly({});
      setOrb(2, 1, 2, { expose: true, instant: !booted });
      buildHud([['orb', '当前轨道'], ['cnt', '已记录电子位置'], ['rstar', '最概然半径']]);
      currentHud.set('cnt', '0 点');
      drawLadder();
      updateHudOrb();
      ctl.clear();
      addOrbitSliders(st.n, st.l, st.i, (n, l, i) => setOrb(n, l, i));
      ctl.sep();
      ctl.toggle({ label: '相位着色', value: st.phase, onChange: (v) => setPhaseMode(v) });
      ctl.slider({
        label: '点数', min: 10000, max: 60000, step: 5000, value: st.pointCount,
        fmt: (v) => (v / 1000) + 'k',
        onInput: (v) => { st.pointCount = v; applyOrbital({ noFrame: true }); },
      });
      ctl.slider({
        label: '点大小', min: 0.04, max: 0.24, step: 0.01, value: st.pointSize,
        fmt: (v) => v.toFixed(2),
        onInput: (v) => { st.pointSize = v; cloudMats.forEach((m) => { m.uniforms.uSize.value = v; }); },
      });
      ctl.sep();
      const row = document.createElement('div');
      row.className = 'lc-btnrow';
      const bReplay = document.createElement('button');
      bReplay.type = 'button';
      bReplay.className = 'ctl-btn active';
      bReplay.textContent = '⏳ 曝光重播';
      bReplay.addEventListener('click', restartExpose);
      row.appendChild(bReplay);
      ctl.el.appendChild(row);
      syncChips();
    },
  },
  {
    title: '轨道形状',
    group: '波函数与电子云',
    html: `<p>把「电子约九成出现概率」包住的等值面，就是常说的<b>原子轨道形状</b>。舞台上是按 |ψ| 采出的<span class="hl">三层嵌套等概率面</span>——每层壳各自是一个<b>等概率面</b>：靠内的壳对应更高的概率密度，所以内层更亮。</p>
<p>s 只有球形一种；p 是<b>哑铃</b>，x / y / z 各取向一条；d 多为<b>四叶花瓣</b>（z² 例外：双瓣 + 中心环），共 5 条；f 的花样更多。</p>
<p><span class="hl">暖、冷两色是波函数 ψ 的正、负相位标记</span>（不是电荷）——两瓣能否成键，就看相位对不对得上。打开「显示节面」看 ψ=0 的平面 / 双圆锥。</p>`,
    enter() {
      resetWorld();
      st.section = 1;
      st.view = { cloud: false, surface: true, phase: true, axes: true, slice: false };
      showOnly({});
      buildHud([['orb', '当前轨道'], ['surf', '等概率面'], ['nodes', '节面（角/径）']]);
      drawLadder();
      ctl.clear();
      let fam = '3d', fidx = 0;
      updateHudOrb();
      const FAM = { '1s': [1, 0], '2s': [2, 0], '2p': [2, 1], '3p': [3, 1], '3d': [3, 2], '4f': [4, 3] };
      const build = () => {
        const [n, l] = FAM[fam];
        setOrb(n, l, fidx);
      };
      ctl.seg({
        options: Object.keys(FAM).map((kk) => ({ label: kk, value: kk })),
        value: fam,
        onChange: (v) => { fam = v; fidx = 0; build(); buildShapeSecond(); },
      });
      const second = document.createElement('span');
      second.className = 'ctl-sep';
      const buildShapeSecond = () => {
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
      ctl.toggle({ label: '相位着色', value: st.phase, onChange: (v) => setPhaseMode(v) });
      ctl.toggle({ label: '显示节面', value: st.showNodes, onChange: (v) => { st.showNodes = v; buildNodes(currentK(), st.scale); } });
      ctl.toggle({ label: '自动旋转', value: st.spin, onChange: (v) => { st.spin = v; } });
      ctl.button({ label: '⌂ 复位视角', onClick: () => frameOrbital() });
      setOrb(3, 2, 0);
      syncChips();
    },
  },
  {
    title: '径向分布与节面',
    group: '波函数与电子云',
    html: `<p>把波函数拆成<b>径向</b>与<b>角向</b>两部分看：<span class="hl">径向分布 D(r)=r²R²</span>（左下角图）回答「电子在距核 r 处出现的总机会」。曲线碰到的零点叫<b>径向节点</b>，个数 = <span class="hl">n−l−1</span>；角向的 ψ=0 面叫<b>角节面</b>，个数 = l。截面上暗色的圆环就是径向节面，暗色直线是角节面。</p>
<p>一个漂亮的事实：<span class="hl">1s 的 D(r) 峰正好落在 r = a₀</span>（玻尔半径，52.9 pm）——玻尔模型猜对了最概然距离。对比 3s（2 个径向节点）与 2p（0 个）：左下角六条曲线可点选切换。</p>`,
    enter() {
      resetWorld();
      st.section = 2;
      st.view = { cloud: true, surface: false, phase: true, axes: false, slice: true };
      showOnly({ rchart: true });
      setOrb(3, 0, 0, { instant: !booted });
      buildHud([['orb', '当前轨道'], ['rnodes', '径向节点位置'], ['rstar', '最概然半径']]);
      drawLadder();
      drawRadialChart();
      updateHudOrb();
      ctl.clear();
      addOrbitSliders(st.n, st.l, st.i, (n, l, i) => setOrb(n, l, i));
      ctl.sep();
      ctl.toggle({ label: '节点标注', value: st.nodeMark, onChange: (v) => { st.nodeMark = v; drawRadialChart(); } });
      ctl.toggle({ label: '显示截面', value: st.view.slice, onChange: (v) => { st.view.slice = v; applyOrbital({ noFrame: true }); } });
      ctl.toggle({ label: '显示节面', value: st.showNodes, onChange: (v) => { st.showNodes = v; buildNodes(currentK(), st.scale); } });
      ctl.button({ label: '⌂ 复位视角', onClick: () => frameOrbital() });
      syncChips();
    },
  },
  {
    title: '能级与构造原理',
    group: '能级与排布',
    html: `<p>多电子原子里能级高低遵守<span class="hl">构造原理（Madelung 规则）</span>：按 <b>1s → 2s → 2p → 3s → 3p → 4s → 3d → 4p</b> 的顺序填入电子（n+l 越小越先填）。</p>
<p>注意图中<span class="hl">能级交错：E(4s)＜E(3d)</span>（橙框）——所以 K、Ca 先填 4s，填满后才开始填 3d。三条规则在此全用上：能量最低决定顺序，泡利原理限定每格 2 个自旋相反的电子，洪特规则要求等价轨道先分占。</p>
<p>点「自动填充」看 36 个电子依次入座；空格键 = 单步 +1e⁻。</p>`,
    enter() {
      resetWorld();
      st.section = 3;
      showOnly({ edu: true });
      clearOrbital();
      const p = CAM_PRESETS.dom;
      const dir = new THREE.Vector3(...p.dir).normalize().multiplyScalar(p.dist);
      app.setCamera([dir.x, dir.y, dir.z], [0, 0, p.tz]);
      buildHud([['stat', '状态'], ['fill', '已填电子']]);
      currentHud.set('stat', '能级图');
      currentHud.set('fill', '0 / 36');
      st.edu.count = 0;
      st.edu.playing = false;
      st.edu.acc = 0;
      drawEdu();
      ctl.clear();
      ctl.button({ label: '⏭ 单步 +1e⁻', onClick: () => { st.edu.playing = false; paintPlayBtn(); if (st.edu.count < 36) { st.edu.count++; drawEdu(); currentHud.set('fill', st.edu.count + ' / 36'); } } });
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
        onClick: () => { st.edu.playing = false; paintPlayBtn(); st.edu.count = 0; drawEdu(); currentHud.set('fill', '0 / 36'); },
      });
    },
  },
  {
    title: '电子排布',
    group: '能级与排布',
    html: `<p>点选 <b>1–36 号元素</b>，右侧按构造原理逐盒填入电子（等价轨道先分占再配对，符合洪特规则），同时给出<b>电子排布式</b>与<b>简式</b>。舞台同步摆出该元素的<span class="hl">价层电子云</span>：蓝色为 s、橙色为 p、紫色为 d。</p>
<p>留意两个「不听话」的：<span class="hl">Cr（24 号）是 3d⁵4s¹</span>、<span class="hl">Cu（29 号）是 3d¹⁰4s¹</span>——半满 / 全满更稳定（点「看特例」直达）。书写的顺序按 n、l 排（3d 写在 4s 前），但填充顺序仍是先 4s 后 3d。</p>`,
    enter() {
      resetWorld();
      st.section = 4;
      st.view = { cloud: false, surface: false, phase: true, axes: true, slice: false };
      showOnly({ conf: true });
      const p = CAM_PRESETS.dom;
      const dir = new THREE.Vector3(...p.dir).normalize().multiplyScalar(p.dist);
      app.setCamera([dir.x, dir.y, dir.z], [0, 0, p.tz]);
      buildHud([['elem', '元素'], ['val', '价层'], ['pts', '显示点数']]);
      selectElement(11, false);
      ctl.clear();
      ctl.slider({
        label: '填充速度', min: 4, max: 40, step: 2, value: st.cfg.speed,
        fmt: (v) => v + ' e⁻/s',
        onInput: (v) => { st.cfg.speed = v; },
      });
      ctl.sep();
      const row = document.createElement('div');
      row.className = 'lc-btnrow';
      const bRe = document.createElement('button');
      bRe.type = 'button';
      bRe.className = 'ctl-btn';
      bRe.textContent = '↺ 重播填充';
      bRe.addEventListener('click', () => selectElement(st.cfg.Z, true));
      const bSp = document.createElement('button');
      bSp.type = 'button';
      bSp.className = 'ctl-btn active';
      bSp.textContent = '⭐ 看特例（Cr / Cu）';
      let specialTurn = 0;
      bSp.addEventListener('click', () => { specialTurn = (specialTurn + 1) % 2; selectElement(specialTurn === 0 ? 24 : 29, true); });
      row.appendChild(bRe);
      row.appendChild(bSp);
      ctl.el.appendChild(row);
      buildAxes(1);
      applyAxes();
    },
  },
  {
    title: '量子数',
    group: '速查与检测',
    html: `<p>一套量子数（n, l, m, s）<b>唯一确定</b>一个电子状态：<span class="hl">n</span> 定电子层与能量轮廓；<span class="hl">l</span> 定轨道形状（0/1/2/3 → s/p/d/f），必须 l＜n；<span class="hl">m</span> 定空间取向，必须 |m|≤l；<span class="hl">s</span> 自旋只能 ±½。</p>
<p>节面总数 = n − 1，其中角节面 l 个、径向节面 n − l − 1 个。先自由拖四个下拉框体会合法性（实时判对错并解释，<b>舞台会摆出对应的等值面</b>），再点「随机出一题」做 5 道小题计分。例：2p_z 上自旋向上的电子 = (2, 1, 0, +½)。</p>`,
    enter() {
      resetWorld();
      st.section = 5;
      showOnly({ q: true, rchart: true });
      buildHud([['orb', '当前轨道'], ['mval', 'm 取向'], ['rstar', '最概然半径']]);
      drawLadder();
      qz.active = false;
      updateHudOrb();
      qSel('#orbQDesc').textContent = '自由探究：随意组合四个量子数，看看什么是合法组合。';
      qSel('#orbQScore').textContent = '';
      qStatus();
      qApplyToStage();
      frameOrbital(!booted);
      ctl.clear();
      ctl.button({ label: '🎲 随机出一题', onClick: () => { qz.active = true; qz.idx = 0; qz.score = 0; qLoad(); } });
      ctl.button({ label: '✓ 提交答案', onClick: () => qSel('#orbQSubmit').click() });
      ctl.button({ label: '⌂ 复位视角', onClick: () => frameOrbital() });
      syncChips();
    },
  },
  {
    title: '轨道库',
    group: '速查与检测',
    html: `<p><b>n ≤ 4 的全部 30 条轨道</b>速查：1s–4s、2p/3p/4p 各三向、3d / 4d 各五向、4f 七向。点按钮切换 3D 等值面，下方给出每条轨道的<span class="hl">节面数、节面位置与最概然半径 r*</span>（D(r) 峰值处，电子最常出现的地方）。</p>
<p>试着横向对比：同为 p，3pz 与 2pz 的 r* 差多少？为什么 4f 的云这么「散」？</p>`,
    enter() {
      resetWorld();
      st.section = 6;
      st.view = { cloud: false, surface: true, phase: true, axes: true, slice: false };
      showOnly({ lib: true });
      buildHud([['orb', '当前轨道'], ['nodes', '节面（角/径）'], ['rstar', '最概然半径']]);
      drawLadder();
      libSelect(0);
      updateHudOrb();
      ctl.clear();
      ctl.toggle({ label: '相位着色', value: st.phase, onChange: (v) => setPhaseMode(v) });
      ctl.toggle({ label: '显示节面', value: st.showNodes, onChange: (v) => { st.showNodes = v; buildNodes(currentK(), st.scale); } });
      ctl.toggle({ label: '自动旋转', value: st.spin, onChange: (v) => { st.spin = v; } });
      ctl.button({ label: '⌂ 复位视角', onClick: () => frameOrbital() });
      syncChips();
    },
  },
  {
    title: '随堂检测',
    group: '速查与检测',
    html: '<p>5 道选择题，检验电子云、节面与排布规则的掌握情况。</p>',
    enter() {
      resetWorld();
      st.section = 7;
      showOnly({});
      clearOrbital();
      const p = CAM_PRESETS.dom;
      const dir = new THREE.Vector3(...p.dir).normalize().multiplyScalar(p.dist);
      app.setCamera([dir.x, dir.y, dir.z], [0, 0, p.tz]);
      lcData.innerHTML = '';
      currentHud = null;
      ctl.clear();
      syncChips();
      showQuiz();
    },
  },
];

/* ================= 布局驱动（三栏 / 折叠 / 专注 / 手风琴 / 快捷键） ================= */

const orbShell = document.getElementById('orbShell');
const chapNav = document.getElementById('chapNav');
const chapCount = document.getElementById('chapCount');
const detailNo = document.getElementById('detailNo');
const detailTitle = document.getElementById('detailTitle');
const lessonEl = document.getElementById('lesson');
const detailBody = document.getElementById('detailBody');
const controlsEl = document.getElementById('controls');
let chapterIdx = 0;

/* 左栏章节列表：编组行 + 章节按钮 */
const chapBtns = [];
{
  let gi = 0;
  while (gi < SECTIONS.length) {
    const sec = SECTIONS[gi];
    const gh = document.createElement('div');
    gh.className = 'chap-group';
    gh.textContent = sec.group;
    chapNav.appendChild(gh);
    while (gi < SECTIONS.length && SECTIONS[gi].group === sec.group) {
      const i = gi;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'chap-btn';
      b.dataset.idx = String(i);
      const n = document.createElement('span');
      n.className = 'chap-n';
      n.textContent = String(i + 1).padStart(2, '0');
      const tt = document.createElement('span');
      tt.className = 'chap-t';
      tt.textContent = SECTIONS[i].title;
      b.append(n, tt);
      b.addEventListener('click', () => selectChapter(i));
      chapNav.appendChild(b);
      chapBtns.push(b);
      gi++;
    }
  }
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
  chapCount.textContent = String(chapterIdx + 1).padStart(2, '0') + '/' + String(SECTIONS.length).padStart(2, '0');
  detailNo.textContent = String(chapterIdx + 1).padStart(2, '0');
  detailTitle.textContent = sec.title;
  railNoL.textContent = String(chapterIdx + 1).padStart(2, '0');
  railTitleR.textContent = sec.title;
  lessonEl.innerHTML = sec.html || '';
  history.replaceState(null, '', '#' + (chapterIdx + 1));
  if (st.quizPanel) { st.quizPanel.remove(); st.quizPanel = null; }
  if (activeCleanup) { activeCleanup(); activeCleanup = null; }
  sec.enter();
  accSecs.controls.classList.toggle('acc-empty', !controlsEl.children.length);
  accSecs.data.classList.toggle('acc-empty', !currentHud || !document.querySelector('#lcData .hud-card'));
  detailBody.scrollTop = 0;
}

/* 栏折叠 × 专注模式 */
const foldLBtn = document.getElementById('foldLBtn');
const unfoldLBtn = document.getElementById('unfoldLBtn');
const foldRBtn = document.getElementById('foldRBtn');
const unfoldRBtn = document.getElementById('unfoldRBtn');
const railNoL = document.getElementById('railNoL');
const railTitleR = document.getElementById('railTitleR');
const focusBtn = document.getElementById('focusBtn');
const FOLD_KEY = { l: 'orbital.foldL', r: 'orbital.foldR' };
let foldL = false;
let foldR = false;
let focusSaved = null;
try {
  foldL = localStorage.getItem(FOLD_KEY.l) === '1';
  foldR = localStorage.getItem(FOLD_KEY.r) === '1';
} catch (e) { /* localStorage 不可用时仅会话内生效 */ }
function applyShellFold() {
  orbShell.classList.toggle('fold-l', foldL);
  orbShell.classList.toggle('fold-r', foldR);
  for (const [btn, folded] of [[foldLBtn, foldL], [unfoldLBtn, foldL], [foldRBtn, foldR], [unfoldRBtn, foldR]]) {
    btn.setAttribute('aria-expanded', String(!folded));
  }
}
function setFocus(on) {
  if (on && focusSaved === null) {
    focusSaved = [foldL, foldR];
    foldL = true;
    foldR = true;
  } else if (!on && focusSaved !== null) {
    [foldL, foldR] = focusSaved;
    focusSaved = null;
  }
  orbShell.classList.toggle('focus-mode', on);
  focusBtn.textContent = on ? '退出专注' : '专注模式';
  focusBtn.setAttribute('aria-pressed', String(on));
  applyShellFold();
}
function toggleFold(side) {
  if (focusSaved !== null) setFocus(false);
  if (side === 'l') foldL = !foldL;
  else foldR = !foldR;
  try { localStorage.setItem(FOLD_KEY[side], (side === 'l' ? foldL : foldR) ? '1' : '0'); } catch (e) { /* 忽略 */ }
  applyShellFold();
}
foldLBtn.addEventListener('click', () => toggleFold('l'));
unfoldLBtn.addEventListener('click', () => toggleFold('l'));
foldRBtn.addEventListener('click', () => toggleFold('r'));
unfoldRBtn.addEventListener('click', () => toggleFold('r'));
focusBtn.addEventListener('click', () => setFocus(focusSaved === null));
applyShellFold();

/* 右栏三块手风琴（详解 / 控件 / 读数），localStorage 记忆、切章不重置 */
const ACC_KEYS = { lesson: 'orbital.accLesson', controls: 'orbital.accControls', data: 'orbital.accData' };
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
  const sec2 = accSecs[name];
  sec2.classList.toggle('closed', accClosed[name]);
  sec2.querySelector('.acc-head').setAttribute('aria-expanded', String(!accClosed[name]));
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

/* 舞台工具：坐标轴 / 视角 / 全屏 + 键盘 ←→ R F Space ] */
const chapPrev = document.getElementById('chapPrev');
const chapNext = document.getElementById('chapNext');
const axesBtn = document.getElementById('axesBtn');
const viewBtn = document.getElementById('viewBtn');
const fsBtn = document.getElementById('fsBtn');

function gotoChapter(i) { selectChapter((i + SECTIONS.length) % SECTIONS.length); }
chapPrev.addEventListener('click', () => gotoChapter(chapterIdx - 1));
chapNext.addEventListener('click', () => gotoChapter(chapterIdx + 1));

function applyAxes() {
  if (axesGroup) axesGroup.visible = axesOn && st.view.axes && st.section !== 7;
  axesBtn.classList.toggle('on', axesOn);
  axesBtn.setAttribute('aria-pressed', String(axesOn));
}
axesBtn.addEventListener('click', () => {
  axesOn = !axesOn;
  try { localStorage.setItem(AXIS_LEN_KEY, axesOn ? '1' : '0'); } catch (e) { /* 忽略 */ }
  applyAxes();
});
viewBtn.addEventListener('click', () => {
  frameOrbital();
  toast('视角已复位。', 'ok');
});
fsBtn.addEventListener('click', () => {
  if (document.fullscreenElement) document.exitFullscreen();
  else document.documentElement.requestFullscreen?.().catch(() => toast('浏览器拒绝了全屏请求。', 'ok'));
});
window.addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const t = e.target;
  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
  if (e.key === 'ArrowLeft') gotoChapter(chapterIdx - 1);
  else if (e.key === 'ArrowRight') gotoChapter(chapterIdx + 1);
  else if (e.key === ']') toggleFold('r');
  else if (e.key === 'r' || e.key === 'R') { frameOrbital(); toast('视角已复位（R）。', 'ok'); }
  else if (e.key === 'f' || e.key === 'F') fsBtn.click();
  else if (e.key === ' ') {
    e.preventDefault();
    if (st.section === 0) { st.playing = !st.playing; syncChips(); }
    else if (st.section === 3 && st.edu.count < 36) { st.edu.count++; drawEdu(); currentHud && currentHud.set('fill', st.edu.count + ' / 36'); }
  }
});

/* 提示条 */
function toast(text, kind = 'ok') {
  const old = stage.querySelector('.orb-toast');
  if (old) old.remove();
  const el = document.createElement('div');
  el.className = 'orb-toast ' + kind;
  el.textContent = text;
  stage.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 300);
  }, 2400);
}

/* ================= 帧循环 ================= */

let labReady = false;
let lastBufH = 0;

app.onFrame((dt) => {
  if (!labReady) return;
  if (st.spin && orbGroup) {
    orbGroup.rotation.z += dt * 0.45;
    syncShellOrient();
  }
  // 点云尺寸随画布分辨率刷新（pixelRatio / 高度变化时）
  const bufH = app.renderer.domElement.height;
  if (bufH !== lastBufH) { lastBufH = bufH; refreshCloudScale(); }

  // 曝光动画（速率随已记录数放缓，模拟「越记越慢」的采样感）；非曝光态补一次计数兜底
  if (cloudObj && st.section === 0) {
    if (st.exposeT0 > 0) {
      const el = performance.now() * 0.001 - st.exposeT0;
      if (st.playing) {
        st.reveal = Math.min(st.cloudN, (st.reveal || 0) + dt * (300 + (st.reveal || 0) * 0.6));
      }
      const k = Math.min(el / 4, 1);
      const shown = st.playing ? Math.round(st.reveal || 0) : Math.round(k * st.cloudN);
      cloudObj.geometry.setDrawRange(0, shown);
      if (currentHud) currentHud.set('cnt', shown.toLocaleString() + ' 点');
      if (k >= 1 && !st.playing) st.exposeT0 = -10;
    } else if (st.cntStale) {
      cloudObj.geometry.setDrawRange(0, st.cloudN);
      if (currentHud) currentHud.set('cnt', st.cloudN.toLocaleString() + ' 点');
      st.cntStale = false;
    }
  }

  // 能级自动填充
  if (st.edu.playing && st.section === 3) {
    st.edu.acc += dt * st.edu.speed;
    let dirty = false;
    while (st.edu.acc >= 1 && st.edu.count < 36) { st.edu.count++; st.edu.acc -= 1; dirty = true; }
    if (dirty) { drawEdu(); currentHud && currentHud.set('fill', st.edu.count + ' / 36'); }
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

/* ================= 启动 ================= */

let booted = false;
function boot() {
  labReady = true;
  loader.hide();
  window.__eduSections = { select: selectChapter };
  window.__orbDebug = {
    vfx, app, st,
    stats: () => vfx.stats(),
    chips: () => chipsEl,
    valence: () => valenceClouds.length,
  };
  const h = parseInt(location.hash.slice(1), 10);
  const start = Number.isFinite(h) && h >= 1 && h <= SECTIONS.length ? h - 1 : 0;
  selectChapter(start);
  booted = true;
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
