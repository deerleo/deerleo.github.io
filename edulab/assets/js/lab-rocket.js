/* EduLab · 神舟发射与返回（rocket）
 * 章节：认识长征二号F / 点火与起飞 / 冲出大气 / 抛掉包袱 / 进入轨道 /
 *       在轨飞行 / 再入大气 / 开伞着陆
 * 场景：酒泉发射场（发射塔架、山影）→ 上升段重力转弯飞行（真实参数积分）→
 *       在轨段地球轨道（地球贴图）→ 再入黑障 → 主伞+反顶着陆（东风着陆场）。
 * 全部几何程序化建模；无外部模型文件。
 */
import {
  THREE, DEG, clamp,
  loadTexture, loadAll, createApp, cameraTweenTick, makeLoader,
  createSections, createControlsPanel, makeHUD, makeTextSprite, setSpriteText,
  makeStars, makeGlowTexture, circleLine,
} from './edu-core.js';

const lerp = (a, b, t) => a + (b - a) * t;

/* ---------------- 基础 ---------------- */

const stage = document.getElementById('stage');
const loader = makeLoader(stage, '正在组装长征二号F…');
const app = createApp({
  container: stage,
  fov: 45, near: 0.1, far: 6000,
  cameraPos: [40, 22, 85], target: [0, 22, 0],
  minDistance: 3, maxDistance: 900,
  keepBackground: true,
});
const { scene, camera, controls } = app;

scene.add(new THREE.HemisphereLight(0xdfeaf5, 0x8a7a5a, 0.9));
const sun = new THREE.DirectionalLight(0xfff0d8, 2.4);
sun.position.set(-60, 90, 60);
scene.add(sun);

/* ---------------- 本实验专属样式 ---------------- */

const style = document.createElement('style');
style.textContent = `
.rkt-toast {
  position: absolute; top: 14px; left: 50%; transform: translate(-50%, -10px);
  z-index: 26; max-width: min(460px, calc(100% - 28px));
  padding: 10px 18px; border-radius: 12px; font-size: 14px; line-height: 1.6;
  background: color-mix(in srgb, var(--card) 94%, transparent);
  border: 1px solid var(--card-border); box-shadow: var(--shadow);
  color: var(--text); opacity: 0; pointer-events: none;
  transition: opacity .3s, transform .3s; text-align: center;
}
.rkt-toast.show { opacity: 1; transform: translate(-50%, 0); }
.rkt-toast.ok { border-color: color-mix(in srgb, #3fa96f 55%, transparent); }
.rkt-toast.bad { border-color: color-mix(in srgb, #d9534f 60%, transparent); color: #d0705e; }
`;
document.head.appendChild(style);

/* ---------------- 通用小件 ---------------- */

const M = (color, rough = 0.8, metal = 0) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal });
const box = (w, h, d, mat) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
const cyl = (rt, rb, h, mat, seg = 20) => new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);

function lbl(text, color = '#e8f0fa', scale = 0.05) {
  return makeTextSprite(text, { fontSize: 30, color, scale, bg: 'rgba(12,18,26,0.62)' });
}

const MU = 3.986e14;          // 地球引力常数 μ (m³/s²)
const R_E = 6.371e6;          // 地球半径 (m)
const G0 = 9.81;
const gAt = (h) => MU / Math.pow(R_E + h, 2);
const rhoAt = (h) => 1.225 * Math.exp(-Math.max(h, 0) / 7300);
const vCirc = (h) => Math.sqrt(MU / (R_E + h));

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

/* ---------------- 天空 / 星空 ---------------- */

const skyCol = new THREE.Color(0x9cc2e6);
const spaceCol = new THREE.Color(0x03060c);
const curBg = new THREE.Color();
const stars = makeStars(900, 2200);
stars.material.opacity = 0;
scene.add(stars);

/** 高度(m) → 场景纵坐标（对数压缩，保证全程可见） */
const visH = (h) => 14 * Math.pow(Math.max(h, 0) / 1000, 0.55);
/** 0(地面)→1(太空) 的天色因子 */
const skyK = (h) => clamp(visH(h) / 110, 0, 1);

/* ---------------- 长征二号F 模型 ---------------- */

const RKT = { parts: {}, flames: {}, built: false };
function buildRocket() {
  const g = new THREE.Group();
  const white = M(0xf2f4f6, 0.42);
  const white2 = M(0xdfe3e8, 0.5);
  const red = M(0xc23b2e, 0.5);
  const dark = M(0x39404a, 0.6, 0.4);

  // 一级（助推器分离后保留其下段；这里整体为可分离组）
  const s1 = new THREE.Group();
  const body1 = cyl(1.65, 1.65, 28, white, 28);
  body1.position.y = 14;
  s1.add(body1);
  const skirt = cyl(1.75, 1.65, 1.6, white2, 28);
  skirt.position.y = 0.8;
  s1.add(skirt);
  const band1 = cyl(1.66, 1.66, 1.1, red, 28);
  band1.position.y = 27.2;
  s1.add(band1);
  for (let i = 0; i < 4; i++) {
    const noz = new THREE.Mesh(new THREE.ConeGeometry(0.62, 1.5, 14, 1, true), dark);
    noz.rotation.x = Math.PI;
    noz.position.set(Math.cos(i * Math.PI / 2) * 0.9, -0.7, Math.sin(i * Math.PI / 2) * 0.9);
    s1.add(noz);
  }
  g.add(s1);

  // 二级 + 三级游机段
  const s2 = new THREE.Group();
  const body2 = cyl(1.65, 1.65, 17, white, 28);
  body2.position.y = 8.5;
  s2.add(body2);
  const inter = cyl(1.68, 1.68, 0.9, dark, 28);
  inter.position.y = 0.45;
  s2.add(inter);
  const band2 = cyl(1.66, 1.66, 0.9, M(0x2a5f9e, 0.5), 28);
  band2.position.y = 16.4;
  s2.add(band2);
  s2.position.y = 28;
  g.add(s2);

  // 整流罩（含飞船）
  const fair = new THREE.Group();
  const fc = cyl(2.1, 2.1, 5, white, 28);
  fc.position.y = 2.5;
  const tipPts = [];
  for (let i = 0; i <= 12; i++) {
    const t = i / 12;
    tipPts.push(new THREE.Vector2(2.1 * Math.sqrt(1 - t * t) * 0.92 + 0.18 * (1 - t), 5 + t * 8));
  }
  const ftip = new THREE.Mesh(new THREE.LatheGeometry(tipPts, 28), white);
  fair.add(fc, ftip);
  const bandF = cyl(2.11, 2.11, 0.8, red, 28);
  bandF.position.y = 4.6;
  fair.add(bandF);
  fair.position.y = 45;
  g.add(fair);

  // 逃逸塔
  const tower = new THREE.Group();
  const spire = cyl(0.32, 0.5, 4.5, red, 12);
  spire.position.y = 2.25;
  tower.add(spire);
  for (let i = 0; i < 4; i++) {
    const fin = box(0.1, 1.6, 0.5, red);
    fin.position.set(Math.cos(i * Math.PI / 2 + Math.PI / 4) * 0.42, 0.9, Math.sin(i * Math.PI / 2 + Math.PI / 4) * 0.42);
    fin.rotation.y = -i * Math.PI / 2 - Math.PI / 4;
    tower.add(fin);
  }
  tower.position.y = 58;
  g.add(tower);

  // 4 台助推器
  const boosters = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const b = new THREE.Group();
    const bd = cyl(1.1, 1.1, 25, white2, 20);
    bd.position.y = 12.5;
    const bt = new THREE.Mesh(new THREE.ConeGeometry(1.1, 3, 20), white2);
    bt.position.y = 26.5;
    const bnoz = new THREE.Mesh(new THREE.ConeGeometry(0.42, 1.1, 12, 1, true), dark);
    bnoz.rotation.x = Math.PI;
    bnoz.position.y = -0.5;
    const bn = cyl(1.11, 1.11, 0.8, red, 20);
    bn.position.y = 24;
    b.add(bd, bt, bnoz, bn);
    const a = i * Math.PI / 2 + Math.PI / 4;
    b.position.set(Math.cos(a) * 2.5, 0, Math.sin(a) * 2.5);
    boosters.add(b);
  }
  g.add(boosters);

  // 发动机火焰（一级 / 二级 各一组）
  function makeFlame(len, r) {
    const fg = new THREE.Group();
    const mat = new THREE.MeshBasicMaterial({ color: 0xffc36b, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false });
    const core = new THREE.Mesh(new THREE.ConeGeometry(r, len, 12, 1, true), mat);
    core.rotation.x = Math.PI;
    core.position.y = -len / 2;
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: makeGlowTexture('255,190,110'), transparent: true, opacity: 0.85,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    glow.scale.setScalar(r * 9);
    glow.position.y = -len * 0.55;
    fg.add(core, glow);
    fg.visible = false;
    return fg;
  }
  const f1 = makeFlame(11, 1.5); f1.position.y = 0; g.add(f1);
  const f2 = makeFlame(9, 1.1); f2.position.y = 28; g.add(f2);
  RKT.flames.s1 = f1; RKT.flames.s2 = f2;

  RKT.g = g;
  RKT.parts = { s1, s2, fair, tower, boosters };
  RKT.built = true;
  scene.add(g);
  return g;
}

/** 标注精灵（第 1 章用） */
function addLabels() {
  if (RKT.labels) return;
  const defs = [
    ['逃逸塔', 60, '#ff9b7a'], ['整流罩·神舟飞船', 49, '#ffd166'],
    ['二级（真空发动机）', 36, '#8fd3ff'], ['一级（4 台主机）', 15, '#b7f5a5'],
    ['助推器 ×4', 12, '#e8a0ff'],
  ];
  RKT.labels = defs.map(([t, y, c]) => {
    const s = lbl(t, c, 0.05);
    s.position.set(9.5, y, 0);
    RKT.g.add(s);
    return s;
  });
}

/* ---------------- 发射场（懒建） ---------------- */

let padMat;
function buildSite(g, tex) {
  padMat = new THREE.MeshStandardMaterial({ map: tex.slab, normalMap: tex.slabN, color: 0xc9c4bb, roughness: 0.95 });
  const groundM = new THREE.Mesh(new THREE.PlaneGeometry(1200, 1200), new THREE.MeshStandardMaterial({ map: tex.sandG, normalMap: tex.sandN, color: 0xc9b895, roughness: 1 }));
  groundM.rotation.x = -Math.PI / 2;
  g.add(groundM);
  // 发射台
  const pad = cyl(14, 16, 1.6, padMat, 36);
  pad.position.y = 0.8;
  g.add(pad);
  const plinth = box(9, 1.2, 9, M(0x8f959c, 0.9));
  plinth.position.y = 1.9;
  g.add(plinth);
  // 塔架（格构）
  const steel = M(0x5b636e, 0.7, 0.3);
  const tw = new THREE.Group();
  for (const dx of [-2.2, 2.2]) for (const dz of [-2.2, 2.2]) {
    const leg = box(0.45, 72, 0.45, steel);
    leg.position.set(dx, 36, dz - 7);
    tw.add(leg);
  }
  for (let i = 1; i <= 12; i++) {
    const arm = box(5.6, 0.3, 0.3, steel);
    arm.position.set(0, i * 6, -9.2);
    tw.add(arm);
    const brk = box(0.3, 0.3, 5.6, steel);
    brk.position.set(-2.2, i * 6, -7);
    tw.add(brk);
  }
  const boom = box(0.35, 0.35, 7.5, steel);
  boom.position.set(0, 40, -3.6);
  tw.add(boom);
  tw.position.set(0, 1.6, 0);
  g.add(tw);
  // 避雷塔
  const lt = cyl(0.35, 0.8, 90, M(0x9aa2ab, 0.6, 0.4), 10);
  lt.position.set(-26, 45, -18);
  g.add(lt);
  // 远山（岩石纹理锥体）
  for (let i = 0; i < 9; i++) {
    const a = i / 9 * Math.PI * 2 + 0.4;
    const d = 260 + (i % 3) * 90;
    const m = new THREE.Mesh(new THREE.ConeGeometry(70 + (i % 4) * 28, 46 + (i * 13) % 60, 7),
      new THREE.MeshStandardMaterial({ map: tex.rock, normalMap: tex.rockN, color: 0x9a8f80, roughness: 1 }));
    m.position.set(Math.cos(a) * d, 12, Math.sin(a) * d - 60);
    m.rotation.y = i;
    g.add(m);
  }
  // 塔架回转平台随起飞让开（装饰：起飞后塔臂摆开）
  RKT.siteBoom = boom;
}

/* ---------------- 飞行仿真（上升段，真实参数） ---------------- */

const CFG = { payload: 8.4, isp2: 300, thrustPct: 100 };
const EVENTS = [
  { t: 120, key: 'tower', name: '逃逸塔分离' },
  { t: 140, key: 'boosters', name: '助推器分离' },
  { t: 200, key: 'fair', name: '整流罩分离（h≥110 km）' },
];
const ST = {
  phase: 'idle', t: 0, speed: 6, h: 0, x: 0, v: 0, gam: 84 * DEG, m: 0,
  maxQ: 0, maxG: 0, orbit: null, done: false,
  jett: [],           // 已分离视觉件 {mesh, vel, av, key}
  fired: {}, s2burn: 0, bb: 0, bc: 0,
};
/* 分级质量账（教学简化：按公开时序标定，内部燃料量按 Δv 预算配平） */
const M2 = {
  boostProp: 156e3, boostDry: 14e3, boostT: 2931e3,   // 助推器：140 s 烧尽
  s1Prop: 176e3, s1Dry: 12.5e3, coreT: 2992e3,        // 一级：~157 s 耗尽（MECO）
  s2Prop: 128e3, s2Dry: 7e3,                          // 二级：真空发动机
  tower: 3e3, fair: 2.0e3,
};
function m0() {
  return CFG.payload * 1e3 + M2.fair + M2.tower + M2.s2Dry + M2.s1Dry + M2.boostDry
    + M2.s1Prop + M2.boostProp + M2.s2Prop;
}
/** 当前时刻推力/比冲（池子烧穿即熄火） */
function profile(t) {
  if (ST.phase !== 'run' && ST.phase !== 'pause') return { T: 0, isp: 268, k: 'none' };
  const pct = CFG.thrustPct / 100;
  if (t < 140 && ST.bb < M2.boostProp - 1 && ST.bc < M2.s1Prop - 1) {
    return { T: 5923e3 * pct, isp: 275, k: 'both', bf: M2.boostT / (M2.boostT + M2.coreT) };
  }
  if (!ST.fired.s1 && t < 470 && ST.bc < M2.s1Prop - 1) return { T: 2600e3 * pct, isp: 275, k: 'core' };
  if (ST.fired.s1 && ST.s2burn < M2.s2Prop - 500 && t < 650) return { T: 950e3, isp: CFG.isp2, k: 's2' };
  return { T: 0, isp: 300, k: 'none' };
}
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

/** 分离碎片容器（场景根，切换章节时隐藏） */
const debrisG = new THREE.Group();
scene.add(debrisG);

function resetFlight() {
  ST.phase = 'idle'; ST.t = 0; ST.h = 0; ST.x = 0; ST.v = 0;
  ST.gam = 84 * DEG; ST.maxQ = 0; ST.maxG = 0;
  ST.orbit = null; ST.done = false; ST.s2burn = 0; ST.bb = 0; ST.bc = 0;
  ST.fired = {};
  // 分离件归位（从碎片容器装回箭体）
  ST.jett.forEach((j) => {
    debrisG.remove(j.mesh);
    RKT.g.add(j.mesh);
    const home = j.mesh.userData.home;
    j.mesh.position.copy(home.pos);
    j.mesh.rotation.set(0, 0, 0);
    j.mesh.visible = true;
  });
  ST.jett = [];
  debrisG.visible = true;
  if (RKT.g) {
    RKT.g.position.set(0, 2.5, 0);
    RKT.g.rotation.set(0, 0, 0);
    RKT.flames.s1.visible = false; RKT.flames.s2.visible = false;
    if (RKT.siteBoom) RKT.siteBoom.rotation.y = 0;
  }
  smoke.forEach((s) => { s.life = 0; s.mesh.visible = false; });
}
function launch() {
  resetFlight();
  ST.phase = 'run'; ST.t = 0;
}
function jettison(key, dir) {
  const p = RKT.parts[key];
  if (!p || !p.visible) return;
  if (!p.userData.home) p.userData.home = { pos: p.position.clone() };
  const wp = new THREE.Vector3();
  p.getWorldPosition(wp);
  RKT.g.remove(p);
  debrisG.add(p);
  p.position.copy(wp);
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
    const P = profile(ST.t);
    const g = gAt(ST.h);
    const rho = rhoAt(ST.h);
    const area = ST.t < 140 ? 9.5 : 8.8;
    const drag = 0.5 * rho * ST.v * ST.v * 0.42 * area;
    const m = currentMass();
    const acc = (P.T - drag) / m - g * Math.sin(ST.gam);
    if (ST.t > 0.3 && ST.h <= 0.5 && acc <= 0) {
      // 推重比不足，无法离地
      ST.phase = 'idle'; ST.t = 0;
      showToast(`推重比 T/W = ${(P.T / (m0() * gAt(0))).toFixed(2)} < 1，火箭无法离地。把推力提到 100% 以上再试。`, 'bad');
      return;
    }
    ST.v = Math.max(ST.v + acc * dt, 0);
    ST.gam += (gammaCmd(ST.t) - ST.gam) * Math.min(1, dt * 1.6);
    ST.h += ST.v * Math.sin(ST.gam) * dt;
    ST.x += ST.v * Math.cos(ST.gam) * dt;
    ST.maxQ = Math.max(ST.maxQ, 0.5 * rho * ST.v * ST.v);
    ST.maxG = Math.max(ST.maxG, acc > 0 ? acc / 9.8 : 0);
    // 推进剂消耗（分级池）
    if (P.T > 0) {
      const mdot = P.T / (P.isp * G0);
      if (P.k === 'both') { ST.bb += mdot * P.bf * dt; ST.bc += mdot * (1 - P.bf) * dt; }
      else if (P.k === 'core') ST.bc += mdot * dt;
      else if (P.k === 's2') ST.s2burn += mdot * dt;
    }
    // 时序事件
    EVENTS.forEach((ev) => {
      if (!ST.fired[ev.key] && ST.t >= ev.t) {
        if (ev.key === 'fair' && ST.h < 110e3) return; // 高度不够则延后
        ST.fired[ev.key] = true;
        jettison(ev.key, ev.key === 'tower' ? new THREE.Vector3(-1.6, 0.3, 0.2) : undefined);
        showToast(ev.name + '！', 'ok');
      }
    });
    // MECO：一级燃料耗尽（或到时）→ 一二级分离，二级点火
    if (!ST.fired.s1 && ST.t > 25 && (ST.bc >= M2.s1Prop - 2 || ST.t >= 157)) {
      ST.fired.s1 = true;
      jettison('s1');
      RKT.flames.s1.visible = false;
      showToast('一二级分离，二级真空发动机点火！', 'ok');
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
function currentMass() {
  // 只计「仍在箭上」的质量：已分离的级（含其剩余燃料）一并扣除
  let m = CFG.payload * 1e3 + M2.s2Dry + Math.max(M2.s2Prop - ST.s2burn, 0);
  if (!ST.fired.fair) m += M2.fair;
  if (!ST.fired.tower) m += M2.tower;
  if (!ST.fired.boosters) m += M2.boostDry + Math.max(M2.boostProp - ST.bb, 0);
  if (!ST.fired.s1) m += M2.s1Dry + Math.max(M2.s1Prop - ST.bc, 0);
  return m;
}
/* 供无头自检/QA 观测仿真状态 */
window.__rkt = { ST, M2, CFG, vCirc, m0, profile: () => profile(ST.t) };

/* 起飞烟尘 */
const smoke = [];
for (let i = 0; i < 26; i++) {
  const s = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 6),
    new THREE.MeshBasicMaterial({ color: 0xd8cdbb, transparent: true, opacity: 0, depthWrite: false }));
  s.visible = false;
  scene.add(s);
  smoke.push({ mesh: s, life: 0, max: 2.4 + Math.random() * 1.6, vx: (Math.random() - 0.5) * 14, vz: (Math.random() - 0.5) * 14 });
}
function stepSmoke(dt, baseY) {
  if (ST.phase === 'run' && ST.t < 7) {
    smoke.forEach((s, i) => {
      if (s.life <= 0 && Math.random() < 0.25) {
        s.life = s.max;
        s.mesh.position.set((Math.random() - 0.5) * 5, baseY + Math.random() * 2, (Math.random() - 0.5) * 5);
        s.mesh.visible = true;
      }
    });
  }
  smoke.forEach((s) => {
    if (s.life > 0) {
      s.life -= dt;
      const k = 1 - s.life / s.max;
      s.mesh.position.x += s.vx * dt; s.mesh.position.z += s.vz * dt;
      s.mesh.position.y += dt * 1.5;
      s.mesh.scale.setScalar(1 + k * 9);
      s.mesh.material.opacity = 0.5 * (1 - k);
      if (s.life <= 0) s.mesh.visible = false;
    }
  });
}

/* ---------------- 上升段视觉更新 ---------------- */

let lastFollow = new THREE.Vector3();
function followTarget(p) {
  const d = new THREE.Vector3().subVectors(p, lastFollow);
  camera.position.add(d);
  controls.target.copy(p);
  lastFollow.copy(p);
}
function updateAscentVisual(dt) {
  if (!RKT.g) return;
  const y = 2.5 + visH(ST.h);
  RKT.g.position.y = y;
  const pitch = (Math.PI / 2 - ST.gam);
  RKT.g.rotation.z = -pitch;
  if (ST.phase === 'run' && ST.t < 2 && ST.h < 100) RKT.g.rotation.z = 0;
  const P = profile(ST.t);
  const burning = ST.phase === 'run' && P.T > 0;
  RKT.flames.s1.visible = burning && ST.t < 157 && !ST.fired.s1;
  RKT.flames.s2.visible = burning && ST.t >= 157;
  const flick = 0.85 + Math.sin(performance.now() * 0.02) * 0.15;
  [RKT.flames.s1, RKT.flames.s2].forEach((f) => { if (f.visible) f.scale.setScalar(flick); });
  // 已分离件坠落
  if (ST.jett.length) debrisG.visible = true;
  ST.jett.forEach((j) => {
    j.vel.y -= 9.8 * dt;
    j.mesh.position.addScaledVector(j.vel, dt * 2);
    j.mesh.rotation.x += j.av.x * dt; j.mesh.rotation.z += j.av.z * dt;
  });
  // 塔架平台摆开
  if (RKT.siteBoom && ST.t > 1) RKT.siteBoom.rotation.y = Math.min(1.2, RKT.siteBoom.rotation.y + dt * 0.8);
  stepSmoke(dt, RKT.g.position.y);
  // 天色
  const k = skyK(ST.h);
  curBg.copy(skyCol).lerp(spaceCol, k);
  scene.background = curBg;
  stars.material.opacity = k * k * 0.9;
  if (ST.phase === 'run' || ST.phase === 'pause' || ST.phase === 'coast') followTarget(RKT.g.position);
}

/* ---------------- 在轨段（地球轨道演示） ---------------- */

const ORB = { alt: 350, ang: 0, follow: false, built: false };
function buildOrbit(g, tex) {
  const R = 1.6;
  const key = new THREE.DirectionalLight(0xfff5e8, 2.0);
  key.position.set(3.4, 2.2, 4.5);   // 从观察侧照地球
  g.add(key);
  const earth = new THREE.Mesh(new THREE.SphereGeometry(R, 48, 32),
    new THREE.MeshStandardMaterial({ map: tex.earthDay, roughness: 0.9 }));
  g.add(earth);
  const clouds = new THREE.Mesh(new THREE.SphereGeometry(R * 1.012, 48, 32),
    new THREE.MeshStandardMaterial({ map: tex.earthClouds, transparent: true, opacity: 0.55, depthWrite: false }));
  g.add(clouds);
  const atmo = new THREE.Mesh(new THREE.SphereGeometry(R * 1.045, 32, 24),
    new THREE.MeshBasicMaterial({ color: 0x7fb4ff, transparent: true, opacity: 0.16, side: THREE.BackSide, depthWrite: false }));
  g.add(atmo);
  g.userData.earth = earth;
  g.userData.clouds = clouds;
  g.userData.R = R;
  const ring = circleLine(R * 1.055, 0x69c8ff, 160, 'y');
  ring.rotation.x = 0.5;
  g.add(ring);
  g.userData.ring = ring;
  // 神舟飞船（轨道段：轨道舱+返回舱+推进舱）
  const ship = new THREE.Group();
  const mW = M(0xe8ecef, 0.5);
  const orbMod = cyl(0.09, 0.09, 0.28, mW, 14);
  const retMod = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.22, 14), M(0x3d4650, 0.6));
  retMod.rotation.z = -Math.PI / 2; retMod.position.x = -0.24;
  const propMod = cyl(0.07, 0.09, 0.2, M(0x9aa3ac, 0.6), 14);
  propMod.rotation.z = -Math.PI / 2; propMod.position.x = -0.45;
  for (const s of [-1, 1]) {
    const pn = box(0.02, 0.16, 0.42, M(0x274a86, 0.4, 0.3));
    pn.position.set(0.16, s * 0.1, 0);
    ship.add(pn);
  }
  ship.add(orbMod, retMod, propMod);
  g.add(ship);
  g.userData.ship = ship;
  earth.rotation.y = 2;
}
function orbitUpdate(dt) {
  const g = scenes.orbit;
  if (!g) return;
  const R = g.userData.R;
  const r = R * (1 + ORB.alt * 1000 / R_E);
  g.userData.ring.scale.setScalar(r / (R * 1.055));
  g.userData.ring.rotation.x = 0.5;
  ORB.ang += dt * (Math.PI * 2 / 34);   // 一圈 34 s（压缩 91 min）
  const x = Math.cos(ORB.ang) * r, z = -Math.sin(ORB.ang) * r * Math.cos(0.5), y = Math.sin(ORB.ang) * r * Math.sin(0.5);
  g.userData.ship.position.set(x, y, z);
  g.userData.ship.rotation.y = -ORB.ang + Math.PI / 2;
  g.userData.earth.rotation.y += dt * 0.05;
  g.userData.clouds.rotation.y += dt * 0.055;
  const vc = vCirc(ORB.alt * 1000);
  const per = 2 * Math.PI * Math.sqrt(Math.pow(R_E + ORB.alt * 1000, 3) / MU);
  hset('v', vc.toFixed(0) + ' m/s');
  hset('per', (per / 60).toFixed(1) + ' min（一天 ' + Math.round(1440 / (per / 60)) + ' 次日出）');
  hset('wt', 'g′=' + gAt(ORB.alt * 1000).toFixed(1) + ' m/s²，完全失重（引力＝向心力）');
  if (ORB.follow) followTarget(g.userData.ship.position);
}

/* ---------------- 再入段 ---------------- */

const RE = { gam: 1.8, h: 100e3, v: 7650, t: 0, running: false, done: false, maxG: 0, heat: 0, black: false, skip: false, gOut: false };
function buildReentry(g, tex) {
  // 返回舱（钟形）
  const cap = new THREE.Group();
  const pts = [];
  for (let i = 0; i <= 14; i++) {
    const t = i / 14;
    pts.push(new THREE.Vector2(0.55 + 0.75 * t, 0.9 * t));
  }
  const body = new THREE.Mesh(new THREE.LatheGeometry(pts, 24), M(0x4a4f47, 0.75, 0.2));
  cap.add(body);
  const shield = cyl(0.55, 0.62, 0.18, M(0x2e2620, 0.9), 24);
  shield.position.y = 0.02;
  cap.add(shield);
  cap.rotation.z = Math.PI / 2;   // 钝头朝前（-x）
  g.add(cap);
  g.userData.cap = cap;
  // 等离子鞘（辉光）
  const plasma = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeGlowTexture('255,140,60'), transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  plasma.scale.set(7, 3.2, 1);
  g.add(plasma);
  g.userData.plasma = plasma;
  const trailMat = new THREE.MeshBasicMaterial({ color: 0xff8a4a, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false });
  const trail = new THREE.Mesh(new THREE.ConeGeometry(0.8, 8, 12, 1, true), trailMat);
  trail.rotation.z = Math.PI / 2;
  trail.position.x = 4;
  g.add(trail);
  g.userData.trail = trail;
  // 地面（远处，进入视野用）
  const groundM = new THREE.Mesh(new THREE.PlaneGeometry(800, 800), new THREE.MeshStandardMaterial({ map: tex.sandG, normalMap: tex.sandN, color: 0xbda887, roughness: 1 }));
  groundM.rotation.x = -Math.PI / 2;
  g.add(groundM);
  g.userData.ground = groundM;
  // 轨迹线
  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(300 * 3), 3));
  const line = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: 0x69c8ff, transparent: true, opacity: 0.5 }));
  line.frustumCulled = false;
  g.add(line);
  g.userData.line = line;
  g.userData.lineN = 0;
}
function reentryReset() {
  RE.h = 100e3; RE.v = 7650; RE.t = 0; RE.running = false; RE.done = false;
  RE.maxG = 0; RE.heat = 0; RE.black = false; RE.skip = false; RE.gOut = false;
  const g = scenes.reentry;
  if (g) {
    const y = RE.h * 9e-4;
    g.userData.cap.position.set(0, y, 0);
    g.userData.plasma.material.opacity = 0;
    g.userData.trail.material.opacity = 0;
    g.userData.lineN = 0;
    const pos = g.userData.line.geometry.attributes.position;
    pos.setXYZ(0, 0, y, 0);
    pos.needsUpdate = true;
    g.userData.line.geometry.setDrawRange(0, 1);
    lastFollow.set(0, y, 0);
    controls.target.set(0, y, 0);
    camera.position.set(9, y + 6, 20);
  }
  showToast('');
}
function reentryStep(dtReal) {
  const g = scenes.reentry;
  if (!RE.running || RE.done) return;
  const sub = 0.04;
  const simDt = Math.min(dtReal, 0.1) * 1;   // 实时（再入全程 ~7 min → 时间倍率 8）
  let left = simDt * 8;
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
    RE.gam = clamp(RE.gam + (-dgam) * dt / DEG * 0.1, 0, 60);   // 升力式再入：升力调节抑制陡化
    RE.h += RE.v * Math.sin(gamR) * dt;
    const gl = drag / m / 9.8;
    if (RE.h < 90e3) RE.maxG = Math.max(RE.maxG, gl);
    RE.heat = clamp(Math.sqrt(rho / 1.225) * Math.pow(RE.v / 7600, 3) * 1.6, 0, 1.4);
    RE.black = RE.h < 70e3 && RE.h > 32e3 && RE.v > 3000 && RE.heat > 0.32;
    // 弹跳（再入角太小：升力不足以捕获，滑出大气）
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
  // 视觉
  if (g) {
    const y = Math.max(RE.h * 9e-4, 6);
    const cap = g.userData.cap;
    cap.position.set(0, y, 0);
    cap.rotation.z = Math.PI / 2 - (RE.gam * DEG) * 0.8;
    g.userData.plasma.material.opacity = clamp(RE.heat, 0, 1) * 0.95;
    g.userData.plasma.position.set(-1.6, y, 0);
    g.userData.trail.material.opacity = clamp(RE.heat * 0.5, 0, 0.5);
    g.userData.trail.position.set(2.4, y, 0);
    g.userData.ground.position.y = -0.1;
    // 轨迹
    const ln = g.userData.lineN;
    if (ln < 299) {
      const pos = g.userData.line.geometry.attributes.position;
      pos.setXYZ(ln + 1, cap.position.x, y, cap.position.z);
      g.userData.lineN = ln + 1;
      pos.needsUpdate = true;
      g.userData.line.geometry.setDrawRange(0, ln + 2);
    }
    followTarget(cap.position);
  }
  hset('h', (RE.h / 1000).toFixed(1) + ' km');
  hset('v', (RE.v / 1000).toFixed(2) + ' km/s');
  hset('g', (RE.h < 90e3 ? (dragNow() / 3150 / 9.8) : 0).toFixed(1) + ' g');
  hset('peak', RE.maxG.toFixed(1) + ' g');
  hset('comm', RE.black ? '⚡ 黑障（通信中断）' : '通信正常');
}
function dragNow() {
  const rho = rhoAt(RE.h);
  return 0.5 * rho * RE.v * RE.v * 1.25 * 4.6;
}

/* ---------------- 开伞着陆段 ---------------- */

const LD = { area: 1200, retro: true, h: 10e3, v: 180, running: false, done: false, vLand: 0, phase: 0 };
function buildLanding(g, tex) {
  const groundM = new THREE.Mesh(new THREE.PlaneGeometry(700, 700), new THREE.MeshStandardMaterial({ map: tex.sandG, normalMap: tex.sandN, color: 0xc4ae87, roughness: 1 }));
  groundM.rotation.x = -Math.PI / 2;
  g.add(groundM);
  // 着陆场标志
  for (let i = 1; i <= 3; i++) {
    const ring = new THREE.Mesh(new THREE.RingGeometry(i * 14 - 1.2, i * 14, 48),
      new THREE.MeshBasicMaterial({ color: 0xe8674a, transparent: true, opacity: 0.55, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.06;
    g.add(ring);
  }
  // 返回舱
  const cap = new THREE.Group();
  const pts = [];
  for (let i = 0; i <= 14; i++) {
    const t = i / 14;
    pts.push(new THREE.Vector2(0.55 + 0.75 * t, 0.9 * t));
  }
  const body = new THREE.Mesh(new THREE.LatheGeometry(pts, 24), M(0x54503e, 0.8, 0.15));
  body.rotation.x = Math.PI;   // 钝头朝下
  const shield = cyl(0.62, 0.55, 0.2, M(0x2e2620, 0.9), 24);
  shield.position.y = -0.95;
  cap.add(body, shield);
  g.add(cap);
  g.userData.cap = cap;
  // 伞（红白条纹半球）
  const c = document.createElement('canvas');
  c.width = 256; c.height = 128;
  const cx = c.getContext('2d');
  for (let i = 0; i < 16; i++) {
    cx.fillStyle = i % 2 ? '#e8e4da' : '#d4482f';
    cx.fillRect(i * 16, 0, 16, 128);
  }
  const canopyTex = new THREE.CanvasTexture(c);
  canopyTex.colorSpace = THREE.SRGBColorSpace;
  const canopy = new THREE.Mesh(new THREE.SphereGeometry(7, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({ map: canopyTex, side: THREE.DoubleSide, roughness: 0.85 }));
  canopy.rotation.x = Math.PI;
  canopy.visible = false;
  g.add(canopy);
  g.userData.canopy = canopy;
  // 伞绳
  const lines = new THREE.Group();
  const lmat = new THREE.LineBasicMaterial({ color: 0x555c63 });
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * Math.PI * 2;
    const geo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, -0.8, 0),
      new THREE.Vector3(Math.cos(a) * 6.4, 8.6, Math.sin(a) * 6.4),
    ]);
    lines.add(new THREE.Line(geo, lmat));
  }
  lines.visible = false;
  g.add(lines);
  g.userData.lines = lines;
  // 反推火焰
  const retro = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeGlowTexture('255,210,130'), transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  retro.position.y = -1.6;
  retro.scale.set(5, 5, 1);
  g.add(retro);
  g.userData.retro = retro;
  g.userData.canopyScale = 0.001;
}
function landingReset() {
  LD.h = 10e3; LD.v = 180; LD.running = false; LD.done = false; LD.vLand = 0; LD.phase = 0;
  const g = scenes.landing;
  if (g) {
    const y = LD.h * 4.5e-3;
    g.userData.cap.position.set(0, y + 0.95, 0);
    g.userData.canopy.visible = false;
    g.userData.lines.visible = false;
    g.userData.canopyScale = 0.001;
    g.userData.retro.material.opacity = 0;
    lastFollow.set(0, y, 0);
    controls.target.set(0, y, 0);
    camera.position.set(12, y + 4, 26);
  }
  showToast('');
}
function landingStep(dtReal) {
  const g = scenes.landing;
  if (!LD.running || LD.done) return;
  let left = Math.min(dtReal, 0.1) * (LD.phase === 2 ? 40 : 8);   // 时间倍率：伞下 40×，自由/减速段 8×
  const m = 3150;
  while (left > 0) {
    const dt = Math.min(0.03, left); left -= dt;
    const rho = rhoAt(LD.h);
    const CdA = LD.phase === 2 ? 1.35 * LD.area : LD.phase === 1 ? 60 : 9;
    const acc = 9.8 - 0.5 * rho * LD.v * LD.v * CdA / m;   // 向下为正
    LD.v = Math.max(LD.v + acc * dt, 0);
    LD.h -= LD.v * dt;
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
        break;
      }
    }
  }
  // 视觉
  if (g) {
    const y = LD.h * 4.5e-3;
    g.userData.cap.position.set(0, y + 0.95, 0);
    const sway = Math.sin(performance.now() * 0.0011) * (LD.phase === 2 ? 0.6 : 0);
    g.userData.cap.position.x = sway;
    const wantScale = LD.phase === 2 ? 1 : LD.phase === 1 ? 0.3 : 0;
    g.userData.canopyScale = lerp(g.userData.canopyScale, wantScale, 0.08);
    const cs = g.userData.canopyScale;
    g.userData.canopy.visible = cs > 0.01;
    g.userData.lines.visible = cs > 0.01;
    g.userData.canopy.scale.setScalar(Math.max(cs, 0.001));
    g.userData.lines.scale.setScalar(Math.max(cs, 0.001));
    g.userData.canopy.position.set(sway, y + 10 * cs, 0);
    g.userData.lines.position.set(sway, y, 0);
    g.userData.retro.material.opacity = LD.retro && LD.h < 1.6 && LD.running ? 0.85 : 0;
    followTarget(g.userData.cap.position);
    hset('h', (LD.h / 1000).toFixed(2) + ' km');
    hset('v', LD.v.toFixed(1) + ' m/s');
    hset('phase', ['自由段', '减速伞', '主伞 ' + LD.area + ' m²', '已着陆'][LD.phase]);
    hset('term', LD.phase === 2 ? '平衡 v=√(2mg/ρC_A) ≈ ' + Math.sqrt(2 * m * 9.8 / (rhoAt(2000) * 1.35 * LD.area)).toFixed(1) + ' m/s' : '–');
  }
}

/* ---------------- HUD / 提示条 ---------------- */

let hud = null;
function setHUD(rows) {
  if (hud) hud.el.remove();
  hud = makeHUD(stage, rows);
  hud.el.style.cssText = 'position:absolute;top:14px;right:14px;z-index:10;min-width:215px;';
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
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 7000);
}

/* 简易曲线卡 */
function makePlotCard(title) {
  const w = 250, hgt = 178;
  const card = document.createElement('div');
  card.className = 'hud-card';
  card.style.cssText = `position:absolute;top:186px;right:14px;z-index:10;width:${w + 24}px;`;
  card.innerHTML = `<div style="margin-bottom:6px"><b>${title}</b></div>`;
  const canvas = document.createElement('canvas');
  canvas.width = w * 2; canvas.height = hgt * 2;
  canvas.style.cssText = 'width:100%;display:block;border-radius:8px;background:color-mix(in srgb, var(--bg) 55%, transparent);';
  card.appendChild(canvas);
  stage.appendChild(card);
  const ctx = canvas.getContext('2d');
  return {
    el: card, ctx, w, h: hgt,
    hide(v = true) { card.style.display = v ? 'none' : ''; },
  };
}
function drawFlightPlot(plot, hist) {
  const { ctx, w, h } = plot;
  ctx.setTransform(2, 0, 0, 2, 0, 0);
  ctx.clearRect(0, 0, w, h);
  const st = getComputedStyle(document.documentElement);
  const grid = st.getPropertyValue('--card-border').trim() || '#8899aa88';
  const fg = st.getPropertyValue('--text-dim').trim() || '#889';
  ctx.strokeStyle = grid; ctx.fillStyle = fg; ctx.lineWidth = 1; ctx.font = '10px sans-serif';
  const ox = 34, oy = h - 22;
  ctx.beginPath(); ctx.moveTo(ox, 10); ctx.lineTo(ox, oy); ctx.lineTo(w - 6, oy); ctx.stroke();
  ctx.fillText('t/min', w - 30, oy + 12);
  if (hist.length < 2) return;
  const tMax = Math.max(hist[hist.length - 1][0], 60);
  const vMax = Math.max(...hist.map((p) => p[1])) * 1.15;
  const hMax = Math.max(...hist.map((p) => p[2])) * 1.15;
  const line = (idx, max, color, ylab) => {
    ctx.strokeStyle = color; ctx.lineWidth = 2;
    ctx.beginPath();
    hist.forEach((p, i) => {
      const px = ox + (p[0] / tMax) * (w - ox - 8);
      const py = oy - (p[idx] / max) * (oy - 14);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    });
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.fillText(ylab, ox + 4, 10);
  };
  line(1, vMax, '#e8674a', '速度');
  line(2, hMax, '#5aa7e8', '高度');
}

/* ---------------- 控制条与章节 ---------------- */

const ctl = createControlsPanel(document.getElementById('controls'));

let plot = null;
const flightHist = [];

function updFlightHUD() {
  if (!hud) return;
  const mode = hud.el.dataset.mode;
  if (!mode) return;
  const P = profile(ST.t);
  const m = currentMass();
  const drag = 0.5 * rhoAt(ST.h) * ST.v * ST.v * 0.42 * (ST.t < 140 ? 9.5 : 8.8);
  hset('t', (ST.t / 60).toFixed(2) + ' min');
  hset('h', (ST.h / 1000).toFixed(1) + ' km');
  hset('v', ST.v < 1200 ? ST.v.toFixed(0) + ' m/s（Ma ' + (ST.v / 340).toFixed(1) + '）' : (ST.v / 1000).toFixed(2) + ' km/s');
  hset('a', ST.phase === 'run' && P.T > 0 ? ((P.T - drag) / m / 9.8).toFixed(1) + ' g' : '–');
  hset('q', (ST.maxQ / 1000).toFixed(0) + ' kPa');
  hset('tw', ((5923e3 * CFG.thrustPct / 100) / (m0() * gAt(0))).toFixed(2));
  hset('st', ST.phase === 'idle' ? '待命' : ST.done ? (ST.orbit ? '✓ 已入轨' : '✗ 未入轨') : ST.t < 157 ? '一二级工作' : '二级工作');
  if (mode === 'ins') {
    const vc = vCirc(ST.h);
    hset('vc', (vc / 1000).toFixed(2) + ' km/s');
    hset('dv', ST.done
      ? (ST.orbit ? '✓ 已入轨' : '差 ' + (vc - ST.v).toFixed(0) + ' m/s')
      : (vc >= ST.v ? '差 ' + (vc - ST.v).toFixed(0) + ' m/s' : '富余 ' + (ST.v - vc).toFixed(0) + ' m/s'));
  }
}

const SECTIONS = [
  {
    id: 'intro', title: '认识长征二号F',
    html: `<p>神舟飞船由<b>长征二号F</b>（CZ-2F）发射：全箭约 <b>58 m</b>（相当于 20 层楼）、起飞质量约 <b>470~510 t</b>，其中约 <b>90%</b> 是推进剂。从下到上：一级（4 台主机）＋ 4 台助推器 → 二级（真空发动机）→ 整流罩内的神舟飞船，顶部是<b>逃逸塔</b>——起飞前 120 秒内的「生命保险」，出故障时能在零点几秒内把飞船拉离火箭。</p>
<p>一级与助推器用<b>四氧化二氮 + 偏二甲肼</b>：两者一接触就自燃、可常温储存，尾焰因此带一点红棕色。每一部分用完就扔掉，剩下的火箭越来越轻。</p>
<p>拖动旋转缩放箭体，点按钮切换视图，开合「部件标注」。</p>`,
    enter() {
      useScene('site', (g) => {});
      if (!RKT.built) buildRocket();
      scene.background = skyCol.clone(); stars.material.opacity = 0;
      RKT.g.visible = true;
      Object.values(RKT.parts).forEach((p) => { p.visible = true; });
      addLabels();
      if (RKT.labels) RKT.labels.forEach((sl) => { sl.visible = true; });
      resetFlight();
      introCtl();
    },
  },
  {
    id: 'liftoff', title: '点火与起飞',
    html: `<p><b>点火！</b>发动机推力 T 与重力 W = mg 的较量决定火箭的命运：<span class="hl">T &gt; W 才能离地</span>。离地瞬间推重比约 1.2，此后推进剂消耗、质量变小，加速度越来越大。</p>
<p>用「起飞推力」滑杆改变发动机状态：降到 <b>90% 以下火箭离不了地</b>——这就是推重比的意义。</p>
<p>点「倒计时点火」，观察起飞后 20 秒内加速度的变化。</p>`,
    enter() {
      useScene('site', (g) => {});
      if (!RKT.built) buildRocket();
      scene.background = skyCol.clone(); stars.material.opacity = 0;
      RKT.g.visible = true;
      resetFlight();
      app.setCamera([26, 16, 44], [0, 16, 0]);
      liftoffCtl();
    },
  },
  {
    id: 'ascent', title: '冲出大气',
    html: `<p>火箭不是直着飞：<b>程序转弯（重力转弯）</b>让弹道逐渐倾斜，沿着地球曲面「横」过来——最终目的不是飞高，而是<b>达到 7.9 km/s 的第一宇宙速度量级</b>。</p>
<p>大气密度随高度<b>指数下降</b>（约每 5.5 km 减半）：阻力 F<sub>D</sub> = ½ρv²C<sub>D</sub>A 与动压 q = ½ρv² 在约 <b>70 s、高度 11 km</b> 处达到峰值（Max-Q），这是箭体受力最严酷的时刻，此后空气阻力迅速消失。同时 N = m(g+a)：<b>航天员处于超重状态</b>，火箭里的「体重」随加速度增大。</p>
<p>开「受力分析」看推力/重力/阻力箭头；曲线卡实时画出速度与高度的攀升。</p>`,
    enter() {
      useScene('site', (g) => {});
      if (!RKT.built) buildRocket();
      RKT.g.visible = true;
      if (!plot) plot = makePlotCard('速度 / 高度 曲线');
      plot.hide(false);
      ascentCtl();
      app.setCamera([24, 14, 40], [0, 12, 0]);
      followTarget(RKT.g.position);
    },
  },
  {
    id: 'sep', title: '抛掉包袱',
    html: `<p>分级是把「用完的空壳」扔掉——这是<span class="hl">多级火箭</span>的核心思想：轻装加速。烧空的助推器和一级如果一直带着，就是「死重」，质量比上不去。神舟任务中的分离时序：</p>
<p>① ~120 s <b>逃逸塔分离</b>（最危险的时段已过）；② ~139 s <b>助推器分离</b>；③ ~159 s <b>一二级「热分离」</b>——一级还没关机二级就先点火，燃气从级间段的排焰窗排出，然后解锁分离，二级立刻接着加速；④ ~200 s、高度 110 km 以上<b>整流罩分离</b>（出了大气层，飞船不再需要「外套」，减重约 2 t）。</p>
<p>点「跳到分离前」再慢速观看每个分离瞬间。</p>`,
    enter() {
      useScene('site', (g) => {});
      if (!RKT.built) buildRocket();
      RKT.g.visible = true;
      if (ST.phase === 'idle') resetFlight();
      sepCtl();
      app.setCamera([18, 12, 30], [0, 10, 0]);
      followTarget(RKT.g.position);
    },
  },
  {
    id: 'insert', title: '进入轨道',
    html: `<p>二级把飞船推到 <b>350 km</b> 左右、速度接近该高度的圆轨道速度 <span class="hl">v = √(μ/r)</span>（约 7.7 km/s；贴近地面时是 7.9 km/s，即第一宇宙速度）——关机后不再有推力，飞船靠惯性「落不下来」，这就是入轨。</p>
<p>火箭向东飞：发射纬度越低，能借到的地球自转速度越多（酒泉纬度约 41°，白捡约 0.35 km/s）。</p>
<p>改变三个真实参数试试：<b>载荷质量</b>（神舟飞船约 8 t）、<b>二级比冲</b>（发动机效率）、以及火箭的<b>运载余量</b>。载荷太重或比冲太低 → 差一点速度，<b>入轨失败</b>。</p>
<p>齐奥尔科夫斯基公式 Δv = v<sub>e</sub>·ln(m₀/m<sub>f</sub>) 告诉我们：每一千克载荷都在吃掉速度余量——这也是「不分级就到不了轨道」的数学原因。</p>`,
    enter() {
      useScene('site', (g) => {});
      if (!RKT.built) buildRocket();
      RKT.g.visible = true;
      if (!plot) plot = makePlotCard('速度 / 高度 曲线');
      plot.hide(false);
      insertCtl();
      app.setCamera([26, 15, 54], [0, 14, 0]);
      followTarget(RKT.g.position);
    },
  },
  {
    id: 'orbit', title: '在轨飞行',
    html: `<p>入轨后，飞船进入<b>完全失重</b>：不是没有重力，而是<span class="hl">重力全部用来提供向心力</span>（万有引力 = m v²/r = GMm/r²），舱内一切都在「自由下落」，所以自由漂浮。这个高度的重力加速度仍有约 <b>8.7 m/s²</b>（只比地面小 11%）。</p>
<p>轨道越低速度越快、周期越短。神舟在约 390 km 高度与空间站对接，<b>约 92 分钟绕地球一圈</b>，一天能看到 16 次日出日落。第一宇宙速度（7.9 km/s，贴地飞行）是圆轨道速度的最大值；轨道升高，速度下降、周期变长。</p>
<p>拖动「轨道高度」滑杆，看速度、周期与当地重力的变化；视角按钮切换跟随舱/全景。</p>`,
    enter() {
      useScene('orbit', (g) => orbitBuildWrap(g));
      scene.background = spaceCol.clone();
      stars.material.opacity = 0.9;
      RKT.g.visible = false;
      if (plot) plot.hide(true);
      ORB.follow = false;
      orbitCtl();
      setHUD([['alt', '轨道高度'], ['v', '轨道速度'], ['per', '周期'], ['wt', '失重状态']]);
      app.setCamera([0, 1.4, 4.2], [0, 0, 0]);
      lastFollow.set(0, 0, 0);
    },
  },
  {
    id: 'reentry', title: '再入大气',
    html: `<p>回家比去更惊险：返回舱以 <b>7.6 km/s</b> 冲进大气，动能约 <b>10<sup>11</sup> J</b> 全部换成<b>热</b>——船头周围形成上千摄氏度的<b>等离子鞘</b>，电离气体屏蔽电磁波，这就是 <b>黑障</b>（约 80~40 km）。</p>
<p><b>再入角</b>是关键：<span class="hl">太浅会被大气像打水漂一样弹回太空，太陡则减速过猛、过载超限</span>。神舟的再入角约 1.5°~2°，过载控制在 5 g 以内——返回舱的配平攻角产生少量升力，靠滚转改变升力方向来控制落点、降低过载。</p>
<p>调「再入角」滑杆后点「开始再入」，看过载峰值与黑障区间怎么变。</p>`,
    enter() {
      useScene('reentry', (g) => reentryBuildWrap(g));
      scene.background = spaceCol.clone();
      stars.material.opacity = 0.85;
      RKT.g.visible = false;
      if (plot) plot.hide(true);
      reentryReset();
      reentryCtl();
      setHUD([['h', '高度'], ['v', '速度'], ['g', '当前过载'], ['peak', '过载峰值'], ['comm', '通信']]);
    },
  },
  {
    id: 'landing', title: '开伞着陆',
    html: `<p>降到 10 km，返回舱依次开伞：<b>引导伞 → 减速伞（8 km）→ 主伞（7 km，约 1 200 m²）</b>。巨大的伞衣把速度从 ~180 m/s 拖到终端速度 <span class="hl">v = √(2mg / ρC<sub>d</sub>A) ≈ 7 m/s</span>。</p>
<p>距地面 1 m 时<b>反推发动机</b>点火，约 0.2 s 内把速度再压到 2 m/s 左右——<b>动量定理</b> FΔt = mΔv：反推减小 Δv，座椅缓冲延长 Δt，冲击力就小。关掉反推试试硬着陆的后果。</p>
<p>改「主伞面积」看平衡下降速度怎么变：伞面积就是刹车片。</p>`,
    enter() {
      useScene('landing', (g) => landingBuildWrap(g));
      scene.background = new THREE.Color(0x8f95a8).lerp(spaceCol, 0.25);
      stars.material.opacity = 0.35;
      RKT.g.visible = false;
      if (plot) plot.hide(true);
      landingReset();
      landingCtl();
      setHUD([['h', '高度'], ['v', '下降速度'], ['phase', '伞况'], ['term', '平衡速度']]);
    },
  },
];

/* 章节控制条 */

function introCtl() {
  ctl.clear();
  const views = [['整机', [40, 22, 85], [0, 22, 0]], ['中部', [14, 34, 26], [0, 34, 0]], ['发动机', [10, 5, 14], [0, 3, 0]], ['顶部', [8, 62, 16], [0, 56, 0]]];
  views.forEach(([t, pos, tgt]) => ctl.button({ label: t, onClick: () => app.setCamera(pos, tgt) }));
  ctl.sep();
  ctl.toggle({ label: '部件标注', value: true, onChange: (v) => { if (RKT.labels) RKT.labels.forEach((s) => { s.visible = v; }); } });
  ctl.slider({ label: '自动旋转', min: 0, max: 2, step: 0.1, value: 0, fmt: (v) => v.toFixed(1) + '×', onInput: (v) => { RKT.spin = v; } });
  setHUD([['len', '全箭长度'], ['m0', '起飞质量'], ['tw', '起飞推重比'], ['pay', '神舟飞船质量']]);
  hset('len', '≈ 58 m');
  hset('m0', '≈ 500 t');
  hset('tw', '≈ 1.2');
  hset('pay', '≈ 8 t');
}
function liftoffCtl() {
  ctl.clear();
  ctl.slider({ label: '起飞推力', min: 80, max: 110, step: 1, value: CFG.thrustPct, fmt: (v) => v + ' %', onInput: (v) => { CFG.thrustPct = v; } });
  ctl.slider({ label: '时间倍率', min: 1, max: 20, step: 1, value: ST.speed, fmt: (v) => '×' + v, onInput: (v) => { ST.speed = v; } });
  ctl.sep();
  ctl.button({ label: '⏺ 倒计时点火', onClick() { launch(); } });
  ctl.button({ label: '↺ 复位', onClick() { resetFlight(); } });
  setHUD([['tw', '推重比 T/W'], ['h', '高度'], ['v', '速度'], ['a', '轴向过载']]);
}
function ascentCtl() {
  ctl.clear();
  ctl.toggle({ label: '受力分析', value: true, onChange: (v) => { ST.showForces = v; } });
  ctl.slider({ label: '时间倍率', min: 1, max: 20, step: 1, value: ST.speed, fmt: (v) => '×' + v, onInput: (v) => { ST.speed = v; } });
  ctl.sep();
  ctl.button({ label: ST.phase === 'run' ? '⏸ 暂停' : '▶ 继续飞行', onClick(btn) { toggleRun(btn); } });
  ctl.button({ label: '↺ 从头点火', onClick() { resetFlight(); launch(); flightHist.length = 0; } });
  setHUD([['t', '飞行时间'], ['h', '高度'], ['v', '速度'], ['q', '动压（最大）'], ['st', '阶段']]);
}
function sepCtl() {
  ctl.clear();
  ctl.slider({ label: '时间倍率', min: 1, max: 20, step: 1, value: ST.speed, fmt: (v) => '×' + v, onInput: (v) => { ST.speed = v; } });
  ctl.sep();
  EVENTS.forEach((ev) => {
    ctl.button({
      label: '⇢ ' + ev.name,
      onClick() {
        resetFlight();
        ST.t = ev.t - 3; ST.phase = 'run'; ST.speed = 2;
        if (plot) plot.hide(false);
      },
    });
  });
  ctl.button({ label: '▶ 自动全程', onClick() { resetFlight(); launch(); ST.speed = 10; flightHist.length = 0; if (plot) plot.hide(false); } });
  setHUD([['t', '飞行时间'], ['h', '高度'], ['v', '速度'], ['st', '阶段']]);
}
function insertCtl() {
  ctl.clear();
  ctl.slider({ label: '载荷质量', min: 6, max: 12, step: 0.2, value: CFG.payload, fmt: (v) => v.toFixed(1) + ' t', onInput: (v) => { CFG.payload = v; } });
  ctl.slider({ label: '二级比冲', min: 285, max: 315, step: 1, value: CFG.isp2, fmt: (v) => v + ' s', onInput: (v) => { CFG.isp2 = v; } });
  ctl.slider({ label: '起飞推力', min: 96, max: 110, step: 1, value: CFG.thrustPct, fmt: (v) => v + ' %', onInput: (v) => { CFG.thrustPct = v; } });
  ctl.sep();
  ctl.button({ label: '⏺ 重新点火', onClick() { resetFlight(); launch(); ST.speed = 14; flightHist.length = 0; showToast(''); } });
  setHUD([['h', '高度'], ['v', '速度'], ['vc', '该高度圆轨道速度'], ['dv', '速度差'], ['st', '判定']]);
}
function orbitCtl() {
  ctl.clear();
  ctl.slider({ label: '轨道高度', min: 200, max: 800, step: 10, value: ORB.alt, fmt: (v) => v + ' km', onInput: (v) => { ORB.alt = v; hset('alt', v + ' km'); } });
  ctl.sep();
  ctl.toggle({ label: '跟随飞船', value: false, onChange: (v) => { ORB.follow = v; if (!v) { lastFollow.set(0, 0, 0); app.setCamera([0, 1.4, 4.2], [0, 0, 0]); } } });
  ctl.button({ label: '全景视角', onClick: () => { ORB.follow = false; lastFollow.set(0, 0, 0); app.setCamera([3.4, 2.2, 3.4], [0, 0, 0]); } });
  hset('alt', ORB.alt + ' km');
}
function reentryCtl() {
  ctl.clear();
  ctl.slider({ label: '再入角', min: 0.5, max: 4.5, step: 0.1, value: RE.gam, fmt: (v) => v.toFixed(1) + '°', onInput: (v) => { RE.gam = v; } });
  ctl.sep();
  ctl.button({ label: '▶ 开始再入', onClick() { reentryReset(); RE.running = true; } });
  ctl.button({ label: '↺ 复位', onClick() { reentryReset(); } });
  setHUD([['h', '高度'], ['v', '速度'], ['g', '当前过载'], ['peak', '过载峰值'], ['comm', '通信']]);
}
function landingCtl() {
  ctl.clear();
  ctl.slider({ label: '主伞面积', min: 800, max: 1400, step: 20, value: LD.area, fmt: (v) => v + ' m²', onInput: (v) => { LD.area = v; } });
  ctl.toggle({ label: '反推发动机', value: true, onChange: (v) => { LD.retro = v; } });
  ctl.sep();
  ctl.button({ label: '▶ 开始开伞', onClick() { landingReset(); LD.running = true; } });
  ctl.button({ label: '↺ 复位', onClick() { landingReset(); } });
  setHUD([['h', '高度'], ['v', '下降速度'], ['phase', '伞况'], ['term', '平衡速度']]);
}
function toggleRun(btn) {
  if (ST.phase === 'idle') launch();
  else if (ST.phase === 'run') ST.phase = 'pause';
  else if (ST.phase === 'pause') ST.phase = 'run';
  if (btn) btn.textContent = ST.phase === 'run' ? '⏸ 暂停' : '▶ 继续飞行';
}

/* 场景构建包装（纹理就绪后建） */
let TEX = null;
function orbitBuildWrap(g) { buildOrbit(g, TEX); }
function reentryBuildWrap(g) { buildReentry(g, TEX); }
function landingBuildWrap(g) { buildLanding(g, TEX); }

/* ---------------- 帧循环 ---------------- */

let forceArrows = null;
function makeForceArrows() {
  if (forceArrows) return forceArrows;
  const mk = (c) => {
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
  };
  forceArrows = { T: mk(0xffa23e), G: mk(0x5aa7e8), D: mk(0xd9534f) };
  scene.add(forceArrows.T, forceArrows.G, forceArrows.D);
  return forceArrows;
}
function updateForces() {
  if (!ST.showForces || !RKT.g || ST.phase === 'idle') {
    if (forceArrows) [forceArrows.T, forceArrows.G, forceArrows.D].forEach((a) => a.hide());
    return;
  }
  const fa = makeForceArrows();
  const P = profile(ST.t);
  const p = RKT.g.position;
  const c = new THREE.Vector3(p.x, p.y + 20, p.z);
  const dirV = new THREE.Vector3(Math.cos(Math.PI / 2 - ST.gam), Math.sin(Math.PI / 2 - ST.gam), 0);
  // 推力（沿速度方向）
  if (P.T > 0) fa.T.set(c.clone().addScaledVector(dirV, 12), c.clone().addScaledVector(dirV, 12 + clamp(P.T / 3e5, 4, 26)));
  else fa.T.hide();
  // 重力（竖直向下）
  fa.G.set(c.clone().add(new THREE.Vector3(-14, 6, 0)), c.clone().add(new THREE.Vector3(-14, 6 - 16, 0)));
  // 阻力（与速度反向）
  const drag = 0.5 * rhoAt(ST.h) * ST.v * ST.v * 0.42 * (ST.t < 140 ? 9.5 : 8.8);
  if (drag > 3e4) fa.D.set(c.clone().addScaledVector(dirV, -12), c.clone().addScaledVector(dirV, -12 - clamp(drag / 1.5e5, 3, 18)));
  else fa.D.hide();
}

app.onFrame((dt) => {
  cameraTweenTick(app, dt);
  if (ST.spin && RKT.g && RKT.g.visible && ST.phase === 'idle') RKT.g.rotation.y += dt * ST.spin * 0.4;
  const active = activeScene;
  if (active === scenes.site) {
    flightStep(dt * ST.speed);
    updateAscentVisual(dt);
    updateForces();
    updFlightHUD();
    if (plot && plot.el.style.display !== 'none' && (ST.phase === 'run' || ST.phase === 'pause')) {
      if (flightHist.length === 0 || ST.t - flightHist[flightHist.length - 1][0] > 2) {
        flightHist.push([ST.t / 60, ST.v / 1000, ST.h / 1000]);
        if (flightHist.length > 400) flightHist.shift();
        drawFlightPlot(plot, flightHist);
      }
    }
  } else if (active === scenes.orbit) {
    orbitUpdate(dt);
  } else if (active === scenes.reentry) {
    reentryStep(dt);
  } else if (active === scenes.landing) {
    landingStep(dt);
  }
});

/* HUD 模式标记：flight 模式由 updFlightHUD 每帧刷新 */
const origSetHUD = setHUD;
setHUD = function (rows) {
  origSetHUD(rows);
  const keys = rows.map(([k]) => k);
  hud.el.dataset.mode = keys.includes('vc') ? 'ins'
    : keys.includes('tw') ? 'lift'
    : (keys.includes('q') || keys.includes('t')) ? 'asc' : '';
};

/* ---------------- 启动 ---------------- */

loadAll([
  { key: 'slab', label: '发射台', job: loadTexture('../assets/textures/pbr/slab_diff-Bzxi6irn.webp', { colorSpace: null, wrap: true }) },
  { key: 'slabN', label: '发射台细节', job: loadTexture('../assets/textures/pbr/slab_nor-D2MZT0BN.webp', { colorSpace: null, wrap: true }) },
  { key: 'sandG', label: '戈壁', job: loadTexture('../assets/textures/pbr/sand_diff-BRysB-vE.webp', { colorSpace: null, wrap: true, repeat: [16, 16] }) },
  { key: 'sandN', label: '戈壁细节', job: loadTexture('../assets/textures/pbr/sand_nor-ZmfE7Ynv.webp', { colorSpace: null, wrap: true, repeat: [16, 16] }) },
  { key: 'rock', label: '山体', job: loadTexture('../assets/textures/pbr/rock_diff-B0OXFJjS.webp', { colorSpace: null, wrap: true }) },
  { key: 'rockN', label: '山体细节', job: loadTexture('../assets/textures/pbr/rock_nor-BD16lJKl.webp', { colorSpace: null, wrap: true }) },
  { key: 'earthDay', label: '地球', job: loadTexture('../assets/textures/earth/day-DmukkgAy.webp') },
  { key: 'earthClouds', label: '云层', job: loadTexture('../assets/textures/earth/earth_clouds_1024-CKDLEBqO.png') },
], (d, t, label) => loader.setText(`正在加载任务素材 ${d}/${t}（${label}）`)).then((t) => {
  TEX = t;
  loader.hide();
  useScene('site', (g) => buildSite(g, t));
  const sections = createSections({
    nav: document.getElementById('sideNav'),
    descPanel: document.getElementById('descPanel'),
    sections: SECTIONS,
    onSelect(i, sec) {
      if (plot) plot.hide(true);
      showToast('');
      ST.showForces = false;
      if (RKT.labels) RKT.labels.forEach((sl) => { sl.visible = false; });
      debrisG.visible = false;
      sec.enter();
    },
  });
  window.__eduSections = sections;
  sections.select(0);
}).catch((err) => {
  loader.setText('资源加载失败：' + err.message);
  console.error(err);
});
