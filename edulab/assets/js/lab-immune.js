/* EduLab · 体液免疫（immune）
 * 章节：人体三道防线 / 体液免疫的过程 / 二次免疫与疫苗 / 过敏反应 / 随堂检测
 * 场景：皮肤剖面（三道防线 + 吞噬细胞）、淋巴结内体液免疫全过程（树突状细胞→辅助性T→B细胞→浆细胞/记忆细胞→抗体凝集，
 *       可关闭辅助性T/细胞因子看后果）、初次与二次免疫抗体曲线（疫苗对照）、过敏反应两阶段（IgE 致敏→组胺释放）。
 */
import {
  THREE, TAU, clamp,
  createApp, cameraTweenTick, makeLoader,
  createSections, createControlsPanel, makeHUD, makeTextSprite, setSpriteText,
} from './edu-core.js';

/* ---------------- 基础 ---------------- */

const stage = document.getElementById('stage');
const loader = makeLoader(stage, '正在培养免疫细胞…');
const app = createApp({
  container: stage,
  fov: 42, near: 0.1, far: 200,
  cameraPos: [0, 2.4, 8.0], target: [0, 0.5, 0],
  minDistance: 1.0, maxDistance: 40,
});
const { scene, camera, controls } = app;

const amb = new THREE.AmbientLight(0xe8eef8, 1.05);
scene.add(amb);
const key = new THREE.DirectionalLight(0xfff2e0, 1.8);
key.position.set(5, 8, 6);
scene.add(key);
const fill = new THREE.DirectionalLight(0xbcd4ff, 0.5);
fill.position.set(-6, 3, -5);
scene.add(fill);

const M = (color, rough = 0.65, metal = 0, extra = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, ...extra });
const mesh = (geo, mat) => new THREE.Mesh(geo, mat);
function label(text, color = '#ffffff', scale = 0.005, bg = 'rgba(10,16,24,0.72)') {
  return makeTextSprite(text, { fontSize: 32, color, scale, bg });
}

const C_VIRUS = 0xe05252, C_APC = 0x7fc9a8, C_TCELL = 0x6f9de0, C_BCELL = 0xb08fd9;
const C_PLASMA = 0xe08a5c, C_MEMORY = 0x8f6fd9, C_AB = 0xffd166, C_MACRO = 0xd9b088;

/* ---------------- 通用细胞小件 ---------------- */

function makeVirus(scale = 1) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.SphereGeometry(0.22, 14, 10), M(C_VIRUS, 0.5)));
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * TAU, b = Math.asin((i % 5) / 5 * 2 - 0.8);
    const s = mesh(new THREE.ConeGeometry(0.05, 0.14, 6), M(0xc23e3e, 0.5));
    s.position.set(Math.cos(a) * Math.cos(b) * 0.24, Math.sin(b) * 0.24, Math.sin(a) * Math.cos(b) * 0.24);
    s.lookAt(s.position.clone().multiplyScalar(2));
    s.rotateX(TAU / 4);
    g.add(s);
  }
  g.scale.setScalar(scale);
  return g;
}

function makeYAntibody(color = C_AB) {
  const g = new THREE.Group();
  const m = M(color, 0.4);
  const stem = mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.24, 6), m);
  stem.position.y = 0.12;
  const armL = mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.16, 6), m);
  armL.position.set(-0.07, 0.3, 0); armL.rotation.z = 0.55;
  const armR = mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.16, 6), m);
  armR.position.set(0.07, 0.3, 0); armR.rotation.z = -0.55;
  g.add(stem, armL, armR);
  return g;
}

function makeImmuneCell(color, r = 0.45, receptors = 0, recColor = 0xffffff) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.SphereGeometry(r, 20, 14), M(color, 0.5, 0, { transparent: true, opacity: 0.92 })));
  const nuc = mesh(new THREE.SphereGeometry(r * 0.4, 12, 10), M(0x5a4a8f, 0.6));
  nuc.position.set(r * 0.2, r * 0.2, r * 0.15);
  g.add(nuc);
  for (let i = 0; i < receptors; i++) {
    const a = (i / receptors) * TAU;
    const rec = mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.16, 5), M(recColor, 0.4));
    rec.position.set(Math.cos(a) * r, Math.sin(i * 1.3) * r * 0.5, Math.sin(a) * r);
    rec.rotation.z = TAU / 4;
    g.add(rec);
  }
  return g;
}

function makeDendritic() {
  const g = new THREE.Group();
  g.add(mesh(new THREE.SphereGeometry(0.42, 18, 14), M(C_APC, 0.5)));
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU, b = ((i * 7) % 10) / 10 * 2 - 1;
    const tent = mesh(new THREE.ConeGeometry(0.05, 0.5, 6), M(0x5fa888, 0.5));
    tent.position.set(Math.cos(a) * Math.cos(b) * 0.5, Math.sin(b) * 0.5, Math.sin(a) * Math.cos(b) * 0.5);
    tent.lookAt(tent.position.clone().multiplyScalar(3));
    tent.rotateX(TAU / 4);
    g.add(tent);
  }
  return g;
}

/* ================= 场景一：皮肤剖面（三道防线 / 过敏共用） ================= */

const gDefense = new THREE.Group();
gDefense.visible = false;
scene.add(gDefense);

const defenseBits = {};
{
  // 表皮（角质层 + 表皮细胞层）
  const horny = mesh(new THREE.BoxGeometry(11, 0.28, 3.4), M(0xe8d9c0, 0.7));
  horny.position.y = 2.1;
  const epidermis = mesh(new THREE.BoxGeometry(11, 0.7, 3.4), M(0xd9c4a8, 0.75));
  epidermis.position.y = 1.62;
  gDefense.add(horny, epidermis);
  // 真皮 + 皮下
  const dermis = mesh(new THREE.BoxGeometry(11, 2.4, 3.4), M(0xe0b4a0, 0.8, 0, { transparent: true, opacity: 0.42 }));
  dermis.position.y = 0.07;
  gDefense.add(dermis);
  // 表皮细胞纹理
  const cellMat = M(0xc9a888, 0.8);
  for (let i = 0; i < 12; i++) {
    const c = mesh(new THREE.BoxGeometry(0.72, 0.5, 2.8), cellMat);
    c.position.set(-5.1 + i * 0.93, 1.62, 0);
    gDefense.add(c);
  }
  // 血管（真皮内弯管）
  const vesselPts = [];
  for (let i = 0; i <= 30; i++) {
    const t = i / 30;
    vesselPts.push(new THREE.Vector3(-5 + t * 10, -0.5 + Math.sin(t * TAU * 1.2) * 0.35, Math.cos(t * 4) * 0.5));
  }
  const vessel = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(vesselPts), 90, 0.16, 10), M(0xc9524e, 0.5));
  gDefense.add(vessel);
  // 血细胞
  const rbm = M(0xe0625e, 0.5);
  for (let i = 0; i < 10; i++) {
    const r = mesh(new THREE.SphereGeometry(0.09, 8, 6), rbm);
    const t = i / 10;
    r.position.set(-5 + t * 10, -0.5 + Math.sin(t * TAU * 1.2) * 0.35, Math.cos(t * 4) * 0.5);
    gDefense.add(r);
  }
  defenseBits.labels = new THREE.Group();
  gDefense.add(defenseBits.labels);
  const l1 = label('第一道防线：皮肤 · 黏膜（屏障）', '#ffd9a8', 0.0042);
  l1.position.set(0, 2.75, 0);
  const l2 = label('体液中的杀菌物质 · 吞噬细胞（第二道）', '#bfe2f8', 0.0042);
  l2.position.set(-3.6, -1.45, 2.2);
  defenseBits.labels.add(l1, l2);
}

// 吞噬细胞（第二道防线演示）
const macro = new THREE.Group();
macro.position.set(1.6, 0.9, 1.9);
{
  const body = mesh(new THREE.SphereGeometry(0.5, 18, 14), M(C_MACRO, 0.55));
  body.scale.set(1.2, 0.9, 1);
  macro.add(body);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * TAU;
    const pod = mesh(new THREE.SphereGeometry(0.16, 10, 8), M(0xc9a078, 0.6));
    pod.position.set(Math.cos(a) * 0.62, Math.sin(a * 2) * 0.3, Math.sin(a) * 0.45);
    macro.add(pod);
  }
}
gDefense.add(macro);
const macroPrey = makeVirus(1);
macroPrey.position.set(2.6, 1.9, 1.9);
gDefense.add(macroPrey);
const macroLbl = label('吞噬细胞：摄取·消化病原体', '#ffe0b0', 0.004);
macroLbl.position.set(1.6, 0.02, 1.9);
gDefense.add(macroLbl);

// 入侵病原体群（第一/二道防线演示）
const invaders = [];
{
  for (let i = 0; i < 6; i++) {
    const v = makeVirus(1);
    v.position.set(-4 + i * 1.6, 3.6 + Math.random() * 0.8, 1.9);
    v.userData.tgt = new THREE.Vector3(v.position.x, 0.6 + Math.random() * 0.8, v.position.z);
    v.userData.speed = 0.35 + Math.random() * 0.25;
    gDefense.add(v);
    invaders.push(v);
  }
}

// 过敏线（默认隐藏）：肥大细胞 + IgE + 组胺
const gAllergy = new THREE.Group();
gAllergy.visible = false;
gDefense.add(gAllergy);
const mast = new THREE.Group();
mast.position.set(-1.8, 0.8, 1.9);
{
  const body = mesh(new THREE.SphereGeometry(0.52, 18, 14), M(0xd988b8, 0.5));
  mast.add(body);
  const granules = [];
  for (let i = 0; i < 9; i++) {
    const a = Math.random() * TAU, b = (Math.random() - 0.5) * 2;
    const gr = mesh(new THREE.SphereGeometry(0.09, 8, 6), M(0xe0526e, 0.45));
    gr.position.set(Math.cos(a) * 0.3, Math.sin(b) * 0.3, Math.sin(a) * 0.3);
    mast.add(gr);
    granules.push(gr);
  }
  mast.userData.granules = granules;
}
gAllergy.add(mast);
const igeDots = [];
{
  const im = M(C_AB, 0.5);
  for (let i = 0; i < 8; i++) {
    const d = mesh(new THREE.SphereGeometry(0.05, 8, 6), im);
    const a = (i / 8) * TAU;
    d.position.set(mast.position.x + Math.cos(a) * 0.55, mast.position.y + Math.sin(a) * 0.55, mast.position.z + 0.15);
    d.visible = false;
    gAllergy.add(d);
    igeDots.push(d);
  }
}
const histamine = [];
{
  const hm = new THREE.MeshBasicMaterial({ color: 0xff6a8a });
  for (let i = 0; i < 14; i++) {
    const h = mesh(new THREE.SphereGeometry(0.06, 8, 6), hm);
    h.visible = false;
    gAllergy.add(h);
    histamine.push({ m: h, t: -1 });
  }
}
const allergyLbl = label('肥大细胞（表面结合 IgE）', '#f2b8d0', 0.004);
allergyLbl.position.set(-1.8, 0.02, 1.9);
gAllergy.add(allergyLbl);

const defense = { released: false, phase: 0, macroT: 0, histT: 0, allergen: null, second: false };

function tickDefense(dt) {
  invaders.forEach((v) => {
    if (!defense.released) return;
    v.position.lerp(v.userData.tgt, dt * v.userData.speed);
  });
  if (defense.released && defense.macroT < 1) {
    defense.macroT += dt * 0.25;
    const k = clamp(defense.macroT, 0, 1);
    macroPrey.position.lerpVectors(new THREE.Vector3(2.6, 1.9, 1.9), macro.position.clone().add(new THREE.Vector3(0, 0.2, 0)), k);
    macroPrey.scale.setScalar(1 - k * 0.6);
    if (k >= 1) macroPrey.visible = false;
  }
  if (defense.histT > 0) {
    defense.histT += dt;
    histamine.forEach((h, i) => {
      if (h.t < 0 && i / histamine.length < defense.histT * 0.8) { h.t = 0; h.m.visible = true; }
      if (h.t >= 0) {
        h.t += dt;
        const a = (i / histamine.length) * TAU;
        h.m.position.set(
          mast.position.x + Math.cos(a) * (0.6 + h.t * 1.6),
          mast.position.y + Math.sin(a * 2) * (0.3 + h.t * 1.2),
          mast.position.z + Math.sin(a) * (0.6 + h.t * 1.6)
        );
        h.m.material.opacity = clamp(1.4 - h.t * 0.5, 0, 1);
        if (h.t > 2.6) { h.m.visible = false; h.t = -1; }
      }
    });
  }
}

function resetDefense(withAllergy = false) {
  defense.released = false; defense.macroT = 0; defense.histT = 0; defense.second = false;
  invaders.forEach((v) => {
    v.position.set(-4 + invaders.indexOf(v) * 1.6, 3.6 + Math.random() * 0.8, 1.9);
    v.visible = true;
  });
  macroPrey.visible = true;
  macroPrey.position.set(2.6, 1.9, 1.9);
  macroPrey.scale.setScalar(1);
  igeDots.forEach((d) => { d.visible = withAllergy; });
  histamine.forEach((h) => { h.t = -1; h.m.visible = false; });
  gAllergy.visible = withAllergy;
}

/* ================= 场景二：淋巴结 · 体液免疫 ================= */

const gImmune = new THREE.Group();
gImmune.visible = false;
scene.add(gImmune);

const immune = {};
{
  // 淋巴结轮廓（大扁球内壁）
  const shell = mesh(new THREE.SphereGeometry(5.2, 48, 32), M(0xe8c9d9, 0.6, 0, { transparent: true, opacity: 0.14, side: THREE.BackSide }));
  gImmune.add(shell);
  // 病毒群（从左侧流入）
  immune.viruses = [];
  for (let i = 0; i < 5; i++) {
    const v = makeVirus(0.9);
    v.position.set(-6.5, 1.5 + i * 0.5, (Math.random() - 0.5) * 2);
    gImmune.add(v);
    immune.viruses.push(v);
  }
  // 树突状细胞
  immune.apc = makeDendritic();
  immune.apc.position.set(-2.2, 2.2, 0);
  gImmune.add(immune.apc);
  const apcLbl = label('树突状细胞：摄取·处理·呈递抗原', '#a8e8cc', 0.0042);
  apcLbl.position.set(-2.2, 3.35, 0);
  gImmune.add(apcLbl);
  immune.apcAntigen = mesh(new THREE.SphereGeometry(0.1, 10, 8), M(C_VIRUS, 0.4));
  immune.apcAntigen.position.set(-1.72, 2.5, 0.1);
  immune.apcAntigen.visible = false;
  gImmune.add(immune.apcAntigen);
  // 辅助性 T 细胞
  immune.helper = makeImmuneCell(C_TCELL, 0.42, 8, 0xd9e8ff);
  immune.helper.position.set(-4.6, -0.6, 0.4);
  gImmune.add(immune.helper);
  const helperLbl = label('辅助性 T 细胞', '#a8c4ff', 0.0042);
  helperLbl.position.set(-4.6, 0.35, 0.4);
  gImmune.add(helperLbl);
  // 细胞因子
  immune.cytokines = [];
  {
    const cm = new THREE.MeshBasicMaterial({ color: 0x8fe8a2 });
    for (let i = 0; i < 8; i++) {
      const c = mesh(new THREE.SphereGeometry(0.055, 8, 6), cm);
      c.visible = false;
      gImmune.add(c);
      immune.cytokines.push({ m: c, t: -1, delay: i * 0.12 });
    }
  }
  // B 细胞
  immune.bcell = makeImmuneCell(C_BCELL, 0.55, 12, 0xe8d9ff);
  immune.bcell.position.set(0.5, -1.8, 0);
  gImmune.add(immune.bcell);
  const bLbl = label('B 细胞', '#d9c4ff', 0.0042);
  bLbl.position.set(0.5, -0.75, 0);
  gImmune.add(bLbl);
  // 浆细胞与记忆细胞（分裂分化产物，初始隐藏）
  immune.plasma = [];
  immune.memory = [];
  for (let i = 0; i < 3; i++) {
    const p = makeImmuneCell(C_PLASMA, 0.5, 0);
    p.position.set(3.2 + i * 0.9, -2.2 + (i % 2) * 0.7, (i - 1) * 0.5);
    p.visible = false;
    gImmune.add(p);
    immune.plasma.push(p);
  }
  const plasmaLbl = label('浆细胞：分泌抗体（工厂）', '#ffc9a8', 0.0042);
  plasmaLbl.position.set(3.9, -3.1, 0);
  plasmaLbl.visible = false;
  gImmune.add(plasmaLbl);
  immune.plasmaLbl = plasmaLbl;
  for (let i = 0; i < 2; i++) {
    const m = makeImmuneCell(C_MEMORY, 0.42, 0);
    m.position.set(2.2 + i * 1.1, 2.6, -0.4);
    m.visible = false;
    gImmune.add(m);
    immune.memory.push(m);
  }
  const memLbl = label('记忆细胞（长寿命·待命）', '#cdb0ff', 0.0042);
  memLbl.position.set(2.75, 3.5, -0.4);
  memLbl.visible = false;
  gImmune.add(memLbl);
  immune.memLbl = memLbl;
  // 抗体
  immune.antibodies = [];
  {
    for (let i = 0; i < 14; i++) {
      const ab = makeYAntibody();
      ab.visible = false;
      ab.scale.setScalar(1.15);
      gImmune.add(ab);
      immune.antibodies.push(ab);
    }
  }
}

const immuneSim = {
  stage: -1, t: 0, speed: 1, noHelper: false, noCytokine: false, running: false, score: 0,
};

const IMMUNE_STAGES = [
  { id: 'invade', dur: 3.2, txt: '病毒进入淋巴结…' },
  { id: 'capture', dur: 3.2, txt: '树突状细胞摄取、处理并呈递抗原' },
  { id: 'present', dur: 3.0, txt: '辅助性 T 细胞识别呈递的抗原（活化）' },
  { id: 'cytokine', dur: 2.6, txt: '辅助性 T 细胞分泌细胞因子' },
  { id: 'bactivate', dur: 3.2, txt: 'B 细胞接受抗原刺激与细胞因子 → 活化' },
  { id: 'divide', dur: 3.4, txt: 'B 细胞分裂、分化：浆细胞 + 记忆细胞' },
  { id: 'antibody', dur: 4.2, txt: '浆细胞分泌抗体，与病毒结合' },
  { id: 'agglutinate', dur: 3.6, txt: '抗体凝集病毒 → 沉淀/被吞噬清除' },
  { id: 'done', dur: 999, txt: '体液免疫完成。记忆细胞保持记忆，等待下一次' },
];

function startImmune() {
  immuneSim.stage = 0;
  immuneSim.t = 0;
  immuneSim.running = true;
  immune.viruses.forEach((v, i) => { v.visible = true; v.userData.start = v.position.clone(); v.userData.end = new THREE.Vector3(-3.6 + i * 0.5, 2.0 + (i % 2) * 0.9, (i - 2) * 0.3); });
  immune.apcAntigen.visible = false;
  immune.helper.material && 0;
  immune.helper.position.set(-4.6, -0.6, 0.4);
  immune.helper.scale.setScalar(1);
  immune.cytokines.forEach((c) => { c.t = -1; c.m.visible = false; });
  immune.bcell.position.set(0.5, -1.8, 0);
  immune.bcell.scale.setScalar(1);
  immune.plasma.forEach((p) => { p.visible = false; });
  immune.memory.forEach((m) => { m.visible = false; });
  immune.plasmaLbl.visible = false;
  immune.memLbl.visible = false;
  immune.antibodies.forEach((a) => { a.visible = false; });
}

function tickImmune(dt) {
  if (!immuneSim.running) return;
  immuneSim.t += dt * immuneSim.speed;
  const st = IMMUNE_STAGES[immuneSim.stage];
  if (!st) return;
  const localT = immuneSim.t;
  const k = clamp(localT / st.dur, 0, 1);
  const id = st.id;
  // 各阶段动画
  if (id === 'invade') {
    immune.viruses.forEach((v, i) => {
      v.position.lerpVectors(v.userData.start, v.userData.end, clamp(localT / 2.6, 0, 1));
      v.rotation.y += dt * 2;
    });
  } else if (id === 'capture') {
    const v0 = immune.viruses[0];
    v0.position.lerpVectors(v0.userData.end, immune.apc.position.clone(), k);
    v0.scale.setScalar(0.9 * (1 - k * 0.8));
    if (k >= 1) {
      v0.visible = false;
      immune.apcAntigen.visible = true;
    }
  } else if (id === 'present') {
    if (immuneSim.noHelper) { finishStage(0.4); return; }
    immune.helper.position.lerpVectors(new THREE.Vector3(-4.6, -0.6, 0.4), new THREE.Vector3(-1.2, 1.9, 0.4), Math.min(k * 1.4, 1));
    immune.helper.scale.setScalar(1 + 0.12 * k);
  } else if (id === 'cytokine') {
    if (immuneSim.noCytokine || immuneSim.noHelper) { finishStage(0.3); return; }
    immune.cytokines.forEach((c) => {
      if (c.t < 0 && localT > c.delay) { c.t = 0; c.m.visible = true; }
      if (c.t >= 0) {
        c.t += dt * immuneSim.speed;
        c.m.position.lerpVectors(immune.helper.position, immune.bcell.position, clamp(c.t / 1.6, 0, 1));
        c.m.position.y += Math.sin(c.t * 6) * 0.06;
        if (c.t > 1.6) c.m.visible = false;
      }
    });
  } else if (id === 'bactivate') {
    const powered = !immuneSim.noHelper && !immuneSim.noCytokine;
    if (!powered) { finishStage(0.4); return; }
    immune.bcell.position.lerpVectors(new THREE.Vector3(0.5, -1.8, 0), new THREE.Vector3(-0.6, 1.4, 0), Math.min(k * 1.3, 1));
    immune.bcell.scale.setScalar(1 + 0.15 * k);
  } else if (id === 'divide') {
    const powered = !immuneSim.noHelper && !immuneSim.noCytokine;
    if (!powered) { finishStage(0.2); return; }
    immune.plasma.forEach((p, i) => {
      p.visible = true;
      p.scale.setScalar(clamp(k * 3 - i * 0.5, 0.05, 1));
    });
    immune.memory.forEach((m, i) => {
      m.visible = true;
      m.scale.setScalar(clamp(k * 3 - 1.5 - i * 0.5, 0.05, 1));
    });
    immune.plasmaLbl.visible = true;
    immune.memLbl.visible = true;
  } else if (id === 'antibody') {
    const powered = !immuneSim.noHelper && !immuneSim.noCytokine;
    if (!powered) { finishStage(0.2); return; }
    immune.antibodies.forEach((a, i) => {
      a.visible = i / immune.antibodies.length < k;
      if (!a.visible) return;
      const tgt = immune.viruses[i % immune.viruses.length];
      a.position.lerpVectors(immune.plasma[0].position, tgt.position.clone().add(new THREE.Vector3(0, -0.32, 0)), clamp((k * 1.6 - i * 0.06) % 1, 0, 1));
    });
  } else if (id === 'agglutinate') {
    const powered = !immuneSim.noHelper && !immuneSim.noCytokine;
    if (!powered) { finishStage(0.2); return; }
    immune.viruses.forEach((v, i) => {
      if (!v.visible) return;
      const clump = new THREE.Vector3(2.2 + (i % 2) * 0.55, 0.6 + Math.floor(i / 2) * 0.4, 0.2);
      v.position.lerp(clump, dt * 2 * immuneSim.speed);
    });
  }
  function finishStage(fast) {
    immuneSim.t = st.dur * fast;
  }
  // 推进阶段
  if (localT >= st.dur) {
    immuneSim.t = 0;
    immuneSim.stage = Math.min(immuneSim.stage + 1, IMMUNE_STAGES.length - 1);
  }
}

function resetImmune() {
  immuneSim.running = false;
  immuneSim.stage = -1;
  immuneSim.t = 0;
  immune.viruses.forEach((v, i) => {
    v.visible = true;
    v.scale.setScalar(0.9);
    v.position.set(-6.5, 1.5 + i * 0.5, (Math.random() - 0.5) * 2);
  });
  immune.apcAntigen.visible = false;
  immune.helper.position.set(-4.6, -0.6, 0.4);
  immune.helper.scale.setScalar(1);
  immune.cytokines.forEach((c) => { c.t = -1; c.m.visible = false; });
  immune.bcell.position.set(0.5, -1.8, 0);
  immune.bcell.scale.setScalar(1);
  immune.plasma.forEach((p) => { p.visible = false; });
  immune.memory.forEach((m) => { m.visible = false; });
  immune.plasmaLbl.visible = false;
  immune.memLbl.visible = false;
  immune.antibodies.forEach((a) => { a.visible = false; });
}

/* ================= 场景三：二次免疫曲线 ================= */

const gMemory = new THREE.Group();
gMemory.visible = false;
scene.add(gMemory);

const curveCv = document.createElement('canvas');
curveCv.width = 560; curveCv.height = 340;
const curveTex = new THREE.CanvasTexture(curveCv);
curveTex.colorSpace = THREE.SRGBColorSpace;
{
  const chart = mesh(new THREE.PlaneGeometry(6.4, 3.9), new THREE.MeshBasicMaterial({ map: curveTex, transparent: false }));
  chart.position.set(-1.2, 1.7, 0);
  gMemory.add(chart);
  const border = mesh(new THREE.BoxGeometry(6.7, 4.2, 0.06), M(0x2c3442, 0.7));
  border.position.set(-1.2, 1.7, -0.04);
  gMemory.add(border);
}
// 记忆细胞与浆细胞计数示意（右侧）
const memCells3D = [];
const plasmaCells3D = [];
{
  for (let i = 0; i < 8; i++) {
    const m = makeImmuneCell(C_MEMORY, 0.26, 0);
    m.position.set(3.3, 2.4 + (i % 4) * 0.62, (i % 2) * 0.4);
    m.visible = false;
    gMemory.add(m);
    memCells3D.push(m);
    const p = makeImmuneCell(C_PLASMA, 0.26, 0);
    p.position.set(4.6, 2.4 + (i % 4) * 0.62, (i % 2) * 0.4);
    p.visible = false;
    gMemory.add(p);
    plasmaCells3D.push(p);
  }
  const lbM = label('记忆细胞', '#cdb0ff', 0.0042);
  lbM.position.set(3.3, 1.6, 0);
  const lbP = label('浆细胞（工作数量）', '#ffc9a8', 0.0042);
  lbP.position.set(4.6, 1.6, 0);
  gMemory.add(lbM, lbP);
}

const memSim = {
  day: 0, speed: 3, scenario: [],            // scenario: [{day, label, kind}]
  active: false, vaccines: 0, exposures: 0,
};

function antibodyLevel(day) {
  // 0..∞ 天的抗体水平（0-1）：感染/疫苗事件叠加
  let v = 0;
  for (const ev of memSim.scenario) {
    if (day < ev.day) continue;
    const t = day - ev.day;
    if (ev.kind === 'vaccine') {
      v += t < 2 ? 0 : Math.min(0.45, (t - 2) * 0.06) * Math.exp(-Math.max(0, t - 16) * 0.06);
    } else if (ev.kind === 'expose') {
      if (memSim.vaccines > 0 || ev.idx > 0) {
        // 二次应答：快而强
        v += t < 0.8 ? 0 : Math.min(0.95, (t - 0.8) * 0.5) * Math.exp(-Math.max(0, t - 7) * 0.05);
      } else {
        // 初次应答：慢而弱
        v += t < 4 ? 0 : Math.min(0.4, (t - 4) * 0.035) * Math.exp(-Math.max(0, t - 14) * 0.07);
      }
    }
  }
  return clamp(v, 0, 1);
}

function drawCurve() {
  const c = curveCv.getContext('2d');
  const W = curveCv.width, H = curveCv.height;
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const bg = isDark ? '#12161e' : '#ffffff';
  const fg = isDark ? '#dfe6ee' : '#1a2230';
  const grid = isDark ? '#2a3444' : '#dfe4ec';
  c.fillStyle = bg;
  c.fillRect(0, 0, W, H);
  const padL = 64, padB = 46, padT = 34, padR = 26;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  // 网格
  c.strokeStyle = grid;
  c.lineWidth = 1;
  for (let d = 0; d <= 40; d += 5) {
    const x = padL + (d / 40) * plotW;
    c.beginPath(); c.moveTo(x, padT); c.lineTo(x, padT + plotH); c.stroke();
  }
  for (let v = 0; v <= 1; v += 0.25) {
    const y = padT + (1 - v) * plotH;
    c.beginPath(); c.moveTo(padL, y); c.lineTo(padL + plotW, y); c.stroke();
  }
  // 轴
  c.strokeStyle = fg;
  c.lineWidth = 2;
  c.strokeRect(padL, padT, plotW, plotH);
  c.fillStyle = fg;
  c.font = '15px sans-serif';
  c.textAlign = 'center';
  for (let d = 0; d <= 40; d += 10) c.fillText(d + '天', padL + (d / 40) * plotW, H - 16);
  c.fillText('抗体浓度（相对）', padL + plotW / 2, H - 6);
  c.save();
  c.translate(18, padT + plotH / 2);
  c.rotate(-TAU / 4);
  c.fillText('抗体浓度', 0, 0);
  c.restore();
  // 事件竖线
  for (const ev of memSim.scenario) {
    if (ev.day > 40) continue;
    const x = padL + (ev.day / 40) * plotW;
    c.strokeStyle = ev.kind === 'vaccine' ? 'rgba(90,150,240,0.8)' : 'rgba(224,82,82,0.8)';
    c.setLineDash([5, 4]);
    c.beginPath(); c.moveTo(x, padT); c.lineTo(x, padT + plotH); c.stroke();
    c.setLineDash([]);
    c.fillStyle = ev.kind === 'vaccine' ? '#5a96f0' : '#e05252';
    c.font = 'bold 13px sans-serif';
    c.fillText(ev.label, x, padT - 10);
  }
  // 曲线（画到当前 day）
  const dEnd = Math.min(memSim.day, 40);
  c.strokeStyle = '#e0862e';
  c.lineWidth = 3.4;
  c.beginPath();
  for (let d = 0; d <= dEnd; d += 0.25) {
    const x = padL + (d / 40) * plotW;
    const y = padT + (1 - antibodyLevel(d)) * plotH;
    if (d === 0) c.moveTo(x, y); else c.lineTo(x, y);
  }
  c.stroke();
  // 当前点
  if (memSim.active && memSim.day <= 40) {
    const x = padL + (memSim.day / 40) * plotW;
    const y = padT + (1 - antibodyLevel(memSim.day)) * plotH;
    c.fillStyle = '#e0862e';
    c.beginPath(); c.arc(x, y, 6, 0, TAU); c.fill();
  }
  curveTex.needsUpdate = true;
}

function tickMemory(dt) {
  if (!memSim.active) return;
  memSim.day += dt * memSim.speed;
  drawCurve();
  const lvl = antibodyLevel(Math.min(memSim.day, 40));
  plasmaCells3D.forEach((p, i) => { p.visible = i < Math.round(lvl * 8); });
  memCells3D.forEach((m, i) => {
    m.visible = i < (memSim.vaccines > 0 ? 4 + memSim.exposures * 2 : memSim.exposures);
  });
  if (memSim.day > 42) memSim.active = false;
}

function scheduleScenario(list) {
  memSim.scenario = list;
  memSim.vaccines = list.filter((e) => e.kind === 'vaccine').length;
  memSim.exposures = list.filter((e) => e.kind === 'expose').length;
  memSim.day = 0;
  memSim.active = true;
  memCells3D.forEach((m) => { m.visible = false; });
  plasmaCells3D.forEach((p) => { p.visible = false; });
}

/* ---------------- 章节定义 ---------------- */

const ctl = createControlsPanel(document.getElementById('controls'));
let activeSectionId = null;
let activeCleanup = null;

const hud = makeHUD(stage, [['a', '阶段'], ['b', '要点'], ['c', '提示']]);
hud.visibleNow = false;

const SECTIONS = [
  {
    id: 'barriers',
    title: '人体三道防线',
    html: `<p>皮肤剖面从上到下：<b>第一道防线</b>——皮肤角质层与黏膜（阻挡、扫除病原体）；穿透后遇到<b>第二道防线</b>——体液中的杀菌物质（如溶菌酶）与<b>吞噬细胞</b>（摄取、消化）。</p>
<p>这两道防线人人都有、生来就有，不针对特定病原体，称<span class="hl">非特异性免疫</span>。<b>第三道防线</b>（免疫器官与免疫细胞，下一章的主角）出生后才建立，只针对特定病原体，是<span class="hl">特异性免疫</span>。</p>
<p>点「释放病原体」看两道防线的分工；点「补一针疫苗」预告第三道防线（记忆细胞）。</p>`,
    enter() {
      showOnly(gDefense);
      resetDefense(false);
      gAllergy.visible = false;
      hud.visibleNow = true;
      app.setCamera([0.4, 1.5, 14.2], [0, 0.9, 0]);
      ctl.clear();
      ctl.button({
        label: '释放病原体',
        onClick: () => {
          defense.released = true;
          hud.set('a', '病原体入侵！');
          hud.set('b', '第一道：角质层阻挡 → 第二道：吞噬细胞消化');
        },
      });
      ctl.button({
        label: '重置',
        onClick: () => { resetDefense(false); hud.set('a', '待命'); hud.set('b', '点「释放病原体」开始'); },
      });
      ctl.sep();
      ctl.toggle({
        label: '标注', value: true,
        onChange: (v) => { defenseBits.labels.visible = v; macroLbl.visible = v; },
      });
      hud.set('a', '待命');
      hud.set('b', '非特异性免疫：皮肤黏膜 + 杀菌物质/吞噬细胞');
      hud.set('c', '特异性免疫 = 第三道防线（下一章）');
    },
  },
  {
    id: 'humoral',
    title: '体液免疫的过程',
    html: `<p>淋巴结内的<b>体液免疫</b>全过程：① 病毒入侵 → ② <span class="hl">树突状细胞</span>摄取·处理·呈递抗原 → ③ <span class="hl">辅助性 T 细胞</span>识别并活化 → ④ 分泌<b>细胞因子</b> → ⑤ <span class="hl">B 细胞</span>受抗原刺激 + 细胞因子 → 活化 → ⑥ 分裂分化为<b>浆细胞</b>（分泌抗体）和<b>记忆细胞</b> → ⑦ <b>抗体</b>与病毒结合，凝集成团被清除。</p>
<p>做个实验：关掉「辅助性 T 细胞」或「细胞因子」，再看一遍全过程——B 细胞难以充分活化，抗体大减。这正是 HIV 攻击辅助性 T 细胞后免疫系统崩溃的原因。</p>`,
    enter() {
      showOnly(gImmune);
      resetImmune();
      hud.visibleNow = true;
      app.setCamera([0, 0.6, 10.8], [0, 0, 0]);
      ctl.clear();
      ctl.button({
        label: '▶ 播放全过程',
        onClick: () => { startImmune(); hud.set('a', IMMUNE_STAGES[0].txt); },
      });
      ctl.button({
        label: '重置',
        onClick: () => { resetImmune(); hud.set('a', '待命'); hud.set('b', '点「播放全过程」'); },
      });
      ctl.sep();
      ctl.toggle({
        label: '关掉辅助性 T 细胞', value: false,
        onChange: (v) => { immuneSim.noHelper = v; },
      });
      ctl.toggle({
        label: '关掉细胞因子', value: false,
        onChange: (v) => { immuneSim.noCytokine = v; },
      });
      ctl.slider({
        label: '速度', min: 0.5, max: 3, step: 0.1, value: immuneSim.speed,
        fmt: (v) => '×' + v.toFixed(1),
        onInput: (v) => { immuneSim.speed = v; },
      });
      hud.set('a', '待命');
      hud.set('b', '摄取呈递 → 辅助T活化 → 细胞因子 → B活化 → 分化 → 抗体');
      hud.set('c', '试试关掉辅助性 T 细胞');
    },
  },
  {
    id: 'memory',
    title: '二次免疫与疫苗',
    html: `<p><b>初次免疫</b>：B 细胞从活化到产生抗体要爬坡，抗体慢、峰值低；<b>二次免疫</b>：<span class="hl">记忆细胞</span>迅速增殖分化，抗体<b>快而多</b>（曲线又高又陡）。</p>
<p><b>疫苗</b>正是利用这一点：先灭活/减毒的抗原做一次“安全演习”，把记忆细胞练出来，等真的病原体来了就是“二次应答”。</p>
<p>依次点「接种疫苗」「第21天：接触病原体」看曲线对比；也可以跳过疫苗直接感染两次（同株）比较。蓝色竖线=疫苗，红色竖线=感染。</p>`,
    enter() {
      showOnly(gMemory);
      scheduleScenario([]);
      drawCurve();
      hud.visibleNow = true;
      app.setCamera([0, 0.8, 11.2], [0, 0.6, 0]);
      ctl.clear();
      ctl.button({
        label: '① 接种疫苗（第0天）',
        onClick: () => { scheduleScenario([{ day: 0, label: '疫苗', kind: 'vaccine' }]); hud.set('a', '已接种疫苗，等待…'); },
      });
      ctl.button({
        label: '② 第21天接触病原体',
        onClick: () => {
          scheduleScenario([{ day: 0, label: '疫苗', kind: 'vaccine' }, { day: 21, label: '感染', kind: 'expose', idx: 0 }]);
          hud.set('a', '二次应答：抗体快而多');
        },
      });
      ctl.sep();
      ctl.button({
        label: '无疫苗：初次感染',
        onClick: () => { scheduleScenario([{ day: 0, label: '初次感染', kind: 'expose', idx: 0 }]); hud.set('a', '初次应答：慢而弱'); },
      });
      ctl.button({
        label: '无疫苗：第14天再次感染',
        onClick: () => {
          scheduleScenario([{ day: 0, label: '初次感染', kind: 'expose', idx: 0 }, { day: 14, label: '再次感染', kind: 'expose', idx: 1 }]);
          hud.set('a', '第二次：记忆细胞起效，快而强');
        },
      });
      ctl.sep();
      ctl.slider({
        label: '时间流速', min: 1, max: 12, step: 0.5, value: memSim.speed,
        fmt: (v) => v.toFixed(0) + ' 天/秒',
        onInput: (v) => { memSim.speed = v; },
      });
      memSim.updateHud = () => {
        const lvl = antibodyLevel(Math.min(memSim.day, 40));
        hud.set('a', `第 ${Math.min(Math.round(memSim.day), 40)} 天 · 抗体水平 ${(lvl * 100).toFixed(0)}%`);
        hud.set('b', memSim.scenario.length ? '蓝线=疫苗 红线=感染 · 二次应答快而多' : '点上方按钮安排一次“人生剧本”');
        hud.set('c', `记忆细胞 ${memCells3D.filter((m) => m.visible).length} 个 · 浆细胞 ${plasmaCells3D.filter((p) => p.visible).length} 个`);
      };
    },
  },
  {
    id: 'allergy',
    title: '过敏反应',
    html: `<p><b>过敏反应</b>：已免疫的机体，再次接触相同过敏原时发生的<span class="hl">功能过强</span>的免疫反应。</p>
<p>两阶段：① <b>首次接触</b>过敏原（如花粉、海鲜蛋白）→ 产生 <span class="hl">IgE 抗体</span>，吸附在<b>肥大细胞</b>表面（致敏，本人无感觉）；② <b>再次接触</b>同一过敏原 → 过敏原与 IgE 结合，肥大细胞释放<b>组胺</b>等 → 毛细血管扩张、通透性增加、平滑肌收缩 → 红斑瘙痒、喷嚏、哮喘…</p>
<p>特点：发作<b>迅速、反应强烈、消退较快</b>；一般不损伤组织细胞；有明显的个体差异（遗传倾向）。急救严重病例用<b>肾上腺素</b>。</p>`,
    enter() {
      showOnly(gDefense);
      resetDefense(true);
      hud.visibleNow = true;
      app.setCamera([0.4, 1.2, 12.6], [-0.6, 0.8, 0]);
      ctl.clear();
      ctl.button({
        label: '① 首次接触过敏原（致敏）',
        onClick: () => {
          igeDots.forEach((d) => { d.visible = true; });
          hud.set('a', '致敏阶段：IgE 吸附于肥大细胞表面');
          hud.set('b', '本人没有症状，但已经“上膛”');
        },
      });
      ctl.button({
        label: '② 再次接触（引发症状）',
        onClick: () => {
          defense.histT = 0.01;
          hud.set('a', '过敏发作：组胺释放！');
          hud.set('b', '血管扩张·瘙痒·喷嚏——发作快消退也快');
          hud.set('c', '严重过敏反应需及时就医（肾上腺素）');
        },
      });
      ctl.sep();
      ctl.toggle({
        label: '标注', value: true,
        onChange: (v) => { allergyLbl.visible = v; defenseBits.labels.visible = v; },
      });
      hud.set('a', '未致敏');
      hud.set('b', '过敏 = 免疫反应过强（对无害物质的误伤）');
      hud.set('c', '先致敏，再发作——顺序不能反');
    },
  },
  {
    id: 'quiz',
    title: '随堂检测',
    html: `<p>5 道选择题，检验一下本节课的掌握情况。答完可重新开始。</p>`,
    enter() {
      showOnly(gImmune);
      resetImmune();
      hud.visibleNow = false;
      app.setCamera([0, 0.6, 10.8], [0, 0, 0]);
      ctl.clear();
      showQuiz();
    },
  },
];

function showOnly(g) {
  gDefense.visible = gImmune.visible = gMemory.visible = false;
  g.visible = true;
}

/* ---------------- 随堂检测 ---------------- */

const QUIZ = [
  {
    q: '吞噬细胞吞噬、消化病原体属于哪道防线？',
    opts: ['第一道防线', '第二道防线', '第三道防线', '不属于免疫'],
    a: 1,
    ex: '体液中的杀菌物质与吞噬细胞属于第二道防线（非特异性免疫）；皮肤黏膜是第一道。',
  },
  {
    q: '体液免疫中，对 B 细胞活化“双信号”缺一不可的是？',
    opts: ['抗原刺激 + 辅助性T细胞的细胞因子', '吞噬细胞 + 抗体', '疫苗 + 抗生素', '记忆细胞 + 浆细胞'],
    a: 0,
    ex: 'B 细胞需要接受抗原刺激，同时接受辅助性 T 细胞分泌的细胞因子作用，才能增殖分化为浆细胞和记忆细胞。',
  },
  {
    q: '与初次免疫相比，二次免疫的特点是？',
    opts: ['更慢、更弱', '更快、更强（抗体产生快且多）', '完全一样', '不需要 B 细胞参与'],
    a: 1,
    ex: '记忆细胞对相同抗原十分敏感，二次免疫中增殖分化更迅速，抗体快而多，这也是疫苗保护的原理。',
  },
  {
    q: '关于过敏反应，下列说法正确的是？',
    opts: ['首次接触过敏原即发作', '发作缓慢、持续数月', '再次接触相同过敏原时发作迅速，一般不损伤组织细胞', '是免疫缺陷病'],
    a: 2,
    ex: '过敏反应是免疫过强：首次接触致敏（IgE 吸附于肥大细胞），再次接触才发作；特点是发作迅速、消退较快、一般不破坏组织。',
  },
  {
    q: 'HIV 主要侵犯辅助性 T 细胞，患者最终死于多种感染，原因是？',
    opts: ['抗体失去了杀毒能力', '辅助性 T 细胞受损后，体液免疫与细胞免疫都严重受损', '皮肤屏障被破坏', '吞噬细胞大量死亡'],
    a: 1,
    ex: '辅助性 T 细胞是特异性免疫的“指挥”：它既辅助 B 细胞（体液免疫）也参与细胞免疫，被大量破坏后免疫系统全线崩溃。',
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

/* ---------------- 主循环 ---------------- */

app.onFrame((dt, t) => {
  cameraTweenTick(app, dt);
  hud.el.style.display = hud.visibleNow ? '' : 'none';
  if (activeSectionId === 'barriers' || activeSectionId === 'allergy') {
    tickDefense(dt);
    if (defense.released && immuneStageHudSync(activeSectionId)) {}
  } else if (activeSectionId === 'humoral' || activeSectionId === 'quiz') {
    tickImmune(dt);
    if (immuneSim.running) {
      const st = IMMUNE_STAGES[immuneSim.stage];
      if (st) hud.set('a', st.txt);
      if (immuneSim.noHelper || immuneSim.noCytokine) {
        if (immuneSim.stage >= 5) hud.set('c', '注意：辅助信号被切断，B 细胞几乎没有活化');
      }
    }
  } else if (activeSectionId === 'memory') {
    tickMemory(dt);
    if (memSim.updateHud && hud.visibleNow) memSim.updateHud();
  }
});

function immuneStageHudSync() { return true; }

/* ---------------- 启动 ---------------- */

const sections = createSections({
  nav: document.getElementById('sideNav'),
  descPanel: document.getElementById('descPanel'),
  sections: SECTIONS,
  onSelect(i, sec) {
    if (activeCleanup) { activeCleanup(); activeCleanup = null; }
    activeSectionId = sec.id;
    sec.enter();
  },
});
window.__eduSections = sections;
loader.hide();
sections.select(0);
