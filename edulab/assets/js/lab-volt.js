/* EduLab · VoltLab 电学实验台（volt）— Micro 级 3D 深改
 * =====================================================================
 * 章节（22，原版教学主线 1:1）：串并联 / 欧姆定律 / 电源电动势内阻 / 灯泡伏安 /
 *   RC 充放电 / 断电自感 / LC 振荡 / 整流滤波 / 电桥精测 / RLC 谐振 / 变压器 /
 *   二极管导通 / 光控路灯 / 直流电动机 / 短路保险丝 / 稳压管 / 焦耳定律 /
 *   电阻定律 / 多用电表 / 电磁铁 / 光伏电动机 / 空白实验台
 *
 * 三栏布局：左课程大纲（22 章列表，点击切章高亮迁移）· 中实验台舞台 · 右知识点详解（三手风琴）
 * 折叠体系：左右栏 28px 竖条折叠 × 电路图窗/示波器窗折叠为 40px 圆徽标 × 右栏手风琴
 *           × 专注模式（双栏同折）——全部 localStorage 记忆；≤1100px 首访清爽态；≤860px 纵向堆叠
 *
 * 场景工艺（edu-vfx 接入）：
 *   实验台 = 程序化木纹台面（年轮色带+纤维细纹+板缝）+ 钢包边 + 铸铁桌腿横撑
 *            + 背墙刻度标尺 + 顶部吊灯辉光 + 道具阵列（元件收纳盒/备用保险丝管/螺丝刀/导线轴/笔记本）
 *   元件建模 = Lathe 玻壳灯泡（螺旋灯丝 TubeGeometry + 黄铜螺口三道螺纹）
 *            + 胶木表壳车削仪表（高密度表盘 CanvasTexture：主/副刻度+数字+红量程弧+镜面反光弧）
 *            + 瓷管密绕滑动变阻器（螺旋绕线 TubeGeometry + 金属滑轨 + 绝缘手柄滑块）
 *            + 色环电阻（阻值→色环色实际换算）+ 电解电容（套管负极条纹+极性凸标）
 *            + 电动机（散热筋壳+端盖轴承+换向器碳刷+皮带轮）+ 熔断器（瓷管+观察窗+双铜帽）
 *            + EI 叠片变压器铁芯 + 双漆包线圈 + 铭牌 + 接线排
 *   材质工艺 = matCoat 烤漆（漆面 clearcoat 走向）/ matStd 金属分区 metalness / matGlass 玻璃
 *            / matGlow 发光件与亮度联动； PAL 取色 + 本实验延展色板 VP（铜/胶木/瓷/漆红绿）
 *   光照氛围 = 主暖光 + 冷补光 + 反弹 + 半球 + makeStudioEnvironment PMREM + 接触阴影贴片
 * 自研内核 = 改进节点电压法（MNA + 牛顿迭代）瞬态求解器，程序化建模，无外部模型
 * 自研增设 = 每章任务 chip（行动指令打勾）+ 每章随堂检测（判分+解析）+ 电路图/示波器窗折叠徽标
 * =====================================================================
 */
import {
  THREE, TAU, clamp,
  createApp, makeLoader,
  createControlsPanel, makeHUD, makeTextSprite,
} from './edu-core.js';
import {
  attachVFX, makeStudioEnvironment, makeWoodTexture, makeLabelTexture,
  matStd, matCoat, matSheen, matGlow, matGlass, PAL, fbm3,
} from './edu-vfx.js';

const lerp = (a, b, t) => a + (b - a) * t;

/* ================= 舞台与工艺接入 ================= */

const stage = document.getElementById('stage');
const loader = makeLoader(stage, '正在铺设电学实验台…');
const app = createApp({
  container: stage,
  fov: 40, near: 0.05, far: 80,
  cameraPos: [0, 3.6, 4.8], target: [0, 1.22, 0],
  minDistance: 0.8, maxDistance: 30,
  exposure: 1.04,
  keepBackground: true,
});
const { scene, camera, controls } = app;
const vfx = attachVFX(app, 'illus');
scene.environment = makeStudioEnvironment(app.renderer);

/* 本实验延展色板（PAL 通用族不够覆盖电学器材；仅 volt 使用） */
const VP = {
  lacquerRed: 0xb8402e, lacquerRedHi: 0xd8684a,      // 漆红（表针/滑块/开关钮）
  lacquerGreen: 0x2e6e50, lacquerGreenHi: 0x43916c,  // 漆绿（电池盒/底座）
  bakelite: 0x211d18, bakeliteHi: 0x39332a,          // 胶木黑（表壳/开关座）
  porcelain: 0xe9e4d8, porcelainDeep: 0xc8c2b2,      // 瓷白（瓷管/瓷接头）
  copper: 0xc07a3e, copperHi: 0xe0a06a, copperDeep: 0x8a5424, // 漆包铜
  brass: PAL.brass, brassHi: 0xd9b26a, brassDeep: 0x8a6a32,   // 黄铜接线柱/螺口
  chrome: 0xc9ced4, steel: PAL.steel, steelDeep: 0x565e66,    // 钢件
  panelGray: 0x4a545e, panelDark: 0x333b44,          // 机箱面板
  kerosene: 0xc98f3e, keroseneHi: 0xeab65e,          // 煤油
  oilPaper: 0xe8dfc8,                                // 铭牌纸
  wireRed: 0x992f22, wireRedHi: 0xc4503a,            // 导线红
  bulbWarm: 0xffd9a0, filamentHot: 0xffb65e,         // 灯丝暖光
  beadFlow: 0x74c8f0,                                // 电子流小珠
  glowAmber: 0xffa544,                               // 氛围辉光
};

const M = (color, rough = 0.8, metal = 0) => matStd(color, { roughness: rough, metalness: metal });
const box = (w, h, d, mat) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
const cyl = (rt, rb, h, mat, seg = 18) => new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
function lbl(text, color = '#ffd9a8', scale = 0.0033) {
  return makeTextSprite(text, { fontSize: 30, color, scale, bg: 'rgba(16,20,26,0.62)' });
}
const TABLE_Y = 1.08;

/* 程序化贴图基建（小画布快速出纹理） */
function canvasTex(w, h, draw, opts = {}) {
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  draw(cv.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(cv);
  if (!opts.linear) tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/* 接触阴影贴片（器材落在台面的重量感来源） */
function shadowPatch(w, d, opacity = 0.34) {
  const tex = canvasTex(256, 256, (ctx) => {
    const g = ctx.createRadialGradient(128, 128, 10, 128, 128, 126);
    g.addColorStop(0, 'rgba(16,10,6,' + opacity + ')');
    g.addColorStop(0.62, 'rgba(16,10,6,' + opacity * 0.5 + ')');
    g.addColorStop(1, 'rgba(16,10,6,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
  }, { linear: true });
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(w, d),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false })
  );
  m.rotation.x = -Math.PI / 2;
  m.renderOrder = 2;
  return m;
}

/* 圆角矩形截面沿 CatmullRom 中心线放样（C 形手柄 / 瓷管支架等造型件） */
function sweepSection(points, opts = {}) {
  const curve = new THREE.CatmullRomCurve3(points);
  const steps = opts.steps || 40;
  const w0 = opts.w ?? 0.06, d0 = opts.d ?? 0.06;
  const r = opts.r ?? Math.min(w0, d0) * 0.42;
  const frames = curve.computeFrenetFrames(steps, false);
  const wArr = Array.isArray(opts.wArr) ? opts.wArr : null;
  const dArr = Array.isArray(opts.dArr) ? opts.dArr : null;
  const ease = (x) => { const c = clamp(x, 0, 1); return c * c * (3 - 2 * c); };
  const wAt = (i) => (wArr ? lerp(wArr[0], wArr[1], ease(i / steps)) : w0);
  const dAt = (i) => (dArr ? lerp(dArr[0], dArr[1], ease(i / steps)) : d0);
  const RING = 16;   // 圆角矩形截面顶点数（四直边 + 四圆角，各圆角 3 段）
  const pos = [], idx = [];
  for (let i = 0; i <= steps; i++) {
    const p = curve.getPointAt(i / steps);
    const N = frames.normals[Math.min(i, steps - 1)];
    const B = frames.binormals[Math.min(i, steps - 1)];
    const hw = wAt(i) / 2, hd = dAt(i) / 2;
    const prof = [];
    const arc = (cx, cz, a0, a1) => {
      for (let k = 0; k <= 3; k++) {
        const a = a0 + (a1 - a0) * (k / 3);
        prof.push([cx + Math.cos(a) * r, cz + Math.sin(a) * r]);
      }
    };
    const W = Math.max(hw - r, r * 0.2), D = Math.max(hd - r, r * 0.2);
    arc(W, D, 0, Math.PI / 2);
    arc(-W, D, Math.PI / 2, Math.PI);
    arc(-W, -D, Math.PI, Math.PI * 1.5);
    arc(W, -D, Math.PI * 1.5, Math.PI * 2);
    prof.forEach(([px, pz]) => {
      pos.push(
        p.x + N.x * px + B.x * pz,
        p.y + N.y * px + B.y * pz,
        p.z + N.z * px + B.z * pz
      );
    });
  }
  for (let i = 0; i < steps; i++) {
    for (let j = 0; j < RING; j++) {
      const a = i * RING + j;
      const b = i * RING + (j + 1) % RING;
      const c = (i + 1) * RING + (j + 1) % RING;
      const d = (i + 1) * RING + j;
      idx.push(a, b, c, a, c, d);
    }
  }
  if (opts.cap !== false) {
    const ends = [curve.getPointAt(0), curve.getPointAt(1)];
    ends.forEach((cp, ei) => {
      const base = ei === 0 ? 0 : steps * RING;
      const center = pos.length / 3;
      pos.push(cp.x, cp.y, cp.z);
      for (let j = 0; j < RING; j++) {
        const a = base + j, b = base + (j + 1) % RING;
        if (ei === 0) idx.push(center, b, a);
        else idx.push(center, a, b);
      }
    });
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return new THREE.Mesh(geo, opts.mat);
}

/* 滚花旋钮（金属件工艺细节，表盘调零钉/旋钮共用） */
function knurledKnob(r, h, mat, mat2) {
  const g = new THREE.Group();
  const body = cyl(r, r * 1.06, h, mat, 16);
  g.add(body);
  const n = 14;
  for (let i = 0; i < n; i++) {
    const groove = box(r * 0.16, h * 0.92, r * 0.1, mat2 || mat);
    const a = (i / n) * TAU;
    groove.position.set(Math.cos(a) * r * 0.98, 0, Math.sin(a) * r * 0.98);
    groove.rotation.y = -a;
    g.add(groove);
  }
  const cap = cyl(r * 0.72, r * 0.72, h * 0.24, mat2 || mat, 14);
  cap.position.y = h * 0.44;
  g.add(cap);
  return g;
}

/* 同属性集索引几何拼接（本地实现，免引 BufferGeometryUtils；参照 lab-motion 先例） */
function mergeGeoms(geos) {
  const attrNames = Object.keys(geos[0].attributes).sort().join(',');
  for (const g2 of geos) {
    if (!g2.index || Object.keys(g2.attributes).sort().join(',') !== attrNames) return null;
    for (const n of Object.keys(g2.attributes)) {
      if (!(g2.attributes[n].array instanceof Float32Array)) return null;
    }
  }
  let vCount = 0, iCount = 0;
  for (const g2 of geos) { vCount += g2.attributes.position.count; iCount += g2.index.count; }
  const merged = new THREE.BufferGeometry();
  for (const n of attrNames.split(',')) {
    const itemSize = geos[0].attributes[n].itemSize;
    const arr = new Float32Array(vCount * itemSize);
    let off = 0;
    for (const g2 of geos) { arr.set(g2.attributes[n].array, off); off += g2.attributes[n].array.length; }
    merged.setAttribute(n, new THREE.BufferAttribute(arr, itemSize));
  }
  const idx = vCount > 65535 ? new Uint32Array(iCount) : new Uint16Array(iCount);
  let vo = 0, io = 0;
  for (const g2 of geos) {
    const gi = g2.index.array;
    for (let i = 0; i < gi.length; i++) idx[io + i] = gi[i] + vo;
    vo += g2.attributes.position.count;
    io += gi.length;
  }
  merged.setIndex(new THREE.BufferAttribute(idx, 1));
  return merged;
}

/* 接线柱（黄铜座 + 铜杆 + 双层旋帽，器材顶部通用轻量件；headColor 可换帽色） */
function bindingPost(h = 0.075, headColor = VP.brassHi) {
  const g = new THREE.Group();
  const base = cyl(0.02, 0.024, 0.016, M(VP.brassDeep, 0.4, 0.85), 12);
  const stem = cyl(0.008, 0.008, h, M(VP.brass, 0.35, 0.9), 10);
  stem.position.y = h / 2 + 0.01;
  const head = cyl(0.016, 0.017, 0.016, M(headColor, 0.3, headColor === VP.brassHi ? 0.9 : 0.4), 12);
  head.position.y = h + 0.024;
  const lip = new THREE.Mesh(new THREE.TorusGeometry(0.0155, 0.004, 5, 12), M(VP.brassDeep, 0.4, 0.85));
  lip.rotation.x = Math.PI / 2;
  lip.position.y = h + 0.016;
  g.add(base, stem, head, lip);
  return g;
}

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

/* ================= MNA 求解内核 ================= */

let CIR = null;   // { N, els: Map, dt }
const G_MIN = 1e-9;

function linSolve(A, b) {
  const n = b.length;
  for (let i = 0; i < n; i++) {
    let piv = i, mx = Math.abs(A[i][i]);
    for (let r = i + 1; r < n; r++) if (Math.abs(A[r][i]) > mx) { mx = Math.abs(A[r][i]); piv = r; }
    if (piv !== i) { const t = A[i]; A[i] = A[piv]; A[piv] = t; const tb = b[i]; b[i] = b[piv]; b[piv] = tb; }
    const d = A[i][i] || 1e-12;
    for (let r = i + 1; r < n; r++) {
      const f = A[r][i] / d;
      if (!f) continue;
      for (let c = i; c < n; c++) A[r][c] -= f * A[i][c];
      b[r] -= f * b[i];
    }
  }
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let s = b[i];
    for (let c = i + 1; c < n; c++) s -= A[i][c] * x[c];
    x[i] = s / (A[i][i] || 1e-12);
  }
  return x;
}

/** 一次线性求解（电压源类元件以支路电流为未知量） */
function solveOnce() {
  const els = [...CIR.els.values()];
  const N = CIR.N;
  const vsrc = els.filter((e) => e.kind === 'bat' || e.kind === 'ac' || e.kind === 'emf');
  const m = N - 1 + vsrc.length;
  const A = Array.from({ length: m }, () => new Array(m).fill(0));
  const b = new Array(m).fill(0);

  els.forEach((e) => {
    if (e.blown) return;
    const { a, b: nb } = e;
    if (e.kind === 'bat' || e.kind === 'ac' || e.kind === 'emf') {
      const off = N - 1 + vsrc.indexOf(e);
      if (a > 0) A[a - 1][off] += 1;
      if (nb > 0) A[nb - 1][off] -= 1;
      const row = off;
      if (a > 0) A[row][a - 1] += 1;
      if (nb > 0) A[row][nb - 1] -= 1;
      A[row][off] -= e.r || 0;   // v_a − v_b − I·r = E（I 为 KCL 变量，放电时为负）
      b[row] += e.E;
      return;
    }
    let g = 0, Ieq = 0;
    if (e.kind === 'cap') { g = e.C / CIR.dt; Ieq = g * (e.vc || 0); }
    else if (e.kind === 'ind') { g = CIR.dt / Math.max(e.L, 1e-6); Ieq = -(e.iL || 0); }
    else if (e.kind === 'dio' || e.kind === 'zen') { g = e.gN || G_MIN; Ieq = -(e.iEq || 0); }
    else g = 1 / Math.max(e.R, 1e-9);
    if (a > 0) { A[a - 1][a - 1] += g; if (nb > 0) A[a - 1][nb - 1] -= g; b[a - 1] += Ieq; }
    if (nb > 0) { A[nb - 1][nb - 1] += g; if (a > 0) A[nb - 1][a - 1] -= g; b[nb - 1] -= Ieq; }
  });

  const x = linSolve(A, b);
  CIR.nodeV = x; /* 节点电势（电势着色数据源） */
  els.forEach((e) => {
    const va = e.a > 0 ? x[e.a - 1] : 0;
    const vb = e.b > 0 ? x[e.b - 1] : 0;
    e.V = va - vb;
    if (e.kind === 'bat' || e.kind === 'ac' || e.kind === 'emf') {
      e.I = x[N - 1 + vsrc.indexOf(e)];
    } else if (e.kind === 'cap') {
      e.I = (e.C / CIR.dt) * (e.V - (e.vc || 0));
    } else if (e.kind === 'ind') {
      e.iL = (e.iL || 0) + (CIR.dt / Math.max(e.L, 1e-6)) * e.V;
      e.I = e.iL;
    } else if (e.kind === 'dio' || e.kind === 'zen') {
      e.I = e._i || 0;
    } else {
      e.I = e.V / Math.max(e.R, 1e-9);
    }
  });
  els.forEach((e) => { if (e.kind === 'cap') e.vc = e.V; });
}

/** 二极管 / 稳压管牛顿迭代 */
function solveCircuit() {
  if (!CIR) return;
  const els = [...CIR.els.values()];
  const hasNL = els.some((e) => e.kind === 'dio' || e.kind === 'zen');
  if (!hasNL) { solveOnce(); return; }
  els.forEach((e) => {
    if (e.kind === 'dio' && e.vd === undefined) e.vd = (e.VF || 0.7) + 0.05;
    if (e.kind === 'zen' && e.vd === undefined) e.vd = -(e.VZ || 5.1) - 0.3;
  });
  for (let it = 0; it < 24; it++) {
    els.forEach((e) => {
      if (e.kind === 'dio') {
        // 分段线性：正向 VF 门槛 + 5Ω 动态电阻；反向截止（硅管 0.7V，LED 约 1.8~3V）
        const VF = e.VF || 0.7;
        const vd = e.vd !== undefined ? e.vd : VF + 0.05;
        let g, i;
        if (vd > VF) { g = 1 / 5; i = (vd - VF) / 5; }
        else { g = G_MIN; i = 0; }
        e.gN = g; e.iEq = i - g * vd; e._i = i;
      } else if (e.kind === 'zen') {
        const VZ = e.VZ || 5.1, rs = e.rs || 6;
        const vd = e.vd || 0;
        let g, i;
        if (vd > 0.75) { g = 8; i = 8 * (vd - 0.75); }
        else if (vd > -VZ) { g = G_MIN; i = 0; }
        else { g = 1 / rs; i = (vd + VZ) / rs; }
        e.gN = g; e.iEq = i - g * vd; e._i = i;
      }
    });
    solveOnce();
    let err = 0;
    els.forEach((e) => {
      if (e.kind === 'dio' || e.kind === 'zen') {
        const stepMax = e.kind === 'zen' ? 0.5 : 0.4;
        const vn = clamp(e.V, (e.vd || 0) - stepMax, (e.vd || 0) + stepMax);
        err = Math.max(err, Math.abs(vn - (e.vd || 0)));
        e.vd = vn;
      }
    });
    if (err < 1e-4) break;
  }
}

/* ================= 3D 元件工厂 ================= */

const MATS = {
  dark: () => M(VP.panelDark, 0.6, 0.3),
  metal: () => M(VP.chrome, 0.35, 0.7),
  red: () => M(VP.lacquerRed, 0.5),
  black: () => M(VP.bakelite, 0.6),
};
let benchMat;
let lampGlowMat = null;

/* 实验台场景：程序化木纹台面 + 钢包边 + 铸铁腿 + 背墙刻度尺 + 吊灯 + 道具阵列 */
function buildBenchScene(g) {
  /* 台面木纹（程序化，板缝走横向） */
  const wood = makeWoodTexture({ base: '#7a5c38', dark: '#573d22', light: '#96754c', streaks: 110, bands: 8, seed: 41 });
  wood.repeat.set(2.6, 1.0);
  benchMat = new THREE.MeshStandardMaterial({ map: wood, roughness: 0.66, metalness: 0.04 });
  const top = box(5.9, 0.09, 1.9, benchMat);
  top.position.y = TABLE_Y - 0.045;
  g.add(top);
  /* 前后钢包边（缎面金属 + 高光倒角条） */
  const trimMat = M(VP.steelDeep, 0.42, 0.62);
  [[0, 0.955], [0, -0.955]].forEach(([x, z]) => {
    const trim = box(5.9, 0.05, 0.05, trimMat);
    trim.position.set(x, TABLE_Y - 0.055, z);
    g.add(trim);
  });
  /* 台面裙板 + 铸铁桌腿（车削收分 + 底脚垫） */
  const apron = box(5.7, 0.14, 1.72, M(VP.panelDark, 0.7, 0.2));
  apron.position.y = TABLE_Y - 0.16;
  g.add(apron);
  const legMat = M(0x2c3238, 0.55, 0.55);
  [[-2.62, 0.72], [-2.62, -0.72], [2.62, 0.72], [2.62, -0.72]].forEach(([x, z]) => {
    const leg = cyl(0.052, 0.062, TABLE_Y - 0.2, legMat, 12);
    leg.position.set(x, (TABLE_Y - 0.2) / 2, z);
    g.add(leg);
    const foot = cyl(0.07, 0.075, 0.03, M(0x1d2226, 0.7, 0.3), 12);
    foot.position.set(x, 0.015, z);
    g.add(foot);
  });
  const cross = box(5.2, 0.05, 0.05, legMat);
  cross.position.set(0, 0.24, 0);
  g.add(cross);
  const cross2 = cross.clone();
  cross2.rotation.y = Math.PI / 2;
  cross2.scale.set(1, 1, 0.27);
  cross2.position.set(0, 0.24, 0);
  g.add(cross2);
  /* 背墙 + 挂板 + 刻度标尺（CanvasTexture，cm 刻度 + 数字） */
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(24, 9), M(0x39414b, 0.95));
  wall.position.set(0, 4.4, -2.4);
  g.add(wall);
  const railMat = M(VP.panelGray, 0.5, 0.4);
  const rail = box(5.6, 0.16, 0.04, railMat);
  rail.position.set(0, 2.6, -2.32);
  g.add(rail);
  const rulerTex = canvasTex(2048, 96, (x, w, h) => {
    x.fillStyle = '#e8e2d2';
    x.fillRect(0, 0, w, h);
    x.strokeStyle = '#8a7f68'; x.lineWidth = 3;
    x.strokeRect(4, 4, w - 8, h - 8);
    x.fillStyle = '#4a4335';
    for (let i = 0; i <= 100; i++) {
      const px = 20 + (i / 100) * (w - 40);
      const tall = i % 10 === 0;
      x.fillRect(px, 16, 2, tall ? 44 : 24);
      if (tall) {
        x.font = 'bold 22px sans-serif';
        x.textAlign = 'center';
        x.fillText(String(i), px, 86);
      }
    }
    x.font = 'bold 26px sans-serif';
    x.textAlign = 'left';
    x.fillText('cm', 10, 40);
  });
  const ruler = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.12), new THREE.MeshBasicMaterial({ map: rulerTex }));
  ruler.position.set(-1.4, 2.6, -2.29);
  g.add(ruler);
  /* 顶部吊灯（灯罩车削 + 辉光球 + 锥形光域暗示） */
  const lampG = new THREE.Group();
  const cord = cyl(0.008, 0.008, 1.5, M(0x1a1e22, 0.8), 6);
  cord.position.y = 4.2;
  const shade = new THREE.Mesh(
    new THREE.LatheGeometry(
      Array.from({ length: 14 }, (_, i) => {
        const t = i / 13;
        return new THREE.Vector2(0.06 + t * 0.34, Math.sin(t * 1.35) * 0.16 - 0.02);
      }),
      20
    ),
    matCoat(0x35505a, { roughness: 0.4, metalness: 0.15, side: THREE.DoubleSide })
  );
  shade.position.y = 3.42;
  lampGlowMat = matGlow(VP.glowAmber, 0.85, { roughness: 0.4 });
  const bulbG = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 10), lampGlowMat);
  bulbG.position.y = 3.36;
  const halo = new THREE.Mesh(
    new THREE.SphereGeometry(0.13, 12, 10),
    new THREE.MeshBasicMaterial({ color: VP.glowAmber, transparent: true, opacity: 0.14, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  halo.position.y = 3.36;
  lampG.add(cord, shade, bulbG, halo);
  lampG.position.set(0.4, 0, 0.2);
  g.add(lampG);
  /* 光照 rig：主暖光 + 冷补光 + 反弹 + 半球（环境反射来自 makeStudioEnvironment） */
  g.add(new THREE.HemisphereLight(0xdfe8f2, 0x5a5248, 0.7));
  const key = new THREE.DirectionalLight(0xfff2e0, 2.0);
  key.position.set(2, 5, 3);
  g.add(key);
  const fill2 = new THREE.DirectionalLight(0xcfe0f5, 0.55);
  fill2.position.set(-3, 4, -2);
  g.add(fill2);
  const bounce = new THREE.DirectionalLight(0xffe6c8, 0.35);
  bounce.position.set(0, 2, -3);
  g.add(bounce);
  /* 道具阵列（场景叙事：元件收纳盒 / 保险丝管备用 / 螺丝刀 / 导线轴 / 笔记本） */
  buildBenchProps(g);
}

/* 台面道具阵列（两端，避开每章电路的元件落位区） */
function buildBenchProps(g) {
  /* 左端：元件收纳盒（分格 + 备用电阻/开关）+ 标签 */
  const boxG = new THREE.Group();
  const shellM = matCoat(0x3d4a52, { roughness: 0.42, metalness: 0.2 });
  const shell = box(0.62, 0.1, 0.4, shellM);
  shell.position.y = 0.05;
  boxG.add(shell);
  for (let i = 0; i < 2; i++) {
    const div = box(0.012, 0.06, 0.4, M(VP.panelDark, 0.6));
    div.position.set(-0.1 + i * 0.2, 0.08, 0);
    boxG.add(div);
  }
  for (let i = 0; i < 5; i++) {
    const rr = cyl(0.018, 0.018, 0.08, M(i % 2 ? VP.porcelain : VP.bakeliteHi, 0.6), 10);
    rr.rotation.z = Math.PI / 2;
    rr.position.set(-0.24 + (i % 3) * 0.17, 0.09, -0.1 + Math.floor(i / 3) * 0.2);
    boxG.add(rr);
  }
  const tag = new THREE.Mesh(
    new THREE.PlaneGeometry(0.3, 0.1),
    new THREE.MeshBasicMaterial({ map: makeLabelTexture(['元件备用', 'SPARE PARTS'], { accent: '#4a6e5a' }), transparent: false })
  );
  tag.position.set(0.02, 0.101, 0.05);
  tag.rotation.x = -Math.PI / 2;
  boxG.add(tag);
  boxG.add(shadowPatch(0.78, 0.55));
  boxG.position.set(-2.6, TABLE_Y, -0.62);
  boxG.rotation.y = 0.16;
  g.add(boxG);
  /* 左端后：导线轴（绕线筒 + 缠绕红导线） */
  const spool = new THREE.Group();
  const spoolM = M(VP.porcelain, 0.65);
  const core = cyl(0.028, 0.028, 0.2, spoolM, 12);
  core.rotation.z = Math.PI / 2;
  spool.add(core);
  [[-0.1], [0.1]].forEach(([x]) => {
    const flange = cyl(0.075, 0.075, 0.016, spoolM, 16);
    flange.rotation.z = Math.PI / 2;
    flange.position.x = x;
    spool.add(flange);
  });
  const windMat = M(VP.wireRed, 0.55);
  for (let i = 0; i < 9; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.048 + (i % 2) * 0.004, 0.007, 6, 18), windMat);
    ring.rotation.y = Math.PI / 2;
    ring.position.x = -0.06 + i * 0.015;
    spool.add(ring);
  }
  spool.add(shadowPatch(0.3, 0.3));
  spool.position.set(-2.55, TABLE_Y + 0.075, -0.06);
  spool.rotation.y = -0.4;
  g.add(spool);
  /* 右端：螺丝刀（杆 + 柄 + 头）+ 笔记本 + 铅笔 */
  const driver = new THREE.Group();
  const shaft = cyl(0.008, 0.008, 0.22, M(VP.chrome, 0.3, 0.85), 8);
  shaft.rotation.z = Math.PI / 2;
  const grip = cyl(0.02, 0.024, 0.13, M(VP.lacquerRed, 0.55), 12);
  grip.rotation.z = Math.PI / 2;
  grip.position.x = -0.16;
  const tip = box(0.02, 0.004, 0.004, M(VP.steelDeep, 0.4, 0.8));
  tip.position.x = 0.12;
  driver.add(shaft, grip, tip);
  driver.add(shadowPatch(0.4, 0.09));
  driver.position.set(2.62, TABLE_Y + 0.012, -0.66);
  driver.rotation.y = 0.5;
  g.add(driver);
  const noteG = new THREE.Group();
  const pages = box(0.3, 0.02, 0.22, M(0xf0ecdc, 0.85));
  pages.position.y = 0.01;
  const cover = box(0.31, 0.006, 0.23, matCoat(0x44503e, { roughness: 0.5 }));
  cover.position.y = 0.024;
  cover.rotation.z = 0.015;
  noteG.add(pages, cover);
  const pencil = cyl(0.005, 0.005, 0.16, M(VP.lacquerGreen, 0.6), 8);
  pencil.rotation.z = Math.PI / 2;
  pencil.position.set(0.02, 0.04, 0.02);
  noteG.add(pencil);
  noteG.add(shadowPatch(0.4, 0.32));
  noteG.position.set(2.55, TABLE_Y, -0.24);
  noteG.rotation.y = -0.22;
  g.add(noteG);
  /* 右端后：备用保险丝管 ×3（瓷管+双铜帽，散放） */
  for (let i = 0; i < 3; i++) {
    const fu = new THREE.Group();
    const tube = cyl(0.012, 0.012, 0.09, M(VP.porcelain, 0.4, 0.1), 10);
    tube.rotation.z = Math.PI / 2;
    fu.add(tube);
    [[-0.05], [0.05]].forEach(([x]) => {
      const cap = cyl(0.014, 0.014, 0.014, M(VP.brass, 0.35, 0.9), 10);
      cap.rotation.z = Math.PI / 2;
      cap.position.x = x;
      fu.add(cap);
    });
    fu.position.set(2.3 + i * 0.09, TABLE_Y + 0.014, -0.72 + (i % 2) * 0.05);
    fu.rotation.y = 0.8 + i * 0.6;
    g.add(fu);
  }
}

/* 电子流小珠：全回路共用一枚 InstancedMesh（draw call 1，遍历各导线更新矩阵） */
const BEAD_CAP = 96;
let beadField = null;
const _beadM = new THREE.Matrix4();
const _beadP = new THREE.Vector3();
const _beadS = new THREE.Vector3(1, 1, 1);
const _beadQ = new THREE.Quaternion();
function makeBeadField(g) {
  const geo = new THREE.SphereGeometry(0.016, 7, 5);
  const mat = new THREE.MeshBasicMaterial({ color: VP.beadFlow, transparent: true, opacity: 0.9 });
  beadField = new THREE.InstancedMesh(geo, mat, BEAD_CAP);
  beadField.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  beadField.count = BEAD_CAP;
  beadField.frustumCulled = false;
  g.add(beadField);
}
function stepBeads(wire, current, dt) {
  const u = wire.userData;
  if (!u) return;
  const speed = clamp(current * 0.5, -1.6, 1.6);
  u.phase = (u.phase + speed * dt) % 1;
  const on = Math.abs(current) > 0.015;
  const n = 6;
  for (let i = 0; i < n; i++) {
    const slot = u.slotBase + i;
    if (slot >= BEAD_CAP) break;
    if (!on) { _beadM.makeScale(0, 0, 0); beadField.setMatrixAt(slot, _beadM); continue; }
    const t = ((i / n) + u.phase + 1) % 1;
    _beadP.copy(u.curve.getPointAt(clamp(t, 0, 1)));
    _beadM.compose(_beadP, _beadQ, _beadS);
    beadField.setMatrixAt(slot, _beadM);
  }
}

const ELVIS = new Map();   // id → {grp, parts}

/* 阻值 → 色环（黑0棕1红2橙3黄4绿5蓝6紫7灰8白9 ×2；金 ±5%） */
const BAND_COLORS = [0x111111, 0x8a5a2a, 0xc23a2e, 0xd87a30, 0xd8b23a, 0x3e8a4a, 0x3a62b8, 0x8a4ab8, 0x8a8a8a, 0xf0f0f0];
function resistorBands(R) {
  const r = clamp(R, 0.1, 99_000_000);
  let e = Math.floor(Math.log10(r));
  let d2 = Math.round(r / Math.pow(10, e - 1));
  if (d2 >= 100) { d2 = Math.round(d2 / 10); e += 1; }
  const d1 = Math.floor(d2 / 10), d0 = d2 % 10;
  return [BAND_COLORS[d1], BAND_COLORS[d0], BAND_COLORS[clamp(e - 1, 0, 9)]];
}
/* 在已建 res 元件上换色环（交互可视反馈：调阻值色环同步变） */
function setResBands(id, R) {
  const rec = ELVIS.get(id);
  if (!rec || !rec.parts.bands) return;
  const cols = resistorBands(R);
  rec.parts.bands.forEach((band, i) => band.material.color.setHex(cols[i] ?? 0xc9a227));
}

function addElement(g, spec) {
  const grp = new THREE.Group();
  const parts = {};
  const { t, x, z, label } = spec;
  switch (t) {
    case 'bat': {
      /* 电池组：漆绿 clearcoat 底座 + 双电池（钢壳+凸极帽）+ 串联铜片 + 顶面接线柱 */
      const baseM = matCoat(VP.lacquerGreen, { roughness: 0.36, metalness: 0.1 });
      const base = box(0.56, 0.07, 0.3, baseM);
      base.position.y = 0.035;
      grp.add(base);
      const cellM = M(VP.chrome, 0.32, 0.82);
      [-0.14, 0.13].forEach((cx) => {
        const cell = cyl(0.062, 0.062, 0.21, cellM, 16);
        cell.rotation.z = Math.PI / 2;
        cell.position.set(cx, 0.125, 0);
        grp.add(cell);
        const nub = cyl(0.02, 0.02, 0.014, M(VP.brassHi, 0.3, 0.9), 10);
        nub.rotation.z = Math.PI / 2;
        nub.position.set(cx + 0.112, 0.125, 0);
        grp.add(nub);
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.062, 0.004, 6, 18), M(VP.steelDeep, 0.4, 0.7));
        ring.rotation.y = Math.PI / 2;
        ring.position.set(cx - 0.06, 0.125, 0);
        grp.add(ring);
      });
      const link = box(0.05, 0.016, 0.03, M(VP.copper, 0.4, 0.85));
      link.position.set(-0.015, 0.125, 0);
      grp.add(link);
      const p1 = bindingPost(); p1.position.set(-0.22, 0.07, 0.1); grp.add(p1);
      const p2 = bindingPost(0.075, 0xc23a2e); p2.position.set(0.22, 0.07, 0.1);
      grp.add(p2);
      break;
    }
    case 'sw': {
      /* 刀开关：瓷底座 + 铜触点铆钉 + 胶木手柄（圆头杠杆）+ 滚花钮 */
      const base = box(0.44, 0.055, 0.24, M(VP.porcelain, 0.72, 0.04));
      base.position.y = 0.03;
      const baseLip = box(0.47, 0.02, 0.26, M(VP.porcelainDeep, 0.7, 0.04));
      baseLip.position.y = 0.012;
      grp.add(base, baseLip);
      [[-0.15], [0.15]].forEach(([px]) => {
        const stud = new THREE.Mesh(new THREE.SphereGeometry(0.02, 10, 8), M(VP.brass, 0.35, 0.9));
        stud.position.set(px, 0.062, 0);
        grp.add(stud);
      });
      const lever = new THREE.Group();
      const armGeo = mergeGeoms([
        new THREE.BoxGeometry(0.3, 0.026, 0.03).translate(0.15, 0, 0),
        new THREE.SphereGeometry(0.018, 10, 8).translate(0.005, 0, 0),
        new THREE.SphereGeometry(0.016, 10, 8).translate(0.3, 0, 0),
      ]);
      const arm = new THREE.Mesh(armGeo, matCoat(VP.bakelite, { roughness: 0.42, metalness: 0.05 }));
      const knob = cyl(0.024, 0.026, 0.035, M(VP.lacquerRedHi, 0.45), 12);
      knob.rotation.x = Math.PI / 2;
      knob.position.x = 0.3;
      lever.add(arm, knob);
      lever.position.set(-0.15, 0.075, 0);
      grp.add(lever);
      parts.lever = lever;
      break;
    }
    case 'bulb': {
      /* 小灯泡：Lathe 玻壳 + 双撑杆螺旋灯丝 + 黄铜螺口三道螺纹 + 瓷灯座 */
      const stand = new THREE.Mesh(
        new THREE.LatheGeometry([
          [0.0, 0], [0.115, 0], [0.115, 0.018], [0.085, 0.03], [0.05, 0.05], [0.045, 0.09], [0.052, 0.12], [0.05, 0.135], [0.0, 0.135],
        ].map(([r, y]) => new THREE.Vector2(r, y)), 18),
        M(VP.porcelain, 0.62, 0.04)
      );
      grp.add(stand);
      [[-0.028], [0.028]].forEach(([px]) => {
        const post = cyl(0.005, 0.005, 0.1, M(VP.brassDeep, 0.4, 0.85), 6);
        post.position.set(px, 0.18, 0);
        grp.add(post);
      });
      /* 螺旋灯丝：绕 3 圈的细管 */
      const filPts = [];
      for (let i = 0; i <= 36; i++) {
        const a = (i / 36) * TAU * 2.6;
        filPts.push(V3(Math.cos(a) * 0.02, 0.16 + i * 0.0032, Math.sin(a) * 0.02));
      }
      const filament = new THREE.Mesh(
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(filPts), 44, 0.0035, 5),
        new THREE.MeshStandardMaterial({ color: VP.filamentHot, emissive: VP.glowAmber, emissiveIntensity: 0, roughness: 0.5 })
      );
      filament.position.y = 0;
      grp.add(filament);
      parts.filament = filament;
      const threadM = M(VP.brass, 0.36, 0.88);
      for (let i = 0; i < 3; i++) {
        const th = new THREE.Mesh(new THREE.TorusGeometry(0.052, 0.009, 6, 18), threadM);
        th.rotation.x = Math.PI / 2;
        th.position.y = 0.205 + i * 0.021;
        grp.add(th);
      }
      const collar = cyl(0.054, 0.05, 0.03, threadM, 16);
      collar.position.y = 0.196;
      grp.add(collar);
      const tipDot = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 6), M(VP.brassHi, 0.3, 0.9));
      tipDot.position.y = 0.183;
      grp.add(tipDot);
      const glassProfile = [
        [0.052, 0.2], [0.078, 0.24], [0.093, 0.3], [0.09, 0.37], [0.07, 0.42], [0.04, 0.445], [0.012, 0.452], [0.0, 0.452],
      ].map(([r, y]) => new THREE.Vector2(r, y));
      const glass = new THREE.Mesh(
        new THREE.LatheGeometry(glassProfile, 20),
        matCoat(0xa8c4d4, { roughness: 0.06, metalness: 0, opacity: 0.17, side: THREE.DoubleSide, depthWrite: false })
      );
      parts.glass = glass;
      grp.add(glass);
      const core = new THREE.Mesh(new THREE.SphereGeometry(0.038, 10, 8),
        new THREE.MeshStandardMaterial({ color: VP.bulbWarm, emissive: VP.glowAmber, emissiveIntensity: 0, transparent: true, opacity: 0.95 }));
      core.position.y = 0.3;
      grp.add(core);
      parts.core = core;
      break;
    }
    case 'gauge': {
      /* 车削仪表：胶木壳 + 高密度表盘 + 玻璃面 + 配重指针 + 调零钉 */
      const shellM = matCoat(VP.bakelite, { roughness: 0.42, metalness: 0.08 });
      const shell = new THREE.Mesh(
        new THREE.LatheGeometry([
          [0.0, 0], [0.15, 0], [0.165, 0.02], [0.165, 0.14], [0.15, 0.165], [0.128, 0.185], [0.0, 0.185],
        ].map(([r, y]) => new THREE.Vector2(r, y)), 22),
        shellM
      );
      shell.rotation.x = Math.PI / 2;
      shell.position.y = 0.1;
      grp.add(shell);
      const bezel = new THREE.Mesh(new THREE.TorusGeometry(0.146, 0.008, 6, 24), M(VP.chrome, 0.3, 0.8));
      bezel.position.set(0, 0.1, 0.176);
      grp.add(bezel);
      const dial = makeDial(spec.sub || 'A', spec.range || '');
      const face = new THREE.Mesh(new THREE.CircleGeometry(0.138, 28), new THREE.MeshBasicMaterial({ map: dial.tex }));
      face.position.set(0, 0.1, 0.162);
      grp.add(face);
      const glass = new THREE.Mesh(new THREE.CircleGeometry(0.14, 24),
        new THREE.MeshPhysicalMaterial({ color: 0xdfeaf2, roughness: 0.06, metalness: 0, transparent: true, opacity: 0.16, depthWrite: false }));
      glass.position.set(0, 0.1, 0.178);
      grp.add(glass);
      const needle = new THREE.Group();
      const nGeo = mergeGeoms([
        new THREE.BoxGeometry(0.01, 0.115, 0.006).translate(0, 0.055, 0),
        new THREE.BoxGeometry(0.024, 0.03, 0.006).translate(0, -0.012, 0),
        new THREE.CylinderGeometry(0.011, 0.011, 0.008, 10).rotateX(Math.PI / 2).translate(0, 0, 0),
      ]);
      const nbar = new THREE.Mesh(nGeo, M(VP.lacquerRedHi, 0.4));
      needle.add(nbar);
      needle.position.set(0, 0.1, 0.168);
      needle.rotation.z = Math.PI * 0.78;
      grp.add(needle);
      parts.needle = needle;
      const zero = knurledKnob(0.014, 0.014, M(VP.brassHi, 0.35, 0.85), M(VP.brassDeep, 0.5, 0.8));
      zero.position.set(0.1, 0.1, 0.13);
      zero.rotation.x = Math.PI / 2;
      grp.add(zero);
      [[-0.1, -0.07], [0.1, -0.07]].forEach(([px, pz]) => {
        const post = bindingPost(0.05);
        post.position.set(px, 0.005, pz);
        grp.add(post);
      });
      break;
    }
    case 'rheo': {
      /* 滑动变阻器：瓷管 + 螺旋密绕电阻丝 + 顶部铬滑轨 + 绝缘手柄滑块 + 三端子 */
      const base = box(0.62, 0.05, 0.2, M(VP.panelDark, 0.55, 0.35));
      base.position.y = 0.03;
      grp.add(base);
      [[-0.27], [0.27]].forEach(([px]) => {
        const foot = box(0.05, 0.024, 0.18, M(VP.steelDeep, 0.5, 0.5));
        foot.position.set(px, 0.012, 0);
        grp.add(foot);
      });
      const tube = cyl(0.045, 0.045, 0.46, M(VP.porcelain, 0.85, 0.02), 14);
      tube.rotation.z = Math.PI / 2;
      tube.position.y = 0.135;
      grp.add(tube);
      const windPts = [];
      for (let i = 0; i <= 120; i++) {
        const u = i / 120;
        windPts.push(V3(-0.215 + u * 0.43, 0.135 + Math.cos(u * TAU * 26) * 0.048, Math.sin(u * TAU * 26) * 0.048));
      }
      const winding = new THREE.Mesh(
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(windPts), 260, 0.0062, 5),
        M(VP.copper, 0.45, 0.7)
      );
      grp.add(winding);
      const rail = cyl(0.012, 0.012, 0.5, M(VP.chrome, 0.28, 0.85), 10);
      rail.rotation.z = Math.PI / 2;
      rail.position.y = 0.235;
      grp.add(rail);
      [[-0.25], [0.25]].forEach(([px]) => {
        const endPlate = cyl(0.062, 0.062, 0.018, M(VP.porcelain, 0.8, 0.03), 16);
        endPlate.rotation.z = Math.PI / 2;
        endPlate.position.set(px, 0.135, 0);
        grp.add(endPlate);
        const post = bindingPost(0.055);
        post.position.set(px, 0.05, 0);
        grp.add(post);
      });
      const slider = new THREE.Group();
      const block = box(0.05, 0.045, 0.07, M(VP.brassDeep, 0.42, 0.8));
      block.position.y = 0.212;
      const grip = cyl(0.016, 0.02, 0.07, matCoat(VP.bakelite, { roughness: 0.45 }), 10);
      grip.position.y = 0.27;
      const knob = cyl(0.032, 0.036, 0.026, M(VP.lacquerRedHi, 0.42), 12);
      knob.rotation.x = Math.PI / 2;
      knob.position.y = 0.318;
      slider.add(block, grip, knob);
      slider.position.x = 0.15;
      grp.add(slider);
      parts.slider = slider;
      break;
    }
    case 'res': {
      /* 定值电阻：瓷芯圆柱 + 真实色环（随 R 变）+ 轴向引线 */
      const body = cyl(0.042, 0.042, 0.22, M(VP.porcelainDeep, 0.6, 0.05), 14);
      body.rotation.z = Math.PI / 2;
      body.position.y = 0.09;
      grp.add(body);
      const capL = cyl(0.044, 0.044, 0.014, M(VP.brassDeep, 0.4, 0.85), 14);
      capL.rotation.z = Math.PI / 2;
      capL.position.set(-0.115, 0.09, 0);
      const capR = capL.clone();
      capR.position.x = 0.115;
      grp.add(capL, capR);
      const bands = [];
      [[-0.07], [-0.025], [0.02]].forEach(([dx], i) => {
        const band = cyl(0.046, 0.046, 0.022, M(BAND_COLORS[1], 0.5), 14);
        band.rotation.z = Math.PI / 2;
        band.position.set(dx, 0.09, 0);
        grp.add(band);
        bands.push(band);
      });
      parts.bands = bands;
      [[-0.14], [0.14]].forEach(([dx]) => {
        const lead = cyl(0.005, 0.005, 0.09, M(VP.chrome, 0.35, 0.8), 6);
        lead.rotation.z = Math.PI / 2;
        lead.position.set(dx + 0.04, 0.09, 0);
        grp.add(lead);
      });
      break;
    }
    case 'cap': {
      /* 电解电容：铝壳 + 塑套负极条贴图 + 顶盖十字防爆痕 + 双引脚 */
      const sleeveTex = canvasTex(256, 128, (cv, w, h) => {
        cv.fillStyle = '#2a4152';
        cv.fillRect(0, 0, w, h);
        cv.fillStyle = '#d8d3c4';
        cv.fillRect(0, 0, w * 0.3, h);
        cv.fillStyle = '#1a2830';
        cv.font = 'bold 34px sans-serif';
        cv.textAlign = 'center';
        for (let i = 0; i < 3; i++) cv.fillText('−', w * 0.07, 42 + i * 34);
        cv.fillStyle = '#dce6ee';
        cv.font = 'bold 26px sans-serif';
        cv.textAlign = 'left';
        cv.fillText('470µF 16V', w * 0.34, 58);
        cv.font = '18px sans-serif';
        cv.fillText('＋ →', w * 0.34, 92);
      });
      sleeveTex.wrapS = THREE.RepeatWrapping;
      const sleeve = new THREE.Mesh(
        new THREE.CylinderGeometry(0.058, 0.058, 0.2, 18, 1, true),
        new THREE.MeshStandardMaterial({ map: sleeveTex, roughness: 0.55, metalness: 0.15 })
      );
      sleeve.position.y = 0.11;
      grp.add(sleeve);
      const shellTop = cyl(0.058, 0.058, 0.012, M(VP.chrome, 0.3, 0.85), 18);
      shellTop.position.y = 0.216;
      grp.add(shellTop);
      const mark1 = box(0.07, 0.003, 0.006, M(VP.steelDeep, 0.4, 0.6));
      mark1.position.y = 0.223;
      const mark2 = mark1.clone();
      mark2.rotation.y = Math.PI / 2;
      grp.add(mark1, mark2);
      [[-0.02], [0.02]].forEach(([px]) => {
        const pin = cyl(0.005, 0.005, 0.05, M(VP.chrome, 0.35, 0.8), 6);
        pin.position.set(px, 0.02, 0);
        grp.add(pin);
      });
      break;
    }
    case 'ind': {
      /* 电感线圈：硅钢叠片铁芯（薄板堆）+ 骨架端板 + 双层漆包螺旋绕组 */
      const steelM = M(VP.steelDeep, 0.45, 0.7);
      const coreMid = box(0.3, 0.12, 0.11, steelM);
      coreMid.position.y = 0.075;
      grp.add(coreMid);
      for (let i = 0; i < 7; i++) {
        const lam = box(0.302, 0.014, 0.112, M(i % 2 ? VP.steelDeep : 0x646c74, 0.4, 0.72));
        lam.position.y = 0.022 + i * 0.0155;
        grp.add(lam);
      }
      [[-0.14], [0.14]].forEach(([px]) => {
        const plate = cyl(0.072, 0.072, 0.014, M(VP.porcelain, 0.8, 0.03), 16);
        plate.rotation.z = Math.PI / 2;
        plate.position.set(px, 0.135, 0);
        grp.add(plate);
      });
      const coilPts1 = [], coilPts2 = [];
      for (let i = 0; i <= 90; i++) {
        const u = i / 90;
        coilPts1.push(V3(-0.125 + u * 0.25, 0.135 + Math.cos(u * TAU * 17) * 0.055, Math.sin(u * TAU * 17) * 0.055));
        coilPts2.push(V3(-0.12 + u * 0.24, 0.135 + Math.cos(u * TAU * 17 + 0.4) * 0.062, Math.sin(u * TAU * 17 + 0.4) * 0.062));
      }
      const w1 = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(coilPts1), 190, 0.006, 5), M(VP.copper, 0.45, 0.7));
      const w2 = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(coilPts2), 190, 0.006, 5), M(VP.copperHi, 0.45, 0.7));
      grp.add(w1, w2);
      break;
    }
    case 'dio':
    case 'led': {
      if (t === 'dio') {
        /* 玻壳二极管：透明轴向玻壳 + 内部结区双色带 + 负极色环 + 引线 */
        const shell = new THREE.Mesh(
          new THREE.CylinderGeometry(0.026, 0.026, 0.13, 14, 1, true),
          new THREE.MeshPhysicalMaterial({ color: 0xe8eef2, roughness: 0.08, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false })
        );
        shell.rotation.z = Math.PI / 2;
        shell.position.y = 0.075;
        grp.add(shell);
        const capLs = new THREE.Mesh(new THREE.SphereGeometry(0.026, 12, 10, 0, TAU, 0, Math.PI / 2), M(VP.steelDeep, 0.4, 0.7));
        capLs.rotation.z = Math.PI / 2;
        capLs.position.set(-0.065, 0.075, 0);
        const capRs = capLs.clone();
        capRs.rotation.z = -Math.PI / 2;
        capRs.position.x = 0.065;
        grp.add(capLs, capRs);
        const junction = cyl(0.02, 0.02, 0.05, M(0x3a3f46, 0.5, 0.4), 10);
        junction.rotation.z = Math.PI / 2;
        junction.position.set(-0.012, 0.075, 0);
        const jband = cyl(0.021, 0.021, 0.012, M(VP.copperHi, 0.4, 0.7), 10);
        jband.rotation.z = Math.PI / 2;
        jband.position.set(0.018, 0.075, 0);
        grp.add(junction, jband);
        const ringM = cyl(0.028, 0.028, 0.012, M(0x181c20, 0.5), 12);
        ringM.rotation.z = Math.PI / 2;
        ringM.position.set(0.042, 0.075, 0);
        grp.add(ringM);
      } else {
        /* LED：半球头 + 内芯辉点 + 长阳短阴双引脚 */
        const bodyM = M(0xc24334, 0.35, 0.05);
        const dome = new THREE.Mesh(new THREE.SphereGeometry(0.032, 14, 10, 0, TAU, 0, Math.PI / 2), bodyM);
        dome.position.y = 0.075;
        const cylBody = cyl(0.032, 0.032, 0.05, bodyM, 14);
        cylBody.position.y = 0.05;
        grp.add(dome, cylBody);
        const flange = cyl(0.04, 0.04, 0.008, M(0x9e3328, 0.45, 0.05), 14);
        flange.position.y = 0.024;
        grp.add(flange);
        const inner = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 6),
          matGlow(0xff5a3a, 0.25, { roughness: 0.4 }));
        inner.position.y = 0.085;
        grp.add(inner);
        parts.innerGlow = inner;
        [[-0.012, 0.05], [0.012, 0.038]].forEach(([px, ph]) => {
          const pin = box(0.006, ph, 0.006, M(VP.chrome, 0.35, 0.8));
          pin.position.set(px, ph / 2, 0);
          grp.add(pin);
        });
      }
      break;
    }
    case 'motor': {
      /* 直流电动机：散热筋壳 + 双端盖 + 出轴皮带轮 + 换向器碳刷 + 底脚 */
      const shellM = M(VP.panelGray, 0.42, 0.6);
      const shell = cyl(0.092, 0.092, 0.2, shellM, 20);
      shell.rotation.x = Math.PI / 2;
      shell.position.y = 0.115;
      grp.add(shell);
      const finGeos = [];
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * TAU;
        const fin = new THREE.BoxGeometry(0.012, 0.026, 0.2);
        fin.rotateZ(a);
        fin.translate(Math.cos(a) * 0.098, Math.sin(a) * 0.098, 0);
        finGeos.push(fin);
      }
      const finsMesh = new THREE.Mesh(mergeGeoms(finGeos), shellM);
      finsMesh.position.set(0, 0.115, 0);
      grp.add(finsMesh);
      [[-0.1], [0.1]].forEach(([pz]) => {
        const cap = cyl(0.096, 0.096, 0.02, M(VP.panelDark, 0.45, 0.55), 20);
        cap.rotation.x = Math.PI / 2;
        cap.position.set(0, 0.115, pz);
        grp.add(cap);
        for (let k = 0; k < 4; k++) {
          const a = (k / 4) * TAU + Math.PI / 4;
          const bolt = cyl(0.006, 0.006, 0.024, M(VP.chrome, 0.3, 0.85), 6);
          bolt.rotation.x = Math.PI / 2;
          bolt.position.set(Math.cos(a) * 0.072, 0.115 + Math.sin(a) * 0.072, pz);
          grp.add(bolt);
        }
      });
      const brushBox = box(0.03, 0.045, 0.035, M(VP.bakeliteHi, 0.55));
      brushBox.position.set(0.1, 0.115, 0.02);
      grp.add(brushBox);
      const rotor = new THREE.Group();
      const axle = cyl(0.011, 0.011, 0.22, M(VP.chrome, 0.28, 0.85), 8);
      axle.rotation.x = Math.PI / 2;
      rotor.add(axle);
      const pulley = cyl(0.045, 0.045, 0.03, M(VP.brassDeep, 0.4, 0.8), 16);
      pulley.rotation.x = Math.PI / 2;
      pulley.position.z = 0.075;
      rotor.add(pulley);
      const pulleyGroove = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.007, 6, 16), M(VP.steelDeep, 0.45, 0.7));
      pulleyGroove.position.z = 0.075;
      rotor.add(pulleyGroove);
      const comm = cyl(0.03, 0.03, 0.05, M(VP.copper, 0.4, 0.75), 12);
      comm.rotation.x = Math.PI / 2;
      comm.position.z = -0.06;
      rotor.add(comm);
      rotor.position.set(0, 0.115, 0.02);
      grp.add(rotor);
      parts.rotor = rotor;
      [[-0.07], [0.07]].forEach(([px]) => {
        const mount = box(0.05, 0.02, 0.1, M(VP.panelDark, 0.55, 0.4));
        mount.position.set(px, 0.015, 0);
        grp.add(mount);
      });
      break;
    }
    case 'fuse': {
      /* 熔断器：双滚花铜帽 + 瓷管 + 观察窗 + 内部熔丝（熔断动画）+ 支架 */
      const clipL = box(0.05, 0.075, 0.055, M(VP.brassDeep, 0.4, 0.8));
      clipL.position.set(-0.16, 0.04, 0);
      const clipR = clipL.clone();
      clipR.position.x = 0.16;
      grp.add(clipL, clipR);
      const tubeM = new THREE.MeshPhysicalMaterial({ color: 0xe8e4da, roughness: 0.3, metalness: 0.05, transparent: true, opacity: 0.42, depthWrite: false });
      const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.26, 14), tubeM);
      tube.rotation.z = Math.PI / 2;
      tube.position.y = 0.082;
      grp.add(tube);
      [[-0.135], [0.135]].forEach(([px]) => {
        const cap = knurledKnob(0.024, 0.03, M(VP.brass, 0.35, 0.9), M(VP.brassHi, 0.3, 0.9));
        cap.rotation.z = Math.PI / 2;
        cap.position.set(px, 0.082, 0);
        grp.add(cap);
      });
      const fwMat = new THREE.MeshStandardMaterial({ color: 0xc9a24a, roughness: 0.5, metalness: 0.4 });
      const fw = new THREE.Mesh(mergeGeoms([
        new THREE.BoxGeometry(0.1, 0.006, 0.006).translate(-0.09, 0, 0),
        new THREE.BoxGeometry(0.1, 0.006, 0.006).translate(0.09, 0, 0),
        new THREE.CylinderGeometry(0.005, 0.005, 0.085, 6).rotateZ(Math.PI / 2).translate(0, 0, 0),
      ]), fwMat);
      fw.position.y = 0.082;
      grp.add(fw);
      parts.wire = fw;
      break;
    }
    case 'solar': {
      /* 光伏板：铝框 + 电池片格纹贴图（栅线+高光）+ 背板接线盒 + 倾角支轴 */
      const stand = box(0.3, 0.02, 0.16, M(VP.panelDark, 0.55, 0.4));
      stand.position.y = 0.01;
      const pivot = cyl(0.014, 0.014, 0.42, M(VP.chrome, 0.3, 0.85), 8);
      pivot.rotation.z = Math.PI / 2;
      pivot.position.y = 0.1;
      grp.add(stand, pivot);
      const frameG = new THREE.Group();
      const frameM = M(VP.chrome, 0.35, 0.8);
      const pw = 0.44, ph2 = 0.28;
      const cellTex = canvasTex(512, 320, (cv, w, h) => {
        const grad = cv.createLinearGradient(0, 0, w, h);
        grad.addColorStop(0, '#17335e');
        grad.addColorStop(0.5, '#0f2445');
        grad.addColorStop(1, '#1a3f6e');
        cv.fillStyle = grad;
        cv.fillRect(0, 0, w, h);
        const cols = 6, rows = 4;
        const cw = (w - 16) / cols, ch = (h - 16) / rows;
        for (let i = 0; i < cols; i++) {
          for (let j = 0; j < rows; j++) {
            const x0 = 8 + i * cw, y0 = 8 + j * ch;
            cv.strokeStyle = 'rgba(190,215,240,0.5)';
            cv.lineWidth = 2;
            cv.strokeRect(x0 + 2, y0 + 2, cw - 4, ch - 4);
            cv.strokeStyle = 'rgba(190,220,245,0.28)';
            cv.lineWidth = 1;
            for (let k = 1; k < 4; k++) {
              cv.beginPath();
              cv.moveTo(x0 + 2 + (k / 4) * (cw - 4), y0 + 2);
              cv.lineTo(x0 + 2 + (k / 4) * (cw - 4), y0 + ch - 2);
              cv.stroke();
            }
            cv.strokeStyle = 'rgba(210,230,250,0.45)';
            cv.beginPath();
            cv.moveTo(x0 + 2, y0 + ch / 2);
            cv.lineTo(x0 + cw - 2, y0 + ch / 2);
            cv.stroke();
          }
        }
        cv.fillStyle = 'rgba(255,255,255,0.1)';
        cv.beginPath();
        cv.moveTo(w * 0.6, 0); cv.lineTo(w, h * 0.55); cv.lineTo(w, h * 0.8); cv.lineTo(w * 0.35, 0);
        cv.closePath();
        cv.fill();
      });
      const panelMat = new THREE.MeshStandardMaterial({ map: cellTex, roughness: 0.24, metalness: 0.35 });
      const panel = new THREE.Mesh(new THREE.BoxGeometry(pw, ph2, 0.016), panelMat);
      panel.position.y = 0.16;
      frameG.add(panel);
      const jbox = box(0.09, 0.05, 0.03, M(0xe8e2d4, 0.6));
      jbox.position.set(0.1, 0.09, -0.012);
      frameG.add(jbox);
      frameG.rotation.x = -0.35;
      frameG.position.y = 0.1;
      grp.add(frameG);
      parts.panel = frameG;
      break;
    }
    case 'mag': {
      /* 电磁铁：骨架管 + 双层密绕漆包线圈 + 可见铁芯 + 接线柱 + 大头针堆 */
      const bobbin = cyl(0.05, 0.05, 0.22, M(VP.bakelite, 0.55), 14);
      bobbin.position.y = 0.16;
      grp.add(bobbin);
      const flange1 = cyl(0.075, 0.075, 0.012, M(VP.bakeliteHi, 0.6), 16);
      flange1.position.y = 0.055;
      const flange2 = flange1.clone();
      flange2.position.y = 0.27;
      grp.add(flange1, flange2);
      const coilPts = [];
      for (let i = 0; i <= 150; i++) {
        const u = i / 150;
        coilPts.push(V3(Math.cos(u * TAU * 34) * 0.062, 0.06 + u * 0.21, Math.sin(u * TAU * 34) * 0.062));
      }
      const coil = new THREE.Mesh(
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(coilPts), 330, 0.005, 5),
        M(VP.copper, 0.45, 0.7)
      );
      grp.add(coil);
      const core = cyl(0.043, 0.043, 0.34, M(VP.chrome, 0.35, 0.8), 14);
      core.position.y = 0.2;
      grp.add(core);
      parts.core = core;
      const base = box(0.2, 0.016, 0.12, M(VP.panelDark, 0.6, 0.3));
      base.position.y = 0.008;
      grp.add(base);
      [[-0.07], [0.07]].forEach(([px]) => {
        const post = bindingPost(0.05);
        post.position.set(px, 0.016, 0.03);
        grp.add(post);
      });
      const nails = [];
      const nailMat = M(VP.chrome, 0.32, 0.85);
      for (let i = 0; i < 6; i++) {
        const nail = new THREE.Mesh(mergeGeoms([
          new THREE.CylinderGeometry(0.005, 0.008, 0.13, 6),
          new THREE.CylinderGeometry(0.011, 0.011, 0.008, 8).translate(0, 0.068, 0),
        ]), nailMat);
        nail.rotation.z = Math.PI / 2;
        nail.position.set(0.12, 0.06, 0);
        grp.add(nail);
        nails.push(nail);
      }
      parts.nails = nails;
      break;
    }
    case 'lamp': {
      /* 路灯：车削锥底座 + 锥形杆 + 弧形弯管放样 + 铝灯罩 + 玻璃泡 */
      const base = new THREE.Mesh(
        new THREE.LatheGeometry([
          [0.0, 0], [0.075, 0], [0.06, 0.03], [0.035, 0.06], [0.03, 0.09], [0.0, 0.09],
        ].map(([r, y]) => new THREE.Vector2(r, y)), 16),
        M(VP.panelDark, 0.5, 0.5)
      );
      grp.add(base);
      const pole = cyl(0.018, 0.026, 0.52, M(VP.panelGray, 0.45, 0.55), 12);
      pole.position.y = 0.36;
      grp.add(pole);
      const armPts = [V3(0, 0.6, 0), V3(0.08, 0.635, 0), V3(0.17, 0.62, 0), V3(0.22, 0.575, 0)];
      const arm = new THREE.Mesh(
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(armPts), 24, 0.014, 8),
        M(VP.panelGray, 0.45, 0.55)
      );
      grp.add(arm);
      const shade = new THREE.Mesh(
        new THREE.LatheGeometry([
          [0.0, 0], [0.06, 0.005], [0.1, 0.03], [0.115, 0.06], [0.1, 0.075], [0.04, 0.082], [0.0, 0.084],
        ].map(([r, y]) => new THREE.Vector2(r, y)), 18),
        matCoat(0x8fa0ac, { roughness: 0.38, metalness: 0.3, side: THREE.DoubleSide })
      );
      shade.position.set(0.22, 0.56, 0);
      grp.add(shade);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 10),
        new THREE.MeshStandardMaterial({ color: 0xfff2cc, emissive: VP.glowAmber, emissiveIntensity: 0, transparent: true, opacity: 0.9 }));
      bulb.position.set(0.22, 0.515, 0);
      grp.add(bulb);
      parts.bulb = bulb;
      const halo = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 10),
        new THREE.MeshBasicMaterial({ color: VP.glowAmber, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
      halo.position.copy(bulb.position);
      grp.add(halo);
      parts.lampHalo = halo;
      break;
    }
    case 'thermo': {
      /* 焦耳烧瓶：Lathe 玻璃瓶 + 煤油 + 瓶塞 + 温度计（刻度贴图 + 升降红柱）+ 加热电阻丝 */
      const flask = new THREE.Mesh(
        new THREE.LatheGeometry([
          [0.0, 0], [0.052, 0], [0.078, 0.03], [0.084, 0.1], [0.075, 0.16], [0.045, 0.185], [0.038, 0.2], [0.0, 0.2],
        ].map(([r, y]) => new THREE.Vector2(r, y)), 20),
        matCoat(0xdfeaf0, { roughness: 0.1, metalness: 0, opacity: 0.3, side: THREE.DoubleSide, depthWrite: false })
      );
      grp.add(flask);
      const oil = cyl(0.07, 0.06, 0.1, M(VP.kerosene, 0.35, 0), 18);
      oil.position.y = 0.075;
      grp.add(oil);
      const oilTop = cyl(0.07, 0.07, 0.004, M(VP.keroseneHi, 0.25, 0), 18);
      oilTop.position.y = 0.126;
      grp.add(oilTop);
      const coilPts = [];
      for (let i = 0; i <= 48; i++) {
        const u = i / 48;
        coilPts.push(V3(Math.cos(u * TAU * 5) * 0.032, 0.03 + u * 0.07, Math.sin(u * TAU * 5) * 0.032));
      }
      const heater = new THREE.Mesh(
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(coilPts), 100, 0.005, 5),
        new THREE.MeshStandardMaterial({ color: VP.copperHi, emissive: 0xd84a20, emissiveIntensity: 0, roughness: 0.45, metalness: 0.6 })
      );
      grp.add(heater);
      parts.heater = heater;
      const cork = cyl(0.034, 0.04, 0.05, M(0xc9a870, 0.8, 0.02), 14);
      cork.position.y = 0.222;
      grp.add(cork);
      const tmPlate = new THREE.Mesh(
        new THREE.BoxGeometry(0.026, 0.3, 0.008),
        new THREE.MeshStandardMaterial({ color: 0xf2eee2, roughness: 0.7 })
      );
      tmPlate.position.set(0.012, 0.3, 0.024);
      grp.add(tmPlate);
      const tmTex = canvasTex(48, 512, (cv, w, h) => {
        cv.fillStyle = 'rgba(0,0,0,0)';
        cv.clearRect(0, 0, w, h);
        for (let i = 0; i <= 20; i++) {
          const y = h - 30 - i * (h - 60) / 20;
          cv.fillStyle = '#3a3a3a';
          cv.fillRect(4, y, i % 5 === 0 ? 18 : 10, 2);
          if (i % 5 === 0) {
            cv.font = 'bold 13px sans-serif';
            cv.fillText(String(25 + i), 24, y + 5);
          }
        }
        cv.fillStyle = '#c23a2e';
        cv.fillRect(12, 40, 4, h - 80);
      }, { linear: true });
      const tmScale = new THREE.Mesh(new THREE.PlaneGeometry(0.02, 0.22), new THREE.MeshBasicMaterial({ map: tmTex, transparent: true }));
      tmScale.position.set(0.012, 0.3, 0.029);
      grp.add(tmScale);
      const col = box(0.008, 0.16, 0.006, M(0xd84a30, 0.35));
      col.geometry.translate(0, 0.08, 0);
      col.position.set(0.012, 0.155, 0.026);
      grp.add(col);
      parts.col = col;
      break;
    }
    case 'mm': {
      /* 多用电表：奶黄漆壳（MF 型）+ 复合表盘 + 玻璃 + 档位旋钮 + 表笔插孔 */
      const bodyM = matCoat(0xdcae46, { roughness: 0.4, metalness: 0.05 });
      const lower = box(0.46, 0.16, 0.28, bodyM);
      lower.position.y = 0.08;
      const slope = box(0.46, 0.16, 0.02, bodyM);
      slope.position.set(0, 0.24, 0.11);
      slope.rotation.x = -0.5;
      const back = box(0.44, 0.2, 0.02, M(VP.bakelite, 0.5));
      back.position.set(0, 0.16, -0.13);
      grp.add(lower, slope, back);
      const dial = makeDial('Ω', '', true);
      const face = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.22), new THREE.MeshBasicMaterial({ map: dial.tex }));
      face.position.set(-0.02, 0.27, 0.163);
      face.rotation.x = -0.5;
      grp.add(face);
      const glass = new THREE.Mesh(new THREE.PlaneGeometry(0.37, 0.23),
        new THREE.MeshPhysicalMaterial({ color: 0xe4edf2, roughness: 0.05, transparent: true, opacity: 0.14, depthWrite: false }));
      glass.position.set(-0.02, 0.27, 0.17);
      glass.rotation.x = -0.5;
      grp.add(glass);
      const needle = new THREE.Group();
      const nGeo = mergeGeoms([
        new THREE.BoxGeometry(0.008, 0.1, 0.005).translate(0, 0.048, 0),
        new THREE.BoxGeometry(0.02, 0.026, 0.005).translate(0, -0.01, 0),
      ]);
      const nbar = new THREE.Mesh(nGeo, M(0x181c20, 0.4));
      needle.add(nbar);
      needle.position.set(-0.02, 0.255, 0.176);
      needle.rotation.z = Math.PI * 0.78;
      needle.rotation.x = -0.5;
      grp.add(needle);
      parts.needle = needle;
      const selKnob = knurledKnob(0.036, 0.03, M(VP.bakeliteHi, 0.45), M(VP.chrome, 0.3, 0.8));
      selKnob.position.set(0.16, 0.13, 0.1);
      selKnob.rotation.x = -0.9;
      grp.add(selKnob);
      parts.dial = dial;
      const sockets = [];
      [[-0.18, 0.04, 0xc23a2e], [-0.1, 0.04, 0x181c20], [0.02, 0.04, 0xc23a2e], [0.1, 0.04, 0x181c20]].forEach(([px, pz, c]) => {
        const sock = cyl(0.014, 0.016, 0.02, M(c, 0.5), 10);
        sock.rotation.x = Math.PI / 2;
        sock.position.set(px, 0.1, pz + 0.1);
        grp.add(sock);
        sockets.push(sock);
      });
      break;
    }
    case 'ac': {
      /* 信号源：机箱面板 + 波形显示窗贴图 + 双滚花旋钮 + 输出端子 + 电源灯 */
      const body = box(0.5, 0.2, 0.3, matCoat(VP.panelGray, { roughness: 0.42, metalness: 0.25 }));
      body.position.y = 0.1;
      const facePlate = box(0.46, 0.14, 0.016, M(VP.panelDark, 0.5, 0.3));
      facePlate.position.set(0, 0.17, 0.14);
      facePlate.rotation.x = -0.35;
      grp.add(body, facePlate);
      const waveTex = canvasTex(256, 96, (cv, w, h) => {
        cv.fillStyle = '#0d1218';
        cv.fillRect(0, 0, w, h);
        cv.strokeStyle = 'rgba(110,140,160,0.5)';
        cv.lineWidth = 1;
        cv.strokeRect(2, 2, w - 4, h - 4);
        cv.strokeStyle = '#6fd0a8';
        cv.lineWidth = 2.4;
        cv.beginPath();
        for (let i = 0; i <= 100; i++) {
          const px = 10 + i * (w - 20) / 100;
          const py = h / 2 - Math.sin(i / 100 * TAU * 2.2) * h * 0.3;
          i === 0 ? cv.moveTo(px, py) : cv.lineTo(px, py);
        }
        cv.stroke();
        cv.fillStyle = '#9fd3ff';
        cv.font = 'bold 15px sans-serif';
        cv.fillText('~ 50Hz', 12, 20);
      });
      const face = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.09), new THREE.MeshBasicMaterial({ map: waveTex }));
      face.position.set(-0.08, 0.185, 0.146);
      face.rotation.x = -0.35;
      grp.add(face);
      const knobA = knurledKnob(0.026, 0.022, M(VP.bakeliteHi, 0.45), M(VP.chrome, 0.3, 0.8));
      knobA.position.set(0.14, 0.17, 0.155);
      knobA.rotation.x = -0.35 + Math.PI / 2;
      const knobB = knobA.clone();
      knobB.position.set(0.2, 0.165, 0.15);
      grp.add(knobA, knobB);
      const p1 = bindingPost(0.05); p1.position.set(-0.16, 0.0, 0.12); grp.add(p1);
      const p2 = bindingPost(0.05, 0x181c20); p2.position.set(-0.06, 0.0, 0.12);
      grp.add(p2);
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.009, 8, 6), matGlow(0x7ee08a, 1.4, { roughness: 0.4 }));
      lamp.position.set(0.05, 0.2, 0.152);
      grp.add(lamp);
      break;
    }
    case 'xfmr': {
      /* 变压器：EI 叠片铁芯 + 穿芯螺栓 + 原/副漆包线圈 + 接线排 + 铭牌 */
      const steelM = M(VP.steelDeep, 0.42, 0.72);
      const midLeg = box(0.1, 0.2, 0.1, steelM);
      midLeg.position.y = 0.12;
      const legL = box(0.045, 0.16, 0.1, steelM);
      legL.position.set(-0.16, 0.1, 0);
      const legR = legL.clone();
      legR.position.x = 0.16;
      const yokeB = box(0.36, 0.045, 0.1, steelM);
      yokeB.position.y = 0.03;
      const yokeT = yokeB.clone();
      yokeT.position.y = 0.21;
      grp.add(midLeg, legL, legR, yokeB, yokeT);
      for (let i = 0; i < 5; i++) {
        const lam = box(0.365, 0.006, 0.102, M(i % 2 ? 0x646c74 : VP.steelDeep, 0.4, 0.7));
        lam.position.set(0, 0.028 + i * 0.046, 0.001);
        grp.add(lam);
      }
      [[-0.16, 0.03], [0.16, 0.03], [-0.16, 0.21], [0.16, 0.21]].forEach(([px, py]) => {
        const bolt = cyl(0.008, 0.008, 0.26, M(VP.chrome, 0.3, 0.85), 6);
        bolt.position.set(px, py, 0);
        const nut = cyl(0.014, 0.014, 0.012, M(VP.brassDeep, 0.4, 0.8), 6);
        nut.position.set(px, py + 0.125, 0);
        grp.add(bolt, nut);
      });
      const coilPrim = [], coilSec = [];
      for (let i = 0; i <= 110; i++) {
        const u = i / 110;
        coilPrim.push(V3(Math.cos(u * TAU * 30) * 0.088, 0.065 + u * 0.125, Math.sin(u * TAU * 30) * 0.088));
        coilSec.push(V3(Math.cos(u * TAU * 30 + 0.35) * 0.096, 0.07 + u * 0.115, Math.sin(u * TAU * 30 + 0.35) * 0.096));
      }
      const c1 = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(coilPrim), 260, 0.0055, 5), M(VP.copper, 0.45, 0.7));
      const c2 = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(coilSec), 260, 0.0045, 5), M(VP.copperHi, 0.45, 0.7));
      grp.add(c1, c2);
      const termBar = box(0.3, 0.03, 0.06, M(VP.porcelain, 0.75, 0.05));
      termBar.position.set(0, 0.008, 0.1);
      grp.add(termBar);
      for (let i = 0; i < 4; i++) {
        const post = bindingPost(0.045);
        post.position.set(-0.12 + i * 0.08, 0.023, 0.1);
        grp.add(post);
      }
      const plate = new THREE.Mesh(
        new THREE.PlaneGeometry(0.16, 0.07),
        new THREE.MeshBasicMaterial({ map: makeLabelTexture(['小型变压器', '6V · 50Hz'], { accent: '#7a5a3a', w: 160, h: 70 }) })
      );
      plate.position.set(0, 0.16, 0.056);
      grp.add(plate);
      break;
    }
    case 'npn': {
      /* 三极管：金属帽壳 + 背部散热鳍片 + 三引脚（e b c）+ 型号贴字 */
      const canM = M(VP.steelDeep, 0.35, 0.75);
      const can = cyl(0.045, 0.045, 0.11, canM, 16);
      can.position.y = 0.17;
      const dome = new THREE.Mesh(new THREE.SphereGeometry(0.045, 16, 10, 0, TAU, 0, Math.PI / 2), canM);
      dome.position.y = 0.225;
      grp.add(can, dome);
      const tab = box(0.03, 0.12, 0.014, canM);
      tab.position.set(0.05, 0.19, 0);
      grp.add(tab);
      const tagTex = canvasTex(128, 64, (cv, w, h) => {
        cv.clearRect(0, 0, w, h);
        cv.fillStyle = 'rgba(230,235,240,0.92)';
        cv.font = 'bold 30px monospace';
        cv.textAlign = 'center';
        cv.fillText('NP9013', w / 2, h / 2 + 10);
      });
      const tag = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.03), new THREE.MeshBasicMaterial({ map: tagTex, transparent: true }));
      tag.position.set(0, 0.17, 0.046);
      grp.add(tag);
      [['e', 0.06], ['b', 0.1], ['c', 0.14]].forEach(([nm, px]) => {
        const leg = cyl(0.006, 0.006, 0.1, M(VP.chrome, 0.35, 0.8), 6);
        leg.position.set(-0.07 + px, 0.05, 0);
        grp.add(leg);
      });
      break;
    }
  }
  /* 接触阴影（器材落台重量感） */
  const sf = spec.sf || (t === 'lamp' ? [0.3, 0.3] : t === 'solar' ? [0.6, 0.34] : t === 'rheo' ? [0.72, 0.4] : [0.5, 0.34]);
  const sh = shadowPatch(sf[0], sf[1], 0.3);
  sh.position.y = 0.004;
  grp.add(sh);
  if (label) {
    const t2 = lbl(label, '#ffcf9c');
    t2.position.set(0, 0.55, 0);
    grp.add(t2);
  }
  grp.position.set(x, TABLE_Y, z);
  if (spec.ry) grp.rotation.y = spec.ry;
  g.add(grp);
  return { grp, parts };
}

/* 仪表表盘贴图：主/副刻度 + 数字 + 单位 + 红色量程弧 + 镜面反光带（256² 高密度） */
function makeDial(sub, range, mm = false) {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const x = c.getContext('2d');
  const CX = 128, CY = 128;
  /* 盘面：奶白底 + 微径向渐变 */
  const bg = x.createRadialGradient(CX, CY - 40, 30, CX, CY, 124);
  bg.addColorStop(0, '#f4efe2');
  bg.addColorStop(1, '#ddd6c2');
  x.fillStyle = bg;
  x.beginPath(); x.arc(CX, CY, 124, 0, TAU); x.fill();
  x.strokeStyle = '#6a6355'; x.lineWidth = 3;
  x.beginPath(); x.arc(CX, CY, 118, 0, TAU); x.stroke();
  /* 镜面反光带（指针残影镜弧，仪表经典工艺） */
  x.strokeStyle = 'rgba(150,160,170,0.55)';
  x.lineWidth = 7;
  x.beginPath();
  x.arc(CX, CY, 96, Math.PI * 0.78, Math.PI * (0.78 + 0.56));
  x.stroke();
  /* 量程红弧（末 12% 超限区） */
  x.strokeStyle = '#c23a2e';
  x.lineWidth = 5;
  x.beginPath();
  x.arc(CX, CY, 88, Math.PI * (0.78 + 0.56) - Math.PI * 0.56 * 0.13, Math.PI * (0.78 + 0.56));
  x.stroke();
  /* 主刻度 ×11（每格副刻度 ×4）+ 数字 */
  for (let i = 0; i <= 40; i++) {
    const major = i % 4 === 0;
    const a = Math.PI * 0.78 - (i / 40) * Math.PI * 0.56;
    const rOut = 104, rIn = major ? 88 : 96;
    x.strokeStyle = major ? '#3a3630' : '#6a6355';
    x.lineWidth = major ? 3.4 : 1.6;
    x.beginPath();
    x.moveTo(CX + Math.cos(a) * rOut, CY - Math.sin(a) * rOut);
    x.lineTo(CX + Math.cos(a) * rIn, CY - Math.sin(a) * rIn);
    x.stroke();
    if (major) {
      x.fillStyle = '#2e2a24';
      x.font = 'bold 19px sans-serif';
      x.textAlign = 'center';
      x.textBaseline = 'middle';
      x.fillText(String(i / 4 * 3), CX + Math.cos(a) * 74, CY - Math.sin(a) * 74);
    }
  }
  /* 单位大字 + 量程小字 */
  x.fillStyle = '#1e1c18';
  x.font = 'bold 42px Georgia, serif';
  x.textAlign = 'center';
  x.fillText(mm ? 'Ω' : sub, CX, CY - 34);
  x.fillStyle = '#6a6355';
  x.font = '15px sans-serif';
  x.fillText(range || (mm ? 'VOLT MF 型' : 'DC'), CX, CY + 62);
  x.font = '12px sans-serif';
  x.textAlign = 'left';
  x.fillText('EDULAB', 30, 236);
  x.textAlign = 'right';
  x.fillText(mm ? '×1' : '0.5 级', 226, 236);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return { tex };
}
function setNeedle(id, frac) {
  const rec = ELVIS.get(id);
  if (!rec || !rec.parts.needle) return;
  rec.parts.needle.rotation.z = Math.PI * 0.78 - clamp(frac, -0.08, 1.06) * Math.PI * 0.56;
}
function addWire(g, path, elId) {
  const pts = path.map((p) => V3(p[0], p[1], p[2]));
  const curve = new THREE.CatmullRomCurve3(pts);
  const tube = new THREE.Mesh(
    new THREE.TubeGeometry(curve, Math.max(pts.length * 3, 12), 0.0115, 7),
    M(VP.wireRed, 0.52, 0.12)
  );
  g.add(tube);
  if (!beadField) makeBeadField(g);
  const w = { tube, elId };
  w.userData = { curve, phase: 0, slotBase: wires.length * 6 };
  wires.push(w);
  return w;
}
function bulbGlow(id, frac) {
  const rec = ELVIS.get(id);
  if (!rec) return;
  const f = clamp(frac, 0, 1.5);
  if (rec.parts.core) rec.parts.core.material.emissiveIntensity = f * 1.7;
  if (rec.parts.filament) rec.parts.filament.material.emissiveIntensity = clamp(f * 1.25, 0, 2.3);
  if (rec.parts.lampHalo) rec.parts.lampHalo.material.opacity = clamp(f - 0.35, 0, 1) * 0.28;
}
function setSwitchVisual(id, closed) {
  const rec = ELVIS.get(id);
  if (rec && rec.parts.lever) rec.parts.lever.rotation.z = closed ? -0.62 : 0;
  const e = CIR.els.get(id);
  if (e) e.R = closed ? 1e-4 : 1e9;
}
function setSliderVisual(id, frac) {
  const rec = ELVIS.get(id);
  if (rec && rec.parts.slider) rec.parts.slider.position.x = lerp(-0.26, 0.26, clamp(frac, 0, 1));
}

/* ================= HUD（右栏数据坞）/ 电路图窗 / 示波器窗 ================= */

const lcDataEl = document.getElementById('lcData');
let hud = null;
function setHUD(rows) {
  if (hud) hud.el.remove();
  hud = makeHUD(lcDataEl, rows);
  rows.forEach(([k]) => hud.set(k, '–'));
}
function hset(key, text) { if (hud) hud.set(key, text); }

/* 舞台浮窗（电路图 / 示波器）：头部折叠钮 + 40px 圆徽标，localStorage 记忆 */
let schemCard = null;
let scopeCard = null;
const NARROW_INIT = window.innerWidth <= 1100;

function readFold(key) {
  let v = null;
  try { v = localStorage.getItem(key); } catch (e) { /* 忽略 */ }
  return v !== null ? v === '1' : NARROW_INIT;
}
function writeFold(key, folded) {
  try { localStorage.setItem(key, folded ? '1' : '0'); } catch (e) { /* 忽略 */ }
}

function makeStageWin({ win, title, badge, foldKey, canvasW, canvasH, canvasCss }) {
  let shown = false;
  let folded = readFold(foldKey);
  const el = document.createElement('div');
  el.className = 'volt-win';
  el.dataset.win = win;
  const head = document.createElement('div');
  head.className = 'vw-head';
  const tb = document.createElement('b');
  tb.textContent = title;
  const foldBtn = document.createElement('button');
  foldBtn.type = 'button';
  foldBtn.className = 'fold-btn';
  foldBtn.textContent = '−';
  foldBtn.setAttribute('aria-label', '收起' + title + '窗');
  head.appendChild(tb);
  head.appendChild(foldBtn);
  const canvas = document.createElement('canvas');
  canvas.width = canvasW; canvas.height = canvasH;
  canvas.style.cssText = canvasCss;
  const badgeEl = document.createElement('span');
  badgeEl.className = 'volt-badge';
  badgeEl.textContent = badge;
  badgeEl.setAttribute('role', 'button');
  badgeEl.setAttribute('aria-label', '展开' + title + '窗');
  badgeEl.tabIndex = 0;
  el.appendChild(head);
  el.appendChild(canvas);
  el.appendChild(badgeEl);
  stage.appendChild(el);
  const apply = () => {
    el.style.display = shown ? '' : 'none';
    el.classList.toggle('folded', folded);
    foldBtn.setAttribute('aria-expanded', String(!folded));
    foldBtn.textContent = folded ? '+' : '−';
  };
  const setOpen = (v) => { shown = v; apply(); };
  const toggle = () => {
    folded = !folded;
    writeFold(foldKey, folded);
    apply();
  };
  foldBtn.addEventListener('click', (e) => { e.stopPropagation(); toggle(); });
  badgeEl.addEventListener('click', toggle);
  badgeEl.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
  apply();
  return {
    el, canvas, ctx: canvas.getContext('2d'), setOpen, toggle,
    get open() { return shown && !folded; },
    get shown() { return shown; },
  };
}

function makeSchem() {
  if (!schemCard) {
    schemCard = makeStageWin({
      win: 'schem', title: '电路图', badge: '图', foldKey: 'volt.foldSchem',
      canvasW: 500, canvasH: 320,
      canvasCss: 'width:250px;display:block;background:color-mix(in srgb, var(--bg) 72%, transparent);',
    });
  }
  schemCard.setOpen(true);
  return schemCard;
}
function hideSchem() { if (schemCard) schemCard.setOpen(false); }

function drawSchem(els) {
  const card = makeSchem();
  if (!card.open) return;
  const { ctx } = card;
  ctx.setTransform(2, 0, 0, 2, 0, 0);
  ctx.clearRect(0, 0, 250, 160);
  const fg = '#c9d6e2';
  const ac = '#ff9b5e';
  ctx.lineWidth = 1.6;
  els.forEach((e) => {
    ctx.strokeStyle = fg;
    ctx.beginPath();
    if (e.kind === 'wire') {
      ctx.moveTo(e.x1, e.y1); ctx.lineTo(e.x2, e.y2);
      ctx.stroke();
      return;
    }
    if (e.kind === 'node') {
      ctx.fillStyle = fg;
      ctx.beginPath(); ctx.arc(e.sx, e.sy, 2.5, 0, TAU); ctx.fill();
      return;
    }
    if (e.dir === 'h') {
      ctx.moveTo(e.sx - 24, e.sy); ctx.lineTo(e.sx - 10, e.sy);
      ctx.moveTo(e.sx + 10, e.sy); ctx.lineTo(e.sx + 24, e.sy);
    } else {
      ctx.moveTo(e.sx, e.sy - 24); ctx.lineTo(e.sx, e.sy - 10);
      ctx.moveTo(e.sx, e.sy + 10); ctx.lineTo(e.sx, e.sy + 24);
    }
    ctx.stroke();
    ctx.save();
    ctx.translate(e.sx, e.sy);
    if (e.dir === 'v') ctx.rotate(-Math.PI / 2);
    ctx.strokeStyle = fg; ctx.lineWidth = 1.8;
    switch (e.kind) {
      case 'res': case 'rheo': {
        ctx.beginPath(); ctx.rect(-10, -4.5, 20, 9); ctx.stroke();
        if (e.kind === 'rheo') { ctx.beginPath(); ctx.moveTo(-4, -12); ctx.lineTo(-4, -4.5); ctx.stroke(); }
        break;
      }
      case 'bat': {
        ctx.beginPath();
        ctx.moveTo(-8, -9); ctx.lineTo(-8, 9);
        ctx.moveTo(-3, -4); ctx.lineTo(-3, 4);
        ctx.moveTo(3, -9); ctx.lineTo(3, 9);
        ctx.moveTo(8, -4); ctx.lineTo(8, 4);
        ctx.stroke();
        break;
      }
      case 'bulb': {
        ctx.beginPath(); ctx.arc(0, 0, 8, 0, TAU); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-5.6, -5.6); ctx.lineTo(5.6, 5.6);
        ctx.moveTo(-5.6, 5.6); ctx.lineTo(5.6, -5.6);
        ctx.stroke();
        break;
      }
      case 'sw': {
        ctx.beginPath();
        ctx.moveTo(-8, 0); ctx.lineTo(e.closed ? 7 : 5, -8);
        ctx.stroke();
        ctx.fillStyle = fg;
        ctx.beginPath(); ctx.arc(-8, 0, 1.6, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.arc(8, 0, 1.6, 0, TAU); ctx.fill();
        break;
      }
      case 'am': case 'vol': case 'gal': {
        ctx.beginPath(); ctx.arc(0, 0, 9, 0, TAU); ctx.stroke();
        ctx.fillStyle = fg; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(e.kind === 'am' ? 'A' : e.kind === 'vol' ? 'V' : 'G', 0, 0);
        break;
      }
      case 'cap': {
        ctx.beginPath();
        ctx.moveTo(-9, -8); ctx.lineTo(-9, 8);
        ctx.moveTo(9, -8); ctx.lineTo(9, 8);
        ctx.stroke();
        break;
      }
      case 'ind': {
        ctx.beginPath();
        for (let i = 0; i < 4; i++) ctx.arc(-6 + i * 4, 0, 3, Math.PI, 0, false);
        ctx.stroke();
        break;
      }
      case 'dio': {
        ctx.beginPath();
        ctx.moveTo(-8, -6); ctx.lineTo(-8, 6); ctx.lineTo(4, 6); ctx.lineTo(4, -6); ctx.closePath();
        ctx.fillStyle = fg; ctx.fill();
        ctx.beginPath(); ctx.moveTo(4, -6); ctx.lineTo(4, 6); ctx.lineTo(8, 6); ctx.lineTo(8, -6); ctx.lineTo(4, -6);
        ctx.stroke();
        break;
      }
      default: {
        ctx.beginPath(); ctx.rect(-9, -5, 18, 10); ctx.stroke();
      }
    }
    ctx.restore();
    if (e.sub) {
      ctx.fillStyle = ac; ctx.font = '10px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(e.sub, e.sx + (e.dir === 'h' ? 0 : 17), e.sy - (e.dir === 'h' ? 15 : 0));
    }
  });
}

function makeScope(title) {
  if (!scopeCard) {
    scopeCard = makeStageWin({
      win: 'scope', title: '示波器', badge: '波', foldKey: 'volt.foldScope',
      canvasW: 420, canvasH: 260,
      canvasCss: 'width:210px;display:block;',
    });
  }
  scopeCard.setOpen(true);
  if (title) {
    const tb = scopeCard.el.querySelector('.vw-head b');
    if (tb) tb.textContent = title;
  }
  return scopeCard;
}
function hideScope() { if (scopeCard) scopeCard.setOpen(false); }
function scopeBase(xl, yl) {
  const sc = makeScope('');
  const { ctx } = sc;
  if (!sc.open) return ctx;
  ctx.setTransform(2, 0, 0, 2, 0, 0);
  ctx.fillStyle = '#10161c';
  ctx.fillRect(0, 0, 210, 130);
  ctx.strokeStyle = '#55606a'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(24, 10); ctx.lineTo(24, 112); ctx.lineTo(206, 112); ctx.stroke();
  ctx.fillStyle = '#8a98a6'; ctx.font = '9px sans-serif';
  ctx.fillText(xl, 168, 122);
  ctx.fillText(yl, 4, 9);
  return ctx;
}

/* ================= 章节脚手架 ================= */

const ctl = createControlsPanel(document.getElementById('controls'));
let wires = [];
let CH = null;
let cirG = null;

/* 换章时释放上一章电路的全部 GPU 资源（几何/材质/贴图），防跨章切换内存增长 */
function disposeGroupDeep(g) {
  g.traverse((o) => {
    if (o.isMesh || o.isSprite) {
      if (o.geometry) o.geometry.dispose();
      const mats = Array.isArray(o.material) ? o.material : (o.material ? [o.material] : []);
      mats.forEach((m) => {
        ['map', 'normalMap', 'roughnessMap', 'emissiveMap'].forEach((k) => {
          if (m[k] && m[k].dispose) m[k].dispose();
        });
        if (m.dispose) m.dispose();
      });
    }
  });
}

function enterBench(buildFn) {
  useScene('bench', (g) => buildBenchScene(g));
  if (!cirG) {
    cirG = new THREE.Group();
    scenes.bench.add(cirG);
  }
  disposeGroupDeep(cirG);
  cirG.clear();
  ELVIS.clear();
  wires = [];
  beadField = null;
  hideSchem(); hideScope();
  CIR = { N: 4, els: new Map(), dt: 0.002 };
  buildFn();
  /* 未用小珠槽位清零（缩放 0 = 不渲染） */
  if (beadField) {
    _beadM.makeScale(0, 0, 0);
    for (let i = wires.length * 6; i < BEAD_CAP; i++) beadField.setMatrixAt(i, _beadM);
    beadField.instanceMatrix.needsUpdate = true;
  }
}
function addEl(id, spec) {
  const vis = addElement(cirG, spec);
  let kind = spec.t;
  if (spec.t === 'gauge') kind = spec.sub === 'A' || spec.sub === 'G' ? 'am' : 'vol';
  const el = {
    id, kind, a: spec.a, b: spec.b,
    R: spec.R !== undefined ? spec.R : (kind === 'vol' ? 1e7 : 1),
    E: spec.E || 0, r: spec.r || 0,
    C: spec.C || 0, L: spec.L || 0,
    VZ: spec.VZ, IS: spec.IS, rs: spec.rs, VF: spec.VF, Ir: spec.Ir,
    vc: spec.vc0 || 0, iL: spec.iL0 || 0,
  };
  CIR.els.set(id, el);
  ELVIS.set(id, vis);
  return el;
}
function solveNow() { if (CIR) solveCircuit(); }
window.__voltCir = () => CIR;
function W_(path, elId) { return addWire(cirG, path, elId); }

const SECTIONS = [];
function chap(def) { SECTIONS.push(def); }

/* ---------- 01 串并联 ---------- */
const S1 = { mode: 'ser', closed: true };
function serparRebuild() {
  enterBench(() => buildSerPar());
  setSwitchVisual('sw', S1.closed);
  setSwitchLogic('sw', S1.closed);
  updSerPar();
}
function setSwitchLogic(id, closed) {
  const e = CIR.els.get(id);
  if (e) e.R = closed ? 1e-4 : 1e9;
}
function buildSerPar() {
  addEl('bat1', { t: 'bat', x: -2.0, z: 0.35, label: '电源 3V', E: 3, r: 0.4, a: 1, b: 0 });
  addEl('am', { t: 'gauge', sub: 'A', x: 1.9, z: -0.55, label: '电流表', R: 1e-3, a: 1, b: 4, ry: Math.PI });
  addEl('sw', { t: 'sw', x: -1.1, z: 0.35, label: '开关 S', R: 1e-4, a: 4, b: 2 });
  CIR.N = 5;
  addEl('l1', { t: 'bulb', x: 0.15, z: S1.mode === 'ser' ? 0.35 : 0.62, label: '灯 L1', R: 12, a: 2, b: S1.mode === 'ser' ? 3 : 0 });
  addEl('l2', { t: 'bulb', x: 1.15, z: S1.mode === 'ser' ? 0.35 : 0.08, label: '灯 L2', R: 12, a: S1.mode === 'ser' ? 3 : 2, b: 0 });
  const y0 = TABLE_Y + 0.06;
  W_([[-2.22, TABLE_Y + 0.34, 0.35], [-2.5, y0, 0.35], [-2.5, y0, -0.55], [1.9, y0, -0.55]], 'bat1');
  W_([[-1.78, TABLE_Y + 0.34, 0.35], [-1.4, y0, 0.35], [-1.32, y0, 0.35]], 'bat1');
  W_([[-0.88, y0, 0.35], [-0.55, y0, 0.35]], 'sw');
  if (S1.mode === 'ser') {
    W_([[-0.3, y0, 0.35], [0.0, TABLE_Y + 0.2, 0.35], [0.0, TABLE_Y + 0.4, 0.35]], 'sw');
    W_([[0.3, TABLE_Y + 0.4, 0.35], [0.85, TABLE_Y + 0.4, 0.35]], 'l1');
    W_([[1.3, TABLE_Y + 0.4, 0.35], [1.6, TABLE_Y + 0.3, 0.1], [1.9, TABLE_Y + 0.2, -0.4]], 'l2');
    drawSchem([
      { kind: 'wire', x1: 18, y1: 118, x2: 40, y2: 118 },
      { kind: 'bat', sx: 50, sy: 118, dir: 'v', sub: '3V' },
      { kind: 'wire', x1: 50, y1: 94, x2: 50, y2: 40 },
      { kind: 'sw', sx: 50, sy: 30, dir: 'h', closed: S1.closed, sub: 'S' },
      { kind: 'wire', x1: 58, y1: 30, x2: 92, y2: 30 },
      { kind: 'bulb', sx: 104, sy: 30, dir: 'h', sub: 'L1' },
      { kind: 'wire', x1: 116, y1: 30, x2: 140, y2: 30 },
      { kind: 'bulb', sx: 152, sy: 30, dir: 'h', sub: 'L2' },
      { kind: 'wire', x1: 164, y1: 30, x2: 196, y2: 30 },
      { kind: 'wire', x1: 196, y1: 30, x2: 196, y2: 118 },
      { kind: 'am', sx: 120, sy: 118, dir: 'h', sub: 'A' },
      { kind: 'wire', x1: 110, y1: 118, x2: 18, y2: 118 },
      { kind: 'node', sx: 18, sy: 118 },
    ]);
  } else {
    W_([[-0.3, y0, 0.35], [0.0, y0, 0.62], [0.0, TABLE_Y + 0.4, 0.62]], 'sw');
    W_([[0.3, TABLE_Y + 0.4, 0.62], [0.62, y0, 0.62], [0.62, y0, -0.55], [1.9, y0, -0.55]], 'l1');
    W_([[0.62, y0, 0.62], [0.62, y0, 0.08], [0.9, TABLE_Y + 0.4, 0.08]], 'l1');
    W_([[1.3, TABLE_Y + 0.4, 0.08], [1.62, y0, 0.08], [1.62, y0, -0.55]], 'l2');
    drawSchem([
      { kind: 'wire', x1: 18, y1: 118, x2: 40, y2: 118 },
      { kind: 'bat', sx: 50, sy: 118, dir: 'v', sub: '3V' },
      { kind: 'wire', x1: 50, y1: 94, x2: 50, y2: 40 },
      { kind: 'sw', sx: 50, sy: 30, dir: 'h', closed: S1.closed, sub: 'S' },
      { kind: 'wire', x1: 58, y1: 30, x2: 100, y2: 30 },
      { kind: 'node', sx: 100, sy: 30 },
      { kind: 'wire', x1: 100, y1: 30, x2: 130, y2: 30 },
      { kind: 'am', sx: 142, sy: 30, dir: 'h', sub: 'A' },
      { kind: 'wire', x1: 152, y1: 30, x2: 196, y2: 30 },
      { kind: 'wire', x1: 196, y1: 30, x2: 196, y2: 118 },
      { kind: 'node', sx: 196, sy: 118 },
      { kind: 'wire', x1: 100, y1: 30, x2: 100, y2: 62 },
      { kind: 'bulb', sx: 100, sy: 74, dir: 'v', sub: 'L1' },
      { kind: 'wire', x1: 100, y1: 86, x2: 100, y2: 118 },
      { kind: 'wire', x1: 100, y1: 118, x2: 18, y2: 118 },
      { kind: 'wire', x1: 148, y1: 30, x2: 148, y2: 56 },
      { kind: 'bulb', sx: 148, sy: 68, dir: 'v', sub: 'L2' },
      { kind: 'wire', x1: 148, y1: 80, x2: 148, y2: 118 },
    ]);
  }
}
function updSerPar() {
  solveNow();
  const am = CIR.els.get('am'), l1 = CIR.els.get('l1'), l2 = CIR.els.get('l2');
  const i = Math.abs(am.I);
  setNeedle('am', i / 0.6);
  const f1 = Math.abs(l1.I) / 0.22, f2 = Math.abs(l2.I) / 0.22;
  bulbGlow('l1', f1); bulbGlow('l2', f2);
  hset('top', S1.mode === 'ser' ? '串联：电流只有一条路' : '并联：两灯各自成路');
  hset('i', i.toFixed(3) + ' A（干路）');
  hset('l1', `I₁ = ${Math.abs(l1.I).toFixed(3)} A · ${Math.abs(l1.I) > 0.12 ? '亮' : Math.abs(l1.I) > 0.04 ? '较暗' : '熄'}`);
  hset('l2', `I₂ = ${Math.abs(l2.I).toFixed(3)} A · ${Math.abs(l2.I) > 0.12 ? '亮' : Math.abs(l2.I) > 0.04 ? '较暗' : '熄'}`);
}
chap({
  id: 'serpar', title: '串联与并联电路',
  cam: [-0.3, 3.2, 4.6],
  tgt: [-0.2, 1.22, 0],
  html: `<p><b>串联</b>：用电器首尾相接，电流只走得通一条路——路上各点电流一样大；一处断开，整条路都停。<b>并联</b>：用电器两端并排接到同两个节点上——每条支路分到的电压相同，干路电流等于各支路相加；拆掉一支，其余支路照常工作。</p>
<p>切换「串联 / 并联」重新接线，开合开关，盯住两灯亮度与电流表读数的差别。（真实灯丝受热后阻值会爬升，冷态约为热态的九分之一——后面「伏安特性」一章可以亲手量一回。）</p>`,
  tasks: [
    { key: 'mode', text: '各切一次串联与并联，对比电流表读数' },
    { key: 'switch', text: '断开开关，观察两灯是否同时熄灭' },
    { key: 'drag', text: '拖动画面换个角度看清接线' },
  ],
  quiz: [
    { q: '两盏相同的灯由串联改为并联后（电源不变），干路电流会怎么变？', opts: ['变小', '不变', '变大（约为原来的 4 倍）', '变为 0'], a: 2, ex: '串联时总阻 2R，并联时总阻 R/2；总阻变为 1/4，电流即约 4 倍——并联的灯也更亮。' },
  ],
  enter() {
    serparRebuild();
    app.setCamera([-0.3, 3.2, 4.6], [-0.2, 1.22, 0]);
    ctl.clear();
    const btns = [];
    const paint = () => btns.forEach(({ b, v }) => b.classList.toggle('active', v === S1.mode));
    [['ser', '串联'], ['par', '并联']].forEach(([v, t]) => {
      const b = ctl.button({ label: t, onClick() { S1.mode = v; serparRebuild(); paint(); } });
      btns.push({ b, v });
    });
    paint();
    ctl.sep();
    ctl.toggle({ label: '开关 S', value: S1.closed, onChange: (v) => { S1.closed = v; setSwitchLogic('sw', v); setSwitchVisual('sw', v); updSerPar(); } });
    setHUD([['top', '连接方式'], ['i', '电流表读数'], ['l1', '灯 L1'], ['l2', '灯 L2']]);
    updSerPar();
  },
});

/* ---------- 02 欧姆定律 ---------- */
const S2 = { E: 3, R: 10 };
function ohmLayout() {
  enterBench(() => {
    addEl('bat1', { t: 'bat', x: -2.0, z: 0.4, label: '电源', E: S2.E, r: 0.5, a: 1, b: 0 });
    addEl('sw', { t: 'sw', x: -1.1, z: 0.4, label: '开关', R: 1e-4, a: 1, b: 2 });
    addEl('am', { t: 'gauge', sub: 'A', x: -0.2, z: 0.4, label: '电流表', R: 1e-3, a: 2, b: 3 });
    addEl('rh', { t: 'rheo', x: 0.9, z: 0.4, label: '定值电阻 R', R: S2.R, a: 3, b: 0 });
    addEl('vol', { t: 'gauge', sub: 'V', x: 0.9, z: -0.45, label: '电压表', R: 1e7, a: 3, b: 0, ry: Math.PI });
    const y0 = TABLE_Y + 0.06;
    W_([[-2.22, TABLE_Y + 0.34, 0.4], [-2.5, y0, 0.4], [-2.5, y0, 0.62], [2.4, y0, 0.62], [2.4, y0, -0.62], [1.9, y0, -0.62], [1.9, TABLE_Y + 0.3, -0.55], [0.9, TABLE_Y + 0.2, -0.3]], 'bat1');
    W_([[-1.78, TABLE_Y + 0.34, 0.4], [-1.5, y0, 0.4], [-1.32, y0, 0.4]], 'bat1');
    W_([[-0.88, y0, 0.4], [-0.55, y0, 0.4], [-0.35, TABLE_Y + 0.16, 0.4]], 'sw');
    W_([[-0.05, TABLE_Y + 0.16, 0.4], [0.2, y0, 0.4], [0.62, y0, 0.4]], 'am');
    W_([[1.18, y0, 0.4], [1.7, y0, 0.4], [1.7, y0, 0.62]], 'rh');
    W_([[1.2, TABLE_Y + 0.1, -0.42], [1.2, y0, -0.45], [1.6, y0, -0.45]], 'vol');
    drawSchem([
      { kind: 'wire', x1: 24, y1: 116, x2: 44, y2: 116 },
      { kind: 'bat', sx: 54, sy: 116, dir: 'v' },
      { kind: 'wire', x1: 54, y1: 92, x2: 54, y2: 36 },
      { kind: 'sw', sx: 54, sy: 28, dir: 'h', closed: true, sub: 'S' },
      { kind: 'wire', x1: 62, y1: 28, x2: 96, y2: 28 },
      { kind: 'am', sx: 108, sy: 28, dir: 'h', sub: 'A' },
      { kind: 'wire', x1: 118, y1: 28, x2: 150, y2: 28 },
      { kind: 'node', sx: 150, sy: 28 },
      { kind: 'res', sx: 162, sy: 28, dir: 'h', sub: 'R' },
      { kind: 'wire', x1: 174, y1: 28, x2: 206, y2: 28 },
      { kind: 'wire', x1: 206, y1: 28, x2: 206, y2: 116 },
      { kind: 'vol', sx: 162, sy: 70, dir: 'h', sub: 'V' },
      { kind: 'wire', x1: 150, y1: 28, x2: 150, y2: 70 },
      { kind: 'wire', x1: 174, y1: 70, x2: 206, y2: 70 },
      { kind: 'node', sx: 206, sy: 116 },
      { kind: 'wire', x1: 206, y1: 116, x2: 24, y2: 116 },
    ]);
  });
}
function ohmUpd() {
  const b = CIR.els.get('bat1');
  b.E = S2.E;
  const rh = CIR.els.get('rh');
  rh.R = S2.R;
  setSliderVisual('rh', (S2.R - 2) / 18);
  solveNow();
  const am = CIR.els.get('am'), vol = CIR.els.get('vol');
  const i = Math.abs(am.I), u = Math.abs(vol.V);
  setNeedle('am', i / 1.0);
  setNeedle('vol', u / 6.0);
  hset('law', 'I = U / R');
  hset('u', u.toFixed(2) + ' V（R 两端）');
  hset('i', i.toFixed(3) + ' A');
  hset('calc', `U/I = ${(u / Math.max(i, 1e-9)).toFixed(1)} Ω = R ✓`);
}
chap({
  id: 'ohm', title: '探究欧姆定律',
  cam: [-0.2, 3.3, 4.8],
  tgt: [0, 1.22, 0],
  html: `<p>流过导体的电流，与它两端的<b>电压成正比</b>、与它的<b>电阻成反比</b>：<span class="hl">I = U / R</span>（欧姆定律，1826 年）。</p>
<p>固定 R 只动电压 → I 跟着 U 等比例涨；固定电压只动电阻 → I 与 R 反着变。电压表要并联在被测电阻两端，电流表则串在回路里。</p>
<p>拧两个旋钮，核对 U ÷ I 是不是始终等于 R。</p>`,
  tasks: [
    { key: 'u', text: '固定 R，从 1V 升到 6V，看电流正比增长' },
    { key: 'r', text: '固定 U，把 R 从 2Ω 调到 20Ω，看电流减半再减半' },
  ],
  quiz: [
    { q: '保持 R = 10Ω 不变，电压从 2V 加倍到 4V，电流如何变化？', opts: ['加倍（0.2A → 0.4A）', '减半', '不变', '变为 4 倍'], a: 0, ex: '定值电阻下 I ∝ U：电压翻倍电流也翻倍，0.2A 变 0.4A——「正比」的含义。' },
  ],
  enter() {
    ohmLayout();
    app.setCamera([-0.2, 3.3, 4.8], [0, 1.22, 0]);
    ctl.clear();
    ctl.slider({ label: '电源电压 U₀', min: 1, max: 6, step: 0.5, value: S2.E, fmt: (v) => v.toFixed(1) + ' V', onInput: (v) => { S2.E = v; ohmUpd(); } });
    ctl.slider({ label: '电阻 R', min: 2, max: 20, step: 1, value: S2.R, fmt: (v) => v + ' Ω', onInput: (v) => { S2.R = v; ohmUpd(); } });
    ctl.sep();
    ctl.toggle({ label: '开关', value: true, onChange: (v) => { setSwitchLogic('sw', v); setSwitchVisual('sw', v); ohmUpd(); } });
    setHUD([['law', '欧姆定律'], ['u', '电压 U'], ['i', '电流 I'], ['calc', '验算']]);
    ohmUpd();
  },
});

/* ---------- 03 测电源的电动势与内阻 ---------- */
const S3 = { R: 6, pts: [] };
chap({
  id: 'emfr', title: '测干电池的电动势与内阻',
  cam: [-0.2, 3.3, 4.8],
  tgt: [0, 1.22, 0],
  html: `<p>电源自己内部也串着一份电阻（<b>内阻 r</b>）。对外输出的路端电压满足 <span class="hl">U = E − I·r</span>：抽出的电流越大，内阻上扣掉的电压越多，端口电压就越低。</p>
<p>取两组 (I, U) 就能解出 E 和 r；在 U–I 图上则是一条斜向下的直线——<b>纵截距给出 E，斜率的绝对值给出 r</b>。</p>
<p>调 R 取不同的 I、U，点「记录一组 (I, U)」，记满两组以上看拟合结果。</p>`,
  tasks: [
    { key: 'record', text: '记录至少 2 组数据，读出拟合的 E 与 r' },
    { key: 'clear', text: '清除数据后换一组阻值再测一遍' },
  ],
  quiz: [
    { q: 'U–I 图线中，把直线延长到 I = 0 处，纵轴截距代表什么？', opts: ['内阻 r', '电动势 E', '路端电压', '短路电流'], a: 1, ex: 'I=0 时 U = E − 0 = E：断路时的路端电压恰好等于电动势；而斜率的绝对值才是内阻。' },
  ],
  enter() {
    enterBench(() => {
      addEl('bat1', { t: 'bat', x: -1.8, z: 0.45, label: '待测电源', E: 3, r: 0.8, a: 1, b: 0 });
      addEl('sw', { t: 'sw', x: -0.9, z: 0.45, label: '开关', R: 1e-4, a: 1, b: 2 });
      addEl('am', { t: 'gauge', sub: 'A', x: 0, z: 0.45, label: '电流表', R: 1e-3, a: 2, b: 3 });
      addEl('rh', { t: 'rheo', x: 1.0, z: 0.45, label: '滑动变阻器', R: S3.R, a: 3, b: 0 });
      addEl('vol', { t: 'gauge', sub: 'V', x: 0.1, z: -0.5, label: '电压表', R: 1e7, a: 1, b: 0, ry: Math.PI });
      const y0 = TABLE_Y + 0.06;
      W_([[-2.02, TABLE_Y + 0.34, 0.45], [-2.4, y0, 0.45], [-2.4, y0, 0.68], [2.6, y0, 0.68], [2.6, y0, -0.68], [-0.35, y0, -0.68], [-0.35, TABLE_Y + 0.3, -0.56]], 'bat1');
      W_([[-1.58, TABLE_Y + 0.34, 0.45], [-1.3, y0, 0.45], [-1.12, y0, 0.45]], 'bat1');
      W_([[-0.68, y0, 0.45], [-0.35, y0, 0.45], [-0.15, TABLE_Y + 0.16, 0.45]], 'sw');
      W_([[0.15, TABLE_Y + 0.16, 0.45], [0.4, y0, 0.45], [0.7, y0, 0.45]], 'am');
      W_([[1.3, y0, 0.45], [1.9, y0, 0.45], [1.9, y0, 0.68]], 'rh');
      W_([[-0.12, TABLE_Y + 0.1, -0.48], [0.4, y0, -0.5], [-1.8, y0, -0.5], [-1.8, TABLE_Y + 0.3, 0.4]], 'vol');
      drawSchem([
        { kind: 'wire', x1: 30, y1: 114, x2: 50, y2: 114 },
        { kind: 'bat', sx: 60, sy: 114, dir: 'v', sub: 'E,r' },
        { kind: 'wire', x1: 60, y1: 90, x2: 60, y2: 36 },
        { kind: 'sw', sx: 60, sy: 28, dir: 'h', closed: true, sub: 'S' },
        { kind: 'wire', x1: 68, y1: 28, x2: 100, y2: 28 },
        { kind: 'am', sx: 112, sy: 28, dir: 'h', sub: 'A' },
        { kind: 'wire', x1: 122, y1: 28, x2: 152, y2: 28 },
        { kind: 'rheo', sx: 166, sy: 28, dir: 'h', sub: 'R' },
        { kind: 'wire', x1: 178, y1: 28, x2: 208, y2: 28 },
        { kind: 'wire', x1: 208, y1: 28, x2: 208, y2: 114 },
        { kind: 'vol', sx: 60, sy: 70, dir: 'h', sub: 'V' },
        { kind: 'wire', x1: 60, y1: 90, x2: 60, y2: 70 },
        { kind: 'wire', x1: 72, y1: 70, x2: 208, y2: 70 },
        { kind: 'node', sx: 208, y2: 0, sy: 114 },
      ]);
    });
    app.setCamera([-0.2, 3.3, 4.8], [0, 1.22, 0]);
    ctl.clear();
    ctl.slider({ label: '变阻器 R', min: 1, max: 20, step: 0.5, value: S3.R, fmt: (v) => v.toFixed(1) + ' Ω', onInput: (v) => { S3.R = v; const e = CIR.els.get('rh'); e.R = v; setSliderVisual('rh', (v - 1) / 19); solveNow(); updEmfr(); } });
    ctl.sep();
    ctl.button({ label: '⌘ 记录一组 (I, U)', onClick() { const am = CIR.els.get('am'), vol = CIR.els.get('vol'); S3.pts.push([Math.abs(am.I), Math.abs(vol.V)]); if (S3.pts.length > 6) S3.pts.shift(); updEmfr(); } });
    ctl.button({ label: '✕ 清除数据', onClick() { S3.pts.length = 0; updEmfr(); } });
    setHUD([['law', 'U = E − I·r'], ['iu', '当前 I / U'], ['fit', '拟合 E 与 r'], ['n', '数据组数']]);
    solveNow();
    updEmfr();
  },
});
function updEmfr() {
  const am = CIR.els.get('am'), vol = CIR.els.get('vol');
  const i = Math.abs(am.I), u = Math.abs(vol.V);
  setNeedle('am', i / 1.5); setNeedle('vol', u / 4);
  hset('iu', `${i.toFixed(3)} A / ${u.toFixed(2)} V`);
  hset('n', S3.pts.length + ' 组');
  if (S3.pts.length >= 2) {
    // 最小二乘拟合 U = E − r I
    const n = S3.pts.length;
    let si = 0, su = 0, sii = 0, siu = 0;
    S3.pts.forEach(([I, U]) => { si += I; su += U; sii += I * I; siu += I * U; });
    const den = n * sii - si * si;
    const rFit = den ? -(n * siu - si * su) / den : 0;
    const eFit = den ? (su + rFit * si) / n : 0;
    hset('fit', `E ≈ ${eFit.toFixed(2)} V，r ≈ ${rFit.toFixed(2)} Ω`);
  } else {
    hset('fit', '至少记录两组数据');
  }
  // U–I 图
  const sc = makeScope('U–I 图线');
  scopeBase('I/A', 'U/V');
  const ctx = sc.ctx;
  const toX = (I) => 24 + clamp(I / 2.5, 0, 1) * 180;
  const toY = (U) => 112 - clamp(U / 4, 0, 1) * 98;
  ctx.strokeStyle = '#8a98a6'; ctx.font = '8px sans-serif';
  ctx.fillText('E', 28, toY(3.4)); ctx.fillText('U₀', 28, toY(3) + 8);
  ctx.fillStyle = '#ff9b5e';
  S3.pts.forEach(([I, U]) => { ctx.beginPath(); ctx.arc(toX(I), toY(U), 3, 0, TAU); ctx.fill(); });
  if (S3.pts.length >= 2) {
    const n = S3.pts.length;
    let si = 0, su = 0, sii = 0, siu = 0;
    S3.pts.forEach(([I, U]) => { si += I; su += U; sii += I * I; siu += I * U; });
    const den = n * sii - si * si;
    if (den) {
      const rFit = -(n * siu - si * su) / den;
      const eFit = (su + rFit * si) / n;
      ctx.strokeStyle = '#ff9b5e'; ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(toX(0), toY(eFit));
      ctx.lineTo(toX(2.4), toY(eFit - rFit * 2.4));
      ctx.stroke();
    }
  }
}

/* ---------- 04 伏安特性 ---------- */
const S4 = { pos: 0, pts: [], T: 300 };
const VAH_R = { Rr: 15, Tr: 2800, T0: 300, Pr: 2.4 };   // 灯丝额定参数（辐射热平衡模型）
chap({
  id: 'vah', title: '小灯泡伏安特性曲线的描绘',
  cam: [-0.2, 3.3, 4.8],
  tgt: [0, 1.22, 0],
  html: `<p>金属越热电阻越大。灯泡两端电压一升，灯丝温度冲上几千开尔文，<b>阻值跟着变大</b>——所以 I–U 曲线是<b>弯向电压轴</b>的一条曲线，不是直线！冷态阻值只有炽热态的一成上下，开灯瞬间电流冲击最大，灯丝往往就在那一刻烧断。</p>
<p>本电路把滑动变阻器接成<b>分压式</b>：A、B 两端跨接电源，从 A 端与滑片 D 之间取输出——滑片从 A 端起步，灯泡电压就能<b>从 0 一路平滑推到电源电压</b>（限流接法起不了 0）。</p>
<p>缓缓右移滑片，每停一处点「记录数据点」，看看曲线往哪边弯；回头对比「探究欧姆定律」章里定值电阻的那条直线。</p>`,
  tasks: [
    { key: 'sweep', text: '滑片从 0% 推到 100%，沿途记录 ≥5 个数据点' },
    { key: 'bend', text: '观察曲线弯向电压轴（灯丝越热越「费电」）' },
  ],
  quiz: [
    { q: '灯泡的 I–U 曲线为什么弯向电压轴？', opts: ['电压表分流造成误差', '灯丝温度升高使电阻变大', '电源内阻随电压变化', '量程选大了'], a: 1, ex: '电压越高灯丝越热、阻值越大，同电压下的电流比「按冷态电阻估算」更小——曲线于是向 U 轴弯。' },
  ],
  enter() {
    enterBench(() => {
      addEl('bat1', { t: 'bat', x: -2.0, z: 0.4, label: '电源 4.5V', E: 4.5, r: 0.2, a: 1, b: 0 });
      addEl('rh', { t: 'rheo', x: -0.5, z: 0.4, label: '滑动变阻器（分压式）', R: 20, a: 0, b: 0 });
      addEl('pA', { t: 'res', x: 0, z: 0, label: '', R: 0.01, a: 1, b: 2 });
      addEl('pB', { t: 'res', x: 0, z: 0, label: '', R: 20, a: 2, b: 0 });
      addEl('bl', { t: 'bulb', x: 0.3, z: 0.4, label: '小灯泡', R: 2, a: 2, b: 3 });
      addEl('am', { t: 'gauge', sub: 'A', x: 1.9, z: 0.4, label: '电流表', R: 1e-3, a: 3, b: 0 });
      addEl('vol', { t: 'gauge', sub: 'V', x: 1.0, z: -0.5, label: '电压表', R: 1e7, a: 2, b: 3, ry: Math.PI });
      const y0 = TABLE_Y + 0.06;
      W_([[-1.78, TABLE_Y + 0.34, 0.4], [-1.3, y0, 0.4], [-1.3, y0, 0.66], [-0.9, y0, 0.66], [-0.85, TABLE_Y + 0.16, 0.55]], 'bat1');
      W_([[-2.22, TABLE_Y + 0.34, 0.4], [-2.6, y0, 0.4], [-2.6, y0, -0.7], [2.4, y0, -0.7]], 'bat1');
      W_([[-0.15, TABLE_Y + 0.18, 0.4], [0.14, TABLE_Y + 0.2, 0.4]], 'pA');
      W_([[0.46, TABLE_Y + 0.4, 0.4], [0.9, y0, 0.4], [1.55, TABLE_Y + 0.16, 0.4]], 'bl');
      W_([[2.25, TABLE_Y + 0.16, 0.4], [2.4, y0, 0.4], [2.4, y0, -0.7]], 'am');
      W_([[0.5, TABLE_Y + 0.1, -0.46], [0.5, y0, -0.5], [0.62, y0, -0.5]], 'bl');
      W_([[0.74, y0, -0.5], [1.4, y0, -0.5]], 'bl');
      drawSchem([
        { kind: 'wire', x1: 36, y1: 116, x2: 60, y2: 116 },
        { kind: 'bat', sx: 70, sy: 116, dir: 'v', sub: '4.5V' },
        { kind: 'wire', x1: 70, y1: 92, x2: 70, y2: 30 },
        { kind: 'wire', x1: 70, y1: 30, x2: 96, y2: 30 },
        { kind: 'wire', x1: 96, y1: 30, x2: 96, y2: 38 },
        { kind: 'res', sx: 96, sy: 50, dir: 'v', sub: 'RA' },
        { kind: 'wire', x1: 96, y1: 62, x2: 96, y2: 76 },
        { kind: 'node', sx: 96, sy: 64 },
        { kind: 'res', sx: 96, sy: 88, dir: 'v', sub: 'RB' },
        { kind: 'wire', x1: 96, y1: 100, x2: 96, y2: 116 },
        { kind: 'node', sx: 96, sy: 116 },
        { kind: 'wire', x1: 36, y1: 116, x2: 226, y2: 116 },
        { kind: 'wire', x1: 96, y1: 64, x2: 130, y2: 64 },
        { kind: 'bulb', sx: 144, sy: 64, dir: 'h', sub: '灯' },
        { kind: 'wire', x1: 156, y1: 64, x2: 186, y2: 64 },
        { kind: 'am', sx: 200, sy: 64, dir: 'h', sub: 'A' },
        { kind: 'wire', x1: 212, y1: 64, x2: 226, y2: 64 },
        { kind: 'wire', x1: 226, y1: 64, x2: 226, y2: 116 },
        { kind: 'node', sx: 226, sy: 116 },
        { kind: 'vol', sx: 144, sy: 30, dir: 'h', sub: 'V' },
        { kind: 'wire', x1: 130, y1: 64, x2: 130, y2: 30 },
        { kind: 'wire', x1: 158, y1: 30, x2: 186, y2: 30 },
        { kind: 'node', sx: 186, sy: 64 },
        { kind: 'wire', x1: 186, y1: 30, x2: 186, y2: 64 },
      ]);
    });
    app.setCamera([-0.2, 3.3, 4.8], [0, 1.22, 0]);
    ctl.clear();
    ctl.slider({ label: '滑片位置 A→B（分压）', min: 0, max: 1, step: 0.02, value: S4.pos, fmt: (v) => Math.round(v * 100) + '%', onInput: (v) => { S4.pos = v; updVah(); } });
    ctl.sep();
    ctl.button({ label: '⌘ 记录数据点', onClick() { S4.pts.push([CIR.els.get('vol').V, Math.abs(CIR.els.get('am').I)]); if (S4.pts.length > 24) S4.pts.shift(); updVah(); } });
    ctl.button({ label: '✕ 清除', onClick() { S4.pts.length = 0; S4.T = 300; S4.pos = 0; updVah(); } });
    setHUD([['iu', 'U / I'], ['r', '灯丝电阻'], ['t', '灯丝温度'], ['note', '曲线向 U 轴弯曲']]);
    solveNow();
    updVah();
  },
});
function updVah() {
  const am = CIR.els.get('am'), vol = CIR.els.get('vol'), bl = CIR.els.get('bl');
  // 分压式：上段 RA = pos·20Ω，下段 RB = (1−pos)·20Ω，滑片从 0 起调
  const Rmax = 20;
  const ra = CIR.els.get('pA'), rb = CIR.els.get('pB');
  ra.R = clamp(S4.pos * Rmax, 0.01, Rmax);
  rb.R = clamp((1 - S4.pos) * Rmax, 0.01, Rmax);
  setSliderVisual('rh', S4.pos);
  solveNow();
  const i = Math.abs(am.I), u = Math.abs(vol.V);
  const p = i * u;
  // 灯丝辐射热平衡：C dT/dt = P − k(T⁴−T₀⁴)，R = Rr·T/Tr（钨丝，冷态≈热态 1/9）
  const { Rr, Tr, T0, Pr } = VAH_R;
  const kk = Pr / (Tr ** 4 - T0 ** 4), Cth = 0.05 * 4 * kk * Tr ** 3;
  let T = S4.T;
  const sub = 4, h = 0.016 / sub;
  for (let k = 0; k < sub; k++) {
    T += (p - kk * (T ** 4 - T0 ** 4)) / Cth * h;
    T = clamp(T, T0, 3300);
  }
  S4.T = T;
  bl.R = clamp(Rr * T / Tr, 1.2, 40);
  bulbGlow('bl', p / 0.5);
  setNeedle('am', i / 0.5); setNeedle('vol', u / 4.6);
  hset('iu', `${u.toFixed(2)} V / ${i.toFixed(3)} A`);
  hset('r', bl.R.toFixed(1) + ' Ω');
  hset('t', Math.round(S4.T) + ' K');
  const sc = makeScope('小灯泡 I–U 特性');
  scopeBase('U/V', 'I/A');
  const ctx = sc.ctx;
  const toX = (U) => 24 + clamp(U / 4.6, 0, 1) * 180;
  const toY = (I) => 112 - clamp(I / 0.6, 0, 1) * 98;
  ctx.fillStyle = '#ff9b5e';
  S4.pts.forEach(([U, I]) => { ctx.beginPath(); ctx.arc(toX(U), toY(I), 2.6, 0, TAU); ctx.fill(); });
  ctx.beginPath(); ctx.arc(toX(u), toY(i), 3.6, 0, TAU); ctx.strokeStyle = '#ffd9a8'; ctx.stroke();
}

/* ---------- 05 RC 充放电 ---------- */
const S5 = { mode: 'off', speed: 0.3, trace: [], t: 0 };
chap({
  id: 'rc', title: 'RC 电路充放电',
  cam: [-0.2, 3.3, 4.8],
  tgt: [0, 1.22, 0],
  html: `<p>电容经电阻充电，电压沿指数曲线爬升：<span class="hl">u_C = E(1 − e^(−t/τ))</span>；放电则按 <span class="hl">u_C = E·e^(−t/τ)</span> 衰减。时间常数 <b>τ = RC</b>——一个 τ 充到 63%，工程上三到五个 τ 就算充满。</p>
<p>切换「充电 / 放电 / 断开」，盯住电压表读数与示波器上的指数曲线（慢放 ×0.3）。</p>`,
  tasks: [
    { key: 'chg', text: '切到「充电」，看电压表逼近 3V 的过程' },
    { key: 'dis', text: '切到「放电」，观察电压指数回落' },
  ],
  quiz: [
    { q: 'τ = RC 中 R、C 各扩大 10 倍，充电到 0.63E 所需时间变为原来的几倍？', opts: ['1 倍', '10 倍', '100 倍', '不变'], a: 2, ex: 'τ = RC，两者各 ×10，τ 变为 100 倍——充到同一比例所花时间也是 100 倍。' },
  ],
  enter() {
    enterBench(() => {
      CIR.dt = 0.001;
      addEl('bat1', { t: 'bat', x: -2.0, z: 0.4, label: '电源 3V', E: 3, r: 0.2, a: 1, b: 0 });
      addEl('sw', { t: 'sw', x: -1.1, z: 0.4, label: '开关 S₁（充电）', R: 1e9, a: 1, b: 2 });
      addEl('res', { t: 'res', x: -0.2, z: 0.4, label: 'R = 100 Ω', R: 100, a: 2, b: 3 });
      addEl('cap', { t: 'cap', x: 0.9, z: 0.4, label: 'C = 1000 μF', C: 1e-3, vc0: 0, a: 3, b: 0 });
      addEl('swd', { t: 'sw', x: 1.7, z: -0.35, label: '开关 S₂（放电）', R: 1e9, a: 3, b: 0, ry: 0.5 });
      addEl('vol', { t: 'gauge', sub: 'V', x: 0.2, z: -0.5, label: '电压表', R: 1e7, a: 3, b: 0, ry: Math.PI });
      const y0 = TABLE_Y + 0.06;
      W_([[-2.22, TABLE_Y + 0.34, 0.4], [-2.5, y0, 0.4], [-2.5, y0, -0.7], [0.2, y0, -0.7], [0.2, TABLE_Y + 0.2, -0.56]], 'bat1');
      W_([[-1.78, TABLE_Y + 0.34, 0.4], [-1.4, y0, 0.4], [-1.28, y0, 0.4]], 'bat1');
      W_([[-0.92, y0, 0.4], [-0.55, y0, 0.4], [-0.35, TABLE_Y + 0.16, 0.4]], 'sw');
      W_([[-0.05, TABLE_Y + 0.16, 0.4], [0.3, y0, 0.4], [0.66, TABLE_Y + 0.2, 0.4]], 'res');
      W_([[1.14, TABLE_Y + 0.2, 0.4], [1.6, y0, 0.4], [1.6, y0, -0.2]], 'cap');
      W_([[1.55, TABLE_Y + 0.08, -0.3], [1.15, y0, -0.42], [0.66, y0, -0.52]], 'swd');
      drawSchem([
        { kind: 'wire', x1: 22, y1: 116, x2: 44, y2: 116 },
        { kind: 'bat', sx: 54, sy: 116, dir: 'v', sub: '3V' },
        { kind: 'wire', x1: 54, y1: 92, x2: 54, y2: 40 },
        { kind: 'sw', sx: 54, sy: 30, dir: 'h', closed: false, sub: 'S₁' },
        { kind: 'wire', x1: 62, y1: 30, x2: 94, y2: 30 },
        { kind: 'res', sx: 108, sy: 30, dir: 'h', sub: 'R' },
        { kind: 'wire', x1: 120, y1: 30, x2: 150, y2: 30 },
        { kind: 'node', sx: 150, sy: 30 },
        { kind: 'cap', sx: 162, sy: 30, dir: 'v', sub: 'C' },
        { kind: 'wire', x1: 162, y1: 42, x2: 162, y2: 116 },
        { kind: 'vol', sx: 106, sy: 74, dir: 'h', sub: 'V' },
        { kind: 'wire', x1: 150, y1: 30, x2: 150, y2: 74 },
        { kind: 'wire', x1: 118, y1: 74, x2: 162, y2: 74 },
        { kind: 'node', sx: 162, sy: 116 },
        { kind: 'wire', x1: 162, y1: 116, x2: 22, y2: 116 },
        { kind: 'sw', sx: 216, sy: 74, dir: 'v', closed: false, sub: 'S₂' },
        { kind: 'wire', x1: 162, y1: 74, x2: 216, y2: 74 },
        { kind: 'wire', x1: 216, y1: 62, x2: 216, y2: 30 },
        { kind: 'wire', x1: 216, y1: 86, x2: 216, y2: 116 },
        { kind: 'node', sx: 216, sy: 116 },
      ]);
    });
    app.setCamera([-0.2, 3.3, 4.8], [0, 1.22, 0]);
    ctl.clear();
    const btns = [];
    const paint = () => btns.forEach(({ b, v }) => b.classList.toggle('active', v === S5.mode));
    [['off', '断开'], ['chg', '充电'], ['dis', '放电']].forEach(([v, t]) => {
      const b = ctl.button({ label: t, onClick() { setMode5(v); paint(); } });
      btns.push({ b, v });
    });
    paint();
    ctl.sep();
    ctl.button({ label: '↺ 电容清零', onClick() { CIR.els.get('cap').vc = 0; S5.trace.length = 0; S5.t = 0; solveNow(); updRc(); } });
    setHUD([['mode', '状态'], ['uc', '电容电压 u_C'], ['tau', 'τ = RC = 0.1 s'], ['note', '指数充放电']]);
    setMode5('off');
  },
});
function setMode5(m) {
  S5.mode = m;
  setSwitchLogic('sw', m === 'chg');
  setSwitchVisual('sw', m === 'chg');
  setSwitchLogic('swd', m === 'dis');
  setSwitchVisual('swd', m === 'dis');
  S5.trace.length = 0; S5.t = 0;
  drawRcScope();
}
function drawRcScope() {
  const sc = makeScope('u_C – t 曲线');
  scopeBase('t/s', 'u_C/V');
  const ctx = sc.ctx;
  const toX = (t) => 24 + clamp(t / 0.8, 0, 1) * 180;
  const toY = (u) => 112 - clamp(u / 3.3, 0, 1) * 98;
  ctx.strokeStyle = '#55606a'; ctx.setLineDash([2, 3]);
  ctx.beginPath(); ctx.moveTo(toX(0), toY(3)); ctx.lineTo(toX(0.8), toY(3)); ctx.stroke();
  ctx.setLineDash([]);
  ctx.strokeStyle = '#ff9b5e'; ctx.lineWidth = 1.6;
  ctx.beginPath();
  S5.trace.forEach(([t, u], i) => { const x = toX(t), y = toY(u); if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); });
  ctx.stroke();
  ctx.fillStyle = '#8a98a6'; ctx.font = '8px sans-serif';
  ctx.fillText('E=3V', 30, toY(3) - 3);
}
function updRc() {
  const cap = CIR.els.get('cap');
  const u = cap.V;
  setNeedle('vol', Math.abs(u) / 3.3);
  hset('mode', S5.mode === 'chg' ? '充电中 u_C ↑' : S5.mode === 'dis' ? '放电中 u_C ↓' : '断开（保持）');
  hset('uc', Math.abs(u).toFixed(2) + ' V');
  hset('note', Math.abs(u) > 1.9 ? '充到 63% 用了 1 个 τ' : 'u_C = E(1−e^(−t/τ))');
}

/* ---------- 06 断电自感 ---------- */
const S6 = { closed: true, trace: [] };
chap({
  id: 'selfind', title: '断电自感现象',
  cam: [-0.2, 3.3, 4.8],
  tgt: [0, 1.22, 0],
  html: `<p>线圈里的电流一旦要变，线圈就产生<b>自感电动势</b>跟它作对（楞次定律）。开关断开的一瞬间：线圈电流不容突变，只能经灯泡强行续流——<b>灯泡先猛地闪亮一下</b>再慢慢熄灭，这就是断电自感。</p>
<p>稳态下线圈（阻值小）分流多、灯偏暗；断开后线圈摇身变成「临时电源」，把储存在磁场里的能量倾倒给灯泡。</p>
<p>开合开关，看灯泡亮度与电流曲线（慢放）。</p>`,
  tasks: [
    { key: 'off', text: '断开开关，抓住灯泡「闪亮」瞬间' },
    { key: 'reset', text: '复位后再闭合，观察稳态两支路电流分配' },
  ],
  quiz: [
    { q: '断电瞬间灯泡为什么反而「闪亮」一下？', opts: ['电源电压突然升高', '线圈释放磁场能形成续流大电流', '灯丝电阻突然变小', '电压表读数反串'], a: 1, ex: '稳态时线圈支路电流大；断开后这份电流全部改道流经灯泡，瞬间超过灯泡稳态电流——闪亮随后随能量耗尽而熄灭。' },
  ],
  enter() {
    enterBench(() => {
      CIR.dt = 0.001;
      addEl('bat1', { t: 'bat', x: -2.0, z: 0.4, label: '电源 3V', E: 3, r: 0.2, a: 1, b: 0 });
      addEl('sw', { t: 'sw', x: -1.1, z: 0.4, label: '开关 S', R: 1e-4, a: 1, b: 2 });
      addEl('blA', { t: 'bulb', x: -0.1, z: 0.4, label: '灯 A', R: 12, a: 2, b: 5 });
      addEl('ind', { t: 'ind', x: 1.0, z: 0.4, label: '线圈 L（电阻小）', L: 2, a: 2, b: 3 });
      addEl('rc', { t: 'res', x: 1.0, z: 0.4, label: '线圈直流电阻 4Ω', R: 4, a: 3, b: 0 });
      addEl('vol', { t: 'gauge', sub: 'A', x: 0.5, z: -0.5, label: '灯 A 电流', R: 1e-3, a: 5, b: 0, ry: Math.PI });
      CIR.N = 6;
      const y0 = TABLE_Y + 0.06;
      W_([[-2.22, TABLE_Y + 0.34, 0.4], [-2.5, y0, 0.4], [-2.5, y0, -0.7], [0.5, y0, -0.7], [0.5, TABLE_Y + 0.2, -0.56]], 'bat1');
      W_([[-1.78, TABLE_Y + 0.34, 0.4], [-1.4, y0, 0.4], [-1.28, y0, 0.4]], 'bat1');
      W_([[-0.92, y0, 0.4], [-0.6, y0, 0.4], [-0.4, TABLE_Y + 0.4, 0.4]], 'sw');
      W_([[0.2, TABLE_Y + 0.4, 0.4], [0.5, y0, 0.4], [0.72, TABLE_Y + 0.2, 0.4]], 'blA');
      W_([[0.5, y0, 0.4], [0.5, y0, 0.16], [0.78, TABLE_Y + 0.2, 0.16]], 'blA');
      W_([[1.22, TABLE_Y + 0.2, 0.4], [1.7, y0, 0.4], [1.7, y0, -0.7]], 'ind');
      drawSchem([
        { kind: 'wire', x1: 24, y1: 116, x2: 44, y2: 116 },
        { kind: 'bat', sx: 54, sy: 116, dir: 'v', sub: '3V' },
        { kind: 'wire', x1: 54, y1: 92, x2: 54, y2: 40 },
        { kind: 'sw', sx: 54, sy: 30, dir: 'h', closed: S6.closed, sub: 'S' },
        { kind: 'wire', x1: 62, y1: 30, x2: 96, y2: 30 },
        { kind: 'node', sx: 96, sy: 30 },
        { kind: 'bulb', sx: 110, sy: 30, dir: 'h', sub: '灯A' },
        { kind: 'wire', x1: 122, y1: 30, x2: 96, y2: 30 },
        { kind: 'wire', x1: 96, y1: 30, x2: 96, y2: 64 },
        { kind: 'ind', sx: 96, sy: 76, dir: 'v', sub: 'L' },
        { kind: 'wire', x1: 96, y1: 88, x2: 96, y2: 116 },
        { kind: 'res', sx: 150, sy: 76, dir: 'h', sub: 'r' },
        { kind: 'wire', x1: 96, y1: 76, x2: 138, y2: 76 },
        { kind: 'wire', x1: 162, y1: 76, x2: 196, y2: 76 },
        { kind: 'wire', x1: 196, y1: 76, x2: 196, y2: 116 },
        { kind: 'node', sx: 196, sy: 116 },
        { kind: 'wire', x1: 196, y1: 116, x2: 24, y2: 116 },
      ]);
    });
    app.setCamera([-0.2, 3.3, 4.8], [0, 1.22, 0]);
    ctl.clear();
    ctl.toggle({ label: '开关 S', value: true, onChange: (v) => { S6.closed = v; setSwitchLogic('sw', v); setSwitchVisual('sw', v); S6.trace.length = 0; updSelf(); } });
    ctl.sep();
    ctl.button({ label: '↺ 复位线圈电流', onClick() { CIR.els.get('ind').iL = 0; S6.trace.length = 0; solveNow(); updSelf(); } });
    setHUD([['sw', '开关'], ['il', '线圈电流'], ['ia', '灯 A 电流'], ['note', '断开瞬间灯闪亮']]);
    updSelf();
  },
});
function updSelf() {
  solveNow();
  const blA = CIR.els.get('blA'), ind = CIR.els.get('ind');
  const ia = Math.abs(blA.I);
  bulbGlow('blA', ia / 0.28);
  setNeedle('vol', ia / 0.8);
  hset('sw', S6.closed ? '闭合（稳态）' : '断开（续流）');
  hset('il', Math.abs(ind.I).toFixed(3) + ' A');
  hset('ia', ia.toFixed(3) + ' A' + (ia > 0.3 ? ' ← 闪亮！' : ''));
  hset('note', S6.closed ? '线圈分流，灯较暗' : ia > 0.3 ? '磁场能倒给灯泡' : '电流指数衰减');
  const sc = makeScope('灯 A 电流 i – t');
  scopeBase('t/s', 'i/A');
  const ctx = sc.ctx;
  S6.trace.push([S6.trace.length * 0.004, ia]);
  if (S6.trace.length > 200) S6.trace.shift();
  const toX = (t) => 24 + (t / 0.8) * 180;
  const toY = (i) => 112 - clamp(i / 0.9, 0, 1) * 98;
  ctx.strokeStyle = '#ff9b5e'; ctx.lineWidth = 1.6;
  ctx.beginPath();
  S6.trace.forEach(([t, i], k) => { const x = toX(t), y = toY(i); if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); });
  ctx.stroke();
}

/* ---------- 07 LC 振荡 ---------- */
const S7 = { running: false, trace: [] };
chap({
  id: 'lc', title: 'LC 振荡电路',
  cam: [-0.3, 3.3, 4.8],
  tgt: [-0.1, 1.22, 0],
  html: `<p>给电容充上电再让它经电感放电：<b>电场能</b>与<b>磁场能</b>来回倒手，电压与电流按正弦规律来回摆——<span class="hl">f = 1 / (2π√(LC))</span>。</p>
<p>理想 LC 回路能一直振下去；真实线圈总带着电阻，振荡幅度逐圈缩小（阻尼振荡）——<b>电阻越大，衰减越急</b>。无线电广播的频率选择正源于这类振荡。</p>
<p>点「合上开关」看电压表指针摆动与波形（慢放 ×0.1）。</p>`,
  tasks: [
    { key: 'run', text: '合上开关，观察指针减幅摆动（阻尼振荡）' },
    { key: 're', text: '重新充电再来一遍，对比波形相位' },
  ],
  quiz: [
    { q: 'LC 回路中电容电压为零的时刻，能量主要储存在哪里？', opts: ['电容电场中', '电感磁场中', '电阻发热中', '电源中'], a: 1, ex: 'u_C = 0 时 i_L 达到峰值，磁场能 ½LI² 最大——两类能量每四分之一周期完成一次交接。' },
  ],
  enter() {
    enterBench(() => {
      CIR.dt = 0.0005;
      addEl('cap', { t: 'cap', x: -1.4, z: 0.4, label: 'C = 0.5 F（已充电 3V）', C: 0.5, vc0: 3, a: 1, b: 2 });
      addEl('ind', { t: 'ind', x: 0, z: 0.4, label: 'L = 0.5 H', L: 0.5, a: 2, b: 0 });
      addEl('sw', { t: 'sw', x: 1.2, z: 0.4, label: '开关 S', R: 1e9, a: 0, b: 1 });
      addEl('vol', { t: 'gauge', sub: 'V', x: 0.4, z: -0.5, label: '电容电压', R: 1e7, a: 1, b: 2, ry: Math.PI });
      const y0 = TABLE_Y + 0.06;
      W_([[-1.16, TABLE_Y + 0.2, 0.4], [-0.75, y0, 0.4], [-0.4, TABLE_Y + 0.2, 0.4]], 'cap');
      W_([[0.4, TABLE_Y + 0.2, 0.4], [0.85, y0, 0.4], [1.0, y0, 0.4]], 'ind');
      W_([[1.42, y0, 0.4], [2.0, y0, 0.4], [2.0, y0, -0.7], [0.4, y0, -0.7], [0.4, TABLE_Y + 0.2, -0.56]], 'sw');
      W_([[-1.64, TABLE_Y + 0.2, 0.4], [-2.1, y0, 0.4], [-2.1, y0, -0.55], [0.4, y0, -0.55], [0.4, TABLE_Y + 0.2, -0.56]], 'cap');
      drawSchem([
        { kind: 'cap', sx: 50, sy: 60, dir: 'v', sub: 'C' },
        { kind: 'wire', x1: 50, y1: 36, x2: 50, y2: 24 },
        { kind: 'wire', x1: 50, y1: 24, x2: 150, y2: 24 },
        { kind: 'ind', sx: 100, sy: 60, dir: 'h', sub: 'L' },
        { kind: 'wire', x1: 150, y1: 24, x2: 150, y2: 60 },
        { kind: 'ind', sx: 120, sy: 96, dir: 'h', sub: ' ' },
        { kind: 'wire', x1: 150, y1: 60, x2: 150, y2: 132 },
        { kind: 'wire', x1: 150, y1: 132, x2: 50, y2: 132 },
        { kind: 'wire', x1: 50, y1: 132, x2: 50, y2: 84 },
        { kind: 'sw', sx: 176, sy: 78, dir: 'v', closed: S7.running, sub: 'S' },
        { kind: 'wire', x1: 150, y1: 78, x2: 168, y2: 78 },
        { kind: 'vol', sx: 100, sy: 60, dir: 'h', sub: 'V' },
        { kind: 'wire', x1: 50, y1: 60, x2: 88, y2: 60 },
        { kind: 'wire', x1: 112, y1: 60, x2: 150, y2: 60 },
      ]);
    });
    app.setCamera([-0.3, 3.3, 4.8], [-0.1, 1.22, 0]);
    ctl.clear();
    ctl.button({ label: '⏻ 合上开关（开始振荡）', onClick() { S7.running = true; setSwitchLogic('sw', true); setSwitchVisual('sw', true); S7.trace.length = 0; } });
    ctl.button({ label: '↺ 重新充电', onClick() { CIR.els.get('cap').vc = 3; CIR.els.get('ind').iL = 0; setSwitchLogic('sw', false); setSwitchVisual('sw', false); S7.running = false; S7.trace.length = 0; solveNow(); updLc(); } });
    setHUD([['f0', '固有频率 f₀'], ['uc', 'u_C'], ['il', 'i_L'], ['note', '电场能 ⇄ 磁场能']]);
    solveNow();
    updLc();
  },
});
function updLc() {
  const cap = CIR.els.get('cap'), ind = CIR.els.get('ind');
  setNeedle('vol', Math.abs(cap.V) / 3.3);
  hset('f0', (1 / (2 * Math.PI * Math.sqrt(0.5 * 0.5))).toFixed(2) + ' Hz');
  hset('uc', Math.abs(cap.V).toFixed(2) + ' V');
  hset('il', Math.abs(ind.I).toFixed(3) + ' A');
  const E = 0.5 * 0.5 * cap.V * cap.V + 0.5 * 0.5 * ind.iL * ind.iL;
  hset('note', '总能量 ' + (E * 1000).toFixed(1) + ' mJ（缓降）');
}

/* ---------- 08 桥式整流·电容滤波 ---------- */
const S8 = { filt: false, trace: [], tt: 0 };
chap({
  id: 'bridge', title: '整流桥与电容的滤波',
  cam: [-0.3, 3.4, 5.0],
  tgt: [0, 1.22, 0],
  html: `<p>四只二极管首尾搭成<b>电桥</b>：正半周 D₁D₃ 通行，负半周 D₂D₄ 通行——两对人马「轮班」，把交流拧成<b>脉动直流</b>（方向不再变，大小仍在起伏）。</p>
<p>再给输出并上一只<b>滤波电容</b>：电压上冲时它存电，电压回落时它放电，把一个个「波谷」填平，输出就接近平滑直流了。手机充电器里跑的正是这套组合。</p>
<p>切换「滤波电容」，对照示波器上输出波形的变化。</p>`,
  tasks: [
    { key: 'nofilt', text: '先不加电容，看清「全波脉动」波形' },
    { key: 'filt', text: '合上滤波开关，对比波形被填平的过程' },
  ],
  quiz: [
    { q: '不接滤波电容时，整流桥的输出每个工频周期（50Hz）出现几个波峰？', opts: ['1 个', '2 个', '4 个', '50 个'], a: 1, ex: '正负半周各被「翻」上来一次——全波整流每周期 2 个波峰（100Hz 纹波）。' },
  ],
  enter() {
    enterBench(() => {
      CIR.dt = 1e-4;
      addEl('ac', { t: 'ac', x: -2.0, z: 0.4, label: '交流 6V 50Hz', kind: 'ac', E: 6, r: 0.3, a: 1, b: 0 });
      CIR.els.get('ac').kind = 'ac';
      addEl('d1', { t: 'dio', x: -1.1, z: 0.62, label: 'D₁', a: 1, b: 3 });
      addEl('d2', { t: 'dio', x: -1.1, z: 0.18, label: 'D₂', a: 2, b: 3 });
      addEl('d3', { t: 'dio', x: 0.3, z: 0.62, label: 'D₃', a: 4, b: 1 });
      addEl('d4', { t: 'dio', x: 0.3, z: 0.18, label: 'D₄', a: 4, b: 2 });
      addEl('load', { t: 'res', x: 1.2, z: 0.4, label: '负载 R = 200Ω', R: 200, a: 3, b: 4 });
      addEl('cf', { t: 'cap', x: 1.9, z: 0.4, label: '滤波电容 470μF', C: 4.7e-4, vc0: 0, a: 3, b: 4 });
      CIR.N = 5;
      const y0 = TABLE_Y + 0.06;
      W_([[-2.22, TABLE_Y + 0.16, 0.4], [-1.4, y0, 0.62], [-1.25, TABLE_Y + 0.14, 0.62]], 'ac');
      W_([[-2.22, TABLE_Y + 0.16, 0.4], [-1.4, y0, 0.18], [-1.25, TABLE_Y + 0.14, 0.18]], 'ac');
      W_([[-0.94, TABLE_Y + 0.14, 0.62], [0.1, y0, 0.62], [0.14, TABLE_Y + 0.14, 0.62]], 'd1');
      W_([[-0.94, TABLE_Y + 0.14, 0.18], [0.1, y0, 0.18], [0.14, TABLE_Y + 0.14, 0.18]], 'd2');
      W_([[0.46, TABLE_Y + 0.14, 0.62], [1.6, y0, 0.62], [1.9, y0, 0.5]], 'd3');
      W_([[0.46, TABLE_Y + 0.14, 0.18], [1.6, y0, 0.18], [1.9, y0, 0.3]], 'd4');
      W_([[1.34, y0, 0.4], [1.75, y0, 0.4]], 'load');
      W_([[2.1, y0, 0.4], [2.5, y0, 0.4], [2.5, y0, -0.7], [0.2, y0, -0.7], [0.2, TABLE_Y + 0.1, -0.45]], 'cf');
      drawSchem([
        { kind: 'wire', x1: 30, y1: 116, x2: 46, y2: 116 },
        { kind: 'node', sx: 38, sy: 60 },
        { kind: 'wire', x1: 38, y1: 60, x2: 38, y2: 116 },
        { kind: 'wire', x1: 38, y1: 60, x2: 30, y2: 60 },
        { kind: 'wire', x1: 38, y1: 60, x2: 38, y2: 30 },
        { kind: 'wire', x1: 38, y1: 30, x2: 46, y2: 30 },
        { kind: 'dio', sx: 58, sy: 30, dir: 'h', sub: 'D1' },
        { kind: 'wire', x1: 70, y1: 30, x2: 96, y2: 30 },
        { kind: 'node', sx: 96, sy: 30 },
        { kind: 'dio', sx: 58, sy: 88, dir: 'h', sub: 'D3' },
        { kind: 'wire', x1: 70, y1: 88, x2: 82, y2: 88 },
        { kind: 'node', sx: 82, sy: 88 },
        { kind: 'wire', x1: 96, y1: 30, x2: 96, y2: 132 },
        { kind: 'dio', sx: 108, sy: 88, dir: 'h', sub: 'D2' },
        { kind: 'wire', x1: 82, y1: 88, x2: 96, y2: 88 },
        { kind: 'wire', x1: 120, y1: 88, x2: 150, y2: 88 },
        { kind: 'dio', sx: 162, sy: 88, dir: 'h', sub: 'D4' },
        { kind: 'wire', x1: 174, y1: 88, x2: 196, y2: 88 },
        { kind: 'wire', x1: 196, y1: 88, x2: 196, y2: 132 },
        { kind: 'wire', x1: 96, y1: 30, x2: 150, y2: 30 },
        { kind: 'wire', x1: 162, y1: 30, x2: 196, y2: 30 },
        { kind: 'wire', x1: 196, y1: 30, x2: 196, y2: 46 },
        { kind: 'res', sx: 160, sy: 52, dir: 'v', sub: 'R' },
        { kind: 'wire', x1: 196, y1: 62, x2: 196, y2: 88 },
        { kind: 'cap', sx: 222, sy: 52, dir: 'v', sub: 'C' },
        { kind: 'wire', x1: 196, y1: 30, x2: 222, y2: 30 },
        { kind: 'wire', x1: 222, y1: 40, x2: 222, y2: 30 },
        { kind: 'wire', x1: 222, y1: 64, x2: 222, y2: 132 },
        { kind: 'wire', x1: 222, y1: 132, x2: 30, y2: 132 },
        { kind: 'wire', x1: 96, y1: 132, x2: 96, y2: 116 },
        { kind: 'wire', x1: 96, y1: 116, x2: 30, y2: 116 },
        { kind: 'wire', x1: 30, y1: 116, x2: 30, y2: 60 },
      ]);
    });
    app.setCamera([-0.3, 3.4, 5.0], [0, 1.22, 0]);
    ctl.clear();
    ctl.toggle({ label: '滤波电容', value: S8.filt, onChange: (v) => { S8.filt = v; CIR.els.get('cf').blown = !v; CIR.els.get('cf').vc = 0; solveNow(); } });
    CIR.els.get('cf').blown = !S8.filt;   // 初始先看未滤波的脉动直流
    ctl.sep();
    ctl.button({ label: '↺ 复位', onClick() { S8.trace.length = 0; S8.tt = 0; } });
    setHUD([['d', '二极管导通'], ['u2', '输出电压'], ['rip', '纹波'], ['note', 'AC → 脉动直流 → 平滑直流']]);
  },
});
function updBridge() {
  const d1 = CIR.els.get('d1'), d2 = CIR.els.get('d2');
  const ph = CIR.els.get('ac').E >= 0;
  hset('d', d1.I > 1e-4 ? '正半周：D₁ D₃' : d2.I > 1e-4 ? '负半周：D₂ D₄' : '换向瞬间');
  const u2 = CIR.els.get('load').V;
  hset('u2', u2.toFixed(2) + ' V');
  hset('rip', S8.filt ? (CIR.els.get('cf').vc > 4 ? '小（电容已充起）' : '充电中…') : '大（无滤波，50Hz 脉包）');
}

/* ---------- 09 惠斯通电桥 ---------- */
const S9 = { R3: 8, balanced: false };
chap({
  id: 'bridgeW', title: '电桥平衡法精测电阻',
  cam: [-0.3, 3.4, 4.9],
  tgt: [-0.3, 1.22, 0],
  html: `<p>四只电阻摆成「桥」：R₁/R₂ 与 R₃/R_x 是两个分压臂，中间架一只灵敏电流计 <b>G</b>。调 R₃ 让 G 的读数归 <b>0</b>（桥平衡），意味着两中间点电位相同：</p>
<p><span class="hl">R_x = (R₂ / R₁) · R₃</span>——三只已知电阻把未知量精确「称」出来，结果与电源电压、电流计灵敏度都无关。</p>
<p>调 R₃ 使 G 指零，读出 R_x。</p>`,
  tasks: [
    { key: 'balance', text: '把 R₃ 调到 G 指零，读出 Rx' },
    { key: 'dir', text: '故意调偏，看指针偏转方向提示' },
  ],
  quiz: [
    { q: '电桥平衡后把电源电压调高一些，平衡关系会被打破吗？', opts: ['立刻失衡', '仍然平衡', 'G 反向偏转', 'R₃ 需要减半'], a: 1, ex: '平衡只取决于四臂阻值的比例 R₂/R₁ = R_x/R₃，与电源电压无关——这正是电桥法精密的来源。' },
  ],
  enter() {
    enterBench(() => {
      CIR.dt = 0.002;
      addEl('bat1', { t: 'bat', x: 0.8, z: 0.62, label: '电源 3V', E: 3, r: 0.3, a: 1, b: 0 });
      addEl('sw', { t: 'sw', x: 0.0, z: 0.62, label: '开关', R: 1e-4, a: 1, b: 2 });
      addEl('r1', { t: 'res', x: -1.3, z: 0.62, label: 'R₁ = 10Ω', R: 10, a: 2, b: 3 });
      addEl('r2', { t: 'res', x: -1.9, z: 0.0, label: 'R₂ = 10Ω', R: 10, a: 3, b: 0 });
      addEl('rh', { t: 'rheo', x: 0.2, z: 0.62, label: '可调 R₃', R: S9.R3, a: 2, b: 4 });
      addEl('rx', { t: 'res', x: 1.7, z: 0.62, label: '待测 Rx', R: 8, a: 4, b: 0 });
      addEl('gal', { t: 'gauge', sub: 'G', x: -0.6, z: 0.0, label: '灵敏电流计', R: 30, a: 3, b: 4, ry: Math.PI });
      CIR.N = 5;
      const y0 = TABLE_Y + 0.06;
      W_([[1.02, TABLE_Y + 0.34, 0.62], [1.35, y0, 0.62]], 'bat1');
      W_([[0.58, TABLE_Y + 0.34, 0.62], [0.28, y0, 0.62], [0.22, y0, 0.62]], 'sw');
      W_([[-0.22, y0, 0.62], [-1.0, y0, 0.62], [-1.08, TABLE_Y + 0.16, 0.62]], 'sw');
      W_([[-1.52, TABLE_Y + 0.16, 0.62], [-2.2, y0, 0.62], [-2.2, y0, 0.16], [-2.05, TABLE_Y + 0.16, 0.05]], 'r1');
      W_([[-1.74, TABLE_Y + 0.16, 0.0], [-2.2, y0, 0.0], [-2.2, y0, -0.7], [1.9, y0, -0.7], [1.9, y0, 0.62]], 'r2');
      W_([[-1.08, TABLE_Y + 0.16, 0.62], [-0.8, y0, 0.62], [-0.4, y0, 0.62]], 'r1');
      W_([[0.51, y0, 0.62], [1.0, y0, 0.62], [1.42, TABLE_Y + 0.16, 0.62]], 'rh');
      W_([[1.98, TABLE_Y + 0.16, 0.62], [2.5, y0, 0.62], [2.5, y0, -0.7]], 'rx');
      W_([[-0.74, TABLE_Y + 0.1, 0.0], [-1.0, y0, 0.0], [-1.2, y0, 0.0]], 'gal');
      W_([[-0.46, TABLE_Y + 0.1, 0.0], [0.1, y0, 0.0], [0.1, y0, 0.3], [0.1, y0, 0.62]], 'gal');
      drawSchem([
        { kind: 'node', sx: 60, sy: 26 },
        { kind: 'wire', x1: 60, y1: 26, x2: 100, y2: 26 },
        { kind: 'sw', sx: 112, sy: 26, dir: 'h', closed: true, sub: 'S' },
        { kind: 'wire', x1: 120, y1: 26, x2: 150, y2: 26 },
        { kind: 'bat', sx: 160, sy: 60, dir: 'v', sub: '3V' },
        { kind: 'wire', x1: 150, y1: 26, x2: 150, y2: 38 },
        { kind: 'wire', x1: 150, y1: 26, x2: 150, y2: 26 },
        { kind: 'wire', x1: 150, y1: 82, x2: 150, y2: 132 },
        { kind: 'wire', x1: 150, y1: 132, x2: 40, y2: 132 },
        { kind: 'wire', x1: 40, y1: 132, x2: 40, y2: 26 },
        { kind: 'wire', x1: 40, y1: 26, x2: 60, y2: 26 },
        { kind: 'node', sx: 40, sy: 26 },
        { kind: 'res', sx: 100, sy: 26, dir: 'h', sub: 'R1' },
        { kind: 'wire', x1: 60, y1: 26, x2: 88, y2: 26 },
        { kind: 'wire', x1: 112, y1: 26, x2: 138, y2: 26 },
        { kind: 'node', sx: 138, sy: 26 },
        { kind: 'rheo', sx: 90, sy: 26, dir: 'v', sub: 'R3' },
        { kind: 'wire', x1: 40, y1: 26, x2: 40, y2: 80 },
        { kind: 'wire', x1: 40, y1: 80, x2: 78, y2: 80 },
        { kind: 'gal', sx: 92, sy: 80, dir: 'h', sub: 'G' },
        { kind: 'wire', x1: 104, y1: 80, x2: 138, y2: 80 },
        { kind: 'wire', x1: 138, y1: 26, x2: 138, y2: 52 },
        { kind: 'rheo', sx: 138, sy: 66, dir: 'v', sub: 'Rx' },
        { kind: 'wire', x1: 138, y1: 80, x2: 138, y2: 88 },
        { kind: 'node', sx: 150, sy: 26 },
      ]);
    });
    app.setCamera([-0.3, 3.4, 4.9], [-0.3, 1.22, 0]);
    ctl.clear();
    ctl.slider({ label: '可调电阻 R₃', min: 1, max: 30, step: 0.25, value: S9.R3, fmt: (v) => v.toFixed(2) + ' Ω', onInput: (v) => { S9.R3 = v; CIR.els.get('rh').R = v; setSliderVisual('rh', (v - 1) / 29); solveNow(); updBridgeW(); } });
    setHUD([['ig', 'G 读数'], ['dir', '偏转方向'], ['rx', 'Rx 读数'], ['tip', 'G 指零即平衡']]);
    solveNow();
    updBridgeW();
  },
});
function updBridgeW() {
  const gal = CIR.els.get('gal');
  const ig = gal.I;
  const frac = clamp(0.5 + ig * 1.2, 0, 1);
  setNeedle('gal', frac);
  const bal = Math.abs(ig) < 0.002;
  hset('ig', Math.abs(ig * 1000).toFixed(1) + ' mA');
  hset('dir', bal ? '✓ 指零——桥平衡！' : ig > 0 ? '右偏 → R₃ 偏大，调小' : '左偏 → R₃ 偏小，调大');
  hset('rx', bal ? `R₂R₃/R₁ = ${S9.R3.toFixed(2)} Ω ✓` : '——（先调平衡）');
  hset('tip', 'R₃ ≈ 8 Ω 附近找指零点');
}

/* ---------- 10 RLC 串联谐振 ---------- */
const S10 = { f: 60, U: 4 };
chap({
  id: 'rlc', title: 'RLC 串联谐振',
  cam: [-0.2, 3.4, 5.0],
  tgt: [0, 1.22, 0],
  html: `<p>R、L、C 串起来接交流电源：感抗 X_L = 2πfL 随频率走高，容抗 X_C = 1/(2πfC) 随频率走低。当 <span class="hl">X_L = X_C</span> 时两者恰好对消，阻抗只剩 R，<b>电流冲到最大</b>——这就是谐振，f₀ = 1/(2π√(LC))。</p>
<p>谐振时电容或电感上的电压能冲到电源电压的 <b>Q 倍</b>（Q = √(L/C)/R，本电路 Q ≈ 10，电容上几十伏——比电源还高！）Q 越大，谐振峰越尖锐、选频本领越强。收音机调台，靠的就是可变电容改变 f₀。</p>
<p>拖频率滑杆，找电流表读数的峰。</p>`,
  tasks: [
    { key: 'find', text: '拖动频率，找到电流最大的谐振点' },
    { key: 'jump', text: '点「调到 f₀」直接命中谐振峰' },
  ],
  quiz: [
    { q: '谐振时电容两端电压可能超过电源电压，这违背能量守恒吗？', opts: ['违背，所以不可能', '不违背：L 与 C 周期性交换能量，高压是局部的', '违背，是测量误差', '只在 Q<1 时成立'], a: 1, ex: 'Q 倍电压是 L、C 之间来回倒手的「局部振荡」结果，能量仍来自电源、总量守恒——但确实说明谐振处绝缘要留足余量。' },
  ],
  enter() {
    enterBench(() => {
      CIR.dt = 0.002;
      addEl('ac', { t: 'ac', x: -1.9, z: 0.4, label: '交流 4V', kind: 'ac', E: 4, r: 0.1, a: 1, b: 0 });
      CIR.els.get('ac').kind = 'ac';
      addEl('r1', { t: 'res', x: -0.9, z: 0.4, label: 'R = 10Ω', R: 10, a: 1, b: 2 });
      addEl('ind', { t: 'ind', x: -0.1, z: 0.4, label: 'L = 0.1 H', L: 0.1, a: 2, b: 3 });
      addEl('cap', { t: 'cap', x: 0.8, z: 0.4, label: 'C = 10 μF', C: 1e-5, a: 3, b: 4 });
      addEl('am', { t: 'gauge', sub: 'A', x: 1.7, z: 0.4, label: '电流表', R: 1e-3, a: 4, b: 0 });
      CIR.N = 5;
      const y0 = TABLE_Y + 0.06;
      W_([[-2.12, TABLE_Y + 0.16, 0.4], [-1.35, y0, 0.4], [-1.12, TABLE_Y + 0.16, 0.4]], 'ac');
      W_([[-0.68, TABLE_Y + 0.16, 0.4], [-0.45, y0, 0.4], [-0.32, TABLE_Y + 0.2, 0.4]], 'r1');
      W_([[0.12, TABLE_Y + 0.2, 0.4], [0.4, y0, 0.4], [0.56, TABLE_Y + 0.2, 0.4]], 'ind');
      W_([[1.0, TABLE_Y + 0.2, 0.4], [1.25, y0, 0.4], [1.42, TABLE_Y + 0.16, 0.4]], 'cap');
      W_([[1.98, TABLE_Y + 0.16, 0.4], [2.5, y0, 0.4], [2.5, y0, -0.7], [-2.5, y0, -0.7], [-2.12, TABLE_Y + 0.16, 0.4]], 'am');
      drawSchem([
        { kind: 'wire', x1: 30, y1: 114, x2: 46, y2: 114 },
        { kind: 'wire', x1: 30, y1: 114, x2: 30, y2: 30 },
        { kind: 'wire', x1: 30, y1: 30, x2: 46, y2: 30 },
        { kind: 'res', sx: 58, sy: 30, dir: 'h', sub: 'R' },
        { kind: 'wire', x1: 70, y1: 30, x2: 92, y2: 30 },
        { kind: 'ind', sx: 106, sy: 30, dir: 'h', sub: 'L' },
        { kind: 'wire', x1: 118, y1: 30, x2: 140, y2: 30 },
        { kind: 'cap', sx: 154, sy: 30, dir: 'h', sub: 'C' },
        { kind: 'wire', x1: 166, y1: 30, x2: 188, y2: 30 },
        { kind: 'am', sx: 200, sy: 30, dir: 'h', sub: 'A' },
        { kind: 'wire', x1: 212, y1: 30, x2: 222, y2: 30 },
        { kind: 'wire', x1: 222, y1: 30, x2: 222, y2: 114 },
        { kind: 'wire', x1: 222, y1: 114, x2: 30, y2: 114 },
      ]);
    });
    app.setCamera([-0.2, 3.4, 5.0], [0, 1.22, 0]);
    ctl.clear();
    ctl.slider({ label: '电源频率 f', min: 20, max: 500, step: 5, value: S10.f, fmt: (v) => v + ' Hz', onInput: (v) => { S10.f = v; updRlc(); } });
    ctl.slider({ label: '电源电压', min: 1, max: 6, step: 0.5, value: S10.U, fmt: (v) => v.toFixed(1) + ' V', onInput: (v) => { S10.U = v; updRlc(); } });
    ctl.sep();
    ctl.button({ label: '⇦ 调到 f₀', onClick() { S10.f = 159; const sl = document.querySelector('#controls input[type=range]'); sl.value = 159; sl.dispatchEvent(new Event('input', { bubbles: true })); } });
    setHUD([['f0', '谐振频率'], ['xl', '感抗 X_L'], ['xc', '容抗 X_C'], ['i', '电流 I'], ['q', '品质因数 Q']]);
    updRlc();
  },
});
function updRlc() {
  const w = TAU * S10.f;
  const XL = w * 0.1, XC = 1 / (w * 1e-5);
  const Z = Math.sqrt(100 + (XL - XC) ** 2);
  const i = S10.U / Z;
  const Q = Math.sqrt(0.1 / 1e-5) / 10;
  setNeedle('am', i / 0.5);
  hset('f0', (1 / (2 * Math.PI * Math.sqrt(0.1 * 1e-5))).toFixed(0) + ' Hz');
  hset('xl', XL.toFixed(1) + ' Ω');
  hset('xc', XC.toFixed(1) + ' Ω');
  hset('i', i.toFixed(3) + ' A' + (Math.abs(S10.f - 159) < 6 ? ' ← 谐振峰！' : ''));
  hset('q', `Q = ${Q.toFixed(0)}；谐振时 U_C ≈ Q·U = ${(Q * S10.U).toFixed(0)} V`);
  const sc = makeScope('I – f 谐振曲线');
  scopeBase('f/Hz', 'I/A');
  const ctx = sc.ctx;
  const toX = (f) => 24 + (Math.log(f / 20) / Math.log(25)) * 180;
  const toY = (ii) => 112 - clamp(ii / 0.45, 0, 1) * 98;
  ctx.strokeStyle = '#6fb3e0'; ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (let k = 0; k <= 80; k++) {
    const f = 20 * Math.pow(25, k / 80);
    const w2 = TAU * f;
    const ii = S10.U / Math.sqrt(100 + (w2 * 0.1 - 1 / (w2 * 1e-5)) ** 2);
    const x = toX(f), y = toY(ii);
    if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.fillStyle = '#ff9b5e';
  ctx.beginPath(); ctx.arc(toX(S10.f), toY(i), 3.6, 0, TAU); ctx.fill();
}

/* ---------- 11 变压器原理 ---------- */
const S11 = { N1: 400, N2: 200, RL: 40 };
chap({
  id: 'xfmr', title: '变压器原理',
  cam: [-0.1, 3.4, 5.0],
  tgt: [0.2, 1.22, 0],
  html: `<p>两只线圈共绕一个铁芯：原线圈通入交流，铁芯里出现<b>变化的磁通</b>，副线圈靠<b>电磁感应</b>生出电压。理想变压器满足：</p>
<p><span class="hl">U₂ / U₁ = N₂ / N₁</span>（变压比 = 匝数比），同时 I₁N₁ ≈ I₂N₂（输入功率 ≈ 输出功率）。N₂&gt;N₁ 是升压，反之降压。电网先升压远送省损耗，到用户端再降下来。注意：变压器<b>拿恒定的直流没办法</b>——磁通不变，副线圈就什么也感应不出。</p>
<p>拧两个匝数旋钮，看副线圈电压与电流怎么变。</p>`,
  tasks: [
    { key: 'up', text: '把 N₂ 调到 N₁ 的两倍，验证 U₂ 翻倍' },
    { key: 'load', text: '调小负载电阻，观察副边电流上升' },
  ],
  quiz: [
    { q: '把变压器原边改接恒定直流，副边会发生什么？', opts: ['输出同比例直流', '输出为零（磁通不变化）', '输出交流但频率减半', '副边电压无穷大'], a: 1, ex: '感应电压来自磁通的变化率；恒定直流产生恒定磁通，dΦ/dt = 0，副边毫无输出。' },
  ],
  enter() {
    enterBench(() => {
      CIR.dt = 0.002;
      addEl('ac', { t: 'ac', x: -1.9, z: 0.4, label: '交流 6V', kind: 'ac', E: 6, r: 0.2, a: 1, b: 0 });
      CIR.els.get('ac').kind = 'ac';
      addEl('am1', { t: 'gauge', sub: 'A', x: -1.0, z: 0.4, label: '原线圈电流', R: 1e-3, a: 1, b: 2 });
      addEl('xf', { t: 'xfmr', x: 0.2, z: 0.4, label: '变压器' });
      addEl('vol1', { t: 'gauge', sub: 'V', x: 0.2, z: -0.55, label: 'U₁', R: 1e7, a: 1, b: 0, ry: Math.PI });
      addEl('vol2', { t: 'gauge', sub: 'V', x: 1.4, z: -0.55, label: 'U₂', R: 1e7, a: 3, b: 0, ry: Math.PI });
      addEl('rl', { t: 'rheo', x: 2.0, z: 0.4, label: '负载 R', R: S11.RL, a: 3, b: 0 });
      addEl('am2', { t: 'gauge', sub: 'A', x: 1.3, z: 0.4, label: '副线圈电流', R: 1e-3, a: 3, b: 4 });
      CIR.N = 5;
      const y0 = TABLE_Y + 0.06;
      W_([[-2.12, TABLE_Y + 0.16, 0.4], [-1.35, y0, 0.4], [-1.15, TABLE_Y + 0.16, 0.4]], 'ac');
      W_([[-0.85, TABLE_Y + 0.16, 0.4], [-0.55, y0, 0.4], [-0.28, y0, 0.4]], 'am1');
      W_([[-1.9, y0, 0.45], [-1.9, y0, -0.75], [0.2, y0, -0.75], [0.2, TABLE_Y + 0.2, -0.6]], 'ac');
      W_([[0.55, y0, 0.4], [1.15, y0, 0.4], [1.15, TABLE_Y + 0.16, 0.4]], 'xf');
      W_([[1.45, TABLE_Y + 0.16, 0.4], [1.75, y0, 0.4]], 'am2');
      W_([[1.35, TABLE_Y + 0.1, -0.5], [1.4, y0, -0.55], [1.72, y0, -0.55]], 'vol2');
      W_([[2.3, y0, 0.4], [2.6, y0, 0.4], [2.6, y0, -0.75], [-1.9, y0, -0.75]], 'rl');
      drawSchem([
        { kind: 'wire', x1: 34, y1: 118, x2: 50, y2: 118 },
        { kind: 'wire', x1: 34, y1: 118, x2: 34, y2: 30 },
        { kind: 'wire', x1: 34, y1: 30, x2: 50, y2: 30 },
        { kind: 'am', sx: 62, sy: 30, dir: 'h', sub: 'A1' },
        { kind: 'wire', x1: 74, y1: 30, x2: 96, y2: 30 },
        { kind: 'ind', sx: 110, sy: 74, dir: 'v', sub: 'N1' },
        { kind: 'wire', x1: 96, y1: 30, x2: 110, y2: 30 },
        { kind: 'wire', x1: 110, y1: 30, x2: 110, y2: 62 },
        { kind: 'wire', x1: 110, y1: 86, x2: 110, y2: 118 },
        { kind: 'wire', x1: 110, y1: 118, x2: 34, y2: 118 },
        { kind: 'vol', sx: 62, sy: 74, dir: 'h', sub: 'V1' },
        { kind: 'wire', x1: 74, y1: 74, x2: 98, y2: 74 },
        { kind: 'node', sx: 110, sy: 30 },
        { kind: 'ind', sx: 148, sy: 74, dir: 'v', sub: 'N2' },
        { kind: 'wire', x1: 110, y1: 30, x2: 148, y2: 30 },
        { kind: 'wire', x1: 148, y1: 30, x2: 148, y2: 62 },
        { kind: 'wire', x1: 148, y1: 86, x2: 148, y2: 104 },
        { kind: 'am', sx: 166, sy: 96, dir: 'h', sub: 'A2' },
        { kind: 'wire', x1: 148, y1: 96, x2: 154, y2: 96 },
        { kind: 'wire', x1: 178, y1: 96, x2: 210, y2: 96 },
        { kind: 'wire', x1: 210, y1: 96, x2: 210, y2: 118 },
        { kind: 'wire', x1: 210, y1: 118, x2: 110, y2: 118 },
        { kind: 'rheo', sx: 190, sy: 60, dir: 'v', sub: 'R' },
        { kind: 'wire', x1: 210, y1: 96, x2: 190, y2: 96 },
        { kind: 'wire', x1: 190, y1: 48, x2: 190, y2: 30 },
        { kind: 'wire', x1: 190, y1: 30, x2: 148, y2: 30 },
        { kind: 'node', sx: 148, sy: 30 },
        { kind: 'vol', sx: 166, sy: 52, dir: 'h', sub: 'V2' },
        { kind: 'wire', x1: 178, y1: 52, x2: 190, y2: 52 },
        { kind: 'wire', x1: 154, y1: 52, x2: 148, y2: 52 },
      ]);
    });
    app.setCamera([-0.1, 3.4, 5.0], [0.2, 1.22, 0]);
    ctl.clear();
    ctl.slider({ label: '原线圈匝数 N₁', min: 100, max: 1000, step: 20, value: S11.N1, fmt: (v) => v + ' 匝', onInput: (v) => { S11.N1 = v; updXfmr(); } });
    ctl.slider({ label: '副线圈匝数 N₂', min: 50, max: 1200, step: 10, value: S11.N2, fmt: (v) => v + ' 匝', onInput: (v) => { S11.N2 = v; updXfmr(); } });
    ctl.slider({ label: '负载电阻', min: 10, max: 120, step: 5, value: S11.RL, fmt: (v) => v + ' Ω', onInput: (v) => { S11.RL = v; CIR.els.get('rl').R = v; setSliderVisual('rl', (v - 10) / 110); updXfmr(); } });
    setHUD([['n', '匝数比 N₂/N₁'], ['u2', 'U₂ = U₁·n'], ['i2', 'I₂ = U₂/R'], ['i1', 'I₁ ≈ n·I₂']]);
    updXfmr();
  },
});
function updXfmr() {
  CIR.els.get('rl').R = S11.RL;
  solveNow();
  const i1 = Math.abs(CIR.els.get('am1').I);
  const n = S11.N2 / S11.N1;
  const u1 = 6;
  const u2 = u1 * n;
  const i2 = u2 / S11.RL;
  setNeedle('vol1', u1 / 8); setNeedle('vol2', u2 / 24); setNeedle('am2', i2 / 1.2); setNeedle('am1', i1 / 1.2);
  hset('n', n.toFixed(2) + (n > 1 ? '（升压）' : '（降压）'));
  hset('u2', u2.toFixed(2) + ' V');
  hset('i2', i2.toFixed(3) + ' A');
  hset('i1', '≈ ' + (i2 * n).toFixed(3) + ' A');
}

/* ---------- 12 二极管·单向导电性 ---------- */
const S12 = { rev: false };
chap({
  id: 'diode', title: '二极管的单向导通性',
  cam: [-0.1, 3.3, 4.8],
  tgt: [0.1, 1.22, 0],
  html: `<p>二极管是电学的「单行道」：<b>正向偏置</b>（正极接高电位）跨过约 0.7 V 门槛后畅通；<b>反向偏置</b>则截止（只剩极小的漏电流）。发光二极管 LED 同样单行，但<b>门槛更高</b>：红光约 1.8 V，蓝光约 3 V——颜色不同，禁带宽度不同，导通门槛也就不同。</p>
<p>「交流变直流」的根基正在于此——整流桥用的就是二极管这副单行脾气。</p>
<p>点「电池反接」，看 LED 和电流表读数的变化。</p>`,
  tasks: [
    { key: 'fwd', text: '正接，确认 LED 点亮（0.7V + 1.8V 门槛都跨过）' },
    { key: 'rev', text: '反接电池，确认回路截止' },
  ],
  quiz: [
    { q: '3V 电源 + 硅二极管（0.7V）+ 红色 LED（1.8V）串联，LED 会亮吗？', opts: ['会，3 − 0.7 − 1.8 = 0.5V 仍大于零', '不会，剩余电压不足以驱动', '亮度取决于电阻', '会烧毁'], a: 0, ex: '总门槛 2.5V，电源 3V 尚有余 0.5V（再配限流电阻即正常点亮）——串联门槛要逐个「付费」。' },
  ],
  enter() {
    enterBench(() => {
      CIR.dt = 0.002;
      addEl('bat1', { t: 'bat', x: -2.0, z: 0.4, label: '电源 3V', E: 3, r: 0.3, a: 1, b: 0 });
      addEl('sw', { t: 'sw', x: -1.1, z: 0.4, label: '开关', R: 1e-4, a: 1, b: 2 });
      addEl('dio', { t: 'dio', x: -0.2, z: 0.4, label: '二极管（硅 0.7V）', a: 2, b: 3 });
      addEl('led', { t: 'led', x: 0.7, z: 0.4, label: '发光二极管（红 1.8V）', VF: 1.8, a: 3, b: 4 });
      addEl('res', { t: 'res', x: 1.5, z: 0.4, label: '限流电阻', R: 90, a: 4, b: 5 });
      addEl('am', { t: 'gauge', sub: 'mA', x: 2.2, z: -0.5, label: '毫安表', R: 1, a: 5, b: 0, ry: Math.PI });
      CIR.N = 6;
      const y0 = TABLE_Y + 0.06;
      W_([[-2.22, TABLE_Y + 0.34, 0.4], [-2.5, y0, 0.4], [-2.5, y0, -0.7], [2.2, y0, -0.7], [2.2, TABLE_Y + 0.2, -0.56]], 'bat1');
      W_([[-1.78, TABLE_Y + 0.34, 0.4], [-1.4, y0, 0.4], [-1.28, y0, 0.4]], 'bat1');
      W_([[-0.92, y0, 0.4], [-0.5, y0, 0.4], [-0.35, TABLE_Y + 0.14, 0.4]], 'sw');
      W_([[-0.05, TABLE_Y + 0.14, 0.4], [0.25, y0, 0.4], [0.5, TABLE_Y + 0.14, 0.4]], 'dio');
      W_([[0.9, TABLE_Y + 0.14, 0.4], [1.25, y0, 0.4], [1.3, TABLE_Y + 0.16, 0.4]], 'led');
      W_([[1.7, TABLE_Y + 0.16, 0.4], [2.3, y0, 0.4], [2.3, y0, 0.62]], 'res');
      W_([[2.2, TABLE_Y + 0.2, -0.44], [2.3, y0, 0.1], [2.3, y0, 0.62]], 'am');
      drawSchem([
        { kind: 'wire', x1: 30, y1: 116, x2: 48, y2: 116 },
        { kind: 'bat', sx: 58, sy: 116, dir: 'v', sub: '3V' },
        { kind: 'wire', x1: 58, y1: 92, x2: 58, y2: 40 },
        { kind: 'sw', sx: 58, sy: 30, dir: 'h', closed: true, sub: 'S' },
        { kind: 'wire', x1: 66, y1: 30, x2: 96, y2: 30 },
        { kind: 'dio', sx: 110, sy: 30, dir: 'h', sub: 'D' },
        { kind: 'wire', x1: 122, y1: 30, x2: 144, y2: 30 },
        { kind: 'dio', sx: 158, sy: 30, dir: 'h', sub: 'LED' },
        { kind: 'wire', x1: 170, y1: 30, x2: 192, y2: 30 },
        { kind: 'res', sx: 206, sy: 30, dir: 'h', sub: 'R' },
        { kind: 'wire', x1: 218, y1: 30, x2: 226, y2: 30 },
        { kind: 'wire', x1: 226, y1: 30, x2: 226, y2: 116 },
        { kind: 'am', sx: 128, sy: 116, dir: 'h', sub: 'mA' },
        { kind: 'wire', x1: 118, y1: 116, x2: 30, y2: 116 },
        { kind: 'node', sx: 226, sy: 116 },
      ]);
    });
    app.setCamera([-0.1, 3.3, 4.8], [0.1, 1.22, 0]);
    ctl.clear();
    const btns = [];
    const paint = () => btns.forEach(({ b, v }) => b.classList.toggle('active', v === S12.rev));
    [['fwd', '正接'], ['rev', '电池反接']].forEach(([v, t]) => {
      const b = ctl.button({ label: t, onClick() { S12.rev = v === 'rev'; CIR.els.get('bat1').E = S12.rev ? -3 : 3; solveNow(); updDiode(); paint(); } });
      btns.push({ b, v });
    });
    paint();
    ctl.sep();
    ctl.toggle({ label: '开关', value: true, onChange: (v) => { setSwitchLogic('sw', v); setSwitchVisual('sw', v); solveNow(); updDiode(); } });
    setHUD([['st', '状态'], ['i', '电流'], ['ud', '二极管压降'], ['note', '单向导电']]);
    solveNow();
    updDiode();
  },
});
function updDiode() {
  const d = CIR.els.get('dio'), led = CIR.els.get('led');
  const rec = ELVIS.get('led');
  if (rec && rec.parts.glow) rec.parts.glow.material.opacity = led.I > 0.002 ? 0.7 : 0;
  setNeedle('am', Math.abs(d.I) / 0.03);
  hset('st', d.I > 1e-4 ? '✓ 正向导通（0.7V 门槛）' : '✗ 反向截止');
  hset('i', (Math.abs(d.I) * 1000).toFixed(2) + ' mA');
  hset('ud', d.V.toFixed(2) + ' V');
  hset('note', S12.rev ? '反接：几乎没有电流' : '正接：0.7V 后畅通');
}

/* ---------- 13 三极管光控路灯 ---------- */
const S13 = { lux: 300, R2: 10, night: false };
chap({
  id: 'photocell', title: '三极管光控路灯',
  cam: [-0.3, 3.3, 4.9],
  tgt: [0.2, 1.32, 0],
  html: `<p>三极管是「以小控大」的电流阀门：基极 b 漏进一点小电流 I_B，集电极 c 就放行 β·I_B 的大电流。光敏电阻 LDR 一到天黑阻值猛涨，分压点电位被抬高 → 注入基极 → 三极管开通 → <b>路灯自动点亮</b>。</p>
<p>用毫安级的小电流去调度几百毫安的负载电流——三极管的放大与开关本领，就藏在路灯里。</p>
<p>拖「光照」滑杆从白天天黑，看路灯何时点亮；再调「灵敏度」。</p>`,
  tasks: [
    { key: 'night', text: '把光照降到「入夜 40lx」，点亮路灯' },
    { key: 'r2', text: '调灵敏度 R₂，观察点亮阈值移动' },
  ],
  quiz: [
    { q: '天黑时 LDR 阻值增大，为什么三极管反而导通？', opts: ['阻值增大电流变大', 'LDR 分得的电压份额增大，抬高了基极电位', '电源电压升高', '三极管温度升高'], a: 1, ex: 'LDR 在下臂：它阻值越大、分压越高，基极电位越过 0.7V 门槛后三极管开通——分压式偏置的精髓。' },
  ],
  enter() {
    enterBench(() => {
      CIR.dt = 0.002;
      addEl('bat1', { t: 'bat', x: -2.0, z: 0.4, label: '电源 6V', E: 6, r: 0.2, a: 1, b: 0 });
      addEl('r2', { t: 'res', x: -1.1, z: 0.4, label: '上偏置电阻 R₂', R: S13.R2 * 1000, a: 1, b: 2 });
      addEl('ldr', { t: 'res', x: -0.3, z: 0.4, label: '光敏电阻 LDR', R: 2000, a: 2, b: 0 });
      addEl('npn', { t: 'npn', x: 0.5, z: 0.4, label: '三极管 β=100', a: 0, b: 0, R: 1e9 });
      addEl('lamp', { t: 'lamp', x: 1.5, z: 0.2, label: '路灯', a: 0, b: 0, R: 1e9 });
      addEl('rlamp', { t: 'res', x: 1.0, z: 0.62, label: '灯限流电阻', R: 24, a: 3, b: 4 });
      addEl('am', { t: 'gauge', sub: 'mA', x: 1.9, z: 0.62, label: '集电极电流', R: 1, a: 4, b: 0 });
      CIR.N = 5;
      const y0 = TABLE_Y + 0.06;
      W_([[-2.22, TABLE_Y + 0.34, 0.4], [-2.5, y0, 0.4], [-2.5, y0, 0.62], [2.6, y0, 0.62]], 'bat1');
      W_([[-1.78, TABLE_Y + 0.34, 0.4], [-1.4, y0, 0.4], [-1.4, y0, -0.7], [2.6, y0, -0.7]], 'bat1');
      W_([[-1.1, TABLE_Y + 0.24, 0.62], [-1.1, y0, 0.58], [-0.98, TABLE_Y + 0.16, 0.44]], 'r2');
      W_([[-0.98, TABLE_Y + 0.16, 0.4], [-0.6, y0, 0.4], [-0.3, y0, 0.4], [-0.3, y0, 0.16], [-0.3, TABLE_Y + 0.2, 0.16]], 'r2');
      W_([[-0.3, TABLE_Y + 0.16, 0.4], [-0.3, y0, 0.3], [-0.55, y0, 0.0], [-0.55, y0, -0.7]], 'ldr');
      W_([[2.4, y0, 0.62], [2.4, y0, -0.55], [2.0, y0, -0.55], [2.0, TABLE_Y + 0.2, -0.5]], 'rlamp');
      drawSchem([
        { kind: 'wire', x1: 30, y1: 30, x2: 216, y2: 30 },
        { kind: 'wire', x1: 40, y1: 30, x2: 40, y2: 60 },
        { kind: 'rheo', sx: 40, sy: 76, dir: 'v', sub: 'R2' },
        { kind: 'wire', x1: 40, y1: 92, x2: 40, y2: 100 },
        { kind: 'node', sx: 40, sy: 100 },
        { kind: 'rheo', sx: 40, sy: 116, dir: 'v', sub: 'LDR' },
        { kind: 'wire', x1: 40, y1: 132, x2: 216, y2: 132 },
        { kind: 'wire', x1: 40, y1: 100, x2: 80, y2: 100 },
        { kind: 'wire', x1: 80, y1: 100, x2: 80, y2: 64 },
        { kind: 'node', sx: 80, sy: 64 },
        { kind: 'wire', x1: 80, y1: 64, x2: 96, y2: 64 },
        { kind: 'wire', x1: 96, y1: 30, x2: 96, y2: 56 },
        { kind: 'wire', x1: 96, y1: 72, x2: 96, y2: 110 },
        { kind: 'wire', x1: 96, y1: 110, x2: 216, y2: 110 },
        { kind: 'wire', x1: 216, y1: 110, x2: 216, y2: 132 },
        { kind: 'res', sx: 130, sy: 88, dir: 'h', sub: 'Rc' },
        { kind: 'wire', x1: 118, y1: 88, x2: 118, y2: 30 },
        { kind: 'wire', x1: 142, y1: 88, x2: 160, y2: 88 },
        { kind: 'node', sx: 160, sy: 88 },
        { kind: 'bulb', sx: 172, sy: 88, dir: 'h', sub: '灯' },
        { kind: 'wire', x1: 184, y1: 88, x2: 216, y2: 88 },
        { kind: 'node', sx: 80, sy: 64 },
      ]);
    });
    app.setCamera([-0.3, 3.3, 4.9], [0.2, 1.32, 0]);
    ctl.clear();
    ctl.slider({ label: '光照强度', min: 0, max: 600, step: 10, value: S13.lux, fmt: (v) => v + ' lux', onInput: (v) => { S13.lux = v; updPhoto(); } });
    ctl.slider({ label: '灵敏度 R₂', min: 4, max: 40, step: 2, value: S13.R2, fmt: (v) => v.toFixed(0) + ' kΩ', onInput: (v) => { S13.R2 = v; CIR.els.get('r2').R = v * 1000; updPhoto(); } });
    ctl.sep();
    const btns = [];
    const paint = () => btns.forEach(({ b, v }) => b.classList.toggle('active', v === S13.lux));
    [[40, '入夜 40lx'], [300, '傍晚 300lx'], [560, '白天 560lx']].forEach(([v, t]) => {
      const b = ctl.button({ label: t, onClick() { S13.lux = v; const sl = document.querySelectorAll('#controls input[type=range]')[0]; sl.value = v; sl.dispatchEvent(new Event('input', { bubbles: true })); paint(); } });
      btns.push({ b, v });
    });
    paint();
    setHUD([['rldr', 'LDR 阻值'], ['vb', '分压点电压'], ['ib', '基极电流'], ['lamp', '路灯状态']]);
    updPhoto();
  },
});
function updPhoto() {
  const rldr = clamp(60000 / (1 + S13.lux / 12), 400, 80000);
  CIR.els.get('ldr').R = rldr;
  CIR.els.get('r2').R = S13.R2 * 1000;
  // 戴维南等效：Vth = 6·R_LDR/(R₂+R_LDR)，Rth = R₂∥R_LDR；基极 0.7V 钳位
  const R2v = S13.R2 * 1000;
  const vth = 6 * rldr / (R2v + rldr);
  const rth = (R2v * rldr) / (R2v + rldr);
  const ib = Math.max((vth - 0.7) / rth, 0);
  const ic = Math.min(ib * 100, 0.25);
  const on = ic > 0.02;
  const rec = ELVIS.get('lamp');
  if (rec && rec.parts.bulb) rec.parts.bulb.material.emissiveIntensity = clamp(ic / 0.12, 0, 1.6);
  setNeedle('am', ic / 0.3);
  hset('rldr', (rldr / 1000).toFixed(1) + ' kΩ');
  hset('vb', vth.toFixed(2) + ' V');
  hset('ib', (ib * 1000).toFixed(3) + ' mA');
  hset('lamp', on ? `💡 点亮（β·I_B = ${(ic * 1000).toFixed(0)} mA）` : '熄灭');
}

/* ---------- 14 直流电动机 ---------- */
const S14 = { E: 4, R: 2, TL: 0, omega: 0 };
chap({
  id: 'motor', title: '直流电动机',
  cam: [-0.2, 3.3, 4.8],
  tgt: [0.2, 1.22, 0],
  html: `<p>通电线圈在磁场里吃到的安培力让它转起来——电动机就此诞生。而转起来的线圈又在切割磁感线，回赠一个<b>反电动势</b> E = kω（方向恰好顶住电源）：</p>
<p><span class="hl">U = I·R + kω</span>。刚启动时 ω = 0、电流最大；转得越快，吃电流越少。一旦把轴卡死（堵转），电流瞬间爆表——这是电机烧毁的头号原因。</p>
<p>调电压与串联电阻，读转速与反电动势。</p>`,
  tasks: [
    { key: 'spin', text: '升高电压，看转速与反电动势同步攀升' },
    { key: 'stall', text: '加大负载转矩制造堵转，观察电流飙升' },
  ],
  quiz: [
    { q: '电动机刚合闸的瞬间电流为什么最大？', opts: ['线圈电阻最小', '转速为零，没有反电动势抵消电源', '磁场尚未建立', '电压最高'], a: 1, ex: '启动瞬间 ω = 0、kω = 0，回路只剩 I·R 一项——电流由纯电阻决定，是运行电流的许多倍。' },
  ],
  enter() {
    enterBench(() => {
      CIR.dt = 0.001;
      addEl('bat1', { t: 'bat', x: -2.0, z: 0.4, label: '电源', E: S14.E, r: 0.2, a: 1, b: 0 });
      addEl('sw', { t: 'sw', x: -1.1, z: 0.4, label: '开关', R: 1e-4, a: 1, b: 2 });
      addEl('rh', { t: 'rheo', x: -0.2, z: 0.4, label: '调速电阻', R: S14.R, a: 2, b: 3 });
      addEl('motR', { t: 'motor', x: 0.9, z: 0.4, label: '电动机（电枢）', R: 1.5, a: 3, b: 4 });
      addEl('emf', { t: 'res', x: 0.9, z: 0.4, label: '反电动势', kind: 'emf', E: 0, r: 0.02, a: 4, b: 5, ry: 0 });
      CIR.els.get('emf').kind = 'emf';
      addEl('am', { t: 'gauge', sub: 'A', x: 1.8, z: -0.5, label: '电流表', R: 1e-3, a: 5, b: 0, ry: Math.PI });
      CIR.N = 6;
      const y0 = TABLE_Y + 0.06;
      W_([[-2.22, TABLE_Y + 0.34, 0.4], [-2.5, y0, 0.4], [-2.5, y0, -0.7], [1.8, y0, -0.7], [1.8, TABLE_Y + 0.2, -0.56]], 'bat1');
      W_([[-1.78, TABLE_Y + 0.34, 0.4], [-1.4, y0, 0.4], [-1.28, y0, 0.4]], 'bat1');
      W_([[-0.92, y0, 0.4], [-0.55, y0, 0.4], [-0.4, y0, 0.4]], 'sw');
      W_([[0.1, y0, 0.4], [0.4, y0, 0.4], [0.6, y0, 0.4]], 'rh');
      W_([[1.1, y0, 0.4], [1.4, y0, 0.4], [1.7, y0, 0.4], [1.9, y0, 0.5]], 'motR');
      W_([[1.75, y0, 0.4], [2.4, y0, 0.4], [2.4, y0, -0.4], [1.8, y0, -0.7]], 'emf');
      drawSchem([
        { kind: 'wire', x1: 28, y1: 114, x2: 46, y2: 114 },
        { kind: 'bat', sx: 56, sy: 114, dir: 'v', sub: 'U' },
        { kind: 'wire', x1: 56, y1: 90, x2: 56, y2: 40 },
        { kind: 'sw', sx: 56, sy: 30, dir: 'h', closed: true, sub: 'S' },
        { kind: 'wire', x1: 64, y1: 30, x2: 92, y2: 30 },
        { kind: 'rheo', sx: 106, sy: 30, dir: 'h', sub: 'R' },
        { kind: 'wire', x1: 118, y1: 30, x2: 140, y2: 30 },
        { kind: 'res', sx: 154, sy: 30, dir: 'h', sub: '电枢' },
        { kind: 'wire', x1: 166, y1: 30, x2: 186, y2: 30 },
        { kind: 'bat', sx: 200, sy: 30, dir: 'h', sub: 'E反' },
        { kind: 'wire', x1: 212, y1: 30, x2: 224, y2: 30 },
        { kind: 'wire', x1: 224, y1: 30, x2: 224, y2: 114 },
        { kind: 'am', sx: 130, sy: 114, dir: 'h', sub: 'A' },
        { kind: 'wire', x1: 120, y1: 114, x2: 28, y2: 114 },
        { kind: 'node', sx: 224, sy: 114 },
      ]);
    });
    app.setCamera([-0.2, 3.3, 4.8], [0.2, 1.22, 0]);
    ctl.clear();
    ctl.slider({ label: '电源电压 U', min: 0, max: 6, step: 0.5, value: S14.E, fmt: (v) => v.toFixed(1) + ' V', onInput: (v) => { S14.E = v; CIR.els.get('bat1').E = v; solveNow(); updMotor(); } });
    ctl.slider({ label: '调速电阻', min: 0, max: 12, step: 0.5, value: S14.R, fmt: (v) => v.toFixed(1) + ' Ω', onInput: (v) => { S14.R = v; CIR.els.get('rh').R = v; setSliderVisual('rh', v / 12); solveNow(); updMotor(); } });
    ctl.slider({ label: '负载转矩', min: 0, max: 0.15, step: 0.005, value: S14.TL, fmt: (v) => v.toFixed(3) + ' N·m', onInput: (v) => { S14.TL = v; updMotor(); } });
    ctl.sep();
    ctl.toggle({ label: '开关', value: true, onChange: (v) => { setSwitchLogic('sw', v); setSwitchVisual('sw', v); solveNow(); updMotor(); } });
    setHUD([['eq', 'U = IR + kω'], ['i', '电枢电流'], ['w', '转速'], ['emf', '反电动势 kω'], ['tl', '负载转矩']]);
    updMotor();
  },
});
function updMotor() {
  CIR.els.get('bat1').E = S14.E;
  CIR.els.get('rh').R = S14.R;
  solveNow();
  const i = Math.abs(CIR.els.get('emf').I);
  const stalled = S14.TL > 0 && S14.omega < 0.1 && i > 0.05 && 0.12 * i < S14.TL;
  hset('i', i.toFixed(3) + ' A' + (stalled ? '（堵转！）' : ''));
  hset('w', (S14.omega).toFixed(1) + ' rad/s（' + (S14.omega * 9.55).toFixed(0) + ' rpm）');
  hset('emf', (0.12 * S14.omega).toFixed(2) + ' V');
  hset('tl', S14.TL === 0 ? '空载' : `${S14.TL.toFixed(3)} N·m${stalled ? ' → 堵转，电流最大' : ' → 转速下降、电流上升'}`);
  setNeedle('am', i / 3);
}
function motorTick(dt) {
  const i = Math.abs(CIR.els.get('emf').I);
  const kt = 0.12, b = 0.0018, J = 0.008;
  // 力矩平衡：kt·I − b·ω − TL（负载转矩），堵转时 ω 停在 0
  const net = kt * i - b * S14.omega - S14.TL;
  S14.omega = Math.max(0, S14.omega + net / J * dt * 0.25);
  S14.omega = clamp(S14.omega, 0, 60);
  CIR.els.get('emf').E = 0.12 * S14.omega;
  const rec = ELVIS.get('motR');
  if (rec && rec.parts.rotor) rec.parts.rotor.rotation.z -= S14.omega * dt * 2;
  solveNow();
  updMotor();
}

/* ---------- 15 短路与保险丝 ---------- */
const S15 = { shorted: false, fuseT: 0, blown: false, Ir: 0.3 };
chap({
  id: 'short', title: '短路与保险丝',
  cam: [-0.2, 3.3, 4.8],
  tgt: [0.2, 1.22, 0],
  html: `<p>拿导线把灯泡两端直接搭在一起——这就是<b>短路</b>：电流绕开灯泡，全数涌向「阻力最小」的短路通道。I = E/(r₀+r_短) 瞬间冲上十几安，导线发热甚至起火。</p>
<p><b>保险丝</b>是电路里安排好的「牺牲品」：低熔点合金丝，电流一超限就抢先烧断自己，保住其余电路。选型思路：<b>装在干路上，额定值取得比正常工作电流略高一点</b>（本例正常约 0.24 A，配 0.3 A）。到了家庭电路，它进化成了空气开关。</p>
<p>闭合短接开关，看保险丝发光烧断；调大额定电流再试；点「更换保险丝」复位。</p>`,
  tasks: [
    { key: 'short', text: '闭合短接开关，目送保险丝熔断' },
    { key: 'rep', text: '更换保险丝后恢复供电' },
  ],
  quiz: [
    { q: '保险丝为什么必须串联在干路，而不能并联？', opts: ['并联会分压', '并联时它根本感知不到干路电流，失去保护作用', '串联更便宜', '并联会更省电'], a: 1, ex: '保护器件必须「挡在」电流的必经之路上；并联的保险丝只是又一条支路，干路过载时它毫无反应。' },
  ],
  enter() {
    enterBench(() => {
      CIR.dt = 0.002;
      addEl('bat1', { t: 'bat', x: -2.0, z: 0.4, label: '电源 3V（内阻 0.3Ω）', E: 3, r: 0.3, a: 1, b: 0 });
      addEl('sw', { t: 'sw', x: -1.1, z: 0.4, label: '主开关', R: 1e-4, a: 1, b: 2 });
      addEl('fu', { t: 'fuse', x: -0.2, z: 0.4, label: '保险丝（额定 0.3A）', R: 0.05, Ir: S15.Ir, a: 2, b: 4 });
      addEl('am', { t: 'gauge', sub: 'A', x: 1.9, z: 0.4, label: '电流表', R: 1e-3, a: 4, b: 3 });
      addEl('bl', { t: 'bulb', x: 0.8, z: 0.4, label: '灯泡', R: 12, a: 3, b: 0 });
      addEl('sh', { t: 'sw', x: 0.8, z: -0.4, label: '短接开关（危险）', R: 1e9, a: 3, b: 0 });
      CIR.N = 5;
      const y0 = TABLE_Y + 0.06;
      W_([[-2.22, TABLE_Y + 0.34, 0.4], [-2.5, y0, 0.4], [-2.5, y0, -0.75], [2.6, y0, -0.75], [2.6, y0, 0.4], [2.1, y0, 0.4]], 'bat1');
      W_([[-1.78, TABLE_Y + 0.34, 0.4], [-1.4, y0, 0.4], [-1.28, y0, 0.4]], 'bat1');
      W_([[-0.92, y0, 0.4], [-0.6, y0, 0.4], [-0.35, TABLE_Y + 0.1, 0.4]], 'sw');
      W_([[-0.05, TABLE_Y + 0.1, 0.4], [0.3, y0, 0.4], [0.52, TABLE_Y + 0.4, 0.4]], 'fu');
      W_([[1.08, TABLE_Y + 0.4, 0.4], [1.4, y0, 0.4], [1.68, TABLE_Y + 0.16, 0.4]], 'bl');
      W_([[1.0, TABLE_Y + 0.06, -0.36], [1.4, y0, -0.4], [1.4, y0, -0.75]], 'sh');
      W_([[1.98, TABLE_Y + 0.16, 0.4], [2.4, y0, 0.4], [2.4, y0, 0.4]], 'am');
      drawSchem([
        { kind: 'wire', x1: 30, y1: 114, x2: 46, y2: 114 },
        { kind: 'bat', sx: 56, sy: 114, dir: 'v', sub: '3V' },
        { kind: 'wire', x1: 56, y1: 90, x2: 56, y2: 36 },
        { kind: 'sw', sx: 56, sy: 28, dir: 'h', closed: true, sub: 'S' },
        { kind: 'wire', x1: 64, y1: 28, x2: 94, y2: 28 },
        { kind: 'node', sx: 94, sy: 28 },
        { kind: 'wire', x1: 94, y1: 28, x2: 112, y2: 28 },
        { kind: 'wire', x1: 94, y1: 28, x2: 94, y2: 64 },
        { kind: 'wire', x1: 112, y1: 28, x2: 196, y2: 28 },
        { kind: 'res', sx: 130, sy: 52, dir: 'v', sub: '灯' },
        { kind: 'wire', x1: 112, y1: 28, x2: 112, y2: 40 },
        { kind: 'wire', x1: 130, y1: 40, x2: 130, y2: 64 },
        { kind: 'wire', x1: 130, y1: 64, x2: 94, y2: 64 },
        { kind: 'wire', x1: 94, y1: 64, x2: 94, y2: 114 },
        { kind: 'sw', sx: 150, sy: 64, dir: 'h', closed: false, sub: '短路' },
        { kind: 'wire', x1: 162, y1: 64, x2: 94, y2: 64 },
        { kind: 'am', sx: 140, sy: 114, dir: 'h', sub: 'A' },
        { kind: 'wire', x1: 130, y1: 114, x2: 30, y2: 114 },
      ]);
    });
    app.setCamera([-0.2, 3.3, 4.8], [0.2, 1.22, 0]);
    ctl.clear();
    ctl.toggle({ label: '短接开关（危险动作）', value: false, onChange: (v) => { S15.shorted = v; setSwitchLogic('sh', v); setSwitchVisual('sh', v); } });
    ctl.slider({ label: '保险丝额定电流', min: 0.2, max: 1.0, step: 0.05, value: S15.Ir, fmt: (v) => v.toFixed(2) + ' A', onInput: (v) => { S15.Ir = v; const f = CIR.els.get('fu'); if (!f.blown) f.Ir = v; updShort(); } });
    ctl.sep();
    ctl.button({ label: '🔧 更换保险丝', onClick() { S15.blown = false; S15.fuseT = 0; const f = CIR.els.get('fu'); f.blown = false; f.R = 0.05; f.Ir = S15.Ir; const rec = ELVIS.get('fu'); rec.parts.wire.visible = true; rec.parts.wire.scale.x = 1; solveNow(); updShort(); } });
    setHUD([['i', '总电流'], ['fuse', '保险丝'], ['bl', '灯泡'], ['warn', '安全提示']]);
    solveNow();
    updShort();
  },
});
function updShort() {
  const am = CIR.els.get('am'), bl = CIR.els.get('bl');
  const i = Math.abs(am.I);
  setNeedle('am', i / 12);
  bulbGlow('bl', Math.abs(bl.I) / 0.25);
  const f = CIR.els.get('fu');
  hset('i', i.toFixed(2) + ' A');
  hset('fuse', f.blown ? '❌ 已熔断（电路断开）' : S15.fuseT > 0 ? '🔥 过热中…' : `✓ 正常（额定 ${(f.Ir || 0.3).toFixed(2)} A）`);
  hset('bl', Math.abs(bl.I) > 0.02 ? '亮' : '熄');
  hset('warn', S15.shorted && !f.blown ? '短路电流 ' + i.toFixed(1) + ' A！保险丝先替你扛' : '家庭电路严禁短路');
}
function shortTick(dt) {
  const am = CIR.els.get('am');
  const i = Math.abs(am.I);
  const f = CIR.els.get('fu');
  const Ir = f.Ir || 0.3;
  if (!f.blown && i > 1.4 * Ir) {
    S15.fuseT += dt;
    const rec = ELVIS.get('fu');
    if (rec && rec.parts.wire) {
      rec.parts.wire.material.color.setHex(0xff5533);
      rec.parts.wire.material.emissive = new THREE.Color(0xff3311);
      rec.parts.wire.material.emissiveIntensity = Math.min(1, S15.fuseT * 3);
    }
    if (S15.fuseT > 0.35) {
      f.blown = true; f.R = 1e9;
      const rec2 = ELVIS.get('fu');
      if (rec2 && rec2.parts.wire) {
        rec2.parts.wire.visible = true;
        rec2.parts.wire.scale.set(0.12, 1, 1);
        rec2.parts.wire.position.x = -0.11;
        rec2.parts.wire.material.emissiveIntensity = 0;
      }
    }
  }
  solveNow();
  updShort();
}

/* ---------- 16 稳压二极管·稳压电路 ---------- */
const S16 = { U: 9 };
chap({
  id: 'zener', title: '稳压管削波稳压电路',
  cam: [-0.3, 3.3, 4.9],
  tgt: [0.1, 1.22, 0],
  html: `<p>稳压二极管专门活在<b>反向击穿段</b>：反向电压一旦触及稳压值 U_Z，电流大幅起伏而两端电压几乎钉死——利用这段「恒压」特性，把波动的输入削成平稳的输出。</p>
<p>串在面前的电阻 R 负责吞掉多余电压：U_in 变化 → R 上压降跟着变 → <span class="hl">U_out = U_Z 咬定 5.1 V 不放</span>（前提：输入足够高、电流在允许区间内）。</p>
<p>拖输入电压滑杆，看输出纹丝不动。</p>`,
  tasks: [
    { key: 'stab', text: '输入在 6~12V 间拖动，验证输出钉在 5.1V' },
    { key: 'low', text: '把输入压到 5V 以下，看稳压失效' },
  ],
  quiz: [
    { q: '稳压电路中限流电阻 R 的作用是什么？', opts: ['增大输出电流', '吃掉多余电压并把稳压管电流限制在安全区', '提高稳压值', '滤波'], a: 1, ex: 'R 上「消化」了 U_in − U_Z 的差额，同时把稳压管电流约束在安全范围——少了它稳压管会过流烧毁。' },
  ],
  enter() {
    enterBench(() => {
      CIR.dt = 0.002;
      addEl('bat1', { t: 'bat', x: -2.0, z: 0.4, label: '输入电源（波动）', E: S16.U, r: 0.2, a: 1, b: 0 });
      addEl('rs', { t: 'res', x: -0.9, z: 0.4, label: '限流 R = 100Ω', R: 100, a: 1, b: 2 });
      addEl('zen', { t: 'dio', x: 0.1, z: 0.4, label: '稳压管 5.1V（反向）', kind: 'zen', VZ: 5.1, rs: 6, a: 3, b: 2, R: 1e9 });
      CIR.els.get('zen').kind = 'zen';
      CIR.els.get('zen').a = 3; CIR.els.get('zen').b = 2;
      addEl('rl', { t: 'res', x: 1.1, z: 0.4, label: '负载 R = 400Ω', R: 400, a: 2, b: 0 });
      addEl('vol', { t: 'gauge', sub: 'V', x: 1.1, z: -0.5, label: '输出电压', R: 1e7, a: 2, b: 0, ry: Math.PI });
      addEl('amz', { t: 'gauge', sub: 'mA', x: -0.3, z: -0.5, label: '稳压管电流', R: 1, a: 0, b: 3, ry: Math.PI });
      CIR.N = 4;
      const y0 = TABLE_Y + 0.06;
      W_([[-2.22, TABLE_Y + 0.34, 0.4], [-2.5, y0, 0.4], [-2.5, y0, -0.75], [1.5, y0, -0.75], [1.5, y0, -0.55], [1.3, TABLE_Y + 0.2, -0.55]], 'bat1');
      W_([[-1.78, TABLE_Y + 0.34, 0.4], [-1.4, y0, 0.4], [-1.15, TABLE_Y + 0.16, 0.4]], 'bat1');
      W_([[-0.65, TABLE_Y + 0.16, 0.4], [0.4, y0, 0.4], [0.4, y0, 0.16], [0.55, TABLE_Y + 0.16, 0.16]], 'rs');
      W_([[-0.25, TABLE_Y + 0.1, -0.45], [-0.25, y0, -0.5], [0.1, y0, -0.5], [0.4, y0, 0.16]], 'amz');
      W_([[0.95, TABLE_Y + 0.16, 0.16], [1.7, y0, 0.16], [1.7, y0, 0.4], [1.4, y0, 0.4]], 'zen');
      W_([[1.5, y0, -0.55], [1.9, y0, -0.55], [1.9, y0, 0.4], [1.7, y0, 0.4]], 'vol');
      W_([[1.35, y0, 0.4], [1.75, y0, 0.4], [1.9, y0, 0.4]], 'rl');
      drawSchem([
        { kind: 'wire', x1: 30, y1: 114, x2: 48, y2: 114 },
        { kind: 'bat', sx: 58, sy: 114, dir: 'v', sub: 'Uin' },
        { kind: 'wire', x1: 58, y1: 90, x2: 58, y2: 30 },
        { kind: 'res', sx: 80, sy: 30, dir: 'h', sub: 'R' },
        { kind: 'wire', x1: 92, y1: 30, x2: 130, y2: 30 },
        { kind: 'node', sx: 130, sy: 30 },
        { kind: 'wire', x1: 130, y1: 30, x2: 150, y2: 30 },
        { kind: 'wire', x1: 150, y1: 30, x2: 150, y2: 48 },
        { kind: 'dio', sx: 150, sy: 64, dir: 'v', sub: 'DZ' },
        { kind: 'wire', x1: 150, y1: 80, x2: 150, y2: 114 },
        { kind: 'res', sx: 190, sy: 70, dir: 'v', sub: 'RL' },
        { kind: 'wire', x1: 190, y1: 58, x2: 190, y2: 30 },
        { kind: 'wire', x1: 190, y1: 82, x2: 190, y2: 114 },
        { kind: 'wire', x1: 190, y1: 114, x2: 30, y2: 114 },
        { kind: 'vol', sx: 170, sy: 50, dir: 'h', sub: 'V' },
        { kind: 'wire', x1: 158, y1: 50, x2: 150, y2: 50 },
        { kind: 'wire', x1: 182, y1: 50, x2: 190, y2: 50 },
      ]);
    });
    app.setCamera([-0.3, 3.3, 4.9], [0.1, 1.22, 0]);
    ctl.clear();
    ctl.slider({ label: '输入电压 U_in', min: 3, max: 12, step: 0.5, value: S16.U, fmt: (v) => v.toFixed(1) + ' V', onInput: (v) => { S16.U = v; CIR.els.get('bat1').E = v; solveNow(); updZener(); } });
    setHUD([['uin', '输入电压'], ['uout', '输出电压'], ['iz', '稳压管电流'], ['note', '击穿区稳压']]);
    solveNow();
    updZener();
  },
});
function updZener() {
  const zen = CIR.els.get('zen');
  const vol = CIR.els.get('vol');
  const u = Math.abs(vol.V);
  setNeedle('vol', u / 8);
  setNeedle('amz', Math.abs(zen.I) / 0.05);
  hset('uin', S16.U.toFixed(1) + ' V');
  hset('uout', u.toFixed(2) + ' V' + (Math.abs(u - 5.1) < 0.3 ? ' ✓ 稳定' : '（欠压未击穿）'));
  hset('iz', (Math.abs(zen.I) * 1000).toFixed(1) + ' mA');
  hset('note', S16.U > 6 ? 'U_in 变化，U_out ≈ 5.1 V 不变' : '输入太低，稳压管未进入击穿区');
}

/* ---------- 17 焦耳定律 ---------- */
const S17 = { R3: 4, t: 0, heating: false, T1: 25, T2: 25 };
chap({
  id: 'joule', title: '探究焦耳定律',
  cam: [-0.2, 3.3, 4.8],
  tgt: [0.3, 1.22, 0],
  html: `<p>电流穿过导体就发热：<span class="hl">Q = I²Rt</span>（焦耳定律）。两只烧瓶装着<b>等质量的煤油</b>——比热容小，升温更醒目，所以这类实验挑煤油而不是水。串联电路电流处处相等：比较两根电阻丝，<b>R 大的升温快</b>——这是一场「电流相同、比电阻」的对照实验。</p>
<p>改成并联比较就反过来：电压相同时，R 小的发热更猛（P = U²/R）。</p>
<p>点「开始加热」跑 8 秒，比较两只温度计（ΔT₂ : ΔT₁ ≈ R₂ : R₁ = 2 : 1）。</p>`,
  tasks: [
    { key: 'heat', text: '加热 8 秒，比较两支温度计升幅' },
    { key: 'reset', text: '复位温度后再跑一次，验证比例一致' },
  ],
  quiz: [
    { q: '焦耳定律实验用煤油而非水，主要因为煤油——', opts: ['不导电', '比热容小、升温明显，还绝缘', '更便宜', '密度大'], a: 1, ex: '同样热量下煤油温升约为水的五倍，读数醒目；且它绝缘，电阻丝可以直接泡在液体里通电。' },
  ],
  enter() {
    enterBench(() => {
      CIR.dt = 0.002;
      addEl('bat1', { t: 'bat', x: -2.1, z: 0.4, label: '电源 3V', E: 3, r: 0.3, a: 1, b: 0 });
      addEl('sw', { t: 'sw', x: -1.2, z: 0.4, label: '开关', R: 1e-4, a: 1, b: 2 });
      addEl('rh', { t: 'rheo', x: -0.4, z: 0.4, label: '电流调节', R: S17.R3, a: 2, b: 3 });
      addEl('h1', { t: 'thermo', x: 0.6, z: 0.4, label: '电阻丝 R₁ = 5Ω', R: 5, a: 3, b: 4 });
      addEl('h2', { t: 'thermo', x: 1.7, z: 0.4, label: '电阻丝 R₂ = 10Ω', R: 10, a: 4, b: 5 });
      CIR.N = 6;
      addEl('am', { t: 'gauge', sub: 'A', x: 2.5, z: -0.5, label: '电流表', R: 1e-3, a: 5, b: 0, ry: Math.PI });
      const y0 = TABLE_Y + 0.06;
      W_([[-2.32, TABLE_Y + 0.34, 0.4], [-2.6, y0, 0.4], [-2.6, y0, -0.7], [2.5, y0, -0.7], [2.5, TABLE_Y + 0.2, -0.56]], 'bat1');
      W_([[-1.88, TABLE_Y + 0.34, 0.4], [-1.5, y0, 0.4], [-1.38, y0, 0.4]], 'bat1');
      W_([[-1.02, y0, 0.4], [-0.75, y0, 0.4], [-0.62, y0, 0.4]], 'sw');
      W_([[-0.18, y0, 0.4], [0.15, y0, 0.4], [0.35, TABLE_Y + 0.1, 0.35]], 'rh');
      W_([[0.85, TABLE_Y + 0.1, 0.35], [1.3, y0, 0.4], [1.45, TABLE_Y + 0.1, 0.35]], 'h1');
      W_([[1.95, TABLE_Y + 0.1, 0.35], [2.3, y0, 0.4], [2.5, y0, 0.4]], 'h2');
      drawSchem([
        { kind: 'wire', x1: 30, y1: 114, x2: 46, y2: 114 },
        { kind: 'bat', sx: 56, sy: 114, dir: 'v', sub: '3V' },
        { kind: 'wire', x1: 56, y1: 90, x2: 56, y2: 36 },
        { kind: 'sw', sx: 56, sy: 28, dir: 'h', closed: true, sub: 'S' },
        { kind: 'wire', x1: 64, y1: 28, x2: 90, y2: 28 },
        { kind: 'rheo', sx: 104, sy: 28, dir: 'h', sub: 'R₃' },
        { kind: 'wire', x1: 116, y1: 28, x2: 138, y2: 28 },
        { kind: 'res', sx: 152, sy: 28, dir: 'h', sub: 'R1' },
        { kind: 'wire', x1: 164, y1: 28, x2: 184, y2: 28 },
        { kind: 'res', sx: 198, sy: 28, dir: 'h', sub: 'R2' },
        { kind: 'wire', x1: 210, y1: 28, x2: 224, y2: 28 },
        { kind: 'wire', x1: 224, y1: 28, x2: 224, y2: 114 },
        { kind: 'am', sx: 132, sy: 114, dir: 'h', sub: 'A' },
        { kind: 'wire', x1: 122, y1: 114, x2: 30, y2: 114 },
      ]);
    });
    app.setCamera([-0.2, 3.3, 4.8], [0.3, 1.22, 0]);
    ctl.clear();
    ctl.slider({ label: '电流调节 R₃', min: 1, max: 12, step: 0.5, value: S17.R3, fmt: (v) => v.toFixed(1) + ' Ω', onInput: (v) => { S17.R3 = v; CIR.els.get('rh').R = v; setSliderVisual('rh', (v - 1) / 11); solveNow(); updJoule(); } });
    ctl.sep();
    ctl.button({ label: '🔥 开始加热 8 秒', onClick() { S17.heating = true; S17.t = 0; setSwitchLogic('sw', true); setSwitchVisual('sw', true); } });
    ctl.button({ label: '↺ 复位温度', onClick() { S17.T1 = 25; S17.T2 = 25; S17.heating = false; updJoule(); } });
    setHUD([['i', '电流（串联相同）'], ['p1', 'R₁ 功率 I²R₁'], ['p2', 'R₂ 功率 I²R₂'], ['dt', '升温 ΔT₁ / ΔT₂']]);
    solveNow();
    updJoule();
  },
});
function updJoule() {
  const am = CIR.els.get('am');
  const i = Math.abs(am.I);
  setNeedle('am', i / 1.2);
  hset('i', i.toFixed(3) + ' A');
  hset('p1', (i * i * 5).toFixed(2) + ' W');
  hset('p2', (i * i * 10).toFixed(2) + ' W');
  hset('dt', (S17.T1 - 25).toFixed(1) + '°C / ' + (S17.T2 - 25).toFixed(1) + '°C');
  const r1 = ELVIS.get('h1'), r2 = ELVIS.get('h2');
  if (r1 && r1.parts.col) r1.parts.col.scale.y = clamp(0.5 + (S17.T1 - 25) / 14, 0.3, 1.6);
  if (r2 && r2.parts.col) r2.parts.col.scale.y = clamp(0.5 + (S17.T2 - 25) / 14, 0.3, 1.6);
}
function jouleTick(dt) {
  if (!S17.heating) return;
  solveNow();
  const i = Math.abs(CIR.els.get('am').I);
  S17.t += dt;
  const c1 = 14, c2 = 14;
  S17.T1 += i * i * 5 / c1 * dt;
  S17.T2 += i * i * 10 / c2 * dt;
  updJoule();
  if (S17.t > 8) { S17.heating = false; setSwitchLogic('sw', false); setSwitchVisual('sw', false); }
}

/* ---------- 18 电阻定律 ---------- */
const S18 = { mat: 0, L: 1.0, S: 0.5 };
const MATS18 = [
  { n: '铜', rho: 0.017 }, { n: '铁', rho: 0.096 }, { n: '镍铬合金', rho: 1.1 },
];
chap({
  id: 'reslaw', title: '决定导体电阻的因素',
  cam: [-0.3, 3.3, 4.8],
  tgt: [0.2, 1.22, 0],
  html: `<p>一段导体的电阻，由它自身的条件决定：<span class="hl">R = ρL / S</span>——电阻率 ρ 越大、长度 L 越长、横截面积 S 越细，电阻就越大。</p>
<p>ρ 是材料递出的「电阻身份证」：铜 0.017、铁 0.096、镍铬合金 1.1（Ω·mm²/m，20°C）。同样形状下镍铬丝的电阻约是铜丝的 65 倍——电炉丝因此选镍铬。</p>
<p>实验套路是<b>控制变量法</b>：每轮只放出一个因素（先定材料比长度，再定长度比粗细，最后把长短粗细都定死比材料）。</p>
<p>换材料、拉长、变细，看电流表和公式一起动。</p>`,
  tasks: [
    { key: 'mat', text: '切换铜 / 铁 / 镍铬，对比同形状电阻' },
    { key: 'ls', text: '分别拉长与变细，验证 R ∝ L、R ∝ 1/S' },
  ],
  quiz: [
    { q: '把导线对折后并成一根使用（长度减半、截面积加倍），电阻变为原来的几倍？', opts: ['1/4', '1/2', '2 倍', '不变'], a: 0, ex: 'R ∝ L/S：L 减半且 S 加倍，电阻变为原来的 1/4——高压输电要用多股粗线正是这个道理。' },
  ],
  enter() {
    enterBench(() => {
      CIR.dt = 0.002;
      addEl('bat1', { t: 'bat', x: -2.0, z: 0.4, label: '电源 3V', E: 3, r: 0.3, a: 1, b: 0 });
      addEl('am', { t: 'gauge', sub: 'A', x: -1.0, z: 0.4, label: '电流表', R: 1e-3, a: 1, b: 2 });
      addEl('rx', { t: 'res', x: 0.3, z: 0.4, label: '测试导线', R: 1, a: 2, b: 3 });
      // 回路经 lb(3→4) → am2(4→0)
      addEl('lb', { t: 'bulb', x: 1.5, z: 0.4, label: '指示灯', R: 12, a: 3, b: 4 });
      addEl('am2', { t: 'res', x: 0, z: 0, label: '', R: 1e-3, a: 4, b: 0 });
      CIR.N = 5;
      const y0 = TABLE_Y + 0.06;
      W_([[-2.22, TABLE_Y + 0.34, 0.4], [-2.5, y0, 0.4], [-2.5, y0, -0.7], [2.3, y0, -0.7], [2.3, y0, 0.4], [1.72, TABLE_Y + 0.4, 0.4]], 'bat1');
      W_([[-1.78, TABLE_Y + 0.34, 0.4], [-1.45, y0, 0.4], [-1.15, TABLE_Y + 0.16, 0.4]], 'bat1');
      W_([[-0.85, TABLE_Y + 0.16, 0.4], [-0.45, y0, 0.4], [-0.05, TABLE_Y + 0.16, 0.4]], 'am');
      W_([[0.55, TABLE_Y + 0.16, 0.4], [1.0, y0, 0.4], [1.28, TABLE_Y + 0.4, 0.4]], 'rx');
      drawSchem([
        { kind: 'wire', x1: 30, y1: 114, x2: 46, y2: 114 },
        { kind: 'bat', sx: 56, sy: 114, dir: 'v', sub: '3V' },
        { kind: 'wire', x1: 56, y1: 90, x2: 56, y2: 40 },
        { kind: 'wire', x1: 56, y1: 40, x2: 56, y2: 36 },
        { kind: 'am', sx: 70, sy: 30, dir: 'h', sub: 'A' },
        { kind: 'wire', x1: 82, y1: 30, x2: 130, y2: 30 },
        { kind: 'res', sx: 146, sy: 30, dir: 'h', sub: 'Rx' },
        { kind: 'wire', x1: 158, y1: 30, x2: 196, y2: 30 },
        { kind: 'bulb', sx: 212, sy: 30, dir: 'h', sub: '灯' },
        { kind: 'wire', x1: 224, y1: 30, x2: 236, y2: 30 },
        { kind: 'wire', x1: 236, y1: 30, x2: 236, y2: 114 },
        { kind: 'wire', x1: 236, y1: 114, x2: 30, y2: 114 },
      ]);
    });
    app.setCamera([-0.3, 3.3, 4.8], [0.2, 1.22, 0]);
    ctl.clear();
    const btns = [];
    const paint = () => btns.forEach(({ b, v }) => b.classList.toggle('active', v === S18.mat));
    MATS18.forEach((mm, k) => {
      const b = ctl.button({ label: mm.n, onClick() { S18.mat = k; updResLaw(); paint(); } });
      btns.push({ b, v: k });
    });
    paint();
    ctl.sep();
    ctl.slider({ label: '长度 L', min: 0.2, max: 2, step: 0.1, value: S18.L, fmt: (v) => v.toFixed(1) + ' m', onInput: (v) => { S18.L = v; updResLaw(); } });
    ctl.slider({ label: '横截面积 S', min: 0.3, max: 2, step: 0.1, value: S18.S, fmt: (v) => v.toFixed(1) + ' mm²', onInput: (v) => { S18.S = v; updResLaw(); } });
    setHUD([['law', 'R = ρL / S'], ['r', '电阻值'], ['i', '电流'], ['note', '同一电路对照']]);
    updResLaw();
  },
});
function updResLaw() {
  const mm = MATS18[S18.mat];
  const R = mm.rho * S18.L / S18.S;
  const rx = CIR.els.get('rx');
  rx.R = clamp(R, 0.05, 200);
  const rec = ELVIS.get('rx');
  if (rec) rec.grp.scale.x = clamp(0.6 + S18.L * 0.5, 0.6, 1.6);
  solveNow();
  const i = Math.abs(CIR.els.get('am').I);
  setNeedle('am', clamp(i / 0.4, 0, 1.1));
  bulbGlow('lb', Math.abs(CIR.els.get('lb').I) / 0.2);
  hset('law', `ρ(${mm.n}) = ${mm.rho}`);
  hset('r', R.toFixed(2) + ' Ω');
  hset('i', i.toFixed(3) + ' A');
  hset('note', '铜最导电 → 电线用铜');
}

/* ---------- 19 多用电表的使用 ---------- */
const S19 = { mode: 'dcv', point: 'r2' };
chap({
  id: 'mm', title: '多用电表的使用',
  cam: [-0.2, 3.3, 4.9],
  tgt: [0.3, 1.22, 0],
  html: `<p>多用电表 = 电压表 + 电流表 + 欧姆表的三合一。三条铁律记牢：</p>
<p>① 测<b>电压</b>：表笔搭在元件两端（并联）；② 测<b>电流</b>：断开一点把表串进去（串联）；③ 测<b>电阻</b>：<b>必须先断电</b>（表内自带电池在供电）。</p>
<p>选档位 + 选测点，看读数。欧姆档使用前先「调零」——两笔短接拨到 0 Ω。冷知识：欧姆挡里内置电池的正极恰好连着<b>红表笔</b>，测电阻时电流从红笔流出。</p>`,
  tasks: [
    { key: 'dcv', text: '电压档并联测 R₂ 两端' },
    { key: 'dca', text: '电流档串入干路读数' },
    { key: 'ohm', text: '电阻档断电测 R₂ 阻值' },
  ],
  quiz: [
    { q: '为什么用欧姆挡测量时必须先断开电路电源？', opts: ['防止读数偏大', '表内自带电池，外接电源会干扰甚至损坏表头', '省电', '避免触电'], a: 1, ex: '欧姆挡靠表内电池供电测阻值；带电测量等于两个电源叠加，读数无意义还可能打坏表针。' },
  ],
  enter() {
    enterBench(() => {
      CIR.dt = 0.002;
      addEl('bat1', { t: 'bat', x: -1.8, z: 0.4, label: '电源 3V', E: 3, r: 0.3, a: 1, b: 0 });
      addEl('sw', { t: 'sw', x: -0.9, z: 0.4, label: '开关', R: 1e-4, a: 1, b: 2 });
      addEl('r1', { t: 'res', x: -0.1, z: 0.4, label: 'R₁ = 10Ω', R: 10, a: 2, b: 3 });
      addEl('r2', { t: 'res', x: 0.9, z: 0.4, label: 'R₂ = 20Ω', R: 20, a: 3, b: 0 });
      addEl('mmr', { t: 'mm', x: 1.9, z: -0.45, label: '多用电表' });
      const y0 = TABLE_Y + 0.06;
      W_([[-2.02, TABLE_Y + 0.34, 0.4], [-2.4, y0, 0.4], [-2.4, y0, -0.75], [2.6, y0, -0.75], [2.6, TABLE_Y + 0.2, -0.5]], 'bat1');
      W_([[-1.58, TABLE_Y + 0.34, 0.4], [-1.25, y0, 0.4], [-1.08, y0, 0.4]], 'bat1');
      W_([[-0.72, y0, 0.4], [-0.4, y0, 0.4], [-0.25, TABLE_Y + 0.16, 0.4]], 'sw');
      W_([[0.05, TABLE_Y + 0.16, 0.4], [0.35, y0, 0.4], [0.65, TABLE_Y + 0.16, 0.4]], 'r1');
      W_([[1.15, TABLE_Y + 0.16, 0.4], [1.6, y0, 0.4], [2.4, y0, 0.4]], 'r2');
      drawSchem([
        { kind: 'wire', x1: 30, y1: 114, x2: 46, y2: 114 },
        { kind: 'bat', sx: 56, sy: 114, dir: 'v', sub: '3V' },
        { kind: 'wire', x1: 56, y1: 90, x2: 56, y2: 40 },
        { kind: 'sw', sx: 56, sy: 30, dir: 'h', closed: true, sub: 'S' },
        { kind: 'wire', x1: 64, y1: 30, x2: 96, y2: 30 },
        { kind: 'res', sx: 110, sy: 30, dir: 'h', sub: 'R1' },
        { kind: 'wire', x1: 122, y1: 30, x2: 150, y2: 30 },
        { kind: 'node', sx: 150, sy: 30 },
        { kind: 'res', sx: 164, sy: 30, dir: 'h', sub: 'R2' },
        { kind: 'wire', x1: 176, y1: 30, x2: 212, y2: 30 },
        { kind: 'wire', x1: 212, y1: 30, x2: 212, y2: 114 },
        { kind: 'wire', x1: 212, y1: 114, x2: 30, y2: 114 },
        { kind: 'node', sx: 150, sy: 30 },
        { kind: 'node', sx: 150, sy: 114 },
      ]);
    });
    app.setCamera([-0.2, 3.3, 4.9], [0.3, 1.22, 0]);
    ctl.clear();
    const btns = [];
    const paint = () => btns.forEach(({ b, v }) => b.classList.toggle('active', v === S19.mode));
    [['off', 'OFF'], ['dcv', '直流电压 5V'], ['dca', '直流电流 250mA'], ['ohm', '电阻 ×1']].forEach(([v, t]) => {
      const b = ctl.button({ label: t, onClick() { S19.mode = v; updMM(); paint(); } });
      btns.push({ b, v });
    });
    paint();
    ctl.sep();
    const pts = [];
    const paint2 = () => pts.forEach(({ b, v }) => b.classList.toggle('active', v === S19.point));
    [['r2', '表笔接 R₂ 两端'], ['main', '表笔串入干路']].forEach(([v, t]) => {
      const b = ctl.button({ label: t, onClick() { S19.point = v; updMM(); paint2(); } });
      pts.push({ b, v });
    });
    paint2();
    setHUD([['mode', '当前档位'], ['probe', '表笔位置'], ['val', '读数'], ['tip', '用法要点']]);
    updMM();
  },
});
function updMM() {
  solveNow();
  const rec = ELVIS.get('mmr');
  let val = '–', tip = '';
  const uR2 = 3 * 20 / 30;
  if (S19.mode === 'off') { val = '表笔拔出/关闭'; tip = '用完关机省电'; }
  else if (S19.mode === 'dcv') {
    val = S19.point === 'r2' ? uR2.toFixed(2) + ' V' : '串在干路测压：示数≈3V';
    tip = '电压档并联接入';
  } else if (S19.mode === 'dca') {
    val = S19.point === 'main' ? (3 / 30 * 1000).toFixed(0) + ' mA' : '并联测电流 → 危险短路！';
    tip = '电流档必须串联，严禁并联';
  } else {
    val = S19.point === 'r2' ? (20).toFixed(1) + ' Ω' : '干路电阻 = R1+R2+内阻';
    tip = '电阻档必须断开电源';
  }
  if (rec && rec.parts.needle) {
    let f = 0.05;
    if (S19.mode === 'dcv') f = 0.1 + (S19.point === 'r2' ? uR2 / 5 * 0.85 : 0.85);
    else if (S19.mode === 'dca') f = S19.point === 'main' ? 0.45 : 0.95;
    else if (S19.mode === 'ohm') f = S19.point === 'r2' ? 0.55 : 0.35;
    rec.parts.needle.rotation.z = Math.PI * 0.78 - f * Math.PI * 0.56;
  }
  hset('mode', { off: 'OFF', dcv: '直流电压 5V', dca: '直流电流 250mA', ohm: '电阻 ×1' }[S19.mode]);
  hset('probe', S19.point === 'r2' ? 'R₂ 两端（并联）' : '干路（串联）');
  hset('val', val);
  hset('tip', tip);
}

/* ---------- 20 电磁铁 ---------- */
const S20 = { E: 3, N: 150, core: true };
chap({
  id: 'mag', title: '决定电磁铁磁性强弱',
  cam: [-0.3, 3.3, 4.8],
  tgt: [0.4, 1.22, 0],
  html: `<p>通电螺线管自带磁场，插进铁芯后磁场被成倍放大——这就是<b>电磁铁</b>。磁性强度看<b>三个因素</b>：<span class="hl">电流 I 越大、匝数 N 越密、铁芯在位，磁性越猛</span>（吸起的大头针数目 ∝ N·I）。</p>
<p>电磁铁的磁性可以「随电开关」：起重机吸废钢、电磁继电器、磁悬浮列车全靠它。</p>
<p>调电流、加匝数，数一数吸起几根大头针；抽掉铁芯再试；再试试断电。</p>`,
  tasks: [
    { key: 'ni', text: '加大电流或匝数，看吸针数上升' },
    { key: 'core', text: '拔掉铁芯，磁性大幅缩水' },
    { key: 'off', text: '断电，大头针全部落下' },
  ],
  quiz: [
    { q: '抽出铁芯后磁性明显减弱，原因是——', opts: ['电流变小了', '铁芯被磁化后显著增强了外部磁场，抽掉即失去这份增益', '线圈烧毁', '匝数减少'], a: 1, ex: '铁芯的高磁导率把线圈磁场「聚拢放大」；同一电流同一匝数下，有无铁芯的吸力可差数十倍。' },
  ],
  enter() {
    enterBench(() => {
      CIR.dt = 0.002;
      addEl('bat1', { t: 'bat', x: -2.0, z: 0.4, label: '电源', E: S20.E, r: 0.4, a: 1, b: 0 });
      addEl('sw', { t: 'sw', x: -1.1, z: 0.4, label: '开关', R: 1e-4, a: 1, b: 2 });
      addEl('rh', { t: 'rheo', x: -0.2, z: 0.4, label: '电流调节', R: 2, a: 2, b: 3 });
      addEl('mag', { t: 'mag', x: 0.9, z: 0.4, label: '电磁铁', R: 6, a: 3, b: 4 });
      addEl('am', { t: 'gauge', sub: 'A', x: 1.9, z: -0.5, label: '电流表', R: 1e-3, a: 4, b: 0, ry: Math.PI });
      CIR.N = 5;
      const y0 = TABLE_Y + 0.06;
      W_([[-2.22, TABLE_Y + 0.34, 0.4], [-2.5, y0, 0.4], [-2.5, y0, -0.7], [1.9, y0, -0.7], [1.9, TABLE_Y + 0.2, -0.56]], 'bat1');
      W_([[-1.78, TABLE_Y + 0.34, 0.4], [-1.4, y0, 0.4], [-1.28, y0, 0.4]], 'bat1');
      W_([[-0.92, y0, 0.4], [-0.55, y0, 0.4], [-0.38, y0, 0.4]], 'sw');
      W_([[0.0, y0, 0.4], [0.3, y0, 0.4], [0.55, TABLE_Y + 0.2, 0.4]], 'rh');
      W_([[1.25, TABLE_Y + 0.2, 0.4], [1.6, y0, 0.4], [1.9, y0, 0.5]], 'mag');
      drawSchem([
        { kind: 'wire', x1: 30, y1: 114, x2: 46, y2: 114 },
        { kind: 'bat', sx: 56, sy: 114, dir: 'v', sub: 'U' },
        { kind: 'wire', x1: 56, y1: 90, x2: 56, y2: 40 },
        { kind: 'sw', sx: 56, sy: 30, dir: 'h', closed: true, sub: 'S' },
        { kind: 'wire', x1: 64, y1: 30, x2: 90, y2: 30 },
        { kind: 'rheo', sx: 104, sy: 30, dir: 'h', sub: 'R' },
        { kind: 'wire', x1: 116, y1: 30, x2: 140, y2: 30 },
        { kind: 'ind', sx: 154, sy: 30, dir: 'h', sub: 'N匝' },
        { kind: 'wire', x1: 166, y1: 30, x2: 210, y2: 30 },
        { kind: 'wire', x1: 210, y1: 30, x2: 210, y2: 114 },
        { kind: 'am', sx: 128, sy: 114, dir: 'h', sub: 'A' },
        { kind: 'wire', x1: 118, y1: 114, x2: 30, y2: 114 },
      ]);
    });
    app.setCamera([-0.3, 3.3, 4.8], [0.4, 1.22, 0]);
    ctl.clear();
    ctl.slider({ label: '电源电压', min: 0, max: 4, step: 0.25, value: S20.E, fmt: (v) => v.toFixed(2) + ' V', onInput: (v) => { S20.E = v; CIR.els.get('bat1').E = v; solveNow(); updMag(); } });
    ctl.slider({ label: '线圈匝数 N', min: 50, max: 300, step: 10, value: S20.N, fmt: (v) => v + ' 匝', onInput: (v) => { S20.N = v; updMag(); } });
    ctl.sep();
    ctl.toggle({ label: '插入铁芯', value: S20.core, onChange: (v) => { S20.core = v; updMag(); } });
    ctl.toggle({ label: '开关', value: true, onChange: (v) => { setSwitchLogic('sw', v); setSwitchVisual('sw', v); solveNow(); updMag(); } });
    setHUD([['i', '电流'], ['ni', '安匝 N·I'], ['nail', '吸起大头针'], ['note', 'I↑ 或 N↑ → 磁性↑']]);
    updMag();
  },
});
function updMag() {
  solveNow();
  const am = CIR.els.get('am');
  const i = Math.abs(am.I);
  setNeedle('am', i / 1.2);
  const ni = i * S20.N;
  const cnt = clamp(Math.floor(ni / 45 * (S20.core ? 1 : 0.15)), 0, 6);
  const rec = ELVIS.get('mag');
  if (rec && rec.parts.core) rec.parts.core.visible = S20.core;
  if (rec && rec.parts.nails) {
    rec.parts.nails.forEach((nail, k) => {
      if (k < cnt) {
        nail.position.set(-0.045 + k * 0.018, 0.02, 0.012 + (k % 2) * 0.02);
        nail.visible = true;
      } else {
        nail.position.set(0.28 + k * 0.05, 0.04, (k % 3) * 0.06 - 0.06);
        nail.rotation.z = Math.PI / 2 + (k % 2) * 0.2;
      }
    });
  }
  hset('i', i.toFixed(2) + ' A');
  hset('ni', ni.toFixed(0) + ' 安·匝');
  hset('nail', cnt + ' 根');
  hset('note', i < 0.05 ? '断电 → 磁性消失' : '吸钉数 ∝ N·I');
}

/* ---------- 21 太阳能电池驱动电动机 ---------- */
const S21 = { light: 0.8, tilt: 0, sw: true, omega: 0 };
chap({
  id: 'solar', title: '太阳能电池与电动机',
  cam: [-0.4, 3.3, 4.8],
  tgt: [-0.1, 1.22, 0],
  html: `<p>太阳能电池板先做<b>光能 → 电能</b>（光伏效应），电动机再接着做<b>电能 → 机械能</b>。光伏电池的性质接近「<b>恒流源</b>」：<span class="hl">短路电流随光照线性增长</span>；光照一弱，可输出的电流就缩水，转速下滑直至停转。</p>
<p>面板正对阳光（倾角摆对）时接收功率最大——太阳能电站追着太阳转，道理就在这。</p>
<p>拖「光照」和「倾角」看转速变化；断开开关，电压表读数就是<b>开路电压</b>；晚上（光照 = 0）就全停了。</p>`,
  tasks: [
    { key: 'light', text: '把光照从 100% 降到 0%，看电机停转' },
    { key: 'tilt', text: '倾斜面板 60°，观察输出衰减' },
    { key: 'open', text: '断开开关读开路电压' },
  ],
  quiz: [
    { q: '光伏电池「短路电流 ∝ 光照强度」说明它更像哪种电源？', opts: ['恒压源', '恒流源', '纯电阻', '电池组'], a: 1, ex: '负载变化时输出电流几乎不随电压变、只随光照变——恒流源特征；开路电压则随光照缓增。' },
  ],
  enter() {
    enterBench(() => {
      CIR.dt = 0.001;
      addEl('pv', { t: 'solar', x: -1.6, z: 0.4, label: '太阳能板', E: 2.5, r: 10, a: 1, b: 0 });
      CIR.els.get('pv').kind = 'bat';
      addEl('motR', { t: 'motor', x: -0.3, z: 0.4, label: '电动机', R: 4, a: 1, b: 2 });
      addEl('emf', { t: 'res', x: -0.3, z: 0.4, label: '反电动势', kind: 'emf', E: 0, r: 0.02, a: 2, b: 3 });
      CIR.els.get('emf').kind = 'emf';
      addEl('sw', { t: 'sw', x: 0.8, z: 0.4, label: '开关 S', R: S21.sw ? 1e-4 : 1e9, a: 3, b: 4 });
      addEl('am', { t: 'gauge', sub: 'mA', x: 1.5, z: -0.5, label: '电流表', R: 1, a: 4, b: 0, ry: Math.PI });
      CIR.N = 5;
      const y0 = TABLE_Y + 0.06;
      W_([[-1.82, TABLE_Y + 0.3, 0.4], [-2.3, y0, 0.4], [-2.3, y0, -0.7], [1.5, y0, -0.7], [1.5, TABLE_Y + 0.2, -0.56]], 'pv');
      W_([[-1.38, TABLE_Y + 0.3, 0.4], [-1.0, y0, 0.4], [-0.55, y0, 0.4]], 'pv');
      W_([[-0.05, y0, 0.4], [0.4, y0, 0.4], [0.6, TABLE_Y + 0.14, 0.4]], 'motR');
      W_([[1.0, TABLE_Y + 0.14, 0.4], [1.3, y0, 0.4], [1.3, y0, -0.55], [1.5, y0, -0.55]], 'sw');
      drawSchem([
        { kind: 'wire', x1: 30, y1: 30, x2: 44, y2: 30 },
        { kind: 'bat', sx: 54, sy: 30, dir: 'h', sub: 'PV' },
        { kind: 'wire', x1: 66, y1: 30, x2: 90, y2: 30 },
        { kind: 'res', sx: 104, sy: 30, dir: 'h', sub: '电机' },
        { kind: 'wire', x1: 116, y1: 30, x2: 140, y2: 30 },
        { kind: 'bat', sx: 154, sy: 30, dir: 'h', sub: 'E反' },
        { kind: 'wire', x1: 166, y1: 30, x2: 190, y2: 30 },
        { kind: 'sw', sx: 204, sy: 30, dir: 'h', closed: S21.sw, sub: 'S' },
        { kind: 'wire', x1: 216, y1: 30, x2: 232, y2: 30 },
        { kind: 'wire', x1: 232, y1: 30, x2: 232, y2: 114 },
        { kind: 'am', sx: 140, sy: 114, dir: 'h', sub: 'mA' },
        { kind: 'wire', x1: 130, y1: 114, x2: 30, y2: 114 },
        { kind: 'wire', x1: 30, y1: 114, x2: 30, y2: 30 },
      ]);
    });
    app.setCamera([-0.4, 3.3, 4.8], [-0.1, 1.22, 0]);
    ctl.clear();
    ctl.slider({ label: '光照强度', min: 0, max: 100, step: 5, value: S21.light * 100, fmt: (v) => v + ' %', onInput: (v) => { S21.light = v / 100; updSolar(); } });
    ctl.slider({ label: '面板倾角（0=正对阳光）', min: -60, max: 60, step: 5, value: S21.tilt, fmt: (v) => v + '°', onInput: (v) => { S21.tilt = v; updSolar(); } });
    ctl.sep();
    ctl.toggle({ label: '开关 S', value: S21.sw, onChange: (v) => { S21.sw = v; setSwitchLogic('sw', v); setSwitchVisual('sw', v); solveNow(); updSolar(); } });
    setHUD([['u', '板端电压'], ['i', '电流'], ['w', '电机转速'], ['note', '光能→电能→机械能']]);
    updSolar();
  },
});
function updSolar() {
  const eff = Math.cos(S21.tilt * Math.PI / 180) * 0.92 + 0.08;
  const E = 3.2 * S21.light * eff;
  CIR.els.get('pv').E = E;
  const rec = ELVIS.get('pv');
  if (rec && rec.parts.panel) rec.parts.panel.rotation.x = -0.35 - S21.tilt * Math.PI / 180;
  solveNow();
  const i = Math.abs(CIR.els.get('emf').I);
  hset('u', CIR.els.get('pv').V.toFixed(2) + ' V' + (S21.sw ? '' : '（开路）'));
  hset('i', (i * 1000).toFixed(0) + ' mA');
  hset('w', S21.omega.toFixed(1) + ' rad/s');
  hset('note', S21.light === 0 ? '夜晚：光伏无输出' : !S21.sw ? '开关断开：电压表读数 = 开路电压' : (Math.abs(S21.tilt) > 30 ? '倾角大：受光面积减小' : '光照↑ → 短路电流成正比↑'));
}
function solarTick(dt) {
  const i = Math.abs(CIR.els.get('emf').I);
  S21.omega += (0.3 * i - 0.002 * S21.omega) / 0.008 * dt * 0.15;
  S21.omega = clamp(S21.omega, 0, 40);
  CIR.els.get('emf').E = 0.3 * S21.omega;
  const rec = ELVIS.get('motR');
  if (rec && rec.parts.rotor) rec.parts.rotor.rotation.z -= S21.omega * dt * 1.5;
  solveNow();
  updSolar();
}
/* ---------- 22 空白实验台 ---------- */
/* 双模式：教学演示（灯泡/电动机并联罢工实验，原版语义保留） + 自由搭建 DIY
 * DIY = 迷你电路搭建器（原版「导线模式/清空实验台/撤销重做/修复元件/电路 JSON」的语义等价落点）：
 *   元件托盘添加 → 链式自动布线（可切并联支路） → 实时求解读数 → 过流烧毁（保险丝先断）
 *   电路可导出/导入 JSON、生成分享链接，操作全程进撤销/重做栈 */
const S22 = {
  E: 3, R: 6, sw: true, bulb: true, motor: false,        // 教学演示态
  mode: 'teach',                                          // 'teach' | 'diy'
  diyE: 4.5, diyIr: 1.5,                                  // DIY 电池电压 / 保险丝额定
};
/* DIY 元件目录：默认参数 / 滑杆范围 / 额定电流（过流烧毁判据） / 中文名 */
const DIY_CATALOG = {
  bulb:  { name: '小灯泡',   par: 'R',  def: 12,   min: 4,   max: 30,   step: 1,   unit: 'Ω',  Ir: 0.6 },
  res:   { name: '定值电阻', par: 'R',  def: 10,   min: 0.5, max: 50,   step: 0.5, unit: 'Ω',  Ir: 2 },
  rheo:  { name: '滑动变阻器', par: 'R', def: 6,   min: 0,   max: 20,   step: 0.5, unit: 'Ω',  Ir: 2 },
  sw:    { name: '开关',     par: null, def: 1,    min: 0,   max: 1,    step: 1,   unit: '',   Ir: 99 },
  cap:   { name: '电容器',   par: 'C',  def: 470,  min: 100, max: 3000, step: 50,  unit: 'µF', Ir: 99 },
  ind:   { name: '电感线圈', par: 'L',  def: 0.5,  min: 0.05, max: 2,   step: 0.05, unit: 'H', Ir: 1.5 },
  dio:   { name: '二极管',   par: 'VF', def: 0.7,  min: 0.5, max: 3,    step: 0.1, unit: 'V',  Ir: 1 },
  motor: { name: '电动机',   par: 'R',  def: 4,    min: 1,   max: 12,   step: 0.5, unit: 'Ω',  Ir: 2 },
  jumper:{ name: '短接线',   par: null, def: 1,    min: 0,   max: 1,    step: 1,   unit: '',   Ir: 99 },
};
const DIY = {
  items: [],   // { type, par, branch, blown, t, _a, _b, _x, _z, elId, _emfId }
  omega: 0,    // 电动机转速（rpm 教学标定）
  fuseT: 0,    // 保险丝过流计时
};
let diyListEl = null;
function prevSerialBefore(i) { for (let j = i - 1; j >= 0; j--) if (!DIY.items[j].branch) return DIY.items[j]; return null; }

function teachFree() {
  enterBench(() => {
    CIR.dt = 0.002;
    CIR.N = 6;
    addEl('bat1', { t: 'bat', x: -2.2, z: 0.4, label: '电源', E: S22.E, r: 0.3, a: 1, b: 0 });
    addEl('am', { t: 'gauge', sub: 'A', x: -1.35, z: 0.4, label: '电流表', R: 1e-3, a: 1, b: 2 });
    addEl('sw', { t: 'sw', x: -0.6, z: 0.4, label: '开关 S', R: S22.sw ? 1e-4 : 1e9, a: 2, b: 3 });
    addEl('rh', { t: 'rheo', x: 0.3, z: 0.4, label: '滑动变阻器', R: S22.R, a: 3, b: 4 });
    addEl('lb', { t: 'bulb', x: 1.25, z: 0.72, label: '灯泡', R: 12, a: 4, b: 0 });
    addEl('motR', { t: 'motor', x: 1.25, z: 0.08, label: '电动机', R: 4, a: 4, b: 5 });
    addEl('emf', { t: 'res', x: 2.05, z: 0.08, label: '', kind: 'emf', E: 0, r: 0.02, a: 5, b: 0 });
    CIR.els.get('emf').kind = 'emf';
    addEl('vol', { t: 'gauge', sub: 'V', x: 1.9, z: -0.55, label: '电压表', R: 1e7, a: 4, b: 0, ry: Math.PI });
    const y0 = TABLE_Y + 0.06;
    W_([[-2.42, TABLE_Y + 0.34, 0.4], [-2.7, y0, 0.4], [-2.7, y0, -0.8], [2.6, y0, -0.8], [2.6, y0, 0.1], [2.27, y0, 0.08]], 'bat1');
    W_([[-1.98, TABLE_Y + 0.34, 0.4], [-1.7, y0, 0.4], [-1.5, TABLE_Y + 0.16, 0.4]], 'bat1');
    W_([[-1.2, TABLE_Y + 0.16, 0.4], [-0.95, y0, 0.4], [-0.78, y0, 0.4]], 'am');
    W_([[-0.42, y0, 0.4], [-0.1, y0, 0.4], [0.0, y0, 0.4]], 'sw');
    W_([[0.6, y0, 0.4], [0.9, y0, 0.4], [1.0, y0, 0.4]], 'rh');
    W_([[1.03, y0, 0.62], [0.95, y0, 0.72], [1.0, TABLE_Y + 0.4, 0.72]], 'rh');
    W_([[1.0, y0, 0.18], [0.95, y0, 0.08], [1.0, TABLE_Y + 0.2, 0.08]], 'rh');
    W_([[1.5, TABLE_Y + 0.4, 0.72], [2.2, y0, 0.72], [2.7, y0, 0.72]], 'lb');
    W_([[1.5, TABLE_Y + 0.2, 0.08], [1.9, y0, 0.08], [2.27, y0, 0.08]], 'motR');
    W_([[1.66, TABLE_Y + 0.1, -0.5], [1.7, y0, -0.55], [2.2, y0, -0.55], [2.6, y0, -0.5]], 'vol');
    drawSchem([
      { kind: 'wire', x1: 30, y1: 116, x2: 46, y2: 116 },
      { kind: 'bat', sx: 56, sy: 116, dir: 'v', sub: 'U' },
      { kind: 'wire', x1: 56, y1: 92, x2: 56, y2: 36 },
      { kind: 'am', sx: 70, sy: 28, dir: 'h', sub: 'A' },
      { kind: 'wire', x1: 56, y1: 36, x2: 56, y2: 28 },
      { kind: 'wire', x1: 82, y1: 28, x2: 96, y2: 28 },
      { kind: 'sw', sx: 108, sy: 28, dir: 'h', closed: S22.sw, sub: 'S' },
      { kind: 'wire', x1: 120, y1: 28, x2: 136, y2: 28 },
      { kind: 'rheo', sx: 150, sy: 28, dir: 'h', sub: 'R' },
      { kind: 'wire', x1: 162, y1: 28, x2: 186, y2: 28 },
      { kind: 'node', sx: 186, sy: 28 },
      { kind: 'bulb', sx: 186, sy: 62, dir: 'v', sub: '灯' },
      { kind: 'wire', x1: 186, y1: 28, x2: 186, y2: 50 },
      { kind: 'wire', x1: 186, y1: 74, x2: 186, y2: 116 },
      { kind: 'wire', x1: 186, y1: 28, x2: 232, y2: 28 },
      { kind: 'res', sx: 246, sy: 28, dir: 'h', sub: '电机' },
      { kind: 'wire', x1: 258, y1: 28, x2: 274, y2: 28 },
      { kind: 'wire', x1: 274, y1: 28, x2: 274, y2: 116 },
      { kind: 'wire', x1: 274, y1: 116, x2: 30, y2: 116 },
      { kind: 'node', sx: 186, sy: 116 },
      { kind: 'vol', sx: 240, sy: 74, dir: 'h', sub: 'V' },
      { kind: 'wire', x1: 228, y1: 74, x2: 186, y2: 74 },
      { kind: 'wire', x1: 252, y1: 74, x2: 274, y2: 74 },
    ]);
  });
  setSwitchVisual('sw', S22.sw);
  solveNow();
  updFree();
}

/* ---------- DIY：链式自动布线搭建 ---------- */
/* 拓扑：bat(0→1) → fuse(1→2) → am(2→3) → 元件链(3..K) → 回线(K→0)；vol 并在电池两端。
 * 链上每项默认串入（a=cur→cur+1）；branch=true 的项并联它前面最近的串联项（a/b 复用）。
 * 布位：串联件蛇形两排（z=0.3 / -0.4，每排 5 个），并联支路放宿主正前方（z+0.46）。 */
function diyRebuild() {
  enterBench(() => {
    CIR.dt = 0.002;
    const serialItems = DIY.items.filter((it) => !it.branch);
    CIR.N = 4 + serialItems.length + serialItems.filter((it) => it.type === 'motor').length;
    addEl('bat1', { t: 'bat', x: -2.2, z: 0.4, label: '电池组', E: S22.diyE, r: 0.3, a: 1, b: 0 });
    addEl('fu', { t: 'fuse', x: -1.5, z: 0.4, label: '保险丝 ' + S22.diyIr.toFixed(1) + 'A', R: 0.05, Ir: S22.diyIr, a: 1, b: 2 });
    addEl('am', { t: 'gauge', sub: 'A', x: -0.85, z: 0.4, label: '电流表', R: 1e-3, a: 2, b: 3 });
    addEl('vol', { t: 'gauge', sub: 'V', x: -2.0, z: -0.55, label: '电压表', R: 1e7, a: 1, b: 0, ry: Math.PI });
    const y0 = TABLE_Y + 0.06;
    let cur = 3;
    let placed = 0;
    DIY.items.forEach((it, idx) => {
      const cat = DIY_CATALOG[it.type];
      const host = prevSerialBefore(idx);
      let a, b;
      if (it.branch && host) { a = host._a; b = host._b; }
      else { a = cur; b = cur + 1; cur = b; }
      it._a = a; it._b = b;
      if (!it.branch) {
        const k = placed; placed++;
        it._x = -0.2 + (k % 5) * 0.62;
        it._z = k < 5 ? 0.3 : -0.4;
      } else {
        it._x = (host ? host._x : 0) + 0.02;
        it._z = (host ? host._z : 0.3) + 0.46;
      }
      const spec = { t: it.type === 'jumper' ? 'res' : it.type, x: it._x, z: it._z, label: cat.name + (it.blown ? '（烧毁）' : ''), a, b };
      if (it.type === 'bulb' || it.type === 'res') spec.R = it.par;
      else if (it.type === 'rheo') spec.R = Math.max(it.par, 1e-4);
      else if (it.type === 'sw') spec.R = it.par ? 1e-4 : 1e9;
      else if (it.type === 'cap') { spec.C = it.par * 1e-6; spec.R = 1e-3; }
      else if (it.type === 'ind') spec.L = it.par;
      else if (it.type === 'dio') { spec.VF = it.par; spec.R = 1e9; }
      else if (it.type === 'motor') spec.R = it.par;
      else if (it.type === 'jumper') spec.R = 1e-4;
      const el = addEl('d' + idx, spec);
      el._R0 = spec.R;
      if (it.blown) { el.blown = true; el.R = 1e9; }
      it.elId = 'd' + idx;
      it._emfId = null;
      /* 电动机（串联）= 绕组电阻 + 反电动势源串联（复刻教学章做法），链推进两格 */
      if (it.type === 'motor' && !it.branch) {
        const emf = addEl('de' + idx, { t: 'res', x: it._x + 0.3, z: it._z, label: '', kind: 'emf', E: -(DIY.omega / 9.55) * 0.05, r: 0.02, a: it._b, b: it._b + 1 });
        emf.kind = 'emf';
        emf.E = -(DIY.omega / 9.55) * 0.05;
        cur = it._b + 1;
        it._emfId = 'de' + idx;
      }
    });
    /* 主干走线：电池正极 → 保险丝 → 电流表 → 链首 */
    W_([[-1.94, TABLE_Y + 0.3, 0.4], [-1.8, y0, 0.4], [-1.72, y0, 0.4]], 'bat1');
    W_([[-1.28, y0, 0.4], [-1.07, y0, 0.4]], 'fu');
    const firstSer = serialItems[0];
    const lastSer = serialItems[serialItems.length - 1];
    if (firstSer) {
      W_([[-0.63, y0, 0.4], [firstSer._x - 0.42, y0, firstSer._z], [firstSer._x - 0.26, TABLE_Y + 0.2, firstSer._z]], 'am');
      /* 链间走线：同排直连中点换层；跨排（第 5→6 件）从右端绕行 */
      for (let k = 0; k < serialItems.length - 1; k++) {
        const p = serialItems[k], n2 = serialItems[k + 1];
        if (p._z === n2._z) {
          const midX = (p._x + n2._x) / 2;
          W_([[p._x + 0.26, TABLE_Y + 0.2, p._z], [midX, y0, p._z], [midX, y0, n2._z], [n2._x - 0.26, TABLE_Y + 0.2, n2._z]], p.elId);
        } else {
          const tailId2 = p._emfId || p.elId;
          W_([[p._x + 0.26, TABLE_Y + 0.2, p._z], [2.55, y0, p._z], [2.55, y0, n2._z], [n2._x - 0.26, TABLE_Y + 0.2, n2._z]], tailId2);
        }
      }
      /* 链尾 → 回线 → 电池负极 */
      const tailId = lastSer._emfId || lastSer.elId;
      W_([[lastSer._x + 0.26, TABLE_Y + 0.2, lastSer._z], [2.55, y0, lastSer._z], [2.55, y0, -0.75], [-2.62, y0, -0.75], [-2.62, y0, 0.4], [-2.42, TABLE_Y + 0.34, 0.4]], tailId);
      /* 并联支路跳线（宿主 ↔ 支路件，两根竖直引线表并联形） */
      DIY.items.forEach((it, idx) => {
        if (!it.branch) return;
        const host = prevSerialBefore(idx);
        if (!host || !it.elId) return;
        W_([[host._x + 0.14, TABLE_Y + 0.16, host._z + 0.1], [host._x + 0.14, y0, it._z - 0.14], [it._x - 0.2, TABLE_Y + 0.2, it._z]], host.elId);
        W_([[it._x + 0.2, TABLE_Y + 0.2, it._z], [host._x - 0.14, y0, it._z - 0.14], [host._x - 0.14, TABLE_Y + 0.16, host._z + 0.1]], host.elId);
      });
    }
    /* 回路连接件：链尾节点（或空链时电流表出口）→ 电池负极（r≈0 的 emf 元件承担求解闭环；
     * 视觉回线由导线表达，求解层由此闭合） */
    const loopA = firstSer ? cur : 3;
    const loopEl = addEl('dloop', { t: 'res', x: 2.35, z: firstSer ? lastSer._z : 0.3, label: '', kind: 'emf', E: 0, r: 0.001, a: loopA, b: 0 });
    loopEl.kind = 'emf';
    if (!firstSer) {
      /* 空链：电流表直通负极 = 短路演示态（保险丝会熔断） */
      W_([[-0.63, y0, 0.4], [0.4, y0, 0.4], [2.55, y0, 0.3], [2.55, y0, -0.75], [-2.62, y0, -0.75], [-2.62, y0, 0.4], [-2.42, TABLE_Y + 0.34, 0.4]], 'am');
    }
    /* 电压表并联在电池两端 */
    W_([[-2.42, TABLE_Y + 0.3, 0.4], [-2.62, y0, 0.4], [-2.62, y0, -0.55], [-2.22, TABLE_Y + 0.3, -0.55]], 'vol');
    W_([[-1.98, TABLE_Y + 0.3, 0.4], [-1.98, y0, 0.16], [-1.98, y0, -0.42], [-1.8, TABLE_Y + 0.3, -0.55]], 'bat1');
    drawDiySchem();
  });
  applyLabels();
  solveNow();
  updFree();
}

/* DIY 电路图窗：固定主干（电池/保险丝/电流表/电压表）+ 元件链 */
function drawDiySchem() {
  const els = [];
  els.push({ kind: 'wire', x1: 14, y1: 128, x2: 30, y2: 128 });
  els.push({ kind: 'bat', sx: 40, sy: 128, dir: 'v', sub: S22.diyE.toFixed(1) + 'V' });
  els.push({ kind: 'wire', x1: 40, y1: 104, x2: 40, y2: 88 });
  els.push({ kind: 'res', sx: 58, sy: 88, dir: 'h', sub: 'F' });
  els.push({ kind: 'wire', x1: 68, y1: 88, x2: 82, y2: 88 });
  els.push({ kind: 'am', sx: 92, sy: 88, dir: 'h', sub: 'A' });
  els.push({ kind: 'wire', x1: 102, y1: 88, x2: 114, y2: 88 });
  let sx = 122;
  const kinds = { bulb: 'bulb', res: 'res', rheo: 'rheo', sw: 'sw', cap: 'cap', ind: 'ind', dio: 'dio', motor: 'res', jumper: 'wire' };
  DIY.items.forEach((it) => {
    const k = kinds[it.type] || 'res';
    if (!it.branch) {
      if (sx > 196) sx = 122;
      els.push({ kind: k, sx, sy: 88, dir: 'h', sub: (it.blown ? '✕' : '') + (DIY_CATALOG[it.type].name[0] || '') });
      els.push({ kind: 'wire', x1: sx + 12, y1: 88, x2: sx + 26, y2: 88 });
      sx += 26;
    } else {
      els.push({ kind: k, sx: Math.max(sx - 26, 130), sy: 56, dir: 'h', sub: '‖' + (DIY_CATALOG[it.type].name[0] || '') });
    }
  });
  els.push({ kind: 'wire', x1: 228, y1: 88, x2: 236, y2: 88 });
  els.push({ kind: 'wire', x1: 236, y1: 88, x2: 236, y2: 128 });
  els.push({ kind: 'wire', x1: 236, y1: 128, x2: 14, y2: 128 });
  els.push({ kind: 'vol', sx: 204, sy: 108, dir: 'h', sub: 'V' });
  els.push({ kind: 'wire', x1: 194, y1: 108, x2: 40, y2: 108 });
  els.push({ kind: 'wire', x1: 214, y1: 108, x2: 236, y2: 108 });
  drawSchem(els);
}

/* DIY 右栏 UI：托盘 + 元件清单（每行参数滑杆/串并切换/删除） */
function diyBuildControls() {
  controlsEl.querySelectorAll('.diy-tray, .diy-list, .diy-act').forEach((n) => n.remove());
  const tray = document.createElement('div');
  tray.className = 'diy-tray';
  const tip = document.createElement('div');
  tip.className = 'diy-tip';
  tip.textContent = '点元件加入主链（自动布线）；「并」与前一串联件并接';
  tray.appendChild(tip);
  const row1 = document.createElement('div'); row1.className = 'diy-tray-row';
  const row2 = document.createElement('div'); row2.className = 'diy-tray-row';
  Object.keys(DIY_CATALOG).forEach((k, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'diy-add';
    b.textContent = '+ ' + DIY_CATALOG[k].name;
    b.addEventListener('click', () => { diyAdd(k); });
    (i < 5 ? row1 : row2).appendChild(b);
  });
  tray.append(row1, row2);
  controlsEl.appendChild(tray);
  diyListEl = document.createElement('div');
  diyListEl.className = 'diy-list';
  controlsEl.appendChild(diyListEl);
  const act = document.createElement('div');
  act.className = 'diy-act';
  const bClear = document.createElement('button');
  bClear.type = 'button'; bClear.className = 'ctl-btn'; bClear.textContent = '🧹 清空实验台';
  bClear.addEventListener('click', () => { DIY.items = []; DIY.omega = 0; pushUndoNow(); diyRebuild(); diyBuildControls(); toast('实验台已清空'); });
  const bRepair = document.createElement('button');
  bRepair.type = 'button'; bRepair.className = 'ctl-btn'; bRepair.textContent = '🔧 修复全部故障元件';
  bRepair.addEventListener('click', repairAll);
  act.append(bClear, bRepair);
  controlsEl.appendChild(act);
  refreshDiyList();
}
function diyAdd(type) {
  if (DIY.items.length >= 12) { toast('最多 12 个元件，先删一些再试', 'warn'); return; }
  DIY.items.push({ type, par: DIY_CATALOG[type].def, branch: false, blown: false, t: 0 });
  sfx('click');
  diyRebuild();
  diyBuildControls();
  commitChange();
}
function diyRemove(i) {
  DIY.items.splice(i, 1);
  sfx('snap');
  diyRebuild();
  diyBuildControls();
  commitChange();
}
function refreshDiyList() {
  if (!diyListEl) return;
  diyListEl.innerHTML = '';
  if (!DIY.items.length) {
    const empty = document.createElement('div');
    empty.className = 'diy-empty';
    empty.textContent = '链上还没有元件（空链 = 短路，保险丝会熔断）——点上方元件开始搭建';
    diyListEl.appendChild(empty);
    return;
  }
  DIY.items.forEach((it, i) => {
    const cat = DIY_CATALOG[it.type];
    const row = document.createElement('div');
    row.className = 'diy-item' + (it.blown ? ' blown' : '');
    const head = document.createElement('div');
    head.className = 'diy-item-head';
    const nm = document.createElement('b');
    nm.textContent = (i + 1) + '. ' + cat.name + (it.blown ? ' ❌已烧毁' : '');
    nm.className = 'diy-nm';
    head.appendChild(nm);
    if (cat.par) {
      const sl = document.createElement('input');
      sl.type = 'range'; sl.min = cat.min; sl.max = cat.max; sl.step = cat.step; sl.value = it.par;
      const val = document.createElement('span');
      val.className = 'ctl-val'; val.textContent = it.par + cat.unit;
      sl.addEventListener('input', () => {
        it.par = parseFloat(sl.value);
        val.textContent = it.par + cat.unit;
        const el = CIR.els.get(it.elId);
        if (el && !it.blown) {
          if (it.type === 'cap') el.C = it.par * 1e-6;
          else if (it.type === 'ind') el.L = it.par;
          else if (it.type === 'dio') el.VF = it.par;
          else el.R = Math.max(it.par, it.type === 'rheo' ? 1e-4 : 0.01);
        }
        solveNow(); updFree();
      });
      sl.addEventListener('change', () => pushUndoNow());
      head.append(sl, val);
    }
    const bBr = document.createElement('button');
    bBr.type = 'button';
    bBr.className = 'diy-mini' + (it.branch ? ' on' : '');
    bBr.textContent = it.branch ? '并联' : '串联';
    bBr.title = '切换串联/并联（并联 = 与前一个串联件并接）';
    bBr.addEventListener('click', () => { it.branch = !it.branch; sfx('click'); diyRebuild(); diyBuildControls(); commitChange(); });
    const bDel = document.createElement('button');
    bDel.type = 'button'; bDel.className = 'diy-mini danger'; bDel.textContent = '删除';
    bDel.addEventListener('click', () => diyRemove(i));
    head.append(bBr, bDel);
    row.appendChild(head);
    diyListEl.appendChild(row);
  });
  const meta = document.createElement('div');
  meta.className = 'diy-meta';
  const iNow = CIR.els.get('am') ? Math.abs(CIR.els.get('am').I) : 0;
  meta.textContent = '主链电流 ' + iNow.toFixed(2) + ' A · 元件 ' + DIY.items.length + '/12';
  diyListEl.appendChild(meta);
}

function diyFree() {
  DIY.omega = 0; DIY.fuseT = 0;
  DIY.items.forEach((it) => { it.t = 0; });
  diyRebuild();
  { const [p2, t2] = framedCam(SECTIONS[SECTIONS.length - 1]); app.setCamera(p2, t2); }
  ctl.clear();
  ctl.slider({ label: '电池电压', min: 0, max: 9, step: 0.25, value: S22.diyE, fmt: (v) => v.toFixed(2) + ' V', onInput: (v) => { pushUndoSoon(); S22.diyE = v; const b = CIR.els.get('bat1'); if (b) b.E = v; solveNow(); updFree(); } });
  ctl.slider({ label: '保险丝额定', min: 0.5, max: 3, step: 0.1, value: S22.diyIr, fmt: (v) => v.toFixed(1) + ' A', onInput: (v) => { pushUndoSoon(); S22.diyIr = v; const f = CIR.els.get('fu'); if (f && !f.blown) f.Ir = v; solveNow(); updFree(); } });
  ctl.sep();
  diyBuildControls();
  setHUD([['i', '主链电流'], ['u', '路端电压'], ['fuse', '保险丝'], ['st', '链状态'], ['note', '自由搭建']]);
  updFree();
}

/* DIY 每帧：瞬态推进（含 C/L）+ 过流烧毁计时 + 电动机转子/反电动势 + 读数 */
function diyTick(dt) {
  const els = [...CIR.els.values()];
  const hasCL = els.some((e) => e.kind === 'cap' || e.kind === 'ind');
  if (hasCL) {
    const n = Math.max(1, Math.round(dt * 0.5 * SIM.prec / CIR.dt));
    for (let k = 0; k < n; k++) solveCircuit();
  } else {
    solveNow();
  }
  /* 电动机动态（转速一阶趋近 + 反电动势 + 转子动画） */
  let anyMotor = false;
  DIY.items.forEach((it) => {
    if (it.type !== 'motor' || it.blown || it.branch) return;
    const e = CIR.els.get(it.elId);
    if (!e) return;
    const u = Math.abs(e.V);
    DIY.omega += ((u / 0.05) * 9.55 * 0.02 - DIY.omega * 0.9) * dt * 2.2;
    DIY.omega = clamp(DIY.omega, 0, 2000);
    const emf = it._emfId ? CIR.els.get(it._emfId) : null;
    if (emf) emf.E = -(DIY.omega / 9.55) * 0.05;
    const rec = ELVIS.get(it.elId);
    if (rec && rec.parts && rec.parts.rotor) rec.parts.rotor.rotation.z -= DIY.omega * dt * 0.04;
    anyMotor = true;
  });
  if (!anyMotor && DIY.omega > 0) DIY.omega = Math.max(0, DIY.omega - dt * 900);
  /* 灯泡视觉 */
  DIY.items.forEach((it) => {
    if (it.type !== 'bulb') return;
    const e = CIR.els.get(it.elId);
    bulbGlow(it.elId, e && !it.blown ? Math.abs(e.I) / 0.22 : 0);
  });
  /* 过流烧毁：保险丝 1.4×Ir 即断；元件按各自额定持续 0.6s 烧毁 */
  const fu = CIR.els.get('fu');
  if (fu && !fu.blown) {
    if (Math.abs(fu.I) > 1.4 * fu.Ir) {
      DIY.fuseT += dt;
      if (DIY.fuseT > 0.15) {
        fu.blown = true; fu.R = 1e9;
        const rec = ELVIS.get('fu');
        if (rec && rec.parts && rec.parts.wire) rec.parts.wire.visible = false;
        sfx('burn');
        toast('⚡ 保险丝熔断了！先排除短路（删除短接线）再点「修复全部故障元件」，否则新保险丝会再熔断', 'warn');
        DIY.fuseT = 0;
      }
    } else DIY.fuseT = Math.max(0, DIY.fuseT - dt * 2);
  }
  let blownNew = false;
  DIY.items.forEach((it) => {
    if (it.blown) return;
    const cat = DIY_CATALOG[it.type];
    if (cat.Ir > 50) return; /* 开关/电容/短接线不烧 */
    const e = CIR.els.get(it.elId);
    if (!e) return;
    if (Math.abs(e.I) > cat.Ir) {
      it.t += dt;
      if (it.t > 0.6) {
        it.blown = true; blownNew = true; it.t = 0;
        const rec = ELVIS.get(it.elId);
        if (rec && rec.group) {
          const cover = box(0.34, 0.3, 0.3, new THREE.MeshStandardMaterial({ color: 0x14100c, roughness: 0.95, transparent: true, opacity: 0.86 }));
          cover.position.y = 0.16;
          rec.group.add(cover);
        }
        sfx('burn');
        toast('🔥 ' + cat.name + ' 过流烧毁（限 ' + cat.Ir + ' A）', 'warn');
      }
    } else it.t = Math.max(0, it.t - dt * 2);
  });
  if (blownNew) { solveNow(); refreshDiyList(); }
  updFree();
}

/* DIY 序列化（导出/分享/撤销快照共用） */
function diySerialize() {
  return {
    E: S22.diyE, Ir: S22.diyIr,
    items: DIY.items.map((it) => ({ type: it.type, par: it.par, branch: it.branch, blown: it.blown })),
  };
}
function diyRestore(s) {
  if (!s || !Array.isArray(s.items)) return;
  S22.diyE = typeof s.E === 'number' ? s.E : 4.5;
  S22.diyIr = typeof s.Ir === 'number' ? s.Ir : 1.5;
  DIY.omega = 0; DIY.fuseT = 0;
  DIY.items = s.items.filter((r) => DIY_CATALOG[r.type]).map((r) => ({ type: r.type, par: r.par, branch: !!r.branch, blown: false, t: 0 }));
  if (CH && CH.id === 'free' && S22.mode === 'diy') {
    diyRebuild();
    diyBuildControls();
  }
}

chap({
  id: 'free', title: '空白实验台',
  cam: [-0.2, 3.4, 4.9],
  tgt: [0, 1.22, 0],
  fitW: 7.2, fitH: 3.1,
  html: `<p>实验台交给你：<b>教学演示</b>里电源、开关、滑动变阻器、小灯泡、电动机已接成并联，调电压与变阻器看谁先「罢工」。</p>
<p>切到<b>自由搭建</b>，你就是电路工程师：从元件托盘点选灯泡、电阻、电容、电感、二极管、电动机、短接线加入主链（自动布线），一键切并联，调参数，过流了保险丝会先熔断保护电路。电路可导出 JSON、生成分享链接。</p>
<p>试一试：短接线直接跨在主链上——看保险丝怎么「牺牲自己，保住大家」。</p>`,
  tasks: [
    { key: 'both', text: '教学演示：同时接入灯泡与电动机支路' },
    { key: 'diy1', text: '自由搭建：加 3 个以上元件并让电路跑起来' },
    { key: 'diy2', text: '用短接线触发一次保险丝熔断，再修复它' },
  ],
  quiz: [
    { q: '空白台上灯泡与电动机互不影响，说明它们是——', opts: ['串联', '并联', '混联', '没连接'], a: 1, ex: '并联各支路独立工作：关掉一路另一路照常——互不影响正是并联的判据。' },
    { q: '自由搭建时保险丝熔断了，说明电路里出现了——', opts: ['断路', '过流（短路或元件超限）', '电压太高但电流正常', '正常现象无需处理'], a: 1, ex: '保险丝是「安排好的牺牲品」：电流超过额定约 1.4 倍就抢先熔断，先排查短路或过载元件，再修复。' },
  ],
  enter() {
    ctl.clear();
    if (S22.mode === 'diy') diyFree(); else { teachFree(); buildTeachControls(); }
    buildFreeSeg();
  },
});
/* 模式切换 seg（独立 DOM，不进 ctl 面板——免被各模式控件 clear 冲掉） */
let freeSegEl = null;
function buildFreeSeg() {
  if (freeSegEl) freeSegEl.remove();
  freeSegEl = document.createElement('div');
  freeSegEl.className = 'free-seg';
  freeSegEl.setAttribute('role', 'group');
  freeSegEl.setAttribute('aria-label', '空白实验台模式');
  [['teach', '教学演示'], ['diy', '自由搭建 DIY']].forEach(([v, t]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'free-seg-btn' + (S22.mode === v ? ' on' : '');
    b.textContent = t;
    b.addEventListener('click', () => {
      if (S22.mode === v) return;
      S22.mode = v;
      sfx('snap');
      if (v === 'diy') diyFree(); else { teachFree(); buildTeachControls(); }
      buildFreeSeg();
      commitChange();
    });
    freeSegEl.appendChild(b);
  });
  controlsEl.parentElement.insertBefore(freeSegEl, controlsEl);
}
function buildTeachControls() {
  { const [p2, t2] = framedCam(SECTIONS[SECTIONS.length - 1]); app.setCamera(p2, t2); }
  ctl.clear();
  ctl.slider({ label: '电源电压', min: 0, max: 6, step: 0.25, value: S22.E, fmt: (v) => v.toFixed(2) + ' V', onInput: (v) => { pushUndoSoon(); S22.E = v; CIR.els.get('bat1').E = v; solveNow(); updFree(); } });
  ctl.slider({ label: '滑动变阻器', min: 0, max: 20, step: 0.5, value: S22.R, fmt: (v) => v.toFixed(1) + ' Ω', onInput: (v) => { pushUndoSoon(); S22.R = v; CIR.els.get('rh').R = v; setSliderVisual('rh', v / 20); solveNow(); updFree(); } });
  ctl.sep();
  ctl.toggle({ label: '开关 S', value: S22.sw, onChange: (v) => { pushUndoSoon(); S22.sw = v; setSwitchLogic('sw', v); setSwitchVisual('sw', v); solveNow(); updFree(); } });
  ctl.toggle({ label: '灯泡支路', value: S22.bulb, onChange: (v) => { S22.bulb = v; freeRebuild(); } });
  ctl.toggle({ label: '电动机支路', value: S22.motor, onChange: (v) => { S22.motor = v; freeRebuild(); } });
  setHUD([['i', '干路电流'], ['u', '并联部分电压'], ['st', '支路状态'], ['note', '自由探索']]);
  updFree();
}
function freeRebuild() {
  if (S22.mode === 'diy') { diyRebuild(); diyBuildControls(); return; }
  teachFree();
  buildTeachControls();
}
function updFree() {
  if (S22.mode === 'diy') { updDiyHud(); return; }
  solveNow();
  const am = CIR.els.get('am'), vol = CIR.els.get('vol');
  const i = Math.abs(am.I);
  const u = Math.abs(vol.V);
  setNeedle('am', clamp(i / 1.2, 0, 1.1));
  setNeedle('vol', clamp(u / 6, 0, 1.05));
  bulbGlow('lb', Math.abs(CIR.els.get('lb').I) / 0.2);
  hset('i', i.toFixed(3) + ' A');
  hset('u', u.toFixed(2) + ' V（并联部分）');
  hset('st', [
    S22.bulb ? '灯 ✓' : '灯 ✗',
    S22.motor ? '电机 ✓（' + (S22.freeW || 0).toFixed(0) + ' rpm）' : '电机 ✗',
  ].join(' · '));
  hset('note', '并联支路互不影响');
}
function updDiyHud() {
  const am = CIR.els.get('am'), vol = CIR.els.get('vol'), fu = CIR.els.get('fu');
  const i = am ? Math.abs(am.I) : 0;
  const u = vol ? Math.abs(vol.V) : 0;
  setNeedle('am', clamp(i / 3, 0, 1.1));
  setNeedle('vol', clamp(u / 9, 0, 1.05));
  hset('i', fu && fu.blown ? '0 A（保险丝已断）' : i.toFixed(3) + ' A');
  hset('u', u.toFixed(2) + ' V（路端）');
  hset('fuse', fu ? (fu.blown ? '❌ 已熔断' : Math.abs(fu.I) > 1.1 * fu.Ir ? '🔥 过流警告 ' + Math.abs(fu.I).toFixed(1) + '/' + fu.Ir.toFixed(1) + ' A' : '✓ ' + Math.abs(fu.I).toFixed(2) + '/' + fu.Ir.toFixed(1) + ' A') : '—');
  const mot = DIY.items.find((it) => it.type === 'motor' && !it.blown);
  hset('st', [
    DIY.items.length ? DIY.items.length + ' 件在链' : '空链（短路态）',
    mot ? '电机 ' + DIY.omega.toFixed(0) + ' rpm' : '无电机',
    DIY.items.some((it) => it.blown) ? '有烧毁元件' : '元件完好',
  ].join(' · '));
  hset('note', '过流先断保险丝 · 点「修复全部故障元件」复位');
  if (diyListEl) {
    const meta = diyListEl.querySelector('.diy-meta');
    if (meta) meta.textContent = '主链电流 ' + i.toFixed(2) + ' A · 元件 ' + DIY.items.length + '/12';
  }
}
/* ================= 帧循环 ================= */

/* ================= 全局仿真控制台状态（原版工具块语义等价载体） ================= */
const SIM = {
  paused: false,      /* 暂停/运行 */
  stepReq: false,     /* 单步放行一帧 */
  timeScale: 1,       /* 时间流速 × */
  prec: 1,            /* 求解精度（每帧计算步数倍率） */
  beads: true,        /* 电流动画 */
  electronDir: false, /* 电子流向（false=电流方向） */
  potColor: false,    /* 电势着色 */
  labels: true,       /* 3D 标签 */
  sound: false,       /* 音效 */
};
const WIRE_COLOR_BASE = new THREE.Color(VP.wireRed);

/* 电势 → 颜色：低电势青蓝 · 零电势灰 · 高电势橙红（相对全电路峰值归一） */
function applyPotColors() {
  if (!CIR.nodeV || !CIR.nodeV.length) return;
  let peak = 1e-6;
  for (const v of CIR.nodeV) peak = Math.max(peak, Math.abs(v));
  wires.forEach((w) => {
    const el = CIR.els.get(w.elId);
    if (!el) return;
    const va = el.a > 0 ? CIR.nodeV[el.a - 1] : 0;
    const vb = el.b > 0 ? CIR.nodeV[el.b - 1] : 0;
    const t = clamp(((va + vb) / 2) / peak, -1, 1);
    w.tube.material.color.setHSL(t >= 0 ? 0.055 - t * 0.055 : 0.58 + t * 0.06, 0.78, 0.5 + Math.abs(t) * 0.08);
  });
}
function clearPotColors() {
  wires.forEach((w) => { w.tube.material.color.copy(WIRE_COLOR_BASE); });
}
function applyLabels() {
  if (!cirG) return;
  cirG.traverse((o) => { if (o.isSprite && o.userData.label !== false) o.visible = SIM.labels; });
}

/* WebAudio 极简音效（咔嗒 / 蜂鸣 / 烧断嘶声），sound 总开关控制 */
let actx = null;
function sfx(kind) {
  if (!SIM.sound) return;
  try {
    if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
    const t0 = actx.currentTime;
    const o = actx.createOscillator(), g = actx.createGain();
    o.connect(g); g.connect(actx.destination);
    if (kind === 'click') {
      o.type = 'square'; o.frequency.value = 1900;
      g.gain.setValueAtTime(0.05, t0); g.gain.exponentialRampToValueAtTime(0.0004, t0 + 0.035);
      o.start(t0); o.stop(t0 + 0.04);
    } else if (kind === 'snap') {
      o.type = 'square'; o.frequency.setValueAtTime(320, t0); o.frequency.exponentialRampToValueAtTime(90, t0 + 0.09);
      g.gain.setValueAtTime(0.07, t0); g.gain.exponentialRampToValueAtTime(0.0004, t0 + 0.1);
      o.start(t0); o.stop(t0 + 0.11);
    } else if (kind === 'burn') {
      o.type = 'sawtooth'; o.frequency.setValueAtTime(1400, t0); o.frequency.exponentialRampToValueAtTime(120, t0 + 0.4);
      g.gain.setValueAtTime(0.09, t0); g.gain.exponentialRampToValueAtTime(0.0004, t0 + 0.42);
      o.start(t0); o.stop(t0 + 0.45);
    } else if (kind === 'beep') {
      o.type = 'sine'; o.frequency.value = 880;
      g.gain.setValueAtTime(0.045, t0); g.gain.exponentialRampToValueAtTime(0.0004, t0 + 0.16);
      o.start(t0); o.stop(t0 + 0.18);
    }
  } catch (e) { /* 音频不可用静默跳过 */ }
}

app.onFrame((dt0) => {
  if (activeScene !== scenes.bench || !CIR) return;
  /* 暂停：不放行动态，只保留静态渲染；单步：放行一帧并固定推进 0.05s 仿真量 */
  if (SIM.paused && !SIM.stepReq) return;
  const dt = SIM.stepReq ? 0.05 : dt0 * SIM.timeScale;
  SIM.stepReq = false;
  if (beadField) beadField.visible = SIM.beads;
  /* 导线电流小珠（电子流向 = 与电流方向相反） */
  wires.forEach((w) => {
    const el = CIR.els.get(w.elId);
    stepBeads(w, (SIM.electronDir ? -1 : 1) * (el ? el.I || 0 : 0), dt);
  });
  /* 电势着色 */
  if (SIM.potColor) applyPotColors();
  // 各章动态
  if (CH === null) return;
  switch (CH.id) {
    case 'rc': {
      if (S5.mode !== 'off') {
        const n = Math.max(1, Math.round(dt * S5.speed * SIM.prec / CIR.dt));
        for (let k = 0; k < n; k++) solveCircuit();
        S5.t += n * CIR.dt;
        if (S5.trace.length === 0 || S5.t - S5.trace[S5.trace.length - 1][0] > 0.004) {
          S5.trace.push([S5.t, CIR.els.get('cap').V]);
          if (S5.trace.length > 220) S5.trace.shift();
          drawRcScope();
        }
        updRc();
      }
      break;
    }
    case 'selfind': {
      if (!S6.closed || Math.abs(CIR.els.get('ind').iL) > 1e-4) {
        const n = Math.max(1, Math.round(dt * 0.35 * SIM.prec / CIR.dt));
        for (let k = 0; k < n; k++) solveCircuit();
        updSelf();
      }
      break;
    }
    case 'lc': {
      if (S7.running) {
        const n = Math.max(1, Math.round(dt * 0.08 * SIM.prec / CIR.dt));
        for (let k = 0; k < n; k++) solveCircuit();
        S7.trace.push([S7.trace.length * 0.005, CIR.els.get('cap').V, CIR.els.get('ind').iL]);
        if (S7.trace.length > 240) S7.trace.shift();
        const sc = makeScope('u_C 与 i_L 波形');
        scopeBase('t/s', 'u/V i/A');
        const ctx = sc.ctx;
        const toX = (t) => 24 + (t / 1.2) * 180;
        const toY = (v) => 112 - clamp(v / 3.3, -1, 1) * 48;
        ctx.strokeStyle = '#ff9b5e'; ctx.lineWidth = 1.4;
        ctx.beginPath();
        S7.trace.forEach(([t, u], k) => { const x = toX(t), y = toY(u); if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); });
        ctx.stroke();
        ctx.strokeStyle = '#6fb3e0';
        ctx.beginPath();
        ctx.beginPath();
        let doneFirst = false;
        S7.trace.forEach(([t, , il], k) => {
          const x = toX(t), y = toY(clamp(il * 2.5, -3.2, 3.2));
          if (!doneFirst) { ctx.moveTo(x, y); doneFirst = true; } else ctx.lineTo(x, y);
        });
        ctx.stroke();
        updLc();
      }
      break;
    }
    case 'bridge': {
      const n = Math.max(1, Math.round(dt * 0.018 * SIM.prec / CIR.dt));
      for (let k = 0; k < n; k++) {
        CIR.els.get('ac').E = 6 * Math.sin(TAU * 50 * S8.tt);
        S8.tt += CIR.dt;
        solveCircuit();
      }
      const u2 = CIR.els.get('load').V;
      S8.trace.push([S8.tt % 0.04, u2, CIR.els.get('ac').E]);
      if (S8.trace.length > 200) S8.trace.shift();
      const sc = makeScope('输出波形（整流/滤波）');
      scopeBase('t/ms', 'u/V');
      const ctx = sc.ctx;
      const toX = (t) => 24 + (t / 0.04) * 180;
      const toY = (u) => 61 - clamp(u / 7.5, -1, 1) * 48;
      ctx.strokeStyle = '#6fb3e0'; ctx.lineWidth = 1;
      ctx.beginPath();
      let first = true;
      S8.trace.forEach(([t, , e]) => { const x = toX(t), y = toY(e); if (first) { ctx.moveTo(x, y); first = false; } else ctx.lineTo(x, y); });
      ctx.stroke();
      ctx.strokeStyle = '#ff9b5e'; ctx.lineWidth = 1.6;
      ctx.beginPath();
      first = true;
      S8.trace.forEach(([t, u]) => { const x = toX(t), y = toY(u); if (first) { ctx.moveTo(x, y); first = false; } else ctx.lineTo(x, y); });
      ctx.stroke();
      updBridge();
      break;
    }
    case 'motor': motorTick(dt); break;
    case 'solar': solarTick(dt); break;
    case 'short': shortTick(dt * 0.25); break;
    case 'joule': jouleTick(dt); break;
    case 'free': {
      if (S22.mode === 'diy') { diyTick(dt); break; }
      if (S22.motor) {
        const i = Math.abs(CIR.els.get('emf').I);
        S22.freeW = (S22.freeW || 0) + ((0.15 * i / 0.004) * 0.4 - (S22.freeW || 0)) * dt * 1.2;
        S22.freeW = clamp(S22.freeW, 0, 2000);
        CIR.els.get('emf').E = clamp((S22.freeW || 0) / 9.55 * 0.05, 0, 4);
        const rec = ELVIS.get('motR');
        if (rec && rec.parts.rotor) rec.parts.rotor.rotation.z -= (S22.freeW || 0) * dt * 0.04;
        solveNow();
        updFree();
      }
      break;
    }
  }
});

/* ================= UI 接线：章节列表 / 折叠体系 / 手风琴 / 专注模式 ================= */

const voltShell = document.getElementById('voltShell');
const chapNavEl = document.getElementById('chapNav');
const chapCountEl = document.getElementById('chapCount');
const railNoL = document.getElementById('railNoL');
const railTitleR = document.getElementById('railTitleR');
const detailNoEl = document.getElementById('detailNo');
const detailTitleEl = document.getElementById('detailTitle');
const lessonEl = document.getElementById('lesson');
const detailBodyEl = document.getElementById('detailBody');
const controlsEl = document.getElementById('controls');

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
  chapNavEl.appendChild(b);
  return b;
});

let chapterIdx = 0;

/* 自动取景：保留各章既定视角方向，按「电路布局所需可视宽度」反推相机距离
 * （三栏布局下舞台变窄，旧全宽标定的距离会把电路两侧裁掉） */
const FIT = { w: 5.9, h: 2.9 };
function framedCam(sec) {
  const w = stage.clientWidth || 900, h = stage.clientHeight || 700;
  const aspect = w / h;
  const half = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  const needW = sec.fitW || FIT.w, needH = sec.fitH || FIT.h;
  const d = Math.max(needW / (2 * half * aspect), needH / (2 * half), camera.near * 4);
  const dir = new THREE.Vector3(sec.cam[0] - sec.tgt[0], sec.cam[1] - sec.tgt[1], sec.cam[2] - sec.tgt[2]).normalize();
  return [
    [sec.tgt[0] + dir.x * d, sec.tgt[1] + dir.y * d, sec.tgt[2] + dir.z * d],
    sec.tgt,
  ];
}

function selectChapter(i) {
  chapterIdx = clamp(i, 0, SECTIONS.length - 1);
  const sec = SECTIONS[chapterIdx];
  chapBtns.forEach((b, j) => {
    const on = j === chapterIdx;
    b.classList.toggle('on', on);
    if (on) b.setAttribute('aria-current', 'true');
    else b.removeAttribute('aria-current');
  });
  chapCountEl.textContent = String(chapterIdx + 1).padStart(2, '0') + '/' + String(SECTIONS.length).padStart(2, '0');
  detailNoEl.textContent = String(chapterIdx + 1).padStart(2, '0');
  detailTitleEl.textContent = sec.title;
  railNoL.textContent = String(chapterIdx + 1).padStart(2, '0');
  railTitleR.textContent = sec.title;
  lessonEl.innerHTML = sec.html;
  taskDefs = sec.tasks || [];
  renderTasks();
  renderQuiz(sec.quiz);
  CH = sec; /* 当前章引用：帧循环按 CH.id 分派各章动态 */
  sec.enter();
  accSecs.controls.classList.toggle('acc-empty', !controlsEl.children.length);
  accSecs.data.classList.toggle('acc-empty', false);
  if (hud) hud.el.style.display = '';
  detailBodyEl.scrollTop = 0;
  applyLabels();
  HIST.s = [snapState()]; HIST.i = 0; /* 切章 = 撤销边界 */
  const [pos, tgt] = framedCam(sec);
  app.setCamera(pos, tgt);
}

function gotoChapter(i) { selectChapter((i + SECTIONS.length) % SECTIONS.length); }

/* ---------------- 提示浮条 ---------------- */

let toastTimer = 0;
const toastEl = document.createElement('div');
toastEl.className = 'volt-toast';
stage.appendChild(toastEl);
function toast(msg, kind = '') {
  toastEl.textContent = msg;
  toastEl.classList.toggle('ok', kind === 'ok');
  toastEl.classList.toggle('warn', kind === 'warn');
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2600);
}

/* ---------------- 本章任务 chip（行动指令，命中打勾） ---------------- */

let taskDefs = [];
function renderTasks() {
  document.querySelectorAll('#lesson .lc-tasks').forEach((n) => n.remove());
  if (!taskDefs.length) return;
  const box = document.createElement('div');
  box.className = 'lc-tasks';
  const head = document.createElement('div');
  head.style.cssText = 'font-size:11.5px;font-weight:600;letter-spacing:0.1em;color:var(--text-faint)';
  head.textContent = '本章任务';
  box.appendChild(head);
  taskDefs.forEach((tk) => {
    const chip = document.createElement('div');
    chip.className = 'task-chip';
    chip.dataset.key = tk.key;
    const bx = document.createElement('span');
    bx.className = 'tk-box';
    bx.textContent = '✓';
    const tx = document.createElement('span');
    tx.textContent = tk.text;
    chip.append(bx, tx);
    box.appendChild(chip);
  });
  lessonEl.appendChild(box);
}
function taskHit(key) {
  const chip = document.querySelector(`#lesson .task-chip[data-key="${key}"]`);
  if (chip && !chip.classList.contains('done')) {
    chip.classList.add('done');
    toast('任务完成：' + (taskDefs.find((t) => t.key === key)?.text || ''), 'ok');
  }
}

/* ---------------- 随堂检测（判分 + 解析） ---------------- */

function renderQuiz(items) {
  let box = document.querySelector('#lesson .lc-quiz');
  if (box) box.remove();
  if (!items || !items.length) return;
  box = document.createElement('div');
  box.className = 'lc-quiz';
  const head = document.createElement('div');
  head.className = 'quiz-head';
  head.textContent = '随堂一问';
  box.appendChild(head);
  items.forEach((item) => {
    const q = document.createElement('div');
    q.className = 'quiz-q';
    const qt = document.createElement('div');
    qt.className = 'quiz-t';
    qt.textContent = item.q;
    q.appendChild(qt);
    const ex = document.createElement('div');
    ex.className = 'quiz-ex';
    item.opts.forEach((opt, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'ctl-btn';
      b.textContent = String.fromCharCode(65 + i) + '. ' + opt;
      b.addEventListener('click', () => {
        q.querySelectorAll('button').forEach((bb, j) => {
          bb.disabled = true;
          if (j === item.a) bb.classList.add('right');
          else if (j === i) bb.classList.add('dim');
        });
        ex.style.display = 'block';
        ex.textContent = (i === item.a ? '✓ ' : '✗ ') + item.ex;
        if (i === item.a) toast('答对了', 'ok');
      });
      q.appendChild(b);
    });
    q.appendChild(ex);
    box.appendChild(q);
  });
  lessonEl.appendChild(box);
}

/* ---------------- 左右栏折叠（28px 竖条）× 专注模式 ---------------- */

const foldLBtn = document.getElementById('foldLBtn');
const unfoldLBtn = document.getElementById('unfoldLBtn');
const foldRBtn = document.getElementById('foldRBtn');
const unfoldRBtn = document.getElementById('unfoldRBtn');
const focusBtn = document.getElementById('focusBtn');
const FOLD_KEY = { l: 'volt.foldL', r: 'volt.foldR' };
let foldL = false;
let foldR = false;
let focusSaved = null;

try {
  foldL = localStorage.getItem(FOLD_KEY.l) === '1';
  foldR = localStorage.getItem(FOLD_KEY.r) === '1';
} catch (e) { /* 忽略 */ }

function applyFold() {
  voltShell.classList.toggle('fold-l', foldL);
  voltShell.classList.toggle('fold-r', foldR);
  for (const [btn, folded] of [[foldLBtn, foldL], [unfoldLBtn, foldL], [foldRBtn, foldR], [unfoldRBtn, foldR]]) {
    btn.setAttribute('aria-expanded', String(!folded));
  }
}
function setFocus(on) {
  if (on && focusSaved === null) {
    focusSaved = [foldL, foldR];
    foldL = true; foldR = true;
  } else if (!on && focusSaved !== null) {
    [foldL, foldR] = focusSaved;
    focusSaved = null;
  }
  voltShell.classList.toggle('focus-mode', on);
  focusBtn.textContent = on ? '退出专注' : '专注模式';
  focusBtn.setAttribute('aria-pressed', String(on));
  applyFold();
}
function toggleFold(side) {
  if (focusSaved !== null) setFocus(false);
  if (side === 'l') foldL = !foldL; else foldR = !foldR;
  try { localStorage.setItem(FOLD_KEY[side], (side === 'l' ? foldL : foldR) ? '1' : '0'); } catch (e) { /* 忽略 */ }
  applyFold();
}
foldLBtn.addEventListener('click', () => toggleFold('l'));
unfoldLBtn.addEventListener('click', () => toggleFold('l'));
foldRBtn.addEventListener('click', () => toggleFold('r'));
unfoldRBtn.addEventListener('click', () => toggleFold('r'));
focusBtn.addEventListener('click', () => setFocus(focusSaved === null));
applyFold();

/* ---------------- 右栏三块手风琴（详解 / 控件 / 读数，切章不重置偏好） ---------------- */

const ACC_KEYS = { lesson: 'volt.accLesson', controls: 'volt.accControls', data: 'volt.accData' };
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

/* ---------------- 舞台工具与键盘（,/./R/F/Esc） ---------------- */

const chapPrev = document.getElementById('chapPrev');
const chapNext = document.getElementById('chapNext');
const camResetBtn = document.getElementById('camResetBtn');
const fullBtn = document.getElementById('fullBtn');
chapPrev.addEventListener('click', () => gotoChapter(chapterIdx - 1));
chapNext.addEventListener('click', () => gotoChapter(chapterIdx + 1));
function resetView() {
  const [pos, tgt] = framedCam(SECTIONS[chapterIdx]);
  app.setCamera(pos, tgt);
}
camResetBtn.addEventListener('click', resetView);
fullBtn.addEventListener('click', () => {
  if (document.fullscreenElement) document.exitFullscreen();
  else document.querySelector('.lab-stage3d').requestFullscreen().catch(() => { /* 静默 */ });
});
document.addEventListener('fullscreenchange', () => {
  fullBtn.textContent = document.fullscreenElement ? '⛶ 退出全屏' : '⛶ 全屏';
});
window.addEventListener('keydown', (e) => {
  /* 撤销/重做（Ctrl/Meta+Z / +Y / +Shift+Z）优先放行 */
  if ((e.metaKey || e.ctrlKey) && !e.altKey) {
    const k = e.key.toLowerCase();
    if (k === 'z') { e.preventDefault(); if (e.shiftKey) redoAct(); else undoAct(); return; }
    if (k === 'y') { e.preventDefault(); redoAct(); return; }
    return;
  }
  if (e.altKey) return;
  const t = e.target;
  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
  if (e.key === ' ') {
    e.preventDefault();
    SIM.paused = !SIM.paused;
    const pb = document.getElementById('simPlay');
    if (pb) { pb.textContent = SIM.paused ? '▶' : '⏸'; pb.classList.toggle('on', !SIM.paused); }
    sfx('click');
    return;
  }
  if (e.key === '?' || e.key === 'h' || e.key === 'H') { showHelp(); return; }
  if (e.key === ',') gotoChapter(chapterIdx - 1);
  else if (e.key === '.') gotoChapter(chapterIdx + 1);
  else if (e.key === 'Escape') {
    if (focusSaved !== null) setFocus(false);
  }
  else if (e.key === 'r' || e.key === 'R') resetView();
  else if (e.key === 'f' || e.key === 'F') fullBtn.click();
});

/* ================= 全局仿真工具条（原版工具块 1:1 语义等价落点） =================
 * 单步/重置/时间流速/精度/电流动画/电子流向/电势着色/标签/音效 直接排布；
 * 撤销/重做/修复元件/导出/导入/分享/清空/操作指南 收进「⋯更多」菜单。 */

/* ---- 撤销 / 重做（状态版本栈，控件重放式恢复） ---- */
const HIST = { s: [], i: -1, guard: false, timer: 0 };
function snapState() {
  const ctlVals = [...controlsEl.querySelectorAll('input')].map((inp) => (inp.type === 'checkbox' ? inp.checked : inp.value));
  const isFree = CH && CH.id === 'free';
  return {
    chap: chapterIdx,
    ctl: ctlVals,
    diy: isFree && S22.mode === 'diy' ? diySerialize() : null,
  };
}
function commitChange() {
  if (HIST.guard) return;
  const s = snapState();
  const cur = HIST.s[HIST.i];
  if (cur && JSON.stringify(cur) === JSON.stringify(s)) return;
  HIST.s = HIST.s.slice(0, HIST.i + 1);
  HIST.s.push(s);
  if (HIST.s.length > 60) HIST.s.shift();
  HIST.i = HIST.s.length - 1;
}
function pushUndoNow() { commitChange(); }
function pushUndoSoon() { clearTimeout(HIST.timer); HIST.timer = setTimeout(commitChange, 300); }
function restoreState(s) {
  HIST.guard = true;
  clearTimeout(HIST.timer);
  try {
    if (typeof s.chap === 'number' && s.chap !== chapterIdx) selectChapter(s.chap);
    if (s.diy && S22.mode !== 'diy') { S22.mode = 'diy'; }
    if (s.diy) diyRestore(s.diy);
    [...controlsEl.querySelectorAll('input')].forEach((inp, k) => {
      const v = s.ctl && s.ctl[k];
      if (v === undefined) return;
      if (inp.type === 'checkbox') {
        if (inp.checked !== v) { inp.checked = v; inp.dispatchEvent(new Event('change', { bubbles: true })); }
      } else if (parseFloat(inp.value) !== parseFloat(v)) {
        inp.value = v;
        inp.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    solveNow();
    if (CH && CH.id === 'free' && S22.mode === 'diy') updDiyHud();
  } finally {
    setTimeout(() => { HIST.guard = false; }, 0);
  }
}
function undoAct() {
  if (HIST.i > 0) { HIST.i--; restoreState(HIST.s[HIST.i]); toast('已撤销'); sfx('click'); }
  else toast('没有可撤销的步骤');
}
function redoAct() {
  if (HIST.i < HIST.s.length - 1) { HIST.i++; restoreState(HIST.s[HIST.i]); toast('已重做'); sfx('click'); }
  else toast('没有可重做的操作');
}
controlsEl.addEventListener('input', (e) => { if (e.target && e.target.tagName === 'INPUT') pushUndoSoon(); }, true);
controlsEl.addEventListener('change', (e) => { if (e.target && e.target.tagName === 'INPUT') pushUndoSoon(); }, true);

/* ---- 修复全部故障元件（DIY + 短路章保险丝全覆盖） ---- */
function repairAll() {
  let n = 0;
  CIR.els.forEach((e) => {
    if (e.blown) { e.blown = false; if (e._R0 !== undefined) e.R = e._R0; else if (e.kind === 'fuse' || e.id === 'fu') e.R = 0.05; n++; }
  });
  const recFu = ELVIS.get('fu');
  if (recFu && recFu.parts && recFu.parts.wire) { recFu.parts.wire.visible = true; recFu.parts.wire.scale.x = 1; recFu.parts.wire.material.color.setHex(VP.wireRed); recFu.parts.wire.material.emissive = new THREE.Color(0); recFu.parts.wire.material.emissiveIntensity = 0; }
  if (typeof S15 !== 'undefined') { if (S15.blown) { S15.blown = false; n++; } S15.fuseT = 0; }
  let diyBlown = false;
  DIY.items.forEach((it) => { if (it.blown) { it.blown = false; diyBlown = true; } });
  DIY.fuseT = 0;
  if (S22.mode === 'diy' && CH && CH.id === 'free' && !DIY.items.some((it) => !it.branch)) {
    toast('空链 = 短路：请先添加元件排除短路，再修复保险丝', 'warn');
  }
  if (diyBlown && S22.mode === 'diy' && CH && CH.id === 'free') { diyRebuild(); diyBuildControls(); }
  solveNow();
  if (CH) {
    if (CH.id === 'free') updFree();
    else if (CH.id === 'short' && typeof updShort === 'function') updShort();
  }
  sfx('beep');
  toast(n ? '已修复 ' + n + ' 个损坏元件，电路恢复' : '没有损坏的元件', n ? 'ok' : '');
}

/* ---- 导出 / 导入 / 分享链接 ---- */
function ctlValsNow() {
  return [...controlsEl.querySelectorAll('input')].map((inp) => (inp.type === 'checkbox' ? inp.checked : inp.value));
}
function exportCircuit() {
  const data = {
    app: 'volt', v: 1,
    chap: chapterIdx, chapTitle: CH ? CH.title : '',
    ctl: ctlValsNow(),
    diy: CH && CH.id === 'free' && S22.mode === 'diy' ? diySerialize() : null,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'volt-' + (CH ? CH.id : 'circuit') + '.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 3000);
  toast('电路已导出 JSON', 'ok'); sfx('beep');
}
function importCircuit(file) {
  const rd = new FileReader();
  rd.onload = () => {
    try {
      const data = JSON.parse(rd.result);
      if (!data || data.app !== 'volt') { toast('不是 VoltLab 的电路文件', 'warn'); return; }
      HIST.guard = true;
      if (typeof data.chap === 'number') selectChapter(clamp(data.chap, 0, SECTIONS.length - 1));
      if (data.diy) { S22.mode = 'diy'; diyRestore(data.diy); }
      [...controlsEl.querySelectorAll('input')].forEach((inp, k) => {
        const v = data.ctl && data.ctl[k];
        if (v === undefined) return;
        if (inp.type === 'checkbox') { if (inp.checked !== v) { inp.checked = v; inp.dispatchEvent(new Event('change', { bubbles: true })); } }
        else { inp.value = v; inp.dispatchEvent(new Event('input', { bubbles: true })); }
      });
      HIST.guard = false;
      commitChange();
      toast('电路导入成功：' + (data.chapTitle || ''), 'ok'); sfx('beep');
    } catch (err) { toast('导入失败：' + err.message, 'warn'); }
  };
  rd.readAsText(file);
}
function shareLink() {
  const base = location.origin + location.pathname;
  let url = base + '?c=' + chapterIdx;
  if (CH && CH.id === 'free' && S22.mode === 'diy') {
    try { url += '&d=' + btoa(unescape(encodeURIComponent(JSON.stringify(diySerialize())))); } catch (e) { /* 序列化失败则只分享章 */ }
  }
  const done = () => { toast('分享链接已复制', 'ok'); sfx('beep'); };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(done, () => fallbackCopy(url, done));
  else fallbackCopy(url, done);
}
function fallbackCopy(text, done) {
  const ta = document.createElement('textarea');
  ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
  document.body.appendChild(ta); ta.select();
  try { document.execCommand('copy'); done(); } catch (e) { toast('复制失败，请手动复制链接', 'warn'); }
  ta.remove();
}
function applyShareParams() {
  try {
    const q = new URLSearchParams(location.search);
    const c = q.get('c');
    const d = q.get('d');
    let diyData = null;
    if (d) { try { diyData = JSON.parse(decodeURIComponent(escape(atob(d)))); } catch (e) { /* 忽略坏参数 */ } }
    if (diyData) { S22.mode = 'diy'; DIY_PENDING = diyData; }
    if (c !== null && !isNaN(+c)) selectChapter(clamp(+c, 0, SECTIONS.length - 1));
    if (DIY_PENDING && CH && CH.id === 'free') { diyRestore(DIY_PENDING); DIY_PENDING = null; }
  } catch (e) { /* 参数解析失败静默 */ }
}
let DIY_PENDING = null;

/* ---- 清空实验台（回到自由搭建空态） ---- */
function clearBench() {
  S22.mode = 'diy';
  DIY.items = []; DIY.omega = 0; DIY.fuseT = 0;
  if (chapterIdx === SECTIONS.length - 1) { diyFree(); diyBuildControls(); }
  else gotoChapter(SECTIONS.length - 1);
  commitChange();
  toast('实验台已清空，进入自由搭建');
  sfx('snap');
}

/* ---- 操作指南模态 ---- */
let helpEl = null;
function showHelp() {
  if (!helpEl) {
    helpEl = document.createElement('div');
    helpEl.className = 'volt-help';
    helpEl.innerHTML = `
      <div class="volt-help-card" role="dialog" aria-label="操作指南">
        <div class="volt-help-head"><b>操作指南</b><button class="volt-help-x" type="button" aria-label="关闭">✕</button></div>
        <div class="volt-help-body">
          <h4>快捷键</h4>
          <table>
            <tr><td><kbd>,</kbd> / <kbd>.</kbd></td><td>上一章 / 下一章</td></tr>
            <tr><td><kbd>空格</kbd></td><td>暂停 / 继续仿真</td></tr>
            <tr><td><kbd>R</kbd></td><td>重置相机视角</td></tr>
            <tr><td><kbd>F</kbd></td><td>全屏</td></tr>
            <tr><td><kbd>Esc</kbd></td><td>退出专注模式</td></tr>
            <tr><td><kbd>Ctrl</kbd>+<kbd>Z</kbd> / <kbd>Y</kbd></td><td>撤销 / 重做</td></tr>
          </table>
          <h4>仿真工具条</h4>
          <p><b>⏸/▶</b> 暂停或继续；<b>⏭ 单步</b>暂停状态下推进一小段；<b>⟲ 重置本章</b>复位时间与元件状态（原版同款按钮）。<b>流速</b>调节仿真时间快慢；<b>精度</b>调节每帧计算步数（越高越平滑）。</p>
          <p><b>电流珠</b>开关电流动画；<b>电子流向</b>让小珠按电子方向（与电流相反）流动；<b>电势着色</b>按导线两端电势高低着色（青=低·灰=零·橙红=高）；<b>标签</b>开关 3D 元件标注；<b>音效</b>开关操作与事件提示音。</p>
          <h4>自由搭建（空白实验台 → DIY）</h4>
          <p>元件托盘点选加入主链，自动布线；「串/并」按钮切换与前一串联件的连接关系；滑杆调参数。电流超过元件额定持续 0.6s 会烧毁，保险丝超过额定 1.4 倍立即熔断——修复用「🔧 修复全部故障元件」。</p>
          <h4>电路文件</h4>
          <p>「导出 JSON」保存当前电路（DIY 模式含全部元件与参数）；「导入 JSON」恢复；「复制分享链接」把章节与 DIY 电路编进 URL 发给同学。</p>
        </div>
      </div>`;
    stage.parentElement.appendChild(helpEl);
    helpEl.addEventListener('click', (e) => { if (e.target === helpEl || e.target.classList.contains('volt-help-x')) helpEl.classList.remove('show'); });
  }
  helpEl.classList.add('show');
}

/* ---- 工具条 DOM ---- */
function buildSimBar() {
  const bar = document.createElement('div');
  bar.className = 'volt-simbar';
  bar.innerHTML = `
    <button class="sim-btn" id="simPlay" type="button" title="暂停 / 继续（空格）">⏸</button>
    <button class="sim-btn" id="simStep" type="button" title="单步：暂停状态下推进一小段">⏭</button>
    <button class="sim-btn" id="simReset" type="button" title="重置本章时间与元件状态">⟲</button>
    <span class="sim-sep" aria-hidden="true"></span>
    <label class="sim-slider" title="时间流速：每真实秒推进的仿真时间">流速<input type="range" min="0.1" max="3" step="0.1" value="1" id="simSpeed"><b id="simSpeedV">1.0×</b></label>
    <span class="sim-prec" role="group" aria-label="求解精度：每帧计算步数">
      <i>精度</i>
      <button class="sim-chip on" data-prec="1" type="button">×1</button>
      <button class="sim-chip" data-prec="2" type="button">×2</button>
      <button class="sim-chip" data-prec="4" type="button">×4</button>
    </span>
    <span class="sim-sep" aria-hidden="true"></span>
    <button class="sim-chip on" data-sim="beads" type="button" title="电流动画小珠">电流珠</button>
    <button class="sim-chip" data-sim="electronDir" type="button" title="小珠按电子方向（与电流相反）流动">电子流向</button>
    <button class="sim-chip" data-sim="potColor" type="button" title="按导线两端电势高低着色">电势着色</button>
    <button class="sim-chip on" data-sim="labels" type="button" title="3D 元件标注显隐">标签</button>
    <button class="sim-chip" data-sim="sound" type="button" title="操作与事件提示音">音效</button>
    <span class="sim-sep" aria-hidden="true"></span>
    <button class="sim-btn" id="simMore" type="button" title="更多：撤销 / 重做 / 修复 / 导出 / 导入 / 分享 / 清空 / 指南" aria-haspopup="true" aria-expanded="false">⋯</button>
  `;
  const main = stage.parentElement;
  const foot = main.querySelector('.stage-foot');
  main.insertBefore(bar, foot);

  const q = (id) => bar.querySelector('#' + id);
  const playBtn = q('simPlay');
  const setPlayIcon = () => { playBtn.textContent = SIM.paused ? '▶' : '⏸'; playBtn.classList.toggle('on', !SIM.paused); };
  setPlayIcon();
  playBtn.addEventListener('click', () => { SIM.paused = !SIM.paused; setPlayIcon(); sfx('click'); toast(SIM.paused ? '仿真已暂停（⏭ 可单步推进）' : '仿真继续'); });
  q('simStep').addEventListener('click', () => { if (!SIM.paused) { SIM.paused = true; setPlayIcon(); } SIM.stepReq = true; sfx('click'); });
  q('simReset').addEventListener('click', () => { gotoChapter(chapterIdx); toast('本章已重置（时间与元件状态复位）'); sfx('snap'); });
  const spd = q('simSpeed'), spdV = q('simSpeedV');
  spd.addEventListener('input', () => { SIM.timeScale = parseFloat(spd.value); spdV.textContent = SIM.timeScale.toFixed(1) + '×'; });
  bar.querySelectorAll('[data-prec]').forEach((b) => {
    b.addEventListener('click', () => {
      SIM.prec = +b.dataset.prec;
      bar.querySelectorAll('[data-prec]').forEach((x) => x.classList.toggle('on', x === b));
      sfx('click');
    });
  });
  bar.querySelectorAll('[data-sim]').forEach((b) => {
    b.addEventListener('click', () => {
      const k = b.dataset.sim;
      SIM[k] = !SIM[k];
      b.classList.toggle('on', SIM[k]);
      if (k === 'potColor' && !SIM.potColor) clearPotColors();
      if (k === 'labels') applyLabels();
      sfx('click');
    });
  });
  /* ⋯ 更多菜单 */
  const menu = document.createElement('div');
  menu.className = 'volt-moremenu';
  menu.innerHTML = `
    <button type="button" data-act="undo">↩ 撤销 <kbd>Ctrl+Z</kbd></button>
    <button type="button" data-act="redo">↪ 重做 <kbd>Ctrl+Y</kbd></button>
    <button type="button" data-act="repair">🔧 修复全部故障元件</button>
    <span class="mm-sep"></span>
    <button type="button" data-act="export">⬇ 导出电路 JSON</button>
    <button type="button" data-act="import">⬆ 导入 JSON</button>
    <button type="button" data-act="share">🔗 复制分享链接</button>
    <button type="button" data-act="clear">🧹 清空实验台</button>
    <span class="mm-sep"></span>
    <button type="button" data-act="help">❓ 操作指南</button>
  `;
  main.appendChild(menu);
  const moreBtn = q('simMore');
  const closeMenu = () => { menu.classList.remove('show'); moreBtn.setAttribute('aria-expanded', 'false'); };
  moreBtn.addEventListener('click', () => {
    const on = !menu.classList.contains('show');
    menu.classList.toggle('show', on);
    moreBtn.setAttribute('aria-expanded', String(on));
    if (on) sfx('click');
  });
  document.addEventListener('pointerdown', (e) => { if (!menu.contains(e.target) && e.target !== moreBtn) closeMenu(); });
  menu.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    closeMenu();
    const act = b.dataset.act;
    if (act === 'undo') undoAct();
    else if (act === 'redo') redoAct();
    else if (act === 'repair') repairAll();
    else if (act === 'export') exportCircuit();
    else if (act === 'import') {
      const inp = document.createElement('input');
      inp.type = 'file'; inp.accept = '.json,application/json';
      inp.addEventListener('change', () => { if (inp.files && inp.files[0]) importCircuit(inp.files[0]); });
      inp.click();
    }
    else if (act === 'share') shareLink();
    else if (act === 'clear') clearBench();
    else if (act === 'help') showHelp();
  });
}

/* 拖动画面 → 任务命中 */
app.renderer.domElement.addEventListener('pointerdown', () => taskHit('drag'), { once: false });

/* ================= 启动 ================= */

loader.setText('正在铺设电学实验台…');
buildUIStart();

function buildUIStart() {
  window.__eduSections = { select: selectChapter };
  window.__voltStats = () => vfx.stats();
  window.__voltState = { SECTIONS, selectChapter };
  window.__voltSim = SIM;
  window.__voltDiy = { DIY, diyAdd, diyRemove, repairAll, diySerialize, diyRestore };
  buildSimBar();
  selectChapter(0);
  applyShareParams();
  loader.hide();
}
