/* EduLab · 细胞的能量“货币”（atp）
 * 章节：萤火虫的光从哪里来 / ATP 的结构 / ATP 与 ADP 的相互转化 / ATP 合酶 / 随堂检测
 * 场景：暗室荧光实验台（四管对照）、球棍模型 ATP、ADP⇄ATP 能量循环、线粒体内膜 ATP 合酶旋转催化。
 */
import {
  THREE, TAU, clamp,
  createApp, cameraTweenTick, makeLoader,
  createSections, createControlsPanel, makeHUD, makeTextSprite, setSpriteText, makeGlowTexture,
} from './edu-core.js';

/* ---------------- 基础 ---------------- */

const stage = document.getElementById('stage');
const loader = makeLoader(stage, '正在搭建暗室实验台…');
const app = createApp({
  container: stage,
  fov: 42, near: 0.1, far: 200,
  cameraPos: [0, 2.8, 6.4], target: [0, 1.0, 0],
  minDistance: 1.2, maxDistance: 30,
});
const { scene, camera, controls } = app;

const amb = new THREE.AmbientLight(0xdfe8f5, 1.05);
scene.add(amb);
const key = new THREE.DirectionalLight(0xfff2e0, 1.9);
key.position.set(4, 7, 5);
scene.add(key);
const fill = new THREE.DirectionalLight(0xbcd4ff, 0.55);
fill.position.set(-5, 3, -4);
scene.add(fill);

const M = (color, rough = 0.75, metal = 0, extra = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, ...extra });
const mesh = (geo, mat) => new THREE.Mesh(geo, mat);

function label(text, color = '#ffffff', scale = 0.006, bg = 'rgba(10,16,24,0.72)') {
  return makeTextSprite(text, { fontSize: 32, color, scale, bg });
}

/* 各章节场景组（互斥显示） */
const gFirefly = new THREE.Group();
const gMolecule = new THREE.Group();
const gCycle = new THREE.Group();
const gSynth = new THREE.Group();
scene.add(gFirefly, gMolecule, gCycle, gSynth);
const GROUPS = [gFirefly, gMolecule, gCycle, gSynth];

function showGroup(g) {
  GROUPS.forEach((x) => { x.visible = x === g; });
}

/* ================= 章节 1：萤火虫发光 ================= */

const bench = mesh(new THREE.BoxGeometry(7.4, 0.28, 2.6), M(0x3a4354, 0.85));
bench.position.y = -0.14;
gFirefly.add(bench);

const VIALS = [
  { x: -2.4, name: '① 蒸馏水', liquid: 0xbcd8ef, content: 'water' },
  { x: -0.85, name: '② 葡萄糖', liquid: 0xf3f7e2, content: 'glucose' },
  { x: 0.85, name: '③ ATP 溶液', liquid: 0xffe9a8, content: 'atp' },
  { x: 2.4, name: '④ ATP＋煮沸研磨', liquid: 0xffe9a8, content: 'atp_boiled' },
];
const glowTex = makeGlowTexture('220,255,160', [[0, 'rgba(C,0.95)'], [0.3, 'rgba(C,0.45)'], [1, 'rgba(C,0)']]);

VIALS.forEach((v) => {
  const g = new THREE.Group();
  g.position.set(v.x, 0, 0);
  const glass = mesh(new THREE.CylinderGeometry(0.5, 0.42, 1.7, 24), M(0xcfe4f2, 0.12, 0.05, { transparent: true, opacity: 0.22, depthWrite: false }));
  glass.position.y = 0.95;
  const liquid = mesh(new THREE.CylinderGeometry(0.44, 0.4, 1.15, 20), M(v.liquid, 0.32, 0, { transparent: true, opacity: 0.85 }));
  liquid.position.y = 0.68;
  const tissue = mesh(new THREE.SphereGeometry(0.3, 16, 12), M(0x8a7a4a, 0.9));
  tissue.scale.set(1, 0.45, 1);
  tissue.position.y = 0.22;
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 }));
  glow.position.y = 0.5;
  glow.scale.set(0.01, 0.01, 1);
  const lab = label(v.name, '#dfe9f5', 0.0048);
  lab.position.set(0, -0.42, 0);
  const stateTxt = label('待注入', '#9fb2c8', 0.0044);
  stateTxt.position.set(0, 1.98, 0);
  g.add(glass, liquid, tissue, glow, lab, stateTxt);
  v.group = g; v.glow = glow; v.stateTxt = stateTxt; v.lit = 0;
  gFirefly.add(g);
});
const fireflyLight = new THREE.PointLight(0xd8ffb0, 0, 7);
fireflyLight.position.set(VIALS[2].x, 1.1, 0.4);
gFirefly.add(fireflyLight);

const firefly = { injected: 0, dark: false, t: 0 };

function injectVial(i) {
  const v = VIALS[i];
  if (v.lit || v.injected) return;
  v.injected = true;
  v.stateTxt.position.y = 1.98;
  const on = v.content === 'atp' && i === 2;        // 只有新鲜研磨液 + ATP 才亮
  if (v.content === 'atp_boiled') {
    setSpriteText(v.stateTxt, '注入后仍不发光', { fontSize: 30, color: '#ff9d8a', scale: 0.0044, bg: 'rgba(10,16,24,0.72)' });
  } else if (on) {
    setSpriteText(v.stateTxt, '✦ 发光！', { fontSize: 34, color: '#e6ffc0', scale: 0.0052, bg: 'rgba(10,16,24,0.72)' });
  } else {
    setSpriteText(v.stateTxt, '不发光', { fontSize: 30, color: '#9fb2c8', scale: 0.0044, bg: 'rgba(10,16,24,0.72)' });
  }
  v.targetGlow = on ? 1 : 0;
  firefly.injected++;
}

function resetFirefly() {
  VIALS.forEach((v) => {
    v.injected = false; v.lit = 0; v.targetGlow = 0;
    v.glow.material.opacity = 0;
    v.glow.scale.set(0.01, 0.01, 1);
    setSpriteText(v.stateTxt, '待注入', { fontSize: 30, color: '#9fb2c8', scale: 0.0044, bg: 'rgba(10,16,24,0.72)' });
  });
  firefly.injected = 0;
}

function tickFirefly(dt) {
  VIALS.forEach((v, i) => {
    const want = v.targetGlow ? 1 : 0;
    v.lit += (want - v.lit) * Math.min(1, dt * 2.4);
    const flicker = v.lit > 0.05 ? 0.85 + 0.15 * Math.sin(firefly.t * (7 + i)) : 0;
    const k = v.lit * flicker;
    v.glow.material.opacity = k;
    v.glow.scale.set(2.6 * k + 0.01, 2.6 * k + 0.01, 1);
  });
  fireflyLight.intensity = VIALS[2].lit * (0.8 + 0.2 * Math.sin(firefly.t * 7)) * 22;
}

/* ================= 章节 2：ATP 球棍模型 ================= */

const ATOM = {
  C: { c: 0x5d6b82, r: 0.155 },
  N: { c: 0x4a7de0, r: 0.165 },
  O: { c: 0xe05252, r: 0.15 },
  P: { c: 0xff9d45, r: 0.2 },
};
const bondMat = M(0xaeb9c8, 0.55, 0.1);
const hiMat = M(0xffb054, 0.4, 0.1, { emissive: 0xff7a1a, emissiveIntensity: 0.25 });

const mol = new THREE.Group();
mol.position.set(-0.35, 1.15, 0);
gMolecule.add(mol);

// 原子/键装配工具（XY 平面分子，z 略错开增强立体感）
function atom(sym, x, y, z = 0) {
  const a = ATOM[sym];
  const m = mesh(new THREE.SphereGeometry(a.r, 18, 14), M(a.c, 0.42, 0.08));
  m.position.set(x, y, z);
  mol.add(m);
  return m;
}
function bond(a, b, mat = bondMat, r = 0.05) {
  const va = a.position, vb = b.position;
  const len = va.distanceTo(vb);
  const c = mesh(new THREE.CylinderGeometry(r, r, len, 10), mat);
  c.position.copy(va).add(vb).multiplyScalar(0.5);
  c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), vb.clone().sub(va).normalize());
  mol.add(c);
  return c;
}

// 腺嘌呤：六元环 + 并合五元环
const ade = new THREE.Group();
ade.position.set(0, 1.16, 0);
mol.add(ade);
{
  const hex = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU + TAU / 12;
    hex.push(new THREE.Vector3(Math.cos(a) * 0.46, Math.sin(a) * 0.46, 0));
  }
  const sym6 = ['N', 'C', 'N', 'C', 'N', 'C'];
  const atoms6 = hex.map((p, i) => {
    const m = mesh(new THREE.SphereGeometry(ATOM[sym6[i]].r, 16, 12), M(ATOM[sym6[i]].c, 0.42, 0.08));
    m.position.copy(p); ade.add(m); return m;
  });
  for (let i = 0; i < 6; i++) {
    const va = atoms6[i].position, vb = atoms6[(i + 1) % 6].position;
    const c = mesh(new THREE.CylinderGeometry(0.045, 0.045, va.distanceTo(vb), 8), bondMat);
    c.position.copy(va).add(vb).multiplyScalar(0.5);
    c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), vb.clone().sub(va).normalize());
    ade.add(c);
  }
  // 五元环：共享六元环的 4-5 边（右侧）
  const v4 = hex[4], v5 = hex[5];
  const mid = v4.clone().add(v5).multiplyScalar(0.5);
  const out = mid.clone().normalize();
  const pent = [v4.clone(), out.clone().multiplyScalar(0.62).add(new THREE.Vector3(-0.1, 0.22, 0)), out.clone().multiplyScalar(0.56).add(new THREE.Vector3(0.28, -0.34, 0)), v5.clone()];
  const sym5 = ['C', 'N', 'C', 'N'];
  const atoms5 = pent.map((p, i) => {
    const m = mesh(new THREE.SphereGeometry(ATOM[sym5[i]].r, 16, 12), M(ATOM[sym5[i]].c, 0.42, 0.08));
    m.position.copy(p); ade.add(m); return m;
  });
  for (let i = 0; i < atoms5.length - 1; i++) {
    const va = atoms5[i].position, vb = atoms5[i + 1].position;
    const c = mesh(new THREE.CylinderGeometry(0.045, 0.045, va.distanceTo(vb), 8), bondMat);
    c.position.copy(va).add(vb).multiplyScalar(0.5);
    c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), vb.clone().sub(va).normalize());
    ade.add(c);
  }
  // 氨基（C2 位）
  const nh2 = mesh(new THREE.SphereGeometry(ATOM.N.r, 14, 10), M(ATOM.N.c, 0.42, 0.08));
  nh2.position.copy(hex[0]).multiplyScalar(1.42);
  ade.add(nh2);
}
// 核糖（五元环，XY 平面）
const rib = new THREE.Group();
mol.add(rib);
const ribAtoms = [];
{
  const c1 = new THREE.Vector3(0.34, 0.34, 0);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * TAU - TAU / 4;
    ribAtoms.push(new THREE.Vector3(c1.x + Math.cos(a) * 0.3, c1.y + Math.sin(a) * 0.3, i % 2 ? 0.06 : -0.06));
  }
  const symR = ['C', 'C', 'C', 'O', 'C'];
  const atomsR = ribAtoms.map((p, i) => {
    const m = mesh(new THREE.SphereGeometry(ATOM[symR[i]].r, 16, 12), M(ATOM[symR[i]].c, 0.42, 0.08));
    m.position.copy(p); rib.add(m); return m;
  });
  for (let i = 0; i < 5; i++) {
    const va = atomsR[i].position, vb = atomsR[(i + 1) % 5].position;
    const c = mesh(new THREE.CylinderGeometry(0.042, 0.042, va.distanceTo(vb), 8), bondMat);
    c.position.copy(va).add(vb).multiplyScalar(0.5);
    c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), vb.clone().sub(va).normalize());
    rib.add(c);
  }
  // 糖苷键 C1′—N9
  const c1p = atomsR[0].position;
  const gly = mesh(new THREE.CylinderGeometry(0.042, 0.042, c1p.distanceTo(new THREE.Vector3(0.28, 0.62, 0)), 8), bondMat);
  gly.position.copy(c1p).add(new THREE.Vector3(0.28, 0.62, 0)).multiplyScalar(0.5);
  gly.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0.28, 0.62, 0).sub(c1p).normalize());
  rib.add(gly);
}

// 三磷酸链：O5′ → Pα → ~ → Pβ → ~ → Pγ
const phos = { Ps: [], hi: [], oxy: [], groups: [] };
{
  const chainY = [0.1, -0.34, -0.78];
  const parents = [];
  for (let k = 0; k < 3; k++) {
    const p = mesh(new THREE.SphereGeometry(ATOM.P.r, 18, 14), M(ATOM.P.c, 0.4, 0.1));
    p.position.set(0.78, chainY[k], 0);
    mol.add(p); phos.Ps.push(p);
    // 两个氧（左右）
    for (const dx of [-0.32, 0.34]) {
      const o = mesh(new THREE.SphereGeometry(ATOM.O.r * 0.85, 14, 10), M(ATOM.O.c, 0.42, 0.08));
      o.position.set(0.78 + dx, chainY[k] + 0.1, 0.12);
      mol.add(o); phos.oxy.push(o);
    }
    if (k > 0) {
      const bridge = mesh(new THREE.CylinderGeometry(0.045, 0.045, Math.abs(chainY[k] - chainY[k - 1]) - 0.2, 8), hiMat);
      bridge.position.set(0.78, (chainY[k] + chainY[k - 1]) / 2, 0);
      mol.add(bridge);
      phos.hi.push(bridge);
    }
    const grp = new THREE.Group();
    mol.add(grp); grp.add(p);
    phos.groups.push(grp);
    parents.push(p);
  }
  // O5′ 连接核糖与 Pα
  const o5 = mesh(new THREE.SphereGeometry(ATOM.O.r * 0.9, 14, 10), M(ATOM.O.c, 0.42, 0.08));
  o5.position.set(0.55, 0.32, 0);
  mol.add(o5);
  const b1 = mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.34, 8), bondMat);
  b1.position.set(0.66, 0.26, 0);
  b1.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0.12, -0.28, 0).normalize());
  mol.add(b1);
}

// 标注
const mL_ade = label('腺嘌呤（含氮碱基）', '#9db9ff', 0.0048);
mL_ade.position.set(-1.62, 2.42, 0);
const mL_rib = label('核糖', '#9db9ff', 0.0048);
mL_rib.position.set(-0.72, 0.86, 0);
const mL_phos = label('磷酸基团 ×3', '#ffc38a', 0.0048);
mL_phos.position.set(2.35, 0.42, 0);
const mL_hi = label('~ 特殊化学键', '#ffb054', 0.005);
mL_hi.position.set(2.15, -0.5, 0);
mol.add(mL_ade, mL_rib, mL_phos, mL_hi);

const flash = new THREE.Sprite(new THREE.SpriteMaterial({
  map: makeGlowTexture('255,200,120', [[0, 'rgba(C,1)'], [0.4, 'rgba(C,0.4)'], [1, 'rgba(C,0)']]),
  transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0,
}));
flash.position.set(1.9, 0.6, 0);
flash.scale.set(0.01, 0.01, 1);
mol.add(flash);

const molecule = { hydrolyzed: false, anim: null, count: 0, spin: true, hi: true };

function setHydrolyzed(h) {
  molecule.hydrolyzed = h;
  phos.groups[2].visible = !h;
  phos.hi[1].visible = !h;
  if (h) {
    mL_hi.visible = false;
    mL_phos.position.set(2.35, 0.6, 0);
  } else {
    mL_hi.visible = true;
    mL_phos.position.set(2.35, 0.42, 0);
  }
}

function tickMolecule(dt, t) {
  if (molecule.spin && !molecule.anim) mol.rotation.y = t * 0.35;
  const pulse = molecule.hi ? 0.45 + 0.4 * (0.5 + 0.5 * Math.sin(t * 4.5)) : 0.25;
  hiMat.emissiveIntensity = pulse;
  if (molecule.anim) {
    const a = molecule.anim;
    a.t += dt;
    const k = clamp(a.t / 0.9, 0, 1);
    const ease = 1 - Math.pow(1 - k, 3);
    if (a.kind === 'out') {
      phos.groups[2].position.set(ease * 1.5, ease * 1.9, 0);
      flash.material.opacity = Math.sin(Math.min(k * 1.6, 1) * Math.PI) * 0.9;
      flash.scale.set(2.2 * k + 0.01, 2.2 * k + 0.01, 1);
      if (k >= 1) { setHydrolyzed(true); molecule.anim = null; flash.material.opacity = 0; }
    } else {
      const g = phos.groups[2];
      g.visible = true;
      g.position.set((1 - ease) * 1.5, (1 - ease) * 1.9, 0);
      if (k >= 1) { setHydrolyzed(false); molecule.anim = null; flash.material.opacity = 0; }
    }
  }
}

/* ================= 章节 3：ATP ⇄ ADP 循环 ================= */

const capATP = mesh(new THREE.CapsuleGeometry(0.62, 1.15, 8, 18), M(0xffd257, 0.5, 0.05, { emissive: 0xcf9020, emissiveIntensity: 0.28 }));
capATP.position.set(-2.35, 1.5, 0);
const capADP = mesh(new THREE.CapsuleGeometry(0.55, 1.0, 8, 18), M(0x5f86c9, 0.55));
capADP.position.set(2.35, 1.5, 0);
gCycle.add(capATP, capADP);
const lbATP = label('ATP 充满电', '#ffd257', 0.006);
lbATP.position.set(-2.35, 2.85, 0);
const lbADP = label('ADP + Pi 放电后', '#9db9ff', 0.005);
lbADP.position.set(2.35, 2.72, 0);
gCycle.add(lbATP, lbADP);

function arcCurve(from, to, ctrl) { return new THREE.QuadraticBezierCurve3(from, ctrl, to); }
const arcUp = arcCurve(new THREE.Vector3(2.0, 2.1, 0), new THREE.Vector3(-2.0, 2.1, 0), new THREE.Vector3(0, 3.4, 0));
const arcDn = arcCurve(new THREE.Vector3(-2.0, 0.75, 0), new THREE.Vector3(2.0, 0.75, 0), new THREE.Vector3(0, -1.05, 0));
for (const [curve, color, tip] of [[arcUp, 0x7ddc8f, 1], [arcDn, 0xff9d6e, -1]]) {
  const pts = curve.getPoints(48);
  const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.85 }));
  const cone = mesh(new THREE.ConeGeometry(0.11, 0.3, 12), new THREE.MeshBasicMaterial({ color }));
  const end = pts[pts.length - 1], prev = pts[pts.length - 3];
  cone.position.copy(end);
  cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.clone().sub(prev).normalize());
  gCycle.add(line, cone);
}
const lbSyn = label('合成：ADP＋Pi＋能量 → ATP', '#8fe8a2', 0.0052);
lbSyn.position.set(0, 3.02, 0);
const lbSyn2 = label('能量来自呼吸作用 / 光合作用', '#8fe8a2', 0.004);
lbSyn2.position.set(0, 2.6, 0);
const lbHyd = label('水解：ATP → ADP＋Pi＋能量', '#ffab84', 0.0052);
lbHyd.position.set(0, -0.5, 0);
const lbHyd2 = label('能量用于肌肉收缩·神经传导·合成物质等', '#ffab84', 0.0038);
lbHyd2.position.set(0, -0.94, 0);
gCycle.add(lbSyn, lbSyn2, lbHyd, lbHyd2);

// 循环粒子
const cycleParts = { up: [], dn: [] };
{
  const gUp = M(0xa5f0b4, 0.35), gDn = M(0xffc09a, 0.35);
  for (let i = 0; i < 5; i++) {
    const pu = mesh(new THREE.SphereGeometry(0.09, 10, 8), gUp);
    const pd = mesh(new THREE.SphereGeometry(0.09, 10, 8), gDn);
    gCycle.add(pu, pd);
    cycleParts.up.push({ m: pu, off: i / 5 });
    cycleParts.dn.push({ m: pd, off: i / 5 });
  }
}

const cycle = { up: 2.2, dn: 2.2, made: 0, used: 0, tAcc: 0 };

function tickCycle(dt) {
  cycleParts.up.forEach((p) => {
    p.off = (p.off + dt * cycle.up * 0.14) % 1;
    arcUp.getPoint(p.off, p.m.position);
  });
  cycleParts.dn.forEach((p) => {
    p.off = (p.off + dt * cycle.dn * 0.14) % 1;
    arcDn.getPoint(p.off, p.m.position);
  });
  capATP.material.emissiveIntensity = 0.22 + 0.14 * Math.sin(performance.now() * 0.004) * (cycle.up / 5);
}

/* ================= 章节 4：ATP 合酶 ================= */

const mem = mesh(new THREE.BoxGeometry(9.2, 0.6, 3.6), M(0xd9b878, 0.62, 0, { transparent: true, opacity: 0.55 }));
mem.position.y = 0;
gSynth.add(mem);
// 磷脂头部示意
{
  const hm = M(0xf2d9a0, 0.5);
  for (let i = 0; i < 16; i++) {
    const s1 = mesh(new THREE.SphereGeometry(0.14, 8, 6), hm);
    s1.position.set(-4.2 + i * 0.56, 0.36, -1.2 + (i % 3) * 1.1);
    const s2 = s1.clone(); s2.position.y = -0.36;
    gSynth.add(s1, s2);
  }
}
const lbOut = label('膜间隙 · H⁺ 浓度高', '#9adfff', 0.0052);
lbOut.position.set(-3.1, 2.62, 0);
const lbIn = label('线粒体基质 · H⁺ 浓度低', '#b9c8dd', 0.0052);
lbIn.position.set(-3.1, -1.62, 0);
gSynth.add(lbOut, lbIn);

// 转子：c 环 + γ 轴 + F1 头
const rotor = new THREE.Group();
gSynth.add(rotor);
const cRing = new THREE.Group();
rotor.add(cRing);
for (let i = 0; i < 8; i++) {
  const a = (i / 8) * TAU;
  const c = mesh(new THREE.BoxGeometry(0.52, 0.52, 0.44), M(0xc4574e, 0.5));
  c.position.set(Math.cos(a) * 0.82, 0, Math.sin(a) * 0.82);
  c.rotation.y = -a;
  cRing.add(c);
}
const stalk = mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.15, 10), M(0xd9dde5, 0.4, 0.2));
stalk.position.y = 0.86;
rotor.add(stalk);
const f1 = new THREE.Group();
f1.position.y = 1.85;
rotor.add(f1);
for (let i = 0; i < 6; i++) {
  const a = (i / 6) * TAU;
  const isBeta = i % 2 === 1;
  const sub = mesh(new THREE.CapsuleGeometry(0.3, 0.52, 6, 12), M(isBeta ? 0xe08a3c : 0x6f7d95, 0.55));
  sub.position.set(Math.cos(a) * 0.95, 0, Math.sin(a) * 0.95);
  sub.rotation.y = -a + Math.PI / 2;
  f1.add(sub);
}
const cap1 = mesh(new THREE.SphereGeometry(0.52, 18, 14), M(0x8892a5, 0.5));
cap1.scale.set(1, 0.62, 1);
cap1.position.y = 0.62;
f1.add(cap1);

// 定子臂（不旋转）
const stator1 = mesh(new THREE.BoxGeometry(0.34, 1.9, 0.34), M(0x9aa6b8, 0.55));
stator1.position.set(1.45, 1.3, 0);
const stator2 = mesh(new THREE.BoxGeometry(0.9, 0.28, 0.34), M(0x9aa6b8, 0.55));
stator2.position.set(1.0, 2.32, 0);
gSynth.add(stator1, stator2);
const aSub = mesh(new THREE.BoxGeometry(0.4, 0.72, 0.7), M(0x7a6f9d, 0.55));
aSub.position.set(1.35, 0, 0);
gSynth.add(aSub);

// H⁺ 粒子池
const protons = [];
{
  const pm = new THREE.MeshBasicMaterial({ color: 0x9adfff, transparent: true });
  for (let i = 0; i < 26; i++) {
    const p = mesh(new THREE.SphereGeometry(0.075, 8, 6), pm.clone());
    p.visible = false;
    gSynth.add(p);
    protons.push({ m: p, phase: 'idle', x: 0, y: 0, z: 0, t: 0, seed: Math.random() });
  }
}
// ADP/Pi 原料与 ATP 产物
const feeds = [];
{
  for (let i = 0; i < 6; i++) {
    const g = new THREE.Group();
    const adp = mesh(new THREE.SphereGeometry(0.1, 8, 6), new THREE.MeshBasicMaterial({ color: 0x8fb4ff }));
    const pi = mesh(new THREE.SphereGeometry(0.085, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffc38a }));
    pi.position.x = 0.24;
    g.add(adp, pi);
    g.visible = false;
    gSynth.add(g);
    feeds.push({ m: g, t: 0, active: false });
  }
}
const atpOut = [];
{
  for (let i = 0; i < 6; i++) {
    const m = mesh(new THREE.SphereGeometry(0.13, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffd257, transparent: true }));
    m.visible = false;
    gSynth.add(m);
    atpOut.push({ m, t: 0, active: false, dir: 1 });
  }
}
const synthFlash = new THREE.Sprite(new THREE.SpriteMaterial({
  map: makeGlowTexture('255,214,120'), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0,
}));
synthFlash.position.y = 1.85;
synthFlash.scale.set(0.01, 0.01, 1);
gSynth.add(synthFlash);

const synth = {
  gradient: 6, paused: false, angle: 0, spinRate: 0,
  made: 0, protonsThrough: 0, emitAcc: 0, spawnAcc: 0, feedAcc: 0, showFlow: true, flash: 0,
};

function spawnProton() {
  const p = protons.find((x) => x.phase === 'idle');
  if (!p) return;
  p.phase = 'approach';
  p.x = (Math.random() - 0.5) * 7;
  p.z = (Math.random() - 0.5) * 2.6;
  p.y = 2.9;
  p.t = 0;
  p.m.visible = synth.showFlow;
  p.m.position.set(p.x, p.y, p.z);
  p.m.material.opacity = 1;
}

function tickSynth(dt) {
  const rate = synth.paused ? 0 : synth.gradient * 0.85;          // 每秒 H⁺ 数
  synth.spawnAcc += dt * rate;
  while (synth.spawnAcc >= 1) { spawnProton(); synth.spawnAcc -= 1; }
  synth.spinRate = synth.paused ? 0 : clamp(rate * 0.55, 0.5, 5.2);
  synth.angle += dt * synth.spinRate;
  rotor.rotation.y = synth.angle;
  synth.emitAcc += dt * synth.spinRate / TAU;                     // 每转 1 圈产 3 个 ATP（示意）
  while (synth.emitAcc >= 1 / 3) {
    synth.emitAcc -= 1 / 3;
    const a = atpOut.find((x) => !x.active);
    if (a) {
      a.active = true; a.t = 0;
      a.dir = Math.random() > 0.5 ? 1 : -1;
      a.m.visible = true;
      a.m.position.set(0, 1.85, 0);
      synth.made++;
      synth.flash = 1;
    }
  }
  synth.feedAcc += dt * 0.7;
  if (synth.feedAcc >= 1) {
    synth.feedAcc = 0;
    const f = feeds.find((x) => !x.active);
    if (f) { f.active = true; f.t = 0; f.m.visible = true; }
  }
  // 粒子推进
  const funnel = new THREE.Vector3(1.18, 0.55, 0);
  protons.forEach((p) => {
    if (p.phase === 'idle') return;
    p.t += dt;
    const m = p.m;
    if (p.phase === 'approach') {
      const tgt = funnel;
      const k = Math.min(1, dt * 1.6);
      m.position.lerp(tgt, k);
      if (m.position.distanceTo(tgt) < 0.14) { p.phase = 'through'; p.t = 0; }
    } else if (p.phase === 'through') {
      const k = p.t / 0.85;
      const ang = synth.angle * 2 + p.seed * TAU;
      m.position.set(Math.cos(ang) * 0.6, 0.45 - k * 1.45, Math.sin(ang) * 0.6);
      if (k >= 1) { p.phase = 'exit'; p.t = 0; synth.protonsThrough++; }
    } else {
      const k = Math.min(1, p.t / 0.9);
      m.position.y = -1.05 - k * 0.9;
      m.material.opacity = 1 - k;
      if (k >= 1) { p.phase = 'idle'; m.visible = false; }
    }
    m.visible = m.visible && synth.showFlow || p.phase === 'through';
  });
  feeds.forEach((f) => {
    if (!f.active) return;
    f.t += dt;
    const k = f.t / 1.4;
    if (k >= 1) { f.active = false; f.m.visible = false; return; }
    const ang = synth.angle + Math.PI / 2;
    f.m.position.set(Math.cos(ang) * 1.9 * (1 - k), 1.85 + (1 - k) * -1.6 * k, Math.sin(ang) * 1.9 * (1 - k));
    f.m.visible = k < 0.92;
  });
  atpOut.forEach((a) => {
    if (!a.active) return;
    a.t += dt;
    const k = a.t / 1.1;
    if (k >= 1) { a.active = false; a.m.visible = false; return; }
    const ang = synth.angle + a.dir * Math.PI / 3;
    a.m.position.set(Math.cos(ang) * (1.1 + k * 1.6), 1.85 + k * 1.1, Math.sin(ang) * (1.1 + k * 1.6));
    a.m.material.opacity = 1 - k;
  });
  synth.flash = Math.max(0, synth.flash - dt * 2.2);
  synthFlash.material.opacity = synth.flash * 0.75;
  synthFlash.scale.set(0.5 + synth.flash * 1.4, 0.5 + synth.flash * 1.4, 1);
}

/* ---------------- 章节定义 ---------------- */

const ctl = createControlsPanel(document.getElementById('controls'));
let activeSectionId = null;
let activeCtl = null;

const hud = makeHUD(stage, [['a', '状态'], ['b', '读数'], ['c', '补充']]);
hud.visibleNow = false;

function enterDefaults() {
  showGroup(gFirefly);
  hud.visibleNow = false;
  amb.intensity = 1.05;
  key.intensity = 1.9;
}

const SECTIONS = [
  {
    id: 'firefly',
    title: '萤火虫的光从哪里来',
    html: `<p>把萤火虫的发光器捣碎做成研磨液，加入水后荧光就熄灭了；但加入某些物质又能让它<b>重新发光</b>。</p>
<p>经典实验对照：① 加蒸馏水 → 不亮；② 加葡萄糖 → 不亮；③ 加 <span class="hl">ATP</span> → 亮了！④ 把研磨液煮沸再加 ATP → 仍不亮（酶已高温失活）。</p>
<p>结论：萤火虫发光消耗的直接能源是 <span class="hl">ATP</span>，而不是葡萄糖——葡萄糖里的能量必须先经呼吸作用转移到 ATP 中，才能被生命活动直接利用。所以 ATP 被称为细胞的能量“货币”。</p>
<p>动手：依次给四支试管注入试剂，打开「暗场」观察谁在发光。</p>`,
    enter() {
      enterDefaults();
      resetFirefly();
      app.setCamera([0.2, 2.5, 6.2], [0, 0.9, 0]);
      hud.visibleNow = true;
      hud.set('c', '对照实验：单一变量（注入物不同）');
      ctl.clear();
      VIALS.forEach((v, i) => {
        ctl.button({ label: `注入${v.name}`, onClick: () => injectVial(i) });
        if (i === 1) ctl.sep();
      });
      ctl.sep();
      ctl.toggle({
        label: '暗场', value: false,
        onChange: (v) => { amb.intensity = v ? 0.14 : 1.05; key.intensity = v ? 0.3 : 1.9; },
      });
      ctl.button({ label: '重置', onClick: () => resetFirefly() });
      firefly.updateHud = () => {
        hud.set('a', `已注入 ${firefly.injected} / 4 管`);
        const lit = VIALS.map((v) => (v.lit > 0.25 ? '✦ 亮' : '—')).join('　');
        hud.set('b', lit);
      };
    },
  },
  {
    id: 'molecule',
    title: 'ATP 的结构',
    html: `<p>ATP（三磷酸腺苷）的结构简式：<span class="hl">A—P~P~P</span>。</p>
<p>其中 A = <b>腺苷</b>（腺嘌呤 + 核糖），P = 磷酸基团。<b>“~”代表特殊化学键</b>——水解时释放的能量远多于普通化学键（结构式中两个 ~）。</p>
<p>远离腺苷的那个特殊化学键最容易断裂：水解后释放能量，生成 <b>ADP + Pi</b>。点「💧 水解」看末端磷酸基团带着能量飞走，再点「⚡ 重新合成」把它接回去。</p>`,
    enter() {
      enterDefaults();
      showGroup(gMolecule);
      setHydrolyzed(false);
      phos.groups[2].position.set(0, 0, 0);
      molecule.anim = null;
      app.setCamera([0.35, 1.35, 5.9], [0, 1.3, 0]);
      hud.visibleNow = true;
      ctl.clear();
      ctl.toggle({
        label: '自转', value: true,
        onChange: (v) => { molecule.spin = v; },
      });
      ctl.toggle({
        label: '高亮特殊化学键', value: true,
        onChange: (v) => { molecule.hi = v; },
      });
      const hb = ctl.button({
        label: '💧 水解',
        onClick: () => {
          if (molecule.anim) return;
          if (!molecule.hydrolyzed) {
            molecule.anim = { kind: 'out', t: 0 };
            molecule.count++;
            molecule.spin = false;
            spinTgl.set(false);
            hb.textContent = '⚡ 重新合成';
          } else {
            molecule.anim = { kind: 'in', t: 0 };
            hb.textContent = '💧 水解';
          }
        },
      });
      const spinTgl = { set(v) { molecule.spin = v; } };
      molecule.updateHud = () => {
        hud.set('a', molecule.hydrolyzed ? 'ADP ＋ Pi' : 'ATP');
        hud.set('b', molecule.hydrolyzed ? '剩余特殊化学键 1 个' : '特殊化学键 2 个');
        hud.set('c', `已演示水解 ${molecule.count} 次`);
      };
    },
  },
  {
    id: 'cycle',
    title: 'ATP 与 ADP 的相互转化',
    html: `<p>ATP 与 ADP 在活细胞中不停顿地循环：<b>水解</b>（ATP → ADP＋Pi＋能量）为各项生命活动供能；<b>合成</b>（ADP＋Pi＋能量 → ATP）把呼吸作用 / 光合作用释放的能量重新“存进电池”。</p>
<p>这个转化<b>时刻不停地发生且处于动态平衡</b>：细胞内 ATP 含量很少，但转化极其迅速——成年人一天转化的 ATP 总量可达数十千克。</p>
<p>分别拖动「合成速率」「水解速率」两个滑杆：当两者相等时，系统处于动态平衡——这正是“货币”流通的常态。</p>`,
    enter() {
      enterDefaults();
      showGroup(gCycle);
      app.setCamera([0, 1.7, 7.2], [0, 1.3, 0]);
      hud.visibleNow = true;
      ctl.clear();
      ctl.slider({
        label: '合成速率', min: 0, max: 5, step: 0.1, value: cycle.up,
        fmt: (v) => v.toFixed(1),
        onInput: (v) => { cycle.up = v; },
      });
      ctl.slider({
        label: '水解速率', min: 0, max: 5, step: 0.1, value: cycle.dn,
        fmt: (v) => v.toFixed(1),
        onInput: (v) => { cycle.dn = v; },
      });
      cycle.updateHud = () => {
        const d = cycle.up - cycle.dn;
        hud.set('a', Math.abs(d) < 0.2 ? '动态平衡' : d > 0 ? 'ATP 倾向积累' : 'ATP 供不应求');
        hud.set('b', `合成 ${Math.round(cycle.made)} 次 / 水解 ${Math.round(cycle.used)} 次`);
        hud.set('c', '细胞内 ATP 含量少 · 转化极快');
      };
    },
  },
  {
    id: 'synthase',
    title: 'ATP 合酶',
    html: `<p>合成 ATP 的主力是一台“分子马达”——<span class="hl">ATP 合酶</span>，嵌在线粒体内膜上。</p>
<p>它由嵌膜的 <b>F₀（c 环）</b> 和凸出基质的 <b>F₁ 头部（α₃β₃）</b> 组成：H⁺ 顺浓度梯度从膜间隙经 F₀ 回到基质，像水流推动水轮机一样<b>驱动 c 环与中心轴（γ）旋转</b>；γ 轴的扭动让 β 亚基循环变构，把 ADP＋Pi 合成 ATP——这就是<b>旋转催化</b>。</p>
<p>拖动「H⁺ 浓度梯度」加大质子流，看转速与 ATP 产量如何上升。</p>`,
    enter() {
      enterDefaults();
      showGroup(gSynth);
      synth.made = 0; synth.protonsThrough = 0; synth.angle = 0;
      app.setCamera([3.4, 2.2, 6.6], [0, 1.0, 0]);
      hud.visibleNow = true;
      ctl.clear();
      ctl.slider({
        label: 'H⁺ 浓度梯度', min: 1, max: 10, step: 1, value: synth.gradient,
        fmt: (v) => '×' + v,
        onInput: (v) => { synth.gradient = v; },
      });
      ctl.toggle({
        label: '暂停旋转', value: false,
        onChange: (v) => { synth.paused = v; },
      });
      ctl.toggle({
        label: '显示 H⁺ 流', value: true,
        onChange: (v) => {
          synth.showFlow = v;
          protons.forEach((p) => { if (p.phase !== 'through') p.m.visible = v && p.phase !== 'idle'; });
        },
      });
      synth.updateHud = () => {
        hud.set('a', `转速 ≈ ${(synth.spinRate / TAU).toFixed(1)} 圈/秒`);
        hud.set('b', `累计 ATP ${synth.made} 个 · H⁺ 通过 ${synth.protonsThrough}`);
        hud.set('c', '质子流 → 旋转 → 变构合成');
      };
    },
  },
  {
    id: 'quiz',
    title: '随堂检测',
    html: `<p>5 道选择题，检验一下本节课的掌握情况。答完可重新开始。</p>`,
    enter() {
      enterDefaults();
      showGroup(gMolecule);
      molecule.spin = true; molecule.hi = true;
      app.setCamera([0.35, 1.35, 5.9], [0, 1.3, 0]);
      ctl.clear();
      hud.visibleNow = false;
      showQuiz();
    },
  },
];

/* ---------------- 随堂检测 ---------------- */

const QUIZ = [
  {
    q: '萤火虫发光器离体实验中，能让研磨组织重新发光的物质是？',
    opts: ['葡萄糖', 'ATP', '蛋白质', '蒸馏水'],
    a: 1,
    ex: 'ATP 是细胞生命活动的直接能源物质；葡萄糖中的能量必须先经呼吸作用转移到 ATP 中才能被直接利用。',
  },
  {
    q: 'ATP 结构简式 A—P~P~P 中的“~”代表？',
    opts: ['普通化学键', '特殊化学键，水解释放大量能量', '氢键', '肽键'],
    a: 1,
    ex: '“~”是特殊化学键，其水解释放的能量远多于普通化学键，ATP 结构式中有两个这样的键。',
  },
  {
    q: 'ATP 水解的产物是？',
    opts: ['ADP ＋ Pi ＋ 能量', 'AMP ＋ 能量', '腺苷 ＋ 3 个磷酸', 'CO₂ 和 H₂O'],
    a: 0,
    ex: '远离腺苷的特殊化学键断裂，ATP 水解生成 ADP（二磷酸腺苷）、Pi（游离磷酸）并释放能量。',
  },
  {
    q: '绿色植物体内，合成 ATP 的能量来源是？',
    opts: ['只有呼吸作用', '只有光合作用', '光合作用和呼吸作用', 'ATP 自身水解'],
    a: 2,
    ex: '光合作用（光反应）与呼吸作用都能把能量转移到 ATP 中；动物与人体则只能靠呼吸作用合成 ATP。',
  },
  {
    q: '驱动 ATP 合酶（F₀F₁-ATPase）旋转的直接动力是？',
    opts: ['电子传递', 'H⁺ 顺浓度梯度通过 F₀', 'ADP 与 Pi 的碰撞', '葡萄糖氧化放热'],
    a: 1,
    ex: '线粒体内膜两侧 H⁺ 浓度差（跨膜质子动力势）驱动 H⁺ 经 F₀ 回流，推动 c 环与 γ 轴旋转，β 亚基循环变构合成 ATP。',
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
}

/* ---------------- 主循环 ---------------- */

app.onFrame((dt, t) => {
  cameraTweenTick(app, dt);
  hud.el.style.display = hud.visibleNow ? '' : 'none';
  firefly.t = t;
  if (activeSectionId === 'firefly') {
    tickFirefly(dt);
    if (firefly.updateHud) firefly.updateHud();
  } else if (activeSectionId === 'molecule' || activeSectionId === 'quiz') {
    tickMolecule(dt, t);
    if (molecule.updateHud && hud.visibleNow) molecule.updateHud();
  } else if (activeSectionId === 'cycle') {
    cycle.made += dt * cycle.up * 0.5;
    cycle.used += dt * cycle.dn * 0.5;
    tickCycle(dt);
    cycle.tAcc += dt;
    if (cycle.tAcc > 0.25 && cycle.updateHud) { cycle.tAcc = 0; cycle.updateHud(); }
  } else if (activeSectionId === 'synthase') {
    tickSynth(dt);
    if (synth.updateHud) synth.updateHud();
  }
});

/* ---------------- 启动 ---------------- */

loader.hide();
const sections = createSections({
  nav: document.getElementById('sideNav'),
  descPanel: document.getElementById('descPanel'),
  sections: SECTIONS,
  onSelect(i, sec) {
    activeSectionId = sec.id;
    sec.enter();
  },
});
window.__eduSections = sections;
sections.select(0);
