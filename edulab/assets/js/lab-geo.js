/* EduLab · 立体几何实验室（geo）—— R06 Micro 级建模深改
 * 章节：几何体认识 / 展开与折叠 / 三视图与直观图 / 截面 / 空间角 / 空间向量与坐标 / 外接球与内切球 / 正四面体 / 随堂检测
 * 布局（micro 三件套移植）：真·三栏——左栏章节大纲（点击切章 + ‹01/09›）/ 中栏 3D 绘图工作台（相机飞行）/
 *   右栏 知识点详解 + 实验控件 + 数据读数；左右栏独立折叠（28px 竖条）+ 专注模式 + 右栏三块手风琴
 *   （geo.accLesson/accControls/accData 记忆，切章不重置）。
 * 视觉工艺（edu-vfx 轻接入 + Micro 级建模）：
 *   - 绘图工作台：木纹桌面（程序化年轮+板缝）+ 方格坐标纸垫（CanvasTexture 网格+渐变纸色）+ 接触阴影贴片
 *   - 场景道具阵列：六棱铅笔（Hex 柱身+木锥削+石墨芯+黄铜箍+橡皮头）/ 有机玻璃直尺（刻度贴图+圆角）/
 *     三角板（内外轮廓一次挤出）/ 圆规（CatmullRom 放样双支腿+滚花顶帽+针尖+粉笔爪）/ 橡皮（纸套标签）/
 *     木质教具盘（立方体·正四面体·圆柱·圆锥·球 五件微缩教具，清漆 clearcoat）/ 图纸筒+书堆
 *   - 教学主体：棱柱/棱锥/棱台族（Extrude 倒角）+ 旋转体族（Lathe/放样）+ 顶点金属关节球 + 棱线高亮 +
 *     幽灵面（ghost 化可透视）——所有可透视构造遵循「科学插画」语法
 *   - 交互可视反馈：截面平面拖拽实时切割 / 三点定面 P·Q·R 沿棱拖动 / 折叠滑杆联动铰链组 /
 *     斜二测形态渐变动画 / 方块搭积 raycast 增删 / 向量箭头随滑杆伸缩 / 球模型辅助线逐段点亮
 * 教学交互（原版功能 1:1 对齐）：几何体认识（棱柱·棱锥·棱台 n=3..8 + 旋转体 + 欧拉公式 + 表面积体积）/
 *   展开与折叠（几何体展开动画 / 35 种六连方程序验证 11 种真展开图 + 伪展开重叠标红 / 最短路径正方体·圆柱）/
 *   三视图与直观图（搭方块 raycast 建体 + 主左俯实时投影 + 同三视图异搭法对照 / 斜二测四步演示 + 面积比）/
 *   截面（预设截面 / 三点定面拖拽 / 自由平面 + 正四面体截面 + 经典三点截面演示）/
 *   空间角（正方体 6 组 + 四棱锥 3 组命名演示 + 自由点击棱面求角）/ 空间向量（分量滑杆 + 点积夹角 /
 *   法向量与点到平面距离 3 组演示 + 自由点选 + 几何法对照）/ 外接球内切球（外接 12 模型 + 内切 7 模型：补形·对棱相等·
 *   汉堡·垂面·切瓜·共斜边·鳄鱼·菱形折叠·圆柱圆锥轴截面·等体积法·截面法…每组配特征/公式/例题/解答）/ 正四面体（三球同心 + 补形正方体）/
 *   随堂检测（截面·展开·三视图三题库随机抽 5 题，作答后舞台演示答案）。
 * 全局：‹ › 切章（← →）/ 重做 / 模型标签 / 重置视角 R / 纸面·棚拍风格 T / 全屏 F / ] 收起右栏 / 大屏专注。
 */
import {
  THREE, DEG, TAU, clamp,
  createApp, makeLoader,
  createControlsPanel, makeHUD, makeTextSprite, setSpriteText,
} from './edu-core.js';
import {
  attachVFX, PAL,
  matCoat, matSheen, matStd, matGlass,
  makeStudioEnvironment, makeWoodTexture, makeLabelTexture, makeBackdropTexture,
} from './edu-vfx.js';

/* ---------------- 场景与工艺接入 ---------------- */

const stage = document.getElementById('stage');
const loader = makeLoader(stage, '正在搭建立体几何工作台…');
const app = createApp({
  container: stage,
  fov: 42, near: 0.05, far: 80,
  cameraPos: [4.8, 3.6, 6.2],
  target: [0, 0.9, 0],
  minDistance: 1.2, maxDistance: 40,
  exposure: 1.05,
  keepBackground: true,
});
const { scene } = app;
/* 视觉工艺轻接入：后处理管线接管渲染循环与相机缓动（setCamera 升级为 cubic 运镜） */
const vfx = attachVFX(app, 'illus');
scene.environment = makeStudioEnvironment(app.renderer);
app.renderer.toneMappingExposure = 0.98;

/* 双风格背景：棚拍（默认）与纸面（制图纸暖米色），T 键或工具钮切换 */
const STYLE = {
  studio: { backdrop: { inner: '#ccd6dc', outer: '#59646e', glow: '#f4f0e2', glowStrength: 0.3 }, paper: '#e9e4d4', grid: 'rgba(96,116,132,0.30)' },
  paper: { backdrop: { inner: '#f6f1e1', outer: '#b9ad92', glow: '#fffdf2', glowStrength: 0.55 }, paper: '#f3ecd9', grid: 'rgba(120,110,84,0.34)' },
};
let sceneStyle = 'studio';
try { if (localStorage.getItem('geo.style') === 'paper') sceneStyle = 'paper'; } catch (e) { /* 忽略 */ }
function applyStyle() {
  const s = STYLE[sceneStyle];
  scene.background = makeBackdropTexture(s.backdrop);
  drawPaperGrid();
  const btn = document.getElementById('styleBtn');
  if (btn) {
    btn.textContent = sceneStyle === 'studio' ? '纸面' : '棚拍';
    btn.title = '切换纸面 / 棚拍风格 (T)';
  }
}

/* 灯光：暖主光 + 冷补光 + 正面柔光 + 桌面 bounce + 低环境 */
const keyLight = new THREE.DirectionalLight(0xffe8c8, 1.05);
keyLight.position.set(3.6, 6, 3.2);
scene.add(keyLight);
const fillLight = new THREE.DirectionalLight(0xdfe9ff, 0.42);
fillLight.position.set(-4.2, 3.4, -2.6);
scene.add(fillLight);
const frontLight = new THREE.DirectionalLight(0xeef4ff, 0.3);
frontLight.position.set(0.4, 2.6, 5.2);
scene.add(frontLight);
scene.add(new THREE.AmbientLight(0x9a948c, 0.36));
const deskBounce = new THREE.PointLight(0xffdca6, 0.28, 8, 1.8);
deskBounce.position.set(0, 1.6, 1.4);
scene.add(deskBounce);

/* ---------------- 通用工具 ---------------- */

const mesh = (geo, mat) => new THREE.Mesh(geo, mat);
function label(text, color = '#ffe9cf', scale = 0.0042) {
  return makeTextSprite(text, { fontSize: 36, color, scale, bg: 'rgba(12,16,22,0.66)' });
}
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function canvasTex(w, h, draw) {
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  draw(cv.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}
function clearGroup(g) {
  g.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) {
      if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose());
      else o.material.dispose();
    }
  });
  g.clear();
}
function onEdge(a, b, t) {
  return new THREE.Vector3().lerpVectors(a, b, t);
}
/* 无拖拽点击：按下与抬起位移 < 6px 才视为点击（避免轨道旋转误触发拾取） */
function clickNoDrag(el, handler) {
  let sx = 0, sy = 0, sb = -1;
  const down = (e) => { sx = e.clientX; sy = e.clientY; sb = e.button; };
  const up = (e) => {
    if (Math.hypot(e.clientX - sx, e.clientY - sy) < 6 && e.button === sb) handler(e);
  };
  el.addEventListener('pointerdown', down);
  el.addEventListener('pointerup', up);
  return () => {
    el.removeEventListener('pointerdown', down);
    el.removeEventListener('pointerup', up);
  };
}
/* 角度弧线（在含三点平面内画 arc） */
function arcLine(center, from, to, normal, color, r = 0.34, seg = 26) {
  const pts = [];
  const v1 = from.clone().sub(center).normalize();
  const v2 = to.clone().sub(center).normalize();
  let prev = center.clone().add(v1.clone().multiplyScalar(r));
  for (let i = 1; i <= seg; i++) {
    const t = (i / seg) * v1.angleTo(v2);
    const q = new THREE.Quaternion().setFromAxisAngle(normal.clone().normalize(), t);
    const p = center.clone().add(v1.clone().applyQuaternion(q).multiplyScalar(r));
    pts.push(prev, p);
    prev = p;
  }
  return new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints(pts),
    new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.95 }),
  );
}
/* 直角小方块标记（角点 + 两方向） */
function rightAngleMark(center, d1, d2, color, s = 0.14) {
  const a = center.clone().add(d1.clone().normalize().multiplyScalar(s));
  const b = center.clone().add(d2.clone().normalize().multiplyScalar(s));
  const c = a.clone().add(d2.clone().normalize().multiplyScalar(s));
  return new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([a, c, b]),
    new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.9 }),
  );
}
/* 接触阴影贴片：径向渐变烘焙，贴在桌面 y≈0.004 */
function makeShadowBlob(radius = 1.2, alpha = 0.34) {
  const tex = canvasTex(128, 128, (ctx) => {
    const g = ctx.createRadialGradient(64, 64, 6, 64, 64, 62);
    g.addColorStop(0, `rgba(8,10,14,${alpha})`);
    g.addColorStop(0.55, `rgba(8,10,14,${alpha * 0.5})`);
    g.addColorStop(1, 'rgba(8,10,14,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
  });
  const m = mesh(new THREE.PlaneGeometry(radius * 2, radius * 2), new THREE.MeshBasicMaterial({
    map: tex, transparent: true, depthWrite: false, opacity: 1,
  }));
  m.rotation.x = -Math.PI / 2;
  m.renderOrder = 1;
  return m;
}

/* ---------------- 绘图工作台（桌面 + 方格纸垫 + 道具阵列） ---------------- */

const DESK_Y = 0;
const deskGroup = new THREE.Group();
scene.add(deskGroup);
const world = new THREE.Group();     // 每章教学内容挂这里
scene.add(world);
const propsGroup = new THREE.Group(); // 静态道具
scene.add(propsGroup);
const demoShadow = makeShadowBlob(1.7, 0.4); // 当前教学主体的接触阴影（随章缩放）
demoShadow.position.y = DESK_Y + 0.004;
scene.add(demoShadow);

/* 桌面：木纹 + 圆角厚板 + 侧沿倒角 */
{
  const wood = makeWoodTexture({ base: '#7a5a38', dark: '#57402a', light: '#98724a', bands: 9, streaks: 120, planks: 5, seed: 11 });
  wood.repeat.set(2.6, 1.7);
  const topMat = matStd(0xffffff, { roughness: 0.62, metalness: 0.04 });
  topMat.map = wood;
  const top = mesh(new THREE.BoxGeometry(15.6, 0.22, 10.6), topMat);
  top.position.y = DESK_Y - 0.11;
  deskGroup.add(top);
  /* 前沿裙板：略深一档的木色 + 高光走线 */
  const skirtMat = matStd(0x5f4529, { roughness: 0.7 });
  const skirt = mesh(new THREE.BoxGeometry(15.2, 0.62, 0.3), skirtMat);
  skirt.position.set(0, DESK_Y - 0.52, 5.12);
  deskGroup.add(skirt);
  const skirt2 = skirt.clone();
  skirt2.position.z = -5.12;
  deskGroup.add(skirt2);
  for (const sx of [-7.62, 7.62]) {
    const side = mesh(new THREE.BoxGeometry(0.3, 0.62, 9.9), skirtMat);
    side.position.set(sx, DESK_Y - 0.52, 0);
    deskGroup.add(side);
  }
}

/* 方格纸垫：渐变纸色 + 网格 + 坐标轴 + 角标 */
const paperCv = document.createElement('canvas');
paperCv.width = 1024; paperCv.height = 768;
const paperTex = new THREE.CanvasTexture(paperCv);
paperTex.colorSpace = THREE.SRGBColorSpace;
paperTex.anisotropy = 8;
function drawPaperGrid() {
  const ctx = paperCv.getContext('2d');
  const W = paperCv.width, H = paperCv.height;
  const s = STYLE[sceneStyle];
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.5, s.paper);
  g.addColorStop(1, s.paper);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  /* 纸纹噪点 */
  const rnd = mulberry32(5);
  for (let i = 0; i < 700; i++) {
    ctx.fillStyle = `rgba(90,80,60,${0.02 + rnd() * 0.05})`;
    ctx.fillRect(rnd() * W, rnd() * H, 1.6, 1.4);
  }
  /* 方格：5mm 细格 + 25mm 粗格 */
  ctx.strokeStyle = s.grid;
  for (let x = 0; x <= W; x += 32) {
    ctx.lineWidth = x % 160 === 0 ? 2 : 1;
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y <= H; y += 32) {
    ctx.lineWidth = y % 160 === 0 ? 2 : 1;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
  /* 角落页标 */
  ctx.fillStyle = 'rgba(120,104,70,0.5)';
  ctx.font = '600 22px "PingFang SC", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('坐标纸 · GRID 5 mm', 26, 40);
  ctx.textAlign = 'right';
  ctx.fillText('GEO · 立体几何工作台', W - 26, H - 24);
  paperTex.needsUpdate = true;
}
const paperMat = matStd(0xffffff, { roughness: 0.85, metalness: 0 });
paperMat.map = paperTex;
const paperPad = mesh(new THREE.BoxGeometry(6.9, 0.03, 5.2), paperMat);
paperPad.position.y = DESK_Y + 0.015;
drawPaperGrid();
deskGroup.add(paperPad);
/* 纸垫四角胶带贴片 */
{
  const tapeMat = matStd(0xd9cfa8, { roughness: 0.5, transparent: true, opacity: 0.62 });
  for (const [tx, tz, rot] of [[-3.42, -2.57, 0.5], [3.42, -2.57, -0.5], [-3.42, 2.57, -0.5], [3.42, 2.57, 0.5]]) {
    const tape = mesh(new THREE.BoxGeometry(0.5, 0.006, 0.14), tapeMat);
    tape.position.set(tx, DESK_Y + 0.032, tz);
    tape.rotation.y = rot;
    deskGroup.add(tape);
  }
}

/* —— 道具：六棱铅笔（Hex 柱身 + 木削锥 + 石墨 + 黄铜箍 + 橡皮头） —— */
{
  const pen = new THREE.Group();
  const barrelMat = matCoat(0xe8a23c, { roughness: 0.3, clearcoatRoughness: 0.2 });
  const barrel = mesh(new THREE.CylinderGeometry(0.052, 0.052, 1.62, 6), barrelMat);
  barrel.material.flatShading = true;
  pen.add(barrel);
  const woodTip = mesh(new THREE.ConeGeometry(0.052, 0.2, 6), matStd(0xd9b98a, { roughness: 0.8 }));
  woodTip.material.flatShading = true;
  woodTip.rotation.x = Math.PI / 2;
  woodTip.rotation.z = Math.PI;
  woodTip.position.set(0, 0, -0.91);
  pen.add(woodTip);
  const lead = mesh(new THREE.ConeGeometry(0.016, 0.07, 8), matStd(0x2c2c30, { roughness: 0.45 }));
  lead.rotation.x = -Math.PI / 2;
  lead.position.set(0, 0, -0.99);
  pen.add(lead);
  const ferrule = mesh(new THREE.CylinderGeometry(0.054, 0.054, 0.1, 20), matStd(0xb08d4a, { roughness: 0.28, metalness: 0.85 }));
  ferrule.position.y = 0.86;
  pen.add(ferrule);
  for (const y of [0.822, 0.9]) {
    const ring = mesh(new THREE.TorusGeometry(0.0545, 0.006, 8, 24), matStd(0x8a6c34, { roughness: 0.3, metalness: 0.9 }));
    ring.rotation.x = Math.PI / 2;
    ring.position.y = y;
    pen.add(ring);
  }
  const eraser = mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.12, 20), matCoat(PAL.granule, { roughness: 0.55 }));
  eraser.position.y = 0.97;
  pen.add(eraser);
  /* 六棱柱的棱线（暗色细线，强调切削面） */
  const penEdges = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.CylinderGeometry(0.052, 0.052, 1.62, 6, 1, true), 20),
    new THREE.LineBasicMaterial({ color: 0x8a5a1c, transparent: true, opacity: 0.5 }),
  );
  pen.add(penEdges);
  pen.position.set(-2.55, DESK_Y + 0.055, 2.06);
  pen.rotation.set(Math.PI / 2, 0, 0.28);
  propsGroup.add(pen);
  const penShadow = makeShadowBlob(1.0, 0.26);
  penShadow.position.set(-2.55, DESK_Y + 0.006, 2.06);
  penShadow.scale.set(1.5, 0.7, 1);
  penShadow.rotation.z = 0.28;
  propsGroup.add(penShadow);
}

/* —— 道具：有机玻璃直尺（刻度贴图 + 圆角 + 侧沿） —— */
{
  const rulerTex = canvasTex(1024, 128, (ctx, w, h) => {
    ctx.fillStyle = 'rgba(210,232,238,0.85)';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(70,110,128,0.8)';
    ctx.lineWidth = 3;
    ctx.strokeRect(6, 6, w - 12, h - 12);
    ctx.fillStyle = 'rgba(40,72,88,0.9)';
    ctx.font = '600 26px "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('15 cm', w * 0.5, h - 16);
    for (let mm = 0; mm <= 150; mm++) {
      const x = 30 + mm * 6.4;
      const major = mm % 10 === 0;
      const mid = mm % 5 === 0;
      ctx.strokeStyle = 'rgba(40,72,88,0.85)';
      ctx.lineWidth = major ? 2.6 : 1.4;
      ctx.beginPath();
      ctx.moveTo(x, 10);
      ctx.lineTo(x, major ? 52 : mid ? 38 : 28);
      ctx.stroke();
      if (major) {
        ctx.fillStyle = 'rgba(40,72,88,0.95)';
        ctx.font = '700 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(String(mm / 10), x, 76);
      }
    }
  });
  const rulerMat = matGlass(0xd8ecf2, { roughness: 0.12, transmission: 0.9, opacity: 0.55 });
  rulerMat.map = rulerTex;
  const ruler = mesh(new THREE.BoxGeometry(2.6, 0.035, 0.34), rulerMat);
  ruler.position.set(2.42, DESK_Y + 0.036, 2.18);
  ruler.rotation.y = -0.2;
  propsGroup.add(ruler);
  const rShadow = makeShadowBlob(1.4, 0.2);
  rShadow.position.set(2.42, DESK_Y + 0.006, 2.18);
  rShadow.scale.set(1.6, 0.55, 1);
  rShadow.rotation.z = -0.2;
  propsGroup.add(rShadow);
}

/* —— 道具：三角板（内外轮廓一次挤出，磨砂红） —— */
{
  const sh = new THREE.Shape();
  sh.moveTo(-0.62, -0.4); sh.lineTo(0.78, -0.4); sh.lineTo(-0.62, 0.62); sh.closePath();
  const hole = new THREE.Path();
  hole.moveTo(-0.44, -0.26); hole.lineTo(0.3, -0.26); hole.lineTo(-0.44, 0.32); hole.closePath();
  sh.holes.push(hole);
  const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.028, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.008, bevelSegments: 2 });
  const sq = mesh(geo, matCoat(0xd86a4a, { roughness: 0.4, clearcoat: 0.6, transparent: true, opacity: 0.85 }));
  sq.rotation.x = -Math.PI / 2;
  sq.position.set(1.02, DESK_Y + 0.052, 2.32);
  sq.rotation.z = 0.42;
  propsGroup.add(sq);
  const sShadow = makeShadowBlob(0.8, 0.2);
  sShadow.position.set(1.02, DESK_Y + 0.006, 2.3);
  propsGroup.add(sShadow);
}

/* —— 道具：圆规（CatmullRom 放样双支腿 + 滚花顶帽 + 针尖 + 粉笔爪） —— */
/* 沿曲线放样矩形截面管（中心线采样 + 平行框架 + 逐段缝合） */
function sweepTube(points, opts = {}) {
  const curve = new THREE.CatmullRomCurve3(points);
  const N = opts.frames ?? 30;
  const wHalf = (opts.width ?? 0.05) / 2;
  const dHalf = (opts.depth ?? 0.022) / 2;
  const wFn = opts.widthFn || (() => 1);
  const pts = curve.getPoints(N);
  const tangents = pts.map((p, i) => {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(N, i + 1)];
    return b.clone().sub(a).normalize();
  });
  /* 宽度轴取世界 X 与切线叉乘，保证截面稳定 */
  const positions = [];
  const indices = [];
  const up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i <= N; i++) {
    const t = tangents[Math.min(i, N - 1)];
    const side = new THREE.Vector3().crossVectors(t, up).normalize();
    const nor = new THREE.Vector3().crossVectors(side, t).normalize();
    const k = wFn(i / N);
    const c = pts[i];
    const corners = [
      c.clone().add(side.clone().multiplyScalar(wHalf * k)).add(nor.clone().multiplyScalar(dHalf)),
      c.clone().add(side.clone().multiplyScalar(-wHalf * k)).add(nor.clone().multiplyScalar(dHalf)),
      c.clone().add(side.clone().multiplyScalar(-wHalf * k)).add(nor.clone().multiplyScalar(-dHalf)),
      c.clone().add(side.clone().multiplyScalar(wHalf * k)).add(nor.clone().multiplyScalar(-dHalf)),
    ];
    for (const p of corners) positions.push(p.x, p.y, p.z);
    if (i > 0) {
      const b0 = (i - 1) * 4;
      for (const [a, bb, cc, dd] of [[b0, b0 + 1, b0 + 4, b0 + 5], [b0 + 1, b0 + 2, b0 + 5, b0 + 6], [b0 + 2, b0 + 3, b0 + 6, b0 + 7], [b0 + 3, b0, b0 + 7, b0 + 4]]) {
        indices.push(a, bb, cc, a, cc, dd);
      }
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return mesh(geo, opts.mat || matStd(PAL.steel, { roughness: 0.3, metalness: 0.85 }));
}
{
  const compass = new THREE.Group();
  /* 顶帽：滚花旋钮（环纹） */
  const cap = mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.09, 24), matStd(0x35414c, { roughness: 0.35, metalness: 0.8 }));
  compass.add(cap);
  for (let i = 0; i < 7; i++) {
    const knurl = mesh(new THREE.TorusGeometry(0.0755, 0.004, 6, 28), matStd(0x5a6a76, { roughness: 0.3, metalness: 0.85 }));
    knurl.rotation.x = Math.PI / 2;
    knurl.position.y = -0.038 + i * 0.013;
    compass.add(knurl);
  }
  const neck = mesh(new THREE.CylinderGeometry(0.03, 0.042, 0.1, 16), matStd(PAL.brass, { roughness: 0.3, metalness: 0.9 }));
  neck.position.y = -0.09;
  compass.add(neck);
  /* 双支腿：曲线放样，一根带针尖、一根带粉笔爪 */
  const legL = sweepTube([
    new THREE.Vector3(0, -0.12, 0),
    new THREE.Vector3(0.02, -0.34, 0.004),
    new THREE.Vector3(0.14, -0.62, 0.01),
    new THREE.Vector3(0.3, -0.84, 0.012),
  ], { width: 0.062, depth: 0.03, widthFn: (t) => 1 - t * 0.35 });
  compass.add(legL);
  const legR = sweepTube([
    new THREE.Vector3(0, -0.12, 0),
    new THREE.Vector3(-0.02, -0.34, -0.004),
    new THREE.Vector3(-0.14, -0.62, -0.01),
    new THREE.Vector3(-0.3, -0.84, -0.012),
  ], { width: 0.062, depth: 0.03, widthFn: (t) => 1 - t * 0.35 });
  compass.add(legR);
  const needle = mesh(new THREE.ConeGeometry(0.008, 0.09, 10), matStd(0x8a949e, { roughness: 0.25, metalness: 0.9 }));
  needle.position.set(0.316, -0.955, 0.013);
  needle.rotation.x = Math.PI;
  compass.add(needle);
  const chalkLeg = mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.14, 12), matStd(0x46525e, { roughness: 0.4, metalness: 0.7 }));
  chalkLeg.position.set(-0.318, -0.965, -0.013);
  chalkLeg.rotation.z = 0.06;
  compass.add(chalkLeg);
  const chalk = mesh(new THREE.CylinderGeometry(0.012, 0.014, 0.1, 10), matStd(0xf2ead8, { roughness: 0.9 }));
  chalk.position.set(-0.327, -1.06, -0.015);
  compass.add(chalk);
  /* 台面画好的弧线（粉笔痕） */
  const arcPts = [];
  for (let i = 0; i <= 40; i++) {
    const a = -0.4 + (i / 40) * 2.2;
    arcPts.push(new THREE.Vector3(Math.cos(a) * 0.42, 0.004, Math.sin(a) * 0.42));
  }
  const arc = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(arcPts),
    new THREE.LineBasicMaterial({ color: 0xf2ead8, transparent: true, opacity: 0.75 }),
  );
  compass.add(arc);
  compass.position.set(-1.24, DESK_Y + 1.06, 1.52);
  compass.rotation.y = 0.5;
  propsGroup.add(compass);
  const cShadow = makeShadowBlob(0.9, 0.24);
  cShadow.position.set(-1.24, DESK_Y + 0.006, 1.52);
  propsGroup.add(cShadow);
}

/* —— 道具：橡皮（纸套 + 标签贴图） —— */
{
  const eraserTex = makeLabelTexture(['迷鹿牌绘图橡皮', '4B · 少屑'], { accent: '#a05a3a' });
  const sleeveMat = matStd(0xffffff, { roughness: 0.7 });
  sleeveMat.map = eraserTex;
  const eraser = new THREE.Group();
  const body = mesh(new THREE.BoxGeometry(0.34, 0.1, 0.14), matCoat(0xe8ded0, { roughness: 0.6 }));
  eraser.add(body);
  const sleeve = mesh(new THREE.BoxGeometry(0.2, 0.104, 0.144), sleeveMat);
  eraser.add(sleeve);
  eraser.position.set(-0.32, DESK_Y + 0.052, 2.42);
  eraser.rotation.y = -0.3;
  propsGroup.add(eraser);
}

/* —— 道具：图纸筒 + 书堆（侧面页纹 + 书脊标签） —— */
{
  const tubeMat = matCoat(0x4a6478, { roughness: 0.42, clearcoat: 0.5 });
  const tube = mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.72, 20), tubeMat);
  tube.position.set(2.9, DESK_Y + 0.36, -2.16);
  tube.rotation.z = Math.PI / 2;
  tube.rotation.y = 0.3;
  propsGroup.add(tube);
  const capL = mesh(new THREE.CylinderGeometry(0.096, 0.096, 0.05, 20), matStd(0x35465a, { roughness: 0.5 }));
  capL.position.set(2.9 - 0.37, DESK_Y + 0.36, -2.16);
  capL.rotation.z = Math.PI / 2;
  propsGroup.add(capL);
  const capR = capL.clone();
  capR.position.x = 2.9 + 0.37;
  propsGroup.add(capR);
  const tShadow = makeShadowBlob(0.62, 0.22);
  tShadow.position.set(2.9, DESK_Y + 0.006, -2.16);
  tShadow.scale.set(1.7, 0.8, 1);
  propsGroup.add(tShadow);
  /* 书堆：三本，顶本斜放 */
  const bookSpines = ['解析几何', '立体几何', '投影几何'];
  const bookCols = [0x9a5a44, 0x4a6e5a, 0x54628a];
  bookSpines.forEach((name, i) => {
    const bw = 1.5 - i * 0.14, bh = 0.13, bd = 1.05 - i * 0.08;
    const coverMat = matCoat(bookCols[i], { roughness: 0.5, clearcoat: 0.4 });
    const pagesMat = matStd(0xf0e8d4, { roughness: 0.9 });
    const book = new THREE.Group();
    const cover = mesh(new THREE.BoxGeometry(bw, bh, bd), coverMat);
    const pages = mesh(new THREE.BoxGeometry(bw * 0.97, bh * 0.7, bd * 0.985), pagesMat);
    pages.position.y = -bh * 0.08;
    book.add(cover, pages);
    /* 书脊标签 */
    const spineTex = makeLabelTexture([name], { w: 128, h: 64, accent: bookCols[i] });
    const spineMat = matStd(0xffffff, { roughness: 0.6 });
    spineMat.map = spineTex;
    const spine = mesh(new THREE.BoxGeometry(0.02, bh * 0.86, bd * 0.9), spineMat);
    spine.position.set(-bw / 2 + 0.005, 0, 0);
    book.add(spine);
    book.position.set(-3.15 + i * 0.06, DESK_Y + bh / 2 + i * bh, -2.2 + i * 0.05);
    book.rotation.y = 0.16 + i * 0.12;
    propsGroup.add(book);
    if (i === 0) {
      const bShadow = makeShadowBlob(0.9, 0.26);
      bShadow.position.set(-3.1, DESK_Y + 0.006, -2.15);
      propsGroup.add(bShadow);
    }
  });
}

/* —— 道具：木质教具盘（五件微缩教具：立方体·四面体·圆柱·圆锥·球，清漆木纹） —— */
{
  const tray = new THREE.Group();
  const trayWood = makeWoodTexture({ base: '#8a643c', dark: '#6a4826', light: '#a8824e', bands: 6, streaks: 70, seed: 23 });
  const trayMat = matStd(0xffffff, { roughness: 0.5 });
  trayMat.map = trayWood;
  const base = mesh(new THREE.BoxGeometry(2.5, 0.09, 0.94), trayMat);
  tray.add(base);
  /* 盘沿：四条圆角挡边 */
  const rimMat = matCoat(0x9a7040, { roughness: 0.45, clearcoat: 0.5 });
  const rims = [
    [0, 0.075, 0.44, 2.5, 0.06, 0.06],
    [0, 0.075, -0.44, 2.5, 0.06, 0.06],
    [-1.22, 0.075, 0, 0.06, 0.06, 0.94],
    [1.22, 0.075, 0, 0.06, 0.06, 0.94],
  ];
  for (const [x, y, z, sx, sy, sz] of rims) {
    const rim = mesh(new THREE.BoxGeometry(sx, sy, sz), rimMat);
    rim.position.set(x, y, z);
    tray.add(rim);
  }
  /* 微缩教具：统一的桐木清漆质感 */
  const toyMat = () => matCoat(0xc89858, { roughness: 0.42, clearcoat: 0.75, clearcoatRoughness: 0.3 });
  const cube = mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), toyMat());
  cube.position.set(-0.88, 0.24, 0);
  const cubeEdges = new THREE.LineSegments(new THREE.EdgesGeometry(cube.geometry, 12), new THREE.LineBasicMaterial({ color: 0x7a5020, transparent: true, opacity: 0.4 }));
  cubeEdges.position.copy(cube.position);
  tray.add(cube, cubeEdges);
  const tetraGeo = new THREE.ConeGeometry(0.2, 0.3, 4, 1);
  const tetra = mesh(tetraGeo, toyMat());
  tetra.position.set(-0.42, 0.24, 0);
  tetra.rotation.y = Math.PI / 4;
  tray.add(tetra);
  const cyl = mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.3, 26), toyMat());
  cyl.position.set(-0.02, 0.24, 0);
  tray.add(cyl);
  const cone = mesh(new THREE.ConeGeometry(0.12, 0.3, 26), toyMat());
  cone.position.set(0.38, 0.24, 0);
  tray.add(cone);
  const ball = mesh(new THREE.SphereGeometry(0.14, 26, 18), toyMat());
  ball.position.set(0.8, 0.235, 0);
  tray.add(ball);
  tray.position.set(3.34, DESK_Y + 0.045, 0.9);
  tray.rotation.y = -0.24;
  propsGroup.add(tray);
  const trayShadow = makeShadowBlob(1.5, 0.3);
  trayShadow.position.set(3.34, DESK_Y + 0.006, 0.9);
  trayShadow.scale.set(1.5, 0.9, 1);
  trayShadow.rotation.z = -0.24;
  propsGroup.add(trayShadow);
  const trayLabel = label('木质教具盘', '#ffd9a8', 0.0032);
  trayLabel.position.set(3.34, DESK_Y + 0.5, 0.9);
  propsGroup.add(trayLabel);
  window.__geoEquipLabels = [trayLabel];
}
/* —— 道具细节：教具盘铭牌 / 铅笔漆面钢印 / 图纸筒标签 / 手写便签 —— */
{
  /* 教具盘正面铭牌 */
  const trayName = canvasTex(256, 96, (ctx, w, h) => {
    ctx.fillStyle = '#e9dcb8';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#7a5426';
    ctx.lineWidth = 4;
    ctx.strokeRect(7, 7, w - 14, h - 14);
    ctx.fillStyle = '#4a3212';
    ctx.font = '700 30px "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('立体几何教具', w / 2, h / 2 - 4);
    ctx.font = '400 17px "PingFang SC", sans-serif';
    ctx.fillText('迷鹿工作室 · 五件套', w / 2, h / 2 + 24);
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = `rgba(122,84,38,${0.04 + Math.random() * 0.06})`;
      ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
    }
  });
  const nameMat = matStd(0xffffff, { roughness: 0.62 });
  nameMat.map = trayName;
  const namePlate = mesh(new THREE.BoxGeometry(0.78, 0.2, 0.012), nameMat);
  namePlate.position.set(3.34 - 0.62, DESK_Y + 0.115, 0.9 + 0.472);
  namePlate.rotation.y = -0.24;
  propsGroup.add(namePlate);
  /* 铅笔中段钢印带 */
  const bandTex = canvasTex(220, 64, (ctx, w, h) => {
    ctx.fillStyle = '#d8932e';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#8a5510';
    ctx.font = '700 34px "Avenir Next", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('GEO · 2H', w / 2, h / 2 + 12);
    ctx.strokeStyle = 'rgba(138,85,16,0.7)';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(10, 6); ctx.lineTo(w - 10, 6); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(10, h - 6); ctx.lineTo(w - 10, h - 6); ctx.stroke();
  });
  const bandMat = matStd(0xffffff, { roughness: 0.5 });
  bandMat.map = bandTex;
  const band = mesh(new THREE.CylinderGeometry(0.0535, 0.0535, 0.16, 24, 1, true), bandMat);
  band.position.set(-2.55, DESK_Y + 0.055, 2.06);
  band.rotation.set(Math.PI / 2, 0, 0.28 + Math.PI / 2);
  propsGroup.add(band);
  /* 图纸筒标签 */
  const tubeLabel = makeLabelTexture(['A2 绘图纸 × 8', '坐标纸 · 网格 5mm'], { accent: '#3d5a72' });
  const tubeLabelMat = matStd(0xffffff, { roughness: 0.6 });
  tubeLabelMat.map = tubeLabel;
  const tubePlate = mesh(new THREE.CylinderGeometry(0.092, 0.092, 0.34, 22, 1, true), tubeLabelMat);
  tubePlate.position.set(2.9, DESK_Y + 0.36, -2.16);
  tubePlate.rotation.z = Math.PI / 2;
  tubePlate.rotation.y = 0.3 + Math.PI / 2;
  propsGroup.add(tubePlate);
  /* 手写便签：欧拉公式（斜贴在纸垫右上角，折角） */
  const noteTex = canvasTex(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#ffe98a';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(210,170,40,0.35)';
    ctx.fillRect(0, 0, w, 26);
    ctx.fillStyle = '#5a4410';
    ctx.font = '600 30px "PingFang SC", cursive';
    ctx.fillText('欧拉公式', 26, 78);
    ctx.font = '700 40px "Avenir Next", sans-serif';
    ctx.fillText('V−E+F=2', 26, 140);
    ctx.font = '400 24px "PingFang SC", cursive';
    ctx.fillText('多面体都成立', 26, 190);
    ctx.strokeStyle = 'rgba(90,68,16,0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(26, 210); ctx.lineTo(150, 210); ctx.stroke();
  });
  const noteMat = matStd(0xffffff, { roughness: 0.85 });
  noteMat.map = noteTex;
  const note = mesh(new THREE.PlaneGeometry(0.6, 0.6), noteMat);
  note.rotation.x = -Math.PI / 2;
  note.rotation.z = 0.18;
  note.position.set(2.72, DESK_Y + 0.036, 1.9);
  propsGroup.add(note);
  const noteFold = mesh(new THREE.PlaneGeometry(0.14, 0.14), matStd(0xf0d070, { roughness: 0.85, side: THREE.DoubleSide }));
  noteFold.rotation.set(-Math.PI / 2 + 0.5, 0, 0.18);
  noteFold.position.set(2.44, DESK_Y + 0.075, 2.14);
  propsGroup.add(noteFold);
}
const equipLabels = window.__geoEquipLabels;
/* 给其余道具补标签（统一收进 equipLabels 供「模型标签」开关管理） */
{
  const l1 = label('六棱铅笔', '#ffd9a8', 0.003); l1.position.set(-2.55, DESK_Y + 0.36, 2.1); propsGroup.add(l1); equipLabels.push(l1);
  const l2 = label('直尺 15 cm', '#ffd9a8', 0.003); l2.position.set(2.42, DESK_Y + 0.3, 2.2); propsGroup.add(l2); equipLabels.push(l2);
  const l3 = label('圆规', '#ffd9a8', 0.003); l3.position.set(-1.24, DESK_Y + 0.32, 1.55); propsGroup.add(l3); equipLabels.push(l3);
  const l4 = label('三角板 · 橡皮', '#ffd9a8', 0.003); l4.position.set(0.6, DESK_Y + 0.3, 2.45); propsGroup.add(l4); equipLabels.push(l4);
  const l5 = label('图纸筒 · 参考书', '#ffd9a8', 0.003); l5.position.set(-0.1, DESK_Y + 0.52, -2.2); propsGroup.add(l5); equipLabels.push(l5);
}

/* ---------------- 材质与结构小件（教学主体装配用） ---------------- */

/* 幽灵面：可透视构造面（科学插画语法：透明 + 双面 + 不写深度） */
function ghostFace(color, opacity = 0.16) {
  const m = matCoat(color, {
    roughness: 0.42, clearcoat: 0.5, transparent: true, opacity,
    side: THREE.DoubleSide, depthWrite: false,
  });
  return m;
}
function edgeLine(geo, color = 0x9fb2c2, opacity = 0.85) {
  return new THREE.LineSegments(
    new THREE.EdgesGeometry(geo, 10),
    new THREE.LineBasicMaterial({ color, transparent: true, opacity }),
  );
}
function jointDot(r = 0.045) {
  return mesh(new THREE.SphereGeometry(r, 14, 10), matStd(PAL.steel, { roughness: 0.25, metalness: 0.88 }));
}
function segLine(a, b, color, opacity = 1, dashed = false) {
  const geo = new THREE.BufferGeometry().setFromPoints([a.clone(), b.clone()]);
  if (dashed) {
    const l = new THREE.Line(geo, new THREE.LineDashedMaterial({ color, transparent: true, opacity, dashSize: 0.09, gapSize: 0.06 }));
    l.computeLineDistances();
    return l;
  }
  return new THREE.Line(geo, new THREE.LineBasicMaterial({ color, transparent: true, opacity }));
}
/* 实心箭头（圆柱杆 + 圆锥头），随向量伸缩 */
function fatArrow(color) {
  const g = new THREE.Group();
  const shaft = mesh(new THREE.CylinderGeometry(0.028, 0.028, 1, 12), matStd(color, { roughness: 0.35, metalness: 0.2 }));
  shaft.name = 'shaft';
  const head = mesh(new THREE.ConeGeometry(0.075, 0.2, 14), matStd(color, { roughness: 0.3, metalness: 0.25 }));
  head.name = 'head';
  g.add(shaft, head);
  g.userData.setVec = (v) => {
    const len = v.length();
    if (len < 1e-4) { g.visible = false; return; }
    g.visible = true;
    const shaftLen = Math.max(0.001, len - 0.2);
    shaft.scale.set(1, shaftLen, 1);
    shaft.position.y = shaftLen / 2;
    head.position.y = shaftLen + 0.1;
    g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v.clone().normalize());
  };
  return g;
}
/* 半透明球（外接/内切/棱切球）：柔面 + 赤道与两条经线圈 */
function ballWire(R, color, opacity = 0.1) {
  const g = new THREE.Group();
  const ball = mesh(new THREE.SphereGeometry(R, 36, 24), new THREE.MeshBasicMaterial({
    color, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide,
  }));
  g.add(ball);
  for (const rot of [[Math.PI / 2, 0], [0, 0], [0, Math.PI / 3], [0, -Math.PI / 3]]) {
    const ring = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(
        Array.from({ length: 73 }, (_, i) => {
          const a = (i / 72) * TAU;
          return new THREE.Vector3(Math.cos(a) * R * 1.001, 0, Math.sin(a) * R * 1.001);
        }),
      ),
      new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.5 }),
    );
    ring.rotation.set(rot[0], rot[1], 0);
    g.add(ring);
  }
  return g;
}

/* ---------------- 教学主体：程序化几何体族（Micro 级：倒角 + 关节 + 棱线 + 幽灵面） ---------------- */

const GEO_COLORS = {
  cube: PAL.cytosol, prism: PAL.chloroplast, pyramid: PAL.golgi, frustum: PAL.vesicle,
  cubeS: PAL.cytosol, tetra: PAL.mitoShell, cylinder: PAL.nucleus, cone: PAL.capsule,
  frustumR: PAL.vacuole, sphere: PAL.granule,
};
/* 凸多面体描述：{ verts, faces }，faces 为顶点索引数组（用于通用截面切割） */
function ngonVerts(n, r, y) {
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * TAU + Math.PI / 2;
    return new THREE.Vector3(Math.cos(a) * r, y, -Math.sin(a) * r);
  });
}
function ngonShape(n, r) {
  const shape = new THREE.Shape();
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + Math.PI / 2;
    const x = Math.cos(a) * r, y = -Math.sin(a) * r;
    i === 0 ? shape.moveTo(x, y) : shape.lineTo(x, y);
  }
  shape.closePath();
  return shape;
}
/* 直/斜棱柱：Extrude 倒角；slant = 顶部水平错位量 */
function buildPrismGeo(n, r, h, slant = 0) {
  const shape = ngonShape(n, r);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: h, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2,
  });
  geo.rotateX(-Math.PI / 2);
  if (slant) {
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      if (y > h * 0.5) pos.setX(i, pos.getX(i) + slant * (y / h));
    }
    geo.computeVertexNormals();
  }
  geo.translate(0, 0, 0);
  return geo;
}
/* 棱锥：底面 n 边形 + 顶点；棱台：上下底相似形 */
function buildPyramidGeo(n, r, h) {
  const shape = ngonShape(n, r);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.001, bevelEnabled: false });
  geo.rotateX(-Math.PI / 2);
  const base = geo.attributes.position.array.slice();
  geo.dispose();
  const verts2d = [];
  for (let i = 0; i < n; i++) verts2d.push([base[i * 3], base[i * 3 + 2]]);
  const positions = [];
  const indices = [];
  const apex = [0, h, 0];
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    positions.push(verts2d[i][0], 0, verts2d[i][1], verts2d[j][0], 0, verts2d[j][1], apex[0], apex[1], apex[2]);
    const b = i * 3;
    indices.push(b, b + 1, b + 2);
  }
  /* 底面扇形三角化 */
  const cx = 0, cz = 0;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    positions.push(cx, 0, cz, verts2d[j][0], 0, verts2d[j][1], verts2d[i][0], 0, verts2d[i][1]);
    const b = n * 3 + i * 3;
    indices.push(b, b + 1, b + 2);
  }
  const geo2 = new THREE.BufferGeometry();
  geo2.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
  geo2.setIndex(indices);
  geo2.computeVertexNormals();
  return geo2;
}
function buildFrustumGeo(n, r1, r2, h) {
  const positions = [];
  const indices = [];
  const bot = ngonVerts(n, r1, 0);
  const top = ngonVerts(n, r2, h);
  const pushV = (v) => positions.push(v.x, v.y, v.z);
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    /* 侧面两三角 */
    [bot[i], bot[j], top[j], top[i]].forEach(pushV);
    const b = i * 4;
    indices.push(b, b + 1, b + 2, b, b + 2, b + 3);
  }
  /* 上下底面 */
  for (const [ring, flip] of [[bot, false], [top, true]]) {
    const start = positions.length / 3;
    ring.forEach(pushV);
    const ci = positions.length / 3;
    pushV(new THREE.Vector3(0, flip ? h : 0, 0));
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      if (!flip) indices.push(ci, start + j, start + i);
      else indices.push(ci, start + i, start + j);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}
/* 通用装配：几何 + 幽灵面 + 棱线 + 顶点关节 */
function assembleSolid(geo, color, opts = {}) {
  const g = new THREE.Group();
  const faceMat0 = opts.opaque ? matCoat(color, { roughness: 0.4, clearcoat: 0.6, transparent: true, opacity: opts.opacity ?? 0.4, side: THREE.DoubleSide, depthWrite: false })
    : ghostFace(color, opts.opacity ?? 0.16);
  const body = mesh(geo, faceMat0);
  g.add(body);
  const edges = edgeLine(geo, opts.edgeColor ?? 0x9fb2c2, opts.edgeOpacity ?? 0.85);
  g.add(edges);
  const joints = new THREE.Group();
  if (opts.joints !== false && opts.verts) {
    for (const v of opts.verts) {
      const d = jointDot(opts.jointR ?? 0.05);
      d.position.copy(v);
      joints.add(d);
    }
    g.add(joints);
  }
  return { group: g, body, edges, joints };
}
/* 旋转体：圆柱 / 圆锥 / 圆台 / 球（Lathe 母线，带口沿倒角细节） */
function buildCylinderGeo(r, h) {
  const pts = [];
  pts.push(new THREE.Vector2(0.001, 0));
  pts.push(new THREE.Vector2(r * 0.985, 0));
  pts.push(new THREE.Vector2(r, 0.03));
  pts.push(new THREE.Vector2(r, h - 0.03));
  pts.push(new THREE.Vector2(r * 0.985, h));
  pts.push(new THREE.Vector2(0.001, h));
  const geo = new THREE.LatheGeometry(pts, 56);
  return geo;
}
function buildConeGeo(r, h) {
  const pts = [
    new THREE.Vector2(0.001, 0),
    new THREE.Vector2(r * 0.985, 0),
    new THREE.Vector2(r, 0.03),
    new THREE.Vector2(r * 0.55, h * 0.62),
    new THREE.Vector2(0.004, h),
  ];
  return new THREE.LatheGeometry(pts, 56);
}
function buildFrustumRGeo(r1, r2, h) {
  const pts = [
    new THREE.Vector2(0.001, 0),
    new THREE.Vector2(r1 * 0.985, 0),
    new THREE.Vector2(r1, 0.03),
    new THREE.Vector2(r2, h - 0.03),
    new THREE.Vector2(r2 * 0.985, h),
    new THREE.Vector2(0.001, h),
  ];
  return new THREE.LatheGeometry(pts, 56);
}
/* 立方体族：给出 8 顶点与 12 棱数据（用于截面/角度章节） */
const CUBE_S = 2;
function cubeData(s = CUBE_S, ox = -s / 2, oz = -s / 2) {
  const V = [];
  for (const y of [0, s]) for (const z of [oz, oz + s]) for (const x of [ox, ox + s]) V.push(new THREE.Vector3(x, y, z));
  /* 索引布局：y(0/1) z(0/1) x(0/1) → idx = y*4 + z*2 + x */
  const E = [];
  for (let i = 0; i < 8; i++) {
    const y = (i >> 2) & 1, z = (i >> 1) & 1, x = i & 1;
    if (x === 0) E.push([i, i + 1]);
    if (z === 0) E.push([i, i + 2]);
    if (y === 0) E.push([i, i + 4]);
  }
  const F = [
    [0, 1, 3, 2], [4, 6, 7, 5],          /* 底 / 顶 */
    [0, 2, 6, 4], [1, 5, 7, 3],          /* z- / z+ */
    [0, 4, 5, 1], [2, 3, 7, 6],          /* x- / x+ */
  ];
  return { verts: V, edges: E, faces: F };
}
const NAMED_CUBE = {
  /* A(0,0,0) B(2,0,0) C(2,0,2) D(0,0,2) 为底面，上标 1 沿 y 轴向上（与场景竖直轴一致） */
  A: new THREE.Vector3(0, 0, 0), B: new THREE.Vector3(CUBE_S, 0, 0),
  C: new THREE.Vector3(CUBE_S, 0, CUBE_S), D: new THREE.Vector3(0, 0, CUBE_S),
  A1: new THREE.Vector3(0, CUBE_S, 0), B1: new THREE.Vector3(CUBE_S, CUBE_S, 0),
  C1: new THREE.Vector3(CUBE_S, CUBE_S, CUBE_S), D1: new THREE.Vector3(0, CUBE_S, CUBE_S),
};
/* 四棱锥 P-ABCD：底边 2、高 2（原版例题同规格） */
const PYR = (() => {
  const s = 2, h = 2;
  const A = new THREE.Vector3(-s / 2, 0, -s / 2), B = new THREE.Vector3(s / 2, 0, -s / 2);
  const C = new THREE.Vector3(s / 2, 0, s / 2), D = new THREE.Vector3(-s / 2, 0, s / 2);
  const P = new THREE.Vector3(0, h, 0);
  return { A, B, C, D, P, verts: [A, B, C, D, P], faces: [[0, 1, 4], [1, 2, 4], [2, 3, 4], [3, 0, 4], [0, 3, 2, 1]] };
})();

/* ---------------- 凸多面体截面切割（平面 × 面求交 + 极角排序） ---------------- */

function cutConvex(model, n, p0) {
  const pts = [];
  const { verts, faces } = model;
  for (const face of faces) {
    for (let i = 0; i < face.length; i++) {
      const a = verts[face[i]];
      const b = verts[face[(i + 1) % face.length]];
      const da = n.dot(a) - n.dot(p0);
      const db = n.dot(b) - n.dot(p0);
      if (Math.abs(da) < 1e-9 && Math.abs(db) < 1e-9) { pts.push(a.clone(), b.clone()); continue; }
      if (da * db < 0) pts.push(onEdge(a, b, da / (da - db)));
    }
  }
  /* 去重（距离阈值） */
  const uniq = [];
  for (const p of pts) {
    if (!uniq.some((q) => q.distanceToSquared(p) < 1e-6)) uniq.push(p);
  }
  if (uniq.length < 3) return [];
  const center = uniq.reduce((s2, p) => s2.add(p), new THREE.Vector3()).multiplyScalar(1 / uniq.length);
  const u = Math.abs(n.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
  const e1 = u.clone().sub(n.clone().multiplyScalar(u.dot(n))).normalize();
  const e2 = n.clone().cross(e1);
  return uniq.sort((a, b) => {
    const aa = Math.atan2(a.clone().sub(center).dot(e2), a.clone().sub(center).dot(e1));
    const bb = Math.atan2(b.clone().sub(center).dot(e2), b.clone().sub(center).dot(e1));
    return aa - bb;
  });
}
/* 截面多边形 → 实体网格（ShapeGeometry 三角化） */
function polyMeshFromPoints(pts, color, opacity = 0.5) {
  const g = new THREE.Group();
  if (pts.length >= 3) {
    const n = pts[0].clone().sub(pts[1]).cross(pts[0].clone().sub(pts[2])).normalize();
    const u = Math.abs(n.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
    const e1 = u.clone().sub(n.clone().multiplyScalar(u.dot(n))).normalize();
    const e2 = n.clone().cross(e1);
    const flat = pts.map((p) => new THREE.Vector2(p.clone().sub(pts[0]).dot(e1), p.clone().sub(pts[0]).dot(e2)));
    const tri = THREE.ShapeUtils.triangulateShape(flat, []);
    const pos = [];
    for (const [a, b, c] of tri) {
      for (const i of [a, b, c]) pos.push(pts[i].x, pts[i].y, pts[i].z);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3));
    geo.computeVertexNormals();
    const fm = mesh(geo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity, side: THREE.DoubleSide, depthWrite: false }));
    g.add(fm);
    const edge = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints([...pts, pts[0].clone()]),
      new THREE.LineBasicMaterial({ color: 0xff6a48, transparent: true, opacity: 1 }),
    );
    g.add(edge);
    for (const p of pts) {
      const d = mesh(new THREE.SphereGeometry(0.035, 10, 8), new THREE.MeshBasicMaterial({ color: 0xff6a48 }));
      d.position.copy(p);
      g.add(d);
    }
  }
  return g;
}
/* 截面形状判名：边数 + 正多边形 / 等腰 / 直角粗判 */
function classifyPoly(pts) {
  if (pts.length < 3) return '未相交';
  const n = pts.length;
  const names = { 3: '三角形', 4: '四边形', 5: '五边形', 6: '六边形' };
  let base = names[n] || `${n} 边形`;
  const sides = [];
  const angles = [];
  for (let i = 0; i < n; i++) {
    const a = pts[i], b = pts[(i + 1) % n], c = pts[(i + 2) % n];
    sides.push(a.distanceTo(b));
    const v1 = b.clone().sub(a).normalize(), v2 = c.clone().sub(b).normalize();
    angles.push(Math.acos(clamp(-v1.dot(v2), -1, 1)) / DEG);
  }
  const sMin = Math.min(...sides), sMax = Math.max(...sides);
  if (n === 3) {
    const angMin = Math.min(...angles);
    if (sMax - sMin < 0.02) return '正三角形';
    if (angMin > 88) return '直角三角形';
    if (angMin > 82) return '等腰直角三角形';
    if (angles.some((a) => a > 90)) return '钝角三角形';
    return '锐角三角形';
  }
  if (n === 4) {
    const [a, b, c, d] = pts;
    const d1 = a.distanceTo(c), d2 = b.distanceTo(d);
    const ang = angles;
    if (sMax - sMin < 0.02 && d1 - d2 < 0.02) return '正方形';
    if (sMax - sMin < 0.02) return '菱形';
    const par = Math.abs(ang.reduce((s2, v) => s2 + v, 0) - 360) < 4;
    const opp1 = Math.abs(sides[0] - sides[2]) < 0.02, opp2 = Math.abs(sides[1] - sides[3]) < 0.02;
    if (par && opp1 && opp2) {
      return ang.some((x) => Math.abs(x - 90) < 2) ? '矩形' : '平行四边形';
    }
    if (opp1 && !opp2) return '等腰梯形';
    return base;
  }
  if (sMax - sMin < 0.02) return `正${base}`;
  return base;
}

/* ================= 章节框架 ================= */

const ctl = createControlsPanel(document.getElementById('controls'));
let hud = null;
let chapterTick = null;
let activeCleanup = null;
let autoSpin = false;
function camTo(pos, target) { app.setCamera(pos, target); }
function setHudRows(rows) {
  const wrap = document.getElementById('lcData');
  if (hud) { hud.el.remove(); hud = null; }
  if (rows && rows.length) {
    hud = makeHUD(wrap, rows);
    rows.forEach(([k]) => hud.set(k, '–'));
  }
}
function hset(key, text) { if (hud) hud.set(key, text); }

/* 表面积 / 体积解析式（按当前参数数值求值） */
function calcSV(kind, p) {
  const { n = 4, r = 1, rTop = 0.5, h = 2, slant = 0 } = p;
  if (kind === 'cube') { const s2 = r * 2; return { S: 6 * s2 * s2, V: s2 ** 3 }; }
  if (kind === 'tetra') { const a = r * Math.sqrt(3); return { S: Math.sqrt(3) * a * a, V: Math.sqrt(2) / 12 * a ** 3 }; }
  if (kind === 'prism') {
    const base = 0.5 * n * r * r * Math.sin(TAU / n);
    const sideLen = 2 * r * Math.sin(Math.PI / n);
    return { S: 2 * base + n * sideLen * h, V: base * h };
  }
  if (kind === 'pyramid') {
    const base = 0.5 * n * r * r * Math.sin(TAU / n);
    const apothem = r * Math.cos(Math.PI / n);
    const sl = Math.hypot(apothem, h);
    return { S: base + 0.5 * n * (2 * r * Math.sin(Math.PI / n)) * sl, V: base * h / 3 };
  }
  if (kind === 'frustum') {
    const b1 = 0.5 * n * r * r * Math.sin(TAU / n), b2 = 0.5 * n * rTop * rTop * Math.sin(TAU / n);
    const s1 = 2 * r * Math.sin(Math.PI / n), s2 = 2 * rTop * Math.sin(Math.PI / n);
    const apothem = r * Math.cos(Math.PI / n) - rTop * Math.cos(Math.PI / n);
    const sl = Math.hypot(apothem, h);
    return { S: b1 + b2 + 0.5 * n * (s1 + s2) * sl, V: h / 3 * (b1 + b2 + Math.sqrt(b1 * b2)) };
  }
  if (kind === 'cylinder') return { S: 2 * Math.PI * r * (r + h), V: Math.PI * r * r * h };
  if (kind === 'cone') { const l = Math.hypot(r, h); return { S: Math.PI * r * (r + l), V: Math.PI * r * r * h / 3 }; }
  if (kind === 'frustumR') {
    const l = Math.hypot(r - rTop, h);
    return { S: Math.PI * (r + rTop) * (r + rTop - r + l) + Math.PI * rTop * rTop, V: Math.PI * h / 3 * (r * r + rTop * rTop + r * rTop) };
  }
  if (kind === 'sphere') return { S: 4 * Math.PI * r * r, V: 4 / 3 * Math.PI * r ** 3 };
  return { S: 0, V: 0 };
}

/* ================= 章节 1：几何体认识 ================= */

const SOLID_KINDS = [
  ['prism', '棱柱'], ['pyramid', '棱锥'], ['frustum', '棱台'],
  ['cube', '正方体'], ['tetra', '正四面体'],
  ['cylinder', '圆柱'], ['cone', '圆锥'], ['frustumR', '圆台'], ['sphere', '球'],
];
const SOLID_MAXN = { prism: 8, pyramid: 8, frustum: 8 };

const sk = { kind: 'cube', n: 6, h: 2, r: 1.1, rTop: 0.55, slant: false };

const secSolids = {
  id: 'solids', title: '几何体认识',
  html: `<p>几何体分两大族：<b>多面体</b>（棱柱、棱锥、棱台……由平面围成，有棱有角）与<b>旋转体</b>（圆柱、圆锥、圆台、球——平面图形绕轴旋转一周扫出来，表面含曲面）。</p>
<p>拖动旋转观察时留意立体图形的画法约定：背对视线的棱会自动画成<b>虚线</b>，看得见的棱用实线——这是立体几何的通用画法。</p>
<p>多面体有一条著名规律——<span class="hl">欧拉公式 V − E + F = 2</span>（顶点数减棱数加面数恒等于 2）。切换底面边数、拖动高与尺寸，核对每种几何体的计数与表面积、体积。</p>
<p>旋转体的面没有「棱」，转动时轮廓线随视角变化，所以计数约定不同，欧拉公式只对简单多面体成立。</p>`,
  enter() {
    clearGroup(world);
    autoSpin = false;
    world.rotation.y = 0;
    camTo([4.6, 3.2, 5.8], [0, 1.05, 0]);
    demoShadow.scale.set(1.6, 1, 1.6);
    let current = null;
    const rebuild = () => {
      clearGroup(world);
      const kind = sk.kind;
      const col = GEO_COLORS[kind] || PAL.cytosol;
      let geo, verts = [];
      const p = { n: sk.n, r: sk.r, rTop: sk.rTop, h: sk.h, slant: sk.slant ? 0.8 : 0 };
      if (kind === 'cube') { const s2 = sk.r * 2; geo = new THREE.BoxGeometry(s2, s2, s2); geo.translate(0, s2 / 2, 0); const d = cubeData(s2, -s2 / 2, -s2 / 2); verts = d.verts; }
      else if (kind === 'tetra') {
        const r0 = sk.r;
        const base = ngonVerts(3, r0, 0);
        const hh = Math.sqrt(2 / 3) * (r0 * Math.sqrt(3));
        const apex = new THREE.Vector3(0, hh, 0);
        const positions = [];
        const idx = [];
        for (let i = 0; i < 3; i++) {
          const j = (i + 1) % 3;
          [base[i], base[j], apex].forEach((v) => positions.push(v.x, v.y, v.z));
          idx.push(i * 3, i * 3 + 1, i * 3 + 2);
        }
        [base[0], base[1], base[2]].forEach((v) => positions.push(v.x, v.y, v.z));
        idx.push(9, 10, 11);
        geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
        geo.setIndex(idx);
        geo.computeVertexNormals();
        verts = [...base, apex];
      }
      else if (kind === 'prism') { geo = buildPrismGeo(sk.n, sk.r, sk.h, p.slant); verts = [...ngonVerts(sk.n, sk.r, 0), ...ngonVerts(sk.n, sk.r, sk.h).map((v) => v.clone().setX(v.x + p.slant))]; }
      else if (kind === 'pyramid') { geo = buildPyramidGeo(sk.n, sk.r, sk.h); verts = [...ngonVerts(sk.n, sk.r, 0), new THREE.Vector3(0, sk.h, 0)]; }
      else if (kind === 'frustum') { geo = buildFrustumGeo(sk.n, sk.r, sk.rTop, sk.h); verts = [...ngonVerts(sk.n, sk.r, 0), ...ngonVerts(sk.n, sk.rTop, sk.h)]; }
      else if (kind === 'cylinder') geo = buildCylinderGeo(sk.r, sk.h);
      else if (kind === 'cone') geo = buildConeGeo(sk.r, sk.h);
      else if (kind === 'frustumR') geo = buildFrustumRGeo(sk.r, sk.rTop, sk.h);
      else geo = new THREE.SphereGeometry(sk.r, 48, 30), geo.translate(0, sk.r, 0);
      const asm = assembleSolid(geo, col, { verts, jointR: 0.045, opacity: kind === 'cube' ? 0.2 : 0.17 });
      world.add(asm.group);
      /* 画法约定：看不见的棱画成虚线——按视线把棱分拣为可见（实线）/ 背面（虚线）两组，随视角实时重分 */
      asm.group.remove(asm.edges);
      const rawPos = asm.edges.geometry.attributes.position;
      const edgePairs = [];
      for (let i = 0; i < rawPos.count; i += 2) {
        edgePairs.push([
          new THREE.Vector3().fromBufferAttribute(rawPos, i),
          new THREE.Vector3().fromBufferAttribute(rawPos, i + 1),
        ]);
      }
      asm.edges.geometry.dispose();
      const visLine = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0xa8bccb, transparent: true, opacity: 0.95 }));
      const hidLine = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineDashedMaterial({ color: 0x9fb2c2, transparent: true, opacity: 0.55, dashSize: 0.13, gapSize: 0.09 }));
      visLine.frustumCulled = false;
      hidLine.frustumCulled = false;
      asm.group.add(visLine, hidLine);
      const edgeRay = new THREE.Raycaster();
      const lastCam = new THREE.Vector3(1e9, 1e9, 1e9);
      let lastRot = 1e9;
      chapterTick = () => {
        const cp = app.camera.position;
        if (cp.distanceToSquared(lastCam) < 1e-6 && Math.abs(world.rotation.y - lastRot) < 1e-6) return;
        lastCam.copy(cp);
        lastRot = world.rotation.y;
        asm.group.updateMatrixWorld(true);
        const visPts = [], hidPts = [];
        const mid = new THREE.Vector3();
        for (const [a, b] of edgePairs) {
          mid.addVectors(a, b).multiplyScalar(0.5).applyMatrix4(asm.group.matrixWorld);
          const dir = mid.clone().sub(cp);
          const len = dir.length();
          edgeRay.set(cp, dir.multiplyScalar(1 / (len || 1)));
          edgeRay.far = len - 0.05;
          (edgeRay.intersectObject(asm.body, false).length ? hidPts : visPts).push(a, b);
        }
        visLine.geometry.dispose();
        hidLine.geometry.dispose();
        visLine.geometry = new THREE.BufferGeometry().setFromPoints(visPts);
        hidLine.geometry = new THREE.BufferGeometry().setFromPoints(hidPts);
        hidLine.computeLineDistances();
      };
      const cnt = SOLID_MAXN[kind]
        ? { V: kind === 'pyramid' ? sk.n + 1 : sk.n * 2, E: kind === 'pyramid' ? sk.n * 2 : sk.n * 3, F: kind === 'pyramid' ? sk.n + 1 : sk.n + 2 }
        : kind === 'cube' ? { V: 8, E: 12, F: 6 }
        : kind === 'tetra' ? { V: 4, E: 6, F: 4 }
        : kind === 'cylinder' ? { V: 0, E: 2, F: 3 }
        : kind === 'cone' ? { V: 1, E: 1, F: 2 }
        : kind === 'frustumR' ? { V: 0, E: 2, F: 3 }
        : { V: 0, E: 0, F: 1 };
      const poly = ['prism', 'pyramid', 'frustum', 'cube', 'tetra'].includes(kind);
      const sv = calcSV(kind, sk.r !== undefined ? { n: sk.n, r: sk.r, rTop: sk.rTop, h: sk.h } : p);
      current = { cnt, poly, sv };
      hset('kind', SOLID_KINDS.find(([k]) => k === kind)[1] + (kind === 'prism' && sk.slant ? '（斜）' : ''));
      hset('vef', poly ? `V=${cnt.V}  E=${cnt.E}  F=${cnt.F}` : '旋转体（含曲面）');
      hset('euler', poly ? `V − E + F = ${cnt.V} − ${cnt.E} + ${cnt.F} = ${cnt.V - cnt.E + cnt.F} ✓` : '计数约定不同，公式不适用');
      hset('sv', `S ≈ ${sv.S.toFixed(2)}   V ≈ ${sv.V.toFixed(2)}`);
    };
    setHudRows([['kind', '当前几何体'], ['vef', '顶点 · 棱 · 面'], ['euler', '欧拉公式'], ['sv', '表面积 / 体积'], ['tip', '提示']]);
    rebuild();
    hset('tip', '拖动滑杆换尺寸 · 空白处拖拽旋转视角');
    ctl.seg({ options: SOLID_KINDS.map(([k, name]) => ({ label: name, value: k })), value: sk.kind, onChange: (v) => { sk.kind = v; rebuildControls(); rebuild(); } });
    const rebuildControls = () => {
      ctl.clear();
      ctl.seg({ options: SOLID_KINDS.map(([k, name]) => ({ label: name, value: k })), value: sk.kind, onChange: (v) => { sk.kind = v; rebuildControls(); rebuild(); } });
      ctl.sep();
      if (SOLID_MAXN[sk.kind]) {
        ctl.slider({ label: '底面边数 n', min: 3, max: 8, step: 1, value: sk.n, fmt: (v) => `${v} 边`, onInput: (v) => { sk.n = v; rebuild(); } });
      }
      if (sk.kind === 'prism') {
        ctl.toggle({ label: '斜棱柱（ otherwise 直棱柱）', value: sk.slant, onChange: (v) => { sk.slant = v; rebuild(); } });
      }
      if (sk.kind === 'frustum' || sk.kind === 'frustumR') {
        ctl.slider({ label: '上底 / 下底比', min: 0.2, max: 0.95, step: 0.05, value: sk.rTop / sk.r, fmt: (v) => v.toFixed(2), onInput: (v) => { sk.rTop = sk.r * v; rebuild(); } });
      }
      if (['cube', 'tetra', 'sphere'].includes(sk.kind)) {
        ctl.slider({ label: '尺寸（棱长 / 半径）', min: 0.6, max: 2.2, step: 0.05, value: sk.r, fmt: (v) => v.toFixed(2), onInput: (v) => { sk.r = v; rebuild(); } });
      } else {
        ctl.slider({ label: '高 h', min: 0.8, max: 3.2, step: 0.05, value: sk.h, fmt: (v) => v.toFixed(2), onInput: (v) => { sk.h = v; rebuild(); } });
        if (sk.kind !== 'cone') ctl.slider({ label: '底面半径 / 外接圆半径', min: 0.5, max: 1.8, step: 0.05, value: sk.r, fmt: (v) => v.toFixed(2), onInput: (v) => { sk.r = v; rebuild(); } });
        else ctl.slider({ label: '底面半径 r₀', min: 0.5, max: 1.8, step: 0.05, value: sk.r, fmt: (v) => v.toFixed(2), onInput: (v) => { sk.r = v; rebuild(); } });
      }
      ctl.sep();
      ctl.toggle({ label: '自动旋转', value: false, onChange: (v) => { autoSpin = v; } });
    };
    rebuildControls();
    rebuild();
  },
};

/* ================= 章节 2：展开与折叠 ================= */

/** 枚举全部自由六连方（35 种），交给折叠引擎验证 → 折得合的恰为 11 种 */
function candidateNets() {
  const seen = new Set();
  const shapes = [];
  const key = (cells) => {
    const sym = [[1, 0, 0, 1], [-1, 0, 0, 1], [1, 0, 0, -1], [-1, 0, 0, -1], [0, 1, 1, 0], [0, -1, 1, 0], [0, 1, -1, 0], [0, -1, -1, 0]];
    let best = null;
    for (const s of sym) {
      const pts = cells.map(([x, y]) => [s[0] * x + s[1] * y, s[2] * x + s[3] * y]);
      const mx = Math.min(...pts.map((p) => p[0]));
      const my = Math.min(...pts.map((p) => p[1]));
      const k = pts.map(([x, y]) => (x - mx) + ',' + (y - my)).sort().join(';');
      if (best === null || k < best) best = k;
    }
    return best;
  };
  const grow = (cells) => {
    const k = key(cells);
    if (seen.has(k)) return;
    seen.add(k);
    if (cells.length === 6) { shapes.push(cells); return; }
    for (const [cx, cy] of cells) {
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const q = [cx + dx, cy + dy];
        if (!cells.some((p) => p[0] === q[0] && p[1] === q[1])) grow([...cells, q]);
      }
    }
  };
  grow([[0, 0]]);
  return shapes;
}
function validateNet(cells) {
  const key = (p) => p[0] + ',' + p[1];
  const set = new Map(cells.map((p) => [key(p), p]));
  const base = cells[0];
  const parent = new Map([[key(base), null]]);
  const queue = [base];
  while (queue.length) {
    const p = queue.shift();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const q = [p[0] + dx, p[1] + dy];
      if (set.has(key(q)) && !parent.has(key(q))) {
        parent.set(key(q), { from: p, dir: [dx, dy] });
        queue.push(q);
      }
    }
  }
  if (parent.size !== 6) return null;
  const S = 1;
  const state = new Map();
  state.set(key(base), { pos: new THREE.Vector3(0, 0, 0), quat: new THREE.Quaternion() });
  const order = [base];
  while (order.length) {
    const p = order.shift();
    for (const [k, info] of parent) {
      if (info && key(info.from) === key(p) && !state.has(k)) {
        const q = set.get(k);
        const dir = info.dir;
        const ps = state.get(key(p));
        const hingeLocal = new THREE.Vector3(dir[0] * S / 2, dir[1] * S / 2, 0).applyQuaternion(ps.quat).add(ps.pos);
        let quat;
        if (dir[1] === 1) quat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2);
        else if (dir[1] === -1) quat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);
        else if (dir[0] === 1) quat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI / 2);
        else quat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);
        quat.premultiply(ps.quat);
        const centerOffset = new THREE.Vector3(dir[0] * S / 2, dir[1] * S / 2, 0).applyQuaternion(quat);
        state.set(k, { pos: hingeLocal.clone().add(centerOffset), quat });
        order.push(q);
      }
    }
  }
  const normals = new Set();
  const centers = [];
  for (const [, s] of state) {
    const n = new THREE.Vector3(0, 0, 1).applyQuaternion(s.quat);
    normals.add([+n.x.toFixed(2), +n.y.toFixed(2), +n.z.toFixed(2)].join('|'));
    centers.push(s.pos.clone());
  }
  if (normals.size !== 6) return false;
  const c0 = centers[0];
  const d2 = centers.slice(1).map((c) => +c.distanceToSquared(c0).toFixed(3));
  return d2.every((d) => [0.5, 1].includes(d));
}
function canonicalGrid(cells) {
  const sym = [[1, 0, 0, 1], [0, 1, -1, 0], [-1, 0, 0, -1], [0, -1, 1, 0]];
  let best = null;
  for (const [a, b, c, d] of sym) {
    const pts = cells.map(([x, y]) => [a * x + b * y, c * x + d * y]);
    const mx = Math.min(...pts.map((p) => p[0]));
    const my = Math.min(...pts.map((p) => p[1]));
    const key = pts.map(([x, y]) => `${x - mx},${y - my}`).sort().join(';');
    if (best === null || key < best) best = key;
  }
  return best;
}
const NETS = (() => {
  const seen = new Set();
  const out = [];
  candidateNets().forEach((cells) => {
    if (!validateNet(cells)) return;
    const canon = canonicalGrid(cells);
    if (seen.has(canon)) return;
    seen.add(canon);
    out.push(cells);
  });
  return out;
})();
/* 伪展开图样例（折叠会重叠）：从无效六连方中取 3 种 */
const NETS_BAD = (() => {
  const seen = new Set();
  const out = [];
  candidateNets().forEach((cells) => {
    if (validateNet(cells)) return;
    const canon = canonicalGrid(cells);
    if (seen.has(canon)) return;
    seen.add(canon);
    out.push(cells);
  });
  /* 挑 3 个形态有代表性的（含田字形 / 凹形 / 五连加挂） */
  return out.filter((c, i) => i % Math.max(1, Math.floor(out.length / 3)) === 0).slice(0, 3);
})();
const NET_TYPE_NAME = (cells) => {
  /* 按行分布命名：一四一 / 二三一 / 二二二 / 三三 */
  const rows = new Map();
  for (const [x, y] of cells) rows.set(y, (rows.get(y) || 0) + 1);
  const counts = [...rows.values()].sort((a, b) => b - a).join('');
  return { '41': '一四一', '14': '一四一', '321': '二三一', '312': '二三一', '231': '二三一', '213': '二三一', '222': '二二二', '33': '三三' }[counts] || counts;
};

function buildNetGroup(cells, opts = {}) {
  const S = 1;
  const root = new THREE.Group();
  const key = (p) => p[0] + ',' + p[1];
  const set = new Map(cells.map((p) => [key(p), p]));
  const parent = new Map();
  const base = cells.reduce((m, p) => (p[1] < m[1] || (p[1] === m[1] && p[0] < m[0]) ? p : m), cells[0]);
  parent.set(key(base), null);
  const queue = [base];
  while (queue.length) {
    const p = queue.shift();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const q = [p[0] + dx, p[1] + dy];
      if (set.has(key(q)) && !parent.has(key(q))) {
        parent.set(key(q), { from: p, dir: [dx, dy] });
        queue.push(q);
      }
    }
  }
  const depth = new Map([[key(base), 0]]);
  [...parent.keys()].forEach(() => {
    parent.forEach((info, k) => {
      if (info && depth.has(key(info.from)) && !depth.has(k)) depth.set(k, depth.get(key(info.from)) + 1);
    });
  });
  const pivots = new Map();
  const faceGeo = new THREE.BoxGeometry(S, S, 0.045);
  const makeFace = (p, color) => {
    const pivot = new THREE.Group();
    const faceCol = ghostFace(color, opts.faceOpacity ?? 0.3);
    const m = mesh(faceGeo, faceCol);
    const edges = edgeLine(faceGeo, 0xa8bccb, 0.9);
    pivot.add(m, edges);
    pivot.userData.mesh = m;
    return pivot;
  };
  const buildPivot = (p) => {
    const k = key(p);
    if (pivots.has(k)) return pivots.get(k);
    const info = parent.get(k);
    const pivot = makeFace(p, opts.colors ? opts.colors[depth.get(k) % opts.colors.length] : PAL.cytosol);
    pivot.userData.dir = info ? info.dir : null;
    pivot.userData.depth = depth.get(k);
    if (info) {
      const parentNode = buildPivot(info.from);
      const hinge = new THREE.Group();
      hinge.position.set(info.dir[0] * S / 2, info.dir[1] * S / 2, 0);
      hinge.add(pivot);
      pivot.children.forEach((ch) => { ch.position.set(info.dir[0] * S / 2, info.dir[1] * S / 2, 0); });
      parentNode.add(hinge);
      pivot.userData.hinge = hinge;
    }
    pivots.set(k, pivot);
    return pivot;
  };
  cells.forEach(buildPivot);
  root.add(pivots.get(key(base)));
  return { root, pivots, depth, key };
}
function applyFold(folded, t) {
  const { pivots } = folded;
  pivots.forEach((pivot) => {
    const { dir, depth = 0, hinge } = pivot.userData;
    if (!dir || !hinge) return;
    const local = clamp(t * 1.55 - depth * 0.18, 0, 1);
    const ang = (1 - Math.pow(1 - local, 3)) * Math.PI / 2;
    if (dir[1] === 1) hinge.rotation.x = ang;
    else if (dir[1] === -1) hinge.rotation.x = -ang;
    else if (dir[0] === 1) hinge.rotation.y = -ang;
    else hinge.rotation.y = ang;
  });
}
/* 伪展开图折满后：法向重合的面标红 */
function markOverlaps(folded) {
  const groups = new Map();
  folded.pivots.forEach((pivot) => {
    const { dir, hinge } = pivot.userData;
    if (!dir || !hinge) return;
    const q = hinge.quaternion ? hinge.worldQuaternion(new THREE.Quaternion()) : null;
    const n = new THREE.Vector3(0, 0, 1).applyQuaternion(q || new THREE.Quaternion()).applyAxisAngle(new THREE.Vector3(0, 0, 1), 0);
    const kk = [Math.round(n.x * 4) / 4, Math.round(n.y * 4) / 4, Math.round(n.z * 4) / 4].join('|');
    if (!groups.has(kk)) groups.set(kk, []);
    groups.get(kk).push(pivot);
  });
  let overlap = 0;
  groups.forEach((list) => {
    if (list.length > 1) {
      overlap += list.length;
      list.forEach((p) => { p.userData.mesh.material.color.set(0xd64a2e); p.userData.mesh.material.opacity = 0.62; });
    }
  });
  return overlap;
}

const nf = { mode: 'solid', solidKind: 'cube', which: 0, bad: 0, t: 1, playing: false, playDir: -1, path: 'cube', pathT: 0, pathPlaying: false };
const NET_COLORS = [PAL.cytosol, PAL.chloroplast, PAL.golgi, PAL.nucleus, PAL.capsule, PAL.mitoShell];

/* 立方体标准展开（一四一）作为「几何体展开」的演示网格 */
const NET_STD = [[0, 1], [1, 1], [2, 1], [3, 1], [1, 0], [1, 2]];

/* 侧面带展开形变几何：wrapFn 给卷曲坐标，flatFn 给展开坐标，按 t 插值 */
function buildUnrollBand(wrapFn, flatFn, rows, cols, mat, h) {
  const geo = new THREE.BufferGeometry();
  const count = (rows + 1) * (cols + 1);
  const base = new Float32Array(count * 3);
  const flat = new Float32Array(count * 3);
  const idx = [];
  let k = 0;
  for (let r2 = 0; r2 <= rows; r2++) {
    for (let c = 0; c <= cols; c++) {
      const u = c / cols, v = r2 / rows;
      const p = wrapFn(u, v);
      base[k * 3] = p.x; base[k * 3 + 1] = p.y; base[k * 3 + 2] = p.z;
      const f = flatFn(u, v);
      flat[k * 3] = f.x; flat[k * 3 + 1] = f.y; flat[k * 3 + 2] = f.z;
      k++;
    }
  }
  for (let r2 = 0; r2 < rows; r2++) {
    for (let c = 0; c < cols; c++) {
      const a = r2 * (cols + 1) + c;
      idx.push(a, a + cols + 1, a + cols + 2, a, a + cols + 2, a + 1);
    }
  }
  geo.setAttribute('position', new THREE.BufferAttribute(base.slice(), 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  const m = mesh(geo, mat);
  m.userData.morph = { base, flat, geo };
  return m;
}
function applyUnroll(m, t) {
  const { base, flat, geo } = m.userData.morph;
  const pos = geo.attributes.position;
  const e = 1 - Math.pow(1 - clamp(t, 0, 1), 2.2);
  for (let i = 0; i < pos.count; i++) {
    pos.setXYZ(i,
      base[i * 3] + (flat[i * 3] - base[i * 3]) * e,
      base[i * 3 + 1] + (flat[i * 3 + 1] - base[i * 3 + 1]) * e,
      base[i * 3 + 2] + (flat[i * 3 + 2] - base[i * 3 + 2]) * e);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
}

const secNet = {
  id: 'net', title: '展开与折叠',
  html: `<p>把几何体的表面沿某些棱剪开摊平，得到<b>展开图</b>——表面积就是展开图的面积。圆柱侧面展开是矩形，圆锥侧面展开是扇形。</p>
<p>正方体共有 <span class="hl">11 种</span>展开图：「一四一」型 6 种、「二三一」型 3 种、「二二二」与「三三」型各 1 种。六连方一共有 35 种，本实验的每一种展开图都经过程序自动折叠验证；伪展开图折到最后会有面重叠（标红）。</p>
<p>求表面上两点之间的<b>最短路程</b>：把折线经过的面摊到同一张平面里，两点之间直线最短。</p>`,
  enter() {
    clearGroup(world);
    autoSpin = false;
    world.rotation.y = 0;
    demoShadow.scale.set(1.4, 1, 1.4);
    Object.assign(nf, { t: 1, playing: false, which: 0, bad: 0, pathT: 0, pathPlaying: false });
    camTo([3.4, 2.9, 4.6], [0, 1.1, 0]);
    const state = { net: null, refCube: null, solid: null, caps: null, kindNote: '' };
    const rebuild = () => {
      clearGroup(world);
      state.net = null; state.solid = null; state.caps = null;
      if (nf.mode === 'solid') buildSolidUnfold();
      else if (nf.mode === 'nets') buildNets();
      else buildPath();
    };
    /* —— 模式一：几何体展开（五种代表几何体的侧面展开动画） —— */
    const UNFOLD_KINDS = [['cube', '正方体'], ['prism6', '六棱柱'], ['pyramid', '四棱锥'], ['cylinder', '圆柱'], ['cone', '圆锥']];
    const UNFOLD_NOTES = {
      cube: '正方体：沿 7 条棱剪开，得到「一四一」型展开图。',
      prism6: '直棱柱：侧面摊平是一个矩形，一条边正好等于底面周长。',
      pyramid: '棱锥：侧面是围绕底面的几个全等的等腰三角形。',
      cylinder: '圆柱：侧面展开图是矩形，长 = 底面周长 2πr，宽 = 高 h。',
      cone: '圆锥：侧面展开图是扇形，扇形半径即母线 l，弧长恰为底面周长 2πr。',
    };
    function buildSolidUnfold() {
      const kind = nf.solidKind;
      state.kindNote = UNFOLD_NOTES[kind];
      if (kind === 'cube') {
        state.net = buildNetGroup(NET_STD, { colors: NET_COLORS, faceOpacity: 0.34 });
        state.net.root.position.set(-1.5, 1.45, 0);
        world.add(state.net.root);
        applyFold(state.net, 1);
      } else if (kind === 'prism6') {
        const r = 0.72, h = 1.7, n = 6;
        const wrapFn = (u, v) => {
          const a = u * TAU;
          /* 六棱柱半径轮廓：每面内按余弦鼓出 */
          const f = Math.abs(u * n - Math.floor(u * n) - 0.5) * (TAU / n);
          const rr = r / Math.cos(f);
          return new THREE.Vector3(Math.cos(a) * rr, v * h, Math.sin(a) * rr);
        };
        const flatFn = (u, v) => new THREE.Vector3(u * n * r - n * r / 2, v * h, 0);
        const band = buildUnrollBand(wrapFn, flatFn, 8, 48, ghostFace(PAL.chloroplast, 0.34), h);
        band.position.y = 0;
        world.add(band);
        state.solid = { band };
        /* 上下底面铰链在第一列侧面上下边 */
        const capGeo = buildPrismGeo(n, r, 0.04);
        const mkCap = (flip) => {
          const pivot = new THREE.Group();
          const cap = mesh(capGeo, ghostFace(PAL.golgi, 0.4));
          cap.position.y = flip ? h - 0.02 : 0.02;
          pivot.add(cap);
          pivot.position.set(Math.cos(Math.PI / 2) * 0, flip ? h : 0, -r);
          pivot.rotation.y = 0;
          world.add(pivot);
          return pivot;
        };
        state.caps = { list: [mkCap(false), mkCap(true)], h };
      } else if (kind === 'pyramid') {
        const r = 1.05, h = 1.9, n = 4;
        const basePts = ngonVerts(n, r, 0);
        const apex = new THREE.Vector3(0, h, 0);
        const basePlate = mesh(buildFrustumGeo(n, r, r, 0.03), ghostFace(PAL.golgi, 0.45));
        world.add(basePlate);
        const sides = [];
        for (let i = 0; i < n; i++) {
          const j = (i + 1) % n;
          const a = basePts[i], b = basePts[j];
          const pivot = new THREE.Group();
          pivot.position.copy(a);
          const triGeo = new THREE.BufferGeometry();
          const ab = b.clone().sub(a);
          const dirX = ab.clone().normalize();
          const len = ab.length();
          const slant = apex.clone().sub(a);
          const along = slant.dot(dirX);
          const upv = Math.sqrt(Math.max(0.01, slant.lengthSq() - along * along));
          triGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
            0, 0, 0, len, 0, 0, along, upv, 0,
          ]), 3));
          triGeo.setIndex([0, 1, 2]);
          triGeo.computeVertexNormals();
          const tri = mesh(triGeo, ghostFace(PAL.mitoShell, 0.4));
          pivot.add(tri);
          pivot.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), dirX);
          pivot.userData.axis = dirX.clone();
          pivot.userData.open = false;
          world.add(pivot);
          sides.push(pivot);
        }
        state.solid = { sides };
      } else if (kind === 'cylinder' || kind === 'cone') {
        const r = kind === 'cylinder' ? 0.72 : 0.82, h = kind === 'cylinder' ? 1.8 : 1.9;
        let band;
        if (kind === 'cylinder') {
          band = buildUnrollBand((u, v) => new THREE.Vector3(Math.cos(u * TAU) * r, v * h, Math.sin(u * TAU) * r),
            (u, v) => new THREE.Vector3(u * TAU * r - TAU * r / 2, v * h, 0), 8, 56, ghostFace(PAL.nucleus, 0.36), h);
        } else {
          const l = Math.hypot(r, h);
          const span = TAU * r / l;
          band = buildUnrollBand((u, v) => new THREE.Vector3(Math.cos(u * TAU) * r * (1 - v), v * h, Math.sin(u * TAU) * r * (1 - v)),
            (u, v) => {
              /* 扇形展开：顶点固定在 (0,h)，底缘扫出弧 */
              const ang = u * span - span / 2;
              const rad = (1 - v) * l;
              return new THREE.Vector3(Math.sin(ang) * rad, h - Math.cos(ang) * rad, 0);
            }, 8, 48, ghostFace(PAL.capsule, 0.4), h);
        }
        band.position.y = kind === 'cylinder' ? 0 : 0;
        if (kind === 'cone') band.position.y = 0.02;
        world.add(band);
        state.solid = { band };
        /* 底面圆片铰链翻平 */
        const capGeo = kind === 'cylinder' ? buildCylinderGeo(r, 0.03) : buildConeGeo(r, 0.03);
        const cap = mesh(capGeo, ghostFace(kind === 'cylinder' ? PAL.nucleus : PAL.capsule, 0.42));
        const capPivot = new THREE.Group();
        capPivot.add(cap);
        capPivot.position.set(0, 0.016, r);
        world.add(capPivot);
        state.caps = { list: [capPivot], h };
      }
      applyUnfold();
    }
    function applyUnfold() {
      const t = nf.t;
      const kind = nf.solidKind;
      if (kind === 'cube' && state.net) applyFold(state.net, t);
      if (kind === 'prism6' && state.solid?.band) applyUnroll(state.solid.band, t);
      if (kind === 'cylinder' && state.solid?.band) applyUnroll(state.solid.band, t);
      if (kind === 'cone' && state.solid?.band) applyUnroll(state.solid.band, t);
      if (state.caps) {
        state.caps.list.forEach((piv, i) => {
          piv.rotation.x = (1 - t) * Math.PI / 2 * (i === 0 ? -1 : 1);
        });
      }
      if (kind === 'pyramid' && state.solid?.sides) {
        state.solid.sides.forEach((piv) => {
          const axis = piv.userData.axis;
          /* 侧三角形绕底棱（铰链轴）向下翻开 */
          const q0 = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 0, 0), axis);
          const fold = new THREE.Quaternion().setFromAxisAngle(axis, -(1 - t) * Math.PI * 0.5);
          piv.quaternion.copy(q0).multiply(fold);
        });
      }
      if (kind === 'cone' && state.solid?.band) {
        /* 扇形展开带 y 平移补偿：展开态整体落回纸面 */
        const l = Math.hypot(0.82, 1.9);
        state.solid.band.position.y = 0.02 + t * (l * 0.0);
      }
    }
    /* —— 模式二：展开图对照（11 真 + 3 伪） —— */
    function buildNets() {
      const isBad = nf.which >= NETS.length;
      const cells = isBad ? NETS_BAD[nf.which - NETS.length] : NETS[nf.which];
      state.net = buildNetGroup(cells, { colors: NET_COLORS, faceOpacity: isBad ? 0.34 : 0.3 });
      const cx = cells.reduce((s2, p) => s2 + p[0], 0) / 6;
      const cy = cells.reduce((s2, p) => s2 + p[1], 0) / 6;
      state.net.root.position.set(-cx, -cy + 1.75, 0);
      world.add(state.net.root);
      applyFold(state.net, nf.t);
      if (isBad && nf.t >= 0.99) markOverlaps(state.net);
      if (!state.refCube) {
        state.refCube = new THREE.LineSegments(
          new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)),
          new THREE.LineBasicMaterial({ color: 0x8a99a8, transparent: true, opacity: 0.22 }),
        );
        state.refCube.position.set(0, 1.75, 0);
        world.add(state.refCube);
      }
      hset('main', (isBad ? `伪展开图 ${nf.which - NETS.length + 1} / ${NETS_BAD.length}` : `展开图 ${nf.which + 1} / ${NETS.length}（${NET_TYPE_NAME(cells)}型）`)
        + ` · 折叠 ${Math.round(Math.min(1, nf.t) * 100)}%`);
      hset('aux', isBad
        ? (nf.t >= 0.99 ? '✗ 折不合——重叠的面已标红' : '伪展开图：折到最后会有面重叠')
        : '✓ 可折合成正方体');
      hset('note', isBad ? '换到编号 1~11 观察能折合的真展开图' : '「一四一」6 种 · 「二三一」3 种 · 「二二二」「三三」各 1 种');
    }
    /* —— 模式三：最短路径 —— */
    function buildPath() {
      const markG = new THREE.Group();
      world.add(markG);
      state.markG = markG;
      if (nf.path === 'cube') {
        const s2 = CUBE_S;
        const cd = cubeData(s2, -s2 / 2, -s2 / 2);
        const geo = new THREE.BoxGeometry(s2, s2, s2);
        geo.translate(0, s2 / 2, 0);
        const asm = assembleSolid(geo, PAL.cytosol, { opacity: 0.13, joints: false, edgeOpacity: 0.5 });
        world.add(asm.group);
        const A = new THREE.Vector3(-s2 / 2, 0, -s2 / 2);
        const C1 = new THREE.Vector3(-s2 / 2, s2, -s2 / 2).setX(s2 / 2).setZ(s2 / 2);
        /* 表面折线：底面 A→E，右侧面 E→C₁ */
        const E = new THREE.Vector3(s2 / 2, 0, 0);
        markG.add(segLine(A, E, 0xff6a48, 1));
        markG.add(segLine(E, C1, 0xff6a48, 1));
        for (const [p, name] of [[A, 'A'], [C1, 'C₁'], [E, 'E']]) {
          const d = mesh(new THREE.SphereGeometry(0.05, 12, 10), new THREE.MeshBasicMaterial({ color: 0xff6a48 }));
          d.position.copy(p);
          markG.add(d);
          const l = label(name, '#ffb59e', 0.004);
          l.position.copy(p).add(new THREE.Vector3(0, name === 'C₁' ? 0.24 : -0.22, 0));
          markG.add(l);
        }
        /* 展开示意板：三个正方形排开 + 直线 */
        const flatTex = canvasTex(512, 256, (ctx, w, h) => {
          ctx.fillStyle = 'rgba(238,232,214,0.94)';
          ctx.fillRect(0, 0, w, h);
          ctx.strokeStyle = 'rgba(90,104,120,0.85)';
          ctx.lineWidth = 3;
          const sq = 120, ox = 26, oy = 40;
          for (let i = 0; i < 3; i++) ctx.strokeRect(ox + i * sq, oy, sq, sq);
          ctx.strokeStyle = '#d64a2e';
          ctx.lineWidth = 4;
          ctx.beginPath(); ctx.moveTo(ox, oy + sq); ctx.lineTo(ox + 2 * sq + 0, oy + sq - sq * 0.5); ctx.stroke();
          ctx.fillStyle = '#2c3642';
          ctx.font = '700 22px sans-serif';
          ctx.fillText('A', ox - 8, oy + sq + 22);
          ctx.fillText('C₁', ox + 2 * sq + 4, oy + sq / 2 - 10);
          ctx.fillStyle = 'rgba(60,72,86,0.9)';
          ctx.font = '600 20px "PingFang SC", sans-serif';
          ctx.fillText('沿棱剪开：底面 + 右侧面排到同一平面', w * 0.5, h - 16);
        });
        const flat = mesh(new THREE.PlaneGeometry(2.6, 1.3), new THREE.MeshBasicMaterial({ map: flatTex, transparent: true }));
        flat.position.set(3.4, 1.5, -0.6);
        flat.rotation.y = -0.5;
        world.add(flat);
        hset('main', `摊平后连直线：L = √(4² + 2²) = 2√5 ≈ ${(2 * Math.sqrt(5)).toFixed(3)}`);
        hset('aux', '棱长 2 的正方体：从顶点 A 沿表面爬到对角的 C₁');
        hset('note', '路径经过的两个面摊平后，折线变直线');
      } else {
        const r = 1, h = 2.4;
        const geo = buildCylinderGeo(r, h);
        const asm = assembleSolid(geo, PAL.nucleus, { opacity: 0.13, joints: false, edgeOpacity: 0.35 });
        world.add(asm.group);
        /* 螺旋半圈路径 A(θ=0,底) → B(θ=π,顶) */
        const pts = [];
        for (let i = 0; i <= 60; i++) {
          const a = (i / 60) * Math.PI;
          pts.push(new THREE.Vector3(Math.cos(a) * r * 1.005, (i / 60) * h, Math.sin(a) * r * 1.005));
        }
        markG.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0xff6a48, transparent: true, opacity: 1 })));
        for (const [p, name] of [[pts[0], 'A'], [pts[60], 'B']]) {
          const d = mesh(new THREE.SphereGeometry(0.05, 12, 10), new THREE.MeshBasicMaterial({ color: 0xff6a48 }));
          d.position.copy(p);
          markG.add(d);
          const l = label(name, '#ffb59e', 0.004);
          l.position.copy(p).add(new THREE.Vector3(0, name === 'B' ? 0.22 : -0.22, 0));
          markG.add(l);
        }
        const L = Math.hypot(Math.PI * r, h);
        hset('main', `展开成矩形后连直线：L = √(π² + 2.4²) ≈ ${L.toFixed(3)}`);
        hset('aux', '圆柱（底面半径 1，高 2.4）：从 A 贴着侧面绕半圈到 B');
        hset('note', '侧面展开是矩形：宽 = 半圈弧长 πr，高 = 2.4');
      }
    }
    rebuild();
    /* 控件区 */
    const rebuildControls = () => {
      ctl.clear();
      ctl.seg({
        options: [{ label: '几何体展开', value: 'solid' }, { label: '展开图对照', value: 'nets' }, { label: '最短路径', value: 'path' }],
        value: nf.mode,
        onChange: (v) => { nf.mode = v; rebuildControls(); rebuild(); },
      });
      ctl.sep();
      if (nf.mode === 'solid') {
        ctl.seg({ options: UNFOLD_KINDS.map(([k, name]) => ({ label: name, value: k })), value: nf.solidKind, onChange: (v) => { nf.solidKind = v; nf.t = 1; rebuild(); } });
        ctl.slider({ label: '展开进度', min: 0, max: 1, step: 0.01, value: nf.t, fmt: (v) => `${Math.round(v * 100)}%`, onInput: (v) => { nf.t = v; nf.playing = false; playBtn.textContent = '▶ 自动展开'; applyUnfold(); syncHudSolid(); } });
        const playBtn = ctl.button({
          label: '▶ 自动展开',
          onClick() {
            nf.playing = !nf.playing;
            if (nf.playing && nf.t >= 0.999) nf.t = 0.999;
            playBtn.textContent = nf.playing ? '⏸ 暂停' : '▶ 自动展开';
            playBtn.classList.toggle('active', nf.playing);
          },
        });
        ctl.sep();
        ctl.toggle({ label: '自动旋转', value: false, onChange: (v) => { autoSpin = v; } });
      } else if (nf.mode === 'nets') {
        const opts = NETS.map((_, i) => ({ label: String(i + 1), value: String(i) }))
          .concat(NETS_BAD.map((_, i) => ({ label: `伪${i + 1}`, value: String(NETS.length + i) })));
        ctl.seg({ options: opts, value: String(nf.which), onChange: (v) => { nf.which = +v; nf.t = 1; rebuild(); } });
        ctl.slider({ label: '折叠', min: 0, max: 1, step: 0.01, value: nf.t, fmt: (v) => `${Math.round(v * 100)}%`, onInput: (v) => { nf.t = v; nf.playing = false; playBtn2.textContent = '▶ 自动折叠'; rebuild(); } });
        const playBtn2 = ctl.button({
          label: '▶ 自动折叠',
          onClick() {
            nf.playing = !nf.playing;
            if (nf.playing && nf.t >= 1.549) nf.t = 0;
            playBtn2.textContent = nf.playing ? '⏸ 暂停' : '▶ 自动折叠';
            playBtn2.classList.toggle('active', nf.playing);
          },
        });
        ctl.sep();
        ctl.toggle({ label: '自动旋转', value: false, onChange: (v) => { autoSpin = v; } });
      } else {
        ctl.seg({
          options: [{ label: '正方体 A→C₁', value: 'cube' }, { label: '圆柱绕半圈', value: 'cylinder' }],
          value: nf.path,
          onChange: (v) => { nf.path = v; rebuild(); },
        });
        ctl.sep();
        ctl.toggle({ label: '自动旋转', value: false, onChange: (v) => { autoSpin = v; } });
      }
    };
    const syncHudSolid = () => {
      hset('main', `${UNFOLD_KINDS.find(([k]) => k === nf.solidKind)[1]} · 展开 ${Math.round(nf.t * 100)}%`);
      hset('aux', state.kindNote || '');
      if (nf.solidKind === 'cylinder') hset('note', '侧面展开：S = 2πr·h（矩形面积）');
      else if (nf.solidKind === 'cone') hset('note', '扇形圆心角 θ = 2πr / l（弧长 = 底面周长）');
      else hset('note', '表面积 = 展开图面积');
    };
    rebuildControls();
    setHudRows([['mode', '当前模式'], ['main', '主读数'], ['aux', '辅助读数'], ['note', '说明']]);
    const syncHud = () => {
      if (nf.mode === 'solid') {
        hset('mode', '几何体展开');
        syncHudSolid();
      } else if (nf.mode === 'nets') {
        hset('mode', '展开图对照（程序验证 11 种）');
      } else {
        hset('mode', '最短路径');
        hset('note', '把折线爬过的面摊到同一平面，两点之间直线最短');
      }
    };
    syncHud();
    chapterTick = (dt) => {
      if (nf.mode === 'solid' && nf.playing) {
        nf.t -= dt * 0.4;
        if (nf.t <= 0.001) { nf.t = 0.001; nf.playing = false; const b = ctl.el.querySelector('.ctl-btn'); if (b) { b.textContent = '▶ 自动展开'; b.classList.remove('active'); } }
        const input = ctl.el.querySelectorAll('input[type=range]')[0];
        if (input) { input.value = nf.t; input.dispatchEvent(new Event('input')); }
      }
      if (nf.mode === 'nets' && nf.playing) {
        nf.t += dt * 0.42;
        if (nf.t >= 1.55) { nf.t = 0; nf.which = (nf.which + 1) % (NETS.length + NETS_BAD.length); rebuild(); }
        const input = ctl.el.querySelectorAll('input[type=range]')[0];
        if (input) { input.value = Math.min(1, nf.t); input.dispatchEvent(new Event('input')); }
        applyFold(state.net, nf.t);
        if (nf.which >= NETS.length && nf.t >= 0.99) markOverlaps(state.net);
        const isBad2 = nf.which >= NETS.length;
        hset('main', (isBad2 ? `伪展开图 ${nf.which - NETS.length + 1} / ${NETS_BAD.length}` : `展开图 ${nf.which + 1} / ${NETS.length}（${NET_TYPE_NAME(isBad2 ? NETS_BAD[nf.which - NETS.length] : NETS[nf.which])}型）`)
          + ` · 折叠 ${Math.round(Math.min(1, nf.t) * 100)}%`);
        hset('aux', isBad2
          ? (nf.t >= 0.99 ? '✗ 折不合——重叠的面已标红' : '伪展开图：折到最后会有面重叠')
          : '✓ 可折合成正方体');
      }
    };
  },
};

/* ================= 章节 3：三视图与直观图 ================= */

const BLOCK_PRESETS = {
  steps: { name: '台阶', heights: { '0,0': 1, '1,0': 2, '2,0': 3, '3,0': 4, '0,1': 1, '1,1': 1 } },
  jia: { name: '搭法甲', heights: { '0,0': 1, '1,0': 2, '0,1': 2, '1,1': 1 } },
  yi: { name: '搭法乙', heights: { '0,0': 2, '1,0': 1, '0,1': 1, '1,1': 2 } },
  bing: { name: '搭法丙', heights: { '0,0': 1, '1,0': 1, '0,1': 2, '1,1': 2 } },
};
const OBLIQUE_SHAPES = {
  square: { name: '正方形', pts: [[-1, -1], [1, -1], [1, 1], [-1, 1]], close: true },
  rect: { name: '长方形', pts: [[-1.5, -0.9], [1.5, -0.9], [1.5, 0.9], [-1.5, 0.9]], close: true },
  tri: { name: '正三角形', pts: [[0, 1.25], [-1.3, -0.75], [1.3, -0.75]], close: true },
  hex: { name: '正六边形', pts: Array.from({ length: 6 }, (_, i) => { const a = (i / 6) * TAU; return [Math.cos(a) * 1.15, Math.sin(a) * 1.15]; }), close: true },
  circle: { name: '圆', pts: Array.from({ length: 49 }, (_, i) => { const a = (i / 48) * TAU; return [Math.cos(a) * 1.05, Math.sin(a) * 1.05]; }), close: true },
};

const sv3 = { mode: 'blocks', tool: 'add', preset: 'steps', shape: 'square', t: 1, playing: false, dir: 1 };

const secViews = {
  id: 'views', title: '三视图与直观图',
  html: `<p>把几何体放进三面投影墙：从正面看、从左面看、从顶上看，画出的分别是<b>主视图、左视图、俯视图</b>；三张图之间满足「长对正、高平齐、宽相等」。</p>
<p><b>搭方块</b>：在网格上点击叠放小方块（右键或 Shift + 点击拿走），三块投影面板实时刷新。注意搭法甲 / 乙 / 丙的三视图完全相同——三视图相同，搭法不一定唯一。</p>
<p><b>斜二测画法</b>画水平放置图形的直观图：横不变、纵减半、角取 45°。点「演示」看四步动画，读数给出原图面积、直观图面积与面积之比 S′ : S = √2 : 4。</p>`,
  enter() {
    clearGroup(world);
    autoSpin = false;
    world.rotation.y = 0;
    demoShadow.scale.set(1.5, 1, 1.5);
    camTo([4.4, 3.6, 5.4], [0, 0.8, 0]);
    const heights = new Map();
    const state = { cubes: new THREE.Group(), panel: null, obliqueTex: null, pickTargets: [] };
    world.add(state.cubes);
    const setPreset = (key) => {
      heights.clear();
      const p = BLOCK_PRESETS[key];
      if (p) for (const [k, v] of Object.entries(p.heights)) heights.set(k, v);
    };
    setPreset(sv3.preset);
    /* —— 方块搭建与三视图 —— */
    const CUB = 0.62;
    function rebuildCubes() {
      clearGroup(state.cubes);
      const cubeGeo = new THREE.BoxGeometry(CUB, CUB, CUB);
      const cubeEdgeGeo = new THREE.EdgesGeometry(cubeGeo, 10);
      const mat = matCoat(PAL.cytosol, { roughness: 0.38, clearcoat: 0.6, transparent: true, opacity: 0.5 });
      let count = 0;
      for (const [keyk, hgt] of heights) {
        const [i, j] = keyk.split(',').map(Number);
        for (let y = 0; y < hgt; y++) {
          const m = mesh(cubeGeo, mat);
          m.position.set((i - 1.5) * CUB, (y + 0.5) * CUB + 0.02, (j - 1.5) * CUB);
          m.userData.cellKey = keyk;
          m.userData.topY = y;
          const e = new THREE.LineSegments(cubeEdgeGeo, new THREE.LineBasicMaterial({ color: 0xa8bccb, transparent: true, opacity: 0.75 }));
          e.position.copy(m.position);
          state.cubes.add(m, e);
          count++;
        }
      }
      /* 基准网格 */
      const grid = new THREE.Group();
      for (let i = 0; i <= 4; i++) {
        grid.add(segLine(new THREE.Vector3((i - 2) * CUB, 0.021, -2 * CUB), new THREE.Vector3((i - 2) * CUB, 0.021, 2 * CUB), 0x8a99a8, 0.5));
        grid.add(segLine(new THREE.Vector3(-2 * CUB, 0.021, (i - 2) * CUB), new THREE.Vector3(2 * CUB, 0.021, (i - 2) * CUB), 0x8a99a8, 0.5));
      }
      state.cubes.add(grid);
      state.pickTargets = [];
      state.cubes.traverse((o) => { if (o.isMesh && o.userData.cellKey) state.pickTargets.push(o); });
      refreshPanel();
      hset('count', `${count} 个小正方体`);
    }
    function viewsData() {
      const front = new Map(), left = new Map(), top = new Map();
      for (const [k, hgt] of heights) {
        const [i, j] = k.split(',').map(Number);
        front.set(i, Math.max(front.get(i) || 0, hgt));
        left.set(j, Math.max(left.get(j) || 0, hgt));
        top.set(k, Math.max(top.get(k) || 0, hgt));
      }
      return { front, left, top };
    }
    function refreshPanel() {
      const { front, left, top } = viewsData();
      if (!state.panel) {
        state.panel = mesh(new THREE.PlaneGeometry(4.4, 1.5), new THREE.MeshBasicMaterial({ transparent: true }));
        state.panel.position.set(-3.6, 1.7, -1.1);
        state.panel.rotation.y = 0.6;
        world.add(state.panel);
      }
      const tex = canvasTex(768, 264, (ctx, w, h) => {
        ctx.fillStyle = 'rgba(236,231,214,0.94)';
        ctx.fillRect(0, 0, w, h);
        const cell = 44, gap = 8;
        const drawGrid = (ox, oy, cols, rows, get, title) => {
          for (let c = 0; c < cols; c++) {
            for (let r2 = 0; r2 < rows; r2++) {
              const v = get(c, r2);
              const x = ox + c * cell, y = oy + (rows - 1 - r2) * cell;
              ctx.fillStyle = v ? 'rgba(210,110,70,0.75)' : 'rgba(120,130,140,0.12)';
              ctx.fillRect(x, y, cell - 2, cell - 2);
              ctx.strokeStyle = 'rgba(90,104,120,0.6)';
              ctx.strokeRect(x, y, cell - 2, cell - 2);
              if (v) {
                ctx.fillStyle = 'rgba(250,240,225,0.95)';
                ctx.font = '700 15px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(String(v), x + cell / 2 - 1, y + cell / 2 + 5);
              }
            }
          }
          ctx.fillStyle = 'rgba(50,62,76,0.95)';
          ctx.font = '600 20px "PingFang SC", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(title, ox + cols * cell / 2, oy - 10);
        };
        drawGrid(30, 60, 4, 4, (c, r2) => top.get(`${c},${r2}`) || 0, '俯视图');
        drawGrid(30 + 4 * cell + gap + 40, 60, 4, 4, (c) => front.get(c) || 0, '主视图');
        drawGrid(30 + 8 * cell + gap * 2 + 80, 60, 4, 4, (c) => left.get(c) || 0, '左视图');
        /* 长对正 / 高平齐 / 宽相等 虚线对齐辅助 */
        ctx.strokeStyle = 'rgba(150,110,60,0.45)';
        ctx.setLineDash([6, 5]);
        ctx.lineWidth = 1.4;
        const gx0 = 30, gx1 = 30 + 4 * cell + gap + 40;
        for (let c = 0; c <= 4; c += 2) {
          ctx.beginPath();
          ctx.moveTo(gx0 + c * cell, 60 + 4 * cell);
          ctx.lineTo(gx1 + c * cell, 60 + 4 * cell);
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.moveTo(gx1 + 4 * cell + 6, 60);
        ctx.lineTo(gx1 + 4 * cell + 6 + 18, 60 + 4 * cell);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(60,72,86,0.85)';
        ctx.font = '500 17px "PingFang SC", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('长对正 · 高平齐 · 宽相等', 36, h - 16);
      });
      if (state.panel.material.map) state.panel.material.map.dispose();
      state.panel.material.map = tex;
      state.panel.material.needsUpdate = true;
    }
    /* —— 斜二测画法（原图 → 直观图 形变动画） —— */
    const obliqueCv = document.createElement('canvas');
    obliqueCv.width = 768; obliqueCv.height = 420;
    const obliqueTex = new THREE.CanvasTexture(obliqueCv);
    obliqueTex.colorSpace = THREE.SRGBColorSpace;
    obliqueTex.anisotropy = 8;
    function drawOblique() {
      const ctx = obliqueCv.getContext('2d');
      const w = obliqueCv.width, h = obliqueCv.height;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(238,233,216,0.95)';
      ctx.fillRect(0, 0, w, h);
      const shape = OBLIQUE_SHAPES[sv3.shape];
      const k = 1 - Math.pow(1 - clamp(sv3.t, 0, 1), 2);
      const c45 = Math.SQRT1_2, half = 0.5;
      const ob = ([x, y]) => [x + y * c45 * half * k, y * c45 * half * k];
      const scale = 78, ox = w * 0.30, oy = h * 0.66;
      const ox2 = w * 0.72;
      const path = (pts, off) => {
        ctx.beginPath();
        pts.forEach(([x, y], i) => {
          const px = off[0] + x * scale, py = off[1] - y * scale;
          i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        });
        if (shape.close) ctx.closePath();
      };
      /* 网格底 */
      ctx.strokeStyle = 'rgba(130,140,150,0.18)';
      for (let gx = 0; gx < w; gx += 30) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, h); ctx.stroke(); }
      for (let gy = 0; gy < h; gy += 30) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke(); }
      /* 原图 */
      ctx.strokeStyle = 'rgba(70,96,120,0.9)';
      ctx.lineWidth = 3.2;
      ctx.fillStyle = 'rgba(74,144,180,0.22)';
      path(shape.pts.map(([x, y]) => [x, y]), [ox, oy]);
      ctx.fill(); ctx.stroke();
      /* 直观图 */
      ctx.strokeStyle = 'rgba(190,90,50,0.95)';
      ctx.fillStyle = 'rgba(216,106,74,0.25)';
      path(shape.pts.map(ob), [ox2, oy]);
      ctx.fill(); ctx.stroke();
      /* 45° 辅助轴（k>0 时显示） */
      if (k > 0.05) {
        ctx.strokeStyle = `rgba(190,90,50,${0.5 * k})`;
        ctx.setLineDash([7, 6]);
        ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(ox2, oy); ctx.lineTo(ox2 + 150, oy); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(ox2, oy); ctx.lineTo(ox2 + 150 * c45 * k, oy - 150 * c45 * k); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(190,90,50,0.9)';
        ctx.font = '600 17px sans-serif';
        ctx.fillText('x′', ox2 + 152, oy + 6);
        ctx.fillText('y′', ox2 + 150 * c45 * k + 4, oy - 150 * c45 * k);
      }
      ctx.fillStyle = 'rgba(50,62,76,0.95)';
      ctx.font = '600 22px "PingFang SC", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`原图（${shape.name}）`, ox, h - 26);
      ctx.fillText('直观图（斜二测）', ox2, h - 26);
      /* 步骤条 */
      const stepNames = ['取 x、y 轴', '画 45° 的 x′、y′ 轴', '纵坐标减半', '连线成图'];
      const stepIdx = sv3.t <= 0 ? -1 : Math.min(3, Math.floor(sv3.t * 4));
      ctx.textAlign = 'left';
      stepNames.forEach((nm, i) => {
        ctx.fillStyle = i <= stepIdx ? 'rgba(190,90,50,0.95)' : 'rgba(110,122,134,0.6)';
        ctx.font = i === stepIdx ? '700 19px "PingFang SC", sans-serif' : '500 17px "PingFang SC", sans-serif';
        ctx.fillText(`${i + 1}. ${nm}`, 24, 40 + i * 28);
      });
      obliqueTex.needsUpdate = true;
      /* 面积读数：直观图面积恒为原图 × √2/4 */
      const area = (() => {
        if (sv3.shape === 'square') return 4;
        if (sv3.shape === 'rect') return 5.4;
        if (sv3.shape === 'tri') return 1.3 * 2.6;
        if (sv3.shape === 'hex') return 2.598 * 1.15 * 1.15;
        return Math.PI * 1.05 * 1.05;
      })();
      hset('s0', `${shape.name}：S = ${area.toFixed(3)}`);
      hset('s1', `直观图 S′ = S·√2/4 = ${(area * Math.SQRT1_2 / 2).toFixed(3)}`);
      hset('s2', `面积之比 S′ : S = √2 : 4 ≈ ${(Math.SQRT1_2 / 2).toFixed(4)}`);
    }
    let obliquePlane = null;
    function buildOblique() {
      if (!obliquePlane) {
        obliquePlane = mesh(new THREE.PlaneGeometry(4.9, 2.68), new THREE.MeshBasicMaterial({ map: obliqueTex, transparent: true }));
        obliquePlane.rotation.x = -Math.PI / 2;
        obliquePlane.rotation.z = 0.06;
        obliquePlane.position.set(0.2, 0.035, -0.2);
        world.add(obliquePlane);
      }
      drawOblique();
    }
    /* 初始：按模式搭建 */
    if (sv3.mode === 'blocks') rebuildCubes();
    else buildOblique();
    /* —— 拾取（搭方块） —— */
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    function cellFromWorld(p) {
      const i = Math.round(p.x / CUB + 1.5), j = Math.round(p.z / CUB + 1.5);
      if (i < 0 || i > 3 || j < 0 || j > 3) return null;
      return `${i},${j}`;
    }
    function onPick(ev) {
      if (sv3.mode !== 'blocks') return;
      const rect = stage.getBoundingClientRect();
      pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, app.camera);
      const remove = sv3.tool === 'remove' || ev.shiftKey || ev.button === 2;
      /* 先试方块命中（面法线判向），再退回地面网格 */
      const hits = raycaster.intersectObjects(state.pickTargets, false);
      if (hits.length) {
        const hit = hits[0];
        const keyk = hit.object.userData.cellKey;
        const nrm = hit.face.normal.clone().applyQuaternion(hit.object.getWorldQuaternion(new THREE.Quaternion()));
        if (remove) {
          heights.set(keyk, Math.max(0, (heights.get(keyk) || 0) - 1));
        } else if (nrm.y > 0.5) {
          heights.set(keyk, Math.min(4, (heights.get(keyk) || 0) + 1));
        } else {
          /* 侧面：向面外方向找相邻格 */
          const [i, j] = keyk.split(',').map(Number);
          const di = Math.abs(nrm.x) > 0.5 ? Math.sign(nrm.x) : 0;
          const dj = Math.abs(nrm.z) > 0.5 ? Math.sign(nrm.z) : 0;
          const ni = clamp(i + di, 0, 3), nj = clamp(j + dj, 0, 3);
          heights.set(`${ni},${nj}`, Math.min(4, (heights.get(`${ni},${nj}`) || 0) + 1));
        }
      } else {
        const p = new THREE.Vector3();
        if (raycaster.ray.intersectPlane(groundPlane, p)) {
          const keyk = cellFromWorld(p);
          if (keyk) {
            if (remove) heights.set(keyk, Math.max(0, (heights.get(keyk) || 0) - 1));
            else heights.set(keyk, Math.min(4, (heights.get(keyk) || 0) + 1));
          }
        }
      }
      rebuildCubes();
      syncHudBlocks();
    }
    const offViewsPick = clickNoDrag(stage, onPick);
    const noCtx = (e) => e.preventDefault();
    stage.addEventListener('contextmenu', noCtx);
    const syncHudBlocks = () => {
      const { front, left } = viewsData();
      const f = [...front.entries()].sort((a, b) => a[0] - b[0]).map(([, v]) => v).join(' ');
      const l = [...left.entries()].sort((a, b) => a[0] - b[0]).map(([, v]) => v).join(' ');
      hset('bcount', `${[...heights.values()].reduce((s2, v) => s2 + v, 0)} 个小正方体`);
      hset('bviews', `主视图列高 ${f} · 左视图列高 ${l}`);
      hset('bnote', sv3.mode === 'blocks' ? '三视图相同，搭法不一定唯一——切换搭法甲 / 乙 / 丙对比' : '');
    };
    if (sv3.mode === 'blocks') syncHudBlocks();
    /* 控件 */
    const rebuildControls = () => {
      ctl.clear();
      ctl.seg({
        options: [{ label: '叠方块 · 三视图', value: 'blocks' }, { label: '斜二测画法', value: 'oblique' }],
        value: sv3.mode,
        onChange: (v) => {
          sv3.mode = v;
          clearGroup(world);
          state.panel = null; obliquePlane = null;
          world.add(state.cubes);
          rebuildControls();
          if (v === 'blocks') { rebuildCubes(); syncHudBlocks(); setHudRows([['bcount', '方块数'], ['bviews', '投影列高'], ['bnote', '观察']]); }
          else { buildOblique(); setHudRows([['s0', '原图'], ['s1', '直观图'], ['s2', '面积之比']]); }
          camTo(v === 'blocks' ? [4.4, 3.6, 5.4] : [1.2, 5.6, 4.6], [0, 0.4, 0]);
        },
      });
      ctl.sep();
      if (sv3.mode === 'blocks') {
        ctl.seg({
          options: [{ label: '添加', value: 'add' }, { label: '移除', value: 'remove' }],
          value: sv3.tool,
          onChange: (v) => { sv3.tool = v; },
        });
        ctl.seg({
          options: Object.entries(BLOCK_PRESETS).map(([k, p]) => ({ label: p.name, value: k })).concat([{ label: '清空', value: 'clear' }]),
          value: sv3.preset,
          onChange: (v) => {
            if (v === 'clear') heights.clear();
            else { sv3.preset = v; setPreset(v); }
            rebuildCubes(); syncHudBlocks();
          },
        });
        ctl.sep();
        ctl.toggle({ label: '自动旋转', value: false, onChange: (v2) => { autoSpin = v2; } });
      } else {
        ctl.seg({ options: Object.entries(OBLIQUE_SHAPES).map(([k, p]) => ({ label: p.name, value: k })), value: sv3.shape, onChange: (v) => { sv3.shape = v; drawOblique(); } });
        ctl.slider({ label: '变形进度', min: 0, max: 1, step: 0.01, value: sv3.t, fmt: (v) => `${Math.round(v * 100)}%`, onInput: (v) => { sv3.t = v; sv3.playing = false; drawOblique(); } });
        const playB = ctl.button({
          label: sv3.playing ? '⏸ 暂停' : (sv3.t >= 1 ? '↻ 重新演示' : '▶ 演示'),
          onClick() {
            if (sv3.t >= 0.999) sv3.t = 0;
            sv3.playing = !sv3.playing;
            playB.textContent = sv3.playing ? '⏸ 暂停' : '▶ 演示';
            playB.classList.toggle('active', sv3.playing);
          },
        });
        ctl.sep();
        ctl.toggle({ label: '自动旋转', value: false, onChange: (v2) => { autoSpin = v2; } });
      }
    };
    rebuildControls();
    setHudRows(sv3.mode === 'blocks'
      ? [['bcount', '方块数'], ['bviews', '投影列高'], ['bnote', '观察']]
      : [['s0', '原图'], ['s1', '直观图'], ['s2', '面积之比']]);
    chapterTick = (dt) => {
      if (sv3.mode === 'oblique' && sv3.playing) {
        sv3.t += dt * 0.32;
        if (sv3.t >= 1) { sv3.t = 1; sv3.playing = false; const b = ctl.el.querySelector('.ctl-btn'); if (b) { b.textContent = '↻ 重新演示'; b.classList.remove('active'); } }
        drawOblique();
      }
    };
    activeCleanup = () => {
      offViewsPick();
      stage.removeEventListener('contextmenu', noCtx);
    };
  },
};

/* ================= 章节 4：截面 ================= */

const TETRA_MODEL = (() => {
  const a = 2;
  const r = a / Math.sqrt(3);
  const h = Math.sqrt(2 / 3) * a;
  const base = [
    new THREE.Vector3(r, 0, 0),
    new THREE.Vector3(-r / 2, 0, r * Math.sqrt(3) / 2),
    new THREE.Vector3(-r / 2, 0, -r * Math.sqrt(3) / 2),
  ];
  const apex = new THREE.Vector3(0, h, 0);
  return { verts: [...base, apex], faces: [[0, 1, 3], [1, 2, 3], [2, 0, 3], [0, 2, 1]] };
})();

const ct4 = { obj: 'cube', mode: 'preset', preset: 'hexagon', d: 0, tilt: 35, az: 40, drag: null };

const CUBE_MODEL = (() => {
  const d = cubeData(CUBE_S, -CUBE_S / 2, -CUBE_S / 2);
  return { verts: d.verts, faces: d.faces, edges: d.edges };
})();

const secCut2 = {
  id: 'cut2', title: '截面',
  html: `<p>拿一个平面去切几何体，切出来的平面图形就是<b>截面</b>——截面的每条边，都是截平面与几何体某个面相交所留下的交线。正方体只有 6 个面，所以截面最多是六边形。</p>
<p>经典截面：过三条棱等分点的<span class="hl">正三角形</span>、过两条对棱的矩形、垂直于体对角线的正六边形。换到正四面体：4 个面最多截出四边形，平行于一组对棱、过其余棱中点能截出正方形。</p>
<p><b>三点定面</b>：直接拖动棱上的 P、Q、R 三个点；<b>自由平面</b>：调倾角、方位与平移量。平面若与几何体不相交，读数会注明「没有截面」。</p>`,
  enter() {
    clearGroup(world);
    autoSpin = false;
    world.rotation.y = 0;
    demoShadow.scale.set(1.5, 1, 1.5);
    camTo([3.6, 3.0, 4.8], [0, 1, 0]);
    Object.assign(ct4, { d: 0, drag: null });
    const state = { solidGroup: null, model: null, secGroup: new THREE.Group(), dots: [], dotPicks: [], panelLines: [] };
    world.add(state.secGroup);
    /* 经典三点截面演示（原版问答的两问） */
    const CLASSIC = {
      /* 点直接落在顶点上（a=b 的退化棱），围出经典三点截面 */
      acd1: { name: '过 A、C、D₁ 三点', verts: [0, 3, 6], note: 'AC、CD₁、D₁A 都是面对角线，等长围成正三角形' },
      bdd1: { name: '过 B、D、D₁ 三点', verts: [1, 2, 6], note: 'BD = 2√2 与 BB₁ = 2 垂直，围成矩形而非正方形' },
    };
    function currentModel() {
      if (ct4.obj === 'cube') {
        const d = cubeData(CUBE_S, -CUBE_S / 2, -CUBE_S / 2);
        const geo = new THREE.BoxGeometry(CUBE_S, CUBE_S, CUBE_S);
        geo.translate(0, CUBE_S / 2, 0);
        return { model: { verts: d.verts, faces: d.faces }, geo, color: PAL.cytosol };
      }
      const positions = [];
      const idx = [];
      const { verts, faces } = TETRA_MODEL;
      faces.forEach((f) => {
        for (let k = 1; k < f.length - 1; k++) {
          [f[0], f[k], f[k + 1]].forEach((vi) => positions.push(verts[vi].x, verts[vi].y, verts[vi].z));
          idx.push(positions.length / 3 - 3, positions.length / 3 - 2, positions.length / 3 - 1);
        }
      });
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
      geo.setIndex(idx);
      geo.computeVertexNormals();
      geo.translate(0, -0.9, 0);
      const model = {
        verts: verts.map((v) => v.clone().setY(v.y - 0.9)),
        faces: faces.map((f) => [...f]),
      };
      return { model, geo, color: PAL.mitoShell };
    }
    function buildSolid() {
      if (state.solidGroup) { clearGroup(state.solidGroup); world.remove(state.solidGroup); }
      const { model, geo, color } = currentModel();
      state.model = model;
      const asm = assembleSolid(geo, color, { opacity: 0.15, joints: false, edgeOpacity: 0.6 });
      state.solidGroup = asm.group;
      world.add(state.solidGroup);
      rebuildDots();
    }
    function planeFromParams() {
      if (ct4.mode === 'preset') {
        const c = new THREE.Vector3(0, ct4.obj === 'cube' ? 1 : -0.05, 0);
        if (ct4.obj === 'cube') {
          if (ct4.preset === 'hexagon') return [new THREE.Vector3(1, 1, 1).normalize(), c.clone().add(new THREE.Vector3(1, 1, 1).normalize().multiplyScalar(ct4.d))];
          if (ct4.preset === 'diag') return [new THREE.Vector3(1, 0, 1).normalize(), c.clone().add(new THREE.Vector3(1, 0, 1).normalize().multiplyScalar(ct4.d))];
          if (ct4.preset === 'tri') return [new THREE.Vector3(1, 1, 1).normalize(), new THREE.Vector3(CUBE_S / 2, 0, CUBE_S / 2).add(new THREE.Vector3(1, 1, 1).normalize().multiplyScalar(ct4.d))];
          if (ct4.preset === 'square') return [new THREE.Vector3(1, 0, -1).normalize(), c.clone().add(new THREE.Vector3(1, 0, -1).normalize().multiplyScalar(ct4.d))];
          if (ct4.preset === 'penta') return [new THREE.Vector3(0.55, 1, 0.35).normalize(), c.clone().add(new THREE.Vector3(0.2, 0.4, 0.1).normalize().multiplyScalar(ct4.d))];
          return [new THREE.Vector3(Math.cos(ct4.tilt * DEG), Math.sin(ct4.tilt * DEG), 0).normalize(), c.clone().add(new THREE.Vector3(Math.cos(ct4.tilt * DEG), Math.sin(ct4.tilt * DEG), 0).normalize().multiplyScalar(ct4.d))];
        }
        /* 正四面体预设 */
        const vs = state.model.verts;
        if (ct4.preset === 'mid') {
          /* 过四条棱中点的正方形截面：平行于一组对棱 */
          const n = vs[3].clone().sub(vs[0]).cross(vs[2].clone().sub(vs[1])).normalize();
          const mids = [onEdge(vs[0], vs[1], 0.5), onEdge(vs[0], vs[2], 0.5), onEdge(vs[1], vs[3], 0.5), onEdge(vs[2], vs[3], 0.5)];
          const p0 = mids.reduce((s2, p) => s2.add(p), new THREE.Vector3()).multiplyScalar(0.25);
          return [n, p0.add(n.clone().multiplyScalar(ct4.d))];
        }
        return [new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, -0.05 + ct4.d, 0)];
      }
      if (ct4.mode === 'free') {
        const th = ct4.tilt * DEG, az = ct4.az * DEG;
        const n = new THREE.Vector3(Math.sin(th) * Math.cos(az), Math.cos(th), Math.sin(th) * Math.sin(az)).normalize();
        const c = new THREE.Vector3(0, ct4.obj === 'cube' ? 1 : -0.05, 0);
        return [n, c.clone().add(n.clone().multiplyScalar(ct4.d))];
      }
      /* 三点定面 */
      const [p, q, r2] = state.dots.map((d) => d.position.clone());
      const n = q.clone().sub(p).cross(r2.clone().sub(p));
      if (n.lengthSq() < 1e-8) return null;
      return [n.normalize(), p.clone()];
    }
    function updateSection() {
      clearGroup(state.secGroup);
      const pn = planeFromParams();
      if (!pn) {
        hset('shape', '三点共线，无法确定截面');
        hset('edge', '─'); hset('note', '换一组不共线的三点试试');
        return;
      }
      const [n, p0] = pn;
      const poly = cutConvex(state.model, n, p0);
      if (poly.length >= 3) {
        state.secGroup.add(polyMeshFromPoints(poly, 0xd86a4a, 0.55));
        const peri = poly.reduce((s2, p, i) => s2 + p.distanceTo(poly[(i + 1) % poly.length]), 0);
        hset('shape', classifyPoly(poly));
        hset('edge', `${poly.length} 条边 · 周长 ${peri.toFixed(2)}`);
        hset('note', ct4.obj === 'cube' ? '截面经过几个面，就有几条边' : '正四面体总共 4 个面，截面最多到四边形为止');
      } else {
        hset('shape', '没有截面');
        hset('edge', '─');
        hset('note', '截平面与几何体没有公共部分，或只碰到一个点、一段棱');
      }
    }
    /* 三点定面的可拖拽点 */
    const DOT_EDGES = () => {
      const m = state.model;
      if (ct4.obj === 'cube') {
        /* 三条不共面的棱：底前棱 / 右竖棱 / 顶后棱 */
        return [[m.verts[0], m.verts[1]], [m.verts[1], m.verts[5]], [m.verts[6], m.verts[7]]];
      }
      return [[m.verts[0], m.verts[1]], [m.verts[1], m.verts[2]], [m.verts[2], m.verts[3]]];
    };
    function rebuildDots() {
      state.dots.forEach((d) => world.remove(d));
      state.dots = [];
      const edgeList = DOT_EDGES();
      const names = ['P', 'Q', 'R'];
      edgeList.forEach(([a, b], i) => {
        const dot = mesh(new THREE.SphereGeometry(0.085, 16, 12), matStd(PAL.vesicle, { roughness: 0.3, emissive: 0x6a4a10, emissiveIntensity: 0.4 }));
        dot.position.copy(onEdge(a, b, 0.3 + i * 0.2));
        dot.userData = { a: a.clone(), b: b.clone(), name: names[i] };
        world.add(dot);
        state.dots.push(dot);
        const l = label(names[i], '#ffd98e', 0.0038);
        l.position.copy(dot.position).add(new THREE.Vector3(0.14, 0.16, 0));
        dot.userData.lbl = l;
        world.add(l);
      });
    }
    function syncDotLabels() {
      state.dots.forEach((d) => {
        if (d.userData.lbl) d.userData.lbl.position.copy(d.position).add(new THREE.Vector3(0.14, 0.16, 0));
      });
    }
    /* —— 拾取与拖拽 —— */
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    function pickDot(ev) {
      const rect = stage.getBoundingClientRect();
      pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, app.camera);
      const hits = raycaster.intersectObjects(state.dots, false);
      return hits.length ? hits[0].object : null;
    }
    function onDown(ev) {
      if (ct4.mode !== 'points') return;
      const d = pickDot(ev);
      if (d) {
        ct4.drag = d;
        stage.style.cursor = 'grabbing';
        ev.preventDefault();
      }
    }
    function onMove(ev) {
      if (!ct4.drag) return;
      const rect = stage.getBoundingClientRect();
      pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, app.camera);
      const { a, b } = ct4.drag.userData;
      /* 射线到棱线段的最近点参数 s（最小化 |a+s·u − ro−t·rd|²） */
      const ro = raycaster.ray.origin, rd = raycaster.ray.direction;
      const u = b.clone().sub(a);
      const w0 = ro.clone().sub(a);
      const bU = u.dot(u), dV = rd.dot(u);
      const wU = w0.dot(u), dD = rd.dot(rd);
      const wD = w0.dot(rd);
      const den = bU * dD - dV * dV;
      if (Math.abs(den) < 1e-9) return;
      const s = clamp((wU * dD - wD * dV) / den, 0, 1);
      ct4.drag.position.copy(onEdge(a, b, s));
      syncDotLabels();
      updateSection();
    }
    function onUp() {
      ct4.drag = null;
      stage.style.cursor = '';
    }
    stage.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    /* —— 经典演示按钮逻辑 —— */
    const applyClassic = (keyk) => {
      const spec = CLASSIC[keyk];
      if (ct4.obj !== 'cube') return;
      ct4.mode = 'points';
      ct4.demoOn = false;
      state.dots.forEach((d, i) => {
        const v = CUBE_MODEL.verts[spec.verts[i]];
        d.userData.a = v.clone();
        d.userData.b = v.clone();
        d.position.copy(v);
      });
      syncDotLabels();
      rebuildControls();
      updateSection();
      hset('note', spec.note);
    };
    function rebuildControls() {
      ctl.clear();
      ctl.seg({
        options: [{ label: '正方体', value: 'cube' }, { label: '正四面体', value: 'tetra' }],
        value: ct4.obj,
        onChange: (v) => { ct4.obj = v; buildSolid(); updateSection(); },
      });
      ctl.sep();
      if (ct4.mode === 'preset') {
        const opts = ct4.obj === 'cube'
          ? [['hexagon', '正六边形'], ['diag', '对角面'], ['tri', '正三角形'], ['square', '正方形'], ['penta', '斜截面'], ['tiltp', '自由倾角']]
          : [['horiz', '平行底面'], ['mid', '过棱中点正方形']];
        ctl.seg({ options: opts.map(([v, l]) => ({ label: l, value: v })), value: ct4.preset, onChange: (v) => { ct4.preset = v; updateSection(); } });
        ctl.slider({ label: '平移 d', min: -1.3, max: 1.3, step: 0.02, value: ct4.d, fmt: (v) => v.toFixed(2), onInput: (v) => { ct4.d = v; updateSection(); } });
      } else if (ct4.mode === 'points') {
        ctl.button({ label: '↻ 演示动画', onClick: () => { ct4.demoT = 0; ct4.demoOn = true; } });
        if (ct4.obj === 'cube') {
          ctl.button({ label: '过 A、C、D₁ 三点', onClick: () => applyClassic('acd1') });
          ctl.button({ label: '过 B、D、D₁ 三点', onClick: () => applyClassic('bdd1') });
        }
        ctl.sep();
        ctl.readout({ label: '拖拽提示', value: '按住 P / Q / R 沿棱拖动' });
      } else {
        ctl.slider({ label: '倾角', min: 5, max: 175, step: 1, value: ct4.tilt, fmt: (v) => `${v}°`, onInput: (v) => { ct4.tilt = v; updateSection(); } });
        ctl.slider({ label: '方位', min: 0, max: 360, step: 1, value: ct4.az, fmt: (v) => `${v}°`, onInput: (v) => { ct4.az = v; updateSection(); } });
        ctl.slider({ label: '平移 d', min: -1.5, max: 1.5, step: 0.02, value: ct4.d, fmt: (v) => v.toFixed(2), onInput: (v) => { ct4.d = v; updateSection(); } });
      }
      ctl.sep();
      ctl.seg({
        options: [{ label: '预设截面', value: 'preset' }, { label: '三点定面', value: 'points' }, { label: '自由平面', value: 'free' }],
        value: ct4.mode,
        onChange: (v) => { ct4.mode = v; rebuildControls(); updateSection(); },
      });
      ctl.sep();
      ctl.toggle({ label: '自动旋转', value: false, onChange: (v) => { autoSpin = v; } });
    }
    buildSolid();
    rebuildControls();
    setHudRows([['shape', '截面形状'], ['edge', '边数 · 周长'], ['note', '说明']]);
    updateSection();
    chapterTick = (dt) => {
      if (ct4.demoOn && ct4.mode === 'points') {
        ct4.demoT = (ct4.demoT ?? 0) + dt * 0.5;
        const t = ct4.demoT;
        state.dots.forEach((d, i) => {
          const s = 0.5 + 0.45 * Math.sin(t * TAU / 3 + i * 2.1);
          d.position.copy(onEdge(d.userData.a, d.userData.b, clamp(s, 0.02, 0.98)));
        });
        syncDotLabels();
        updateSection();
      }
    };
    activeCleanup = () => {
      stage.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  },
};

/* ================= 章节 5：空间角 ================= */

/* 命名演示注册表：{ id, obj, name, build(marks, hud) } —— 数值全部现场计算 */
function angleBetweenDirs(a, b) {
  const cosv = Math.abs(a.dot(b)) / (a.length() * b.length());
  return { cosv, deg: Math.acos(clamp(cosv, 0, 1)) / DEG };
}
function linePlaneAngle(p1, p2, planeN) {
  const d = p2.clone().sub(p1);
  const n = planeN.clone().normalize();
  const sinv = Math.abs(d.dot(n)) / d.length();
  return { sinv, deg: Math.asin(clamp(sinv, 0, 1)) / DEG };
}
function dihedralFromNormals(n1, n2) {
  const cosv = Math.abs(n1.clone().normalize().dot(n2.clone().normalize()));
  return { cosv, deg: Math.acos(clamp(cosv, 0, 1)) / DEG };
}
const sa5 = { obj: 'cube', which: 'skew1', free: { sel: [] } };

const ANGLE_DEMOS = [
  { id: 'skew1', obj: 'cube', name: '异面直线 A₁B 与 B₁C', kind: 'skew', points: () => [NAMED_CUBE.A1, NAMED_CUBE.B, NAMED_CUBE.B1, NAMED_CUBE.C] },
  { id: 'skew2', obj: 'cube', name: '异面直线 AC 与 BD₁', kind: 'skew', points: () => [NAMED_CUBE.A, NAMED_CUBE.C, NAMED_CUBE.B, NAMED_CUBE.D1] },
  { id: 'lp1', obj: 'cube', name: '直线 A₁C 与底面 ABCD', kind: 'lineplane', points: () => [NAMED_CUBE.A1, NAMED_CUBE.C] },
  { id: 'lp2', obj: 'cube', name: '直线 A₁B 与对角面 BB₁D₁D', kind: 'lineplane', points: () => [NAMED_CUBE.A1, NAMED_CUBE.B] },
  { id: 'dh1', obj: 'cube', name: '二面角 A₁-BD-A', kind: 'dihedral', points: () => [NAMED_CUBE.A1, NAMED_CUBE.B, NAMED_CUBE.D, NAMED_CUBE.A] },
  { id: 'dh2', obj: 'cube', name: '二面角 A₁-BD-C₁', kind: 'dihedral', points: () => [NAMED_CUBE.A1, NAMED_CUBE.B, NAMED_CUBE.D, NAMED_CUBE.C1] },
  { id: 'lp3', obj: 'pyr', name: '侧棱 PA 与底面 ABCD', kind: 'lineplane', points: () => [PYR.P, PYR.A] },
  { id: 'dh3', obj: 'pyr', name: '侧面 PAB 与底面的二面角', kind: 'dihedral', points: () => [PYR.P, PYR.A, PYR.B] },
  { id: 'skew3', obj: 'pyr', name: '异面直线 PA 与 BC', kind: 'skew', points: () => [PYR.P, PYR.A, PYR.B, PYR.C] },
];

const secAngles = {
  id: 'angles', title: '空间角',
  html: `<p>求空间角，通行的思路是把它们都化成<b>平面角</b>来算：</p>
<p><b>异面直线所成角</b>——平移一条线使二者相交，所成锐角或直角（范围 (0°, 90°]）；<b>直线与平面所成角</b>——斜线与它在这个平面内的射影的夹角（[0°, 90°]）；<b>二面角</b>——在棱上取一点，在两个面内分别作棱的垂线（[0°, 180°]）。</p>
<p>正方体与四棱锥里预置了 9 组常见考题，也可以切到<span class="hl">自由选择</span>：点击棱或对角线选直线、点击面选平面，选好两个对象自动求角。</p>`,
  enter() {
    clearGroup(world);
    autoSpin = false;
    world.rotation.y = 0;
    demoShadow.scale.set(1.5, 1, 1.5);
    camTo([4.0, 3.2, 5.0], [0, 1, 0]);
    Object.assign(sa5, { which: 'skew1' });
    const marks = new THREE.Group();
    world.add(marks);
    let solidGroup = null;
    let pickLines = [];
    let pickFaces = [];
    const state = { sel: [], result: null };
    const show = (which) => {
      clearGroup(marks);
      pickLines = []; pickFaces = [];
      const demo = ANGLE_DEMOS.find((d) => d.id === which);
      if (!demo) return;
      const pts = demo.points();
      hset('demo', demo.name);
      if (demo.kind === 'skew') {
        const [p1, p2, p3, p4] = pts;
        marks.add(segLine(p1, p2, 0xe8674a, 1));
        marks.add(segLine(p3, p4, 0x4a90d9, 1));
        /* 平移辅助线：把第二条平移到与第一条相交（虚线示意） */
        const d0 = p2.clone().sub(p1), d20 = p4.clone().sub(p3);
        marks.add(segLine(p1, p1.clone().add(d20), 0x4a90d9, 0.4, true));
        const d1 = d0, d2 = d20;
        const { cosv, deg } = angleBetweenDirs(d1, d2);
        hset('formula', `cosθ = |a·b| / (|a||b|) = ${cosv.toFixed(3)}`);
        hset('theta', `θ = ${deg.toFixed(1)}°`);
        hset('note', '平移其中一条，两条线相交后所成锐角即所求');
      } else if (demo.kind === 'lineplane') {
        const [p1, p2] = pts;
        /* 所在平面与垂足按演示号确定 */
        let planeN, foot;
        if (demo.id === 'lp1') { planeN = new THREE.Vector3(0, 1, 0); foot = NAMED_CUBE.A1.clone().setY(0); }
        else if (demo.id === 'lp2') { planeN = new THREE.Vector3(1, 0, 1); foot = NAMED_CUBE.A1.clone().add(new THREE.Vector3(1, 0, 1)); }
        else { planeN = new THREE.Vector3(0, 1, 0); foot = PYR.P.clone().setY(0); }
        const { sinv, deg } = linePlaneAngle(p1, p2, planeN);
        marks.add(segLine(p1, p2, 0xe8674a, 1));
        marks.add(segLine(foot, p1, 0xd9a13f, 0.9, true));
        marks.add(segLine(foot, p2, 0x4a90d9, 1));
        const rMark = rightAngleMark(foot, p1.clone().sub(foot), p2.clone().sub(foot), 0xd9a13f, 0.22);
        marks.add(rMark);
        hset('formula', `sinθ = ${sinv.toFixed(3)}（垂线段 / 斜线段）`);
        hset('theta', `θ = ${deg.toFixed(1)}°`);
        hset('note', '斜线与它在平面内的射影的夹角');
      } else {
        /* 二面角：pts = [P1(面1点), B(棱端1), D(棱端2), P2(面2点)] */
        const [q1, e1, e2, q2] = pts;
        const dir = e2.clone().sub(e1).normalize();
        const mid = onEdge(e1, e2, 0.5);
        const ray1 = q1.clone().sub(mid); ray1.addScaledVector(dir, -ray1.dot(dir));
        const ray2 = q2.clone().sub(mid); ray2.addScaledVector(dir, -ray2.dot(dir));
        const { cosv, deg } = dihedralFromNormals(ray1, ray2);
        marks.add(segLine(e1, e2, 0xe8674a, 1.2));
        marks.add(segLine(mid, mid.clone().add(ray1.normalize().multiplyScalar(0.9)), 0x4a90d9, 1));
        marks.add(segLine(mid, mid.clone().add(ray2.normalize().multiplyScalar(0.9)), 0x3fa96f, 1));
        const arc = arcLine(mid, mid.clone().add(ray1.clone().normalize()), mid.clone().add(ray2.clone().normalize()), dir, 0xd9a13f, 0.3);
        marks.add(arc);
        hset('formula', `cosθ = |n₁·n₂| = ${cosv.toFixed(3)}`);
        hset('theta', `θ = ${deg.toFixed(1)}°`);
        hset('note', '两个半平面内垂直于棱的两条射线所成角');
      }
      /* 点名标签 */
      const labels = demo.kind === 'skew'
        ? [['p1', 0xe8674a], ['p2', 0xe8674a], ['p3', 0x4a90d9], ['p4', 0x4a90d9]]
        : demo.kind === 'lineplane' ? [['p1', 0xe8674a], ['p2', 0x4a90d9]] : [['q1', 0x4a90d9], ['e1', 0x8a99a8], ['e2', 0x8a99a8], ['q2', 0x3fa96f]];
      const names = { skew1: ['A₁', 'B', 'B₁', 'C'], skew2: ['A', 'C', 'B', 'D₁'], skew3: ['P', 'A', 'B', 'C'], lp1: ['A₁', 'C'], lp2: ['A₁', 'B'], lp3: ['P', 'A'], dh1: ['A₁', 'B', 'D', 'A'], dh2: ['A₁', 'B', 'D', 'C₁'], dh3: ['P', 'A', 'B', ''] };
      const nm = names[demo.id] || [];
      pts.forEach((p, i) => {
        if (!nm[i]) return;
        const l = label(nm[i], '#dfe8f0', 0.0036);
        l.position.copy(p).add(new THREE.Vector3(0.16, 0.2, 0));
        marks.add(l);
      });
    };
    const buildFree = () => {
      clearGroup(marks);
      pickLines = []; pickFaces = [];
      const isCube = sa5.obj === 'cube';
      const data = isCube ? cubeData(CUBE_S, -CUBE_S / 2, -CUBE_S / 2) : { verts: PYR.verts, edges: [[0, 1], [1, 2], [2, 3], [3, 0], [0, 4], [1, 4], [2, 4], [3, 4]], faces: PYR.faces };
      /* 棱与对角线可点 */
      const lineSet = [...data.edges.map(([a, b]) => [data.verts[a], data.verts[b]])];
      if (isCube) {
        const v = data.verts;
        lineSet.push([v[0], v[7]], [v[1], v[6]], [v[2], v[5]], [v[3], v[4]]);
      }
      lineSet.forEach(([a, b]) => {
        const hit = mesh(new THREE.CylinderGeometry(0.055, 0.055, a.distanceTo(b), 8), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.0, depthWrite: false }));
        hit.position.copy(onEdge(a, b, 0.5));
        hit.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
        hit.userData = { kind: 'line', a: a.clone(), b: b.clone() };
        marks.add(hit);
        pickLines.push(hit);
      });
      data.faces.forEach((f, fi) => {
        const vs = f.map((i) => data.verts[i]);
        const c = vs.reduce((s2, p) => s2.add(p), new THREE.Vector3()).multiplyScalar(1 / vs.length);
        const n = vs[0].clone().sub(vs[1]).cross(vs[2].clone().sub(vs[1])).normalize();
        const u = vs[1].clone().sub(vs[0]).normalize();
        const w = n.clone().cross(u).normalize();
        const size = Math.sqrt(vs.reduce((s2, p) => s2 + p.distanceToSquared(c), 0) / vs.length) * 1.5;
        const quad = new THREE.BufferGeometry().setFromPoints([
          c.clone().add(u.clone().multiplyScalar(size)).add(w.clone().multiplyScalar(size)),
          c.clone().add(u.clone().multiplyScalar(-size)).add(w.clone().multiplyScalar(size)),
          c.clone().add(u.clone().multiplyScalar(-size)).add(w.clone().multiplyScalar(-size)),
          c.clone().add(u.clone().multiplyScalar(size)).add(w.clone().multiplyScalar(-size)),
        ]);
        quad.setIndex([0, 1, 2, 0, 2, 3]);
        quad.computeVertexNormals();
        const hit = mesh(quad, new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.0, depthWrite: false, side: THREE.DoubleSide }));
        hit.userData = { kind: 'face', n: n.clone(), c: c.clone(), idx: fi };
        marks.add(hit);
        pickFaces.push(hit);
      });
      hset('demo', '自由选择');
      hset('formula', state.sel.length ? '' : '');
      hset('theta', '');
      hset('note', '点击棱 / 对角线选直线，点击面选平面——选好两个对象自动求角');
      renderSel();
    };
    function renderSel() {
      /* 选中对象高亮重画 */
      const selMarks = new THREE.Group();
      marks.add(selMarks);
      state.sel.forEach((o, i) => {
        const col = i === 0 ? 0xe8674a : 0x4a90d9;
        if (o.kind === 'line') selMarks.add(segLine(o.a, o.b, col, 1.1));
        else {
          const q = mesh(new THREE.PlaneGeometry(1, 1), ghostFace(col, 0.22));
          q.position.copy(o.c);
          q.lookAt(o.c.clone().add(o.n));
          selMarks.add(q);
        }
      });
      marks.userData.selMarks = selMarks;
    }
    function evalFree() {
      if (state.sel.length < 2) return;
      const [o1, o2] = state.sel;
      if (o1.kind === 'line' && o2.kind === 'line') {
        const d1 = o1.b.clone().sub(o1.a), d2 = o2.b.clone().sub(o2.a);
        const { cosv, deg } = angleBetweenDirs(d1, d2);
        hset('formula', `异面直线：cosθ = ${cosv.toFixed(3)}`);
        hset('theta', `θ = ${deg.toFixed(1)}°`);
        hset('note', '平移相交后所成锐角或直角');
      } else if (o1.kind === 'line' && o2.kind === 'face') {
        const { sinv, deg } = linePlaneAngle(o1.a, o1.b, o2.n);
        hset('formula', `线面角：sinθ = ${sinv.toFixed(3)}`);
        hset('theta', `θ = ${deg.toFixed(1)}°`);
        hset('note', '斜线与其在平面内射影的夹角');
      } else if (o1.kind === 'face' && o2.kind === 'line') {
        const { sinv, deg } = linePlaneAngle(o2.a, o2.b, o1.n);
        hset('formula', `线面角：sinθ = ${sinv.toFixed(3)}`);
        hset('theta', `θ = ${deg.toFixed(1)}°`);
        hset('note', '斜线与其在平面内射影的夹角');
      } else {
        const { cosv, deg } = dihedralFromNormals(o1.n, o2.n);
        hset('formula', `二面角：cosθ = ${cosv.toFixed(3)}`);
        hset('theta', `θ = ${deg.toFixed(1)}°`);
        hset('note', '两面法向量所成角（或其补角，取 0°~180° 内的角）');
      }
    }
    const onPickFree = (ev) => {
      if (sa5.which !== 'free') return;
      const rect = stage.getBoundingClientRect();
      pointer2.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      pointer2.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster2.setFromCamera(pointer2, app.camera);
      const hitsL = raycaster2.intersectObjects(pickLines, false);
      const hitsF = raycaster2.intersectObjects(pickFaces, false);
      const hl = hitsL[0], hf = hitsF[0];
      let picked = null;
      if (hl && (!hf || hl.distance <= hf.distance + 0.12)) picked = hl.object.userData;
      else if (hf) picked = hf.object.userData;
      if (!picked) return;
      if (state.sel.length >= 2) { state.sel = []; const old = marks.userData.selMarks; if (old) { clearGroup(old); marks.remove(old); } }
      state.sel.push(picked);
      renderSel();
      if (state.sel.length === 2) evalFree();
      else hset('note', picked.kind === 'line' ? '已选直线，再点一个面（线面角）或另一条线（异面角）' : '已选平面，再点一条线（线面角）或另一个面（二面角）');
    };
    const raycaster2 = new THREE.Raycaster();
    const pointer2 = new THREE.Vector2();
    const offFreePick = clickNoDrag(stage, onPickFree);
    const rebuildControls = () => {
      ctl.clear();
      ctl.seg({
        options: [{ label: '正方体', value: 'cube' }, { label: '四棱锥', value: 'pyr' }],
        value: sa5.obj,
        onChange: (v) => {
          sa5.obj = v;
          rebuildSolid();
          const first = ANGLE_DEMOS.find((d) => d.obj === v);
          sa5.which = first.id;
          rebuildControls(); show(sa5.which);
        },
      });
      ctl.sep();
      const demos = ANGLE_DEMOS.filter((d) => d.obj === sa5.obj);
      ctl.seg({
        options: demos.map((d) => ({ label: d.name, value: d.id })).concat([{ label: '自由选择', value: 'free' }]),
        value: sa5.which,
        onChange: (v) => { sa5.which = v; if (v === 'free') { state.sel = []; buildFree(); } else show(v); },
      });
      ctl.sep();
      ctl.button({ label: '清除选择', onClick: () => { if (sa5.which === 'free') { state.sel = []; const old = marks.userData.selMarks; if (old) { clearGroup(old); marks.remove(old); } hset('formula', ''); hset('theta', ''); hset('note', '已清除，重新点选两个对象'); } } });
      ctl.sep();
      ctl.toggle({ label: '自动旋转', value: false, onChange: (v) => { autoSpin = v; } });
    };
    function rebuildSolid() {
      if (solidGroup) { clearGroup(solidGroup); world.remove(solidGroup); }
      let geo, color;
      if (sa5.obj === 'cube') {
        geo = new THREE.BoxGeometry(CUBE_S, CUBE_S, CUBE_S);
        geo.translate(0, CUBE_S / 2, 0);
        color = PAL.cytosol;
      } else {
        const positions = [];
        const idx = [];
        PYR.faces.forEach((f) => {
          for (let k = 1; k < f.length - 1; k++) {
            [f[0], f[k], f[k + 1]].forEach((vi) => positions.push(PYR.verts[vi].x, PYR.verts[vi].y, PYR.verts[vi].z));
            idx.push(positions.length / 3 - 3, positions.length / 3 - 2, positions.length / 3 - 1);
          }
        });
        geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
        geo.setIndex(idx);
        geo.computeVertexNormals();
        color = PAL.golgi;
      }
      const asm = assembleSolid(geo, color, { opacity: 0.13, joints: false, edgeOpacity: 0.45 });
      solidGroup = asm.group;
      world.add(solidGroup);
    }
    rebuildSolid();
    rebuildControls();
    show(sa5.which);
    setHudRows([['demo', '演示'], ['formula', '公式口径'], ['theta', '角度'], ['note', '说明']]);
    activeCleanup = () => offFreePick();
    chapterTick = () => {};
  },
};

/* ================= 章节 6：空间向量与坐标 ================= */

const vec6 = { mode: 'calc', ax: 2, ay: 0, az: 0, bx: 0, by: 2, bz: 2, showSum: true, which: 'ab1d1' };

const secVectors = {
  id: 'vectors', title: '空间向量与坐标',
  html: `<p>建立空间直角坐标系后，几何问题可以全部翻译成坐标运算：向量 <b>a = (x, y, z)</b>，数量积 <b>a·b = x₁x₂ + y₁y₂ + z₁z₂</b>，夹角 cosθ = a·b / (|a||b|)，a⊥b ⇔ a·b = 0。</p>
<p>求距离与证明垂直的另一件利器是<span class="hl">平面的法向量 n</span>：n 与平面内任意向量垂直。点 A 到平面的距离 d = |n·AP| / |n|（P 是平面内任一点）。</p>
<p>「向量运算」页拖动 a、b 的分量滑杆看夹角实时变化；「法向量与距离」页预置了三组经典求距离演示，也可以自由点选平面与顶点。</p>`,
  enter() {
    clearGroup(world);
    autoSpin = false;
    world.rotation.y = 0;
    demoShadow.scale.set(1.4, 1, 1.4);
    camTo([4.4, 3.4, 5.2], [0.9, 0.9, 0]);
    const marks = new THREE.Group();
    world.add(marks);
    let pickFaces = [];
    let pickVerts = [];
    let solidGroup = null;
    const arrowA = fatArrow(0xe8674a), arrowB = fatArrow(0x4a90d9), arrowS = fatArrow(0x3fa96f);
    marks.add(arrowA, arrowB, arrowS);
    const lblA = label('a', '#ffb59e', 0.0042), lblB = label('b', '#9ec2ff', 0.0042), lblS = label('a+b', '#9dd9ae', 0.0042);
    marks.add(lblA, lblB, lblS);
    /* 坐标系骨架（向量运算页） */
    const axesG = new THREE.Group();
    const axes = new THREE.Group();
    [['x', [4.2, 0, 0]], ['y', [0, 3.2, 0]], ['z', [0, 0, 4.2]]].forEach(([name, end]) => {
      axes.add(segLine(new THREE.Vector3(0, 0, 0), new THREE.Vector3(...end), 0x7e8ea0, 0.7));
      const l = label(name, '#aebdcb', 0.0036);
      l.position.set(end[0] + 0.16, end[1] + 0.16, end[2] + 0.16);
      axes.add(l);
    });
    axesG.add(axes);
    const refCube = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(2, 2, 2)),
      new THREE.LineBasicMaterial({ color: 0x7e8ea0, transparent: true, opacity: 0.25 }),
    );
    refCube.position.set(1, 1, 1);
    axesG.add(refCube);
    function setVecState() {
      const a = new THREE.Vector3(vec6.ax, vec6.ay, vec6.az);
      const b = new THREE.Vector3(vec6.bx, vec6.by, vec6.bz);
      arrowA.userData.setVec(a);
      arrowB.userData.setVec(b);
      lblA.position.copy(a).add(new THREE.Vector3(0, 0.22, 0));
      lblB.position.copy(b).add(new THREE.Vector3(0, 0.22, 0));
      const s = a.clone().add(b);
      arrowS.visible = lblS.visible = vec6.showSum;
      if (vec6.showSum) {
        arrowS.userData.setVec(s);
        lblS.position.copy(s).add(new THREE.Vector3(0, 0.22, 0));
      }
      const dotv = a.dot(b);
      const la = a.length(), lb = b.length();
      const cosv = la && lb ? dotv / (la * lb) : 0;
      hset('dot', `a·b = ${dotv}`);
      hset('cos', `cosθ = ${cosv.toFixed(3)} → θ = ${(Math.acos(clamp(cosv, -1, 1)) / DEG).toFixed(1)}°`);
      hset('norms', `|a| = ${la.toFixed(2)}   |b| = ${lb.toFixed(2)}`);
    }
    /* —— 法向量与距离演示 —— */
    const DIST_DEMOS = [
      { id: 'ab1d1', name: '点 A₁ 到平面 AB₁D₁', cube: true, exact: '2√3/3 ≈ 1.155', planePts: () => [new THREE.Vector3(0, 0, 0), new THREE.Vector3(2, 0, 2), new THREE.Vector3(0, 2, 2)], q: () => new THREE.Vector3(0, 0, 2) },
      { id: 'a1bd', name: '点 C 到平面 A₁BD', cube: true, exact: '2√3/3 ≈ 1.155', planePts: () => [new THREE.Vector3(0, 0, 2), new THREE.Vector3(2, 0, 0), new THREE.Vector3(0, 2, 0)], q: () => new THREE.Vector3(2, 2, 0) },
      { id: 'apbc', name: '点 A 到平面 PBC（四棱锥）', cube: false, exact: '4√5/5 ≈ 1.789', planePts: () => [PYR.P, PYR.B, PYR.C], q: () => PYR.A.clone() },
    ];
    const DIST_NOTES = {
      ab1d1: '等边三角形 B₁DD₁ 的高，也是平行平面 AB₁D₁ 与 A₁BD 间的距离',
      a1bd: '与上一组对称：两个平行平面把体对角线三等分，每段都是 2√3/3',
      apbc: '先求平面 PBC 的法向量 n = (2, 1, 0)，再投影',
    };
    /* 与第 5 章几何法对照：同一道题不走坐标运算时的经典解法 */
    const GEO_COMPARE = {
      ab1d1: '等体积法：V = ⅓·S(△AB₁A₁)·2 = 4/3，S(△AB₁D₁) = 2√3（等边边长 2√2），d = 3V/S = 2√3/3',
      a1bd: '体对角线三等分：AC₁ ⊥ 两个平行平面，垂足把 AC₁ 三等分，d = AC₁/3 = 2√3/3',
      apbc: '等体积法：V(A-PBC) = V(P-ABC) = ⅓·S(△ABC)·h = 4/3，S(△PBC) = √5，d = 3V/S = 4√5/5',
    };
    function buildSolidFor(obj) {
      if (solidGroup) { clearGroup(solidGroup); world.remove(solidGroup); }
      let geo, color;
      if (obj) {
        geo = new THREE.BoxGeometry(CUBE_S, CUBE_S, CUBE_S);
        geo.translate(0, CUBE_S / 2, 0);
        color = PAL.cytosol;
      } else {
        const positions = [];
        const idx = [];
        PYR.faces.forEach((f) => {
          for (let k = 1; k < f.length - 1; k++) {
            [f[0], f[k], f[k + 1]].forEach((vi) => positions.push(PYR.verts[vi].x, PYR.verts[vi].y, PYR.verts[vi].z));
            idx.push(positions.length / 3 - 3, positions.length / 3 - 2, positions.length / 3 - 1);
          }
        });
        geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
        geo.setIndex(idx);
        geo.computeVertexNormals();
        color = PAL.golgi;
      }
      const asm = assembleSolid(geo, color, { opacity: 0.13, joints: false, edgeOpacity: 0.45 });
      solidGroup = asm.group;
      world.add(solidGroup);
    }
    function showDist(id) {
      clearGroup(marks);
      const demo = DIST_DEMOS.find((d) => d.id === id);
      buildSolidFor(demo.cube);
      const pp = demo.planePts();
      const [P, Q, R] = pp;
      const n = Q.clone().sub(P).cross(R.clone().sub(P)).normalize();
      const Aq = demo.q();
      const foot = Aq.clone().sub(n.clone().multiplyScalar(n.dot(Aq.clone().sub(P))));
      const dist = Aq.distanceTo(foot);
      /* 平面幽灵 */
      const u = Q.clone().sub(P).normalize();
      const w = n.clone().cross(u).normalize();
      const c = P.clone().add(Q).add(R).multiplyScalar(1 / 3);
      const sz = demo.cube ? 1.62 : 1.5;
      const quad = new THREE.BufferGeometry().setFromPoints([
        c.clone().add(u.clone().multiplyScalar(sz)).add(w.clone().multiplyScalar(sz)),
        c.clone().add(u.clone().multiplyScalar(-sz)).add(w.clone().multiplyScalar(sz)),
        c.clone().add(u.clone().multiplyScalar(-sz)).add(w.clone().multiplyScalar(-sz)),
        c.clone().add(u.clone().multiplyScalar(sz)).add(w.clone().multiplyScalar(-sz)),
      ]);
      quad.setIndex([0, 1, 2, 0, 2, 3]);
      quad.computeVertexNormals();
      marks.add(mesh(quad, ghostFace(0x4a90d9, 0.2)));
      /* 法向量箭头 */
      const nArrow = fatArrow(0x9b6fd9);
      nArrow.userData.setVec(n.clone().multiplyScalar(0.9));
      nArrow.position.copy(c.clone().sub(n.clone().multiplyScalar(0.45)));
      marks.add(nArrow);
      const nLbl = label('n', '#d4b8f2', 0.0038);
      nLbl.position.copy(nArrow.position).add(n.clone().multiplyScalar(1.25));
      marks.add(nLbl);
      /* 垂线段 + 垂足 + 距离读数 */
      marks.add(segLine(foot, Aq, 0xd9a13f, 1, true));
      const fm = mesh(new THREE.SphereGeometry(0.05, 12, 10), new THREE.MeshBasicMaterial({ color: 0xd9a13f }));
      fm.position.copy(foot);
      marks.add(fm);
      for (const p of pp) {
        const d = mesh(new THREE.SphereGeometry(0.05, 12, 10), new THREE.MeshBasicMaterial({ color: 0x9ec2ff }));
        d.position.copy(p);
        marks.add(d);
      }
      const qd = mesh(new THREE.SphereGeometry(0.055, 12, 10), new THREE.MeshBasicMaterial({ color: 0xe8674a }));
      qd.position.copy(Aq);
      marks.add(qd);
      const names = demo.cube ? ['A', 'B₁', 'D₁'] : ['P', 'B', 'C'];
      pp.forEach((p, i) => {
        const l = label(names[i], '#dfe8f0', 0.0034);
        l.position.copy(p).add(new THREE.Vector3(0.18, 0.18, 0.18));
        marks.add(l);
      });
      const qName = demo.id === 'ab1d1' ? 'A₁' : demo.id === 'a1bd' ? 'C' : 'A';
      const ql = label(qName, '#ffb59e', 0.0038);
      ql.position.copy(Aq).add(new THREE.Vector3(-0.24, 0.24, -0.1));
      marks.add(ql);
      hset('demo', demo.name);
      hset('dist', `d = |n·AP| / |n| = ${dist.toFixed(3)}（= ${demo.exact}）`);
      hset('note', DIST_NOTES[id] || '');
      hset('compare', GEO_COMPARE[id] || '自由点选不走预设例题，可切回演示组看几何法');
      /* 自由点选的拾取集合：本几何体的面与顶点 */
      pickFaces = [];
      pickVerts = [];
      const isCube = demo.cube;
      const data = isCube ? (() => { const d = cubeData(CUBE_S, -CUBE_S / 2, -CUBE_S / 2); return { verts: d.verts, faces: d.faces }; })() : { verts: PYR.verts, faces: PYR.faces };
      data.faces.forEach((f) => {
        const vs = f.map((i) => data.verts[i]);
        const fc = vs.reduce((s2, p) => s2.add(p), new THREE.Vector3()).multiplyScalar(1 / vs.length);
        const nn = vs[0].clone().sub(vs[1]).cross(vs[2].clone().sub(vs[1])).normalize();
        const uu = vs[1].clone().sub(vs[0]).normalize();
        const ww = nn.clone().cross(uu).normalize();
        const size = Math.sqrt(vs.reduce((s2, p) => s2 + p.distanceToSquared(fc), 0) / vs.length) * 1.45;
        const quad2 = new THREE.BufferGeometry().setFromPoints([
          fc.clone().add(uu.clone().multiplyScalar(size)).add(ww.clone().multiplyScalar(size)),
          fc.clone().add(uu.clone().multiplyScalar(-size)).add(ww.clone().multiplyScalar(size)),
          fc.clone().add(uu.clone().multiplyScalar(-size)).add(ww.clone().multiplyScalar(-size)),
          fc.clone().add(uu.clone().multiplyScalar(size)).add(ww.clone().multiplyScalar(-size)),
        ]);
        quad2.setIndex([0, 1, 2, 0, 2, 3]);
        quad2.computeVertexNormals();
        const hit = mesh(quad2, new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.0, depthWrite: false, side: THREE.DoubleSide }));
        hit.userData = { kind: 'face', n: nn.clone(), c: fc.clone(), pts: vs.map((v) => v.clone()) };
        marks.add(hit);
        pickFaces.push(hit);
      });
      data.verts.forEach((v) => {
        const hit = mesh(new THREE.SphereGeometry(0.13, 10, 8), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.0, depthWrite: false }));
        hit.position.copy(v);
        hit.userData = { kind: 'vert', p: v.clone() };
        marks.add(hit);
        pickVerts.push(hit);
      });
    }
    function showFreeDist() {
      /* 自由模式：先在当前几何体上点平面与顶点 */
      showDist('ab1d1');
      hset('demo', '自由点选');
      hset('dist', '先点一个面，再点一个顶点');
      hset('note', '点击面选平面，点击顶点选点——自动求点到平面的距离');
      hset('compare', '自由点选实时算距离；预设演示组附几何法对照');
      freeState.face = null;
      freeState.vert = null;
    }
    const freeState = { face: null, vert: null };
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const onPick = (ev) => {
      if (vec6.mode !== 'dist' || vec6.which !== 'free') return;
      const rect = stage.getBoundingClientRect();
      pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, app.camera);
      const hv = raycaster.intersectObjects(pickVerts, false)[0];
      const hf = raycaster.intersectObjects(pickFaces, false)[0];
      if (hv && (!hf || hv.distance < hf.distance + 0.1)) {
        freeState.vert = hv.object.userData;
      } else if (hf) {
        freeState.face = hf.object.userData;
      }
      if (freeState.face && freeState.vert) {
        const n = freeState.face.n;
        const P = freeState.face.pts[0];
        const Aq = freeState.vert.p;
        const dist = Math.abs(n.dot(Aq.clone().sub(P))) / n.length();
        hset('dist', `d = ${dist.toFixed(3)}`);
        hset('note', '点在平面内距离为 0；平面法向量方向与侧向不影响距离值');
      }
    };
    const offVecPick = clickNoDrag(stage, onPick);
    /* 基础参照：向量运算页的坐标系与立方晶格 */
    const rebuildControls = () => {
      ctl.clear();
      ctl.seg({
        options: [{ label: '向量运算', value: 'calc' }, { label: '法向量与距离', value: 'dist' }],
        value: vec6.mode,
        onChange: (v) => {
          vec6.mode = v;
          rebuildControls();
          if (v === 'calc') {
            clearGroup(marks);
            marks.add(arrowA, arrowB, arrowS, lblA, lblB, lblS);
            if (solidGroup) { clearGroup(solidGroup); world.remove(solidGroup); solidGroup = null; }
            world.add(axesG);
            camTo([4.4, 3.4, 5.2], [0.9, 0.9, 0]);
            setHudRows([['dot', '数量积'], ['cos', '夹角'], ['norms', '模长']]);
            setVecState();
          } else {
            world.remove(axesG);
            camTo([4.0, 3.2, 5.0], [0.9, 1, 0]);
            setHudRows([['demo', '演示'], ['dist', '距离'], ['note', '说明'], ['compare', '几何法对照']]);
            if (vec6.which === 'free') showFreeDist();
            else showDist(vec6.which);
          }
        },
      });
      ctl.sep();
      if (vec6.mode === 'calc') {
        for (const tag of ['a', 'b']) {
          for (const comp of ['x', 'y', 'z']) {
            ctl.slider({
              label: `${tag} 的 ${comp} 分量`, min: 0, max: 2, step: 1, value: vec6[tag + comp], fmt: (v) => String(v),
              onInput: (v) => { vec6[tag + comp] = v; setVecState(); },
            });
          }
          if (tag === 'a') ctl.sep();
        }
        ctl.toggle({ label: '显示 a + b', value: true, onChange: (v) => { vec6.showSum = v; setVecState(); } });
        ctl.sep();
        ctl.toggle({ label: '自动旋转', value: false, onChange: (v2) => { autoSpin = v2; } });
      } else {
        ctl.seg({
          options: DIST_DEMOS.map((d) => ({ label: d.name, value: d.id })).concat([{ label: '自由点选', value: 'free' }]),
          value: vec6.which,
          onChange: (v) => { vec6.which = v; if (v === 'free') showFreeDist(); else showDist(v); },
        });
        ctl.sep();
        ctl.toggle({ label: '自动旋转', value: false, onChange: (v2) => { autoSpin = v2; } });
      }
    };
    world.add(axesG);
    rebuildControls();
    setVecState();
    setHudRows([['dot', '数量积'], ['cos', '夹角'], ['norms', '模长']]);
    activeCleanup = () => offVecPick();
    chapterTick = () => {};
  },
};

/* ================= 章节 7：外接球与内切球 ================= */

/* 四面体外接球心：最小二乘解 |O−p|² 相等（A·x = b，x = O−质心） */
function circumcenterOf(points) {
  const c = points.reduce((s2, p) => s2.add(p), new THREE.Vector3()).multiplyScalar(1 / points.length);
  const A = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  const b = [0, 0, 0];
  for (const p of points) {
    const d = p.clone().sub(c);
    const d2 = d.lengthSq();
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) A[i][j] += d.getComponent(i) * d.getComponent(j);
      b[i] += d.getComponent(i) * d2 * 0.5;
    }
  }
  const M = A.map((row, i) => [...row, b[i]]);
  for (let col = 0; col < 3; col++) {
    let piv = col;
    for (let r2 = col + 1; r2 < 3; r2++) if (Math.abs(M[r2][col]) > Math.abs(M[piv][col])) piv = r2;
    [M[col], M[piv]] = [M[piv], M[col]];
    if (Math.abs(M[col][col]) < 1e-10) continue;
    for (let r2 = 0; r2 < 3; r2++) {
      if (r2 === col) continue;
      const f = M[r2][col] / M[col][col];
      for (let k = col; k <= 3; k++) M[r2][k] -= f * M[col][k];
    }
  }
  return new THREE.Vector3(
    M[0][3] / (M[0][0] || 1e-10),
    M[1][3] / (M[1][1] || 1e-10),
    M[2][3] / (M[2][2] || 1e-10),
  ).add(c);
}
function circleRing(center, u, w, radius, color, opacity = 0.8, seg = 64) {
  const pts = [];
  for (let i = 0; i <= seg; i++) {
    const a = (i / seg) * TAU;
    pts.push(center.clone()
      .add(u.clone().multiplyScalar(Math.cos(a) * radius))
      .add(w.clone().multiplyScalar(Math.sin(a) * radius)));
  }
  return new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color, transparent: true, opacity }));
}

const BALL_DATA = {
  circum: [
    {
      id: 'box', name: '长方体 · 体对角线',
      feature: '长方体（正方体）的体对角线互相平分且相等，交点到 8 个顶点等距——交点就是球心，体对角线的一半就是半径。',
      formula: '2R = √(a² + b² + c²)',
      example: '正方体棱长 2',
      steps: '2R = √(2²+2²+2²) = 2√3',
      answer: 'R = √3 ≈ 1.732',
      build(g) {
        const s2 = 2;
        const geo = new THREE.BoxGeometry(s2, s2, s2);
        geo.translate(0, s2 / 2, 0);
        const asm = assembleSolid(geo, PAL.cytosol, { opacity: 0.16 });
        g.add(asm.group);
        const c = new THREE.Vector3(0, 1, 0);
        g.add(segLine(new THREE.Vector3(-1, 0, -1), new THREE.Vector3(1, 2, 1), 0xe8674a, 1));
        g.add(ballWire(s2 * Math.sqrt(3) / 2, 0xd9a13f));
        return { center: c, R: s2 * Math.sqrt(3) / 2 };
      },
    },
    {
      id: 'complement', name: '补成正方体',
      feature: '三条侧棱两两垂直的四面体，可以补形成长方体：四个顶点恰是长方体互为对角的两个顶点组，球心仍是体对角线交点。',
      formula: '2R = √(a² + b² + c²)',
      example: 'PA、PB、PC 两两垂直，PA = PB = 2，PC = 1',
      steps: '2R = √(2²+2²+1²) = 3',
      answer: 'R = 3/2 = 1.5',
      build(g) {
        const dims = [2, 2, 1];
        const boxWire = new THREE.LineSegments(
          new THREE.EdgesGeometry(new THREE.BoxGeometry(...dims)),
          new THREE.LineBasicMaterial({ color: 0x8a99a8, transparent: true, opacity: 0.5 }),
        );
        boxWire.position.y = dims[2] / 2;
        g.add(boxWire);
        const P = new THREE.Vector3(0, 0, 0), A = new THREE.Vector3(dims[0], 0, 0), B = new THREE.Vector3(0, dims[1], 0), C = new THREE.Vector3(0, 0, dims[2]);
        const positions = [];
        const idx = [];
        [[P, A, B], [P, B, C], [P, C, A], [A, B, C]].forEach((f) => {
          for (let k = 1; k < 2; k++) {
            f.forEach((v) => positions.push(v.x, v.y, v.z));
            idx.push(positions.length / 3 - 3, positions.length / 3 - 2, positions.length / 3 - 1);
          }
        });
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
        geo.setIndex(idx);
        geo.computeVertexNormals();
        g.add(mesh(geo, ghostFace(PAL.mitoShell, 0.3)));
        const R = Math.hypot(...dims) / 2;
        g.add(ballWire(R, 0xd9a13f));
        return { center: new THREE.Vector3(dims[0] / 2, dims[1] / 2, dims[2] / 2), R };
      },
    },
    {
      id: 'opposite', name: '对棱相等模型',
      feature: '三组对棱分别相等的四面体可以看成长方体的四个顶点：6 条棱全是面对角线。设三组对棱长 a、b、c，则 (2R)² = (a²+b²+c²)/2。',
      formula: '(2R)² = (a² + b² + c²) / 2',
      example: '四面体 A-B₁CD₁ 的三组对棱长 √5、√10、√13',
      steps: '(2R)² = (5+10+13)/2 = 14',
      answer: 'R = √14/2 ≈ 1.871',
      build(g) {
        /* 长方体 1×3×2：四面体取四个「奇偶相间」的顶点，6 条棱全是面对角线（√5 / √10 / √13） */
        const dims = [1, 3, 2];
        const boxWire = new THREE.LineSegments(
          new THREE.EdgesGeometry(new THREE.BoxGeometry(...dims)),
          new THREE.LineBasicMaterial({ color: 0x8a99a8, transparent: true, opacity: 0.45 }),
        );
        boxWire.position.set(0, dims[1] / 2, 0);
        g.add(boxWire);
        const hb = [dims[0] / 2, dims[1], dims[2] / 2];
        const tetra = [
          new THREE.Vector3(-hb[0], 0, -hb[2]),
          new THREE.Vector3(-hb[0], hb[1], hb[2]),
          new THREE.Vector3(hb[0], 0, hb[2]),
          new THREE.Vector3(hb[0], hb[1], -hb[2]),
        ];
        const positions = [];
        const idx = [];
        [[0, 1, 2], [0, 1, 3], [0, 2, 3], [1, 2, 3]].forEach((f) => {
          f.forEach((vi) => {
            const v = tetra[vi];
            positions.push(v.x, v.y, v.z);
          });
        });
        idx.push(0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11);
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
        geo.setIndex(idx);
        geo.computeVertexNormals();
        g.add(mesh(geo, ghostFace(PAL.chloroplast, 0.3)));
        for (const v of tetra) {
          const d = mesh(new THREE.SphereGeometry(0.05, 12, 10), new THREE.MeshBasicMaterial({ color: 0x9dd9ae }));
          d.position.copy(v);
          g.add(d);
        }
        const R = Math.sqrt(14) / 2;
        g.add(ballWire(R, 0xd9a13f));
        return { center: circumcenterOf(tetra), R };
      },
    },
    {
      id: 'burger', name: '直棱柱 · 汉堡模型',
      feature: '直棱柱的上下底面各有一个外接圆，球心在两个外心 O₁、O₂ 连线的中点：R、底面外接圆半径 r、半高 h/2 恰好构成直角三角形。',
      formula: 'R² = r² + (h/2)²',
      example: '直三棱柱底面正三角形边长 3，高 2',
      steps: 'r = √3，R² = 3 + 1 = 4',
      answer: 'R = 2',
      build(g) {
        const r = Math.sqrt(3), h = 2, n = 3;
        const geo = buildPrismGeo(n, r, h, 0);
        const asm = assembleSolid(geo, PAL.chloroplast, { opacity: 0.16, joints: false, edgeOpacity: 0.6 });
        g.add(asm.group);
        const base = ngonVerts(n, r, 0);
        const top = ngonVerts(n, r, h);
        const O1 = new THREE.Vector3(0, 0, 0), O2 = new THREE.Vector3(0, h, 0);
        const u0 = base[0].clone().sub(O1).normalize();
        const w0 = new THREE.Vector3(0, 1, 0).cross(u0).normalize();
        g.add(circleRing(O1, u0, w0, r, 0x4a90d9, 0.8));
        g.add(circleRing(O2, u0, w0, r, 0x4a90d9, 0.8));
        g.add(segLine(O1, O2, 0x9b6fd9, 1));
        g.add(segLine(new THREE.Vector3(0, 1, 0), u0.clone().multiplyScalar(r), 0xe8674a, 1));
        g.add(rightAngleMark(new THREE.Vector3(0, 1, 0), u0.clone(), new THREE.Vector3(0, -1, 0), 0x9b6fd9, 0.14));
        for (const [p, nm] of [[O1, 'O₁'], [O2, 'O₂'], [new THREE.Vector3(0, 1, 0), 'O']]) {
          const d = mesh(new THREE.SphereGeometry(0.05, 12, 10), new THREE.MeshBasicMaterial({ color: 0xd4b8f2 }));
          d.position.copy(p);
          g.add(d);
          const l = label(nm, '#d4b8f2', 0.0032);
          l.position.copy(p).add(new THREE.Vector3(0.2, 0.2, 0));
          g.add(l);
        }
        const R = 2;
        g.add(ballWire(R, 0xd9a13f));
        return { center: new THREE.Vector3(0, h / 2, 0), R };
      },
    },
    {
      id: 'perp', name: '侧棱垂直底面 · 垂面模型',
      feature: '一条侧棱垂直于底面的直棱柱：上下底面外心 O₁、O₂ 的连线与底面垂直，球心就是 O₁O₂ 的中点——相当于「半个汉堡」。',
      formula: 'R² = r² + (h/2)²',
      example: '直三棱柱底面正三角形边长 3，高 2',
      steps: 'r = 3/√3 = √3，R² = 3 + 1² = 4',
      answer: 'R = 2',
      build(g) {
        const r = Math.sqrt(3), h = 2, n = 3;
        const geo = buildPrismGeo(n, r, h, 0);
        const asm = assembleSolid(geo, PAL.chloroplast, { opacity: 0.14, joints: false, edgeOpacity: 0.55 });
        g.add(asm.group);
        const O1 = new THREE.Vector3(0, 0, 0), O2 = new THREE.Vector3(0, h, 0);
        const u0 = ngonVerts(n, r, 0)[0].clone().normalize();
        const w0 = new THREE.Vector3(0, 1, 0).cross(u0).normalize();
        g.add(circleRing(O1, u0, w0, r, 0x4a90d9, 0.75));
        g.add(circleRing(O2, u0, w0, r, 0x4a90d9, 0.4));
        const O = new THREE.Vector3(0, h / 2, 0);
        g.add(segLine(O1, O2, 0x9b6fd9, 1, true));
        for (const [p, nm] of [[O1, 'O₁'], [O2, 'O₂'], [O, 'O']]) {
          const d = mesh(new THREE.SphereGeometry(0.05, 12, 10), new THREE.MeshBasicMaterial({ color: 0xd4b8f2 }));
          d.position.copy(p);
          g.add(d);
          const l = label(nm, '#d4b8f2', 0.0032);
          l.position.copy(p).add(new THREE.Vector3(0.2, 0.2, 0));
          g.add(l);
        }
        const R = 2;
        g.add(ballWire(R, 0xd9a13f));
        return { center: O, R };
      },
    },
    {
      id: 'melon', name: '两平面垂直 · 切瓜模型',
      feature: '两个互相垂直的半平面沿公共边 BD 相交：分别过两个三角形的外心作各自平面的垂线，两垂线的交点就是球心，O、O₁、M、O₂ 四点构成矩形。',
      formula: 'O₁M ⊥ 平面 BCD，O₂M ⊥ 平面 ABD，两垂线交点 O 即球心',
      example: '△ABD 与 △CBD 都是边长 3 的正三角形，二面角 A-BD-C = 90°',
      steps: 'O₁M = O₂M = √3/2，MA − MO₁ = √3，R² = (√3)² + (√3/2)² = 15/4',
      answer: 'R = √15/2 ≈ 1.936',
      build(g) {
        const bm = 1.5, hh = 3 * Math.sqrt(3) / 2, om = Math.sqrt(3) / 2;
        const B = new THREE.Vector3(-bm, 0, 0), D = new THREE.Vector3(bm, 0, 0), M = new THREE.Vector3(0, 0, 0);
        const A = new THREE.Vector3(0, 0, hh), C = new THREE.Vector3(0, hh, 0);
        const tri = (pts, col) => {
          const geo = new THREE.BufferGeometry().setFromPoints([pts[0], pts[1], pts[2]]);
          geo.setIndex([0, 1, 2]);
          geo.computeVertexNormals();
          g.add(mesh(geo, ghostFace(col, 0.22)));
          for (let i = 0; i < 3; i++) g.add(segLine(pts[i], pts[(i + 1) % 3], col, 0.9));
        };
        tri([A, B, D], 0x4a90d9);
        tri([C, B, D], 0xe8674a);
        const O1 = new THREE.Vector3(0, 0, om), O2 = new THREE.Vector3(0, om, 0), O = new THREE.Vector3(0, om, om);
        for (const [p, q] of [[M, O1], [O1, O], [O, O2], [O2, M]]) g.add(segLine(p, q, 0x9b6fd9, 1, true));
        for (const [p, nm, c] of [[M, 'M', '#dfe8f0'], [O1, 'O₁', '#9ec2ff'], [O2, 'O₂', '#ffb59e'], [O, 'O', '#d4b8f2']]) {
          const d = mesh(new THREE.SphereGeometry(0.05, 12, 10), new THREE.MeshBasicMaterial({ color: 0xffffff }));
          d.position.copy(p);
          g.add(d);
          const l = label(nm, c, 0.0032);
          l.position.copy(p).add(new THREE.Vector3(0.16, 0.16, 0.16));
          g.add(l);
        }
        const R = Math.sqrt(15) / 2;
        g.add(ballWire(R, 0xd9a13f));
        return { center: O, R };
      },
    },
    {
      id: 'hypo', name: '公共斜边 · 共斜边模型',
      feature: '两个直角三角形有公共斜边 AB：直角三角形斜边上的中线等于斜边的一半，所以 AB 的中点 M 到四个顶点等距，M 就是球心。',
      formula: 'R = AB / 2',
      example: '四面体 A-BCD 中 ∠ACB = ∠ADB = 90°，AB = 2',
      steps: 'MA = MB = MC = MD = AB / 2 = 1',
      answer: 'R = 1',
      build(g) {
        const A = new THREE.Vector3(0, 0, 0), B = new THREE.Vector3(0, 2, 0), M = new THREE.Vector3(0, 1, 0);
        const C = new THREE.Vector3(-1, 1, 0), D = new THREE.Vector3(0, 1, 1);
        for (const [p, q] of [[A, B], [A, C], [B, C], [A, D], [B, D]]) g.add(segLine(p, q, 0x4a90d9, 0.9));
        g.add(segLine(C, D, 0x6a7f8f, 0.5, true));
        g.add(segLine(M, C, 0xd9a13f, 1, true));
        g.add(segLine(M, D, 0xd9a13f, 1, true));
        const quad = new THREE.BufferGeometry().setFromPoints([A, C, B, D]);
        quad.setIndex([0, 1, 2, 0, 2, 3]);
        quad.computeVertexNormals();
        g.add(mesh(quad, ghostFace(PAL.chloroplast, 0.14)));
        for (const [p, nm] of [[A, 'A'], [B, 'B'], [C, 'C'], [D, 'D'], [M, 'M']]) {
          const d = mesh(new THREE.SphereGeometry(0.05, 12, 10), new THREE.MeshBasicMaterial({ color: nm === 'M' ? 0xd4b8f2 : 0x9dd9ae }));
          d.position.copy(p);
          g.add(d);
          const l = label(nm, nm === 'M' ? '#d4b8f2' : '#dfe8f0', 0.0032);
          l.position.copy(p).add(new THREE.Vector3(0.16, 0.16, 0.16));
          g.add(l);
        }
        g.add(ballWire(1, 0xd9a13f));
        return { center: M, R: 1 };
      },
    },
    {
      id: 'croc', name: '鳄鱼模型',
      feature: '两个三角形有公共边 BD，二面角为 α：M 为 BD 中点，m₁、m₂ 是两个外心到 M 的距离，O、O₁、M、O₂ 四点共圆，OM 是直径。',
      formula: 'R² = OM² + (l/2)²，OM = √(m₁²+m₂²−2m₁m₂cosα) / sinα',
      example: '△ABD 边长 2√3 的正三角形，△CBD 以 C 为直角的等腰直角三角形，二面角 120°',
      steps: 'm₁ = 1，m₂ = 0，OM = 1/sin120° = 2/√3，R² = 4/3 + 3 = 13/3',
      answer: 'R = √(13/3) ≈ 2.082',
      build(g) {
        const l = 2 * Math.sqrt(3);
        const B = new THREE.Vector3(-l / 2, 0, 0), D = new THREE.Vector3(l / 2, 0, 0);
        const M = new THREE.Vector3(0, 0, 0);
        const A = new THREE.Vector3(0, Math.sin(120 * DEG) * 1, Math.cos(120 * DEG) * 1);
        const C = new THREE.Vector3(0, 0, l / 2);
        const positions = [];
        const idx = [];
        [[A, B, D], [C, B, D]].forEach((f) => {
          f.forEach((v) => positions.push(v.x, v.y, v.z));
          idx.push(positions.length / 3 - 3, positions.length / 3 - 2, positions.length / 3 - 1);
        });
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
        geo.setIndex(idx);
        geo.computeVertexNormals();
        g.add(mesh(geo, ghostFace(PAL.chloroplast, 0.26)));
        for (const [p, nm] of [[A, 'A'], [B, 'B'], [C, 'C'], [D, 'D'], [M, 'M']]) {
          const d = mesh(new THREE.SphereGeometry(0.06, 12, 10), new THREE.MeshBasicMaterial({ color: 0x9dd9ae }));
          d.position.copy(p);
          g.add(d);
          const lb = label(nm, '#dfe8f0', 0.0032);
          lb.position.copy(p).add(new THREE.Vector3(0.18, 0.2, 0.1));
          g.add(lb);
        }
        const arc = arcLine(M, B.clone(), D.clone(), new THREE.Vector3(0, 1, 0), 0x8a99a8, 0.2);
        g.add(arc);
        const center = circumcenterOf([A, B, C, D]);
        const R = A.distanceTo(center);
        g.add(ballWire(R, 0xd9a13f));
        return { center, R };
      },
    },
    {
      id: 'fold', name: '菱形折叠模型',
      feature: '边长 2√3、∠A = 60° 的菱形沿对角线 BD 折成 120° 二面角：M 为 BD 中点，两个半面的外心到 M 等距，球心在折叠轴的垂面上。',
      formula: 'R² = OM² + (BD/2)²',
      example: '边长 2√3 的菱形 ABCD，∠BAD = 60°，沿 BD 折成二面角 120°',
      steps: 'MO = 2，R² = 2² + (√3)² = 7',
      answer: 'R = √7 ≈ 2.646',
      build(g) {
        const s2 = 2 * Math.sqrt(3);
        const B = new THREE.Vector3(-s2 / 2, 0, 0), D = new THREE.Vector3(s2 / 2, 0, 0);
        const M = new THREE.Vector3(0, 0, 0);
        const A = new THREE.Vector3(0, Math.sin(60 * DEG) * 3, Math.cos(60 * DEG) * 3);
        const C = new THREE.Vector3(0, -Math.sin(60 * DEG) * 3, Math.cos(60 * DEG) * 3);
        const positions = [];
        const idx = [];
        [[A, B, D], [C, B, D]].forEach((f) => {
          f.forEach((v) => positions.push(v.x, v.y, v.z));
          idx.push(positions.length / 3 - 3, positions.length / 3 - 2, positions.length / 3 - 1);
        });
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
        geo.setIndex(idx);
        geo.computeVertexNormals();
        g.add(mesh(geo, ghostFace(PAL.vacuole, 0.26)));
        for (const [p, nm] of [[A, 'A'], [B, 'B'], [C, 'C'], [D, 'D'], [M, 'M']]) {
          const d = mesh(new THREE.SphereGeometry(0.06, 12, 10), new THREE.MeshBasicMaterial({ color: 0xa8dcf2 }));
          d.position.copy(p);
          g.add(d);
          const lb = label(nm, '#dfe8f0', 0.0032);
          lb.position.copy(p).add(new THREE.Vector3(0.18, 0.2, 0.1));
          g.add(lb);
        }
        const center = circumcenterOf([A, B, C, D]);
        const R = A.distanceTo(center);
        g.add(ballWire(R, 0xd9a13f));
        return { center, R };
      },
    },
    {
      id: 'pyramid', name: '正棱锥 · 外心法',
      feature: '正棱锥顶点在底面的射影是底面外心 O₁，球心在高 PO₁ 上：设球心高 t，在直角三角形里用 (h−t)² + r² = t²？——注意球心到顶点与到底面顶点等距，列勾股方程解 t。',
      formula: 'R = h − t，t = (h² − r²) / (2h)（r 为底面外接圆半径）',
      example: '正四棱锥 P-ABCD，底面边长 2，高 2',
      steps: 'r = √2，t = (4−2)/4 = 0.5',
      answer: 'R = 1.5',
      build(g) {
        const s2 = 2, h = 2;
        const base = [new THREE.Vector3(-1, 0, -1), new THREE.Vector3(1, 0, -1), new THREE.Vector3(1, 0, 1), new THREE.Vector3(-1, 0, 1)];
        const P = new THREE.Vector3(0, h, 0);
        const positions = [];
        const idx = [];
        [[base[0], base[1], P], [base[1], base[2], P], [base[2], base[3], P], [base[3], base[0], P], [base[0], base[3], base[2], base[1]]].forEach((f) => {
          for (let k = 1; k < f.length - 1; k++) {
            [f[0], f[k], f[k + 1]].forEach((v) => positions.push(v.x, v.y, v.z));
            idx.push(positions.length / 3 - 3, positions.length / 3 - 2, positions.length / 3 - 1);
          }
        });
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
        geo.setIndex(idx);
        geo.computeVertexNormals();
        g.add(mesh(geo, ghostFace(PAL.golgi, 0.24)));
        const rB = Math.SQRT2;
        g.add(circleRing(new THREE.Vector3(0, 0, 0), new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 1), rB, 0x4a90d9, 0.8));
        g.add(segLine(new THREE.Vector3(0, 0, 0), P, 0x9b6fd9, 1));
        const t = (h * h - rB * rB) / (2 * h);
        const O = new THREE.Vector3(0, t, 0);
        const d = mesh(new THREE.SphereGeometry(0.05, 12, 10), new THREE.MeshBasicMaterial({ color: 0xd4b8f2 }));
        d.position.copy(O);
        g.add(d);
        const l = label('O', '#d4b8f2', 0.0032);
        l.position.copy(O).add(new THREE.Vector3(0.2, 0.1, 0));
        g.add(l);
        g.add(segLine(O, base[0], 0xe8674a, 0.8, true));
        const R = h - t;
        g.add(ballWire(R, 0xd9a13f));
        return { center: O, R };
      },
    },
    {
      id: 'cylout', name: '圆柱 · 轴截面外接圆',
      feature: '圆柱的外接球球心是轴的中点：作轴截面（矩形），球的大圆就是这个矩形的外接圆——R、底面半径 r 与半高 h/2 构成直角三角形。',
      formula: 'R² = r² + (h/2)²',
      example: '圆柱底面半径 1，高 2',
      steps: 'R² = 1² + 1² = 2',
      answer: 'R = √2 ≈ 1.414',
      build(g) {
        const r = 1, h = 2;
        const geo = buildCylinderGeo(r, h);
        g.add(mesh(geo, ghostFace(PAL.vacuole, 0.16)));
        const rect = [new THREE.Vector3(-r, 0, 0), new THREE.Vector3(r, 0, 0), new THREE.Vector3(r, h, 0), new THREE.Vector3(-r, h, 0)];
        for (let i = 0; i < 4; i++) g.add(segLine(rect[i], rect[(i + 1) % 4], 0x4a90d9, 0.9));
        const O = new THREE.Vector3(0, h / 2, 0);
        const R = Math.sqrt(r * r + (h / 2) * (h / 2));
        g.add(circleRing(O, new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 1), R, 0xd9a13f, 0.85));
        const d = mesh(new THREE.SphereGeometry(0.05, 12, 10), new THREE.MeshBasicMaterial({ color: 0xd4b8f2 }));
        d.position.copy(O);
        g.add(d);
        const l = label('O', '#d4b8f2', 0.0032);
        l.position.copy(O).add(new THREE.Vector3(0.18, 0.12, 0));
        g.add(l);
        g.add(segLine(O, rect[1], 0xe8674a, 0.9));
        g.add(ballWire(R, 0xd9a13f));
        return { center: O, R };
      },
    },
    {
      id: 'conout', name: '圆锥 · 轴截面外接圆',
      feature: '圆锥的外接球球心在轴上：作轴截面（等腰三角形），球的大圆就是它的外接圆——与正棱锥模型同理，设球心离底面高 t 列勾股方程。',
      formula: 'R = h − t，R² = r₀² + t²',
      example: '圆锥底面半径 1，高 3',
      steps: '1 + t² = (3 − t)² → t = 4/3',
      answer: 'R = 5/3 ≈ 1.667',
      build(g) {
        const r = 1, h = 3;
        const geo = buildConeGeo(r, h);
        g.add(mesh(geo, ghostFace(PAL.capsule, 0.15)));
        const tri = [new THREE.Vector3(-r, 0, 0), new THREE.Vector3(r, 0, 0), new THREE.Vector3(0, h, 0)];
        for (let i = 0; i < 3; i++) g.add(segLine(tri[i], tri[(i + 1) % 3], 0x4a90d9, 0.9));
        const t = (h * h - r * r) / (2 * h);
        const O = new THREE.Vector3(0, t, 0);
        const R = h - t;
        const d = mesh(new THREE.SphereGeometry(0.05, 12, 10), new THREE.MeshBasicMaterial({ color: 0xd4b8f2 }));
        d.position.copy(O);
        g.add(d);
        const l = label('O', '#d4b8f2', 0.0032);
        l.position.copy(O).add(new THREE.Vector3(0.18, 0.1, 0));
        g.add(l);
        g.add(segLine(O, tri[0], 0xe8674a, 0.9));
        g.add(ballWire(R, 0xd9a13f));
        return { center: O, R };
      },
    },
  ],
  in: [
    {
      id: 'cubein', name: '正方体 · 内切球与棱切球',
      feature: '正方体中心到 6 个面等距，内切球直径等于棱长；与 12 条棱都相切的棱切球直径是棱长的 √2 倍。两球与外接球同心。',
      formula: '2r = a，2ρ = √2·a',
      example: '正方体棱长 2',
      steps: '2r = 2，2ρ = 2√2',
      answer: 'r = 1，ρ = √2 ≈ 1.414',
      build(g) {
        const s2 = 2;
        const geo = new THREE.BoxGeometry(s2, s2, s2);
        geo.translate(0, s2 / 2, 0);
        const asm = assembleSolid(geo, PAL.cytosol, { opacity: 0.16 });
        g.add(asm.group);
        const c = new THREE.Vector3(0, 1, 0);
        g.add(ballWire(1, 0x2fb3a5, 0.14));
        g.add(ballWire(Math.SQRT2, 0x74bfe8, 0.08));
        return { center: c, R: 1, extra: 'ρ = √2（棱切球，青蓝）' };
      },
    },
    {
      id: 'volume', name: '等体积法',
      feature: '有内切球的多面体：连接球心与各顶点，分成以各个面为底、高都等于 r 的小棱锥，体积相加等于原体积，解出 r。',
      formula: 'V = (1/3)·S·r → r = 3V / S',
      example: '三棱锥 P-ABC 中 PA、PB、PC 两两垂直且都等于 2',
      steps: 'V = 4/3，S = 6 + 2√3',
      answer: 'r = 4/(6+2√3) ≈ 0.423',
      build(g) {
        const P = new THREE.Vector3(0, 0, 0), A = new THREE.Vector3(2, 0, 0), B = new THREE.Vector3(0, 2, 0), C = new THREE.Vector3(0, 0, 2);
        const faces = [[P, A, B, 0x4a90d9], [P, B, C, 0x3fa96f], [P, C, A, 0xd9a13f], [A, B, C, 0x9b6fd9]];
        for (const [f1, f2, f3, col] of faces) {
          const positions = [f1.x, f1.y, f1.z, f2.x, f2.y, f2.z, f3.x, f3.y, f3.z];
          const geo = new THREE.BufferGeometry();
          geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
          geo.setIndex([0, 1, 2]);
          geo.computeVertexNormals();
          g.add(mesh(geo, ghostFace(col, 0.3)));
        }
        const V = 4 / 3, S = 6 + 2 * Math.sqrt(3);
        const r = 3 * V / S;
        const center = new THREE.Vector3(r, r, r);
        const ic = mesh(new THREE.SphereGeometry(r, 26, 18), new THREE.MeshBasicMaterial({ color: 0x2fb3a5, transparent: true, opacity: 0.4, depthWrite: false }));
        ic.position.copy(center);
        g.add(ic);
        g.add(segLine(center, new THREE.Vector3(1, 1, 0), 0xd9a13f, 0.8, true));
        return { center, R: r };
      },
    },
    {
      id: 'pyrin', name: '正棱锥 · 截面法',
      feature: '正棱锥的内切球球心在高上。过高和斜高作截面，球的大圆就是截面三角形的内切圆——内切球半径 = 截面三角形的内切圆半径。',
      formula: 'r = 截面三角形内切圆半径 = S_截 / s_截',
      example: '正四棱锥底面边长 2、高 √3，E、F 为 DA、BC 中点',
      steps: 'PE = PF = 2，EF = 2，S = √3，s = 3',
      answer: 'r = √3/3 ≈ 0.577',
      build(g) {
        const h = Math.sqrt(3);
        const base = [new THREE.Vector3(-1, 0, -1), new THREE.Vector3(1, 0, -1), new THREE.Vector3(1, 0, 1), new THREE.Vector3(-1, 0, 1)];
        const P = new THREE.Vector3(0, h, 0);
        const positions = [];
        const idx = [];
        [[base[0], base[1], P], [base[1], base[2], P], [base[2], base[3], P], [base[3], base[0], P]].forEach((f) => {
          f.forEach((v) => positions.push(v.x, v.y, v.z));
          idx.push(positions.length / 3 - 3, positions.length / 3 - 2, positions.length / 3 - 1);
        });
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
        geo.setIndex(idx);
        geo.computeVertexNormals();
        g.add(mesh(geo, ghostFace(PAL.golgi, 0.22)));
        const E = new THREE.Vector3(-1, 0, 0), F = new THREE.Vector3(1, 0, 0);
        g.add(segLine(E, F, 0x4a90d9, 1));
        g.add(segLine(E, P, 0x4a90d9, 1));
        g.add(segLine(F, P, 0x4a90d9, 1));
        const r = Math.sqrt(3) / 3;
        const center = new THREE.Vector3(0, r, 0);
        g.add(circleRing(center, new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 1), r, 0x2fb3a5, 0.95));
        const ic = mesh(new THREE.SphereGeometry(r, 24, 16), new THREE.MeshBasicMaterial({ color: 0x2fb3a5, transparent: true, opacity: 0.34, depthWrite: false }));
        ic.position.copy(center);
        g.add(ic);
        return { center, R: r };
      },
    },
    {
      id: 'prisin', name: '直棱柱 · 内切球条件',
      feature: '直棱柱有内切球的条件：底面有内切圆，且高等于底面内切圆的直径。球心是上下底面内心连线的中点。',
      formula: 'h = 2r_底 → r = r_底',
      example: '底面是两直角边 3、4 的直角三角形，高 2',
      steps: 'r_底 = (3+4−5)/2 = 1，h = 2 = 2r_底 ✓',
      answer: 'r = 1',
      build(g) {
        /* 3-4-5 直角三角形底（内切圆半径 1），高 2 = 2r → 恰有内切球 */
        const shape = new THREE.Shape();
        shape.moveTo(-1.2, -0.8); shape.lineTo(1.8, -0.8); shape.lineTo(-1.2, 3.2); shape.closePath();
        const geo = new THREE.ExtrudeGeometry(shape, { depth: 2, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 1 });
        geo.rotateX(-Math.PI / 2);
        const asm = assembleSolid(geo, PAL.chloroplast, { opacity: 0.16, joints: false, edgeOpacity: 0.55 });
        g.add(asm.group);
        /* 底面内切圆：Shape 坐标 (−0.2, 0.2) 经 rotateX(−π/2) 落到世界 (−0.2, ·, −0.2) */
        const inC = new THREE.Vector3(-0.2, 0.02, -0.2);
        g.add(circleRing(inC, new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 1), 1, 0x2fb3a5, 0.9));
        const center = inC.clone().setY(1);
        const ic = mesh(new THREE.SphereGeometry(1, 28, 20), new THREE.MeshBasicMaterial({ color: 0x2fb3a5, transparent: true, opacity: 0.14, depthWrite: false }));
        ic.position.copy(center);
        g.add(ic);
        return { center, R: 1 };
      },
    },
    {
      id: 'conein', name: '圆锥 · 轴截面内切圆',
      feature: '圆锥的内切球与轴截面等腰三角形的内切圆是同一个圆：球心在轴上，半径 = 轴截面三角形的内切圆半径。',
      formula: 'r = S_轴截 / s_轴截',
      example: '底面半径 √3，高 3（轴截面恰为正三角形）',
      steps: '边长 2√3，S = 3√3，s = 3√3',
      answer: 'r = 1',
      build(g) {
        const r0 = Math.sqrt(3), h = 3;
        const geo = buildConeGeo(r0, h);
        g.add(mesh(geo, ghostFace(PAL.capsule, 0.15)));
        const tri = [new THREE.Vector3(-r0, 0, 0), new THREE.Vector3(r0, 0, 0), new THREE.Vector3(0, h, 0)];
        g.add(segLine(tri[0], tri[1], 0x4a90d9, 0.9));
        g.add(segLine(tri[1], tri[2], 0x4a90d9, 0.9));
        g.add(segLine(tri[2], tri[0], 0x4a90d9, 0.9));
        const r = 1;
        const center = new THREE.Vector3(0, r, 0);
        g.add(circleRing(center, new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 1), r, 0x2fb3a5, 0.95));
        const ic = mesh(new THREE.SphereGeometry(r, 24, 16), new THREE.MeshBasicMaterial({ color: 0x2fb3a5, transparent: true, opacity: 0.2, depthWrite: false }));
        ic.position.copy(center);
        g.add(ic);
        return { center, R: r };
      },
    },
    {
      id: 'cylin', name: '圆柱 · 轴截面正方形',
      feature: '圆柱装得下内切球，当且仅当轴截面是正方形（h = 2r）：球的大圆内切于这个正方形，球心落在轴的中点，半径与底面半径相等。',
      formula: 'h = 2r，r_球 = r',
      example: '圆柱底面半径 1，高 2',
      steps: '轴截面 2×2 正方形，内切圆半径 1',
      answer: 'r = 1',
      build(g) {
        const r = 1, h = 2;
        const geo = buildCylinderGeo(r, h);
        g.add(mesh(geo, ghostFace(PAL.vacuole, 0.16)));
        const rect = [new THREE.Vector3(-r, 0, 0), new THREE.Vector3(r, 0, 0), new THREE.Vector3(r, h, 0), new THREE.Vector3(-r, h, 0)];
        for (let i = 0; i < 4; i++) g.add(segLine(rect[i], rect[(i + 1) % 4], 0x4a90d9, 0.9));
        const O = new THREE.Vector3(0, h / 2, 0);
        g.add(circleRing(O, new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 1), r, 0x2fb3a5, 0.95));
        const ic = mesh(new THREE.SphereGeometry(r, 24, 16), new THREE.MeshBasicMaterial({ color: 0x2fb3a5, transparent: true, opacity: 0.18, depthWrite: false }));
        ic.position.copy(O);
        g.add(ic);
        g.add(segLine(O, new THREE.Vector3(r, h / 2, 0), 0xe8674a, 0.9));
        return { center: O, R: r };
      },
    },
    {
      id: 'frustin', name: '圆台 · 轴截面条件',
      feature: '圆台想装下内切球，轴截面（等腰梯形）必须先有内切圆：母线恰好等于上下底半径之和 l = r₁ + r₂，此时内切球半径 r = h/2 = √(r₁r₂)。',
      formula: 'l = r₁ + r₂，r = h/2 = √(r₁r₂)',
      example: '上、下底半径 1/2 与 2，高 2',
      steps: 'l = √(2² + 1.5²) = 2.5 = 2 + 0.5 ✓',
      answer: 'r = 1',
      build(g) {
        const r1 = 0.5, r2 = 2, h = 2;
        const geo = buildFrustumRGeo(r1, r2, h);
        g.add(mesh(geo, ghostFace(PAL.vacuole, 0.16)));
        const tri = [new THREE.Vector3(-r2, 0, 0), new THREE.Vector3(r2, 0, 0), new THREE.Vector3(r1, h, 0), new THREE.Vector3(-r1, h, 0)];
        for (let i = 0; i < 4; i++) g.add(segLine(tri[i], tri[(i + 1) % 4], 0x4a90d9, 0.9));
        const r = 1;
        const center = new THREE.Vector3(0, r, 0);
        g.add(circleRing(center, new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 1), r, 0x2fb3a5, 0.95));
        const ic = mesh(new THREE.SphereGeometry(r, 24, 16), new THREE.MeshBasicMaterial({ color: 0x2fb3a5, transparent: true, opacity: 0.18, depthWrite: false }));
        ic.position.copy(center);
        g.add(ic);
        return { center, R: r };
      },
    },
  ],
};

const bs7 = { group: 'circum', id: 'box' };

const secBalls = {
  id: 'balls', title: '外接球与内切球',
  html: `<p>所有顶点都在球面上的球叫<b>外接球</b>；与所有面都相切的球叫<b>内切球</b>。求球的关键是<span class="hl">找球心</span>：常用补形（补成长方体）、过外心作垂线；求内切球常用等体积法与截面法。</p>
<p>本实验把常考模型整理成两张卡片柜：每个模型都给出<b>特征 → 公式 → 例题 → 解答</b>四行，右侧舞台同步画出立体图与辅助线。</p>
<p>切换「外接球 / 内切球」两组，再在模型之间横向对比——同一颗球，不同模型找球心的思路完全不同。</p>`,
  enter() {
    clearGroup(world);
    autoSpin = false;
    world.rotation.y = 0;
    demoShadow.scale.set(1.7, 1, 1.7);
    camTo([4.6, 3.4, 5.4], [0, 1.1, 0]);
    const body = new THREE.Group();
    world.add(body);
    const render = () => {
      clearGroup(body);
      const list = BALL_DATA[bs7.group];
      const m = list.find((x) => x.id === bs7.id) || list[0];
      const info = m.build(body) || {};
      const center = info.center || new THREE.Vector3(0, 1, 0);
      const R = info.R || 1.2;
      body.position.set(0, 0, 0);
      /* 居中：把模型重心抬到 y≈R·0.9 高度附近（build 已按桌面原点建模） */
      /* 自适应构图：仰角与距离随球半径微调，保证球与大球模型完整入画（切模型时相机缓动飞行） */
      const fitR = Math.max(R, 1.2);
      const dd = 7.3 + Math.max(0, fitR - 2.0) * 2.6;
      camTo([dd * 0.615, 1.15 + dd * 0.33, dd * 0.795], [0, Math.min(center.y, 1.3), 0]);
      hset('model', `${m.name}`);
      hset('value', `${m.answer}${info.extra ? '；' + info.extra : ''}`);
      hset('area', `球面面积 S = 4πR² ≈ ${(4 * Math.PI * R * R).toFixed(2)}`);
      renderModelCard(m);
    };
    const renderModelCard = (m) => {
      cardEl.innerHTML = '';
      const rows = [
        ['特征', m.feature],
        ['公式', m.formula],
        ['例', m.example],
        ['解答', `${m.steps}，${m.answer}`],
      ];
      for (const [k, v] of rows) {
        const div = document.createElement('div');
        div.className = 'geo-card-row';
        const b = document.createElement('b');
        b.textContent = k;
        const span = document.createElement('span');
        span.textContent = v;
        div.append(b, span);
        cardEl.appendChild(div);
      }
    };
    const cardEl = document.createElement('div');
    cardEl.className = 'geo-model-card';
    document.getElementById('lesson').appendChild(cardEl);
    render();
    const rebuildControls = () => {
      ctl.clear();
      ctl.seg({
        options: [{ label: '外接球', value: 'circum' }, { label: '内切球', value: 'in' }],
        value: bs7.group,
        onChange: (v) => {
          bs7.group = v;
          bs7.id = BALL_DATA[v][0].id;
          rebuildControls();
          render();
        },
      });
      ctl.sep();
      const list = BALL_DATA[bs7.group];
      ctl.seg({ options: list.map((m) => ({ label: m.name, value: m.id })), value: bs7.id, onChange: (v) => { bs7.id = v; render(); } });
      ctl.sep();
      ctl.toggle({ label: '自动旋转', value: false, onChange: (v) => { autoSpin = v; } });
    };
    rebuildControls();
    setHudRows([['model', '模型'], ['value', '结果'], ['area', '球的表面积']]);
    activeCleanup = () => { cardEl.remove(); };
    chapterTick = () => {};
  },
};

/* ================= 章节 8：正四面体 ================= */

const tt8 = { a: 2.2, balls: true, height: true, cube: false };

const secTetra = {
  id: 'tetra', title: '正四面体',
  html: `<p>四个面清一色是正三角形的四面体，就是<b>正四面体</b>——「最对称」的三棱锥，一堆结论可以直接背：</p>
<p>高 h = √6a/3；体积 <span class="hl">V = √2a³/12</span>；表面积 S = √3a²；外接球 R = √6a/4，内切球 r = √6a/12（R = 3r），棱切球 ρ = √2a/4。三个球的球心都是正四面体的<b>中心 O</b>——它在高 PO₁ 上，把高分成 3 : 1。</p>
<p>侧棱与底面所成角、侧面与底面的二面角都与棱长无关（cosθ = 1/3 那一族）。打开「补形正方体」验证：正四面体的 6 条棱恰是正方体 6 个面的对角线。</p>`,
  enter() {
    clearGroup(world);
    autoSpin = false;
    world.rotation.y = 0;
    demoShadow.scale.set(1.8, 1, 1.8);
    camTo([4.2, 3.2, 5.2], [0, 1, 0]);
    const build = () => {
      clearGroup(world);
      const a = tt8.a;
      const r = a / Math.sqrt(3);
      const h = Math.sqrt(2 / 3) * a;
      let base, apex;
      if (tt8.cube) {
        /* 补形姿态：正四面体顶点 = 正方体相间四顶点（棱 = 面对角线） */
        const b = a / Math.SQRT2, hb = b / 2;
        base = [
          new THREE.Vector3(-hb, 0, -hb),
          new THREE.Vector3(-hb, b, hb),
          new THREE.Vector3(hb, 0, hb),
        ];
        apex = new THREE.Vector3(hb, b, -hb);
      } else {
        base = [
          new THREE.Vector3(r, 0, 0),
          new THREE.Vector3(-r / 2, 0, r * Math.sqrt(3) / 2),
          new THREE.Vector3(-r / 2, 0, -r * Math.sqrt(3) / 2),
        ];
        apex = new THREE.Vector3(0, h, 0);
      }
      const positions = [];
      const idx = [];
      for (let i = 0; i < 3; i++) {
        const j = (i + 1) % 3;
        [base[i], base[j], apex].forEach((v) => positions.push(v.x, v.y, v.z));
        idx.push(i * 3, i * 3 + 1, i * 3 + 2);
      }
      [base[0], base[2], base[1]].forEach((v) => positions.push(v.x, v.y, v.z));
      idx.push(9, 10, 11);
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
      geo.setIndex(idx);
      geo.computeVertexNormals();
      const asm = assembleSolid(geo, PAL.mitoShell, { opacity: 0.2, verts: [...base, apex], jointR: 0.05 });
      world.add(asm.group);
      const O = new THREE.Vector3(0, h / 4, 0);
      if (tt8.cube) {
        const b = a / Math.SQRT2;
        const cube = new THREE.LineSegments(
          new THREE.EdgesGeometry(new THREE.BoxGeometry(b, b, b)),
          new THREE.LineBasicMaterial({ color: 0x4a90d9, transparent: true, opacity: 0.85 }),
        );
        cube.position.set(0, b / 2, 0);
        world.add(cube);
      }
      if (tt8.height && !tt8.cube) {
        world.add(segLine(new THREE.Vector3(0, 0, 0), apex, 0xd9a13f, 0.9));
        const hl2 = label('h', '#ffd98e', 0.0034);
        hl2.position.set(0.2, h / 2, 0);
        world.add(hl2);
        world.add(circleRing(new THREE.Vector3(0, 0, 0), new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 1), r, 0x8a99a8, 0.4));
        const O1 = mesh(new THREE.SphereGeometry(0.045, 12, 10), new THREE.MeshBasicMaterial({ color: 0xd4b8f2 }));
        O1.position.set(0, 0, 0);
        world.add(O1);
        const o1l = label('O₁', '#d4b8f2', 0.003);
        o1l.position.set(0.3, 0.05, 0.1);
        world.add(o1l);
      }
      if (tt8.balls) {
        const R = Math.sqrt(6) / 4 * a, ri = Math.sqrt(6) / 12 * a, rho = Math.SQRT2 / 4 * a;
        const bOut = ballWire(R, 0xd9a13f, 0.09);
        const bIn = ballWire(ri, 0x2fb3a5, 0.16);
        const bMid = ballWire(rho, 0x74bfe8, 0.1);
        [bOut, bIn, bMid].forEach((b) => b.position.copy(O));
        world.add(bOut, bIn, bMid);
        const om = label('O', '#ffe9cf', 0.0036);
        om.position.copy(O).add(new THREE.Vector3(0.16, 0.16, 0));
        world.add(om);
        hset('R', `外接球 R = √6a/4 = ${(R).toFixed(3)}`);
        hset('r', `内切球 r = √6a/12 = ${(ri).toFixed(3)}（R = 3r）`);
        hset('rho', `棱切球 ρ = √2a/4 = ${(rho).toFixed(3)}（三球同心）`);
      } else {
        hset('R', '─'); hset('r', '─'); hset('rho', '─');
      }
      const V = Math.sqrt(2) / 12 * a ** 3;
      const S = Math.sqrt(3) * a * a;
      hset('v', `V = √2a³/12 = ${V.toFixed(2)} · S = √3a² = ${S.toFixed(2)}`);
      hset('h', `h = √6a/3 = ${h.toFixed(3)}（O 把高分成 3 : 1）`);
      hset('ang', '侧棱-底面角 ≈ 54.7°，二面角 cosθ = 1/3 ≈ 70.5°——与棱长无关');
    };
    const rebuildControls = () => {
      ctl.clear();
      ctl.slider({ label: '棱长 a', min: 1.2, max: 3, step: 0.05, value: tt8.a, fmt: (v) => v.toFixed(2), onInput: (v) => { tt8.a = v; build(); } });
      ctl.sep();
      ctl.toggle({ label: '三球（外接 / 内切 / 棱切）', value: tt8.balls, onChange: (v) => { tt8.balls = v; build(); } });
      ctl.toggle({ label: '高与底面外接圆', value: tt8.height, onChange: (v) => { tt8.height = v; build(); } });
      ctl.toggle({ label: '补形正方体', value: tt8.cube, onChange: (v) => { tt8.cube = v; build(); } });
      ctl.sep();
      ctl.toggle({ label: '自动旋转', value: false, onChange: (v) => { autoSpin = v; } });
    };
    rebuildControls();
    setHudRows([['v', '体积 · 表面积'], ['h', '高'], ['R', '外接球'], ['r', '内切球'], ['rho', '棱切球'], ['ang', '两个不变角']]);
    build();
    chapterTick = () => {};
  },
};

/* ================= 章节 9：随堂检测 ================= */

const QUIZ_POOLS = {
  cut: [
    {
      q: '平面截正方体，得到的截面不会是下面哪一种？',
      opts: ['正五边形', '直角三角形', '正六边形', '等腰梯形'],
      a: 1,
      ex: '截面三角形的三条边落在同一顶点的三个面上，三个角都是锐角——截不出直角或钝角三角形。',
      demo(g) {
        demoCubeWithSection(g, new THREE.Vector3(1, 1, 1).normalize(), new THREE.Vector3(0.9, 1.05, 0.2));
      },
    },
    {
      q: '正方体被平面所截，截面最多是几边形？',
      opts: ['四边形', '五边形', '六边形', '八边形'],
      a: 2,
      ex: '正方体只有 6 个面，截面每穿过一个面得到一条边，最多六边形（如过中心的正六边形）。',
      demo(g) {
        demoCubeWithSection(g, new THREE.Vector3(1, 1, 1).normalize(), new THREE.Vector3(0, 1, 0));
      },
    },
    {
      q: '正四面体被平面所截，截面最多是几边形？',
      opts: ['三角形', '四边形', '五边形', '六边形'],
      a: 1,
      ex: '正四面体总共 4 个面，截面最多到四边形为止；平行于一组对棱、过其余棱中点可截出正方形。',
      demo(g) { demoTetraWithSection(g); },
    },
    {
      q: '在正方体里，过 A、C、D₁ 三个顶点的截面是（）',
      opts: ['正三角形', '等腰直角三角形', '矩形', '菱形'],
      a: 0,
      ex: 'AC、CD₁、D₁A 都是面对角线，长度都是 2√2，围成正三角形。',
      demo(g) {
        demoCubeWithSection(g, new THREE.Vector3(-1, -1, 1).normalize(), new THREE.Vector3(0, 0, 0));
      },
    },
    {
      q: '正方体中过 B、D、D₁ 三点的截面是（）',
      opts: ['正方形', '矩形', '菱形', '正三角形'],
      a: 1,
      ex: 'BD = 2√2、BB₁ = 2 且互相垂直，围成矩形而不是正方形。',
      demo(g) {
        demoCubeWithSection(g, new THREE.Vector3(1, 0, 1).normalize(), new THREE.Vector3(0, 0, 0));
      },
    },
    {
      q: '截面可能是三角形的几何体是（）',
      opts: ['球', '圆台', '三棱锥', '圆柱'],
      a: 2,
      ex: '旋转体的平面截面是圆、椭圆或抛物线型曲线，只有多面体（如三棱锥）能截出平直的多边形。',
      demo(g) {
        demoTetraWithSection(g);
      },
    },
  ],
  nets: [
    {
      q: '下面哪种六连方折不成一个正方体？',
      opts: ['一四一型', '二三一型', '二二二型', '含 2×2 田字形的六连方'],
      a: 3,
      ex: '「田」字形折叠时会有两个面重合。11 种真展开图分成一四一 6 种、二三一 3 种、二二二与三三各 1 种。',
      demo(g) { demoBadNet(g); },
    },
    {
      q: '正方体的展开图共有多少种？（镜像相同计 1 种）',
      opts: ['9 种', '10 种', '11 种', '12 种'],
      a: 2,
      ex: '35 种六连方中折得合的只有 11 种——本实验的展开图全部经程序折叠验证。',
      demo(g) { demoGoodNet(g); },
    },
    {
      q: '展开图中判定相对面的规律是（）',
      opts: ['相邻的面相对', '同行同列隔一个面的两面相对，Z 字两端相对', '任意两面都可能相对', '无法从展开图判断'],
      a: 1,
      ex: '同一行或同一列隔着一个面的两个面相对；「Z」字形两端的面也相对。',
      demo(g) { demoGoodNet(g); },
    },
    {
      q: '圆柱的侧面展开图是（）',
      opts: ['扇形', '矩形', '圆', '等腰梯形'],
      a: 1,
      ex: '圆柱侧面展开是矩形：长 = 底面周长 2πr，宽 = 高 h。圆锥侧面展开才是扇形。',
      demo(g) { demoUnrollCylinder(g); },
    },
    {
      q: '正方体棱长 2，一只蚂蚁从顶点 A 沿表面爬到体对角顶点 C₁，最短路程是（）',
      opts: ['4', '2√3', '2√5', '3√2'],
      a: 2,
      ex: '把经过的两个面摊平：L = √(4² + 2²) = 2√5 ≈ 4.47。',
      demo(g) { demoPathCube(g); },
    },
  ],
  views: [
    {
      q: '三视图的投影规律是（）',
      opts: ['长对正、高平齐、宽相等', '长相等、宽对齐', '三个视图互不相关', '只看主视图即可'],
      a: 0,
      ex: '主俯长对正、主左高平齐、俯左宽相等——三块投影面板可以逐格核对。',
      demo(g) { demoBlocksPreset(g, 'jia'); },
    },
    {
      q: '用小正方体搭建组合体，主视图与俯视图如图（俯视 2×2 全占，主视列高 2、1）。最少需要几个方块？',
      opts: ['4 个', '5 个', '6 个', '7 个'],
      a: 1,
      ex: '俯视每个位置至少 1 个（4 个），主视第一列还需要 1 个达到高 2 → 共 5 个。',
      demo(g) { demoBlocksCustom(g, { '0,0': 2, '1,0': 1, '0,1': 1, '1,1': 1 }); },
    },
    {
      q: '同一组合体（俯视 2×2 全占，主视列高 2、1），最多需要几个方块？',
      opts: ['5 个', '6 个', '7 个', '8 个'],
      a: 1,
      ex: '俯视每个位置都堆到该列主视的最高层数：2+2+1+1 = 6。',
      demo(g) { demoBlocksCustom(g, { '0,0': 2, '1,0': 1, '0,1': 2, '1,1': 1 }); },
    },
    {
      q: '两个几何体三视图完全相同，下列说法正确的是（）',
      opts: ['搭法一定相同', '搭法不一定相同', '方块数一定不同', '俯视图一定不同'],
      a: 1,
      ex: '搭法甲 / 乙 / 丙的三视图完全相同，但摆法不同——三视图不能唯一确定几何体。',
      demo(g) { demoBlocksPreset(g, 'bing'); },
    },
    {
      q: '从正左方观察几何体得到的视图叫（）',
      opts: ['主视图', '左视图', '俯视图', '直观图'],
      a: 1,
      ex: '正前方→主视图，正左方→左视图，正上方→俯视图；斜二测画出的才是直观图。',
      demo(g) { demoBlocksPreset(g, 'steps'); },
    },
  ],
};
const quiz9 = { pool: 'cut', idx: 0, score: 0, picked: null, items: [] };
function drawQuiz() {
  const pool = QUIZ_POOLS[quiz9.pool];
  const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, 5);
  quiz9.items = shuffled;
  quiz9.idx = 0;
  quiz9.score = 0;
  quiz9.picked = null;
}

/* —— 答案舞台演示（答完题舞台立刻画出对应立体图） —— */
function demoCubeWithSection(g, n, p0) {
  const d = cubeData(CUBE_S, -CUBE_S / 2, -CUBE_S / 2);
  const geo = new THREE.BoxGeometry(CUBE_S, CUBE_S, CUBE_S);
  geo.translate(0, CUBE_S / 2, 0);
  const asm = assembleSolid(geo, PAL.cytosol, { opacity: 0.14, joints: false, edgeOpacity: 0.55 });
  g.add(asm.group);
  const poly = cutConvex({ verts: d.verts, faces: d.faces }, n.clone().normalize(), p0);
  if (poly.length >= 3) g.add(polyMeshFromPoints(poly, 0xd86a4a, 0.55));
}
function demoTetraWithSection(g) {
  const positions = [];
  const idx = [];
  const { verts, faces } = TETRA_MODEL;
  faces.forEach((f) => {
    for (let k = 1; k < f.length - 1; k++) {
      [f[0], f[k], f[k + 1]].forEach((vi) => positions.push(verts[vi].x, verts[vi].y, verts[vi].z));
      idx.push(positions.length / 3 - 3, positions.length / 3 - 2, positions.length / 3 - 1);
    }
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  geo.translate(0, -0.9, 0);
  g.add(mesh(geo, ghostFace(PAL.mitoShell, 0.2)));
  const model = { verts: verts.map((v) => v.clone().setY(v.y - 0.9)), faces };
  const mid = model.verts;
  const sq = [onEdge(mid[0], mid[1], 0.5), onEdge(mid[1], mid[3], 0.5), onEdge(mid[3], mid[2], 0.5), onEdge(mid[2], mid[0], 0.5)];
  const fm = polyMeshFromPoints(sq, 0xd86a4a, 0.5);
  g.add(fm);
}
function demoGoodNet(g) {
  const folded = buildNetGroup(NETS[0], { colors: NET_COLORS, faceOpacity: 0.3 });
  const cx = NETS[0].reduce((s2, p) => s2 + p[0], 0) / 6;
  const cy = NETS[0].reduce((s2, p) => s2 + p[1], 0) / 6;
  folded.root.position.set(-cx, -cy + 1.7, 0);
  g.add(folded.root);
  applyFold(folded, 0.35);
}
function demoBadNet(g) {
  if (!NETS_BAD.length) return demoGoodNet(g);
  const folded = buildNetGroup(NETS_BAD[0], { colors: NET_COLORS, faceOpacity: 0.34 });
  const cx = NETS_BAD[0].reduce((s2, p) => s2 + p[0], 0) / 6;
  const cy = NETS_BAD[0].reduce((s2, p) => s2 + p[1], 0) / 6;
  folded.root.position.set(-cx, -cy + 1.7, 0);
  g.add(folded.root);
  applyFold(folded, 1);
  markOverlaps(folded);
}
function demoUnrollCylinder(g) {
  const r = 0.8, h = 1.7;
  const band = buildUnrollBand((u, v) => new THREE.Vector3(Math.cos(u * TAU) * r, v * h, Math.sin(u * TAU) * r),
    (u, v) => new THREE.Vector3(u * TAU * r - TAU * r / 2, v * h, 0), 4, 40, ghostFace(PAL.nucleus, 0.4), h);
  g.add(band);
  applyUnroll(band, 0.55);
}
function demoPathCube(g) {
  const geo = new THREE.BoxGeometry(CUBE_S, CUBE_S, CUBE_S);
  geo.translate(0, CUBE_S / 2, 0);
  const asm = assembleSolid(geo, PAL.cytosol, { opacity: 0.13, joints: false, edgeOpacity: 0.5 });
  g.add(asm.group);
  const A = new THREE.Vector3(-1, 0, -1), E = new THREE.Vector3(1, 0, 0), C1 = new THREE.Vector3(1, 2, 1);
  g.add(segLine(A, E, 0xff6a48, 1));
  g.add(segLine(E, C1, 0xff6a48, 1));
  for (const p of [A, E, C1]) {
    const d = mesh(new THREE.SphereGeometry(0.05, 12, 10), new THREE.MeshBasicMaterial({ color: 0xff6a48 }));
    d.position.copy(p);
    g.add(d);
  }
}
function demoBlocksPreset(g, key) {
  const heights = BLOCK_PRESETS[key].heights;
  demoBlocksCustom(g, heights);
}
function demoBlocksCustom(g, heights) {
  const CUB = 0.62;
  const cubeGeo = new THREE.BoxGeometry(CUB, CUB, CUB);
  const mat = matCoat(PAL.cytosol, { roughness: 0.38, clearcoat: 0.6, transparent: true, opacity: 0.5 });
  for (const [keyk, hgt] of Object.entries(heights)) {
    const [i, j] = keyk.split(',').map(Number);
    for (let y = 0; y < hgt; y++) {
      const m = mesh(cubeGeo, mat);
      m.position.set((i - 1.5) * CUB, (y + 0.5) * CUB + 0.02, (j - 1.5) * CUB);
      const e = edgeLine(cubeGeo, 0xa8bccb, 0.7);
      e.position.copy(m.position);
      g.add(m, e);
    }
  }
}

function showQuiz() {
  let panel = document.createElement('div');
  panel.className = 'quiz-panel';
  stage.appendChild(panel);
  drawQuiz();
  let demoGroup = new THREE.Group();
  function renderDemo(q) {
    clearGroup(demoGroup);
    world.remove(demoGroup);
    demoGroup = new THREE.Group();
    world.add(demoGroup);
    camTo([4.2, 3.2, 5.2], [0, 1, 0]);
    try { if (q.demo) q.demo(demoGroup); } catch (err) { /* 演示失败不影响答题 */ }
  }
  function renderQ() {
    const q = quiz9.items[quiz9.idx];
    panel.innerHTML = '';
    demoGroup.visible = false;
    const card = document.createElement('div');
    card.className = 'quiz-card';
    card.innerHTML = `
      <div class="q-progress">第 ${quiz9.idx + 1} / ${quiz9.items.length} 题</div>
      <h3></h3>
      <div class="q-opts"></div>
      <div class="q-explain"></div>
      <div class="q-foot"><span class="q-score">得分：${quiz9.score}</span></div>`;
    card.querySelector('h3').textContent = q.q;
    const optsBox = card.querySelector('.q-opts');
    q.opts.forEach((opt, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'quiz-opt';
      b.textContent = String.fromCharCode(65 + i) + '. ' + opt;
      b.addEventListener('click', () => {
        const correct = i === q.a;
        if (correct) quiz9.score++;
        optsBox.querySelectorAll('.quiz-opt').forEach((bb, j) => {
          bb.disabled = true;
          if (j === q.a) bb.classList.add('correct');
          else if (j === i) bb.classList.add('wrong');
        });
        const ex = card.querySelector('.q-explain');
        ex.textContent = (correct ? '✓ 回答正确。' : '✗ 再想想。') + q.ex;
        ex.classList.add('show');
        card.querySelector('.q-score').textContent = `得分：${quiz9.score}`;
        const foot = card.querySelector('.q-foot');
        const next = document.createElement('button');
        next.type = 'button';
        next.className = 'ctl-btn active';
        next.textContent = quiz9.idx < quiz9.items.length - 1 ? '下一题 →' : '查看成绩 →';
        next.addEventListener('click', () => {
          quiz9.idx++;
          if (quiz9.idx < quiz9.items.length) renderQ();
          else renderResult();
        });
        foot.appendChild(next);
        /* 舞台演示答案 */
        demoGroup.visible = true;
        renderDemo(q);
      });
      optsBox.appendChild(b);
    });
    panel.appendChild(card);
  }
  function renderResult() {
    panel.innerHTML = '';
    demoGroup.visible = false;
    const card = document.createElement('div');
    card.className = 'quiz-card q-result';
    const pct = Math.round((quiz9.score / quiz9.items.length) * 100);
    card.innerHTML = `
      <div class="q-progress">本组检测完成</div>
      <div class="big">答对 ${quiz9.score} / ${quiz9.items.length} 题</div>
      <p style="color:var(--text-dim);margin:4px 0 18px">正确率 ${pct}%${pct >= 80 ? '，立体几何的功力很扎实！' : pct >= 60 ? '，大部分概念已经清楚，回顾一下错题。' : '，建议回到前面章节再看一遍哦。'}</p>`;
    const again = document.createElement('button');
    again.type = 'button';
    again.className = 'ctl-btn active';
    again.textContent = '重新作答';
    again.addEventListener('click', () => { drawQuiz(); renderQ(); });
    const nextPool = document.createElement('button');
    nextPool.type = 'button';
    nextPool.className = 'ctl-btn';
    nextPool.textContent = '换一组';
    nextPool.addEventListener('click', () => { drawQuiz(); renderQ(); });
    const back = document.createElement('button');
    back.type = 'button';
    back.className = 'ctl-btn';
    back.textContent = '返回第一章节';
    back.addEventListener('click', () => { panel.remove(); window.__eduSections.select(0); });
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:10px;justify-content:center;flex-wrap:wrap';
    row.append(back, again, nextPool);
    card.appendChild(row);
    panel.appendChild(card);
  }
  renderQ();
  const rebuildControls = () => {
    ctl.clear();
    ctl.seg({
      options: [{ label: '截面题组', value: 'cut' }, { label: '展开图题组', value: 'nets' }, { label: '三视图题组', value: 'views' }],
      value: quiz9.pool,
      onChange: (v) => { quiz9.pool = v; drawQuiz(); renderQ(); },
    });
    ctl.sep();
    ctl.toggle({ label: '自动旋转', value: false, onChange: (v) => { autoSpin = v; } });
  };
  rebuildControls();
  setHudRows([['group', '题组'], ['progress', '进度'], ['score', '得分']]);
  const syncQuizHud = () => {
    hset('group', { cut: '截面题组', nets: '展开图题组', views: '三视图题组' }[quiz9.pool]);
    hset('progress', quiz9.items.length ? `${Math.min(quiz9.idx + 1, quiz9.items.length)} / ${quiz9.items.length} 题` : '—');
    hset('score', `${quiz9.score} 分`);
  };
  syncQuizHud();
  const origRenderQ = renderQ;
  renderQ = function () { origRenderQ(); syncQuizHud(); };
  activeCleanup = () => { panel.remove(); clearGroup(demoGroup); world.remove(demoGroup); };
  chapterTick = () => {};
}

/* ================= 章节装配 ================= */

const SECTIONS = [secSolids, secNet, secViews, secCut2, secAngles, secVectors, secBalls, secTetra, {
  id: 'quiz', title: '随堂检测',
  html: `<p>截面、展开图、三视图三类题组，每组随机抽 5 题；作答后舞台会演示答案的立体图。</p>`,
  enter() {
    clearGroup(world);
    autoSpin = false;
    world.rotation.y = 0;
    demoShadow.scale.set(1.5, 1, 1.5);
    showQuiz();
  },
}];

/* ================= 布局驱动（三栏 / 折叠 / 专注 / 手风琴 / 快捷键） ================= */

const chapNav = document.getElementById('chapNav');
const chapCount = document.getElementById('chapCount');
const detailNo = document.getElementById('detailNo');
const detailTitle = document.getElementById('detailTitle');
const lessonEl = document.getElementById('lesson');
const detailBody = document.getElementById('detailBody');
const controlsEl = document.getElementById('controls');
const geoShell = document.getElementById('geoShell');
let chapterIdx = 0;

const chapBtns = SECTIONS.map((s, i) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'chap-btn';
  b.dataset.idx = String(i);
  const n = document.createElement('span');
  n.className = 'chap-n';
  n.textContent = String(i + 1).padStart(2, '0');
  const tt = document.createElement('span');
  tt.className = 'chap-t';
  tt.textContent = s.title;
  b.append(n, tt);
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
  chapCount.textContent = `${String(chapterIdx + 1).padStart(2, '0')}/${String(SECTIONS.length).padStart(2, '0')}`;
  detailNo.textContent = String(chapterIdx + 1).padStart(2, '0');
  detailTitle.textContent = sec.title;
  railNoL.textContent = String(chapterIdx + 1).padStart(2, '0');
  railTitleR.textContent = sec.title;
  lessonEl.innerHTML = sec.html || '';
  if (activeCleanup) { activeCleanup(); activeCleanup = null; }
  chapterTick = null;
  sec.enter();
  accSecs.controls.classList.toggle('acc-empty', !controlsEl.children.length);
  accSecs.data.classList.toggle('acc-empty', !document.querySelector('#lcData .hud-card'));
  detailBody.scrollTop = 0;
}

/* 栏折叠 × 专注模式 × 大屏 */
const foldLBtn = document.getElementById('foldLBtn');
const unfoldLBtn = document.getElementById('unfoldLBtn');
const foldRBtn = document.getElementById('foldRBtn');
const unfoldRBtn = document.getElementById('unfoldRBtn');
const railNoL = document.getElementById('railNoL');
const railTitleR = document.getElementById('railTitleR');
const focusBtn = document.getElementById('focusBtn');
const FOLD_KEY = { l: 'geo.foldL', r: 'geo.foldR' };
let foldL = false;
let foldR = false;
let focusSaved = null;
try {
  foldL = localStorage.getItem(FOLD_KEY.l) === '1';
  foldR = localStorage.getItem(FOLD_KEY.r) === '1';
} catch (e) { /* localStorage 不可用时仅会话内生效 */ }
function applyShellFold() {
  geoShell.classList.toggle('fold-l', foldL);
  geoShell.classList.toggle('fold-r', foldR);
  for (const [btn, folded] of [[foldLBtn, foldL], [unfoldLBtn, foldL], [foldRBtn, foldR], [unfoldRBtn, foldR]]) {
    btn.setAttribute('aria-expanded', String(!folded));
  }
}
function setFocus(on) {
  if (on && focusSaved === null) {
    focusSaved = [foldL, foldR];
    foldL = true;
    foldR = true;
  } else if (!on && focusSaved !== null) {
    [foldL, foldR] = focusSaved;
    focusSaved = null;
  }
  geoShell.classList.toggle('focus-mode', on);
  focusBtn.textContent = on ? '退出专注' : '专注模式';
  focusBtn.setAttribute('aria-pressed', String(on));
  applyShellFold();
}
function toggleFold(side) {
  if (focusSaved !== null) setFocus(false);
  if (side === 'l') foldL = !foldL;
  else foldR = !foldR;
  try { localStorage.setItem(FOLD_KEY[side], (side === 'l' ? foldL : foldR) ? '1' : '0'); } catch (e) { /* 忽略 */ }
  applyShellFold();
}
foldLBtn.addEventListener('click', () => toggleFold('l'));
unfoldLBtn.addEventListener('click', () => toggleFold('l'));
foldRBtn.addEventListener('click', () => toggleFold('r'));
unfoldRBtn.addEventListener('click', () => toggleFold('r'));
focusBtn.addEventListener('click', () => setFocus(focusSaved === null));
applyShellFold();

/* 右栏三块手风琴（详解 / 控件 / 读数），localStorage 记忆、切章不重置 */
const ACC_KEYS = { lesson: 'geo.accLesson', controls: 'geo.accControls', data: 'geo.accData' };
const accSecs = {
  lesson: document.getElementById('accLesson'),
  controls: document.getElementById('accControls'),
  data: document.getElementById('accData'),
};
const NARROW_VIEW = window.innerWidth <= 1100;
const accClosed = {};
for (const name of Object.keys(accSecs)) {
  let saved = null;
  try { saved = localStorage.getItem(ACC_KEYS[name]); } catch (e) { /* 忽略 */ }
  accClosed[name] = saved !== null ? saved === '1' : (name === 'data' && NARROW_VIEW);
}
function applyAcc(name) {
  const sec2 = accSecs[name];
  sec2.classList.toggle('closed', accClosed[name]);
  sec2.querySelector('.acc-head').setAttribute('aria-expanded', String(!accClosed[name]));
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

/* 舞台工具：重做 / 模型标签 / 视角 / 风格 / 全屏 / 大屏 + 键盘 ← → ] R T F */
const chapPrev = document.getElementById('chapPrev');
const chapNext = document.getElementById('chapNext');
const resetBtn = document.getElementById('resetBtn');
const labelBtn = document.getElementById('labelBtn');
const viewBtn = document.getElementById('viewBtn');
const styleBtn = document.getElementById('styleBtn');
const fsBtn = document.getElementById('fsBtn');
const bigBtn = document.getElementById('bigBtn');

function gotoChapter(i) { selectChapter((i + SECTIONS.length) % SECTIONS.length); }
chapPrev.addEventListener('click', () => gotoChapter(chapterIdx - 1));
chapNext.addEventListener('click', () => gotoChapter(chapterIdx + 1));
resetBtn.addEventListener('click', () => {
  selectChapter(chapterIdx);
  toast('工作台已复位，回到本章初始状态。', 'ok');
});
let labelsOn = true;
try { labelsOn = localStorage.getItem('geo.labels') !== '0'; } catch (e) { /* 忽略 */ }
function applyLabels() {
  for (const s of equipLabels) s.visible = labelsOn;
  labelBtn.classList.toggle('on', labelsOn);
  labelBtn.setAttribute('aria-pressed', String(labelsOn));
}
labelBtn.addEventListener('click', () => {
  labelsOn = !labelsOn;
  try { localStorage.setItem('geo.labels', labelsOn ? '1' : '0'); } catch (e) { /* 忽略 */ }
  applyLabels();
});
applyLabels();
viewBtn.addEventListener('click', () => {
  app.setCamera([4.8, 3.6, 6.2], [0, 0.9, 0]);
  toast('视角已复位。', 'ok');
});
styleBtn.addEventListener('click', () => {
  sceneStyle = sceneStyle === 'studio' ? 'paper' : 'studio';
  try { localStorage.setItem('geo.style', sceneStyle); } catch (e) { /* 忽略 */ }
  applyStyle();
});
fsBtn.addEventListener('click', () => {
  if (document.fullscreenElement) document.exitFullscreen();
  else document.documentElement.requestFullscreen?.().catch(() => toast('浏览器拒绝了全屏请求。', 'warn'));
});
let bigMode = false;
function applyBig() {
  document.body.classList.toggle('geo-big', bigMode);
  bigBtn.classList.toggle('on', bigMode);
  bigBtn.setAttribute('aria-pressed', String(bigMode));
}
bigBtn.addEventListener('click', () => {
  bigMode = !bigMode;
  setFocus(bigMode);
  applyBig();
});
applyBig();
applyStyle();
window.addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const t = e.target;
  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
  if (e.key === 'ArrowLeft' || e.key === ',') gotoChapter(chapterIdx - 1);
  else if (e.key === 'ArrowRight' || e.key === '.') gotoChapter(chapterIdx + 1);
  else if (e.key === ']') toggleFold('r');
  else if (e.key === 'r' || e.key === 'R') { app.setCamera([4.8, 3.6, 6.2], [0, 0.9, 0]); toast('视角已复位（R）。', 'ok'); }
  else if (e.key === 't' || e.key === 'T') styleBtn.click();
  else if (e.key === 'f' || e.key === 'F') fsBtn.click();
});

/* 提示条 */
function toast(text, kind = 'ok') {
  const old = stage.querySelector('.geo-toast');
  if (old) old.remove();
  const el = document.createElement('div');
  el.className = 'geo-toast ' + kind;
  el.textContent = text;
  stage.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 300);
  }, 2200);
}

/* ================= 帧循环与启动 ================= */

app.onFrame((dt, t) => {
  if (chapterTick) chapterTick(dt, t);
  if (autoSpin) {
    world.rotation.y += dt * 0.4;
  }
});

setTimeout(() => {
  loader.hide();
  window.__eduSections = { select: selectChapter };
  window.__geoDebug = { vfx, app, NETS };
  selectChapter(0);
}, 60);
