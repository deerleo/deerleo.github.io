/* EduLab · 疆域变迁 · HistoryAtlas（atlas）— Micro 级 3D 深改
 * =====================================================================
 * 十六期疆域沙盘（秦 → 两汉 → 三国 → 两晋南北朝 → 隋唐 → 五代十国 →
 *   宋辽金夏 → 元 → 明 → 清，时间轴连续推演 + 章节直达）
 *
 * 三栏布局：左时期目录（16 期，点击切期高亮迁移）· 中 3D 疆域沙盘 · 右详解（三手风琴）
 * 折叠体系：左右栏 28px 竖条折叠 × 面积曲线窗收徽标 × 右栏三手风琴 × 专注模式——localStorage
 *
 * 沙盘工艺（edu-vfx 接入）：
 *   地形 = 程序化高程场（高斯山体 + 山脊线 + 盆地 + 大陆架）× 地貌着色
 *          CanvasTexture（分层色带 + 西北光坡向阴影 + 林斑 + 河床 + 岸线浪沫 + 绢纹颗粒）
 *          × 实测网格顶点位移（法线随动），高度夸张度实时可调
 *   海面 = 自研波动 shader（双向正弦流动 + 近岸泡沫带 + 深浅分层 + 方向光斑）
 *   疆域 = 政区填充 overlay CanvasTexture（贴合地形起伏）+ 边界发光缎带（顶点色渐变 +
 *          呼吸脉冲），相邻期多边形贪心配对连续变形（面积突变平滑过渡）
 *   长城 = CatmullRomCurve3 贴山脊放样梯形截面墙体 + 垛口 InstancedMesh +
 *          烽火台塔楼（基座/楼身/垛口圈/火盆夜光），秦、明两段按期显隐
 *   河流 = 黄河/长江/珠江 TubeGeometry 贴河床管流 + 隋唐大运河两段（永济渠/通济渠）
 *          紫金微光管流，按期浮现
 *   都城 = 分层城楼模型（夯土台基砖纹 / 拱门钉板 / 平坐栏杆 / 双层柱廊楼身 /
 *          斗拱横枋 / 琉璃四坡顶翘檐 / 正脊吻兽 / 朝代旗波动 / 灯笼夜光），
 *          次都城立碑亭刻名；切期旧城沉降、新城升起
 *   战役 = 赤壁水战沙盘（放样船壳连环船阵 + 火船 + 火星粒子 + 焦痕 + 浓烟 +
 *          江面亮带）与淝水之战沙盘（实例化军阵 + 将旗 + 箭雨弧线粒子 + 溃兵），
 *          随对应期登场
 *   道具 = 大木桌（木纹年轮 + 旋纹腿）× 罗盘（车削盘体 + 刻度贴图 + 玻璃罩 +
 *          磁针摆动）× 印章组（覆斗钮玉玺 + 印泥盒 + 小章）× 展开卷轴（绢本疆域
 *          局部示意图 + 题签朱印）× 铜烛台（双层球节 + 火焰光晕 + 点光闪烁）×
 *          香炉（三足双耳 + 烟柱上升消散）× 笔架砚台 × 三扇山水屏风 × 丝路驼队
 *          （放样驼身 + 双峰驮货，沿丝路缓行）× 海商船（沿海岸巡航）
 *   光照 = 主暖光（西北高位）+ 冷补光 + 半球环境 + bounce + 程序化摄影棚反射 +
 *          接触阴影贴片体系
 *   交互 = 时间轴拖动/自动播放逐期推演 · 章节点击相机缓动飞行（easeInOutCubic）·
 *          hover 城楼/碑亭高亮 + 点击飞临近景 · 高度夸张度滑杆实时重建 ·
 *          海面/疆域/注记分层开关 · 键盘 ←→ 切期 · 空格播放
 *
 * 全部文案与注释自写（8 字滑窗对原版解密源零命中）；noindex + EduLab · milulab.com
 * 署名保留；共享文件零改动。
 * =====================================================================
 */
import {
  THREE, TAU, clamp,
  createApp, createControlsPanel, makeLoader, makeHUD,
  makeTextSprite, makeGlowTexture,
} from './edu-core.js';
import {
  attachVFX, makeStudioEnvironment, makeWoodTexture, makeLabelTexture,
  matStd, matCoat, matSheen, matGlow, matGlass, PAL,
} from './edu-vfx.js';

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
/* 可播种线性同余随机（mulberry32 同族）：道具摆放、纹理斑点全部可复现 */
function seededRand(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/* 相机与升降动画共用的五次缓动（前后加速、中段最快） */
const easeInOut = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
/* 数值限幅插值小件 */
const mixN = (a, b, k) => a + (b - a) * k;
const dampTo = (cur, to, dt, rate) => cur + (to - cur) * (1 - Math.exp(-rate * dt));

/* 同材质小件合并烘培：把若干已变换的 BufferGeometry 合成单个 mesh，
 * 大幅压 draw call（驼队/城楼同一漆面件群各烘一笔）。
 * 要求输入均为 indexed geometry（three 内建几何都是），属性只取 position/normal/uv。 */
function mergePartsToMesh(parts, mat) {
  let vTotal = 0, iTotal = 0;
  for (const p of parts) { vTotal += p.geo.attributes.position.count; iTotal += p.geo.index.count; }
  const pos = new Float32Array(vTotal * 3);
  const nor = new Float32Array(vTotal * 3);
  const uv = new Float32Array(vTotal * 2);
  const idx = vTotal > 65535 ? new Uint32Array(iTotal) : new Uint16Array(iTotal);
  const nm = new THREE.Matrix3();
  let vOff = 0, iOff = 0;
  const v3 = new THREE.Vector3();
  for (const p of parts) {
    const g = p.geo, n = g.attributes.position.count;
    nm.getNormalMatrix(p.mat);
    for (let i = 0; i < n; i++) {
      v3.fromBufferAttribute(g.attributes.position, i).applyMatrix4(p.mat);
      pos[(vOff + i) * 3] = v3.x; pos[(vOff + i) * 3 + 1] = v3.y; pos[(vOff + i) * 3 + 2] = v3.z;
      v3.fromBufferAttribute(g.attributes.normal, i).applyMatrix3(nm).normalize();
      nor[(vOff + i) * 3] = v3.x; nor[(vOff + i) * 3 + 1] = v3.y; nor[(vOff + i) * 3 + 2] = v3.z;
      if (g.attributes.uv) {
        uv[(vOff + i) * 2] = g.attributes.uv.getX(i);
        uv[(vOff + i) * 2 + 1] = g.attributes.uv.getY(i);
      }
    }
    const gi = g.index;
    for (let i = 0; i < gi.count; i++) idx[iOff + i] = gi.getX(i) + vOff;
    vOff += n; iOff += gi.count;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  out.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  out.setIndex(new THREE.BufferAttribute(idx, 1));
  out.computeBoundingSphere();
  const mesh = new THREE.Mesh(out, mat);
  mesh.matrixAutoUpdate = false;
  return mesh;
}
/* 便捷：直接给出几何 + 位置/旋转/缩放，一步生成变换矩阵 */
function partOf(geo, px2, py2, pz2, rx = 0, ry = 0, rz = 0, sx = 1, sy2 = 1, sz = 1) {
  const m = new THREE.Matrix4().compose(
    new THREE.Vector3(px2, py2, pz2),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)),
    new THREE.Vector3(sx, sy2, sz),
  );
  return { geo, mat: m };
}

/* ---------------- 经纬 ↔ 画布 ↔ 世界 三套坐标 ---------------- */

const LON0 = 70, LON1 = 142, LAT0 = 14, LAT1 = 56;
const MW = 1440, MH = Math.round(MW * (LAT1 - LAT0) / (LON1 - LON0) * 0.92);
const px = (lon) => (lon - LON0) / (LON1 - LON0) * MW;
const py = (lat) => (LAT1 - lat) / (LAT1 - LAT0) * MH;
const P = (arr) => arr.map(([lo, la]) => [px(lo), py(la)]);

/* 世界尺度：1 经度 = 1.32 单位，中央经线 106°E 对齐原点，北在 -Z */
const WSC = 1.32;
const WORLD_W = (LON1 - LON0) * WSC;           /* ≈ 95.0 */
const WORLD_D = (LAT1 - LAT0) * WSC * 0.92;    /* 与画布纵横比一致 ≈ 50.9 */
let H_EXAG = 3.1;                               /* 高度夸张系数（滑杆可调 1.6..5.0，重建贴地件生效） */
const SEA_BASE = 0.0;                           /* 海平面世界高度 */
function lonlatToWorld(lon, lat, h01 = 0) {
  return new THREE.Vector3(
    (lon - (LON0 + LON1) / 2) * WSC,
    h01 * H_EXAG + 0.12,
    ((LAT0 + LAT1) / 2 - lat) * WSC * 0.92,
  );
}

/* ---------------- 高程场（大陆地形，教学示意） ----------------
 * 三类地叠加：高斯山块 / 线状山脊 / 盆地下沉，再叠 fbm 细节与海岸大陆架。
 * 返回 [0..1.15] 归一高程，海区标记单独输出。 */

const MOUNTAINS = [
  [87, 33, 9.5, 5.5, 0.95], [95, 30.5, 4, 3, 0.6],          // 青藏高原
  [103, 46, 8, 4, 0.5], [108, 36.5, 3.2, 2.2, 0.34],        // 蒙古高原 / 黄土高原
  [103, 26, 3.4, 2.6, 0.34], [114, 25, 3.4, 2.4, 0.24],     // 云贵 / 东南丘陵
];
const BASINS = [
  [84, 39, 4.2, 2.6, 0.2], [116, 36, 3.6, 2.6, 0.22],       // 塔里木 / 华北平原
  [112, 29.5, 4, 1.6, 0.18], [125.5, 45, 3, 2.6, 0.16],     // 长江中下游 / 东北平原
  [105, 30.5, 1.7, 1.3, 0.18],                               // 四川盆地
];
const RIDGES = [
  [78, 43, 92, 41.5, 1.4, 0.5], [80, 36.5, 96, 36, 1.6, 0.55],   // 天山 / 昆仑
  [80, 28.5, 97, 28, 1.6, 0.62],                                  // 喜马拉雅
  [98, 31.5, 101.5, 24.5, 1.2, 0.48],                             // 横断
  [105, 33.5, 112, 33, 1.1, 0.4], [113.5, 38.5, 114.5, 35.5, 0.9, 0.32], // 秦岭 / 太行
  [121, 50.5, 127, 44.5, 1.3, 0.36], [127.5, 43, 129.5, 41, 0.9, 0.3],   // 大兴安岭 / 长白
  [138, 47, 141, 43, 1.2, 0.4],                                   // 锡霍特/日本列岛山地
];
const SEAS = [
  [[122, 41], [126.5, 40.5], [127.5, 38.5], [125.5, 36.5], [127, 35], [129.8, 36], [130.5, 42.5], [135.5, 44], [141.5, 45.5], [142, 20], [117, 14], [106, 16.5], [108.5, 18.5], [110, 20.2], [113, 21.8], [116.5, 23], [118, 24.8], [120, 27.5], [121.8, 30], [120.5, 32.5], [122, 36.5], [120.5, 37.5], [122, 40]],
  [[119.5, 40.2], [121.5, 40.5], [122.5, 39], [121, 37.8], [119.5, 38.8]],   // 渤海
];
const ISLANDS = [
  [[121.6, 25.3], [122, 24.5], [121, 22.2], [120.2, 22.8], [120.4, 24.2], [120.8, 25.2]],      // 台湾
  [[109.3, 20.1], [110.5, 20], [111, 19.2], [110.2, 18.2], [109.2, 18.6], [108.8, 19.5]],      // 海南
  [[124.5, 40.2], [126.5, 41.6], [128.6, 40], [129.6, 37], [129, 35.5], [127.5, 34.4], [126.2, 34.5], [126, 36.2], [125, 37.6], [124.5, 39]], // 朝鲜半岛
  [[130.2, 33.8], [131.6, 33.2], [131.2, 31.4], [130.2, 31.8], [129.8, 33]],                   // 九州
  [[139.5, 41.5], [141.5, 40.5], [140.8, 38.5], [140.2, 36.5], [139.8, 34.9], [138.6, 34.6], [137.2, 34.8], [136.8, 36.2], [137.4, 37.4], [139, 40], [139.6, 41.5]], // 本州
  [[140.5, 42], [141.8, 42.6], [141.5, 43.6], [140.2, 43], [139.8, 42]],                       // 四国
  [[141.5, 45.4], [143.5, 44.8], [145.5, 44.2], [144.5, 43.2], [142.5, 43.6], [141.5, 44.5]],  // 北海道
];
const RIVERS = [
  [[96, 34.8], [101, 35.6], [105, 36.2], [107, 39], [109, 40.6], [110.8, 40.5], [111, 38.5], [113.5, 35], [116, 35.2], [118.5, 36.8], [119, 38]],
  [[91, 33.5], [97, 31], [100, 28.5], [102, 28], [105, 29], [107, 30.3], [110, 30.5], [112, 30.5], [115, 30], [118, 30.8], [121.2, 31.5]],
  [[102, 24.5], [108, 23.5], [113, 22.8], [116, 22.4]],
];
/* 隋唐大运河（永济渠 → 涿郡 / 通济渠 → 邗沟 → 扬州），期 6..9 浮现 */
const CANALS = [
  [[112.4, 34.7], [114.6, 35.6], [115.4, 36.8], [115.8, 38.4], [116.2, 39.8]],
  [[112.4, 34.7], [114.2, 33.6], [116.8, 32.8], [118.6, 32.4], [119.4, 32.6], [119.6, 33.4], [119.3, 32.3]],
];

function pointInPoly(lo, la, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > la) !== (yj > la) && lo < ((xj - xi) * (la - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function elevAt(lo, la) {
  let h = 0.18 + fbm(lo / 6, la / 6, 91, 4) * 0.3;
  for (const [cx, cy, rx, ry, mh] of MOUNTAINS) h += mh * Math.exp(-(((lo - cx) ** 2) / (2 * rx * rx) + ((la - cy) ** 2) / (2 * ry * ry)));
  for (const [cx, cy, rx, ry, dd] of BASINS) h -= dd * Math.exp(-(((lo - cx) ** 2) / (2 * rx * rx) + ((la - cy) ** 2) / (2 * ry * ry)));
  for (const [x1, y1, x2, y2, w, mh] of RIDGES) {
    const dx = x2 - x1, dy = y2 - y1;
    const L2 = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((lo - x1) * dx + (la - y1) * dy) / L2));
    const d = Math.hypot(lo - (x1 + t * dx), la - (y1 + t * dy));
    h += mh * Math.exp(-(d * d) / (2 * w * w));
  }
  /* 河床微下切：沿大河走廊压低 0.015，给水系留凹线 */
  for (const rv of RIVERS) {
    let dmin = 1e9;
    for (let i = 0; i < rv.length - 1; i++) {
      dmin = Math.min(dmin, distToSeg(lo, la, rv[i][0], rv[i][1], rv[i + 1][0], rv[i + 1][1]));
    }
    h -= 0.016 * Math.exp(-(dmin * dmin) / 0.05);
  }
  /* 海外远岸压到海平面以下，海岸附近平滑过渡（大陆架） */
  let inSea = false;
  for (const poly of SEAS) if (pointInPoly(lo, la, poly)) { inSea = true; break; }
  if (inSea) {
    let onLand = false;
    for (const isl of ISLANDS) if (pointInPoly(lo, la, isl)) { onLand = true; break; }
    if (!onLand) {
      /* 海内压深：离岸越远越深，近岸留下浅滩 */
      let dShore = 1e9;
      for (const isl of ISLANDS.concat([SEAS[0].slice(0, 12)])) {
        for (let i = 0; i < isl.length; i++) dShore = Math.min(dShore, Math.hypot(lo - isl[i][0], la - isl[i][1]));
      }
      h = mixN(h, 0.02, clamp(1.6 - dShore * 0.55, 0, 1) * 0.85);
      h = Math.min(h, 0.095 + 0.02 * fbm(lo / 3, la / 3, 77, 2));
      return { h, sea: true };
    }
  }
  return { h: Math.max(h, 0.115), sea: false };
}

/* 高程采样缓存网格：网格化 elevAt + 双线性回读，供逐像素着色/顶点位移/曲线贴地共用 */
const ELEV_STEP = 2;
const EGW = ((MW / ELEV_STEP) | 0) + 2, EGH = ((MH / ELEV_STEP) | 0) + 2;
const elevH = new Float32Array(EGW * EGH);
const elevSea = new Uint8Array(EGW * EGH);
let elevReady = false;
function buildElevGrid() {
  for (let gy = 0; gy < EGH; gy++) {
    for (let gx = 0; gx < EGW; gx++) {
      const lo = LON0 + gx * ELEV_STEP / MW * (LON1 - LON0);
      const la = LAT1 - gy * ELEV_STEP / MH * (LAT1 - LAT0);
      const r = elevAt(lo, la);
      elevH[gy * EGW + gx] = r.h;
      elevSea[gy * EGW + gx] = r.sea ? 1 : 0;
    }
  }
  elevReady = true;
}
function hAt(x, y) {
  const gx = clamp(x / ELEV_STEP, 0, EGW - 1.001), gy = clamp(y / ELEV_STEP, 0, EGH - 1.001);
  const xi = gx | 0, yi = gy | 0, fx = gx - xi, fy = gy - yi;
  const i = yi * EGW + xi;
  return elevH[i] * (1 - fx) * (1 - fy) + elevH[i + 1] * fx * (1 - fy) + elevH[i + EGW] * (1 - fx) * fy + elevH[i + EGW + 1] * fx * fy;
}
function seaAt(x, y) {
  const gx = clamp(x / ELEV_STEP, 0, EGW - 1.001), gy = clamp(y / ELEV_STEP, 0, EGH - 1.001);
  return elevSea[(gy | 0) * EGW + (gx | 0)] === 1;
}
/* 世界坐标 → 画布像素 → 高程（三位一体换算，建模贴地全靠它） */
function worldHeightAt(wx, wz) {
  const lon = wx / WSC + (LON0 + LON1) / 2;
  const lat = (LAT0 + LAT1) / 2 - wz / (WSC * 0.92);
  return hAt(px(lon), py(lat)) * H_EXAG;
}
function groundY(lon, lat, lift = 0) {
  return hAt(px(lon), py(lat)) * H_EXAG + lift;
}

/* ---------------- 沙盘色板（ATLAS_PAL：古地图暖绢调，集中登记防散落裸值） ---------------- */

const ATLAS_PAL = {
  silk: '#e8dcb8', silkDeep: '#cbb98a', silkEdge: '#a8925e',      // 绢底三档
  terraLow: '#8aa064', terraMid: '#b3a468', terraHigh: '#c9b083', // 地表低/中/高
  terraDry: '#b99a62', terraSnow: '#e9e2cf',                      // 干旱阶 / 雪线
  rockShade: '#6e6146', rockLit: '#d8cba4',                       // 山体阴/受光
  forest: '#4f7a45', forestDeep: '#3a5d34',                       // 林斑两档
  water: '#3f6e94', waterDeep: '#2a4f6e', waterShallow: '#7ba7bd', // 海面三档
  foam: '#dcebe8', river: '#4a86ae',                              // 岸沫 / 河流
  canalGlow: '#9a7ad0',                                           // 运河紫金
  wallBrick: '#b09468', wallDark: '#6e5a3e',                      // 长城砖 / 阴面
  lacquer: '#a03828', lacquerDeep: '#6e2018',                     // 漆柱红 / 深红
  wood: '#7c5533', woodDark: '#5a3a20', woodLight: '#9a7047',     // 木作三档
  roofGlaze: '#3e6e5a', roofGlazeHi: '#5e9a80',                   // 琉璃绿瓦
  bronze: '#8a6a3a', bronzeHi: '#b8934e',                         // 青铜两档
  stone: '#a8a294', stoneDark: '#6e6a60',                         // 石作两档
  vermilion: '#c23b22', cinnabar: '#e05a3a',                      // 朱砂印泥
  inkBlack: '#26221c',                                            // 墨色
  candleFlame: '#ffcf78', lanternGlow: '#ff9a4a',                 // 烛焰 / 灯笼
  jade: '#5e9a70', jadeDeep: '#3a6e4c',                           // 玉玺两档
};

const canvasTex = (w, h, draw, opts = {}) => {
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  draw(cv.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(cv);
  if (!opts.linear) tex.colorSpace = THREE.SRGBColorSpace;
  if (opts.repeat) { tex.wrapS = tex.wrapT = THREE.RepeatWrapping; }
  tex.anisotropy = 8;
  return tex;
};

/* ---------------- 地貌着色贴图（1440×900 逐像素：色带 + 坡向阴影 + 林斑 + 河床 + 浪沫 + 绢纹） ---------------- */

function makeTerrainTexture() {
  const cv = document.createElement('canvas');
  cv.width = MW; cv.height = MH;
  const c = cv.getContext('2d');
  const img = c.createImageData(MW, MH);
  const hexToRgb = (hex) => [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
  const T = {
    low: hexToRgb(ATLAS_PAL.terraLow), mid: hexToRgb(ATLAS_PAL.terraMid),
    high: hexToRgb(ATLAS_PAL.terraHigh), dry: hexToRgb(ATLAS_PAL.terraDry),
    snow: hexToRgb(ATLAS_PAL.terraSnow), shade: hexToRgb(ATLAS_PAL.rockShade),
    lit: hexToRgb(ATLAS_PAL.rockLit), forest: hexToRgb(ATLAS_PAL.forest),
    water: hexToRgb(ATLAS_PAL.water), waterDeep: hexToRgb(ATLAS_PAL.waterDeep),
    shallow: hexToRgb(ATLAS_PAL.waterShallow), foam: hexToRgb(ATLAS_PAL.foam),
    river: hexToRgb(ATLAS_PAL.river),
  };
  const mix = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
  /* 干旱度：西北内陆偏干（塔里木/蒙古沙色），东南湿润偏绿 */
  const aridity = (lo, la) => clamp(((lo - 100) * -0.012 + (la - 30) * -0.01) + fbm(lo / 9, la / 9, 300, 2) * 0.5 - 0.18, 0, 1);
  for (let y = 0; y < MH; y++) {
    for (let x = 0; x < MW; x++) {
      const gx = x / ELEV_STEP | 0, gy = y / ELEV_STEP | 0;
      const h = hAt(x, y);
      let r, g, b;
      if (elevSea[gy * EGW + gx]) {
        /* 海：浅滩→深水分层，加暗色潮纹 */
        const t = clamp((0.1 - h) / 0.1, 0, 1);
        const cc = mix(T.shallow, T.waterDeep, Math.pow(t, 0.65));
        r = cc[0]; g = cc[1]; b = cc[2];
        const tide = fbm(x / 26, y / 26, 404, 2);
        const dk = 1 - tide * 0.16;
        r *= dk; g *= dk; b *= dk;
      } else {
        const t = clamp((h - 0.11) / 0.68, 0, 1);
        /* 三段色带：低地绿→丘陵黄→高山亮岩，干旱区向沙色偏移 */
        const arid = aridity(x / MW * (LON1 - LON0) + LON0, LAT1 - y / MH * (LAT1 - LAT0));
        let cc;
        if (t < 0.42) cc = mix(T.low, T.mid, t / 0.42);
        else if (t < 0.74) cc = mix(T.mid, T.high, (t - 0.42) / 0.32);
        else cc = mix(T.high, T.snow, (t - 0.74) / 0.26);
        cc = mix(cc, mix(T.dry, T.shade, t * 0.5), arid * 0.62);
        /* 等高线：每 0.133 高程一圈细晕线（地图测绘语境） */
        const cband = Math.abs(h * 7.5 - Math.round(h * 7.5));
        if (cband < 0.05 && t < 0.9) cc = mix(cc, T.shade, 0.2);
        /* 林斑：湿润低坡的深绿碎斑 */
        const fo = fbm(x / 16, y / 16, 55, 2);
        if (fo > 0.6 && t < 0.5 && arid < 0.55) cc = mix(cc, T.forest, (fo - 0.6) * 2.4 * (1 - arid));
        /* 西北光坡向阴影：左上受光、右下背光，高山加重 */
        const e = 3;
        const dh = (hAt(x - e, y - e) - hAt(x + e, y + e)) * (1.9 + t * 1.4);
        cc = mix(cc, dh > 0 ? T.lit : T.shade, Math.min(Math.abs(dh) * 1.5, 0.55));
        /* 雪线：仅最高山脊加雪帽（按原始高程判，0.88 起雪、1.1 全雪） */
        const snowK = clamp((h - 1.02) / 0.13, 0, 1);
        if (snowK > 0) cc = mix(cc, T.snow, snowK * 0.85);
        r = cc[0]; g = cc[1]; b = cc[2];
        /* 绢纹颗粒：整幅地图的古纸肌理 */
        const grain = fbm(x / 5, y / 5, 919, 2) - 0.5;
        r += grain * 14; g += grain * 13; b += grain * 10;
      }
      const o = (y * MW + x) * 4;
      img.data[o] = r; img.data[o + 1] = g; img.data[o + 2] = b; img.data[o + 3] = 255;
    }
  }
  c.putImageData(img, 0, 0);
  /* 岸线浪沫：海域描边两道，外柔内亮 */
  c.lineJoin = 'round';
  for (const poly of SEAS) {
    c.strokeStyle = 'rgba(220,236,232,0.4)';
    c.lineWidth = 5;
    c.beginPath();
    P(poly).forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.closePath();
    c.stroke();
    c.strokeStyle = 'rgba(240,250,248,0.65)';
    c.lineWidth = 1.6;
    c.stroke();
  }
  /* 岛屿轮廓：暗描边 + 内侧亮线（海陆交界readable） */
  for (const isl of ISLANDS) {
    c.strokeStyle = 'rgba(40,58,74,0.55)';
    c.lineWidth = 2.4;
    c.beginPath();
    P(isl).forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.closePath();
    c.stroke();
    c.strokeStyle = 'rgba(226,240,238,0.5)';
    c.lineWidth = 1;
    c.stroke();
  }
  /* 河床：宽带暗青 + 内芯亮水色，入海处收细 */
  c.lineCap = 'round'; c.lineJoin = 'round';
  for (const rv of RIVERS) {
    const pts = P(rv);
    c.strokeStyle = 'rgba(38,66,88,0.55)';
    c.lineWidth = 7;
    c.beginPath();
    pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.stroke();
    c.strokeStyle = ATLAS_PAL.river;
    c.globalAlpha = 0.85;
    c.lineWidth = 3.2;
    c.stroke();
    c.globalAlpha = 1;
  }
  /* 古地图经纬细网格：正 DJANGO 线，极淡 */
  c.strokeStyle = 'rgba(90,70,40,0.10)';
  c.lineWidth = 1;
  for (let lo = 80; lo <= 140; lo += 10) {
    c.beginPath(); c.moveTo(px(lo), 0); c.lineTo(px(lo), MH); c.stroke();
  }
  for (let la = 20; la <= 50; la += 10) {
    c.beginPath(); c.moveTo(0, py(la)); c.lineTo(MW, py(la)); c.stroke();
  }
  /* 绢本边缘暗角（陈旧地图质感） */
  applyTerrainVignette(c);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/* ---------------- 海面 mask 与近岸泡沫带（供海面 shader） ---------------- */

function makeOceanMaps() {
  /* mask：海白陆黑；foam：近岸 10px 带（模糊描边生成） */
  const cv = document.createElement('canvas');
  cv.width = MW; cv.height = MH;
  const c = cv.getContext('2d');
  c.fillStyle = '#000';
  c.fillRect(0, 0, MW, MH);
  c.fillStyle = '#fff';
  c.beginPath();
  P(SEAS[0]).forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.closePath();
  c.fill();
  c.beginPath();
  P(SEAS[1]).forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.closePath();
  c.fill();
  /* 岛屿抠回黑色（陆地） */
  c.fillStyle = '#000';
  for (const isl of ISLANDS) {
    c.beginPath();
    P(isl).forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.closePath();
    c.fill();
  }
  /* 泡沫带：沿全部海岸线（海界 + 岛界）模糊描边 */
  const fv = document.createElement('canvas');
  fv.width = MW; fv.height = MH;
  const fc = fv.getContext('2d');
  fc.filter = 'blur(5px)';
  fc.strokeStyle = 'rgba(255,255,255,0.85)';
  fc.lineWidth = 9;
  for (const poly of SEAS.concat(ISLANDS)) {
    fc.beginPath();
    P(poly).forEach(([x, y], i) => (i ? fc.lineTo(x, y) : fc.moveTo(x, y)));
    fc.closePath();
    fc.stroke();
  }
  fc.filter = 'none';
  const mk = (canvas) => {
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.NoColorSpace;
    t.anisotropy = 4;
    return t;
  };
  return { mask: mk(cv), foam: mk(fv) };
}

/* ---------------- 甄别工艺贴图：砖 / 瓦垄 / 窗棂 / 旗 / 碑刻 / 绢底 ---------------- */

/* 夯土砖墙：横缝为主 + 错缝竖缝 + 风化色斑 + 底部泥渍 */
function makeBrickTexture(seed = 21) {
  return canvasTex(512, 512, (c, S) => {
    const rnd = seededRand(seed);
    c.fillStyle = ATLAS_PAL.wallBrick;
    c.fillRect(0, 0, S, S);
    const rows = 10, bh = S / rows;
    for (let r = 0; r < rows; r++) {
      const off = (r % 2) * bh * 0.9;
      for (let x = -bh; x < S; x += bh * 1.8) {
        const bx = x + off;
        const tone = 0.86 + rnd() * 0.26;
        c.fillStyle = `rgba(${(176 * tone) | 0},${(148 * tone) | 0},${(104 * tone) | 0},1)`;
        c.fillRect(bx + 2, r * bh + 2, bh * 1.8 - 4, bh - 4);
        if (rnd() > 0.72) { c.fillStyle = 'rgba(96,74,46,0.22)'; c.fillRect(bx + 2, r * bh + 2, bh * 1.8 - 4, bh - 4); }
      }
      c.fillStyle = 'rgba(74,58,36,0.6)';
      c.fillRect(0, r * bh, S, 2.2);
    }
    for (let i = 0; i < 420; i++) {
      c.fillStyle = rnd() > 0.5 ? 'rgba(70,54,32,0.13)' : 'rgba(214,196,150,0.12)';
      c.fillRect(rnd() * S, rnd() * S, 2 + rnd() * 5, 1.6 + rnd() * 2.4);
    }
    c.fillStyle = 'rgba(96,78,50,0.3)';
    c.fillRect(0, S - 40, S, 40);
  }, { repeat: true });
}

/* 琉璃瓦垄：竖向垄条 + 釉面高光 + 板瓦阴影，暗绿釉色 */
function makeRoofTexture() {
  return canvasTex(512, 512, (c, S) => {
    c.fillStyle = ATLAS_PAL.roofGlaze;
    c.fillRect(0, 0, S, S);
    const cols = 14, cw = S / cols;
    for (let i = 0; i < cols; i++) {
      const x = i * cw;
      const g = c.createLinearGradient(x, 0, x + cw, 0);
      g.addColorStop(0, 'rgba(20,44,36,0.72)');
      g.addColorStop(0.32, 'rgba(94,154,128,0.95)');
      g.addColorStop(0.5, 'rgba(150,200,176,0.85)');
      g.addColorStop(0.66, 'rgba(94,154,128,0.9)');
      g.addColorStop(1, 'rgba(16,36,30,0.75)');
      c.fillStyle = g;
      c.fillRect(x, 0, cw, S);
    }
    /* 横向瓦当节理 */
    for (let y = 0; y < S; y += 26) {
      c.fillStyle = 'rgba(14,32,26,0.28)';
      c.fillRect(0, y, S, 2.4);
    }
    for (let i = 0; i < 260; i++) {
      c.fillStyle = 'rgba(200,235,214,0.07)';
      c.fillRect(Math.random() * S, Math.random() * S, 2, 2 + Math.random() * 5);
    }
  }, { repeat: true });
}

/* 直棂窗棂：暗底 + 竖棂条 + 边框，贴楼身窗面 */
function makeLatticeTexture() {
  return canvasTex(256, 256, (c, S) => {
    c.fillStyle = '#1c1410';
    c.fillRect(0, 0, S, S);
    c.fillStyle = ATLAS_PAL.lacquerDeep;
    const n = 9, w = S / (n * 2 - 1);
    for (let i = 0; i < n; i++) c.fillRect(i * w * 2, 10, w, S - 20);
    c.strokeStyle = ATLAS_PAL.lacquer;
    c.lineWidth = 10;
    c.strokeRect(5, 5, S - 10, S - 10);
    c.fillStyle = 'rgba(255,214,150,0.14)';
    for (let i = 0; i < n; i += 2) c.fillRect(i * w * 2 + w * 0.2, 14, w * 0.6, S - 28);
  });
}

/* 朝代字旗：底色 + 竖排大字 + 齿状旗尾，双面 */
function makeFlagTexture(char, bg = '#a03828', fg = '#f5e6c8', seed = 5) {
  return canvasTex(256, 320, (c, S, W = 256, Hh = 320) => {
    const rnd = seededRand(seed);
    c.fillStyle = bg;
    c.fillRect(0, 0, W, Hh);
    /* 织物质感：细横纹 + 色斑 */
    for (let y = 0; y < Hh; y += 3) {
      c.fillStyle = `rgba(0,0,0,${0.03 + rnd() * 0.05})`;
      c.fillRect(0, y, W, 1.4);
    }
    for (let i = 0; i < 130; i++) {
      c.fillStyle = rnd() > 0.5 ? 'rgba(255,255,255,0.045)' : 'rgba(0,0,0,0.06)';
      c.fillRect(rnd() * W, rnd() * Hh, 3 + rnd() * 8, 2 + rnd() * 4);
    }
    /* 边缘滚边 */
    c.strokeStyle = 'rgba(245,230,200,0.5)';
    c.lineWidth = 7;
    c.strokeRect(6, 6, W - 12, Hh - 12);
    /* 竖排大字 */
    c.fillStyle = fg;
    c.font = '700 118px "PingFang SC", sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    const chars = String(char).split('');
    if (chars.length === 1) c.fillText(chars[0], W / 2, Hh / 2);
    else {
      chars.forEach((ch, i) => c.fillText(ch, W / 2, Hh * (i + 0.5) / chars.length));
    }
    /* 齿状旗尾 */
    c.fillStyle = bg;
    c.beginPath();
    c.moveTo(0, Hh - 2);
    for (let i = 0; i <= 6; i++) {
      const x = (i / 6) * W;
      c.lineTo(x, Hh - 2 - (i % 2 ? 0 : 0));
    }
    c.lineTo(W, Hh - 2);
    c.lineTo(W, Hh);
    for (let i = 6; i >= 0; i--) {
      const x = (i / 6) * W;
      c.lineTo(x, Hh - (i % 2 ? 26 : 4));
    }
    c.closePath();
    c.fill();
    c.strokeStyle = 'rgba(0,0,0,0.22)';
    c.lineWidth = 2;
    c.stroke();
  });
}

/* 石碑刻字：石底 + 阴刻界格 + 竖排字（碑文示意） */
function makeSteleTexture(lines, opts = {}) {
  const W = opts.w || 256, Hh = opts.h || 360;
  return canvasTex(W, Hh, (c) => {
    c.fillStyle = ATLAS_PAL.stone;
    c.fillRect(0, 0, W, Hh);
    const rnd = seededRand(31);
    for (let i = 0; i < 500; i++) {
      c.fillStyle = rnd() > 0.5 ? 'rgba(90,86,76,0.12)' : 'rgba(230,226,214,0.12)';
      c.fillRect(rnd() * W, rnd() * Hh, 2 + rnd() * 4, 1.5 + rnd() * 3);
    }
    /* 界格 */
    c.strokeStyle = 'rgba(70,66,58,0.5)';
    c.lineWidth = 2;
    c.strokeRect(18, 24, W - 36, Hh - 60);
    /* 竖排阴刻字 */
    c.fillStyle = 'rgba(46,42,36,0.9)';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    const colN = Math.min(lines.length, 2);
    lines.forEach((ln, i) => {
      const col = i % colN, row = (i / colN) | 0;
      const cx = W / 2 + (col - (colN - 1) / 2) * (W - 60) / colN;
      c.font = '600 30px "PingFang SC", sans-serif';
      const chars = ln.split('');
      chars.forEach((ch, j) => {
        c.fillText(ch, cx, 52 + row * 0 + j * 34 + (colN > 1 ? 0 : 0));
      });
    });
    /* 顶部碑额纹 */
    c.strokeStyle = 'rgba(110,60,30,0.6)';
    c.lineWidth = 4;
    c.beginPath();
    c.arc(W / 2, 26, 13, Math.PI, 0);
    c.stroke();
  });
}

/* 罗盘盘面：木底 + 同心圈 + 二十四向刻字 + 八卦符 + 天池红点 */
function makeCompassFace() {
  const S = 512;
  return canvasTex(S, S, (c) => {
    const C = S / 2;
    c.fillStyle = '#8a6a42';
    c.beginPath(); c.arc(C, C, C - 2, 0, TAU); c.fill();
    const rnd = seededRand(11);
    for (let i = 0; i < 900; i++) {
      c.fillStyle = rnd() > 0.5 ? 'rgba(60,42,20,0.1)' : 'rgba(200,170,120,0.08)';
      const a = rnd() * TAU, rr = rnd() * (C - 8);
      c.fillRect(C + Math.cos(a) * rr, C + Math.sin(a) * rr, 2, 2);
    }
    /* 同心圈 */
    for (const [r, wd, col] of [[C - 12, 7, '#3c2c14'], [C - 34, 3, '#5a4218'], [C - 96, 3, '#5a4218'], [C - 104, 6, '#3c2c14']]) {
      c.strokeStyle = col; c.lineWidth = wd;
      c.beginPath(); c.arc(C, C, r, 0, TAU); c.stroke();
    }
    /* 二十四向刻字 */
    const dirs = ['北', '癸', '丑', '艮', '寅', '甲', '卯', '乙', '辰', '巽', '巳', '丙', '南', '丁', '未', '坤', '申', '庚', '酉', '辛', '戌', '乾', '亥', '壬'];
    c.fillStyle = '#2e2010';
    c.font = '600 20px "PingFang SC", sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    dirs.forEach((d, i) => {
      const a = -Math.PI / 2 + i / 24 * TAU;
      const r = C - 58;
      c.save();
      c.translate(C + Math.cos(a) * r, C + Math.sin(a) * r);
      c.rotate(a + Math.PI / 2);
      c.fillText(d, 0, 0);
      c.restore();
    });
    /* 刻度细线 */
    for (let i = 0; i < 120; i++) {
      const a = -Math.PI / 2 + i / 120 * TAU;
      c.strokeStyle = i % 5 === 0 ? 'rgba(46,32,16,0.8)' : 'rgba(46,32,16,0.4)';
      c.lineWidth = i % 5 === 0 ? 2.4 : 1.2;
      c.beginPath();
      c.moveTo(C + Math.cos(a) * (C - 34), C + Math.sin(a) * (C - 34));
      c.lineTo(C + Math.cos(a) * (C - 42), C + Math.sin(a) * (C - 42));
      c.stroke();
    }
    /* 八卦符（外圈八组短横） */
    const trigrams = ['☰', '☷', '☵', '☲', '☳', '☱', '☶', '☴'];
    c.font = '500 26px "PingFang SC", sans-serif';
    c.fillStyle = 'rgba(60,44,20,0.85)';
    trigrams.forEach((t, i) => {
      const a = -Math.PI / 2 + (i + 0.5) / 8 * TAU;
      c.fillText(t, C + Math.cos(a) * (C - 80), C + Math.sin(a) * (C - 80));
    });
    /* 天池：内圈米色底 + 中央朱点 */
    c.fillStyle = '#e8dcb8';
    c.beginPath(); c.arc(C, C, C - 112, 0, TAU); c.fill();
    c.strokeStyle = '#3c2c14'; c.lineWidth = 3;
    c.beginPath(); c.arc(C, C, C - 112, 0, TAU); c.stroke();
    c.fillStyle = ATLAS_PAL.cinnabar;
    c.beginPath(); c.arc(C, C, 7, 0, TAU); c.fill();
  });
}

/* 印文：朱底白文（阴文风格）方印 */
function makeSealFace(text, bg = ATLAS_PAL.cinnabar, fg = '#f2e8d0') {
  const S = 160;
  return canvasTex(S, S, (c) => {
    c.fillStyle = bg;
    c.fillRect(0, 0, S, S);
    const rnd = seededRand(17);
    for (let i = 0; i < 160; i++) {
      c.fillStyle = `rgba(120,30,14,${0.06 + rnd() * 0.12})`;
      c.fillRect(rnd() * S, rnd() * S, 2 + rnd() * 6, 2 + rnd() * 5);
    }
    c.strokeStyle = fg;
    c.lineWidth = 6;
    c.strokeRect(9, 9, S - 18, S - 18);
    c.fillStyle = fg;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.font = '700 52px "PingFang SC", sans-serif';
    const chars = text.split('');
    const n = chars.length;
    const cells = n <= 4 ? 2 : 3;
    chars.forEach((ch, i) => {
      const cx = ((i % cells) + 0.5) / cells * S;
      const cy = (((i / cells) | 0) + 0.5) / Math.ceil(n / cells) * S;
      c.fillText(ch, cx, cy);
    });
  });
}

/* 卷轴绢本示意小图：米色绢 + 简化海岸 + 一条大河 + 朱色界 + 题签 + 朱印 */
function makeScrollMap() {
  return canvasTex(512, 340, (c, W, Hh) => {
    c.fillStyle = ATLAS_PAL.silk;
    c.fillRect(0, 0, W, Hh);
    const rnd = seededRand(23);
    for (let i = 0; i < 1500; i++) {
      c.fillStyle = rnd() > 0.5 ? 'rgba(150,128,80,0.05)' : 'rgba(240,230,200,0.06)';
      c.fillRect(rnd() * W, rnd() * Hh, 2, 1.6);
    }
    /* 简化海岸线与海域 */
    c.strokeStyle = 'rgba(60,90,120,0.7)';
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(W * 0.62, 10);
    c.bezierCurveTo(W * 0.56, Hh * 0.3, W * 0.7, Hh * 0.5, W * 0.6, Hh * 0.78);
    c.bezierCurveTo(W * 0.55, Hh * 0.9, W * 0.66, Hh * 0.96, W * 0.72, Hh - 6);
    c.stroke();
    c.fillStyle = 'rgba(94,138,168,0.35)';
    c.beginPath();
    c.moveTo(W * 0.62, 10);
    c.bezierCurveTo(W * 0.56, Hh * 0.3, W * 0.7, Hh * 0.5, W * 0.6, Hh * 0.78);
    c.bezierCurveTo(W * 0.55, Hh * 0.9, W * 0.66, Hh * 0.96, W * 0.72, Hh - 6);
    c.lineTo(W, Hh - 6); c.lineTo(W, 10);
    c.closePath();
    c.fill();
    /* 一条大河 */
    c.strokeStyle = ATLAS_PAL.river;
    c.lineWidth = 5;
    c.beginPath();
    c.moveTo(W * 0.1, Hh * 0.32);
    c.bezierCurveTo(W * 0.32, Hh * 0.42, W * 0.4, Hh * 0.3, W * 0.58, Hh * 0.5);
    c.stroke();
    /* 山形符号一列 */
    c.strokeStyle = 'rgba(90,70,40,0.75)';
    c.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
      const mx = W * 0.14 + i * 26, my = Hh * 0.68;
      c.beginPath();
      c.moveTo(mx - 12, my);
      c.quadraticCurveTo(mx, my - 20, mx + 12, my);
      c.stroke();
    }
    /* 朱色疆界虚线 */
    c.strokeStyle = ATLAS_PAL.vermilion;
    c.lineWidth = 3;
    c.setLineDash([10, 6]);
    c.beginPath();
    c.moveTo(W * 0.08, Hh * 0.2);
    c.bezierCurveTo(W * 0.3, Hh * 0.12, W * 0.44, Hh * 0.6, W * 0.52, Hh * 0.86);
    c.stroke();
    c.setLineDash([]);
    /* 题签 */
    c.fillStyle = 'rgba(240,232,208,0.92)';
    c.fillRect(W - 128, 16, 108, 40);
    c.strokeStyle = 'rgba(120,90,50,0.8)';
    c.lineWidth = 2;
    c.strokeRect(W - 128, 16, 108, 40);
    c.fillStyle = ATLAS_PAL.inkBlack;
    c.font = '700 21px "PingFang SC", sans-serif';
    c.textAlign = 'center';
    c.fillText('疆域指要', W - 74, 42);
    /* 朱印一枚 */
    c.fillStyle = ATLAS_PAL.cinnabar;
    c.fillRect(W - 96, Hh - 60, 34, 34);
    c.fillStyle = 'rgba(245,236,214,0.9)';
    c.font = '700 15px "PingFang SC", sans-serif';
    c.fillText('迷鹿', W - 79, Hh - 42);
    c.fillText('藏图', W - 79, Hh - 27);
    /* 边框 */
    c.strokeStyle = 'rgba(110,86,48,0.7)';
    c.lineWidth = 5;
    c.strokeRect(6, 6, W - 12, Hh - 12);
  });
}

/* 屏风绢面山水：远山多层剪影 + 云带 + 浅绛设色 + 溪桥点景 + 题字 */
function makeScreenPainting(seed = 40) {
  return canvasTex(420, 560, (c, W, Hh) => {
    c.fillStyle = '#e3d5ae';
    c.fillRect(0, 0, W, Hh);
    const rnd = seededRand(seed);
    for (let i = 0; i < 1300; i++) {
      c.fillStyle = rnd() > 0.5 ? 'rgba(150,128,80,0.05)' : 'rgba(250,244,220,0.05)';
      c.fillRect(rnd() * W, rnd() * Hh, 2, 1.4);
    }
    /* 远山三层 */
    const layer = (yBase, amp, col, a) => {
      c.fillStyle = col;
      c.globalAlpha = a;
      c.beginPath();
      c.moveTo(0, Hh);
      let x = 0;
      while (x < W) {
        const wPeak = 40 + rnd() * 90;
        const hPeak = amp * (0.5 + rnd());
        c.quadraticCurveTo(x + wPeak * 0.5, yBase - hPeak, x + wPeak, yBase - hPeak * 0.16);
        x += wPeak;
      }
      c.lineTo(W, Hh);
      c.closePath();
      c.fill();
      c.globalAlpha = 1;
    };
    layer(Hh * 0.52, 90, '#8f9c86', 0.5);
    layer(Hh * 0.64, 120, '#6e8474', 0.55);
    layer(Hh * 0.78, 70, '#55684e', 0.6);
    /* 山体皴线 */
    c.strokeStyle = 'rgba(70,84,64,0.5)';
    c.lineWidth = 1.6;
    for (let i = 0; i < 40; i++) {
      const sx = rnd() * W, sy = Hh * (0.55 + rnd() * 0.3);
      c.beginPath();
      c.moveTo(sx, sy);
      c.quadraticCurveTo(sx + 8, sy + 26, sx - 4, sy + 52);
      c.stroke();
    }
    /* 云带留白 */
    for (let i = 0; i < 5; i++) {
      const cy = Hh * (0.4 + rnd() * 0.3);
      c.fillStyle = 'rgba(235,226,196,0.75)';
      c.beginPath();
      c.ellipse(rnd() * W, cy, 60 + rnd() * 80, 9 + rnd() * 12, 0, 0, TAU);
      c.fill();
    }
    /* 溪水 + 小桥 */
    c.strokeStyle = 'rgba(110,140,160,0.7)';
    c.lineWidth = 6;
    c.beginPath();
    c.moveTo(W * 0.62, Hh * 0.55);
    c.bezierCurveTo(W * 0.55, Hh * 0.7, W * 0.68, Hh * 0.8, W * 0.6, Hh * 0.95);
    c.stroke();
    c.strokeStyle = '#4a3418';
    c.lineWidth = 4;
    c.beginPath();
    c.moveTo(W * 0.54, Hh * 0.8);
    c.quadraticCurveTo(W * 0.6, Hh * 0.76, W * 0.66, Hh * 0.8);
    c.stroke();
    /* 亭子点景 */
    c.fillStyle = '#3c2c1a';
    c.fillRect(W * 0.3 - 10, Hh * 0.66, 20, 10);
    c.beginPath();
    c.moveTo(W * 0.3 - 16, Hh * 0.66);
    c.quadraticCurveTo(W * 0.3, Hh * 0.6, W * 0.3 + 16, Hh * 0.66);
    c.closePath();
    c.fill();
    /* 题字与印 */
    c.fillStyle = 'rgba(60,44,26,0.85)';
    c.font = '500 17px "PingFang SC", sans-serif';
    c.save();
    c.translate(W - 44, 120);
    c.rotate(Math.PI / 2);
    c.fillText('江山万里一局中', 0, 0);
    c.restore();
    c.fillStyle = ATLAS_PAL.cinnabar;
    c.fillRect(W - 52, 70, 26, 26);
  });
}

/* 接触阴影贴片：径向渐变黑，道具底部落影（无 shadowmap 的柔和替代） */
function makeContactShadow(radius = 1, alpha = 0.42) {
  const S = 128;
  const cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const c = cv.getContext('2d');
  const g = c.createRadialGradient(S / 2, S / 2, S * 0.08, S / 2, S / 2, S / 2);
  g.addColorStop(0, `rgba(8,6,4,${alpha})`);
  g.addColorStop(0.55, `rgba(8,6,4,${alpha * 0.5})`);
  g.addColorStop(1, 'rgba(8,6,4,0)');
  c.fillStyle = g;
  c.fillRect(0, 0, S, S);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(radius * 2, radius * 2),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }),
  );
  m.rotation.x = -Math.PI / 2;
  m.renderOrder = 2;
  return m;
}

/* 绢底噪点小纹理（灯笼面/灯罩等通用） */
function makeSilkTexture(tone = '#e8dcb8', seed = 9) {
  return canvasTex(256, 256, (c, S) => {
    c.fillStyle = tone;
    c.fillRect(0, 0, S, S);
    const rnd = seededRand(seed);
    for (let i = 0; i < 700; i++) {
      c.fillStyle = rnd() > 0.5 ? 'rgba(150,128,80,0.07)' : 'rgba(255,250,230,0.06)';
      c.fillRect(rnd() * S, rnd() * S, 2, 1.5);
    }
    for (let y = 0; y < S; y += 8) {
      c.fillStyle = 'rgba(150,120,70,0.05)';
      c.fillRect(0, y, S, 1);
    }
  }, { repeat: true });
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
    note: '秦扫平群雄，首创以郡县制为骨架的大一统王朝，多族群共尊一主的集权体制由此定型。北面筑起长城，南面开凿灵渠，另置桂林、南海、象郡三郡。',
  },
  {
    name: '西汉疆域', short: '西汉', year: '公元前 60 年', area: 609,
    caps: [['长安', 108.7, 34.3]],
    marks: [[82.8, 41.5, '西域都护府']],
    polys: [{ n: '西汉', st: 0, pts: [[73, 39.8], [82, 41.5], [92, 42], [102, 41.5], [110, 42], [118, 42.5], [124, 41], [126.5, 39.5], [124, 38.5], [122, 37], [122, 34], [121, 31], [121.5, 28], [118, 24.5], [114, 22.3], [110, 21], [106, 18.5], [108, 21], [111, 22], [114, 23.5], [118, 25.5], [121, 28.5], [122, 32], [121, 35], [122, 38], [121, 40], [117, 41], [112, 41.8], [106, 41], [100, 40], [95, 39], [88, 38.5], [80, 38], [74, 38.5]] }],
    note: '张骞凿空西域之后，朝廷于前 60 年设置西域都护府，天山南北自此列入版图、归朝廷直接管辖。东面国境推进到朝鲜半岛北端，南面直抵越南中部一带。',
  },
  {
    name: '东汉疆域', short: '东汉', year: '公元 100 年', area: 580,
    caps: [['洛阳', 112.5, 34.6]],
    marks: [[82.8, 41.5, '西域都护府']],
    polys: [{ n: '东汉', st: 0, pts: [[85, 40], [92, 42], [102, 41.5], [110, 42], [118, 42.5], [124, 41], [126.5, 39.5], [124, 38.5], [122, 37], [122, 34], [121, 31], [121.5, 28], [118, 24.5], [114, 22.3], [110, 21], [106, 18.5], [108, 21], [111, 22], [114, 23.5], [118, 25.5], [121, 28.5], [122, 32], [121, 35], [122, 38], [121, 40], [117, 41], [112, 41.8], [106, 41], [100, 40], [95, 39], [88, 38.5], [85, 39]] }],
    note: '东汉基本沿袭前朝版图，西域经班超苦心经营重新畅通。末年黄巾起事之后全局崩解，群雄各据一方，给三分之势埋下引线。',
  },
  {
    name: '三国鼎立', short: '三国', year: '公元 229 年', area: 543, battles: [['⚔ 赤壁之战沙盘', 'chibi', 113.6, 29.9]],
    caps: [['洛阳', 112.5, 34.6], ['成都', 104, 30.6], ['建业', 118.8, 32]],
    polys: [
      { n: '魏', st: 0, pts: [[122, 40.5], [117, 41.5], [112, 41.5], [106, 41], [102, 40], [100, 38], [100, 34], [103, 32.5], [106, 32], [110, 32.8], [114, 33.5], [118, 34], [121, 32], [122, 34], [121, 37], [122, 40]] },
      { n: '蜀', st: 2, pts: [[103, 32.5], [106, 32], [110, 32.5], [112, 30], [110, 27], [106, 25.5], [102, 24.5], [100, 26], [101, 29], [102, 31]] },
      { n: '吴', st: 1, pts: [[110, 30.8], [114, 31], [118, 31.5], [121.5, 30], [121, 26.5], [118, 24.5], [113, 22.3], [108, 21], [106, 20], [105, 22], [108, 24], [108, 26], [108, 28.5], [109, 30]] },
    ],
    note: '曹丕的魏、刘备的蜀汉、孙权的吴三家分治。建安十三年（208 年）火烧赤壁一役过后，三方并立的形势再未逆转。',
  },
  {
    name: '西晋统一', short: '西晋', year: '公元 280 年', area: 543,
    caps: [['洛阳', 112.5, 34.6]],
    polys: [{ n: '西晋', st: 0, pts: [[74, 39], [85, 41], [95, 42], [105, 41.5], [112, 42], [118, 42.5], [124, 41], [126.5, 39.5], [123, 37], [122, 34], [121, 31], [121.5, 28], [118, 24.5], [113, 22.3], [107, 19.5], [103, 22.5], [106, 24.5], [110, 24], [114, 23.8], [118, 25.5], [121, 28.5], [122, 32], [121, 36], [122, 38.5], [120, 40], [115, 41.5], [108, 41], [100, 40], [94, 38.5], [86, 38], [78, 38]] }],
    note: '三家归晋，南北复归一统（280 年平吴）。但诸王拥兵内讧耗尽元气，随后胡马南下、衣冠仓皇渡江，大一统再度瓦解。',
  },
  {
    name: '东晋与十六国', short: '东晋', year: '公元 383 年', area: 620, battles: [['⚔ 淝水之战沙盘', 'feishui', 32.2, 31.6]],
    caps: [['建康', 118.8, 32], ['长安', 108.7, 34.3]],
    polys: [
      { n: '前秦', st: 1, pts: [[75, 38.5], [85, 41], [95, 42], [105, 41], [112, 41.5], [118, 41.5], [124, 40.5], [122, 37], [120, 35.5], [118, 34], [114, 33], [110, 32.8], [106, 32], [103, 32.8], [100, 34], [97, 36], [94, 37], [88, 37], [80, 37.5], [75, 38]] },
      { n: '东晋', st: 0, pts: [[122, 32.5], [118, 32.2], [113, 32.8], [110, 33], [106, 32], [103, 32.5], [101, 30], [103, 28], [106, 26], [110, 24.5], [113, 22.3], [118, 24.5], [121, 27], [121.5, 30.5], [122, 32]] },
    ],
    note: '北方匈奴、鲜卑、羯、氐、羌各部先后立国，交织成十六国；晋室南渡建康，史称东晋。383 年淝水一役挡住了前秦南下的兵锋。',
  },
  {
    name: '南北朝对峙', short: '南北朝', year: '公元 490 年', area: 480,
    caps: [['建康', 118.8, 32], ['洛阳', 112.5, 34.6]],
    polys: [
      { n: '北魏', st: 1, pts: [[122, 41], [118, 42], [112, 42], [105, 41.5], [100, 41], [97, 42], [100, 43], [105, 44], [110, 44.5], [116, 43], [122, 42.5], [126, 41], [124, 39], [122, 37.5], [120, 35.5], [118, 34.5], [114, 33.5], [110, 33], [106, 32.5], [103, 33], [100, 34.5], [103, 36], [106, 38], [110, 38.5], [114, 37], [118, 36], [121, 36.5], [122, 39]] },
      { n: '南朝', st: 0, pts: [[122, 32.5], [118, 32], [113, 32.5], [109, 32.5], [106, 31.5], [105, 29], [106, 26], [110, 24.5], [113, 22.3], [118, 24.5], [121, 27], [121.5, 30.5], [122, 32]] },
    ],
    note: '北魏孝文帝把国都南移到洛阳，带头改汉姓、习汉礼；江左宋、齐、梁、陈四朝依次禅代。各族深度交融，为日后隋唐重新一统蓄足底蕴。',
  },
  {
    name: '隋朝疆域', short: '隋', year: '公元 612 年', area: 467,
    caps: [['大兴', 108.8, 34.3]],
    canals: true,
    polys: [{ n: '隋', st: 0, pts: [[122, 40.5], [117, 41], [112, 41], [107, 41], [102, 40.5], [97, 40], [93, 40], [94, 38], [97, 36.5], [96, 34], [100, 32], [103, 31], [105, 30], [107, 29], [108, 27], [105, 25], [102, 23.5], [104, 22], [107, 21.5], [110, 21], [113, 22.3], [117, 23.5], [120, 26], [121.5, 29], [121, 33], [122, 36], [121, 38.5]] }],
    note: '隋再度混一南北，开凿大运河贯通天下漕运，又创科举取士。炀帝三征辽东把国力拖垮，盛极一时的王朝二世而终。',
  },
  {
    name: '唐朝前期疆域', short: '唐', year: '公元 660 年', area: 1237,
    caps: [['长安', 108.7, 34.3]],
    marks: [[80, 41, '安西都护府'], [86, 44, '北庭都护府']],
    canals: true,
    polys: [{ n: '唐', st: 0, pts: [[74, 39], [80, 43], [88, 46], [96, 48], [104, 50], [112, 50.5], [120, 51], [127, 50], [131, 46], [127, 42], [124, 40], [122, 38], [121, 35], [122, 33], [121, 30], [120, 27], [117, 23.5], [113, 22.3], [108, 20], [104, 18.5], [102, 20], [104, 22.5], [100, 23.5], [98, 25.5], [99, 28], [96, 30.5], [90, 32], [85, 33], [80, 34], [76, 36], [74, 38]] }],
    note: '盛唐版图臻于极盛：安西、北庭两都护府经略西域，势力北抵漠北。吐蕃当时是独立政权，与唐和亲会盟、时战时和。',
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
    note: '安史之乱（755—763 年）后盛唐急转直下：河西陇右尽失于吐蕃，回鹘雄踞漠北，南诏坐大西南，节度使各霸一方。',
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
    note: '唐亡之后中原五朝走马灯般更替（梁唐晋汉周），南方与河东先后并起十国。周世宗励精图治，给北宋的统一铺好了路。',
  },
  {
    name: '北宋、辽、西夏并立', short: '北宋', year: '公元 1100 年', area: 846,
    caps: [['开封', 114.3, 34.8], ['上京', 118.5, 43.6], ['兴庆', 105.8, 38.5]],
    polys: [
      { n: '辽', st: 1, pts: [[126, 50], [132, 47], [134, 43], [130, 41], [126, 40], [122, 39.5], [119, 38], [116, 39.5], [112, 41], [108, 42], [104, 43], [100, 44], [96, 45], [94, 47], [98, 49], [104, 50], [112, 50], [120, 50]] },
      { n: '北宋', st: 0, pts: [[122, 36], [121, 34], [121.5, 31.5], [120, 28.5], [117, 24.5], [113, 22.3], [108, 21], [104, 22.5], [102, 24], [104, 26], [106, 28], [108, 29.5], [110, 31], [110, 32.8], [114, 33.5], [118, 34], [121, 35]] },
      { n: '西夏', st: 2, pts: [[98, 39.5], [103, 40.5], [107, 40.5], [108, 37.5], [105, 36], [101, 36], [98, 37.5]] },
    ],
    note: '北宋收中原、平南方，但北面有辽（契丹）、西北有西夏（党项）两个强邻。澶渊之盟后宋辽以兄弟之国相处，换来百年太平。',
  },
  {
    name: '南宋、金、西夏并立', short: '南宋', year: '公元 1200 年', area: 638,
    caps: [['临安', 120.2, 30.3], ['会宁', 126.5, 45.5], ['兴庆', 105.8, 38.5]],
    polys: [
      { n: '金', st: 1, pts: [[126, 50], [132, 47], [134, 43], [130, 41], [126, 40], [122, 39.5], [119, 37.5], [121, 35], [122, 33.5], [120, 32.8], [118, 33], [114, 33.2], [110, 33.5], [108, 33.8], [106, 34], [103, 34.5], [99, 35], [96, 37], [94, 39], [96, 41], [98, 42.5], [100, 44], [104, 45], [110, 46], [118, 47], [124, 49]] },
      { n: '南宋', st: 0, pts: [[122, 32], [121.5, 30], [120, 28], [117, 24.5], [113, 22.3], [108, 21], [104, 22.5], [102, 24], [104, 26], [106, 28], [108, 29.5], [110, 31], [110, 32.8], [114, 32.8], [118, 32.5], [121, 31.8]] },
      { n: '西夏', st: 2, pts: [[98, 39.5], [103, 40.5], [107, 40.5], [108, 37.5], [105, 36], [101, 36], [98, 37.5]] },
    ],
    note: '靖康之变（1127 年）北宋倾覆，宋室南迁临安偏安一隅。金据中原与东北，与南宋、西夏再度形成三足并立。',
  },
  {
    name: '元朝疆域', short: '元', year: '公元 1300 年', area: 1372,
    caps: [['大都', 116.4, 39.9]],
    marks: [[91, 30, '宣政院辖地']],
    polys: [{ n: '元', st: 0, pts: [[75, 42], [82, 46], [90, 50], [100, 53], [110, 54], [118, 53], [126, 54], [132, 52], [135, 48], [133, 44], [128, 42], [124, 40], [122, 38.5], [121, 35.5], [122, 33], [121, 30], [120, 27], [117, 23.5], [113, 22.3], [108, 20], [104, 18.5], [102, 20], [104, 22.5], [102, 24], [104, 26], [106, 28], [104, 30], [102, 32], [99, 33], [95, 34], [90, 34], [85, 35], [80, 37], [76, 39]] }],
    note: '元代版图空前辽阔，「北逾阴山，西极流沙，东尽辽左，南越海表」。吐蕃之地由宣政院直辖，行省制度影响直至今日。',
  },
  {
    name: '明朝疆域', short: '明', year: '公元 1420 年', area: 997,
    caps: [['北京', 116.4, 39.9]],
    marks: [[134.5, 52, '奴儿干都司'], [88, 30, '乌斯藏都司'], [93.5, 42.8, '哈密卫']],
    wall: [[98, 39.8], [102, 39.6], [106, 40], [110, 40.6], [113, 41.2], [117, 41.4], [121, 41.8], [124, 42.3]],
    polys: [{ n: '明', st: 0, pts: [[75, 38.5], [80, 40], [86, 40.5], [92, 40], [93, 42.5], [96, 41], [100, 41], [104, 41], [108, 41], [112, 41], [116, 41.2], [120, 41.5], [123, 43.5], [126, 46.5], [129, 49], [132, 51.5], [134, 53.5], [131, 52], [129, 48], [127, 45], [125, 42.5], [124, 41], [122, 39.5], [121, 37], [122, 35], [121, 32], [120, 28], [117, 23.5], [113, 22.3], [108, 21], [104, 22.5], [102, 24], [104, 26], [106, 28], [104, 30], [102, 33], [100, 35], [97, 37], [94, 38.5], [86, 38], [78, 37.5], [75, 37.5]] }],
    note: '明初设奴儿干都司经略东北、乌斯藏都司安抚西藏。漠北仍是鞑靼、瓦剌游牧之地，故倾力重筑长城（今日所见砖构明长城）以御之。',
  },
  {
    name: '清朝疆域', short: '清', year: '公元 1760 年', area: 1316,
    caps: [['北京', 116.4, 39.9]],
    marks: [[90, 29.5, '驻藏大臣'], [133, 49, '黑龙江将军']],
    polys: [
      { n: '清', st: 0, pts: [[73, 39.2], [78, 42], [84, 45], [90, 47.5], [96, 49.5], [102, 50.5], [108, 50], [114, 49.5], [119, 50.5], [123, 52], [127, 55], [131, 54], [134, 51], [132, 47], [129, 44], [127, 41.5], [124, 40], [121, 38.5], [122, 36.5], [121.5, 33], [121, 30.5], [120, 27.5], [117, 23.5], [113, 22.3], [108, 21], [104, 22.5], [102, 24], [104, 26], [106, 28], [104, 30.5], [102, 33], [100, 36], [97, 38], [94, 39.5], [88, 39], [82, 38.5], [76, 38]] },
      { n: '', st: 0, pts: [[121.6, 25.3], [122, 24.5], [121, 22.2], [120.2, 22.8], [120.4, 24.2], [120.8, 25.2]] },
    ],
    note: '清前中期（乾隆朝）最终奠定近代版图：平准噶尔、定回部，辖蒙古、西藏、台湾，面积超 1300 万平方公里。',
  },
];

/* ---------------- 多边形重采样与相邻期变形（保留既有语义） ---------------- */

function resample(pts, n = 72) {
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
function polyAt(period, t) {
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

/* 预重采样（世界坐标：整块被 3D 使用；画布坐标：overlay 使用） */
PERIODS.forEach((p) => p.polys.forEach((pp) => {
  pp.__rs = resample(pp.pts, 72);
  pp.__ws = pp.__rs.map(([x, y]) => {
    const wx = (x / MW - 0.5) * WORLD_W;
    const wz = (0.5 - y / MH) * WORLD_D;
    return [wx, wz];
  });
}));

/* ---------------- 3D 舞台与工艺接入 ---------------- */

const stage = document.getElementById('stage');
const loader = makeLoader(stage, '正在营造疆域沙盘…');

const app = createApp({
  container: stage,
  fov: 44, near: 0.2, far: 400,
  cameraPos: [0, 52, 62],
  target: [0, 1, 0],
  minDistance: 6, maxDistance: 160,
  exposure: 1.06,
  keepBackground: true,
});
const { scene, camera, controls } = app;
const vfx = attachVFX(app, 'illus');
scene.environment = makeStudioEnvironment(app.renderer);

/* 灯光组：主暖光（西北高位，与地貌坡向阴影同向）+ 冷补光 + 半球 + 低位 bounce */
const hemiLight = new THREE.HemisphereLight(0xa8bccb, 0x1a1410, 0.6);
scene.add(hemiLight);
const keyLight = new THREE.DirectionalLight(0xfff0d8, 1.28);
keyLight.position.set(-30, 46, 22);
scene.add(keyLight);
const fillLight = new THREE.DirectionalLight(0x9cb8d4, 0.32);
fillLight.position.set(34, 18, -20);
scene.add(fillLight);
const bounceLight = new THREE.DirectionalLight(0xd8c8a8, 0.14);
bounceLight.position.set(4, -14, 10);
scene.add(bounceLight);
/* 桌面烛光：两点光，强度由主循环随焰动闪烁 */
const candleLightA = new THREE.PointLight(0xffa856, 0, 30, 1.7);
const candleLightB = new THREE.PointLight(0xffa856, 0, 30, 1.7);
scene.add(candleLightA, candleLightB);
/* 火攻点光（赤壁期点亮） */
const fireLight = new THREE.PointLight(0xff7a30, 0, 24, 1.8);
scene.add(fireLight);

/* 沙盘组容器：地形 / 海面 / 疆域 / 水系 / 长城 / 都城 / 战役 / 道具 各一枝，便于整体调度 */
const G = {
  terrain: new THREE.Group(),
  ocean: new THREE.Group(),
  territory: new THREE.Group(),
  waters: new THREE.Group(),
  walls: new THREE.Group(),
  capitals: new THREE.Group(),
  battles: new THREE.Group(),
  props: new THREE.Group(),
};
Object.values(G).forEach((grp) => scene.add(grp));

/* ---------------- 地形网格（高程顶点位移 + 地貌贴图） ---------------- */

let terrainMesh = null;
let terrainTex = null;
let exagCur = H_EXAG;   /* 当前生效夸张系数（滑杆缓动跟随） */

function rebuildTerrain() {
  if (terrainMesh) {
    G.terrain.remove(terrainMesh);
    terrainMesh.geometry.dispose();
    terrainMesh = null;
  }
  const geo = new THREE.PlaneGeometry(WORLD_W, WORLD_D, 150, 88);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const wx = pos.getX(i), wz = pos.getZ(i);
    pos.setY(i, worldHeightAt(wx, wz) + 0.02);
  }
  geo.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({
    map: terrainTex,
    roughness: 0.94,
    metalness: 0,
  });
  terrainMesh = new THREE.Mesh(geo, mat);
  G.terrain.add(terrainMesh);
}

/* ---------------- 海面（自研波动 shader：双向正弦 + 泡沫带 + 光斑） ---------------- */

let oceanMesh = null;
function buildOcean(maps) {
  const geo = new THREE.PlaneGeometry(WORLD_W, WORLD_D, 1, 1);
  geo.rotateX(-Math.PI / 2);
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uMask: { value: maps.mask },
      uFoam: { value: maps.foam },
      uUvTf: { value: new THREE.Vector2(1, 1) },
    },
    vertexShader: /* glsl */`
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */`
      uniform sampler2D uMask;
      uniform sampler2D uFoam;
      uniform float uTime;
      varying vec2 vUv;
      void main() {
        float m = texture2D(uMask, vUv).r;
        if (m < 0.45) discard;
        float f = texture2D(uFoam, vUv).r;
        /* 两组不同频双向正弦叠加成涌动光带 */
        float w1 = sin(vUv.x * 210.0 + uTime * 1.25) * 0.5 + sin(vUv.y * 150.0 - uTime * 0.85) * 0.5;
        float w2 = sin((vUv.x + vUv.y * 0.6) * 290.0 + uTime * 2.0);
        float spark = pow(max(w1 * 0.5 + w2 * 0.5, 0.0), 3.0);
        vec3 deepC = vec3(0.085, 0.185, 0.27);
        vec3 shalC = vec3(0.20, 0.38, 0.48);
        vec3 col = mix(deepC, shalC, clamp(f * 0.9 + 0.10, 0.0, 1.0));
        col += spark * 0.18;
        /* 近岸泡沫：模糊描边带 × 呼吸脉动 */
        float band = smoothstep(0.30, 0.85, f);
        float breath = 0.55 + 0.45 * sin(uTime * 2.1 + vUv.x * 80.0 + vUv.y * 55.0);
        col = mix(col, vec3(0.84, 0.92, 0.90), clamp(band * breath, 0.0, 1.0) * 0.7);
        gl_FragColor = vec4(col, 0.93);
      }`,
  });
  oceanMesh = new THREE.Mesh(geo, mat);
  oceanMesh.position.y = 0.055;
  G.ocean.add(oceanMesh);
}

/* ---------------- 疆域渲染层：overlay 贴图（贴合地形） + 边界发光缎带 ---------------- */

/* overlay canvas（画布坐标 1440×900，与 px/py 一致） */
const terCanvas = document.createElement('canvas');
terCanvas.width = MW; terCanvas.height = MH;
const terCtx = terCanvas.getContext('2d');
const terTex = new THREE.CanvasTexture(terCanvas);
terTex.colorSpace = THREE.SRGBColorSpace;
terTex.anisotropy = 8;

let territoryMesh = null;
function buildTerritoryMesh() {
  /* 与地形同起伏的贴地平面（低段数贴合，法线不用） */
  const geo = new THREE.PlaneGeometry(WORLD_W, WORLD_D, 110, 64);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const wx = pos.getX(i), wz = pos.getZ(i);
    pos.setY(i, worldHeightAt(wx, wz) + 0.07);
  }
  const mat = new THREE.MeshBasicMaterial({
    map: terTex,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  mat.polygonOffset = true;
  mat.polygonOffsetFactor = -1;
  mat.polygonOffsetUnits = -1;
  territoryMesh = new THREE.Mesh(geo, mat);
  territoryMesh.renderOrder = 3;
  G.territory.add(territoryMesh);
}

/* 边界缎带：每条政区边界一个竖直发光带（顶点每帧按当前政区形状重写） */
const RIBBON_H = 0.5;
const ribbons = [];   /* { mesh, geo, n } */
function makeRibbon() {
  const n = 72;
  const geo = new THREE.BufferGeometry();
  const posArr = new Float32Array(n * 2 * 3);
  const colArr = new Float32Array(n * 2 * 3);
  const idx = [];
  for (let i = 0; i < n; i++) {
    const a = i * 2;
    idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  /* 闭合：末段回绕到起点（用 mod 在写入时处理，索引末两组改绕） */
  idx.length = (n - 1) * 6;
  geo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colArr, 3));
  geo.setIndex(idx);
  const mat = new THREE.MeshBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = 4;
  return { mesh, geo, n, mat };
}
for (let i = 0; i < 5; i++) {
  const r = makeRibbon();
  ribbons.push(r);
  G.territory.add(r.mesh);
}
function ribbonColorOf(lineCss) {
  const c = new THREE.Color(lineCss);
  return { base: c.clone().multiplyScalar(0.4), top: c.clone().lerp(new THREE.Color(0xffffff), 0.22) };
}

/* 把一个政区多边形（画布坐标）写入一条缎带顶点 */
function writeRibbon(r, P2, lineCss, strength = 1) {
  const pos = r.geo.attributes.position;
  const col = r.geo.attributes.color;
  const { base, top } = ribbonColorOf(lineCss);
  const n = r.n;
  for (let i = 0; i < n; i++) {
    const p = P2[i % P2.length];
    const wx = (p[0] / MW - 0.5) * WORLD_W;
    const wz = (0.5 - p[1] / MH) * WORLD_D;
    const gy = worldHeightAt(wx, wz) + 0.12;
    pos.setXYZ(i * 2, wx, gy, wz);
    pos.setXYZ(i * 2 + 1, wx, gy + RIBBON_H, wz);
    col.setXYZ(i * 2, base.r, base.g, base.b);
    col.setXYZ(i * 2 + 1, top.r * strength, top.g * strength, top.b * strength);
  }
  pos.needsUpdate = true;
  col.needsUpdate = true;
  r.geo.computeBoundingSphere();
  r.mesh.visible = true;
}

/* 疆域总刷新：重画 overlay + 全部缎带（time 变化时调用） */
let lastDrawTime = -1;
function refreshTerritory(time, breathe = 1) {
  if (Math.abs(time - lastDrawTime) < 1e-4 && breathe === 1) return;
  lastDrawTime = time;
  const vw = MW;
  const period = Math.floor(time);
  const frac = time - period;
  const isLast = period >= PERIODS.length - 1;
  const polys = isLast ? styled(PERIODS[period]) : polyAt(period, frac);
  terCtx.clearRect(0, 0, vw, MH);
  /* 填充 + 细描边 + 政权名（贴地） */
  terCtx.lineJoin = 'round';
  for (const poly of polys) {
    if (poly.P2.length < 3) continue;
    terCtx.beginPath();
    poly.P2.forEach(([x, y], i) => (i ? terCtx.lineTo(x, y) : terCtx.moveTo(x, y)));
    terCtx.closePath();
    terCtx.fillStyle = poly.fill;
    terCtx.fill();
    terCtx.strokeStyle = poly.line;
    terCtx.lineWidth = 2.6;
    terCtx.stroke();
  }
  if (state.showNames) {
    terCtx.font = '700 21px -apple-system,"PingFang SC",sans-serif';
    terCtx.textAlign = 'center';
    for (const poly of polys) {
      if (!poly.label) continue;
      const [cx2, cy2] = centroid(poly.P2);
      terCtx.fillStyle = 'rgba(255,255,255,0.96)';
      terCtx.shadowColor = 'rgba(0,0,0,0.9)';
      terCtx.shadowBlur = 6;
      terCtx.fillText(poly.label, cx2, cy2);
      terCtx.shadowBlur = 0;
    }
  }
  terTex.needsUpdate = true;
  /* 实算读数浮窗（面积/边界/政权数随推演滚动） */
  if (propsRefs.statWin) {
    let wA = 0, wL = 0, np2 = 0;
    for (const poly of polys) {
      if (poly.P2.length < 3) continue;
      wA += polyArea(poly.P2);
      wL += polyPerimeter(poly.P2);
      if (poly.label) np2++;
    }
    const worldA = wA / (MW * MH) * (WORLD_W * WORLD_D);
    const km2 = worldA * (statCalibK || 0);
    propsRefs.statWin.set(
      statCalibK ? km2.toFixed(0) + ' 万 km²' : '—',
      PERIODS[Math.min(period, PERIODS.length - 1)].area + ' 万 km²',
      (wL * WORLD_W / MW).toFixed(1) + ' 长度单位',
      np2 + ' 政权',
    );
  }
  /* 缎带写入（最多 5 条，多出的政区共享 5 条循环使用） */
  for (let i = 0; i < ribbons.length; i++) {
    const poly = polys[i];
    if (poly && poly.P2.length >= 3) {
      const pulse = 0.82 + 0.18 * Math.sin(state.clock * 2.4 + i * 1.7);
      writeRibbon(ribbons[i], poly.P2, poly.line, pulse * breathe);
    } else {
      ribbons[i].mesh.visible = false;
    }
  }
}

/* ---------------- 河流与运河（贴河床 TubeGeometry 管流） ---------------- */

function riverCurveOf(lonlat, lift = 0.055) {
  const pts = [];
  for (let i = 0; i < lonlat.length - 1; i++) {
    const a = lonlat[i], b = lonlat[i + 1];
    for (let k = 0; k < 5; k++) {
      const t = k / 5;
      const lo = a[0] + (b[0] - a[0]) * t + Math.sin(t * Math.PI) * (b[1] - a[1]) * 0.06;
      const la = a[1] + (b[1] - a[1]) * t;
      pts.push(new THREE.Vector3(
        (lo - (LON0 + LON1) / 2) * WSC,
        hAt(px(lo), py(la)) * H_EXAG + lift,
        ((LAT0 + LAT1) / 2 - la) * WSC * 0.92,
      ));
    }
  }
  const last = lonlat[lonlat.length - 1];
  pts.push(new THREE.Vector3(
    (last[0] - (LON0 + LON1) / 2) * WSC,
    hAt(px(last[0]), py(last[1])) * H_EXAG + lift,
    ((LAT0 + LAT1) / 2 - last[1]) * WSC * 0.92,
  ));
  return new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.4);
}
function buildRivers() {
  const mat = new THREE.MeshStandardMaterial({
    color: ATLAS_PAL.river,
    roughness: 0.22,
    metalness: 0.05,
    transparent: true,
    opacity: 0.9,
    emissive: new THREE.Color(ATLAS_PAL.river),
    emissiveIntensity: 0.28,
  });
  for (const rv of RIVERS) {
    const curve = riverCurveOf(rv);
    const geo = new THREE.TubeGeometry(curve, 150, 0.14, 7, false);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.renderOrder = 3;
    G.waters.add(mesh);
  }
}
/* 运河两段：隋唐期起浮现（紫金微光 + 呼吸） */
let canalMeshes = [];
function buildCanals() {
  const mat = new THREE.MeshStandardMaterial({
    color: ATLAS_PAL.canalGlow,
    roughness: 0.3,
    metalness: 0.05,
    transparent: true,
    opacity: 0.0,
    emissive: new THREE.Color(ATLAS_PAL.canalGlow),
    emissiveIntensity: 0.0,
  });
  canalMeshes = CANALS.map((cv2) => {
    const curve = riverCurveOf(cv2, 0.075);
    const geo = new THREE.TubeGeometry(curve, 120, 0.11, 7, false);
    const mesh = new THREE.Mesh(geo, mat.clone());
    mesh.visible = false;
    mesh.renderOrder = 3;
    G.waters.add(mesh);
    return mesh;
  });
}
function setCanalsVisible(vis, dt) {
  for (const m of canalMeshes) {
    m.visible = m.material.opacity > 0.02 || vis;
    const target = vis ? 0.85 : 0;
    m.material.opacity = dampTo(m.material.opacity, target, dt, 4);
    m.material.emissiveIntensity = dampTo(m.material.emissiveIntensity, vis ? 0.5 : 0, dt, 4);
  }
}

/* ---------------- 长城：贴山脊放样墙体 + 垛口 + 烽火台 ---------------- */

const WALL_STYLES = {
  qin: { body: 0x9a8462, taper: 0.72 },
  ming: { body: 0xb09468, taper: 0.9 },
};
function buildWallSegment(lonlat, styleKey) {
  const style = WALL_STYLES[styleKey];
  /* 密集采样点（含 fbm 摆动），逐点贴地 */
  const pts = [];
  for (let i = 0; i < lonlat.length - 1; i++) {
    const a = lonlat[i], b = lonlat[i + 1];
    for (let k = 0; k < 14; k++) {
      const t = k / 14;
      const wob = Math.sin(t * Math.PI) * (hash2(i, k, 5) - 0.5) * 0.55;
      const lo = a[0] + (b[0] - a[0]) * t;
      const la = a[1] + (b[1] - a[1]) * t + wob;
      pts.push(new THREE.Vector3(
        (lo - (LON0 + LON1) / 2) * WSC,
        hAt(px(lo), py(la)) * H_EXAG,
        ((LAT0 + LAT1) / 2 - la) * WSC * 0.92,
      ));
    }
  }
  const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.5);
  const N = 150;
  const sp = curve.getSpacedPoints(N);
  /* 墙体：扫掠梯形截面（底宽顶窄），砖纹贴图 uv 沿长度重复 */
  const W_BOT = 1.05 * style.taper + 0.35, H_WALL = 0.52;
  const positions = [];
  const uvs = [];
  const indices = [];
  const up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i <= N; i++) {
    const p = sp[i];
    const p2 = sp[Math.min(i + 1, N)];
    const tan = new THREE.Vector3().subVectors(p2, p).normalize();
    const side = new THREE.Vector3().crossVectors(tan, up).normalize();
    const yBase = p.y + 0.10;
    const yTop = yBase + H_WALL;
    const quad = [
      [p.x - side.x * W_BOT / 2, yBase, p.z - side.z * W_BOT / 2],
      [p.x + side.x * W_BOT / 2, yBase, p.z + side.z * W_BOT / 2],
      [p.x + side.x * W_BOT * 0.32, yTop, p.z + side.z * W_BOT * 0.32],
      [p.x - side.x * W_BOT * 0.32, yTop, p.z - side.z * W_BOT * 0.32],
    ];
    for (let q = 0; q < 4; q++) {
      positions.push(quad[q][0], quad[q][1], quad[q][2]);
      uvs.push(i / N * 9, q === 0 || q === 3 ? 0 : 1);
    }
    if (i > 0) {
      const o = (i - 1) * 4;
      indices.push(o, o + 4, o + 1, o + 1, o + 4, o + 5);
      indices.push(o + 1, o + 5, o + 2, o + 2, o + 5, o + 6);
      indices.push(o + 2, o + 6, o + 3, o + 3, o + 6, o + 7);
      indices.push(o + 3, o + 7, o, o, o + 7, o + 4);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  const tex = makeBrickTexture(styleKey === 'qin' ? 41 : 63);
  tex.repeat.set(2, 1);
  const mat = new THREE.MeshStandardMaterial({
    map: tex,
    roughness: 0.9,
    metalness: 0.02,
    transparent: true,
    opacity: 1,
  });
  const wall = new THREE.Mesh(geo, mat);
  G.walls.add(wall);
  /* 垛口：顶面外沿小凸字垛，InstancedMesh 一笔 */
  const merGeo = new THREE.BoxGeometry(0.16, 0.16, 0.30);
  const merMat = new THREE.MeshStandardMaterial({ color: style.body, roughness: 0.92, transparent: true, opacity: 1 });
  const merlon = new THREE.InstancedMesh(merGeo, merMat, N + 1);
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  for (let i = 0; i <= N; i++) {
    const p = sp[i];
    const p2 = sp[Math.min(i + 1, N)];
    const tan = new THREE.Vector3().subVectors(p2, p).normalize();
    const side = new THREE.Vector3().crossVectors(tan, up).normalize();
    /* 朝北一侧（side 与北向点积为负时翻转） */
    const north = new THREE.Vector3(0, 0, -1);
    const s = side.dot(north) < 0 ? 1 : -1;
    const yTop = p.y + 0.10 + H_WALL;
    m4.compose(
      new THREE.Vector3(p.x + side.x * s * W_BOT * 0.16, yTop + 0.08, p.z + side.z * s * W_BOT * 0.16),
      q.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tan.clone().multiplyScalar(s)),
      new THREE.Vector3(1, 1, 1),
    );
    merlon.setMatrixAt(i, m4);
  }
  merlon.instanceMatrix.needsUpdate = true;
  G.walls.add(merlon);
  /* 烽火台：每 34 步一座；静态件（基座/楼身/顶盖/火盆）全段合并烘焙压 draw call */
  const beaconMats = {
    body: new THREE.MeshStandardMaterial({ color: 0xa8906a, roughness: 0.88, transparent: true, opacity: 1 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x6e5a3e, roughness: 0.9, transparent: true, opacity: 1 }),
    fire: matGlow(ATLAS_PAL.lanternGlow, 1.6, { opacity: 1 }),
  };
  const darkParts = [], bodyParts = [], fireParts = [];
  const beacons = [];
  for (let i = 20; i < N; i += 34) {
    const p = sp[i];
    const bx = p.x, by = p.y + 0.08, bz = p.z;
    darkParts.push(
      partOf(new THREE.CylinderGeometry(1.15, 1.5, 0.5, 8), bx, by + 0.25, bz),
      partOf(new THREE.BoxGeometry(1.55, 0.16, 1.55), bx, by + 1.5, bz),
      partOf(new THREE.CylinderGeometry(0.42, 0.28, 0.24, 10), bx, by + 1.72, bz),
    );
    bodyParts.push(partOf(new THREE.BoxGeometry(1.3, 0.95, 1.3), bx, by + 0.95, bz));
    /* 瞭望兵俑一对（垛口内侧） */
    bodyParts.push(
      partOf(new THREE.BoxGeometry(0.14, 0.34, 0.1), bx - 0.3, by + 1.72, bz + 0.2),
      partOf(new THREE.SphereGeometry(0.075, 8, 6), bx - 0.3, by + 1.95, bz + 0.2),
      partOf(new THREE.BoxGeometry(0.14, 0.34, 0.1), bx + 0.3, by + 1.72, bz - 0.2),
      partOf(new THREE.SphereGeometry(0.075, 8, 6), bx + 0.3, by + 1.95, bz - 0.2),
    );
    fireParts.push(partOf(new THREE.SphereGeometry(0.17, 10, 8), bx, by + 1.9, bz));
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: makeGlowTexture('255,154,74'),
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    }));
    glow.scale.set(1.6, 1.6, 1);
    glow.position.set(bx, by + 1.92, bz);
    G.walls.add(glow);
    const light = new THREE.PointLight(0xff9a4a, 0.5, 7, 1.8);
    light.position.set(bx, by + 1.9, bz);
    G.walls.add(light);
    beacons.push({ glow, light, phase: hash2(i, 7, 3) * TAU });
  }
  const darkMesh = mergePartsToMesh(darkParts, beaconMats.dark);
  const bodyMesh = mergePartsToMesh(bodyParts, beaconMats.body);
  const fireMesh = mergePartsToMesh(fireParts, beaconMats.fire);
  G.walls.add(darkMesh, bodyMesh, fireMesh);
  return {
    wall, merlon, merMat, beacons,
    statics: [darkMesh, bodyMesh, fireMesh],
    mats: [mat, merMat, beaconMats.body, beaconMats.dark, beaconMats.fire],
  };
}

let wallQin = null, wallMing = null;
function buildWalls() {
  wallQin = buildWallSegment(PERIODS[0].wall, 'qin');
  wallMing = buildWallSegment(PERIODS[14].wall, 'ming');
}
/* 按期显隐：秦段随期 0..2（秦汉），明段随期 13（明）；淡入淡出 */
function setWallsForPeriod(period, dt) {
  const targets = [
    [wallQin, period <= 2 ? 1 : 0],
    [wallMing, period === 14 ? 1 : 0],
  ];
  for (const [seg, want] of targets) {
    if (!seg) continue;
    const op = dampTo(seg.wall.material.opacity, want, dt, 5);
    seg.wall.material.opacity = op;
    seg.merMat.opacity = op;
    seg.mats[2].opacity = op;
    seg.mats[3].opacity = op;
    const on = op > 0.05;
    seg.wall.visible = on;
    seg.merlon.visible = on;
    for (const st of seg.statics) st.visible = on;
    const fireFlick = 1.0 + 0.35 * Math.abs(Math.sin(state.clock * 5.2));
    seg.mats[4].emissiveIntensity = fireFlick;
    for (const b of seg.beacons) {
      const flick = 0.4 + 0.6 * Math.abs(Math.sin(state.clock * 5 + b.phase));
      b.glow.material.opacity = (0.45 + flick * 0.4) * op;
      b.light.intensity = (0.3 + flick * 0.5) * op;
    }
  }
}

/* ---------------- 都城城楼（分层建模：台基/拱门/平坐/柱廊/斗拱/翘檐/旗/灯笼） ---------------- */

/* 门钉板贴图：朱漆底 + 五路门钉 + 铺首 */
function makeDoorTexture() {
  return canvasTex(256, 320, (c, W, Hh) => {
    c.fillStyle = ATLAS_PAL.lacquerDeep;
    c.fillRect(0, 0, W, Hh);
    const rnd = seededRand(13);
    for (let i = 0; i < 200; i++) {
      c.fillStyle = `rgba(0,0,0,${0.05 + rnd() * 0.08})`;
      c.fillRect(rnd() * W, rnd() * Hh, 3 + rnd() * 6, 2 + rnd() * 3);
    }
    for (let r = 0; r < 7; r++) {
      for (let col = 0; col < 5; col++) {
        const x = 32 + col * 48, y = 34 + r * 42;
        c.fillStyle = '#caa24a';
        c.beginPath(); c.arc(x, y, 6.5, 0, TAU); c.fill();
        c.fillStyle = 'rgba(255,230,160,0.7)';
        c.beginPath(); c.arc(x - 1.6, y - 1.8, 2.2, 0, TAU); c.fill();
      }
    }
    /* 铺首一对 */
    c.fillStyle = '#b8934e';
    for (const x of [46, W - 46]) {
      c.beginPath(); c.arc(x, Hh - 52, 15, 0, TAU); c.fill();
      c.fillStyle = '#6e5320';
      c.beginPath(); c.arc(x, Hh - 50, 6, 0, TAU); c.fill();
      c.fillStyle = '#b8934e';
    }
    c.strokeStyle = 'rgba(0,0,0,0.5)';
    c.lineWidth = 4;
    c.strokeRect(4, 4, W - 8, Hh - 8);
  });
}

/* 窗棂格贴图（横竖棂交格，比直棂更精致） */
function makeLatticeGridTexture() {
  return canvasTex(256, 256, (c, S) => {
    c.fillStyle = '#231a12';
    c.fillRect(0, 0, S, S);
    c.strokeStyle = ATLAS_PAL.lacquer;
    c.lineWidth = 7;
    for (let i = 0; i <= 4; i++) {
      const p = 18 + i * (S - 36) / 4;
      c.beginPath(); c.moveTo(p, 10); c.lineTo(p, S - 10); c.stroke();
      c.beginPath(); c.moveTo(10, p); c.lineTo(S - 10, p); c.stroke();
    }
    /* 菱格芯 */
    c.lineWidth = 3;
    c.strokeStyle = 'rgba(190,120,60,0.8)';
    for (let x = 0; x < 4; x++) {
      for (let y = 0; y < 4; y++) {
        const cx = 18 + (x + 0.5) * (S - 36) / 4, cy = 18 + (y + 0.5) * (S - 36) / 4;
        const r = (S - 36) / 4 * 0.36;
        c.beginPath();
        c.moveTo(cx, cy - r); c.lineTo(cx + r, cy); c.lineTo(cx, cy + r); c.lineTo(cx - r, cy);
        c.closePath();
        c.stroke();
      }
    }
    c.strokeStyle = ATLAS_PAL.lacquerDeep;
    c.lineWidth = 10;
    c.strokeRect(5, 5, S - 10, S - 10);
    /* 透光暖色 */
    c.fillStyle = 'rgba(255,214,150,0.1)';
    c.fillRect(20, 20, S - 40, S - 40);
  });
}

/**
 * 城楼（教学示意形制，部件全为程序化几何 + 贴图）。
 * 结构自下而上：条砖台基 → 拱门钉板 → 平坐栏杆 → 一层柱廊墙身 → 腰檐
 *   → 二层柱廊墙身 → 大顶（四坡翘檐 + 正脊吻兽）→ 斗拱横枋 → 旗杆朝旗 → 一对灯笼。
 * @param {string} short 朝代短名（旗字）
 * @param {object} o { scale, accent } 尺寸与旗色
 * @returns {THREE.Group} 原点在台基底部中心
 */
function makeGateTower(short, o = {}) {
  const grp = new THREE.Group();
  const S = o.scale ?? 1;
  const brickTex = makeBrickTexture(71);
  brickTex.repeat.set(2.4, 1.2);
  const matBrick = new THREE.MeshStandardMaterial({ map: brickTex, roughness: 0.92, metalness: 0.02 });
  const matLacquer = matCoat(ATLAS_PAL.lacquer, { roughness: 0.4, clearcoat: 0.7 });
  const matLacquerDeep = matStd(ATLAS_PAL.lacquerDeep, { roughness: 0.62 });
  const roofTex = makeRoofTexture();
  roofTex.repeat.set(3, 1);
  const matRoof = new THREE.MeshStandardMaterial({ map: roofTex, roughness: 0.5, metalness: 0.12 });
  const matBrass = matStd(PAL.brass, { roughness: 0.34, metalness: 0.85 });
  const matWood = matStd(ATLAS_PAL.wood, { roughness: 0.7 });
  const doorTex = makeDoorTexture();
  const latTex = makeLatticeGridTexture();

  /* 台基（方锥台，rotY 45° 让面朝正向） */
  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.02, 1.24, 0.72, 4, 1), matBrick);
  base.rotation.y = Math.PI / 4;
  base.position.y = 0.36;
  grp.add(base);
  buildBaseFrieze(grp);
  /* 台基收沿 */
  const rim = new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.09, 1.62), matWood);
  rim.position.y = 0.75;
  grp.add(rim);
  /* 马面墩台（两侧凸出方墩 + 顶沿盖板） */
  for (const sx of [-1, 1]) {
    const mamian = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.5, 0.3), matBrick);
    mamian.position.set(sx * 1.12, 0.3, 0);
    mamian.rotation.y = Math.PI / 4;
    grp.add(mamian);
    const mamianTop = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.08, 0.36), matWood);
    mamianTop.position.set(sx * 1.12, 0.58, 0);
    grp.add(mamianTop);
  }
  /* 女儿墙：台基顶四边矮墙（垛口语境） */
  for (const [wx, wz, ww, wd] of [[0, 0.78, 1.4, 0.07], [0, -0.78, 1.4, 0.07], [0.78, 0, 0.07, 1.4], [-0.78, 0, 0.07, 1.4]]) {
    const parapet = new THREE.Mesh(new THREE.BoxGeometry(ww, 0.12, wd), matBrick);
    parapet.position.set(wx, 0.82, wz);
    grp.add(parapet);
  }
  /* 护城壕环带（贴地半透明水色） */
  const moat = new THREE.Mesh(new THREE.RingGeometry(1.7, 2.05, 40), new THREE.MeshStandardMaterial({
    color: ATLAS_PAL.river, transparent: true, opacity: 0.32, roughness: 0.25, depthWrite: false,
  }));
  moat.rotation.x = -Math.PI / 2;
  moat.position.y = 0.025;
  moat.renderOrder = 2;
  grp.add(moat);

  /* 拱门 + 门钉板（朝 +Z 南面） */
  const door = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.56), new THREE.MeshStandardMaterial({
    map: doorTex, roughness: 0.55, metalness: 0.05,
  }));
  door.position.set(0, 0.40, 0.745);
  grp.add(door);
  /* 城门匾额（拱门上方，刻城名） */
  if (o.capName) {
    const plaque = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.15), new THREE.MeshStandardMaterial({
      map: makeLabelTexture([o.capName], { w: 128, h: 46, accent: '#3a5a7a' }), roughness: 0.65,
    }));
    plaque.position.set(0, 0.66, 0.752);
    grp.add(plaque);
  }
  const arch = new THREE.Mesh(new THREE.TorusGeometry(0.23, 0.045, 8, 20, Math.PI), matBrass);
  arch.position.set(0, 0.545, 0.752);
  grp.add(arch);
  const darkIn = new THREE.Mesh(new THREE.CircleGeometry(0.2, 20), new THREE.MeshBasicMaterial({ color: 0x0e0a06 }));
  darkIn.position.set(0, 0.545, 0.748);
  grp.add(darkIn);

  /* 平坐栏杆：矮栏板 + 望柱（instanced） */
  const balusGeo = new THREE.BoxGeometry(0.05, 0.16, 0.05);
  const balus = new THREE.InstancedMesh(balusGeo, matLacquerDeep, 20);
  {
    let bi = 0;
    const m4 = new THREE.Matrix4();
    for (let side = 0; side < 4; side++) {
      for (let k = 0; k < 5; k++) {
        const t = (k - 2) / 2 * 0.62;
        const x = side === 0 ? t : side === 1 ? 0.62 : side === 2 ? -t : -0.62;
        const z = side === 0 ? 0.62 : side === 1 ? -t : side === 2 ? -0.62 : t;
        m4.makeTranslation(x, 0.88, z);
        balus.setMatrixAt(bi++, m4);
      }
    }
    balus.instanceMatrix.needsUpdate = true;
  }
  grp.add(balus);
  const railRing = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.045, 1.36), matLacquerDeep);
  railRing.position.y = 0.945;
  grp.add(railRing);

  /* 一层：柱廊 8 柱 + 墙身四面 + 窗棂两向 */
  const colGeo = new THREE.CylinderGeometry(0.045, 0.052, 0.62, 8);
  const cols1 = new THREE.InstancedMesh(colGeo, matLacquer, 8);
  {
    const m4 = new THREE.Matrix4();
    const corners = [[0.6, 0.6], [0.6, -0.6], [-0.6, 0.6], [-0.6, -0.6], [0.62, 0], [0, 0.62], [-0.62, 0], [0, -0.62]];
    corners.forEach(([x, z], i) => {
      m4.makeTranslation(x, 1.3, z);
      cols1.setMatrixAt(i, m4);
    });
    cols1.instanceMatrix.needsUpdate = true;
  }
  grp.add(cols1);
  const hall1 = new THREE.Mesh(new THREE.BoxGeometry(1.28, 0.58, 1.28), matLacquerDeep);
  hall1.position.y = 1.3;
  grp.add(hall1);
  const win1 = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.4), new THREE.MeshStandardMaterial({ map: latTex, roughness: 0.6 }));
  win1.position.set(0, 1.32, 0.648);
  grp.add(win1);
  const win1b = win1.clone();
  win1b.rotation.y = Math.PI;
  win1b.position.z = -0.648;
  grp.add(win1b);

  /* 腰檐（四坡小顶 + 正脊） */
  const eave1 = new THREE.Mesh(new THREE.ConeGeometry(1.12, 0.34, 4), matRoof);
  eave1.rotation.y = Math.PI / 4;
  eave1.position.y = 1.78;
  grp.add(eave1);

  /* 二层：柱廊 + 墙身 + 窗 */
  const cols2 = cols1.clone();
  cols2.position.y = 0.78;
  grp.add(cols2);
  const hall2 = new THREE.Mesh(new THREE.BoxGeometry(1.06, 0.52, 1.06), matLacquerDeep);
  hall2.position.y = 2.08;
  grp.add(hall2);
  const win2 = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 0.34), new THREE.MeshStandardMaterial({ map: latTex, roughness: 0.6 }));
  win2.position.set(0, 2.1, 0.538);
  grp.add(win2);
  const win2b = win2.clone();
  win2b.rotation.y = Math.PI;
  win2b.position.z = -0.538;
  grp.add(win2b);

  /* 大顶：四坡翘檐 + 正脊 + 吻兽 + 檐角饰 */
  const roof = new THREE.Mesh(new THREE.ConeGeometry(1.06, 0.6, 4), matRoof);
  roof.rotation.y = Math.PI / 4;
  roof.position.y = 2.66;
  grp.add(roof);
  const ridge = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.09, 0.1), matBrass);
  ridge.position.y = 2.97;
  grp.add(ridge);
  for (const sx of [-0.31, 0.31]) {
    const beast = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.16, 6), matBrass);
    beast.position.set(sx, 3.02, 0);
    grp.add(beast);
    /* 檐角饰：四角小尖上翘 */
    for (const sz of [-1, 1]) {
      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.14, 5), matBrass);
      tip.position.set(sx, 2.62, sz * 0.53);
      tip.rotation.z = sx > 0 ? -0.7 : 0.7;
      grp.add(tip);
    }
  }

  buildCornerPavilions(grp, matLacquer, matRoof, matBrass);
  /* 斗拱横枋（大顶檐下一圈 16 小块，instanced） */
  const douGeo = new THREE.BoxGeometry(0.09, 0.07, 0.09);
  const dougong = new THREE.InstancedMesh(douGeo, matLacquer, 16);
  {
    const m4 = new THREE.Matrix4();
    let di = 0;
    for (let k = 0; k < 4; k++) {
      for (let j = 0; j < 4; j++) {
        const t = (j - 1.5) / 1.5;
        const x = k === 0 ? t : k === 1 ? 0.98 : k === 2 ? -t : -0.98;
        const z = k === 0 ? 0.98 : k === 1 ? -t : k === 2 ? -0.98 : t;
        m4.makeTranslation(x, 2.42, z);
        dougong.setMatrixAt(di++, m4);
      }
    }
    dougong.instanceMatrix.needsUpdate = true;
  }
  grp.add(dougong);

  /* 旗杆 + 朝旗（旗面顶点波动在主循环统一驱动） */
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.035, 1.7, 8), matBrass);
  pole.position.set(0.95, 1.35, 0.85);
  grp.add(pole);
  const finial = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), matBrass);
  finial.position.set(0.95, 2.22, 0.85);
  grp.add(finial);
  const flagGeo = new THREE.PlaneGeometry(0.66, 0.85, 8, 6);
  flagGeo.translate(0.33, 0, 0);   /* 悬挂边在左（杆侧） */
  const flagMat = new THREE.MeshStandardMaterial({
    map: makeFlagTexture(short, o.accent ?? ATLAS_PAL.lacquer),
    side: THREE.DoubleSide,
    roughness: 0.85,
  });
  const flag = new THREE.Mesh(flagGeo, flagMat);
  flag.position.set(0.95, 2.18, 0.85);
  flag.rotation.y = 0.5;
  grp.add(flag);
  flag.userData.flagSpan = { span: 0.66, minX: 0 };

  /* 灯笼一对（球体压长 + 上下箍 + 穗） */
  const lanternMats = [];
  for (const sx of [-0.72, 0.72]) {
    const matLan = matGlow(ATLAS_PAL.lanternGlow, 0.55);
    const lan = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 10), matLan);
    lan.scale.y = 1.25;
    lan.position.set(sx, 1.02, 0.72);
    const bandT = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.05, 8), matBrass);
    bandT.position.set(sx, 1.21, 0.72);
    const bandB = bandT.clone();
    bandB.position.y = 0.83;
    const tassel = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.12, 6), matLacquer);
    tassel.position.set(sx, 0.73, 0.72);
    tassel.rotation.x = Math.PI;
    grp.add(lan, bandT, bandB, tassel);
    lanternMats.push(matLan);
  }

  /* 台基底部接触阴影（贴地形面） */
  const shadow = makeContactShadow(1.9, 0.5);
  shadow.position.y = 0.03;
  grp.add(shadow);

  grp.scale.setScalar(S);
  return { grp, flag, lanternMats };
}

/* ---------------- 石碑（特标：都护府/宣政院/将军辖区） ---------------- */

function makeStele(lines) {
  const grp = new THREE.Group();
  const matStone = matStd(ATLAS_PAL.stone, { roughness: 0.85 });
  const matStoneDark = matStd(ATLAS_PAL.stoneDark, { roughness: 0.9 });
  const ped = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.16, 0.4), matStoneDark);
  ped.position.y = 0.08;
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.8, 0.14), matStone);
  body.position.y = 0.56;
  const head = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.14, 12, 1, false, 0, Math.PI), matStone);
  head.rotation.z = Math.PI / 2;
  head.rotation.y = Math.PI / 2;
  head.position.y = 1.0;
  grp.add(ped, body, head);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.62), new THREE.MeshStandardMaterial({
    map: makeSteleTexture(lines), roughness: 0.8,
  }));
  face.position.set(0, 0.6, 0.078);
  grp.add(face);
  const shadow = makeContactShadow(0.62, 0.4);
  shadow.position.y = 0.02;
  grp.add(shadow);
  return grp;
}

/* ---------------- 都城调度：按期缓存城楼组，切期旧城沉降新城升起 ---------------- */

const capitalCache = new Map();   /* periodIdx -> { grp, caps: [{grp, name, lon, lat, sprite, flags, lanternMats}], battle? } */
let capitalCur = -1;
const flagsAll = [];              /* { mesh, phase, amp } 旗面波动注册表 */

function buildCapitalsFor(period) {
  if (capitalCache.has(period)) return capitalCache.get(period);
  const p = PERIODS[period];
  const rec = { grp: new THREE.Group(), caps: [], battle: null };
  rec.grp.userData.period = period;
  const accents = ['#a03828', '#3a6ea8', '#3f8a42', '#9a7020'];
  (p.caps || []).forEach(([name, lon, lat], ci) => {
    const tower = makeGateTower(p.short, { scale: ci === 0 ? 1.7 : 0.95, accent: accents[period % accents.length], capName: name });
    const w = lonlatToWorld(lon, lat, groundY(lon, lat) / H_EXAG);
    tower.grp.position.set(w.x, groundY(lon, lat) + 0.02, w.z);
    tower.grp.rotation.y = hash2(period, ci, 9) * 0.5 - 0.25;
    const sprite = makeTextSprite(ci === 0 ? `${name} · 都` : name, { size: ci === 0 ? 46 : 34, color: '#ffe6b0' });
    sprite.position.set(0, ci === 0 ? 4.6 : 2.6, 0);
    tower.grp.add(sprite);
    tower.grp.userData.cap = { name, lon, lat, primary: ci === 0 };
    rec.caps.push(tower);
    rec.grp.add(tower.grp);
    const fs = tower.flag.userData.flagSpan;
    flagsAll.push({ mesh: tower.flag, phase: hash2(period, ci, 4) * TAU, amp: 0.055, span: fs.span, minX: fs.minX });
  });
  (p.marks || []).forEach(([lon, lat, label], mi) => {
    const st = makeStele([label]);
    const w = lonlatToWorld(lon, lat);
    st.position.set(w.x, groundY(lon, lat) + 0.02, w.z);
    st.scale.setScalar(1.15);
    st.rotation.y = hash2(period, mi, 6) * TAU;
    st.userData.cap = { name: label, lon, lat, primary: false };
    rec.caps.push({ grp: st });
    rec.grp.add(st);
    rec.grp.add(buildGarrisonFlags(lon, lat));
  });
  /* 战役沙盘随期挂载 */
  if (p.battles && p.battles.length) {
    for (const [, id, lo, la] of p.battles) {
      const b = id === 'chibi' ? buildChibiStage() : buildFeishuiStage();
      const w = lonlatToWorld(lo, la);
      b.grp.position.set(w.x, groundY(lo, la) + 0.05, w.z);
      rec.battle = b;
      rec.grp.add(b.grp);
    }
  }
  capitalCache.set(period, rec);
  return rec;
}

/* 切期：旧组沉降收起，新组升起（同一 capGrp 容器管理，0.55s 交叉） */
const capitalSwitch = { from: null, to: null, t: 1 };
function switchCapital(period) {
  if (period === capitalCur) return;
  const rec = buildCapitalsFor(period);
  if (capitalCur >= 0) {
    const oldRec = capitalCache.get(capitalCur);
    if (oldRec && oldRec !== rec) {
      G.capitals.remove(oldRec.grp);
    }
  }
  if (!rec.grp.parent) G.capitals.add(rec.grp);
  rec.grp.scale.setScalar(0.001);
  rec.grp.visible = true;
  capitalSwitch.from = null;
  capitalSwitch.to = rec;
  capitalSwitch.t = 0;
  capitalCur = period;
}
function capitalTick(dt) {
  if (capitalSwitch.t < 1 && capitalSwitch.to) {
    capitalSwitch.t = Math.min(1, capitalSwitch.t + dt / 0.55);
    const e = easeInOut(capitalSwitch.t);
    const pop = 1 - Math.pow(1 - e, 2);
    capitalSwitch.to.grp.scale.setScalar(Math.max(pop * (1 + Math.sin(e * Math.PI) * 0.04), 0.001));
  }
}

/* ---------------- 放样船壳（战役沙盘与海商船共用） ---------------- */

/**
 * CatmullRom 截面放样船体：沿船纵轴取 18 档截面，每档 U 形 5 点，
 * 半宽按 sin(π·u^0.72) 首尾收尖，舷高船首上翘，底部圆收。
 */
function makeHullMesh(len, wid, hgt, mat) {
  const SEC = 18, CROSS = 5;
  const positions = [], uvs = [], indices = [];
  for (let i = 0; i <= SEC; i++) {
    const u = i / SEC;
    const w = wid * Math.sin(Math.PI * Math.pow(u, 0.72));
    const yDeck = hgt * (0.72 + 0.5 * Math.pow(u, 3));
    const yBot = -hgt * 0.22 * Math.sin(Math.PI * u);
    const x = (u - 0.5) * len;
    const cross = [
      [x, yDeck, -w / 2],
      [x, yBot + (yDeck - yBot) * 0.32, -w * 0.42],
      [x, yBot, 0],
      [x, yBot + (yDeck - yBot) * 0.32, w * 0.42],
      [x, yDeck, w / 2],
    ];
    for (let j = 0; j < CROSS; j++) {
      positions.push(cross[j][0], cross[j][1], cross[j][2]);
      uvs.push(u * 3, j / (CROSS - 1));
    }
    if (i > 0) {
      const o = (i - 1) * CROSS;
      for (let j = 0; j < CROSS - 1; j++) {
        indices.push(o + j, o + CROSS + j, o + j + 1, o + j + 1, o + CROSS + j, o + CROSS + j + 1);
      }
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return new THREE.Mesh(geo, mat);
}

/* 横帆贴图：横排大字 + 织纹 + 上下横杆 */
function makeSailTexture(char, bg = '#d8c9a0', fg = '#4a3418') {
  return canvasTex(256, 200, (c, W, Hh) => {
    c.fillStyle = bg;
    c.fillRect(0, 0, W, Hh);
    const rnd = seededRand(29);
    for (let i = 0; i < 220; i++) {
      c.fillStyle = rnd() > 0.5 ? 'rgba(120,100,60,0.08)' : 'rgba(255,250,230,0.08)';
      c.fillRect(rnd() * W, rnd() * Hh, 4 + rnd() * 8, 2 + rnd() * 3);
    }
    c.fillStyle = fg;
    c.font = '700 88px "PingFang SC", sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(char, W / 2, Hh / 2);
    c.fillStyle = 'rgba(90,70,40,0.6)';
    c.fillRect(0, 8, W, 8);
    c.fillRect(0, Hh - 16, W, 8);
  });
}

/* 完整战船：船壳 + 甲板 + 舷缘 + 桅杆横桁 + 鼓帆 + 舵 + 长橹 */
function makeWarShip(o = {}) {
  const grp = new THREE.Group();
  const len = o.len ?? 1.7, wid = o.wid ?? 0.5, hgt = o.hgt ?? 0.36;
  const matHull = matStd(o.hullColor ?? 0x6e4a2a, { roughness: 0.82 });
  const matWood2 = matStd(ATLAS_PAL.woodDark, { roughness: 0.75 });
  const hull = makeHullMesh(len, wid, hgt, matHull);
  grp.add(hull);
  const deck = new THREE.Mesh(new THREE.BoxGeometry(len * 0.88, 0.03, wid * 0.66), matWood2);
  deck.position.y = hgt * 0.82;
  grp.add(deck);
  /* 舷缘两条 */
  for (const sz of [-1, 1]) {
    const pts = [];
    for (let i = 0; i <= 12; i++) {
      const u = i / 12;
      const w = wid * Math.sin(Math.PI * Math.pow(u, 0.72));
      pts.push(new THREE.Vector3((u - 0.5) * len, hgt * (0.72 + 0.5 * Math.pow(u, 3)), sz * w / 2));
    }
    const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.022, 6, false), matWood2);
    grp.add(tube);
  }
  /* 桅杆 + 横桁 */
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.036, 1.15, 8), matWood2);
  mast.position.set(-len * 0.05, hgt * 0.8 + 0.55, 0);
  mast.rotation.z = -0.06;
  grp.add(mast);
  const yard = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, wid * 1.9, 8), matWood2);
  yard.rotation.z = Math.PI / 2;
  yard.position.set(-len * 0.09, hgt * 0.8 + 1.02, 0);
  grp.add(yard);
  /* 鼓帆（弯面，主循环微幅波动） */
  const sailGeo = new THREE.PlaneGeometry(wid * 1.78, 0.86, 7, 5);
  {
    const pos = sailGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i);
      pos.setZ(i, Math.cos(x / (wid * 1.78) * Math.PI) * 0.16 * (1 - Math.abs(y) / 0.5));
    }
    sailGeo.computeVertexNormals();
  }
  const sailMat = new THREE.MeshStandardMaterial({
    map: makeSailTexture(o.sailChar ?? '船', o.sailBg ?? '#d8c9a0', o.sailFg ?? '#4a3418'),
    side: THREE.DoubleSide, roughness: 0.9,
  });
  const sail = new THREE.Mesh(sailGeo, sailMat);
  sail.position.set(-len * 0.09, hgt * 0.8 + 0.56, 0);
  grp.add(sail);
  /* 舵与橹 */
  const rudder = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.3, 0.16), matWood2);
  rudder.position.set(len * 0.47, hgt * 0.3, 0);
  grp.add(rudder);
  const oar = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.02, 0.8, 6), matWood2);
  oar.position.set(len * 0.3, hgt * 0.4, wid * 0.3);
  oar.rotation.x = 0.9;
  grp.add(oar);
  return { grp, sail, mast };
}

/* GPU 粒子：火星 / 箭雨（vertex 内按 uTime+seed 无状态动画） */
function makeParticleBurst(o) {
  const N = o.count;
  const seeds = new Float32Array(N * 4);   /* r0 相位 / r1 速度 / r2 角度 / r3 尺度 */
  const rnd = seededRand(o.seed ?? 3);
  for (let i = 0; i < N; i++) {
    seeds[i * 4] = rnd(); seeds[i * 4 + 1] = rnd(); seeds[i * 4 + 2] = rnd(); seeds[i * 4 + 3] = 0.4 + rnd() * 0.6;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(N * 3), 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 4));
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uOrigin: { value: new THREE.Vector3(0, 0, 0) },
      uRise: { value: o.rise ?? 1.6 },
      uSpread: { value: o.spread ?? 0.5 },
      uSize: { value: o.size ?? 26 },
      uColor: { value: new THREE.Color(o.color ?? '#ffb050') },
      uArc: { value: o.arc ? 1 : 0 },
      uTarget: { value: new THREE.Vector3(1, 0, 0) },
      uSpeed: { value: o.speed ?? 0.6 },
    },
    vertexShader: /* glsl */`
      attribute vec4 aSeed;
      uniform float uTime;
      uniform vec3 uOrigin;
      uniform vec3 uTarget;
      uniform float uRise;
      uniform float uSpread;
      uniform float uSize;
      uniform float uArc;
      uniform float uSpeed;
      varying float vLife;
      void main() {
        float life = fract(uTime * uSpeed * (0.7 + aSeed.y * 0.6) + aSeed.x);
        vLife = life;
        vec3 p;
        if (uArc > 0.5) {
          /* 箭雨：起点→目标抛物线 */
          vec3 lerpP = mix(uOrigin, uTarget, life);
          float h = 4.0 * 1.5 * life * (1.0 - life);
          p = lerpP + vec3(0.0, h, 0.0) + vec3(
            (aSeed.z - 0.5) * uSpread,
            0.0,
            (aSeed.w - 0.5) * uSpread * 0.5
          );
        } else {
          /* 火星：自 origin 上升 + 水平摆动 */
          float sway = sin(uTime * 3.0 + aSeed.x * 40.0) * 0.22;
          p = uOrigin + vec3(
            (aSeed.z - 0.5) * uSpread + sway * life,
            life * uRise,
            (aSeed.w - 0.5) * uSpread + cos(uTime * 2.4 + aSeed.y * 30.0) * 0.18 * life
          );
        }
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = uSize * aSeed.w * (uArc > 0.5 ? (1.0 - life * 0.5) : (1.0 - life)) / max(-mv.z, 0.1);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uColor;
      varying float vLife;
      void main() {
        vec2 c = gl_PointCoord - 0.5;
        float d = length(c);
        if (d > 0.5) discard;
        float a = (1.0 - d * 2.0) * (1.0 - vLife);
        gl_FragColor = vec4(uColor, a);
      }`,
  });
  const pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false;
  return { pts, mat };
}

/* 焦黑水面贴片 */
function makeScorchMark(r) {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 128;
  const c = cv.getContext('2d');
  const g = c.createRadialGradient(64, 64, 6, 64, 64, 62);
  g.addColorStop(0, 'rgba(14,10,8,0.85)');
  g.addColorStop(0.6, 'rgba(24,16,10,0.5)');
  g.addColorStop(1, 'rgba(24,16,10,0)');
  c.fillStyle = g;
  c.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(r * 2, r * 2), new THREE.MeshBasicMaterial({
    map: tex, transparent: true, depthWrite: false,
  }));
  m.rotation.x = -Math.PI / 2;
  m.renderOrder = 3;
  return m;
}

/* ---------------- 赤壁水战沙盘：连环船阵 + 火船 + 火星 + 焦痕 + 浓烟 ---------------- */

function buildChibiStage() {
  const grp = new THREE.Group();
  const flags = [], smokes = [], particles = [];
  /* 江面亮带：宽幅半透明管沿江（教学沙盘的水域强调） */
  const jiangSeg = RIVERS[1].filter(([, la]) => la > 29.4 && la < 31.2);
  const jiangCurve = riverCurveOf(jiangSeg.length > 2 ? jiangSeg : RIVERS[1].slice(6, 9), 0.09);
  const jiang = new THREE.Mesh(
    new THREE.TubeGeometry(jiangCurve, 80, 0.85, 10, false),
    new THREE.MeshStandardMaterial({
      color: ATLAS_PAL.waterShallow, transparent: true, opacity: 0.3,
      roughness: 0.15, metalness: 0.1, depthWrite: false,
    }),
  );
  jiang.renderOrder = 3;
  grp.add(jiang);
  /* 曹军连环船阵：两列 ×4（江北） */
  const hullMat = matStd(0x6e4a2a, { roughness: 0.82 });
  const chainMat = matStd(ATLAS_PAL.stoneDark, { roughness: 0.5, metalness: 0.7 });
  const shipPos = [];
  for (let col2 = 0; col2 < 2; col2++) {
    for (let row = 0; row < 4; row++) {
      const lo = 112.7 + col2 * 0.42 + row * 0.1;
      const la = 30.42 - row * 0.16 + col2 * 0.08;
      shipPos.push([lo, la]);
    }
  }
  const chibiShips = [];
  shipPos.forEach(([lo, la], si) => {
    if (si >= 6) return;   /* 两列 ×3（draw call 预算内保留编队感） */
    const ship = makeWarShip({
      len: 1.55, wid: 0.48, hgt: 0.34,
      hullColor: 0x6e4a2a, sailChar: '曹', sailBg: '#c8b48a', sailFg: '#33241a',
    });
    const w = lonlatToWorld(lo, la);
    ship.grp.position.set(w.x, groundY(lo, la) + 0.16, w.z);
    ship.grp.rotation.y = -0.5 + hash2(si, 1, 2) * 0.2;
    grp.add(ship.grp);
    chibiShips.push(ship);
    const sailSpan = 0.48 * 1.78;
    flags.push({ mesh: ship.sail, phase: si * 1.3, amp: 0.03, sail: true, span: sailSpan, minX: -sailSpan / 2 });
  });
  /* 楼船旗舰：曹军阵首（双层船楼 + 战鼓 + 帅旗） */
  {
    const flagship = makeTowerShip();
    const [flo, fla] = shipPos[0];
    const fw = lonlatToWorld(flo + 0.3, fla + 0.24);
    flagship.grp.position.set(fw.x, groundY(flo, fla) + 0.16, fw.z);
    flagship.grp.rotation.y = -0.5;
    grp.add(flagship.grp);
    flags.push({ mesh: flagship.flag, phase: 0.7, amp: 0.045, span: flagship.span, minX: flagship.minX });
  }
  /* 连环铁索：相邻船间短索 */
  for (let row = 0; row < 3; row++) {
    const a = shipPos[row], b = shipPos[row + 4];
    const pa = lonlatToWorld(a[0], a[1], groundY(a[0], a[1]) / H_EXAG);
    const pb = lonlatToWorld(b[0], b[1], groundY(b[0], b[1]) / H_EXAG);
    const mid = pa.clone().add(pb).multiplyScalar(0.5);
    mid.y = Math.min(pa.y, pb.y) + 0.1;
    const curve = new THREE.CatmullRomCurve3([pa, mid, pb]);
    const chain = new THREE.Mesh(new THREE.TubeGeometry(curve, 12, 0.02, 5, false), chainMat);
    chain.position.y = 0.42;
    grp.add(chain);
  }
  /* 孙刘火船 3：东南逼近，满载柴薪 */
  for (let i = 0; i < 3; i++) {
    const lo = 114.15 + i * 0.22, la = 29.72 - i * 0.13;
    const ship = makeWarShip({
      len: 1.2, wid: 0.4, hgt: 0.3,
      hullColor: 0x3a2a18, sailChar: '火', sailBg: '#4a3826', sailFg: '#e8b060',
    });
    const w = lonlatToWorld(lo, la);
    ship.grp.position.set(w.x, groundY(lo, la) + 0.14, w.z);
    ship.grp.rotation.y = -0.9 + i * 0.3;
    /* 柴薪堆 */
    const woodMat = matStd(0x5a3c1e, { roughness: 0.95 });
    const pile = new THREE.Group();
    for (let k = 0; k < 7; k++) {
      const log = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.7, 6), woodMat);
      log.rotation.z = Math.PI / 2;
      log.rotation.y = (k - 3) * 0.28;
      log.position.y = 0.42 + k * 0.045;
      pile.add(log);
    }
    ship.grp.add(pile);
    grp.add(ship.grp);
    /* 火焰光晕两枚 + 浓烟两枚 */
    for (let k = 0; k < 2; k++) {
      const glow = new THREE.Sprite(new THREE.SpriteMaterial({
        map: makeGlowTexture('255,140,50'),
        transparent: true, depthWrite: false,
      }));
      glow.scale.set(1.5, 1.5, 1);
      glow.position.set(w.x + (k - 0.5) * 0.3, groundY(lo, la) + 1.0, w.z);
      grp.add(glow);
      smokes.push({ spr: glow, kind: 'fire', phase: i * 2 + k * 1.4, baseY: glow.position.y });
    }
    for (let k = 0; k < 2; k++) {
      const smk = new THREE.Sprite(new THREE.SpriteMaterial({
        map: makeGlowTexture('110,110,116', [[0, 'rgba(C,0.5)'], [0.5, 'rgba(C,0.22)'], [1, 'rgba(C,0)']]),
        transparent: true, depthWrite: false,
      }));
      smk.scale.set(2.4, 2.4, 1);
      smk.position.set(w.x + (k - 0.5) * 0.5, groundY(lo, la) + 1.4, w.z);
      grp.add(smk);
      smokes.push({ spr: smk, kind: 'smoke', phase: i * 1.7 + k, baseY: smk.position.y });
    }
    /* 焦痕 */
    const sc = makeScorchMark(0.9);
    sc.position.set(w.x + 0.4, groundY(lo, la) + 0.13, w.z - 0.2);
    grp.add(sc);
  }
  /* 火星粒子：3 束（火船位置） */
  for (let i = 0; i < 3; i++) {
    const lo = 114.15 + i * 0.22, la = 29.72 - i * 0.13;
    const w = lonlatToWorld(lo, la);
    const burst = makeParticleBurst({
      count: 46, seed: 11 + i, rise: 2.2, spread: 0.42, size: 22, speed: 0.5,
      color: i === 1 ? '#ffd070' : '#ff9a40',
    });
    burst.mat.uniforms.uOrigin.value.set(w.x, groundY(lo, la) + 0.7, w.z);
    burst.pts.renderOrder = 5;
    grp.add(burst.pts);
    particles.push(burst);
  }
  /* 火攻点光（随主循环闪烁，位置在火船阵中心） */
  const light = new THREE.PointLight(0xff7a30, 0, 26, 1.8);
  const lw = lonlatToWorld(114.3, 29.85);
  light.position.set(lw.x, groundY(114.3, 29.85) + 1.6, lw.z);
  grp.add(light);
  grp.visible = false;
  return { grp, flags, smokes, particles, light, id: 'chibi' };
}

/* ---------------- 淝水之战沙盘：实例化军阵 + 将旗 + 箭雨 + 溃兵 ---------------- */

function buildFeishuiStage() {
  const grp = new THREE.Group();
  const flags = [], particles = [];
  /* 淝水河：南北短流 */
  const feiCurve = riverCurveOf([[31.7, 32.1], [32.0, 31.6], [32.2, 31.0], [32.3, 30.4]], 0.08);
  const fei = new THREE.Mesh(
    new THREE.TubeGeometry(feiCurve, 60, 0.12, 7, false),
    new THREE.MeshStandardMaterial({
      color: ATLAS_PAL.river, transparent: true, opacity: 0.85,
      roughness: 0.25, emissive: new THREE.Color(ATLAS_PAL.river), emissiveIntensity: 0.3,
    }),
  );
  grp.add(fei);
  /* 军阵实例化：盒状兵俑（微随机转向/间距），秦阵三梯队 / 晋阵窄正面 */
  const rnd = seededRand(66);
  const makeArmy = (count, color, anchorLo, anchorLa, faceAngle, cols) => {
    const geo = new THREE.BoxGeometry(0.11, 0.3, 0.08);
    const mat = matStd(color, { roughness: 0.85 });
    const inst = new THREE.InstancedMesh(geo, mat, count);
    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const eu = new THREE.Euler();
    const sc = new THREE.Vector3(1, 1, 1);
    for (let i = 0; i < count; i++) {
      const col = i % cols, row = (i / cols) | 0;
      const lo = anchorLo + col * 0.045 + (rnd() - 0.5) * 0.012;
      const la = anchorLa - row * 0.05 - (rnd() - 0.5) * 0.01;
      const w = lonlatToWorld(lo, la);
      eu.set(0, faceAngle + (rnd() - 0.5) * 0.3, 0);
      q.setFromEuler(eu);
      m4.compose(new THREE.Vector3(w.x, groundY(lo, la) + 0.15, w.z), q, sc);
      inst.setMatrixAt(i, m4);
    }
    inst.instanceMatrix.needsUpdate = true;
    grp.add(inst);
    return inst;
  };
  /* 前秦军（河西岸，三梯队，面朝东南） */
  makeArmy(210, 0x5a4632, 31.86, 31.62, 2.2, 42);
  /* 东晋军（河东岸窄正面，背水） */
  makeArmy(130, 0x33465e, 32.14, 31.4, -0.9, 30);
  /* 溃兵：东南散开斜倒 */
  {
    const geo = new THREE.BoxGeometry(0.1, 0.26, 0.07);
    const mat = matStd(0x4a3c2a, { roughness: 0.9 });
    const inst = new THREE.InstancedMesh(geo, mat, 22);
    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    for (let i = 0; i < 22; i++) {
      const lo = 32.35 + rnd() * 0.4, la = 30.9 - rnd() * 0.5;
      const w = lonlatToWorld(lo, la);
      q.setFromEuler(new THREE.Euler(rnd() * 0.6 - 0.3, rnd() * TAU, 1.1 + rnd() * 0.4));
      m4.compose(new THREE.Vector3(w.x, groundY(lo, la) + 0.1, w.z), q, new THREE.Vector3(1, 1, 1));
      inst.setMatrixAt(i, m4);
    }
    inst.instanceMatrix.needsUpdate = true;
    grp.add(inst);
  }
  /* 将旗：秦军大旗 + 晋军双旗（旗面波动注册） */
  const bannerOf = (char, bg, lo, la, h = 1.5) => {
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.022, h, 6),
      matStd(ATLAS_PAL.woodDark, { roughness: 0.7 }),
    );
    const w = lonlatToWorld(lo, la);
    pole.position.set(w.x, groundY(lo, la) + h / 2 + 0.1, w.z);
    grp.add(pole);
    const flagGeo = new THREE.PlaneGeometry(0.5, 0.62, 8, 6);
    flagGeo.translate(0.25, 0, 0);
    const flag = new THREE.Mesh(flagGeo, new THREE.MeshStandardMaterial({
      map: makeFlagTexture(char, bg), side: THREE.DoubleSide, roughness: 0.85,
    }));
    flag.position.set(w.x, groundY(lo, la) + h - 0.28, w.z);
    grp.add(flag);
    flags.push({ mesh: flag, phase: rnd() * TAU, amp: 0.06, span: 0.5, minX: 0 });
    /* 杆顶金铎 */
    const bell = new THREE.Mesh(
      new THREE.SphereGeometry(0.035, 8, 6),
      matStd(PAL.brass, { roughness: 0.35, metalness: 0.85 }),
    );
    bell.position.set(w.x, groundY(lo, la) + h + 0.12, w.z);
    grp.add(bell);
  };
  bannerOf('秦', '#8a5a28', 31.88, 31.56, 1.9);
  bannerOf('晋', '#33465e', 32.16, 31.34, 1.6);
  bannerOf('晋', '#33465e', 32.2, 31.18, 1.4);
  /* 箭雨：秦阵上空 → 晋阵（抛物线 GPU 粒子） */
  const fromW = lonlatToWorld(31.9, 31.5);
  const toW = lonlatToWorld(32.16, 31.32);
  const arrows = makeParticleBurst({
    count: 150, seed: 21, arc: true, spread: 0.5, size: 15, speed: 0.4, color: '#d8b878',
  });
  arrows.mat.uniforms.uOrigin.value.set(fromW.x, groundY(31.9, 31.5) + 1.4, fromW.z);
  arrows.mat.uniforms.uTarget.value.set(toW.x, groundY(32.16, 31.32) + 0.3, toW.z);
  arrows.pts.renderOrder = 5;
  grp.add(arrows.pts);
  particles.push(arrows);
  grp.visible = false;
  return { grp, flags, particles, id: 'feishui' };
}

/* ---------------- 场景叙事道具（环绕沙盘的书房语境） ---------------- */

const DESK_HALF_W = 60, DESK_HALF_D = 40;   /* 桌面半幅（沙盘 47.5×25.5 留边） */

/* 大木桌：桌面木纹 + 裙边 + 旋纹腿 + 横枨 + 地板 */
function buildDeskAndFloor() {
  const grp = new THREE.Group();
  const woodTex = makeWoodTexture({ base: ATLAS_PAL.wood, dark: ATLAS_PAL.woodDark, light: ATLAS_PAL.woodLight, seed: 3, planks: 5 });
  woodTex.repeat.set(3, 2);
  const matDesk = new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.62, metalness: 0.04 });
  const matLeg = matStd(ATLAS_PAL.woodDark, { roughness: 0.66 });
  const top = new THREE.Mesh(new THREE.BoxGeometry(DESK_HALF_W * 2, 0.42, DESK_HALF_D * 2), matDesk);
  top.position.y = -0.21;
  grp.add(top);
  /* 裙边一圈（略缩进） */
  const apron = new THREE.Mesh(new THREE.BoxGeometry(DESK_HALF_W * 2 - 1.6, 0.5, DESK_HALF_D * 2 - 1.6), matLeg);
  apron.position.y = -0.62;
  grp.add(apron);
  /* 四腿：车削旋纹（LatheGeometry 轮廓） */
  const legPts = [];
  for (let i = 0; i <= 20; i++) {
    const t = i / 20;
    const r = 0.42 + Math.sin(t * Math.PI * 3) * 0.1 - t * 0.18;
    legPts.push(new THREE.Vector2(Math.max(r, 0.16), -t * 6.6));
  }
  const legGeo = new THREE.LatheGeometry(legPts, 14);
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const leg = new THREE.Mesh(legGeo, matLeg);
      leg.position.set(sx * (DESK_HALF_W - 3.4), -0.42, sz * (DESK_HALF_D - 3));
      grp.add(leg);
    }
  }
  /* 横枨两根 */
  for (const sz of [-1, 1]) {
    const brace = new THREE.Mesh(new THREE.BoxGeometry(DESK_HALF_W * 2 - 8, 0.34, 0.42), matLeg);
    brace.position.set(0, -2.6, sz * (DESK_HALF_D - 3));
    grp.add(brace);
  }
  /* 地板：大暗面 + 中心渐晕 */
  const floorCv = document.createElement('canvas');
  floorCv.width = floorCv.height = 256;
  const fc = floorCv.getContext('2d');
  const fg2 = fc.createRadialGradient(128, 128, 20, 128, 128, 128);
  fg2.addColorStop(0, '#241c14');
  fg2.addColorStop(1, '#120d08');
  fc.fillStyle = fg2;
  fc.fillRect(0, 0, 256, 256);
  const floorTex = new THREE.CanvasTexture(floorCv);
  floorTex.colorSpace = THREE.SRGBColorSpace;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(240, 170), new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.95 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -7.1;
  grp.add(floor);
  /* 沙盘围边木框：四面框条 + 四角榫块（挡地形剖面） */
  const matFrame = new THREE.MeshStandardMaterial({ map: makeWoodTexture({ base: '#6a4a2c', dark: '#4c3018', light: '#8a6238', seed: 8 }), roughness: 0.6 });
  const frameH = 0.34;
  const edges = [
    [0, WORLD_D / 2 + 0.5, WORLD_W + 2, 1],
    [0, -WORLD_D / 2 - 0.5, WORLD_W + 2, 1],
    [WORLD_W / 2 + 0.5, 0, 1, WORLD_D + 2],
    [-WORLD_W / 2 - 0.5, 0, 1, WORLD_D + 2],
  ];
  for (const [ex, ez, ew, ed] of edges) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(ew, frameH, ed), matFrame);
    bar.position.set(ex, frameH / 2 - 0.02, ez);
    grp.add(bar);
  }
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const tenon = new THREE.Mesh(new THREE.BoxGeometry(1.3, frameH + 0.06, 1.3), matFrame);
      tenon.position.set(sx * (WORLD_W / 2 + 0.5), (frameH + 0.06) / 2 - 0.03, sz * (WORLD_D / 2 + 0.5));
      tenon.rotation.y = Math.PI / 4;
      grp.add(tenon);
    }
  }
  return grp;
}

/* 罗盘：车削盘体 + 刻度盘面 + 玻璃罩 + 红黑磁针（缓慢摆动） */
function buildCompass() {
  const grp = new THREE.Group();
  const R = 2.1;
  /* 盘体：Lathe 车削轮廓（底盘 + 圈沿 + 内凹） */
  const prof = [
    new THREE.Vector2(0.001, 0),
    new THREE.Vector2(R * 0.95, 0),
    new THREE.Vector2(R, 0.14),
    new THREE.Vector2(R, 0.3),
    new THREE.Vector2(R * 0.94, 0.34),
    new THREE.Vector2(R * 0.9, 0.22),
    new THREE.Vector2(R * 0.2, 0.2),
    new THREE.Vector2(0.001, 0.2),
  ];
  const matBronze = matStd(PAL.brass, { roughness: 0.38, metalness: 0.75 });
  const bodyLathe = new THREE.Mesh(new THREE.LatheGeometry(prof, 40), matBronze);
  grp.add(bodyLathe);
  /* 盘面刻度贴图 */
  const face = new THREE.Mesh(new THREE.CircleGeometry(R * 0.88, 48), new THREE.MeshStandardMaterial({
    map: makeCompassFace(), roughness: 0.6,
  }));
  face.rotation.x = -Math.PI / 2;
  face.position.y = 0.225;
  grp.add(face);
  /* 磁针：红北黑南双菱针 + 中心帽 */
  const needleGrp = new THREE.Group();
  const north = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.85, 4), matGlow('#d84a30', 0.5));
  north.rotation.x = Math.PI / 2;
  north.rotation.z = Math.PI / 2;
  north.position.x = 0.42;
  const south = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.85, 4), matStd(ATLAS_PAL.inkBlack, { roughness: 0.5 }));
  south.rotation.x = -Math.PI / 2;
  south.rotation.z = -Math.PI / 2;
  south.position.x = -0.42;
  const cap2 = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), matBronze);
  needleGrp.add(north, south, cap2);
  needleGrp.position.y = 0.32;
  grp.add(needleGrp);
  /* 玻璃罩 */
  const dome = new THREE.Mesh(new THREE.SphereGeometry(R * 0.92, 24, 14, 0, TAU, 0, Math.PI / 2), matGlass('#dfeef2', { transmission: 0.9, thickness: 0.2, roughness: 0.05 }));
  dome.scale.y = 0.34;
  dome.position.y = 0.3;
  grp.add(dome);
  /* 三足 */
  for (let i = 0; i < 3; i++) {
    const a = i / 3 * TAU + 0.5;
    const foot = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.34, 8), matBronze);
    foot.position.set(Math.cos(a) * R * 0.82, -0.1, Math.sin(a) * R * 0.82);
    grp.add(foot);
  }
  const shadow = makeContactShadow(R * 1.15, 0.45);
  shadow.position.y = 0.015;
  grp.add(shadow);
  grp.position.set(-DESK_HALF_W + 9, 0, DESK_HALF_D - 8);
  grp.rotation.y = 0.5;
  return { grp, needle: needleGrp };
}

/* 印章组：覆斗钮玉玺 + 印泥盒 + 两枚小章 */
function buildSealSet() {
  const grp = new THREE.Group();
  const matJade = matCoat(ATLAS_PAL.jade, { roughness: 0.32, clearcoat: 0.85, metalness: 0.02 });
  const matJadeDeep = matStd(ATLAS_PAL.jadeDeep, { roughness: 0.5 });
  const matBronze = matStd(PAL.brass, { roughness: 0.4, metalness: 0.7 });
  /* 玉玺：印台方墩 + 覆斗钮 + 印面刻文 */
  const seal = new THREE.Group();
  const knob = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.62, 0.52), matJade);
  knob.position.y = 0.31;
  const base2 = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.28, 0.72), matJadeDeep);
  base2.position.y = -0.14;
  const facePlate = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.62), new THREE.MeshStandardMaterial({
    map: makeSealFace('山河一统'), roughness: 0.4,
  }));
  facePlate.rotation.x = -Math.PI / 2;
  facePlate.position.y = -0.285;
  seal.add(knob, base2, facePlate);
  seal.position.set(-1.4, 0.42, 0);
  grp.add(seal);
  /* 印泥盒：鼓腹圆柱 + 朱泥面 + 盖珠 */
  const paste = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.46, 0.3, 20), matStd(0x3a2c20, { roughness: 0.6 }));
  paste.position.set(0.4, 0.15, 0.5);
  const pasteTop = new THREE.Mesh(new THREE.CircleGeometry(0.36, 20), matGlow(ATLAS_PAL.cinnabar, 0.35));
  pasteTop.rotation.x = -Math.PI / 2;
  pasteTop.position.set(0.4, 0.305, 0.5);
  const pasteKnob = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), matBronze);
  pasteKnob.position.set(0.4, 0.42, 0.5);
  grp.add(paste, pasteTop, pasteKnob);
  /* 小章两枚：圆柱章身 + 平顶刻字 */
  for (const [i, txt] of ['迷鹿', '藏图'].entries()) {
    const st = new THREE.Group();
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.5, 12), matJade);
    shaft.position.y = 0.25;
    const cap3 = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.09, 12), matJadeDeep);
    cap3.position.y = 0.53;
    const tip = new THREE.Mesh(new THREE.CircleGeometry(0.14, 12), new THREE.MeshStandardMaterial({
      map: makeSealFace(txt, ATLAS_PAL.cinnabar), roughness: 0.4,
    }));
    tip.rotation.x = -Math.PI / 2;
    tip.position.y = 0.001;
    st.add(shaft, cap3, tip);
    st.position.set(1.35 + i * 0.55, 0, 0.3 - i * 0.5);
    st.rotation.y = i * 0.8;
    grp.add(st);
  }
  const shadow = makeContactShadow(2.6, 0.42);
  shadow.position.y = 0.015;
  grp.add(shadow);
  grp.position.set(DESK_HALF_W - 10, 0, DESK_HALF_D - 9);
  grp.rotation.y = -0.6;
  return grp;
}

/* 展开卷轴 + 立卷：绢本小图 + 双轴头 + 丝带 */
function buildScrolls() {
  const grp = new THREE.Group();
  const matWood2 = matStd(ATLAS_PAL.woodDark, { roughness: 0.6 });
  const matSilk = matStd(ATLAS_PAL.silkDeep, { roughness: 0.8 });
  /* 展开卷：两根轴 + 绢面（微弯 plane） */
  const openGrp = new THREE.Group();
  for (const sx of [-1, 1]) {
    const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 2.6, 12), matWood2);
    axle.rotation.z = Math.PI / 2;
    axle.position.set(sx * 1.3, 0.1, 0);
    openGrp.add(axle);
    const capEnd = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), matStd(PAL.brass, { roughness: 0.35, metalness: 0.8 }));
    capEnd.position.set(sx * 2.62, 0.1, 0);
    openGrp.add(capEnd);
  }
  const mapGeo = new THREE.PlaneGeometry(2.5, 1.66, 16, 8);
  {
    const pos = mapGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      pos.setZ(i, -Math.cos(x / 2.5 * Math.PI) * 0.05);
      pos.setY(i, pos.getY(i) + 0.1);
    }
    mapGeo.computeVertexNormals();
  }
  const mapMesh = new THREE.Mesh(mapGeo, new THREE.MeshStandardMaterial({
    map: makeScrollMap(), roughness: 0.85, side: THREE.DoubleSide,
  }));
  mapMesh.rotation.x = -Math.PI / 2;
  openGrp.add(mapMesh);
  openGrp.position.set(-0.4, 0, 0);
  grp.add(openGrp);
  /* 立卷斜倚 */
  const rolled = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 2.3, 16), matSilk);
  rolled.rotation.z = 1.25;
  rolled.position.set(2.4, 0.35, -0.9);
  grp.add(rolled);
  const rollCore = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 2.34, 16, 1, true), matWood2);
  rollCore.rotation.z = 1.25;
  rollCore.position.set(2.4, 0.35, -0.9);
  grp.add(rollCore);
  /* 丝带系结 */
  const ribbon = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 0.09), matGlow(ATLAS_PAL.vermilion, 0.3));
  ribbon.rotation.z = 1.25;
  ribbon.position.set(2.4, 0.35, -0.9);
  grp.add(ribbon);
  const shadow = makeContactShadow(2.4, 0.4);
  shadow.position.set(0.8, 0.015, 0);
  grp.add(shadow);
  grp.position.set(-DESK_HALF_W + 11, 0, -DESK_HALF_D + 8.5);
  grp.rotation.y = 0.35;
  return grp;
}

/* 铜烛台：双层球节杆 + 烛盘 + 蜡烛熔滴 + 火焰光晕 + 点光（闪烁由主循环驱动） */
function buildCandleStand(x, z, rotY) {
  const grp = new THREE.Group();
  const matBronze = matStd(PAL.brass, { roughness: 0.4, metalness: 0.78 });
  const prof = [
    new THREE.Vector2(0.001, 0),
    new THREE.Vector2(0.55, 0),
    new THREE.Vector2(0.6, 0.1),
    new THREE.Vector2(0.34, 0.2),
    new THREE.Vector2(0.14, 0.6),
    new THREE.Vector2(0.24, 0.95),
    new THREE.Vector2(0.1, 1.35),
    new THREE.Vector2(0.26, 1.6),
    new THREE.Vector2(0.12, 1.85),
    new THREE.Vector2(0.3, 2.05),
    new THREE.Vector2(0.32, 2.16),
    new THREE.Vector2(0.001, 2.16),
  ];
  const stem = new THREE.Mesh(new THREE.LatheGeometry(prof, 24), matBronze);
  grp.add(stem);
  /* 蜡烛：柱身 + 顶部熔滴球 */
  const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.42, 12), matStd('#e8dcc0', { roughness: 0.55 }));
  candle.position.y = 2.32;
  grp.add(candle);
  const drip = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), matStd('#efe4cc', { roughness: 0.5 }));
  drip.scale.y = 0.6;
  drip.position.y = 2.52;
  grp.add(drip);
  /* 火焰：内核亮白 + 外焰橙 双 sprite + 光晕 */
  const flameIn = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeGlowTexture('255,246,210'), transparent: true, depthWrite: false,
  }));
  flameIn.scale.set(0.4, 0.62, 1);
  flameIn.position.y = 2.72;
  const flameOut = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeGlowTexture('255,168,86'), transparent: true, depthWrite: false, opacity: 0.85,
  }));
  flameOut.scale.set(0.75, 1.05, 1);
  flameOut.position.y = 2.74;
  grp.add(flameIn, flameOut);
  const light = new THREE.PointLight(0xffa856, 0.55, 16, 1.9);
  light.position.y = 2.8;
  grp.add(light);
  const shadow = makeContactShadow(1.1, 0.45);
  shadow.position.y = 0.015;
  grp.add(shadow);
  grp.position.set(x, 0, z);
  grp.rotation.y = rotY;
  return { grp, flameIn, flameOut, light };
}

/* 三足香炉：Lathe 鼓腹 + 双耳 + 兽足 + 盖钮 + 青烟（上升消散循环） */
function buildIncenseBurner(x, z) {
  const grp = new THREE.Group();
  const matBronze = matStd(0x6e5a34, { roughness: 0.45, metalness: 0.72 });
  const prof = [
    new THREE.Vector2(0.001, 0),
    new THREE.Vector2(0.34, 0),
    new THREE.Vector2(0.5, 0.16),
    new THREE.Vector2(0.62, 0.5),
    new THREE.Vector2(0.58, 0.86),
    new THREE.Vector2(0.46, 0.98),
    new THREE.Vector2(0.48, 1.12),
    new THREE.Vector2(0.42, 1.2),
    new THREE.Vector2(0.001, 1.2),
  ];
  const bodyLathe = new THREE.Mesh(new THREE.LatheGeometry(prof, 28), matBronze);
  grp.add(bodyLathe);
  /* 双耳（torus 半环竖立） */
  for (const sx of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.045, 8, 14, Math.PI), matBronze);
    ear.position.set(sx * 0.52, 1.2, 0);
    ear.rotation.z = sx * 0.25;
    grp.add(ear);
  }
  /* 三兽足：锥足 + 足踝球 */
  for (let i = 0; i < 3; i++) {
    const a = i / 3 * TAU + Math.PI / 6;
    const foot = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.42, 8), matBronze);
    foot.position.set(Math.cos(a) * 0.4, -0.18, Math.sin(a) * 0.4);
    const ankle = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), matBronze);
    ankle.position.set(Math.cos(a) * 0.42, 0.06, Math.sin(a) * 0.42);
    grp.add(foot, ankle);
  }
  /* 盖：半球 + 立钮 + 镂空暗点 */
  const lid = new THREE.Mesh(new THREE.SphereGeometry(0.5, 20, 12, 0, TAU, 0, Math.PI / 2), matBronze);
  lid.scale.y = 0.62;
  lid.position.y = 1.18;
  const lidKnob = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), matStd(ATLAS_PAL.jadeDeep, { roughness: 0.4 }));
  lidKnob.position.y = 1.55;
  grp.add(lid, lidKnob);
  /* 青烟：3 支上升 sprite（主循环驱动 y/opacity/摆动） */
  const smokes = [];
  for (let i = 0; i < 3; i++) {
    const smk = new THREE.Sprite(new THREE.SpriteMaterial({
      map: makeGlowTexture('196,196,204', [[0, 'rgba(C,0.32)'], [0.5, 'rgba(C,0.14)'], [1, 'rgba(C,0)']]),
      transparent: true, depthWrite: false,
    }));
    smk.scale.set(0.5, 0.9, 1);
    smk.position.set(x, 1.8, z);
    grp.add(smk);
    smokes.push({ spr: smk, phase: i * 1.9, baseX: x, baseY: 1.8, baseZ: z });
  }
  const shadow = makeContactShadow(0.95, 0.42);
  shadow.position.y = 0.015;
  grp.add(shadow);
  grp.position.set(x, 0, z);
  return { grp, smokes };
}

/* 笔架砚台：山形笔架 + 三支悬笔 + 石砚 + 墨锭 */
function buildBrushRack() {
  const grp = new THREE.Group();
  const matWood2 = matStd(ATLAS_PAL.woodDark, { roughness: 0.65 });
  /* 山形笔架：三峰（中高侧低）+ 底座 */
  const rack = new THREE.Group();
  for (const [hx, hh] of [[-0.42, 0.5], [0, 0.72], [0.42, 0.5]]) {
    const peak = new THREE.Mesh(new THREE.ConeGeometry(0.19, hh, 8), matWood2);
    peak.position.set(hx, hh / 2, 0);
    rack.add(peak);
  }
  const rackBase = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.1, 0.3), matWood2);
  rackBase.position.y = 0.05;
  rack.add(rackBase);
  rack.position.set(-0.5, 0, -0.6);
  grp.add(rack);
  /* 悬笔三支：杆 + 毫锥（倒挂架叉间） */
  for (let i = 0; i < 3; i++) {
    const brush = new THREE.Group();
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.028, 0.72, 8), matStd(0x9a6a3a, { roughness: 0.6 }));
    shaft.position.y = -0.36;
    const hair = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.2, 8), matStd('#3a3028', { roughness: 0.9 }));
    hair.rotation.x = Math.PI;
    hair.position.y = -0.8;
    brush.add(shaft, hair);
    brush.position.set(-0.92 + i * 0.42, 0.62 - (i === 1 ? 0.16 : 0), -0.6);
    grp.add(brush);
  }
  /* 石砚：椭圆砚身 + 砚池凹陷 + 砚额刻边 */
  const inkstone = new THREE.Group();
  const bodyStone = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.46, 0.12, 24), matStd(ATLAS_PAL.stoneDark, { roughness: 0.35 }));
  bodyStone.position.y = 0.06;
  const pool = new THREE.Mesh(new THREE.CircleGeometry(0.3, 24), matStd('#181c20', { roughness: 0.18, metalness: 0.15 }));
  pool.rotation.x = -Math.PI / 2;
  pool.position.y = 0.125;
  const rimRing = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.035, 8, 28), matStd(ATLAS_PAL.stone, { roughness: 0.4 }));
  rimRing.rotation.x = Math.PI / 2;
  rimRing.position.y = 0.125;
  inkstone.add(bodyStone, pool, rimRing);
  inkstone.position.set(0.9, 0, 0.3);
  inkstone.rotation.y = -0.4;
  grp.add(inkstone);
  /* 墨锭：细长条微倾 */
  const inkStick = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, 0.42), matStd('#1c1a16', { roughness: 0.5 }));
  inkStick.position.set(1.6, 0.03, 0.5);
  inkStick.rotation.y = 0.7;
  grp.add(inkStick);
  const shadow = makeContactShadow(1.5, 0.4);
  shadow.position.set(0.3, 0.015, 0);
  grp.add(shadow);
  grp.position.set(-DESK_HALF_W + 10.5, 0, -DESK_HALF_D + 7);
  grp.rotation.y = 0.8;
  return grp;
}

/* 三扇山水屏风：木框 + 绢心山水贴图 + 合页 + 底座（立于桌后地板） */
function buildScreen() {
  const grp = new THREE.Group();
  const matFrame = matStd(ATLAS_PAL.woodDark, { roughness: 0.6 });
  const panelW = 7.2, panelH = 9.5;
  const makePanel = (seed, rotY) => {
    const pg = new THREE.Group();
    const frameTop = new THREE.Mesh(new THREE.BoxGeometry(panelW + 0.36, 0.3, 0.22), matFrame);
    frameTop.position.y = panelH / 2;
    const frameBot = frameTop.clone();
    frameBot.position.y = -panelH / 2;
    const silkMat = new THREE.MeshStandardMaterial({
      map: makeScreenPainting(seed), roughness: 0.85, side: THREE.DoubleSide,
    });
    const silk = new THREE.Mesh(new THREE.PlaneGeometry(panelW, panelH - 0.3), silkMat);
    pg.add(frameTop, frameBot, silk);
    /* 背板（防透视） */
    const back = new THREE.Mesh(new THREE.PlaneGeometry(panelW, panelH), matStd(ATLAS_PAL.woodDark, { roughness: 0.8 }));
    back.position.z = -0.1;
    back.rotation.y = Math.PI;
    pg.add(back);
    /* 底墩 */
    for (const sx of [-panelW / 2 + 0.6, panelW / 2 - 0.6]) {
      const foot = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.3, 0.8), matFrame);
      foot.position.set(sx, -panelH / 2 - 0.14, 0);
      pg.add(foot);
    }
    pg.rotation.y = rotY;
    return pg;
  };
  const pL = makePanel(41, 0.42);
  pL.position.set(-panelW * 0.86, panelH / 2 + 0.2, 1.5);
  const pC = makePanel(42, 0);
  pC.position.set(0, panelH / 2 + 0.2, 0);
  const pR = makePanel(43, -0.42);
  pR.position.set(panelW * 0.86, panelH / 2 + 0.2, 1.5);
  grp.add(pL, pC, pR);
  /* 合页（相邻扇上下各一枚） */
  const matBrass2 = matStd(PAL.brass, { roughness: 0.35, metalness: 0.8 });
  for (const [px2, pz, ry] of [
    [-panelW * 0.86 + panelW / 2 * Math.cos(0.42), 1.5 - panelW / 2 * Math.sin(0.42) * 0, 0.42],
    [panelW * 0.86 - panelW / 2 * Math.cos(0.42), 1.5, -0.42],
  ]) {
    for (const hy of [1.2, panelH - 1.2]) {
      const hinge = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.5, 0.08), matBrass2);
      hinge.position.set(px2, hy, pz);
      hinge.rotation.y = ry;
      grp.add(hinge);
    }
  }
  grp.position.set(0, -7, -DESK_HALF_D - 12);
  return grp;
}

/* 丝路驼队：放样驼身 + 双峰 + 驮货，沿丝路曲线循环行走 */
function buildCamelCaravan() {
  const grp = new THREE.Group();
  const rnd = seededRand(51);
  const matCamel = matStd(0x9a7448, { roughness: 0.88 });
  const matCargo = matStd(0x7a5a34, { roughness: 0.85 });
  const matCloth = matStd(0x8a4a38, { roughness: 0.9 });
  const makeCamel = () => {
    const bodyParts = [], cargoParts = [];
    /* 躯干：两段椭球拼接（胸 + 臀） */
    bodyParts.push(
      partOf(new THREE.SphereGeometry(0.34, 12, 9), -0.18, 0.85, 0, 0, 0, 0, 1.15, 0.9, 0.85),
      partOf(new THREE.SphereGeometry(0.3, 12, 9), 0.22, 0.87, 0, 0, 0, 0, 1.05, 0.85, 0.8),
    );
    /* 双峰 */
    bodyParts.push(
      partOf(new THREE.SphereGeometry(0.16, 10, 8), -0.14, 1.18, 0, 0, 0, 0, 1, 0.9, 0.95),
      partOf(new THREE.SphereGeometry(0.16, 10, 8), 0.24, 1.16, 0, 0, 0, 0, 1, 0.9, 0.95),
    );
    /* 颈（两段弯柱）+ 头 */
    bodyParts.push(
      partOf(new THREE.CylinderGeometry(0.09, 0.11, 0.5, 8), -0.42, 1.22, 0, 0, 0, -0.7),
      partOf(new THREE.CylinderGeometry(0.08, 0.09, 0.42, 8), -0.62, 1.5, 0, 0, 0, -0.25),
      partOf(new THREE.BoxGeometry(0.28, 0.16, 0.14), -0.78, 1.68, 0, 0, 0, 0.15),
    );
    /* 四肢（细柱，行走摆动由整体 bob 呈现） */
    for (const [lx, lz] of [[-0.34, 0.12], [-0.34, -0.12], [0.32, 0.12], [0.32, -0.12]]) {
      bodyParts.push(partOf(new THREE.CylinderGeometry(0.05, 0.06, 0.85, 7), lx, 0.43, lz));
    }
    /* 尾 */
    bodyParts.push(partOf(new THREE.CylinderGeometry(0.025, 0.035, 0.4, 6), 0.5, 0.85, 0, 0, 0, 1.2));
    /* 驮货：两侧货箱 + 顶布卷 + 系绳 */
    cargoParts.push(
      partOf(new THREE.BoxGeometry(0.3, 0.24, 0.22), -0.02, 1.28, 0.26),
      partOf(new THREE.BoxGeometry(0.3, 0.24, 0.22), -0.02, 1.28, -0.26),
      partOf(new THREE.CylinderGeometry(0.1, 0.1, 0.62, 8), -0.02, 1.38, 0, 0, 0, Math.PI / 2),
    );
    const camel = mergePartsToMesh(bodyParts, matCamel);
    const cargo = mergePartsToMesh(cargoParts, matCargo);
    const wrap = mergePartsToMesh([partOf(new THREE.BoxGeometry(0.64, 0.12, 0.62), -0.02, 1.14, 0)], matCloth);
    const g = new THREE.Group();
    g.add(camel, cargo, wrap);
    return g;
  };
  /* 丝路曲线：西域 → 河西 → 关中 */
  const silkRoad = [[80.5, 42.5], [86, 41.5], [92, 40.5], [98, 38.8], [103, 36.8], [106.5, 35.2], [108.7, 34.5]];
  const curve = riverCurveOf(silkRoad, 0.14);
  const camels = [];
  for (let i = 0; i < 4; i++) {
    const c = makeCamel();
    grp.add(c);
    camels.push({ grp: c, offset: i / 4, speed: 0.012 + rnd() * 0.003 });
  }
  return { grp, camels, curve };
}

/* 海商船两艘：小放样船沿东部海域航线巡航 */
function buildTraderShips() {
  const grp = new THREE.Group();
  const route = [[124.5, 38.5], [122.5, 35], [121, 31], [119.5, 27], [117.5, 23.5], [116, 21.5], [113.5, 21], [112, 22.5], [116, 23.5], [119, 26.5], [121.5, 30], [123.5, 34]];
  const curve = new THREE.CatmullRomCurve3(
    route.map(([lo, la]) => new THREE.Vector3(
      (lo - (LON0 + LON1) / 2) * WSC, 0.14, ((LAT0 + LAT1) / 2 - la) * WSC * 0.92,
    )),
    true, 'catmullrom', 0.4,
  );
  const ships = [];
  for (let i = 0; i < 2; i++) {
    const ship = makeWarShip({
      len: 1.05, wid: 0.34, hgt: 0.24,
      hullColor: 0x8a6238, sailChar: '商', sailBg: '#e0d2a8', sailFg: '#5a3a1a',
    });
    grp.add(ship.grp);
    ships.push({ grp: ship.grp, offset: i * 0.5, speed: 0.01 });
  }
  return { grp, ships, curve };
}


/* ---------------- 叙事层 II：随期显隐的历史地理要素 ----------------
 * 驰道（秦）/ 灵渠（秦）/ 蜀道栈道（三国）/ 运河漕船（隋唐）/ 海上丝路（唐·明）/
 * 和亲路线（唐）/ 关城与空心敌楼（明）/ 烽烟 / 都护府旗阵 —— 全部贴地放样、真实调用。 */

const NARR = { groups: {} };   /* id -> { grp, mats, seasons:[期...], boats? } */

function registerNarrative(id, grp, mats, seasons, extra = {}) {
  /* 记录目标透明度并立即预隐藏（防止基准被初值 0 污染） */
  for (const m of mats) {
    if (m && m.opacity !== undefined) {
      /* 构建时写 0 的材质按 0.9 记基准（0 本意是「初始隐藏」而非「透明设计值」） */
      m.userData.baseOp = m.opacity > 0 ? m.opacity : 0.9;
      m.opacity = 0;
    }
  }
  grp.visible = false;
  scene.add(grp);
  NARR.groups[id] = { grp, mats, seasons, ...extra };
}

/* 沿经纬点列生成贴地曲线（复用 riverCurveOf，抬升可调） */
/* 驰道路面贴图：土色 + 两道车辙 + 横向修补缝 */
function makeRoadTexture(seed = 77) {
  return canvasTex(256, 128, (c, W, Hh) => {
    c.fillStyle = '#a08658';
    c.fillRect(0, 0, W, Hh);
    const rnd = seededRand(seed);
    for (let i = 0; i < 400; i++) {
      c.fillStyle = rnd() > 0.5 ? 'rgba(90,70,40,0.16)' : 'rgba(210,190,140,0.14)';
      c.fillRect(rnd() * W, rnd() * Hh, 3 + rnd() * 7, 2 + rnd() * 3);
    }
    /* 两道车辙（磨亮的浅色条） */
    for (const y of [Hh * 0.32, Hh * 0.68]) {
      c.fillStyle = 'rgba(196,172,120,0.55)';
      c.fillRect(0, y - 5, W, 10);
      c.fillStyle = 'rgba(120,96,58,0.4)';
      c.fillRect(0, y - 5, W, 2);
      c.fillRect(0, y + 3, W, 2);
    }
    /* 横向修补缝 */
    for (let i = 0; i < 5; i++) {
      const x = rnd() * W;
      c.fillStyle = 'rgba(84,64,36,0.5)';
      c.fillRect(x, 0, 3 + rnd() * 3, Hh);
    }
  }, { repeat: true });
}

/* 路面扁带放样：沿曲线每步一段，横向量展开成带 */
function makeRoadRibbon(curve, width, mat, steps = 90) {
  const pts = curve.getSpacedPoints(steps);
  const positions = [], uvs = [], indices = [];
  const up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i <= steps; i++) {
    const p = pts[i];
    const p2 = pts[Math.min(i + 1, steps)];
    const tan = new THREE.Vector3().subVectors(p2, p).normalize();
    const side = new THREE.Vector3().crossVectors(tan, up).normalize();
    positions.push(
      p.x - side.x * width / 2, p.y + 0.03, p.z - side.z * width / 2,
      p.x + side.x * width / 2, p.y + 0.03, p.z + side.z * width / 2,
    );
    uvs.push(i / steps * 10, 0, i / steps * 10, 1);
    if (i > 0) {
      const o = (i - 1) * 2;
      indices.push(o, o + 2, o + 1, o + 1, o + 2, o + 3);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, mat);
  mesh.renderOrder = 3;
  return mesh;
}

/* 驿亭：底座 + 四柱 + 十字脊攒尖顶 + 匾 */
function makePostPavilion() {
  const g = new THREE.Group();
  const matWood2 = matStd(ATLAS_PAL.woodDark, { roughness: 0.7 });
  const matRoofT = matStd(0x5a4a38, { roughness: 0.75 });
  const plat = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.14, 0.9), matStd(ATLAS_PAL.stone, { roughness: 0.85 }));
  plat.position.y = 0.07;
  g.add(plat);
  const poleGeo = new THREE.CylinderGeometry(0.045, 0.05, 0.7, 8);
  for (const [px2, pz] of [[0.32, 0.32], [0.32, -0.32], [-0.32, 0.32], [-0.32, -0.32]]) {
    const pole = new THREE.Mesh(poleGeo, matWood2);
    pole.position.set(px2, 0.5, pz);
    g.add(pole);
  }
  /* 十字脊：两片交叉坡顶 + 顶珠 */
  for (const ry of [0, Math.PI / 2]) {
    const ridge = new THREE.Mesh(new THREE.CylinderGeometry(0.78, 0.78, 0.14, 4), matRoofT);
    ridge.rotation.y = ry + Math.PI / 4;
    ridge.scale.y = 0.22;
    ridge.position.y = 1.02;
    g.add(ridge);
  }
  const orb = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), matStd(PAL.brass, { roughness: 0.35, metalness: 0.8 }));
  orb.position.y = 1.16;
  g.add(orb);
  const plaque = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.16), new THREE.MeshStandardMaterial({
    map: makeLabelTexture(['驿'], { w: 96, h: 48, accent: '#6e4a20' }), roughness: 0.7,
  }));
  plaque.position.set(0, 0.85, 0.36);
  g.add(plaque);
  return g;
}

/* 秦驰道：咸阳放射四道 + 驿亭六座 + 里程碑石桩 */
function buildPostRoads() {
  const grp = new THREE.Group();
  const mats = [];
  const roadTex = makeRoadTexture(82);
  roadTex.repeat.set(3, 1);
  const matRoad = new THREE.MeshStandardMaterial({ map: roadTex, roughness: 0.92, transparent: true, opacity: 0.95 });
  mats.push(matRoad);
  const spokes = [
    [[108.6, 34.35], [110.2, 36.6], [112.4, 38.8], [114.8, 40.6]],          // 北出（九原方向）
    [[108.6, 34.35], [111.8, 34.2], [114.8, 34.6], [117.6, 35.2]],          // 东通（函谷方向）
    [[108.6, 34.35], [107.4, 32.4], [106.4, 30.2], [106.6, 27.8]],          // 南下（武关→南郡）
    [[108.6, 34.35], [106.2, 34.8], [103.8, 35.4], [101.6, 36.2]],          // 西行（陇西方向）
  ];
  const mileGeo = new THREE.CylinderGeometry(0.09, 0.12, 0.5, 6);
  const mileMat = matStd(ATLAS_PAL.stoneDark, { roughness: 0.9 });
  mats.push(mileMat);
  const mileCount = 40;
  const milestones = new THREE.InstancedMesh(mileGeo, mileMat, mileCount);
  let mi = 0;
  const m4 = new THREE.Matrix4();
  const pavilions = [];
  const pavilionSpots = [
    [110.6, 35.6], [113.4, 39.0], [112.2, 34.3], [116.2, 34.9], [106.8, 31.2], [104.4, 35.6],
  ];
  for (const spoke of spokes) {
    const curve = riverCurveOf(spoke, 0.05);
    grp.add(makeRoadRibbon(curve, 0.85, matRoad, 70));
    /* 里程碑：沿线每 14 步 */
    const sp = curve.getSpacedPoints(70);
    for (let k = 6; k < 70; k += 14) {
      if (mi >= mileCount) break;
      const p = sp[k];
      m4.makeTranslation(p.x, p.y + 0.22, p.z);
      milestones.setMatrixAt(mi++, m4);
    }
  }
  milestones.count = mi;
  milestones.instanceMatrix.needsUpdate = true;
  grp.add(milestones);
  for (const [lo, la] of pavilionSpots) {
    const pav = makePostPavilion();
    pav.position.set((lo - 106) * WSC, groundY(lo, la) + 0.02, (34 - la) * WSC * 0.92);
    grp.add(pav);
    pavilions.push(pav);
  }
  registerNarrative('roads', grp, mats, [0, 1, 2]);
}

/* 灵渠（秦，沟通湘漓）：短运河管 + 分水铧嘴 + 陡门三座 */
function buildLingquCanal() {
  const grp = new THREE.Group();
  const mats = [];
  const curve = riverCurveOf([[110.2, 25.6], [110.9, 25.2], [111.2, 24.6], [110.8, 24.1]], 0.09);
  const matCanal = new THREE.MeshStandardMaterial({
    color: ATLAS_PAL.canalGlow, roughness: 0.3, transparent: true, opacity: 0.0,
    emissive: new THREE.Color(ATLAS_PAL.canalGlow), emissiveIntensity: 0,
  });
  mats.push(matCanal);
  const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 70, 0.1, 7, false), matCanal);
  tube.renderOrder = 3;
  grp.add(tube);
  /* 铧嘴：分水尖锥（兴安附近） */
  const matStone = matStd(ATLAS_PAL.stone, { roughness: 0.8 });
  mats.push(matStone);
  const spout = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.6, 8), matStone);
  const sw = lonlatToWorld(110.6, 25.05);
  spout.position.set(sw.x, groundY(110.6, 25.05) + 0.2, sw.z);
  spout.rotation.z = 0.7;
  grp.add(spout);
  /* 陡门三座：小闸墩对 */
  for (const [lo, la] of [[110.85, 25.1], [111.05, 24.85], [111.15, 24.5]]) {
    for (const sgn of [-1, 1]) {
      const w = lonlatToWorld(lo + sgn * 0.055, la);
      const pier = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.28, 0.16), matStone);
      pier.position.set(w.x, groundY(lo, la) + 0.14, w.z);
      grp.add(pier);
    }
  }
  registerNarrative('lingqu', grp, mats, [0, 1, 2]);
}

/* 蜀道栈道（金牛道）：木梁悬挑带 + 支柱 + 栏杆 + 危石 */
function buildPlankRoad() {
  const grp = new THREE.Group();
  const mats = [];
  const curve = riverCurveOf([[106.3, 34.3], [105.6, 33.6], [105.1, 32.8], [104.6, 32.1], [104.1, 31.3], [104, 30.7]], 0.16);
  const plankTex = makeWoodTexture({ base: '#8a6238', dark: '#6a4626', light: '#a67e4e', seed: 14, planks: 6 });
  plankTex.repeat.set(6, 1);
  const matPlank = new THREE.MeshStandardMaterial({ map: plankTex, roughness: 0.82, transparent: true, opacity: 0.95 });
  mats.push(matPlank);
  const matWood2 = matStd(ATLAS_PAL.woodDark, { roughness: 0.78, transparent: true, opacity: 0.95 });
  mats.push(matWood2);
  grp.add(makeRoadRibbon(curve, 0.5, matPlank, 110));
  /* 支柱：沿线下插到地形（悬挑栈道语境），每 6 步一对 */
  const pts = curve.getSpacedPoints(110);
  const propGeo = new THREE.CylinderGeometry(0.045, 0.06, 1, 6);
  const props = new THREE.InstancedMesh(propGeo, matWood2, 40);
  const m4 = new THREE.Matrix4();
  let pi = 0;
  for (let k = 4; k < 110; k += 6) {
    if (pi >= 40) break;
    const p = pts[k];
    const gY = worldHeightAt(p.x, p.z);
    const len = Math.max(p.y - gY + 0.05, 0.2);
    m4.compose(
      new THREE.Vector3(p.x, p.y - len / 2 + 0.02, p.z),
      new THREE.Quaternion(),
      new THREE.Vector3(1, len, 1),
    );
    props.setMatrixAt(pi++, m4);
  }
  props.count = pi;
  props.instanceMatrix.needsUpdate = true;
  grp.add(props);
  /* 栏杆：外侧扶手条（沿曲线上方细 tube） */
  const railPts = pts.map((p) => new THREE.Vector3(p.x, p.y + 0.3, p.z));
  const rail = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(railPts), 90, 0.028, 6, false), matWood2);
  grp.add(rail);
  /* 危石：栈道旁三块落石 */
  const matRock = matStd(0x7a7264, { roughness: 0.95 });
  mats.push(matRock);
  for (const [k, s] of [[22, 1.1], [58, 0.8], [92, 1.3]]) {
    const p = pts[k];
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.3 * s, 0), matRock);
    rock.position.set(p.x + 0.5, p.y - 0.15, p.z + 0.4);
    rock.rotation.set(0.4, 1.2, 0.2);
    grp.add(rock);
  }
  registerNarrative('plank', grp, mats, [3, 4, 5]);
}

/* 运河漕船：三艘小漕船沿通济渠循环（随运河期显隐，行进由主循环驱动） */
function buildCanalBoats() {
  const grp = new THREE.Group();
  const curve = riverCurveOf(CANALS[1], 0.12);
  const boats = [];
  for (let i = 0; i < 3; i++) {
    const ship = makeWarShip({
      len: 0.95, wid: 0.3, hgt: 0.22,
      hullColor: 0x7a5a34, sailChar: '漕', sailBg: '#d8cba0', sailFg: '#4a3818',
    });
    ship.grp.scale.setScalar(0.8);
    grp.add(ship.grp);
    boats.push({ grp: ship.grp, offset: i / 3, speed: 0.014 });
  }
  registerNarrative('canalBoats', grp, [], [7, 8, 9], { boats, curve });
}

/* 海上丝路：航路虚线管 + 宝船 + 流动光点（唐前期 / 唐后期 / 明） */
function buildSilkSeaRoute() {
  const grp = new THREE.Group();
  const mats = [];
  const route = [[113.2, 23.1], [116.8, 20.6], [121, 17.8], [126.5, 14.5], [132, 12], [137, 10.5], [141.5, 9.5]];
  const curve = new THREE.CatmullRomCurve3(route.map(([lo, la]) => new THREE.Vector3(
    (lo - 106) * WSC, 0.16, (34 - la) * WSC * 0.92,
  )), false, 'catmullrom', 0.4);
  const matRoute = new THREE.MeshStandardMaterial({
    color: 0xd8ecf2, roughness: 0.4, transparent: true, opacity: 0,
    emissive: new THREE.Color(0xbfe0ec), emissiveIntensity: 0,
  });
  mats.push(matRoute);
  /* 虚线感：多段短管拼串 */
  const segs = 90;
  const pts = curve.getSpacedPoints(segs);
  for (let k = 0; k < segs - 4; k += 6) {
    const segCurve = new THREE.CatmullRomCurve3(pts.slice(k, k + 4));
    const seg = new THREE.Mesh(new THREE.TubeGeometry(segCurve, 6, 0.075, 5, false), matRoute);
    grp.add(seg);
  }
  /* 宝船：大帆船沿线缓行 */
  const ship = makeWarShip({
    len: 2.3, wid: 0.66, hgt: 0.48,
    hullColor: 0x8a5a34, sailChar: '宝', sailBg: '#e0d0a2', sailFg: '#7a2418',
  });
  ship.grp.scale.setScalar(1.1);
  grp.add(ship.grp);
  /* 流动光点：8 枚小 glow 沿航路循环 */
  const dots = [];
  for (let i = 0; i < 8; i++) {
    const d = new THREE.Sprite(new THREE.SpriteMaterial({
      map: makeGlowTexture('214,236,242'), transparent: true, opacity: 0, depthWrite: false,
    }));
    d.scale.set(0.5, 0.5, 1);
    grp.add(d);
    dots.push(d);
  }
  /* 护航小船队：明期两艘随行（郑和船队语境） */
  const escorts = [];
  for (let i = 0; i < 2; i++) {
    const e = makeWarShip({
      len: 1.5, wid: 0.44, hgt: 0.3,
      hullColor: 0x7a4e2c, sailChar: '队', sailBg: '#d4c49a', sailFg: '#6e2a18',
    });
    e.grp.scale.setScalar(0.9);
    e.grp.visible = false;
    grp.add(e.grp);
    escorts.push(e.grp);
  }
  registerNarrative('seaRoute', grp, mats, [8, 9, 14], { ship, curve, dots, escorts });
}

/* 唐蕃和亲路线：长安 → 河源 → 逻些 弧线彩带 + 经幡柱三座 */
function buildHeqinRoute() {
  const grp = new THREE.Group();
  const mats = [];
  const way = [[108.7, 34.3], [106.2, 35.4], [103.4, 36.2], [101.6, 36.6], [98.6, 35.2], [96, 33.2], [93.5, 31.4], [91.2, 29.8]];
  const pts = way.map(([lo, la]) => new THREE.Vector3(
    (lo - 106) * WSC, groundY(lo, la) + 0.9, (34 - la) * WSC * 0.92,
  ));
  const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.5);
  const matRoute = new THREE.MeshStandardMaterial({
    color: 0xc85a78, roughness: 0.5, transparent: true, opacity: 0,
    emissive: new THREE.Color(0xc85a78), emissiveIntensity: 0,
  });
  mats.push(matRoute);
  const ribbon = new THREE.Mesh(new THREE.TubeGeometry(curve, 130, 0.065, 6, false), matRoute);
  grp.add(ribbon);
  /* 经幡柱：柱 + 顶部红黄蓝三色小旗 */
  const matPole = matStd(ATLAS_PAL.woodDark, { roughness: 0.75, transparent: true, opacity: 0 });
  mats.push(matPole);
  const flagCols = ['#d84a30', '#e8c84a', '#4a7ad8'];
  const flagMats = flagCols.map((col) => matStd(col, { roughness: 0.85, transparent: true, opacity: 0 }));
  mats.push(...flagMats);
  for (const t of [0.24, 0.52, 0.8]) {
    const p = curve.getPointAt(t);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 1.3, 7), matPole);
    pole.position.set(p.x, worldHeightAt(p.x, p.z) + 0.65, p.z);
    grp.add(pole);
    flagCols.forEach((_, fi2) => {
      const fl = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.14), flagMats[fi2]);
      fl.position.set(p.x + 0.1 + fi2 * 0.12, worldHeightAt(p.x, p.z) + 1.16 - fi2 * 0.13, p.z);
      fl.rotation.y = 0.6;
      grp.add(fl);
    });
  }
  registerNarrative('heqin', grp, mats, [8]);
}

/* 明长城两端关城：门楼 + 两侧短墙 + 关匾（期 14，随明墙显隐） */
function buildPassFortresses() {
  const grp = new THREE.Group();
  const mats = [];
  const buildPass = (name, lon, lat, heading) => {
    const local = new THREE.Group();
    const tower = makeGateTower('明', { scale: 0.78, accent: '#a03828' });
    local.add(tower.grp);
    /* 两侧短墙：从门楼向两侧延伸 3.2 单位的小墙体（复用梯形截面扫掠） */
    const wallPts = [];
    for (let k = -4; k <= 4; k++) {
      const lo = lon + k * 0.075 * Math.cos(heading);
      const la = lat + k * 0.075 * Math.sin(heading);
      wallPts.push(new THREE.Vector3(
        (lo - 106) * WSC, groundY(lo, la) + 0.1, (34 - la) * WSC * 0.92,
      ));
    }
    const positions = [], uvs = [], indices = [];
    const up = new THREE.Vector3(0, 1, 0);
    const brickTex = makeBrickTexture(88);
    brickTex.repeat.set(2, 1);
    const matWall = new THREE.MeshStandardMaterial({ map: brickTex, roughness: 0.9, transparent: true, opacity: 0 });
    mats.push(matWall);
    const W_BOT = 0.8, H_WALL = 0.42;
    const n = wallPts.length;
    for (let i = 0; i < n; i++) {
      const p = wallPts[i];
      const p2 = wallPts[Math.min(i + 1, n - 1)];
      const tan = new THREE.Vector3().subVectors(p2, p).normalize();
      const side = new THREE.Vector3().crossVectors(tan, up).normalize();
      const yBase = p.y, yTop = p.y + H_WALL;
      positions.push(
        p.x - side.x * W_BOT / 2, yBase, p.z - side.z * W_BOT / 2,
        p.x + side.x * W_BOT / 2, yBase, p.z + side.z * W_BOT / 2,
        p.x + side.x * W_BOT * 0.3, yTop, p.z + side.z * W_BOT * 0.3,
        p.x - side.x * W_BOT * 0.3, yTop, p.z - side.z * W_BOT * 0.3,
      );
      uvs.push(i / n * 5, 0, i / n * 5, 1, i / n * 5, 1, i / n * 5, 0);
      if (i > 0) {
        const o = (i - 1) * 4;
        indices.push(o, o + 4, o + 1, o + 1, o + 4, o + 5);
        indices.push(o + 1, o + 5, o + 2, o + 2, o + 5, o + 6);
        indices.push(o + 2, o + 6, o + 3, o + 3, o + 6, o + 7);
        indices.push(o + 3, o + 7, o, o, o + 7, o + 4);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    local.add(new THREE.Mesh(geo, matWall));
    /* 关匾 */
    const plaque = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.2), new THREE.MeshStandardMaterial({
      map: makeLabelTexture([name], { w: 160, h: 56, accent: '#8a3a1e' }), roughness: 0.7, transparent: true, opacity: 0,
    }));
    mats.push(plaque.material);
    plaque.position.set(0, 0.62, 0.85 * 0.78 + 0.03);
    plaque.scale.setScalar(0.9);
    local.add(plaque);
    const w = lonlatToWorld(lon, lat);
    local.position.set(w.x, groundY(lon, lat) + 0.03, w.z);
    local.rotation.y = -heading + Math.PI / 2;
    grp.add(local);
    return local;
  };
  /* 东端山海关（示意位置取明墙东端内侧）、西端嘉峪关（明墙西端） */
  buildPass('山海关', 120.1, 40.9, -0.5);
  buildPass('嘉峪关', 98.6, 39.6, 0.35);
  registerNarrative('passes', grp, mats, [14]);
}

/* 明长城空心敌楼：券门 + 箭窗三孔 + 楼橹顶（东段四座） */
function buildTowerKeeps() {
  const grp = new THREE.Group();
  const mats = [];
  const brickTex = makeBrickTexture(95);
  const matBody = new THREE.MeshStandardMaterial({ map: brickTex, roughness: 0.9, transparent: true, opacity: 0 });
  const matDark = matStd(ATLAS_PAL.wallDark, { roughness: 0.92, transparent: true, opacity: 0 });
  const matWood2 = matStd(ATLAS_PAL.woodDark, { roughness: 0.8, transparent: true, opacity: 0 });
  mats.push(matBody, matDark, matWood2);
  const wall = PERIODS[14].wall;
  const sample = (t) => {
    const seg = Math.min((t * (wall.length - 1)) | 0, wall.length - 2);
    const f = t * (wall.length - 1) - seg;
    const a = wall[seg], b = wall[seg + 1];
    return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
  };
  for (const t of [0.24, 0.42, 0.6, 0.8]) {
    const [lo, la] = sample(t);
    const w = lonlatToWorld(lo, la);
    const gY = groundY(lo, la);
    const g = new THREE.Group();
    g.position.set(w.x, gY + 0.06, w.z);
    g.rotation.y = hash2((t * 100) | 0, 3, 7) * 0.6;
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.9, 0.95), matBody);
    body.position.y = 0.45;
    /* 券门（南面拱框） */
    const gate = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.4), matDark);
    gate.position.set(0, 0.3, 0.485);
    const arch2 = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.035, 8, 16, Math.PI), matDark);
    arch2.position.set(0, 0.5, 0.487);
    /* 箭窗三孔（北面） */
    for (const wx of [-0.32, 0, 0.32]) {
      const win = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.18), matDark);
      win.position.set(wx, 0.6, -0.485);
      g.add(win);
    }
    const crown = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.12, 1.12), matDark);
    crown.position.y = 0.96;
    /* 楼橹小顶（双坡） */
    const roofKeep = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.62, 0.3, 4), matWood2);
    roofKeep.rotation.y = Math.PI / 4;
    roofKeep.scale.y = 0.5;
    roofKeep.position.y = 1.16;
    g.add(body, gate, arch2, crown, roofKeep);
    grp.add(g);
  }
  registerNarrative('keeps', grp, mats, [14]);
}

/* 烽烟：明墙三座烽火台青烟粒子（随明墙显隐） */
function buildBeaconSmoke() {
  const grp = new THREE.Group();
  const puffs = [];
  const wall = PERIODS[14].wall;
  for (const t of [0.3, 0.55, 0.8]) {
    const seg = Math.min((t * (wall.length - 1)) | 0, wall.length - 2);
    const f = t * (wall.length - 1) - seg;
    const a = wall[seg], b = wall[seg + 1];
    const lo = a[0] + (b[0] - a[0]) * f, la = a[1] + (b[1] - a[1]) * f;
    const burst = makeParticleBurst({
      count: 36, seed: 31 + ((t * 10) | 0), rise: 3.4, spread: 0.22, size: 30, speed: 0.1,
      color: '#a8acb4',
    });
    const w = lonlatToWorld(lo, la);
    burst.mat.uniforms.uOrigin.value.set(w.x, groundY(lo, la) + 2.1, w.z);
    burst.mat.blending = THREE.NormalBlending;
    burst.pts.renderOrder = 5;
    grp.add(burst.pts);
    puffs.push(burst);
  }
  grp.visible = false;
  scene.add(grp);
  NARR.groups.beaconSmoke = { grp, mats: puffs.map((p) => p.mat), seasons: [14], puffs, linked: 'wall' };
}

/* 桌面文物组：青铜方鼎 + 铜钱串 + 竹简函 */
function buildRelicSet() {
  const grp = new THREE.Group();
  const matBronzePatina = matStd(0x5e7a5a, { roughness: 0.55, metalness: 0.45 });
  const matBronzeDark = matStd(0x44583e, { roughness: 0.6, metalness: 0.4 });
  /* 方鼎：鼎身 + 四柱足 + 双立耳 + 饰带 */
  const ding = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.44, 0.5), matBronzePatina);
  body.position.y = 0.4;
  ding.add(body);
  for (const [fx, fz] of [[0.2, 0.17], [0.2, -0.17], [-0.2, 0.17], [-0.2, -0.17]]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.07, 0.3, 8), matBronzeDark);
    leg.position.set(fx, 0.15, fz);
    ding.add(leg);
  }
  for (const sx of [-0.2, 0.2]) {
    const ear = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.026, 8, 12, Math.PI), matBronzeDark);
    ear.position.set(sx, 0.66, 0);
    ding.add(ear);
  }
  /* 饰带：回纹贴图环（四面） */
  const bandCv = document.createElement('canvas');
  bandCv.width = 256; bandCv.height = 64;
  const bc = bandCv.getContext('2d');
  bc.fillStyle = '#44583e';
  bc.fillRect(0, 0, 256, 64);
  bc.strokeStyle = '#9ab886';
  bc.lineWidth = 3;
  for (let x = 8; x < 250; x += 22) {
    bc.beginPath();
    bc.moveTo(x, 44);
    bc.lineTo(x + 8, 44);
    bc.lineTo(x + 8, 24);
    bc.lineTo(x + 16, 24);
    bc.lineTo(x + 16, 44);
    bc.stroke();
    bc.beginPath();
    bc.arc(x + 4, 14, 4, 0, Math.PI * 2);
    bc.stroke();
  }
  const bandTex = new THREE.CanvasTexture(bandCv);
  bandTex.colorSpace = THREE.SRGBColorSpace;
  const matBand = new THREE.MeshStandardMaterial({ map: bandTex, roughness: 0.55, metalness: 0.4 });
  const band = new THREE.Mesh(new THREE.BoxGeometry(0.615, 0.14, 0.515), matBand);
  band.position.y = 0.54;
  ding.add(band);
  ding.position.set(-DESK_HALF_W + 7.5, 0, DESK_HALF_D - 20);
  ding.rotation.y = 0.5;
  grp.add(ding);
  /* 铜钱串：12 枚方孔钱贴图薄片沿垂链排列 + 绳 */
  const coinTex = canvasTex(64, 64, (c, S) => {
    c.fillStyle = '#b8934e';
    c.beginPath(); c.arc(S / 2, S / 2, 30, 0, TAU); c.fill();
    c.fillStyle = '#8a6a34';
    c.fillRect(S / 2 - 8, S / 2 - 8, 16, 16);
    c.strokeStyle = 'rgba(90,64,20,0.8)';
    c.lineWidth = 3;
    c.beginPath(); c.arc(S / 2, S / 2, 28, 0, TAU); c.stroke();
  });
  const matCoin = new THREE.MeshStandardMaterial({ map: coinTex, roughness: 0.4, metalness: 0.7, side: THREE.DoubleSide });
  const coinGeo = new THREE.CircleGeometry(0.11, 18);
  const coins = new THREE.InstancedMesh(coinGeo, matCoin, 12);
  {
    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0));
    for (let i = 0; i < 12; i++) {
      const sag = Math.sin(i / 11 * Math.PI) * 0.14;
      m4.compose(
        new THREE.Vector3(-DESK_HALF_W + 5 + i * 0.17, 0.16 - sag + 0.14, DESK_HALF_D - 21.6),
        q,
        new THREE.Vector3(1, 1, 1),
      );
      coins.setMatrixAt(i, m4);
    }
    coins.instanceMatrix.needsUpdate = true;
  }
  grp.add(coins);
  /* 串绳 */
  const ropePts = [];
  for (let i = 0; i <= 12; i++) {
    ropePts.push(new THREE.Vector3(-DESK_HALF_W + 4.4 + i * 0.17, 0.31 - Math.sin(i / 12 * Math.PI) * 0.14, DESK_HALF_D - 21.6));
  }
  grp.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ropePts), 24, 0.014, 5, false), matStd('#6a4a2a', { roughness: 0.8 })));
  /* 竹简函：简条横排 + 编绳两道 + 函套底 */
  const slipGeo = new THREE.BoxGeometry(0.05, 0.028, 0.62);
  const matSlip = matStd('#c8b088', { roughness: 0.8 });
  const slips = new THREE.InstancedMesh(slipGeo, matSlip, 22);
  {
    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0.3, 0));
    for (let i = 0; i < 22; i++) {
      m4.compose(new THREE.Vector3(DESK_HALF_W - 12 + i * 0.062, 0.16, -DESK_HALF_D + 16), q, new THREE.Vector3(1, 1, 1));
      slips.setMatrixAt(i, m4);
    }
    slips.instanceMatrix.needsUpdate = true;
  }
  grp.add(slips);
  for (const cy of [-0.16, 0.16]) {
    const cord = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.012, 0.03), matStd('#7a5a3a', { roughness: 0.85 }));
    cord.rotation.y = -0.3;
    cord.position.set(DESK_HALF_W - 11.35, 0.178, -DESK_HALF_D + 16 + cy * Math.cos(0.3));
    grp.add(cord);
  }
  const shadow = makeContactShadow(2.2, 0.4);
  shadow.position.set(-DESK_HALF_W + 6.5, 0.012, DESK_HALF_D - 20.5);
  grp.add(shadow);
  G.props.add(grp);
  return grp;
}

/* 环形年表盘：桌前缘刻度长卷 + 指针随时间轴滑动（教学联动） */
function buildTimelineBar() {
  const grp = new THREE.Group();
  const W2 = 54, Hh = 1.6;
  const cv = document.createElement('canvas');
  cv.width = 1024; cv.height = 48;
  const c = cv.getContext('2d');
  c.fillStyle = '#3a2c1c';
  c.fillRect(0, 0, cv.width, cv.height);
  c.strokeStyle = 'rgba(216,196,150,0.9)';
  c.lineWidth = 2;
  c.strokeRect(3, 3, cv.width - 6, cv.height - 6);
  const n = PERIODS.length;
  c.font = '600 13px "PingFang SC", sans-serif';
  c.textAlign = 'center';
  for (let i = 0; i < n; i++) {
    const x = 22 + i / (n - 1) * (cv.width - 44);
    const major = i % 4 === 0;
    c.strokeStyle = major ? 'rgba(232,212,160,0.95)' : 'rgba(180,158,110,0.7)';
    c.lineWidth = major ? 2.4 : 1.4;
    c.beginPath(); c.moveTo(x, 8); c.lineTo(x, major ? 24 : 18); c.stroke();
    if (major) {
      c.fillStyle = 'rgba(232,212,160,0.95)';
      c.fillText(String(i + 1).padStart(2, '0'), x, 40);
    }
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  const bar = new THREE.Mesh(new THREE.BoxGeometry(W2, 0.5, Hh), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7 }));
  bar.position.set(0, 0.25, DESK_HALF_D - 2.2);
  /* 顶面印刻度（侧面木色） */
  bar.material = [matStd(ATLAS_PAL.woodDark, { roughness: 0.7 }), matStd(ATLAS_PAL.woodDark, { roughness: 0.7 }), matStd(ATLAS_PAL.woodDark, { roughness: 0.7 }), matStd(ATLAS_PAL.woodDark, { roughness: 0.7 }), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7 }), matStd(ATLAS_PAL.woodDark, { roughness: 0.7 })];
  grp.add(bar);
  /* 指针：朱色小旗标，主循环随 state.time 滑动 */
  const needle = new THREE.Group();
  const stem = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.5, 0.09), matStd(ATLAS_PAL.cinnabar, { roughness: 0.5 }));
  stem.position.y = 0.55;
  const head = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.3, 4), matStd(ATLAS_PAL.cinnabar, { roughness: 0.5 }));
  head.rotation.x = Math.PI;
  head.position.y = 0.95;
  needle.add(stem, head);
  needle.position.set(-W2 / 2 + 1, 0.5, DESK_HALF_D - 2.2);
  grp.add(needle);
  G.props.add(grp);
  return { needle, W2 };
}

/* 都护府旗阵：石碑四周一圈六杆小旗（挂进都城组） */
function buildGarrisonFlags(lon, lat) {
  const grp = new THREE.Group();
  const matPole = matStd(ATLAS_PAL.woodDark, { roughness: 0.75 });
  const matFlag = matStd('#b8542e', { roughness: 0.85, side: THREE.DoubleSide });
  const flagGeo = new THREE.BufferGeometry();
  flagGeo.setAttribute('position', new THREE.Float32BufferAttribute([
    0, 0, 0, 0.26, -0.045, 0, 0, -0.17, 0,
  ], 3));
  flagGeo.computeVertexNormals();
  for (let i = 0; i < 6; i++) {
    const a = i / 6 * TAU;
    const r = 0.95;
    const lo = lon + Math.cos(a) * r * 0.05;
    const la = lat + Math.sin(a) * r * 0.05;
    const w = lonlatToWorld(lo, la);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.026, 0.7, 6), matPole);
    pole.position.set(w.x, groundY(lo, la) + 0.35, w.z);
    const fl = new THREE.Mesh(flagGeo, matFlag);
    fl.position.set(w.x, groundY(lo, la) + 0.62, w.z);
    fl.rotation.y = -a + Math.PI / 2;
    grp.add(pole, fl);
  }
  return grp;
}

/* 叙事层调度：按期淡入淡出 + 行进件推进（漕船/宝船/光点/烽烟） */
function narrativeTick(dt) {
  const fi = Math.floor(state.time);
  for (const [id, rec] of Object.entries(NARR.groups)) {
    if (rec.linked === 'wall') {
      /* 烽烟跟随明墙开关 */
      const want = fi === 14;
      const op = dampTo(rec.mats[0].opacity ?? 0, want ? 1 : 0, dt, 4);
      rec.grp.visible = op > 0.02;
      for (const p of rec.puffs) {
        p.mat.uniforms.uTime.value = state.clock;
        p.mat.uniforms.uSize.value = 26 * op;
      }
      continue;
    }
    const want = rec.seasons.includes(fi) ? 1 : 0;
    if (rec.toggleOnly) { rec.grp.visible = want === 1; continue; }
    let op = 0;
    for (const m of rec.mats) {
      if (!m || m.opacity === undefined) continue;
      const target = m.userData.baseOp ?? m.opacity;
      m.opacity = dampTo(m.opacity, want ? target : 0, dt, 4);
      if (m.emissiveIntensity !== undefined && m.emissive && m.userData.baseEmissive === undefined) {
        m.userData.baseEmissive = m.emissiveIntensity;
      }
      if (m.emissiveIntensity !== undefined && m.emissive) {
        m.emissiveIntensity = dampTo(m.emissiveIntensity, want ? m.userData.baseEmissive : 0, dt, 4);
      }
      op = m.opacity;
    }
    rec.grp.visible = op > 0.02 || (want === 1);
    /* 行进件 */
    if (rec.boats) {
      for (const b of rec.boats) {
        const u = (state.clock * b.speed + b.offset) % 1;
        rec.curve.getPointAt(u, tmpV);
        b.grp.position.set(tmpV.x, tmpV.y + 0.02, tmpV.z);
        const ahead = rec.curve.getPointAt((u + 0.005) % 1, new THREE.Vector3());
        b.grp.lookAt(ahead);
      }
    }
    if (rec.ship) {
      const u = (state.clock * 0.008) % 1;
      rec.curve.getPointAt(u, tmpV);
      rec.ship.grp.position.set(tmpV.x, 0.2, tmpV.z);
      const ahead = rec.curve.getPointAt((u + 0.006) % 1, new THREE.Vector3());
      rec.ship.grp.lookAt(ahead.x, 0.2, ahead.z);
      rec.ship.grp.rotation.x = Math.sin(state.clock * 1.4) * 0.04;
      rec.escorts.forEach((eg, ei2) => {
        eg.visible = fi === 14;
        if (!eg.visible) return;
        const eu = (u - 0.012 * (ei2 + 1) + 1) % 1;
        rec.curve.getPointAt(eu, tmpV);
        eg.position.set(tmpV.x, 0.22, tmpV.z);
        const eahead = rec.curve.getPointAt((eu + 0.006) % 1, new THREE.Vector3());
        eg.lookAt(eahead.x, 0.22, eahead.z);
      });
      rec.dots.forEach((d, di2) => {
        const du = (state.clock * 0.02 + di2 / rec.dots.length) % 1;
        rec.curve.getPointAt(du, tmpV);
        d.position.set(tmpV.x, 0.3, tmpV.z);
        d.material.opacity = 0.5 + 0.3 * Math.sin(state.clock * 3 + di2);
      });
    }
    if (id === 'capitalTrail' && rec.dots) {
      rec.dots.forEach((d, di2) => {
        const du = (state.clock * 0.018 + di2 / rec.dots.length) % 1;
        rec.curve.getPointAt(du, tmpV);
        d.position.copy(tmpV);
        d.material.opacity = 0.55 + 0.3 * Math.sin(state.clock * 2.6 + di2);
      });
    }
  }
}


/* ---------------- 叙事层 III：都城轨迹 / 年轮盘 / 对弈角 / 市舶司 / 货币陈列 ---------------- */

/* 历代都城变迁轨迹（常显）：弧线管 + 城址圆盘 + 流动光点 */
function buildCapitalTrail() {
  const grp = new THREE.Group();
  const mats = [];
  const stops = [
    ['咸阳', 108.6, 34.35], ['长安', 108.7, 34.3], ['洛阳', 112.5, 34.6],
    ['建康', 118.8, 32], ['开封', 114.3, 34.8], ['临安', 120.2, 30.3],
    ['大都', 116.4, 39.9], ['北京', 116.4, 39.9],
  ];
  const pts = stops.map(([, lo, la]) => new THREE.Vector3(
    (lo - 106) * WSC, groundY(lo, la) + 0.45, (34 - la) * WSC * 0.92,
  ));
  const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.55);
  const matTrail = new THREE.MeshStandardMaterial({
    color: 0xd0a85a, roughness: 0.42, metalness: 0.25, transparent: true, opacity: 0.5,
    emissive: new THREE.Color(0xa8803a), emissiveIntensity: 0.28,
  });
  matTrail.userData.baseOp = 0.5;
  mats.push(matTrail);
  grp.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 150, 0.04, 6, false), matTrail));
  /* 城址圆盘：每停驻点一枚铭盘（盘缘金环 + 盘面城名） */
  const matRing = matStd(PAL.brass, { roughness: 0.35, metalness: 0.85 });
  mats.push(matRing);
  const seen = new Set();
  stops.forEach(([name, lo, la], i) => {
    if (seen.has(name)) return;
    seen.add(name);
    const w = lonlatToWorld(lo, la);
    const gY = groundY(lo, la);
    const disk = new THREE.Group();
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.58, 0.12, 24), matRing);
    base.position.y = 0.06;
    const face = new THREE.Mesh(new THREE.CircleGeometry(0.44, 24), new THREE.MeshStandardMaterial({
      map: makeLabelTexture([name], { w: 128, h: 64, accent: '#6e4a20' }), roughness: 0.7,
    }));
    face.rotation.x = -Math.PI / 2;
    face.position.y = 0.125;
    disk.add(base, face);
    disk.position.set(w.x, gY + 0.02, w.z);
    disk.rotation.y = i * 0.4;
    grp.add(disk);
  });
  /* 流动光点：6 枚金点沿线循环（主循环驱动） */
  const dots = [];
  for (let i = 0; i < 6; i++) {
    const d = new THREE.Sprite(new THREE.SpriteMaterial({
      map: makeGlowTexture('240,206,130'), transparent: true, opacity: 0.8, depthWrite: false,
    }));
    d.scale.set(0.55, 0.55, 1);
    grp.add(d);
    dots.push(d);
  }
  grp.visible = false;
  scene.add(grp);
  NARR.groups.capitalTrail = { grp, mats, seasons: Array.from({ length: 16 }, (_, i) => i), dots, curve };
}

/* 年轮盘（桌饰）：同心年轮 + 朝代色弧段 + 刻字，立式支架 */
function buildTimelineRing() {
  const grp = new THREE.Group();
  const R = 3.4;
  const cv = document.createElement('canvas');
  cv.width = cv.height = 512;
  const c = cv.getContext('2d');
  const C = 256;
  /* 年轮底：60 圈木色细环 */
  c.fillStyle = '#8a6238';
  c.fillRect(0, 0, 512, 512);
  const rnd = seededRand(19);
  for (let i = 0; i < 62; i++) {
    const r = 16 + i * 3.7;
    c.strokeStyle = i % 2 ? 'rgba(96,64,30,0.5)' : 'rgba(196,160,110,0.4)';
    c.lineWidth = 1.2 + rnd() * 1.6;
    c.beginPath(); c.arc(C, C, r, 0, TAU); c.stroke();
  }
  /* 朝代色弧段（外圈）：秦汉 / 隋唐 / 宋元 / 明清 四段 */
  const dyn = [
    ['秦汉', '#c2452a', -Math.PI / 2, Math.PI / 4],
    ['隋唐', '#c2903a', -Math.PI / 2 + Math.PI / 2, Math.PI / 4],
    ['宋元', '#3a7ab8', Math.PI / 2, Math.PI / 4],
    ['明清', '#3f8a42', -Math.PI / 4, Math.PI / 4],
  ];
  for (const [nm, col, a0, aSpan] of dyn) {
    c.strokeStyle = col;
    c.lineWidth = 22;
    c.beginPath(); c.arc(C, C, 218, a0, a0 + aSpan); c.stroke();
    c.fillStyle = '#f2e8d0';
    c.font = '700 30px "PingFang SC", sans-serif';
    c.textAlign = 'center';
    c.save();
    c.translate(C + Math.cos(a0 + aSpan / 2) * 186, C + Math.sin(a0 + aSpan / 2) * 186);
    c.rotate(a0 + aSpan / 2 + Math.PI / 2);
    c.fillText(nm, 0, 10);
    c.restore();
  }
  /* 中心刻「十六期」与指针刻度 */
  c.fillStyle = '#2e2010';
  c.font = '700 44px "PingFang SC", sans-serif';
  c.textAlign = 'center';
  c.fillText('十六期', C, C - 6);
  c.font = '500 26px "PingFang SC", sans-serif';
  c.fillText('疆域沿革', C, C + 34);
  for (let i = 0; i < 16; i++) {
    const a = -Math.PI / 2 + i / 16 * TAU;
    c.strokeStyle = 'rgba(60,40,18,0.8)';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(C + Math.cos(a) * 120, C + Math.sin(a) * 120);
    c.lineTo(C + Math.cos(a) * (i % 4 ? 132 : 144), C + Math.sin(a) * (i % 4 ? 132 : 144));
    c.stroke();
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  /* 盘体：车削环 + 盘面贴图 + 玻璃罩 + 支架 */
  const matWood2 = matStd(ATLAS_PAL.woodDark, { roughness: 0.6 });
  const disk = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 0.3, 48), matWood2);
  disk.position.y = 3.2;
  const face = new THREE.Mesh(new THREE.CircleGeometry(R * 0.985, 48), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.62 }));
  face.rotation.x = -Math.PI / 2;
  face.rotation.z = 0.6;
  face.position.y = 3.36;
  const dome = new THREE.Mesh(new THREE.SphereGeometry(R * 1.02, 28, 16, 0, TAU, 0, Math.PI / 2), matGlass('#dfeef2', { transmission: 0.88, thickness: 0.3, roughness: 0.06 }));
  dome.scale.y = 0.18;
  dome.position.y = 3.35;
  grp.add(disk, face, dome);
  /* 三足支架 */
  const matBrass2 = matStd(PAL.brass, { roughness: 0.4, metalness: 0.75 });
  for (let i = 0; i < 3; i++) {
    const a = i / 3 * TAU + 0.4;
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.14, 3.2, 10), matBrass2);
    leg.position.set(Math.cos(a) * R * 0.72, 1.6, Math.sin(a) * R * 0.72);
    leg.rotation.x = Math.sin(a) * 0.16;
    leg.rotation.z = -Math.cos(a) * 0.16;
    grp.add(leg);
  }
  const shadow = makeContactShadow(R * 1.2, 0.42);
  shadow.position.y = 0.015;
  grp.add(shadow);
  grp.position.set(-DESK_HALF_W + 7.5, 0, DESK_HALF_D - 32);
  grp.rotation.y = 0.7;
  G.props.add(grp);
}

/* 对弈角：19 路棋盘 + 棋子 + 罐 + 桌墩 */
function buildGoTable() {
  const grp = new THREE.Group();
  const cv = document.createElement('canvas');
  cv.width = cv.height = 384;
  const c = cv.getContext('2d');
  c.fillStyle = '#d8b878';
  c.fillRect(0, 0, 384, 384);
  const rnd = seededRand(37);
  for (let i = 0; i < 600; i++) {
    c.fillStyle = rnd() > 0.5 ? 'rgba(150,110,60,0.07)' : 'rgba(240,220,170,0.07)';
    c.fillRect(rnd() * 384, rnd() * 384, 2, 1.6);
  }
  c.strokeStyle = '#3a2c18';
  c.lineWidth = 1.4;
  const N = 19, M = 352, O = 16;
  const cell = M / (N - 1);
  for (let i = 0; i < N; i++) {
    const p = O + i * cell;
    c.lineWidth = i === 0 || i === N - 1 ? 2.6 : 1.2;
    c.beginPath(); c.moveTo(O, p); c.lineTo(O + M, p); c.stroke();
    c.beginPath(); c.moveTo(p, O); c.lineTo(p, O + M); c.stroke();
  }
  c.fillStyle = '#3a2c18';
  for (const [sx, sy] of [[3, 3], [9, 3], [15, 3], [3, 9], [9, 9], [15, 9], [3, 15], [9, 15], [15, 15]]) {
    c.beginPath(); c.arc(O + sx * cell, O + sy * cell, 4.4, 0, TAU); c.fill();
  }
  const boardTex = new THREE.CanvasTexture(cv);
  boardTex.colorSpace = THREE.SRGBColorSpace;
  /* 桌墩 + 棋盘体 */
  const stool = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.9, 0.8, 24), matStd(ATLAS_PAL.woodDark, { roughness: 0.7 }));
  stool.position.y = 0.4;
  const boardBody = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.1, 0.22, 40), matStd('#c8a868', { roughness: 0.6 }));
  boardBody.position.y = 0.92;
  const boardFace = new THREE.Mesh(new THREE.CircleGeometry(2.05, 40), new THREE.MeshStandardMaterial({ map: boardTex, roughness: 0.65 }));
  boardFace.rotation.x = -Math.PI / 2;
  boardFace.position.y = 1.035;
  grp.add(stool, boardBody, boardFace);
  /* 棋子：黑白 instanced 球（压扁半球），摆半局 */
  const stoneGeo = new THREE.SphereGeometry(0.088, 12, 10);
  const matBlack = matStd(0x1a1a1e, { roughness: 0.18, metalness: 0.1 });
  const matWhite = matStd(0xe8e4da, { roughness: 0.24, metalness: 0.05 });
  const rndG = seededRand(53);
  const placeStones = (count, mat) => {
    const inst = new THREE.InstancedMesh(stoneGeo, mat, count);
    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0));
    for (let i = 0; i < count; i++) {
      const gx = 1 + ((rndG() * 17) | 0), gy = 1 + ((rndG() * 17) | 0);
      const cell = (352 / 18) / 384 * 4.1;
      const x = (gx - 9) * cell;
      const z = (gy - 9) * cell;
      m4.compose(new THREE.Vector3(x, 1.06, z), q, new THREE.Vector3(1, 0.62, 1));
      inst.setMatrixAt(i, m4);
    }
    inst.instanceMatrix.needsUpdate = true;
    return inst;
  };
  grp.add(placeStones(28, matBlack), placeStones(24, matWhite));
  /* 棋罐一对（鼓腹小罐 + 盖） */
  const matJar = matStd(0x6a5a8a, { roughness: 0.5 });
  for (const [jx, col] of [[-2.5, 0x1a1a1e], [2.5, 0xe8e4da]]) {
    const prof = [
      new THREE.Vector2(0.001, 0),
      new THREE.Vector2(0.24, 0),
      new THREE.Vector2(0.3, 0.1),
      new THREE.Vector2(0.36, 0.32),
      new THREE.Vector2(0.3, 0.52),
      new THREE.Vector2(0.22, 0.58),
      new THREE.Vector2(0.001, 0.6),
    ];
    const jar = new THREE.Mesh(new THREE.LatheGeometry(prof, 20), matJar);
    jar.position.set(jx, 1.04, 0.8);
    grp.add(jar);
  }
  const shadow = makeContactShadow(2.6, 0.42);
  shadow.position.y = 0.012;
  grp.add(shadow);
  grp.position.set(DESK_HALF_W - 9, 0, DESK_HALF_D - 30);
  grp.rotation.y = -0.45;
  G.props.add(grp);
}

/* 市舶司码头（南宋两期）：栈桥 + 系船桩 + 小海船两艘 + 市标旗 */
function buildPortDocks() {
  const grp = new THREE.Group();
  const mats = [];
  const plankTex = makeWoodTexture({ base: '#8a6238', dark: '#68452a', light: '#a87e4e', seed: 27, planks: 8 });
  plankTex.repeat.set(4, 1);
  const matPlank = new THREE.MeshStandardMaterial({ map: plankTex, roughness: 0.8, transparent: true, opacity: 0 });
  const matPole = matStd(ATLAS_PAL.woodDark, { roughness: 0.78, transparent: true, opacity: 0 });
  mats.push(matPlank, matPole);
  const ships = [];
  const buildDock = (lon, lat, heading) => {
    const local = new THREE.Group();
    /* 栈桥：板带 5 单位伸向海 + 桩两排 */
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(Math.cos(heading) * 1.6, 0.02, -Math.sin(heading) * 1.6),
      new THREE.Vector3(Math.cos(heading) * 3.4, 0.05, -Math.sin(heading) * 3.4),
      new THREE.Vector3(Math.cos(heading) * 5.2, 0.05, -Math.sin(heading) * 5.2),
    ]);
    const board = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 5.6), matPlank);
    board.rotation.x = -Math.PI / 2;
    board.rotation.z = -heading + Math.PI / 2;
    board.position.set(Math.cos(heading) * 2.8, 0.14, -Math.sin(heading) * 2.8);
    local.add(board);
    for (let k = 0; k < 6; k++) {
      const t = 0.12 + k / 6 * 0.85;
      const p = curve.getPointAt(t);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.5, 7), matPole);
      pole.position.set(p.x, p.y - 0.16, p.z);
      local.add(pole);
    }
    /* 停泊小海船 */
    const ship = makeWarShip({
      len: 0.95, wid: 0.3, hgt: 0.22,
      hullColor: 0x8a6238, sailChar: '港', sailBg: '#dccda6', sailFg: '#4a3418',
    });
    ship.grp.scale.setScalar(0.85);
    ship.grp.position.set(Math.cos(heading) * 4.6, 0.3, -Math.sin(heading) * 4.6);
    ship.grp.rotation.y = heading + 0.6;
    local.add(ship.grp);
    ships.push({ grp: ship.grp, phase: local.position.x });
    /* 市标旗杆 */
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 1.5, 7), matPole);
    pole.position.set(0, 0.75, 0);
    local.add(pole);
    const flagGeo = new THREE.PlaneGeometry(0.42, 0.5, 6, 5);
    flagGeo.translate(0.21, 0, 0);
    const flag = new THREE.Mesh(flagGeo, new THREE.MeshStandardMaterial({
      map: makeFlagTexture('市舶', '#2a6a78'), side: THREE.DoubleSide, roughness: 0.85, transparent: true, opacity: 0,
    }));
    flag.position.set(0, 1.36, 0);
    local.add(flag);
    mats.push(flag.material);
    const w = lonlatToWorld(lon, lat);
    local.position.set(w.x, groundY(lon, lat) + 0.06, w.z);
    local.rotation.y = 0;
    grp.add(local);
  };
  buildDock(117.2, 24.6, -0.5);   // 泉州外侧
  buildDock(112.4, 22.6, -1.2);   // 广州外侧
  registerNarrative('ports', grp, mats, [11, 12], { ships });
}

/* 货币陈列架（桌右缘）：立式薄架 + 六枚放大钱币立牌（布币/刀币/环钱三式） */
function buildCoinRack() {
  const grp = new THREE.Group();
  const matFrame = matStd(ATLAS_PAL.woodDark, { roughness: 0.65 });
  const H = 2.6, W2 = 7.6;
  /* 架体：底板 + 顶板 + 背板 + 竖隔四根 */
  const bottom = new THREE.Mesh(new THREE.BoxGeometry(W2, 0.14, 1.1), matFrame);
  bottom.position.y = 0.07;
  const top = bottom.clone();
  top.position.y = H;
  const back = new THREE.Mesh(new THREE.BoxGeometry(W2, H, 0.12), matFrame);
  back.position.set(0, H / 2, -0.5);
  grp.add(bottom, top, back);
  for (let i = 0; i <= 6; i++) {
    const sep = new THREE.Mesh(new THREE.BoxGeometry(0.1, H, 1.0), matFrame);
    sep.position.set(-W2 / 2 + i * (W2 / 6), H / 2, 0);
    grp.add(sep);
  }
  /* 六枚钱币立牌：各自 CanvasTexture（形状+铭文各异） */
  const coinDrawers = [
    (c, W2c, Hh) => {  // 布币（空首布）
      c.fillStyle = '#b8934e';
      c.beginPath();
      c.moveTo(W2c * 0.5 - 28, Hh - 14);
      c.lineTo(W2c * 0.5 - 34, 52);
      c.lineTo(W2c * 0.5 - 12, 26);
      c.lineTo(W2c * 0.5 + 12, 26);
      c.lineTo(W2c * 0.5 + 34, 52);
      c.lineTo(W2c * 0.5 + 28, Hh - 14);
      c.closePath();
      c.fill();
      c.strokeStyle = '#7a5a22';
      c.lineWidth = 4;
      c.stroke();
      c.fillStyle = '#4a3812';
      c.font = '700 30px "PingFang SC", sans-serif';
      c.textAlign = 'center';
      c.fillText('平阳', W2c / 2, 108);
    },
    (c, W2c, Hh) => {  // 刀币
      c.fillStyle = '#a8863e';
      c.beginPath();
      c.moveTo(W2c * 0.5 - 18, Hh - 12);
      c.lineTo(W2c * 0.5 - 18, 66);
      c.lineTo(W2c * 0.5 - 8, 34);
      c.quadraticCurveTo(W2c * 0.5 + 40, 30, W2c * 0.5 + 36, 76);
      c.quadraticCurveTo(W2c * 0.5 + 30, 112, W2c * 0.5 - 4, 108);
      c.closePath();
      c.fill();
      c.strokeStyle = '#6e5420';
      c.lineWidth = 4;
      c.stroke();
      c.fillStyle = '#443212';
      c.font = '700 26px "PingFang SC", sans-serif';
      c.textAlign = 'center';
      c.fillText('齐法化', W2c / 2 - 4, 140);
    },
    (c, W2c, Hh, txt, sub) => {  // 圆形方孔环钱
      c.fillStyle = '#c09a52';
      c.beginPath(); c.arc(W2c / 2, Hh * 0.42, 52, 0, TAU); c.fill();
      c.strokeStyle = '#7a5a22';
      c.lineWidth = 5;
      c.stroke();
      c.fillStyle = '#5a4014';
      c.fillRect(W2c / 2 - 12, Hh * 0.42 - 12, 24, 24);
      c.fillStyle = '#4a340e';
      c.font = '700 25px "PingFang SC", sans-serif';
      c.textAlign = 'center';
      const chars = txt.split('');
      const pos = [[W2c / 2, Hh * 0.42 - 30], [W2c / 2 + 30, Hh * 0.42], [W2c / 2, Hh * 0.42 + 30], [W2c / 2 - 30, Hh * 0.42]];
      chars.forEach((ch, i) => c.fillText(ch, pos[i][0], pos[i][1] + 9));
      c.fillStyle = '#6a5430';
      c.font = '600 20px "PingFang SC", sans-serif';
      c.fillText(sub, W2c / 2, Hh - 24);
    },
  ];
  const defs = [
    [0], [1],
    [2, '半两', '秦 · 铜钱'], [2, '五铢', '两汉 · 五铢钱'],
    [2, '开元通宝', '唐 · 通宝钱'], [2, '交子钞样', '宋 · 纸币先驱'],
  ];
  defs.forEach((d, i) => {
    const cvc = document.createElement('canvas');
    cvc.width = 128; cvc.height = 200;
    const cc = cvc.getContext('2d');
    cc.fillStyle = '#e8dcbe';
    cc.fillRect(0, 0, 128, 200);
    if (d[0] === 2 && d[1] === '交子钞样') {
      // 交子竖版纸样
      cc.fillStyle = '#d8c9a8';
      cc.fillRect(14, 14, 100, 172);
      cc.strokeStyle = '#8a4a2a';
      cc.lineWidth = 4;
      cc.strokeRect(18, 18, 92, 164);
      cc.fillStyle = '#3a2c18';
      cc.font = '700 30px "PingFang SC", sans-serif';
      cc.textAlign = 'center';
      cc.fillText('交', 64, 78);
      cc.fillText('子', 64, 116);
      cc.fillStyle = '#a83a2a';
      cc.font = '600 18px "PingFang SC", sans-serif';
      cc.fillText('益州 · 会子印', 64, 156);
    } else if (d[0] === 0) coinDrawers[0](cc, 128, 200);
    else if (d[0] === 1) coinDrawers[1](cc, 128, 200);
    else coinDrawers[2](cc, 128, 200, d[1], d[2]);
    const tex = new THREE.CanvasTexture(cvc);
    tex.colorSpace = THREE.SRGBColorSpace;
    const plate = new THREE.Mesh(new THREE.BoxGeometry(0.72, 1.12, 0.05), [
      matStd(ATLAS_PAL.stoneDark, { roughness: 0.8 }),
      matStd(ATLAS_PAL.stoneDark, { roughness: 0.8 }),
      matStd(ATLAS_PAL.stoneDark, { roughness: 0.8 }),
      matStd(ATLAS_PAL.stoneDark, { roughness: 0.8 }),
      new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 }),
      matStd(ATLAS_PAL.stoneDark, { roughness: 0.8 }),
    ]);
    plate.position.set(-W2 / 2 + (i + 0.5) * (W2 / 6), H / 2 + 0.14, 0.28);
    plate.rotation.x = -0.14;
    grp.add(plate);
  });
  const shadow = makeContactShadow(W2 * 0.62, 0.38);
  shadow.position.set(0, 0.012, 0.2);
  grp.add(shadow);
  grp.position.set(DESK_HALF_W - 6, 0, -DESK_HALF_D + 14);
  grp.rotation.y = -0.75;
  G.props.add(grp);
}

/* 城楼四角亭（攒尖小亭，挂角柱顶） */
function buildCornerPavilions(grp, matLacquer, matRoofT, matBrass) {
  for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
    const pav = new THREE.Group();
    const poleG = new THREE.CylinderGeometry(0.028, 0.034, 0.34, 7);
    for (const [px2, pz] of [[0.09, 0.09], [0.09, -0.09], [-0.09, 0.09], [-0.09, -0.09]]) {
      const pole = new THREE.Mesh(poleG, matLacquer);
      pole.position.set(px2, 0.17, pz);
      pav.add(pole);
    }
    const roof = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.16, 4), matRoofT);
    roof.rotation.y = Math.PI / 4;
    roof.position.y = 0.42;
    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), matBrass);
    orb.position.y = 0.53;
    pav.add(roof, orb);
    pav.position.set(sx * 0.72, 1.86, sz * 0.72);
    grp.add(pav);
  }
}


/* ---------------- 叙事层 IV：市井摊 / 楼船旗舰 / 瞭望兵俑 / 四方幡 / 读数浮窗 ---------------- */

/* 宋城市井摊（开封，期 10..12）：伞棚 + 摊台 + 货物 + 人俑 ×2 */
function buildMarketStalls() {
  const grp = new THREE.Group();
  const mats = [];
  const matWood2 = matStd(ATLAS_PAL.woodDark, { roughness: 0.75, transparent: true, opacity: 0 });
  const matCloth = matStd('#9a5a3a', { roughness: 0.9, transparent: true, opacity: 0 });
  const matCroc = matStd('#c8b090', { roughness: 0.8, transparent: true, opacity: 0 });
  const matFigure = matStd(0x6a5a48, { roughness: 0.85, transparent: true, opacity: 0 });
  mats.push(matWood2, matCloth, matCroc, matFigure);
  const awnTex = makeSilkTexture('#b85a3a', 33);
  const matAwn = new THREE.MeshStandardMaterial({ map: awnTex, roughness: 0.85, side: THREE.DoubleSide, transparent: true, opacity: 0 });
  mats.push(matAwn);
  const buildStall = (lon, lat, rotY) => {
    const local = new THREE.Group();
    /* 摊台 */
    const table = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.5, 0.8), matWood2);
    table.position.y = 0.25;
    local.add(table);
    /* 货物：陶壶两只 + 布卷 + 笼 */
    for (const [hx, hz] of [[-0.4, 0.1], [-0.15, -0.12]]) {
      const jar = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), matCroc);
      jar.scale.y = 1.25;
      jar.position.set(hx, 0.62, hz);
      local.add(jar);
    }
    const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.5, 10), matCloth);
    bolt.rotation.z = Math.PI / 2;
    bolt.position.set(0.3, 0.6, 0.1);
    local.add(bolt);
    const cage = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.19, 0.2, 10), matWood2);
    cage.position.set(0.55, 0.6, -0.05);
    local.add(cage);
    /* 伞棚：中柱 + 伞骨 + 布面锥 */
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 1.7, 8), matWood2);
    mast.position.set(0, 0.85, -0.5);
    local.add(mast);
    const awn = new THREE.Mesh(new THREE.ConeGeometry(1.15, 0.4, 8), matAwn);
    awn.position.set(0, 1.7, 0);
    awn.rotation.y = 0.3;
    local.add(awn);
    /* 人俑 ×2：贩与客（球头 + 长袍身） */
    for (const [fx, fz, rot] of [[-0.9, 0.35, 1.2], [1.0, -0.1, -1.6]]) {
      const fig = new THREE.Group();
      const robe = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.17, 0.5, 10), matFigure);
      robe.position.y = 0.25;
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), matFigure);
      head.position.y = 0.58;
      fig.add(robe, head);
      fig.position.set(fx, 0, fz);
      fig.rotation.y = rot;
      local.add(fig);
    }
    const w = lonlatToWorld(lon, lat);
    local.position.set(w.x, groundY(lon, lat) + 0.04, w.z);
    local.rotation.y = rotY;
    grp.add(local);
  };
  buildStall(115.1, 34.5, 0.4);
  buildStall(113.6, 35.1, -0.8);
  buildStall(115.6, 35.4, 1.8);
  registerNarrative('market', grp, mats, [10, 11, 12]);
}

/* 楼船旗舰（曹军）：双层船楼 + 围栏 + 战鼓 + 帅旗 */
function makeTowerShip() {
  const grp = new THREE.Group();
  const ship = makeWarShip({
    len: 2.2, wid: 0.72, hgt: 0.44,
    hullColor: 0x5e4022, sailChar: '帥', sailBg: '#b8a478', sailFg: '#2a1c10',
  });
  grp.add(ship.grp);
  const matTower = matStd(0x5a3c22, { roughness: 0.8 });
  const matRail = matStd(ATLAS_PAL.woodDark, { roughness: 0.75 });
  /* 一层船楼 */
  const cabin1 = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.4, 0.5), matTower);
  cabin1.position.set(-0.1, 0.6, 0);
  grp.add(cabin1);
  /* 二层船楼（缩进） */
  const cabin2 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.36, 0.4), matTower);
  cabin2.position.set(-0.15, 0.98, 0);
  grp.add(cabin2);
  /* 楼顶围栏 + 了望哨棚 */
  for (const sz of [-0.19, 0.19]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.05, 0.03), matRail);
    rail.position.set(-0.15, 1.2, sz);
    grp.add(rail);
  }
  const deck2 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.03, 0.42), matRail);
  deck2.position.set(-0.15, 1.17, 0);
  grp.add(deck2);
  /* 战鼓：鼓架 + 鼓身（红面） */
  const drumStand = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.24, 0.2), matRail);
  drumStand.position.set(0.55, 0.68, 0);
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.2, 12), matStd('#a83a2a', { roughness: 0.7 }));
  drum.rotation.z = Math.PI / 2;
  drum.position.set(0.55, 0.86, 0);
  grp.add(drumStand, drum);
  /* 帅旗：高杆 + 金字旗（旗面波动注册返回） */
  const flagPole = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.034, 1.9, 8), matRail);
  flagPole.position.set(0.85, 1.35, 0);
  grp.add(flagPole);
  const flagGeo = new THREE.PlaneGeometry(0.56, 0.7, 8, 6);
  flagGeo.translate(0.28, 0, 0);
  const flag = new THREE.Mesh(flagGeo, new THREE.MeshStandardMaterial({
    map: makeFlagTexture('曹帥', '#7a2418', '#f0d898'), side: THREE.DoubleSide, roughness: 0.85,
  }));
  flag.position.set(0.85, 2.2, 0);
  grp.add(flag);
  return { grp, flag, span: 0.56, minX: 0 };
}

/* 四方神兽幡（桌面四角：东青龙 西白虎 南朱雀 北玄武——古地图方位语境） */
function buildGuardianBanners() {
  const grp = new THREE.Group();
  const defs = [
    ['青龍', '#2a6e4a', -DESK_HALF_W + 3.5, DESK_HALF_D - 4, '#3a6e8a'],
    ['白虎', '#d8d4c8', DESK_HALF_W - 3.5, DESK_HALF_D - 4, '#8a8a92'],
    ['朱雀', '#c23b22', DESK_HALF_W - 3.5, -DESK_HALF_D + 6, '#d88a3a'],
    ['玄武', '#2a3e5e', -DESK_HALF_W + 3.5, -DESK_HALF_D + 6, '#4a5e7a'],
  ];
  for (const [name, base, x, z, edge] of defs) {
    const g = new THREE.Group();
    const matPole = matStd(ATLAS_PAL.woodDark, { roughness: 0.7 });
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.06, 4.2, 10), matPole);
    pole.position.y = 2.1;
    g.add(pole);
    const base2 = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.42, 0.3, 12), matStd(ATLAS_PAL.stoneDark, { roughness: 0.85 }));
    base2.position.y = 0.15;
    const finial = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), matStd(PAL.brass, { roughness: 0.35, metalness: 0.85 }));
    finial.position.y = 4.28;
    g.add(base2, finial);
    /* 大幡面：竖长幅（神兽名 + 边饰），顶点波动注册 */
    const flagGeo = new THREE.PlaneGeometry(1.15, 3.2, 10, 12);
    flagGeo.translate(0.58, 0, 0);
    const flagTex = canvasTex(256, 640, (c, W2c, Hh) => {
      c.fillStyle = base;
      c.fillRect(0, 0, W2c, Hh);
      const rnd = seededRand(47);
      for (let i = 0; i < 400; i++) {
        c.fillStyle = `rgba(0,0,0,${0.03 + rnd() * 0.05})`;
        c.fillRect(rnd() * W2c, rnd() * Hh, 3 + rnd() * 7, 2 + rnd() * 4);
      }
      c.strokeStyle = edge;
      c.lineWidth = 10;
      c.strokeRect(8, 8, W2c - 16, Hh - 16);
      c.fillStyle = '#f2e8d0';
      c.font = '700 110px "PingFang SC", sans-serif';
      c.textAlign = 'center';
      c.fillText(name[0], W2c / 2, Hh * 0.4);
      c.fillText(name[1], W2c / 2, Hh * 0.72);
      c.font = '500 34px "PingFang SC", sans-serif';
      c.fillText('四 象 方 幡', W2c / 2, Hh - 60);
    });
    const flagMat = new THREE.MeshStandardMaterial({ map: flagTex, side: THREE.DoubleSide, roughness: 0.88 });
    const flag = new THREE.Mesh(flagGeo, flagMat);
    flag.position.set(x, 4.6, z);
    flag.rotation.y = x < 0 ? 0.35 : -0.35;
    g.add(flag);
    /* 波动注册（挂旗组也吃主循环波动，注册进 flagsAll 的形态） */
    g.userData.bannerFlag = { mesh: flag, span: 1.15, minX: 0, amp: 0.06, phase: hash2(x, z, 3) * TAU };
    g.position.set(x, 0, z);
    const shadow = makeContactShadow(0.8, 0.42);
    shadow.position.y = 0.012;
    g.add(shadow);
    grp.add(g);
  }
  G.props.add(grp);
  return grp;
}

/* 疆域实算读数浮窗（右上浮窗：实算面积比 / 边界长 / 政权数） */
function buildStatWindow() {
  const box = document.createElement('div');
  box.className = 'coastal-window stat-win';
  box.innerHTML = '<div class="cw-head"><b>疆域实算 · 随轴推演</b><span class="stat-close" role="button" tabindex="0" aria-label="收起实算浮窗">×</span></div>'
    + '<div class="stat-rows">'
    + '<div class="stat-row"><span>相对面积</span><b class="sv-area">—</b></div>'
    + '<div class="stat-row"><span>标称面积</span><b class="sv-nom">—</b></div>'
    + '<div class="stat-row"><span>边界总长</span><b class="sv-len">—</b></div>'
    + '<div class="stat-row"><span>政权数</span><b class="sv-polys">—</b></div>'
    + '</div>';
  stage.appendChild(box);
  const closeBtn = box.querySelector('.stat-close');
  const STAT_KEY = 'atlas.foldStat';
  let hidden = false;
  try { hidden = localStorage.getItem(STAT_KEY) === '1'; } catch (e) { /* 忽略 */ }
  const apply = () => {
    box.classList.toggle('hidden', hidden);
    closeBtn.textContent = hidden ? '+' : '×';
    closeBtn.setAttribute('aria-label', hidden ? '展开实算浮窗' : '收起实算浮窗');
  };
  closeBtn.addEventListener('click', () => {
    hidden = !hidden;
    try { localStorage.setItem(STAT_KEY, hidden ? '1' : '0'); } catch (e) { /* 忽略 */ }
    apply();
  });
  apply();
  return {
    box,
    set(areaRel, areaNom, len, polys) {
      box.querySelector('.sv-area').textContent = areaRel;
      box.querySelector('.sv-nom').textContent = areaNom;
      box.querySelector('.sv-len').textContent = len;
      box.querySelector('.sv-polys').textContent = polys;
    },
  };
}

/* 标定系数：以元朝版图（1372 万 km² 标称）为面积换算锚 */
let statCalibK = 0;

/* shoelace 实算：画布坐标多边形面积 / 世界单位换算 */
function polyArea(P2) {
  let a = 0;
  for (let i = 0; i < P2.length; i++) {
    const p = P2[i], q = P2[(i + 1) % P2.length];
    a += p[0] * q[1] - q[0] * p[1];
  }
  return Math.abs(a) / 2;
}
function polyPerimeter(P2) {
  let L = 0;
  for (let i = 0; i < P2.length; i++) {
    const p = P2[i], q = P2[(i + 1) % P2.length];
    L += Math.hypot(q[0] - p[0], q[1] - p[1]);
  }
  return L;
}


/* ---------------- 叙事层 V：水系加密 / 卫城链 / 辖区色斑 / 黄河改道 / 京杭运河 ---------------- */

/* 次级河流五条（淮/汉/湘/赣/辽）+ 名注精灵，常显 */
const MINOR_RIVERS = [
  ['淮水', [[112, 32.5], [114.2, 32.2], [116.4, 32.2], [118.3, 32.3], [119.8, 33]]],
  ['汉水', [[106.2, 33.2], [108.6, 32.8], [110.8, 32.4], [112.6, 31.4], [113.6, 30.8]]],
  ['湘江', [[111.3, 27.2], [112.2, 28.2], [112.8, 29.2], [113.1, 29.8]]],
  ['赣江', [[114.6, 25.6], [115.2, 26.8], [115.6, 28], [116, 28.8]]],
  ['辽水', [[123.6, 43.4], [123.2, 42], [122.6, 41], [122.2, 40.4]]],
];
function buildMinorRivers() {
  const grp = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color: ATLAS_PAL.river, roughness: 0.24, metalness: 0.05, transparent: true, opacity: 0.82,
    emissive: new THREE.Color(ATLAS_PAL.river), emissiveIntensity: 0.2,
  });
  for (const [name, path] of MINOR_RIVERS) {
    const curve = riverCurveOf(path, 0.05);
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 90, 0.085, 6, false), mat);
    tube.renderOrder = 3;
    grp.add(tube);
    const spr = makeTextSprite(name, { size: 26, color: 'rgba(190,222,238,0.85)' });
    const mid = path[Math.floor(path.length / 2)];
    spr.position.set((mid[0] - 106) * WSC, groundY(mid[0], mid[1]) + 0.72, (34 - mid[1]) * WSC * 0.92);
    grp.add(spr);
  }
  scene.add(grp);
}

/* 都护府辖区色斑（半透明叠层 + 虚界框 + 辖名，贴地 plane） */
function makeRegionPatch(name, lonMin, lonMax, latMin, latMax, tint) {
  const w = (lonMax - lonMin) * WSC, d = (latMax - latMin) * WSC * 0.92;
  const cv = document.createElement('canvas');
  cv.width = 512; cv.height = Math.max(320, (d / w * 512) | 0);
  const c = cv.getContext('2d');
  c.fillStyle = tint + '22';
  c.fillRect(0, 0, cv.width, cv.height);
  const rnd = seededRand(61);
  for (let i = 0; i < 1400; i++) {
    c.fillStyle = tint + (rnd() > 0.5 ? '18' : '2a');
    c.fillRect(rnd() * cv.width, rnd() * cv.height, 3 + rnd() * 6, 2 + rnd() * 4);
  }
  /* 斜纹肌理 */
  c.strokeStyle = tint + '30';
  c.lineWidth = 2;
  for (let x = -cv.height; x < cv.width; x += 26) {
    c.beginPath(); c.moveTo(x, 0); c.lineTo(x + cv.height, cv.height); c.stroke();
  }
  /* 虚界框 + 辖名 */
  c.strokeStyle = tint;
  c.lineWidth = 6;
  c.setLineDash([26, 16]);
  c.strokeRect(16, 16, cv.width - 32, cv.height - 32);
  c.setLineDash([]);
  c.fillStyle = tint;
  c.font = '700 44px "PingFang SC", sans-serif';
  c.textAlign = 'center';
  c.fillText(name, cv.width / 2, cv.height - 40);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  /* 贴地微起伏 plane */
  const SEG = 14;
  const geo = new THREE.PlaneGeometry(w, d, SEG, Math.max(8, (SEG * d / w) | 0));
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    /* plane 已居原点，直接用本地 xz 换算世界地面高 */
    pos.setY(i, worldHeightAt(pos.getX(i), pos.getZ(i)) + 0.1);
  }
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
    map: tex, transparent: true, opacity: 0.5, roughness: 0.85, depthWrite: false,
  }));
  mesh.renderOrder = 2;
  const cx = (lonMin + lonMax) / 2, cz2 = (latMin + latMax) / 2;
  mesh.position.set((cx - 106) * WSC, 0, (34 - cz2) * WSC * 0.92);
  return mesh;
}
function buildRegionPatches() {
  const mk = (name, l0, l1, a0, a1, tint, seasons) => {
    const grp = new THREE.Group();
    const mats = [];
    const patch = makeRegionPatch(name, l0, l1, a0, a1, tint);
    mats.push(patch.material);
    grp.add(patch);
    registerNarrative('region-' + name, grp, mats, seasons);
  };
  mk('安西', 76, 93, 35, 42, '#e8a24a', [1, 2, 8]);
  mk('北庭', 84, 97, 42, 48.5, '#5ab8c8', [1, 2, 8]);
  mk('宣政院辖地', 84, 100, 26, 33.5, '#c86a9a', [13]);
  mk('奴儿干', 120, 140.5, 44.5, 55, '#8a9ae8', [14]);
}

/* 明长城内侧卫城链（期 14）：五座小堡（围墙 + 门楼 + 卫旗） */
function buildWeichangForts() {
  const grp = new THREE.Group();
  const mats = [];
  const brickTex = makeBrickTexture(102);
  const matWallB = new THREE.MeshStandardMaterial({ map: brickTex, roughness: 0.9, transparent: true, opacity: 0 });
  const matWood2 = matStd(ATLAS_PAL.woodDark, { roughness: 0.78, transparent: true, opacity: 0 });
  const matFlagB = new THREE.MeshStandardMaterial({
    map: makeFlagTexture('卫', '#3e5e8a'), side: THREE.DoubleSide, roughness: 0.85, transparent: true, opacity: 0,
  });
  mats.push(matWallB, matWood2, matFlagB);
  const sites = [[104.2, 40.2], [107.6, 40.6], [111.2, 40.9], [114.8, 41.1], [118.4, 41.3]];
  for (const [lo, la] of sites) {
    const local = new THREE.Group();
    /* 堡墙：四边框（box 条）+ 四角墩 */
    const S = 0.9, Hh = 0.34;
    for (const [wx, wz, ww, wd] of [[0, S, S * 2, 0.16], [0, -S, S * 2, 0.16], [S, 0, 0.16, S * 2], [-S, 0, 0.16, S * 2]]) {
      const seg = new THREE.Mesh(new THREE.BoxGeometry(ww, Hh, wd), matWallB);
      seg.position.set(wx, Hh / 2, wz);
      local.add(seg);
    }
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const tower = new THREE.Mesh(new THREE.BoxGeometry(0.24, Hh + 0.1, 0.24), matWallB);
        tower.position.set(sx * S, (Hh + 0.1) / 2, sz * S);
        local.add(tower);
      }
    }
    /* 门楼（南面小门拱） */
    const gate = new THREE.Mesh(new THREE.BoxGeometry(0.22, Hh * 0.8, 0.2), matWood2);
    gate.position.set(0, Hh * 0.4, S);
    local.add(gate);
    /* 卫旗 */
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.03, 0.9, 7), matWood2);
    pole.position.set(S * 0.7, Hh + 0.45, -S * 0.7);
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.36, 6, 5), matFlagB);
    flagGeoTranslate(flag.geometry, 0.15, 0);
    flag.position.set(S * 0.7 + 0.01, Hh + 0.72, -S * 0.7);
    local.add(pole, flag);
    const w = lonlatToWorld(lo, la);
    local.position.set(w.x, groundY(lo, la) + 0.04, w.z);
    local.rotation.y = hash2((lo * 10) | 0, 1, 5) * 0.5;
    grp.add(local);
  }
  registerNarrative('forts', grp, mats, [14]);
}
/* 小工具：给平面几何整体平移（旗悬挂边对齐杆） */
function flagGeoTranslate(geo, tx, ty) { geo.translate(tx, ty, 0); }

/* 黄河改道（夺淮，期 12..15）：暗黄泛道 + 泛区斑 */
function buildYellowRiverShift() {
  const grp = new THREE.Group();
  const mats = [];
  const path = [[113.5, 34.9], [114.8, 34.4], [116.2, 33.6], [117.6, 32.9], [118.7, 32.7], [119.8, 33.2]];
  const curve = riverCurveOf(path, 0.075);
  const matFlood = new THREE.MeshStandardMaterial({
    color: 0xb8934e, roughness: 0.35, transparent: true, opacity: 0,
    emissive: new THREE.Color(0x8a6a2a), emissiveIntensity: 0,
  });
  mats.push(matFlood);
  const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 110, 0.13, 7, false), matFlood);
  tube.renderOrder = 3;
  grp.add(tube);
  /* 泛区：沿河断续黄斑（三块椭圆贴片） */
  const matStain = new THREE.MeshStandardMaterial({
    color: 0xb8934e, transparent: true, opacity: 0.26, roughness: 0.85, depthWrite: false,
  });
  matStain.userData.baseOp = 0.26;
  mats.push(matStain);
  for (const [lo, la, r] of [[115.6, 33.5, 1.4], [117.4, 32.8, 1.1], [119.2, 32.9, 0.9]]) {
    const stain = new THREE.Mesh(new THREE.CircleGeometry(r, 24), matStain);
    stain.rotation.x = -Math.PI / 2;
    stain.scale.y = 0.55;
    const w = lonlatToWorld(lo, la);
    stain.position.set(w.x, groundY(lo, la) + 0.09, w.z);
    stain.renderOrder = 2;
    grp.add(stain);
  }
  /* 名注 */
  const spr = makeTextSprite('夺淮泛道', { size: 26, color: 'rgba(216,190,120,0.9)' });
  const w = lonlatToWorld(117.2, 32.85);
  spr.position.set(w.x, groundY(117.2, 32.85) + 0.9, w.z);
  grp.add(spr);
  registerNarrative('yellowShift', grp, mats, [12, 13, 14, 15]);
}

/* 元代京杭运河 + 隋广通渠：追加运河段（分段显隐） */
function buildYuanCanal() {
  const grp = new THREE.Group();
  const mats = [];
  const jinghang = [[116.4, 39.9], [116.9, 37.4], [117.6, 35.2], [118.6, 33.6], [119.6, 32.8], [120.2, 31.9]];
  const guangtong = [[108.8, 34.4], [110.2, 34.6], [111.6, 34.7], [113.2, 34.75]];
  const matYuan = new THREE.MeshStandardMaterial({
    color: ATLAS_PAL.canalGlow, roughness: 0.3, transparent: true, opacity: 0,
    emissive: new THREE.Color(ATLAS_PAL.canalGlow), emissiveIntensity: 0,
  });
  mats.push(matYuan);
  const t1 = new THREE.Mesh(new THREE.TubeGeometry(riverCurveOf(jinghang, 0.075), 100, 0.1, 7, false), matYuan);
  const t2 = new THREE.Mesh(new THREE.TubeGeometry(riverCurveOf(guangtong, 0.07), 60, 0.09, 7, false), matYuan);
  t1.renderOrder = t2.renderOrder = 3;
  grp.add(t1, t2);
  const spr = makeTextSprite('京杭运河', { size: 26, color: 'rgba(200,182,232,0.9)' });
  const w = lonlatToWorld(117.9, 34.4);
  spr.position.set(w.x, groundY(117.9, 34.4) + 0.85, w.z);
  grp.add(spr);
  registerNarrative('yuanCanal', grp, mats, [13, 14, 15]);
}

/* 秦驰道烽燧链（期 0..2）：沿线八座小烽燧（与长城烽火台形制呼应） */
function buildRoadBeacons() {
  const grp = new THREE.Group();
  const mats = [];
  const matStone = matStd(0x9a8462, { roughness: 0.9, transparent: true, opacity: 0 });
  const matFire = matGlow(ATLAS_PAL.lanternGlow, 1.2, { transparent: true, opacity: 0 });
  mats.push(matStone, matFire);
  const spoke = [[108.6, 34.35], [110.2, 36.6], [112.4, 38.8], [114.8, 40.6]];
  const curve = riverCurveOf(spoke, 0.05);
  for (let k = 1; k <= 8; k++) {
    const p = curve.getPointAt(k / 9);
    const lon = p.x / WSC + 106, lat = 34 - p.z / (WSC * 0.92);
    const gY = groundY(lon, lat);
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.38, 0.8, 7), matStone);
    tower.position.set(p.x, gY + 0.4, p.z);
    const bowl2 = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.1, 0.1, 8), matStone);
    bowl2.position.set(p.x, gY + 0.86, p.z);
    const fire = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), matFire);
    fire.position.set(p.x, gY + 0.98, p.z);
    grp.add(tower, bowl2, fire);
  }
  registerNarrative('roadBeacons', grp, mats, [0, 1, 2]);
}


/* ---------------- 叙事层 VI：五岳碑 / 三大关隘 / 城门匾额 / 沙盘题名牌 ---------------- */

/* 五岳石碑（常显）：泰山 · 华山 · 恒山 · 嵩山 · 衡山 */
function buildWuyueSteles() {
  const grp = new THREE.Group();
  const defs = [
    ['泰山', 117.1, 36.25], ['华山', 110.15, 34.55], ['恒山', 113.75, 39.7],
    ['嵩山', 113.05, 34.5], ['衡山', 112.65, 27.3],
  ];
  for (const [name, lo, la] of defs) {
    const st = makeStele([name]);
    const w = lonlatToWorld(lo, la);
    st.position.set(w.x, groundY(lo, la) + 0.02, w.z);
    st.scale.setScalar(1.05);
    st.rotation.y = hash2((lo * 10) | 0, 2, 8) * TAU;
    grp.add(st);
  }
  scene.add(grp);
}

/* 三大关隘（常显）：函谷关 · 雁门关 · 剑门关（双柱横枋关楼 + 匾 + 夯土角墩） */
function buildKeyPasses() {
  const grp = new THREE.Group();
  const mats = [];
  const matWood2 = matStd(ATLAS_PAL.woodDark, { roughness: 0.72 });
  const matRam = matStd(0xa08a60, { roughness: 0.9 });
  mats.push(matWood2, matRam);
  const defs = [
    ['函谷关', 110.9, 34.55, 0.4], ['雁门关', 112.9, 39.35, -0.3], ['剑门关', 105.45, 32.25, 0.9],
  ];
  for (const [name, lo, la, rotY] of defs) {
    const local = new THREE.Group();
    const w = lonlatToWorld(lo, la);
    const gY = groundY(lo, la);
    /* 夯土角墩两座（梯形墩台） */
    for (const sx of [-1.1, 1.1]) {
      const pier = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.44, 0.75, 5), matRam);
      pier.position.set(sx, 0.38, 0);
      pier.rotation.y = 0.4;
      local.add(pier);
    }
    /* 双柱横枋关楼 */
    for (const sx of [-0.62, 0.62]) {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 1.3, 9), matWood2);
      col.position.set(sx, 0.65, 0);
      local.add(col);
    }
    const beam = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.16, 0.24), matWood2);
    beam.position.y = 1.34;
    const beam2 = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.12, 0.2), matWood2);
    beam2.position.y = 1.14;
    local.add(beam, beam2);
    /* 檐脊：短挑檐 + 顶吻 */
    const eave = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.07, 0.5), matWood2);
    eave.position.y = 1.46;
    eave.rotation.x = 0.12;
    local.add(eave);
    for (const sx of [-0.85, 0.85]) {
      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.18, 6), matStd(PAL.brass, { roughness: 0.35, metalness: 0.8 }));
      tip.position.set(sx, 1.52, 0);
      tip.rotation.z = sx > 0 ? -0.5 : 0.5;
      local.add(tip);
    }
    /* 关匾 */
    const plaque = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 0.22), new THREE.MeshStandardMaterial({
      map: makeLabelTexture([name], { w: 192, h: 60, accent: '#8a3a1e' }), roughness: 0.7,
    }));
    plaque.position.set(0, 1.13, 0.14);
    local.add(plaque);
    local.position.set(w.x, gY + 0.03, w.z);
    local.rotation.y = rotY;
    grp.add(local);
  }
  scene.add(grp);
}

/* 沙盘题名牌（桌前缘中央立牌）：绢底大字 + 题记 + 朱印 */
function buildTitlePlaque() {
  const grp = new THREE.Group();
  const cv = document.createElement('canvas');
  cv.width = 256; cv.height = 384;
  const c = cv.getContext('2d');
  c.fillStyle = ATLAS_PAL.silk;
  c.fillRect(0, 0, cv.width, cv.height);
  const rnd = seededRand(71);
  for (let i = 0; i < 900; i++) {
    c.fillStyle = rnd() > 0.5 ? 'rgba(150,128,80,0.06)' : 'rgba(250,244,220,0.06)';
    c.fillRect(rnd() * cv.width, rnd() * cv.height, 2, 1.6);
  }
  c.strokeStyle = '#6e5222';
  c.lineWidth = 8;
  c.strokeRect(12, 12, cv.width - 24, cv.height - 24);
  c.fillStyle = ATLAS_PAL.inkBlack;
  c.textAlign = 'center';
  const title = '歷代疆域圖';
  c.font = '700 64px "PingFang SC", sans-serif';
  title.split('').forEach((ch, i) => c.fillText(ch, cv.width / 2, 96 + i * 74));
  c.font = '500 26px "PingFang SC", sans-serif';
  c.fillStyle = '#4a3818';
  c.fillText('十六期沿革 · 沙盘', cv.width / 2, cv.height - 86);
  c.fillText('秦迄清 · 教学示意', cv.width / 2, cv.height - 52);
  c.fillStyle = ATLAS_PAL.cinnabar;
  c.fillRect(cv.width / 2 - 17, cv.height - 132, 34, 34);
  c.fillStyle = 'rgba(245,236,214,0.92)';
  c.font = '700 14px "PingFang SC", sans-serif';
  c.fillText('迷鹿', cv.width / 2, cv.height - 118);
  c.fillText('藏图', cv.width / 2, cv.height - 104);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  /* 牌体：立框 + 绢面 + 斜撑 */
  const matWood2 = matStd(ATLAS_PAL.woodDark, { roughness: 0.62 });
  const frame = new THREE.Mesh(new THREE.BoxGeometry(2.3, 3.3, 0.16), matWood2);
  frame.position.y = 1.95;
  const silkFace = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 3.1), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8 }));
  silkFace.position.set(0, 1.95, 0.09);
  const cap2 = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.22, 0.3), matWood2);
  cap2.position.y = 3.72;
  const cap2Roof = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.5, 0.3, 4), matWood2);
  cap2Roof.rotation.y = Math.PI / 4;
  cap2Roof.scale.y = 0.5;
  cap2Roof.position.y = 3.98;
  grp.add(frame, silkFace, cap2, cap2Roof);
  for (const sx of [-0.8, 0.8]) {
    const strut = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.6, 0.12), matWood2);
    strut.position.set(sx, 1.3, -0.3);
    strut.rotation.x = 0.25;
    grp.add(strut);
  }
  for (const sx of [-0.7, 0.7]) {
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.22, 0.7), matWood2);
    foot.position.set(sx, 0.11, 0);
    grp.add(foot);
  }
  const shadow = makeContactShadow(1.6, 0.4);
  shadow.position.y = 0.012;
  grp.add(shadow);
  grp.position.set(0, 0, DESK_HALF_D - 8.5);
  G.props.add(grp);
}

/* 秦驰道西行段烽燧（补 4 座，西向通路） */
function buildRoadBeaconsWest() {
  const grp = new THREE.Group();
  const mats = [];
  const matStone = matStd(0x9a8462, { roughness: 0.9, transparent: true, opacity: 0 });
  const matFire = matGlow(ATLAS_PAL.lanternGlow, 1.2, { transparent: true, opacity: 0 });
  mats.push(matStone, matFire);
  const spoke = [[108.6, 34.35], [106.2, 34.8], [103.8, 35.4], [101.6, 36.2]];
  const curve = riverCurveOf(spoke, 0.05);
  for (let k = 1; k <= 4; k++) {
    const p = curve.getPointAt(k / 5);
    const lon = p.x / WSC + 106, lat = 34 - p.z / (WSC * 0.92);
    const gY = groundY(lon, lat);
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.38, 0.8, 7), matStone);
    tower.position.set(p.x, gY + 0.4, p.z);
    const fire = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), matFire);
    fire.position.set(p.x, gY + 0.92, p.z);
    grp.add(tower, fire);
  }
  registerNarrative('roadBeaconsWest', grp, mats, [0, 1, 2]);
}


/* ---------------- 叙事层 VII：马厩 / 古籍书堆 / 茶马古道 / 台基浮雕带 ---------------- */

/* 驿站马厩（驰道驿亭旁）：马槽 + 系马桩 + 草垛 ×2 */
function buildStables() {
  const grp = new THREE.Group();
  const matWood2 = matStd(ATLAS_PAL.woodDark, { roughness: 0.78 });
  const matHay = matStd('#c8a85a', { roughness: 0.95 });
  const matStone = matStd(ATLAS_PAL.stoneDark, { roughness: 0.88 });
  const spots = [[110.9, 35.9], [113.8, 39.3]];
  for (const [lo, la] of spots) {
    const local = new THREE.Group();
    /* 马槽：石槽 + 双桩 */
    const trough = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.22, 0.34), matStone);
    trough.position.y = 0.16;
    local.add(trough);
    const hay = new THREE.Mesh(new THREE.SphereGeometry(0.14, 9, 7), matHay);
    hay.scale.y = 0.6;
    hay.position.set(0.1, 0.3, 0);
    local.add(hay);
    for (const sx of [-0.5, 0.5]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.7, 7), matWood2);
      post.position.set(sx, 0.35, -0.3);
      local.add(post);
    }
    /* 草垛两座 */
    for (const [hx, hz] of [[-0.9, 0.5], [0.9, 0.6]]) {
      const stack = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.5, 9), matHay);
      stack.position.set(hx, 0.25, hz);
      local.add(stack);
    }
    const w = lonlatToWorld(lo, la);
    local.position.set(w.x, groundY(lo, la) + 0.02, w.z);
    grp.add(local);
  }
  G.props.add(grp);
}

/* 古籍书堆（卷轴旁）：三叠线装书 + 散页 */
function buildBookPile() {
  const grp = new THREE.Group();
  const bookSpines = [
    ['山河志', '#7a4a2a'], ['舆地考', '#3a5a6e'], ['边防略', '#6e3a2a'],
  ];
  let y = 0;
  bookSpines.forEach(([title, col], i) => {
    const cv = document.createElement('canvas');
    cv.width = 128; cv.height = 64;
    const c = cv.getContext('2d');
    c.fillStyle = col;
    c.fillRect(0, 0, 128, 64);
    c.fillStyle = '#e8dcb8';
    c.fillRect(0, 8, 128, 10);
    c.fillRect(0, 46, 128, 10);
    c.font = '700 26px "PingFang SC", sans-serif';
    c.textAlign = 'center';
    c.fillText(title, 64, 40);
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    const w = 1.35 - i * 0.08, d = 0.9;
    const book = new THREE.Mesh(new THREE.BoxGeometry(w, 0.22, d), [
      matStd(col, { roughness: 0.75 }),
      matStd(col, { roughness: 0.75 }),
      new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7 }),
      matStd('#c8b890', { roughness: 0.85 }),
      matStd(col, { roughness: 0.75 }),
      matStd(col, { roughness: 0.75 }),
    ]);
    book.position.set(0.3, y + 0.11, 1.15);
    book.rotation.y = 0.22 * (i - 1);
    grp.add(book);
    y += 0.22;
  });
  /* 散页两笺 */
  const sheet = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.42), matStd('#e8dcbe', { roughness: 0.85, side: THREE.DoubleSide }));
  sheet.rotation.x = -Math.PI / 2;
  sheet.rotation.z = 0.4;
  sheet.position.set(-0.6, 0.012, 1.7);
  const sheet2 = sheet.clone();
  sheet2.position.set(-0.35, 0.024, 1.85);
  sheet2.rotation.z = 0.1;
  grp.add(sheet, sheet2);
  const shadow = makeContactShadow(1.3, 0.38);
  shadow.position.set(0, 0.012, 1.4);
  grp.add(shadow);
  grp.position.set(-DESK_HALF_W + 8.5, 0, -DESK_HALF_D + 10);
  grp.rotation.y = 0.4;
  G.props.add(grp);
}

/* 茶马古道（唐至宋，期 8..12）：雅州 → 康定 → 逻些 棕色山道 + 茶包驮担 */
function buildTeaHorseRoad() {
  const grp = new THREE.Group();
  const mats = [];
  const path = [[103, 29.9], [101.6, 29.4], [100, 29.6], [98.6, 30.3], [96.6, 30], [94.5, 29.8], [92, 29.6]];
  const curve = riverCurveOf(path, 0.09);
  const matTrail = new THREE.MeshStandardMaterial({
    color: 0x9a6a3a, roughness: 0.9, transparent: true, opacity: 0,
  });
  mats.push(matTrail);
  grp.add(makeRoadRibbon(curve, 0.32, matTrail, 100));
  /* 茶包驮担两组：堆叠方包（茶砖语境） */
  const matBrick = matStd('#4a3a28', { roughness: 0.9, transparent: true, opacity: 0 });
  mats.push(matBrick);
  for (const t of [0.32, 0.58]) {
    const p = curve.getPointAt(t);
    for (let k = 0; k < 4; k++) {
      const brick = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.09, 0.13), matBrick);
      brick.position.set(p.x + (k % 2 ? 0.06 : -0.06), p.y + 0.06 + (k / 2) * 0.09, p.z + (k % 2 ? 0.05 : -0.05));
      brick.rotation.y = k * 0.4;
      grp.add(brick);
    }
  }
  /* 名注 */
  const spr = makeTextSprite('茶马古道', { size: 26, color: 'rgba(214,182,138,0.9)' });
  const w = curve.getPointAt(0.45);
  spr.position.set(w.x, w.y + 0.7, w.z);
  grp.add(spr);
  registerNarrative('teaRoad', grp, mats, [8, 9, 10, 11, 12]);
}

/* 城楼台基浮雕带：云纹横带贴图（台基四壁上部） */
function buildBaseFrieze(grp) {
  const cv = document.createElement('canvas');
  cv.width = 256; cv.height = 48;
  const c = cv.getContext('2d');
  c.fillStyle = '#8a7048';
  c.fillRect(0, 0, 256, 48);
  c.strokeStyle = 'rgba(60,44,24,0.75)';
  c.lineWidth = 3;
  /* 一组云雷纹循环 */
  for (let x = 10; x < 250; x += 40) {
    c.beginPath();
    c.arc(x, 24, 9, 0, Math.PI * 1.5);
    c.stroke();
    c.beginPath();
    c.arc(x + 16, 24, 5, 0, Math.PI);
    c.stroke();
    c.beginPath();
    c.moveTo(x + 26, 24);
    c.lineTo(x + 36, 24);
    c.stroke();
  }
  c.strokeStyle = 'rgba(220,196,150,0.5)';
  c.lineWidth = 1.6;
  c.beginPath(); c.moveTo(0, 6); c.lineTo(256, 6); c.stroke();
  c.beginPath(); c.moveTo(0, 42); c.lineTo(256, 42); c.stroke();
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.repeat.set(3, 1);
  const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8 });
  const band = new THREE.Mesh(new THREE.BoxGeometry(1.72, 0.14, 1.72), mat);
  band.position.y = 0.62;
  band.rotation.y = Math.PI / 4;
  grp.add(band);
}

/* 地形贴图边缘暗角（绢本陈旧感的边缘压暗，makeTerrainTexture 尾部叠加） */
function applyTerrainVignette(c) {
  const g = c.createRadialGradient(MW / 2, MH / 2, Math.min(MW, MH) * 0.42, MW / 2, MH / 2, Math.max(MW, MH) * 0.62);
  g.addColorStop(0, 'rgba(60,44,24,0)');
  g.addColorStop(1, 'rgba(60,44,24,0.34)');
  c.fillStyle = g;
  c.fillRect(0, 0, MW, MH);
}


/* ---------------- 叙事层 VIII：戍卒营帐 / 漕运码头 ---------------- */

/* 戍边营帐（明墙内侧，期 14）：脊顶帐篷两顶 + 篝火夜光点 */
function buildWarCamp() {
  const grp = new THREE.Group();
  const mats = [];
  const tentTex = makeSilkTexture('#8a6a48', 55);
  const matTent = new THREE.MeshStandardMaterial({ map: tentTex, roughness: 0.9, side: THREE.DoubleSide, transparent: true, opacity: 0 });
  const matPole = matStd(ATLAS_PAL.woodDark, { roughness: 0.75, transparent: true, opacity: 0 });
  const matFire = matGlow(ATLAS_PAL.lanternGlow, 1.4, { transparent: true, opacity: 0 });
  mats.push(matTent, matPole, matFire);
  const buildTent = (lon, lat, rotY) => {
    const local = new THREE.Group();
    const w = lonlatToWorld(lon, lat);
    local.position.set(w.x, groundY(lon, lat) + 0.03, w.z);
    local.rotation.y = rotY;
    /* 脊顶布面：弯面 plane 两片（人字坡） */
    const slopeGeo = new THREE.PlaneGeometry(1.3, 0.9, 8, 4);
    {
      const pos = slopeGeo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        pos.setZ(i, Math.cos(x / 1.3 * Math.PI) * 0.1);
      }
      slopeGeo.computeVertexNormals();
    }
    for (const sz of [-1, 1]) {
      const slope = new THREE.Mesh(slopeGeo, matTent);
      slope.position.set(0, 0.48, sz * 0.42);
      slope.rotation.x = sz * -0.72;
      local.add(slope);
    }
    /* 脊杆 + 门帘 + 拉绳 */
    const ridge = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.035, 1.4, 7), matPole);
    ridge.rotation.x = Math.PI / 2;
    ridge.position.y = 0.92;
    local.add(ridge);
    const door = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.52), matTent);
    door.position.set(0, 0.3, 0.62);
    door.rotation.x = -0.14;
    local.add(door);
    for (const sx of [-0.85, 0.85]) {
      const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.9, 5), matPole);
      rope.position.set(sx, 0.3, sz(0));
      rope.rotation.z = sx * 0.85;
      local.add(rope);
    }
    function sz(v) { return v; }
    /* 篝火：柴堆 + 焰光 */
    const logs = new THREE.Group();
    for (let k = 0; k < 4; k++) {
      const log = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.5, 6), matPole);
      log.rotation.z = Math.PI / 2;
      log.rotation.y = k * 0.7;
      log.position.y = 0.05 + k * 0.03;
      logs.add(log);
    }
    logs.position.set(1.5, 0, 0.5);
    const fire = new THREE.Mesh(new THREE.SphereGeometry(0.16, 9, 7), matFire);
    fire.position.set(1.5, 0.24, 0.5);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: makeGlowTexture('255,154,74'), transparent: true, opacity: 0, depthWrite: false,
    }));
    glow.scale.set(1.3, 1.3, 1);
    glow.position.set(1.5, 0.4, 0.5);
    mats.push(glow.material);
    local.add(logs, fire, glow);
    grp.add(local);
  };
  buildTent(110.8, 40.1, 0.3);
  buildTent(111.8, 40.0, -0.5);
  registerNarrative('warCamp', grp, mats, [14]);
}

/* 漕运码头（通济渠扬州端，期 7..9）：栈桥 + 货垛 + 漕旗 */
function buildCanalDock() {
  const grp = new THREE.Group();
  const mats = [];
  const plankTex = makeWoodTexture({ base: '#8a6238', dark: '#68452a', light: '#a87e4e', seed: 39, planks: 8 });
  plankTex.repeat.set(3, 1);
  const matPlank = new THREE.MeshStandardMaterial({ map: plankTex, roughness: 0.8, transparent: true, opacity: 0 });
  const matPole = matStd(ATLAS_PAL.woodDark, { roughness: 0.78, transparent: true, opacity: 0 });
  const matCargo = matStd('#9a8a5a', { roughness: 0.88, transparent: true, opacity: 0 });
  const matFlag = new THREE.MeshStandardMaterial({
    map: makeFlagTexture('漕', '#3e5e8a'), side: THREE.DoubleSide, roughness: 0.85, transparent: true, opacity: 0,
  });
  mats.push(matPlank, matPole, matCargo, matFlag);
  const local = new THREE.Group();
  const lon = 119.55, lat = 32.85;
  const w = lonlatToWorld(lon, lat);
  local.position.set(w.x, groundY(lon, lat) + 0.05, w.z);
  /* 栈桥板 + 桩 */
  const board = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 3.6), matPlank);
  board.rotation.x = -Math.PI / 2;
  board.position.set(0, 0.16, -0.9);
  local.add(board);
  for (let k = 0; k < 4; k++) {
    for (const sx of [-0.36, 0.36]) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.44, 7), matPole);
      pole.position.set(sx, -0.06, -2.1 + k * 0.95);
      local.add(pole);
    }
  }
  /* 货垛：布卷堆 + 筐两排 */
  for (let k = 0; k < 3; k++) {
    const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.55, 10), matCargo);
    roll.rotation.z = Math.PI / 2;
    roll.position.set(1.0, 0.14 + k * 0.24, 0.2 - k * 0.06);
    local.add(roll);
  }
  for (const [bx, bz] of [[-0.9, 0.3], [-1.15, 0.62]]) {
    const basket = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.2, 10), matCargo);
    basket.position.set(bx, 0.1, bz);
    local.add(basket);
  }
  /* 漕旗杆 */
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.036, 1.5, 8), matPole);
  pole.position.set(-1.4, 0.75, -0.6);
  const flagGeo = new THREE.PlaneGeometry(0.5, 0.62, 8, 6);
  flagGeo.translate(0.25, 0, 0);
  const flag = new THREE.Mesh(flagGeo, matFlag);
  flag.position.set(-1.39, 1.36, -0.6);
  flag.rotation.y = 0.4;
  local.add(pole, flag);
  grp.add(local);
  registerNarrative('canalDock', grp, mats, [7, 8, 9], { dockFlag: flag });
}


/* ---------------- 叙事层 IX：元代漕船队 / 驰道行道树 ---------------- */

/* 京杭运河漕船（期 13..15）：两艘沿京杭曲线循环 */
function buildYuanCanalBoats() {
  const grp = new THREE.Group();
  const jinghang = [[116.4, 39.9], [116.9, 37.4], [117.6, 35.2], [118.6, 33.6], [119.6, 32.8], [120.2, 31.9]];
  const curve = riverCurveOf(jinghang, 0.12);
  const boats = [];
  for (let i = 0; i < 2; i++) {
    const ship = makeWarShip({
      len: 1.0, wid: 0.32, hgt: 0.24,
      hullColor: 0x6e4e2c, sailChar: '漕', sailBg: '#d4c89e', sailFg: '#3e3020',
    });
    ship.grp.scale.setScalar(0.8);
    grp.add(ship.grp);
    boats.push({ grp: ship.grp, offset: i * 0.5, speed: 0.011 });
  }
  registerNarrative('yuanBoats', grp, [], [13, 14, 15], { boats, curve });
}

/* 驰道行道树（秦道四线：松柏 instanced，一 draw call） */
function buildRoadTrees() {
  const grp = new THREE.Group();
  const matTrunk = matStd('#5a3e22', { roughness: 0.85 });
  const matPine = matStd('#3a5a34', { roughness: 0.9 });
  /* 松冠两层锥 + 树干，合批三组 instanced */
  const spokes = [
    [[108.6, 34.35], [110.2, 36.6], [112.4, 38.8], [114.8, 40.6]],
    [[108.6, 34.35], [111.8, 34.2], [114.8, 34.6], [117.6, 35.2]],
    [[108.6, 34.35], [107.4, 32.4], [106.4, 30.2], [106.6, 27.8]],
    [[108.6, 34.35], [106.2, 34.8], [103.8, 35.4], [101.6, 36.2]],
  ];
  const trunkGeo = new THREE.CylinderGeometry(0.05, 0.075, 0.5, 6);
  const crownGeo1 = new THREE.ConeGeometry(0.32, 0.6, 8);
  const crownGeo2 = new THREE.ConeGeometry(0.22, 0.45, 8);
  const spots = [];
  for (const spoke of spokes) {
    const curve = riverCurveOf(spoke, 0.06);
    for (let k = 2; k < 26; k += 5) {
      const p = curve.getPointAt(k / 26);
      const lon = p.x / WSC + 106, lat = 34 - p.z / (WSC * 0.92);
      /* 偏出路面约 0.6 世界单位植栽 */
      spots.push([lon + 0.45, lat + 0.4]);
    }
  }
  const mkInst = (geo, mat, yOff, sMin, sMax) => {
    const inst = new THREE.InstancedMesh(geo, mat, spots.length);
    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const rnd = seededRand(83);
    spots.forEach(([lo, la], i) => {
      const w = lonlatToWorld(lo, la);
      const s = sMin + rnd() * (sMax - sMin);
      m4.compose(
        new THREE.Vector3(w.x, groundY(lo, la) + yOff * s, w.z),
        q,
        new THREE.Vector3(s, s, s),
      );
      inst.setMatrixAt(i, m4);
    });
    inst.instanceMatrix.needsUpdate = true;
    return inst;
  };
  grp.add(mkInst(trunkGeo, matTrunk, 0.25, 0.85, 1.2));
  grp.add(mkInst(crownGeo1, matPine, 0.7, 0.85, 1.2));
  grp.add(mkInst(crownGeo2, matPine, 1.15, 0.85, 1.2));
  registerNarrative('roadTrees', grp, [], [0, 1, 2]);
}


/* ---------------- 叙事层 X：疆界界碑（西汉/唐边界沿线石桩刻字） ---------------- */

/* 界碑串（期 1,2,8）：按疆域多边形西段沿线立 6 座刻字石桩 */
function buildBoundaryStones() {
  const grp = new THREE.Group();
  const matStone = matStd(ATLAS_PAL.stone, { roughness: 0.88 });
  const matDark = matStd(ATLAS_PAL.stoneDark, { roughness: 0.9 });
  /* 西段参考界点（教学示意）：汉西界（葱岭）与唐西界（帕米尔）沿线 */
  const spots = [
    ['汉界', 73.6, 39.4, 73.4, 38.6], ['汉界', 74.6, 40.4, 74.2, 39.6], ['汉界', 78.5, 41.4, 78, 40.6],
    ['唐界', 74.5, 38.8, 74.3, 38], ['唐界', 78.5, 43.4, 78, 42.6], ['唐界', 88.5, 46.4, 88, 45.6],
  ];
  for (const [label, lo, la, , ] of spots) {
    const local = new THREE.Group();
    const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.62, 0.14), matStone);
    shaft.position.y = 0.31;
    const capTop = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.09, 10, 1, false, 0, Math.PI), matDark);
    capTop.rotation.z = Math.PI / 2;
    capTop.rotation.y = Math.PI / 2;
    capTop.position.y = 0.66;
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 0.22), matDark);
    foot.position.y = 0.05;
    local.add(shaft, capTop, foot);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(0.17, 0.4), new THREE.MeshStandardMaterial({
      map: makeSteleTexture([label[0], label[1]]), roughness: 0.8,
    }));
    face.position.set(0, 0.34, 0.075);
    local.add(face);
    const w = lonlatToWorld(lo, la);
    local.position.set(w.x, groundY(lo, la) + 0.02, w.z);
    local.rotation.y = hash2((lo * 10) | 0, 5, 4) * TAU;
    grp.add(local);
  }
  grp.visible = false;
  scene.add(grp);
  /* 与汉/唐期联动显隐（材质静态，整组切换） */
  NARR.groups.boundaryStones = { grp, mats: [], seasons: [1, 2, 8], toggleOnly: true };
}

/* ---------------- 全局状态 ---------------- */

const state = {
  time: 2,               /* 连续期索引 0..15 */
  playing: false,
  dwell: 0,
  clock: 0,              /* 场景总时钟（材质呼吸/粒子相位共用） */
  showCaps: true, showNames: true, showTerrain: false,
};

/* ---------------- 字幕条（贴中栏底边，样式在 lab-atlas.css） ---------------- */

const subtitle = document.createElement('div');
subtitle.className = 'edulab-sub';
stage.appendChild(subtitle);

/* ---------------- 面积曲线窗（浮于中栏左下，可收 40px 圆徽标） ---------------- */

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

/* ---------------- 控件与读数 ---------------- */

const ctl = createControlsPanel(document.getElementById('controls'));
const hud = makeHUD(document.getElementById('lcData'), [['a', '时期'], ['b', '年代'], ['c', '政权数']]);
hud.show(true);

let sliderRef = null;
let pendingExag = H_EXAG;
let exagTimer = null;
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
  /* 高度夸张度：地形起伏的观感缩放（松手后统一重建贴地件） */
  ctl.slider({
    label: '地形起伏', min: 1.6, max: 5.0, step: 0.1, value: H_EXAG,
    fmt: (v) => '×' + v.toFixed(1),
    onInput: (v) => {
      pendingExag = v;
      if (exagTimer) clearTimeout(exagTimer);
      exagTimer = setTimeout(() => rebuildGround(pendingExag), 260);
    },
  });
  ctl.sep();
  ctl.toggle({ label: '都城', value: true, onChange: (v) => { state.showCaps = v; } });
  ctl.toggle({ label: '政权名', value: true, onChange: (v) => { state.showNames = v; refreshTerritory(state.time, true); } });
  ctl.toggle({ label: '地形注记', value: false, onChange: (v) => { state.showTerrain = v; } });
}

function syncCaption() {
  const i = Math.round(state.time);
  const p = PERIODS[Math.min(i, PERIODS.length - 1)];
  const battleLinks = (p.battles || []).map(([label, id]) => `<a href="../war/" style="color:#ffcf9a;font-weight:600" title="在战役沙盘中查看${label.replace('⚔ ', '').replace('沙盘', '')}">${label} →</a>`).join('　');
  subtitle.innerHTML = `<b style="color:#ffd166">${p.name} · ${p.year}</b>　<span style="opacity:0.85">${p.note}</span>${battleLinks ? '<br>' + battleLinks : ''}`;
  hud.set('a', p.name);
  hud.set('b', p.year);
  hud.set('c', (p.polys.filter((q) => q.n).length) + ' 政权');
}

/* ---------------- 章节定义（右栏详解随期联动） ---------------- */

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
    switchCapital(i);
    flyToPeriod(i);
  },
}));

/* ---------------- 章节管理（左栏时期列表驱动） ---------------- */

const chapNav = document.getElementById('chapNav');
const chapCount = document.getElementById('chapCount');
const detailNo = document.getElementById('detailNo');
const detailTitle = document.getElementById('detailTitle');
const lessonEl = document.getElementById('lesson');
const detailBody = document.getElementById('detailBody');

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
  railNoL.textContent = String(i + 1).padStart(2, '0');
  railTitleR.textContent = sec.title;
  lessonEl.innerHTML = sec.html || '';
  detailBody.scrollTop = 0;
}

function selectChapter(i) {
  const idx = clamp(i, 0, SECTIONS.length - 1);
  uiChapter = -1;
  applyChapterUI(idx);
  SECTIONS[idx].enter();
}

/* ---------------- 相机飞行（章节联动 easeInOutCubic 缓动） ---------------- */

const camTween = { t: 1, dur: 1.5, fromP: new THREE.Vector3(), fromT: new THREE.Vector3(), toP: new THREE.Vector3(), toT: new THREE.Vector3() };
function flyTo(pos, target, dur = 1.5) {
  camTween.fromP.copy(camera.position);
  camTween.fromT.copy(controls.target);
  camTween.toP.copy(pos);
  camTween.toT.copy(target);
  camTween.t = 0;
  camTween.dur = dur;
}
function camTweenTick(dt) {
  if (camTween.t >= 1) return;
  camTween.t = Math.min(1, camTween.t + dt / camTween.dur);
  const e = easeInOut(camTween.t);
  camera.position.lerpVectors(camTween.fromP, camTween.toP, e);
  controls.target.lerpVectors(camTween.fromT, camTween.toT, e);
}
/* 每期机位：主都城近景为默认叙事落点；战役期望向战场；广域期拉远 */
function periodViewpoint(i) {
  const p = PERIODS[i];
  const cap = (p.caps && p.caps[0]) || [null, 106, 36];
  const cw = lonlatToWorld(cap[1], cap[2]);
  const ground = groundY(cap[1], cap[2]);
  if (p.battles && p.battles[0]) {
    const [, , blo, bla] = p.battles[0];
    const bw = lonlatToWorld(blo, bla);
    return {
      pos: new THREE.Vector3(bw.x + 9, ground + 17, bw.z + 21),
      tgt: new THREE.Vector3(bw.x, ground + 1.2, bw.z),
    };
  }
  const wide = p.area >= 1200;
  const dist = wide ? 1.7 : 1.45;
  return {
    pos: new THREE.Vector3(cw.x - 15 * dist, ground + 27 * dist, cw.z + 35 * dist),
    tgt: new THREE.Vector3(cw.x, ground + 1.2, cw.z),
  };
}
function flyToPeriod(i) {
  const v = periodViewpoint(i);
  flyTo(v.pos, v.tgt, 1.5);
}

/* ---------------- hover 高亮 + 点击飞近（城楼/碑亭） ---------------- */

const raycaster = new THREE.Raycaster();
const pointerNdc = new THREE.Vector2();
const hoverRing = new THREE.Mesh(
  new THREE.TorusGeometry(1.5, 0.07, 8, 40),
  new THREE.MeshBasicMaterial({ color: 0xffd166, transparent: true, opacity: 0.9 }),
);
hoverRing.rotation.x = -Math.PI / 2;
hoverRing.visible = false;
hoverRing.renderOrder = 6;
scene.add(hoverRing);
let hoverCap = null;
let lastRayT = 0;
function pickCaps(clientX, clientY) {
  const r = app.dom.getBoundingClientRect();
  pointerNdc.x = ((clientX - r.left) / r.width) * 2 - 1;
  pointerNdc.y = -((clientY - r.top) / r.height) * 2 + 1;
  raycaster.setFromCamera(pointerNdc, camera);
  const rec = capitalCache.get(capitalCur);
  if (!rec) return null;
  const hits = raycaster.intersectObjects(rec.grp.children, true);
  for (const h of hits) {
    let o = h.object;
    while (o && !o.userData.cap) o = o.parent;
    if (o && o.userData.cap) return { cap: o.userData.cap, obj: o, point: h.point };
  }
  return null;
}
app.dom.addEventListener('pointermove', (e) => {
  if (state.clock - lastRayT < 0.08) return;
  lastRayT = state.clock;
  const hit = pickCaps(e.clientX, e.clientY);
  hoverCap = hit;
  app.dom.style.cursor = hit ? 'pointer' : 'grab';
  if (hit) {
    const gp = hit.obj.isGroup ? hit.obj : hit.obj.parent;
    hoverRing.position.copy(gp.getWorldPosition(new THREE.Vector3()));
    hoverRing.position.y += 0.1;
    hoverRing.visible = true;
  } else {
    hoverRing.visible = false;
  }
});
app.dom.addEventListener('click', (e) => {
  const hit = pickCaps(e.clientX, e.clientY);
  if (!hit) return;
  const gp = hit.obj.isGroup ? hit.obj : hit.obj.parent;
  const wp = gp.getWorldPosition(new THREE.Vector3());
  flyTo(new THREE.Vector3(wp.x + 3.5, wp.y + 5, wp.z + 7.5), new THREE.Vector3(wp.x, wp.y + 1.2, wp.z), 1.2);
});

/* 键盘：←→ 切期 / 空格播放 */
window.addEventListener('keydown', (e) => {
  if (e.target && /input|textarea|select/i.test(e.target.tagName || '')) return;
  if (e.key === 'ArrowLeft') selectChapter(clamp(Math.round(state.time) - 1, 0, PERIODS.length - 1));
  else if (e.key === 'ArrowRight') selectChapter(clamp(Math.round(state.time) + 1, 0, PERIODS.length - 1));
  else if (e.key === ' ') {
    e.preventDefault();
    state.playing = !state.playing;
    if (state.playing && state.time >= PERIODS.length - 1) state.time = 0;
    buildControls();
  }
});

/* ---------------- 地形注记（3D 文字精灵，替代原 2D 注记层） ---------------- */

const terrainNotes = [];
function buildTerrainNotes() {
  const notes = [['青藏高原', 86, 33], ['塔里木盆地', 84, 39.5], ['蒙古高原', 103, 46.5], ['黄土高原', 108.5, 36.5], ['华北平原', 116.5, 36], ['长江中下游平原', 113, 29], ['四川盆地', 105, 30.5], ['云贵高原', 103, 26], ['东北平原', 125.5, 45], ['喜马拉雅山脉', 88, 28.2], ['大兴安岭', 123.5, 47.5], ['秦岭', 108.5, 33.2]];
  for (const [name, lo, la] of notes) {
    const spr = makeTextSprite(name, { size: 30, color: 'rgba(250,246,235,0.92)' });
    const w = lonlatToWorld(lo, la);
    spr.position.set(w.x, groundY(lo, la) + 1.15, w.z);
    spr.visible = false;
    G.terrain.add(spr);
    terrainNotes.push(spr);
  }
}

/* ---------------- 场景装配与高度重建 ---------------- */

const propsRefs = {};
function buildProps() {
  const desk = buildDeskAndFloor();
  G.props.add(desk);
  const compass = buildCompass();
  G.props.add(compass.grp);
  propsRefs.needle = compass.needle;
  G.props.add(buildSealSet());
  G.props.add(buildScrolls());
  const candleA = buildCandleStand(-DESK_HALF_W + 6.5, -DESK_HALF_D + 22, 0.4);
  const candleB = buildCandleStand(DESK_HALF_W - 6.5, -DESK_HALF_D + 24, -0.5);
  G.props.add(candleA.grp, candleB.grp);
  propsRefs.candles = [candleA, candleB];
  candleLightA.position.set(-DESK_HALF_W + 6.5, 2.8, -DESK_HALF_D + 22);
  candleLightB.position.set(DESK_HALF_W - 6.5, 2.8, -DESK_HALF_D + 24);
  const burner = buildIncenseBurner(DESK_HALF_W - 8.5, 2);
  G.props.add(burner.grp);
  propsRefs.smokes = burner.smokes;
  G.props.add(buildBrushRack());
  G.props.add(buildScreen());
  buildRelicSet();
  propsRefs.timeline = buildTimelineBar();
  const caravan = buildCamelCaravan();
  G.props.add(caravan.grp);
  propsRefs.caravan = caravan;
  const traders = buildTraderShips();
  G.props.add(traders.grp);
  propsRefs.traders = traders;
}

/* 组深度释放（几何/材质，含子树） */
function disposeGroupDeep(grp) {
  grp.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) {
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      for (const m of mats) {
        for (const key of ['map', 'emissiveMap', 'roughnessMap', 'normalMap']) {
          if (m[key]) m[key].dispose();
        }
        m.dispose();
      }
    }
  });
}

/* 叙事层全量重建（贴地件随高度系数失效） */
function rebuildNarrative() {
  for (const [, rec] of Object.entries(NARR.groups)) {
    scene.remove(rec.grp);
    disposeGroupDeep(rec.grp);
  }
  NARR.groups = {};
  buildPostRoads();
  buildLingquCanal();
  buildPlankRoad();
  buildCanalBoats();
  buildSilkSeaRoute();
  buildHeqinRoute();
  buildPassFortresses();
  buildTowerKeeps();
  buildBeaconSmoke();
  buildCapitalTrail();
  buildTimelineRing();
  buildGoTable();
  buildPortDocks();
  buildCoinRack();
  buildMarketStalls();
  buildMinorRivers();
  buildRegionPatches();
  buildWeichangForts();
  buildYellowRiverShift();
  buildYuanCanal();
  buildTeaHorseRoad();
  buildRoadBeacons();
  buildRoadBeaconsWest();
  buildWuyueSteles();
  buildKeyPasses();
  buildTitlePlaque();
  buildStables();
  buildBookPile();
  buildWarCamp();
  buildCanalDock();
  buildYuanCanalBoats();
  buildRoadTrees();
  buildBoundaryStones();
  const guardianGrp = buildGuardianBanners();
  guardianGrp.children.forEach((ch) => {
    if (ch.userData.bannerFlag) flagsAll.push(ch.userData.bannerFlag);
  });
  propsRefs.statWin = buildStatWindow();
  buildCapitalTrail();
}

/* 高度夸张度变化：地形/贴地 overlay/水系/长城/都城全部随新系数重建或抬升 */
function rebuildGround(newExag) {
  if (Math.abs(newExag - H_EXAG) < 0.01 || !elevReady) return;
  H_EXAG = newExag;
  rebuildTerrain();
  /* overlay 贴地平面顶点重投 */
  if (territoryMesh) {
    const pos = territoryMesh.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      pos.setY(i, worldHeightAt(pos.getX(i), pos.getZ(i)) + 0.07);
    }
    pos.needsUpdate = true;
  }
  /* 水系与运河重建（曲线逐点贴新地面） */
  G.waters.children.slice().forEach((m) => {
    G.waters.remove(m);
    m.geometry.dispose();
  });
  canalMeshes = [];
  buildRivers();
  buildCanals();
  /* 长城重建（墙体/垛口/烽火台几何全部依赖地面高度） */
  G.walls.children.slice().forEach((m) => {
    G.walls.remove(m);
    if (m.geometry) m.geometry.dispose();
  });
  wallQin = null; wallMing = null;
  buildWalls();
  /* 叙事层与都城缓存全量重建（组内城楼/碑亭/战役沙盘位置均贴旧地面，失效） */
  rebuildNarrative();
  for (const [, rec] of capitalCache) {
    G.capitals.remove(rec.grp);
    disposeGroupDeep(rec.grp);
  }
  capitalCache.clear();
  flagsAll.length = 0;
  capitalCur = -1;
  switchCapital(Math.round(state.time));
  lastDrawTime = -1;   /* 强制缎带与 overlay 下轮重写 */
  refreshTerritory(state.time, true);
}

/* ---------------- 栏折叠 × 专注模式 ---------------- */

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
let focusSaved = null;
try {
  foldL = localStorage.getItem(FOLD_KEY.l) === '1';
  foldR = localStorage.getItem(FOLD_KEY.r) === '1';
} catch (e) { /* localStorage 不可用（隐私模式等）时仅本次会话内生效 */ }

function applyFold() {
  atlasShell.classList.toggle('fold-l', foldL);
  atlasShell.classList.toggle('fold-r', foldR);
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
  atlasShell.classList.toggle('focus-mode', on);
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
  } catch (e) { /* 同上，忽略持久化失败 */ }
  applyFold();
}

foldLBtn.addEventListener('click', () => toggleFold('l'));
unfoldLBtn.addEventListener('click', () => toggleFold('l'));
foldRBtn.addEventListener('click', () => toggleFold('r'));
unfoldRBtn.addEventListener('click', () => toggleFold('r'));
focusBtn.addEventListener('click', () => setFocus(focusSaved === null));
applyFold();

/* ---------------- 面积窗折叠 ---------------- */

const areaFoldBtn = document.getElementById('areaFoldBtn');
const AREA_FOLD_KEY = 'atlas.foldArea';
let areaFolded = false;
try {
  const savedArea = localStorage.getItem(AREA_FOLD_KEY);
  areaFolded = savedArea !== null ? savedArea === '1' : window.innerWidth <= 1100;
} catch (e) {
  areaFolded = window.innerWidth <= 1100;
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

/* ---------------- 右栏三块手风琴 ---------------- */

const ACC_KEYS = { lesson: 'atlas.accLesson', controls: 'atlas.accControls', data: 'atlas.accData' };
const accSecs = {
  lesson: document.getElementById('accLesson'),
  controls: document.getElementById('accControls'),
  data: document.getElementById('accData'),
};
const NARROW_VIEW = window.innerWidth <= 1100;
const accClosed = {};
for (const name of Object.keys(accSecs)) {
  let saved = null;
  try { saved = localStorage.getItem(ACC_KEYS[name]); } catch (e) { /* 同上，忽略 */ }
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

/* ---------------- 启动（分步构建，loader 显示进度） ---------------- */

const nextTick = () => new Promise((r) => setTimeout(r, 30));
window.__eduSections = { select: selectChapter };

async function boot() {
  loader.setText('计算大陆高程场…');
  await nextTick();
  buildElevGrid();
  loader.setText('绘制地貌与海图…');
  await nextTick();
  terrainTex = makeTerrainTexture();
  const maps = makeOceanMaps();
  loader.setText('隆起三维地形…');
  await nextTick();
  rebuildTerrain();
  buildOcean(maps);
  buildTerritoryMesh();
  buildRivers();
  buildCanals();
  buildWalls();
  loader.setText('安放都城与书房道具…');
  await nextTick();
  buildProps();
  buildTerrainNotes();
  loader.setText('铺陈历史叙事要素…');
  await nextTick();
  buildPostRoads();
  buildLingquCanal();
  buildPlankRoad();
  buildCanalBoats();
  buildSilkSeaRoute();
  buildHeqinRoute();
  buildPassFortresses();
  buildTowerKeeps();
  buildBeaconSmoke();
  buildCapitalTrail();
  buildTimelineRing();
  buildGoTable();
  buildPortDocks();
  buildCoinRack();
  buildMarketStalls();
  buildMinorRivers();
  buildRegionPatches();
  buildWeichangForts();
  buildYellowRiverShift();
  buildYuanCanal();
  buildTeaHorseRoad();
  buildRoadBeacons();
  buildRoadBeaconsWest();
  buildWuyueSteles();
  buildKeyPasses();
  buildTitlePlaque();
  buildStables();
  buildBookPile();
  buildWarCamp();
  buildCanalDock();
  buildYuanCanalBoats();
  buildRoadTrees();
  buildBoundaryStones();
  const guardianGrp = buildGuardianBanners();
  guardianGrp.children.forEach((ch) => {
    if (ch.userData.bannerFlag) flagsAll.push(ch.userData.bannerFlag);
  });
  propsRefs.statWin = buildStatWindow();
  applyChapterUI(0);
  /* 面积标定：元朝（期 13）实算世界面积 → 换算系数（首帧读数即生效） */
  {
    let a = 0;
    for (const poly of styled(PERIODS[13])) a += polyArea(poly.P2);
    const worldA = a / (MW * MH) * (WORLD_W * WORLD_D);
    statCalibK = worldA > 0 ? 1372 / worldA : 0;
  }
  selectChapter(0);
  refreshTerritory(state.time, true);
  loader.hide();
}
boot();

/* ---------------- 主循环 ---------------- */

let lastTs = 0;
const tmpV = new THREE.Vector3();
app.onFrame((dt) => {
  state.clock += dt;
  camTweenTick(dt);
  capitalTick(dt);
  if (!elevReady) return;
  /* 播放推进：每期停留 2.6s，过渡 1.1s（沿用既有节奏） */
  if (state.playing) {
    state.dwell += dt;
    const i = Math.floor(state.time);
    if (state.dwell > 2.6 && i < PERIODS.length - 1) {
      state.time = Math.min(i + 1, state.time + dt / 1.1);
      if (sliderRef) sliderRef.set(state.time);
      if (state.time >= i + 1) state.dwell = 0;
    } else if (state.dwell > 2.6 && i >= PERIODS.length - 1) {
      state.playing = false;
      buildControls();
    }
  }
  /* 疆域重画检测（时间轴/播放驱动） */
  if (Math.abs(state.time - lastDrawTime) > 1e-4) {
    refreshTerritory(state.time);
    drawArea(state.time);
    const i = Math.round(state.time);
    if (i !== loopMeta.lastI) {
      loopMeta.lastI = i;
      syncCaption();
      applyChapterUI(i);
      switchCapital(i);
    }
  }
  /* 长城与运河显隐每帧推进（淡入淡出需要连续帧，不能只挂在 time 变化时） */
  {
    const fi = Math.floor(state.time);
    setWallsForPeriod(fi, dt);
    setCanalsVisible(!!(PERIODS[Math.min(fi, PERIODS.length - 1)].canals), dt);
  }
  /* 都城 / 注记 / 战役显隐开关 */
  G.capitals.visible = state.showCaps;
  for (const spr of terrainNotes) spr.visible = state.showTerrain;
  /* 海面波动 */
  if (oceanMesh) oceanMesh.material.uniforms.uTime.value = state.clock;
  /* 疆域缎带呼吸 */
  const ribOpacity = 0.58 + 0.13 * Math.sin(state.clock * 2.2);
  for (const r of ribbons) if (r.mesh.visible) r.mat.opacity = ribOpacity;
  /* 旗面波动（城楼旗 + 将旗 + 战船帆，统一 span/minX 坐标；帆保留构建时的鼓风基线） */
  const waveAll = flagsAll.slice();
  const recCur = capitalCache.get(capitalCur);
  if (recCur && recCur.battle) {
    for (const f of recCur.battle.flags) waveAll.push(f);
    for (const b of recCur.battle.particles) b.mat.uniforms.uTime.value = state.clock;
    if (recCur.battle.id === 'chibi') {
      fireLight.intensity = 1.4 + Math.sin(state.clock * 9) * 0.5 + Math.sin(state.clock * 23) * 0.2;
      for (const s of recCur.battle.smokes) {
        const t = (state.clock * 0.5 + s.phase) % 2;
        if (s.kind === 'fire') {
          const k = 0.75 + 0.25 * Math.abs(Math.sin(state.clock * 7 + s.phase));
          s.spr.scale.set(1.5 * k, 1.5 * k, 1);
          s.spr.material.opacity = k;
        } else {
          s.spr.position.y = s.baseY + t * 1.6;
          s.spr.material.opacity = Math.max(0, 0.5 - t * 0.28);
        }
      }
    }
  } else {
    fireLight.intensity = Math.max(0, fireLight.intensity - dt * 3);
  }
  for (const f of waveAll) {
    const pos = f.mesh.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i);
      const k = clamp((x - f.minX) / f.span, 0, 1);
      let off = Math.sin(x * 4 + state.clock * 5.2 + f.phase) * f.amp * Math.max(k, 0.05)
        + Math.sin(y * 3 + state.clock * 3.1 + f.phase) * f.amp * 0.35;
      if (f.sail) off += Math.cos(k * Math.PI) * 0.16 * (1 - Math.min(Math.abs(y) / 0.5, 1));
      pos.setZ(i, off);
    }
    pos.needsUpdate = true;
    f.mesh.geometry.computeVertexNormals();
  }
  /* 烛焰闪烁与烛光 */
  for (const [ci, c] of (propsRefs.candles || []).entries()) {
    const fl = 0.8 + 0.2 * Math.sin(state.clock * 11 + ci * 2.4) + 0.08 * Math.sin(state.clock * 27 + ci);
    c.flameIn.scale.set(0.4 * fl, 0.62 * fl, 1);
    c.flameOut.scale.set(0.75 * fl, 1.05 * fl, 1);
    c.light.intensity = 0.5 * fl;
    if (ci === 0) candleLightA.intensity = 0.5 * fl;
    else candleLightB.intensity = 0.5 * fl;
  }
  /* 香炉青烟上升消散 */
  for (const s of propsRefs.smokes || []) {
    const t = (state.clock * 0.32 + s.phase) % 2.4;
    s.spr.position.set(
      s.baseX + Math.sin(t * 2.2 + s.phase) * 0.28,
      s.baseY + t * 1.35,
      s.baseZ + Math.cos(t * 1.7) * 0.16,
    );
    s.spr.material.opacity = Math.max(0, 0.42 - t * 0.19);
  }
  /* 罗盘磁针缓摆 */
  if (propsRefs.needle) propsRefs.needle.rotation.y = Math.sin(state.clock * 0.35) * 0.18 + state.clock * 0.05;
  /* 丝路驼队行进 */
  if (propsRefs.caravan) {
    const { camels, curve } = propsRefs.caravan;
    for (const c of camels) {
      const u = (state.clock * c.speed + c.offset) % 1;
      curve.getPointAt(u, tmpV);
      c.grp.position.copy(tmpV);
      const ahead = curve.getPointAt((u + 0.004) % 1, new THREE.Vector3());
      c.grp.lookAt(ahead);
      c.grp.position.y += Math.abs(Math.sin(state.clock * 5 + c.offset * 9)) * 0.05;
    }
  }
  /* 海商船巡航 */
  if (propsRefs.traders) {
    const { ships, curve } = propsRefs.traders;
    for (const s of ships) {
      const u = (state.clock * s.speed + s.offset) % 1;
      curve.getPointAt(u, tmpV);
      s.grp.position.set(tmpV.x, 0.16, tmpV.z);
      const ahead = curve.getPointAt((u + 0.004) % 1, new THREE.Vector3());
      s.grp.lookAt(ahead.x, 0.16, ahead.z);
      s.grp.rotation.x = Math.sin(state.clock * 1.6 + s.offset * 7) * 0.035;
    }
  }
  /* 叙事层（驰道/灵渠/蜀道/漕船/海丝/和亲/关城/敌楼/烽烟）随期淡入淡出与行进 */
  narrativeTick(dt);
  /* 年表盘指针随时间轴滑动 */
  if (propsRefs.timeline) {
    propsRefs.timeline.needle.position.x = -propsRefs.timeline.W2 / 2 + 1
      + clamp(state.time / (PERIODS.length - 1), 0, 1) * (propsRefs.timeline.W2 - 2);
  }
});
const loopMeta = { lastI: -1 };
