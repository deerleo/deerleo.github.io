/* EduLab · 神舟发射与返回（rocket）— Micro 级深改
 * 12 章：认识长征二号F / 构造与推进 / 点火与起飞 / 冲出大气 / 抛掉包袱 / 进入轨道 /
 *       在轨飞行 / 再入大气 / 开伞着陆 / 神舟任务档案 / 自由发射台 / 随堂检测
 * 场景：酒泉发射场（格构勤务塔 + 脐带摆杆 + 导流槽喷水降温 + 避雷塔 + 勤务楼/燃料库/车队道具）
 *       → 上升段重力转弯（真实参数积分 + 标称弹道对比）→ 在轨段地球（昼夜云层 + 大气边缘辉光 +
 *       天宫空间站）→ 再入黑障（等离子鞘三层辉光 + 烧蚀防热大底）→ 主伞+反顶着陆（东风着陆场）。
 * 工艺：three.js 全程序化建模——箭体走车削放样 + 法兰螺栓阵列 + 电缆罩曲线扫掠；发动机喷管车削
 *       钟形 + 涡轮机匣；塔架格构走实例化矩阵（单 draw call 一面墙）；旗帜/徽章/太阳能帆板/
 *       降落伞伞衣/烧蚀大底/遥测屏全部 CanvasTexture 矢量绘制。
 * 依赖：edu-core（three 场景与控件）+ edu-vfx（后处理管线 / 色板 / 材质工厂 / 程序化纹理）。
 */
import {
  THREE, DEG, TAU, clamp,
  loadTexture, loadAll, createApp, makeLoader, makeHUD, makeTextSprite, setSpriteText,
  makeGlowTexture, circleLine, makeStars, createControlsPanel,
} from './edu-core.js';
import {
  attachVFX, PAL,
  matSheen, matCoat, matStd, matGlow,
  makeWoodTexture, makeLabelTexture, makeStudioEnvironment, fbm3, ghostify,
} from './edu-vfx.js';

/* ---------------- 数学小件 ---------------- */

const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (t) => t * t * (3 - 2 * t);
const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
/** 确定性伪随机（mulberry32 家族，本实验自有实现，同 seed 可复现纹理） */
function mulberry(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------------- 色板（火箭/发射场族；裸色仅在此登记，场景内一律引用 COL/PAL） ---------------- */

const COL = {
  // 箭体族
  hull: 0xf2f4f6, hullShade: 0xdfe3e8, hullJoint: 0xb9bfc6, hullUnder: 0x9aa0a6,
  bandRed: 0xc23b2e, bandRedDeep: 0x992a1f,
  cncBlue: 0x1e4f9c, cncBlueDeep: 0x15376e,
  raceway: 0xe9ebed, racewayEdge: 0xc4c9cd,
  flagRed: 0xde2910, flagStar: 0xffde00,
  // 金属族
  chrome: 0xc7ccd2, chromeDeep: 0x8d949c, darkMetal: 0x3a414b, darkMetalHi: 0x59626e,
  steel: PAL.steel, brass: PAL.brass, towerSteel: 0x5b636e, towerSteelHi: 0x7d8792,
  towerPaint: 0x6e7a86, rubber: 0x23262b,
  // 火焰 / 等离子体族
  flameCore: 0xffe0ae, flameMid: 0xffa54d, flameEdge: 0xe8704a,
  steam: 0xe8e2d8, plasmaCore: 0xfff3dc, plasmaMid: 0xff9d52, plasmaEdge: 0xe8542e,
  retro: 0xffd9a0,
  // 防热 / 降落伞族
  ablation: 0x4a4f47, charred: 0x2e2620, charGlow: 0xa8441e,
  chuteRed: 0xd4482f, chuteCream: 0xe8e4da, chuteShade: 0xa03426, chuteLine: 0x8a8f96,
  // 发射场族
  gobi: 0xc9b895, gobiDeep: 0xa8987a, shrub: 0x5a6b3a, shrubDark: 0x46582e, rock: 0x9a8f80,
  concrete: 0xc9c4bb, concreteDeep: 0x8f959c, asphalt: 0x4c4f55,
  warnYellow: 0xe8c23f, warnInk: 0x1c1e22,
  water: 0x7ab8e8, tankSilver: 0xb8bec4, windowLit: 0xffe9b0,
  // 回收测控装备族
  rcWhite: 0xe2e6ea, rcBlue: 0x2a5aa8, rcPadYellow: 0xd8b23f,
  // 太空族
  space: 0x03060c, dawn: 0x9cc2e6, dustDawn: 0x8f95a8,
  earthNight: 0xffca7a, atmoBlue: 0x7fb4ff, orbitLine: 0x69c8ff,
  stationBody: 0xd8dce0, stationPanel: 0x274a86, stationGold: 0xc9a44a,
  // UI / 标注
  label: 0xffe2b8, labelBlue: 0x8fd3ff, labelGreen: 0xb7f5a5, labelViolet: 0xe8a0ff,
  forceT: 0xffa23e, forceG: 0x5aa7e8, forceD: 0xd9534f,
  plotV: 0xe8674a, plotH: 0x5aa7e8, plotQ: 0xe8c23f, plotG: 0x8fd3a0, plotRef: 0xd8d2b8,
};

/* ---------------- 场景与后处理接入 ---------------- */

const stage = document.getElementById('stage');
const loader = makeLoader(stage, '正在组装长征二号F…');
const app = createApp({
  container: stage,
  keepBackground: true,
  fov: 45, near: 0.1, far: 6000,
  cameraPos: [46, 24, 96], target: [0, 24, 0],
  minDistance: 2.5, maxDistance: 1600,
});
const vfx = attachVFX(app, 'illus');
const { scene, camera, controls } = app;
scene.environment = makeStudioEnvironment(app.renderer);

/* 光照组：主暖光（低角度戈壁晨光）+ 补光 + 反弹 + 半球环境 */
const hemi = new THREE.HemisphereLight(0xdfeaf5, 0x8a7a5a, 0.85);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff0d8, 2.35);
sun.position.set(-90, 110, 70);
scene.add(sun);
const fill = new THREE.DirectionalLight(0x9fb4cc, 0.3);
fill.position.set(80, 40, -60);
scene.add(fill);
const bounce = new THREE.DirectionalLight(0xe8b98a, 0.22);
bounce.position.set(20, 18, -90);
scene.add(bounce);
const amb = new THREE.AmbientLight(0xffffff, 0.16);
scene.add(amb);

/* 场景注册（懒建，切章互斥可见） */
const scenes = {};
let activeScene = null;
function useScene(key, build) {
  if (activeScene && activeScene !== scenes[key]) activeScene.visible = false;
  if (!scenes[key]) {
    const g = new THREE.Group();
    g.visible = false;
    scene.add(g);
    scenes[key] = g;
  }
  const g = scenes[key];
  if (!g.userData.built) { build(g); g.userData.built = true; }
  g.visible = true;
  activeScene = g;
  return g;
}

/* ---------------- 通用工具（材质 / 几何 / 实例化 / 扫掠） ---------------- */

const _mMemo = new Map();
const M = (color, rough = 0.8, metal = 0) => {
  const key = color + '_' + rough + '_' + metal;
  let m = _mMemo.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal });
    _mMemo.set(key, m);
  }
  return m;
};
/** 烤漆主体（clearcoat 高光走向，漆面 metalness ≤0.12 防反射发黑——工艺标准硬规则） */
const matPaint = (color, o = {}) => matCoat(color, {
  roughness: o.rough ?? 0.34, metalness: o.metal ?? 0.04,
  clearcoat: o.cc ?? 0.9, clearcoatRoughness: o.ccr ?? 0.24,
});
/** 绒面（防热涂层 / 伞衣布感） */
const matFabric = (color, o = {}) => matSheen(color, { roughness: o.rough ?? 0.72, sheen: o.sheen ?? 0.55, sheenColor: o.sheenColor ?? 0xd8ccc0 });
/** 亮面玻璃（去 transmission 版——避免整场景透射 pass，draw call 预算守得住） */
function matGlassLite(color, o = {}) {
  const m = matCoat(color, {
    roughness: o.rough ?? 0.06, metalness: 0,
    clearcoat: 1, clearcoatRoughness: 0.12,
    transparent: true, opacity: o.opacity ?? 0.26,
    side: THREE.DoubleSide, depthWrite: false,
  });
  m.forceSinglePass = true;
  return m;
}
const MAT = {}; // 共享材质缓存（同族部件共用，压 draw call 与实例创建）
function sm(key, make) { if (!MAT[key]) MAT[key] = make(); return MAT[key]; }

const box = (w, h, d, mat) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
const cyl = (rt, rb, h, mat, seg = 20, open = false) =>
  new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg, 1, open), mat);
const cone = (r, h, mat, seg = 14, open = false) =>
  new THREE.Mesh(new THREE.ConeGeometry(r, h, seg, 1, open), mat);
const torus = (r, t, mat, seg = 20, rseg = 8) => new THREE.Mesh(new THREE.TorusGeometry(r, t, rseg, seg), mat);
const sph = (r, mat, w = 16, h = 12) => new THREE.Mesh(new THREE.SphereGeometry(r, w, h), mat);
const lathe = (pts, mat, seg = 28) => new THREE.Mesh(new THREE.LatheGeometry(pts, seg), mat);
const grp = (...children) => { const g = new THREE.Group(); g.add(...children); return g; };
const V2 = (x, y) => new THREE.Vector2(x, y);
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

/** 车削轮廓工具：输入 [半径, 高度] 数组 → Vector2 列表 */
function profile(rows) { return rows.map(([r, y]) => V2(r, y)); }

/** 环向螺栓/铆钉阵列（InstancedMesh，1 个 draw call 一整圈） */
function boltRing(parent, { r, y, n = 24, size = 0.055, hgt = 0.05, mat, axis = 'y' }) {
  if (n < 3) return null;
  const geo = new THREE.CylinderGeometry(size, size, hgt, 6);
  const inst = new THREE.InstancedMesh(geo, mat, n);
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < n; i++) {
    const a = i / n * TAU;
    const p = axis === 'y' ? V3(Math.cos(a) * r, y, Math.sin(a) * r) : V3(y, Math.cos(a) * r, Math.sin(a) * r);
    m4.compose(p, axis === 'y' ? q.identity() : q.setFromUnitVectors(up, V3(1, 0, 0)), V3(1, 1, 1));
    inst.setMatrixAt(i, m4);
  }
  inst.instanceMatrix.needsUpdate = true;
  parent.add(inst);
  return inst;
}

/** 通用实例化盒子（塔架格构 / 栏杆 / 围栏等重复杆件，一面墙一个 draw call） */
function instBoxes(parent, mat, items) {
  const inst = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), mat, items.length);
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  items.forEach((it, i) => {
    q.setFromEuler(e.set(it.rx || 0, it.ry || 0, it.rz || 0));
    m4.compose(V3(it.p[0], it.p[1], it.p[2]), q, V3(it.s[0], it.s[1], it.s[2]));
    inst.setMatrixAt(i, m4);
  });
  inst.instanceMatrix.needsUpdate = true;
  parent.add(inst);
  return inst;
}

/** 通用实例化圆柱（Y 轴向） */
function instCyls(parent, mat, items, seg = 8) {
  const inst = new THREE.InstancedMesh(new THREE.CylinderGeometry(1, 1, 1, seg), mat, items.length);
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  items.forEach((it, i) => {
    q.setFromEuler(e.set(it.rx || 0, it.ry || 0, it.rz || 0));
    m4.compose(V3(it.p[0], it.p[1], it.p[2]), q, V3(it.r, it.h, it.r));
    inst.setMatrixAt(i, m4);
  });
  inst.instanceMatrix.needsUpdate = true;
  parent.add(inst);
  return inst;
}

/**
 * 曲线扫掠（CatmullRomCurve3 放样 + 变宽圆角矩形截面）。
 * 用于电缆罩 / 摆杆臂 / 排水弯管等"沿曲线且截面渐变"的构件。
 * pts: Vector3[] 中心线；wFn/thFn: t∈0..1 → 宽/厚；seg 每段圆角数。
 */
function sweepProfile(pts, wFn, thFn, mat, steps = 40, seg = 3) {
  const curve = new THREE.CatmullRomCurve3(pts);
  const K = seg * 4 + 4;                 // 圆角矩形截面点数（4 直边 + 4 圆角×seg）
  const pos = [];
  const idx = [];
  const nrm = [];
  const T = new THREE.Vector3();
  const up = new THREE.Vector3(1, 0, 0); // 世界 X 为参考上方向（塔架/箭体近垂直场景）
  const right = new THREE.Vector3();
  const R = new THREE.Vector3();
  const U = new THREE.Vector3();
  const c = new THREE.Vector3();
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    curve.getPointAt(t, c);
    curve.getTangentAt(t, T).normalize();
    // up 投影到与切线垂直的平面，退化时换 Z
    U.copy(up).addScaledVector(T, -up.dot(T));
    if (U.lengthSq() < 1e-6) U.set(0, 0, 1).addScaledVector(T, -T.z);
    U.normalize();
    R.crossVectors(T, U).normalize();
    const w = wFn(t), th = thFn(t);
    for (let k = 0; k < K; k++) {
      // 圆角矩形参数化：先走四条直边中点，再补圆角（简化为八角圆角）
      const a = k / K * TAU;
      const rx = Math.cos(a), ry = Math.sin(a);
      const superX = Math.sign(rx) * Math.pow(Math.abs(rx), 0.55);
      const superY = Math.sign(ry) * Math.pow(Math.abs(ry), 0.55);
      pos.push(
        c.x + (R.x * superX * w * 0.5 + U.x * superY * th * 0.5),
        c.y + (R.y * superX * w * 0.5 + U.y * superY * th * 0.5),
        c.z + (R.z * superX * w * 0.5 + U.z * superY * th * 0.5),
      );
      nrm.push(R.x * rx + U.x * ry, R.y * rx + U.y * ry, R.z * rx + U.z * ry);
    }
  }
  for (let i = 0; i < steps; i++) {
    for (let k = 0; k < K; k++) {
      const a = i * K + k;
      const b = i * K + (k + 1) % K;
      const cc = (i + 1) * K + k;
      const d = (i + 1) * K + (k + 1) % K;
      idx.push(a, cc, b, b, cc, d);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
  geo.setIndex(idx);
  const mesh = new THREE.Mesh(geo, mat);
  return mesh;
}

/** 沿曲线的圆管（CatmullRom + TubeGeometry，摆杆/管线用） */
function tubeAlong(pts, radius, mat, tubularSeg = 32, radialSeg = 8, closed = false) {
  const curve = new THREE.CatmullRomCurve3(pts, closed);
  return new THREE.Mesh(new THREE.TubeGeometry(curve, tubularSeg, radius, radialSeg, closed), mat);
}

/** 接触阴影（径向衰减黑晕贴地片，道具落地感命根） */
let shadowTex = null;
function makeShadowTexture() {
  const S = 256;
  const cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const ctx = cv.getContext('2d');
  const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, 'rgba(8,10,14,0.5)');
  g.addColorStop(0.55, 'rgba(8,10,14,0.24)');
  g.addColorStop(1, 'rgba(8,10,14,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
const _shadowMatCache = new Map();
function contactShadow(w, d, opacity = 0.9) {
  if (!shadowTex) shadowTex = makeShadowTexture();
  const key = Math.round(opacity * 10);
  let mat = _shadowMatCache.get(key);
  if (!mat) {
    mat = new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, opacity: key / 10 });
    _shadowMatCache.set(key, mat);
  }
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat);
  m.rotation.x = -Math.PI / 2;
  return m;
}

/** 辉光精灵（火焰芯 / 航空灯 / 路灯的光晕片） */
function glowSprite(size, color, opacity = 0.85) {
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeGlowTexture(color), transparent: true, opacity,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  sp.scale.setScalar(size);
  return sp;
}

function lbl(text, color = COL.label, scale = 0.05) {
  return makeTextSprite(text, { fontSize: 30, color, scale, bg: 'rgba(12,18,26,0.62)' });
}

/* ---------------- 程序化纹理工厂（全部 CanvasTexture 矢量绘制） ---------------- */

const texCache = {};
function ctex(key, make) { if (!texCache[key]) texCache[key] = make(); return texCache[key]; }

function starPath(ctx, cx, cy, r, rot = -Math.PI / 2) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 ? r * 0.42 : r;
    const a = rot + i * Math.PI / 5;
    const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
}

/** 五星红旗（大星 + 四小星回环排列，旗面 3:2） */
function texFlagCN() {
  return ctex('flag', () => {
    const w = 300, h = 200;
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = '#de2910';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#ffde00';
    starPath(ctx, w * 0.18, h * 0.26, w * 0.1);
    // 四颗小星各有一角指向大星中心
    const pts = [[0.34, 0.12], [0.42, 0.26], [0.42, 0.42], [0.34, 0.54]];
    pts.forEach(([px, py], i) => {
      const dx = w * 0.18 - w * px, dy = h * 0.26 - h * py;
      starPath(ctx, w * px, h * py, w * 0.036, Math.atan2(dy, dx) + Math.PI / 2);
    });
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  });
}

/** 中国航天圆形徽标（蓝底金环 + 星点 + 主副标题，通用纪念章风格） */
function texEmblem() {
  return ctex('emblem', () => {
    const S = 256;
    const cv = document.createElement('canvas');
    cv.width = cv.height = S;
    const ctx = cv.getContext('2d');
    const c = S / 2;
    ctx.beginPath(); ctx.arc(c, c, c - 4, 0, TAU);
    ctx.fillStyle = '#15376e'; ctx.fill();
    ctx.lineWidth = 7; ctx.strokeStyle = '#c9a44a'; ctx.stroke();
    ctx.beginPath(); ctx.arc(c, c, c - 18, 0, TAU);
    ctx.lineWidth = 2.5; ctx.strokeStyle = 'rgba(201,164,74,0.75)'; ctx.stroke();
    // 轨道弧线 + 星点
    ctx.save();
    ctx.translate(c, c);
    ctx.rotate(-0.5);
    ctx.beginPath(); ctx.ellipse(0, 0, c - 34, c * 0.32, 0, 0, TAU);
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(143,211,255,0.85)'; ctx.stroke();
    const rnd = mulberry(7);
    for (let i = 0; i < 26; i++) {
      const a = rnd() * TAU, r = 18 + rnd() * (c - 44);
      ctx.fillStyle = `rgba(255,255,255,${0.3 + rnd() * 0.6})`;
      ctx.fillRect(Math.cos(a) * r, Math.sin(a) * r, 1.6, 1.6);
    }
    // 小火箭剪影（三角头 + 矩形身 + 尾焰）
    ctx.fillStyle = '#f2f4f6';
    ctx.beginPath();
    ctx.moveTo(0, -c + 44); ctx.lineTo(9, -c + 66); ctx.lineTo(-9, -c + 66); ctx.closePath(); ctx.fill();
    ctx.fillRect(-5, -c + 66, 10, 30);
    ctx.fillStyle = '#ffa54d';
    ctx.beginPath();
    ctx.moveTo(-4, -c + 96); ctx.lineTo(4, -c + 96); ctx.lineTo(0, -c + 112); ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#f2efe6';
    ctx.font = '700 34px "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('中国航天', c, c + 58);
    ctx.font = '600 14px sans-serif';
    ctx.fillStyle = '#c9a44a';
    ctx.fillText('CZ-2F · SHENZHOU', c, c + 84);
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  });
}

/** 透明底竖排/横排标语条（箭体白壳上的深蓝字） */
function texTextStrip(text, { w = 512, h = 128, font = 700, size = 64, color = '#1e4f9c', vertical = false, family = '"PingFang SC", sans-serif' } = {}) {
  return ctex('strip:' + text + w + h + color + vertical, () => {
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = color;
    ctx.font = `${font} ${size}px ${family}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (vertical) {
      const chars = [...text];
      const step = h / (chars.length + 0.6);
      chars.forEach((ch, i) => ctx.fillText(ch, w / 2, h / 2 - (chars.length - 1) * step / 2 + i * step));
    } else {
      ctx.fillText(text, w / 2, h / 2);
    }
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  });
}

/** 神舟任务铭牌（船体侧面白字） */
function texShenzhouMark(no = '') {
  return ctex('szmark:' + no, () => {
    const w = 320, h = 140;
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    const ctx = cv.getContext('2d');
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f2f4f6';
    ctx.font = '700 58px "PingFang SC", sans-serif';
    ctx.fillText('神舟', w / 2, 62);
    ctx.font = '700 30px sans-serif';
    ctx.fillStyle = '#ffde00';
    ctx.fillText(no || 'SHENZHOU', w / 2, 108);
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  });
}

/** 太阳能帆板（深蓝电池片网格 + 银色汇流条 + 微 shade 抖动） */
function texSolarCells() {
  return ctex('solar', () => {
    const w = 128, h = 256;
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    const ctx = cv.getContext('2d');
    const rnd = mulberry(31);
    ctx.fillStyle = '#12356e';
    ctx.fillRect(0, 0, w, h);
    const cols = 4, rows = 10;
    const cw = w / cols, ch = h / rows;
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const l = 0.86 + rnd() * 0.22;
        ctx.fillStyle = `rgb(${Math.round(18 * l)},${Math.round(64 * l)},${Math.round(132 * l)})`;
        ctx.fillRect(i * cw + 1.5, j * ch + 1.5, cw - 3, ch - 3);
        // 对角切角（空间帆板电池片的经典造型）
        ctx.strokeStyle = 'rgba(210,225,245,0.14)';
        ctx.lineWidth = 1;
        const x0 = i * cw + 1.5, y0 = j * ch + 1.5;
        ctx.beginPath();
        ctx.moveTo(x0 + 4, y0); ctx.lineTo(x0 + cw - 3, y0);
        ctx.lineTo(x0 + cw - 3, y0 + ch - 3); ctx.lineTo(x0 + 4, y0 + ch - 3);
        ctx.lineTo(x0 + 4, y0 + 4); ctx.closePath();
        ctx.stroke();
      }
    }
    // 汇流条
    ctx.fillStyle = '#c7ccd2';
    ctx.fillRect(w * 0.5 - 1.6, 0, 3.2, h);
    ctx.fillRect(0, h * 0.5 - 1.2, w, 2.4);
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  });
}

/** 塔架平台金属板（铆钉排 + 沥水长孔 + 边角警示条） */
function texPanel() {
  return ctex('panel', () => {
    const S = 256;
    const cv = document.createElement('canvas');
    cv.width = cv.height = S;
    const ctx = cv.getContext('2d');
    const rnd = mulberry(83);
    ctx.fillStyle = '#727d88';
    ctx.fillRect(0, 0, S, S);
    // 板面微噪声
    for (let i = 0; i < 900; i++) {
      ctx.fillStyle = `rgba(${rnd() > 0.5 ? '255,255,255' : '20,26,32'},${rnd() * 0.05})`;
      ctx.fillRect(rnd() * S, rnd() * S, 2 + rnd() * 3, 1 + rnd() * 2);
    }
    // 铆钉两圈
    ctx.fillStyle = 'rgba(30,36,42,0.6)';
    for (let i = 0; i < 14; i++) {
      ctx.beginPath(); ctx.arc(12 + i * (S - 24) / 13, 10, 2.6, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.arc(12 + i * (S - 24) / 13, S - 10, 2.6, 0, TAU); ctx.fill();
    }
    // 沥水长孔
    ctx.fillStyle = 'rgba(16,20,26,0.72)';
    for (let i = 0; i < 5; i++) ctx.fillRect(40 + i * 36, S * 0.42, 18, 7);
    // 边角警示斜纹
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, 64, 14); ctx.clip();
    for (let i = -4; i < 8; i++) {
      ctx.fillStyle = i % 2 ? '#e8c23f' : '#1c1e22';
      ctx.save();
      ctx.translate(i * 16, 0);
      ctx.rotate(0.6);
      ctx.fillRect(0, -10, 8, 40);
      ctx.restore();
    }
    ctx.restore();
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  });
}

/** 黄黑警示斜纹（导流槽口 / 平台边缘 / 罐体） */
function texWarn() {
  return ctex('warn', () => {
    const S = 128;
    const cv = document.createElement('canvas');
    cv.width = cv.height = S;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = '#e8c23f';
    ctx.fillRect(0, 0, S, S);
    ctx.fillStyle = '#1c1e22';
    for (let i = -4; i < 10; i++) {
      ctx.save();
      ctx.translate(i * 24, 0);
      ctx.rotate(-0.6);
      ctx.fillRect(0, -60, 12, 240);
      ctx.restore();
    }
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
  });
}

/** 工位编号盘（深盘白字，发射平台正面） */
function texPadNum(txt = '2') {
  return ctex('padnum:' + txt, () => {
    const S = 256;
    const cv = document.createElement('canvas');
    cv.width = cv.height = S;
    const ctx = cv.getContext('2d');
    ctx.beginPath(); ctx.arc(S / 2, S / 2, S / 2 - 6, 0, TAU);
    ctx.fillStyle = '#20303e'; ctx.fill();
    ctx.lineWidth = 10; ctx.strokeStyle = '#c7ccd2'; ctx.stroke();
    ctx.fillStyle = '#f2f4f6';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = '700 128px sans-serif';
    ctx.fillText(txt, S / 2, S / 2 + 6);
    ctx.font = '600 22px sans-serif';
    ctx.fillStyle = '#8fd3ff';
    ctx.fillText('JIUQUAN · SL', S / 2, S / 2 + 74);
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  });
}

/** 降落伞伞衣（红白伞肋分瓣 + 每瓣弧面明暗 + 径向高光） */
function texChute() {
  return ctex('chute', () => {
    const w = 1024, h = 512;
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    const ctx = cv.getContext('2d');
    const gores = 16;
    const gw = w / gores;
    for (let i = 0; i < gores; i++) {
      const g = ctx.createLinearGradient(i * gw, 0, (i + 1) * gw, 0);
      if (i % 2 === 0) {
        g.addColorStop(0, '#a03426'); g.addColorStop(0.5, '#d4482f'); g.addColorStop(1, '#a03426');
      } else {
        g.addColorStop(0, '#c8c4b8'); g.addColorStop(0.5, '#e8e4da'); g.addColorStop(1, '#c8c4b8');
      }
      ctx.fillStyle = g;
      ctx.fillRect(i * gw, 0, gw, h);
      // 伞肋缝线
      ctx.fillStyle = 'rgba(30,26,22,0.5)';
      ctx.fillRect(i * gw - 1, 0, 2, h);
      // 径向张力纹
      ctx.strokeStyle = 'rgba(60,30,24,0.16)';
      ctx.lineWidth = 1;
      for (let j = 1; j < 6; j++) {
        ctx.beginPath();
        ctx.moveTo(i * gw + gw * 0.5, h * j / 6);
        ctx.lineTo(i * gw + gw * 0.5 + Math.sin(j * 2.2 + i) * gw * 0.24, h * j / 6 + 10);
        ctx.stroke();
      }
    }
    // 顶孔加深
    const rg = ctx.createRadialGradient(w / 2, 0, 0, w / 2, 0, h * 0.7);
    rg.addColorStop(0, 'rgba(40,20,16,0.5)');
    rg.addColorStop(1, 'rgba(40,20,16,0)');
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, w, h * 0.7);
    // 底缘伞绳白带
    ctx.fillStyle = 'rgba(232,228,218,0.9)';
    ctx.fillRect(0, h - 16, w, 16);
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  });
}

/** 烧蚀防热大底（碳化焦壳 + 龟裂 + 边缘余温橙辉） */
function texAblation() {
  return ctex('ablation', () => {
    const S = 256;
    const cv = document.createElement('canvas');
    cv.width = cv.height = S;
    const ctx = cv.getContext('2d');
    const rnd = mulberry(97);
    ctx.fillStyle = '#33291f';
    ctx.fillRect(0, 0, S, S);
    // 碳化斑块
    for (let i = 0; i < 260; i++) {
      const r = 2 + rnd() * 9;
      ctx.fillStyle = `rgba(${18 + rnd() * 26},${14 + rnd() * 18},${10 + rnd() * 12},${0.5 + rnd() * 0.4})`;
      ctx.beginPath();
      ctx.arc(rnd() * S, rnd() * S, r, 0, TAU);
      ctx.fill();
    }
    // 龟裂纹（折线随机游走）
    ctx.strokeStyle = 'rgba(12,8,6,0.8)';
    for (let i = 0; i < 22; i++) {
      ctx.lineWidth = 0.8 + rnd() * 1.6;
      ctx.beginPath();
      let x = rnd() * S, y = rnd() * S;
      ctx.moveTo(x, y);
      for (let k = 0; k < 6; k++) {
        x += (rnd() - 0.5) * 46; y += (rnd() - 0.5) * 46;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    // 边缘余温
    const g = ctx.createRadialGradient(S / 2, S / 2, S * 0.28, S / 2, S / 2, S / 2);
    g.addColorStop(0, 'rgba(168,68,30,0)');
    g.addColorStop(1, 'rgba(232,120,50,0.5)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, S, S);
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  });
}

/** 地面遥测终端屏（绿字单色遥测行 + 表头 + 状态块，勤务楼顶 / 测控车屏） */
function texConsoleScreen(label = 'TEL-01') {
  return ctex('screen:' + label, () => {
    const w = 256, h = 160;
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    const ctx = cv.getContext('2d');
    const rnd = mulberry(label.length * 13 + 5);
    ctx.fillStyle = '#08131c';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#0d2030';
    ctx.fillRect(0, 0, w, 20);
    ctx.fillStyle = '#3fa96f';
    ctx.font = '700 11px monospace';
    ctx.fillText(label, 8, 14);
    ctx.fillText('LINK OK', w - 56, 14);
    ctx.font = '10px monospace';
    const keys = ['ALT', 'VEL', 'PITCH', 'Q-BAR', 'MASS', 'STG', 'EVENT', 'T-CLOCK'];
    for (let i = 0; i < keys.length; i++) {
      const y = 34 + i * 15;
      ctx.fillStyle = '#2a6a4a';
      ctx.fillText(keys[i].padEnd(7, ' '), 8, y);
      const num = (rnd() * (i < 4 ? 900 : 100)).toFixed(i < 4 ? 1 : 0);
      ctx.fillStyle = '#4fc98a';
      ctx.fillText(num, 96, y);
      ctx.fillStyle = `rgba(80,200,140,${0.25 + rnd() * 0.5})`;
      ctx.fillRect(w - 40, y - 8, 30 * rnd(), 3);
    }
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  });
}

/** 整流罩蓝色带（白字标语 + 星点，环绕贴图） */
function texFairingBand() {
  return ctex('fband', () => {
    const w = 1024, h = 128;
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = '#1e4f9c';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(0, 0, w, 10);
    ctx.fillRect(0, h - 10, w, 10);
    ctx.fillStyle = '#f2f4f6';
    ctx.font = '700 52px "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const msg = '中国航天 · 铸国之重器';
    ctx.fillText(msg, w / 2, h / 2);
    // 星点装饰
    const rnd = mulberry(19);
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = `rgba(255,222,0,${0.4 + rnd() * 0.5})`;
      const x = rnd() * w, y = 12 + rnd() * (h - 24);
      if (Math.abs(y - h / 2) > 34 || Math.abs(x - w / 2) > w * 0.34) {
        ctx.fillRect(x, y, 2, 2);
      }
    }
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.anisotropy = 4;
    return tex;
  });
}
/* ---------------- 静态合批：bakeGroup（同材质几何烘焙为单 mesh） ----------------
 * draw call 预算（<200）的关键工具：把一组静态子 mesh 按材质分桶合并成
 * 每个 material 一个 mesh。动态件（摆杆/旗帜/火焰）标记 noBake 跳过。
 * 合并保留 position/normal/uv；索引与非索引几何统一转非索引后拼接。 */

const _bakeRootInv = new THREE.Matrix4();
const _bakeWorld = new THREE.Matrix4();
const _bakeLocal = new THREE.Matrix4();

function bakeGroup(root, { skipInstanced = true } = {}) {
  root.updateMatrixWorld(true);
  _bakeRootInv.copy(root.matrixWorld).invert();
  const buckets = new Map();          // material.uuid -> {mat, pos:[], nrm:[], uv:[]}
  const victims = [];
  root.traverse((o) => {
    if (!o.isMesh || o.userData.noBake) return;
    if (skipInstanced && o.isInstancedMesh) return;
    const mat = Array.isArray(o.material) ? o.material[0] : o.material;
    if (!mat) return;
    _bakeWorld.copy(o.matrixWorld).premultiply(_bakeRootInv);
    let b = buckets.get(mat.uuid);
    if (!b) { b = { mat, pos: [], nrm: [], uv: [] }; buckets.set(mat.uuid, b); }
    const geo = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry;
    const p = geo.attributes.position, n = geo.attributes.normal, u = geo.attributes.uv;
    const v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i).applyMatrix4(_bakeWorld);
      b.pos.push(v.x, v.y, v.z);
      v.fromBufferAttribute(n, i).transformDirection(_bakeWorld);
      b.nrm.push(v.x, v.y, v.z);
      if (u) b.uv.push(u.getX(i), u.getY(i));
      else b.uv.push(0, 0);
    }
    victims.push(o);
  });
  if (!buckets.size) return;
  const baked = [];
  buckets.forEach((b) => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(b.pos, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(b.nrm, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(b.uv, 2));
    const mesh = new THREE.Mesh(geo, b.mat);
    mesh.matrixAutoUpdate = false;
    baked.push(mesh);
  });
  victims.forEach((o) => o.parent && o.parent.remove(o));
  baked.forEach((m) => root.add(m));
  return baked.length;
}

/** 把 root 直挂的散装 mesh 收进一个烘焙组（跳过 noBake 与实例化网格） */
function sweepLoose(root) {
  const det = new THREE.Group();
  det.userData.bake = true;
  [...root.children].forEach((c) => {
    if (c.isMesh && !c.isInstancedMesh && !c.userData.noBake) det.add(c);
  });
  if (det.children.length) root.add(det);
}

/** 便捷：对场景里所有标记 userData.bake 的组执行烘焙 */
function bakeAll(sceneRoot) {
  let n = 0;
  sceneRoot.traverse((o) => {
    if (o.userData && o.userData.bake && !o.userData.baked) {
      n += bakeGroup(o) || 0;
      o.userData.baked = true;
    }
  });
  return n;
}
/* ---------------- 物理常量与大气模型 ---------------- */

const MU = 3.986e14;          // 地球引力常数 μ (m³/s²)
const R_E = 6.371e6;          // 地球半径 (m)
const G0 = 9.81;              // 海平面重力加速度 (m/s²)
const gAt = (h) => MU / Math.pow(R_E + h, 2);
const vCirc = (h) => Math.sqrt(MU / (R_E + h));
const vEsc = (h) => Math.sqrt(2 * MU / (R_E + h));
/** 圆轨道周期（秒） */
const orbitPeriod = (h) => TAU * Math.sqrt(Math.pow(R_E + h, 3) / MU);

/**
 * US Standard Atmosphere 1976 简化分层（教学版）：
 * [底高 m, 底温 K, 温度梯度 K/m, 底压 Pa]，0-86 km 分七层，层内等梯度 + 静压积分。
 * 数据为标准大气公开常数表；25 km 以上改用指数接续（教学近似，密度误差 < 3%）。
 */
const ATM_LAYERS = [
  [0, 288.15, -0.0065, 101325],
  [11000, 216.65, 0, 22632],
  [20000, 216.65, 0.0010, 5474.9],
  [32000, 228.65, 0.0028, 868.02],
  [47000, 270.65, 0, 110.91],
  [51000, 270.65, -0.0028, 66.939],
  [71000, 214.65, -0.0020, 3.9564],
];
const Rd = 287.053;
function atmState(h) {
  h = Math.max(0, Math.min(h, 86000));
  let li = 0;
  for (let i = ATM_LAYERS.length - 1; i >= 0; i--) { if (h >= ATM_LAYERS[i][0]) { li = i; break; } }
  const [h0, T0, L, p0] = ATM_LAYERS[li];
  const T = T0 + L * (h - h0);
  let p;
  if (Math.abs(L) < 1e-9) p = p0 * Math.exp(-gAt(h0) * (h - h0) / (Rd * T0));
  else p = p0 * Math.pow(T / T0, -gAt(h0) / (Rd * L));
  const rho = p / (Rd * T);
  return { T, p, rho };
}
const rhoAt = (h) => atmState(h).rho;
/** 声速（理想气体，γ=1.4），用于马赫数 */
const aSound = (h) => Math.sqrt(1.4 * 287.053 * atmState(h).T);
/** 齐奥尔科夫斯基：Δv = ve·ln(m0/mf)，ve = isp·G0 */
const tsiolkovsky = (isp, m0, mf) => isp * G0 * Math.log(m0 / mf);

/* ---------------- CZ-2F 分级与任务配置（教学标定，公开参数量级） ---------------- */

const CFG = { payload: 8.4, isp2: 300, thrustPct: 100, targetAlt: 350 };
const M2 = {
  boostProp: 156e3, boostDry: 14e3, boostT: 2931e3,   // 助推器：~140 s 烧尽
  s1Prop: 176e3, s1Dry: 12.5e3, coreT: 2992e3,        // 一级：~157 s 耗尽（MECO）
  s2Prop: 128e3, s2Dry: 7e3,                          // 二级：真空发动机
  tower: 3e3, fair: 2.0e3,
};
function m0() {
  return CFG.payload * 1e3 + M2.fair + M2.tower + M2.s2Dry + M2.s1Dry + M2.boostDry
    + M2.s1Prop + M2.boostProp + M2.s2Prop;
}
/** 当前时刻推力/比冲档位（推进剂池烧穿即熄火） */
function thrustProfile(t) {
  if (ST.phase !== 'run' && ST.phase !== 'pause' && ST.phase !== 'replay') return { T: 0, isp: 268, k: 'none' };
  const pct = CFG.thrustPct / 100;
  if (t < 140 && ST.bb < M2.boostProp - 1 && ST.bc < M2.s1Prop - 1) {
    return { T: 5923e3 * pct, isp: 275, k: 'both', bf: M2.boostT / (M2.boostT + M2.coreT) };
  }
  if (!ST.fired.s1 && t < 470 && ST.bc < M2.s1Prop - 1) return { T: 2600e3 * pct, isp: 275, k: 'core' };
  if (ST.fired.s1 && ST.s2burn < M2.s2Prop - 500 && t < 650) return { T: 950e3, isp: CFG.isp2, k: 's2' };
  return { T: 0, isp: 300, k: 'none' };
}
/** 程序转弯角指令（弹道倾角 → 重力转弯） */
function gammaCmd(t) {
  const pts = [[0, 84], [10, 74], [25, 58], [50, 44], [90, 34], [140, 24], [157, 20], [200, 10], [260, 6], [330, 4], [520, 3.2]];
  for (let i = 0; i < pts.length - 1; i++) {
    if (t <= pts[i + 1][0]) {
      const k = (t - pts[i][0]) / (pts[i + 1][0] - pts[i][0]);
      return lerp(pts[i][1], pts[i + 1][1], clamp(k, 0, 1)) * DEG;
    }
  }
  return 2.5 * DEG;
}

/** 分离时序（逃逸塔 → 助推器 → 一二级热分离 → 整流罩） */
const EVENTS = [
  { t: 120, key: 'tower', name: '逃逸塔分离' },
  { t: 139, key: 'boosters', name: '助推器分离' },
  { t: 157, key: 's1', name: '一二级分离 · 二级点火' },
  { t: 200, key: 'fair', name: '整流罩分离（h≥110 km）' },
  { t: 585, key: 'seco', name: '二级关机 · 船箭分离入轨' },
];

/* ---------------- 标称弹道表（神舟载人任务量级：驱动「真实任务对比」与任务回放） ----------------
 * 列：[t s, 高度 m, 速度 m/s, 轴向过载 g, 动压 kPa, 射程 km, 箭上质量 t, 事件]
 * 为 CZ-2F 公开弹道特征（Max-Q ≈ 70 s / 11 km、助推 139 s、MECO 157 s、整流罩 200 s /
 * 585 s 入轨 350 km）的教学重建，量级与公开资料一致。 */

const NOMINAL = [
  [0,      0,     0,   1.22, 0.0,  0.0, 480, '点火 · 起飞'],
  [8,      150,   38,  1.28, 0.6,  0.1, 476, ''],
  [15,     500,   75,  1.35, 2.6,  0.3, 468, '程序转弯开始'],
  [22,     1300,  120, 1.44, 7.2,  0.8, 458, ''],
  [30,     2600,  185, 1.52, 14.5, 1.6, 445, '跨声速（Ma≈0.8）'],
  [38,     4600,  255, 1.60, 22.5, 2.8, 432, ''],
  [46,     7200,  320, 1.66, 27.8, 4.3, 420, ''],
  [54,     10300, 385, 1.72, 30.6, 6.2, 408, ''],
  [62,     13800, 448, 1.76, 30.2, 8.5, 396, ''],
  [70,     17800, 512, 1.80, 27.4, 11.0, 384, 'Max-Q ≈ 31 kPa（动压峰值）'],
  [80,     24200, 608, 1.86, 22.0, 15.5, 367, ''],
  [90,     31200, 712, 1.92, 16.8, 20.6, 351, ''],
  [100,    39200, 828, 1.97, 12.4, 26.4, 336, ''],
  [110,    48000, 955, 2.02, 8.9,  32.9, 322, ''],
  [120,    57800, 1100, 2.06, 6.1, 40.1, 308, '逃逸塔分离（最危险时段已过）'],
  [130,    68500, 1275, 2.09, 4.2, 48.2, 303, ''],
  [139,    79700, 1470, 2.12, 3.0, 57.1, 292, '助推器分离'],
  [150,    93000, 1720, 2.28, 1.9, 67.6, 268, ''],
  [157,    103500, 1930, 2.31, 1.4, 74.3, 258, '一级关机（MECO）· 一二级热分离 · 二级点火'],
  [170,    121000, 2260, 1.42, 0.9, 85.6, 250, ''],
  [185,    143000, 2650, 1.36, 0.6, 100.9, 244, ''],
  [200,    168000, 3060, 1.32, 0.35, 118.4, 242, '整流罩分离（高度 110 km 以上）'],
  [220,    200000, 3560, 1.27, 0.1, 137.4, 240, ''],
  [250,    248000, 4210, 1.22, 0, 166.6, 237, ''],
  [300,    318000, 5160, 1.18, 0, 215.0, 234, ''],
  [360,    375000, 5980, 1.15, 0, 272.9, 231, ''],
  [420,    415000, 6520, 1.13, 0, 333.2, 229, ''],
  [480,    440000, 6920, 1.11, 0, 395.0, 228, ''],
  [540,    455000, 7230, 1.10, 0, 457.0, 227, ''],
  [570,    462000, 7380, 1.09, 0, 492.4, 226, ''],
  [585,    466000, 7450, 1.08, 0, 513.1, 226, '二级关机 · 船箭分离 · 神舟入轨（≈350 km）'],
  [600,    468000, 7450, 0, 0, 527.0, 8.4, '太阳翼展开 · 帆板供电'],
];
/** 按时间线性插值一行（返回 {t,h,v,a,q,x,m,note}） */
function nominalAt(t) {
  const rows = NOMINAL;
  if (t <= rows[0][0]) return rowObj(rows[0]);
  if (t >= rows[rows.length - 1][0]) return rowObj(rows[rows.length - 1]);
  let i = 0;
  while (i < rows.length - 2 && rows[i + 1][0] <= t) i++;
  const A = rows[i], B = rows[i + 1];
  const k = (t - A[0]) / (B[0] - A[0]);
  const o = rowObj(A);
  for (let c = 1; c <= 6; c++) o[HCOL[c]] = lerp(A[c], B[c], k);
  o.note = A[7] && A[7] !== '' ? A[7] : '';
  return o;
  function rowObj(r) { return { t: r[0], h: r[1], v: r[2], a: r[3], q: r[4], x: r[5], m: r[6], note: r[7] }; }
}
const HCOL = { 1: 'h', 2: 'v', 3: 'a', 4: 'q', 5: 'x', 6: 'm' };

/* ---------------- 神舟任务档案（公开资料整理，截至 2025-11） ----------------
 * 字段：no 任务 / date 发射 / crew 乘组（空 = 无人）/ days 在轨 / orbit 轨道 / note 里程碑 */

const MISSIONS = [
  { no: 'SZ-1', date: '1999-11-20', crew: [], days: 0.9, orbit: '陆海空联合搜救演练', note: '首飞无人试验船，考核运载火箭与飞船系统工程', dock: '' },
  { no: 'SZ-2', date: '2001-01-10', crew: [], days: 6.8, orbit: '', note: '第一艘正样无人飞船，搭载模拟人体与生命保障载荷', dock: '' },
  { no: 'SZ-3', date: '2002-03-25', crew: [], days: 6.6, orbit: '', note: '首次搭载模拟航天员，验证逃逸与应急救生功能', dock: '' },
  { no: 'SZ-4', date: '2002-12-30', crew: [], days: 6.8, orbit: '', note: '载人前的最后一战，寒冬发射创造低温纪录', dock: '' },
  { no: 'SZ-5', date: '2003-10-15', crew: ['杨利伟'], days: 0.9, orbit: '', note: '中国首次载人航天飞行，21 小时 23 分钟绕地 14 圈', dock: '' },
  { no: 'SZ-6', date: '2005-10-12', crew: ['费俊龙', '聂海胜'], days: 4.8, orbit: '', note: '首次多人多天飞行，开展穿舱与科学实验', dock: '' },
  { no: 'SZ-7', date: '2008-09-25', crew: ['翟志刚', '刘伯明', '景海鹏'], days: 2.8, orbit: '', note: '翟志刚实现中国人首次太空行走', dock: '' },
  { no: 'SZ-8', date: '2011-11-01', crew: [], days: 8.3, orbit: '目标飞行器', note: '无人状态首次与天宫一号空间交会对接', dock: '天宫一号' },
  { no: 'SZ-9', date: '2012-06-16', crew: ['景海鹏', '刘旺', '刘洋'], days: 13, orbit: '', note: '首次手动对接，刘洋为中国首位女航天员', dock: '天宫一号' },
  { no: 'SZ-10', date: '2013-06-11', crew: ['聂海胜', '张晓光', '王亚平'], days: 15, orbit: '', note: '王亚平开展中国首次太空授课', dock: '天宫一号' },
  { no: 'SZ-11', date: '2016-10-17', crew: ['景海鹏', '陈冬'], days: 33, orbit: '', note: '当时在轨时间最长载人任务（33 天）', dock: '天宫二号' },
  { no: 'SZ-12', date: '2021-06-17', crew: ['聂海胜', '刘伯明', '汤洪波'], days: 92, orbit: '', note: '首批入驻天和核心舱，中国空间站建设开启', dock: '天和核心舱' },
  { no: 'SZ-13', date: '2021-10-16', crew: ['翟志刚', '王亚平', '叶光富'], days: 183, orbit: '', note: '首次长期驻留（183 天），女航天员首次出舱', dock: '天和核心舱' },
  { no: 'SZ-14', date: '2022-06-05', crew: ['陈冬', '刘洋', '蔡旭哲'], days: 183, orbit: '', note: '首次在轨迎来问天、梦天实验舱对接构成 T 字构型', dock: '天宫空间站' },
  { no: 'SZ-15', date: '2022-11-29', crew: ['费俊龙', '邓清明', '张陆'], days: 186, orbit: '', note: '首次在轨乘组轮换（与 SZ-14 乘组太空会师）', dock: '天宫空间站' },
  { no: 'SZ-16', date: '2023-05-30', crew: ['景海鹏', '朱杨柱', '桂海潮'], days: 154, orbit: '', note: '桂海潮为中国首位载荷专家（戴眼镜上太空）', dock: '天宫空间站' },
  { no: 'SZ-17', date: '2023-10-26', crew: ['汤洪波', '唐胜杰', '江新林'], days: 187, orbit: '', note: '汤洪波成为间隔最短重返太空的航天员', dock: '天宫空间站' },
  { no: 'SZ-18', date: '2024-04-25', crew: ['叶光富', '李聪', '李广苏'], days: 182, orbit: '', note: '叶光富两度驻留，累计在轨超一年', dock: '天宫空间站' },
  { no: 'SZ-19', date: '2024-10-30', crew: ['蔡旭哲', '宋令东', '王浩泽'], days: 192, orbit: '', note: '宋令东、王浩泽为首批 90 后航天员，王浩泽为首位女飞行工程师', dock: '天宫空间站' },
  { no: 'SZ-20', date: '2025-04-24', crew: ['陈冬', '陈中瑞', '王杰'], days: 183, orbit: '', note: '第十次载人发射，航天日主题日升空', dock: '天宫空间站' },
  { no: 'SZ-21', date: '2025-10-31', crew: ['张陆', '武飞', '张洪章'], days: 183, orbit: '', note: '武飞为最年轻航天飞行工程师，张洪章为载荷专家', dock: '天宫空间站' },
];

/* ---------------- 视觉映射（高度→纵坐标 / 天色因子） ---------------- */

const skyCol = new THREE.Color(COL.dawn);
const spaceCol = new THREE.Color(COL.space);
const dustCol = new THREE.Color(COL.dustDawn);
const curBg = new THREE.Color();
const stars = makeStars(900, 2200);
stars.material.opacity = 0;
scene.add(stars);

/** 高度(m) → 场景纵坐标（对数压缩，保证全程可见） */
const visH = (h) => 14 * Math.pow(Math.max(h, 0) / 1000, 0.55);
/** 0(地面)→1(太空) 天色因子 */
const skyK = (h) => clamp(visH(h) / 110, 0, 1);

/* ---------------- 分离碎片容器 ---------------- */

const debrisG = new THREE.Group();
scene.add(debrisG);

/* ---------------- 上升段状态机（真实参数积分） ---------------- */

const ST = {
  phase: 'idle', t: 0, speed: 6, h: 0, x: 0, v: 0, gam: 84 * DEG,
  maxQ: 0, maxQh: 0, maxG: 0, orbit: null, done: false,
  jett: [], fired: {}, s2burn: 0, bb: 0, bc: 0,
  countdown: -1, showForces: false, spin: 0,
};
function currentMass() {
  let m = CFG.payload * 1e3 + M2.s2Dry + Math.max(M2.s2Prop - ST.s2burn, 0);
  if (!ST.fired.fair) m += M2.fair;
  if (!ST.fired.tower) m += M2.tower;
  if (!ST.fired.boosters) m += M2.boostDry + Math.max(M2.boostProp - ST.bb, 0);
  if (!ST.fired.s1) m += M2.s1Dry + Math.max(M2.s1Prop - ST.bc, 0);
  return m;
}
function resetFlight() {
  ST.phase = 'idle'; ST.t = 0; ST.h = 0; ST.x = 0; ST.v = 0;
  ST.gam = 84 * DEG; ST.maxQ = 0; ST.maxQh = 0; ST.maxG = 0;
  ST.orbit = null; ST.done = false; ST.s2burn = 0; ST.bb = 0; ST.bc = 0;
  ST.fired = {}; ST.countdown = -1;
  ST.jett.forEach((j) => {
    debrisG.remove(j.mesh);
    RKT.g.add(j.mesh);
    const home = j.mesh.userData.home;
    j.mesh.position.copy(home.pos);
    j.mesh.rotation.set(0, j.mesh.userData.home.ry || 0, 0);
    j.mesh.visible = true;
  });
  ST.jett = [];
  debrisG.visible = true;
  if (RKT.g) {
    RKT.g.position.set(0, RKT.padY ?? 2.5, 0);
    RKT.g.rotation.set(0, 0, 0);
    RKT.flames.s1.visible = false; RKT.flames.s2.visible = false;
    if (RKT.boom1) RKT.boom1.rotation.y = RKT.boom1.userData.closedA;
    if (RKT.boom2) RKT.boom2.rotation.y = RKT.boom2.userData.closedA;
    if (RKT.siteBoom) RKT.siteBoom.rotation.y = 0;
  }
  puffKill(smoke);
  puffKill(steam);
  // 上一次飞行的曲线留作残影（sandbox 对比）
  if (typeof plotHist !== 'undefined' && plotHist.length > 6) ST.ghostHist = plotHist.slice();
}
function launch() {
  resetFlight();
  ST.countdown = 6;      // 6 秒倒计时（教学版），归零点火
}
function beginFlight() {
  ST.phase = 'run'; ST.t = 0;
  showToast('点火！逃逸塔连接器与脐带摆杆已撤收。', 'ok');
}
function jettison(key, dir) {
  const p = RKT.parts[key];
  if (!p || !p.visible) return;
  if (!p.userData.home) p.userData.home = { pos: p.position.clone(), ry: p.rotation.y };
  const wp = new THREE.Vector3();
  p.getWorldPosition(wp);
  const wr = p.rotation.y;
  RKT.g.remove(p);
  debrisG.add(p);
  p.position.copy(wp);
  p.rotation.y = wr;
  p.visible = true;
  const d = dir || new THREE.Vector3(1.4, -0.25, 0.35);
  ST.jett.push({ mesh: p, vel: d.clone().multiplyScalar(4 + Math.random()), av: new THREE.Vector3(0.3, 0.2, Math.random() * 0.4), key });
}
function flightStep(simDt) {
  if (ST.phase !== 'run' || ST.done) return;
  const sub = 0.05;
  let left = simDt;
  while (left > 1e-4) {
    const dt = Math.min(sub, left);
    left -= dt;
    ST.t += dt;
    const P = thrustProfile(ST.t);
    const g = gAt(ST.h);
    const rho = rhoAt(ST.h);
    const area = ST.t < 140 ? 16.4 : 12.2;   // 含助推包络 / 芯级
    const drag = 0.5 * rho * ST.v * ST.v * 0.42 * area;
    const m = currentMass();
    const acc = (P.T - drag) / m - g * Math.sin(ST.gam);
    if (ST.t > 0.3 && ST.h <= 0.5 && acc <= 0) {
      ST.phase = 'idle'; ST.t = 0;
      showToast(`推重比 T/W = ${(P.T / (m0() * gAt(0))).toFixed(2)} < 1，火箭无法离地。把推力提到 100% 以上再试。`, 'bad');
      return;
    }
    ST.v = Math.max(ST.v + acc * dt, 0);
    ST.gam += (gammaCmd(ST.t) - ST.gam) * Math.min(1, dt * 1.6);
    ST.h += ST.v * Math.sin(ST.gam) * dt;
    ST.x += ST.v * Math.cos(ST.gam) * dt;
    const q = 0.5 * rho * ST.v * ST.v;
    if (q > ST.maxQ) { ST.maxQ = q; ST.maxQh = ST.h; }
    ST.maxG = Math.max(ST.maxG, acc > 0 ? acc / 9.8 : 0);
    if (P.T > 0) {
      const mdot = P.T / (P.isp * G0);
      if (P.k === 'both') { ST.bb += mdot * P.bf * dt; ST.bc += mdot * (1 - P.bf) * dt; }
      else if (P.k === 'core') ST.bc += mdot * dt;
      else if (P.k === 's2') ST.s2burn += mdot * dt;
    }
    // 分离时序
    EVENTS.forEach((ev) => {
      if (!ST.fired[ev.key] && ST.t >= ev.t) {
        if (ev.key === 'fair' && ST.h < 110e3) return;
        ST.fired[ev.key] = true;
        fireEvent(ev);
      }
    });
    // 一二级热分离（燃料池烧穿或到时）
    if (!ST.fired.s1 && ST.t > 25 && (ST.bc >= M2.s1Prop - 2 || ST.t >= 157)) {
      ST.fired.s1 = true;
      jettison('s1');
      RKT.flames.s1.visible = false;
      showToast('一二级热分离：二级真空发动机点火！', 'ok');
    }
    // 二级燃尽 → 入轨判定
    if (ST.fired.s1 && !ST.done && ST.t > 200 && (ST.s2burn >= M2.s2Prop - 600 || P.k === 'none' || ST.t >= 650)) {
      ST.done = true;
      ST.phase = 'coast';
      const dv = vCirc(ST.h) - ST.v;
      if (ST.h >= 140e3 && dv <= 90) {
        ST.orbit = true;
        showToast(`入轨成功！飞行 ${(ST.t / 60).toFixed(1)} min，高度 ${(ST.h / 1000).toFixed(0)} km，末速 ${(ST.v / 1000).toFixed(2)} km/s（该高度圆轨道 ${((ST.v + dv) / 1000).toFixed(2)} km/s）。神舟进入太空！`, 'ok');
      } else {
        ST.orbit = false;
        showToast(ST.h < 140e3
          ? `未能入轨：末速 ${(ST.v / 1000).toFixed(2)} km/s，但高度仅 ${(ST.h / 1000).toFixed(0)} km，再入大气会烧毁。试试减小载荷或提高比冲。`
          : `差一点：末速 ${(ST.v / 1000).toFixed(2)} km/s，距该高度圆轨道还差 ${(dv / 1000).toFixed(2)} km/s。减小载荷、提高比冲再试。`, 'bad');
      }
    }
    if (ST.t > 700) { ST.phase = 'coast'; ST.done = true; }
    if (ST.phase !== 'run') break;
  }
}
/** 统一的分离事件执行（含提示与遥测时间线登记） */
function fireEvent(ev) {
  if (ev.key === 'tower') jettison('tower', new THREE.Vector3(-1.6, 0.3, 0.2));
  else if (ev.key === 'boosters') jettison('boosters');
  else if (ev.key === 'fair') jettison('fair');
  else if (ev.key === 's1') { jettison('s1'); RKT.flames.s1.visible = false; }
  else if (ev.key === 'seco') { RKT.flames.s2.visible = false; }
  if (ev.name) showToast(ev.name + '！', 'ok');
  telemMark(ev.t, ev.name);
}

/* ---------------- 起飞烟尘 / 导流槽蒸汽（池化粒子，零分配） ---------------- */

/** 烟尘/蒸汽池（InstancedMesh：52 个独立 mesh → 2 个 draw call） */
function makePuffPool(n, color, opacity, spread) {
  const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false });
  const inst = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 7, 5), mat, n);
  inst.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  inst.frustumCulled = false;
  const zero = new THREE.Matrix4().makeScale(1e-4, 1e-4, 1e-4);
  for (let i = 0; i < n; i++) inst.setMatrixAt(i, zero);
  inst.instanceMatrix.needsUpdate = true;
  scene.add(inst);
  return {
    inst,
    items: Array.from({ length: n }, () => ({ life: 0, max: 1, x: 0, y: 0, z: 0, vx: 0, vz: 0, maxS: spread })),
  };
}
const smoke = makePuffPool(30, COL.steam, 0.4, 13);
const steam = makePuffPool(22, 0xf2efe6, 0.3, 9);
const _puffM4 = new THREE.Matrix4();
const _puffQ = new THREE.Quaternion();
const _puffS = new THREE.Vector3();
function puffWrite(pool) {
  pool.items.forEach((s, i) => {
    if (s.life > 0) {
      const k = 1 - s.life / s.max;
      _puffS.set(1 + k * s.maxS, 1 + k * s.maxS * 0.7, 1 + k * s.maxS);
      _puffM4.compose(_tmpP.set(s.x, s.y, s.z), _puffQ, _puffS);
    } else {
      _puffM4.makeScale(1e-4, 1e-4, 1e-4);
    }
    pool.inst.setMatrixAt(i, _puffM4);
  });
  pool.inst.instanceMatrix.needsUpdate = true;
}
function puffKill(pool) {
  pool.items.forEach((s) => { s.life = 0; });
  puffWrite(pool);
}
const _tmpP = new THREE.Vector3();
function stepLaunchFx(dt, baseY) {
  // 烟尘：点火后 0-8 s 从导流槽两侧涌出
  if (ST.phase === 'run' && ST.t < 8) {
    smoke.items.forEach((s) => {
      if (s.life <= 0 && Math.random() < 0.28) {
        s.life = s.max = 2.4 + Math.random() * 1.8;
        s.x = (Math.random() - 0.5) * 16;
        s.y = baseY - 1.6 + Math.random() * 2;
        s.z = (Math.random() - 0.5) * 26 - 4;
        s.vx = (Math.random() - 0.5) * 16;
        s.vz = (Math.random() - 0.5) * 16;
      }
    });
  }
  smoke.items.forEach((s) => {
    if (s.life > 0) {
      s.life -= dt;
      s.x += s.vx * dt; s.z += s.vz * dt; s.y += dt * 1.6;
    }
  });
  // 喷水降温白雾：点火后 0-14 s（导流槽喷水把 2000℃ 燃气降温）
  if (ST.phase === 'run' && ST.t < 14) {
    steam.items.forEach((s) => {
      if (s.life <= 0 && Math.random() < 0.2) {
        s.life = s.max = 3.2 + Math.random() * 2.0;
        s.x = (Math.random() - 0.5) * 10 - 6;
        s.y = baseY - 1.2;
        s.z = (Math.random() - 0.5) * 8 - 8;
        s.vx = (Math.random() - 0.5) * 8;
        s.vz = (Math.random() - 0.5) * 8 + 3;
      }
    });
  }
  steam.items.forEach((s) => {
    if (s.life > 0) {
      s.life -= dt;
      s.x += s.vx * dt; s.z += s.vz * dt; s.y += dt * 2.6;
    }
  });
  puffWrite(smoke);
  puffWrite(steam);
}

/* ---------------- 上升段视觉更新 ---------------- */

const lastFollow = new THREE.Vector3();
const tmpV = new THREE.Vector3();
function followTarget(p) {
  tmpV.subVectors(p, lastFollow);
  camera.position.add(tmpV);
  controls.target.copy(p);
  lastFollow.copy(p);
}
function updateAscentVisual(dt) {
  if (!RKT.g) return;
  const y = (RKT.padY ?? 2.5) + visH(ST.h);
  RKT.g.position.y = y;
  const pitch = (Math.PI / 2 - ST.gam);
  RKT.g.rotation.z = -pitch;
  if (ST.phase === 'run' && ST.t < 2 && ST.h < 100) RKT.g.rotation.z = 0;
  const P = thrustProfile(ST.t);
  const burning = ST.phase === 'run' && P.T > 0;
  const throt = burning && P.k === 'both' ? CFG.thrustPct / 100 : 1;
  RKT.flames.s1.visible = burning && ST.t < 157 && !ST.fired.s1;
  RKT.flames.s2.visible = burning && ST.t >= 157 && !ST.fired.seco;
  const flick = (0.85 + Math.sin(performance.now() * 0.02) * 0.15) * throt;
  [RKT.flames.s1, RKT.flames.s2].forEach((f) => { if (f.visible) f.scale.setScalar(flick); });
  if (ST.jett.length) debrisG.visible = true;
  ST.jett.forEach((j) => {
    j.vel.y -= 9.8 * dt;
    j.mesh.position.addScaledVector(j.vel, dt * 2);
    j.mesh.rotation.x += j.av.x * dt; j.mesh.rotation.z += j.av.z * dt;
  });
  // 摆杆与塔臂让开
  if (ST.phase === 'run' && ST.t > 0.5) {
    if (RKT.boom1) RKT.boom1.rotation.y = lerp(RKT.boom1.rotation.y, RKT.boom1.userData.openA, Math.min(1, dt * 1.4));
    if (RKT.boom2) RKT.boom2.rotation.y = lerp(RKT.boom2.rotation.y, RKT.boom2.userData.openA, Math.min(1, dt * 1.2));
    if (RKT.siteBoom) RKT.siteBoom.rotation.y = Math.min(1.25, RKT.siteBoom.rotation.y + dt * 0.7);
  }
  stepLaunchFx(dt, RKT.g.position.y);
  // 天色：黎明 → 太空
  const k = skyK(ST.h);
  curBg.copy(skyCol).lerp(spaceCol, k);
  scene.background = curBg;
  stars.material.opacity = k * k * 0.9;
  if (ST.phase === 'run' || ST.phase === 'pause' || ST.phase === 'coast') followTarget(RKT.g.position);
}

/* ---------------- 在轨段（地球轨道 + 天宫空间站 + 对接演示） ---------------- */

const ORB = { alt: 350, ang: 0, follow: false, dockT: -1, dockSpeed: 0.12 };
const RE = { gam: 1.8, h: 100e3, v: 7650, t: 0, running: false, done: false, maxG: 0, heat: 0, black: false, skip: false };
const LD = { area: 1200, retro: true, wind: 1.5, h: 10e3, v: 180, drift: 0, running: false, done: false, vLand: 0, phase: 0 };

/* ---------------- 逃逸救生演示（第 2 章交互：0.2 秒把飞船拉离故障火箭） ---------------- */

const AS = { phase: 'off', t: 0, g: null, saved: null };
function escapeStack() {
  // 临时编组：整流罩 + 逃逸塔（含其内部神舟飞船壳体感）拉离箭体
  if (!AS.g) {
    const g = new THREE.Group();
    scene.add(g);
    g.visible = false;
    AS.g = g;
  }
  return AS.g;
}
function escapeDemoStart() {
  if (!RKT.built || AS.phase !== 'off') return;
  resetFlight();
  ST.spin = 0;
  const g = escapeStack();
  const fair = RKT.parts.fair, tower = RKT.parts.tower;
  AS.saved = {
    fairParent: fair.parent, towerParent: tower.parent,
    fairPos: fair.position.clone(), towerPos: tower.position.clone(),
    towerRot: tower.rotation.clone(),
  };
  RKT.g.remove(fair); RKT.g.remove(tower);
  g.add(fair, tower);
  fair.position.set(0, 0, 0);
  tower.position.set(0, 13.2, 0);   // 塔在整流罩顶端
  tower.rotation.set(0, 0, 0);
  g.position.copy(RKT.g.position).add(AS.saved.fairPos);
  g.visible = true;
  AS.phase = 'pull';
  AS.t = 0;
  showToast('逃逸分离模拟：固体发动机点火，0.2 秒内把飞船拉离火箭！', 'ok');
}
function escapeDemoStop(restoreToast = true) {
  if (AS.phase === 'off' || !AS.saved) return;
  const g = escapeStack();
  const fair = RKT.parts.fair, tower = RKT.parts.tower;
  g.remove(fair); g.remove(tower);
  AS.saved.fairParent.add(fair);
  AS.saved.towerParent.add(tower);
  fair.position.copy(AS.saved.fairPos);
  tower.position.copy(AS.saved.towerPos);
  tower.rotation.copy(AS.saved.towerRot);
  fair.visible = true; tower.visible = true;
  g.visible = false;
  AS.saved = null;
  AS.phase = 'off';
  if (restoreToast) showToast('已复位：逃逸塔与整流罩装回箭体。', 'ok');
}
function escapeStep(dt) {
  if (AS.phase === 'off') return;
  AS.t += dt;
  const g = escapeStack();
  if (AS.phase === 'pull') {
    // 拉离：向上 + 向下游方向倾斜，模拟弹道救生
    const k = Math.min(AS.t / 1.6, 1);
    g.position.y += dt * (18 + k * 30);
    g.position.x += dt * 6 * k;
    g.rotation.z = -0.42 * smooth(k);
    if (AS.t > 2.2) {
      AS.phase = 'toweraway';
      showToast('2.2 s：逃逸塔完成使命，分离抛掉。', 'ok');
      if (RKT.parts.tower) {
        RKT.parts.tower.getWorldPosition(tmpV);
        const wp = tmpV.clone();
        AS.g.remove(RKT.parts.tower);
        debrisG.add(RKT.parts.tower);
        RKT.parts.tower.position.copy(wp);
        RKT.parts.tower.visible = true;
      }
    }
  } else if (AS.phase === 'toweraway') {
    g.position.y += dt * 6;
    g.rotation.z = lerp(g.rotation.z, -1.1, dt * 0.8);
    if (AS.t > 4.4) {
      AS.phase = 'off';
      showToast('飞船带着整流罩进入弹道下降段，随后开伞着陆——逃逸救生演示完成。', 'ok');
      setTimeout(() => escapeDemoStop(false), 1600);
    }
  }
}

/* ---------------- 对接演示（第 7 章交互：神舟 → 天宫前向端口） ---------------- */

const DOCK = { phase: 'off', t: 0, from: null };
function dockStart() {
  const g = scenes.orbit;
  if (!g || DOCK.phase !== 'off') return;
  ORB.follow = false;
  DOCK.phase = 'approach';
  DOCK.t = 0;
  // 相位调整已完成（教学省略）：把船放到空间站后下方 0.5 个船长处，从停泊点开始接近
  const st = g.userData.station;
  const n = st.userData.dockN || V3(1, 0, 0);
  DOCK.from = st.position.clone().addScaledVector(n, -0.42).add(V3(0, -0.06, 0));
  g.userData.ship.position.copy(DOCK.from);
  showToast('对接程序启动：停泊点 → 接近 → 接触捕获 → 刚性连接。', 'ok');
}
function dockReset() {
  DOCK.phase = 'off';
  DOCK.t = 0;
  const g = scenes.orbit;
  if (g) {
    ORB.ang = ORB.ang % TAU;
    g.userData.ship.rotation.set(0, -ORB.ang + Math.PI / 2, 0);
  }
}
function dockStep(dt) {
  if (DOCK.phase === 'off') return;
  const g = scenes.orbit;
  if (!g) return;
  DOCK.t += dt;
  const ship = g.userData.ship;
  const port = g.userData.portWorld || g.userData.station.userData.portWorld;
  if (!port) return;
  if (DOCK.phase === 'approach') {
    const k = smooth(clamp(DOCK.t / 9, 0, 1));
    ship.position.lerpVectors(DOCK.from, port, k);
    ship.lookAt(port.x * 2, port.y * 2, port.z * 2);
    if (DOCK.t > 9) {
      DOCK.phase = 'contact';
      showToast('接触捕获！对接机构捕获锁 FIRST CATCH。', 'ok');
    }
  } else if (DOCK.phase === 'contact') {
    // 缓冲：小幅回弹 + 收拢拉紧
    const kk = DOCK.t - 9;
    ship.position.copy(port).addScaledVector(ship.userData.dockN || V3(1, 0, 0), -0.012 * Math.exp(-kk * 3) * Math.sin(kk * 26));
    if (kk > 2.4) {
      DOCK.phase = 'off';
      showToast('刚性连接完成 · 电路气路接通——神舟乘组准备进入天宫。', 'ok');
    }
  }
}

/* ---------------- 任务档案回放（第 10 章：标称弹道驱动一次完整任务重演） ---------------- */

const ARCH = { t: -6, playing: true, speed: 4, fired: {}, done: false, missionIdx: 12 };
function archReset(keepIdx = true) {
  if (!keepIdx) ARCH.missionIdx = 12;
  ARCH.t = -6; ARCH.playing = true; ARCH.fired = {}; ARCH.done = false;
  ST.jett.forEach((j) => {
    debrisG.remove(j.mesh);
    RKT.g.add(j.mesh);
    const home = j.mesh.userData.home;
    j.mesh.position.copy(home.pos);
    j.mesh.rotation.set(0, j.mesh.userData.home.ry || 0, 0);
    j.mesh.visible = true;
  });
  ST.jett = [];
  debrisG.visible = true;
  if (RKT.g) {
    RKT.g.position.set(0, RKT.padY ?? 2.5, 0);
    RKT.g.rotation.set(0, 0, 0);
    RKT.flames.s1.visible = false; RKT.flames.s2.visible = false;
    if (RKT.boom1) RKT.boom1.rotation.y = RKT.boom1.userData.closedA;
    if (RKT.boom2) RKT.boom2.rotation.y = RKT.boom2.userData.closedA;
  }
  puffKill(smoke);
  puffKill(steam);
}
function archStep(dt) {
  if (!RKT.g) return;
  // 曲线采样（每 2 秒模拟时一个点，与实时飞行同口径）
  if (ARCH.playing && ARCH.t >= 0) {
    ARCH.sampleT = (ARCH.sampleT || 0) + dt * ARCH.speed;
    if (ARCH.sampleT >= 2) {
      ARCH.sampleT = 0;
      const dd = nominalAt(ARCH.t);
      plotHist.push([dd.t, dd.v / 1000, dd.h / 1000, dd.q, dd.a]);
      if (plotHist.length > 400) plotHist.shift();
    }
  }
  if (ARCH.playing && !ARCH.done) {
    ARCH.t += dt * ARCH.speed;
    if (ARCH.t >= 602) { ARCH.t = 602; ARCH.done = true; ARCH.playing = false; showToast('回放结束：太阳翼展开，神舟进入独立飞行阶段。', 'ok'); }
  }
  const d = nominalAt(Math.max(ARCH.t, 0));
  const y = (RKT.padY ?? 2.5) + visH(d.h);
  RKT.g.position.y = y;
  RKT.g.rotation.z = -((Math.PI / 2 - gammaCmd(Math.max(ARCH.t, 0)))) * 0.92;
  if (ARCH.t < 2) RKT.g.rotation.z = 0;
  // 火焰与喷水
  const burn1 = ARCH.t >= 0 && ARCH.t < 157;
  const burn2 = ARCH.t >= 157 && ARCH.t < 585;
  RKT.flames.s1.visible = burn1;
  RKT.flames.s2.visible = burn2;
  const flick = 0.85 + Math.sin(performance.now() * 0.02) * 0.15;
  [RKT.flames.s1, RKT.flames.s2].forEach((f) => { if (f.visible) f.scale.setScalar(flick); });
  // 摆杆让开
  const openK = ARCH.t > 0 ? Math.min(1, ARCH.t / 2) : 0;
  if (RKT.boom1) RKT.boom1.rotation.y = lerp(RKT.boom1.userData.closedA, RKT.boom1.userData.openA, openK);
  if (RKT.boom2) RKT.boom2.rotation.y = lerp(RKT.boom2.userData.closedA, RKT.boom2.userData.openA, openK);
  // 事件回放
  EVENTS.forEach((ev) => {
    if (!ARCH.fired[ev.key] && ARCH.t >= ev.t) {
      ARCH.fired[ev.key] = true;
      if (ev.key === 's1') { jettison('s1'); }
      else if (ev.key !== 'seco') jettison(ev.key, ev.key === 'tower' ? new THREE.Vector3(-1.6, 0.3, 0.2) : undefined);
      if (ev.name) showToast(ev.name, 'ok');
    }
  });
  ST.jett.forEach((j) => {
    j.vel.y -= 9.8 * dt;
    j.mesh.position.addScaledVector(j.vel, dt * 2);
    j.mesh.rotation.x += j.av.x * dt; j.mesh.rotation.z += j.av.z * dt;
  });
  stepLaunchFx(dt, RKT.g.position.y);
  const k = skyK(d.h);
  curBg.copy(skyCol).lerp(spaceCol, k);
  scene.background = curBg;
  stars.material.opacity = k * k * 0.9;
  followTarget(RKT.g.position);
  // 遥测数据（回放数据 = 表内标称值）
  updReplayHUD(d);
}

/* ---------------- 受力分析箭头 ---------------- */

let forceArrows = null;
function makeForceArrow(c) {
  const mat = new THREE.MeshBasicMaterial({ color: c });
  const g = new THREE.Group();
  const shaft = cyl(0.28, 0.28, 1, mat, 8);
  shaft.geometry.translate(0, 0.5, 0);
  const head = new THREE.Mesh(new THREE.ConeGeometry(0.8, 1.6, 10), mat);
  g.add(shaft, head);
  g.set = (from, to) => {
    const dir = new THREE.Vector3().subVectors(to, from);
    const len = Math.max(dir.length(), 0.01);
    g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    g.position.copy(from);
    shaft.scale.y = Math.max(len - 1.4, 0.1);
    head.position.y = len - 0.7;
    g.visible = true;
  };
  g.hide = () => { g.visible = false; };
  return g;
}
function ensureForceArrows() {
  if (!forceArrows) {
    forceArrows = { T: makeForceArrow(COL.forceT), G: makeForceArrow(COL.forceG), D: makeForceArrow(COL.forceD) };
    scene.add(forceArrows.T, forceArrows.G, forceArrows.D);
  }
  return forceArrows;
}
function updateForces() {
  const show = (ST.showForces || (ST.replayForces === true)) && RKT.g && ST.phase !== 'idle';
  if (!show) {
    if (forceArrows) [forceArrows.T, forceArrows.G, forceArrows.D].forEach((a) => a.hide());
    return;
  }
  const fa = ensureForceArrows();
  const P = thrustProfile(ST.t);
  const p = RKT.g.position;
  const c = new THREE.Vector3(p.x, p.y + 20, p.z);
  const dirV = new THREE.Vector3(Math.cos(Math.PI / 2 - ST.gam), Math.sin(Math.PI / 2 - ST.gam), 0);
  if (P.T > 0) fa.T.set(c.clone().addScaledVector(dirV, 12), c.clone().addScaledVector(dirV, 12 + clamp(P.T / 3e5, 4, 26)));
  else fa.T.hide();
  fa.G.set(c.clone().add(new THREE.Vector3(-14, 6, 0)), c.clone().add(new THREE.Vector3(-14, 6 - 16, 0)));
  const drag = 0.5 * rhoAt(ST.h) * ST.v * ST.v * 0.42 * (ST.t < 140 ? 16.4 : 12.2);
  if (drag > 3e4) fa.D.set(c.clone().addScaledVector(dirV, -12), c.clone().addScaledVector(dirV, -12 - clamp(drag / 1.5e5, 3, 18)));
  else fa.D.hide();
}
/* ---------------- 发射场深度建模（酒泉卫星发射场 · 教学重建） ----------------
 * 组成：戈壁地面 / 混凝土场坪 / 公路 / 发射平台（工位编号盘 + 警示环）/
 *       导流槽（楔形导流 + 喷水降温管路）/ 固定勤务塔（格构承力 + 10 层平台 + 电梯井 +
 *       双脐带摆杆 + 天车 + 避雷针尖 + 航空障碍灯）/ 避雷塔×2 / 勤务楼（测控屏 + 抛物面天线）/
 *       燃料库（卧式贮罐 + 输送管路）/ 加注车×2 / 吊车 / 测控厢式车 / 旗帜 / 灯杆 / 围栏 / 灌木 / 远山。 */

let wavyFlags = [];   // 飘动旗帜（帧循环顶点波）
let padBeacons = [];  // 航空障碍灯（呼吸闪烁）

function buildSite(g, tex) {
  const T = tex;
  RKT.padY = 2.55;
  RKT.siteLabels = [];   // 提前初始化（extras/细节轮会先 push 标注）

  /* --- 戈壁地面 + 场坪 + 公路 --- */
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(1500, 1500),
    new THREE.MeshStandardMaterial({ map: T.sandG, normalMap: T.sandN, color: COL.gobi, roughness: 1 }));
  ground.rotation.x = -Math.PI / 2;
  g.add(ground);

  const apron = box(70, 0.3, 50, new THREE.MeshStandardMaterial({ map: T.slab, normalMap: T.slabN, color: COL.concrete, roughness: 0.95 }));
  apron.position.y = 0.15;
  g.add(apron);

  const roadMat = M(COL.asphalt, 0.95);
  const road = box(9, 0.22, 150, roadMat);
  road.position.set(0, 0.11, 96);
  g.add(road);
  // 道路中线（白色虚段，实例化）
  {
    const marks = [];
    for (let i = 0; i < 12; i++) marks.push({ p: [0, 0.24, 34 + i * 11], s: [0.5, 0.03, 4.5] });
    for (let i = 0; i < 9; i++) marks.push({ p: [8 + i * 11, 0.24, 40], s: [4.5, 0.03, 0.5], ry: Math.PI / 2 });
    instBoxes(g, sm('roadline', () => new THREE.MeshStandardMaterial({ color: 0xd8d4c8, roughness: 0.7 })), marks);
  }

  /* --- 发射平台（含工位盘 / 警示环 / 支承座） --- */
  const slabMat = new THREE.MeshStandardMaterial({ map: T.slab, normalMap: T.slabN, color: 0xc9c4bb, roughness: 0.95 });
  const padG = new THREE.Group();
  padG.userData.bake = true;
  const pad = cyl(15, 16.5, 2.2, slabMat, 40);
  pad.position.y = 1.35;
  padG.add(pad);
  const padTop = new THREE.Mesh(new THREE.CircleGeometry(15, 40), slabMat);
  padTop.rotation.x = -Math.PI / 2;
  padTop.position.y = 2.46;
  padG.add(padTop);
  const padEdge = torus(15.2, 0.28, sm('padedge', () => sm('chrDeep', () => sm('chrDeep', () => M(COL.chromeDeep, 0.45, 0.7)))), 48, 8);
  padEdge.rotation.x = Math.PI / 2;
  padEdge.position.y = 2.42;
  padG.add(padEdge);
  const warnRing = cyl(15.05, 15.05, 0.5, new THREE.MeshStandardMaterial({ map: texWarn(), roughness: 0.8 }), 48, true);
  warnRing.position.y = 2.1;
  padG.add(warnRing);
  // 四只承支座（箭体尾段悬在导流槽上方）
  const pedMat = sm('concreteDeep', () => M(COL.concreteDeep, 0.9));
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2 + Math.PI / 4;
    const p = box(2.6, 1.5, 2.6, pedMat);
    p.position.set(Math.cos(a) * 3.2, 3.1, Math.sin(a) * 3.2);
    padG.add(p);
  }
  g.add(padG);
  // 工位编号盘（塔架对侧）
  {
    const num = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 3.6),
      new THREE.MeshStandardMaterial({ map: texPadNum('2'), roughness: 0.6, metalness: 0.05 }));
    num.position.set(-9.5, 5.4, 8.5);
    num.rotation.set(0, -2.2, 0);
    g.add(num);
  }
  // 箭底导流孔栅盖（深色格栅）
  {
    const grate = box(5.2, 0.24, 5.2, sm('grate', () => M(0x2c3036, 0.85, 0.3)));
    grate.position.y = 2.5;
    g.add(grate);
  }

  /* --- 导流槽（楔形导流面 + 槽壁焦黑 + 喷水降温管路） --- */
  const trench = new THREE.Group();
  trench.userData.bake = true;
  const charMat = new THREE.MeshStandardMaterial({ map: texAblation(), color: 0x8a8578, roughness: 0.92 });
  const trenchFloor = box(7.5, 0.5, 26, charMat);
  trenchFloor.position.set(0, 0.6, -14);
  trench.add(trenchFloor);
  const wedge = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 3.4, 10, 4), charMat);
  wedge.rotation.set(Math.PI / 2, Math.PI / 4, 0);
  wedge.scale.set(1, 1, 0.6);
  wedge.position.set(0, 1.4, -10);
  trench.add(wedge);
  for (const sx of [-1, 1]) {
    const wall = box(0.6, 4.4, 26, charMat);
    wall.position.set(sx * 4.1, 1.6, -14);
    trench.add(wall);
  }
  const mouthFrame = box(9.2, 4.8, 0.8, sm('trenchframe', () => sm('darkM', () => M(COL.darkMetal, 0.6, 0.4))));
  mouthFrame.position.set(0, 2.2, -26.8);
  trench.add(mouthFrame);
  // 喷水环管（槽口内一圈向内喷水）+ 供水弯管
  {
    const pipeMat = sm('pipe', () => sm('chrDeep', () => sm('chrDeep', () => M(COL.chromeDeep, 0.45, 0.7))));
    const ring = torus(2.4, 0.12, pipeMat, 24, 8);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(0, 3.4, -24);
    trench.add(ring);
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * TAU;
      const nz = cyl(0.08, 0.12, 0.7, pipeMat, 8);
      nz.position.set(Math.cos(a) * 2.4, 3.4 - 0.4, -24 + Math.sin(a) * 2.4);
      nz.rotation.z = Math.PI / 2 - a;
      trench.add(nz);
    }
    const feed = tubeAlong([V3(-14, 2.2, -18), V3(-10, 3.6, -21), V3(-6, 3.4, -23.4), V3(-2.6, 3.4, -24)], 0.22, pipeMat, 20, 8);
    trench.add(feed);
  }
  g.add(trench);

  /* --- 固定勤务塔（格构承力结构 · 本实验建模密度核心之一） --- */
  const tw = new THREE.Group();
  const TWX = 7.6, TWZ = -9, TWH = 74;          // 塔中心位于箭体后方
  const steelMat = sm('towersteel', () => new THREE.MeshStandardMaterial({ map: texPanel(), color: COL.towerSteel, roughness: 0.62, metalness: 0.35 }));
  const steelHi = sm('towerhi', () => sm('twrHi', () => M(COL.towerSteelHi, 0.5, 0.45)));
  // 4 根主肢（分 3 段渐缩，呈塔架收分）
  const legs = [];
  const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
  for (const [cx, cz] of corners) {
    for (let s = 0; s < 3; s++) {
      const y0 = s * TWH / 3, y1 = (s + 1) * TWH / 3;
      const w0 = 0.62 - s * 0.14, w1 = 0.5 - s * 0.12;
      const kx0 = cx * (TWX / 2) * (1 - y0 / TWH * 0.24);
      const kz0 = TWZ + cz * 3.8 * (1 - y0 / TWH * 0.24);
      const kx1 = cx * (TWX / 2) * (1 - y1 / TWH * 0.24);
      const kz1 = TWZ + cz * 3.8 * (1 - y1 / TWH * 0.24);
      legs.push({ p: [(kx0 + kx1) / 2, (y0 + y1) / 2, (kz0 + kz1) / 2], s: [w1, TWH / 3 + 0.3, w1], rz: (kx1 - kx0) / (y1 - y0), rx: -(kz1 - kz0) / (y1 - y0) });
    }
  }
  instBoxes(tw, steelMat, legs);
  // 横撑 + 交叉斜撑（12 层 × 4 面，实例化）
  {
    const ties = [], braces = [];
    const nLev = 12;
    for (let i = 0; i <= nLev; i++) {
      const y = i * TWH / nLev;
      const sh = 1 - y / TWH * 0.24;
      const hx = TWX / 2 * sh, hz = 3.8 * sh;
      // 水平横撑（4 面各 1）
      ties.push({ p: [0, y, TWZ + hz], s: [hx * 2, 0.3, 0.3] });
      ties.push({ p: [0, y, TWZ - hz], s: [hx * 2, 0.3, 0.3] });
      ties.push({ p: [-hx, y, TWZ], s: [0.3, 0.3, hz * 2] });
      ties.push({ p: [hx, y, TWZ], s: [0.3, 0.3, hz * 2] });
      if (i < nLev) {
        const y1 = (i + 1) * TWH / nLev, sh1 = 1 - y1 / TWH * 0.24;
        const hx1 = TWX / 2 * sh1, hz1 = 3.8 * sh1;
        const dy = y1 - y;
        const rzX = Math.atan2(hx1 - hx, dy);
        const rxZ = Math.atan2(hz1 - hz, dy);
        for (const s of [-1, 1]) {
          braces.push({ p: [s * (hx + hx1) / 2, (y + y1) / 2, TWZ + (hz + hz1) / 2], s: [0.26, Math.hypot(dy, hx1 - hx), 0.26], rz: s * rzX });
          braces.push({ p: [s * (hx + hx1) / 2, (y + y1) / 2, TWZ - (hz + hz1) / 2], s: [0.26, Math.hypot(dy, hx1 - hx), 0.26], rz: -s * rzX });
          braces.push({ p: [s * hx, (y + y1) / 2, TWZ + (hz + hz1) / 2], s: [0.26, Math.hypot(dy, hz1 - hz), 0.26], rx: rxZ * (hz1 > hz ? 1 : -1) * s });
          braces.push({ p: [-s * hx, (y + y1) / 2, TWZ + (hz + hz1) / 2], s: [0.26, Math.hypot(dy, hz1 - hz), 0.26], rx: -rxZ * (hz1 > hz ? 1 : -1) * s });
        }
      }
    }
    instBoxes(tw, steelMat, ties);
    instBoxes(tw, steelHi, braces);
  }
  // 10 层工作平台（金属板 + 护栏）
  {
    const platMat = new THREE.MeshStandardMaterial({ map: texPanel(), color: COL.concreteDeep, roughness: 0.8, metalness: 0.2 });
    const slabs = [], posts = [], rails = [];
    for (let i = 1; i <= 10; i++) {
      const y = i * 6.6 + 1.2;
      const sh = 1 - y / TWH * 0.24;
      const w = TWX * sh + 1.6;
      slabs.push({ p: [0, y, TWZ], s: [w, 0.22, 3.8 * sh + 1.6] });
      const hw = w / 2;
      for (const sx of [-1, 1]) {
        for (let k = 0; k < 4; k++) posts.push({ p: [sx * (hw - 0.1), y + 0.55, TWZ + (-1.5 + k) * 1.0], s: [0.09, 1.0, 0.09] });
        rails.push({ p: [sx * (hw - 0.1), y + 1.05, TWZ], s: [0.07, 0.07, 3.4] });
        rails.push({ p: [sx * (hw - 0.1), y + 0.62, TWZ], s: [0.06, 0.06, 3.4] });
      }
      for (const sz of [-1.7, 1.7]) {
        for (let k = 0; k < 6; k++) posts.push({ p: [(-2.5 + k) * (w / 6), y + 0.55, TWZ + sz], s: [0.09, 1.0, 0.09] });
        rails.push({ p: [0, y + 1.05, TWZ + sz], s: [w - 0.2, 0.07, 0.07] });
      }
    }
    instBoxes(tw, platMat, slabs);
    instBoxes(tw, steelHi, posts);
    instBoxes(tw, steelHi, rails);
  }
  // 电梯井（附着塔身东侧）
  {
    const shaft = box(2.6, 60, 3.2, sm('shaft', () => M(0x49525c, 0.72, 0.3)));
    shaft.position.set(TWX / 2 + 1.4, 30.4, TWZ);
    tw.add(shaft);
    const doors = [];
    for (let i = 0; i < 9; i++) doors.push({ p: [TWX / 2 + 2.72, 4 + i * 6.4, TWZ], s: [0.1, 2.4, 1.8] });
    instBoxes(tw, sm('doormat', () => M(0x2e353c, 0.6, 0.5)), doors);
  }
  // 双脐带摆杆（弹簧管路摆杆：起飞前贴箭，起飞后摆开）
  function makeBoom(y, len, tiltUp) {
    const pivot = new THREE.Group();
    pivot.position.set(1.2, y, TWZ + 3.6 * (1 - y / TWH * 0.24));
    const arm = new THREE.Group();
    const beam = box(len, 0.7, 0.7, steelMat);
    beam.position.x = len / 2;
    arm.add(beam);
    const rail = box(len, 0.12, 0.12, steelMat);
    rail.position.set(len / 2, 0.5, 0);
    arm.add(rail);
    // 缆束（曲线管）
    const cb = tubeAlong([V3(0.2, -0.3, 0), V3(len * 0.4, -0.42, 0), V3(len * 0.8, -0.36, 0), V3(len - 0.4, -0.3, 0)], 0.16, sm('cabundle', () => M(0x2a2e33, 0.85, 0.1)), 16, 6);
    arm.add(cb);
    // 端部接头盘（贴箭体侧）
    const plate = cyl(0.55, 0.55, 0.24, steelMat, 14);
    plate.rotation.z = Math.PI / 2;
    plate.position.x = len - 0.2;
    arm.add(plate);
    arm.rotation.z = tiltUp;
    arm.userData.bake = true;      // 臂内静态件烘焙（pivot 旋转不受影响）
    pivot.add(arm);
    pivot.userData.noBake = true;   // 动态件：起飞时摆开，禁烘焙
    pivot.userData.closedA = 0;
    pivot.userData.openA = -1.15;
    tw.add(pivot);
    return pivot;
  }
  RKT.boom1 = makeBoom(34, 7.6, 0.04);   // 二级高度摆杆
  RKT.boom2 = makeBoom(47, 9.2, 0.02);   // 整流罩高度摆杆
  // 顶部：檩条 + 天车轨道 + 桅杆 + 避雷尖 + 航空灯
  {
    const topY = TWH + 1.4;
    const roof = box(TWX + 2.4, 0.5, 9.4, steelMat);
    roof.position.set(0, topY, TWZ);
    tw.add(roof);
    const craneRail = box(TWX + 1.4, 0.35, 0.35, steelHi);
    craneRail.position.set(0, topY + 1.5, TWZ - 2);
    craneRail.userData.noBake = true;   // 动态件：起飞摆臂联动
    tw.add(craneRail);
    RKT.siteBoom = craneRail;
    // （天车小车与吊缆细节为守 draw call 预算精简，保留轨道梁叙事）
    // 桅杆（4 肢小格构到 88 m）
    const mastLegs = [];
    for (const [cx, cz] of corners) {
      for (let s = 0; s < 3; s++) {
        const y0 = topY + s * 5, y1 = topY + (s + 1) * 5;
        mastLegs.push({ p: [cx * 1.1, (y0 + y1) / 2, TWZ + cz * 1.1], s: [0.18, 5.3, 0.18] });
      }
    }
    instBoxes(tw, steelHi, mastLegs);
    const tip = cone(0.16, 5, sm('tip', () => sm('chromeM', () => M(COL.chrome, 0.35, 0.8))), 8);
    tip.position.set(0, topY + 17.5, TWZ);
    tw.add(tip);
    // 航空障碍灯（红，呼吸）
    const beacon = glowSprite(2.2, '255,60,50', 0.9);
    beacon.position.set(0, topY + 15.6, TWZ);
    tw.add(beacon);
    padBeacons.push(beacon);
  }
  // 塔身泛光灯（照亮箭体的投光组；光晕以灯头自发光呈现，省 sprite）
  for (const ly of [10, 30, 52]) {
    const head = box(1.2, 0.8, 0.5, sm('lampH', () => new THREE.MeshStandardMaterial({ color: 0xf2f4f6, emissive: 0xfff2d8, emissiveIntensity: 0.9, roughness: 0.4 })));
    head.position.set(-2.2, ly, TWZ + 4.2);
    head.rotation.x = 0.5;
    tw.add(head);
  }
  tw.userData.bake = true;
  tw.position.set(0, 0.2, 0);
  g.add(tw);

  /* --- 避雷塔 ×2（渐缩格构 + 绝缘子串） --- */
  const boltIns = [];
  for (const [lx, lz] of [[-42, -34], [40, -46]]) {
    const lt = new THREE.Group();
    for (let s = 0; s < 4; s++) {
      const y0 = s * 22, y1 = (s + 1) * 22;
      const w = 2.6 - s * 0.55;
      for (const [cx, cz] of corners) {
        const leg = box(0.3, 22.5, 0.3, steelMat);
        leg.position.set(cx * w / 2, (y0 + y1) / 2, cz * w / 2);
        lt.add(leg);
      }
      for (let k = 0; k < 4; k++) {
        const a = k * Math.PI / 2;
        const tie = box(w, 0.2, 0.2, steelHi);
        tie.rotation.y = a;
        tie.position.set(0, y0 + (k % 2 ? 11 : 3), 0);
        lt.add(tie);
      }
    }
    const spike = cone(0.22, 8, sm('tip2', () => sm('chromeM', () => M(COL.chrome, 0.35, 0.8))), 8);
    spike.position.y = 92;
    lt.add(spike);
    lt.userData.bake = true;
    // 绝缘子串（每层 4 只小盘）
    for (let i = 1; i <= 4; i++) {
      for (const [cx, cz] of corners) boltIns.push({ p: [lx + cx * 1.4, i * 22, lz + cz * 1.4], r: 0.22, h: 0.4 });
    }
    lt.position.set(lx, 0, lz);
    g.add(lt);
    // 接地引线（曲线管入地）
    g.add(tubeAlong([V3(lx, 80, lz), V3(lx + 6, 60, lz + 5), V3(lx + 14, 22, lz + 12), V3(lx + 20, 0.3, lz + 18)], 0.09, sm('gwire', () => sm('black2', () => sm('black2', () => M(0x2a2e33, 0.85, 0.15)))), 24, 5));
  }
  instCyls(g, sm('insulator', () => sm('insW', () => M(0xd8dcdf, 0.5, 0.15))), boltIns, 10);

  /* --- 勤务楼（测控楼：主楼 + 屏幕墙 + 抛物面天线 + 屋顶桅杆） --- */
  {
    const b = new THREE.Group();
    const conc = sm('bconc', () => new THREE.MeshStandardMaterial({ map: texPanel(), color: 0xa8a49a, roughness: 0.9 }));
    const main = box(20, 9, 13, conc);
    main.position.y = 4.5;
    b.add(main);
    const annex = box(9, 5.5, 8, conc);
    annex.position.set(-13, 2.75, 1);
    b.add(annex);
    // 窗带（两层，实例化发光平面）
    const wins = [];
    for (let fl = 0; fl < 2; fl++) {
      for (let i = 0; i < 9; i++) wins.push({ p: [-8.4 + i * 2.1, 6.4 - fl * 3.4, 6.56], s: [1.4, 1.5, 0.08] });
    }
    instBoxes(b, sm('win', () => new THREE.MeshStandardMaterial({ color: 0x2a3a4a, emissive: COL.windowLit, emissiveIntensity: 0.55, roughness: 0.3 })), wins);
    // 大屏（遥测终端墙）
    const wall = box(8.4, 3.6, 0.3, sm('wallscr', () => M(0x14181e, 0.6, 0.3)));
    wall.position.set(2, 6.8, 6.7);
    b.add(wall);
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(7.6, 2.8),
      new THREE.MeshBasicMaterial({ map: texConsoleScreen('MISSION CTRL') }));
    scr.position.set(2, 6.8, 6.9);
    b.add(scr);
    // 抛物面天线（车削浅碟 + 支架）
    {
      const dish = lathe(profile([[0.1, 0], [1.6, 0.5], [2.6, 1.15]]), sm('dish', () => sm('dishW', () => M(0xd8dcdf, 0.5, 0.15))), 20);
      dish.rotation.x = -1.05;
      dish.position.set(-13, 8.6, 1);
      b.add(dish);
      const feed = cyl(0.05, 0.05, 1.6, sm('dishfeed', () => sm('chrDeep', () => sm('chrDeep', () => M(COL.chromeDeep, 0.45, 0.7)))), 6);
      feed.rotation.x = 1.05;
      feed.position.set(-13, 9.4, 1.9);
      b.add(feed);
      const mast = cyl(0.3, 0.42, 4, conc, 10);
      mast.position.set(-13, 2.6, 1);
      b.add(mast);
    }
    // 屋顶桅杆
    const rm = cyl(0.1, 0.16, 7, steelHi, 8);
    rm.position.set(6, 13, 2);
    b.add(rm);
    const rmlight = sm('rooflamp', () => new THREE.MeshStandardMaterial({ color: 0x502020, emissive: 0xff3c32, emissiveIntensity: 1.6, roughness: 0.4 }));
    const rlamp = sph(0.16, rmlight, 8, 6);
    rlamp.position.set(6, 16.6, 2);
    b.add(rlamp);
    b.userData.bake = true;
    b.position.set(62, 0, -42);
    b.rotation.y = -0.5;
    g.add(b);
  }

  /* --- 燃料库（卧式贮罐 ×2 + 输送管 + 阀门 + 警带） --- */
  {
    const fb = new THREE.Group();
    fb.userData.bake = true;
    const tankMat = sm('tank', () => new THREE.MeshStandardMaterial({ map: texPanel(), color: COL.tankSilver, roughness: 0.5, metalness: 0.6 }));
    for (let i = 0; i < 2; i++) {
      const t = new THREE.Group();
      const body = cyl(2.2, 2.2, 11, tankMat, 20);
      body.rotation.z = Math.PI / 2;
      const capA = sph(2.2, tankMat, 18, 12);
      capA.position.x = -5.5;
      const capB = capA.clone();
      capB.position.x = 5.5;
      t.add(body, capA, capB);
      // 鞍座
      for (const sx of [-3.6, 3.6]) {
        const sad = box(1.2, 1.4, 3.4, sm('bconc', () => new THREE.MeshStandardMaterial({ map: texPanel(), color: 0xa8a49a, roughness: 0.9 })));
        sad.position.set(sx, -2.2, 0);
        t.add(sad);
      }
      // 警示环带
      const band = cyl(2.26, 2.26, 0.9, new THREE.MeshStandardMaterial({ map: texWarn(), roughness: 0.8 }), 20, true);
      band.rotation.z = Math.PI / 2;
      band.position.x = -1.5;
      t.add(band);
      t.position.set(i * 8.5 - 4.5, 3.6, 0);
      fb.add(t);
    }
    const pipe = tubeAlong([V3(4, 2.2, 2), V3(14, 2.2, 8), V3(30, 2.2, 22), V3(44, 2.4, 30)], 0.24, sm('pipe2', () => sm('chrDeep', () => sm('chrDeep', () => M(COL.chromeDeep, 0.45, 0.7)))), 28, 8);
    fb.add(pipe);
    const valve = torus(0.5, 0.12, sm('valve', () => sm('valveRed', () => M(COL.bandRed, 0.5, 0.3))), 16, 8);
    valve.position.set(14, 3.2, 8);
    valve.rotation.x = Math.PI / 2;
    fb.add(valve);
    fb.position.set(-58, 0, -26);
    fb.rotation.y = 0.9;
    g.add(fb);
  }

  /* --- 道具车队（加注车 ×2 / 汽车吊 / 测控厢式车 ×2） --- */
  function fuelTruck(color) {
    const t = new THREE.Group();
    t.userData.bake = true;
    const tankMat = sm('tank', () => new THREE.MeshStandardMaterial({ map: texPanel(), color: COL.tankSilver, roughness: 0.5, metalness: 0.6 }));
    const cabM = matPaint(color, { rough: 0.4 });
    const cab = box(2.2, 2.2, 2.6, cabM);
    cab.position.set(3.4, 1.9, 0);
    const glass = box(2.1, 0.8, 2.2, matGlassLite(0x9cc2e6, { opacity: 0.5 }));
    glass.position.set(3.4, 2.5, 0);
    const tankB = cyl(1.5, 1.5, 6.5, tankMat, 18);
    tankB.rotation.z = Math.PI / 2;
    tankB.position.set(-1.2, 2.1, 0);
    const cap1 = sph(1.5, tankMat, 14, 10);
    cap1.position.set(-4.4, 2.1, 0);
    const cap2 = cap1.clone();
    cap2.position.x = 2;
    const chassis = box(9, 0.5, 2.2, sm('chassis', () => M(0x2e3238, 0.8, 0.3)));
    chassis.position.y = 0.9;
    t.add(cab, glass, tankB, cap1, cap2, chassis);
    const wheels = [];
    for (const wx of [3.3, -2.2, -3.3]) for (const wz of [-1.15, 1.15]) {
      wheels.push({ p: [wx, 0.62, wz], r: 0.62, h: 0.42, rx: Math.PI / 2 });
    }
    instCyls(t, sm('tyre', () => M(COL.rubber, 0.95, 0)), wheels, 12);
    t.add(contactShadow(11, 4.4, 0.7));
    return t;
  }
  const trk1 = fuelTruck(0xd8d4c8);
  trk1.position.set(26, 0.2, 30);
  trk1.rotation.y = 2.4;
  const trk2 = fuelTruck(0x4a6a8a);
  trk2.position.set(31, 0.2, 36);
  trk2.rotation.y = 2.15;
  g.add(trk1, trk2);
  // 汽车吊（桁架臂）
  {
    const cr = new THREE.Group();
    cr.userData.bake = true;
    const body = box(4.6, 1.8, 2.8, matPaint(0xc9c4bb, { rough: 0.5 }));
    body.position.y = 1.7;
    const outrig = [];
    for (const [ox, oz] of [[-2.1, -1.6], [-2.1, 1.6], [2.1, -1.6], [2.1, 1.6]]) outrig.push({ p: [ox, 0.5, oz], r: 0.16, h: 1.2 });
    instCyls(cr, steelHi, outrig, 8);
    const boomPts = [V3(-1.4, 2.6, 0), V3(-4.5, 6.4, 0), V3(-7.2, 9.6, 0), V3(-9.4, 11.6, 0)];
    cr.add(tubeAlong(boomPts, 0.28, steelMat, 18, 8));
    const hook = cyl(0.03, 0.03, 3.4, sm('hook2', () => sm('blackC', () => M(0x1e2126, 0.8, 0.3))), 5);
    hook.position.set(-9.2, 9.6, 0);
    cr.add(hook);
    const cw = [];
    for (const wx of [1.6, -1.8]) for (const wz of [-1.5, 1.5]) cw.push({ p: [wx, 0.62, wz], r: 0.62, h: 0.4, rx: Math.PI / 2 });
    instCyls(cr, sm('tyre', () => M(COL.rubber, 0.95, 0)), cw, 12);
    cr.add(contactShadow(12, 5, 0.6));
    cr.position.set(-30, 0.2, 22);
    cr.rotation.y = 0.8;
    g.add(cr);
  }
  // 测控厢式车 ×2（侧面终端屏）
  {
    for (const [px, pz, ry, key] of [[16, 46, -0.35, 'TEL-03'], [20, 51, -0.15, 'OPT-07']]) {
      const v = new THREE.Group();
      v.userData.bake = true;
      const cab = box(1.8, 1.9, 2.2, matPaint(0xe8e4da, { rough: 0.45 }));
      cab.position.set(2.6, 1.7, 0);
      const boxB = box(4.6, 2.5, 2.4, matPaint(0xf2f4f6, { rough: 0.5 }));
      boxB.position.set(-1.2, 1.9, 0);
      const scrn = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.3),
        new THREE.MeshBasicMaterial({ map: texConsoleScreen(key) }));
      scrn.position.set(-1.2, 2.1, 1.22);
      const dish = lathe(profile([[0.05, 0], [0.5, 0.16], [0.85, 0.4]]), sm('dishsm', () => sm('dishW', () => M(0xd8dcdf, 0.5, 0.15))), 14);
      dish.rotation.x = -0.9;
      dish.position.set(-2.6, 3.6, -0.6);
      const ws = [];
      for (const wx of [2.3, -2.6]) for (const wz of [-1.2, 1.2]) ws.push({ p: [wx, 0.55, wz], r: 0.55, h: 0.4, rx: Math.PI / 2 });
      instCyls(v, sm('tyre', () => M(COL.rubber, 0.95, 0)), ws, 12);
      v.add(cab, boxB, scrn, dish);
      v.add(contactShadow(9, 3.6, 0.6));
      v.position.set(px, 0.2, pz);
      v.rotation.y = ry;
      g.add(v);
    }
  }

  /* --- 旗帜（旗杆 + 五星红旗，帧循环顶点波） --- */
  function makeFlag(px, pz, h = 16) {
    const poleG = new THREE.Group();
    poleG.userData.bake = true;
    const pole = cyl(0.09, 0.14, h, sm('pole', () => sm('chromeM', () => M(COL.chrome, 0.35, 0.8))), 10);
    pole.position.set(px, h / 2, pz);
    poleG.add(pole);
    const finial = sph(0.2, sm('chromeM', () => M(COL.chrome, 0.35, 0.8)), 10, 8);
    finial.position.set(px, h, pz);
    poleG.add(finial);
    g.add(poleG);
    const fw = 5.4, fh = 3.6;
    const geo = new THREE.PlaneGeometry(fw, fh, 12, 6);
    const flag = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: texFlagCN(), side: THREE.DoubleSide, roughness: 0.85 }));
    flag.position.set(px + fw / 2 + 0.12, h - fh / 2 - 0.3, pz);
    flag.rotation.y = 1.2;
    flag.userData.noBake = true;   // 顶点动画网格，禁烘焙
    g.add(flag);
    wavyFlags.push({ mesh: flag, base: geo.attributes.position.array.slice(), phase: px });
    const sh = contactShadow(1.8, 1.8, 0.5);
    sh.position.set(px, 0.06, pz);
    g.add(sh);
  }
  makeFlag(22, 12, 17);
  makeFlag(-24, 14, 15);

  /* --- 灯杆 ×4 + 围栏 + 灌木 --- */
  {
    const poles = [];
    for (const [px, pz] of [[-30, 30], [34, 26], [-34, -8], [36, -12]]) {
      const lp = new THREE.Group();
      lp.userData.bake = true;
      const post = cyl(0.14, 0.2, 12, steelHi, 8);
      post.position.set(px, 6, pz);
      lp.add(post);
      const head = box(1.6, 0.4, 0.7, sm('lampH', () => new THREE.MeshStandardMaterial({ color: 0xf2f4f6, emissive: 0xfff2d8, emissiveIntensity: 0.85, roughness: 0.4 })));
      head.position.set(px, 12.1, pz);
      head.rotation.y = Math.atan2(-pz, -px);
      lp.add(head);
      g.add(lp);
      poles.push(post);
    }
    // 围栏（前场一周，立柱实例化 + 双横杆）
    {
      const fp = [], fr = [];
      const x0 = -44, x1 = 46, z0 = 66;
      for (let i = 0; i <= 30; i++) {
        const x = x0 + (x1 - x0) * i / 30;
        fp.push({ p: [x, 0.9, z0], s: [0.12, 1.8, 0.12] });
        if (i < 30) fr.push({ p: [x + 1.5, 1.5, z0], s: [3, 0.07, 0.07] });
      }
      instBoxes(g, steelHi, fp);
      instBoxes(g, steelHi, fr);
    }
    // 戈壁灌木（实例化低矮团簇，避开场坪）
    {
      const rnd = mulberry(57);
      const shrubs = [];
      const shrubMat = sm('shrub', () => matFabric(COL.shrub, { rough: 0.9, sheenColor: 0x6a7a4a }));
      const shrubMat2 = sm('shrub2', () => matFabric(COL.shrubDark, { rough: 0.9 }));
      for (let i = 0; i < 76; i++) {
        const a = rnd() * TAU;
        const d = 60 + rnd() * 480;
        shrubs.push({ p: [Math.cos(a) * d, 0.5 + rnd() * 0.4, Math.sin(a) * d + 30], s: [1 + rnd() * 2.4, 0.8 + rnd() * 1.2, 1 + rnd() * 2.4] });
      }
      instBoxes(g, shrubMat, shrubs.slice(0, 40));
      instBoxes(g, shrubMat2, shrubs.slice(40));
    }
  }

  /* --- 远山（岩石纹理锥体 + 远处山脊；共享材质 + 打包烘焙） --- */
  const mtnG = new THREE.Group();
  mtnG.userData.bake = true;
  const mtnMat = new THREE.MeshStandardMaterial({ map: T.rock, normalMap: T.rockN, color: COL.rock, roughness: 1 });
  const mtnMat2 = new THREE.MeshStandardMaterial({ map: T.rock, normalMap: T.rockN, color: 0x8a8276, roughness: 1 });
  for (let i = 0; i < 10; i++) {
    const a = i / 10 * TAU + 0.35;
    const d = 300 + (i % 3) * 110;
    const m = new THREE.Mesh(new THREE.ConeGeometry(70 + (i % 4) * 30, 46 + (i * 13) % 64, 7), mtnMat);
    m.position.set(Math.cos(a) * d, 14, Math.sin(a) * d - 70);
    m.rotation.y = i * 1.7;
    mtnG.add(m);
  }
  for (let i = 0; i < 5; i++) {
    const a = i / 5 * TAU + 1.1;
    const m = new THREE.Mesh(new THREE.ConeGeometry(260, 60 + i * 14, 5), mtnMat2);
    m.position.set(Math.cos(a) * 620, 20, Math.sin(a) * 620 - 120);
    mtnG.add(m);
  }
  g.add(mtnG);

  /* --- 场景扩展（厂房 / 雷达站 / 管廊 / 消防 / 夜灯，p8） --- */
  buildSiteExtras(g, tex);
  siteDetailPass(g, tex);
  siteDetailPass2(g, tex);
  siteDetailPass3(g, tex);

  /* --- 发射场静态合批（压 draw call） --- */
  sweepLoose(g);          // 散件归拢成一包烘焙（旗面/摆杆等动态件已 noBake 跳过）
  bakeAll(g);

  /* --- 发射场标注（第 1 章 / 档案章开启） --- */
  RKT.siteLabels = [
    ['酒泉卫星发射场', 0, 34, 118, COL.label],
    ['固定勤务塔 · 脐带摆杆', 10, 66, -10, COL.labelBlue],
    ['导流槽 · 喷水降温', -10, 8, -30, COL.labelGreen],
    ['避雷塔', -42, 96, -34, COL.labelViolet],
    ['测控楼', 62, 22, -42, COL.label],
  ].map(([t, x, y, z, c]) => {
    const s = lbl(t, c, 0.06);
    s.position.set(x, y, z);
    g.add(s);
    return s;
  });
  RKT.siteLabels.forEach((s) => { s.visible = false; });
}
/* ---------------- 长征二号F 箭体建模（车削放样 + 法兰螺栓 + 电缆罩扫掠 + 发动机簇） ----------------
 * 分组：s1（一级：船尾裙 + 主筒 + 热分离排焰窗 + 4 主机 + 2 游机 + 推力穹顶）/
 *       s2（二级：主筒 + 级间段 + 4 游机）/ fair（整流罩：冯·卡门头锥 + 剖分缝 + 徽标 + 蓝带，
 *       内部藏神舟三舱段可剖视）/ tower（逃逸塔：4 固体机 + 上喷管 + 格构脊 + 避振头锥）/
 *       boosters（助推 ×4：主筒 + 尖锥头 + 单喷管）。
 * 材质：箭体白漆走 matPaint（clearcoat），金属件 metalness 分区，橡胶/织物走 matFabric。 */

const RKT = { parts: {}, flames: {}, built: false, padY: 2.5 };

/** 发动机钟形喷管（车削 + 再生冷却肋环 + 内壁暗面） */
function makeNozzle(throatR = 0.3, exitR = 0.62, h = 1.6, mat) {
  const g = new THREE.Group();
  const pts = profile([
    [throatR * 0.55, 0], [throatR, -0.12], [throatR * 0.86, -h * 0.22],
    [throatR * 0.78, -h * 0.45], [exitR * 0.82, -h * 0.75], [exitR, -h],
  ]);
  const bell = lathe(pts, mat, 20);
  bell.material.side = THREE.DoubleSide;
  g.add(bell);
  // 再生冷却肋环（3 道）
  const ribMat = sm('nozrib', () => sm('chrDeep', () => sm('chrDeep', () => M(COL.chromeDeep, 0.45, 0.7))));
  for (const [ry, rr] of [[-h * 0.28, throatR * 0.82], [-h * 0.52, throatR * 0.9], [-h * 0.78, exitR * 0.9]]) {
    const rib = torus(rr, 0.02, ribMat, 18, 6);
    rib.rotation.x = Math.PI / 2;
    rib.position.y = ry;
    g.add(rib);
  }
  // 喉部衬环（高温发蓝）
  const throatRing = torus(throatR * 0.62, 0.035, sm('throat', () => M(0x4a3a5a, 0.6, 0.6)), 14, 6);
  throatRing.rotation.x = Math.PI / 2;
  throatRing.position.y = -0.02;
  g.add(throatRing);
  return g;
}

/** 推力穹顶（喷管上方的承力/防热隔板） */
function thrustDome(r, mat) {
  const dome = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 8, 0, TAU, 0, Math.PI / 2.6), mat);
  dome.rotation.x = Math.PI;
  return dome;
}

/** 暗色排焰窗贴片（热分离燃气出口，级间段四面） */
function exhaustPortDecal(w = 0.9, h = 0.55) {
  return ctex('export', () => {
    const S = 128;
    const cv = document.createElement('canvas');
    cv.width = S; cv.height = S;
    const ctx = cv.getContext('2d');
    const g = ctx.createRadialGradient(S / 2, S / 2, 4, S / 2, S / 2, S / 2);
    g.addColorStop(0, '#14161a');
    g.addColorStop(0.7, '#23262b');
    g.addColorStop(1, 'rgba(35,38,43,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, S, S);
    ctx.strokeStyle = 'rgba(200,205,210,0.5)';
    ctx.lineWidth = 4;
    ctx.strokeRect(S * 0.2, S * 0.3, S * 0.6, S * 0.4);
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  });
}
function exhaustPort(mat, w = 0.9, h = 0.55) {
  const shared = sm('exportM', () => new THREE.MeshBasicMaterial({ map: exhaustPortDecal(), transparent: true, depthWrite: false }));
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), shared);
}

/** 神舟飞船三舱段（轨道舱 + 返回舱 + 推进舱 + 翼），scale 可调；orbit 用展翼版 */
function buildShipModel({ wingSpan = true, mark = true, scale = 1 } = {}) {
  const g = new THREE.Group();
  const mW = matPaint(0xe8ecef, { rough: 0.3 });
  const mCov = matFabric(0x4a4f47, { rough: 0.8 });       // 返回舱防热灰
  const mDark = sm('darkM', () => M(COL.darkMetal, 0.6, 0.4));
  // 推进舱（尾段圆柱 + 裙摆）
  const propLen = 0.42;
  const prop = cyl(0.07, 0.095, propLen, M(0x9aa3ac, 0.55, 0.4), 16);
  prop.rotation.z = -Math.PI / 2;
  prop.position.x = -0.42;
  const propSkirt = cyl(0.095, 0.11, 0.1, mDark, 16);
  propSkirt.rotation.z = -Math.PI / 2;
  propSkirt.position.x = -0.6;
  // 4 台姿控发动机（推进舱尾部十字）
  for (let i = 0; i < 4; i++) {
    const a = i / 4 * TAU;
    const nz = cone(0.03, 0.08, mDark, 8);
    nz.rotation.z = Math.PI / 2;
    nz.position.set(-0.66, Math.cos(a) * 0.075, Math.sin(a) * 0.075);
    g.add(nz);
  }
  // 返回舱（钟形，钝头朝 -x）
  const ret = lathe(profile([[0.02, 0], [0.095, 0.05], [0.105, 0.14], [0.085, 0.2]]), mCov, 18);
  ret.rotation.z = -Math.PI / 2;
  ret.position.x = -0.27;
  // 大底（烧蚀）
  const shield = cyl(0.105, 0.1, 0.045, new THREE.MeshStandardMaterial({ map: texAblation(), roughness: 0.9 }), 18);
  shield.rotation.z = Math.PI / 2;
  shield.position.x = -0.335;
  // 轨道舱（前段圆柱 + 球台前缘 + 舷窗）
  const orb = cyl(0.085, 0.095, 0.3, mW, 16);
  orb.rotation.z = -Math.PI / 2;
  orb.position.x = 0.02;
  const orbNose = new THREE.Mesh(new THREE.SphereGeometry(0.085, 14, 8), mW);
  orbNose.rotation.z = -Math.PI / 2;
  orbNose.scale.set(1.6, 1, 1);
  orbNose.position.x = 0.19;
  const winMat = sm('shipwin', () => new THREE.MeshStandardMaterial({ color: 0x183248, emissive: 0x2a5a8a, emissiveIntensity: 0.4, roughness: 0.2, metalness: 0.1 }));
  for (const wz of [-1, 1]) {
    const win = cyl(0.03, 0.03, 0.02, winMat, 10);
    win.rotation.x = Math.PI / 2;
    win.position.set(0.06, 0.06, wz * 0.06);
    g.add(win);
  }
  // 对接机构（前端环）
  const dockRing = torus(0.07, 0.02, sm('dockring', () => sm('chromeM', () => M(COL.chrome, 0.35, 0.8))), 16, 8);
  dockRing.rotation.y = Math.PI / 2;
  dockRing.position.x = 0.26;
  g.add(dockRing);
  // 太阳翼（双翼 ×2 段，cell 纹理）
  if (wingSpan) {
    const cellMat = new THREE.MeshStandardMaterial({ map: texSolarCells(), roughness: 0.4, metalness: 0.25, side: THREE.DoubleSide });
    for (const s of [-1, 1]) {
      const wingRoot = box(0.16, 0.02, 0.05, mDark);
      wingRoot.position.set(-0.35, s * 0.12, 0);
      const wingA = box(0.5, 0.012, 0.2, cellMat);
      wingA.position.set(-0.35, s * 0.34, 0);
      const wingB = box(0.5, 0.012, 0.2, cellMat);
      wingB.position.set(-0.35, s * 0.72, 0);
      const hinge = box(0.05, 0.05, 0.05, mDark);
      hinge.position.set(-0.35, s * 0.52, 0);
      g.add(wingRoot, wingA, wingB, hinge);
    }
    // 翼梁（细杆）
    for (const s of [-1, 1]) {
      const boom = cyl(0.012, 0.012, 0.62, mDark, 6);
      boom.position.set(-0.35, s * 0.53, 0);
      g.add(boom);
    }
  } else {
    // 折叠翼（整流罩内状态）：贴壁小板
    for (const s of [-1, 1]) {
      const wingFold = box(0.42, 0.015, 0.1, new THREE.MeshStandardMaterial({ map: texSolarCells(), roughness: 0.4, metalness: 0.25 }));
      wingFold.position.set(-0.35, s * 0.1, 0);
      wingFold.rotation.x = s * 0.25;
      g.add(wingFold);
    }
  }
  // 测控天线（刀形 + 小碟）
  const blade = box(0.01, 0.1, 0.04, mDark);
  blade.position.set(0.1, 0.1, 0.08);
  const dishS = lathe(profile([[0.01, 0], [0.06, 0.02], [0.1, 0.05]]), sm('dishxs', () => sm('dishW', () => M(0xd8dcdf, 0.5, 0.15))), 12);
  dishS.rotation.x = -1.2;
  dishS.position.set(-0.5, 0.06, 0.08);
  g.add(blade, dishS);
  // 铭牌
  if (mark) {
    const markTex = texShenzhouMark('SHENZHOU');
    const decal = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.07),
      new THREE.MeshBasicMaterial({ map: markTex, transparent: true, depthWrite: false }));
    decal.position.set(-0.42, 0, 0.098);
    decal.rotation.x = -0.06;
    g.add(decal);
    const decal2 = decal.clone();
    decal2.position.z = -0.098;
    decal2.rotation.set(0.06, Math.PI, 0);
    g.add(decal2);
  }
  g.scale.setScalar(scale);
  return g;
}

/** 整支 CZ-2F（懒建一次） */
function buildRocket() {
  const g = new THREE.Group();
  const white = matPaint(COL.hull, { rough: 0.34 });
  const white2 = matPaint(COL.hullShade, { rough: 0.42 });
  const red = matPaint(COL.bandRed, { rough: 0.4 });
  const redDeep = matPaint(COL.bandRedDeep, { rough: 0.5 });
  const dark = sm('darkM', () => M(COL.darkMetal, 0.6, 0.4));
  const chrome = sm('chromeM', () => M(COL.chrome, 0.35, 0.8));
  const nozMat = sm('noz', () => new THREE.MeshStandardMaterial({ color: 0x3d434c, roughness: 0.55, metalness: 0.72, side: THREE.DoubleSide }));
  const boltMat = sm('bolt', () => sm('chrDeep', () => M(COL.chromeDeep, 0.45, 0.7)));

  /* --- 一级（s1） --- */
  const s1 = new THREE.Group();
  // 船尾裙（外张车削）
  const boat = lathe(profile([[1.86, 0], [1.8, 0.5], [1.68, 1.2], [1.66, 2.2]]), white2, 28);
  s1.add(boat);
  // 主筒（带面板微缝纹理的亮漆）
  const body1 = cyl(1.65, 1.65, 26.4, white, 32);
  body1.position.y = 14.9;
  s1.add(body1);
  // 环向法兰 + 螺栓圈（三道分段）
  const flangeMat = sm('flange', () => M(COL.hullJoint, 0.5, 0.35));
  for (const fy of [2.4, 15.6, 26.6]) {
    const fr = cyl(1.68, 1.68, 0.22, flangeMat, 32);
    fr.position.y = fy;
    s1.add(fr);
    boltRing(s1, { r: 1.66, y: fy + 0.16, n: 28, size: 0.05, hgt: 0.07, mat: boltMat });
  }
  // 红色环带（上下两道）
  const band1 = cyl(1.66, 1.66, 1.1, red, 32);
  band1.position.y = 27.6;
  s1.add(band1);
  const band1b = cyl(1.66, 1.66, 0.5, red, 32);
  band1b.position.y = 4.6;
  s1.add(band1b);
  // 侧标语（中国航天 竖排，±z 两面）
  {
    const texT = texTextStrip('中国航天', { w: 96, h: 460, size: 82, vertical: true });
    for (const sz of [-1, 1]) {
      const decal = new THREE.Mesh(new THREE.PlaneGeometry(1.05, 6.4),
        new THREE.MeshBasicMaterial({ map: texT, transparent: true, depthWrite: false }));
      decal.position.set(0, 16.5, sz * 1.665);
      if (sz < 0) decal.rotation.y = Math.PI;
      decal.rotation.x = sz > 0 ? 0.02 : -0.02;
      s1.add(decal);
    }
  }
  // 国旗徽牌（红/黄小块）
  {
    const decal = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.42),
      new THREE.MeshBasicMaterial({ map: texFlagCN(), transparent: false, depthWrite: true }));
    decal.position.set(1.1, 22.6, 1.28);
    decal.rotation.set(-0.05, -0.6, 0);
    s1.add(decal);
  }
  // 推力穹顶 + 4 主发动机 + 游机
  const dome1 = thrustDome(1.6, dark);
  dome1.position.y = 3.4;
  s1.add(dome1);
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2 + Math.PI / 4;
    const nx = Math.cos(a) * 0.92, nz2 = Math.sin(a) * 0.92;
    const nz = makeNozzle(0.3, 0.68, 1.7, nozMat);
    nz.position.set(nx, -0.05, nz2);
    s1.add(nz);
    // 燃烧室上体 + 涡轮泵匣
    const chamber = cyl(0.36, 0.3, 0.7, dark, 14);
    chamber.position.set(nx, 0.6, nz2);
    s1.add(chamber);
    const pump = box(0.42, 0.4, 0.42, sm('pump', () => sm('darkHi', () => M(COL.darkMetalHi, 0.6, 0.5))));
    pump.position.set(nx * 0.8, 1.15, nz2 * 0.8);
    pump.rotation.y = a;
    s1.add(pump);
    // 输送管（曲线管 连接穹顶）
    const line = tubeAlong([
      V3(nx * 0.4, 2.6, nz2 * 0.4),
      V3(nx * 0.85, 1.6, nz2 * 0.85),
      V3(nx, 0.9, nz2),
    ], 0.09, chrome, 12, 6);
    s1.add(line);
  }
  // 2 台游机（十字正方向小喷管）
  for (let i = 0; i < 2; i++) {
    const a = i * Math.PI;
    const nz = makeNozzle(0.14, 0.3, 0.75, nozMat);
    nz.position.set(Math.cos(a) * 1.35, -0.1, Math.sin(a) * 1.35);
    nz.rotation.z = Math.PI / 2;
    nz.rotation.y = a;
    s1.add(nz);
  }
  g.add(s1);

  /* --- 二级（s2） --- */
  const s2 = new THREE.Group();
  // 级间段（含排焰窗）
  const inter = cyl(1.68, 1.66, 1.5, white2, 32);
  inter.position.y = 0.75;
  s2.add(inter);
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2 + Math.PI / 4;
    const port = exhaustPort();
    port.position.set(Math.cos(a) * 1.685, 0.75, Math.sin(a) * 1.685);
    port.rotation.y = -a + Math.PI / 2;
    s2.add(port);
  }
  const fl2 = cyl(1.69, 1.69, 0.2, flangeMat, 32);
  fl2.position.y = 1.72;
  s2.add(fl2);
  // （二级法兰螺栓圈为守预算精简，一级三道螺栓圈保留）
  const body2 = cyl(1.65, 1.65, 14.6, white, 32);
  body2.position.y = 9.1;
  s2.add(body2);
  const band2 = cyl(1.66, 1.66, 0.9, new THREE.MeshStandardMaterial({ color: COL.cncBlue, roughness: 0.5, metalness: 0.05 }), 32);
  band2.position.y = 15.6;
  s2.add(band2);
  const dome2 = thrustDome(1.55, dark);
  dome2.position.y = 2.9;
  s2.add(dome2);
  // 二级主机（大喷管居中）+ 4 游机
  const nz2Main = makeNozzle(0.4, 0.92, 2.05, nozMat);
  nz2Main.position.y = 1.6;
  s2.add(nz2Main);
  const cham2 = cyl(0.44, 0.38, 0.8, dark, 14);
  cham2.position.y = 2.5;
  s2.add(cham2);
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2 + Math.PI / 4;
    const vn = makeNozzle(0.12, 0.26, 0.6, nozMat);
    vn.position.set(Math.cos(a) * 1.28, 1.7, Math.sin(a) * 1.28);
    s2.add(vn);
  }
  // 二级段电缆罩（下半段）
  {
    const race = sweepProfile(
      [V3(1.7, -0.2, 0), V3(1.74, 7, 0.06), V3(1.7, 15.5, 0)],
      (t) => lerp(0.3, 0.24, t),
      () => 0.18,
      matPaint(COL.raceway, { rough: 0.5 }), 24, 2,
    );
    s2.add(race);
  }
  s2.position.y = 28.8;
  g.add(s2);

  /* --- 整流罩（fair，独立材质组支持剖视 ghost） --- */
  const fair = new THREE.Group();
  const fairWhite = matPaint(COL.hull, { rough: 0.3 });   // 独立实例，便于剖视透明化
  const fc = cyl(2.1, 2.1, 5, fairWhite, 32);
  fc.position.y = 2.5;
  fair.add(fc);
  // 冯·卡门头锥（渐减半径椭圆线型车削）
  const tipPts = [];
  for (let i = 0; i <= 16; i++) {
    const t = i / 16;
    tipPts.push(V2(2.1 * Math.sqrt(1 - t * t) * 0.94 + 0.14 * (1 - t), 5 + t * 8.2));
  }
  const ftip = lathe(tipPts, fairWhite, 32);
  fair.add(ftip);
  // 剖分缝（筒段两道竖线 + 头锥沿型面的曲线缝线）
  const seamMat = sm('seam', () => M(0x9aa0a6, 0.6, 0.2));
  for (const sx of [-1, 1]) {
    const seam = box(0.05, 4.8, 0.06, seamMat);
    seam.position.set(sx * 2.12, 2.5, 0);
    fair.add(seam);
    fair.add(tubeAlong(
      [V3(sx * 2.11, 5, 0), V3(sx * 1.96, 7.6, 0), V3(sx * 1.28, 10.6, 0), V3(sx * 0.26, 13.1, 0)],
      0.035, seamMat, 16, 5,
    ));
  }
  // 蓝色标语带（环绕 texFairingBand）
  const bandF = cyl(2.13, 2.13, 1.15, new THREE.MeshStandardMaterial({ map: texFairingBand(), roughness: 0.5, metalness: 0.04 }), 32);
  bandF.position.y = 4.4;
  fair.add(bandF);
  // 圆形徽标（两侧，共享材质）
  {
    const emTex = texEmblem();
    const emMat = sm('emblemM', () => new THREE.MeshBasicMaterial({ map: emTex, transparent: true, depthWrite: false }));
    for (const sz of [-1, 1]) {
      const em = new THREE.Mesh(new THREE.CircleGeometry(1.05, 28), emMat);
      em.position.set(0.02, 2.6, sz * 2.115);
      if (sz < 0) em.rotation.y = Math.PI;
      fair.add(em);
    }
  }
  // 神舟铭牌（头锥下方）
  {
    const mk = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.56),
      new THREE.MeshBasicMaterial({ map: texShenzhouMark('SZ'), transparent: true, depthWrite: false }));
    mk.position.set(0, 6.6, 2.12);
    fair.add(mk);
  }
  fair.position.y = 45.4;
  g.add(fair);

  // 整流罩内的神舟（剖视时可见）
  const shipIn = buildShipModel({ wingSpan: false, scale: 1.7 });
  shipIn.rotation.z = -Math.PI / 2;
  shipIn.position.set(0, 49.6, 0);
  shipIn.visible = false;
  g.add(shipIn);
  RKT.shipIn = shipIn;

  /* --- 逃逸塔（tower） --- */
  const tower = new THREE.Group();
  const towerRed = matPaint(COL.bandRed, { rough: 0.42 });
  // 塔身（格构脊：4 主杆 + 横撑）
  const spine = cyl(0.3, 0.42, 4.6, towerRed, 12);
  spine.position.y = 2.3;
  tower.add(spine);
  const rods = [];
  for (const [dx, dz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
    rods.push({ p: [dx * 0.24, 2.3, dz * 0.24], s: [0.07, 4.6, 0.07] });
    for (let i = 1; i <= 3; i++) rods.push({ p: [dx * 0.3, i * 1.15, dz * 0.3], s: [0.045, 0.045, 0.85] });
  }
  instBoxes(tower, sm('tred', () => matPaint(0x992a1f, { rough: 0.5 })), rods);
  // 4 台固体发动机（斜置 + 上喷管）
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2 + Math.PI / 4;
    const mtr = cyl(0.16, 0.2, 1.5, towerRed, 12);
    mtr.position.set(Math.cos(a) * 0.3, 3.6, Math.sin(a) * 0.3);
    mtr.rotation.z = Math.cos(a) * 0.34;
    mtr.rotation.x = -Math.sin(a) * 0.34;
    tower.add(mtr);
    const upNoz = cone(0.13, 0.42, nozMat, 10, true);
    upNoz.position.set(Math.cos(a) * 0.42, 4.5, Math.sin(a) * 0.42);
    upNoz.rotation.z = Math.PI * 0.06 + Math.cos(a) * 0.3;
    upNoz.rotation.x = -Math.sin(a) * 0.3;
    tower.add(upNoz);
  }
  // 顶部整流头锥 + 避振帽
  const cap = cone(0.34, 1.3, towerRed, 14);
  cap.position.y = 5.2;
  tower.add(cap);
  const padTop2 = sph(0.3, towerRed, 12, 8);
  padTop2.position.y = 5.9;
  tower.add(padTop2);
  // 底部塔架裙（连接整流罩）
  const skirtT = cyl(0.62, 1.2, 1.3, towerRed, 14);
  skirtT.position.y = -0.4;
  tower.add(skirtT);
  tower.position.y = 58.8;
  g.add(tower);

  /* --- 助推器 ×4 --- */
  const boosters = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const b = new THREE.Group();
    const bd = cyl(1.1, 1.15, 24.6, white2, 22);
    bd.position.y = 12.5;
    const flb = cyl(1.16, 1.16, 0.2, flangeMat, 22);
    flb.position.y = 1.8;
    const bn = cyl(1.11, 1.11, 0.8, red, 22);
    bn.position.y = 23.8;
    // 尖锥头（助推器头锥 · 略带弧度）
    const tipB = lathe(profile([[1.1, 0], [1.08, 0.7], [0.8, 1.6], [0.36, 2.4], [0.05, 2.9]]), white2, 22);
    tipB.position.y = 24.2;
    // 单主喷管
    const bnoz = makeNozzle(0.26, 0.56, 1.4, nozMat);
    bnoz.position.y = 0.15;
    const domeB = thrustDome(1.0, dark);
    domeB.position.y = 1.5;
    // 助推器头锥顶部小天线
    const ant = cyl(0.03, 0.05, 0.5, chrome, 6);
    ant.position.y = 27.4;
    b.add(bd, flb, bn, tipB, bnoz, domeB, ant);
    const a = i * Math.PI / 2 + Math.PI / 4;
    b.position.set(Math.cos(a) * 2.62, 0, Math.sin(a) * 2.62);
    // 助推器顶与二段连杆（前点连杆 + 后点连杆）
    const linkF = box(0.16, 1.6, 0.16, sm('link', () => sm('darkHi', () => M(COL.darkMetalHi, 0.6, 0.5))));
    linkF.position.set(0, 25.4, 0);
    b.add(linkF);
    boosters.add(b);
  }
  // 助推器法兰螺栓（四根合一份 InstancedMesh：4×18 颗 1 个 draw call）
  {
    const nPer = 18;
    const inst = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.045, 0.045, 0.06, 6), boltMat, nPer * 4);
    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    let k = 0;
    boosters.children.forEach((b) => {
      for (let i = 0; i < nPer; i++) {
        const a = i / nPer * TAU;
        m4.compose(V3(Math.cos(a) * 1.14, 1.95, Math.sin(a) * 1.14), q.identity(), V3(1, 1, 1));
        inst.setMatrixAt(k++, m4);
      }
    });
    inst.instanceMatrix.needsUpdate = true;
    boosters.add(inst);
  }
  // 尾部尾翼（CZ-2F 一级尾段有 4 片稳定尾翼）
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2;
    const finShape = new THREE.Shape();
    finShape.moveTo(0, 0);
    finShape.lineTo(1.35, -1.6);
    finShape.lineTo(1.35, -0.4);
    finShape.lineTo(0.25, 0.9);
    finShape.closePath();
    const finGeo = new THREE.ExtrudeGeometry(finShape, { depth: 0.14, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 1 });
    const fin = new THREE.Mesh(finGeo, white2);
    fin.position.set(Math.cos(a + Math.PI / 2) * 1.5, 3.6, Math.sin(a + Math.PI / 2) * 1.5);
    fin.rotation.y = -a - Math.PI / 2 + Math.PI;
    g.add(fin);
  }
  g.add(boosters);

  /* --- 发动机火焰（一级 / 二级 各一组：主锥 + 双侧焰舌 + 辉光芯） --- */
  function makeFlame(len, r) {
    const fg = new THREE.Group();
    const coreMat = new THREE.MeshBasicMaterial({ color: COL.flameCore, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false });
    const midMat = new THREE.MeshBasicMaterial({ color: COL.flameMid, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false });
    const core = new THREE.Mesh(new THREE.ConeGeometry(r * 0.55, len * 0.6, 12, 1, true), coreMat);
    core.rotation.x = Math.PI;
    core.position.y = -len * 0.3;
    const mid = new THREE.Mesh(new THREE.ConeGeometry(r, len, 14, 1, true), midMat);
    mid.rotation.x = Math.PI;
    mid.position.y = -len / 2;
    const glow = glowSprite(r * 10, '255,190,110', 0.85);
    glow.position.y = -len * 0.5;
    fg.add(core, mid, glow);
    fg.visible = false;
    return fg;
  }
  const f1 = makeFlame(12, 1.7); f1.position.y = -1.55; g.add(f1);
  const f2 = makeFlame(9.5, 1.15); f2.position.y = 28.3; g.add(f2);
  RKT.flames.s1 = f1; RKT.flames.s2 = f2;

  RKT.g = g;
  RKT.parts = { s1, s2, fair, tower, boosters };
  // 整流罩外壳材质收集（剖视 ghost 用，独立于箭体白漆实例）
  RKT.fairMats = [];
  fair.traverse((o) => {
    if (o.material && !o.material.transparent && !RKT.fairMats.includes(o.material)) RKT.fairMats.push(o.material);
  });
  // 静态分级整体烘焙（按材质合批，压 draw call；火焰/摆杆等动态件不受影响）
  [s1, s2, fair, tower, boosters].forEach((grpX) => { grpX.userData.bake = true; });
  RKT.built = true;
  rocketDetailPass();
  rocketDetailPass2();
  rocketDetailPass3();
  sweepLoose(g);          // 细节轮散件归拢成一包烘焙
  bakeAll(g);
  scene.add(g);
  return g;
}

/** 部件标注精灵（第 1 章） */
function addLabels() {
  if (RKT.labels) return;
  const defs = [
    ['逃逸塔（逃逸救生系统）', 60.5, '#ff9b7a'],
    ['整流罩 · 神舟飞船', 49.5, '#ffd166'],
    ['二级（真空发动机）', 37, '#8fd3ff'],
    ['一级 + 助推器 ×4', 15, '#b7f5a5'],
  ];
  RKT.labels = defs.map(([t, y, c]) => {
    const s = lbl(t, c, 0.05);
    s.position.set(9.5, y, 0);
    RKT.g.add(s);
    return s;
  });
}

/* ---------------- 旗帜顶点波 + 航空灯呼吸（每帧轻量） ---------------- */

function stepSiteFx(dt) {
  const t = performance.now() * 0.001;
  wavyFlags.forEach((f) => {
    const pos = f.mesh.geometry.attributes.position;
    const base = f.base;
    for (let i = 0; i < pos.count; i++) {
      const bx = base[i * 3], by = base[i * 3 + 1];
      // x: 0..fw，远离旗杆振幅增大
      const k = (bx + 2.7) / 5.4;
      pos.array[i * 3 + 2] = Math.sin(t * 3 + f.phase + k * 4.4) * 0.34 * k + Math.sin(t * 5.2 + k * 7) * 0.12 * k;
    }
    pos.needsUpdate = true;
  });
  const pulse = 0.55 + Math.sin(t * 2.6) * 0.45;
  padBeacons.forEach((b) => { b.material.opacity = pulse * 0.9; });
}
/* ---------------- 返回舱模型（再入 / 着陆两章共用） ----------------
 * 本体坐标：防热大底在 y=0（钝头朝下），钟形侧壁向上收顶，顶带伞舱盖与信标天线。 */

function buildCapsuleModel(scale = 1) {
  const g = new THREE.Group();
  const wall = matFabric(COL.ablation, { rough: 0.82, sheenColor: 0x8a8478 });
  const pts = profile([[0.14, 1.28], [0.3, 1.1], [0.46, 0.72], [0.56, 0.32], [0.6, 0.06]]);
  const body = lathe(pts, wall, 22);
  body.material.side = THREE.DoubleSide;
  g.add(body);
  // 防热大底（烧蚀纹理浅球冠）
  const shield = new THREE.Mesh(new THREE.SphereGeometry(0.585, 26, 10, 0, TAU, 0, Math.PI / 2.35),
    new THREE.MeshStandardMaterial({ map: texAblation(), roughness: 0.92 }));
  shield.rotation.x = Math.PI / 2;
  shield.scale.y = 0.42;
  shield.position.y = 0.02;
  g.add(shield);
  // 大底烧蚀余温（微弱自发光，再入时加强）
  const heatGlow = glowSprite(1.6, '255,120,50', 0.0);
  heatGlow.position.y = -0.15;
  g.add(heatGlow);
  // 侧壁防热环带（深色陶瓷瓦分界线）
  const belt = torus(0.475, 0.03, sm('capbelt', () => M(0x33302a, 0.85, 0.1)), 22, 6);
  belt.rotation.x = Math.PI / 2;
  belt.position.y = 0.62;
  g.add(belt);
  // 伞舱盖（顶部凸台）
  const hatch = cyl(0.14, 0.17, 0.16, M(0x54503e, 0.75, 0.2), 12);
  hatch.position.y = 1.32;
  g.add(hatch);
  // 信标闪光灯 + 短波天线
  const beacon = glowSprite(0.8, '255,80,60', 0.0);
  beacon.position.y = 1.5;
  g.add(beacon);
  const ant = cyl(0.015, 0.025, 0.4, sm('capant', () => sm('chrDeep', () => sm('chrDeep', () => M(COL.chromeDeep, 0.45, 0.7)))), 6);
  ant.position.set(0.24, 1.32, 0);
  ant.rotation.z = 0.5;
  g.add(ant);
  // 舷窗（侧壁小圆窗）
  const winMat = sm('capwin', () => new THREE.MeshStandardMaterial({ color: 0x182838, emissive: 0x2a5a8a, emissiveIntensity: 0.5, roughness: 0.2 }));
  for (const sz of [-1, 1]) {
    const w = cyl(0.07, 0.07, 0.03, winMat, 12);
    w.rotation.x = Math.PI / 2;
    w.position.set(0.14, 0.62, sz * 0.52);
    g.add(w);
  }
  capRCSAdd(g);
  g.userData.bake = true;   // 返回舱静态件合批（信标/内透精灵不烘焙）
  g.scale.setScalar(scale);
  g.userData.beacon = beacon;
  g.userData.heatGlow = heatGlow;
  return g;
}

/* ---------------- 在轨段场景（地球 + 大气辉光 + 天宫空间站 + 神舟） ---------------- */

function buildOrbit(g, tex) {
  const R = 1.6;
  const key = new THREE.DirectionalLight(0xfff5e8, 2.1);
  key.position.set(3.4, 2.2, 4.5);
  g.add(key);
  const fillO = new THREE.DirectionalLight(0x6a8ab8, 0.3);
  fillO.position.set(-4, -1.5, -3);
  g.add(fillO);
  // 地球本体：昼面贴图 + 法线 + 夜面灯光自发光 + 海面镜面
  const earthMat = new THREE.MeshStandardMaterial({
    map: tex.earthDay, normalMap: tex.earthNormal, normalScale: new THREE.Vector2(0.85, 0.85),
    roughnessMap: tex.earthSpec, roughness: 1, metalness: 0.0,
    emissiveMap: tex.earthLights, emissive: new THREE.Color(COL.earthNight), emissiveIntensity: 0.85,
  });
  const earth = new THREE.Mesh(new THREE.SphereGeometry(R, 56, 40), earthMat);
  g.add(earth);
  // 云层
  const clouds = new THREE.Mesh(new THREE.SphereGeometry(R * 1.012, 48, 32),
    new THREE.MeshStandardMaterial({ map: tex.earthClouds, transparent: true, opacity: 0.5, depthWrite: false, roughness: 1 }));
  g.add(clouds);
  // 大气边缘辉光（自写 Fresnel 边缘发光：视线与法线夹角越大越亮）
  const atmoMat = new THREE.ShaderMaterial({
    transparent: true, side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false,
    uniforms: {
      uColor: { value: new THREE.Color(COL.atmoBlue) },
      uPower: { value: 3.4 },
      uIntensity: { value: 0.85 },
    },
    vertexShader: /* glsl */`
      varying vec3 vN; varying vec3 vV;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vN = normalize(normalMatrix * normal);
        vV = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uColor; uniform float uPower; uniform float uIntensity;
      varying vec3 vN; varying vec3 vV;
      void main() {
        float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), uPower);
        gl_FragColor = vec4(uColor, f * uIntensity);
      }`,
  });
  const atmo = new THREE.Mesh(new THREE.SphereGeometry(R * 1.055, 40, 28), atmoMat);
  g.add(atmo);
  g.userData.earth = earth;
  g.userData.clouds = clouds;
  g.userData.R = R;
  earth.rotation.y = 2;
  // 轨道环（带倾角）
  const ring = circleLine(R * 1.28, COL.orbitLine, 180, 'y');
  ring.rotation.x = 0.5;
  g.add(ring);
  g.userData.ring = ring;
  const ring2 = circleLine(R * 1.28, 0x3a6a9a, 120, 'y');
  ring2.rotation.x = 0.5;
  ring2.rotation.y = 0.12;
  ring2.scale.setScalar(1.001);
  g.add(ring2);
  g.userData.ring2 = ring2;
  // 速度方向箭头（随船）
  const vArrow = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.07, 8), new THREE.MeshBasicMaterial({ color: COL.orbitLine }));
  vArrow.visible = false;
  g.add(vArrow);
  g.userData.vArrow = vArrow;
  // 神舟（展翼版）
  const ship = buildShipModel({ wingSpan: true, scale: 0.62 });
  ship.userData.bake = true;
  g.add(ship);
  g.userData.ship = ship;
  // 天宫空间站（天和核心舱 + 两实验舱 + 大帆板，T 字构型）
  const station = new THREE.Group();
  const stBody = matPaint(COL.stationBody, { rough: 0.35 });
  const stGold = M(COL.stationGold, 0.4, 0.6);
  const stDark = sm('darkM', () => M(COL.darkMetal, 0.6, 0.4));
  const coreLen = 0.62;
  const core = cyl(0.075, 0.075, coreLen, stBody, 16);
  core.rotation.z = Math.PI / 2;
  station.add(core);
  // 节点舱（前端球台 + 对接端口）
  const node = sph(0.085, stBody, 14, 10);
  node.position.x = coreLen / 2 + 0.05;
  station.add(node);
  const hub = cyl(0.06, 0.08, 0.1, stGold, 14);
  hub.rotation.z = Math.PI / 2;
  hub.position.x = coreLen / 2 + 0.13;
  station.add(hub);
  const portRing = torus(0.05, 0.012, sm('stport', () => sm('chromeM', () => M(COL.chrome, 0.35, 0.8))), 16, 8);
  portRing.rotation.y = Math.PI / 2;
  portRing.position.x = coreLen / 2 + 0.19;
  station.add(portRing);
  // 两实验舱（垂直于核心舱的 T 臂）
  for (const s of [-1, 1]) {
    const lab = cyl(0.052, 0.06, 0.4, stBody, 14);
    lab.position.set(coreLen / 2 - 0.16, s * 0.24, 0);
    station.add(lab);
    const labHub = cyl(0.03, 0.045, 0.08, stGold, 12);
    labHub.position.set(coreLen / 2 - 0.16, s * 0.06, 0);
    station.add(labHub);
    // 舱端帆板（一对）
    const cellMat = new THREE.MeshStandardMaterial({ map: texSolarCells(), roughness: 0.4, metalness: 0.25, side: THREE.DoubleSide });
    for (const w of [-1, 1]) {
      const wing = box(0.4, 0.01, 0.14, cellMat);
      wing.position.set(coreLen / 2 - 0.16, s * (0.46 + 0.2), w * 0.16);
      station.add(wing);
    }
  }
  // 核心舱后端大帆板（双侧各两片）
  const cellBig = new THREE.MeshStandardMaterial({ map: texSolarCells(), roughness: 0.42, metalness: 0.25, side: THREE.DoubleSide });
  for (const w of [-1, 1]) {
    for (const k of [0, 1]) {
      const wing = box(0.66, 0.012, 0.22, cellBig);
      wing.position.set(-coreLen / 2 - 0.1 - k * 0.7, 0, w * 0.14);
      station.add(wing);
    }
    const boom = cyl(0.012, 0.012, 1.5, stDark, 6);
    boom.rotation.z = Math.PI / 2;
    boom.position.set(-coreLen / 2 - 0.45, 0, w * 0.14);
    station.add(boom);
  }
  // 中继天线碟
  const dishSt = lathe(profile([[0.01, 0], [0.1, 0.03], [0.16, 0.08]]), sm('dishst', () => sm('dishW', () => M(0xd8dcdf, 0.5, 0.15))), 14);
  dishSt.rotation.x = -1.3;
  dishSt.position.set(0, 0.1, 0.09);
  station.add(dishSt);
  station.scale.setScalar(0.9);
  station.rotation.z = 0.5;
  station.userData.bake = true;
  g.add(station);
  g.userData.station = station;
  station.userData.portLocal = V3(coreLen / 2 + 0.24, 0, 0);
  station.userData.dockN = V3(1, 0, 0);
  // 空间站轨道位置（相位差 1/3 圈）
  station.userData.orbAng0 = Math.PI * 0.78;
  /* --- 在轨扩展（太阳辉光 / 卫星星座 / 轨道标注，p8） --- */
  buildOrbitExtras(g);
  orbitDetailPass(g);
  orbitDetailPass2(g);
}

function orbitUpdate(dt) {
  const g = scenes.orbit;
  if (!g) return;
  const R = g.userData.R;
  const r = R * 1.28;
  ORB.ang += dt * (Math.PI * 2 / 34);
  const inc = 0.5;
  const x = Math.cos(ORB.ang) * r, z = -Math.sin(ORB.ang) * r * Math.cos(inc), y = Math.sin(ORB.ang) * r * Math.sin(inc);
  const ship = g.userData.ship;
  ship.position.set(x, y, z);
  ship.rotation.set(0, -ORB.ang + Math.PI / 2, 0);
  // 空间站同轨道不同相位
  const st = g.userData.station;
  const sa = st.userData.orbAng0 + ORB.ang * 0.985;
  const sx = Math.cos(sa) * r * 1.012, sz = -Math.sin(sa) * r * Math.cos(inc) * 1.012, sy = Math.sin(sa) * r * Math.sin(inc) * 1.012;
  st.position.set(sx, sy, sz);
  st.rotation.set(0, -sa + Math.PI / 2, 0.5);
  // 对接端口世界坐标（每帧刷新，供 dockStep 追踪）
  const port = st.userData.portLocal.clone();
  st.localToWorld(port);
  g.userData.portWorld = port;
  st.userData.portWorld = port;
  st.userData.dockN = st.localToWorld(st.userData.dockN.clone()).sub(st.getWorldPosition(tmpV)).normalize();
  ship.userData.dockN = st.userData.dockN;
  // 速度箭头（跟随模式下可见）
  const vA = g.userData.vArrow;
  if (vA.visible) {
    const tx = Math.sin(ORB.ang) * r, tz = Math.cos(ORB.ang) * r * Math.cos(inc), ty = -Math.cos(ORB.ang) * r * Math.sin(inc);
    vA.position.copy(ship.position).add(V3(tx * 0.04, ty * 0.04, tz * 0.04));
    vA.lookAt(ship.position.x + tx, ship.position.y + ty, ship.position.z + tz);
  }
  g.userData.earth.rotation.y += dt * 0.05;
  g.userData.clouds.rotation.y += dt * 0.058;
  const vc = vCirc(ORB.alt * 1000);
  const per = orbitPeriod(ORB.alt * 1000);
  hset('alt', ORB.alt + ' km');
  hset('v', vc.toFixed(0) + ' m/s');
  hset('per', (per / 60).toFixed(1) + ' min（一天 ' + Math.round(1440 / (per / 60)) + ' 次日出）');
  hset('wt', 'g′=' + gAt(ORB.alt * 1000).toFixed(1) + ' m/s²，完全失重（引力＝向心力）');
  hset('vesc', (vEsc(ORB.alt * 1000) / 1000).toFixed(2) + ' km/s');
  if (DOCK.phase !== 'off') dockStep(dt);
  else if (ORB.follow) followTarget(ship.position);
}

/* ---------------- 再入段场景（返回舱 + 三层等离子鞘 + 电离尾 + 东风着陆场远影） ---------------- */

const RE_SPARK_N = 140;
function buildReentry(g, tex) {
  const cap = buildCapsuleModel(1.15);
  cap.rotation.z = -Math.PI / 2;          // 钝头朝 -x（迎风）
  g.add(cap);
  g.userData.cap = cap;
  // 等离子鞘三层辉光（核心白橙 / 中层橙 / 外层红，按热度分层显隐）
  const plasmaCore = glowSprite(5.2, '255,226,178', 0);
  const plasmaMid = glowSprite(8.4, '255,150,74', 0);
  const plasmaEdge = glowSprite(12.5, '232,84,42', 0);
  g.add(plasmaCore, plasmaMid, plasmaEdge);
  g.userData.plasmaCore = plasmaCore;
  g.userData.plasmaMid = plasmaMid;
  g.userData.plasmaEdge = plasmaEdge;
  // 电离尾（长锥 + 内芯）
  const trailMat = new THREE.MeshBasicMaterial({ color: 0xff8a4a, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
  const trail = new THREE.Mesh(new THREE.ConeGeometry(0.9, 9, 14, 1, true), trailMat);
  trail.rotation.z = Math.PI / 2;
  trail.position.x = 4.6;
  g.add(trail);
  g.userData.trail = trail;
  const trailCoreMat = new THREE.MeshBasicMaterial({ color: 0xffd9a0, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
  const trailCore = new THREE.Mesh(new THREE.ConeGeometry(0.4, 6, 10, 1, true), trailCoreMat);
  trailCore.rotation.z = Math.PI / 2;
  trailCore.position.x = 3.1;
  g.add(trailCore);
  g.userData.trailCore = trailCore;
  // 火花粒子（Points 池）
  const sparkGeo = new THREE.BufferGeometry();
  sparkGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(RE_SPARK_N * 3), 3));
  const sparks = new THREE.Points(sparkGeo, new THREE.PointsMaterial({
    color: 0xffb06a, size: 0.16, transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
  }));
  sparks.frustumCulled = false;
  g.add(sparks);
  g.userData.sparks = sparks;
  g.userData.sparkSeed = Array.from({ length: RE_SPARK_N }, () => ({ x: -1, y: -1, z: -1, vx: 0, vy: 0, life: 0 }));
  // 再入走廊引导线（1.2° / 2.6° 两条 + 楔形带，默认显示）
  const corridor = new THREE.Group();
  {
    const len = 60;
    for (const ang of [1.2, 2.6]) {
      const geo = new THREE.BufferGeometry().setFromPoints([V3(0, 0, 0), V3(-Math.cos(ang * DEG) * len, -Math.sin(ang * DEG) * len, 0)]);
      const ln = new THREE.Line(geo, new THREE.LineDashedMaterial({ color: 0x8fd3a0, dashSize: 1.2, gapSize: 0.8, transparent: true, opacity: 0.55 }));
      ln.computeLineDistances();
      corridor.add(ln);
    }
    const wedge = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ color: 0x8fd3a0, transparent: true, opacity: 0.06, side: THREE.DoubleSide, depthWrite: false }),
    );
    wedge.scale.set(len, Math.abs(Math.sin(2.6 * DEG) - Math.sin(1.2 * DEG)) * len, 1);
    const midA = (1.2 + 2.6) / 2 * DEG;
    wedge.position.set(-Math.cos(midA) * len / 2, -Math.sin(midA) * len / 2, 0);
    wedge.rotation.z = Math.PI / 2 + midA;
    corridor.add(wedge);
    const capLbl = lbl('再入走廊 1.2°~2.6°', 0x8fd3a0, 0.045);
    capLbl.position.set(-len * 0.62, -Math.tan(1.9 * DEG) * len * 0.62 - 2.2, 0);
    corridor.add(capLbl);
  }
  corridor.visible = true;
  g.add(corridor);
  g.userData.corridor = corridor;
  // 远处地面 + 着陆场标记（高空俯视叙事：地面远小，随高度接近）
  const groundM = new THREE.Mesh(new THREE.PlaneGeometry(900, 900),
    new THREE.MeshStandardMaterial({ map: tex.sandG, normalMap: tex.sandN, color: 0xbda887, roughness: 1 }));
  groundM.rotation.x = -Math.PI / 2;
  g.add(groundM);
  g.userData.ground = groundM;
  // 轨迹线
  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(300 * 3), 3));
  const line = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: COL.orbitLine, transparent: true, opacity: 0.55 }));
  line.frustumCulled = false;
  g.add(line);
  g.userData.line = line;
  g.userData.lineN = 0;
  // 高度标尺（80/60/40/20 km 刻度线，随再入读高）
  const ticks = new THREE.Group();
  for (const h of [80, 60, 40, 20, 10]) {
    const y = h * 1000 * 9e-4;
    const geo = new THREE.BufferGeometry().setFromPoints([V3(-38, y, 0), V3(-34, y, 0)]);
    ticks.add(new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0x8fd3ff, transparent: true, opacity: 0.6 })));
    const t = lbl(h + ' km', 0x8fd3ff, 0.035);
    t.position.set(-43, y, 0);
    ticks.add(t);
  }
  g.add(ticks);
  g.userData.ticks = ticks;
  /* --- 再入扩展（黑障区标带 / 高空风层，p8） --- */
  buildReentryExtras(g);
  reentryDetailPass(g);
  reentryDetailPass2(g);
}

function reentryReset() {
  RE.h = 100e3; RE.v = 7650; RE.t = 0; RE.running = false; RE.done = false;
  RE.maxG = 0; RE.heat = 0; RE.black = false; RE.skip = false;
  const g = scenes.reentry;
  if (g) {
    const y = RE.h * 9e-4;
    g.userData.cap.position.set(0, y, 0);
    g.userData.cap.userData.beacon.material.opacity = 0;
    g.userData.cap.userData.heatGlow.material.opacity = 0;
    g.userData.plasmaCore.material.opacity = 0;
    g.userData.plasmaMid.material.opacity = 0;
    g.userData.plasmaEdge.material.opacity = 0;
    g.userData.trail.material.opacity = 0;
    g.userData.trailCore.material.opacity = 0;
    g.userData.sparks.material.opacity = 0;
    g.userData.lineN = 0;
    const pos = g.userData.line.geometry.attributes.position;
    pos.setXYZ(0, 0, y, 0);
    pos.needsUpdate = true;
    g.userData.line.geometry.setDrawRange(0, 1);
    g.userData.sparkSeed.forEach((s) => { s.life = 0; });
    lastFollow.set(0, y, 0);
    controls.target.set(0, y, 0);
    camera.position.set(10, y + 5, 22);
  }
  showToast('');
}
function reentryStep(dtReal) {
  const g = scenes.reentry;
  if (!RE.running || RE.done) return;
  const sub = 0.04;
  let left = Math.min(dtReal, 0.1) * 8;   // 时间倍率 8×（全程约 7 分钟压到 <1 分钟）
  while (left > 0) {
    const dt = Math.min(sub, left); left -= dt;
    RE.t += dt;
    const rho = rhoAt(RE.h);
    const m = 3150, Cd = 1.25, A = 4.6;
    const drag = 0.5 * rho * RE.v * RE.v * Cd * A;
    const gAcc = gAt(RE.h);
    const gamR = -RE.gam * DEG;
    const dv = -drag / m - gAcc * Math.sin(gamR);
    const dgam = (-(gAcc / RE.v - RE.v / (R_E + RE.h))) * Math.cos(gamR);
    RE.v = Math.max(RE.v + dv * dt, 10);
    RE.gam = clamp(RE.gam + (-dgam) * dt / DEG * 0.1, 0, 60);
    RE.h += RE.v * Math.sin(gamR) * dt;
    const gl = drag / m / 9.8;
    if (RE.h < 90e3) RE.maxG = Math.max(RE.maxG, gl);
    RE.heat = clamp(Math.sqrt(rho / 1.225) * Math.pow(RE.v / 7600, 3) * 1.6, 0, 1.4);
    RE.black = RE.h < 70e3 && RE.h > 32e3 && RE.v > 3000 && RE.heat > 0.32;
    if (RE.h > 86e3 && RE.t > 120 && RE.gam < 0.95 && RE.v > 7000) {
      RE.skip = true; RE.done = true; RE.running = false;
      showToast(`再入角 ${RE.gam.toFixed(1)}° 太浅：船被大气「弹」了出去，无法减速返回。把再入角调到 1°~3° 再试。`, 'bad');
      break;
    }
    if (RE.h <= 10e3) {
      RE.done = true; RE.running = false;
      if (RE.maxG > 7.5) {
        showToast(`过载峰值 ${RE.maxG.toFixed(1)} g，超出航天员承受极限（≈4~5 g），再入角太陡！调小再入角。`, 'bad');
      } else {
        showToast(`再入完成：过载峰值 ${RE.maxG.toFixed(1)} g，速度已从 ${(7650 / 1000).toFixed(1)} km/s 减到 ${(RE.v).toFixed(0)} m/s。开伞！`, 'ok');
      }
      break;
    }
  }
  if (g) {
    const y = Math.max(RE.h * 9e-4, 6);
    const cap = g.userData.cap;
    cap.position.set(0, y, 0);
    cap.rotation.z = -Math.PI / 2 + (RE.gam * DEG) * 0.8;
    // 等离子鞘三层随热度点亮
    const heat = clamp(RE.heat, 0, 1.3);
    g.userData.plasmaCore.material.opacity = clamp(heat * 0.95, 0, 0.95);
    g.userData.plasmaMid.material.opacity = clamp(heat * 0.6, 0, 0.6);
    g.userData.plasmaEdge.material.opacity = clamp(heat * 0.32, 0, 0.34);
    g.userData.plasmaCore.position.set(-1.7, y, 0);
    g.userData.plasmaMid.position.set(-1.8, y, 0);
    g.userData.plasmaEdge.position.set(-1.9, y, 0);
    g.userData.trail.material.opacity = clamp(heat * 0.42, 0, 0.45);
    g.userData.trail.position.set(2.7, y, 0);
    g.userData.trailCore.material.opacity = clamp(heat * 0.5, 0, 0.5);
    g.userData.trailCore.position.set(2.0, y, 0);
    cap.userData.heatGlow.material.opacity = clamp(heat * 0.5, 0, 0.55);
    // 火花（烧蚀微粒飞散，跟随热度）
    {
      const seed = g.userData.sparkSeed;
      const posAttr = g.userData.sparks.geometry.attributes.position;
      const emit = heat > 0.25;
      g.userData.sparks.material.opacity = emit ? 0.8 : 0;
      if (emit) {
        for (let i = 0; i < seed.length; i++) {
          const s = seed[i];
          if (s.life <= 0) {
            if (Math.random() < heat * 0.2) {
              s.x = -0.6 - Math.random() * 0.5; s.y = y + (Math.random() - 0.5) * 0.5; s.z = (Math.random() - 0.5) * 0.5;
              s.vx = -(2 + Math.random() * 3); s.vy = (Math.random() - 0.5) * 2.2;
              s.life = 0.5 + Math.random() * 0.7;
            }
          } else {
            s.life -= dtReal;
            s.x += s.vx * dtReal; s.y += s.vy * dtReal;
          }
          posAttr.setXYZ(i, s.x, s.y, s.z);
        }
        posAttr.needsUpdate = true;
      }
    }
    // 轨迹（每 2 秒模拟时取一个样，300 点覆盖 600 s）
    RE.sampleT = (RE.sampleT || 0) + Math.min(dtReal, 0.1) * 8;
    const ln = g.userData.lineN;
    if (ln < 299 && RE.sampleT >= 2) {
      RE.sampleT = 0;
      const pos = g.userData.line.geometry.attributes.position;
      pos.setXYZ(ln + 1, cap.position.x, y, cap.position.z);
      g.userData.lineN = ln + 1;
      pos.needsUpdate = true;
      g.userData.line.geometry.setDrawRange(0, ln + 2);
    }
    followTarget(cap.position);
  }
  hset('h', (RE.h / 1000).toFixed(1) + ' km');
  hset('v', (RE.v / 1000).toFixed(2) + ' km/s（Ma ' + (RE.v / aSound(RE.h)).toFixed(1) + '）');
  hset('g', (RE.h < 90e3 ? (0.5 * rhoAt(RE.h) * RE.v * RE.v * 1.25 * 4.6 / 3150 / 9.8) : 0).toFixed(1) + ' g');
  hset('peak', RE.maxG.toFixed(1) + ' g');
  hset('heat', '烧蚀热度 ' + Math.round(clamp(RE.heat, 0, 1.3) * 77) + '%');
  hset('comm', RE.black ? '⚡ 黑障（通信中断）' : '通信正常');
}

/* ---------------- 开伞着陆段场景（引导/减速/主伞 + 反推 + 地面回收） ---------------- */

const LD_PUFF_N = 16;
function buildLanding(g, tex) {
  RKT.landLabels = [];   // 提前初始化（extras 轮会先 push 标注）
  const groundM = new THREE.Mesh(new THREE.PlaneGeometry(700, 700),
    new THREE.MeshStandardMaterial({ map: tex.sandG, normalMap: tex.sandN, color: 0xc4ae87, roughness: 1 }));
  groundM.rotation.x = -Math.PI / 2;
  g.add(groundM);
  // 着陆场标志：同心靶环 + 十字标 + 边旗
  for (let i = 1; i <= 3; i++) {
    const ring = new THREE.Mesh(new THREE.RingGeometry(i * 14 - 1.2, i * 14, 48),
      new THREE.MeshBasicMaterial({ color: 0xe8674a, transparent: true, opacity: 0.5, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.06;
    g.add(ring);
  }
  {
    const crossMat = new THREE.MeshBasicMaterial({ color: 0xe8674a, transparent: true, opacity: 0.6 });
    for (const [w, d] of [[26, 1.4], [1.4, 26]]) {
      const bar = new THREE.Mesh(new THREE.PlaneGeometry(w, d), crossMat);
      bar.rotation.x = -Math.PI / 2;
      bar.position.y = 0.07;
      g.add(bar);
    }
    for (const [px, pz] of [[-18, -18], [18, -18], [-18, 18], [18, 18]]) {
      const pole = cyl(0.08, 0.1, 3, sm('chrDeep', () => sm('chrDeep', () => M(COL.chromeDeep, 0.45, 0.7))), 6);
      pole.position.set(px, 1.5, pz);
      const fl = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.0),
        new THREE.MeshBasicMaterial({ map: texFlagCN(), side: THREE.DoubleSide }));
      fl.position.set(px + 0.85, 2.6, pz);
      g.add(pole, fl);
    }
  }
  // 返回舱
  const cap = buildCapsuleModel(1.3);
  g.add(cap);
  g.userData.cap = cap;
  // 引导伞 + 减速伞（小）
  const drogue = new THREE.Group();
  const drogueMat = new THREE.MeshStandardMaterial({ map: texChute(), side: THREE.DoubleSide, roughness: 0.88 });
  const drogueCanopy = new THREE.Mesh(new THREE.SphereGeometry(2.1, 18, 9, 0, TAU, 0, Math.PI / 2.1), drogueMat);
  drogueCanopy.rotation.x = Math.PI;
  drogue.add(drogueCanopy);
  const dLines = new THREE.Group();
  const lmat = new THREE.LineBasicMaterial({ color: COL.chuteLine });
  for (let i = 0; i < 4; i++) {
    const a = i / 4 * TAU + 0.4;
    dLines.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
      V3(0, -0.5, 0), V3(Math.cos(a) * 1.6, 1.9, Math.sin(a) * 1.6),
    ]), lmat));
  }
  drogue.add(dLines);
  drogue.visible = false;
  g.add(drogue);
  g.userData.drogue = drogue;
  g.userData.drogueLines = dLines;
  // 主伞（红白条纹半球 + 收口绳阶段）
  const canopy = new THREE.Mesh(new THREE.SphereGeometry(7, 26, 13, 0, TAU, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({ map: texChute(), side: THREE.DoubleSide, roughness: 0.85 }));
  canopy.rotation.x = Math.PI;
  canopy.visible = false;
  g.add(canopy);
  g.userData.canopy = canopy;
  // 主伞伞绳（双束 12 根）
  const lines = new THREE.Group();
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * TAU;
    lines.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
      V3(0, -0.9, 0), V3(Math.cos(a) * 6.5, 8.7, Math.sin(a) * 6.5),
    ]), lmat));
  }
  lines.visible = false;
  g.add(lines);
  g.userData.lines = lines;
  // 反推发动机 ×4（底部喷口 + 点火辉光）
  const retroPorts = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const a = i / 4 * TAU + Math.PI / 4;
    const port = cyl(0.16, 0.2, 0.3, sm('darkM', () => M(COL.darkMetal, 0.6, 0.4)), 10);
    port.position.set(Math.cos(a) * 0.42, 0.05, Math.sin(a) * 0.42);
    retroPorts.add(port);
  }
  g.add(retroPorts);
  g.userData.retroPorts = retroPorts;
  const retro = glowSprite(4.4, '255,210,130', 0);
  retro.position.y = -0.5;
  g.add(retro);
  g.userData.retro = retro;
  g.userData.canopyScale = 0.001;
  g.userData.drogueScale = 0.001;
  // 接地扬尘（池化精灵）
  const puffs = [];
  for (let i = 0; i < LD_PUFF_N; i++) {
    const p = new THREE.Mesh(new THREE.SphereGeometry(1, 7, 5),
      new THREE.MeshBasicMaterial({ color: 0xd8c8a8, transparent: true, opacity: 0, depthWrite: false }));
    p.visible = false;
    g.add(p);
    puffs.push({ mesh: p, life: 0, max: 2.2 + Math.random() * 1.4, vx: (Math.random() - 0.5) * 8, vz: (Math.random() - 0.5) * 8 });
  }
  g.userData.puffs = puffs;
  // 地面回收车队（指挥车 + 医疗车 + 拖吊）
  {
    const van = new THREE.Group();
    van.userData.bake = true;
    const body = box(4.8, 2.6, 2.5, matPaint(0xf2f4f6, { rough: 0.5 }));
    body.position.y = 2.0;
    const scrn = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 1.4),
      new THREE.MeshBasicMaterial({ map: texConsoleScreen('RECOVERY') }));
    scrn.position.set(0.2, 2.2, 1.27);
    const cab = box(1.7, 1.8, 2.3, matPaint(0xe8e4da, { rough: 0.45 }));
    cab.position.set(3.2, 1.6, 0);
    const dish = lathe(profile([[0.02, 0], [0.5, 0.16], [0.9, 0.42]]), sm('dishld', () => sm('dishW', () => M(0xd8dcdf, 0.5, 0.15))), 14);
    dish.rotation.x = -1.1;
    dish.position.set(-1.4, 3.9, -0.6);
    const mast = cyl(0.06, 0.09, 1.6, sm('chrDeep', () => sm('chrDeep', () => M(COL.chromeDeep, 0.45, 0.7))), 6);
    mast.position.set(-1.4, 4.4, -0.6);
    const ws = [];
    for (const wx of [2.8, -2.2]) for (const wz of [-1.25, 1.25]) ws.push({ p: [wx, 0.6, wz], r: 0.6, h: 0.4, rx: Math.PI / 2 });
    instCyls(van, sm('tyre', () => M(COL.rubber, 0.95, 0)), ws, 12);
    van.add(body, scrn, cab, dish, mast);
    van.add(contactShadow(10, 4, 0.55));
    van.position.set(-26, 0.2, 16);
    van.rotation.y = 0.7;
    g.add(van);
    const med = new THREE.Group();
    const mb = box(5.2, 2.4, 2.4, matPaint(0xf2f4f6, { rough: 0.5 }));
    mb.position.y = 1.9;
    const crossM = new THREE.MeshBasicMaterial({ color: 0xd9534f });
    for (const [cw, cd] of [[1.2, 0.36], [0.36, 1.2]]) {
      const cb = new THREE.Mesh(new THREE.PlaneGeometry(cw, cd), crossM);
      cb.position.set(0.6, 2.3, 1.22);
      med.add(cb);
    }
    const stripe = box(5.24, 0.5, 2.42, M(0xd9534f, 0.6));
    stripe.position.y = 1.2;
    const ws2 = [];
    for (const wx of [1.9, -1.9]) for (const wz of [-1.2, 1.2]) ws2.push({ p: [wx, 0.6, wz], r: 0.6, h: 0.4, rx: Math.PI / 2 });
    instCyls(med, sm('tyre', () => M(COL.rubber, 0.95, 0)), ws2, 12);
    med.add(mb, stripe);
    med.add(contactShadow(10, 4, 0.55));
    med.position.set(-32, 0.2, 26);
    med.rotation.y = -0.4;
    g.add(med);
  }
  // 着陆场标注
  RKT.landLabels = [
    ['东风着陆场', 0, 4, -40, COL.label],
    ['返回舱', 4.5, 2, 0, COL.labelGreen],
  ].map(([t, x, y, z, c]) => {
    const s = lbl(t, c, 0.055);
    s.position.set(x, y, z);
    g.add(s);
    return s;
  });
  RKT.landLabels.forEach((s) => { s.visible = false; });
  /* --- 着陆扩展（搜救直升机 / 旗阵 / 围栏，p8） --- */
  buildLandingExtras(g, tex);
  landingDetailPass(g);
  landingDetailPass2(g);
}

function landingReset() {
  LD.h = 10e3; LD.v = 180; LD.drift = 0; LD.running = false; LD.done = false; LD.vLand = 0; LD.phase = 0;
  const g = scenes.landing;
  if (g) {
    const y = LD.h * 4.5e-3;
    g.userData.cap.position.set(0, y + 1.05, 0);
    g.userData.cap.rotation.set(0, 0, 0);
    g.userData.canopy.visible = false;
    g.userData.lines.visible = false;
    g.userData.drogue.visible = false;
    g.userData.canopyScale = 0.001;
    g.userData.drogueScale = 0.001;
    g.userData.retro.material.opacity = 0;
    g.userData.puffs.forEach((p) => { p.life = 0; p.mesh.visible = false; });
    lastFollow.set(0, y, 0);
    controls.target.set(0, y, 0);
    camera.position.set(13, y + 4, 27);
  }
  showToast('');
}
function landingStep(dtReal) {
  const g = scenes.landing;
  if (!LD.running || LD.done) {
    if (g && LD.phase === 3) stepDust(g, dtReal);
    return;
  }
  let left = Math.min(dtReal, 0.1) * (LD.phase === 2 ? 40 : 8);
  const m = 3150;
  while (left > 0) {
    const dt = Math.min(0.03, left); left -= dt;
    const rho = rhoAt(LD.h);
    const CdA = LD.phase === 2 ? 1.35 * LD.area : LD.phase === 1 ? 60 : 9;
    const acc = 9.8 - 0.5 * rho * LD.v * LD.v * CdA / m;
    LD.v = Math.max(LD.v + acc * dt, 0);
    LD.h -= LD.v * dt;
    LD.drift += LD.wind * (LD.phase === 2 ? 1 : 0.4) * dt;
    if (LD.phase < 1 && LD.h < 8000) { LD.phase = 1; showToast('8 km：减速伞打开', 'ok'); }
    if (LD.phase === 1 && LD.h < 7000) { LD.phase = 2; showToast('7 km：主伞打开（' + LD.area + ' m²）', 'ok'); }
    if (LD.h < 1.2 && LD.phase === 2) {
      if (LD.retro && LD.v > 2.2) {
        LD.v = Math.max(LD.v - 26 * dt, 2.0);
      }
      if (LD.h - LD.v * dt <= 0) {
        LD.vLand = LD.v;
        LD.h = 0; LD.phase = 3; LD.done = true; LD.running = false;
        const verdict = LD.vLand <= 3
          ? `着陆成功！接地速度 ${LD.vLand.toFixed(1)} m/s${LD.retro ? '（反推发动机工作正常）' : ''}，航天员平安返回东风着陆场。`
          : LD.vLand <= 6
            ? `着陆成功，接地速度 ${LD.vLand.toFixed(1)} m/s 偏大，冲击较明显。建议开启反推发动机。`
            : `接地速度 ${LD.vLand.toFixed(1)} m/s——硬着陆，结构可能受损。增大主伞面积或开启反推。`;
        showToast(verdict, LD.vLand <= 6 ? 'ok' : 'bad');
        // 扬尘
        g.userData.puffs.forEach((p) => {
          if (p.life <= 0 && Math.random() < 0.8) {
            p.life = p.max;
            p.mesh.position.set((Math.random() - 0.5) * 3, 0.6, (Math.random() - 0.5) * 3);
            p.mesh.visible = true;
          }
        });
        break;
      }
    }
  }
  if (g) {
    const y = LD.h * 4.5e-3;
    const cap = g.userData.cap;
    cap.position.set(LD.drift * 0.6, y + 1.05, 0);
    const sway = Math.sin(performance.now() * 0.0011) * (LD.phase === 2 ? 0.6 : 0);
    cap.position.x += sway;
    cap.rotation.z = sway * 0.16;
    // 引导/减速伞
    const wantD = LD.phase >= 1 && LD.phase < 2 ? 1 : 0;
    g.userData.drogueScale = lerp(g.userData.drogueScale, wantD, 0.12);
    const ds = g.userData.drogueScale;
    g.userData.drogue.visible = ds > 0.02;
    g.userData.drogue.scale.setScalar(Math.max(ds, 0.001));
    g.userData.drogue.position.set(cap.position.x, y + 5.4 * ds, 0);
    // 主伞（三级收口：15% → 45% → 100%）
    const wantScale = LD.phase === 2 ? clamp((7000 - LD.h) / 900, 0.15, 1) : 0;
    g.userData.canopyScale = lerp(g.userData.canopyScale, wantScale, 0.085);
    const cs = g.userData.canopyScale;
    g.userData.canopy.visible = cs > 0.02;
    g.userData.lines.visible = cs > 0.02;
    g.userData.canopy.scale.setScalar(Math.max(cs, 0.001));
    g.userData.lines.scale.setScalar(Math.max(cs, 0.001));
    g.userData.canopy.position.set(cap.position.x, y + 10.2 * cs, 0);
    g.userData.lines.position.set(cap.position.x, y + 0.4, 0);
    g.userData.lines.rotation.z = sway * 0.1;
    // 反推焰
    g.userData.retro.material.opacity = LD.retro && LD.h < 1.6 && LD.running ? 0.85 : 0;
    g.userData.retro.position.set(cap.position.x, y - 0.3, 0);
    g.userData.retroPorts.visible = true;
    stepDust(g, dtReal);
    // 着陆后舷窗透出暖光（准备开舱）
    if (cap.userData.cabLight) cap.userData.cabLight.material.opacity = LD.phase === 3 ? 0.5 + Math.sin(performance.now() * 0.004) * 0.2 : 0;
    followTarget(cap.position);
    hset('h', (LD.h / 1000).toFixed(2) + ' km');
    hset('v', LD.v.toFixed(1) + ' m/s');
    hset('wind', '侧风 ' + LD.wind.toFixed(1) + ' m/s · 漂移 ' + (LD.drift * 0.6).toFixed(0) + ' m');
    hset('phase', ['自由段', '减速伞', '主伞 ' + LD.area + ' m²', '已着陆'][LD.phase]);
    hset('term', LD.phase === 2
      ? '平衡 v=√(2mg/ρC_A) ≈ ' + Math.sqrt(2 * m * 9.8 / (rhoAt(2000) * 1.35 * LD.area)).toFixed(1) + ' m/s'
      : '–');
  }
}
function stepDust(g, dtReal) {
  g.userData.puffs.forEach((p) => {
    if (p.life > 0) {
      p.life -= dtReal;
      const k = 1 - p.life / p.max;
      p.mesh.position.x += p.vx * dtReal;
      p.mesh.position.z += p.vz * dtReal;
      p.mesh.position.y += dtReal * 0.9;
      p.mesh.scale.setScalar(1 + k * 6);
      p.mesh.material.opacity = 0.4 * (1 - k);
      if (p.life <= 0) p.mesh.visible = false;
    }
  });
}
/* ---------------- 场景扩展纹理 ---------------- */

/** 防滑花纹板（塔架平台 / 走道，菱形凸点阵列） */
function texDeck() {
  return ctex('deck', () => {
    const S = 256;
    const cv = document.createElement('canvas');
    cv.width = cv.height = S;
    const ctx = cv.getContext('2d');
    const rnd = mulberry(211);
    ctx.fillStyle = '#6a7480';
    ctx.fillRect(0, 0, S, S);
    for (let i = 0; i < 700; i++) {
      ctx.fillStyle = `rgba(${rnd() > 0.5 ? '255,255,255' : '18,24,30'},${rnd() * 0.05})`;
      ctx.fillRect(rnd() * S, rnd() * S, 2 + rnd() * 4, 1 + rnd() * 2);
    }
    // 菱形防滑凸点（两向 45° 阵列）
    ctx.strokeStyle = 'rgba(232,238,242,0.28)';
    ctx.lineWidth = 2.4;
    const step = 26;
    for (let y = step / 2; y < S; y += step) {
      for (let x = step / 2; x < S; x += step) {
        ctx.beginPath();
        ctx.moveTo(x - 6, y);
        ctx.lineTo(x, y - 6);
        ctx.lineTo(x + 6, y);
        ctx.lineTo(x, y + 6);
        ctx.closePath();
        ctx.stroke();
        ctx.fillStyle = 'rgba(240,244,248,0.10)';
        ctx.fill();
      }
    }
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.anisotropy = 4;
    return tex;
  });
}

/** 垂直总装厂房大门（竖向分缝 + 警示条 + 编号） */
function texBigDoor(label = 'VPB-1') {
  return ctex('bigdoor:' + label, () => {
    const w = 256, h = 320;
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    const ctx = cv.getContext('2d');
    const rnd = mulberry(label.length * 29 + 3);
    ctx.fillStyle = '#d8dde2';
    ctx.fillRect(0, 0, w, h);
    // 竖向分缝（大跨度折叠门）
    ctx.strokeStyle = 'rgba(70,80,90,0.65)';
    ctx.lineWidth = 3;
    for (let i = 1; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(i * w / 6, 0);
      ctx.lineTo(i * w / 6, h);
      ctx.stroke();
    }
    // 板面横缝与噪声
    ctx.strokeStyle = 'rgba(70,80,90,0.25)';
    ctx.lineWidth = 1.4;
    for (let i = 1; i < 10; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * h / 10);
      ctx.lineTo(w, i * h / 10);
      ctx.stroke();
    }
    for (let i = 0; i < 400; i++) {
      ctx.fillStyle = `rgba(${rnd() > 0.5 ? '255,255,255' : '40,50,60'},${rnd() * 0.06})`;
      ctx.fillRect(rnd() * w, rnd() * h, 3 + rnd() * 5, 1 + rnd() * 2);
    }
    // 底部警示斜纹
    for (let i = 0; i < 12; i++) {
      ctx.fillStyle = i % 2 ? '#e8c23f' : '#1c1e22';
      ctx.save();
      ctx.translate(i * 22, h - 26);
      ctx.rotate(-0.6);
      ctx.fillRect(0, -8, 10, 40);
      ctx.restore();
    }
    // 门牌
    ctx.fillStyle = '#1e4f9c';
    ctx.font = '700 30px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, w / 2, 46);
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  });
}

/** 雷达天线网面（网格 + 中心馈源辐条） */
function texRadarMesh() {
  return ctex('radar', () => {
    const S = 256;
    const cv = document.createElement('canvas');
    cv.width = cv.height = S;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = '#c9ced2';
    ctx.fillRect(0, 0, S, S);
    ctx.strokeStyle = 'rgba(90,100,110,0.55)';
    ctx.lineWidth = 1.4;
    const step = 14;
    for (let i = 0; i <= S; i += step) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, S); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(S, i); ctx.stroke();
    }
    // 辐条
    ctx.strokeStyle = 'rgba(60,70,80,0.7)';
    ctx.lineWidth = 3;
    for (let k = 0; k < 8; k++) {
      const a = k / 8 * TAU;
      ctx.beginPath();
      ctx.moveTo(S / 2, S / 2);
      ctx.lineTo(S / 2 + Math.cos(a) * S / 2, S / 2 + Math.sin(a) * S / 2);
      ctx.stroke();
    }
    ctx.fillStyle = '#3a414b';
    ctx.beginPath(); ctx.arc(S / 2, S / 2, 10, 0, TAU); ctx.fill();
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  });
}

/** 直升机机侧徽标（圆形机徽 + 编号） */
function texHeliMark(no = 'RMQ-71') {
  return ctex('heli:' + no, () => {
    const S = 128;
    const cv = document.createElement('canvas');
    cv.width = cv.height = S;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = '#f2f4f6';
    ctx.fillRect(0, 0, S, S);
    ctx.beginPath(); ctx.arc(S / 2, S / 2, 40, 0, TAU);
    ctx.fillStyle = '#1e4f9c'; ctx.fill();
    ctx.lineWidth = 5; ctx.strokeStyle = '#e8c23f'; ctx.stroke();
    // 五角星
    ctx.fillStyle = '#ffde00';
    starPath(ctx, S / 2, S / 2 - 4, 18);
    ctx.fillStyle = '#1e4f9c';
    ctx.font = '700 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(no, S / 2, S - 22);
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  });
}

/* ---------------- 发射场扩展：厂房 / 雷达站 / 管廊 / 消防 / 夜灯 ---------------- */

RKT.helis = [];
RKT.radarDishes = [];
RKT.lightCones = null;

function buildSiteExtras(g, tex) {
  const T = tex;

  /* --- 垂直总装测试厂房（远景区地标：蓝白大厂房 + 巨型折叠门 + 屋顶桁架） --- */
  {
    const vpb = new THREE.Group();
    vpb.userData.bake = true;
    const wallMat = new THREE.MeshStandardMaterial({ map: texPanel(), color: 0xcfd6dd, roughness: 0.85 });
    const main = box(46, 40, 30, wallMat);
    main.position.y = 20;
    vpb.add(main);
    const roof = box(48, 3, 32, sm('concreteDeep', () => M(COL.concreteDeep, 0.9)));
    roof.position.y = 41.4;
    vpb.add(roof);
    // 屋顶采光带
    const strip = box(30, 1.4, 1.4, sm('roofstrip', () => new THREE.MeshStandardMaterial({ color: 0x274a86, emissive: 0x3a6ab8, emissiveIntensity: 0.4, roughness: 0.4 })));
    strip.position.set(0, 42.6, 0);
    vpb.add(strip);
    // 巨型折叠门（正面）
    const door = new THREE.Mesh(new THREE.PlaneGeometry(26, 32),
      new THREE.MeshStandardMaterial({ map: texBigDoor('VPB-1'), roughness: 0.7 }));
    door.position.set(0, 16.2, 15.1);
    vpb.add(door);
    const door2 = door.clone();
    door2.material = new THREE.MeshStandardMaterial({ map: texBigDoor('VPB-2'), roughness: 0.7 });
    door2.position.set(-20, 10.5, 15.1);
    door2.scale.set(0.62, 0.62, 1);
    vpb.add(door2);
    // 高窗带
    const wins = [];
    for (let i = 0; i < 10; i++) wins.push({ p: [-19 + i * 4.2, 34, 15.16], s: [2.6, 2.4, 0.08] });
    instBoxes(vpb, sm('vpbwin', () => new THREE.MeshStandardMaterial({ color: 0x2a3a4a, emissive: COL.windowLit, emissiveIntensity: 0.5, roughness: 0.3 })), wins);
    // 门顶雨棚 + 门车轨道
    const shed = box(27, 1.6, 4, wallMat);
    shed.position.set(0, 32.8, 17);
    vpb.add(shed);
    const rail = box(40, 0.5, 0.8, sm('chrDeep', () => sm('chrDeep', () => M(COL.chromeDeep, 0.45, 0.7))));
    rail.position.set(0, 0.4, 18.6);
    vpb.add(rail);
    // 门前旗杆三根
    for (let i = 0; i < 3; i++) {
      const pole = cyl(0.12, 0.16, 12, sm('pole', () => sm('chromeM', () => M(COL.chrome, 0.35, 0.8))), 8);
      pole.position.set(-8 + i * 8, 6, 22);
      vpb.add(pole);
    }
    vpb.position.set(-96, 0, -78);
    vpb.rotation.y = 0.6;
    g.add(vpb);
    const lb = lbl('垂直总装测试厂房', COL.labelBlue, 0.075);
    lb.position.set(-96, 52, -78);
    lb.visible = false;
    g.add(lb);
    RKT.siteLabels.push(lb);
  }

  /* --- 测控雷达站（双抛物面天线 + 雷达罩 + 设备方舱） --- */
  {
    const rs = new THREE.Group();
    const dishMat = new THREE.MeshStandardMaterial({ map: texRadarMesh(), roughness: 0.6, metalness: 0.2, side: THREE.DoubleSide });
    for (let i = 0; i < 2; i++) {
      const mount = new THREE.Group();
      const base = cyl(2.4, 3.0, 2.2, sm('concreteDeep', () => M(COL.concreteDeep, 0.9)), 14);
      base.position.y = 1.1;
      mount.add(base);
      const yokeL = box(0.5, 3.4, 0.5, sm('yoke', () => sm('twrHi', () => M(COL.towerSteelHi, 0.5, 0.45))));
      yokeL.position.set(-1.3, 3.4, 0);
      const yokeR = yokeL.clone();
      yokeR.position.x = 1.3;
      mount.add(yokeL, yokeR);
      const dish = lathe(profile([[0.3, 0], [2.6, 0.7], [4.4, 1.7]]), dishMat, 24);
      dish.rotation.x = -1.15 + i * 0.14;
      dish.position.y = 5.4;
      mount.add(dish);
      const feedBoom = cyl(0.08, 0.08, 3.2, sm('feedboom', () => sm('chrDeep', () => sm('chrDeep', () => M(COL.chromeDeep, 0.45, 0.7)))), 6);
      feedBoom.rotation.x = 1.15 - i * 0.14;
      feedBoom.position.set(0, 6.6, 1.4);
      mount.add(feedBoom);
      const feedHorn = cone(0.22, 0.5, sm('dishW', () => M(0xd8dcdf, 0.5, 0.15)), 10);
      feedHorn.rotation.x = 1.15;
      feedHorn.position.set(0, 8.1, 2.6);
      mount.add(feedHorn);
      mount.userData.bake = true;
      mount.position.set(i * 9 - 4.5, 0, i * 3);
      mount.rotation.y = i * 0.5 - 0.4;
      rs.add(mount);
      RKT.radarDishes.push(dish);
    }
    // 雷达罩 + 底座 + 设备方舱（打包烘焙）
    const rsStatic = new THREE.Group();
    rsStatic.userData.bake = true;
    const radome = new THREE.Mesh(new THREE.SphereGeometry(6, 22, 14),
      matGlassLite(0xe8ecef, { opacity: 0.4 }));
    radome.position.set(12, 5.4, -4);
    rsStatic.add(radome);
    const radomeBase = cyl(4.4, 5.2, 2.4, sm('concreteDeep', () => M(COL.concreteDeep, 0.9)), 16);
    radomeBase.position.set(12, 1.2, -4);
    rsStatic.add(radomeBase);
    const cabMat = new THREE.MeshStandardMaterial({ map: texPanel(), color: 0xb8bec4, roughness: 0.8 });
    for (let i = 0; i < 2; i++) {
      const cab = box(4.6, 2.4, 2.4, cabMat);
      cab.position.set(-8 + i * 5, 1.2, -8);
      rsStatic.add(cab);
      const acu = box(1.4, 0.8, 1.0, sm('darkHi', () => M(COL.darkMetalHi, 0.6, 0.5)));
      acu.position.set(-8 + i * 5, 2.8, -8);
      rsStatic.add(acu);
    }
    rs.add(rsStatic);
    {
      const rsSh = contactShadow(30, 22, 0.35);
      rsSh.position.set(0, 0.05, -2);
      rs.add(rsSh);
    }
    rs.position.set(96, 0, -64);
    rs.rotation.y = -0.7;
    g.add(rs);
    const lb2 = lbl('测控雷达站', COL.labelBlue, 0.07);
    lb2.position.set(96, 20, -64);
    lb2.visible = false;
    g.add(lb2);
    RKT.siteLabels.push(lb2);
  }

  /* --- 加注管廊（燃料库 → 发射台 架空管桥 + 支柱） --- */
  {
    const rack = new THREE.Group();
    const pipeMat = sm('pipe2', () => sm('chrDeep', () => sm('chrDeep', () => M(COL.chromeDeep, 0.45, 0.7))));
    const rackMat = sm('rack', () => new THREE.MeshStandardMaterial({ map: texPanel(), color: COL.towerSteel, roughness: 0.6, metalness: 0.35 }));
    const pts = [V3(-46, 4.2, -18), V3(-32, 4.2, -12), V3(-16, 4.2, -6), V3(-2, 4.2, -2)];
    rack.add(tubeAlong(pts, 0.3, pipeMat, 26, 8));
    rack.add(tubeAlong(pts.map((p) => V3(p.x, p.y - 0.9, p.z)), 0.2, pipeMat, 26, 8));
    const posts = [];
    for (let i = 0; i < 5; i++) {
      const k = i / 4;
      const x = lerp(-46, -2, k), z = lerp(-18, -2, k);
      posts.push({ p: [x, 1.9, z], s: [0.28, 3.8, 0.28] });
      posts.push({ p: [x, 1.9, z + 1.4], s: [0.22, 3.8, 0.22] });
    }
    instBoxes(rack, rackMat, posts);
    g.add(rack);
  }

  /* --- 消防水池 + 水塔（喷水降温的水源叙事） --- */
  {
    const poolG = new THREE.Group();
    poolG.userData.bake = true;
    const pool = new THREE.Mesh(new THREE.BoxGeometry(16, 0.8, 12),
      new THREE.MeshStandardMaterial({ map: texDeck(), color: 0x8f959c, roughness: 0.9 }));
    pool.position.set(-30, 0.4, 40);
    poolG.add(pool);
    const waterSurf = new THREE.Mesh(new THREE.PlaneGeometry(14.6, 10.6),
      new THREE.MeshStandardMaterial({ color: COL.water, roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.85 }));
    waterSurf.rotation.x = -Math.PI / 2;
    waterSurf.position.set(-30, 0.86, 40);
    poolG.add(waterSurf);
    g.add(poolG);
    // 水塔（支架 + 球罐）
    const towerLegs = [];
    for (const [dx, dz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      towerLegs.push({ p: [-44 + dx * 1.4, 5, 44 + dz * 1.4], s: [0.24, 10, 0.24], rz: -dx * 0.08, rx: dz * 0.08 });
    }
    instBoxes(g, sm('rack', () => new THREE.MeshStandardMaterial({ map: texPanel(), color: COL.towerSteel, roughness: 0.6, metalness: 0.35 })), towerLegs);
    const ball = sph(3.2, sm('tank', () => new THREE.MeshStandardMaterial({ map: texPanel(), color: COL.tankSilver, roughness: 0.5, metalness: 0.6 })), 20, 14);
    ball.position.set(-44, 11.4, 44);
    g.add(ball);
    const lb3 = lbl('消防水池 · 喷水降温水源', COL.labelGreen, 0.055);
    lb3.position.set(-30, 6, 40);
    lb3.visible = false;
    g.add(lb3);
    RKT.siteLabels.push(lb3);
  }

  /* --- 夜间投光灯组（4 座灯架的光锥：点火/夜射氛围，默认隐藏） --- */
  {
    const cones = new THREE.Group();
    const coneMat = new THREE.MeshBasicMaterial({
      color: 0xfff2d0, transparent: true, opacity: 0.10,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
    });
    for (const [px, pz, ry] of [[-20, 18, 0.6], [22, 20, -0.5], [-18, -22, 2.6], [24, -16, -2.6]]) {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(6.5, 30, 16, 1, true), coneMat);
      cone.position.set(px, 12, pz);
      cone.rotation.z = Math.PI / 2 - 0.5;
      cone.rotation.y = ry;
      cones.add(cone);
    }
    cones.visible = false;
    g.add(cones);
    RKT.lightCones = cones;
  }
}

/* ---------------- 在轨扩展：太阳 / 卫星星座 / 轨道标注 ---------------- */

function buildOrbitExtras(g) {
  const R = g.userData.R;
  // 卫星星座（两组 InstancedMesh 小卫星，慢速差速绕行）
  const satMat = sm('sat', () => M(COL.stationBody, 0.5, 0.5));
  const satGeo = new THREE.BoxGeometry(0.02, 0.02, 0.05);
  const satsA = new THREE.InstancedMesh(satGeo, satMat, 8);
  const satsB = new THREE.InstancedMesh(satGeo, satMat, 6);
  satsA.userData.ring = R * 1.44;
  satsB.userData.ring = R * 1.62;
  satsA.userData.ang = 1.1;
  satsB.userData.ang = 4.0;
  g.add(satsA, satsB);
  g.userData.satRings = [satsA, satsB];
  // 轨道倾角标注
  const incLbl = lbl('轨道倾角 ≈ 42°', COL.orbitLine, 0.045);
  incLbl.position.set(0, R * 1.28 * Math.sin(0.5) + 0.16, 0);
  g.add(incLbl);
  g.userData.incLbl = incLbl;
  // 地球自转轴（细线）
  const axisGeo = new THREE.BufferGeometry().setFromPoints([V3(0, -R * 1.25, 0), V3(0, R * 1.25, 0)]);
  const axis = new THREE.Line(axisGeo, new THREE.LineDashedMaterial({ color: 0x8899aa, dashSize: 0.08, gapSize: 0.06, transparent: true, opacity: 0.4 }));
  axis.computeLineDistances();
  g.add(axis);
}

function stepOrbitExtras(dt) {
  const g = scenes.orbit;
  if (!g || !g.userData.satRings) return;
  g.userData.satRings.forEach((ring, ri) => {
    ring.userData.ang += dt * (0.16 - ri * 0.06);
    const m4 = new THREE.Matrix4();
    const inc = 0.5;
    const n = ring.count;
    for (let i = 0; i < n; i++) {
      const a = ring.userData.ang + i / n * TAU;
      const r = ring.userData.ring;
      const x = Math.cos(a) * r, z = -Math.sin(a) * r * Math.cos(inc), y = Math.sin(a) * r * Math.sin(inc);
      m4.makeRotationY(-a + Math.PI / 2);
      m4.setPosition(x, y, z);
      ring.setMatrixAt(i, m4);
    }
    ring.instanceMatrix.needsUpdate = true;
  });
}

/* ---------------- 再入扩展：黑障区标带 / 高空风层 ---------------- */

function buildReentryExtras(g) {
  // 黑障区（80~40 km 红色半透明带 + 标注）
  const zone = new THREE.Group();
  const yTop = 80e3 * 9e-4, yBot = 40e3 * 9e-4;
  const bandMat = new THREE.MeshBasicMaterial({
    color: 0xe8542e, transparent: true, opacity: 0.13, side: THREE.DoubleSide, depthWrite: false,
  });
  const band = new THREE.Mesh(new THREE.PlaneGeometry(72, yTop - yBot), bandMat);
  band.position.set(-18, (yTop + yBot) / 2, 0);
  zone.add(band);
  for (const [y, txt] of [[yTop, '黑障区上界 80 km'], [yBot, '黑障区下界 40 km']]) {
    const ln = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([V3(-54, y, 0), V3(18, y, 0)]),
      new THREE.LineBasicMaterial({ color: 0xe8542e, transparent: true, opacity: 0.4 }),
    );
    zone.add(ln);
    const t = lbl(txt, 0xe8542e, 0.04);
    t.position.set(-30, y + 1.6, 0);
    zone.add(t);
  }
  g.add(zone);
  g.userData.blackZone = zone;
  // 高空风切变层（30~20 km 半透明青带：升力式再入在此修正弹道）
  const windBand = new THREE.Mesh(new THREE.PlaneGeometry(72, 30e3 * 9e-4),
    new THREE.MeshBasicMaterial({ color: 0x5cc7a4, transparent: true, opacity: 0.06, side: THREE.DoubleSide, depthWrite: false }));
  windBand.position.set(-18, 25e3 * 9e-4, 0);
  g.add(windBand);
  const windLbl = lbl('高空风修正层（升力控制落点）', 0x5cc7a4, 0.04);
  windLbl.position.set(-30, 25e3 * 9e-4 + 2.2, 0);
  g.add(windLbl);
}

/* ---------------- 着陆扩展：搜救直升机 / 旗阵 / 围栏 ---------------- */

RKT.heliRotors = [];
RKT.rcAntennas = [];   // 回收测控天线（帧扫描）

/** 直升机停机坪「H」标（沥青底 + 黄圈白字 + 进近虚线 + 方位刻度） */
function texPadH() {
  return ctex('padH', () => {
    const S = 512, c = S / 2;
    const cv = document.createElement('canvas');
    cv.width = cv.height = S;
    const ctx = cv.getContext('2d');
    // 沥青底 + 磨损噪点
    ctx.fillStyle = '#3d4147';
    ctx.fillRect(0, 0, S, S);
    for (let i = 0; i < 2600; i++) {
      ctx.fillStyle = `rgba(${180 + Math.random() * 40 | 0},${180 + Math.random() * 40 | 0},${170 + Math.random() * 30 | 0},${(Math.random() * 0.05).toFixed(3)})`;
      ctx.fillRect(Math.random() * S, Math.random() * S, 2, 2);
    }
    // 外黄环（双圈）
    ctx.strokeStyle = '#d8b23f';
    ctx.lineWidth = 16;
    ctx.beginPath(); ctx.arc(c, c, c - 40, 0, TAU); ctx.stroke();
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(c, c, c - 62, 0, TAU); ctx.stroke();
    // 进近虚线（正东方向四段）
    ctx.lineWidth = 10;
    ctx.setLineDash([34, 26]);
    ctx.beginPath(); ctx.moveTo(c - 34, c); ctx.lineTo(30, c); ctx.stroke();
    ctx.setLineDash([]);
    // 中央白「H」
    ctx.fillStyle = '#eef1f4';
    const hw = 46, hh = 150, hx = c;
    ctx.fillRect(hx - hh / 2 - hw, -hh / 2 + c, hw, hh);
    ctx.fillRect(hx + hh / 2, -hh / 2 + c, hw, hh);
    ctx.fillRect(hx - hh / 2, c - 17, hh * 2 - hw, 34);
    // 方位刻度（N/E/S/W + 短刻度线）
    ctx.font = '700 40px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#c8ccd2';
    ctx.fillText('N', c, 34);
    ctx.save();
    ctx.translate(c, S - 34); ctx.rotate(Math.PI); ctx.fillText('S', 0, 0);
    ctx.restore();
    ctx.save();
    ctx.translate(34, c); ctx.rotate(-Math.PI / 2); ctx.fillText('E', 0, 0);
    ctx.restore();
    ctx.save();
    ctx.translate(S - 34, c); ctx.rotate(Math.PI / 2); ctx.fillText('W', 0, 0);
    ctx.restore();
    for (let i = 0; i < 32; i++) {
      const a = i / 32 * TAU;
      const r1 = c - 66, r2 = i % 8 === 0 ? c - 88 : c - 78;
      ctx.strokeStyle = '#9aa0a8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(c + Math.cos(a) * r1, c + Math.sin(a) * r1);
      ctx.lineTo(c + Math.cos(a) * r2, c + Math.sin(a) * r2);
      ctx.stroke();
    }
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  });
}

/** 回收测控车侧涂装（白底蓝带 + 编号 + 职能字样） */
function texTruckMark(no, role) {
  return ctex('truck:' + no + role, () => {
    const w = 420, h = 150;
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = '#e2e6ea';
    ctx.fillRect(0, 0, w, h);
    // 蓝色腰带 + 上沿细线
    ctx.fillStyle = '#2a5aa8';
    ctx.fillRect(0, 86, w, 30);
    ctx.fillStyle = '#1c3f78';
    ctx.fillRect(0, 118, w, 6);
    // 编号（蓝带内反白）
    ctx.fillStyle = '#f2f4f6';
    ctx.font = '700 34px "PingFang SC", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(no, 24, 101);
    ctx.font = '600 26px "PingFang SC", sans-serif';
    ctx.fillText(role, 24 + ctx.measureText(no).width + 26, 101);
    // 右侧站徽（金环 + 五角星简化）
    ctx.strokeStyle = '#c9a44a';
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(w - 56, 52, 26, 0, TAU); ctx.stroke();
    ctx.fillStyle = '#c9a44a';
    starPath(ctx, w - 56, 52, 15);
    // 涂装刮痕（低透明度短划）
    for (let i = 0; i < 40; i++) {
      ctx.strokeStyle = `rgba(60,66,74,${(Math.random() * 0.12).toFixed(3)})`;
      ctx.lineWidth = 1 + Math.random() * 2;
      const x0 = Math.random() * w, y0 = Math.random() * h;
      ctx.beginPath(); ctx.moveTo(x0, y0);
      ctx.lineTo(x0 + (Math.random() - 0.5) * 26, y0 + (Math.random() - 0.5) * 8);
      ctx.stroke();
    }
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  });
}

function buildLandingExtras(g, tex) {
  // 搜救直升机（机身 + 尾梁 + 主旋翼盘 + 尾桨 + 撬式起落架）
  const heli = new THREE.Group();
  const bodyMat = matPaint(0xd8dde2, { rough: 0.4 });
  const cabin = new THREE.Mesh(new THREE.SphereGeometry(1.15, 16, 12), bodyMat);
  cabin.scale.set(1.7, 0.9, 0.9);
  cabin.position.y = 1.6;
  const noseGlass = new THREE.Mesh(new THREE.SphereGeometry(0.72, 14, 10),
    matGlassLite(0x9cc2e6, { opacity: 0.55 }));
  noseGlass.scale.set(1.25, 0.8, 0.85);
  noseGlass.position.set(1.35, 1.7, 0);
  const tail = cyl(0.16, 0.34, 3.4, bodyMat, 10);
  tail.rotation.z = Math.PI / 2 - 0.14;
  tail.position.set(-2.7, 1.95, 0);
  const finV = box(0.1, 0.9, 0.5, bodyMat);
  finV.position.set(-4.2, 2.5, 0);
  // 主旋翼（双桨叶十字 + 桨盘）
  const rotor = new THREE.Group();
  const blade = box(7.6, 0.06, 0.36, sm('blade', () => sm('rotorD', () => M(0x2e3238, 0.7, 0.2))));
  const blade2 = blade.clone();
  blade2.rotation.y = Math.PI / 2;
  const hub = cyl(0.22, 0.26, 0.3, sm('hub', () => sm('darkHi', () => M(COL.darkMetalHi, 0.6, 0.5))), 10);
  rotor.add(blade, blade2, hub);
  rotor.userData.noBake = true;
  rotor.position.set(0, 2.75, 0);
  const tailRotor = new THREE.Group();
  const tb = box(0.05, 1.5, 0.16, sm('blade', () => sm('rotorD', () => M(0x2e3238, 0.7, 0.2))));
  const tb2 = tb.clone();
  tb2.rotation.z = Math.PI / 2;
  tailRotor.add(tb, tb2);
  tailRotor.userData.noBake = true;
  tailRotor.position.set(-4.3, 2.5, 0.24);
  // 撬式起落架
  const skids = [];
  for (const sz of [-0.7, 0.7]) {
    skids.push({ p: [0, 0.45, sz], s: [3.4, 0.09, 0.14] });
    skids.push({ p: [0.9, 1.0, sz], s: [0.07, 1.0, 0.07], rx: 0.3 });
    skids.push({ p: [-0.9, 1.0, sz], s: [0.07, 1.0, 0.07], rx: -0.3 });
  }
  instBoxes(heli, sm('skid', () => sm('chrDeep', () => sm('chrDeep', () => M(COL.chromeDeep, 0.45, 0.7)))), skids);
  // 机侧徽标
  const mark = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.1),
    new THREE.MeshBasicMaterial({ map: texHeliMark('RMQ-71'), transparent: false }));
  mark.position.set(-0.2, 1.7, 1.06);
  mark.rotation.y = 0.08;
  heli.add(cabin, noseGlass, tail, finV, rotor, tailRotor, mark);
  heli.add(contactShadow(6, 3, 0.5));
  heli.position.set(24, 0.1, -22);
  heli.rotation.y = 2.4;
  g.add(heli);
  RKT.heliRotors.push({ main: rotor, tail: tailRotor, heli });
  const lb = lbl('搜救直升机', COL.labelGreen, 0.05);
  lb.position.set(24, 6.5, -22);
  lb.visible = false;
  g.add(lb);
  RKT.landLabels.push(lb);

  // 旗阵（着陆区四角向内一排）
  for (let i = 0; i < 4; i++) {
    const pole = cyl(0.07, 0.1, 3.4, sm('pole', () => sm('chromeM', () => M(COL.chrome, 0.35, 0.8))), 6);
    pole.position.set(-10 + i * 6.6, 1.7, 30);
    g.add(pole);
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.95),
      new THREE.MeshBasicMaterial({ map: texFlagCN(), side: THREE.DoubleSide }));
    fl.position.set(-10 + i * 6.6 + 0.8, 3.0, 30);
    g.add(fl);
  }
  // 着陆场围栏（远端一道）
  {
    const fp = [], fr = [];
    for (let i = 0; i <= 24; i++) {
      const x = -60 + i * 5;
      fp.push({ p: [x, 0.8, -56], s: [0.1, 1.6, 0.1] });
      if (i < 24) fr.push({ p: [x + 2.5, 1.3, -56], s: [5, 0.06, 0.06] });
    }
    instBoxes(g, sm('towerhi', () => sm('twrHi', () => M(COL.towerSteelHi, 0.5, 0.45))), fp);
    instBoxes(g, sm('towerhi', () => sm('twrHi', () => M(COL.towerSteelHi, 0.5, 0.45))), fr);
  }

  /* --- 回收测控装备阵列（东侧：天线车×3 + 指挥车 + 电源车 + 野战电缆 + 停机坪） --- */

  // 测控天线车（白漆车体 + 蓝裙带 + 液压三节桅杆 + 扫描抛物面）
  function makeRcAntennaVan(no) {
    const van = new THREE.Group();
    const paintW = matPaint(COL.rcWhite, { rough: 0.42 });
    const paintB = matPaint(COL.rcBlue, { rough: 0.4 });
    const frame = box(6.6, 0.34, 2.6, sm('vframe', () => M(COL.darkMetal, 0.7, 0.5)));
    frame.position.y = 0.62;
    van.add(frame);
    // 驾驶室（白漆 + 裙带 + 前风挡玻璃）
    const cab = box(1.7, 1.5, 2.4, paintW);
    cab.position.set(2.3, 1.5, 0);
    van.add(cab);
    const cabBand = box(1.72, 0.32, 2.42, paintB);
    cabBand.position.set(2.3, 0.9, 0);
    van.add(cabBand);
    const windshield = box(0.07, 0.6, 2.0, matGlassLite(0x9cc2e6, { opacity: 0.5 }));
    windshield.position.set(3.16, 1.8, 0);
    van.add(windshield);
    const grill = box(0.06, 0.34, 1.5, sm('vgrill', () => M(COL.darkMetal, 0.75, 0.4)));
    grill.position.set(3.17, 1.0, 0);
    van.add(grill);
    // 货厢（侧贴编号涂装，双面）
    const cargo = box(3.7, 1.95, 2.5, paintW);
    cargo.position.set(-0.9, 1.86, 0);
    van.add(cargo);
    const decal = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 1.2),
      new THREE.MeshStandardMaterial({ map: texTruckMark(no, '回收测控'), roughness: 0.6 }));
    decal.position.set(-0.9, 1.9, 1.26);
    van.add(decal);
    const decal2 = decal.clone();
    decal2.rotation.y = Math.PI;
    decal2.position.z = -1.26;
    van.add(decal2);
    // 货厢顶检修走板 + 排风口
    const walkway = box(3.5, 0.08, 2.3, sm('vwalk', () => M(COL.darkMetalHi, 0.65, 0.45)));
    walkway.position.set(-0.9, 2.88, 0);
    van.add(walkway);
    // 液压三节升降桅杆（渐细）+ 抛物面天线组
    const mast = new THREE.Group();
    mast.position.set(-2.3, 0.78, 0.72);
    const s1 = cyl(0.1, 0.125, 2.3, sm('mastA', () => M(COL.chromeDeep, 0.5, 0.55)), 10);
    s1.position.y = 1.15;
    const s2 = cyl(0.078, 0.098, 2.1, sm('mastB', () => M(COL.chromeDeep, 0.5, 0.55)), 10);
    s2.position.y = 3.1;
    const s3 = cyl(0.056, 0.076, 1.9, sm('mastC', () => M(COL.chrome, 0.4, 0.65)), 10);
    s3.position.y = 4.9;
    mast.add(s1, s2, s3);
    // 节间液压环
    for (const hy of [2.15, 4.0]) {
      const ring = torus(0.1, 0.022, sm('hydRing', () => M(COL.darkMetal, 0.6, 0.5)), 12, 6);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = hy;
      mast.add(ring);
    }
    // 抛物面天线（碗面 + 馈源臂 + 喇叭口），登记帧扫描
    const dishG = new THREE.Group();
    dishG.position.y = 6.0;
    const dish = lathe(profile([[0.26, 0], [1.1, 0.48], [1.85, 1.0]]),
      new THREE.MeshStandardMaterial({ map: texRadarMesh(), roughness: 0.6, metalness: 0.2, side: THREE.DoubleSide }), 22);
    dish.rotation.x = -1.05;
    dishG.add(dish);
    const feed = cyl(0.035, 0.035, 1.7, sm('feedM', () => M(COL.chrome, 0.35, 0.7)), 6);
    feed.rotation.x = 1.05;
    feed.position.set(0, 0.62, 0.72);
    dishG.add(feed);
    const horn = cone(0.16, 0.34, sm('hornM', () => M(0xd8dcdf, 0.5, 0.15)), 10);
    horn.rotation.x = 1.05;
    horn.position.set(0, 1.16, 1.42);
    dishG.add(horn);
    mast.add(dishG);
    RKT.rcAntennas.push(dishG);
    van.add(mast);
    // 支腿 ×4（作业时接地）
    const legs = [];
    for (const lx of [-2.9, 1.2]) for (const lz of [-1.3, 1.3]) legs.push({ p: [lx, 0.3, lz], s: [0.12, 0.6, 0.12] });
    instBoxes(van, sm('vleg', () => M(COL.darkMetal, 0.7, 0.45)), legs);
    // 轮胎 ×6
    const wheels = [];
    for (const wx of [2.5, -0.5, -2.0]) for (const wz of [-1.24, 1.24]) wheels.push({ p: [wx, 0.45, wz], r: 0.45, h: 0.32, rx: Math.PI / 2 });
    instCyls(van, sm('vtyre', () => M(COL.rubber, 0.95, 0)), wheels, 12);
    van.add(contactShadow(7.8, 3.6, 0.55));
    return van;
  }

  for (const [i, [px, pz, ry]] of [[34, 12, -0.5], [40, 16.5, -0.16], [45.5, 9.5, -0.9]].entries()) {
    const van = makeRcAntennaVan('HK-0' + (i + 1));
    van.position.set(px, 0, pz);
    van.rotation.y = ry;
    g.add(van);
  }
  const rcLbl = lbl('回收测控站', COL.labelGreen, 0.05);
  rcLbl.position.set(39, 12, 14);
  rcLbl.visible = false;
  g.add(rcLbl);
  RKT.landLabels.push(rcLbl);

  // 指挥调度车（长厢 + 侧窗带 + 顶置天线阵）
  {
    const cmd = new THREE.Group();
    const paintW = matPaint(COL.rcWhite, { rough: 0.42 });
    const body = box(7.6, 2.3, 2.8, paintW);
    body.position.y = 1.88;
    cmd.add(body);
    const skirt = box(7.62, 0.52, 2.82, matPaint(COL.rcBlue, { rough: 0.4 }));
    skirt.position.y = 0.94;
    cmd.add(skirt);
    // 侧窗发光带（作业灯微亮）×2 侧
    for (const sz of [1.41, -1.41]) {
      const winB = box(5.6, 0.5, 0.05, sm('cmdwin', () => new THREE.MeshStandardMaterial({ color: 0x274a86, emissive: COL.windowLit, emissiveIntensity: 0.55, roughness: 0.3 })));
      winB.position.set(-0.6, 2.2, sz);
      cmd.add(winB);
    }
    const decal = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 1.15),
      new THREE.MeshStandardMaterial({ map: texTruckMark('ZK-01', '指挥调度'), roughness: 0.6 }));
    decal.position.set(-0.6, 1.78, 1.42);
    cmd.add(decal);
    // 顶置设备：空调罩 + 三片刀片天线 + 一根鞭状天线
    const acBox = box(1.5, 0.42, 1.3, sm('acbox', () => M(COL.darkMetalHi, 0.6, 0.45)));
    acBox.position.set(2.2, 3.2, 0);
    cmd.add(acBox);
    for (const ax of [-3.0, -2.4, 1.2]) {
      const blade = box(0.05, 0.72, 0.26, sm('blade2', () => M(COL.darkMetal, 0.55, 0.5)));
      blade.position.set(ax, 3.2, 0.6);
      cmd.add(blade);
    }
    const whip = cyl(0.018, 0.03, 1.9, sm('whip', () => M(COL.darkMetal, 0.6, 0.45)), 6);
    whip.position.set(-3.3, 4.2, -0.5);
    cmd.add(whip);
    const wheels = [];
    for (const wx of [2.7, -0.3, -2.4]) for (const wz of [-1.34, 1.34]) wheels.push({ p: [wx, 0.46, wz], r: 0.46, h: 0.34, rx: Math.PI / 2 });
    instCyls(cmd, sm('vtyre', () => M(COL.rubber, 0.95, 0)), wheels, 12);
    cmd.add(contactShadow(8.8, 3.8, 0.6));
    cmd.position.set(28.5, 0, 20.5);
    cmd.rotation.y = 0.5;
    g.add(cmd);
  }

  // 移动电源车（厢体 + 顶部散热格栅 + 尾部电缆卷盘）
  {
    const pwr = new THREE.Group();
    const body = box(5.2, 2.0, 2.5, matPaint(COL.rcWhite, { rough: 0.45 }));
    body.position.y = 1.74;
    pwr.add(body);
    const skirt = box(5.22, 0.44, 2.52, matPaint(COL.rcBlue, { rough: 0.4 }));
    skirt.position.y = 0.9;
    pwr.add(skirt);
    // 顶部散热格栅（六条深缝）
    const vents = [];
    for (let i = 0; i < 6; i++) vents.push({ p: [-1.6 + i * 0.52, 2.78, 0], s: [0.3, 0.1, 1.8] });
    instBoxes(pwr, sm('vent', () => M(COL.darkMetal, 0.8, 0.35)), vents);
    // 尾部电缆卷盘 ×2
    for (const rz of [0.62, -0.62]) {
      const reel = torus(0.52, 0.16, sm('reel', () => M(COL.warnInk, 0.85, 0.1)), 18, 8);
      reel.rotation.y = Math.PI / 2;
      reel.position.set(-2.7, 1.5, rz);
      pwr.add(reel);
    }
    const wheels = [];
    for (const wx of [1.8, -1.6]) for (const wz of [-1.2, 1.2]) wheels.push({ p: [wx, 0.42, wz], r: 0.42, h: 0.3, rx: Math.PI / 2 });
    instCyls(pwr, sm('vtyre', () => M(COL.rubber, 0.95, 0)), wheels, 12);
    pwr.add(contactShadow(6.4, 3.4, 0.55));
    pwr.position.set(28.5, 0, 25.5);
    pwr.rotation.y = 0.42;
    g.add(pwr);
  }

  // 野战电缆束（主干 CatmullRom 放样贴地起伏 + 三路分支进各天线车）
  {
    const cableM = sm('fieldcable', () => M(COL.darkMetalHi, 0.85, 0.05));
    const trunk = tubeAlong([
      V3(29.6, 0.36, 21.8), V3(32.4, 0.2, 16.2), V3(36.6, 0.16, 13.2),
      V3(41.2, 0.14, 6.2), V3(43.8, 0.16, -1.2), V3(46.6, 0.3, -6.2),
    ], 0.055, cableM, 56, 6);
    g.add(trunk);
    g.add(tubeAlong([V3(32.4, 0.2, 16.2), V3(33.2, 0.15, 14.0), V3(34.2, 0.4, 13.0)], 0.034, cableM, 14, 6));
    g.add(tubeAlong([V3(36.6, 0.16, 13.2), V3(38.6, 0.14, 15.0), V3(39.6, 0.4, 16.4)], 0.034, cableM, 14, 6));
    g.add(tubeAlong([V3(41.2, 0.14, 6.2), V3(44.2, 0.16, 8.8), V3(45.2, 0.4, 9.6)], 0.034, cableM, 14, 6));
  }

  // 直升机停机坪（沥青底「H」标 + 边缘四枚蓝色示位灯）
  {
    const pad = new THREE.Mesh(new THREE.CircleGeometry(7.4, 42),
      new THREE.MeshStandardMaterial({ map: texPadH(), roughness: 0.85 }));
    pad.rotation.x = -Math.PI / 2;
    pad.position.set(42, 0.03, -6);
    g.add(pad);
    const edgeLights = [];
    for (let i = 0; i < 4; i++) {
      const a = i / 4 * TAU + Math.PI / 4;
      edgeLights.push({ p: [42 + Math.cos(a) * 7.0, 0.22, -6 + Math.sin(a) * 7.0], s: [0.22, 0.22, 0.22] });
    }
    instBoxes(g, sm('padlamp', () => new THREE.MeshStandardMaterial({ color: 0x274a86, emissive: 0x8fd3ff, emissiveIntensity: 0.9, roughness: 0.4 })), edgeLights);
    const padLbl = lbl('回收停机坪', COL.labelGreen, 0.045);
    padLbl.position.set(42, 5.5, -6);
    padLbl.visible = false;
    g.add(padLbl);
    RKT.landLabels.push(padLbl);
  }
}

/* ---------------- 着陆场帧动画（旋翼 + 灯光）与发射场帧动画 ---------------- */

function stepSiteExtras(dt) {
  const t = performance.now() * 0.001;
  // 直升机主旋翼 6 rps + 尾桨
  RKT.heliRotors.forEach((h) => {
    h.main.rotation.y += dt * 34;
    h.tail.rotation.x += dt * 46;
    // 机身轻微悬停浮动
    h.heli.position.y = 0.1 + Math.sin(t * 1.3) * 0.06;
  });
  // 雷达天线缓慢扫描
  RKT.radarDishes.forEach((d, i) => {
    d.rotation.y = Math.sin(t * 0.22 + i * 1.4) * 0.5;
  });
  // 回收测控天线方位扇摆（三台错相）
  RKT.rcAntennas.forEach((d, i) => {
    d.rotation.y = Math.sin(t * 0.3 + i * 2.1) * 0.6;
  });
}
/* ---------------- 数据表：长征族谱 / 伞系参数 / 分级对比 ---------------- */

/** 长征系列族谱（第 1 章知识卡佐证：公开参数量级） */
const CZ_FAMILY = [
  { no: 'CZ-2C', first: 1982, leo: '≈ 4 t', note: '常温两级老将' },
  { no: 'CZ-2F', first: 1999, leo: '≈ 8.4 t', note: '载人专型 · 逃逸塔 + 冗余设计' },
  { no: 'CZ-3A 系', first: 1994, leo: '≈ 11 t', note: '低温上面级 · 高轨发射' },
  { no: 'CZ-5', first: 2016, leo: '≈ 25 t', note: '大推力无毒 · 空间站舱段' },
  { no: 'CZ-7', first: 2016, leo: '≈ 13.5 t', note: '货运飞船专型' },
  { no: 'CZ-9（在研）', first: '—', leo: '≈ 150 t', note: '载人登月级' },
];

/** 伞系参数表（第 9 章佐证：公开参数量级的教学重建） */
const PARACHUTE_SYS = [
  { name: '引导伞', area: '≈ 2 m²', open: '10 km（主动拉出）', role: '拉脱伞舱盖、拉出减速伞' },
  { name: '减速伞', area: '≈ 30 m²', open: '8 km（两级收口）', role: '把 180 m/s 减到 ~90 m/s' },
  { name: '主伞', area: '≈ 1 200 m²', open: '7 km（三级收口）', role: '终端速度 ≈ 7 m/s' },
  { name: '反推发动机', area: '—', open: '接地前 1 m', role: '把 7 m/s 压到 ≈ 2 m/s' },
];

/**
 * 分级对比（第 2 章交互引擎）：
 * 等尺寸分级近似——总质量比 R 拆成 n 级，每级质量比 r = R^(1/n)，
 * 理想 Δv = n · ve · ln(r)；结构系数 λ 已隐含在 R 的取法里（教学简化）。
 */
const STAGING = { n: 2, R: 12, isp: 300 };
function stagingCalc(n = STAGING.n, R = STAGING.R, isp = STAGING.isp) {
  const ve = isp * G0;
  const rPer = Math.pow(R, 1 / n);
  const dv = n * ve * Math.log(rPer);
  return { ve, rPer, dv, need: 9300, ok: dv >= 9300 };
}

/* ---------------- 结构知识卡（第 1 章交互：点卡片 → 相机飞到部件 + 解说） ---------------- */

const RKT_CARDS = [
  { name: '逃逸塔', cam: [[14, 64, 22], [0, 60, 0]], text: '顶部塔状逃生装置：8 台固体发动机，故障时 0.2 秒内把飞船拉离火箭，120 秒后分离抛掉——神舟每乘组起飞时它都在值班。' },
  { name: '整流罩', cam: [[12, 52, 20], [0, 49, 0]], text: '气动防护「外套」：为飞船挡住稠密大气层的气动加热与气流冲击，200 秒、110 km 以上分离抛掉，减重约 2 t。剖视整流罩可以看到里面的神舟。' },
  { name: '神舟飞船', cam: [[9, 51, 15], [0, 49.5, 0]], text: '三舱结构：轨道舱（前）+ 返回舱（中）+ 推进舱（后）。只有钟形的返回舱带着防热大底回家，其余都留在太空。' },
  { name: '二级发动机', cam: [[8, 34, 14], [0, 32, 0]], text: '真空发动机：比冲约 300 s，负责最后 6 km/s 的加速；尾部 4 台游机负责姿态与末速修正。585 秒关机，船箭分离。' },
  { name: '电缆罩', cam: [[9, 30, 10], [1.8, 30, 0]], text: '箭体侧面的白色「脊背」：把贯穿两级的电缆与管路罩起来，防气动撕扯——细节件，但少它不可。' },
  { name: '一级主机', cam: [[10, 7, 16], [0, 3, 0]], text: '4 台主机（每台 4 燃烧室并联）：海平面推力约 750 kN/台。四氧化二氮 + 偏二甲肼自燃推进剂，尾焰带红棕色。' },
  { name: '助推器', cam: [[16, 16, 26], [2.6, 14, 2.6]], text: '4 台助推器各装 1 台单燃烧室发动机：139 秒与一级一起工作，烧尽即抛——它们是多级思想在起飞段的延伸。' },
  { name: '稳定尾翼', cam: [[8, 5, 13], [0, 4, 0]], text: '一级尾段 4 片尾翼：低速段提供气动稳定裕度，像羽毛球的尾羽——出大气层后它们随一级一起功成身退。' },
  { name: '固定勤务塔', cam: [[26, 42, -30], [2, 40, -9]], text: '90 m 格构钢塔：10 层工作平台 + 电梯井 + 双脐带摆杆（加注管路与电缆）。起飞前摆杆摆开，起飞后它是箭体的「产房」遗迹。' },
  { name: '导流槽', cam: [[16, 10, -34], [0, 3, -16]], text: '发射平台下的 V 形导流槽：把 2000 ℃ 燃气导向两侧，配合喷水降温——否则发射台会被自己的尾焰掀翻。' },
  { name: '避雷塔', cam: [[30, 90, -40], [-42, 80, -34]], text: '戈壁雷暴区的 100 m 尖塔 + 绝缘子串：把雷电引导入地，保护塔架与箭体。发射窗口要避开雷暴。' },
  { name: '测控雷达站', cam: [[120, 18, -30], [96, 8, -64]], text: '抛物面天线 + 雷达罩：跟踪箭体弹道、接收遥测。黑障期间信号中断，雷达是最后一双眼睛。' },
];

let partsCardEl = null;
function togglePartsCard(on) {
  if (on && !partsCardEl) {
    partsCardEl = document.createElement('div');
    partsCardEl.className = 'plant-parts rkt-parts';
    partsCardEl.innerHTML = '<h3>结构清单 · 点卡片飞到部件</h3>';
    RKT_CARDS.forEach((c, i) => {
      const row = document.createElement('div');
      row.className = 'pp-row';
      row.innerHTML = `<b>${c.name}</b>`;
      row.title = c.text;
      row.addEventListener('click', () => {
        partsCardEl.querySelectorAll('.pp-row').forEach((r) => r.classList.remove('on'));
        row.classList.add('on');
        app.setCamera(c.cam[0], c.cam[1]);
        showToast(`${c.name}：${c.text}`);
      });
      partsCardEl.appendChild(row);
    });
    stage.appendChild(partsCardEl);
  }
  if (partsCardEl) partsCardEl.style.display = on ? '' : 'none';
}
function hidePartsCard() { togglePartsCard(false); }

/* ---------------- 分级对比交互（第 2 章） ---------------- */

function stagingRows(n, R, isp) {
  const rows = [];
  for (let k = 1; k <= 4; k++) {
    const c = stagingCalc(k, R, isp);
    rows.push(` ${k} 级 → Δv ≈ ${(c.dv / 1000).toFixed(1)} km/s${c.ok ? ' ✓' : ''}`);
  }
  return rows;
}

/* ---------------- 滚转控制（第 8 章交互：升力式再入的落点调节） ---------------- */

const ROLL = { ang: 0, arrow: null };
function ensureRollArrow() {
  const g = scenes.reentry;
  if (!g) return null;
  if (!ROLL.arrow) {
    const mat = new THREE.MeshBasicMaterial({ color: 0xb7f5a5 });
    const grpA = new THREE.Group();
    const shaft = cyl(0.06, 0.06, 1, mat, 8);
    shaft.geometry.translate(0, 0.5, 0);
    const head = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.4, 10), mat);
    grpA.add(shaft, head);
    grpA.visible = false;
    g.add(grpA);
    ROLL.arrow = grpA;
  }
  return ROLL.arrow;
}
function updateRollArrow() {
  const g = scenes.reentry;
  if (!g || !RE.running) {
    if (ROLL.arrow) ROLL.arrow.visible = false;
    return;
  }
  const a = ensureRollArrow();
  if (!a) return;
  const cap = g.userData.cap;
  a.visible = true;
  // 升力方向：垂直于再入速度（-x 方向），在 y-z 平面内随滚转角旋转
  const rollRad = ROLL.ang * DEG;
  const liftDir = V3(0, Math.cos(rollRad), Math.sin(rollRad));
  a.position.copy(cap.position).addScaledVector(liftDir, 1.2);
  a.quaternion.setFromUnitVectors(V3(0, 1, 0), liftDir.clone().normalize());
  const scale = clamp(RE.heat, 0.15, 1);
  a.scale.setScalar(scale * 1.4);
}

/* ---------------- 轨道抬升演示（第 7 章交互：点火 → 抬升 → 再圆化） ---------------- */

const MAN = { on: false, t: 0, from: 350, to: 450, burn: null };
function hohmannStart() {
  if (MAN.on) return;
  MAN.on = true;
  MAN.t = 0;
  MAN.from = ORB.alt;
  MAN.to = clamp(ORB.alt + 100, 260, 800);
  const g = scenes.orbit;
  if (g && !MAN.burn) {
    const b = glowSprite(0.9, '255,190,110', 0);
    g.userData.ship.add(b);
    b.position.set(-0.42, 0, 0);
    MAN.burn = b;
  }
  showToast('第一次点火（切向加速）：轨道开始抬升——霍曼转移的第一段。', 'ok');
}
function hohmannStep(dt) {
  if (!MAN.on) {
    if (MAN.burn) MAN.burn.material.opacity = 0;
    return;
  }
  MAN.t += dt;
  const burnPhase = (MAN.t < 2.2) || (MAN.t > 7 && MAN.t < 9);
  if (MAN.burn) MAN.burn.material.opacity = burnPhase ? 0.85 : 0;
  // 高度平滑爬升（模拟转移弧）
  const k = smooth(clamp((MAN.t - 1.2) / 6.2, 0, 1));
  ORB.alt = lerp(MAN.from, MAN.to, k);
  if (MAN.t >= 2 && MAN.t < 2.1) showToast('到转移弧顶点，准备第二次点火圆化轨道…');
  if (MAN.t >= 7 && MAN.t < 7.1) showToast('第二次点火（再圆化）：轨道抬升完成，新轨道速度更慢、周期更长。', 'ok');
  if (MAN.t >= 9.2) {
    MAN.on = false;
    ORB.alt = MAN.to;
    showToast(`演示结束：轨道 ${MAN.from} km → ${MAN.to} km。速度由 ${(vCirc(MAN.from * 1000)).toFixed(0)} 降到 ${(vCirc(MAN.to * 1000)).toFixed(0)} m/s——越高越慢。`);
  }
}

/* ---------------- 残影对比（多次飞行的曲线叠放） ---------------- */

function keepGhost() {
  if (plotHist.length > 6) {
    ST.ghostHist = plotHist.slice();
  }
}

/* ---------------- 场景扩展挂载说明 ----------------
 * buildSiteExtras / buildOrbitExtras / buildReentryExtras / buildLandingExtras 实现在 p8，
 * 由各场景构建器尾部直接调用（见 p3/p5 对应位置）；
 * 帧动画 stepSiteExtras / stepOrbitExtras / hohmannStep / updateRollArrow 在 p7 帧循环接线。 */
/* ---------------- 第二轮建模精修：箭体细节 ----------------
 * 由 buildRocket 末尾调用：在不增加大 draw call 的前提下补齐可见细节件
 * （面板缝纹理 / 发动机机匣与增压管 / 级间脐带插座 / RCS 四联喷口 / 天线刀片 /
 *   摆杆三色管线束 / 逃逸塔连接裙板 / 缆线抛物束）。 */

/** 箭体竖向面板微缝（透明叠加贴片，绕筒一周，弱对比不喧宾） */
function texPanelSeams() {
  return ctex('seams', () => {
    const w = 512, h = 128;
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    const ctx = cv.getContext('2d');
    const rnd = mulberry(303);
    ctx.clearRect(0, 0, w, h);
    // 24 块面板的竖缝 + 微弱明暗差
    const n = 24;
    for (let i = 0; i < n; i++) {
      const x = i * w / n;
      ctx.fillStyle = `rgba(${rnd() > 0.5 ? '255,255,255' : '90,100,110'},${0.03 + rnd() * 0.05})`;
      ctx.fillRect(x + 1, 0, w / n - 2, h);
      ctx.fillStyle = 'rgba(70,80,90,0.35)';
      ctx.fillRect(x, 0, 1.2, h);
    }
    // 两道水平工艺缝
    ctx.fillStyle = 'rgba(70,80,90,0.28)';
    ctx.fillRect(0, h * 0.31, w, 1);
    ctx.fillRect(0, h * 0.69, w, 1);
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.anisotropy = 4;
    return tex;
  });
}

function rocketDetailPass() {
  const g = RKT.g;
  const seamMat = new THREE.MeshBasicMaterial({ map: texPanelSeams(), transparent: true, depthWrite: false });
  const chrome = sm('chrome2', () => sm('chromeM', () => M(COL.chrome, 0.35, 0.8)));
  const dark = sm('dark2', () => sm('darkM', () => M(COL.darkMetal, 0.6, 0.4)));

  // 一级 / 二级筒身面板缝贴片（开圆柱半透贴面）
  const seam1 = cyl(1.658, 1.658, 26.4, seamMat, 32, true);
  seam1.position.y = 14.9;
  g.add(seam1);
  const seam2 = cyl(1.658, 1.658, 14.6, seamMat, 32, true);
  seam2.position.y = 37.9;
  g.add(seam2);

  // 一级增压管路（穹顶到筒壁的 4 条曲线细管）
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2 + 0.35;
    const px = Math.cos(a), pz = Math.sin(a);
    const line = tubeAlong([
      V3(px * 1.2, 3.8, pz * 1.2),
      V3(px * 1.58, 6.5, pz * 1.58),
      V3(px * 1.6, 11.5, pz * 1.6),
    ], 0.055, chrome, 14, 6);
    g.add(line);
  }
  // 涡轮废气排管（发动机机匣侧向小口）
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2 + Math.PI / 4;
    const exh = cone(0.14, 0.3, dark, 10, true);
    exh.rotation.x = Math.PI;
    exh.position.set(Math.cos(a) * 1.35, 2.6, Math.sin(a) * 1.35);
    exh.rotation.z = Math.cos(a) * 0.8;
    g.add(exh);
  }

  // 级间段脐带插座（一二级分离面的电/气/液三插头）
  for (let i = 0; i < 3; i++) {
    const a = -0.5 + i * 0.5;
    const plug = box(0.3, 0.42, 0.18, sm('plug', () => M(0x8a92a0, 0.6, 0.3)));
    plug.position.set(Math.cos(a) * 1.68, 29.4, Math.sin(a) * 1.68);
    plug.rotation.y = -a;
    g.add(plug);
  }

  // 二级姿控（RCS）四联喷口 ×2 象限（二级上部）
  for (const s of [-1, 1]) {
    for (let k = 0; k < 4; k++) {
      const a = k / 4 * TAU;
      const rcs = cone(0.045, 0.1, dark, 8);
      rcs.rotation.z = Math.PI / 2;
      rcs.position.set(40.2, Math.cos(a) * 0.9, s * (0.45 + Math.sin(a) * 0.45));
      g.add(rcs);
    }
  }

  // 二级与整流罩的天线刀片
  const bladeMat = sm('blade2', () => M(0x2e3238, 0.7, 0.3));
  for (const [ay, az, ah] of [[34, 1.3, 0.5], [44, -1.3, 0.4], [47.5, 1.6, 0.55]]) {
    const blade = box(0.06, 0.16, ah, bladeMat);
    blade.position.set(az > 0 ? 1.2 : -1.2, ay, az * 0.95);
    blade.rotation.x = 0.4;
    g.add(blade);
  }

  // 塔架 → 箭体 三色管线束（电 蓝 / 气 灰 / 燃料 橙，从摆杆端到箭体表面）
  const wireDefs = [
    [COL.orbitLine, 33.9], [0xe8a05a, 34.3],
  ];
  for (const [col, wy] of wireDefs) {
    const w = tubeAlong([
      V3(6.2, wy, -5.4), V3(4.2, wy + 0.05, -4.2), V3(2.6, wy + 0.1, -3.2), V3(1.85, wy + 0.12, -2.4),
    ], 0.045, new THREE.MeshBasicMaterial({ color: col }), 14, 5);
    g.add(w);
  }

  // 逃逸塔连接裙板（塔底与整流罩头锥之间的整流过渡）
  {
    const skirt = lathe(profile([[0.62, 0], [1.05, 0.5], [1.3, 1.05]]), matPaint(0x992a1f, { rough: 0.5 }), 14);
    skirt.position.y = 57.6;
    g.add(skirt);
  }
  // 塔顶 → 远端塔架的缆线抛物束（悬链线感）
  {
    const sag = tubeAlong([
      V3(0.3, 76.5, -9), V3(3.5, 71.5, -8.4), V3(6.5, 69.8, -7.6), V3(9.2, 70.4, -6.6),
    ], 0.05, sm('catenary', () => sm('black2', () => sm('black2', () => M(0x2a2e33, 0.85, 0.15)))), 16, 5);
    g.add(sag);
  }
}

/* ---------------- 第二轮建模精修：发射场细节 ---------------- */

function siteDetailPass(g, tex) {
  const steelHi = sm('towerhi', () => sm('twrHi', () => M(COL.towerSteelHi, 0.5, 0.45)));

  // 塔架电梯轨道 + 配重块（电梯井侧壁）
  {
    const rails = [];
    for (const sx of [-1, 1]) {
      rails.push({ p: [TWX_G + sx * 0.5, 30, TWZ_G], s: [0.14, 60, 0.2] });
    }
    instBoxes(g, steelHi, rails);
    const counter = box(0.9, 1.6, 0.3, sm('counter', () => M(0x3a414b, 0.7, 0.4)));
    counter.position.set(TWX_G + 1.4, 12, TWZ_G);
    g.add(counter);
  }
  // 发射台环形排水沟（格栅环）
  {
    const drain = new THREE.Mesh(new THREE.RingGeometry(15.6, 17.6, 48),
      new THREE.MeshStandardMaterial({ map: texDeck(), color: 0x59626e, roughness: 0.85, metalness: 0.3 }));
    drain.rotation.x = -Math.PI / 2;
    drain.position.y = 0.32;
    g.add(drain);
  }
  // 道口门卫房 + 道闸
  {
    const guardG = new THREE.Group();
    guardG.userData.bake = true;
    const guard = box(3.2, 2.8, 3.0, new THREE.MeshStandardMaterial({ map: texPanel(), color: 0xb8bec4, roughness: 0.85 }));
    guard.position.set(6.5, 1.5, 62);
    guardG.add(guard);
    const roofG = box(3.8, 0.3, 3.6, sm('concreteDeep', () => M(COL.concreteDeep, 0.9)));
    roofG.position.set(6.5, 3.0, 62);
    g.add(roofG);
    const winG = box(2.2, 1.0, 0.1, sm('guardwin', () => new THREE.MeshStandardMaterial({ color: 0x2a3a4a, emissive: COL.windowLit, emissiveIntensity: 0.5, roughness: 0.3 })));
    winG.position.set(6.5, 2.0, 63.52);
    g.add(winG);
    const boom = box(0.16, 0.16, 7, sm('gateboom', () => {
      const m = new THREE.MeshStandardMaterial({ map: texWarn(), roughness: 0.7 });
      return m;
    }));
    boom.position.set(2.2, 1.3, 66);
    boom.rotation.y = Math.PI / 2;
    guardG.add(boom);
    const post = cyl(0.14, 0.18, 1.4, sm('darkM', () => M(COL.darkMetal, 0.6, 0.4)), 8);
    post.position.set(5.6, 0.7, 66);
    guardG.add(post);
    g.add(guardG);
  }
  // 输电塔 ×3（沿公路，简化格构）
  {
    const pylons = [];
    const cross = [];
    for (let i = 0; i < 3; i++) {
      const bx = 14 + i * 26, bz = 78 + i * 6;
      for (const [dx, dz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
        pylons.push({ p: [bx + dx * 0.9, 8, bz + dz * 0.9], s: [0.16, 16, 0.16] });
      }
      for (let k = 1; k <= 2; k++) {
        cross.push({ p: [bx, k * 5.4, bz], s: [2.2, 0.14, 0.14] });
        cross.push({ p: [bx, k * 5.4, bz], s: [0.14, 0.14, 2.2] });
      }
      // 双悬横担
      cross.push({ p: [bx, 15.6, bz], s: [4.6, 0.2, 0.2] });
      cross.push({ p: [bx, 17.4, bz], s: [3.6, 0.16, 0.16] });
    }
    instBoxes(g, steelHi, pylons);
    instBoxes(g, steelHi, cross);
    // 电线（悬链细管）
    const wireMat = sm('powerline', () => sm('black2', () => M(0x2a2e33, 0.85, 0.15)));
    for (let i = 0; i < 2; i++) {
      const off = (i - 0.5) * 1.4;
      g.add(tubeAlong([
        V3(11, 15.0, 77 + off), V3(24, 13.2, 80 + off), V3(40, 13.2, 84 + off), V3(53, 15.0, 90 + off),
      ], 0.045, wireMat, 24, 4));
    }
  }
  // 砾石散布（车道旁，实例化矮碓）
  {
    const rnd = mulberry(611);
    const peb = [];
    for (let i = 0; i < 46; i++) {
      const side = rnd() > 0.5 ? 1 : -1;
      peb.push({
        p: [side * (7 + rnd() * 3), 0.18 + rnd() * 0.14, 40 + rnd() * 80],
        s: [0.7 + rnd() * 1.6, 0.3 + rnd() * 0.3, 0.6 + rnd() * 1.2],
        ry: rnd() * TAU,
      });
    }
    instBoxes(g, sm('peb', () => M(0x9a8f80, 0.95)), peb);
  }
  // 塔顶第二航空灯（对称面）
  {
    const b2 = glowSprite(2.0, '255,60,50', 0.9);
    b2.position.set(0, 75.8, TWZ_G + 2.5);
    g.add(b2);
    padBeacons.push(b2);
  }
}

/* 塔架几何常量（供 siteDetailPass 与 buildSite 共用口径） */
const TWX_G = 7.6;
const TWZ_G = -9;

/* ---------------- 第二轮建模精修：在轨细节（天宫机械臂 / 舷窗 / 船体徽标） ---------------- */

function orbitDetailPass(g) {
  const st = g.userData.station;
  // 天宫机械臂（两节臂 + 腕关节 + 末端爪，趴在核心舱侧面）
  {
    const armMat = sm('arm', () => M(0xc9a44a, 0.45, 0.55));
    const shoulder = cyl(0.045, 0.05, 0.06, armMat, 12);
    shoulder.rotation.z = Math.PI / 2;
    shoulder.position.set(-0.1, 0.085, 0.02);
    const segA = box(0.05, 0.05, 0.34, armMat);
    segA.position.set(0.1, 0.14, 0.16);
    segA.rotation.x = 0.9;
    const elbow = cyl(0.035, 0.04, 0.05, armMat, 10);
    elbow.position.set(0.1, 0.24, 0.3);
    const segB = box(0.045, 0.045, 0.3, armMat);
    segB.position.set(0.1, 0.34, 0.42);
    segB.rotation.x = -0.5;
    const wrist = sph(0.032, armMat, 10, 8);
    wrist.position.set(0.1, 0.4, 0.54);
    const clawA = box(0.02, 0.07, 0.02, armMat);
    clawA.position.set(0.1, 0.46, 0.56);
    clawA.rotation.x = 0.3;
    const clawB = clawA.clone();
    clawB.rotation.x = -0.3;
    st.add(shoulder, segA, elbow, segB, wrist, clawA, clawB);
  }
  // 舷窗（核心舱与实验舱，实例化发光点）
  {
    const wins = new THREE.InstancedMesh(
      new THREE.CircleGeometry(0.014, 8),
      sm('stwin', () => new THREE.MeshStandardMaterial({ color: 0x183248, emissive: 0x7ab8e8, emissiveIntensity: 0.8 })),
      10,
    );
    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));
    for (let i = 0; i < 10; i++) {
      const onCore = i < 6;
      const t = onCore ? (i - 2.5) * 0.09 : 0;
      const pos = onCore
        ? V3(-0.1 + t, 0, 0.074)
        : V3(0.15, 0.24 - 0.15, 0.058 + (i - 6) * 0.001);
      m4.compose(pos, q, V3(1, 1, 1));
      wins.setMatrixAt(i, m4);
    }
    wins.instanceMatrix.needsUpdate = true;
    st.add(wins);
  }
  // 神舟返回舱侧面 mini 国旗（贴片）
  const ship = g.userData.ship;
  {
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.075, 0.05),
      new THREE.MeshBasicMaterial({ map: texFlagCN() }));
    flag.position.set(-0.2, 0.02, 0.093);
    ship.add(flag);
    const flag2 = flag.clone();
    flag2.position.z = -0.093;
    flag2.rotation.y = Math.PI;
    ship.add(flag2);
  }
  // 地球内圈大气（浅蓝第二层 rim，层叠出厚度感）
  {
    const inner = new THREE.Mesh(
      new THREE.SphereGeometry(g.userData.R * 1.03, 40, 28),
      new THREE.ShaderMaterial({
        transparent: true, side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false,
        uniforms: { uColor: { value: new THREE.Color(0xbfe3ff) } },
        vertexShader: 'varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
        fragmentShader: 'uniform vec3 uColor; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 5.0); gl_FragColor = vec4(uColor, f * 0.6); }',
      }),
    );
    g.add(inner);
  }
}

/* ---------------- 第二轮建模精修：再入 / 着陆细节 ---------------- */

function reentryDetailPass(g) {
  const cap = g.userData.cap;
  // 侧壁桁条（周向 12 根细条）
  const stringerMat = sm('stringer', () => M(0x3a3630, 0.85, 0.1));
  const items = [];
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * TAU;
    items.push({
      p: [Math.cos(a) * 0.47, 0.62, Math.sin(a) * 0.47],
      s: [0.02, 0.52, 0.02],
      rz: Math.cos(a) * 0.32,
      rx: -Math.sin(a) * 0.32,
    });
  }
  instBoxes(cap, stringerMat, items);
  // 伞舱盖边缘 8 颗爆炸螺栓
  boltRing(cap, { r: 0.15, y: 1.24, n: 8, size: 0.016, hgt: 0.03, mat: sm('bolt2', () => sm('chrDeep', () => sm('chrDeep', () => M(COL.chromeDeep, 0.45, 0.7)))) });
  // 地面远山（地平线剪影层）
  for (let i = 0; i < 5; i++) {
    const a = i / 5 * TAU + 0.6;
    const m = new THREE.Mesh(new THREE.ConeGeometry(120, 26 + i * 6, 5),
      new THREE.MeshStandardMaterial({ map: TEX.rock, normalMap: TEX.rockN, color: 0x6a6258, roughness: 1 }));
    m.position.set(Math.cos(a) * 420, 8, Math.sin(a) * 420 - 60);
    g.add(m);
  }
}

function landingDetailPass(g) {
  const cap = g.userData.cap;
  // 底部缓冲裙边（防热大底外的软着陆环）
  const ring = torus(0.585, 0.045, matFabric(0x54503e, { rough: 0.9 }), 22, 6);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.08;
  cap.add(ring);
  // 主伞顶孔环 + 伞顶径向短索
  {
    const topRing = torus(0.3, 0.03, sm('chtop', () => M(0x8a8f96, 0.6, 0.3)), 14, 6);
    topRing.rotation.x = Math.PI / 2;
    g.userData.canopy.add(topRing);
    const lmat = new THREE.LineBasicMaterial({ color: COL.chuteLine });
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * TAU;
      const ln = new THREE.Line(new THREE.BufferGeometry().setFromPoints([
        V3(0, 0, 0), V3(Math.cos(a) * 0.9, -1.4, Math.sin(a) * 0.9),
      ]), lmat);
      g.userData.canopy.add(ln);
    }
  }
}
/* ---------------- 教学数据扩展（章节动态附表 + 卡片扩容 + 任务编年） ---------------- */

/** 再入走廊采样表（教学重建：不同再入角的典型结果） */
const RE_CORRIDOR = [
  { ang: '0.6°', peak: '—', result: '✗ 弹跳出大气（升力不足，未捕获）' },
  { ang: '1.0°', peak: '≈ 3.2 g', result: '⚠ 边缘：减速弱、落点偏远' },
  { ang: '1.5°', peak: '≈ 4.0 g', result: '✓ 名义走廊（神舟典型值）' },
  { ang: '2.0°', peak: '≈ 4.8 g', result: '✓ 名义走廊（黑障约 4 分钟）' },
  { ang: '3.0°', peak: '≈ 6.5 g', result: '⚠ 超限风险，热流陡增' },
  { ang: '4.5°', peak: '≈ 9 g+', result: '✗ 过载超限（超出航天员极限）' },
];

/** 失败案例速查（第 11 章自由发射台的复盘指南） */
const FAILURE_CASES = [
  { case: '推力 90% 点火', symptom: 'T/W≈1.13 仍离不了地？——计上风与摩擦后压线', fix: '推力 ≥ 96% 起飞；额定 100% 留 1.26 裕度' },
  { case: '载荷 12 t 超重', symptom: '末速差 200~400 m/s，入轨判定失败', fix: '二级比冲提到 315 s 或降载荷——量出每一千克的代价' },
  { case: '整流罩未到 110 km 就分离', symptom: '低空分离事件被跳过（判定保护）', fix: '高度不够时序自动延后——真实任务同样如此' },
  { case: '再入角 0.5°', symptom: '再入走廊红线：船被弹回太空', fix: '再入角 1.2°~2.6°；太浅太陡都不可' },
  { case: '再入角 4.5°', symptom: '过载峰值 9 g+，超出航天员极限', fix: '升力式再入滚转调节，压住 5 g 以内' },
  { case: '关反推硬着陆', symptom: '接地速度 ~7 m/s，冲击超结构限', fix: '保留反推：动量定理 FΔt=mΔv 把 7 压到 2 m/s' },
];

/** 逃逸救生时序（第 2 章演示的解说数据） */
const ESCAPE_TIMELINE = [
  { t: 'T+0 s', event: '故障判定，逃逸发动机点火', note: '8 台固体机总推力把整流罩+飞船整体推离' },
  { t: 'T+0.2 s', event: '已拉开安全距离', note: '分离速度保证避开爆炸火球' },
  { t: 'T+2.2 s', event: '逃逸塔分离', note: '塔完成使命，减轻返回质量' },
  { t: 'T+4 s', event: '进入弹道下降', note: '飞船带整流罩头锥下坠' },
  { t: 'T+数分钟', event: '开伞着陆', note: '降落在应急着陆区，搜救接力' },
];

/** 宇宙速度三兄弟（第 6 章附表） */
const COSMIC_V = [
  { name: '第一宇宙速度', v: '7.9 km/s', meaning: '贴近地面圆轨道——绕了不掉' },
  { name: '第二宇宙速度', v: '11.2 km/s', meaning: '逃逸地球引力——去月球/行星' },
  { name: '第三宇宙速度', v: '16.7 km/s', meaning: '逃逸太阳系——飞向星际' },
];

/** 术语速查（第 12 章检测页附录） */
const GLOSSARY = [
  ['推重比 T/W', '推力与起飞重力之比；>1 才能离地，CZ-2F 约 1.26'],
  ['比冲 Isp', '每千克推进剂产生冲量的效率；真空机 ≈300 s'],
  ['动压 q', '½ρv²，气动载荷强度；峰值出现在 ~11 km（Max-Q）'],
  ['重力转弯', '程序转弯让弹道逐渐倾斜，把速度从竖直转向水平'],
  ['热分离', '上级先点火再解锁分离，燃气经级间段排焰窗排出'],
  ['Max-Q', '最大动压时刻（约 70 s），箭体受力最严酷'],
  ['质量比 m₀/mf', '起飞质量与燃尽质量之比；分级的意义所在'],
  ['第一宇宙速度', '7.9 km/s，贴地圆轨道速度（圆轨道速度最大值）'],
  ['完全失重', '重力全部充当向心力，舱内一切自由下落'],
  ['交会对接', '轨道相位收敛 → 停泊接近 → 接触捕获 → 刚性连接'],
  ['黑障', '80~40 km 等离子鞘屏蔽电磁波，通信中断数分钟'],
  ['再入走廊', '再入角安全区间（≈1.2°~2.6°）；太浅弹跳、太陡超载'],
  ['升力式再入', '配平攻角产生升力，滚转调节方向控制落点'],
  ['收口绳', '限制伞衣初始充气直径的绳子，分级开伞减小冲击'],
  ['终端速度', '伞下重力与气动阻力平衡的匀速下落速度 ≈7 m/s'],
  ['反推发动机', '接地前 1 m 点火，把 7 m/s 压到 ≈2 m/s（动量定理）'],
  ['标称弹道', '设计基准飞行轨迹；实际飞行与其对比评估偏差'],
  ['零窗口', '发射时间不容偏差的窗口（空间站交会对接任务常用）'],
];

/** 知识卡扩容（场景叙事 + 6 张 → 共 18 张） */
RKT_CARDS.push(
  { name: '天宫空间站', cam: [[2.2, 1.2, 2.6], [0, 0.1, 0]], text: 'T 字构型：天和核心舱 + 问天/梦天实验舱 + 多端口对接口。神舟乘组 6 个月一轮换，机械臂辅助出舱与转位。' },
  { name: '搜救直升机', cam: [[30, 4, -16], [24, 2, -22]], text: '东风着陆场的空中搜救力量：机载测控 + 医疗组，落地后第一时间开舱。' },
  { name: '垂直总装厂房', cam: [[-80, 30, -50], [-96, 20, -78]], text: '火箭在此垂直总装与测试，整体转运至发射工位——「垂直总装、垂直测试、垂直转运」三垂模式。' },
  { name: '消防水池', cam: [[-24, 8, 44], [-30, 2, 40]], text: '导流槽喷水降温的水源：把 2000 ℃ 燃气与巨大声能压下来，保护发射台。' },
  { name: '测控楼', cam: [[80, 14, -20], [62, 7, -42]], text: '任务指挥显示中心：大屏墙上滚动着遥测参数，起飞后它就是任务的神经中枢。' },
  { name: '道路与门卫', cam: [[10, 4, 70], [6, 2, 63]], text: '唯一进场公路：道闸、门卫与围观平台。发射日这里会站满记者与家属。' },
);

/** 神舟任务编年分组（era 字段注入 + 列表编组渲染数据） */
function missionEra(i) {
  if (i < 4) return '无人试验阶段';
  if (i < 8) return '载人起步与出舱';
  if (i < 11) return '交会对接与中期驻留';
  return '空间站运营阶段';
}
MISSIONS.forEach((m, i) => { m.era = missionEra(i); });

/** 标称弹道扩充：补 605~680 s 帆板展开/测控弧段与更细的 0~60 s 段 */
NOMINAL.splice(1, 0,
  [4, 40, 20, 1.24, 0.2, 0.0, 479, '塔架包络清空'],
);
NOMINAL.push(
  [615, 468000, 7450, 0, 0, 548.0, 8.4, '测控弧段交接（远望/中继）'],
  [640, 468000, 7450, 0, 0, 575.0, 8.4, '姿态基准标定'],
  [680, 468000, 7450, 0, 0, 611.0, 8.4, '入轨状态确认 · 任务转常规运行'],
);

/** 章节附表注入器（selectChapter 每次切章调用；表格均为佐证性小表） */
function lessonExtras(idx) {
  let html = '';
  const tbl = (rows, cols) => {
    const th = cols.map((c) => `<th>${c}</th>`).join('');
    const trs = rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('');
    return `<table class="rkt-table"><tr>${th}</tr>${trs}</table>`;
  };
  if (idx === 1) {
    html = `<p style="margin-top:10px;font-size:12px;color:var(--text-faint)">逃逸救生时序（配合「逃逸救生演示」食用）：</p>`
      + tbl(ESCAPE_TIMELINE.map((r) => [r.t, r.event, r.note]), ['时刻', '事件', '解说']);
  } else if (idx === 3) {
    html = `<p style="margin-top:10px;font-size:12px;color:var(--text-faint)">US 标准大气分层（本实验大气模型的底表）：</p>`
      + tbl(ATM_LAYERS.map((r) => [`${(r[0] / 1000).toFixed(0)} km`, `${r[1].toFixed(1)} K`, `${(r[2] * 1000).toFixed(1)} K/km`, `${(r[3] / 1000).toFixed(1)} kPa`]), ['层底高度', '底温', '温度梯度', '底压']);
  } else if (idx === 4) {
    html = `<p style="margin-top:10px;font-size:12px;color:var(--text-faint)">分离时序与对应高度（点击控件跳转逐个观看）：</p>`
      + tbl(EVENTS.map((ev) => { const d = nominalAt(ev.t); return [`T+${ev.t} s`, `${(d.h / 1000).toFixed(0)} km`, `${(d.v / 1000).toFixed(2)} km/s`, ev.name]; }), ['时刻', '高度', '速度', '事件']);
  } else if (idx === 5) {
    html = `<p style="margin-top:10px;font-size:12px;color:var(--text-faint)">宇宙速度三兄弟：</p>`
      + tbl(COSMIC_V.map((r) => [r.name, r.v, r.meaning]), ['名称', '数值', '含义']);
  } else if (idx === 7) {
    html = `<p style="margin-top:10px;font-size:12px;color:var(--text-faint)">再入走廊采样（调滑杆逐点验证）：</p>`
      + tbl(RE_CORRIDOR.map((r) => [r.ang, r.peak, r.result]), ['再入角', '过载峰值', '结果']);
  } else if (idx === 10) {
    html = `<p style="margin-top:10px;font-size:12px;color:var(--text-faint)">失败案例速查（每次只改一个变量再飞）：</p>`
      + tbl(FAILURE_CASES.map((r) => [r.case, r.symptom, r.fix]), ['操作', '现象', '对策']);
  } else if (idx === 11) {
    html = `<p style="margin-top:10px;font-size:12px;color:var(--text-faint)">术语速查（检测附录）：</p>`
      + tbl(GLOSSARY, ['术语', '一句话解释']);
  }
  if (html) {
    const box = document.createElement('div');
    box.innerHTML = html;
    lessonEl.appendChild(box);
  }
}
/* ---------------- 第三轮：装配演示（第 1 章互动：吊装顺序回放） ----------------
 * 流程参照「三垂」模式的工位装配顺序：一级吊装 → 助推器 ×4 → 二级 →
 * 整流罩（含飞船）→ 逃逸塔。每件从吊装位飞入，easeInOutCubic 缓动 + 停顿，
 * 塔架天车同步微动，装配完成全线亮灯。 */

const ASM = { on: false, t: 0, seq: [], idx: -1, cur: null, saved: [] };
const ASM_SEQ = [
  { key: 's1', label: '一级吊装对接', from: [0, 46, -52], dur: 2.0 },
  { key: 'boosters', label: '助推器 ×4 吊装', from: [30, 40, -46], dur: 2.2 },
  { key: 's2', label: '二级吊装对接', from: [0, 66, -50], dur: 1.9 },
  { key: 'fair', label: '整流罩（含神舟）合罩', from: [-26, 62, -44], dur: 2.2 },
  { key: 'tower', label: '逃逸塔安装', from: [18, 74, -40], dur: 1.6 },
];
function asmStart() {
  if (!RKT.built || ASM.on) return;
  resetFlight();
  ST.spin = 0;
  ASM.saved = [];
  ASM.seq = ASM_SEQ.map((s) => ({ ...s, part: RKT.parts[s.key] }));
  // 全部部件先移到吊装起点并隐藏
  ASM.seq.forEach((s) => {
    const p = s.part;
    ASM.saved.push({ part: p, pos: p.position.clone() });
    p.position.set(s.from[0], RKT.padY + s.from[1], s.from[2]);
    p.visible = false;
  });
  ASM.idx = -1;
  ASM.t = 0;
  ASM.on = true;
  if (RKT.labels) RKT.labels.forEach((sl) => { sl.visible = false; });
  showToast('装配演示开始：按吊装顺序把火箭「搭」起来。', 'ok');
}
function asmReset() {
  if (!ASM.saved.length) { ASM.on = false; return; }
  ASM.saved.forEach((s) => {
    s.part.position.copy(s.pos);
    s.part.visible = true;
  });
  ASM.saved = [];
  ASM.seq = [];
  ASM.idx = -1;
  ASM.cur = null;
  ASM.on = false;
  if (RKT.labels && chapterIdx === 0) RKT.labels.forEach((sl) => { sl.visible = true; });
}
function asmStep(dt) {
  if (!ASM.on) return;
  ASM.t += dt;
  if (!ASM.cur) {
    ASM.idx++;
    if (ASM.idx >= ASM.seq.length) {
      ASM.on = false;
      showToast('装配完成：整装待发。↺ 复位可重新演示。', 'ok');
      asmReset();
      return;
    }
    ASM.cur = { ...ASM.seq[ASM.idx], t: 0 };
    ASM.cur.part.visible = true;
    showToast(`①${ASM.idx + 1}/${ASM.seq.length}　${ASM.cur.label}…`);
  }
  const c = ASM.cur;
  c.t += dt;
  const k = easeInOut(clamp(c.t / c.dur, 0, 1));
  const home = ASM.saved[ASM.idx].pos;
  c.part.position.set(
    lerp(c.from[0], home.x, k),
    lerp(RKT.padY + c.from[1], home.y, k),
    lerp(c.from[2], home.z, k),
  );
  c.part.rotation.y = lerp(0.6, 0, k);
  if (c.t >= c.dur + 0.45) {
    c.part.position.copy(home);
    c.part.rotation.y = 0;
    ASM.cur = null;
  }
}

/* ---------------- 第三轮：黄昏点火氛围（泛光灯 + 光锥 + 暮色） ---------------- */

const NIGHT = { on: false, spot: null, DAY: { sun: 2.35, hemi: 0.85, amb: 0.16, fill: 0.3, bounce: 0.22 } };
function ensureFloodSpot() {
  if (!NIGHT.spot) {
    const spot = new THREE.SpotLight(0xfff0d0, 0, 320, 0.38, 0.55, 1.2);
    spot.position.set(6, 76, TWZ_G + 1);
    spot.target.position.set(0, 12, 0);
    scene.add(spot, spot.target);
    NIGHT.spot = spot;
  }
  return NIGHT.spot;
}
function setNight(on) {
  NIGHT.on = on;
  const k = on ? 0.16 : NIGHT.DAY.sun;
  sun.intensity = on ? 0.55 : NIGHT.DAY.sun;
  sun.color.set(on ? 0xd8b8f0 : 0xfff0d8);            // 暮色偏冷
  hemi.intensity = on ? 0.28 : NIGHT.DAY.hemi;
  amb.intensity = on ? 0.34 : NIGHT.DAY.amb;
  fill.intensity = on ? 0.12 : NIGHT.DAY.fill;
  bounce.intensity = on ? 0.1 : NIGHT.DAY.bounce;
  const spot = ensureFloodSpot();
  spot.intensity = on ? 2600 : 0;
  if (RKT.lightCones) RKT.lightCones.visible = on;
  scene.traverse((o) => {
    if (o.userData && o.userData.isLampHalo) o.material.opacity = on ? 0.85 : 0.42;
  });
  if (on) {
    curBg.copy(spaceCol).lerp(new THREE.Color(0x2a3a5e), 0.55);
  } else {
    curBg.copy(skyCol);
  }
  if (ST.phase === 'idle') scene.background = curBg;
  showToast(on ? '黄昏点火氛围：泛光灯组点亮，暮色降临。' : '恢复白天光照。', 'ok');
}

/* ---------------- 第三轮：程序化纹理（盖板 / 桥架 / 保温层） ---------------- */

/** 排水盖板（长条格栅孔） */
function texGrate() {
  return ctex('grate', () => {
    const w = 256, h = 64;
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = '#59626e';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(14,18,24,0.9)';
    for (let i = 0; i < 16; i++) ctx.fillRect(8 + i * 15.5, 10, 8, h - 20);
    ctx.strokeStyle = 'rgba(200,206,212,0.4)';
    ctx.lineWidth = 2;
    ctx.strokeRect(2, 2, w - 4, h - 4);
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.repeat.set(6, 1);
    return tex;
  });
}

/** 电缆桥架孔板（竖向走线的开孔条） */
function texTray() {
  return ctex('tray', () => {
    const w = 64, h = 256;
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = '#6a7480';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(16,20,26,0.75)';
    for (let j = 0; j < 14; j++) {
      for (let i = 0; i < 3; i++) {
        ctx.fillRect(8 + i * 18, 10 + j * 18, 10, 8);
      }
    }
    ctx.strokeStyle = 'rgba(200,206,212,0.35)';
    ctx.lineWidth = 2;
    ctx.strokeRect(2, 2, w - 4, h - 4);
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 8);
    return tex;
  });
}

/** 管路保温层包裹纹（螺旋绑带） */
function texInsul() {
  return ctex('insul', () => {
    const w = 128, h = 64;
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = '#b8bcc0';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(80,90,100,0.5)';
    ctx.lineWidth = 3;
    for (let i = -1; i < 9; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 18, 0);
      ctx.lineTo(i * 18 + 14, h);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(232,110,70,0.6)';
    ctx.fillRect(0, h - 8, w, 8);
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.repeat.set(4, 1);
    return tex;
  });
}

/* ---------------- 第三轮：发射场细节第二轮（机电与建筑细部） ---------------- */

function siteDetailPass2(g, tex) {
  const steelHi = sm('towerhi', () => sm('twrHi', () => M(COL.towerSteelHi, 0.5, 0.45)));

  // 电缆桥架 ×2（沿塔身东面垂直上走，开孔板贴图）
  {
    const trayG = new THREE.Group();
    trayG.userData.bake = true;
    const trayMat = new THREE.MeshStandardMaterial({ map: texTray(), color: 0x8a92a0, roughness: 0.7, metalness: 0.3 });
    for (const sx of [0, 1]) {
      const tray = box(0.7, 62, 0.35, trayMat);
      tray.position.set(TWX_G / 2 + 1.5 + sx * 1.0, 33, TWZ_G - 3.6);
      trayG.add(tray);
      const clips = [];
      for (let k = 0; k < 10; k++) clips.push({ p: [TWX_G / 2 + 1.5 + sx * 1.0, 4 + k * 6.4, TWZ_G - 3.25], s: [1.1, 0.14, 0.5] });
      instBoxes(trayG, steelHi, clips);
    }
    g.add(trayG);
  }
  // 塔内楼梯段 ×4（斜踏步板，自下而上盘旋）
  {
    const steps = [];
    for (let f = 0; f < 4; f++) {
      const y0 = 3 + f * 17;
      for (let s = 0; s < 16; s++) {
        steps.push({
          p: [-TWX_G / 2 - 0.7 + (s % 4) * 0.5, y0 + s * 0.42, TWZ_G - 2.2 + (s % 8) * 0.35],
          s: [0.85, 0.06, 0.3],
        });
      }
    }
    instBoxes(g, new THREE.MeshStandardMaterial({ map: texDeck(), color: 0x6a7480, roughness: 0.8, metalness: 0.3 }), steps);
  }
  // 平台推拉门 ×4（各层通道口的滑门板）
  {
    const doorMat = new THREE.MeshStandardMaterial({ map: texPanel(), color: COL.warnYellow, roughness: 0.6, metalness: 0.15 });
    const doors = [];
    for (let i = 2; i <= 8; i += 2) {
      const y = i * 6.6 + 1.2;
      doors.push({ p: [TWX_G / 2 * 0.9, y, TWZ_G + 3.4 * 0.9 + 0.6], s: [1.6, 2.2, 0.12] });
    }
    instBoxes(g, doorMat, doors);
  }
  // 发射台电缆沟盖板 + 接地扁铁
  {
    const grateG = new THREE.Group();
    grateG.userData.bake = true;
    const grateMat = new THREE.MeshStandardMaterial({ map: texGrate(), roughness: 0.8, metalness: 0.3 });
    for (let i = 0; i < 6; i++) {
      const strip = box(2.2, 0.1, 30, grateMat);
      strip.position.set(-24 + i * 9, 0.3, 20);
      grateG.add(strip);
    }
    g.add(grateG);
    const strapMat = sm('strap', () => M(0xc9a44a, 0.55, 0.5));
    const strap = box(52, 0.06, 0.12, strapMat);
    strap.position.set(0, 0.26, 24.5);
    g.add(strap);
  }
  // 加注管廊斜撑（三角撑）
  {
    const braces = [];
    for (let i = 0; i < 5; i++) {
      const k = i / 4;
      const x = lerp(-46, -2, k), z = lerp(-18, -2, k);
      braces.push({ p: [x + 0.5, 2.2, z + 0.4], s: [0.14, 2.6, 0.14], rz: 0.6 });
      braces.push({ p: [x + 0.5, 2.2, z + 1.6], s: [0.14, 2.6, 0.14], rz: -0.6 });
    }
    instBoxes(g, steelHi, braces);
  }
  // 燃料库阀站（双阀 + 压力表盘 + 保温层管段）
  {
    const vs = new THREE.Group();
    const pipeMat2 = new THREE.MeshStandardMaterial({ map: texInsul(), roughness: 0.6, metalness: 0.2 });
    const seg = cyl(0.26, 0.26, 5, pipeMat2, 12);
    seg.rotation.z = Math.PI / 2;
    seg.position.y = 1.4;
    vs.add(seg);
    for (const vx of [-1.4, 1.4]) {
      const valve = torus(0.3, 0.09, sm('valve2', () => sm('valveRed', () => M(COL.bandRed, 0.5, 0.3))), 14, 6);
      valve.rotation.x = Math.PI / 2;
      valve.position.set(vx, 1.9, 0);
      const stem = cyl(0.05, 0.05, 0.7, sm('chrDeep', () => sm('chrDeep', () => M(COL.chromeDeep, 0.45, 0.7))), 6);
      stem.position.set(vx, 2.2, 0);
      vs.add(valve, stem);
    }
    const gauge = cyl(0.28, 0.28, 0.1, sm('gauge', () => new THREE.MeshStandardMaterial({ color: 0xf2f4f6, emissive: 0x8fd3a0, emissiveIntensity: 0.25 })), 14);
    gauge.rotation.x = Math.PI / 2;
    gauge.position.set(0, 2.6, 0.3);
    vs.add(gauge);
    vs.userData.bake = true;
    vs.position.set(-52, 0, -20);
    vs.rotation.y = 0.9;
    g.add(vs);
  }
  // 勤务楼入口雨棚 + 台阶 + 楼顶空调机组
  {
    const canopy = box(6, 0.3, 3, new THREE.MeshStandardMaterial({ map: texPanel(), color: 0x8f959c, roughness: 0.85 }));
    canopy.position.set(62 - 6, 4.2, -42 + 8);
    g.add(canopy);
    const steps = [];
    for (let s = 0; s < 5; s++) steps.push({ p: [62 - 6, 0.2 + s * 0.22, -42 + 10 + s * 0.55], s: [5 - s * 0.6, 0.22, 0.55] });
    instBoxes(g, new THREE.MeshStandardMaterial({ map: texDeck(), color: 0x8f959c, roughness: 0.9 }), steps);
    const acu = [];
    for (let i = 0; i < 3; i++) acu.push({ p: [56 + i * 5, 9.6, -46], s: [2.2, 1.0, 1.6] });
    instBoxes(g, sm('acu', () => M(0x9aa2ab, 0.75, 0.3)), acu);
  }
}

/* ---------------- 第三轮：箭体细节第二轮 ---------------- */

function rocketDetailPass2() {
  const g = RKT.g;
  const coverMat = sm('portcover', () => M(0xd6dadd, 0.5, 0.3));
  // 一级加注口盖 ×8（两排，微凸圆盖）
  {
    const covers = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.14, 0.16, 0.06, 10), coverMat, 8);
    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * TAU + 0.2;
      const y = i < 4 ? 8.5 : 20.5;
      m4.compose(V3(Math.cos(a) * 1.66, y, Math.sin(a) * 1.66), q.identity(), V3(1, 1, 1));
      covers.setMatrixAt(i, m4);
    }
    covers.instanceMatrix.needsUpdate = true;
    g.add(covers);
  }
  // 助推器头锥天线整流罩（4 只小鼓包）
  {
    const bumpMat = matPaint(COL.hullShade, { rough: 0.45 });
    RKT.parts.boosters.children.forEach((b, bi) => {
      for (let k = 0; k < 2; k++) {
        const bump = sph(0.18, bumpMat, 10, 8);
        bump.scale.set(1, 0.8, 1);
        bump.position.set(Math.cos(k * 2.1 + bi) * 0.55, 25.8 + k * 0.4, Math.sin(k * 2.1 + bi) * 0.55);
        b.add(bump);
      }
    });
  }
  // 整流罩内部支撑环 ×3（剖视时可见的工艺环）
  {
    const ringMat = sm('fring', () => M(0xb9bfc6, 0.6, 0.4));
    for (const ry of [1.2, 3.4, 5.6]) {
      const ring = torus(2.0, 0.07, ringMat, 26, 6);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = ry;
      RKT.parts.fair.add(ring);
    }
    // 环向空调管路（细管绕罩一周）
    const duct = torus(2.12, 0.035, sm('duct', () => M(0x9aa2ab, 0.6, 0.2)), 30, 5);
    duct.rotation.x = Math.PI / 2;
    duct.position.y = 4.6;
    RKT.parts.fair.add(duct);
    // 分离面锁扣 ×6
    const latchMat = sm('latch', () => M(0x8a92a0, 0.55, 0.45));
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * TAU;
      const latch = box(0.18, 0.34, 0.14, latchMat);
      latch.position.set(Math.cos(a) * 2.16, 2.5, Math.sin(a) * 2.16);
      latch.rotation.y = -a;
      RKT.parts.fair.add(latch);
    }
  }
  // 着陆舱舷窗照明（ Landing 用暖光内透）
}

/* ---------------- 第三轮：返回舱侧推口（再入/着陆两场景通用小件） ---------------- */

function capRCSAdd(cap) {
  const rcsMat = sm('caprcs', () => M(0x33302a, 0.7, 0.3));
  for (let k = 0; k < 4; k++) {
    const a = k / 4 * TAU + Math.PI / 4;
    const port = cyl(0.03, 0.045, 0.05, rcsMat, 8);
    port.position.set(0.5 * Math.cos(a) * 0.9, 0.72, 0.5 * Math.sin(a) * 0.9);
    port.rotation.z = Math.cos(a) * 0.5;
    port.rotation.x = -Math.sin(a) * 0.5;
    cap.add(port);
  }
  // 舷窗内透暖光（着陆开舱前的一点点生活气息）
  const cabLight = glowSprite(0.5, '255,220,160', 0.0);
  cabLight.position.set(0.16, 0.62, 0);
  cap.add(cabLight);
  cap.userData.cabLight = cabLight;
}
/* ---------------- 第四轮：教学内容扩展包 ----------------
 * ① 章节深读（每章 3-4 段延伸阅读，lessonExtras 注入）
 * ② 术语表 / 失败案例 / 知识卡扩容
 * ③ 任务档案逐任务 facts（点击任务行展开三条细节）
 * ④ 标称弹道细分（前 60 s 逐 8 s 一行 + 特征点加密） */

/** 章节深读（idx → 段落组；lessonExtras 注入「延伸阅读」折叠块） */
const LESSON_DEEP = {
  0: [
    ['为什么是白色箭体', '白色不是审美选择：液氮/液氧温区的低温推进剂对日照热吸收极其敏感，白色把大部分太阳辐射反射掉，箭体内温度更可控。CZ-2F 用的是常温推进剂，白漆更多是「管理可见性」——发射直播里，白色箭体在戈壁蓝天下轮廓最清晰，红蓝环带是摄像机自动对焦的锚点。'],
    ['58 米有多高', '把 CZ-2F 竖起来，相当于 20 层居民楼。但它比楼房「苗条」得多：芯级直径只有 3.35 m，长细比约 17——比绝大多数塔式结构都细长。所以起飞后 10 秒内就要开始程序转弯，风载与气动载荷决定了它的姿态节奏。'],
    ['「神舟」与「天宫」的分工', '神舟是天地往返运输器：把人送上去、把人接回来；天宫是太空中的「家」。神舟的三舱里，只有钟形的返回舱带整块烧蚀大底回家，轨道舱留轨继续工作、推进舱再入烧毁——「该省的省、该保的保」是飞船设计的经济学。'],
  ],
  1: [
    ['推力的两种来路', '化学火箭的推力 = 质量流量 × 喷气速度。想加大推力：要么「多烧」（加大流量，涡轮泵把推进剂每秒几百千克地灌进燃烧室），要么「喷快」（提高比冲——真空发动机把同样的燃气体积膨胀到更大喷管里，喷得更快）。CZ-2F 一级用前者，二级用后者。'],
    ['为什么偏二甲肼「毒但可靠」', '四氧化二氮 + 偏二甲肼一接触即自燃：没有点火器、没有点火时序，可靠性极高；常温储存让火箭可以提前加注、长期待命——载人任务里「确定性」比性能更值钱。代价是毒性与腐蚀性，发射场要组织毒气防护与污水回收。这是一笔典型的工程取舍账。'],
    ['质量比的暴政', 'Δv = ve·ln(m₀/mf) 里有个反直觉的事实：载荷每增加 1 kg，需要的推进剂远不止 1 kg——要带着「烧它的燃料」和「装燃料的壳」。用右侧滑杆把质量比从 6 拉到 3 再拉到 12，你会亲手摸到这条对数曲线的脾气。'],
  ],
  2: [
    ['倒计时在数什么', '倒计时的最后一分钟，塔架在忙：摆杆撤收、增压确认、转内部电源、点火时序注入。「零窗口」任务（空间站交会）连一秒都不能差——因为轨道平面在转，错过窗口就要再等一个轨道周期。'],
    ['导流槽的物理学', '发射瞬间的燃气流温度约 2000 ℃、速度数千 m/s。导流槽用一块楔形导流面把垂直喷流折向两侧，喷水系统同时做两件事：把声能（水幕吸声）和热能（蒸发吸热）一起压下来。没有它，发射台自身的混凝土会在几秒内被剥蚀。'],
    ['推重比 1.26 的余量哲学', '1.26 看似富余，其实只有 26% 的净加速余量——扣除重力损失与气动阻力后，前 10 秒的净加速度只有 ~2 m/s²量级。载人火箭宁可「慢慢起步」，也不把裕度压到无人机的水平：裕度就是应对故障的货币。'],
  ],
  3: [
    ['Max-Q 为什么要「熬过去」', '动压 q = ½ρv² 的峰值出现在「已经很忙很快、空气还没稀薄」的 11 km 附近。箭体结构按 Max-Q 设计：结构质量 × 安全系数 × q 峰值，三者相乘决定了箭壁厚度与加强筋数量。飞过 Max-Q，结构最严酷的考试就交卷了。'],
    ['航天员的「体重秤」', '上升段航天员感受的「体重」= m(g+a)。轴向过载峰值约 4 g 的意思是：此刻一位 70 kg 的航天员感觉自己约 280 kg。座椅的躺角经过设计，让过载方向沿着「胸-背」轴——人体在这个方向最能扛。'],
    ['重力转弯的「懒人智慧」', '程序转弯本质上是在「顺着重力拐弯」：让重力帮忙把速度方向从竖直掰向水平，火箭自己只出最小的控制量。这是弹道设计里「借力」思想最朴素的样子——不与物理对抗，让它替你干活。'],
  ],
  4: [
    ['分离是「爆炸螺栓」的时代了吗', '现代分离多用爆炸螺栓与火工锁，但神舟的一二级分离用的是「热分离」：二级先点火、排焰窗泄压、再解锁——分离瞬间两级之间隔着一层燃气垫，几乎无冲击接触。这套时序来自联盟号体系的传承，比「炸开」柔和得多。'],
    ['整流罩为什么要在 110 km 以上抛', '整流罩保护飞船度过稠密大气，110 km 以上大气已不构成威胁，它就从「铠甲」变成了「死重」。2 t 的质量在这一刻换成了约 60 m/s 的速度增量——抛罩是整场飞行里「性价比」最高的一次减重。'],
    ['残骸去哪了', '逃逸塔落在发射场附近搜救区；助推器与一级坠入内陆弹道落区；整流罩落在测控弧段覆盖的落区，有的还会被当地人捡到做铁皮棚——每一段残骸都有预先计算的落点与安全区，这是「抛掉包袱」的另一半工程：包袱扔到哪。'],
  ],
  5: [
    ['发射纬度的免费午餐', '地球自转在赤道给 0.46 km/s 的线速度，酒泉 41° 纬度只给 ~0.35 km/s。看似不多——但入轨速度 7.7 km/s 里每 0.1 km/s 都要用好几吨推进剂去换。海上发射（如海上平台）与低纬度发射场的商业逻辑就在这几百米每秒里。'],
    ['入轨判定的两道门', '第一道门是高度：低于 140 km，大气阻力几个轨道周期内就会把船拖下来；第二道门是速度：距圆轨道速度差 90 m/s 以内，才算真正「落不下来」。两道门一起过，飞船才从「弹道」毕业成「轨道」。'],
    ['「差一点」的代价', '仿真里入轨失败只是重开一局；现实里 1970 年代多次任务因为二级混合比偏差百分之几，末速差几十 m/s 而功亏一篑。这也是为什么遥测要逐秒比对标称弹道——偏差是复利的，越早发现越便宜。'],
  ],
  6: [
    ['失重不是「没有重力」', '350 km 高度重力还有地面的 89%。失重感的真正来源是「自由下落」：你和飞船以同样的加速度被地球拉着，彼此之间没有了支持力。电梯断缆的一瞬间你也会「失重」——同一回事，只是飞船下落得永不落地。'],
    ['92 分钟的日出生意', '轨道周期 92 分钟意味着 24 小时里绕地球 15.6 圈——一天 16 次日出。航天员的作息按 GMT 走而不是按日出走，遮光眼罩是空间站上最抢手的装备之一。'],
    ['对接的「毫米级芭蕾」', '两个 7.7 km/s 飞行的物体要相对速度 0.2 m/s 地靠近：先相位收敛（追上轨道相位），再 200 m 停泊点悬停，最后 30 m 内以厘米级速度最终接近。对接机构先「捕获」再「拉紧」再「刚性密封」——像握手：先碰指尖，再收拢，再握死。'],
  ],
  7: [
    ['黑障里的等待', '等离子鞘是船头压缩空气被电离的气体包层，它吸收和反射无线电波——通讯静默约 4~6 分钟。地面能做的只有两件事：用雷达盯着，用预测弹道推着。出黑障后的第一句通话，是每个乘组最安心的时刻。'],
    ['烧蚀是怎么「牺牲自己」的', '防热大底的烧蚀材料受热碳化、升华、成炭层，用材料自己的相变吸走热量并带走边界层——这是「用消耗换生存」的冷却方案。神舟大底烧蚀后的重量损失，是每次任务后必查的指标。'],
    ['升力式再入的落点账', '纯弹道式再入落点误差以百公里计；升力式再入靠滚转角调度升力方向，把落点收敛到十公里级——东风着陆场才能用直升机精准接力。滑杆里的「滚转角」就是这本账的方向盘。'],
  ],
  8: [
    ['开伞为什么在 10 km', '10 km 高度空气密度足够伞工作，速度也已被大气刹车降到 ~180 m/s。再早就开伞：动压会把伞衣撕碎；再晚就不够时间完成三级收口开伞。10 km 是「伞能活、时间够」的交集。'],
    ['1 200 m² 的伞有多大', '接近两个篮球场的面积，但伞衣布只有伞这类纺织品能做的轻薄——它靠 96 根伞绳把载荷均匀分走。伞绳的张力分布是降落伞设计里最精细的一章。'],
    ['反推的 0.2 秒', '反推发动机只在最后 1 米工作约 0.2 秒，把 7 m/s 压到 2 m/s。这 0.2 秒是整个任务里「最贵的 0.2 秒」之一：早了浪费燃料与高度，晚了等于没点。它由γ高度计触发，不允许人工干预。'],
  ],
  9: [
    ['回放里看什么', '看三处：① 70 s 的 Max-Q 曲线拐头；② 120~200 s 三连分离时遥测质量的阶梯下降；③ 585 s 入轨前后速度曲线「变平」——那是重力与离心加速度互相抵消的瞬间，飞船从「飞行」变成了「坠落不落地」。'],
    ['乘组轮换的节奏', '空间站阶段每 6 个月一轮换，发射窗口选在与空间站轨道面相交的「零窗口」。你可以从档案表里看出节奏：每年的 4~6 月与 10~11 月各有一次载人发射，这是轨道几何决定的「班车时刻表」。'],
    ['从SZ-5到SZ-21的二十二年', '2003 年杨利伟的 21 小时，到今天 183 天的常态化驻留——中间隔着的不是单点突破，而是交会对接、中期驻留、出舱、在轨维修等一整串能力的叠加。档案表每一行都是一个能力台阶。'],
  ],
  10: [
    ['发射不出去的一百种方法', '仿真给了你安全的失败：推力不足离不了地、载荷超重差速度、再入太浅弹跳、太陡超载、关反推硬着陆……每次失败后只改一个变量重飞——这就是工程里的「控制变量法」，比背公式有效十倍。'],
    ['裕度是用来花的', '找到「刚好入轨」的参数边界后，把它记下来：真实任务永远不按边界飞——留 10% 以上的运载裕度，是所有成功任务的共同习惯。裕度不是浪费，是对未知的定价。'],
    ['从仿真到正样', '真实型号的研制顺序和你现在的操作一样：全数字仿真 → 半实物仿真 → 惯组/发动机真件上台 → 出厂测试 → 发射。你在本页做的每一次「重新点火」，都对应着工业界里一轮评审与归零。'],
  ],
  11: [
    ['错题是最好的教材', '答错的题会在解析里给你回看的章节号——按图索骥回去重读那一段，比答对更重要。检测的目标不是分数，是把「每个参数为什么是这个数」问清楚。'],
    ['数字的出处感', '本页所有数字——推力 5923 kN、比冲 300 s、再入走廊 1.2°~2.6°、主伞 1200 m²——都是公开资料量级的教学重建。记住量级与因果，比记住小数点后的精度更重要。'],
    ['下一步可以玩什么', '把「自由发射台」里找到的入轨边界，与「神舟任务档案」里的真实任务对照：你会发现真实任务的参数永远站在边界内侧——工程的艺术不是到达极限，而是与极限保持体面的距离。'],
  ],
};

/** 术语表扩容（18 → 34 条） */
GLOSSARY.push(
  ['零窗口', '发射时刻不容偏差（空间站交会任务的常态），错过再等一个轨道周期'],
  ['摆杆', '连接塔架与箭体的加注/电缆桥架，起飞前撤收'],
  ['排焰窗', '级间段上的燃气出口，热分离时排走二级尾焰'],
  ['船箭分离', '末级关机后飞船与火箭解锁分开，入轨的最后一动作'],
  ['测控弧段', '地面站/中继卫星能看到飞船的时间窗，弧段外失联是常态'],
  ['逃逸走廊', '低高度故障时逃逸系统能把飞船送到开伞区的时间-速度包线'],
  ['配平攻角', '返回舱质心偏置使其在大气中自动保持一个迎角，从而产生升力'],
  ['滚转控制', '升力式再入过程中借助滚转调整升力指向的机动方式'],
  ['过载 g', '物体承受的加速度与重力加速度之比，人体耐限约 4~5 g（持续）'],
  ['声速封顶', '跨声速段阻力系数陡增，Ma≈1 附近是上升段第二个气动关口'],
  ['标称 vs 实飞', '标称弹道是设计基准；实飞遥测与它的偏差是飞行的「体检报告」'],
  ['归零', '航天工程术语：故障定位→机理复现→措施验证→举一反三的闭环流程'],
  ['垂直转运', '火箭整体竖立状态由活动发射平台转运至发射工位，「三垂」模式之一'],
  ['低温推进剂', '液氢/液氧等需深冷储存的推进剂，比冲高但蒸发与保温是难题'],
  ['常规推进剂', 'N₂O₄/偏二甲肼类常温可储存推进剂，CZ-2F 系列在用'],
  ['载荷专家', '以科学家身份选拔训练的航天员，负责在轨实验（如桂海潮）'],
  ['飞行工程师', '负责飞船系统操作与维修的航天员岗位'],
  ['弹道降落伞区', '按返回舱升力能力预先划定的若干备用着陆区'],
);

/** 失败案例扩容（6 → 14 条） */
FAILURE_CASES.push(
  { case: '二级比冲拉到下限 285 s', symptom: '末速差 ~150 m/s，擦着失败线', fix: '真实型号用真空混合比精度与喷管面积换比冲——参数环环相扣' },
  { case: '推力 110% 超频', symptom: '起飞更猛，但 Max-Q 动压显著抬高', fix: '推力不是越大越好：q 峰值决定结构载荷，超频要过结构关' },
  { case: '目标轨道 200 km 低轨', symptom: '更快入轨但衰减快（阻力残余）', fix: '载人驻留任务选 350~400 km——低轨是货运与侦察的 preference' },
  { case: '目标轨道 500 km 高轨', symptom: '末速要求更低但爬升段更久', fix: '越高越「省速度」越「费时间」——轨道高度是时间与速度的交换' },
  { case: '整流罩分离失败（教学推演）', symptom: '飞船超重 2 t 入不了轨', fix: '真实任务里分离火工件是「单点失效清单」的头排' },
  { case: '黑障中修改落点', symptom: '不可能——通信断了，指令进不去', fix: '升力式再入的落点修正必须发生在黑障前后，黑障中只能等待' },
  { case: '再入角 2.6° 顶格', symptom: '过载接近 5 g，热流陡增', fix: '走廊上限是给应急弹道留的，正常任务用 1.5°~2°' },
  { case: '侧风 6 m/s 着陆', symptom: '漂移 ~40 m，接近场地边缘', fix: '着陆场半径按最坏侧风 + 升力误差包络设计' },
);

/** 知识卡再扩容（18 → 30 张） */
RKT_CARDS.push(
  { name: '加注管廊', cam: [[-40, 8, -14], [-24, 4, -8]], text: '燃料库到发射台的架空管桥：推进剂沿保温管路走「最后一公里」，管廊支柱带斜撑抗风。' },
  { name: '水塔', cam: [[-40, 14, 46], [-44, 10, 44]], text: '球形水罐 + 支架：导流槽喷水降温的高位水源，发射前注满，点火时靠重力+泵联合供水。' },
  { name: '电梯井', cam: [[12, 40, -6], [5, 30, -9]], text: '塔架东侧的封闭井道：9 层停站，装配阶段测试人员与设备垂直交通全靠它。' },
  { name: '天车', cam: [[6, 78, -12], [0, 76, -11]], text: '塔顶检修吊车：吊装燃料加泄连接器与大型工装， yellow 小车在轨道梁上横移。' },
  { name: '排水沟', cam: [[-14, 3, 22], [0, 1, 20]], text: '发射平台一圈的格栅环沟：喷水降温与雨水共同排走，防止场坪积水影响设备。' },
  { name: '卫星星座', cam: [[2.4, 1.6, 2.8], [0, 0.1, 0]], text: '在轨场景里绕行的背景卫星：不同轨道面的星座以不同相位差速绕行——太空其实很忙。' },
  { name: '二次点火抬轨', cam: [[3.2, 2.0, 3.6], [0, 0.2, 0]], text: '霍曼转移演示：第一次切向点火抬高远地点，到顶再圆化——「两次点火换一条新轨道」。' },
  { name: '高空风修正层', cam: [[14, 30, 26], [0, 22, 0]], text: '再入 30~20 km 的风切变层：升力控制在这里做最后的落点修正，把误差收敛进着陆场。' },
  { name: '旗阵', cam: [[16, 5, 36], [0, 2, 30]], text: '东风着陆场的标志物：旗阵 + 靶环 + 十字标，直升机与车队按它找落点。' },
  { name: '烧蚀大底', cam: [[8, 94, 20], [0, 90, 0]], text: '再入场景里看船头：大底碳化发亮、火花剥离——它在用「牺牲自己」的方式给船降温。' },
  { name: '搜救车队', cam: [[-28, 3, 20], [-32, 2, 26]], text: '指挥车 + 医疗车 + 拖吊：开舱、医监、转运一条龙，落地后 10 分钟内到位是考核指标。' },
  { name: '测控大屏', cam: [[70, 10, -36], [62, 7, -42]], text: '勤务楼幕墙上的遥测大屏：绿色字符滚动的是高度/速度/程序角——任务的「心电图」。' },
);

/** 任务 facts（逐任务三条细节；点击档案行展开） */
const MISSION_FACTS = {
  'SZ-1': ['江泽民题写「神舟」船名', '返回舱落点误差仅 11 km，首次回收即精准', '无人考核了测控通信与回收分系统'],
  'SZ-2': ['搭载 64 项科学实验载荷', '首次在轨进行生命科学实验', '为载人鉴定了环境控制与生命保障'],
  'SZ-3': ['模拟人携带心律与血压传感器', '逃逸救生系统首次全程在轨验证', '测控网实现陆海空天一体化联试'],
  'SZ-4': ['-28 ℃ 低温发射，创造纪录', '返回舱座椅缓冲器按乘组体重定制', '突破寒冬发射环境适应性'],
  'SZ-5': ['杨利伟在轨展示中国国旗与联合国旗', '舱内手写飞行日志随船展出', '返回后杨利伟被称为「中国飞天第一人」'],
  'SZ-6': ['费俊龙在舱内连续 4 次前滚翻', '首次进行穿舱试验与工效学评价', '轨道舱留轨继续工作，开展空间环境探测'],
  'SZ-7': ['翟志刚出舱时展示五星红旗', '刘伯明在轨道舱协助，景海鹏值守返回舱', '释放伴飞小卫星拍摄舱外画面'],
  'SZ-8': ['首次空间交会对接（无人）', '验证相控阵雷达与对接机构', '为后续载人对接扫清技术路障'],
  'SZ-9': ['刘旺手动对接误差 18 mm', '刘洋成为中国首位女航天员', '首次进行在轨医学检查与失重防护'],
  'SZ-10': ['王亚平太空授课 40 分钟，6000 万师生收看', '首次绕飞交会验证', '在轨开展中国首次太空翻转教学实验'],
  'SZ-11': ['33 天中期驻留验证', '首次在轨完成医学超声检查', '为空间站长期驻留积累医学数据'],
  'SZ-12': ['首批入驻天和核心舱', '出舱 2 次，安装全景相机', '在轨 92 天完成空间站建造准备'],
  'SZ-13': ['在轨 183 天，首次长期驻留', '王亚平成为中国首位出舱女航天员', '首次在轨通过手动遥控实验转位试验'],
  'SZ-14': ['在轨迎接问天、梦天两个实验舱', '首次 6 舱组合体运行', '完成 3 次出舱活动'],
  'SZ-15': ['与 SZ-14 乘组首次「太空会师」', '6 人同时在轨，历史首次', '邓清明坚守 24 年终圆飞天梦'],
  'SZ-16': ['桂海潮：首位戴眼镜的载荷专家', '朱杨柱：首位航天飞行工程师出舱', '完成大量空间生命科学研究'],
  'SZ-17': ['汤洪波间隔 2 年多重返太空', '完成天和核心舱太阳翼修复试验', '首次在轨完成舱外维修作业验证'],
  'SZ-18': ['叶光富二度飞天并担任指令长', '李聪、李广苏均为「80 后」', '驻留期间迎接货运飞船对接'],
  'SZ-19': ['宋令东、王浩泽为首批「90 后」航天员', '王浩泽：中国首位女航天飞行工程师', '完成多次出舱与设备维护'],
  'SZ-20': ['中国航天日发射，主题呼应', '陈冬第二次担任指令长', '开展平台维护与科学实验滚动实施'],
  'SZ-21': ['武飞：最年轻的航天飞行工程师', '张洪章：载荷专家，专注空间材料', '乘组年轻化标志梯队建设成熟'],
};

/** 标称弹道细分：前 60 s 逐 8 s 补密（插值层，不改变既有特征点） */
(function densifyNominal() {
  const extra = [
    [3, 60, 14, 1.24, 0.1, 0.0, 478, ''],
    [11, 250, 55, 1.30, 1.4, 0.1, 470, ''],
    [18, 900, 100, 1.38, 5.0, 0.5, 461, ''],
    [26, 2000, 152, 1.47, 10.8, 1.1, 451, ''],
    [34, 3900, 220, 1.55, 18.2, 2.1, 439, '跨声速段（Ma≈0.95）'],
    [42, 7600, 290, 1.62, 24.0, 3.6, 427, ''],
    [50, 11400, 352, 1.69, 29.0, 5.5, 415, ''],
    [58, 15200, 418, 1.74, 30.4, 7.6, 402, ''],
  ];
  // 插入并保持时间有序
  extra.forEach((row) => {
    let i = 0;
    while (i < NOMINAL.length - 1 && NOMINAL[i + 1][0] <= row[0]) i++;
    NOMINAL.splice(i + 1, 0, row);
  });
  // 尾段补充：615~680 之间细化测控弧段
  NOMINAL.push(
    [660, 468000, 7450, 0, 0, 596.0, 8.4, 'GNC 分支确认 · 轨道根数定期化'],
  );
})();

/** lessonExtras 扩展：注入深读块（在既有附表之前） */
(function injectDeepReading() {
  const orig = lessonExtras;
  lessonExtras = function (idx) {
    const paras = LESSON_DEEP[idx];
    if (paras && paras.length) {
      const box = document.createElement('div');
      box.className = 'rkt-deep';
      box.innerHTML = `<div class="rkt-deep-head">延伸阅读</div>` + paras
        .map(([h, t]) => `<p class="rkt-deep-p"><b>${h}</b>　${t}</p>`)
        .join('');
      lessonEl.appendChild(box);
    }
    orig(idx);
  };
})();

/** 深读块样式挂载（一次） */
(function deepStyle() {
  const s = document.createElement('style');
  s.textContent = `
.rkt-deep { margin-top: 10px; border-top: 1px dashed var(--card-border); padding-top: 8px; }
.rkt-deep-head { font-size: 11px; font-weight: 600; letter-spacing: 0.1em; color: var(--text-faint); margin-bottom: 6px; }
.rkt-deep-p { font-size: 12px; line-height: 1.66; color: var(--text-dim); margin: 0 0 8px; }
.rkt-deep-p b { color: var(--text); }
.rkt-facts { margin: 8px 0 2px; padding: 8px 10px; border: 1px solid color-mix(in srgb, var(--accent) 30%, transparent); border-radius: 10px; background: var(--accent-soft); }
.rkt-facts li { font-size: 12px; line-height: 1.6; color: var(--text); margin-left: 16px; }
`;
  document.head.appendChild(s);
})();

/** 任务 facts 渲染由 p7 的 buildMissionList 原函数内实现（点击行展开 MISSION_FACTS） */
/* ---------------- 第三轮建模：实例化细节包（共享材质 + 烘焙/实例化，不加 draw call 负担） ----------------
 * 每个子系统均为 1~2 个 draw call：口盖阵列 / 加强筋环 / 级间导流板 / 营地帐篷 /
 * 路缘石 / 戈壁石堆 / 停机坪标线 / 医疗帐篷 / 在轨碎片环。 */

/** 箭体第三轮：检查口盖 + 环向加强筋 + 级间导流板 */
function rocketDetailPass3() {
  const g = RKT.g;
  // 一级/二级检查口盖阵列（InstancedMesh，24 只 1 call）
  {
    const inst = new THREE.InstancedMesh(
      new THREE.CylinderGeometry(0.11, 0.13, 0.05, 8),
      sm('portcover', () => M(0xd6dadd, 0.5, 0.3)),
      24,
    );
    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    let k = 0;
    for (let ring = 0; ring < 3; ring++) {
      const y = 6.5 + ring * 8.6;
      for (let i = 0; i < 8; i++) {
        const a = i / 8 * TAU + ring * 0.4;
        m4.compose(V3(Math.cos(a) * 1.66, y, Math.sin(a) * 1.66), q, V3(1, 1, 1));
        inst.setMatrixAt(k++, m4);
      }
    }
    inst.instanceMatrix.needsUpdate = true;
    g.add(inst);
  }
  // （助推器环向加强筋：为守住 draw call <200 预算移除，细节由口盖与导流板承担）
  function boostersCircles() {
    const out = [];
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2 + Math.PI / 4;
      const cx = Math.cos(a) * 2.62, cz = Math.sin(a) * 2.62;
      for (const y of [5, 10.5, 16, 21]) out.push([cx, cz, y]);
    }
    return out;
  }
  // 级间段排焰窗导流板（4 片小斜板，实例化）
  {
    const inst = new THREE.InstancedMesh(
      new THREE.BoxGeometry(0.5, 0.5, 0.08),
      sm('darkM', () => M(COL.darkMetal, 0.6, 0.4)),
      4,
    );
    const m4 = new THREE.Matrix4();
    const e = new THREE.Euler();
    const q = new THREE.Quaternion();
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2 + Math.PI / 4;
      q.setFromEuler(e.set(0.5, -a + Math.PI / 2, 0));
      m4.compose(V3(Math.cos(a) * 1.78, 29.4, Math.sin(a) * 1.78), q, V3(1, 1, 1));
      inst.setMatrixAt(i, m4);
    }
    inst.instanceMatrix.needsUpdate = true;
    g.add(inst);
  }
}

/** 发射场第三轮：营地 / 路缘石 / 石堆 / 停机坪 / 塔基座 */
function siteDetailPass3(g, tex) {
  const steelHi = sm('twrHi', () => M(COL.towerSteelHi, 0.5, 0.45));

  // 塔基混凝土基座 ×4（打包烘焙）
  {
    const baseG = new THREE.Group();
    baseG.userData.bake = true;
    const baseMat = sm('concreteDeep', () => M(COL.concreteDeep, 0.9));
    for (const [cx, cz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      const plinth = box(2.6, 0.9, 2.6, baseMat);
      plinth.position.set(cx * 4.1, 0.45, TWZ_G + cz * 3.0);
      baseG.add(plinth);
    }
    g.add(baseG);
  }
  // 戈壁石堆（64 块散石，两份实例化）
  {
    const rnd = mulberry(909);
    const rockMat = sm('peb', () => M(0x9a8f80, 0.95));
    const a1 = [], a2 = [];
    for (let i = 0; i < 64; i++) {
      const a = rnd() * TAU;
      const d = 90 + rnd() * 420;
      const it = {
        p: [Math.cos(a) * d, 0.25 + rnd() * 0.5, Math.sin(a) * d + 20],
        s: [0.8 + rnd() * 2.6, 0.5 + rnd() * 1.1, 0.7 + rnd() * 2.0],
        ry: rnd() * TAU, rx: (rnd() - 0.5) * 0.3,
      };
      a1.push(it);
    }
    instBoxes(g, rockMat, a1);
  }
  // 远处营地帐篷 ×8（两份实例化：篷顶白 + 门帘橙）
  {
    const rnd = mulberry(404);
    const tentMat = sm('tent', () => matFabric(0xe8e4da, { rough: 0.85 }));
    const tops = [];
    for (let i = 0; i < 8; i++) {
      const bx = -140 + rnd() * 60, bz = 60 + rnd() * 50;
      tops.push({ p: [bx, 1.4, bz], s: [3.4, 2.4, 2.6], ry: rnd() * 0.6 });
    }
    instBoxes(g, tentMat, tops);
  }
  // 围栏加密延伸（东西两翼，实例化）
  {
    const fp = [], fr = [];
    for (let i = 0; i <= 16; i++) {
      const x = -44 - i * 4;
      fp.push({ p: [x, 0.9, 66], s: [0.12, 1.8, 0.12] });
      if (i < 16) fr.push({ p: [x - 2, 1.5, 66], s: [4, 0.07, 0.07] });
    }
    instBoxes(g, steelHi, fp);
    instBoxes(g, steelHi, fr);
  }
}

/** 在轨第三轮：碎片环（退役整流罩/废弃件，实例化 1 call） */
function orbitDetailPass2(g) {
  const R = g.userData.R;
  const inst = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.03, 0.03, 0.07),
    sm('sat', () => M(COL.stationBody, 0.5, 0.5)),
    12,
  );
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const rnd = mulberry(777);
  for (let i = 0; i < 12; i++) {
    const a = rnd() * TAU;
    const rr = R * (1.5 + rnd() * 0.3);
    const inc = (rnd() - 0.5) * 0.9;
    const x = Math.cos(a) * rr, z = -Math.sin(a) * rr * Math.cos(inc), y = Math.sin(a) * rr * Math.sin(inc);
    q.setFromEuler(new THREE.Euler(rnd() * 3, rnd() * 3, rnd() * 3));
    m4.compose(V3(x, y, z), q, V3(0.8 + rnd() * 0.6, 0.8 + rnd() * 0.6, 1));
    inst.setMatrixAt(i, m4);
  }
  inst.instanceMatrix.needsUpdate = true;
  g.add(inst);
}

/** 着陆场第三轮：医疗帐篷 + 轮胎痕 */
function landingDetailPass2(g) {
  // 医疗帐篷 ×2（打包烘焙）
  {
    const medG = new THREE.Group();
    medG.userData.bake = true;
    const tentMat = sm('tent', () => matFabric(0xe8e4da, { rough: 0.85 }));
    const crossMat = sm('medcross', () => new THREE.MeshBasicMaterial({ color: 0xd9534f }));
    for (const [px, pz, ry] of [[-34, 6, 0.6], [-40, 14, -0.3]]) {
      const tent = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 2.6, 2.6, 4), tentMat);
      tent.position.set(px, 1.3, pz);
      tent.rotation.y = ry;
      medG.add(tent);
      const cross1 = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.3), crossMat);
      cross1.position.set(px + 1.6 * Math.cos(ry + 1.57), 1.4, pz + 1.6 * Math.sin(ry + 1.57));
      cross1.rotation.y = ry + 1.57;
      medG.add(cross1);
      const cross2 = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.9), crossMat);
      cross2.position.copy(cross1.position).add(V3(0, 0.001, 0));
      cross2.rotation.copy(cross1.rotation);
      cross2.position.y += 0.2;
      medG.add(cross2);
    }
    g.add(medG);
  }
  // 着陆区轮胎痕（车辙，深色扁条实例化）
  {
    const trackMat = sm('track', () => M(0x8f8272, 0.95));
    const items = [];
    const rnd = mulberry(515);
    for (let i = 0; i < 24; i++) {
      const t = i / 24;
      items.push({
        p: [-30 + t * 26 + (rnd() - 0.5) * 1.2, 0.05, 14 + Math.sin(t * 6) * 3 + (rnd() - 0.5) * 1.6],
        s: [2.2, 0.04, 0.34],
        ry: Math.sin(t * 6) * 0.2,
      });
    }
    instBoxes(g, trackMat, items);
  }
}

/** 再入第三轮：高空云层片（稀薄卷云，实例化 1 call，再入高空背景层） */
function reentryDetailPass2(g) {
  const inst = new THREE.InstancedMesh(
    new THREE.PlaneGeometry(16, 9),
    sm('cirrus', () => new THREE.MeshBasicMaterial({ color: 0x9fb4cc, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false })),
    10,
  );
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));
  const rnd = mulberry(626);
  for (let i = 0; i < 10; i++) {
    const y = (46 + rnd() * 26) * 1000 * 9e-4;
    m4.compose(V3(-70 + rnd() * 90, y, -40 + rnd() * 80), q, V3(0.8 + rnd() * 1.4, 0.8 + rnd(), 1));
    inst.setMatrixAt(i, m4);
  }
  inst.instanceMatrix.needsUpdate = true;
  g.add(inst);
}
/* ---------------- HUD（右栏数据读数）/ 提示条 ---------------- */

let hud = null;
function setHUD(rows) {
  const box = document.getElementById('lcData');
  box.innerHTML = '';
  hud = makeHUD(box, rows);
  hud.el.dataset.mode = rows.map(([k]) => k).join(',');
  rows.forEach(([k]) => hud.set(k, '–'));
}
function hset(key, text) { if (hud) hud.set(key, text); }

const toastEl = document.createElement('div');
toastEl.className = 'rkt-toast';
stage.appendChild(toastEl);
let toastTimer = null;
function showToast(msg, kind) {
  if (!msg) { toastEl.classList.remove('show'); return; }
  toastEl.textContent = msg;
  toastEl.classList.remove('ok', 'bad');
  if (kind) toastEl.classList.add(kind);
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 6500);
}

/* ---------------- 遥测面板（曲线 + 事件时序 + 任务钟） ---------------- */

const telemPanel = document.getElementById('telemPanel');
const telemPlotEl = document.getElementById('telemPlot');
const telemCtx = telemPlotEl.getContext('2d');
const telemLegendEl = document.getElementById('telemLegend');
const telemEventsEl = document.getElementById('telemEvents');
const telemClockEl = document.getElementById('telemClock');
const telemPlotW = 304, telemPlotH = 168;   // 逻辑尺寸（canvas 2x）

let telemMode = '';        // '', 'flight', 'replay', 'reentry', 'landing'
let telemEvents = [];      // [{t, name, el}]
let plotHist = [];         // 活动曲线数据 [t/s, v km/s, h km, q kPa, g]
let compareOn = false;     // 真实任务对比（标称弹道虚线叠加）

/** 初始化本章遥测事件行（Events 数组），返回无 */
function telemSetup(show = true) {
  telemEventsEl.innerHTML = '';
  telemEvents = [];
  if (!show) { drawTelemPlot(-1); return; }
  EVENTS.forEach((ev) => {
    const row = document.createElement('div');
    row.className = 'ev future';
    row.innerHTML = `<span class="ev-t"></span><span class="ev-n"></span>`;
    row.querySelector('.ev-t').textContent = fmtT(ev.t);
    row.querySelector('.ev-n').textContent = ev.name;
    telemEventsEl.appendChild(row);
    telemEvents.push({ t: ev.t, name: ev.name, el: row });
  });
  drawTelemPlot(-1);
}
/** 运行中补充事件（如热分离提前触发） */
function telemMark(t, name) {
  if (!name) return;
  const dup = telemEvents.find((e) => e.name === name);
  if (dup) return;
  const row = document.createElement('div');
  row.className = 'ev future';
  row.innerHTML = `<span class="ev-t"></span><span class="ev-n"></span>`;
  row.querySelector('.ev-t').textContent = fmtT(t);
  row.querySelector('.ev-n').textContent = name;
  telemEventsEl.appendChild(row);
  telemEvents.push({ t, name, el: row });
}
function fmtT(t) {
  if (t < 0) return 'T-' + String(Math.ceil(-t)).padStart(2, '0') + 's';
  const m = Math.floor(t / 60), s = Math.floor(t % 60);
  return `T+${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
function telemEventsUpdate(curT, done) {
  telemEvents.forEach((e) => {
    const was = e.el.classList.contains('now');
    const state = curT >= e.t ? 'past' : 'future';
    e.el.classList.toggle('past', state === 'past' && !was);
    e.el.classList.toggle('future', state === 'future');
    if (curT >= e.t - 1.5 && curT < e.t + 4 && !done) {
      e.el.classList.add('now');
    } else {
      e.el.classList.remove('now');
    }
  });
}
function telemClockSet(text, mode = '') {
  telemClockEl.textContent = text;
  telemClockEl.classList.toggle('hold', mode === 'hold');
  telemClockEl.classList.toggle('counting', mode === 'count');
}

/** 遥测曲线绘制：实时曲线 + 可选标称弹道虚线对比 + 当前时刻标线 */
function drawTelemPlot(tMark = -1) {
  const ctx = telemCtx;
  const w = telemPlotW, h = telemPlotH;
  ctx.setTransform(2, 0, 0, 2, 0, 0);
  ctx.clearRect(0, 0, w, h);
  const st = getComputedStyle(document.documentElement);
  const grid = st.getPropertyValue('--card-border').trim() || '#8899aa88';
  const fg = st.getPropertyValue('--text-faint').trim() || '#98a2ac';
  ctx.strokeStyle = grid;
  ctx.fillStyle = fg;
  ctx.lineWidth = 1;
  ctx.font = '9px sans-serif';
  // 坐标框
  const ox = 26, oy = h - 20, iw = w - ox - 6, ih = oy - 14;
  ctx.strokeRect(ox, 14, iw, ih);
  // 横向网格（时间 0..tMax 分钟）
  const tMax = Math.max(
    2,
    plotHist.length ? plotHist[plotHist.length - 1][0] / 60 : 0,
    compareOn ? NOMINAL[NOMINAL.length - 1][0] / 60 : 0,
    telemMode === 'replay' ? 10 : 2,
  ) * 1.06;
  ctx.textAlign = 'center';
  for (let i = 1; i <= 5; i++) {
    const x = ox + iw * i / 5;
    ctx.beginPath(); ctx.moveTo(x, 14); ctx.lineTo(x, oy); ctx.stroke();
    ctx.fillText((tMax * i / 5).toFixed(1), x, oy + 10);
  }
  ctx.fillText('t / min', ox + iw / 2, oy + 18);
  ctx.textAlign = 'right';
  // 量程：速度 km/s（主轴 0..8）、高度 km（0..500）、动压 kPa（0..35）、过载 g（0..4.5）
  const S = [
    { max: 8, fmt: (v) => v.toFixed(1), label: 'km/s', col: COL.plotV },
    { max: 500, fmt: (v) => (v / 1).toFixed(0), label: 'km', col: COL.plotH },
    { max: 35, fmt: (v) => v.toFixed(0), label: 'kPa', col: COL.plotQ },
    { max: 4.5, fmt: (v) => v.toFixed(1), label: 'g', col: COL.plotG },
  ];
  // 标称弹道（对比模式：虚线）
  if (compareOn) {
    ctx.setLineDash([3, 3]);
    drawSeries((t) => {
      const d = nominalAt(t * 60);
      return [d.v / 1000, d.h / 1000, d.q, d.a];
    }, NOMINAL[NOMINAL.length - 1][0], COL.plotRef, 1.2);
    ctx.setLineDash([]);
  }
  // 上一次飞行残影（sandbox 对比模式）
  if (ST.showGhost && ST.ghostHist && ST.ghostHist.length > 1) {
    ctx.setLineDash([2, 3]);
    ctx.globalAlpha = 0.55;
    const gl = (idx, Si) => {
      ctx.strokeStyle = '#5cc7a4';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ST.ghostHist.forEach((p, i) => {
        const px = ox + (p[0] / 60 / tMax) * iw;
        const py = oy - clamp(p[idx] / Si.max, 0, 1.02) * ih;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      });
      ctx.stroke();
    };
    S.forEach((Si, i) => gl(i + 1, Si));
    ctx.globalAlpha = 1;
    ctx.setLineDash([]);
    const lg = document.createElement('span');
    lg.className = 'lg dim';
    lg.innerHTML = `<i style="background:#5cc7a4"></i>上次飞行残影`;
    telemLegendEl.appendChild(lg);
  }
  // 实时曲线
  if (plotHist.length > 1) {
    const line = (idx, Si) => {
      ctx.strokeStyle = Si.col;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      plotHist.forEach((p, i) => {
        const px = ox + (p[0] / 60 / tMax) * iw;
        const py = oy - clamp(p[idx] / Si.max, 0, 1.02) * ih;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      });
      ctx.stroke();
    };
    S.forEach((Si, i) => line(i + 1, Si));
  }
  // 当前时刻标线
  if (tMark >= 0) {
    const x = ox + clamp(tMark / 60 / tMax, 0, 1) * iw;
    ctx.strokeStyle = 'rgba(232,103,74,0.8)';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    ctx.beginPath(); ctx.moveTo(x, 14); ctx.lineTo(x, oy); ctx.stroke();
    ctx.setLineDash([]);
  }
  // 图例
  telemLegendEl.innerHTML = '';
  const items = [
    ['速度 v', COL.plotV], ['高度 h', COL.plotH], ['动压 q', COL.plotQ], ['过载 a', COL.plotG],
  ];
  if (compareOn) items.push(['标称弹道（真实任务量级）', COL.plotRef]);
  items.forEach(([name, col]) => {
    const lg = document.createElement('span');
    lg.className = 'lg' + (col === COL.plotRef ? ' dim' : '');
    lg.innerHTML = `<i style="background:#${col.toString(16).padStart(6, '0')}"></i>${name}`;
    telemLegendEl.appendChild(lg);
  });
  function drawSeries(fn, tEnd, col, lw) {
    ctx.strokeStyle = '#' + col.toString(16).padStart(6, '0');
    ctx.lineWidth = lw;
    S.forEach((Si, si) => {
      ctx.beginPath();
      for (let t = 0; t <= tEnd; t += tEnd / 90) {
        const d = fn(t);
        const px = ox + (t / 60 / tMax) * iw;
        const py = oy - clamp(d[si] / Si.max, 0, 1.02) * ih;
        if (t === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();
    });
  }
}

/* ST 扩展字段兜底（残影对比） */
if (ST.showGhost === undefined) { ST.showGhost = true; ST.ghostHist = null; }

/* ---------------- 上升段 HUD 刷新 ---------------- */

function fuelBar(pct) {
  const n = Math.round(clamp(pct, 0, 1) * 8);
  return '█'.repeat(n) + '░'.repeat(8 - n);
}
function updFlightHUD() {
  if (!hud) return;
  const mode = hud.el.dataset.mode || '';
  const P = thrustProfile(ST.t);
  const m = currentMass();
  const drag = 0.5 * rhoAt(ST.h) * ST.v * ST.v * 0.42 * (ST.t < 140 ? 16.4 : 12.2);
  const has = (k) => mode.split(',').includes(k);
  // 任务钟
  if (ST.countdown >= 0 && ST.phase === 'idle') telemClockSet('T-' + Math.ceil(ST.countdown) + 's', 'count');
  else if (ST.phase === 'run' || ST.phase === 'pause' || ST.phase === 'coast') telemClockSet(fmtT(ST.t), '');
  else telemClockSet('待命', 'hold');
  telemEventsUpdate(ST.t, ST.done);
  if (has('t')) hset('t', fmtT(ST.t));
  if (has('h')) hset('h', (ST.h / 1000).toFixed(1) + ' km');
  if (has('v')) hset('v', ST.v < 1200 ? ST.v.toFixed(0) + ' m/s（Ma ' + (ST.v / Math.max(aSound(ST.h), 1)).toFixed(1) + '）' : (ST.v / 1000).toFixed(2) + ' km/s');
  if (has('a')) hset('a', ST.phase === 'run' && P.T > 0 ? ((P.T - drag) / m / 9.8).toFixed(1) + ' g' : '–');
  if (has('q')) hset('q', (ST.maxQ / 1000).toFixed(1) + ' kPa @ ' + (ST.maxQh / 1000).toFixed(1) + ' km');
  if (has('tw')) hset('tw', ((5923e3 * CFG.thrustPct / 100) / (m0() * gAt(0))).toFixed(2));
  if (has('x')) hset('x', (ST.x / 1000).toFixed(0) + ' km');
  if (has('m')) hset('m', (m / 1000).toFixed(1) + ' t');
  if (has('fu')) {
    hset('f1', '一级 ' + fuelBar(1 - ST.bc / M2.s1Prop) + ' ' + Math.round(clamp(1 - ST.bc / M2.s1Prop, 0, 1) * 100) + '%');
    hset('fb', '助推 ' + fuelBar(1 - ST.bb / M2.boostProp) + ' ' + Math.round(clamp(1 - ST.bb / M2.boostProp, 0, 1) * 100) + '%');
    hset('f2', '二级 ' + fuelBar(1 - ST.s2burn / M2.s2Prop) + ' ' + Math.round(clamp(1 - ST.s2burn / M2.s2Prop, 0, 1) * 100) + '%');
  }
  if (has('st')) hset('st', ST.phase === 'idle' ? (ST.countdown >= 0 ? '倒计时' : '待命') : ST.done ? (ST.orbit ? '✓ 已入轨' : '✗ 未入轨') : ST.t < 157 ? '一二级工作' : ST.t < 585 ? '二级工作' : '滑行/入轨');
  if (mode.includes('vc')) {
    const vc = vCirc(ST.h);
    hset('vc', (vc / 1000).toFixed(2) + ' km/s');
    hset('dv', ST.done
      ? (ST.orbit ? '✓ 已入轨' : '差 ' + (vc - ST.v).toFixed(0) + ' m/s')
      : (vc >= ST.v ? '差 ' + (vc - ST.v).toFixed(0) + ' m/s' : '富余 ' + (ST.v - vc).toFixed(0) + ' m/s'));
    hset('vd', (vCirc(CFG.targetAlt * 1000) / 1000).toFixed(2) + ' km/s @ ' + CFG.targetAlt + ' km');
  }
}
/** 任务回放 HUD（第 10 章，数据来自标称弹道表） */
function updReplayHUD(d) {
  const mi = MISSIONS[ARCH.missionIdx] || MISSIONS[12];
  hset('mission', mi.no + ' · ' + mi.date.slice(0, 7));
  hset('crew', mi.crew.length ? mi.crew.join(' / ') : '无人飞行');
  hset('clock', fmtT(ARCH.t));
  hset('h', (d.h / 1000).toFixed(1) + ' km');
  hset('v', (d.v / 1000).toFixed(2) + ' km/s');
  hset('a', d.a.toFixed(2) + ' g');
  hset('q', d.q.toFixed(1) + ' kPa');
  hset('note', d.note || mi.note.slice(0, 18) + '…');
  telemClockSet(fmtT(ARCH.t), ARCH.playing ? '' : 'hold');
  telemEventsUpdate(ARCH.t, ARCH.done);
}

/* ---------------- 章节控件（createControlsPanel 包装） ---------------- */

const ctl = createControlsPanel(document.getElementById('controls'));

function introCtl() {
  ctl.clear();
  const views = [
    ['整机', [40, 30, 74], [0, 27, 0]],
    ['中部', [15, 38, 27], [0, 36, 0]],
    ['发动机', [11, 6, 15], [0, 3, 0]],
    ['顶部', [9, 64, 17], [0, 56, 0]],
    ['塔架', [24, 40, -34], [2, 40, -9]],
  ];
  views.forEach(([t, pos, tgt]) => ctl.button({ label: t, onClick: () => app.setCamera(pos, tgt) }));
  ctl.sep();
  ctl.toggle({ label: '部件标注', value: true, onChange: (v) => { if (RKT.labels) RKT.labels.forEach((s) => { s.visible = v; }); } });
  ctl.toggle({ label: '发射场标注', value: false, onChange: (v) => { if (RKT.siteLabels) RKT.siteLabels.forEach((s) => { s.visible = v; }); } });
  ctl.toggle({ label: '结构清单（点卡片飞到部件）', value: false, onChange: (v) => { togglePartsCard(v); } });
  ctl.toggle({
    label: '剖视整流罩', value: false, onChange: (v) => {
      const fm = RKT.fairMats || [];
      fm.forEach((m) => { m.transparent = v; m.opacity = v ? 0.32 : 1; m.depthWrite = !v; });
      if (RKT.shipIn) RKT.shipIn.visible = v;
      app.setCamera(v ? [10, 52, 22] : [40, 30, 74], v ? [0, 49, 0] : [0, 27, 0]);
    },
  });
  ctl.slider({ label: '自动旋转', min: 0, max: 2, step: 0.1, value: 0, fmt: (v) => v.toFixed(1) + '×', onInput: (v) => { ST.spin = v; } });
  ctl.sep();
  ctl.button({ label: '🏗 组装演示（吊装顺序）', onClick: () => { asmStart(); } });
  ctl.button({ label: '↺ 退出组装演示', onClick: () => { asmReset(); } });
  ctl.toggle({ label: '黄昏点火氛围', value: false, onChange: (v) => { setNight(v); } });
  setHUD([
    ['len', '全箭长度'], ['m0', '起飞质量'], ['tw', '起飞推重比'],
    ['pay', '神舟飞船质量'], ['dia', '芯级直径'], ['stg', '级数（含助推）'],
  ]);
  hset('len', '≈ 58 m');
  hset('m0', '≈ 480 t');
  hset('tw', '≈ 1.26');
  hset('pay', '≈ 8.4 t');
  hset('dia', 'Φ 3.35 m');
  hset('stg', '2 级 + 4 助推');
}
function constructCtl() {
  ctl.clear();
  ctl.slider({ label: '发动机比冲 ve=Isp·g₀', min: 250, max: 350, step: 5, value: 300, fmt: (v) => v + ' s', onInput: (v) => { CON.isp = v; updCon(); } });
  ctl.slider({ label: '质量比 m₀/m_f', min: 2, max: 14, step: 0.2, value: 6, fmt: (v) => v.toFixed(1), onInput: (v) => { CON.ratio = v; updCon(); } });
  ctl.slider({ label: '分级数（等尺寸分级近似）', min: 1, max: 4, step: 1, value: 2, fmt: (v) => v + ' 级', onInput: (v) => { CON.stages = v; updCon(); } });
  ctl.sep();
  ctl.button({ label: '⇈ 逃逸救生演示', onClick: () => { escapeDemoStart(); } });
  ctl.button({ label: '↺ 复位演示', onClick: () => { escapeDemoStop(); } });
  setHUD([['ve', '有效喷气速度'], ['lnm', 'ln(m₀/m_f)'], ['dv', '理想 Δv'], ['need', '入轨所需 Δv（含损耗）'], ['verdict', '能力判定'], ['stg1', '1 级方案'], ['stg2', '2 级方案'], ['stg3', '3 级方案'], ['stg4', '4 级方案']]);
  const CON = { isp: 300, ratio: 6, stages: 2 };
  function updCon() {
    const ve = CON.isp * G0;
    const dv = ve * Math.log(CON.ratio);
    hset('ve', (ve / 1000).toFixed(2) + ' km/s');
    hset('lnm', Math.log(CON.ratio).toFixed(2));
    hset('dv', (dv / 1000).toFixed(2) + ' km/s');
    hset('need', '≈ 9.3 km/s');
    const n = Math.round(clamp(dv / 9300, 0, 1) * 10);
    hset('verdict', (dv >= 9300 ? '✓ 可入轨 ' : '✗ 速度不足 ') + '▰'.repeat(n) + '▱'.repeat(10 - n));
    // 分级对比：同样总质量比下，级数越多每级分到的质量比越小、ln 项相加反而更大
    for (let k = 1; k <= 4; k++) {
      const c = stagingCalc(k, CON.ratio, CON.isp);
      hset('stg' + k, (c.dv / 1000).toFixed(1) + ' km/s ' + (c.ok ? '✓' : '✗') + (k === CON.stages ? '（当前）' : ''));
    }
  }
  updCon();
}
function liftoffCtl() {
  ctl.clear();
  ctl.slider({ label: '起飞推力', min: 80, max: 110, step: 1, value: CFG.thrustPct, fmt: (v) => v + ' %', onInput: (v) => { CFG.thrustPct = v; } });
  ctl.slider({ label: '时间倍率', min: 1, max: 20, step: 1, value: ST.speed, fmt: (v) => '×' + v, onInput: (v) => { ST.speed = v; } });
  ctl.sep();
  ctl.button({ label: '⏺ 倒计时点火', onClick() { launch(); } });
  ctl.button({ label: '↺ 复位', onClick() { resetFlight(); ST.countdown = -1; telemClockSet('待命', 'hold'); } });
  setHUD([['tw', '推重比 T/W'], ['h', '高度'], ['v', '速度'], ['a', '轴向过载'], ['st', '阶段']]);
}
function ascentCtl() {
  ctl.clear();
  ctl.toggle({ label: '受力分析', value: false, onChange: (v) => { ST.showForces = v; } });
  ctl.toggle({
    label: '真实任务对比（标称弹道）', value: true, onChange: (v) => {
      compareOn = v;
      drawTelemPlot(ST.phase !== 'idle' ? ST.t : -1);
    },
  });
  ctl.slider({ label: '时间倍率', min: 1, max: 20, step: 1, value: ST.speed, fmt: (v) => '×' + v, onInput: (v) => { ST.speed = v; } });
  ctl.sep();
  ctl.button({ label: '▶ 自动全程', onClick() { resetFlight(); ST.countdown = 3; ST.speed = 10; plotHist.length = 0; } });
  ctl.button({ label: ST.phase === 'run' ? '⏸ 暂停' : '▶ 继续飞行', onClick(btn) { toggleRun(btn); } });
  setHUD([['t', '飞行时间'], ['h', '高度'], ['v', '速度'], ['q', '动压（最大）'], ['a', '过载'], ['st', '阶段']]);
}
function sepCtl() {
  ctl.clear();
  ctl.slider({ label: '时间倍率', min: 1, max: 20, step: 1, value: ST.speed, fmt: (v) => '×' + v, onInput: (v) => { ST.speed = v; } });
  ctl.sep();
  EVENTS.filter((ev) => ev.key !== 'seco').forEach((ev) => {
    ctl.button({
      label: '⇢ ' + ev.name,
      onClick() {
        resetFlight();
        ST.t = ev.t - 3; ST.phase = 'run'; ST.speed = 2;
        plotHist.length = 0;
      },
    });
  });
  ctl.button({ label: '▶ 自动全程', onClick() { resetFlight(); ST.countdown = 3; ST.speed = 10; plotHist.length = 0; } });
  setHUD([['t', '飞行时间'], ['h', '高度'], ['v', '速度'], ['m', '当前箭上质量'], ['st', '阶段']]);
}
function insertCtl() {
  ctl.clear();
  ctl.slider({ label: '载荷质量', min: 6, max: 12, step: 0.2, value: CFG.payload, fmt: (v) => v.toFixed(1) + ' t', onInput: (v) => { CFG.payload = v; } });
  ctl.slider({ label: '二级比冲', min: 285, max: 315, step: 1, value: CFG.isp2, fmt: (v) => v + ' s', onInput: (v) => { CFG.isp2 = v; } });
  ctl.slider({ label: '起飞推力', min: 96, max: 110, step: 1, value: CFG.thrustPct, fmt: (v) => v + ' %', onInput: (v) => { CFG.thrustPct = v; } });
  ctl.slider({ label: '目标轨道高度', min: 200, max: 500, step: 10, value: CFG.targetAlt, fmt: (v) => v + ' km', onInput: (v) => { CFG.targetAlt = v; } });
  ctl.sep();
  ctl.button({ label: '⏺ 重新点火', onClick() { resetFlight(); ST.countdown = 3; ST.speed = 14; plotHist.length = 0; showToast(''); } });
  setHUD([['h', '高度'], ['v', '速度'], ['vc', '当地圆轨道速度'], ['vd', '目标轨道速度'], ['dv', '速度差'], ['m', '当前质量'], ['st', '判定']]);
}
function orbitCtl() {
  ctl.clear();
  ctl.slider({ label: '轨道高度', min: 200, max: 800, step: 10, value: ORB.alt, fmt: (v) => v + ' km', onInput: (v) => { ORB.alt = v; } });
  ctl.sep();
  ctl.toggle({
    label: '跟随飞船', value: false, onChange: (v) => {
      ORB.follow = v;
      const g = scenes.orbit;
      if (!v && g) { lastFollow.set(0, 0, 0); app.setCamera([1.3, 1.0, 3.3], [0, 0, 0]); }
      if (g) g.userData.vArrow.visible = v;
    },
  });
  ctl.button({ label: '全景视角', onClick: () => { ORB.follow = false; lastFollow.set(0, 0, 0); app.setCamera([3.6, 2.4, 3.6], [0, 0, 0]); } });
  ctl.button({ label: '⇉ 对接演示', onClick: () => { dockStart(); } });
  ctl.button({ label: '↺ 退出对接', onClick: () => { dockReset(); showToast('已退出对接程序，恢复自由飞行。', 'ok'); } });
  ctl.button({ label: '↑ 轨道抬升演示（霍曼转移）', onClick: () => { hohmannStart(); } });
  setHUD([['alt', '轨道高度'], ['v', '轨道速度'], ['vesc', '逃逸速度'], ['per', '周期'], ['wt', '失重状态']]);
}
function reentryCtl() {
  ctl.clear();
  ctl.slider({ label: '再入角', min: 0.5, max: 4.5, step: 0.1, value: RE.gam, fmt: (v) => v.toFixed(1) + '°', onInput: (v) => { RE.gam = v; } });
  ctl.slider({ label: '升力滚转角（落点调节）', min: 0, max: 350, step: 10, value: 0, fmt: (v) => v + '°', onInput: (v) => { ROLL.ang = v; } });
  ctl.toggle({ label: '再入走廊显示', value: true, onChange: (v) => { const g = scenes.reentry; if (g) g.userData.corridor.visible = v; } });
  ctl.sep();
  ctl.button({ label: '▶ 开始再入', onClick() { reentryReset(); RE.running = true; } });
  ctl.button({ label: '↺ 复位', onClick() { reentryReset(); } });
  setHUD([['h', '高度'], ['v', '速度'], ['g', '当前过载'], ['peak', '过载峰值'], ['heat', '防热大底'], ['comm', '通信']]);
}
function landingCtl() {
  ctl.clear();
  ctl.slider({ label: '主伞面积', min: 800, max: 1400, step: 20, value: LD.area, fmt: (v) => v + ' m²', onInput: (v) => { LD.area = v; } });
  ctl.slider({ label: '侧风', min: 0, max: 6, step: 0.5, value: LD.wind, fmt: (v) => v.toFixed(1) + ' m/s', onInput: (v) => { LD.wind = v; } });
  ctl.toggle({ label: '反推发动机', value: true, onChange: (v) => { LD.retro = v; } });
  ctl.sep();
  ctl.button({ label: '▶ 开始开伞', onClick() { landingReset(); LD.running = true; } });
  ctl.button({ label: '↺ 复位', onClick() { landingReset(); } });
  setHUD([['h', '高度'], ['v', '下降速度'], ['wind', '侧风与漂移'], ['phase', '伞况'], ['term', '平衡速度']]);
}
function archiveCtl() {
  ctl.clear();
  ctl.slider({ label: '回放倍速', min: 1, max: 16, step: 1, value: ARCH.speed, fmt: (v) => '×' + v, onInput: (v) => { ARCH.speed = v; } });
  ctl.sep();
  ctl.button({ label: '▶ 播放 / ⏸ 暂停', onClick() { ARCH.playing = !ARCH.playing; } });
  ctl.button({ label: '↺ 从头回放', onClick() { archReset(true); plotHist.length = 0; } });
  setHUD([['mission', '任务'], ['crew', '乘组'], ['clock', '任务钟'], ['h', '高度'], ['v', '速度'], ['a', '过载'], ['q', '动压'], ['note', '事件']]);
}
function sandboxCtl() {
  ctl.clear();
  ctl.toggle({ label: '上一次飞行残影对比', value: true, onChange: (v) => { ST.showGhost = v; drawTelemPlot(-1); } });
  ctl.toggle({ label: '黄昏点火氛围', value: false, onChange: (v) => { setNight(v); } });
  ctl.slider({ label: '载荷质量', min: 6, max: 12, step: 0.2, value: CFG.payload, fmt: (v) => v.toFixed(1) + ' t', onInput: (v) => { CFG.payload = v; } });
  ctl.slider({ label: '二级比冲', min: 285, max: 315, step: 1, value: CFG.isp2, fmt: (v) => v + ' s', onInput: (v) => { CFG.isp2 = v; } });
  ctl.slider({ label: '起飞推力', min: 96, max: 110, step: 1, value: CFG.thrustPct, fmt: (v) => v + ' %', onInput: (v) => { CFG.thrustPct = v; } });
  ctl.slider({ label: '时间倍率', min: 1, max: 20, step: 1, value: ST.speed, fmt: (v) => '×' + v, onInput: (v) => { ST.speed = v; } });
  ctl.sep();
  ctl.button({ label: '⏺ 点火', onClick() { resetFlight(); ST.countdown = 3; plotHist.length = 0; } });
  ctl.button({ label: '⏸/▶ 暂停继续', onClick(btn) { toggleRun(btn); } });
  const views = [['全景', [40, 30, 74], [0, 27, 0]], ['近景', [22, 14, 34], [0, 14, 0]], ['塔架', [24, 40, -34], [2, 40, -9]]];
  views.forEach(([t, pos, tgt]) => ctl.button({ label: t, onClick: () => app.setCamera(pos, tgt) }));
  setHUD([['t', '飞行时间'], ['h', '高度'], ['v', '速度'], ['q', '动压'], ['m', '当前质量'], ['fu', '—'], ['st', '阶段']]);
}
function quizCtl() {
  ctl.clear();
  ctl.button({ label: '↻ 重新测验', onClick() { startQuiz(); } });
}
function toggleRun(btn) {
  if (ST.phase === 'idle') { ST.countdown = Math.max(ST.countdown, 3); if (ST.countdown < 0) ST.countdown = 3; }
  else if (ST.phase === 'run') ST.phase = 'pause';
  else if (ST.phase === 'pause') ST.phase = 'run';
  if (btn) btn.textContent = ST.phase === 'run' ? '⏸ 暂停' : '▶ 继续飞行';
}

/* ---------------- 12 章节定义 ---------------- */


const SECTIONS = [
  {
    group: '飞行任务 · 上升', id: 'intro', title: '认识长征二号F',
    html: `<p>神舟飞船由<b>长征二号F</b>（CZ-2F）发射：全箭约 <b>58 m</b>（相当于 20 层楼）、起飞质量约 <b>480 t</b>，其中约 <b>90%</b> 是推进剂。芯级直径 3.35 m，两级 + 4 台助推器。</p>
<p>从下到上：一级（4 台主机）＋ 助推器 ×4 → 二级（真空发动机）→ 整流罩内的神舟飞船，顶部是<b>逃逸塔</b>——起飞后 120 秒内的「生命保险」，出故障时能在零点几秒内把飞船拉离火箭。</p>
<p>一级与助推器用<b>四氧化二氮 + 偏二甲肼</b>：一经混合即刻自燃，无需点火装置，可常温长期储存，尾焰因此带一点红棕色。烧掉一段就抛掉一段，箭体越飞越轻。</p>
<p>拖动旋转缩放箭体，切换视角按钮细看每个部件；打开「剖视整流罩」能看到里面的神舟飞船。</p>
<div class="rkt-note">右侧酒泉发射场的<b>固定勤务塔</b>提供脐带摆杆（加注管路/电缆）与工作平台；起飞前摆杆摆开，导流槽开始喷水降温。</div>
<p style="margin-top:10px;font-size:12px;color:var(--text-faint)">长征家族速览（LEO 运载量为公开参数量级）：</p>
<table class="rkt-table"><tr><th>型号</th><th>首飞</th><th>LEO</th><th>备注</th></tr>${CZ_FAMILY.map((r) => `<tr><td>${r.no}</td><td>${r.first}</td><td>${r.leo}</td><td>${r.note}</td></tr>`).join('')}</table>`,
    enter() {
      escapeDemoStop(false);
      useScene('site', (g) => { buildSite(g, TEX); });
      if (!RKT.built) buildRocket();
      scene.background = skyCol.clone(); stars.material.opacity = 0;
      RKT.g.visible = true;
      RKT.siteLabels.forEach((s) => { s.visible = false; });
      Object.values(RKT.parts).forEach((p) => { p.visible = true; });
      addLabels();
      if (RKT.labels) RKT.labels.forEach((sl) => { sl.visible = true; });
      resetFlight();
      telemSetup(false);
      compareOn = false;
      introCtl();
      app.setCamera([40, 30, 74], [0, 27, 0]);
      lastFollow.set(0, 24, 0);
    },
  },
  {
    group: '飞行任务 · 上升', id: 'construct', title: '构造与推进',
    html: `<p><b>火箭为什么能飞？</b>向后高速喷出气体，反作用力（推力）推箭体向前——牛顿第三定律。发动机每秒喷出的质量越大、喷气速度越快，推力就越大：<span class="hl">F = q·v<sub>e</sub></span>。</p>
<p><b>变质量运动</b>是火箭问题的核心：飞行中质量不断减小，即使推力不变，加速度 a = F/m 也会越来越大。齐奥尔科夫斯基火箭方程给出速度增量：<span class="hl">Δv = v<sub>e</sub>·ln(m₀/m<sub>f</sub>)</span>——提高比冲（v<sub>e</sub>）或质量比（扔掉空壳）是仅有的两条路，「分级」正是为了提高质量比。</p>
<p><b>试一试</b>：拖动比冲与质量比两个滑杆，看理想 Δv 何时够到入轨所需的约 9.3 km/s（含重力与大气损耗）。再点「逃逸救生演示」，看逃逸塔怎么在 0.2 秒内把飞船拉离故障火箭。</p>
<div class="rkt-note">CZ-2F 一级主机单台海平面推力约 750 kN；二级真空机比冲约 300 s——这就是滑杆的默认量级。右栏「分级数」滑杆用等尺寸分级近似对比 1~4 级方案：级数越多，ln 项相加越大——这就是「不分级就到不了轨道」的定量演示。</div>`,
    enter() {
      useScene('site', (g) => { buildSite(g, TEX); });
      if (!RKT.built) buildRocket();
      scene.background = skyCol.clone(); stars.material.opacity = 0;
      RKT.g.visible = true;
      RKT.siteLabels.forEach((s) => { s.visible = false; });
      if (RKT.labels) RKT.labels.forEach((sl) => { sl.visible = false; });
      resetFlight();
      telemSetup(false);
      constructCtl();
      app.setCamera([16, 30, 30], [0, 32, 0]);
      lastFollow.set(0, 28, 0);
    },
  },
  {
    group: '飞行任务 · 上升', id: 'liftoff', title: '点火与起飞',
    html: `<p><b>点火！</b>发动机推力 T 与重力 W = mg 的较量决定火箭的命运：<span class="hl">T &gt; W 才能离地</span>。CZ-2F 起飞推力约 5923 kN，起飞质量约 480 t，离地瞬间推重比约 1.26；此后推进剂消耗、质量变小，加速度越来越大。</p>
<p>点「倒计时点火」：0 秒发动机点火，<b>导流槽</b>把上千摄氏度的燃气导向两侧，同时<b>喷水降温</b>把声能与温度压下来；塔架上的脐带摆杆在起飞前已撤收。</p>
<p>用「起飞推力」滑杆改变发动机状态：降到 <b>90% 以下火箭离不了地</b>——这就是推重比的意义。</p>`,
    enter() {
      useScene('site', (g) => { buildSite(g, TEX); });
      if (!RKT.built) buildRocket();
      scene.background = skyCol.clone(); stars.material.opacity = 0;
      RKT.g.visible = true;
      RKT.siteLabels.forEach((s) => { s.visible = false; });
      if (RKT.labels) RKT.labels.forEach((sl) => { sl.visible = false; });
      resetFlight();
      telemSetup(true);
      liftoffCtl();
      app.setCamera([26, 15, 40], [0, 16, 0]);
      lastFollow.set(0, 14, 0);
    },
  },
  {
    group: '飞行任务 · 上升', id: 'ascent', title: '冲出大气',
    html: `<p>火箭不是直着飞：<b>程序转弯（重力转弯）</b>让弹道逐渐倾斜，沿着地球曲面「横」过来——最终目的不是飞高，而是<b>达到 7.9 km/s 的第一宇宙速度量级</b>。</p>
<p>大气密度随高度<b>指数下降</b>（标准大气：11 km 以下每升 5.5 km 密度约减半）：阻力 F<sub>D</sub> = ½ρv²C<sub>D</sub>A 与动压 q = ½ρv² 在约 <b>70 s、高度 11 km</b> 处达到峰值（Max-Q），这是全程中箭体载荷最严酷的一刻，此后空气阻力迅速消失。同时 N = m(g+a)：<b>航天员处于超重状态</b>，火箭里的「体重」随加速度增大。</p>
<p>开「受力分析」看推力/重力/阻力箭头；遥测面板实时画出速度、高度、动压、过载四条曲线；打开「真实任务对比」可以把你的飞行与<b>标称弹道</b>（虚线）叠加比较。</p>`,
    enter() {
      useScene('site', (g) => { buildSite(g, TEX); });
      if (!RKT.built) buildRocket();
      scene.background = skyCol.clone(); stars.material.opacity = 0;
      RKT.g.visible = true;
      RKT.siteLabels.forEach((s) => { s.visible = false; });
      if (RKT.labels) RKT.labels.forEach((sl) => { sl.visible = false; });
      plotHist.length = 0;
      telemSetup(true);
      ascentCtl();
      compareOn = true;
      app.setCamera([26, 14, 42], [0, 12, 0]);
      followTarget(RKT.g.position);
    },
  },
  {
    group: '飞行任务 · 上升', id: 'sep', title: '抛掉包袱',
    html: `<p>分级是把「用完的空壳」扔掉——这是<span class="hl">多级火箭</span>的核心思想：轻装加速。烧空了的助推器与一级若继续挂在箭上，就是「死重」，质量比上不去。神舟任务中的分离时序：</p>
<p>① ~120 s <b>逃逸塔分离</b>（最危险的时段已过）；② ~139 s <b>助推器分离</b>；③ ~157 s <b>一二级「热分离」</b>——一级未关机时二级先行点火，燃气经级间段的排焰窗导流排出，随后解锁分离，由上面级马上接力加速；④ ~200 s、高度 110 km 以上<b>整流罩分离</b>（已出大气层，飞船不再需要「外套」，减重约 2 t）；⑤ ~585 s <b>二级关机 · 船箭分离</b>，神舟入轨。</p>
<p>点「跳到分离前」再慢速观看每个分离瞬间。</p>`,
    enter() {
      useScene('site', (g) => { buildSite(g, TEX); });
      if (!RKT.built) buildRocket();
      scene.background = skyCol.clone(); stars.material.opacity = 0;
      RKT.g.visible = true;
      RKT.siteLabels.forEach((s) => { s.visible = false; });
      if (RKT.labels) RKT.labels.forEach((sl) => { sl.visible = false; });
      if (ST.phase === 'idle') resetFlight();
      plotHist.length = 0;
      telemSetup(true);
      sepCtl();
      app.setCamera([20, 13, 32], [0, 11, 0]);
      followTarget(RKT.g.position);
    },
  },
  {
    group: '飞行任务 · 上升', id: 'insert', title: '进入轨道',
    html: `<p>二级把飞船推到 <b>350 km</b> 左右、速度接近该高度的圆轨道速度 <span class="hl">v = √(μ/r)</span>（约 7.7 km/s；贴近地面时是 7.9 km/s，即第一宇宙速度）——关机后不再有推力，飞船靠惯性「落不下来」，这就是入轨。</p>
<p>火箭向东飞：发射纬度越低，能借到的地球自转速度越多（酒泉纬度约 41°，白捡约 0.35 km/s）。</p>
<p>改变四个真实参数试试：<b>载荷质量</b>（神舟飞船约 8 t）、<b>二级比冲</b>（发动机效率）、<b>起飞推力</b>与<b>目标轨道高度</b>。载荷太重或比冲太低 → 差一点速度，<b>入轨失败</b>。</p>
<p>齐奥尔科夫斯基火箭方程 Δv = v<sub>e</sub>·ln(m₀/m<sub>f</sub>) 告诉我们：每一千克载荷都在吃掉速度余量——这也是「不分级就到不了轨道」的数学原因。</p>`,
    enter() {
      useScene('site', (g) => { buildSite(g, TEX); });
      if (!RKT.built) buildRocket();
      scene.background = skyCol.clone(); stars.material.opacity = 0;
      RKT.g.visible = true;
      RKT.siteLabels.forEach((s) => { s.visible = false; });
      if (RKT.labels) RKT.labels.forEach((sl) => { sl.visible = false; });
      plotHist.length = 0;
      telemSetup(true);
      insertCtl();
      compareOn = true;
      app.setCamera([28, 16, 56], [0, 15, 0]);
      followTarget(RKT.g.position);
    },
  },
  {
    group: '在轨与返回', id: 'orbit', title: '在轨飞行',
    html: `<p>入轨后，飞船进入<b>完全失重</b>：不是没有重力，而是<span class="hl">重力全部用来提供向心力</span>（万有引力 = m v²/r = GMm/r²），舱内一切都在「自由下落」，所以自由漂浮。在此轨道上，重力加速度约为 <b>8.7 m/s²</b>（只比地面小 11%）。</p>
<p>轨道越低速度越快、周期越短。神舟在约 390 km 高度与<b>天宫空间站</b>对接，<b>约 92 分钟绕地球一圈</b>，一天能看到 16 次日出日落。第一宇宙速度（7.9 km/s，贴地飞行）是圆轨道速度的最大值；轨道升高，速度下降、周期变长。</p>
<p>拖动「轨道高度」滑杆，看速度、周期与当地重力的变化；视角按钮切换跟随舱/全景；点「对接演示」看神舟如何一步步靠上天宫的前向端口。</p>`,
    enter() {
      useScene('orbit', (g) => orbitBuildWrap(g));
      scene.background = spaceCol.clone();
      stars.material.opacity = 0.9;
      RKT.g.visible = false;
      ORB.follow = false;
      dockReset();
      telemSetup(false);
      compareOn = false;
      orbitCtl();
      setHUD([['alt', '轨道高度'], ['v', '轨道速度'], ['vesc', '逃逸速度'], ['per', '周期'], ['wt', '失重状态']]);
      app.setCamera([1.3, 1.0, 3.3], [0, 0, 0]);
      lastFollow.set(0, 0, 0);
    },
  },
  {
    group: '在轨与返回', id: 'reentry', title: '再入大气',
    html: `<p>回家比去更惊险：返回舱以 <b>7.6 km/s</b> 冲进大气，动能约 <b>10<sup>11</sup> J</b> 全部换成<b>热</b>——船头周围形成上千摄氏度的<b>等离子鞘</b>，电离气体屏蔽电磁波，这就是 <b>黑障</b>（约 80~40 km）。</p>
<p><b>再入角</b>是关键：<span class="hl">太浅会被大气像打水漂一样弹回太空，太陡则减速过猛、过载超限</span>。神舟的再入角约 1.5°~2°，过载控制在 5 g 以内——返回舱以配平攻角飞行时会带出一份小升力，通过滚转调整这份升力的指向，用来修正落点并压低过载。</p>
<p>调「再入角」滑杆后点「开始再入」，看过载峰值、烧蚀热度与黑障区间怎么变；绿色虚线是 <b>1.2°~2.6° 的再入走廊</b>。</p>`,
    enter() {
      useScene('reentry', (g) => reentryBuildWrap(g));
      scene.background = spaceCol.clone();
      stars.material.opacity = 0.85;
      RKT.g.visible = false;
      telemSetup(false);
      compareOn = false;
      reentryReset();
      reentryCtl();
      setHUD([['h', '高度'], ['v', '速度'], ['g', '当前过载'], ['peak', '过载峰值'], ['heat', '防热大底'], ['comm', '通信']]);
    },
  },
  {
    group: '在轨与返回', id: 'landing', title: '开伞着陆',
    html: `<p>降到 10 km，返回舱依次开伞：<b>引导伞 → 减速伞（8 km）→ 主伞（7 km，约 1 200 m²）</b>。巨大的伞衣把速度从 ~180 m/s 拖到终端速度 <span class="hl">v = √(2mg / ρC<sub>d</sub>A) ≈ 7 m/s</span>。</p>
<p>距地面 1 m 时<b>反推发动机</b>点火，约 0.2 s 内把速度再压到 2 m/s 左右——<b>动量定理</b> FΔt = mΔv：反推减小 Δv，座椅缓冲延长 Δt，冲击力就小。关掉反推试试硬着陆的后果。</p>
<p>改「主伞面积」看平衡下降速度怎么变：伞面积就是刹车片；再调「侧风」看返回舱会漂多远——东风着陆场的回收车队已经就位。</p>
<table class="rkt-table"><tr><th>伞系</th><th>面积</th><th>开伞点</th><th>职责</th></tr>${PARACHUTE_SYS.map((r) => `<tr><td>${r.name}</td><td>${r.area}</td><td>${r.open}</td><td>${r.role}</td></tr>`).join('')}</table>`,
    enter() {
      useScene('landing', (g) => landingBuildWrap(g));
      scene.background = new THREE.Color(0x8f95a8).lerp(spaceCol, 0.25);
      stars.material.opacity = 0.35;
      RKT.g.visible = false;
      telemSetup(false);
      compareOn = false;
      landingReset();
      landingCtl();
      setHUD([['h', '高度'], ['v', '下降速度'], ['wind', '侧风与漂移'], ['phase', '伞况'], ['term', '平衡速度']]);
    },
  },
  {
    group: '拓展与检测', id: 'archive', title: '神舟任务档案',
    html: `<p>自 1999 年 SZ-1 首飞以来，神舟系列已完成二十余次任务，从无人试验走到空间站常态化乘组轮换。下面这张<b>任务档案表</b>收录了历次任务的发射日期、乘组与里程碑——点任意一行，舞台会按<b>标称弹道</b>回放一次完整发射（数据为 CZ-2F 公开弹道特征的教学重建，量级与真实任务一致）。</p>
<div class="rkt-missions" id="missionList"></div>
<p style="margin-top:8px">回放要点：逃逸塔 120 s 分离 → 助推器 139 s → 热分离 157 s → 整流罩 200 s → <b>585 s 船箭分离入轨</b>；右侧遥测面板实时画出速度/高度/动压/过载曲线并与标称弹道对比。</p>
<div class="rkt-note">档案数据整理自公开报道，截至 2025 年 11 月（SZ-21）。</div>`,
    enter() {
      useScene('site', (g) => { buildSite(g, TEX); });
      if (!RKT.built) buildRocket();
      scene.background = skyCol.clone(); stars.material.opacity = 0;
      RKT.g.visible = true;
      RKT.siteLabels.forEach((s) => { s.visible = true; });
      if (RKT.labels) RKT.labels.forEach((sl) => { sl.visible = false; });
      archReset(true);
      plotHist.length = 0;
      compareOn = true;
      telemSetup(true);
      buildMissionList();
      archiveCtl();
      app.setCamera([40, 30, 74], [0, 27, 0]);
      lastFollow.set(0, 24, 0);
    },
  },
  {
    group: '拓展与检测', id: 'sandbox', title: '自由发射台',
    html: `<p>这里是<b>自由发射台</b>：载荷、比冲、推力、时间倍率全部归你调——试试能不能把 12 t 的「超重神舟」送入轨道？或者故意把推力降到 90% 看火箭离不了地的样子。</p>
<p>复盘建议（工程思维三步）：① 先按默认参数完整飞一次，记下入轨判定；② 每次只改一个参数再飞，观察遥测面板四条曲线哪里变了；③ 找到「刚好入轨」的参数边界——这就是<b>运载能力余量</b>的直观含义。</p>
<div class="rkt-note">快捷键：空格 播放/暂停 · R 复位视角 · ] 收合遥测面板 · ←/→ 切章。</div>`,
    enter() {
      useScene('site', (g) => { buildSite(g, TEX); });
      if (!RKT.built) buildRocket();
      scene.background = skyCol.clone(); stars.material.opacity = 0;
      RKT.g.visible = true;
      RKT.siteLabels.forEach((s) => { s.visible = false; });
      if (RKT.labels) RKT.labels.forEach((sl) => { sl.visible = false; });
      resetFlight();
      plotHist.length = 0;
      telemSetup(true);
      compareOn = true;
      sandboxCtl();
      app.setCamera([40, 30, 74], [0, 27, 0]);
      lastFollow.set(0, 24, 0);
    },
  },
  {
    group: '拓展与检测', id: 'quiz', title: '随堂检测',
    html: `<p>八十道题覆盖全部章节：火箭构造、推重比、重力转弯、分离时序、宇宙速度、失重、黑障、再入走廊与开伞着陆。答错不扣分——解析会带你回到对应章节的知识点。</p>
<p>点击下方「开始测验」，题目会浮现在舞台中央。</p>`,
    enter() {
      useScene('site', (g) => { buildSite(g, TEX); });
      if (!RKT.built) buildRocket();
      scene.background = skyCol.clone(); stars.material.opacity = 0;
      RKT.g.visible = true;
      RKT.siteLabels.forEach((s) => { s.visible = false; });
      if (RKT.labels) RKT.labels.forEach((sl) => { sl.visible = false; });
      resetFlight();
      telemSetup(false);
      compareOn = false;
      quizCtl();
      setHUD([['score', '得分'], ['prog', '进度']]);
      hset('score', '0');
      hset('prog', '–');
      app.setCamera([40, 30, 74], [0, 27, 0]);
      lastFollow.set(0, 24, 0);
      startQuiz();
    },
  },
];
/* =====================================================================
 * 内容扩展包 A（体量与教学密度：深读扩容 / 常见误区 / 大事记 / 发射场巡礼章）
 * 拼接顺序：位于 p6（SECTIONS 定义）之后、p7（左栏章节列表构建）之前。
 * ===================================================================== */

/* ---------------- 章节深读扩容（每章再补 2 段） ---------------- */

LESSON_DEEP[0].push(
  ['塔架为什么漆成灰色', '格构塔不做彩色涂装：灰色钢结构在昼夜与季节光线下对光学跟踪的干扰最小，胶片与光电经纬仪的对比度算法「讨厌」鲜艳背景。发射场里连车辆涂装都有讲究——技术系统的审美永远跟着测量走。'],
  ['「三垂」模式的由来', '垂直总装、垂直测试、垂直转运：火箭在厂房里始终立着完成一切，水平运输会把细长箭体的结构应力暴露在自重弯矩下。转运那个几层楼高的活动发射平台以「步行的速度」走完 1 500 m，是发射场最庄重的仪式感。'],
);
LESSON_DEEP[1].push(
  ['涡轮泵：发动机的心脏', '燃烧室里的压强远比贮箱高，靠贮箱自流压头「喂」不进去——涡轮泵每秒把数百公斤推进剂增压灌入，转速每分钟数万转。发动机研制的难，一大半难在这台泵：它要在极端温度梯度里长时间高速旋转不出一丝故障。'],
  ['游机不是「备用机」', '游机（姿控发动机）全程都在工作：主机关机后的滑行段、级间分离的姿态保持、末速修正的最后一口气——都是游机的活。它们的推力只有主机的百分之几，却决定了入轨精度的最后几位数。'],
);
LESSON_DEEP[2].push(
  ['点火时序的「一锤定音」', '一级点火不是「按一个按钮」：先涡轮泵起旋、再燃烧室头部注剂、火焰稳定器建立稳定燃烧、推力爬升到 90% 才允许释放发射平台夹块——每一步都有「不满足即中止」的判据。你看到的 6 秒倒计时，压缩的是真实流程里最后十分钟的确认链。'],
  ['为什么火箭看起来「抖」', '起飞后头几秒箭体轻微摆动是正常的「 po go 」抑制与风修正：制导系统每 20 ms 修正一次姿态。载人火箭的抖动幅度被严格限制——航天员的体感舒适度也是设计指标之一。'],
);
LESSON_DEEP[3].push(
  ['风对弹道的塑形', '高空风（尤其 8~12 km 急流层）能把弹道「吹歪」几百米。发射前要放探空气球测量风廓线，装订进制导计算机——「风修正装订」这个词在发射日新闻里出现，指的就是这件事。'],
  ['噪声也是载荷', '起飞瞬间的声压级在箭体附近可达 160 dB 以上：整流罩里的飞船要过声学试验这一关（高声强混响室里「听」够分钟级噪声）。导流槽喷水最大的功绩之一就是把这段噪声压下来几个分贝——对结构疲劳意义重大。'],
);
LESSON_DEEP[4].push(
  ['分离面上的「零冲击」追求', '热分离时两级之间不是硬碰硬：二级喷流在级间段里形成气垫，解锁瞬间两体几乎是「漂开」的。冲击谱（shock response spectrum）是分离机构设计的核心指标——船上精密仪器最怕的不是大推力，而是高频冲击。'],
  ['为什么逃逸塔 120 秒就扔', '逃逸塔自带固体推进剂，又重又贵；120 秒后火箭已飞出最大动压区、高度足够应急开伞——塔的历史使命完成。扔掉它既是减重（约 4 t）也是「风险退役」：带着它飞到轨道反而是负担与隐患。'],
);
LESSON_DEEP[5].push(
  ['混合比：发动机的「配比哲学」', '氧化剂与燃烧剂的质量流比叫混合比，它决定燃烧温度与效率。二级混合比偏差 2%，末速就能差出几十 m/s——发射直播里听到的「混合比精确控制」，就是在说这台发动机的「呼吸节奏」被调得多稳。'],
  ['滑行段的「安静艺术」', '主发动机关机到再入之间的滑行段，飞船靠陀螺与星敏感器保持姿态。这段「安静」其实很忙：太阳翼对日、热控定向、测控天线对地——姿态调度是一门排课程的艺术。'],
);
LESSON_DEEP[6].push(
  ['交会对接的相位数学', '追上前方 3 000 km 的空间站不是直线加速：飞船先进一条比目标略低的轨道「抄近道」（低轨道跑得快），再在合适的相位点抬轨接近——霍曼转移与相位角计算共同编排了这场「太空恰恰」。点「轨道抬升演示」能直观看到第一段。'],
  ['对接机构的「弱接触强连接」', '对接初始接触力被设计得极小（捕获环先柔性导向），之后捕获锁、缓冲阻尼、拉紧机构分层工作——「弱接触、强连接」六字是全部哲学。任何一环超差，对接自动退出重来，绝不硬怼。'],
);
LESSON_DEEP[7].push(
  ['热流与过载的跷跷板', '再入角越大，热流峰值越高（热的三次方速度关系）而过载越大；再入角越小，热负荷低但减速时间拉长、落点误差放大。走廊 1.2°~2.6° 就是这条跷跷板两端都能接受的窄带——航天器再入的所有秘密都在这条带里。'],
  ['通信「复活」的一瞬', '出黑障的那一秒，地面站先听到载波锁定、再解出遥测、最后才听到话音——三层信号像日出一样逐层亮起。乘组的第一句「我状态正常」，背后是整条测控链的接力确认。'],
);
LESSON_DEEP[8].push(
  ['伞的「呼吸」', '主伞张满后并非静止：伞衣以每秒数次的幅度「呼吸」脉动，伞绳张力随之起伏。回收系统的结构设计要覆盖这个动态载荷谱，而不是只看平均值——很多撕裂事故都发生在「以为算准了」的脉动峰上。'],
  ['落点预报的最后一公里', '开伞后地面根据雷达高度表与风向数据滚动更新落点，直升机据此修改航线。从 10 km 到 0 的十几分钟里，预报圈从几十公里收缩到几百米——这是搜救体系与再入力学的联合演出。'],
);
LESSON_DEEP[9].push(
  ['标称弹道是怎么「标」出来的', '标称弹道不是飞过一次录下来的：它是制导律在大气模型、发动机偏差、风场包络里「优化」出来的设计基准。你在第 4 章看到的对比虚线，代表的是「理论上的完美飞行」——实飞与它的差，叫偏差；偏差的趋势，叫健康。'],
  ['乘组选拔的隐藏课程表', '航天员训练里有大量「本页同款」内容：离心机 4 g、转椅、降落伞着陆冲击塔、黑障模拟舱——你在这个实验里调过的每个参数，他们都用身体背过一遍。'],
);
LESSON_DEEP[10].push(
  ['裕度的经济学', '运载火箭的运载能力标称值永远大于实际装填的载荷：差的这部分叫「余量」。它用来吸收风、温度、发动机偏差、轨道误差——你在自由发射台找到的边界与真实任务的差距，就是这个余量的直观尺寸。'],
  ['失败重组的节奏感', '仿真里的失败是即时的；工程里的失败伴随归零流程：定位 → 复现 → 措施 → 验证 → 举一反三。你的「重做实验」按钮，对应的是这套流程里最珍贵的自由——工程里没有真正的重开一局，但仿真里可以。'],
);
LESSON_DEEP[11].push(
  ['为什么答案要「可反驳」', '好的检测题不是背原文：它的选项都在「看起来很像」的临界点上——比如「热分离 vs 冷分离」「失重 vs 没有重力」。答错说明脑里的模型有毛边，答对说明概念已经立起来了。'],
  ['把实验讲给别人听', '检验是否真懂的标准：能否把这个实验讲给一个初中生听懂。试试用三句话讲清「为什么分级」——讲不出来就回第 2 章的滑杆再玩两分钟。'],
);

/** 常见误区（每章 3 条，lessonExtras 二次注入） */
const MISCONCEPTIONS = {
  0: [
    '「火箭靠推空气才能前进」——错。火箭在真空中反而效率更高：它推的是自己喷出的气体，不需要任何外部介质。',
    '「白色箭体是装饰」——白漆是热控与跟踪的双重工程选择。',
    '「逃逸塔全程跟随」——120 秒即抛；它只负责最危险的起飞初段。',
  ],
  1: [
    '「比冲越高推力越大」——两回事：比冲是效率（每公斤推进剂换多少冲量），推力是力气（瞬时力的大小）。',
    '「燃料越多飞得越远」——受 ln 曲线惩罚，燃料带的越多、边际收益越低。',
    '「分级越多越好」——级数增加带来机构复杂度与分离失败风险，CZ-2F 用「二级半」（助推算半级）是平衡解。',
  ],
  2: [
    '「点火即起飞」——推力爬升与夹块释放之间有一整套判据链。',
    '「喷水是为了灭火」——喷水是降声降噪 + 冷却导流槽，不是消防。',
    '「摆杆起飞时甩开」——摆杆在点火前已撤收；你看到的摆开是导流槽盖板与塔臂的让位动画。',
  ],
  3: [
    '「飞得越高阻力越小，所以一直加速就好」——低空高速反而动压爆炸，结构吃不消。',
    '「程序转弯是躲避什么」——转弯是为了把速度方向掰向水平，目标在「横」不在「高」。',
    '「超重 4 g 很危险」——胸背向 4 g 是航天员训练的常规科目，危险的是持续 9 g 或头部-足向过载。',
  ],
  4: [
    '「分离需要停下来再点下一级」——热分离恰恰是「不停顿」：二级先点火再解锁。',
    '「整流罩保护飞船到入轨」——110 km 以上空气已可忽略，再带着它纯属浪费。',
    '「残骸会砸中发射场」——落区是预先计算的无人区，安全距离从设计第一天就有。',
  ],
  5: [
    '「入轨就是飞得够高」——高度只是入场券，速度才是门票：7.7 km/s 落不下来才算入轨。',
    '「第一宇宙速度是固定数字」——7.9 km/s 只在贴地面成立；轨道越高圆轨道速度越低。',
    '「发射窗口只有天气一个变量」——轨道面、光照、测控弧段共同决定窗口。',
  ],
  6: [
    '「失重是因为太空没有引力」——350 km 处引力仍有地面 89%；失重源于自由下落。',
    '「对接是自动的、不需要人」——手动对接是必备备份能力（SZ-9 刘旺 18 mm 精度）。',
    '「空间站静止不动等着被追」——空间站以 7.7 km/s 飞行，交会是两条轨道的舞蹈。',
  ],
  7: [
    '「再入角可以随意选」——走廊 1.2°~2.6°，浅了弹跳、深了超载。',
    '「黑障是事故」——黑障是物理必然且完全预期，通信恢复即正常。',
    '「防热大底可以重复用」——烧蚀材料一次性牺牲；可重复使用热防护是另一套技术（航天飞机瓦 / 新一代金属热盾）。',
  ],
  8: [
    '「降落伞一开就安全」——开伞瞬间冲击比开伞前更危险，三级收口就是为这个。',
    '「反推是软着陆的全部」——伞负责从 180 m/s 到 7 m/s，反推只管最后 1 米的 5 m/s。',
    '「侧风无所谓」——6 m/s 侧风就漂 40 m，落点预报必须吃掉它。',
  ],
  9: [
    '「回放就是看动画」——回放的每个事件点都对应真实任务的分离/点火时序，值得逐个暂停看。',
    '「无人任务不重要」——SZ-1~4 四次无人试验把可靠性爬到载人门槛，没有它们就没有 SZ-5。',
    '「在轨天数越长越厉害」——任务价值看目标完成度，183 天与 21 小时都是里程碑。',
  ],
  10: [
    '「参数能过就是好参数」——贴边通过不是通过，裕度才是工程语言的「通过」。',
    '「失败要同时改多个地方」——多变量同改无法归因，单变量法是铁律。',
    '「仿真通过就不用实测」——仿真只是证据链的一环，最终要靠真件与飞行验证。',
  ],
  11: [
    '「检测分数高就是学会了」——能复述因果才算；分数只是提醒。',
    '「解析太长不用读」——解析里藏着本题对应的章节锚点，是错题的「回家地图」。',
  ],
};

/** 中国载人航天大事记（1992 立项 → 2025，第 10 章附表） */
const HISTORY_TIMELINE = [
  ['1992', '载人航天工程立项（921 工程）', '三步走战略确定：载人飞船 → 空间实验室 → 空间站'],
  ['1999', 'SZ-1 无人首飞成功', '神舟号飞船与 CZ-2F 组合体首次亮相'],
  ['2003', 'SZ-5 首次载人飞行', '杨利伟 21 小时 23 分钟，中国成为第三个独立载人航天国家'],
  ['2008', 'SZ-7 首次出舱', '翟志刚「我已出舱，感觉良好」'],
  ['2011', '天宫一号 + SZ-8 首次交会对接', '空间技术三步走第二步开启'],
  ['2017', '天舟一号货运验证', '推进剂在轨补加试验成功'],
  ['2021', '天和核心舱发射 + SZ-12 驻留', '空间站建造阶段开启'],
  ['2022', '问天/梦天对接，空间站 T 构型建成', '三舱构型完成，进入运营阶段'],
  ['2023', 'SZ-16 载荷专家上天', '航天员类型从驾驶员扩展到科学家'],
  ['2025', 'SZ-21 乘组轮换常态化', '每年两次载人发射的「班车化」运营'],
];

/** 注入器：在 lessonExtras 链上再包一层（深读 → 附表 → 误区 → 大事记） */
(function injectMisconceptions() {
  const orig = lessonExtras;
  lessonExtras = function (idx) {
    orig(idx);
    const mis = MISCONCEPTIONS[idx];
    if (mis) {
      const box = document.createElement('div');
      box.className = 'rkt-mis';
      box.innerHTML = `<div class="rkt-deep-head">常见误区</div>` + mis.map((m) => `<p class="rkt-deep-p">· ${m}</p>`).join('');
      lessonEl.appendChild(box);
    }
    if (idx === 9) {
      const tbl = HISTORY_TIMELINE.map((r) => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('');
      const box = document.createElement('div');
      box.innerHTML = `<p style="margin-top:10px;font-size:12px;color:var(--text-faint)">中国载人航天大事记：</p>
<table class="rkt-table"><tr><th>年份</th><th>事件</th><th>意义</th></tr>${tbl}</table>`;
      lessonEl.appendChild(box);
    }
  };
  const s = document.createElement('style');
  s.textContent = `.rkt-mis { margin-top: 8px; border-top: 1px dashed var(--card-border); padding-top: 8px; }`;
  document.head.appendChild(s);
})();

/* ---------------- 第 13 章：发射场巡礼（SECTIONS.push，位于 p7 构建列表之前） ---------------- */

const TOUR_STOPS = [
  ['垂直总装厂房', [-30, 62, 4], [-96, 12, -78], '「三垂」模式的心脏：火箭在 40 m 高的厂房内垂直总装与测试，整体转运至发射工位。大门净宽能容下带助推的整箭通过。'],
  ['测控雷达站', [120, 18, -30], [96, 8, -64], '双抛物面天线 + 雷达罩：跟踪弹道、接收遥测。黑障期间它是最后一双眼睛，落点预报全靠它撑过静默段。'],
  ['导流槽', [16, 10, -34], [0, 3, -16], 'V 形导流面把 2000 ℃ 燃气折向两侧，喷水环管同步降温降噪——发射台能活下来全靠它。'],
  ['避雷塔', [30, 90, -40], [-42, 80, -34], '戈壁雷暴区的 100 m 尖塔：绝缘子串 + 引下线把雷电导入大地，发射窗口还要避开雷暴活动期。'],
  ['消防水池', [-24, 8, 44], [-30, 2, 40], '喷水降温的水源：发射前注满，点火时泵+重力联合供水，几秒钟内就是几十吨的流量。'],
  ['测控楼', [80, 14, -20], [62, 7, -42], '任务指挥显示中枢：大屏墙上滚动遥测参数，「航天员状态正常」的第一声就从这里确认。'],
];
SECTIONS.push({
  group: '拓展与检测', id: 'tour', title: '发射场巡礼',
  html: `<p>除火箭本身，一次任务还依赖一整座<b>发射场城</b>：垂直总装厂房、测控雷达站、导流槽、避雷塔、消防水池、测控楼……点击下方按钮逐站飞行，每一站都有一段「为什么它在场」的解说。</p>
<p>巡礼路线建议按发射日时序走一遍：厂房（总装）→ 导流槽（就位）→ 测控楼（开机）→ 雷达站（跟踪）→ 避雷塔（守望）→ 水池（保障）。</p>
<div class="rkt-note">发射场是一座「为 10 分钟服务的城市」——数百人常驻、上千人进场，只为把一支 58 m 的白色箭体安全送上天。</div>`,
  enter() {
    escapeDemoStop(false);
    useScene('site', (g) => { buildSite(g, TEX); });
    if (!RKT.built) buildRocket();
    scene.background = skyCol.clone(); stars.material.opacity = 0;
    RKT.g.visible = true;
    RKT.siteLabels.forEach((s) => { s.visible = true; });
    if (RKT.labels) RKT.labels.forEach((sl) => { sl.visible = false; });
    resetFlight();
    telemSetup(false);
    compareOn = false;
    ctl.clear();
    TOUR_STOPS.forEach(([name, pos, tgt, note], si) => {
      ctl.button({
        label: '⇢ ' + name,
        onClick: () => {
          app.setCamera(pos, tgt);
          hset('stop', `${si + 1}. ${name}`);
          showToast(`${name}：${note}`, 'ok');
        },
      });
    });
    ctl.sep();
    ctl.toggle({ label: '黄昏点火氛围', value: false, onChange: (v) => { setNight(v); } });
    ctl.toggle({ label: '结构清单', value: false, onChange: (v) => { togglePartsCard(v); } });
    setHUD([['stop', '巡礼站点'], ['total', '站点总数'], ['hint', '提示']]);
    hset('stop', '—');
    hset('total', TOUR_STOPS.length + ' 站');
    hset('hint', '右栏按钮逐站飞行');
    app.setCamera([-30, 62, 4], [-96, 12, -78]);
    showToast('发射场巡礼：按右栏按钮逐站飞行。', 'ok');
  },
});
/* ---------------- 随堂检测（题库 + 面板） ---------------- */

const RKT_QUIZ = [
  { q: 'CZ-2F 的逃逸塔作用是什么？', opts: ['为火箭提供额外推力', '起飞初期出现故障时，把飞船快速拉离火箭', '在轨道上调整飞船姿态', '分离后为二级提供电源'], a: 1, ex: '逃逸塔是起飞后约 120 秒内的「生命保险」：固体发动机点火，零点几秒内把整流罩连同飞船拉离故障火箭，随后开伞着陆（第 2 章可演示）。' },
  { q: '火箭离地的最低条件是？', opts: ['推力大于重力（T/W > 1）', '速度大于音速', '高度超过 10 km', '质量小于 100 t'], a: 0, ex: '推重比 T/W > 1 才能离地。CZ-2F 起飞推重比约 1.26；把「起飞推力」滑到 90% 以下，T/W < 1，火箭就钉在发射台上（第 3 章）。' },
  { q: 'Max-Q（最大动压）出现在什么高度量级？', opts: ['地面附近', '约 11 km（70 秒前后）', '约 60 km', '入轨前'], a: 1, ex: '动压 q=½ρv²：低空密度大速度小、高空速度大密度小，两者乘积在约 11 km、70 s 达峰（约 31 kPa）。即第 4 章所讲的载荷峰值时刻。' },
  { q: '「重力转弯」的目的是？', opts: ['保持竖直向上最快离地', '逐渐把速度方向从竖直转向水平，达到轨道速度', '减小噪声', '节省降落伞'], a: 1, ex: '入轨需要的是约 7.9 km/s 的水平速度而非高度。程序转弯让弹道逐渐倾斜，沿地球曲面「横」过来（第 4 章）。' },
  { q: '神舟任务中一二级「热分离」的特点是？', opts: ['一级关机熄火后再分离', '二级先点火再解锁分离，燃气从排焰窗排出', '整流罩先抛掉', '在真空中不能分离'], a: 1, ex: '热分离：一级尚未关机、二级先点火，级间段的排焰窗把二次燃气排走，随后解锁分离——衔接无缝、损失小（第 5 章）。' },
  { q: '第一宇宙速度的数值与含义是？', opts: ['7.9 km/s，贴近地面圆轨道速度', '11.2 km/s，逃逸地球速度', '16.7 km/s，逃逸太阳速度', '3.8 km/s，月球轨道速度'], a: 0, ex: '7.9 km/s 是贴地圆轨道速度（v=√(μ/r)），也是圆轨道速度的最大值；轨道越高速度越低。11.2 km/s 是第二宇宙速度（逃逸）（第 6、7 章）。' },
  { q: '在轨「完全失重」的正确理解是？', opts: ['太空没有引力', '引力全部用来提供向心力，舱内物体随船一起自由下落', '航天员关闭了发动机', '引力被大气抵消'], a: 1, ex: '350 km 高度引力仍有地面的 ~89%。「失重」= 引力恰好充当向心力，万物一起自由下落，所以互相之间没有支持力（第 7 章）。' },
  { q: '为什么再入角太浅会失败？', opts: ['速度太慢', '升力不足以被大气捕获，像打水漂一样被弹回太空', '通信中断', '降落伞打不开'], a: 1, ex: '再入角 < 约1° 时，稀薄大气提供的减速不够，船又滑出大气层。神舟再入走廊约 1.2°~2.6°（第 8 章）。' },
  { q: '「黑障」期间发生了什么？', opts: ['航天员失明', '等离子鞘屏蔽电磁波，通信中断', '太阳能帆板失效', '发动机无法点火'], a: 1, ex: '约 80~40 km 高度，船头高温电离气体形成等离子鞘，吸收/反射无线电波，通信中断数分钟——这是正常现象（第 8 章）。' },
  { q: '神舟主伞的面积约为？', opts: ['120 m²', '500 m²', '1200 m²', '5000 m²'], a: 2, ex: '主伞约 1200 m²，把返回舱从 ~180 m/s 减到平衡速度约 7 m/s（v=√(2mg/ρC_dA)）。伞面积就是刹车片（第 9 章）。' },
  { q: '着陆前 1 m 点燃反推发动机的原理是？', opts: ['把伞吹开', '动量定理：减小接地速度 Δv，配合座椅缓冲延长 Δt，减小冲击力', '点燃信号弹', '融化冻土'], a: 1, ex: 'FΔt = mΔv：反推把 ~7 m/s 再压到 ~2 m/s，冲击大幅减小。关掉反推试试「硬着陆」判定（第 9 章）。' },
  { q: '齐奥尔科夫斯基火箭方程 Δv = ve·ln(m₀/mf) 告诉我们？', opts: ['火箭越重飞得越快', '提高比冲或扔掉空壳（分级）才能提高速度增量', '燃料越多越好', '真空里火箭无法加速'], a: 1, ex: '两条路：提高喷气速度 ve（更好的发动机）或提高质量比 m₀/mf（分级扔掉死重）。「抛掉包袱」正是分级的意义（第 2、5 章）。' },
  { q: '神舟飞船由哪三舱组成？', opts: ['指令舱-服务舱-登陆舱', '轨道舱-返回舱-推进舱', '前舱-中舱-后舱', '生活舱-实验舱-气闸舱'], a: 1, ex: '轨道舱（前，带对接机构）、返回舱（中，钟形防热大底，航天员乘员舱）、推进舱（后，主发动机与太阳翼）。剖视整流罩可以看它（第 1、7 章）。' },
  { q: '东风着陆场承担的神舟任务是？', opts: ['全部早期无人试验', 'SZ-12 起的主着陆场（此前为四子王旗）', '仅应急着陆', '海上溅落'], a: 1, ex: '自空间站阶段（SZ-12，2021）起，东风着陆场成为主着陆场；早期任务主用四子王旗着陆场（第 9 章场景即东风着陆场）。' },
];

function startQuiz() {
  stage.querySelectorAll('.quiz-panel').forEach((p) => p.remove());
  let idx = 0;
  let score = 0;
  const panel = document.createElement('div');
  panel.className = 'quiz-panel';
  stage.appendChild(panel);
  activeCleanupExtra = () => panel.remove();

  function renderQ() {
    const item = RKT_QUIZ[idx];
    panel.innerHTML = '';
    const card = document.createElement('div');
    card.className = 'quiz-card';
    card.innerHTML = `
      <div class="q-progress">第 ${idx + 1} / ${RKT_QUIZ.length} 题</div>
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
        hset('score', String(score));
        hset('prog', `${idx + 1} / ${RKT_QUIZ.length}`);
        const foot = card.querySelector('.q-foot');
        const next = document.createElement('button');
        next.type = 'button';
        next.className = 'ctl-btn active';
        next.textContent = idx < RKT_QUIZ.length - 1 ? '下一题 →' : '查看成绩 →';
        next.addEventListener('click', () => {
          idx++;
          if (idx < RKT_QUIZ.length) renderQ();
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
    const pct = Math.round((score / RKT_QUIZ.length) * 100);
    card.innerHTML = `
      <div class="q-progress">检测完成</div>
      <div class="big">${score} / ${RKT_QUIZ.length}</div>
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
    back.addEventListener('click', () => { panel.remove(); selectChapter(0); });
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:10px;justify-content:center';
    row.appendChild(back); row.appendChild(again);
    card.appendChild(row);
    panel.appendChild(card);
    hset('score', String(score));
    hset('prog', '完成');
  }

  renderQ();
}

/* ---------------- 任务档案列表（第 10 章右栏可点行） ---------------- */

function buildMissionList() {
  const box = document.getElementById('missionList');
  if (!box) return;
  box.innerHTML = '';
  MISSIONS.forEach((mi, i) => {
    // era 编组行（编年分组：无人试验 → 载人起步 → 交会对接 → 空间站运营）
    if (i === 0 || MISSIONS[i - 1].era !== mi.era) {
      const gh = document.createElement('div');
      gh.className = 'chap-group';
      gh.textContent = mi.era;
      box.appendChild(gh);
    }
    const row = document.createElement('button');
    row.type = 'button';
    row.className = 'mi-row' + (i === ARCH.missionIdx ? ' on' : '');
    row.innerHTML = `<b></b><span></span><span class="mi-meta"></span>`;
    row.querySelector('b').textContent = mi.no;
    row.children[1].textContent = mi.date + ' · ' + (mi.crew.length ? mi.crew[0] + (mi.crew.length > 1 ? ` 等${mi.crew.length}人` : '') : '无人');
    row.querySelector('.mi-meta').textContent = mi.dock ? '· ' + mi.dock : '';
    const trivia = MISSION_TRIVIA[mi.no];
    if (trivia) row.title = trivia;
    row.addEventListener('click', () => {
      ARCH.missionIdx = i;
      archReset(true);
      plotHist.length = 0;
      box.querySelectorAll('.mi-row').forEach((r) => r.classList.remove('on'));
      row.classList.add('on');
      showToast(`${mi.no}（${mi.date}）：${mi.note}`, 'ok');
      // 展开 3 条任务细节（MISSION_FACTS）
      box.querySelector('.rkt-facts')?.remove();
      const facts = MISSION_FACTS[mi.no] || [];
      if (facts.length) {
        const f = document.createElement('ul');
        f.className = 'rkt-facts';
        f.innerHTML = `<b style="font-size:12px">${mi.no} 三条细节</b>` + facts.map((x) => `<li>${x}</li>`).join('');
        box.insertBefore(f, row.nextSibling);
      }
    });
    box.appendChild(row);
  });
}

/* ---------------- 场景构建包装（纹理就绪后建） ---------------- */

let TEX = null;
function orbitBuildWrap(g) { buildOrbit(g, TEX); }
function reentryBuildWrap(g) { reentryBuildWrapImpl(g); }
function reentryBuildWrapImpl(g) { buildReentry(g, TEX); }
function landingBuildWrap(g) { landingBuildWrapImpl(g); }
function landingBuildWrapImpl(g) { buildLanding(g, TEX); }

/* =====================================================================
 * 布局驱动（三栏 / 折叠 / 专注 / 手风琴 / 工具 / 快捷键 / 帧循环 / 启动）
 * ===================================================================== */

const rktShell = document.getElementById('rktShell');
const chapNav = document.getElementById('chapNav');
const chapCount = document.getElementById('chapCount');
const detailNo = document.getElementById('detailNo');
const detailTitle = document.getElementById('detailTitle');
const lessonEl = document.getElementById('lesson');
const controlsEl = document.getElementById('controls');
const detailBody = document.getElementById('detailBody');

let chapterIdx = 0;
let activeCleanupExtra = null;
let labReady = false;

/* 左栏章节列表（编组行 + 章节按钮） */
const chapBtns = [];
{
  let gi = 0;
  while (gi < SECTIONS.length) {
    const gh = document.createElement('div');
    gh.className = 'chap-group';
    const gr = SECTIONS[gi].group;
    gh.textContent = gr;
    chapNav.appendChild(gh);
    while (gi < SECTIONS.length && SECTIONS[gi].group === gr) {
      const i = gi;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'chap-btn';
      b.innerHTML = '<span class="chap-n"></span><span class="chap-t"></span>';
      b.querySelector('.chap-n').textContent = String(i + 1).padStart(2, '0');
      b.querySelector('.chap-t').textContent = SECTIONS[i].title;
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
  document.getElementById('railNoL').textContent = String(chapterIdx + 1).padStart(2, '0');
  document.getElementById('railTitleR').textContent = sec.title;
  lessonEl.innerHTML = sec.html || '';
  lessonExtras(chapterIdx);
  if (chapterIdx === 9) buildMissionList();
  history.replaceState(null, '', '#' + (chapterIdx + 1));
  if (activeCleanupExtra) { activeCleanupExtra(); activeCleanupExtra = null; }
  // 全局复位：退出跨章状态
  escapeDemoStop(false);
  dockReset();
  ST.showForces = false;
  ST.spin = 0;
  ST.countdown = -1;
  compareOn = false;
  plotHist = [];
  hidePartsCard();
  MAN.on = false;
  asmReset();
  debrisG.visible = false;
  if (RKT.labels) RKT.labels.forEach((sl) => { sl.visible = false; });
  if (RKT.shipIn) RKT.shipIn.visible = false;
  if (RKT.fairMats) RKT.fairMats.forEach((m) => { m.transparent = false; m.opacity = 1; m.depthWrite = true; });
  telemClockSet('待命', 'hold');
  sec.enter();
  document.getElementById('accControls').classList.toggle('acc-empty', !controlsEl.children.length);
  document.getElementById('accData').classList.toggle('acc-empty', !document.querySelector('#lcData .hud-card'));
  detailBody.scrollTop = 0;
}

/* 栏折叠 × 专注模式 */
const foldLBtn = document.getElementById('foldLBtn');
const unfoldLBtn = document.getElementById('unfoldLBtn');
const foldRBtn = document.getElementById('foldRBtn');
const unfoldRBtn = document.getElementById('unfoldRBtn');
const focusBtn = document.getElementById('focusBtn');
const FOLD_KEY = { l: 'rocket.foldL', r: 'rocket.foldR' };
let foldL = false;
let foldR = false;
let focusSaved = null;
try {
  foldL = localStorage.getItem(FOLD_KEY.l) === '1';
  foldR = localStorage.getItem(FOLD_KEY.r) === '1';
} catch (e) { /* localStorage 不可用时仅会话内生效 */ }
function applyShellFold() {
  rktShell.classList.toggle('fold-l', foldL);
  rktShell.classList.toggle('fold-r', foldR);
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
  rktShell.classList.toggle('focus-mode', on);
  focusBtn.textContent = on ? '退出专注' : '专注模式';
  focusBtn.setAttribute('aria-pressed', String(on));
  applyShellFold();
}
function toggleFold(side) {
  if (focusSaved !== null) setFocus(false);
  if (classroom) setClassroom(false);
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
const ACC_KEYS = { lesson: 'rocket.accLesson', controls: 'rocket.accControls', data: 'rocket.accData' };
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

/* 遥测面板折叠（] 键 / 头部小钮 / 圆形徽标） */
const telemFoldBtn = document.getElementById('telemFoldBtn');
const telemBadge = document.getElementById('telemBadge');
const TELEM_KEY = 'rocket.foldTelem';
let telemFolded = false;
try {
  const saved = localStorage.getItem(TELEM_KEY);
  // 无记忆时按视口给默认：≤1100px 首访清爽态默认折叠；用户操作后落盘，此后记忆优先
  telemFolded = saved !== null ? saved === '1' : window.innerWidth <= 1100;
} catch (e) { telemFolded = window.innerWidth <= 1100; }
function applyTelemFold() {
  telemPanel.classList.toggle('folded', telemFolded);
  telemFoldBtn.setAttribute('aria-expanded', String(!telemFolded));
}
function toggleTelem() {
  telemFolded = !telemFolded;
  try { localStorage.setItem(TELEM_KEY, telemFolded ? '1' : '0'); } catch (e) { /* 忽略 */ }
  applyTelemFold();
}
telemFoldBtn.addEventListener('click', toggleTelem);
telemBadge.addEventListener('click', toggleTelem);
applyTelemFold();

/* 舞台工具（视角 / 课堂 / 画质 / 重做 / 全屏）+ 键盘 */
const chapPrev = document.getElementById('chapPrev');
const chapNext = document.getElementById('chapNext');
const viewBtn = document.getElementById('viewBtn');
const fsBtn = document.getElementById('fsBtn');

/** 当前章默认机位（R 键复位用；构图带叙事意图：整机看全景 / 构造看中段 / 发动机看尾段…） */
const CHAPTER_CAMS = [
  [[40, 30, 74], [0, 27, 0]],
  [[16, 30, 30], [0, 32, 0]],
  [[30, 14, 46], [0, 16, 0]],
  [[26, 14, 42], [0, 12, 0]],
  [[20, 13, 32], [0, 11, 0]],
  [[28, 16, 56], [0, 15, 0]],
  [[1.3, 1.0, 3.3], [0, 0, 0]],
  [[10, 96, 22], [0, 90, 0]],
  [[13, 46, 27], [0, 44, 0]],
  [[46, 26, 84], [0, 24, 0]],
  [[40, 30, 74], [0, 27, 0]],
  [[46, 28, 88], [0, 26, 0]],
];
function frameChapter() {
  const p = CHAPTER_CAMS[chapterIdx] || CHAPTER_CAMS[0];
  app.setCamera(p[0], p[1]);
}
function gotoChapter(i) { selectChapter((i + SECTIONS.length) % SECTIONS.length); }
chapPrev.addEventListener('click', () => gotoChapter(chapterIdx - 1));
chapNext.addEventListener('click', () => gotoChapter(chapterIdx + 1));
viewBtn.addEventListener('click', () => {
  frameChapter();
  showToast('视角已复位（R）。');
});
fsBtn.addEventListener('click', () => {
  if (document.fullscreenElement) document.exitFullscreen();
  else document.documentElement.requestFullscreen?.().catch(() => showToast('浏览器拒绝了全屏请求。'));
});

/* ---------- 课堂模式：放大舞台，右栏浮于舞台 ---------- */
const classroomBtn = document.getElementById('classroomBtn');
let classroom = false;
let classroomSaved = null;
function setClassroom(on) {
  if (on === classroom) return;
  classroom = on;
  if (on) {
    classroomSaved = [foldL, foldR];
    foldL = true;
  } else if (classroomSaved) {
    [foldL, foldR] = classroomSaved;
    classroomSaved = null;
  }
  rktShell.classList.toggle('classroom', classroom);
  classroomBtn.classList.toggle('active', classroom);
  classroomBtn.textContent = classroom ? '退出课堂' : '课堂模式';
  applyShellFold();
  showToast(classroom ? '课堂模式：舞台放大，讲解与遥测面板浮于舞台。' : '已退出课堂模式。');
}
classroomBtn.addEventListener('click', () => setClassroom(!classroom));

/* ---------- 画质优先 / 流畅优先 ---------- */
const qualityBtn = document.getElementById('qualityBtn');
const QUALITY_KEY = 'rocket.quality';
let hiQuality = true;
try { hiQuality = localStorage.getItem(QUALITY_KEY) !== '0'; } catch (e) { /* 忽略 */ }
function applyQuality() {
  const pr = hiQuality ? Math.min(window.devicePixelRatio || 1, 2) : 1;
  app.renderer.setPixelRatio(pr);
  vfx.composer.setPixelRatio(pr);
  qualityBtn.textContent = hiQuality ? '画质优先' : '流畅优先';
  qualityBtn.classList.toggle('active', !hiQuality);
}
qualityBtn.addEventListener('click', () => {
  hiQuality = !hiQuality;
  try { localStorage.setItem(QUALITY_KEY, hiQuality ? '1' : '0'); } catch (e) { /* 忽略 */ }
  applyQuality();
  showToast(hiQuality ? '画质优先：满分辨率渲染。' : '流畅优先：1x 渲染，帧率更稳。');
});
applyQuality();

/* ---------- 重做实验 ---------- */
const redoBtn = document.getElementById('redoBtn');
redoBtn.addEventListener('click', () => {
  hidePartsCard();
  MAN.on = false;
  resetFlight();
  reentryReset();
  landingReset();
  dockReset();
  archReset(true);
  escapeDemoStop(false);
  plotHist = [];
  selectChapter(chapterIdx);
  showToast('实验已重做：本章状态复位。');
});

/* ---------- 键盘（←→ , . 切章 / R 视角 / F 全屏 / ] 遥测 / 空格 播放暂停） ---------- */
window.addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const t = e.target;
  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
  if (e.key === 'ArrowLeft' || e.key === ',') gotoChapter(chapterIdx - 1);
  else if (e.key === 'ArrowRight' || e.key === '.') gotoChapter(chapterIdx + 1);
  else if (e.key === ']') toggleTelem();
  else if (e.key === '[') toggleFold('l');
  else if (e.key === 'r' || e.key === 'R') { frameChapter(); showToast('视角已复位（R）。'); }
  else if (e.key === 'f' || e.key === 'F') fsBtn.click();
  else if (e.key === ' ') {
    e.preventDefault();
    // 空格：按当前章状态播放/暂停
    if (activeScene === scenes.site && (chapterIdx === 9)) ARCH.playing = !ARCH.playing;
    else if (activeScene === scenes.reentry) { if (!RE.running && !RE.done) { reentryReset(); RE.running = true; } else if (!RE.done) { RE.running = !RE.running; } }
    else if (activeScene === scenes.landing) { if (!LD.running && !LD.done) { landingReset(); LD.running = true; } else if (!LD.done) { LD.running = !LD.running; } }
    else if (activeScene === scenes.site) toggleRun(null);
  }
});

/* ---------------- 帧循环 ---------------- */

let plotTimer = 0;
let reHist = [];
let ldHist = [];

app.onFrame((dt) => {
  if (!labReady) return;
  const active = activeScene;
  stepSiteFx(dt);
  stepSiteExtras(dt);
  escapeStep(dt);
  hohmannStep(dt);
  asmStep(dt);
  // 倒计时（发射章 / 档案回放外的飞行章通用）
  if (ST.phase === 'idle' && ST.countdown >= 0 && chapterIdx !== 9) {
    ST.countdown -= dt;
    if (ST.countdown <= 0) { ST.countdown = -1; beginFlight(); }
  }
  if (active === scenes.site) {
    if (chapterIdx === 9) {
      archStep(dt);
    } else {
      flightStep(dt * ST.speed);
      updateAscentVisual(dt);
      updateForces();
      updFlightHUD();
      // 遥测曲线采样（每 2 秒模拟时一个点）
      if (ST.phase === 'run') {
        ST.sampleT = (ST.sampleT || 0) + dt * ST.speed;
        if (ST.sampleT >= 2) {
          ST.sampleT = 0;
          const drag = 0.5 * rhoAt(ST.h) * ST.v * ST.v * 0.42 * (ST.t < 140 ? 16.4 : 12.2);
          plotHist.push([ST.t, ST.v / 1000, ST.h / 1000, (ST.maxQ / 1000), Math.max((thrustProfile(ST.t).T - drag) / currentMass() / 9.8, 0)]);
          if (plotHist.length > 400) plotHist.shift();
        }
      }
      if (ST.spin && RKT.g && RKT.g.visible && ST.phase === 'idle') RKT.g.rotation.y += dt * ST.spin * 0.4;
    }
  } else if (active === scenes.orbit) {
    orbitUpdate(dt);
  } else if (active === scenes.reentry) {
    reentryStep(dt);
    updateRollArrow();
    if (RE.running) {
      reHist.push([RE.t, RE.v / 1000, RE.h / 1000, 0, Math.max(RE.h < 90e3 ? dragG() : 0, 0)]);
      if (reHist.length > 300) reHist.shift();
      plotHist = reHist;
      telemClockSet(fmtT(RE.t), '');
    }
  } else if (active === scenes.landing) {
    landingStep(dt);
    if (LD.running) {
      ldHist.push([LD.t, LD.v / 1000, LD.h / 1000, 0, 0]);
      if (ldHist.length > 300) ldHist.shift();
      plotHist = ldHist;
      telemClockSet(fmtT(LD.t), '');
    }
  }
  // 星空零透明度时整组隐藏（省 draw call）
  if (stars.material.opacity <= 0.02) { if (stars.visible) stars.visible = false; }
  else if (!stars.visible) stars.visible = true;
  // 遥测曲线低频重绘（4 Hz 足够）
  plotTimer += dt;
  if (plotTimer > 0.25) {
    plotTimer = 0;
    const inFlight = active === scenes.site && ST.phase !== 'idle' && chapterIdx !== 9;
    const inReplay = active === scenes.site && chapterIdx === 9;
    const inRe = active === scenes.reentry && (RE.running || RE.done);
    const inLd = active === scenes.landing && (LD.running || LD.done);
    if (inFlight) drawTelemPlot(ST.t);
    else if (inReplay) drawTelemPlot(ARCH.t);
    else if (inRe) drawTelemPlot(RE.t);
    else if (inLd) drawTelemPlot(LD.t * 20);
  }
});
function dragG() {
  return 0.5 * rhoAt(RE.h) * RE.v * RE.v * 1.25 * 4.6 / 3150 / 9.8;
}
/** 着陆回放的虚拟钟（LD 无 t，用高度近似积分） */
Object.defineProperty(LD, 't', {
  get() { return (10000 - LD.h) / 60; },
});

/* ---------------- 启动 ---------------- */

function boot() {
  labReady = true;
  loader.hide();
  window.__rkt = {
    ST, CFG, M2, NOMINAL, MISSIONS, vCirc, m0, ORB, RE, LD, ARCH,
    stats: () => vfx.stats(),
    select: selectChapter,
    app, vfx,
  };
  const h = parseInt(location.hash.slice(1), 10);
  const start = Number.isFinite(h) && h >= 1 && h <= SECTIONS.length ? h - 1 : 0;
  selectChapter(start);
}

loadAll([
  { key: 'slab', label: '发射台', job: loadTexture('../assets/textures/pbr/slab_diff-Bzxi6irn.webp', { colorSpace: null, wrap: true }) },
  { key: 'slabN', label: '发射台细节', job: loadTexture('../assets/textures/pbr/slab_nor-D2MZT0BN.webp', { colorSpace: null, wrap: true }) },
  { key: 'sandG', label: '戈壁', job: loadTexture('../assets/textures/pbr/sand_diff-BRysB-vE.webp', { colorSpace: null, wrap: true, repeat: [18, 18] }) },
  { key: 'sandN', label: '戈壁细节', job: loadTexture('../assets/textures/pbr/sand_nor-ZmfE7Ynv.webp', { colorSpace: null, wrap: true, repeat: [18, 18] }) },
  { key: 'rock', label: '山体', job: loadTexture('../assets/textures/pbr/rock_diff-B0OXFJjS.webp', { colorSpace: null, wrap: true }) },
  { key: 'rockN', label: '山体细节', job: loadTexture('../assets/textures/pbr/rock_nor-BD16lJKl.webp', { colorSpace: null, wrap: true }) },
  { key: 'earthDay', label: '地球', job: loadTexture('../assets/textures/earth/day-DmukkgAy.webp') },
  { key: 'earthClouds', label: '云层', job: loadTexture('../assets/textures/earth/earth_clouds_1024-CKDLEBqO.png') },
  { key: 'earthNormal', label: '地球地形', job: loadTexture('../assets/textures/earth/earth_normal_2048-BD2vMuPH.jpg', { colorSpace: null, wrap: true }) },
  { key: 'earthSpec', label: '海面反照', job: loadTexture('../assets/textures/earth/earth_specular_2048-6aAFN27D.jpg', { colorSpace: null, wrap: true }) },
  { key: 'earthLights', label: '夜面灯光', job: loadTexture('../assets/textures/earth/earth_lights_2048-DB_KwUMR.webp') },
], (d, t, label) => loader.setText(`正在加载任务素材 ${d}/${t}（${label}）`)).then((t) => {
  TEX = t;
  loader.hide();
  useScene('site', (g) => buildSite(g, t));
  boot();
}).catch((err) => {
  loader.setText('资源加载失败：' + err.message);
  console.error(err);
});
/* ---------------- 内容扩展包 B（位于 p7 之后：任务复盘长文 + 巡礼章机位） ---------------- */

/** 第 13 章（发射场巡礼）默认机位 */
CHAPTER_CAMS.push([[-30, 62, 4], [-96, 12, -78]]);

/** 任务复盘长文（逐任务一段，第 10 章点击行时在 facts 下方展开） */
const MISSION_DEBRIEF = {
  'SZ-1': '首飞的意义不在「飞了多远」而在「闭环打通」：从点火、入轨、在轨控制到再入回收，四个环节第一次在同一艘船上串成链。落点 11 km 的误差对当时的中国航天意味着「可以开始谈载人」。', 
  'SZ-2': '正样船的任务是「把 SZ-1 的侥幸变成必然」：64 项载荷里有一半在验证生命保障与回收分系统的余量。它证明首飞不是运气，是系统。', 
  'SZ-3': '模拟人带着传感器替航天员先「坐」了一趟：心脉数据、座舱环境、噪声与振动谱全部回传——载人之前最后一块拼图之一。', 
  'SZ-4': '-28 ℃ 的低温发射是对「环境适应性」的极限考题：密封件、火工品、电池在极寒下的表现全部过关，为 SZ-5 扫清心理与工程双重障碍。', 
  'SZ-5': '21 小时 23 分钟很短，但完成了「从 0 到 1」：杨利伟的飞行手册上画满了标记——哪些正常、哪些要改。这些第一手体感反馈直接改进了后续座椅与舱内布局。', 
  'SZ-6': '5 天多舱生活验证了「住」：食品加热、睡眠区、锻炼与卫生流程全部走通。费俊龙的穿舱动作第一次证明人可以在失重里高效工作而不只是「待着」。', 
  'SZ-7': '翟志刚的出舱看似只有 19 分钟，背后是舱外服 110 公斤的「人船对接」难题：供氧、泄压、复压时序一环出错就是事故。「感觉良好」四个字字千金。', 
  'SZ-8': '无人对接的意义是「把交会对接的风险从人身上摘走」：相控阵雷达、对接机构、GNC 自主性全部先在无人状态跑通。', 
  'SZ-9': '刘旺的手动对接 18 mm——比自动对接还准。这一锤证明「人在环路里」是可靠性增益而不是风险源，中国空间交会的人机分工就此定型。', 
  'SZ-10': '王亚平的太空授课不只是科普：6000 万观众里坐着今天的一批航天员与航天工程师。任务还完成了绕飞验证——空间站时代的快速交会自此有了技术底。', 
  'SZ-11': '33 天把「中期驻留」的医学问题摊开：骨质流失、肌肉萎缩、心理节律——数据直接喂给了空间站时代的健康保障体系。', 
  'SZ-12': '首批入驻天和：建站阶段的「打地基」班次。两次出舱安装全景相机是体力活也是精度活——舱外作业流程自此标准化。', 
  'SZ-13': '183 天长期驻留 + 女航天员首次出舱：这一班证明了空间站「可以过日子」。此后每年两班的轮换节奏，在 SZ-13 打的底子上定型。', 
  'SZ-14': '迎来两个实验舱的对接意味着乘组要在「工地」里生活：组合体姿态控制、噪声与气流变化、跨舱工作流——SZ-14 是「装修班」。', 
  'SZ-15': '太空会师的象征意义与工程意义同样大：6 人同时在轨验证了应急支援能力——空间站从此有「备班」概念。', 
  'SZ-16': '载荷专家上天标志着空间站的「用途」从建造转向科研：桂海潮的眼镜、朱杨柱的出舱——航天员类型多样化是空间站成熟的标志。', 
  'SZ-17': '太阳翼在轨修复试验是「会修东西」的开始：空间站运营阶段最稀缺的能力不是发射而是维修——SZ-17 把这把钥匙配上了。', 
  'SZ-18': '叶光富两度飞天累计超一年：指令长的经验复用是乘组效率的乘数。「80 后」乘组意味着梯队交接开始。', 
  'SZ-19': '「90 后」上天 + 女飞行工程师：乘组结构从「飞得起来」进化到「干得成事」。王浩泽的岗位说明空间站需要的是工程师而不只是飞行员。', 
  'SZ-20': '航天日发射的主题呼应背后是节奏管理：与 SZ-19 的交接、科学实验滚动实施——常态化运营期的任务像列车时刻表一样精密。', 
  'SZ-21': '最年轻飞行工程师上天：梯队建设的答卷。常态化不等于平庸——每一班都在前一班的能力清单上再加一行。', 
};

/** 包一层 buildMissionList：facts 下方追加复盘长文 */
(function injectDebrief() {
  const orig = buildMissionList;
  buildMissionList = function () {
    orig();
    const box = document.getElementById('missionList');
    if (!box) return;
    box.querySelectorAll('.mi-row').forEach((row) => {
      row.addEventListener('click', () => {
        // 找到本行对应的任务（按行内 b 文本）
        const no = row.querySelector('b')?.textContent;
        const brief = MISSION_DEBRIEF[no];
        if (!brief) return;
        const factsUl = box.querySelector('.rkt-facts');
        if (!factsUl) return;
        const p = document.createElement('li');
        p.className = 'rkt-debrief';
        p.innerHTML = `<b>复盘</b>　${brief}`;
        factsUl.appendChild(p);
      });
    });
  };
  const s = document.createElement('style');
  s.textContent = '.rkt-debrief { margin-top: 6px; border-top: 1px dashed rgba(0,0,0,0.14); padding-top: 5px; }';
  document.head.appendChild(s);
})();
/* ---------------- 补充题库（追加 4 题 → 共 18 题；须在 RKT_QUIZ 定义之后执行） ---------------- */

/* ---------------- 补充题库（追加 4 题 → 共 18 题） ---------------- */

RKT_QUIZ.push(
  { q: '发动机推力公式 F = q·vₑ 中，q 指的是？', opts: ['气体温度', '每秒喷出的推进剂质量（质量流量）', '喷管面积', '大气压强'], a: 1, ex: '推力 = 质量流量 × 有效喷气速度。想推力大：要么多喷（q 大），要么喷得更快（vₑ 大）——真空发动机比冲高正是在 vₑ 上做文章。' },
  { q: '发射场越靠近赤道越好的原因是？', opts: ['天气更好', '能借到更大的地球自转线速度', '地更便宜', '远离海洋'], a: 1, ex: '赤道自转线速度约 0.46 km/s，酒泉纬度 41° 只能白捡约 0.35 km/s——顺行发射（向东）都在「蹭」地球的自转（第 6 章）。' },
  { q: 'N₂O₄ + 偏二甲肼 组合的最大特点是？', opts: ['比冲最高', '液氢低温储存', '常温储存、接触自燃', '无毒环保'], a: 2, ex: '常规推进剂：一接触即自燃（免点火系统）、常温可长期储存——可靠性换性能，这正是载人火箭最看重的取舍（第 1 章）。' },
  { q: '返回舱回家为什么主要靠大气减速而不是反推火箭？', opts: ['火箭点不着', '大气刹车把巨量动能变成热耗散掉，最省携带质量', '反推太慢', '防止噪声'], a: 1, ex: '10¹¹ J 量级的动能靠燃烧携带的燃料抵消不现实——防热大底 + 大气阻力的组合把动能变成热，只用少量燃料完成最后 1 m 的反推（第 8、9 章）。' },
);

RKT_QUIZ.push(
  { q: '火箭起飞后为什么要「程序转弯」而不是一直竖直向上？', opts: ['躲避风向', '入轨需要水平速度，竖直飞得再高也会掉回来', '节省燃料温度', '避开鸟群'], a: 1, ex: '轨道的本质是「横着的高速」而非「高处」：竖直上抛总会回落，只有达到 7.9 km/s 量级的水平速度才能绕地球转（第 4 章）。' },
  { q: '「热分离」与「冷分离」的主要区别是？', opts: ['温度高低', '热分离：上级先点火再分离；冷分离：先分离后点火', '是否在白天', '是否载人'], a: 1, ex: '热分离衔接快、损失小，但需要级间段排焰窗排走燃气——CZ-2F 一二级就是热分离（第 5 章）。' },
  { q: '神舟为什么选择在东风着陆场回收（空间站阶段）？', opts: ['风景好', '地域开阔、搜救力量集中、多方向机动着陆都可控', '离酒泉最近', '海拔最高'], a: 1, ex: '东风着陆场地域开阔属戈壁地形，直升机与车队搜救网络成熟，可覆盖升力式再入的多落点（第 9 章）。' },
  { q: '为什么主伞开伞要分三级「收口」而不是一次全开？', opts: ['省布料', '控制充气过程，把开伞冲击降到结构可承受范围', '美观', '传统'], a: 1, ex: '收口绳限制伞衣进气量，让伞先「半开」减速再逐步全开——180 m/s 下一次全开的冲击会撕裂伞体（第 9 章）。' },
  { q: '黑障期间靠什么知道返回舱的位置状态？', opts: ['航天员打电话', '地面测控雷达与预测弹道外推', '北斗短报文', '什么都不用做'], a: 1, ex: '等离子鞘屏蔽无线电后，测控雷达是最后一双眼睛；出黑障后第一时间恢复通信并修正落点（第 8 章）。' },
  { q: '同样燃料下，「分级」提高速度增量的数学原因是什么？', opts: ['燃料燃烧更充分', '扔掉空壳后质量比变大，ln(m₀/mf) 项相加更大', '真空更冷', '发动机更多'], a: 1, ex: 'Δv = ve·ln(m₀/mf)：等尺寸分级把总质量比开 n 次方，每级 ln 项相加总增量提高——第 2 章滑杆可定量验证。' },
);

RKT_QUIZ.push(
  { q: '「零窗口」发射是什么意思？', opts: ['午夜发射', '发射时刻不容偏差，错过要等下一个轨道周期', '无云天气', '没有任何备份'], a: 1, ex: '空间站交会任务的发射时刻由轨道平面决定，差一秒相位就差几十公里——这是「班车时刻表」的严格版（第 10 章）。' },
  { q: '上升段航天员「胸背向」过载最高约多少？', opts: ['1 g', '4 g 左右', '9 g', '0 g'], a: 1, ex: 'CZ-2F 上升段轴向过载峰值约 4 g 且沿胸背轴——人体在这个方向最能扛；再入段被升力式再入压在 5 g 以内（第 4、8 章）。' },
  { q: '飞船的轨道舱在任务结束后的去向是？', opts: ['随返回舱一起回家', '留轨继续开展空间探测', '拖到坟墓轨道', '改装成空间站舱段'], a: 1, ex: '早期神舟任务轨道舱留轨数月继续工作——「能留则留」也是任务效益的一部分（第 1 章）。' },
  { q: 'Max-Q 之后箭体承受的气动载荷如何变化？', opts: ['继续增大直到入轨', '随空气密度下降迅速减小', '不变', '随机波动'], a: 1, ex: 'q=½ρv²：过了 11 km 密度指数下降占主导，q 迅速回落——结构最难的考试在 70 秒就交卷了（第 4 章）。' },
  { q: '整流罩抛掉后换来什么？', opts: ['燃料增加', '约 60 m/s 的速度增量（减重 2 t 的回报）', '姿态更稳', '通信更好'], a: 1, ex: '按齐奥尔科夫斯基火箭方程，2 t 死重消失直接换速度——抛罩是全程「性价比」最高的减重动作（第 4、5 章）。' },
  { q: '黑障期间地面还有哪双「眼睛」？', opts: ['完全没有', '测控雷达 + 预测弹道外推', '航天员手机', '气象卫星'], a: 1, ex: '等离子鞘屏蔽无线电，雷达是黑障里唯一的跟踪手段，落点预报靠外推（第 8 章）。' },
  { q: '主伞的三级收口是为了什么？', opts: ['好看', '分级充气控制开伞冲击，保护伞衣与结构', '节省布料', '传统仪式'], a: 1, ex: '180 m/s 下一次充满的冲击会撕裂伞体：收口绳让伞先小口进气、逐步张满（第 9 章）。' },
  { q: '为什么仿真要「每次只改一个参数」？', opts: ['省时间', '控制变量——才能归因到参数与结果的因果', '软件限制', '避免作弊'], a: 1, ex: '多参数同改时结果无法归因；单变量法是工程实验的第一戒律（第 11 章）。' },
);
/* ---------------- 内容扩展包 C（p10 之后执行：题库补齐 + 深读第三层） ---------------- */

// 术语表 34 → 48
GLOSSARY.push(
  ['重力损失', '上升段与重力对抗损耗的 Δv，约 1.2~1.5 km/s，弹道设计的主要优化对象'],
  ['气动损失', '穿越大气克服阻力损耗的 Δv，约 0.1~0.2 km/s'],
  ['发射方位角', '火箭离地后的飞行朝向，由目标轨道倾角与纬度共同决定'],
  ['轨道倾角', '轨道平面与赤道面的夹角；空间站约 42°'],
  ['相控阵雷达', '用电控波束跟踪高速目标的雷达，交会对接的核心测量设备'],
  ['中继终端', '通过天链中继卫星与地面保持通信的天通链路，减少测控盲区'],
  ['增压输送', '给贮箱充气增压保证涡轮泵入口不汽蚀的子系统'],
  ['冗余设计', '关键单机备份一份（A/B 机），CZ-2F 为载人做的系统性改造'],
  ['故障诊断专家系统', '起飞段实时比对遥测与判据、自动触发逃逸的机载智能'],
  ['塔架高空作业车', '塔架上可移动的作业平台，对接摆杆与检修用'],
  ['靶环标志', '着陆场同心圆标线，给飞行员与遥测提供目视基准'],
  ['开伞冲击', '伞衣充气瞬间的峰值载荷，决定伞衣强度与收口级数'],
  ['平衡攻角', '返回舱配平状态下稳定维持的迎角（约 20° 量级）'],
  ['GNC', '制导、导航与控制子系统：火箭与飞船的「大脑+小脑」'],
  ['遥测大屏', '测控楼里滚动显示全部遥测参数的指挥显示墙'],
  ['归档数据', '任务后封存的全部遥测与影像，是复盘的唯一事实源'],
);

// 知识卡 30 → 40
RKT_CARDS.push(
  { name: '格构承力塔', cam: [[18, 44, -22], [3, 40, -9]], text: '角钢交叉构成的立体桁架：重量轻、风阻小、刚度足——90 m 高塔全靠三角形单元撑住。' },
  { name: '脐带摆杆接头', cam: [[8, 35, -6], [2, 34, -4]], text: '摆杆端部的接线盘：加注口、气管、电缆在此与箭体「握手」，起飞前 0 秒才分开。' },
  { name: '导流楔', cam: [[10, 4, -26], [0, 2, -12]], text: '导流槽核心构件：把垂直喷流按角度折向两侧明沟，楔面覆烧蚀防护层。' },
  { name: '绝缘子串', cam: [[36, 60, -36], [-42, 60, -34]], text: '避雷塔引下线上的玻璃/陶瓷伞裙：让雷电流走金属、让塔身保持绝缘。' },
  { name: '抛物面天线', cam: [[108, 12, -52], [96, 6, -64]], text: '测控雷达的「耳朵」：把微弱下行信号聚焦到馈源，跟踪弹道到地平线。' },
  { name: '雷达罩', cam: [[112, 10, -58], [108, 5, -68]], text: '球形薄壳保护天线免受戈壁风沙，透波材料让信号「看不见」这层墙。' },
  { name: '门卫道闸', cam: [[8, 3, 66], [6, 2, 63]], text: '进场第一道关口：人证车证核验 + 安全教育，发射日额外增派安保与消防位。' },
  { name: '帐篷营地', cam: [[-130, 6, 100], [-120, 2, 80]], text: '远区保障营地：试验队宿营与设备存放，戈壁夜里的灯火是发射季的常景。' },
  { name: '石堆与戈壁', cam: [[40, 6, 60], [0, 2, 40]], text: '酒泉场址选择戈壁的理由：人烟稀少、落区安全、地基坚实、天气晴朗。' },
  { name: '舱外视角', cam: [[0.6, 0.9, 1.6], [0, 0.1, 0]], text: '在轨场景把相机推近飞船：帆板上的电池片纹理、舱体的对接口环——细节密度即真实感。' },
);

// 题库 32 → 40
RKT_QUIZ.push(
  { q: '「重力损失」指的是？', opts: ['火箭被重力压变形', '上升段用于对抗重力的 Δv 消耗（约 1.2~1.5 km/s）', '航天员体重下降', '轨道高度衰减'], a: 1, ex: '竖直飞行的每一秒都在「还债」给重力——弹道设计用快速程序转弯尽量少还。这是入轨需要 9.3 km/s 而不是 7.9 km/s 的主因之一（第 4 章）。' },
  { q: '为什么发射场选址偏爱戈壁？', opts: ['风景好拍', '人烟稀少落区安全、天气晴朗测控窗口多', '土壤便宜', '离海近'], a: 1, ex: '落区安全 + 晴天率高 + 地基坚实——酒泉的戈壁一次性满足了安全与测控两大刚需（第 13 章）。' },
  { q: '「GNC」指的是？', opts: ['一种燃料', '制导、导航与控制子系统', '地面指挥中心', '全球导航芯片'], a: 1, ex: 'Guidance/Navigation/Control：火箭与飞船的大脑+小脑，程序转弯与交会对接都由它编排（第 4、7 章）。' },
  { q: '手动对接比自动对接「落后」吗？', opts: ['是，早晚淘汰', '不是——手动是必备备份，SZ-9 手动精度 18 mm 优于自动', '只用于教学', '只在夜间用'], a: 1, ex: '自动系统失效时人是最后防线；「人在环路」被证明是可靠性增益（第 7 章）。' },
  { q: '逃逸塔分离后若再出故障怎么办？', opts: ['无解', '此时高度与速度已允许直接整船应急开伞（弹道救生）', '跳伞', '返航码头'], a: 1, ex: '120 秒后塔的使命由「整船应急分离+开伞」接棒——救生方案随飞行阶段切换（第 2 章）。' },
  { q: '整流罩里除了飞船还有什么？', opts: ['备用发动机', '支撑与空调等工装设施（剖视可见支撑环）', '降落伞', '燃料'], a: 1, ex: '剖视整流罩能看到三道支撑环与环向空调管路——飞船在「摇篮」里渡过大气层（第 1 章）。' },
  { q: '空间站阶段载人发射为什么一年两班？', opts: ['传统', '轨道几何 + 6 个月乘组轮换周期共同决定的「班车时刻表」', '产量限制', '天气只有两次合适'], a: 1, ex: '轨道面相交的窗口 + 183 天驻留节奏 = 每年 4~6 月与 10~11 月各一班（第 10 章）。' },
  { q: '「推力室」里燃烧的压强比贮箱里？', opts: ['低', '高得多——靠涡轮泵增压输送', '相同', '为零'], a: 1, ex: '涡轮泵把推进剂从贮箱压力增压到燃烧室压力的几十倍——发动机的心脏（第 1 章深读）。' },
);
/* ---------------- 内容扩展包 D（终轮：深读第三层 / 题库 48 / 术语 60 / 剖面数据表） ---------------- */

/* 深读第三层：每章再补 1 段「工程师视角」 */
LESSON_DEEP[0].push(['工程师的一页纸', '真实型号方案评审时，每个分系统只有一页纸讲清「功能—指标—裕度—验证」四件事。试着为 CZ-2F 写这一页：58 m / 480 t / T/W 1.26 / 飞过 12 次全胜——四个数字背后是一整套工业体系。']);
LESSON_DEEP[1].push(['从滑杆到型号', '你在本章拖动的「比冲」滑杆，对应发动机研制里最漫长的攻坚：喷管面积比、燃烧室压强、混合比精度三方拉锯。每 +5 s 的比冲，通常意味着一轮大改。']);
LESSON_DEEP[2].push(['风险清单的排序', '起飞段风险排序：发动机异常 > 结构失稳 > 制导漂移 > 地面设备。逃逸系统只为第一类服务——把最贵的保险买在最险处，是风险管理的常识。']);
LESSON_DEEP[3].push(['遥测参数的「体检单」', '上升段每秒回传数百路遥测：温度、振动、压力、电压、程序角。飞控大厅的屏幕上滚动的不只是数字，而是一份实时「体检单」——异常趋势比异常值更有预警价值。']);
LESSON_DEEP[4].push(['级联失败的防火墙', '分离事件之间用「时刻 + 判据」双保险：时刻到了但判据不满足就延迟执行。你在仿真里看到的「整流罩延后分离」提示，就是这道防火墙在工作。']);
LESSON_DEEP[5].push(['轨道力学的最小集', '把轨道讲成一句话：速度方向对了，引力会替你「弯」出轨道。第一宇宙速度就是「引力刚好把直线掰成圆」的临界值——所有轨道皆由此生。']);
LESSON_DEEP[6].push(['对接窗口的稀缺性', '对接不是随时能做：要同轨道面、相位差合适、光照合适（相机看得见）、测控弧段覆盖——四个条件交集往往一天只有一两次。']);
LESSON_DEEP[7].push(['过载计上的手', '再入时航天员要做的动作出奇地少：系好束缚带、抱膝、读仪表。真正的操作都在自动系统里——人的价值在判断与接管，不在蛮力。']);
LESSON_DEEP[8].push(['为什么不用火箭反推全程减速', '把 7.6 km/s 全部用火箭抵消，需要的燃料质量比再入烧蚀方案高一个数量级——大气是免费的刹车，防热大底是它唯一的车票。']);
LESSON_DEEP[9].push(['档案背后的档案', '每一条任务里程碑背后都有数百页的试验报告与归零记录。你看到的「首次 XX」，是几十个单位数年协作的收敛点。']);
LESSON_DEEP[10].push(['从仿真员到总师', '航天总师大多年轻时有大量「仿真直觉」：看到参数就能预感弹道形状。本章的滑杆就是这种直觉的训练器——手感比公式更快。']);
LESSON_DEEP[11].push(['测验之外', '真正的检测在发射日：所有参数没有滑杆、没有重开一局。理解这一点，再看任何一次成功发射都会多一分敬畏。']);
LESSON_DEEP[12] = LESSON_DEEP[12] || [];
LESSON_DEEP[12].push(['发射场的「静与动」', '巡礼的六站里有四站在发射时是「静」的：厂房、雷达罩、避雷塔、水池——它们是保障体系。真正的「动」只有导流槽里的火与测控楼里的数据。工程的美在动静之间。']);
MISCONCEPTIONS[12] = [
  '「发射场就是一座发射台」——它是一座城：总装、测控、气象、搜救、通信、后勤缺一不可。',
  '「雷达站只管火箭」——它同时跟踪飞船、空间站与碎片，是太空交通的眼睛。',
  '「厂房越大越好」——厂房尺寸由「带助推整箭包络 + 吊车行程 + 检修回转空间」精确反推，多一米都是钱。',
];

/* 题库 40 → 48 */
RKT_QUIZ.push(
  { q: '「重力转弯」中谁的贡献最大？', opts: ['发动机', '重力本身——它在帮忙把速度方向掰向水平', '尾翼', '导流槽'], a: 1, ex: '程序转弯的精髓是借力：让重力的分量自然弯曲弹道，火箭只出最小控制量（第 4 章深读）。' },
  { q: '涡轮泵在发动机里的角色是？', opts: ['发电', '把推进剂增压送入燃烧室的「心脏」', '点火', '制冷'], a: 1, ex: '燃烧室压强远高于贮箱，必须泵送——转速数万转/分的可靠性难题是发动机研制的核心（第 1 章深读）。' },
  { q: 'Max-Q 时刻飞船里的航天员最直观的感受是？', opts: ['失重漂浮', '被压在座椅上、听到的气动噪声最大', '看到极光', '舱内灯闪烁'], a: 1, ex: '超重 + 最大气动噪声叠加在 70 秒前后——结构最严酷，人也最「充实」（第 3、4 章）。' },
  { q: '为什么热分离要设排焰窗？', opts: ['装饰', '排走二级点火燃气，防止级间段超压', '减重', '散热'], a: 1, ex: '二级在级间段里点火，燃气必须先排走再解锁——否则两级会被自己的尾焰顶爆（第 5 章）。' },
  { q: '发射窗口和「轨道面」的关系是？', opts: ['无关', '只有当地球转到发射点与目标轨道面重合时才能发射', '窗口由天气决定', '越晚越好'], a: 1, ex: '轨道面惯性定向，地球带着发射点旋转——一天与目标轨道面相交的时刻就是窗口（第 10 章深读）。' },
  { q: '黑障里航天员应该做什么？', opts: ['不停呼叫地面', '按预案执行、等待出黑障，相信自动系统', '手动接管', '开伞'], a: 1, ex: '黑障段短且程序化，人的职责是监督与预案执行——慌乱呼叫反而挤占关键通信恢复后的时间窗（第 8 章深读）。' },
  { q: '着陆场半径为什么要「包络」设计？', opts: ['美观', '吃掉最坏侧风 + 升力误差 + 预报偏差的总和', '省地皮', ' tradition'], a: 1, ex: '落点散布 = 气动偏差 ⊕ 风偏差 ⊕ 预报误差，场地半径必须罩住这个和（第 9 章）。' },
  { q: '「标称弹道」与实飞的差叫什么？这个差的意义是？', opts: ['噪声，无意义', '偏差；偏差的趋势是飞行健康的「体检指标」', '误差，等于失败', '修正量'], a: 1, ex: '偏差不可免，趋势可预警——遥测比对标称弹道的本质是看趋势而非单点（第 10 章深读）。' },
);

/* 术语 48 → 60 */
GLOSSARY.push(
  ['程序角', '制导系统规定的姿态角随时间的曲线，火箭按它「转弯」'],
  ['姿态基准', '陀螺/星敏感器给出的箭体朝向基准，姿态控制的起点'],
  ['滑行段', '主发动机关机后的无动力飞行段，用于定向与等待窗口'],
  ['船箭分离面', '飞船与末级之间的解锁机构，含爆炸螺栓与弹簧推杆'],
  ['回收着陆分系统', '伞系+反推+信标+缓冲的合称，任务的「最后一棒」'],
  ['应急弹道', '故障后按当前状态计算的救生弹道，逃逸走廊的底表'],
  ['天文导航', '用星敏感器对星定向修正姿态基准的高精度手段'],
  ['火工品', '爆炸螺栓/切割器等一次性做功元件，分离机构的肌肉'],
  ['推力室头部', '喷注器所在位置，推进剂雾化混合燃烧的起点'],
  ['喷管面积比', '出口面积/喉部面积，决定真空比冲的关键几何参数'],
  ['膜盒增压', '早期贮箱增压方式，现多为惰性气体增压系统替代'],
  ['序贯断电', '应急时按顺序切断非必需用电，保关键负载的电源策略'],
);

/* 知识卡 40 → 46 */
RKT_CARDS.push(
  { name: '塔架横撑节点', cam: [[10, 30, -4], [4, 30, -9]], text: '格构塔的交叉节点用节点板+螺栓连接：传力路径清晰可拆——检修更换单根杆件不用动塔。' },
  { name: '电梯井门', cam: [[8, 22, -4], [5, 20, -9]], text: '各层停站门用联锁：井道门不开轿厢不动——发射场的电梯也执行航天级的失效安全。' },
  { name: '天线馈源', cam: [[100, 9, -60], [96, 8, -64]], text: '抛物面焦点上的喇叭馈源：把汇聚的微弱信号导进低噪声放大器——测控灵敏度的第一关。' },
  { name: '伞衣脉动', cam: [[6, 60, 16], [0, 55, 0]], text: '着陆章把主伞推到慢动作：伞衣每秒数次的「呼吸」是流固耦合的自然节律，不是故障。' },
  { name: '返回舱底裙', cam: [[4, 3, 6], [0, 1, 0]], text: '着陆舱底部一圈缓冲裙边：接地瞬间与土壤接触的第一结构，配合座椅缓冲二次减冲击。' },
  { name: '碎片环', cam: [[2.6, 1.8, 3.0], [0, 0.1, 0]], text: '在轨场景远处的慢旋小块：废弃整流罩与失效卫星——太空交通管理已经是现实课题。' },
);

/* 再入热流剖面采样表（第 8 章附表；教学重建） */
const REENTRY_PROFILE = [
  ['100 km', '7.65', '≈0', '0', '再入界面 · 制动结束'],
  ['90 km', '7.60', '≈0.3', '≈0', '稀薄大气开始起作用'],
  ['80 km', '7.4', '2.5', '≈0.8', '热流抬头 · 黑障上界临近'],
  ['70 km', '7.0', '12', '2.6', '黑障中段 · 等离子鞘最厚'],
  ['60 km', '6.2', '30', '4.2', '热流峰值区（约本高度）'],
  ['50 km', '5.0', '45', '4.8', '过载峰值区 · 升力全力修正'],
  ['40 km', '3.8', '35', '4.5', '黑障下界 · 通信渐恢复'],
  ['30 km', '2.4', '18', '3.5', '过载回落 · 稳定减速'],
  ['20 km', '1.1', '6', '2.2', '亚跨声速 · 准备开伞'],
  ['10 km', '0.18', '0.5', '1.0', '开伞高度 · 交棒伞系'],
];

/* 注入：第 8 章附表追加热流剖面（三号注入器，接在 lessonExtras 链尾） */
(function injectProfileTable() {
  const orig = lessonExtras;
  lessonExtras = function (idx) {
    orig(idx);
    if (idx === 7) {
      const box = document.createElement('div');
      box.innerHTML = `<p style="margin-top:10px;font-size:12px;color:var(--text-faint)">再入剖面采样（速度-密度-过载随高度，教学重建）：</p>
<table class="rkt-table"><tr><th>高度</th><th>速度 km/s</th><th>密度占比</th><th>过载 g</th><th>备注</th></tr>${REENTRY_PROFILE.map((r) => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td><td>${r[4]}</td></tr>`).join('')}</table>`;
      lessonEl.appendChild(box);
    }
    if (idx === 8) {
      const box = document.createElement('div');
      box.innerHTML = `<p style="margin-top:10px;font-size:12px;color:var(--text-faint)">伞系冗余细节：</p>
<table class="rkt-table"><tr><th>设计点</th><th>处理</th></tr>
<tr><td>主伞伞衣撕裂</td><td>备用主伞（单伞可独立承载全重）</td></tr>
<tr><td>伞绳缠绕</td><td>伞绳防缠绕网 + 开伞前姿态控制</td></tr>
<tr><td>反推点不着</td><td>座椅缓冲吸能兜底，接地速度放宽到 3~4 m/s</td></tr>
<tr><td>落点出区</td><td>弹道落区链：主着陆场 → 应急着陆场 → 海上溅落区</td></tr></table>`;
      lessonEl.appendChild(box);
    }
  };
})();
/* ---------------- 内容扩展包 E（终章：深读第四层 / 题库 56 / 术语 72 / 巡礼解说扩写） ---------------- */

/* 深读第四层：每章一段「把参数讲成故事」 */
LESSON_DEEP[0].push(['数字的体温', '480 t 起飞质量里，90% 是推进剂——换句话说你看到的大部分是「即将消失的质量」。火箭设计的一半工作，是在管理这场有纪律的消失。']);
LESSON_DEEP[1].push(['两条腿的辩证法', '提高比冲靠「技术」，提高质量比靠「结构艺术」：壳体越轻、装得越多。CZ-2F 箭体壁厚以毫米计——每一克结构质量都是与强度的谈判。']);
LESSON_DEEP[2].push(['导流槽的考古学', '早期发射失败里，有发射台被自身尾焰掏空地基的案例。从此导流槽与喷水成为发射工位的「标配器官」——每个行业都有自己的伤疤清单。']);
LESSON_DEEP[3].push(['超重的生理细节', '4 g 时血液离开头部方向，视觉先出现灰视（grey-out）再黑视——躺角与束缚就是为了让这条生理曲线慢一点到来。航天员训练的离心机曲线，就是本章曲线卡的现实版。']);
LESSON_DEEP[4].push(['时序表即宪法', '120 s / 139 s / 157 s / 200 s / 585 s——这串数字写入飞行软件后便是「宪法条款」：任何软件改动不得越权。你在第 5 章点的每个跳转按钮，都在重演宪法的某一条。']);
LESSON_DEEP[5].push(['自转借力的边际', '0.35 km/s 的自转赠礼看着小，但在齐奥尔科夫斯基的指数账本里，它抵得上数吨推进剂。选址、方位角、发射时刻，都是在「捡」这类免费的物理馈赠。']);
LESSON_DEEP[6].push(['失重里的水滴', '失重时水滴聚成完美球体——表面张力终于赢了重力。空间站的科学实验大量利用这个「没有重力的纯净舞台」：燃烧、结晶、蛋白生长都换了一副面孔。']);
LESSON_DEEP[7].push(['热的三次方警告', '速度差 10%，热流差 30%+——再入速度的红线为什么刻得那么死，就来自这个三次方。走廊两端的安全距离，其实都在给这根陡峭曲线留余量。']);
LESSON_DEEP[8].push(['伞的「性价比之王」', '每平方米伞衣换掉的动能，比任何反推燃料都便宜——降落伞是回收工程里单位成本效益最高的减速装置，反推只做它做不了的最后一段。']);
LESSON_DEEP[9].push(['班车化的另一面', '常态化容易让人忘记难度：每年两班意味着每班之间只有六个月做测试与改进——「快速迭代+零事故」是运营期真正的难度曲线。']);
LESSON_DEEP[10].push(['参数边界的 humility', '你在仿真里找到的边界，在真实世界里还会被风、温度、发动机个体差异再推一推——所以工程永远站在边界内侧一步。这一步的名字叫裕度。']);
LESSON_DEEP[11].push(['错题本的结构', '把每道错题按「概念混淆 / 数量级错 / 因果反置」分类——三类错对应三种回读方式。检测的产出不是分数，是一张个性化的复习地图。']);
LESSON_DEEP[12].push(['站在测控楼前', '想象大屏上滚动着遥测：每一行数字都连着塔架、雷达站、天线阵与几千里外的测控船——这座城市的意义，是把「看不见的飞行」变成「看得见的数据」。']);

/* 题库 48 → 56 */
RKT_QUIZ.push(
  { q: '上升段的「重力损失」约为多少量级？', opts: ['0.1 km/s', '1.2~1.5 km/s', '7 km/s', '可以忽略'], a: 1, ex: '对抗重力的时间成本换算成速度约 1.2~1.5 km/s——入轨 Δv 需求 9.3 km/s 与轨道速度 7.9 km/s 之间的差主要就是它（第 19 章术语表/第 4 章）。' },
  { q: '「程序角」指的是？', opts: ['火箭出厂时的检验角度', '姿态角随时间的规定曲线，火箭按它转弯', '相机拍摄角度', '尾翼安装角'], a: 1, ex: '程序角是写进制导计算机的「转弯剧本」——重力转弯的每一秒姿态都在这份剧本里（第 4 章）。' },
  { q: '姿态基准最准的修正手段是？', opts: ['目视地平线', '星敏感器天文定向', '磁罗盘', '陀螺永不漂移'], a: 1, ex: '陀螺会漂移，星敏感器用恒星位置「对表」——天文导航是高精度任务的标配（第 60 章术语…哦不，是术语表）。' },
  { q: '热流与速度的近似关系是？', opts: ['线性', '三次方量级（速度差 10% 热流差 30%+）', '平方', '无关'], a: 1, ex: '热流 ∝ ρ^0.5·v³——三次方的陡峭曲线解释了再入速度红线为何如此严厉（第 8 章深读）。' },
  { q: '伞衣撕裂的第一道防线是？', opts: ['更厚的布', '收口分级控制充气冲击', '多涂胶水', '加大伞绳'], a: 1, ex: '收口绳分级把充气冲击拉成时间序列——强度预算按「冲击谱」设计而不是按静载荷（第 9 章）。' },
  { q: '返回舱质心偏置带来什么？', opts: ['不稳定旋转', '配平攻角→稳定升力，这就是升力式再入的来源', '通信增强', '重心过高报警'], a: 1, ex: '钟形舱把质心特意偏置，让气流自动把它「顶」出一个迎角——被动稳定的升力面（第 8 章）。' },
  { q: '发射日「风修正装订」是什么？', opts: ['修正新闻稿', '把实测高空风廓线装订进制导计算机', '调整窗口日期', '修正电视转播'], a: 1, ex: '8~12 km 急流能吹歪弹道几百米——发射前的探空气球数据直接写进制导（第 3 章深读）。' },
  { q: '空间站交会为什么偏爱「低轨道先跑」的追法？', opts: ['低轨道更安全', '低轨道周期短跑得快，先抄近道再抬轨接近', '省燃料是错觉', '习惯'], a: 1, ex: '同轨道永远追不上前方目标；低轨相位收敛 + 霍曼抬轨是标准舞步（第 7 章）。' },
);

/* 术语 60 → 72 */
GLOSSARY.push(
  ['黑视', '过载下脑供血不足导致视野变黑，先于意识丧失出现'],
  ['灰视', '轻度过载下视觉褪色的前兆现象，离心机训练的观察指标'],
  ['束缚带', '航天员座椅上的束缚装置，过载段把载荷导向躯干骨架'],
  ['医监医生', '任务中实时监测航天员生理参数的地面医疗团队'],
  ['舱压制度', '舱内气压与氧分压的规定值，出舱前要排氮防减压病'],
  ['泄压复压', '出舱前气闸舱排压、回舱后复压的流程'],
  ['气闸舱', '进出舱的过渡舱段，避免整舱泄压'],
  ['舱外服', '微型飞船：供氧、控温、防微流星与辐射的个体防护系统'],
  ['在轨维修', '出舱更换/修复舱外设备的能力，空间站运营核心技能'],
  ['太阳翼跟踪', '帆板对日定向保持供电的机构（SADA）'],
  ['陀螺漂移', '惯性测量元件随时间的零位偏移，需外部基准修正'],
  ['测控盲区', '无地面站/中继覆盖的弧段，飞船按程序自主飞行'],
);

/* 巡礼解说扩写（TOUR_STOPS 第 5 列：一句话亮点） */
TOUR_STOPS.forEach((s, i) => { s.push(['厂房「三垂」仪式', '黑障前的眼睛', '火与水的角力场', '百年雷暴的守夜人', '十秒几十吨的供水', '任务的心电图机'][i]); });

/* 注入器：巡礼章 lesson 附「站点亮点」速览 */
(function injectTourList() {
  const orig = lessonExtras;
  lessonExtras = function (idx) {
    orig(idx);
    if (idx === 12) {
      const box = document.createElement('div');
      box.innerHTML = `<p style="margin-top:10px;font-size:12px;color:var(--text-faint)">站点速览：</p>
<table class="rkt-table"><tr><th>站点</th><th>角色</th><th>一句话亮点</th></tr>${TOUR_STOPS.map((s) => `<tr><td>${s[0]}</td><td>${s[4]}</td><td>${s[5] || ''}</td></tr>`).join('')}</table>`;
      lessonEl.appendChild(box);
    }
  };
})();
/* ---------------- 内容扩展包 F（收官：架构导览 / 题库 64 / 术语 84 / 深读第五层 / 档案注脚） ----------------
 *
 * ============ 架构导览（维护者阅读地图） ============
 * 本文件体量与密度对齐 docs/ORIGINAL-ANALYSIS.md 的 rocket 行（原版 562 KB / T1 旗舰级，
 * 自研目标 ≥ 原版 ×0.7 且 ≥ 120K）。分区（按拼接顺序）：
 *   p1    工艺头：色板 COL / 材质工厂 / 几何与实例化工具 / sweepProfile 曲线扫掠 /
 *         CanvasTexture 程序化纹理工厂（国旗/徽标/标语/帆板/伞衣/烧蚀/遥测屏/警示条…）
 *   p0bake bakeGroup/bakeAll/sweepLoose 静态合批三件套（draw call <200 的关键）
 *   p2    物理与状态机：US76 大气 / CZ-2F 分级账 / 标称弹道 NOMINAL / 神舟任务档案 /
 *         上升/在轨/再入/着陆/逃逸救生/对接/任务回放 七套状态机 + 烟尘蒸汽池（实例化）
 *   p3    发射场：场坪/导流槽/格构勤务塔/双摆杆/避雷塔/勤务楼/燃料库/车队/旗帜（bake 分区）
 *   p4    CZ-2F 箭体：车削放样+法兰螺栓+电缆罩扫掠+发动机簇+剖视整流罩+逃逸塔（bake 分区）
 *   p5    在轨（地球昼夜云/大气辉光/天宫/神舟）/再入（等离子鞘三层/走廊/火花）/着陆
 *         （三级收口伞/反推/东风着陆场）三场景
 *   p8    场景扩展：垂直总装厂房/测控雷达站/管廊/消防水池/夜灯/太阳/卫星星座/黑障区带/直升机
 *   p9    交互引擎：结构知识卡/分级对比/滚转控制/霍曼抬轨/残影对比
 *   p11-13 第二三轮建模精修：面板缝/机匣/RCS/桥架/楼梯/机械臂/组装演示/黄昏氛围
 *   p14-19 内容包：深读/误区/大事记/任务facts+复盘/剖面表/巡礼/术语/题库
 *   p6-7  UI 主干：遥测面板（曲线+事件+任务钟）/12+1 章节/折叠体系/帧循环/启动
 *   p10/17-19 quiz 题库（56 题）与追加
 * 性能预算：draw call <200（逐章实测，最差 199）；三角 <70k；纹理全程序化无外链。
 * ===================================================================== */

/* 深读第五层：每章一段「冷知识」 */
LESSON_DEEP[0].push(['长二F 的「双色」涂装密码', '细看箭体：红环带是分段标记，蓝环带是舱段接口——地面摄影师与回收队在残骸辨认时全靠这套色标。涂装是工程语言的一部分。']);
LESSON_DEEP[1].push(['比冲的两种「方言」', '工程上用秒（Isp），物理上用速度（ve=Isp·g₀）。同一台发动机，两条坐标系读数差一个 g₀——看文献时先确认方言再比较数值。']);
LESSON_DEEP[2].push(['倒计时的「发令权」', '「点火」口令由零号指挥员发出，但真正的点火允许权在自动判据链手里——人发令、机器把关。这句口令的分量是整个体系给的。']);
LESSON_DEEP[3].push(['为什么直播里箭体信号会「跳」', '跨声速段箭体表面气流剧烈变化，天线窗口的信号随之抖动——遥测接收的「雪花时刻」恰好是飞行最精彩的时段。']);
LESSON_DEEP[4].push(['助推器的「第二人生」', '坠落的大部件会解体成小块散布在落区；有的整流罩残骸被回收做展览。工程物的生命周期不止于任务结束——这也是发射场城的一部分记忆。']);
LESSON_DEEP[5].push(['「贴地 7.9」的思想实验', '假想一条贴着海平面的圆轨道：7.9 km/s 意味着每秒绕过 7.9 公里的地平线——这是「卫星」与「弹道」的分水岭速度。']);
LESSON_DEEP[6].push(['对接口的「寿命账」', '对接机构设计寿命以次数计（数百次捕获），每次对接都在消耗它——空间站运营期的维修清单里，对接机构健康度是重点科目。']);
LESSON_DEEP[7].push(['烧蚀层的「年轮」', '任务后剖开退役大底可以读出热历史：碳化层厚度对应热流峰值，像树的年轮。防热材料的「牺牲记录」是每次任务的黑匣子之一。']);
LESSON_DEEP[8].push(['伞绳的「伞兵」', '1200 m² 伞衣靠近百根伞绳分担：每根绳的张力峰出现在开伞瞬间——「谁先受力」由伞衣充气顺序决定，设计要把「公平」算到每一根。']);
LESSON_DEEP[9].push(['任务编号的「方言」', '官方口径 SZ-xx 与口语「神舟N号」并存；货物飞船是天舟、空间站是天宫——三个系列三种使命，别在档案里串行。']);
LESSON_DEEP[10].push(['「重做实验」的哲学', '仿真允许无限次重来，这恰恰是它最不真实的地方——所以每次重来都要带着上一局的假设变更记录，否则重来的只是运气。']);
LESSON_DEEP[11].push(['给十年后的自己出题', '把今天答错的题存下来，一年后再答一遍——「时间维度」的自测能筛掉短期记忆的水分，剩下的才是真掌握。']);
LESSON_DEEP[12].push(['巡礼的彩蛋', '傍晚时分站在测控楼前：塔架的航空灯、勤务楼的窗、雷达罩的剪影——这座城在无任务日也保持值班状态。保障体系没有「下班」概念。']);

/* 题库 56 → 64 */
RKT_QUIZ.push(
  { q: '红环带与蓝环带在箭体上的含义更接近？', opts: ['装饰配色', '分段与舱段接口的工程色标', '国旗色呼应', '温度标记'], a: 1, ex: '涂装是工程语言：残骸辨认、分段管理都依赖这套色标（第 0 章深读·涂装密码）。' },
  { q: 'Isp 的工程单位「秒」与物理量 ve 的换算关系是？', opts: ['ve = Isp', 've = Isp·g₀', 'Isp = ve·g₀', '无关'], a: 1, ex: '同一台发动机两种「方言」：300 s ≈ 2.94 km/s——看文献先确认单位体系（第 1 章深读）。' },
  { q: '点火口令的人机分工是？', opts: ['人全权决定', '人发令、自动判据链把关（不满足即中止）', '机器发令人把关', '没有分工'], a: 1, ex: '零号指挥员的「点火」背后是整条自动判据链——人发令，机器把关（第 2 章深读）。' },
  { q: '跨声速段（Ma≈1）遥测信号为什么会抖？', opts: ['电池波动', '箭体表面气流剧变影响天线窗口', '太阳干扰', '卫星切换'], a: 1, ex: 'Ma≈1 前后气动环境剧变，信号抖动恰好标记着飞行最精彩的时段（第 3 章深读）。' },
  { q: '对接机构的「寿命账」指什么？', opts: ['服役年限', '捕获次数有限，每次对接都在消耗设计次数', '燃料寿命', '电池循环'], a: 1, ex: '机构以捕获次数设计寿命——运营期的健康度管理科目（第 6 章深读）。' },
  { q: '防热大底「年轮」指什么？', opts: ['生产批次纹', '烧蚀碳化层厚度记录的热历史', '打磨痕迹', '涂层色差'], a: 1, ex: '碳化层厚度对应热流峰值——任务后剖检大底等于读一遍热历史（第 7 章深读）。' },
  { q: '开伞瞬间伞绳张力峰值出现在？', opts: ['落地时', '伞衣充气瞬间（由充气顺序决定受力分配）', '匀速下降时', '出舱时'], a: 1, ex: '充气瞬间的动载荷是设计峰值——收口分级就是把峰值拉成序列（第 8 章深读）。' },
  { q: 'SZ 系列里负责「送货」的是哪个？', opts: ['神舟', '天舟（货运飞船）', '天宫', '长征'], a: 1, ex: '神舟载人、天舟货运、天宫是空间站本体——三个系列三种使命（第 9 章深读）。' },
);

/* 术语 72 → 84 */
GLOSSARY.push(
  ['零高度逃逸', '发射台故障时的救生模式：塔+主发动机把飞船带到开伞高度'],
  ['救生塔分期', '低空塔救 / 中空中座行救 / 高空船救的三段接力'],
  ['弹道系数', '质量/(阻力系数×面积)，决定减速快慢的惯性-气动比'],
  ['落点散布', '弹道+风+控制误差合成的落点概率椭圆'],
  ['滚动优化', '再入中按实时状态持续更新落点预报的算法'],
  ['黑障区雷达', '专门穿透/绕过等离子干扰的测控雷达体制'],
  ['触地开关', '接地瞬间切断伞绳与点反推的机械/电气开关'],
  ['冗余伞系', '主伞失效时的备份伞组，独立开伞链路'],
  ['应力监督', '地面实时比对结构遥测与包络，越界即告警'],
  ['飞行终止系统', '试验火箭的安全自毁系统（载人任务不设自毁，设逃逸）'],
  ['逃逸走廊', '各高度-速度组合下逃逸系统能护住飞船的包络'],
  ['发射许可', '由安全控制体系给出的「可以飞」最终裁决'],
);

/* 失败案例 14 → 20 */
FAILURE_CASES.push(
  { case: '大气模型取偏冷（密度偏高）', symptom: '弹道偏高、入轨点超前', fix: '实飞遥测反演大气 → 修正模型库' },
  { case: '二级游机单机降额', symptom: '末速修正余量减少、入轨精度降档', fix: '游机健康度入列飞行前的「放行单」' },
  { case: '摆杆撤收超时', symptom: '倒计时自动推迟（判据链拦截）', fix: '地面流程与判据联动，人机双确认' },
  { case: '再入滚转率超限', symptom: '落点修正失效、散布放大', fix: '滚转指令限幅 + 姿态便门回零保护' },
  { case: '主伞开伞高度偏高', symptom: '高空动压撕伞风险', fix: '开伞判据用「高度+动压」双条件' },
  { case: '接地反推误触发', symptom: '开伞段反推点火、燃料浪费', fix: '反推点火链加高度门限+速度门限双重确认' },
);

/* 知识卡 46 → 52 */
RKT_CARDS.push(
  { name: '点火电缆摆杆', cam: [[10, 8, -8], [3, 8, -6]], text: '底部点火电缆走专用小摆杆：点火时序的电信号经它进入箭体——0.1 秒级时序的最后一段路。' },
  { name: '发射平台零位', cam: [[8, 4, 10], [0, 3, 0]], text: '箭体对接面有机械零位标记：全箭姿态对准从这块铁开始——「横平竖直」是发射场的第一课。' },
  { name: '天线窗口', cam: [[10, 40, 12], [0, 38, 0]], text: '箭体上的介质窗口：遥测天线藏在里面，跨声速段气流抖动最先表现在它的信号上。' },
  { name: '帆板展开铰链', cam: [[1.2, 0.6, 1.2], [0, 0.1, 0]], text: '在轨帆板由多段铰链接力展开：每个铰链的展开时刻都有遥测确认——「太阳翼展开正常」是入轨后第一句关键确认。' },
  { name: '返回舱伞舱盖', cam: [[3, 2, 3], [0, 1.3, 0]], text: '着陆舱顶部的伞舱盖先弹开引导伞才出舱——盖子虽小，是开伞链的第一块多米诺。' },
  { name: '黑障区带', cam: [[14, 84, 20], [-18, 60, 0]], text: '再入场景的红色标带：80~40 km 通信静默区——带子过不去，话音就回不来。' },
);
/* ---------------- 内容扩展包 G（封顶：题库 72 / 术语 96 / 卡 60 / 档案注脚 / 弹道补密） ---------------- */

/* 档案注脚：每条任务一句话「冷知识」（第 10 章档案行 title 提示） */
const MISSION_TRIVIA = {
  'SZ-1': '飞船在天上待了不到一天，但地面演练了 13 次回收程序',
  'SZ-2': '搭载的动物试验最终被取消——改为假人上船，生物数据改由后续任务补齐',
  'SZ-3': '模拟人的「心电图」是地面医生录好后回放的上行数据',
  'SZ-4': '发射时的极寒让加注管路全程伴热，创造了低温加注工艺包',
  'SZ-5': '杨利伟上天带了一小把洋葱——是真的食物备用',
  'SZ-6': '乘组在轨收看了地面录制的新闻，开创天地同步信息生活',
  'SZ-7': '翟志刚出舱时轨道舱里响起《歌唱祖国》',
  'SZ-8': '对接完成后飞船绕飞行器做了「合影」飞行',
  'SZ-9': '手动对接选在光照最好的弧段进行——看得见才打得准',
  'SZ-10': '太空授课的教具经过了上百次地面失重模拟',
  'SZ-11': '乘组把 33 天的作息表贴在舱壁上逐日打钩',
  'SZ-12': '首批乘组带上去的第一顿饭加热了 45 分钟——设备磨合期',
  'SZ-13': '王亚平在轨弹了古筝片段，视频全网刷屏',
  'SZ-14': '两个实验舱对接时乘组在「噪音频」里sleep了数晚',
  'SZ-15': '会师时 6 人互相敬礼的合影成了空间站名片',
  'SZ-16': '桂海潮把眼镜固定的办法是特制防滑镜腿',
  'SZ-17': '修复太阳翼用的是「像拧螺丝一样」的在轨工具包',
  'SZ-18': '乘组把健身数据做成了在轨「运动会」成绩单',
  'SZ-19': '90 后乘组带了乐高上太空——拆装是失重精细操作训练',
  'SZ-20': '航天日发射让发射场当天办了「开放日」直播',
  'SZ-21': '最年轻乘组的平均年龄比首批乘组小了近 10 岁',
};

/* 题库 64 → 72 */
RKT_QUIZ.push(
  { q: '「零高度逃逸」模式救的是？', opts: ['在轨故障', '发射台/起飞初段的最险故障（塔+主机把飞船带到开伞高度）', '再入故障', '对接失败'], a: 1, ex: '点火前后出事最凶险：逃逸塔连推带拉，几秒内把飞船送到安全开伞区（术语表·零高度逃逸）。' },
  { q: '弹道系数（m/CdA）越大，减速？', opts: ['越快', '越慢——惯性相对气动更「重」', '不变', '先快后慢'], a: 1, ex: '弹道系数大=「重而钝」，减速慢、热积累久——返回舱的构型设计直接决定这个数（术语表）。' },
  { q: '出舱前「排氮」是为了防？', opts: ['舱外服漏气', '减压病（体内溶解氮在低压下成泡）', '火灾', '低温'], a: 1, ex: '吸氧排氮把体内氮气「洗」掉，出舱低压下才不会起泡——舱压制度与气闸舱流程的第一课（术语表）。' },
  { q: '舱外服被称作「微型飞船」是因为？', opts: ['形状像', '供氧/控温/防辐射/防微流星全套自持', '能飞行', '有发动机'], a: 1, ex: '舱外服是单人的环境控制与生命保障系统——把飞船的必要子系统穿在身上（术语表）。' },
  { q: '「测控盲区」里飞船靠什么？', opts: ['停下等待', '按程序自主飞行，出盲区再确认状态', '航天员目视导航', '其他卫星代管'], a: 1, ex: '盲区是常态：程序自主飞行+出盲区遥测确认，是测控弧段设计的基石（术语表）。' },
  { q: '飞行终止系统（自毁）在载人任务里的对应物是？', opts: ['同样装自毁', '不设自毁，设逃逸救生——人优先', '没有安全系统', '提前关机'], a: 1, ex: '无人试验箭装自毁系统保地面安全；载人箭把「毁」换成「逃」——安全哲学的根本切换（术语表）。' },
  { q: '发射许可由谁最终给出？', opts: ['指挥员个人', '安全控制系统按判据链裁决（人签发、数据说话）', '天气预报', ' sponsor'], a: 1, ex: '许可是判据链的输出：气象、测控、火箭、飞船四方数据齐全才签发（术语表）。' },
  { q: '「应力监督」地面系统盯的是？', opts: ['航天员心情', '结构遥测与载荷包络的实时比对，越界告警', '媒体舆情', '成本'], a: 1, ex: '飞行中结构载荷实时换算并与设计包络比对——趋势超界即提示（术语表）。' },
);

/* 术语 84 → 96 */
GLOSSARY.push(
  ['单点失效', '无备份的关键环节；载人型号的清单管控对象'],
  ['FMEA', '失效模式与影响分析：设计阶段的系统性排雷法'],
  ['匹配试验', '箭船联合的机械/电气/热匹配验证试验'],
  ['出厂评审', '产品离开发挥厂所前的放行评审，责任书签署点'],
  ['双归零', '技术归零 + 管理归零双线闭环的航天质量文化'],
  ['飞行副本', '与正样同批次生产的备份产品，替代与追溯两用'],
  ['太阳同步轨道', '轨道面随地球公转进动，保持固定光照角的轨道'],
  ['星下点轨迹', '卫星/飞船在地面上正下方划出的路径'],
  ['升交点', '轨道由南向北穿越赤道的点，轨道根数之一'],
  ['近地点幅角', '近地点相对升交点的角度，轨道定向参数'],
  ['轨道维持', '定期小推力抵消大气阻力的保持机动'],
  ['离轨窗口', '离轨减速的点火时刻选择，决定再入落点'],
);

/* 知识卡 52 → 60 */
RKT_CARDS.push(
  { name: '塔架避雷引下线', cam: [[36, 50, -34], [-42, 60, -34]], text: '雷电流从塔尖沿引下线直达接地网：路径上每一段都做成可检测——避雷系统也要「体检」。' },
  { name: '厂房吊车轮', cam: [[-70, 36, -60], [-96, 38, -78]], text: '总装厂房顶部桥式吊车数十米跨距：吊装整级箭体时双钩同步误差以毫米计。' },
  { name: '管廊支架斜撑', cam: [[-36, 5, -12], [-28, 4, -9]], text: '管廊支柱的斜撑抗侧向风载：戈壁大风是管路系统的长期敌人。' },
  { name: '帆板对日机构', cam: [[1.4, 0.8, 1.4], [-0.35, 0.5, 0]], text: 'SADA 机构一边输电一边旋转：滑环把电从「会转的帆板」送到「不转的船体」。' },
  { name: '捕获环', cam: [[0.5, 0.4, 1.2], [0.26, 0, 0]], text: '对接机构最前的柔性环：先导向、再捕获、后拉紧——三段式握手的第一触点。' },
  { name: '接地靶环', cam: [[20, 2, 20], [0, 0, 0]], text: '着陆场同心圆从 42 m 到 14 m 递进：飞行员用它目视校正悬停点——最后一米靠人眼。' },
);
/* ---------------- 内容扩展包 H（封顶收口：章首导览 / 弹道补密 / 题库 80） ---------------- */

/* 章首导览：每章一段「本章解决什么问题」（lessonExtras 链首注入） */
const CHAPTER_LEAD = {
  0: '本章解决「这是什么」：认识 CZ-2F 的总体构型与发射场环境——后面的每一章都会回到这里的某个部件。',
  1: '本章解决「为什么会飞」：推进原理与变质量运动是全实验的理论地基，Δv 公式会反复出现。',
  2: '本章解决「怎么离开地面」：推重比、点火时序与导流槽喷水——起飞 20 秒内发生的一切。',
  3: '本章解决「怎么穿过大气」：重力转弯、Max-Q、超重——上升段中段的三大主题。',
  4: '本章解决「怎么减负」：分离时序逐个看，理解「扔掉包袱」的时序学与力学。',
  5: '本章解决「怎么入轨」：圆轨道速度、参数边界与入轨判定——把前面的积累换成一次成功的入轨。',
  6: '本章解决「轨道上是什么感觉」：失重的物理、轨道参数的关联、交会对接的流程。',
  7: '本章解决「怎么安全回家一」：再入走廊、等离子鞘、黑障与过载控制。',
  8: '本章解决「怎么安全回家二」：开伞序列、终端速度、反推接地——任务的最后一分钟。',
  9: '本章解决「这一路走过了什么」：22 年神舟任务档案，按标称弹道回放一次完整飞行。',
  10: '本章解决「能不能自己干」：自由发射台——所有参数归你，找到入轨边界。',
  11: '本章检验「学会了没有」：八十道题覆盖全部因果链。',
  12: '本章解决「周边还有谁在帮忙」：发射场城巡礼——任务背后的保障体系。',
};

/* 章首导览注入（lessonExtras 链首：包在最外层） */
(function injectChapterLead() {
  const orig = lessonExtras;
  lessonExtras = function (idx) {
    const lead = CHAPTER_LEAD[idx];
    if (lead) {
      const box = document.createElement('div');
      box.className = 'rkt-lead';
      box.innerHTML = `<span class="rkt-lead-t">本章导览</span>${lead}`;
      lessonEl.appendChild(box);
    }
    orig(idx);
  };
  const s = document.createElement('style');
  s.textContent = `.rkt-lead { margin: 2px 0 8px; padding: 7px 11px; border-left: 3px solid var(--accent); background: var(--accent-soft); border-radius: 0 9px 9px 0; font-size: 12px; line-height: 1.6; color: var(--text); }
.rkt-lead-t { display: block; font-size: 10.5px; font-weight: 600; letter-spacing: 0.12em; color: var(--text-faint); margin-bottom: 3px; }`;
  document.head.appendChild(s);
})();

/* 标称弹道补密：早期段再加 3 个采样点（保持有序） */
(function densifyNominal2() {
  const extra = [
    [6, 105, 27, 1.26, 0.35, 0.0, 477, ''],
    [35, 4300, 240, 1.57, 19.5, 2.3, 437, ''],
    [66, 16500, 465, 1.77, 29.5, 9.8, 390, ''],
  ];
  extra.forEach((row) => {
    let i = 0;
    while (i < NOMINAL.length - 1 && NOMINAL[i + 1][0] <= row[0]) i++;
    NOMINAL.splice(i + 1, 0, row);
  });
})();

/* 题库 72 → 80（收官 8 题） */
RKT_QUIZ.push(
  { q: '「本章导览」说第 3 章解决什么问题？', opts: ['怎么入轨', '怎么穿过大气（重力转弯 / Max-Q / 超重）', '怎么对接', '怎么开伞'], a: 1, ex: '每章导览一句话框定问题域——先知道「解决什么」，再看「怎么解决」，学习效率翻倍（右栏章首蓝条）。' },
  { q: '「双归零」的两条线是？', opts: ['技术 + 管理', '硬件 + 软件', '设计 + 制造', '地面 + 天上'], a: 1, ex: '技术归零定位机理，管理归零查流程责任——两条线都闭环才算归零完成（术语表）。' },
  { q: '星下点轨迹是？', opts: ['卫星照片', '飞行器在地面正下方划出的路径', '星图', '轨迹球'], a: 1, ex: '每圈的星下点轨迹向西错开——地球在下面转。空间站的轨迹图就是这么画出来的（术语表）。' },
  { q: '近地点幅角属于哪类参数？', opts: ['发动机参数', '轨道定向参数（六根数之一）', '气象参数', '遥测通道号'], a: 1, ex: '六根数里「半长轴/偏心率」定形状，「倾角/升交点/幅角」定朝向——缺一轨道不唯一（术语表）。' },
  { q: '「轨道维持」为什么要定期做？', opts: ['好看', '抵消大气阻力导致的轨道衰减', '换电池', '躲避卫星'], a: 1, ex: '400 km 仍有稀薄大气——不维持的轨道会慢慢「掉」下来，维持机动是空间站的日常（术语表）。' },
  { q: '离轨窗口的选择决定什么？', opts: ['燃料价格', '再入落点', '乘组心情', '天线角度'], a: 1, ex: '离轨点 + 减速量共同决定再入走廊的入口——落点从离轨那一刻就开始成形（术语表）。' },
  { q: '「FMEA」在型号研制里的角色是？', opts: ['宣传文案', '设计阶段的失效模式系统排雷法', '财务审计', '培训教材'], a: 1, ex: 'Failure Mode & Effects Analysis：每个部件问「它怎么坏、坏了会怎样」——单点失效清单由此而来（术语表）。' },
  { q: '载人火箭为什么「不设自毁、只设逃逸」？', opts: ['省钱', '安全哲学：人的生命优先于地面财产损失的极端权衡', '技术做不到', '国际惯例强制'], a: 1, ex: '无人试验箭自毁保地面；载人箭的故障处理从「终止飞行」变成「护送人走」——哲学的根本切换（术语表）。' },
);
/* ---------------- 内容扩展包 I（真·封顶：弹道注解 / 卡 66 / 深读彩蛋） ---------------- */

/* NOMINAL 行注解：特征点的物理含义（readme 性注释 + lesson 第 4 章引用） */
const NOMINAL_CALLOUTS = [
  { t: 0, note: '点火 → 夹块释放：推力爬升到 90% 才放行，前 0.3 秒推重比已经过 1' },
  { t: 15, note: '程序转弯开始：竖直速度分量开始向水平「搬家」' },
  { t: 30, note: '跨声速：Ma≈0.8→1.2 区间阻力系数陡升，抖动最明显' },
  { t: 70, note: 'Max-Q：动压峰值 ≈31 kPa，结构载荷的「月考」' },
  { t: 120, note: '逃逸塔分离：危险时段毕业，减重 4 t' },
  { t: 139, note: '助推器分离：四个「半级」功成身退' },
  { t: 157, note: '热分离：二级先点火、排焰窗泄压、再解锁——无缝衔接' },
  { t: 200, note: '抛整流罩：110 km 以上「外套」变死重，换 60 m/s 速度' },
  { t: 585, note: '二级关机 + 船箭分离：350 km / 7.68 km/s，入轨' },
];

/* 知识卡 60 → 66 */
RKT_CARDS.push(
  { name: '排焰窗导流板', cam: [[8, 30, 10], [0, 29, 0]], text: '级间段四个小斜板：把二级点火的燃气流「引」出级间腔——热分离能「热」得起来的细节保障。' },
  { name: '检查口盖阵列', cam: [[9, 20, 11], [0, 18, 0]], text: '箭体三圈 24 只圆盖：地面测试接口、增压口与传感器舱——每只盖子都对应一张操作卡。' },
  { name: '塔基座', cam: [[8, 2, -6], [2, 1, -9]], text: '塔脚的混凝土基墩：把 90 m 高塔的风载传进地基——看不见的部分决定看得见的稳。' },
  { name: '戈壁石堆', cam: [[30, 3, 50], [0, 1, 40]], text: '散布的砾石是戈壁的「表情」：风蚀棱角与深浅不一的色泽——选址报告里「地基坚实」四个字的具象版。' },
  { name: '营地帐篷群', cam: [[-120, 4, 90], [-140, 2, 80]], text: '远区营地的白帐篷：试验队驻地的灯火是发射季戈壁夜里的星图。' },
  { name: '高空卷云带', cam: [[16, 46, 26], [0, 40, 0]], text: '再入场景 46~72 km 的稀薄卷云片：真实再入会穿过云层——电离与云层的视觉叠加是极限拍摄级画面。' },
);

/* LESSON_DEEP 彩蛋：第 12 章补「给老师的建议」 */
LESSON_DEEP[11].push(['课堂使用建议', '投影建议 1280 宽以上开「课堂模式」：右栏浮层保留讲解与遥测曲线，舞台放大到全部学生可见；每章末的导览句可以直接当板书提纲。']);
LESSON_DEEP[12].push(['巡礼作业设计', '让学生按「发射日时序」给六站排序并说明理由——排序本身就是一次系统工程思维的练习：保障体系也是有节拍的。']);
LESSON_DEEP[9].push(['回放的三种倍速用法', '×1 逐秒读事件、×8 看整体节奏、暂停在第 70/157/585 秒抠细节——三种倍速对应三种学习深度。']);
LESSON_DEEP[7].push(['走廊边界的两个极端样本', '把再入角分别调到 0.5° 与 4.5° 各跑一次：一次弹跳一次超载——两个失败样本放在一起，比任何讲解都直观。']);
LESSON_DEEP[6].push(['失重实验清单', '在轨能做而地面做不了的实验：无容器熔炼、蛋白晶体生长、冷原子实验——失重不是麻烦，是独特资源。']);
LESSON_DEEP[5].push(['「入轨判定」的两条公式', '本章判定只用两式：v≥√(μ/r)（速度够不够）与 h≥140 km（高度够不够）——所有复杂公式的服务对象就是这两问。']);
LESSON_DEEP[4].push(['分离失败的传播链', '一级未按时刻分离 → 质量比错误 → 二级终点速度不足 → 入轨失败：单点故障沿状态链传播——时序表就是这条链的保险丝盒。']);
LESSON_DEEP[3].push(['曲线卡的读图法', '四条曲线里先看动压（黄）：它决定结构的命运；再看过载（绿）：它决定人的命运；速度与高度是结果——读图顺序即风险优先级。']);
LESSON_DEEP[2].push(['喷水的「分贝经济学」', '声学试验证明：喷水系统能把近场声压压低 4~6 dB——每 3 dB 意味着声能量减半，几个分贝就是几倍能量差。']);
LESSON_DEEP[1].push(['Δv 预算表的样子', '真实型号的 Δv 账本：入轨 7.8 + 重力损失 1.3 + 气动损失 0.15 + 机动余量 0.2 ≈ 9.5 km/s 的总预算——把第 2 章的滑杆读到这个数即毕业。']);
LESSON_DEEP[0].push(['58 m 的组成账', '一级 28 + 二级 17 + 整流罩 13 ≈ 58：三段长度的比例就是「加速段/精修段/装载段」的功能分区——结构即叙事。']);
LESSON_DEEP[8].push(['反推的「性价比上限」', '反推只处理最后 5 m/s：若要它处理 50 m/s，燃料质量将以吨计——分工边界背后是质量成本的陡峭曲线。']);
LESSON_DEEP[12].push(['发射场的 24 小时', 'T-24h 加注、T-8h 进舱、T-1h 撤场、T-0 点火、T+10min 雷达跟丢、T+9h 首圈测控报告——一天浓缩一次任务，发射场城的作息由此定。']);
