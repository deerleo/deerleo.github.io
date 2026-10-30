/* EduLab · 圆锥曲线实验室（conic）
 * 章节：圆锥的截线 / Dandelin 双球 / 椭圆 / 双曲线 / 抛物线 / 离心率 / 光学性质 / 直线与圆锥曲线 / 随堂检测
 * 实现：three.js 对顶圆锥 + 截面（射线-平面求交直接采样截线）；平面章节（椭圆/双曲线/抛物线/
 *       离心率/光学/判别式）在 XY 平面用参数方程实时重建曲线。OrbitControls 全程可旋转缩放。
 */
import {
  THREE, DEG, TAU, clamp,
  createApp, cameraTweenTick, makeLoader,
  createSections, createControlsPanel, makeHUD, makeTextSprite, setSpriteText,
} from './edu-core.js';

/* ---------------- 场景 ---------------- */

const stage = document.getElementById('stage');
const loader = makeLoader(stage, '正在搭建圆锥曲线实验室…');

const app = createApp({
  container: stage,
  fov: 45,
  near: 0.05, far: 500,
  cameraPos: [5.2, 3.6, 6.4],
  target: [0, 0.8, 0],
  minDistance: 1.2,
  maxDistance: 60,
  toneMapping: THREE.NoToneMapping,
});
const { scene, camera, controls } = app;
scene.add(new THREE.AmbientLight(0xffffff, 0.85));
const dl = new THREE.DirectionalLight(0xffffff, 1.1);
dl.position.set(5, 8, 6);
scene.add(dl);

const COL = {
  accent: 0xe8674a, blue: 0x4a90d9, green: 0x3fa96f, gold: 0xd9a13f,
  purple: 0x9b6fd9, teal: 0x2fb3a5, dim: 0x8a94a3,
};

/* ---------------- 通用绘制小工具 ---------------- */

function makeCurveLine(color, width = 2.4) {
  const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.95 });
  const line = new THREE.Line(new THREE.BufferGeometry(), mat);
  return line;
}
function setLinePoints(line, pts) {
  line.geometry.dispose();
  line.geometry = new THREE.BufferGeometry().setFromPoints(pts);
}
function makeDot(color, r = 0.055) {
  return new THREE.Mesh(new THREE.SphereGeometry(r, 20, 14), new THREE.MeshBasicMaterial({ color }));
}
function makeLabel(text, color, scale = 0.0062) {
  return makeTextSprite(text, { fontSize: 40, color, scale });
}
/** 平面虚线圆（不随章变化） */
function dashedCircleLine(radius, color, y = 0, segments = 128, dash = [0.09, 0.06]) {
  const pts = [];
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * TAU;
    pts.push(new THREE.Vector3(Math.cos(a) * radius, y, Math.sin(a) * radius));
  }
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const line = new THREE.Line(geo, new THREE.LineDashedMaterial({ color, dashSize: dash[0], gapSize: dash[1], transparent: true, opacity: 0.7 }));
  line.computeLineDistances();
  return line;
}
function dashedLine(a, b, color) {
  const geo = new THREE.BufferGeometry().setFromPoints([a, b]);
  const line = new THREE.Line(geo, new THREE.LineDashedMaterial({ color, dashSize: 0.12, gapSize: 0.08, transparent: true, opacity: 0.75 }));
  line.computeLineDistances();
  return line;
}

/* ---------------- 对顶圆锥（章节 1-2） ---------------- */

const ALPHA0 = 30 * DEG;               // 半锥角默认值
const CONE_H = 4.2;                    // 每叶高度
let coneHalf = ALPHA0;

const coneG = new THREE.Group();       // 圆锥整体
scene.add(coneG);

function buildCones(alpha) {
  // 清理重建（半锥角变化时）
  coneG.clear();
  const r = CONE_H * Math.tan(alpha);
  const mat = new THREE.MeshStandardMaterial({
    color: 0xf3b49a, transparent: true, opacity: 0.16, side: THREE.DoubleSide,
    roughness: 0.6, metalness: 0, depthWrite: false,
  });
  const up = new THREE.Mesh(new THREE.ConeGeometry(r, CONE_H, 64, 1, true), mat);
  up.position.y = CONE_H / 2;
  const down = new THREE.Mesh(new THREE.ConeGeometry(r, CONE_H, 64, 1, true), mat);
  down.rotation.z = Math.PI;
  down.position.y = -CONE_H / 2;
  coneG.add(up, down);
  // 轮廓线（每叶 3 条母线 + 上下口圆）
  const edge = new THREE.LineBasicMaterial({ color: COL.dim, transparent: true, opacity: 0.55 });
  for (const sgn of [1, -1]) {
    for (const phi of [0, Math.PI / 2, Math.PI]) {
      const pts = [new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(sgn * Math.cos(alpha) * Math.cos(phi) * CONE_H, sgn * Math.sin(alpha) * CONE_H, sgn * Math.cos(alpha) * Math.sin(phi) * CONE_H)];
      const g = new THREE.BufferGeometry().setFromPoints(pts);
      coneG.add(new THREE.Line(g, edge));
    }
  }
  coneG.add(dashedCircleLine(r, COL.dim, CONE_H - 0.02));
  coneG.add(dashedCircleLine(r, COL.dim, -(CONE_H - 0.02)));
  const apex = makeDot(COL.accent, 0.05);
  coneG.add(apex);
  coneHalf = alpha;
}
buildCones(ALPHA0);

/* 截面平面 + 截线 */
const cutG = new THREE.Group();
scene.add(cutG);
const planeSize = 7.2;
const planeMesh = new THREE.Mesh(
  new THREE.PlaneGeometry(planeSize, planeSize),
  new THREE.MeshStandardMaterial({ color: 0x4a90d9, transparent: true, opacity: 0.20, side: THREE.DoubleSide, depthWrite: false })
);
cutG.add(planeMesh);
const cutCurve = makeCurveLine(COL.accent, 2.6);
cutG.add(cutCurve);
const cutDot = makeDot(COL.gold, 0.07);
cutG.add(cutDot);
const typeLabel = makeLabel('', '#e8674a', 0.009);
cutG.add(typeLabel);

/** 截面参数：倾角 tilt（与水平面夹角），过点 (0, y0, 0)。返回 {n, d} */
function cutPlane(tilt, y0) {
  const n = new THREE.Vector3(Math.sin(tilt), Math.cos(tilt), 0);
  return { n, d: n.y * y0 };
}
/** 采样截线：上半锥射线 φ → 与平面求交 */
function sampleCut(tilt, y0, alpha) {
  const { n, d } = cutPlane(tilt, y0);
  const pts = [];
  const N = 360;
  const tClamp = 26;
  let run = [];
  for (let i = 0; i <= N; i++) {
    const phi = (i / N) * TAU;
    const dir = new THREE.Vector3(Math.cos(alpha) * Math.cos(phi), Math.sin(alpha), Math.cos(alpha) * Math.sin(phi));
    const den = n.dot(dir);
    if (Math.abs(den) < 1e-6) { if (run.length) { pts.push(run); run = []; } continue; }
    const t = d / den;
    if (!isFinite(t) || Math.abs(t) > tClamp) { if (run.length) { pts.push(run); run = []; } continue; }
    run.push(dir.multiplyScalar(t));
  }
  if (run.length) pts.push(run);
  return pts;
}
function curveTypeOf(tilt, alpha) {
  if (tilt < alpha - 0.012) return '椭圆';
  if (tilt < alpha + 0.012) return '抛物线';
  return '双曲线';
}
function updateCut(tilt, y0, alpha) {
  if (Math.abs(alpha - coneHalf) > 1e-6) buildCones(alpha);
  const { n, d } = cutPlane(tilt, y0);
  planeMesh.position.set(0, y0, 0);
  planeMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), n);
  const runs = sampleCut(tilt, y0, alpha);
  const flat = [];
  runs.forEach((r) => { r.forEach((p) => flat.push(p)); if (flat.length) flat.push(flat[0].clone()); });
  setLinePoints(cutCurve, flat);
  const type = curveTypeOf(tilt, alpha);
  setSpriteText(typeLabel, `${type}（倾角 ${Math.round(tilt / DEG)}° vs 半角 ${Math.round(alpha / DEG)}°）`, { fontSize: 36, color: '#e8674a', scale: 0.0072, bg: 'rgba(10,16,24,0.66)' });
  typeLabel.position.set(0, CONE_H + 0.7, 0);
  return { runs, type };
}

/* ---------------- Dandelin 双球（章节 2） ---------------- */

const danG = new THREE.Group();
scene.add(danG);
const danSpheres = [0, 1].map(() => new THREE.Mesh(
  new THREE.SphereGeometry(1, 40, 28),
  new THREE.MeshStandardMaterial({ color: 0xffcf6e, transparent: true, opacity: 0.42, roughness: 0.35 })
));
const danTangent = [0, 1].map(() => {
  const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
  return new THREE.Line(g, new THREE.LineDashedMaterial({ color: COL.gold, dashSize: 0.1, gapSize: 0.07, transparent: true, opacity: 0.75 }));
});
const danFoci = [0, 1].map(() => makeDot(0xd9534f, 0.06));
const danFociLbl = [0, 1].map((i) => makeLabel(`F${i + 1}`, '#d9534f', 0.0075));
const danString = [0, 1].map(() => makeCurveLine(COL.teal, 1.8));
const danPoint = makeDot(COL.accent, 0.06);
danG.add(...danSpheres, ...danTangent, ...danFoci, ...danFociLbl, ...danString, danPoint);

/** 在当前截面下布置 Dandelin 双球，返回两焦点位置 */
function updateDandelin(tilt, y0, alpha, withString = true) {
  updateCut(tilt, y0, alpha);
  const { n, d } = cutPlane(tilt, y0);
  const c = Math.cos(tilt);
  // 上球（介于顶点与截面之间）h1 = y0·c/(c+sinα)；下球 h2 = y0·c/(c−sinα)
  const s = Math.sin(alpha);
  const hs = [y0 * c / (c + s), y0 * c / (c - s)];
  const foci = [];
  hs.forEach((h, i) => {
    const R = h * s;
    const center = new THREE.Vector3(0, h, 0);
    danSpheres[i].visible = true;
    danSpheres[i].position.copy(center);
    danSpheres[i].scale.setScalar(R);
    const dist = n.dot(center) - d;   // 有符号距离（球心到平面）
    const foot = center.clone().sub(n.clone().multiplyScalar(dist));
    danFoci[i].position.copy(foot);
    danFociLbl[i].position.copy(foot.clone().add(new THREE.Vector3(0.16, 0.18, 0)));
    // 与圆锥的切圆（高度 h·cos²α，半径 = 该处锥半径）——几何体就地更新
    const ty = h * Math.cos(alpha) ** 2;
    danTangent[i].visible = true;
    const tr = ty * Math.tan(alpha);
    const pts = [];
    for (let k = 0; k <= 96; k++) {
      const a2 = (k / 96) * TAU;
      pts.push(new THREE.Vector3(Math.cos(a2) * tr, ty, Math.sin(a2) * tr));
    }
    setLinePoints(danTangent[i], pts);
    danTangent[i].computeLineDistances();
    foci.push(foot);
  });
  danString.forEach((l) => { l.visible = withString; });
  danPoint.visible = withString;
  return foci;
}
let danFociNow = [new THREE.Vector3(), new THREE.Vector3()];

/* ---------------- 平面坐标系（章节 3-8，XY 平面） ---------------- */

const boardG = new THREE.Group();
scene.add(boardG);
const AXLEN = 5.6;
{
  const mat = new THREE.LineBasicMaterial({ color: COL.dim, transparent: true, opacity: 0.6 });
  boardG.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-AXLEN, 0, 0), new THREE.Vector3(AXLEN, 0, 0)]), mat));
  boardG.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -AXLEN, 0), new THREE.Vector3(0, AXLEN, 0)]), mat));
  for (let i = -5; i <= 5; i++) {
    if (!i) continue;
    const t1 = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(i, -0.07, 0), new THREE.Vector3(i, 0.07, 0)]), mat);
    const t2 = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-0.07, i, 0), new THREE.Vector3(0.07, i, 0)]), mat);
    boardG.add(t1, t2);
  }
}
const axLabels = [];
for (let i = -5; i <= 5; i += 1) {
  if (!i) continue;
  const l = makeLabel(String(i), '#8a94a3', 0.0042);
  l.position.set(i, -0.3, 0);
  axLabels.push(l);
  boardG.add(l);
}
const xAxisLabel = makeLabel('x', '#8a94a3', 0.005);
xAxisLabel.position.set(AXLEN + 0.3, 0.15, 0);
const yAxisLabel = makeLabel('y', '#8a94a3', 0.005);
yAxisLabel.position.set(0.28, AXLEN + 0.2, 0);
boardG.add(xAxisLabel, yAxisLabel);

/* 章节通用曲线对象（按需重建） */
const board = {
  curve: null, aux: [], dots: {}, labels: {},
  clearAux() { this.aux.forEach((o) => { boardG.remove(o); o.geometry?.dispose(); o.material?.dispose?.(); }); this.aux = []; },
  auxLine(a, b, color, dash = true) {
    const l = dash ? dashedLine(a, b, color) : new THREE.Line(new THREE.BufferGeometry().setFromPoints([a, b]), new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.9 }));
    boardG.add(l);
    this.aux.push(l);
    return l;
  },
  auxCurve(pts, color, dashed = false) {
    let l;
    if (dashed) {
      const g = new THREE.BufferGeometry().setFromPoints(pts);
      l = new THREE.Line(g, new THREE.LineDashedMaterial({ color, dashSize: 0.14, gapSize: 0.09, transparent: true, opacity: 0.7 }));
      l.computeLineDistances();
    } else {
      l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.95 }));
    }
    boardG.add(l);
    this.aux.push(l);
    return l;
  },
  auxDot(name, pos, color, r = 0.06) {
    if (!this.dots[name]) { this.dots[name] = makeDot(color, r); boardG.add(this.dots[name]); }
    this.dots[name].position.copy(pos);
    this.dots[name].visible = true;
    return this.dots[name];
  },
  auxLabel(name, text, color, pos, scale = 0.0058, bg) {
    if (!this.labels[name]) { this.labels[name] = makeLabel(text, color, scale); boardG.add(this.labels[name]); }
    setSpriteText(this.labels[name], text, { fontSize: 38, color, scale, bg });
    this.labels[name].position.copy(pos);
    this.labels[name].visible = true;
    return this.labels[name];
  },
  reset() {
    this.clearAux();
    Object.values(this.dots).forEach((d) => { d.visible = false; });
    Object.values(this.labels).forEach((l) => { l.visible = false; });
    if (this.curve) { boardG.remove(this.curve); this.curve.geometry.dispose(); this.curve = null; }
  },
};

function mainCurve(pts, color) {
  board.reset();
  board.curve = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.98 }));
  boardG.add(board.curve);
  return board.curve;
}

/* ---------------- 章节框架 ---------------- */

const ctl = createControlsPanel(document.getElementById('controls'));
const hud = makeHUD(stage, [['v1', '读数'], ['v2', ''], ['v3', '']]);
hud.show(false);
let activeCleanup = null;
let chapterTick = null;

function showBoard(on) {
  boardG.visible = on;
  coneG.visible = !on;
  cutG.visible = !on;
  danG.visible = false;   // 仅 Dandelin 章节自行打开
}
function camTo(pos, target) { app.setCamera(pos, target); }

/* ================= 章节 1：圆锥的截线 ================= */

const cs = { tilt: 8 * DEG, y0: 1.6, alpha: ALPHA0, wire: true, anim: true };

const secCut = {
  id: 'cut', title: '圆锥的截线',
  html: `<p>用一个平面去截<b>对顶圆锥</b>，截口的形状只取决于<b>截面的倾斜程度</b>：</p>
<p>① 平面 <b>垂直于轴</b>（倾角 0°）→ <b>圆</b>；② 倾角 <b>小于半锥角 α</b> → <b>椭圆</b>；③ 倾角 <b>恰好等于 α</b>（平面平行于一条母线）→ <b>抛物线</b>；④ 倾角 <b>大于 α</b>（截面穿过两叶）→ <b>双曲线</b>。</p>
<p>拖动「倾角 θ」滑杆，从 0° 一路加大到 90°：橙色截线会连续地从圆变成椭圆、抛物线、双曲线——四种曲线其实是<b>同一家族</b>，这就是"圆锥曲线"名字的由来。滑杆「位置 y0」平移截面的高度，「半角 α」改变圆锥的胖瘦。</p>`,
  enter() {
    Object.assign(cs, { tilt: 8 * DEG, y0: 1.6, alpha: ALPHA0, wire: true, anim: true });
    showBoard(false);
    camTo([5.2, 3.6, 6.4], [0, 0.8, 0]);
    hud.show(true);
    ctl.clear();
    ctl.slider({ label: '倾角 θ', min: 0, max: Math.PI / 2, step: 0.01, value: cs.tilt, fmt: (v) => Math.round(v / DEG) + '°', onInput: (v) => { cs.tilt = v; } });
    ctl.slider({ label: '高度 y₀', min: 0.6, max: 2.8, step: 0.05, value: cs.y0, fmt: (v) => v.toFixed(2), onInput: (v) => { cs.y0 = v; } });
    ctl.slider({ label: '半角 α', min: 15 * DEG, max: 45 * DEG, step: 0.01, value: cs.alpha, fmt: (v) => Math.round(v / DEG) + '°', onInput: (v) => { cs.alpha = v; } });
    ctl.sep();
    ctl.toggle({ label: '圆锥线框', value: true, onChange: (v) => { coneG.children.forEach((m) => { if (m.isMesh) m.visible = v; }); } });
    ctl.button({
      label: 'θ → 90° 自动演示',
      onClick() { cs.auto = 0.02; },
    });
    let lastType = '';
    chapterTick = (dt) => {
      if (cs.auto !== undefined) {
        cs.auto += dt * 0.16;
        cs.tilt = Math.min(Math.PI / 2, cs.auto);
        const input = ctl.el.querySelectorAll('input[type=range]')[0];
        if (input) { input.value = cs.tilt; input.dispatchEvent(new Event('input', { bubbles: false })); }
        if (cs.tilt >= Math.PI / 2 - 1e-6) cs.auto = undefined;
      }
      const { type } = updateCut(cs.tilt, cs.y0, cs.alpha);
      if (type !== lastType) { lastType = type; }
      // 采样点沿截线滚动
      if (cs.anim) {
        cs.t = (cs.t || 0) + dt * 0.25;
        const all = [];
        sampleCut(cs.tilt, cs.y0, cs.alpha).forEach((r) => all.push(...r));
        if (all.length) {
          const p = all[Math.floor(cs.t * all.length) % all.length];
          cutDot.position.copy(p);
        }
      }
      hud.set('v1', `截线：${type}`);
      hud.set('v2', `θ ${Math.round(cs.tilt / DEG)}° ${cs.tilt < cs.alpha ? '<' : cs.tilt > cs.alpha ? '>' : '='} α ${Math.round(cs.alpha / DEG)}°`);
      hud.set('v3', '拖动倾角看四种曲线连续变化');
    };
    updateCut(cs.tilt, cs.y0, cs.alpha);
  },
};

/* ================= 章节 2：Dandelin 双球 ================= */

const da = { tilt: 22 * DEG, y0: 1.8, alpha: ALPHA0, withString: true };

const secDandelin = {
  id: 'dandelin', title: 'Dandelin 双球',
  html: `<p>椭圆的两个焦点是哪来的？1822 年<b> Dandelin</b> 给出一个漂亮得惊人的回答——往圆锥里塞两个球：</p>
<p>在截面上下各放一个<b>与圆锥面相切、又与截面相切</b>的球。球与截面只接触一点——这两个切点<b>恰好就是椭圆的两个焦点 F₁、F₂</b>。</p>
<p>更妙的是焦点定义本身：设 P 是椭圆上一点，P 沿圆锥面到上球切圆的切线段长 = P 到 F₁ 的距离（同一球的两条切线等长），下球同理。而这两条锥面切线段之和恰好是两切圆之间的定长 → <span class="hl">PF₁ + PF₂ = 常数 2a</span>。青色线段就是这条"弦"，盯住它的总长读数。</p>`,
  enter() {
    Object.assign(da, { tilt: 22 * DEG, y0: 1.8, alpha: ALPHA0, withString: true });
    showBoard(false);
    danG.visible = true;
    camTo([4.6, 2.8, 6.2], [0, 1.2, 0]);
    hud.show(true);
    ctl.clear();
    ctl.slider({ label: '倾角 θ', min: 4 * DEG, max: 26 * DEG, step: 0.005, value: da.tilt, fmt: (v) => Math.round(v / DEG) + '°', onInput: (v) => { da.tilt = v; } });
    ctl.slider({ label: '高度 y₀', min: 1.0, max: 2.8, step: 0.05, value: da.y0, fmt: (v) => v.toFixed(2), onInput: (v) => { da.y0 = v; } });
    ctl.sep();
    ctl.toggle({ label: '弦长演示', value: true, onChange: (v) => { da.withString = v; danString.forEach((l) => l.visible = v); danPoint.visible = v; } });
    chapterTick = (dt) => {
      danFociNow = updateDandelin(da.tilt, da.y0, da.alpha, da.withString);
      const all = [];
      sampleCut(da.tilt, da.y0, da.alpha).forEach((r) => all.push(...r));
      da.t = (da.t || 0) + dt * 0.22;
      if (all.length && da.withString) {
        const p = all[Math.floor(da.t * all.length) % all.length];
        danPoint.position.copy(p);
        danString.forEach((l, i) => setLinePoints(l, [p, danFociNow[i]]));
        const sum = p.distanceTo(danFociNow[0]) + p.distanceTo(danFociNow[1]);
        hud.set('v1', `PF₁ + PF₂ = ${sum.toFixed(3)}（常数）`);
      } else hud.set('v1', 'PF₁ + PF₂ = 2a');
      hud.set('v2', `两切点即两焦点`);
      hud.set('v3', `θ = ${Math.round(da.tilt / DEG)}° < α = ${Math.round(da.alpha / DEG)}°`);
    };
  },
  leave() {
    danSpheres.forEach((m) => { m.visible = false; });
    danTangent.forEach((m) => { m.visible = false; });
    danFoci.forEach((m) => { m.visible = false; });
    danFociLbl.forEach((m) => { m.visible = false; });
    danString.forEach((m) => { m.visible = false; });
    danPoint.visible = false;
  },
};

/* ================= 章节 3：椭圆 ================= */

const el = { a: 3.4, c: 2.0, anim: true };

function ellipsePts(a, b, n = 220) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * TAU;
    pts.push(new THREE.Vector3(a * Math.cos(t), b * Math.sin(t), 0));
  }
  return pts;
}

const secEllipse = {
  id: 'ellipse', title: '椭圆',
  html: `<p><b>定义</b>：平面内与两个定点 F₁、F₂ 的距离之和等于常数（大于 |F₁F₂|）的点的轨迹。</p>
<p>绳索作图法：把绳子两端钉在 F₁、F₂，用铅笔绷紧画一圈——铅笔的轨迹就是椭圆。设长半轴 a、半焦距 c，则 <span class="hl">b² = a² − c²</span>，方程 <b>x²/a² + y²/b² = 1</b>。</p>
<p>拖动「c」：焦距越大椭圆越扁；c → 0 时变成圆；c → a 时压成线段（此时 |F₁F₂| = 2a，轨迹不存在）。红色动点实时演示 PF₁ + PF₂ = 2a。</p>`,
  enter() {
    Object.assign(el, { a: 3.4, c: 2.0, anim: true });
    showBoard(true);
    camTo([0, 0, 9.2], [0, 0, 0]);
    hud.show(true);
    ctl.clear();
    ctl.slider({ label: 'a 长半轴', min: 1.4, max: 4.6, step: 0.05, value: el.a, fmt: (v) => v.toFixed(2), onInput: (v) => { el.a = Math.max(v, el.c + 0.1); } });
    ctl.slider({ label: 'c 半焦距', min: 0.05, max: 4.4, step: 0.05, value: el.c, fmt: (v) => v.toFixed(2), onInput: (v) => { el.c = Math.min(v, el.a - 0.1); } });
    ctl.toggle({ label: '动点', value: true, onChange: (v) => { el.anim = v; } });
    ctl.toggle({ label: '轴线标注', value: true, onChange: (v) => { el.axes = v; } });
    el.axes = true;
    chapterTick = (dt) => {
      const { a, c } = el;
      const b = Math.sqrt(Math.max(1e-6, a * a - c * c));
      mainCurve(ellipsePts(a, b), COL.accent);
      const f1 = new THREE.Vector3(-c, 0, 0), f2 = new THREE.Vector3(c, 0, 0);
      board.auxDot('f1', f1, 0xd9534f);
      board.auxDot('f2', f2, 0xd9534f);
      board.auxLabel('f1', 'F₁', '#d9534f', f1.clone().add(new THREE.Vector3(-0.15, 0.3, 0)));
      board.auxLabel('f2', 'F₂', '#d9534f', f2.clone().add(new THREE.Vector3(0.15, 0.3, 0)));
      if (el.axes) {
        board.auxLine(new THREE.Vector3(-a, 0, 0), new THREE.Vector3(a, 0, 0), 0x8a94a3);
        board.auxLine(new THREE.Vector3(0, -b, 0), new THREE.Vector3(0, b, 0), 0x8a94a3);
        board.auxLabel('eq', `x²/${a.toFixed(1)}² + y²/${b.toFixed(1)}² = 1`, '#e4ebf1', new THREE.Vector3(0, b + 0.55, 0), 0.0062, 'rgba(10,16,24,0.6)');
      }
      el.t = (el.t || 0) + dt * 0.25;
      if (el.anim) {
        const t = el.t * TAU;
        const p = new THREE.Vector3(a * Math.cos(t), b * Math.sin(t), 0);
        board.auxDot('P', p, 0xd9a13f, 0.07);
        board.auxLine(p, f1, 0x2fb3a5);
        board.auxLine(p, f2, 0x2fb3a5);
        board.auxLabel('P', 'P', '#d9a13f', p.clone().add(new THREE.Vector3(0, 0.28, 0)));
        hud.set('v1', `PF₁ + PF₂ = ${(p.distanceTo(f1) + p.distanceTo(f2)).toFixed(3)} = 2a = ${(2 * a).toFixed(2)}`);
      }
      hud.set('v2', `b = ${b.toFixed(2)}（b² = a² − c²）`);
      hud.set('v3', `离心率 e = c/a = ${(c / a).toFixed(3)}`);
    };
  },
};

/* ================= 章节 4：双曲线 ================= */

const hp = { a: 2.2, c: 3.2, anim: true };

function hyperbolaPts(a, b, tMax = 2.6, n = 160) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = -tMax + (2 * tMax) * (i / n);
    pts.push(new THREE.Vector3(a * Math.cosh(t), b * Math.sinh(t), 0));
  }
  for (let i = 0; i <= n; i++) {
    const t = -tMax + (2 * tMax) * (i / n);
    pts.push(new THREE.Vector3(-a * Math.cosh(t), -b * Math.sinh(t), 0));
  }
  return pts;
}

const secHyperbola = {
  id: 'hyperbola', title: '双曲线',
  html: `<p><b>定义</b>：与两定点 F₁、F₂ 的距离之<b>差</b>的绝对值等于常数（小于 |F₁F₂|）的点的轨迹——两支合起来才是完整双曲线。</p>
<p>设实半轴 a、半焦距 c，则 <span class="hl">b² = c² − a²</span>，方程 <b>x²/a² − y²/b² = 1</b>。两支曲线渐渐贴近两条直线 <b>y = ±(b/a)x</b>——<b>渐近线</b>，画双曲线时先画它当"骨架"。</p>
<p>拖动「c」：c 越大开度越大；c → a 时两支并成一支的极限。红色动点演示 |PF₁ − PF₂| = 2a。</p>`,
  enter() {
    Object.assign(hp, { a: 2.2, c: 3.2, anim: true });
    showBoard(true);
    camTo([0, 0, 10.5], [0, 0, 0]);
    hud.show(true);
    ctl.clear();
    ctl.slider({ label: 'a 实半轴', min: 0.8, max: 3.2, step: 0.05, value: hp.a, fmt: (v) => v.toFixed(2), onInput: (v) => { hp.a = Math.min(v, hp.c - 0.1); } });
    ctl.slider({ label: 'c 半焦距', min: 1.0, max: 4.8, step: 0.05, value: hp.c, fmt: (v) => v.toFixed(2), onInput: (v) => { hp.c = Math.max(v, hp.a + 0.1); } });
    ctl.toggle({ label: '渐近线', value: true, onChange: (v) => { hp.asym = v; } });
    ctl.toggle({ label: '动点', value: true, onChange: (v) => { hp.anim = v; } });
    hp.asym = true;
    chapterTick = (dt) => {
      const { a, c } = hp;
      const b = Math.sqrt(Math.max(1e-6, c * c - a * a));
      mainCurve(hyperbolaPts(a, b), COL.accent);
      const f1 = new THREE.Vector3(-c, 0, 0), f2 = new THREE.Vector3(c, 0, 0);
      board.auxDot('f1', f1, 0xd9534f);
      board.auxDot('f2', f2, 0xd9534f);
      board.auxLabel('f1', 'F₁', '#d9534f', f1.clone().add(new THREE.Vector3(-0.15, 0.3, 0)));
      board.auxLabel('f2', 'F₂', '#d9534f', f2.clone().add(new THREE.Vector3(0.15, 0.3, 0)));
      if (hp.asym) {
        board.auxLine(new THREE.Vector3(-5.4, -5.4 * b / a, 0), new THREE.Vector3(5.4, 5.4 * b / a, 0), 0xd9a13f);
        board.auxLine(new THREE.Vector3(-5.4, 5.4 * b / a, 0), new THREE.Vector3(5.4, -5.4 * b / a, 0), 0xd9a13f);
        board.auxLabel('eq', `x²/${a.toFixed(1)}² − y²/${b.toFixed(1)}² = 1`, '#e4ebf1', new THREE.Vector3(0, 4.9, 0), 0.0062, 'rgba(10,16,24,0.6)');
      }
      hp.t = (hp.t || 0) + dt * 0.28;
      if (hp.anim) {
        const t = hp.t * 2.4 - 1.2;
        const sgn = Math.sin(hp.t * TAU) >= 0 ? 1 : -1;
        const p = new THREE.Vector3(sgn * a * Math.cosh(Math.abs(t)), sgn * b * Math.sinh(Math.abs(t)), 0);
        p.x = clamp(p.x, -5.2, 5.2); p.y = clamp(p.y, -5.2, 5.2);
        board.auxDot('P', p, 0xd9a13f, 0.07);
        board.auxLine(p, f1, 0x2fb3a5);
        board.auxLine(p, f2, 0x2fb3a5);
        const diff = Math.abs(p.distanceTo(f1) - p.distanceTo(f2));
        hud.set('v1', `|PF₁ − PF₂| = ${diff.toFixed(3)} = 2a = ${(2 * a).toFixed(2)}`);
      }
      hud.set('v2', `b = ${b.toFixed(2)}（b² = c² − a²）`);
      hud.set('v3', `渐近线 y = ±${(b / a).toFixed(2)}x`);
    };
  },
};

/* ================= 章节 5：抛物线 ================= */

const pb = { p: 1.6, anim: true };

function parabolaPts(p, xMax = 5.2, n = 200) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const y = -xMax + (2 * xMax) * (i / n);
    pts.push(new THREE.Vector3(y * y / (2 * p), y, 0));
  }
  return pts;
}

const secParabola = {
  id: 'parabola', title: '抛物线',
  html: `<p><b>定义</b>：与一个定点 F（焦点）和一条定直线 l（准线）<b>距离相等</b>的点的轨迹。</p>
<p>设焦点到准线的距离为 p（<b>焦准距</b>），取焦点 F(p/2, 0)、准线 x = −p/2，方程为 <span class="hl">y² = 2px</span>。抛物线只有一支、没有渐近线，开口向焦点一侧无限延展。</p>
<p>红色动点两侧的青色线段<b>永远等长</b>——到焦点和到准线的距离。这就是"抛物线"的定义式，也是它聚焦平行光的原理（下一章）。</p>`,
  enter() {
    Object.assign(pb, { p: 1.6, anim: true });
    showBoard(true);
    camTo([0.6, 0, 10], [0.6, 0, 0]);
    hud.show(true);
    ctl.clear();
    ctl.slider({ label: 'p 焦准距', min: 0.5, max: 3.4, step: 0.05, value: pb.p, fmt: (v) => v.toFixed(2), onInput: (v) => { pb.p = v; } });
    ctl.toggle({ label: '准线', value: true, onChange: (v) => { pb.directrix = v; } });
    ctl.toggle({ label: '动点', value: true, onChange: (v) => { pb.anim = v; } });
    pb.directrix = true;
    chapterTick = (dt) => {
      const { p } = pb;
      mainCurve(parabolaPts(p), COL.accent);
      const f = new THREE.Vector3(p / 2, 0, 0);
      board.auxDot('f', f, 0xd9534f);
      board.auxLabel('f', 'F', '#d9534f', f.clone().add(new THREE.Vector3(0, 0.3, 0)));
      if (pb.directrix) {
        board.auxLine(new THREE.Vector3(-p / 2, -5, 0), new THREE.Vector3(-p / 2, 5, 0), 0xd9a13f);
        board.auxLabel('dl', '准线 x = −p/2', '#d9a13f', new THREE.Vector3(-p / 2 - 0.15, 4.6, 0), 0.005);
      }
      pb.t = (pb.t || 0) + dt * 0.3;
      if (pb.anim) {
        const y = 4.4 * Math.sin(pb.t);
        const x = y * y / (2 * p);
        const pt = new THREE.Vector3(x, y, 0);
        board.auxDot('P', pt, 0xd9a13f, 0.07);
        board.auxLine(pt, f, 0x2fb3a5);
        const foot = new THREE.Vector3(-p / 2, y, 0);
        board.auxLine(pt, foot, 0x2fb3a5);
        board.auxDot('foot', foot, 0x8a94a3, 0.045);
        hud.set('v1', `PF = ${pt.distanceTo(f).toFixed(3)}，Pd = ${pt.distanceTo(foot).toFixed(3)}`);
      }
      hud.set('v2', `方程 y² = ${(2 * p).toFixed(1)}x`);
      hud.set('v3', `焦点 (${(p / 2).toFixed(2)}, 0)`);
    };
  },
};

/* ================= 章节 6：离心率 ================= */

const ec = { e: 0.6, l: 1.8, anim: true };

/** 极坐标采样：r = ℓ/(1 − e·cosψ)，焦点在原点，准线在 x = −ℓ/e */
function conicPolarPts(e, l, n = 420) {
  const runs = [[]];
  for (let i = 0; i <= n; i++) {
    const psi = -Math.PI + (2 * Math.PI) * (i / n);
    const den = 1 - e * Math.cos(psi);
    if (Math.abs(den) < 0.015) { runs.push([]); continue; }
    const r = l / den;
    if (r <= 0 || r > 60) { runs.push([]); continue; }
    runs[runs.length - 1].push(new THREE.Vector3(r * Math.cos(psi), r * Math.sin(psi), 0));
  }
  return runs.filter((r) => r.length > 2);
}

const secEcc = {
  id: 'ecc', title: '离心率',
  html: `<p>把三种曲线放进<b>统一定义</b>：到一个定点 F 的距离与到一条定直线 l 的距离之比为常数 <span class="hl">e（离心率）</span>：</p>
<p><b>0 &lt; e &lt; 1</b> → 椭圆（e = 0 退化为圆）；<b>e = 1</b> → 抛物线；<b>e &gt; 1</b> → 双曲线。极坐标方程：<b>r = ℓ / (1 − e·cosψ)</b>（ℓ 为半通径）。</p>
<p>拖动「e」从 0.15 拉到 1.7：椭圆越来越扁 → 撕开成抛物线 → 再张开成双曲线——一条滑杆看完整个家族的连续变化。</p>`,
  enter() {
    Object.assign(ec, { e: 0.6, l: 1.8, anim: true });
    showBoard(true);
    camTo([1.4, 0, 10], [0.8, 0, 0]);
    hud.show(true);
    ctl.clear();
    ctl.slider({ label: '离心率 e', min: 0.15, max: 1.7, step: 0.01, value: ec.e, fmt: (v) => v.toFixed(2), onInput: (v) => { ec.e = v; } });
    ctl.slider({ label: '半通径 ℓ', min: 0.8, max: 3, step: 0.05, value: ec.l, fmt: (v) => v.toFixed(2), onInput: (v) => { ec.l = v; } });
    ctl.sep();
    [
      ['椭圆 e=0.6', 0.6], ['抛物线 e=1', 1.0], ['双曲线 e=1.5', 1.5],
    ].forEach(([label, v]) => {
      ctl.button({
        label, onClick() {
          ec.e = v;
          const input = ctl.el.querySelectorAll('input[type=range]')[0];
          if (input) { input.value = v; input.dispatchEvent(new Event('input', { bubbles: false })); }
        },
      });
    });
    ctl.toggle({ label: '准线', value: true, onChange: (v) => { ec.showD = v; } });
    ec.showD = true;
    chapterTick = (dt) => {
      const { e, l } = ec;
      const runs = conicPolarPts(e, l);
      const pts = [];
      runs.forEach((r) => { r.forEach((p) => pts.push(p)); pts.push(r[0].clone()); });
      mainCurve(pts, e < 1 ? COL.accent : e > 1 ? COL.blue : COL.green);
      board.auxDot('F', new THREE.Vector3(0, 0, 0), 0xd9534f);
      board.auxLabel('F', 'F', '#d9534f', new THREE.Vector3(0.2, 0.3, 0));
      if (ec.showD) {
        const xd = -l / e;
        board.auxLine(new THREE.Vector3(xd, -5, 0), new THREE.Vector3(xd, 5, 0), 0xd9a13f);
        board.auxLabel('dl', '准线', '#d9a13f', new THREE.Vector3(xd - 0.2, 4.5, 0), 0.005);
      }
      const type = e < 0.995 ? '椭圆' : e > 1.005 ? '双曲线' : '抛物线';
      board.auxLabel('t', `${type}（e = ${e.toFixed(2)}）`, '#e4ebf1', new THREE.Vector3(1.2, 5.0, 0), 0.0068, 'rgba(10,16,24,0.6)');
      ec.t = (ec.t || 0) + dt * 0.3;
      if (ec.anim && runs.length) {
        const all = runs.flat();
        const p = all[Math.floor(ec.t * all.length) % all.length];
        board.auxDot('P', p, 0xd9a13f, 0.07);
        const dLine = Math.abs(p.x + l / e);
        board.auxLine(p, new THREE.Vector3(p.x + l / e, p.y, 0), 0x2fb3a5);
        hud.set('v1', `|PF|/Pd = ${(p.length() / dLine).toFixed(3)} = e`);
      }
      hud.set('v2', type === '抛物线' ? 'e = 1 恰好撕开闭合曲线' : `e ${e < 1 ? '<' : '>'} 1`);
      hud.set('v3', 'r = ℓ/(1 − e·cosψ)');
    };
  },
};

/* ================= 章节 7：光学性质 ================= */

const op = { which: 'ellipse', nRays: 9, anim: true };

const secOptics = {
  id: 'optics', title: '光学性质',
  html: `<p>圆锥曲线是"会聚光的形状"——三种曲线各有分工：</p>
<p><b>椭圆</b>：从焦点 F₁ 发出的光，经椭圆反射后<b>全部汇聚到另一焦点 F₂</b>（响石/耳语廊原理）。<b>抛物线</b>：平行于轴的入射光反射后<b>汇聚于焦点</b>——探照灯、卫星天线、射电望远镜的锅面都是抛物线。<b>双曲线</b>：朝一个焦点射去的光，反射后像是从另一焦点发出（反方向延长线过 F₂）。</p>
<p>反射角 = 入射角的严格证明依赖切线，这里直接展示光线走出来的效果。切换曲线类型、调节数值、开/关动画。</p>`,
  enter() {
    Object.assign(op, { which: 'ellipse', nRays: 9, anim: true });
    showBoard(true);
    camTo([0, 0, 9.6], [0, 0, 0]);
    hud.show(true);
    ctl.clear();
    ctl.seg({
      options: [{ label: '椭圆', value: 'ellipse' }, { label: '抛物线', value: 'parabola' }, { label: '双曲线', value: 'hyperbola' }],
      value: op.which,
      onChange: (v) => { op.which = v; },
    });
    ctl.sep();
    ctl.slider({ label: '光线数', min: 3, max: 16, step: 1, value: 9, fmt: (v) => String(v), onInput: (v) => { op.nRays = v; } });
    ctl.toggle({ label: '动画', value: true, onChange: (v) => { op.anim = v; } });
    chapterTick = (dt) => {
      if (op.anim) op.t = (op.t || 0) + dt * 0.12;
      drawOptics();
    };
    drawOptics();
  },
};

function drawOptics() {
  const gold = new THREE.Color(0xffe08a);
  board.reset();
  const rays = op.nRays;
  if (op.which === 'ellipse') {
    const a = 4.4, c = 2.6, b = Math.sqrt(a * a - c * c);
    mainCurve(ellipsePts(a, b), COL.accent);
    const f1 = new THREE.Vector3(-c, 0, 0), f2 = new THREE.Vector3(c, 0, 0);
    board.auxDot('f1', f1, 0xd9534f); board.auxDot('f2', f2, 0xd9534f);
    board.auxLabel('f1', 'F₁', '#d9534f', f1.clone().add(new THREE.Vector3(-0.2, 0.32, 0)));
    board.auxLabel('f2', 'F₂', '#d9534f', f2.clone().add(new THREE.Vector3(0.2, 0.32, 0)));
    for (let i = 0; i < rays; i++) {
      const th = (i / rays) * TAU + (op.anim ? (op.t * TAU / rays) : 0);
      const p = new THREE.Vector3(a * Math.cos(th), b * Math.sin(th), 0);
      board.auxLine(f1, p, 0xffe08a);
      board.auxLine(p, f2, 0xffb35c);
    }
    hud.set('v1', 'F₁ 出发 → 反射 → 全部回到 F₂');
    hud.set('v2', '耳语廊：一个焦点耳语，另一焦点听清');
    hud.set('v3', `e = ${(c / a).toFixed(2)}`);
  } else if (op.which === 'parabola') {
    const p = 1.7;
    mainCurve(parabolaPts(p, 4.8), COL.accent);
    const f = new THREE.Vector3(p / 2, 0, 0);
    board.auxDot('f', f, 0xd9534f);
    board.auxLabel('f', 'F', '#d9534f', f.clone().add(new THREE.Vector3(0, 0.35, 0)));
    for (let i = 0; i < rays; i++) {
      const y = -4.6 + (9.2) * (i / (rays - 1)) + (op.anim ? Math.sin(op.t * TAU) * 0.2 : 0);
      const x = y * y / (2 * p);
      const pt = new THREE.Vector3(x, y, 0);
      const enter = new THREE.Vector3(x - 2.5 - (4.8 - x) * 0.6, y, 0);
      board.auxLine(enter, pt, 0xffe08a);
      board.auxLine(pt, f, 0xffb35c);
    }
    hud.set('v1', '平行光 → 反射 → 汇聚于焦点 F');
    hud.set('v2', '探照灯 / 锅形天线 / 太阳灶');
    hud.set('v3', `y² = ${(2 * p).toFixed(1)}x`);
  } else {
    const a = 2.4, c = 3.4, b = Math.sqrt(c * c - a * a);
    mainCurve(hyperbolaPts(a, b, 1.9), COL.accent);
    const f1 = new THREE.Vector3(-c, 0, 0), f2 = new THREE.Vector3(c, 0, 0);
    board.auxDot('f1', f1, 0xd9534f); board.auxDot('f2', f2, 0xd9534f);
    board.auxLabel('f1', 'F₁', '#d9534f', f1.clone().add(new THREE.Vector3(-0.2, 0.32, 0)));
    board.auxLabel('f2', 'F₂', '#d9534f', f2.clone().add(new THREE.Vector3(0.2, 0.32, 0)));
    for (let i = 0; i < rays; i++) {
      const th = -Math.PI * 0.42 + (Math.PI * 0.84) * (i / (rays - 1)) + (op.anim ? Math.sin(op.t * TAU) * 0.05 : 0);
      const dir = new THREE.Vector3(Math.cos(th), Math.sin(th), 0);
      // 近似取曲线上的对应点（参数 t 按角度粗配）
      const t = clamp(th / (Math.PI * 0.42), -1.9, 1.9);
      const pt = new THREE.Vector3(a * Math.cosh(Math.abs(t)), b * Math.sinh(t), 0);
      const far = pt.clone().add(dir.clone().multiplyScalar(-3));
      board.auxLine(far, pt, 0xffe08a);
      const out = pt.clone().sub(f2).setLength(2.6).add(pt);
      board.auxLine(pt, out, 0xffb35c);
    }
    hud.set('v1', '朝 F₂ 射去 → 反射后好像从 F₁ 发出');
    hud.set('v2', '反射光线反向延长过另一焦点');
    hud.set('v3', `x²/${a}² − y²/${b.toFixed(1)}² = 1`);
  }
}

/* ================= 章节 8：直线与圆锥曲线 ================= */

const lc = { which: 'ellipse', k: 0.5, m: 0.4 };

const secLineConic = {
  id: 'lineconic', title: '直线与圆锥曲线',
  html: `<p>直线 y = kx + m 与曲线联立，消元后得到一元二次方程 Ax² + Bx + C = 0，<b>判别式 Δ = B² − 4ac</b> 决定交点个数：</p>
<p><b>Δ &gt; 0</b>：两个交点（割线）；<b>Δ = 0</b>：一个交点（切线）；<b>Δ &lt; 0</b>：没有交点（相离）。⚠️ 抛物线与平行于对称轴的直线、双曲线与平行于渐近线的直线是"一次方程"特例——只有一个交点但不相切。</p>
<p>拖动 k 和 m，让直线扫过椭圆：读数实时给出 A、B、C、Δ 与交点坐标；调出 Δ = 0 惊险一瞬，就是"切线"。</p>`,
  enter() {
    Object.assign(lc, { which: 'ellipse', k: 0.5, m: 0.4 });
    showBoard(true);
    camTo([0, 0, 10], [0, 0, 0]);
    hud.show(true);
    ctl.clear();
    ctl.seg({
      options: [{ label: '椭圆', value: 'ellipse' }, { label: '双曲线', value: 'hyperbola' }, { label: '抛物线', value: 'parabola' }],
      value: lc.which,
      onChange: (v) => { lc.which = v; },
    });
    ctl.sep();
    ctl.slider({ label: 'k 斜率', min: -2.5, max: 2.5, step: 0.05, value: lc.k, fmt: (v) => v.toFixed(2), onInput: (v) => { lc.k = v; } });
    ctl.slider({ label: 'm 截距', min: -3.5, max: 3.5, step: 0.05, value: lc.m, fmt: (v) => v.toFixed(2), onInput: (v) => { lc.m = v; } });
    chapterTick = () => drawLineConic();
    drawLineConic();
  },
};

function drawLineConic() {
  board.reset();
  const { k, m, which } = lc;
  let A, B, C;      // 联立后的二次系数
  let eqText = '';
  if (which === 'ellipse') {
    const a = 4.2, b = 2.8;
    mainCurve(ellipsePts(a, b), COL.accent);
    A = b * b + a * a * k * k;
    B = 2 * a * a * k * m;
    C = a * a * m * m - a * a * b * b;
    eqText = `x²/${a}² + y²/${b}² = 1`;
  } else if (which === 'hyperbola') {
    const a = 2.6, b = 2.2;
    mainCurve(hyperbolaPts(a, b, 1.8), COL.accent);
    A = b * b - a * a * k * k;
    B = -2 * a * a * k * m;
    C = -(a * a * m * m + a * a * b * b);
    eqText = `x²/${a}² − y²/${b}² = 1`;
  } else {
    const p = 1.7;
    mainCurve(parabolaPts(p, 4.6), COL.accent);
    // y² = 2px 代入 y = kx+m: (kx+m)² = 2px → k²x² + (2km−2p)x + m² = 0
    A = k * k;
    B = 2 * k * m - 2 * p;
    C = m * m;
    eqText = `y² = ${(2 * p).toFixed(1)}x`;
  }
  board.auxLabel('eq', eqText, '#8a94a3', new THREE.Vector3(0, 5.1, 0), 0.0052);
  // 直线
  const l1 = new THREE.Vector3(-5.4, k * -5.4 + m, 0);
  const l2 = new THREE.Vector3(5.4, k * 5.4 + m, 0);
  board.auxLine(l1, l2, COL.blue);
  board.auxLabel('leq', `y = ${k.toFixed(2)}x ${m >= 0 ? '+' : '−'} ${Math.abs(m).toFixed(2)}`, '#4a90d9', new THREE.Vector3(l2.x - 1.4, l2.y + 0.4, 0), 0.005);
  // 判别式
  const D = B * B - 4 * A * C;
  let countText;
  if (Math.abs(A) < 1e-9) {
    // 一次方程：直线平行于对称轴/渐近线
    if (Math.abs(B) > 1e-9) {
      const x = -C / B, y = k * x + m;
      board.auxDot('r1', new THREE.Vector3(x, y, 0), 0xd9a13f, 0.08);
      countText = '直线平行于轴/渐近线：恰 1 个交点（非切线）';
    } else countText = '直线与曲线无标准联立（特殊位置）';
  } else if (D > 1e-9) {
    const x1 = (-B + Math.sqrt(D)) / (2 * A), x2 = (-B - Math.sqrt(D)) / (2 * A);
    board.auxDot('r1', new THREE.Vector3(x1, k * x1 + m, 0), 0xd9a13f, 0.08);
    board.auxDot('r2', new THREE.Vector3(x2, k * x2 + m, 0), 0xd9a13f, 0.08);
    board.auxLabel('r1', `(${x1.toFixed(2)}, ${(k * x1 + m).toFixed(2)})`, '#d9a13f', new THREE.Vector3(x1, k * x1 + m + 0.35, 0), 0.0045);
    board.auxLabel('r2', `(${x2.toFixed(2)}, ${(k * x2 + m).toFixed(2)})`, '#d9a13f', new THREE.Vector3(x2, k * x2 + m + 0.35, 0), 0.0045);
    countText = 'Δ > 0：两个交点（割线）';
  } else if (D > -1e-9) {
    const x = -B / (2 * A), y = k * x + m;
    board.auxDot('r1', new THREE.Vector3(x, y, 0), 0x3fa96f, 0.09);
    board.auxLabel('r1', `切点 (${x.toFixed(2)}, ${y.toFixed(2)})`, '#3fa96f', new THREE.Vector3(x, y + 0.4, 0), 0.0045);
    countText = 'Δ = 0：一个交点（切线！）';
  } else {
    countText = 'Δ < 0：没有交点（相离）';
  }
  hud.set('v1', countText);
  hud.set('v2', `A=${A.toFixed(2)} B=${B.toFixed(2)} C=${C.toFixed(2)}`);
  hud.set('v3', `Δ = B²−4AC = ${D.toFixed(3)}`);
}

/* ================= 章节 9：随堂检测 ================= */

const QUIZ = [
  {
    q: '平面截对顶圆锥，截面倾斜角恰好等于半锥角时，截线是？',
    opts: ['圆', '椭圆', '抛物线', '双曲线'],
    a: 2,
    ex: '倾角 < α 得椭圆，= α（平行于某条母线）得抛物线，> α 穿过两叶得双曲线，倾角为 0（垂直于轴）得圆。',
  },
  {
    q: 'Dandelin 双球说明：椭圆的两个焦点是？',
    opts: ['任意取的两个定点', '两球与截平面的切点', '圆锥的顶点和重心', '截面与轴的交点'],
    a: 1,
    ex: '与圆锥面相切又与截面相切的两个球，与截面各接触一点——这两个切点就是焦点。同一切点到同一球的两条切线等长，立刻推出 PF₁+PF₂ 为定值。',
  },
  {
    q: '椭圆 x²/25 + y²/16 = 1 的离心率是？',
    opts: ['3/5', '4/5', '5/4', '√41/5'],
    a: 0,
    ex: 'a=5，b=4，c=√(25−16)=3，e = c/a = 3/5。',
  },
  {
    q: '双曲线的渐近线由什么决定？',
    opts: ['只由 a 决定', '只由 b 决定', '由 b/a 决定', '由 c 决定'],
    a: 2,
    ex: '渐近线 y = ±(b/a)x，斜率由 b/a 决定；c 只决定焦点的位置。',
  },
  {
    q: '探照灯、卫星天线的锅面为什么做成抛物线？',
    opts: ['加工方便', '平行于轴的光线反射后汇聚于焦点', '抛物线最省材料', '焦点在曲线上'],
    a: 1,
    ex: '抛物线的光学性质：平行于对称轴的入射线经反射后全部过焦点——把光源放焦点上，反射光就是平行光束。',
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
  activeCleanup = () => panel.remove();
}

/* ---------------- 启动 ---------------- */

const SECTIONS = [secCut, secDandelin, secEllipse, secHyperbola, secParabola, secEcc, secOptics, secLineConic, {
  id: 'quiz', title: '随堂检测',
  html: `<p>5 道题检验本章掌握情况。答完可重新开始。</p>`,
  enter() {
    showBoard(true);
    board.reset();
    camTo([0, 0, 9.6], [0, 0, 0]);
    hud.show(false);
    ctl.clear();
    chapterTick = null;
    // 背景放一个装饰椭圆
    board.curve = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(ellipsePts(4.4, 2.6)),
      new THREE.LineBasicMaterial({ color: COL.dim, transparent: true, opacity: 0.3 })
    );
    boardG.add(board.curve);
    showQuiz();
  },
}];

const sections = createSections({
  nav: document.getElementById('sideNav'),
  descPanel: document.getElementById('descPanel'),
  sections: SECTIONS,
  onSelect(i, sec) {
    if (activeCleanup) { activeCleanup(); activeCleanup = null; }
    chapterTick = null;
    if (sec.leave) sec.leave();
    sec.enter();
  },
});
window.__eduSections = sections;
sections.select(0);

window.__scene = scene;  // 调试钩子
app.onFrame((dt) => {
  cameraTweenTick(app, dt);
  if (chapterTick) chapterTick(dt);
});

loader.hide();
