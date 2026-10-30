/* EduLab · 液体压强与浮力（float）
 * 章节：液体压强与深度 / 连通器：船闸 / 浮力的成因 / 称重法测浮力 / 阿基米德原理
 *       浮沉条件：潜艇 / 轮船与载重线 / 密度计 / 随堂检测
 * 场景：港湾与海底——深潜器下潜、船闸过闸、溢水杯、潜艇压载水舱、集装箱船吃水与载重线；水面实时波浪。
 */
import {
  THREE, clamp,
  loadTexture, loadAll, createApp, cameraTweenTick, makeLoader,
  createSections, createControlsPanel, makeHUD, makeTextSprite, setSpriteText,
} from './edu-core.js';

/* ---------------- 基础 ---------------- */

const stage = document.getElementById('stage');
const loader = makeLoader(stage, '正在注水入港…');
const app = createApp({
  container: stage,
  fov: 42, near: 0.1, far: 500,
  cameraPos: [10, 6, 14], target: [0, 0, 0],
  minDistance: 2, maxDistance: 80,
  keepBackground: true,
});
const { scene, camera, controls } = app;

scene.add(new THREE.HemisphereLight(0xd9e8f7, 0x4a5a66, 0.8));
const sun = new THREE.DirectionalLight(0xfff0d8, 2.1);
sun.position.set(-12, 18, 9);
scene.add(sun);

const G = 9.8;
const lerp = (a, b, t) => a + (b - a) * t;

/* ---------------- 通用小件 ---------------- */

const M = (color, rough = 0.8, metal = 0) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal });
const box = (w, h, d, mat) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
const cyl = (rt, rb, h, mat, seg = 20) => new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);

function makeArrow(color) {
  const g = new THREE.Group();
  const hex = '#' + new THREE.Color(color).getHexString();
  const mat = new THREE.MeshBasicMaterial({ color });
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1, 10), mat);
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
function lbl(text, color = '#e8f0fa', scale = 0.007) {
  return makeTextSprite(text, { fontSize: 30, color, scale, bg: 'rgba(12,18,26,0.6)' });
}
function makeRope(color = 0xd8ccb0, thick = 0.035) {
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

/* ---------------- 波浪与水面 ---------------- */

function waveH(x, z, t) {
  return Math.sin(x * 0.55 + t * 1.25) * 0.075 + Math.cos(z * 0.8 + t * 0.9) * 0.055 + Math.sin((x + z) * 0.32 + t * 0.6) * 0.05;
}
const waters = [];   // {mesh, base, w, d, segx, segz}
function buildWater(g, w = 60, d = 44, y = 0, opacity = 0.78) {
  const geo = new THREE.PlaneGeometry(w, d, 56, 44);
  geo.rotateX(-Math.PI / 2);
  const mat = new THREE.MeshPhysicalMaterial({
    color: 0x2f7bb5, transparent: true, opacity,
    roughness: 0.16, metalness: 0.06, clearcoat: 0.7, clearcoatRoughness: 0.2,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = y;
  g.add(mesh);
  waters.push({ mesh, base: geo.attributes.position.clone(), y });
  return mesh;
}

/* ---------------- 港湾固定景物 ---------------- */

let quayMat, concreteMat;
const FLAG = 0;
function buildStatics(quayTex, quayNor) {
  quayMat = new THREE.MeshStandardMaterial({ map: quayTex, normalMap: quayNor, color: 0xcfc9bd, roughness: 0.9 });
  concreteMat = M(0x9a9a94, 0.92);
}
/** 码头岸壁：z>zd 一侧的岸台，顶面 y=topY */
function buildQuay(g, topY, zd = 8, w = 60, depth = 14) {
  const q = box(w, topY, depth, quayMat);
  q.position.set(0, topY / 2, zd + depth / 2);
  g.add(q);
  const edge = box(w, 0.12, 0.5, M(0xd8d2c4, 0.85));
  edge.position.set(0, topY + 0.06, zd + 0.25);
  g.add(edge);
  // 系船柱
  [[-12], [-4], [4], [12]].forEach(([x]) => {
    const b = cyl(0.16, 0.22, 0.5, M(0x46505a, 0.6, 0.5), 12);
    b.position.set(x, topY + 0.25, zd + 1.0);
    g.add(b);
  });
}

/* ---------------- 场景注册（懒建） ---------------- */

const scenes = {};
let activeScene = null;
let skyTex = null;
function setUnderwater(on) {
  if (on) {
    scene.background = new THREE.Color(0x0d3650);
    scene.fog = new THREE.FogExp2(0x0d3650, 0.038);
  } else {
    if (skyTex) scene.background = skyTex;
    scene.fog = null;
  }
}
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

/* ============ 01 液体压强与深度 ============ */

const PRS = { depth: 12, fresh: false, showArrows: true };
function buildPressure(g) {
  // 海底与深度标尺（比例 1 单位 = 5 m）
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(70, 50), M(0xa89670, 0.95));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -13.6;
  g.add(floor);
  for (let i = 0; i < 40; i++) {
    const r = new THREE.Mesh(new THREE.DodecahedronGeometry(0.18 + Math.random() * 0.3, 0), M(0x8f8878, 0.9));
    r.position.set((Math.random() - 0.5) * 50, -13.4 + 0.15, (Math.random() - 0.5) * 30);
    g.add(r);
  }
  const ruler = new THREE.Group();
  const rulerLine = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 12, 6), M(0xf2e2b8, 0.6));
  rulerLine.position.set(6.2, -6.8, 0);
  ruler.add(rulerLine);
  for (let m = 0; m <= 60; m += 10) {
    const tick = box(0.35, 0.03, 0.03, M(0xf2e2b8, 0.6));
    tick.position.set(6.2 - 0.175, -m / 5, 0);
    ruler.add(tick);
    const t = lbl(m + ' m', '#f2e2b8', 0.0042);
    t.position.set(7.0, -m / 5, 0);
    ruler.add(t);
  }
  g.add(ruler);
  // 深潜器
  const sub = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.55, 1.5, 8, 18), M(0xf0b429, 0.5, 0.3));
  body.rotation.z = Math.PI / 2;
  const tower = box(0.5, 0.4, 0.28, M(0xd89a1d, 0.5, 0.3));
  tower.position.y = 0.62;
  const win = box(0.42, 0.2, 0.3, M(0x9adfff, 0.2));
  win.position.set(0, 0.66, 0.02);
  const prop = cyl(0.18, 0.28, 0.16, M(0x7a5010, 0.5, 0.5), 8);
  prop.rotation.z = Math.PI / 2;
  prop.position.x = -1.28;
  sub.add(body, tower, win, prop);
  g.add(sub);
  PRS.sub = sub;
  PRS.arrows = [];
  for (let i = 0; i < 4; i++) { const a = makeArrow(0x8fd3ff); g.add(a); PRS.arrows.push(a); }
  const top = makeArrow(0xc9a2ff); g.add(top); PRS.top = top;
  const bot = makeArrow(0x7dffc4); g.add(bot); PRS.bot = bot;
  buildWater(g, 64, 48);
  updPressure();
}
function updPressure() {
  const rho = PRS.fresh ? 1000 : 1030;
  const d = PRS.depth;
  const p = rho * G * d;            // Pa
  const y = -d / 5 - 0.4;
  PRS.sub.position.set(-1.5, y, 0);
  PRS.sub.rotation.z = Math.sin(performance.now() * 0.0006) * 0.04;
  const show = PRS.showArrows && d > 0.3;
  const L = clamp(0.5 + d / 22, 0.5, 2.2);
  const dirs = [[1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1]];
  PRS.arrows.forEach((a, i) => {
    if (!show) { a.hide(); return; }
    const dv = new THREE.Vector3(...dirs[i]);
    const end = i < 2 ? 1.85 : 1.15;         // x 向艇身更长
    const from = new THREE.Vector3(-1.5, y, 0).addScaledVector(dv, end + L + 0.4);
    a.set(from, new THREE.Vector3(-1.5, y, 0).addScaledVector(dv, end), 'p=' + (p / 1000).toFixed(0) + ' kPa');
  });
  if (!show) { PRS.top.hide(); PRS.bot.hide(); }
  else {
    PRS.top.set(new THREE.Vector3(-1.5, y - 1.6 - L * 0.55, 0), new THREE.Vector3(-1.5, y - 0.85, 0), '向下的压强');
    PRS.bot.set(new THREE.Vector3(-1.5, y + 1.0 + L * 0.75, 0), new THREE.Vector3(-1.5, y + 0.62, 0), '向上的压强');
  }
  hset('p', (p / 1000).toFixed(1) + ' kPa');
  hset('rho', rho + ' kg/m³');
  hset('d', d.toFixed(0) + ' m');
  hset('note', d < 0.3 ? '液面处（h≈0）压强≈0' : 'p=ρgh，随深度线性增大');
}

/* ============ 02 连通器：船闸 ============ */

const LOCK = { step: 0, level: 0, anim: -1 };
function buildLock(g) {
  buildQuay(g, 4.2, 7.5, 60, 14);
  const wallMat = concreteMat;
  // 闸室两侧墙（沿 x 走向，宽 3）
  const wl = box(10, 3.4, 0.5, wallMat); wl.position.set(0, 1.7, -1.75); g.add(wl);
  const wr = box(10, 3.4, 0.5, wallMat); wr.position.set(0, 1.7, 1.75); g.add(wr);
  // 上、下游闸门（可升降板）
  const gateU = box(0.4, 3.2, 2.9, M(0x6e7b86, 0.6, 0.4)); gateU.position.set(4.8, 1.4, 0); g.add(gateU);
  const gateD = box(0.4, 3.2, 2.9, M(0x6e7b86, 0.6, 0.4)); gateD.position.set(-4.8, 1.4, 0); g.add(gateD);
  LOCK.gateU = gateU; LOCK.gateD = gateD;
  // 上游高水位水体（左外侧）与下游低水位（右外侧）
  const wUp = box(14, 2.6, 3.4, new THREE.MeshPhysicalMaterial({ color: 0x2f7bb5, transparent: true, opacity: 0.75, roughness: 0.2 }));
  wUp.position.set(13.5, 1.3, 0); g.add(wUp);
  LOCK.wUp = wUp;
  // 闸室水体（水位动画）
  const chamber = box(9.0, 1.0, 3.0, new THREE.MeshPhysicalMaterial({ color: 0x3385c2, transparent: true, opacity: 0.72, roughness: 0.2 }));
  g.add(chamber);
  LOCK.chamber = chamber;
  buildWater(g, 24, 4.6, 0, 0.75).position.x = -13.5;
  // 船
  const boat = buildBarge(0x3f7f5f);
  g.add(boat);
  LOCK.boat = boat;
  LOCK.tags = {
    up: lbl('上游（高位）', '#bfe3ff', 0.005),
    down: lbl('下游（低位）', '#bfe3ff', 0.005),
    ch: lbl('闸室', '#ffe1a8', 0.005),
  };
  LOCK.tags.up.position.set(13.5, 3.4, 0);
  LOCK.tags.down.position.set(-14, 1.5, 0);
  LOCK.tags.ch.position.set(0, 4.6, 0);
  g.add(LOCK.tags.up, LOCK.tags.down, LOCK.tags.ch);
  LOCK.valveU = lbl('▲ 阀门', '#7dffc4', 0.0045);
  LOCK.valveU.position.set(6.4, 3.9, 0);
  g.add(LOCK.valveU);
  LOCK.stageLbl = lbl('', '#ffffff', 0.006);
  LOCK.stageLbl.position.set(0, -2.4, 0);
  g.add(LOCK.stageLbl);
  setLockStep(0, true);
}
const LOCK_STEPS = [
  '船从下游驶入闸室，下游闸门关闭',
  '打开上游阀门：闸室与上游构成连通器，水位升高',
  '闸室水位与上游相平，打开上游闸门',
  '船驶出闸室，进入上游航道',
  '回程反向操作：放水到下游水位，船驶向下游',
];
function setLockStep(i, instant = false) {
  LOCK.step = clamp(i, 0, 4);
  if (instant) LOCK.level = LOCK.step === 0 ? 0 : LOCK.step >= 2 ? 2.6 : 0;
  LOCK.anim = -1;
  setSpriteText(LOCK.stageLbl, (LOCK.step + 1) + '．' + LOCK_STEPS[LOCK.step], { fontSize: 32, color: '#ffffff', scale: 0.006, bg: 'rgba(12,18,26,0.66)' });
  hset('stage', (LOCK.step + 1) + ' / 5');
  hset('desc', LOCK_STEPS[LOCK.step]);
  hset('princ', LOCK.step === 1 ? '连通器：静止时各容器液面相平' : '闸室水位 ' + (2.6).toFixed(1) + ' m 级差中的 ' + LOCK.level.toFixed(1) + ' m');
  layoutLock();
}
function layoutLock() {
  const lv = LOCK.level;
  LOCK.chamber.scale.y = Math.max(lv, 0.001);
  LOCK.chamber.position.y = lv / 2;
  const boatFloat = Math.max(lv - 0.35, 0.28);
  const out = LOCK.step >= 3;
  LOCK.boat.position.set(out ? 10.5 : 0, boatFloat, 0);
  LOCK.gateU.position.y = LOCK.step >= 2 ? 4.6 : 1.4;
  LOCK.gateD.position.y = LOCK.step >= 1 ? 4.6 : 1.4;
  LOCK.valveU.visible = LOCK.step === 1;
}

/* ============ 03 浮力的成因 ============ */

const CUBE = { size: 1.2, depth: 0.5, showNum: true, sealed: false };
function buildCube(g) {
  // 玻璃水箱
  const glass = new THREE.MeshPhysicalMaterial({ color: 0xbfe4f5, transparent: true, opacity: 0.16, roughness: 0.05, side: THREE.DoubleSide });
  const tank = new THREE.Mesh(new THREE.BoxGeometry(5, 3.4, 4), glass);
  tank.position.y = 1.7 - 2.2;   // 箱底 -2.2，水面 0
  g.add(tank);
  const rim = new THREE.Mesh(new THREE.BoxGeometry(5.1, 0.08, 4.1), M(0x8fa3ad, 0.5, 0.4));
  rim.position.y = 1.24;
  g.add(rim);
  buildWater(g, 4.96, 3.96, 0, 0.5);
  // 立方体（半透明，能看见上下表面）
  const cubeMat = new THREE.MeshPhysicalMaterial({ color: 0xd7b56d, transparent: true, opacity: 0.44, roughness: 0.3 });
  const cube = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), cubeMat);
  g.add(cube);
  CUBE.cube = cube;
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)), new THREE.LineBasicMaterial({ color: 0xffd166 }));
  cube.add(edges);
  CUBE.aTop = makeArrow(0xc9a2ff); g.add(CUBE.aTop);
  CUBE.aBot = makeArrow(0x7dffc4); g.add(CUBE.aBot);
  CUBE.aSide = [];
  for (let i = 0; i < 2; i++) { const a = makeArrow(0x9fb4c4); g.add(a); CUBE.aSide.push(a); }
  updCube();
}
function updCube() {
  const a = CUBE.size;                      // 棱长 m
  CUBE.cube.scale.setScalar(a);
  const topY = -CUBE.depth;                 // 上表面深度（正值=在水下）
  const botY = topY - a;
  CUBE.cube.position.set(0, topY - a / 2, 0);
  const pTop = Math.max(-topY, 0) * 9800;   // Pa（顶面在水下才有）
  const pBot = CUBE.sealed ? 0 : Math.max(-botY, 0) * 9800;   // 底面陷进淤泥：下面没有水
  const net = (pBot - pTop) * a * a;
  const visible = CUBE.showNum;
  // 顶面箭头（下压）
  if (pTop > 50) {
    const L = clamp(pTop / 12000, 0.25, 1.6);
    CUBE.aTop.set(new THREE.Vector3(0, topY - L - 0.05, 0), new THREE.Vector3(0, topY, 0), visible ? 'p顶=' + (pTop / 1000).toFixed(1) + ' kPa' : '');
  } else CUBE.aTop.hide();
  // 底面箭头（上托）
  const Lb = clamp(pBot / 12000, 0.3, 2.2);
  if (pBot > 50) CUBE.aBot.set(new THREE.Vector3(0, botY + Lb + 0.05, 0), new THREE.Vector3(0, botY, 0), visible ? 'p底=' + (pBot / 1000).toFixed(1) + ' kPa' : '');
  else CUBE.aBot.hide();
  // 侧面一对（前后方向），说明侧向抵消
  const Ls = clamp((pTop + pBot) / 2 / 14000, 0.2, 1.2);
  CUBE.aSide[0].set(new THREE.Vector3(0, (topY + botY) / 2, -Ls - a / 2 - 0.05), new THREE.Vector3(0, (topY + botY) / 2, -a / 2), '侧面相互抵消');
  CUBE.aSide[1].set(new THREE.Vector3(0, (topY + botY) / 2, Ls + a / 2 + 0.05), new THREE.Vector3(0, (topY + botY) / 2, a / 2), '');
  hset('ptop', pTop > 50 ? (pTop / 1000).toFixed(1) + ' kPa' : '0（露出水面）');
  hset('pbot', CUBE.sealed ? '0（底面无水）' : (pBot / 1000).toFixed(1) + ' kPa');
  hset('fb', CUBE.sealed ? '0！底面没有水向上托' : (net / 1000).toFixed(2) + ' kN');
  hset('arch', CUBE.sealed ? '陷进淤泥/贴死容器底 → 无浮力（桥墩同理）' : 'F浮=(p底−p顶)·S=' + (net / 1000).toFixed(2) + ' kN');
}

/* ============ 04 称重法测浮力 ============ */

const WEI = { vol: 1, frac: 0, rhoObj: 2400, dipping: null };
function buildWeigh(g) {
  buildQuay(g, 2.6, 6, 60, 14);
  // 吊车：立柱在码头后沿，吊臂沿 z 伸向水面
  const post = cyl(0.22, 0.28, 5.2, M(0xc2743a, 0.6), 14); post.position.set(-1.2, 2.6 + 2.6, 6.8); g.add(post);
  const jib = box(0.24, 0.24, 5.4, M(0xc2743a, 0.6)); jib.position.set(-1.2, 2.6 + 5.05, 4.2); g.add(jib);
  const tie = makeRope(0x888c92, 0.03); tie.set(new THREE.Vector3(-1.2, 2.6 + 5.15, 6.8), new THREE.Vector3(-1.2, 2.6 + 5.05, 1.6)); g.add(tie);
  const winch = box(0.4, 0.4, 0.4, M(0x4a4e54, 0.5, 0.6)); winch.position.set(-1.2, 2.6 + 4.75, 2.0); g.add(winch);
  // 吊索 + 测力计 + 混凝土块
  WEI.cable = makeRope(0xd8ccb0, 0.03); g.add(WEI.cable);
  const gauge = new THREE.Group();
  const gc = cyl(0.22, 0.22, 0.1, M(0xd8dcE0, 0.4, 0.6), 20);
  gc.rotation.x = Math.PI / 2;
  gauge.add(gc);
  g.add(gauge);
  WEI.gauge = gauge;
  WEI.gaugeLbl = lbl('', '#ffb46e', 0.005);
  g.add(WEI.gaugeLbl);
  const blkMat = M(0xa8a8a2, 0.92);
  const blk = box(1, 1, 1, blkMat);
  g.add(blk);
  WEI.blk = blk;
  buildWater(g, 64, 48);
  updWeigh();
}
function updWeigh() {
  const V = WEI.vol;                        // m³
  const subF = WEI.frac;                    // 浸没体积比例
  const rhoW = 1030;
  const mObj = WEI.rhoObj * V;
  const Gt = mObj * G;
  const Fb = rhoW * G * V * subF;
  const Fshow = Gt - Fb;
  const waterY = 0;
  const topY = 2.2 - WEI.frac * 2.9;        // 块顶高度：从水上降到水下
  const blkSize = Math.cbrt(V);
  WEI.blk.scale.setScalar(blkSize);
  WEI.blk.position.set(-1.2, topY - blkSize / 2, 2);
  const hookY = topY + 0.35;
  WEI.cable.set(new THREE.Vector3(-1.2, 2.6 + 4.55, 2.0), new THREE.Vector3(-1.2, hookY + 0.28, 2.0));
  WEI.gauge.position.set(-1.2, hookY + 0.15, 2);
  WEI.gaugeLbl.position.set(-1.2, hookY + 0.62, 2);
  setSpriteText(WEI.gaugeLbl, '示重 ' + Fshow.toFixed(0) + ' N', { fontSize: 30, color: '#ffb46e', scale: 0.005, bg: 'rgba(12,18,26,0.66)' });
  hset('g', Gt.toFixed(0) + ' N');
  hset('f', Fshow.toFixed(0) + ' N');
  hset('fb', Fb.toFixed(0) + ' N');
  hset('v', 'V排=' + (V * subF).toFixed(2) + ' m³');
}

/* ============ 05 阿基米德原理（溢水杯） ============ */

const ARCH = { vol: 0.5, kind: 'stone', dipped: 0, dipping: null };
function buildArch(g) {
  // 实验桌
  const table = box(7, 0.16, 3.4, M(0x9a7854, 0.85)); table.position.set(0, 1.1, 0); g.add(table);
  [[-3.1, -1.4], [-3.1, 1.4], [3.1, -1.4], [3.1, 1.4]].forEach(([x, z]) => {
    const leg = cyl(0.07, 0.09, 1.05, M(0x8a6a48, 0.85), 10);
    leg.position.set(x, 0.52, z); g.add(leg);
  });
  // 溢水杯：圆筒 + 溢水嘴
  const glass = new THREE.MeshPhysicalMaterial({ color: 0xcfe9f5, transparent: true, opacity: 0.2, roughness: 0.05 });
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 1.7, 28, 1, true), glass);
  cup.position.set(-1.4, 1.18 + 0.85, 0);
  g.add(cup);
  const cupBottom = cyl(0.85, 0.85, 0.06, glass, 28); cupBottom.position.set(-1.4, 1.21, 0); g.add(cupBottom);
  const spout = cyl(0.09, 0.09, 0.5, glass, 10);
  spout.rotation.z = Math.PI / 2.6;
  spout.position.set(-0.72, 2.62, 0);
  g.add(spout);
  ARCH.spout = spout;
  // 杯内水（满到溢水口）
  ARCH.cupWater = cyl(0.8, 0.8, 1.55, new THREE.MeshPhysicalMaterial({ color: 0x3d8ec9, transparent: true, opacity: 0.6, roughness: 0.15 }), 24);
  ARCH.cupWater.position.set(-1.4, 1.24 + 0.78, 0);
  g.add(ARCH.cupWater);
  // 小烧杯（接水）
  const beak = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.48, 1.0, 22, 1, true), glass);
  beak.position.set(1.3, 1.18 + 0.5, 0);
  g.add(beak);
  ARCH.beakWater = cyl(0.5, 0.44, 0.01, new THREE.MeshPhysicalMaterial({ color: 0x3d8ec9, transparent: true, opacity: 0.6, roughness: 0.15 }), 22);
  ARCH.beakWater.position.set(1.3, 1.26, 0);
  g.add(ARCH.beakWater);
  // 流下的水柱
  ARCH.stream = cyl(0.045, 0.06, 1, new THREE.MeshPhysicalMaterial({ color: 0x6fb8e8, transparent: true, opacity: 0.75, roughness: 0.1 }), 8);
  ARCH.stream.geometry.translate(0, 0.5, 0);
  ARCH.stream.position.set(-0.38, 2.42, 0);
  ARCH.stream.rotation.z = 0.28;
  ARCH.stream.visible = false;
  g.add(ARCH.stream);
  // 物体 + 吊绳
  ARCH.obj = new THREE.Mesh(new THREE.DodecahedronGeometry(1, 0), M(0x8f8878, 0.9));
  ARCH.obj.scale.setScalar(0.42);
  g.add(ARCH.obj);
  ARCH.rope = makeRope(); g.add(ARCH.rope);
  const stand = box(0.08, 2.6, 0.08, M(0x6f747b, 0.5, 0.6)); stand.position.set(-1.4, 1.18 + 1.3, -0.9); g.add(stand);
  const armB = box(0.08, 0.08, 1.0, M(0x6f747b, 0.5, 0.6)); armB.position.set(-1.4, 1.18 + 2.55, -0.4); g.add(armB);
  updArch();
}
function updArch() {
  const V = ARCH.vol;
  const kind = ARCH.kind;
  const rhoObj = kind === 'stone' ? 2600 : kind === 'wood' ? 600 : 2700;
  const t = ARCH.dipped;                     // 0..1 浸入过程
  const objR = 0.42 * Math.cbrt(V / 0.5);
  const objY = lerp(4.4, 1.24 + 1.1, t);     // 从高处降到杯内
  ARCH.obj.position.set(-1.4, objY, 0);
  ARCH.obj.scale.setScalar(objR);
  ARCH.rope.set(new THREE.Vector3(-1.4, 3.73, 0.1), new THREE.Vector3(-1.4, objY + objR, 0));
  const submerged = kind === 'wood' ? clamp(rhoObj / 1000, 0, 1) : 1;
  const Vdisp = kind === 'wood' ? V * submerged * (t > 0.85 ? 1 : 0) : V * (t > 0.85 ? 1 : 0);
  const Fb = 1000 * 9.8 * Vdisp;
  const Gdisp = Fb;
  const isFloat = kind === 'wood';
  ARCH.stream.visible = t > 0.55 && t < 0.98;
  const bwH = clamp(Vdisp / 0.75, 0.001, 0.9);
  ARCH.beakWater.scale.y = Math.max(bwH, 0.001);
  ARCH.beakWater.position.y = 1.26 + bwH / 2;
  const Gobj = rhoObj * V * 9.8;
  hset('fb', Fb.toFixed(1) + ' N');
  hset('gdisp', Gdisp.toFixed(1) + ' N');
  hset('eq', Fb > 0 ? 'F浮 = G排 ✓（' + Fb.toFixed(1) + ' = ' + Gdisp.toFixed(1) + '）' : '把物体压入溢水杯试试');
  hset('note', isFloat ? '木块漂浮：F浮 = G木，排开的水更少' : (kind === 'stone' ? '石块密度大于水，浸没下沉' : '铝块浸没：V排 = 物体体积'));
}

/* ============ 06 浮沉条件：潜艇 ============ */

const SUB = { fill: 20, depth: 0, diving: null, jumpy: false };
function buildSub(g) {
  buildQuay(g, 2.6, 7, 60, 14);
  const seaFloor = new THREE.Mesh(new THREE.PlaneGeometry(70, 40), M(0xa89670, 0.95));
  seaFloor.rotation.x = -Math.PI / 2;
  seaFloor.position.y = -8.6;
  g.add(seaFloor);
  const sub = new THREE.Group();
  const hull = new THREE.Mesh(new THREE.CapsuleGeometry(0.8, 4.2, 10, 22), M(0x4b5563, 0.55, 0.35));
  hull.rotation.z = Math.PI / 2;
  const tower = box(1.1, 0.7, 0.5, M(0x3c4450, 0.6, 0.35));
  tower.position.y = 0.95;
  const fin = box(0.5, 1.1, 0.14, M(0x3c4450, 0.6, 0.35));
  fin.position.set(-2.6, 0.5, 0);
  const per = cyl(0.04, 0.04, 1.2, M(0x22262c, 0.5, 0.6), 8); per.position.set(0.2, 1.7, 0);
  sub.add(hull, tower, fin, per);
  g.add(sub);
  SUB.sub = sub;
  const tankLbl = lbl('', '#ffd166', 0.005);
  g.add(tankLbl);
  SUB.tankLbl = tankLbl;
  // 压载水舱示意（半透明外壳层）
  const tank = new THREE.Mesh(new THREE.CapsuleGeometry(0.92, 4.3, 10, 22),
    new THREE.MeshPhysicalMaterial({ color: 0x3d8ec9, transparent: true, opacity: 0, roughness: 0.3 }));
  tank.rotation.z = Math.PI / 2;
  sub.add(tank);
  SUB.tank = tank;
  buildWater(g, 64, 44);
  updSub();
}
function updSub() {
  const rhoSub = 900 + SUB.fill * 2;         // 注水 0→100 ⇒ 900→1100
  // 密度跃层（"海中断崖"）：60 m 以下海水密度骤降，浮力跟着变小，悬浮的潜艇会急速掉深
  const rhoW = SUB.jumpy && SUB.depth < -2 ? 980 : 1030;
  let targetY, status;
  if (rhoSub < rhoW - 15) {
    const frac = rhoSub / rhoW;              // 吃水比例
    targetY = 0.85 - frac * 1.5;
    status = '漂浮（ρ潜 < ρ水）';
  } else if (rhoSub > rhoW + 15) {
    targetY = -7.6;
    status = SUB.jumpy && rhoSub < 1030 - 15 ? '⚠ 掉深！跃层下方浮力骤减（海中断崖）' : '下潜坐底（ρ潜 > ρ水）';
  } else {
    targetY = -3.2;
    status = '悬浮（ρ潜 ≈ ρ水）';
  }
  SUB.depth += (targetY - SUB.depth) * 0.04;
  const bob = SUB.depth > -1 ? waveH(0, 0, performance.now() * 0.001) * 0.5 : 0;
  SUB.sub.position.set(0, SUB.depth + bob, 0);
  SUB.sub.rotation.x = Math.sin(performance.now() * 0.0007) * 0.02;
  SUB.tank.material.opacity = SUB.fill / 220;
  SUB.tankLbl.position.set(2.6, SUB.sub.position.y + 1.6, 0);
  setSpriteText(SUB.tankLbl, '水舱注水 ' + SUB.fill + '%', { fontSize: 30, color: '#ffd166', scale: 0.005, bg: 'rgba(12,18,26,0.66)' });
  hset('rho', rhoSub.toFixed(0) + ' kg/m³');
  hset('rw', rhoW + ' kg/m³' + (SUB.jumpy ? '（跃层下 980）' : ''));
  hset('st', status);
  hset('y', (SUB.sub.position.y * 3).toFixed(1) + ' m（示意）');
}

/* ============ 07 轮船与载重线 ============ */

const SHIP = { n: 4, fresh: false, draft: 1.5, wave: true };
const SHIP_T = { empty: 60, boxT: 15, A: 40, hullD: 4.2, limit: 3.4 };  // 空载吨/每箱吨/水线面积 m²/型深/载重线吃水
function buildBarge(color = 0x35608f) {
  const ship = new THREE.Group();
  const hullMat = M(color, 0.6, 0.25);
  const hull = box(12, 2.2, 4, hullMat);
  hull.position.y = 0.4;
  const bowShape = new THREE.Shape();
  bowShape.moveTo(-1.4, -1.9); bowShape.lineTo(0, 0); bowShape.lineTo(1.4, 0); bowShape.lineTo(1.4, -1.9); bowShape.closePath();
  const bowGeo = new THREE.ExtrudeGeometry(bowShape, { depth: 2.2, bevelEnabled: false });
  bowGeo.rotateY(Math.PI / 2);
  bowGeo.translate(6, 1.5, 0);
  const bow = new THREE.Mesh(bowGeo, hullMat);
  const deck = box(12.2, 0.14, 4.2, M(0x8f4a3a, 0.8));
  deck.position.y = 1.55;
  const house = box(1.6, 1.4, 3.2, M(0xe8e4da, 0.7));
  house.position.set(-5, 2.4, 0);
  const funnel = cyl(0.28, 0.34, 1.0, M(0xc2743a, 0.7), 12);
  funnel.position.set(-5.4, 3.5, 0);
  ship.add(hull, bow, deck, house, funnel);
  // 吃水标尺（左舷）
  for (let m = 1; m <= 4; m++) {
    const t = lbl(m + 'm', '#f2e2b8', 0.0032);
    t.position.set(-2 - (m % 2) * 1.2, 1.55 - m, 2.06);
    ship.add(t);
    const tickM = box(0.5, 0.035, 0.02, M(0xf2e2b8, 0.6));
    tickM.position.set(-1.0, 1.55 - m, 2.02);
    ship.add(tickM);
  }
  // 载重线标志（圆圈 + 线）
  const plim = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.05, 8, 24), M(0xe86a5a, 0.5));
  plim.position.set(1.6, 1.55 - SHIP_T.limit, 2.05);
  const plimLine = box(0.9, 0.06, 0.02, M(0xe86a5a, 0.5));
  plimLine.position.set(1.6, 1.55 - SHIP_T.limit, 2.04);
  const plimLbl = lbl('载重线', '#ff9a8a', 0.0032);
  plimLbl.position.set(1.6, 2.35, 2.05);
  ship.add(plim, plimLine, plimLbl);
  ship.userData.containers = [];
  const contColors = [0xc0563e, 0x3f7f5f, 0x4a6fa5, 0xc2913a, 0x7a5ba0];
  for (let i = 0; i < 14; i++) {
    const c = box(2.4, 1.0, 1.7, M(contColors[i % 5], 0.7));
    const row = Math.floor(i / 5), col = i % 5;
    c.position.set(-2.4 + col * 1.05, 2.15 + row * 1.04, 0);
    c.visible = false;
    ship.add(c);
    ship.userData.containers.push(c);
  }
  return ship;
}
function buildShip(g) {
  buildQuay(g, 2.6, 8, 60, 14);
  g.add(buildBarge(0x35608f));
  SHIP.ship = g.children[g.children.length - 1];
  buildWater(g, 64, 48);
  updShip();
}
function updShip() {
  const totalT = SHIP_T.empty + SHIP.n * SHIP_T.boxT;
  const rhoW = SHIP.fresh ? 1000 : 1030;
  const draft = totalT * 1000 / (rhoW * SHIP_T.A);        // m
  SHIP.draft += (draft - SHIP.draft) * 0.06;
  const ship = SHIP.ship;
  const conts = ship.userData.containers;
  conts.forEach((c, i) => { c.visible = i < SHIP.n; });
  const over = SHIP.draft > SHIP_T.limit;
  ship.position.y = 1.55 - SHIP.draft + (SHIP.wave ? waveH(0, 0, performance.now() * 0.001) * 0.35 : 0);
  ship.rotation.z = Math.sin(performance.now() * 0.0006) * (SHIP.wave ? 0.012 : 0);
  ship.rotation.x = Math.cos(performance.now() * 0.0005) * (SHIP.wave ? 0.018 : 0);
  hset('w', totalT.toFixed(0) + ' t');
  hset('disp', '排水 ' + totalT.toFixed(0) + ' t（=自重）');
  hset('draft', SHIP.draft.toFixed(2) + ' m');
  hset('safe', over ? '⚠ 低于载重线，超载危险！' : '吃水在载重线之上，安全');
}

/* ============ 08 密度计 ============ */

const HYD = { liquid: 1030, showScale: true };
function buildHydrometer(g) {
  const table = box(8, 0.16, 3.2, M(0x9a7854, 0.85)); table.position.set(0, 1.5, 0); g.add(table);
  [[-3.6, -1.2], [-3.6, 1.2], [3.6, -1.2], [3.6, 1.2]].forEach(([x, z]) => {
    const leg = cyl(0.07, 0.09, 1.45, M(0x8a6a48, 0.85), 10);
    leg.position.set(x, 0.72, z); g.add(leg);
  });
  const glass = new THREE.MeshPhysicalMaterial({ color: 0xcfe9f5, transparent: true, opacity: 0.2, roughness: 0.05 });
  HYD.cups = [];
  HYD.meters = [];
  const conf = [
    { x: -2.2, rho: 1000, name: '淡水' },
    { x: 2.2, rho: HYD.liquid, name: '待测液体' },
  ];
  conf.forEach((c) => {
    const beak = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 0.95, 2.6, 26, 1, true), glass);
    beak.position.set(c.x, 1.58 + 1.3, 0);
    g.add(beak);
    const water = cyl(0.98, 0.9, 2.2, new THREE.MeshPhysicalMaterial({ color: 0x3d8ec9, transparent: true, opacity: 0.55, roughness: 0.15 }), 26);
    water.position.set(c.x, 1.62 + 1.1, 0);
    g.add(water);
    // 密度计：球泡 + 细杆（刻度上小下大、上疏下密——浸入深度 h ∝ 1/ρ）
    const m = new THREE.Group();
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.3, 18, 14), M(0xe8e2d2, 0.3));
    bulb.position.y = 0.15;
    const stem = cyl(0.055, 0.055, 1.7, M(0xe8e2d2, 0.3), 12);
    stem.position.y = 1.05;
    m.add(bulb, stem);
    for (const rho of [800, 1000, 1200, 1400]) {
      const hMark = 1.05 * (1000 / rho);   // 液面所在杆高（与 updHyd 同一公式）
      const mark = new THREE.Mesh(new THREE.TorusGeometry(0.058, 0.008, 6, 14), M(0xc2743a, 0.5));
      mark.rotation.x = Math.PI / 2;
      mark.position.y = hMark;
      m.add(mark);
      const num = lbl(String(rho), '#c2743a', 0.0026);
      num.position.set(0.22, hMark, 0);
      m.add(num);
    }
    g.add(m);
    HYD.cups.push({ water, beak });
    HYD.meters.push(m);
  });
  HYD.tags = [lbl('淡水 ρ=1000', '#bfe3ff', 0.0042), lbl('待测液体', '#ffe1a8', 0.0042)];
  HYD.tags[0].position.set(-2.2, 4.6, 0);
  HYD.tags[1].position.set(2.2, 4.6, 0);
  g.add(HYD.tags[0], HYD.tags[1]);
  updHyd();
}
function updHyd() {
  // 教学口径：漂浮时 F浮=m·g 一定，ρ↑ → V排↓ → 浸入线沿杆下移（浮得高）
  // 液面所在杆高：lineLocal = 1.05 × (1000/ρ)，与杆上非均匀刻度同一公式
  const conf = [
    { rho: 1000, x: -2.2 },
    { rho: HYD.liquid, x: 2.2 },
  ];
  conf.forEach((c, i) => {
    const surfaceY = 1.62 + 2.2;
    const lineLocal = clamp(1.05 * (1000 / c.rho), 0.5, 1.66);
    HYD.meters[i].position.set(c.x, surfaceY - lineLocal - 0.15, 0);
    if (i === 1) {
      hset('read', '液面停在 ρ=' + HYD.liquid + ' 刻度附近');
      hset('rho2', HYD.liquid + ' kg/m³');
      hset('deep', (1000 / HYD.liquid * 100).toFixed(1) + ' % 浸入（相对淡水）');
      hset('law', '刻度上小下大、上疏下密（h∝1/ρ，不均匀）');
      setSpriteText(HYD.tags[1], '待测 ρ=' + HYD.liquid, { fontSize: 30, color: '#ffe1a8', scale: 0.0042, bg: 'rgba(12,18,26,0.6)' });
    }
  });
}

/* ============ HUD ============ */

let hud = null;
function setHUD(rows) {
  if (hud) hud.el.remove();
  hud = makeHUD(stage, rows);
  hud.el.style.cssText = 'position:absolute;top:14px;right:14px;z-index:10;min-width:210px;';
  rows.forEach(([k]) => hud.set(k, '–'));
}
function hset(key, text) { if (hud) hud.set(key, text); }

/* ============ 控制条与章节 ============ */

const ctl = createControlsPanel(document.getElementById('controls'));
let quizCleanup = null;

function pressureCtl() {
  ctl.clear();
  ctl.slider({ label: '深度', min: 0, max: 60, step: 1, value: PRS.depth, fmt: (v) => v + ' m', onInput: (v) => { PRS.depth = v; updPressure(); } });
  ctl.sep();
  const btns = [];
  const paint = () => btns.forEach(({ b, v }) => b.classList.toggle('active', (v === 'sea') !== PRS.fresh));
  [['fresh', '淡水'], ['sea', '海水']].forEach(([v, t]) => {
    const b = ctl.button({ label: t, onClick: () => { PRS.fresh = v === 'fresh'; paint(); updPressure(); } });
    btns.push({ b, v });
  });
  paint();
  ctl.toggle({ label: '压强箭头', value: true, onChange: (v) => { PRS.showArrows = v; updPressure(); } });
  setHUD([['p', '该深度压强 p'], ['rho', '液体密度'], ['d', '深度 h'], ['note', '规律']]);
  updPressure();
}
function lockCtl() {
  ctl.clear();
  ctl.button({ label: '下一步 ▸', onClick: () => setLockStep(LOCK.step + 1) });
  ctl.button({
    label: '自动播放',
    onClick(btn) {
      LOCK.auto = !LOCK.auto;
      btn.classList.toggle('active', LOCK.auto);
      btn.textContent = LOCK.auto ? '⏸ 停止' : '自动播放';
    },
  });
  ctl.button({ label: '↺ 重置', onClick() { setLockStep(0, true); } });
  setHUD([['stage', '步骤'], ['desc', '正在发生'], ['princ', '原理']]);
  setLockStep(0, true);
}
function cubeCtl() {
  ctl.clear();
  ctl.slider({ label: '棱长', min: 0.6, max: 2, step: 0.05, value: CUBE.size, fmt: (v) => v.toFixed(2) + ' m', onInput: (v) => { CUBE.size = v; updCube(); } });
  ctl.slider({ label: '上表面深度', min: -1.4, max: 2, step: 0.05, value: CUBE.depth, fmt: (v) => (v >= 0 ? v.toFixed(2) : '露出 ' + (-v).toFixed(2)) + ' m', onInput: (v) => { CUBE.depth = v; updCube(); } });
  ctl.sep();
  ctl.toggle({ label: '显示压强数值', value: true, onChange: (v) => { CUBE.showNum = v; updCube(); } });
  ctl.toggle({ label: '底面陷进淤泥', value: false, onChange: (v) => { CUBE.sealed = v; updCube(); } });
  setHUD([['ptop', '顶面压强'], ['pbot', '底面压强'], ['fb', '压力差（浮力）'], ['arch', '验证']]);
  updCube();
}
function weighCtl() {
  ctl.clear();
  ctl.slider({ label: '浸入深度比例', min: 0, max: 1, step: 0.01, value: 0, fmt: (v) => (v * 100).toFixed(0) + ' %', onInput: (v) => { WEI.frac = v; updWeigh(); } });
  ctl.slider({ label: '物块体积', min: 0.3, max: 2, step: 0.05, value: 1, fmt: (v) => v.toFixed(2) + ' m³', onInput: (v) => { WEI.vol = v; updWeigh(); } });
  const mbtns = [];
  const paintM = () => mbtns.forEach(({ b, v }) => b.classList.toggle('active', v === WEI.rhoObj));
  [[2400, '混凝土块'], [7800, '钢块']].forEach(([v, t]) => {
    const b = ctl.button({ label: t, onClick: () => { WEI.rhoObj = v; updWeigh(); paintM(); } });
    mbtns.push({ b, v });
  });
  paintM();
  ctl.sep();
  ctl.button({ label: '▼ 缓慢浸入', onClick() { if (!WEI.dipping) WEI.dipping = +1; } });
  ctl.button({ label: '▲ 提升', onClick() { if (!WEI.dipping) WEI.dipping = -1; } });
  setHUD([['g', '空气中重 G'], ['f', '水中示重 F示'], ['fb', '浮力 F浮=G−F示'], ['v', '排开水体积']]);
  updWeigh();
}
function archCtl() {
  ctl.clear();
  ctl.slider({ label: '物体体积', min: 0.2, max: 0.9, step: 0.05, value: ARCH.vol, fmt: (v) => v.toFixed(2) + ' m³', onInput: (v) => { ARCH.vol = v; updArch(); } });
  ctl.sep();
  const btns = [];
  const paint = () => btns.forEach(({ b, v }) => b.classList.toggle('active', v === ARCH.kind));
  [['stone', '石块'], ['wood', '木块'], ['alu', '铝块']].forEach(([v, t]) => {
    const b = ctl.button({ label: t, onClick: () => { ARCH.kind = v; updArch(); paint(); } });
    btns.push({ b, v });
  });
  paint();
  ctl.button({ label: '▼ 浸入', onClick() { if (!ARCH.dipping) ARCH.dipping = +1; } });
  setHUD([['fb', '物体受到的浮力'], ['gdisp', '排开水的重力 G排'], ['eq', '对比'], ['note', '说明']]);
  updArch();
}
function subCtl() {
  ctl.clear();
  ctl.slider({ label: '水舱注水', min: 0, max: 100, step: 1, value: SUB.fill, fmt: (v) => v + ' %', onInput: (v) => { SUB.fill = v; updSub(); } });
  ctl.sep();
  ctl.button({ label: '悬浮预设 65%', onClick() { SUB.fill = 65; updSub(); } });
  ctl.toggle({ label: '海水密度跃层', value: false, onChange: (v) => { SUB.jumpy = v; updSub(); } });
  ctl.button({ label: '⚠ 紧急吹除', onClick() { SUB.fill = 10; updSub(); } });
  ctl.toggle({ label: '压载水舱显示', value: true, onChange: (v) => { SUB.tank.visible = v; } });
  setHUD([['rho', '潜艇平均密度'], ['rw', '海水密度'], ['st', '状态'], ['y', '深度']]);
  updSub();
}
function shipCtl() {
  ctl.clear();
  ctl.slider({ label: '装载集装箱', min: 0, max: 14, step: 1, value: SHIP.n, fmt: (v) => v + ' 箱', onInput: (v) => { SHIP.n = v; updShip(); } });
  ctl.sep();
  const btns = [];
  const paint = () => btns.forEach(({ b, v }) => b.classList.toggle('active', (v === 'sea') !== SHIP.fresh));
  [['river', '内河（淡水）'], ['sea', '入海（海水）']].forEach(([v, t]) => {
    const b = ctl.button({ label: t, onClick: () => { SHIP.fresh = v === 'river'; paint(); updShip(); } });
    btns.push({ b, v });
  });
  paint();
  ctl.toggle({ label: '波浪', value: true, onChange: (v) => { SHIP.wave = v; updShip(); } });
  setHUD([['w', '船总重'], ['disp', '浮力=排水量'], ['draft', '吃水'], ['safe', '载重线检查']]);
  updShip();
}
function hydCtl() {
  ctl.clear();
  const btns = [];
  const paint = () => btns.forEach(({ b, v }) => b.classList.toggle('active', v === HYD.liquid));
  [[790, '酒精'], [1000, '淡水'], [1030, '海水'], [1150, '饱和盐水']].forEach(([v, t]) => {
    const b = ctl.button({ label: t, onClick: () => { HYD.liquid = v; updHyd(); paint(); } });
    btns.push({ b, v });
  });
  paint();
  setHUD([['read', '密度计读数'], ['rho2', '液体密度'], ['deep', '吃水深度'], ['law', '原理']]);
  updHyd();
}

/* ============ 随堂检测 ============ */

const QUIZ = [
  {
    q: '关于液体压强，下列说法正确的是？',
    opts: ['只与深度有关，与液体密度无关', '同种液体中，深度越大压强越大', '方向只能向上', '与容器形状有关'],
    a: 1,
    ex: 'p=ρgh：同种液体压强随深度增大；不同液体同一深度还要比密度。液体内部各个方向都有压强。',
  },
  {
    q: '浸没在水中的正方体，其浮力产生的原因是？',
    opts: ['侧面压力不平衡', '下表面受到向上的压力大于上表面向下的压力', '水的重量直接压在物体上', '物体排开了空气'],
    a: 1,
    ex: '浮力来自上下表面的压力差：F浮=F向上−F向下。侧面压力对称抵消。',
  },
  {
    q: '阿基米德原理的表达式是？',
    opts: ['F浮=G物', 'F浮=ρ液gV物（浸没时）', 'F浮=ρ物gV排', 'F浮=G排=ρ液gV排'],
    a: 3,
    ex: 'F浮=G排=ρ液·g·V排，只与液体密度和排开体积有关，与物体密度、深度无关。浸没时 V排=V物。',
  },
  {
    q: '一艘轮船从长江（淡水）驶入大海（海水），它会？',
    opts: ['下沉一些，浮力变大', '浮起一些，浮力不变', '浮起一些，浮力变小', '吃水不变'],
    a: 1,
    ex: '漂浮时浮力始终等于重力（不变）；海水密度更大，V排=F浮/(ρg) 变小，所以船浮起一些——从内河到海上吃水变浅。',
  },
  {
    q: '潜水艇实现上浮和下潜，靠的是？',
    opts: ['改变自身重力（水舱注水/排水）', '改变海水密度', '改变浸没体积（艇体无法变形）', '减小浮力'],
    a: 0,
    ex: '浸没后 V排 不变、浮力不变，潜水艇靠向压载水舱注水/吹除压缩空气来改变自重，实现浮沉。',
  },
  {
    q: '一个浸没在水中的立方体，上表面受到水向下的压力 20 N，下表面受到向上的压力 50 N，它受到的浮力是？',
    opts: ['20 N', '30 N', '50 N', '70 N'],
    a: 1,
    ex: '浮力来自上下表面的压力差：F浮 = F下 − F上 = 50 − 20 = 30 N。侧面压力对称抵消，不参与。',
  },
  {
    q: '用吊秤称一个物块：空气中读数 24 kN，浸没在水中读数 14 kN。物块受到的浮力和排开水的体积分别是（g 取 10 N/kg，ρ水=1000 kg/m³）',
    opts: ['10 kN；1 m³', '10 kN；10 m³', '24 kN；2.4 m³', '38 kN；3.8 m³'],
    a: 0,
    ex: 'F浮 = G − F示 = 24 − 14 = 10 kN；V排 = F浮/(ρ水g) = 10000/(1000×10) = 1 m³。',
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

const SECTIONS = [
  {
    id: 'pressure', title: '液体压强与深度',
    html: `<p>液体内部存在压强，方向是<b>四面八方</b>都有。大小只由<b>深度</b>和<b>液体密度</b>决定：</p>
<p><span class="hl">p = ρgh</span>（h 是从自由液面到该点的竖直距离）。</p>
<p>跟着深潜器下潜：拖动深度滑杆，看压强读数从 0 线性涨到 600 kPa 量级（每下潜 10 m 约增加一个大气压！）；切换海水/淡水比较密度的影响。同一深度，各个方向的压强<b>相等</b>。</p>`,
    enter() {
      useScene('pressure', buildPressure);
      app.setCamera([4.5, -2.2, 10.5], [-1, -2.2, 0]);
      setUnderwater(true);
      pressureCtl();
    },
  },
  {
    id: 'lock', title: '连通器：船闸',
    html: `<p>上端开口、底部连通的容器叫<b>连通器</b>：液体静止时各容器<b>液面总保持相平</b>。</p>
<p>船闸是连通器最壮观的应用：闸室先与下游构成连通器（水面齐下游），再与上游构成连通器（水面齐上游），船就能「走楼梯」翻过水位差。</p>
<p>点「下一步」逐步完成一次过闸，注意每一步哪个阀门/闸门在动、闸室水位在与谁看齐。</p>`,
    enter() {
      useScene('lock', buildLock);
      app.setCamera([0, 6.5, 17.5], [0, 1.4, 0]);
      LOCK.auto = false;
      lockCtl();
    },
  },
  {
    id: 'cube', title: '浮力的成因',
    html: `<p>浸在液体里的物体，各个面都受到液体的压力：<b>前后、左右的压力对称抵消</b>；但下表面更深、压强更大——<b>向上的压力大于向下的压力</b>。</p>
<p>这个压力差就是浮力：<span class="hl">F浮 = F向上 − F向下 = (p底 − p顶)·S</span>。</p>
<p>把立方体的「上表面深度」调到负值（露出一半）：顶面在水面上，压强为 0，浮力全部来自底面的向上压力。再整体下潜，观察上下压强都变大、但<b>差值不变</b>——浸没后浮力与深度无关。打开「底面陷进淤泥」：下面没有水向上托，浮力消失，沉箱被压在海底拔不起来——桥墩也不受浮力。</p>`,
    enter() {
      useScene('cube', buildCube);
      app.setCamera([4.2, 1.6, 8.2], [0, -0.6, 0]);
      cubeCtl();
    },
  },
  {
    id: 'weigh', title: '称重法测浮力',
    html: `<p>吊车把物块缓缓吊入海水：吊秤的读数<b>越来越小</b>。</p>
<p>物体在水中受到向上的浮力，弹簧秤的示数因此变小：<span class="hl">F浮 = G − F示</span>——这就是<b>称重法</b>，实验室里测浮力的第一手段。</p>
<p>点「缓慢浸入」观察示重随浸入体积增大而减小；完全浸没后再往下，示重不再变化（V排 不再增大）。换成<b>钢块</b>：钢块重得多，可完全浸没后浮力和混凝土块一样大——浮力只和排开液体的体积有关，与物体的轻重、材料无关。</p>`,
    enter() {
      useScene('weigh', buildWeigh);
      app.setCamera([7.0, 6.0, 10.5], [-1.2, 0.6, 2.0]);
      WEI.frac = 0; WEI.dipping = null;
      weighCtl();
    },
  },
  {
    id: 'arch', title: '阿基米德原理',
    html: `<p>溢水杯装满水，把石块缓缓压入：排开的水顺着溢水嘴流进小烧杯。</p>
<p>称一称：<b>物体受到的浮力，恰好等于它排开的水所受的重力</b>——这就是阿基米德原理：</p>
<p><span class="hl">F浮 = G排 = ρ液·g·V排</span></p>
<p>换成木块试试：木块漂浮，浸入更少、排开的水更少，但 F浮 依然等于 G排（也等于木块自重）。原理对一切浸——部分浸或全浸——的物体都成立。</p>`,
    enter() {
      useScene('arch', buildArch);
      app.setCamera([0.6, 3.6, 6.8], [-0.4, 1.8, 0]);
      ARCH.dipped = 0; ARCH.dipping = null;
      archCtl();
    },
  },
  {
    id: 'sub', title: '浮沉条件：潜艇',
    html: `<p>物体的浮沉取决于<b>自身密度与液体密度</b>的比较：ρ物&lt;ρ液 → 漂浮；ρ物=ρ液 → 悬浮；ρ物&gt;ρ液 → 下沉。</p>
<p>潜艇浸没后 V排 不变、浮力不变，它靠向<b>压载水舱</b>注水/吹除压缩空气来改变<b>自重</b>：注水变重下潜，排水变轻上浮，注到恰好等于水密度就悬停在水中。</p>
<p>打开「海水密度跃层」再悬浮试试：60 m 以下海水密度骤然变小，浮力跟着变小，悬浮的潜艇会急速「掉深」——这叫<b>海中断崖</b>。2014 年我国 372 潜艇就遭遇过，官兵紧急向水舱供气排水（点「紧急吹除」），三分钟内化险为夷。</p>`,
    enter() {
      useScene('sub', buildSub);
      app.setCamera([7.5, 3.0, 12.5], [0, -1.5, 0]);
      setUnderwater(true);
      subCtl();
    },
  },
  {
    id: 'ship', title: '轮船与载重线',
    html: `<p>轮船是空心的大「密度」智慧：钢板密度远大于水，但做成空壳后<b>平均密度小于水</b>，于是漂浮。漂浮时：</p>
<p><span class="hl">F浮 = G总</span>（排水量 = 总重）。装得越重，排开水越多，吃水越深。</p>
<p>船舷上的<b>载重线</b>（Plimsoll 标志）是安全红线：吃水不许没过它。试着装满集装箱，再切「入海」——海水密度大，同样载重吃水变浅。</p>`,
    enter() {
      useScene('ship', buildShip);
      app.setCamera([7.0, 3.6, 13.5], [0, 0.8, 0]);
      shipCtl();
    },
  },
  {
    id: 'hyd', title: '密度计与水尺计重',
    html: `<p><b>密度计</b>是一支下方装铅粒的密封玻璃浮计：漂浮时 F浮 = G（不变），所以</p>
<p><span class="hl">V排 = G / (ρ液·g)</span> —— 液体密度越大，密度计浸入越浅、浮得越高。杆上的刻度越往下数值越大，液面对着哪格，密度就是多少。</p>
<p>切换待测液体，对比两只杯里同一支密度计的吃水：酒精里沉得深，饱和盐水里浮得高。商船的「水尺计重」用的也是同一原理——看吃水算排水量。</p>`,
    enter() {
      useScene('hyd', buildHydrometer);
      app.setCamera([0, 4.2, 9.0], [0, 2.6, 0]);
      hydCtl();
    },
  },
  {
    id: 'quiz', title: '随堂检测',
    html: `<p>7 道选择题，检验一下压强与浮力的掌握情况——概念与计算都有。答完可重新开始。</p>`,
    enter() {
      useScene('ship', buildShip);
      app.setCamera([7.0, 3.6, 13.5], [0, 0.8, 0]);
      ctl.clear();
      showQuiz();
    },
  },
];

/* ============ 帧循环 ============ */

const _wp = new THREE.Vector3();
app.onFrame((dt) => {
  cameraTweenTick(app, dt);
  const t = performance.now() * 0.001;
  // 水面波浪（仅可见场景）
  for (const w of waters) {
    if (!w.mesh.parent.visible) continue;
    const pos = w.mesh.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const bx = w.base.getX(i), bz = w.base.getZ(i);
      pos.setY(i, waveH(bx + w.mesh.position.x, bz + w.mesh.position.z, t));
    }
    pos.needsUpdate = true;
  }
  // 船闸动画
  if (scenes.lock && scenes.lock.visible) {
    const target = LOCK.step === 0 ? 0 : LOCK.step >= 2 ? 2.6 : 0;
    if (LOCK.step === 1) {
      LOCK.level += (2.6 - LOCK.level) * Math.min(1, dt * 0.9);
      layoutLock();
      hset('princ', '闸室水位升至 ' + LOCK.level.toFixed(1) + ' m（上游 2.6 m）');
    }
    if (LOCK.auto) {
      LOCK.autoT = (LOCK.autoT || 0) + dt;
      if (LOCK.autoT > 2.8) { LOCK.autoT = 0; setLockStep(LOCK.step + 1 > 4 ? 0 : LOCK.step + 1); }
    }
  }
  // 称重法自动浸入
  if (scenes.weigh && scenes.weigh.visible && WEI.dipping) {
    WEI.frac = clamp(WEI.frac + WEI.dipping * dt * 0.22, 0, 1);
    if (WEI.frac <= 0 || WEI.frac >= 1) WEI.dipping = null;
    updWeigh();
  }
  // 阿基米德浸入
  if (scenes.arch && scenes.arch.visible && ARCH.dipping) {
    ARCH.dipped = clamp(ARCH.dipped + ARCH.dipping * dt * 0.35, 0, 1);
    if (ARCH.dipped <= 0 || ARCH.dipped >= 1) ARCH.dipping = null;
    updArch();
  }
  // 潜艇
  if (scenes.sub && scenes.sub.visible) updSub();
  // 轮船
  if (scenes.ship && scenes.ship.visible) updShip();
  // 深潜器姿态微动
  if (scenes.pressure && scenes.pressure.visible) updPressureLight();
});

function updPressureLight() {
  PRS.sub.rotation.z = Math.sin(performance.now() * 0.0006) * 0.04;
}

/* ============ 启动 ============ */

loadAll([
  { key: 'sky', label: '天空', job: loadTexture('../assets/textures/sky/sky_harbor-LXJSRKim.webp') },
  { key: 'quay', label: '码头', job: loadTexture('../assets/textures/pbr/quay_diff-BLAezi9L.webp', { colorSpace: null }) },
  { key: 'quayN', label: '码头细节', job: loadTexture('../assets/textures/pbr/quay_nor-BdwuX0G4.webp', { colorSpace: null }) },
], (d, t, label) => loader.setText(`正在加载港口素材 ${d}/${t}（${label}）`)).then((t) => {
  t.sky.mapping = THREE.EquirectangularReflectionMapping;
  scene.background = t.sky;
  scene.environment = t.sky;
  skyTex = t.sky;
  buildStatics(t.quay, t.quayN);

  loader.hide();
  const sections = createSections({
    nav: document.getElementById('sideNav'),
    descPanel: document.getElementById('descPanel'),
    sections: SECTIONS,
    onSelect(i, sec) {
      if (quizCleanup) { quizCleanup(); quizCleanup = null; }
      setUnderwater(false);
      sec.enter();
    },
  });
  window.__eduSections = sections;
  sections.select(0);
}).catch((err) => {
  loader.setText('资源加载失败：' + err.message);
  console.error(err);
});
