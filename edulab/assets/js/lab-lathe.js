/* EduLab · lab-lathe.js — 车床虚拟仿真教学实验（职校机械加工 · 在线操作演示）
   本文件为全新自研实现（本仓代码自研原则）：three.js r170 程序化建模，零外部资产。
   结构约定（与 machine 页同构的页面骨架）：
     左栏章节大纲 / 中栏 3D 车间舞台（OrbitControls + 章节机位） / 右栏三手风琴（详解·控件·读数）
   车削仿真核心：工件截面轮廓点数组（每 2mm 一站）→ LatheGeometry 每帧重建，禁止缩放作弊。
   尺寸依据：CA6140 普通车床公开样本数据（床身最大回转直径 φ400 等，教学基准）。
   确定性截图：?still=1&shot=front|side|left|right|top|near|far|ch1..ch8[&theme=light|dark] */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/* ============================== 常量区 ============================== */

// 场景比例：1 单位 = 100 mm（CA6140 整机约 25 单位长）
const U = 0.01;
const mm2u = (v) => v * U;

// CA6140 普通车床公开样本参数（教学演示基准）
const SPEC = {
  swingDia: 400,        // 床身上最大回转直径 φ400 mm
  workLenMax: 1000,     // 最大工件长度 1000 mm（另有 750 变型）
  spindleBore: 52,      // 主轴孔径 φ52 mm
  speedMin: 10,         // 主轴转速 10~1400 r/min（正转 18 级）
  speedMax: 1400,
  speedSteps: 18,
  feedMin: 0.028,       // 进给量 0.028~6.33 mm/r
  feedMax: 6.33,
  motorKw: 7.5,         // 主电机 7.5 kW
};

// lathe 材质档位（切削仿真用）：name / v Range m·min⁻¹ / f mm·r⁻¹ / ap mm / Ra μm 档位 / 表面色
// 45钢: v 60-100, f 0.2-0.4, ap 1-3, Ra 1.6-3.2
// 铝合金: v 150-300, f 0.1-0.3, ap 0.5-2, Ra 0.8-1.6
// 不锈钢: v 50-80, f 0.15-0.3, ap 0.5-1.5, Ra 0.8-1.6（易粘刀提示）
// 灰铸铁: v 60-90, f 0.2-0.4, ap 1-3, Ra 1.6-3.2（崩碎切屑）
const WORK_MATERIALS = {
  steel45:   { name: '45 钢',  vMin: 60,  vMax: 100, fMin: 0.2,  fMax: 0.4,  apMin: 1,   apMax: 3,   raLo: 1.6, raHi: 3.2, kb: 2000, chip: 0x6a6ab4, metal: 0x9fa8b0, rough: 0.42, note: '中碳钢代表，切屑连续卷曲' },
  alu:       { name: '铝合金', vMin: 150, vMax: 300, fMin: 0.1,  fMax: 0.3,  apMin: 0.5, apMax: 2,   raLo: 0.8, raHi: 1.6, kb: 1500, chip: 0xdde3e8, metal: 0xcfd6da, rough: 0.28, note: '高速好切，易获得光亮表面' },
  stainless: { name: '不锈钢', vMin: 50,  vMax: 80,  fMin: 0.15, fMax: 0.3,  apMin: 0.5, apMax: 1.5, raLo: 0.8, raHi: 1.6, kb: 2500, chip: 0x8f84ad, metal: 0xb4bac0, rough: 0.38, note: '导热差易粘刀，切削力偏大', sticky: true },
  castiron:  { name: '灰铸铁', vMin: 60,  vMax: 90,  fMin: 0.2,  fMax: 0.4,  apMin: 1,   apMax: 3,   raLo: 1.6, raHi: 3.2, kb: 1800, chip: 0x8a4a3a, metal: 0x716c66, rough: 0.78, note: '崩碎切屑，注意防尘', crumbly: true },
};

// 用户可调参数（跨章共享）
const P = { mat: 'steel45', v: 80, f: 0.25, ap: 1.5, overhang: 100, tail: false, showAxes: false, faceKind: 'flat' };

/* ============================== DOM 基础 ============================== */

const $ = (id) => document.getElementById(id);
const els = {
  shell: $('latheShell'), stage: $('stage'), labels: $('latheLabels'),
  chapNav: $('chapNav'), chapCount: $('chapCount'), railNoL: $('railNoL'),
  detailNo: $('detailNo'), detailTitle: $('detailTitle'), railTitleR: $('railTitleR'),
  lesson: $('lesson'), controls: $('controls'), lcData: $('lcData'),
  resetBtn: $('resetBtn'), labelBtn: $('labelBtn'), viewBtn: $('viewBtn'),
  qualBtn: $('qualBtn'), bigBtn: $('bigBtn'), focusBtn: $('focusBtn'),
};

const params = new URLSearchParams(location.search);
const STILL = params.get('still') === '1';
const SHOT = params.get('shot') || 'front';
const THEME_OVERRIDE = params.get('theme');
if (STILL) document.documentElement.classList.add('still');

/* ============================== 渲染基础 ============================== */

let renderer, scene, camera, controls;
let hemiLight, keyLight, fillLight, lampLight;
let qualityHi = true;
let disposed = false;

function initRenderer() {
  // WebGL2 可用性检查（three r170 仅支持 WebGL2），不可用给出文字降级
  const test = document.createElement('canvas');
  const gl = test.getContext('webgl2');
  if (!gl) {
    const loader = $('latheLoader');
    if (loader) loader.innerHTML = '<div style="max-width:420px;text-align:center;line-height:1.8">当前浏览器不支持 WebGL2，无法渲染 3D 车床。<br>请更换最新版 Chrome / Edge / Safari 后再试。</div>';
    throw new Error('WebGL2 unavailable');
  }
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  els.stage.appendChild(renderer.domElement);

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(42, 1, 0.1, 400);
  camera.position.set(-4, 13.5, 24);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.maxPolarAngle = 1.5;
  controls.minDistance = 2.2;
  controls.maxDistance = 95;
  controls.target.set(-1, 9, 0);

  hemiLight = new THREE.HemisphereLight(0xeef2f6, 0x8a8f94, 0.95);
  scene.add(hemiLight);
  keyLight = new THREE.DirectionalLight(0xffffff, 2.3);
  keyLight.position.set(14, 24, 16);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024);
  keyLight.shadow.camera.left = -26; keyLight.shadow.camera.right = 26;
  keyLight.shadow.camera.top = 26; keyLight.shadow.camera.bottom = -26;
  keyLight.shadow.camera.near = 2; keyLight.shadow.camera.far = 80;
  keyLight.shadow.bias = -0.0004;
  scene.add(keyLight);
  fillLight = new THREE.DirectionalLight(0xdfe8f2, 0.55);
  fillLight.position.set(-16, 10, -12);
  scene.add(fillLight);
  // 机床工作灯：一盏暖色点光模拟照明
  lampLight = new THREE.PointLight(0xffe2b0, 26, 20, 2);
  lampLight.position.set(-5.2, 12.6, 2.2);
  scene.add(lampLight);
}

/* 程序化环境贴图（PMREM）：竖直渐变天穹 + 两块亮板当“窗”，让金属件有反射高光，零外部资产 */
function buildEnv() {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = new THREE.Scene();
  const cv = document.createElement('canvas');
  cv.width = 2; cv.height = 128;
  const g2 = cv.getContext('2d');
  const gr = g2.createLinearGradient(0, 0, 0, 128);
  gr.addColorStop(0, '#f2f5f8'); gr.addColorStop(0.5, '#c9ced4'); gr.addColorStop(1, '#565c62');
  g2.fillStyle = gr; g2.fillRect(0, 0, 2, 128);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  const dome = new THREE.Mesh(new THREE.SphereGeometry(50, 16, 12), new THREE.MeshBasicMaterial({ side: THREE.BackSide, map: t }));
  env.add(dome);
  const win = new THREE.Mesh(new THREE.PlaneGeometry(30, 14), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  win.position.set(18, 14, 22); win.lookAt(0, 0, 0);
  env.add(win);
  const win2 = win.clone();
  win2.position.set(-24, 10, -16); win2.lookAt(0, 0, 0);
  env.add(win2);
  scene.environment = pmrem.fromScene(env, 0.04).texture;
  pmrem.dispose();
}

/* 主题：canvas 透明背景，页面 CSS 变量自动换肤；3D 内地面/灯光色手动切换 */
const THEME3D = {
  light: { ground: 0xd9dee3, groundEdge: 0xb9c0c7, hemiSky: 0xeef2f6, hemiGnd: 0x8a8f94 },
  dark:  { ground: 0x161d24, groundEdge: 0x232c34, hemiSky: 0x2a3340, hemiGnd: 0x10151a },
};
let groundDisc;
function applyTheme3D(dark) {
  const t = dark ? THEME3D.dark : THEME3D.light;
  hemiLight.color.set(t.hemiSky);
  hemiLight.groundColor.set(t.hemiGnd);
  if (groundDisc) {
    groundDisc.material.color.set(t.ground);
    groundDisc.userData.edge.material.color.set(t.groundEdge);
  }
}
function watchTheme() {
  const el = document.documentElement;
  const obs = new MutationObserver(() => applyTheme3D(el.getAttribute('data-theme') === 'dark'));
  obs.observe(el, { attributes: true, attributeFilter: ['data-theme'] });
  applyTheme3D(el.getAttribute('data-theme') === 'dark');
}

/* ============================== 材质工厂（每件独立实例，便于点选高亮） ============================== */

const matPaint = (c, r = 0.72, m = 0.16) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });
const CM = {
  green: () => matPaint(0x4a7a62, 0.72),            // 铸铁绿（床头箱/溜板/尾座）——粗糙度上调去塑料感
  greenDark: () => matPaint(0x3e6752, 0.68),
  cream: () => matPaint(0xc3c8c2, 0.68),            // 米灰（床身腿/底座）
  bedIron: () => matPaint(0x55746b, 0.74),          // 床身铸件
  way: () => new THREE.MeshStandardMaterial({ color: 0xc9ced4, roughness: 0.28, metalness: 0.88 }),   // 导轨亮金属
  chuck: () => new THREE.MeshStandardMaterial({ color: 0x3c4046, roughness: 0.5, metalness: 0.82 }), // 卡盘淬火钢（外圆带磨损哑光）
  chuckWear: () => new THREE.MeshStandardMaterial({ color: 0x5a6068, roughness: 0.3, metalness: 0.86 }), // 卡盘磨损亮环
  jaw: () => new THREE.MeshStandardMaterial({ color: 0x565b62, roughness: 0.42, metalness: 0.8 }),
  spindle: () => new THREE.MeshStandardMaterial({ color: 0xb8bec4, roughness: 0.32, metalness: 0.85 }),
  toolShank: () => matPaint(0x44484e, 0.5, 0.6),
  carbide: () => matPaint(0xc9a24a, 0.35, 0.5),
  dial: () => matPaint(0x2e3338, 0.45, 0.5),
  handle: () => matPaint(0xb04a3a, 0.5, 0.3),       // 手轮红棕
  rubber: () => matPaint(0x2a2e33, 0.9, 0),
  cable: () => matPaint(0x3a3f45, 0.8, 0.1),
  seam: () => matPaint(0x2b3a32, 0.66, 0.2),        // 箱体分缝暗线（深绿近黑）
  recess: () => matPaint(0x30353a, 0.62, 0.4),      // 铸造工艺孔/内凹暗示
  bronze: () => matPaint(0xa8793e, 0.42, 0.7),      // 油标窗铜圈
  plate: () => new THREE.MeshStandardMaterial({ color: 0x9aa2a8, roughness: 0.38, metalness: 0.62 }), // 铭牌金属
  oilGlass: () => new THREE.MeshStandardMaterial({ color: 0x6b4a1e, roughness: 0.12, metalness: 0.2, transparent: true, opacity: 0.72 }), // 油标窗玻璃
  lampGreen: () => new THREE.MeshStandardMaterial({ color: 0x1d3a28, emissive: 0x2fae5e, emissiveIntensity: 1.6, roughness: 0.4 }),
  lampRed: () => new THREE.MeshStandardMaterial({ color: 0x3a1d1d, emissive: 0xd9483a, emissiveIntensity: 1.6, roughness: 0.4 }),
};

function mesh(geo, mat, opts = {}) {
  const o = new THREE.Mesh(geo, mat);
  if (opts.p) o.position.set(...opts.p);
  if (opts.r) o.rotation.set(...opts.r);
  if (opts.s) o.scale.setScalar(opts.s);
  o.castShadow = !!opts.cast;
  o.receiveShadow = !!opts.recv;
  if (opts.name) o.name = opts.name;
  return o;
}
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const cyl = (rt, rb, h, seg = 32, open = false) => new THREE.CylinderGeometry(rt, rb, h, seg, 1, open);
const cylinderX = (r, len, seg = 32) => { const g = cyl(r, r, len, seg); g.rotateZ(-Math.PI / 2); return g; }; // 轴向 X

/* 极简几何合并（本仓 three addons 无 BufferGeometryUtils，自写够用版）：
   全部转 non-indexed 后拼接 position/normal/uv。用于同类小细节合并成一个 mesh 控 draw call。 */
function mergeGeos(list) {
  const geos = list.map((g) => (g.index ? g.toNonIndexed() : g));
  let total = 0;
  for (const g of geos) total += g.attributes.position.count;
  const pos = new Float32Array(total * 3), nor = new Float32Array(total * 3), uv = new Float32Array(total * 2);
  let off = 0;
  for (const g of geos) {
    pos.set(g.attributes.position.array, off * 3);
    nor.set(g.attributes.normal.array, off * 3);
    if (g.attributes.uv) uv.set(g.attributes.uv.array, off * 2);
    off += g.attributes.position.count;
    g.dispose();
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  out.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return out;
}
/* 批量小件烘焙：items = [geo, x?, y?, z?, rx?, ry?, rz?] → 单 mesh（共享一份材质，便于整组点选高亮） */
function bakedMesh(items, mat, name) {
  const parts = items.map(([g, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0]) => {
    const m = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(rx, ry, rz));
    m.setPosition(x, y, z);
    return g.clone().applyMatrix4(m);
  });
  const o = new THREE.Mesh(mergeGeos(parts), mat);
  o.castShadow = true;
  if (name) o.name = name;
  return o;
}
/* 弧形板（绕 X 轴的部分圆环壳，曲率贴主轴外圆）：Rin→Rout，弧角 rad，挤出宽 width(轴向 X)
   返回 geometry 已旋转：圆心在原点、弧面法向径向、宽沿 X 居中。作爪背/卡盘导轨槽等。 */
function arcPlateX(rIn, rOut, theta, width, seg = 20) {
  const s = new THREE.Shape();
  s.absarc(0, 0, rOut, -theta / 2, theta / 2, false);
  s.absarc(0, 0, rIn, theta / 2, -theta / 2, true);
  const g = new THREE.ExtrudeGeometry(s, { depth: width, bevelEnabled: false, curveSegments: seg });
  g.translate(0, 0, -width / 2); // 挤出方向居中（截面圆心保持在原点，不整体 center）
  g.rotateY(Math.PI / 2); // Z→X：宽沿轴向 X，弧面圆心在原点（径向即 Y/Z）
  return g;
}

/* 爪体一体轮廓（AT-097-R3）：侧视楼梯形，外露棱全部 45° 倒角；挤出前后缘再以 bevel 倒角。
   bevelOffset 取负补偿轮廓外扩，壁面精确落在设计坐标上。消灭近景「积木感」直角硬块。 */
function jawBodyGeo() {
  const p = [
    [-3.82, 0.61], [-3.10, 0.61], [-3.06, 0.65],    // 底面（闭合夹持基准 y0.61）+ 前下倒角
    [-3.06, 0.95], [-3.075, 0.965],                 // 前脸 + 上台前缘倒角
    [-3.125, 0.965], [-3.14, 0.98], [-3.14, 1.21],  // 上台阶 + 凹角倒角 + 后脸
    [-3.18, 1.25], [-3.82, 1.25], [-3.86, 1.21],    // 顶面两端倒角（爪体顶部外缘）
    [-3.86, 0.65],                                  // 后下倒角
  ];
  const s = new THREE.Shape();
  s.moveTo(p[0][0], p[0][1]);
  for (let i = 1; i < p.length; i++) s.lineTo(p[i][0], p[i][1]);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.43, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelOffset: -0.015, bevelSegments: 1 });
  g.translate(0, 0, -0.215); // 含前后 bevel 共厚 0.46，居中
  return g;
}

/* 爪牙细齿（AT-097-R3）：密集连续齿排单齿——齿宽 0.028 > 齿距间隙 0.014，等距等深，棱边倒角 */
function jawFinGeo() {
  const w = 0.028, h = 0.34, c = 0.006;
  const s = new THREE.Shape();
  s.moveTo(-w / 2 + c, 0); s.lineTo(w / 2 - c, 0); s.lineTo(w / 2, c);
  s.lineTo(w / 2, h - c); s.lineTo(w / 2 - c, h); s.lineTo(-w / 2 + c, h);
  s.lineTo(-w / 2, h - c); s.lineTo(-w / 2, c);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.012, bevelEnabled: true, bevelThickness: 0.003, bevelSize: 0.003, bevelOffset: -0.003, bevelSegments: 1 });
  g.translate(0, 0, -0.006); // 含前后 bevel 共厚 0.018，居中
  return g;
}

/* ============================== 整机建模（CA6140 式卧式车床，程序化） ============================== */

const machine = new THREE.Group();
let spindleGroup, chuckBody, chuckFaceRing, jawPivots = [], chuckKey, keySpin = 0;
let workMesh, faceCap, workGroup;
let carriage, apron, crossDial, toolGroup, compRest;
let tailstock, quill, tailCenter, tailWheel, tailQuillLen = 0.2;
let leadscrew, feedRod;
let lampShade, lampBulb;

// 工件几何基准（mm）：毛坯 φ60×220，卡盘端面 x=-3.8u，爪外留出长度可调
const CHUCK_FACE_X = -3.8;      // 卡盘端面（工件坐标 Z0 可建在此处）
const CHUCK_BODY_R = 1.3;       // 卡盘体外圆半径（壳体/爪背弧板/滚花同源曲率，禁各写独立半径）
const JAW_TRAVEL = 0.3;         // 爪径向开合全行程（setJaws 位移与爪背弧板基准同源共用）
const STOCK_R = 30;             // 毛坯半径 mm
const STOCK_LEN = 220;          // 毛坯总长 mm
const N_ST = 111;               // 轮廓站位数（每 2 mm 一站）

// 工件状态（跨章持久；重做按钮复位）
const WP = {
  r: null,          // Float32Array(N_ST)，每站半径 mm
  L: 100,           // 当前自由端长度（伸出长度）mm
  cutVol: 0,        // 累计去除体积 mm³
  passes: [],       // 走刀记录
  chamfer: 0,       // 倒角 C 值 mm
  faceState: 'flat' // 端面状态 flat/convex/concave
};

function floorBuild() {
  groundDisc = mesh(new THREE.CircleGeometry(60, 64), new THREE.MeshStandardMaterial({ color: 0xd9dee3, roughness: 0.95, metalness: 0 }), { r: [-Math.PI / 2, 0, 0], recv: true });
  const edge = mesh(new THREE.RingGeometry(52, 53, 64), new THREE.MeshBasicMaterial({ color: 0xb9c0c7, transparent: true, opacity: 0.5 }), { r: [-Math.PI / 2, 0, 0], p: [0, 0.01, 0] });
  groundDisc.userData.edge = edge;
  scene.add(groundDisc, edge);
}

function bedBuild() {
  const bed = new THREE.Group(); bed.name = 'bed';
  // 床身铸件：平床身主体
  bed.add(mesh(box(22, 1.5, 4.4), CM.bedIron(), { p: [0, 7.2, 0], cast: true, recv: true }));
  // 山形导轨棱线（两条三角棱，前后各一）
  const wayGeo = new THREE.ExtrudeGeometry(new THREE.Shape().moveTo(-0.55, 0).lineTo(0.55, 0).lineTo(0, 0.38).closePath(), { depth: 22, bevelEnabled: false });
  // 旋转后棱体沿 +X 长 22（0..22），平移 -11 对齐床身；截面三角形在 ZY 平面，mesh 定位 z=±1.15
  wayGeo.rotateY(Math.PI / 2); wayGeo.translate(-11, 0, 0);
  for (const z of [-1.15, 1.15]) bed.add(mesh(wayGeo, CM.way(), { p: [0, 7.95, z], cast: true }));
  // 两端床腿/底座箱（中段悬空，方便排屑）
  bed.add(mesh(box(6.6, 6.45, 3.6), CM.cream(), { p: [-7.7, 3.22, 0], cast: true, recv: true }));
  bed.add(mesh(box(5.6, 6.45, 3.6), CM.cream(), { p: [8.2, 3.22, 0], cast: true, recv: true }));
  // 床腿顶与床身底交界：深色分缝线（消灭「一整块」感）
  bed.add(bakedMesh([
    [box(6.7, 0.07, 3.66), -7.7, 6.44, 0],
    [box(5.7, 0.07, 3.66), 8.2, 6.44, 0],
    [box(6.7, 0.05, 0.05), -7.7, 3.2, 1.82],   // 床腿竖向分段缝
    [box(6.7, 0.05, 0.05), -7.7, 1.8, 1.82],
    [box(5.7, 0.05, 0.05), 8.2, 3.2, 1.82],
    [box(5.7, 0.05, 0.05), 8.2, 1.8, 1.82],
    [box(0.05, 6.4, 0.05), -6.2, 3.2, 1.82],   // 床腿竖缝
    [box(0.05, 6.4, 0.05), 9.7, 3.2, 1.82],
  ], CM.seam()));
  // 床身侧壁铸造工艺孔暗示（深色内凹矩形贴面，前后侧错布）+ 内层亮边层次
  bed.add(bakedMesh([
    [box(1.0, 0.6, 0.05), -3.2, 7.25, 2.21],
    [box(1.0, 0.6, 0.05), 2.6, 7.25, 2.21],
    [box(1.0, 0.6, 0.05), -0.4, 7.25, -2.21],
    [box(1.0, 0.6, 0.05), 4.8, 7.25, -2.21],
    [box(0.6, 0.38, 0.07), -3.2, 7.25, 2.215],
    [box(0.6, 0.38, 0.07), 2.6, 7.25, 2.215],
    [box(0.6, 0.38, 0.07), -0.4, 7.25, -2.215],
    [box(0.6, 0.38, 0.07), 4.8, 7.25, -2.215],
  ], CM.recess()));
  // 床身铭牌（两层叠层浅浮雕）
  bed.add(mesh(box(1.5, 0.5, 0.05), CM.plate(), { p: [1.2, 7.0, 2.24] }));
  bed.add(mesh(box(1.32, 0.36, 0.055), CM.cream(), { p: [1.2, 7.0, 2.26] }));
  machine.add(bed);
  return bed;
}

function headstockBuild() {
  const hs = new THREE.Group(); hs.name = 'headstock';
  hs.add(mesh(box(5.6, 4.6, 5.0), CM.green(), { p: [-8.2, 10.3, 0], cast: true, recv: true }));
  hs.add(mesh(box(5.7, 0.5, 5.1), CM.greenDark(), { p: [-8.2, 12.6, 0], cast: true }));   // 顶盖
  // —— 前面板分缝：左右两块凸面板 + 中缝 + 上下横缝（打破「纯平面绿盒」）
  hs.add(mesh(box(2.42, 3.7, 0.12), CM.greenDark(), { p: [-9.42, 10.3, 2.5], cast: true }));
  hs.add(mesh(box(2.42, 3.7, 0.12), CM.greenDark(), { p: [-6.98, 10.3, 2.5], cast: true }));
  hs.add(bakedMesh([
    [box(0.12, 4.42, 0.1), -8.2, 10.35, 2.49],   // 中央竖缝
    [box(5.62, 0.07, 0.1), -8.2, 12.08, 2.49],   // 顶部横缝
    [box(5.62, 0.07, 0.1), -8.2, 8.5, 2.49],     // 底部横缝
  ], CM.seam()));
  // —— 皮带轮罩：正面左下半圆弧罩壳 + 中心轴帽
  {
    const s = new THREE.Shape();
    s.absarc(0, 0, 0.64, Math.PI, Math.PI * 2, false);
    s.absarc(0, 0, 0.34, Math.PI * 2, Math.PI, true);
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.16, bevelEnabled: false, curveSegments: 28 });
    hs.add(mesh(g, CM.greenDark(), { p: [-9.9, 9.5, 2.48], cast: true }));
    hs.add(mesh(cyl(0.1, 0.12, 0.14, 24), CM.dial(), { p: [-9.9, 9.5, 2.62], r: [Math.PI / 2, 0, 0] }));
  }
  // —— 油标窗：铜圈 + 琥珀玻璃 + 深色油腔（一眼认出「油窗」）
  hs.add(mesh(new THREE.TorusGeometry(0.3, 0.035, 12, 48), CM.bronze(), { p: [-7.9, 11.4, 2.6] }));
  hs.add(mesh(cyl(0.27, 0.27, 0.05, 48), CM.oilGlass(), { p: [-7.9, 11.4, 2.56], r: [Math.PI / 2, 0, 0] }));
  hs.add(mesh(cyl(0.21, 0.21, 0.06, 32), new THREE.MeshStandardMaterial({ color: 0x2b1d08, roughness: 0.3, metalness: 0.1 }), { p: [-7.9, 11.4, 2.52], r: [Math.PI / 2, 0, 0] }));
  // —— 铭牌：两层叠层浅浮雕
  hs.add(mesh(box(1.3, 0.62, 0.03), CM.plate(), { p: [-8.2, 9.45, 2.58] }));
  hs.add(mesh(box(1.12, 0.44, 0.036), CM.cream(), { p: [-8.2, 9.45, 2.6] }));
  // —— 变速手柄塔 ×3：六角底座塔 + 塔柱 + 斜杆 + 球头
  {
    const towers = [[-9.5, 10.6], [-8.2, 11.0], [-6.9, 10.65]];
    hs.add(bakedMesh(towers.flatMap(([tx, ty]) => [
      [cyl(0.16, 0.19, 0.14, 6), tx, ty, 2.62],
      [cyl(0.07, 0.09, 0.2, 16), tx, ty + 0.14, 2.66],
      [cyl(0.035, 0.035, 0.62, 12), tx, ty + 0.42, 2.82, 0.55, 0, 0], // 杆前倾
    ]), CM.dial()));
    hs.add(bakedMesh(towers.flatMap(([tx, ty]) => [
      [new THREE.SphereGeometry(0.13, 20, 16), tx, ty + 0.66, 2.98],
    ]), CM.handle()));
  }
  // —— 加油孔 ×2：顶面小凸台 + 深色圆盖 + 一字槽
  hs.add(bakedMesh([
    [cyl(0.13, 0.15, 0.1, 20), -9.3, 12.7, 1.1],
    [cyl(0.13, 0.15, 0.1, 20), -9.3, 12.7, -1.1],
  ], CM.greenDark()));
  hs.add(bakedMesh([
    [cyl(0.14, 0.14, 0.05, 20), -9.3, 12.77, 1.1],
    [cyl(0.14, 0.14, 0.05, 20), -9.3, 12.77, -1.1],
    [box(0.18, 0.025, 0.035), -9.3, 12.8, 1.1],
    [box(0.18, 0.025, 0.035), -9.3, 12.8, -1.1],
  ], CM.dial()));
  // 电机箱（床身尾部内嵌）
  hs.add(mesh(box(1.6, 1.6, 2.2), CM.greenDark(), { p: [-8.6, 9.2, 0], cast: true }));
  machine.add(hs);
  return hs;
}

function spindleBuild() {
  // 主轴组件：主轴 + 三爪卡盘 + 工件，绕主轴轴线（y=10, z=0）旋转
  spindleGroup = new THREE.Group();
  spindleGroup.position.set(0, 10, 0);
  const add = (o) => spindleGroup.add(o);
  add(mesh(cylinderX(0.55, 1.3, 48), CM.spindle(), { p: [-4.85, 0, 0], cast: true }));      // 主轴端外露
  add(mesh(cylinderX(0.62, 0.16, 48), CM.spindle(), { p: [-4.16, 0, 0] }));                 // 法兰
  // 三爪卡盘 K11250：壳体 + 前端台阶环
  chuckBody = mesh(cylinderX(CHUCK_BODY_R, 0.95, 48), CM.chuck(), { p: [-4.4, 0, 0], cast: true }); chuckBody.name = 'chuck';
  chuckFaceRing = mesh(cylinderX(1.05, 0.28, 48), CM.chuck(), { p: [-3.86, 0, 0], cast: true });
  chuckFaceRing.name = 'chuck';
  add(chuckBody, chuckFaceRing);
  // 卡盘体外圆滚花环（64 条细齿合并，暗部细节）+ 前端面磨损亮环
  {
    const knurl = [];
    for (let i = 0; i < 64; i++) {
      const a = (i / 64) * Math.PI * 2;
      knurl.push([box(0.2, 0.028, 0.028), -4.4, CHUCK_BODY_R * Math.cos(a), CHUCK_BODY_R * Math.sin(a), a, 0, 0]);
    }
    add(bakedMesh(knurl, CM.chuckWear(), 'chuck'));
  }
  // 前端面：3 个卡爪导轨槽口（扇形深色槽，与爪错开 60°）+ 中心压紧圈 + 轴端盖
  {
    const slots = [];
    for (let i = 0; i < 3; i++) {
      slots.push([arcPlateX(0.72, 1.0, 0.52, 0.035), -3.7, 0, 0, Math.PI / 3 + (i * 2 * Math.PI) / 3, 0, 0]);
    }
    add(bakedMesh(slots, CM.recess(), 'chuck'));
    const ring = mesh(new THREE.TorusGeometry(0.34, 0.045, 12, 48), CM.chuckWear(), { p: [-3.7, 0, 0], r: [0, Math.PI / 2, 0] });
    ring.name = 'chuck';
    const hub = mesh(cyl(0.12, 0.14, 0.1, 32), CM.chuckWear(), { p: [-3.71, 0, 0], r: [0, 0, -Math.PI / 2] });
    hub.name = 'chuck';
    add(ring, hub);
  }
  // 三个卡爪（120° 分布，径向开合）：爪背弧板贴卡盘外圆 + 滑座 + 一体轮廓爪体（全棱倒角）+ 密集齿纹 + 沉头内六角压紧螺钉
  {
    const jawGeo = jawBodyGeo(), finGeo = jawFinGeo();
    for (let i = 0; i < 3; i++) {
      const piv = new THREE.Group();
      piv.rotation.x = (i * 2 * Math.PI) / 3;
      const jw = mesh(arcPlateX(CHUCK_BODY_R + JAW_TRAVEL - 0.02, 1.6 + JAW_TRAVEL, 0.42, 0.42), CM.jaw(), { p: [-4.3, 0, 0], cast: true }); // 爪背弧板（曲率同源卡盘体外圆；基准抬 JAW_TRAVEL，闭合态内缘贴体微沉 0.02，消缝隙台阶）
      jw.name = 'chuck';
      const seat = mesh(box(0.3, 0.85, 0.5), CM.jaw(), { p: [-3.8, 1.03, 0], cast: true });       // 滑座（骑前端面 T 形槽；抬高 0.03 防闭合态蹭工件）
      seat.name = 'chuck';
      const jb = mesh(jawGeo, CM.jaw(), { cast: true });                                          // 前伸爪体+爪牙一体轮廓（外露棱全倒角，无直角硬块）
      jb.name = 'chuck';
      const fins = [];
      for (let k = 0; k < 11; k++) {
        const fx = -3.53 + k * 0.0418;
        fins.push([finGeo, fx, 0.62, 0.2355]);
        fins.push([finGeo, fx, 0.62, -0.2355]);
      }
      const finsMesh = bakedMesh(fins, CM.recess(), 'chuck');                                     // 密集齿排（每侧 11 条合并单 mesh）
      const screw = mesh(cyl(0.075, 0.085, 0.05, 20), CM.dial(), { p: [-3.145, 1.1, 0], r: [0, 0, -Math.PI / 2], cast: true }); // 压紧螺钉沉头（同刀架内六角款式）
      screw.name = 'chuck';
      const hexHole = mesh(cyl(0.038, 0.038, 0.04, 6), CM.seam(), { p: [-3.152, 1.1, 0], r: [0, 0, -Math.PI / 2] });            // 内六角孔（沉入头面 0.012，侧视不露绿边）
      hexHole.name = 'chuck';
      piv.add(jw, seat, jb, finsMesh, screw, hexHole);
      jawPivots.push(piv);
      add(piv);
    }
  }
  // 卡盘钥匙（L 形，动画时显示）
  chuckKey = new THREE.Group();
  const ks = mesh(cylinderX(0.07, 0.55, 12), CM.toolShank(), { p: [-3.55, 0, 0] });
  const kh = mesh(cyl(0.055, 0.055, 1.1, 12), CM.toolShank(), { p: [-3.28, 0.55, 0] });
  const kb = mesh(new THREE.SphereGeometry(0.09, 16, 12), CM.handle(), { p: [-3.28, 1.1, 0] });
  chuckKey.add(ks, kh, kb);
  chuckKey.visible = false;
  add(chuckKey);
  // 工件组：LatheGeometry 轮廓件 + 端面圆片
  workGroup = new THREE.Group();
  workGroup.position.set(CHUCK_FACE_X, 0, 0);
  workMesh = null; // 延迟创建（依赖纹理）
  faceCap = new THREE.Mesh(
    new THREE.CircleGeometry(1, 48),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35, metalness: 0.6 })
  );
  faceCap.rotation.y = Math.PI / 2; // 法线朝 +X
  workGroup.add(faceCap);
  add(workGroup);
  machine.add(spindleGroup);
}

function carriageBuild() {
  const cg = new THREE.Group(); cg.name = 'carriage';
  cg.position.set(-1.5, 0, 0);
  // 床鞍（贴导轨滑动的鞍座）
  cg.add(mesh(box(2.5, 0.42, 4.1), CM.green(), { p: [0, 8.56, 0], cast: true, recv: true }));
  // 溜板箱（挂在床鞍前下方，正面有手轮与刻度）
  apron = new THREE.Group(); apron.name = 'apron';
  apron.add(mesh(box(2.2, 2.5, 0.75), CM.greenDark(), { p: [0, 7.4, 2.42], cast: true }));
  // 溜板箱正面：竖分缝 + 铭牌两层 + 旋钮 ×2（旋钮座+旋钮帽）
  apron.add(bakedMesh([
    [box(0.05, 2.3, 0.03), -0.62, 7.4, 2.81],
    [box(0.05, 2.3, 0.03), 0.62, 7.4, 2.81],
  ], CM.seam(), 'apron'));
  apron.add(mesh(box(0.62, 0.3, 0.03), CM.plate(), { p: [0.55, 7.95, 2.81] }));
  apron.add(mesh(box(0.5, 0.2, 0.034), CM.cream(), { p: [0.55, 7.95, 2.83] }));
  apron.add(bakedMesh([
    [cyl(0.08, 0.1, 0.14, 16), -0.85, 6.6, 2.84, Math.PI / 2, 0, 0],
    [cyl(0.055, 0.055, 0.05, 16), -0.85, 6.6, 2.93, Math.PI / 2, 0, 0],
    [cyl(0.08, 0.1, 0.14, 16), 0.85, 8.2, 2.84, Math.PI / 2, 0, 0],
    [cyl(0.055, 0.055, 0.05, 16), 0.85, 8.2, 2.93, Math.PI / 2, 0, 0],
  ], CM.dial(), 'apron'));
  const hw1 = mesh(new THREE.TorusGeometry(0.42, 0.07, 10, 40), CM.handle(), { p: [-0.55, 7.3, 2.95] });
  hw1.rotation.x = Math.PI / 2 - 0.35;
  const hw2 = mesh(new THREE.TorusGeometry(0.3, 0.055, 10, 32), CM.handle(), { p: [0.62, 7.0, 2.9] });
  hw2.rotation.x = Math.PI / 2 - 0.35;
  const spoke = (r) => mesh(box(0.05, r * 2, 0.05), CM.handle());
  apron.add(hw1, hw2);
  for (const [hw, r] of [[hw1, 0.4], [hw2, 0.28]]) {
    for (let i = 0; i < 3; i++) {
      const s = spoke(r);
      s.rotation.z = (i * Math.PI) / 3;
      s.position.copy(hw.position);
      apron.add(s);
    }
  }
  // 丝杠/光杠中段吊架：溜板箱下垂吊板 + 双环抱圈（随溜板在杆上滑动，消灭「杆悬空横穿」）
  apron.add(bakedMesh([
    [box(0.18, 0.55, 0.44), 0.3, 5.95, 2.45],
    [new THREE.TorusGeometry(0.115, 0.024, 10, 24), 0.3, 5.85, 2.32, 0, Math.PI / 2, 0],
    [new THREE.TorusGeometry(0.115, 0.024, 10, 24), 0.3, 5.85, 2.58, 0, Math.PI / 2, 0],
  ], CM.dial(), 'apron'));
  cg.add(apron);
  // 纵/横溜板分缝（床鞍-中滑板、转盘-小滑板交界暗线）
  cg.add(bakedMesh([
    [box(1.95, 0.035, 2.55), 0, 8.77, 0.25],
    [box(1.1, 0.03, 1.1), 0, 9.27, 0.35],
  ], CM.seam(), 'carriage'));
  // 中滑板 + 横向刻度盘手柄（盘缘细刻度 + 中心毂 + 杆根护套）
  cg.add(mesh(box(1.9, 0.34, 2.5), CM.green(), { p: [0, 8.94, 0.25], cast: true }));
  crossDial = mesh(cyl(0.3, 0.3, 0.14, 48), CM.dial(), { p: [0, 8.94, 1.85], r: [Math.PI / 2, 0, 0] });
  crossDial.name = 'carriage';
  cg.add(crossDial);
  {
    const ticks = [];
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      ticks.push([box(0.02, 0.055, 0.02), 0.31 * Math.cos(a), 8.94 + 0.31 * Math.sin(a), 1.92, 0, 0, a]);
    }
    const t = bakedMesh(ticks, CM.cream(), 'carriage');
    cg.add(t);
    const hub = mesh(cyl(0.09, 0.09, 0.05, 24), CM.cream(), { p: [0, 8.94, 1.94], r: [Math.PI / 2, 0, 0] });
    hub.name = 'carriage';
    cg.add(hub);
  }
  cg.add(mesh(cyl(0.05, 0.05, 0.5, 12), CM.dial(), { p: [0, 8.94, 2.15], r: [Math.PI / 2, 0, 0] }));
  cg.add(mesh(cyl(0.068, 0.078, 0.14, 16), CM.dial(), { p: [0, 8.94, 2.02], r: [Math.PI / 2, 0, 0] })); // 杆根护套
  cg.add(mesh(new THREE.SphereGeometry(0.1, 20, 16), CM.handle(), { p: [0, 8.94, 2.45] }));
  // 小滑板转盘 + 四方刀架
  compRest = mesh(cyl(0.72, 0.72, 0.16, 48), CM.greenDark(), { p: [0, 9.19, 0.35], cast: true });
  cg.add(compRest);
  cg.add(mesh(box(1.05, 0.3, 1.05), CM.green(), { p: [0, 9.42, 0.35], cast: true }));      // 小滑板
  const tp = mesh(box(0.66, 0.52, 0.66), CM.greenDark(), { p: [0, 9.83, 0.35], cast: true }); // 四方刀架
  tp.name = 'toolpost';
  cg.add(tp);
  // 刀架四棱小倒角暗示（45° 细条嵌棱）
  cg.add(bakedMesh([
    [box(0.13, 0.52, 0.13), -0.33, 9.83, 0.35 + -0.33, 0, Math.PI / 4, 0],
    [box(0.13, 0.52, 0.13), 0.33, 9.83, 0.35 + -0.33, 0, Math.PI / 4, 0],
    [box(0.13, 0.52, 0.13), -0.33, 9.83, 0.35 + 0.33, 0, Math.PI / 4, 0],
    [box(0.13, 0.52, 0.13), 0.33, 9.83, 0.35 + 0.33, 0, Math.PI / 4, 0],
  ], CM.greenDark(), 'toolpost'));
  // 4 个沉头内六角螺栓（座 + 深色六角孔）
  {
    const heads = [], holes = [];
    for (let i = 0; i < 4; i++) {
      const bx = Math.sin((i * Math.PI) / 2) * 0.24, bz = 0.35 + Math.cos((i * Math.PI) / 2) * 0.24;
      heads.push([cyl(0.075, 0.085, 0.05, 20), bx, 10.12, bz]);
      holes.push([cyl(0.038, 0.038, 0.054, 6), bx, 10.13, bz]);
    }
    cg.add(bakedMesh(heads, CM.dial(), 'toolpost'));
    cg.add(bakedMesh(holes, CM.seam(), 'toolpost'));
  }
  // 外圆车刀：刀杆 + 硬质合金刀片，刀尖为工具组原点
  toolGroup = new THREE.Group();
  toolGroup.name = 'tool';
  const shank = mesh(box(0.3, 0.3, 1.0), CM.toolShank(), { p: [0, 0.02, 0.78], cast: true });
  shank.name = 'tool';
  const bit = mesh(box(0.2, 0.18, 0.3), CM.carbide(), { p: [0, 0.0, 0.1], cast: true });
  bit.name = 'tool';
  toolGroup.add(shank, bit);
  cg.add(toolGroup);
  machine.add(cg);
  carriage = cg;
  setTool(0, 0.62); // 初始停在工件右端外
  return cg;
}

// 刀尖定位：x 为断面位置（u，决定床鞍位置），rz 为刀尖离轴线距离（u）
// toolGroup 是 carriage 子件（局部 x=0 随床鞍走），故只设其 z，x 落在床鞍上
function setTool(x, rz) {
  toolGroup.position.set(0, 10, rz);
  carriage.position.x = THREE.MathUtils.clamp(x, -3.4, 4.2);
}

function tailstockBuild() {
  const ts = new THREE.Group(); ts.name = 'tailstock';
  ts.position.set(7.5, 0, 0);
  // 下部底座 + 压板（贴导轨两侧）+ 六角锁紧螺母 ×4
  ts.add(mesh(box(1.5, 0.36, 3.0), CM.cream(), { p: [0, 8.5, 0], cast: true }));
  ts.add(bakedMesh([
    [box(0.34, 0.2, 2.6), -0.72, 8.28, 0],
    [box(0.34, 0.2, 2.6), 0.72, 8.28, 0],
    [cyl(0.13, 0.14, 0.12, 6), -0.72, 8.44, 0.9],
    [cyl(0.13, 0.14, 0.12, 6), -0.72, 8.44, -0.9],
    [cyl(0.13, 0.14, 0.12, 6), 0.72, 8.44, 0.9],
    [cyl(0.13, 0.14, 0.12, 6), 0.72, 8.44, -0.9],
  ], CM.dial(), 'tailstock'));
  // 上部两层：下半方体 + 过渡块 + 回转套筒座（圆柱）+ 顶板（不再是一个盒子）
  ts.add(mesh(box(1.15, 1.0, 1.7), CM.green(), { p: [0, 9.2, 0], cast: true }));
  ts.add(mesh(box(1.15, 0.35, 1.6), CM.green(), { p: [0, 9.55, 0], cast: true }));
  ts.add(mesh(cylinderX(0.62, 1.15, 48), CM.green(), { p: [0, 10, 0], cast: true }));      // 回转套筒座
  ts.add(mesh(box(1.05, 0.24, 1.15), CM.greenDark(), { p: [0, 10.78, 0], cast: true }));   // 顶板
  // 体/底座分缝
  ts.add(mesh(box(1.2, 0.05, 1.75), CM.seam(), { p: [0, 8.7, 0] }));
  // 套筒锁紧手柄（侧面斜下长杆 + 球头）
  const lever = mesh(cyl(0.045, 0.045, 0.7, 12), CM.dial(), { p: [0.3, 9.55, 0.9], r: [1.15, 0, 0.45] });
  const knob = mesh(new THREE.SphereGeometry(0.09, 20, 16), CM.handle());
  knob.position.set(0, 0.38, 0);
  lever.add(knob);
  ts.add(lever);
  // 套筒 + 顶尖（指向 -X 卡盘方向）；quill 子件全部用 userData.qx(tailQuillLen) 计算轴向位置
  quill = new THREE.Group(); quill.name = 'quill';
  {
    const sleeve = mesh(cylinderX(0.26, 1.0, 48), CM.spindle(), { p: [-0.5 - tailQuillLen / 2, 0, 0] });
    sleeve.userData.qx = (L) => -0.5 - L / 2;
    tailCenter = mesh(new THREE.ConeGeometry(0.1, 0.42, 24), CM.chuck(), { p: [-1.02 - tailQuillLen, 0, 0], r: [0, 0, Math.PI / 2] });
    tailCenter.userData.qx = (L) => -1.02 - L;
    // 套筒前端刻度环盘（细齿圈观感）+ 中心锥孔暗圈
    const dial = bakedMesh([
      [cyl(0.3, 0.3, 0.1, 48), 0, 0, 0, 0, 0, -Math.PI / 2],
      ...Array.from({ length: 20 }, (_, k) => {
        const a = (k / 20) * Math.PI * 2;
        return [box(0.018, 0.05, 0.03), 0, 0.31 * Math.cos(a), 0.31 * Math.sin(a), a - Math.PI / 2, 0, 0];
      }),
    ], CM.dial());
    dial.userData.qx = (L) => -1.05 - L;
    const bore = mesh(cyl(0.12, 0.1, 0.06, 32), CM.seam(), { p: [-1.12 - tailQuillLen, 0, 0], r: [0, 0, -Math.PI / 2] });
    bore.userData.qx = (L) => -1.12 - L;
    quill.add(sleeve, tailCenter, dial, bore);
  }
  quill.position.set(0.55, 10, 0);
  ts.add(quill);
  // 手轮与刻度（尾端）+ 轮缘 3 把手球头 + 轮毂盖
  tailWheel = mesh(new THREE.TorusGeometry(0.4, 0.06, 12, 48), CM.handle(), { p: [1.15, 10, 0] });
  tailWheel.rotation.y = Math.PI / 2;
  ts.add(tailWheel);
  ts.add(mesh(cyl(0.13, 0.13, 0.3, 32), CM.dial(), { p: [0.9, 10, 0], r: [0, 0, Math.PI / 2] }));
  ts.add(bakedMesh([
    [cyl(0.14, 0.14, 0.06, 24), 1.19, 10, 0, 0, 0, Math.PI / 2],
    [new THREE.SphereGeometry(0.055, 16, 12), 1.16, 10.4, 0],
    [new THREE.SphereGeometry(0.055, 16, 12), 1.16, 9.6, 0],
    [new THREE.SphereGeometry(0.055, 16, 12), 1.16, 10, 0.4],
    [new THREE.SphereGeometry(0.055, 16, 12), 1.16, 10, -0.4],
  ], CM.handle(), 'tailstock'));
  machine.add(ts);
  tailstock = ts;
  return ts;
}

function auxBuild() {
  // 进给箱（挂床身左前）：正面分缝 + 油窗 + 铭牌
  const fb = new THREE.Group(); fb.name = 'feedbox';
  fb.add(mesh(box(1.7, 1.6, 4.2), CM.greenDark(), { p: [-4.05, 7.2, 0], cast: true }));
  fb.add(bakedMesh([
    [box(0.04, 1.5, 0.06), -4.05, 7.2, 2.11],
    [box(1.6, 0.04, 0.06), -4.05, 7.55, 2.11],
    [cyl(0.14, 0.14, 0.05, 32), -4.5, 7.75, 2.12, Math.PI / 2, 0, 0],
  ], CM.seam(), 'feedbox'));
  fb.add(mesh(box(0.7, 0.3, 0.03), CM.plate(), { p: [-3.7, 6.8, 2.12] }));
  for (const [ly, lz] of [[7.6, 1.4], [7.0, 1.8]]) {
    fb.add(mesh(cyl(0.04, 0.04, 0.5, 12), CM.dial(), { p: [-3.5, ly, lz], r: [Math.PI / 3, 0, 0] }));
    fb.add(mesh(new THREE.SphereGeometry(0.08, 20, 16), CM.handle(), { p: [-3.5, ly + 0.18, lz + 0.12] }));
  }
  machine.add(fb);
  // 丝杠 + 光杠（床身前下方，进给时旋转）——两端支撑 + 杆端止推凸缘，消灭「悬空横穿」
  leadscrew = mesh(cylinderX(0.085, 16.2, 24), CM.spindle(), { p: [3.35, 5.85, 2.32] });
  leadscrew.name = 'leadscrew';
  feedRod = mesh(cylinderX(0.07, 16.2, 24), CM.spindle(), { p: [3.35, 5.85, 2.58] });
  feedRod.name = 'leadscrew';
  machine.add(leadscrew, feedRod);
  machine.add(bakedMesh([
    // 左端：进给箱右壁穿出衬套座 ×2 + 环抱圈
    [box(0.3, 0.6, 0.6), -3.15, 5.85, 2.32],
    [box(0.3, 0.6, 0.6), -3.15, 5.85, 2.58],
    [new THREE.TorusGeometry(0.1, 0.024, 10, 24), -3.0, 5.85, 2.32, 0, Math.PI / 2, 0],
    [new THREE.TorusGeometry(0.1, 0.024, 10, 24), -3.0, 5.85, 2.58, 0, Math.PI / 2, 0],
    // 杆端止推凸缘（左端头）
    [cyl(0.13, 0.13, 0.08, 24), -4.78, 5.85, 2.32, 0, 0, -Math.PI / 2],
    [cyl(0.11, 0.11, 0.08, 24), -4.78, 5.85, 2.58, 0, 0, -Math.PI / 2],
  ], CM.dial(), 'leadscrew'));
  // 右端：落地轴承座立柱 + 顶座 + 双环抱圈 + 杆端盖
  machine.add(bakedMesh([
    [box(0.45, 5.85, 0.6), 11.2, 2.92, 2.45],
    [box(0.7, 0.4, 1.15), 11.2, 6.05, 2.45],
  ], CM.greenDark(), 'leadscrew'));
  machine.add(bakedMesh([
    [new THREE.TorusGeometry(0.1, 0.024, 10, 24), 11.2, 5.85, 2.32, 0, Math.PI / 2, 0],
    [new THREE.TorusGeometry(0.1, 0.024, 10, 24), 11.2, 5.85, 2.58, 0, Math.PI / 2, 0],
    [cyl(0.12, 0.12, 0.07, 24), 11.47, 5.85, 2.32, 0, 0, -Math.PI / 2],
    [cyl(0.11, 0.11, 0.07, 24), 11.47, 5.85, 2.58, 0, 0, -Math.PI / 2],
  ], CM.dial(), 'leadscrew'));
  // 冷却液箱（右前地面）：支脚 + 顶面电机凸包（散热筋×3 + 接线盒）+ 冷却管走向切削区
  const tank = new THREE.Group(); tank.name = 'coolant';
  tank.add(mesh(box(2.2, 1.5, 1.4), CM.greenDark(), { p: [6.0, 0.87, 3.6], cast: true, recv: true }));
  tank.add(bakedMesh([
    [box(0.18, 0.14, 0.18), 5.15, 0.07, 3.05],
    [box(0.18, 0.14, 0.18), 6.85, 0.07, 3.05],
    [box(0.18, 0.14, 0.18), 5.15, 0.07, 4.15],
    [box(0.18, 0.14, 0.18), 6.85, 0.07, 4.15],
    [cyl(0.26, 0.28, 0.4, 24), 5.6, 1.77, 3.6],
    [cyl(0.31, 0.31, 0.025, 24), 5.6, 1.72, 3.6],
    [cyl(0.31, 0.31, 0.025, 24), 5.6, 1.8, 3.6],
    [cyl(0.31, 0.31, 0.025, 24), 5.6, 1.88, 3.6],
    [box(0.24, 0.14, 0.2), 5.6, 2.05, 3.6],
  ], CM.dial(), 'coolant'));
  tank.add(mesh(box(0.5, 0.16, 0.5), CM.dial(), { p: [6.6, 1.67, 3.6] }));
  {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(6.3, 1.5, 4.05),
      new THREE.Vector3(5.2, 1.9, 4.2),
      new THREE.Vector3(2.5, 2.6, 3.2),
      new THREE.Vector3(-1.0, 4.4, 2.6),
      new THREE.Vector3(-3.3, 6.6, 2.0),
      new THREE.Vector3(-3.6, 8.3, 1.5),
    ]);
    const tube = mesh(new THREE.TubeGeometry(curve, 36, 0.045, 10), CM.cable(), { cast: true });
    tube.name = 'coolant';
    tank.add(tube);
    const nozzle = mesh(cyl(0.05, 0.07, 0.2, 16), CM.dial(), { p: [-3.6, 8.42, 1.48], r: [0.4, 0, 0] });
    nozzle.name = 'coolant';
    tank.add(nozzle);
  }
  machine.add(tank);
  // 主电机电柜（右床腿右侧，落地，门朝操作者 +z）：门缝 + 把手 + 指示灯 + 百叶 + 电缆爬床腿
  const cab = new THREE.Group(); cab.name = 'cabinet';
  cab.add(mesh(box(2.0, 3.2, 1.4), CM.greenDark(), { p: [12.0, 1.74, 0.5], cast: true, recv: true }));
  cab.add(bakedMesh([
    [box(0.16, 0.14, 0.16), 11.2, 0.07, 0.3],
    [box(0.16, 0.14, 0.16), 12.8, 0.07, 0.3],
    [box(0.16, 0.14, 0.16), 11.2, 0.07, 0.7],
    [box(0.16, 0.14, 0.16), 12.8, 0.07, 0.7],
    [box(0.05, 2.9, 0.06), 11.25, 1.8, 1.22],   // 门缝（竖）
    [box(1.7, 0.04, 0.06), 12.0, 3.22, 1.22],   // 门缝（顶横）
  ], CM.seam(), 'cabinet'));
  cab.add(bakedMesh([
    [cyl(0.028, 0.028, 0.34, 12), 11.48, 1.95, 1.25, 0, 0, 0],
    [box(0.1, 0.03, 0.05), 11.48, 2.1, 1.25],
    [box(0.1, 0.03, 0.05), 11.48, 1.8, 1.25],
  ], CM.dial(), 'cabinet'));
  cab.add(bakedMesh([
    [new THREE.SphereGeometry(0.05, 16, 12), 12.55, 2.95, 1.23],
    [new THREE.SphereGeometry(0.05, 16, 12), 12.3, 2.95, 1.23],
    [new THREE.SphereGeometry(0.05, 16, 12), 12.05, 2.95, 1.23],
  ], CM.lampGreen(), 'cabinet'));
  cab.add(mesh(new THREE.SphereGeometry(0.05, 16, 12), CM.lampRed(), { p: [12.55, 2.7, 1.23] }));
  cab.add(bakedMesh([
    [box(0.8, 0.03, 0.04), 12.0, 0.7, 1.21],
    [box(0.8, 0.03, 0.04), 12.0, 0.92, 1.21],
    [box(0.8, 0.03, 0.04), 12.0, 1.14, 1.21],
  ], CM.seam(), 'cabinet'));
  {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(12.5, 0.7, 0.95),
      new THREE.Vector3(12.6, 0.35, 1.6),
      new THREE.Vector3(11.4, 0.3, 2.4),
      new THREE.Vector3(9.6, 0.4, 2.2),
      new THREE.Vector3(8.5, 0.8, 1.4),
      new THREE.Vector3(8.2, 1.9, 0.6),
      new THREE.Vector3(8.2, 2.6, 0.2),
    ]);
    const cable = mesh(new THREE.TubeGeometry(curve, 36, 0.055, 10), CM.cable(), { cast: true });
    cable.name = 'cabinet';
    cab.add(cable);
  }
  machine.add(cab);
  // 机床工作灯（床头箱顶部悬臂）
  const lamp = new THREE.Group(); lamp.name = 'lamp';
  lamp.add(mesh(cyl(0.05, 0.05, 1.1, 12), CM.dial(), { p: [-6.0, 12.9, 0.9], r: [0, 0, 1.1] }));
  lampShade = mesh(new THREE.ConeGeometry(0.34, 0.5, 24, 1, true), CM.cream(), { p: [-5.35, 12.62, 1.9], r: [0, 0, 2.2] });
  lampBulb = mesh(new THREE.SphereGeometry(0.1, 16, 12), new THREE.MeshStandardMaterial({ color: 0xfff2cf, emissive: 0xffd98a, emissiveIntensity: 2.2, roughness: 0.4 }), { p: [-5.3, 12.55, 2.0] });
  lamp.add(lampShade, lampBulb);
  machine.add(lamp);
}

// 点选部件注册（ch1 认知 + 标签系统）
const PARTS = [
  { key: 'bed',       name: '床身',     desc: '整机的支承与安装基准，上有山形导轨供溜板、尾座精确移动', anchor: [0, 8.3, -2.6] },
  { key: 'headstock', name: '主轴箱',   desc: '内装主轴与变速机构，带动卡盘与工件旋转（10~1400 r/min，18 级）', anchor: [-8.2, 13.2, 0] },
  { key: 'chuck',     name: '三爪卡盘', desc: '自定心夹具，平面螺纹使三爪同步开合，夹持工件旋转', anchor: [-4.4, 11.6, 0] },
  { key: 'workpiece', name: '工件',     desc: '被加工的回转体毛坯，随主轴旋转，由车刀车出外圆/端面', anchor: [-2.4, 11.2, 0] },
  { key: 'carriage',  name: '溜板·刀架', desc: '床鞍沿导轨纵向（Z 向）移动，中滑板横向（X 向）进给，四方刀架装刀', anchor: [-1.2, 11.3, 0.6] },
  { key: 'tailstock', name: '尾座',     desc: '支承长工件（顶尖顶紧），也可安装钻头钻孔', anchor: [7.5, 11.8, 0] },
  { key: 'feedbox',   name: '进给箱',   desc: '把主轴运动分配给丝杠/光杠，改变进给量与螺纹导程', anchor: [-4.05, 8.3, 2.4] },
  { key: 'apron',     name: '溜板箱',   desc: '把丝杠/光杠运动变为床鞍的纵横向进给，正面有操作手轮', anchor: [-1.2, 7.4, 3.2] },
  { key: 'leadscrew', name: '丝杠·光杠',desc: '丝杠车螺纹用，光杠一般进给用，贯通床身前方', anchor: [1.5, 5.9, 2.6] },
  { key: 'coolant',   name: '冷却液箱', desc: '储存切削液，泵送至切削区降温排屑', anchor: [6.0, 2.0, 4.0] },
  { key: 'cabinet',   name: '主电机电柜', desc: '主电机电气控制柜，电缆沿床腿接入床身；开机前检查门已关好', anchor: [12.0, 3.5, 0.8] },
  { key: 'lamp',      name: '工作灯',   desc: '局部照明切削区，便于观察切屑与表面', anchor: [-5.3, 13.2, 2.2] },
];
const partByKey = {};
function bindParts(root) {
  const map = {
    bed: 'bed', headstock: 'headstock', chuck: 'chuck', workpiece: 'workGroup',
    carriage: 'carriage', tailstock: 'tailstock', feedbox: 'feedbox',
    apron: 'apron', leadscrew: 'leadscrew', coolant: 'coolant', lamp: 'lamp', cabinet: 'cabinet',
  };
  const groups = {
    bed: ['bed'], headstock: ['headstock'], chuck: ['chuck'], workpiece: ['workpiece'],
    carriage: ['carriage'], tailstock: ['tailstock'], feedbox: ['feedbox'],
    apron: ['apron'], leadscrew: ['leadscrew'], coolant: ['coolant'], lamp: ['lamp'], cabinet: ['cabinet'],
  };
  for (const p of PARTS) {
    const g = groups[p.key] || [p.key];
    p.objs = [];
    for (const k of g) root.traverse((o) => { if (o.name === k || (k === 'workpiece' && o === workMesh)) p.objs.push(o); });
    partByKey[p.key] = p;
  }
}

/* ============================== 工件表面纹理（Canvas 程序生成，按站位区域绘制） ============================== */
/* 画布映射：横向 u = 圆周方向，纵向 v = 轴向 0..STOCK_LEN mm（每站 2mm → 每毫米 pxPerMm 像素）。
   走刀只增量绘制对应轴向区间；车端面改变长度后从记录全量重绘（区域按 mm 记录，无缩放漂移）。 */

const pxPerMm = 256 / STOCK_LEN;
const surfCanvas = document.createElement('canvas');
surfCanvas.width = 512; surfCanvas.height = 256;
const surfCtx = surfCanvas.getContext('2d');
let surfaceTex = null;

let rngSeed = 7;
function rnd() { rngSeed = (rngSeed * 16807) % 2147483647; return (rngSeed - 1) / 2147483646; }

function paintStockSurface() {
  const ctx = surfCtx;
  ctx.fillStyle = '#6f7479';
  ctx.fillRect(0, 0, 512, 256);
  for (let i = 0; i < 900; i++) {
    const x = rnd() * 512, y = rnd() * 256, w = 8 + rnd() * 40;
    ctx.fillStyle = `rgba(${rnd() > 0.5 ? '255,255,255' : '20,24,28'},${0.04 + rnd() * 0.07})`;
    ctx.fillRect(x, y, w, 1.5 + rnd() * 2);
  }
}

// 在 [z0..z1] mm 区间画一刀新鲜表面：f 大→螺旋纹明显（横线间距=f），v 低→鳞刺噪点，高速光亮
function paintRegion(z0, z1, opts) {
  const { f, vFactor, vib, mat } = opts;
  const ctx = surfCtx;
  const y0 = Math.max(0, Math.floor(z0 * pxPerMm));
  const y1 = Math.min(256, Math.ceil(z1 * pxPerMm));
  if (y1 <= y0) return;
  // 基色：新鲜金属亮度由切削速度决定（v 充分→亮银，v 低→发灰起鳞）
  const bright = Math.round(120 + 110 * vFactor);           // 120..230
  const base = mat.crumbly ? [bright * 0.86, bright * 0.7, bright * 0.62] : (mat.sticky ? [bright, bright * 0.97, bright * 0.92] : [bright, bright, bright * 1.02]);
  ctx.fillStyle = `rgb(${base[0] | 0},${base[1] | 0},${base[2] | 0})`;
  ctx.fillRect(0, y0, 512, y1 - y0);
  // 进给纹（水平线，间距 = f mm）
  const fStep = Math.max(1.5, f * pxPerMm);
  for (let y = y0; y < y1; y += fStep) {
    const a = 0.16 + 0.24 * (1 - vFactor);
    ctx.fillStyle = `rgba(30,34,40,${a})`;
    ctx.fillRect(0, y, 512, Math.max(1, fStep * 0.34));
  }
  // 鳞刺/粘刀噪点（低速加重）
  const speckN = Math.round((y1 - y0) * (0.8 + (1 - vFactor) * 3.2) * (mat.sticky ? 1.6 : 1));
  for (let i = 0; i < speckN; i++) {
    const x = rnd() * 512, y = y0 + rnd() * (y1 - y0), s = 1 + rnd() * 3;
    ctx.fillStyle = `rgba(${rnd() > 0.5 ? '250,250,255' : '25,28,34'},${0.1 + rnd() * 0.3 * (1 - vFactor + 0.25)})`;
    ctx.fillRect(x, y, s, s);
  }
  // 振纹（周期性宽暗带）
  if (vib) {
    for (let y = y0; y < y1; y += 6 * pxPerMm) {
      ctx.fillStyle = 'rgba(40,26,26,0.28)';
      ctx.fillRect(0, y, 512, 3 * pxPerMm);
    }
  }
  if (surfaceTex) surfaceTex.needsUpdate = true;
}

const passRegions = []; // {z0,z1,f,vFactor,vib,mat} — 重绘全表用
function repaintAllSurface() {
  paintStockSurface();
  for (const rg of passRegions) {
    if (rg.z0 >= WP.L) continue;
    paintRegion(rg.z0, Math.min(rg.z1, WP.L), rg);
  }
  if (surfaceTex) surfaceTex.needsUpdate = true;
}

function ensureSurfaceTex() {
  paintStockSurface();
  surfaceTex = new THREE.CanvasTexture(surfCanvas);
  surfaceTex.colorSpace = THREE.SRGBColorSpace;
  surfaceTex.wrapS = THREE.RepeatWrapping;
  surfaceTex.anisotropy = 4;
  return surfaceTex;
}

/* 端面贴图：正常 / 凸心 / 凹心 三态（半径向同心环画法） */
const faceCanvas = document.createElement('canvas');
faceCanvas.width = faceCanvas.height = 128;
const faceCtx = faceCanvas.getContext('2d');
let faceTex = null;
function paintFace(kind) {
  const c = faceCtx, R = 64;
  const img = c.createRadialGradient(R, R, 0, R, R, R);
  img.addColorStop(0, kind === 'convex' ? '#d9c26a' : kind === 'concave' ? '#4a4038' : '#d6dade');
  img.addColorStop(0.75, kind === 'concave' ? '#3a342e' : '#c3c9ce');
  img.addColorStop(1, '#9aa0a6');
  c.fillStyle = img;
  c.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 40; i++) {
    const r = 8 + rnd() * 54, a = rnd() * Math.PI * 2;
    c.strokeStyle = `rgba(40,44,50,${0.08 + rnd() * 0.14})`;
    c.beginPath();
    c.arc(R, R, r, a, a + 0.6 + rnd());
    c.stroke();
  }
  if (kind === 'convex') { // 中心凸起：亮色小圆斑
    c.fillStyle = 'rgba(255,240,190,0.85)';
    c.beginPath(); c.arc(R, R, 10, 0, Math.PI * 2); c.fill();
  }
  if (kind === 'concave') { // 凹心：中心暗坑
    c.fillStyle = 'rgba(20,16,12,0.88)';
    c.beginPath(); c.arc(R, R, 12, 0, Math.PI * 2); c.fill();
  }
  if (faceTex) faceTex.needsUpdate = true;
}
function ensureFaceTex() { paintFace('flat'); faceTex = new THREE.CanvasTexture(faceCanvas); faceTex.colorSpace = THREE.SRGBColorSpace; return faceTex; }

/* ============================== 工件几何重建（LatheGeometry 每帧重建） ============================== */

function buildProfilePoints() {
  // 站位半径数组 → Vector2(r, z)，末站在 WP.L 处插值收口
  const pts = [new THREE.Vector2(0, 0)];
  const step = STOCK_LEN / (N_ST - 1);
  let lastR = WP.r[0], lastZ = 0;
  for (let i = 0; i < N_ST; i++) {
    const z = i * step;
    if (z > WP.L) break;
    lastR = WP.r[i]; lastZ = z;
    pts.push(new THREE.Vector2(lastR * U, z * U));
  }
  if (WP.L > lastZ + 1e-6) {
    const j = Math.min(N_ST - 1, Math.ceil(WP.L / step));
    const z1 = Math.min(j * step, WP.L);
    const r1 = WP.r[Math.min(N_ST - 1, Math.floor(WP.L / step))] || lastR;
    pts.push(new THREE.Vector2(r1 * U, z1 * U));
  }
  return pts;
}

function rebuildWork() {
  if (workMesh) {
    workGroup.remove(workMesh);
    workMesh.geometry.dispose();
  }
  const geo = new THREE.LatheGeometry(buildProfilePoints(), 40);
  workMesh = new THREE.Mesh(geo, workMaterialLive);
  workMesh.name = 'workpiece';
  workMesh.castShadow = true;
  workMesh.rotation.z = -Math.PI / 2; // Lathe 轴向 Y → 场景 X（+X 指向尾座）
  workGroup.add(workMesh);
  // 端面圆片跟随自由端
  faceCap.position.x = (WP.L + 0.05) * U;
  faceCap.scale.setScalar(Math.max(0.02, WP.r[Math.min(N_ST - 1, Math.floor(WP.L / (STOCK_LEN / (N_ST - 1))))] * U));
  faceCap.material.map = faceTex;
  faceCap.material.color.set(0xffffff);
  faceCap.material.needsUpdate = true;
}

let workMaterialLive = null;
function resetWorkpiece(silent) {
  sim.feeding = false;
  sim.evaluation = null;
  hideEval();
  WP.r = new Float32Array(N_ST).fill(STOCK_R);
  WP.L = P.overhang;
  WP.cutVol = 0;
  WP.passes.length = 0;
  WP.chamfer = 0;
  WP.faceState = 'flat';
  passRegions.length = 0;
  paintStockSurface();
  if (surfaceTex) surfaceTex.needsUpdate = true;
  paintFace('flat');
  if (!workMaterialLive) {
    workMaterialLive = new THREE.MeshStandardMaterial({
      color: 0xffffff, roughness: 0.4, metalness: 0.72, map: surfaceTex,
    });
  } else {
    workMaterialLive.map = surfaceTex;
    workMaterialLive.needsUpdate = true;
  }
  rebuildWork();
  setTool((CHUCK_FACE_X + WP.L * U + 0.62), 0.62);
  if (!silent) renderLog();
}

/* ============================== 切屑粒子池 ============================== */

const CHIPS_N = 34;
const chipPool = [];
const chipGeo = new THREE.TorusGeometry(0.055, 0.02, 6, 12, 4.4);
const chipGeoCrumb = new THREE.TetrahedronGeometry(0.045);
function initChips() {
  for (let i = 0; i < CHIPS_N; i++) {
    const m = new THREE.MeshStandardMaterial({ color: 0x999999, roughness: 0.4, metalness: 0.6, transparent: true, opacity: 0 });
    const o = new THREE.Mesh(chipGeo, m);
    o.visible = false;
    scene.add(o);
    chipPool.push({ o, m, life: 0, vel: new THREE.Vector3(), ang: new THREE.Vector3(), active: false });
  }
}
function spawnChip(mDef) {
  const c = chipPool.find((c) => !c.active);
  if (!c) return;
  c.active = true; c.life = 1.5;
  c.m.color.set(mDef.chip);
  c.o.geometry = mDef.crumbly ? chipGeoCrumb : chipGeo;
  const nose = toolGroup.position;
  c.o.position.set(nose.x + (rnd() - 0.5) * 0.1, 10 + (rnd() - 0.5) * 0.1, nose.z + 0.06);
  c.vel.set((rnd() - 0.5) * 1.4, 1.6 + rnd() * 2.2, 1.6 + rnd() * 2.4);
  c.ang.set(rnd() * 10 - 5, rnd() * 10 - 5, rnd() * 10 - 5);
  c.o.rotation.set(rnd() * 6, rnd() * 6, rnd() * 6);
  c.o.visible = true;
  c.m.opacity = 1;
}
function stepChips(dt) {
  for (const c of chipPool) {
    if (!c.active) continue;
    c.life -= dt;
    if (c.life <= 0) { c.active = false; c.o.visible = false; continue; }
    c.vel.y -= 26 * dt;
    c.o.position.addScaledVector(c.vel, dt);
    c.o.rotation.x += c.ang.x * dt; c.o.rotation.y += c.ang.y * dt; c.o.rotation.z += c.ang.z * dt;
    if (c.o.position.y < 0.05 && c.vel.y < 0) { c.vel.y *= -0.25; c.vel.x *= 0.55; c.vel.z *= 0.55; c.o.position.y = 0.05; }
    c.m.opacity = Math.min(1, c.life / 0.35);
  }
}

/* ============================== 切削计算（教学简化经验公式） ============================== */

function matDef() { return WORK_MATERIALS[P.mat]; }
function calcN() { // n = 1000v/(πD)，D 取毛坯 φ60，教学基准
  return THREE.MathUtils.clamp(Math.round((1000 * P.v) / (Math.PI * 60)), SPEC.speedMin, SPEC.speedMax);
}
function calcFt() { // Ft ≈ Kb·ap·f（N）——经验公式教学简化
  const m = matDef();
  return m.kb * P.ap * P.f;
}
function calcP() { return (calcFt() * P.v) / 60000; }          // kW
function calcMRR() { return 1000 * P.v * P.f * P.ap; }          // mm³/min
function calcVfactor() { // 表面亮度/鳞刺因子：v 相对材料推荐区间
  const m = matDef();
  const mid = (m.vMin + m.vMax) / 2;
  if (P.v >= m.vMax * 0.9) return 1;
  if (P.v <= m.vMin * 0.8) return 0.25;
  return THREE.MathUtils.clamp(0.35 + ((P.v - m.vMin * 0.8) / (mid - m.vMin * 0.8)) * 0.55, 0.25, 1);
}
function vibRisk() { // 振动风险：悬伸长 + 无顶尖 + 参数大
  const overhangRatio = WP.L / 60;
  return !P.tail && overhangRatio > 2.2 && (P.ap > 1.5 || P.f > 0.35);
}
function calcRa(vib) { // Ra 教学估算：材料基准档 × f 因子 × v 因子（×振纹 1.35）
  const m = matDef();
  const ra0 = (m.raLo + m.raHi) / 2;
  let ra = ra0 * Math.pow(P.f / 0.25, 0.75);
  const vf = calcVfactor();
  ra *= vf >= 1 ? 0.82 : vf <= 0.3 ? 1.45 : 1;
  if (vib) ra *= 1.35;
  return Math.max(0.2, Math.round(ra * 10) / 10);
}
function raGrade(ra) {
  if (ra <= 1.6) return ['精细', 'ev-good', '表面光亮，纹路细密'];
  if (ra <= 3.2) return ['一般', '', '可见进给纹，常规车削水平'];
  return ['较差', 'ev-bad', '纹路粗糙/有鳞刺振纹，建议降 f 或提 v'];
}

/* ============================== 走刀过程引擎 ============================== */
/* 三种走刀：turn 外圆（轴向进给、半径逐站缩减、纹理增量绘制、切屑喷出）
             face 端面（刀尖径向进给、自由端长度递减、端面圆片重绘）
             chamfer 倒角（45° 短程，末端站位半径线性收缩）
   演示时间压缩：真实走刀时间 T=60·len/(f·n) 秒，读数与评价中给出实际值。 */

const sim = {
  spinning: false, stall: false, spinAngle: 0, nVisual: 0,
  feeding: false, passType: null, tPass: 0, tPassDur: 1,
  zCur: 0, zFrom: 0, zTo: 0,      // turn: 当前断面 mm
  faceFrom: 0, faceL0: 0, faceD: 0, // face/chamfer
  chipAcc: 0, lastCutZ: 0, evaluation: null,
};

function startSpindle() {
  sim.spinning = true; sim.stall = false;
  toast(`主轴启动 · n = ${calcN()} r/min`, 'ok');
}
function stopSpindle() { sim.spinning = false; }

function beginPass(type) {
  if (sim.feeding) return false;
  const m = matDef();
  const PkW = calcP();
  if (PkW > SPEC.motorKw) { // 闷车：功率超限，主轴停转警示
    sim.stall = true; sim.spinning = false;
    toast(`功率超限：约 ${PkW.toFixed(1)} kW > 主电机 ${SPEC.motorKw} kW，主轴闷车停转！请减小 ap / f 或降低 v 后重新启动`, 'warn', 4200);
    return false;
  }
  if (!sim.spinning) { toast('请先启动主轴再进给', 'warn', 2200); return false; }
  const guard = 15; // 保留夹持余量 mm
  if (type === 'turn') {
    const zFrom = WP.L, zTo = guard;
    if (WP.L - guard < 1) { toast('工件已车完，请先复位工件', 'warn'); return false; }
    const rEnd = WP.r[Math.min(N_ST - 1, Math.floor(zFrom / 2))] - P.ap;
    if (rEnd < 10) { toast('再切就超过最小直径（φ20mm）了，先复位或减小 ap', 'warn'); return false; }
    Object.assign(sim, { feeding: true, passType: 'turn', zCur: zFrom, zFrom, zTo, lastCutZ: zFrom, chipAcc: 0, tPass: 0 });
    sim.tPassDur = 2.0 + (zFrom - zTo) / 42;
  } else if (type === 'face') {
    if (WP.L <= 46) { toast('工件已较短，端面不再车削，请复位工件', 'warn'); return false; }
    Object.assign(sim, { feeding: true, passType: 'face', faceL0: WP.L, faceD: Math.min(2, WP.L - 46), chipAcc: 0, tPass: 0 });
    sim.tPassDur = 1.8;
    setTool(CHUCK_FACE_X + WP.L * U + 0.62, STOCK_R * U + 0.08);
  } else if (type === 'chamfer') {
    const c = 2; // C2 倒角
    Object.assign(sim, { feeding: true, passType: 'chamfer', faceL0: WP.L, faceD: c, chipAcc: 0, tPass: 0 });
    sim.tPassDur = 1.0;
  }
  hideEval();
  return true;
}

function stopFeed() {
  if (!sim.feeding) return;
  sim.feeding = false;
  if (sim.passType === 'demo') { toast('已退回（演示中断）', '', 1400); return; }
  finishPass(true);
}

function stepPass(dt) {
  if (!sim.feeding) return;
  sim.tPass += dt;
  const prog = THREE.MathUtils.clamp(sim.tPass / sim.tPassDur, 0, 1);
  const m = matDef();
  if (sim.passType === 'turn') {
    const zPrev = sim.zCur;
    sim.zCur = sim.zFrom + (sim.zTo - sim.zFrom) * prog;
    // 轮廓缩减：本帧扫过的站位半径 -= ap（教学：ap 稳定切削）
    const iA = Math.max(0, Math.ceil(sim.zCur / 2)), iB = Math.max(0, Math.floor(zPrev / 2));
    let dv = 0;
    for (let i = iA; i <= iB; i++) {
      const old = WP.r[i], nv = Math.max(10, old - P.ap);
      dv += Math.PI * (old * old - nv * nv) * 2; // 2mm 站距
      WP.r[i] = nv;
    }
    WP.cutVol += dv;
    if (iB > iA) {
      paintRegion(sim.zCur, zPrev, { f: P.f, vFactor: calcVfactor(), vib: vibRisk(), mat: m });
      passRegions.push({ z0: sim.zCur, z1: zPrev, f: P.f, vFactor: calcVfactor(), vib: vibRisk(), mat: m });
    }
    rebuildWork();
    setTool(CHUCK_FACE_X + sim.zCur * U, WP.r[Math.max(0, Math.floor(sim.zCur / 2))] * U + 0.02);
    sim.chipAcc += dt * (m.crumbly ? 14 : 22);
    while (sim.chipAcc >= 1) { sim.chipAcc -= 1; spawnChip(m); }
  } else if (sim.passType === 'face') {
    const L0 = sim.faceL0;
    WP.L = L0 - sim.faceD * prog;
    const zCut = (L0 - WP.L);
    if (zCut > 0.02) paintFace(P.faceKind === 'flat' ? 'flat' : P.faceKind);
    WP.faceState = P.faceKind;
    rebuildWork();
    const noseZ = (STOCK_R - (STOCK_R - 0.6) * prog) * U;
    setTool(CHUCK_FACE_X + WP.L * U + 0.06, noseZ);
    sim.chipAcc += dt * 16;
    while (sim.chipAcc >= 1) { sim.chipAcc -= 1; spawnChip(m); }
  } else if (sim.passType === 'chamfer') {
    const c = sim.faceD;
    const stepMM = STOCK_LEN / (N_ST - 1);
    for (let i = 0; i < N_ST; i++) {
      const z = i * stepMM;
      const dEnd = WP.L - z;
      if (dEnd >= 0 && dEnd <= c) WP.r[i] = Math.min(WP.r[i], Math.max(10, STOCK_R - (c - dEnd)));
    }
    WP.chamfer = c;
    rebuildWork();
    const rz = (STOCK_R - c * prog) * U;
    const nx = CHUCK_FACE_X + WP.L * U - (c * prog) * U;
    setTool(nx, rz);
    sim.chipAcc += dt * 10;
    while (sim.chipAcc >= 1) { sim.chipAcc -= 1; spawnChip(m); }
  }
  if (prog >= 1) { sim.feeding = false; finishPass(false); }
}

function finishPass(stopped) {
  const m = matDef();
  const vib = vibRisk();
  const ra = calcRa(vib);
  const [grade, gradeCls, note] = raGrade(ra);
  const T = sim.passType === 'turn'
    ? (60 * (sim.zFrom - sim.zTo) / (P.f * calcN())).toFixed(1)
    : (sim.passType === 'face' ? (60 * sim.faceD / (P.f * calcN())).toFixed(1) : '—');
  sim.evaluation = {
    type: sim.passType, ra, grade, gradeCls, note, vib, T,
    cutVol: Math.round(WP.cutVol),
    dia: (2 * WP.r[Math.min(N_ST - 1, Math.floor(WP.L / 2))]).toFixed(1),
    stopped,
  };
  WP.passes.push({
    kind: sim.passType === 'turn' ? '车外圆' : sim.passType === 'face' ? '车端面' : '倒角',
    params: `v${P.v} · f${P.f} · ap${P.ap}`,
    ra, dia: sim.evaluation.dia, vol: Math.round(WP.cutVol), vib,
  });
  renderLog();
  showEval();
  if (vib) toast('出现振纹：悬伸过长且无尾座顶尖支承，试着顶紧尾座或减小参数', 'warn', 3600);
  if (stopped) toast('进给已停止', '', 1600);
}

/* ============================== 卡盘 / 尾座动画 ============================== */

const chuck = { jawPos: 1, target: 1, keyShown: false, keyT: 0, anim: null }; // jawPos: 0 闭合(夹 φ60) ↔ 1 张开
function setJaws(pos) {
  for (const piv of jawPivots) {
    for (const ch of piv.children) ch.position.y = ch.userData.baseY || (ch.userData.baseY = ch.position.y), ch.position.y = ch.userData.baseY + (pos - 1) * JAW_TRAVEL;
  }
  chuck.jawPos = pos;
}
function chuckAction(open) {
  chuck.target = open ? 1 : 0;
  chuck.keyShown = true;
  chuck.anim = 0;
  chuckKey.visible = true;
}
function stepChuck(dt) {
  if (chuck.anim !== null) {
    chuck.anim += dt;
    const k = THREE.MathUtils.clamp(chuck.anim / 1.4, 0, 1);
    const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    chuckKey.rotation.x = k * Math.PI * 6;
    setJaws(chuck.jawPos + (chuck.target - chuck.jawPos) * e * 0.16);
    if (k >= 1) {
      chuck.anim = null;
      chuck.jawPos = chuck.target;
      setJaws(chuck.jawPos);
      chuckKey.visible = false;
    }
  }
}

function tailstockFollow() {
  // 尾座顶尖顶紧：尾座平移到工件自由端附近并伸出套筒
  const endX = CHUCK_FACE_X + WP.L * U;
  if (P.tail) {
    tailstock.position.x = THREE.MathUtils.lerp(tailstock.position.x, endX + 1.35, 0.12);
    tailQuillLen = THREE.MathUtils.lerp(tailQuillLen, 0.75, 0.12);
  } else {
    tailstock.position.x = THREE.MathUtils.lerp(tailstock.position.x, 7.5, 0.1);
    tailQuillLen = THREE.MathUtils.lerp(tailQuillLen, 0.2, 0.1);
  }
  quill.position.x = 0.55;
  quill.children.forEach((c) => { if (c.userData.qx) c.position.x = c.userData.qx(tailQuillLen); });
}

/* ============================== 相机系统（章节机位 + 缓动过渡） ============================== */

const CAMS = {
  front: { pos: [0.5, 13.5, 26], tgt: [0, 9, 0] },
  side:  { pos: [24, 12, 10],   tgt: [2, 8.5, 0] },
  left:  { pos: [-26, 12, 10],  tgt: [-7, 9, 0] },
  right: { pos: [26, 12, 8],    tgt: [7, 9, 0] },
  top:   { pos: [0, 30, 0.001], tgt: [0, 8, 0] },
  near:  { pos: [-2.2, 11.2, 6.5], tgt: [-3.9, 10, 0] },
  far:   { pos: [0, 15, 46],    tgt: [0, 8, 0] },
  // —— R2 精细度 QC 近景特写机位（4 倍裁切放大逐项目检用）
  'headstock-near': { pos: [-8.2, 11.2, 8.6], tgt: [-8.2, 10.3, 0] },
  'chuck-jaw-near': { pos: [-3.3, 11.3, 3.0], tgt: [-4.0, 10.55, 0] },
  'tailstock-near': { pos: [6.1, 11.8, 3.8], tgt: [7.3, 9.4, 0] },
  'carriage-near':  { pos: [0.8, 10.0, 5.6], tgt: [-1.3, 8.9, 0.7] },
  'dynamics-near':  { pos: [15.0, 7.2, 5.2], tgt: [11.0, 4.2, 1.0] },
};
const camTween = { on: false, t: 0, dur: 1, p0: null, p1: null, g0: null, g1: null };
/* 章节机位调校基准：主体占画面 40%~60%（2026-11-15 目检校准） */
const CHAPTER_CAMS = {
  0: { pos: [-4, 13.5, 24], tgt: [-1, 9, 0] },      // 认识车床：整机
  1: { pos: [-9, 12.5, 9.5], tgt: [-8.2, 10.2, 0] },// 部件结构：床头箱特写
  2: { pos: [-2.6, 11.2, 5.2], tgt: [-3.9, 10, 0] },// 卡盘装夹：卡盘特写
  3: { pos: [0.6, 11.4, 5.8], tgt: [-1.6, 10, 0] }, // 对刀：刀尖-卡盘区
  4: { pos: [-6, 13, 20], tgt: [-1, 9.5, 0] },      // 三要素：整机中景
  5: { pos: [-0.6, 11.2, 7], tgt: [-2.6, 10, 0] },  // 车外圆：切削区
  6: { pos: [1.6, 11, 5.6], tgt: [-2.6, 10, 0] },   // 端面倒角：自由端
  7: { pos: [0.5, 13.5, 26], tgt: [0, 9, 0] },      // 安全检测：整机
};
function flyTo(pos, tgt, dur = 1.1) {
  camTween.on = true; camTween.t = 0; camTween.dur = STILL ? 0.001 : dur;
  camTween.p0 = camera.position.clone(); camTween.p1 = new THREE.Vector3(...pos);
  camTween.g0 = controls.target.clone(); camTween.g1 = new THREE.Vector3(...tgt);
}
function stepCamTween(dt) {
  if (!camTween.on) return;
  camTween.t += dt;
  const k = THREE.MathUtils.clamp(camTween.t / camTween.dur, 0, 1);
  const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
  camera.position.lerpVectors(camTween.p0, camTween.p1, e);
  controls.target.lerpVectors(camTween.g0, camTween.g1, e);
  if (k >= 1) camTween.on = false;
}

/* ============================== UI 工厂（复用 lab.css 的 ctl 视觉） ============================== */

function el(tag, cls, html) {
  const o = document.createElement(tag);
  if (cls) o.className = cls;
  if (html != null) o.innerHTML = html;
  return o;
}
function mkHint(text, warn) {
  const h = el('div', 'lathe-hint' + (warn ? ' warn' : ''), `<i>提示</i><span>${text}</span>`);
  return h;
}
function mkSlider({ label, min, max, step, value, unit = '', fmt, onInput }) {
  const wrap = el('div', 'ctl');
  const lab = el('label', '', label);
  const inp = document.createElement('input');
  inp.type = 'range'; inp.min = min; inp.max = max; inp.step = step; inp.value = value;
  const val = el('span', 'ctl-val', (fmt ? fmt(value) : value) + unit);
  const apply = () => {
    const v = parseFloat(inp.value);
    val.textContent = (fmt ? fmt(v) : v) + unit;
    onInput && onInput(v);
  };
  inp.addEventListener('input', apply);
  wrap.append(lab, inp, val);
  wrap.setValue = (v) => { inp.value = v; apply(); };
  return wrap;
}
function mkBtn(label, onClick, primary) {
  const b = el('button', 'ctl-btn' + (primary ? ' active' : ''), label);
  b.type = 'button';
  b.addEventListener('click', onClick);
  return b;
}
function mkWideBtn(label, onClick, primary) {
  const b = mkBtn(label, onClick, primary);
  b.classList.add('wide');
  return b;
}
function mkToggle(label, value, onChange) {
  const lab = el('label', 'ctl-toggle');
  const inp = document.createElement('input');
  inp.type = 'checkbox'; inp.checked = !!value;
  const track = el('span', 'track');
  lab.append(el('span', '', label), inp, track);
  inp.addEventListener('change', () => onChange(inp.checked));
  return lab;
}
function mkChips(items, current, onPick) {
  const wrap = el('div', 'mat-chips');
  const btns = [];
  for (const [key, label] of items) {
    const b = el('button', 'mat-chip' + (key === current ? ' on' : ''), label);
    b.type = 'button';
    b.addEventListener('click', () => { btns.forEach((x) => x.classList.remove('on')); b.classList.add('on'); onPick(key); });
    btns.push(b);
    wrap.appendChild(b);
  }
  wrap.setSel = (key) => btns.forEach((b, i) => b.classList.toggle('on', items[i][0] === key));
  return wrap;
}
function hudCard(rows) {
  const c = el('div', 'hud-card');
  const refs = {};
  for (const [label, key, init] of rows) {
    const r = el('div', 'hud-row', `<span>${label}</span><b></b>`);
    refs[key] = r.querySelector('b');
    if (init != null) refs[key].textContent = init;
    c.appendChild(r);
  }
  // 读数键直接暴露为属性（hudApi.xxx 可读写），并保留 .set() 兼容
  const out = { el: c, set(k, v) { if (refs[k]) refs[k].innerHTML = v; } };
  Object.assign(out, refs);
  return out;
}
function mkLog() {
  const w = el('div', 'lathe-log');
  const head = el('div', 'lathe-log-head', `走刀记录 <span class="log-count" id="logCount"></span>`);
  const clear = el('button', 'log-clear', '清空');
  clear.type = 'button';
  clear.addEventListener('click', () => { WP.passes.length = 0; renderLog(); });
  head.appendChild(clear);
  const scroll = el('div', 'log-scroll');
  w.append(head, scroll);
  return w;
}
function renderLog() {
  const scroll = document.querySelector('.lathe-log .log-scroll');
  const count = document.getElementById('logCount');
  if (!scroll) return;
  count.textContent = WP.passes.length ? `（${WP.passes.length} 刀）` : '';
  if (!WP.passes.length) { scroll.innerHTML = '<div class="log-empty">尚无走刀记录——完成一刀后自动登记</div>'; return; }
  let html = '<table><thead><tr><th>工序</th><th>v·f·ap</th><th>Ra(μm)</th><th>φmm</th><th>去除cm³</th></tr></thead><tbody>';
  WP.passes.forEach((p, i) => {
    html += `<tr${p.vib ? ' class="bad"' : ''}><td>${i + 1} ${p.kind}</td><td>${p.params}</td><td>${p.ra}</td><td>${p.dia}</td><td>${(p.vol / 1000).toFixed(1)}</td></tr>`;
  });
  scroll.innerHTML = html + '</tbody></table>';
}
function showEval() {
  const ev = sim.evaluation;
  if (!ev) return;
  let box = document.getElementById('latheEval');
  if (!box) { box = el('div', 'lathe-eval'); box.id = 'latheEval'; els.lcData.prepend(box); }
  const m = matDef();
  box.innerHTML = `
    <div class="ev-title">本刀评价 · ${ev.type === 'turn' ? '车外圆' : ev.type === 'face' ? '车端面' : '倒角'}${ev.stopped ? '（中途停止）' : ''}</div>
    <div class="ev-row"><span>表面粗糙度 Ra</span><b>${ev.ra} μm <span class="${ev.gradeCls}">${ev.grade}</span></b></div>
    <div class="ev-row"><span>实测直径 φ</span><b>${ev.dia} mm</b></div>
    <div class="ev-row"><span>累计去除</span><b>${(ev.cutVol / 1000).toFixed(1)} cm³</b></div>
    <div class="ev-row"><span>实际走刀时间</span><b>≈ ${ev.T} s</b></div>
    <div class="ev-note">${ev.note}${ev.vib ? ' · <span class="ev-bad">振纹明显：加尾座顶尖或减小悬伸</span>' : ''}</div>`;
  box.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}
function hideEval() { const b = $('latheEval'); if (b) b.remove(); }

/* 提示条（中栏顶部浮动） */
let toastTimer = null;
function toast(msg, kind = '', dur = 2600) {
  let t = document.querySelector('.lathe-toast');
  if (!t) { t = el('div', 'lathe-toast'); els.stage.appendChild(t); }
  t.textContent = msg;
  t.className = 'lathe-toast show' + (kind ? ' ' + kind : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), dur);
}

/* ============================== 数据读数（每章 HUD 定义） ============================== */

let hudApi = null;      // 当前章读数卡
let hudTick = 0;
function setHud(chapter) {
  els.lcData.innerHTML = '';
  hudApi = chapter ? chapter.hud(els.lcData) : null;
}
function hudRefresh() { // 5Hz 调用
  const ch = CHAPTERS[currentCh];
  if (hudApi && ch && ch.hudUpdate) ch.hudUpdate(hudApi);
}

/* ============================== 章节系统 ============================== */

const CHAPTERS = [];   // 填充于下方章节内容区
let currentCh = 0;

function buildChapNav() {
  CHAPTERS.forEach((ch, i) => {
    const b = el('button', 'chap-btn' + (i === 0 ? ' on' : ''), `<span class="chap-n">${String(i + 1).padStart(2, '0')}</span><span class="chap-t">${ch.title}</span>`);
    b.type = 'button';
    b.addEventListener('click', () => gotoChapter(i));
    els.chapNav.appendChild(b);
  });
}
function gotoChapter(i, instant) {
  i = THREE.MathUtils.clamp(i, 0, CHAPTERS.length - 1);
  if (sim.feeding) stopFeed();
  currentCh = i;
  const ch = CHAPTERS[i];
  [...els.chapNav.children].forEach((b, j) => b.classList.toggle('on', j === i));
  els.chapCount.textContent = `${String(i + 1).padStart(2, '0')}/0${CHAPTERS.length}`;
  els.railNoL.textContent = String(i + 1).padStart(2, '0');
  els.detailNo.textContent = String(i + 1).padStart(2, '0');
  els.detailTitle.textContent = ch.title;
  els.railTitleR.textContent = ch.title;
  setPicked(null); // 切章清掉上一章的部件高亮
  els.lesson.innerHTML = ch.lesson;
  els.controls.innerHTML = '';
  ch.mount(els.controls);
  setHud(ch);
  if (ch.enter) ch.enter();
  const cam = CHAPTER_CAMS[i] || ch.cam;
  flyTo(cam.pos, cam.tgt, instant ? 0.001 : 1.1);
  if (STILL) window.__latheReady = true;
}

/* ============================== 拾取与标注 ============================== */

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let pickedKey = null, pickedPulse = 0;
let downXY = null;

function initPicking() {
  const cv = renderer.domElement;
  cv.classList.add('grab');
  cv.addEventListener('pointerdown', (e) => { downXY = [e.clientX, e.clientY]; });
  cv.addEventListener('pointerup', (e) => {
    if (!downXY) return;
    const moved = Math.hypot(e.clientX - downXY[0], e.clientY - downXY[1]);
    downXY = null;
    if (moved > 6) return;
    const r = cv.getBoundingClientRect();
    pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(machine.children, true);
    const hit = hits.find((h) => h.object.visible);
    if (!hit) { setPicked(null); return; }
    let o = hit.object, key = null;
    while (o && !key) { key = o.name && partByName(o.name); o = o.parent; }
    setPicked(key);
  });
}
function partByName(n) {
  const direct = { bed: 'bed', headstock: 'headstock', chuck: 'chuck', carriage: 'carriage', tailstock: 'tailstock', feedbox: 'feedbox', apron: 'apron', leadscrew: 'leadscrew', coolant: 'coolant', lamp: 'lamp' };
  return direct[n] || (n === 'workpiece' ? 'workpiece' : null);
}
function setPicked(key) {
  if (pickedKey && partByKey[pickedKey]) {
    for (const o of partByKey[pickedKey].objs) if (o.material && o.material.emissive) o.material.emissive.setHex(0);
  }
  pickedKey = key;
  if (key && partByKey[key]) {
    const p = partByKey[key];
    for (const o of p.objs) if (o.material && o.material.emissive) o.material.emissive.setHex(0x8a4a20);
    const ch = CHAPTERS[currentCh];
    if (ch.pickInfo) ch.pickInfo(p);
  }
}

// 标签 DOM（每帧投影更新）
const labelEls = new Map();
function initLabels() {
  for (const p of PARTS) {
    const d = el('div', 'lathe-label', `<span class="lb-dot"></span>${p.name}`);
    els.labels.appendChild(d);
    labelEls.set(p.key, d);
  }
  const v = new THREE.Vector3();
  for (const [key, d] of labelEls) {
    const p = partByKey[key];
    d._anchor = new THREE.Vector3(...p.anchor);
  }
}
let labelsOn = true;
// 窄屏（≤860px 纵向堆叠）11 个标注易重叠：默认收起，需要时用「模型标签」打开
if (window.innerWidth <= 860) {
  labelsOn = false;
  els.labelBtn.classList.remove('on');
  els.labelBtn.setAttribute('aria-pressed', 'false');
}
function stepLabels() {
  const show = labelsOn && !STILL;
  const v = new THREE.Vector3();
  for (const [key, d] of labelEls) {
    const p = partByKey[key];
    if (p.key === 'workpiece') d._anchor.set(CHUCK_FACE_X + WP.L * U * 0.7, 11.2, 0);
    if (p.key === 'carriage' || p.key === 'apron') d._anchor.set(carriage.position.x, p.key === 'apron' ? 7.4 : 11.3, p.key === 'apron' ? 3.2 : 0.6);
    v.copy(d._anchor);
    v.project(camera);
    const behind = v.z > 1 || v.z < -1;
    const vis = show && !behind && (pickedKey === null || pickedKey === key || true);
    d.style.display = vis ? 'block' : 'none';
    if (vis) {
      d.style.left = `${(v.x * 0.5 + 0.5) * els.stage.clientWidth}px`;
      d.style.top = `${(-v.y * 0.5 + 0.5) * els.stage.clientHeight}px`;
      d.classList.toggle('picked', pickedKey === key);
    }
  }
}

/* ============================== 随堂检测（6 题） ============================== */

const QUESTIONS = [
  { q: '开机前发现卡盘扳手还插在卡盘上，应该？', opts: ['直接开机，没事', '先取下扳手再开机', '让扳手跟着卡盘转', '换个小扳手'], correct: 1, why: '卡盘扳手留在卡盘上开机，会被高速甩出伤人，是车工安全第一条。' },
  { q: '三爪卡盘装夹较长工件时，为防止振动应？', opts: ['尽量多伸出一些', '用尾座顶尖顶住工件', '减小卡盘夹紧力', '提高主轴转速'], correct: 1, why: '悬伸越长刚性越差；尾座顶尖支承可显著提高工件刚性，减小振动。' },
  { q: '车削过程中要测量工件直径，正确做法是？', opts: ['主轴慢转时用卡尺量', '完全停机后再测量', '用手摸着估一估', '目测就够了'], correct: 1, why: '旋转工件旁严禁测量与触碰，必须停机测量——这是铁的纪律。' },
  { q: '其他条件不变，在推荐范围内适当提高切削速度 v，结果是？', opts: ['表面更光洁，但刀具磨损加快', '表面更粗糙', '切削力明显增大', '机床功率按比例翻倍'], correct: 0, why: 'v 提高抑制积屑瘤，表面改善；但切削温度升高，刀具寿命下降。' },
  { q: '清理切屑的正确方式是？', opts: ['徒手把长切屑拉断', '停机后用钩子或毛刷清理', '开机用压缩空气吹', '用抹布在旋转工件旁擦'], correct: 1, why: '切屑锋利且高温，禁止徒手；必须停机后用钩子/毛刷清理。' },
  { q: '车外圆时进给量 f 选得过大，最可能出现？', opts: ['表面粗糙度变差，甚至闷车', '工件直径反而变大', '工件变长', '切屑自动消失'], correct: 0, why: 'f 大→残留面积增大、表面变差；切削力大增，超功率会闷车。' },
];
const quiz = { open: false, idx: 0, score: 0, answered: false, best: 0 };

function quizOpen() {
  if (quiz.open) return;
  quiz.open = true; quiz.idx = 0; quiz.score = 0; quiz.answered = false;
  const panel = el('div', 'quiz-panel');
  panel.id = 'latheQuiz';
  const card = el('div', 'quiz-card');
  panel.appendChild(card);
  els.stage.appendChild(panel);
  quizRender();
}
function quizRender() {
  const card = document.querySelector('#latheQuiz .quiz-card');
  const q = QUESTIONS[quiz.idx];
  card.innerHTML = `<div class="q-progress">第 ${quiz.idx + 1} / ${QUESTIONS.length} 题 · 答对 ${quiz.score} 题</div><h3>${q.q}</h3>`;
  const opts = el('div', 'q-opts');
  q.opts.forEach((o, i) => {
    const b = el('button', 'quiz-opt', o);
    b.type = 'button';
    b.addEventListener('click', () => quizAnswer(i, b));
    opts.appendChild(b);
  });
  card.appendChild(opts);
  const explain = el('div', 'q-explain');
  card.appendChild(explain);
  const foot = el('div', 'q-foot', `<span class="q-score"></span>`);
  const next = mkBtn(quiz.idx === QUESTIONS.length - 1 ? '查看成绩' : '下一题', quizNext);
  next.style.display = 'none';
  foot.appendChild(next);
  card.appendChild(foot);
}
function quizAnswer(i, btn) {
  if (quiz.answered) return;
  quiz.answered = true;
  const q = QUESTIONS[quiz.idx];
  const card = document.querySelector('#latheQuiz .quiz-card');
  [...card.querySelectorAll('.quiz-opt')].forEach((b, j) => {
    b.disabled = true;
    if (j === q.correct) b.classList.add('correct');
    else if (j === i) b.classList.add('wrong');
  });
  if (i === q.correct) quiz.score += 1;
  card.querySelector('.q-explain').innerHTML = `${i === q.correct ? '✅ 答对了。' : '❌ 答错了。'}${q.why}`;
  card.querySelector('.q-foot .q-score').textContent = `当前 ${quiz.score}/${quiz.idx + 1}`;
  card.querySelector('.q-foot .ctl-btn').style.display = '';
}
function quizNext() {
  const card = document.querySelector('#latheQuiz .quiz-card');
  if (quiz.idx < QUESTIONS.length - 1) {
    quiz.idx += 1; quiz.answered = false;
    quizRender();
    return;
  }
  const pct = Math.round((quiz.score / QUESTIONS.length) * 100);
  quiz.best = Math.max(quiz.best, quiz.score);
  quiz.open = false;
  card.innerHTML = `<div class="q-result"><div class="q-progress">随堂检测完成</div><div class="big">${pct} 分</div><p>答对 ${quiz.score} / ${QUESTIONS.length} 题</p><p style="color:var(--text-faint);font-size:13px">${pct >= 80 ? '安全意识与工艺常识过关，可以下车间了！' : '再复习一遍安全规程，安全无小事。'}</p></div>`;
  const again = mkBtn('再来一次', () => { closeQuiz(); quizOpen(); });
  const done = mkBtn('完成', closeQuiz, true);
  const foot = el('div', 'q-foot');
  foot.append(el('span', 'q-score', ''), again, done);
  card.appendChild(foot);
  refreshCh8Hud();
}
function closeQuiz() {
  const p = $('latheQuiz');
  if (p) p.remove();
  quiz.open = false;
  refreshCh8Hud();
}
function refreshCh8Hud() {
  if (hudApi && hudApi.best) {
    hudApi.best.textContent = `${quiz.best} / ${QUESTIONS.length}`;
    hudApi.last.textContent = quiz.score ? `${quiz.score} / ${QUESTIONS.length}` : '—';
  }
}

/* ============================== 八章内容 ============================== */

const fmtInt = (v) => String(Math.round(v));
function sliderSet(key, v) { P[key] = v; if (hudApi && hudApi.n) hudParamRefresh(); }

function mkParamControls(c) {
  const m = matDef();
  c.appendChild(mkHint('先选材料，再调三要素；超出推荐区间会有黄色提示，试试它们对表面和功率的影响'));
  const chips = mkChips(Object.entries(WORK_MATERIALS).map(([k, v]) => [k, v.name]), P.mat, (key) => {
    P.mat = key;
    const mm2 = matDef();
    hintRange && hintRange(mm2);
    hudParamRefresh();
  });
  c.appendChild(chips);
  const rangeLine = el('div', 'mat-range');
  const hintRange = (mm2) => {
    rangeLine.innerHTML = `<b>${mm2.name}</b> 推荐档：v ${mm2.vMin}~${mm2.vMax} m/min · f ${mm2.fMin}~${mm2.fMax} mm/r · ap ${mm2.apMin}~${mm2.apMax} mm · Ra ${mm2.raLo}~${mm2.raHi} μm —— ${mm2.note}`;
  };
  hintRange(m);
  c.appendChild(rangeLine);
  c.appendChild(mkSlider({ label: '切削速度 v', min: 10, max: 300, step: 5, value: P.v, unit: ' m/min', onInput: (v) => sliderSet('v', v) }));
  c.appendChild(mkSlider({ label: '进给量 f', min: 0.05, max: 0.6, step: 0.01, value: P.f, fmt: (v) => v.toFixed(2), onInput: (v) => sliderSet('f', v) }));
  c.appendChild(mkSlider({ label: '切削深度 ap', min: 0.2, max: 5, step: 0.1, value: P.ap, unit: ' mm', fmt: (v) => v.toFixed(1), onInput: (v) => sliderSet('ap', v) }));
  return chips;
}
function hudParamRefresh() {
  if (!hudApi) return;
  const set = (k, v) => { if (hudApi[k]) hudApi[k].innerHTML = v; };
  set('n', `${calcN()} r/min`);
  set('f', `${P.f.toFixed(2)} mm/r`);
  set('ap', `${P.ap.toFixed(1)} mm`);
  set('v', `${P.v} m/min`);
  set('ft', `${fmtInt(calcFt())} N`);
  set('pw', `${calcP().toFixed(1)} kW${calcP() > SPEC.motorKw ? ' ⚠超限' : ''}`);
  set('ra', `${calcRa(vibRisk())} μm`);
  set('mrr', `${(calcMRR() / 1000).toFixed(1)} cm³/min`);
}

/* --- 第 1 章 认识车床 --- */
CHAPTERS.push({
  title: '认识车床',
  cam: { pos: [-4, 13.5, 24], tgt: [-1, 9, 0] },
  lesson: `<p>车床是<b>工件旋转、刀具进给</b>的回转体加工机床：主轴带动卡盘和工件转起来，车刀沿导轨移动「削」出外圆、端面、螺纹等表面。木工旋木、擀面杖削皮都是同款原理。</p>
<p>这台仿真机床按 <span class="hl">CA6140 普通车床</span>公开样本数据建模（床身最大回转直径 φ400mm）。<b>点选</b>任意部件试试——高亮部件并弹出名称，右下可查看它的功能；或用上方「模型标签」一键标出全部。</p>
<p>认全这 12 个部件，就完成了车工入门第一课。</p>`,
  mount(c) {
    c.appendChild(mkHint('点击 3D 中的部件：高亮 + 认识它。切换「模型标签」可看全部名称'));
    c.appendChild(mkBtn('逐个浏览部件 ▸', () => {
      const keys = PARTS.map((p) => p.key);
      const nx = keys[(keys.indexOf(pickedKey) + 1) % keys.length];
      setPicked(nx);
    }, true));
  },
  hud(box) {
    const c = hudCard([
      ['床身上最大回转直径', 'sw', 'φ400 mm'],
      ['最大工件长度', 'wl', '1000 mm（750 变型）'],
      ['主轴孔径', 'sb', 'φ52 mm'],
      ['主轴转速', 'sp', '10~1400 r/min · 18 级'],
      ['进给量', 'fd', '0.028~6.33 mm/r'],
      ['主电机功率', 'mt', '7.5 kW'],
      ['当前选中', 'pk', '（点击部件）'],
    ]);
    box.appendChild(c.el);
    return c;
  },
  hudUpdate(c) { c.pk.textContent = pickedKey ? partByKey[pickedKey].name : '（点击部件）'; },
  pickInfo(p) {
    toast(`${p.name}：${p.desc}`, '', 4200);
  },
});

/* --- 第 2 章 主要部件结构 --- */
const CH2_FOCUS = {
  headstock: { label: '主轴箱', pos: [-9, 12.5, 11], tgt: [-8.2, 10, 0], text: '主轴箱：电动机→带轮→变速机构→主轴。18 级转速由箱外手柄变换，主轴前端装卡盘。' },
  feedbox:   { label: '进给箱', pos: [-2.6, 10.5, 9], tgt: [-4.0, 7.2, 0.5], text: '进给箱：把主轴旋转分配给丝杠/光杠，换手柄即改变进给量或螺纹导程。' },
  carriage:  { label: '溜板与刀架', pos: [1.8, 11.8, 8.5], tgt: [-1.2, 9.6, 0.3], text: '床鞍沿导轨纵向走（车外圆），中滑板横向吃刀（控直径），四方刀架可装 4 把刀换位。' },
  tailstock: { label: '尾座', pos: [10.5, 12, 8], tgt: [7.5, 10, 0], text: '尾座：顶尖顶住长工件防振动，也可装钻头。套筒由手轮进退，侧面手柄锁紧。' },
  apron:     { label: '溜板箱', pos: [-1.2, 9.5, 12], tgt: [-1.2, 7.4, 2.6], text: '溜板箱：床鞍前挂的操作箱——纵横进给手轮、开合螺母、快移按钮都在这里。' },
};
CHAPTERS.push({
  title: '主要部件结构',
  cam: { pos: [-9, 12.5, 11], tgt: [-8.2, 10, 0] },
  lesson: `<p>车床核心是「<b>三箱一刀一尾座</b>」：</p>
<p><b>主轴箱</b>——动力与旋转的心脏；<b>进给箱</b>——分配进给运动的「变速箱」；<b>溜板箱</b>——操作者面前的操纵台，把手轮转动变成刀架走刀；<span class="hl">四方刀架</span>——一次装 4 把刀，转位换刀；<b>尾座</b>——长工件的另一端支承。</p>
<p>它们的关系：主轴箱让工件<b>转</b>，进给箱+溜板箱让刀具<b>走</b>，刀具与工件的相对运动轨迹就是加工出的表面。</p>`,
  mount(c) {
    c.appendChild(mkHint('点击部件按钮，镜头飞过去并高亮；再点一次当前项取消高亮'));
    for (const [k, f] of Object.entries(CH2_FOCUS)) {
      c.appendChild(mkWideBtn(`聚焦：${f.label}`, () => {
        setPicked(k);
        flyTo(f.pos, f.tgt);
        toast(f.text, '', 4800);
      }));
    }
  },
  hud(box) {
    const c = hudCard([
      ['当前聚焦', 'pk', '（选一个部件）'],
      ['部件要点', 'tx', '见左侧按钮'],
    ]);
    box.appendChild(c.el);
    return c;
  },
  hudUpdate(c) {
    const f = pickedKey && CH2_FOCUS[pickedKey];
    c.pk.textContent = f ? f.label : '（选一个部件）';
    if (f) c.tx.innerHTML = f.text.slice(0, 26) + '…';
  },
  enter() { setPicked('headstock'); },
});

/* --- 第 3 章 卡盘装夹与找正 --- */
CHAPTERS.push({
  title: '卡盘装夹与找正',
  cam: { pos: [-2.4, 11.3, 7], tgt: [-3.9, 10, 0] },
  lesson: `<p>三爪卡盘内是<span class="hl">平面螺纹（盘香螺纹）</span>：用卡盘钥匙转动小锥齿轮，三个爪沿平面螺纹<b>同步开合</b>，自动定心。适合夹对称毛坯；四方/异形件才用四爪单动卡盘找正。</p>
<p>装夹铁律：<b>钥匙即插即拔</b>；夹紧后伸出长度尽量短——悬伸超过约 <span class="hl">3 倍直径</span>刚性骤降，车削会振纹甚至甩弯工件，此时要用尾座顶尖顶住。</p>
<p>下面亲手试一次：插上钥匙旋紧夹住 φ60 毛坯，再试试「伸出长度」滑块与尾座顶紧。</p>`,
  mount(c) {
    c.appendChild(mkHint('①「旋紧夹紧」夹住毛坯（看三爪同步合拢）②调伸出长度看振动风险 ③勾选尾座顶紧看支承效果'));
    c.appendChild(mkWideBtn('🔑 旋紧夹紧（钥匙动画）', () => {
      chuckAction(false);
      toast('三爪沿平面螺纹同步收紧，夹住 φ60 毛坯——钥匙记得随手取下！', 'ok', 3200);
    }, true));
    c.appendChild(mkWideBtn('旋松张开', () => chuckAction(true)));
    c.appendChild(mkSlider({ label: '伸出长度', min: 60, max: 160, step: 5, value: P.overhang, unit: ' mm', onInput: (v) => { P.overhang = v; if (!sim.feeding) { WP.L = v; rebuildWork(); } hudCh3(); } }));
    c.appendChild(mkToggle('尾座顶尖顶紧（抑制振动）', P.tail, (on) => { P.tail = on; hudCh3(); }));
  },
  hud(box) {
    const c = hudCard([
      ['夹紧状态', 'cl', '已夹紧 φ60'],
      ['爪位（开合度）', 'jw', '0 %'],
      ['伸出长度', 'oh', '100 mm'],
      ['悬伸比 L/D', 'rd', '1.7'],
      ['振动风险', 'vb', '低'],
    ]);
    box.appendChild(c.el);
    return c;
  },
  hudUpdate(c) { hudCh3(c); },
});
function hudCh3(c) {
  if (!c) c = hudApi;
  if (!c || !c.cl) return;
  c.cl.textContent = chuck.jawPos < 0.35 ? `已夹紧 φ60` : chuck.jawPos < 0.8 ? '半开' : '已张开';
  c.jw.textContent = `${Math.round(chuck.jawPos * 100)} %`;
  c.oh.textContent = `${WP.L} mm`;
  c.rd.textContent = (WP.L / 60).toFixed(1);
  const risk = vibRisk() ? '高 ⚠' : (WP.L / 60 > 1.8 ? '中' : '低');
  c.vb.textContent = risk;
  c.vb.style.color = risk.startsWith('高') ? '#c96b62' : '';
}

/* --- 第 4 章 对刀与坐标系 --- */
const ALIGN_STEPS = [
  { cap: '① 试切外圆：在 A 段轻切一刀见光（约 0.5mm），此时刀尖的 X 位置 = 该处直径。', run: () => demoTurnSliver() },
  { cap: '② X 向退刀：中滑板退出，Z 向不动——记下这把刀的「当前直径读数」。', run: () => {} },
  { cap: '③ 试切端面：刀尖在右端面平切一小圈见光，该面即定为 <b>Z0</b>（工件右端面）。', run: () => {} },
  { cap: '④ 建立工件坐标系：原点 = 右端面中心，<b>+Z 指向尾座、+X 指向操作者</b>。对刀完成，可正式加工。', run: () => {} },
];
let alignIdx = -1;
CHAPTERS.push({
  title: '对刀与坐标系',
  cam: { pos: [1.8, 11.8, 8.5], tgt: [-1.2, 10, 0] },
  lesson: `<p>数控/普通车床编程前都要回答两个问题：<b>刀尖在哪？工件原点在哪？</b>——这就是对刀。</p>
<p>约定：<span class="hl">Z 轴沿主轴方向（+Z 指向尾座），X 轴径向（+X 指向操作者）</span>；工件坐标系原点习惯设在<b>右端面中心</b>。</p>
<p>普通车床用<b>试切法对刀</b>：轻切外圆记直径 → 退刀 → 平端面定 Z0 → 输入坐标。按下面四步走一遍，注意刀尖与工件坐标轴的对应。</p>`,
  mount(c) {
    c.appendChild(mkHint('依次点 ①→④：每步看 3D 里刀尖动作与黄色提示；开启「显示坐标系」对照 X/Z 轴'));
    c.appendChild(mkToggle('显示坐标系（X 红 / Z 蓝）', P.showAxes, (on) => { P.showAxes = on; axesGroup.visible = on; }));
    const stepsWrap = el('div', 'lathe-steps');
    const cap = el('div', 'lathe-step-cap', '点第①步开始试切对刀');
    ALIGN_STEPS.forEach((s, i) => {
      const b = el('button', 'lathe-step', s.cap.slice(0, 9));
      b.type = 'button';
      b.addEventListener('click', () => {
        alignIdx = i;
        [...stepsWrap.children].forEach((x, j) => { x.classList.toggle('cur', j === i); x.classList.toggle('done', j < i); });
        cap.innerHTML = s.cap;
        s.run && s.run();
      });
      stepsWrap.appendChild(b);
    });
    c.append(stepsWrap, cap);
    c.appendChild(mkWideBtn('重玩对刀流程', () => { alignIdx = -1; [...stepsWrap.children].forEach((x) => x.classList.remove('cur', 'done')); cap.textContent = '点第①步开始试切对刀'; }));
  },
  hud(box) {
    const c = hudCard([
      ['刀尖 X（径向）', 'tx', '—'],
      ['刀尖 Z（轴向）', 'tz', '—'],
      ['对刀进度', 'tp', '未开始'],
      ['坐标系', 'cs', '关闭'],
    ]);
    box.appendChild(c.el);
    return c;
  },
  hudUpdate(c) {
    c.tx.textContent = `${Math.round(toolGroup.position.z * 100)} mm`;
    c.tz.textContent = `${Math.round((toolGroup.position.x - CHUCK_FACE_X) * 100)} mm`;
    c.tp.textContent = alignIdx < 0 ? '未开始' : `第 ${['①', '②', '③', '④'][alignIdx]} 步`;
    c.cs.textContent = P.showAxes ? '已显示' : '关闭';
  },
  enter() { axesGroup && (axesGroup.visible = P.showAxes); },
});

/* --- 第 5 章 切削三要素 --- */
CHAPTERS.push({
  title: '切削三要素',
  cam: { pos: [-6, 13, 20], tgt: [-1, 9.5, 0] },
  lesson: `<p><b>切削三要素</b>决定切削的快慢、好坏与机床吃不吃得消：</p>
<p><span class="hl">切削速度 v</span>——工件表面转多快（换算主轴转速 <b>n = 1000v / (πD)</b> r/min）；<span class="hl">进给量 f</span>——工件每转刀走多远，直接刻在表面上（纹距=f）；<span class="hl">切削深度 ap</span>——一刀切进去多深，直径减小 2×ap。</p>
<p>经验方向：v 高→表面亮但刀易磨损；f 大→效率高但表面糙；ap 大→效率猛但切削力/功率大。调下面的滑块，右侧读数实时变化——把功率顶过 7.5kW 试试「闷车」。</p>`,
  mount(c) { mkParamControls(c); },
  hud(box) {
    const c = hudCard([
      ['主轴转速 n', 'n', '—'],
      ['切削速度 v', 'v', '—'],
      ['进给量 f', 'f', '—'],
      ['切削深度 ap', 'ap', '—'],
      ['切削力 Ft≈', 'ft', '—'],
      ['功率 P≈', 'pw', '—'],
      ['去除率 Q', 'mrr', '—'],
      ['Ra 估算', 'ra', '—'],
    ]);
    box.appendChild(c.el);
    return c;
  },
  hudUpdate() { hudParamRefresh(); },
  enter() { hudParamRefresh(); },
});

/* --- 第 6 章 车削外圆仿真 --- */
CHAPTERS.push({
  title: '车削外圆仿真',
  cam: { pos: [1.5, 11, 9], tgt: [-2, 10, 0] },
  lesson: `<p>把前面学的串起来走一刀：启动主轴 → <b>进给</b> → 看刀具沿 Z 走刀、切屑飞出、<span class="hl">直径实时变小</span>、表面纹路随参数变化。</p>
<p>观察点：铝高速切=亮银细纹；45 钢中速=银灰螺旋纹；转速过低=鳞刺；悬伸长又没顶尖=振纹。<b>多刀分层</b>是车工习惯：粗车留 0.5mm，精车一刀到尺寸。</p>
<p>走完刀看右下「本刀评价」与走刀记录；功率超 7.5kW 会<b>闷车停转</b>——把参数降下来再启动。</p>`,
  mount(c) {
    mkParamControls(c);
    c.appendChild(el('div', 'ctl-sep'));
    c.appendChild(mkWideBtn('▶ 启动主轴', () => startSpindle(), true));
    c.appendChild(mkWideBtn('⏵ 进给（走刀）', () => beginPass('turn')));
    c.appendChild(mkWideBtn('⏸ 停止进给', () => stopFeed()));
    c.appendChild(mkToggle('尾座顶尖顶紧', P.tail, (on) => { P.tail = on; }));
    c.appendChild(mkWideBtn('↺ 工件复位', () => { resetWorkpiece(); toast('毛坯复位 φ60×' + WP.L + 'mm，记录已清空', 'ok', 2200); }));
    c.appendChild(mkLog());
  },
  hud(box) {
    const c = hudCard([
      ['主轴 n', 'n', '停'],
      ['当前断面 z', 'zc', '—'],
      ['当前直径 φ', 'dia', '60.0 mm'],
      ['功率 P≈', 'pw', '—'],
      ['Ra 估算', 'ra', '—'],
      ['累计去除', 'cv', '0 cm³'],
    ]);
    box.appendChild(c.el);
    return c;
  },
  hudUpdate(c) {
    hudParamRefresh();
    c.n.textContent = sim.feeding ? `${calcN()} r/min` : sim.spinning ? `${calcN()} r/min` : sim.stall ? '闷车停转 ⚠' : '停';
    c.zc.textContent = `${Math.round(sim.feeding && sim.passType === 'turn' ? sim.zCur : WP.L)} mm`;
    c.dia.textContent = `${(2 * WP.r[Math.min(N_ST - 1, Math.floor(WP.L / 2))]).toFixed(1)} mm`;
    c.cv.textContent = `${(WP.cutVol / 1000).toFixed(1)} cm³`;
  },
});

/* --- 第 7 章 车端面与倒角 --- */
CHAPTERS.push({
  title: '车端面与倒角',
  cam: { pos: [2.8, 11.2, 7], tgt: [-2.4, 10, 0] },
  lesson: `<p><b>车端面</b>：刀尖从外圆向中心走，把右端面切平定长度。要点：从外向中心车、刀尖对准轴线；中心残留小凸台叫<b>凸心</b>（刀尖过高/未到中心），中心凹下去叫<b>凹心</b>（刀尖过低）——都用下面的缺陷演示看一遍。</p>
<p><b>倒角</b>：45° 斜面一走刀，C2 即 2×45°，去毛刺、方便装配。车工口头禅：「先倒角再量尺寸」。</p>`,
  mount(c) {
    c.appendChild(mkHint('先车一刀端面（长度 -2mm），再倒一个 C2 角；缺陷演示选凸心/凹心后再车端面可对照'));
    c.appendChild(mkWideBtn('⏵ 车端面一刀（-2mm）', () => beginPass('face'), true));
    c.appendChild(mkWideBtn('⏵ 45° 倒角一刀（C2）', () => beginPass('chamfer')));
    const chips = mkChips([['flat', '正常端面'], ['convex', '凸心缺陷'], ['concave', '凹心缺陷']], P.faceKind, (k) => {
      P.faceKind = k;
      toast(k === 'flat' ? '正常：刀尖严格过轴线，端面平整光洁' : k === 'convex' ? '凸心：刀尖高于轴线，中心切不到，残留小凸台' : '凹心：刀尖低于轴线，端面中心凹陷（平面度差）', k === 'flat' ? 'ok' : 'warn', 3600);
    });
    c.appendChild(chips);
    c.appendChild(mkWideBtn('↺ 工件复位', () => { resetWorkpiece(); }));
  },
  hud(box) {
    const c = hudCard([
      ['工件长度', 'wl', '—'],
      ['端面状态', 'fc', '平整'],
      ['倒角', 'cf', '无'],
      ['端面平面度', 'fl', '—'],
    ]);
    box.appendChild(c.el);
    return c;
  },
  hudUpdate(c) {
    c.wl.textContent = `${Math.round(WP.L)} mm`;
    c.fc.textContent = { flat: '平整', convex: '凸心 ⚠', concave: '凹心 ⚠' }[WP.faceState] || '平整';
    c.cf.textContent = WP.chamfer ? `C${WP.chamfer}` : '无';
    c.fl.textContent = { flat: '≈0.02 mm 达标', convex: '中心凸起 0.5 mm+', concave: '中心凹陷 0.5 mm+' }[WP.faceState] || '—';
  },
});

/* --- 第 8 章 安全规程与随堂检测 --- */
const SAFETY_10 = [
  '工作服紧袖，长发入帽；操作机床<b>禁止戴手套</b>',
  '卡盘钥匙<b>用完立即拔下</b>，绝不开机取物',
  '工件卡盘<b>夹紧后开机前</b>，手动转一圈检查干涉',
  '测量与清除切屑必须<b>停机</b>进行，禁止徒手刹屑',
  '刀具离开工件一段距离后再启动主轴',
  '主轴变速（普通车床）必须<b>停机</b>换挡',
  '导轨面上不得放置工具、量具与工件',
  '切削区飞溅，戴<b>护目镜</b>；冷却液防滑防皮肤过敏',
  '离开机床<b>停机断电</b>；异常响声/异味立即停机报告',
  '工作结束清理机床、导轨涂油保养，工具归位',
];
CHAPTERS.push({
  title: '安全规程与随堂检测',
  cam: { pos: [0.5, 13.5, 26], tgt: [0, 9, 0] },
  lesson: `<p>车床旋转件多、切屑锋利，<span class="hl">安全规程是血写的</span>。十条核心要点：</p>
<div class="lathe-safe">${SAFETY_10.map((s) => `<div><span>${s}</span></div>`).join('')}</div>
<p style="margin-top:8px">记住三条底线：<b>停机测量、钥匙即拔、禁止手套</b>。下面 6 道随堂题，全对才算出师。</p>`,
  mount(c) {
    c.appendChild(mkHint('先通读左侧安全十条，点「开始随堂检测」——答完即时亮分'));
    c.appendChild(mkWideBtn('📝 开始随堂检测（6 题）', () => quizOpen(), true));
    if (quiz.best) c.appendChild(mkWideBtn('查看上次成绩', () => { toast(`最好成绩 ${quiz.best}/${QUESTIONS.length} 题`, 'ok'); }));
  },
  hud(box) {
    const c = hudCard([
      ['检测题数', 'total', `${QUESTIONS.length} 题`],
      ['最好成绩', 'best', '—'],
      ['最近成绩', 'last', '—'],
      ['及格线', 'pass', '80 分（答对 5 题）'],
    ]);
    box.appendChild(c.el);
    return c;
  },
  hudUpdate() {},
});

/* ============================== 坐标轴显示（ch4） ============================== */

let axesGroup;
function buildAxes() {
  axesGroup = new THREE.Group();
  const zEnd = CHUCK_FACE_X + WP.L * U;
  const az = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(zEnd, 10, 0), 1.8, 0x3a8fd9, 0.16, 0.1);
  const ax = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), new THREE.Vector3(zEnd, 10, 0), 1.3, 0xd9534f, 0.16, 0.1);
  axesGroup.add(az, ax);
  const oz = el('div', 'lathe-label', '<b>Z</b>');
  const ox = el('div', 'lathe-label', '<b>X</b>');
  oz._anchor = new THREE.Vector3(zEnd + 1.9, 10, 0);
  ox._anchor = new THREE.Vector3(zEnd, 10, 1.45);
  els.labels.appendChild(oz);
  els.labels.appendChild(ox);
  axesGroup.userData.labels = [oz, ox];
  axesGroup.visible = false;
  scene.add(axesGroup);
}
function stepAxesLabels() {
  if (!axesGroup || !axesGroup.visible || STILL) return;
  const v = new THREE.Vector3();
  for (const d of axesGroup.userData.labels) {
    v.copy(d._anchor);
    const endX = CHUCK_FACE_X + WP.L * U;
    if (d.textContent === 'Z') v.set(endX + 1.9, 10, 0); else v.set(endX, 10, 1.45);
    v.project(camera);
    d.style.display = v.z < 1 ? 'block' : 'none';
    d.style.left = `${(v.x * 0.5 + 0.5) * els.stage.clientWidth}px`;
    d.style.top = `${(-v.y * 0.5 + 0.5) * els.stage.clientHeight}px`;
  }
}

/* ============================== 对刀演示（试切一刀见光） ============================== */

function demoTurnSliver() {
  if (sim.feeding) return;
  const zStart = Math.min(WP.L - 20, 80), zEnd = zStart - 10;
  Object.assign(sim, { feeding: true, passType: 'demo', zFrom: zStart, zTo: zEnd, zCur: zStart, tPass: 0, chipAcc: 0 });
  sim.tPassDur = 1.2;
}
function stepDemo(dt) {
  const prog = THREE.MathUtils.clamp(sim.tPass / sim.tPassDur, 0, 1);
  sim.zCur = sim.zFrom + (sim.zTo - sim.zFrom) * prog;
  const iA = Math.ceil(sim.zCur / 2), iB = Math.floor(sim.zFrom / 2);
  for (let i = iA; i <= iB; i++) if (WP.r[i] > 29.5) WP.r[i] = 29.5;
  paintRegion(sim.zCur, Math.min(sim.zFrom, WP.L), { f: 0.1, vFactor: 0.9, vib: false, mat: matDef() });
  rebuildWork();
  setTool(CHUCK_FACE_X + sim.zCur * U, 0.3);
  if (prog >= 1) { sim.feeding = false; toast('①见光完成：当前直径读数记为 φ59 —— 这就是刀尖的 X 基准', 'ok', 3600); }
}

/* ============================== 顶栏工具与快捷键 ============================== */

function initTools() {
  els.resetBtn.addEventListener('click', () => {
    if (sim.feeding) stopFeed();
    resetWorkpiece();
    chuck.jawPos = chuck.target = 1; setJaws(1);
    sim.spinning = false; sim.stall = false;
    toast('已重做：毛坯 φ60×220 复位，参数保留', 'ok', 2400);
  });
  els.labelBtn.addEventListener('click', () => {
    labelsOn = !labelsOn;
    els.labelBtn.classList.toggle('on', labelsOn);
    els.labelBtn.setAttribute('aria-pressed', String(labelsOn));
  });
  els.labelBtn.classList.toggle('on', labelsOn); // 窄屏默认收起（见 labelsOn 初始值）
  els.viewBtn.addEventListener('click', () => { const cam = CHAPTER_CAMS[currentCh] || CHAPTERS[currentCh].cam; flyTo(cam.pos, cam.tgt); });
  els.qualBtn.addEventListener('click', () => {
    qualityHi = !qualityHi;
    renderer.setPixelRatio(qualityHi ? Math.min(devicePixelRatio || 1, 2) : 1);
    renderer.shadowMap.enabled = qualityHi;
    keyLight.castShadow = qualityHi;
    els.qualBtn.classList.toggle('on', qualityHi);
    els.qualBtn.textContent = qualityHi ? '画质优先' : '流畅优先';
  });
  els.bigBtn.addEventListener('click', () => {
    const on = document.body.classList.toggle('lathe-big');
    els.bigBtn.classList.toggle('on', on);
    els.bigBtn.setAttribute('aria-pressed', String(on));
  });
  els.focusBtn.addEventListener('click', () => {
    const on = els.shell.classList.toggle('focus-mode');
    els.focusBtn.setAttribute('aria-pressed', String(on));
  });
  $('chapPrev').addEventListener('click', () => gotoChapter(currentCh - 1));
  $('chapNext').addEventListener('click', () => gotoChapter(currentCh + 1));
  const foldBtn = (btnId, cls, railBtnId) => {
    $(btnId).addEventListener('click', () => {
      const on = els.shell.classList.toggle(cls);
      $(btnId).setAttribute('aria-expanded', String(!on));
      if (railBtnId) $(railBtnId).setAttribute('aria-expanded', String(on));
    });
  };
  foldBtn('foldLBtn', 'fold-l', 'unfoldLBtn');
  foldBtn('unfoldLBtn', 'fold-l', 'foldLBtn');
  foldBtn('foldRBtn', 'fold-r', 'unfoldRBtn');
  foldBtn('unfoldRBtn', 'fold-r', 'foldRBtn');
  // 手风琴折叠（localStorage 记忆）
  for (const acc of document.querySelectorAll('.acc')) {
    const head = acc.querySelector('.acc-head');
    const key = 'edulab-lathe-acc-' + acc.dataset.acc;
    try { if (localStorage.getItem(key) === '0') acc.classList.add('closed'); } catch (e) {}
    head.addEventListener('click', () => {
      acc.classList.toggle('closed');
      try { localStorage.setItem(key, acc.classList.contains('closed') ? '0' : '1'); } catch (e) {}
      head.setAttribute('aria-expanded', String(!acc.classList.contains('closed')));
    });
  }
  window.addEventListener('keydown', (e) => {
    if (e.target && /input|textarea/i.test(e.target.tagName)) return;
    if (e.key === 'ArrowLeft') gotoChapter(currentCh - 1);
    else if (e.key === 'ArrowRight') gotoChapter(currentCh + 1);
    else if (e.key === 'r' || e.key === 'R') els.viewBtn.click();
    else if (e.key === '[') $('foldLBtn').click();
    else if (e.key === ']') $('foldRBtn').click();
  });
}

/* ============================== still 截图协议 ============================== */

function applyStill() {
  if (!STILL) return;
  const valid = ['front', 'side', 'left', 'right', 'top', 'near', 'far', 'headstock-near', 'chuck-jaw-near', 'tailstock-near', 'carriage-near', 'dynamics-near'];
  const chM = SHOT.match(/^ch([1-8])$/);
  controls.enabled = false;
  sim.spinAngle = 0.65; // 固定主轴相位，保证可复现
  setJaws(0);           // 默认已夹紧 φ60（爪合拢）
  chuck.jawPos = chuck.target = 0;
  if (chM) {
    const i = parseInt(chM[1], 10) - 1;
    if (i === 5) { P.tail = true; tailQuillLen = 0.75; tailstockFollow(); tailstock.position.x = CHUCK_FACE_X + WP.L * U + 1.35; }
    gotoChapter(i, true);
    const cam = CHAPTER_CAMS[i] || CHAPTERS[i].cam;
    camera.position.set(...cam.pos);
    controls.target.set(...cam.tgt);
  } else if (valid.includes(SHOT)) {
    gotoChapter(0, true);
    if (SHOT === 'tailstock-near') { // 特写展示：套筒伸出，露出刻度环与锥孔口
      tailQuillLen = 0.45;
      quill.children.forEach((c) => { if (c.userData.qx) c.position.x = c.userData.qx(tailQuillLen); });
    }
    const c = CAMS[SHOT];
    camera.position.set(...c.pos);
    controls.target.set(...c.tgt);
  } else {
    gotoChapter(0, true);
  }
  camTween.on = false; // 章节飞行已即时完成，钉死机位
  camera.lookAt(controls.target); // still 下 controls.update() 不跑，需手动对准目标
  controls.update();
  window.__latheStill = true;
}

/* ============================== 主循环 ============================== */

const clock = new THREE.Clock();
let hudTimer = 0;
function animate() {
  if (disposed) return;
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.1); // 上限放宽：headless 低帧率下仿真不缩水
  stepCamTween(dt);
  if (!STILL) controls.update();
  // 主轴视觉转速（真实 n 最高 1400rpm 视觉不可辨，按比例压缩；注释：纯视觉降速）
  const nTarget = sim.spinning ? THREE.MathUtils.clamp(calcN() / 60 / 10, 0, 3.2) : 0;
  sim.nVisual += (nTarget - sim.nVisual) * Math.min(1, dt * (sim.stall ? 6 : 2.5));
  sim.spinAngle = (sim.spinAngle + sim.nVisual * 2 * Math.PI * dt) % (Math.PI * 2);
  spindleGroup.rotation.x = sim.spinAngle;
  if (sim.feeding) leadscrew.rotation.x -= dt * 7;
  // 走刀
  if (sim.feeding) {
    if (sim.passType === 'demo') { sim.tPass += dt; stepDemo(dt); }
    else stepPass(dt);
  }
  stepChuck(dt);
  if (!STILL) tailstockFollow();
  stepChips(dt);
  stepLabels();
  stepAxesLabels();
  // HUD 节流刷新
  hudTimer += dt;
  if (hudTimer > 0.2) { hudTimer = 0; hudRefresh(); }
  renderer.render(scene, camera);
}

function onResize() {
  const w = els.stage.clientWidth, h = els.stage.clientHeight;
  camera.aspect = w / Math.max(1, h);
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}

/* ============================== 调试 API（供自动化冒烟/截图工具，与页面同代码路径） ============================== */

window.__lathe = {
  ready: false,
  scene: () => scene,
  raycast: (px, py) => {
    const cv = renderer.domElement;
    const r = cv.getBoundingClientRect();
    pointer.set(((px - r.left) / r.width) * 2 - 1, -((py - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(scene.children, true).filter((h) => h.object.visible);
    return hits.slice(0, 3).map((h) => ({ name: h.object.name, parent: h.object.parent && h.object.parent.name, type: h.object.type }));
  },
  hideByName: (n) => { let k = 0; scene.traverse((o) => { if (o.name === n) { o.visible = false; k++; } }); return k; },
  showAll: () => scene.traverse((o) => { o.visible = true; }),
  gotoChapter,
  setParams(o) { Object.assign(P, o); },
  getState() {
    return {
      chapter: currentCh + 1, spinning: sim.spinning, feeding: sim.feeding,
      jawPos: chuck.jawPos, L: WP.L, cutVol: Math.round(WP.cutVol),
      dia: (2 * WP.r[Math.min(N_ST - 1, Math.floor(WP.L / 2))]).toFixed(1),
      n: calcN(), pw: +calcP().toFixed(2), ra: calcRa(vibRisk()),
      quizBest: quiz.best, passes: WP.passes.length,
    };
  },
  chuckAction, startSpindle, beginPass, stopFeed, quizOpen, quizAnswer, quizNext, closeQuiz,
  quiz: () => quiz,
  hud: () => hudApi,
  question: (i) => QUESTIONS[i],
};

/* ============================== 启动 ============================== */

function boot() {
  initRenderer();
  buildEnv();
  floorBuild();
  bedBuild();
  headstockBuild();
  spindleBuild();
  carriageBuild();
  tailstockBuild();
  auxBuild();
  ensureSurfaceTex();
  ensureFaceTex();
  resetWorkpiece(true);
  bindParts(machine);
  scene.add(machine);
  buildAxes();
  initChips();
  buildChapNav();
  initPicking();
  initLabels();
  initTools();
  watchTheme();
  // still 截图的主题覆盖必须在 edu-theme.js（body 末尾）加载之后再设，
  // 否则会被其加载时的主题应用覆盖回去
  if (STILL && (THEME_OVERRIDE === 'light' || THEME_OVERRIDE === 'dark')) {
    document.documentElement.setAttribute('data-theme', THEME_OVERRIDE);
  }
  window.addEventListener('resize', onResize);
  onResize();
  applyStill();
  if (!STILL) gotoChapter(0);
  const ld = $('latheLoader');
  if (ld) ld.classList.add('hide');
  animate();
  window.__lathe.ready = true;
}
try {
  boot();} catch (err) {
  console.error('[lathe] boot failed:', err);
}
