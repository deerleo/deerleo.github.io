/* EduLab · 勾股定理实验室（pythagoras）— Micro 级 3D 深改
 * 章节：拼图挑战(Perigal 割补) / 出入相补(刘徽·赵爽) / 欧几里得的证明 / 更多证法(毕达哥拉斯重排·加菲尔德梯形)
 *      / 倒水实验 / 勾股数 / 随堂检测
 * 实现：three.js 3D 几何工作台（木质台面 + 带厚度烤漆/木纹拼板 + 圆角描边管 + 精灵标注 + 接触阴影）。
 *      Perigal 拼图 = b² 过中心两条垂直线切 4 块 + a²，拖拽/单击旋转 90°/位置方向双判定吸附；
 *      出入相补 = L 形拼板挖两三角槽、板块绕枢轴 ±90° 旋转补形；欧几里得 = 剪切→旋转→剪切三段面积守恒变换；
 *      倒水 = 整板绕中心竖轴旋转、逐槽水位裁剪（面积守恒读数）；勾股数 = 散点墙 InstancedMesh + 点选直角三角形。
 * 原版功能块 1:1：6 个教学块 + 图上标注 + 上一节(←)/下一节(→)/纸面·Studio 风格(T)/重置视角(R)/全屏(F)。
 */
import {
  THREE, clamp, createApp, createControlsPanel, makeHUD, makeLoader,
  makeTextSprite, setSpriteText,
} from './edu-core.js';
import {
  attachVFX, makeStudioEnvironment, makeBackdropTexture, PAL,
  matGlow, matStd, matCoat, makeWoodTexture,
} from './edu-vfx.js';

/* ---------------- 舞台与工艺接入 ---------------- */

const stage = document.getElementById('stage');
const loader = makeLoader(stage, '正在铺设几何工作台…');
const app = createApp({
  container: stage,
  fov: 42, near: 0.1, far: 400,
  cameraPos: [0, 10.5, 12.5], target: [1.2, 0, -0.6],
  minDistance: 2.5, maxDistance: 80,
  keepBackground: true,
});
const { scene, camera, controls } = app;
const vfx = attachVFX(app, 'illus', { bg: 'studio-warm' });
scene.environment = makeStudioEnvironment(app.renderer);

scene.add(new THREE.HemisphereLight(0xe8dcc8, 0x2c241a, 0.72));
const keyLight = new THREE.DirectionalLight(0xfff0d8, 1.2);
keyLight.position.set(-8, 15, 9);
scene.add(keyLight);
const fillLight = new THREE.DirectionalLight(0xcfe0f2, 0.42);
fillLight.position.set(10, 6, -9);
scene.add(fillLight);

const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

/* ================= 纸面 / Studio 双风格（原版 T 键 1:1） ================= */

const STYLES = {
  studio: {
    label: 'Studio 风格',
    bg: () => makeBackdropTexture({ inner: '#33454e', outer: '#101a1e', glow: '#5a7478', glowStrength: 0.42 }),
    edge: 0xe8e2d2, edgeEmissive: 0.34,          // 拼板描边管（暖白亮线）
    dashed: 0xb8c4c8,                             // 虚线辅助线
    hintFill: 0xe8a13f,                           // 提示槽位填充
    water: 0x55a7f2,                              // 倒水水面
    axis: 0x9fb8c0, point: 0xf2a055,
  },
  paper: {
    label: '纸面风格',
    bg: () => makeBackdropTexture({ inner: '#f2eee0', outer: '#b5ad98', glow: '#fffdf4', glowStrength: 0.5 }),
    edge: 0x4a3f30, edgeEmissive: 0.06,           // 纸面档：墨线描边
    dashed: 0x6a5f4c,
    hintFill: 0xbd7d1e,
    water: 0x3d7fce,
    axis: 0x6a6458, point: 0xc25a28,
  },
};
let styleName = 'studio';
try { if (localStorage.getItem('pythagoras.style') === 'paper') styleName = 'paper'; } catch (e) { /* 忽略 */ }
const styleRefs = { edgeMats: [], dashedMats: [], hintMats: [], waterMats: [], axisMats: [], pointMats: [], slabSideMats: [] };
let bgTex = null;

/** 深改重建路径专用：dispose 材质并同步从 styleRefs 登记表摘除（防换肤循环遍历到已释放材质 + 无界增长） */
function disposeMat(m) {
  if (!m) return;
  for (const arr of Object.values(styleRefs)) {
    const i = arr.indexOf(m);
    if (i >= 0) arr.splice(i, 1);
  }
  m.dispose();
}

function applyStyle(name) {
  styleName = name;
  const st = STYLES[name];
  if (bgTex) bgTex.dispose();
  bgTex = st.bg();
  bgTex.mapping = THREE.EquirectangularReflectionMapping;
  scene.background = bgTex;
  for (const m of styleRefs.edgeMats) { m.color.set(st.edge); m.emissive.set(st.edge); m.emissiveIntensity = st.edgeEmissive; }
  for (const m of styleRefs.dashedMats) m.color.set(st.dashed);
  for (const m of styleRefs.hintMats) m.color.set(st.hintFill);
  for (const m of styleRefs.waterMats) { m.color.set(st.water); m.emissive.set(st.water); }
  for (const m of styleRefs.axisMats) m.color.set(st.axis);
  for (const m of styleRefs.pointMats) m.color.set(st.point);
  try { localStorage.setItem('pythagoras.style', name); } catch (e) { /* 忽略 */ }
}

/* 图上标注开关（原版 toggles:["labels"] 1:1） */
let labelsOn = true;
try { labelsOn = localStorage.getItem('pythagoras.labels') !== '0'; } catch (e) { /* 忽略 */ }
function applyLabels() {
  for (const g of Object.values(scenes)) {
    for (const s of g.userData.labelSprites || []) s.visible = labelsOn && s.userData.labelBase;
  }
  try { localStorage.setItem('pythagoras.labels', labelsOn ? '1' : '0'); } catch (e) { /* 忽略 */ }
}

/* ================= 2D 多边形数学库（世界坐标板：数学 x 右 / y 上，渲染映射 z = −y） ================= */

const P2C = (pt) => V3(pt[0], 0, -pt[1]);                    // 2D 数学点 → 3D 平面点（y 高度后补）
const polyCentroid = (pts) => {
  let at = 0, cx = 0, cy = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length];
    const cr = x1 * y2 - x2 * y1;
    at += cr; cx += (x1 + x2) * cr; cy += (y1 + y2) * cr;
  }
  if (Math.abs(at) < 1e-12) {
    let sx = 0, sy = 0; pts.forEach(([x, y]) => { sx += x; sy += y; });
    return [sx / pts.length, sy / pts.length];
  }
  return [cx / (3 * at), cy / (3 * at)];
};
const polyArea = (pts) => {
  let s = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length];
    s += x1 * y2 - x2 * y1;
  }
  return Math.abs(s) / 2;
};
const polyShift = (pts, d) => pts.map(([x, y]) => [x + d[0], y + d[1]]);
const polyRotAbout = (pts, piv, ang) => pts.map(([x, y]) => {
  const dx = x - piv[0], dy = y - piv[1], c = Math.cos(ang), s = Math.sin(ang);
  return [piv[0] + dx * c - dy * s, piv[1] + dx * s + dy * c];
});
/** 半平面裁剪：保留 { p : (p−base)·dir ≥ 0 } 侧（Sutherland–Hodgman） */
function polyClipHalf(pts, base, dir) {
  const side = (p) => (p[0] - base[0]) * dir[0] + (p[1] - base[1]) * dir[1];
  const out = [];
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i], q = pts[(i + 1) % pts.length];
    const sp = side(p), sq = side(q);
    if (sp >= -1e-12) out.push(p);
    if ((sp > 1e-12 && sq < -1e-12) || (sp < -1e-12 && sq > 1e-12)) {
      const k = sp / (sp - sq);
      out.push([p[0] + (q[0] - p[0]) * k, p[1] + (q[1] - p[1]) * k]);
    }
  }
  return out;
}
/** 水位裁剪：保留 y ≤ level 的部分 */
const polyClipBelow = (pts, lv) => polyClipHalf(pts, [0, lv], [0, -1]);
const pointInPoly = (x, y, pts) => {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};
/** 多边形近似相等：顶点数一致且可一一配对（容差 tol） */
function polyMatch(a, b, tol = 1e-4) {
  if (a.length !== b.length) return false;
  const used = new Set();
  for (const p of a) {
    let hit = -1;
    for (let i = 0; i < b.length; i++) {
      if (used.has(i)) continue;
      if (Math.hypot(p[0] - b[i][0], p[1] - b[i][1]) < tol) { hit = i; break; }
    }
    if (hit < 0) return false;
    used.add(hit);
  }
  return true;
}
/** 水位二分求解：在 poly 内找水平线，使线下面积 = target（返回 {level, poly}） */
function solveWaterLevel(pts, target) {
  const total = polyArea(pts);
  if (target <= 1e-9) return { level: Infinity, poly: [] };
  if (target >= total - 1e-9) return { level: -Infinity, poly: pts };
  const ys = pts.map((p) => p[1]);
  let lo = Math.min(...ys), hi = Math.max(...ys);
  for (let i = 0; i < 46; i++) {
    const mid = (lo + hi) / 2;
    if (polyArea(polyClipBelow(pts, mid)) < target) lo = mid; else hi = mid;
  }
  const level = (lo + hi) / 2;
  return { level, poly: polyClipBelow(pts, level) };
}
const smoothV = (t) => { const k = clamp(t, 0, 1); return k * k * (3 - 2 * k); };
/** 多边形形态插值（原版 jt 语义：旋转 + 平移联合插值，形态过渡自然） */
function polyMorph(a, b, k) {
  const ca = polyCentroid(a), cb = polyCentroid(b);
  const angA = Math.atan2(a[1][1] - a[0][1], a[1][0] - a[0][0]);
  const angB = Math.atan2(b[1][1] - b[0][1], b[1][0] - b[0][0]);
  let dAng = angB - angA;
  for (; dAng > Math.PI; dAng -= 2 * Math.PI);
  for (; dAng < -Math.PI; dAng += 2 * Math.PI);
  const mid = [ca[0] + (cb[0] - ca[0]) * k, ca[1] + (cb[1] - ca[1]) * k];
  return polyShift(polyRotAbout(a, ca, dAng * k), [mid[0] - ca[0], mid[1] - ca[1]]);
}

/* ================= 工艺基建（板件 / 描边管 / 标注 / 阴影） ================= */

const THK = 0.17;            // 拼板统一厚度
const LIFT = 0.1;            // 作业垫板顶面高度（所有拼板的落面基准）
const canvasTex = (w, h, draw) => {
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  draw(cv.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
};

/* 场景色板（PAL 取族的延展：几何实验用暖木/烤漆族） */
const C = {
  lacquerA: 0xc96a48,   // 烤漆·赤陶（三角形/朱实）
  lacquerB: 0x4a7fa8,   // 烤漆·青蓝
  lacquerC: 0x58a06c,   // 烤漆·苔绿
  lacquerD: 0x9a72c8,   // 烤漆·藤紫
  lacquerE: 0xd9a13f,   // 烤漆·琥珀（黄实/提示）
  board: 0xdac9a8,      // 拼板底台（枫木浅）
  boardDeep: 0x8a6a44,  // 台缘深木
  table: 0x6e4f30,      // 工作台面（胡桃）
  tri: 0xe8674a,        // 主三角形描边填充（站点 accent）
  ghost: 0x8fa3ad,
};

/* 木质材质（桌面 / 拼板底台：程序化木纹，双变体 seed） */
const woodTexTable = makeWoodTexture({ base: '#6e4f30', dark: '#4a3018', light: '#8f6c42', streaks: 110, bands: 8, seed: 41 });
woodTexTable.repeat.set(2.6, 1.7);
const woodTexDeck = makeWoodTexture({ base: '#b99a6d', dark: '#8f704a', light: '#d4b990', streaks: 70, bands: 5, seed: 87 });
woodTexDeck.repeat.set(1.6, 1.2);
function tableMat() {
  const m = new THREE.MeshStandardMaterial({ roughness: 0.58, metalness: 0.05 });
  m.map = woodTexTable;
  return m;
}
function deckMat() {
  const m = new THREE.MeshStandardMaterial({ roughness: 0.66, metalness: 0.03 });
  m.map = woodTexDeck;
  return m;
}

/* 烤漆拼板材质（clearcoat 漆面 + 淡 emissive 提亮，风格换肤不动色相） */
function lacMat(color, o = {}) {
  return matCoat(color, { clearcoat: 0.9, clearcoatRoughness: 0.24, roughness: o.rough ?? 0.4, metalness: 0.06, emissive: color, emissiveIntensity: o.glow ?? 0.1 });
}

/* 2D 多边形 → 带厚度倒角板件几何（Shape 沿数学坐标建，rotateX(-π/2) 平放：z = −y 自动成立） */
function slabGeometry(pts, thick = THK) {
  const shape = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: thick, bevelEnabled: true, bevelThickness: 0.022, bevelSize: 0.022, bevelSegments: 2,
  });
  geo.rotateX(-Math.PI / 2);
  return geo;
}
function slab(pts, o = {}) {
  const mesh = new THREE.Mesh(slabGeometry(pts, o.thick), o.mat || deckMat());
  return mesh;
}

/* 圆角描边管：多边形顶点圆角化后 CatmullRomCurve3 放样（拼板轮廓的工艺描边） */
function tubeBorder(pts, o = {}) {
  const y = o.y ?? THK + 0.012;
  const r = o.r ?? 0.028;
  const rr = Math.min(0.14, o.round ?? 0.1);
  const flat = [];
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i + n - 1) % n], p1 = pts[i], p2 = pts[(i + 1) % n];
    const v0 = [p0[0] - p1[0], p0[1] - p1[1]], v2 = [p2[0] - p1[0], p2[1] - p1[1]];
    const l0 = Math.hypot(...v0) || 1, l2 = Math.hypot(...v2) || 1;
    const t0 = [v0[0] / l0, v0[1] / l0], t2 = [v2[0] / l2, v2[1] / l2];
    const cut0 = [p1[0] - t0[0] * rr, p1[1] - t0[1] * rr];
    const cut2 = [p1[0] + t2[0] * rr, p1[1] + t2[1] * rr];
    const steps = 5;
    for (let k = 0; k <= steps; k++) {
      const s = k / steps;
      const ax = cut0[0] + (p1[0] - cut0[0]) * s, ay = cut0[1] + (p1[1] - cut0[1]) * s;
      const bx = p1[0] + (cut2[0] - p1[0]) * s, by = p1[1] + (cut2[1] - p1[1]) * s;
      flat.push([ax + (bx - ax) * s, ay + (by - ay) * s]);
    }
  }
  const curve = new THREE.CatmullRomCurve3(flat.map(([x, yy]) => V3(x, y, -yy)), true, 'catmullrom', 0.32);
  const mat = o.mat || edgeMat();
  return new THREE.Mesh(new THREE.TubeGeometry(curve, Math.min(flat.length * 2, 240), r, 8, true), mat);
}

function edgeMat() {
  const m = matGlow(STYLES[styleName].edge, STYLES[styleName].edgeEmissive, { roughness: 0.5 });
  styleRefs.edgeMats.push(m);
  return m;
}
function dashedMat(opacity = 0.85) {
  const m = new THREE.LineDashedMaterial({ color: STYLES[styleName].dashed, dashSize: 0.26, gapSize: 0.18, transparent: true, opacity });
  styleRefs.dashedMats.push(m);
  return m;
}
function flatLineMat(opacity = 0.9) {
  const m = new THREE.LineBasicMaterial({ color: STYLES[styleName].dashed, transparent: opacity < 1, opacity });
  styleRefs.dashedMats.push(m);
  return m;
}
/* 虚线多边形轮廓（平面 y 处 LineLoop） */
function dashLoop(pts, o = {}) {
  const y = o.y ?? 0.03;
  const geo = new THREE.BufferGeometry().setFromPoints(pts.map(([x, yy]) => V3(x, y, -yy)));
  const loop = new THREE.LineLoop(geo, o.mat || dashedMat(o.opacity));
  loop.computeLineDistances();
  return loop;
}
/* 实线折线（开折线） */
function flatPolyline(pts, o = {}) {
  const y = o.y ?? 0.03;
  const geo = new THREE.BufferGeometry().setFromPoints(pts.map(([x, yy]) => V3(x, y, -yy)));
  const ln = new THREE.Line(geo, o.mat || flatLineMat(o.opacity));
  if (o.dashed) ln.computeLineDistances();
  return ln;
}

/* 精灵标注（深色芯片底，纸面/Studio 双风格可读） */
function lbl(text, color = '#ffffff', scale = 0.0075) {
  const s = makeTextSprite(text, { fontSize: 30, color, scale, bg: 'rgba(14,17,22,0.66)' });
  s.userData.text = text;
  return s;
}
function setLbl(sprite, text, color = '#ffffff', scale) {
  setSpriteText(sprite, text, { fontSize: 30, color, scale: scale ?? sprite.userData.__scale ?? 0.0075, bg: 'rgba(14,17,22,0.66)' });
  sprite.userData.text = text;
}
function regLabel(g, sprite, opts = {}) {
  sprite.userData.labelBase = opts.base ?? true;
  (opts.parent || g).add(sprite);
  if (!g.userData.labelSprites) g.userData.labelSprites = [];
  if (!g.userData.labelSprites.includes(sprite)) g.userData.labelSprites.push(sprite);
  sprite.visible = labelsOn && sprite.userData.labelBase;
  return sprite;
}
/** 清理归属某子组的标注（子组重建时调用，防精灵泄漏） */
function pruneLabels(g, ownerGroup) {
  if (!g.userData.labelSprites) return;
  const dead = g.userData.labelSprites.filter((s) => s.userData.owning === ownerGroup);
  g.userData.labelSprites = g.userData.labelSprites.filter((s) => s.userData.owning !== ownerGroup);
  for (const s of dead) {
    (s.parent || g).remove(s);
    s.material.map?.dispose();
    s.material.dispose();
  }
}

/* 接触阴影贴片（主体/道具落桌的"重量感"来源） */
function shadowPatch(w, d, opacity = 0.4) {
  const tex = canvasTex(256, 256, (ctx) => {
    const g = ctx.createRadialGradient(128, 128, 10, 128, 128, 126);
    g.addColorStop(0, `rgba(8,6,4,${opacity})`);
    g.addColorStop(0.62, `rgba(8,6,4,${opacity * 0.55})`);
    g.addColorStop(1, 'rgba(8,6,4,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
  });
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(w, d),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }),
  );
  m.rotation.x = -Math.PI / 2;
  m.renderOrder = 1;
  return m;
}

/* ================= 共享台面（工作台叙事层：全程可见） ================= */

function buildBench() {
  const g = new THREE.Group();
  /* 桌面大板 */
  const top = new THREE.Mesh(new THREE.BoxGeometry(30, 0.5, 20), tableMat());
  top.position.y = -0.25;
  g.add(top);
  /* 台缘（深木包边，前缘倒圆） */
  const rim = new THREE.Mesh(new THREE.BoxGeometry(30.6, 0.24, 20.6), matStd(C.boardDeep, { roughness: 0.55 }));
  rim.position.y = -0.62;
  g.add(rim);
  /* 拼板作业区：浅枫木垫板（每章拼板都落在这块区域内） */
  const deck = new THREE.Mesh(new THREE.BoxGeometry(19, 0.1, 13.4), deckMat());
  deck.position.set(1.4, 0.05, -0.4);
  g.add(deck);
  const deckEdge = tubeBorderRect(19, 13.4, 1.4, -0.4);
  g.add(deckEdge);
  /* 台面接触阴影 */
  const sh = shadowPatch(24, 17, 0.34);
  sh.position.set(1.4, 0.115, -0.4);
  g.add(sh);
  /* 场景叙事道具：木直尺 + 三角板 + 铅笔（桌面右上角，不抢戏） */
  g.add(makeRuler());
  g.add(makeSetSquare());
  g.add(makePencil());
  return g;
}
/* 垫板矩形描边（圆角管） */
function tubeBorderRect(w, d, cx, cz) {
  const y = 0.16, r = 0.03;
  const x0 = cx - w / 2, x1 = cx + w / 2, z0 = cz - d / 2, z1 = cz + d / 2;
  const corners = [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
  const flat = [];
  /* 圆角矩形周界采样（角部用二次贝塞尔近似） */
  corners.forEach(([x, z], i) => {
    const px = corners[(i + 3) % 4], nx = corners[(i + 1) % 4];
    const din = [Math.sign(x - px[0]) || 0, Math.sign(z - px[1]) || 0];
    const dout = [Math.sign(nx[0] - x) || 0, Math.sign(nx[1] - z) || 0];
    const rr = 0.34;
    const a = [x - din[0] * rr, z - din[1] * rr];
    const b = [x + dout[0] * rr, z + dout[1] * rr];
    for (let k = 0; k <= 5; k++) {
      const s = k / 5;
      const mx = a[0] + (x - a[0]) * s, mz = a[1] + (z - a[1]) * s;
      const ex = x + (b[0] - x) * s, ez = z + (b[1] - z) * s;
      flat.push(V3(mx + (ex - mx) * s, y, mz + (ez - mz) * s));
    }
  });
  const curve = new THREE.CatmullRomCurve3(flat, true, 'catmullrom', 0.3);
  return new THREE.Mesh(new THREE.TubeGeometry(curve, 160, r, 8, true), matStd(C.boardDeep, { roughness: 0.5, metalness: 0.1 }));
}
/* 道具：木质直尺（带刻度 CanvasTexture） */
function makeRuler() {
  const g = new THREE.Group();
  const tex = canvasTex(512, 64, (ctx, w, h) => {
    ctx.fillStyle = '#c8a56a';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 300; i++) {
      ctx.fillStyle = `rgba(90,60,30,${0.03 + Math.random() * 0.05})`;
      ctx.fillRect(Math.random() * w, Math.random() * h, 3, 2);
    }
    ctx.strokeStyle = '#5a3a18';
    ctx.lineWidth = 3;
    for (let i = 1; i <= 20; i++) {
      const x = (i / 21) * w;
      const long = i % 5 === 0;
      ctx.beginPath();
      ctx.moveTo(x, h * 0.16);
      ctx.lineTo(x, long ? h * 0.62 : h * 0.4);
      ctx.stroke();
      if (long) {
        ctx.fillStyle = '#5a3a18';
        ctx.font = '600 16px sans-serif';
        ctx.fillText(String(i / 5), x + 3, h * 0.9);
      }
    }
    ctx.strokeStyle = '#7a5222';
    ctx.lineWidth = 5;
    ctx.strokeRect(2, 2, w - 4, h - 4);
  });
  const body = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.09, 0.62), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 }));
  body.position.set(10.2, 0.15, 4.9);
  body.rotation.y = -0.22;
  g.add(body);
  const sh = shadowPatch(4.6, 1.1, 0.32);
  sh.position.set(10.2, 0.115, 4.95);
  sh.rotation.z = 0.22;
  g.add(sh);
  return g;
}
/* 道具：45° 三角板（烤漆测绘仪风格） */
function makeSetSquare() {
  const g = new THREE.Group();
  const pts2d = [[0, 0], [2.1, 0], [0, 2.1]];
  const shape = new THREE.Shape(pts2d.map(([x, y]) => new THREE.Vector2(x, y)));
  const hole = new THREE.Path();
  const i0 = 0.52, i1 = 1.34;
  hole.moveTo(i0, i0 * 0.28);
  hole.lineTo(i1, i0 * 0.28);
  hole.lineTo(i0, i1);
  hole.closePath();
  shape.holes.push(hole);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.09, bevelEnabled: true, bevelThickness: 0.014, bevelSize: 0.014, bevelSegments: 1 });
  geo.rotateX(-Math.PI / 2);
  const mesh = new THREE.Mesh(geo, lacMat(0xd9a13f, { glow: 0.07 }));
  mesh.position.set(11.9, 0.12, 4.2);
  mesh.rotation.y = 0.5;
  g.add(mesh);
  const sh = shadowPatch(2.6, 2.6, 0.3);
  sh.position.set(11.9, 0.115, 4.2);
  g.add(sh);
  return g;
}
/* 道具：铅笔（六棱柱 + 笔尖锥 + 笔芯 + 金属箍 + 橡皮头） */
function makePencil() {
  const g = new THREE.Group();
  const hex = new THREE.CylinderGeometry(0.075, 0.075, 2.6, 6);
  const body = new THREE.Mesh(hex, lacMat(0xc96a48, { glow: 0.06, rough: 0.5 }));
  body.rotation.z = Math.PI / 2;
  body.rotation.y = -0.4;
  const grp = new THREE.Group();
  grp.add(body);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.3, 10), matStd(0xd9c9a8, { roughness: 0.8 }));
  tip.rotation.z = -Math.PI / 2;
  tip.position.x = -1.45;
  grp.add(tip);
  const lead = new THREE.Mesh(new THREE.ConeGeometry(0.024, 0.1, 8), matStd(0x22201c, { roughness: 0.4 }));
  lead.rotation.z = -Math.PI / 2;
  lead.position.x = -1.62;
  grp.add(lead);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.078, 0.078, 0.14, 12), matStd(PAL.brass, { roughness: 0.3, metalness: 0.85 }));
  band.rotation.z = Math.PI / 2;
  band.position.x = 1.32;
  grp.add(band);
  const eraser = new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.072, 0.16, 10), matStd(0xd88a8a, { roughness: 0.9 }));
  eraser.rotation.z = Math.PI / 2;
  eraser.position.x = 1.47;
  grp.add(eraser);
  grp.position.set(8.6, 0.18, 5.4);
  grp.rotation.y = 0.16;
  g.add(grp);
  const sh = shadowPatch(3.0, 0.7, 0.28);
  sh.position.set(8.6, 0.115, 5.45);
  g.add(sh);
  return g;
}

/* ---------------- 右栏读数 HUD / 控件 / 章节框架 ---------------- */

const hudWrap = document.getElementById('lcData');
let hud = null;
function setHUD(rows) {
  if (hud) hud.el.remove();
  hud = makeHUD(hudWrap, rows);
  rows.forEach(([k]) => hud.set(k, '–'));
}
function hset(key, text) { if (hud) hud.set(key, text); }

const ctl = createControlsPanel(document.getElementById('controls'));
let activeSectionCleanup = null;
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

/* 播放状态机（演示/暂停 · 到末尾再按反向回放 → 还原/转回去，原版同语义） */
function playState(top, speed) {
  return {
    t: 0, dir: 0, top,
    toggle() { this.dir = this.dir ? 0 : (this.t >= top - 1e-9 ? -1 : 1); },
    step(dt) {
      if (!this.dir) return false;
      this.t = clamp(this.t + this.dir * dt * speed, 0, top);
      if (this.t === 0 || this.t >= top - 1e-9) this.dir = 0;
      return true;
    },
  };
}
/* 播放按钮文案：dir?暂停 : (到头?回退标签:前进标签) */
function playBtnLabel(btn, ps, fwd, back) {
  btn.textContent = ps.dir ? '⏸ 暂停' : (ps.t >= ps.top - 1e-9 ? back : fwd);
}
const fmt1 = (v) => v.toFixed(2);

/* ================= 几何核心：三角形 + 三侧正方形布局（全章共用） ================= */

/** 直角三角形：直角顶点 (0,0)，长腿 b 沿 +x，短腿 a 沿 +y；三侧外接正方形 */
function triBoard(a, b) {
  const c = Math.hypot(a, b);
  const tri = [[0, 0], [b, 0], [0, a]];
  const aSq = [[0, 0], [0, a], [-a, a], [-a, 0]];                       // 短腿左侧
  const bSq = [[0, 0], [0, -b], [b, -b], [b, 0]];                       // 长腿下侧
  const u = [b, 0], w = [0, a];
  const nrm = [a / c, b / c];                                           // 斜边外法线
  const cSq = [u, [u[0] + nrm[0] * c, u[1] + nrm[1] * c], [w[0] + nrm[0] * c, w[1] + nrm[1] * c], w];
  return { a, b, c, tri, aSq, bSq, cSq, nrm };
}

/* ================= 章节 1：拼图挑战（Perigal 割补，1873） =================
 * b² 过中心两条互相垂直的线（方向 = 斜边方向 / 法线方向）切成 4 块，与 a² 共 5 块
 * 拼进斜边正方形 c²（a² 居中、4 块据角）。交互：拖拽 / 单击旋转 90° / 双判定吸附 / 自动演示。 */

const pz = {
  shape: '3:4', hint: false, demo: null, done: false,
  pieces: [], geo: null, drag: null, hoverIdx: -1,
};
const PZ_SHAPES = [['3:4', '3 : 4'], ['2:3', '2 : 3'], ['1:2', '1 : 2'], ['5:12', '5 : 12']];
const PZ_COLORS = [C.lacquerB, C.lacquerC, C.lacquerD, C.lacquerA, C.lacquerE];

/** Perigal 割补几何：pieces(5) + slots(5)（slot = c² 内目标位） */
function perigalLayout(a, b) {
  const base = triBoard(a, b);
  const { c } = base;
  const cen = [b / 2, -b / 2];                       // b² 中心
  const nH = [-b / c, a / c];                        // 斜边方向单位向量
  const nN = [a / c, b / c];                         // 斜边法线单位向量
  const corners = {
    '+h+n': base.bSq ? [b, 0] : null,               // c² 四角（键名按原版方位语义）
  };
  const P = [b, 0], Q = [0, a];
  const cornerMap = {
    '1,1': P, '-1,1': Q,
    '1,-1': [P[0] + nN[0] * c, P[1] + nN[1] * c],
    '-1,-1': [Q[0] + nN[0] * c, Q[1] + nN[1] * c],
  };
  const items = [];
  for (const su of [1, -1]) {
    for (const sq of [1, -1]) {
      const cut = polyClipHalf(polyClipHalf(base.bSq, cen, [su * nH[0], su * nH[1]]), cen, [sq * nN[0], sq * nN[1]]);
      const anchor = cornerMap[`${su},${sq}`];
      items.push({
        poly: cut,
        home: polyCentroid(cut),
        slot: polyShift(cut, [anchor[0] - cen[0], anchor[1] - cen[1]]),
      });
    }
  }
  const cSqCen = polyCentroid(base.cSq);
  const aCen = polyCentroid(base.aSq);
  items.push({
    poly: base.aSq,
    home: aCen,
    slot: polyShift(base.aSq, [cSqCen[0] - aCen[0], cSqCen[1] - aCen[1]]),
  });
  return { ...base, cen, items };
}

function pzReset() {
  const [ha, hb] = pz.shape.split(':').map(Number);
  const k = 4 / Math.hypot(ha, hb);                  // 斜边恒 4（原版归一化口径）
  pz.geo = perigalLayout(ha * k, hb * k);
  pz.pieces = pz.geo.items.map((it, i) => ({
    local: polyShift(it.poly, [-it.home[0], -it.home[1]]),
    pos: [...it.home],
    rot: 0, shown: 0,
    slot: -1, home: -1,
    color: PZ_COLORS[i],
  }));
  pz.done = false;
  pz.demo = null;
  if (scenes.puzzle && scenes.puzzle.userData.built) pzRebuildMeshes();
}

/* 形状切换后重建拼图板件网格（场景缓存复用，旧几何 dispose） */
function pzRebuildMeshes() {
  const g = scenes.puzzle;
  for (const m of PZ.pieceMeshes) {
    if (m.userData.shadow) { g.remove(m.userData.shadow); m.userData.shadow.material.map.dispose(); m.userData.shadow.material.dispose(); }
    m.userData.rim?.geometry.dispose();
    disposeMat(m.material);
    m.geometry.dispose();
    g.remove(m);
  }
  PZ.pieceMeshes.length = 0;
  for (const obj of [PZ.cOutline, PZ.cSqEdge]) {
    obj.geometry.dispose();
    disposeMat(obj.material);
    g.remove(obj);
  }
  PZ.cOutline = dashLoop(pz.geo.cSq, { y: LIFT + 0.04, opacity: 0.9 });
  PZ.cSqEdge = tubeBorder(pz.geo.cSq, { y: LIFT + 0.02, r: 0.026, mat: matStd(C.boardDeep, { roughness: 0.5 }) });
  PZ.cSqEdge.visible = false;
  g.add(PZ.cOutline, PZ.cSqEdge);
  PZ.triMesh.geometry.dispose();
  PZ.triMesh.geometry = slabGeometry(pz.geo.tri);
  if (PZ.triRim) { PZ.triRim.geometry.dispose(); disposeMat(PZ.triRim.material); g.remove(PZ.triRim); }
  PZ.triRim = tubeBorder(pz.geo.tri, { y: LIFT + THK + 0.01, r: 0.03, mat: edgeMat() });
  g.add(PZ.triRim);
  pz.pieces.forEach((pc, i) => pzAddPieceMesh(pc, i, g));
  pzSync();
}

function pzPolyAt(pc, rot = pc.shown) {
  return polyShift(polyRotAbout(pc.local, [0, 0], (rot * Math.PI) / 2), pc.pos);
}

/* ---- 3D 呈现 ---- */

const PZ = {};

function buildPuzzle(g) {
  /* 目标槽位：c² 凹槽轮廓（虚线）+ 完成描边 + 提示填充组 */
  PZ.cOutline = dashLoop(pz.geo.cSq, { y: LIFT + 0.04, opacity: 0.9 });
  g.add(PZ.cOutline);
  PZ.cSqEdge = tubeBorder(pz.geo.cSq, { y: LIFT + 0.02, r: 0.026, mat: matStd(C.boardDeep, { roughness: 0.5 }) });
  PZ.cSqEdge.visible = false;
  g.add(PZ.cSqEdge);
  PZ.hintGroup = new THREE.Group();
  g.add(PZ.hintGroup);

  /* 三角形主体板（board 底色 + 亮线描边 + 直角标记） */
  PZ.triMesh = slab(pz.geo.tri, { mat: matStd(C.board, { roughness: 0.7 }) });
  PZ.triMesh.position.y = LIFT;
  g.add(PZ.triMesh);
  PZ.triRim = tubeBorder(pz.geo.tri, { y: LIFT + THK + 0.01, r: 0.03, mat: edgeMat() });
  g.add(PZ.triRim);
  PZ.rightMark = flatPolyline([[0.42, 0], [0.42, 0.42], [0, 0.42]], { y: LIFT + THK + 0.02, mat: flatLineMat(0.75) });
  g.add(PZ.rightMark);

  /* 碎片：5 块烤漆板 */
  PZ.pieceMeshes = [];
  pz.pieces.forEach((pc, i) => pzAddPieceMesh(pc, i, g));

  /* 交互提示（原版"点碎片中间的 ↺ 按钮"的 3D 等价语义：单击即旋转） */
  PZ.rotHint = lbl('↺ 单击碎片可旋转', '#ffd9a8', 0.0058);
  PZ.rotHint.position.set(-3.2, 0.9, 5.6);
  regLabel(g, PZ.rotHint);

  /* 常驻标注：a / b / c 边长 + 完成结论 */
  PZ.lblA = lbl('a', '#ffd9a8', 0.0068);
  PZ.lblB = lbl('b', '#ffd9a8', 0.0068);
  PZ.lblC = lbl('c', '#a8e0b8', 0.0068);
  PZ.lblDone = lbl('拼满了：a² + b² = c²', '#a8e0b8', 0.009);
  regLabel(g, PZ.lblA); regLabel(g, PZ.lblB); regLabel(g, PZ.lblC); regLabel(g, PZ.lblDone);
  PZ.lblDone.visible = false;

  /* 归属铭牌 */
  const credit = lbl('Perigal 拼图 · 亨利·佩里加尔，1873', '#c8d4dc', 0.0052);
  credit.position.set(1.4, 2.6, 6.3);
  regLabel(g, credit);

  pzSync(true);
}

function pzAddPieceMesh(pc, i, g) {
  const mat = lacMat(pc.color, { glow: 0.1 });
  const mesh = slab(pc.local, { mat });
  mesh.userData.idx = i;
  const rim = tubeBorder(pc.local, { y: THK + 0.012, r: 0.02, mat: matStd(0xffffff, { roughness: 0.4, metalness: 0.2, transparent: true, opacity: 0.25 }) });
  mesh.userData.rim = rim;
  mesh.add(rim);
  const bb = new THREE.Box3().setFromBufferAttribute(mesh.geometry.attributes.position);
  const shadow = shadowPatch(bb.max.x - bb.min.x + 0.5, bb.max.z - bb.min.z + 0.5, 0.36);
  g.add(shadow);
  mesh.userData.shadow = shadow;
  g.add(mesh);
  PZ.pieceMeshes.push(mesh);
  return mesh;
}

function pzSync() {
  const { geo } = pz;
  /* 碎片位姿 + 投影跟随 */
  pz.pieces.forEach((pc, i) => {
    const mesh = PZ.pieceMeshes[i];
    if (!mesh) return;
    const lifted = pz.drag && pz.drag.idx === i && pc.slot < 0;
    mesh.position.set(pc.pos[0], LIFT + (pc.slot >= 0 ? 0.015 : lifted ? 0.34 : 0.02), -pc.pos[1]);
    mesh.rotation.y = pc.shown * Math.PI / 2;
    mesh.material.emissiveIntensity = pc.slot >= 0 ? 0.24 : (pz.hoverIdx === i ? 0.32 : 0.1);
    const p3 = P2C(pc.pos);
    mesh.userData.shadow.position.set(p3.x, LIFT + 0.012, p3.z + 0.03);
    mesh.userData.shadow.visible = pc.slot < 0;
  });
  /* 完成态 */
  if (pz.done) {
    PZ.cSqEdge.visible = true;
    PZ.lblDone.visible = true;
    const cCen = polyCentroid(geo.cSq);
    PZ.lblDone.position.set(cCen[0], 0.9, -cCen[1] + 0.3);
  } else {
    PZ.cSqEdge.visible = false;
    PZ.lblDone.visible = false;
  }
  /* 边长标注（抬高到板面上方，避免侧视时被板体遮挡成小点） */
  const { a, b, tri, nrm } = geo;
  PZ.lblA.position.set(-a / 2 - 0.36, 0.72, -(a / 2));
  PZ.lblB.position.set(b / 2, 0.72, b + 0.36);
  const midH = [(tri[1][0] + tri[2][0]) / 2 + nrm[0] * 0.42, (tri[1][1] + tri[2][1]) / 2 + nrm[1] * 0.42];
  PZ.lblC.position.set(midH[0], 0.72, -midH[1]);
}

function pzRefreshHint() {
  while (PZ.hintGroup.children.length) {
    const ch = PZ.hintGroup.children.pop();
    if (ch.geometry) ch.geometry.dispose();
    ch.material?.dispose?.();
  }
  PZ.cOutline.visible = true;
  if (!pz.hint || pz.done) return;
  const taken = new Set(pz.pieces.filter((p) => p.slot >= 0).map((p) => p.slot));
  pz.geo.items.forEach((it, i) => {
    if (taken.has(i)) return;
    const fill = slab(it.slot, { thick: 0.03, mat: new THREE.MeshBasicMaterial({ color: STYLES[styleName].hintFill, transparent: true, opacity: 0.3 }) });
    PZ.hintGroup.add(fill);
  });
}

function pzSnapCheck(pc) {
  const takenSlots = new Set(pz.pieces.filter((p) => p !== pc && p.slot >= 0).map((p) => p.slot));
  const cur = pzPolyAt(pc, pc.rot);
  const curCen = polyCentroid(cur);
  for (let s = 0; s < pz.geo.items.length; s++) {
    if (takenSlots.has(s)) continue;
    const sp = pz.geo.items[s].slot;
    const sc = polyCentroid(sp);
    if (Math.hypot(curCen[0] - sc[0], curCen[1] - sc[1]) > 0.6) continue;
    if (!polyMatch(cur, sp, 0.05)) continue;
    pc.slot = s;
    pc.pos = [...polyCentroid(sp)];
    pc.shown = pc.rot;
    return true;
  }
  const takenHomes = new Set(pz.pieces.filter((p) => p !== pc && p.home >= 0).map((p) => p.home));
  for (let s = 0; s < pz.geo.items.length; s++) {
    if (takenHomes.has(s)) continue;
    const hp = pz.geo.items[s].poly;
    const hc = polyCentroid(hp);
    if (Math.hypot(curCen[0] - hc[0], curCen[1] - hc[1]) > 0.6) continue;
    if (!polyMatch(cur, hp, 0.05)) continue;
    pc.home = s;
    pc.pos = [...polyCentroid(hp)];
    pc.shown = pc.rot;
    return true;
  }
  return false;
}

function pzCheckDone() {
  if (pz.done || pz.pieces.some((p) => p.slot < 0)) return;
  pz.done = true;
  pz.demo = null;
  pzSync();
}

/** 自动演示计划：对每块穷举 (旋转 × 槽位) 找精确匹配（原版同构） */
function pzDemoPlan() {
  const used = new Set();
  return pz.pieces.map((pc) => {
    for (let r = 0; r < 4; r++) {
      for (let s = 0; s < pz.geo.items.length; s++) {
        if (used.has(s)) continue;
        const cand = polyShift(polyRotAbout(pc.local, [0, 0], (r * Math.PI) / 2), polyCentroid(pz.geo.items[s].slot));
        if (polyMatch(cand, pz.geo.items[s].slot, 0.01)) {
          used.add(s);
          return { slot: s, rot: r, from: [...pc.pos], fromRot: pc.shown };
        }
      }
    }
    return null;
  });
}

function pzStartDemo() {
  pzReset();
  pz.demo = { t: 0, plan: pzDemoPlan() };
}

function pzRotate(pc) {
  pc.rot = (pc.rot + 1) % 4;
  pc.slot = -1;
  pc.home = -1;
}

function updPuzzle(dt) {
  /* 旋转角动画：shown 向 rot 连续逼近（可跨圈） */
  for (const pc of pz.pieces) {
    let d = pc.rot - pc.shown;
    for (; d < -2; d += 4);
    for (; d >= 2; d -= 4);
    pc.shown = Math.abs(d) < 0.02 ? pc.rot : pc.shown + d * Math.min(1, dt * 9);
  }
  /* 自动演示 */
  if (pz.demo) {
    pz.demo.t = Math.min(pz.pieces.length, pz.demo.t + dt * 0.9);
    pz.pieces.forEach((pc, i) => {
      const plan = pz.demo.plan[i];
      if (!plan) return;
      const k = smoothV(clamp(pz.demo.t - i, 0, 1));
      const slotCen = polyCentroid(pz.geo.items[plan.slot].slot);
      pc.pos = [plan.from[0] + (slotCen[0] - plan.from[0]) * k, plan.from[1] + (slotCen[1] - plan.from[1]) * k];
      let dr = plan.rot - plan.fromRot;
      for (; dr > 2; dr -= 4);
      for (; dr < -2; dr += 4);
      pc.shown = plan.fromRot + dr * k;
      pc.rot = plan.rot;
      if (k >= 1) { pc.slot = plan.slot; }
    });
    if (pz.demo.t >= pz.pieces.length) { pz.demo = null; pzCheckDone(); }
  }
  /* 提示填充脉冲 */
  if (PZ.hintGroup.children.length) {
    const pulse = 0.22 + Math.sin(performance.now() * 0.004) * 0.1;
    PZ.hintGroup.children.forEach((m) => { m.material.opacity = pulse; });
  }
  pzSync();
}

function puzzleHUD() {
  const { a, b, c } = pz.geo;
  const placed = pz.pieces.filter((p) => p.slot >= 0).length;
  hset('abc', `a = ${fmt1(a)},  b = ${fmt1(b)},  c = ${fmt1(c)}`);
  hset('asqbsq', `${fmt1(a * a)} + ${fmt1(b * b)} = ${fmt1(a * a + b * b)}`);
  hset('csq', `c² = ${fmt1(c * c)}`);
  hset('placed', pz.done ? '5 / 5 ✓' : `${placed} / 5`);
  hset('state', pz.done ? '拼满了！a² + b² = c²' : pz.demo ? '自动演示中…' : '拖动碎片进 c² · 单击旋转 90°');
}

function buildPuzzleScene(g) {
  pzReset();
  buildPuzzle(g);
  pzRefreshHint();
}

function puzzleCtl() {
  ctl.clear();
  const subh = document.createElement('div');
  subh.className = 'sub-h';
  subh.textContent = 'a : b';
  subh.style.cssText = 'flex:1 1 100%;font-size:11px;color:var(--text-faint);letter-spacing:.08em';
  ctl.el.appendChild(subh);
  ctl.seg({
    options: PZ_SHAPES.map(([v, l]) => ({ label: l, value: v })),
    value: pz.shape,
    onChange: (v) => {
      pz.shape = v;
      pz.hint = false;
      pzStartDemoReset();
    },
  });
  ctl.sep();
  const hintBtn = ctl.button({ label: '提示', onClick() { pz.hint = !pz.hint; hintBtn.classList.toggle('active', pz.hint); pzRefreshHint(); } });
  ctl.button({ label: '↺ 重来', onClick() { pzStartDemoReset(); } });
  ctl.button({ label: '▶ 自动演示', onClick() { pzStartDemo(); } });
  setHUD([['abc', '边长'], ['asqbsq', 'a² + b²'], ['csq', 'c²'], ['placed', '已放好'], ['state', '状态']]);
  puzzleHUD();
}
function pzStartDemoReset() {
  pzReset();
  pzRefreshHint();
  puzzleHUD();
}

/* ================= 章节 2：出入相补（刘徽）+ 赵爽弦图 ================= */

const ob = { mode: 'chair', a: 2, b: 3.2 };
const obPs = playState(1, 0.45);
const OB = {};

/** 出入相补 chair 几何：L 形拼板（b²+a² 并排）挖两个三角形槽 */
function outinShape(a, b) {
  const L = [[0, 0], [a + b, 0], [a + b, a], [b, a], [b, b], [0, b]];
  const t1 = { poly: [[0, 0], [a, 0], [0, b]], pivot: [0, b], dir: +1 };        // 绕 (0,b) 逆时针 90°
  const t2 = { poly: [[a, 0], [a + b, 0], [a + b, a]], pivot: [a + b, a], dir: -1 }; // 绕 (a+b,a) 顺时针 90°
  const square = [[a, 0], [a + b, a], [b, a + b], [0, b]];
  return { L, t1, t2, square };
}

function buildOutin(g) {
  OB.chairG = new THREE.Group();
  OB.zhaoG = new THREE.Group();
  g.add(OB.chairG, OB.zhaoG);
  /* 归属铭牌（随模式切换文案） */
  OB.credit = lbl('', '#c8d4dc', 0.0052);
  OB.credit.position.set(3.2, 2.6, 5.6);
  regLabel(g, OB.credit);
  buildChair(g);
  buildZhao(g);
  updOutin();
}

function buildChair(g) {
  const { a, b } = ob;
  const { L, t1, t2, square } = outinShape(a, b);
  /* body：L 形板挖两个三角形槽（Shape + holes） */
  const shape = new THREE.Shape(L.map(([x, y]) => new THREE.Vector2(x, y)));
  for (const t of [t1, t2]) {
    const hole = new THREE.Path();
    t.poly.forEach(([x, y], i) => (i ? hole.lineTo(x, y) : hole.moveTo(x, y)));
    hole.closePath();
    shape.holes.push(hole);
  }
  const geo = new THREE.ExtrudeGeometry(shape, { depth: THK, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 1 });
  geo.rotateX(-Math.PI / 2);
  OB.body = new THREE.Mesh(geo, matStd(C.board, { roughness: 0.68 }));
  OB.body.position.y = LIFT;
  OB.chairG.add(OB.body);
  /* 目标斜方块：虚线框 + 完成描边 */
  OB.sqDash = dashLoop(square, { y: LIFT + 0.03, opacity: 0.85 });
  OB.sqEdge = tubeBorder(square, { y: LIFT + 0.02, r: 0.03, mat: edgeMat() });
  OB.sqEdge.visible = false;
  OB.chairG.add(OB.sqDash, OB.sqEdge);
  /* 两块三角形板（几何 local 到枢轴，绕枢轴旋转） */
  OB.movers = [t1, t2].map((t, i) => {
    const local = polyShift(t.poly, [-t.pivot[0], -t.pivot[1]]);
    const mesh = slab(local, { mat: lacMat(i === 0 ? C.lacquerA : C.lacquerC, { glow: 0.12 }) });
    mesh.position.set(t.pivot[0], LIFT + 0.02, -t.pivot[1]);
    OB.chairG.add(mesh);
    /* 枢轴销钉（黄铜小圆柱，旋转轴的机械暗示） */
    const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.3, 14), matStd(PAL.brass, { roughness: 0.3, metalness: 0.85 }));
    pin.position.set(t.pivot[0], LIFT + THK / 2, -t.pivot[1]);
    OB.chairG.add(pin);
    const lblT = lbl(i === 0 ? '出·剪下' : '入·补上', '#ffd9a8', 0.005);
    const cen = polyCentroid(t.poly);
    lblT.position.set(cen[0], 0.62, -cen[1]);
    lblT.userData.owning = OB.chairG;
    regLabel(g, lblT, { parent: OB.chairG });
    return { mesh, t, lblT };
  });
  const cSqCen = polyCentroid(square);
  OB.chairLbl = lbl('c²', '#a8e0b8', 0.008);
  OB.chairLbl.position.set(cSqCen[0], 0.55, -cSqCen[1]);
  regLabel(g, OB.chairLbl);
  /* L 外描边 */
  OB.chairG.add(tubeBorder(L, { y: LIFT + THK + 0.01, r: 0.026, mat: edgeMat() }));
}

function buildZhao(g) {
  const { a, b } = ob;
  const S = a + b;
  const outer = [[a, 0], [S, a], [b, S], [0, b]];                 // 斜置 c² 外方（弦图外框）
  const inner = [[a, a], [b, a], [b, b], [a, b]];                 // 黄实 (b−a)²
  OB.zhOuterRim = tubeBorder(outer, { y: LIFT + THK + 0.01, r: 0.032, mat: edgeMat() });
  OB.zhaoG.add(OB.zhOuterRim);
  /* 朱实 ×4：外方边 + 黄实角 */
  const zhuTris = [
    [outer[0], outer[1], inner[0]],
    [outer[1], outer[2], inner[1]],
    [outer[2], outer[3], inner[2]],
    [outer[3], outer[0], inner[3]],
  ];
  OB.zhZhu = zhuTris.map((p, i) => {
    const mesh = slab(p, { mat: lacMat(C.lacquerA, { glow: 0.12 }) });
    mesh.position.y = LIFT + 0.012;
    OB.zhaoG.add(mesh);
    return mesh;
  });
  OB.zhHuang = slab(inner, { mat: lacMat(C.lacquerE, { glow: 0.14 }) });
  OB.zhHuang.position.y = LIFT + 0.02;
  OB.zhaoG.add(OB.zhHuang);
  OB.zhaoG.add(tubeBorder(inner, { y: LIFT + THK + 0.012, r: 0.02, mat: matStd(0xffffff, { roughness: 0.4, transparent: true, opacity: 0.3 }) }));
  /* 标注：朱实 / 黄实 / c */
  OB.zhLblZhu = lbl('朱实', '#ffb9a0', 0.0062);
  OB.zhLblHuang = lbl('黄实', '#ffe2a0', 0.0062);
  OB.zhLblC = lbl('c', '#a8e0b8', 0.007);
  regLabel(g, OB.zhLblZhu); regLabel(g, OB.zhLblHuang); regLabel(g, OB.zhLblC);
}

function updOutin() {
  const { a, b } = ob;
  const chair = ob.mode === 'chair';
  OB.chairG.visible = chair;
  OB.zhaoG.visible = !chair;
  setLbl(OB.credit, chair ? '出入相补 · 刘徽《九章算术注》' : '赵爽弦图 · 三国·赵爽《周髀算经注》', '#c8d4dc');
  /* 双模式标注互斥（板块随组隐藏，文字精灵挂在场景根，须显式随模式切换） */
  OB.chairLbl.visible = chair && labelsOn;
  OB.zhLblZhu.visible = OB.zhLblHuang.visible = OB.zhLblC.visible = !chair && labelsOn;
  if (chair) {
    const k = smoothV(obPs.t);
    for (const mv of OB.movers) {
      mv.mesh.rotation.y = mv.t.dir * k * Math.PI / 2;
      mv.lblT.visible = labelsOn;
    }
    OB.sqEdge.visible = k >= 0.999;
  } else {
    for (const mv of OB.movers) mv.lblT.visible = false;
    const S = a + b;
    const outer = [[a, 0], [S, a], [b, S], [0, b]];
    const inner = [[a, a], [b, a], [b, b], [a, b]];
    /* 朱实/黄实板件随 a/b 变化重建（低频操作，整组替换） */
    const zhuTris = [
      [outer[0], outer[1], inner[0]],
      [outer[1], outer[2], inner[1]],
      [outer[2], outer[3], inner[2]],
      [outer[3], outer[0], inner[3]],
    ];
    OB.zhZhu.forEach((m, i) => { m.geometry.dispose(); m.geometry = slabGeometry(zhuTris[i]); });
    OB.zhHuang.geometry.dispose();
    OB.zhHuang.geometry = slabGeometry(inner);
    const cMid = [(outer[0][0] + outer[1][0]) / 2, (outer[0][1] + outer[1][1]) / 2];
    OB.zhLblC.position.set(cMid[0] + 0.3, 0.78, -cMid[1] - 0.3);
    const triCen = polyCentroid([outer[2], outer[3], inner[2]]);
    OB.zhLblZhu.position.set(triCen[0], 0.78, -triCen[1]);
    OB.zhLblHuang.position.set((a + b) / 2, 0.78, -(a + b) / 2);
  }
}

function outinRebuild() {
  /* a/b 变化：chair 侧整组重建（几何随尺寸变），zhao 侧仅换几何 */
  const g = scenes.outin;
  pruneLabels(g, OB.chairG);
  OB.movers = [];
  while (OB.chairG.children.length) {
    const ch = OB.chairG.children.pop();
    if (ch.geometry) ch.geometry.dispose();
    disposeMat(ch.material);
  }
  buildChair(g);
  updOutin();
}

function outinHUD() {
  const { a, b } = ob;
  const c = Math.hypot(a, b);
  if (ob.mode === 'chair') {
    hset('sum', `${fmt1(a * a + b * b)}`);
    hset('csq', `${fmt1(c * c)}`);
    hset('extra', obPs.t >= 0.999 ? '拼成 c²：面积没有增减 ✓' : `移动进度 ${Math.round(smoothV(obPs.t) * 100)}%`);
  } else {
    hset('sum', `c² = ${fmt1(c * c)}`);
    hset('csq', `4 × ab/2 = ${fmt1(2 * a * b)}`);
    hset('extra', `(b − a)² = ${fmt1((b - a) * (b - a))}`);
  }
}

function outinCtl() {
  ctl.clear();
  ctl.seg({
    options: [{ label: '出入相补', value: 'chair' }, { label: '赵爽弦图', value: 'zhao' }],
    value: ob.mode,
    onChange: (v) => { ob.mode = v; obPs.t = 0; obPs.dir = 0; outinCtl(); updOutin(); outinHUD(); },
  });
  ctl.sep();
  ctl.slider({ label: 'a', min: 0.8, max: 3, step: 0.05, value: ob.a, fmt: fmt1, onInput: (v) => { setAB(v, null); } });
  ctl.slider({ label: 'b', min: 1.2, max: 4, step: 0.05, value: ob.b, fmt: fmt1, onInput: (v) => { setAB(null, v); } });
  if (ob.mode === 'chair') {
    OB.tSlider = ctl.slider({ label: '移动', min: 0, max: 1, step: 0.01, value: obPs.t, fmt: (v) => `${Math.round(v * 100)}%`, onInput: (v) => { obPs.t = v; obPs.dir = 0; updOutin(); outinHUD(); } });
    const playBtn = ctl.button({ label: '▶ 出入相补', onClick() { obPs.toggle(); playBtnLabel(playBtn, obPs, '▶ 出入相补', '↺ 还原'); } });
    playBtn.dataset.play = '1';
  }
  setHUD([['sum', ob.mode === 'chair' ? 'a² + b²' : 'c²'], ['csq', ob.mode === 'chair' ? 'c²' : '4 × ab/2'], ['extra', ob.mode === 'chair' ? '进度' : '(b−a)²']]);
  outinHUD();
}
function setAB(av, bv) {
  if (av !== null) {
    ob.a = av;
    if (ob.a > ob.b - 0.2) { ob.b = ob.a + 0.2; }
  } else {
    ob.b = bv;
    if (ob.b - 0.2 < ob.a) { ob.a = ob.b - 0.2; }
  }
  outinRebuild();
  outinSyncSliders();
  outinHUD();
}
/* 只刷数值显示，不派发 input（防递归重建） */
function outinSyncSliders() {
  const wraps = ctl.el.querySelectorAll('.ctl');
  for (const [w, v] of [[wraps[0], ob.a], [wraps[1], ob.b]]) {
    if (!w) continue;
    const inp = w.querySelector('input[type=range]');
    const val = w.querySelector('.ctl-val');
    if (inp) inp.value = v;
    if (val) val.textContent = fmt1(v);
  }
}

/* ================= 章节 3：欧几里得的证明（I.47，剪切→旋转→剪切） ================= */

const EU_A = 3, EU_B = 4;
const euPs = playState(3, 0.35);
const EU = {};

/** 斜边放平的框架序列：square on AC → 剪切平行四边形 → 绕 A 转 −90° → 剪切成 AH 矩形 */
function euclidFrames(a, b) {
  const c = Math.hypot(a, b);
  const A = [0, 0], B = [c, 0];
  const Cp = [a * a / c, a * b / c];                     // 直角顶点 C（腿 a 侧）
  const H = [Cp[0], 0];                                  // 垂足
  const e = [Cp[0] - A[0], Cp[1] - A[1]];                // A→C 向量
  const n = [-e[1], e[0]];                               // AC 外法线
  const f0 = [A, Cp, [Cp[0] + n[0], Cp[1] + n[1]], [A[0] + n[0], A[1] + n[1]]];  // a² 方（AC 边上）
  const f1 = [A, B, [Cp[0] + n[0] + B[0] - Cp[0], Cp[1] + n[1]], [A[0] + n[0], A[1] + n[1]]]; // 剪切：底边 AB
  const f2 = polyRotAbout(f1, A, -Math.PI / 2);          // 绕 A 旋转 −90°（到斜边下方）
  const f3 = [A, [0, -c], [H[0], -c], H];                // 终态：垂足侧矩形（面积 a²）
  return { c, A, B, C: Cp, H, frames: [f0, f1, f2, f3], cSq: [A, B, [c, -c], [0, -c]] };
}

function buildEuclid(g) {
  const fr = euclidFrames(EU_A, EU_B);
  EU.fr = fr;
  /* c² 方框（斜边下方，虚线 + 台缘描边） */
  EU.cDash = dashLoop(fr.cSq, { y: LIFT + 0.03, opacity: 0.8 });
  g.add(EU.cDash);
  /* 主三角形板 */
  EU.tri = slab([fr.A, fr.B, fr.C], { mat: matStd(C.board, { roughness: 0.68 }) });
  EU.tri.position.y = LIFT;
  g.add(EU.tri);
  g.add(tubeBorder([fr.A, fr.B, fr.C], { y: LIFT + THK + 0.01, r: 0.03, mat: edgeMat() }));
  /* 直角标记（在 C 处，沿 CA/CB 方向） */
  const u1 = [(fr.A[0] - fr.C[0]) / EU_A, (fr.A[1] - fr.C[1]) / EU_A];
  const u2 = [(fr.B[0] - fr.C[0]) / EU_B, (fr.B[1] - fr.C[1]) / EU_B];
  const mk = 0.4;
  const rp = [
    [fr.C[0] + u1[0] * mk, fr.C[1] + u1[1] * mk],
    [fr.C[0] + (u1[0] + u2[0]) * mk, fr.C[1] + (u1[1] + u2[1]) * mk],
    [fr.C[0] + u2[0] * mk, fr.C[1] + u2[1] * mk],
  ];
  g.add(flatPolyline(rp, { y: LIFT + THK + 0.02, mat: flatLineMat(0.75) }));
  /* 垂线 C→(H_x, −c)（虚线） */
  EU.altLine = flatPolyline([fr.C, [fr.H[0], -fr.c]], { y: LIFT + 0.04, mat: dashedMat(0.7), dashed: true });
  g.add(EU.altLine);
  /* 原位虚线框（两块方板的初始位置） */
  const frB = euclidFrames(EU_B, EU_A);                  // 另一块（腿 b 侧）
  EU.frB = frB;
  EU.originDashA = dashLoop(fr.frames[0], { y: LIFT + 0.03, opacity: 0.55 });
  const mirB = frB.frames[0].map(([x, y]) => [frB.c - x, y]);   // 镜像到 B 侧上方
  EU.originDashB = dashLoop(mirB, { y: LIFT + 0.03, opacity: 0.55 });
  g.add(EU.originDashA, EU.originDashB);
  /* 两块动画板：a²（左）与 b²（右，镜像框架） */
  EU.pieceA = slab(fr.frames[0], { mat: lacMat(C.lacquerB, { glow: 0.12 }) });
  EU.pieceA.position.y = LIFT + 0.012;
  EU.pieceB = slab(frB.frames[0], { mat: lacMat(C.lacquerD, { glow: 0.12 }) });
  EU.pieceB.position.y = LIFT + 0.012;
  g.add(EU.pieceA, EU.pieceB);
  /* 标注 A/B/C/H + 矩形落位标签 */
  EU.lbls = {};
  for (const [key, text, color] of [['A', 'A', '#ffd9a8'], ['B', 'B', '#ffd9a8'], ['C', 'C', '#ffd9a8'], ['H', 'H', '#ffd9a8'],
    ['rectA', '← a² 落位', '#cdb8f0'], ['rectB', 'b² 落位 →', '#b9c8f0'], ['c2', 'c²', '#a8e0b8']]) {
    const s = lbl(text, color, key === 'c2' ? 0.008 : 0.0056);
    EU.lbls[key] = s;
    regLabel(g, s);
  }
  updEuclid();
}

/** 框架插值（原版 G 语义：0→1 顶点插值剪切；1→2 绕 A 旋转；2→3 顶点插值剪切） */
function frameAt(frames, t) {
  const stage = Math.min(2, Math.floor(t + 1e-9));
  const k = Math.min(1, t - stage);
  if (stage === 1) return polyRotAbout(frames[1], frames[1][0], -Math.PI / 2 * k);
  const f0 = frames[stage], f1 = frames[stage + 1];
  return f0.map((p, i) => [p[0] + (f1[i][0] - p[0]) * k, p[1] + (f1[i][1] - p[1]) * k]);
}

function updEuclid() {
  const fr = EU.fr, frB = EU.frB;
  const t = euPs.t;
  const pa = frameAt(fr.frames, t);
  /* b² 板：框架镜像（x → c − x）后同相插值 */
  const pb = frameAt(frB.frames, t).map(([x, y]) => [fr.c - x, y]);
  EU.pieceA.geometry.dispose();
  EU.pieceA.geometry = slabGeometry(pa);
  EU.pieceB.geometry.dispose();
  EU.pieceB.geometry = slabGeometry(pb);
  /* 标注位置 */
  const { A, B, C, H, c } = fr;
  EU.lbls.A.position.set(A[0] - 0.3, 0.3, -A[1] - 0.2);
  EU.lbls.B.position.set(B[0] + 0.3, 0.3, -B[1] - 0.2);
  EU.lbls.C.position.set(C[0] - 0.15, 0.3, -C[1] - 0.35);
  EU.lbls.H.position.set(H[0], 0.3, 0.42);
  EU.lbls.c2.position.set(c / 2, 0.3, -(-c / 2) - c - 0.4);
  const done = t >= 2.999;
  EU.lbls.rectA.visible = done && labelsOn;
  EU.lbls.rectB.visible = done && labelsOn;
  EU.lbls.rectA.position.set(H[0] / 2, 0.32, -c / 2 - 0.1);
  EU.lbls.rectB.position.set((H[0] + c) / 2 + 0.2, 0.32, -c / 2 - 0.1);
}

function euclidHUD() {
  const { c } = EU.fr;
  const stepIdx = euPs.t <= 0 ? -1 : euPs.t >= 3 ? 3 : Math.floor(euPs.t + 1e-9);
  const names = ['初始：a² 在 AC 边上，b² 在 BC 边上', '剪切① 同底等高 → 平行四边形', '旋转 90° → 斜边下侧', '剪切② → 垂足矩形（面积不变）'];
  hset('step', stepIdx < 0 ? '待演示' : stepIdx >= 3 ? '落位完成 ✓' : `${stepIdx + 1} / 3 · ${names[stepIdx]}`);
  hset('areaA', `${fmt1(EU_A * EU_A)}（守恒 ✓）`);
  hset('areaB', `${fmt1(EU_B * EU_B)}（守恒 ✓）`);
  hset('sum', `a² + b² = ${fmt1(EU_A * EU_A)} + ${fmt1(EU_B * EU_B)} = ${fmt1(c * c)} = c²`);
}

function euclidCtl() {
  ctl.clear();
  EU.tSlider = ctl.slider({ label: '变换', min: 0, max: 3, step: 0.01, value: euPs.t, fmt: (v) => `${v.toFixed(2)} / 3`, onInput: (v) => { euPs.t = v; euPs.dir = 0; updEuclid(); euclidHUD(); } });
  ctl.sep();
  const playBtn = ctl.button({ label: '▶ 演示', onClick() { euPs.toggle(); playBtnLabel(playBtn, euPs, '▶ 演示', '↺ 还原'); } });
  playBtn.dataset.play = '1';
  setHUD([['step', '步骤'], ['areaA', 'a² 板面积'], ['areaB', 'b² 板面积'], ['sum', '结论']]);
  euclidHUD();
}

/* ================= 章节 4：更多证法（毕达哥拉斯重排 / 加菲尔德梯形） ================= */

const MO_A = 1.8, MO_B = 3;
const mo = { mode: 'pyth' };
const moPs = playState(1, 0.45);
const MO = {};

/** (a+b)² 内 4 个三角形两种位形 + 中央 c² / a²+b² 空隙 */
function rearrangeLayout(a, b) {
  const S = a + b;
  const X = [
    [[0, 0], [a, 0], [0, b]],
    [[S, 0], [S, a], [a, 0]],
    [[S, S], [b, S], [S, a]],
    [[0, S], [0, b], [b, S]],
  ];
  const Y = [
    [[S, 0], [S, a], [a, 0]],
    [[a, a], [a, 0], [S, a]],
    [[0, a], [a, a], [0, S]],
    [[a, S], [0, S], [a, a]],
  ];
  const cSq = [[a, 0], [S, a], [b, S], [0, b]];
  const aSq = [[0, 0], [a, 0], [a, a], [0, a]];
  const bSq = [[a, a], [S, a], [S, S], [a, S]];
  return { S, X, Y, cSq, aSq, bSq };
}

function buildMore(g) {
  MO.pythG = new THREE.Group();
  MO.garfG = new THREE.Group();
  g.add(MO.pythG, MO.garfG);
  MO.credit = lbl('', '#c8d4dc', 0.0052);
  MO.credit.position.set(2.4, 2.5, 5.8);
  regLabel(g, MO.credit);
  /* ---- pyth：大方板 + 4 块可重排三角形 ---- */
  const { S } = rearrangeLayout(MO_A, MO_B);
  MO.bigSlab = slab([[0, 0], [S, 0], [S, S], [0, S]], { mat: matStd(C.board, { roughness: 0.7 }) });
  MO.bigSlab.position.y = LIFT;
  MO.pythG.add(MO.bigSlab);
  MO.pythG.add(tubeBorder([[0, 0], [S, 0], [S, S], [0, S]], { y: LIFT + THK + 0.01, r: 0.03, mat: edgeMat() }));
  MO.tris = [];
  for (let i = 0; i < 4; i++) {
    const mesh = slab(rearrangeLayout(MO_A, MO_B).X[i], { mat: lacMat([C.lacquerA, C.lacquerB, C.lacquerD, C.lacquerC][i], { glow: 0.12 }) });
    mesh.position.y = LIFT + 0.012 + i * 0.004;
    MO.pythG.add(mesh);
    MO.tris.push(mesh);
  }
  MO.cDash = dashLoop(rearrangeLayout(MO_A, MO_B).cSq, { y: LIFT + 0.03, opacity: 0.85 });
  MO.abDashA = dashLoop(rearrangeLayout(MO_A, MO_B).aSq, { y: LIFT + 0.03, opacity: 0 });
  MO.abDashB = dashLoop(rearrangeLayout(MO_A, MO_B).bSq, { y: LIFT + 0.03, opacity: 0 });
  MO.pythG.add(MO.cDash, MO.abDashA, MO.abDashB);
  MO.lblC2 = lbl('c²', '#a8e0b8', 0.009);
  MO.lblA2 = lbl('a²', '#ffd9a8', 0.007);
  MO.lblB2 = lbl('b²', '#ffd9a8', 0.007);
  regLabel(g, MO.lblC2); regLabel(g, MO.lblA2); regLabel(g, MO.lblB2);
  /* ---- garfield：梯形虚线框 + 三块落下板 ---- */
  const ga = MO_A, gb = MO_B;
  const trap = [[0, 0], [ga + gb, 0], [ga + gb, gb], [0, ga]];
  MO.trapDash = dashLoop(trap, { y: LIFT + 0.03, opacity: 0.8 });
  MO.garfG.add(MO.trapDash);
  const T1 = [[0, 0], [gb, 0], [0, ga]];
  const T2 = [[gb, 0], [ga + gb, 0], [ga + gb, gb]];
  const T3 = [[0, ga], [gb, 0], [ga + gb, gb]];
  MO.garfTris = [T1, T2, T3].map((p, i) => {
    const mesh = slab(p, { mat: lacMat([C.lacquerA, C.lacquerB, C.lacquerE][i], { glow: 0.12 }) });
    mesh.position.y = LIFT + 0.012;
    MO.garfG.add(mesh);
    const cen = polyCentroid(p);
    const lb = lbl(i === 2 ? 'c²/2' : 'ab/2', i === 2 ? '#ffe2a0' : '#ffd9a8', 0.0058);
    lb.position.set(cen[0], 0.34, -cen[1]);
    regLabel(g, lb);
    return { mesh, cen, lb, home: p };
  });
  MO.garfLbls = {};
  for (const [key, text] of [['a1', 'a'], ['b1', 'b'], ['a2', 'a'], ['b2', 'b'], ['c1', 'c'], ['c2', 'c']]) {
    const s = lbl(text, key.startsWith('c') ? '#a8e0b8' : '#ffd9a8', 0.006);
    MO.garfLbls[key] = s;
    regLabel(g, s);
  }
  updMore();
}

function updMore() {
  const pyth = mo.mode === 'pyth';
  MO.pythG.visible = pyth;
  MO.garfG.visible = !pyth;
  setLbl(MO.credit, pyth ? '毕达哥拉斯重排 · 公元前 5 世纪学派' : '加菲尔德梯形 · 美国第 20 任总统，1876', '#c8d4dc');
  const la = rearrangeLayout(MO_A, MO_B);
  if (pyth) {
    const f = smoothV(moPs.t);
    la.X.forEach((x0, i) => {
      const cur = polyMorph(x0, la.Y[i], f);
      MO.tris[i].geometry.dispose();
      MO.tris[i].geometry = slabGeometry(cur);
    });
    MO.cDash.material.opacity = 0.85 * Math.max(0, 1 - 2 * f);
    MO.abDashA.material.opacity = 0.85 * Math.max(0, 2 * f - 1);
    MO.abDashB.material.opacity = 0.85 * Math.max(0, 2 * f - 1);
    const cCen = polyCentroid(la.cSq), aCen = polyCentroid(la.aSq), bCen = polyCentroid(la.bSq);
    MO.lblC2.visible = labelsOn && f < 0.35;
    MO.lblA2.visible = MO.lblB2.visible = labelsOn && f > 0.65;
    MO.lblC2.position.set(cCen[0], 0.4, -cCen[1]);
    MO.lblA2.position.set(aCen[0], 0.4, -aCen[1]);
    MO.lblB2.position.set(bCen[0], 0.4, -bCen[1]);
    /* 梯形侧标注互斥隐藏（精灵挂场景根，不随 garfG 隐藏） */
    for (const gt of MO.garfTris) gt.lb.visible = false;
    for (const s of Object.values(MO.garfLbls)) s.visible = false;
  } else {
    MO.lblC2.visible = MO.lblA2.visible = MO.lblB2.visible = false;
    const ga = MO_A, gb = MO_B;
    const f = smoothV(moPs.t);
    MO.garfTris.forEach((gt, i) => {
      const k = clamp(f * 3 - i, 0, 1);
      const e = k * k * (3 - 2 * k);
      gt.mesh.scale.setScalar(Math.max(0.001, e));
      gt.mesh.position.y = LIFT + 0.012 + (1 - e) * 1.6;
      gt.lb.visible = labelsOn && k > 0.92;
    });
    for (const s of Object.values(MO.garfLbls)) s.visible = labelsOn;
    const lblPos = {
      a1: [-0.35, ga / 2], b1: [gb / 2, -0.38], a2: [gb + ga / 2, -0.38], b2: [ga + gb + 0.38, gb / 2],
      c1: [gb * 0.34, ga * 0.68], c2: [gb + gb * 0.52, ga * 0.5 + gb * 0.3],
    };
    for (const [key, [x, y]] of Object.entries(lblPos)) MO.garfLbls[key].position.set(x, 0.3, -y);
  }
}

function moreHUD() {
  const ga = MO_A, gb = MO_B;
  if (mo.mode === 'pyth') {
    hset('mode', '毕达哥拉斯重排');
    hset('read', `重排进度 ${Math.round(smoothV(moPs.t) * 100)}%`);
    hset('concl', moPs.t >= 0.999 ? '空隙 c² → a² + b² ✓' : '大正方形与三角形都没变');
    hset('sum', `c² = a² + b² = ${fmt1(ga * ga + gb * gb)}`);
  } else {
    hset('mode', '加菲尔德梯形');
    hset('read', `梯形面积 = ${fmt1((ga + gb) * (ga + gb) / 2)}`);
    hset('concl', `三个三角形 = ${fmt1(ga * gb + (ga * ga + gb * gb) / 2)}`);
    hset('sum', `化简得 c² = a² + b² = ${fmt1(ga * ga + gb * gb)}`);
  }
}

function moreCtl() {
  ctl.clear();
  ctl.seg({
    options: [{ label: '毕达哥拉斯重排', value: 'pyth' }, { label: '加菲尔德梯形', value: 'garfield' }],
    value: mo.mode,
    onChange: (v) => { mo.mode = v; moPs.t = 0; moPs.dir = 0; moreCtl(); updMore(); moreHUD(); },
  });
  ctl.sep();
  MO.tSlider = ctl.slider({ label: mo.mode === 'pyth' ? '重排' : '拼合', min: 0, max: 1, step: 0.01, value: moPs.t, fmt: (v) => `${Math.round(v * 100)}%`, onInput: (v) => { moPs.t = v; moPs.dir = 0; updMore(); moreHUD(); } });
  const playBtn = ctl.button({ label: '▶ 演示', onClick() { moPs.toggle(); playBtnLabel(playBtn, moPs, '▶ 演示', '↺ 还原'); } });
  playBtn.dataset.play = '1';
  setHUD([['mode', '证法'], ['read', '读数'], ['concl', '中间量'], ['sum', '结论']]);
  moreHUD();
}

/* ================= 章节 5：倒水实验（勾股水槽） ================= */

const wt = { a: 2.1, b: 2.8 };
const wtPs = playState(1, 0.16);
const WT = {};
let wtWobble = 0;

function waterMat() {
  const m = matGlow(STYLES[styleName].water, 0.55, { roughness: 0.25, transparent: true, opacity: 0.62 });
  styleRefs.waterMats.push(m);
  return m;
}

function wtCenter(a, b) {
  const g = triBoard(a, b);
  const pts = [...g.aSq, ...g.bSq, ...g.cSq];
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  return [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2];
}

function buildWater(g) {
  /* 水体/标注在数学平面绕质心 cen 旋转（polyRotAbout），板组必须绕同一世界点转——
     用 pivot 挂在 (cen.x, -cen.y)、boat 反向偏移实现（直接 boat.rotation.y 会绕原点转，
     转角越大水体与槽错位越大，180° 时偏差 2·cen） */
  WT.pivot = new THREE.Group();
  WT.boat = new THREE.Group();
  WT.pivot.add(WT.boat);
  g.add(WT.pivot);
  WT.waterG = new THREE.Group();
  g.add(WT.waterG);
  WT.waterMeshes = [0, 1, 2].map(() => new THREE.Mesh(new THREE.BufferGeometry(), waterMat()));
  WT.waterMeshes.forEach((m) => WT.waterG.add(m));
  WT.flow = [0, 1].map(() => flatPolyline([[0, 0], [1, 0]], { y: LIFT + 0.06, mat: dashedMat(0.75), dashed: true }));
  WT.flow.forEach((f) => g.add(f));
  WT.lbls = ['a²', 'b²', 'c²'].map((t, i) => {
    const s = lbl(t, ['#9cd2ff', '#cdb8f0', '#a8e0b8'][i], 0.0085);
    regLabel(g, s);
    return s;
  });
  WT.concl = lbl('', '#a8e0b8', 0.0082);
  regLabel(g, WT.concl);
  wtVesselRebuild();
}

function wtVesselRebuild() {
  const g = scenes.water;
  pruneLabels(g, WT.boat);
  while (WT.boat.children.length) {
    const ch = WT.boat.children.pop();
    if (ch.geometry) ch.geometry.dispose();
    disposeMat(ch.material);
  }
  const { a, b } = wt;
  const t = triBoard(a, b);
  const rims = [];
  WT.squares = [t.aSq, t.bSq, t.cSq].map((sq, i) => {
    const mesh = slab(sq, { mat: i === 2 ? matStd(C.board, { roughness: 0.66 }) : matStd(C.board, { roughness: 0.66 }) });
    mesh.position.y = LIFT;
    WT.boat.add(mesh);
    /* 槽沿：沿方形周界一圈低围条（沿心抬高到水面上方，挡住水体的"槽壁"） */
    const rim = tubeBorder(sq, { y: LIFT + THK + 0.072, r: 0.034, mat: matStd(C.boardDeep, { roughness: 0.5 }) });
    WT.boat.add(rim);
    rims.push(rim);
    return sq;
  });
  WT.triPoly = t.tri;
  WT.triMesh = slab(t.tri, { mat: matStd(C.tri, { roughness: 0.55 }) });
  WT.triMesh.position.y = LIFT + 0.01;
  WT.triMesh.material.emissive = new THREE.Color(C.tri);
  WT.triMesh.material.emissiveIntensity = 0.1;
  WT.boat.add(WT.triMesh);
  const triRim = tubeBorder(t.tri, { y: LIFT + THK + 0.05, r: 0.026, mat: edgeMat() });
  WT.boat.add(triRim);
  /* 枢轴对齐到旋转质心（a/b 变化后 cen 随动） */
  const cen = wtCenter(a, b);
  WT.pivot.position.set(cen[0], 0, -cen[1]);
  WT.boat.position.set(-cen[0], 0, cen[1]);
}

function updWater(dt) {
  wtWobble += dt;
  const { a, b } = wt;
  const cen = wtCenter(a, b);
  const phi = Math.PI * smoothV(wtPs.t);
  WT.pivot.rotation.y = phi;
  const M = smoothV((wtPs.t - 0.35) / 0.5);
  const rot = (pts) => polyRotAbout(pts, cen, phi);
  const rSquares = WT.squares.map(rot);
  /* 三槽水位：目标水量（a²/b² 随转出递减，c² 递增）→ 每槽独立水平面二分 */
  const targets = [a * a * (1 - M), b * b * (1 - M), (a * a + b * b) * M];
  const amp = wtPs.dir ? 0.045 : 0.012;
  rSquares.forEach((sq, i) => {
    const sol = solveWaterLevel(sq, Math.min(targets[i], polyArea(sq)));
    const pts2 = sol.poly.map(([x, y]) => (Math.abs(y - sol.level) < 1e-6
      ? [x, y + Math.sin(x * 4 + wtWobble * 5) * amp]
      : [x, y]));
    const mesh = WT.waterMeshes[i];
    mesh.geometry.dispose();
    if (pts2.length >= 3) {
      const shape = new THREE.Shape(pts2.map(([x, y]) => new THREE.Vector2(x, y)));
      const geo = new THREE.ShapeGeometry(shape);
      geo.rotateX(-Math.PI / 2);
      mesh.geometry = geo;
      /* 水面须高于板顶（板 bevel 顶 = LIFT+THK+0.022），低于槽沿下缘（沿心 LIFT+THK+0.072） */
      mesh.position.y = LIFT + THK + 0.036;
      mesh.visible = true;
    } else {
      mesh.visible = false;
    }
    const cenS = polyCentroid(sq);
    WT.lbls[i].position.set(cenS[0], 0.4, -cenS[1]);
  });
  /* 水流动线（虚线，转送中显示） */
  const cCen = polyCentroid(rSquares[2]);
  const flowShow = M > 0.001 && M < 0.999;
  [rSquares[0], rSquares[1]].forEach((sq, i) => {
    const low = sq.reduce((m, p) => (p[1] < m[1] ? p : m), sq[0]);
    const seg = [
      [low[0], low[1]],
      [cCen[0] + (low[0] - cCen[0]) * 0.22, cCen[1] + (low[1] - cCen[1]) * 0.22 + 0.42],
    ];
    WT.flow[i].geometry.dispose();
    WT.flow[i].geometry = new THREE.BufferGeometry().setFromPoints(seg.map(([x, y]) => V3(x, LIFT + 0.06, -y)));
    WT.flow[i].computeLineDistances();
    WT.flow[i].visible = flowShow && labelsOn;
  });
  /* 结论 */
  const done = wtPs.t >= 0.999;
  WT.concl.visible = done;
  if (done) {
    WT.concl.position.set(cCen[0], 1.15, -cCen[1]);
    setLbl(WT.concl, 'a² + b² 的水正好灌满 c² ✓', '#a8e0b8');
  }
}

function waterHUD() {
  const { a, b } = wt;
  const M = smoothV((wtPs.t - 0.35) / 0.5);
  hset('wa', `${fmt1(a * a * (1 - M))}`);
  hset('wb', `${fmt1(b * b * (1 - M))}`);
  hset('wc', `${fmt1((a * a + b * b) * M)} / ${fmt1(Math.hypot(a, b) ** 2)}`);
  hset('wstate', wtPs.t >= 0.999 ? '正好装满，不多也不少 ✓' : `转动 ${Math.round(wtPs.t * 180)}°`);
}

function waterCtl() {
  ctl.clear();
  ctl.slider({ label: 'a', min: 1.2, max: 3, step: 0.05, value: wt.a, fmt: fmt1, onInput: (v) => { wt.a = v; wtVesselRebuild(); updWater(0); waterHUD(); } });
  ctl.slider({ label: 'b', min: 1.2, max: 3, step: 0.05, value: wt.b, fmt: fmt1, onInput: (v) => { wt.b = v; wtVesselRebuild(); updWater(0); waterHUD(); } });
  ctl.sep();
  WT.tSlider = ctl.slider({ label: '转动', min: 0, max: 1, step: 0.005, value: wtPs.t, fmt: (v) => `${Math.round(v * 180)}°`, onInput: (v) => { wtPs.t = v; wtPs.dir = 0; updWater(0); waterHUD(); } });
  WT.playBtn = ctl.button({ label: '▶ 转动', onClick() { wtPs.toggle(); playBtnLabel(WT.playBtn, wtPs, '▶ 转动', '↺ 转回去'); } });
  WT.playBtn.dataset.play = '1';
  setHUD([['wa', 'a² 中的水'], ['wb', 'b² 中的水'], ['wc', 'c² 中的水'], ['wstate', '状态']]);
  waterHUD();
}

/* ================= 章节 6：勾股数（m/n 生成 + 散点墙点选） ================= */

const tp = { m: 2, n: 1, pick: null, hover: null };
const TP = {};
const TP_MAXC = 100;
const TP_SCALE = 0.092;        // 图上 1 单位 → 世界距离
const TP_ORG = [0.9, 0.35];    // 散点墙原点（世界 x, y）
const TP_WALL_Z = -6.15;       // 墙面 z（立在作业垫板后缘）

function gcd(x, y) { while (y) { [x, y] = [y, x % y]; } return x; }

/** 当前 (m, n) 生成的勾股数（m > n ≥ 1 才有效；互质 + 一奇一偶 → 本原） */
function tripleOf(m, n) {
  if (!(m > n && n >= 1)) return null;
  const x = m * m - n * n, y = 2 * m * n, c = m * m + n * n;
  const lo = Math.min(x, y), hi = Math.max(x, y);
  return { a: lo, b: hi, c, primitive: gcd(m, n) === 1 && (m - n) % 2 === 1 };
}
/** c < maxC 的全部勾股数（含倍数组，primitive = 三数互质） */
function allTriples(maxC) {
  const out = [];
  for (let c = 1; c < maxC; c++) {
    for (let r = 1; r * r <= (c * c) / 2; r++) {
      const a = Math.round(Math.sqrt(c * c - r * r));
      if (r * r + a * a === c * c && a >= r) out.push({ a: r, b: a, c, primitive: gcd(gcd(r, a), c) === 1 });
    }
  }
  return out;
}
const chartToWorld = (x, y) => [TP_ORG[0] + x * TP_SCALE, TP_ORG[1] + y * TP_SCALE, TP_WALL_Z];

function buildTriples(g) {
  tp.pick = null;
  tp.hover = null;
  /* 展示墙：木板背板 + 图框 */
  const board = new THREE.Mesh(new THREE.BoxGeometry(10.4, 10.4, 0.16), deckMat());
  board.position.set(TP_ORG[0] + 50 * TP_SCALE, TP_ORG[1] + 50 * TP_SCALE - 0.1, TP_WALL_Z - 0.12);
  g.add(board);
  const frameRim = tubeBorderRectWorld(10.2, 10.2, TP_ORG[0] + 50 * TP_SCALE, TP_ORG[1] + 50 * TP_SCALE, TP_WALL_Z - 0.03);
  g.add(frameRim);
  /* 轴 + 刻度 */
  const axisMat = (() => { const m = new THREE.LineBasicMaterial({ color: STYLES[styleName].axis }); styleRefs.axisMats.push(m); return m; })();
  const axisGeo = new THREE.BufferGeometry().setFromPoints([
    V3(...chartToWorld(-3, 0)), V3(...chartToWorld(104, 0)),
    V3(...chartToWorld(-3, 0)), V3(...chartToWorld(-3, 104)),
  ]);
  g.add(new THREE.LineSegments(axisGeo, axisMat));
  const tickGeo = new THREE.BufferGeometry();
  const tickPts = [];
  for (let v = 10; v <= 100; v += 10) {
    const [x0, y0] = chartToWorld(v, 0), [x1, y1] = chartToWorld(0, v);
    tickPts.push(V3(x0, y0, TP_WALL_Z + 0.02), V3(x0, y0 - 0.14, TP_WALL_Z + 0.02));
    tickPts.push(V3(x1, y1, TP_WALL_Z + 0.02), V3(x1 - 0.14, y1, TP_WALL_Z + 0.02));
  }
  tickGeo.setFromPoints(tickPts);
  g.add(new THREE.LineSegments(tickGeo, axisMat));
  TP.tickSprites = [];
  const tickColor = () => (styleName === 'paper' ? '#4a4238' : '#b9cdd6');
  for (let v = 10; v <= 100; v += 10) {
    for (const [cx, cy] of [[v, 0], [0, v]]) {
      const [wx, wy] = chartToWorld(cx === 0 ? -6 : cx, cy === 0 ? -6 : cy);
      const s = lbl(String(v), tickColor(), 0.0042);
      s.position.set(wx, cy === 0 ? wy - 0.1 : wy + 0.1, TP_WALL_Z + 0.02);
      TP.tickSprites.push({ s, get: tickColor });
      g.add(s);
    }
  }
  /* c 参考弧（半径 10..100 的四分之一圆弧，圆角管放样） */
  TP.arcs = [];
  for (let R = 10; R <= 100; R += 10) {
    const pts = [];
    for (let i = 0; i <= 40; i++) {
      const th = (i / 40) * Math.PI / 2;
      pts.push(chartToWorld(R * Math.cos(th), R * Math.sin(th)));
    }
    const curve = new THREE.CatmullRomCurve3(pts.map((p) => V3(p[0], p[1], TP_WALL_Z + 0.03)));
    const arc = new THREE.Mesh(new THREE.TubeGeometry(curve, 60, 0.016, 6, false), dashedMat(0.4));
    g.add(arc);
    TP.arcs.push(arc);
  }
  /* 散点：InstancedMesh × 2（本原大点 / 倍数小点），(a,b) 与 (b,a) 双镜像 */
  TP.all = allTriples(TP_MAXC);
  const prim = TP.all.filter((t) => t.primitive);
  const mult = TP.all.filter((t) => !t.primitive);
  const sphGeoP = new THREE.SphereGeometry(0.085, 14, 10);
  const sphGeoM = new THREE.SphereGeometry(0.055, 12, 8);
  const mkPts = (list, geo) => {
    const m = matGlow(STYLES[styleName].point, 0.5, { roughness: 0.35 });
    styleRefs.pointMats.push(m);
    const inst = new THREE.InstancedMesh(geo, m, list.length * 2);
    const dummy = new THREE.Object3D();
    list.forEach((t, i) => {
      for (const [px, py] of [[t.a, t.b], [t.b, t.a]]) {
        const [wx, wy] = chartToWorld(px, py);
        dummy.position.set(wx, wy, TP_WALL_Z + 0.05);
        dummy.updateMatrix();
        inst.setMatrixAt(i * 2 + (px === t.a ? 0 : 1), dummy.matrix);
      }
    });
    inst.instanceMatrix.needsUpdate = true;
    inst.userData.list = list;
    g.add(inst);
    return inst;
  };
  TP.instPrim = mkPts(prim, sphGeoP);
  TP.instMult = mkPts(mult, sphGeoM);
  /* 选中环 */
  TP.ring = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.02, 8, 28), matGlow(0xe8674a, 0.8, { roughness: 0.4 }));
  TP.ring.visible = false;
  TP.ring.rotation.x = 0;
  g.add(TP.ring);
  /* 当前 (m,n) 直角三角形（画在墙面） */
  TP.triGroup = new THREE.Group();
  g.add(TP.triGroup);
  TP.hoverLbl = lbl('', '#ffffff', 0.0056);
  regLabel(g, TP.hoverLbl);
  TP.rayLbl = lbl('', '#ffd9a8', 0.0056);
  regLabel(g, TP.rayLbl);
  updTriples();
}

/** 散点墙图框（竖直面矩形描边） */
function tubeBorderRectWorld(w, h, cx, cy, z) {
  const corners = [[cx - w / 2, cy - h / 2], [cx + w / 2, cy - h / 2], [cx + w / 2, cy + h / 2], [cx - w / 2, cy + h / 2]];
  const flat = [];
  corners.forEach(([x, y], i) => {
    const pv = corners[(i + 3) % 4], nx = corners[(i + 1) % 4];
    const din = [Math.sign(x - pv[0]) || 0, Math.sign(y - pv[1]) || 0];
    const dout = [Math.sign(nx[0] - x) || 0, Math.sign(nx[1] - y) || 0];
    const rr = 0.3;
    const a = [x - din[0] * rr, y - din[1] * rr];
    const b = [x + dout[0] * rr, y + dout[1] * rr];
    for (let k = 0; k <= 5; k++) {
      const s = k / 5;
      const mx = a[0] + (x - a[0]) * s, my = a[1] + (y - a[1]) * s;
      const ex = x + (b[0] - x) * s, ey = y + (b[1] - y) * s;
      flat.push(V3(mx + (ex - mx) * s, my + (ey - my) * s, z));
    }
  });
  const curve = new THREE.CatmullRomCurve3(flat, true, 'catmullrom', 0.3);
  return new THREE.Mesh(new THREE.TubeGeometry(curve, 140, 0.035, 8, true), matStd(C.boardDeep, { roughness: 0.5 }));
}

function updTriples() {
  /* 当前三角形板（墙面上）：整组替换，标注精灵随 pruneLabels 一并回收 */
  while (TP.triGroup.children.length) {
    const ch = TP.triGroup.children.pop();
    if (ch.geometry) ch.geometry.dispose();
    ch.material?.dispose?.();
  }
  pruneLabels(scenes.triples, TP.triGroup);
  const cur = tripleOf(tp.m, tp.n);
  if (cur) {
    const P0 = chartToWorld(0, 0), PA = chartToWorld(cur.a, 0), PB = chartToWorld(cur.a, cur.b);
    const tri2d = [[0, 0], [cur.a, 0], [cur.a, cur.b]];
    const mesh = new THREE.Mesh(slabGeometry(tri2d, 0.05), matStd(C.tri, { roughness: 0.5, transparent: true, opacity: 0.32 }));
    mesh.rotation.x = 0;
    /* slabGeometry 是平放几何（XY→XZ），墙面需要竖直：rotateX(+π/2) 抬回 XY 面 */
    mesh.geometry.rotateX(Math.PI / 2);
    mesh.position.set(P0[0], P0[1], TP_WALL_Z + 0.08);
    TP.triGroup.add(mesh);
    /* 斜边虚线射线（延伸至 110/c 比例处） */
    const k = 110 / cur.c;
    const ray = flatPolyline([[0, 0], [cur.a * k, cur.b * k]], { y: 0, mat: dashedMat(0.7), dashed: true });
    ray.geometry.rotateX(Math.PI / 2);
    ray.position.set(P0[0], P0[1], TP_WALL_Z + 0.07);
    TP.triGroup.add(ray);
    /* 边长标签 */
    for (const [txt, wx, wy] of [
      [String(cur.a), (P0[0] + PA[0]) / 2, P0[1] - 0.3],
      [String(cur.b), PA[0] + 0.3, (P0[1] + PB[1]) / 2],
      [String(cur.c), (PA[0] + PB[0]) / 2 - 0.34, (PA[1] + PB[1]) / 2 + 0.1],
    ]) {
      const s = lbl(txt, '#ffd9a8', 0.005);
      s.position.set(wx, wy, TP_WALL_Z + 0.1);
      s.userData.owning = TP.triGroup;
      regLabel(scenes.triples, s, { parent: TP.triGroup });
    }
  }
  /* 选中态 */
  if (tp.pick) {
    const [wx, wy] = chartToWorld(tp.pick.a, tp.pick.b);
    TP.ring.visible = true;
    TP.ring.position.set(wx, wy, TP_WALL_Z + 0.1);
  } else {
    TP.ring.visible = false;
  }
  TP.rayLbl.visible = false;
}

function triplesHUD() {
  const cur = tripleOf(tp.m, tp.n);
  const primN = TP.all.filter((t) => t.primitive).length;
  if (!cur) {
    hset('gen', `a = m²−n² = –`);
    hset('gen2', 'b = 2mn = –');
    hset('gen3', 'c = m²+n² = –');
    hset('count', `c < ${TP_MAXC}：${TP.all.length} 组，其中本原的 ${primN} 组`);
    hset('need', '需要 m > n ≥ 1');
    hset('pick', tp.pick ? `选中：${tp.pick.a}² + ${tp.pick.b}² = ${tp.pick.c}²${tp.pick.primitive ? '' : '（即本原勾股数组放大整数倍所得）'}` : '点击图上的点查看');
    return;
  }
  hset('gen', `a = m²−n² = ${tp.m * tp.m - tp.n * tp.n}`);
  hset('gen2', `b = 2mn = ${2 * tp.m * tp.n}`);
  hset('gen3', `c = m²+n² = ${tp.m * tp.m + tp.n * tp.n}`);
  hset('count', `c < ${TP_MAXC}：${TP.all.length} 组，其中本原的 ${primN} 组`);
  hset('need', cur.primitive ? '本原勾股数 ✓（m,n 互质且一奇一偶）' : '不是本原的（有公因数）');
  hset('pick', tp.pick ? `选中：${tp.pick.a}² + ${tp.pick.b}² = ${tp.pick.c}²${tp.pick.primitive ? '' : '（即本原勾股数组放大整数倍所得）'}` : '点击图上的点查看');
}

function triplesCtl() {
  ctl.clear();
  ctl.slider({ label: 'm', min: 2, max: 9, step: 1, value: tp.m, fmt: (v) => String(v), onInput: (v) => { tp.m = v; tp.pick = null; updTriples(); triplesHUD(); } });
  ctl.slider({ label: 'n', min: 1, max: 8, step: 1, value: tp.n, fmt: (v) => String(v), onInput: (v) => { tp.n = v; tp.pick = null; updTriples(); triplesHUD(); } });
  ctl.sep();
  ctl.button({ label: '✋ 也可直接点击散点墙上的点', onClick() { } });
  setHUD([['gen', 'a = m²−n²'], ['gen2', 'b = 2mn'], ['gen3', 'c = m²+n²'], ['count', 'c<100 统计'], ['need', '本原判定'], ['pick', '选中']]);
  triplesHUD();
}

/* ================= 章节 7：随堂检测 ================= */

const QUIZ = [
  {
    q: 'Perigal 拼图里，b² 被切成了几块？连同 a² 一起拼进 c² 的碎片共有几块？',
    opts: ['切成 2 块，共 3 块', '切成 4 块，共 5 块', '切成 3 块，共 4 块', '切成 4 块，共 4 块'],
    a: 1,
    ex: 'b² 沿过中心的两条互相垂直的线（分别平行/垂直于斜边）切成 4 块，加上 a² 共 5 块，恰好铺满 c²。',
  },
  {
    q: '赵爽弦图中，大正方形（边长 c）由什么组成？',
    opts: ['4 个全等直角三角形（朱实）+ 1 个边长 (b−a) 的小正方形（黄实）', '2 个直角三角形 + 1 个正方形', '4 个正方形', '1 个圆和 2 个三角形'],
    a: 0,
    ex: 'c² = 4×ab/2 + (b−a)² = 2ab + a² − 2ab + b² = a² + b²，这正是弦图证明的核心。',
  },
  {
    q: '欧几里得证明中，b² 正方形经过了哪三次保持面积的变换落到 c² 里？',
    opts: ['平移、旋转、翻折', '剪切、旋转 90°、再剪切', '拉伸、压缩、旋转', '两次旋转加一次平移'],
    a: 1,
    ex: '剪切（同底等高变平行四边形）→ 绕 A 旋转 90° 到斜边一侧 → 再剪切成垂足一侧的矩形。每一步面积都严格守恒。',
  },
  {
    q: '加菲尔德梯形证明中，梯形面积 (a+b)²/2 等于哪三块之和？',
    opts: ['a² + b² + c²', 'ab/2 + ab/2 + c²/2', 'ab + c²', 'a²/2 + b²/2 + ab'],
    a: 1,
    ex: '两个全等直角三角形各 ab/2，中间等腰直角三角形 c²/2；展开 (a+b)²/2 = ab + c²/2，化简得 a² + b² = c²。',
  },
  {
    q: 'm = 5, n = 2 时生成的勾股数组是？它是不是本原勾股数？',
    opts: ['3,4,5，是', '20,21,29，是', '21,20,29，不是', '10,24,26，是'],
    a: 1,
    ex: 'a = 25−4 = 21，b = 2×5×2 = 20，c = 25+4 = 29，即 (20,21,29)。m,n 互质且一奇一偶，是本原勾股数。',
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
    back.addEventListener('click', () => { panel.remove(); window.__eduSections.select(0); });
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:10px;justify-content:center';
    row.appendChild(back); row.appendChild(again);
    card.appendChild(row);
    panel.appendChild(card);
  }

  renderQ();
  activeSectionCleanup = () => panel.remove();
}

/* ================= 章节定义（含机位） ================= */

const SECTIONS = [
  {
    id: 'puzzle', title: '拼图挑战',
    cam: [1.2, 10.2, 10.8], tgt: [1.6, 0, -0.8],
    html: `<p>一个直角三角形，三条边各自外接一个正方形。<b>勾股定理</b>讲的是：两条短边正方形的面积加在一起，恰好就等于斜边上那个大正方形，<span class="hl">a² + b² = c²</span>。</p>
<p>别急着算，先动手：b² 已经被切成 4 块，把它们和 a² 一起<b>拖</b>进 c²，看能不能拼满。</p>
<p>这是<b>Perigal 拼图</b>（亨利·佩里加尔，1873）。点碎片中间的 ↺（或<b>单击碎片</b>）能让它转过 90°；摆到位、角度也对上了就会<b>自动吸合</b>。切出的 4 块 + a² 拼满 c² 的那一刻，拼图自己就"证明"了定理。</p>`,
    enter() {
      Object.assign(pz, { shape: pz.shape, hint: false, done: false, drag: null, hoverIdx: -1 });
      useScene('puzzle', buildPuzzleScene);
      pzRefreshHint();
      puzzleCtl();
    },
  },
  {
    id: 'outin', title: '出入相补',
    cam: [1.0, 9.6, 10.4], tgt: [2.6, 0, -2.0],
    html: `<p>古人给直角三角形两条夹直角的边起了名字："勾"与"股"，斜边则叫"弦"。三国时<b>赵爽</b>以"弦图"、魏晋时<b>刘徽</b>借"出入相补"各自证得了勾股定理。</p>
<p><b>出入相补</b>：从图形上剪下一块挪到别处，总面积不增不减。把 a² 与 b² 并排摆好，在里头剪出两个直角三角形（"出"），各自绕某个顶点<b>转过 90°</b> 补到上方（"入"），恰好铺成一个以斜边 c 为边的正方形——全程面积无增减，于是 <span class="hl">a² + b² = c²</span>。</p>
<p>切到「赵爽弦图」看另一种拼法：大正方形由 4 个朱实（三角形）和中间的黄实（小正方形）组成。</p>`,
    enter() {
      Object.assign(ob, { mode: ob.mode || 'chair' });
      obPs.t = 0; obPs.dir = 0;
      useScene('outin', buildOutin);
      updOutin();
      outinCtl();
    },
  },
  {
    id: 'euclid', title: '欧几里得的证明',
    cam: [2.5, 9.8, 14.6], tgt: [2.5, 0, -1.2],
    html: `<p>《几何原本》第一卷第 47 个命题。自直角顶点 C 向斜边引垂线，c² 被分成两块矩形，随后证明这两块各自与 a²、b² 相等。</p>
<p>动画用三步等积变换替代了证明里的全等三角形：<b>剪切</b>（底边固定，上边顺着自身那条直线平移过去，正方形被推成平行四边形——同底等高，面积分毫未变）→ <b>旋转 90°</b>（绕 A 点翻到斜边那侧）→ <b>再剪切</b>（推平成垂足 H 那一侧的矩形）。两块矩形拼到一起恰好就是 c²。</p>
<p>点「演示」看三段连续变换；每一步面积都严格守恒，读数可见。</p>`,
    enter() {
      euPs.t = 0; euPs.dir = 0;
      useScene('euclid', buildEuclid);
      updEuclid();
      euclidCtl();
    },
  },
  {
    id: 'more', title: '更多证法',
    cam: [2.2, 9.0, 10.4], tgt: [2.4, 0, -2.4],
    html: `<p>论证法之丰富，勾股定理堪称第一，据传有人辑录过三百余种。这里再补看两种：<b>毕达哥拉斯那一派的"重排"</b>，以及后来当上总统的<b>加菲尔德的"梯形"</b>。</p>
<p><b>重排</b>：边长 a+b 的大正方形里摆进 4 个全等直角三角形，左侧留出的空位是 c²；把这四个三角形挪到别的摆法后，留下的空位变成了 a² 与 b²。外框大正方形与三角形本身都原封未动，因此 c² = a² + b²。</p>
<p><b>梯形</b>：拿两个直角三角形再配一块等腰的直角三角形，可以围出一个直角梯形；梯形面积 (a+b)²/2 = 2×ab/2 + c²/2，化简即得。1876 年刊于国会杂志，算是他的"副业成果"。</p>`,
    enter() {
      moPs.t = 0; moPs.dir = 0;
      useScene('more', buildMore);
      updMore();
      moreCtl();
    },
  },
  {
    id: 'water', title: '倒水',
    cam: [0.8, 10.8, 11.4], tgt: [1.0, 0, -1.0],
    html: `<p>将三个正方形加工成厚度一致的水槽，分别装在直角三角形三边外侧。先给 a² 与 b² 灌满水，接着<b>缓缓转动整块板</b>，水便会流进 c²。</p>
<p>猜猜看：能装满吗？会溢出吗？——三个容器"厚"度相同，水量体积便与正方形面积同比例增减。转到底就会发现：<span class="hl">a² + b² 的水，不多不少正好灌满 c²</span>。</p>
<p>拖动「转动」滑杆慢慢转，或点「转动」自动旋转；蓝色就是水，读数实时显示三个槽中的水量。</p>`,
    enter() {
      Object.assign(wt, { a: wt.a, b: wt.b });
      wtPs.t = 0; wtPs.dir = 0;
      useScene('water', buildWater);
      updWater(0);
      waterCtl();
    },
  },
  {
    id: 'triples', title: '勾股数',
    cam: [4.9, 5.6, 14.2], tgt: [5.1, 4.6, -6.2],
    html: `<p>直角三角形若三条边长全为整数，这组边长就叫一组<b>勾股数</b>，例如 3、4、5 与 5、12、13。</p>
<p>任取正整数 <b>m &gt; n</b>：<span class="hl">a = m²−n²，b = 2mn，c = m²+n²</span> 必然构成勾股数。拖动 m、n 试试；当 m、n 互质、又一奇一偶时，产出的是<b>本原勾股数</b>（三个数彼此无公因数）。</p>
<p>散点墙上是 c &lt; 100 的全部勾股数：每个点 (a, b) 与原点相距的恰好是整数 c，而处在同一射线上的点，都是同一组勾股数放大整数倍后的结果。<b>直接点击图上的点</b>可查看一组勾股数。</p>`,
    enter() {
      Object.assign(tp, { m: tp.m, n: tp.n, pick: null, hover: null });
      useScene('triples', buildTriples);
      updTriples();
      triplesCtl();
    },
  },
  {
    id: 'quiz', title: '随堂检测',
    cam: [1.6, 9.8, 12.4], tgt: [1.6, 0, -1.0],
    html: `<p>5 道题检验本章掌握情况。答完可重新开始。</p>`,
    enter() {
      ctl.clear();
      setHUD([['tip', '提示']]);
      hset('tip', '答题后自动判分并给解析');
      /* 背景：3-4-5 木板装置静景（水槽架全景） */
      wtPs.t = 0; wtPs.dir = 0;
      useScene('water', buildWater);
      updWater(0);
      showQuiz();
    },
  },
];

/* ================= 三栏布局驱动（左栏章节列表 / 右栏联动 / 折叠 / 专注） ================= */

const chapNav = document.getElementById('chapNav');
const chapCount = document.getElementById('chapCount');
const detailNo = document.getElementById('detailNo');
const detailTitle = document.getElementById('detailTitle');
const lessonEl = document.getElementById('lesson');
const detailBody = document.getElementById('detailBody');
const controlsEl = document.getElementById('controls');
const pythShell = document.getElementById('pythShell');
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
  chapCount.textContent = `${String(chapterIdx + 1).padStart(2, '0')}/${String(SECTIONS.length).padStart(2, '0')}`;
  detailNo.textContent = String(chapterIdx + 1).padStart(2, '0');
  detailTitle.textContent = sec.title;
  railNoL.textContent = String(chapterIdx + 1).padStart(2, '0');
  railTitleR.textContent = sec.title;
  lessonEl.innerHTML = sec.html || '';
  if (activeSectionCleanup) { activeSectionCleanup(); activeSectionCleanup = null; }
  sec.enter();
  accSecs.controls.classList.toggle('acc-empty', !controlsEl.children.length);
  detailBody.scrollTop = 0;
  app.setCamera(sec.cam, sec.tgt);
}

/* ---------------- 原版功能块 1:1：上一节(←)/下一节(→) · 重置视角(R) · 纸面/Studio(T) · 全屏(F) · 图上标注 ---------------- */

const chapPrev = document.getElementById('chapPrev');
const chapNext = document.getElementById('chapNext');
const camResetBtn = document.getElementById('camResetBtn');
const styleBtn = document.getElementById('styleBtn');
const labelsBtn = document.getElementById('labelsBtn');
const fullBtn = document.getElementById('fullBtn');

function gotoChapter(i) { selectChapter((i + SECTIONS.length) % SECTIONS.length); }
chapPrev.addEventListener('click', () => gotoChapter(chapterIdx - 1));
chapNext.addEventListener('click', () => gotoChapter(chapterIdx + 1));

function resetView() { app.setCamera(SECTIONS[chapterIdx].cam, SECTIONS[chapterIdx].tgt); }
camResetBtn.addEventListener('click', resetView);

function paintStyleBtn() {
  styleBtn.textContent = styleName === 'paper' ? '纸面风格' : 'Studio 风格';
  styleBtn.classList.toggle('on', styleName === 'paper');
  styleBtn.setAttribute('aria-pressed', String(styleName === 'paper'));
}
styleBtn.addEventListener('click', () => {
  applyStyle(styleName === 'paper' ? 'studio' : 'paper');
  paintStyleBtn();
});

function paintLabelsBtn() {
  labelsBtn.classList.toggle('on', labelsOn);
  labelsBtn.setAttribute('aria-pressed', String(labelsOn));
}
labelsBtn.addEventListener('click', () => {
  labelsOn = !labelsOn;
  applyLabels();
  paintLabelsBtn();
});

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
  else if (e.key === 'r' || e.key === 'R') resetView();
  else if (e.key === 't' || e.key === 'T') styleBtn.click();
  else if (e.key === ']') toggleAcc('data');
});

/* ---------------- 3D 交互：拼图拖拽/单击旋转 · 勾股数散点点选 ---------------- */

const ray = new THREE.Raycaster();
const ndc = new THREE.Vector2();
const dragPlane = new THREE.Plane(V3(0, 1, 0), -(LIFT + THK));
const planeHit = new THREE.Vector3();
let dragCtx = null;

function setNdc(e) {
  const r = app.renderer.domElement.getBoundingClientRect();
  ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
}
function worldToChart2D(p) { return [p.x, -p.z]; }

const dom = app.renderer.domElement;
dom.addEventListener('pointerdown', (e) => {
  if (activeScene === scenes.puzzle && !pz.done && !pz.demo) {
    setNdc(e);
    ray.setFromCamera(ndc, camera);
    const picks = PZ.pieceMeshes.filter((m) => pz.pieces[m.userData.idx].slot < 0);
    const hits = ray.intersectObjects(picks, false);
    if (hits.length) {
      const mesh = hits[0].object;
      const idx = mesh.userData.idx;
      if (ray.ray.intersectPlane(dragPlane, planeHit)) {
        const [hx, hy] = worldToChart2D(planeHit);
        const pc = pz.pieces[idx];
        dragCtx = { idx, off: [hx - pc.pos[0], hy - pc.pos[1]], moved: false, sx: e.clientX, sy: e.clientY };
        pz.drag = { idx };
        controls.enabled = false;
        dom.setPointerCapture(e.pointerId);
        stage.style.cursor = 'grabbing';
      }
      return;
    }
  }
  if (activeScene === scenes.triples) {
    setNdc(e);
    ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObjects([TP.instPrim, TP.instMult], false);
    if (hits.length) {
      const inst = hits[0].object;
      const list = inst.userData.list;
      const t = list[Math.floor(hits[0].instanceId / 2)];
      if (t) {
        tp.pick = tp.pick && tp.pick.a === t.a && tp.pick.b === t.b && tp.pick.c === t.c ? null : t;
        updTriples();
        triplesHUD();
        controls.enabled = false;
        dom.setPointerCapture(e.pointerId);
        setTimeout(() => { controls.enabled = true; }, 30);
      }
    }
  }
});
dom.addEventListener('pointermove', (e) => {
  if (dragCtx && dragCtx.idx !== undefined) {
    setNdc(e);
    ray.setFromCamera(ndc, camera);
    if (ray.ray.intersectPlane(dragPlane, planeHit)) {
      const [hx, hy] = worldToChart2D(planeHit);
      const pc = pz.pieces[dragCtx.idx];
      pc.pos = [clamp(hx - dragCtx.off[0], -8.2, 9.6), clamp(hy - dragCtx.off[1], -6.4, 6.2)];
    }
    if (Math.hypot(e.clientX - dragCtx.sx, e.clientY - dragCtx.sy) > 6) dragCtx.moved = true;
    return;
  }
  if (activeScene === scenes.puzzle) {
    setNdc(e);
    ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObjects(PZ.pieceMeshes.filter((m) => pz.pieces[m.userData.idx].slot < 0), false);
    const idx = hits.length ? hits[0].object.userData.idx : -1;
    if (idx !== pz.hoverIdx) {
      pz.hoverIdx = idx;
      stage.style.cursor = idx >= 0 ? 'grab' : '';
    }
  } else if (activeScene === scenes.triples && TP.hoverLbl) {
    setNdc(e);
    ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObjects([TP.instPrim, TP.instMult], false);
    if (hits.length) {
      const list = hits[0].object.userData.list;
      const t = list[Math.floor(hits[0].instanceId / 2)];
      if (t) {
        const [wx, wy] = chartToWorld(t.a, t.b);
        TP.hoverLbl.position.set(wx + 0.4, wy + 0.3, TP_WALL_Z + 0.12);
        setLbl(TP.hoverLbl, `(${t.a}, ${t.b}, ${t.c})`, '#ffffff');
        TP.hoverLbl.visible = labelsOn;
        stage.style.cursor = 'pointer';
        return;
      }
    }
    TP.hoverLbl.visible = false;
    stage.style.cursor = '';
  }
});
function endDrag() {
  if (!dragCtx) return;
  const pc = pz.pieces[dragCtx.idx];
  if (!dragCtx.moved) { pzRotate(pc); pzSnapCheck(pc); }
  else pzSnapCheck(pc);
  pzCheckDone();
  puzzleHUD();
  dragCtx = null;
  pz.drag = null;
  controls.enabled = true;
  stage.style.cursor = '';
}
dom.addEventListener('pointerup', endDrag);
dom.addEventListener('pointercancel', endDrag);

/* ================= 章节帧循环 ================= */

app.onFrame((dt) => {
  if (!activeScene || !activeScene.visible) return;
  if (activeScene === scenes.puzzle) {
    updPuzzle(dt);
    puzzleHUD();
  } else if (activeScene === scenes.outin) {
    if (obPs.step(dt)) {
      updOutin();
      /* 滑杆只刷显示不派发 input（onInput 会把 dir 清零掐停播放，同 outinSyncSliders 口径） */
      OB.tSlider?.set(obPs.t);
      const pb = ctl.el.querySelector('[data-play="1"]');
      if (pb) playBtnLabel(pb, obPs, '▶ 出入相补', '↺ 还原');
      outinHUD();
    }
  } else if (activeScene === scenes.euclid) {
    if (euPs.step(dt)) {
      updEuclid();
      EU.tSlider?.set(euPs.t);
      const pb = ctl.el.querySelector('[data-play="1"]');
      if (pb) playBtnLabel(pb, euPs, '▶ 演示', '↺ 还原');
      euclidHUD();
    }
  } else if (activeScene === scenes.more) {
    if (moPs.step(dt)) {
      updMore();
      MO.tSlider?.set(moPs.t);
      const pb = ctl.el.querySelector('[data-play="1"]');
      if (pb) playBtnLabel(pb, moPs, '▶ 演示', '↺ 还原');
      moreHUD();
    }
  } else if (activeScene === scenes.water) {
    if (wtPs.step(dt)) {
      WT.tSlider?.set(wtPs.t);
      const pb = ctl.el.querySelector('[data-play="1"]');
      if (pb) playBtnLabel(pb, wtPs, '▶ 转动', '↺ 转回去');
    }
    updWater(dt);
    waterHUD();
  }
});

/* ---------------- 栏折叠（左右独立 28px 竖条）× 专注模式（双栏同折） ---------------- */

const foldLBtn = document.getElementById('foldLBtn');
const unfoldLBtn = document.getElementById('unfoldLBtn');
const foldRBtn = document.getElementById('foldRBtn');
const unfoldRBtn = document.getElementById('unfoldRBtn');
const railNoL = document.getElementById('railNoL');
const railTitleR = document.getElementById('railTitleR');
const focusBtn = document.getElementById('focusBtn');

const FOLD_KEY = { l: 'pythagoras.foldL', r: 'pythagoras.foldR' };
let foldL = false;
let foldR = false;
let focusSaved = null;

try {
  foldL = localStorage.getItem(FOLD_KEY.l) === '1';
  foldR = localStorage.getItem(FOLD_KEY.r) === '1';
} catch (e) { /* localStorage 不可用时仅本次会话生效 */ }

function applyFold() {
  pythShell.classList.toggle('fold-l', foldL);
  pythShell.classList.toggle('fold-r', foldR);
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
  pythShell.classList.toggle('focus-mode', on);
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

const ACC_KEYS = { lesson: 'pythagoras.accLesson', controls: 'pythagoras.accControls', data: 'pythagoras.accData' };
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
function toggleAcc(name) {
  accClosed[name] = !accClosed[name];
  try { localStorage.setItem(ACC_KEYS[name], accClosed[name] ? '1' : '0'); } catch (e) { /* 忽略 */ }
  applyAcc(name);
}
for (const name of Object.keys(accSecs)) {
  accSecs[name].querySelector('.acc-head').addEventListener('click', () => toggleAcc(name));
  applyAcc(name);
}

/* ============ 启动 ============ */

scene.add(buildBench());
applyStyle(styleName);
paintStyleBtn();
paintLabelsBtn();
setTimeout(() => {
  loader.hide();
  window.__eduSections = { select: selectChapter };
  window.__pythDebug = { app, vfx, scenes, pz, tp, PZ, TP };
  selectChapter(0);
}, 60);
