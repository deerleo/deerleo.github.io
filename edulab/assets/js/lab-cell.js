/* EduLab · 细胞 · 三维结构（cell）
 * 章节：细胞全景 / 细胞器详解 / 动物细胞与植物细胞 / 原核细胞与真核细胞 / 流动镶嵌模型 /
 *       物质进出细胞 / 分泌蛋白的合成与运输 / 细胞骨架与胞质环流 / 随堂检测
 * 场景：程序化建模的剖开细胞、细胞器特写、动植物对比、原核/真核对比、磷脂双分子层（InstancedMesh）、
 *       跨膜运输四种方式、分泌蛋白旅程、细胞骨架与马达蛋白；支持荧光显微风格。
 */
import {
  THREE, TAU, clamp,
  createApp, cameraTweenTick, makeLoader,
  createSections, createControlsPanel, makeHUD, makeTextSprite, setSpriteText,
} from './edu-core.js';

/* ---------------- 基础 ---------------- */

const stage = document.getElementById('stage');
const loader = makeLoader(stage, '正在装配细胞器…');
const app = createApp({
  container: stage,
  fov: 42, near: 0.1, far: 200,
  cameraPos: [0, 2.2, 7.4], target: [0, 0.6, 0],
  minDistance: 0.8, maxDistance: 40,
});
const { scene, camera, controls } = app;

const amb = new THREE.AmbientLight(0xe8eef8, 1.1);
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
function label(text, color = '#ffffff', scale = 0.0052, bg = 'rgba(10,16,24,0.72)') {
  return makeTextSprite(text, { fontSize: 32, color, scale, bg });
}

/* ---------------- 调色板 ---------------- */

const C_MEM = 0xcfe0f2, C_CYTO = 0x8fbce0, C_NUC = 0x8fa8e8, C_NUCL = 0x5c78c9;
const C_MITO = 0xe08a5c, C_CRISTA = 0xc25f32, C_ER = 0x7fc9a8, C_GOLGI = 0xd9a8e0;
const C_LYSO = 0xe0d06a, C_RIB = 0x46536e, C_CENT = 0xa8b8d0, C_CHLO = 0x59c968;
const C_VAC = 0xa8d4f0, C_WALL = 0xcfe3bd;

/* ================= 细胞装配（动物细胞，剖开） ================= */

const animalCell = new THREE.Group();
scene.add(animalCell);

const organelles = [];   // { name, group, info }

function registerOrg(name, group, info, lblOffset = [0, 0.55, 0]) {
  const lb = label(name, '#e8f0fa', 0.0044);
  lb.position.set(lblOffset[0] + group.position.x, lblOffset[1] + group.position.y, lblOffset[2] + group.position.z);
  group.userData.lbl = lb;
  group.userData.info = info;
  group.userData.name = name;
  animalCell.add(lb);
  lb.visible = false;
  organelles.push({ name, group });
  return group;
}

// 细胞膜（剖开球壳）+ 细胞质
const memMat = M(C_MEM, 0.35, 0, { transparent: true, opacity: 0.3, side: THREE.DoubleSide, depthWrite: false });
const membrane = mesh(new THREE.SphereGeometry(2.5, 64, 44, 0, TAU * 0.58, 0, Math.PI), memMat);
const cyto = mesh(new THREE.SphereGeometry(2.42, 48, 32, 0, TAU * 0.58, 0, Math.PI), M(C_CYTO, 0.7, 0, { transparent: true, opacity: 0.4, side: THREE.DoubleSide, depthWrite: false }));
animalCell.add(membrane, cyto);

// 细胞核（核膜双层 + 核仁 + 染色质）
const nucleus = new THREE.Group();
nucleus.position.set(-0.55, 0.55, 0.35);
{
  const shell = mesh(new THREE.SphereGeometry(0.85, 32, 22), M(C_NUC, 0.5, 0, { transparent: true, opacity: 0.55 }));
  const shell2 = mesh(new THREE.SphereGeometry(0.95, 32, 22, 0, TAU * 0.58, 0, Math.PI), M(0xb9cdf0, 0.4, 0, { transparent: true, opacity: 0.22, side: THREE.DoubleSide }));
  const nucleolus = mesh(new THREE.SphereGeometry(0.3, 20, 14), M(C_NUCL, 0.6));
  nucleolus.position.set(0.15, 0.2, 0.2);
  nucleus.add(shell, shell2, nucleolus);
  // 染色质（弯曲短线）
  const chrMat = M(0x4a5a9e, 0.5);
  for (let i = 0; i < 5; i++) {
    const pts = [];
    const a0 = Math.random() * TAU, r0 = 0.3 + Math.random() * 0.3;
    for (let k = 0; k <= 8; k++) {
      const t = k / 8;
      pts.push(new THREE.Vector3(Math.cos(a0 + t * 2.4) * r0, (t - 0.5) * 0.7, Math.sin(a0 + t * 2.4) * r0));
    }
    nucleus.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0x4a5a9e, transparent: true, opacity: 0.7 })));
  }
}
animalCell.add(nucleus);
registerOrg('细胞核', nucleus, '遗传信息库（DNA 所在地），控制细胞代谢与遗传；核膜双层、有核孔；核仁与核糖体的形成有关。');

// 线粒体 ×2（嵴）
function makeMitochondrion(scale = 1) {
  const g = new THREE.Group();
  const body = mesh(new THREE.CapsuleGeometry(0.3, 0.55, 6, 14), M(C_MITO, 0.55));
  body.rotation.z = TAU / 4;
  g.add(body);
  const inner = mesh(new THREE.CapsuleGeometry(0.24, 0.5, 6, 14), M(0xf0b088, 0.6, 0, { transparent: true, opacity: 0.5 }));
  inner.rotation.z = TAU / 4;
  g.add(inner);
  for (let i = 0; i < 5; i++) {
    const crest = mesh(new THREE.BoxGeometry(0.42, 0.04, 0.34), M(C_CRISTA, 0.5));
    crest.position.set(-0.42 + i * 0.21, 0, 0);
    crest.rotation.y = TAU / 12;
    g.add(crest);
  }
  g.scale.setScalar(scale);
  return g;
}
const mito1 = makeMitochondrion();
mito1.position.set(1.15, 1.25, 0.15);
mito1.rotation.set(0.4, 0.2, 0.5);
const mito2 = makeMitochondrion(0.8);
mito2.position.set(1.5, -0.45, 0.75);
mito2.rotation.set(-0.3, 0.5, -0.4);
animalCell.add(mito1, mito2);
registerOrg('线粒体', mito1, '有氧呼吸的主要场所——细胞的“动力车间”。双层膜，内膜向内折叠形成嵴，扩大反应面积。');
registerOrg('线粒体（小）', mito2, '同上：数量多说明该细胞代谢旺盛、耗能多。', [0, 0.5, 0]);

// 内质网（波纹管网）
const erGroup = new THREE.Group();
erGroup.position.set(0.75, 0.75, -0.35);
{
  const pts = [];
  for (let i = 0; i <= 40; i++) {
    const t = i / 40;
    pts.push(new THREE.Vector3(
      Math.cos(t * TAU * 1.6) * 0.55 * (1 - t * 0.3),
      Math.sin(t * TAU * 2.2) * 0.14,
      Math.sin(t * TAU * 1.6) * 0.35 * (1 - t * 0.3)
    ));
  }
  erGroup.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 120, 0.09, 8), M(C_ER, 0.55)));
}
animalCell.add(erGroup);
registerOrg('内质网', erGroup, '蛋白质合成与加工、脂质合成的“车间”（粗面内质网附着核糖体；光面内质网参与脂质与解毒）。');

// 核糖体（散点，部分附着内质网）
const ribGroup = new THREE.Group();
{
  const rm = M(C_RIB, 0.5);
  const positions = [
    [1.0, 1.05, -0.2], [0.55, 1.1, -0.55], [1.3, 0.95, -0.5], [-1.35, -0.35, 0.6],
    [-0.9, -1.35, 0.3], [0.35, -1.5, 0.5], [1.6, 0.35, -0.35], [-0.3, 1.7, -0.4],
    [-1.5, 0.9, -0.3], [0.9, -0.85, -0.6],
  ];
  positions.forEach(([x, y, z]) => {
    const r = mesh(new THREE.SphereGeometry(0.06, 8, 6), rm);
    r.position.set(x, y, z);
    ribGroup.add(r);
  });
}
animalCell.add(ribGroup);
registerOrg('核糖体', ribGroup, '“生产蛋白质的机器”——无膜结构，将氨基酸缩合成肽链；附着在内质网上的合成分泌蛋白，游离的合成胞内蛋白。');

// 高尔基体（扁平囊堆）
const golgi = new THREE.Group();
golgi.position.set(-1.1, -1.15, 0.15);
golgi.rotation.set(0.2, 0.3, -0.25);
{
  for (let i = 0; i < 5; i++) {
    const sac = mesh(new THREE.CapsuleGeometry(0.09, 0.6 - i * 0.05, 4, 10), M(C_GOLGI, 0.55));
    sac.rotation.z = TAU / 4;
    sac.position.y = (i - 2) * 0.14;
    sac.scale.set(1, 1, 0.6);
    golgi.add(sac);
  }
  const ves = mesh(new THREE.SphereGeometry(0.09, 10, 8), M(C_GOLGI, 0.6));
  ves.position.set(0.42, 0.32, 0);
  golgi.add(ves);
}
animalCell.add(golgi);
registerOrg('高尔基体', golgi, '“发送站”：对来自内质网的蛋白质做加工、分类与包装，再派发囊泡运往目的地（植物细胞还与细胞壁形成有关）。');

// 溶酶体 ×2
const lyso1 = mesh(new THREE.SphereGeometry(0.2, 16, 12), M(C_LYSO, 0.5, 0, { transparent: true, opacity: 0.85 }));
lyso1.position.set(1.7, 1.35, -0.5);
const lyso2 = mesh(new THREE.SphereGeometry(0.15, 14, 10), M(C_LYSO, 0.5, 0, { transparent: true, opacity: 0.85 }));
lyso2.position.set(-1.6, 0.15, -0.4);
animalCell.add(lyso1, lyso2);
registerOrg('溶酶体', lyso1, '“消化车间”：内含多种水解酶，分解衰老的细胞器和吞入的病原体（内部为酸性环境）。');

// 中心体（两个垂直的中心粒）
const centro = new THREE.Group();
centro.position.set(-1.25, 1.5, -0.2);
{
  const c1 = mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.32, 9), M(C_CENT, 0.5));
  const c2 = mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.32, 9), M(C_CENT, 0.5));
  c2.rotation.x = TAU / 4;
  c2.position.x = 0.26;
  centro.add(c1, c2);
}
animalCell.add(centro);
registerOrg('中心体', centro, '动物和低等植物细胞特有；由两个互相垂直排列的中心粒组成，与细胞的有丝分裂有关（发出星射线形成纺锤体）。');

const animalLabels = organelles.map((o) => o.group.userData.lbl);

/* ================= 植物细胞 ================= */

const plantCell = new THREE.Group();
plantCell.visible = false;
scene.add(plantCell);
{
  // 细胞壁（厚壳，剖开）
  const wall = mesh(new THREE.SphereGeometry(2.75, 48, 32, 0, TAU * 0.58, 0, Math.PI), M(C_WALL, 0.6, 0, { transparent: true, opacity: 0.5, side: THREE.DoubleSide }));
  plantCell.add(wall);
  const wallLbl = label('细胞壁（全透性·支持保护）', '#dff0cc', 0.0042);
  wallLbl.position.set(0, 3.3, 0);
  plantCell.add(wallLbl);
  // 膜与细胞质
  const pm = mesh(new THREE.SphereGeometry(2.45, 48, 32, 0, TAU * 0.58, 0, Math.PI), M(C_MEM, 0.35, 0, { transparent: true, opacity: 0.28, side: THREE.DoubleSide, depthWrite: false }));
  const cyto = mesh(new THREE.SphereGeometry(2.38, 48, 32, 0, TAU * 0.58, 0, Math.PI), M(0x9ccbe8, 0.7, 0, { transparent: true, opacity: 0.4, side: THREE.DoubleSide, depthWrite: false }));
  plantCell.add(pm, cyto);
  // 大液泡
  const vac = mesh(new THREE.SphereGeometry(1.35, 36, 24), M(C_VAC, 0.4, 0, { transparent: true, opacity: 0.5 }));
  vac.position.set(0, -0.35, 0);
  plantCell.add(vac);
  const vacLbl = label('大液泡（细胞液·维持渗透压）', '#bfe2f8', 0.0042);
  vacLbl.position.set(0, -1.9, 0);
  plantCell.add(vacLbl);
  // 细胞核
  const nuc = mesh(new THREE.SphereGeometry(0.6, 28, 18), M(C_NUC, 0.5, 0, { transparent: true, opacity: 0.6 }));
  nuc.position.set(-1.3, 1.15, 0.2);
  plantCell.add(nuc);
  // 叶绿体 ×6（类囊体基粒）
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU;
    const ch = new THREE.Group();
    ch.position.set(Math.cos(a) * 1.6, Math.sin(a * 1.3) * 1.15, Math.sin(a) * 0.9);
    ch.rotation.set(Math.random() * 2, Math.random() * 2, Math.random() * 2);
    const body = mesh(new THREE.SphereGeometry(0.28, 16, 12), M(C_CHLO, 0.55));
    body.scale.set(1.3, 0.75, 1);
    ch.add(body);
    for (let k = 0; k < 3; k++) {
      const disc = mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.035, 10), M(0x2f8f4a, 0.5));
      disc.position.y = -0.08 + k * 0.09;
      ch.add(disc);
    }
    plantCell.add(ch);
  }
  const chLbl = label('叶绿体（类囊体基粒·光合作用）', '#a8e8b4', 0.0042);
  chLbl.position.set(2.9, 1.6, 0);
  plantCell.add(chLbl);
  // 线粒体一枚
  const pm1 = makeMitochondrion(0.7);
  pm1.position.set(1.4, 1.7, -0.4);
  plantCell.add(pm1);
}

/* ================= 原核细胞（蓝细菌/细菌示意） ================= */

const prok = new THREE.Group();
prok.visible = false;
scene.add(prok);
const prokLabels = [];
{
  // 杆菌外壳（剖开）
  const shell = mesh(new THREE.CapsuleGeometry(1.0, 2.2, 12, 24, 8, TAU * 0.55, 0, Math.PI), M(0xd9c9a0, 0.6, 0, { transparent: true, opacity: 0.45, side: THREE.DoubleSide }));
  shell.rotation.z = TAU / 4;
  prok.add(shell);
  const inner = mesh(new THREE.CapsuleGeometry(0.92, 2.1, 10, 22), M(0xe8e2cc, 0.7, 0, { transparent: true, opacity: 0.5 }));
  inner.rotation.z = TAU / 4;
  prok.add(inner);
  // 拟核（环状 DNA 团）
  const nucPts = [];
  for (let i = 0; i <= 60; i++) {
    const t = i / 60;
    nucPts.push(new THREE.Vector3(
      Math.cos(t * TAU * 2.2) * 0.42,
      Math.sin(t * TAU * 3.1) * 0.3,
      Math.sin(t * TAU * 2.2) * 0.34
    ));
  }
  prok.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(nucPts), 120, 0.05, 6), M(0xe078a0, 0.5)));
  const nucLbl = label('拟核：环状 DNA（无核膜包被）', '#f2a8c4', 0.0044);
  nucLbl.position.set(0, 1.75, 0);
  prok.add(nucLbl); prokLabels.push(nucLbl);
  // 核糖体散点
  const rm = M(C_RIB, 0.5);
  for (let i = 0; i < 26; i++) {
    const r = mesh(new THREE.SphereGeometry(0.055, 8, 6), rm);
    r.position.set((Math.random() - 0.5) * 2.2, (Math.random() - 0.5) * 1.2, (Math.random() - 0.5) * 1.2);
    if (r.position.length() < 0.55) r.position.x += 0.7;
    prok.add(r);
  }
  // 细胞壁与荚膜标注
  const wallLbl = label('细胞壁 + 细胞膜', '#e8dcb0', 0.0044);
  wallLbl.position.set(0, -1.75, 0);
  prok.add(wallLbl); prokLabels.push(wallLbl);
  // 鞭毛（螺旋）
  const flagPts = [];
  for (let i = 0; i <= 50; i++) {
    const t = i / 50;
    flagPts.push(new THREE.Vector3(-1.7 - t * 1.5, Math.sin(t * TAU * 3) * 0.16, Math.cos(t * TAU * 3) * 0.16));
  }
  const flag = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(flagPts), 90, 0.03, 6), M(0x9fb2c8, 0.5));
  prok.add(flag);
  prok.userData.flag = flag;
  const flagLbl = label('鞭毛（摆动推进）', '#9adfff', 0.0042);
  flagLbl.position.set(-2.6, 0.8, 0);
  prok.add(flagLbl); prokLabels.push(flagLbl);
}

/* ================= 章节 5：流动镶嵌模型 ================= */

const gMembrane = new THREE.Group();
gMembrane.visible = false;
scene.add(gMembrane);

const BIL_X = 7, BIL_Y = 5;                       // 网格
const HEAD_N = BIL_X * BIL_Y * 2;
const headMesh = new THREE.InstancedMesh(
  new THREE.SphereGeometry(0.16, 10, 8),
  M(0xe8a878, 0.5),
  HEAD_N
);
const tailMesh = new THREE.InstancedMesh(
  new THREE.CylinderGeometry(0.035, 0.035, 0.5, 6),
  M(0xd9b088, 0.6),
  HEAD_N
);
gMembrane.add(headMesh, tailMesh);

const lipState = [];                               // { x, z, layer, phase, speed }
{
  let i = 0;
  const dummy = new THREE.Object3D();
  for (const layer of [-1, 1]) {
    for (let gx = 0; gx < BIL_X; gx++) {
      for (let gz = 0; gz < BIL_Y; gz++) {
        lipState.push({
          x: (gx - (BIL_X - 1) / 2) * 0.62 + (Math.random() - 0.5) * 0.1,
          z: (gz - (BIL_Y - 1) / 2) * 0.62 + (Math.random() - 0.5) * 0.1,
          layer, phase: Math.random() * TAU, speed: 0.3 + Math.random() * 0.6,
        });
        i++;
      }
    }
  }
  lipState.forEach((l, k) => {
    dummy.position.set(l.x, l.layer * 0.42, l.z);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    headMesh.setMatrixAt(k, dummy.matrix);
    dummy.position.y += -l.layer * 0.3;
    dummy.updateMatrix();
    tailMesh.setMatrixAt(k, dummy.matrix);
  });
}

// 镶嵌蛋白：跨膜通道（半环）+ 球蛋白
const proteins = [];
function addProtein(x, z, kind) {
  const g = new THREE.Group();
  if (kind === 'channel') {
    const tube = mesh(new THREE.CylinderGeometry(0.22, 0.22, 1.25, 12, 1, true), M(0x7f9de0, 0.5, 0, { transparent: true, opacity: 0.75 }));
    g.add(tube);
  } else {
    const blob = mesh(new THREE.SphereGeometry(0.3, 14, 10), M(0x7fc9a8, 0.55));
    blob.scale.set(1, 1.35, 1);
    g.add(blob);
  }
  g.position.set(x, 0, z);
  gMembrane.add(g);
  proteins.push({ g, x, z, phase: Math.random() * TAU, speed: 0.15 + Math.random() * 0.3, kind });
  return g;
}
addProtein(-1.7, 0.4, 'channel');
addProtein(1.3, -0.9, 'channel');
addProtein(0.1, 1.2, 'globular');
addProtein(-0.5, -1.4, 'globular');

// 糖链（糖被）
const sugars = new THREE.Group();
gMembrane.add(sugars);
{
  const sm = M(0xa8e890, 0.5);
  const cells = [[-1.7, 0.4], [1.3, -0.9], [0.1, 1.2], [-0.5, -1.4], [0.9, 0.6], [-2.2, -0.9]];
  cells.forEach(([x, z]) => {
    for (let k = 0; k < 3; k++) {
      const s = mesh(new THREE.SphereGeometry(0.055, 8, 6), sm);
      s.position.set(x + (k - 1) * 0.12, 0.62 + Math.abs(k - 1) * 0.1, z);
      sugars.add(s);
    }
  });
}
const protLbl = label('磷脂双分子层（支架）· 蛋白质（镶嵌·流动）· 糖被（识别）', '#ffd9a8', 0.0042);
protLbl.position.set(0, 1.85, 0);
gMembrane.add(protLbl);

const fluid = { speed: 1, wave: true, sugar: true, t: 0 };
const _dummy = new THREE.Object3D();

function tickMembrane(dt) {
  fluid.t += dt;
  const drift = dt * 0.09 * fluid.speed;
  lipState.forEach((l, k) => {
    l.phase += drift * l.speed;
    _dummy.position.set(
      l.x + Math.cos(l.phase) * 0.08,
      l.layer * 0.42 + (fluid.wave ? Math.sin(l.x * 1.2 + fluid.t * 1.6) * 0.07 : 0),
      l.z + Math.sin(l.phase) * 0.08
    );
    _dummy.rotation.set(0, 0, 0);
    _dummy.updateMatrix();
    headMesh.setMatrixAt(k, _dummy.matrix);
    _dummy.position.y += -l.layer * 0.3;
    _dummy.updateMatrix();
    tailMesh.setMatrixAt(k, _dummy.matrix);
  });
  headMesh.instanceMatrix.needsUpdate = true;
  tailMesh.instanceMatrix.needsUpdate = true;
  proteins.forEach((p) => {
    p.phase += drift * p.speed * 0.6;
    p.g.position.x = p.x + Math.cos(p.phase) * 0.14;
    p.g.position.z = p.z + Math.sin(p.phase) * 0.14;
  });
}

/* ================= 章节 6：物质进出细胞 ================= */

const gTransport = new THREE.Group();
gTransport.visible = false;
scene.add(gTransport);

// 膜（竖直剖面两片）
{
  const slab = mesh(new THREE.BoxGeometry(7.2, 0.5, 2.2), M(0xd9b088, 0.6, 0, { transparent: true, opacity: 0.55 }));
  slab.position.y = 0;
  gTransport.add(slab);
  const hm = M(0xe8a878, 0.5);
  for (let i = 0; i < 18; i++) {
    const h1 = mesh(new THREE.SphereGeometry(0.09, 8, 6), hm);
    h1.position.set(-3.4 + i * 0.4, 0.32, 0);
    const h2 = h1.clone(); h2.position.y = -0.32;
    gTransport.add(h1, h2);
  }
}
// 通道蛋白 / 载体蛋白
const channelT = mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.9, 14, 1, true), M(0x7f9de0, 0.5, 0, { transparent: true, opacity: 0.85 }));
channelT.position.set(-1.6, 0, 0);
const pumpB = mesh(new THREE.BoxGeometry(0.5, 0.85, 0.5), M(0xd97f9d, 0.5));
pumpB.position.set(1.7, 0, 0);
gTransport.add(channelT, pumpB);
const chLbl = label('通道蛋白', '#a8c4ff', 0.0042);
chLbl.position.set(-1.6, 0.9, 0);
const pumpLbl = label('载体蛋白（泵）', '#f2a8c4', 0.0042);
pumpLbl.position.set(1.7, 0.9, 0);
const atpLbl = label('ATP → ADP＋Pi', '#ffd166', 0.0042);
atpLbl.position.set(2.6, 1.5, 0);
atpLbl.visible = false;
const concHigh = label('高浓度（上）', '#9adfff', 0.0044);
concHigh.position.set(3.55, 2.3, 0);
const concLow = label('低浓度（下）', '#b9c8dd', 0.0044);
concLow.position.set(3.55, -2.3, 0);
const concArrow = label('顺浓度梯度 ↓', '#9adfff', 0.004);
concArrow.position.set(3.55, 0, 0);
gTransport.add(chLbl, pumpLbl, atpLbl, concHigh, concLow, concArrow);

const atpSpark = new THREE.Sprite(new THREE.SpriteMaterial({
  map: (() => {
    const cv = document.createElement('canvas'); cv.width = cv.height = 64;
    const cx = cv.getContext('2d');
    const g = cx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,210,120,1)'); g.addColorStop(1, 'rgba(255,210,120,0)');
    cx.fillStyle = g; cx.fillRect(0, 0, 64, 64);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
    return t;
  })(),
  transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0,
}));
atpSpark.position.set(1.7, 0.75, 0);
atpSpark.scale.set(0.9, 0.9, 1);
gTransport.add(atpSpark);

// 粒子池
const tParts = [];
{
  const pm1 = new THREE.MeshBasicMaterial({ color: 0x9adfff });
  const pm2 = new THREE.MeshBasicMaterial({ color: 0xa8e890 });
  for (let i = 0; i < 22; i++) {
    const m = mesh(new THREE.SphereGeometry(0.09, 8, 6), i % 2 ? pm1 : pm2);
    m.visible = false;
    gTransport.add(m);
    tParts.push({ m, t: 0, active: false, lane: 0, delay: Math.random() * 3 });
  }
}
const endoVes = mesh(new THREE.SphereGeometry(0.42, 18, 14), M(0xd9e4f2, 0.4, 0, { transparent: true, opacity: 0.5 }));
endoVes.visible = false;
gTransport.add(endoVes);

const trans = { mode: 'free', rate: 1, acc: 0, sparkT: 0, flip: false };

function spawnT(lane) {
  const p = tParts.find((x) => !x.active);
  if (!p) return;
  p.active = true; p.t = 0; p.lane = lane;
  p.m.visible = true;
  p.m.position.set((Math.random() - 0.5) * 4.6, lane >= 0 ? 2.6 : -2.6, (Math.random() - 0.5) * 1.2);
}

function tickTransport(dt) {
  trans.acc += dt * trans.rate * 0.9;
  if (trans.acc >= 1) {
    trans.acc = 0;
    const m = trans.mode;
    if (m === 'free') spawnT(1);                              // 上→下
    else if (m === 'facil') spawnT(1);
    else if (m === 'active') spawnT(-1);                      // 下→上（逆浓度）
    else if (m === 'endo') spawnT(1);
  }
  trans.sparkT = Math.max(0, trans.sparkT - dt * 2);
  atpSpark.material.opacity = trans.sparkT;
  atpSpark.scale.setScalar(0.5 + trans.sparkT * 0.9);
  tParts.forEach((p) => {
    if (!p.active) return;
    p.t += dt * (0.5 + trans.rate * 0.25);
    const m = trans.mode;
    if (m === 'free') {
      p.m.position.y -= dt * 1.1;
      if (p.m.position.y < -2.6) p.active = false;
    } else if (m === 'facil') {
      const k = p.t;
      if (k < 0.35) p.m.position.y -= dt * 1.0;
      else if (k < 0.62) {
        p.m.position.x += ((-1.6 - p.m.position.x)) * dt * 5;
        p.m.position.y -= dt * 0.9;
      } else p.m.position.y -= dt * 1.2;
      if (p.m.position.y < -2.6) p.active = false;
    } else if (m === 'active') {
      const k = p.t;
      if (k < 0.5) {
        p.m.position.x += (1.7 - p.m.position.x) * dt * 3.5;
        if (k > 0.3 && !p.sparked) { p.sparked = true; trans.sparkT = 1; }
      } else {
        p.m.position.y += dt * 1.25;
        if (p.m.position.y > 2.6) { p.active = false; p.sparked = false; }
      }
    } else {
      const k = p.t;
      if (k < 0.4) p.m.position.y -= dt * 0.8;
      else if (k < 0.45) { endoVes.visible = true; endoVes.position.copy(p.m.position); p.m.visible = false; }
      else if (k < 0.9) { endoVes.position.y -= dt * 0.85; }
      else { endoVes.visible = false; p.active = false; }
    }
    if (trans.mode !== 'active') p.sparked = false;
    p.m.visible = p.active;
  });
}

/* ================= 章节 7：分泌蛋白旅程 ================= */

const gSecret = new THREE.Group();
gSecret.visible = false;
scene.add(gSecret);

// 站点：核糖体 → 内质网 → 囊泡 → 高尔基体 → 囊泡 → 细胞膜
const secStations = [
  { name: '① 核糖体（合成肽链）', pos: [-3.5, 0.9, 0], info: '游离…不，附着在内质网上的核糖体，按 mRNA 指令把氨基酸连成肽链。' },
  { name: '② 内质网（加工折叠）', pos: [-1.7, 1.2, 0], info: '肽链进入内质网腔，进行折叠、组装、加上糖链，成为较成熟的蛋白质。' },
  { name: '③ 囊泡（运输）', pos: [-0.2, 1.5, 0], info: '内质网“出芽”形成囊泡，包裹蛋白质运往高尔基体。' },
  { name: '④ 高尔基体（包装派发）', pos: [1.4, 1.4, 0], info: '进一步加工分类，包装进分泌囊泡，运向细胞膜。' },
  { name: '⑤ 细胞膜（胞吐释放）', pos: [3.3, 1.0, 0], info: '囊泡与细胞膜融合，把蛋白质分泌到细胞外（如消化酶、抗体、部分激素）。' },
];
{
  // 内质网
  const erPts = [];
  for (let i = 0; i <= 30; i++) {
    const t = i / 30;
    erPts.push(new THREE.Vector3(secStations[1].pos[0] + Math.cos(t * TAU * 1.2) * 0.75, secStations[1].pos[1] - 0.35 + Math.sin(t * TAU * 2) * 0.2, Math.sin(t * TAU * 1.2) * 0.35));
  }
  gSecret.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(erPts), 90, 0.13, 8), M(C_ER, 0.55)));
  // 高尔基体
  const gg = new THREE.Group();
  gg.position.set(...secStations[3].pos);
  gg.position.y -= 0.35;
  for (let i = 0; i < 4; i++) {
    const sac = mesh(new THREE.CapsuleGeometry(0.1, 0.7 - i * 0.06, 4, 10), M(C_GOLGI, 0.55));
    sac.rotation.z = TAU / 4;
    sac.position.y = (i - 1.5) * 0.16;
    gg.add(sac);
  }
  gSecret.add(gg);
  // 细胞膜（右侧竖直膜板）
  const memSlab = mesh(new THREE.CapsuleGeometry(2.1, 2.6, 6, 20), M(C_MEM, 0.4, 0, { transparent: true, opacity: 0.42 }));
  memSlab.scale.set(0.22, 1, 1);
  memSlab.position.set(4.35, -0.35, 0);
  gSecret.add(memSlab);
  // 线粒体供能
  const mito = makeMitochondrion(0.65);
  mito.position.set(1.4, -1.3, 0);
  gSecret.add(mito);
  const mitoLbl = label('线粒体供能', '#e08a5c', 0.0038);
  gSecret.add(mitoLbl);
  mitoLbl.position.set(1.4, -2.0, 0);
  // 站点标记
  secStations.forEach((s) => {
    const lb = label(s.name, '#e8f0fa', 0.004);
    lb.position.set(s.pos[0], s.pos[1] + 0.75, s.pos[2]);
    gSecret.add(lb);
    const dot = mesh(new THREE.SphereGeometry(0.09, 10, 8), M(0xffffff, 0.4));
    dot.position.set(s.pos[0], s.pos[1], s.pos[2]);
    gSecret.add(dot);
    s.lbl = lb;
  });
}
// 旅程粒子
const secDots = [];
{
  for (let i = 0; i < 3; i++) {
    const d = mesh(new THREE.SphereGeometry(0.14, 12, 10), M(0xffd166, 0.35, 0, { emissive: 0xcf9020, emissiveIntensity: 0.3 }));
    d.visible = false;
    gSecret.add(d);
    secDots.push({ m: d, t: -i * 1.4, active: false });
  }
}
const secret = { playing: true, speed: 1, cur: -1 };

function tickSecret(dt) {
  if (!secret.playing) return;
  secDots.forEach((d) => {
    d.t += dt * secret.speed * 0.55;
    const T = secStations.length - 1;
    if (d.t > T + 0.6) { d.t = -Math.random() * 2.5; d.active = false; d.m.visible = false; }
    if (d.t < 0) { d.m.visible = false; return; }
    d.m.visible = true;
    const seg = Math.min(Math.floor(d.t), T - 1);
    const k = clamp(d.t - seg, 0, 1);
    const a = new THREE.Vector3(...secStations[seg].pos);
    const b = new THREE.Vector3(...secStations[seg + 1].pos);
    d.m.position.lerpVectors(a, b, k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
    d.m.position.y += Math.sin(k * Math.PI) * 0.25;
  });
}

/* ================= 章节 8：细胞骨架与胞质环流 ================= */

const gSkello = new THREE.Group();
gSkello.visible = false;
scene.add(gSkello);

// 微管（从中心体放射）+ 微丝
const mtubes = [];
{
  const center = new THREE.Vector3(0, 0.3, 0);
  const cs = mesh(new THREE.SphereGeometry(0.18, 12, 10), M(C_CENT, 0.5));
  cs.position.copy(center);
  gSkello.add(cs);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU;
    const dir = new THREE.Vector3(Math.cos(a), (Math.random() - 0.35) * 0.8, Math.sin(a)).normalize();
    const len = 2.0 + Math.random() * 1.2;
    const pts = [];
    for (let k = 0; k <= 12; k++) {
      const t = k / 12;
      pts.push(center.clone().add(dir.clone().multiplyScalar(t * len)).add(new THREE.Vector3(0, 0, Math.sin(t * 6 + i) * 0.05)));
    }
    const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.045, 6), M(0xe8d05c, 0.5));
    gSkello.add(tube);
    mtubes.push({ pts, curve: new THREE.CatmullRomCurve3(pts) });
  }
  // 微丝（细、弯）
  for (let i = 0; i < 7; i++) {
    const a = Math.random() * TAU;
    const pts = [];
    for (let k = 0; k <= 16; k++) {
      const t = k / 16;
      pts.push(new THREE.Vector3(
        Math.cos(a) * (0.6 + t * 1.8) + Math.sin(t * 9) * 0.18,
        -0.9 + Math.sin(t * 7 + i * 2) * 0.35,
        Math.sin(a) * (0.6 + t * 1.8) * 0.7
      ));
    }
    gSkello.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.025, 6), M(0xe87a9a, 0.55)));
  }
}

// 马达蛋白（驱动蛋白）驮着囊泡沿微管行走
const motor = new THREE.Group();
{
  const feet = mesh(new THREE.BoxGeometry(0.22, 0.06, 0.12), M(0xe87a9a, 0.4));
  const body = mesh(new THREE.SphereGeometry(0.1, 10, 8), M(0xe8a8c9, 0.4));
  body.position.y = 0.16;
  const cargo = mesh(new THREE.SphereGeometry(0.22, 14, 10), M(0xa8d4f0, 0.45, 0, { transparent: true, opacity: 0.8 }));
  cargo.position.y = 0.42;
  motor.add(feet, body, cargo);
}
gSkello.add(motor);
const motorLbl = label('驱动蛋白（马达蛋白）“步行”运货', '#ffd9ec', 0.0038);
motorLbl.position.set(0, 1.5, 0);
gSkello.add(motorLbl);

// 胞质环流粒子（绕大圈）
const flowParts = [];
{
  const fm = M(0xbfe2f8, 0.4);
  for (let i = 0; i < 20; i++) {
    const p = mesh(new THREE.SphereGeometry(0.07, 8, 6), fm);
    gSkello.add(p);
    flowParts.push({ m: p, off: Math.random(), r: 1.4 + Math.random() * 0.7, y: (Math.random() - 0.5) * 1.4, tilt: Math.random() * 0.4 });
  }
}

const skel = { flowSpeed: 1, motorOn: true, motorT: 0, neon: false, tubeMats: [], motorPath: mtubes[0].curve };

function setNeon(on) {
  const bg = on ? 0x06090f : null;
  if (bg !== null) app.scene.background = new THREE.Color(bg);
  else {
    const saved = (() => { try { return localStorage.getItem('edulab-theme'); } catch (e) { return null; } })();
    app.scene.background = new THREE.Color(saved === 'dark' ? 0x090c10 : 0xdfe6ee);
  }
  amb.intensity = on ? 0.25 : 1.1;
  key.intensity = on ? 0.4 : 1.8;
  fill.intensity = on ? 0.15 : 0.5;
  gSkello.traverse((o) => {
    if (o.isMesh && o.material && o.material.color && o.material.emissive) {
      if (on) {
        if (!o.userData.baseColor) o.userData.baseColor = o.material.color.getHex();
        o.material.emissive.setHex(o.userData.baseColor);
        o.material.emissiveIntensity = 1.4;
        o.material.color.setHex(0x10141c);
      } else if (o.userData.baseColor !== undefined) {
        o.material.color.setHex(o.userData.baseColor);
        o.material.emissive.setHex(0x000000);
        o.material.emissiveIntensity = 1;
      }
    }
  });
}

function tickSkello(dt, t) {
  // 环流
  flowParts.forEach((p) => {
    p.off = (p.off + dt * 0.08 * skel.flowSpeed) % 1;
    const a = p.off * TAU;
    p.m.position.set(Math.cos(a) * p.r, p.y + Math.sin(a * 2) * p.tilt, Math.sin(a) * p.r * 0.8);
  });
  // 马达蛋白
  if (skel.motorOn) {
    skel.motorT += dt * 0.045 * skel.flowSpeed;
    skel.motorT %= 1;
    const pos = skel.motorPath.getPoint(skel.motorT);
    const ahead = skel.motorPath.getPoint((skel.motorT + 0.02) % 1);
    motor.position.copy(pos).y += 0.05;
    motor.lookAt(ahead.x, pos.y + 0.05, ahead.z);
    motor.position.y += 0.05;
    motor.visible = true;
  } else {
    motor.visible = false;
  }
}

/* ---------------- 章节定义 ---------------- */

const ctl = createControlsPanel(document.getElementById('controls'));
let activeSectionId = null;
let activeCleanup = null;
let lastSectionIdx = -1;
let focusOrg = null;

const hud = makeHUD(stage, [['a', '读数'], ['b', '要点'], ['c', '提示']]);
hud.visibleNow = false;

function clearFocus() {
  if (focusOrg) { focusOrg.scale.setScalar(focusOrg.userData.baseScale || 1); focusOrg = null; }
}

function focusOn(org) {
  clearFocus();
  focusOrg = org;
  org.userData.baseScale = org.userData.baseScale || org.scale.x;
  const k = org.userData.baseScale;
  org.scale.setScalar(k * 1.12);
}

const SECTIONS = [
  {
    id: 'overview',
    title: '细胞全景',
    html: `<p>动物细胞剖开看：最外面是<span class="hl">细胞膜</span>（选择透过性），里面充满细胞质，悬浮着各种<b>细胞器</b>。</p>
<p>找一找：<b>细胞核</b>（蓝，含染色质）、<b>线粒体</b>（橙色带嵴）、<b>内质网</b>（绿色管网）、<b>高尔基体</b>（紫色扁囊）、<b>核糖体</b>（小点）、<b>溶酶体</b>（黄色小泡）、<b>中心体</b>（两个垂直中心粒）。</p>
<p>打开「标注」按钮认识它们；下一章逐个走近观察。</p>`,
    enter() {
      animalCell.visible = true;
      plantCell.visible = false; prok.visible = false;
      gMembrane.visible = gTransport.visible = gSecret.visible = gSkello.visible = false;
      animalLabels.forEach((l) => { l.visible = true; });
      app.setCamera([0, 2.0, 7.6], [0, 0.3, 0]);
      hud.visibleNow = false;
      ctl.clear();
      ctl.toggle({
        label: '标注', value: true,
        onChange: (v) => { animalLabels.forEach((l) => { l.visible = v; }); },
      });
      ctl.toggle({
        label: '自转', value: true,
        onChange: (v) => { stateOV.spin = v; },
      });
      ctl.slider({
        label: '剖开角度', min: 30, max: 359, step: 1, value: 209,
        fmt: (v) => v + '°',
        onInput: (v) => {
          const phi = v * (Math.PI / 180);
          membrane.geometry.dispose(); cyto.geometry.dispose();
          membrane.geometry = new THREE.SphereGeometry(2.5, 64, 44, 0, phi, 0, Math.PI);
          cyto.geometry = new THREE.SphereGeometry(2.42, 48, 32, 0, phi, 0, Math.PI);
        },
      });
      ctl.button({ label: '重置视角', onClick: () => app.setCamera([0, 2.0, 7.6], [0, 0.3, 0]) });
    },
  },
  {
    id: 'organelles',
    title: '细胞器详解',
    html: `<p>逐个放大观察细胞器，右侧面板给出<b>结构与功能</b>要点。点击下方按钮切换目标（相机自动拉近）。</p>
<p>结构联想：<b>线粒体</b>内膜折叠成嵴；<b>高尔基体</b>是扁平囊堆；<b>中心体</b>两个中心粒互相垂直；<b>内质网</b>是膜连接成的管网。</p>`,
    enter() {
      animalCell.visible = true;
      plantCell.visible = false; prok.visible = false;
      gMembrane.visible = gTransport.visible = gSecret.visible = gSkello.visible = false;
      animalLabels.forEach((l) => { l.visible = true; });
      hud.visibleNow = true;
      ctl.clear();
      const pickables = organelles;
      pickables.forEach((o, i) => {
        if (i === 3 || i === 6) ctl.sep();
        ctl.button({
          label: o.name,
          active: false,
          onClick: () => {
            focusOn(o.group);
            hud.set('a', o.name);
            hud.set('b', o.group.userData.info);
            hud.set('c', '拖动旋转 · 滚轮缩放');
          },
        });
      });
      ctl.sep();
      ctl.button({ label: '总览视角', onClick: () => { clearFocus(); app.setCamera([0, 2.0, 7.6], [0, 0.3, 0]); } });
      hud.set('a', '线粒体');
      hud.set('b', organelles[1].group.userData.info);
      hud.set('c', '提示');
      focusOn(mito1);
      app.setCamera([2.2, 2.4, 3.2], [1.15, 1.25, 0.15]);
    },
  },
  {
    id: 'animal-vs-plant',
    title: '动物细胞与植物细胞',
    html: `<p>左边动物细胞，右边植物细胞。植物细胞特有的三样：<span class="hl">细胞壁</span>（最外层，全透性）、<span class="hl">叶绿体</span>（光合作用，内含类囊体基粒）、<span class="hl">大液泡</span>（细胞液）。</p>
<p>双方都有：细胞膜、细胞质、细胞核、线粒体、核糖体、内质网、高尔基体。<b>中心体</b>：动物有，高等植物没有。</p>`,
    enter() {
      animalCell.visible = true;
      animalCell.scale.setScalar(0.72);
      animalCell.position.x = -3.1;
      plantCell.visible = true;
      plantCell.scale.setScalar(0.78);
      plantCell.position.x = 3.1;
      prok.visible = false;
      gMembrane.visible = gTransport.visible = gSecret.visible = gSkello.visible = false;
      animalLabels.forEach((l) => { l.visible = true; });
      hud.visibleNow = true;
      hud.set('a', '动物细胞 ←→ 植物细胞');
      hud.set('b', '共有：膜/质/核/线粒体/核糖体/内质网/高尔基体');
      hud.set('c', '植物特有：细胞壁·叶绿体·液泡');
      app.setCamera([0, 2.2, 10.4], [0, 0.2, 0]);
      ctl.clear();
      ctl.toggle({
        label: '标注', value: true,
        onChange: (v) => { animalLabels.forEach((l) => { l.visible = v; }); },
      });
      ctl.toggle({
        label: '自转', value: true,
        onChange: (v) => { stateAP.spin = v; },
      });
      ctl.button({ label: '恢复总览视角', onClick: () => app.setCamera([0, 2.2, 10.4], [0, 0.2, 0]) });
    },
    leave() {
      animalCell.scale.setScalar(1);
      animalCell.position.x = 0;
    },
  },
  {
    id: 'pro-vs-eu',
    title: '原核细胞与真核细胞',
    html: `<p>原核细胞（左，细菌）与真核细胞（右，动物细胞）最本质的区别：<span class="hl">有没有以核膜为界限的细胞核</span>。</p>
<p>原核细胞：拟核是环状 DNA，<b>没有核膜、没有染色体</b>；只有核糖体一种细胞器；有细胞壁、鞭毛。代表：细菌、蓝细菌。真核细胞：细胞器种类齐全。共性：都有细胞膜、核糖体、DNA。</p>`,
    enter() {
      animalCell.visible = true;
      animalCell.scale.setScalar(0.62);
      animalCell.position.x = 4.6;
      prok.visible = true;
      prok.position.x = -3.4;
      plantCell.visible = false;
      gMembrane.visible = gTransport.visible = gSecret.visible = gSkello.visible = false;
      animalLabels.forEach((l) => { l.visible = false; });
      prokLabels.forEach((l) => { l.visible = true; });
      hud.visibleNow = true;
      hud.set('a', '左：原核（细菌）· 右：真核');
      hud.set('b', '本质区别：无核膜包被的细胞核');
      hud.set('c', '共性：细胞膜 · 核糖体 · DNA');
      app.setCamera([0, 1.8, 10.2], [0, 0.2, 0]);
      ctl.clear();
      ctl.toggle({
        label: '鞭毛摆动', value: true,
        onChange: (v) => { statePE.flag = v; },
      });
      ctl.toggle({
        label: '原核标注', value: true,
        onChange: (v) => { prokLabels.forEach((l) => { l.visible = v; }); },
      });
      ctl.button({ label: '恢复总览视角', onClick: () => app.setCamera([0, 1.8, 10.2], [0, 0.2, 0]) });
    },
    leave() {
      animalCell.scale.setScalar(1);
      animalCell.position.x = 0;
      prok.visible = false;
    },
  },
  {
    id: 'fluid-mosaic',
    title: '流动镶嵌模型',
    html: `<p>生物膜的<span class="hl">流动镶嵌模型</span>：<b>磷脂双分子层</b>构成基本支架（亲水“头”朝外、疏水“尾”相对），<b>蛋白质</b>镶、嵌、贯穿其中，外侧糖链形成<b>糖被</b>（细胞识别）。</p>
<p><b>流动性</b>是结构特点：磷脂和大多数蛋白质都能侧向流动。调高「流动性（温度）」看分子运动加快——低温下流动变慢，膜的功能也随之下降。</p>`,
    enter() {
      animalCell.visible = false;
      showOnly(gMembrane);
      hud.visibleNow = false;
      app.setCamera([0, 0.6, 6.4], [0, 0, 0]);
      ctl.clear();
      ctl.slider({
        label: '流动性（温度）', min: 0, max: 5, step: 0.1, value: fluid.speed,
        fmt: (v) => '×' + v.toFixed(1),
        onInput: (v) => { fluid.speed = v; },
      });
      ctl.toggle({
        label: '膜面波动', value: true,
        onChange: (v) => { fluid.wave = v; },
      });
      ctl.toggle({
        label: '糖被（糖链）', value: true,
        onChange: (v) => { sugars.visible = v; },
      });
      ctl.button({ label: '俯视磷脂阵列', onClick: () => app.setCamera([0, 5.4, 0.01], [0, 0, 0]) });
    },
  },
  {
    id: 'transport',
    title: '物质进出细胞',
    html: `<p>跨膜运输四种方式（上=高浓度侧，下=低浓度侧）：</p>
<p>① <b>自由扩散</b>：顺浓度直接穿过磷脂双层（O₂、CO₂、乙醇）；② <b>协助扩散</b>：顺浓度、经<span class="hl">通道/载体蛋白</span>（葡萄糖进红细胞）；③ <b>主动运输</b>：<b>逆浓度</b>、需载体蛋白并消耗 <span class="hl">ATP</span>（离子、葡萄糖进小肠）——看泵上的橙色 ATP 闪光；④ <b>胞吞/胞吐</b>：大分子经膜泡运输，也消耗能量。</p>
<p>切换下方按钮观察各自动画，注意「是否需要载体 / 是否耗能」。</p>`,
    enter() {
      animalCell.visible = false;
      showOnly(gTransport);
      endoVes.visible = false;
      hud.visibleNow = true;
      app.setCamera([0, 0.4, 8.6], [0, 0, 0]);
      ctl.clear();
      const modes = [
        { label: '自由扩散', value: 'free', b: '顺浓度 · 不需载体 · 不耗能' },
        { label: '协助扩散', value: 'facil', b: '顺浓度 · 需通道/载体 · 不耗能' },
        { label: '主动运输', value: 'active', b: '逆浓度 · 需载体 · 消耗 ATP' },
        { label: '胞吞胞吐', value: 'endo', b: '大分子 · 膜泡运输 · 耗能' },
      ];
      const modeBtns = [];
      modes.forEach((m) => {
        const btn = ctl.button({
          label: m.label,
          active: trans.mode === m.value,
          onClick: () => {
            trans.mode = m.value;
            modeBtns.forEach(({ b, v }) => b.classList.toggle('active', v === m.value));
            tParts.forEach((p) => { p.active = false; p.m.visible = false; p.sparked = false; });
            endoVes.visible = false;
            atpLbl.visible = m.value === 'active';
            concArrow.visible = m.value !== 'active';
            hud.set('b', m.b);
            hud.set('a', m.value === 'active' ? '主动运输（逆浓度）' : m.value === 'endo' ? '膜泡运输（耗能）' : '被动运输（顺浓度）');
          },
        });
        modeBtns.push({ b: btn, v: m.value });
      });
      ctl.sep();
      ctl.slider({
        label: '粒子速率', min: 0.5, max: 4, step: 0.1, value: trans.rate,
        fmt: (v) => '×' + v.toFixed(1),
        onInput: (v) => { trans.rate = v; },
      });
      hud.set('a', trans.mode === 'active' ? '主动运输（逆浓度）' : '被动运输（顺浓度）');
      hud.set('b', '顺浓度 · 不需载体 · 不耗能');
      hud.set('c', '注意 ATP 闪光的时机');
    },
  },
  {
    id: 'secret-path',
    title: '分泌蛋白的合成与运输',
    html: `<p>分泌蛋白（消化酶、抗体、部分激素）的旅程：<span class="hl">核糖体合成肽链 → 内质网加工 → 囊泡运输 → 高尔基体加工包装 → 囊泡 → 细胞膜胞吐</span>，全程由线粒体供能。</p>
<p>按压「播放」，跟随金色颗粒走完全程；右侧面板同步显示当前站点的作用。放射状思路：附着核糖体 ≠ 游离核糖体——分泌蛋白走的是“附着”路线。</p>`,
    enter() {
      animalCell.visible = false;
      showOnly(gSecret);
      hud.visibleNow = true;
      app.setCamera([0, 1.2, 9.0], [0, 0.6, 0]);
      ctl.clear();
      const playBtn = ctl.button({
        label: secret.playing ? '⏸ 暂停' : '▶ 播放',
        onClick: () => {
          secret.playing = !secret.playing;
          playBtn.textContent = secret.playing ? '⏸ 暂停' : '▶ 播放';
          playBtn.classList.toggle('active', !secret.playing);
        },
      });
      ctl.slider({
        label: '旅程速度', min: 0.3, max: 3, step: 0.1, value: secret.speed,
        fmt: (v) => '×' + v.toFixed(1),
        onInput: (v) => { secret.speed = v; },
      });
      ctl.button({
        label: '重新出发',
        onClick: () => { secDots.forEach((d) => { d.t = -Math.random() * 2; }); },
      });
      secret.updateHud = () => {
        const lead = secDots.reduce((mx, d) => Math.max(mx, d.t), -99);
        const i = clamp(Math.round(lead), 0, secStations.length - 1);
        hud.set('a', secStations[i].name);
        hud.set('b', secStations[i].info);
        hud.set('c', '例：胰岛 B 细胞分泌胰岛素');
      };
    },
  },
  {
    id: 'cytoskeleton',
    title: '细胞骨架与胞质环流',
    html: `<p><b>细胞骨架</b>：由微管（黄）、微丝（粉）等蛋白纤维组成，既维持形态，又是细胞内运输的“轨道”。</p>
<p><b>马达蛋白</b>（驱动蛋白）像 walk 一样沿着微管“行走”，驮着囊泡把“货物”运到指定位置；细胞质中的颗粒随<span class="hl">胞质环流</span>缓缓流动，加速物质交换。</p>
<p>试试「荧光显微风格」：切换为暗视野荧光效果——这就是实验室里观察细胞骨架的经典成像方式。</p>`,
    enter() {
      animalCell.visible = false;
      showOnly(gSkello);
      hud.visibleNow = false;
      app.setCamera([2.6, 1.6, 5.2], [0, 0.3, 0]);
      ctl.clear();
      ctl.slider({
        label: '环流 / 步行速度', min: 0, max: 4, step: 0.1, value: skel.flowSpeed,
        fmt: (v) => '×' + v.toFixed(1),
        onInput: (v) => { skel.flowSpeed = v; },
      });
      ctl.toggle({
        label: '马达蛋白', value: true,
        onChange: (v) => { skel.motorOn = v; },
      });
      ctl.toggle({
        label: '荧光显微风格', value: false,
        onChange: (v) => { setNeon(v); },
      });
      ctl.button({ label: '重置视角', onClick: () => app.setCamera([2.6, 1.6, 5.2], [0, 0.3, 0]) });
    },
    leave() {
      setNeon(false);
    },
  },
  {
    id: 'quiz',
    title: '随堂检测',
    html: `<p>5 道选择题，检验一下本节课的掌握情况。答完可重新开始。</p>`,
    enter() {
      animalCell.visible = true;
      plantCell.visible = prok.visible = false;
      gMembrane.visible = gTransport.visible = gSecret.visible = gSkello.visible = false;
      animalLabels.forEach((l) => { l.visible = false; });
      app.setCamera([0, 2.0, 7.6], [0, 0.3, 0]);
      ctl.clear();
      hud.visibleNow = false;
      showQuiz();
    },
  },
];

function showOnly(g) {
  gMembrane.visible = gTransport.visible = gSecret.visible = gSkello.visible = false;
  g.visible = true;
}

/* 杂项状态 */
const stateOV = { spin: true };
const stateAP = { spin: true };
const statePE = { flag: true };

/* ---------------- 随堂检测 ---------------- */

const QUIZ = [
  {
    q: '下列属于植物细胞特有、动物细胞没有的结构是？',
    opts: ['线粒体', '核糖体', '叶绿体和液泡', '高尔基体'],
    a: 2,
    ex: '植物细胞特有：细胞壁、叶绿体、液泡；线粒体、核糖体、高尔基体动植物细胞都有。',
  },
  {
    q: '原核细胞与真核细胞最本质的区别是？',
    opts: ['有无细胞膜', '有无核糖体', '有无以核膜为界限的细胞核', '大小不同'],
    a: 2,
    ex: '原核细胞没有以核膜为界限的细胞核（只有拟核）；两者都有细胞膜和核糖体，也都有 DNA。',
  },
  {
    q: '流动镶嵌模型中，构成生物膜基本支架的是？',
    opts: ['蛋白质', '磷脂双分子层', '糖被', '胆固醇'],
    a: 1,
    ex: '磷脂双分子层构成膜的基本支架，蛋白质镶、嵌、贯穿其中，糖链分布在膜外侧（糖被）。',
  },
  {
    q: '小肠上皮细胞吸收葡萄糖（逆浓度梯度）的方式属于？',
    opts: ['自由扩散', '协助扩散', '主动运输', '胞吞'],
    a: 2,
    ex: '逆浓度梯度吸收需要载体蛋白并消耗细胞呼吸提供的 ATP，属于主动运输。',
  },
  {
    q: '分泌蛋白合成与运输的正确路径是？',
    opts: ['核糖体→高尔基体→内质网→细胞膜', '核糖体→内质网→高尔基体→细胞膜', '内质网→核糖体→高尔基体→细胞膜', '高尔基体→内质网→核糖体→细胞膜'],
    a: 1,
    ex: '附着核糖体合成肽链 → 内质网加工 → 囊泡 → 高尔基体加工包装 → 囊泡 → 细胞膜胞吐，全程线粒体供能。',
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
  if (activeSectionId === 'overview' || activeSectionId === 'quiz') {
    if (stateOV.spin) animalCell.rotation.y = t * 0.22;
  } else if (activeSectionId === 'organelles') {
    animalCell.rotation.y = t * 0.1;
  } else if (activeSectionId === 'animal-vs-plant') {
    if (stateAP.spin) {
      animalCell.rotation.y = t * 0.24;
      plantCell.rotation.y = t * 0.24;
    }
  } else if (activeSectionId === 'pro-vs-eu') {
    prok.rotation.y = t * 0.18;
    animalCell.rotation.y = t * 0.18;
    if (statePE.flag) {
      const f = prok.userData.flag;
      f.rotation.x = Math.sin(t * 6) * 0.3;
      f.rotation.z = Math.cos(t * 6) * 0.3;
    }
  } else if (activeSectionId === 'fluid-mosaic') {
    tickMembrane(dt);
  } else if (activeSectionId === 'transport') {
    tickTransport(dt);
    if (hud.visibleNow && trans.mode === 'active' && trans.sparkT > 0.5) hud.set('c', 'ATP 水解供能 → 逆浓度泵运');
  } else if (activeSectionId === 'secret-path') {
    tickSecret(dt);
    if (secret.updateHud) secret.updateHud();
  } else if (activeSectionId === 'cytoskeleton') {
    tickSkello(dt, t);
  }
});

/* ---------------- 启动 ---------------- */

animalCell.visible = true;
plantCell.visible = prok.visible = false;
gMembrane.visible = gTransport.visible = gSecret.visible = gSkello.visible = false;

const sections = createSections({
  nav: document.getElementById('sideNav'),
  descPanel: document.getElementById('descPanel'),
  sections: SECTIONS,
  onSelect(i, sec) {
    if (activeCleanup) { activeCleanup(); activeCleanup = null; }
    if (lastSectionIdx >= 0 && SECTIONS[lastSectionIdx].leave) SECTIONS[lastSectionIdx].leave();
    lastSectionIdx = i;
    activeSectionId = sec.id;
    sec.enter();
  },
});
window.__eduSections = sections;
loader.hide();
sections.select(0);
