/* EduLab · 体液免疫（immune）—— R07 Micro 级建模深改
 * =====================================================================
 * 章节：人体的三道防线 / 体液免疫的过程 / 二次免疫与疫苗 / 免疫失调：过敏反应 / 随堂检测
 *
 * 布局（micro 三件套移植）：真·三栏——左栏章节大纲（点击切章 + ‹01/05› 前后翻）/ 中栏 3D 免疫舞台
 *   （切章相机飞行）/ 右栏 知识点详解 + 实验控件 + 数据读数与实验记录；左右栏独立折叠（28px 竖条）
 *   + 专注模式 + 大屏课堂模式 + 右栏三块手风琴（immune.acc* 记忆，切章不重置）。
 *
 * 视觉工艺（edu-vfx 接入 + Micro 级建模密度）：
 *   - 实验台语境：木纹桌面 + 培养皿（琼脂面菌落斑点）/ 试剂瓶（标签贴图）/ 试管架 / 玻片盒道具阵列，
 *     道具带接触阴影与桌面反射（makeStudioEnvironment）。
 *   - 皮肤剖面（第一/二道防线）：五层真剖面——角质层鳞片阵列 + 表皮细胞双层阵列（含核）+ 真皮
 *     （胶原纤维束 / 动静脉血管袢 / 神经纤维 / 毛囊+皮脂腺 / 汗腺盘曲）+ 皮下脂肪小叶 + 筋膜；
 *     破损伤口为表皮断开 + 真皮外露 + 渗出液高光面；炎症相毛细血管扩张 + 中性粒细胞钻出血管壁。
 *   - 免疫细胞工厂（全部 ghost 化可透视）：包膜病毒（刺突 instanced + 螺旋核衣壳）/ 球菌链
 *     （荚膜 halo + 鞭毛）/ 树突状细胞（CatmullRom 放样二级树突 + MHC 呈递小板）/ 辅助性 T /
 *     B 细胞（受体簇 instanced，fibonacci 球面布点）/ 浆细胞（粗面内质网板层 + 高尔基扁囊 +
 *     分泌小泡）/ 记忆 B / 巨噬细胞（fbm 变形虫轮廓 + 伪足 + 溶酶体颗粒）/ 中性粒细胞（分叶核）/
 *     肥大细胞（颗粒满载）/ 抗体 Y（重轻链 + 铰链 + 抗原结合域）/ 花粉过敏原（刺突网纹）。
 *   - 曲线图两块（CanvasTexture 程序化绘制）：细菌数量·发病线（三道防线章）/ 抗体浓度·对数坐标
 *     双曲线 + 事件竖线（二次免疫章），网格/坐标/图例全矢量绘制。
 *
 * 教学交互（原版功能块 1:1 对齐，文案全部自研改写）：
 *   - 三道防线：入侵途径三选（完整皮肤 / 破损伤口 / 大量入侵）+ 关闭吞噬细胞 + 时间轴推演
 *     （屏障阻挡 / 炎症募集 / 吞噬消化 / 三道协同 / 突破扩散五种结局）+ 细菌数量曲线与发病线判定。
 *   - 体液免疫过程：12 步链（病毒入结 → 第一信号 → 树突状细胞摄取呈递 → 辅助性 T 识别结合 →
 *     细胞因子 → B 细胞增殖分化 → 浆细胞分泌抗体 → 特异性结合 → 沉淀清除），下一步 / 自动播放，
 *     去掉辅助性 T / 缺少细胞因子两种缺失对照，弱化结局逐段演示。
 *   - 二次免疫与疫苗：第 0 天起的时间轴（接种疫苗 → 感染原株 → 感染变异株任意编排），对数坐标
 *     双抗体曲线（原株/变异株），初次慢而弱 / 二次快而强 / 变异株部分识别，发病线判定
 *     （ protected / 发病 两种结局）+ 实验记录。
 *   - 过敏反应：致敏相（首次接触 → IgE 生成 → 吸附肥大细胞）与发作相（再次进入 → 交联 →
 *     脱颗粒释放组胺 → 血管通透性增强 → 红肿流涕），抗组胺药开关（受体占据、组胺照释但不起效）。
 *   - 随堂检测：8 题覆盖五道防线 / 双信号 / 浆细胞 / 二次免疫 / 变异株 / HIV / 过敏。
 *
 * 全局：‹ › 或 ← → 切章（原版上一/下一课题）/ ] 收起右栏 / R 复位视角 / 重做 / 模型标签 / 大屏。
 * =====================================================================
 */
import {
  THREE, TAU, clamp,
  createApp, makeLoader, createControlsPanel, makeHUD, makeTextSprite, setSpriteText,
} from './edu-core.js';
import {
  attachVFX, PAL,
  matCoat, matSheen, matStd, matGlass, matGlow,
  makeStudioEnvironment, makeWoodTexture, makeLabelTexture,
  ghostify,
} from './edu-vfx.js';

/* ---------------- 场景与工艺接入 ---------------- */

const stage = document.getElementById('stage');
const loader = makeLoader(stage, '正在培养免疫细胞…');
const app = createApp({
  container: stage,
  fov: 42, near: 0.1, far: 200,
  cameraPos: [0, 2.0, 13.2],
  target: [0, 0.3, 0],
  minDistance: 1.0, maxDistance: 60,
  exposure: 1.04,
  keepBackground: true,
});
const { scene } = app;
const vfx = attachVFX(app, 'illus');
scene.environment = makeStudioEnvironment(app.renderer);

/* 灯光：暖主光 + 冷补光 + 正面柔光 + 低环境（生物组织的柔润感靠这三层） */
const keyLight = new THREE.DirectionalLight(0xffe4c4, 1.15);
keyLight.position.set(4.5, 7, 5.5);
scene.add(keyLight);
const fillLight = new THREE.DirectionalLight(0xcfe0ff, 0.4);
fillLight.position.set(-5, 3.5, -3.5);
scene.add(fillLight);
const frontLight = new THREE.DirectionalLight(0xf2f6ff, 0.32);
frontLight.position.set(0, 2.4, 6);
scene.add(frontLight);
scene.add(new THREE.AmbientLight(0x9aa0a8, 0.4));

/* ---------------- 免疫色族（全部从 PAL 取色；派生档用 Color 运算生成，不裸写新十六进制） ---------------- */

const CV = {
  virus: PAL.mitoShell,        // 包膜病毒体（暖橙红族）
  virusDeep: PAL.cristae,      // 病毒刺突/深部
  virusCore: PAL.dna,          // 核衣壳核酸（荧光紫）
  bact: PAL.pili,              // 化脓性球菌（灰绿族）
  bactHi: PAL.stroma,
  apc: PAL.ser,                // 树突状细胞（青绿）
  tcell: PAL.vacuole,          // 辅助性 T（天蓝）
  bcell: PAL.nucleus,          // B 细胞（紫）
  plasma: PAL.golgi,           // 浆细胞（橙黄）
  memory: PAL.nucleolus,       // 记忆 B（深紫）
  macro: PAL.membraneDeep,     // 巨噬细胞（暖棕）
  macroHi: PAL.membrane,
  neutro: PAL.granule,         // 中性粒细胞（浅粉）
  mast: PAL.lysosome,          // 肥大细胞（洋红）
  granule: PAL.granule,
  ab: PAL.vesicle,             // 抗体（金黄）
  abIgE: PAL.actin,            // IgE（品红）
  hist: PAL.granule,           // 组胺
  pollen: PAL.starch,          // 花粉（米黄）
  mucus: PAL.capsule,          // 黏液（浅青）
  vesselA: PAL.mitoInner,      // 动脉（红）
  vesselV: PAL.thylakoid,      // 静脉（深青绿）
  tissue: PAL.membraneHi,      // 组织液
};
/* 派生色（运行时由 PAL 计算的亮/暗档，用于 Canvas 图表与描边） */
function palCss(key, mul = 1) {
  const c = new THREE.Color(CV[key] !== undefined ? CV[key] : PAL[key]);
  c.multiplyScalar(mul);
  return '#' + c.getHexString();
}
function shade(key, mul) { return palCss(key, mul); }

/* ---------------- 通用工具 ---------------- */

const mesh = (geo, mat) => new THREE.Mesh(geo, mat);
function label(text, color = '#ffe9cf', scale = 0.0044) {
  return makeTextSprite(text, { fontSize: 34, color, scale, bg: 'rgba(10,14,20,0.68)' });
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
/* 接触阴影贴片：径向渐变烘焙 */
function makeShadowBlob(radius = 1.2, alpha = 0.32) {
  const tex = canvasTex(128, 128, (ctx) => {
    const g = ctx.createRadialGradient(64, 64, 6, 64, 64, 62);
    g.addColorStop(0, `rgba(6,9,13,${alpha})`);
    g.addColorStop(0.55, `rgba(6,9,13,${alpha * 0.5})`);
    g.addColorStop(1, 'rgba(6,9,13,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
  });
  const m = mesh(new THREE.PlaneGeometry(radius * 2, radius * 2), new THREE.MeshBasicMaterial({
    map: tex, transparent: true, depthWrite: false,
  }));
  m.rotation.x = -Math.PI / 2;
  m.renderOrder = 1;
  return m;
}
/* fibonacci 球面均匀布点（受体 / 刺突朝向用） */
function fibSphere(n, r = 1) {
  const pts = [];
  const ga = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - ((i + 0.5) / n) * 2;
    const rad = Math.sqrt(1 - y * y);
    const th = ga * i;
    pts.push(new THREE.Vector3(Math.cos(th) * rad * r, y * r, Math.sin(th) * rad * r));
  }
  return pts;
}
const _m4 = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _v = new THREE.Vector3();
const _s = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0);
function setInst(im, i, pos, dir, scl, len = 1) {
  _q.setFromUnitVectors(UP, dir.clone().normalize());
  _v.copy(pos);
  _s.set(scl, scl * len, scl);
  _m4.compose(_v, _q, _s);
  im.setMatrixAt(i, _m4);
}

/* ---------------- 时间轴步进器（三道防线 / 体液免疫 / 过敏反应共用） ---------------- */

class Sequencer {
  constructor() {
    this.steps = [];
    this.idx = -1;
    this.t = 0;
    this.playing = false;
    this.auto = true;      // true=步末自动接续；false=单步（等"下一步"）
    this.speed = 1;
    this.onStep = null;    // (idx, step)
    this.onDone = null;
  }
  load(steps) {
    this.steps = steps;
    this.stop();
  }
  start(i = 0) {
    this.idx = clamp(i, 0, this.steps.length - 1);
    this.t = 0;
    this.playing = true;
    const s = this.steps[this.idx];
    if (s.begin) s.begin();
    if (s.msg) s.msg();
    if (this.onStep) this.onStep(this.idx, s);
  }
  next() {
    if (this.idx + 1 < this.steps.length) this.start(this.idx + 1);
    else { this.playing = false; if (this.onDone) this.onDone(); }
  }
  pause() { this.playing = false; }
  resume() { if (this.idx >= 0) this.playing = true; }
  stop() { this.idx = -1; this.t = 0; this.playing = false; }
  get current() { return this.idx >= 0 ? this.steps[this.idx] : null; }
  tick(dt) {
    if (!this.playing || this.idx < 0) return;
    const s = this.steps[this.idx];
    this.t += dt * this.speed;
    const k = clamp(this.t / s.dur, 0, 1);
    if (s.apply) s.apply(k, dt * this.speed);
    if (this.t >= s.dur) {
      if (this.auto && this.idx + 1 < this.steps.length) this.start(this.idx + 1);
      else {
        this.playing = false;
        if (this.idx + 1 >= this.steps.length && this.onDone) this.onDone();
      }
    }
  }
}

/* ================= 实验台（桌面 + 道具阵列，全章共享） ================= */

const DESK_Y = 0;
const deskGroup = new THREE.Group();
scene.add(deskGroup);
const world = new THREE.Group();   // 各章教学内容挂这里（随章切换显隐的是其子组）
scene.add(world);

/* 桌面：木纹 + 厚板 + 裙板 */
{
  const wood = makeWoodTexture({ base: '#6d4a30', dark: '#4c3018', light: '#8d6440', bands: 8, streaks: 110, planks: 4, seed: 23 });
  wood.repeat.set(2.6, 1.7);
  const topMat = matStd(0xffffff, { roughness: 0.6, metalness: 0.04 });
  topMat.map = wood;
  const top = mesh(new THREE.BoxGeometry(16, 0.22, 10.6), topMat);
  top.position.y = DESK_Y - 0.11;
  deskGroup.add(top);
  const skirtMat = matStd(0x54381f, { roughness: 0.7 });
  for (const z of [5.1, -5.1]) {
    const sk = mesh(new THREE.BoxGeometry(15.6, 0.6, 0.3), skirtMat);
    sk.position.set(0, DESK_Y - 0.5, z);
    deskGroup.add(sk);
  }
  for (const x of [-7.8, 7.8]) {
    const side = mesh(new THREE.BoxGeometry(0.3, 0.6, 9.9), skirtMat);
    side.position.set(x, DESK_Y - 0.5, 0);
    deskGroup.add(side);
  }
}

/* 玻璃培养皿：皿体 + 琼脂面（菌落斑点纹理）+ 皿盖 */
function makePetriDish(r = 0.95) {
  const g = new THREE.Group();
  const glass = matGlass(0xdfeef2, { transmission: 0.9, opacity: 0.5 });
  const wall = mesh(new THREE.CylinderGeometry(r, r, 0.16, 40, 1, true), glass);
  wall.position.y = 0.08;
  const bottom = mesh(new THREE.CylinderGeometry(r, r, 0.03, 40), glass);
  bottom.position.y = 0.015;
  g.add(wall, bottom);
  /* 琼脂面：暖米黄 + 细菌斑点 + 划线 */
  const agarTex = canvasTex(256, 256, (ctx) => {
    ctx.fillStyle = palCss('tissue', 0.92);
    ctx.fillRect(0, 0, 256, 256);
    const rnd = mulberry32(9);
    for (let i = 0; i < 46; i++) {
      const a = rnd() * TAU, d = rnd() * 118;
      const x = 128 + Math.cos(a) * d, y = 128 + Math.sin(a) * d;
      ctx.fillStyle = rnd() > 0.5 ? palCss('bact', 0.85) : palCss('virus', 0.75);
      ctx.beginPath();
      ctx.arc(x, y, 1.4 + rnd() * 3.4, 0, TAU);
      ctx.fill();
    }
    ctx.strokeStyle = 'rgba(90,80,60,0.28)';
    ctx.lineWidth = 2;
    for (let k = 0; k < 4; k++) {
      ctx.beginPath();
      ctx.moveTo(30 + k * 18, 40);
      ctx.lineTo(90 + k * 18, 210);
      ctx.stroke();
    }
  });
  const agar = mesh(new THREE.CylinderGeometry(r * 0.92, r * 0.92, 0.05, 40), matStd(0xffffff, { roughness: 0.9 }));
  agar.material.map = agarTex;
  agar.position.y = 0.05;
  g.add(agar);
  const lid = mesh(new THREE.CylinderGeometry(r * 1.02, r * 1.02, 0.05, 40), glass);
  lid.position.y = 0.21;
  g.add(lid);
  return g;
}

/* 试剂瓶：瓶身 + 瓶肩 + 瓶口盖 + 标签贴图 */
function makeReagentBottle(text, accentKey = 'virus', h = 1.15, r = 0.34) {
  const g = new THREE.Group();
  const body = mesh(new THREE.CylinderGeometry(r, r * 1.08, h * 0.72, 26), matGlass(0xe6f0f0, { transmission: 0.86, opacity: 0.6 }));
  body.position.y = h * 0.36 + 0.05;
  const shoulder = mesh(new THREE.CylinderGeometry(r * 0.42, r, h * 0.16, 26), matGlass(0xe6f0f0, { transmission: 0.86, opacity: 0.6 }));
  shoulder.position.y = h * 0.8 + 0.05;
  const neck = mesh(new THREE.CylinderGeometry(r * 0.42, r * 0.42, h * 0.1, 20), matGlass(0xe6f0f0, { transmission: 0.86, opacity: 0.6 }));
  neck.position.y = h * 0.93 + 0.05;
  const cap = mesh(new THREE.CylinderGeometry(r * 0.5, r * 0.5, h * 0.09, 20), matStd(PAL.brass, { roughness: 0.35, metalness: 0.85 }));
  cap.position.y = h * 1.0 + 0.05;
  g.add(body, shoulder, neck, cap);
  /* 瓶内液体 */
  const fluid = mesh(new THREE.CylinderGeometry(r * 0.94, r * 0.98, h * 0.5, 26), matStd(CV.virus, { roughness: 0.3, transparent: true, opacity: 0.42 }));
  fluid.position.y = h * 0.3 + 0.05;
  g.add(fluid);
  /* 标签：纸底 + 边框 + 名称两行 */
  const labTex = makeLabelTexture([text, 'IMMUNE·LAB'], { w: 256, h: 140, accent: palCss(accentKey, 0.9), lineSizes: [34, 22] });
  const lab = mesh(new THREE.PlaneGeometry(r * 1.7, h * 0.5), new THREE.MeshStandardMaterial({ map: labTex, roughness: 0.85 }));
  lab.position.set(0, h * 0.42 + 0.05, r * 1.04);
  g.add(lab);
  const lab2 = lab.clone();
  lab2.rotation.y = Math.PI;
  lab2.position.z = -r * 1.04;
  g.add(lab2);
  return g;
}

/* 试管架：横梁 + 立柱 + 三支试管（液体色不同 + 磨砂盖） */
function makeTubeRack() {
  const g = new THREE.Group();
  const wood = matStd(0x6a4a2e, { roughness: 0.65 });
  const beam = mesh(new THREE.BoxGeometry(1.9, 0.08, 0.3), wood);
  beam.position.y = 0.34;
  const base = mesh(new THREE.BoxGeometry(1.9, 0.06, 0.34), wood);
  base.position.y = 0.03;
  g.add(beam, base);
  for (const x of [-0.9, 0.9]) {
    const post = mesh(new THREE.BoxGeometry(0.09, 0.34, 0.09), wood);
    post.position.set(x, 0.17, 0);
    g.add(post);
  }
  const fluids = [CV.ab, CV.tcell, CV.plasma];
  fluids.forEach((c, i) => {
    const x = -0.6 + i * 0.6;
    const tube = mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.62, 16, 1, true), matGlass(0xdfeef2, { transmission: 0.9, opacity: 0.5 }));
    tube.position.set(x, 0.36, 0);
    const liq = mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.4, 14), matStd(c, { roughness: 0.3, transparent: true, opacity: 0.55 }));
    liq.position.set(x, 0.3, 0);
    const cap = mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.06, 14), matStd(PAL.steel, { roughness: 0.4, metalness: 0.7 }));
    cap.position.set(x, 0.7, 0);
    g.add(tube, liq, cap);
  });
  return g;
}

/* 玻片盒：木盒 + 内嵌玻璃片阵列 */
function makeSlideBox() {
  const g = new THREE.Group();
  const boxMat = matStd(0x5e4026, { roughness: 0.7 });
  const box = mesh(new THREE.BoxGeometry(1.5, 0.24, 0.7), boxMat);
  box.position.y = 0.12;
  g.add(box);
  const glass = matGlass(0xdfeef2, { transmission: 0.92, opacity: 0.5 });
  for (let i = 0; i < 4; i++) {
    const sl = mesh(new THREE.BoxGeometry(0.28, 0.02, 0.6), glass);
    sl.position.set(-0.45 + i * 0.3, 0.25 - i * 0.004, 0);
    g.add(sl);
  }
  return g;
}

/* 道具阵列摆位（桌面后缘一排，各章共享语境） */
const propsGroup = new THREE.Group();
deskGroup.add(propsGroup);
const equipLabels = [];
{
  const dish = makePetriDish(0.95);
  dish.position.set(-5.6, 0, -3.5);
  propsGroup.add(dish);
  const dishShadow = makeShadowBlob(1.15, 0.3);
  dishShadow.position.set(-5.6, 0.004, -3.5);
  propsGroup.add(dishShadow);

  const b1 = makeReagentBottle('营养琼脂', 'bact');
  b1.position.set(-3.9, 0, -3.9);
  propsGroup.add(b1);
  const b2 = makeReagentBottle('抗血清', 'ab', 1.0, 0.3);
  b2.position.set(-3.0, 0, -3.7);
  propsGroup.add(b2);

  const rack = makeTubeRack();
  rack.position.set(4.6, 0, -3.9);
  rack.rotation.y = -0.28;
  propsGroup.add(rack);

  const slideBox = makeSlideBox();
  slideBox.position.set(2.7, 0, -4.1);
  slideBox.rotation.y = 0.2;
  propsGroup.add(slideBox);

  const lblDish = label('培养皿 · 菌落计数', '#dfe8ee', 0.0034);
  lblDish.position.set(-5.6, 1.15, -3.5);
  const lblRack = label('血清试管架', '#dfe8ee', 0.0034);
  lblRack.position.set(4.6, 1.2, -3.9);
  propsGroup.add(lblDish, lblRack);
  equipLabels.push(lblDish, lblRack);
}

/* ================= 免疫细胞工厂（ghost 化 · Micro 级工艺） ================= */

/* ——— 包膜病毒（单个精雕版）：包膜 + 刺突 + 螺旋核衣壳 ——— */
function makeVirusHero(scale = 1) {
  const g = new THREE.Group();
  const R = 0.3;
  /* 包膜：clearcoat 膜壳，ghost 化可透视 */
  const envMat = ghostify(matCoat(CV.virus, { roughness: 0.32, clearcoat: 0.9 }), 0.4);
  g.add(mesh(new THREE.SphereGeometry(R, 26, 20), envMat));
  /* 螺旋核衣壳：两条相位差 π 的螺旋链 + 中心链 */
  const coreMat = matGlow(CV.virusCore, 0.55, { roughness: 0.5 });
  for (const ph of [0, Math.PI, Math.PI / 2]) {
    const pts = [];
    for (let i = 0; i <= 40; i++) {
      const t = i / 40;
      const a = t * TAU * 2.6 + ph;
      const y = (t - 0.5) * 0.4;
      pts.push(new THREE.Vector3(Math.cos(a) * 0.12, y, Math.sin(a) * 0.12));
    }
    const helix = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, 0.02, 5);
    g.add(mesh(helix, coreMat));
  }
  /* 刺突：柄 + 头（club 形），fibonacci 布点朝外 */
  const dirs = fibSphere(16, 1);
  const stalkMat = matStd(CV.virusDeep, { roughness: 0.45 });
  const headMat = matCoat(CV.virus, { roughness: 0.3, clearcoat: 0.8 });
  const stalks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.012, 0.02, 0.12, 6), stalkMat, dirs.length);
  const heads = new THREE.InstancedMesh(new THREE.SphereGeometry(0.05, 10, 8), headMat, dirs.length);
  dirs.forEach((d, i) => {
    const p0 = d.clone().multiplyScalar(R);
    setInst(stalks, i, p0.add(d.clone().multiplyScalar(0.05)), d, 1);
    setInst(heads, i, d.clone().multiplyScalar(R + 0.14), d, 1);
  });
  g.add(stalks, heads);
  g.scale.setScalar(scale);
  return g;
}

/* ——— 球菌链（化脓性链球菌）：菌体链 + 荚膜 halo + 鞭毛 ——— */
function makeCoccusChain(n = 4, scale = 1) {
  const g = new THREE.Group();
  const bodyMat = matCoat(CV.bact, { roughness: 0.4, clearcoat: 0.5 });
  const capsMat = ghostify(matSheen(CV.bactHi, { roughness: 0.7 }), 0.22);
  const r = 0.14;
  for (let i = 0; i < n; i++) {
    const y = (i - (n - 1) / 2) * r * 1.75;
    const b = mesh(new THREE.SphereGeometry(r, 16, 12), bodyMat);
    b.position.y = y;
    const cap = mesh(new THREE.SphereGeometry(r * 1.45, 14, 10), capsMat);
    cap.position.y = y;
    g.add(b, cap);
  }
  /* 鞭毛：正弦波浪管 */
  const pts = [];
  for (let i = 0; i <= 26; i++) {
    const t = i / 26;
    pts.push(new THREE.Vector3(
      Math.sin(t * TAU * 1.6) * 0.16,
      -n * r * 0.9 - t * 0.4,
      Math.cos(t * TAU * 1.6) * 0.16,
    ));
  }
  const flag = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 44, 0.012, 5);
  g.add(mesh(flag, matStd(CV.bactHi, { roughness: 0.6 })));
  g.scale.setScalar(scale);
  return g;
}

/* ——— 球菌群（instanced 化 swarm）：菌体 + 荚膜两组 instanced ——— */
class CoccusSwarm {
  constructor(n = 36) {
    this.n = n;
    this.body = new THREE.InstancedMesh(new THREE.SphereGeometry(0.13, 12, 10), matCoat(CV.bact, { roughness: 0.42, clearcoat: 0.5 }), n);
    this.caps = new THREE.InstancedMesh(new THREE.SphereGeometry(0.185, 10, 8), ghostify(matSheen(CV.bactHi, { roughness: 0.7 }), 0.2), n);
    this.body.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.caps.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.g = new THREE.Group();
    this.g.add(this.body, this.caps);
    this.poses = [];
    const rnd = mulberry32(31);
    for (let i = 0; i < n; i++) this.poses.push(new THREE.Vector3((rnd() - 0.5) * 3, 0.9 + rnd() * 1.6, (rnd() - 0.5) * 1.6));
    this.apply(0);
  }
  /* visible: 显示数量比例 0..1；clump: 0..1 越大越向凝集中心聚拢 */
  apply(visible, clump = 0, centers = null) {
    const k = Math.round(clamp(visible, 0, 1) * this.n);
    this.body.count = k;
    this.caps.count = k;
    for (let i = 0; i < k; i++) {
      let p = this.poses[i];
      if (clump > 0 && centers) {
        const c = centers[i % centers.length];
        p = p.clone().lerp(c, clump);
      }
      const bob = Math.sin(performance.now() * 0.0013 + i * 2.1) * 0.05;
      const pos = new THREE.Vector3(p.x, p.y + bob, p.z);
      const dir = new THREE.Vector3(Math.sin(i * 2.7), 0.6, Math.cos(i * 1.9)).normalize();
      setInst(this.body, i, pos, dir, 1);
      setInst(this.caps, i, pos, dir, 1);
    }
    this.body.instanceMatrix.needsUpdate = true;
    this.caps.instanceMatrix.needsUpdate = true;
  }
}

/* ——— 通用免疫细胞（ghost 双壳 + 核 + 受体簇 + 细胞器可选件） ——— */
function makeImmuneCell({
  r = 0.5, color = CV.tcell, deep = null, receptors = 0, recColor = null,
  nucleus = true, er = 0, golgi = false, vesicles = 0, granules = 0,
  lobed = 0, opacity = 0.5,
} = {}) {
  const g = new THREE.Group();
  deep = deep || new THREE.Color(color).multiplyScalar(0.62).getHex();
  /* 外壳（膜，ghost）+ 内质（细胞质，sheen） */
  const shellMat = ghostify(matCoat(color, { roughness: 0.34, clearcoat: 0.75 }), opacity);
  const innerMat = matSheen(deep, { roughness: 0.6, opacity: 0.68 });
  g.add(mesh(new THREE.SphereGeometry(r, 26, 20), shellMat));
  const inner = mesh(new THREE.SphereGeometry(r * 0.9, 22, 16), innerMat);
  g.add(inner);
  /* 分叶核（中性粒细胞）：核叶按 lobed 数排布 */
  if (nucleus) {
    const nucMat = matCoat(PAL.nucleus, { roughness: 0.42, clearcoat: 0.5 });
    if (lobed > 1) {
      for (let i = 0; i < lobed; i++) {
        const a = (i / lobed) * TAU;
        const lob = mesh(new THREE.SphereGeometry(r * 0.3, 12, 10), nucMat);
        lob.position.set(Math.cos(a) * r * 0.34, r * 0.12, Math.sin(a) * r * 0.3);
        lob.scale.set(1, 0.8, 0.9);
        g.add(lob);
      }
      /* 核叶间的细丝 */
      const fil = mesh(new THREE.CylinderGeometry(0.02, 0.02, r * 0.6, 6), nucMat);
      fil.rotation.z = TAU / 4;
      g.add(fil);
    } else {
      const nuc = mesh(new THREE.SphereGeometry(r * 0.42, 14, 12), nucMat);
      nuc.position.set(r * 0.14, r * 0.16, r * 0.1);
      g.add(nuc);
      const nuclo = mesh(new THREE.SphereGeometry(r * 0.14, 10, 8), matStd(PAL.nucleolus, { roughness: 0.5 }));
      nuclo.position.copy(nuc.position).add(new THREE.Vector3(r * 0.08, r * 0.08, 0));
      g.add(nuclo);
    }
  }
  /* 受体簇：fibonacci 布点的小棒（instanced 一次成型） */
  if (receptors > 0) {
    const rc = recColor || PAL.pore;
    const rec = new THREE.InstancedMesh(
      new THREE.CylinderGeometry(0.02, 0.028, r * 0.3, 5),
      matStd(rc, { roughness: 0.45 }), receptors,
    );
    fibSphere(receptors, r * 0.98).forEach((d, i) => setInst(rec, i, d, d.clone().normalize(), 1));
    g.add(rec);
  }
  /* 粗面内质网：板层椭球堆（浆细胞工厂感） */
  if (er > 0) {
    const erMat = matStd(PAL.rer, { roughness: 0.55 });
    for (let i = 0; i < er; i++) {
      const plate = mesh(new THREE.SphereGeometry(r * 0.5, 14, 10), erMat);
      plate.scale.set(1, 0.16, 0.62);
      plate.position.set(-r * 0.18, -r * 0.34 + i * r * 0.2, r * 0.12);
      plate.rotation.y = 0.3;
      g.add(plate);
    }
  }
  /* 高尔基：扁囊弧带堆 */
  if (golgi) {
    const golMat = matStd(PAL.golgi, { roughness: 0.5 });
    for (let i = 0; i < 4; i++) {
      const arc = new THREE.TorusGeometry(r * (0.42 - i * 0.05), 0.035, 6, 20, Math.PI * 0.9);
      const a = mesh(arc, golMat);
      a.position.set(r * 0.3, -r * 0.1 + i * 0.07, -r * 0.14);
      a.rotation.set(Math.PI / 2, 0.4, 0);
      g.add(a);
    }
  }
  /* 分泌小泡 */
  if (vesicles > 0) {
    const vs = new THREE.InstancedMesh(new THREE.SphereGeometry(0.05, 8, 6), matCoat(PAL.vesicle, { roughness: 0.35 }), vesicles);
    const rnd = mulberry32(77);
    fibSphere(vesicles, r * 0.55).forEach((d, i) => {
      setInst(vs, i, d.clone().multiplyScalar(0.5 + rnd() * 0.4), d, 0.7 + rnd() * 0.6);
    });
    g.add(vs);
  }
  /* 颗粒（肥大细胞 / 中性粒细胞） */
  if (granules > 0) {
    const gm = new THREE.InstancedMesh(new THREE.SphereGeometry(0.06, 8, 6), matCoat(CV.granule, { roughness: 0.4, clearcoat: 0.6 }), granules);
    const rnd = mulberry32(55);
    fibSphere(granules, r * 0.72).forEach((d, i) => {
      setInst(gm, i, d.clone().multiplyScalar(0.35 + rnd() * 0.5), d, 0.8 + rnd() * 0.7);
    });
    g.add(gm);
  }
  return g;
}

/* ——— 树突状细胞：胞体 + CatmullRom 放样二级树突 + MHC 呈递小板 ——— */
function makeDendriticCell(r = 0.42) {
  const g = new THREE.Group();
  const shellMat = ghostify(matCoat(CV.apc, { roughness: 0.34, clearcoat: 0.75 }), 0.5);
  const innerMat = matSheen(new THREE.Color(CV.apc).multiplyScalar(0.6).getHex(), { roughness: 0.6, opacity: 0.7 });
  g.add(mesh(new THREE.SphereGeometry(r, 24, 18), shellMat));
  g.add(mesh(new THREE.SphereGeometry(r * 0.88, 20, 14), innerMat));
  g.add(mesh(new THREE.SphereGeometry(r * 0.4, 12, 10), matCoat(PAL.nucleus, { roughness: 0.45 })));
  /* 树突：12 条主枝（放样曲线渐细）+ 末端二叉 */
  const dendMat = matStd(CV.apc, { roughness: 0.5 });
  const branches = [];
  const rnd = mulberry32(41);
  for (let i = 0; i < 12; i++) {
    const dir = fibSphere(12, 1)[i];
    const len = r * (1.3 + rnd() * 0.9);
    const mid = dir.clone().multiplyScalar(r + len * 0.5)
      .add(new THREE.Vector3((rnd() - 0.5) * 0.24, (rnd() - 0.5) * 0.24, (rnd() - 0.5) * 0.24));
    const tip = dir.clone().multiplyScalar(r + len);
    const curve = new THREE.CatmullRomCurve3([
      dir.clone().multiplyScalar(r * 0.5), mid, tip,
    ]);
    const taperPts = curve.getPoints(16);
    const tube = new THREE.TubeGeometry(curve, 18, 0.045, 5);
    g.add(mesh(tube, dendMat));
    /* 末梢二叉：两条短管 */
    for (const sgn of [-1, 1]) {
      const off = new THREE.Vector3(sgn * 0.1, 0.06, -sgn * 0.06).applyAxisAngle(dir, 0.8);
      const sub = new THREE.CatmullRomCurve3([
        tip, tip.clone().add(off.clone().multiplyScalar(0.6)), tip.clone().add(off).add(dir.clone().multiplyScalar(0.16)),
      ]);
      g.add(mesh(new THREE.TubeGeometry(sub, 10, 0.02, 4), dendMat));
    }
    branches.push(tip);
  }
  /* MHC 呈递小板：贴膜小圆盘 + 抗原肽红点（展示在几条树突根部旁） */
  const mhcMat = matCoat(PAL.paper, { roughness: 0.4 });
  const pepMat = matGlow(CV.virusDeep, 0.7, { roughness: 0.4 });
  for (let i = 0; i < 6; i++) {
    const d = fibSphere(6, 1)[i];
    const plate = mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.02, 12), mhcMat);
    plate.position.copy(d.clone().multiplyScalar(r * 1.02));
    plate.quaternion.setFromUnitVectors(UP, d.clone().normalize());
    const pep = mesh(new THREE.SphereGeometry(0.03, 8, 6), pepMat);
    pep.position.copy(d.clone().multiplyScalar(r * 1.05));
    g.add(plate, pep);
  }
  g.userData.branchTips = branches;
  return g;
}

/* ——— 巨噬细胞：fbm 变形虫轮廓 + 伪足 + 溶酶体颗粒 ——— */
function makeMacrophage(r = 0.55) {
  const g = new THREE.Group();
  /* 变形虫轮廓：球体顶点 fbm 扰动 */
  const geo = new THREE.SphereGeometry(r, 30, 22);
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const n = v.clone().normalize();
    const d = 1 + 0.16 * Math.sin(n.x * 3.1 + 1.2) * Math.sin(n.y * 2.3 - 0.7) * Math.sin(n.z * 2.7 + 0.3)
      + 0.07 * Math.sin(n.y * 6.1);
    pos.setXYZ(i, v.x * d, v.y * d, v.z * d);
  }
  geo.computeVertexNormals();
  const shellMat = ghostify(matSheen(CV.macro, { roughness: 0.55, sheen: 0.62 }), 0.52);
  g.add(mesh(geo, shellMat));
  g.add(mesh(new THREE.SphereGeometry(r * 0.85, 20, 14), matSheen(new THREE.Color(CV.macro).multiplyScalar(0.6).getHex(), { roughness: 0.62, opacity: 0.7 })));
  g.add(mesh(new THREE.SphereGeometry(r * 0.36, 12, 10), matCoat(PAL.nucleus, { roughness: 0.45 })));
  /* 伪足：5 条锥形叶，随相位摆动 */
  const podMat = ghostify(matSheen(CV.macroHi, { roughness: 0.55 }), 0.42);
  const pods = [];
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * TAU;
    const pod = mesh(new THREE.ConeGeometry(r * 0.3, r * 0.8, 10), podMat);
    pod.position.set(Math.cos(a) * r * 0.95, Math.sin(a * 2) * r * 0.25, Math.sin(a) * r * 0.8);
    pod.rotation.z = -Math.PI / 2 + Math.cos(a) * 0.6;
    pod.rotation.x = Math.sin(a) * 0.8;
    g.add(pod);
    pods.push(pod);
  }
  g.userData.pods = pods;
  /* 溶酶体颗粒 */
  const ly = new THREE.InstancedMesh(new THREE.SphereGeometry(0.07, 8, 6), matCoat(PAL.lysosome, { roughness: 0.4, clearcoat: 0.6 }), 10);
  const rnd = mulberry32(63);
  fibSphere(10, r * 0.6).forEach((d, i) => setInst(ly, i, d.clone().multiplyScalar(0.3 + rnd() * 0.45), d, 0.7 + rnd() * 0.6));
  g.add(ly);
  return g;
}

/* ——— 抗体（Y 形精雕）：双轻链 + 双重链 + 铰链 + 抗原结合域 ——— */
function makeAntibody({ color = CV.ab, igE = false, scale = 1 } = {}) {
  const g = new THREE.Group();
  const H = igE ? 1.24 : 1;   // IgE 略大
  const armMat = matCoat(color, { roughness: 0.34, clearcoat: 0.7 });
  const lightMat = matCoat(new THREE.Color(color).multiplyScalar(1.18).getHex(), { roughness: 0.32, clearcoat: 0.7 });
  const stemLen = 0.3 * H;
  const armLen = 0.2 * H;
  const armAng = 0.62;
  /* 重链主干（两根并排的细柱 = 重链二聚体） */
  for (const sx of [-0.02, 0.02]) {
    const st = mesh(new THREE.CylinderGeometry(0.016, 0.02, stemLen, 7), armMat);
    st.position.set(sx, stemLen / 2, 0);
    g.add(st);
  }
  /* 铰链区（小环） */
  const hinge = mesh(new THREE.TorusGeometry(0.045, 0.014, 6, 12), armMat);
  hinge.rotation.x = Math.PI / 2;
  hinge.position.y = stemLen;
  g.add(hinge);
  /* 两条重链臂 */
  for (const sgn of [-1, 1]) {
    const arm = mesh(new THREE.CylinderGeometry(0.018, 0.024, armLen, 7), armMat);
    arm.position.set(sgn * Math.sin(armAng) * armLen * 0.5, stemLen + Math.cos(armAng) * armLen * 0.5, 0);
    arm.rotation.z = sgn * armAng;
    g.add(arm);
    /* 轻链（短，贴在外侧） */
    const lt = mesh(new THREE.CylinderGeometry(0.012, 0.016, armLen * 0.6, 6), lightMat);
    lt.position.set(sgn * Math.sin(armAng) * (armLen * 0.82), stemLen + Math.cos(armAng) * (armLen * 0.78), 0.02);
    lt.rotation.z = sgn * (armAng + 0.06);
    g.add(lt);
    /* 抗原结合域（顶端小球） */
    const tipPos = new THREE.Vector3(
      sgn * Math.sin(armAng) * armLen,
      stemLen + Math.cos(armAng) * armLen, 0);
    const tip = mesh(new THREE.SphereGeometry(0.042, 10, 8), matCoat(new THREE.Color(color).multiplyScalar(1.25).getHex(), { roughness: 0.28 }));
    tip.position.copy(tipPos);
    g.add(tip);
  }
  g.scale.setScalar(scale);
  return g;
}

/* ——— 抗体群（instanced 化）：Y 形以「主干柱 + 双臂斜柱」三组 instanced 合成 ——— */
class AntibodySwarm {
  constructor(n = 24, color = CV.ab) {
    this.n = n;
    const mat = matCoat(color, { roughness: 0.36, clearcoat: 0.7 });
    this.stems = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.016, 0.022, 0.3, 6), mat, n);
    this.armL = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.015, 0.02, 0.2, 6), mat, n);
    this.armR = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.015, 0.02, 0.2, 6), mat, n);
    this.tips = new THREE.InstancedMesh(new THREE.SphereGeometry(0.04, 8, 6), matCoat(new THREE.Color(color).multiplyScalar(1.25).getHex(), { roughness: 0.3 }), n);
    for (const im of [this.stems, this.armL, this.armR, this.tips]) im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.g = new THREE.Group();
    this.g.add(this.stems, this.armL, this.armR, this.tips);
  }
  /* poses: [{p:Vector3, s:scale, spin:phase}] */
  apply(poses, t = 0) {
    const k = Math.min(poses.length, this.n);
    this.stems.count = this.armL.count = this.armR.count = this.tips.count = k;
    for (let i = 0; i < k; i++) {
      const { p, s = 1, spin = 0 } = poses[i];
      const wob = Math.sin(t * 1.8 + spin) * 0.14;
      const yaw = spin + wob * 0.5;
      const stemDir = new THREE.Vector3(Math.sin(yaw) * 0.18, 1, Math.cos(yaw) * 0.18).normalize();
      setInst(this.stems, i, p.clone().add(new THREE.Vector3(0, 0.15 * s, 0)), stemDir, s);
      const aL = stemDir.clone().applyAxisAngle(new THREE.Vector3(0, 0, 1), 0.62);
      const aR = stemDir.clone().applyAxisAngle(new THREE.Vector3(0, 0, 1), -0.62);
      const baseY = p.clone().add(new THREE.Vector3(0, 0.3 * s, 0));
      setInst(this.armL, i, baseY.clone().add(aL.clone().multiplyScalar(0.1 * s)), aL, s);
      setInst(this.armR, i, baseY.clone().add(aR.clone().multiplyScalar(0.1 * s)), aR, s);
      setInst(this.tips, i, baseY.clone().add(aL.clone().multiplyScalar(0.2 * s)), aL, s);
    }
    for (const im of [this.stems, this.armL, this.armR, this.tips]) im.instanceMatrix.needsUpdate = true;
  }
}

/* ——— 花粉过敏原：刺突球 + 网纹贴图 ——— */
function makePollen(r = 0.16) {
  const g = new THREE.Group();
  const tex = canvasTex(128, 128, (ctx) => {
    ctx.fillStyle = palCss('pollen', 0.95);
    ctx.fillRect(0, 0, 128, 128);
    ctx.strokeStyle = palCss('pollen', 0.62);
    ctx.lineWidth = 3;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.arc(64, 64, 14 + i * 13, 0, TAU);
      ctx.stroke();
    }
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * TAU;
      ctx.beginPath();
      ctx.moveTo(64, 64);
      ctx.lineTo(64 + Math.cos(a) * 62, 64 + Math.sin(a) * 62);
      ctx.stroke();
    }
  });
  const body = mesh(new THREE.SphereGeometry(r, 18, 14), matCoat(0xffffff, { roughness: 0.5 }));
  body.material.map = tex;
  g.add(body);
  const spikes = new THREE.InstancedMesh(new THREE.ConeGeometry(0.014, 0.05, 5), matStd(palCss('pollen', 0.7), { roughness: 0.6 }), 20);
  fibSphere(20, 1).forEach((d, i) => setInst(spikes, i, d.clone().multiplyScalar(r), d, 1));
  g.add(spikes);
  return g;
}

/* ——— 粒子云（细胞因子 / 组胺 / 渗出：Points 一次成型） ——— */
function makeParticleCloud(n, color, size = 0.07, opacity = 0.9) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  const mat = new THREE.PointsMaterial({
    color, size, transparent: true, opacity, depthWrite: false, sizeAttenuation: true,
  });
  const pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false;
  pts.userData.n = n;
  return pts;
}
function setParticle(pts, i, x, y, z) {
  pts.geometry.attributes.position.setXYZ(i, x, y, z);
}
function commitParticle(pts, count = -1) {
  pts.geometry.attributes.position.needsUpdate = true;
  pts.geometry.setDrawRange(0, count < 0 ? pts.userData.n : count);
}

/* ================= 章节一：人体的三道防线（皮肤剖面 · 时间轴推演） ================= */

const worldDef = new THREE.Group();
world.add(worldDef);

const def = {
  route: 'wound', noPhago: false, noLymph: false, running: false,
  bact: 0, bactTarget: 0, sick: false, day: 0, daysPerSec: 1.6,
  gap: 0, gapTarget: 0, dilate: 0, dilateTarget: 0,
  hist: [],
};

/* ——— 皮肤五层剖面 ——— */
const skinBits = {};
{
  /* 表皮左右两段（伤口模式下断开） */
  const epiL = new THREE.Group();
  const epiR = new THREE.Group();
  skinBits.epiL = epiL;
  skinBits.epiR = epiR;
  worldDef.add(epiL, epiR);
  for (const [seg, x0, x1] of [[epiL, -6.5, -0.5], [epiR, 0.5, 6.5]]) {
    /* 角质层：砖纹贴图薄板 + 上缘起翘鳞片 */
    const cornTex = canvasTex(512, 64, (ctx) => {
      ctx.fillStyle = palCss('tissue', 0.88);
      ctx.fillRect(0, 0, 512, 64);
      ctx.strokeStyle = palCss('tissue', 0.55);
      ctx.lineWidth = 3;
      for (let y = 0; y <= 64; y += 21) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(512, y); ctx.stroke();
      }
      for (let row = 0; row < 3; row++) {
        for (let x = (row % 2) * 32; x <= 512; x += 64) {
          ctx.beginPath();
          ctx.moveTo(x, row * 21); ctx.lineTo(x, row * 21 + 21);
          ctx.stroke();
        }
      }
    });
    const corn = mesh(new THREE.BoxGeometry(x1 - x0, 0.24, 3.4), matStd(0xffffff, { roughness: 0.8 }));
    corn.material.map = cornTex;
    corn.position.set((x0 + x1) / 2, 1.95, 0);
    seg.add(corn);
    /* 表皮细胞层：颗粒细胞双层阵列（instanced 胞体 + 核） */
    const cols = Math.floor((x1 - x0) / 0.62);
    const cells = new THREE.InstancedMesh(new THREE.SphereGeometry(0.26, 12, 10), matSheen(PAL.membrane, { roughness: 0.55, opacity: 0.95 }), cols * 2);
    const nucs = new THREE.InstancedMesh(new THREE.SphereGeometry(0.1, 8, 6), matStd(PAL.nucleus, { roughness: 0.5 }), cols * 2);
    let ci = 0;
    const rnd = mulberry32(101);
    for (let row = 0; row < 2; row++) {
      for (let c = 0; c < cols; c++) {
        const x = x0 + 0.35 + c * ((x1 - x0 - 0.7) / Math.max(cols - 1, 1));
        const y = 1.32 + row * 0.42 + (rnd() - 0.5) * 0.06;
        const z = (rnd() - 0.5) * 2.2;
        _q.identity();
        _s.set(1.1, 0.72, 0.9);
        _m4.compose(_v.set(x, y, z), _q, _s);
        cells.setMatrixAt(ci, _m4);
        _s.set(1, 1, 1);
        _m4.compose(_v.set(x + 0.03, y + 0.05, z + 0.02), _q, _s);
        nucs.setMatrixAt(ci, _m4);
        ci++;
      }
    }
    seg.add(cells, nucs);
    /* 基底面：基膜薄板 */
    const baseM = mesh(new THREE.BoxGeometry(x1 - x0, 0.05, 3.4), matStd(PAL.membraneDeep, { roughness: 0.7 }));
    baseM.position.set((x0 + x1) / 2, 1.06, 0);
    seg.add(baseM);
    /* 上缘起翘鳞片（角质层脱屑感） */
    const flakes = new THREE.InstancedMesh(new THREE.BoxGeometry(0.3, 0.03, 0.42), matStd(palCss('tissue', 0.95), { roughness: 0.85 }), 14);
    const rnd2 = mulberry32(7);
    for (let i = 0; i < 14; i++) {
      const x = x0 + rnd2() * (x1 - x0);
      _q.setFromEuler(new THREE.Euler((rnd2() - 0.5) * 0.5, rnd2() * TAU, (rnd2() - 0.5) * 0.5));
      _m4.compose(_v.set(x, 2.1 + rnd2() * 0.06, (rnd2() - 0.5) * 3), _q, _s.set(1, 1, 1));
      flakes.setMatrixAt(i, _m4);
    }
    seg.add(flakes);
  }
  /* 真皮主体：ghost 厚板（含内容物时半透） */
  const dermis = mesh(new THREE.BoxGeometry(13, 1.9, 3.4), ghostify(matSheen(PAL.membraneHi, { roughness: 0.7 }), 0.3));
  dermis.position.set(0, 0.1, 0);
  worldDef.add(dermis);
  /* 胶原纤维束：波浪管阵列 */
  const collMat = matStd(PAL.membrane, { roughness: 0.62, transparent: true, opacity: 0.8 });
  for (let i = 0; i < 7; i++) {
    const pts = [];
    const y = -0.62 + (i % 3) * 0.42, z = -1.35 + Math.floor(i / 3) * 1.3;
    for (let k = 0; k <= 40; k++) {
      const t = k / 40;
      pts.push(new THREE.Vector3(-6.2 + t * 12.4, y + Math.sin(t * TAU * (1.4 + i * 0.3)) * 0.1, z));
    }
    worldDef.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 70, 0.045, 5), collMat));
  }
  /* 动脉 + 静脉血管袢 */
  const vesselPtsA = [];
  const vesselPtsV = [];
  for (let k = 0; k <= 44; k++) {
    const t = k / 44;
    vesselPtsA.push(new THREE.Vector3(-6 + t * 12, 0.42 + Math.sin(t * TAU * 1.15) * 0.26, 0.9 + Math.cos(t * TAU * 0.9) * 0.42));
    vesselPtsV.push(new THREE.Vector3(-6 + t * 12, -0.4 + Math.sin(t * TAU * 1.15 + 1.4) * 0.24, 0.5 + Math.cos(t * TAU * 0.9 + 0.8) * 0.5));
  }
  const artMat = matCoat(CV.vesselA, { roughness: 0.4 });
  const venMat = matCoat(CV.vesselV, { roughness: 0.45 });
  const artery = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(vesselPtsA), 90, 0.11, 10), artMat);
  const vein = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(vesselPtsV), 90, 0.1, 10), venMat);
  worldDef.add(artery, vein);
  skinBits.artery = artery;
  skinBits.vein = vein;
  /* 神经纤维（细黄分支） */
  const nervePts = [];
  for (let k = 0; k <= 30; k++) {
    const t = k / 30;
    nervePts.push(new THREE.Vector3(-4.6 + t * 9, -0.2 + Math.sin(t * TAU) * 0.14, -1.2 + Math.cos(t * 4) * 0.2));
  }
  worldDef.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(nervePts), 50, 0.03, 5), matStd(PAL.intermediate, { roughness: 0.6 })));
  /* 皮下脂肪：小叶阵列 + 筋膜底板 */
  const fatMat = matSheen(PAL.starch, { roughness: 0.62, opacity: 0.96 });
  const fat = new THREE.InstancedMesh(new THREE.SphereGeometry(0.34, 12, 9), fatMat, 42);
  const rnd3 = mulberry32(17);
  let fi = 0;
  for (let row = 0; row < 3; row++) {
    for (let c = 0; c < 14; c++) {
      _q.setFromEuler(new THREE.Euler(0, rnd3() * TAU, 0));
      _s.set(1.15, 0.62, 0.95);
      _m4.compose(_v.set(-6 + c * 0.92 + (rnd3() - 0.5) * 0.2, -1.32 + row * 0.4, (rnd3() - 0.5) * 2.6), _q, _s);
      fat.setMatrixAt(fi++, _m4);
    }
  }
  worldDef.add(fat);
  const fascia = mesh(new THREE.BoxGeometry(13, 0.06, 3.4), matStd(palCss('tissue', 0.75), { roughness: 0.75 }));
  fascia.position.set(0, -2.12, 0);
  worldDef.add(fascia);
  /* 毛囊 + 毛干 + 皮脂腺 */
  const hairPts = [];
  for (let k = 0; k <= 20; k++) {
    const t = k / 20;
    hairPts.push(new THREE.Vector3(4.5 - t * 0.7, -0.55 + t * 2.62, 0.3));
  }
  const hair = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(hairPts), 36, 0.06, 7), matStd(PAL.intermediate, { roughness: 0.55 }));
  worldDef.add(hair);
  const bulb = mesh(new THREE.SphereGeometry(0.17, 12, 9), matStd(PAL.nucleus, { roughness: 0.55 }));
  bulb.position.set(3.82, -0.58, 0.3);
  worldDef.add(bulb);
  for (let i = 0; i < 3; i++) {
    const gl = mesh(new THREE.SphereGeometry(0.12, 10, 8), matSheen(PAL.golgi, { roughness: 0.6 }));
    gl.position.set(4.9 + (i % 2) * 0.2, 0.35 + i * 0.16, -0.3);
    gl.scale.set(1, 0.7, 1);
    worldDef.add(gl);
  }
  /* 汗腺盘曲（螺旋管） */
  const sweatPts = [];
  for (let k = 0; k <= 90; k++) {
    const t = k / 90;
    const a = t * TAU * 3.2;
    sweatPts.push(new THREE.Vector3(-4.5 + Math.cos(a) * 0.3, -1.5 + t * 0.9 + Math.sin(a * 2) * 0.04, -1 + Math.sin(a) * 0.3));
  }
  worldDef.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(sweatPts), 160, 0.032, 5), matStd(PAL.vacuole, { roughness: 0.6, transparent: true, opacity: 0.85 })));
  /* 伤口渗出液（组织液高光面，随 gap 出现） */
  const exu = mesh(new THREE.CircleGeometry(0.62, 24), matCoat(CV.tissue, { roughness: 0.15, clearcoat: 1 }));
  exu.rotation.x = -Math.PI / 2;
  exu.position.set(0, 1.1, 0.4);
  exu.visible = false;
  worldDef.add(exu);
  skinBits.exudate = exu;
  /* 炎症渗出粒子云 */
  skinBits.leak = makeParticleCloud(26, CV.tissue, 0.09, 0.75);
  skinBits.leak.visible = false;
  worldDef.add(skinBits.leak);
  /* 细菌群 */
  skinBits.swarm = new CoccusSwarm(36);
  worldDef.add(skinBits.swarm.g);
  /* 特写菌（吞噬目标） */
  skinBits.heroBact = makeCoccusChain(4, 1.15);
  skinBits.heroBact.position.set(0.9, 0.55, 1.25);
  worldDef.add(skinBits.heroBact);
  /* 吞噬细胞 */
  skinBits.macro = makeMacrophage(0.5);
  skinBits.macro.position.set(-2.6, 0.35, 1.1);
  worldDef.add(skinBits.macro);
  /* 中性粒细胞 ×3（炎症相从血管钻出） */
  skinBits.neutros = [];
  for (let i = 0; i < 3; i++) {
    const n = makeImmuneCell({ r: 0.3, color: CV.neutro, receptors: 0, lobed: 3, granules: 8, opacity: 0.85 });
    n.position.set(-4.2 + i * 0.7, 0.42, 0.9);
    n.visible = false;
    n.userData.from = n.position.clone();
    n.userData.to = new THREE.Vector3(-0.8 + i * 0.9, 0.6, 1.15);
    worldDef.add(n);
    skinBits.neutros.push(n);
  }
  /* 第三道防线抗体群 */
  skinBits.ab = new AntibodySwarm(18, CV.ab);
  worldDef.add(skinBits.ab.g);
  /* 巨噬细胞（大量入侵模式的清除者，与 macro 共用一个可见体） */
  skinBits.labels = new THREE.Group();
  worldDef.add(skinBits.labels);
  const lb1 = label('第一道防线：表皮 · 角质层', '#ffd9a8', 0.004);
  lb1.position.set(-2.8, 2.75, 0);
  const lb2 = label('真皮：血管 · 吞噬细胞驻守', '#bfe2f8', 0.004);
  lb2.position.set(2.6, -1.0, 2.0);
  const lb3 = label('皮下脂肪', '#d9d2b8', 0.0034);
  lb3.position.set(-4.4, -1.7, 2.0);
  skinBits.labels.add(lb1, lb2, lb3);
  equipLabels.push(lb1, lb2, lb3);
  /* 细菌数量 · 发病线 图表 */
  skinBits.chart = makeDefChart();
  skinBits.chart.g.position.set(6.35, 2.3, -1.7);
  skinBits.chart.g.rotation.y = -0.42;
  worldDef.add(skinBits.chart.g);
}

/* 细菌数量曲线图（程序化 CanvasTexture：网格 / 轴 / 发病线 / 曲线 / 图例） */
function makeDefChart() {
  const W = 512, H = 320;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  const g = new THREE.Group();
  const back = mesh(new THREE.BoxGeometry(4.9, 3.15, 0.07), matStd(PAL.ink, { roughness: 0.6 }));
  back.position.z = -0.04;
  const face = mesh(new THREE.PlaneGeometry(4.7, 2.95), new THREE.MeshBasicMaterial({ map: tex }));
  g.add(back, face);
  return { g, cv, ctx: cv.getContext('2d'), tex, W, H };
}
function drawDefChart() {
  const { ctx, cv, tex, W, H } = skinBits.chart;
  const isDark = true; /* 场景内图板固定深色：与棚拍背景同调，避免浅色主题下 bloom 过曝 */
  ctx.fillStyle = isDark ? '#141a22' : '#f7f4ec';
  ctx.fillRect(0, 0, W, H);
  const padL = 52, padB = 42, padT = 34, padR = 22;
  const pw = W - padL - padR, ph = H - padT - padB;
  const fg = isDark ? '#dfe6ee' : '#2a3038';
  const grid = isDark ? '#2c3540' : '#d8d4c6';
  /* 网格 */
  ctx.strokeStyle = grid;
  ctx.lineWidth = 1;
  for (let i = 0; i <= 7; i++) {
    const x = padL + (i / 7) * pw;
    ctx.beginPath(); ctx.moveTo(x, padT); ctx.lineTo(x, padT + ph); ctx.stroke();
  }
  for (let i = 0; i <= 4; i++) {
    const y = padT + (i / 4) * ph;
    ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + pw, y); ctx.stroke();
  }
  /* 发病线 */
  const sickY = padT + (1 - 0.62) * ph;
  ctx.strokeStyle = shade('virus', 0.95);
  ctx.setLineDash([7, 5]);
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(padL, sickY); ctx.lineTo(padL + pw, sickY); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = shade('virus', 0.95);
  ctx.font = '600 13px "PingFang SC", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('发病线', padL + 6, sickY - 6);
  /* 轴标 */
  ctx.fillStyle = fg;
  ctx.font = '12px "PingFang SC", sans-serif';
  ctx.textAlign = 'center';
  for (let i = 0; i <= 7; i += 2) ctx.fillText(i * 2 + 'h', padL + (i / 7) * pw, H - 16);
  ctx.fillText('时间', padL + pw / 2, H - 2);
  ctx.save();
  ctx.translate(14, padT + ph / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('细菌数量（相对）', 0, 0);
  ctx.restore();
  /* 曲线：当前记录 */
  const hist = def.hist;
  if (hist.length > 1) {
    ctx.strokeStyle = shade('bact', 0.8);
    ctx.lineWidth = 3;
    ctx.beginPath();
    const span = Math.max(hist[hist.length - 1].t, 14);
    hist.forEach((p, i) => {
      const x = padL + (p.t / span) * pw;
      const y = padT + (1 - clamp(p.v, 0, 1)) * ph;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();
    const last = hist[hist.length - 1];
    ctx.fillStyle = shade('bact', 0.8);
    ctx.beginPath();
    ctx.arc(padL + (last.t / span) * pw, padT + (1 - clamp(last.v, 0, 1)) * ph, 5, 0, TAU);
    ctx.fill();
  }
  /* 图例 */
  ctx.textAlign = 'right';
  ctx.fillStyle = fg;
  ctx.font = '600 12px "PingFang SC", sans-serif';
  ctx.fillText('细菌数量曲线 · 演示记录', W - 16, 20);
  tex.needsUpdate = true;
}

/* 三种入侵途径的步骤脚本（含关闭吞噬细胞的替代结局） */
function buildDefenseSteps() {
  const noP = def.noPhago;
  const D = def.daysPerSec;
  const swarm = skinBits.swarm;
  const bactClr = shade('bact', 0.8);
  if (def.route === 'skin') {
    return [
      {
        id: 'land', dur: 2.2, msg: () => say('细菌落到完整的皮肤表面，还没接触到活组织。', 'ok'),
        begin() { def.bactTarget = 0.5; def.gapTarget = 0; def.dilateTarget = 0; },
        apply(k) { def.bact = def.bactTarget * Math.min(k * 2.2, 1); },
      },
      {
        id: 'block', dur: 3.2, msg: () => say('第一道防线：角质层像砖墙一样挡住细菌，皮脂与汗液里的乳酸、脂肪酸还能抑菌杀菌。', 'ok'),
        apply(k) { def.bact = 0.5 * (1 - k) * (1 - k); skinBits.heroBact.visible = false; },
      },
      {
        id: 'note', dur: 2.6, msg: () => say('多数病原体到这就停了：皮肤黏膜是人生来就有的屏障，不挑对手——这叫非特异性免疫。', 'ok'),
        apply(k) { def.bact = 0; },
      },
    ];
  }
  if (def.route === 'wound') {
    const steps = [
      {
        id: 'enter', dur: 2.4, msg: () => say('细菌穿过破口进入真皮，就在组织液里繁殖起来。', 'warn'),
        begin() { def.bactTarget = 0.4; def.gapTarget = 1; def.dilateTarget = 0; },
        apply(k, dt) { def.bact = 0.4 * k; },
      },
      {
        id: 'inflame', dur: 3.6, msg: () => say('受伤组织释放信号：毛细血管扩张、通透性增强，中性粒细胞钻出血管赶往感染处——红、肿、热、痛就是炎症。', 'warn'),
        apply(k) {
          def.bact = 0.4 + k * 0.28;
          def.dilateTarget = Math.sin(k * Math.PI);
          skinBits.neutros.forEach((n, i) => {
            n.visible = k > 0.12 + i * 0.14;
            const kk = clamp((k - 0.12) * 1.4, 0, 1);
            n.position.lerpVectors(n.userData.from, n.userData.to, kk);
          });
          leakParticles(k);
        },
      },
    ];
    if (!noP) {
      steps.push(
        {
          id: 'engulf', dur: 4.2, msg: () => say('第二道防线接战：吞噬细胞以变形运动裹住细菌、吞入胞内消化；体液里的溶菌酶也在同步溶解菌体。', 'ok'),
          begin() { skinBits.heroBact.visible = true; skinBits.macro.visible = true; },
          apply(k, dt) {
            def.bact = 0.68 - k * 0.6;
            def.dilateTarget = 1 - k * 0.8;
            const m = skinBits.macro;
            m.position.lerpVectors(new THREE.Vector3(-2.6, 0.35, 1.1), skinBits.heroBact.position.clone().add(new THREE.Vector3(-0.45, 0.1, 0)), Math.min(k * 1.3, 1));
            if (k > 0.62) {
              const s = clamp(1 - (k - 0.62) / 0.3, 0.12, 1);
              skinBits.heroBact.scale.setScalar(1.15 * s);
            }
          },
        },
        {
          id: 'clear', dur: 3.0, msg: () => say('细菌清除、未发病。屏障与吞噬这两道防线人人都有、对多种病原体有效——非特异性免疫到此完成。', 'ok'),
          apply(k) { def.bact = Math.max(0.08 * (1 - k), 0); def.dilateTarget = 0.2 * (1 - k); },
        },
      );
    } else {
      steps.push(
        {
          id: 'spread', dur: 3.6, msg: () => say('吞噬细胞被关闭：细菌没有对手，在组织液里越繁殖越多，感染向四周扩散。', 'warn'),
          begin() { skinBits.heroBact.visible = false; },
          apply(k) { def.bact = 0.68 + k * 0.32; },
        },
        {
          id: 'verdict', dur: 2.6, msg: () => say('数量越过发病线：出现症状。这一关守住，通常就靠第二道防线。', 'warn'),
          apply(k) { def.bact = 1; },
        },
      );
    }
    return steps;
  }
  /* 大量入侵 */
  const steps = [
    {
      id: 'mass', dur: 2.6, msg: () => say('大量细菌从伤口一起涌入，繁殖速度远超平常。', 'warn'),
      begin() { def.bactTarget = 0.55; def.gapTarget = 1; },
      apply(k) { def.bact = 0.55 * k; },
    },
    {
      id: 'over', dur: 3.2, msg: () => say('吞噬细胞吞得再快也追不上繁殖速度：第二道防线被突破，数量越过发病线。', 'warn'),
      apply(k) { def.bact = 0.55 + k * 0.4; def.dilateTarget = 1; },
    },
  ];
  if (def.noLymph) {
    /* 第三道防线（淋巴细胞）缺失：无抗体登场，感染压不住 */
    steps.push({
      id: 'nolymph', dur: 3.2, msg: () => say('淋巴细胞被关闭：第三道防线缺员，迟迟等不到抗体，细菌群持续扩张。', 'warn'),
      apply(k) { def.bact = 0.95 + k * 0.05; def.dilateTarget = 1; },
    });
    steps.push({
      id: 'sick3', dur: 2.6, msg: () => say('数量越过发病线：出现症状。特异性免疫缺位时，大量入侵很难挡住。', 'warn'),
      apply(k) { def.bact = 1; },
    });
    return steps;
  }
  steps.push({
    id: 'ab', dur: 3.6, msg: () => say('第三道防线上线：数日之后，B 淋巴细胞产出了一批专门锁定该菌的抗体。', 'ok'),
    begin() { skinBits.abPoses = makeAbPoses(); },
    apply(k) {
      def.bact = 0.95 - k * 0.08;
      const n = Math.round(k * 18);
      skinBits.ab.apply((skinBits.abPoses || []).slice(0, n), performance.now() * 0.001);
    },
  });
  steps.push({
    id: 'clump', dur: 3.6, msg: () => say('抗体锁住细菌表面的抗原：细菌停止增殖、彼此凝集成堆——抱团菌更容易被整体吞掉。', 'ok'),
    apply(k) {
      def.clump = k;
      const centers = clumpCenters();
      swarm.apply(Math.max(def.bact, 0.1), k, centers);
      skinBits.ab.apply(skinBits.abPoses || [], performance.now() * 0.001);
    },
  });
  if (!noP) {
    steps.push({
      id: 'coop', dur: 3.2, msg: () => say('吞噬细胞把菌团吞掉：第三道防线定向打击、第二道防线兜底清除——特异性免疫与非特异性免疫协同取胜。', 'ok'),
      apply(k) {
        def.clump = 1;
        def.bact = Math.max(0.9 * (1 - k), 0);
        const centers = clumpCenters();
        swarm.apply(def.bact, 1, centers);
        skinBits.ab.apply(skinBits.abPoses || [], performance.now() * 0.001);
      },
    });
  } else {
    steps.push({
      id: 'abonly', dur: 3.4, msg: () => say('抗体虽能让细菌抱团停繁，可缺了吞噬细胞就没人善后——抗体只负责标记敌靶，真正的清除要靠吞噬细胞动手。', 'warn'),
      apply(k) {
        def.clump = 1;
        const centers = clumpCenters();
        swarm.apply(0.85, 1, centers);
        skinBits.ab.apply(skinBits.abPoses || [], performance.now() * 0.001);
      },
    });
  }
  return steps;
}
function makeAbPoses() {
  const rnd = mulberry32(9);
  const poses = [];
  for (let i = 0; i < 18; i++) {
    poses.push({
      p: new THREE.Vector3(-2.4 + i * 0.34 + (rnd() - 0.5) * 0.3, 2.6 + rnd() * 1.2, 0.4 + (rnd() - 0.5) * 1.4),
      s: 1.5, spin: rnd() * TAU,
    });
  }
  return poses;
}
function clumpCenters() {
  return [
    new THREE.Vector3(-0.9, 0.7, 0.8),
    new THREE.Vector3(0.9, 0.5, 0.9),
    new THREE.Vector3(0, 1.1, 1.3),
  ];
}
function leakParticles(k) {
  const pts = skinBits.leak;
  pts.visible = k > 0.05;
  const n = pts.userData.n;
  for (let i = 0; i < n; i++) {
    const kk = clamp((k - 0.05 - i * 0.02) * 1.6, 0, 1);
    const x = -1.6 + (i % 6) * 0.6;
    const y = 0.5 + kk * 0.7;
    const z = 1.0 + ((i * 37) % 7) * 0.16;
    setParticle(pts, i, x, y, z);
  }
  commitParticle(pts, Math.round(clamp(k * 1.2, 0, 1) * n));
}

/* 推演控制 */
const defSeq = new Sequencer();
defSeq.onStep = (i, s) => {
  hset('stage', s.id === 'note' || s.id === 'verdict' ? '结论' : s.id);
  logStamp = () => `${def.day.toFixed(1)}s`;
};
defSeq.onDone = () => {
  def.running = false;
  say('推演结束，可换一条入侵途径或改变条件再试。', 'ok');
};
let logStamp = () => '—';

function resetDefense() {
  defSeq.load([]);
  def.running = false;
  def.bact = 0; def.bactTarget = 0; def.clump = 0;
  def.sick = false;
  def.hist = [];
  def.dilate = 0; def.dilateTarget = 0;
  def.gap = def.route === 'skin' ? 0 : 1;
  def.gapTarget = def.gap;
  skinBits.epiL.position.x = -def.gap * 0.62;
  skinBits.epiR.position.x = def.gap * 0.62;
  skinBits.exudate.visible = def.gap > 0.45;
  skinBits.heroBact.visible = false;
  skinBits.heroBact.scale.setScalar(1.15);
  skinBits.macro.visible = true;
  skinBits.macro.position.set(-2.6, 0.35, 1.1);
  skinBits.neutros.forEach((n) => { n.visible = false; n.position.copy(n.userData.from); });
  skinBits.leak.visible = false;
  skinBits.ab.apply([], 0);
  skinBits.swarm.apply(0, 0);
  drawDefChart();
  setHudRows1();
  hset('stage', '待命');
  hset('bac', '0');
  hset('cond', '未发病');
  hset('clock', '0.0 s');
}

function setHudRows1() {
  setHudRows([['stage', '阶段'], ['bac', '细菌数量'], ['cond', '病情'], ['clock', '推演进度']]);
}

function tickDefense(dt) {
  /* 视觉量平滑逼近目标 */
  def.dilate += (def.dilateTarget - def.dilate) * Math.min(dt * 4, 1);
  /* 伤口开合：表皮两段平滑分开/合拢 */
  def.gap += (def.gapTarget - def.gap) * Math.min(dt * 3, 1);
  skinBits.epiL.position.x = -def.gap * 0.62;
  skinBits.epiR.position.x = def.gap * 0.62;
  skinBits.exudate.visible = def.gap > 0.45;
  const sc = 1 + def.dilate * 0.85;
  skinBits.artery.scale.set(1, sc, sc);
  skinBits.vein.scale.set(1, 1 + def.dilate * 0.5, 1 + def.dilate * 0.5);
  /* 步进器 */
  defSeq.tick(dt);
  const st = defSeq.current;
  if (def.running || defSeq.idx >= 0) {
    def.day += dt * def.daysPerSec;
    hset('clock', `${def.day.toFixed(1)} s`);
  }
  /* 细菌群可视：皮肤模式落在表皮上方，破口模式入真皮 */
  if (st && (st.id === 'land' || st.id === 'block' || st.id === 'note')) {
    skinBits.swarm.apply(def.bact, 0);
  } else if (!st || st.id === 'enter' || st.id === 'inflame' || st.id === 'engulf' || st.id === 'clear' || st.id === 'spread' || st.id === 'verdict' || st.id === 'mass' || st.id === 'over') {
    skinBits.swarm.apply(def.bact, def.clump || 0, clumpCenters());
  }
  /* 记录 + 图表（节流重绘） */
  if (defSeq.idx >= 0) {
    def.hist.push({ t: def.day, v: def.bact });
    if (def.hist.length > 600) def.hist.shift();
    if (def.bact > 0.62) def.sick = true;
    hset('bac', Math.round(def.bact * 100) + '%');
    hset('cond', def.sick ? '已越过发病线' : '未发病');
    def._chartT = (def._chartT || 0) + dt;
    if (def._chartT > 0.12) { def._chartT = 0; drawDefChart(); }
  }
  /* 伪足摆动 */
  const pods = skinBits.macro.userData.pods || [];
  const t = performance.now() * 0.001;
  pods.forEach((p, i) => { p.rotation.y = Math.sin(t * 2.2 + i * 1.4) * 0.3; });
}

/* ================= 章节二：体液免疫的过程（淋巴结 · 12 步链） ================= */

const worldNode = new THREE.Group();
world.add(worldNode);

const hum = {
  noTh: false, noCk: false, speed: 1,
  bactDiv: 0, abLevel: 0, bound: 0, cleared: 0,
};

const nodeBits = {};
{
  /* 淋巴结剖面壳：缺口球壳 + 被膜缘环 */
  const shellGeo = new THREE.SphereGeometry(3.0, 48, 32, 0, TAU * 0.88);
  const shell = mesh(shellGeo, ghostify(matSheen(PAL.membrane, { roughness: 0.6 }), 0.14));
  shell.material.side = THREE.BackSide;
  shell.rotation.z = -TAU * 0.44;
  shell.scale.set(1.25, 0.85, 0.9);
  worldNode.add(shell);
  /* 被膜缘：开口处环带 */
  const rim = mesh(new THREE.TorusGeometry(3.0 * 0.98, 0.06, 8, 60), matStd(PAL.membraneDeep, { roughness: 0.55 }));
  rim.rotation.y = TAU * 0.44;
  rim.scale.set(1.25, 0.9, 1);
  worldNode.add(rim);
  /* 淋巴小结（皮质区两个 ghost 球）+ 髓质索（蜿蜒管） */
  for (const [x, y] of [[-1.1, 1.2], [0.6, 1.6]]) {
    const fol = mesh(new THREE.SphereGeometry(0.62, 20, 14), ghostify(matSheen(PAL.nucleus, { roughness: 0.6 }), 0.16));
    fol.position.set(x, y, 0.2);
    worldNode.add(fol);
  }
  const cordMat = matStd(PAL.membraneDeep, { roughness: 0.6, transparent: true, opacity: 0.5 });
  for (let i = 0; i < 3; i++) {
    const pts = [];
    for (let k = 0; k <= 26; k++) {
      const t = k / 26;
      pts.push(new THREE.Vector3(-2.4 + t * 4.8, -1.6 + Math.sin(t * TAU + i * 1.2) * 0.3, -0.6 + i * 0.5 + Math.cos(t * 6) * 0.15));
    }
    worldNode.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 46, 0.1, 7), cordMat));
  }
  /* 输入 / 输出淋巴管 */
  const inPts = [new THREE.Vector3(-6.4, 2.4, 0), new THREE.Vector3(-4.6, 2.0, 0), new THREE.Vector3(-3.4, 1.4, 0)];
  const outPts = [new THREE.Vector3(3.2, 0.4, 0), new THREE.Vector3(4.6, 0.9, 0), new THREE.Vector3(6.4, 1.6, 0)];
  const vesselMat = matCoat(CV.vesselV, { roughness: 0.45 });
  worldNode.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(inPts), 30, 0.16, 9), vesselMat));
  worldNode.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(outPts), 30, 0.18, 9), matCoat(CV.vesselA, { roughness: 0.45 })));
  const lbIn = label('输入淋巴管', '#bfe2f8', 0.0034);
  lbIn.position.set(-5.6, 3.0, 0);
  const lbOut = label('输出淋巴管', '#ffc9a8', 0.0034);
  lbOut.position.set(5.6, 2.2, 0);
  worldNode.add(lbIn, lbOut);
  equipLabels.push(lbIn, lbOut);

  /* 病毒云（instanced）+ 特写病毒 */
  nodeBits.virusCloud = new THREE.Group();
  worldNode.add(nodeBits.virusCloud);
  const envGeo = new THREE.SphereGeometry(0.24, 16, 12);
  const envMat = ghostify(matCoat(CV.virus, { roughness: 0.32, clearcoat: 0.85 }), 0.42);
  nodeBits.envs = new THREE.InstancedMesh(envGeo, envMat, 6);
  nodeBits.spikes = new THREE.InstancedMesh(new THREE.ConeGeometry(0.03, 0.1, 5), matStd(CV.virusDeep, { roughness: 0.45 }), 6 * 10);
  nodeBits.envs.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  nodeBits.spikes.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  nodeBits.virusCloud.add(nodeBits.envs, nodeBits.spikes);
  nodeBits.virusPoses = [];
  const rndV = mulberry32(19);
  for (let i = 0; i < 6; i++) {
    nodeBits.virusPoses.push({
      home: new THREE.Vector3(-5.6, 0.4 + i * 0.5, (rndV() - 0.5) * 1.6),
      p: new THREE.Vector3(),
      spin: rndV() * TAU,
      alive: true,
    });
  }
  nodeBits.heroVirus = makeVirusHero(1.05);
  nodeBits.heroVirus.visible = false;
  worldNode.add(nodeBits.heroVirus);

  /* 树突状细胞 */
  nodeBits.apc = makeDendriticCell(0.42);
  nodeBits.apc.position.set(-1.7, 1.15, 0);
  worldNode.add(nodeBits.apc);
  /* 辅助性 T */
  nodeBits.th = makeImmuneCell({ r: 0.4, color: CV.tcell, receptors: 10, recColor: PAL.pore });
  nodeBits.th.position.set(-3.4, -0.9, 0.4);
  worldNode.add(nodeBits.th);
  /* B 细胞（第一信号接收者） */
  nodeBits.b = makeImmuneCell({ r: 0.46, color: CV.bcell, receptors: 14, recColor: PAL.pore });
  nodeBits.b.position.set(0.2, -1.55, 0);
  worldNode.add(nodeBits.b);
  /* B 分裂产物：4 个小 B（渐次出现） */
  nodeBits.bKids = [];
  for (let i = 0; i < 4; i++) {
    const kid = makeImmuneCell({ r: 0.3, color: CV.bcell, receptors: 8, recColor: PAL.pore, opacity: 0.55 });
    const a = (i / 4) * TAU;
    kid.position.set(0.2 + Math.cos(a) * 0.5, -1.55 + Math.sin(a) * 0.45, 0.1 * (i % 2));
    kid.scale.setScalar(0.01);
    kid.visible = false;
    worldNode.add(kid);
    nodeBits.bKids.push(kid);
  }
  /* 浆细胞 ×3（ER + 高尔基 + 分泌泡） */
  nodeBits.plasma = [];
  for (let i = 0; i < 3; i++) {
    const p = makeImmuneCell({ r: 0.42, color: CV.plasma, receptors: 0, er: 4, golgi: true, vesicles: 12 });
    p.position.set(2.3 + i * 0.85, -1.9 + (i % 2) * 0.75, (i - 1) * 0.4);
    p.scale.setScalar(0.01);
    p.visible = false;
    worldNode.add(p);
    nodeBits.plasma.push(p);
  }
  /* 记忆 B ×2 */
  nodeBits.memory = [];
  for (let i = 0; i < 2; i++) {
    const m = makeImmuneCell({ r: 0.34, color: CV.memory, receptors: 8, recColor: PAL.chromatin });
    m.position.set(1.6 + i * 0.8, 1.9, -0.5);
    m.scale.setScalar(0.01);
    m.visible = false;
    worldNode.add(m);
    nodeBits.memory.push(m);
  }
  /* 细胞因子粒子流 */
  nodeBits.ck = makeParticleCloud(16, PAL.ser, 0.08, 0.95);
  nodeBits.ck.visible = false;
  worldNode.add(nodeBits.ck);
  /* 抗体群 */
  nodeBits.ab = new AntibodySwarm(18, CV.ab);
  worldNode.add(nodeBits.ab.g);
  /* 清道夫巨噬细胞 */
  nodeBits.macro = makeMacrophage(0.52);
  nodeBits.macro.position.set(3.4, 1.3, 0.6);
  worldNode.add(nodeBits.macro);
  /* 凝集点 */
  nodeBits.clumpCenter = new THREE.Vector3(2.6, 0.6, 0.3);
  /* 标注 */
  nodeBits.labels = new THREE.Group();
  worldNode.add(nodeBits.labels);
  const la = label('树突状细胞：摄取 · 呈递', '#a8e8cc', 0.0038);
  la.position.set(-1.7, 2.15, 0);
  const lb = label('辅助性 T 细胞', '#a8c4ff', 0.0038);
  lb.position.set(-3.4, -0.1, 0.4);
  const lc = label('B 细胞', '#d9c4ff', 0.0038);
  lc.position.set(0.2, -0.75, 0);
  const ld = label('浆细胞：抗体工厂', '#ffc9a8', 0.0038);
  ld.position.set(3.0, -2.75, 0);
  ld.visible = false;
  const le = label('记忆 B 细胞', '#cdb0ff', 0.0038);
  le.position.set(2.0, 2.6, -0.5);
  le.visible = false;
  const lf = label('巨噬细胞：终极清除', '#ffd9a8', 0.0038);
  lf.position.set(3.4, 2.15, 0.6);
  nodeBits.labels.add(la, lb, lc, ld, le, lf);
  nodeBits.lblPlasma = ld;
  nodeBits.lblMemory = le;
  equipLabels.push(la, lb, lc, ld, le, lf);
}

/* 病毒云位姿应用（每帧） */
function applyNodeViruses(t) {
  const poses = nodeBits.virusPoses;
  let vi = 0;
  for (const v of poses) {
    if (!v.alive) continue;
    /* 包膜 */
    const bob = Math.sin(t * 1.6 + v.spin) * 0.06;
    _q.setFromEuler(new THREE.Euler(t * 0.7 + v.spin, v.spin, 0));
    _s.set(1, 1, 1);
    _m4.compose(_v.set(v.p.x, v.p.y + bob, v.p.z), _q, _s);
    nodeBits.envs.setMatrixAt(vi, _m4);
    /* 刺突 10 根 */
    for (let k = 0; k < 10; k++) {
      const d = fibSphere(10, 1)[k];
      const dir = d.clone().applyQuaternion(_q);
      setInst(nodeBits.spikes, vi * 10 + k, v.p.clone().add(dir.clone().multiplyScalar(0.26)), dir, 1);
    }
    vi++;
  }
  nodeBits.envs.count = nodeBits.spikes.count = vi;
  nodeBits.envs.instanceMatrix.needsUpdate = true;
  nodeBits.spikes.instanceMatrix.needsUpdate = true;
}

/* 12 步链（含两种缺失对照的改写） */
function buildHumoralSteps() {
  const B0 = nodeBits.b.position.clone();
  const TH0 = nodeBits.th.position.clone();
  const steps = [
    {
      id: 'invade', name: '病毒入结', dur: 2.4,
      msg: () => say('病毒随淋巴液经输入淋巴管流入淋巴结——淋巴结是免疫细胞的集结地。', 'warn'),
      begin() { resetNodeActors(); },
      apply(k) {
        nodeBits.virusPoses.forEach((v, i) => {
          v.p.lerpVectors(v.home, new THREE.Vector3(-2.2 + i * 0.55, 0.8 + (i % 2) * 0.7, (i - 2.5) * 0.25), clamp(k * 1.15, 0, 1));
        });
      },
    },
    {
      id: 'sig1', name: '第一信号', dur: 2.2,
      msg: () => say('一部分病毒直接碰上 B 细胞表面的受体——这就是 B 细胞活化的第一信号。', 'warn'),
      apply(k) {
        const hv = nodeBits.heroVirus;
        hv.visible = true;
        hv.position.lerpVectors(new THREE.Vector3(-1.6, -0.6, 0.5), nodeBits.b.position.clone().add(new THREE.Vector3(-0.55, 0.1, 0.25)), Math.min(k * 1.2, 1));
        if (k > 0.85) hv.scale.setScalar(1.05 * clamp(1 - (k - 0.85) * 4, 0.2, 1));
      },
    },
    {
      id: 'engulf', name: '摄取处理', dur: 2.6,
      msg: () => say('树突状细胞张开长长的伪突起，把病毒卷进体内。', 'warn'),
      apply(k) {
        const v0 = nodeBits.virusPoses[0];
        v0.p.lerpVectors(v0.home, nodeBits.apc.position.clone().add(new THREE.Vector3(0.1, 0.1, 0)), clamp(k * 1.2, 0, 1));
        if (k > 0.8) v0.alive = false;
      },
    },
    {
      id: 'present', name: '抗原呈递', dur: 2.6,
      msg: () => say('病毒蛋白被切成小片段（抗原肽），装到细胞表面的 MHC 分子上“展示”出来。', 'ok'),
      apply(k) {
        nodeBits.apc.traverse((o) => {
          if (o.material && o.material.emissive) o.material.emissiveIntensity = 0.4 + Math.sin(k * Math.PI * 3) * 0.3;
        });
      },
      leave() { nodeBits.apc.traverse((o) => { if (o.material && o.material.emissive) o.material.emissiveIntensity = 1; }); },
    },
  ];
  if (!hum.noTh) {
    steps.push(
      {
        id: 'th', name: 'Th 识别', dur: 2.4,
        msg: () => say('辅助性 T 细胞识别呈递出来的抗原，它表面的特定分子随之发生变化。', 'ok'),
        apply(k) {
          nodeBits.th.position.lerpVectors(TH0, nodeBits.apc.position.clone().add(new THREE.Vector3(-1.15, 0.35, 0.3)), Math.min(k * 1.25, 1));
          nodeBits.th.scale.setScalar(1 + 0.08 * k);
        },
      },
      {
        id: 'sig2', name: '第二信号', dur: 2.4,
        msg: () => say('这套已改变的分子与 B 细胞对接——B 细胞由此拿到第二信号。双信号齐备才能活化。', 'ok'),
        apply(k) {
          nodeBits.th.position.lerpVectors(nodeBits.apc.position.clone().add(new THREE.Vector3(-1.15, 0.35, 0.3)), nodeBits.b.position.clone().add(new THREE.Vector3(-0.62, 0.45, 0.2)), Math.min(k * 1.25, 1));
        },
      },
      {
        id: 'ck', name: '细胞因子', dur: 2.4,
        msg: () => say('辅助性 T 细胞随即增殖、分化，同时释放细胞因子，为 B 细胞的分裂分化助推。', 'ok'),
        apply(k, dt) {
          nodeBits.th.scale.setScalar(1.08 + 0.1 * k);
          const pts = nodeBits.ck;
          pts.visible = true;
          const n = pts.userData.n;
          const from = nodeBits.th.position;
          const to = nodeBits.b.position;
          for (let i = 0; i < n; i++) {
            const kk = clamp((k * 1.4 - i * 0.05) % 1, 0, 1);
            const p = from.clone().lerp(to, kk);
            p.y += Math.sin(kk * Math.PI) * 0.3 + Math.sin(kk * 9 + i) * 0.05;
            setParticle(pts, i, p.x, p.y, p.z);
          }
          commitParticle(pts, Math.round(k * n));
        },
        leave() { nodeBits.ck.visible = false; },
      },
    );
  } else {
    steps.push({
      id: 'noTh', name: '缺 Th', dur: 3.4,
      msg: () => say('辅助性 T 细胞被去掉：B 细胞只拿到第一信号，不能活化。这正是 HIV 破坏辅助性 T 细胞后，体液免疫近乎瘫痪的原因。', 'warn'),
      apply(k) {
        nodeBits.b.scale.setScalar(1 - k * 0.06);
        nodeBits.b.rotation.z = Math.sin(k * 6) * 0.05;
      },
    });
  }
  steps.push({
    id: 'divide', name: 'B 细胞分裂', dur: 3.0,
    msg: () => {
      if (hum.noTh) return;
      say(hum.noCk
        ? '细胞因子缺位：B 细胞仅完成一两轮分裂，扩增乏力。'
        : 'B 细胞受两个信号的刺激开始分裂：1 变 2、2 变 4……', hum.noCk ? 'warn' : 'ok');
    },
    apply(k) {
      const nMax = hum.noCk ? 2 : 4;
      nodeBits.bKids.forEach((kid, i) => {
        const kk = clamp(k * (nMax + 0.6) - i, 0, 1);
        kid.visible = kk > 0;
        kid.scale.setScalar(0.01 + kk * 0.8);
      });
      nodeBits.b.scale.setScalar(1 - 0.25 * clamp(k * 2, 0, 1));
    },
  });
  steps.push({
    id: 'differ', name: '分化', dur: 3.0,
    msg: () => {
      if (hum.noTh) return;
      say('大部分子细胞分化为浆细胞——胞内布满粗面内质网，是专门合成分泌抗体的工厂；小部分成为记忆 B 细胞长期待命。', 'ok');
    },
    apply(k) {
      const vis = hum.noTh ? 0 : 1;
      nodeBits.plasma.forEach((p, i) => {
        const kk = clamp(k * 3.4 - i * 0.8, 0, 1) * vis;
        p.visible = kk > 0;
        p.scale.setScalar(0.01 + kk * 0.9);
      });
      nodeBits.memory.forEach((m, i) => {
        const kk = clamp(k * 3.4 - 1.8 - i * 0.8, 0, 1) * vis;
        m.visible = kk > 0;
        m.scale.setScalar(0.01 + kk * 0.85);
      });
      nodeBits.lblPlasma.visible = vis > 0 && k > 0.4;
      nodeBits.lblMemory.visible = vis > 0 && k > 0.6;
      nodeBits.b.visible = k < 0.7;
      nodeBits.bKids.forEach((kid) => { kid.visible = kid.visible && k < 0.55; });
    },
  });
  steps.push({
    id: 'secrete', name: '分泌抗体', dur: 3.0,
    msg: () => {
      if (hum.noTh) return;
      say('浆细胞日夜不停地分泌抗体，一个浆细胞每秒可产出上千个抗体分子，抗体随体液循环全身。', 'ok');
    },
    apply(k) {
      const n = hum.noTh ? 0 : Math.round((hum.noCk ? 7 : 18) * k);
      hum.abLevel = n / 18;
      const poses = nodeAbPoses().slice(0, n);
      nodeBits.ab.apply(poses, performance.now() * 0.001);
    },
  });
  steps.push({
    id: 'bind', name: '特异性结合', dur: 2.8,
    msg: () => {
      if (hum.noTh) return;
      say(hum.noCk
        ? '抗体太少，只能结合住一部分病毒。'
        : '抗体精准咬合病毒表面的抗原决定簇，病毒从此黏附不了、也进不了人体细胞。', hum.noCk ? 'warn' : 'ok');
    },
    apply(k) {
      if (hum.noTh) return;
      hum.bound = hum.noCk ? k * 0.45 : k;
    },
  });
  steps.push({
    id: 'clear', name: '清除与留守', dur: 3.2,
    msg: () => {
      if (hum.noTh) return;
      say(hum.noCk
        ? '仍有病毒滞留：细胞因子断供后，浆细胞规模与抗体滴度都上不来。'
        : '抗体把病毒网成沉淀物，交由巨噬细胞吞入消化。病毒肃清，记忆 B 细胞则长期留存。', hum.noCk ? 'warn' : 'ok');
    },
    apply(k) {
      if (hum.noTh) return;
      hum.cleared = hum.noCk ? k * 0.5 : k;
      const m = nodeBits.macro;
      m.position.lerpVectors(new THREE.Vector3(3.4, 1.3, 0.6), nodeBits.clumpCenter.clone().add(new THREE.Vector3(0.5, 0.3, 0.2)), Math.min(k * 1.3, 1));
    },
  });
  return steps;
}

function nodeAbPoses() {
  const rnd = mulberry32(5);
  const poses = [];
  const p0 = nodeBits.plasma[0] ? nodeBits.plasma[0].position : new THREE.Vector3(2.3, -1.9, 0);
  for (let i = 0; i < 18; i++) {
    const tgt = nodeBits.virusPoses[i % nodeBits.virusPoses.length];
    const anchor = tgt && tgt.p.lengthSq() > 0.01 ? tgt.p : nodeBits.clumpCenter;
    poses.push({
      p: p0.clone().lerp(anchor, 0.35 + rnd() * 0.5)
        .add(new THREE.Vector3((rnd() - 0.5) * 1.2, rnd() * 0.9, (rnd() - 0.5) * 1.0)),
      s: 1.35, spin: rnd() * TAU,
    });
  }
  return poses;
}

function resetNodeActors() {
  nodeBits.virusPoses.forEach((v, i) => {
    v.alive = true;
    v.p.copy(v.home);
  });
  nodeBits.heroVirus.visible = false;
  nodeBits.heroVirus.scale.setScalar(1.05);
  nodeBits.th.position.set(-3.4, -0.9, 0.4);
  nodeBits.th.scale.setScalar(1);
  nodeBits.b.position.set(0.2, -1.55, 0);
  nodeBits.b.scale.setScalar(1);
  nodeBits.b.visible = true;
  nodeBits.b.rotation.z = 0;
  nodeBits.bKids.forEach((kid) => { kid.visible = false; kid.scale.setScalar(0.01); });
  nodeBits.plasma.forEach((p) => { p.visible = false; p.scale.setScalar(0.01); });
  nodeBits.memory.forEach((m) => { m.visible = false; m.scale.setScalar(0.01); });
  nodeBits.lblPlasma.visible = false;
  nodeBits.lblMemory.visible = false;
  nodeBits.ck.visible = false;
  nodeBits.ab.apply([], 0);
  nodeBits.macro.position.set(3.4, 1.3, 0.6);
  hum.abLevel = 0; hum.bound = 0; hum.cleared = 0;
  applyNodeViruses(0);
}

const humSeq = new Sequencer();
humSeq.onStep = (i, s) => {
  hset('stepNo', `${i + 1} / ${humSeq.steps.length}`);
  hset('talk', s.name);
  markSteps(i);
  logStamp = () => `step ${i + 1}`;
};
humSeq.onDone = () => say('链路走完。可改变条件（去 Th / 缺细胞因子）重看一遍。', 'ok');

function markSteps(onIdx) {
  const list = document.querySelectorAll('#controls .imm-step');
  list.forEach((el, i) => {
    el.classList.toggle('on', i === onIdx);
    el.classList.toggle('done', i < onIdx);
    el.classList.toggle('weak', el.dataset.weak === '1');
  });
}

function buildStepList(steps) {
  const host = document.querySelector('#controls');
  const old = host.querySelector('.imm-steps');
  if (old) old.remove();
  const box = document.createElement('div');
  box.className = 'imm-steps';
  steps.forEach((s, i) => {
    const el = document.createElement('div');
    el.className = 'imm-step';
    el.dataset.weak = s.weakFlag ? '1' : '0';
    const no = document.createElement('span');
    no.className = 'st-no';
    no.textContent = String(i + 1).padStart(2, '0');
    const t = document.createElement('span');
    t.className = 'st-t';
    t.textContent = s.name;
    el.append(no, t);
    el.addEventListener('click', () => { humSeq.auto = false; humSeq.start(i); });
    box.appendChild(el);
  });
  host.appendChild(box);
}

function tickHumoral(dt) {
  humSeq.tick(dt);
  applyNodeViruses(performance.now() * 0.001);
  const st = humSeq.current;
  /* 读数 */
  hset('sig', hum.noTh ? '仅第一信号' : hum.noCk ? '第一信号 + 弱促进' : '—');
  const abPct = Math.round(hum.abLevel * 100);
  hset('abV', abPct + '%');
  hset('bacV', st && (st.id === 'clear') ? (hum.noCk ? '部分残留' : '已清除') : st && st.id === 'bind' ? (hum.noCk ? '部分结合' : '结合中') : '游离');
  /* 结合阶段：抗体向病毒聚拢的附加动画 */
  if (st && st.id === 'bind' && !hum.noTh) {
    const poses = nodeAbPoses();
    const n = hum.noCk ? 7 : 18;
    const kk = hum.bound;
    poses.slice(0, n).forEach((ps, i) => {
      const tgt = nodeBits.virusPoses[i % nodeBits.virusPoses.length];
      ps.p.lerpVectors(ps.p, tgt.p.clone().add(new THREE.Vector3(0, -0.28, 0)), kk);
    });
    nodeBits.ab.apply(poses.slice(0, n), performance.now() * 0.001);
  }
  if (st && st.id === 'clear' && !hum.noTh) {
    /* 病毒向凝集中心聚拢 + 消失 */
    nodeBits.virusPoses.forEach((v, i) => {
      if (!v.alive) return;
      v.p.lerp(nodeBits.clumpCenter, Math.min(dt * 1.6 * hum.cleared, 0.2));
      if (hum.cleared > 0.75 && v.p.distanceTo(nodeBits.clumpCenter) < 0.5) v.alive = false;
    });
  }
}

/* ================= 章节三：二次免疫与疫苗（时间轴 · 对数坐标双曲线） ================= */

const worldMem = new THREE.Group();
world.add(worldMem);

const mem = {
  events: [],            // [{day, kind:'vaccine'|'expose', variant:bool, label}]
  day: 0, speed: 3, running: false,
  firedIdx: new Set(),
  verdict: '',           // 'protect' | 'sick' | ''
  histO: [], histV: [], histB: [],
};
const MEM_SPAN = 40;      // 天

/* 应答模型：ramp 平滑上升 + 指数衰减；对数作图 */
function ramp(t, a, b) {
  const x = clamp((t - a) / (b - a), 0, 1);
  return x * x * (3 - 2 * x);
}
/* kind='o' 原株抗体（相对 0..1）；kind='v' 变异株抗体 */
function abLevelAt(day, events, kind) {
  let v = 0;
  for (const ev of events) {
    if (day < ev.day) continue;
    const t = day - ev.day;
    if (ev.kind === 'vaccine') {
      v += kind === 'o' ? 0.34 * ramp(t, 2, 9) * Math.exp(-Math.max(0, t - 18) * 0.028)
                        : 0.06 * ramp(t, 4, 12) * Math.exp(-Math.max(0, t - 20) * 0.05);
    } else {
      const prior = events.some((e) => e.day < ev.day && (e.kind === 'vaccine' || e.kind === 'expose'));
      if (ev.variant) {
        /* 变异株：原记忆/抗体只能部分识别 */
        if (kind === 'v') {
          v += prior
            ? 0.8 * ramp(t, 3, 9) * Math.exp(-Math.max(0, t - 14) * 0.05)   // 交叉记忆加快但仍慢于同株二次
            : 0.5 * ramp(t, 5, 14) * Math.exp(-Math.max(0, t - 18) * 0.05);
        } else {
          v += 0.14 * ramp(t, 4, 12) * Math.exp(-Math.max(0, t - 16) * 0.06);
        }
      } else {
        if (kind === 'o') {
          v += prior
            ? 0.95 * ramp(t, 0.8, 3) * Math.exp(-Math.max(0, t - 9) * 0.035)
            : 0.4 * ramp(t, 4, 13) * Math.exp(-Math.max(0, t - 18) * 0.055);
        } else {
          v += 0.08 * ramp(t, 6, 14) * Math.exp(-Math.max(0, t - 20) * 0.05);
        }
      }
    }
  }
  return clamp(v, 0, 1.1);
}
/* 病原体负荷（相对 0..1，>0.62 过发病线） */
function bactAt(day, events) {
  let b = 0;
  for (const ev of events) {
    if (ev.kind !== 'expose' || day < ev.day) continue;
    const t = day - ev.day;
    const ab = ev.variant ? abLevelAt(day, events, 'v') : abLevelAt(day, events, 'o');
    const suppress = clamp(ab * 2.1, 0, 0.96);
    const peak = ev.variant ? 0.85 : 0.8;
    const g = peak * (1 - suppress) * ramp(t, 0.4, 3.2) * Math.exp(-Math.max(0, t - 2.5) * (0.16 + suppress * 0.6));
    b = Math.max(b, g);
  }
  return clamp(b, 0, 1);
}

const memBits = {};
{
  /* 对数坐标曲线图（左立板） */
  const W = 640, H = 400;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  const chartG = new THREE.Group();
  const back = mesh(new THREE.BoxGeometry(6.6, 4.2, 0.08), matStd(PAL.ink, { roughness: 0.6 }));
  back.position.z = -0.045;
  const face = mesh(new THREE.PlaneGeometry(6.4, 4.0), new THREE.MeshBasicMaterial({ map: tex }));
  chartG.add(back, face);
  chartG.position.set(-4.6, 2.4, -0.6);
  chartG.rotation.y = 0.34;
  worldMem.add(chartG);
  memBits.chart = { g: chartG, cv, ctx: cv.getContext('2d'), tex, W, H };
  /* 抗血清试剂瓶（疫苗道具，摆在图前桌面） */
  const vial = makeReagentBottle('疫苗（灭活）', 'tcell', 0.95, 0.3);
  vial.position.set(-3.2, 0, 0.6);
  worldMem.add(vial);
  const vialLbl = label('疫苗：灭活/减毒的抗原', '#dfe8ee', 0.0034);
  vialLbl.position.set(-3.2, 1.5, 0.6);
  worldMem.add(vialLbl);
  equipLabels.push(vialLbl);
  /* 记忆 B / 浆细胞 计数架 */
  memBits.memShelf = [];
  memBits.plShelf = [];
  for (let i = 0; i < 6; i++) {
    const m = makeImmuneCell({ r: 0.22, color: CV.memory, receptors: 6, recColor: PAL.chromatin, opacity: 0.55 });
    m.position.set(2.6 + (i % 3) * 0.55, 1.5 + Math.floor(i / 3) * 0.6, 0);
    m.visible = false;
    worldMem.add(m);
    memBits.memShelf.push(m);
    const p = makeImmuneCell({ r: 0.22, color: CV.plasma, er: 2, opacity: 0.6 });
    p.position.set(4.5 + (i % 3) * 0.55, 1.5 + Math.floor(i / 3) * 0.6, 0);
    p.visible = false;
    worldMem.add(p);
    memBits.plShelf.push(p);
  }
  const lbM = label('记忆 B（存量）', '#cdb0ff', 0.0034);
  lbM.position.set(3.15, 2.75, 0);
  const lbP = label('浆细胞（在岗数）', '#ffc9a8', 0.0034);
  lbP.position.set(5.05, 2.75, 0);
  worldMem.add(lbM, lbP);
  equipLabels.push(lbM, lbP);
  /* 病原体入侵脉冲（感染日的视觉提示：红环扩散） */
  memBits.pulse = mesh(new THREE.RingGeometry(0.3, 0.42, 40), new THREE.MeshBasicMaterial({
    color: CV.virus, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false,
  }));
  memBits.pulse.rotation.x = -Math.PI / 2;
  memBits.pulse.position.set(0, 0.02, 0.4);
  worldMem.add(memBits.pulse);
}

function drawMemChart() {
  const { ctx, cv, tex, W, H } = memBits.chart;
  const isDark = true; /* 场景内图板固定深色：与棚拍背景同调，避免浅色主题下 bloom 过曝 */
  ctx.fillStyle = isDark ? '#141a22' : '#f7f4ec';
  ctx.fillRect(0, 0, W, H);
  const padL = 56, padB = 46, padT = 40, padR = 26;
  const pw = W - padL - padR, ph = H - padT - padB;
  const fg = isDark ? '#dfe6ee' : '#2a3038';
  const grid = isDark ? '#2c3540' : '#d8d4c6';
  /* 对数 Y：10^0 .. 10^1.4（相对滴度），底部 1/4 高度让给病原体负荷线性刻度 */
  const bacH = ph * 0.3;
  const abH = ph - bacH - 8;
  ctx.strokeStyle = grid;
  ctx.lineWidth = 1;
  for (let i = 0; i <= 8; i++) {
    const x = padL + (i / 8) * pw;
    ctx.beginPath(); ctx.moveTo(x, padT); ctx.lineTo(x, padT + ph); ctx.stroke();
  }
  for (let i = 0; i <= 4; i++) {
    const y = padT + (i / 4) * abH;
    ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + pw, y); ctx.stroke();
  }
  /* 病原体区隔线 */
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = grid;
  ctx.beginPath(); ctx.moveTo(padL, padT + abH + 4); ctx.lineTo(padL + pw, padT + abH + 4); ctx.stroke();
  ctx.setLineDash([]);
  /* 发病线（病原体区） */
  const sickY = padT + abH + 8 + bacH * (1 - 0.62 / 1.0);
  ctx.strokeStyle = shade('virus', 0.95);
  ctx.setLineDash([7, 5]);
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(padL, sickY); ctx.lineTo(padL + pw, sickY); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = shade('virus', 0.95);
  ctx.font = '600 13px "PingFang SC", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('发病线', padL + 8, sickY - 6);
  /* 轴标 */
  ctx.fillStyle = fg;
  ctx.font = '12px "PingFang SC", sans-serif';
  ctx.textAlign = 'center';
  for (let d = 0; d <= MEM_SPAN; d += 10) ctx.fillText('第' + d + '天', padL + (d / MEM_SPAN) * pw, H - 16);
  ctx.fillText('时间轴（天）', padL + pw / 2, H - 2);
  ctx.save();
  ctx.translate(16, padT + abH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('抗体滴度（对数 · 相对）', 0, 0);
  ctx.restore();
  ctx.save();
  ctx.translate(W - 10, padT + abH + 8 + bacH / 2);
  ctx.rotate(Math.PI / 2);
  ctx.fillText('病原体负荷', 0, 0);
  ctx.restore();
  /* 事件竖线 */
  for (const ev of mem.events) {
    const x = padL + (ev.day / MEM_SPAN) * pw;
    const col = ev.kind === 'vaccine' ? shade('tcell', 0.85) : ev.variant ? palCss('memory', 1) : shade('virus', 0.9);
    ctx.strokeStyle = col;
    ctx.setLineDash([5, 4]);
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x, padT); ctx.lineTo(x, padT + ph); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = col;
    ctx.font = 'bold 12px "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(ev.label, x, padT - 10);
  }
  /* 曲线（画到当前 day） */
  const dEnd = Math.min(mem.day, MEM_SPAN);
  const plot = (fn, color, dash, width) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.setLineDash(dash);
    ctx.beginPath();
    for (let d = 0; d <= dEnd; d += 0.25) {
      const v = fn(d);
      const x = padL + (d / MEM_SPAN) * pw;
      const y = padT + (1 - clamp(v, 0, 1)) * abH;
      if (d === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  };
  plot((d) => Math.log10(1 + abLevelAt(d, mem.events, 'o') * 20) / Math.log10(21), shade('ab', 0.85), [], 3.4);
  plot((d) => Math.log10(1 + abLevelAt(d, mem.events, 'v') * 20) / Math.log10(21), palCss('memory', 1), [8, 5], 3);
  plot((d) => bactAt(d, mem.events) / 1.0, shade('virus', 0.75), [], 2.4);
  /* 当前游标 */
  if (mem.running && mem.day <= MEM_SPAN) {
    const vo = abLevelAt(dEnd, mem.events, 'o');
    const x = padL + (dEnd / MEM_SPAN) * pw;
    ctx.fillStyle = shade('ab', 0.85);
    ctx.beginPath();
    ctx.arc(x, padT + (1 - Math.log10(1 + vo * 20) / Math.log10(21)) * abH, 5.5, 0, TAU);
    ctx.fill();
  }
  tex.needsUpdate = true;
}

function memRunScript(list, msgs) {
  mem.events = list.map((e) => ({ ...e }));
  mem.day = 0;
  mem.running = list.length > 0;
  mem.firedIdx = new Set();
  mem.verdict = '';
  mem.histO = []; mem.histV = []; mem.histB = [];
  memBits.memShelf.forEach((m) => { m.visible = false; });
  memBits.plShelf.forEach((p) => { p.visible = false; });
  drawMemChart();
  logClear();
  logMsg('剧本开始：' + list.map((e) => `第${e.day}天·${e.label}`).join('，'), 'ok');
}

function tickMemory(dt) {
  if (!mem.running) return;
  mem.day += dt * mem.speed;
  /* 事件触发播报 */
  mem.events.forEach((ev, i) => {
    if (!mem.firedIdx.has(i) && mem.day >= ev.day) {
      mem.firedIdx.add(i);
      const txt = ev.kind === 'vaccine'
        ? `第 ${ev.day} 天：接种疫苗——一场安全的演习，身体开始练兵。`
        : ev.variant
          ? `第 ${ev.day} 天：感染变异株——它的抗原变了，原有记忆只能部分识别。`
          : `第 ${ev.day} 天：感染病原体。`;
      logMsg(txt, ev.kind === 'vaccine' ? 'ok' : 'warn');
      /* 脉冲 */
      memBits.pulse.material.opacity = 0.8;
      memBits.pulse.scale.setScalar(0.6);
      mem._pulseT = 0;
    }
  });
  /* 脉冲动画 */
  if (mem._pulseT !== undefined) {
    mem._pulseT += dt;
    memBits.pulse.scale.setScalar(0.6 + mem._pulseT * 2.4);
    memBits.pulse.material.opacity = Math.max(0, 0.8 - mem._pulseT * 0.8);
    if (mem._pulseT > 1) mem._pulseT = undefined;
  }
  /* 判定：病原体峰值 & 是否压住 */
  const d = Math.min(mem.day, MEM_SPAN);
  const b = bactAt(d, mem.events);
  if (b > 0.62 && !mem.verdict) {
    mem.verdict = 'sick';
    say('病原体数量越过发病线：出现症状了。', 'warn');
  }
  if (!mem.verdict && mem.day > 3 && b < 0.3 && mem.events.some((e) => e.kind === 'expose' && mem.day > e.day + 3)) {
    mem.verdict = 'protect';
    say('病原体来不及繁殖，就被记忆细胞指挥的抗体大军压制：不发病——这正是疫苗的价值。', 'ok');
  }
  /* 计数架 */
  const nMem = mem.events.filter((e) => e.kind === 'vaccine' || (e.kind === 'expose')).length;
  memBits.memShelf.forEach((m, i) => { m.visible = i < Math.min(nMem + (mem.events.some((e) => e.kind === 'vaccine') ? 2 : 0), 6); });
  const lvl = abLevelAt(d, mem.events, 'o');
  memBits.plShelf.forEach((p, i) => { p.visible = i < Math.round(lvl * 6); });
  /* 曲线重绘（节流） */
  mem._ct = (mem._ct || 0) + dt;
  if (mem._ct > 0.1) { mem._ct = 0; drawMemChart(); }
  /* 读数 */
  hset('dayV', `第 ${Math.round(Math.min(mem.day, MEM_SPAN))} 天`);
  hset('abO', Math.round(abLevelAt(d, mem.events, 'o') * 100) + '%');
  hset('abV', Math.round(abLevelAt(d, mem.events, 'v') * 100) + '%');
  hset('bacV', Math.round(b * 100) + '%');
  hset('condV', mem.verdict === 'sick' ? '已发病' : mem.verdict === 'protect' ? '未发病（被压住）' : '观察中…');
  if (mem.day > MEM_SPAN + 2) {
    mem.running = false;
    say('时间轴走完。换一种接种/感染顺序再试一次。', 'ok');
  }
}

/* ================= 章节四：免疫失调 · 过敏反应（呼吸道黏膜场景） ================= */

const worldMuc = new THREE.Group();
world.add(worldMuc);

const alg = {
  sens: false, antiH: false,
  histLevel: 0, perm: 0, symptoms: 0,
  seq: null,
};

const mucBits = {};
{
  /* 黏膜上皮基板 */
  const base = mesh(new THREE.BoxGeometry(12.4, 0.5, 3.2), matStd(PAL.membraneDeep, { roughness: 0.7 }));
  base.position.set(0, 0.75, 0);
  worldMuc.add(base);
  /* 柱状上皮细胞阵列（instanced 胞体 + 纤毛） */
  const cols = 20, rowsZ = 5;
  const epi = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.16, 0.2, 0.55, 10),
    matSheen(PAL.membrane, { roughness: 0.5, opacity: 0.96 }), cols * rowsZ);
  const cilia = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.012, 0.02, 0.3, 5),
    matStd(PAL.cytosolLit, { roughness: 0.5 }), cols * rowsZ * 3);
  let ei = 0, ci = 0;
  const rnd = mulberry32(88);
  for (let r = 0; r < rowsZ; r++) {
    for (let c = 0; c < cols; c++) {
      const x = -5.6 + c * 0.59;
      const z = -1.25 + r * 0.62;
      _q.setFromEuler(new THREE.Euler(0, rnd() * 0.4, 0));
      _s.set(1, 1, 1);
      _m4.compose(_v.set(x, 1.28, z), _q, _s);
      epi.setMatrixAt(ei++, _m4);
      for (let k = 0; k < 3; k++) {
        const off = new THREE.Vector3((k - 1) * 0.07, 0.24, (rnd() - 0.5) * 0.1);
        _q.setFromEuler(new THREE.Euler((rnd() - 0.5) * 0.5, 0, (rnd() - 0.5) * 0.5));
        _m4.compose(_v.set(x + off.x, 1.66 + off.y * 0.5, z + off.z), _q, _s.set(1, 1, 1));
        cilia.setMatrixAt(ci++, _m4);
      }
    }
  }
  worldMuc.add(epi, cilia);
  mucBits.cilia = cilia;
  mucBits.ciliaN = ci;
  /* 杯状细胞 ×3（顶部黏液滴） */
  mucBits.goblets = [];
  for (const gx of [-3.2, 0.4, 3.6]) {
    const gob = mesh(new THREE.SphereGeometry(0.3, 14, 10), matSheen(palCss('tissue', 0.8), { roughness: 0.4, opacity: 0.95 }));
    gob.position.set(gx, 1.42, 0.8);
    gob.scale.set(1, 1.5, 1);
    const drop = mesh(new THREE.SphereGeometry(0.14, 10, 8), matGlass(CV.mucus, { transmission: 0.8, opacity: 0.6 }));
    drop.position.set(gx, 1.92, 0.8);
    worldMuc.add(gob, drop);
    mucBits.goblets.push(drop);
  }
  /* 黏膜下组织液区 + 毛细血管 + 平滑肌 */
  const sub = mesh(new THREE.BoxGeometry(12.4, 1.3, 3.2), ghostify(matSheen(CV.tissue, { roughness: 0.7 }), 0.22));
  sub.position.set(0, -0.15, 0);
  worldMuc.add(sub);
  const vPts = [];
  for (let k = 0; k <= 40; k++) {
    const t = k / 40;
    vPts.push(new THREE.Vector3(-5.4 + t * 10.8, -0.3 + Math.sin(t * TAU * 1.1) * 0.22, 0.7 + Math.cos(t * 5) * 0.3));
  }
  const vessel = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(vPts), 80, 0.13, 10), matCoat(CV.vesselA, { roughness: 0.42 }));
  worldMuc.add(vessel);
  mucBits.vessel = vessel;
  for (const yy of [0.15, -0.55]) {
    const mPts = [];
    for (let k = 0; k <= 30; k++) {
      const t = k / 30;
      mPts.push(new THREE.Vector3(-5.8 + t * 11.6, yy + Math.sin(t * TAU * 1.8 + yy) * 0.08, -0.9));
    }
    worldMuc.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(mPts), 60, 0.055, 6), matStd(PAL.actin, { roughness: 0.5 })));
  }
  /* 肥大细胞（贴近血管）：颗粒满载 + 表面 IgE 位点 */
  const mast = makeImmuneCell({ r: 0.5, color: CV.mast, receptors: 0, granules: 16, opacity: 0.6 });
  mast.position.set(-1.6, 0.05, 0.3);
  worldMuc.add(mast);
  mucBits.mast = mast;
  /* 表面 IgE（instanced 双段 Y） */
  const igeN = 10;
  const igeStems = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.014, 0.02, 0.16, 5), matCoat(CV.abIgE, { roughness: 0.36 }), igeN);
  const igeTips = new THREE.InstancedMesh(new THREE.SphereGeometry(0.035, 8, 6), matCoat(CV.abIgE, { roughness: 0.3 }), igeN);
  mucBits.igeStems = igeStems;
  mucBits.igeTips = igeTips;
  mucBits.igeN = igeN;
  mucBits.igeDirs = fibSphere(igeN, 1);
  worldMuc.add(igeStems, igeTips);
  applyMastIge(0);
  /* 花粉群（instanced 简球）×2 特写 */
  const polN = 8;
  mucBits.pollen = new THREE.InstancedMesh(new THREE.SphereGeometry(0.14, 12, 10), matCoat(CV.pollen, { roughness: 0.5, clearcoat: 0.4 }), polN);
  mucBits.pollen.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mucBits.pollenPoses = [];
  const rndP = mulberry32(6);
  for (let i = 0; i < polN; i++) {
    mucBits.pollenPoses.push({
      home: new THREE.Vector3(-6.5, 2.4 + rndP() * 0.5, (rndP() - 0.5) * 2),
      p: new THREE.Vector3(), spin: rndP() * TAU,
    });
  }
  worldMuc.add(mucBits.pollen);
  const heroPollen = makePollen(0.2);
  heroPollen.position.set(-6.5, 2.4, 0);
  heroPollen.visible = true;
  worldMuc.add(heroPollen);
  mucBits.heroPollen = heroPollen;
  /* 组胺粒子 + 血浆渗出粒子 */
  mucBits.hist = makeParticleCloud(22, CV.hist, 0.08, 0.95);
  mucBits.hist.visible = false;
  worldMuc.add(mucBits.hist);
  mucBits.leak = makeParticleCloud(24, CV.tissue, 0.1, 0.8);
  mucBits.leak.visible = false;
  worldMuc.add(mucBits.leak);
  /* 抗组胺药：血管壁上的受体封闭小板 */
  const blockers = new THREE.InstancedMesh(new THREE.BoxGeometry(0.09, 0.05, 0.05), matStd(PAL.ink, { roughness: 0.4, metalness: 0.3 }), 8);
  vPts.forEach((p, i) => { if (i < 8) setInst(blockers, i, p.clone().add(new THREE.Vector3(0, 0.14, 0)), new THREE.Vector3(0, 1, 0.2), 1); });
  blockers.visible = false;
  worldMuc.add(blockers);
  mucBits.blockers = blockers;
  /* 红肿症状环（发作时黏膜泛红的染色片） */
  const flush = mesh(new THREE.PlaneGeometry(12.4, 3.2), new THREE.MeshBasicMaterial({
    color: CV.virus, transparent: true, opacity: 0, depthWrite: false,
  }));
  flush.rotation.x = -Math.PI / 2;
  flush.position.set(0, 2.06, 0);
  worldMuc.add(flush);
  mucBits.flush = flush;
  /* 标注 */
  mucBits.labels = new THREE.Group();
  worldMuc.add(mucBits.labels);
  const lm = label('肥大细胞（颗粒满载）', '#f2b8d0', 0.0038);
  lm.position.set(-1.6, 0.95, 0.3);
  const lv = label('毛细血管', '#ffc9a8', 0.0034);
  lv.position.set(2.6, 0.5, 1.2);
  const lc = label('呼吸道黏膜 · 纤毛上皮', '#bfe2f8', 0.0038);
  lc.position.set(-2.2, 2.5, 0);
  mucBits.labels.add(lm, lv, lc);
  equipLabels.push(lm, lv, lc);
}

function applyMastIge(reveal01 = 1) {
  const n = Math.round(mucBits.igeN * clamp(reveal01, 0, 1));
  mucBits.igeStems.count = n;
  mucBits.igeTips.count = n;
  const R = 0.5;
  for (let i = 0; i < n; i++) {
    const d = mucBits.igeDirs[i];
    const p = d.clone().multiplyScalar(R + 0.06);
    p.add(mucBits.mast.position);
    setInst(mucBits.igeStems, i, p, d, 1);
    setInst(mucBits.igeTips, i, d.clone().multiplyScalar(R + 0.16).add(mucBits.mast.position), d, 1);
  }
  mucBits.igeStems.instanceMatrix.needsUpdate = true;
  mucBits.igeTips.instanceMatrix.needsUpdate = true;
}

function resetAllergy() {
  alg.sens = false;
  alg.histLevel = 0;
  alg.perm = 0;
  alg.symptoms = 0;
  if (alg.seq) alg.seq.stop();
  applyMastIge(0);
  mucBits.hist.visible = false;
  mucBits.leak.visible = false;
  mucBits.blockers.visible = alg.antiH;
  mucBits.flush.material.opacity = 0;
  mucBits.heroPollen.position.set(-6.5, 2.4, 0);
  mucBits.pollenPoses.forEach((p, i) => { p.p.copy(p.home); });
  hset('state', '未致敏');
  hset('histV', '0');
  hset('permV', '正常');
  hset('symV', '无');
}

function buildAllergySeq(phase) {
  const seq = new Sequencer();
  const pollenTo = (i, tgt, k) => {
    const p = mucBits.pollenPoses[i];
    p.p.lerpVectors(p.home, tgt, clamp(k * 1.25, 0, 1));
  };
  if (phase === 'first') {
    seq.load([
      {
        id: 'first-in', dur: 2.2,
        msg: () => say('花粉初次闯入呼吸道黏膜。普通人无事，过敏体质者却视之为“入侵者”。', 'warn'),
        apply(k) {
          pollenTo(0, new THREE.Vector3(-1.0, 1.9, 0.6), k);
          mucBits.heroPollen.position.lerpVectors(new THREE.Vector3(-6.5, 2.4, 0), new THREE.Vector3(-1.0, 2.0, 0.7), clamp(k * 1.2, 0, 1));
        },
      },
      {
        id: 'ige-made', dur: 2.2,
        msg: () => say('体内产生了针对这种过敏原的抗体——IgE。', 'ok'),
        apply(k) { applyMastIge(0); },
      },
      {
        id: 'ige-bind', dur: 2.6,
        msg: () => say('IgE 吸附到肥大细胞表面——人已经“致敏”，但此刻没有任何症状。', 'ok'),
        apply(k) {
          applyMastIge(k);
          if (k >= 1) { alg.sens = true; hset('state', '已致敏（无症状）'); logMsg('致敏完成：IgE 已布防在肥大细胞表面。', 'ok'); }
        },
      },
    ]);
    return seq;
  }
  /* 发作相 */
  const steps = [
    {
      id: 'again', dur: 2.0,
      msg: () => say('同样的花粉卷土重来。', 'warn'),
      apply(k) {
        pollenTo(2, mucBits.mast.position.clone().add(new THREE.Vector3(0.2, 0.7, 0.2)), k);
      },
    },
    {
      id: 'crosslink', dur: 2.2,
      msg: () => say('过敏原把肥大细胞表面上相邻的两个 IgE 连到一起——这就是触发信号。', 'warn'),
      apply(k) {
        const tgt = mucBits.mast.position.clone().add(new THREE.Vector3(0.15, 0.62, 0.1));
        mucBits.pollenPoses[2].p.lerp(tgt, clamp(k * 1.6, 0, 1));
      },
    },
  ];
  steps.push({
    id: 'release', dur: 2.8,
    msg: () => say('肥大细胞脱颗粒：组胺等物质被释放到周围组织。', 'warn'),
    apply(k, dt) {
      alg.histLevel = k;
      const pts = mucBits.hist;
      pts.visible = true;
      const n = pts.userData.n;
      for (let i = 0; i < n; i++) {
        const kk = clamp((k * 1.3 - i * 0.045) % 1, 0, 1);
        const a = (i / n) * TAU;
        const r = 0.3 + kk * 1.9;
        const p = mucBits.mast.position;
        setParticle(pts, i, p.x + Math.cos(a) * r, p.y + 0.2 + Math.sin(a * 2.3) * 0.3 + kk * 0.4, p.z + Math.sin(a) * r);
      }
      commitParticle(pts, Math.round(clamp(k * 1.15, 0, 1) * n));
      hset('histV', Math.round(k * 100) + '%');
    },
  });
  if (alg.antiH) {
    steps.push({
      id: 'blocked', dur: 3.0,
      msg: () => say('抗组胺药占住了血管上的组胺受体：组胺照常释放，却无法起效——血管不扩张、不渗漏。', 'ok'),
      begin() { mucBits.blockers.visible = true; },
      apply(k) {
        alg.perm = k * 0.06;
        alg.symptoms = k * 0.05;
      },
    });
  } else {
    steps.push({
      id: 'leak', dur: 3.4,
      msg: () => say('组胺令毛细血管舒张、管壁渗漏加大：血浆外渗、组织液蓄积——红肿、流涕、皮疹接连登场。', 'warn'),
      apply(k) {
        alg.perm = k;
        alg.symptoms = k;
        mucBits.vessel.scale.set(1, 1 + k * 0.7, 1 + k * 0.7);
        const pts = mucBits.leak;
        pts.visible = true;
        const n = pts.userData.n;
        for (let i = 0; i < n; i++) {
          const kk = clamp((k * 1.2 - i * 0.04) % 1, 0, 1);
          const x = -4.4 + (i % 8) * 1.2;
          const y = -0.2 + kk * 0.9;
          const z = 0.7 + ((i * 13) % 5) * 0.2;
          setParticle(pts, i, x, y, z);
        }
        commitParticle(pts, Math.round(clamp(k * 1.1, 0, 1) * n));
        hset('permV', k > 0.5 ? '显著增强' : '增强中');
        hset('symV', k > 0.4 ? '红肿 · 流涕' : '开始出现');
      },
    });
  }
  seq.load(steps);
  return seq;
}

function tickAllergy(dt) {
  /* 纤毛摆动 */
  const t = performance.now() * 0.001;
  const wave = Math.sin(t * 3.2) * 0.28;
  for (let i = 0; i < mucBits.ciliaN; i++) {
    mucBits.cilia.getMatrixAt(i, _m4);
    _m4.decompose(_v, _q, _s);
    const keep = _q.clone();
    _q.setFromEuler(new THREE.Euler(wave * 0.4, 0, wave));
    _q.multiply(keep);
    _m4.compose(_v, _q, _s);
    mucBits.cilia.setMatrixAt(i, _m4);
  }
  mucBits.cilia.instanceMatrix.needsUpdate = true;
  /* 花粉漂浮 */
  mucBits.pollenPoses.forEach((p, i) => {
    _q.setFromEuler(new THREE.Euler(t * 0.8 + p.spin, p.spin * 0.7, 0));
    _m4.compose(_v.copy(p.p.x ? p.p : p.home).add(new THREE.Vector3(0, Math.sin(t * 1.7 + i) * 0.06, 0)), _q, _s.set(1, 1, 1));
    mucBits.pollen.setMatrixAt(i, _m4);
  });
  mucBits.pollen.instanceMatrix.needsUpdate = true;
  if (mucBits.heroPollen.visible && !alg.seq?.playing) {
    mucBits.heroPollen.position.y = 2.4 + Math.sin(t * 1.4) * 0.08;
    mucBits.heroPollen.rotation.y = t * 0.6;
  }
  /* 症状红晕 */
  mucBits.flush.material.opacity += (alg.symptoms * 0.24 - mucBits.flush.material.opacity) * Math.min(dt * 3, 1);
  /* 序列步进 */
  if (alg.seq) alg.seq.tick(dt);
  /* 黏液滴呼吸 */
  mucBits.goblets.forEach((d, i) => { d.scale.setScalar(1 + Math.sin(t * 2 + i * 2) * 0.08); });
}

/* ================= 章节五：随堂检测（8 题 · 语义等价改写） ================= */

const QUIZ = [
  {
    q: '下列各项中，属于人体第二道防线组成的是',
    opts: ['皮肤表层的角质层', '气管黏膜上摆动的纤毛', '体液里的杀菌物质和吞噬细胞', '浆细胞分泌到体液中的抗体'],
    a: 2,
    ex: '杀菌物质（如溶菌酶）与吞噬细胞是第二道防线；角质层和纤毛属于第一道，抗体属于第三道。',
  },
  {
    q: '要激活一个 B 细胞，需要的两个信号是',
    opts: ['病原体直接接触 B 细胞；辅助性 T 细胞表面变化的分子与 B 细胞结合', '病原体直接接触 B 细胞；浆细胞开始分泌抗体', '吞噬细胞吞噬病原体；细胞因子大量出现', '抗体结合病原体；吞噬细胞前来清除'],
    a: 0,
    ex: '第一信号=抗原直接刺激 B 细胞受体；第二信号=辅助性 T 细胞表面分子变化后与 B 细胞结合。两者缺一不可。',
  },
  {
    q: '体液免疫中，真正合成并分泌抗体的细胞是',
    opts: ['B 细胞', '记忆 B 细胞', '浆细胞', '辅助性 T 细胞'],
    a: 2,
    ex: '浆细胞（效应 B 细胞）负责量产抗体；B 细胞是它的前身，记忆 B 负责待命，辅助性 T 负责指挥。',
  },
  {
    q: '以下免疫细胞里，不具备抗原特异性识别能力的是',
    opts: ['B 细胞', '记忆 B 细胞', '辅助性 T 细胞', '浆细胞'],
    a: 3,
    ex: '浆细胞是“专职分泌工厂”，表面没有抗原受体，不再识别抗原——识别的工作留给 B 细胞和记忆 B。',
  },
  {
    q: '与初次免疫相比，二次免疫的典型特点是',
    opts: ['更慢更弱，抗体量更少', '更快更强，抗体产生又早又多', '不再需要抗原刺激', '主要由浆细胞自身增殖来完成'],
    a: 1,
    ex: '记忆 B 对同种抗原极敏感：二次应答启动更快、抗体峰值更高——这也是疫苗加强针的原理。',
  },
  {
    q: '接种过流感疫苗的人第二年仍可能患流感，最合理的解释是',
    opts: ['疫苗里的病毒毒力太强', '流感病毒发生变异，原有的抗体和记忆细胞识别不了新株', '疫苗让人失去了第二道防线', '记忆 B 细胞在接种后全部死亡'],
    a: 1,
    ex: '抗体和记忆 B 都有特异性：病毒抗原一变，旧记忆只能部分识别，需要针对新株的应答甚至新疫苗。',
  },
  {
    q: '艾滋病患者的体液免疫功能也严重下降，主要原因是 HIV 破坏了',
    opts: ['B 细胞', '浆细胞', '辅助性 T 细胞', '吞噬细胞'],
    a: 2,
    ex: '辅助性 T 细胞是特异性免疫的“指挥”：它被大量破坏后，B 细胞拿不到第二信号和细胞因子，体液免疫近乎瘫痪。',
  },
  {
    q: '有关过敏反应的叙述，正确的一项是',
    opts: ['第一次接触过敏原就会出现明显症状', 'IgE 吸附在肥大细胞表面，再次接触同一过敏原时释放组胺等物质', '过敏反应是一种免疫缺陷病', '过敏反应全程都不会产生抗体'],
    a: 1,
    ex: '首次接触→产生 IgE 并吸附于肥大细胞（致敏，无症状）；再次接触→交联触发脱颗粒、释放组胺。它属于免疫过强（功能紊乱），且会产生 IgE。',
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
        ex.textContent = (correct ? '✓ 答对了。' : '✗ 再想想。') + item.ex;
        ex.classList.add('show');
        card.querySelector('.q-score').textContent = `得分：${score}`;
        const foot = card.querySelector('.q-foot');
        const next = document.createElement('button');
        next.type = 'button';
        next.className = 'ctl-btn active';
        next.textContent = idx < QUIZ.length - 1 ? '下一题 →' : '看成绩 →';
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
    hset('qNo', `${idx + 1} / ${QUIZ.length}`);
    hset('qScore', score + ' 分');
  }

  function renderResult() {
    panel.innerHTML = '';
    const card = document.createElement('div');
    card.className = 'quiz-card q-result';
    const pct = Math.round((score / QUIZ.length) * 100);
    card.innerHTML = `
      <div class="q-progress">检测完成</div>
      <div class="big">${score} / ${QUIZ.length}</div>
      <p style="color:var(--text-dim);margin:4px 0 18px">正确率 ${pct}%${pct >= 80 ? '，免疫这章很扎实！' : pct >= 60 ? '，大概念清楚了，错题值得再过一遍。' : '，建议回到前面章节把过程再捋一遍。'}</p>`;
    const again = document.createElement('button');
    again.type = 'button';
    again.className = 'ctl-btn active';
    again.textContent = '重新作答';
    again.addEventListener('click', () => { idx = 0; score = 0; renderQ(); });
    const back = document.createElement('button');
    back.type = 'button';
    back.className = 'ctl-btn';
    back.textContent = '回到第一章';
    back.addEventListener('click', () => { panel.remove(); window.__eduSections.select(0); });
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:10px;justify-content:center;flex-wrap:wrap';
    row.append(back, again);
    card.appendChild(row);
    panel.appendChild(card);
    logMsg(`随堂检测完成：答对 ${score} / ${QUIZ.length} 题。`, 'ok');
  }

  renderQ();
  return () => panel.remove();
}

/* ================= 章节装配 ================= */

const ctl = createControlsPanel(document.getElementById('controls'));
let hud = null;
let chapterTick = null;
let activeCleanup = null;

function camTo(pos, target) { app.setCamera(pos, target); }
function setHudRows(rows) {
  const wrap = document.getElementById('lcData');
  if (hud) { hud.el.remove(); hud = null; }
  if (rows && rows.length) {
    hud = makeHUD(wrap, rows);
    rows.forEach(([k]) => hud.set(k, '–'));
  }
  ensureLog(wrap);
}
function hset(key, text) { if (hud) hud.set(key, text); }
function say(text, kind = 'ok') {
  toast(text, kind);
  logMsg(text, kind);
}

/* 实验记录（原版功能 1:1）：lcData 下方滚动清单 */
let logBox = null;
function ensureLog(wrap) {
  if (logBox && logBox.isConnected) return;
  logBox = document.createElement('div');
  logBox.className = 'imm-log';
  logBox.innerHTML = `
    <div class="imm-log-head">实验记录<button class="log-clear" type="button">清空</button></div>
    <ul><li class="dim"><em>—</em><span>还没有操作。</span></li></ul>`;
  logBox.querySelector('.log-clear').addEventListener('click', logClear);
  wrap.appendChild(logBox);
}
function logClear() {
  if (logBox) logBox.querySelector('ul').innerHTML = '<li class="dim"><em>—</em><span>还没有操作。</span></li>';
}
function logMsg(text, level = 'ok') {
  if (!logBox) return;
  const ul = logBox.querySelector('ul');
  const dim = ul.querySelector('li.dim');
  if (dim) dim.remove();
  const li = document.createElement('li');
  if (level === 'warn') li.className = 'warn';
  const em = document.createElement('em');
  em.textContent = logStamp();
  const sp = document.createElement('span');
  sp.textContent = text;
  li.append(em, sp);
  ul.prepend(li);
  while (ul.children.length > 24) ul.lastChild.remove();
}

function showOnly(g) {
  worldDef.visible = worldNode.visible = worldMem.visible = worldMuc.visible = false;
  g.visible = true;
}

const CAM_DEFAULTS = {
  defense: [[0.2, 2.7, 13.9], [0, 0.95, 0]],
  humoral: [[0, 0.7, 11.6], [0, 0.15, 0]],
  memory: [[-0.8, 3.2, 15.2], [-1.0, 1.7, 0]],
  allergy: [[0.2, 1.6, 12.8], [0, 0.6, 0]],
  quiz: [[0, 0.7, 11.6], [0, 0.15, 0]],
};

/* —— 第一章控件 —— */
function buildDefenseControls() {
  ctl.clear();
  ctl.seg({
    options: [{ label: '完整皮肤', value: 'skin' }, { label: '破损伤口', value: 'wound' }, { label: '大量入侵', value: 'massive' }],
    value: def.route,
    onChange: (v) => { def.route = v; resetDefense(); defSeq.load(buildDefenseSteps()); },
  });
  ctl.toggle({
    label: '关闭吞噬细胞', value: def.noPhago,
    onChange: (v) => {
      def.noPhago = v;
      skinBits.macro.visible = !v;
      resetDefense();
      defSeq.load(buildDefenseSteps());
      say(v ? '已关闭吞噬细胞：第二道防线缺员，重看结局。' : '吞噬细胞归队。', v ? 'warn' : 'ok');
    },
  });
  ctl.toggle({
    label: '关闭淋巴细胞', value: def.noLymph,
    onChange: (v) => {
      def.noLymph = v;
      resetDefense();
      defSeq.load(buildDefenseSteps());
      say(v ? '已关闭淋巴细胞：第三道防线缺员，抗体不会登场。' : '淋巴细胞归队。', v ? 'warn' : 'ok');
    },
  });
  ctl.sep();
  ctl.button({
    label: '▶ 开始推演', active: true,
    onClick: () => {
      resetDefense();
      defSeq.load(buildDefenseSteps());
      defSeq.start(0);
      def.running = true;
    },
  });
  ctl.button({ label: '↺ 重做实验', onClick: () => { resetDefense(); defSeq.load(buildDefenseSteps()); } });
  ctl.slider({
    label: '推演速度', min: 0.5, max: 2.5, step: 0.1, value: 1.2,
    fmt: (v) => '×' + v.toFixed(1),
    onInput: (v) => { defSeq.speed = v; def.daysPerSec = 1.6 * v; },
  });
  ctl.sep();
  ctl.toggle({
    label: '模型标注', value: true,
    onChange: (v) => { skinBits.labels.visible = v; },
  });
}

const secDef = {
  id: 'defense', title: '人体的三道防线',
  html: `<p>病原体要致病，先得连闯三关。<b>第一道</b>由皮肤和黏膜把守——角质层像砖墙，纤毛与分泌液负责清扫；<b>第二道</b>藏在体液里：杀菌物质（溶菌酶）加上四处巡逻的吞噬细胞。这两道生来就有、不挑对手，是<span class="hl">非特异性免疫</span>。</p>
<p><b>第三道</b>由免疫器官和免疫细胞（以淋巴细胞为主）组成，出生后才逐步建立，只针对特定病原体，是<span class="hl">特异性免疫</span>，起效要几天。</p>
<p>右侧选一条入侵途径、试着关闭吞噬细胞，按「开始推演」看病原体的命运和细菌数量曲线——数量越过<span class="hl">发病线</span>就出现症状。</p>`,
  enter() {
    showOnly(worldDef);
    camTo(...CAM_DEFAULTS.defense);
    chapterTick = tickDefense;
    buildDefenseControls();
    resetDefense();
    defSeq.load(buildDefenseSteps());
    defSeq.speed = 1.2;
  },
};

/* —— 第二章控件 —— */
function buildHumoralControls() {
  ctl.clear();
  ctl.button({
    label: '下一步 ▸', active: true,
    onClick: () => {
      humSeq.auto = false;
      if (humSeq.idx < 0) humSeq.start(0);
      else if (humSeq.playing) humSeq.pause();
      else humSeq.next();
    },
  });
  ctl.toggle({
    label: '自动播放', value: humSeq.auto,
    onChange: (v) => {
      humSeq.auto = v;
      if (v && humSeq.idx < 0) humSeq.start(0);
      else if (v) humSeq.resume();
    },
  });
  ctl.button({ label: '↺ 重做实验', onClick: () => { humSeq.load(buildHumoralSteps()); buildStepList(humSeq.steps); resetNodeActors(); markSteps(-1); } });
  ctl.sep();
  ctl.toggle({
    label: '去掉辅助性 T 细胞', value: hum.noTh,
    onChange: (v) => {
      hum.noTh = v;
      nodeBits.th.visible = !v;
      humSeq.load(buildHumoralSteps());
      buildStepList(humSeq.steps);
      resetNodeActors();
      markSteps(-1);
      say(v ? '辅助性 T 已离场：观察 B 细胞只拿第一信号的后果。' : '辅助性 T 归队。', v ? 'warn' : 'ok');
    },
  });
  ctl.toggle({
    label: '缺少细胞因子', value: hum.noCk,
    onChange: (v) => {
      hum.noCk = v;
      humSeq.load(buildHumoralSteps());
      buildStepList(humSeq.steps);
      resetNodeActors();
      markSteps(-1);
      say(v ? '细胞因子断供：B 细胞增殖与抗体产量都会打折。' : '细胞因子恢复供应。', v ? 'warn' : 'ok');
    },
  });
  ctl.slider({
    label: '演示速度', min: 0.5, max: 2.5, step: 0.1, value: 1,
    fmt: (v) => '×' + v.toFixed(1),
    onInput: (v) => { humSeq.speed = v; },
  });
  ctl.sep();
  ctl.toggle({
    label: '模型标注', value: true,
    onChange: (v) => { nodeBits.labels.visible = v; },
  });
  buildStepList(humSeq.steps);
}

const secHum = {
  id: 'humoral', title: '体液免疫的过程',
  html: `<p>病毒进入体液后，<b>B 细胞</b>要被激活需要<span class="hl">两个信号</span>：其一为病原体直接接触 B 细胞受体，其二为辅助性 T 细胞以表面已改变的分子与它对接。而辅助性 T 得先从<b>树突状细胞</b>那里“看”到呈递的抗原。</p>
<p>双信号齐备、再加上细胞因子的促进，B 细胞才分裂分化：<b>浆细胞</b>量产抗体，<b>记忆 B</b> 留作后备。抗体与病原体特异性结合，让它失去黏附力，再凝集成沉淀交给巨噬细胞消化。</p>
<p>点「下一步」逐段推进，或开「自动播放」。试着<span class="hl">去掉辅助性 T</span> 或<span class="hl">断掉细胞因子</span>，看免疫链在哪一环断掉——这正是 HIV 的破坏方式。</p>`,
  enter() {
    showOnly(worldNode);
    camTo(...CAM_DEFAULTS.humoral);
    chapterTick = tickHumoral;
    humSeq.load(buildHumoralSteps());
    buildHumoralControls();
    resetNodeActors();
    markSteps(-1);
    setHudRows([['stepNo', '当前步'], ['talk', '讲解'], ['sig', 'B 信号'], ['abV', '抗体水平'], ['bacV', '病毒状态']]);
    hset('stepNo', '待开始');
    hset('talk', '点「下一步」或开「自动播放」');
    hset('sig', '—');
    hset('abV', '0%');
    hset('bacV', '游离');
  },
};

/* —— 第三章控件 —— */
function buildMemoryControls() {
  ctl.clear();
  ctl.button({
    label: '① 疫苗 → 第21天感染原株', active: true,
    onClick: () => {
      memRunScript([
        { day: 0, kind: 'vaccine', label: '疫苗' },
        { day: 21, kind: 'expose', variant: false, label: '感染' },
      ]);
      say('先演习后实战：注意第 21 天的应答有多快。', 'ok');
    },
  });
  ctl.button({
    label: '② 无疫苗：第0天感染 → 第14天再感染',
    onClick: () => {
      memRunScript([
        { day: 0, kind: 'expose', variant: false, label: '初次感染' },
        { day: 14, kind: 'expose', variant: false, label: '再次感染' },
      ]);
      say('没有疫苗直接硬扛：第一次慢而弱，第二次靠记忆细胞翻身。', 'warn');
    },
  });
  ctl.button({
    label: '③ 疫苗 → 第21天感染变异株',
    onClick: () => {
      memRunScript([
        { day: 0, kind: 'vaccine', label: '疫苗' },
        { day: 21, kind: 'expose', variant: true, label: '变异株' },
      ]);
      say('病毒变了样：原有记忆只能部分识别，看新抗体爬坡要几天。', 'warn');
    },
  });
  ctl.button({
    label: '④ 无疫苗：直接感染变异株',
    onClick: () => {
      memRunScript([
        { day: 0, kind: 'expose', variant: true, label: '变异株' },
      ]);
      say('既没疫苗又遇上新株：最被动的局面。', 'warn');
    },
  });
  ctl.sep();
  ctl.button({ label: '↺ 重做实验', onClick: () => { memRunScript([]); } });
  ctl.slider({
    label: '时间流速', min: 1, max: 8, step: 0.5, value: mem.speed,
    fmt: (v) => v.toFixed(0) + ' 天/秒',
    onInput: (v) => { mem.speed = v; },
  });
  ctl.sep();
  /* 图例说明条 */
  const legend = document.createElement('div');
  legend.className = 'imm-legend';
  legend.innerHTML = `
    <span><i class="lg-ab1"></i>原株抗体</span>
    <span><i class="lg-ab2"></i>变异株抗体</span>
    <span><i class="lg-bac"></i>病原体负荷</span>
    <span><i class="lg-sick"></i>发病线</span>`;
  ctl.el.appendChild(legend);
  ctl.toggle({
    label: '模型标注', value: true,
    onChange: (v) => {
      worldMem.traverse((o) => {
        if (o.isSprite && equipLabels.includes(o)) o.visible = v;
      });
    },
  });
}

const secMem = {
  id: 'memory', title: '二次免疫与疫苗',
  html: `<p><b>初次免疫</b>：B 细胞要经历活化、分裂、分化的全程爬坡，抗体出现慢、峰值低；<b>二次免疫</b>：<span class="hl">记忆 B 细胞</span>认出老对手后迅速增殖分化，抗体<b>又快又多</b>——病原体往往还没繁殖起来就被压住。</p>
<p><b>疫苗</b>用的正是这个原理：把灭活或减毒的抗原（或其成分）送进人体做一次“安全演习”，练出抗体和记忆细胞；有的疫苗要打两三剂，就是借二次免疫把保护垒高。</p>
<p>下方四个剧本任意点选，时间轴自动推进：<span class="hl">金色实线</span>=原株抗体，<span class="hl">紫色虚线</span>=变异株抗体，红线是病原体负荷；疫苗事件用蓝线标记。如果曲线越过<span class="hl">发病线</span>，就算发病。</p>`,
  enter() {
    showOnly(worldMem);
    camTo(...CAM_DEFAULTS.memory);
    chapterTick = tickMemory;
    buildMemoryControls();
    setHudRows([['dayV', '时间'], ['abO', '原株抗体'], ['abV', '变异株抗体'], ['bacV', '病原体'], ['condV', '病情']]);
    memRunScript([]);
  },
};

/* —— 第四章控件 —— */
function buildAllergyControls() {
  ctl.clear();
  ctl.button({
    label: '① 首次接触过敏原（致敏）', active: !alg.sens,
    onClick: () => {
      if (alg.sens) { say('已经致敏过了，直接演「再次接触」。', 'ok'); return; }
      alg.seq = buildAllergySeq('first');
      alg.seq.start(0);
    },
  });
  ctl.button({
    label: '② 再次接触（引发症状）',
    onClick: () => {
      if (!alg.sens) { say('顺序不能反：先完成第一次接触（致敏），再发作。', 'warn'); return; }
      alg.seq = buildAllergySeq('again');
      alg.seq.start(0);
    },
  });
  ctl.sep();
  ctl.toggle({
    label: '预先服用抗组胺药', value: alg.antiH,
    onChange: (v) => {
      alg.antiH = v;
      mucBits.blockers.visible = v;
      resetAllergy();
      say(v ? '抗组胺药已就位：血管受体被提前占住。' : '停药，恢复正常敏感度。', v ? 'ok' : 'warn');
    },
  });
  ctl.toggle({
    label: '模型标注', value: true,
    onChange: (v) => { mucBits.labels.visible = v; },
  });
}

const secAlg = {
  id: 'allergy', title: '免疫失调：过敏反应',
  html: `<p>免疫是把双刃剑：过强或过弱都算病。<b>过敏反应</b>指已致敏的机体再次接触<span class="hl">相同抗原</span>时发生的功能紊乱：第一次接触时产生的 <b>IgE</b> 会挂到<b>肥大细胞</b>上（此刻毫无症状）；再次进入的同种过敏原把相邻 IgE 连在一起，触发<b>组胺</b>从肥大细胞倾泻而出——毛细血管扩张、通透性增强，于是红肿、流涕、皮疹。</p>
<p>特点是发作快、反应强、消退也快，一般不破坏组织细胞，且有明显的个体差异；严重病例要立即用<b>肾上腺素</b>急救，拮抗渗漏可用<b>抗组胺药</b>。</p>
<p>另外两类失调值得记住：<b>自身免疫病</b>——免疫系统把自身成分当敌人打（如系统性红斑狼疮、风湿性心脏病）；<b>免疫缺陷病</b>——免疫功能不足或缺失（如 HIV 破坏辅助性 T 细胞导致的艾滋病）。</p>
<p>按①②两步演示，看看「致敏」和「发作」为什么顺序不能反；再试试先服抗组胺药。</p>`,
  enter() {
    showOnly(worldMuc);
    camTo(...CAM_DEFAULTS.allergy);
    chapterTick = tickAllergy;
    buildAllergyControls();
    resetAllergy();
    setHudRows([['state', '致敏状态'], ['histV', '组胺释放'], ['permV', '血管通透性'], ['symV', '症状']]);
    logStamp = () => alg.seq && alg.seq.current ? alg.seq.current.id : '待命';
  },
};

/* —— 第五章：随堂检测 —— */
const secQuiz = {
  id: 'quiz', title: '随堂检测',
  html: `<p>八个问题覆盖本章全部主线：防线归属、双信号、效应细胞、二次免疫、变异株、HIV 与过敏。答完可重新作答。</p>`,
  enter() {
    showOnly(worldNode);
    camTo(...CAM_DEFAULTS.quiz);
    chapterTick = () => {};
    ctl.clear();
    ctl.toggle({
      label: '自动旋转', value: false,
      onChange: (v) => { worldNode.rotation.y = 0; quizSpin = v; },
    });
    setHudRows([['qNo', '进度'], ['qScore', '得分']]);
    activeCleanup = showQuiz();
    logStamp = () => 'quiz';
  },
};
let quizSpin = false;

const SECTIONS = [secDef, secHum, secMem, secAlg, secQuiz];

/* ================= 布局驱动（三栏 / 折叠 / 专注 / 手风琴 / 快捷键） ================= */

const chapNav = document.getElementById('chapNav');
const chapCount = document.getElementById('chapCount');
const detailNo = document.getElementById('detailNo');
const detailTitle = document.getElementById('detailTitle');
const lessonEl = document.getElementById('lesson');
const detailBody = document.getElementById('detailBody');
const controlsEl = document.getElementById('controls');
const shell = document.getElementById('immuneShell');
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
  quizSpin = false;
  worldNode.rotation.y = 0;
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
const FOLD_KEY = { l: 'immune.foldL', r: 'immune.foldR' };
let foldL = false;
let foldR = false;
let focusSaved = null;
try {
  foldL = localStorage.getItem(FOLD_KEY.l) === '1';
  foldR = localStorage.getItem(FOLD_KEY.r) === '1';
} catch (e) { /* localStorage 不可用时仅会话内生效 */ }
function applyShellFold() {
  shell.classList.toggle('fold-l', foldL);
  shell.classList.toggle('fold-r', foldR);
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
  shell.classList.toggle('focus-mode', on);
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

/* 右栏三块手风琴，localStorage 记忆、切章不重置；≤1100px 首访清爽态（读数默认收） */
const ACC_KEYS = { lesson: 'immune.accLesson', controls: 'immune.accControls', data: 'immune.accData' };
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

/* 舞台工具：重做 / 模型标签 / 视角 / 大屏 + 键盘 ← → ] R */
const chapPrev = document.getElementById('chapPrev');
const chapNext = document.getElementById('chapNext');
const resetBtn = document.getElementById('resetBtn');
const labelBtn = document.getElementById('labelBtn');
const viewBtn = document.getElementById('viewBtn');
const bigBtn = document.getElementById('bigBtn');

function gotoChapter(i) { selectChapter((i + SECTIONS.length) % SECTIONS.length); }
chapPrev.addEventListener('click', () => gotoChapter(chapterIdx - 1));
chapNext.addEventListener('click', () => gotoChapter(chapterIdx + 1));
resetBtn.addEventListener('click', () => {
  selectChapter(chapterIdx);
  toast('实验已复位，回到本章初始状态。', 'ok');
});
let labelsOn = true;
try { labelsOn = localStorage.getItem('immune.labels') !== '0'; } catch (e) { /* 忽略 */ }
function applyLabels() {
  for (const s of equipLabels) s.visible = labelsOn;
  labelBtn.classList.toggle('on', labelsOn);
  labelBtn.setAttribute('aria-pressed', String(labelsOn));
}
labelBtn.addEventListener('click', () => {
  labelsOn = !labelsOn;
  try { localStorage.setItem('immune.labels', labelsOn ? '1' : '0'); } catch (e) { /* 忽略 */ }
  applyLabels();
});
applyLabels();
viewBtn.addEventListener('click', () => {
  const [p, t] = CAM_DEFAULTS[SECTIONS[chapterIdx].id] || CAM_DEFAULTS.defense;
  camTo(p, t);
  toast('视角已复位。', 'ok');
});
let bigMode = false;
function applyBig() {
  document.body.classList.toggle('immune-big', bigMode);
  bigBtn.classList.toggle('on', bigMode);
  bigBtn.setAttribute('aria-pressed', String(bigMode));
}
bigBtn.addEventListener('click', () => {
  bigMode = !bigMode;
  setFocus(bigMode);
  applyBig();
});
applyBig();
window.addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const t = e.target;
  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
  if (e.key === 'ArrowLeft' || e.key === ',') gotoChapter(chapterIdx - 1);
  else if (e.key === 'ArrowRight' || e.key === '.') gotoChapter(chapterIdx + 1);
  else if (e.key === ']') toggleFold('r');
  else if (e.key === 'r' || e.key === 'R') viewBtn.click();
});

/* 提示条 */
function toast(text, kind = 'ok') {
  const old = stage.querySelector('.immune-toast');
  if (old) old.remove();
  const el = document.createElement('div');
  el.className = 'immune-toast ' + kind;
  el.textContent = text;
  stage.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 300);
  }, kind === 'warn' ? 4600 : 3600);
}

/* ================= 帧循环与启动 ================= */

app.onFrame((dt) => {
  if (chapterTick) chapterTick(dt);
  if (quizSpin) worldNode.rotation.y += dt * 0.35;
});

setTimeout(() => {
  loader.hide();
  window.__eduSections = { select: selectChapter };
  window.__immuneDebug = { vfx, app, PAL, CV };
  selectChapter(0);
}, 60);
