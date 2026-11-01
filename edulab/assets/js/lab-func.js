/* EduLab · 函数图像实验室（func）— Micro 级 3D 深改
 * 章节：图像变换 / 指数与对数 / 单位圆与三角函数 / 正弦型函数 / 导数的几何意义 / 单调性与极值
 *      / 零点与二分法 / 定积分（拓展）/ 随堂检测
 * 实现：three.js 3D 坐标空间（坐标纸墙 + 轴系 + 曲线放样 TubeGeometry + 发光材质），
 *      曲线沿 CatmullRomCurve3 放样，特征点球体 + 精灵标注，纸面/Studio 双风格。
 * 原版功能块 1:1：8 个教学块 + 随堂检测 + 上一节(←)/下一节(→)/纸面·Studio 风格(T)/重置视角(R)/全屏(F)。
 */
import {
  THREE, clamp, createApp, createControlsPanel, makeHUD, makeLoader,
  makeTextSprite, setSpriteText,
} from './edu-core.js';
import {
  attachVFX, makeStudioEnvironment, makeBackdropTexture, PAL,
  matGlow, matStd,
} from './edu-vfx.js';

/* ---------------- 舞台与工艺接入 ---------------- */

const stage = document.getElementById('stage');
const loader = makeLoader(stage, '正在铺坐标纸…');
const app = createApp({
  container: stage,
  fov: 42, near: 0.1, far: 500,
  cameraPos: [1.0, 2.4, 15.0], target: [0, 0.5, 0],
  minDistance: 2, maxDistance: 60,
  keepBackground: true,
});
const { scene, camera, controls } = app;
const vfx = attachVFX(app, 'illus');
scene.environment = makeStudioEnvironment(app.renderer);

scene.add(new THREE.HemisphereLight(0xd9e8f7, 0x3a4650, 0.66));
const keyLight = new THREE.DirectionalLight(0xfff0d8, 1.15);
keyLight.position.set(-9, 14, 10);
scene.add(keyLight);
const fillLight = new THREE.DirectionalLight(0xdfe8ff, 0.4);
fillLight.position.set(9, 6, -8);
scene.add(fillLight);

const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

/* ================= 纸面 / Studio 双风格（原版 T 键 1:1） ================= */

const STYLES = {
  studio: {
    label: 'Studio 风格',
    bg: () => makeBackdropTexture({ inner: '#1d4050', outer: '#06141c', glow: '#2f6674', glowStrength: 0.4 }),
    grid: 0x2c505e, gridWall: 0x33576b, axis: 0xaec4cd, floor: 0x24404e,
    curveEmissive: 0.5, tubeRough: 0.42,
  },
  paper: {
    label: '纸面风格',
    bg: () => makeBackdropTexture({ inner: '#f4f1e6', outer: '#b9b19c', glow: '#fffdf2', glowStrength: 0.5 }),
    grid: 0xaebfd6, gridWall: 0xc3cfdf, axis: 0x5c6672, floor: 0x8f8a78,
    curveEmissive: 0.1, tubeRough: 0.5,
  },
};
let styleName = 'studio';
try { if (localStorage.getItem('func.style') === 'paper') styleName = 'paper'; } catch (e) { /* 忽略 */ }
const styleRefs = { gridMats: [], sprites: [], curveMats: [] };
let bgTex = null;

function applyStyle(name) {
  styleName = name;
  const st = STYLES[name];
  if (bgTex) bgTex.dispose();
  bgTex = st.bg();
  bgTex.mapping = THREE.EquirectangularReflectionMapping;
  scene.background = bgTex;
  for (const m of styleRefs.gridMats) {
    if (m.userData.kind === 'wall') m.color.set(st.gridWall);
    else if (m.userData.kind === 'floor') m.color.set(st.floor);
    else m.color.set(st.grid);
    if (m.userData.kind === 'axis') m.color.set(st.axis);
  }
  for (const mat of styleRefs.curveMats) mat.emissiveIntensity = st.curveEmissive;
  try { localStorage.setItem('func.style', name); } catch (e) { /* 忽略 */ }
}

/* ================= 工艺基建（曲线放样 / 虚线 / 标注 / 轴系） ================= */

/* 画布贴图（颜色空间 + 各向异性一次配齐） */
function canvasTex(w, h, draw) {
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  draw(cv.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/* 曲线色（同屏 ≤3 强调色纪律：主线 accent、辅线蓝/绿、关键点金、f′ 紫） */
const C = {
  main: 0xe8674a,      // 主曲线（站点强调色）
  blue: 0x5aa2e0,      // 辅助曲线 / 投影
  green: 0x46a84e,     // 辅助曲线 / 增区间
  gold: 0xe39a35,      // 关键特征点
  purple: 0x9a7fe0,    // f′ 曲线
  ghost: 0x8fa3ad,     // 母函数（灰）
};

/* 曲线放样：采样 → 断点分段 → CatmullRomCurve3 → TubeGeometry。
 * 返回 Group（每段一个 Mesh，共享材质），支持 retube() 原地重建。 */
function curveRuns(f, x0, x1, n = 160, yMax = 40) {
  const runs = [];
  let cur = [];
  let prevY = null;
  for (let i = 0; i <= n; i++) {
    const x = x0 + (x1 - x0) * (i / n);
    const y = f(x);
    if (!isFinite(y) || Math.abs(y) > yMax) {
      if (cur.length > 1) runs.push(cur);
      cur = []; prevY = null; continue;
    }
    if (prevY !== null && Math.abs(y - prevY) > ((x1 - x0) / n) * yMax) {
      if (cur.length > 1) runs.push(cur);
      cur = [];
    }
    cur.push(V3(x, y, 0));
    prevY = y;
  }
  if (cur.length > 1) runs.push(cur);
  return runs;
}

function buildTubeGroup(f, x0, x1, opts = {}) {
  const g = new THREE.Group();
  g.userData.tubeOpts = { f, x0, x1, ...opts };
  g.userData.tubeMat = curveMat(opts.color ?? C.main, { emissive: opts.emissive, rough: opts.rough ?? 0.42, opacity: opts.opacity });
  retube(g);
  return g;
}

function retube(g) {
  const o = g.userData.tubeOpts;
  const runs = curveRuns(o.f, o.x0, o.x1, o.seg ?? 150, o.yMax ?? 40);
  for (const child of [...g.children]) {
    child.geometry.dispose();
    g.remove(child);
  }
  const mat = g.userData.tubeMat;
  for (const pts of runs) {
    if (pts.length < 2) continue;
    const curve = new THREE.CatmullRomCurve3(pts);
    const geo = new THREE.TubeGeometry(curve, Math.min(pts.length * 2, 260), o.r ?? 0.045, 10, false);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.userData.isCurve = true;
    g.add(mesh);
  }
}

function curveMat(color, { emissive, rough = 0.42, opacity } = {}) {
  const m = matGlow(color, emissive ?? STYLES[styleName].curveEmissive, { roughness: rough, opacity });
  styleRefs.curveMats.push(m);
  return m;
}

/* 虚线 / 实线段（Line + LineDashedMaterial） */
function lineSeg(a, b, color, opts = {}) {
  const geo = new THREE.BufferGeometry().setFromPoints([V3(...a), V3(...b)]);
  const mat = opts.dashed
    ? new THREE.LineDashedMaterial({ color, dashSize: opts.dash ?? 0.22, gapSize: opts.gap ?? 0.15, transparent: opts.opacity !== undefined, opacity: opts.opacity ?? 1 })
    : new THREE.LineBasicMaterial({ color, transparent: opts.opacity !== undefined, opacity: opts.opacity ?? 1 });
  const ln = new THREE.Line(geo, mat);
  if (opts.dashed) ln.computeLineDistances();
  return ln;
}

function polyline(pts, color, opts = {}) {
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const mat = opts.dashed
    ? new THREE.LineDashedMaterial({ color, dashSize: opts.dash ?? 0.22, gapSize: opts.gap ?? 0.15 })
    : new THREE.LineBasicMaterial({ color });
  const ln = new THREE.Line(geo, mat);
  if (opts.dashed) ln.computeLineDistances();
  return ln;
}

/* 单位圆柱指向 a→b（割线/切线/半径辐条共用） */
const unitCylGeo = new THREE.CylinderGeometry(1, 1, 1, 12, 1, true);
unitCylGeo.translate(0, 0.5, 0);
function orientCyl(mesh, a, b) {
  const dir = V3(b.x - a.x, b.y - a.y, b.z - a.z);
  const len = dir.length() || 1e-6;
  mesh.position.copy(a);
  mesh.scale.set(mesh.userData.r ?? 0.03, len, mesh.userData.r ?? 0.03);
  mesh.quaternion.setFromUnitVectors(V3(0, 1, 0), dir.normalize());
}

function makeDot(color, r = 0.09) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 14), matGlow(color, 0.55, { roughness: 0.3 }));
  styleRefs.curveMats.push(m.material);
  return m;
}

/* 精灵标注（深色芯片底，纸面/Studio 双风格可读） */
function lbl(text, color = '#ffffff', scale = 0.0062) {
  return makeTextSprite(text, { fontSize: 30, color, scale, bg: 'rgba(12,18,26,0.62)' });
}
function setLbl(sprite, text, color = '#ffffff', scale) {
  setSpriteText(sprite, text, { fontSize: 30, color, scale: scale ?? sprite.userData.__scale ?? 0.0062, bg: 'rgba(12,18,26,0.62)' });
}

/* 坐标纸墙 + 地网格 + 轴系（每章一个，材质登记进 styleRefs 换肤） */
function gridMat(color, kind) {
  const m = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.6 });
  m.userData.kind = kind;
  styleRefs.gridMats.push(m);
  return m;
}

function buildWallGrid(g, { x0 = -9.5, x1 = 9.5, y0 = -5.6, y1 = 6.2, z = -1.6, step = 1 } = {}) {
  const pts = [];
  for (let x = Math.ceil(x0); x <= x1; x += step) pts.push(V3(x, y0, z), V3(x, y1, z));
  for (let y = Math.ceil(y0); y <= y1; y += step) pts.push(V3(x0, y, z), V3(x1, y, z));
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const grid = new THREE.LineSegments(geo, gridMat(STYLES[styleName].gridWall, 'wall'));
  g.add(grid);
  return grid;
}

function buildFloorGrid(g, { w = 22, d = 12, y = -4.6, step = 1 } = {}) {
  const pts = [];
  for (let x = -w / 2; x <= w / 2; x += step) pts.push(V3(x, y, -d / 2), V3(x, y, d / 2));
  for (let z = -d / 2; z <= d / 2; z += step) pts.push(V3(-w / 2, y, z), V3(w / 2, y, z));
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const grid = new THREE.LineSegments(geo, gridMat(STYLES[styleName].floor, 'floor'));
  g.add(grid);
  return grid;
}

/* 轴系：圆柱轴 + 锥尖 + 刻度短柱（InstancedMesh）+ 数字精灵 */
function buildAxes(g, { xr = 8.8, yLo = -5.4, yHi = 6.0, xTicks = null, yTicks = null } = {}) {
  const axisMat = gridMat(STYLES[styleName].axis, 'axis');
  const shaftR = 0.026;
  const mk = (a, b) => {
    const m = new THREE.Mesh(unitCylGeo, axisMat);
    m.userData.r = shaftR;
    orientCyl(m, V3(...a), V3(...b));
    g.add(m);
    return m;
  };
  mk([-xr, 0, 0], [xr, 0, 0]);
  mk([0, yLo, 0], [0, yHi, 0]);
  /* 锥尖 */
  const tipGeo = new THREE.ConeGeometry(0.075, 0.24, 12);
  const tipX = new THREE.Mesh(tipGeo, axisMat);
  tipX.rotation.z = -Math.PI / 2; tipX.position.set(xr + 0.1, 0, 0);
  const tipY = new THREE.Mesh(tipGeo, axisMat);
  tipY.position.set(0, yHi + 0.1, 0);
  g.add(tipX, tipY);
  /* 刻度短柱 */
  const tickGeo = new THREE.BoxGeometry(0.028, 0.12, 0.028);
  const xTickVals = (xTicks ?? intTicks(xr)).map((t) => t[0]);
  const yTickVals = (yTicks ?? intTicks((yHi - yLo) / 2)).map((t) => t[0]).filter((v) => v >= yLo && v <= yHi);
  const inst = new THREE.InstancedMesh(tickGeo, axisMat, xTickVals.length + yTickVals.length);
  const dummy = new THREE.Object3D();
  xTickVals.forEach((v, i) => { dummy.position.set(v, 0, 0); dummy.updateMatrix(); inst.setMatrixAt(i, dummy.matrix); });
  yTickVals.forEach((v, i) => { dummy.position.set(0.09, v, 0); dummy.updateMatrix(); inst.setMatrixAt(xTickVals.length + i, dummy.matrix); });
  g.add(inst);
  /* 数字精灵 */
  const tickColor = () => (styleName === 'paper' ? '#4a545e' : '#b9cdd6');
  for (const [v, t] of (xTicks ?? intTicks(xr))) {
    const s = lbl(t, tickColor(), 0.0046);
    s.position.set(v, -0.42, 0);
    g.add(s);
    styleRefs.sprites.push({ s, get: tickColor });
  }
  for (const [v, t] of (yTicks ?? intTicks(Math.min(yHi, 6)))) {
    if (v < yLo || v > yHi) continue;
    const s = lbl(t, tickColor(), 0.0046);
    s.position.set(-0.55, v, 0);
    g.add(s);
    styleRefs.sprites.push({ s, get: tickColor });
  }
}

function intTicks(range) {
  const out = [];
  for (let v = -Math.floor(range); v <= Math.floor(range); v += 2) {
    if (v === 0) continue;
    out.push([v, String(v)]);
  }
  return out;
}

function piTicks(rangePi = 2) {
  const out = [];
  const names = { 0.5: 'π/2', 1: 'π', 1.5: '3π/2', 2: '2π', '-0.5': '-π/2', '-1': '-π', '-1.5': '-3π/2', '-2': '-2π' };
  for (let k = -rangePi * 2; k <= rangePi * 2; k++) {
    if (k === 0) continue;
    const v = k * Math.PI / 2;
    if (names[String(k / 2)]) out.push([v, names[String(k / 2)]]);
  }
  return out;
}

/* ---------------- 右栏读数 HUD ---------------- */

const hudWrap = document.getElementById('lcData');
let hud = null;
function setHUD(rows) {
  if (hud) hud.el.remove();
  hud = makeHUD(hudWrap, rows);
  rows.forEach(([k]) => hud.set(k, '–'));
}
function hset(key, text) { if (hud) hud.set(key, text); }

/* ================= 控制条与章节框架 ================= */

const ctl = createControlsPanel(document.getElementById('controls'));
let activeSectionCleanup = null;
let chapterTick = null;
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

/* ---------------- 通用小件 ---------------- */

const box3 = (w, h, d, mat) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
const cyl3 = (rt, rb, h, mat, seg = 20) => new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);

/* 3D 拖拽（竖直面求交 → 读 x）：导数章拖 x₀ / 指对章拖演示点 */
function makeXDragger(getPickables, onDrag, onEnd) {
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const plane = new THREE.Plane();
  const hit = new THREE.Vector3();
  const camDir = new THREE.Vector3();
  let dragging = false;
  const dom = app.renderer.domElement;
  const setNdc = (e) => {
    const r = dom.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  };
  dom.addEventListener('pointerdown', (e) => {
    const picks = getPickables();
    if (!picks || !picks.length || !picks[0].visible) return;
    setNdc(e);
    ray.setFromCamera(ndc, camera);
    if (!ray.intersectObjects(picks, false).length) return;
    dragging = true;
    controls.enabled = false;
    dom.setPointerCapture(e.pointerId);
    camera.getWorldDirection(camDir);
    camDir.y = 0;
    if (camDir.lengthSq() < 1e-6) camDir.set(0, 0, -1);
    camDir.normalize().negate();
    plane.setFromNormalAndCoplanarPoint(camDir, V3(0, 0, 0));
    stage.style.cursor = 'grabbing';
  });
  dom.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    setNdc(e);
    ray.setFromCamera(ndc, camera);
    if (ray.ray.intersectPlane(plane, hit)) onDrag(hit.x, hit.y);
  });
  const stop = () => {
    if (!dragging) return;
    dragging = false;
    controls.enabled = true;
    stage.style.cursor = '';
    if (onEnd) onEnd();
  };
  dom.addEventListener('pointerup', stop);
  dom.addEventListener('pointercancel', stop);
}

/* ================= 公共函数库（八种母函数，与旧版口径一致） ================= */

function funcPresets() {
  return {
    x2: { label: 'y = x²', f: (x) => x * x, fp: (x) => 2 * x, tex: 'x²' },
    abs: { label: 'y = |x|', f: Math.abs, fp: (x) => (x > 0 ? 1 : x < 0 ? -1 : NaN), tex: '|x|' },
    sqrt: { label: 'y = √x', f: (x) => (x >= 0 ? Math.sqrt(x) : NaN), fp: (x) => (x > 0 ? 1 / (2 * Math.sqrt(x)) : NaN), tex: '√x' },
    x3: { label: 'y = x³', f: (x) => x * x * x, fp: (x) => 3 * x * x, tex: 'x³' },
    inv: { label: 'y = 1/x', f: (x) => 1 / x, fp: (x) => -1 / (x * x), tex: '1/x' },
    sin: { label: 'y = sin x', f: Math.sin, fp: Math.cos, tex: 'sin x' },
    cubic: { label: 'x³−3x', f: (x) => x * x * x - 3 * x, fp: (x) => 3 * x * x - 3, tex: 'x³−3x' },
    quart: { label: 'x⁴−4x²+2', f: (x) => x * x * x * x - 4 * x * x + 2, fp: (x) => 4 * x * x * x - 8 * x, tex: 'x⁴−4x²+2' },
  };
}

/* ================= 章节 1：图像变换 ================= */

const trState = { base: 'x2', a: 1, h: 0, k: 0, ghost: true, animT: 1 };

function transformed(x) {
  const p = funcPresets()[trState.base];
  const y = p.f(x - trState.h);
  if (!isFinite(y)) return NaN;
  const y2 = trState.a >= 0 ? y * trState.a : -y * trState.a; // a<0 兼含翻折
  return y2 + trState.k;
}
function lerpF(x) {
  const t = trState.animT;
  const p = funcPresets()[trState.base];
  const y0 = p.f(x);
  const y1 = transformed(x);
  if (!isFinite(y0)) return y1;
  return y0 + (y1 - y0) * t;
}

function describeTransform() {
  const parts = [];
  if (Math.abs(trState.h) > 1e-9) parts.push(trState.h > 0 ? `右移 ${trState.h.toFixed(1)}` : `左移 ${(-trState.h).toFixed(1)}`);
  if (Math.abs(trState.k) > 1e-9) parts.push(trState.k > 0 ? `上移 ${trState.k.toFixed(1)}` : `下移 ${(-trState.k).toFixed(1)}`);
  if (Math.abs(Math.abs(trState.a) - 1) > 1e-9) parts.push(Math.abs(trState.a) > 1 ? `纵向拉伸 ${Math.abs(trState.a).toFixed(1)}×` : `纵向压缩 ${Math.abs(trState.a).toFixed(1)}×`);
  if (trState.a < 0) parts.push('x 轴翻折');
  return parts.join(' · ') || '未变换（a=1, h=0, k=0）';
}

function buildTransform(g) {
  buildWallGrid(g);
  buildFloorGrid(g);
  buildAxes(g);
  TR.ghost = buildTubeGroup(funcPresets().x2.f, -7.5, 7.5, { color: C.ghost, r: 0.03, emissive: 0.3 });
  g.add(TR.ghost);
  TR.main = buildTubeGroup(lerpF, -7.5, 7.5, { color: C.main, r: 0.055 });
  g.add(TR.main);
  const title = lbl('y = a·f(x−h) + k', '#ffffff', 0.007);
  title.position.set(0, 6.6, 0);
  g.add(title);
  TR.desc = lbl('', '#ffd9a8', 0.0058);
  TR.desc.position.set(0, 5.7, 0);
  g.add(TR.desc);
  const baseLbl = lbl('f(x) = x²', '#c3d2da', 0.0055);
  baseLbl.position.set(-6.3, 4.6, 0);
  g.add(baseLbl);
  TR.baseLbl = baseLbl;
}

const TR = {};
function updTransform() {
  const p = funcPresets()[trState.base];
  TR.ghost.visible = trState.ghost;
  TR.ghost.userData.tubeOpts.f = p.f;
  retube(TR.ghost);
  TR.main.userData.tubeOpts.f = lerpF;
  retube(TR.main);
  setLbl(TR.desc, describeTransform(), '#ffd9a8');
  setLbl(TR.baseLbl, 'f(x) = ' + p.tex, '#c3d2da');
  hset('expr', `y = ${trState.a.toFixed(1)}·f(x−${trState.h.toFixed(1)}) + ${trState.k.toFixed(1)}`);
  hset('base', 'f(x) = ' + p.tex);
  hset('desc', describeTransform());
}

function transformCtl() {
  ctl.clear();
  const baseNames = Object.keys(funcPresets());
  ctl.seg({
    options: baseNames.map((k) => ({ label: funcPresets()[k].label.replace('y = ', ''), value: k })),
    value: trState.base,
    onChange: (v) => { trState.base = v; trState.animT = 0; updTransform(); },
  });
  ctl.sep();
  ctl.slider({ label: 'a', min: -3, max: 3, step: 0.1, value: trState.a, fmt: (v) => v.toFixed(1), onInput: (v) => { trState.a = v; trState.animT = 0; updTransform(); } });
  ctl.slider({ label: 'h', min: -5, max: 5, step: 0.1, value: trState.h, fmt: (v) => v.toFixed(1), onInput: (v) => { trState.h = v; trState.animT = 0; updTransform(); } });
  ctl.slider({ label: 'k', min: -5, max: 5, step: 0.1, value: trState.k, fmt: (v) => v.toFixed(1), onInput: (v) => { trState.k = v; trState.animT = 0; updTransform(); } });
  ctl.sep();
  ctl.toggle({ label: '母函数', value: trState.ghost, onChange: (v) => { trState.ghost = v; } });
  ctl.button({ label: '▶ 动画演示（母函数 → 变换）', onClick() { trState.animT = 0; } });
  setHUD([['expr', '解析式'], ['base', '母函数'], ['desc', '当前变换']]);
  updTransform();
}

/* ================= 章节 2：指数与对数 ================= */

const exState = { b: 2, t: 0, showMirror: true, anim: false, px: 1 };
const EX = {};

function buildExpln(g) {
  buildWallGrid(g);
  buildFloorGrid(g);
  buildAxes(g, { xr: 8.2, yLo: -5.4, yHi: 8.4 });
  g.add(buildTubeGroup((x) => Math.pow(exState.b, x), -3.2, 2.6, { color: C.blue, r: 0.05 }));
  /* 底数变化时重建：保存引用 */
  EX.exp = g.children[g.children.length - 1];
  EX.log = buildTubeGroup((x) => (x > 0 ? Math.log(x) / Math.log(exState.b) : NaN), 0.045, 8.0, { color: C.green, r: 0.05 });
  g.add(EX.log);
  EX.mirror = polyline([V3(-5.4, -5.4, 0), V3(6.4, 6.4, 0)], C.gold, { dashed: true, dash: 0.26, gap: 0.18 });
  g.add(EX.mirror);
  const mLbl = lbl('y = x', '#ffd9a8', 0.0055);
  mLbl.position.set(4.7, 6.0, 0);
  g.add(mLbl);
  EX.pDot = makeDot(C.blue, 0.11);
  EX.p2Dot = makeDot(C.green, 0.11);
  EX.link = lineSeg([0, 0, 0], [0, 0, 0], 0x9fb4c4, { dashed: true, dash: 0.14, gap: 0.12 });
  EX.pLbl = lbl('', '#9cd2ff', 0.0056);
  EX.p2Lbl = lbl('', '#a8e0b8', 0.0056);
  g.add(EX.pDot, EX.p2Dot, EX.link, EX.pLbl, EX.p2Lbl);
  const fLbl = lbl('y = bˣ', '#9cd2ff', 0.006);
  fLbl.position.set(-2.6, 6.6, 0);
  const gLbl = lbl('y = log_b x', '#a8e0b8', 0.006);
  gLbl.position.set(6.2, 1.2, 0);
  EX.fLbl = fLbl; EX.gLbl = gLbl;
  g.add(fLbl, gLbl);
}

function updExpln() {
  const b = exState.b;
  EX.exp.userData.tubeOpts.f = (x) => Math.pow(b, x);
  retube(EX.exp);
  EX.log.userData.tubeOpts.f = (x) => (x > 0 ? Math.log(x) / Math.log(b) : NaN);
  retube(EX.log);
  EX.mirror.visible = exState.showMirror;
  const x = exState.px;
  const y = Math.pow(b, x);
  const show = isFinite(y) && Math.abs(y) < 30;
  EX.pDot.visible = EX.p2Dot.visible = EX.link.visible = EX.pLbl.visible = EX.p2Lbl.visible = show;
  if (show) {
    EX.pDot.position.set(x, y, 0);
    EX.p2Dot.position.set(y, x, 0);
    EX.link.geometry.setFromPoints([V3(x, y, 0), V3(y, x, 0)]);
    EX.link.computeLineDistances();
    setLbl(EX.pLbl, `P(${x.toFixed(2)}, ${y.toFixed(2)})`, '#9cd2ff');
    EX.pLbl.position.set(x, y + 0.55, 0);
    setLbl(EX.p2Lbl, `P′(${y.toFixed(2)}, ${x.toFixed(2)})`, '#a8e0b8');
    EX.p2Lbl.position.set(y, x - 0.62, 0);
  }
  setLbl(EX.fLbl, `y = ${b.toFixed(1)}ˣ`, '#9cd2ff');
  const sub = (s) => String(s).replace(/[0-9.]/g, (c) => ({ '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉', '.': '·' }[c]));
  setLbl(EX.gLbl, `y = log${sub(b.toFixed(1))} x`, '#a8e0b8');
  hset('b', `底数 b = ${b.toFixed(1)}`);
  hset('pass', `b⁰ = 1，log_b 1 = 0（两曲线都过定点）`);
  hset('mirror', show ? `P 与 P′ 关于 y = x 对称` : '演示点超出视野');
}

function explnCtl() {
  ctl.clear();
  ctl.slider({ label: '底数 b', min: 1.2, max: 6, step: 0.1, value: exState.b, fmt: (v) => v.toFixed(1), onInput: (v) => { exState.b = v; updExpln(); } });
  ctl.slider({ label: '演示点 x', min: -2.5, max: 2.5, step: 0.05, value: exState.px, fmt: (v) => v.toFixed(2), onInput: (v) => { exState.px = v; exState.anim = false; updExpln(); } });
  ctl.toggle({ label: '对称轴 y=x', value: exState.showMirror, onChange: (v) => { exState.showMirror = v; updExpln(); } });
  ctl.button({ label: '▶ 镜像点动画', onClick() { exState.anim = !exState.anim; } });
  ctl.sep();
  ctl.button({ label: '✋ 也可直接拖动蓝色演示点', onClick() { } });
  setHUD([['b', '底数'], ['pass', '定点'], ['mirror', '镜像关系']]);
  updExpln();
}

/* ================= 章节 3：单位圆与三角函数 ================= */

const ucState = { theta: 0.8, playing: true, speed: 0.8, showCos: false, showFive: false };
const UC = {};
const UC_CX = -3.4;           // 单位圆圆心 x
const UC_WX0 = -0.2;          // 波形起点 x（θ=0）

function buildUnit(g) {
  buildWallGrid(g);
  buildFloorGrid(g);
  buildAxes(g, {
    xr: 7.6, yLo: -2.6, yHi: 3.4,
    xTicks: piTicks(2),
    yTicks: [[-1, '-1'], [1, '1'], [2, '2'], [-2, '-2']],
  });
  /* 单位圆：厚管放样（竖立圆环） */
  {
    const pts = [];
    for (let i = 0; i <= 120; i++) {
      const a = (i / 120) * Math.PI * 2;
      pts.push(V3(UC_CX + Math.cos(a), Math.sin(a), 0));
    }
    const curve = new THREE.CatmullRomCurve3(pts, true);
    g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 140, 0.04, 10, true), curveMat(C.ghost, { emissive: 0.28 })));
  }
  UC.spoke = new THREE.Mesh(unitCylGeo, matStd(0xdfe4ee, { roughness: 0.35 }));
  UC.spoke.userData.r = 0.024;
  g.add(UC.spoke);
  UC.legSin = new THREE.Mesh(unitCylGeo, curveMat(C.blue, { emissive: 0.9 }));
  UC.legSin.userData.r = 0.03;
  UC.legCos = new THREE.Mesh(unitCylGeo, curveMat(C.green, { emissive: 0.9 }));
  UC.legCos.userData.r = 0.03;
  g.add(UC.legSin, UC.legCos);
  UC.pDot = makeDot(C.main, 0.12);
  g.add(UC.pDot);
  /* 右侧波形：sin 主线 + 可选 cos 虚管 */
  UC.wave = buildTubeGroup(Math.sin, UC_WX0, UC_WX0 + Math.PI * 2, { color: C.blue, r: 0.05 });
  g.add(UC.wave);
  UC.waveCos = buildTubeGroup(Math.cos, UC_WX0, UC_WX0 + Math.PI * 2, { color: C.green, r: 0.035 });
  UC.waveCos.visible = false;
  g.add(UC.waveCos);
  /* θ 扫描虚线 + 波形动点 */
  UC.scan = lineSeg([0, 0, 0], [0, 0, 0], 0x8fa3ad, { dashed: true, dash: 0.12, gap: 0.1 });
  g.add(UC.scan);
  UC.wDot = makeDot(C.blue, 0.1);
  UC.wDotCos = makeDot(C.green, 0.085);
  g.add(UC.wDot, UC.wDotCos);
  /* 五点法标记（金色小球 + 标签） */
  UC.five = new THREE.Group();
  const five = [[0, '(0,0)'], [Math.PI / 2, '(π/2,1)'], [Math.PI, '(π,0)'], [Math.PI * 1.5, '(3π/2,−1)'], [Math.PI * 2, '(2π,0)']];
  five.forEach(([t, name]) => {
    const d = makeDot(C.gold, 0.075);
    d.position.set(UC_WX0 + t, Math.sin(t), 0);
    const s = lbl(name, '#ffd9a8', 0.0046);
    s.position.set(UC_WX0 + t, Math.sin(t) + (Math.sin(t) >= 0 ? 0.38 : -0.38), 0);
    UC.five.add(d, s);
  });
  UC.five.visible = false;
  g.add(UC.five);
  const title = lbl('单位圆（左）→ 正弦曲线（右）', '#ffffff', 0.006);
  title.position.set(0.6, 4.4, 0);
  g.add(title);
  UC.thetaLbl = lbl('', '#ffd9a8', 0.0056);
  UC.thetaLbl.position.set(UC_CX, 2.1, 0);
  g.add(UC.thetaLbl);
}

function updUnit() {
  const th = ucState.theta % (Math.PI * 2);
  const px = Math.cos(th), py = Math.sin(th);
  const P = V3(UC_CX + px, py, 0);
  const O = V3(UC_CX, 0, 0);
  UC.spoke.visible = true;
  orientCyl(UC.spoke, O, P);
  /* sin 投影腿：P → (Px, 0)；cos 投影腿：P → (Ox, Py) */
  orientCyl(UC.legSin, P, V3(P.x, 0, 0));
  orientCyl(UC.legCos, P, V3(O.x, P.y, 0));
  UC.pDot.position.copy(P);
  UC.waveCos.visible = ucState.showCos;
  /* θ 扫描线：波形上 (θ, 0)→(θ, sinθ) */
  const wx = UC_WX0 + th;
  UC.scan.geometry.setFromPoints([V3(wx, 0, 0), V3(wx, py, 0)]);
  UC.scan.computeLineDistances();
  UC.wDot.position.set(wx, py, 0);
  UC.wDotCos.visible = ucState.showCos;
  UC.wDotCos.position.set(wx, px, 0);
  UC.five.visible = ucState.showFive;
  setLbl(UC.thetaLbl, `θ = ${(th / Math.PI).toFixed(2)}π`, '#ffd9a8');
  hset('sin', `sin θ = ${py.toFixed(3)}`);
  hset('cos', `cos θ = ${px.toFixed(3)}`);
  hset('tan', Math.abs(px) < 0.02 ? 'tan θ 不存在' : `tan θ = ${(py / px).toFixed(3)}`);
}

function unitCtl() {
  ctl.clear();
  const playBtn = ctl.button({
    label: ucState.playing ? '⏸ 暂停' : '▶ 播放',
    onClick() {
      ucState.playing = !ucState.playing;
      playBtn.textContent = ucState.playing ? '⏸ 暂停' : '▶ 播放';
    },
  });
  ctl.slider({ label: '速度', min: 0.2, max: 2.5, step: 0.1, value: ucState.speed, fmt: (v) => v.toFixed(1) + '×', onInput: (v) => { ucState.speed = v; } });
  ctl.sep();
  ctl.toggle({ label: '余弦曲线', value: ucState.showCos, onChange: (v) => { ucState.showCos = v; updUnit(); } });
  ctl.toggle({ label: '五点法', value: ucState.showFive, onChange: (v) => { ucState.showFive = v; updUnit(); } });
  setHUD([['sin', '正弦'], ['cos', '余弦'], ['tan', '正切']]);
  updUnit();
}

/* ================= 章节 4：正弦型函数 ================= */

const sfState = { A: 1, w: 1, phi: 0, k: 0, ghost: true, phaseAnim: false };
const SF = {};
const sineF = () => (x) => sfState.A * Math.sin(sfState.w * x + sfState.phi) + sfState.k;

function buildSine(g) {
  buildWallGrid(g);
  buildFloorGrid(g);
  buildAxes(g, { xr: 8.8, yLo: -4.6, yHi: 5.4, xTicks: piTicks(2), yTicks: [[-2, '-2'], [2, '2'], [4, '4'], [-4, '-4']] });
  SF.ghost = buildTubeGroup(Math.sin, -8.5, 8.5, { color: C.ghost, r: 0.03, emissive: 0.3 });
  g.add(SF.ghost);
  SF.main = buildTubeGroup(sineF(), -8.5, 8.5, { color: C.main, r: 0.055 });
  g.add(SF.main);
  /* 值域带（半透明面 + 上下边界虚线） */
  SF.band = new THREE.Mesh(new THREE.PlaneGeometry(17.4, 2), new THREE.MeshBasicMaterial({
    color: C.main, transparent: true, opacity: 0.06, side: THREE.DoubleSide, depthWrite: false,
  }));
  g.add(SF.band);
  SF.bTop = lineSeg([-8.7, 1, 0], [8.7, 1, 0], C.main, { dashed: true, dash: 0.2, gap: 0.16, opacity: 0.55 });
  SF.bBot = lineSeg([-8.7, -1, 0], [8.7, -1, 0], C.main, { dashed: true, dash: 0.2, gap: 0.16, opacity: 0.55 });
  g.add(SF.bTop, SF.bBot);
  /* 起点 (−φ/ω, k) 金球 + 公式精灵 */
  SF.start = makeDot(C.gold, 0.11);
  g.add(SF.start);
  SF.startLbl = lbl('', '#ffd9a8', 0.0054);
  g.add(SF.startLbl);
  SF.formula = lbl('', '#ffffff', 0.0068);
  SF.formula.position.set(0, 5.9, 0);
  g.add(SF.formula);
  SF.period = lbl('', '#c3d2da', 0.0056);
  SF.period.position.set(3.9, 5.0, 0);
  g.add(SF.period);
}

function updSine() {
  const { A, w, phi, k } = sfState;
  SF.ghost.visible = sfState.ghost;
  retube(SF.main);
  SF.main.userData.tubeOpts.f = sineF();
  retube(SF.main);
  SF.band.scale.y = Math.max(A, 0.05);
  SF.band.position.set(0, k, 0);
  SF.bTop.geometry.setFromPoints([V3(-8.7, k + A, 0), V3(8.7, k + A, 0)]);
  SF.bBot.geometry.setFromPoints([V3(-8.7, k - A, 0), V3(8.7, k - A, 0)]);
  const sx = -phi / w;
  SF.start.position.set(sx, k, 0);
  setLbl(SF.startLbl, `起点 (−φ/ω, k) = (${sx.toFixed(2)}, ${k.toFixed(1)})`, '#ffd9a8');
  SF.startLbl.position.set(sx, k - A - 0.55, 0);
  setLbl(SF.formula, `y = ${A.toFixed(1)}·sin(${w.toFixed(2)}x + ${(phi / Math.PI).toFixed(2)}π) + ${k.toFixed(1)}`, '#ffffff');
  setLbl(SF.period, `周期 T = 2π/ω = ${(Math.PI * 2 / w).toFixed(2)}`, '#c3d2da');
  hset('T', `T = 2π/ω = ${(Math.PI * 2 / w).toFixed(2)}`);
  hset('range', `值域 [${(k - A).toFixed(1)}, ${(k + A).toFixed(1)}]`);
  hset('shift', `初相左移 φ/ω = ${(phi / w).toFixed(2)}`);
}

function sineCtl() {
  ctl.clear();
  ctl.slider({ label: 'A 振幅', min: 0.2, max: 3, step: 0.1, value: sfState.A, fmt: (v) => v.toFixed(1), onInput: (v) => { sfState.A = v; updSine(); } });
  ctl.slider({ label: 'ω 频率', min: 0.25, max: 4, step: 0.05, value: sfState.w, fmt: (v) => v.toFixed(2), onInput: (v) => { sfState.w = v; updSine(); } });
  ctl.slider({ label: 'φ 初相', min: 0, max: Math.PI * 2, step: 0.05, value: sfState.phi, fmt: (v) => (v / Math.PI).toFixed(2) + 'π', onInput: (v) => { sfState.phi = v; updSine(); } });
  ctl.slider({ label: 'k 平移', min: -2, max: 2, step: 0.1, value: sfState.k, fmt: (v) => v.toFixed(1), onInput: (v) => { sfState.k = v; updSine(); } });
  ctl.sep();
  ctl.toggle({ label: 'sin x 对照', value: sfState.ghost, onChange: (v) => { sfState.ghost = v; updSine(); } });
  ctl.toggle({ label: '相位滚动', value: sfState.phaseAnim, onChange: (v) => { sfState.phaseAnim = v; } });
  setHUD([['T', '周期'], ['range', '值域'], ['shift', '平移']]);
  updSine();
}

/* ================= 章节 5：导数的几何意义 ================= */

const dvState = { fn: 'cubic', x0: 1, h: 1.2, showDeriv: false, anim: false, scan: 0 };
const DV = {};

function buildDeriv(g) {
  buildWallGrid(g);
  buildFloorGrid(g);
  buildAxes(g, { xr: 8.2, yLo: -5.4, yHi: 7.0 });
  DV.curve = buildTubeGroup(funcPresets().cubic.f, -4.8, 4.8, { color: C.main, r: 0.05 });
  g.add(DV.curve);
  /* 割线（蓝）与切线（紫细） */
  DV.secant = new THREE.Mesh(unitCylGeo, curveMat(C.blue, { emissive: 0.8 }));
  DV.secant.userData.r = 0.03;
  DV.tangent = new THREE.Mesh(unitCylGeo, curveMat(C.purple, { emissive: 0.65 }));
  DV.tangent.userData.r = 0.022;
  g.add(DV.secant, DV.tangent);
  DV.pDot = makeDot(0xf2efe6, 0.12);
  DV.qDot = makeDot(C.blue, 0.1);
  g.add(DV.pDot, DV.qDot);
  DV.pLbl = lbl('P', '#ffffff', 0.006);
  DV.qLbl = lbl('Q', '#9cd2ff', 0.006);
  DV.slopeLbl = lbl('', '#9cd2ff', 0.0056);
  g.add(DV.pLbl, DV.qLbl, DV.slopeLbl);
  /* 导函数（紫虚管，用细管+低 emissive 区分） */
  DV.deriv = buildTubeGroup(funcPresets().cubic.fp, -4.8, 4.8, { color: C.purple, r: 0.032 });
  DV.deriv.visible = false;
  g.add(DV.deriv);
  /* 扫描点 + 轨迹（Points 拖尾） */
  DV.scanDot = makeDot(C.gold, 0.09);
  DV.scanDot.visible = false;
  g.add(DV.scanDot);
  const trailGeo = new THREE.BufferGeometry();
  trailGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(260 * 3), 3));
  trailGeo.setDrawRange(0, 0);
  DV.trail = new THREE.Points(trailGeo, new THREE.PointsMaterial({ color: C.purple, size: 0.09, transparent: true, opacity: 0.55 }));
  g.add(DV.trail);
  DV.trailN = 0;
}

function updDeriv() {
  const presets = funcPresets();
  const { f, fp } = presets[dvState.fn];
  DV.curve.userData.tubeOpts.f = f;
  retube(DV.curve);
  DV.deriv.userData.tubeOpts.f = fp;
  retube(DV.deriv);
  DV.deriv.visible = dvState.showDeriv;
  const x0 = dvState.x0, h = Math.max(0.01, dvState.h);
  const y0 = f(x0);
  const slope = (f(x0 + h) - y0) / h;
  const trueSlope = fp(x0);
  const P = V3(x0, y0, 0);
  const Q = V3(x0 + h, f(x0 + h), 0);
  DV.pDot.position.copy(P);
  DV.qDot.position.copy(Q);
  DV.qDot.visible = h > 0.015;
  /* 割线延长 ±5 */
  orientCyl(DV.secant, V3(x0 - 5, y0 - 5 * slope, 0), V3(x0 + 5, y0 + 5 * slope, 0));
  orientCyl(DV.tangent, V3(x0 - 5, y0 - 5 * trueSlope, 0), V3(x0 + 5, y0 + 5 * trueSlope, 0));
  DV.pLbl.position.set(x0 - 0.35, y0 + 0.4, 0);
  DV.qLbl.position.set(Q.x + 0.35, Q.y + 0.3, 0);
  DV.qLbl.visible = h > 0.015;
  DV.slopeLbl.position.set(x0 + 1.9, y0 + 1.5, 0);
  setLbl(DV.slopeLbl, h <= 0.05 ? `割线→切线，f′(x₀) = ${isFinite(trueSlope) ? trueSlope.toFixed(3) : '不存在'}` : `割线斜率 = ${slope.toFixed(3)}`, h <= 0.05 ? '#c9b2f5' : '#9cd2ff');
  hset('h', `h = ${h.toFixed(2)}`);
  hset('sec', `割线斜率 ${slope.toFixed(3)}`);
  hset('der', `f′(x₀) = ${isFinite(trueSlope) ? trueSlope.toFixed(3) : '不存在'}`);
}

function derivCtl() {
  ctl.clear();
  const presets = ['cubic', 'x2', 'sin', 'quart'];
  ctl.seg({
    options: presets.map((k) => ({ label: funcPresets()[k].label.replace('y = ', ''), value: k })),
    value: dvState.fn,
    onChange: (v) => { dvState.fn = v; dvState.trailN = 0; dvState.scan = 0; updDeriv(); },
  });
  ctl.sep();
  ctl.slider({ label: 'x₀', min: -4.5, max: 4.5, step: 0.05, value: dvState.x0, fmt: (v) => v.toFixed(2), onInput: (v) => { dvState.x0 = v; dvState.anim = false; dvState.trailN = 0; updDeriv(); } });
  ctl.slider({ label: 'h', min: 0.01, max: 2, step: 0.01, value: dvState.h, fmt: (v) => v.toFixed(2), onInput: (v) => { dvState.h = v; dvState.anim = false; dvState.trailN = 0; updDeriv(); } });
  ctl.sep();
  ctl.button({ label: '▶ 动画逼近（h → 0）', onClick() { dvState.anim = !dvState.anim; } });
  ctl.toggle({ label: '导函数曲线', value: dvState.showDeriv, onChange: (v) => { dvState.showDeriv = v; dvState.trailN = 0; updDeriv(); } });
  ctl.sep();
  ctl.button({ label: '✋ 直接拖动白点 P 改 x₀', onClick() { } });
  setHUD([['h', '步长'], ['sec', '割线'], ['der', '导数']]);
  updDeriv();
}

/* ================= 章节 6：单调性与极值 ================= */

const moState = { fn: 'quart', showDeriv: true };
const MO = {};

function findCrits(fp, x0 = -6.5, x1 = 6.5) {
  const crits = [];
  const N = 420;
  let px = x0, py = fp(x0);
  for (let i = 1; i <= N; i++) {
    const x = x0 + (x1 - x0) * (i / N);
    const y = fp(x);
    if (isFinite(py) && isFinite(y)) {
      if (py === 0) crits.push(x);
      else if (py * y < 0) {
        let a = px, b = x;
        for (let k = 0; k < 40; k++) {
          const m = (a + b) / 2;
          (fp(a) * fp(m) <= 0) ? b = m : a = m;
        }
        crits.push((a + b) / 2);
      }
    }
    px = x; py = y;
  }
  return crits;
}

function buildMono(g) {
  buildWallGrid(g);
  buildFloorGrid(g);
  buildAxes(g, { xr: 7.6, yLo: -5.4, yHi: 7.4 });
  /* 增/减区间色带（贴坐标纸墙前面的薄地板条，逐段重建） */
  MO.bandGroup = new THREE.Group();
  g.add(MO.bandGroup);
  const leg1 = lbl('橙带 f′>0 增', '#ffc9b4', 0.0048); leg1.position.set(0.6, -5.15, 0);
  const leg2 = lbl('蓝带 f′<0 减', '#a8cdf0', 0.0048); leg2.position.set(3.2, -5.15, 0);
  g.add(leg1, leg2);
  MO.curve = buildTubeGroup(funcPresets().quart.f, -6.2, 6.2, { color: C.main, r: 0.05 });
  g.add(MO.curve);
  MO.deriv = buildTubeGroup(funcPresets().quart.fp, -6.2, 6.2, { color: C.purple, r: 0.032 });
  g.add(MO.deriv);
  MO.extGroup = new THREE.Group();
  g.add(MO.extGroup);
}

function updMono() {
  const presets = funcPresets();
  const { f, fp } = presets[moState.fn];
  MO.curve.userData.tubeOpts.f = f;
  retube(MO.curve);
  MO.deriv.userData.tubeOpts.f = fp;
  retube(MO.deriv);
  MO.deriv.visible = moState.showDeriv;
  /* 符号区间 → 色带排布（采样 f′ 符号，同号连续段逐段成带） */
  const segs = [];
  let segStart = null, segSign = 0;
  for (let x = -6.2; x <= 6.21; x += 0.05) {
    const d = fp(x);
    const s = !isFinite(d) ? 0 : (d > 0 ? 1 : -1);
    if (s !== segSign) {
      if (segSign !== 0 && segStart !== null) segs.push({ a: segStart, b: x, sign: segSign });
      segStart = x; segSign = s;
    }
  }
  if (segSign !== 0 && segStart !== null) segs.push({ a: segStart, b: 6.2, sign: segSign });
  for (const c of [...MO.bandGroup.children]) {
    c.geometry.dispose();
    c.material.dispose();
    MO.bandGroup.remove(c);
  }
  for (const seg of segs) {
    const band = box3(Math.max(seg.b - seg.a, 0.02), 0.06, 0.9, new THREE.MeshBasicMaterial({
      color: seg.sign > 0 ? C.main : C.blue, transparent: true, opacity: 0.16, depthWrite: false,
    }));
    band.position.set((seg.a + seg.b) / 2, -4.55, 0);
    MO.bandGroup.add(band);
  }
  /* 极值点金球 + 标签 */
  for (const c of [...MO.extGroup.children]) {
    if (c.geometry) c.geometry.dispose();
    MO.extGroup.remove(c);
  }
  const crits = findCrits(fp);
  let extN = 0;
  crits.forEach((x) => {
    const s1 = fp(x - 0.01), s2 = fp(x + 0.01);
    const isPeak = s1 > 0 && s2 < 0;
    const isValley = s1 < 0 && s2 > 0;
    if (!isPeak && !isValley) return;
    extN++;
    const y = f(x);
    const d = makeDot(C.gold, 0.1);
    d.position.set(x, y, 0);
    const s = lbl(`${isPeak ? '极大' : '极小'} f(${x.toFixed(2)})=${y.toFixed(2)}`, '#ffd9a8', 0.0048);
    s.position.set(x, y + (isPeak ? 0.55 : -0.62), 0);
    MO.extGroup.add(d, s);
  });
  hset('crit', `f′ 零点：${crits.length} 个`);
  hset('ext', `极值点：${extN} 个`);
  hset('rule', moState.showDeriv ? '紫虚管 = f′(x)' : '未显示 f′');
}

function monoCtl() {
  ctl.clear();
  ctl.seg({
    options: [
      { label: 'x³−3x', value: 'cubic' },
      { label: 'x⁴−4x²+2', value: 'quart' },
      { label: 'sin x', value: 'sin' },
      { label: 'x³', value: 'x3' },
    ],
    value: moState.fn,
    onChange: (v) => { moState.fn = v; updMono(); },
  });
  ctl.sep();
  ctl.toggle({ label: '显示 f′', value: moState.showDeriv, onChange: (v) => { moState.showDeriv = v; updMono(); } });
  setHUD([['crit', '临界点'], ['ext', '极值点'], ['rule', '图例']]);
  updMono();
}

/* ================= 章节 7：零点与二分法 ================= */

const biState = { playing: false, idx: 0, tol: 0.05, acc: 0 };

function bisectInit() {
  const f = (x) => x * x * x - x - 2;   // 根 ≈ 1.5214
  const steps = [];
  let a = 1, b = 2;
  for (let i = 0; i < 24; i++) {
    const m = (a + b) / 2, fm = f(m);
    steps.push({ n: i + 1, a, b, m, fm, fa: f(a), fb: f(b) });
    if (f(a) * fm <= 0) b = m; else a = m;
  }
  return { f, steps };
}
const bisectData = bisectInit();
const BI = {};

function buildBisect(g) {
  buildWallGrid(g);
  buildFloorGrid(g);
  buildAxes(g, { xr: 5.2, yLo: -3.6, yHi: 4.6, xTicks: [[-2, '-2'], [-1, '-1'], [1, '1'], [2, '2'], [3, '3'], [4, '4'], [5, '5']] });
  BI.curve = buildTubeGroup(bisectData.f, -2.6, 3.4, { color: C.main, r: 0.05 });
  g.add(BI.curve);
  /* 保留区间底带（绿色半透明板，随步收缩） */
  BI.band = box3(1, 0.05, 1.6, new THREE.MeshBasicMaterial({ color: C.green, transparent: true, opacity: 0.22, depthWrite: false }));
  BI.band.position.y = -3.5;
  g.add(BI.band);
  /* a / b / c 三根立柱（小球 + 竖杆） */
  BI.pins = {};
  for (const key of ['a', 'b', 'c']) {
    const col = key === 'c' ? C.blue : C.green;
    const rod = new THREE.Mesh(unitCylGeo, curveMat(col, { emissive: 0.7 }));
    rod.userData.r = 0.02;
    const dot = makeDot(col, 0.09);
    const s = lbl(key, key === 'c' ? '#9cd2ff' : '#a8e0b8', 0.006);
    BI.pins[key] = { rod, dot, s };
    g.add(rod, dot, s);
  }
  BI.cLbl = lbl('', '#9cd2ff', 0.005);
  g.add(BI.cLbl);
  const title = lbl('f(x) = x³ − x − 2（零点约 1.5214）', '#ffffff', 0.0062);
  title.position.set(0.6, 4.0, 0);
  g.add(title);
}

function updBi() {
  const st = bisectData.steps[biState.idx];
  BI.band.scale.x = Math.max(st.b - st.a, 0.001);
  BI.band.position.x = (st.a + st.b) / 2;
  const place = (key, x, y) => {
    const p = BI.pins[key];
    p.rod.visible = p.dot.visible = p.s.visible = true;
    orientCyl(p.rod, V3(x, 0, 0), V3(x, y, 0));
    p.dot.position.set(x, y, 0);
    p.s.position.set(x, y + 0.42, 0);
  };
  place('a', st.a, bisectData.f(st.a));
  place('b', st.b, bisectData.f(st.b));
  place('c', st.m, bisectData.f(st.m));
  BI.cLbl.position.set(st.m, bisectData.f(st.m) + 0.9, 0);
  setLbl(BI.cLbl, `c=${st.m.toFixed(5)}  f(c)=${st.fm.toFixed(4)}`, '#9cd2ff');
  const err = (st.b - st.a) / 2 ** st.n;
  hset('n', `第 ${st.n} 次二分`);
  hset('ab', `区间 [${st.a.toFixed(5)}, ${st.b.toFixed(5)}]`);
  hset('w', `宽度 ${(st.b - st.a).toFixed(5)}`);
  hset('c', `c = ${st.m.toFixed(5)}，f(c) = ${st.fm.toFixed(4)}`);
  hset('keep', `f(c)${st.fm > 0 ? '>' : '<'}0 → 保留${st.fm * st.fa <= 0 ? ' [a,c]' : ' [c,b]'}`);
  hset('err', `误差 ≤ ${err < 1e-4 ? '<0.0001' : err.toFixed(5)}`);
}

function bisectCtl() {
  ctl.clear();
  ctl.button({ label: '下一步', onClick() { biState.idx = Math.min(biState.idx + 1, bisectData.steps.length - 1); biState.playing = false; updBi(); } });
  const playBtn = ctl.button({
    label: '▶ 自动播放', active: biState.playing,
    onClick() {
      biState.playing = !biState.playing;
      playBtn.classList.toggle('active', biState.playing);
      if (biState.idx >= bisectData.steps.length - 1) biState.idx = 0;
    },
  });
  ctl.slider({ label: '精度 |b−a| ≤', min: 0.005, max: 0.5, step: 0.005, value: biState.tol, fmt: (v) => v.toFixed(3), onInput: (v) => { biState.tol = v; } });
  ctl.sep();
  ctl.button({ label: '↺ 重新开始', onClick() { biState.idx = 0; biState.playing = false; updBi(); } });
  setHUD([['n', '步数'], ['ab', '保留区间'], ['w', '区间宽度'], ['c', '中点'], ['keep', '取舍'], ['err', '误差上界']]);
  updBi();
}

/* ================= 章节 8：定积分（拓展） ================= */

const igState = { fn: 'x2', n: 12, method: 'mid', a: 0, b: 2 };
const IG = {};

const INTEGRALS = {
  x2: { f: (x) => x * x, F: (x) => x * x * x / 3, label: 'x²', a: 0, b: 2 },
  sin: { f: Math.sin, F: (x) => -Math.cos(x), label: 'sin x', a: 0, b: Math.PI },
  cubic: { f: (x) => x * x * x - 3 * x, F: (x) => x ** 4 / 4 - 3 * x * x / 2, label: 'x³−3x', a: 0, b: 2 },
  exp: { f: Math.exp, F: Math.exp, label: 'eˣ', a: 0, b: 2 },
};

function buildIntegral(g) {
  buildWallGrid(g);
  buildFloorGrid(g);
  buildAxes(g, { xr: 5.6, yLo: -3.6, yHi: 7.6, xTicks: [[-2, '-2'], [-1, '-1'], [1, '1'], [2, '2'], [3, '3'], [4, '4'], [5, '5']] });
  IG.curve = buildTubeGroup(INTEGRALS.x2.f, -0.4, 3.4, { color: C.main, r: 0.05 });
  g.add(IG.curve);
  /* 黎曼矩形：InstancedMesh（正面积绿 / 负面积蓝，逐实例着色） */
  const geo = new THREE.BoxGeometry(1, 1, 0.72);
  geo.translate(0, 0.5, 0);
  IG.mat = new THREE.MeshStandardMaterial({ roughness: 0.55, metalness: 0.05, transparent: true, opacity: 0.62 });
  IG.strips = new THREE.InstancedMesh(geo, IG.mat, 200);
  IG.strips.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(200 * 3), 3);
  g.add(IG.strips);
  IG.aPin = makeDot(0xf2efe6, 0.08);
  IG.bPin = makeDot(0xf2efe6, 0.08);
  g.add(IG.aPin, IG.bPin);
  IG.title = lbl('', '#ffffff', 0.0062);
  IG.title.position.set(1, 6.4, 0);
  g.add(IG.title);
}

const _igDummy = new THREE.Object3D();
function updIntegral() {
  const { f, F, label } = INTEGRALS[igState.fn];
  const { a, b, n, method } = igState;
  IG.curve.userData.tubeOpts.f = f;
  IG.curve.userData.tubeOpts.x0 = Math.min(a - 0.4, -0.4);
  IG.curve.userData.tubeOpts.x1 = Math.max(b + 0.4, 3.4);
  retube(IG.curve);
  const dx = (b - a) / n;
  let sum = 0;
  const cPos = new THREE.Color(C.green);
  const cNeg = new THREE.Color(C.blue);
  for (let i = 0; i < 200; i++) {
    if (i >= n) { _igDummy.scale.set(0.0001, 0.0001, 0.0001); _igDummy.updateMatrix(); IG.strips.setMatrixAt(i, _igDummy.matrix); continue; }
    const x0 = a + i * dx;
    const xs = method === 'left' ? x0 : method === 'right' ? x0 + dx : x0 + dx / 2;
    const y = f(xs);
    sum += y * dx;
    _igDummy.position.set(x0, Math.min(0, y), 0);
    _igDummy.scale.set(dx * 0.96, Math.max(Math.abs(y), 0.001), 1);
    _igDummy.updateMatrix();
    IG.strips.setMatrixAt(i, _igDummy.matrix);
    IG.strips.setColorAt(i, y >= 0 ? cPos : cNeg);
  }
  IG.strips.instanceMatrix.needsUpdate = true;
  if (IG.strips.instanceColor) IG.strips.instanceColor.needsUpdate = true;
  IG.aPin.position.set(a, 0, 0);
  IG.bPin.position.set(b, 0, 0);
  setLbl(IG.title, `∫ ${label} dx 的黎曼和（n=${n}，${method === 'left' ? '左端点' : method === 'right' ? '右端点' : '中点'}）`, '#ffffff');
  const exact = F(b) - F(a);
  hset('sum', `黎曼和 = ${sum.toFixed(5)}`);
  hset('exact', `精确值 = ${exact.toFixed(5)}`);
  hset('errv', `误差 ${Math.abs(sum - exact).toExponential(2)}`);
}

function integralCtl() {
  ctl.clear();
  ctl.seg({
    options: Object.keys(INTEGRALS).map((k) => ({ label: INTEGRALS[k].label, value: k })),
    value: igState.fn,
    onChange: (v) => {
      igState.fn = v;
      const d = INTEGRALS[v];
      igState.a = d.a; igState.b = d.b;
      updIntegral();
    },
  });
  ctl.sep();
  ctl.slider({ label: 'n 段数', min: 1, max: 200, step: 1, value: igState.n, fmt: (v) => String(v), onInput: (v) => { igState.n = v; updIntegral(); } });
  ctl.seg({
    options: [{ label: '左端点', value: 'left' }, { label: '中点', value: 'mid' }, { label: '右端点', value: 'right' }],
    value: igState.method,
    onChange: (v) => { igState.method = v; updIntegral(); },
  });
  setHUD([['sum', '黎曼和'], ['exact', '精确值'], ['errv', '误差']]);
  updIntegral();
}

/* ================= 章节 9：随堂检测 ================= */

const QUIZ = [
  {
    q: '把 y = x² 的图像向左平移 2 个单位，得到的解析式是？',
    opts: ['y = (x+2)²', 'y = (x−2)²', 'y = x²+2', 'y = x²−2'],
    a: 0,
    ex: '左移 h=2 即 x−h=x−(−2)=x+2，得 y=(x+2)²。"左加右减"作用在括号内的 x 上。',
  },
  {
    q: 'y = 2ˣ 与 y = log₂x 的图像关系是？',
    opts: ['关于 y 轴对称', '关于 x 轴对称', '关于直线 y = x 对称', '关于原点对称'],
    a: 2,
    ex: '互为反函数的两个函数图像关于直线 y = x 对称——交换每点的 (x, y) 坐标即得镜像点。',
  },
  {
    q: 'y = 3sin(2x + π/3) 的最小正周期是？',
    opts: ['2π', 'π', 'π/3', '4π'],
    a: 1,
    ex: 'T = 2π/ω = 2π/2 = π。振幅 A 与初相 φ 不影响周期。',
  },
  {
    q: 'f′(x₀) 的几何意义是？',
    opts: ['曲线在 x₀ 处的纵坐标', '曲线在 x₀ 处切线的斜率', '割线的斜率', '曲线在 x₀ 处的极值'],
    a: 1,
    ex: '导数 = 切线斜率 = 割线斜率当 h→0 的极限。极值点对应 f′ 为 0，但 f′(x₀) 本身是斜率。',
  },
  {
    q: '用二分法求根，若初始区间宽度为 1，二分 10 次后误差上界约为？',
    opts: ['0.01', '0.001', '0.0001', '0.1'],
    a: 1,
    ex: '每次二分区间减半，误差上界 = 1/2¹⁰ = 1/1024 ≈ 0.00098，最接近 0.001。',
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
    id: 'transform', title: '图像变换',
    cam: [0.5, 2.6, 15.8], tgt: [0, 0.8, 0],
    html: `<p>从基本函数 <b>f(x)</b> 出发，图像按 <span class="hl">y = a·f(x−h) + k</span> 变换：</p>
<p>① <b>h</b>：左右平移（左加右减，x−h 向右移 h）；② <b>k</b>：上下平移；③ <b>a</b>：纵向伸缩，|a|&gt;1 拉伸、0&lt;|a|&lt;1 压缩；④ <b>a&lt;0</b> 时额外关于 x 轴翻折。</p>
<p>规律口诀：<b>平移沿坐标轴方向，伸缩沿 y 值倍数</b>。灰色细管是母函数 f(x)，拖动滑杆观察每一步的变化；点「动画演示」看母函数连续变形到目标图像。视角支持环视与缩放。</p>`,
    enter() {
      Object.assign(trState, { base: 'x2', a: 1, h: 0, k: 0, ghost: true, animT: 0 });
      useScene('transform', buildTransform);
      transformCtl();
    },
  },
  {
    id: 'expln', title: '指数与对数',
    cam: [-3.2, 3.4, 15.2], tgt: [-0.4, 1.4, 0],
    html: `<p>指数函数 <b>y = bˣ</b>（b&gt;0，b≠1）与对数函数 <b>y = log<sub>b</sub> x</b> 互为<b>反函数</b>：图像关于直线 <span class="hl">y = x</span> 对称。</p>
<p>道理很直接：把 y = bˣ 改写成 x = log<sub>b</sub> y，交换 x、y 就是 y = log<sub>b</sub> x——交换坐标 (a, bˣ) → (bˣ, a) 正好是关于 y = x 的镜像。</p>
<p>拖动「底数 b」观察两支曲线如何变化；点「镜像点动画」或直接拖动蓝色演示点，看点 P(x, bˣ) 与它的镜像 P′(bˣ, x) 沿 y = x 对称移动。b&gt;1 时都单调递增；0&lt;b&lt;1 时都单调递减（本实验限 b&gt;1）。</p>`,
    enter() {
      Object.assign(exState, { b: 2, t: 0, showMirror: true, anim: false, px: 1 });
      useScene('expln', buildExpln);
      explnCtl();
    },
  },
  {
    id: 'unit', title: '单位圆与三角函数',
    cam: [0.8, 1.6, 14.8], tgt: [0.8, 0.4, 0],
    html: `<p>角 θ 的终边与<b>单位圆</b>交于点 P，则 <span class="hl">cos θ = P 的横坐标，sin θ = P 的纵坐标，tan θ = 斜率</span>。</p>
<p>让 P 沿圆周匀速转动，右侧把 sin θ 随 θ 的取值"展开"成正弦曲线——圆周运动变成波动。这就是<span class="hl">单位圆定义法</span>，也是"五点法"作图的来历：θ = 0、π/2、π、3π/2、2π 五个关键点确定一个周期。</p>
<p>打开「余弦曲线」对照：同一段圆周运动，横坐标投影的相位与纵坐标相差 π/2。</p>`,
    enter() {
      Object.assign(ucState, { theta: 0.8, playing: true, speed: 0.8, showCos: false, showFive: false });
      useScene('unit', buildUnit);
      unitCtl();
    },
  },
  {
    id: 'sine', title: '正弦型函数',
    cam: [0, 1.6, 15.4], tgt: [0, 0.6, 0],
    html: `<p><span class="hl">y = A·sin(ωx + φ) + k</span>（A&gt;0，ω&gt;0）是正弦曲线的"全家福"：</p>
<p>① <b>A</b>：振幅，值域 [k−A, k+A]；② <b>ω</b>：角频率，周期 <span class="hl">T = 2π/ω</span>；③ <b>φ</b>：初相，图像左移 φ/ω（φ&gt;0 时左移）；④ <b>k</b>：上下平移。</p>
<p>变换顺序的关键：先平移（φ 作用于 x）再伸缩（ω 倍）时，平移量是 <b>φ/ω</b> 而不是 φ——这是考试最容易出错的地方。</p>
<p>打开「相位滚动」看波形整体向左流动；灰色细管为 y = sin x 对照，金色圆点标出起点 (−φ/ω, k)。</p>`,
    enter() {
      Object.assign(sfState, { A: 1, w: 1, phi: 0, k: 0, ghost: true, phaseAnim: false });
      useScene('sine', buildSine);
      sineCtl();
    },
  },
  {
    id: 'deriv', title: '导数的几何意义',
    cam: [1.2, 3.0, 14.6], tgt: [0.2, 0.8, 0],
    html: `<p>过曲线上两点 P(x₀, f(x₀))、Q(x₀+h, f(x₀+h)) 的直线叫<b>割线</b>，斜率 = <span class="hl">[f(x₀+h) − f(x₀)] / h</span>。</p>
<p>让 h 越来越小，Q 沿曲线滑向 P，割线的极限位置就是<b>切线</b>——这个极限值就是<b>导数 f′(x₀)</b>：切线斜率，即瞬时变化率。</p>
<p>拖动「h」滑杆从大到小看蓝割线贴近紫切线；点「动画逼近」自动演示极限过程；打开「导函数曲线」看切线斜率扫出的整条 f′(x)。白色圆点 P 可以直接拖动。</p>`,
    enter() {
      Object.assign(dvState, { fn: 'cubic', x0: 1, h: 1.2, showDeriv: false, anim: false });
      useScene('deriv', buildDeriv);
      derivCtl();
    },
  },
  {
    id: 'mono', title: '单调性与极值',
    cam: [0, 2.4, 16.2], tgt: [0, 0.8, 0],
    html: `<p>判断单调性不必描点：<b>f′(x) &gt; 0 ⇒ 增；f′(x) &lt; 0 ⇒ 减</b>。f′ 的零点是<b>临界点</b>——两侧导数同号则不是极值点（极值点需两侧异号）。</p>
<p>地板上的色带标出增减区间：橙色 f′&gt;0（f 递增），蓝色 f′&lt;0（f 递减）；金色圆点是极值点。可以清楚看到<b>f 的峰谷恰好对准 f′ 的零点</b>。</p>
<p>切换函数对比：三次函数 x³−3x 有极大和极小各一个；四次函数 x⁴−4x²+2 有三个临界点、两个极值点；x³ 在 0 处 f′=0 但不变号，不是极值点。</p>`,
    enter() {
      Object.assign(moState, { fn: 'quart', showDeriv: true });
      useScene('mono', buildMono);
      monoCtl();
    },
  },
  {
    id: 'bisect', title: '零点与二分法',
    cam: [1.4, 2.6, 11.8], tgt: [1.4, 0.3, 0],
    html: `<p>求 f(x) = x³ − x − 2 的零点：若 <b>f(a)·f(b) &lt; 0</b>，由零点存在定理，(a, b) 内必有零点。</p>
<p><b>二分法</b>：取中点 c=(a+b)/2，看 f(c) 与哪端同号，丢弃同号的一半——区间每次减半，<span class="hl">|根的误差 ≤ (b−a)/2ⁿ</span>。这是计算机求方程近似解的朴素而可靠的方法。</p>
<p>点「下一步」或「自动播放」逐步收窄区间；绿色地板条是当前保留区间 [a, b]，蓝色立柱是中点 c，右栏读数给出每一步的误差上界。精度滑杆控制自动停止的 |b−a|。</p>`,
    enter() {
      Object.assign(biState, { playing: false, idx: 0, tol: 0.05, acc: 0 });
      useScene('bisect', buildBisect);
      bisectCtl();
    },
  },
  {
    id: 'integral', title: '定积分（拓展）',
    cam: [1.0, 2.8, 10.8], tgt: [1.0, 1.2, 0],
    html: `<p>求曲边梯形面积：把 [a, b] 切成 n 小段，每段用<b>矩形</b>近似（取左端点 / 中点 / 右端点的高），n → ∞ 时矩形面积之和的极限就是<span class="hl">定积分 ∫ₐᵇ f(x)dx</span>（黎曼和）。</p>
<p>拖动「n」从 1 到 200：矩形越细，和越贴近真实面积——这就是"以直代曲、无限逼近"。绿色矩形计正面积，蓝色计负面积。</p>
<p>读数对比黎曼和与牛顿—莱布尼茨公式 F(b) − F(a) 的精确值；x³−3x 这类会变号的函数还能看到"<b>负面积</b>"。</p>`,
    enter() {
      Object.assign(igState, { fn: 'x2', n: 12, method: 'mid', a: 0, b: 2 });
      useScene('integral', buildIntegral);
      integralCtl();
    },
  },
  {
    id: 'quiz', title: '随堂检测',
    cam: [0, 2.6, 15.6], tgt: [0, 0.6, 0],
    html: `<p>5 道核心概念题，检验本章掌握情况。答完可重新开始。</p>`,
    enter() {
      useScene('sine', buildSine);
      ctl.clear();
      setHUD([['tip', '提示']]);
      hset('tip', '答题后自动判分并给解析');
      showQuiz();
    },
  },
];

/* ================= 章节帧循环（各章 tick） ================= */

app.onFrame((dt) => {
  if (!activeScene || !activeScene.visible) return;
  /* 图像变换：母函数→变换的形变动画 */
  if (activeScene === scenes.transform) {
    if (trState.animT < 1) {
      trState.animT = Math.min(1, trState.animT + dt * 0.7);
      retube(TR.main);
    }
  }
  /* 指对：镜像点动画 */
  if (activeScene === scenes.expln) {
    if (exState.anim) {
      exState.t += dt * 0.5;
      exState.px = 2.4 * Math.sin(exState.t);
      updExpln();
    }
  }
  /* 单位圆：θ 转动 */
  if (activeScene === scenes.unit) {
    if (ucState.playing) ucState.theta += dt * ucState.speed * Math.PI;
    updUnit();
  }
  /* 正弦型：相位滚动 */
  if (activeScene === scenes.sine) {
    if (sfState.phaseAnim) {
      sfState.phi = (sfState.phi + dt * 0.6) % (Math.PI * 2);
      retube(SF.main);
      updSine();
    }
  }
  /* 导数：动画逼近 + 导函数扫描 */
  if (activeScene === scenes.deriv) {
    if (dvState.anim) {
      dvState.h = Math.max(0.01, dvState.h * Math.exp(-dt * 1.4));
      if (dvState.h <= 0.011) dvState.anim = false;
    }
    if (dvState.showDeriv) {
      dvState.scan = (dvState.scan + dt * 1.5) % 9;
      const xx = dvState.scan - 4.5;
      const fp = funcPresets()[dvState.fn].fp;
      const pos = DV.trail.geometry.attributes.position;
      if (DV.trailN < 260) {
        pos.setXYZ(DV.trailN++, xx, clamp(fp(xx), -5.2, 6.8), 0);
      } else {
        pos.copyWithin(0, 3);
        pos.setXYZ(259, xx, clamp(fp(xx), -5.2, 6.8), 0);
      }
      pos.needsUpdate = true;
      DV.trail.geometry.setDrawRange(0, DV.trailN);
      DV.scanDot.visible = true;
      DV.scanDot.position.set(xx, clamp(fp(xx), -5.2, 6.8), 0);
    } else {
      DV.scanDot.visible = false;
      DV.trail.geometry.setDrawRange(0, 0);
      DV.trailN = 0;
    }
    updDeriv();
  }
  /* 二分法：自动播放 */
  if (activeScene === scenes.bisect) {
    if (biState.playing) {
      biState.acc += dt;
      if (biState.acc > 0.55) {
        biState.acc = 0;
        const st = bisectData.steps[biState.idx];
        if (st.b - st.a <= biState.tol || biState.idx >= bisectData.steps.length - 1) {
          biState.playing = false;
          const pb = [...document.querySelectorAll('#controls .ctl-btn')].find((b) => b.textContent.includes('自动播放'));
          if (pb) pb.classList.remove('active');
        } else {
          biState.idx++;
          updBi();
        }
      }
    }
  }
});

/* 导数章：拖 P 点改 x₀；指对章：拖演示点 */
makeXDragger(
  () => (activeScene === scenes.deriv ? [DV.pDot] : activeScene === scenes.expln ? [EX.pDot] : []),
  (x) => {
    if (activeScene === scenes.deriv) {
      dvState.x0 = clamp(x, -4.5, 4.5);
      dvState.anim = false;
      dvState.trailN = 0;
      updDeriv();
    } else if (activeScene === scenes.expln) {
      exState.px = clamp(Math.log(Math.max(1e-6, x)) / Math.log(exState.b), -2.5, 2.5);
      exState.anim = false;
      updExpln();
    }
  },
);

/* ================= 三栏布局驱动（左栏章节列表 / 右栏联动 / 折叠 / 专注） ================= */

const chapNav = document.getElementById('chapNav');
const chapCount = document.getElementById('chapCount');
const detailNo = document.getElementById('detailNo');
const detailTitle = document.getElementById('detailTitle');
const lessonEl = document.getElementById('lesson');
const detailBody = document.getElementById('detailBody');
const controlsEl = document.getElementById('controls');
const funcShell = document.getElementById('funcShell');
let chapterIdx = 0;

/* 拖拽提示角标 */
const dragHint = document.createElement('div');
dragHint.className = 'stage-drag-hint';
stage.appendChild(dragHint);
const DRAG_HINTS = { deriv: '✋ 直接拖动白点 P', expln: '✋ 直接拖动蓝色演示点' };

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
  dragHint.textContent = DRAG_HINTS[sec.id] || '';
  dragHint.classList.toggle('show', !!DRAG_HINTS[sec.id]);
  detailBody.scrollTop = 0;
  app.setCamera(sec.cam, sec.tgt);
}

/* ---------------- 原版功能块 1:1：上一节(←)/下一节(→) · 重置视角(R) · 纸面/Studio(T) · 全屏(F) ---------------- */

const chapPrev = document.getElementById('chapPrev');
const chapNext = document.getElementById('chapNext');
const camResetBtn = document.getElementById('camResetBtn');
const styleBtn = document.getElementById('styleBtn');
const fullBtn = document.getElementById('fullBtn');

function gotoChapter(i) { selectChapter((i + SECTIONS.length) % SECTIONS.length); }
chapPrev.addEventListener('click', () => gotoChapter(chapterIdx - 1));
chapNext.addEventListener('click', () => gotoChapter(chapterIdx + 1));

/* 重置视角：飞回当前章机位 */
function resetView() { app.setCamera(SECTIONS[chapterIdx].cam, SECTIONS[chapterIdx].tgt); }
camResetBtn.addEventListener('click', resetView);

/* 纸面 / Studio 风格切换 */
function paintStyleBtn() {
  styleBtn.textContent = styleName === 'paper' ? '纸面风格' : 'Studio 风格';
  styleBtn.classList.toggle('on', styleName === 'paper');
  styleBtn.setAttribute('aria-pressed', String(styleName === 'paper'));
}
styleBtn.addEventListener('click', () => {
  applyStyle(styleName === 'paper' ? 'studio' : 'paper');
  paintStyleBtn();
});

/* 全屏（中栏整体：舞台 + 工具钮一起进全屏，工具不消失） */
fullBtn.addEventListener('click', () => {
  if (document.fullscreenElement) document.exitFullscreen();
  else document.querySelector('.lab-stage3d').requestFullscreen().catch(() => { /* 用户拒绝或不支持时静默 */ });
});
document.addEventListener('fullscreenchange', () => {
  fullBtn.textContent = document.fullscreenElement ? '⛶ 退出全屏' : '⛶ 全屏';
});

/* 键盘：← 上一节 / → 下一节 / R 重置视角 / T 风格 */
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

/* ---------------- 栏折叠（左右独立 28px 竖条）× 专注模式（双栏同折） ---------------- */

const foldLBtn = document.getElementById('foldLBtn');
const unfoldLBtn = document.getElementById('unfoldLBtn');
const foldRBtn = document.getElementById('foldRBtn');
const unfoldRBtn = document.getElementById('unfoldRBtn');
const railNoL = document.getElementById('railNoL');
const railTitleR = document.getElementById('railTitleR');
const focusBtn = document.getElementById('focusBtn');

const FOLD_KEY = { l: 'func.foldL', r: 'func.foldR' };
let foldL = false;
let foldR = false;
let focusSaved = null;

try {
  foldL = localStorage.getItem(FOLD_KEY.l) === '1';
  foldR = localStorage.getItem(FOLD_KEY.r) === '1';
} catch (e) { /* localStorage 不可用时仅本次会话生效 */ }

function applyFold() {
  funcShell.classList.toggle('fold-l', foldL);
  funcShell.classList.toggle('fold-r', foldR);
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
  funcShell.classList.toggle('focus-mode', on);
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

const ACC_KEYS = { lesson: 'func.accLesson', controls: 'func.accControls', data: 'func.accData' };
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

applyStyle(styleName);
paintStyleBtn();
setTimeout(() => {
  loader.hide();
  window.__eduSections = { select: selectChapter };
  window.__funcDebug = { vfx, app };
  selectChapter(0);
}, 60);
