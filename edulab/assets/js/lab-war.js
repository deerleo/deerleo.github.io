/* EduLab · 著名战役沙盘（war）— Micro 级 3D 深改
 * =====================================================================
 * 九场战役（原版文案块 1:1 对齐，全部文案自写）：
 *   长平 / 巨鹿 / 官渡 / 赤壁 / 淝水 / 温泉关 / 高加米拉 / 坎尼 / 黑斯廷斯
 *
 * 三栏布局：左战役目录（9 场，点击切战高亮迁移）· 中战场沙盘 3D 舞台 · 右详解（三手风琴）
 * 折叠体系：左右栏 28px 竖条折叠 × 右栏三块手风琴 × 专注模式（双栏同折）——localStorage 记忆
 *
 * 沙盘工艺（edu-vfx 接入）：
 *   地形 = 逐战场程序化 DEM（山脊线高斯脊 + 独立山峰 + 河谷下切 + 海岸与湖泊）
 *          × 地貌着色 CanvasTexture（分层色带 + 西北光山体阴影 + 林斑 + 河流 + 岸线浪沫 + 纸纹）
 *          × 起伏夸张度滑杆实时重建（法线随动）
 *   海面 = 自研波动 shader（双向正弦 + 近岸提亮 + 夜色压暗），仅滨海战场生成
 *   军团 = 阵形实例化方阵（军种分形：步兵横阵 / 骑兵宽阵 / 弓手列线 / 车阵横列 / 船队纵队）
 *          + 军旗（旗杆 + CanvasTexture 纹旗，随风摆动）+ 接地阴影贴片
 *   战船 = CatmullRom 曲线放样船壳（截面缩放船体 + 舷缘 + 桅杆 + 三角帆），赤壁水战专用
 *   营帐 = 放样脊顶帐篷（帐面布纹 CanvasTexture + 门脸 + 拉绳 + 篝火夜光点），营盘注记专用
 *   城寨 = 基座 + 屋舍群 + 角楼望柱；石墙 = 石块纹理分段墙（福基斯墙）；甬道 = 夹墙夯土道
 *   进军箭头 = 路径丝带 shader（uAdv 揭示推进 + 流动虚线 + 尖端锥头；撤退样式为碎段虚线）
 *   阶段标签 = 侧色底条文字精灵，进度阈值弹出
 *   特效 = 交战火花（粒子环爆 + 冲击环）· 火攻（升腾火星 + 橙光 + 全屏闪 + 相机震动）
 *          · 夜战（地形 uNight 染色 + 灯光联动 + 篝火/窗火点亮）
 *   罗盘与比例尺 = 程序化绘制贴图贴地（沙盘测绘感）
 *
 * 原版功能块 1:1：九战场目录 / 战役头卡（年代 · 对垒 · 兵力）/ 地貌注记（城·营·山·水·方向，
 *   点看详解）/ 军团注记（旗字 + 编制，点看详解）/ 时间线阶段（标题 + 日期 + 长解说，逐段推演）/
 *   阶段相机（落脚点 · 距离 · 偏航 · 俯仰）/ 夜战阶段 / 阶段标签 / 战役档案（时间 · 地点 · 统帅 ·
 *   兵力 · 结果）/ 胜负关键 / 深远影响 / 每战三问（四选一 + 解析）/ 起伏夸张度 / 播放控制
 * 自研增设：随堂判分交互 / 沙盘注记卡 / 图例说明 / 罗盘比例尺 / 键盘操控（, . ← → 空格 R F Esc）
 * =====================================================================
 */
import {
  THREE, DEG, TAU, clamp,
  createApp, createControlsPanel, makeLoader,
  makeTextSprite, makeGlowTexture,
} from './edu-core.js';
import {
  attachVFX, makeStudioEnvironment,
  matStd, matCoat, matSheen, matGlow, PAL,
} from './edu-vfx.js';

/* ---------------- 舞台与工艺接入 ---------------- */

const stage = document.getElementById('stage');
const loader = makeLoader(stage, '正在铺开战场沙盘…');

const app = createApp({
  container: stage,
  fov: 46, near: 0.2, far: 1200,
  cameraPos: [0, 34, 26],
  target: [0, 0, 0],
  minDistance: 4, maxDistance: 90,
  exposure: 1.05,
  keepBackground: true,
});
const { scene, camera, controls } = app;
const vfx = attachVFX(app, 'illus');
scene.environment = makeStudioEnvironment(app.renderer);

const hemiLight = new THREE.HemisphereLight(0x9db2c4, 0x11181f, 0.62);
scene.add(hemiLight);
const keyLight = new THREE.DirectionalLight(0xfff2da, 1.25);
keyLight.position.set(-14, 22, 9);
scene.add(keyLight);
const fillLight = new THREE.DirectionalLight(0xa9c4e0, 0.36);
fillLight.position.set(16, 12, -12);
scene.add(fillLight);
const fireLight = new THREE.PointLight(0xff9440, 0, 26, 1.8);
scene.add(fireLight);

/* ---------------- 通用小工具 ---------------- */

const canvasTex = (w, h, draw, opts = {}) => {
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  draw(cv.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(cv);
  if (!opts.linear) tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
};

function seedRand(seed) {
  let a = (seed >>> 0) || 1;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* 可播种的 2D 值噪声（地貌基底的来源） */
function hash2i(x, y, seed) {
  let h = (seed | 0) ^ Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}
function vnoise2(x, y, seed) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const u = (x - xi) * (x - xi) * (3 - 2 * (x - xi));
  const v = (y - yi) * (y - yi) * (3 - 2 * (y - yi));
  const a = hash2i(xi, yi, seed), b = hash2i(xi + 1, yi, seed);
  const c = hash2i(xi, yi + 1, seed), d = hash2i(xi + 1, yi + 1, seed);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm2(x, y, seed, oct = 4) {
  let s = 0, amp = 0.5, f = 1, norm = 0;
  for (let i = 0; i < oct; i++) {
    s += amp * vnoise2(x * f, y * f, seed + i * 101);
    norm += amp; amp *= 0.5; f *= 2;
  }
  return s / norm;
}

function distSeg(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1;
  const L2 = dx * dx + dy * dy || 1e-9;
  const t = clamp(((px - x1) * dx + (py - y1) * dy) / L2, 0, 1);
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}
function distPoly(px, py, pts) {
  let d = 1e9;
  for (let i = 0; i < pts.length - 1; i++) {
    d = Math.min(d, distSeg(px, py, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]));
  }
  return d;
}
function distPt(px, py, cx, cy, rx, ry) {
  const dx = (px - cx) / (rx || 1e-6), dy = (py - cy) / (ry || 1e-6);
  return Math.hypot(dx, dy);
}

/* 放样几何：沿主曲线把一系列截面蒙皮成壳（船体/帐篷的工艺来源）。
 * sections: Vector3[] 数组（每截面点数相同）→ BufferGeometry */
function loftSkin(sections, { closeStart = true, closeEnd = true } = {}) {
  const rows = sections.length;
  const cols = sections[0].length;
  const pos = [];
  const idx = [];
  for (const sec of sections) for (const p of sec) pos.push(p.x, p.y, p.z);
  for (let r = 0; r < rows - 1; r++) {
    for (let c = 0; c < cols; c++) {
      const c2 = (c + 1) % cols;
      const a = r * cols + c, b = r * cols + c2;
      const d = (r + 1) * cols + c, e = (r + 1) * cols + c2;
      idx.push(a, d, b, b, d, e);
    }
  }
  /* 端面封口：扇形三角 */
  if (closeStart || closeEnd) {
    const c0 = sections[0], c1 = sections[rows - 1];
    const cen0 = new THREE.Vector3(), cen1 = new THREE.Vector3();
    for (const p of c0) cen0.add(p); cen0.multiplyScalar(1 / cols);
    for (const p of c1) cen1.add(p); cen1.multiplyScalar(1 / cols);
    const base = pos.length / 3;
    pos.push(cen0.x, cen0.y, cen0.z, cen1.x, cen1.y, cen1.z);
    for (let c = 0; c < cols; c++) {
      const c2 = (c + 1) % cols;
      if (closeStart) idx.push(base, c2, c);
      if (closeEnd) idx.push(base + 1, rows * cols - cols + c, rows * cols - cols + c2);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

/* 由中线点列 + 截面轮廓生成放样截面列（截面沿法向骨架平滑） */
function loftSections(midPts, profPts, scales, upY = true) {
  const curve = new THREE.CatmullRomCurve3(midPts.map((p) => new THREE.Vector3(p[0], p[1], p[2])));
  const out = [];
  const n = scales.length;
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const c = curve.getPoint(clamp(t, 0, 1));
    const tg = curve.getTangent(clamp(t, 0, 1));
    /* 截面平面法线 = 主切线；把轮廓点旋转到该平面 */
    const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), tg.clone().normalize());
    const sec = profPts.map((p) => {
      const v = upY
        ? new THREE.Vector3(p[0], 0, p[1])
        : new THREE.Vector3(p[0], p[1], 0);
      v.applyQuaternion(quat).multiplyScalar(scales[i]).add(c);
      return v;
    });
    out.push(sec);
  }
  return out;
}

/* 接触阴影贴片（兵团/道具落地的重量感） */
function shadowPatch(w, d, opacity = 0.4) {
  const tex = canvasTex(128, 128, (ctx) => {
    const g = ctx.createRadialGradient(64, 64, 6, 64, 64, 62);
    g.addColorStop(0, `rgba(16,12,8,${opacity})`);
    g.addColorStop(0.6, `rgba(16,12,8,${opacity * 0.5})`);
    g.addColorStop(1, 'rgba(16,12,8,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
  }, { linear: true });
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(w, d),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false })
  );
  m.rotation.x = -Math.PI / 2;
  m.renderOrder = 3;
  return m;
}

/* ---------------- 投影：经纬度 → 沙盘世界坐标 ----------------
 * 简单等距圆柱：每战场以中心经纬度铺开一张矩形沙盘，纬度方向按 cos(lat) 保纵横比。 */

const MAP_W = 44;

function makeProj(b) {
  const g = b.geo;
  const cosL = Math.cos(g.cLat * DEG);
  const kx = MAP_W / g.span[0];               // 每经度世界长
  const kz = kx / Math.max(cosL, 0.35);       // 每纬度世界长（更"高"）
  const mapD = g.span[1] * kz;
  return {
    cLon: g.cLon, cLat: g.cLat, kx, kz, mapD,
    x(lon) { return (lon - g.cLon) * kx; },
    z(lat) { return -(lat - g.cLat) * kz; },
    lon(x) { return x / kx + g.cLon; },
    lat(z) { return -z / kz + g.cLat; },
  };
}

/* ---------------- DEM：程序化高程场 ----------------
 * 每战场的手工地貌参数（geo.ridges/peaks/rivers/lakes/coast）在归一化网格上合成：
 * 基底 fbm 起伏 + 山脊线高斯脊 + 独立山峰 + 河谷下切 + 湖盆下切 + 海岸截断。 */

function buildDEM(b, proj) {
  const g = b.geo;
  const GU = 200;
  const GV = Math.max(80, Math.round(GU * proj.mapD / MAP_W));
  const norm = (lon, lat) => [(lon - g.cLon) / g.span[0] + 0.5, (lat - g.cLat) / g.span[1] + 0.5];
  const r2n = (w) => w / Math.max(g.span[0], g.span[1]);
  const seed = g.seed || 17;

  const ridges = (g.ridges || []).map(([a, b2, w, h]) => {
    const [u1, v1] = norm(a[0], a[1]);
    const [u2, v2] = norm(b2[0], b2[1]);
    return { u1, v1, u2, v2, w: r2n(w) * 1.4 + 0.03, h };
  });
  const peaks = (g.peaks || []).map(([p, rx, ry, h]) => {
    const [u, v] = norm(p[0], p[1]);
    return { u, v, rx: r2n(rx) * 1.4 + 0.02, ry: r2n(ry) * 1.4 + 0.02, h };
  });
  const rivers = (g.rivers || []).map(([pts, w, d]) => ({
    pts: pts.map(([lo, la]) => norm(lo, la)),
    w: r2n(w) * 2.2 + 0.012, d,
  }));
  const lakes = (g.lakes || []).map((poly) => poly.map(([lo, la]) => norm(lo, la)));
  const flats = (g.flats || []).map(([c, rx, ry, lvl]) => {
    const [u, v] = norm(c[0], c[1]);
    return { u, v, rx: r2n(rx) * 1.3 + 0.02, ry: r2n(ry) * 1.3 + 0.02, lvl };
  });
  const coast = (g.coast || []).map(([lo, la]) => norm(lo, la));
  const seaSign = g.seaSign || 1;   // 海岸线哪一侧是海（叉积符号）

  function coastSide(u, v) {
    if (!coast.length) return 0;
    let s = 0;
    for (let i = 0; i < coast.length - 1; i++) {
      const [x1, y1] = coast[i], [x2, y2] = coast[i + 1];
      s += (x2 - x1) * (v - y1) - (u - x1) * (y2 - y1) > 0 ? 1 : -1;
    }
    const sea = s * seaSign > 0;
    const d = distPoly(u, v, coast);
    return sea ? -d : d;
  }

  const grid = new Float32Array((GU + 1) * (GV + 1));
  let hMin = 1e9, hMax = -1e9;
  const freq = g.freq || 5.2;
  for (let iv = 0; iv <= GV; iv++) {
    for (let iu = 0; iu <= GU; iu++) {
      const u = iu / GU, v = iv / GV;
      let h = 0.34 + (fbm2(u * freq, v * freq, seed, 4) - 0.5) * 0.5;
      for (const r of ridges) {
        const d = distSeg(u, v, r.u1, r.v1, r.u2, r.v2);
        h += r.h * Math.exp(-(d * d) / (2 * r.w * r.w));
      }
      for (const p of peaks) {
        const d = distPt(u, v, p.u, p.v, p.rx, p.ry);
        h += p.h * Math.exp(-(d * d) / 2);
      }
      for (const rv of rivers) h -= rv.d * Math.exp(-(distPoly(u, v, rv.pts) ** 2) / (2 * rv.w * rv.w));
      for (const lk of lakes) h -= 0.1 * Math.max(0, 1 - distPoly(u, v, lk) * 9);
      for (const f of flats) {
        const d = distPt(u, v, f.u, f.v, f.rx, f.ry);
        const k = Math.exp(-(d * d) / 2);
        h = h * (1 - k) + (0.34 + f.lvl) * k;
      }
      const cs = coastSide(u, v);
      if (cs < 0) h -= Math.min(0.16, -cs * 1.6);
      grid[iv * (GU + 1) + iu] = h;
      if (h < hMin) hMin = h;
      if (h > hMax) hMax = h;
    }
  }
  const range = Math.max(hMax - hMin, 0.35);
  const hn = new Float32Array(grid.length);
  for (let i = 0; i < grid.length; i++) hn[i] = (grid[i] - hMin) / range;

  const HN = GU + 1;
  const sample = (u, v) => {
    const fx = clamp(u, 0, 1) * GU, fy = clamp(v, 0, 1) * GV;
    const xi = Math.min(fx | 0, GU - 1), yi = Math.min(fy | 0, GV - 1);
    const dx = fx - xi, dy = fy - yi;
    const i = yi * HN + xi;
    const a = hn[i], b2 = hn[i + 1], c = hn[i + HN], d = hn[i + HN + 1];
    return a * (1 - dx) * (1 - dy) + b2 * dx * (1 - dy) + c * (1 - dx) * dy + d * dx * dy;
  };
  const isSea = (u, v) => (coast.length ? coastSide(u, v) < -0.004 : false);
  const isLake = (u, v) => lakes.some((lk) => distPoly(u, v, lk) < 0.012);
  return { sample, isSea, isLake, GU, GV, hn, coast, seaLevel: g.seaLevel ?? 0.24 };
}

/* ---------------- 地貌着色（CanvasTexture：色带 + 山影 + 林斑 + 河流 + 岸沫） ---------------- */

const BIOMES = {
  cn:    { low: '#8fac64', mid: '#a6b070', high: '#baaa7c', rock: '#ac9e84', water: '#3d7ca6', forest: '#587f45' },
  marsh: { low: '#96b26c', mid: '#adb678', high: '#c0ae80', rock: '#ac9e84', water: '#3a78a0', forest: '#5f8449' },
  olive: { low: '#a4a96c', mid: '#b6ae76', high: '#c3ad7a', rock: '#b3a38a', water: '#3d7ca6', forest: '#74884c' },
  arid:  { low: '#c6b37c', mid: '#cfb678', high: '#d2b078', rock: '#c0b096', water: '#45839f', forest: '#9aa262' },
  gold:  { low: '#c9b56e', mid: '#d2b972', high: '#d7b778', rock: '#c2b192', water: '#4583a0', forest: '#9ca363' },
  chalk: { low: '#90ad6a', mid: '#adb272', high: '#bfac80', rock: '#aca288', water: '#3d7ca6', forest: '#568246' },
};

function paintMapTexture(b, proj, dem) {
  const bio = BIOMES[b.geo.biome || 'cn'];
  const seed = (b.geo.seed || 17) + 5;
  const TW = 1024;
  const TH = Math.round(TW * proj.mapD / MAP_W);
  /* veg 低频查表（128×128 双线性），省掉逐像素 fbm */
  const VN = 128;
  const vegTab = new Float32Array(VN * VN);
  for (let iv2 = 0; iv2 < VN; iv2++) {
    for (let iu2 = 0; iu2 < VN; iu2++) {
      vegTab[iv2 * VN + iu2] = fbm2((iu2 / VN) * 42, (iv2 / VN) * 42, seed, 2);
    }
  }
  const vegAt = (u, v) => {
    const fx = clamp(u, 0, 1) * (VN - 1), fy = clamp(v, 0, 1) * (VN - 1);
    const xi = fx | 0, yi = fy | 0, dx = fx - xi, dy = fy - yi;
    const i = yi * VN + xi;
    const a = vegTab[i], b2 = vegTab[i + 1], c = vegTab[i + VN], d = vegTab[i + VN + 1];
    return a * (1 - dx) * (1 - dy) + b2 * dx * (1 - dy) + c * (1 - dx) * dy + d * dx * dy;
  };
  const cv = document.createElement('canvas');
  cv.width = TW; cv.height = TH;
  const ctx = cv.getContext('2d');
  const img = ctx.createImageData(TW, TH);
  const seaL = dem.seaLevel;
  const s = 2; // 山影采样步
  for (let y = 0; y < TH; y++) {
    for (let x = 0; x < TW; x++) {
      const u = x / TW, v = y / TH;
      const h = dem.sample(u, v);
      let r, g2, bl;
      const underwater = dem.isSea(u, v) || dem.isLake(u, v);
      if (underwater) {
        const depth = clamp((seaL - h) * 4.5, 0, 1);
        const wc = new THREE.Color(bio.water);
        r = wc.r * 255 * (1 - depth * 0.52);
        g2 = wc.g * 255 * (1 - depth * 0.44);
        bl = wc.b * 255 * (1 - depth * 0.3);
        /* 近岸浅水提亮 */
        const shore = dem.coast.length ? clamp(1 - distPoly(u, v, dem.coast) * 34, 0, 1) : 0;
        r += shore * 42; g2 += shore * 38; bl += shore * 26;
      } else {
        const t = clamp((h - seaL) / (0.98 - seaL), 0, 1);
        let col;
        if (t < 0.38) col = new THREE.Color(bio.low).lerp(new THREE.Color(bio.mid), t / 0.38);
        else if (t < 0.74) col = new THREE.Color(bio.mid).lerp(new THREE.Color(bio.high), (t - 0.38) / 0.36);
        else col = new THREE.Color(bio.high).lerp(new THREE.Color(bio.rock), (t - 0.74) / 0.26);
        /* 植被斑块：暖季草色 + 干斑 */
        const veg = vegAt(u, v);
        if (veg > 0.58) col.offsetHSL(0.008, 0.05, -0.035);
        else if (veg < 0.36) col.offsetHSL(-0.01, -0.04, 0.028);
        r = col.r * 255; g2 = col.g * 255; bl = col.b * 255;
        /* 山体阴影（西北掠射光） */
        const hx = dem.sample(clamp(u - 0.004, 0, 1), v) - dem.sample(clamp(u + 0.004, 0, 1), v);
        const hy = dem.sample(u, clamp(v - 0.005, 0, 1)) - dem.sample(u, clamp(v + 0.005, 0, 1));
        const sh = clamp((hx + hy) * 24, -1.25, 1.25);
        r += sh * 52; g2 += sh * 52; bl += sh * 42;
        /* 等高带微韵律（测绘图等高线的暗示） */
        const bd = Math.sin(t * 34 + veg * 3);
        if (bd > 0.965) { r *= 0.92; g2 *= 0.92; bl *= 0.92; }
        r = Math.max(0, Math.min(255, r)); g2 = Math.max(0, Math.min(255, g2)); bl = Math.max(0, Math.min(255, bl));
      }
      const o = (y * TW + x) * 4;
      img.data[o] = r; img.data[o + 1] = g2; img.data[o + 2] = bl; img.data[o + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);

  /* 河流描线（暗床 + 亮芯双笔） */
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const P = (lon, lat) => [proj.x(lon) / MAP_W * TW + TW / 2, proj.z(lat) / proj.mapD * TH + TH / 2];
  for (const [pts, w] of b.geo.rivers || []) {
    ctx.beginPath();
    pts.forEach(([lo, la], i) => {
      const [px, py] = P(lo, la);
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    });
    const px2 = Math.max(2.5, w * (TW / b.geo.span[0]));
    ctx.strokeStyle = 'rgba(26,48,72,0.4)';
    ctx.lineWidth = px2 * 1.4;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(28,62,92,0.92)';
    ctx.lineWidth = px2;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(130,192,228,0.6)';
    ctx.lineWidth = Math.max(1.5, px2 * 0.36);
    ctx.stroke();
  }
  /* 湖泊/内海淡蓝罩 + 岸线 */
  for (const poly of (b.geo.lakes || []).concat(b.geo.coastWater ? [b.geo.coastWater] : [])) {
    ctx.beginPath();
    poly.forEach(([lo, la], i) => {
      const [px, py] = P(lo, la);
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    });
    ctx.closePath();
    ctx.fillStyle = 'rgba(66,124,164,0.4)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(220,240,250,0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  /* 岸线浪沫（海岸线白沫双笔） */
  if (b.geo.coast) {
    ctx.beginPath();
    b.geo.coast.forEach(([lo, la], i) => {
      const [px, py] = P(lo, la);
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    });
    ctx.strokeStyle = 'rgba(236,248,252,0.65)';
    ctx.lineWidth = 2.6;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(120,180,214,0.5)';
    ctx.lineWidth = 6;
    ctx.stroke();
  }
  /* 林斑点缀（暗绿小簇） */
  const rnd = seedRand(seed);
  const forestN = b.geo.forestDots ?? 1500;
  for (let i = 0; i < forestN; i++) {
    const u = rnd(), v = rnd();
    const h = dem.sample(u, v);
    if (h < seaL + 0.02 || h > 0.8 || dem.isSea(u, v)) continue;
    if (fbm2(u * 26, v * 26, seed + 9, 2) < 0.52) continue;
    ctx.fillStyle = `rgba(${34 + rnd() * 20 | 0},${72 + rnd() * 26 | 0},${40 + rnd() * 16 | 0},0.45)`;
    ctx.beginPath();
    ctx.ellipse(u * TW, v * TH, 1.8 + rnd() * 2.4, 1.3 + rnd() * 1.9, rnd() * 3.14, 0, TAU);
    ctx.fill();
  }
  /* 纸纹颗粒 + 四缘压暗（测绘图版质感） */
  ctx.globalAlpha = 0.05;
  for (let i = 0; i < 2200; i++) {
    ctx.fillStyle = rnd() > 0.5 ? '#241c10' : '#e8dfc8';
    ctx.fillRect(rnd() * TW, rnd() * TH, 1.4, 1.4);
  }
  ctx.globalAlpha = 1;
  const edge = ctx.createRadialGradient(TW / 2, TH / 2, TW * 0.3, TW / 2, TH / 2, TW * 0.72);
  edge.addColorStop(0, 'rgba(0,0,0,0)');
  edge.addColorStop(1, 'rgba(4,8,12,0.34)');
  ctx.fillStyle = edge;
  ctx.fillRect(0, 0, TW, TH);

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/* ---------------- 地形网格与水体 ---------------- */

const HMAX = 4.6;   // 最大地形高度（夸张度=1 时）
const terrainInj = {
  uNight: { value: 0 },
  uFire: { value: 0 },
};

function buildTerrain(b, proj, dem, mapTex) {
  const segU = 236, segV = Math.round(236 * proj.mapD / MAP_W);
  const geo = new THREE.PlaneGeometry(MAP_W, proj.mapD, segU, segV);
  geo.rotateX(-Math.PI / 2);
  applyExaggeration(geo, dem, proj, 1);
  const mat = new THREE.MeshStandardMaterial({
    map: mapTex, roughness: 0.94, metalness: 0.02,
  });
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uNight = terrainInj.uNight;
    sh.uniforms.uFire = terrainInj.uFire;
    sh.fragmentShader = sh.fragmentShader
      .replace('void main() {', 'uniform float uNight;\nuniform float uFire;\nvoid main() {')
      .replace('#include <dithering_fragment>', `
        float nightK = uNight;
        gl_FragColor.rgb *= mix(vec3(1.0), vec3(0.30, 0.35, 0.52), nightK * 0.82);
        gl_FragColor.rgb += vec3(1.0, 0.42, 0.12) * uFire * 0.06;
        #include <dithering_fragment>`);
  };
  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = false;
  return { mesh, geo, mat };
}

function applyExaggeration(geo, dem, proj, exag) {
  const pos = geo.attributes.position;
  const W2 = MAP_W / 2, D2 = proj.mapD / 2;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const u = (x + W2) / MAP_W, v = (z + D2) / proj.mapD;
    pos.setY(i, dem.sample(u, v) * exag * HMAX);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
}

function seaPlaneY(b, proj, dem, exag) {
  const coast = b.geo.coast || [];
  if (!coast.length) return 0;
  const i0 = Math.floor(coast.length / 2);
  const mid = coast[i0], nxt = coast[Math.min(coast.length - 1, i0 + 1)];
  const dx = nxt[0] - mid[0], dy = nxt[1] - mid[1];
  const L = Math.hypot(dx, dy) || 1;
  const sx = mid[0] - (dy / L) * 0.06 * (b.geo.seaSign || 1);
  const sy = mid[1] + (dx / L) * 0.06 * (b.geo.seaSign || 1);
  const h = dem.sample(...n_uv([sx, sy], proj));
  return h * exag * HMAX + 0.05;
}

function buildWater(b, proj, dem, exag) {
  if (!b.geo.sea) return null;
  const geo = new THREE.PlaneGeometry(MAP_W + 12, proj.mapD + 12, 72, Math.round(72 * proj.mapD / MAP_W));
  geo.rotateX(-Math.PI / 2);
  const seaH = seaPlaneY(b, proj, dem, exag);
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uNight: { value: 0 },
      uShallow: { value: new THREE.Color(0x3f7fa4) },
      uDeep: { value: new THREE.Color(0x14344e) },
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vWp;
      void main() {
        vUv = uv;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWp = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: `
      uniform float uTime, uNight;
      uniform vec3 uShallow, uDeep;
      varying vec2 vUv;
      varying vec3 vWp;
      void main() {
        float w1 = sin(vWp.x * 0.55 + uTime * 1.15) * 0.5 + sin(vWp.z * 0.4 - uTime * 0.9) * 0.5;
        float w2 = sin(vWp.x * 1.7 - uTime * 2.2) * 0.25;
        float rip = w1 * 0.5 + w2;
        vec3 col = mix(uDeep, uShallow, 0.4 + rip * 0.16);
        col += vec3(0.65, 0.82, 0.9) * smoothstep(0.72, 1.0, rip) * 0.24;
        col *= mix(vec3(1.0), vec3(0.30, 0.37, 0.55), uNight * 0.86);
        gl_FragColor = vec4(col, 0.86);
      }`,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = seaH;
  mesh.renderOrder = 2;
  return { mesh, mat, seaH };
}

/* ---------------- 罗盘与比例尺（贴地测绘件） ---------------- */

function buildCompass(proj, dem, exag) {
  const S = 220;
  const tex = canvasTex(S, S, (ctx) => {
    ctx.clearRect(0, 0, S, S);
    ctx.strokeStyle = 'rgba(238,231,214,0.8)';
    ctx.fillStyle = 'rgba(238,231,214,0.85)';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(S / 2, S / 2, 78, 0, TAU); ctx.stroke();
    ctx.beginPath(); ctx.arc(S / 2, S / 2, 64, 0, TAU); ctx.lineWidth = 1.2; ctx.stroke();
    /* 四向刻度 */
    ctx.font = '600 22px Georgia, serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const dirs = [['N', 0, -66], ['S', 0, 66], ['E', 66, 0], ['W', -66, 0]];
    for (const [ch, dx, dy] of dirs) {
      ctx.fillText(ch, S / 2 + dx, S / 2 + dy);
    }
    /* 指北针 */
    ctx.beginPath();
    ctx.moveTo(S / 2, S / 2 - 54);
    ctx.lineTo(S / 2 - 12, S / 2 + 14);
    ctx.lineTo(S / 2, S / 2 + 4);
    ctx.lineTo(S / 2 + 12, S / 2 + 14);
    ctx.closePath();
    ctx.fillStyle = 'rgba(226,132,72,0.92)';
    ctx.fill();
    ctx.beginPath(); ctx.arc(S / 2, S / 2, 5, 0, TAU); ctx.fillStyle = 'rgba(238,231,214,0.9)'; ctx.fill();
  });
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(4.4, 4.4),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0.92 })
  );
  m.rotation.x = -Math.PI / 2;
  m.rotation.z = 0;
  m.renderOrder = 4;
  const cy = dem.sample(...n_uv([proj.lon(-MAP_W / 2 + 3.4), proj.lat(proj.mapD / 2 - 3.6)], proj)) * exag * HMAX;
  m.position.set(-MAP_W / 2 + 3.4, cy + 0.06, proj.mapD / 2 - 3.6);
  return m;
}

function buildScaleBar(proj, dem, exag) {
  /* 比例尺：按战场真实跨度换算（MAP_W 世界长 = spanLon × 111 × cos(lat) km） */
  const kmTotal = (MAP_W / proj.kx) * 111 * Math.cos(proj.cLat * DEG);
  const niceKm = [1, 2, 5, 10, 20, 50].reduce((a, b2) => Math.abs(b2 - kmTotal / 4) < Math.abs(a - kmTotal / 4) ? b2 : a, 1);
  const barW = MAP_W * niceKm / kmTotal;
  const S = 256;
  const tex = canvasTex(S, 56, (ctx) => {
    ctx.clearRect(0, 0, S, 56);
    const x0 = 8, x1 = S - 8, y = 30;
    ctx.fillStyle = 'rgba(16,20,26,0.55)';
    ctx.beginPath(); ctx.roundRect(x0 - 6, 8, S - x0 * 2 + 12, 34, 8); ctx.fill();
    ctx.fillStyle = 'rgba(238,231,214,0.92)';
    ctx.fillRect(x0, y - 3, (x1 - x0) / 2, 6);
    ctx.fillStyle = 'rgba(226,132,72,0.92)';
    ctx.fillRect(x0 + (x1 - x0) / 2, y - 3, (x1 - x0) / 2, 6);
    ctx.font = '600 15px -apple-system, "PingFang SC", sans-serif';
    ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(240,236,224,0.95)';
    ctx.fillText(`${niceKm} km`, S / 2, y - 8);
  });
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(barW, barW * 56 / 256 * 2.2),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false })
  );
  m.rotation.x = -Math.PI / 2;
  m.renderOrder = 4;
  const sx = MAP_W / 2 - barW / 2 - 2.6, sz = -proj.mapD / 2 + 3.2;
  const sy2 = dem.sample(...n_uv([proj.lon(sx), proj.lat(sz)], proj)) * exag * HMAX;
  m.position.set(sx, sy2 + 0.06, sz);
  return m;
}

/* ---------------- 营帐（放样脊顶帐篷 + 布纹） ---------------- */

let tentMatCache = null;
function tentMaterial(tint = '#b8a077') {
  if (tentMatCache) return tentMatCache;
  const tex = canvasTex(128, 128, (ctx) => {
    ctx.fillStyle = tint;
    ctx.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 46; i++) {
      ctx.fillStyle = `rgba(60,46,28,${0.05 + Math.random() * 0.1})`;
      ctx.fillRect(0, Math.random() * 128, 128, 1 + Math.random() * 2.5);
    }
    for (let i = 0; i < 260; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(40,30,16,0.09)' : 'rgba(240,226,190,0.07)';
      ctx.fillRect(Math.random() * 128, Math.random() * 128, 1.6, 1.6);
    }
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tentMatCache = matStd(0xffffff, { roughness: 0.86, metalness: 0 });
  tentMatCache.map = tex;
  tentMatCache.color = new THREE.Color(tint);
  return tentMatCache;
}

function buildTent(w = 1.15, h = 0.95, d = 1.5, tint) {
  const prof = [[-w / 2, 0], [-w * 0.26, h * 0.62], [0, h], [w * 0.26, h * 0.62], [w / 2, 0]];
  const secs = loftSections(
    [[0, 0, -d / 2], [0, 0.02, 0], [0, 0, d / 2]],
    prof,
    [0.86, 1, 0.86]
  );
  const g = new THREE.Group();
  const body = new THREE.Mesh(loftSkin(secs), tentMaterial(tint));
  g.add(body);
  /* 门脸（深色三角贴面） */
  const door = new THREE.Mesh(
    new THREE.CircleGeometry(w * 0.34, 3),
    matStd(0x4a3a26, { roughness: 0.9 })
  );
  door.position.set(0, h * 0.3, d / 2 + 0.012);
  g.add(door);
  /* 拉绳 ×2 */
  for (const sx of [-1, 1]) {
    const rope = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, d * 0.62, 5),
      matStd(0x8f7c58, { roughness: 0.9 })
    );
    rope.position.set(sx * w * 0.72, h * 0.24, d * 0.24);
    rope.rotation.z = sx * -0.62;
    g.add(rope);
  }
  /* 篝火余光点（夜战点亮） */
  const ember = new THREE.Mesh(
    new THREE.SphereGeometry(0.09, 8, 6),
    matGlow(0xff9a48, 0.05)
  );
  ember.position.set(w * 0.9, 0.1, -d * 0.3);
  ember.userData.ember = true;
  g.add(ember);
  g.add(shadowPatch(w * 2.6, d * 2.2, 0.34));
  return g;
}

/* ---------------- 城寨 / 山标 / 营盘 / 石墙 / 甬道 ---------------- */

let wallTexCache = null;
function wallMaterial() {
  if (wallTexCache) return wallTexCache;
  const tex = canvasTex(128, 128, (ctx) => {
    ctx.fillStyle = '#8d8578';
    ctx.fillRect(0, 0, 128, 128);
    /* 石块砌缝 */
    const rows = 6;
    for (let r = 0; r < rows; r++) {
      const y = r * (128 / rows);
      const off = (r % 2) * 16;
      for (let x = -16; x < 128; x += 32) {
        const bx = x + off;
        ctx.fillStyle = `rgb(${138 + Math.random() * 22 | 0},${128 + Math.random() * 20 | 0},${114 + Math.random() * 18 | 0})`;
        ctx.fillRect(bx + 1.5, y + 1.5, 29, 128 / rows - 3);
        ctx.fillStyle = 'rgba(48,42,34,0.5)';
        ctx.fillRect(bx + 1.5, y + 1.5, 29, 2);
      }
    }
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  wallTexCache = tex;
  return matStd(0xbdb6a6, { roughness: 0.92, metalness: 0, map: tex });
}

function buildCityMarker(place, proj, dem, exag, sideColor) {
  const g = new THREE.Group();
  const baseH = dem.sample(...n_uv(place.at, proj)) * exag * HMAX;
  g.position.set(proj.x(place.at[0]), baseH, proj.z(place.at[1]));
  const stone = matStd(0x7e786d, { roughness: 0.92, metalness: 0.02 });
  const roof = matStd(0x5f3d2a, { roughness: 0.85 });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.68, 0.14, 18), stone);
  base.position.y = 0.08;
  g.add(base);
  /* 屋舍群 ×5 */
  const rnd = seedRand(place.at[0] * 977 + place.at[1] * 131);
  for (let i = 0; i < 5; i++) {
    const bx = (rnd() - 0.5) * 0.86, bz = (rnd() - 0.5) * 0.86;
    const bw = 0.17 + rnd() * 0.11, bh = 0.15 + rnd() * 0.12;
    const house = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bw * 0.85), stone);
    house.position.set(bx, 0.16 + bh / 2, bz);
    house.rotation.y = rnd() * 3;
    g.add(house);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(bw * 0.82, 0.13, 4), roof);
    cap.position.set(bx, 0.16 + bh + 0.065, bz);
    cap.rotation.y = rnd() * 3;
    g.add(cap);
  }
  /* 角楼望柱 */
  const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.13, 0.6, 10), stone);
  tower.position.set(0.48, 0.44, -0.34);
  g.add(tower);
  const beacon = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.18, 8), roof);
  beacon.position.set(0.48, 0.82, -0.34);
  g.add(beacon);
  const lamplight = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), matGlow(0xffc36a, 0.1));
  lamplight.position.set(0.48, 0.68, -0.34);
  lamplight.userData.ember = true;
  g.add(lamplight);
  g.add(shadowPatch(2.1, 2.1, 0.34));
  return g;
}

function buildCampMarker(place, proj, dem, exag, sideColor) {
  const g = new THREE.Group();
  const baseH = dem.sample(...n_uv(place.at, proj)) * exag * HMAX;
  g.position.set(proj.x(place.at[0]), baseH, proj.z(place.at[1]));
  const n = place.big ? 5 : 4;
  const rnd = seedRand(place.at[0] * 613 + place.at[1] * 379);
  for (let i = 0; i < n; i++) {
    const t = buildTent(1.3 + rnd() * 0.5, 1.0 + rnd() * 0.4, 1.7 + rnd() * 0.6);
    const ang = rnd() * TAU;
    const rr = 1.15 + rnd() * 1.1;
    t.position.set(Math.cos(ang) * rr, 0, Math.sin(ang) * rr);
    t.rotation.y = rnd() * TAU;
    g.add(t);
  }
  /* 栅栏圈（细桩） */
  const posts = 14;
  for (let i = 0; i < posts; i++) {
    const a = i / posts * TAU;
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.028, 0.26, 5), matStd(0x6b4d2e, { roughness: 0.92 }));
    p.position.set(Math.cos(a) * 2.4, 0.13, Math.sin(a) * 2.4);
    g.add(p);
  }
  /* 主旗 */
  const flag = buildFlag(sideColor, place.flag || '营', 1.5);
  flag.position.set(0, 0, 0);
  g.add(flag);
  return g;
}

function buildMountMarker(place, proj, dem, exag) {
  const g = new THREE.Group();
  const baseH = dem.sample(...n_uv(place.at, proj)) * exag * HMAX;
  g.position.set(proj.x(place.at[0]), baseH, proj.z(place.at[1]));
  const peak = new THREE.Mesh(
    new THREE.ConeGeometry(0.6, 1.0, 5),
    matStd(0xa2988a, { roughness: 0.92, flatShading: true })
  );
  peak.position.y = 0.5;
  g.add(peak);
  const cap = new THREE.Mesh(
    new THREE.ConeGeometry(0.24, 0.34, 5),
    matStd(0xd9d4c6, { roughness: 0.9, flatShading: true })
  );
  cap.position.y = 0.98;
  g.add(cap);
  g.add(shadowPatch(1.9, 1.9, 0.3));
  return g;
}

function buildWallFeature(wall, proj, dem, exag, sideColor) {
  const g = new THREE.Group();
  const isCorridor = wall.kind === 'corridor';
  const pts = wall.pts;
  const mat = isCorridor ? matStd(0x9b8459, { roughness: 0.95 }) : wallMaterial();
  for (let i = 0; i < pts.length - 1; i++) {
    const [x1, z1] = [proj.x(pts[i][0]), proj.z(pts[i][1])];
    const [x2, z2] = [proj.x(pts[i + 1][0]), proj.z(pts[i + 1][1])];
    const len = Math.hypot(x2 - x1, z2 - z1);
    if (len < 0.05) continue;
    /* 分小段各贴地形，杜绝"漂空"长梁 */
    const chunks = Math.max(1, Math.round(len / 1.3));
    for (let c = 0; c < chunks; c++) {
      const t0 = c / chunks, t1 = (c + 1) / chunks, tm = (t0 + t1) / 2;
      const mx = x1 + (x2 - x1) * tm, mz = z1 + (z2 - z1) * tm;
      const hM = dem.sample(...n_uv([proj.lon(mx), proj.lat(mz)], proj)) * exag * HMAX;
      const segLen = len / chunks;
      const seg = new THREE.Mesh(
        new THREE.BoxGeometry(segLen + 0.05, isCorridor ? 0.26 : 0.5, isCorridor ? 1.3 : 0.3),
        mat
      );
      seg.position.set(mx, hM + (isCorridor ? 0.09 : 0.13), mz);
      seg.rotation.y = -Math.atan2(z2 - z1, x2 - x1);
      g.add(seg);
      if (!isCorridor && c % 3 === 0) {
        const tower = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.66, 0.55), mat);
        tower.position.set(x1 + (x2 - x1) * t0, hM + 0.2, z1 + (z2 - z1) * t0);
        tower.rotation.y = seg.rotation.y;
        g.add(tower);
      }
    }
  }
  g.userData.wallInfo = { name: wall.name, desc: wall.desc, side: wall.side };
  return g;
}

/* ---------------- 军旗（旗杆 + CanvasTexture 纹旗，随风摆） ---------------- */

const flagTexCache = new Map();
function flagTexture(colorCss, char) {
  const key = colorCss + '|' + char;
  if (flagTexCache.has(key)) return flagTexCache.get(key);
  const tex = canvasTex(96, 64, (ctx) => {
    ctx.fillStyle = colorCss;
    ctx.fillRect(0, 0, 96, 64);
    /* 边框 + 内衬纹 */
    ctx.strokeStyle = 'rgba(255,248,235,0.72)';
    ctx.lineWidth = 4;
    ctx.strokeRect(3, 3, 90, 58);
    ctx.strokeStyle = 'rgba(20,16,12,0.28)';
    ctx.lineWidth = 2;
    ctx.strokeRect(7, 7, 82, 50);
    ctx.font = '700 34px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255,250,240,0.96)';
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 4;
    ctx.fillText(char.slice(0, 2), 48, 35);
  });
  flagTexCache.set(key, tex);
  return tex;
}

function buildFlag(colorHex, char, poleH = 1.9) {
  const g = new THREE.Group();
  const colorCss = '#' + new THREE.Color(colorHex).getHexString();
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.024, 0.034, poleH, 7),
    matStd(0x4a3826, { roughness: 0.8 })
  );
  pole.position.y = poleH / 2;
  g.add(pole);
  /* 旗冠小珠 */
  const finial = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), matGlow(colorHex, 0.35));
  finial.position.y = poleH + 0.04;
  g.add(finial);
  const flagW = 0.95, flagH = 0.62;
  const flagGeo = new THREE.PlaneGeometry(flagW, flagH, 10, 1);
  const flagMat = new THREE.MeshStandardMaterial({
    map: flagTexture(colorCss, char),
    side: THREE.DoubleSide, roughness: 0.85, metalness: 0,
  });
  flagMat.onBeforeCompile = (sh) => {
    sh.uniforms.uWave = { value: 0 };
    flagMat.userData.shader = sh;
    sh.vertexShader = 'uniform float uWave;\n' + sh.vertexShader.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
       float sway = sin(position.x * 4.2 + uWave) * 0.055 * (position.x / ${flagW.toFixed(2)} + 0.5);
       transformed.z += sway;
       transformed.y += sin(position.x * 3.1 + uWave * 1.3) * 0.012;`
    );
  };
  const flag = new THREE.Mesh(flagGeo, flagMat);
  flag.position.set(flagW / 2 + 0.03, poleH - flagH / 2 - 0.08, 0);
  flag.userData.isFlag = true;
  g.add(flag);
  g.userData.flagMat = flagMat;
  g.add(shadowPatch(1.0, 1.0, 0.3));
  return g;
}

/* ---------------- 军团（阵形实例化方阵 + 军种分形） ---------------- */

const KIND_SHAPES = {
  inf:     { cols: 14, gapX: 0.44, gapZ: 0.4 },
  cav:     { cols: 8, gapX: 0.6, gapZ: 0.52 },
  archer:  { cols: 16, gapX: 0.4, gapZ: 0.62 },
  knight:  { cols: 6, gapX: 0.54, gapZ: 0.5 },
  chariot: { cols: 5, gapX: 0.8, gapZ: 1.05 },
  ship:    { cols: 3, gapX: 0.9, gapZ: 1.6 },
};

function unitCount(str) {
  return clamp(Math.round(22 + 34 * Math.sqrt(Math.max(str, 0.05))), 22, 132);
}

function buildFormation(unit, battle, proj, dem, exag) {
  const g = new THREE.Group();
  const colA = battle.sideColors[0], colB = battle.sideColors[1];
  const col = unit.side === 'a' ? colA : colB;
  const colCss = '#' + new THREE.Color(col).getHexString();

  if (unit.kind === 'ship') {
    const fleet = buildFleet(unit, col, proj, dem, exag);
    g.add(fleet.group);
    g.userData.fleet = fleet;
  } else {
    const shape = KIND_SHAPES[unit.kind] || KIND_SHAPES.inf;
    const n = unitCount(unit.str);
    const rows = Math.ceil(n / shape.cols);
    const bodyGeo = new THREE.BoxGeometry(0.3, 0.5, 0.24);
    const headGeo = new THREE.ConeGeometry(0.15, 0.2, 6);
    const bodyMat = matStd(col, { roughness: 0.72, metalness: 0.05 });
    const headMat = matStd(new THREE.Color(col).offsetHSL(0, 0.03, 0.2).getHex(), { roughness: 0.62 });
    const bodies = new THREE.InstancedMesh(bodyGeo, bodyMat, n);
    const heads = new THREE.InstancedMesh(headGeo, headMat, n);
    const rowCol = new THREE.Color();
    const rnd = seedRand((unit.id || 'u').length * 733 + n);
    const M = new THREE.Matrix4();
    const Q = new THREE.Quaternion();
    let placed = 0;
    for (let i = 0; i < n; i++) {
      const r = Math.floor(i / shape.cols), c = i % shape.cols;
      const x = (c - (shape.cols - 1) / 2) * shape.gapX + (rnd() - 0.5) * 0.1;
      const z = (r - (rows - 1) / 2) * shape.gapZ + (rnd() - 0.5) * 0.1;
      const ry = (rnd() - 0.5) * 0.3;
      const sc = 0.86 + rnd() * 0.3;
      Q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), ry);
      M.compose(new THREE.Vector3(x, 0.28 * sc, z), Q, new THREE.Vector3(sc, sc, sc));
      bodies.setMatrixAt(i, M);
      M.compose(new THREE.Vector3(x, 0.63 * sc, z), Q, new THREE.Vector3(sc, sc, sc));
      heads.setMatrixAt(i, M);
      /* 奇偶行明度差，打破"纯色毯" */
      const shade = (r % 2 === 0 ? 1 : 0.82) * (0.92 + rnd() * 0.16);
      rowCol.setRGB(
        clamp(((col >> 16) & 255) / 255 * shade, 0, 1),
        clamp(((col >> 8) & 255) / 255 * shade, 0, 1),
        clamp((col & 255) / 255 * shade, 0, 1)
      );
      bodies.setColorAt(i, rowCol);
      placed++;
    }
    if (bodies.instanceColor) bodies.instanceColor.needsUpdate = true;
    bodies.count = placed; heads.count = placed;
    bodies.instanceMatrix.needsUpdate = true;
    heads.instanceMatrix.needsUpdate = true;
    /* 阵基薄台：让兵团读成一个"块" */
    const slabW = shape.cols * shape.gapX, slabD = rows * shape.gapZ;
    const slab = new THREE.Mesh(
      new THREE.BoxGeometry(slabW, 0.09, slabD),
      matStd(0x2f281e, { roughness: 0.95, transparent: true, opacity: 0.42 })
    );
    slab.position.y = 0.045;
    g.add(slab);
    g.add(bodies); g.add(heads);
    g.userData.bodies = bodies;
    g.userData.heads = heads;
    g.userData.bodyMats = [bodyMat, headMat];
    /* 车阵/骑队加轮式底座示意 */
    if (unit.kind === 'chariot') {
      for (let i = 0; i < Math.min(n, 8); i++) {
        const wheel = new THREE.Mesh(
          new THREE.TorusGeometry(0.09, 0.024, 6, 14),
          matStd(0x5a4428, { roughness: 0.85 })
        );
        const r = Math.floor(i / 4), c = i % 4;
        wheel.position.set((c - 1.5) * 0.5, 0.09, (r - 1) * 0.72);
        wheel.rotation.y = Math.PI / 2;
        g.add(wheel);
      }
    }
  }
  /* 军旗 */
  const flag = buildFlag(col, unit.flag || (unit.side === 'a' ? '甲' : '乙'), unit.kind === 'ship' ? 1.7 : 2.5);
  flag.position.set(0, 0, 0);
  g.add(flag);
  if (unit.kind !== 'ship') {
    const slabW2 = (KIND_SHAPES[unit.kind] || KIND_SHAPES.inf).cols * (KIND_SHAPES[unit.kind] || KIND_SHAPES.inf).gapX + 0.5;
    g.add(shadowPatch(slabW2 + 0.8, 3.4, 0.36));
  } else {
    g.add(shadowPatch(2.6, 4.4, 0.34));
  }
  return g;
}

/* 战船：CatmullRom 放样船壳 + 舷缘弯管 + 桅杆 + 三角帆（全队 bake 合并，draw call 收敛） */

/* 顶点色合并：多部件几何 bake 为单 BufferGeometry（position/normal/color），单材质单 draw call */
function mergePartsToGeo(parts) {
  const baked = [];
  let total = 0;
  for (const p of parts) {
    const g = p.geo.index ? p.geo.toNonIndexed() : p.geo;
    if (p.matrix) g.applyMatrix4(p.matrix);
    if (!g.getAttribute('normal')) g.computeVertexNormals();
    const n = g.getAttribute('position').count;
    const cols = new Float32Array(n * 3);
    const c = new THREE.Color(p.color);
    for (let i = 0; i < n; i++) { cols[i * 3] = c.r; cols[i * 3 + 1] = c.g; cols[i * 3 + 2] = c.b; }
    g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    baked.push(g);
    total += n;
  }
  const pos = new Float32Array(total * 3), nor = new Float32Array(total * 3), col = new Float32Array(total * 3);
  let off = 0;
  for (const g of baked) {
    const n = g.getAttribute('position').count;
    pos.set(g.getAttribute('position').array, off * 3);
    nor.set(g.getAttribute('normal').array, off * 3);
    col.set(g.getAttribute('color').array, off * 3);
    off += n;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  out.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return out;
}

/* 单船部件表（船体局部坐标，供全队 bake 用） */
function shipParts(colHex, withSail) {
  const parts = [];
  const M = (x, y, z, rx = 0, ry = 0) => new THREE.Matrix4().makeRotationY(ry).multiply(new THREE.Matrix4().makeRotationX(rx)).setPosition(x, y, z);
  /* 船壳放样：截面轮廓 × 长度缩放 */
  const prof = [[-0.26, 0.02], [-0.3, 0.14], [-0.24, 0.24], [0, 0.3], [0.24, 0.24], [0.3, 0.14], [0.26, 0.02]];
  const L = 1.5;
  const secs = loftSections(
    [[0, 0.06, -L / 2], [0, 0.04, -L / 4], [0, 0.04, L / 4], [0, 0.1, L / 2]],
    prof,
    [0.4, 0.82, 0.96, 0.7]
  );
  parts.push({ geo: loftSkin(secs), color: 0x7a5636 });
  /* 舷缘（Tube 弯管） */
  const gunCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.25, 0.24, -L / 2 * 0.86),
    new THREE.Vector3(-0.3, 0.26, 0),
    new THREE.Vector3(-0.25, 0.24, L / 2 * 0.8),
    new THREE.Vector3(0, 0.3, L / 2 * 0.92),
    new THREE.Vector3(0.25, 0.24, L / 2 * 0.8),
    new THREE.Vector3(0.3, 0.26, 0),
    new THREE.Vector3(0.25, 0.24, -L / 2 * 0.86),
  ]);
  parts.push({ geo: new THREE.TubeGeometry(gunCurve, 40, 0.024, 6), color: 0x8f6a40 });
  /* 舱楼 */
  parts.push({ geo: new THREE.BoxGeometry(0.3, 0.16, 0.44), color: 0x6a4a2c, matrix: M(0, 0.3, -L / 4) });
  if (withSail) {
    parts.push({ geo: new THREE.CylinderGeometry(0.02, 0.028, 0.95, 6), color: 0x584326, matrix: M(0, 0.7, 0.1) });
    const sailCol = new THREE.Color('#' + new THREE.Color(colHex).getHexString()).lerp(new THREE.Color(0xf0e6cf), 0.62).getHex();
    parts.push({ geo: new THREE.PlaneGeometry(0.5, 0.6, 6, 4), color: sailCol, matrix: M(0, 0.82, 0.16, 0, Math.PI / 2) });
  }
  return parts;
}

function buildFleet(unit, colHex, proj, dem, exag) {
  const g = new THREE.Group();
  const n = clamp(Math.round(6 + unit.str * 4), 5, 13);
  const rnd = seedRand((unit.id || 's').length * 421 + n * 17);
  /* 按纵列分桶 bake（3 列各 1 组合并网格，保留逐列微浪相位差，draw call 收敛） */
  const colParts = [[], [], []];
  const colPens = [[], [], []];
  for (let i = 0; i < n; i++) {
    const r = Math.floor(i / 3), c = i % 3;
    const scale = 0.8 + rnd() * 0.3;
    const withSail = unit.id !== 'huanggai' || rnd() > 0.3;
    const px = (c - 1) * 0.85 + (rnd() - 0.5) * 0.3;
    const pz = (r - (Math.ceil(n / 3) - 1) / 2) * 1.5 + (rnd() - 0.5) * 0.5;
    const ry = (rnd() - 0.5) * 0.22;
    const shipM = new THREE.Matrix4().compose(
      new THREE.Vector3(px, 0, pz),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)),
      new THREE.Vector3(scale, scale, scale)
    );
    for (const p of shipParts(colHex, withSail)) {
      p.matrix = p.matrix ? new THREE.Matrix4().multiplyMatrices(shipM, p.matrix) : shipM;
      colParts[c].push(p);
    }
    if (withSail) {
      /* 旗：独立 basic 材质合并层 */
      const penGeo = new THREE.PlaneGeometry(0.2, 0.1).toNonIndexed();
      penGeo.applyMatrix4(new THREE.Matrix4().multiplyMatrices(shipM, new THREE.Matrix4().setPosition(0.1, 1.18, 0.1)));
      colPens[c].push(penGeo);
    }
  }
  const woodMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.82, metalness: 0.06, vertexColors: true, side: THREE.DoubleSide });
  const penMat = new THREE.MeshBasicMaterial({ color: colHex, side: THREE.DoubleSide });
  const cols = [];
  colParts.forEach((parts, c) => {
    if (!parts.length) return;
    const cg = new THREE.Group();
    cg.add(new THREE.Mesh(mergePartsToGeo(parts), woodMat));
    if (colPens[c].length) {
      let tot = 0; for (const gg of colPens[c]) tot += gg.getAttribute('position').count;
      const pos = new Float32Array(tot * 3);
      let off = 0;
      for (const gg of colPens[c]) { pos.set(gg.getAttribute('position').array, off * 3); off += gg.getAttribute('position').count; }
      const penOut = new THREE.BufferGeometry();
      penOut.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      penOut.computeVertexNormals();
      cg.add(new THREE.Mesh(penOut, penMat));
    }
    g.add(cg);
    cols.push(cg);
  });
  return { group: g, ships: cols };
}

/* ---------------- 进军箭头（路径丝带 shader：揭示 + 流动虚线 + 锥头） ---------------- */

function worldPath(pts, proj, dem, exag, lift = 0.14) {
  return pts.map(([lo, la]) => {
    const x = proj.x(lo), z = proj.z(la);
    const y = dem.sample(...n_uv([lo, la], proj)) * exag * HMAX + lift;
    return new THREE.Vector3(x, y, z);
  });
}

function buildArrow(arrow, proj, dem, exag, colHex) {
  const world = worldPath(arrow.pts, proj, dem, exag, arrow.kind === 'retreat' ? 0.2 : 0.13);
  if (world.length < 2) return null;
  const curve = new THREE.CatmullRomCurve3(world, false, 'catmullrom', 0.4);
  const N = Math.min(120, Math.max(36, world.length * 22));
  const halfW = arrow.kind === 'retreat' ? 0.16 : 0.24;
  const pos = [];
  const uvs = [];
  const idx = [];
  const tan = new THREE.Vector3();
  const perp = new THREE.Vector3();
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const p = curve.getPoint(t);
    tan.copy(curve.getTangent(t));
    perp.set(tan.z, 0, -tan.x).normalize();
    pos.push(p.x + perp.x * halfW, p.y, p.z + perp.z * halfW);
    pos.push(p.x - perp.x * halfW, p.y, p.z - perp.z * halfW);
    uvs.push(t, 0, t, 1);
    if (i < N) {
      const a = i * 2;
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(idx);
  const retreat = arrow.kind === 'retreat';
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: {
      uCol: { value: new THREE.Color(colHex) },
      uAdv: { value: 0 },
      uTime: { value: 0 },
      uDash: { value: retreat ? 3.2 : 5.6 },
      uGap: { value: retreat ? 0.62 : 0.24 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `
      uniform vec3 uCol;
      uniform float uAdv, uTime, uDash, uGap;
      varying vec2 vUv;
      void main() {
        if (vUv.x > uAdv) discard;
        float edge = smoothstep(uAdv, uAdv - 0.06, vUv.x);
        float dash = fract(vUv.x * uDash * 10.0 - uTime * 0.85);
        float band = smoothstep(uGap, uGap + 0.2, dash);
        float spine = smoothstep(0.0, 0.34, vUv.y) * smoothstep(1.0, 0.66, vUv.y);
        vec3 col = mix(uCol, vec3(1.0, 0.94, 0.8), band * 0.22);
        float a = (0.28 + band * 0.5 + spine * 0.16) * edge;
        gl_FragColor = vec4(col, a * 0.9);
      }`,
  });
  /* 箭头锥体：随揭示进度贴着路径头滑行 */
  const head = new THREE.Mesh(
    new THREE.ConeGeometry(0.26, 0.6, 10),
    new THREE.MeshBasicMaterial({ color: colHex, transparent: true, opacity: 0.95 })
  );
  head.visible = false;
  const group = new THREE.Group();
  const ribbon = new THREE.Mesh(geo, mat);
  ribbon.renderOrder = 6;
  group.add(ribbon);
  group.add(head);
  group.userData = { mat, head, curve, retreat };
  return group;
}

function tickArrow(obj, adv, time) {
  const u = obj.userData;
  u.mat.uniforms.uAdv.value = adv;
  u.mat.uniforms.uTime.value = time;
  if (adv > 0.05) {
    const p = u.curve.getPoint(Math.min(adv, 1));
    const tg = u.curve.getTangent(Math.min(adv, 1));
    u.head.visible = true;
    u.head.position.copy(p);
    u.head.position.y += 0.06;
    u.head.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tg.clone().normalize());
    u.head.material.opacity = adv >= 0.995 ? 0.95 : 0.6 + adv * 0.35;
  } else {
    u.head.visible = false;
  }
}

/* ---------------- 阶段标签（侧色底条文字精灵） ---------------- */

function chipTexture(text, sideCol) {
  const cv = document.createElement('canvas');
  const ctx = cv.getContext('2d');
  const font = '600 30px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.font = font;
  const w = Math.ceil(ctx.measureText(text).width) + 44;
  cv.width = w; cv.height = 52;
  const c2 = cv.getContext('2d');
  const col = new THREE.Color(sideCol);
  c2.fillStyle = `rgba(${col.r * 255 | 0},${col.g * 255 | 0},${col.b * 255 | 0},0.88)`;
  c2.beginPath(); c2.roundRect(2, 2, w - 4, 48, 24); c2.fill();
  c2.strokeStyle = 'rgba(255,246,230,0.8)';
  c2.lineWidth = 2.5;
  c2.beginPath(); c2.roundRect(2, 2, w - 4, 48, 24); c2.stroke();
  c2.font = font;
  c2.fillStyle = '#fff8ec';
  c2.textAlign = 'center'; c2.textBaseline = 'middle';
  c2.shadowColor = 'rgba(0,0,0,0.4)';
  c2.shadowBlur = 3;
  c2.fillText(text, w / 2, 28);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return { tex, w };
}

function buildNote(note, proj, dem, exag, sideCol) {
  const { tex, w } = chipTexture(note.text, sideCol);
  const scale = 0.0115;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false }));
  sp.scale.set(w * scale, 52 * scale, 1);
  const y = dem.sample(...n_uv(note.at, proj)) * exag * HMAX;
  sp.position.set(proj.x(note.at[0]), y + 0.85, proj.z(note.at[1]));
  sp.renderOrder = 12;
  sp.userData.noteAt = note.t ?? 0.25;
  return sp;
}

/* ---------------- 交战 / 火攻特效 ---------------- */

function makeSparkBurst(n = 34) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  const mat = new THREE.PointsMaterial({
    color: 0xffd88a, size: 0.14, transparent: true, opacity: 0.95, depthWrite: false,
  });
  const pts = new THREE.Points(geo, mat);
  pts.visible = false;
  pts.userData.n = n;
  pts.userData.vel = [];
  return pts;
}

function fireSparkBurst(pts, center, time, active) {
  if (!active) { pts.visible = false; return; }
  pts.visible = true;
  const n = pts.userData.n;
  const pos = pts.geometry.attributes.position;
  const rnd = seedRand(77);
  for (let i = 0; i < n; i++) {
    const a = time * (2.2 + rnd() * 2.6) + i * TAU / n;
    const rr = 0.3 + ((time * 3.4 + i * 1.7) % 1.4);
    pos.setXYZ(i,
      center.x + Math.cos(a) * rr,
      center.y + 0.15 + Math.sin(a * 2.1) * 0.22 + ((time * 1.4 + i) % 1) * 0.5,
      center.z + Math.sin(a * 1.3) * rr * 0.8);
  }
  pos.needsUpdate = true;
  pts.material.opacity = 0.55 + Math.sin(time * 9) * 0.3;
}

function makeEmberPlume(n = 64) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  const mat = new THREE.PointsMaterial({
    color: 0xff9a3c, size: 0.2, transparent: true, opacity: 0.9, depthWrite: false,
  });
  const pts = new THREE.Points(geo, mat);
  pts.visible = false;
  pts.userData.n = n;
  return pts;
}

function fireEmberPlume(pts, center, time, active) {
  if (!active) { pts.visible = false; return; }
  pts.visible = true;
  const n = pts.userData.n;
  const pos = pts.geometry.attributes.position;
  const rnd = seedRand(31);
  for (let i = 0; i < n; i++) {
    const cyc = (time * (0.5 + rnd() * 0.5) + rnd()) % 1;
    const a = rnd() * TAU + time * (0.6 + rnd());
    const rr = 0.2 + cyc * 1.7;
    pos.setXYZ(i,
      center.x + Math.cos(a) * rr * 0.9,
      center.y + cyc * 2.6 + Math.sin(time * 3 + i) * 0.14,
      center.z + Math.sin(a) * rr * 0.7);
  }
  pos.needsUpdate = true;
  pts.material.opacity = 0.85;
}

/* ---------------- 沙盘装配与切换 ---------------- */

let battleGroup = null;      // 当前战场根节点
let disposables = [];        // 本战场所有需释放的资源
let current = null;          // { battle, proj, dem, terrain, water, units, markers, arrows, notes, exag }
const terrainInjU = { night: 0, fire: 0 };
let nightK = 0;

function n_uv(at, proj) {
  const spanLon = MAP_W / proj.kx;
  const spanLat = proj.mapD / proj.kz;
  return [(at[0] - proj.cLon) / spanLon + 0.5, (at[1] - proj.cLat) / spanLat + 0.5];
}

function disposeBattle() {
  if (!battleGroup) return;
  scene.remove(battleGroup);
  for (const d of disposables) {
    if (d.dispose) d.dispose();
  }
  disposables = [];
  battleGroup = null;
  current = null;
}

function track(d) { disposables.push(d); return d; }

function loadBattleScene(b) {
  disposeBattle();
  const proj = makeProj(b);
  const dem = buildDEM(b, proj);
  const mapTex = track(paintMapTexture(b, proj, dem));
  const ter = buildTerrain(b, proj, dem, mapTex);
  track(ter.geo); track(ter.mat);
  const water = buildWater(b, proj, dem, state.exag);
  if (water) { track(water.mesh.geometry); track(water.mat); }

  battleGroup = new THREE.Group();
  battleGroup.add(ter.mesh);
  if (water) battleGroup.add(water.mesh);
  battleGroup.add(buildCompass(proj, dem, state.exag));
  battleGroup.add(buildScaleBar(proj, dem, state.exag));

  /* 注记 */
  const markers = [];
  const pickables = [];
  for (const place of b.places || []) {
    let m;
    if (place.kind === 'city') m = buildCityMarker(place, proj, dem, state.exag, b.sideColors[place.side === 'b' ? 1 : 0]);
    else if (place.kind === 'camp') m = buildCampMarker(place, proj, dem, state.exag, b.sideColors[place.side === 'b' ? 1 : 0]);
    else if (place.kind === 'mount') m = buildMountMarker(place, proj, dem, state.exag);
    if (m) {
      battleGroup.add(m);
      markers.push(m);
      m.traverse((o) => { if (o.isMesh) { o.userData.pick = { type: 'place', place }; pickables.push(o); } });
    }
  }
  /* 地名标签（kind 无造型的：river/sea/dir/pass/label） */
  for (const place of b.places || []) {
    if (place.kind === 'city' || place.kind === 'camp' || place.kind === 'mount') continue;
    const y = dem.sample(...n_uv(place.at, proj)) * state.exag * HMAX;
    const sp = makeTextSprite(place.name, {
      fontSize: place.kind === 'river' || place.kind === 'sea' ? 30 : 34,
      color: place.kind === 'dir' ? '#d9cdb4' : '#f0ead9',
      scale: place.kind === 'dir' ? 0.0085 : 0.0092,
    });
    sp.position.set(proj.x(place.at[0]), y + 0.5, proj.z(place.at[1]));
    sp.renderOrder = 8;
    battleGroup.add(sp);
  }
  /* 城营山名标签 */
  for (const place of b.places || []) {
    if (place.kind !== 'city' && place.kind !== 'camp' && place.kind !== 'mount') continue;
    const y = dem.sample(...n_uv(place.at, proj)) * state.exag * HMAX;
    const sp = makeTextSprite(place.name, { fontSize: 36, color: '#f4eee0', scale: 0.0098 });
    sp.position.set(proj.x(place.at[0]), y + (place.kind === 'mount' ? 1.55 : 1.75), proj.z(place.at[1]));
    sp.renderOrder = 9;
    battleGroup.add(sp);
  }
  /* 墙体 */
  const walls = [];
  for (const wall of b.walls || []) {
    const w = buildWallFeature(wall, proj, dem, state.exag, b.sideColors[wall.side === 'b' ? 1 : 0]);
    battleGroup.add(w);
    walls.push(w);
    w.traverse((o) => { if (o.isMesh) { o.userData.pick = { type: 'wall', wall }; pickables.push(o); } });
  }

  /* 军团 */
  const unitObjs = new Map();
  for (const unit of b.units || []) {
    const ug = buildFormation(unit, b, proj, dem, state.exag);
    const y0 = dem.sample(...n_uv(unit.home, proj)) * state.exag * HMAX;
    ug.position.set(proj.x(unit.home[0]), y0, proj.z(unit.home[1]));
    ug.userData.unit = unit;
    ug.userData.cur = { x: ug.position.x, z: ug.position.z };
    battleGroup.add(ug);
    unitObjs.set(unit.id, ug);
    ug.traverse((o) => { if (o.isMesh && !o.userData.isFlag) { o.userData.pick = { type: 'unit', unit }; pickables.push(o); } });
  }

  /* 特效池 */
  const sparks = makeSparkBurst();
  const embers = makeEmberPlume();
  battleGroup.add(sparks);
  battleGroup.add(embers);

  const arrowsGroup = new THREE.Group();
  const notesGroup = new THREE.Group();
  battleGroup.add(arrowsGroup);
  battleGroup.add(notesGroup);

  scene.add(battleGroup);
  current = {
    battle: b, proj, dem, ter, water,
    markers, walls, unitObjs, pickables,
    arrowsGroup, notesGroup, sparks, embers,
    arrowsBuilt: -1, notesBuilt: -1,
    shake: 0,
  };
}

/* 阶段内容装配：箭头 + 标签按阶段重建（旧组释放） */
function buildPhaseDecor(phaseIdx) {
  if (!current || current.arrowsBuilt === phaseIdx) return;
  const b = current.battle;
  const phase = b.phases[phaseIdx];
  /* 清空旧箭头/标签 */
  while (current.arrowsGroup.children.length) {
    const ch = current.arrowsGroup.children.pop();
    ch.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
  }
  while (current.notesGroup.children.length) {
    const ch = current.notesGroup.children.pop();
    if (ch.material?.map) ch.material.map.dispose();
    ch.material?.dispose();
  }
  for (const arrow of phase.arrows || []) {
    const colHex = b.sideColors[arrow.side === 'b' ? 1 : 0];
    const obj = buildArrow(arrow, current.proj, current.dem, state.exag, colHex);
    if (obj) { current.arrowsGroup.add(obj); track(obj.children[0].geometry); }
  }
  for (const note of phase.notes || []) {
    const colHex = b.sideColors[note.side === 'b' ? 1 : 0];
    current.notesGroup.add(buildNote(note, current.proj, current.dem, state.exag, colHex));
  }
  current.arrowsBuilt = phaseIdx;
  current.notesBuilt = phaseIdx;
}

/* ---------------- 战役数据（九场，全部文案自写） ----------------
 * geo：手工地貌参数（山脊线 / 山峰 / 河流 / 湖泊 / 海岸 / 平原），经纬度为史地常识量级。 */

const SIDE_COLORS = ['#d8613f', '#4f7fb5'];

const BATTLES = [
{
  id: 'changping', title: '长平之战', sub: '前 260 年 · 秦 对 赵', era: '战国', unit: '万',
  sides: { a: { name: '秦军', flag: '秦' }, b: { name: '赵军', flag: '赵' } },
  sideColors: SIDE_COLORS, bars: [60, 45],
  geo: {
    seed: 11, cLon: 112.9, cLat: 35.82, span: [1.05, 0.72], biome: 'cn', freq: 5.0, forestDots: 2200,
    ridges: [
      [[112.42, 35.55], [112.5, 36.15], 0.16, 0.34],
      [[113.32, 35.55], [113.4, 36.1], 0.18, 0.36],
      [[112.75, 36.2], [113.1, 36.24], 0.1, 0.22],
    ],
    peaks: [
      [[112.88, 35.94], 0.09, 0.07, 0.2],
      [[113.0, 35.68], 0.08, 0.06, 0.18],
    ],
    rivers: [
      [[[112.96, 36.18], [112.98, 36.05], [112.95, 35.95], [112.97, 35.85], [112.94, 35.75], [112.96, 35.64], [112.93, 35.52]], 0.035, 0.1],
    ],
  },
  places: [
    { at: [112.93, 35.79], name: '长平城', kind: 'city', desc: '丹水东岸的枢纽城邑，廉颇的统帅部设在这里，故地在今山西高平一带。' },
    { at: [112.88, 35.94], name: '韩王山', kind: 'mount', desc: '东岭制高点，赵军在此设前敌瞭望，山下连着东岸大营。' },
    { at: [113.0, 35.68], name: '大粮山', kind: 'mount', desc: '赵军屯粮之所，山势缓厚，与韩王山一北一南护住东岸。' },
    { at: [112.62, 35.84], name: '秦军西垒', kind: 'camp', side: 'b', flag: '秦', desc: '秦军在丹水西侧山地上垒起的营壁。赵括猛攻时，秦军诈败退入壁垒死守。' },
    { at: [113.08, 35.87], name: '赵军东垒', kind: 'camp', side: 'a', flag: '赵', big: true, desc: '廉颇沿东岸修筑的主营垒群，与东岭石长城连成一条防线。' },
    { at: [112.6, 35.5], name: '咸阳方向', kind: 'dir' },
    { at: [113.35, 36.1], name: '邯郸方向', kind: 'dir' },
    { at: [112.96, 35.7], name: '丹水', kind: 'river' },
  ],
  walls: [
    { name: '百里石长城', side: 'a', pts: [[113.24, 35.62], [113.28, 35.74], [113.26, 35.88], [113.29, 36.0], [113.26, 36.12]], desc: '赵军顺着东岭山脊垒起的一道石墙，拦住秦军东进的脚步，残迹如今仍寻得到。' },
  ],
  units: [
    { id: 'qinMain', side: 'b', kind: 'inf', flag: '秦', name: '秦军主力', str: 55, home: [112.6, 35.8], desc: '先由王龁统兵攻坚，后由白起秘密接掌上将军印。' },
    { id: 'qinOdd', side: 'b', kind: 'cav', flag: '奇', name: '奇兵二万五千', str: 2.5, home: [112.55, 35.62], desc: '白起埋下的奇兵，开战后果然迂回到赵军背后，截断退路。' },
    { id: 'qinCav', side: 'b', kind: 'cav', flag: '骑', name: '五千轻骑', str: 0.5, home: [112.72, 35.95], desc: '楔入赵军阵中的快骑，把赵军拦腰切成两段。' },
    { id: 'henei', side: 'b', kind: 'inf', flag: '募', name: '河内征发之众', str: 12, home: [112.45, 35.55], desc: '秦王亲自赶到河内郡，把当地十五岁以上的男丁统统点齐北上，抄了援兵和粮草的后路。' },
    { id: 'zhaoMain', side: 'a', kind: 'inf', flag: '赵', name: '赵军主力', str: 38, home: [113.08, 35.87], desc: '前期由廉颇坐镇死守，后期交给赵括，全盘改为进攻。' },
    { id: 'zhaoGuard', side: 'a', kind: 'inf', flag: '守', name: '留守营垒部队', str: 7, home: [113.14, 35.7], desc: '留在东岸营垒里的赵军，主力出击后与之一同被围。' },
  ],
  phases: [
    { title: '上党易手', date: '前 262 年', cam: { at: [112.9, 35.85], d: 34, yaw: 0, pitch: 56 },
      text: '上党郡成了与韩国本土断开的飞地。郡守冯亭不肯降秦，转手把全郡十七城献给赵国；赵国收下这份大礼，派廉颇领兵坐镇长平；秦国那边立刻发兵来抢。',
      moves: {
        zhaoMain: { path: [[113.34, 36.1], [113.2, 35.98], [113.1, 35.9], [113.08, 35.87]], state: 'move' },
        zhaoGuard: { path: [[113.2, 35.6], [113.16, 35.66], [113.14, 35.7]], state: 'move' },
        qinMain: { path: [[112.42, 35.52], [112.5, 35.66], [112.6, 35.8]], state: 'move' },
      },
      arrows: [
        { side: 'a', pts: [[113.34, 36.1], [113.2, 35.98], [113.1, 35.9], [113.08, 35.87]] },
        { side: 'b', pts: [[112.42, 35.52], [112.5, 35.66], [112.6, 35.8]] },
      ],
      notes: [{ at: [112.9, 35.79], text: '上党入赵', side: 'a', t: 0.5 }] },
    { title: '相持丹水', date: '前 262–前 260 年', cam: { at: [112.95, 35.83], d: 24, yaw: -8, pitch: 55 },
      text: '秦军攻势很凶，赵军初战失利，丹水西岸的地盘丢了大半。廉颇看出对手远来思战，索性退到东岸，靠着营垒群和东岭石长城闭门不出。这一耗，就是将近三年。',
      moves: { qinMain: { path: [[112.75, 35.84]], state: 'move' }, zhaoMain: { state: 'hold' } },
      arrows: [{ side: 'b', pts: [[112.6, 35.82], [112.75, 35.84]] }],
      notes: [{ at: [113.1, 35.85], text: '坚壁不出', side: 'a', t: 0.45 }] },
    { title: '反间换将', date: '前 260 年', cam: { at: [112.66, 35.8], d: 18, yaw: 14, pitch: 52 },
      text: '秦国暗中派人到邯郸放风：秦军真正忌惮的，只有马服君赵奢的儿子赵括。赵王本来就怪廉颇缩着不打，果然换将；同一时刻，秦国秘密拜白起为上将军，军中有敢提他名字者斩。',
      moves: {},
      notes: [
        { at: [112.64, 35.8], text: '白起密任', side: 'b', t: 0.35 },
        { at: [113.1, 35.87], text: '赵括接印', side: 'a', t: 0.7 },
      ] },
    { title: '赵括压上', date: '前 260 年秋', cam: { at: [112.9, 35.84], d: 20, yaw: 6, pitch: 54 },
      text: '赵括上任第一件事就是推翻廉颇的整套安排，带着主力强渡丹水，直奔秦军西垒。白起让前锋一路诈败，把赵军慢慢往壁垒前引；等赵军扑到垒下，怎么攻都攻不动了。',
      moves: {
        zhaoMain: { path: [[112.96, 35.85], [112.8, 35.83], [112.68, 35.82]], state: 'move' },
        qinMain: { path: [[112.64, 35.83]], state: 'fight' },
      },
      arrows: [{ side: 'a', pts: [[113.08, 35.87], [112.96, 35.85], [112.8, 35.83], [112.68, 35.82]] }],
      fx: { clash: [112.66, 35.83] },
      notes: [{ at: [112.7, 35.8], text: '诈败诱敌', side: 'b', t: 0.4 }] },
    { title: '奇兵断粮', date: '前 260 年秋', night: true, cam: { at: [112.85, 35.8], d: 26, yaw: -10, pitch: 57 },
      text: '口袋开始收口：两万五千奇兵绕到赵军背后掐断退路，五千轻骑从中间楔进去，把赵军截成两截；秦王又亲自赶到河内，征发全郡丁壮北上，把援兵和粮道一起堵死。被围的赵军绝粮四十六天，营里已经出现人相食的惨状。',
      moves: {
        qinOdd: { path: [[112.5, 35.64], [112.72, 35.66], [112.94, 35.7], [113.05, 35.78]], state: 'move' },
        qinCav: { path: [[112.72, 35.95], [112.86, 35.87]], state: 'move' },
        henei: { path: [[112.45, 35.55], [112.6, 35.6], [112.78, 35.64]], state: 'move' },
        zhaoMain: { state: 'hold' },
      },
      arrows: [
        { side: 'b', pts: [[112.5, 35.64], [112.72, 35.66], [112.94, 35.7], [113.05, 35.78]] },
        { side: 'b', pts: [[112.72, 35.95], [112.86, 35.87]] },
      ],
      notes: [{ at: [113.0, 35.72], text: '断粮四十六日', side: 'b', t: 0.55 }] },
    { title: '突围与坑杀', date: '前 260 年九月', cam: { at: [112.85, 35.8], d: 22, yaw: 10, pitch: 52 },
      text: '赵括把残军编成四队，轮番往外冲，全被弩阵压了回来。他亲自披甲带队搏杀，中箭而死；四十万饿到极点的赵军放下武器投降，几乎被全数坑杀。赵国从此再没有单独对抗秦国的力气。',
      moves: { zhaoMain: { state: 'fight' }, qinMain: { state: 'fight' }, qinOdd: { state: 'hold' } },
      fx: { clash: [112.9, 35.8], jolt: true },
      arrows: [{ side: 'a', kind: 'retreat', pts: [[112.8, 35.83], [112.9, 35.8], [113.0, 35.84]] }],
      notes: [{ at: [112.95, 35.76], text: '四十余万被坑杀', side: 'b', t: 0.6 }] },
  ],
  facts: { time: '前 260 年九月', place: '长平 · 今山西高平地界', cmd: ['白起（秦）', '赵括（赵）'], strength: ['约 60 万之众', '约 45 万之众'], result: '秦军全胜，赵军成建制力量被歼灭' },
  why: [
    '秦国的反间计奏效，赵国临阵把稳守的廉颇换成了轻进的赵括。',
    '白起先诈败诱敌，再用奇兵抄后、轻骑拦腰，赵军粮道应声而断。',
    '秦王亲赴河内总动员，十五岁以上男丁全部北上，援兵粮道被堵得死死的。',
  ],
  meaning: [
    '战国绞杀最烈的一战，赵国青壮折损大半，国运就此倾斜。',
    '六国失去单独抗秦的底气，秦统一路上最大的障碍被扫清。',
  ],
  quiz: [
    { q: '长平之战对阵的是哪两家？', opts: ['秦国与赵国', '齐国与楚国', '魏国与韩国', '燕国与中山'], a: 0, ex: '公元前 260 年，两国为上党这块地盘在长平撕破了脸。' },
    { q: '成语「纸上谈兵」讽刺的是哪位将领？', opts: ['廉颇', '赵括', '王龁', '白起'], a: 1, ex: '赵括熟读兵书却缺少实战，接替廉颇后贸然出击，全军覆没。' },
    { q: '白起派轻骑楔入赵军阵中的用意是？', opts: ['护送己方粮草', '把赵军拦腰截断', '假装溃败引诱追击', '抢占渡口渡河'], a: 1, ex: '五千轻骑把赵军切成前后两段，粮道随之断绝，合围成形。' },
  ],
},
{
  id: 'julu', title: '巨鹿之战', sub: '前 207 年 · 楚 对 秦', era: '秦末', unit: '万',
  sides: { a: { name: '楚军', flag: '楚' }, b: { name: '秦军', flag: '秦' } },
  sideColors: SIDE_COLORS, bars: [5, 40],
  geo: {
    seed: 27, cLon: 115.0, cLat: 37.15, span: [1.2, 0.85], biome: 'marsh', freq: 4.6, forestDots: 1600,
    ridges: [[[114.32, 36.8], [114.4, 37.5], 0.2, 0.3]],
    rivers: [
      [[[114.42, 37.08], [114.68, 37.05], [114.95, 37.02], [115.2, 37.06], [115.45, 37.02], [115.68, 37.06]], 0.05, 0.09],
    ],
    lakes: [[[115.3, 36.95], [115.62, 36.9], [115.78, 36.74], [115.55, 36.7], [115.32, 36.8]]],
  },
  places: [
    { at: [115.05, 37.26], name: '巨鹿城', kind: 'city', desc: '赵王歇与张耳困守的孤城，被王离的长城军团围了个水泄不通。' },
    { at: [115.0, 36.88], name: '棘原', kind: 'camp', side: 'b', flag: '章', desc: '章邯大军的屯驻地。甬道从这儿往北修，粮草一路送到巨鹿城下。' },
    { at: [115.42, 37.44], name: '诸侯军营垒', kind: 'camp', flag: '援', big: true, desc: '陈馀与齐燕援军扎在北面高处，筑垒自保，只敢远远张望。' },
    { at: [114.62, 37.32], name: '太行山', kind: 'mount' },
    { at: [115.55, 36.82], name: '大陆泽', kind: 'river' },
    { at: [114.6, 37.0], name: '漳水', kind: 'river' },
    { at: [114.45, 36.62], name: '安阳方向', kind: 'dir' },
  ],
  walls: [
    { name: '甬道', side: 'b', kind: 'corridor', pts: [[115.02, 36.94], [115.04, 37.06], [115.05, 37.18]], desc: '两旁夯起土墙的运粮走道，粮车在其中通行无阻，是王离军的命根子。' },
  ],
  units: [
    { id: 'chu', side: 'a', kind: 'inf', flag: '楚', name: '项羽楚军', str: 3.2, home: [114.5, 36.66], desc: '项羽亲率的主力，渡河后砸锅沉船，只带三天口粮。' },
    { id: 'vanguard', side: 'a', kind: 'inf', flag: '先', name: '英布、蒲将军先遣', str: 2, home: [114.62, 36.8], desc: '项羽先派出的两万人，先期渡漳水去截甬道。' },
    { id: 'wangli', side: 'b', kind: 'inf', flag: '王', name: '王离军（长城军团）', str: 20, home: [115.1, 37.3], desc: '从北疆长城防线调回来的二十万精锐，调头南下把巨鹿死死围住。' },
    { id: 'zhanghan', side: 'b', kind: 'inf', flag: '章', name: '章邯军', str: 20, home: [115.0, 36.88], desc: '击败项梁的秦军主力，屯驻棘原专责运粮护道。' },
    { id: 'chenyu', side: 'a', kind: 'inf', flag: '陈', name: '陈馀收拢的赵地援军', str: 3, home: [115.42, 37.44], desc: '数万援军屯在巨鹿北面，不敢与秦军接战。' },
    { id: 'qiyan', side: 'a', kind: 'inf', flag: '齐', name: '齐燕援军', str: 4, home: [115.56, 37.5], desc: '各国来救赵的队伍，筑起营垒作壁上观。' },
  ],
  phases: [
    { title: '秦军围赵', date: '前 208 年冬', cam: { at: [115.0, 37.15], d: 34, yaw: 0, pitch: 56 },
      text: '章邯击溃项梁后掉头北上，王离带着长城军团把赵王歇困在巨鹿城内；章邯自己屯在棘原，修甬道供粮。赶来救赵的各路诸侯在北面扎下营盘自保，谁也不肯先动手。',
      moves: {
        wangli: { path: [[115.4, 37.5], [115.24, 37.4], [115.1, 37.3]], state: 'move' },
        zhanghan: { state: 'camp' }, chenyu: { state: 'camp' }, qiyan: { state: 'camp' },
      },
      arrows: [{ side: 'b', pts: [[115.4, 37.5], [115.24, 37.4], [115.1, 37.3]] }],
      notes: [{ at: [115.08, 37.26], text: '巨鹿被围', side: 'b', t: 0.5 }] },
    { title: '项羽夺军', date: '前 207 年', cam: { at: [114.6, 36.72], d: 16, yaw: 0, pitch: 55 },
      text: '楚怀王派宋义挂帅救赵，大军走到安阳就地停下，一连四十六天按兵不动，想坐看秦赵两败俱伤。项羽在帐中斩了宋义，众军拥他代理上将军，即刻挥师北上。',
      moves: { chu: { path: [[114.5, 36.66], [114.68, 36.84]], state: 'move' } },
      arrows: [{ side: 'a', pts: [[114.5, 36.66], [114.68, 36.84]] }],
      notes: [{ at: [114.55, 36.72], text: '帐斩宋义', side: 'a', t: 0.4 }] },
    { title: '破釜沉舟', date: '前 207 年', cam: { at: [114.85, 36.98], d: 18, yaw: 0, pitch: 55 },
      text: '项羽先遣英布、蒲将军带两万人过漳水去掐甬道；接着亲领全军过河，船凿沉、锅砸烂、营帐烧光，一人只留三天干粮。过了这条河，就没有回头路了。',
      moves: {
        vanguard: { path: [[114.62, 36.8], [114.9, 36.94], [115.0, 36.96]], state: 'move' },
        chu: { path: [[114.68, 36.84], [114.95, 36.98], [115.05, 37.05]], state: 'move' },
      },
      arrows: [
        { side: 'a', pts: [[114.62, 36.8], [114.9, 36.94], [115.0, 36.96]] },
        { side: 'a', pts: [[114.68, 36.84], [114.95, 36.98], [115.05, 37.05]] },
      ],
      notes: [{ at: [114.9, 36.98], text: '破釜沉舟', side: 'a', t: 0.5 }] },
    { title: '九战九捷', date: '前 207 年', cam: { at: [115.1, 37.18], d: 20, yaw: -6, pitch: 54 },
      text: '楚军把王离军反包在巨鹿城下，先断甬道，再九战九捷：杀苏角、俘王离。楚军将士无不以一当十，喊杀声传出十几座营垒，诸侯军听得人人变色。',
      moves: {
        vanguard: { state: 'fight' }, chu: { state: 'fight' },
        wangli: { state: 'fight', str: [1, 0.35] }, zhanghan: { state: 'hold' },
      },
      arrows: [{ side: 'a', pts: [[115.05, 37.05], [115.1, 37.2]] }],
      fx: { clash: [115.08, 37.2], jolt: true },
      notes: [{ at: [115.15, 37.32], text: '王离被俘', side: 'a', t: 0.6 }] },
    { title: '作壁上观', date: '前 207 年', cam: { at: [115.45, 37.42], d: 16, yaw: 8, pitch: 54 },
      text: '楚军在同秦军拼命时，十几座营垒的兵将全扒着垒墙远远张望，一个个腿肚子发抖。打完之后项羽召见各路将领，他们进辕门时全改成跪姿往前蹭，头都不敢抬——诸侯的指挥权从此归了项羽。',
      moves: { chenyu: { state: 'hold' }, qiyan: { state: 'hold' }, chu: { state: 'camp' } },
      notes: [{ at: [115.42, 37.44], text: '作壁上观', side: 'a', t: 0.5 }] },
    { title: '章邯投降', date: '前 207 年七月', cam: { at: [114.95, 36.95], d: 20, yaw: -6, pitch: 52 },
      text: '项羽趁着势头往南压，在漳水沿线把章邯打了一轮又一轮。章邯朝内被猜忌、朝外无救兵，干脆领着二十万人马放下武器。秦军的家底就此输光，帝国的丧钟敲响了。',
      moves: {
        chu: { path: [[115.05, 37.05], [115.0, 36.92]], state: 'move' },
        zhanghan: { state: 'fight', str: [1, 0.3] },
      },
      arrows: [{ side: 'a', pts: [[115.05, 37.05], [115.0, 36.92]] }],
      fx: { clash: [114.98, 36.9] },
      notes: [{ at: [114.94, 36.84], text: '章邯降楚', side: 'a', t: 0.6 }] },
  ],
  facts: { time: '前 207 年', place: '巨鹿 · 今河北平乡地界', cmd: ['项羽（楚）', '王离、章邯（秦）'], strength: ['约 5 万', '约 40 万'], result: '楚军奇胜，秦军两大兵团就此报销' },
  why: [
    '破釜沉舟断了全军的退路，楚军只剩一条路：赢。',
    '先掐断甬道饿围城的王离军，再收拢拳头一个个砸。',
    '秦军两将互相观望，诸侯援军作壁上观，章邯最终孤立无援。',
  ],
  meaning: [
    '秦末乱局中的决胜一战，长城军团与刑徒军两大主力一朝报销。',
    '项羽由楚将一跃而为诸侯上将军，推翻秦廷的路就此铺平。',
  ],
  quiz: [
    { q: '「破釜沉舟」这个典故来自哪一仗？', opts: ['长平之战', '巨鹿之战', '官渡之战', '昆阳之战'], a: 1, ex: '项羽过漳水后凿船砸锅、只带三天干粮，向全军明示有进无退。' },
    { q: '楚军动手的第一刀砍向了秦军的什么？', opts: ['长城防线', '甬道（运粮走道）', '退往咸阳的大路', '黄河渡船'], a: 1, ex: '粮道一断，城下王离军的肚子立刻见底，攻势自然瓦解。' },
    { q: '诸侯援军在楚秦激战时袖手旁观，留下了哪个成语？', opts: ['隔岸观火', '坐山观虎斗', '作壁上观', '袖手旁观'], a: 2, ex: '十几座营垒的将士都趴在壁垒上看，谁也不肯先出战。' },
  ],
},
{
  id: 'guandu', title: '官渡之战', sub: '200 年 · 曹操 对 袁绍', era: '东汉末', unit: '万',
  sides: { a: { name: '曹军', flag: '曹' }, b: { name: '袁军', flag: '袁' } },
  sideColors: SIDE_COLORS, bars: [3, 10],
  geo: {
    seed: 42, cLon: 114.35, cLat: 35.2, span: [1.35, 0.95], biome: 'cn', freq: 4.4, forestDots: 1500,
    ridges: [[[113.72, 35.55], [113.78, 35.95], 0.14, 0.16]],
    rivers: [
      [[[113.55, 35.62], [113.9, 35.7], [114.3, 35.66], [114.7, 35.76], [115.1, 35.7], [115.45, 35.78]], 0.09, 0.07],
      [[[113.9, 35.05], [114.2, 35.02], [114.5, 35.08], [114.8, 35.04]], 0.045, 0.06],
    ],
  },
  places: [
    { at: [114.98, 35.58], name: '白马', kind: 'city', desc: '黄河南岸渡口，东郡太守刘延在此死守，颜良大军压境。' },
    { at: [114.6, 35.44], name: '延津', kind: 'city', desc: '黄河南岸的渡口。曹操两度在此做局调动袁军：一回声东击西，一回弃辎重钓敌。' },
    { at: [114.72, 35.86], name: '黎阳', kind: 'camp', side: 'b', flag: '袁', desc: '袁军前锋屯驻的黄河北岸桥头堡，大军由此渡河南下。' },
    { at: [114.32, 34.98], name: '官渡', kind: 'city', side: 'a', flag: '曹', desc: '曹操扼守的咽喉要地，背靠许都，挡住袁军南下的正路。' },
    { at: [114.55, 35.3], name: '袁绍大营', kind: 'camp', side: 'b', flag: '袁', big: true, desc: '袁军大营绵延几十里，垒起土山、竖起高橹，箭雨从高处泼进曹营。' },
    { at: [114.05, 35.22], name: '乌巢', kind: 'camp', side: 'b', flag: '乌', desc: '袁军屯粮所在，万余车粮草交由淳于琼看守，戒备松懈。' },
    { at: [114.25, 34.6], name: '许都方向', kind: 'dir' },
    { at: [114.95, 36.0], name: '河北方向', kind: 'dir' },
    { at: [114.4, 35.68], name: '黄河', kind: 'river' },
    { at: [114.4, 35.06], name: '官渡水', kind: 'river' },
  ],
  units: [
    { id: 'caoshu', side: 'a', kind: 'inf', flag: '曹', name: '曹操主力', str: 3, home: [114.32, 34.98], desc: '兵力远少于袁军，粮草也只剩个把月的存量。' },
    { id: 'guanyu', side: 'a', kind: 'cav', flag: '关', name: '关羽、张辽先锋', str: 0.4, home: [114.32, 34.98], desc: '白马之战里，关羽策马冲阵，于万众之中斩袁军大将颜良。' },
    { id: 'raid', side: 'a', kind: 'cav', flag: '夜', name: '曹操亲率五千步骑', str: 0.5, home: [114.4, 35.0], desc: '换上袁军的旗号，士兵嘴里衔枚、马嘴上了勒，趁夜抄小道扑向乌巢。' },
    { id: 'yuanshao', side: 'b', kind: 'inf', flag: '袁', name: '袁绍主力', str: 11, home: [114.9, 35.95], desc: '吞并河北四州后南下，号称精兵十万。' },
    { id: 'yanliang', side: 'b', kind: 'inf', flag: '颜', name: '颜良部', str: 1, home: [114.9, 35.95], desc: '袁军前锋，衔命过河去围白马城。' },
    { id: 'wenchou', side: 'b', kind: 'cav', flag: '文', name: '文丑、刘备骑兵', str: 0.6, home: [114.72, 35.86], desc: '五六千骑渡河追击曹军，在延津南中了辎重之计。' },
    { id: 'chunyu', side: 'b', kind: 'inf', flag: '淳', name: '淳于琼守军', str: 1, home: [114.05, 35.22], desc: '守乌巢粮屯的一万余人，戒备松懈。' },
  ],
  phases: [
    { title: '两强相争', date: '199–200 年', cam: { at: [114.4, 35.3], d: 36, yaw: 0, pitch: 56 },
      text: '袁绍坐拥河北四大州，粮食兵力都压曹操一头；曹操手里攥着天子，据有黄河以南。200 年，袁绍把大军摆到黎阳准备过河，曹操收缩主力守在官渡，卡死南下的通道。',
      moves: { yuanshao: { path: [[114.9, 35.95], [114.72, 35.86], [114.55, 35.3]], state: 'move' }, yanliang: { path: [[114.9, 35.95], [114.98, 35.62]], state: 'move' } },
      arrows: [
        { side: 'b', pts: [[114.9, 35.95], [114.72, 35.86], [114.55, 35.3]] },
        { side: 'b', pts: [[114.9, 35.95], [114.98, 35.62]] },
      ],
      notes: [{ at: [114.72, 35.86], text: '陈兵黎阳', side: 'b', t: 0.5 }] },
    { title: '白马解围', date: '200 年四月', cam: { at: [114.9, 35.56], d: 18, yaw: -6, pitch: 54 },
      text: '颜良把白马围了。荀攸献计：先奔延津装出渡河抄袁军背后的架势；袁绍果然分兵西救，曹操却带轻骑直扑白马。关羽一马当先冲进阵里斩了颜良，城围顿解。',
      moves: {
        guanyu: { path: [[114.32, 34.98], [114.6, 35.3], [114.9, 35.52]], state: 'move' },
        yanliang: { state: 'fight', str: [1, 0.4] },
      },
      arrows: [{ side: 'a', pts: [[114.32, 34.98], [114.6, 35.3], [114.9, 35.52]] }],
      fx: { clash: [114.95, 35.58] },
      notes: [
        { at: [114.6, 35.44], text: '声东击西', side: 'a', t: 0.3 },
        { at: [114.98, 35.54], text: '阵斩颜良', side: 'a', t: 0.7 },
      ] },
    { title: '延津诱敌', date: '200 年四月', cam: { at: [114.65, 35.46], d: 16, yaw: 4, pitch: 54 },
      text: '曹操带着白马百姓沿河西撤，袁军骑兵紧追不舍。曹军解鞍放马，把辎重堆在路上；袁兵下马抢夺财物的瞬间，曹军回身掩杀，文丑死于乱军之中。',
      moves: {
        wenchou: { path: [[114.72, 35.86], [114.62, 35.46]], state: 'move', str: [1, 0.3] },
        guanyu: { path: [[114.9, 35.52], [114.66, 35.44]], state: 'move' },
      },
      arrows: [{ side: 'b', pts: [[114.72, 35.86], [114.62, 35.46]] }],
      fx: { clash: [114.6, 35.44] },
      notes: [{ at: [114.55, 35.4], text: '抛辎重诱敌', side: 'a', t: 0.45 }] },
    { title: '官渡相持', date: '200 年八月至十月', cam: { at: [114.4, 35.15], d: 24, yaw: 0, pitch: 55 },
      text: '袁军兵锋压到官渡，土山越垒越高、楼橹越架越密，箭往曹营里泼，地道往营里挖。曹军推出霹雳车抛石砸橹，又掘深沟把地道截断。熬了几个月，曹营的粮食见了底，曹操动了退兵的念头，荀彧一封信把他按住：死守，等变。',
      moves: {
        yuanshao: { path: [[114.55, 35.3], [114.45, 35.2]], state: 'move' },
        caoshu: { state: 'hold' },
      },
      arrows: [{ side: 'b', pts: [[114.55, 35.3], [114.45, 35.2]] }],
      notes: [
        { at: [114.52, 35.26], text: '土山楼橹', side: 'b', t: 0.3 },
        { at: [114.35, 35.0], text: '霹雳车反击', side: 'a', t: 0.6 },
      ] },
    { title: '夜袭乌巢', date: '200 年十月 · 夜', night: true, cam: { at: [114.15, 35.24], d: 16, yaw: 8, pitch: 54 },
      text: '袁绍帐下的许攸连夜叛投曹操，送来一句值千金的话：袁军粮草全囤在乌巢，守将淳于琼没怎么设防。曹操留曹洪看家，点起五千步骑换袁军旗号，士兵衔枚、马口缚紧，小路夜行直插乌巢，放火把粮屯烧成白地。',
      moves: {
        raid: { path: [[114.4, 35.0], [114.2, 35.12], [114.06, 35.2]], state: 'move' },
        chunyu: { state: 'fight', str: [1, 0.25] },
      },
      arrows: [{ side: 'a', pts: [[114.4, 35.0], [114.2, 35.12], [114.06, 35.2]] }],
      fx: { fire: [114.05, 35.22], jolt: true },
      notes: [
        { at: [114.22, 35.08], text: '许攸来投', side: 'a', t: 0.2 },
        { at: [114.02, 35.28], text: '乌巢火起', side: 'a', t: 0.6 },
      ] },
    { title: '袁军溃败', date: '200 年十月', cam: { at: [114.3, 35.2], d: 24, yaw: 0, pitch: 54 },
      text: '乌巢的火光一冒，袁军人心先散了架。派去端曹营的张郃、高览当场倒戈，十万人的阵线整条垮掉；袁绍带着八百骑渡河北逃。河北归属，一夜之间见了分晓。',
      moves: {
        yuanshao: { path: [[114.45, 35.2], [114.55, 35.3], [114.72, 35.6], [114.9, 35.95]], state: 'retreat' },
        caoshu: { state: 'fight' },
      },
      arrows: [
        { side: 'b', kind: 'retreat', pts: [[114.45, 35.2], [114.55, 35.3], [114.72, 35.6], [114.9, 35.95]] },
        { side: 'b', pts: [[114.55, 35.3], [114.4, 35.1]] },
      ],
      fx: { clash: [114.35, 35.15], jolt: true },
      notes: [
        { at: [114.42, 35.16], text: '张郃倒戈', side: 'b', t: 0.4 },
        { at: [114.78, 35.66], text: '八百骑北逃', side: 'b', t: 0.7 },
      ] },
  ],
  facts: { time: '200 年十月', place: '官渡 · 今河南中牟东北地界', cmd: ['曹操（曹）', '袁绍（袁）'], strength: ['约 2–4 万', '约 10 万'], result: '曹军以少胜多' },
  why: [
    '曹操会用兵：白马声东击西、延津抛辎重诱敌，两仗先削掉袁军两根支柱。',
    '纳许攸之策奇袭乌巢，一把火烧掉袁军的命根。',
    '袁绍刚愎自用，谋士出走、将领倒戈，仗还没输人心先散。',
  ],
  meaning: [
    '北方最强割据势力就此衰落，曹操统一黄河以北只剩时间问题。',
    '教科书级的以寡击众：胜负手不在兵多，在粮道与人心。',
  ],
  quiz: [
    { q: '官渡之战对阵的是哪两家？', opts: ['曹操与刘备', '曹操与袁绍', '孙权与刘表', '袁绍与公孙瓒'], a: 1, ex: '200 年，曹操在官渡击退北方最强的袁绍，定下统一北方的基业。' },
    { q: '扭转官渡战局的关键一击是？', opts: ['水淹曹营', '夜袭乌巢、火烧粮屯', '阵前单挑斗将', '掘堤断水'], a: 1, ex: '乌巢粮屯被烧，袁军军心立散，随后全线崩溃。' },
    { q: '官渡一战胜负的最大后果是什么？', opts: ['曹操扫平河北只剩时间问题', '天下三分就此成形', '东汉王朝宣告终结', '曹操随即统一全国'], a: 0, ex: '袁绍势力垮掉后，曹操用几年时间清了河北，北方归于一统。' },
  ],
},
{
  id: 'chibi', title: '赤壁之战', sub: '208 年 · 孙刘联军 对 曹操', era: '东汉末', unit: '万',
  sides: { a: { name: '孙刘联军', flag: '联' }, b: { name: '曹军', flag: '曹' } },
  sideColors: SIDE_COLORS, bars: [5, 23],
  geo: {
    seed: 77, cLon: 113.8, cLat: 29.85, span: [1.6, 1.05], biome: 'marsh', freq: 4.8, forestDots: 1900,
    ridges: [[[114.3, 29.3], [114.9, 29.2], 0.24, 0.3]],
    rivers: [
      [[[112.85, 29.72], [113.3, 29.8], [113.7, 29.9], [114.05, 29.99], [114.4, 30.1], [114.7, 30.24], [114.95, 30.38]], 0.14, 0.16],
      [[[114.62, 30.62], [114.56, 30.42], [114.5, 30.24], [114.46, 30.13]], 0.05, 0.08],
    ],
    lakes: [[[112.95, 29.32], [113.3, 29.28], [113.4, 29.42], [113.1, 29.48], [112.9, 29.44]]],
  },
  places: [
    { at: [113.78, 29.86], name: '赤壁', kind: 'city', side: 'a', flag: '周', desc: '江南岸的赭红石壁，联军水寨沿下游扎开，周瑜在此设帐。' },
    { at: [113.6, 29.97], name: '乌林', kind: 'camp', side: 'b', flag: '曹', big: true, desc: '江北岸曹军主力与连环战船的停泊地，火攻之夜这里一片火海。' },
    { at: [114.42, 30.05], name: '夏口', kind: 'city', side: 'a', flag: '刘', desc: '汉水入江口的据点，刘备败退后与刘琦的人马在此会合。' },
    { at: [112.92, 29.79], name: '江陵', kind: 'city', side: 'b', flag: '曹', desc: '荆州水陆咽喉。曹军屯粮屯船的后方重镇，由曹仁留守。' },
    { at: [114.15, 30.16], name: '华容道', kind: 'dir', desc: '云梦泽边缘的泥泞小道，曹操残部由此步行北撤。' },
    { at: [113.15, 29.38], name: '洞庭湖', kind: 'river' },
    { at: [114.05, 30.4], name: '云梦泽', kind: 'river' },
    { at: [114.5, 29.3], name: '幕阜山', kind: 'mount' },
    { at: [113.9, 29.9], name: '长江', kind: 'river' },
  ],
  units: [
    { id: 'caozhu', side: 'b', kind: 'inf', flag: '曹', name: '曹操主力（北方步骑）', str: 20, home: [113.5, 30.06], desc: '对外号称八十万的陆军，实数二十多万，一上船就晕。' },
    { id: 'caoshui', side: 'b', kind: 'ship', flag: '水', name: '曹军水师（连环船）', str: 6, home: [113.6, 29.878], desc: '收编的荆州船队。为压住颠簸，曹操下令铁索把船首尾锁死。' },
    { id: 'liubei', side: 'a', kind: 'inf', flag: '刘', name: '刘备、刘琦之众', str: 2, home: [114.42, 30.05], desc: '当阳新败的残部约两万人，退到夏口才喘过气来。' },
    { id: 'zhouyu', side: 'a', kind: 'ship', flag: '周', name: '周瑜、程普水军', str: 3, home: [114.0, 29.965], desc: '江东三万水军，逆流而上迎敌，船小灵动、善用火器。' },
    { id: 'huanggai', side: 'a', kind: 'ship', flag: '火', name: '黄盖火船队', str: 0.3, home: [113.88, 29.94], desc: '十条蒙冲快舰，舱里塞满浸透油脂的柴薪，蒙上布、插上旗，扮成来降的船队。' },
  ],
  phases: [
    { title: '曹操南下', date: '208 年秋', cam: { at: [113.4, 29.9], d: 36, yaw: 0, pitch: 56 },
      text: '北方底定，曹操把兵锋转向荆州。刘表病死，接班的孩子直接举州投降，荆州的水军和船全换了旗；刘备从当阳一路被撵，退到夏口才算站住。',
      moves: {
        caozhu: { path: [[113.5, 30.06], [113.34, 29.98], [113.22, 29.9]], state: 'move' },
        caoshui: { path: [[113.6, 29.878]], state: 'move' },
        liubei: { path: [[114.9, 30.3], [114.62, 30.16]], state: 'retreat' },
      },
      arrows: [
        { side: 'b', pts: [[113.5, 30.06], [113.34, 29.98], [113.22, 29.9]] },
        { side: 'a', kind: 'retreat', pts: [[114.9, 30.3], [114.62, 30.16]] },
      ],
      notes: [{ at: [113.3, 29.98], text: '得荆州水军', side: 'b', t: 0.4 }] },
    { title: '孙刘联盟', date: '208 年冬', cam: { at: [114.0, 29.95], d: 26, yaw: -6, pitch: 55 },
      text: '诸葛亮过江说动孙权，周瑜把账算得明白：曹军舍鞍马、乘舟船，北方兵不服水土，疾病已起。孙权拍板迎战，三万水军与刘备合兵，逆流迎敌。',
      moves: {
        zhouyu: { path: [[114.0, 29.965], [113.85, 29.93], [113.72, 29.9]], state: 'move' },
        liubei: { path: [[114.62, 30.16], [114.25, 30.02], [114.0, 29.98]], state: 'move' },
      },
      arrows: [
        { side: 'a', pts: [[114.0, 29.965], [113.85, 29.93], [113.72, 29.9]] },
        { side: 'a', pts: [[114.62, 30.16], [114.25, 30.02], [114.0, 29.98]] },
      ],
      notes: [{ at: [114.0, 29.9], text: '联盟成', side: 'a', t: 0.5 }] },
    { title: '对峙赤壁', date: '208 年冬', cam: { at: [113.7, 29.9], d: 22, yaw: -8, pitch: 55 },
      text: '两军初战于赤壁江面，曹军不利，退回北岸乌林。疫病在营中蔓延，北方兵晕船晕得站立不稳；曹操下令铁索连船，人马行于船上如履平地，也埋下了火攻的引线。',
      moves: {
        caoshui: { path: [[113.6, 29.878]], state: 'camp' },
        zhouyu: { state: 'camp' }, huanggai: { state: 'camp' },
        caozhu: { path: [[113.22, 29.9], [113.45, 30.0]], state: 'move' },
      },
      arrows: [{ side: 'b', kind: 'retreat', pts: [[113.85, 29.95], [113.66, 29.92]] }],
      notes: [{ at: [113.56, 29.99], text: '铁索连船', side: 'b', t: 0.5 }] },
    { title: '黄盖火攻', date: '208 年冬 · 夜', night: true, cam: { at: [113.66, 29.9], d: 18, yaw: 6, pitch: 56 },
      text: '黄盖先把降书递过去，再挑东南风最急的时刻，押着十条火船直扑北岸。距曹营两里处一齐举火，火船借着风头撞进锁死的船阵，烈焰顺势卷上岸边营盘。半江火光，烧死烧溺的兵马不计其数。',
      moves: {
        huanggai: { path: [[113.88, 29.94], [113.74, 29.905], [113.64, 29.882]], state: 'move' },
        caoshui: { state: 'fight', str: [1, 0.2] },
        zhouyu: { path: [[113.72, 29.9], [113.68, 29.89]], state: 'move' },
      },
      arrows: [{ side: 'a', pts: [[113.88, 29.94], [113.74, 29.905], [113.64, 29.882]] }],
      fx: { fire: [113.6, 29.878], jolt: true },
      notes: [
        { at: [113.82, 29.9], text: '诈降书', side: 'a', t: 0.2 },
        { at: [113.55, 29.96], text: '东南风起', side: 'a', t: 0.45 },
      ] },
    { title: '败走华容道', date: '208 年冬', cam: { at: [114.0, 30.02], d: 20, yaw: 0, pitch: 54 },
      text: '联军顺着水陆两条路追着打。曹操领着残部走华容道徒步北撤，一路全是烂泥，只好叫年老兵卒背着草料垫道，人马踩着同伴过去；先退江陵收拢残局，再回中原。',
      moves: {
        caozhu: { path: [[113.45, 30.0], [113.9, 30.12], [114.25, 30.18]], state: 'retreat' },
        zhouyu: { path: [[113.72, 29.9], [113.9, 29.95], [114.1, 30.0]], state: 'move' },
      },
      arrows: [
        { side: 'b', kind: 'retreat', pts: [[113.45, 30.0], [113.9, 30.12], [114.25, 30.18]] },
        { side: 'a', pts: [[113.72, 29.9], [113.9, 29.95], [114.1, 30.0]] },
      ],
      notes: [{ at: [114.15, 30.16], text: '华容泥泞', side: 'b', t: 0.5 }] },
    { title: '三分天下', date: '208–220 年', cam: { at: [113.5, 29.95], d: 34, yaw: 0, pitch: 56 },
      text: '曹操退回北方，短时间里组织不起新的南征；刘备趁乱拿下大半个荆州，转头又西取益州；孙权把江东捂得铁紧。赤壁这一把火，烧出了往后几十年的三分天下。',
      moves: {
        liubei: { path: [[114.0, 29.98], [114.25, 30.02], [114.42, 30.05]], state: 'move' },
        zhouyu: { state: 'camp' },
      },
      arrows: [{ side: 'a', pts: [[114.0, 29.98], [114.25, 30.02], [114.42, 30.05]] }],
      notes: [
        { at: [114.25, 30.0], text: '刘备取荆南', side: 'a', t: 0.4 },
        { at: [112.94, 29.81], text: '曹仁守江陵', side: 'b', t: 0.6 },
      ] },
  ],
  facts: { time: '208 年冬', place: '长江赤壁沿岸 · 今湖北江段', cmd: ['周瑜、刘备（联军）', '曹操（曹）'], strength: ['约 5 万联军', '号称八十万，实数二十余万'], result: '联军以寡击众得手' },
  why: [
    '曹军远来疲惫、不习水战，营中疫病流行，战力先折了三成。',
    '铁索连船求稳，却把撤退的门也焊死了，火起时一艘都跑不掉。',
    '联军以水军之长攻陆军之短，黄盖诈降加东南风，一击致命。',
  ],
  meaning: [
    '曹操吞并天下的进程被拦腰打断，此后终生没跨过大江。',
    '三分格局自此成形，魏蜀吴的版图轮廓在这一夜画出。',
  ],
  quiz: [
    { q: '赤壁之战联军倚仗的核心战法是？', opts: ['围城断粮', '火攻', '掘堤水淹', '骑兵冲阵'], a: 1, ex: '黄盖假意来降，借东南风把火船撞进铁索锁死的曹军船阵。' },
    { q: '赤壁战后的最大变局是什么？', opts: ['曹操统一全国', '三分格局就此成形', '东汉提前终结', '胡人内迁中原'], a: 1, ex: '曹操北退后，刘备取荆州、孙权固江东，三家的地盘就此定形。' },
    { q: '曹军扎在水寨乌林，在长江哪一边？', opts: ['北岸', '南岸', '江心沙洲', '洞庭湖口'], a: 0, ex: '曹营靠北岸乌林，联军屯南岸赤壁，两军隔江对望。' },
  ],
},
{
  id: 'feishui', title: '淝水之战', sub: '383 年 · 东晋 对 前秦', era: '东晋十六国', unit: '万',
  sides: { a: { name: '东晋军', flag: '晋' }, b: { name: '前秦军', flag: '秦' } },
  sideColors: SIDE_COLORS, bars: [8, 80],
  geo: {
    seed: 91, cLon: 116.75, cLat: 32.62, span: [1.35, 0.9], biome: 'cn', freq: 4.8, forestDots: 1700,
    ridges: [
      [[116.32, 32.9], [116.5, 33.02], 0.12, 0.2],
      [[117.2, 32.3], [117.35, 32.5], 0.14, 0.18],
    ],
    peaks: [[[116.42, 32.98], 0.07, 0.05, 0.16]],
    rivers: [
      [[[115.9, 32.75], [116.3, 32.72], [116.7, 32.78], [117.1, 32.75], [117.5, 32.8]], 0.07, 0.08],
      [[[116.62, 32.92], [116.66, 32.76], [116.7, 32.6], [116.68, 32.44], [116.72, 32.3]], 0.04, 0.08],
      [[[116.3, 32.95], [116.45, 32.86], [116.56, 32.79], [116.62, 32.74]], 0.035, 0.07],
    ],
  },
  places: [
    { at: [116.78, 32.6], name: '寿阳城', kind: 'city', side: 'b', flag: '秦', desc: '淮上重镇寿春。苻融攻占后成为秦军前敌大本营，苻坚在此登城望阵。' },
    { at: [116.45, 32.85], name: '梁成营', kind: 'camp', side: 'b', flag: '梁', desc: '秦将梁成带了五万人马扎在洛涧，立栅拦死晋军西进的路口。' },
    { at: [116.84, 32.52], name: '晋军大营', kind: 'camp', side: 'a', flag: '晋', big: true, desc: '北府兵八万依淝水东岸扎营，谢玄在此节制各军。' },
    { at: [116.42, 32.98], name: '八公山', kind: 'mount', desc: '苻坚登寿阳城北望，把山上摇动的草木都看成了晋军旗帜。' },
    { at: [116.7, 32.6], name: '淝水', kind: 'river' },
    { at: [116.3, 32.74], name: '洛涧', kind: 'river' },
    { at: [116.2, 32.6], name: '淮河', kind: 'river' },
    { at: [117.3, 32.42], name: '建康方向', kind: 'dir' },
    { at: [116.0, 32.9], name: '项城、长安方向', kind: 'dir' },
  ],
  units: [
    { id: 'beifu', side: 'a', kind: 'inf', flag: '晋', name: '谢石、谢玄北府兵', str: 8, home: [116.84, 32.52], desc: '东晋精锐，由谢玄招募流民练成，谢安在建康坐镇。' },
    { id: 'liulao', side: 'a', kind: 'inf', flag: '刘', name: '刘牢之五千先锋', str: 0.5, home: [116.84, 32.52], desc: '夜渡洛涧的敢死先锋，一战掀了梁成大营。' },
    { id: 'furong', side: 'b', kind: 'inf', flag: '苻', name: '苻融前锋', str: 25, home: [116.78, 32.6], desc: '苻坚的弟弟苻融带的前锋二十五万，破了寿阳城后沿淝水西岸摆开阵势。' },
    { id: 'qinhou', side: 'b', kind: 'inf', flag: '秦', name: '苻坚后续大军', str: 55, home: [116.05, 32.88], desc: '号称八十余万的大队人马，前后千里，大半还在路上。' },
    { id: 'liangcheng', side: 'b', kind: 'inf', flag: '梁', name: '梁成部', str: 5, home: [116.45, 32.85], desc: '守洛涧的五万秦军，正卡在晋军西进的必经之路上。' },
  ],
  phases: [
    { title: '前秦南下', date: '383 年八月', cam: { at: [116.4, 32.7], d: 34, yaw: 0, pitch: 56 },
      text: '苻坚刚吞下北方便听不进任何劝阻，点起八十多万大军南征，夸口士兵们把马鞭全扔进长江，也够把水流截断。前锋苻融渡淮攻破寿阳，后队人马首尾相连上千里。',
      moves: {
        furong: { path: [[116.05, 32.88], [116.4, 32.75], [116.78, 32.6]], state: 'move' },
        qinhou: { path: [[115.6, 32.95], [116.05, 32.88]], state: 'move' },
        liangcheng: { path: [[116.4, 32.8], [116.45, 32.85]], state: 'move' },
      },
      arrows: [
        { side: 'b', pts: [[116.05, 32.88], [116.4, 32.75], [116.78, 32.6]] },
        { side: 'b', pts: [[115.6, 32.95], [116.05, 32.88]] },
      ],
      notes: [{ at: [116.1, 32.7], text: '投鞭断流', side: 'b', t: 0.45 }] },
    { title: '东晋备战', date: '383 年秋', cam: { at: [116.8, 32.55], d: 20, yaw: -6, pitch: 54 },
      text: '建康城里，宰相谢安镇定如常，把八万北府兵交给谢石、谢玄迎击。这支由流民子弟练成的军队悍勇善战，是东晋手上唯一能打硬仗的本钱。',
      moves: { beifu: { state: 'hold' } },
      notes: [{ at: [116.84, 32.5], text: '北府兵八万', side: 'a', t: 0.5 }] },
    { title: '洛涧之战', date: '383 年十一月 · 夜', night: true, cam: { at: [116.5, 32.82], d: 16, yaw: 8, pitch: 54 },
      text: '刘牢之领五千精锐趁黑夜渡过洛涧，一把掀了梁成大营：梁成被斩，秦军折损一万五千人。开门红让晋军士气爆棚，水陆齐头并进，推到淝水东岸才停步。',
      moves: {
        liulao: { path: [[116.84, 32.52], [116.66, 32.7], [116.5, 32.82]], state: 'move' },
        liangcheng: { state: 'fight', str: [1, 0.3] },
      },
      arrows: [{ side: 'a', pts: [[116.84, 32.52], [116.66, 32.7], [116.5, 32.82]] }],
      fx: { clash: [116.46, 32.85] },
      notes: [{ at: [116.42, 32.9], text: '阵斩梁成', side: 'a', t: 0.6 }] },
    { title: '草木皆兵', date: '383 年十一月', cam: { at: [116.7, 32.72], d: 22, yaw: 0, pitch: 55 },
      text: '晋军推进到淝水东岸，靠山下寨；秦军在西岸摆开阵势对望。苻坚和苻融爬上寿阳城头眺望，见对面军容整肃得挑不出毛病；再看八公山，草一动、树一摇，全都疑心是埋伏。这位一向骄傲的皇帝，头一回心里发毛。',
      moves: { furong: { state: 'hold' }, beifu: { state: 'hold' } },
      notes: [{ at: [116.42, 32.96], text: '草木皆兵', side: 'b', t: 0.55 }] },
    { title: '秦军后撤', date: '383 年十一月', cam: { at: [116.72, 32.6], d: 20, yaw: 6, pitch: 54 },
      text: '谢玄派人递话：请秦军稍稍后撤，让晋军过河决一死战。苻坚盘算着趁晋军半渡时掩杀，下令全军后移——阵脚一动就再也收不住。晋军抢渡掩杀，前秦的百万大军一瞬间垮了。',
      moves: {
        beifu: { path: [[116.84, 32.52], [116.74, 32.58], [116.72, 32.6]], state: 'move' },
        furong: { state: 'fight', str: [1, 0.4] },
      },
      arrows: [
        { side: 'a', pts: [[116.84, 32.52], [116.74, 32.58], [116.72, 32.6]] },
        { side: 'b', kind: 'retreat', pts: [[116.72, 32.6], [116.68, 32.66]] },
      ],
      fx: { clash: [116.72, 32.6], jolt: true },
      notes: [{ at: [116.66, 32.62], text: '半渡而击', side: 'a', t: 0.5 }] },
    { title: '风声鹤唳', date: '383 年十一月', cam: { at: [116.5, 32.7], d: 26, yaw: -8, pitch: 55 },
      text: '败兵一路狂奔，风声和鹤鸣都成了追兵将至的信号，昼夜不敢歇脚，冻死饿死的十有七八。苻坚身中一箭，单人独骑逃回北方；看似庞大的前秦随即散了架，南北分立的序幕就此拉开。',
      moves: {
        furong: { path: [[116.72, 32.6], [116.4, 32.75], [116.1, 32.85]], state: 'retreat', str: [0.4, 0.2] },
        qinhou: { path: [[116.05, 32.88], [115.7, 32.92]], state: 'retreat' },
        beifu: { path: [[116.72, 32.6], [116.6, 32.64]], state: 'move' },
      },
      arrows: [
        { side: 'b', kind: 'retreat', pts: [[116.72, 32.6], [116.4, 32.75], [116.1, 32.85]] },
        { side: 'a', pts: [[116.72, 32.6], [116.6, 32.64]] },
      ],
      notes: [{ at: [116.3, 32.8], text: '风声鹤唳', side: 'b', t: 0.45 }] },
  ],
  facts: { time: '383 年十一月', place: '淝水 · 今安徽寿县地界', cmd: ['谢安、谢石、谢玄（晋）', '苻坚、苻融（秦）'], strength: ['约 8 万', '对外号称 80 万'], result: '东晋以少胜多，前秦瓦解' },
  why: [
    '前秦刚吞下北方，各族部众临时拼凑，人再多也号令不一。',
    '苻坚骄傲轻敌，还在阵前亲自下令后撤，一退就再也收不住。',
    '东晋上下同心，北府兵练得精、打得狠，洛涧首胜把士气彻底点燃。',
  ],
  meaning: [
    '前秦帝国轰然瓦解，北方重新裂成一地碎片。',
    '东晋稳住半壁江山，江南的经济与文化由此得到百年喘息。',
  ],
  quiz: [
    { q: '淝水之战对阵的是哪两方？', opts: ['东晋与前秦', '西晋与匈奴', '东晋与北魏', '宋与北魏'], a: 0, ex: '383 年，谢安坐镇的东晋在淝水边挡住并击溃了苻坚。' },
    { q: '下面哪个成语是从淝水战场上传出来的？', opts: ['破釜沉舟', '纸上谈兵', '草木皆兵', '卧薪尝胆'], a: 2, ex: '苻坚登城远望，把八公山上的草木全看成晋兵；鹤唳风声也是这一战的产物。' },
    { q: '秦军在淝水边突然垮掉，直接诱因是？', opts: ['遭到火攻', '后撤时阵脚大乱，被晋军抢渡掩杀', '粮草被烧', '被大水冲垮阵形'], a: 1, ex: '苻坚盘算半渡而击才下令后移，谁料阵脚一动就再也收不住。' },
  ],
},
{
  id: 'thermopylae', title: '温泉关之战', sub: '前 480 年 · 希腊联军 对 波斯', era: '希波战争', unit: '万',
  sides: { a: { name: '希腊联军', flag: '希' }, b: { name: '波斯军', flag: '波' } },
  sideColors: SIDE_COLORS, bars: [0.7, 20],
  geo: {
    seed: 55, cLon: 22.55, cLat: 38.8, span: [0.66, 0.5], biome: 'olive', freq: 6.2, forestDots: 900,
    ridges: [
      [[22.3, 38.62], [22.52, 38.68], 0.1, 0.4],
      [[22.4, 38.7], [22.58, 38.72], 0.08, 0.3],
    ],
    peaks: [[[22.48, 38.72], 0.05, 0.04, 0.24]],
    rivers: [[[[22.28, 38.92], [22.34, 38.89], [22.42, 38.86], [22.5, 38.83]], 0.03, 0.06]],
    coast: [[22.72, 38.58], [22.68, 38.68], [22.64, 38.76], [22.62, 38.815], [22.66, 38.86], [22.72, 38.93], [22.82, 39.0]],
    seaSign: -1, sea: true, seaLevel: 0.26,
  },
  places: [
    { at: [22.545, 38.8], name: '温泉关', kind: 'city', side: 'a', flag: '守', desc: '本地人喊它「热的门」，因为泉水是温的。关道夹在陡崖与海湾之间，最窄的地方过不了一辆战车。' },
    { at: [22.44, 38.79], name: '波斯军大营', kind: 'camp', side: 'b', flag: '波', desc: '薛西斯的御营扎在特拉基斯附近，大军轮番扑向关口。' },
    { at: [22.6, 38.8], name: '阿尔佩尼', kind: 'city', side: 'a', flag: '希', desc: '关口东侧的补给村，也是那条翻山小道的入口。' },
    { at: [22.48, 38.72], name: '卡利德罗蒙山', kind: 'mount' },
    { at: [22.72, 38.85], name: '马利亚湾', kind: 'river' },
    { at: [22.34, 38.9], name: '斯佩尔希奥斯河', kind: 'river' },
    { at: [22.3, 38.98], name: '色萨利方向', kind: 'dir' },
    { at: [22.8, 38.64], name: '雅典方向', kind: 'dir' },
  ],
  walls: [
    { name: '福基斯墙', side: 'a', pts: [[22.532, 38.792], [22.536, 38.798], [22.54, 38.804]], desc: '先人留下的旧石墙，希腊人把它加高加固，当成了关门的一道闩。' },
  ],
  units: [
    { id: 'greek', side: 'a', kind: 'inf', flag: '希', name: '希腊联军', str: 0.7, home: [22.575, 38.8], desc: '斯巴达带头、忒斯庇亚与底比斯等城邦拼出的约七千人，主力是重装步兵。' },
    { id: 'leonidas', side: 'a', kind: 'inf', flag: '王', name: '列奥尼达与殿后勇士', str: 0.12, home: [22.545, 38.8], desc: '斯巴达王亲率的三百卫士，后来加上忒斯庇亚等地志愿者断后。' },
    { id: 'persia', side: 'b', kind: 'inf', flag: '波', name: '波斯远征大军', str: 20, home: [22.44, 38.79], desc: '薛西斯御驾亲征的海陆大军，古史号称数百万之众。' },
    { id: 'immortals', side: 'b', kind: 'inf', flag: '不', name: '波斯「不死军」', str: 1, home: [22.44, 38.79], desc: '一万名御前精锐，阵亡一人补足一人，番号永远满员。' },
  ],
  phases: [
    { title: '波斯西征', date: '前 480 年八月', cam: { at: [22.55, 38.8], d: 26, yaw: 0, pitch: 55 },
      text: '薛西斯带着海陆大军压向希腊，希腊各城邦拼凑出约七千人，由斯巴达王列奥尼达带领扼守温泉关。关口夹在陡山与海湾之间，大军人再多也展不开。',
      moves: {
        persia: { path: [[22.32, 38.92], [22.4, 38.86], [22.44, 38.79]], state: 'move' },
        greek: { path: [[22.7, 38.82], [22.6, 38.8], [22.56, 38.8]], state: 'move' },
      },
      arrows: [
        { side: 'b', pts: [[22.32, 38.92], [22.4, 38.86], [22.44, 38.79]] },
        { side: 'a', pts: [[22.7, 38.82], [22.6, 38.8], [22.56, 38.8]] },
      ],
      notes: [{ at: [22.5, 38.78], text: '据关而守', side: 'a', t: 0.5 }] },
    { title: '两日血战', date: '前 480 年八月', cam: { at: [22.52, 38.8], d: 12, yaw: -6, pitch: 52 },
      text: '波斯军整整强攻了两天。希腊重步兵把长盾在窄口拼成一面铁壁，一批打累了换一批；矛尖和盾墙教进攻者半步都蹭不进来，连御前的「不死军」也被捅了回去，死伤遍地。',
      moves: {
        persia: { path: [[22.47, 38.8], [22.51, 38.798]], state: 'fight', str: [1, 0.9] },
        immortals: { path: [[22.47, 38.795], [22.522, 38.797]], state: 'fight', str: [1, 0.85] },
        greek: { path: [[22.545, 38.8]], state: 'fight' },
        leonidas: { state: 'hold' },
      },
      arrows: [
        { side: 'b', pts: [[22.47, 38.8], [22.51, 38.798]] },
        { side: 'b', pts: [[22.47, 38.795], [22.522, 38.797]] },
      ],
      fx: { clash: [22.53, 38.8] },
      notes: [{ at: [22.545, 38.83], text: '盾墙死守', side: 'a', t: 0.45 }] },
    { title: '小道迂回', date: '前 480 年八月 · 夜', night: true, cam: { at: [22.53, 38.75], d: 16, yaw: 10, pitch: 55 },
      text: '本地人厄菲阿尔特斯为了那笔重赏向波斯人出卖了秘密：山里藏着一条能绕到关口背后的羊道。当夜「不死军」跟着他攀上阿诺佩亚山道，天没亮就把守路口的福基斯人冲散。',
      moves: {
        immortals: { path: [[22.5, 38.795], [22.53, 38.73], [22.56, 38.75], [22.59, 38.785]], state: 'move' },
        persia: { state: 'hold' }, greek: { state: 'hold' },
      },
      arrows: [{ side: 'b', pts: [[22.5, 38.795], [22.53, 38.73], [22.56, 38.75], [22.59, 38.785]] }],
      notes: [{ at: [22.55, 38.74], text: '小道带路', side: 'b', t: 0.4 }] },
    { title: '列奥尼达殿后', date: '前 480 年八月', cam: { at: [22.56, 38.79], d: 14, yaw: 0, pitch: 52 },
      text: '退路被掐断后，列奥尼达立刻拍板：联军主力马上撤离保住元气；他自带三百名斯巴达卫士和愿留下的志愿者断后，硬接前后夹击的波斯大军。',
      moves: {
        greek: { path: [[22.56, 38.8], [22.62, 38.81], [22.68, 38.815]], state: 'retreat', str: [1, 0.45] },
        leonidas: { path: [[22.545, 38.8]], state: 'hold' },
      },
      arrows: [{ side: 'a', kind: 'retreat', pts: [[22.56, 38.8], [22.62, 38.81], [22.68, 38.815]] }],
      notes: [{ at: [22.545, 38.83], text: '三百人断后', side: 'a', t: 0.5 }] },
    { title: '全军殉国', date: '前 480 年八月', cam: { at: [22.545, 38.8], d: 11, yaw: -8, pitch: 50 },
      text: '殿后的勇士被前后夹住：长矛断了用剑，剑折了用拳用牙，最后一人不退。列奥尼达战死，温泉关失守——但希腊赢得了集结的时间，一个多月后萨拉米斯海战翻盘。',
      moves: {
        persia: { path: [[22.5, 38.798], [22.53, 38.8]], state: 'fight' },
        immortals: { path: [[22.588, 38.79], [22.55, 38.8]], state: 'fight' },
        leonidas: { state: 'fight', str: [1, 0.06] },
        greek: { state: 'vanish' },
      },
      arrows: [
        { side: 'b', pts: [[22.5, 38.798], [22.53, 38.8]] },
        { side: 'b', pts: [[22.588, 38.79], [22.55, 38.8]] },
      ],
      fx: { clash: [22.545, 38.8], jolt: true },
      notes: [{ at: [22.5, 38.83], text: '关口失守', side: 'b', t: 0.6 }] },
  ],
  facts: { time: '前 480 年八月', place: '温泉关 · 希腊中部关隘', cmd: ['列奥尼达（守）', '薛西斯一世（攻）'], strength: ['兵力 7000 左右', '约 10–30 万（古称数百万）'], result: '波斯夺关，希腊殿后部队全军战死' },
  why: [
    '山与海夹出一条窄道，波斯的人数优势在这里使不出来。',
    '重步兵方阵纪律如铁，窄地里一批接一批顶上，怎么攻都攻不动。',
    '山间小道被人出卖，「不死军」绕到背后，天险瞬间失效。',
  ],
  meaning: [
    '断后部队用命换来宝贵时间，希腊海军随后在萨拉米斯翻了盘。',
    '自此成为以寡敌众、死也不退的精神图腾。',
  ],
  quiz: [
    { q: '温泉关之战隶属哪场大战？', opts: ['伯罗奔尼撒战争', '希波战争', '布匿战争', '特洛伊战争'], a: 1, ex: '前 480 年，薛西斯率波斯大军入侵希腊，各城邦联合抵抗。' },
    { q: '希腊人偏要挑温泉关设防，图的是什么？', opts: ['关内粮草充足', '波斯人不习海战', '关口狭窄，大军展不开', '关墙高大坚固'], a: 2, ex: '一边陡崖一边大海，波斯人再多也铺不开，人数优势归零。' },
    { q: '温泉关最后丢掉，直接坏在什么事上？', opts: ['守军粮尽', '波斯海军背后登陆', '有人带波斯军翻山绕后', '守军阵前倒戈'], a: 2, ex: '厄菲阿尔特斯领着「不死军」翻山抄了后路，守军前后挨打。' },
  ],
},
{
  id: 'gaojiamila-331bc', title: '高加米拉战役', sub: '前 331 年 · 马其顿 对 波斯', era: '亚历山大东征', unit: '万',
  sides: { a: { name: '马其顿军', flag: '马' }, b: { name: '波斯军', flag: '波' } },
  sideColors: SIDE_COLORS, bars: [4.7, 20],
  geo: {
    seed: 63, cLon: 43.45, cLat: 36.55, span: [0.85, 0.62], biome: 'arid', freq: 4.2, forestDots: 400,
    ridges: [[[43.3, 36.78], [43.55, 36.82], 0.1, 0.22]],
    peaks: [[[43.4, 36.78], 0.06, 0.04, 0.18]],
    rivers: [
      [[[43.06, 36.8], [43.08, 36.62], [43.05, 36.44], [43.1, 36.3]], 0.05, 0.08],
      [[[43.64, 36.82], [43.6, 36.66], [43.55, 36.5], [43.53, 36.34]], 0.04, 0.07],
    ],
    flats: [[[43.47, 36.52], 0.2, 0.14, 0.02]],
  },
  places: [
    { at: [43.45, 36.58], name: '高加米拉', kind: 'city', desc: '村名的意思是「骆驼之家」。战前大流士把村南平原碾平，好让战车放开冲刺。' },
    { at: [43.5, 36.5], name: '波斯军大营', kind: 'camp', side: 'b', flag: '波', desc: '波斯大军连夜列阵，营中挂着大流士的王旗。' },
    { at: [43.38, 36.56], name: '马其顿军营', kind: 'camp', side: 'a', flag: '马', desc: '亚历山大在此稳扎稳打，拒绝部下夜袭的提议。' },
    { at: [43.4, 36.78], name: '杰贝勒·马克卢布山', kind: 'mount' },
    { at: [43.07, 36.6], name: '底格里斯河', kind: 'river' },
    { at: [43.58, 36.6], name: '布莫多斯河', kind: 'river' },
    { at: [43.76, 36.44], name: '阿贝拉方向', kind: 'dir' },
  ],
  units: [
    { id: 'alex', side: 'a', kind: 'cav', flag: '王', name: '亚历山大与伙友亲骑', str: 2, home: [43.38, 36.56], desc: '国王亲自带领的重骑精锐，是全军最硬的突击拳头，放在右翼。' },
    { id: 'phalanx', side: 'a', kind: 'inf', flag: '阵', name: '马其顿方阵', str: 3, home: [43.38, 36.56], desc: '五六米长矛如林，纵深十几排，正面几乎撞不开。' },
    { id: 'parmenion', side: 'a', kind: 'inf', flag: '帕', name: '帕曼纽左翼', str: 1.5, home: [43.38, 36.56], desc: '老将帕曼纽率左翼顶住波斯右翼的猛攻，苦战整日。' },
    { id: 'darius', side: 'b', kind: 'inf', flag: '王', name: '大流士三世的中军本部', str: 3, home: [43.5, 36.5], desc: '波斯王亲自压阵的中军，左右两侧是御前禁卫和希腊雇佣兵。' },
    { id: 'bessus', side: 'b', kind: 'cav', flag: '贝', name: '贝苏斯左翼骑兵', str: 6, home: [43.5, 36.5], desc: '巴克特里亚总督带的左翼大队骑兵，人数极多。' },
    { id: 'mazaeus', side: 'b', kind: 'cav', flag: '马', name: '马扎亚斯右翼', str: 5, home: [43.5, 36.5], desc: '猛攻马其顿左翼的波斯右翼兵团，一度占尽上风。' },
    { id: 'scythed', side: 'b', kind: 'chariot', flag: '车', name: '刀轮战车', str: 0.4, home: [43.5, 36.5], desc: '车轮边缘缚着弯刀的两百辆战车，大流士指望它们把方阵撕开口子。' },
  ],
  phases: [
    { title: '大军对峙', date: '前 331 年十月', cam: { at: [43.44, 36.54], d: 30, yaw: 0, pitch: 55 },
      text: '亚历山大渡过底格里斯河，与大流士的倾国之兵在平原上对圆。部下劝他夜里偷袭，他答得干脆：胜利要光明正大地赢，不偷。两军就此对面扎营。',
      moves: {
        alex: { state: 'camp' }, phalanx: { state: 'camp' }, parmenion: { state: 'camp' },
        darius: { state: 'camp' }, bessus: { state: 'camp' }, mazaeus: { state: 'camp' },
      },
      notes: [{ at: [43.42, 36.54], text: '拒用夜袭', side: 'a', t: 0.5 }] },
    { title: '斜线推进', date: '前 331 年十月', cam: { at: [43.46, 36.54], d: 22, yaw: -6, pitch: 53 },
      text: '亚历山大带着右翼向右侧斜行移动，波斯左翼骑兵怕被抄了后路，也跟着越拉越远。大流士放出两百辆刀轮战车冲锋——方阵默契地让出条条通道，标枪手专挑辕马下家伙，战车几乎全跑了个空。',
      moves: {
        alex: { path: [[43.38, 36.56], [43.34, 36.6]], state: 'move' },
        bessus: { path: [[43.5, 36.5], [43.44, 36.56], [43.36, 36.6]], state: 'move' },
        scythed: { path: [[43.5, 36.5], [43.44, 36.53]], state: 'move', str: [1, 0.2] },
      },
      arrows: [
        { side: 'a', pts: [[43.38, 36.56], [43.34, 36.6]] },
        { side: 'b', pts: [[43.5, 36.5], [43.44, 36.56], [43.36, 36.6]] },
      ],
      fx: { clash: [43.42, 36.56] },
      notes: [{ at: [43.44, 36.5], text: '战车扑空', side: 'b', t: 0.5 }] },
    { title: '楔形突击', date: '前 331 年十月', cam: { at: [43.47, 36.55], d: 18, yaw: 4, pitch: 52 },
      text: '波斯左翼外移，战线中间裂开一道口子。亚历山大等的就是这一刻：伙友骑兵排成楔形直插缺口，方阵紧跟其后，矛头直指大流士的御旗。',
      moves: {
        alex: { path: [[43.34, 36.6], [43.42, 36.56], [43.48, 36.53]], state: 'move' },
        phalanx: { path: [[43.38, 36.56], [43.44, 36.54], [43.48, 36.55]], state: 'move' },
        darius: { state: 'fight', str: [1, 0.7] },
      },
      arrows: [{ side: 'a', pts: [[43.34, 36.6], [43.42, 36.56], [43.48, 36.53]] }],
      fx: { clash: [43.49, 36.52] },
      notes: [{ at: [43.46, 36.5], text: '楔形破阵', side: 'a', t: 0.5 }] },
    { title: '左翼苦战', date: '前 331 年十月', cam: { at: [43.42, 36.5], d: 18, yaw: 8, pitch: 53 },
      text: '同一时刻，马扎亚斯的波斯右翼把帕曼纽的左翼团团围住，老将派人急报求援。马其顿战线左右两边，一边在赢，一边在挨打。',
      moves: {
        mazaeus: { path: [[43.5, 36.5], [43.4, 36.5], [43.36, 36.52]], state: 'fight' },
        parmenion: { state: 'fight', str: [1, 0.7] },
      },
      arrows: [{ side: 'b', pts: [[43.5, 36.5], [43.4, 36.5], [43.36, 36.52]] }],
      fx: { clash: [43.37, 36.53] },
      notes: [{ at: [43.38, 36.6], text: '帕曼纽求援', side: 'a', t: 0.5 }] },
    { title: '大流士溃逃', date: '前 331 年十月', cam: { at: [43.5, 36.53], d: 24, yaw: -4, pitch: 54 },
      text: '御旗一倒，波斯的百万大军瞬间散了架。大流士掉转战车先逃；亚历山大回师救援左翼，再一路追到阿贝拉。波斯帝国的骨架，在这一天散了。',
      moves: {
        darius: { path: [[43.5, 36.5], [43.6, 36.46], [43.72, 36.42]], state: 'retreat', str: [0.7, 0.25] },
        alex: { path: [[43.48, 36.53], [43.42, 36.5]], state: 'move' },
        bessus: { state: 'retreat', str: [1, 0.3] }, mazaeus: { state: 'retreat', str: [1, 0.3] },
      },
      arrows: [
        { side: 'b', kind: 'retreat', pts: [[43.5, 36.5], [43.6, 36.46], [43.72, 36.42]] },
        { side: 'a', pts: [[43.48, 36.53], [43.42, 36.5]] },
      ],
      fx: { clash: [43.5, 36.5], jolt: true },
      notes: [{ at: [43.6, 36.48], text: '王旗先逃', side: 'b', t: 0.45 }] },
  ],
  facts: { time: '前 331 年十月', place: '高加米拉 · 底格里斯河东岸', cmd: ['亚历山大（马其顿）', '大流士三世（波斯）'], strength: ['约 4.7 万', '约 10–20 万（号称百万）'], result: '马其顿大胜，波斯帝国崩溃' },
  why: [
    '斜线推进把波斯战线越拉越长，中路的缺口是自己送出来的。',
    '伙友骑兵与方阵咬合推进，拳头直捣指挥中枢。',
    '大流士临阵先逃，王旗一动，百万大军立刻没了主心骨。',
  ],
  meaning: [
    '波斯帝国的骨架被打散，亚历山大一路收下巴比伦与波斯波利斯。',
    '横跨欧亚非的大帝国立起，希腊文化随东征传向四方。',
  ],
  quiz: [
    { q: '在高加米拉与亚历山大对阵的波斯王是？', opts: ['薛西斯一世', '汉尼拔', '大流士三世', '恺撒'], a: 2, ex: '大流士三世押上举国之兵，在这片平原上迎击马其顿军。' },
    { q: '波斯战线的口子是怎么被亚历山大撕开的？', opts: ['斜着横移，诱波斯左翼外拉', '战象踩踏敌阵', '夜袭波斯大营', '挖沟断敌水源'], a: 0, ex: '右翼斜着外移，波斯左翼跟着外包，中路空当一露，骑兵直插。' },
    { q: '亚历山大东征留下的影响包括？', opts: ['建立罗马共和国', '促进东西方文化交流', '引发十字军东征', '希腊各邦重获自主'], a: 1, ex: '远征把希腊文化一路撒到西亚与北非，两边文明撞出了大交汇。' },
  ],
},
{
  id: 'cannae', title: '坎尼会战', sub: '前 216 年 · 迦太基 对 罗马', era: '第二次布匿战争', unit: '万',
  sides: { a: { name: '迦太基军', flag: '迦' }, b: { name: '罗马军', flag: '罗' } },
  sideColors: SIDE_COLORS, bars: [5, 8.6],
  geo: {
    seed: 38, cLon: 16.05, cLat: 41.3, span: [0.75, 0.52], biome: 'gold', freq: 4.4, forestDots: 700,
    ridges: [[[15.72, 41.5], [15.85, 41.55], 0.08, 0.14]],
    rivers: [[[[15.68, 41.44], [15.88, 41.38], [16.08, 41.34], [16.28, 41.31], [16.46, 41.29]], 0.045, 0.07]],
    coast: [[16.48, 41.56], [16.46, 41.44], [16.48, 41.3], [16.47, 41.14], [16.45, 41.05]],
    seaSign: 1, sea: true, seaLevel: 0.24,
  },
  places: [
    { at: [16.14, 41.3], name: '坎尼', kind: 'city', desc: '奥菲杜斯河畔的粮囤小镇。汉尼拔先拿下它，把罗马军团引到这片平原上。' },
    { at: [15.93, 41.2], name: '罗马军大营', kind: 'camp', side: 'b', flag: '罗', big: true, desc: '八位执政官轮番掌军，罗马倾尽全力凑出的主力屯在这里。' },
    { at: [16.26, 41.2], name: '迦太基军营', kind: 'camp', side: 'a', flag: '迦', desc: '汉尼拔的营盘背河而立，阵形早已排好等罗马人来撞。' },
    { at: [16.42, 41.42], name: '亚得里亚海', kind: 'river' },
    { at: [16.1, 41.36], name: '奥菲杜斯河', kind: 'river' },
    { at: [15.68, 41.2], name: '罗马方向', kind: 'dir' },
    { at: [15.8, 41.52], name: '高卢方向', kind: 'dir' },
  ],
  units: [
    { id: 'gallic', side: 'a', kind: 'inf', flag: '中', name: '高卢、西班牙步兵', str: 1.6, home: [16.26, 41.2], desc: '迦太基中路的弱兵，装备杂乱，汉尼拔亲自压阵。' },
    { id: 'afrW', side: 'a', kind: 'inf', flag: '非', name: '非洲重步兵（西翼）', str: 0.8, home: [16.26, 41.2], desc: '换上缴获罗马甲胄的老兵，藏在中路侧后待命。' },
    { id: 'afrE', side: 'a', kind: 'inf', flag: '非', name: '非洲重步兵（东翼）', str: 0.8, home: [16.26, 41.2], desc: '另一队百战老兵，等罗马人挤进口袋后向内合拢。' },
    { id: 'hasdrubal', side: 'a', kind: 'cav', flag: '哈', name: '哈斯德鲁巴的重骑队', str: 0.35, home: [16.26, 41.2], desc: '由西班牙与高卢骑手编成的重骑兵，顶在贴近河岸的一翼。' },
    { id: 'numidian', side: 'a', kind: 'cav', flag: '努', name: '努米底亚轻骑兵', str: 0.4, home: [16.26, 41.2], desc: '北非轻骑来去如风，专责缠住罗马的同盟骑兵。' },
    { id: 'legions', side: 'b', kind: 'inf', flag: '罗', name: '罗马军团', str: 3.4, home: [15.93, 41.2], desc: '排成前所未见的厚密队形，想用体重硬碾垮迦太基中路。' },
    { id: 'romecav', side: 'b', kind: 'cav', flag: '骑', name: '罗马公民骑兵', str: 0.24, home: [15.93, 41.2], desc: '执政官保卢斯带的公民骑，人数只有对面重骑的零头。' },
    { id: 'alliedcav', side: 'b', kind: 'cav', flag: '盟', name: '同盟骑兵', str: 0.36, home: [15.93, 41.2], desc: '瓦罗带的意大利同盟骑队，撑住罗马军的另一个翼。' },
  ],
  phases: [
    { title: '汉尼拔入意', date: '前 216 年夏', cam: { at: [16.08, 41.28], d: 28, yaw: 0, pitch: 55 },
      text: '汉尼拔带着战象翻过阿尔卑斯山闯进意大利，特雷比亚、特拉西梅诺两场大胜震动罗马。前 216 年夏他夺下坎尼的粮囤，逼罗马人前来决战——罗马也确实凑出了八万多人。',
      moves: {
        gallic: { state: 'camp' }, afrW: { state: 'camp' }, afrE: { state: 'camp' },
        hasdrubal: { state: 'camp' }, numidian: { state: 'camp' },
        legions: { path: [[15.8, 41.14], [15.93, 41.2]], state: 'move' },
        romecav: { path: [[15.8, 41.14], [15.93, 41.2]], state: 'move' },
        alliedcav: { path: [[15.8, 41.14], [15.93, 41.2]], state: 'move' },
      },
      arrows: [{ side: 'b', pts: [[15.8, 41.14], [15.93, 41.2]] }],
      notes: [{ at: [16.1, 41.32], text: '夺坎尼逼战', side: 'a', t: 0.45 }] },
    { title: '新月阵型', date: '前 216 年八月', cam: { at: [16.1, 41.27], d: 20, yaw: -4, pitch: 54 },
      text: '汉尼拔排出一副奇阵：较弱的中路步兵向前凸成新月，精锐非洲老兵藏在两侧，重骑轻骑压住两角。罗马军团像涨潮一样涌向那弯凸出的月牙。',
      moves: {
        gallic: { path: [[16.26, 41.2], [16.14, 41.26]], state: 'move' },
        afrW: { path: [[16.26, 41.2], [16.08, 41.24]], state: 'move' },
        afrE: { path: [[16.26, 41.2], [16.2, 41.24]], state: 'move' },
        hasdrubal: { path: [[16.26, 41.2], [16.1, 41.32]], state: 'move' },
        numidian: { path: [[16.26, 41.2], [16.22, 41.18]], state: 'move' },
        legions: { path: [[15.93, 41.2], [16.0, 41.24]], state: 'move' },
      },
      arrows: [
        { side: 'a', pts: [[16.26, 41.2], [16.14, 41.26]] },
        { side: 'b', pts: [[15.93, 41.2], [16.0, 41.24]] },
      ],
      notes: [{ at: [16.14, 41.28], text: '新月凸阵', side: 'a', t: 0.5 }] },
    { title: '中路诱敌', date: '前 216 年八月', cam: { at: [16.1, 41.27], d: 16, yaw: 2, pitch: 52 },
      text: '罗马人一头撞进弯月。迦太基中路按剧本且战且退，凸月缓缓凹成满弓；罗马军越打越挤，几万人挤成一团密不透风的人墙，连挥剑都费劲。',
      moves: {
        gallic: { path: [[16.14, 41.26], [16.16, 41.29], [16.15, 41.3]], state: 'fight', str: [1, 0.7] },
        legions: { path: [[16.0, 41.24], [16.1, 41.27], [16.13, 41.29]], state: 'fight' },
        romecav: { state: 'hold' }, alliedcav: { state: 'hold' },
      },
      arrows: [{ side: 'b', pts: [[16.0, 41.24], [16.1, 41.27], [16.13, 41.29]] }],
      fx: { clash: [16.14, 41.28] },
      notes: [{ at: [16.12, 41.31], text: '凸月变凹月', side: 'a', t: 0.5 }] },
    { title: '两翼合围', date: '前 216 年八月', cam: { at: [16.11, 41.28], d: 18, yaw: -8, pitch: 52 },
      text: '两翼的非洲重步兵同时向内转身，铁砧合上了钳口；哈斯德鲁巴的重骑绕到罗马军背后扎死袋底，努米底亚人追着溃散的同盟骑兵满平原跑。包围圈合拢了。',
      moves: {
        afrW: { path: [[16.08, 41.24], [16.11, 41.28]], state: 'fight' },
        afrE: { path: [[16.2, 41.24], [16.16, 41.28]], state: 'fight' },
        hasdrubal: { path: [[16.1, 41.32], [16.14, 41.36], [16.13, 41.32]], state: 'move' },
        numidian: { path: [[16.22, 41.18], [16.02, 41.16]], state: 'move' },
        alliedcav: { state: 'fight', str: [1, 0.2] },
        romecav: { state: 'fight', str: [1, 0.2] },
      },
      arrows: [
        { side: 'a', pts: [[16.08, 41.24], [16.11, 41.28]] },
        { side: 'a', pts: [[16.2, 41.24], [16.16, 41.28]] },
        { side: 'a', pts: [[16.1, 41.32], [16.14, 41.36], [16.13, 41.32]] },
      ],
      fx: { clash: [16.13, 41.29], jolt: true },
      notes: [{ at: [16.1, 41.24], text: '钳口合拢', side: 'a', t: 0.5 }] },
    { title: '罗马惨败', date: '前 216 年八月', cam: { at: [16.12, 41.29], d: 15, yaw: 6, pitch: 50 },
      text: '黄昏时口袋里再没有成建制的抵抗：五万上下罗马人战死沙场，执政官保卢斯殁于阵中。可罗马拒绝议和，一代人之后，这条战线最终拖垮了汉尼拔。',
      moves: {
        legions: { state: 'fight', str: [1, 0.12] },
        gallic: { state: 'fight' }, afrW: { state: 'hold' }, afrE: { state: 'hold' },
        hasdrubal: { state: 'hold' },
      },
      arrows: [{ side: 'b', kind: 'retreat', pts: [[16.13, 41.29], [16.05, 41.24]] }],
      fx: { clash: [16.13, 41.29], jolt: true },
      notes: [{ at: [16.16, 41.32], text: '保卢斯战死', side: 'b', t: 0.6 }] },
  ],
  facts: { time: '前 216 年八月', place: '坎尼 · 今意大利东南部小镇', cmd: ['汉尼拔（迦太基）', '保卢斯、瓦罗（罗马）'], strength: ['约 5 万', '约 8 万'], result: '迦太基大胜，罗马军团几乎覆没' },
  why: [
    '弯月阵拿弱兵当诱饵，把罗马主力请进了口袋。',
    '非洲老兵左右合拢、骑兵封死袋底，双重包围一气呵成。',
    '罗马人自己挤成密集人墙，人多的优势变成了动弹不得的死穴。',
  ],
  meaning: [
    '两翼合围、以少歼多的教科书战例，各国军校至今仍在拆解。',
    '罗马没有跪下，靠国力硬耗到底，最终赢下整场布匿战争。',
  ],
  quiz: [
    { q: '坎尼之战里，迦太基一方的主帅是？', opts: ['西庇阿', '汉尼拔', '亚历山大', '恺撒'], a: 1, ex: '汉尼拔翻过阿尔卑斯杀进意大利，把坎尼变成了歼灭战的舞台。' },
    { q: '汉尼拔在坎尼祭出的主战术是？', opts: ['火攻', '背水列阵', '坚壁清野', '中路示弱诱敌，两翼合拢包抄'], a: 3, ex: '中路弱兵边打边退，两翼非洲老兵合拢，骑兵再把退路扎死。' },
    { q: '坎尼之战属于哪场战争？', opts: ['第二次布匿战争', '希波战争', '伯罗奔尼撒战争', '第一次布匿战争'], a: 0, ex: '坎尼是罗马与迦太基漫长争霸第二回合里的转折点。' },
  ],
},
{
  id: 'hastings', title: '黑斯廷斯战役', sub: '1066 年 · 诺曼 对 英格兰', era: '诺曼征服', unit: '万',
  sides: { a: { name: '诺曼军', flag: '诺' }, b: { name: '英格兰军', flag: '英' } },
  sideColors: SIDE_COLORS, bars: [1, 0.8],
  geo: {
    seed: 83, cLon: 0.5, cLat: 50.88, span: [0.6, 0.44], biome: 'chalk', freq: 6.0, forestDots: 800,
    ridges: [[[0.36, 50.93], [0.62, 50.9], 0.06, 0.26]],
    peaks: [],
    rivers: [],
    coast: [[0.22, 50.77], [0.45, 50.75], [0.7, 50.76], [0.88, 50.79]],
    seaSign: -1, sea: true, seaLevel: 0.26,
  },
  places: [
    { at: [0.49, 50.915], name: '森拉克山', kind: 'mount', desc: '黑斯廷斯西北面的隆起山脊，哈罗德的盾墙就架在坡顶。战役结束后威廉就地修了巴特尔修道院。' },
    { at: [0.33, 50.82], name: '佩文西', kind: 'city', side: 'a', flag: '诺', desc: '潮汐泻湖旁的旧罗马要塞，诺曼船队挑的登陆点就在这片滩头。' },
    { at: [0.58, 50.84], name: '黑斯廷斯', kind: 'city', side: 'a', flag: '诺', desc: '威廉登陆后筑起的木城堡，诺曼军的大本营。' },
    { at: [0.6, 50.77], name: '英吉利海峡', kind: 'river' },
    { at: [0.5, 51.02], name: '伦敦方向', kind: 'dir' },
  ],
  units: [
    { id: 'knights', side: 'a', kind: 'knight', flag: '威', name: '威廉与诺曼骑士', str: 0.2, home: [0.58, 50.84], desc: '诺曼底公爵亲率的重装骑士，全军突击的矛头。' },
    { id: 'norminf', side: 'a', kind: 'inf', flag: '诺', name: '诺曼步兵', str: 0.25, home: [0.58, 50.84], desc: '从诺曼底、布列塔尼、佛兰德斯三地招来的步卒。' },
    { id: 'bowmen', side: 'a', kind: 'archer', flag: '弓', name: '诺曼弓弩手', str: 0.15, home: [0.58, 50.84], desc: '打头阵的射手，最后那轮抛射要了哈罗德的命。' },
    { id: 'shieldwall', side: 'b', kind: 'inf', flag: '盾', name: '哈罗德与盾墙', str: 0.7, home: [0.49, 50.915], desc: '国王的亲卫加各郡征召民兵，肩并肩举盾结成一道墙。' },
  ],
  phases: [
    { title: '诺曼登陆', date: '1066 年九月', cam: { at: [0.48, 50.888], d: 26, yaw: 0, pitch: 55 },
      text: '「忏悔者」爱德华去世时没留下子嗣，贵族们把哈罗德扶上王位；海峡对岸的诺曼底大公威廉咬定自己才是真命继承人，趁着南风把船队吹过海峡，在佩文西滩头踏上了英格兰。',
      moves: {
        knights: { path: [[0.28, 50.78], [0.33, 50.82], [0.45, 50.84], [0.58, 50.84]], state: 'move' },
        norminf: { path: [[0.3, 50.79], [0.58, 50.84]], state: 'move' },
        bowmen: { path: [[0.3, 50.79], [0.58, 50.84]], state: 'move' },
      },
      arrows: [{ side: 'a', pts: [[0.28, 50.78], [0.33, 50.82], [0.58, 50.84]] }],
      notes: [{ at: [0.35, 50.81], text: '滩头登陆', side: 'a', t: 0.5 }] },
    { title: '哈罗德南下', date: '1066 年十月', cam: { at: [0.49, 50.905], d: 20, yaw: 0, pitch: 54 },
      text: '哈罗德刚在北境打退挪威人的入侵，闻讯日夜兼程往南赶。十月十四日清晨，他抢在诺曼人之前把部队拉上森拉克山脊，盾墙沿坡顶一字排开，居高临下。',
      moves: {
        shieldwall: { path: [[0.36, 50.96], [0.49, 50.915]], state: 'move' },
        knights: { path: [[0.58, 50.84], [0.56, 50.86]], state: 'move' },
        norminf: { path: [[0.58, 50.84], [0.56, 50.86]], state: 'move' },
        bowmen: { path: [[0.58, 50.84], [0.56, 50.86]], state: 'move' },
      },
      arrows: [
        { side: 'b', pts: [[0.36, 50.96], [0.49, 50.915]] },
        { side: 'a', pts: [[0.58, 50.84], [0.56, 50.86]] },
      ],
      notes: [{ at: [0.49, 50.93], text: '抢占山脊', side: 'b', t: 0.5 }] },
    { title: '盾墙鏖战', date: '1066 年 10 月 14 日', cam: { at: [0.51, 50.89], d: 14, yaw: -6, pitch: 52 },
      text: '弓手抛射、步卒仰攻、骑士冲击，一轮轮撞在盾墙上全被弹回来。乱军中忽然传开「威廉阵亡」的消息，诺曼军阵脚大乱——威廉摘下头盔打马穿阵，喊出自己还活着，军心才稳住。',
      moves: {
        norminf: { path: [[0.56, 50.86], [0.5, 50.9]], state: 'fight', str: [1, 0.85] },
        bowmen: { path: [[0.56, 50.86], [0.53, 50.89]], state: 'fight' },
        shieldwall: { path: [[0.49, 50.915]], state: 'fight' },
        knights: { state: 'hold' },
      },
      arrows: [{ side: 'a', pts: [[0.56, 50.86], [0.5, 50.9]] }],
      fx: { clash: [0.5, 50.905] },
      notes: [{ at: [0.54, 50.87], text: '威廉露面', side: 'a', t: 0.55 }] },
    { title: '佯装败退', date: '1066 年 10 月 14 日', cam: { at: [0.52, 50.89], d: 14, yaw: 6, pitch: 52 },
      text: '威廉换了一手软刀子：骑士拨马佯装溃逃。盾墙里一部分英格兰兵忍不住追下坡去，被回身的诺曼骑兵在平地上收割。这样反复几次，山脊上的墙缺了口。',
      moves: {
        knights: { path: [[0.56, 50.86], [0.51, 50.89], [0.54, 50.87]], state: 'move' },
        shieldwall: { path: [[0.49, 50.915], [0.51, 50.905]], state: 'fight', str: [1, 0.6] },
      },
      arrows: [
        { side: 'a', pts: [[0.56, 50.86], [0.51, 50.89]] },
        { side: 'b', pts: [[0.49, 50.915], [0.51, 50.905]] },
      ],
      fx: { clash: [0.51, 50.9] },
      notes: [{ at: [0.5, 50.895], text: '佯退诱敌', side: 'a', t: 0.5 }] },
    { title: '哈罗德阵亡', date: '1066 年 10 月 14 日黄昏', cam: { at: [0.5, 50.905], d: 12, yaw: -4, pitch: 50 },
      text: '黄昏，诺曼弓手把箭抛过盾墙，箭雨落在墙后的人群里。哈罗德中箭坠地——相传正中眼睛——英格兰军随即崩散。威廉踏上英格兰，加冕为王，诺曼人的时代开始了。',
      moves: {
        bowmen: { path: [[0.53, 50.89], [0.5, 50.9]], state: 'fight' },
        knights: { path: [[0.54, 50.87], [0.5, 50.9]], state: 'fight' },
        shieldwall: { state: 'fight', str: [0.6, 0.1] },
      },
      arrows: [{ side: 'a', pts: [[0.53, 50.89], [0.5, 50.9]] }],
      fx: { clash: [0.5, 50.91], jolt: true },
      notes: [{ at: [0.48, 50.93], text: '哈罗德中箭', side: 'b', t: 0.55 }] },
  ],
  facts: { time: '1066 年 10 月 14 日', place: '黑斯廷斯 · 英格兰东南部', cmd: ['威廉（诺曼）', '哈罗德二世（英）'], strength: ['约 1 万', '约 0.8 万'], result: '诺曼军获胜，威廉加冕英格兰' },
  why: [
    '佯装败退一次次把英格兰兵引下山坡，山脊地利被一点点拆掉。',
    '弓箭先削盾墙，最后那轮抛射直取后排指挥中枢。',
    '重骑冲击与步卒轮换咬合顺畅，兵种协同是诺曼人的看家本事。',
    '英军一部经不住追击的诱惑，离开了唯一能抵消骑兵的地形。',
  ],
  meaning: [
    '诺曼王朝自此开篇，英格兰的土地与贵族来了一场大换血。',
    '上万个法语词混进英语，这座岛的语言与制度从此换了个底色。',
  ],
  quiz: [
    { q: '1066 年黑斯廷斯战役的双方统帅是？', opts: ['威廉与哈罗德', '理查与约翰', '狮心王与萨拉丁', '亨利与斯蒂芬'], a: 0, ex: '诺曼底公爵威廉渡海争位，英格兰王哈罗德战死坡顶。' },
    { q: '诺曼军瓦解盾墙的关键手段是？', opts: ['掘壕围困', '佯装败退诱敌下山', '水淹山脊', '断水断粮'], a: 1, ex: '骑士假溃，追下坡的英格兰兵被回身反击的骑兵反复收割。' },
    { q: '黑斯廷斯战役最深远的影响是？', opts: ['法国兼并英格兰', '诺曼王朝开篇，英语混入大量法语词', '英格兰迁都北方', '海峡贸易全面中断'], a: 1, ex: '威廉加冕后土地贵族大换血，英语的面貌也随之改变。' },
  ],
},
];

/* ---------------- 推演状态与阶段调度 ---------------- */

const state = {
  battleIdx: -1, phaseIdx: 0, t: 0, playing: false, speed: 1,
  exag: 1.7,
  showLabels: true, showUnits: true, showArrows: true, showNotes: true,
  battle: null,
};

const easeIO = (x) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
function phaseDur(p) { return p.dur || clamp(3.2 + (p.text || '').length / 26, 4.2, 7.8); }
function phaseStartT(b, idx) {
  let t = 0;
  for (let i = 0; i < idx; i++) t += phaseDur(b.phases[i]);
  return t;
}

/* 阶段装配：算出每个军团的本阶段起终点与状态 */
let unitPlans = [];

/* 找单位附近最近的河段走向（船队默认沿江） */
function riverYawAt(lon, lat, b) {
  let best = 1e9, yaw = 0;
  for (const [pts] of b.geo.rivers || []) {
    for (let i = 0; i < pts.length - 1; i++) {
      const [x1, z1] = [pts[i][0], pts[i][1]];
      const [x2, z2] = [pts[i + 1][0], pts[i + 1][1]];
      const d = distSeg(lon, lat, x1, z1, x2, z2);
      if (d < best) { best = d; yaw = Math.atan2(x2 - x1, z2 - z1); }
    }
  }
  return yaw;
}

function setupPhase(idx, opts = {}) {
  if (!current || !state.battle) return;
  state.phaseIdx = idx;
  current.jolted = false; current.shock = 0;
  const b = state.battle;
  const phase = b.phases[idx];
  buildPhaseDecor(idx);

  unitPlans = [];
  const live = new Map();
  for (const [id, ug] of current.unitObjs) live.set(id, ug.userData.live || { x: ug.position.x, z: ug.position.z, state: 'camp', strK: 1 });

  for (const [id, ug] of current.unitObjs) {
    const plan = (phase.moves || {})[id] || null;
    const cur = live.get(id);
    let end = { x: cur.x, z: cur.z };
    let pathW = null;
    if (plan?.path) {
      pathW = plan.path.map(([lo, la]) => ({ x: current.proj.x(lo), z: current.proj.z(la) }));
      const last = pathW[pathW.length - 1];
      end = { x: last.x, z: last.z };
    } else if (plan?.at) {
      end = { x: current.proj.x(plan.at[0]), z: current.proj.z(plan.at[1]) };
    }
    /* fight 状态：终点贴着交战点留出接战距离 */
    if (plan?.state === 'fight' && phase.fx?.clash) {
      const cx = current.proj.x(phase.fx.clash[0]), cz = current.proj.z(phase.fx.clash[1]);
      const dx = end.x - cx, dz = end.z - cz;
      const L = Math.hypot(dx, dz) || 1;
      end = { x: cx + dx / L * 1.15, z: cz + dz / L * 1.15 };
    }
    ug.userData.plan = {
      start: { x: cur.x, z: cur.z },
      end,
      pathW,
      state: plan?.state || cur.state,
      strK0: plan?.str ? plan.str[0] : cur.strK,
      strK1: plan?.str ? plan.str[1] : cur.strK,
      seed: (id.length * 131 + idx * 17) % 997,
    };
    /* 船队默认沿江走向（无本阶段路径时） */
    const unitDef = ug.userData.unit;
    if (unitDef.kind === 'ship' && !pathW) {
      ug.userData.baseYaw = riverYawAt(unitDef.home[0], unitDef.home[1], b);
      ug.rotation.y = ug.userData.baseYaw;
    }
    ug.userData.live = { x: cur.x, z: cur.z, state: ug.userData.plan.state, strK: cur.strK };
    unitPlans.push(ug);
  }

  /* 阶段相机 */
  if (!opts.keepCam) flyToPhaseCam(phase.cam);

  /* 火攻闪屏复位 */
  fireFlashEl.classList.remove('hot');

  /* UI 同步 */
  syncPhaseUI(idx);
}

function flyToPhaseCam(cam) {
  if (!current) return;
  const tx = current.proj.x(cam.at[0]);
  const tz = current.proj.z(cam.at[1]);
  const ty = current.dem.sample(...n_uv(cam.at, current.proj)) * state.exag * HMAX;
  const yaw = (cam.yaw || 0) * DEG, pitch = (cam.pitch || 52) * DEG;
  const d = cam.d;
  const px = tx + Math.sin(yaw) * Math.cos(pitch) * d;
  const py = ty + Math.sin(pitch) * d;
  const pz = tz + Math.cos(yaw) * Math.cos(pitch) * d;
  vfx.flyTo([px, py, pz], [tx, ty, tz], 1.15);
}

/* 逐帧推演 */
let fireK = 0;

function tickBattle(dt, time) {
  if (!current || !state.battle) return;
  const b = state.battle;
  let phase = b.phases[state.phaseIdx];
  let dur = phaseDur(phase);

  if (state.playing) {
    state.t += dt * state.speed;
    /* 阶段自然推进 */
    let acc = 0, ended = true, idx = state.phaseIdx;
    for (let i = 0; i < b.phases.length; i++) {
      acc += phaseDur(b.phases[i]);
      if (state.t < acc) { idx = i; ended = false; break; }
    }
    if (ended) {
      state.t = acc;
      setPlaying(false);
    } else if (idx !== state.phaseIdx) {
      setupPhase(idx);
      phase = b.phases[state.phaseIdx];
      dur = phaseDur(phase);
    }
  }

  const prog = clamp((state.t - phaseStartT(b, state.phaseIdx)) / dur, 0, 1);
  const eased = easeIO(prog);

  /* 军团摆位 */
  for (const ug of unitPlans) {
    const p = ug.userData.plan;
    let x, z;
    if (p.pathW && p.pathW.length > 1) {
      /* 沿路径按弧长插值 */
      let segLen = 0;
      const lens = [];
      for (let i = 0; i < p.pathW.length - 1; i++) {
        const l = Math.hypot(p.pathW[i + 1].x - p.pathW[i].x, p.pathW[i + 1].z - p.pathW[i].z);
        lens.push(l); segLen += l;
      }
      let want = eased * segLen, acc2 = 0, fx2 = 0, fy2 = 0;
      for (let i = 0; i < lens.length; i++) {
        if (want <= acc2 + lens[i] || i === lens.length - 1) {
          const k = lens[i] > 0 ? (want - acc2) / lens[i] : 1;
          fx2 = p.pathW[i].x + (p.pathW[i + 1].x - p.pathW[i].x) * k;
          fy2 = p.pathW[i].z + (p.pathW[i + 1].z - p.pathW[i].z) * k;
          break;
        }
        acc2 += lens[i];
      }
      x = fx2; z = fy2;
    } else {
      x = p.start.x + (p.end.x - p.start.x) * eased;
      z = p.start.z + (p.end.z - p.start.z) * eased;
    }
    /* 接战抖动 */
    if (p.state === 'fight') {
      const j = 0.055;
      x += Math.sin(time * 11 + p.seed) * j;
      z += Math.cos(time * 9.3 + p.seed * 1.7) * j;
    }
    const groundY = current.dem.sample(...n_uv([current.proj.lon(x), current.proj.lat(z)], current.proj)) * state.exag * HMAX;
    ug.position.set(x, groundY, z);
    /* 朝向（行军方向） */
    if (p.pathW && p.pathW.length > 1) {
      const tgt = p.pathW[p.pathW.length - 1];
      const ang = Math.atan2(tgt.x - x, tgt.z - z);
      ug.rotation.y += (ang - ug.rotation.y) * Math.min(1, dt * 4);
    }
    /* 兵力增减（实例数随 strK 变化） */
    const strK = p.strK0 + (p.strK1 - p.strK0) * eased;
    ug.userData.live.strK = strK;
    if (ug.userData.bodies) {
      const full = ug.userData.bodies.userData.fullCount || (ug.userData.bodies.userData.fullCount = ug.userData.bodies.count);
      const want = Math.max(2, Math.round(full * strK));
      if (ug.userData.bodies.count !== want) {
        ug.userData.bodies.count = want;
        ug.userData.heads.count = want;
      }
    }
    /* 消亡 / 消散 形变 */
    let sc = 1, tilt = 0;
    if (p.state === 'dead') { sc = 1 - 0.55 * eased; tilt = eased * 0.5; }
    if (p.state === 'vanish') { sc = Math.max(0.001, 1 - eased * 1.15); }
    if (sc !== ug.userData.lastSc) {
      ug.scale.set(sc, sc * (1 - tilt * 0.5), sc);
      ug.userData.lastSc = sc;
    }
    /* 军旗摆动 */
    if (ug.userData.flagMat?.userData.shader) {
      ug.userData.flagMat.userData.shader.uniforms.uWave.value = time * 2.1 + p.seed;
    }
    /* 船队微浪 */
    if (ug.userData.fleet) {
      ug.userData.fleet.ships.forEach((s2, i2) => {
        s2.position.y = Math.sin(time * 1.6 + i2 * 1.9) * 0.045;
        s2.rotation.z = Math.sin(time * 1.3 + i2) * 0.05;
      });
    }
  }

  /* 箭头推进 */
  if (current.arrowsGroup.visible) {
    for (const obj of current.arrowsGroup.children) {
      const arr = obj.userData.arrowDef;
      let adv;
      if (arr?.t) {
        const [t0, t1] = arr.t;
        adv = clamp((prog - t0) / Math.max(t1 - t0, 0.001), 0, 1);
      } else adv = eased;
      tickArrow(obj, easeIO(adv), time);
    }
  }
  /* 阶段标签弹出 */
  if (current.notesGroup.visible) {
    for (const sp of current.notesGroup.children) {
      const at = sp.userData.noteAt;
      const k = clamp((prog - at) / 0.12, 0, 1);
      const e = 1 - Math.pow(1 - k, 3);
      sp.material.opacity = e;
      const base = sp.userData.baseScale || (sp.userData.baseScale = sp.scale.x);
      sp.scale.set(base * (0.7 + 0.3 * e), sp.scale.y * 1, 1);
      sp.position.y += 0; // 标签贴地
      sp.visible = k > 0;
    }
  }

  /* 交战特效 */
  const fx = phase.fx;
  const clashActive = !!(fx?.clash && prog > 0.12 && prog < 0.96 && state.playing !== false);
  if (fx?.clash) {
    const c = fx.clash;
    const cx = current.proj.x(c[0]), cz = current.proj.z(c[1]);
    const cy = current.dem.sample(...n_uv(c, current.proj)) * state.exag * HMAX + 0.3;
    fireSparkBurst(current.sparks, new THREE.Vector3(cx, cy, cz), time, clashActive);
    if (clashActive && current.shock === undefined) current.shock = 0;
    if (clashActive) {
      current.shock = (current.shock || 0) + dt;
      terrainInj.uFire.value = 0.25 + Math.sin(time * 8) * 0.12;
    } else {
      terrainInj.uFire.value *= Math.max(0, 1 - dt * 3);
    }
  }
  /* 火攻 */
  const fireActive = !!(fx?.fire && prog > 0.3);
  if (fx?.fire) {
    const c = fx.fire;
    const cx = current.proj.x(c[0]), cz = current.proj.z(c[1]);
    const cy = current.dem.sample(...n_uv(c, current.proj)) * state.exag * HMAX + 0.4;
    fireEmberPlume(current.embers, new THREE.Vector3(cx, cy, cz), time, fireActive);
    fireLight.position.set(cx, cy + 1.4, cz);
    fireLight.intensity = fireActive ? 5 + Math.sin(time * 11) * 2.2 : Math.max(0, fireLight.intensity - dt * 8);
    fireK += ((fireActive ? 1 : 0) - fireK) * Math.min(1, dt * 2.4);
    fireFlashEl.classList.toggle('hot', fireActive && state.playing);
    terrainInj.uFire.value = Math.max(terrainInj.uFire.value, fireK * 0.85);
    if (fx.jolt && fireActive && !current.jolted) { current.jolted = true; current.shake = 0.55; }
  } else {
    fireFlashEl.classList.remove('hot');
    fireLight.intensity = Math.max(0, fireLight.intensity - dt * 8);
  }
  if (!fx?.clash) terrainInj.uFire.value = Math.max(0, terrainInj.uFire.value - dt * 2);

  /* 相机震动 */
  if (current.shake > 0.002) {
    current.shake *= Math.exp(-dt * 3.6);
    camera.position.x += (Math.random() - 0.5) * current.shake * 0.5;
    camera.position.y += (Math.random() - 0.5) * current.shake * 0.3;
  }

  /* 夜色 */
  const nightTarget = phase.night ? 1 : 0;
  nightK += (nightTarget - nightK) * Math.min(1, dt * 1.3);
  terrainInj.uNight.value = nightK;
  if (current.water) current.water.mat.uniforms.uNight.value = nightK;
  keyLight.intensity = 1.25 * (1 - nightK * 0.8);
  fillLight.intensity = 0.36 * (1 - nightK * 0.55);
  hemiLight.intensity = 0.62 * (1 - nightK * 0.45);
  battleGroup.traverse((o) => {
    if (o.userData?.ember && o.material) o.material.emissiveIntensity = 0.05 + nightK * 1.5;
  });

  /* 读数 */
  readPhase.textContent = `第 ${state.phaseIdx + 1} / ${b.phases.length} 幕 · ${phase.title}`;
  readProg.textContent = `${Math.round(prog * 100)}%`;
  readNight.textContent = nightK > 0.5 ? '夜战（火光）' : nightK > 0.05 ? '入夜…' : '白昼';
  const fighting = unitPlans.some((u2) => u2.userData.plan.state === 'fight');
  readState.textContent = fighting ? '接战中' : (phase.fx?.fire ? '火攻!' : '行军/对峙');
}

/* ---------------- UI：目录 / 详解 / 进度条 / 控件 ---------------- */

const $ = (id) => document.getElementById(id);
const fireFlashEl = $('fireFlash');
const chapNav = $('chapNav');
const stripChips = $('stripChips');

/* 左栏战役目录 */
function buildChapters() {
  chapNav.innerHTML = '';
  BATTLES.forEach((b, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'chap-btn';
    const n = document.createElement('span');
    n.className = 'chap-n';
    n.textContent = String(i + 1).padStart(2, '0');
    const t = document.createElement('span');
    t.className = 'chap-t';
    t.textContent = b.title;
    const era = document.createElement('span');
    era.className = 'chap-era-line';
    era.textContent = `${b.sub.split(' · ')[0]} · ${b.era}`;
    btn.append(n, t, era);
    btn.addEventListener('click', () => { if (i !== state.battleIdx) loadBattle(i); });
    chapNav.appendChild(btn);
  });
}
function syncChapters() {
  const btns = chapNav.querySelectorAll('.chap-btn');
  btns.forEach((b2, i) => b2.classList.toggle('on', i === state.battleIdx));
  const cur = btns[state.battleIdx];
  if (cur) cur.scrollIntoView({ block: 'nearest' });
  $('battleCount').textContent = `${String(state.battleIdx + 1).padStart(2, '0')}/${String(BATTLES.length).padStart(2, '0')}`;
  $('chapEra').textContent = state.battle?.era || '—';
}

/* 底部阶段 chip */
function buildStrip() {
  stripChips.innerHTML = '';
  const b = state.battle;
  b.phases.forEach((p, i) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'strip-chip' + (p.night ? ' night' : '');
    chip.innerHTML = `${p.title}<small>${p.date}</small>`;
    chip.addEventListener('click', () => jumpPhase(i));
    stripChips.appendChild(chip);
  });
}
function syncPhaseUI(idx) {
  const b = state.battle;
  const phase = b.phases[idx];
  stripChips.querySelectorAll('.strip-chip').forEach((c, i) => c.classList.toggle('on', i === idx));
  const chip = stripChips.children[idx];
  if (chip) chip.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  $('wsDate').textContent = phase.date;
  $('wsText').textContent = phase.text;
  /* 右栏当前阶段详解 */
  const phBlock = $('phBlock');
  if (phBlock) {
    phBlock.querySelector('.ph-date').textContent = phase.date;
    phBlock.querySelector('.ph-title').textContent = `${idx + 1}. ${phase.title}`;
    phBlock.querySelector('.ph-text').textContent = phase.text;
    phBlock.style.display = '';
  }
}

/* 右栏详解（战役档案 + 胜负关键 + 深远影响 + 随堂三问 + 阶段解说块） */
function buildDetail() {
  const b = state.battle;
  $('detailNo').textContent = String(state.battleIdx + 1).padStart(2, '0');
  $('detailTitle').textContent = b.title;
  $('railTitleR').textContent = b.title;

  const lesson = $('lesson');
  lesson.innerHTML = '';

  /* 当前阶段解说（随播放更新） */
  const phBlock = document.createElement('div');
  phBlock.className = 'ph-block';
  phBlock.id = 'phBlock';
  phBlock.innerHTML = '<span class="ph-date"></span><div class="ph-title"></div><div class="ph-text"></div>';
  lesson.appendChild(phBlock);

  /* 战役档案 */
  const facts = document.createElement('div');
  facts.className = 'wf-facts';
  const rows = [
    ['时间', b.facts.time],
    ['地点', b.facts.place],
    ['统帅', `${b.facts.cmd[0]}<span class="vs">对</span>${b.facts.cmd[1]}`],
    ['兵力', `${b.facts.strength[0]}<span class="vs">对</span>${b.facts.strength[1]}`],
    ['结果', b.facts.result],
  ];
  for (const [k, v] of rows) {
    const r = document.createElement('div');
    r.className = 'wf-row';
    r.innerHTML = `<b>${k}</b><span>${v}</span>`;
    facts.appendChild(r);
  }
  lesson.appendChild(facts);

  /* 胜负关键（前三条胜方口吻，末条为败方教训） */
  const whyBox = document.createElement('div');
  whyBox.innerHTML = '<div class="wq-head" style="margin-bottom:6px">胜负关键</div>';
  const ul = document.createElement('ul');
  ul.className = 'wf-list';
  b.why.forEach((w, i) => {
    const li = document.createElement('li');
    li.textContent = w;
    if (i === b.why.length - 1 && b.why.length > 3) li.className = 'neg';
    ul.appendChild(li);
  });
  whyBox.appendChild(ul);
  lesson.appendChild(whyBox);

  /* 深远影响 */
  const meanBox = document.createElement('div');
  meanBox.innerHTML = '<div class="wq-head" style="margin-bottom:6px">深远影响</div>';
  const ul2 = document.createElement('ul');
  ul2.className = 'wf-list';
  b.meaning.forEach((w) => {
    const li = document.createElement('li');
    li.textContent = w;
    ul2.appendChild(li);
  });
  meanBox.appendChild(ul2);
  lesson.appendChild(meanBox);

  /* 随堂三问 */
  const quiz = document.createElement('div');
  quiz.className = 'wf-quiz';
  quiz.innerHTML = '<div class="wq-head">随堂三问</div>';
  b.quiz.forEach((item) => {
    const q = document.createElement('div');
    q.className = 'wq-item';
    const qt = document.createElement('div');
    qt.className = 'wq-q';
    qt.textContent = item.q;
    q.appendChild(qt);
    const ex = document.createElement('div');
    ex.className = 'wq-ex';
    item.opts.forEach((opt, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'wq-opt';
      btn.textContent = String.fromCharCode(65 + i) + '. ' + opt;
      btn.addEventListener('click', () => {
        q.querySelectorAll('.wq-opt').forEach((bb, j) => {
          bb.disabled = true;
          if (j === item.a) bb.classList.add('right');
          else if (j === i) bb.classList.add('wrong');
        });
        ex.style.display = 'block';
        ex.textContent = (i === item.a ? '✓ ' : '✗ ') + item.ex;
      });
      q.appendChild(btn);
    });
    q.appendChild(ex);
    quiz.appendChild(q);
  });
  lesson.appendChild(quiz);

  /* 战斗头卡 + 兵力条 */
  $('bcTitle').textContent = b.title;
  $('bcSub').textContent = `${b.sub} · ${b.era}`;
  const maxBar = Math.max(b.bars[0], b.bars[1]);
  $('barA').style.transform = `scaleX(${b.bars[0] / maxBar})`;
  $('barB').style.transform = `scaleX(${b.bars[1] / maxBar})`;
  $('barAt').textContent = `${b.sides.a.name} ${b.facts.strength[0]}`;
  $('barBt').textContent = `${b.sides.b.name} ${b.facts.strength[1]}`;
}

/* 数据读数 */
const readPhase = document.createElement('span');
const readProg = document.createElement('span');
const readNight = document.createElement('span');
const readState = document.createElement('span');
function buildReadouts() {
  const box = $('lcData');
  box.innerHTML = '';
  const mk = (label, el) => {
    const r = document.createElement('div');
    r.className = 'wd-row';
    const b = document.createElement('b');
    b.textContent = label;
    r.append(b, el);
    box.appendChild(r);
  };
  mk('当前阶段', readPhase);
  mk('阶段进度', readProg);
  mk('战场态势', readState);
  mk('昼夜', readNight);
}

/* ---------------- 控件条（右栏手风琴 2） ---------------- */

const ctl = createControlsPanel($('controls'));
let playBtnRef = null;

function buildControls() {
  ctl.clear();
  const play = ctl.button({
    label: state.playing ? '⏸ 暂停' : '▶ 播放',
    onClick: () => { setPlaying(!state.playing); },
  });
  playBtnRef = play;
  ctl.button({ label: '⏮ 上一幕', onClick: () => jumpPhase(Math.max(0, state.phaseIdx - 1)) });
  ctl.button({ label: '下一幕 ⏭', onClick: () => jumpPhase(Math.min(state.battle.phases.length - 1, state.phaseIdx + 1)) });
  ctl.button({ label: '↻ 重演', onClick: () => { jumpPhase(0); setPlaying(true); } });
  ctl.sep();
  ctl.slider({
    label: '推演速度', min: 0.4, max: 3, step: 0.1, value: state.speed,
    fmt: (v) => v.toFixed(1) + '×',
    onInput: (v) => { state.speed = v; },
  });
  ctl.slider({
    label: '地形起伏', min: 0.6, max: 3, step: 0.1, value: state.exag,
    fmt: (v) => v.toFixed(1) + '×',
    onInput: (v) => { setExaggeration(v); },
  });
  ctl.sep();
  ctl.toggle({ label: '地名注记', value: state.showLabels, onChange: (v) => { state.showLabels = v; applyVis(); } });
  ctl.toggle({ label: '兵团', value: state.showUnits, onChange: (v) => { state.showUnits = v; applyVis(); } });
  ctl.toggle({ label: '进军箭头', value: state.showArrows, onChange: (v) => { state.showArrows = v; applyVis(); } });
  ctl.toggle({ label: '阶段标签', value: state.showNotes, onChange: (v) => { state.showNotes = v; applyVis(); } });
}

function applyVis() {
  if (!current) return;
  /* 地名注记：文字精灵 + 注记造型 */
  for (const m of current.markers) m.visible = state.showLabels;
  for (const w of current.walls) w.visible = state.showLabels;
  battleGroup.traverse((o) => {
    if (o.isSprite && !o.userData.noteAt) o.visible = state.showLabels;
  });
  current.unitObjs.forEach((ug) => { ug.visible = state.showUnits; });
  current.arrowsGroup.visible = state.showArrows;
  current.notesGroup.visible = state.showNotes;
}

/* 起伏夸张度：地形重建 + 水面/注记/军团高度随动（整场轻重建，防漂移） */
let exagTimer = null;
function setExaggeration(v) {
  state.exag = v;
  if (exagTimer) clearTimeout(exagTimer);
  exagTimer = setTimeout(() => {
    if (!state.battle) return;
    const keepIdx = state.phaseIdx;
    const wasPlaying = state.playing;
    loadBattleScene(state.battle);
    applyVis();
    setupPhase(keepIdx, { keepCam: true });
    setPlaying(wasPlaying);
  }, 260);
}

/* ---------------- 播放控制 ---------------- */

function setPlaying(v) {
  state.playing = v;
  if (playBtnRef) playBtnRef.textContent = v ? '⏸ 暂停' : '▶ 播放';
  $('playBtn').textContent = v ? '⏸' : '▶';
}
function jumpPhase(idx) {
  if (!state.battle || !current) return;
  idx = clamp(idx, 0, state.battle.phases.length - 1);
  state.t = phaseStartT(state.battle, idx);
  current.jolted = false;
  current.shock = 0;
  setupPhase(idx);
  if (idx === state.battle.phases.length - 1) setPlaying(false);
}

/* ---------------- 战役加载 ---------------- */

let loadOverlay = null;
let bootLoaderDone = false;
function showLoad(text) {
  if (!bootLoaderDone) { bootLoaderDone = true; loader.hide(); }
  if (loadOverlay) loadOverlay.remove();
  loadOverlay = makeLoader(stage, text);
}
function hideLoad() {
  if (loadOverlay) { const el = loadOverlay; loadOverlay = null; el.hide(); }
}

function loadBattle(i) {
  state.battleIdx = i;
  const b = BATTLES[i];
  state.battle = b;
  state.t = 0;
  nightK = 0; fireK = 0;
  setPlaying(false);
  showLoad(`正在铺开「${b.title}」沙盘…`);
  setTimeout(() => {
    loadBattleScene(b);
    applyVis();
    buildStrip();
    buildDetail();
    buildControls();
    setupPhase(0);
    setPlaying(true);
    syncChapters();
    hideLoad();
  }, 40);
}

/* ---------------- 拾取：点看注记与军团 ---------------- */

const raycaster = new THREE.Raycaster();
let downX = 0, downY = 0;
app.dom.addEventListener('pointerdown', (e) => { downX = e.clientX; downY = e.clientY; });
app.dom.addEventListener('pointerup', (e) => {
  if (Math.hypot(e.clientX - downX, e.clientY - downY) > 6) return;
  if (!current) return;
  const rect = app.dom.getBoundingClientRect();
  const mx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  const my = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(new THREE.Vector2(mx, my), camera);
  const hits = raycaster.intersectObjects(current.pickables, false);
  if (!hits.length) return;
  const info = hits[0].object.userData.pick;
  if (!info) return;
  showMapNote(info);
});

function showMapNote(info) {
  let card = document.querySelector('.map-note');
  if (card) card.remove();
  const isUnit = info.type === 'unit';
  const obj = isUnit ? info.unit : (info.type === 'wall' ? info.wall : info.place);
  const side = obj.side === 'b' ? 1 : 0;
  const col = state.battle.sideColors[side];
  card = document.createElement('div');
  card.className = 'map-note';
  const kindName = isUnit ? '军团' : (info.type === 'wall' ? '工事' : ({ city: '城邑', camp: '营盘', mount: '山川' }[info.place?.kind] || '注记'));
  card.innerHTML = `
    <div class="mn-head">
      <i class="mn-dot" style="background:${col}"></i>
      <span class="mn-name"></span>
      <button class="mn-close" type="button" aria-label="关闭">✕</button>
    </div>
    <span class="mn-kind">${kindName}${isUnit ? ` · ${state.battle.sides[obj.side === 'b' ? 'b' : 'a'].name}` : ''}</span>
    <div class="mn-desc"></div>`;
  card.querySelector('.mn-name').textContent = obj.name;
  card.querySelector('.mn-desc').textContent = obj.desc || '点开右栏「战役详解」可阅读本阶段解说。';
  card.querySelector('.mn-close').addEventListener('click', () => card.remove());
  stage.appendChild(card);
}

/* ---------------- 折叠体系（localStorage：war.foldL / foldR / acc*） ---------------- */

const shell = $('warShell');
const FOLD_KEY = { l: 'war.foldL', r: 'war.foldR' };
let foldL = false, foldR = false, focusSaved = null;

function setFold(side, on) {
  if (side === 'l') foldL = on; else foldR = on;
  try { localStorage.setItem(FOLD_KEY[side], on ? '1' : '0'); } catch (e) { /* 忽略 */ }
  paintFold();
}
function paintFold() {
  shell.classList.toggle('fold-l', foldL);
  shell.classList.toggle('fold-r', foldR);
  $('foldLBtn').textContent = '‹';
  $('unfoldLBtn').textContent = '›';
}
function setFocus(on) {
  if (on && focusSaved === null) {
    focusSaved = [foldL, foldR];
    foldL = true; foldR = true;
  } else if (!on && focusSaved !== null) {
    [foldL, foldR] = focusSaved;
    focusSaved = null;
  }
  shell.classList.toggle('focus-mode', on);
  const btn = $('focusBtn');
  btn.textContent = on ? '退出专注' : '专注模式';
  btn.setAttribute('aria-pressed', String(on));
}

/* 手风琴偏好（切战不重置） */
function initAccordions() {
  document.querySelectorAll('.acc').forEach((acc) => {
    const key = 'war.acc' + acc.dataset.acc.charAt(0).toUpperCase() + acc.dataset.acc.slice(1);
    let saved = null;
    try { saved = localStorage.getItem(key); } catch (e) { /* 忽略 */ }
    if (saved === null) {
      /* 首访清爽态：窄屏默认收起读数 */
      const clean = window.innerWidth <= 1100 && acc.dataset.acc === 'data';
      acc.classList.toggle('closed', clean);
    } else {
      acc.classList.toggle('closed', saved === '1');
    }
    const head = acc.querySelector('.acc-head');
    head.addEventListener('click', () => {
      const closed = acc.classList.toggle('closed');
      try { localStorage.setItem(key, closed ? '1' : '0'); } catch (e) { /* 忽略 */ }
    });
  });
}

/* ---------------- 键盘 ---------------- */

window.addEventListener('keydown', (e) => {
  if (e.target && /input|textarea|select/i.test(e.target.tagName)) return;
  switch (e.key) {
    case ',': loadBattle((state.battleIdx - 1 + BATTLES.length) % BATTLES.length); break;
    case '.': loadBattle((state.battleIdx + 1) % BATTLES.length); break;
    case ' ': e.preventDefault(); setPlaying(!state.playing); break;
    case 'ArrowLeft': e.preventDefault(); jumpPhase(state.phaseIdx - 1); break;
    case 'ArrowRight': e.preventDefault(); jumpPhase(state.phaseIdx + 1); break;
    case 'r': case 'R': if (state.battle) flyToPhaseCam(state.battle.phases[state.phaseIdx].cam); break;
    case 'f': case 'F': toggleFullscreen(); break;
    case 'Escape': {
      const note = document.querySelector('.map-note');
      if (note) { note.remove(); break; }
      if (focusSaved !== null) setFocus(false);
      break;
    }
  }
});

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen?.().catch(() => {});
  } else {
    document.exitFullscreen?.().catch(() => {});
  }
}

/* ---------------- 顶栏与舞台按钮 ---------------- */

$('battlePrev').addEventListener('click', () => loadBattle((state.battleIdx - 1 + BATTLES.length) % BATTLES.length));
$('battleNext').addEventListener('click', () => loadBattle((state.battleIdx + 1) % BATTLES.length));
$('playBtn').addEventListener('click', () => setPlaying(!state.playing));
$('stepPrev').addEventListener('click', () => jumpPhase(state.phaseIdx - 1));
$('stepNext').addEventListener('click', () => jumpPhase(state.phaseIdx + 1));
$('camResetBtn').addEventListener('click', () => { if (state.battle) flyToPhaseCam(state.battle.phases[state.phaseIdx].cam); });
$('fullBtn').addEventListener('click', toggleFullscreen);
$('focusBtn').addEventListener('click', () => setFocus(focusSaved === null));
$('foldLBtn').addEventListener('click', () => setFold('l', !foldL));
$('unfoldLBtn').addEventListener('click', () => setFold('l', false));
$('foldRBtn').addEventListener('click', () => setFold('r', !foldR));
$('unfoldRBtn').addEventListener('click', () => setFold('r', false));
try {
  foldL = localStorage.getItem(FOLD_KEY.l) === '1';
  foldR = localStorage.getItem(FOLD_KEY.r) === '1';
} catch (e) { /* 忽略 */ }
paintFold();

/* ---------------- 主循环与启动 ---------------- */

let lastReadMs = 0;
app.onFrame((dt, time) => {
  tickBattle(dt, time);
});

buildChapters();
buildReadouts();
initAccordions();
loadBattle(0);

/* ---------------- 验收钩子（gate 脚本读取渲染统计） ---------------- */
window.__warStats = () => {
  try {
    const st = vfx.stats();
    return { calls: st.calls, tris: st.tris, night: nightK, exag: state.exag, battle: state.battle?.id, phase: state.phaseIdx };
  } catch (e) { return null; }
};

/* 拾取探针：把第一个城邑注记投影到归一化屏幕坐标（gate 点看注记卡用） */
window.__warPickProbe = () => {
  try {
    if (!current || !state.battle) return null;
    const pl = (state.battle.places || []).find((x) => x.kind === 'city');
    if (!pl) return null;
    const v = new THREE.Vector3(
      current.proj.x(pl.at[0]),
      current.dem.sample(...n_uv(pl.at, current.proj)) * state.exag * HMAX + 1.2,
      current.proj.z(pl.at[1])
    );
    v.project(camera);
    return { nx: v.x * 0.5 + 0.5, ny: -v.y * 0.5 + 0.5, name: pl.name };
  } catch (e) { return null; }
};
