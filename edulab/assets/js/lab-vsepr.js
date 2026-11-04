/* EduLab · 分子构型（vsepr · MoleCraft）— Micro 级 3D 深改
 * =====================================================================
 * 章节：价层电子对互斥 / 电子对构型与分子构型 / 键角比较 / 杂化轨道 / 分子极性 /
 *       扩展八隅体 / 手性分子 / 分子库 / 随堂检测
 *
 * 三栏布局：左课程大纲（9 章列表，点击切章高亮迁移）· 中分子舞台（实验台叙事）· 右知识点详解（三手风琴）
 * 折叠体系：左右栏 28px 竖条折叠 × 浮窗（对照表/分子列表/信息卡）折叠为 40px 圆徽标 ×
 *           右栏手风琴 × 专注模式（localStorage 记忆，首访不落盘）
 *
 * 场景工艺（edu-vfx 接入）：
 *   木质实验台（程序化木纹双变体 + 台缘 + 桌腿 + 中央接触阴影）+
 *   分子模型收纳盒（开盖木盒 / 分格内托 / 彩球棍散件 / 盒盖铭牌标签）+
 *   烧杯双件（玻璃杯身 / 内液 + 弯月面 + 杯口珠环 / 前壁刻度贴花）+
 *   VSEPR 构型速查卡（双面立卡 / 程序化 2D 构型线稿图版 / 金属支座）+
 *   钢直尺（毫米刻度 CanvasTexture）/ 悬浮角度刻度环（径向刻度盘 + 金属圈，缓旋）。
 *   主体建模：原子 = clearcoat 烤漆球（模型套件观感）；化学键 = 金属棍 + 双端锥台插头；
 *   孤对 = 高辉泪滴（呼吸脉冲）；气球沙盒 = Lathe 气球体（结头 + 橡胶 sheen + 错相呼吸摆动）；
 *   杂化瓣 = 双瓣 Lathe + 等值线圈 + 相位标记 + 错峰长出动画；手性镜 = 黄铜边框玻璃镜。
 *
 * VSEPR 几何引擎：电子对构型方向向量常量表；键长/键角/偶极矩取教科书常见参考值
 *   （CRC Handbook / 《结构化学基础》常用数据，自拟整理）。
 * 原版功能块 1:1：气球沙盒（成键/孤对滑杆 + 斥力连线）/ AXnEm 对照表（点行联动 3D）/
 *   键角比较（孤对斥力倍率）/ 杂化轨道（五型 + 示例分子 + 未杂化 p）/ 分子极性（键偶极 + 净偶极）/
 *   扩展八隅体（七分子 + 孤对占位）/ 手性（镜像 + 重合尝试 + 小测）/ 分子库（34 分子 + 信息卡）/
 *   随堂检测（5 题）/ 上一节(←) 下一节(→) / 重置视角(R) / 全屏(F)
 * =====================================================================
 */
import {
  THREE, TAU, DEG, clamp,
  createApp, createControlsPanel, makeHUD, makeLoader,
  makeTextSprite,
} from './edu-core.js';
import {
  attachVFX, makeStudioEnvironment, makeWoodTexture, makeLabelTexture,
  matStd, matCoat, matSheen, matGlow, PAL, registerGlow,
} from './edu-vfx.js';

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
  7: { name: '五角双锥', dirs: [[0, 1, 0], [0, -1, 0], [1, 0, 0], [0.309, 0, 0.951], [-0.809, 0, 0.588], [-0.809, 0, -0.588], [0.309, 0, -0.951]] },
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
  reg(mol('I3^-', '三碘离子', 'I', 'I', [[1, 0, 0], [-1, 0, 0]], 2.9,
    [nd([1, 0, 0]), nd([-0.5, 0, 0.866]), nd([-0.5, 0, -0.866])],
    { axe: 'AX2E3', eg: '三角双锥', mg: '直线形', ang: '180°', hyb: 'sp³d', polar: '非极性（对称离子）', bond: 'I–I 290 pm（比 I₂ 的 267 pm 长）', mu: '0', note: '与 XeF₂ 同为 AX₂E₃ 直线形；由 I₂ 与 I⁻ 结合而成（淀粉遇碘显蓝色的原因）' }), '直线形');
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
  { // BrF5 四方锥：1 对孤对占一个轴向位，4 个底面 F 被压向另一侧
    const tilt = Math.sin(94.5 * DEG), down = Math.cos(94.5 * DEG);
    const dirs = [V(0, -1, 0),
      V(tilt, down, 0), V(0, down, tilt), V(-tilt, down, 0), V(0, down, -tilt)];
    reg(mol('BrF5', '五氟化溴', 'Br', 'F', dirs, [1.69, 1.78, 1.78, 1.78, 1.78], [V(0, 1, 0)],
      { axe: 'AX5E', eg: '正八面体', mg: '四方锥形', ang: '底面 F–Br–F ≈85°（略＜90°）', hyb: 'sp³d²', polar: '极性', bond: 'Br–F(顶) 169 pm · Br–F(底) 178 pm', mu: '1.51 D', note: '孤对占一个轴向位，把 4 个底面 F 推向另一侧——四方锥略呈"伞"形' }), '八面体家族'); }
  reg(mol('IF7', '七氟化碘', 'I', 'F', GEOM[7].dirs.map(nd), [1.86, 1.86, 1.79, 1.79, 1.79, 1.79, 1.79], null,
    { axe: 'AX7', eg: '五角双锥', mg: '五角双锥形', ang: '72°（赤道间）/ 90°（轴-赤道）', hyb: 'sp³d³', polar: '非极性', bond: 'I–F(轴) 186 pm · I–F(赤道) 179 pm', mu: '0', note: '7 个电子域——扩展八隅体的极限（14 电子），赤道面上 5 个 F 互成 72°' }), '八面体家族');
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
  { // C6H6 苯（平面正六边形，Kekulé 画法）
    const R = 1.39;
    const atoms = [];
    const bonds = [];
    for (let i = 0; i < 6; i++) {
      const a = i * TAU / 6;
      atoms.push({ e: 'C', p: V(Math.cos(a) * R, Math.sin(a) * R, 0) });
    }
    for (let i = 0; i < 6; i++) {
      atoms.push({ e: 'H', p: V(Math.cos(i * TAU / 6) * (R + 1.09), Math.sin(i * TAU / 6) * (R + 1.09), 0) });
      bonds.push({ a: i, b: (i + 1) % 6, o: i % 2 === 0 ? 2 : 1 });      // 环上交替双单键（Kekulé）
      bonds.push({ a: i, b: i + 6, o: 1 });                              // C–H
    }
    reg({ f: 'C6H6', name: '苯', atoms, bonds,
      info: { axe: '六个 C 均为 AX3', eg: '平面三角形（每碳）', mg: '平面正六边形（12 原子共面）', ang: '120°', hyb: 'sp²（六碳）', polar: '非极性', bond: 'C–C 139 pm（六键完全相同）· C–H 109 pm', mu: '0', note: '六个 C 均为 sp² 杂化，六个 p 轨道形成环状离域大 π 键，六条 C–C 键完全相同；图中为一种 Kekulé 画法' } }, '有机多中心'); }
}
// 杂化章示例分子兼库条目：BeCl2（原版分子库含「氯化铍（气态）」）
const BECL2 = mol('BeCl2', '氯化铍', 'Be', 'Cl', [[1, 0, 0], [-1, 0, 0]], 1.70, null,
  { axe: 'AX2', eg: '直线', mg: '直线形', ang: '180°', hyb: 'sp', polar: '非极性', bond: 'Be–Cl 170 pm', mu: '0', note: 'Be 只有 2 对价层电子，相距最远的排布是直线（气态）' });
BECL2.cat = '直线形';
MOLS.BeCl2 = BECL2;
MOL_LIST.splice(MOL_LIST.findIndex((d) => d.f === 'CO2') + 1, 0, BECL2);  // 插在 CO2 后，对齐原版顺序

/* ================= 舞台与工艺接入 ================= */

const stage = document.getElementById('stage');
const loader = makeLoader(stage, '正在搭建分子实验台…');

const app = createApp({
  container: stage,
  fov: 45, near: 0.05, far: 200,
  cameraPos: [3.2, 3.2, 8],
  target: [0, 0, 0],
  minDistance: 1.2, maxDistance: 60,
  exposure: 1.04,
  keepBackground: true,
});
const { scene } = app;
const vfx = attachVFX(app, 'illus');            // 后处理管线 + cubic 运镜接管（渲染循环由它驱动）
window.__vspVFX = vfx;                          // 质检钩子：vfx.stats() 查 draw call
scene.environment = makeStudioEnvironment(app.renderer);

scene.add(new THREE.HemisphereLight(0xd8e2ec, 0x3a3026, 0.6));
const keyLight = new THREE.DirectionalLight(0xfff2e2, 1.4);
keyLight.position.set(4.5, 8, 6);
scene.add(keyLight);
const fillLight = new THREE.DirectionalLight(0xdfe8ff, 0.4);
fillLight.position.set(-6, 4, -4);
scene.add(fillLight);
const rimLight = new THREE.DirectionalLight(0xbfd8e8, 0.28);
rimLight.position.set(-2.5, 2.5, -6);
scene.add(rimLight);

/* 分子模型挂载根（各章重建） */
const molRoot = new THREE.Group();
scene.add(molRoot);

/* ================= 工艺基建（台面 / 纹理 / 阴影 / 色板） ================= */

const canvasTex = (w, h, draw) => {
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  draw(cv.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
};

/* 场景色板（PAL 延展：分子台用暖木族 + 模型套件配色；仅本实验使用） */
const C = {
  bench: 0x5f4426, benchDeep: 0x3d2c18,     // 实验台木族
  steel: PAL.steel, brass: PAL.brass,       // 金属件走 PAL 通用族
  boxWood: 0x8a6a44,                        // 模型盒木族
  bond: 0x8a939e,                           // 键棍金属
  plug: 0x3a4048,                           // 键端插头石墨
  balloonBond: 0x5f9bd6,                    // 成键电子对气球
  balloonLP: 0xffa03a,                      // 孤对气球
  lpGlow: 0xffb347,                         // 孤对泪滴辉光
  lobeS: 0x7cc7ff,                          // 杂化瓣（s 系）
  lobeP: 0xc09aff,                          // 未杂化 p 轨道
  mirrorFrame: PAL.brass,
};

/* 木质材质（台面 / 道具：程序化木纹多 seed 变体） */
const woodTexBench = makeWoodTexture({ base: '#63482a', dark: '#453219', light: '#85633b', streaks: 120, bands: 8, planks: 4, seed: 23 });
woodTexBench.repeat.set(3.0, 2.0);
const woodTexBox = makeWoodTexture({ base: '#8a6a44', dark: '#6a4e2e', light: '#b08c5e', streaks: 64, bands: 5, seed: 71 });
woodTexBox.repeat.set(1.1, 0.8);
function woodMat(tex, rough = 0.62) {
  const m = new THREE.MeshStandardMaterial({ roughness: rough, metalness: 0.04 });
  m.map = tex;
  return m;
}

/* 接触阴影贴片（主体/道具落桌的重量感来源） */
function shadowPatch(w, d, opacity = 0.4) {
  const tex = canvasTex(256, 256, (ctx) => {
    const g = ctx.createRadialGradient(128, 128, 10, 128, 128, 126);
    g.addColorStop(0, 'rgba(6,5,3,' + opacity + ')');
    g.addColorStop(0.62, 'rgba(6,5,3,' + opacity * 0.55 + ')');
    g.addColorStop(1, 'rgba(6,5,3,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
  });
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(w, d),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false })
  );
  m.rotation.x = -Math.PI / 2;
  m.renderOrder = 1;
  return m;
}

/* 玻璃材质（烧杯器壁：低反射涂层路线，透而不白） */
function glassMat(op = 0.16) {
  const m = matCoat(0xbcd8e4, {
    roughness: 0.05, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.12,
    opacity: op, transparent: true, side: THREE.DoubleSide, depthWrite: false,
  });
  m.envMapIntensity = 0.3;
  return m;
}

/* ================= 共享实验台（叙事层：全程可见） ================= */

const BENCH_Y = -2.35;   // 台面高度（分子主体悬浮于台面上方展示区）

function buildBench() {
  const g = new THREE.Group();
  /* 台面大板 */
  const top = new THREE.Mesh(new THREE.BoxGeometry(30, 0.5, 17), woodMat(woodTexBench));
  top.position.y = BENCH_Y - 0.25;
  g.add(top);
  /* 台缘（深木包边，前缘微出沿） */
  const rim = new THREE.Mesh(
    new THREE.BoxGeometry(30.7, 0.26, 17.7),
    matStd(C.benchDeep, { roughness: 0.62 })
  );
  rim.position.y = BENCH_Y - 0.52;
  g.add(rim);
  /* 桌腿（四角） */
  const legGeo = new THREE.BoxGeometry(0.36, 2.4, 0.36);
  for (const [lx, lz] of [[-13.4, -7.3], [13.4, -7.3], [-13.4, 7.3], [13.4, 7.3]]) {
    const leg = new THREE.Mesh(legGeo, matStd(C.benchDeep, { roughness: 0.68 }));
    leg.position.set(lx, BENCH_Y - 1.7, lz);
    g.add(leg);
  }
  /* 台面中央柔影（分子展示区落位） */
  const sh = shadowPatch(13, 10, 0.32);
  sh.position.set(0, BENCH_Y + 0.005, -0.2);
  g.add(sh);
  return g;
}

/* ---------- 道具：分子模型收纳盒（开盖 / 分格内托 / 彩球棍散件 / 盒盖铭牌） ---------- */

function makeModelBox(x, z, rotY) {
  const g = new THREE.Group();
  const W = 1.7, D = 1.15, H = 0.3, T = 0.05;
  const wmat = woodMat(woodTexBox);
  /* 盒体五面（底 + 四侧壁），内部留分格空间 */
  const bottom = new THREE.Mesh(new THREE.BoxGeometry(W, T, D), wmat);
  bottom.position.y = T / 2;
  g.add(bottom);
  const wall = (w, h, d, px, py, pz) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wmat);
    m.position.set(px, py, pz);
    g.add(m);
    return m;
  };
  wall(W, H, T, 0, H / 2 + T, -D / 2 + T / 2);           // 后壁
  wall(W, H, T, 0, H / 2 + T, D / 2 - T / 2);            // 前壁
  wall(T, H, D - T * 2, -W / 2 + T / 2, H / 2 + T, 0);   // 左壁
  wall(T, H, D - T * 2, W / 2 - T / 2, H / 2 + T, 0);    // 右壁
  /* 分格隔板（2×3 内托：中纵梁 + 两道横梁） */
  wall(T, H * 0.7, D - T * 2, 0, H / 2 + T, 0);
  wall(W - T * 2, H * 0.7, T, 0, H / 2 + T, -D / 6);
  wall(W - T * 2, H * 0.7, T, 0, H / 2 + T, D / 6);
  /* 内托绒面（深色衬底，格内散件落位更清楚） */
  const felt = new THREE.Mesh(
    new THREE.BoxGeometry(W - T * 2, 0.015, D - T * 2),
    matStd(0x27414d, { roughness: 0.95 })
  );
  felt.position.y = T + 0.008;
  g.add(felt);
  /* 格内散件：五颗彩球（模型套件备件，不同 CPK 色） */
  const ballCols = [0xd43a3a, 0x3050c8, 0xf2f5f9, 0x4a4f57, 0x4fae5a, 0xe3c832];
  const ballGeo = new THREE.SphereGeometry(0.085, 20, 14);
  ballCols.forEach((col, i) => {
    const b = new THREE.Mesh(ballGeo, matCoat(col, { roughness: 0.3, clearcoatRoughness: 0.2 }));
    const gx = (i % 3 - 1) * (W / 3 - 0.08);
    const gz = (Math.floor(i / 3) - 0.5) * (D / 2 - 0.1);
    b.position.set(gx, T + 0.085, gz);
    g.add(b);
  });
  /* 格内散棍 ×3（备用键棍，斜搭在格壁上） */
  const stickGeo = new THREE.CylinderGeometry(0.028, 0.028, 0.62, 10);
  [[-0.5, 0.3, 0.4], [0.02, 0.3, -0.25], [0.55, 0.3, 0.12]].forEach(([sx, sy, rz], i) => {
    const s = new THREE.Mesh(stickGeo, matStd(C.bond, { roughness: 0.32, metalness: 0.78 }));
    s.position.set(sx, sy + 0.06, (i - 1) * 0.26);
    s.rotation.z = rz;
    g.add(s);
  });
  /* 开盖（向后仰 72°，内面朝观众 → 贴铭牌标签） */
  const lid = new THREE.Group();
  const lidBoard = new THREE.Mesh(new THREE.BoxGeometry(W, T, D), wmat);
  lid.add(lidBoard);
  const lidLabel = new THREE.Mesh(
    new THREE.PlaneGeometry(W * 0.78, D * 0.62),
    new THREE.MeshStandardMaterial({
      map: makeLabelTexture(['分子结构模型', 'VSEPR · 球棍套装', '共 34 种分子构型'], { w: 320, h: 220, accent: '#8a5a28', lineSizes: [40, 26, 20] }),
      roughness: 0.7,
    })
  );
  lidLabel.position.set(0, T / 2 + 0.002, 0);
  lidLabel.rotation.x = -Math.PI / 2;
  lid.add(lidLabel);
  lid.position.set(0, H + T, -D / 2 + T / 2);
  lid.rotation.x = -1.26;                       // 开盖仰角
  g.add(lid);
  /* 黄铜搭扣 ×2（前缘） */
  const claspGeo = new THREE.BoxGeometry(0.07, 0.05, 0.02);
  [-0.55, 0.55].forEach((cx) => {
    const cl = new THREE.Mesh(claspGeo, matStd(C.brass, { roughness: 0.3, metalness: 0.85 }));
    cl.position.set(cx, H / 2 + T, D / 2 - T / 2 - 0.012);
    g.add(cl);
  });
  g.position.set(x, BENCH_Y, z);
  g.rotation.y = rotY;
  const sh = shadowPatch(2.3, 1.6, 0.36);
  sh.position.set(x, BENCH_Y + 0.004, z);
  sh.rotation.z = -rotY;
  scene.add(sh);
  return g;
}

/* ---------- 道具：烧杯（玻璃杯身 + 内液 + 弯月面 + 杯口珠环 + 刻度贴花） ---------- */

function makeBeaker(x, z, rotY, liquidCol, fillLevel) {
  const g = new THREE.Group();
  const R = 0.24, H = 0.62;
  /* 杯身：微锥度直筒（上口略敞）+ 底球面 */
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(R * 1.04, R, H, 26, 1, true),
    glassMat(0.2)
  );
  body.position.y = H / 2;
  g.add(body);
  const bottom = new THREE.Mesh(
    new THREE.SphereGeometry(R, 26, 10, 0, TAU, Math.PI / 2, Math.PI / 2),
    glassMat(0.2)
  );
  bottom.position.y = 0.01;
  g.add(bottom);
  /* 杯口珠环（倾倒嘴暗示：前缘微凸） */
  const lip = new THREE.Mesh(new THREE.TorusGeometry(R * 1.04, 0.009, 8, 30), matStd(0x9fb4be, { roughness: 0.3, metalness: 0.35, opacity: 0.65, transparent: true }));
  lip.rotation.x = Math.PI / 2;
  lip.position.y = H;
  g.add(lip);
  /* 内液（有液体时：柱体 + 主体液面 + 弯月面高光） */
  if (liquidCol && fillLevel > 0) {
    const fh = H * fillLevel;
    const fill = new THREE.Mesh(
      new THREE.CylinderGeometry(R * 0.99, R * 0.95, fh, 22),
      new THREE.MeshStandardMaterial({ color: new THREE.Color(liquidCol), roughness: 0.3, transparent: true, opacity: 0.72 })
    );
    fill.position.y = fh / 2 + 0.03;
    g.add(fill);
    const meniscus = new THREE.Mesh(
      new THREE.CircleGeometry(R * 0.99, 22),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(liquidCol).lerp(new THREE.Color(0xffffff), 0.4), transparent: true, opacity: 0.5 })
    );
    meniscus.rotation.x = -Math.PI / 2;
    meniscus.position.y = fh + 0.032;
    g.add(meniscus);
  }
  /* 前壁刻度贴花（50/100/150 mL 短线 + 字） */
  const decalTex = canvasTex(160, 200, (ctx, cw, ch) => {
    ctx.clearRect(0, 0, cw, ch);
    ctx.strokeStyle = 'rgba(212,232,240,0.6)';
    ctx.fillStyle = 'rgba(212,232,240,0.6)';
    ctx.lineWidth = 2;
    ctx.font = '600 15px sans-serif';
    const marks = [['150', 0.16], ['100', 0.4], ['50', 0.64]];
    marks.forEach(([t, k]) => {
      const y = ch * k;
      ctx.beginPath();
      ctx.moveTo(14, y);
      ctx.lineTo(44, y);
      ctx.stroke();
      ctx.fillText(t, 50, y + 5);
    });
    ctx.fillText('mL', 50, ch * 0.84);
  });
  const decal = new THREE.Mesh(
    new THREE.PlaneGeometry(0.16, 0.2),
    new THREE.MeshBasicMaterial({ map: decalTex, transparent: true, opacity: 0.5, depthWrite: false })
  );
  decal.position.set(0, H * 0.52, R + 0.004);
  g.add(decal);
  g.position.set(x, BENCH_Y, z);
  g.rotation.y = rotY;
  const sh = shadowPatch(0.72, 0.72, 0.32);
  sh.position.set(x, BENCH_Y + 0.004, z);
  scene.add(sh);
  return g;
}

/* ---------- 道具：VSEPR 构型速查卡（双面立卡 + 程序化线稿图版 + 金属支座） ---------- */

/* 线稿图版：2×3 六宫格 VSEPR 2D 小图（直线/三角/四面体/双锥/八面体/V 形） */
function drawVseprCard(ctx, cw, ch) {
  ctx.fillStyle = '#f4efdf';
  ctx.fillRect(0, 0, cw, ch);
  /* 边框（双线，讲义卡片感） */
  ctx.strokeStyle = '#8a5a28';
  ctx.lineWidth = 5;
  ctx.strokeRect(12, 12, cw - 24, ch - 24);
  ctx.lineWidth = 1.5;
  ctx.strokeRect(22, 22, cw - 44, ch - 44);
  /* 标题 */
  ctx.fillStyle = '#6b4416';
  ctx.font = '700 44px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('VSEPR 构型速查', cw / 2, 74);
  ctx.font = '500 20px sans-serif';
  ctx.fillStyle = '#9a7440';
  ctx.fillText('价层电子对互斥模型 · 常见几何', cw / 2, 106);
  /* 六宫格小图：把构型方向表投影到 2D 画线 */
  const items = [
    ['直线', 2], ['平面三角', 3], ['正四面体', 4],
    ['三角双锥', 5], ['正八面体', 6], ['V 形', 0],
  ];
  const ink = '#3d3226';
  const cellW = (cw - 60) / 3, cellH = (ch - 190) / 2;
  items.forEach(([name, n], i) => {
    const cx = 30 + (i % 3) * cellW + cellW / 2;
    const cy = 150 + Math.floor(i / 3) * cellH + cellH * 0.42;
    ctx.strokeStyle = ink;
    ctx.fillStyle = ink;
    ctx.lineWidth = 2.4;
    const L = cellH * 0.26;
    const drawDir = (d, scale = 1) => {
      /* 斜二测投影：x→x, y→y, z→(0.55x 偏移) */
      const px = cx + d[0] * L * scale + d[2] * L * 0.45;
      const py = cy - d[1] * L * scale;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(px, py);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(px, py, 5, 0, TAU);
      ctx.fill();
    };
    if (n >= 2) {
      GEOM[n].dirs.forEach((d) => drawDir(d));
    } else {
      /* V 形：两键向下张开 + 底部孤对虚线 */
      drawDir([Math.sin(0.9), Math.cos(0.9), 0]);
      drawDir([-Math.sin(0.9), Math.cos(0.9), 0]);
      ctx.setLineDash([4, 4]);
      drawDir([0, -1, 0]);
      ctx.setLineDash([]);
    }
    ctx.beginPath();
    ctx.arc(cx, cy, 7.5, 0, TAU);
    ctx.fillStyle = '#c76a3a';
    ctx.fill();
    ctx.fillStyle = '#6b4416';
    ctx.font = '600 22px sans-serif';
    ctx.fillText(name, cx, cy + cellH * 0.5);
  });
}
function makeVseprCard(x, z, rotY) {
  const g = new THREE.Group();
  const W = 0.92, H = 1.3;
  const faceTex = canvasTex(480, 640, drawVseprCard);
  const cardMat = new THREE.MeshStandardMaterial({ map: faceTex, roughness: 0.82, side: THREE.DoubleSide });
  const card = new THREE.Mesh(new THREE.PlaneGeometry(W, H), cardMat);
  card.position.y = H / 2 + 0.06;
  card.rotation.x = -0.16;                       // 微后仰，桌面视角可读
  g.add(card);
  /* 背衬薄板（卡片厚度暗示） */
  const back = new THREE.Mesh(
    new THREE.BoxGeometry(W * 0.98, H * 0.99, 0.012),
    matStd(0xd8cdb4, { roughness: 0.85 })
  );
  back.position.y = H / 2 + 0.055;
  back.rotation.x = -0.16;
  g.add(back);
  /* 金属支座斜撑 */
  const prop = new THREE.Mesh(
    new THREE.BoxGeometry(0.03, 0.5, 0.03),
    matStd(C.steel, { roughness: 0.35, metalness: 0.7 })
  );
  prop.position.set(0, 0.26, -0.18);
  prop.rotation.x = 0.42;
  g.add(prop);
  const foot = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 0.02, 0.14),
    matStd(C.steel, { roughness: 0.35, metalness: 0.7 })
  );
  foot.position.set(0, 0.01, -0.24);
  g.add(foot);
  g.position.set(x, BENCH_Y, z);
  g.rotation.y = rotY;
  const sh = shadowPatch(1.4, 0.9, 0.3);
  sh.position.set(x, BENCH_Y + 0.004, z);
  sh.rotation.z = -rotY;
  scene.add(sh);
  return g;
}

/* ---------- 道具：钢直尺（毫米刻度 CanvasTexture） ---------- */

function makeRuler(x, z, rotY) {
  const g = new THREE.Group();
  const L = 1.5, W = 0.17, T = 0.02;
  const tickTex = canvasTex(1024, 96, (ctx, cw, ch) => {
    ctx.fillStyle = '#c8ccd2';
    ctx.fillRect(0, 0, cw, ch);
    ctx.fillStyle = '#8b9098';
    ctx.fillRect(0, ch - 12, cw, 12);
    ctx.strokeStyle = '#3a4048';
    ctx.fillStyle = '#3a4048';
    for (let mm = 0; mm <= 150; mm++) {
      const px = 30 + (mm / 150) * (cw - 60);
      const big = mm % 10 === 0;
      ctx.lineWidth = big ? 3 : 1.4;
      ctx.beginPath();
      ctx.moveTo(px, 8);
      ctx.lineTo(px, big ? 40 : 24);
      ctx.stroke();
      if (big) {
        ctx.font = '600 17px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(String(mm / 10), px, 66);
      }
    }
    ctx.font = '600 15px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('cm · MoleCraft', 30, 90);
  });
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(L, T, W),
    [
      matStd(0xaeb4bc, { roughness: 0.35, metalness: 0.75 }),
      matStd(0xaeb4bc, { roughness: 0.35, metalness: 0.75 }),
      matStd(0xaeb4bc, { roughness: 0.35, metalness: 0.75 }),
      matStd(0xaeb4bc, { roughness: 0.35, metalness: 0.75 }),
      (() => { const m = new THREE.MeshStandardMaterial({ map: tickTex, roughness: 0.42, metalness: 0.6 }); return m; })(),
      matStd(0x9aa0a8, { roughness: 0.4, metalness: 0.7 }),
    ]
  );
  body.position.y = T / 2;
  g.add(body);
  g.position.set(x, BENCH_Y, z);
  g.rotation.y = rotY;
  const sh = shadowPatch(1.9, 0.5, 0.26);
  sh.position.set(x, BENCH_Y + 0.004, z);
  sh.rotation.z = -rotY;
  scene.add(sh);
  return g;
}

/* ---------- 悬浮角度刻度环（分子展示区装饰：径向刻度盘 + 金属圈，缓旋） ---------- */

function makeAngleRing() {
  const g = new THREE.Group();
  const tex = canvasTex(512, 512, (ctx, cw) => {
    const cx = cw / 2;
    ctx.clearRect(0, 0, cw, cw);
    ctx.translate(cx, cx);
    for (let deg = 0; deg < 360; deg += 3) {
      const major = deg % 30 === 0, mid = deg % 15 === 0;
      const a = deg * DEG;
      const r1 = 248, r0 = r1 - (major ? 20 : mid ? 13 : 7);
      ctx.strokeStyle = major ? 'rgba(205,228,238,0.85)' : 'rgba(205,228,238,0.42)';
      ctx.lineWidth = major ? 3 : 1.6;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r0, Math.sin(a) * r0);
      ctx.lineTo(Math.cos(a) * r1, Math.sin(a) * r1);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(205,228,238,0.8)';
    ctx.font = '600 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let deg = 0; deg < 360; deg += 30) {
      const a = deg * DEG;
      ctx.fillText(String(deg), Math.cos(a) * 205, Math.sin(a) * 205);
    }
  });
  const ring = new THREE.Mesh(
    new THREE.PlaneGeometry(7.4, 7.4),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.4, depthWrite: false, side: THREE.DoubleSide })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.renderOrder = 2;
  g.add(ring);
  /* 外缘金属细圈 */
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(3.62, 0.018, 8, 96),
    matStd(C.brass, { roughness: 0.32, metalness: 0.85 })
  );
  rim.rotation.x = Math.PI / 2;
  g.add(rim);
  g.position.y = BENCH_Y + 0.42;
  return g;
}
const angleRing = makeAngleRing();
scene.add(angleRing);

/* 道具落位（左：模型盒 + 速查卡；右：双烧杯 + 直尺） */
scene.add(buildBench());
scene.add(makeModelBox(-4.6, -1.1, 0.42));
scene.add(makeVseprCard(-4.9, 0.9, -0.3));
scene.add(makeBeaker(4.7, -1.4, -0.5, '#4d8fa8', 0.42));
scene.add(makeBeaker(5.3, -0.7, 0.35, null, 0));
scene.add(makeRuler(4.6, 1.2, 0.9));

/* ================= 分子建模工厂（模型套件工艺：烤漆球 + 金属键棍 + 锥台插头） ================= */

const atomGeo = new THREE.SphereGeometry(0.5, 40, 28);
const stickGeo = new THREE.CylinderGeometry(1, 1, 1, 14);
const plugGeo = new THREE.CylinderGeometry(0.085, 0.05, 0.2, 10);
const atomMats = {};
function atomMat(e) {
  if (!atomMats[e]) {
    atomMats[e] = matCoat(EL[e].c, { roughness: 0.3, metalness: 0.05, clearcoat: 1, clearcoatRoughness: 0.2 });
  }
  return atomMats[e];
}
const stickMat = matStd(C.bond, { roughness: 0.32, metalness: 0.78 });
const plugMat = matStd(C.plug, { roughness: 0.5, metalness: 0.35 });

/* 孤对泪滴（Lathe 轮廓加密，辉光材质 + 呼吸脉冲登记） */
const lpGeo = new THREE.LatheGeometry(
  [[0.001, 0], [0.24, 0.045], [0.315, 0.24], [0.30, 0.47], [0.185, 0.66], [0.07, 0.78], [0.001, 0.82]].map((p) => new THREE.Vector2(p[0], p[1])), 28);
const lpMat = matGlow(C.lpGlow, 0.35, { opacity: 0.46, roughness: 0.4 });
lpMat.side = THREE.DoubleSide;
lpMat.depthWrite = false;
const glowList = [];
registerGlow(glowList, lpMat, 0.35, 1.8);

/* 共享几何登记表（disposeObj 跳过这些） */
const SHARED_GEOS = new Set([atomGeo, stickGeo, plugGeo, lpGeo]);
const SHARED_MATS = new Set([stickMat, plugMat, lpMat]);

function orientY(mesh, dir) { mesh.quaternion.setFromUnitVectors(V(0, 1, 0), dir.clone().normalize()); }

/* 细圈线（XZ 平面圆环，用于等值线/轨道节面），轴向 +Y，可直接 orientY */
function ringLine(r, color, segments = 64, opacity = 0.5) {
  const pts = [];
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * TAU;
    pts.push(V(Math.cos(a) * r, 0, Math.sin(a) * r));
  }
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color, transparent: true, opacity }));
  return line;
}

function addStick(g, pa, pb, order, thickness = 0.055) {
  const dir = pb.clone().sub(pa);
  const len = dir.length();
  dir.normalize();
  const up = Math.abs(dir.y) < 0.95 ? V(0, 1, 0) : V(1, 0, 0);
  const perp = cp(dir, up).normalize();
  const off = order === 2 ? 0.105 : order === 3 ? 0.14 : 0;
  const offs = order === 2 ? [-off, off] : order === 3 ? [0, -off, off] : [0];
  offs.forEach((o) => {
    const m = new THREE.Mesh(stickGeo, stickMat);
    m.scale.set(thickness, len, thickness);
    m.position.copy(pa).add(pb).multiplyScalar(0.5).addScaledVector(perp, o);
    orientY(m, dir);
    g.add(m);
  });
  return { dir, len, perp };
}

/* 键端插头（锥台座圈骑在原子球表面：宽端朝外，窄端埋向球心，键棍插进座的机械观感） */
function addPlug(g, pos, dir, rAtom) {
  const m = new THREE.Mesh(plugGeo, plugMat);
  m.position.copy(pos).addScaledVector(dir, rAtom * 0.92);
  orientY(m, dir);
  g.add(m);
  return m;
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

/* 偶极箭头（锥头 + 柱身，材料随色缓存） */
const arrowMats = {};
function arrowMat(color) {
  if (!arrowMats[color]) {
    arrowMats[color] = matStd(color, { roughness: 0.35, metalness: 0.1 });
    arrowMats[color].emissive = new THREE.Color(color);
    arrowMats[color].emissiveIntensity = 0.28;
  }
  return arrowMats[color];
}
function addArrow(g, from, to, color, r = 0.042) {
  const mat = arrowMat(color);
  const dir = to.clone().sub(from);
  const len = dir.length();
  if (len < 0.18) return;
  dir.normalize();
  const headLen = Math.min(0.24, len * 0.4);
  const shaftLen = len - headLen;
  const shaft = new THREE.Mesh(stickGeo, mat);
  shaft.scale.set(r, shaftLen, r);
  shaft.position.copy(from).addScaledVector(dir, shaftLen / 2);
  orientY(shaft, dir);
  const head = new THREE.Mesh(new THREE.ConeGeometry(r * 2.6, headLen, 16), mat);
  head.position.copy(from).addScaledVector(dir, shaftLen + headLen / 2);
  orientY(head, dir);
  g.add(shaft, head);
}

/* 帧动画登记表（clearMol 时清空，避免引用已释放网格） */
const animated = [];

/* 路易斯点对（两颗小辉点垂直于孤对方向并排） */
const lpDotGeo = new THREE.SphereGeometry(0.05, 12, 10);
SHARED_GEOS.add(lpDotGeo);
function addLewisDots(g, pos, dir, rAtom) {
  const a = dir.clone().normalize();
  const up = Math.abs(a.y) < 0.9 ? V(0, 1, 0) : V(1, 0, 0);
  const u = cp(a, up).normalize();
  const base = pos.clone().addScaledVector(a, rAtom * 0.72 + 0.14);
  [1, -1].forEach((s) => {
    const d = new THREE.Mesh(lpDotGeo, lpMat);
    d.position.copy(base).addScaledVector(u, s * 0.075);
    g.add(d);
  });
}

/* ================= 分子搭建 ================= */

/* 空间填充半径（vdW，Å）——分子库「空间填充」视图用 */
const VDW = { H: 1.2, Be: 1.53, B: 1.92, C: 1.7, N: 1.55, O: 1.52, F: 1.47, P: 1.8, S: 1.8, Cl: 1.75, Br: 1.85, I: 1.98, Xe: 2.16 };

function buildMol(def, o = {}) {
  const mode = o.mode || 'stick';          // stick 球棍 | space 空间填充 | lewis 路易斯
  const g = new THREE.Group();
  const meshes = [];
  def.atoms.forEach((a, i) => {
    const m = new THREE.Mesh(atomGeo, atomMat(a.e));
    m.position.copy(a.p);
    const baseR = EL[a.e].r / 0.5;
    if (mode === 'space') m.scale.setScalar((VDW[a.e] || EL[a.e].r) * 0.62 / 0.5);
    else m.scale.setScalar(baseR);
    m.userData.atom = i;
    g.add(m);
    meshes.push(m);
    if (o.labels && mode === 'stick') {
      const out = a.p.clone().sub(o.labelFrom || V(0, 0, 0));
      if (out.lengthSq() < 1e-6) out.set(0, 1, 0);
      out.normalize().multiplyScalar(EL[a.e].r + 0.26);
      addLabel(g, a.e, a.p.clone().add(out), '#f4f7fb', 0.0075);
    }
  });
  if (mode !== 'space') {
    def.bonds.forEach((b) => {
      const pa = def.atoms[b.a].p, pb = def.atoms[b.b].p;
      addStick(g, pa, pb, b.o, mode === 'lewis' ? 0.032 : 0.055);
      if (mode === 'stick') {
        const dirB = pb.clone().sub(pa).normalize();
        addPlug(g, pa, dirB, EL[def.atoms[b.a].e].r);
        addPlug(g, pb, dirB.clone().negate(), EL[def.atoms[b.b].e].r);
      }
    });
  }
  const showLP = mode === 'lewis' ? true : (o.lp !== false);
  if (showLP && def.lp) {
    def.lp.forEach((d) => {
      if (mode === 'lewis') addLewisDots(g, def.atoms[d.i].p, d.dir, EL[def.atoms[d.i].e].r);
      else addLonePair(g, def.atoms[d.i].p, d.dir, EL[def.atoms[d.i].e].r);
    });
  }
  return { g, meshes };
}

function disposeObj(root) {
  root.traverse((o) => {
    if (o.geometry && !SHARED_GEOS.has(o.geometry)) o.geometry.dispose();
    if (o.material) {
      (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => {
        if (!SHARED_MATS.has(m) && !Object.values(atomMats).includes(m) && !Object.values(arrowMats).includes(m)) {
          if (m.map) m.map.dispose();
          m.dispose();
        }
      });
    }
  });
}
function clearMol() {
  animated.length = 0;
  SIM.active = false;
  molRoot.rotation.set(0, 0, 0);
  while (molRoot.children.length) {
    const c = molRoot.children[0];
    molRoot.remove(c);
    disposeObj(c);
  }
}

/* 相机预置（各章 enter 更新；重置视角工具读这里） */
const st = {
  axN: 4, axM: 0,          // 沙盒/构型章：成键数、孤对数
  kRatio: 1,               // 键角章：孤对斥力倍率
  angleKey: 'NH3',
  hybKey: 'sp3',
  polarKey: 'H2O',
  octKey: 'SF6',
  chirKey: 'chiral',
  libKey: 'H2O',
  libMode: 'stick',        // 分子库视图：stick | space | lewis
  libSpin: false,          // 分子库自动旋转
  align: null,             // 手性章动画状态
  lpPulse: 0,              // 孤对脉冲（键角章拖滑杆时触发）
  camPreset: [[3.2, 3.2, 8], [0, 0, 0]],
};

function fitView(def, extra = 0) {
  const box = new THREE.Box3();
  def.atoms.forEach((a) => box.expandByPoint(a.p));
  def.lp && def.lp.forEach((d) => box.expandByPoint(def.atoms[d.i].p.clone().addScaledVector(d.dir, 1.1)));
  const c = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3()).length();
  const dist = clamp(size * 1.55 + 2.2 + extra, 3.4, 40);
  app.setCamera([dist * 0.32, dist * 0.42, dist * 0.85], [c.x, c.y, c.z]);
  st.camPreset = [[dist * 0.32, dist * 0.42, dist * 0.85], [c.x, c.y, c.z]];
}

/* ================= 帧循环 / 补间 ================= */

const tweens = [];
function addTween(dur, fn, done) { tweens.push({ t: 0, dur, fn, done }); }
const ease = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);

let labReady = false;
let clockT = 0;

app.onFrame((dtRaw) => {
  const dt = Math.min(dtRaw, 0.05);
  if (!labReady) return;
  clockT += dt;
  /* 球面斥力物理沙盒（章节一）：步进 + 状态读数回写 */
  if (SIM.active) {
    simStep(dt);
    hudSand.set('status', SIM.msg);
  }
  /* 孤对辉光呼吸（全局共享材质，一次驱动全部泪滴） */
  const pulse = 0.35 + Math.sin(clockT * 2.2) * 0.08 + st.lpPulse * 0.9;
  lpMat.emissiveIntensity = Math.min(pulse, 1.4);
  st.lpPulse = Math.max(0, st.lpPulse - dt * 2.2);
  /* 刻度环缓旋 */
  angleRing.rotation.y += dt * 0.06;
  /* 分子库自动旋转（章节八） */
  if (chapterIdx === 7 && st.libSpin) molRoot.rotation.y += dt * 0.45;
  /* 气球错相呼吸摆动等逐帧动画 */
  for (const a of animated) a(clockT, dt);
  for (let i = tweens.length - 1; i >= 0; i--) {
    const tw = tweens[i];
    tw.t += dt;
    const k = Math.min(tw.t / tw.dur, 1);
    tw.fn(k);
    if (k >= 1) { tweens.splice(i, 1); if (tw.done) tw.done(); }
  }
  tickAlign(dt);
});

/* ================= HUD / 图例（读数入右栏，图例浮中栏左下） ================= */

const hudWrap = document.getElementById('lcData');
const hudSand = makeHUD(hudWrap, [['total', '价层电子对'], ['eg', '电子对构型'], ['mg', '分子构型'], ['pos', '孤对占位'], ['status', '排布状态']]);
const hudAxe = makeHUD(hudWrap, [['axe', 'AXE 类'], ['eg', '电子对构型'], ['mg', '分子构型']]);
const hudAngle = makeHUD(hudWrap, [['mol', '分子'], ['ang', '模型键角'], ['real', '实测键角'], ['why', '成因']]);
const hudHyb = makeHUD(hudWrap, [['hyb', '杂化类型'], ['parts', '参与轨道'], ['geo', '空间构型'], ['ex', '典型分子']]);
const hudPolar = makeHUD(hudWrap, [['mol', '分子'], ['net', '净偶极（模型）'], ['mu', '实验参考 μ'], ['concl', '结论']]);
const hudOct = makeHUD(hudWrap, [['mol', '分子'], ['axe', 'AXE·构型'], ['lp', '孤对'], ['note', '要点']]);
const hudChir = makeHUD(hudWrap, [['mol', '分子'], ['sym', '对称性'], ['try', '重合尝试']]);
const hudLib = makeHUD(hudWrap, [['mol', '当前分子'], ['mg', '分子构型'], ['idx', '编号']]);
const hudQuiz = makeHUD(hudWrap, [['tip', '提示']]);
const HUDS = [hudSand, hudAxe, hudAngle, hudHyb, hudPolar, hudOct, hudChir, hudLib, hudQuiz];

let legendEl = null;
function setLegend(rows) {
  if (!rows) {
    if (legendEl) { legendEl.remove(); legendEl = null; }
    return;
  }
  if (!legendEl) {
    legendEl = document.createElement('div');
    legendEl.className = 'legend';
    stage.appendChild(legendEl);
  }
  legendEl.innerHTML = '';
  for (const row of rows) {
    const r = document.createElement('div');
    r.className = 'lg-row';
    const sw = document.createElement('span');
    sw.className = 'sw dot';
    sw.style.background = row[0];
    r.appendChild(sw);
    r.appendChild(document.createTextNode(row[1]));
    legendEl.appendChild(r);
  }
}

const ctl = createControlsPanel(document.getElementById('controls'));
let activeSectionCleanup = null;

/* ================= 浮窗折叠体系（对照表 / 分子列表 / 信息卡 → 40px 圆徽标） ================= */

const FLOAT_KEY = { table: 'vsepr.foldTable', lib: 'vsepr.foldLib', info: 'vsepr.foldInfo' };
const floatFolded = { table: false, lib: false, info: false };
try {
  floatFolded.table = localStorage.getItem(FLOAT_KEY.table) === '1';
  floatFolded.lib = localStorage.getItem(FLOAT_KEY.lib) === '1';
  floatFolded.info = localStorage.getItem(FLOAT_KEY.info) === '1';
} catch (e) { /* localStorage 不可用时仅本次会话生效 */ }

/* 浮窗通用头部（标题 + 折叠钮）与徽标；kind ∈ table/lib/info */
function decorateFloat(el, kind, title, badgeText, anchorRight) {
  let head = null;
  const foldBtn = document.createElement('button');
  foldBtn.type = 'button';
  foldBtn.className = 'fold-btn float-fold';
  foldBtn.setAttribute('aria-label', '收起' + (title || '浮窗'));
  foldBtn.setAttribute('aria-expanded', 'true');
  foldBtn.textContent = '−';
  if (title) {
    head = document.createElement('div');
    head.className = 'float-head';
    const tt = document.createElement('b');
    tt.textContent = title;
    head.appendChild(tt);
    head.appendChild(foldBtn);
    el.insertBefore(head, el.firstChild);
  } else {
    /* 无独立头部（信息卡自有渐变头）：折叠钮塞进既有头部末尾 */
    const host = el.querySelector('.vspr-info-head');
    host.appendChild(foldBtn);
  }
  const badge = document.createElement('button');
  badge.type = 'button';
  badge.className = 'float-badge';
  badge.setAttribute('aria-label', '展开' + (title || '浮窗'));
  badge.textContent = badgeText;
  el.appendChild(badge);
  function apply() {
    el.classList.toggle('folded', floatFolded[kind]);
    foldBtn.setAttribute('aria-expanded', String(!floatFolded[kind]));
  }
  foldBtn.addEventListener('click', () => {
    floatFolded[kind] = true;
    try { localStorage.setItem(FLOAT_KEY[kind], '1'); } catch (e) { /* 忽略 */ }
    apply();
  });
  badge.addEventListener('click', () => {
    floatFolded[kind] = false;
    try { localStorage.setItem(FLOAT_KEY[kind], '0'); } catch (e) { /* 忽略 */ }
    apply();
  });
  if (anchorRight) el.classList.add('anchor-r');
  apply();
  return { head, badge, apply };
}

/* ================= 章节一：价层电子对互斥（球面斥力物理沙盒） =================
 * 模型：n+m 个电子对视为带电质点约束在单位球面上，按
 *   斥力权重 孤对-孤对 1.45 ＞ 孤对-成键 1.20 ＞ 成键-成键 1.00
 * 两两排斥、切向积分 + 阻尼，自动弹开找到能量最低排布（直线/三角/四面体/双锥/八面体）。
 * 「打乱」重新随机撒点；收敛判据：平均速率低且能量接近理想值 → 已达能量最低；
 * 卡在局部极小（能量高于理想排布）时施加热扰动（与原版行为语义等价）。
 */

const SIM = {
  active: false,
  pts: [], vel: [], kinds: [],      // kinds: 1=孤对 0=成键
  balloons: [], tags: [], linkGeo: null, linkLine: null,
  idealE: 1, kicks: 0, msg: '电子对相互排斥，正在寻找平衡…',
};

function simEnergy() {
  let e = 0;
  for (let i = 0; i < SIM.pts.length; i++) {
    for (let j = i + 1; j < SIM.pts.length; j++) {
      const w = SIM.kinds[i] && SIM.kinds[j] ? 1.45 : (SIM.kinds[i] || SIM.kinds[j]) ? 1.2 : 1.0;
      e += w / Math.max(SIM.pts[i].distanceTo(SIM.pts[j]), 1e-4);
    }
  }
  return e;
}

function simIdealEnergy(total, m) {
  const dirs = GEOM[total].dirs.map(nd);
  const kinds = Array.from({ length: total }, (_, i) => (i < m ? 1 : 0));
  let e = 0;
  for (let i = 0; i < total; i++) {
    for (let j = i + 1; j < total; j++) {
      const w = kinds[i] && kinds[j] ? 1.45 : (kinds[i] || kinds[j]) ? 1.2 : 1.0;
      e += w / Math.max(dirs[i].distanceTo(dirs[j]), 1e-4);
    }
  }
  return e;
}

function simScatter(n, m) {
  SIM.pts = []; SIM.vel = []; SIM.kinds = [];
  for (let i = 0; i < n + m; i++) {
    /* 拒绝采样保证初始不重叠 */
    let p = null;
    for (let t = 0; t < 60; t++) {
      const c = V(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1);
      if (c.lengthSq() > 0.05 && c.lengthSq() < 1) { p = c.normalize(); break; }
    }
    if (!p) p = V(0, 1, 0);
    SIM.pts.push(p);
    SIM.vel.push(V((Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.2));
    SIM.kinds.push(i < m ? 1 : 0);
  }
  SIM.idealE = simIdealEnergy(n + m, m);
  SIM.kicks = 0;
  SIM.msg = '电子对相互排斥，正在寻找平衡…';
}

function simHeat(dt) {
  for (const v of SIM.vel) v.add(V((Math.random() - 0.5) * 3, (Math.random() - 0.5) * 3, (Math.random() - 0.5) * 3));
  SIM.msg = '困在局部极小，施加热扰动…';
}

function simStep(dt) {
  const N = SIM.pts.length;
  const vAvgAcc = { s: 0 };
  for (let i = 0; i < N; i++) {
    const f = V(0, 0, 0);
    for (let j = 0; j < N; j++) {
      if (i === j) continue;
      const w = SIM.kinds[i] && SIM.kinds[j] ? 1.45 : (SIM.kinds[i] || SIM.kinds[j]) ? 1.2 : 1.0;
      const d = SIM.pts[i].clone().sub(SIM.pts[j]);
      const dist = Math.max(d.length(), 1e-4);
      f.addScaledVector(d.divideScalar(dist * dist * dist), w);
    }
    /* 切向分量（约束在球面） */
    const radial = f.dot(SIM.pts[i]);
    f.addScaledVector(SIM.pts[i], -radial);
    SIM.vel[i].addScaledVector(f, 2.2 * dt);
    SIM.vel[i].multiplyScalar(0.82);
    if (SIM.vel[i].length() > 2.5) SIM.vel[i].setLength(2.5);
    SIM.pts[i].addScaledVector(SIM.vel[i], dt).normalize();
    vAvgAcc.s += SIM.vel[i].length();
  }
  const vAvg = vAvgAcc.s / N;
  const E = simEnergy();
  const gap = (E - SIM.idealE) / Math.max(SIM.idealE, 1e-6);
  if (vAvg < 0.03 && gap > 0.015) {
    SIM.kicks++;
    if (SIM.kicks <= 8) simHeat(dt);
    else { SIM.msg = '已稳定在能量最低排布（近似解）'; }
  } else if (vAvg < 0.03 && gap <= 0.015) {
    SIM.msg = '已稳定在能量最低排布';
  }
}

/* 气球体：Lathe 轮廓（底部结头 + 泪滴球身），橡胶 sheen 材质按色缓存 */
const balloonGeo = new THREE.LatheGeometry(
  [[0.001, 0], [0.05, 0.005], [0.032, 0.022], [0.062, 0.055], [0.13, 0.12], [0.225, 0.3], [0.272, 0.55], [0.286, 0.8], [0.26, 1.02], [0.19, 1.18], [0.08, 1.29], [0.001, 1.32]].map((p) => new THREE.Vector2(p[0], p[1])), 26);
SHARED_GEOS.add(balloonGeo);
const balloonMats = {};
function balloonMat(color, isLP) {
  const key = color + (isLP ? 'L' : 'B');
  if (!balloonMats[key]) {
    const m = matSheen(color, {
      roughness: 0.42, sheen: 0.68, sheenColor: new THREE.Color(color).lerp(new THREE.Color(0xffffff), 0.45),
      opacity: isLP ? 0.94 : 0.9,
    });
    balloonMats[key] = m;
  }
  return balloonMats[key];
}

function buildSandbox(n, m, showLP, showLines) {
  clearMol();
  const g = new THREE.Group();
  const total = n + m;
  simScatter(n, m);
  /* 中心原子节点（深色烤漆小球 + 金属座圈） */
  const core = new THREE.Mesh(atomGeo, atomMat('C'));
  core.scale.setScalar(0.34);
  g.add(core);
  const seat = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.035, 10, 40), plugMat);
  seat.rotation.x = Math.PI / 2;
  g.add(seat);
  /* 气球 + 标签（每帧跟随物理点位） */
  SIM.balloons = []; SIM.tags = [];
  for (let i = 0; i < total; i++) {
    const isLP = SIM.kinds[i] === 1;
    if (!isLP || showLP) {
      const b = new THREE.Mesh(balloonGeo, balloonMat(isLP ? C.balloonLP : C.balloonBond, isLP));
      b.scale.set(1.18, 1.22, 1.18);
      g.add(b);
      SIM.balloons.push(b);
      const sp = makeTextSprite(isLP ? '孤对' : '成键', { fontSize: 34, color: isLP ? '#ffcf8a' : '#bcd6f2', scale: 0.007 });
      g.add(sp);
      SIM.tags.push(sp);
    } else {
      SIM.balloons.push(null);
      SIM.tags.push(null);
    }
  }
  /* 斥力连线（颜色越暖斥力越强；每帧跟随物理点位） */
  if (showLines) {
    const CL = { 0: new THREE.Color(0x5f9bd6), 1: new THREE.Color(0xe59b3c), 2: new THREE.Color(0xe05a4b) };
    const pairs = [];
    const cols = [];
    for (let i = 0; i < total; i++) {
      for (let j = i + 1; j < total; j++) {
        pairs.push([i, j]);
        const t = SIM.kinds[i] + SIM.kinds[j];
        cols.push(CL[t], CL[t]);
      }
    }
    const geoL = new THREE.BufferGeometry();
    geoL.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(pairs.length * 6), 3));
    geoL.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(cols.flatMap((c) => [c.r, c.g, c.b])), 3));
    const line = new THREE.LineSegments(geoL, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.55 }));
    g.add(line);
    SIM.linkGeo = geoL;
    SIM.linkPairs = pairs;
  } else {
    SIM.linkGeo = null;
    SIM.linkPairs = null;
  }
  molRoot.add(g);
  SIM.active = true;
  /* 每帧把物理解写回气球/标签/连线 */
  animated.push(() => {
    for (let i = 0; i < SIM.pts.length; i++) {
      const p = SIM.pts[i];
      if (SIM.balloons[i]) {
        SIM.balloons[i].position.copy(p).multiplyScalar(0.42);
        orientY(SIM.balloons[i], p);
      }
      if (SIM.tags[i]) SIM.tags[i].position.copy(p).multiplyScalar(2.1);
    }
    if (SIM.linkGeo && SIM.linkPairs) {
      const arr = SIM.linkGeo.attributes.position.array;
      SIM.linkPairs.forEach(([i, j], k) => {
        arr[k * 6] = SIM.pts[i].x * 0.72; arr[k * 6 + 1] = SIM.pts[i].y * 0.72; arr[k * 6 + 2] = SIM.pts[i].z * 0.72;
        arr[k * 6 + 3] = SIM.pts[j].x * 0.72; arr[k * 6 + 4] = SIM.pts[j].y * 0.72; arr[k * 6 + 5] = SIM.pts[j].z * 0.72;
      });
      SIM.linkGeo.attributes.position.needsUpdate = true;
    }
  });
  const v = VSEPR[`${n}-${m}`];
  hudSand.set('total', `${total} 对（成键 ${n} + 孤对 ${m}）`);
  hudSand.set('eg', GEOM[total].name);
  hudSand.set('mg', v ? v.mg : '—');
  const posNote = total === 5 ? '孤对优先占赤道位' : total === 6 ? '孤对互成对位（180°）' : '—';
  hudSand.set('pos', posNote);
  hudSand.set('status', SIM.msg);
}

function sandScramble() {
  if (!SIM.active) return;
  simScatter(st.axN, st.axM);
  hudSand.set('status', SIM.msg);
}

function sandEnter() {
  clearMol();
  app.setCamera([3.6, 3.8, 8.8], [0, 0.15, 0]);
  st.camPreset = [[3.6, 3.8, 8.8], [0, 0.15, 0]];
  HUDS.forEach((h) => { h.el.style.display = 'none'; });
  hudSand.el.style.display = '';
  setLegend([
    ['#5f9bd6', '成键电子对（蓝气球）'],
    ['#ffa03a', '孤对电子对（橙气球，斥力更强）'],
    ['#e05a4b', '斥力连线（越暖斥力越强）'],
  ]);
  ctl.clear();
  const nCtl = ctl.slider({
    label: '成键电子对 n', min: 2, max: 6, step: 1, value: st.axN,
    fmt: (v) => String(v), onInput: (v) => { st.axN = v; clampM(); rebuild(); },
  });
  const mCtl = ctl.slider({
    label: '孤对电子对 m', min: 0, max: 4, step: 1, value: st.axM,
    fmt: (v) => String(v), onInput: (v) => { st.axM = v; rebuild(); },
  });
  /* 快速选择：13 种常见 AXnEm 组合一键预设（原版功能块 1:1） */
  const presetWrap = document.createElement('div');
  presetWrap.className = 'ctl-presets';
  const presetLabel = document.createElement('span');
  presetLabel.className = 'ctl-presets-h';
  presetLabel.textContent = '快速选择';
  presetWrap.appendChild(presetLabel);
  const presetBtns = VSEPR_ORDER.map((k) => {
    const [n, m] = k.split('-').map(Number);
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'ctl-btn preset-btn';
    b.textContent = `AX${n}${m ? 'E' + m : ''}`;
    b.addEventListener('click', () => {
      st.axN = n; st.axM = m;
      nCtl.set(n); mCtl.set(m);
      rebuild();
    });
    presetWrap.appendChild(b);
    return { k, b };
  });
  ctl.el.appendChild(presetWrap);
  let showLP = true, showLines = false;
  ctl.toggle({ label: '显示孤对（橙）', value: true, onChange: (v) => { showLP = v; rebuild(); } });
  ctl.toggle({ label: '显示斥力连线', value: false, onChange: (v) => { showLines = v; rebuild(); } });
  ctl.button({ label: '🎲 打乱（Space）', onClick: () => sandScramble() });
  ctl.button({ label: '⌂ 复位视角', onClick: () => app.setCamera(...st.camPreset) });
  function clampM() {
    const mx = Math.min(4, 6 - st.axN);
    if (st.axM > mx) { st.axM = mx; mCtl.set(mx); }
  }
  function rebuild() {
    clampM();
    presetBtns.forEach(({ k, b }) => b.classList.toggle('active', k === `${st.axN}-${st.axM}`));
    buildSandbox(st.axN, st.axM, showLP, showLines);
  }
  rebuild();
}

/* ================= 章节二：电子对构型与分子构型 ================= */

let axeTableEl = null;
let axeDecor = null;

/* 电子对构型多面体棱边表（凸包棱：按 GEOM dirs 序）——AXE 章多面体开关用 */
const EG_EDGES = {
  2: [[0, 1]],
  3: [[0, 1], [1, 2], [2, 0]],
  4: [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]],
  5: [[0, 1], [1, 2], [2, 0], [0, 3], [1, 3], [2, 3], [0, 4], [1, 4], [2, 4]],
  6: [[2, 4], [4, 3], [3, 5], [5, 2], [0, 2], [0, 4], [0, 3], [0, 5], [1, 2], [1, 4], [1, 3], [1, 5]],
  7: [[2, 3], [3, 4], [4, 5], [5, 6], [6, 2], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [1, 2], [1, 3], [1, 4], [1, 5], [1, 6]],
};

function buildAXEModel(n, m, showLP, labels, showPoly) {
  clearMol();
  const g = new THREE.Group();
  const total = n + m;
  const geo = GEOM[total];
  const dirs = geo.dirs.map(nd);
  const lpSet = new Set(Array.from({ length: m }, (_, i) => i));
  // 电子对构型多面体（凸包棱线框，绿色系细线）
  if (showPoly) {
    const pts = [];
    (EG_EDGES[total] || []).forEach(([a, b]) => {
      pts.push(dirs[a].clone().multiplyScalar(1.85), dirs[b].clone().multiplyScalar(1.85));
    });
    const geoE = new THREE.BufferGeometry();
    geoE.setAttribute('position', new THREE.Float32BufferAttribute(pts.flatMap((v) => [v.x, v.y, v.z]), 3));
    const poly = new THREE.LineSegments(geoE, new THREE.LineBasicMaterial({ color: 0x7fd8a8, transparent: true, opacity: 0.5 }));
    poly.name = 'polyLines';
    g.add(poly);
  }
  // 中心原子
  const cm = new THREE.Mesh(atomGeo, atomMat('S'));
  cm.scale.setScalar(0.86);
  g.add(cm);
  const seat = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.04, 10, 44), plugMat);
  seat.rotation.x = Math.PI / 2;
  g.add(seat);
  dirs.forEach((d, i) => {
    if (!lpSet.has(i)) {
      const a = new THREE.Mesh(atomGeo, matCoat(0x8fb6d9, { roughness: 0.34, clearcoatRoughness: 0.22 }));
      a.scale.setScalar(0.78);
      a.position.copy(d).multiplyScalar(1.85);
      g.add(a);
      addPlug(g, V(0, 0, 0), d, 0.9);
      if (labels) addLabel(g, `X${i - Array.from(lpSet).filter((q) => q < i).length + 1}`, d.clone().multiplyScalar(2.5), '#cfe2f5', 0.007);
    } else if (showLP) {
      addLonePair(g, V(0, 0, 0), d, 0.62);
    }
  });
  const v = VSEPR[`${n}-${m}`];
  const title = makeTextSprite(showLP ? `电子对构型：${geo.name}` : `电子对构型（${geo.name}，孤对不可见）`, { fontSize: 40, color: '#e6ecf4', scale: 0.009 });
  title.position.set(0, 3.1, 0);
  g.add(title);
  const badge = makeTextSprite(`分子构型：${v.mg}`, { fontSize: 44, color: '#ffc86b', scale: 0.010 });
  badge.position.set(0, -2.9, 0);
  g.add(badge);
  molRoot.add(g);
  hudAxe.set('axe', `AX${n}E${m}`);
  hudAxe.set('eg', geo.name);
  hudAxe.set('mg', v.mg);
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
  const tableWrap = document.createElement('div');
  tableWrap.innerHTML = `<table><caption>AXnEm 对照表（点击行在 3D 中查看该构型）</caption>
    <thead><tr><th>类型</th><th>电子对构型</th><th>分子构型</th><th>键角</th><th>杂化</th><th>实例</th></tr></thead><tbody>${rows}</tbody></table>`;
  axeTableEl.appendChild(tableWrap);
  axeTableEl.querySelectorAll('tbody tr').forEach((tr) => {
    tr.addEventListener('click', () => {
      const [n, m] = tr.dataset.k.split('-').map(Number);
      onPick(n, m);
    });
  });
  axeDecor = decorateFloat(axeTableEl, 'table', 'AXnEm 对照表', '表');
  stage.appendChild(axeTableEl);
  axeTableEl.style.display = '';
}

function axeEnter() {
  clearMol();
  app.setCamera([3.6, 3.2, 8.4], [0, 0, 0]);
  st.camPreset = [[3.6, 3.2, 8.4], [0, 0, 0]];
  HUDS.forEach((h) => { h.el.style.display = 'none'; });
  hudAxe.el.style.display = '';
  setLegend(null);
  ctl.clear();
  const nCtl = ctl.slider({
    label: '成键原子数 n', min: 2, max: 6, step: 1, value: st.axN,
    fmt: (v) => String(v), onInput: (v) => { st.axN = v; clampM(); rebuild(); },
  });
  const mCtl = ctl.slider({
    label: '孤对数 m', min: 0, max: 4, step: 1, value: st.axM,
    fmt: (v) => String(v), onInput: (v) => { st.axM = v; clampM(); rebuild(); },
  });
  let showLP = true, labels = true, showPoly = true;
  ctl.toggle({ label: '隐藏孤对电子', value: false, onChange: (v) => { showLP = !v; rebuild(); } });
  ctl.toggle({ label: '原子标签', value: true, onChange: (v) => { labels = v; rebuild(); } });
  ctl.toggle({ label: '电子对多面体', value: true, onChange: (v) => { showPoly = v; rebuild(); } });
  ctl.toggle({
    label: 'AXnEm 对照表', value: false,
    onChange: (v) => { if (v) ensureAxeTable(pick); else if (axeTableEl) axeTableEl.style.display = 'none'; },
  });
  ctl.button({ label: '⌂ 复位视角', onClick: () => app.setCamera(...st.camPreset) });
  function clampM() {
    const mx = Math.min(4, 6 - st.axN);
    if (st.axM > mx) { st.axM = mx; mCtl.set(mx); }
  }
  function pick(n, m) { st.axN = n; st.axM = m; nCtl.set(n); mCtl.set(m); rebuild(); }
  function rebuild() { clampM(); buildAXEModel(st.axN, st.axM, showLP, labels, showPoly); }
  rebuild();
  activeSectionCleanup = () => { if (axeTableEl) axeTableEl.style.display = 'none'; };
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

/* 实测键角参考值（教科书值）——与模型键角对照显示 */
const REAL_ANGLE = { CH4: '109°28′', NH3: '107°', H2O: '104.5°' };

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
  const title = makeTextSprite(`${key}  模型键角 = ${shown}`, { fontSize: 42, color: '#e6ecf4', scale: 0.010 });
  title.position.set(0, 2.6, 0);
  g.add(title);
  const real = makeTextSprite(`实测键角：${REAL_ANGLE[key]}`, { fontSize: 36, color: '#9fd8b8', scale: 0.0085 });
  real.position.set(0, 2.1, 0);
  g.add(real);
  molRoot.add(g);
  hudAngle.set('mol', `${key}（${{ CH4: '甲烷', NH3: '氨', H2O: '水' }[key]}，${m} 对孤对）`);
  hudAngle.set('ang', shown);
  hudAngle.set('real', REAL_ANGLE[key]);
  hudAngle.set('why', m === 0 ? '无孤对 → 理想四面体角' : `孤对斥力把键角从 109.5° 压到 ${shown}`);
}

function angleEnter() {
  clearMol();
  app.setCamera([2.7, 2.7, 6.6], [0, 0.1, 0]);
  st.camPreset = [[2.7, 2.7, 6.6], [0, 0.1, 0]];
  HUDS.forEach((h) => { h.el.style.display = 'none'; });
  hudAngle.el.style.display = '';
  setLegend(null);
  ctl.clear();
  ctl.seg({
    options: [{ label: 'CH₄', value: 'CH4' }, { label: 'NH₃', value: 'NH3' }, { label: 'H₂O', value: 'H2O' }],
    value: st.angleKey,
    onChange: (v) => { st.angleKey = v; rebuild(); },
  });
  ctl.slider({
    label: '孤对斥力倍率 k', min: 1, max: 1.6, step: 0.05, value: st.kRatio,
    fmt: (v) => v.toFixed(2) + '×', onInput: (v) => { st.kRatio = v; st.lpPulse = 0.6; rebuild(); },
  });
  ctl.toggle({ label: '键角标注', value: true, onChange: (v) => { showArc = v; rebuild(); } });
  ctl.toggle({ label: '显示孤对', value: true, onChange: (v) => { showLP = v; rebuild(); } });
  ctl.button({ label: '⌂ 复位视角', onClick: () => app.setCamera(...st.camPreset) });
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
  [[0.001, 0], [0.10, 0.18], [0.185, 0.45], [0.16, 0.72], [0.075, 0.92], [0.001, 1.05]].map((p) => new THREE.Vector2(p[0], p[1])), 28);
SHARED_GEOS.add(lobeGeo);
const lobeMat = matGlow(C.lobeS, 0.3, { opacity: 0.4, roughness: 0.35 });
lobeMat.side = THREE.DoubleSide;
lobeMat.depthWrite = false;
const lobeMatP = matGlow(C.lobeP, 0.28, { opacity: 0.36, roughness: 0.35 });
lobeMatP.side = THREE.DoubleSide;
lobeMatP.depthWrite = false;
registerGlow(glowList, lobeMat, 0.3, 1.6);
registerGlow(glowList, lobeMatP, 0.28, 1.5);

function makeHybrid(dir, mat, withRings) {
  const grp = new THREE.Group();
  const big = new THREE.Mesh(lobeGeo, mat);
  orientY(big, dir);
  grp.add(big);
  const small = new THREE.Mesh(lobeGeo, mat);
  small.scale.setScalar(0.34);
  orientY(small, dir.clone().negate());
  grp.add(small);
  if (withRings) {
    /* 等值线圈（大瓣内两道 + 小瓣一道，科学插画等值面语法） */
    [0.4, 0.72].forEach((f) => {
      const r = ringLine(0.16 + f * 0.04, 0xbfe4ff, 40, 0.34);
      orientY(r, dir);
      r.position.copy(dir).multiplyScalar(f * 1.02);
      grp.add(r);
    });
    const rs = ringLine(0.08, 0xd8ccff, 32, 0.3);
    orientY(rs, dir.clone().negate());
    rs.position.copy(dir).multiplyScalar(-0.3);
    grp.add(rs);
    /* 相位标记（大瓣 +，小瓣 −） */
    const pPlus = makeTextSprite('＋', { fontSize: 40, color: '#bfe4ff', scale: 0.0065 });
    pPlus.position.copy(dir).multiplyScalar(1.18);
    grp.add(pPlus);
    const pMinus = makeTextSprite('－', { fontSize: 34, color: '#d8ccff', scale: 0.0055 });
    pMinus.position.copy(dir).multiplyScalar(-0.48);
    grp.add(pMinus);
  }
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
  /* 节面（p 轨道中间的平面：细环暗示，垂直于轨道轴向） */
  const node = ringLine(0.14, 0xd8ccff, 36, 0.4);
  orientY(node, dir);
  grp.add(node);
  return grp;
}

function buildHyb(key, showEx, showP, showPhase) {
  clearMol();
  const g = new THREE.Group();
  const h = HYB[key];
  const dirs = GEOM[h.n].dirs.map(nd);
  const lobes = [];
  dirs.forEach((d) => { const l = makeHybrid(d, lobeMat, showPhase); g.add(l); lobes.push(l); });
  if (showP) {
    if (key === 'sp') { g.add(makePOrbital(V(0, 1, 0)), makePOrbital(V(0, 0, 1))); }
    if (key === 'sp2') { g.add(makePOrbital(V(0, 1, 0))); }
  }
  // 中心原子（小球 + 座圈）
  const core = new THREE.Mesh(atomGeo, atomMat('C'));
  core.scale.setScalar(0.5);
  g.add(core);
  const seat = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.03, 10, 40), plugMat);
  seat.rotation.x = Math.PI / 2;
  g.add(seat);
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
  hudHyb.set('hyb', h.name);
  hudHyb.set('parts', h.parts);
  hudHyb.set('geo', `${h.geo}（${h.ang}）`);
  hudHyb.set('ex', h.ex);
}

function hybEnter() {
  clearMol();
  app.setCamera([3.6, 3.5, 8.8], [0, 0.3, 0]);
  st.camPreset = [[3.6, 3.5, 8.8], [0, 0.3, 0]];
  HUDS.forEach((h) => { h.el.style.display = 'none'; });
  hudHyb.el.style.display = '';
  setLegend([
    ['#7cc7ff', '杂化轨道瓣（大瓣成键）'],
    ['#c09aff', '未杂化 p 轨道（形成 π 键）'],
  ]);
  ctl.clear();
  ctl.seg({
    options: [
      { label: 'sp', value: 'sp' }, { label: 'sp²', value: 'sp2' }, { label: 'sp³', value: 'sp3' },
      { label: 'sp³d', value: 'sp3d' }, { label: 'sp³d²', value: 'sp3d2' },
    ],
    value: st.hybKey,
    onChange: (v) => { st.hybKey = v; rebuild(); },
  });
  let showEx = true, showP = true, showPhase = true;
  ctl.toggle({ label: '叠加示例分子', value: true, onChange: (v) => { showEx = v; rebuild(); } });
  ctl.toggle({ label: '未杂化 p 轨道', value: true, onChange: (v) => { showP = v; rebuild(); } });
  ctl.toggle({ label: '相位标记', value: true, onChange: (v) => { showPhase = v; rebuild(); } });
  ctl.button({ label: '▶ 重播长出动画', onClick: () => rebuild() });
  ctl.button({ label: '⌂ 复位视角', onClick: () => app.setCamera(...st.camPreset) });
  function rebuild() { buildHyb(st.hybKey, showEx, showP, showPhase); }
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
  hudPolar.set('mol', `${def.f}（${def.name}）`);
  hudPolar.set('net', netAbs > 0.05 ? `≈ ${netAbs.toFixed(2)}（模型值）` : '0（抵消）');
  hudPolar.set('mu', def.info.mu || '—');
  hudPolar.set('concl', polar ? '非极性分子' : '极性分子');
}

function polarEnter() {
  clearMol();
  app.setCamera([3.3, 3.0, 8.3], [0, 0.25, 0]);
  st.camPreset = [[3.3, 3.0, 8.3], [0, 0.25, 0]];
  HUDS.forEach((h) => { h.el.style.display = 'none'; });
  hudPolar.el.style.display = '';
  setLegend([
    ['#e05a4b', '键偶极（δ＋ → δ−，指向电负性大的一端）'],
    ['#4f8fe0', '分子净偶极 μ（各键偶极的矢量和）'],
  ]);
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
  ctl.button({ label: '⌂ 复位视角', onClick: () => app.setCamera(...st.camPreset) });
  let showBond = true, showNet = true;
  function rebuild() { buildPolar(st.polarKey, showBond, showNet); }
  rebuild();
}

/* ================= 章节六：扩展八隅体 ================= */

const OCT = ['PCl5', 'SF6', 'XeF2', 'XeF4', 'ClF3', 'BrF5', 'IF7'];
const OCT_NOTE = {
  PCl5: 'P 价电子 5 → 5 对成键电子（10 电子）；第三周期起可用 d 轨道容纳超过 8 电子',
  SF6: 'S 价电子 6 → 6 对成键电子（12 电子），正八面体骨架',
  XeF2: 'Xe 价电子 8 = 2 成键 + 3 孤对（10 电子）；3 孤对占赤道位 → 直线形',
  XeF4: 'Xe 价电子 8 = 4 成键 + 2 孤对（12 电子）；孤对占对位 → 平面正方形',
  ClF3: 'Cl 价电子 7 = 3 成键 + 2 孤对（10 电子）；2 孤对占赤道位 → T 形',
  BrF5: 'Br 价电子 7 = 5 成键 + 1 孤对（12 电子）；孤对占一个轴向位 → 四方锥',
  IF7: 'I 价电子 7 → 7 对成键电子（14 电子）——扩展八隅体的极限；五角双锥',
};
const OCT_LP_POS = { XeF4: '反位（相对的两轴向）', XeF2: '赤道位', SF4: '赤道位', ClF3: '赤道位', BrF5: '轴向位（其余轴向被底面 F 占据）' };

function buildOct(key, showLP, labels) {
  clearMol();
  const def = MOLS[key];
  const { g } = buildMol(def, { labels, lp: showLP });
  molRoot.add(g);
  fitView(def, 1.5);
  hudOct.set('mol', `${def.f}（${def.name}）`);
  hudOct.set('axe', `${def.info.axe} · ${def.info.mg}`);
  hudOct.set('lp', def.lp && def.lp.length ? `${def.lp.length} 对孤对（${OCT_LP_POS[key] || '赤道位'}）` : '无孤对');
  hudOct.set('note', OCT_NOTE[key]);
}

function octEnter() {
  clearMol();
  HUDS.forEach((h) => { h.el.style.display = 'none'; });
  hudOct.el.style.display = '';
  setLegend(null);
  ctl.clear();
  ctl.seg({
    options: [
      { label: 'PCl₅', value: 'PCl5' }, { label: 'SF₆', value: 'SF6' }, { label: 'XeF₂', value: 'XeF2' },
      { label: 'XeF₄', value: 'XeF4' }, { label: 'ClF₃', value: 'ClF3' }, { label: 'BrF₅', value: 'BrF5' }, { label: 'IF₇', value: 'IF7' },
    ],
    value: st.octKey,
    onChange: (v) => { st.octKey = v; rebuild(); },
  });
  let showLP = true, labels = true;
  ctl.toggle({ label: '显示孤对', value: true, onChange: (v) => { showLP = v; rebuild(); } });
  ctl.toggle({ label: '原子标签', value: true, onChange: (v) => { labels = v; rebuild(); } });
  ctl.button({ label: '↻ 下一个分子', onClick: () => { st.octKey = OCT[(OCT.indexOf(st.octKey) + 1) % OCT.length]; rebuild(); } });
  ctl.button({ label: '⌂ 复位视角', onClick: () => app.setCamera(...st.camPreset) });
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

/* 玻璃镜（黄铜边框四条 + 角柱 + 底座支脚，镜面半透明涂层） */
function buildMirrorPlane(w, h) {
  const g = new THREE.Group();
  const surface = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    matCoat(0x9fc0d0, { roughness: 0.06, metalness: 0.42, opacity: 0.16, transparent: true, side: THREE.DoubleSide, depthWrite: false })
  );
  surface.rotation.y = Math.PI / 2;
  g.add(surface);
  const frameMat = matStd(C.mirrorFrame, { roughness: 0.3, metalness: 0.85 });
  /* 四条边框 */
  const bars = [
    [0.07, h + 0.07, 0.07, 0, 0, -w / 2],
    [0.07, h + 0.07, 0.07, 0, 0, w / 2],
  ];
  bars.forEach(([bx, by, bz, px, py, pz]) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(bx, by, bz), frameMat);
    m.position.set(px, py, pz);
    g.add(m);
  });
  [-h / 2, h / 2].forEach((ey) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, w + 0.07), frameMat);
    m.position.set(0, ey, 0);
    g.add(m);
  });
  /* 底座支脚（前后两脚 + 横梁） */
  const footMat = matStd(0x35404a, { roughness: 0.55, metalness: 0.3 });
  [-w / 2 + 0.1, w / 2 - 0.1].forEach((fz) => {
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.06, 0.2), footMat);
    foot.position.set(0, -h / 2 - 0.045, fz);
    g.add(foot);
  });
  return g;
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
  /* 镜面（yz 平面，带黄铜边框与支脚） */
  const plane = buildMirrorPlane(3.4, 2.8);
  plane.name = 'mirrorPlane';
  g.add(plane);
  const title = makeTextSprite(kind === 'chiral' ? '分子 ↔ 镜像：互为对映体' : '分子 ↔ 镜像：可重合（有对称面）', { fontSize: 40, color: '#dce8f5', scale: 0.009 });
  title.position.set(0, 2.5, 0);
  title.name = 'chirTitle';
  g.add(title);
  molRoot.add(g);
  st.chirGroups = { root: g, L: L.g, R: R.g, plane, border: plane };
  hudChir.set('mol', `${defL.f} · ${kind === 'chiral' ? 'H/F/Cl/Br 四基团互不相同' : '两个 H 相同 → 有对称面'}`);
  hudChir.set('sym', kind === 'chiral' ? '无任何对称面/对称中心' : '有一个对称面（过 C、F、Cl、平分 H–H）');
  hudChir.set('try', '点击「旋转重合尝试」');
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
      st.chirState = 'overlapped';   // 手性：镜像回位但未重合，按钮切「分开」供复位
      if (st.chirBtn) st.chirBtn.textContent = '↩ 分开';
      hudChir.set('try', '✗ 无论怎么旋转都无法重合 → 手性分子');
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
      st.chirState = 'overlapped';
      if (st.chirBtn) st.chirBtn.textContent = '↩ 分开';
      hudChir.set('try', '✓ 旋转后完全重合 → 非手性');
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
  app.setCamera([0.6, 2.5, 9.8], [0, 0, 0]);
  st.camPreset = [[0.6, 2.5, 9.8], [0, 0, 0]];
  HUDS.forEach((h) => { h.el.style.display = 'none'; });
  hudChir.el.style.display = '';
  setLegend(null);
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
    onChange: (v) => { showPlane = v; st.chirGroups.plane.visible = v; },
  });
  /* 尝试重合 ↔ 分开 双态按钮（原版功能块 1:1：镜像叠上后可一键分开复位） */
  st.chirState = 'idle';
  const tryBtn = ctl.button({
    label: '🔄 旋转重合尝试',
    onClick: () => {
      if (st.chirState === 'overlapped') {          // 分开：镜像退回原位
        st.chirGroups.R.position.set(1.9, 0, 0);
        st.chirGroups.R.rotation.set(0, 0, 0);
        st.chirState = 'idle';
        tryBtn.textContent = '🔄 旋转重合尝试';
        hudChir.set('try', '已分开复位，可再次尝试');
        return;
      }
      hudChir.set('try', '尝试中…');
      st.chirState = 'running';
      st.chirBtn = tryBtn;
      st.align = { t: 0, mode: st.chirKey === 'chiral' ? 'chiral' : 'achiral', mirror: st.chirGroups.R };
      st.chirGroups.R.position.set(1.9, 0, 0);
      st.chirGroups.R.rotation.set(0, 0, 0);
    },
  });
  ctl.button({ label: '📝 手性小测验', onClick: () => showChirQuiz() });
  ctl.button({ label: '⌂ 复位视角', onClick: () => app.setCamera(...st.camPreset) });
  function rebuild() {
    buildChir(st.chirKey);
    st.chirState = 'idle';
    tryBtn.textContent = '🔄 旋转重合尝试';
  }
  rebuild();
  activeSectionCleanup = () => { if (chirQuizPanel) { chirQuizPanel.remove(); chirQuizPanel = null; } };
}

/* ================= 章节八：分子库 ================= */

let libCardEl = null, libInfoEl = null, libDecor = null, infoDecor = null;

function showLibInfo(def) {
  if (!libInfoEl) {
    libInfoEl = document.createElement('div');
    libInfoEl.className = 'vspr-info';
    libInfoEl.innerHTML = `
      <div class="vspr-info-head"><span class="fm"></span><span class="nm"></span></div>
      <div class="vspr-info-body"></div>`;
    infoDecor = decorateFloat(libInfoEl, 'info', null, 'ℹ', true);
    stage.appendChild(libInfoEl);
  }
  const i = def.info;
  libInfoEl.querySelector('.fm').textContent = fmtF(def.f);
  libInfoEl.querySelector('.nm').textContent = `${def.name} · ${def.cat}`;
  const body = libInfoEl.querySelector('.vspr-info-body');
  body.innerHTML = '';
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
  libInfoEl.style.display = '';
}

function ensureLibCard(onPick) {
  if (libCardEl) { libCardEl.style.display = ''; paintLibActive(); return; }
  libCardEl = document.createElement('div');
  libCardEl.className = 'lib-card';
  const bodyWrap = document.createElement('div');
  bodyWrap.className = 'lib-body';
  const groups = [...new Set(MOL_LIST.map((d) => d.cat))];
  groups.forEach((cat) => {
    const h = document.createElement('h4');
    h.textContent = cat;
    bodyWrap.appendChild(h);
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
    bodyWrap.appendChild(grid);
  });
  libCardEl.appendChild(bodyWrap);
  libDecor = decorateFloat(libCardEl, 'lib', '分子列表', '库');
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
  const { g } = buildMol(def, {
    mode: st.libMode,
    labels: st.libLabels !== false && st.libMode === 'stick',
    lp: st.libLP !== false,
  });
  molRoot.add(g);
  fitView(def, 0.5);
  showLibInfo(def);
  paintLibActive();
  hudLib.set('mol', def.f);
  hudLib.set('mg', def.info.mg);
  hudLib.set('idx', `${MOL_LIST.indexOf(def) + 1} / ${MOL_LIST.length}`);
}

function libEnter() {
  clearMol();
  HUDS.forEach((h) => { h.el.style.display = 'none'; });
  hudLib.el.style.display = '';
  setLegend(null);
  ctl.clear();
  ctl.seg({
    options: [
      { label: '球棍模型', value: 'stick' },
      { label: '空间填充', value: 'space' },
      { label: '路易斯结构', value: 'lewis' },
    ],
    value: st.libMode,
    onChange: (v) => { st.libMode = v; loadLib(st.libKey); },
  });
  ctl.toggle({ label: '自动旋转', value: false, onChange: (v) => { st.libSpin = v; } });
  ctl.toggle({ label: '分子列表卡', value: true, onChange: (v) => { if (libCardEl) libCardEl.style.display = v ? '' : 'none'; } });
  ctl.toggle({ label: '原子标签（球棍）', value: true, onChange: (v) => { st.libLabels = v; loadLib(st.libKey); } });
  ctl.toggle({ label: '显示孤对', value: true, onChange: (v) => { st.libLP = v; loadLib(st.libKey); } });
  ctl.button({ label: '‹ 上一个', onClick: () => { const i = MOL_LIST.findIndex((d) => d.f === st.libKey); loadLib(MOL_LIST[(i - 1 + MOL_LIST.length) % MOL_LIST.length].f); } });
  ctl.button({ label: '下一个 ›', onClick: () => { const i = MOL_LIST.findIndex((d) => d.f === st.libKey); loadLib(MOL_LIST[(i + 1) % MOL_LIST.length].f); } });
  ensureLibCard(loadLib);
  loadLib(st.libKey);
  activeSectionCleanup = () => {
    if (libCardEl) libCardEl.style.display = 'none';
    if (libInfoEl) libInfoEl.style.display = 'none';
    st.libSpin = false;
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
  app.setCamera([4.4, 3.3, 8.8], [0, 0.3, 0]);
  st.camPreset = [[4.4, 3.3, 8.8], [0, 0.3, 0]];
  HUDS.forEach((h) => { h.el.style.display = 'none'; });
  hudQuiz.el.style.display = '';
  hudQuiz.set('tip', '5 道选择题，检验本节掌握情况');
  setLegend(null);
  ctl.clear();
  ctl.button({ label: '↺ 重新测验', onClick: () => showQuizV() });
  /* 面纱后留一个慢旋演示分子（CH₄），随堂检测时舞台不至于空置 */
  const demo = buildMol(MOLS.CH4, { mode: 'stick', labels: true, lp: false });
  molRoot.add(demo.g);
  fitView(MOLS.CH4, 1.2);
  const spinTick = (t, dt) => { molRoot.rotation.y += dt * 0.4; };
  animated.push(spinTick);
  showQuizV();
  const panelCleanup = activeSectionCleanup;   // showQuizV 内的面板移除，保留并合并
  activeSectionCleanup = () => {
    panelCleanup();
    const qi = animated.indexOf(spinTick);
    if (qi >= 0) animated.splice(qi, 1);
    molRoot.rotation.set(0, 0, 0);
  };
}

/* ================= 章节定义（知识点详解正文，随右栏切换） ================= */

const SECTIONS = [
  {
    title: '价层电子对互斥',
    html: `<p>分子中心原子的<b>价层电子对</b>（成键对 + 孤对）彼此排斥，在空间上取<span class="hl">斥力最小的排布</span>——这就是 VSEPR（Valence Shell Electron Pair Repulsion）模型。</p>
<p>拖动滑杆选成键数 n 与孤对数 m，n+m 个「电子对气球」会在球面上<b>互相排斥、自己弹开</b>，找到斥力最小的排布：2 对直线、3 对平面三角、4 对四面体、5 对三角双锥、6 对八面体。点「打乱」（或按 Space）重新撒点，看它们再次弹开找平衡。</p>
<p><span class="hl">斥力排序：孤对-孤对 ＞ 孤对-成键 ＞ 成键-成键</span>。所以三角双锥中孤对优先占赤道位，八面体中孤对互成 180°。打开「斥力连线」看每对气球之间的相互排斥（连线颜色越暖，斥力越强）。</p>`,
    enter() { sandEnter(); },
  },
  {
    title: '电子对构型与分子构型',
    html: `<p><b>电子对构型</b>看全部 n+m 个电子对；<b>分子构型</b>只看<span class="hl">原子的排列</span>——也就是「去掉孤对位置后」剩下的形状。</p>
<p>例如 AX3E：电子对构型是正四面体，但孤对「看不见」，三个原子呈<span class="hl">三角锥形</span>。用「隐藏孤对电子」开关对比切换，体会两者的差别；「电子对多面体」开关画出电子对构型的<b>凸包棱线框</b>（绿色）。</p>
<p>打开「AXnEm 对照表」查看 13 种常见组合的构型名、键角与杂化，点击任意行可在 3D 中查看该构型。</p>`,
    enter() { axeEnter(); },
  },
  {
    title: '键角比较',
    html: `<p>同样是 sp³ 四电子对排布：CH₄ 无孤对，键角 <b>109°28′</b>；NH₃ 有 1 对孤对，压到 <span class="hl">107°</span>；H₂O 有 2 对孤对，只剩 <span class="hl">104.5°</span>。</p>
<p>因为斥力<b>孤对-成键 ＞ 成键-成键</b>，孤对像一只看不见的手把成键电子对挤拢。拖动「孤对斥力倍率」滑杆，加大孤对斥力，实时看<b>模型键角</b>被进一步压缩——绿色一行是<b>实测键角</b>（教科书值），模型趋势与实验一致。</p>`,
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
<p>PCl₅（10 电子，三角双锥）、SF₆（12 电子，正八面体）、IF₇（14 电子，<span class="hl">五角双锥</span>——扩展八隅体的极限）。稀有气体 Xe 也能成键：XeF₂ 三对孤对占赤道位 → 直线形；XeF₄ 两对孤对占对位 → <span class="hl">平面正方形</span>。</p>
<p>三角双锥中<b>赤道位</b>只有两个 90° 邻居、轴向位有三个，所以孤对电子总是先占赤道位（SF₄、ClF₃）；八面体中两对孤对取<b>反式</b>（XeF₄）。切换分子，注意孤对的占位规律与键长的差别（轴向键比赤道键长）。</p>`,
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
    html: `<p>收录 <b>36 个常见分子/离子</b>：直线形、平面构型、四面体家族、三角双锥、八面体与有机多中心分子（含苯）。</p>
<p>点击左侧列表（或控制条的 ‹ ›）切换，右侧信息卡给出每个分子的 <span class="hl">AXE 类、电子对/分子构型、键角、杂化、极性、键长参考值</span>。视图可在<b>球棍模型 / 空间填充 / 路易斯结构</b>三种画法间切换（路易斯画法把孤对画成电子点对），也可打开「自动旋转」观察。拖拽旋转、滚轮缩放任意观察。</p>`,
    enter() { libEnter(); },
  },
  {
    title: '随堂检测',
    html: `<p>5 道选择题，检验 VSEPR 这一节的掌握情况。</p>`,
    enter() { quizEnter(); },
  },
];

/* ================= 三栏驱动器（左列表 / 右详解 / 相机飞行） ================= */

const chapNav = document.getElementById('chapNav');
const chapCount = document.getElementById('chapCount');
const railNoL = document.getElementById('railNoL');
const railTitleR = document.getElementById('railTitleR');
const detailNo = document.getElementById('detailNo');
const detailTitle = document.getElementById('detailTitle');
const lessonEl = document.getElementById('lesson');
const detailBody = document.getElementById('detailBody');
const controlsEl = document.getElementById('controls');
const vspShell = document.getElementById('vseprShell');
let chapterIdx = 0;

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
  if (activeSectionCleanup) { activeSectionCleanup(); activeSectionCleanup = null; }
  sec.enter();
  accSecs.controls.classList.toggle('acc-empty', !controlsEl.children.length);
  const hudVisible = HUDS.some((h) => h.el.style.display !== 'none');
  accSecs.data.classList.toggle('acc-empty', !hudVisible);
  detailBody.scrollTop = 0;
}

/* ---------------- 原版功能块 1:1：上一节(←)/下一节(→) · 重置视角(R) · 全屏(F) ---------------- */

const chapPrev = document.getElementById('chapPrev');
const chapNext = document.getElementById('chapNext');
const camResetBtn = document.getElementById('camResetBtn');
const fullBtn = document.getElementById('fullBtn');

function gotoChapter(i) { selectChapter((i + SECTIONS.length) % SECTIONS.length); }
chapPrev.addEventListener('click', () => gotoChapter(chapterIdx - 1));
chapNext.addEventListener('click', () => gotoChapter(chapterIdx + 1));

function resetCam() { app.setCamera(...st.camPreset); }
camResetBtn.addEventListener('click', resetCam);

fullBtn.addEventListener('click', () => {
  if (document.fullscreenElement) document.exitFullscreen();
  else document.querySelector('.lab-stage3d').requestFullscreen().catch(() => { /* 用户拒绝或不支持时静默 */ });
});
document.addEventListener('fullscreenchange', () => {
  fullBtn.textContent = document.fullscreenElement ? '⛶ 退出全屏' : '⛶ 全屏';
});

window.addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const t = e.target;
  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
  if (e.key === 'ArrowLeft') gotoChapter(chapterIdx - 1);
  else if (e.key === 'ArrowRight') gotoChapter(chapterIdx + 1);
  else if (e.key === 'r' || e.key === 'R') resetCam();
  else if (e.key === 'f' || e.key === 'F') fullBtn.click();
  else if (e.key === ' ') {
    e.preventDefault();
    if (chapterIdx === 0) sandScramble();     // 原版功能块 1:1：Space 打乱电子对沙盒
  }
});

/* ---------------- 栏折叠（左右独立 28px 竖条）× 专注模式（双栏同折） ---------------- */

const foldLBtn = document.getElementById('foldLBtn');
const unfoldLBtn = document.getElementById('unfoldLBtn');
const foldRBtn = document.getElementById('foldRBtn');
const unfoldRBtn = document.getElementById('unfoldRBtn');
const focusBtn = document.getElementById('focusBtn');

const FOLD_KEY = { l: 'vsepr.foldL', r: 'vsepr.foldR' };
let foldL = false;
let foldR = false;
let focusSaved = null;

try {
  foldL = localStorage.getItem(FOLD_KEY.l) === '1';
  foldR = localStorage.getItem(FOLD_KEY.r) === '1';
} catch (e) { /* localStorage 不可用时仅本次会话生效 */ }

function applyFold() {
  vspShell.classList.toggle('fold-l', foldL);
  vspShell.classList.toggle('fold-r', foldR);
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
  vspShell.classList.toggle('focus-mode', on);
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

const ACC_KEYS = { lesson: 'vsepr.accLesson', controls: 'vsepr.accControls', data: 'vsepr.accData' };
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
  const sec = accSecs[name];
  sec.classList.toggle('closed', accClosed[name]);
  sec.querySelector('.acc-head').setAttribute('aria-expanded', String(!accClosed[name]));
}
for (const name of Object.keys(accSecs)) applyAcc(name);
for (const name of Object.keys(accSecs)) {
  accSecs[name].querySelector('.acc-head').addEventListener('click', () => {
    accClosed[name] = !accClosed[name];
    try { localStorage.setItem(ACC_KEYS[name], accClosed[name] ? '1' : '0'); } catch (e) { /* 忽略 */ }
    applyAcc(name);
  });
}

/* ================= 启动（场景同步搭建，无外部资产等待） ================= */

const sectionsApi = { select: selectChapter };
window.__eduSections = sectionsApi;
window.__vspStats = () => vfx.stats();   // 质检句柄：draw call / 三角形数

labReady = true;
loader.hide();
selectChapter(0);
