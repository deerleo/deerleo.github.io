/* EduLab · 元素周期表（periodic）
 * 章节：认识周期表 / 电子层与周期 / 原子半径与电负性 / 电离能的锯齿 / 物态与温度 /
 *       元素发现史 / 螺旋与同心环 / 随堂检测
 * 场景：118 个元素方格（BoxGeometry + CanvasTexture 顶面：序数/符号/中文名/数值），
 *       属性柱高动画、Bohr 电子层模型、物态温度扫描、发现史时间轴、
 *       长式网格 / 三维螺旋 / 同心环三种布局变形。
 * 数据：紧凑数据块（118 元素 × 13 字段，源自 pt 数据集；0/空值显示「—」不编造）。
 */
import {
  THREE, TAU, clamp,
  loadTexture, loadHDR, loadAll, createApp, cameraTweenTick, makeLoader,
  createSections, createControlsPanel, makeHUD, makeTextSprite, setSpriteText, circleLine,
} from './edu-core.js';

/* ---------------- 数据 ---------------- */

// 118 个标准中文元素名（104 号起无通行简体译名，按公约用符号）
const CN = [
  '氢', '氦', '锂', '铍', '硼', '碳', '氮', '氧', '氟', '氖',
  '钠', '镁', '铝', '硅', '磷', '硫', '氯', '氩',
  '钾', '钙', '钪', '钛', '钒', '铬', '锰', '铁', '钴', '镍', '铜', '锌',
  '镓', '锗', '砷', '硒', '溴', '氪',
  '铷', '锶', '钇', '锆', '铌', '钼', '锝', '钌', '铑', '钯', '银', '镉', '铟', '锡', '锑', '碲', '碘', '氙',
  '铯', '钡',
  '镧', '铈', '镨', '钕', '钷', '钐', '铕', '钆', '铽', '镝', '钬', '铒', '铥', '镱', '镥',
  '铪', '钽', '钨', '铼', '锇', '铱', '铂', '金', '汞', '铊', '铅', '铋', '钋', '砹', '氡',
  '钫', '镭',
  '锕', '钍', '镤', '铀', '镎', '钚', '镅', '锔', '锫', '锎', '锿', '镄', '钔', '锘', '铹',
  'Rf', 'Db', 'Sg', 'Bh', 'Hs', 'Mt', 'Ds', 'Rg', 'Cn', 'Nh', 'Fl', 'Mc', 'Lv', 'Ts', 'Og',
];

// 每元素字段：[符号, 英文名, 相对原子质量, 原子半径pm, 电负性, 第一电离能kJ/mol,
//              熔点K, 沸点K, 电子排布, 分类idx, 发现年份(0=古代), 标况状态(0固1液2气-1未知), 密度]
const ELS = JSON.parse('[["H","Hydrogen","1.00794",37,2.2,1312,14,20,"1s1",6,1766,2,0.0000899],["He","Helium","4.002602",32,null,2372,null,4,"1s2",8,1868,2,0.0001785],["Li","Lithium","6.941",134,0.98,520,454,1615,"[He] 2s1",0,1817,0,0.535],["Be","Beryllium","9.012182",90,1.57,900,1560,2743,"[He] 2s2",1,1798,0,1.848],["B","Boron","10.811",82,2.04,801,2348,4273,"[He] 2s2 2p1",5,1807,0,2.46],["C","Carbon","12.0107",77,2.55,1087,3823,4300,"[He] 2s2 2p2",6,0,0,2.26],["N","Nitrogen","14.0067",75,3.04,1402,63,77,"[He] 2s2 2p3",6,1772,2,0.001251],["O","Oxygen","15.9994",73,3.44,1314,55,90,"[He] 2s2 2p4",6,1774,2,0.001429],["F","Fluorine","18.9984032",71,3.98,1681,54,85,"[He] 2s2 2p5",7,1670,2,0.001696],["Ne","Neon","20.1797",69,null,2081,25,27,"[He] 2s2 2p6",8,1898,2,0.0009],["Na","Sodium","22.98976928",154,0.93,496,371,1156,"[Ne] 3s1",0,1807,0,0.968],["Mg","Magnesium","24.3050",130,1.31,738,923,1363,"[Ne] 3s2",1,1808,0,1.738],["Al","Aluminum","26.9815386",118,1.61,578,933,2792,"[Ne] 3s2 3p1",null,0,0,2.7],["Si","Silicon","28.0855",111,1.9,787,1687,3173,"[Ne] 3s2 3p2",5,1854,0,2.33],["P","Phosphorus","30.973762",106,2.19,1012,317,554,"[Ne] 3s2 3p3",6,1669,0,1.823],["S","Sulfur","32.065",102,2.58,1000,388,718,"[Ne] 3s2 3p4",6,0,0,1.96],["Cl","Chlorine","35.453",99,3.16,1251,172,239,"[Ne] 3s2 3p5",7,1774,2,0.003214],["Ar","Argon","39.948",97,null,1521,84,87,"[Ne] 3s2 3p6",8,1894,2,0.001784],["K","Potassium","39.0983",196,0.82,419,337,1032,"[Ar] 4s1",0,1807,0,0.856],["Ca","Calcium","40.078",174,1,590,1115,1757,"[Ar] 4s2",1,0,0,1.55],["Sc","Scandium","44.955912",144,1.36,633,1814,3103,"[Ar] 3d1 4s2",2,1876,0,2.985],["Ti","Titanium","47.867",136,1.54,659,1941,3560,"[Ar] 3d2 4s2",2,1791,0,4.507],["V","Vanadium","50.9415",125,1.63,651,2183,3680,"[Ar] 3d3 4s2",2,1803,0,6.11],["Cr","Chromium","51.9961",127,1.66,653,2180,2944,"[Ar] 3d5 4s1",2,0,0,7.14],["Mn","Manganese","54.938045",139,1.55,717,1519,2334,"[Ar] 3d5 4s2",2,1774,0,7.47],["Fe","Iron","55.845",125,1.83,763,1811,3134,"[Ar] 3d6 4s2",2,0,0,7.874],["Co","Cobalt","58.933195",126,1.88,760,1768,3200,"[Ar] 3d7 4s2",2,0,0,8.9],["Ni","Nickel","58.6934",121,1.91,737,1728,3186,"[Ar] 3d8 4s2",2,1751,0,8.908],["Cu","Copper","63.546",138,1.9,746,1358,3200,"[Ar] 3d10 4s1",2,0,0,8.92],["Zn","Zinc","65.38",131,1.65,906,693,1180,"[Ar] 3d10 4s2",2,1746,0,7.14],["Ga","Gallium","69.723",126,1.81,579,303,2477,"[Ar] 3d10 4s2 4p1",null,1875,0,5.904],["Ge","Germanium","72.64",122,2.01,762,1211,3093,"[Ar] 3d10 4s2 4p2",5,1886,0,5.323],["As","Arsenic","74.92160",119,2.18,947,1090,887,"[Ar] 3d10 4s2 4p3",5,0,0,5.727],["Se","Selenium","78.96",116,2.55,941,494,958,"[Ar] 3d10 4s2 4p4",6,1817,0,4.819],["Br","Bromine","79.904",114,2.96,1140,266,332,"[Ar] 3d10 4s2 4p5",7,1826,1,3.12],["Kr","Krypton","83.798",110,null,1351,116,120,"[Ar] 3d10 4s2 4p6",8,1898,2,0.00375],["Rb","Rubidium","85.4678",211,0.82,403,312,961,"[Kr] 5s1",0,1861,0,1.532],["Sr","Strontium","87.62",192,0.95,550,1050,1655,"[Kr] 5s2",1,1790,0,2.63],["Y","Yttrium","88.90585",162,1.22,600,1799,3618,"[Kr] 4d1 5s2",2,1794,0,4.472],["Zr","Zirconium","91.224",148,1.33,640,2128,4682,"[Kr] 4d2 5s2",2,1789,0,6.511],["Nb","Niobium","92.90638",137,1.6,652,2750,5017,"[Kr] 4d4 5s1",2,1801,0,8.57],["Mo","Molybdenum","95.96",145,2.16,684,2896,4912,"[Kr] 4d5 5s1",2,1778,0,10.28],["Tc","Technetium","98",156,1.9,702,2430,4538,"[Kr] 4d5 5s2",2,1937,0,11.5],["Ru","Ruthenium","101.07",126,2.2,710,2607,4423,"[Kr] 4d7 5s1",2,1827,0,12.37],["Rh","Rhodium","102.90550",135,2.28,720,2237,3968,"[Kr] 4d8 5s1",2,1803,0,12.45],["Pd","Palladium","106.42",131,2.2,804,1828,3236,"[Kr] 4d10",2,1803,0,12.023],["Ag","Silver","107.8682",153,1.93,731,1235,2435,"[Kr] 4d10 5s1",2,0,0,10.49],["Cd","Cadmium","112.411",148,1.69,868,594,1040,"[Kr] 4d10 5s2",2,1817,0,8.65],["In","Indium","114.818",144,1.78,558,430,2345,"[Kr] 4d10 5s2 5p1",null,1863,0,7.31],["Sn","Tin","118.710",141,1.96,709,505,2875,"[Kr] 4d10 5s2 5p2",null,0,0,7.31],["Sb","Antimony","121.760",138,2.05,834,904,1860,"[Kr] 4d10 5s2 5p3",5,0,0,6.697],["Te","Tellurium","127.60",135,2.1,869,723,1261,"[Kr] 4d10 5s2 5p4",5,1782,0,6.24],["I","Iodine","126.90447",133,2.66,1008,387,457,"[Kr] 4d10 5s2 5p5",7,1811,0,4.94],["Xe","Xenon","131.293",130,null,1170,161,165,"[Kr] 4d10 5s2 5p6",8,1898,2,0.0059],["Cs","Cesium","132.9054519",225,0.79,376,302,944,"[Xe] 6s1",0,1860,0,1.879],["Ba","Barium","137.327",198,0.89,503,1000,2143,"[Xe] 6s2",1,1808,0,3.51],["La","Lanthanum","138.90547",169,1.1,538,1193,3737,"[Xe] 5d1 6s2",3,1839,0,6.146],["Ce","Cerium","140.116",null,1.12,534,1071,3633,"[Xe] 4f1 5d1 6s2",3,1803,0,6.689],["Pr","Praseodymium","140.90765",null,1.13,527,1204,3563,"[Xe] 4f3 6s2",3,1885,0,6.64],["Nd","Neodymium","144.242",null,1.14,533,1294,3373,"[Xe] 4f4 6s2",3,1885,0,7.01],["Pm","Promethium","145",null,1.13,540,1373,3273,"[Xe] 4f5 6s2",3,1947,0,7.264],["Sm","Samarium","150.36",null,1.17,545,1345,2076,"[Xe] 4f6 6s2",3,1853,0,7.353],["Eu","Europium","151.964",null,1.2,547,1095,1800,"[Xe] 4f7 6s2",3,1901,0,5.244],["Gd","Gadolinium","157.25",null,1.2,593,1586,3523,"[Xe] 4f7 5d1 6s2",3,1880,0,7.901],["Tb","Terbium","158.92535",null,1.2,566,1629,3503,"[Xe] 4f9 6s2",3,1843,0,8.219],["Dy","Dysprosium","162.500",null,1.22,573,1685,2840,"[Xe] 4f10 6s2",3,1886,0,8.551],["Ho","Holmium","164.93032",null,1.23,581,1747,2973,"[Xe] 4f11 6s2",3,1878,0,8.795],["Er","Erbium","167.259",null,1.24,589,1770,3141,"[Xe] 4f12 6s2",3,1842,0,9.066],["Tm","Thulium","168.93421",null,1.25,597,1818,2223,"[Xe] 4f13 6s2",3,1879,0,9.321],["Yb","Ytterbium","173.054",null,1.1,603,1092,1469,"[Xe] 4f14 6s2",3,1878,0,6.57],["Lu","Lutetium","174.9668",160,1.27,524,1936,3675,"[Xe] 4f14 5d1 6s2",3,1907,0,9.841],["Hf","Hafnium","178.49",150,1.3,659,2506,4876,"[Xe] 4f14 5d2 6s2",2,1923,0,13.31],["Ta","Tantalum","180.94788",138,1.5,761,3290,5731,"[Xe] 4f14 5d3 6s2",2,1802,0,16.65],["W","Tungsten","183.84",146,2.36,770,3695,5828,"[Xe] 4f14 5d4 6s2",2,1783,0,19.25],["Re","Rhenium","186.207",159,1.9,760,3459,5869,"[Xe] 4f14 5d5 6s2",2,1925,0,21.02],["Os","Osmium","190.23",128,2.2,840,3306,5285,"[Xe] 4f14 5d6 6s2",2,1803,0,22.61],["Ir","Iridium","192.217",137,2.2,880,2739,4701,"[Xe] 4f14 5d7 6s2",2,1803,0,22.65],["Pt","Platinum","195.084",128,2.28,870,2041,4098,"[Xe] 4f14 5d9 6s1",2,0,0,21.09],["Au","Gold","196.966569",144,2.54,890,1337,3129,"[Xe] 4f14 5d10 6s1",2,0,0,19.3],["Hg","Mercury","200.59",149,2,1007,234,630,"[Xe] 4f14 5d10 6s2",2,0,1,13.534],["Tl","Thallium","204.3833",148,2.04,589,577,1746,"[Xe] 4f14 5d10 6s2 6p1",null,1861,0,11.85],["Pb","Lead","207.2",147,2.33,716,601,2022,"[Xe] 4f14 5d10 6s2 6p2",null,0,0,11.34],["Bi","Bismuth","208.98040",146,2.02,703,544,1837,"[Xe] 4f14 5d10 6s2 6p3",null,0,0,9.78],["Po","Polonium","209",null,2,812,527,1235,"[Xe] 4f14 5d10 6s2 6p4",5,1898,0,9.196],["At","Astatine","210",null,2.2,920,575,null,"[Xe] 4f14 5d10 6s2 6p5",7,1940,0,null],["Rn","Radon","222",145,null,1037,202,211,"[Xe] 4f14 5d10 6s2 6p6",8,1900,2,0.00973],["Fr","Francium","223",null,0.7,380,null,null,"[Rn] 7s1",0,1939,0,null],["Ra","Radium","226",null,0.9,509,973,2010,"[Rn] 7s2",1,1898,0,5],["Ac","Actinium","227",null,1.1,499,1323,3473,"[Rn] 6d1 7s2",4,1899,0,10.07],["Th","Thorium","232.03806",null,1.3,587,2023,5093,"[Rn] 6d2 7s2",4,1828,0,11.724],["Pa","Protactinium","231.03588",null,1.5,568,1845,4273,"[Rn] 5f2 6d1 7s2",4,1913,0,15.37],["U","Uranium","238.02891",null,1.38,598,1408,4200,"[Rn] 5f3 6d1 7s2",4,1789,0,19.05],["Np","Neptunium","237",null,1.36,605,917,4273,"[Rn] 5f4 6d1 7s2",4,1940,0,20.45],["Pu","Plutonium","244",null,1.28,585,913,3503,"[Rn] 5f6 7s2",4,1940,0,19.816],["Am","Americium","243",null,1.3,578,1449,2284,"[Rn] 5f7 7s2",4,1944,0,null],["Cm","Curium","247",null,1.3,581,1618,3383,"[Rn] 5f7 6d1 7s2",4,1944,0,13.51],["Bk","Berkelium","247",null,1.3,601,1323,null,"[Rn] 5f9 7s2",4,1949,0,14.78],["Cf","Californium","251",null,1.3,608,1173,null,"[Rn] 5f10 7s2",4,1950,0,15.1],["Es","Einsteinium","252",null,1.3,619,1133,null,"[Rn] 5f11 7s2",4,1952,0,null],["Fm","Fermium","257",null,1.3,627,1800,null,"[Rn] 5f12 7s2",4,1952,-1,null],["Md","Mendelevium","258",null,1.3,635,1100,null,"[Rn] 5f13 7s2",4,1955,-1,null],["No","Nobelium","259",null,1.3,642,1100,null,"[Rn] 5f14 7s2",4,1957,-1,null],["Lr","Lawrencium","262",null,1.3,null,1900,null,"[Rn] 5f14 7s2 7p1",4,1961,-1,null],["Rf","Rutherfordium","267",null,null,null,null,null,"[Rn] 5f14 6d2 7s2",2,1969,-1,null],["Db","Dubnium","268",null,null,null,null,null,"[Rn] 5f14 6d3 7s2",2,1967,-1,null],["Sg","Seaborgium","271",null,null,null,null,null,"[Rn] 5f14 6d4 7s2",2,1974,-1,null],["Bh","Bohrium","272",null,null,null,null,null,"[Rn] 5f14 6d5 7s2",2,1976,-1,null],["Hs","Hassium","270",null,null,null,null,null,"[Rn] 5f14 6d6 7s2",2,1984,-1,null],["Mt","Meitnerium","276",null,null,null,null,null,"[Rn] 5f14 6d7 7s2",2,1982,-1,null],["Ds","Darmstadtium","281",null,null,null,null,null,"[Rn] 5f14 6d9 7s1",2,1994,-1,null],["Rg","Roentgenium","280",null,null,null,null,null,"[Rn] 5f14 6d10 7s1",2,1994,-1,null],["Cn","Copernicium","285",null,null,null,null,null,"[Rn] 5f14 6d10 7s2",2,1996,-1,null],["Nh","Nihonium","284",null,null,null,null,null,"[Rn] 5f14 6d10 7s2 7p1",9,2003,-1,null],["Fl","Flerovium","289",null,null,null,null,null,"[Rn] 5f14 6d10 7s2 7p2",9,1998,-1,null],["Mc","Moscovium","288",null,null,null,null,null,"[Rn] 5f14 6d10 7s2 7p3",9,2003,-1,null],["Lv","Livermorium","293",null,null,null,null,null,"[Rn] 5f14 6d10 7s2 7p4",9,2000,-1,null],["Ts","Tennessine","294",null,null,null,null,null,"[Rn] 5f14 6d10 7s2 7p5",9,2010,-1,null],["Og","Oganesson","294",null,null,null,null,null,"[Rn] 5f14 6d10 7s2 7p6",8,2002,-1,null]]');

const CAT_NAMES = ['碱金属', '碱土金属', '过渡金属', '镧系', '锕系', '类金属', '非金属', '卤素', '稀有气体', '其他金属'];
const CAT_COLORS = ['#e0684b', '#e59b3c', '#4a90c4', '#8e6fc8', '#c25e93', '#3aa88f', '#58b558', '#c9a53a', '#5f63c9', '#7d8794'];
const STATE_NAMES = ['固态', '液态', '气态', '未知'];
const STATE_COLORS = ['#4a90c4', '#3aa88f', '#e59b3c', '#7d8794'];
const FONT = '-apple-system, "PingFang SC", "Microsoft YaHei", sans-serif';

// 电子排布字符串 → Bohr 电子层分布（按主量子数 n 求和，稀有气体芯展开）
const CORE = { He: [2], Ne: [2, 8], Ar: [2, 8, 8], Kr: [2, 8, 18, 8], Xe: [2, 8, 18, 18, 8], Rn: [2, 8, 18, 32, 18, 8] };
function parseShells(conf) {
  const out = [];
  const m = conf.match(/\[(\w+)\]/);
  if (m && CORE[m[1]]) CORE[m[1]].forEach((c, i) => { out[i] = c; });
  conf.replace(/(\d)([spdf])(\d+)/g, (_, n, l, cnt) => {
    const i = +n - 1;
    out[i] = (out[i] || 0) + +cnt;
    return '';
  });
  return out;
}
const SHELLS = ELS.map((d) => parseShells(d[8]));

/* ---------------- 位置映射 ---------------- */

// 长式周期表（18 列）：返回 [行, 列]；镧系行 8.6 / 锕系行 9.7（下方独立两行）
function gridRowCol(z) {
  if (z === 1) return [1, 1];
  if (z === 2) return [1, 18];
  if (z <= 4) return [2, z - 2];
  if (z <= 10) return [2, z + 8];
  if (z <= 12) return [3, z - 10];
  if (z <= 18) return [3, z];
  if (z <= 36) return [4, z - 18];
  if (z <= 54) return [5, z - 36];
  if (z === 55) return [6, 1];
  if (z === 56) return [6, 2];
  if (z <= 71) return [8.6, z - 54];   // La..Lu → 第 3..17 列
  if (z <= 86) return [6, z - 68];     // Hf..Rn → 第 4..18 列
  if (z === 87) return [7, 1];
  if (z === 88) return [7, 2];
  if (z <= 103) return [9.7, z - 86];  // Ac..Lr → 第 3..17 列
  return [7, z - 100];                 // Rf..Og → 第 4..18 列
}
function periodOf(z) {
  const r = gridRowCol(z)[0];
  if (r === 8.6) return 6;
  if (r === 9.7) return 7;
  return r;
}
const GROUP_LABELS = ['ⅠA', 'ⅡA', 'ⅢB', 'ⅣB', 'ⅤB', 'ⅥB', 'ⅦB', 'Ⅷ族', 'Ⅷ族', 'Ⅷ族', 'ⅠB', 'ⅡB', 'ⅢA', 'ⅣA', 'ⅤA', 'ⅥA', 'ⅦA', '0族'];
function groupLabel(z) {
  const rc = gridRowCol(z);
  if (rc[0] === 8.6) return '镧系';
  if (rc[0] === 9.7) return '锕系';
  return GROUP_LABELS[rc[1] - 1];
}

const CELL_S = 1.02, ROW_S = 1.08;
function gridPos(z) {
  const [r, c] = gridRowCol(z);
  return new THREE.Vector3((c - 9.5) * CELL_S, 0, (r - 1) * ROW_S - 4.6);
}
// 三维螺旋：等弧长阿基米德螺线，按原子序数上升
function spiralPos(z) {
  const i = z - 1, S = 8.43;
  const ang = Math.sqrt(i * S);
  const rad = 0.274 * ang + 0.55;
  return new THREE.Vector3(Math.cos(ang) * rad, (i / 117) * 5.6 + 0.15, Math.sin(ang) * rad);
}
// 同心环：每周期一圈，镧系/锕系单独两小环（略升高避免穿插）
function ringMeta(ring) {
  if (ring === 10) return { rad: 3.1, y: 0.55 };
  if (ring === 11) return { rad: 3.9, y: 1.1 };
  return { rad: 1.7 + ring * 0.82, y: (ring - 1) * 0.16 };
}
const RING_OF = [];
{
  const counters = {};
  for (let z = 1; z <= 118; z++) {
    let ring;
    if (z >= 57 && z <= 71) ring = 10;
    else if (z >= 89 && z <= 103) ring = 11;
    else ring = gridRowCol(z)[0];
    RING_OF[z] = [ring, counters[ring] || 0];
    counters[ring] = (counters[ring] || 0) + 1;
  }
}
const RING_COUNT = { 1: 2, 2: 8, 3: 8, 4: 18, 5: 18, 6: 17, 7: 17, 10: 15, 11: 15 };
function ringsPos(z) {
  const [ring, idx] = RING_OF[z];
  const meta = ringMeta(ring);
  const ang = -Math.PI / 2 + (idx / RING_COUNT[ring]) * TAU;
  return new THREE.Vector3(Math.cos(ang) * meta.rad, meta.y, Math.sin(ang) * meta.rad);
}
const POS = { grid: [], spiral: [], rings: [] };
for (let z = 1; z <= 118; z++) {
  POS.grid.push(gridPos(z));
  POS.spiral.push(spiralPos(z));
  POS.rings.push(ringsPos(z));
}

/* ---------------- 本实验专属样式（不改动共享 lab.css） ---------------- */

const style = document.createElement('style');
style.textContent = `
.pt-legend {
  position: absolute; left: 14px; bottom: 86px; z-index: 10;
  display: none; flex-direction: column; gap: 5px;
  background: color-mix(in srgb, var(--card) 84%, transparent);
  backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
  border: 1px solid var(--card-border); border-radius: 12px;
  padding: 9px 12px; font-size: 12px; color: var(--text-dim);
  pointer-events: none; max-width: 220px;
}
.pt-legend .lg-row { display: flex; align-items: center; gap: 7px; }
.pt-legend .sw { width: 14px; height: 5px; border-radius: 2px; flex: none; }
.pt-legend .grad { width: 110px; height: 8px; border-radius: 4px; flex: none; }
.pt-info {
  position: absolute; top: 84px; right: 14px; z-index: 14;
  width: 288px; max-width: calc(100% - 28px);
  border-radius: 14px; overflow: hidden;
  border: 1px solid var(--card-border); box-shadow: var(--shadow);
  background: var(--card); display: none;
}
.pt-info-head { display: flex; align-items: center; gap: 10px; padding: 10px 12px; color: #fff; }
.pt-info-head .sym { font-size: 26px; font-weight: 800; letter-spacing: 1px; }
.pt-info-head .nm { font-size: 15px; font-weight: 700; line-height: 1.3; }
.pt-info-head .nm em { font-style: normal; font-size: 11.5px; opacity: .88; display: block; font-weight: 500; }
.pt-info-x { margin-left: auto; background: rgba(255,255,255,.2); border: none; color: #fff;
  width: 24px; height: 24px; border-radius: 50%; cursor: pointer; font-size: 12px; line-height: 1; flex: none; }
.pt-info-body { padding: 8px 12px 11px; font-size: 12.5px; line-height: 1.75; color: var(--text); }
.pt-info-body .r { display: flex; gap: 8px; }
.pt-info-body .r span { color: var(--text-dim); flex: none; }
.pt-info-body .r b { font-weight: 600; word-break: break-all; }
.pt-ie-cap { padding: 6px 12px 9px; font-size: 11px; line-height: 1.5; color: var(--text-dim); }
@media (max-width: 640px) {
  .pt-info { top: 64px; right: 10px; width: min(252px, calc(100% - 84px)); }
  .pt-legend { left: 10px; bottom: 86px; font-size: 11px; padding: 7px 10px; }
}
`;
document.head.appendChild(style);

/* ---------------- 场景 ---------------- */

const stage = document.getElementById('stage');
const loader = makeLoader(stage, '正在铺设元素周期表…');

const HOME = { pos: [0, 11.5, 12.8], tgt: [0, 1.2, 0.4] };
const app = createApp({
  container: stage,
  fov: 50, near: 0.1, far: 400,
  cameraPos: HOME.pos,
  target: HOME.tgt,
  minDistance: 4, maxDistance: 42,
  exposure: 1.05,
  keepBackground: true,
});
const { scene, camera, controls } = app;

scene.add(new THREE.AmbientLight(0xcdd6e0, 0.8));
const keyLight = new THREE.DirectionalLight(0xffffff, 1.5);
keyLight.position.set(6, 14, 8);
scene.add(keyLight);
const fillLight = new THREE.DirectionalLight(0x91a3c0, 0.55);
fillLight.position.set(-8, 6, -6);
scene.add(fillLight);

/* ---------------- 元素方格 ---------------- */

const FLAT_H = 0.32;
const cellGeo = new THREE.BoxGeometry(0.92, 1, 0.92);
cellGeo.translate(0, 0.5, 0); // 底面为原点，scale.y = 高度

const cells = [];       // { mesh, matTop, matSide, canvas, ctx, tex, baseColor, discovered }
const cellMeshes = [];
function buildCells() {
  for (let z = 1; z <= 118; z++) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    const matTop = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5, metalness: 0.1 });
    const matSide = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.62, metalness: 0.18 });
    const mesh = new THREE.Mesh(cellGeo, [matSide, matSide, matTop, matSide, matSide, matSide]);
    mesh.position.copy(POS.grid[z - 1]);
    mesh.scale.y = FLAT_H;
    mesh.userData.z = z;
    scene.add(mesh);
    cells.push({ mesh, matTop, matSide, canvas, ctx, tex, baseColor: new THREE.Color('#7d8794'), discovered: true });
    cellMeshes.push(mesh);
  }
}

function buildPlatform() {
  const plat = new THREE.Mesh(
    new THREE.BoxGeometry(19.6, 0.24, 11.8),
    new THREE.MeshStandardMaterial({ color: 0x333a46, roughness: 0.8, metalness: 0.22 })
  );
  plat.position.y = -0.12;
  scene.add(plat);
}

/* ---------------- 顶面贴图绘制 ---------------- */

const st = {
  mode: 'grid',
  barProp: null,        // null=平铺 / number / radius / eneg / ie
  faceMode: 'mass',     // 顶面数值行：mass / radius / eneg / ie / year / state
  colorMode: 'cat',     // cat / eneg / state
  hover: -1, selected: -1,
  bohrZ: 11, spin: true, shellsMarker: true,
  iePeriod: 2, ieProp: 'ie',
  temp: 298, tempMode: false, tempPlaying: false, tempSlider: null, hudTemp: null, gasList: [],
  year: 1650, yearPlaying: false, yearSpeed: 1, yearSlider: null, hudYear: null,
  legendOn: false, trendOn: false,
  morphSpeed: 1,
  flashes: [],
};

function enegColor(v) { return `hsl(${Math.round(215 - (v / 3.98) * 215)}, 62%, 46%)`; }
function faceBgHex(z) {
  const d = ELS[z - 1];
  if (st.colorMode === 'cat') return CAT_COLORS[d[9]];
  if (st.colorMode === 'eneg') return d[4] == null ? '#6f7680' : enegColor(d[4]);
  return STATE_COLORS[d[11] + 1];
}
function faceValueText(z) {
  const d = ELS[z - 1];
  switch (st.faceMode) {
    case 'radius': return d[3] == null ? '—' : d[3] + ' pm';
    case 'eneg': return d[4] == null ? '—' : d[4].toFixed(2);
    case 'ie': return d[5] == null ? '—' : String(d[5]);
    case 'year': return d[10] === 0 ? '古代' : String(d[10]);
    case 'state': return STATE_NAMES[d[11] + 1];
    default: return d[2];
  }
}
function paintCell(z) {
  const c = cells[z - 1], d = ELS[z - 1];
  const ctx = c.ctx;
  ctx.fillStyle = faceBgHex(z);
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = 'rgba(0,0,0,0.30)';
  ctx.lineWidth = 6;
  ctx.strokeRect(3, 3, 250, 250);
  ctx.fillStyle = 'rgba(255,255,255,0.93)';
  ctx.textAlign = 'left';
  ctx.font = '600 46px ' + FONT;
  ctx.fillText(String(z), 12, 46);
  ctx.textAlign = 'center';
  ctx.font = '700 94px ' + FONT;
  ctx.fillText(d[0], 128, 120);
  ctx.font = '500 40px ' + FONT;
  ctx.fillText(CN[z - 1], 128, 176);
  ctx.font = '400 28px ' + FONT;
  ctx.fillStyle = 'rgba(255,255,255,0.78)';
  ctx.fillText(faceValueText(z), 128, 224);
  c.tex.needsUpdate = true;
  c.baseColor.set(faceBgHex(z));
  c.matSide.color.copy(c.baseColor);
}
function paintAll() { for (let z = 1; z <= 118; z++) paintCell(z); }

/* ---------------- 柱高 / 材质状态 ---------------- */

function barHeight(z) {
  const d = ELS[z - 1];
  switch (st.barProp) {
    case 'number': return 0.35 + (z / 118) * 2.0;
    case 'radius': return d[3] == null ? 0.28 : 0.35 + clamp((d[3] - 30) / 181, 0, 1) * 1.9;
    case 'eneg': return d[4] == null ? 0.28 : 0.35 + (d[4] / 3.98) * 1.9;
    case 'ie': return d[5] == null ? 0.28 : 0.35 + (d[5] / 2372) * 1.9;
    default: return FLAT_H;
  }
}
const ease = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
function setHeights(fn, animate = true, dur = 0.9) {
  const targets = cells.map((c, i) => fn(i + 1));
  if (!animate) { cells.forEach((c, i) => { c.mesh.scale.y = targets[i]; }); return; }
  const from = cells.map((c) => c.mesh.scale.y);
  addTween(dur, (k) => {
    const e = ease(k);
    cells.forEach((c, i) => { c.mesh.scale.y = from[i] + (targets[i] - from[i]) * e; });
  });
}
function applyBaseFlags() {
  cells.forEach((c) => {
    const m = c.matSide, t = c.matTop;
    m.wireframe = false; m.transparent = false; m.opacity = 1;
    m.depthWrite = true; m.emissiveIntensity = 0;
    m.roughness = 0.62; m.metalness = 0.18;
    t.transparent = false; t.opacity = 1; t.depthWrite = true; t.color.set(0xffffff);
  });
}
function applyBright(pred) {
  cells.forEach((c, i) => {
    const bright = pred(i + 1);
    c.matTop.color.setScalar(bright ? 1 : 0.32);
    c.matSide.color.copy(c.baseColor).multiplyScalar(bright ? 1 : 0.3);
  });
}
function applyHoverEmissive() {
  cells.forEach((c, i) => {
    const z = i + 1;
    const it = z === st.hover ? 0.45 : z === st.selected ? 0.22 : 0;
    c.matSide.emissive.set(it > 0 ? 0xffffff : 0x000000);
    c.matSide.emissiveIntensity = it;
  });
}

/* ---------------- Bohr 电子层模型 ---------------- */

const bohrG = new THREE.Group();
bohrG.position.set(0, 7.6, 0.3);
bohrG.scale.setScalar(0.8);
bohrG.visible = false;
scene.add(bohrG);
const nucleus = new THREE.Mesh(
  new THREE.SphereGeometry(1, 28, 20),
  new THREE.MeshStandardMaterial({ color: 0x4a90c4, emissive: 0x4a90c4, emissiveIntensity: 0.35, roughness: 0.4 })
);
bohrG.add(nucleus);
const SHELL_R = Array.from({ length: 7 }, (_, s) => 1.35 + s * 0.62);
const bohrRings = SHELL_R.map((r) => {
  const l = circleLine(r, 0x93a7bd, 96, 'y');
  bohrG.add(l);
  return l;
});
const shellLabels = SHELL_R.map((r) => {
  const sp = makeTextSprite('0', { fontSize: 38, color: '#d6e6ff', scale: 0.021 });
  sp.position.set(r + 0.42, 0.14, 0);
  bohrG.add(sp);
  return sp;
});
const bohrTitle = makeTextSprite('', { fontSize: 52, color: '#eaf2ff', scale: 0.02 });
bohrTitle.position.set(0, 6.15, 0);
bohrG.add(bohrTitle);
const electronMesh = new THREE.InstancedMesh(
  new THREE.SphereGeometry(0.09, 10, 8),
  new THREE.MeshBasicMaterial({ color: 0xe8f2ff }),
  118
);
electronMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
electronMesh.frustumCulled = false;
bohrG.add(electronMesh);

function updateBohr(z) {
  st.bohrZ = z;
  const d = ELS[z - 1];
  const shells = SHELLS[z - 1];
  nucleus.scale.setScalar(0.40 + Math.pow(z, 0.36) * 0.055);
  nucleus.material.color.set(CAT_COLORS[d[9]]);
  nucleus.material.emissive.set(CAT_COLORS[d[9]]);
  bohrRings.forEach((ring, s) => { ring.visible = s < shells.length; });
  shellLabels.forEach((sp, s) => {
    const on = s < shells.length && st.shellsMarker;
    sp.visible = on;
    if (s < shells.length) setSpriteText(sp, String(shells[s]), { fontSize: 38, color: '#d6e6ff', scale: 0.021 });
  });
  setSpriteText(bohrTitle, `${d[0]} · ${CN[z - 1]}`, { fontSize: 52, color: '#eaf2ff', scale: 0.02 });
  if (st.hudBohr) {
    st.hudBohr.set('elem', `${CN[z - 1]} ${d[0]}（${z} 号）`);
    st.hudBohr.set('shell', `${shells.join('·')}（${shells.length} 层）· 第${periodOf(z)}周期 ${groupLabel(z)}`);
  }
}

/* ---------------- 布局变形 ---------------- */

const ringLabels = [
  ['周期 1', 1], ['周期 2', 2], ['周期 3', 3], ['周期 4', 4], ['周期 5', 5], ['周期 6', 6], ['周期 7', 7],
  ['镧系', 10], ['锕系', 11],
].map(([txt, ring]) => {
  const sp = makeTextSprite(txt, { fontSize: 34, color: '#b9c8da', scale: 0.018 });
  const meta = ringMeta(ring);
  const ang = -Math.PI / 2 + (ring >= 10 ? ring + 0.4 : ring) * 0.55; // 各环标签错开角度，避免堆叠
  sp.position.set(Math.cos(ang) * (meta.rad + 0.55), meta.y + 0.5, Math.sin(ang) * (meta.rad + 0.55));
  sp.visible = false;
  scene.add(sp);
  return sp;
});
function ringLabelsVisible(v) { ringLabels.forEach((sp) => { sp.visible = v; }); }
function morphTo(mode, dur = 1.2) {
  st.mode = mode;
  ringLabelsVisible(mode === 'rings');
  const targets = POS[mode];
  const from = cells.map((c) => c.mesh.position.clone());
  addTween(dur, (k) => {
    const e = ease(k);
    cells.forEach((c, i) => { c.mesh.position.lerpVectors(from[i], targets[i], e); });
  });
}

/* ---------------- 发现史 / 物态 ---------------- */

function discoveredAt(z, y) {
  const yr = ELS[z - 1][10];
  return yr === 0 || yr <= y;
}
function applyYear(y, withFlash) {
  st.year = y;
  let count = 0;
  const now = performance.now() * 0.001;
  cells.forEach((c, i) => {
    const vis = discoveredAt(i + 1, y);
    if (vis) count++;
    if (vis && !c.discovered) {
      c.discovered = true;
      c.mesh.visible = true;
      c.mesh.scale.y = FLAT_H;
      if (withFlash) st.flashes.push({ z: i + 1, t0: now });
    } else if (!vis && c.discovered) {
      c.discovered = false;
      c.mesh.visible = false;
      c.mesh.scale.y = 0.0001;
    }
  });
  if (st.hudYear) {
    st.hudYear.set('year', y + ' 年');
    st.hudYear.set('found', count + ' / 118');
  }
}
function stateAt(z, T) {
  const d = ELS[z - 1];
  const melt = d[6], boil = d[7];
  if (boil != null && T >= boil) return 'gas';          // He 熔点缺失但沸点 4K：298K 判为气态
  if (melt != null && T < melt) return 'solid';
  if (melt != null && boil != null) return 'liquid';
  return 'unknown';
}
function applyTempState() {
  st.gasList = [];
  const counts = { solid: 0, liquid: 0, gas: 0, unknown: 0 };
  cells.forEach((c, i) => {
    const s = stateAt(i + 1, st.temp);
    counts[s]++;
    const m = c.matSide, t = c.matTop;
    c.mesh.position.y = 0;
    c.mesh.scale.y = FLAT_H;
    if (s === 'gas') st.gasList.push(i + 1);
    if (s === 'solid') {
      m.wireframe = false; m.transparent = false; m.opacity = 1; m.depthWrite = true;
      m.color.copy(c.baseColor);
      t.transparent = false; t.opacity = 1; t.depthWrite = true; t.color.set(0xffffff);
    } else if (s === 'liquid') {
      m.wireframe = false;
      m.transparent = true; m.opacity = 0.72; m.depthWrite = true;
      m.roughness = 0.12; m.metalness = 0.42;
      m.color.copy(c.baseColor);
      t.transparent = true; t.opacity = 0.9; t.depthWrite = true; t.color.set(0xffffff);
    } else if (s === 'gas') {
      m.wireframe = true; m.transparent = false; m.opacity = 1; m.depthWrite = true;
      m.color.copy(c.baseColor).lerp(new THREE.Color(0xffffff), 0.25);
      m.roughness = 0.5; m.metalness = 0.1;
      t.transparent = true; t.opacity = 0.16; t.depthWrite = false; t.color.set(0xffffff);
      c.mesh.scale.y = 0.62;
    } else {
      m.wireframe = false; m.transparent = false; m.opacity = 1; m.depthWrite = true;
      m.color.set(0x6f7680);
      m.roughness = 0.8; m.metalness = 0.05;
      t.transparent = false; t.opacity = 1; t.depthWrite = true; t.color.setScalar(0.45);
    }
  });
  if (st.hudTemp) {
    st.hudTemp.set('temp', `${Math.round(st.temp)} K / ${(st.temp - 273).toFixed(0)} ℃`);
    st.hudTemp.set('count', `固 ${counts.solid} · 液 ${counts.liquid} · 气 ${counts.gas} · 未知 ${counts.unknown}`);
  }
}

/* ---------------- DOM 覆盖层：HUD / 图例 / 趋势 / 电离能图窗 / 信息卡 ---------------- */

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

const legendEl = document.createElement('div');
legendEl.className = 'pt-legend';
stage.appendChild(legendEl);
function legendRow(color, text) {
  const r = document.createElement('div');
  r.className = 'lg-row';
  const sw = document.createElement('span');
  sw.className = 'sw';
  sw.style.background = color;
  r.appendChild(sw);
  r.appendChild(document.createTextNode(text));
  return r;
}
function renderLegend() {
  legendEl.innerHTML = '';
  if (st.colorMode === 'cat') {
    CAT_NAMES.forEach((n, i) => legendEl.appendChild(legendRow(CAT_COLORS[i], n)));
  } else if (st.colorMode === 'eneg') {
    const r = document.createElement('div');
    r.className = 'lg-row';
    const g = document.createElement('span');
    g.className = 'grad';
    g.style.background = `linear-gradient(90deg, ${enegColor(0.5)}, ${enegColor(2)}, ${enegColor(3.98)})`;
    r.appendChild(g);
    r.appendChild(document.createTextNode('电负性 小 → 大'));
    legendEl.appendChild(r);
    legendEl.appendChild(legendRow('#6f7680', '无数据（稀有气体 / 人工合成）'));
  } else {
    STATE_NAMES.forEach((n, i) => legendEl.appendChild(legendRow(STATE_COLORS[i], n)));
  }
}

const trendBox = document.createElement('div');
trendBox.className = 'pt-legend';
stage.appendChild(trendBox);
function renderTrend() {
  const rad = st.barProp === 'radius';
  trendBox.innerHTML = '';
  trendBox.appendChild(legendRow(rad ? 'linear-gradient(90deg,#e5e9ee,#9aa6b2)' : 'linear-gradient(90deg,#9aa6b2,#e5e9ee)',
    rad ? '→ 同周期 左→右：半径减小' : '→ 同周期 左→右：电负性增大'));
  trendBox.appendChild(legendRow(rad ? 'linear-gradient(0deg,#9aa6b2,#e5e9ee)' : 'linear-gradient(0deg,#e5e9ee,#9aa6b2)',
    rad ? '↓ 同族 上→下：半径增大' : '↓ 同族 上→下：电负性减小'));
  if (rad) trendBox.appendChild(legendRow('#6f7680', '注：稀有气体半径测法口径不同，比较需留意'));
}

// 电离能 2D 角落图窗（coastal-window 样式）
const ieWindow = document.createElement('div');
ieWindow.className = 'coastal-window';
ieWindow.style.display = 'none';
const ieHeadB = document.createElement('b');
{
  const head = document.createElement('div');
  head.className = 'cw-head';
  head.appendChild(ieHeadB);
  ieWindow.appendChild(head);
}
const ieCanvas = document.createElement('canvas');
ieCanvas.width = 552;
ieCanvas.height = 300;
ieWindow.appendChild(ieCanvas);
const ieCap = document.createElement('div');
ieCap.className = 'pt-ie-cap';
ieWindow.appendChild(ieCap);
stage.appendChild(ieWindow);
const ieCtx = ieCanvas.getContext('2d');

function drawIEWindow() {
  const per = st.iePeriod;
  const z0 = per === 2 ? 3 : 11;
  const list = [];
  for (let z = z0; z < z0 + 8; z++) list.push(z);
  const propIdx = st.ieProp === 'ie' ? 5 : 4;
  const vals = list.map((z) => ELS[z - 1][propIdx]);
  const max = Math.max(...vals.map((v) => (v == null ? 0 : v)));
  const W = 276, H = 150;
  ieCtx.setTransform(2, 0, 0, 2, 0, 0);
  ieCtx.clearRect(0, 0, W, H);
  const base = 114, top = 24, bw = 24;
  const gap = (W - 8 * bw - 16) / 7;
  vals.forEach((v, i) => {
    const x = 8 + i * (bw + gap);
    const h = v == null ? 4 : Math.max(6, (v / max) * (base - top));
    ieCtx.fillStyle = faceBgHex(list[i]);
    ieCtx.beginPath();
    if (ieCtx.roundRect) ieCtx.roundRect(x, base - h, bw, h, [4, 4, 0, 0]);
    else ieCtx.rect(x, base - h, bw, h);
    ieCtx.fill();
    ieCtx.textAlign = 'center';
    ieCtx.fillStyle = 'rgba(140,152,166,0.95)';
    ieCtx.font = '600 11px ' + FONT;
    ieCtx.fillText(ELS[list[i] - 1][0], x + bw / 2, base + 15);
    ieCtx.fillStyle = v == null ? 'rgba(140,152,166,0.7)' : 'rgba(205,216,228,0.95)';
    ieCtx.font = '500 10px ' + FONT;
    ieCtx.fillText(v == null ? '—' : String(v), x + bw / 2, base - h - 5);
  });
  if (st.ieProp === 'ie') {
    ieCtx.strokeStyle = '#e0684b';
    ieCtx.lineWidth = 1.6;
    [2, 5].forEach((i) => {
      const x = 8 + i * (bw + gap);
      const h = (vals[i] / max) * (base - top);
      ieCtx.strokeRect(x - 2.5, base - h - 2.5, bw + 5, h + 5);
    });
  }
  ieHeadB.textContent = `第 ${per} 周期 · ${st.ieProp === 'ie' ? '第一电离能 kJ/mol' : '电负性'}`;
  ieCap.textContent = st.ieProp === 'ie'
    ? (per === 2
      ? '红框：Be＞B、N＞O 的「锯齿」——2s/2p 全满或半满结构更稳定，失电子反而更难'
      : '红框：Mg＞Al、P＞S，同样是全满/半满更稳造成的锯齿')
    : '电负性从左到右持续增大（稀有气体通常不标数值）';
}

// 元素信息卡
const infoEl = document.createElement('div');
infoEl.className = 'pt-info';
stage.appendChild(infoEl);
function fmtYear(y) { return y === 0 ? '古代' : y + ' 年'; }
function showInfo(z) {
  st.selected = z;
  const d = ELS[z - 1];
  const bg = faceBgHex(z);
  const shells = SHELLS[z - 1];
  const rows = [
    ['相对原子质量', d[2] == null ? '—' : d[2]],
    ['电子层分布', `${shells.join(' · ')}（${shells.length} 层）`],
    ['电子排布', d[8]],
    ['周期 / 族', `第 ${periodOf(z)} 周期 · ${groupLabel(z)}`],
    ['原子半径', d[3] == null ? '—' : d[3] + ' pm'],
    ['电负性', d[4] == null ? '—' : d[4]],
    ['第一电离能', d[5] == null ? '—' : d[5] + ' kJ/mol'],
    ['熔点 / 沸点', d[6] == null && d[7] == null ? '—' : `${d[6] == null ? '—' : d[6] + ' K'} / ${d[7] == null ? '—' : d[7] + ' K'}`],
    ['常温状态', { solid: '固态', liquid: '液态', gas: '气态', unknown: '—' }[stateAt(z, 298)]],
    ['发现', fmtYear(d[10])],
    ['密度', d[12] == null ? '—' : d[12] + ' g/cm³'],
  ];
  infoEl.innerHTML = `
    <div class="pt-info-head" style="background:${bg}">
      <span class="sym"></span>
      <span class="nm"></span>
      <button class="pt-info-x" type="button">✕</button>
    </div>
    <div class="pt-info-body"></div>`;
  infoEl.querySelector('.sym').textContent = d[0];
  infoEl.querySelector('.nm').innerHTML = '';
  const nm = infoEl.querySelector('.nm');
  nm.appendChild(document.createTextNode(`${CN[z - 1]} · ${d[1]}`));
  const em = document.createElement('em');
  em.textContent = `原子序数 ${z} · ${CAT_NAMES[d[9]]}`;
  nm.appendChild(em);
  const body = infoEl.querySelector('.pt-info-body');
  rows.forEach(([k, v]) => {
    const r = document.createElement('div');
    r.className = 'r';
    const s = document.createElement('span');
    s.textContent = k;
    const b = document.createElement('b');
    b.textContent = v;
    r.appendChild(s);
    r.appendChild(b);
    body.appendChild(r);
  });
  infoEl.querySelector('.pt-info-x').addEventListener('click', hideInfo);
  infoEl.style.display = '';
  applyHoverEmissive();
}
function hideInfo() {
  st.selected = -1;
  infoEl.style.display = 'none';
  applyHoverEmissive();
}

/* ---------------- 帧循环 ---------------- */

const tweens = [];
function addTween(dur, fn, onDone) { tweens.push({ t: 0, dur, fn, onDone }); }

const _m4 = new THREE.Matrix4();
const _zeroM = new THREE.Matrix4().makeScale(0.0001, 0.0001, 0.0001);
let bohrT = 0;

let labReady = false;

app.onFrame((dt) => {
  if (!labReady) return; // 帧循环就绪守卫（公约 2.1）
  cameraTweenTick(app, dt);
  const now = performance.now() * 0.001;

  for (let i = tweens.length - 1; i >= 0; i--) {
    const tw = tweens[i];
    tw.t += dt;
    const k = Math.min(tw.t / tw.dur, 1);
    tw.fn(k);
    if (k >= 1) { tweens.splice(i, 1); if (tw.onDone) tw.onDone(); }
  }

  if (bohrG.visible) {
    bohrT += dt;
    if (st.spin) bohrG.rotation.y += dt * 0.5;
    const shells = SHELLS[st.bohrZ - 1];
    let idx = 0;
    for (let s = 0; s < shells.length; s++) {
      const R = SHELL_R[s], n = shells[s], sp = 1.7 - s * 0.18;
      for (let j = 0; j < n; j++) {
        const a = bohrT * sp + (j / n) * TAU + s * 0.8;
        _m4.makeTranslation(Math.cos(a) * R, 0, Math.sin(a) * R);
        electronMesh.setMatrixAt(idx++, _m4);
      }
    }
    while (idx < 118) electronMesh.setMatrixAt(idx++, _zeroM);
    electronMesh.instanceMatrix.needsUpdate = true;
  }

  if (st.yearPlaying) {
    st.year = Math.min(2015, st.year + dt * 12.2 * st.yearSpeed);
    if (st.yearSlider) st.yearSlider.set(Math.round(st.year));
    applyYear(Math.round(st.year), true);
    if (st.year >= 2015) setYearPlaying(false);
  }

  if (st.tempPlaying) {
    st.temp = Math.min(4000, st.temp + dt * 200);
    if (st.tempSlider) st.tempSlider.set(Math.round(st.temp));
    applyTempState();
    if (st.temp >= 6000) setTempPlaying(false);
  }

  if (st.tempMode && st.gasList.length) {
    for (const z of st.gasList) {
      cells[z - 1].mesh.position.y = Math.sin(now * 2.1 + z * 1.7) * 0.05;
    }
  }

  for (let i = st.flashes.length - 1; i >= 0; i--) {
    const f = st.flashes[i];
    const c = cells[f.z - 1];
    const k = (now - f.t0) / 1.1;
    if (k >= 1 || !c.mesh.visible) {
      c.matSide.emissiveIntensity = 0;
      st.flashes.splice(i, 1);
    } else {
      c.matSide.emissive.set(0xffffff);
      c.matSide.emissiveIntensity = (1 - k) * 0.85;
    }
  }
});

function setYearPlaying(v) {
  st.yearPlaying = v;
  if (st.yearPlayBtn) {
    st.yearPlayBtn.textContent = v ? '⏸ 暂停' : '▶ 播放发现史';
    st.yearPlayBtn.classList.toggle('active', v);
  }
  if (!v && st.year >= 2015 && st.yearSlider) st.yearSlider.set(2015);
}
function setTempPlaying(v) {
  st.tempPlaying = v;
  if (st.tempPlayBtn) {
    st.tempPlayBtn.textContent = v ? '⏸ 暂停升温' : '▶ 播放升温（0→6000 K）';
    st.tempPlayBtn.classList.toggle('active', v);
  }
}

/* ---------------- 拾取与点击 ---------------- */

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
function pickCell(ev) {
  const r = app.dom.getBoundingClientRect();
  pointer.x = ((ev.clientX - r.left) / r.width) * 2 - 1;
  pointer.y = -((ev.clientY - r.top) / r.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(cellMeshes, false).filter((h) => h.object.visible);
  return hits.length ? hits[0].object.userData.z : -1;
}
let downPos = null;
app.dom.addEventListener('pointerdown', (e) => {
  downPos = [e.clientX, e.clientY, performance.now()];
});
app.dom.addEventListener('pointerup', (e) => {
  if (!downPos) return;
  const dx = e.clientX - downPos[0], dy = e.clientY - downPos[1];
  const dtp = performance.now() - downPos[2];
  downPos = null;
  if (dx * dx + dy * dy > 36 || dtp > 450) return;
  const z = pickCell(e);
  if (z > 0) {
    showInfo(z);
    if (currentSection === 1) selectBohr(z);
    if (currentSection === 0 && hud) hud.set('sel', `${CN[z - 1]} ${ELS[z - 1][0]}`);
  } else {
    hideInfo();
  }
});
app.dom.addEventListener('pointermove', (e) => {
  if (!labReady) return;
  const z = pickCell(e);
  if (z !== st.hover) {
    st.hover = z;
    applyHoverEmissive();
    app.dom.style.cursor = z > 0 ? 'pointer' : '';
  }
});

/* ---------------- 章节状态复位 ---------------- */

const ctl = createControlsPanel(document.getElementById('controls'));
let activeSectionCleanup = null;
let currentSection = 0;

function resetWorld() {
  tweens.length = 0;
  st.hover = -1;
  hideInfo();
  bohrG.visible = false;
  ieWindow.style.display = 'none';
  trendBox.style.display = 'none';
  legendEl.style.display = 'none';
  st.yearPlaying = false;
  st.tempPlaying = false;
  st.tempMode = false;
  st.barProp = null;
  st.faceMode = 'mass';
  st.colorMode = 'cat';
  st.flashes.length = 0;
  applyBaseFlags();
  paintAll();
  cells.forEach((c) => { c.discovered = true; c.mesh.visible = true; });
  if (st.mode !== 'grid') {
    morphTo('grid', 0.9);
    cells.forEach((c) => { c.mesh.scale.y = FLAT_H; });
  } else {
    cells.forEach((c, i) => {
      c.mesh.position.copy(POS.grid[i]);
      c.mesh.scale.y = FLAT_H;
    });
  }
}

/* ---------------- 章节定义 ---------------- */

function setPropertyMode(v) {
  st.barProp = v;
  st.faceMode = v === 'number' ? 'mass' : v;
  paintAll();
  setHeights(barHeight, true, 0.9);
  if (currentSection === 0 && hud) hud.set('val', { number: '柱高 = 原子序数', radius: '柱高 = 原子半径 (pm)', eneg: '柱高 = 电负性', ie: '柱高 = 第一电离能' }[v]);
}

const SECTIONS = [
  {
    title: '认识周期表',
    html: `<p>目前已知 <b>118 种元素</b>按原子序数排成一张表：横行叫<b>周期</b>（共 7 个），纵列叫<b>族</b>（16 个族，其中第 8/9/10 列合称第 Ⅷ 族）。表下方独立两行是 <span class="hl">镧系（57–71）</span>与 <span class="hl">锕系（89–103）</span>。</p>
<p>颜色代表元素分类（碱金属、过渡金属、非金属、稀有气体……）。把鼠标移到方格上会<b>高亮</b>，<b>点击</b>任意方格可打开元素档案。</p>
<p>切换「属性柱高」，让整张表按原子序数 / 原子半径 / 电负性 / 电离能<b>升起成柱</b>，直观看数据在表上的分布规律。</p>`,
    enter() {
      resetWorld();
      currentSection = 0;
      st.barProp = 'number';
      app.setCamera(HOME.pos, HOME.tgt);
      buildHud([['sel', '选中'], ['val', '属性']]);
      hud.set('sel', '点击方格查看');
      hud.set('val', '柱高 = 原子序数');
      ctl.clear();
      ctl.seg({
        options: [
          { label: '原子序数', value: 'number' },
          { label: '原子半径', value: 'radius' },
          { label: '电负性', value: 'eneg' },
          { label: '电离能', value: 'ie' },
        ],
        value: 'number',
        onChange: (v) => setPropertyMode(v),
      });
      ctl.sep();
      ctl.toggle({
        label: '族图例', value: false,
        onChange: (v) => { st.legendOn = v; legendEl.style.display = v ? '' : 'none'; if (v) renderLegend(); },
      });
      ctl.button({ label: '⌂ 复位视角', onClick: () => app.setCamera(HOME.pos, HOME.tgt) });
      setHeights(barHeight, true, 1.1);
    },
  },
  {
    title: '电子层与周期',
    html: `<p>核外电子按能量高低<b>分层排布</b>（K、L、M……层），用 Bohr 模型表示：原子核在中心，电子在同心的电子层上运动。</p>
<p><span class="hl">周期数 = 电子层数</span>：钠的电子层分布是 2、8、1，共 3 层，所以在第 3 周期。稀有气体最外层 8 电子（He 为 2）是<b>稳定结构</b>，所以化学性质很不活泼。</p>
<p>拖动滑杆或<b>点击表中任意方格</b>选择元素，看它的电子层模型；每层旁的数字是该层电子数。</p>`,
    enter() {
      resetWorld();
      currentSection = 1;
      app.setCamera([6.5, 10.6, 9.8], [0, 6.6, 0.3]);
      bohrG.visible = true;
      st.hudBohr = buildHud([['elem', '元素'], ['shell', '电子层']]);
      updateBohr(st.bohrZ);
      applyBright((z) => z === st.bohrZ);
      setHeights((z) => (z === st.bohrZ ? 2.3 : FLAT_H), false);
      ctl.clear();
      st.zSlider = ctl.slider({
        label: '原子序数', min: 1, max: 118, value: st.bohrZ,
        fmt: (v) => `${v} · ${CN[v - 1]} ${ELS[v - 1][0]}`,
        onInput: (v) => selectBohr(v),
      });
      ctl.button({ label: '🎲 随机元素', onClick: () => selectBohr(1 + Math.floor(Math.random() * 118)) });
      ctl.toggle({
        label: '层数标注', value: true,
        onChange: (v) => { st.shellsMarker = v; updateBohr(st.bohrZ); },
      });
      ctl.toggle({
        label: '自转', value: true,
        onChange: (v) => { st.spin = v; },
      });
    },
  },
  {
    title: '原子半径与电负性',
    html: `<p><b>原子半径</b>：同一周期从左到右，核电荷数增大、原子核对电子的吸引变强，半径<span class="hl">逐渐减小</span>；同一族从上到下，电子层数增多，半径<span class="hl">逐渐增大</span>。</p>
<p><b>电负性</b>（原子吸引电子能力的度量）：同周期从左到右<span class="hl">增大</span>，同族从上到下<span class="hl">减小</span>——所以右上角的氟（3.98）是"最抢电子"的元素。稀有气体一般不标数值。</p>
<p>用「周期聚焦」只点亮某一个周期，趋势一目了然。注：本数据集中稀有气体半径与相邻卤素口径不同（测法差异），横向比较时需留意。</p>`,
    enter() {
      resetWorld();
      currentSection = 2;
      st.barProp = 'radius';
      st.faceMode = 'radius';
      paintAll();
      app.setCamera(HOME.pos, HOME.tgt);
      buildHud([['prop', '属性'], ['focus', '聚焦']]);
      hud.set('prop', '原子半径');
      hud.set('focus', '全部周期');
      ctl.clear();
      ctl.seg({
        options: [
          { label: '原子半径', value: 'radius' },
          { label: '电负性', value: 'eneg' },
        ],
        value: 'radius',
        onChange: (v) => {
          st.barProp = v;
          st.faceMode = v;
          paintAll();
          setHeights(barHeight, true, 0.9);
          renderTrend();
          hud.set('prop', v === 'radius' ? '原子半径' : '电负性');
        },
      });
      ctl.sep();
      st.focusSlider = ctl.slider({
        label: '周期聚焦', min: 0, max: 7, value: 0,
        fmt: (v) => (v === 0 ? '全部' : `第 ${v} 周期`),
        onInput: (v) => {
          applyBright(z => v === 0 || periodOf(z) === v);
          hud.set('focus', v === 0 ? '全部' : `第 ${v} 周期`);
        },
      });
      ctl.toggle({
        label: '趋势标注', value: false,
        onChange: (v) => { st.trendOn = v; trendBox.style.display = v ? '' : 'none'; if (v) renderTrend(); },
      });
      ctl.button({ label: '▶ 升起动画', onClick: () => setHeights(barHeight, true, 0.9) });
      ctl.button({
        label: '显示全部周期',
        onClick: () => { applyBright(() => true); if (st.focusSlider) st.focusSlider.set(0); hud.set('focus', '全部'); },
      });
      setHeights(barHeight, true, 1.0);
    },
  },
  {
    title: '电离能的锯齿',
    html: `<p><b>第一电离能</b>：从气态原子拿走一个电子所需的最小能量，反映原子"守"电子的能力。总体上随原子序数增大呈<b>周期性变化</b>：同周期从左到右总体增大。</p>
<p>但曲线不是平滑的——右下角图窗画出第 2 / 3 周期的柱状图，<span class="hl">Be＞B、N＞O</span>（第 3 周期是 Mg＞Al、P＞S）出现"锯齿"：2s / 2p 能级<b>全满或半满</b>的结构更稳定，失电子反而更难。</p>
<p>3D 表里每根柱子按电离能升起，He（2372 kJ/mol）最高——稀有气体满层结构最难失电子。</p>`,
    enter() {
      resetWorld();
      currentSection = 3;
      st.barProp = 'ie';
      st.faceMode = 'ie';
      paintAll();
      app.setCamera(HOME.pos, HOME.tgt);
      buildHud([['prop', '属性'], ['peak', '最高']]);
      hud.set('prop', '第一电离能');
      hud.set('peak', 'He 2372 kJ/mol');
      ieWindow.style.display = '';
      drawIEWindow();
      ctl.clear();
      ctl.seg({
        options: [
          { label: '第 2 周期', value: 2 },
          { label: '第 3 周期', value: 3 },
        ],
        value: 2,
        onChange: (v) => { st.iePeriod = v; drawIEWindow(); },
      });
      ctl.sep();
      ctl.seg({
        options: [
          { label: '电离能', value: 'ie' },
          { label: '电负性', value: 'eneg' },
        ],
        value: 'ie',
        onChange: (v) => {
          st.barProp = v;
          st.faceMode = v;
          paintAll();
          setHeights(barHeight, true, 0.9);
          drawIEWindow();
          hud.set('prop', v === 'ie' ? '第一电离能' : '电负性');
          hud.set('peak', v === 'ie' ? 'He 2372 kJ/mol' : 'F 3.98（最大）');
        },
      });
      ctl.toggle({
        label: '2D 图窗', value: true,
        onChange: (v) => { ieWindow.style.display = v ? '' : 'none'; },
      });
      ctl.button({ label: '▶ 升起动画', onClick: () => setHeights(barHeight, true, 0.9) });
      setHeights(barHeight, true, 1.0);
    },
  },
  {
    title: '物态与温度',
    html: `<p>温度决定单质的物态：<b>T 低于熔点 → 固态</b>；<span class="hl">熔点 ≤ T ＜ 沸点 → 液态</span>；<b>T ≥ 沸点 → 气态</b>（图中气态画成线框并微微升起）。</p>
<p>室温（298 K ≈ 25 ℃）下只有<b>2 种液态单质</b>：汞（唯一液态金属）和溴；<b>11 种气体</b>：H、He、N、O、F、Ne、Cl、Ar、Kr、Xe、Rn。降到 <b>10 K</b>，除氦以外全部凝固——常压下氦永远不凝固；升到 <b>303 K</b>，镓和铯也熔化了（镓放在手心就会熔化）。</p>
<p>再往上，3000 K 以上金属发出白炽的光；<span class="hl">钨（3695 K）是熔点最高的金属</span>，所以用它做灯丝。拖动温度滑杆、点快捷温度档或播放升温扫描，看整张表"熔化又沸腾"。</p>
<p>熔沸点数据不足以判断物态的元素（多为人工合成元素）显示为灰色「未知」。</p>`,
    enter() {
      resetWorld();
      currentSection = 4;
      st.tempMode = true;
      st.temp = 298;
      app.setCamera(HOME.pos, HOME.tgt);
      st.hudTemp = buildHud([['temp', '温度'], ['count', '统计']]);
      applyTempState();
      ctl.clear();
      st.tempSlider = ctl.slider({
        label: '温度', min: 0, max: 6000, step: 1, value: 298,
        fmt: (v) => `${Math.round(v)} K / ${(v - 273).toFixed(0)} ℃`,
        onInput: (v) => { st.temp = v; setTempPlaying(false); applyTempState(); },
      });
      ctl.sep();
      const setTemp = (t) => { st.temp = t; setTempPlaying(false); if (st.tempSlider) st.tempSlider.set(t); applyTempState(); };
      ctl.button({ label: '10 K · 全凝固', onClick: () => setTemp(10) });
      ctl.button({ label: '液氮 77 K', onClick: () => setTemp(77) });
      ctl.button({ label: '室温 298 K', onClick: () => setTemp(298) });
      ctl.button({ label: '铁熔化 1811 K', onClick: () => setTemp(1811) });
      ctl.button({ label: '太阳表面 5800 K', onClick: () => setTemp(5800) });
      st.tempPlayBtn = ctl.button({
        label: '▶ 播放升温（0→6000 K）',
        onClick: () => {
          if (st.tempPlaying) { setTempPlaying(false); return; }
          if (st.temp >= 6000) { st.temp = 0; if (st.tempSlider) st.tempSlider.set(0); }
          setTempPlaying(true);
        },
      });
      ctl.toggle({
        label: '统计窗', value: true,
        onChange: (v) => { if (hud) hud.show(v); },
      });
      ctl.button({
        label: '↺ 回到 298 K',
        onClick: () => { st.temp = 298; setTempPlaying(false); if (st.tempSlider) st.tempSlider.set(298); applyTempState(); },
      });
    },
  },
  {
    title: '元素发现史',
    html: `<p>人类认识元素用了几千年：古代就会使用<b>金、银、铜、铁、硫、碳</b>等（方格上标「古代」）；1669 年起化学家陆续发现新元素；<span class="hl">1860 年前后</span>光谱分析法带来一波发现高峰；<b>1940 年以后</b>的元素几乎全靠核反应人工合成。</p>
<p>两个关键年份：<span class="hl">1869 年门捷列夫</span>排出周期表时只知道 63 种元素，他大胆为未知元素留空并预言其性质，后来发现的镓、钪、锗证实了预言；<b>1898 年</b>前后氖、氪、氙相继出现，周期表多出了一整列稀有气体。</p>
<p>拖动年份滑杆回放：只有「发现年份 ≤ 当前年份」的元素立在地面上，新出现的元素会<b>闪亮一次</b>。点「播放」看 1650→2016 的完整发现史。</p>`,
    enter() {
      resetWorld();
      currentSection = 5;
      st.faceMode = 'year';
      paintAll();
      app.setCamera(HOME.pos, HOME.tgt);
      st.hudYear = buildHud([['year', '年份'], ['found', '已发现']]);
      applyYear(1650, false);
      ctl.clear();
      st.yearSlider = ctl.slider({
        label: '年份', min: 1650, max: 2016, step: 1, value: 1650,
        fmt: (v) => v + ' 年',
        onInput: (v) => { setYearPlaying(false); applyYear(v, false); },
      });
      st.yearPlayBtn = ctl.button({
        label: '▶ 播放发现史',
        onClick: () => {
          if (st.yearPlaying) { setYearPlaying(false); return; }
          if (st.year >= 2016) { applyYear(1650, false); if (st.yearSlider) st.yearSlider.set(1650); }
          setYearPlaying(true);
        },
      });
      ctl.slider({
        label: '速度', min: 0.5, max: 3, step: 0.5, value: 1,
        fmt: (v) => v.toFixed(1) + '×',
        onInput: (v) => { st.yearSpeed = v; },
      });
      ctl.button({
        label: '↺ 重置',
        onClick: () => { setYearPlaying(false); applyYear(1650, false); if (st.yearSlider) st.yearSlider.set(1650); },
      });
    },
  },
  {
    title: '螺旋与同心环',
    html: `<p>同一张周期表的三种视角：</p>
<p><b>长式网格</b>——最常用，突出族的相似性；<b>三维螺旋</b>——按原子序数排成一条上升的螺线，每绕一圈是一个周期，<span class="hl">同一族的元素落在同一条"辐条"上</span>，强调性质随原子序数<b>周期性地重复</b>；<b>同心环</b>——每个周期画成一圈、一圈比一圈大，第 n 圈就是第 n 周期，每圈的格数依次是 <b>2、8、8、18、18、32、32</b>，正是每个周期所含的元素数目（镧系、锕系单独成两个小环）。</p>
<p>切换布局看变形动画，再换一种<b>着色</b>（族 / 电负性 / 物态）观察规律在不同布局里同样成立。</p>`,
    enter() {
      resetWorld();
      currentSection = 6;
      app.setCamera([2.5, 9.5, 19.5], [0, 2.8, 0]); // 斜视角：螺旋的高度与环的椭圆都能看清
      buildHud([['layout', '布局'], ['color', '着色']]);
      hud.set('layout', '长式网格');
      hud.set('color', '族分类');
      legendEl.style.display = '';
      renderLegend();
      ctl.clear();
      ctl.seg({
        options: [
          { label: '长式网格', value: 'grid' },
          { label: '三维螺旋', value: 'spiral' },
          { label: '同心环', value: 'rings' },
        ],
        value: 'grid',
        onChange: (v) => {
          morphTo(v, 1.2 / st.morphSpeed);
          hud.set('layout', { grid: '长式网格', spiral: '三维螺旋', rings: '同心环' }[v]);
        },
      });
      ctl.sep();
      ctl.slider({
        label: '变形速度', min: 0.5, max: 2.5, step: 0.5, value: 1,
        fmt: (v) => v.toFixed(1) + '×',
        onInput: (v) => { st.morphSpeed = v; },
      });
      ctl.sep();
      ctl.seg({
        options: [
          { label: '族', value: 'cat' },
          { label: '电负性', value: 'eneg' },
          { label: '物态', value: 'state' },
        ],
        value: 'cat',
        onChange: (v) => {
          st.colorMode = v;
          st.faceMode = v === 'cat' ? 'mass' : v;
          paintAll();
          renderLegend();
          hud.set('color', { cat: '族分类', eneg: '电负性', state: '标况物态' }[v]);
        },
      });
    },
  },
  {
    title: '随堂检测',
    html: `<p>5 道选择题，检验周期律这一节的掌握情况。</p>`,
    enter() {
      resetWorld();
      currentSection = 7;
      app.setCamera([0, 14, 16], [0, 2, 0.3]);
      hudWrap.innerHTML = '';
      hud = null;
      ctl.clear();
      showQuiz();
    },
  },
];

function selectBohr(z) {
  if (st.zSlider) st.zSlider.set(z);
  updateBohr(z);
  applyBright((w) => w === z);
  setHeights((w) => (w === z ? 2.3 : FLAT_H), true, 0.35);
  showInfo(z);
}

/* ---------------- 随堂检测 ---------------- */

const QUIZ = [
  {
    q: '氯原子的电子层分布是 2、8、7。它位于周期表的第几周期？',
    opts: ['第一周期', '第二周期', '第三周期', '第四周期'],
    a: 2,
    ex: '周期数 = 原子的电子层数。氯有 3 个电子层，所以位于第 3 周期；最外层 7 个电子，位于第 ⅦA 族（卤素）。',
  },
  {
    q: '同一周期元素从左到右（稀有气体除外），原子半径与电负性的变化是？',
    opts: ['半径增大，电负性减小', '半径减小，电负性增大', '两者都增大', '两者都减小'],
    a: 1,
    ex: '同周期从左到右核电荷数增大、核对电子吸引更强：原子半径逐渐减小，得电子能力增强、电负性逐渐增大。',
  },
  {
    q: '0 族（稀有气体）元素化学性质很不活泼，原因是？',
    opts: ['最外层达到稳定结构（8 电子，He 为 2 电子）', '原子半径最小', '核电荷数最大', '电子层数最少'],
    a: 0,
    ex: '稀有气体最外层 8 电子（氦为 2 电子）属于稳定结构，既不容易失电子也不容易得电子，所以化学性质稳定。',
  },
  {
    q: '第 2 周期第一电离能出现 Be＞B、N＞O 的"锯齿"，原因是？',
    opts: ['测定仪器误差', '2s、2p 能级全满或半满的结构更稳定，失电子更难', '相对原子质量不同', '它们的电负性相同'],
    a: 1,
    ex: 'Be（2s²全满）、N（2p³半满）的结构特别稳定，拿走一个电子要付出更多能量，所以电离能反而比右边相邻元素高。第 3 周期的 Mg＞Al、P＞S 同理。',
  },
  {
    q: '室温（约 298 K）下呈液态的金属单质是？',
    opts: ['溴', '汞', '水', '酒精'],
    a: 1,
    ex: '汞（Hg）是唯一在室温下呈液态的金属单质；溴是液态非金属单质；水和酒精是化合物，不是单质。',
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
      <p style="color:var(--text-dim);margin:4px 0 18px">正确率 ${pct}%${pct >= 80 ? '，周期律你已经掌握了！' : pct >= 60 ? '，大部分概念已经清楚，回顾一下错题。' : '，建议回到前面章节再看一遍哦。'}</p>`;
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

/* ---------------- 启动 ---------------- */

loadAll([
  { key: 'sky', label: '环境光', job: loadHDR('../assets/textures/sky/sky_court-BLHJ2ADI.hdr') },
  { key: 'skyBg', label: '背景', job: loadTexture('../assets/textures/sky/sky_court-BKHrsJQE.webp') },
], (d, t, label) => loader.setText(`正在加载 ${d}/${t}（${label}）`)).then((t) => {
  t.sky.mapping = THREE.EquirectangularReflectionMapping;
  scene.environment = t.sky;
  t.skyBg.mapping = THREE.EquirectangularReflectionMapping;
  scene.background = t.skyBg;

  buildCells();
  buildPlatform();
  paintAll();
  labReady = true;

  loader.hide();
  const sections = createSections({
    nav: document.getElementById('sideNav'),
    descPanel: document.getElementById('descPanel'),
    sections: SECTIONS,
    onSelect(i, sec) {
      if (activeSectionCleanup) { activeSectionCleanup(); activeSectionCleanup = null; }
      currentSection = i;
      sec.enter();
    },
  });
  window.__eduSections = sections;
  sections.select(0);
}).catch((err) => {
  loader.setText('资源加载失败：' + err.message);
  console.error(err);
});