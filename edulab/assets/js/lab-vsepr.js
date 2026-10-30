/* EduLab · 分子构型（vsepr · MoleCraft）
 * 章节：价层电子对互斥 / 电子对构型与分子构型 / 键角比较 / 杂化轨道 / 分子极性 /
 *       扩展八隅体 / 手性分子 / 分子库 / 随堂检测
 * 渲染：球棍模型（CPK 配色）+ 圆柱键（双/三键平行偏移）+ 孤对泪滴（LatheGeometry）+
 *       偶极箭头（圆锥+圆柱）+ 文字精灵标注；VSEPR 几何引擎（5 种电子对构型方向向量常量表）。
 * 数据：键长/键角/偶极矩取教科书常见参考值（CRC Handbook / 《结构化学基础》常用数据，自拟整理）。
 */
import {
  THREE, TAU, DEG, clamp,
  loadTexture, loadHDR, loadAll, createApp, cameraTweenTick, makeLoader,
  createSections, createControlsPanel, makeHUD, makeTextSprite, setSpriteText,
} from './edu-core.js';

/* ================= 元素数据（CPK 配色 / 显示半径 / 电负性） ================= */

const EL = {
  H:  { c: 0xf2f5f9, r: 0.28, n: '氢', en: 2.20 },
  Be: { c: 0xc9a227, r: 0.44, n: '铍', en: 1.57 },
  B:  { c: 0xffc0cb, r: 0.42, n: '硼', en: 2.04 },
  C:  { c: 0x4a4f57, r: 0.42, n: '碳', en: 2.55 },
  N:  { c: 0x3050c8, r: 0.40, n: '氮', en: 3.04 },
  O:  { c: 0xd43a3a, r: 0.40, n: '氧', en: 3.44 },
  F:  { c: 0x4fae5a, r: 0.36, n: '氟', en: 3.98 },
  P:  { c: 0xff8000, r: 0.48, n: '磷', en: 2.19 },
  S:  { c: 0xe3c832, r: 0.48, n: '硫', en: 2.58 },
  Cl: { c: 0x2fbf71, r: 0.46, n: '氯', en: 3.16 },
  Br: { c: 0x8f2b2b, r: 0.52, n: '溴', en: 2.96 },
  I:  { c: 0x7d3fa8, r: 0.56, n: '碘', en: 2.66 },
  Xe: { c: 0x6c6fc9, r: 0.55, n: '氙', en: 2.60 },
};

/* ================= VSEPR 几何引擎 ================= */

// 电子对构型单位方向向量（顺序即孤对优先占位顺序：三角双锥赤道优先、八面体对位优先）
const GEOM = {
  2: { name: '直线', dirs: [[1, 0, 0], [-1, 0, 0]] },
  3: { name: '平面三角形', dirs: [[1, 0, 0], [-0.5, 0, 0.866], [-0.5, 0, -0.866]] },
  4: { name: '正四面体', dirs: [[1, 1, 1], [-1, -1, 1], [-1, 1, -1], [1, -1, -1]] },
  5: { name: '三角双锥', dirs: [[1, 0, 0], [-0.5, 0, 0.866], [-0.5, 0, -0.866], [0, 1, 0], [0, -1, 0]] },
  6: { name: '正八面体', dirs: [[0, -1, 0], [0, 1, 0], [1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1]] },
};

// AXnEm → 电子对构型 / 分子构型 / 键角 / 杂化 / 实例
const VSEPR = {
  '2-0': { eg: '直线', mg: '直线形', ang: '180°', hyb: 'sp', ex: 'CO₂、BeCl₂' },
  '3-0': { eg: '平面三角形', mg: '平面三角形', ang: '120°', hyb: 'sp²', ex: 'BF₃、SO₃' },
  '2-1': { eg: '平面三角形', mg: 'V形（角形）', ang: '＜120°（SO₂ 119°、O₃ 117°）', hyb: 'sp²', ex: 'SO₂、O₃' },
  '4-0': { eg: '正四面体', mg: '正四面体形', ang: '109°28′', hyb: 'sp³', ex: 'CH₄、CCl₄' },
  '3-1': { eg: '正四面体', mg: '三角锥形', ang: '＜109°28′（NH₃ 107°）', hyb: 'sp³', ex: 'NH₃、PH₃' },
  '2-2': { eg: '正四面体', mg: 'V形（角形）', ang: '＜109°28′（H₂O 104.5°）', hyb: 'sp³', ex: 'H₂O、H₂S' },
  '5-0': { eg: '三角双锥', mg: '三角双锥', ang: '90° / 120°', hyb: 'sp³d', ex: 'PCl₅' },
  '4-1': { eg: '三角双锥', mg: '跷跷板形（seesaw）', ang: '＜90°、＜120°、＜180°', hyb: 'sp³d', ex: 'SF₄' },
  '3-2': { eg: '三角双锥', mg: 'T形', ang: '≈87.5°（略＜90°）', hyb: 'sp³d', ex: 'ClF₃' },
  '2-3': { eg: '三角双锥', mg: '直线形', ang: '180°', hyb: 'sp³d', ex: 'XeF₂' },
  '6-0': { eg: '正八面体', mg: '正八面体形', ang: '90°', hyb: 'sp³d²', ex: 'SF₆' },
  '5-1': { eg: '正八面体', mg: '四方锥形', ang: '≈85°（略＜90°）', hyb: 'sp³d²', ex: 'BrF₅' },
  '4-2': { eg: '正八面体', mg: '平面正方形', ang: '90°', hyb: 'sp³d²', ex: 'XeF₄' },
};
const VSEPR_ORDER = ['2-0', '3-0', '2-1', '4-0', '3-1', '2-2', '5-0', '4-1', '3-2', '2-3', '6-0', '5-1', '4-2'];

/* ================= 向量小工具 ================= */

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const nd = (a) => new THREE.Vector3(a[0], a[1], a[2]).normalize();
const cp = (a, b) => new THREE.Vector3().crossVectors(a, b);
function aroundDirs(center, ref, ang, len, phis) {
  // 绕 ref 方向成 ang 角、方位角 phis 均布的子代位置（四面体链式搭建用）
  const a = ref.clone().normalize();
  const c = Math.cos(ang * DEG), s = Math.sin(ang * DEG);
  const up = Math.abs(a.y) < 0.9 ? V(0, 1, 0) : V(1, 0, 0);
  const u = cp(a, up).normalize(), w = cp(a, u).normalize();
  return phis.map((p) => {
    const r = p * DEG;
    return center.clone().addScaledVector(a, c * len)
      .addScaledVector(u, Math.cos(r) * s * len).addScaledVector(w, Math.sin(r) * s * len);
  });
}
// 三角锥（AX3E）：孤对 +y，三个键成 beta 角的锥面
function pyrDirs(beta) {
  const ca = -Math.sqrt((2 * Math.cos(beta * DEG) + 1) / 3);
  const sa = Math.sqrt(1 - ca * ca);
  const bond = [0, 1, 2].map((i) => V(sa * Math.cos(i * TAU / 3), ca, sa * Math.sin(i * TAU / 3)));
  return { bond, lp: [V(0, 1, 0)] };
}
// V 形（AX2E / AX2E2）：两键在 xy 面向上张 beta 角，孤对在下方
function bentDirs(beta, nlp) {
  const h = beta * DEG / 2;
  const bond = [V(Math.sin(h), Math.cos(h), 0), V(-Math.sin(h), Math.cos(h), 0)];
  const lp = nlp === 1 ? [V(0, -1, 0)] : [V(0.766, -0.643, 0), V(-0.766, -0.643, 0)];
  return { bond, lp };
}

/* ================= 分子库（坐标单位 Å，键长取参考值） ================= */

const MOLS = {};
const MOL_LIST = [];
function reg(def, cat) { def.cat = cat; MOLS[def.f] = def; MOL_LIST.push(def); }

function mol(f, name, centerEl, ligEl, dirs, len, lpDirs, info, opts = {}) {
  const atoms = [{ e: centerEl, p: V(0, 0, 0) }];
  const bonds = [];
  const idx = opts.bondIdx || dirs.map((_, i) => i);
  idx.forEach((di, k) => {
    const L = Array.isArray(len) ? len[k] : len;
    const dv = Array.isArray(dirs[di]) ? nd(dirs[di]) : dirs[di].clone().normalize();
    atoms.push({ e: ligEl, p: dv.multiplyScalar(L) });
    bonds.push({ a: 0, b: atoms.length - 1, o: opts.orders ? opts.orders[k] : 1 });
  });
  const lp = (lpDirs || []).map((d) => ({ i: 0, dir: d.clone().normalize() }));
  return Object.assign({ f, name, atoms, bonds, lp, info }, opts);
}

const SUBS = '₀₁₂₃₄₅₆₇₈₉';
const fmtF = (f) => f.replace('^2-', '²⁻').replace('^-', '⁻').replace(/(\d)/g, (d) => SUBS[+d]);

{ // ---- 直线形 ----
  reg(mol('HCl', '氯化氢', 'Cl', 'H', [[-1, 0, 0]], 1.27, null,
    { axe: '—（双原子）', eg: '直线', mg: '直线形', ang: '—', hyb: '不涉及', polar: '极性', bond: 'H–Cl 127 pm', mu: '1.08 D' }), '直线形');
  reg(mol('CO2', '二氧化碳', 'C', 'O', [[1, 0, 0], [-1, 0, 0]], 1.16, null,
    { axe: 'AX2', eg: '直线', mg: '直线形', ang: '180°', hyb: 'sp', polar: '非极性', bond: 'C=O 116 pm', mu: '0', note: '键偶极大小相等方向相反，恰好抵消' }, { orders: [2, 2] }), '直线形');
  reg(mol('XeF2', '二氟化氙', 'Xe', 'F', GEOM[5].dirs.map(nd), [1.98, 1.98],
    [nd([1, 0, 0]), nd([-0.5, 0, 0.866]), nd([-0.5, 0, -0.866])],
    { axe: 'AX2E3', eg: '三角双锥', mg: '直线形', ang: '180°', hyb: 'sp³d', polar: '非极性', bond: 'Xe–F 198 pm', mu: '0', note: '3 对孤对占赤道位，两 F 在轴向' }, { bondIdx: [3, 4] }), '直线形');
  { // HCN
    const atoms = [{ e: 'C', p: V(0, 0, 0) }, { e: 'N', p: V(1.16, 0, 0) }, { e: 'H', p: V(-1.06, 0, 0) }];
    reg({ f: 'HCN', name: '氰化氢', atoms, bonds: [{ a: 0, b: 1, o: 3 }, { a: 0, b: 2, o: 1 }],
      info: { axe: 'AX2（碳）', eg: '直线', mg: '直线形', ang: '180°', hyb: 'sp', polar: '极性', bond: 'C≡N 116 pm · C–H 106 pm', mu: '2.98 D' } }, '直线形');
  }
  { // C2H2 乙炔
    const atoms = [{ e: 'C', p: V(-0.6, 0, 0) }, { e: 'C', p: V(0.6, 0, 0) }, { e: 'H', p: V(-1.66, 0, 0) }, { e: 'H', p: V(1.66, 0, 0) }];
    reg({ f: 'C2H2', name: '乙炔', atoms, bonds: [{ a: 0, b: 1, o: 3 }, { a: 0, b: 2, o: 1 }, { a: 1, b: 3, o: 1 }],
      info: { axe: '两碳均为 AX2', eg: '直线', mg: '直线形', ang: '180°', hyb: 'sp（两碳）', polar: '非极性', bond: 'C≡C 120 pm · C–H 106 pm', mu: '0' } }, '直线形');
  }
}
{ // ---- 平面构型 ----
  reg(mol('BF3', '三氟化硼', 'B', 'F', GEOM[3].dirs.map(nd), 1.31, null,
    { axe: 'AX3', eg: '平面三角形', mg: '平面三角形', ang: '120°', hyb: 'sp²', polar: '非极性', bond: 'B–F 131 pm', mu: '0', note: 'B 是缺电子中心（6 电子）' }), '平面构型');
  reg(mol('BCl3', '三氯化硼', 'B', 'Cl', GEOM[3].dirs.map(nd), 1.74, null,
    { axe: 'AX3', eg: '平面三角形', mg: '平面三角形', ang: '120°', hyb: 'sp²', polar: '非极性', bond: 'B–Cl 174 pm', mu: '0' }), '平面构型');
  reg(mol('SO3', '三氧化硫', 'S', 'O', GEOM[3].dirs.map(nd), 1.42, null,
    { axe: 'AX3', eg: '平面三角形', mg: '平面三角形', ang: '120°', hyb: 'sp²', polar: '非极性', bond: 'S–O 142 pm', mu: '0', note: 'π 键离域，S–O 键完全等价；图中按双键画法' }, { orders: [2, 2, 2] }), '平面构型');
  { // CH2O 甲醛
    const atoms = [{ e: 'C', p: V(0, 0, 0) }, { e: 'O', p: V(1.21, 0, 0) },
      { e: 'H', p: V(-0.58, 0.935, 0) }, { e: 'H', p: V(-0.58, -0.935, 0) }];
    reg({ f: 'CH2O', name: '甲醛', atoms, bonds: [{ a: 0, b: 1, o: 2 }, { a: 0, b: 2, o: 1 }, { a: 0, b: 3, o: 1 }],
      info: { axe: 'AX3', eg: '平面三角形', mg: '平面三角形', ang: 'H–C–H 116.5°（略偏离 120°）', hyb: 'sp²', polar: '极性', bond: 'C=O 121 pm · C–H 110 pm', mu: '2.33 D' } }, '平面构型');
  }
  { // C2H4 乙烯
    const atoms = [{ e: 'C', p: V(-0.67, 0, 0) }, { e: 'C', p: V(0.67, 0, 0) },
      { e: 'H', p: V(-1.215, 0.944, 0) }, { e: 'H', p: V(-1.215, -0.944, 0) },
      { e: 'H', p: V(1.215, 0.944, 0) }, { e: 'H', p: V(1.215, -0.944, 0) }];
    reg({ f: 'C2H4', name: '乙烯', atoms, bonds: [{ a: 0, b: 1, o: 2 }, { a: 0, b: 2, o: 1 }, { a: 0, b: 3, o: 1 }, { a: 1, b: 4, o: 1 }, { a: 1, b: 5, o: 1 }],
      info: { axe: '两碳均为 AX3', eg: '平面三角形', mg: '平面形（全部 6 原子共面）', ang: '≈121° / ≈118°', hyb: 'sp²（两碳）', polar: '非极性', bond: 'C=C 134 pm · C–H 108 pm', mu: '0' } }, '平面构型');
  }
  reg(mol('CO3^2-', '碳酸根离子', 'C', 'O', GEOM[3].dirs.map(nd), 1.28, null,
    { axe: 'AX3', eg: '平面三角形', mg: '平面三角形', ang: '120°', hyb: 'sp²', polar: '非极性（对称离子）', bond: 'C–O 128 pm（共振平均，键级 1⅓）', mu: '0', note: '三个 C–O 键完全等价；图中为一种 Kekulé 画法' }, { orders: [2, 1, 1] }), '平面构型');
  reg(mol('NO3^-', '硝酸根离子', 'N', 'O', GEOM[3].dirs.map(nd), 1.24, null,
    { axe: 'AX3', eg: '平面三角形', mg: '平面三角形', ang: '120°', hyb: 'sp²', polar: '非极性（对称离子）', bond: 'N–O 124 pm（共振平均）', mu: '0', note: 'π 键离域，三个 N–O 键等价' }, { orders: [2, 1, 1] }), '平面构型');
}
{ // ---- 四面体家族 ----
  reg(mol('CH4', '甲烷', 'C', 'H', GEOM[4].dirs.map(nd), 1.09, null,
    { axe: 'AX4', eg: '正四面体', mg: '正四面体形', ang: '109°28′', hyb: 'sp³', polar: '非极性', bond: 'C–H 109 pm', mu: '0' }), '四面体家族');
  reg(mol('CCl4', '四氯化碳', 'C', 'Cl', GEOM[4].dirs.map(nd), 1.77, null,
    { axe: 'AX4', eg: '正四面体', mg: '正四面体形', ang: '109°28′', hyb: 'sp³', polar: '非极性', bond: 'C–Cl 177 pm', mu: '0' }), '四面体家族');
  reg(mol('CHCl3', '氯仿（三氯甲烷）', 'C', 'Cl', GEOM[4].dirs.map(nd), [1.07, 1.77, 1.77, 1.77], null,
    { axe: 'AX4', eg: '正四面体', mg: '正四面体形', ang: '≈109.5°（取代基不同略有畸变）', hyb: 'sp³', polar: '极性', bond: 'C–H 107 pm · C–Cl 178 pm', mu: '1.04 D', note: '键偶极不能抵消 → 极性分子' }), '四面体家族');
  reg(mol('NH4+', '铵根离子', 'N', 'H', GEOM[4].dirs.map(nd), 1.02, null,
    { axe: 'AX4', eg: '正四面体', mg: '正四面体形', ang: '109°28′', hyb: 'sp³', polar: '非极性（对称离子）', bond: 'N–H 103 pm', mu: '0', note: 'N 无孤对，与 CH4 等电子等构型' }), '四面体家族');
  { const d = pyrDirs(107);
    reg(mol('NH3', '氨', 'N', 'H', d.bond, 1.01, d.lp,
      { axe: 'AX3E', eg: '正四面体', mg: '三角锥形', ang: '107°（106.7°）', hyb: 'sp³', polar: '极性', bond: 'N–H 102 pm', mu: '1.47 D', note: '1 对孤对把三个 H 压成三角锥' }), '四面体家族'); }
  { const d = pyrDirs(93.5);
    reg(mol('PH3', '磷化氢', 'P', 'H', d.bond, 1.42, d.lp,
      { axe: 'AX3E', eg: '正四面体', mg: '三角锥形', ang: '93.5°', hyb: 'sp³（近纯 p³）', polar: '极性', bond: 'P–H 142 pm', mu: '0.58 D', note: 'P 的 3s 孤对惰性强，键角接近 90°' }), '四面体家族'); }
  { const d = pyrDirs(113);
    reg(mol('H3O+', '水合氢离子', 'O', 'H', d.bond, 0.98, d.lp,
      { axe: 'AX3E', eg: '正四面体', mg: '三角锥形', ang: '≈113°', hyb: 'sp³', polar: '极性', bond: 'O–H 98 pm', mu: '—', note: 'O 带正电荷，键角比水大' }), '四面体家族'); }
  { const d = bentDirs(104.5, 2);
    reg(mol('H2O', '水', 'O', 'H', d.bond, 0.96, d.lp,
      { axe: 'AX2E2', eg: '正四面体', mg: 'V形（角形）', ang: '104.5°', hyb: 'sp³', polar: '极性', bond: 'O–H 96 pm', mu: '1.85 D', note: '2 对孤对进一步压缩键角' }), '四面体家族'); }
  { const d = bentDirs(92.1, 2);
    reg(mol('H2S', '硫化氢', 'S', 'H', d.bond, 1.34, d.lp,
      { axe: 'AX2E2', eg: '正四面体', mg: 'V形（角形）', ang: '92.1°', hyb: 'sp³（近纯 p³）', polar: '极性', bond: 'S–H 134 pm', mu: '0.97 D', note: 'S 电负性小，杂化倾向弱，键角接近 90°' }), '四面体家族'); }
  { const d = bentDirs(119, 1);
    reg(mol('SO2', '二氧化硫', 'S', 'O', d.bond, 1.43, d.lp,
      { axe: 'AX2E', eg: '平面三角形', mg: 'V形（角形）', ang: '119°', hyb: 'sp²', polar: '极性', bond: 'S=O 143 pm', mu: '1.63 D', note: '1 对孤对 + 离域 π 键；图中按双键画法' }, { orders: [2, 2] }), '四面体家族'); }
  { const d = bentDirs(117, 1);
    reg(mol('O3', '臭氧', 'O', 'O', d.bond, 1.28, d.lp,
      { axe: 'AX2E', eg: '平面三角形', mg: 'V形（角形）', ang: '116.8°', hyb: 'sp²', polar: '极性（弱）', bond: 'O–O 128 pm（键级 1.5，两键等长）', mu: '0.53 D', note: '中心 O 带正电、端 O 带负电 → 微极性；图为一种共振画法' }, { orders: [2, 1] }), '四面体家族'); }
}
{ // ---- 三角双锥家族 ----
  const D5 = GEOM[5].dirs.map(nd);
  reg(mol('PCl5', '五氯化磷', 'P', 'Cl', D5, [2.04, 2.04, 2.04, 2.19, 2.19], null,
    { axe: 'AX5', eg: '三角双锥', mg: '三角双锥', ang: '90°（轴-赤道）/ 120°（赤道间）', hyb: 'sp³d', polar: '非极性', bond: 'P–Cl(赤道) 204 pm · P–Cl(轴) 219 pm', mu: '0', note: '轴向键比赤道键长（受 3 个 90° 斥力）' }), '三角双锥家族');
  { // SF4 跷跷板：1 孤对占赤道位
    const dirs = [V(Math.cos(129.2 * DEG), 0, Math.sin(129.2 * DEG)), V(Math.cos(129.2 * DEG), 0, -Math.sin(129.2 * DEG)),
      V(-Math.sin(3.3 * DEG), Math.cos(3.3 * DEG), 0), V(-Math.sin(3.3 * DEG), -Math.cos(3.3 * DEG), 0)];
    reg(mol('SF4', '四氟化硫', 'S', 'F', dirs, [1.55, 1.55, 1.65, 1.65], [V(1, 0, 0)],
      { axe: 'AX4E', eg: '三角双锥', mg: '跷跷板形（seesaw）', ang: '赤道间 101.6° · 轴-赤道 ≈173°', hyb: 'sp³d', polar: '极性', bond: 'S–F(赤道) 154 pm · S–F(轴) 165 pm', mu: '0.63 D', note: '孤对优先占赤道位（只受 2 个 90° 斥力）' }), '三角双锥家族'); }
  { // ClF3 T 形：2 孤对占赤道位
    const dirs = [V(-0.5, 0, -0.866), V(-Math.sin(2.5 * DEG), Math.cos(2.5 * DEG), 0), V(-Math.sin(2.5 * DEG), -Math.cos(2.5 * DEG), 0)];
    reg(mol('ClF3', '三氟化氯', 'Cl', 'F', dirs, 1.70, [V(1, 0, 0), V(-0.5, 0, 0.866)],
      { axe: 'AX3E2', eg: '三角双锥', mg: 'T形', ang: '≈87.5°（轴向键被孤对压离 180°）', hyb: 'sp³d', polar: '极性', bond: 'Cl–F 170 pm', mu: '0.6 D', note: '3 对电子中 2 对孤对占赤道位' }), '三角双锥家族'); }
}
{ // ---- 八面体家族 ----
  reg(mol('SF6', '六氟化硫', 'S', 'F', GEOM[6].dirs.map(nd), 1.56, null,
    { axe: 'AX6', eg: '正八面体', mg: '正八面体形', ang: '90°', hyb: 'sp³d²', polar: '非极性', bond: 'S–F 156 pm', mu: '0', note: '第三周期起可容纳 12 电子（扩展八隅体）' }), '八面体家族');
  reg(mol('XeF4', '四氟化氙', 'Xe', 'F', GEOM[6].dirs.map(nd), 1.95, [nd(GEOM[6].dirs[0]), nd(GEOM[6].dirs[1])],
    { axe: 'AX4E2', eg: '正八面体', mg: '平面正方形', ang: '90°', hyb: 'sp³d²', polar: '非极性', bond: 'Xe–F 195 pm', mu: '0', note: '2 对孤对占对位（反位），4 个 F 共平面' }, { bondIdx: [2, 3, 4, 5] }), '八面体家族');
}
{ // ---- 有机多中心 ----
  { // C2H6 乙烷（交错构象）
    const C1 = V(-0.765, 0, 0), C2 = V(0.765, 0, 0);
    const atoms = [{ e: 'C', p: C1 }, { e: 'C', p: C2 }];
    const bonds = [{ a: 0, b: 1, o: 1 }];
    aroundDirs(C1, V(1, 0, 0), 109.47, 1.09, [90, 210, 330]).forEach((p) => { atoms.push({ e: 'H', p }); bonds.push({ a: 0, b: atoms.length - 1, o: 1 }); });
    aroundDirs(C2, V(-1, 0, 0), 109.47, 1.09, [270, 30, 150]).forEach((p) => { atoms.push({ e: 'H', p }); bonds.push({ a: 1, b: atoms.length - 1, o: 1 }); });
    reg({ f: 'C2H6', name: '乙烷', atoms, bonds,
      info: { axe: '两碳均为 AX4', eg: '正四面体', mg: '两个四面体共边连接', ang: '≈109.5°（可自由内旋）', hyb: 'sp³（两碳）', polar: '非极性', bond: 'C–C 154 pm · C–H 109 pm', mu: '0' } }, '有机多中心'); }
  { // C2H5OH 乙醇
    const eC2 = V(0, 0, 0), eO = V(1.43, 0, 0), eC1 = V(-0.513, 1.452, 0);
    const atoms = [{ e: 'C', p: eC1 }, { e: 'C', p: eC2 }, { e: 'O', p: eO }, { e: 'H', p: V(1.733, 0.911, 0) }];
    const bonds = [{ a: 0, b: 1, o: 1 }, { a: 1, b: 2, o: 1 }, { a: 2, b: 3, o: 1 }];
    aroundDirs(eC1, eC2.clone().sub(eC1), 109.47, 1.09, [90, 210, 330]).forEach((p) => { atoms.push({ e: 'H', p }); bonds.push({ a: 0, b: atoms.length - 1, o: 1 }); });
    [1, -1].forEach((s) => { atoms.push({ e: 'H', p: V(-0.333, -0.4715, 0.8165 * s).multiplyScalar(1.09) }); bonds.push({ a: 1, b: atoms.length - 1, o: 1 }); });
    reg({ f: 'C2H5OH', name: '乙醇', atoms, bonds,
      info: { axe: '两个 sp³ 碳 + sp³ 氧', eg: '正四面体', mg: '链状（C–O–H 折线）', ang: '≈109.5°（C–O–H ≈108.5°）', hyb: 'sp³（C、O 均）', polar: '极性', bond: 'C–O 143 pm · O–H 96 pm', mu: '1.69 D' } }, '有机多中心'); }
  { // CH3COOH 乙酸
    const aC = V(0, 0, 0), aO1 = V(1.21, 0, 0), aO2 = V(-0.68, 1.178, 0), aCm = V(-0.75, -1.299, 0);
    const atoms = [{ e: 'C', p: aC }, { e: 'O', p: aO1 }, { e: 'O', p: aO2 }, { e: 'H', p: V(-1.621, 0.943, 0) }, { e: 'C', p: aCm }];
    const bonds = [{ a: 0, b: 1, o: 2 }, { a: 0, b: 2, o: 1 }, { a: 2, b: 3, o: 1 }, { a: 0, b: 4, o: 1 }];
    aroundDirs(aCm, aC.clone().sub(aCm), 109.47, 1.09, [90, 210, 330]).forEach((p) => { atoms.push({ e: 'H', p }); bonds.push({ a: 4, b: atoms.length - 1, o: 1 }); });
    reg({ f: 'CH3COOH', name: '乙酸', atoms, bonds,
      info: { axe: '羧基碳 AX3（sp²）· 甲基碳 AX4（sp³）', eg: '羧基平面 + 甲基四面体', mg: '羧基 5 原子共面', ang: '≈120°（羧基）/ ≈109.5°（甲基）', hyb: 'sp² + sp³', polar: '极性', bond: 'C=O 121 pm · C–OH 136 pm', mu: '1.74 D' } }, '有机多中心'); }
}
// 杂化章示例分子（不入库）：BeCl2
const BECL2 = mol('BeCl2', '氯化铍', 'Be', 'Cl', [[1, 0, 0], [-1, 0, 0]], 1.70, null,
  { axe: 'AX2', eg: '直线', mg: '直线形', ang: '180°', hyb: 'sp', polar: '非极性', bond: 'Be–Cl 170 pm' });

/* ================= 专属样式（不改共享 CSS） ================= */

const style = document.createElement('style');
style.textContent = `
.lab-controls:empty { display: none; }
.axe-table { position: absolute; left: 14px; top: 84px; z-index: 15;
  width: 420px; max-width: calc(100% - 28px); max-height: calc(100% - 170px);
  overflow: auto; display: none; background: var(--card);
  border: 1px solid var(--card-border); border-radius: 14px; box-shadow: var(--shadow); }
.axe-table table { width: 100%; border-collapse: collapse; font-size: 11.5px; }
.axe-table caption { font-size: 12.5px; font-weight: 700; padding: 9px 12px 4px; text-align: left; color: var(--text); }
.axe-table th { position: sticky; top: 0; background: var(--card); color: var(--text-dim);
  font-weight: 600; text-align: left; padding: 5px 8px; border-bottom: 1px solid var(--card-border); }
.axe-table td { padding: 5px 8px; border-bottom: 1px solid color-mix(in srgb, var(--card-border) 55%, transparent); color: var(--text); }
.axe-table tr[data-k] { cursor: pointer; }
.axe-table tbody tr:hover { background: color-mix(in srgb, var(--accent) 12%, transparent); }
.axe-table tr.cur { background: color-mix(in srgb, var(--accent) 18%, transparent); }
.lib-card { position: absolute; left: 14px; top: 84px; z-index: 15;
  width: 330px; max-width: calc(100% - 28px); max-height: calc(100% - 170px);
  overflow: auto; display: none; background: var(--card);
  border: 1px solid var(--card-border); border-radius: 14px; box-shadow: var(--shadow); padding: 10px 12px 12px; }
.lib-card h4 { margin: 8px 0 6px; font-size: 11.5px; color: var(--text-dim); font-weight: 600; letter-spacing: .06em; }
.lib-grid { display: flex; flex-wrap: wrap; gap: 6px; }
.lib-btn { border: 1px solid var(--card-border); background: var(--chip-bg); color: var(--text);
  border-radius: 9px; padding: 5px 10px; font-size: 12.5px; font-weight: 600; cursor: pointer; }
.lib-btn:hover { border-color: var(--accent); }
.lib-btn.active { background: var(--accent); color: #fff; border-color: var(--accent); }
.vspr-info { position: absolute; top: 84px; right: 14px; z-index: 14; width: 300px; max-width: calc(100% - 28px);
  border-radius: 14px; overflow: hidden; border: 1px solid var(--card-border); box-shadow: var(--shadow);
  background: var(--card); display: none; }
.vspr-info-head { display: flex; align-items: baseline; gap: 8px; padding: 10px 12px; color: #fff;
  background: linear-gradient(120deg, #3f6ea8, #2c4f7e); }
.vspr-info-head .fm { font-size: 20px; font-weight: 800; }
.vspr-info-head .nm { font-size: 12px; opacity: .92; }
.vspr-info-x { margin-left: auto; background: rgba(255,255,255,.2); border: none; color: #fff;
  width: 22px; height: 22px; border-radius: 50%; cursor: pointer; font-size: 11px; flex: none; align-self: center; }
.vspr-info-body { padding: 8px 12px 11px; font-size: 12.5px; line-height: 1.7; color: var(--text); }
.vspr-info-body .r { display: flex; gap: 8px; }
.vspr-info-body .r span { color: var(--text-dim); flex: none; width: 78px; }
.vspr-info-body .r b { font-weight: 600; }
.vspr-note { margin-top: 6px; font-size: 11.5px; color: var(--text-dim); border-top: 1px dashed var(--card-border); padding-top: 6px; }
@media (max-width: 640px) {
  .axe-table, .lib-card { top: 64px; max-height: calc(100% - 150px); }
  .vspr-info { top: 64px; right: 10px; width: min(260px, calc(100% - 84px)); }
}
`;
document.head.appendChild(style);

/* ================= 场景 ================= */

const stage = document.getElementById('stage');
const loader = makeLoader(stage, '正在准备分子实验…');

const app = createApp({
  container: stage,
  fov: 45, near: 0.05, far: 500,
  cameraPos: [0, 3.2, 8], target: [0, 0, 0],
  minDistance: 1.2, maxDistance: 60,
  exposure: 1.02,
  keepBackground: true,
});
const { scene } = app;

scene.add(new THREE.AmbientLight(0xd8dee6, 0.85));
const keyLight = new THREE.DirectionalLight(0xffffff, 1.5);
keyLight.position.set(5, 9, 7);
scene.add(keyLight);
const fillLight = new THREE.DirectionalLight(0x91a3c0, 0.5);
fillLight.position.set(-7, 4, -5);
scene.add(fillLight);

const molRoot = new THREE.Group();
scene.add(molRoot);

/* ================= 几何/材质工厂（共享） ================= */

const atomGeo = new THREE.SphereGeometry(0.5, 28, 20);
const cylGeo = new THREE.CylinderGeometry(1, 1, 1, 14);
const atomMats = {};
function atomMat(e) {
  if (!atomMats[e]) atomMats[e] = new THREE.MeshStandardMaterial({ color: EL[e].c, roughness: 0.38, metalness: 0.06 });
  return atomMats[e];
}
const bondMat = new THREE.MeshStandardMaterial({ color: 0x9aa3ad, roughness: 0.45, metalness: 0.15 });
const lpGeo = new THREE.LatheGeometry(
  [[0.001, 0], [0.30, 0.06], [0.34, 0.28], [0.26, 0.55], [0.10, 0.74], [0.001, 0.82]].map((p) => new THREE.Vector2(p[0], p[1])), 24);
const lpMat = new THREE.MeshStandardMaterial({
  color: 0xffb347, transparent: true, opacity: 0.42, roughness: 0.4, metalness: 0,
  side: THREE.DoubleSide, depthWrite: false, emissive: 0xffb347, emissiveIntensity: 0.18,
});

function orientY(mesh, dir) { mesh.quaternion.setFromUnitVectors(V(0, 1, 0), dir.clone().normalize()); }

function addBond(g, pa, pb, order) {
  const dir = pb.clone().sub(pa);
  const len = dir.length();
  dir.normalize();
  const up = Math.abs(dir.y) < 0.95 ? V(0, 1, 0) : V(1, 0, 0);
  const perp = cp(dir, up).normalize();
  const offs = order === 2 ? [-0.115, 0.115] : order === 3 ? [0, -0.155, 0.155] : [0];
  offs.forEach((off) => {
    const m = new THREE.Mesh(cylGeo, bondMat);
    m.scale.set(0.055, len, 0.055);
    m.position.copy(pa).add(pb).multiplyScalar(0.5).addScaledVector(perp, off);
    orientY(m, dir);
    g.add(m);
  });
}

function addLonePair(g, pos, dir, rAtom) {
  const m = new THREE.Mesh(lpGeo, lpMat);
  orientY(m, dir);
  m.position.copy(pos).addScaledVector(dir, rAtom * 0.85);
  g.add(m);
  return m;
}

function addLabel(g, text, pos, color, scale) {
  const sp = makeTextSprite(text, { fontSize: 46, color: color || '#ffffff', scale: scale || 0.008 });
  sp.position.copy(pos);
  g.add(sp);
  return sp;
}

function addArrow(g, from, to, color, r = 0.042) {
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.1, emissive: color, emissiveIntensity: 0.25 });
  const dir = to.clone().sub(from);
  const len = dir.length();
  if (len < 0.18) return;
  dir.normalize();
  const headLen = Math.min(0.24, len * 0.4);
  const shaftLen = len - headLen;
  const shaft = new THREE.Mesh(cylGeo, mat);
  shaft.scale.set(r, shaftLen, r);
  shaft.position.copy(from).addScaledVector(dir, shaftLen / 2);
  orientY(shaft, dir);
  const head = new THREE.Mesh(new THREE.ConeGeometry(r * 2.6, headLen, 16), mat);
  head.position.copy(from).addScaledVector(dir, shaftLen + headLen / 2);
  orientY(head, dir);
  g.add(shaft, head);
}

/* ================= 分子搭建 ================= */

function buildMol(def, o = {}) {
  const g = new THREE.Group();
  const meshes = [];
  def.atoms.forEach((a, i) => {
    const m = new THREE.Mesh(atomGeo, atomMat(a.e));
    m.position.copy(a.p);
    m.scale.setScalar(EL[a.e].r / 0.5);
    m.userData.atom = i;
    g.add(m);
    meshes.push(m);
    if (o.labels) {
      const out = a.p.clone().sub(o.labelFrom || V(0, 0, 0));
      if (out.lengthSq() < 1e-6) out.set(0, 1, 0);
      out.normalize().multiplyScalar(EL[a.e].r + 0.26);
      addLabel(g, a.e, a.p.clone().add(out), '#f4f7fb', 0.0075);
    }
  });
  def.bonds.forEach((b) => addBond(g, def.atoms[b.a].p, def.atoms[b.b].p, b.o));
  if (o.lp !== false && def.lp) {
    def.lp.forEach((d) => addLonePair(g, def.atoms[d.i].p, d.dir, EL[def.atoms[d.i].e].r));
  }
  return { g, meshes };
}

function disposeObj(root) {
  root.traverse((o) => {
    if (o.geometry && o.geometry !== atomGeo && o.geometry !== cylGeo && o.geometry !== lpGeo) o.geometry.dispose();
    if (o.material) {
      (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => {
        if (m !== bondMat && m !== lpMat && !Object.values(atomMats).includes(m)) {
          if (m.map) m.map.dispose();
          m.dispose();
        }
      });
    }
  });
}
function clearMol() {
  while (molRoot.children.length) {
    const c = molRoot.children[0];
    molRoot.remove(c);
    disposeObj(c);
  }
}

function fitView(def, extra = 0) {
  const box = new THREE.Box3();
  def.atoms.forEach((a) => box.expandByPoint(a.p));
  def.lp && def.lp.forEach((d) => box.expandByPoint(def.atoms[d.i].p.clone().addScaledVector(d.dir, 1.1)));
  const c = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3()).length();
  const dist = clamp(size * 1.55 + 2.2 + extra, 3.4, 40);
  app.setCamera([dist * 0.32, dist * 0.42, dist * 0.85], [c.x, c.y, c.z]);
}

/* ================= 帧循环 / 补间 ================= */

const tweens = [];
function addTween(dur, fn, done) { tweens.push({ t: 0, dur, fn, done }); }
const ease = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);

let labReady = false;
const st = {
  axN: 4, axM: 0,          // 沙盒/构型章：成键数、孤对数
  kRatio: 1,               // 键角章：孤对斥力倍率
  angleKey: 'NH3',
  hybKey: 'sp3',
  polarKey: 'H2O',
  octKey: 'SF6',
  chirKey: 'chiral',
  libKey: 'H2O',
  align: null,             // 手性章动画状态
};

app.onFrame((dt) => {
  if (!labReady) return;
  cameraTweenTick(app, dt);
  for (let i = tweens.length - 1; i >= 0; i--) {
    const tw = tweens[i];
    tw.t += dt;
    const k = Math.min(tw.t / tw.dur, 1);
    tw.fn(k);
    if (k >= 1) { tweens.splice(i, 1); if (tw.done) tw.done(); }
  }
  tickAlign(dt);
});

/* ================= HUD ================= */

const hudWrap = document.createElement('div');
hudWrap.className = 'lab-hud';
stage.appendChild(hudWrap);
let hud = null;
function buildHud(rows) {
  hudWrap.innerHTML = '';
  hud = makeHUD(hudWrap, rows);
  hud.el.style.display = '';
  return hud;
}

const ctl = createControlsPanel(document.getElementById('controls'));
let activeSectionCleanup = null;

/* ================= 章节一：价层电子对互斥（气球沙盒） ================= */

function balloon(dir, color, isLP) {
  const m = new THREE.Mesh(atomGeo, new THREE.MeshStandardMaterial({
    color, roughness: 0.42, metalness: 0.05, transparent: true, opacity: isLP ? 0.95 : 0.9,
  }));
  m.scale.set(isLP ? 0.42 : 0.36, isLP ? 0.78 : 0.62, isLP ? 0.42 : 0.36);
  orientY(m, dir);
  m.position.copy(dir).multiplyScalar(1.02);
  return m;
}

function buildSandbox(n, m, showLP, showLines) {
  clearMol();
  const g = new THREE.Group();
  const total = n + m;
  const geo = GEOM[total];
  const dirs = geo.dirs.map(nd);
  const lpSet = new Set(Array.from({ length: m }, (_, i) => i));
  dirs.forEach((d, i) => {
    g.add(balloon(d, lpSet.has(i) ? 0xffa03a : 0x5f9bd6, lpSet.has(i)));
    const tag = lpSet.has(i) ? '孤对' : '成键';
    const sp = makeTextSprite(tag, { fontSize: 34, color: lpSet.has(i) ? '#ffcf8a' : '#bcd6f2', scale: 0.007 });
    sp.position.copy(d).multiplyScalar(1.95);
    g.add(sp);
  });
  if (showLines) {
    const pts = []; const cols = [];
    const C = { 0: new THREE.Color(0x5f9bd6), 1: new THREE.Color(0xe59b3c), 2: new THREE.Color(0xe05a4b) };
    for (let i = 0; i < total; i++) {
      for (let j = i + 1; j < total; j++) {
        pts.push(dirs[i].clone().multiplyScalar(0.75), dirs[j].clone().multiplyScalar(0.75));
        const t = (lpSet.has(i) ? 1 : 0) + (lpSet.has(j) ? 1 : 0);
        cols.push(C[t], C[t]);
      }
    }
    const geoL = new THREE.BufferGeometry();
    geoL.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    geoL.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    g.add(new THREE.LineSegments(geoL, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.55 })));
  }
  molRoot.add(g);
  const v = VSEPR[`${n}-${m}`];
  hud.set('total', `${total} 对（成键 ${n} + 孤对 ${m}）`);
  hud.set('eg', geo.name);
  hud.set('mg', v ? v.mg : '—');
  const posNote = total === 5 ? '孤对优先占赤道位' : total === 6 ? '孤对互成对位（180°）' : '—';
  hud.set('pos', posNote);
}

function sandEnter() {
  clearMol();
  app.setCamera([3.2, 3.4, 7.6], [0, 0, 0]);
  buildHud([['total', '价层电子对'], ['eg', '电子对构型'], ['mg', '分子构型'], ['pos', '孤对占位']]);
  ctl.clear();
  ctl.slider({
    label: '成键电子对 n', min: 2, max: 6, step: 1, value: st.axN,
    fmt: (v) => String(v), onInput: (v) => { st.axN = v; clampM(); rebuild(); },
  });
  const mCtl = ctl.slider({
    label: '孤对电子对 m', min: 0, max: 4, step: 1, value: st.axM,
    fmt: (v) => String(v), onInput: (v) => { st.axM = v; rebuild(); },
  });
  let showLP = true, showLines = false;
  ctl.toggle({ label: '显示孤对（橙）', value: true, onChange: (v) => { showLP = v; rebuild(); } });
  ctl.toggle({ label: '显示斥力连线', value: false, onChange: (v) => { showLines = v; rebuild(); } });
  function clampM() {
    const mx = Math.min(4, 6 - st.axN);
    if (st.axM > mx) { st.axM = mx; mCtl.set(mx); }
  }
  function rebuild() {
    clampM();
    buildSandbox(st.axN, st.axM, showLP, showLines);
  }
  rebuild();
}
/* ================= 章节二：电子对构型与分子构型 ================= */

let axeTableEl = null;

function buildAXEModel(n, m, showLP, labels) {
  clearMol();
  const g = new THREE.Group();
  const total = n + m;
  const geo = GEOM[total];
  const dirs = geo.dirs.map(nd);
  const lpSet = new Set(Array.from({ length: m }, (_, i) => i));
  // 中心原子
  const cm = new THREE.Mesh(atomGeo, atomMat('S'));
  cm.scale.setScalar(0.86);
  g.add(cm);
  dirs.forEach((d, i) => {
    if (!lpSet.has(i)) {
      const a = new THREE.Mesh(atomGeo, new THREE.MeshStandardMaterial({ color: 0x8fb6d9, roughness: 0.42 }));
      a.scale.setScalar(0.78);
      a.position.copy(d).multiplyScalar(1.85);
      g.add(a);
      if (labels) addLabel(g, `X${i - Array.from(lpSet).filter((q) => q < i).length + 1}`, d.clone().multiplyScalar(2.5), '#cfe2f5', 0.007);
    } else if (showLP) {
      addLonePair(g, V(0, 0, 0), d, 0.5);
    }
  });
  const v = VSEPR[`${n}-${m}`];
  const title = makeTextSprite(showLP ? `电子对构型：${geo.name}` : `电子对构型（${geo.name}，孤对不可见）`, { fontSize: 40, color: '#e8eef5', scale: 0.009 });
  title.position.set(0, 3.1, 0);
  g.add(title);
  const badge = makeTextSprite(`分子构型：${v.mg}`, { fontSize: 44, color: '#ffc86b', scale: 0.010 });
  badge.position.set(0, -2.9, 0);
  g.add(badge);
  molRoot.add(g);
  hud.set('axe', `AX${n}E${m}`);
  hud.set('eg', geo.name);
  hud.set('mg', v.mg);
  if (axeTableEl) {
    axeTableEl.querySelectorAll('tbody tr').forEach((tr) => tr.classList.toggle('cur', tr.dataset.k === `${n}-${m}`));
  }
}

function ensureAxeTable(onPick) {
  if (axeTableEl) { axeTableEl.style.display = ''; return; }
  axeTableEl = document.createElement('div');
  axeTableEl.className = 'axe-table';
  const rows = VSEPR_ORDER.map((k) => {
    const v = VSEPR[k];
    return `<tr data-k="${k}"><td><b>AX${k.split('-')[0]}E${k.split('-')[1]}</b></td><td>${v.eg}</td><td>${v.mg}</td><td>${v.ang}</td><td>${v.hyb}</td><td>${v.ex}</td></tr>`;
  }).join('');
  axeTableEl.innerHTML = `<table><caption>AXnEm 对照表（点击行在左侧 3D 查看）</caption>
    <thead><tr><th>类型</th><th>电子对构型</th><th>分子构型</th><th>键角</th><th>杂化</th><th>实例</th></tr></thead><tbody>${rows}</tbody></table>`;
  axeTableEl.querySelectorAll('tbody tr').forEach((tr) => {
    tr.addEventListener('click', () => {
      const [n, m] = tr.dataset.k.split('-').map(Number);
      onPick(n, m);
    });
  });
  stage.appendChild(axeTableEl);
  axeTableEl.style.display = '';
}

function axeEnter() {
  clearMol();
  app.setCamera([3.4, 3.2, 8.2], [0, 0, 0]);
  buildHud([['axe', 'AXE 类'], ['eg', '电子对构型'], ['mg', '分子构型']]);
  ctl.clear();
  const nCtl = ctl.slider({
    label: '成键原子数 n', min: 2, max: 6, step: 1, value: st.axN,
    fmt: (v) => String(v), onInput: (v) => { st.axN = v; clampM(); rebuild(); },
  });
  const mCtl = ctl.slider({
    label: '孤对数 m', min: 0, max: 4, step: 1, value: st.axM,
    fmt: (v) => String(v), onInput: (v) => { st.axM = v; rebuild(); },
  });
  let showLP = true, labels = true;
  ctl.toggle({ label: '隐藏孤对电子', value: false, onChange: (v) => { showLP = !v; rebuild(); } });
  ctl.toggle({ label: '原子标签', value: true, onChange: (v) => { labels = v; rebuild(); } });
  ctl.toggle({
    label: 'AXnEm 对照表', value: false,
    onChange: (v) => { if (v) ensureAxeTable(pick); else if (axeTableEl) axeTableEl.style.display = 'none'; },
  });
  ctl.button({ label: '⌂ 复位视角', onClick: () => app.setCamera([3.4, 3.2, 8.2], [0, 0, 0]) });
  function clampM() {
    const mx = Math.min(4, 6 - st.axN);
    if (st.axM > mx) { st.axM = mx; mCtl.set(mx); }
  }
  function pick(n, m) { st.axN = n; st.axM = m; nCtl.set(n); mCtl.set(m); rebuild(); }
  function rebuild() { clampM(); buildAXEModel(st.axN, st.axM, showLP, labels); }
  rebuild();
}

/* ================= 章节三：键角比较 ================= */

// 模型：键角 = 109.47° − 基础压缩(孤对贡献) − (k−1)×压缩系数
function angleModel(key, k) {
  if (key === 'CH4') return { beta: 109.47, m: 0 };
  if (key === 'NH3') return { beta: 109.47 - (2.5 + (k - 1) * 20), m: 1 };
  return { beta: 109.47 - (5.0 + (k - 1) * 26), m: 2 };
}

function arcBetween(d1, d2, r, color) {
  const a = d1.clone().normalize(), b = d2.clone().normalize();
  const pts = [];
  for (let i = 0; i <= 32; i++) {
    const q = a.clone().lerp(b, i / 32).normalize();
    pts.push(q.multiplyScalar(r));
  }
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  return new THREE.Line(geo, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.95 }));
}

function buildAngle(key, k, showArc, showLP) {
  clearMol();
  const g = new THREE.Group();
  const { beta, m } = angleModel(key, k);
  const elC = key === 'CH4' ? 'C' : key === 'NH3' ? 'N' : 'O';
  let bondDirs, lpDirs;
  if (m === 0) bondDirs = GEOM[4].dirs.map(nd);
  else if (m === 1) { const d = pyrDirs(beta); bondDirs = d.bond; lpDirs = d.lp; }
  else { const d = bentDirs(beta, 2); bondDirs = d.bond; lpDirs = d.lp; }
  const def = mol(key, { CH4: '甲烷', NH3: '氨', H2O: '水' }[key], elC, 'H', bondDirs, key === 'CH4' ? 1.09 : key === 'NH3' ? 1.01 : 0.96, lpDirs, {});
  const { g: mg } = buildMol(def, { labels: false, lp: showLP });
  g.add(mg);
  const shown = beta >= 109.4 ? '109°28′' : `${beta.toFixed(1)}°`;
  if (showArc) {
    g.add(arcBetween(bondDirs[0], bondDirs[1], 0.8, 0xffc86b));
    const bis = bondDirs[0].clone().add(bondDirs[1]).normalize();
    const sp = makeTextSprite(shown, { fontSize: 46, color: '#ffd68b', scale: 0.011 });
    sp.position.copy(bis).multiplyScalar(1.15);
    g.add(sp);
  }
  const title = makeTextSprite(`${key}  H–${elC === 'C' ? 'C' : elC}–H = ${shown}`, { fontSize: 42, color: '#e8eef5', scale: 0.010 });
  title.position.set(0, 2.6, 0);
  g.add(title);
  molRoot.add(g);
  hud.set('mol', `${key}（${{ CH4: '甲烷', NH3: '氨', H2O: '水' }[key]}，${m} 对孤对）`);
  hud.set('ang', shown);
  hud.set('why', m === 0 ? '无孤对 → 理想四面体角' : `孤对斥力把键角从 109.5° 压到 ${shown}`);
}

function angleEnter() {
  clearMol();
  app.setCamera([2.6, 2.6, 6.4], [0, 0, 0]);
  buildHud([['mol', '分子'], ['ang', '键角'], ['why', '成因']]);
  ctl.clear();
  ctl.seg({
    options: [{ label: 'CH₄', value: 'CH4' }, { label: 'NH₃', value: 'NH3' }, { label: 'H₂O', value: 'H2O' }],
    value: st.angleKey,
    onChange: (v) => { st.angleKey = v; rebuild(); },
  });
  ctl.slider({
    label: '孤对斥力倍率 k', min: 1, max: 1.6, step: 0.05, value: st.kRatio,
    fmt: (v) => v.toFixed(2) + '×', onInput: (v) => { st.kRatio = v; rebuild(); },
  });
  ctl.toggle({ label: '键角标注', value: true, onChange: (v) => { showArc = v; rebuild(); } });
  ctl.toggle({ label: '显示孤对', value: true, onChange: (v) => { showLP = v; rebuild(); } });
  let showArc = true, showLP = true;
  function rebuild() { buildAngle(st.angleKey, st.kRatio, showArc, showLP); }
  rebuild();
}

/* ================= 章节四：杂化轨道 ================= */

const HYB = {
  sp:    { n: 2, name: 'sp 杂化', parts: '1 个 s + 1 个 p → 2 个 sp', geo: '直线', ang: '180°', ex: 'BeCl₂、CO₂、C₂H₂', pCount: 2 },
  sp2:   { n: 3, name: 'sp² 杂化', parts: '1 个 s + 2 个 p → 3 个 sp²', geo: '平面三角形', ang: '120°', ex: 'BF₃、C₂H₄、CH₂O', pCount: 1 },
  sp3:   { n: 4, name: 'sp³ 杂化', parts: '1 个 s + 3 个 p → 4 个 sp³', geo: '正四面体', ang: '109°28′', ex: 'CH₄、NH₃、H₂O', pCount: 0 },
  sp3d:  { n: 5, name: 'sp³d 杂化', parts: '1 个 s + 3 个 p + 1 个 d → 5 个 sp³d', geo: '三角双锥', ang: '90° / 120°', ex: 'PCl₅、SF₄', pCount: 0 },
  sp3d2: { n: 6, name: 'sp³d² 杂化', parts: '1 个 s + 3 个 p + 2 个 d → 6 个 sp³d²', geo: '正八面体', ang: '90°', ex: 'SF₆、XeF₄', pCount: 0 },
};
const lobeGeo = new THREE.LatheGeometry(
  [[0.001, 0], [0.10, 0.18], [0.185, 0.45], [0.16, 0.72], [0.075, 0.92], [0.001, 1.05]].map((p) => new THREE.Vector2(p[0], p[1])), 26);
const lobeMat = new THREE.MeshStandardMaterial({
  color: 0x7cc7ff, transparent: true, opacity: 0.4, roughness: 0.35, metalness: 0,
  side: THREE.DoubleSide, depthWrite: false, emissive: 0x7cc7ff, emissiveIntensity: 0.3,
});
const lobeMatP = new THREE.MeshStandardMaterial({
  color: 0xc09aff, transparent: true, opacity: 0.36, roughness: 0.35, metalness: 0,
  side: THREE.DoubleSide, depthWrite: false, emissive: 0xc09aff, emissiveIntensity: 0.28,
});

function makeHybrid(dir, mat) {
  const grp = new THREE.Group();
  const big = new THREE.Mesh(lobeGeo, mat);
  orientY(big, dir);
  grp.add(big);
  const small = new THREE.Mesh(lobeGeo, mat);
  small.scale.setScalar(0.34);
  orientY(small, dir.clone().negate());
  grp.add(small);
  return grp;
}
function makePOrbital(dir) {
  const grp = new THREE.Group();
  [1, -1].forEach((s) => {
    const l = new THREE.Mesh(lobeGeo, lobeMatP);
    l.scale.set(0.8, 0.8, 0.8);
    orientY(l, dir.clone().multiplyScalar(s));
    grp.add(l);
  });
  return grp;
}

function buildHyb(key, showEx, showP) {
  clearMol();
  const g = new THREE.Group();
  const h = HYB[key];
  const dirs = GEOM[h.n].dirs.map(nd);
  const lobes = [];
  dirs.forEach((d) => { const l = makeHybrid(d, lobeMat); g.add(l); lobes.push(l); });
  if (showP) {
    if (key === 'sp') { g.add(makePOrbital(V(0, 1, 0)), makePOrbital(V(0, 0, 1))); }
    if (key === 'sp2') { g.add(makePOrbital(V(0, 1, 0))); }
  }
  // 中心原子（小球）
  const core = new THREE.Mesh(atomGeo, atomMat('C'));
  core.scale.setScalar(0.5);
  g.add(core);
  if (showEx) {
    const exDef = { sp: BECL2, sp2: MOLS.BF3, sp3: MOLS.CH4, sp3d: MOLS.PCl5, sp3d2: MOLS.SF6 }[key];
    const { g: mg } = buildMol(exDef, { labels: false, lp: false });
    mg.scale.setScalar(1.0);
    g.add(mg);
  }
  const title = makeTextSprite(`${h.name} → ${h.geo}（${h.ang}）`, { fontSize: 42, color: '#bfe0ff', scale: 0.010 });
  title.position.set(0, 3.2, 0);
  g.add(title);
  molRoot.add(g);
  // 切换动画：杂化瓣从中心长出（错峰）
  lobes.forEach((l, i) => {
    l.scale.setScalar(0.001);
    addTween(0.001 + i * 0.09, (k) => l.scale.setScalar(0.001), () => {
      addTween(0.45, (kk) => l.scale.setScalar(Math.max(ease(kk), 0.001)));
    });
  });
  hud.set('hyb', h.name);
  hud.set('parts', h.parts);
  hud.set('geo', `${h.geo}（${h.ang}）`);
  hud.set('ex', h.ex);
}

function hybEnter() {
  clearMol();
  app.setCamera([3.0, 3.0, 7.4], [0, 0, 0]);
  buildHud([['hyb', '杂化类型'], ['parts', '参与轨道'], ['geo', '空间构型'], ['ex', '典型分子']]);
  ctl.clear();
  ctl.seg({
    options: [
      { label: 'sp', value: 'sp' }, { label: 'sp²', value: 'sp2' }, { label: 'sp³', value: 'sp3' },
      { label: 'sp³d', value: 'sp3d' }, { label: 'sp³d²', value: 'sp3d2' },
    ],
    value: st.hybKey,
    onChange: (v) => { st.hybKey = v; rebuild(); },
  });
  let showEx = true, showP = true;
  ctl.toggle({ label: '叠加示例分子', value: true, onChange: (v) => { showEx = v; rebuild(); } });
  ctl.toggle({ label: '未杂化 p 轨道', value: true, onChange: (v) => { showP = v; rebuild(); } });
  ctl.button({ label: '▶ 重播长出动画', onClick: () => rebuild() });
  ctl.button({ label: '⌂ 复位视角', onClick: () => app.setCamera([3.0, 3.0, 7.4], [0, 0, 0]) });
  function rebuild() { buildHyb(st.hybKey, showEx, showP); }
  rebuild();
}

/* ================= 章节五：分子极性 ================= */

function bondDipoleVectors(def) {
  // 每根键的偶极：方向由电负性差决定（指向 δ− 端），大小 ∝ |Δen|
  const vecs = [];
  def.bonds.forEach((b) => {
    const A = def.atoms[b.a], B = def.atoms[b.b];
    const ea = EL[A.e].en, eb = EL[B.e].en;
    if (ea === eb) return;
    const from = ea < eb ? A : B;
    const to = ea < eb ? B : A;
    const d = to.p.clone().sub(from.p);
    vecs.push({ from: from.p.clone(), to: to.p.clone(), d, w: Math.abs(ea - eb), pe: from.e, ne: to.e });
  });
  return vecs;
}

function buildPolar(key, showBond, showNet) {
  clearMol();
  const g = new THREE.Group();
  const def = MOLS[key];
  const { g: mg } = buildMol(def, { labels: true });
  g.add(mg);
  const vecs = bondDipoleVectors(def);
  if (showBond) {
    vecs.forEach((v) => {
      const dir = v.d.clone().normalize();
      const segA = v.from.clone().addScaledVector(dir, EL[v.pe].r + 0.12);
      const segB = v.to.clone().addScaledVector(dir, -(EL[v.ne].r + 0.12));
      const segLen = segB.distanceTo(segA);
      const L = clamp(segLen * (0.45 + v.w * 0.35), 0.5, segLen);
      const mid = segA.clone().add(segB).multiplyScalar(0.5);
      const f = mid.clone().addScaledVector(dir, -L / 2);
      const t = mid.clone().addScaledVector(dir, L / 2);
      addArrow(g, f, t, 0xe05a4b, 0.036);
      const dPlus = makeTextSprite('δ＋', { fontSize: 34, color: '#ffb0a0', scale: 0.0065 });
      dPlus.position.copy(v.from).addScaledVector(dir, -(EL[v.pe].r + 0.34));
      const dMinus = makeTextSprite('δ−', { fontSize: 34, color: '#a0d8ff', scale: 0.0065 });
      dMinus.position.copy(v.to).addScaledVector(dir, EL[v.ne].r + 0.34);
      g.add(dPlus, dMinus);
    });
  }
  const net = V(0, 0, 0);
  vecs.forEach((v) => net.addScaledVector(v.d.clone().normalize(), v.w));
  const netAbs = net.length();
  if (showNet && netAbs > 0.05) {
    const dir = net.clone().normalize();
    const L = 1.5 + Math.min(netAbs, 2.4) * 0.45;
    const center = V(0, 0, 0);
    addArrow(g, center.clone().addScaledVector(dir, 0.15), center.clone().addScaledVector(dir, L), 0x4f8fe0, 0.055);
    const sp = makeTextSprite('μ 净偶极', { fontSize: 36, color: '#a8ccf5', scale: 0.008 });
    sp.position.copy(center).addScaledVector(dir, L + 0.45);
    g.add(sp);
  }
  const polar = def.info.mu === '0' || def.info.polar.startsWith('非极性');
  const title = makeTextSprite(`${def.f}：${polar ? '非极性（偶极抵消）' : '极性（合偶极 ≠ 0）'}`, { fontSize: 42, color: polar ? '#bfe8c8' : '#ffd0a8', scale: 0.010 });
  title.position.set(0, 3.0, 0);
  g.add(title);
  molRoot.add(g);
  hud.set('mol', `${def.f}（${def.name}）`);
  hud.set('net', netAbs > 0.05 ? `≈ ${netAbs.toFixed(2)}（模型值）` : '0（抵消）');
  hud.set('mu', def.info.mu || '—');
  hud.set('concl', polar ? '非极性分子' : '极性分子');
}

function polarEnter() {
  clearMol();
  app.setCamera([2.8, 2.6, 6.8], [0, 0, 0]);
  buildHud([['mol', '分子'], ['net', '净偶极（模型）'], ['mu', '实验参考 μ'], ['concl', '结论']]);
  ctl.clear();
  ctl.seg({
    options: [
      { label: 'CO₂', value: 'CO2' }, { label: 'H₂O', value: 'H2O' },
      { label: 'CH₄', value: 'CH4' }, { label: 'CHCl₃', value: 'CHCl3' },
      { label: 'BF₃', value: 'BF3' }, { label: 'NH₃', value: 'NH3' },
    ],
    value: st.polarKey,
    onChange: (v) => { st.polarKey = v; rebuild(); },
  });
  ctl.toggle({ label: '键偶极（δ＋→δ−）', value: true, onChange: (v) => { showBond = v; rebuild(); } });
  ctl.toggle({ label: '总偶极箭头', value: true, onChange: (v) => { showNet = v; rebuild(); } });
  ctl.button({ label: '⌂ 复位视角', onClick: () => app.setCamera([2.8, 2.6, 6.8], [0, 0, 0]) });
  let showBond = true, showNet = true;
  function rebuild() { buildPolar(st.polarKey, showBond, showNet); }
  rebuild();
}
/* ================= 章节六：扩展八隅体 ================= */

const OCT = ['PCl5', 'SF6', 'XeF2', 'XeF4', 'ClF3'];
const OCT_NOTE = {
  PCl5: 'P 价电子 5 → 5 对成键电子（10 电子）；第三周期起可用 d 轨道容纳超过 8 电子',
  SF6: 'S 价电子 6 → 6 对成键电子（12 电子），正八面体骨架',
  XeF2: 'Xe 价电子 8 = 2 成键 + 3 孤对（10 电子）；3 孤对占赤道位 → 直线形',
  XeF4: 'Xe 价电子 8 = 4 成键 + 2 孤对（12 电子）；孤对占对位 → 平面正方形',
  ClF3: 'Cl 价电子 7 = 3 成键 + 2 孤对（10 电子）；2 孤对占赤道位 → T 形',
};

function buildOct(key, showLP, labels) {
  clearMol();
  const def = MOLS[key];
  const { g } = buildMol(def, { labels, lp: showLP });
  molRoot.add(g);
  fitView(def, 1.5);
  hud.set('mol', `${def.f}（${def.name}）`);
  hud.set('axe', `${def.info.axe} · ${def.info.mg}`);
  hud.set('lp', def.lp && def.lp.length ? `${def.lp.length} 对孤对（${key === 'XeF4' ? '反位·轴向' : '赤道位'}）` : '无孤对');
  hud.set('note', OCT_NOTE[key]);
}

function octEnter() {
  clearMol();
  buildHud([['mol', '分子'], ['axe', 'AXE·构型'], ['lp', '孤对'], ['note', '要点']]);
  ctl.clear();
  ctl.seg({
    options: [
      { label: 'PCl₅', value: 'PCl5' }, { label: 'SF₆', value: 'SF6' }, { label: 'XeF₂', value: 'XeF2' },
      { label: 'XeF₄', value: 'XeF4' }, { label: 'ClF₃', value: 'ClF3' },
    ],
    value: st.octKey,
    onChange: (v) => { st.octKey = v; rebuild(); },
  });
  let showLP = true, labels = true;
  ctl.toggle({ label: '显示孤对', value: true, onChange: (v) => { showLP = v; rebuild(); } });
  ctl.toggle({ label: '原子标签', value: true, onChange: (v) => { labels = v; rebuild(); } });
  ctl.button({ label: '↻ 下一个分子', onClick: () => { st.octKey = OCT[(OCT.indexOf(st.octKey) + 1) % OCT.length]; rebuild(); } });
  ctl.button({ label: '⌂ 复位视角', onClick: () => fitView(MOLS[st.octKey], 1.5) });
  function rebuild() { buildOct(st.octKey, showLP, labels); }
  rebuild();
}

/* ================= 章节七：手性分子 ================= */

function chirDef(kind) {
  if (kind === 'chiral') {
    const d4 = GEOM[4].dirs.map(nd);
    return {
      f: 'CHFClBr', name: '一氟一氯一溴甲烷',
      atoms: [
        { e: 'C', p: V(0, 0, 0) },
        { e: 'H', p: d4[0].clone().multiplyScalar(1.09) },
        { e: 'F', p: d4[1].clone().multiplyScalar(1.35) },
        { e: 'Cl', p: d4[2].clone().multiplyScalar(1.77) },
        { e: 'Br', p: d4[3].clone().multiplyScalar(1.94) },
      ],
      bonds: [{ a: 0, b: 1, o: 1 }, { a: 0, b: 2, o: 1 }, { a: 0, b: 3, o: 1 }, { a: 0, b: 4, o: 1 }],
      lp: null,
    };
  }
  // 非手性对照：CH2FCl（两个 H 相同 → 有对称面）
  return {
    f: 'CH2FCl', name: '一氟一氯甲烷',
    atoms: [
      { e: 'C', p: V(0, 0, 0) },
      { e: 'F', p: V(0.8165, 0, -0.5774).multiplyScalar(1.35) },
      { e: 'Cl', p: V(-0.8165, 0, -0.5774).multiplyScalar(1.77) },
      { e: 'H', p: V(0, 0.8165, 0.5774).multiplyScalar(1.09) },
      { e: 'H', p: V(0, -0.8165, 0.5774).multiplyScalar(1.09) },
    ],
    bonds: [{ a: 0, b: 1, o: 1 }, { a: 0, b: 2, o: 1 }, { a: 0, b: 3, o: 1 }, { a: 0, b: 4, o: 1 }],
    lp: null,
  };
}

function mirrorOf(def) {
  return {
    f: def.f, name: def.name,
    atoms: def.atoms.map((a) => ({ e: a.e, p: V(-a.p.x, a.p.y, a.p.z) })),
    bonds: def.bonds, lp: null,
  };
}

function buildChir(kind) {
  clearMol();
  st.align = null;
  const g = new THREE.Group();
  const defL = chirDef(kind);
  const defR = mirrorOf(defL);
  const L = buildMol(defL, { labels: true });
  const R = buildMol(defR, { labels: true });
  L.g.position.set(-1.9, 0, 0);
  R.g.position.set(1.9, 0, 0);
  g.add(L.g, R.g);
  // 镜面（yz 平面）
  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(3.4, 2.8),
    new THREE.MeshStandardMaterial({ color: 0x7fb2d9, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false, roughness: 0.6 })
  );
  plane.rotation.y = Math.PI / 2;
  plane.name = 'mirrorPlane';
  g.add(plane);
  const corners = [[0, -1.4, -1.7], [0, -1.4, 1.7], [0, 1.4, 1.7], [0, 1.4, -1.7]].map((p) => V(...p));
  const border = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(corners),
    new THREE.LineBasicMaterial({ color: 0x9ec9e8, transparent: true, opacity: 0.8 }));
  border.name = 'mirrorBorder';
  g.add(border);
  const title = makeTextSprite(kind === 'chiral' ? '分子 ↔ 镜像：互为对映体' : '分子 ↔ 镜像：可重合（有对称面）', { fontSize: 40, color: '#dce8f5', scale: 0.009 });
  title.position.set(0, 2.5, 0);
  title.name = 'chirTitle';
  g.add(title);
  molRoot.add(g);
  st.chirGroups = { root: g, L: L.g, R: R.g, plane, border };
  hud.set('mol', `${defL.f} · ${kind === 'chiral' ? 'H/F/Cl/Br 四基团互不相同' : '两个 H 相同 → 有对称面'}`);
  hud.set('sym', kind === 'chiral' ? '无任何对称面/对称中心' : '有一个对称面（过 C、F、Cl、平分 H–H）');
  hud.set('try', '点击「旋转重合尝试」');
}

function tickAlign(dt) {
  const a = st.align;
  if (!a || !a.mirror) return;
  a.t += dt;
  const g = a.mirror;
  if (a.mode === 'chiral') {
    const D = 3.0;
    if (a.t < D) {
      g.rotation.x = Math.sin(a.t * 2.6) * 1.1;
      g.rotation.y += dt * 2.8;
    } else {
      g.rotation.set(0, 0, 0);
      st.align = null;
      hud.set('try', '✗ 无论怎么旋转都无法重合 → 手性分子');
    }
  } else {
    const D1 = 1.5, D2 = 1.0;
    if (a.t < D1) {
      g.rotation.z = ease(a.t / D1) * Math.PI;
    } else if (a.t < D1 + D2) {
      g.rotation.z = Math.PI;
      g.position.x = 1.9 - ease((a.t - D1) / D2) * 3.8;
    } else {
      st.align = null;
      hud.set('try', '✓ 旋转后完全重合 → 非手性');
    }
  }
}

let chirQuizPanel = null;
function showChirQuiz() {
  if (chirQuizPanel) chirQuizPanel.remove();
  const panel = document.createElement('div');
  panel.className = 'quiz-panel';
  const card = document.createElement('div');
  card.className = 'quiz-card';
  card.innerHTML = '<div class="q-progress">手性小测 · 判断下列分子是否有手性</div><h3>点击「手性 / 非手性」作答</h3><div class="q-opts"></div>';
  const box = card.querySelector('.q-opts');
  box.style.flexDirection = 'column';
  const ITEMS = [
    { f: 'CHBrClF', ans: true, ex: '四个取代基互不相同（H/Br/Cl/F），无对称面 → 手性。' },
    { f: 'CH₂Cl₂', ans: false, ex: '两个 H 相同 → 存在对称面 → 非手性。' },
    { f: '乳酸 CH₃CH(OH)COOH', ans: true, ex: '中间碳连 H/OH/CH₃/COOH 四个不同基团 → 手性（人体只代谢 L 型）。' },
    { f: '乙烷 CH₃CH₃', ans: false, ex: '每个碳上的三个 H 都相同 → 非手性。' },
  ];
  let solved = 0;
  ITEMS.forEach((it) => {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;gap:8px;flex-wrap:wrap';
    const name = document.createElement('b');
    name.textContent = it.f;
    name.style.minWidth = '170px';
    row.appendChild(name);
    [true, false].forEach((choice) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'quiz-opt';
      b.style.flex = 'none';
      b.textContent = choice ? '手性' : '非手性';
      b.addEventListener('click', () => {
        if (row.dataset.done) return;
        row.dataset.done = '1';
        solved++;
        const ok = choice === it.ans;
        if (ok) b.classList.add('correct');
        else { b.classList.add('wrong'); row.querySelector('[data-correct="true"]').classList.add('correct'); }
        const tip = document.createElement('span');
        tip.style.cssText = 'font-size:12px;color:var(--text-dim);flex-basis:100%';
        tip.textContent = (ok ? '✓ ' : '✗ ') + it.ex;
        row.appendChild(tip);
        if (solved === ITEMS.length) {
          const done = document.createElement('div');
          done.style.cssText = 'font-size:13px;color:var(--accent);font-weight:600;margin-top:6px';
          done.textContent = '小测完成！手性的关键：一个碳上连四个互不相同的基团。';
          card.appendChild(done);
        }
      });
      if (choice) b.dataset.t = '1';
      b.dataset.correct = String(choice === it.ans);
      row.appendChild(b);
    });
    box.appendChild(row);
  });
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'ctl-btn';
  close.textContent = '关闭小测';
  close.style.marginTop = '10px';
  close.addEventListener('click', () => panel.remove());
  card.appendChild(close);
  panel.appendChild(card);
  stage.appendChild(panel);
  chirQuizPanel = panel;
  return panel;
}

function chirEnter() {
  clearMol();
  app.setCamera([0.5, 2.4, 9.6], [0, 0, 0]);
  buildHud([['mol', '分子'], ['sym', '对称性'], ['try', '重合尝试']]);
  ctl.clear();
  ctl.seg({
    options: [{ label: 'CHFClBr（手性）', value: 'chiral' }, { label: 'CH₂FCl（非手性对照）', value: 'achiral' }],
    value: st.chirKey,
    onChange: (v) => { st.chirKey = v; rebuild(); },
  });
  let showMirror = true, showPlane = true;
  ctl.toggle({ label: '显示镜像分子', value: true, onChange: (v) => { showMirror = v; st.chirGroups.R.visible = v; } });
  ctl.toggle({
    label: '显示对称面', value: true,
    onChange: (v) => { showPlane = v; st.chirGroups.plane.visible = v; st.chirGroups.border.visible = v; },
  });
  ctl.button({
    label: '🔄 旋转重合尝试',
    onClick: () => {
      hud.set('try', '尝试中…');
      st.align = { t: 0, mode: st.chirKey === 'chiral' ? 'chiral' : 'achiral', mirror: st.chirGroups.R };
      st.chirGroups.R.position.set(1.9, 0, 0);
      st.chirGroups.R.rotation.set(0, 0, 0);
    },
  });
  ctl.button({ label: '📝 手性小测验', onClick: () => showChirQuiz() });
  function rebuild() { buildChir(st.chirKey); }
  rebuild();
  activeSectionCleanup = () => { if (chirQuizPanel) { chirQuizPanel.remove(); chirQuizPanel = null; } };
}

/* ================= 章节八：分子库 ================= */

let libCardEl = null, libInfoEl = null;

function showLibInfo(def) {
  if (!libInfoEl) {
    libInfoEl = document.createElement('div');
    libInfoEl.className = 'vspr-info';
    stage.appendChild(libInfoEl);
  }
  const i = def.info;
  libInfoEl.innerHTML = `
    <div class="vspr-info-head"><span class="fm"></span><span class="nm"></span><button class="vspr-info-x" type="button">✕</button></div>
    <div class="vspr-info-body"></div>`;
  libInfoEl.querySelector('.fm').textContent = fmtF(def.f);
  libInfoEl.querySelector('.nm').textContent = `${def.name} · ${def.cat}`;
  const body = libInfoEl.querySelector('.vspr-info-body');
  const rows = [
    ['AXE 类', i.axe], ['电子对构型', i.eg], ['分子构型', i.mg], ['键角', i.ang],
    ['杂化', i.hyb], ['极性', i.polar], ['键长', i.bond],
  ];
  if (i.mu && i.mu !== '—') rows.push(['偶极矩 μ', i.mu]);
  rows.forEach(([k, v]) => {
    const r = document.createElement('div');
    r.className = 'r';
    const s = document.createElement('span');
    s.textContent = k;
    const b = document.createElement('b');
    b.textContent = v;
    r.appendChild(s); r.appendChild(b);
    body.appendChild(r);
  });
  if (i.note) {
    const n = document.createElement('div');
    n.className = 'vspr-note';
    n.textContent = '注：' + i.note;
    body.appendChild(n);
  }
  libInfoEl.querySelector('.vspr-info-x').addEventListener('click', () => { libInfoEl.style.display = 'none'; });
  libInfoEl.style.display = '';
}

function ensureLibCard(onPick) {
  if (libCardEl) { libCardEl.style.display = ''; paintLibActive(); return; }
  libCardEl = document.createElement('div');
  libCardEl.className = 'lib-card';
  const groups = [...new Set(MOL_LIST.map((d) => d.cat))];
  groups.forEach((cat) => {
    const h = document.createElement('h4');
    h.textContent = cat;
    libCardEl.appendChild(h);
    const grid = document.createElement('div');
    grid.className = 'lib-grid';
    MOL_LIST.filter((d) => d.cat === cat).forEach((d) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'lib-btn';
      b.textContent = fmtF(d.f);
      b.dataset.f = d.f;
      b.addEventListener('click', () => onPick(d.f));
      grid.appendChild(b);
    });
    libCardEl.appendChild(grid);
  });
  stage.appendChild(libCardEl);
  libCardEl.style.display = '';
}

function paintLibActive() {
  if (!libCardEl) return;
  libCardEl.querySelectorAll('.lib-btn').forEach((b) => b.classList.toggle('active', b.dataset.f === st.libKey));
}

function loadLib(f) {
  st.libKey = f;
  clearMol();
  const def = MOLS[f];
  const { g } = buildMol(def, { labels: st.libLabels !== false, lp: st.libLP !== false });
  molRoot.add(g);
  fitView(def, 0.5);
  showLibInfo(def);
  paintLibActive();
  hud.set('mol', def.f);
  hud.set('mg', def.info.mg);
  hud.set('idx', `${MOL_LIST.indexOf(def) + 1} / ${MOL_LIST.length}`);
}

function libEnter() {
  clearMol();
  buildHud([['mol', '当前分子'], ['mg', '分子构型'], ['idx', '编号']]);
  ctl.clear();
  ctl.toggle({ label: '分子列表卡', value: true, onChange: (v) => { if (libCardEl) libCardEl.style.display = v ? '' : 'none'; } });
  ctl.toggle({ label: '原子标签', value: true, onChange: (v) => { st.libLabels = v; loadLib(st.libKey); } });
  ctl.toggle({ label: '显示孤对', value: true, onChange: (v) => { st.libLP = v; loadLib(st.libKey); } });
  ctl.button({ label: '‹ 上一个', onClick: () => { const i = MOL_LIST.findIndex((d) => d.f === st.libKey); loadLib(MOL_LIST[(i - 1 + MOL_LIST.length) % MOL_LIST.length].f); } });
  ctl.button({ label: '下一个 ›', onClick: () => { const i = MOL_LIST.findIndex((d) => d.f === st.libKey); loadLib(MOL_LIST[(i + 1) % MOL_LIST.length].f); } });
  ensureLibCard(loadLib);
  loadLib(st.libKey);
  activeSectionCleanup = () => {
    if (libCardEl) libCardEl.style.display = 'none';
    if (libInfoEl) libInfoEl.style.display = 'none';
  };
}

/* ================= 章节九：随堂检测 ================= */

const QUIZ_V = [
  {
    q: '水分子（AX2E2）的分子构型是？',
    opts: ['直线形', 'V形（角形）', '平面三角形', '三角锥形'],
    a: 1,
    ex: 'O 有 2 对成键电子 + 2 对孤对，电子对构型为正四面体；去掉孤对位置后，两个 H 成 V 形，键角约 104.5°。',
  },
  {
    q: 'NH₃ 的键角（107°）比 CH₄（109°28′）小，原因是？',
    opts: ['N 原子半径比 C 小', 'N–H 键比 C–H 键短', '孤对电子对成键电子对的斥力更大', 'N 的电负性更小'],
    a: 2,
    ex: '斥力排序：孤对-孤对 ＞ 孤对-成键 ＞ 成键-成键。NH3 的 1 对孤对把 3 个 N–H 键压拢，键角从 109.5° 压缩到约 107°。',
  },
  {
    q: 'SF₆ 的中心硫原子杂化类型与分子构型是？',
    opts: ['sp³、正四面体形', 'sp³d、三角双锥', 'sp³d²、正八面体形', 'sp²、平面三角形'],
    a: 2,
    ex: 'SF6 有 6 对成键电子（AX6），sp³d² 杂化，正八面体构型，键角 90°；S 是扩展八隅体（12 电子）。',
  },
  {
    q: 'CO₂ 是非极性分子而 H₂O 是极性分子，正确的解释是？',
    opts: ['C=O 键没有极性，O–H 键有极性', 'CO₂ 直线对称、两个键偶极相互抵消；H₂O 呈 V 形、键偶极不能抵消', 'CO₂ 是气体所以没有极性', 'O 的电负性在两种分子中不同'],
    a: 1,
    ex: '两种键都有极性；关键在分子几何：CO2 直线形（180°）键偶极正好抵消，H2O 的 V 形（104.5°）使合偶极不为零。',
  },
  {
    q: '下列分子中属于手性分子的是？',
    opts: ['CH₄', 'CH₂Cl₂', 'BF₃', 'CHBrClF'],
    a: 3,
    ex: 'CHBrClF 的中心碳连 H/Br/Cl/F 四个互不相同的基团，无对称面，与镜像不能重合 → 手性。其余分子都有对称性，能与镜像重合。',
  },
];

function showQuizV() {
  let idx = 0;
  let score = 0;
  const panel = document.createElement('div');
  panel.className = 'quiz-panel';
  stage.appendChild(panel);

  function renderQ() {
    const item = QUIZ_V[idx];
    panel.innerHTML = '';
    const card = document.createElement('div');
    card.className = 'quiz-card';
    card.innerHTML = `
      <div class="q-progress">第 ${idx + 1} / ${QUIZ_V.length} 题</div>
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
        next.textContent = idx < QUIZ_V.length - 1 ? '下一题 →' : '查看成绩 →';
        next.addEventListener('click', () => {
          idx++;
          if (idx < QUIZ_V.length) renderQ();
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
    const pct = Math.round((score / QUIZ_V.length) * 100);
    card.innerHTML = `
      <div class="q-progress">检测完成</div>
      <div class="big">${score} / ${QUIZ_V.length}</div>
      <p style="color:var(--text-dim);margin:4px 0 18px">正确率 ${pct}%${pct >= 80 ? '，分子构型你已经掌握了！' : pct >= 60 ? '，大部分概念已经清楚，回顾一下错题。' : '，建议回到前面章节再看一遍哦。'}</p>`;
    const again = document.createElement('button');
    again.type = 'button';
    again.className = 'ctl-btn active';
    again.textContent = '重新测验';
    again.addEventListener('click', () => { idx = 0; score = 0; renderQ(); });
    const back = document.createElement('button');
    back.type = 'button';
    back.className = 'ctl-btn';
    back.textContent = '返回第一章';
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

function quizEnter() {
  clearMol();
  buildHud([['tip', '提示']]);
  hud.set('tip', '5 道选择题，检验本节掌握情况');
  ctl.clear();
  ctl.button({ label: '↺ 重新测验', onClick: () => showQuizV() });
  showQuizV();
}

/* ================= 章节定义与启动 ================= */

const SECTIONS = [
  {
    title: '价层电子对互斥',
    html: `<p>分子中心原子的<b>价层电子对</b>（成键对 + 孤对）彼此排斥，在空间上取<span class="hl">斥力最小的排布</span>——这就是 VSEPR（Valence Shell Electron Pair Repulsion）模型。</p>
<p>拖动滑杆选成键数 n 与孤对数 m，看 n+m 个「电子对气球」如何排布：2 对直线、3 对平面三角、4 对四面体、5 对三角双锥、6 对八面体。</p>
<p><span class="hl">斥力排序：孤对-孤对 ＞ 孤对-成键 ＞ 成键-成键</span>。所以三角双锥中孤对优先占赤道位，八面体中孤对互成 180°。打开「斥力连线」看每对气球之间的相互排斥（连线颜色越暖，斥力越强）。</p>`,
    enter() { sandEnter(); },
  },
  {
    title: '电子对构型与分子构型',
    html: `<p><b>电子对构型</b>看全部 n+m 个电子对；<b>分子构型</b>只看<span class="hl">原子的排列</span>——也就是「去掉孤对位置后」剩下的形状。</p>
<p>例如 AX3E：电子对构型是正四面体，但孤对「看不见」，三个原子呈<span class="hl">三角锥形</span>。用「隐藏孤对电子」开关对比切换，体会两者的差别。</p>
<p>打开「AXnEm 对照表」查看 13 种常见组合的构型名、键角与杂化，点击任意行可在 3D 中查看该构型。</p>`,
    enter() { axeEnter(); },
  },
  {
    title: '键角比较',
    html: `<p>同样是 sp³ 四电子对排布：CH₄ 无孤对，键角 <b>109°28′</b>；NH₃ 有 1 对孤对，压到 <span class="hl">107°</span>；H₂O 有 2 对孤对，只剩 <span class="hl">104.5°</span>。</p>
<p>因为斥力<b>孤对-成键 ＞ 成键-成键</b>，孤对像一只看不见的手把成键电子对挤拢。拖动「孤对斥力倍率」滑杆，加大孤对斥力，实时看键角被进一步压缩。</p>`,
    enter() { angleEnter(); },
  },
  {
    title: '杂化轨道',
    html: `<p>成键时中心原子的 s、p（必要时还有 d）轨道<span class="hl">混合重组</span>为取向固定的杂化轨道：sp（2 个，直线）、sp²（3 个，平面三角）、sp³（4 个，四面体）、sp³d（5 个，三角双锥）、sp³d²（6 个，八面体）。</p>
<p>每个杂化轨道是一头大一头小的<span class="hl">葫芦形瓣</span>，大瓣用于成键。切换五种杂化，看瓣的空间取向与构型的对应关系；「叠加示例分子」用真实分子对照（BeCl₂/BF₃/CH₄/PCl₅/SF₆）。</p>
<p>sp 和 sp² 会留下未参与杂化的 p 轨道（紫色），正是它们形成 π 键（乙烯、乙炔）。</p>`,
    enter() { hybEnter(); },
  },
  {
    title: '分子极性',
    html: `<p>共价键两端电负性不同就产生<b>键偶极</b>（δ＋→δ−，红色箭头）。分子的<span class="hl">净偶极 = 各键偶极的矢量和</span>（蓝色箭头）。</p>
<p>CO₂ 是直线形，两个 C=O 偶极<span class="hl">大小相等方向相反 → 抵消 → 非极性</span>；H₂O 呈 V 形，两个 O–H 偶极合不为零 → 极性（μ = 1.85 D）。</p>
<p>同类对比：CH₄（对称抵消）vs CHCl₃（合偶极 ≠ 0，极性）；BF₃（平面三角抵消）vs NH₃（三角锥极性）。<b>键有极性 ≠ 分子有极性，对称性才是关键。</b></p>`,
    enter() { polarEnter(); },
  },
  {
    title: '扩展八隅体',
    html: `<p>第二周期原子最外层只有 2s 2p 四个轨道，最多 8 电子；<span class="hl">第三周期起（P、S、Cl、Xe…）可利用 d 轨道，容纳 10~12 个电子</span>——这就是扩展八隅体。</p>
<p>PCl₅（10 电子，三角双锥）、SF₆（12 电子，正八面体）。稀有气体 Xe 也能成键：XeF₂ 三对孤对占赤道位 → 直线形；XeF₄ 两对孤对占对位 → <span class="hl">平面正方形</span>。</p>
<p>切换五个分子，注意孤对的占位规律与键长的差别（轴向键比赤道键长）。</p>`,
    enter() { octEnter(); },
  },
  {
    title: '手性分子',
    html: `<p>一个碳上连<b>四个互不相同的基团</b>（如 CHFClBr），分子与它的镜像<span class="hl">无论怎么旋转都无法重合</span>——这就是手性（chirality），两者互为<b>对映体</b>。</p>
<p>点「旋转重合尝试」：镜像分子会尝试各种旋转——手性分子以失败告终；切到 CH₂FCl（两个 H 相同 → 有对称面）再试一次，镜像旋转后<span class="hl">完全重合</span>，所以非手性。</p>
<p>手性在药物中至关重要：一对对映体常常一个有效、一个无效甚至有害。最后用小测验练一练判断。</p>`,
    enter() { chirEnter(); },
  },
  {
    title: '分子库',
    html: `<p>收录 <b>31 个常见分子/离子</b>：直线形、平面构型、四面体家族、三角双锥、八面体与有机多中心分子。</p>
<p>点击左侧列表（或控制条的 ‹ ›）切换，右侧信息卡给出每个分子的 <span class="hl">AXE 类、电子对/分子构型、键角、杂化、极性、键长参考值</span>。拖拽旋转、滚轮缩放任意观察。</p>`,
    enter() { libEnter(); },
  },
  {
    title: '随堂检测',
    html: `<p>5 道选择题，检验 VSEPR 这一节的掌握情况。</p>`,
    enter() { quizEnter(); },
  },
];

loadAll([
  { key: 'sky', label: '环境光', job: loadHDR('../assets/textures/sky/sky_court-BLHJ2ADI.hdr') },
  { key: 'skyBg', label: '背景', job: loadTexture('../assets/textures/sky/sky_court-BKHrsJQE.webp') },
], (d, t, label) => loader.setText(`正在加载 ${d}/${t}（${label}）`)).then((t) => {
  t.sky.mapping = THREE.EquirectangularReflectionMapping;
  scene.environment = t.sky;
  t.skyBg.mapping = THREE.EquirectangularReflectionMapping;
  scene.background = t.skyBg;

  labReady = true;
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
}).catch((err) => {
  loader.setText('资源加载失败：' + err.message);
  console.error(err);
});
