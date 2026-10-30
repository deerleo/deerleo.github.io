/* EduLab · 疆域变迁 · HistoryAtlas（atlas）
 * 章节：秦 → 两汉 → 三国 → 两晋南北朝 → 隋唐 → 五代十国 → 宋辽金夏 → 元明清（16 期）
 * 实现：2D canvas 东亚地形底图（程序化高程 + 海域/河流/山脉），
 *       历代疆域多边形按弧长重采样后连续变形，时间轴拖动/自动播放，面积曲线，都城与注记。
 */
import {
  makeLoader, createControlsPanel, makeHUD, clamp,
} from './edu-core.js';

/* ---------------- 噪声与几何工具 ---------------- */

function hash2(x, y, seed) {
  let h = (seed | 0) ^ Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}
function vnoise(x, y, seed) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi, seed), b = hash2(xi + 1, yi, seed);
  const c = hash2(xi, yi + 1, seed), d = hash2(xi + 1, yi + 1, seed);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, y, seed, oct = 4) {
  let s = 0, amp = 0.5, f = 1, n = 0;
  for (let i = 0; i < oct; i++) { s += amp * vnoise(x * f, y * f, seed + i * 101); n += amp; amp *= 0.5; f *= 2; }
  return s / n;
}
function distToSeg(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1;
  const L2 = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / L2));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}
function distToPoly(px, py, pts) {
  let d = 1e9;
  for (let i = 0; i < pts.length - 1; i++) d = Math.min(d, distToSeg(px, py, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]));
  return d;
}

/* 经纬 → 画布 */
const LON0 = 70, LON1 = 142, LAT0 = 14, LAT1 = 56;
const MW = 1440, MH = Math.round(MW * (LAT1 - LAT0) / (LON1 - LON0) * 0.92);
const px = (lon) => (lon - LON0) / (LON1 - LON0) * MW;
const py = (lat) => (LAT1 - lat) / (LAT1 - LAT0) * MH;
const P = (arr) => arr.map(([lo, la]) => [px(lo), py(la)]);

/* ---------------- 东亚地形底图 ---------------- */

function buildBaseMap() {
  const mountains = [
    [87, 33, 9.5, 5.5, 0.95], [95, 30.5, 4, 3, 0.6],          // 青藏高原
    [103, 46, 8, 4, 0.5], [108, 36.5, 3.2, 2.2, 0.34],        // 蒙古高原 / 黄土高原
    [103, 26, 3.4, 2.6, 0.34], [114, 25, 3.4, 2.4, 0.24],     // 云贵 / 东南丘陵
  ];
  const basins = [
    [84, 39, 4.2, 2.6, 0.2], [116, 36, 3.6, 2.6, 0.22],       // 塔里木 / 华北平原
    [112, 29.5, 4, 1.6, 0.18], [125.5, 45, 3, 2.6, 0.16],     // 长江中下游 / 东北平原
    [105, 30.5, 1.7, 1.3, 0.18],                               // 四川盆地
  ];
  const ridges = [
    [78, 43, 92, 41.5, 1.4, 0.5], [80, 36.5, 96, 36, 1.6, 0.55],   // 天山 / 昆仑
    [80, 28.5, 97, 28, 1.6, 0.62],                                  // 喜马拉雅
    [98, 31.5, 101.5, 24.5, 1.2, 0.48],                             // 横断
    [105, 33.5, 112, 33, 1.1, 0.4], [113.5, 38.5, 114.5, 35.5, 0.9, 0.32], // 秦岭 / 太行
    [121, 50.5, 127, 44.5, 1.3, 0.36], [127.5, 43, 129.5, 41, 0.9, 0.3],   // 大兴安岭 / 长白
    [138, 47, 141, 43, 1.2, 0.4],                                   // 锡霍特/日本列岛山地
  ];
  const seas = [
    [[122, 41], [126.5, 40.5], [127.5, 38.5], [125.5, 36.5], [127, 35], [129.8, 36], [130.5, 42.5], [135.5, 44], [141.5, 45.5], [142, 20], [117, 14], [106, 16.5], [108.5, 18.5], [110, 20.2], [113, 21.8], [116.5, 23], [118, 24.8], [120, 27.5], [121.8, 30], [120.5, 32.5], [122, 36.5], [120.5, 37.5], [122, 40]],
    [[119.5, 40.2], [121.5, 40.5], [122.5, 39], [121, 37.8], [119.5, 38.8]],   // 渤海
  ];
  const islands = [
    [[121.6, 25.3], [122, 24.5], [121, 22.2], [120.2, 22.8], [120.4, 24.2], [120.8, 25.2]],      // 台湾
    [[109.3, 20.1], [110.5, 20], [111, 19.2], [110.2, 18.2], [109.2, 18.6], [108.8, 19.5]],      // 海南
    [[124.5, 40.2], [126.5, 41.6], [128.6, 40], [129.6, 37], [129, 35.5], [127.5, 34.4], [126.2, 34.5], [126, 36.2], [125, 37.6], [124.5, 39]], // 朝鲜半岛
    [[130.2, 33.8], [131.6, 33.2], [131.2, 31.4], [130.2, 31.8], [129.8, 33]],                   // 九州
    [[139.5, 41.5], [141.5, 40.5], [140.8, 38.5], [140.2, 36.5], [139.8, 34.9], [138.6, 34.6], [137.2, 34.8], [136.8, 36.2], [137.4, 37.4], [139, 40], [139.6, 41.5]], // 本州
    [[140.5, 42], [141.8, 42.6], [141.5, 43.6], [140.2, 43], [139.8, 42]],                       // 四国
    [[141.5, 45.4], [143.5, 44.8], [145.5, 44.2], [144.5, 43.2], [142.5, 43.6], [141.5, 44.5]],  // 北海道
  ];
  const rivers = [
    [[96, 34.8], [101, 35.6], [105, 36.2], [107, 39], [109, 40.6], [110.8, 40.5], [111, 38.5], [113.5, 35], [116, 35.2], [118.5, 36.8], [119, 38]],
    [[91, 33.5], [97, 31], [100, 28.5], [102, 28], [105, 29], [107, 30.3], [110, 30.5], [112, 30.5], [115, 30], [118, 30.8], [121.2, 31.5]],
    [[102, 24.5], [108, 23.5], [113, 22.8], [116, 22.4]],
  ];
  const H = (lo, la) => {
    let h = 0.18 + fbm(lo / 6, la / 6, 91, 4) * 0.3;
    for (const [cx, cy, rx, ry, mh] of mountains) h += mh * Math.exp(-(((lo - cx) ** 2) / (2 * rx * rx) + ((la - cy) ** 2) / (2 * ry * ry)));
    for (const [cx, cy, rx, ry, dd] of basins) h -= dd * Math.exp(-(((lo - cx) ** 2) / (2 * rx * rx) + ((la - cy) ** 2) / (2 * ry * ry)));
    for (const [x1, y1, x2, y2, w, mh] of ridges) {
      const dx = x2 - x1, dy = y2 - y1;
      const L2 = dx * dx + dy * dy || 1;
      const t = Math.max(0, Math.min(1, ((lo - x1) * dx + (la - y1) * dy) / L2));
      const d = Math.hypot(lo - (x1 + t * dx), la - (y1 + t * dy));
      h += mh * Math.exp(-(d * d) / (2 * w * w));
    }
    let inSea = false;
    for (const poly of seas) {
      let inside = false;
      for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const [xi, yi] = poly[i], [xj, yj] = poly[j];
        if ((yi > la) !== (yj > la) && lo < ((xj - xi) * (la - yi)) / (yj - yi) + xi) inside = !inside;
      }
      if (inside) { inSea = true; break; }
    }
    if (!inSea) for (const isl of islands) {
      let inside = false;
      for (let i = 0, j = isl.length - 1; i < isl.length; j = i++) {
        const [xi, yi] = isl[i], [xj, yj] = isl[j];
        if ((yi > la) !== (yj > la) && lo < ((xj - xi) * (la - yi)) / (yj - yi) + xi) inside = !inside;
      }
      if (inside) { inSea = false; break; }
      inSea = inSea;
    }
    return { h, sea: inSea };
  };

  const cv = document.createElement('canvas');
  cv.width = MW; cv.height = MH;
  const c = cv.getContext('2d');
  const img = c.createImageData(MW, MH);
  const STEP = 2;
  const GW = (MW / STEP | 0) + 1, GH = (MH / STEP | 0) + 1;
  const hc = new Float32Array(GW * GH), sc = new Uint8Array(GW * GH);
  for (let gy = 0; gy < GH; gy++) for (let gx = 0; gx < GW; gx++) {
    const r = H(LON0 + gx * STEP / MW * (LON1 - LON0), LAT1 - gy * STEP / MH * (LAT1 - LAT0));
    hc[gy * GW + gx] = r.h; sc[gy * GW + gx] = r.sea ? 1 : 0;
  }
  const hAt = (x, y) => {
    const gx = clamp(x / STEP, 0, GW - 1.001), gy = clamp(y / STEP, 0, GH - 1.001);
    const xi = gx | 0, yi = gy | 0, fx = gx - xi, fy = gy - yi;
    const i = yi * GW + xi;
    return hc[i] * (1 - fx) * (1 - fy) + hc[i + 1] * fx * (1 - fy) + hc[i + GW] * (1 - fx) * fy + hc[i + GW + 1] * fx * fy;
  };
  for (let y = 0; y < MH; y++) {
    for (let x = 0; x < MW; x++) {
      const gx = x / STEP | 0, gy = y / STEP | 0;
      let r, g, b;
      if (sc[gy * GW + gx]) { r = 62; g = 108; b = 152; }
      else {
        const t = clamp((hAt(x, y) - 0.1) / 0.72, 0, 1);
        if (t < 0.4) { r = 112 + t * 60; g = 148 - t * 34; b = 82; }
        else if (t < 0.72) { r = 136 + (t - 0.4) * 180; g = 112 + (t - 0.4) * 90; b = 74 + (t - 0.4) * 60; }
        else { const s = (t - 0.72) / 0.28; r = 194 - s * 24; g = 186 - s * 18; b = 134 + s * 41; }
        const fo = fbm(x / 18, y / 18, 55, 2);
        if (fo > 0.63 && t < 0.5) { r -= 20; g -= 10; b -= 6; }
      }
      const e = 3;
      const dh = (hAt(x - e, y - e) - hAt(x + e, y + e)) * 2.6;
      r += dh * 120; g += dh * 120; b += dh * 110;
      const o = (y * MW + x) * 4;
      img.data[o] = r; img.data[o + 1] = g; img.data[o + 2] = b; img.data[o + 3] = 255;
    }
  }
  c.putImageData(img, 0, 0);
  // 河流
  c.lineCap = 'round'; c.lineJoin = 'round';
  for (const rv of rivers) {
    c.strokeStyle = '#3e78ad';
    c.lineWidth = 3;
    c.beginPath();
    P(rv).forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.stroke();
    c.strokeStyle = 'rgba(140,200,235,0.5)';
    c.lineWidth = 1.3;
    c.stroke();
  }
  // 岛屿描边
  c.strokeStyle = 'rgba(40,60,80,0.35)';
  c.lineWidth = 1.2;
  for (const isl of islands) {
    c.beginPath();
    P(isl).forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.closePath();
    c.stroke();
  }
  return cv;
}

/* ---------------- 历代疆域数据（经纬近似，教学示意） ---------------- */

const MAIN = { fill: 'rgba(232,103,74,0.5)', line: '#c2452a' };
const SUB = [
  { fill: 'rgba(91,155,213,0.42)', line: '#3a7ab8' },
  { fill: 'rgba(122,190,110,0.4)', line: '#3f8a42' },
  { fill: 'rgba(190,150,80,0.4)', line: '#9a7020' },
];
const stOf = (st) => (st === 0 ? MAIN : SUB[st - 1] || SUB[0]);

const PERIODS = [
  {
    name: '秦朝疆域', short: '秦', year: '公元前 221 年', area: 340,
    caps: [['咸阳', 108.6, 34.35]],
    polys: [{ n: '秦', st: 0, pts: [[122, 40.5], [117, 41], [110, 41], [104, 40], [100, 38.5], [103, 35], [104, 32], [100, 28], [102, 25], [107, 23.5], [110, 21.5], [108, 20], [111, 21.5], [113, 22.5], [116, 23.5], [119, 25.5], [121, 28], [122, 31], [120, 34], [122, 37], [121, 39.5]] }],
    wall: [[104, 38], [107, 38.6], [110, 40.4], [113, 41], [117, 41.5], [122, 42], [125, 42.5]],
    note: '秦灭六国，建立起中国历史上第一个统一的多民族的中央集权国家。北筑长城、南凿灵渠，设桂林、南海、象郡。',
  },
  {
    name: '西汉疆域', short: '西汉', year: '公元前 60 年', area: 609,
    caps: [['长安', 108.7, 34.3]],
    marks: [[82.8, 41.5, '西域都护府']],
    polys: [{ n: '西汉', st: 0, pts: [[73, 39.8], [82, 41.5], [92, 42], [102, 41.5], [110, 42], [118, 42.5], [124, 41], [126.5, 39.5], [124, 38.5], [122, 37], [122, 34], [121, 31], [121.5, 28], [118, 24.5], [114, 22.3], [110, 21], [106, 18.5], [108, 21], [111, 22], [114, 23.5], [118, 25.5], [121, 28.5], [122, 32], [121, 35], [122, 38], [121, 40], [117, 41], [112, 41.8], [106, 41], [100, 40], [95, 39], [88, 38.5], [80, 38], [74, 38.5]] }],
    note: '张骞通西域后设西域都护府（前 60 年），今新疆地区正式归属中央政权。疆域东至朝鲜半岛北部，南达越南北部。',
  },
  {
    name: '东汉疆域', short: '东汉', year: '公元 100 年', area: 580,
    caps: [['洛阳', 112.5, 34.6]],
    marks: [[82.8, 41.5, '西域都护府']],
    polys: [{ n: '东汉', st: 0, pts: [[85, 40], [92, 42], [102, 41.5], [110, 42], [118, 42.5], [124, 41], [126.5, 39.5], [124, 38.5], [122, 37], [122, 34], [121, 31], [121.5, 28], [118, 24.5], [114, 22.3], [110, 21], [106, 18.5], [108, 21], [111, 22], [114, 23.5], [118, 25.5], [121, 28.5], [122, 32], [121, 35], [122, 38], [121, 40], [117, 41], [112, 41.8], [106, 41], [100, 40], [95, 39], [88, 38.5], [85, 39]] }],
    note: '东汉基本继承西汉疆域，西域经班超经营重新畅通。东汉末年黄巾起义后陷入分裂，为三国鼎立埋下伏笔。',
  },
  {
    name: '三国鼎立', short: '三国', year: '公元 229 年', area: 543, battles: [['⚔ 赤壁之战沙盘', 'chibi']],
    caps: [['洛阳', 112.5, 34.6], ['成都', 104, 30.6], ['建业', 118.8, 32]],
    polys: [
      { n: '魏', st: 0, pts: [[122, 40.5], [117, 41.5], [112, 41.5], [106, 41], [102, 40], [100, 38], [100, 34], [103, 32.5], [106, 32], [110, 32.8], [114, 33.5], [118, 34], [121, 32], [122, 34], [121, 37], [122, 40]] },
      { n: '蜀', st: 2, pts: [[103, 32.5], [106, 32], [110, 32.5], [112, 30], [110, 27], [106, 25.5], [102, 24.5], [100, 26], [101, 29], [102, 31]] },
      { n: '吴', st: 1, pts: [[110, 30.8], [114, 31], [118, 31.5], [121.5, 30], [121, 26.5], [118, 24.5], [113, 22.3], [108, 21], [106, 20], [105, 22], [108, 24], [108, 26], [108, 28.5], [109, 30]] },
    ],
    note: '魏（曹丕）、蜀（刘备）、吴（孙权）三分天下。赤壁之战（208 年）奠定了三国鼎立的格局。',
  },
  {
    name: '西晋统一', short: '西晋', year: '公元 280 年', area: 543,
    caps: [['洛阳', 112.5, 34.6]],
    polys: [{ n: '西晋', st: 0, pts: [[74, 39], [85, 41], [95, 42], [105, 41.5], [112, 42], [118, 42.5], [124, 41], [126.5, 39.5], [123, 37], [122, 34], [121, 31], [121.5, 28], [118, 24.5], [113, 22.3], [107, 19.5], [103, 22.5], [106, 24.5], [110, 24], [114, 23.8], [118, 25.5], [121, 28.5], [122, 32], [121, 36], [122, 38.5], [120, 40], [115, 41.5], [108, 41], [100, 40], [94, 38.5], [86, 38], [78, 38]] }],
    note: '西晋短暂统一（280 年灭吴）。但八王之乱耗尽国力，随后永嘉之乱、衣冠南渡，中国进入长期分裂。',
  },
  {
    name: '东晋与十六国', short: '东晋', year: '公元 383 年', area: 620, battles: [['⚔ 淝水之战沙盘', 'feishui']],
    caps: [['建康', 118.8, 32], ['长安', 108.7, 34.3]],
    polys: [
      { n: '前秦', st: 1, pts: [[75, 38.5], [85, 41], [95, 42], [105, 41], [112, 41.5], [118, 41.5], [124, 40.5], [122, 37], [120, 35.5], [118, 34], [114, 33], [110, 32.8], [106, 32], [103, 32.8], [100, 34], [97, 36], [94, 37], [88, 37], [80, 37.5], [75, 38]] },
      { n: '东晋', st: 0, pts: [[122, 32.5], [118, 32.2], [113, 32.8], [110, 33], [106, 32], [103, 32.5], [101, 30], [103, 28], [106, 26], [110, 24.5], [113, 22.3], [118, 24.5], [121, 27], [121.5, 30.5], [122, 32]] },
    ],
    note: '北方匈奴、鲜卑、羯、氐、羌等族先后建立十六国；晋室南渡建康，史称东晋。383 年淝水之战阻止了前秦统一。',
  },
  {
    name: '南北朝对峙', short: '南北朝', year: '公元 490 年', area: 480,
    caps: [['建康', 118.8, 32], ['洛阳', 112.5, 34.6]],
    polys: [
      { n: '北魏', st: 1, pts: [[122, 41], [118, 42], [112, 42], [105, 41.5], [100, 41], [97, 42], [100, 43], [105, 44], [110, 44.5], [116, 43], [122, 42.5], [126, 41], [124, 39], [122, 37.5], [120, 35.5], [118, 34.5], [114, 33.5], [110, 33], [106, 32.5], [103, 33], [100, 34.5], [103, 36], [106, 38], [110, 38.5], [114, 37], [118, 36], [121, 36.5], [122, 39]] },
      { n: '南朝', st: 0, pts: [[122, 32.5], [118, 32], [113, 32.5], [109, 32.5], [106, 31.5], [105, 29], [106, 26], [110, 24.5], [113, 22.3], [118, 24.5], [121, 27], [121.5, 30.5], [122, 32]] },
    ],
    note: '北魏孝文帝迁都洛阳、推行汉化改革；南方宋齐梁梁陈相继更替。民族大融合为隋唐统一奠定基础。',
  },
  {
    name: '隋朝疆域', short: '隋', year: '公元 612 年', area: 467,
    caps: [['大兴', 108.8, 34.3]],
    polys: [{ n: '隋', st: 0, pts: [[122, 40.5], [117, 41], [112, 41], [107, 41], [102, 40.5], [97, 40], [93, 40], [94, 38], [97, 36.5], [96, 34], [100, 32], [103, 31], [105, 30], [107, 29], [108, 27], [105, 25], [102, 23.5], [104, 22], [107, 21.5], [110, 21], [113, 22.3], [117, 23.5], [120, 26], [121.5, 29], [121, 33], [122, 36], [121, 38.5]] }],
    note: '隋重新统一南北，开凿大运河、创科举制。炀帝三征高句丽耗尽国力，二世而亡。',
  },
  {
    name: '唐朝前期疆域', short: '唐', year: '公元 660 年', area: 1237,
    caps: [['长安', 108.7, 34.3]],
    marks: [[80, 41, '安西都护府'], [86, 44, '北庭都护府']],
    polys: [{ n: '唐', st: 0, pts: [[74, 39], [80, 43], [88, 46], [96, 48], [104, 50], [112, 50.5], [120, 51], [127, 50], [131, 46], [127, 42], [124, 40], [122, 38], [121, 35], [122, 33], [121, 30], [120, 27], [117, 23.5], [113, 22.3], [108, 20], [104, 18.5], [102, 20], [104, 22.5], [100, 23.5], [98, 25.5], [99, 28], [96, 30.5], [90, 32], [85, 33], [80, 34], [76, 36], [74, 38]] }],
    note: '唐前期疆域极盛：设安西、北庭都护府管辖西域，势力北达蒙古高原。吐蕃（今西藏）当时为独立政权，与唐和亲会盟。',
  },
  {
    name: '唐朝后期形势', short: '唐后期', year: '公元 780 年', area: 820,
    caps: [['长安', 108.7, 34.3]],
    polys: [
      { n: '唐', st: 0, pts: [[122, 40], [117, 40.5], [112, 40.5], [107, 40.5], [102, 40], [97, 38.5], [94, 36.5], [96, 33], [99, 30.5], [102, 29], [104, 28.5], [106, 28], [108, 27], [105, 25], [102, 23.5], [104, 22], [107, 21.5], [110, 21], [113, 22.3], [117, 23.5], [120, 26], [121.5, 29], [121, 33], [122, 36], [121, 38.5]] },
      { n: '吐蕃', st: 1, pts: [[80, 35], [88, 37], [95, 37.5], [99, 35], [101, 31], [98, 28.5], [93, 27.5], [88, 27.5], [82, 28.5], [78, 31], [78, 33]] },
      { n: '回鹘', st: 2, pts: [[88, 44], [95, 46], [103, 47], [110, 46], [112, 43], [105, 41.5], [97, 41.5], [90, 42]] },
      { n: '南诏', st: 2, pts: [[99, 26], [103, 25.5], [106, 24.5], [104, 22.5], [100, 21.5], [97, 23.5], [98, 25]] },
    ],
    note: '安史之乱（755—763 年）后唐朝由盛转衰：西域陇右陷于吐蕃，回鹘据蒙古高原，南诏据云贵，藩镇割据。',
  },
  {
    name: '五代十国', short: '五代', year: '公元 955 年', area: 380,
    caps: [['开封', 114.3, 34.8]],
    polys: [
      { n: '五代', st: 0, pts: [[122, 40], [117, 41], [112, 41], [107, 41], [102, 40.5], [97, 39], [94, 38], [96, 35], [99, 33.5], [103, 33], [107, 33.5], [111, 34], [114, 34.5], [117, 34.5], [119, 35], [121, 35.5], [122, 37], [121, 39]] },
      { n: '南唐·吴越', st: 1, pts: [[122, 32], [118, 31.5], [114, 31.5], [110, 31], [108, 30], [108, 27], [110, 25], [114, 23.8], [118, 24.8], [120, 27], [121.5, 29], [122, 30.5]] },
      { n: '后蜀', st: 2, pts: [[102, 32], [106, 31.5], [108, 30], [107, 28.5], [104, 27], [101, 28], [100, 30], [101, 31]] },
      { n: '南汉', st: 2, pts: [[108, 25], [113, 22.3], [117, 23.5], [119, 25.5], [116, 26.5], [111, 26.5], [108, 26.5]] },
    ],
    note: '唐亡后中原五朝更迭（梁唐晋汉周），南方与河东先后出现十国。周世宗改革为北宋统一奠定基础。',
  },
  {
    name: '北宋、辽、西夏并立', short: '北宋', year: '公元 1100 年', area: 846,
    caps: [['开封', 114.3, 34.8], ['上京', 118.5, 43.6], ['兴庆', 105.8, 38.5]],
    polys: [
      { n: '辽', st: 1, pts: [[126, 50], [132, 47], [134, 43], [130, 41], [126, 40], [122, 39.5], [119, 38], [116, 39.5], [112, 41], [108, 42], [104, 43], [100, 44], [96, 45], [94, 47], [98, 49], [104, 50], [112, 50], [120, 50]] },
      { n: '北宋', st: 0, pts: [[122, 36], [121, 34], [121.5, 31.5], [120, 28.5], [117, 24.5], [113, 22.3], [108, 21], [104, 22.5], [102, 24], [104, 26], [106, 28], [108, 29.5], [110, 31], [110, 32.8], [114, 33.5], [118, 34], [121, 35]] },
      { n: '西夏', st: 2, pts: [[98, 39.5], [103, 40.5], [107, 40.5], [108, 37.5], [105, 36], [101, 36], [98, 37.5]] },
    ],
    note: '北宋统一中原与南方，但北有辽（契丹）、西北有西夏（党项）。澶渊之盟后宋辽约为兄弟之国，长期和平。',
  },
  {
    name: '南宋、金、西夏并立', short: '南宋', year: '公元 1200 年', area: 638,
    caps: [['临安', 120.2, 30.3], ['会宁', 126.5, 45.5], ['兴庆', 105.8, 38.5]],
    polys: [
      { n: '金', st: 1, pts: [[126, 50], [132, 47], [134, 43], [130, 41], [126, 40], [122, 39.5], [119, 37.5], [121, 35], [122, 33.5], [120, 32.8], [118, 33], [114, 33.2], [110, 33.5], [108, 33.8], [106, 34], [103, 34.5], [99, 35], [96, 37], [94, 39], [96, 41], [98, 42.5], [100, 44], [104, 45], [110, 46], [118, 47], [124, 49]] },
      { n: '南宋', st: 0, pts: [[122, 32], [121.5, 30], [120, 28], [117, 24.5], [113, 22.3], [108, 21], [104, 22.5], [102, 24], [104, 26], [106, 28], [108, 29.5], [110, 31], [110, 32.8], [114, 32.8], [118, 32.5], [121, 31.8]] },
      { n: '西夏', st: 2, pts: [[98, 39.5], [103, 40.5], [107, 40.5], [108, 37.5], [105, 36], [101, 36], [98, 37.5]] },
    ],
    note: '靖康之变（1127 年）北宋亡，宋室南渡临安。金据中原与东北，与南宋、西夏再次形成三足并立。',
  },
  {
    name: '元朝疆域', short: '元', year: '公元 1300 年', area: 1372,
    caps: [['大都', 116.4, 39.9]],
    marks: [[91, 30, '宣政院辖地']],
    wall: null,
    polys: [{ n: '元', st: 0, pts: [[75, 42], [82, 46], [90, 50], [100, 53], [110, 54], [118, 53], [126, 54], [132, 52], [135, 48], [133, 44], [128, 42], [124, 40], [122, 38.5], [121, 35.5], [122, 33], [121, 30], [120, 27], [117, 23.5], [113, 22.3], [108, 20], [104, 18.5], [102, 20], [104, 22.5], [102, 24], [104, 26], [106, 28], [104, 30], [102, 32], [99, 33], [95, 34], [90, 34], [85, 35], [80, 37], [76, 39]] }],
    note: '元朝疆域「北逾阴山，西极流沙，东尽辽左，南越海表」，首次将青藏高原纳入中央直接管辖（宣政院），实行行省制度。',
  },
  {
    name: '明朝疆域', short: '明', year: '公元 1420 年', area: 997,
    caps: [['北京', 116.4, 39.9]],
    marks: [[134.5, 52, '奴儿干都司'], [88, 30, '乌斯藏都司'], [93.5, 42.8, '哈密卫']],
    wall: [[98, 39.8], [102, 39.6], [106, 40], [110, 40.6], [113, 41.2], [117, 41.4], [121, 41.8], [124, 42.3]],
    polys: [{ n: '明', st: 0, pts: [[75, 38.5], [80, 40], [86, 40.5], [92, 40], [93, 42.5], [96, 41], [100, 41], [104, 41], [108, 41], [112, 41], [116, 41.2], [120, 41.5], [123, 43.5], [126, 46.5], [129, 49], [132, 51.5], [134, 53.5], [131, 52], [129, 48], [127, 45], [125, 42.5], [124, 41], [122, 39.5], [121, 37], [122, 35], [121, 32], [120, 28], [117, 23.5], [113, 22.3], [108, 21], [104, 22.5], [102, 24], [104, 26], [106, 28], [104, 30], [102, 33], [100, 35], [97, 37], [94, 38.5], [86, 38], [78, 37.5], [75, 37.5]] }],
    note: '明初设奴儿干都司辖东北、乌斯藏都司辖西藏。北方蒙古高原为鞑靼、瓦剌，故修筑长城（今所见明长城）以御之。',
  },
  {
    name: '清朝疆域', short: '清', year: '公元 1760 年', area: 1316,
    caps: [['北京', 116.4, 39.9]],
    marks: [[90, 29.5, '驻藏大臣'], [133, 49, '黑龙江将军']],
    polys: [
      { n: '清', st: 0, pts: [[73, 39.2], [78, 42], [84, 45], [90, 47.5], [96, 49.5], [102, 50.5], [108, 50], [114, 49.5], [119, 50.5], [123, 52], [127, 55], [131, 54], [134, 51], [132, 47], [129, 44], [127, 41.5], [124, 40], [121, 38.5], [122, 36.5], [121.5, 33], [121, 30.5], [120, 27.5], [117, 23.5], [113, 22.3], [108, 21], [104, 22.5], [102, 24], [104, 26], [106, 28], [104, 30.5], [102, 33], [100, 36], [97, 38], [94, 39.5], [88, 39], [82, 38.5], [76, 38]] },
      { n: '', st: 0, pts: [[121.6, 25.3], [122, 24.5], [121, 22.2], [120.2, 22.8], [120.4, 24.2], [120.8, 25.2]] },
    ],
    note: '清朝前期（乾隆年间）最终奠定近代中国版图：平定准噶尔、统一新疆，辖蒙古、西藏、台湾，面积超 1300 万平方公里。',
  },
];

/* ---------------- 多边形重采样与变形 ---------------- */

function resample(pts, n = 72) {
  // 周长弧长均匀重采样
  const P2 = pts.map(([lo, la]) => [px(lo), py(la)]);
  const lens = [0];
  let total = 0;
  for (let i = 0; i < P2.length; i++) {
    const a = P2[i], b = P2[(i + 1) % P2.length];
    total += Math.hypot(b[0] - a[0], b[1] - a[1]);
    lens.push(total);
  }
  if (total < 1) return P2.slice(0, n).map((p) => [...p]);
  const out = [];
  for (let k = 0; k < n; k++) {
    const target = k / n * total;
    let i = 0;
    while (i < lens.length - 2 && lens[i + 1] < target) i++;
    const t = (target - lens[i]) / (lens[i + 1] - lens[i] || 1);
    const a = P2[i % P2.length], b = P2[(i + 1) % P2.length];
    out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
  }
  return out;
}
function centroid(P2) {
  let x = 0, y = 0;
  for (const p of P2) { x += p[0]; y += p[1]; }
  return [x / P2.length, y / P2.length];
}
function pairPolys(A, B) {
  // 贪心配对（按质心距离），返回 B 侧每个 poly 对应的 A 索引（或 -1 = 新生长）
  const used = new Set();
  const pairs = B.polys.map((bp) => {
    const bc = centroid(bp.__rs);
    let best = -1, bd = 1e18;
    A.polys.forEach((ap, i) => {
      if (used.has(i)) return;
      const d = (c1, c2) => (c1[0] - c2[0]) ** 2 + (c1[1] - c2[1]) ** 2;
      const dd = d(bc, centroid(ap.__rs));
      if (dd < bd) { bd = dd; best = i; }
    });
    if (best >= 0) used.add(best);
    return best;
  });
  return { pairs, usedA: used };
}
function polyAt(period, t) {
  // t: 0..1 相邻期过渡，返回绘制多边形列表 [{fill,line,P2,label}]
  const A = PERIODS[period], B = PERIODS[period + 1];
  if (t <= 0) return styled(A);
  if (t >= 1) return styled(B);
  const e = t * t * (3 - 2 * t);
  const out = [];
  const { pairs, usedA } = pairPolys(A, B);
  B.polys.forEach((bp, bi) => {
    const ai = pairs[bi];
    const src = ai >= 0 ? A.polys[ai].__rs : shrinkTo(bp.__rs, 0.12);
    const dst = bp.__rs;
    const pts = src.map((p, i) => [p[0] + (dst[i][0] - p[0]) * e, p[1] + (dst[i][1] - p[1]) * e]);
    const sa = ai >= 0 ? stOf(A.polys[ai].st) : stOf(bp.st);
    out.push({ fill: ai >= 0 ? sa.fill : fade(sa.fill, e), line: sa.line, P2: pts, label: e > 0.55 ? bp.n : (ai >= 0 ? A.polys[ai].n : '') });
  });
  // A 中未被配对的多边形收缩消失
  A.polys.forEach((ap, ai) => {
    if (!usedA.has(ai)) {
      const dst = shrinkTo(ap.__rs, 0.12);
      const pts = ap.__rs.map((p, i) => [p[0] + (dst[i][0] - p[0]) * e, p[1] + (dst[i][1] - p[1]) * e]);
      const sa = stOf(ap.st);
      out.push({ fill: fade(sa.fill, 1 - e), line: sa.line, P2: pts, label: '' });
    }
  });
  return out;
}
function shrinkTo(P2, k) {
  const [cx, cy] = centroid(P2);
  return P2.map(([x, y]) => [cx + (x - cx) * k, cy + (y - cy) * k]);
}
function fade(rgba, k) {
  const m = rgba.match(/rgba\((.+),\s*([\d.]+)\)/);
  if (!m) return rgba;
  return `rgba(${m[1]},${parseFloat(m[2]) * k})`;
}
function styled(period) {
  return period.polys.map((p) => ({
    fill: stOf(p.st).fill, line: stOf(p.st).line, P2: p.__rs, label: p.n,
  }));
}

/* ---------------- 画布与视图 ---------------- */

const stage = document.getElementById('stage');
const loader = makeLoader(stage, '正在绘制东亚地形…');

const canvas = document.createElement('canvas');
canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;touch-action:none;cursor:grab;';
stage.appendChild(canvas);
const ctx = canvas.getContext('2d');
let DPR = 1;
function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = stage.clientWidth * DPR;
  canvas.height = stage.clientHeight * DPR;
}
new ResizeObserver(resize).observe(stage);
resize();

const view = { x: 0, y: 0, k: 1, tx: 0, ty: 0, tk: 1 };
function fitView() {
  const vw = stage.clientWidth, vh = stage.clientHeight;
  const k = Math.min(vw / MW, vh / MH) * 0.98;
  view.tx = (vw - MW * k) / 2;
  view.ty = (vh - MH * k) / 2;
  view.tk = k;
}
let dragging = false, lastX = 0, lastY = 0;
canvas.addEventListener('pointerdown', (e) => { dragging = true; lastX = e.clientX; lastY = e.clientY; canvas.style.cursor = 'grabbing'; canvas.setPointerCapture(e.pointerId); });
canvas.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  view.tx += e.clientX - lastX; view.ty += e.clientY - lastY;
  view.x = view.tx; view.y = view.ty;
  lastX = e.clientX; lastY = e.clientY;
});
canvas.addEventListener('pointerup', () => { dragging = false; canvas.style.cursor = 'grab'; });
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left, my = e.clientY - rect.top;
  view.tk = Math.max(0.2, Math.min(5, view.tk * (e.deltaY < 0 ? 1.12 : 0.89)));
  const wx = (mx - view.tx) / view.tk, wy = (my - view.ty) / view.tk;
  view.tx = mx - wx * view.tk;
  view.ty = my - wy * view.tk;
}, { passive: false });
function viewTick(dt) {
  const k = 1 - Math.exp(-8 * dt);
  view.x += (view.tx - view.x) * k;
  view.y += (view.ty - view.y) * k;
  view.k += (view.tk - view.k) * k;
}

/* ---------------- 状态 ---------------- */

const state = {
  time: 2,               // 连续期索引 0..15
  playing: false,
  dwell: 0,
  showCaps: true, showNames: true, showTerrain: false,
};

/* 预重采样 */
PERIODS.forEach((p) => p.polys.forEach((pp) => { pp.__rs = resample(pp.pts, 72); }));

/* ---------------- 绘制 ---------------- */

let baseMap = null;

function draw(time) {
  const vw = stage.clientWidth, vh = stage.clientHeight;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#0c1016';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.setTransform(view.k * DPR, 0, 0, view.k * DPR, view.x * DPR, view.y * DPR);
  if (!baseMap) return;
  ctx.drawImage(baseMap, 0, 0);

  const period = Math.floor(time);
  const frac = time - period;
  const isLast = period >= PERIODS.length - 1;
  const polys = isLast ? styled(PERIODS[period]) : polyAt(period, frac);

  // 疆域
  for (const poly of polys) {
    if (poly.P2.length < 3) continue;
    ctx.beginPath();
    poly.P2.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    ctx.fillStyle = poly.fill;
    ctx.fill();
    ctx.strokeStyle = poly.line;
    ctx.lineWidth = 2.2;
    ctx.stroke();
  }
  // 政权名
  if (state.showNames) {
    ctx.font = '700 20px -apple-system,"PingFang SC",sans-serif';
    ctx.textAlign = 'center';
    for (const poly of polys) {
      if (!poly.label) continue;
      const [cx2, cy2] = centroid(poly.P2);
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.shadowColor = 'rgba(0,0,0,0.9)';
      ctx.shadowBlur = 6;
      ctx.fillText(poly.label, cx2, cy2);
      ctx.shadowBlur = 0;
    }
  }
  // 长城
  const cur = PERIODS[Math.min(period, PERIODS.length - 1)];
  const next = PERIODS[Math.min(period + 1, PERIODS.length - 1)];
  const showWallOf = (p, k2) => {
    if (!p.wall) return;
    ctx.strokeStyle = `rgba(40,34,28,${0.9 * k2})`;
    ctx.lineWidth = 4;
    ctx.setLineDash([10, 4]);
    ctx.beginPath();
    P(p.wall).forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.stroke();
    ctx.setLineDash([]);
  };
  if (!isLast && frac > 0 && frac < 1) { showWallOf(cur, 1 - frac); showWallOf(next, frac); }
  else showWallOf(cur, 1);
  // 都城与特标
  if (state.showCaps) {
    const marksOf = (p, k2) => {
      ctx.globalAlpha = k2;
      for (const [name, lo, la] of p.caps || []) {
        const x = px(lo), y = py(la);
        ctx.fillStyle = '#ffd166';
        ctx.strokeStyle = 'rgba(60,40,10,0.9)';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(x, y, 5.5, 0, 6.28);
        ctx.fill(); ctx.stroke();
        ctx.font = '600 16px -apple-system,"PingFang SC",sans-serif';
        ctx.fillStyle = '#ffe6b0';
        ctx.shadowColor = 'rgba(0,0,0,0.9)';
        ctx.shadowBlur = 5;
        ctx.fillText('◈ ' + name, x, y - 10);
        ctx.shadowBlur = 0;
      }
      for (const [lo, la, name] of p.marks || []) {
        const x = px(lo), y = py(la);
        ctx.strokeStyle = '#7fd8ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, 6.5, 0, 6.28);
        ctx.stroke();
        ctx.font = '500 14px -apple-system,"PingFang SC",sans-serif';
        ctx.fillStyle = '#bfe6ff';
        ctx.shadowColor = 'rgba(0,0,0,0.9)';
        ctx.shadowBlur = 5;
        ctx.fillText(name, x, y - 11);
        ctx.shadowBlur = 0;
      }
      ctx.globalAlpha = 1;
    };
    if (!isLast && frac > 0 && frac < 1) { marksOf(cur, 1 - frac); marksOf(next, frac); }
    else marksOf(cur, 1);
  }
  // 地形注记
  if (state.showTerrain) {
    ctx.font = '500 15px -apple-system,"PingFang SC",sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(250,246,235,0.85)';
    ctx.shadowColor = 'rgba(0,0,0,0.85)';
    ctx.shadowBlur = 5;
    for (const [name, lo, la] of [['青藏高原', 86, 33], ['塔里木盆地', 84, 39.5], ['蒙古高原', 103, 46.5], ['黄土高原', 108.5, 36.5], ['华北平原', 116.5, 36], ['长江中下游平原', 113, 29], ['四川盆地', 105, 30.5], ['云贵高原', 103, 26], ['东北平原', 125.5, 45], ['喜马拉雅山脉', 88, 28.2], ['大兴安岭', 123.5, 47.5], ['秦岭', 108.5, 33.2]]) {
      ctx.fillText(name, px(lo), py(la));
    }
    ctx.shadowBlur = 0;
  }
}

/* ---------------- 字幕 / 面积曲线 / 控件 ---------------- */

/* 字幕条：定位与视觉全在 lab-atlas.css（.edulab-sub，贴中栏底边、避开面积窗与专注钮） */
const subtitle = document.createElement('div');
subtitle.className = 'edulab-sub';
stage.appendChild(subtitle);

/* 面积曲线窗：定位在 lab-atlas.css（.coastal-window.aw，浮于中栏左下）；
 * 头部带折叠钮，可收成 40px 圆形「积」徽标（localStorage 记忆 atlas.foldArea） */
const areaBox = document.createElement('div');
areaBox.className = 'coastal-window aw';
areaBox.innerHTML = '<div class="cw-head"><b>疆域面积（合计·示意）</b><span class="cw-area"></span><button class="fold-btn" id="areaFoldBtn" type="button" aria-label="收起面积曲线窗" aria-expanded="true" aria-controls="areaCurve" title="收起面积曲线窗">−</button></div>';
const areaCanvas = document.createElement('canvas');
areaCanvas.id = 'areaCurve';
areaCanvas.width = 560; areaCanvas.height = 210;
areaBox.appendChild(areaCanvas);
const areaBadge = document.createElement('button');
areaBadge.className = 'area-badge';
areaBadge.type = 'button';
areaBadge.setAttribute('aria-label', '展开面积曲线窗');
areaBadge.title = '展开面积曲线窗';
areaBadge.textContent = '积';
areaBox.appendChild(areaBadge);
stage.appendChild(areaBox);
const actx = areaCanvas.getContext('2d');
const areaHeadVal = areaBox.querySelector('.cw-area');

function drawArea(time) {
  const W = areaCanvas.width, Hh = areaCanvas.height;
  actx.clearRect(0, 0, W, Hh);
  const max = 1400;
  const X = (i) => 34 + i / (PERIODS.length - 1) * (W - 48);
  const Y = (v) => Hh - 30 - v / max * (Hh - 50);
  actx.strokeStyle = 'rgba(128,140,160,0.35)';
  actx.lineWidth = 1;
  actx.font = '600 24px -apple-system,sans-serif';
  actx.fillStyle = '#8a94a8';
  actx.textAlign = 'right';
  for (const v of [500, 1000]) {
    actx.beginPath(); actx.moveTo(34, Y(v)); actx.lineTo(W - 14, Y(v)); actx.stroke();
    actx.fillText(v + '万', 30, Y(v) + 5);
  }
  actx.strokeStyle = '#e8674a';
  actx.lineWidth = 3;
  actx.beginPath();
  PERIODS.forEach((p, i) => (i ? actx.lineTo(X(i), Y(p.area)) : actx.moveTo(X(i), Y(p.area))));
  actx.stroke();
  actx.fillStyle = '#e8674a';
  PERIODS.forEach((p, i) => { actx.beginPath(); actx.arc(X(i), Y(p.area), 3.4, 0, 6.28); actx.fill(); });
  // 当前位置标记
  const i0 = Math.floor(time), fr = time - i0;
  const i1 = Math.min(i0 + 1, PERIODS.length - 1);
  const v = PERIODS[i0].area + (PERIODS[i1].area - PERIODS[i0].area) * fr;
  const mx = X(time), my = Y(v);
  actx.fillStyle = '#ffd166';
  actx.beginPath(); actx.arc(mx, my, 6, 0, 6.28); actx.fill();
  actx.strokeStyle = 'rgba(255,209,102,0.4)';
  actx.lineWidth = 1.4;
  actx.beginPath(); actx.moveTo(mx, my); actx.lineTo(mx, Hh - 12); actx.stroke();
  areaHeadVal.textContent = Math.round(v) + ' 万 km²';
}

const ctl = createControlsPanel(document.getElementById('controls'));
/* 数据读数收进右栏手风琴（时期 / 年代，随时间轴滚动更新） */
const hud = makeHUD(document.getElementById('lcData'), [['a', '时期'], ['b', '年代']]);
hud.show(true);

let sliderRef = null;
function buildControls() {
  ctl.clear();
  const playBtn = ctl.button({
    label: state.playing ? '⏸ 暂停' : '▶ 自动播放',
    onClick() {
      state.playing = !state.playing;
      if (state.playing && state.time >= PERIODS.length - 1) state.time = 0;
      playBtn.textContent = state.playing ? '⏸ 暂停' : '▶ 自动播放';
    },
  });
  ctl.sep();
  sliderRef = ctl.slider({
    label: '时间轴', min: 0, max: PERIODS.length - 1, step: 0.01, value: state.time,
    fmt: (v) => PERIODS[Math.min(Math.round(v), PERIODS.length - 1)].short,
    onInput: (v) => { state.time = v; state.playing = false; playBtn.textContent = '▶ 自动播放'; syncCaption(); applyChapterUI(Math.round(v)); },
  });
  ctl.sep();
  ctl.toggle({ label: '都城', value: true, onChange: (v) => { state.showCaps = v; } });
  ctl.toggle({ label: '政权名', value: true, onChange: (v) => { state.showNames = v; } });
  ctl.toggle({ label: '地形注记', value: false, onChange: (v) => { state.showTerrain = v; } });
}

function syncCaption() {
  const i = Math.round(state.time);
  const p = PERIODS[Math.min(i, PERIODS.length - 1)];
  const battleLinks = (p.battles || []).map(([label, id]) => `<a href="../war/" style="color:#ffcf9a;font-weight:600" title="在战役沙盘中查看${label.replace('⚔ ', '').replace('沙盘', '')}">${label} →</a>`).join('　');
  subtitle.innerHTML = `<b style="color:#ffd166">${p.name} · ${p.year}</b>　<span style="opacity:0.85">${p.note}</span>${battleLinks ? '<br>' + battleLinks : ''}`;
  hud.set('a', p.name);
  hud.set('b', p.year);
}

/* ---------------- 章节与播放 ---------------- */

const SECTIONS = PERIODS.map((p, i) => ({
  id: 'p' + i,
  title: p.name,
  html: `<p><b>${p.year}</b> · 疆域约 ${p.area} 万 km²（含并立政权合计，教学示意值）</p><p>${p.note}</p>`,
  enter() {
    state.time = i;
    state.playing = false;
    state.dwell = 0;
    if (sliderRef) sliderRef.set(i);
    buildControls();
    sliderRef.set(i);
    syncCaption();
  },
}));

/* ---------------- 章节管理（左栏时期列表驱动；时间轴/自动播放时右栏联动跟随） ---------------- */

const chapNav = document.getElementById('chapNav');
const chapCount = document.getElementById('chapCount');
const detailNo = document.getElementById('detailNo');
const detailTitle = document.getElementById('detailTitle');
const lessonEl = document.getElementById('lesson');
const detailBody = document.getElementById('detailBody');

/* 16 期竖排按钮：序号 + 标题，点击切期，当前期 .on 高亮 */
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

/* 右栏 UI 跟随当前期（时间轴拖动 / 自动播放时只刷 UI，不重置播放状态） */
let uiChapter = -1;
function applyChapterUI(i) {
  i = clamp(i, 0, SECTIONS.length - 1);
  if (i === uiChapter) return;
  uiChapter = i;
  chapBtns.forEach((b, j) => {
    const on = j === i;
    b.classList.toggle('on', on);
    if (on) {
      b.setAttribute('aria-current', 'true');
      b.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    } else {
      b.removeAttribute('aria-current');
    }
  });
  const sec = SECTIONS[i];
  chapCount.textContent = `${String(i + 1).padStart(2, '0')}/${SECTIONS.length}`;
  detailNo.textContent = String(i + 1).padStart(2, '0');
  detailTitle.textContent = sec.title;
  /* 折叠竖条上的时期信息同步（左栏序号 / 右栏竖排标题） */
  railNoL.textContent = String(i + 1).padStart(2, '0');
  railTitleR.textContent = sec.title;
  lessonEl.innerHTML = sec.html || '';
  detailBody.scrollTop = 0;
}

/* 点左栏切期：刷 UI + enter()（重置时间轴到该期、停播） */
function selectChapter(i) {
  const idx = clamp(i, 0, SECTIONS.length - 1);
  uiChapter = -1;   /* 强制刷新（即使目标期与当前相同） */
  applyChapterUI(idx);
  SECTIONS[idx].enter();
}

/* ---------------- 栏折叠（左右独立 28px 竖条）× 专注模式（双栏同折）统一管理 ---------------- */

const foldLBtn = document.getElementById('foldLBtn');
const unfoldLBtn = document.getElementById('unfoldLBtn');
const foldRBtn = document.getElementById('foldRBtn');
const unfoldRBtn = document.getElementById('unfoldRBtn');
const railNoL = document.getElementById('railNoL');
const railTitleR = document.getElementById('railTitleR');
const atlasShell = document.getElementById('atlasShell');
const focusBtn = document.getElementById('focusBtn');

const FOLD_KEY = { l: 'atlas.foldL', r: 'atlas.foldR' };
let foldL = false;
let foldR = false;
let focusSaved = null; /* 进入专注模式前的独立折叠状态 [foldL, foldR]，退出时恢复 */
try {
  foldL = localStorage.getItem(FOLD_KEY.l) === '1';
  foldR = localStorage.getItem(FOLD_KEY.r) === '1';
} catch (e) { /* localStorage 不可用（隐私模式等）时仅本次会话内生效 */ }

/* 把折叠状态落到 shell 类名与按钮 aria 态（布局/竖条显隐全在 CSS） */
function applyFold() {
  atlasShell.classList.toggle('fold-l', foldL);
  atlasShell.classList.toggle('fold-r', foldR);
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
  atlasShell.classList.toggle('focus-mode', on);
  focusBtn.textContent = on ? '退出专注' : '专注模式';
  focusBtn.setAttribute('aria-pressed', String(on));
  applyFold();
}

/* 独立折叠翻转并持久化；专注模式中点竖条展开钮 = 先退出专注（恢复原状）再翻转该侧 */
function toggleFold(side) {
  if (focusSaved !== null) setFocus(false);
  if (side === 'l') foldL = !foldL;
  else foldR = !foldR;
  try {
    localStorage.setItem(FOLD_KEY[side], (side === 'l' ? foldL : foldR) ? '1' : '0');
  } catch (e) { /* 同上，忽略持久化失败 */ }
  applyFold();
}

foldLBtn.addEventListener('click', () => toggleFold('l'));
unfoldLBtn.addEventListener('click', () => toggleFold('l'));
foldRBtn.addEventListener('click', () => toggleFold('r'));
unfoldRBtn.addEventListener('click', () => toggleFold('r'));
focusBtn.addEventListener('click', () => setFocus(focusSaved === null));
applyFold();

/* ---------------- 面积曲线窗折叠：整窗收成 40px 圆形「积」徽标（浮于原位） ---------------- */

const areaFoldBtn = document.getElementById('areaFoldBtn');
const AREA_FOLD_KEY = 'atlas.foldArea';
let areaFolded = false;
try {
  const savedArea = localStorage.getItem(AREA_FOLD_KEY);
  /* 无记忆时：≤1100px 小屏首访默认折叠（清爽态）；用户手动操作后按记忆走 */
  areaFolded = savedArea !== null ? savedArea === '1' : window.innerWidth <= 1100;
} catch (e) {
  areaFolded = window.innerWidth <= 1100; /* localStorage 不可用（隐私模式等）时按视口给默认 */
}
function applyAreaFold() {
  areaBox.classList.toggle('folded', areaFolded);
  areaFoldBtn.textContent = areaFolded ? '+' : '−';
  areaFoldBtn.setAttribute('aria-expanded', String(!areaFolded));
}
function setAreaFolded(v) {
  areaFolded = v;
  try { localStorage.setItem(AREA_FOLD_KEY, v ? '1' : '0'); } catch (e) { /* 忽略持久化失败 */ }
  applyAreaFold();
}
areaFoldBtn.addEventListener('click', () => setAreaFolded(!areaFolded));
areaBadge.addEventListener('click', () => setAreaFolded(false));
applyAreaFold();

/* ---------------- 右栏三块手风琴（详解 / 控件 / 读数）：每块独立 key 记忆，切期不重置 ---------------- */

const ACC_KEYS = { lesson: 'atlas.accLesson', controls: 'atlas.accControls', data: 'atlas.accData' };
const accSecs = {
  lesson: document.getElementById('accLesson'),
  controls: document.getElementById('accControls'),
  data: document.getElementById('accData'),
};
const NARROW_VIEW = window.innerWidth <= 1100;   /* 小屏首访清爽态判据 */
const accClosed = {};
for (const name of Object.keys(accSecs)) {
  let saved = null;
  try { saved = localStorage.getItem(ACC_KEYS[name]); } catch (e) { /* 同上，忽略 */ }
  /* 无记忆：默认全展开，仅小屏首访把「数据读数」默认收起；用户操作后按记忆走 */
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

/* ---------------- 启动 ---------------- */

window.__eduSections = { select: selectChapter };
loader.setText('正在绘制东亚地形…');
setTimeout(() => {
  baseMap = buildBaseMap();
  fitView();
  buildControls();
  selectChapter(0);
  loader.hide();
}, 30);

let lastTs = 0;
function loop(ts) {
  requestAnimationFrame(loop);
  const dt = Math.min((ts - lastTs) / 1000 || 0.016, 0.1);
  lastTs = ts;
  viewTick(dt);
  if (!baseMap) return;
  if (state.playing) {
    // 在每个时期停留 2.6s，过渡 1.1s
    state.dwell += dt;
    const i = Math.floor(state.time);
    if (state.dwell > 2.6 && i < PERIODS.length - 1) {
      state.time = Math.min(i + 1, state.time + dt / 1.1);
      if (sliderRef) sliderRef.set(state.time);
      if (state.time >= i + 1) state.dwell = 0;
    } else if (state.dwell > 2.6 && i >= PERIODS.length - 1) {
      state.playing = false;
    }
  }
  draw(state.time);
  drawArea(state.time);
  const i = Math.round(state.time);
  if (i !== loop._lastI) {
    loop._lastI = i;
    syncCaption();
    applyChapterUI(i);   /* 时间轴滚动 / 自动播放时左栏高亮与右栏内容联动跟随 */
  }
}
requestAnimationFrame(loop);
