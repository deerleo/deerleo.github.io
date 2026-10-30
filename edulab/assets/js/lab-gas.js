/* EduLab · 实验室制取气体（gas）
 * 章节：加热高锰酸钾制氧气 / 分解过氧化氢制氧气 / 制取二氧化碳 / 氧气与二氧化碳的性质 / 随堂检测
 * 场景：写实化学实验台（PBR 台面 + 玻璃器材程序化建模），气泡/气流粒子、酒精灯火焰、
 *       「查装定点收离熄」步骤交互（做错顺序会倒吸炸裂）、药品对比与气体检验。
 */
import {
  THREE, clamp,
  loadTexture, loadHDR, loadAll, createApp, cameraTweenTick, makeLoader,
  createSections, createControlsPanel, makeHUD, makeTextSprite, makeGlowTexture,
} from './edu-core.js';

const TAU_ = Math.PI * 2;

/* ---------------- 纹理 ---------------- */

const TEX = {
  skyWebp: '../assets/textures/sky/sky_court-BKHrsJQE.webp',
  skyHdr: '../assets/textures/sky/sky_court-BLHJ2ADI.hdr',
  plankDiff: '../assets/textures/pbr/plank_diff-DPUnSb0W.webp',
  plankArm: '../assets/textures/pbr/plank_arm-CztMy41m.webp',
  plankNor: '../assets/textures/pbr/plank_nor-BoGKkjWD.webp',
  paintDiff: '../assets/textures/pbr/paint_diff-RYyGtI7R.webp',
  paintArm: '../assets/textures/pbr/paint_arm-BtvMA06a.webp',
  paintNor: '../assets/textures/pbr/paint_nor-DgERPfRh.webp',
  slabDiff: '../assets/textures/pbr/slab_diff-Bzxi6irn.webp',
  slabArm: '../assets/textures/pbr/slab_arm-OyJUI_RU.webp',
  slabNor: '../assets/textures/pbr/slab_nor-D2MZT0BN.webp',
  wallDiff: '../assets/textures/pbr/wall_diff-CNpUUuOJ.webp',
  wallNor: '../assets/textures/pbr/wall_nor-DS8uKrFH.webp',
};

/* ---------------- 本实验专属样式（不改动共享 lab.css） ---------------- */

const style = document.createElement('style');
style.textContent = `
.gas-toast {
  position: absolute; top: 14px; left: 50%; transform: translate(-50%, -8px);
  z-index: 26; max-width: min(420px, calc(100% - 28px));
  padding: 9px 16px; border-radius: 12px; font-size: 13.5px; line-height: 1.55;
  background: color-mix(in srgb, var(--card) 92%, transparent);
  border: 1px solid var(--card-border); box-shadow: var(--shadow);
  color: var(--text); opacity: 0; pointer-events: none;
  transition: opacity .25s, transform .25s;
}
.gas-toast.show { opacity: 1; transform: translate(-50%, 0); }
.gas-toast.ok { border-color: color-mix(in srgb, #3fa96f 55%, transparent); }
.gas-toast.warn { border-color: color-mix(in srgb, #d9534f 60%, transparent); color: #c96b62; }
.gas-fault {
  position: absolute; top: 64px; left: 50%; transform: translateX(-50%);
  z-index: 26; width: min(430px, calc(100% - 28px));
  border-radius: 12px; padding: 12px 16px; font-size: 13px; line-height: 1.65;
  background: color-mix(in srgb, #d9534f 12%, var(--card));
  border: 1px solid color-mix(in srgb, #d9534f 55%, transparent);
  color: var(--text); display: none;
}
.gas-fault.show { display: block; }
.gas-fault b { color: #c96b62; }
.gas-steps { display: flex; gap: 4px; flex-wrap: wrap; align-items: center; }
.gas-step { min-width: 34px; text-align: center; font-weight: 600; }
.gas-step.done { background: color-mix(in srgb, #3fa96f 18%, var(--card)); border-color: color-mix(in srgb, #3fa96f 45%, transparent); color: #2c8455; }
.gas-step.now { background: var(--accent); border-color: var(--accent); color: #fff; }
.gas-step.next-hint { opacity: .55; }
`;
document.head.appendChild(style);

/* ---------------- 场景 ---------------- */

const stage = document.getElementById('stage');
const loader = makeLoader(stage, '正在搭建化学实验台…');

const app = createApp({
  container: stage,
  fov: 42, near: 0.05, far: 60,
  cameraPos: [0.6, 1.5, 3.0],
  target: [0, 1.02, 0],
  minDistance: 0.6, maxDistance: 9,
  exposure: 1.05,
  keepBackground: true,
});
const { scene, camera, controls } = app;

scene.add(new THREE.AmbientLight(0xbcc6d4, 0.55));
const sunLight = new THREE.DirectionalLight(0xfff2e2, 1.7);
sunLight.position.set(3.5, 5, 3);
scene.add(sunLight);
const fillLight = new THREE.DirectionalLight(0xdfe8ff, 0.5);
fillLight.position.set(-4, 3, -2.5);
scene.add(fillLight);

/* ---------------- 材质与建模工具 ---------------- */

function stdMat(opts) { return new THREE.MeshStandardMaterial(opts); }
function glassMat(opacity = 0.18, color = 0xb9d2e2) {
  return new THREE.MeshPhysicalMaterial({
    color, metalness: 0, roughness: 0.04, transparent: true, opacity,
    envMapIntensity: 0.4, clearcoat: 0.6, clearcoatRoughness: 0.2,
    side: THREE.DoubleSide, depthWrite: false,
  });
}
function liquidMat(color, opacity = 0.45) {
  return new THREE.MeshPhysicalMaterial({
    color, metalness: 0, roughness: 0.12, transparent: true, opacity,
    envMapIntensity: 0.9, side: THREE.DoubleSide,
  });
}
const metalMat = stdMat({ color: 0x454b52, roughness: 0.42, metalness: 0.78 });
const rubberMat = stdMat({ color: 0x494b52, roughness: 0.92, metalness: 0.05 });

function lathe(pts, mat, seg = 40) {
  const geo = new THREE.LatheGeometry(pts.map((p) => new THREE.Vector2(p[0], p[1])), seg);
  return new THREE.Mesh(geo, mat);
}
function tubeAlong(points, radius = 0.004) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
  const mesh = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 40, radius, 8),
    glassMat(0.3, 0xb0c8d8)
  );
  return { mesh, curve };
}
function box(w, h, d, mat) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); }

/* 常用器材 */

function makeTestTube(len = 0.13, r = 0.022) {
  const pts = [
    [0, 0], [r * 0.45, 0], [r * 0.85, 0.003], [r * 0.98, 0.008],
    [r, 0.016], [r, len - 0.006], [r * 1.06, len - 0.002], [r * 1.1, len],
  ];
  return lathe(pts, glassMat());
}
function makeFlask() { // 锥形瓶
  const pts = [
    [0, 0], [0.012, 0], [0.05, 0.006], [0.052, 0.012],
    [0.021, 0.088], [0.021, 0.13], [0.0235, 0.132], [0.0255, 0.135],
  ];
  return lathe(pts, glassMat());
}
function makeGasJar(h = 0.115, r = 0.045) { // 集气瓶（口朝上）
  const pts = [
    [0, 0.004], [r * 0.9, 0.005], [r, 0.01], [r, h - 0.005],
    [r * 1.05, h], [r * 1.05, h + 0.004],
  ];
  return lathe(pts, glassMat());
}
function makeGlassPlate(r = 0.05) { // 毛玻璃片
  const m = box(r * 2.2, 0.004, r * 2.2, glassMat(0.4, 0xe6eef4));
  m.rotation.y = 0.35;
  return m;
}
function makeSepFunnel() { // 分液漏斗（球胆+活塞+下管）
  const g = new THREE.Group();
  const bulb = lathe([
    [0.004, 0.175], [0.02, 0.17], [0.032, 0.155], [0.032, 0.115],
    [0.018, 0.09], [0.005, 0.082], [0.005, 0.045],
  ], glassMat());
  const cock = box(0.02, 0.014, 0.014, stdMat({ color: 0x2f6f8f, roughness: 0.5 }));
  cock.position.y = 0.045;
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.045, 12), glassMat(0.3, 0xb0c8d8));
  stem.position.y = 0.0225;
  const cap = lathe([[0.006, 0.178], [0.024, 0.18], [0.024, 0.19]], stdMat({ color: 0x2e5d7a, roughness: 0.55 }));
  g.add(bulb, cock, stem, cap);
  return g;
}
function makeThistleFunnel() { // 长颈漏斗
  const g = new THREE.Group();
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.17, 12), glassMat(0.3, 0xb0c8d8));
  neck.position.y = 0.085;
  const cup = lathe([
    [0.005, 0.166], [0.03, 0.172], [0.034, 0.176], [0.034, 0.186], [0.006, 0.188],
  ], glassMat());
  g.add(neck, cup);
  return g;
}
function makeStopper(r = 0.0235, holes = 2) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.85, 0.02, 20), rubberMat);
  g.add(body);
  if (holes >= 1) {
    const h1 = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.024, 10), stdMat({ color: 0x22252a }));
    h1.position.x = holes >= 2 ? -0.009 : 0;
    g.add(h1);
  }
  if (holes >= 2) {
    const h2 = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.024, 10), stdMat({ color: 0x22252a }));
    h2.position.x = 0.009;
    g.add(h2);
  }
  return g;
}
function makeAlcoholLamp() {
  const g = new THREE.Group();
  const body = lathe([
    [0, 0.001], [0.014, 0.002], [0.036, 0.009], [0.038, 0.012],
    [0.038, 0.033], [0.03, 0.037], [0.009, 0.04], [0.009, 0.054],
  ], glassMat(0.3, 0xd8e4da));
  const fuel = lathe([
    [0, 0.004], [0.012, 0.005], [0.033, 0.012], [0.035, 0.03], [0.028, 0.034],
  ], liquidMat(0x9fd0e8, 0.42));
  const wick = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.004, 0.02, 8), stdMat({ color: 0xe8e2d2, roughness: 1 }));
  wick.position.y = 0.062;
  g.add(body, fuel, wick);
  return g;
}
function makeStand() { // 铁架台
  const g = new THREE.Group();
  const base = box(0.2, 0.012, 0.26, metalMat);
  base.position.y = 0.006;
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.55, 12), metalMat);
  rod.position.set(0, 0.275, -0.1);
  g.add(base, rod);
  return g;
}
function makeClamp() { // 铁夹（长臂 + 夹持爪，臂沿 +z 伸出）
  const g = new THREE.Group();
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.3, 10), metalMat);
  arm.rotation.x = Math.PI / 2;
  arm.position.z = 0.15;
  const joint = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.03, 12), metalMat);
  joint.rotation.x = Math.PI / 2;
  joint.position.z = 0.02;
  const prong1 = box(0.035, 0.005, 0.005, metalMat); prong1.position.set(-0.014, 0.013, 0.285);
  const prong2 = box(0.035, 0.005, 0.005, metalMat); prong2.position.set(-0.014, -0.013, 0.285);
  g.add(arm, joint, prong1, prong2);
  return g;
}
function makeTrough() { // 水槽（玻璃缸 + 水）
  const g = new THREE.Group();
  const w = 0.26, h = 0.075, d = 0.15, t = 0.004;
  const bottom = box(w, t, d, glassMat(0.3)); bottom.position.y = t / 2;
  const front = box(w, h, t, glassMat(0.22)); front.position.set(0, h / 2, d / 2);
  const back = box(w, h, t, glassMat(0.22)); back.position.set(0, h / 2, -d / 2);
  const left = box(t, h, d, glassMat(0.22)); left.position.set(-w / 2, h / 2, 0);
  const right = box(t, h, d, glassMat(0.22)); right.position.set(w / 2, h / 2, 0);
  const water = box(w - 0.012, h - 0.018, d - 0.012, liquidMat(0x8ecbe2, 0.38));
  water.position.y = (h - 0.018) / 2 + 0.005;
  g.add(bottom, front, back, left, right, water);
  g.userData.water = water;
  return g;
}

/* ---------------- 实验室环境 ---------------- */

const worldG = new THREE.Group();
scene.add(worldG);

const pbr = {}; // 载入后填充

function buildWorld() {
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(16, 12),
    stdMat({ color: 0xaeb4ba, roughness: 0.85, metalness: 0.05, map: pbr.slabDiff, roughnessMap: pbr.slabArm, normalMap: pbr.slabNor })
  );
  floor.rotation.x = -Math.PI / 2;
  pbr.slabDiff.wrapS = pbr.slabDiff.wrapT = THREE.RepeatWrapping;
  pbr.slabDiff.repeat.set(6, 5);
  worldG.add(floor);

  pbr.wallDiff.wrapS = pbr.wallDiff.wrapT = THREE.RepeatWrapping;
  pbr.wallDiff.repeat.set(5, 1.6);
  pbr.wallNor.wrapS = pbr.wallNor.wrapT = THREE.RepeatWrapping;
  pbr.wallNor.repeat.set(5, 1.6);
  const wall = new THREE.Mesh(
    new THREE.PlaneGeometry(16, 5),
    stdMat({ color: 0xd9dde2, roughness: 0.9, map: pbr.wallDiff, normalMap: pbr.wallNor })
  );
  wall.position.set(0, 2.5, -2.6);
  worldG.add(wall);

  const benchBody = box(4.9, 0.85, 1.5, stdMat({
    color: 0xe4e7ea, roughness: 0.55, metalness: 0.08,
    map: pbr.paintDiff, roughnessMap: pbr.paintArm, normalMap: pbr.paintNor,
  }));
  benchBody.position.set(0, 0.425, -0.05);
  worldG.add(benchBody);

  pbr.plankDiff.wrapS = pbr.plankDiff.wrapT = THREE.RepeatWrapping;
  pbr.plankDiff.repeat.set(4, 1.3);
  pbr.plankArm.wrapS = pbr.plankArm.wrapT = THREE.RepeatWrapping;
  pbr.plankArm.repeat.set(4, 1.3);
  pbr.plankNor.wrapS = pbr.plankNor.wrapT = THREE.RepeatWrapping;
  pbr.plankNor.repeat.set(4, 1.3);
  const benchTop = box(5.0, 0.05, 1.6, stdMat({
    color: 0xcfa976, roughness: 0.6, metalness: 0.05,
    map: pbr.plankDiff, roughnessMap: pbr.plankArm, normalMap: pbr.plankNor,
  }));
  benchTop.position.set(0, 0.875, -0.05);
  worldG.add(benchTop);
}
const BENCH_Y = 0.9; // 台面高度

/* ---------------- 工位 A：加热高锰酸钾制氧气 ---------------- */

const stA = { group: new THREE.Group(), step: -1, heating: false, heatT: 0, power: 1, collected: 0, fault: false, hint: true };
scene.add(stA.group);

let A = {};
function buildStationA() {
  const g = stA.group;
  const stand = makeStand();
  stand.position.set(-1.78, BENCH_Y, -0.36);
  const clamp = makeClamp();
  clamp.position.set(-1.78, 1.02, -0.46);
  const tube = makeTestTube();
  const tubeG = new THREE.Group(); // 管体（含药品、棉花、瓶塞），固定口略向下倾斜
  tubeG.add(tube);
  const drug = new THREE.Mesh(new THREE.ConeGeometry(0.013, 0.014, 14), stdMat({ color: 0x3a2144, roughness: 1 }));
  drug.position.set(-0.042, 0.008, 0);
  drug.visible = false;
  const cotton = new THREE.Mesh(new THREE.SphereGeometry(0.009, 10, 8), stdMat({ color: 0xf2f0ea, roughness: 1 }));
  cotton.position.set(0.052, 0.006, 0);
  cotton.scale.set(1.2, 0.7, 1);
  cotton.visible = false;
  const stopper = makeStopper(0.0235, 1);
  stopper.position.set(0.068, -0.008, 0);
  tubeG.add(drug, cotton, stopper);
  tubeG.position.set(-1.615, 1.02, -0.18);
  tubeG.rotation.z = -0.14;
  const del = tubeAlong([
    [-1.547, 1.003, -0.18], [-1.42, 0.95, -0.15], [-1.28, 0.93, 0.0],
    [-1.18, 0.943, 0.16], [-1.06, 0.948, 0.27], [-1.06, 0.985, 0.28],
  ], 0.004);
  const lamp = makeAlcoholLamp();
  lamp.position.set(-1.665, BENCH_Y, -0.18);
  const trough = makeTrough();
  trough.position.set(-1.06, BENCH_Y, 0.28);
  const jar = makeGasJar();
  const jarG = new THREE.Group();
  jarG.add(jar);
  const jarWater = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.105, 20), liquidMat(0x8ecbe2, 0.38));
  jarWater.position.y = 0.0525;
  jarG.add(jarWater);
  jarG.rotation.x = Math.PI;       // 倒扣在水中：口在下
  jarG.position.set(-1.06, 1.079, 0.28); // 瓶口位于水面下
  const jarLabel = makeTextSprite('集气瓶', { fontSize: 26, color: '#9fd4e8', scale: 0.0032 });
  jarLabel.position.set(-1.06, 1.2, 0.28);
  const flame = makeFlame();
  flame.position.set(-1.655, BENCH_Y + 0.058, -0.18);
  flame.visible = false;
  const heatLight = new THREE.PointLight(0xffa040, 1.6, 0.9, 2);
  heatLight.position.copy(flame.position).add(new THREE.Vector3(0, 0.03, 0));
  heatLight.visible = false;

  g.add(stand, clamp, tubeG, del.mesh, lamp, trough, jarG, jarLabel, flame, heatLight);
  A = { stand, clamp, tubeG, drug, cotton, stopper, del, lamp, trough, jarG, jarWater, jarLabel, flame, heatLight, prong1: clamp.children[2], prong2: clamp.children[3] };
}

/* ---------------- 工位 B：分解过氧化氢制氧气 ---------------- */

const stB = { group: new THREE.Group(), running: false, drip: false, rate: 1, catalyst: true, mode: 'drain', collected: 0, conc: 1 };
scene.add(stB.group);

let B = {};
function buildStationB() {
  const g = stB.group;
  const flask = makeFlask();
  flask.position.set(0, BENCH_Y, 0.02);
  const liquid = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.048, 0.055, 24), liquidMat(0xcfeef7, 0.42));
  liquid.position.set(0, BENCH_Y + 0.028, 0.02);
  const mno2 = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.014, 16), stdMat({ color: 0x15161a, roughness: 1 }));
  mno2.position.set(0, BENCH_Y + 0.008, 0.02);
  const stopper = makeStopper(0.0255, 2);
  stopper.position.set(0, BENCH_Y + 0.143, 0.02);
  const funnel = makeSepFunnel();
  funnel.position.set(-0.009, BENCH_Y + 0.13, 0.02);
  const delDrain = tubeAlong([ // 排水法：管口没入水槽水中
    [0.009, BENCH_Y + 0.148, 0.02], [0.06, BENCH_Y + 0.14, 0.03], [0.16, BENCH_Y + 0.1, 0.12],
    [0.3, BENCH_Y + 0.05, 0.18], [0.42, BENCH_Y + 0.03, 0.24], [0.55, BENCH_Y + 0.03, 0.28],
  ], 0.004);
  const delAir = tubeAlong([ // 向上排空气：管口越过瓶口伸入瓶内
    [0.009, BENCH_Y + 0.148, 0.02], [0.06, BENCH_Y + 0.14, 0.03], [0.16, BENCH_Y + 0.1, 0.12],
    [0.34, BENCH_Y + 0.1, 0.2], [0.46, BENCH_Y + 0.15, 0.26], [0.55, BENCH_Y + 0.06, 0.28],
  ], 0.004);
  // 两种收集装置
  const trough = makeTrough();
  trough.position.set(0.55, BENCH_Y, 0.28);
  const jarU = makeGasJar(); // 向上排空气瓶
  const jarUG = new THREE.Group();
  jarUG.add(jarU);
  const jarUFill = new THREE.Mesh(new THREE.CylinderGeometry(0.041, 0.041, 0.11, 20), new THREE.MeshBasicMaterial({
    color: 0x9fd4e8, transparent: true, opacity: 0.1, depthWrite: false,
  }));
  jarUFill.position.y = 0.055; jarUFill.scale.y = 0.001;
  jarUG.add(jarUFill);
  jarUG.position.set(0.55, BENCH_Y, 0.28);
  const plateU = makeGlassPlate(); plateU.position.set(0.55, BENCH_Y + 0.122, 0.28); plateU.rotation.z = 0.12;
  const jarD = makeGasJar(); // 排水法瓶（倒扣）
  const jarDG = new THREE.Group();
  jarDG.add(jarD);
  const jarDWater = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.105, 20), liquidMat(0x8ecbe2, 0.38));
  jarDWater.position.y = 0.0525;
  jarDG.add(jarDWater);
  jarDG.position.set(0.55, BENCH_Y + 0.172, 0.28); // 瓶口没入水中
  jarDG.rotation.x = Math.PI;
  const flaskLabel = makeTextSprite('H₂O₂', { fontSize: 26, color: '#9fd4e8', scale: 0.003 });
  flaskLabel.position.set(0, BENCH_Y + 0.2, 0.02);
  g.add(flask, liquid, mno2, stopper, funnel, delDrain.mesh, delAir.mesh, trough, jarUG, plateU, jarDG, flaskLabel);
  B = { flask, liquid, mno2, stopper, funnel, delDrain, delAir, del: delDrain, trough, jarUG, jarUFill, plateU, jarDG, jarDWater, flaskLabel, bubbleY: BENCH_Y + 0.03, bubbleTop: BENCH_Y + 0.052, bubbleXZ: [0, 0.02] };
}

/* ---------------- 工位 C：制取二氧化碳 ---------------- */

const stC = { group: new THREE.Group(), running: false, rx: 'marble-hcl', conc: 1, collected: 0, chokeT: 0 };
scene.add(stC.group);

let C = {};
function buildStationC() {
  const g = stC.group;
  const flask = makeFlask();
  flask.position.set(1.5, BENCH_Y, 0.02);
  const liquid = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.048, 0.05, 24), liquidMat(0xdff2f8, 0.42));
  liquid.position.set(1.5, BENCH_Y + 0.026, 0.02);
  const chips = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const c = new THREE.Mesh(new THREE.DodecahedronGeometry(0.008 + Math.random() * 0.004, 0), stdMat({ color: 0xd8dbe0, roughness: 0.7 }));
    c.position.set(1.5 + (Math.random() - 0.5) * 0.05, BENCH_Y + 0.009, 0.02 + (Math.random() - 0.5) * 0.05);
    c.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
    chips.add(c);
  }
  const stopper = makeStopper(0.0255, 2);
  stopper.position.set(1.5, BENCH_Y + 0.143, 0.02);
  const funnel = makeThistleFunnel();
  funnel.position.set(1.491, BENCH_Y + 0.13, 0.02);
  const del = tubeAlong([
    [1.509, BENCH_Y + 0.148, 0.02], [1.62, BENCH_Y + 0.13, 0.05], [1.78, BENCH_Y + 0.11, 0.14],
    [1.93, BENCH_Y + 0.14, 0.24], [2.0, BENCH_Y + 0.06, 0.28],
  ], 0.004);
  const jar = makeGasJar();
  const jarG = new THREE.Group();
  const fill = new THREE.Mesh(new THREE.CylinderGeometry(0.041, 0.041, 0.11, 20), new THREE.MeshBasicMaterial({
    color: 0xa8d8a8, transparent: true, opacity: 0.1, depthWrite: false,
  }));
  fill.position.y = 0.055; fill.scale.y = 0.001;
  jarG.add(jar, fill);
  jarG.position.set(2.0, BENCH_Y, 0.28);
  const plate = makeGlassPlate(); plate.position.set(2.0, BENCH_Y + 0.122, 0.28); plate.rotation.z = 0.12;
  const jarLabel = makeTextSprite('CO₂', { fontSize: 26, color: '#bfe8bf', scale: 0.003 });
  jarLabel.position.set(2.0, BENCH_Y + 0.185, 0.28);
  g.add(flask, liquid, chips, stopper, funnel, del.mesh, jarG, plate, jarLabel);
  C = { flask, liquid, chips, stopper, funnel, del, jarG, fill, plate, jarLabel, bubbleY: BENCH_Y + 0.02, bubbleTop: BENCH_Y + 0.048, bubbleXZ: [1.5, 0.02] };
}

/* ---------------- 工位 D：气体性质与检验 ---------------- */

const stD = { group: new THREE.Group(), o2: { filled: true }, co2: { filled: true }, limewater: { milky: false }, busy: false };
scene.add(stD.group);

let D = {};
function makeFlame() {
  const g = new THREE.Group();
  const outer = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeGlowTexture('255,150,50', [[0, 'rgba(C,0.9)'], [0.4, 'rgba(C,0.4)'], [1, 'rgba(C,0)']]),
    blending: THREE.AdditiveBlending, transparent: true, depthWrite: false,
  }));
  outer.scale.set(0.045, 0.075, 1);
  const inner = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeGlowTexture('255,236,190', [[0, 'rgba(C,1)'], [0.5, 'rgba(C,0.55)'], [1, 'rgba(C,0)']]),
    blending: THREE.AdditiveBlending, transparent: true, depthWrite: false,
  }));
  inner.scale.set(0.02, 0.036, 1);
  inner.position.y = 0.004;
  g.add(outer, inner);
  g.userData.outer = outer; g.userData.inner = inner;
  return g;
}

function buildStationD() {
  const g = stD.group;
  function jarWithGas(x, label, fillColor, labelColor) {
    const grp = new THREE.Group();
    const jar = makeGasJar();
    const fill = new THREE.Mesh(new THREE.CylinderGeometry(0.041, 0.041, 0.108, 20), new THREE.MeshBasicMaterial({
      color: fillColor, transparent: true, opacity: 0.1, depthWrite: false,
    }));
    fill.position.y = 0.054;
    const plate = makeGlassPlate(); plate.position.y = 0.12;
    const lbl = makeTextSprite(label, { fontSize: 28, color: labelColor, scale: 0.0032 });
    lbl.position.y = 0.17;
    grp.add(jar, fill, plate, lbl);
    grp.position.set(x, BENCH_Y, 0.5);
    return { grp, fill };
  }
  const o2 = jarWithGas(0.12, 'O₂', 0x9fd4e8, '#9fd4e8');
  const co2 = jarWithGas(0.52, 'CO₂', 0xa8d8a8, '#bfe8bf');
  const limeBottle = makeFlask();
  limeBottle.position.set(0.95, BENCH_Y, 0.5);
  const lime = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.048, 0.05, 24), liquidMat(0xeef6fa, 0.4));
  lime.position.set(0.95, BENCH_Y + 0.026, 0.5);
  const limeLbl = makeTextSprite('澄清石灰水', { fontSize: 26, color: '#dfe6ee', scale: 0.003 });
  limeLbl.position.set(0.95, BENCH_Y + 0.2, 0.5);
  const splint = box(0.1, 0.005, 0.005, stdMat({ color: 0xc9a06a, roughness: 0.85 }));
  splint.position.set(-0.3, BENCH_Y + 0.003, 0.5);
  const splintEmber = new THREE.Mesh(new THREE.SphereGeometry(0.005, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff6a20 }));
  splintEmber.position.set(-0.353, BENCH_Y + 0.004, 0.5);
  splintEmber.visible = false;
  const flame = makeFlame();
  flame.visible = false;
  g.add(o2.grp, co2.grp, limeBottle, lime, limeLbl, splint, splintEmber, flame);
  D = { o2, co2, lime, limeBottle, splint, splintEmber, flame, bubbleY: 0, bubbleXZ: [0, 0] };
}

/* ---------------- 粒子：气泡 / 气流点 / 烟 ---------------- */

const MAX_BUB = 150;
const bubMesh = new THREE.InstancedMesh(
  new THREE.SphereGeometry(0.0035, 6, 5),
  new THREE.MeshPhysicalMaterial({ color: 0xdff2fa, transparent: true, opacity: 0.55, roughness: 0.1, metalness: 0 }),
  MAX_BUB
);
bubMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
bubMesh.frustumCulled = false;
scene.add(bubMesh);
const bubbles = Array.from({ length: MAX_BUB }, () => ({ on: false, p: new THREE.Vector3(), vy: 0, wob: Math.random() * TAU_, top: 1 }));

const MAX_DOT = 10;
const dotMesh = new THREE.InstancedMesh(
  new THREE.SphereGeometry(0.0045, 8, 6),
  new THREE.MeshBasicMaterial({ color: 0xdff0ff, transparent: true, opacity: 0.75 }),
  MAX_DOT
);
dotMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
dotMesh.frustumCulled = false;
scene.add(dotMesh);
const dots = Array.from({ length: MAX_DOT }, () => ({ on: false, t: 0, speed: 0.25 }));

const puffs = [];
for (let i = 0; i < 6; i++) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 6), new THREE.MeshBasicMaterial({
    color: 0xc9ccd2, transparent: true, opacity: 0.5, depthWrite: false,
  }));
  m.visible = false;
  scene.add(m);
  puffs.push({ mesh: m, t: -1 });
}

const _m4 = new THREE.Matrix4();
const _zero = new THREE.Matrix4().makeScale(0.0001, 0.0001, 0.0001);

function spawnBubble(x, y, z, top, vy = 0.05) {
  const b = bubbles.find((q) => !q.on);
  if (!b) return;
  b.on = true;
  b.p.set(x + (Math.random() - 0.5) * 0.015, y, z + (Math.random() - 0.5) * 0.015);
  b.vy = vy * (0.75 + Math.random() * 0.5);
  b.top = top;
  b.wob = Math.random() * TAU_;
}

function spawnDot() {
  const d = dots.find((q) => !q.on);
  if (!d) return;
  d.on = true; d.t = 0;
  d.speed = 0.16 + Math.random() * 0.1;
}

function puffAt(x, y, z) {
  const p = puffs.find((q) => q.t < 0);
  if (!p) return;
  p.t = 0;
  p.mesh.visible = true;
  p.mesh.position.set(x, y, z);
}

function updateParticles(dt, time) {
  bubbles.forEach((b, i) => {
    if (b.on) {
      b.p.y += b.vy * dt;
      b.p.x += Math.sin(time * 6 + b.wob) * 0.0006;
      if (b.p.y >= b.top) b.on = false;
      _m4.makeTranslation(b.p.x, b.p.y, b.p.z);
    } else {
      _m4.copy(_zero);
    }
    bubMesh.setMatrixAt(i, _m4);
  });
  bubMesh.instanceMatrix.needsUpdate = true;

  dots.forEach((d, i) => {
    if (d.on) {
      d.t += d.speed * dt;
      const path = activeDotPath;
      if (!path || d.t >= 1) {
        d.on = false;
        if (path && d.t >= 1 && onDotArrive) onDotArrive();
      } else {
        const p = path.getPointAt(Math.min(d.t, 1));
        _m4.makeTranslation(p.x, p.y, p.z);
      }
    }
    if (!d.on) _m4.copy(_zero);
    dotMesh.setMatrixAt(i, _m4);
  });
  dotMesh.instanceMatrix.needsUpdate = true;

  puffs.forEach((p) => {
    if (p.t >= 0) {
      p.t += dt;
      p.mesh.position.y += dt * 0.03;
      p.mesh.material.opacity = Math.max(0, 0.5 * (1 - p.t / 1.2));
      if (p.t > 1.2) { p.t = -1; p.mesh.visible = false; }
    }
  });
}

let activeDotPath = null;
let onDotArrive = null;

/* ---------------- 帧循环 ---------------- */

const hudWrap = document.createElement('div');
hudWrap.className = 'lab-hud';
stage.appendChild(hudWrap);
const hud = makeHUD(hudWrap, [['phase', '状态'], ['rate', '气泡'], ['collect', '收集进度']]);
hud.el.style.display = 'none';

let hudText = { phase: '—', rate: '—', collect: null };

const tweens = [];
function addTween(dur, fn, onDone) { tweens.push({ t: 0, dur, fn, onDone }); }

function flickerFlame(flame, dt, on) {
  if (!flame) return;
  flame.visible = on;
  if (!on) return;
  const s = 1 + Math.sin(performance.now() * 0.03) * 0.12 + Math.random() * 0.06;
  flame.userData.outer.scale.set(0.045 * s, 0.075 * s, 1);
}

let labReady = false;

app.onFrame((dt) => {
  if (!labReady) return;
  cameraTweenTick(app, dt);
  const time = performance.now() * 0.001;

  for (let i = tweens.length - 1; i >= 0; i--) {
    const tw = tweens[i];
    tw.t += dt;
    const k = Math.min(tw.t / tw.dur, 1);
    tw.fn(k);
    if (k >= 1) { tweens.splice(i, 1); if (tw.onDone) tw.onDone(); }
  }

  // 火焰
  flickerFlame(A.flame, dt, stA.heating);
  A.heatLight.visible = stA.heating;
  if (stA.heating) A.heatLight.intensity = 1.4 + Math.sin(time * 20) * 0.35;
  if (D.flame) flickerFlame(D.flame, dt, D.flameOn);

  // —— 工位 A 步骤逻辑 ——
  if (stA.step >= 0 && !stA.fault) {
    if (stA.heating) stA.heatT += dt;
    if (stA.burstT > 0) { // 查气密性：导管口气泡
      stA.burstT -= dt;
      if (Math.random() < dt * 12) spawnBubble(-1.05, 0.955, 0.28, 0.968);
    }
    const bubbling = stA.heating && stA.heatT > 2.5;
    if (bubbling && Math.random() < dt * 8 * stA.power) {
      spawnBubble(-1.05 + (Math.random() - 0.5) * 0.01, 0.95, 0.28, 0.968);
    }
    const rateTxt = !stA.heating ? '停止' : !bubbling ? '预热中…' : (stA.power > 1.5 ? '连续均匀' : stA.power > 0.7 ? '均匀' : '缓慢');
    hudText.rate = rateTxt;
    if (stA.collecting) {
      stA.collected = Math.min(1, stA.collected + dt * 0.09 * stA.power);
      A.jarWater.scale.y = Math.max(0.001, 1 - stA.collected);
      A.jarWater.position.y = 0.0525 * A.jarWater.scale.y;
      if (Math.random() < dt * 6) spawnDot();
      if (stA.collected >= 1 && !stA.fullToast) {
        stA.fullToast = true;
        toast('✔ 集气瓶已集满氧气！先移出导管，再熄灭酒精灯。', 'ok');
      }
    }
    hudText.collect = Math.round(stA.collected * 100) + '%';
  }

  // —— 工位 B ——
  if (stB.running) {
    const rate = stB.catalyst ? 26 * stB.conc : 3.5 * stB.conc;
    if (Math.random() < dt * rate) spawnBubble(B.bubbleXZ[0], B.bubbleY, B.bubbleXZ[1], B.bubbleTop, 0.05 + stB.conc * 0.03);
    hudText.rate = stB.catalyst ? '剧烈（催化）' : '缓慢（无催化剂）';
    if (stB.drip) {
      stB.collected = Math.min(1, stB.collected + dt * (stB.catalyst ? 0.11 : 0.02) * stB.conc);
      if (Math.random() < dt * (stB.catalyst ? 5 : 1)) spawnDot();
    }
    hudText.collect = Math.round(stB.collected * 100) + '%';
    if (stB.mode === 'drain') {
      B.jarDWater.scale.y = Math.max(0.001, 1 - stB.collected);
      B.jarDWater.position.y = 0.0525 * B.jarDWater.scale.y;
      B.jarUFill.scale.y = 0.001;
    } else {
      B.jarUFill.scale.y = Math.max(0.001, stB.collected);
      B.jarDWater.scale.y = 1;
      B.jarDWater.position.y = 0.0525;
    }
    if (stB.collected >= 1 && !stB.fullToast) { stB.fullToast = true; toast('✔ 氧气已集满，用玻璃片盖住瓶口正放在桌面上。', 'ok'); }
  }

  // —— 工位 C ——
  if (stC.running) {
    let rate = 0;
    if (stC.rx === 'marble-hcl') rate = 16 * stC.conc;
    else if (stC.rx === 'marble-h2so4') rate = stC.chokeT < 3.5 ? 12 * stC.conc : 0;
    else rate = 60;
    if (stC.rx === 'marble-h2so4') stC.chokeT += dt;
    if (Math.random() < dt * rate) spawnBubble(C.bubbleXZ[0], C.bubbleY, C.bubbleXZ[1], C.bubbleTop, stC.rx === 'soda-hcl' ? 0.12 : 0.06);
    hudText.rate = rate === 0 ? '已停止（表面被覆盖）' : rate > 40 ? '过于剧烈！' : rate > 10 ? '平稳均匀' : '停止';
    if (stC.rx === 'marble-hcl') {
      stC.collected = Math.min(1, stC.collected + dt * 0.1 * stC.conc);
      if (Math.random() < dt * 4) spawnDot();
      C.fill.scale.y = Math.max(0.001, stC.collected);
      if (stC.collected >= 1 && !stC.fullToast) { stC.fullToast = true; toast('✔ 二氧化碳已集满，验满时把燃着的木条放在瓶口。', 'ok'); }
    }
    hudText.collect = stC.rx === 'marble-hcl' ? Math.round(stC.collected * 100) + '%' : '—';
  }

  updateParticles(dt, time);

  hud.set('phase', hudText.phase);
  hud.set('rate', hudText.rate);
  hud.set('collect', hudText.collect || '—');
});

/* ---------------- UI：提示条 / 步骤条 / 故障卡 ---------------- */

let toastTimer = null;
function toast(text, kind = '') {
  let el = stage.querySelector('.gas-toast');
  if (!el) {
    el = document.createElement('div');
    el.className = 'gas-toast';
    stage.appendChild(el);
  }
  el.textContent = text;
  el.className = 'gas-toast show' + (kind ? ' ' + kind : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3400);
}

let hintEl = null;
function setHint(text) {
  if (!text) { if (hintEl) hintEl.remove(); hintEl = null; return; }
  if (!hintEl) {
    hintEl = document.createElement('div');
    hintEl.className = 'legend';
    stage.appendChild(hintEl);
  }
  hintEl.innerHTML = '';
  const row = document.createElement('div');
  row.className = 'lg-row';
  row.textContent = text;
  hintEl.appendChild(row);
}

let faultEl = null;
function showFault(html) {
  if (!faultEl) {
    faultEl = document.createElement('div');
    faultEl.className = 'gas-fault';
    stage.appendChild(faultEl);
  }
  faultEl.innerHTML = html;
  faultEl.classList.add('show');
}
function hideFault() { if (faultEl) faultEl.classList.remove('show'); }

/* ---------------- 工位 A：查装定点收离熄 步骤机 ---------------- */

const STEP_NAMES = ['查', '装', '定', '点', '收', '离', '熄'];
const STEP_FULL = ['检查气密性', '装入药品', '固定试管', '点燃加热', '排水收集', '撤出导管', '熄灭酒精灯'];

function resetStationA() {
  stA.step = 0; stA.heating = false; stA.heatT = 0; stA.power = 1;
  stA.collected = 0; stA.fault = false; stA.collecting = false; stA.fullToast = false;
  stA.burstT = 0;
  A.drug.visible = false; A.cotton.visible = false;
  A.jarWater.scale.y = 1; A.jarWater.position.y = 0.0525;
  A.jarG.position.set(-1.06, 1.079, 0.28);
  A.del.mesh.material.color.set(0xcfdbe6);
  A.clamp.children[2].position.y = 0.013;
  A.clamp.children[3].position.y = -0.013;
  hideFault();
}

function paintStepButtons() {
  if (!stA.stepBtns) return;
  stA.stepBtns.forEach((b, i) => {
    b.classList.toggle('done', i < stA.step);
    b.classList.toggle('now', i === stA.step);
  });
}

function doStepA(i) {
  if (stA.fault) { toast('实验失败，请先点击「重置」。', 'warn'); return; }
  if (stA.step >= STEP_NAMES.length) { toast('实验已完成，点击「重置」可以再来一次。', 'ok'); return; }
  if (i !== stA.step) {
    if (i < stA.step) { toast(`第 ${i + 1} 步已完成，进行「${STEP_FULL[stA.step]}」。`, 'warn'); return; }
    toast(`要先完成「${STEP_FULL[stA.step]}」，才能进行「${STEP_FULL[i]}」。`, 'warn');
    return;
  }
  stA.step++;
  switch (i) {
    case 0: { // 查：手握试管，导管口有气泡
      toast('把手握住试管，导管口冒出气泡 → 气密性良好 ✓', 'ok');
      stA.burstT = 1.6;
      break;
    }
    case 1: // 装
      A.drug.visible = true; A.cotton.visible = true;
      toast('装入高锰酸钾，管口放一团棉花（防止粉末进入导管）。', 'ok');
      break;
    case 2: { // 定：铁夹夹紧（爪子合拢）
      const p1 = A.clamp.children[2], p2 = A.clamp.children[3];
      addTween(0.5, (k) => {
        p1.position.y = 0.013 - k * 0.009;
        p2.position.y = -0.013 + k * 0.009;
      });
      toast('铁夹夹在距管口约 1/3 处，试管口略向下倾斜（防冷凝水回流炸裂）。', 'ok');
      break;
    }
    case 3: // 点
      stA.heating = true; stA.heatT = 0;
      toast('先来回预热，再把外焰对准药品部位集中加热。', 'ok');
      break;
    case 4: // 收
      if (!stA.heating || stA.heatT < 2.5) {
        stA.step--; // 不消耗步骤
        toast('导管口气泡还不均匀连续（排出的是空气），等气泡连续均匀再收集。', 'warn');
        paintStepButtons();
        return;
      }
      stA.collecting = true;
      toast('气泡连续均匀冒出，开始排水法收集（氧气不易溶于水）。', 'ok');
      break;
    case 5: { // 离
      stA.collecting = false;
      stA.collected = Math.max(stA.collected, 0.999);
      A.jarWater.scale.y = 0.001;
      const from = A.del.mesh.position.clone();
      addTween(0.7, (k) => { A.del.mesh.position.set(from.x, from.y + k * 0.012, from.z + k * 0.05); });
      toast('先把导管移出水面——防止水槽里的水倒吸入热试管。', 'ok');
      break;
    }
    case 6: // 熄
      stA.heating = false;
      hudText.phase = '实验完成';
      toast('熄灭酒精灯，实验完成！2KMnO₄ —Δ→ K₂MnO₄ + MnO₂ + O₂↑', 'ok');
      break;
  }
  hudText.phase = stA.step <= 0 ? '准备' : STEP_FULL[Math.min(stA.step - 1, 6)] + ' ✓';
  if (stA.step >= 7) hudText.phase = '实验完成 ✓';
  paintStepButtons();
}

/* 倒吸判定：火焰燃着时点「熄」而未先「离」（step==6 表示已完成「离」） */
function tryFaultBlowOut() {
  if (stA.fault || stA.step >= 6) return false;
  if (stA.heating) {
    stA.fault = true;
    stA.heating = false;
    toast('✗ 先熄灯后撤导管——水倒吸进热试管了！', 'warn');
    showFault(`<b>试管炸裂！</b>熄灯后试管内温度降低、气压变小，水槽中的水沿导管被倒吸到灼热的试管底部，试管骤冷炸裂。<br><b>正确顺序</b>：先撤导管（离），再熄灭酒精灯（熄）。点击「重置」重新实验。`);
    // 倒吸动画：水球沿导管逆向进入试管 + 导管闪红
    activeDotPath = A.del.curve;
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.006, 10, 8), liquidMat(0x6db8d8, 0.85));
    scene.add(ball);
    let t = 0;
    addTween(1.1, (k) => {
      t = k;
      const p = A.del.curve.getPointAt(1 - k);
      ball.position.copy(p);
      A.del.mesh.material.color.setHSL(0, 0.7, 0.5 + Math.sin(k * 12) * 0.1);
    }, () => {
      scene.remove(ball);
      A.del.mesh.material.color.set(0xcfdbe6);
      // 试管抖动后倾斜（炸裂示意）
      addTween(0.5, (k) => { A.tubeG.rotation.x = Math.sin(k * 20) * 0.025 * (1 - k); });
    });
    return true;
  }
  return false;
}

/* ---------------- 章节定义 ---------------- */

const ctl = createControlsPanel(document.getElementById('controls'));
let activeSectionCleanup = null;

function hideAllStations() {
  stA.group.visible = false;
  stB.group.visible = false;
  stC.group.visible = false;
  stD.group.visible = false;
  hud.el.style.display = 'none';
  setHint(null);
  hideFault();
  stA.heating = false;
  stB.running = false; stB.drip = false;
  stC.running = false;
  activeDotPath = null; onDotArrive = null;
}

const SECTIONS = [
  {
    title: '加热高锰酸钾制氧气',
    html: `<p>用<b>加热高锰酸钾</b>的方法制取氧气，口诀：<span class="hl">查、装、定、点、收、离、熄</span>（谐音「茶庄定点收利息」）。</p>
<p>按顺序点击步骤按钮完成实验：<b>查</b>气密性 → <b>装</b>药品（管口放棉花）→ <b>定</b>（铁夹夹持、管口略向下）→ <b>点</b>（先预热再集中加热）→ <b>收</b>（气泡均匀连续时排水收集）→ <b>离</b>（先撤导管）→ <b>熄</b>（后熄灯）。</p>
<p>⚠️ 顺序做错会看到事故演示：先熄灯后撤导管，水会倒吸炸裂试管。</p>
<p>反应原理：2KMnO₄ —Δ→ K₂MnO₄ + MnO₂ + O₂↑</p>`,
    enter() {
      hideAllStations();
      resetStationA();
      stA.group.visible = true;
      stA.stepBtns = null;
      app.setCamera([-0.5, 1.3, 1.38], [-1.5, 0.98, 0.0]);
      hud.el.style.display = '';
      hudText.phase = '准备'; hudText.rate = '停止'; hudText.collect = '0%';
      ctl.clear();
      const stepsWrap = document.createElement('div');
      stepsWrap.className = 'gas-steps';
      stA.stepBtns = STEP_NAMES.map((n, i) => {
        const b = ctl.button({ label: n, onClick: () => { if (i === 6 && tryFaultBlowOut()) return; doStepA(i); } });
        b.classList.add('gas-step');
        b.title = STEP_FULL[i];
        stepsWrap.appendChild(b);
        return b;
      });
      ctl.el.appendChild(stepsWrap);
      ctl.sep();
      ctl.button({ label: '↺ 重置', onClick: () => SECTIONS[0].enter() });
      ctl.slider({
        label: '加热功率', min: 0.4, max: 2, step: 0.1, value: 1,
        fmt: (v) => v.toFixed(1) + '×',
        onInput: (v) => { stA.power = v; },
      });
      ctl.toggle({
        label: '操作提示', value: true,
        onChange: (v) => setHint(v ? '顺序：查 → 装 → 定 → 点 → 收 → 离 → 熄' : null),
      });
      setHint('顺序：查 → 装 → 定 → 点 → 收 → 离 → 熄');
      paintStepButtons();
    },
  },
  {
    title: '分解过氧化氢制氧气',
    html: `<p>常温即可制氧气：<b>过氧化氢溶液</b>在<b>二氧化锰</b>催化下分解，不需加热。</p>
<p>2H₂O₂ <span class="hl">—MnO₂→</span> 2H₂O + O₂↑</p>
<p>「催化剂」在反应前后<b>质量和化学性质都不变</b>，只改变反应速率。试试开关催化剂，对比气泡快慢；再切换排水法 / 向上排空气法两种收集装置——氧气<b>不易溶于水</b>（可用排水法），<b>密度比空气略大</b>（可用向上排空气法）。</p>
<p>分液漏斗可以控制滴加 H₂O₂ 的快慢，从而控制产气速度。</p>`,
    enter() {
      hideAllStations();
      stB.group.visible = true;
      stB.running = false; stB.drip = false; stB.catalyst = true;
      stB.mode = 'drain'; stB.collected = 0; stB.conc = 1; stB.fullToast = false;
      B.mno2.visible = true;
      B.jarDG.visible = true; B.trough.visible = true;
      B.jarUG.visible = false; B.plateU.visible = false;
      B.jarDWater.scale.y = 1; B.jarDWater.position.y = 0.0525;
      B.jarUFill.scale.y = 0.001;
      B.delAir.mesh.visible = false; B.delDrain.mesh.visible = true;
      app.setCamera([0.55, 1.38, 1.65], [0.05, 0.98, 0.1]);
      hud.el.style.display = '';
      hudText.phase = '待滴加'; hudText.rate = '—'; hudText.collect = '0%';
      ctl.clear();
      ctl.toggle({
        label: '加入 MnO₂ 催化剂', value: true,
        onChange: (v) => {
          stB.catalyst = v;
          B.mno2.visible = v;
          toast(v ? '加入二氧化锰，分解速率大大加快。' : '没有催化剂，过氧化氢分解很慢。', v ? 'ok' : 'warn');
        },
      });
      const modeSeg = ctl.seg({
        options: [{ label: '排水法', value: 'drain' }, { label: '向上排空气', value: 'air' }],
        value: 'drain',
        onChange: (v) => {
          stB.mode = v;
          stB.collected = 0; stB.fullToast = false;
          B.jarDWater.scale.y = 1; B.jarDWater.position.y = 0.0525;
          B.jarUFill.scale.y = 0.001;
          B.jarDG.visible = B.trough.visible = v === 'drain';
          B.jarUG.visible = B.plateU.visible = v === 'air';
          activeDotPath = B.del.curve;
        },
      });
      ctl.slider({
        label: 'H₂O₂ 用量', min: 0.5, max: 2, step: 0.1, value: 1,
        fmt: (v) => v.toFixed(1) + '×',
        onInput: (v) => { stB.conc = v; },
      });
      const dripBtn = ctl.button({
        label: '▶ 滴加 H₂O₂',
        onClick: () => {
          stB.drip = !stB.drip;
          stB.running = true;
          dripBtn.textContent = stB.drip ? '⏸ 停止滴加' : '▶ 滴加 H₂O₂';
          dripBtn.classList.toggle('active', stB.drip);
          hudText.phase = stB.drip ? '反应中' : '暂停滴加';
        },
      });
      ctl.button({ label: '↺ 重置', onClick: () => SECTIONS[1].enter() });
      activeDotPath = B.del.curve;
      setHint('先开催化剂开关，再滴加 H₂O₂；对比有无 MnO₂ 的气泡速度');
    },
  },
  {
    title: '制取二氧化碳',
    html: `<p>实验室用<b>大理石（或石灰石）</b>与<b>稀盐酸</b>反应制 CO₂：</p>
<p>CaCO₃ + 2HCl = CaCl₂ + H₂O + CO₂↑</p>
<p>为什么不用别的药品？切换下方三种组合对比：<b>稀硫酸</b>——生成的 CaSO₄ 微溶于水，覆盖在大理石表面，反应很快停止；<b>碳酸钠粉末</b>——与盐酸反应<b>过于剧烈</b>，不便于收集。</p>
<p>CO₂ 能溶于水，一般用<b>向上排空气法</b>收集（密度比空气大）；长颈漏斗下端管口必须<span class="hl">插入液面以下</span>形成液封，防止气体逸出。</p>`,
    enter() {
      hideAllStations();
      stC.group.visible = true;
      stC.running = false; stC.rx = 'marble-hcl'; stC.conc = 1;
      stC.collected = 0; stC.chokeT = 0; stC.fullToast = false;
      C.fill.scale.y = 0.001;
      C.chips.visible = true;
      app.setCamera([2.05, 1.38, 1.65], [1.55, 0.98, 0.1]);
      hud.el.style.display = '';
      hudText.phase = '待反应'; hudText.rate = '—'; hudText.collect = '—';
      ctl.clear();
      ctl.seg({
        options: [
          { label: '大理石+稀盐酸 ✓', value: 'marble-hcl' },
          { label: '大理石+稀硫酸', value: 'marble-h2so4' },
          { label: '碳酸钠+稀盐酸', value: 'soda-hcl' },
        ],
        value: 'marble-hcl',
        onChange: (v) => {
          stC.rx = v; stC.running = false; stC.chokeT = 0;
          stC.collected = 0; stC.fullToast = false;
          C.fill.scale.y = 0.001;
          hudText.phase = '待反应';
          if (v === 'marble-h2so4') toast('提示：CaSO₄ 微溶，很快会覆盖大理石表面使反应停止。', 'warn');
          if (v === 'soda-hcl') toast('提示：碳酸钠是粉末，反应速率太快，来不及收集。', 'warn');
        },
      });
      ctl.sep();
      ctl.slider({
        label: '盐酸浓度', min: 0.5, max: 2, step: 0.1, value: 1,
        fmt: (v) => v.toFixed(1) + '×',
        onInput: (v) => { stC.conc = v; },
      });
      const runBtn = ctl.button({
        label: '▶ 开始反应',
        onClick: () => {
          stC.running = true;
          hudText.phase = '反应中';
          runBtn.classList.add('active');
          if (stC.rx !== 'marble-hcl') {
            toast(stC.rx === 'marble-h2so4'
              ? '反应一会儿就停止了——CaSO₄ 微溶物覆盖在大理石表面。'
              : '反应过于剧烈，气泡来不及收集，不适合实验室制法。', 'warn');
          }
        },
      });
      ctl.button({ label: '↺ 重置', onClick: () => SECTIONS[2].enter() });
      activeDotPath = C.del.curve;
      setHint('长颈漏斗管口要液封；只有「大理石+稀盐酸」能顺利集满一瓶 CO₂');
    },
  },
  {
    title: '氧气与二氧化碳的性质',
    html: `<p>两种气体的<b>检验</b>与<b>验满</b>：</p>
<p>① 检验 O₂：把<b>带火星的木条伸入瓶内</b>，木条复燃 → 是氧气；② 验满 O₂：带火星木条放<b>瓶口</b>，复燃即满。</p>
<p>③ 检验 CO₂：向瓶中倒入<b>澄清石灰水</b>振荡，变浑浊 → 是 CO₂（生成 CaCO₃ 沉淀）；④ 验满 CO₂：<b>燃着的木条放瓶口</b>，火焰熄灭即满。</p>
<p>CO₂ 还有一个重要性质：它<b>不能燃烧、也不支持燃烧</b>，密度比空气大——所以可用来灭火。点击下方按钮逐项验证。</p>`,
    enter() {
      hideAllStations();
      stD.group.visible = true;
      stD.busy = false;
      D.lime.material.color.set(0xeef6fa); D.lime.material.opacity = 0.4;
      D.splintEmber.visible = false;
      D.flame.visible = false; D.flameOn = false;
      app.setCamera([0.82, 1.32, 1.95], [0.6, 0.93, 0.42]);
      ctl.clear();
      ctl.button({
        label: '🔥 带火星木条 → O₂瓶',
        onClick: () => {
          if (stD.busy) return;
          stD.busy = true;
          moveSplintTo(0.12, 0.5, BENCH_Y + 0.06, () => {
            D.splintEmber.visible = true;
            D.flame.position.set(0.12, BENCH_Y + 0.075, 0.5);
            D.flame.visible = true; D.flameOn = true;
            toast('木条复燃！这是氧气检验方法：带火星木条伸入瓶内复燃 → O₂。', 'ok');
            setTimeout(() => { D.flame.visible = false; D.flameOn = false; moveSplintBack(); }, 1800);
          });
        },
      });
      ctl.button({
        label: '🕯 燃着木条 → CO₂瓶',
        onClick: () => {
          if (stD.busy) return;
          stD.busy = true;
          moveSplintTo(0.52, 0.5, BENCH_Y + 0.06, () => {
            D.splintEmber.visible = true;
            for (let i = 0; i < 4; i++) setTimeout(() => puffAt(0.52 + (Math.random() - 0.5) * 0.02, BENCH_Y + 0.09, 0.5), i * 180);
            toast('火焰熄灭——CO₂ 不燃烧、也不支持燃烧。', 'warn');
            setTimeout(moveSplintBack, 1500);
          });
        },
      });
      ctl.button({
        label: '💧 倒石灰水 → CO₂瓶',
        onClick: () => {
          if (stD.busy) return;
          stD.busy = true;
          setTimeout(() => {
            D.lime.material.color.set(0xffffff);
            D.lime.material.opacity = 0.85;
            toast('澄清石灰水变浑浊（生成 CaCO₃）：这是检验 CO₂ 的方法。', 'ok');
            stD.busy = false;
          }, 500);
        },
      });
      ctl.button({
        label: '📋 验满演示',
        onClick: () => {
          toast('验满 O₂：带火星木条放瓶口复燃即满；验满 CO₂：燃着木条放瓶口熄灭即满。', 'ok');
        },
      });
      ctl.button({ label: '↺ 重置', onClick: () => SECTIONS[3].enter() });
      setHint('木条会自动伸入瓶中并退回；石灰水倒入后观察瓶内变化');
      hud.el.style.display = 'none';
    },
  },
  {
    title: '随堂检测',
    html: `<p>5 道选择题，检验本节课的掌握情况。</p>`,
    enter() {
      hideAllStations();
      app.setCamera([0.7, 1.5, 2.9], [0.1, 1.0, 0]);
      ctl.clear();
      showQuiz();
    },
  },
];

/* 木条移动动画（工位 D） */
function moveSplintTo(x, z, y, onDone) {
  const from = D.splint.position.clone();
  const to = new THREE.Vector3(x, y, z);
  D.splint.rotation.y = x > from.x ? 0.4 : -0.4;
  addTween(0.7, (k) => {
    const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    D.splint.position.lerpVectors(from, to, e);
    D.splintEmber.position.set(D.splint.position.x - 0.053, D.splint.position.y + 0.001, D.splint.position.z);
  }, () => { onDone && onDone(); });
}
function moveSplintBack() {
  const from = D.splint.position.clone();
  const to = new THREE.Vector3(-0.3, BENCH_Y + 0.003, 0.5);
  addTween(0.7, (k) => {
    const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    D.splint.position.lerpVectors(from, to, e);
    D.splint.rotation.y = 0;
  }, () => { stD.busy = false; });
}

/* ---------------- 随堂检测 ---------------- */

const QUIZ = [
  {
    q: '加热高锰酸钾制氧气，实验结束时的正确操作是？',
    opts: ['先熄灭酒精灯，再撤出导管', '先撤出导管，再熄灭酒精灯', '两者同时进行', '先停止加热，冷却后再撤导管'],
    a: 1,
    ex: '先撤导管再熄灯。若先熄灯，试管内温度降低、气压变小，水会沿导管倒吸到灼热的试管底部，使试管骤冷炸裂。',
  },
  {
    q: '关于二氧化锰在过氧化氢分解中的作用，正确的是？',
    opts: ['它是反应物，会被逐渐消耗', '它是催化剂，加快反应且本身质量和化学性质不变', '它增加氧气的产量', '它是生成物之一'],
    a: 1,
    ex: 'MnO₂ 是催化剂：改变反应速率，本身的质量和化学性质在反应前后都不变，也不能增加生成物产量。',
  },
  {
    q: '实验室制取二氧化碳应选用的药品组合是？',
    opts: ['大理石与稀硫酸', '碳酸钠粉末与稀盐酸', '大理石（石灰石）与稀盐酸', '碳酸钙与稀硝酸'],
    a: 2,
    ex: '稀硫酸与大理石反应生成微溶的 CaSO₄ 覆盖表面，反应很快停止；碳酸钠粉末反应过快不便收集；标准药品是大理石/石灰石与稀盐酸。',
  },
  {
    q: '检验一瓶气体是否为二氧化碳，应采用的方法是？',
    opts: ['把燃着的木条伸入瓶内', '倒入澄清石灰水并振荡', '把带火星的木条伸入瓶内', '闻气体的气味'],
    a: 1,
    ex: 'CO₂ 使澄清石灰水变浑浊（生成 CaCO₃ 沉淀），这是 CO₂ 的特征检验法。燃着木条熄灭只能说明不助燃，不能确证是 CO₂。',
  },
  {
    q: '用排水法收集氧气，开始收集的正确时机是？',
    opts: ['导管口一有气泡就立即收集', '气泡连续并均匀冒出时再收集', '加热满 1 分钟后收集', '等试管冷却后收集'],
    a: 1,
    ex: '刚开始排出的气泡主要是试管和导管内的空气；当气泡连续、均匀冒出时，排出的才是较纯的氧气，此时开始收集。',
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
      <p style="color:var(--text-dim);margin:4px 0 18px">正确率 ${pct}%${pct >= 80 ? '，气体制备的要点你已经掌握了！' : pct >= 60 ? '，大部分概念已经清楚，回顾一下错题。' : '，建议回到前面章节再看一遍哦。'}</p>`;
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

/* ---------------- 启动 ---------------- */

const DOMDIR = '../assets/textures/pbr/';
loadAll([
  { key: 'sky', label: '环境', job: loadHDR(TEX.skyHdr) },
  { key: 'skyBg', label: '背景', job: loadTexture(TEX.skyWebp) },
  { key: 'plankDiff', label: '台面', job: loadTexture(DOMDIR + 'plank_diff-DPUnSb0W.webp') },
  { key: 'plankArm', label: '台面细节', job: loadTexture(DOMDIR + 'plank_arm-CztMy41m.webp', { colorSpace: null }) },
  { key: 'plankNor', label: '台面纹理', job: loadTexture(DOMDIR + 'plank_nor-BoGKkjWD.webp', { colorSpace: null }) },
  { key: 'paintDiff', label: '柜体', job: loadTexture(DOMDIR + 'paint_diff-RYyGtI7R.webp') },
  { key: 'paintArm', label: '柜体细节', job: loadTexture(DOMDIR + 'paint_arm-BtvMA06a.webp', { colorSpace: null }) },
  { key: 'paintNor', label: '柜体纹理', job: loadTexture(DOMDIR + 'paint_nor-DgERPfRh.webp', { colorSpace: null }) },
  { key: 'slabDiff', label: '地面', job: loadTexture(DOMDIR + 'slab_diff-Bzxi6irn.webp') },
  { key: 'slabArm', label: '地面细节', job: loadTexture(DOMDIR + 'slab_arm-OyJUI_RU.webp', { colorSpace: null }) },
  { key: 'slabNor', label: '地面纹理', job: loadTexture(DOMDIR + 'slab_nor-D2MZT0BN.webp', { colorSpace: null }) },
  { key: 'wallDiff', label: '墙面', job: loadTexture(DOMDIR + 'wall_diff-CNpUUuOJ.webp') },
  { key: 'wallNor', label: '墙面纹理', job: loadTexture(DOMDIR + 'wall_nor-DS8uKrFH.webp', { colorSpace: null }) },
], (d, t, label) => loader.setText(`正在加载 ${d}/${t}（${label}）`)).then((t) => {
  Object.assign(pbr, {
    plankDiff: t.plankDiff, plankArm: t.plankArm, plankNor: t.plankNor,
    paintDiff: t.paintDiff, paintArm: t.paintArm, paintNor: t.paintNor,
    slabDiff: t.slabDiff, slabArm: t.slabArm, slabNor: t.slabNor,
    wallDiff: t.wallDiff, wallNor: t.wallNor,
  });
  t.sky.mapping = THREE.EquirectangularReflectionMapping;
  scene.environment = t.sky;
  t.skyBg.mapping = THREE.EquirectangularReflectionMapping;
  scene.background = t.skyBg;

  buildWorld();
  buildStationA();
  buildStationB();
  buildStationC();
  buildStationD();
  labReady = true;

  loader.hide();
  const sections = createSections({
    nav: document.getElementById('sideNav'),
    descPanel: document.getElementById('descPanel'),
    sections: SECTIONS,
    onSelect(i, sec) {
      if (activeSectionCleanup) { activeSectionCleanup(); activeSectionCleanup = null; }
      sec.enter();
    },
  });
  window.__eduSections = sections;
  sections.select(0);
}).catch((err) => {
  loader.setText('资源加载失败：' + err.message);
  console.error(err);
});
