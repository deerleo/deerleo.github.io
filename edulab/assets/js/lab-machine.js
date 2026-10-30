/* EduLab · 简单机械（machine）
 * 章节：杠杆平衡 / 杠杆分类 / 定滑轮与动滑轮 / 滑轮组 / 斜面 / 轮轴 / 机械效率 / 生活中的机械 / 随堂检测
 * 场景：工地与农家院——撬棍撬石、滑轮组吊砖、斜面装车、辘轳打水、桔槔与杆秤；力箭头与读数实时联动。
 */
import {
  THREE, clamp,
  loadTexture, loadAll, createApp, cameraTweenTick, makeLoader,
  createSections, createControlsPanel, makeHUD, makeTextSprite, setSpriteText,
} from './edu-core.js';

/* ---------------- 基础 ---------------- */

const stage = document.getElementById('stage');
const loader = makeLoader(stage, '正在搭建工地与农家院…');
const app = createApp({
  container: stage,
  fov: 40, near: 0.1, far: 400,
  cameraPos: [8, 6, 12], target: [0, 1.6, 0],
  minDistance: 2, maxDistance: 60,
  keepBackground: true,
});
const { scene, camera, controls } = app;

scene.add(new THREE.HemisphereLight(0xd8e6f5, 0x6b5b45, 0.75));
const sun = new THREE.DirectionalLight(0xfff0d8, 2.2);
sun.position.set(-10, 16, 8);
scene.add(sun);

/* ---------------- 通用小件 ---------------- */

const M = (color, rough = 0.8, metal = 0) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal });
const box = (w, h, d, mat) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
const cyl = (rt, rb, h, mat, seg = 20) => new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
const lerp = (a, b, t) => a + (b - a) * t;

/** 力箭头（+Y 为正向），set(from, to, text) */
function makeArrow(color) {
  const g = new THREE.Group();
  const hex = '#' + new THREE.Color(color).getHexString();
  const mat = new THREE.MeshBasicMaterial({ color });
  const shaft = cyl(0.05, 0.05, 1, mat, 10);
  shaft.geometry.translate(0, 0.5, 0);
  const head = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.32, 12), mat);
  g.add(shaft, head);
  const lbl = makeTextSprite('', { fontSize: 30, color: hex, scale: 0.0065, bg: 'rgba(12,18,26,0.66)' });
  g.add(lbl);
  const up = new THREE.Vector3(0, 1, 0), q = new THREE.Quaternion(), dir = new THREE.Vector3();
  g.set = (from, to, text) => {
    dir.subVectors(to, from);
    const len = Math.max(dir.length(), 0.01);
    q.setFromUnitVectors(up, dir.clone().normalize());
    g.quaternion.copy(q);
    g.position.copy(from);
    shaft.scale.y = Math.max(len - 0.3, 0.05);
    head.position.y = len - 0.16;
    g.visible = true;
    if (text !== undefined) setSpriteText(lbl, text, { fontSize: 30, color: hex, scale: 0.0065, bg: 'rgba(12,18,26,0.66)' });
    lbl.position.set(0, len + 0.34, 0);
  };
  g.hide = () => { g.visible = false; };
  return g;
}

function lbl(text, color = '#e8f0fa', scale = 0.012) {
  return makeTextSprite(text, { fontSize: 30, color, scale: scale * 0.58, bg: 'rgba(12,18,26,0.6)' });
}

/** 滑轮（竖直平面内的轮，轴向 z） */
function makePulley(r) {
  const g = new THREE.Group();
  const wheel = new THREE.Mesh(new THREE.TorusGeometry(r, r * 0.16, 10, 36), M(0xd9c37a, 0.55, 0.5));
  const hub = cyl(r * 0.24, r * 0.24, r * 0.5, M(0x5a5f66, 0.4, 0.7));
  hub.rotation.x = Math.PI / 2;
  g.add(wheel, hub);
  g.userData.r = r;
  return g;
}

/** 绳段：可在两点间拉直的细圆柱，r.set(p1, p2) */
function makeRope(color = 0xcbb894, thick = 0.05) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(thick, thick, 1, 8), M(color, 0.9));
  m.geometry.translate(0, 0.5, 0);
  const d = new THREE.Vector3();
  m.set = (p1, p2) => {
    d.subVectors(p2, p1);
    m.position.copy(p1);
    m.scale.set(1, Math.max(d.length(), 0.01), 1);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize());
  };
  return m;
}

/** 钩码（叠块 + 吊环），group 原点在底部 */
function makeWeight(color = 0xb6543c) {
  const g = new THREE.Group();
  const m = M(color, 0.7);
  const b1 = box(0.5, 0.3, 0.32, m); b1.position.y = 0.15;
  const b2 = box(0.42, 0.26, 0.3, m); b2.position.y = 0.43;
  const hook = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.02, 8, 16), M(0x888c92, 0.4, 0.8));
  hook.position.y = 0.64;
  g.add(b1, b2, hook);
  g.userData.h = 0.7;   // 吊环顶部高度
  return g;
}

/* ---------------- 地面与背景 ---------------- */

let postMat, plankMat, rockMat, stoneMat;
const ground = new THREE.Mesh(new THREE.PlaneGeometry(90, 60), M(0xcfc4ab, 0.96));
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.01;
scene.add(ground);

function buildGround(sandTex, sandNor, timberTex, timberNor, rockTex, rockNor) {
  sandTex.repeat.set(10, 7); sandNor.repeat.set(10, 7);
  ground.material = new THREE.MeshStandardMaterial({
    map: sandTex, normalMap: sandNor, normalScale: new THREE.Vector2(0.8, 0.8),
    color: 0xcfc4ab, roughness: 0.96,
  });
  postMat = new THREE.MeshStandardMaterial({ map: timberTex, normalMap: timberNor, color: 0xcbb897, roughness: 0.85 });
  plankMat = new THREE.MeshStandardMaterial({ map: timberTex, normalMap: timberNor, color: 0xd8c8a8, roughness: 0.8 });
  rockMat = new THREE.MeshStandardMaterial({ map: rockTex, normalMap: rockNor, color: 0xb7b2a8, roughness: 0.95 });
  stoneMat = new THREE.MeshStandardMaterial({ map: rockTex, normalMap: rockNor, color: 0x9a958c, roughness: 0.95 });
  const brickMat = M(0xa5573e, 0.9);
  [[-14, 0.9, -6, 10], [-17, 1.1, -2, 14], [13, 0.8, -7, 8]].forEach(([x, y, z, n]) => {
    for (let i = 0; i < n; i++) {
      const b = box(0.5, 0.24, 0.24, brickMat);
      b.position.set(x + (i % 2) * 0.06, y + Math.floor(i / 5) * 0.25, z + (i % 5) * 0.26 - 0.52);
      scene.add(b);
    }
  });
}

/* ---------------- 场景注册（懒建） ---------------- */

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

/* ============ 01 杠杆平衡（撬棍撬石） ============ */

const LEV = { pivot: -1.2, press: 0, pressing: false, dir: 'down' };
function buildLever(g) {
  LEV.rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.55, 0), rockMat);
  LEV.rock.position.set(-3, 0.5, 0);
  g.add(LEV.rock);
  LEV.bar = box(6.4, 0.16, 0.16, M(0x8d9299, 0.45, 0.7));
  g.add(LEV.bar);
  LEV.fulcrum = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.32, 1.0, 6), stoneMat);
  g.add(LEV.fulcrum);
  LEV.hand = makeArrow(0xffa23e); g.add(LEV.hand);
  LEV.gArrow = makeArrow(0x5aa7e8); g.add(LEV.gArrow);
  LEV.l1 = lbl(''); LEV.l2 = lbl('');
  g.add(LEV.l1, LEV.l2);
  updLever();
}
function updLever() {
  const F = LEV.pivot;
  const L1 = 3 - F, L2 = F + 3;
  const G = 600;
  // 力臂是支点到「力的作用线」的距离：竖直向下/垂直撬棍都取全长，
  // 斜着用力（偏离撬棍 30°）时作用线离支点更近，力臂打 0.87 折
  const armK = LEV.dir === 'slant' ? Math.cos(Math.PI / 6) : 1;
  const L1eff = L1 * armK;
  const Need = G * L2 / L1eff;
  const stuck = Need > 600;   // 一个人最多能使出约 600 N
  const th = LEV.press * (LEV.dir === 'down' ? 0.16 : 0.13);
  LEV.bar.position.set(F, 1.0, 0);
  LEV.bar.rotation.z = -th;
  LEV.fulcrum.position.set(F, 0.5, 0);
  LEV.rock.position.y = 0.5 + L2 * Math.sin(th);
  const rockTop = LEV.rock.position.y + 0.35;
  const handY = 1.0 - L1 * Math.sin(th);
  const fScale = 0.8 + Math.min(Need, 900) / 900;
  const handX = 3;
  LEV.hand.set(new THREE.Vector3(handX, handY + 0.45 + fScale, 0), new THREE.Vector3(handX, handY + 0.45, 0),
    'F动=' + (stuck ? '>600' : Need.toFixed(0)) + ' N');
  LEV.gArrow.set(new THREE.Vector3(-3, rockTop + 1.5, 0), new THREE.Vector3(-3, rockTop + 0.72, 0), 'G=600 N');
  setSpriteText(LEV.l1, 'L1=' + L1eff.toFixed(1) + ' m', { fontSize: 28, color: '#ffb46e', scale: 0.006, bg: 'rgba(12,18,26,0.6)' });
  LEV.l1.position.set((F + 3) / 2, 0.32, 0.5);
  setSpriteText(LEV.l2, 'L2=' + L2.toFixed(1) + ' m', { fontSize: 28, color: '#8fc6ff', scale: 0.006, bg: 'rgba(12,18,26,0.6)' });
  LEV.l2.position.set((F - 3) / 2, 0.32, 0.5);
  hset('l1', L1eff.toFixed(1) + ' m' + (LEV.dir === 'slant' ? '（斜拉变短）' : ''));
  hset('l2', L2.toFixed(1) + ' m');
  hset('f', stuck ? Need.toFixed(0) + ' N —— 拉不动！' : Need.toFixed(0) + ' N');
  hset('rel', stuck ? '一个人最多使出约 600 N，力不够撬棍纹丝不动' : (L1eff / L2).toFixed(1) + ' 倍');
}

/* ============ 02 杠杆分类 ============ */

const LCLASS = { kind: 'jia', stations: null };
function buildLeverClass(g) {
  const station = (x) => { const s = new THREE.Group(); s.position.x = x; g.add(s); return s; };
  // 撬棍（省力）
  const a = station(-4);
  {
    const bar = box(3.2, 0.12, 0.12, M(0x8d9299, 0.45, 0.7)); bar.position.set(0, 0.9, 0); a.add(bar);
    const ful = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.2, 0.8, 6), stoneMat); ful.position.set(-0.8, 0.4, 0); a.add(ful);
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.34, 0), rockMat); rock.position.set(-1.9, 0.32, 0); a.add(rock);
    const arrow = makeArrow(0xffa23e); arrow.set(new THREE.Vector3(1.35, 2.3, 0), new THREE.Vector3(1.35, 1.15, 0), '小力'); a.add(arrow);
    const tag = lbl('省力杠杆 L1>L2', '#ffb46e', 0.011); tag.position.set(0, 0.12, 0); a.add(tag);
  }
  // 镊子（费力）
  const b = station(0);
  {
    const arm1 = box(1.6, 0.07, 0.1, M(0x9aa2ab, 0.35, 0.8)); arm1.position.set(-0.8, 1.12, 0.05); arm1.rotation.z = -0.1; b.add(arm1);
    const arm2 = box(1.6, 0.07, 0.1, M(0x9aa2ab, 0.35, 0.8)); arm2.position.set(-0.8, 0.96, -0.05); arm2.rotation.z = 0.1; b.add(arm2);
    const arrow = makeArrow(0x8fc6ff); arrow.set(new THREE.Vector3(0.85, 0.55, 0), new THREE.Vector3(0.85, 0.9, 0), '大力'); b.add(arrow);
    const tag = lbl('费力杠杆 L1<L2', '#8fc6ff', 0.011); tag.position.set(0, 0.12, 0); b.add(tag);
  }
  // 天平（等臂）
  const c = station(4);
  {
    const base = box(0.9, 0.12, 0.4, M(0x6b4f3a, 0.8)); base.position.y = 0.06; c.add(base);
    const post = cyl(0.045, 0.06, 1.2, M(0x8a8f96, 0.4, 0.7)); post.position.y = 0.72; c.add(post);
    const beam = box(2.2, 0.06, 0.08, M(0xb98d5f, 0.7)); beam.position.y = 1.38; c.add(beam);
    const panL = box(0.34, 0.05, 0.34, M(0xb8bdc4, 0.5, 0.4)); panL.position.set(-1.0, 1.12, 0); c.add(panL);
    const panR = panL.clone(); panR.position.x = 1.0; c.add(panR);
    const tag = lbl('等臂杠杆 L1=L2', '#9be29b', 0.011); tag.position.set(0, 0.12, 0); c.add(tag);
  }
  LCLASS.stations = [a, b, c];
}
function focusLeverClass() {
  const i = LCLASS.kind === 'jia' ? 0 : LCLASS.kind === 'nie' ? 1 : 2;
  LCLASS.stations.forEach((s, j) => {
    s.traverse((o) => {
      if (o.isMesh && o.material) {
        o.material.transparent = j !== i;
        o.material.opacity = j === i ? 1 : 0.18;
      }
    });
  });
}
function unfocusLeverClass() {
  LCLASS.stations.forEach((s) => s.traverse((o) => {
    if (o.isMesh && o.material) { o.material.transparent = false; o.material.opacity = 1; }
  }));
}

/* ============ 03 定滑轮与动滑轮 ============ */

const PUL = { G: 200, G0: 0, lift: 0, lifting: false, fixed: null, mov: null };
function buildPulleyScene(g) {
  const mk = (x, moving) => {
    const s = new THREE.Group(); s.position.x = x; g.add(s);
    const post = box(0.14, 4.4, 0.14, postMat); post.position.set(0.9, 2.2, 0); s.add(post);
    const beam = box(2.4, 0.14, 0.14, plankMat); beam.position.set(0, 4.3, 0); s.add(beam);
    const pul = makePulley(0.34);
    if (!moving) pul.position.y = 4.05;
    s.add(pul);
    const w = makeWeight(); s.add(w);
    const ropes = [makeRope(), makeRope()];
    ropes.forEach((r) => s.add(r));
    const arr = makeArrow(0xffa23e); s.add(arr);
    const tag = lbl(moving ? '动滑轮' : '定滑轮', moving ? '#8fc6ff' : '#9be29b', 0.012);
    tag.position.set(0, 4.9, 0); s.add(tag);
    return { pul, w, ropes, arr, moving };
  };
  PUL.fixed = mk(-2.4, false);
  PUL.mov = mk(2.4, true);
}
function updPulley() {
  const h = PUL.lift * 1.2, G = PUL.G;
  { // 定滑轮
    const u = PUL.fixed;
    const hookY = 4.0 - h - u.w.userData.h;
    u.w.position.set(-0.7, hookY, 0);
    u.ropes[0].set(new THREE.Vector3(-0.7, 4.05, 0), new THREE.Vector3(-0.7, hookY + 0.64, 0));
    const handY = 1.5 - h;
    u.ropes[1].set(new THREE.Vector3(0.7, 4.05, 0), new THREE.Vector3(0.7, handY + 0.5, 0));
    u.arr.set(new THREE.Vector3(0.7, handY + 0.55, 0), new THREE.Vector3(0.7, handY, 0), 'F=' + G.toFixed(0) + ' N');
  }
  { // 动滑轮：两段绳分担「物重 + 动滑轮重」（不计绳重与摩擦）
    const u = PUL.mov;
    const pulY = 3.9 - h;
    u.pul.position.y = pulY;
    u.w.position.set(0, pulY - u.pul.userData.r - 0.1 - u.w.userData.h, 0);
    u.ropes[0].set(new THREE.Vector3(-0.34, 4.35, 0), new THREE.Vector3(-0.34, pulY, 0));
    const pullY = 4.35 + 2 * h;
    u.ropes[1].set(new THREE.Vector3(0.34, pulY, 0), new THREE.Vector3(0.34, pullY, 0));
    u.arr.set(new THREE.Vector3(0.34, pullY + 0.05, 0), new THREE.Vector3(0.34, pullY + 0.95, 0), 'F=' + ((G + PUL.G0) / 2).toFixed(0) + ' N');
  }
  hset('gf', G.toFixed(0) + ' N');
  hset('mf', ((G + PUL.G0) / 2).toFixed(0) + ' N（=(G+G动)/2）');
  hset('s', '定 1.2 m · 动 2.4 m');
  hset('con', PUL.G0 > 0 ? '动滑轮重也要提，G动越大越费' : '定：不省力改方向；动：省半力费距离');
}

/* ============ 04/07 滑轮组（与效率共用造型） ============ */

const BLK = { n: 3, G: 300, lift: 0, lifting: false, s: null };
function buildBlockScene(g) {
  const postL = box(0.16, 5, 0.16, postMat); postL.position.set(-1.6, 2.5, 0); g.add(postL);
  const postR = box(0.16, 5, 0.16, postMat); postR.position.set(1.6, 2.5, 0); g.add(postR);
  const beam = box(3.6, 0.18, 0.18, plankMat); beam.position.y = 4.9; g.add(beam);
  BLK.fixPul = makePulley(0.3); BLK.fixPul.position.set(0, 4.6, 0); g.add(BLK.fixPul);
  BLK.movPul = makePulley(0.3); g.add(BLK.movPul);
  BLK.load = makeWeight(); g.add(BLK.load);
  BLK.ropes = [];
  for (let i = 0; i < 6; i++) { const r = makeRope(); g.add(r); BLK.ropes.push(r); }
  BLK.arr = makeArrow(0xffa23e); g.add(BLK.arr);
  BLK.s = g;
}
function layoutBlock(h, loadG, fText) {
  if (!BLK.s) return;
  const n = BLK.n, G = loadG;
  BLK.movPul.position.y = 2.4 + h;
  BLK.load.position.set(0, BLK.movPul.position.y - 0.4 - BLK.load.userData.h, 0);
  for (let i = 0; i < BLK.ropes.length; i++) BLK.ropes[i].visible = false;
  const topY = 4.62, botPulY = BLK.movPul.position.y;
  for (let i = 0; i < n; i++) {
    const z = (i - (n - 1) / 2) * 0.3;
    if (i % 2 === 0) BLK.ropes[i].set(new THREE.Vector3(0, topY, z), new THREE.Vector3(0, botPulY + 0.3, z));
    else BLK.ropes[i].set(new THREE.Vector3(0, botPulY - 0.3, z), new THREE.Vector3(0, topY, z));
    BLK.ropes[i].visible = true;
  }
  // 自由端：绕过定滑轮后向下，提升时上升 n·h
  const free = BLK.ropes[BLK.ropes.length - 1];
  const freeY = clamp(1.5 + n * h, 0.3, 4.5);
  free.visible = true;
  free.set(new THREE.Vector3(1.35, topY + 0.05, 0.45), new THREE.Vector3(1.35, freeY + 0.5, 0.45));
  BLK.arr.set(new THREE.Vector3(1.35, freeY + 0.55, 0.45), new THREE.Vector3(1.35, freeY + 1.35, 0.45), 'F=' + (fText !== undefined ? fText : (G / n).toFixed(0)) + ' N');
  hset('f', (G / n).toFixed(0) + ' N（=' + G + '/' + n + '）');
  hset('s', (n * h).toFixed(1) + ' m');
  hset('h', h.toFixed(1) + ' m');
  hset('w', (G * h).toFixed(0) + ' J');
}

/* ============ 05 斜面 ============ */

const RAMP = { ang: 22, mu: true, push: 0, pushing: false, showDecomp: false };
function buildRamp(g) {
  const truck = new THREE.Group(); truck.position.x = 4.6; g.add(truck);
  const bed = box(3.4, 0.16, 1.7, M(0x5f6a75, 0.6, 0.4)); bed.position.y = 1.42; truck.add(bed);
  const cab = box(1.0, 1.0, 1.6, M(0xd0763a, 0.6)); cab.position.set(-2.0, 1.95, 0); truck.add(cab);
  const win = box(0.5, 0.4, 1.4, M(0xbfe0f0, 0.3)); win.position.set(-2.0, 2.45, 0); truck.add(win);
  [[-1.4], [0.2], [1.6]].forEach(([x]) => {
    const w = cyl(0.34, 0.34, 0.22, M(0x2c2f33, 0.9));
    w.rotation.x = Math.PI / 2; w.position.set(x, 0.34, 0.72); truck.add(w);
    const w2 = w.clone(); w2.position.z = -0.72; truck.add(w2);
  });
  RAMP.plank = box(4.6, 0.1, 1.0, plankMat); g.add(RAMP.plank);
  RAMP.crate = box(0.8, 0.8, 0.8, M(0xb98d5f, 0.85)); g.add(RAMP.crate);
  RAMP.pull = makeArrow(0xffa23e); g.add(RAMP.pull);
  RAMP.gDown = makeArrow(0xe86a5a); g.add(RAMP.gDown);
  RAMP.gAl = makeArrow(0x8f7fe8); g.add(RAMP.gAl);
  updRamp();
}
function updRamp() {
  const th = RAMP.ang * Math.PI / 180;
  const len = 4.6;
  const baseX = 0.1, baseY = 0.06;
  const topX = baseX + Math.cos(th) * len, topY = baseY + Math.sin(th) * len;
  RAMP.plank.position.set((baseX + topX) / 2, (baseY + topY) / 2, 0);
  RAMP.plank.rotation.z = th;
  const d = 0.8 + RAMP.push * (len - 1.6);
  const cx = baseX + Math.cos(th) * d;
  const cy = baseY + Math.sin(th) * d + 0.45;
  RAMP.crate.position.set(cx, cy, 0);
  RAMP.crate.rotation.z = th;
  const G = 400;
  const Fneed = G * Math.sin(th) + (RAMP.mu ? 0.3 * G * Math.cos(th) : 0);
  const dirV = new THREE.Vector3(Math.cos(th), Math.sin(th), 0);
  const tip = new THREE.Vector3(cx + dirV.x * 0.45, cy + dirV.y * 0.45, 0);
  RAMP.pull.set(tip.clone().addScaledVector(dirV, 1.2), tip, 'F=' + Fneed.toFixed(0) + ' N');
  if (RAMP.showDecomp) {
    const c0 = new THREE.Vector3(cx, cy + 0.3, 0.75);
    const downHill = new THREE.Vector3(-Math.sin(th), -Math.cos(th), 0);   // 沿面下滑方向
    const press = new THREE.Vector3(Math.sin(th), -Math.cos(th), 0);       // 垂直压向斜面
    RAMP.gDown.set(c0, c0.clone().addScaledVector(downHill, 0.2 + G * Math.sin(th) / 700), '下滑分力');
    RAMP.gAl.set(c0, c0.clone().addScaledVector(press, 0.2 + G * Math.cos(th) / 700), '压紧斜面');
  } else { RAMP.gDown.hide(); RAMP.gAl.hide(); }
  const h = Math.sin(th) * len;
  hset('h', h.toFixed(2) + ' m');
  hset('f', Fneed.toFixed(0) + ' N');
  hset('wl', (G * h).toFixed(0) + ' J');
  hset('wr', (Fneed * len).toFixed(0) + ' J');
  // 斜面机械效率：η = W有用/W总 = G·h / (F·L)；坡越陡、面越光滑，η 越高
  const eta = Fneed > 0 ? (G * h) / (Fneed * len) * 100 : 100;
  hset('eta', eta.toFixed(0) + ' %');
}

/* ============ 06 轮轴（辘轳） ============ */

const WIN = { R: 0.6, r: 0.22, G: 150, spin: 0, spinning: false };
function buildWinch(g) {
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.05, 0.7, 28, 1, true), stoneMat);
  ring.position.y = 0.35; g.add(ring);
  const water = cyl(0.84, 0.84, 0.02, new THREE.MeshPhysicalMaterial({ color: 0x2f7bb5, transparent: true, opacity: 0.8, roughness: 0.15 }));
  water.position.y = 0.3; g.add(water);
  [[-1.1], [1.1]].forEach(([x]) => { const p = box(0.14, 2.4, 0.14, postMat); p.position.set(x, 1.2, 0); g.add(p); });
  const beam = box(2.5, 0.14, 0.14, plankMat); beam.position.y = 2.4; g.add(beam);
  WIN.drum = cyl(0.22, 0.22, 0.5, M(0x8a6a48, 0.85));
  WIN.drum.rotation.z = Math.PI / 2; WIN.drum.position.y = 2.05; g.add(WIN.drum);
  WIN.crank = new THREE.Group(); WIN.crank.position.set(0.35, 2.05, 0); g.add(WIN.crank);
  WIN.arm = box(0.06, 1, 0.06, M(0x6f747b, 0.5, 0.6));
  WIN.arm.geometry.translate(0, 0.5, 0);
  WIN.crank.add(WIN.arm);
  const handle = cyl(0.035, 0.035, 0.3, M(0x4a4e54, 0.6));
  handle.rotation.x = Math.PI / 2; WIN.crank.add(handle); WIN.handle = handle;
  WIN.rope = makeRope(); g.add(WIN.rope);
  WIN.bucket = cyl(0.2, 0.16, 0.3, M(0x9a7248, 0.85)); g.add(WIN.bucket);
  WIN.arr = makeArrow(0xffa23e); g.add(WIN.arr);
  updWinch();
}
function updWinch() {
  const { R, r, G } = WIN;
  WIN.drum.geometry.dispose();
  WIN.drum.geometry = new THREE.CylinderGeometry(r, r, 0.5, 20);
  WIN.drum.rotation.z = Math.PI / 2;
  WIN.arm.scale.y = R;
  WIN.handle.position.y = R;
  const turned = WIN.spin * 0.9;
  const bucketY = 1.05 + turned - 0.15;
  WIN.rope.set(new THREE.Vector3(0, 2.05, 0), new THREE.Vector3(0, bucketY + 0.15, 0));
  WIN.bucket.position.y = bucketY;
  const crankAng = -WIN.spin / r * 0.9;
  WIN.crank.rotation.z = crankAng;
  const F = G * r / R;
  const hx = 0.35 + Math.cos(crankAng) * R, hy = 2.05 + Math.sin(crankAng) * R;
  WIN.arr.set(new THREE.Vector3(hx, hy + 0.65, 0.15), new THREE.Vector3(hx, hy + 0.1, 0.15), 'F=' + F.toFixed(0) + ' N');
  hset('f', F.toFixed(1) + ' N');
  hset('eq', F.toFixed(1) + '×' + R.toFixed(2) + ' = ' + G + '×' + r.toFixed(2));
  hset('r', '轮 R=' + R.toFixed(2) + ' m · 轴 r=' + r.toFixed(2) + ' m');
  hset('pow', '省力 ' + (R / r).toFixed(1) + ' 倍，费距离同倍');
}

/* ============ 07 机械效率 ============ */

const EFF = { n: 3, G: 400, G0: 60, t: 0, lifting: false, s: null, bars: null };
function buildEff(g) {
  buildBlockScene(g);
  EFF.s = g;
  const tag = lbl('动滑轮有重量 → 要做额外功', '#ffd166', 0.005);
  tag.position.set(0, 1.0, -2.2); g.add(tag);
  const gauge = lbl('', '#ffb46e', 0.011);
  g.add(gauge); EFF.gauge = gauge;
  const bars = document.createElement('div');
  bars.className = 'hud-card';
  bars.style.cssText = 'position:absolute;top:186px;right:14px;width:250px;z-index:10;';
  bars.innerHTML = `
    <div style="margin-bottom:4px"><b>功的分解</b>（提升 1 m）</div>
    <div class="bar-row"><span class="bar-label">有用</span><div class="bar-track"><div class="bar-fill" id="ef-wu" style="background:#3fa96f"></div></div><span class="bar-val" id="ef-vu">–</span></div>
    <div class="bar-row"><span class="bar-label">额外</span><div class="bar-track"><div class="bar-fill" id="ef-we" style="background:#d0803e"></div></div><span class="bar-val" id="ef-ve">–</span></div>
    <div class="bar-row"><span class="bar-label">效率</span><div class="bar-track"><div class="bar-fill" id="ef-eta" style="background:#5aa7e8"></div></div><span class="bar-val" id="ef-veta">–</span></div>`;
  stage.appendChild(bars);
  EFF.bars = bars;
  calcEff(0);
}
function calcEff(t) {
  const n = EFF.n, G = EFF.G, G0 = EFF.G0;
  const F = (G + G0) / n * 1.06;   // 1.06：绳重与摩擦的示意系数
  const h = t;
  if (EFF.s) { BLK.n = n; layoutBlock(h, G, F.toFixed(0)); }
  const Wuse = G * h, Wtotal = F * n * h;
  const eta = Wtotal > 0 ? Wuse / Wtotal * 100 : 0;
  hset('f', F.toFixed(0) + ' N');
  hset('s', (n * h).toFixed(2) + ' m');
  hset('wu', Wuse.toFixed(0) + ' J');
  hset('eta', eta.toFixed(1) + ' %');
  if (EFF.gauge) setSpriteText(EFF.gauge, '测力计 ' + F.toFixed(0) + ' N', { fontSize: 28, color: '#ffb46e', scale: 0.006, bg: 'rgba(12,18,26,0.66)' });
  if (EFF.gauge) { EFF.gauge.position.set(1.35, 2.6 + n * 2 * t, 0.3); }
  const q = (id) => document.getElementById(id);
  if (q('ef-wu')) {
    const tot = Math.max(Wtotal, 1);
    q('ef-wu').style.width = (Wuse / tot * 100).toFixed(0) + '%';
    q('ef-vu').textContent = Wuse.toFixed(0) + ' J';
    q('ef-we').style.width = ((Wtotal - Wuse) / tot * 100).toFixed(0) + '%';
    q('ef-ve').textContent = (Wtotal - Wuse).toFixed(0) + ' J';
    q('ef-eta').style.width = eta.toFixed(0) + '%';
    q('ef-veta').textContent = eta.toFixed(0) + '%';
  }
}

/* ============ 08 生活中的机械（桔槔 + 杆秤） ============ */

const LIFE = { focus: 'shad', Gstone: 400, pull: 1, pulling: false, m: 2, weigh: 2.2, radius: 2, tonnage: 1.2, falls: 4 };
/* 塔吊力矩模型：额定力矩 60 kN·m → 额定起重量 = 60 / (9.8 × r) t */
const CRANE_MMAX = 60;
const CRANE_LOADS = [[1.2, '一托砖'], [2, '一捆钢筋'], [3.2, '混凝土吊斗']];
function buildLife(g) {
  // —— 桔槔 ——
  const a = new THREE.Group(); a.position.set(-3.4, 0, 0); g.add(a); LIFE.shad = a;
  const post = cyl(0.09, 0.12, 3.1, M(0x7a5c3e, 0.9)); post.position.y = 1.55; a.add(post);
  LIFE.beam = new THREE.Group(); LIFE.beam.position.y = 2.95; a.add(LIFE.beam);
  const bArm = box(4.05, 0.1, 0.1, M(0x8a6845, 0.9)); bArm.position.x = 1.175; LIFE.beam.add(bArm);
  LIFE.well = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.78, 0.5, 24, 1, true),
    new THREE.MeshStandardMaterial({ map: stoneMat.map, normalMap: stoneMat.normalMap, color: 0x9a958c, roughness: 0.95, side: THREE.DoubleSide }));
  LIFE.well.position.set(3.2, 0.25, 0); a.add(LIFE.well);
  const wellWater = cyl(0.6, 0.6, 0.02, new THREE.MeshPhysicalMaterial({ color: 0x2f7bb5, transparent: true, opacity: 0.85, roughness: 0.15 }));
  wellWater.position.set(3.2, 0.16, 0); a.add(wellWater);
  LIFE.bucket = cyl(0.22, 0.18, 0.32, M(0x9a7248, 0.85)); a.add(LIFE.bucket);
  LIFE.stone = new THREE.Mesh(new THREE.DodecahedronGeometry(0.4, 0), rockMat); a.add(LIFE.stone);
  LIFE.lRope = makeRope(); a.add(LIFE.lRope);
  LIFE.sRope = makeRope(); a.add(LIFE.sRope);
  const t1 = lbl('配重石', '#8fc6ff', 0.0055); a.add(t1);
  const t2 = lbl('水桶（长臂端）', '#ffb46e', 0.0055); a.add(t2);
  LIFE.t2 = t2;
  // —— 杆秤 ——
  const b = new THREE.Group(); b.position.set(3.6, 0, 0); g.add(b); LIFE.scale = b;
  const bPost = cyl(0.05, 0.07, 2.6, M(0x7a5c3e, 0.9)); bPost.position.y = 1.3; b.add(bPost);
  LIFE.wbeam = new THREE.Group(); LIFE.wbeam.position.y = 2.9; b.add(LIFE.wbeam);
  const arm = box(2.0, 0.07, 0.05, M(0x8a6845, 0.85)); arm.position.x = 0.45; LIFE.wbeam.add(arm);
  LIFE.goods = box(0.42, 0.3, 0.3, M(0xc9b48a, 0.9)); b.add(LIFE.goods);
  LIFE.gRope = makeRope(0xdddddd, 0.016); b.add(LIFE.gRope);
  LIFE.wt = cyl(0.1, 0.1, 0.11, M(0x6f747b, 0.4, 0.7)); b.add(LIFE.wt);
  LIFE.wRope = makeRope(0xdddddd, 0.014); b.add(LIFE.wRope);
  LIFE.wtLbl = lbl('读数', '#ffd166', 0.0095); b.add(LIFE.wtLbl);
  LIFE.knob = makeRope(0xdddddd, 0.016); LIFE.wbeam.add(LIFE.knob);
  LIFE.knob.set(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -0.31, 0));
  // —— 塔吊（简化力矩演示） ——
  const cr = new THREE.Group(); cr.position.set(0, 0, 7); g.add(cr); LIFE.crane = cr;
  const mast = box(0.5, 7.2, 0.5, M(0xd8a02e, 0.6, 0.3)); mast.position.y = 3.6; cr.add(mast);
  LIFE.jib = new THREE.Group(); LIFE.jib.position.y = 7.2; cr.add(LIFE.jib);
  const jibLong = box(4.8, 0.16, 0.26, M(0xe8b23a, 0.55, 0.35)); jibLong.position.x = 2.4; LIFE.jib.add(jibLong);
  const jibShort = box(1.8, 0.16, 0.26, M(0xe8b23a, 0.55, 0.35)); jibShort.position.x = -0.9; LIFE.jib.add(jibShort);
  const tie = makeRope(0x9aa2ab, 0.035); tie.set(new THREE.Vector3(0, 1.1, 0), new THREE.Vector3(4.6, 0.1, 0)); LIFE.jib.add(tie);
  tie.set(new THREE.Vector3(0, 1.1, 0), new THREE.Vector3(-1.7, 0.1, 0));
  const cw = box(0.75, 0.95, 0.75, M(0x9a958c, 0.9)); cw.position.set(-1.55, -0.55, 0); LIFE.jib.add(cw);
  const cab = box(0.6, 0.55, 0.6, M(0x5f6a75, 0.5, 0.3)); cab.position.set(0.55, -0.4, 0); LIFE.jib.add(cab);
  LIFE.trolley = box(0.34, 0.18, 0.4, M(0x4a4e54, 0.5, 0.5)); LIFE.jib.add(LIFE.trolley);
  LIFE.cLoad = box(0.72, 0.55, 0.72, M(0xa5573e, 0.9)); cr.add(LIFE.cLoad);
  LIFE.cRope = makeRope(0x777c82, 0.03); cr.add(LIFE.cRope);
  LIFE.cTag = lbl('', '#9be29b', 0.0075); cr.add(LIFE.cTag);
  updLife();
}
const _tip = new THREE.Vector3();
function updLife() {
  // 桔槔：pull 1=按下（桶入井）0=松手（配重把桶吊起）
  const ang = lerp(-0.06, -0.46, LIFE.pull);
  LIFE.beam.rotation.z = ang;
  LIFE.beam.updateWorldMatrix(true, false);
  const aG = LIFE.shad;
  _tip.set(3.2, 0, 0).applyMatrix4(LIFE.beam.matrixWorld);
  const ropeLen = lerp(0.5, 1.28, LIFE.pull);
  LIFE.bucket.position.set(_tip.x, _tip.y - ropeLen - 0.16, 0);
  LIFE.lRope.set(_tip.clone(), new THREE.Vector3(_tip.x, _tip.y - ropeLen, 0));
  _tip.set(-0.85, 0, 0).applyMatrix4(LIFE.beam.matrixWorld);
  LIFE.stone.position.set(_tip.x, _tip.y - 0.55, 0);
  LIFE.sRope.set(_tip.clone(), new THREE.Vector3(_tip.x, _tip.y - 0.35, 0));
  LIFE.t2.position.set(3.2, 3.4, 0);
  // 杆秤：m·L物 = M砣·L砣，L物=0.55 m，M砣=0.5 kg → 刻度长 L = m×1.1
  const m = LIFE.m, Lgoods = 0.12, Mw = 0.5;
  const Lw = clamp(LIFE.weigh, 0.02, 1.3);
  const tilt = clamp((m * Lgoods - Mw * Lw) * 0.5, -0.2, 0.2);
  LIFE.wbeam.rotation.z = tilt;
  LIFE.wbeam.updateWorldMatrix(true, false);
  const bG = LIFE.scale;
  _tip.set(-Lgoods, 0, 0).applyMatrix4(LIFE.wbeam.matrixWorld).sub(new THREE.Vector3(bG.position.x, 0, 0));
  LIFE.goods.position.set(_tip.x, _tip.y - 0.42, 0);
  LIFE.gRope.set(new THREE.Vector3(_tip.x, _tip.y, 0), new THREE.Vector3(_tip.x, _tip.y - 0.27, 0));
  _tip.set(Lw, 0, 0).applyMatrix4(LIFE.wbeam.matrixWorld).sub(new THREE.Vector3(bG.position.x, 0, 0));
  LIFE.wt.position.set(_tip.x, _tip.y - 0.16, 0);
  LIFE.wRope.set(new THREE.Vector3(_tip.x, _tip.y, 0), new THREE.Vector3(_tip.x, _tip.y - 0.1, 0));
  setSpriteText(LIFE.wtLbl, '读数≈' + (Lw / 0.24).toFixed(1) + ' kg', { fontSize: 28, color: '#ffd166', scale: 0.0055, bg: 'rgba(12,18,26,0.6)' });
  LIFE.wtLbl.position.set(_tip.x, _tip.y + 0.45, 0);
  // 塔吊：力矩限制器——起重量 × 幅度不能超过额定力矩
  if (LIFE.crane) {
    const r = LIFE.radius, load = LIFE.tonnage;
    const rated = CRANE_MMAX / (9.8 * r);
    const over = load > rated;
    LIFE.trolley.position.x = r;
    LIFE.cLoad.scale.setScalar(Math.cbrt(load / 1.2));
    const topY = 3.35, loadH = 0.55 * Math.cbrt(load / 1.2);
    LIFE.cRope.set(new THREE.Vector3(r, 7.05, 0), new THREE.Vector3(r, topY + loadH, 0));
    LIFE.cLoad.position.set(r, topY + loadH / 2, 0);
    LIFE.jib.rotation.z = over ? -0.045 : 0;
    setSpriteText(LIFE.cTag, over
      ? '超载！' + load + ' t 在 ' + r + ' m 处超过额定 ' + rated.toFixed(2) + ' t'
      : load.toFixed(1) + ' t ≤ 额定 ' + rated.toFixed(2) + ' t，可起吊',
      { fontSize: 28, color: over ? '#ff8a7a' : '#9be29b', scale: 0.0055, bg: 'rgba(12,18,26,0.66)' });
    LIFE.cTag.position.set(r, topY + loadH + 1.15, 0);
    hset('cr', '幅度 r = ' + r.toFixed(1) + ' m');
    hset('cload', load.toFixed(1) + ' t × ' + r.toFixed(1) + ' m = ' + (load * 9.8 * r).toFixed(0) + ' kN·m');
    hset('crated', rated.toFixed(2) + ' t');
    hset('cstatus', over ? '超载，力矩限制器切断起升' : '力矩负荷正常');
    hset('cwire', '每根钢丝绳 ' + (load * 9.8 / LIFE.falls).toFixed(1) + ' kN（' + LIFE.falls + ' 倍率）');
  }
  hset('shad', '配重 ' + LIFE.Gstone + ' N · L1=3.2 m · L2=0.85 m');
  hset('scale', m.toFixed(1) + '×0.55 = 0.5×' + (m * 1.1).toFixed(2));
}

/* ============ HUD ============ */

let hud = null;
function setHUD(rows) {
  if (hud) hud.el.remove();
  hud = makeHUD(stage, rows);
  hud.el.style.cssText = 'position:absolute;top:14px;right:14px;z-index:10;min-width:200px;';
  rows.forEach(([k]) => hset(k, '–'));
}
/** hud 尚未创建时静默（场景构建阶段先于控制条/章节选中） */
function hset(key, text) { if (hud) hud.set(key, text); }

/* ============ 控制条与章节 ============ */

const ctl = createControlsPanel(document.getElementById('controls'));
let quizCleanup = null;

function leverCtl() {
  ctl.clear();
  ctl.slider({ label: '支点位置', min: -2.4, max: 1.8, step: 0.05, value: LEV.pivot, fmt: (v) => 'x=' + v.toFixed(1), onInput: (v) => { LEV.pivot = v; updLever(); } });
  const dirs = [['down', '竖直向下'], ['perp', '垂直撬棍'], ['slant', '斜着用力']];
  const dbtns = [];
  const paintDir = () => dbtns.forEach(({ b, v }) => b.classList.toggle('active', v === LEV.dir));
  dirs.forEach(([v, t]) => {
    const b = ctl.button({ label: t, onClick: () => { LEV.dir = v; updLever(); paintDir(); } });
    dbtns.push({ b, v });
  });
  paintDir();
  ctl.sep();
  ctl.button({ label: '▼ 下压撬棍', onClick() { if (!LEV.pressing) LEV.pressing = true; } });
  ctl.button({ label: '↺ 复位', onClick() { LEV.press = 0; updLever(); } });
  setHUD([['l1', '动力臂 L1'], ['l2', '阻力臂 L2'], ['f', '所需压力'], ['rel', '省力情况']]);
  updLever();
}
function leverClassCtl() {
  ctl.clear();
  const items = [['jia', '撬棍（省力）'], ['nie', '镊子（费力）'], ['ping', '天平（等臂）']];
  const btns = [];
  const paint = () => btns.forEach(({ b, v }) => b.classList.toggle('active', v === LCLASS.kind));
  items.forEach(([v, t]) => {
    const b = ctl.button({ label: t, onClick: () => { LCLASS.kind = v; focusLeverClass(); paint(); } });
    btns.push({ b, v });
  });
  paint();
  ctl.sep();
  ctl.toggle({
    label: '显示全部', value: true,
    onChange: (v) => { v ? unfocusLeverClass() : focusLeverClass(); },
  });
  setHUD([['a', '提示']]);
  hset('a', '三件杠杆实物，按钮切换突出显示');
}
function pulleyCtl() {
  ctl.clear();
  ctl.slider({ label: '物重 G', min: 100, max: 500, step: 10, value: PUL.G, fmt: (v) => v + ' N', onInput: (v) => { PUL.G = v; updPulley(); } });
  ctl.slider({ label: '动滑轮重 G动', min: 0, max: 100, step: 10, value: PUL.G0, fmt: (v) => v + ' N', onInput: (v) => { PUL.G0 = v; updPulley(); } });
  ctl.sep();
  ctl.button({ label: '▲ 提升', onClick() { if (!PUL.lifting) { PUL.lifting = true; PUL.lift = 0; } } });
  ctl.button({ label: '↺ 复位', onClick() { PUL.lift = 0; updPulley(); } });
  setHUD([['gf', '定滑轮拉力'], ['mf', '动滑轮拉力'], ['s', '绳端移动（1.2m 物升）'], ['con', '结论']]);
  updPulley();
}
function blockCtl() {
  ctl.clear();
  const btns = [];
  const paint = () => btns.forEach(({ b, v }) => b.classList.toggle('active', v === BLK.n));
  [2, 3, 4].forEach((n) => {
    const b = ctl.button({ label: n + ' 段绳', onClick: () => { BLK.n = n; layoutBlock(BLK.lift * 2, BLK.G); paint(); } });
    btns.push({ b, v: n });
  });
  paint();
  ctl.sep();
  ctl.slider({ label: '物重 G', min: 100, max: 600, step: 20, value: BLK.G, fmt: (v) => v + ' N', onInput: (v) => { BLK.G = v; layoutBlock(BLK.lift * 2, BLK.G); } });
  ctl.button({ label: '▲ 提升 2 m', onClick() { if (!BLK.lifting) { BLK.lifting = true; BLK.lift = 0; } } });
  setHUD([['f', '拉力 F'], ['s', '绳端距离'], ['h', '重物升高'], ['w', '有用功']]);
  layoutBlock(BLK.lift * 2, BLK.G);
}
function rampCtl() {
  ctl.clear();
  ctl.slider({ label: '倾角', min: 14, max: 34, step: 1, value: RAMP.ang, fmt: (v) => v + '°', onInput: (v) => { RAMP.ang = v; updRamp(); } });
  ctl.toggle({ label: '粗糙坡面（μ=0.3）', value: true, onChange: (v) => { RAMP.mu = v; updRamp(); } });
  ctl.sep();
  ctl.toggle({ label: '显示重力分解', value: false, onChange: (v) => { RAMP.showDecomp = v; updRamp(); } });
  ctl.button({ label: '▲ 推箱上车', onClick() { if (!RAMP.pushing) { RAMP.pushing = true; RAMP.push = 0; } } });
  setHUD([['h', '等效提升高度'], ['f', '沿面拉力'], ['wl', '直接提升做功'], ['wr', '沿斜面做功'], ['eta', '斜面效率 η']]);
  updRamp();
}
function winchCtl() {
  ctl.clear();
  ctl.slider({ label: '轮半径 R', min: 0.4, max: 0.85, step: 0.01, value: WIN.R, fmt: (v) => v.toFixed(2) + ' m', onInput: (v) => { WIN.R = v; updWinch(); } });
  ctl.slider({ label: '轴半径 r', min: 0.12, max: 0.32, step: 0.01, value: WIN.r, fmt: (v) => v.toFixed(2) + ' m', onInput: (v) => { WIN.r = v; updWinch(); } });
  ctl.slider({ label: '水桶+水重', min: 60, max: 300, step: 10, value: WIN.G, fmt: (v) => v + ' N', onInput: (v) => { WIN.G = v; updWinch(); } });
  ctl.sep();
  ctl.button({
    label: '⟳ 摇动辘轳', active: false,
    onClick(btn) {
      WIN.spinning = !WIN.spinning;
      btn.classList.toggle('active', WIN.spinning);
      btn.textContent = WIN.spinning ? '⏸ 停止' : '⟳ 摇动辘轳';
    },
  });
  setHUD([['f', '手柄拉力'], ['eq', '平衡式 F·R=G·r'], ['r', '结构'], ['pow', '特点']]);
  updWinch();
}
function effCtl() {
  ctl.clear();
  const btns = [];
  const paint = () => btns.forEach(({ b, v }) => b.classList.toggle('active', v === EFF.n));
  [2, 3, 4].forEach((n) => {
    const b = ctl.button({ label: n + ' 段绳', onClick: () => { EFF.n = n; calcEff(EFF.t); paint(); } });
    btns.push({ b, v: n });
  });
  paint();
  ctl.sep();
  ctl.slider({ label: '物重 G', min: 100, max: 900, step: 20, value: EFF.G, fmt: (v) => v + ' N', onInput: (v) => { EFF.G = v; calcEff(EFF.t); } });
  ctl.slider({ label: '动滑轮重 G₀', min: 10, max: 150, step: 5, value: EFF.G0, fmt: (v) => v + ' N', onInput: (v) => { EFF.G0 = v; calcEff(EFF.t); } });
  ctl.button({ label: '▲ 匀速提升 1 m', onClick() { if (!EFF.lifting) { EFF.lifting = true; EFF.t = 0; } } });
  setHUD([['f', '拉力 F'], ['s', '绳端距离'], ['wu', '有用功'], ['eta', '机械效率']]);
  calcEff(EFF.t);
}
function lifeCtl() {
  ctl.clear();
  const CAMS = {
    shad: [[-2.4, 3.6, 10.2], [-0.8, 1.9, 0]],
    scale: [[3.6, 3.4, 9.0], [3.6, 1.9, 0]],
    crane: [[1.5, 6.5, 14.5], [0, 4.4, 7]],
  };
  const btns = [];
  const paint = () => btns.forEach(({ b, v }) => b.classList.toggle('active', v === LIFE.focus));
  const goFocus = (v) => {
    LIFE.focus = v; paint();
    app.setCamera(...CAMS[v]);
    lifeCtl();   // 重画下半区控件
  };
  [['shad', '桔槔'], ['scale', '杆秤'], ['crane', '塔吊']].forEach(([v, t]) => {
    const b = ctl.button({ label: t, onClick: () => goFocus(v) });
    btns.push({ b, v });
  });
  paint();
  ctl.sep();
  if (LIFE.focus === 'crane') {
    ctl.slider({ label: '幅度（小车位置）', min: 1, max: 4, step: 0.1, value: LIFE.radius, fmt: (v) => v.toFixed(1) + ' m', onInput: (v) => { LIFE.radius = v; updLife(); } });
    const lbtns = [];
    const paintL = () => lbtns.forEach(({ b, v }) => b.classList.toggle('active', v === LIFE.tonnage));
    CRANE_LOADS.forEach(([t, name]) => {
      const b = ctl.button({ label: name + ' ' + t + ' t', onClick: () => { LIFE.tonnage = t; updLife(); paintL(); } });
      lbtns.push({ b, v: t });
    });
    paintL();
    const fbtns = [];
    const paintF = () => fbtns.forEach(({ b, v }) => b.classList.toggle('active', v === LIFE.falls));
    [2, 4].forEach((n) => {
      const b = ctl.button({ label: '吊钩 ' + n + ' 倍率', onClick: () => { LIFE.falls = n; updLife(); paintF(); } });
      fbtns.push({ b, v: n });
    });
    paintF();
    setHUD([['cr', '幅度'], ['cload', '力矩负荷'], ['crated', '额定起重量'], ['cstatus', '状态'], ['cwire', '钢丝绳拉力']]);
  } else if (LIFE.focus === 'scale') {
    ctl.slider({ label: '被称物重', min: 0.5, max: 5, step: 0.1, value: LIFE.m, fmt: (v) => v.toFixed(1) + ' kg', onInput: (v) => { LIFE.m = v; LIFE.weigh = v * 0.24; updLife(); } });
    setHUD([['scale', '杆秤平衡式']]);
  } else {
    ctl.slider({ label: '配重石重', min: 150, max: 800, step: 10, value: LIFE.Gstone, fmt: (v) => v + ' N', onInput: (v) => { LIFE.Gstone = v; } });
    ctl.button({
      label: '▼ 按下提水',
      onClick(btn) {
        LIFE.pulling = !LIFE.pulling;
        btn.classList.toggle('active', LIFE.pulling);
        btn.textContent = LIFE.pulling ? '⏫ 松手吊水' : '▼ 按下提水';
      },
    });
    setHUD([['shad', '桔槔'], ['scale', '杆秤平衡式']]);
  }
  updLife();
}

/* ============ 随堂检测 ============ */

const QUIZ = [
  {
    q: '杠杆平衡的条件是？',
    opts: ['F1 + L1 = F2 + L2', 'F1·L1 = F2·L2（动力×动力臂=阻力×阻力臂）', 'F1/L1 = F2/L2', '动力臂一定大于阻力臂'],
    a: 1,
    ex: '杠杆平衡条件（杠杆原理）：动力×动力臂 = 阻力×阻力臂，即 F1L1=F2L2。',
  },
  {
    q: '使用定滑轮提升重物，它的特点是？',
    opts: ['省一半力，但费距离', '不省力也不费力，可以改变力的方向', '既省力又省距离', '省力，但不改变力的方向'],
    a: 1,
    ex: '定滑轮实质是等臂杠杆：不省力也不费力、不费距离，但能改变力的方向（如旗杆顶的滑轮）。',
  },
  {
    q: '不计动滑轮重与摩擦时，用动滑轮提升重物 F = ？',
    opts: ['G', 'G/2', '2G', 'G/3'],
    a: 1,
    ex: '动滑轮实质是动力臂为阻力臂 2 倍的杠杆，两段绳共同承担物重，故 F=G/2，但绳端要移动 2 倍距离。',
  },
  {
    q: '关于「使用机械能否省功」，正确的说法是？',
    opts: ['省力的机械可以省功', '费力的机械反而省功', '任何机械都不能省功（省力必费距离）', '滑轮组可以省功'],
    a: 2,
    ex: '功的原理：使用任何机械都不能省功。省力必然费距离，费力必然省距离——所以机械效率总小于 100%。',
  },
  {
    q: '用同一滑轮组提升重物，下列哪种做法能提高机械效率？',
    opts: ['减小提升的物重', '增大提升的物重', '加快提升速度', '加长绳子'],
    a: 1,
    ex: 'η=W有用/W总。增大物重，有用功占比变大（额外功基本不变），效率提高；减小动滑轮自重与摩擦同理。',
  },
  {
    q: '用 n = 4 的滑轮组匀速提升 360 N 的重物，动滑轮总重 40 N，不计绳重和摩擦，拉力为？',
    opts: ['90 N', '100 N', '110 N', '400 N'],
    a: 1,
    ex: 'F = (G + G动) / n = (360 + 40) / 4 = 100 N。动滑轮重也被 n 段绳分担，绳端还要移动 s = 4h。',
  },
  {
    q: '沿长 3 m、高 1.2 m 的斜面把 500 N 的箱子匀速拉上去，拉力 250 N，斜面的机械效率是？',
    opts: ['60%', '75%', '80%', '100%'],
    a: 2,
    ex: 'W有用 = G·h = 500×1.2 = 600 J，W总 = F·L = 250×3 = 750 J，η = 600/750 = 80%。剩下的 150 J 是克服摩擦做的额外功。',
  },
  {
    q: '塔吊的变幅小车向外移动时，能吊起的最大质量变小，是因为？',
    opts: ['钢丝绳变长了', '吊物的力臂变长，力矩变大', '配重变轻了', '滑轮组的倍率变小了'],
    a: 1,
    ex: '配重能平衡的力矩有限：幅度 r 越大，「起重量 × 幅度」越容易超过额定力矩，所以额定起重量随幅度变小——力矩限制器就是按这个乘积报警的。',
  },
];

function showQuiz() {
  let idx = 0, score = 0;
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
        next.addEventListener('click', () => { idx++; if (idx < QUIZ.length) renderQ(); else renderResult(); });
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
    again.type = 'button'; again.className = 'ctl-btn active'; again.textContent = '重新测验';
    again.addEventListener('click', () => { idx = 0; score = 0; renderQ(); });
    const back = document.createElement('button');
    back.type = 'button'; back.className = 'ctl-btn'; back.textContent = '返回第一章节';
    back.addEventListener('click', () => { panel.remove(); window.__eduSections.select(0); });
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:10px;justify-content:center';
    row.appendChild(back); row.appendChild(again);
    card.appendChild(row);
    panel.appendChild(card);
  }
  renderQ();
  quizCleanup = () => panel.remove();
}

/* ============ 章节定义 ============ */

function hideBars() { if (EFF.bars) EFF.bars.style.display = 'none'; }

const SECTIONS = [
  {
    id: 'lever', title: '杠杆平衡条件',
    html: `<p>撬棍撬石块是最经典的杠杆：<b>支点</b>在垫石上，手压的一端是<b>动力</b>，石块的重力是<b>阻力</b>。</p>
<p>杠杆平衡（或缓慢转动）时满足 <span class="hl">F₁·L₁ = F₂·L₂</span>。<b>力臂是支点到力的作用线的距离，不是到作用点的距离</b>——切换「用力方向」试试：同样握在末端，斜着用力时作用线离支点更近，力臂变短，要使更大的力。把支点挪近石块，阻力臂 L₂ 变短，所需的压力随之变小——「给我一个支点，我能撬起地球」。不过一个人最多能使出约 <span class="hl">600 N</span> 的力，超过就撬不动了。</p>
<p>拖动「支点位置」观察两个力臂的变化，点「下压撬棍」看石块被撬起：省力，但手要压下更大的距离。</p>`,
    enter() {
      useScene('lev', buildLever);
      app.setCamera([1.5, 3.6, 8.5], [0, 1.2, 0]);
      LEV.press = 0; LEV.pressing = false;
      hideBars();
      leverCtl();
    },
  },
  {
    id: 'lever-class', title: '杠杆的分类',
    html: `<p>按动力臂与阻力臂的长短，杠杆分三类：</p>
<p>① <b>省力杠杆</b>（L₁>L₂）：撬棍、独轮车、瓶起子——省力费距离。独轮车的车轮是支点，货装得越靠近车轮，阻力臂越短，抬着越省力；② <b>费力杠杆</b>（L₁<L₂）：镊子、钓鱼竿、起重臂——费力省距离，换来操作灵活：随车吊的液压缸只伸长一点点，吊钩就升高很多；③ <b>等臂杠杆</b>（L₁=L₂）：天平、定滑轮——不省力不费距离。</p>
<p>点按钮突出其中一件，观察各自力臂的相对长短。</p>`,
    enter() {
      useScene('levclass', buildLeverClass);
      app.setCamera([0, 2.6, 9.8], [0, 1.0, 0]);
      hideBars();
      leverClassCtl();
    },
  },
  {
    id: 'pulley', title: '定滑轮与动滑轮',
    html: `<p>滑轮是变形的杠杆。<b>定滑轮</b>（轴固定不动）实质是等臂杠杆：不省力也不费力，但能改变力的方向——升旗时向下拉绳，旗向上升。改变拉绳的方向，拉力也不变（力臂始终是轮半径）。</p>
<p><b>动滑轮</b>（随重物一起移动）实质是动力臂为阻力臂 2 倍的杠杆：两段绳共同分担物重，不计绳重与摩擦时 <span class="hl">F = (G + G<sub>动</sub>) / 2</span>，但绳端要移动 2 倍距离，且不能改变用力方向——动滑轮越重，越「吃」掉省下的力。</p>
<p>点「提升」对比两侧：左边的绳端下移 1.2 m，右边要上拉 2.4 m。调大「动滑轮重」看拉力怎么变。</p>`,
    enter() {
      useScene('pulley', buildPulleyScene);
      app.setCamera([0, 3.8, 9.2], [0, 2.6, 0]);
      PUL.lift = 0; PUL.lifting = false;
      hideBars();
      pulleyCtl();
    },
  },
  {
    id: 'block', title: '滑轮组',
    html: `<p>把定滑轮和动滑轮组合起来就是<b>滑轮组</b>：既省力又能改变力的方向。由 <span class="hl">n 段绳承担物重</span>时（不计动滑轮重与摩擦）：</p>
<p><span class="hl">F = G / n</span>，绳端移动距离 <span class="hl">s = n·h</span>——省力必须费距离。绕绳有个规律：<b>n 为偶数</b>时绳头系在定滑轮上、最后向下拉；<b>n 为奇数</b>时绳头系在动滑轮上。绳端最后绕过的那个定滑轮只改变用力方向，不承担物重。</p>
<p>脚手架上的吊砖滑轮组就是这样：切换绳段数、改变物重，点「提升」观察绳端移动的距离。</p>`,
    enter() {
      useScene('block', buildBlockScene);
      app.setCamera([4.5, 4.4, 8.0], [0.4, 2.8, 0]);
      BLK.lift = 0; BLK.lifting = false;
      hideBars();
      blockCtl();
    },
  },
  {
    id: 'ramp', title: '斜面',
    html: `<p>沿跳板把木箱推上货车，用的就是<b>斜面</b>。斜面是一种省力机械：倾角越小越省力，但要把物体沿更长的坡推上去。</p>
<p>光滑斜面上 <span class="hl">F = G·sinθ</span>；粗糙时还要克服摩擦 <span class="hl">+ μG·cosθ</span>。无论斜面多省力，<b>直接提升与沿斜面推上去做的功差不多</b>（粗糙时反而更多）——机械不省功。再看斜面自己的机械效率 <span class="hl">η = G·h / (F·L)</span>：面越光滑 η 越高，坡越陡 η 也越高（有用功占比变大）。</p>
<p>调节倾角与接触面，点「推箱上车」对比两种做功，HUD 里盯着效率的变化。</p>`,
    enter() {
      useScene('ramp', buildRamp);
      app.setCamera([2.5, 3.4, 8.8], [2.2, 1.0, 0]);
      RAMP.push = 0; RAMP.pushing = false;
      hideBars();
      rampCtl();
    },
  },
  {
    id: 'winch', title: '轮轴',
    html: `<p>农家院里的辘轳是<b>轮轴</b>：大轮（摇柄绕的圆）和小轴（缠绳的滚筒）固定在一起转动。轮半径 R 大于轴半径 r，平衡（匀速）时 <span class="hl">F·R = G·r</span>，即 <span class="hl">F = G·r/R</span>。</p>
<p>轮轴是可以连续旋转的杠杆：摇一整圈，桶升起的距离只有摇柄弧长的 r/R 倍。</p>
<p>改大轮半径或改小轴半径，看手柄拉力怎么变；点「摇动辘轳」看水桶上升。</p>`,
    enter() {
      useScene('winch', buildWinch);
      app.setCamera([2.8, 3.6, 5.6], [0, 1.6, 0]);
      WIN.spin = 0; WIN.spinning = false;
      hideBars();
      winchCtl();
    },
  },
  {
    id: 'eff', title: '机械效率',
    html: `<p>实际使用滑轮组时，动滑轮有重量、绳与轮之间有摩擦——拉力做的功（<b>总功</b>）并没有全部用于提升货物（<b>有用功</b>）。</p>
<p><span class="hl">机械效率 η = W有用 / W总 × 100%</span>，永远小于 100%。同一滑轮组，<b>提升的货物越重、动滑轮越轻，效率越高</b>。</p>
<p>调整参数后点「匀速提升 1 m」，右上角把总功拆成有用功与额外功两截，比例一目了然。</p>`,
    enter() {
      useScene('eff', buildEff);
      app.setCamera([4.5, 4.4, 8.0], [0.4, 2.8, 0]);
      EFF.t = 0; EFF.lifting = false;
      EFF.bars.style.display = '';
      effCtl();
    },
  },
  {
    id: 'life', title: '生活中的机械',
    html: `<p>没有实验器材，生活本身就是实验室：</p>
<p>① <b>桔槔</b>：横杆架在木柱上，短头挂配重石、长头挂水桶。按下长头打水时很费力，但一松手，配重石就把水桶提起来了——用「配重的重力」代替人向上提的力；② <b>杆秤</b>：提纽是支点，秤钩挂货，秤砣在杆上滑动，平衡时 <span class="hl">m·L物 = M砣·L砣</span>，砣的位置直接「读」出重量；③ <b>塔吊</b>：起重臂像一根巨大的杠杆，平衡臂上的配重平衡吊物的力矩。变幅小车走得越远，吊物的力臂越长，能吊起的就越少——驾驶室里的<b>力矩限制器</b>按「起重量 × 幅度」实时核算，超载就切断起升。吊钩滑轮组的倍率越高，每根钢丝绳分到的拉力越小。</p>
<p>点按钮切换场景：拖动塔吊的「幅度」滑杆，看额定起重量怎么一路变小。</p>`,
    enter() {
      useScene('life', buildLife);
      LIFE.pull = 0; LIFE.pulling = false;
      LIFE.weigh = LIFE.m * 0.24;
      app.setCamera([-2.4, 3.6, 10.2], [-0.8, 1.9, 0]);
      hideBars();
      lifeCtl();
    },
  },
  {
    id: 'quiz', title: '随堂检测',
    html: `<p>8 道选择题，检验一下简单机械的掌握情况——既有概念题，也有杠杆、滑轮组、斜面效率的计算题。答完可重新开始。</p>`,
    enter() {
      useScene('levclass', buildLeverClass);
      unfocusLeverClass();
      app.setCamera([0, 2.6, 9.8], [0, 1.0, 0]);
      ctl.clear();
      hideBars();
      showQuiz();
    },
  },
];

/* ============ 帧循环 ============ */

app.onFrame((dt) => {
  cameraTweenTick(app, dt);
  if (LEV.pressing) {
    LEV.press += dt * 0.45;
    if (LEV.press >= 1) { LEV.press = 1; LEV.pressing = false; }
    updLever();
  }
  if (PUL.lifting) {
    PUL.lift += dt * 0.3;
    if (PUL.lift >= 1) { PUL.lift = 1; PUL.lifting = false; }
    updPulley();
  }
  if (BLK.lifting) {
    BLK.lift += dt * 0.3;
    if (BLK.lift >= 1) { BLK.lift = 1; BLK.lifting = false; }
    layoutBlock(BLK.lift * 2, BLK.G);
  }
  if (RAMP.pushing) {
    RAMP.push += dt * 0.22;
    if (RAMP.push >= 1) { RAMP.push = 1; RAMP.pushing = false; }
    updRamp();
  }
  if (WIN.spinning) { WIN.spin += dt * 0.5; if (WIN.spin > 1.6) WIN.spin = 0; updWinch(); }
  if (EFF.lifting) {
    EFF.t += dt * 0.4;
    if (EFF.t >= 1) { EFF.t = 1; EFF.lifting = false; }
    calcEff(EFF.t);
  }
  if (scenes.life && scenes.life.visible) {
    LIFE.pull += ((LIFE.pulling ? 1 : 0) - LIFE.pull) * Math.min(1, dt * 2.2);
    updLife();
  }
});

/* ============ 启动 ============ */

loadAll([
  { key: 'sky', label: '天空', job: loadTexture('../assets/textures/sky/sky_site-Co0CA3Qo.webp') },
  { key: 'sand', label: '地面', job: loadTexture('../assets/textures/pbr/sand_diff-BRysB-vE.webp', { colorSpace: null, wrap: true, repeat: [10, 7] }) },
  { key: 'sandN', label: '地面细节', job: loadTexture('../assets/textures/pbr/sand_nor-ZmfE7Ynv.webp', { colorSpace: null, wrap: true, repeat: [10, 7] }) },
  { key: 'timber', label: '木料', job: loadTexture('../assets/textures/pbr/timber_diff-DKgHT6BQ.webp', { colorSpace: null, wrap: true }) },
  { key: 'timberN', label: '木料细节', job: loadTexture('../assets/textures/pbr/timber_nor-Car--EPG.webp', { colorSpace: null, wrap: true }) },
  { key: 'rock', label: '岩石', job: loadTexture('../assets/textures/pbr/rock_diff-B0OXFJjS.webp', { colorSpace: null }) },
  { key: 'rockN', label: '岩石细节', job: loadTexture('../assets/textures/pbr/rock_nor-BD16lJKl.webp', { colorSpace: null }) },
], (d, t, label) => loader.setText(`正在加载工地素材 ${d}/${t}（${label}）`)).then((t) => {
  t.sky.mapping = THREE.EquirectangularReflectionMapping;
  scene.background = t.sky;
  scene.environment = t.sky;
  buildGround(t.sand, t.sandN, t.timber, t.timberN, t.rock, t.rockN);

  loader.hide();
  const sections = createSections({
    nav: document.getElementById('sideNav'),
    descPanel: document.getElementById('descPanel'),
    sections: SECTIONS,
    onSelect(i, sec) {
      if (quizCleanup) { quizCleanup(); quizCleanup = null; }
      sec.enter();
    },
  });
  window.__eduSections = sections;
  sections.select(0);
}).catch((err) => {
  loader.setText('资源加载失败：' + err.message);
  console.error(err);
});
