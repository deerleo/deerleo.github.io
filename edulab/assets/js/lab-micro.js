/* EduLab · 显微镜实验台（micro）
 * 章节：认识显微镜 / 规范操作 / 成像特点 / 低倍换高倍 / 判断污点位置 / 植物细胞 / 动物细胞 /
 *       草履虫 / 叶片与叶绿体 / 质壁分离与复原 / 有丝分裂 / 血涂片与油镜 / 测微尺 / 血球计数板 /
 *       明场暗场与相差 / 自由观察
 * 视觉工艺（edu-vfx 接入）：
 *       - 后处理管线：暖调工作室背景 + bloom + 暗角 + 颗粒
 *       - 场景叙事：程序化木纹实验桌 + 试剂瓶阵列（LatheGeometry + 标签贴图）+
 *         载玻片盒 / 擦镜纸盒，显微镜为绝对主角
 *       - 金属分层：烤漆 clearcoat / 哑光镜臂 / 橡胶旋钮 / 镀铬面 / 黄铜压片 / transmission 镜片
 *       - 目镜视野：样品离屏画布 + 明场/暗场(反相)/相差(光晕) 合成 + 非线性离焦 + 油镜增亮
 * 章节结构 / 交互逻辑 / 随堂检测与旧版一致。
 */
import {
  THREE, TAU, clamp,
  createApp, makeLoader,
  createSections, createControlsPanel, makeHUD, makeTextSprite,
} from './edu-core.js';
import {
  PAL, attachVFX, makeStudioEnvironment,
  matSheen, matCoat, matStd, matGlass,
  makeWoodTexture, makeLabelTexture,
} from './edu-vfx.js';

/* ---------------- 基础与工艺接入 ---------------- */

const stage = document.getElementById('stage');
const loader = makeLoader(stage, '正在组装显微镜…');
const app = createApp({
  container: stage,
  fov: 42, near: 0.1, far: 100,
  cameraPos: [6.2, 7.0, 12.8], target: [0.75, 1.0, -0.25],
  minDistance: 0.9, maxDistance: 30,
  keepBackground: true,
});
const { scene } = app;
const vfx = attachVFX(app, 'illus', { bg: 'studio-warm' });
scene.environment = makeStudioEnvironment(app.renderer);

/* 灯光：暖主光 + 冷补光 + 低环境 + 台下光源点光 */
const keyLight = new THREE.DirectionalLight(0xffdcae, 3.2);
keyLight.position.set(4.5, 7.5, 6);
scene.add(keyLight);
const frontLight = new THREE.DirectionalLight(0xe8f0ff, 1.0);
frontLight.position.set(1.5, 3, 9);
scene.add(frontLight);
const fillLight = new THREE.DirectionalLight(0x9ab6cc, 0.6);
fillLight.position.set(-5.5, 4, -4);
scene.add(fillLight);
const ambLight = new THREE.AmbientLight(0x9a948a, 0.5);
scene.add(ambLight);
const lampPoint = new THREE.PointLight(0xffd9a0, 2.2, 5, 1.6);
lampPoint.position.set(0, 0.55, 0.6);
scene.add(lampPoint);

const mesh = (geo, mat) => new THREE.Mesh(geo, mat);
function label(text, color = '#ffffff', scale = 0.0042, bg = 'rgba(8,12,18,0.72)') {
  return makeTextSprite(text, { fontSize: 32, color, scale, bg });
}

/* ---------------- 材质分层（金属工艺） ---------------- */

const M_ENAMEL = matCoat(0x3a414c, { roughness: 0.34, metalness: 0.12, clearcoat: 0.8, clearcoatRoughness: 0.16 });
const M_ARM = matStd(0x3f4652, { roughness: 0.52, metalness: 0.1 });           // 哑光漆镜臂
const M_DARK = matStd(0x1f242b, { roughness: 0.42, metalness: 0.42 });         // 深色饰件
const M_RUBBER = matStd(0x1d2126, { roughness: 0.88, metalness: 0.04 });       // 橡胶握纹
const M_CHROME = matStd(0xbcc4cc, { roughness: 0.16, metalness: 1 });          // 镀铬面
const M_BRASS = matStd(PAL.brass, { roughness: 0.3, metalness: 1 });           // 黄铜压片
const M_GLASS = matGlass(0xe6f0f2, { transmission: 0.92, thickness: 0.35, roughness: 0.05 }); // 镜片

/* ================= 木纹实验桌 + 桌面道具 ================= */

{
  const woodTop = makeWoodTexture({ base: '#7c5533', dark: '#58391f', light: '#96703f', streaks: 110, bands: 8, seed: 23 });
  woodTop.repeat.set(2.2, 1.6);
  const tableMat = matStd(0xffffff, { roughness: 0.62, metalness: 0.04 });
  tableMat.map = woodTop;
  const tableMatSide = matStd(0x4e341e, { roughness: 0.7 });
  /* 桌面主体：顶面 y=0 */
  const top = mesh(new THREE.BoxGeometry(9.6, 0.16, 6.6), tableMat);
  top.position.set(0, -0.08, 0);
  /* 前缘封边 */
  const edge = mesh(new THREE.BoxGeometry(9.6, 0.5, 0.16), tableMatSide);
  edge.position.set(0, -0.42, 3.3);
  const edge2 = mesh(new THREE.BoxGeometry(9.6, 0.5, 0.16), tableMatSide);
  edge2.position.set(0, -0.42, -3.3);
  scene.add(top, edge, edge2);
}
/* 试剂瓶（LatheGeometry 瓶身 + 液体 + 瓶盖 + 化学式标签） */
function makeBottle(x, z, liquidColor, labelText, heightScale = 1) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  /* 瓶身旋转轮廓：底 → 鼓腹 → 收肩 → 颈口 */
  const prof = [
    [0.0, 0], [0.26, 0], [0.3, 0.03], [0.36, 0.18], [0.4, 0.42], [0.36, 0.62], [0.2, 0.78], [0.14, 0.88], [0.14, 1.0], [0.17, 1.04],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  const glass = matGlass(0xdfeae8, { transmission: 0.85, thickness: 0.25, roughness: 0.08, opacity: 0.42 });
  const body = mesh(new THREE.LatheGeometry(prof, 26), glass);
  g.add(body);
  /* 内液（饱和色 + 自发光，玻璃罩着也读得出色相） */
  const liquid = mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.5, 20), matStd(liquidColor, { roughness: 0.3, emissive: liquidColor, emissiveIntensity: 0.38 }));
  liquid.position.y = 0.4;
  g.add(liquid);
  /* 瓶盖 */
  const cap = mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.12, 16), M_RUBBER);
  cap.position.y = 1.1;
  g.add(cap);
  /* 标签（纸面贴在瓶身前侧） */
  const lbTex = makeLabelTexture(labelText, { w: 220, h: 140 });
  const lbMat = matStd(0xffffff, { roughness: 0.8 });
  lbMat.map = lbTex;
  lbMat.transparent = true;
  const lb = mesh(new THREE.PlaneGeometry(0.42, 0.28), lbMat);
  lb.position.set(0, 0.45, 0.38);
  lb.rotation.x = -0.06;
  g.add(lb);
  g.scale.setScalar(heightScale);
  return g;
}
scene.add(makeBottle(-3.3, -1.7, 0xd8c890, ['蔗糖溶液', '0.3 g/mL']));
scene.add(makeBottle(-2.5, -2.0, 0xb08850, ['碘液', ' Lugol']));
scene.add(makeBottle(-1.7, -1.75, 0x4a6ac0, ['亚甲基蓝', '染色剂'], 0.85));
scene.add(makeBottle(-2.9, -1.0, 0xd8b868, ['香柏油', 'n=1.515'], 0.7));
scene.add(makeBottle(-1.9, -1.05, 0xd8e0d8, ['清水', '蒸馏水'], 0.75));
/* 载玻片盒 */
{
  const boxMat = matStd(0x8a4a34, { roughness: 0.55 });
  const box = mesh(new THREE.BoxGeometry(1.7, 0.36, 1.05), boxMat);
  box.position.set(2.6, 0.18, -2.2);
  const lidLine = mesh(new THREE.BoxGeometry(1.74, 0.02, 1.08), M_DARK);
  lidLine.position.set(2.6, 0.36, -2.2);
  const lbMat = matStd(0xffffff, { roughness: 0.8 });
  lbMat.map = makeLabelTexture(['载玻片'], { w: 180, h: 100 });
  const lb = mesh(new THREE.PlaneGeometry(0.5, 0.28), lbMat);
  lb.position.set(2.6, 0.2, -1.66);
  lb.rotation.x = -0.5;
  scene.add(box, lidLine, lb);
}
/* 擦镜纸盒 */
{
  const boxMat = matStd(0xe4ddd0, { roughness: 0.7 });
  const box = mesh(new THREE.BoxGeometry(0.95, 0.5, 0.7), boxMat);
  box.position.set(-4.1, 0.25, -0.6);
  box.rotation.y = 0.3;
  const paper = mesh(new THREE.BoxGeometry(0.6, 0.08, 0.42), matStd(0xf4efe4, { roughness: 0.9 }));
  paper.position.set(-4.1, 0.52, -0.6);
  paper.rotation.y = 0.3;
  scene.add(box, paper);
}

/* ================= 3D 显微镜 ================= */

const gScope = new THREE.Group();
scene.add(gScope);
const parts = {};
{
  /* 底座 + 防滑脚垫 */
  const base = mesh(new THREE.BoxGeometry(2.6, 0.3, 2.1), M_ENAMEL);
  base.position.y = 0.15;
  const footPad = mesh(new THREE.BoxGeometry(2.8, 0.12, 2.3), M_RUBBER);
  footPad.position.y = 0.06;
  /* 底座侧面镀铬饰线 */
  const trim = mesh(new THREE.BoxGeometry(2.62, 0.03, 2.12), M_CHROME);
  trim.position.y = 0.28;
  gScope.add(base, footPad, trim);
  /* 透射光源（底座前孔）：暖色发光面 */
  const lampHousing = mesh(new THREE.CylinderGeometry(0.28, 0.34, 0.18, 22), M_DARK);
  lampHousing.position.set(0, 0.28, 0.55);
  const lampRing = mesh(new THREE.TorusGeometry(0.24, 0.02, 8, 22), M_BRASS);
  lampRing.rotation.x = TAU / 4;
  lampRing.position.set(0, 0.375, 0.55);
  const lamp = mesh(new THREE.CircleGeometry(0.22, 22), new THREE.MeshBasicMaterial({ color: 0xffe9b0 }));
  lamp.rotation.x = -TAU / 4;
  lamp.position.set(0, 0.38, 0.55);
  gScope.add(lampHousing, lampRing, lamp);
  parts.lamp = lamp;
  /* 镜臂：哑光漆立柱 + 顶部斜撑连到镜筒 */
  const arm = mesh(new THREE.BoxGeometry(0.62, 2.6, 0.6), M_ARM);
  arm.position.set(-0.85, 1.55, 0);
  const armNeck = mesh(new THREE.BoxGeometry(0.5, 0.34, 0.5), M_ARM);
  armNeck.position.set(-0.55, 2.9, 0);
  armNeck.rotation.z = 0.5;
  gScope.add(arm, armNeck);
  /* 载物台总成（调焦时整体微升降） */
  const stageAsm = new THREE.Group();
  parts.stageAsm = stageAsm;
  parts.stageBaseY = 0;
  const table = mesh(new THREE.BoxGeometry(2.0, 0.1, 1.8), M_ENAMEL);
  table.position.set(0.25, 1.28, 0);
  const aperture = mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.12, 18), new THREE.MeshBasicMaterial({ color: 0x0c0e12 }));
  aperture.position.set(0.25, 1.28, 0);
  stageAsm.add(table, aperture);
  /* 黄铜压片夹 ×2 */
  for (const dx of [-0.55, 0.55]) {
    const clipArm = mesh(new THREE.BoxGeometry(0.09, 0.04, 0.4), M_BRASS);
    clipArm.position.set(0.25 + dx, 1.35, -0.52);
    const clipTip = mesh(new THREE.SphereGeometry(0.045, 10, 8), M_BRASS);
    clipTip.position.set(0.25 + dx, 1.36, -0.32);
    stageAsm.add(clipArm, clipTip);
  }
  /* 玻片：透射玻璃 */
  const slide = mesh(new THREE.BoxGeometry(1.1, 0.03, 0.62), matGlass(0xe8f2f4, { transmission: 0.9, thickness: 0.1, roughness: 0.03, opacity: 0.7 }));
  slide.position.set(0.25, 1.35, 0);
  stageAsm.add(slide);
  parts.slide = slide;
  /* 聚光器 + 遮光器（带黄铜调节环） */
  const condenser = mesh(new THREE.CylinderGeometry(0.18, 0.24, 0.28, 18), M_DARK);
  condenser.position.set(0.25, 1.02, 0);
  const iris = mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.05, 22), M_CHROME);
  iris.position.set(0.25, 0.9, 0);
  stageAsm.add(condenser, iris);
  parts.iris = iris;
  gScope.add(stageAsm);
  /* 镜筒 + 目镜（镜筒高光烤漆 + 目镜橡胶护眼杯 + 玻璃目镜片） */
  const tube = mesh(new THREE.CylinderGeometry(0.16, 0.16, 1.0, 20), M_ENAMEL);
  tube.position.set(0.25, 2.6, 0);
  tube.rotation.x = 0.35;
  const eyeTop = mesh(new THREE.CylinderGeometry(0.13, 0.18, 0.3, 18), M_RUBBER);
  eyeTop.position.set(0.25, 3.05, 0.17);
  eyeTop.rotation.x = 0.35;
  const eyeLens = mesh(new THREE.CylinderGeometry(0.105, 0.105, 0.03, 18), M_GLASS);
  eyeLens.position.set(0.25, 3.19, 0.22);
  eyeLens.rotation.x = 0.35;
  const eyeRim = mesh(new THREE.TorusGeometry(0.13, 0.02, 8, 20), M_CHROME);
  eyeRim.position.set(0.25, 3.2, 0.23);
  eyeRim.rotation.x = TAU / 4 + 0.35;
  gScope.add(tube, eyeTop, eyeLens, eyeRim);
  /* 转换器 + 物镜 ×4（物镜带滚花环 + 前透镜玻璃） */
  const nose = new THREE.Group();
  nose.position.set(0.25, 2.2, -0.02);
  const noseDisc = mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.12, 22), M_ENAMEL);
  const noseTrim = mesh(new THREE.TorusGeometry(0.3, 0.015, 8, 22), M_CHROME);
  noseTrim.rotation.x = TAU / 4;
  noseTrim.position.y = -0.06;
  nose.add(noseDisc, noseTrim);
  parts.nose = nose;
  gScope.add(nose);
  parts.objectives = [];
  const OBJ_SPEC = [
    { mag: 4, len: 0.42, r: 0.09, color: 0xc85a4e },
    { mag: 10, len: 0.5, r: 0.08, color: 0xc4b24e },
    { mag: 40, len: 0.56, r: 0.065, color: 0x4e9ac4 },
    { mag: 100, len: 0.6, r: 0.055, color: 0x39404a },
  ];
  OBJ_SPEC.forEach((s, i) => {
    const a = (i / 4) * TAU;
    const holder = new THREE.Group();
    holder.rotation.y = a;
    const barrel = mesh(new THREE.CylinderGeometry(s.r, s.r * 1.4, s.len, 14), matCoat(s.color, { roughness: 0.3, metalness: 0.05, clearcoat: 0.5, clearcoatRoughness: 0.2 }));
    barrel.position.y = -s.len / 2;
    holder.add(barrel);
    /* 黑色环带 ×2（色环标识 + 滚花暗示） */
    for (const dy of [-0.14, -0.28]) {
      const ring = mesh(new THREE.CylinderGeometry(s.r * 1.32 + 0.012, s.r * 1.32 + 0.012, 0.03, 14), M_DARK);
      ring.position.y = -s.len / 2 + dy * (s.len / 0.5);
      holder.add(ring);
    }
    /* 前透镜 */
    const tipGlass = mesh(new THREE.SphereGeometry(s.r * 0.5, 12, 8, 0, TAU, 0, Math.PI / 2), M_GLASS);
    tipGlass.rotation.x = Math.PI;
    tipGlass.position.y = -s.len + 0.005;
    holder.add(tipGlass);
    holder.position.set(Math.sin(a) * 0.2, -0.1, Math.cos(a) * 0.2);
    nose.add(holder);
    parts.objectives.push(holder);
  });
  /* 粗/细准焦螺旋：橡胶握纹 + 镀铬端面 */
  const knobCoarse = new THREE.Group();
  knobCoarse.position.set(-1.2, 2.2, 0.12);
  const kcGrip = mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.15, 22), M_RUBBER);
  kcGrip.rotation.z = TAU / 4;
  const kcFace = mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.17, 14), M_CHROME);
  kcFace.rotation.z = TAU / 4;
  knobCoarse.add(kcGrip, kcFace);
  const knobFine = new THREE.Group();
  knobFine.position.set(-1.2, 1.8, 0.14);
  const kfGrip = mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.13, 18), M_RUBBER);
  kfGrip.rotation.z = TAU / 4;
  const kfFace = mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.15, 12), M_CHROME);
  kfFace.rotation.z = TAU / 4;
  knobFine.add(kfGrip, kfFace);
  gScope.add(knobCoarse, knobFine);
  parts.knobCoarse = knobCoarse;
  parts.knobFine = knobFine;
  /* 反光镜：镀铬镜面 + 底座枢轴 */
  const mirror = mesh(new THREE.CircleGeometry(0.2, 22), matStd(0xd6e4f0, { roughness: 0.08, metalness: 0.95 }));
  mirror.rotation.x = -TAU / 4 + 0.4;
  mirror.position.set(0.25, 0.42, 0.45);
  const mirrorHub = mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.1, 10), M_BRASS);
  mirrorHub.position.set(0.25, 0.38, 0.5);
  gScope.add(mirror, mirrorHub);
  parts.mirror = mirror;

  /* 部件标注 */
  const partLabels = [
    ['目镜', [0.25, 3.5, -0.19]], ['镜筒', [0.25, 2.9, 0.2]], ['转换器', [0.25, 2.45, 0.35]],
    ['物镜', [0.7, 1.75, 0.2]], ['载物台', [1.15, 1.5, 0.3]], ['压片夹', [-0.3, 1.5, -0.5]],
    ['遮光器', [0.7, 0.9, 0.25]], ['反光镜', [0.7, 0.45, 0.45]], ['粗准焦螺旋', [-1.45, 2.3, 0.12]],
    ['细准焦螺旋', [-1.45, 1.78, 0.14]], ['镜臂', [-1.1, 2.0, -0.5]], ['镜座', [0, 0.1, -1.2]],
  ];
  parts.labels = partLabels.map(([t, p]) => {
    const l = label(t, '#e2ebf5', 0.0032);
    l.position.set(...p);
    l.visible = false;
    gScope.add(l);
    return l;
  });
}

/* ================= 目镜视野画布（离屏样品 + 合成管线） ================= */

const EYE_MAG = 10;
const OBJ_MAGS = [4, 10, 40, 100];
const S = 512;
const eCv = document.createElement('canvas');
eCv.width = eCv.height = S;
const eCtx = eCv.getContext('2d');
const eTex = new THREE.CanvasTexture(eCv);
eTex.colorSpace = THREE.SRGBColorSpace;

/* 样品离屏画布：先按照明模式画样品，再统一合成（暗场反相 / 相差光晕） */
const sCv = document.createElement('canvas');
sCv.width = sCv.height = S;
const sCtx = sCv.getContext('2d');

const screen = mesh(new THREE.PlaneGeometry(3.9, 3.9), new THREE.MeshBasicMaterial({ map: eTex, color: 0xdddbd2 }));
screen.position.set(5.1, 2.45, 0);
screen.rotation.y = -0.16;
scene.add(screen);
const screenFrame = mesh(new THREE.BoxGeometry(4.15, 4.15, 0.07), M_DARK);
screenFrame.position.set(5.1, 2.45, -0.05);
screenFrame.rotation.y = -0.16;
const frameTrim = mesh(new THREE.BoxGeometry(4.02, 4.02, 0.075), M_BRASS);
frameTrim.position.set(5.1, 2.45, -0.048);
frameTrim.rotation.y = -0.16;
scene.add(screenFrame, frameTrim);
const screenLbl = label('目镜视野（模拟成像）', '#d5dfee', 0.004);
screenLbl.position.set(5.1, 0.25, 0);
scene.add(screenLbl);

/* 显微镜状态 */
const optic = {
  slide: 'letter', obj: 1, focus: 62, light: 'bright', oil: false,
  pan: { x: 0, y: 0 }, labels: false, running: true,
  paraAngle: 0, plasm: 0, plasmT: 0, phaseHi: -1, countSq: -1,
  speck: null, speckMoves: { pan: false, rotate: false, obj: false },
  lampOn: true, stageH: 0,
};

function totalMag() { return EYE_MAG * OBJ_MAGS[optic.obj]; }
function idealFocus() { return 58 + optic.obj * 7; }
/* 非线性离焦：焦距差越远糊得越快（1.6 次幂） */
function blurPx() {
  const d = Math.abs(optic.focus - idealFocus());
  return 0.9 * Math.pow(d / 10, 1.6) * (0.55 + OBJ_MAGS[optic.obj] / 120);
}

/* 红细胞精灵（双凹圆盘：径向渐变一次烘焙，逐帧 drawImage） */
const rbcSprite = (() => {
  const c = document.createElement('canvas');
  c.width = c.height = 48;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(24, 24, 4, 24, 24, 22);
  g.addColorStop(0, 'rgba(238,168,162,0.62)');   // 中央浅染（凹）
  g.addColorStop(0.45, 'rgba(208,96,90,0.72)');
  g.addColorStop(0.85, 'rgba(172,58,54,0.85)');  // 边缘厚环
  g.addColorStop(1, 'rgba(150,46,44,0.5)');
  x.fillStyle = g;
  x.beginPath();
  x.arc(24, 24, 22, 0, TAU);
  x.fill();
  return c;
})();

/* 通用绘制工具（画布坐标 0..S，中心 S/2） */
function drawCellWall(ctx, x, y, w, h, opts = {}) {
  const lw = opts.lw || 2.6;
  ctx.fillStyle = opts.wall || 'rgba(122, 152, 112, 0.3)';
  ctx.strokeStyle = opts.line || 'rgba(58, 88, 52, 0.85)';
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.fill(); ctx.stroke();
  /* 内壁第二道细线（双线细胞壁质感） */
  ctx.strokeStyle = opts.line || 'rgba(58, 88, 52, 0.4)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + lw + 1.5, y + lw + 1.5, w - (lw + 1.5) * 2, h - (lw + 1.5) * 2);
  ctx.fillStyle = opts.cyto || 'rgba(190, 214, 190, 0.42)';
  ctx.fillRect(x + lw, y + lw, w - lw * 2, h - lw * 2);
}
function drawNucleus(ctx, cx, cy, r, opts = {}) {
  ctx.fillStyle = opts.nuc || 'rgba(96, 74, 150, 0.78)';
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, TAU);
  ctx.fill();
  ctx.fillStyle = 'rgba(58, 42, 98, 0.92)';
  ctx.beginPath();
  ctx.arc(cx + r * 0.3, cy - r * 0.2, r * 0.38, 0, TAU);
  ctx.fill();
}

/* 各玻片绘制器 */
const SLIDES = {
  letter: {
    name: '字母 e 切片',
    draw(ctx, o) {
      ctx.save();
      ctx.translate(S / 2, S / 2);
      ctx.rotate(o.letterRot || 0);
      ctx.fillStyle = 'rgba(38, 44, 56, 0.88)';
      ctx.font = '900 210px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('e', o.pan.x * 1.2, o.pan.y * 1.2);
      ctx.restore();
    },
  },
  onion: {
    name: '洋葱鳞片叶表皮',
    draw(ctx, o) {
      const cw = 108, ch = 70;
      const mag = OBJ_MAGS[o.obj];
      for (let gy = 0; gy < Math.ceil(S / ch) + 1; gy++) {
        const off = (gy % 2) * cw * 0.42;
        for (let gx = -1; gx < Math.ceil(S / cw) + 1; gx++) {
          const x = gx * cw + off, y = gy * ch;
          drawCellWall(ctx, x, y, cw - 4, ch - 4);
          const cx = x + (cw - 4) / 2, cy = y + (ch - 4) / 2;
          /* 中央大液泡：浅色软边圆角区 */
          const vg = ctx.createRadialGradient(cx, cy, 6, cx, cy, (cw - 12) / 2);
          vg.addColorStop(0, 'rgba(224, 238, 228, 0.34)');
          vg.addColorStop(0.82, 'rgba(214, 234, 222, 0.26)');
          vg.addColorStop(1, 'rgba(214, 234, 222, 0)');
          ctx.fillStyle = vg;
          ctx.beginPath();
          ctx.roundRect(x + 9, y + 8, cw - 22, ch - 16, 10);
          ctx.fill();
          /* 细胞核：被液泡挤到侧壁 */
          if (mag >= 10) drawNucleus(ctx, x + 16, y + ch / 2 - 6, 12);
          /* 40× 可见液泡纹理线 */
          if (mag >= 40) {
            ctx.strokeStyle = 'rgba(120, 160, 150, 0.22)';
            ctx.lineWidth = 1;
            for (let k = 0; k < 3; k++) {
              ctx.beginPath();
              ctx.moveTo(x + 14, y + 18 + k * 14);
              ctx.bezierCurveTo(x + cw * 0.4, y + 12 + k * 16, x + cw * 0.6, y + 24 + k * 14, x + cw - 14, y + 18 + k * 15);
              ctx.stroke();
            }
          }
        }
      }
    },
  },
  mouth: {
    name: '人口腔上皮细胞',
    draw(ctx, o) {
      const cells = [[110, 120, 66, -0.4], [240, 90, 58, 0.7], [380, 150, 72, -0.2], [160, 260, 62, 1.1], [330, 320, 70, -0.9], [440, 420, 56, 0.3], [90, 400, 64, -0.6], [260, 440, 60, 0.15]];
      cells.forEach(([x, y, r, a]) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(a);
        const g = ctx.createRadialGradient(-r * 0.2, -r * 0.2, r * 0.2, 0, 0, r);
        g.addColorStop(0, 'rgba(222, 210, 228, 0.66)');
        g.addColorStop(1, 'rgba(196, 182, 208, 0.52)');
        ctx.fillStyle = g;
        ctx.strokeStyle = 'rgba(118, 94, 138, 0.9)';
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.ellipse(0, 0, r, r * 0.76, 0, 0, TAU);
        ctx.fill(); ctx.stroke();
        /* 膜缘高光弧 */
        ctx.strokeStyle = 'rgba(240, 232, 246, 0.5)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 0.94, r * 0.68, 0, Math.PI * 1.1, Math.PI * 1.7);
        ctx.stroke();
        drawNucleus(ctx, 0, 0, r * 0.3);
        ctx.restore();
      });
    },
  },
  para: {
    name: '草履虫培养液',
    draw(ctx, o) {
      const bugs = [[170, 160, 0.5], [350, 300, -0.8], [280, 420, 1.4], [420, 180, 2.3]];
      bugs.forEach(([bx, by, ph], i) => {
        const wob = Math.sin(o.t * (1.6 + i * 0.4) + ph) * 26;
        const ang = ph + o.t * 0.35 * o.paraSpeed;
        ctx.save();
        ctx.translate(bx + Math.cos(ang) * wob, by + Math.sin(ang * 1.3) * wob);
        ctx.rotate(ang);
        /* 纤毛：周缘短线按相位波动（摆动动画帧） */
        if (OBJ_MAGS[o.obj] >= 10) {
          ctx.strokeStyle = 'rgba(64, 80, 92, 0.6)';
          ctx.lineWidth = 1.2;
          const NC = 30;
          for (let k = 0; k < NC; k++) {
            const a = (k / NC) * TAU;
            const wave = Math.sin(o.t * 9 + a * 3.2 + ph) * 0.5;
            const x0 = Math.cos(a) * 51, y0 = Math.sin(a) * 30;
            const x1 = x0 + Math.cos(a + wave) * 8, y1 = y0 + Math.sin(a + wave) * 6;
            ctx.beginPath();
            ctx.moveTo(x0, y0);
            ctx.quadraticCurveTo((x0 + x1) / 2 + Math.cos(a) * 3, (y0 + y1) / 2 + Math.sin(a) * 3, x1, y1);
            ctx.stroke();
          }
        }
        /* 体表 */
        ctx.fillStyle = 'rgba(190, 206, 216, 0.55)';
        ctx.strokeStyle = 'rgba(66, 82, 94, 0.92)';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.ellipse(0, 0, 52, 32, 0, 0, TAU);
        ctx.fill(); ctx.stroke();
        /* 口沟：一侧斜凹槽 */
        ctx.strokeStyle = 'rgba(52, 66, 78, 0.85)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-14, -20);
        ctx.quadraticCurveTo(8, -6, 16, 16);
        ctx.stroke();
        if (OBJ_MAGS[o.obj] >= 10) {
          drawNucleus(ctx, 10, -6, 9);
          /* 食物泡 */
          ctx.fillStyle = 'rgba(210, 158, 88, 0.55)';
          for (let k = 0; k < 8; k++) {
            ctx.beginPath();
            ctx.arc(-30 + (k % 4) * 15, k < 4 ? -10 : 12, 3.6, 0, TAU);
            ctx.fill();
          }
          /* 伸缩泡（星状） */
          if (OBJ_MAGS[o.obj] >= 40) {
            ctx.strokeStyle = 'rgba(90, 110, 130, 0.6)';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.arc(-38, 4, 6, 0, TAU);
            ctx.stroke();
            for (let k = 0; k < 5; k++) {
              const a = (k / 5) * TAU + 0.4;
              ctx.beginPath();
              ctx.moveTo(-38 + Math.cos(a) * 6, 4 + Math.sin(a) * 6);
              ctx.lineTo(-38 + Math.cos(a) * 12, 4 + Math.sin(a) * 12);
              ctx.stroke();
            }
          }
        }
        ctx.restore();
      });
    },
  },
  leaf: {
    name: '菠菜叶下表皮',
    draw(ctx, o) {
      const cw = 130, ch = 84;
      for (let gy = 0; gy < Math.ceil(S / ch) + 1; gy++) {
        for (let gx = -1; gx < Math.ceil(S / cw) + 1; gx++) {
          drawCellWall(ctx, gx * cw + (gy % 2) * 40, gy * ch, cw - 5, ch - 5, { wall: 'rgba(98, 142, 90, 0.3)' });
        }
      }
      /* 气孔器：两个肾形保卫细胞 */
      ctx.save();
      ctx.translate(S / 2 + 60, S / 2 + 40);
      for (const s of [-1, 1]) {
        const g = ctx.createRadialGradient(s * 13, 0, 4, s * 13, 0, 26);
        g.addColorStop(0, 'rgba(130, 200, 118, 0.8)');
        g.addColorStop(1, 'rgba(90, 158, 84, 0.7)');
        ctx.fillStyle = g;
        ctx.strokeStyle = 'rgba(42, 88, 42, 0.92)';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.ellipse(s * 13, 0, 26, 11, s * 0.22, 0, TAU);
        ctx.fill(); ctx.stroke();
        /* 保卫细胞内的核 */
        ctx.fillStyle = 'rgba(90, 70, 140, 0.7)';
        ctx.beginPath();
        ctx.arc(s * 20, s * 3, 4.5, 0, TAU);
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(18, 28, 20, 0.92)';
      ctx.beginPath();
      ctx.ellipse(0, 0, 10, 5, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
      /* 叶肉叶绿体（高倍可见） */
      if (OBJ_MAGS[o.obj] >= 40) {
        for (let i = 0; i < 46; i++) {
          const x = (i * 97) % S, y = (i * 173) % S;
          const g = ctx.createRadialGradient(x, y, 1, x, y, 6);
          g.addColorStop(0, 'rgba(80, 178, 74, 0.85)');
          g.addColorStop(1, 'rgba(46, 122, 48, 0.6)');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.ellipse(x, y, 5.5, 3.4, i, 0, TAU);
          ctx.fill();
        }
      }
    },
  },
  plasm: {
    name: '洋葱表皮 · 渗透实验',
    draw(ctx, o) {
      const k = o.plasmT;
      const cw = 118, ch = 76;
      for (let gy = 0; gy < Math.ceil(S / ch) + 1; gy++) {
        const off = (gy % 2) * cw * 0.4;
        for (let gx = -1; gx < Math.ceil(S / cw) + 1; gx++) {
          const x = gx * cw + off, y = gy * ch, w = cw - 4, h = ch - 4;
          drawCellWall(ctx, x, y, w, h);
          const shrink = k * 0.62;
          const pw = w * (1 - shrink), ph2 = h * (1 - shrink);
          /* 分离后：壁与原生质体之间的空隙填充高渗液（微暗） */
          if (k > 0.05) {
            ctx.fillStyle = `rgba(150, 170, 158, ${0.2 + k * 0.2})`;
            ctx.fillRect(x + 3, y + 3, w - 6, h - 6);
          }
          ctx.fillStyle = k > 0.05 ? 'rgba(148, 188, 158, 0.75)' : 'rgba(190, 214, 190, 0.5)';
          ctx.strokeStyle = 'rgba(58, 88, 52, 0.88)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(x + w / 2, y + h / 2, pw / 2, ph2 / 2, 0, 0, TAU);
          ctx.fill(); ctx.stroke();
          drawNucleus(ctx, x + w / 2, y + h / 2, 10 * (1 - k * 0.4));
        }
      }
    },
  },
  mitosis: {
    name: '洋葱根尖分生区纵切',
    draw(ctx, o) {
      const cw = 64, ch = 58;
      const phaseOf = (i) => (i * 7 + 3) % 5;
      let idx = 0;
      for (let gy = 0; gy < Math.ceil(S / ch) + 1; gy++) {
        for (let gx = -1; gx < Math.ceil(S / cw) + 1; gx++) {
          const x = gx * cw, y = gy * ch;
          const ph = phaseOf(idx++);
          const hl = o.phaseHi === ph;
          drawCellWall(ctx, x, y, cw - 4, ch - 4, {
            wall: hl ? 'rgba(224, 160, 60, 0.45)' : 'rgba(122, 152, 112, 0.3)',
            line: hl ? 'rgba(180, 110, 20, 1)' : undefined,
          });
          const cx = x + cw / 2, cy = y + ch / 2;
          ctx.strokeStyle = 'rgba(138, 42, 42, 0.95)';
          ctx.fillStyle = 'rgba(138, 42, 42, 0.95)';
          ctx.lineWidth = 3;
          if (OBJ_MAGS[o.obj] >= 10 || hl) {
            if (ph === 0) { drawNucleus(ctx, cx, cy, 12); }
            else if (ph === 1) { for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.arc(cx - 10 + k * 5, cy + Math.sin(k) * 5, 3.4, 0, TAU); ctx.fill(); } }
            else if (ph === 2) {
              ctx.beginPath(); ctx.moveTo(cx - 14, cy - 10); ctx.lineTo(cx + 14, cy + 10); ctx.stroke();
              /* 赤道板上的 X 形染色体 */
              for (let k = 0; k < 4; k++) {
                const px = cx - 11 + k * 7;
                ctx.lineWidth = 2.6;
                ctx.beginPath();
                ctx.moveTo(px - 4, cy - 5 + (k % 2) * 9); ctx.lineTo(px + 4, cy + 4 + (k % 2) * 9);
                ctx.moveTo(px + 4, cy - 5 + (k % 2) * 9); ctx.lineTo(px - 4, cy + 4 + (k % 2) * 9);
                ctx.stroke();
                ctx.lineWidth = 3;
              }
            }
            else if (ph === 3) { for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(cx - 8, cy - 9 + k * 5, 2.8, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(cx + 8, cy - 9 + k * 5, 2.8, 0, TAU); ctx.fill(); } }
            else { drawNucleus(ctx, cx - 9, cy, 8); drawNucleus(ctx, cx + 9, cy, 8); }
          }
        }
      }
    },
  },
  blood: {
    name: '人血涂片（瑞氏染色）',
    draw(ctx, o) {
      /* 红细胞：双凹圆盘精灵（中央浅染）；高倍时中央补密植细胞保证视野有内容 */
      const cells = [];
      for (let i = 0; i < 90; i++) cells.push([(i * 131) % S, (i * 71) % S]);
      if (OBJ_MAGS[o.obj] >= 40) {
        for (let i = 0; i < 26; i++) {
          const a = (i / 26) * TAU;
          const r = 18 + (i % 5) * 11;
          cells.push([S / 2 + Math.cos(a) * r, S / 2 + Math.sin(a) * r * 0.9]);
        }
      }
      cells.forEach(([x, y], i) => {
        const s = 30 + (i % 3) * 2;
        ctx.drawImage(rbcSprite, x - s / 2, y - s / 2, s, s);
      });
      /* 血小板小点 */
      ctx.fillStyle = 'rgba(150, 110, 140, 0.55)';
      for (let i = 0; i < 12; i++) {
        ctx.beginPath();
        ctx.arc((i * 211) % S, (i * 149) % S, 2.2, 0, TAU);
        ctx.fill();
      }
      /* 白细胞：大、紫色分叶核（一枚固定在视野中部附近，保证高倍可见） */
      const wbs = [[130, 150], [360, 300], [420, 110], [268, 240]];
      wbs.forEach(([x, y]) => {
        const g = ctx.createRadialGradient(x - 6, y - 6, 6, x, y, 28);
        g.addColorStop(0, 'rgba(228, 222, 244, 0.92)');
        g.addColorStop(1, 'rgba(188, 178, 216, 0.8)');
        ctx.fillStyle = g;
        ctx.strokeStyle = 'rgba(116, 96, 158, 0.92)';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.arc(x, y, 28, 0, TAU);
        ctx.fill(); ctx.stroke();
        if (OBJ_MAGS[o.obj] >= 100 && o.oil) {
          /* 分叶核清晰（油镜） */
          ctx.fillStyle = 'rgba(108, 58, 150, 0.92)';
          for (let k = 0; k < 4; k++) {
            const a = (k / 4) * TAU + 0.5;
            ctx.beginPath();
            ctx.ellipse(x + Math.cos(a) * 9, y + Math.sin(a) * 9, 7.5, 5.5, a, 0, TAU);
            ctx.fill();
          }
        } else {
          ctx.fillStyle = 'rgba(148, 128, 180, 0.55)';
          ctx.beginPath();
          ctx.arc(x, y, 12, 0, TAU);
          ctx.fill();
        }
      });
    },
  },
  dust: {
    name: '污点检测片（含噪点）',
    draw(ctx, o) {
      ctx.fillStyle = 'rgba(38, 44, 56, 0.88)';
      ctx.font = '900 150px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('p', S / 2, S / 2);
      const sp = o.speck;
      if (!sp) return;
      let sx = S / 2 + 110, sy = S / 2 - 80;
      if (sp.where === 'slide') {
        sx += o.speckMoves.pan ? -260 : 0;
        sy += o.speckMoves.pan ? 150 : 0;
      } else if (sp.where === 'eyepiece') {
        if (o.speckMoves.rotate) { sx = -999; }
      } else if (sp.where === 'objective') {
        if (o.speckMoves.obj) sx = -999;
      }
      if (sx > 0) {
        const g = ctx.createRadialGradient(sx, sy, 1, sx, sy, 14);
        g.addColorStop(0, 'rgba(18, 14, 10, 0.95)');
        g.addColorStop(0.5, 'rgba(52, 44, 36, 0.7)');
        g.addColorStop(1, 'rgba(52, 44, 36, 0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(sx, sy, 14, 0, TAU);
        ctx.fill();
      }
    },
  },
  micrometer: {
    name: '目镜测微尺校准片',
    draw(ctx, o) {
      const pxPerUm = 2.2 * (OBJ_MAGS[o.obj] / 40);
      ctx.strokeStyle = 'rgba(28, 34, 42, 0.9)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(S * 0.08, S / 2);
      ctx.lineTo(S * 0.92, S / 2);
      ctx.stroke();
      for (let i = 0; i <= 40; i++) {
        const x = S * 0.08 + i * (pxPerUm * 10);
        if (x > S * 0.94) break;
        ctx.beginPath();
        ctx.moveTo(x, S / 2 - (i % 5 === 0 ? 26 : 12));
        ctx.lineTo(x, S / 2);
        ctx.stroke();
        if (i % 5 === 0) {
          ctx.fillStyle = 'rgba(28, 34, 42, 0.9)';
          ctx.font = '600 13px sans-serif';
          ctx.fillText(i * 10 + '', x, S / 2 + 18);
        }
      }
      ctx.fillStyle = 'rgba(178, 198, 218, 0.65)';
      ctx.strokeStyle = 'rgba(78, 98, 118, 0.9)';
      ctx.lineWidth = 2.4;
      const cellW = 50 * pxPerUm * 0.1 * 10;
      ctx.beginPath();
      ctx.ellipse(S / 2, S / 2 - 110, Math.min(cellW / 2, 90), 34, 0, 0, TAU);
      ctx.fill(); ctx.stroke();
    },
  },
  counter: {
    name: '血球计数板（计数室）',
    draw(ctx, o) {
      const cell = 74, x0 = S / 2 - cell * 2.5, y0 = S / 2 - cell * 2.5;
      ctx.strokeStyle = 'rgba(48, 58, 70, 0.9)';
      ctx.lineWidth = 2;
      ctx.strokeRect(x0, y0, cell * 5, cell * 5);
      for (let i = 1; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(x0 + i * cell, y0); ctx.lineTo(x0 + i * cell, y0 + cell * 5);
        ctx.moveTo(x0, y0 + i * cell); ctx.lineTo(x0 + cell * 5, y0 + i * cell);
        ctx.stroke();
      }
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(48, 58, 70, 0.5)';
      ctx.strokeRect(x0 - 6, y0 - 6, cell * 5 + 12, cell * 5 + 12);
      ctx.fillStyle = 'rgba(200, 96, 92, 0.75)';
      for (let i = 0; i < 60; i++) {
        const gx = Math.floor((i * 37) % 5), gy = Math.floor((i * 53) % 5);
        const x = x0 + gx * cell + 12 + ((i * 29) % (cell - 24));
        const y = y0 + gy * cell + 12 + ((i * 41) % (cell - 24));
        const hl = o.countSq >= 0 && gx === o.countSq % 5 && gy === Math.floor(o.countSq / 5);
        ctx.beginPath();
        ctx.arc(x, y, hl ? 9 : 7, 0, TAU);
        ctx.fill();
        ctx.fillStyle = hl ? 'rgba(224, 150, 40, 0.9)' : 'rgba(200, 96, 92, 0.75)';
        if (hl) { ctx.beginPath(); ctx.arc(x, y, hl ? 9 : 7, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(200, 96, 92, 0.75)'; }
      }
    },
  },
};

/* 每帧渲染目镜视野：样品离屏 → 合成（明/暗/相差） → 遮罩装饰 */
function renderEyepiece(t) {
  const mode = optic.lampOn ? optic.light : 'off';
  const isDark = mode === 'dark';
  const isPhase = mode === 'phase';
  /* 离屏样品底色：暗场用浅底（反相后变黑），相差用灰绿底 */
  sCtx.setTransform(1, 0, 0, 1, 0, 0);
  sCtx.fillStyle = isDark ? '#f2ede0' : isPhase ? '#d4d8cc' : '#f2ede0';
  sCtx.fillRect(0, 0, S, S);

  const mag = OBJ_MAGS[optic.obj];
  const scale = 0.62 * (mag / 10) + 0.35;
  sCtx.save();
  sCtx.translate(S / 2, S / 2);
  sCtx.scale(scale, scale);
  sCtx.rotate(Math.PI);              /* 显微像是倒像 */
  sCtx.translate(-S / 2, -S / 2);    /* 绘制器按画布坐标作画：补中心枢轴，绕中点反转缩放 */
  sCtx.translate(-optic.pan.x, -optic.pan.y);
  SLIDES[optic.slide].draw(sCtx, optic, t);
  sCtx.restore();

  /* 主画布：背景 + 圆形视野裁剪 */
  eCtx.setTransform(1, 0, 0, 1, 0, 0);
  eCtx.fillStyle = isDark ? '#050608' : isPhase ? '#c9cec2' : mode === 'off' ? '#101216' : '#f2ede0';
  eCtx.fillRect(0, 0, S, S);
  eCtx.save();
  eCtx.beginPath();
  eCtx.arc(S / 2, S / 2, S * 0.46, 0, TAU);
  eCtx.clip();

  const blur = blurPx();
  const oilOn = optic.obj === 3 && optic.oil;
  /* 油镜未加油：昏暗一片（光线全反射损失）；加油：对比度与亮度双升 */
  if (optic.obj === 3 && !optic.oil) blur += 2.5;
  eCtx.filter = blur > 0.4 ? `blur(${Math.min(blur, 15).toFixed(1)}px)` : 'none';
  eCtx.drawImage(sCv, 0, 0);
  eCtx.filter = 'none';

  /* 暗场：整圆反相 → 样品亮起、视野变黑（difference 白场） */
  if (isDark) {
    eCtx.globalCompositeOperation = 'difference';
    eCtx.fillStyle = '#ffffff';
    eCtx.fillRect(0, 0, S, S);
    eCtx.globalCompositeOperation = 'source-over';
    /* 冷色调 + 中心暗场斑 */
    eCtx.globalCompositeOperation = 'multiply';
    eCtx.fillStyle = 'rgba(150, 200, 225, 0.35)';
    eCtx.fillRect(0, 0, S, S);
    eCtx.globalCompositeOperation = 'source-over';
  }
  /* 相差：再叠一层模糊提亮的样品 → 相位光晕 */
  if (isPhase) {
    eCtx.globalCompositeOperation = 'lighten';
    eCtx.filter = 'blur(8px) brightness(1.45)';
    eCtx.drawImage(sCv, 0, 0);
    eCtx.filter = 'none';
    eCtx.globalCompositeOperation = 'source-over';
  }
  /* 油镜折射率修正：对比↑ 亮度↑ */
  if (oilOn) {
    eCtx.filter = 'contrast(1.22) brightness(1.15)';
    eCtx.globalCompositeOperation = 'source-atop';
    eCtx.fillStyle = 'rgba(255,244,214,0.05)';
    eCtx.fillRect(0, 0, S, S);
    eCtx.globalCompositeOperation = 'source-over';
    eCtx.filter = 'none';
  }
  /* 视野亮度：离焦发散 + 关灯 + 油镜缺油都压暗 */
  const dim = clamp(blur * 0.035 + (mode === 'off' ? 0.68 : 0) + (optic.obj === 3 && !optic.oil ? 0.34 : 0), 0, 0.8);
  eCtx.fillStyle = `rgba(5, 7, 10, ${dim})`;
  eCtx.fillRect(0, 0, S, S);
  eCtx.restore();

  /* 目镜边缘环 + 十字准星 */
  eCtx.strokeStyle = 'rgba(14, 18, 24, 0.92)';
  eCtx.lineWidth = 26;
  eCtx.beginPath();
  eCtx.arc(S / 2, S / 2, S * 0.47 + 8, 0, TAU);
  eCtx.stroke();
  eCtx.strokeStyle = 'rgba(120, 132, 148, 0.25)';
  eCtx.lineWidth = 1.4;
  eCtx.beginPath();
  eCtx.moveTo(S / 2 - 20, S / 2); eCtx.lineTo(S / 2 + 20, S / 2);
  eCtx.moveTo(S / 2, S / 2 - 20); eCtx.lineTo(S / 2, S / 2 + 20);
  eCtx.stroke();
  eTex.needsUpdate = true;
}

/* ================= 章节定义 ---------------- */

const ctl = createControlsPanel(document.getElementById('controls'));
let activeSectionId = null;
let activeCleanup = null;

const hud = makeHUD(stage, [['a', '读数'], ['b', '要点'], ['c', '提示']]);
hud.visibleNow = false;

function baseOpticsCtl({ withLight = false, withOil = false } = {}) {
  ctl.sep();
  ctl.seg({
    options: [
      { label: '4×', value: 0 }, { label: '10×', value: 1 },
      { label: '40×', value: 2 }, { label: '100×', value: 3 },
    ],
    value: optic.obj,
    onChange: (v) => { setObj(v); },
  });
  ctl.slider({
    label: '准焦螺旋', min: 0, max: 100, step: 1, value: optic.focus,
    fmt: (v) => (Math.abs(v - idealFocus()) < 2.5 ? '✔ 清晰' : v > idealFocus() ? '模糊↑' : '模糊↓'),
    onInput: (v) => { optic.focus = v; },
  });
  if (withLight) {
    ctl.seg({
      options: [{ label: '明场', value: 'bright' }, { label: '暗场', value: 'dark' }, { label: '相差', value: 'phase' }],
      value: optic.light,
      onChange: (v) => { optic.light = v; },
    });
  }
  if (withOil) {
    ctl.toggle({
      label: '香柏油（油镜必加）', value: optic.oil,
      onChange: (v) => { optic.oil = v; },
    });
  }
}

function setObj(i) {
  optic.obj = i;
  parts.nose.rotation.y = optic.noseAngle = i * (TAU / 4) + TAU / 8;
}

function moveSlide() {
  optic.pan.x = optic.pan.x === 0 ? 130 : 0;
  optic.pan.y = optic.pan.y === 0 ? -80 : 0;
}

/* 各章 */

const SECTIONS = [
  {
    id: 'anatomy',
    title: '认识显微镜',
    html: `<p>右手握镜臂、左手托镜座——先认识各部件：<b>目镜</b>（放大在先）、<b>物镜</b>（贴近玻片、决定分辨率）、<b>转换器</b>（换物镜）、<b>遮光器/光圈</b>（调光量）、<b>反光镜</b>（平面镜/凹面镜）、<b>粗/细准焦螺旋</b>（升降镜筒）。</p>
<p>总放大倍数 = <span class="hl">目镜倍数 × 物镜倍数</span>（本机目镜 10×，物镜 4/10/40/100×，最高 1000×）。</p>
<p>打开「标注」用按钮飞到各部件特写。</p>`,
    enter() {
      optic.slide = 'letter';
      app.setCamera([6.2, 7.0, 12.8], [0.75, 1.0, -0.25]);
      hud.visibleNow = true;
      ctl.clear();
      ctl.toggle({
        label: '部件标注', value: false,
        onChange: (v) => { parts.labels.forEach((l) => { l.visible = v; }); },
      });
      ctl.sep();
      [
        ['整体', [6.2, 7.0, 12.8], [0.75, 1.0, -0.25]],
        ['目镜与镜筒', [1.5, 4.4, 2.6], [0.25, 3.0, -0.1]],
        ['转换器与物镜', [1.8, 1.6, 3.2], [0.25, 2.0, 0]],
        ['准焦螺旋', [-3.0, 2.3, 1.8], [-1.2, 2.0, 0]],
        ['遮光器与反光镜', [1.4, 0.6, 2.8], [0.25, 0.8, 0.3]],
      ].forEach(([t, pos, tgt]) => {
        ctl.button({ label: t, onClick: () => app.setCamera(pos, tgt) });
      });
      hud.set('a', `总放大 = 10× × ${OBJ_MAGS[optic.obj]}× = ${totalMag()}×`);
      hud.set('b', '物镜越长倍数越大；转换器换镜不换焦');
      hud.set('c', '先低倍找目标，再换高倍');
    },
  },
  {
    id: 'procedure',
    title: '规范操作',
    html: `<p>七字诀：<b>取、安、对、放、压、调、看</b>。</p>
<p>① 对光：低倍物镜对准通光孔，转反光镜直到视野<span class="hl">雪白明亮</span>；② 放片：玻片正对通光孔、压片夹压好；③ <b>粗准焦螺旋</b>缓降镜筒（眼睛从侧面看着物镜，别压碎玻片！）→ 目镜中找物像 → <b>细准焦螺旋</b>调清晰。</p>
<p>按顺序点按钮完成操作，右侧目镜视野会实时变化。</p>`,
    enter() {
      optic.slide = 'letter';
      optic.lampOn = false;
      optic.focus = 12;
      optic.obj = 1;
      setObj(1);
      app.setCamera([6.2, 7.0, 12.8], [0.75, 1.0, -0.25]);
      hud.visibleNow = true;
      ctl.clear();
      const steps = [
        ['① 对光', () => { optic.lampOn = true; optic.focus = 20; return '视野变亮（雪白色）'; }],
        ['② 放片·压片', () => { return '字母 e 玻片放到通光孔上'; }],
        ['③ 粗准焦下镜筒', () => { optic.focus = 40; return '镜筒下降，出现模糊光斑'; }],
        ['④ 找到物像', () => { optic.focus = 50; return '看到倒立放大的"e"了！'; }],
        ['⑤ 细准焦调清晰', () => { optic.focus = 62; return '✔ 物像清晰'; }],
      ];
      steps.forEach(([t, fn], i) => {
        ctl.button({
          label: t,
          onClick: () => {
            const msg = fn();
            hud.set('a', t + ' — ' + msg);
            hud.set('c', i === 3 ? '注意：像是上下左右都颠倒的' : '');
          },
        });
      });
      ctl.sep();
      baseOpticsCtl();
      hud.set('a', '尚未对光');
      hud.set('b', '眼侧看降筒 → 目镜找像 → 细焦清晰');
      hud.set('c', '');
    },
  },
  {
    id: 'imaging',
    title: '成像特点',
    html: `<p>显微镜成的是<span class="hl">倒立的像</span>——上下左右都颠倒（把玻片上的 "e" 转个方向试试）。</p>
<p>推论：<b>物像偏哪边，玻片就往哪边移</b>才能移到视野中央（"偏哪移哪"）。移动玻片方向与物像移动方向相反。</p>
<p>调「准焦螺旋」体会<b>景深</b>：焦点之外是弥散光斑；换物镜后清晰位置也会变。</p>`,
    enter() {
      optic.slide = 'letter';
      optic.lampOn = true;
      optic.obj = 1;
      setObj(1);
      optic.focus = idealFocus() + 18;
      app.setCamera([6.2, 7.0, 12.8], [0.75, 1.0, -0.25]);
      hud.visibleNow = true;
      ctl.clear();
      ctl.slider({
        label: '转动玻片', min: 0, max: 180, step: 1, value: 0,
        fmt: (v) => v + '°',
        onInput: (v) => { optic.letterRot = v * DEG_R; },
      });
      ctl.button({
        label: '物像偏左上→玻片移哪?',
        onClick: () => { hud.set('c', '偏哪移哪：玻片往左上移，物像回中央'); },
      });
      ctl.sep();
      baseOpticsCtl();
      hud.set('a', `放大 ${totalMag()}× · 倒像`);
      hud.set('b', '上下左右皆颠倒 → "偏哪移哪"');
      hud.set('c', '');
    },
  },
  {
    id: 'low-to-high',
    title: '低倍换高倍',
    html: `<p>换高倍的铁律：<b>先在低倍镜下把目标移到视野正中央</b>，再转转换器换高倍——因为高倍视野小，目标偏一点就找不到了。</p>
<p>换高倍后：视野<b>变小变暗</b>、细胞<b>变大变少</b>；此时只能调<span class="hl">细准焦螺旋</span>（高倍镜工作距离短，粗准焦会压碎玻片），并调大光圈/换凹面镜补光。</p>
<p>右侧视野：先移片，再换 40×。</p>`,
    enter() {
      optic.slide = 'onion';
      optic.lampOn = true;
      optic.obj = 1;
      setObj(1);
      optic.focus = idealFocus() - 10;
      optic.pan = { x: 90, y: 60 };
      app.setCamera([6.2, 7.0, 12.8], [0.75, 1.0, -0.25]);
      hud.visibleNow = true;
      ctl.clear();
      ctl.button({
        label: '移目标到中心',
        onClick: () => { optic.pan = { x: 0, y: 0 }; hud.set('c', '目标居中，可换高倍'); },
      });
      ctl.sep();
      baseOpticsCtl();
      optic.objChanged = () => {
        hud.set('b', optic.obj >= 2
          ? '高倍：视野小而暗 → 调细准焦 + 大光圈'
          : '低倍：视野大，先找目标');
      };
      hud.set('a', `视野内细胞数 ≈ ${optic.obj >= 2 ? '十几个' : '上百个'}`);
      hud.set('b', '低倍找目标 → 居中 → 换高倍 → 细焦');
      hud.set('c', '');
    },
  },
  {
    id: 'speck',
    title: '判断污点位置',
    html: `<p>视野里有污点，它在哪一层？<b>三步排除法</b>：</p>
<p>① 移动玻片——污点跟着动 → 在<span class="hl">玻片上</span>；不动 → 继续；② 转动目镜——污点跟着转 → 在<span class="hl">目镜上</span>；③ 换物镜——污点消失/变化 → 在<span class="hl">物镜上</span>；三步都无效 → 在<span class="hl">反光镜/环境</span>。</p>
<p>依次按三个检测按钮观察污点反应，然后给出你的判断。</p>`,
    enter() {
      optic.slide = 'dust';
      optic.lampOn = true;
      optic.obj = 1;
      setObj(1);
      optic.focus = idealFocus() - 6;
      const where = ['slide', 'eyepiece', 'objective'][Math.floor(Math.random() * 3)];
      optic.speck = { where };
      optic.speckMoves = { pan: false, rotate: false, obj: false };
      optic.speckTried = {};
      app.setCamera([6.2, 7.0, 12.8], [0.75, 1.0, -0.25]);
      hud.visibleNow = true;
      ctl.clear();
      ctl.button({
        label: '① 移动玻片',
        onClick: () => {
          moveSlide();
          optic.speckMoves.pan = true;
          optic.speckTried.pan = true;
          hud.set('c', optic.speck.where === 'slide' ? '污点跟着移走了 → 在玻片上！' : '污点没动 → 不在玻片上');
        },
      });
      ctl.button({
        label: '② 转动目镜',
        onClick: () => {
          optic.speckMoves.rotate = true;
          optic.speckTried.rotate = true;
          hud.set('c', optic.speck.where === 'eyepiece' ? '污点跟着转 → 在目镜上！' : '污点不转 → 不在目镜上');
        },
      });
      ctl.button({
        label: '③ 换一个物镜',
        onClick: () => {
          optic.speckMoves.obj = !optic.speckMoves.obj;
          optic.speckTried.obj = true;
          hud.set('c', optic.speck.where === 'objective' ? '换物镜后污点消失 → 在物镜上！' : '污点还在 → 不在物镜上');
        },
      });
      ctl.sep();
      ctl.button({
        label: '我的判断',
        onClick: () => {
          const map = { slide: '玻片', eyepiece: '目镜', objective: '物镜' };
          hud.set('a', `污点位置：${map[optic.speck.where]}`);
          hud.set('b', '口诀：移动看跟不跟、转动看转不转、换镜看变不变');
        },
      });
      ctl.button({
        label: '换一张片（随机）',
        onClick: () => {
          optic.speck.where = ['slide', 'eyepiece', 'objective'][Math.floor(Math.random() * 3)];
          optic.speckMoves = { pan: false, rotate: false, obj: false };
          optic.pan = { x: 0, y: 0 };
          hud.set('a', '新污点出现');
        },
      });
      hud.set('a', '视野中出现一个黑点…');
      hud.set('b', '按顺序做三个排除实验');
      hud.set('c', '');
    },
  },
  {
    id: 'plant',
    title: '植物细胞',
    html: `<p>洋葱鳞片叶内表皮（未染色示意）：<b>细胞壁</b>围成砖墙状格子、<b>细胞核</b>为深色圆球、成熟细胞中央是<b>大液泡</b>。</p>
<p>换 40× 看核与核仁；调准焦螺旋体会<b>景深</b>——细胞是立体的，焦平面扫过不同层次。</p>`,
    enter() {
      optic.slide = 'onion';
      optic.lampOn = true;
      optic.obj = 1;
      setObj(1);
      optic.focus = idealFocus() - 8;
      app.setCamera([6.2, 7.0, 12.8], [0.75, 1.0, -0.25]);
      hud.visibleNow = true;
      ctl.clear();
      ctl.toggle({
        label: '结构标注', value: false,
        onChange: (v) => {
          hud.set('c', v ? '格子=细胞壁 · 深色圆=细胞核 · 中央大腔=液泡' : '');
        },
      });
      ctl.sep();
      baseOpticsCtl();
      hud.set('a', `放大 ${totalMag()}×`);
      hud.set('b', '细胞壁 · 细胞膜 · 细胞质 · 细胞核 · 液泡');
      hud.set('c', '');
    },
  },
  {
    id: 'animal',
    title: '动物细胞',
    html: `<p>人口腔上皮细胞（生理盐水涂片）：形状不规则、<b>没有细胞壁</b>、细胞核清晰、最外层是<span class="hl">细胞膜</span>（薄，光镜下不易分辨）。</p>
<p>与植物细胞对比：无壁、无液泡、无叶绿体，形状扁圆不规则。</p>`,
    enter() {
      optic.slide = 'mouth';
      optic.lampOn = true;
      optic.obj = 2;
      setObj(2);
      optic.focus = idealFocus() - 6;
      app.setCamera([6.2, 7.0, 12.8], [0.75, 1.0, -0.25]);
      hud.visibleNow = true;
      ctl.clear();
      baseOpticsCtl();
      hud.set('a', `放大 ${totalMag()}×`);
      hud.set('b', '无细胞壁 · 有细胞膜/质/核');
      hud.set('c', '滴生理盐水是为了维持细胞形态');
    },
  },
  {
    id: 'paramecium',
    title: '草履虫',
    html: `<p>草履虫：像一只倒转的草鞋，全身布满<span class="hl">纤毛</span>（摆动游动），口沟偏一侧——它是单细胞<b>原生动物</b>，有核、食物泡、伸缩泡。</p>
<p>观察技巧：放少量<b>棉花纤维</b>限制其游速。调节「游动速度」与倍率，40× 以上才能看清纤毛与食物泡。</p>`,
    enter() {
      optic.slide = 'para';
      optic.lampOn = true;
      optic.obj = 2;
      setObj(2);
      optic.focus = idealFocus() - 4;
      app.setCamera([6.2, 7.0, 12.8], [0.75, 1.0, -0.25]);
      hud.visibleNow = true;
      ctl.clear();
      ctl.slider({
        label: '游动速度', min: 0, max: 3, step: 0.1, value: optic.paraSpeed,
        fmt: (v) => '×' + v.toFixed(1),
        onInput: (v) => { optic.paraSpeed = v; },
      });
      ctl.sep();
      baseOpticsCtl();
      hud.set('a', `放大 ${totalMag()}×`);
      hud.set('b', '纤毛 · 口沟 · 核 · 食物泡 · 伸缩泡');
      hud.set('c', '10× 时纤毛分辨不出来（分辨率限制）');
    },
  },
  {
    id: 'chloro',
    title: '叶片与叶绿体',
    html: `<p>菠菜叶下表皮：普通表皮细胞之间散布着<b>气孔</b>——两个<span class="hl">保卫细胞</span>围成开口，是气体交换与蒸腾作用的门户。</p>
<p>叶肉细胞里许多绿色颗粒是<b>叶绿体</b>（光合作用场所）——只有达到一定放大倍数才能分辨（试一试 10× 与 40× 的差别）。</p>`,
    enter() {
      optic.slide = 'leaf';
      optic.lampOn = true;
      optic.obj = 1;
      setObj(1);
      optic.focus = idealFocus() - 6;
      app.setCamera([6.2, 7.0, 12.8], [0.75, 1.0, -0.25]);
      hud.visibleNow = true;
      ctl.clear();
      ctl.toggle({
        label: '标注', value: false,
        onChange: (v) => { hud.set('c', v ? '肾形对=保卫细胞+气孔 · 绿粒=叶绿体' : ''); },
      });
      ctl.sep();
      baseOpticsCtl();
      hud.set('a', `放大 ${totalMag()}×`);
      hud.set('b', '气孔器 = 2 保卫细胞 + 气孔');
      hud.set('c', '');
    },
  },
  {
    id: 'plasmolysis',
    title: '质壁分离与复原',
    html: `<p>成熟植物细胞是一个渗透系统：<b>原生质层</b>相当于半透膜。</p>
<p>滴 <span class="hl">0.3 g/mL 蔗糖溶液</span>（高渗）→ 细胞失水 → 原生质体收缩、与细胞壁分离（<b>质壁分离</b>）；再滴<span class="hl">清水</span>（低渗）→ 细胞吸水复原。壁本身是全透的，所以分离发生在原生质层与壁之间。</p>
<p>按按钮切换外界溶液，拖「时间加速」观察过程；此实验也可证明细胞是活的（死细胞不会复原）。</p>`,
    enter() {
      optic.slide = 'plasm';
      optic.lampOn = true;
      optic.obj = 2;
      setObj(2);
      optic.focus = idealFocus();
      optic.plasm = 0;
      optic.plasmT = 0;
      app.setCamera([6.2, 7.0, 12.8], [0.75, 1.0, -0.25]);
      hud.visibleNow = true;
      ctl.clear();
      ctl.button({
        label: '滴 0.3g/mL 蔗糖液（分离）',
        onClick: () => { optic.plasm = 1; hud.set('a', '高渗：细胞失水中…'); },
      });
      ctl.button({
        label: '滴清水（复原）',
        onClick: () => { optic.plasm = -1; hud.set('a', '低渗：细胞吸水复原…'); },
      });
      ctl.sep();
      ctl.slider({
        label: '时间加速', min: 0.5, max: 5, step: 0.1, value: 1,
        fmt: (v) => '×' + v.toFixed(1),
        onInput: (v) => { optic.plasmSpeed = v; },
      });
      optic.plasmSpeed = 1;
      baseOpticsCtl();
      hud.set('a', '外界溶液：清水');
      hud.set('b', '壁全透 · 原生质层半透 → 分离在此发生');
      hud.set('c', '');
    },
  },
  {
    id: 'mitosis',
    title: '有丝分裂',
    html: `<p>洋葱根尖<b>分生区</b>：细胞方形、排列紧密、正分裂旺盛。五个时期：</p>
<p><b>间期</b>（核完整，DNA 复制）→ <b>前期</b>（核膜消失，染色体散乱）→ <b>中期</b>（染色体排列在赤道板，数数目看形态的最佳期）→ <b>后期</b>（着丝点分裂，染色体移两极）→ <b>末期</b>（两个新核，出现细胞板）。</p>
<p>点下方按钮高亮对应时期的细胞（视野中橙色格子）。</p>`,
    enter() {
      optic.slide = 'mitosis';
      optic.lampOn = true;
      optic.obj = 2;
      setObj(2);
      optic.focus = idealFocus();
      optic.phaseHi = -1;
      app.setCamera([6.2, 7.0, 12.8], [0.75, 1.0, -0.25]);
      hud.visibleNow = true;
      ctl.clear();
      ['间期', '前期', '中期', '后期', '末期'].forEach((n, i) => {
        ctl.button({
          label: n,
          active: optic.phaseHi === i,
          onClick: (btn) => {
            optic.phaseHi = i;
            ctl.el.querySelectorAll('.ctl-btn').forEach((b) => b.classList.remove('active'));
            btn.classList.add('active');
            const P = ['间期：DNA 复制·蛋白质合成（占时最长，视野中最多）', '前期：核膜核仁消失，染色体散乱出现', '中期：染色体整齐排在赤道板——观察计数首选', '后期：着丝点一分为二，两套染色体移向两极', '末期：细胞板出现，一分为二'];
            hud.set('a', n);
            hud.set('b', P[i]);
          },
        });
      });
      ctl.sep();
      baseOpticsCtl();
      hud.set('a', '间期');
      hud.set('b', '分生区细胞小·方·核大——分裂旺盛区');
      hud.set('c', '');
    },
  },
  {
    id: 'blood',
    title: '血涂片与油镜',
    html: `<p>血涂片：<b>红细胞</b>（红色圆盘、中央浅染）数量多；<b>白细胞</b>（大、有紫色分叶核）数量少。</p>
<p>100× 油镜的金规则：物镜与玻片之间必须滴<span class="hl">香柏油</span>——油的折射率与玻璃接近，避免光线散失，否则视野昏暗一片。观察完毕用乙醚酒精擦拭镜头。</p>
<p>先看 40× 下白细胞的分叶核糊成一团；转 100× 并「加香柏油」对比。</p>`,
    enter() {
      optic.slide = 'blood';
      optic.lampOn = true;
      optic.obj = 2;
      setObj(2);
      optic.focus = idealFocus();
      optic.oil = false;
      app.setCamera([6.2, 7.0, 12.8], [0.75, 1.0, -0.25]);
      hud.visibleNow = true;
      ctl.clear();
      ctl.button({
        label: '转 100× 并加香柏油',
        onClick: () => {
          setObj(3);
          optic.oil = true;
          optic.focus = idealFocus();
          hud.set('a', `油镜 ${totalMag()}× · 分叶核清晰`);
          hud.set('c', '用完记得擦镜头！');
        },
      });
      ctl.button({
        label: '回到 40×',
        onClick: () => { setObj(2); optic.oil = false; hud.set('a', `放大 ${totalMag()}×`); },
      });
      ctl.sep();
      baseOpticsCtl({ withOil: true });
      hud.set('a', `放大 ${totalMag()}×`);
      hud.set('b', '油 = 桥梁，减少全反射损失');
      hud.set('c', '');
    },
  },
  {
    id: 'micrometer',
    title: '测微尺',
    html: `<p>显微测量两把尺：<b>目镜测微尺</b>（目镜里的刻度，格数会随物镜变化）× <b>台式测微尺</b>（玻片上的真实标尺，每小格 10 μm）。</p>
<p>校准：换物镜后，数出「目镜尺每格 = 台尺几格」→ 得到每格真实长度。本例：40× 时目镜每格 = 5 μm，10× 时每格 = 20 μm（倍数×4，每格长度÷4）。</p>
<p>切换物镜，看台尺在视野中的疏密变化，再估一估示例细胞的宽度。</p>`,
    enter() {
      optic.slide = 'micrometer';
      optic.lampOn = true;
      optic.obj = 2;
      setObj(2);
      optic.focus = idealFocus();
      app.setCamera([6.2, 7.0, 12.8], [0.75, 1.0, -0.25]);
      hud.visibleNow = true;
      ctl.clear();
      baseOpticsCtl();
      const umPerDiv = () => (40 * 10) / OBJ_MAGS[optic.obj];
      const f = () => {
        hud.set('a', `目镜每格 = ${umPerDiv()} μm（${OBJ_MAGS[optic.obj]}×）`);
        hud.set('b', '细胞宽 ≈ 14 格 ≈ ' + (14 * umPerDiv()) + ' μm');
        hud.set('c', '倍数×4 → 每格长度÷4');
      };
      optic.objChanged = f;
      f();
    },
  },
  {
    id: 'counter',
    title: '血球计数板',
    html: `<p>血球计数板：计数室划成 <b>9 个大方格</b>，每个大方格 1 mm²，中央大格再分 <b>25 个中格</b>（每中格 16 小格）。</p>
<p>计数规则：<b>数上不数下、数左不数右</b>（压线细胞只计一半方向的边）。公式：<span class="hl">细胞数/mL = (5 个中方格总数 ÷ 5) × 25 × 10⁴ × 稀释倍数</span>（计数室体积 = 0.1 mm³）。</p>
<p>点「圈定中方格」高亮其中一个，体验按格计数。</p>`,
    enter() {
      optic.slide = 'counter';
      optic.lampOn = true;
      optic.obj = 2;
      setObj(2);
      optic.focus = idealFocus();
      optic.countSq = -1;
      app.setCamera([6.2, 7.0, 12.8], [0.75, 1.0, -0.25]);
      hud.visibleNow = true;
      ctl.clear();
      ctl.button({
        label: '圈定一个中方格计数',
        onClick: () => {
          optic.countSq = Math.floor(Math.random() * 25);
          hud.set('a', `已圈定中格 ${optic.countSq + 1}/25 — 数一数里面的细胞`);
        },
      });
      ctl.button({
        label: '自动计数该格',
        onClick: () => {
          const n = 6 + Math.floor(Math.random() * 9);
          hud.set('a', `该中格 ${n} 个细胞`);
          hud.set('b', `估算：≈ ${((n * 25) * 1e4).toLocaleString()} 个/mL（未稀释）`);
          hud.set('c', '公式：格均 × 25 × 10⁴ × 稀释倍数');
        },
      });
      ctl.sep();
      baseOpticsCtl();
      hud.set('a', '计数室：9 大格 · 中央 25 中格');
      hud.set('b', '数上不数下、数左不数右');
      hud.set('c', '');
    },
  },
  {
    id: 'contrast',
    title: '明场、暗场与相差',
    html: `<p>三种照明对比（以洋葱表皮为例）：</p>
<p><b>明场</b>：透射光直进，样品因吸收/散射变暗——最常用；<b>暗场</b>：斜射照明，只有散射光进镜——背景漆黑、边缘亮起，适合看微小颗粒与活虫运动；<b>相差</b>：利用相位差转换明暗差——<span class="hl">无需染色即可看清透明活细胞</span>的细微结构。</p>
<p>切换照明方式，观察同一玻片在三种模式下的差异。</p>`,
    enter() {
      optic.slide = 'onion';
      optic.lampOn = true;
      optic.obj = 2;
      setObj(2);
      optic.focus = idealFocus();
      app.setCamera([6.2, 7.0, 12.8], [0.75, 1.0, -0.25]);
      hud.visibleNow = true;
      ctl.clear();
      baseOpticsCtl({ withLight: true });
      hud.set('a', '明场（Bright Field）');
      hud.set('b', '明场通用 · 暗场看边缘 · 相差看活细胞');
      hud.set('c', '切到暗场/相差再切回来对比');
    },
  },
  {
    id: 'free',
    title: '自由观察',
    html: `<p>所有控制台打开：换玻片、换物镜、调焦、换照明、加油——想看什么就看什么。</p>
<p>小挑战：① 用暗场找正在游动的草履虫；② 40× 找气孔，数保卫细胞里的叶绿体；③ 油镜数一数白细胞分叶。</p>`,
    enter() {
      optic.slide = 'onion';
      optic.lampOn = true;
      optic.obj = 1;
      setObj(1);
      optic.focus = idealFocus() - 8;
      app.setCamera([6.2, 7.0, 12.8], [0.75, 1.0, -0.25]);
      hud.visibleNow = true;
      ctl.clear();
      ctl.seg({
        options: [
          { label: '字母e', value: 'letter' }, { label: '洋葱', value: 'onion' },
          { label: '口腔', value: 'mouth' }, { label: '草履虫', value: 'para' },
          { label: '叶表皮', value: 'leaf' }, { label: '质壁分离', value: 'plasm' },
        ],
        value: optic.slide,
        onChange: (v) => { optic.slide = v; },
      });
      ctl.sep();
      baseOpticsCtl({ withLight: true, withOil: true });
      ctl.sep();
      ctl.slider({
        label: '游动速度', min: 0, max: 3, step: 0.1, value: optic.paraSpeed,
        fmt: (v) => '×' + v.toFixed(1),
        onInput: (v) => { optic.paraSpeed = v; },
      });
      ctl.button({
        label: '移片',
        onClick: () => moveSlide(),
      });
      hud.set('a', `当前 ${SLIDES[optic.slide].name} · ${totalMag()}×`);
      hud.set('b', '全部控制台已解锁');
      hud.set('c', '');
    },
  },
];

const DEG_R = TAU / 360;

/* ================= 主循环 ================= */

app.onFrame((dt, t) => {
  hud.el.style.display = hud.visibleNow ? '' : 'none';
  /* 调焦旋钮联动 + 载物台微升降 */
  if (parts.knobCoarse) {
    parts.knobCoarse.rotation.y = optic.focus * 0.08;
    parts.knobFine.rotation.y = -optic.focus * 0.14;
  }
  if (parts.stageAsm) {
    parts.stageAsm.position.y = (62 - optic.focus) * 0.0009;
  }
  /* 台下光源联动 */
  if (parts.lamp) {
    parts.lamp.material.color.setScalar(optic.lampOn ? 1 : 0.18);
    lampPoint.intensity = optic.lampOn ? 2.2 : 0.3;
  }
  /* 目镜视野 */
  renderEyepiece(t);
  /* 质壁分离动力学 */
  if (activeSectionId === 'plasmolysis' && optic.plasm !== 0) {
    const sp = dt * (optic.plasmSpeed || 1);
    if (optic.plasm > 0) optic.plasmT = clamp(optic.plasmT + sp * 0.22, 0, 1);
    else optic.plasmT = clamp(optic.plasmT - sp * 0.22, 0, 1);
  }
  /* 章节读数刷新 */
  if (activeSectionId === 'low-to-high' && optic.objChanged) optic.objChanged();
});

/* ================= 随堂检测 ================= */

const QUIZ = [
  {
    q: '用显微镜观察玻片上的 "e"，视野中看到的像是？',
    opts: ['正立放大的 "e"', '倒立放大的 "e"（上下左右都颠倒）', '倒立缩小的 "e"', '正立缩小的 "e"'],
    a: 1,
    ex: '显微镜成的是倒立放大的虚像——上下左右都颠倒。因此物像偏向哪边，玻片就往哪边移。',
  },
  {
    q: '由低倍镜换高倍镜的正确操作是？',
    opts: ['直接换高倍镜再调粗准焦螺旋', '先在低倍下把目标移到视野中央，换高倍后再调细准焦螺旋和光圈', '升高镜筒再换高倍镜', '换高倍镜后移动玻片找目标'],
    a: 1,
    ex: '高倍视野小，目标必须先居中；换高倍后只调细准焦螺旋（粗准焦会压碎玻片），视野变暗可调大光圈。',
  },
  {
    q: '视野中的污点，移动玻片不动、转动目镜不动、换物镜后消失——污点在？',
    opts: ['玻片上', '目镜上', '物镜上', '反光镜上'],
    a: 2,
    ex: '三步排除法：动玻片跟动→玻片；转目镜跟转→目镜；换物镜变化→物镜。',
  },
  {
    q: '使用 100× 油镜观察血涂片前，必须在物镜与玻片之间滴香柏油，原因是？',
    opts: ['防止压碎玻片', '油的折射率与玻璃接近，减少光散失、提高分辨率', '给细胞补充营养', '润滑镜头'],
    a: 1,
    ex: '香柏油折射率接近玻璃，光线几乎不发生全反射损失，油镜才能获得明亮清晰的 1000× 图像。',
  },
  {
    q: '观察洋葱表皮的质壁分离与复原，能证明的是？',
    opts: ['细胞壁是半透膜', '原生质层是半透膜，且细胞保持活性（死细胞不能复原）', '细胞壁全透性错误', '液泡不再吸水'],
    a: 1,
    ex: '质壁分离发生在细胞壁（全透）与原生质层（半透）之间；能否复原取决于细胞是否存活。',
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

const sections = createSections({
  nav: document.getElementById('sideNav'),
  descPanel: document.getElementById('descPanel'),
  sections: SECTIONS,
  onSelect(i, sec) {
    if (activeCleanup) { activeCleanup(); activeCleanup = null; }
    activeSectionId = sec.id;
    if (sec.id !== 'imaging') optic.letterRot = 0;
    sec.enter();
  },
});
window.__eduSections = sections;
/* 调试句柄（自动化截图/像素级自查用） */
window.__microDebug = { optic, renderEyepiece: (t = 1) => renderEyepiece(t), sampleCanvas: sCv, eyeCanvas: eCv, vfx };
loader.hide();
sections.select(0);
