/* EduLab · 细胞 · 三维结构（cell）
 * 章节：细胞全景 / 细胞器详解 / 动物细胞与植物细胞 / 原核细胞与真核细胞 / 流动镶嵌模型 /
 *       物质进出细胞 / 分泌蛋白的合成与运输 / 细胞骨架与胞质环流 / 随堂检测
 * 视觉工艺（edu-vfx 标准接入示范）：
 *       - 后处理管线：bloom 辉光 + 暗角 + 胶片颗粒，illus/fluor 双模式
 *       - 材质分级：膜壳 clearcoat、胞质 sheen 绒面、能量器官 emissive
 *       - 有机几何：fbm 顶点噪声雕刻的剖壳细胞（含壁厚剖面封边）、核孔阵列、
 *         线粒体剖开胶囊、管网内质网、InstancedMesh 核糖体
 * 章节结构 / 交互逻辑 / 随堂检测与旧版一致。
 */
import {
  THREE, TAU, clamp,
  createApp, makeLoader,
  createControlsPanel, makeHUD, makeTextSprite,
} from './edu-core.js';
import {
  PAL, attachVFX, makeStudioEnvironment,
  matSheen, matCoat, matStd, matGlow, matGlass,
  registerGlow, applyGlowMode, ghostify,
  makeCutShell, makeCutCapsule, fbm3,
} from './edu-vfx.js';

/* ---------------- 基础与工艺接入 ---------------- */

const stage = document.getElementById('stage');
const loader = makeLoader(stage, '正在装配细胞器…');
const app = createApp({
  container: stage,
  fov: 42, near: 0.1, far: 200,
  cameraPos: [0, 2.2, 7.4], target: [0, 0.6, 0],
  minDistance: 0.8, maxDistance: 40,
  keepBackground: true,
});
const { scene, camera } = app;
const vfx = attachVFX(app, 'illus');
scene.environment = makeStudioEnvironment(app.renderer);

/* 灯光：暖主光 + 冷补光 + 低环境（反射主要来自 studio environment） */
const keyLight = new THREE.DirectionalLight(0xffe2bd, 1.55);
keyLight.position.set(5, 8, 6);
scene.add(keyLight);
const fillLight = new THREE.DirectionalLight(0x9fc4d8, 0.6);
fillLight.position.set(-6, 3, -5);
scene.add(fillLight);
const ambLight = new THREE.AmbientLight(0x93aec0, 0.5);
scene.add(ambLight);

const mesh = (geo, mat) => new THREE.Mesh(geo, mat);
function label(text, color = '#ffffff', scale = 0.0052, bg = 'rgba(8,14,20,0.72)') {
  return makeTextSprite(text, { fontSize: 32, color, scale, bg });
}

/* 发光材质登记表：illus 柔光 / fluor 全开 */
const glowList = [];
const G = (mat, i, f, o) => registerGlow(glowList, mat, i, f, o);

/* ================= 剖壳细胞（动物细胞主体） ================= */

const animalCell = new THREE.Group();
scene.add(animalCell);

const organelles = [];

function registerOrg(name, group, info, lblOffset = [0, 0.55, 0]) {
  const lb = label(name, '#eef3fa', 0.0044);
  lb.position.set(lblOffset[0] + group.position.x, lblOffset[1] + group.position.y, lblOffset[2] + group.position.z);
  group.userData.lbl = lb;
  group.userData.info = info;
  group.userData.name = name;
  animalCell.add(lb);
  lb.visible = false;
  organelles.push({ name, group });
  return group;
}

/* --- 细胞膜剖壳：暖膜色 + 深青胞质，fbm 雕刻轮廓，剖面封边露壁厚 --- */

const memMat = ghostify(matCoat(PAL.membrane, { roughness: 0.42, clearcoatRoughness: 0.24, emissive: 0x2a1810, emissiveIntensity: 0.25 }), 0.32);
const cytoMat = ghostify(matSheen(0x173a4c, {
  roughness: 0.58, sheen: 0.55, sheenColor: 0x62aec2,
  emissive: 0x0d3140, emissiveIntensity: 0.85,
}), 0.58);
const bandMat = matStd(0x94603a, { roughness: 0.5, emissive: 0x1c0e06, emissiveIntensity: 0.6 });
bandMat.side = THREE.DoubleSide;

let cellShell = null;

/** 按剖开角度（度）重建剖壳；顶点噪声让轮廓像手雕而非正球 */
function buildCellShell(wedgeDeg) {
  if (cellShell) {
    animalCell.remove(cellShell);
    cellShell.traverse((o) => { if (o.isMesh && o.geometry) o.geometry.dispose(); });
  }
  cellShell = makeCutShell({
    radius: 2.5, thickness: 0.2, wedge: wedgeDeg * (Math.PI / 180),
    amp: 0.09, freq: 1.65, seed: 11, segsP: 64, segsT: 44,
    mats: { outer: memMat, inner: cytoMat, band: bandMat },
  });
  /* 开口朝向镜头（+Z）：phi 从 −X 起量，转半圈把缺口转到镜头侧 */
  cellShell.rotation.y = Math.PI;
  animalCell.add(cellShell);
}
buildCellShell(209);

/* --- 细胞核：双层核膜 + 核孔阵列 + 发光核仁 + 染色质管线 --- */

const nucleus = new THREE.Group();
nucleus.position.set(-0.55, 0.55, 0.35);
{
  const envelope = ghostify(matCoat(PAL.nucleus, { roughness: 0.3, opacity: 0.55 }), 0.55);
  nucleus.add(mesh(new THREE.SphereGeometry(0.85, 36, 26), envelope));
  const innerEnv = ghostify(matCoat(PAL.nucleoplasm, { roughness: 0.45, opacity: 0.6 }), 0.6);
  nucleus.add(mesh(new THREE.SphereGeometry(0.74, 32, 22), innerEnv));
  /* 核仁：荧光模式的主角 */
  const nucleolusMat = G(matGlow(PAL.nucleolus, 0.35, { color: 0x8a5ad8 }), 0.35, 2.4);
  const nucleolus = mesh(new THREE.SphereGeometry(0.28, 22, 16), nucleolusMat);
  nucleolus.position.set(0.16, 0.2, 0.2);
  nucleus.add(nucleolus);
  /* 核孔阵列：InstancedMesh 小环贴着外核膜（环面法向 = 径向） */
  const poreGeo = new THREE.TorusGeometry(0.038, 0.013, 6, 10);
  const poreMat = G(matStd(PAL.pore, { roughness: 0.4, emissive: 0x5a4e90, emissiveIntensity: 0.25 }), 0.25, 0.9);
  const pores = new THREE.InstancedMesh(poreGeo, poreMat, 20);
  const dummy = new THREE.Object3D();
  const ZAXIS = new THREE.Vector3(0, 0, 1);
  for (let i = 0; i < 20; i++) {
    /* 斐波那契球面分布，避开两极 */
    const y = 1 - (2 * (i + 0.5)) / 20;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const a = i * 2.399963;
    const radial = new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r);
    dummy.position.copy(radial).multiplyScalar(0.855);
    dummy.quaternion.setFromUnitVectors(ZAXIS, radial);
    dummy.updateMatrix();
    pores.setMatrixAt(i, dummy.matrix);
  }
  nucleus.add(pores);
  /* 染色质：核内的弯管线团 */
  const chrMat = G(matGlow(PAL.chromatin, 0.4, { color: 0xa88ae0, roughness: 0.45 }), 0.4, 1.9);
  for (let i = 0; i < 6; i++) {
    const pts = [];
    const a0 = (i / 6) * TAU, r0 = 0.26 + (i % 3) * 0.12;
    for (let k = 0; k <= 10; k++) {
      const t = k / 10;
      const wob = fbm3(a0 * 3 + t * 4, i * 2.1, t * 2, i * 7) * 0.14;
      pts.push(new THREE.Vector3(
        Math.cos(a0 + t * 2.6) * r0 + wob,
        (t - 0.5) * 0.66 + wob * 0.6,
        Math.sin(a0 + t * 2.6) * r0 - wob
      ));
    }
    nucleus.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, 0.028, 6), chrMat));
  }
}
animalCell.add(nucleus);
registerOrg('细胞核', nucleus, '遗传信息库（DNA 所在地），控制细胞代谢与遗传；核膜双层、有核孔；核仁与核糖体的形成有关。');

/* --- 线粒体：剖开胶囊 + 基质 + 嵴片，膜半透明可透视 --- */

function makeMitochondrion(scale = 1) {
  const g = new THREE.Group();
  const shellMat = ghostify(matCoat(PAL.mitoShell, {
    roughness: 0.34, clearcoatRoughness: 0.2, opacity: 0.42,
    emissive: 0x66200e, emissiveIntensity: 0.3,
  }), 0.42);
  const capMat = matStd(PAL.mitoMatrix, { roughness: 0.55, emissive: 0x7c2a12, emissiveIntensity: 0.4 });
  capMat.side = THREE.DoubleSide;
  const body = makeCutCapsule({
    radius: 0.27, halfLen: 0.5, wedge: Math.PI * 1.3, segs: 22,
    mats: { shell: shellMat, cap: capMat },
  });
  g.add(body);
  /* 基质：内部的发光芯 */
  const matrixMat = G(matGlow(PAL.mitoInner, 0.35, { color: 0xe05a30, roughness: 0.5 }), 0.35, 2.1);
  const matrix = mesh(new THREE.CapsuleGeometry(0.18, 0.44, 6, 14), matrixMat);
  matrix.rotation.z = TAU / 4;
  g.add(matrix);
  /* 嵴片：内膜折叠的弧板 */
  const cristaMat = G(matStd(PAL.cristae, { roughness: 0.42, emissive: 0x501404, emissiveIntensity: 0.4, side: THREE.DoubleSide }), 0.4, 1.8);
  for (let i = 0; i < 6; i++) {
    const arc = mesh(new THREE.TorusGeometry(0.17, 0.02, 6, 14, Math.PI * 0.9), cristaMat);
    arc.position.set(-0.36 + i * 0.14, 0, 0);
    arc.rotation.y = TAU / 4;
    arc.rotation.z = 0.25 * (i % 2 ? 1 : -1);
    arc.scale.set(1, 1.35, 1);
    g.add(arc);
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

/* --- 内质网：管状缠绕 + 附膜核糖体 --- */

const erGroup = new THREE.Group();
erGroup.position.set(0.75, 0.75, -0.35);
const erTubeMat = ghostify(matCoat(PAL.rer, { roughness: 0.36, opacity: 0.85, clearcoatRoughness: 0.22 }), 0.85);
const erCurves = [];
for (let c = 0; c < 2; c++) {
  const pts = [];
  const off = c * 0.16;
  for (let i = 0; i <= 40; i++) {
    const t = i / 40;
    pts.push(new THREE.Vector3(
      Math.cos(t * TAU * 1.6 + c * 1.2) * 0.55 * (1 - t * 0.3) + off,
      Math.sin(t * TAU * 2.2 + c) * 0.15 + off * 0.5,
      Math.sin(t * TAU * 1.6 + c * 1.2) * 0.35 * (1 - t * 0.3)
    ));
  }
  const curve = new THREE.CatmullRomCurve3(pts);
  erCurves.push(curve);
  erGroup.add(mesh(new THREE.TubeGeometry(curve, 110, 0.085, 8), erTubeMat));
}
/* 粗面内质网：沿管壁挂核糖体珠 */
const erRiboMat = G(matStd(PAL.ribosome, { roughness: 0.42, emissive: 0x8a7638, emissiveIntensity: 0.3 }), 0.3, 0.9);
const erRibo = new THREE.InstancedMesh(new THREE.SphereGeometry(0.05, 8, 6), erRiboMat, 26);
{
  const dummy = new THREE.Object3D();
  let k = 0;
  for (const curve of erCurves) {
    for (let i = 0; i < 13; i++) {
      const p = curve.getPoint(0.08 + (i / 13) * 0.84);
      p.x += 0.09; p.z += 0.05;
      dummy.position.copy(p);
      dummy.updateMatrix();
      erRibo.setMatrixAt(k++, dummy.matrix);
    }
  }
}
erGroup.add(erRibo);
animalCell.add(erGroup);
registerOrg('内质网', erGroup, '蛋白质合成与加工、脂质合成的“车间”（粗面内质网附着核糖体；光面内质网参与脂质与解毒）。');

/* --- 游离核糖体：InstancedMesh 小球群 --- */

const riboMat = G(matStd(PAL.ribosome, { roughness: 0.45, emissive: 0x8a7638, emissiveIntensity: 0.3 }), 0.3, 0.9);
const ribGroup = new THREE.InstancedMesh(new THREE.SphereGeometry(0.055, 8, 6), riboMat, 40);
{
  const dummy = new THREE.Object3D();
  let placed = 0;
  let guard = 0;
  while (placed < 40 && guard++ < 500) {
    const p = new THREE.Vector3((Math.random() - 0.5) * 3.6, (Math.random() - 0.5) * 3.2, (Math.random() - 0.5) * 3.2);
    if (p.length() > 2.05) continue;
    if (p.distanceTo(nucleus.position) < 1.1) continue;
    dummy.position.copy(p);
    dummy.updateMatrix();
    ribGroup.setMatrixAt(placed++, dummy.matrix);
  }
  ribGroup.count = placed;
}
animalCell.add(ribGroup);
registerOrg('核糖体', ribGroup, '“生产蛋白质的机器”——无膜结构，将氨基酸缩合成肽链；附着在内质网上的合成分泌蛋白，游离的合成胞内蛋白。');

/* --- 高尔基体：弧形扁囊堆 + 出芽囊泡 --- */

const golgi = new THREE.Group();
golgi.position.set(-1.1, -1.15, 0.15);
golgi.rotation.set(0.2, 0.3, -0.25);
{
  const sacMat = ghostify(matCoat(PAL.golgi, { roughness: 0.32, opacity: 0.92, clearcoatRoughness: 0.2 }), 0.92);
  for (let i = 0; i < 5; i++) {
    const sac = mesh(new THREE.SphereGeometry(0.42, 22, 12), sacMat);
    sac.scale.set(1.15 - i * 0.06, 0.13, 0.55 - i * 0.04);
    sac.position.y = (i - 2) * 0.15;
    sac.rotation.y = 0.16 * (i - 2);
    golgi.add(sac);
  }
  const vesMat = G(matGlow(PAL.vesicle, 0.3, { color: 0xd8a850, roughness: 0.4 }), 0.3, 1.2);
  [[0.5, 0.38, 0.1], [0.62, 0.05, -0.12], [-0.5, -0.42, 0.08]].forEach(([x, y, z]) => {
    const v = mesh(new THREE.SphereGeometry(0.085, 12, 10), vesMat);
    v.position.set(x, y, z);
    golgi.add(v);
  });
}
animalCell.add(golgi);
registerOrg('高尔基体', golgi, '“发送站”：对来自内质网的蛋白质做加工、分类与包装，再派发囊泡运往目的地（植物细胞还与细胞壁形成有关）。');

/* --- 溶酶体：ghost 粉膜 + 内部水解酶颗粒 --- */

const lysoGroup = new THREE.Group();
lysoGroup.position.set(1.7, 1.35, -0.5);
const lyso1 = new THREE.Group();
{
  const lysoMat = ghostify(matCoat(PAL.lysosome, { roughness: 0.3, opacity: 0.5 }), 0.5);
  const body = mesh(new THREE.SphereGeometry(0.2, 20, 14), lysoMat);
  const granMat = G(matGlow(PAL.granule, 0.3, { color: 0xe88aa8, roughness: 0.5 }), 0.3, 1.1);
  const granules = new THREE.InstancedMesh(new THREE.SphereGeometry(0.038, 8, 6), granMat, 10);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < 10; i++) {
    dummy.position.set((Math.random() - 0.5) * 0.24, (Math.random() - 0.5) * 0.24, (Math.random() - 0.5) * 0.24);
    dummy.updateMatrix();
    granules.setMatrixAt(i, dummy.matrix);
  }
  lyso1.add(body, granules);
}
lysoGroup.add(lyso1);
const lysoMat2 = ghostify(matCoat(PAL.lysosome, { roughness: 0.3, opacity: 0.5 }), 0.5);
const lyso2 = mesh(new THREE.SphereGeometry(0.15, 16, 12), lysoMat2);
lyso2.position.set(-1.6, 0.15, -0.4);
lysoGroup.add(lyso2);
animalCell.add(lysoGroup);
registerOrg('溶酶体', lyso1, '“消化车间”：内含多种水解酶，分解衰老的细胞器和吞入的病原体（内部为酸性环境）。');

/* --- 中心体：两个垂直的中心粒（9 束微管用 9 边棱柱示意） --- */

const centro = new THREE.Group();
centro.position.set(-1.25, 1.5, -0.2);
{
  const centMat = G(matStd(PAL.centriole, { roughness: 0.35, metalness: 0.25, emissive: 0x6a7288, emissiveIntensity: 0.25 }), 0.25, 0.9);
  const c1 = mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.34, 9), centMat);
  const c2 = mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.34, 9), centMat);
  c2.rotation.x = TAU / 4;
  c2.position.x = 0.27;
  centro.add(c1, c2);
}
animalCell.add(centro);
registerOrg('中心体', centro, '动物和低等植物细胞特有；由两个互相垂直排列的中心粒组成，与细胞的有丝分裂有关（发出星射线形成纺锤体）。');

const animalLabels = organelles.map((o) => o.group.userData.lbl);

/* ================= 植物细胞（壁剖壳 + 大液泡 + 叶绿体） ================= */

const plantCell = new THREE.Group();
plantCell.visible = false;
scene.add(plantCell);
{
  /* 细胞壁：厚壁剖壳 */
  const wallOuter = ghostify(matCoat(PAL.cellWall, { roughness: 0.55, opacity: 0.42 }), 0.42);
  const wallBand = matStd(PAL.cellWallDeep, { roughness: 0.6, side: THREE.DoubleSide, emissive: 0x1a2c08, emissiveIntensity: 0.5 });
  const wallShell = makeCutShell({
    radius: 2.75, thickness: 0.3, wedge: Math.PI * 1.16,
    amp: 0.05, freq: 2.1, seed: 41, segsP: 56, segsT: 40,
    mats: { outer: wallOuter, inner: matStd(PAL.cellWall, { roughness: 0.6, opacity: 0.3, transparent: true, depthWrite: false, side: THREE.DoubleSide }), band: wallBand },
  });
  wallShell.rotation.y = Math.PI;
  plantCell.add(wallShell);
  const wallLbl = label('细胞壁（全透性·支持保护）', '#dff0cc', 0.0042);
  wallLbl.position.set(0, 3.35, 0);
  plantCell.add(wallLbl);
  /* 内侧细胞膜 + 胞质 */
  const pm = ghostify(matCoat(PAL.membrane, { roughness: 0.4, opacity: 0.3 }), 0.3);
  const cyto = ghostify(matSheen(0x35606a, { roughness: 0.62, sheen: 0.6, sheenColor: 0x8fd0d8, emissive: 0x0c2228, emissiveIntensity: 0.5 }), 0.5);
  const inner = new THREE.Group();
  inner.add(mesh(new THREE.SphereGeometry(2.4, 44, 30, 0, Math.PI * 1.16, 0, Math.PI), pm));
  inner.add(mesh(new THREE.SphereGeometry(2.32, 40, 28, 0, Math.PI * 1.16, 0, Math.PI), cyto));
  inner.rotation.y = Math.PI;
  plantCell.add(inner);
  /* 大液泡：中央 ghost 水球 */
  const vacMat = G(ghostify(matCoat(PAL.vacuole, { roughness: 0.22, opacity: 0.38, clearcoatRoughness: 0.15, emissive: 0x123a5c, emissiveIntensity: 0.3 }), 0.38), 0.3, 1.4, { illusO: 0.38, fluorO: 0.25 });
  const vac = mesh(new THREE.SphereGeometry(1.32, 36, 26), vacMat);
  vac.position.set(0, -0.35, 0);
  plantCell.add(vac);
  const vacLbl = label('大液泡（细胞液·维持渗透压）', '#bfe2f8', 0.0042);
  vacLbl.position.set(0, -1.95, 0);
  plantCell.add(vacLbl);
  /* 细胞核（贴边小核） */
  const nucMat = ghostify(matCoat(PAL.nucleus, { roughness: 0.32, opacity: 0.6 }), 0.6);
  const nuc = mesh(new THREE.SphereGeometry(0.6, 28, 20), nucMat);
  nuc.position.set(-1.3, 1.15, 0.2);
  plantCell.add(nuc);
  /* 叶绿体 ×6：双凸透镜体 + 类囊体基粒盘 + 淀粉粒 */
  const thylakoidMat = G(matGlow(PAL.thylakoid, 0.3, { color: 0x2a9448, roughness: 0.45 }), 0.3, 1.7);
  const thylakoids = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.09, 0.09, 0.035, 10), thylakoidMat, 18);
  const starchMat = matStd(PAL.starch, { roughness: 0.6 });
  let thIdx = 0;
  const mCh = new THREE.Matrix4();
  const mLocal = new THREE.Matrix4();
  const mOne = new THREE.Vector3(1, 1, 1);
  const mQ = new THREE.Quaternion();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU;
    const ch = new THREE.Group();
    ch.position.set(Math.cos(a) * 1.6, Math.sin(a * 1.3) * 1.15, Math.sin(a) * 0.9);
    ch.rotation.set(Math.random() * 2, Math.random() * 2, Math.random() * 2);
    const bodyMat = ghostify(matCoat(PAL.chloroplast, { roughness: 0.4, opacity: 0.55, emissive: 0x0e3a14, emissiveIntensity: 0.4 }), 0.55);
    const body = mesh(new THREE.SphereGeometry(0.28, 18, 12), bodyMat);
    body.scale.set(1.3, 0.75, 1);
    ch.add(body);
    for (let k = 0; k < 3; k++) {
      /* 基粒盘实例矩阵 = 叶绿体位姿 × 盘局部位姿（随叶绿体一起转） */
      mCh.makeRotationFromEuler(ch.rotation).setPosition(ch.position);
      mLocal.compose(
        new THREE.Vector3(0, -0.08 + k * 0.085, 0),
        mQ.setFromEuler(new THREE.Euler(0, Math.random() * TAU, 0)),
        mOne
      );
      thylakoids.setMatrixAt(thIdx++, mCh.clone().multiply(mLocal));
    }
    const starch = mesh(new THREE.SphereGeometry(0.05, 8, 6), starchMat);
    starch.position.set(0.12, 0.05, 0.1);
    ch.add(starch);
    plantCell.add(ch);
  }
  thylakoids.count = thIdx;
  plantCell.add(thylakoids);
  const chLbl = label('叶绿体（类囊体基粒·光合作用）', '#a8e8b4', 0.0042);
  chLbl.position.set(2.9, 1.6, 0);
  plantCell.add(chLbl);
  /* 线粒体一枚 */
  const pm1 = makeMitochondrion(0.7);
  pm1.position.set(1.4, 1.7, -0.4);
  plantCell.add(pm1);
}

/* ================= 原核细胞（杆菌剖壳 + 拟核 DNA 环） ================= */

const prok = new THREE.Group();
prok.visible = false;
scene.add(prok);
const prokLabels = [];
{
  /* 杆菌壁：剖开胶囊壳 */
  const wallMat = ghostify(matCoat(PAL.capsule, { roughness: 0.45, opacity: 0.42 }), 0.42);
  const bandMatP = matStd(0x5a9a84, { roughness: 0.55, side: THREE.DoubleSide, emissive: 0x123028, emissiveIntensity: 0.5 });
  const shell = makeCutCapsule({ radius: 1.0, halfLen: 1.1, wedge: Math.PI * 1.2, segs: 26, mats: { shell: wallMat, cap: bandMatP } });
  shell.rotation.z = TAU / 4;
  prok.add(shell);
  /* 胞内：半透明青质芯 */
  const innerMat = ghostify(matSheen(0x2e5a58, { roughness: 0.6, sheen: 0.55, sheenColor: 0x86d0c8, emissive: 0x0a2422, emissiveIntensity: 0.5 }), 0.4);
  const innerCap = mesh(new THREE.CapsuleGeometry(0.9, 2.1, 10, 22), innerMat);
  innerCap.rotation.z = TAU / 4;
  prok.add(innerCap);
  /* 拟核：环状 DNA 管线团 */
  const dnaMat = G(matGlow(PAL.dna, 0.45, { color: 0xb28ae0, roughness: 0.4 }), 0.45, 2.2);
  const nucPts = [];
  for (let i = 0; i <= 60; i++) {
    const t = i / 60;
    const wob = fbm3(t * 5, 1.7, t * 3, 91) * 0.12;
    nucPts.push(new THREE.Vector3(
      Math.cos(t * TAU * 2.2) * 0.42 + wob,
      Math.sin(t * TAU * 3.1) * 0.3,
      Math.sin(t * TAU * 2.2) * 0.34 + wob
    ));
  }
  prok.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(nucPts), 120, 0.05, 6), dnaMat));
  const nucLbl = label('拟核：环状 DNA（无核膜包被）', '#e2c8ff', 0.0044);
  nucLbl.position.set(0, 1.75, 0);
  prok.add(nucLbl); prokLabels.push(nucLbl);
  /* 质粒小环 ×2 */
  const plasmidMat = G(matGlow(PAL.plasmid, 0.35, { color: 0xd88ab4, roughness: 0.45 }), 0.35, 1.9);
  [[0.55, 0.25, 0.3], [-0.5, -0.2, 0.45]].forEach(([x, y, z]) => {
    const ring = mesh(new THREE.TorusGeometry(0.09, 0.02, 6, 20), plasmidMat);
    ring.position.set(x, y, z);
    ring.rotation.set(0.8, 0.4, 0);
    prok.add(ring);
  });
  /* 核糖体散点 */
  const riboMatP = G(matStd(PAL.ribosome, { roughness: 0.45, emissive: 0x8a7638, emissiveIntensity: 0.3 }), 0.3, 0.9);
  const ribos = new THREE.InstancedMesh(new THREE.SphereGeometry(0.05, 8, 6), riboMatP, 26);
  const dummy = new THREE.Object3D();
  let placed = 0, guard = 0;
  while (placed < 26 && guard++ < 200) {
    const p = new THREE.Vector3((Math.random() - 0.5) * 2.1, (Math.random() - 0.5) * 1.15, (Math.random() - 0.5) * 1.2);
    if (p.length() < 0.62) continue;
    dummy.position.copy(p);
    dummy.updateMatrix();
    ribos.setMatrixAt(placed++, dummy.matrix);
  }
  ribos.count = placed;
  prok.add(ribos);
  /* 壁与荚膜标注 */
  const wallLbl = label('细胞壁 + 细胞膜', '#dcecc4', 0.0044);
  wallLbl.position.set(0, -1.75, 0);
  prok.add(wallLbl); prokLabels.push(wallLbl);
  /* 鞭毛：螺旋推进器 */
  const flagPts = [];
  for (let i = 0; i <= 50; i++) {
    const t = i / 50;
    flagPts.push(new THREE.Vector3(-1.7 - t * 1.5, Math.sin(t * TAU * 3) * 0.16, Math.cos(t * TAU * 3) * 0.16));
  }
  const flag = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(flagPts), 90, 0.03, 6), matStd(PAL.flagellum, { roughness: 0.5 }));
  prok.add(flag);
  prok.userData.flag = flag;
  const flagLbl = label('鞭毛（摆动推进）', '#b8e6ff', 0.0042);
  flagLbl.position.set(-2.6, 0.8, 0);
  prok.add(flagLbl); prokLabels.push(flagLbl);
  /* 菌毛：短须 ×5 */
  const piliMat = matStd(PAL.pili, { roughness: 0.55 });
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * TAU + 0.4;
    const pilus = mesh(new THREE.CylinderGeometry(0.012, 0.008, 0.42, 5), piliMat);
    pilus.position.set(Math.cos(a) * 1.0, 0.2, Math.sin(a) * 1.0);
    pilus.rotation.set(Math.sin(a) * 1.2, 0, -Math.cos(a) * 1.2);
    prok.add(pilus);
  }
}

/* ================= 章节 5：流动镶嵌模型 ================= */

const gMembrane = new THREE.Group();
gMembrane.visible = false;
scene.add(gMembrane);

const BIL_X = 7, BIL_Y = 5;
const HEAD_N = BIL_X * BIL_Y * 2;
const headMat = matCoat(PAL.membraneHi, { roughness: 0.4, clearcoatRoughness: 0.22, emissive: 0x40230e, emissiveIntensity: 0.35 });
const tailMat = matStd(PAL.membrane, { roughness: 0.6 });
const headMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(0.16, 12, 9), headMat, HEAD_N);
const tailMesh = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.035, 0.035, 0.5, 6), tailMat, HEAD_N);
gMembrane.add(headMesh, tailMesh);

const lipState = [];
{
  const dummy = new THREE.Object3D();
  for (const layer of [-1, 1]) {
    for (let gx = 0; gx < BIL_X; gx++) {
      for (let gz = 0; gz < BIL_Y; gz++) {
        lipState.push({
          x: (gx - (BIL_X - 1) / 2) * 0.62 + (Math.random() - 0.5) * 0.1,
          z: (gz - (BIL_Y - 1) / 2) * 0.62 + (Math.random() - 0.5) * 0.1,
          layer, phase: Math.random() * TAU, speed: 0.3 + Math.random() * 0.6,
        });
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

const proteins = [];
function addProtein(x, z, kind) {
  const g = new THREE.Group();
  if (kind === 'channel') {
    const tube = mesh(new THREE.CylinderGeometry(0.22, 0.22, 1.25, 14, 1, true), ghostify(matCoat(PAL.rer, { roughness: 0.3, opacity: 0.7 }), 0.7));
    g.add(tube);
  } else {
    const blob = mesh(new THREE.SphereGeometry(0.3, 16, 12), matCoat(PAL.ser, { roughness: 0.4 }));
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

const sugars = new THREE.Group();
gMembrane.add(sugars);
{
  const sm = G(matStd(PAL.stroma, { roughness: 0.45, emissive: 0x3e5a20, emissiveIntensity: 0.3 }), 0.3, 1.4);
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

{
  /* 膜剖面：双层磷脂板（头排亮 / 尾层暗） */
  const slabTail = mesh(new THREE.BoxGeometry(7.2, 0.34, 2.2), matStd(PAL.membrane, { roughness: 0.58 }));
  gTransport.add(slabTail);
  const slabHead = mesh(new THREE.BoxGeometry(7.2, 0.1, 2.2), matCoat(PAL.membraneHi, { roughness: 0.4, clearcoatRoughness: 0.2, emissive: 0x40230e, emissiveIntensity: 0.35 }));
  slabHead.position.y = 0.22;
  const slabHead2 = slabHead.clone();
  slabHead2.position.y = -0.22;
  gTransport.add(slabHead, slabHead2);
  const hm = matStd(PAL.membraneHi, { roughness: 0.45 });
  for (let i = 0; i < 18; i++) {
    const h1 = mesh(new THREE.SphereGeometry(0.09, 10, 8), hm);
    h1.position.set(-3.4 + i * 0.4, 0.32, 0);
    const h2 = h1.clone(); h2.position.y = -0.32;
    gTransport.add(h1, h2);
  }
}
const channelT = mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.9, 16, 1, true), ghostify(matCoat(PAL.rer, { roughness: 0.32, opacity: 0.8 }), 0.8));
channelT.position.set(-1.6, 0, 0);
const pumpB = mesh(new THREE.BoxGeometry(0.5, 0.85, 0.5), matCoat(PAL.lysosome, { roughness: 0.38, emissive: 0x4a1028, emissiveIntensity: 0.35 }));
pumpB.position.set(1.7, 0, 0);
gTransport.add(channelT, pumpB);
const chLbl = label('通道蛋白', '#b0ccff', 0.0042);
chLbl.position.set(-1.6, 0.9, 0);
const pumpLbl = label('载体蛋白（泵）', '#f2a8c4', 0.0042);
pumpLbl.position.set(1.7, 0.9, 0);
const atpLbl = label('ATP → ADP＋Pi', '#ffd166', 0.0042);
atpLbl.position.set(2.6, 1.5, 0);
atpLbl.visible = false;
const concHigh = label('高浓度（上）', '#a8e4ff', 0.0044);
concHigh.position.set(3.55, 2.3, 0);
const concLow = label('低浓度（下）', '#b9c8dd', 0.0044);
concLow.position.set(3.55, -2.3, 0);
const concArrow = label('顺浓度梯度 ↓', '#a8e4ff', 0.004);
concArrow.position.set(3.55, 0, 0);
gTransport.add(chLbl, pumpLbl, atpLbl, concHigh, concLow, concArrow);

const atpSpark = new THREE.Sprite(new THREE.SpriteMaterial({
  map: (() => {
    const cv = document.createElement('canvas'); cv.width = cv.height = 64;
    const cx = cv.getContext('2d');
    const g = cx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,214,120,1)'); g.addColorStop(1, 'rgba(255,214,120,0)');
    cx.fillStyle = g; cx.fillRect(0, 0, 64, 64);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
    return t;
  })(),
  transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0,
}));
atpSpark.position.set(1.7, 0.75, 0);
atpSpark.scale.set(0.9, 0.9, 1);
gTransport.add(atpSpark);

const tParts = [];
{
  const pm1 = G(matGlow(0x8adfff, 0.9, { color: 0x4aa8c8 }), 0.9, 2.2);
  const pm2 = G(matGlow(0x9ae89a, 0.9, { color: 0x4a9a4a }), 0.9, 2.2);
  for (let i = 0; i < 22; i++) {
    const m = mesh(new THREE.SphereGeometry(0.09, 10, 8), i % 2 ? pm1 : pm2);
    m.visible = false;
    gTransport.add(m);
    tParts.push({ m, t: 0, active: false, lane: 0, delay: Math.random() * 3 });
  }
}
const endoVes = mesh(new THREE.SphereGeometry(0.42, 18, 14), ghostify(matCoat(PAL.membraneHi, { roughness: 0.35, opacity: 0.5 }), 0.5));
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
    if (m === 'free') spawnT(1);
    else if (m === 'facil') spawnT(1);
    else if (m === 'active') spawnT(-1);
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

const secStations = [
  { name: '① 核糖体（合成肽链）', pos: [-3.5, 0.9, 0], info: '游离…不，附着在内质网上的核糖体，按 mRNA 指令把氨基酸连成肽链。' },
  { name: '② 内质网（加工折叠）', pos: [-1.7, 1.2, 0], info: '肽链进入内质网腔，进行折叠、组装、加上糖链，成为较成熟的蛋白质。' },
  { name: '③ 囊泡（运输）', pos: [-0.2, 1.5, 0], info: '内质网“出芽”形成囊泡，包裹蛋白质运往高尔基体。' },
  { name: '④ 高尔基体（包装派发）', pos: [1.4, 1.4, 0], info: '进一步加工分类，包装进分泌囊泡，运向细胞膜。' },
  { name: '⑤ 细胞膜（胞吐释放）', pos: [3.3, 1.0, 0], info: '囊泡与细胞膜融合，把蛋白质分泌到细胞外（如消化酶、抗体、部分激素）。' },
];
{
  /* 内质网：弯管 */
  const erPts = [];
  for (let i = 0; i <= 30; i++) {
    const t = i / 30;
    erPts.push(new THREE.Vector3(secStations[1].pos[0] + Math.cos(t * TAU * 1.2) * 0.75, secStations[1].pos[1] - 0.35 + Math.sin(t * TAU * 2) * 0.2, Math.sin(t * TAU * 1.2) * 0.35));
  }
  gSecret.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(erPts), 90, 0.13, 8), ghostify(matCoat(PAL.rer, { roughness: 0.34, opacity: 0.85 }), 0.85)));
  /* 高尔基体：扁囊堆 */
  const gg = new THREE.Group();
  gg.position.set(...secStations[3].pos);
  gg.position.y -= 0.35;
  const sacMat = ghostify(matCoat(PAL.golgi, { roughness: 0.34, opacity: 0.9 }), 0.9);
  for (let i = 0; i < 4; i++) {
    const sac = mesh(new THREE.SphereGeometry(0.44, 20, 12), sacMat);
    sac.scale.set(0.95 - i * 0.07, 0.12, 0.5 - i * 0.04);
    sac.position.y = (i - 1.5) * 0.16;
    gg.add(sac);
  }
  gSecret.add(gg);
  /* 细胞膜：竖直膜板 */
  const memSlab = mesh(new THREE.CapsuleGeometry(2.1, 2.6, 6, 20), ghostify(matCoat(PAL.membrane, { roughness: 0.4, opacity: 0.4 }), 0.4));
  memSlab.scale.set(0.22, 1, 1);
  memSlab.position.set(4.35, -0.35, 0);
  gSecret.add(memSlab);
  /* 线粒体供能 */
  const mito = makeMitochondrion(0.65);
  mito.position.set(1.4, -1.3, 0);
  gSecret.add(mito);
  const mitoLbl = label('线粒体供能', '#f0935e', 0.0038);
  gSecret.add(mitoLbl);
  mitoLbl.position.set(1.4, -2.0, 0);
  /* 站点标记 */
  secStations.forEach((s) => {
    const lb = label(s.name, '#eef3fa', 0.004);
    lb.position.set(s.pos[0], s.pos[1] + 0.75, s.pos[2]);
    gSecret.add(lb);
    const dot = mesh(new THREE.SphereGeometry(0.09, 10, 8), G(matGlow(0xe8ecf6, 0.4, { color: 0x9aa8bc, roughness: 0.4 }), 0.4, 1.8));
    dot.position.set(s.pos[0], s.pos[1], s.pos[2]);
    gSecret.add(dot);
    s.lbl = lb;
  });
}
const secDots = [];
{
  const cargoMat = G(matGlow(PAL.vesicle, 0.7, { color: 0xe8b050, roughness: 0.35 }), 0.7, 2.6);
  for (let i = 0; i < 3; i++) {
    const d = mesh(new THREE.SphereGeometry(0.14, 12, 10), cargoMat);
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

const mtubes = [];
{
  const center = new THREE.Vector3(0, 0.3, 0);
  const cs = mesh(new THREE.SphereGeometry(0.18, 14, 10), matCoat(PAL.centriole, { roughness: 0.35, metalness: 0.2 }));
  cs.position.copy(center);
  gSkello.add(cs);
  /* 微管：荧光管 */
  const mtMat = G(matGlow(PAL.microtubule, 0.5, { color: 0x4a9ac4, roughness: 0.4 }), 0.5, 2.4);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU;
    const dir = new THREE.Vector3(Math.cos(a), (Math.random() - 0.35) * 0.8, Math.sin(a)).normalize();
    const len = 2.0 + Math.random() * 1.2;
    const pts = [];
    for (let k = 0; k <= 12; k++) {
      const t = k / 12;
      pts.push(center.clone().add(dir.clone().multiplyScalar(t * len)).add(new THREE.Vector3(0, 0, Math.sin(t * 6 + i) * 0.05)));
    }
    const tube = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.045, 6), mtMat);
    gSkello.add(tube);
    mtubes.push({ pts, curve: new THREE.CatmullRomCurve3(pts) });
  }
  /* 微丝 */
  const actinMat = G(matGlow(PAL.actin, 0.45, { color: 0xc4608e, roughness: 0.45 }), 0.45, 2.0);
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
    gSkello.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.025, 6), actinMat));
  }
}

const motor = new THREE.Group();
{
  const feet = mesh(new THREE.BoxGeometry(0.22, 0.06, 0.12), matCoat(PAL.actin, { roughness: 0.4 }));
  const body = mesh(new THREE.SphereGeometry(0.1, 12, 8), matGlow(PAL.granule, 0.4, { color: 0xd88aa8 }));
  body.position.y = 0.16;
  const cargo = mesh(new THREE.SphereGeometry(0.22, 14, 10), G(ghostify(matCoat(PAL.vacuole, { roughness: 0.3, opacity: 0.8 }), 0.8), 0.3, 1.6, { illusO: 0.8, fluorO: 0.6 }));
  cargo.position.y = 0.42;
  motor.add(feet, body, cargo);
}
gSkello.add(motor);
const motorLbl = label('驱动蛋白（马达蛋白）“步行”运货', '#ffd9ec', 0.0038);
motorLbl.position.set(0, 1.5, 0);
gSkello.add(motorLbl);

const flowParts = [];
{
  const fm = G(matGlow(PAL.vacuole, 0.35, { color: 0x5aa0c8, roughness: 0.45 }), 0.35, 1.8);
  for (let i = 0; i < 20; i++) {
    const p = mesh(new THREE.SphereGeometry(0.07, 8, 6), fm);
    gSkello.add(p);
    flowParts.push({ m: p, off: Math.random(), r: 1.4 + Math.random() * 0.7, y: (Math.random() - 0.5) * 1.4, tilt: Math.random() * 0.4 });
  }
}

const skel = { flowSpeed: 1, motorOn: true, motorT: 0, tubeMats: [], motorPath: mtubes[0].curve };

/* ---------------- 模式切换（illus / fluor） ---------------- */

let cellMode = 'illus';
function setCellMode(mode) {
  cellMode = mode;
  vfx.setMode(mode);
  applyGlowMode(glowList, mode);
  /* 荧光模式压暗膜与胞质，让发光器官跳出来 */
  const dim = mode === 'fluor';
  memMat.opacity = dim ? 0.14 : 0.4;
  memMat.emissiveIntensity = dim ? 0.05 : 0.25;
  cytoMat.opacity = dim ? 0.15 : 0.4;
  cytoMat.emissiveIntensity = dim ? 0.12 : 0.85;
  bandMat.emissiveIntensity = dim ? 0.15 : 0.6;
  keyLight.intensity = dim ? 0.55 : 1.55;
  fillLight.intensity = dim ? 0.2 : 0.6;
  ambLight.intensity = dim ? 0.1 : 0.5;
}

/* ---------------- 章节定义 ---------------- */

const ctl = createControlsPanel(document.getElementById('controls'));
let activeSectionId = null;
let activeCleanup = null;
let lastSectionIdx = -1;
let focusOrg = null;

const hud = makeHUD(document.getElementById('lcData'), [['a', '读数'], ['b', '要点'], ['c', '提示']]);
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
<p>找一找：<b>细胞核</b>（紫，含染色质）、<b>线粒体</b>（橙色带嵴）、<b>内质网</b>（青色管网）、<b>高尔基体</b>（橙黄扁囊）、<b>核糖体</b>（小点）、<b>溶酶体</b>（粉色小泡）、<b>中心体</b>（两个垂直中心粒）。</p>
<p>打开「标注」按钮认识它们；「荧光显微」切换暗视野观感；下一章逐个走近观察。</p>`,
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
        onInput: (v) => { buildCellShell(v); },
      });
      ctl.sep();
      ctl.seg({
        options: [{ label: '插画', value: 'illus' }, { label: '荧光', value: 'fluor' }],
        value: cellMode,
        onChange: (v) => { setCellMode(v); },
      });
      ctl.button({ label: '重置视角', onClick: () => app.setCamera([0, 2.0, 7.6], [0, 0.3, 0]) });
    },
    leave() {
      setCellMode('illus');
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
    html: `<p><b>细胞骨架</b>：由微管（蓝）、微丝（粉）等蛋白纤维组成，既维持形态，又是细胞内运输的“轨道”。</p>
<p><b>马达蛋白</b>（驱动蛋白）沿着微管“行走”，驮着囊泡把“货物”运到指定位置；细胞质中的颗粒随<span class="hl">胞质环流</span>缓缓流动，加速物质交换。</p>
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
        onChange: (v) => { setCellMode(v ? 'fluor' : 'illus'); },
      });
      ctl.button({ label: '重置视角', onClick: () => app.setCamera([2.6, 1.6, 5.2], [0, 0.3, 0]) });
    },
    leave() {
      setCellMode('illus');
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
  hud.el.style.display = hud.visibleNow ? '' : 'none';
  accSecs.data.classList.toggle('acc-empty', !hud.visibleNow);   /* 读数隐藏时数据块一并收走 */
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

/* 骨架章节 tick（马达蛋白沿微管步行 + 胞质环流） */
function tickSkello(dt, t) {
  flowParts.forEach((p) => {
    p.off = (p.off + dt * 0.08 * skel.flowSpeed) % 1;
    const a = p.off * TAU;
    p.m.position.set(Math.cos(a) * p.r, p.y + Math.sin(a * 2) * p.tilt, Math.sin(a) * p.r * 0.8);
  });
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

/* ---------------- 启动 ---------------- */

animalCell.visible = true;
plantCell.visible = prok.visible = false;
gMembrane.visible = gTransport.visible = gSecret.visible = gSkello.visible = false;
setCellMode('illus');

/* 调试句柄（自动化自查：模式切换 / 渲染统计） */
window.__cellDebug = { vfx, setCellMode };
loader.hide();

/* ================= 三栏布局驱动（左栏章节列表 / 右栏详解联动 / 栏折叠 / 专注模式） ================= */

const chapNav = document.getElementById('chapNav');
const chapCount = document.getElementById('chapCount');
const detailNo = document.getElementById('detailNo');
const detailTitle = document.getElementById('detailTitle');
const lessonEl = document.getElementById('lesson');
const detailBody = document.getElementById('detailBody');
const controlsEl = document.getElementById('controls');
let chapterIdx = 0;

/* 9 章竖排按钮：序号 + 标题，点击切章，当前章 .on 高亮 */
const chapBtns = SECTIONS.map((s, i) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'chap-btn';
  b.dataset.idx = String(i);
  const n = document.createElement('span');
  n.className = 'chap-n';
  n.textContent = String(i + 1).padStart(2, '0');
  const t = document.createElement('span');
  t.className = 'chap-t';
  t.textContent = s.title;
  b.append(n, t);
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
  chapCount.textContent = `${String(chapterIdx + 1).padStart(2, '0')}/${SECTIONS.length}`;
  detailNo.textContent = String(chapterIdx + 1).padStart(2, '0');
  detailTitle.textContent = sec.title;
  /* 折叠竖条上的章节信息同步（左栏序号 / 右栏竖排标题） */
  railNoL.textContent = String(chapterIdx + 1).padStart(2, '0');
  railTitleR.textContent = sec.title;
  lessonEl.innerHTML = sec.html || '';
  if (activeCleanup) { activeCleanup(); activeCleanup = null; }
  if (lastSectionIdx >= 0 && SECTIONS[lastSectionIdx].leave) SECTIONS[lastSectionIdx].leave();
  lastSectionIdx = chapterIdx;
  activeSectionId = sec.id;
  sec.enter();
  /* 本章无控件时整块手风琴收走（不动用户的手风琴偏好；数据块由帧循环按 visibleNow 同步） */
  accSecs.controls.classList.toggle('acc-empty', !controlsEl.children.length);
  detailBody.scrollTop = 0;
}

/* ---------------- 栏折叠（左右独立 28px 竖条）× 专注模式（双栏同折）统一管理 ---------------- */

const foldLBtn = document.getElementById('foldLBtn');
const unfoldLBtn = document.getElementById('unfoldLBtn');
const foldRBtn = document.getElementById('foldRBtn');
const unfoldRBtn = document.getElementById('unfoldRBtn');
const railNoL = document.getElementById('railNoL');
const railTitleR = document.getElementById('railTitleR');
const shellEl = document.getElementById('cellShell');
const focusBtn = document.getElementById('focusBtn');

const FOLD_KEY = { l: 'cell.foldL', r: 'cell.foldR' };
let foldL = false;
let foldR = false;
let focusSaved = null; /* 进入专注模式前的独立折叠状态 [foldL, foldR]，退出时恢复 */

try {
  foldL = localStorage.getItem(FOLD_KEY.l) === '1';
  foldR = localStorage.getItem(FOLD_KEY.r) === '1';
} catch (e) { /* localStorage 不可用（隐私模式等）时仅本次会话内生效 */ }

function applyFold() {
  shellEl.classList.toggle('fold-l', foldL);
  shellEl.classList.toggle('fold-r', foldR);
  for (const [btn, folded] of [[foldLBtn, foldL], [unfoldLBtn, foldL], [foldRBtn, foldR], [unfoldRBtn, foldR]]) {
    btn.setAttribute('aria-expanded', String(!folded));
  }
}

/* 专注模式：双栏同时折叠；退出恢复进入前状态（不写 localStorage，保持独立折叠记忆不变） */
function setFocus(on) {
  if (on && focusSaved === null) {
    focusSaved = [foldL, foldR];
    foldL = true;
    foldR = true;
  } else if (!on && focusSaved !== null) {
    [foldL, foldR] = focusSaved;
    focusSaved = null;
  }
  shellEl.classList.toggle('focus-mode', on);
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

const ACC_KEYS = { lesson: 'cell.accLesson', controls: 'cell.accControls', data: 'cell.accData' };
const accSecs = {
  lesson: document.getElementById('accLesson'),
  controls: document.getElementById('accControls'),
  data: document.getElementById('accData'),
};

const NARROW_VIEW = window.innerWidth <= 1100;   /* 小屏首访清爽态判据 */
const accClosed = {};
for (const name of Object.keys(accSecs)) {
  let saved = null;
  try { saved = localStorage.getItem(ACC_KEYS[name]); } catch (e) { /* 忽略 */ }
  /* 首访（无记忆）：≤1100px 默认收起数据读数；此后记忆优先，不随视口变 */
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

window.__eduSections = { select: selectChapter };
selectChapter(0);
