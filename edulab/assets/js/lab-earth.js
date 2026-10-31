/* EduLab · 地球运动课堂（earth）
 * 章节：总览 / 自转 / 昼夜交替与晨昏线 / 公转 / 直射点移动 / 昼夜长短 / 正午太阳高度 / 四季更替 / 随堂检测
 * 场景：贴图地球（day/night/clouds/normal/specular）+ 太阳，黄赤交角 23.44°，自转公转联动。
 * 布局（micro 三件套移植）：真·三栏教学布局——左栏课程大纲列表（点击切章）/ 中栏 3D 舞台
 *       （相机飞行）/ 右栏知识点详解 + 本章控件 + 数据读数；左右栏独立折叠（28px 竖条）+
 *       专注模式 + 右栏三块手风琴（localStorage 记忆，切章不重置）。
 * 视觉工艺（edu-vfx 接入）：后处理管线 + cubic 运镜（attachVFX 接管渲染与相机缓动）。
 * 建模深改（Micro 级标准）：
 *   - 太阳总装：程序化米粒组织光球贴图（granule/超米粒/黑子对/光斑）+ 临边昏暗 shader
 *     + 色球边缘壳 + 双层日冕射线 sprite（自旋呼吸）
 *   - 地轴总装：钢质轴杆 + 黄铜车削轴端（LatheGeometry 车削轮廓：轴环→颈→球→尖顶）
 *     + 极区轴环 + 配重尾锥
 *   - 纬线环实体化：赤道/回归线/极圈 Torus 管环 + 虚线伴随环 + 赤道度数刻 Tick（InstancedMesh）
 *     + 五环名称标签（随环组显隐）
 *   - 教具化标记：北京/直射点图钉（锥杆 + 发光珠 + 切面光环，直射点光环脉动）
 *   - 晨昏线升级：虚线主环 + 贴球暮光带（晨昏蒙影双层，随晨昏面同转）+ 标注
 *   - 方向弧工厂 makeDirArc（自转/公转共用）：弧管 + 雪佛龙 + 端头箭锥，走向与真实转向一致
 *   - 黄赤交角演示装置：黄道面盘 + 赤道面盘 + 二分线 + ε 交角弧（章节淡入淡出）
 *   - 彗星道具：开普勒方程解算椭圆轨道（近日点加速可见）+ 离子尾/尘埃尾双尾粒子
 *     （反日向 + 速度滞后弯曲，尾长随日距变化）
 *   - 公转刻度环：CanvasTexture 环面贴图（12 月名 + 365 日刻 + 度数环 + 二分二至金刻）
 *     + 近日点/远日点标记 + 黄铜车削月份针
 *   - 深空叙事：银河带 fbm 星云 ×5 + 旋涡星系 ×3 + 四针衍射亮星 ×6（程序化贴图）
 *   - 光照氛围：程序化摄影棚环境反射（金属件 PBR）+ 冷色银河补光 + 半球环境
 */
import {
  THREE, DEG, TAU, clamp,
  loadTexture, loadAll, createApp, makeLoader,
  createControlsPanel, makeHUD, makeTextSprite, setSpriteText, makeGlowTexture,
  circleLine, makeStars,
} from './edu-core.js';
import {
  attachVFX, PAL, matStd, matCoat, matGlow, ghostify,
  fbm3, makeStudioEnvironment,
} from './edu-vfx.js';

/* ---------------- 常量与天文公式 ---------------- */

const TEXDIR = '../assets/textures/earth/';
const EPS = 23.44 * DEG;          // 黄赤交角
const ORBIT_R = 12;               // 公转轨道半径（示意）
const SUN_DIST = 40;              // 近景模式下太阳摆放距离
const OBS_LON = 116.4;            // 北京经度（东经，度）
const YEAR_DAYS = 365;

const DEG_2PI = TAU / 360;
// 一年中的第 N 天（1=1月1日）→ 太阳黄经（地球位置角）
function lambdaE(N) { return TAU * (N - 80) / YEAR_DAYS; }
// 太阳赤纬 δ = asin(sin ε · sin λe)
function declination(N) { return Math.asin(Math.sin(EPS) * Math.sin(lambdaE(N))); }
// 地球在轨道上的位置（黄道面 XZ，+Y 为黄道北）
function orbitPos(N, radius = ORBIT_R) {
  const l = lambdaE(N);
  return new THREE.Vector3(Math.cos(l) * radius, 0, -Math.sin(l) * radius);
}
// 太阳方向（地心指向太阳，世界系）
function sunDirVec(N) { return orbitPos(N, 1).multiplyScalar(-1); }

const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
function dateText(N) {
  let n = clamp(Math.round(N), 1, YEAR_DAYS), m = 0;
  while (n > MONTH_DAYS[m]) { n -= MONTH_DAYS[m]; m++; }
  return `${m + 1}月${n}日`;
}
// 昼长（小时）：cos ω0 = −tanφ·tanδ
function dayLengthHours(latDeg, deltaRad) {
  const x = -Math.tan(latDeg * DEG) * Math.tan(deltaRad);
  if (x <= -1) return 24;
  if (x >= 1) return 0;
  return (2 * Math.acos(x)) / DEG_2PI / 15;
}
function noonAltitude(latDeg, deltaRad) { return 90 - Math.abs(latDeg - deltaRad / DEG); }

/* ---------------- 场景搭建 ---------------- */

const stage = document.getElementById('stage');
const loader = makeLoader(stage, '正在加载地球贴图…');

const app = createApp({
  container: stage,
  fov: 42,
  near: 0.05, far: 3000,
  cameraPos: [0, 1.6, 3.6],
  target: [0, 0, 0],
  minDistance: 1.25,
  maxDistance: 40,
  toneMapping: THREE.NoToneMapping,
  keepBackground: true,
});
const { scene, camera, controls } = app;
/* 视觉工艺轻接入：后处理管线接管渲染循环与相机缓动（setCamera 升级为 cubic 运镜），
   背景交给 illus 模式管理（星空仍为场景内容，不受影响） */
const vfx = attachVFX(app, 'illus');

/* ================= 视觉工艺车间（Micro 级建模精修：色板 / 材质 / 程序化贴图 / 造型工厂） ================= */

const mesh = (geo, mat) => new THREE.Mesh(geo, mat);

/* 太空族色板（本实验本地族，深空黑背景高对比；金属件复用 PAL.brass/steel） */
const SKY = {
  sunCore: 0xfff3c4, granuleHot: '255,246,214', granuleCool: '214,132,38',
  sunspot: '#3a1c08', penumbra: '120,55,15', facula: '255,238,190',
  corona: '255,205,130', chromo: 0xff9440,
  axisSteel: 0x39404a, pinMetal: 0x8f9aa6,
  equator: 0x9adfff, tropic: 0xffb35c, polar: 0x8fd3ff,
  ecliptic: 0xf2c979, celestEq: 0x74bfe8, hinge: 0xffe08a,
  cometIce: 0xcfd9e4, coma: '172,224,255', ionTail: [0.42, 0.72, 1.0], dustTail: [1.0, 0.84, 0.62],
  dialTick: 'rgba(190,208,232,0.34)', dialTickHi: 'rgba(255,209,102,0.95)',
  dialText: 'rgba(206,221,240,0.88)', dialDeg: 'rgba(152,172,198,0.66)',
};

/* —— 材质分层（四级分工：主体 coat / 次要 std / 发光 glow；金属只给真金属件） —— */
const M_SHAFT = matStd(SKY.axisSteel, { roughness: 0.32, metalness: 0.92 });     // 地轴钢杆
const M_BRASS2 = matStd(PAL.brass, { roughness: 0.27, metalness: 1 });           // 黄铜车削件（轴端/月份针）
const M_PINMETAL = matStd(SKY.pinMetal, { roughness: 0.36, metalness: 0.85 });   // 图钉锥杆
const M_COMETICE = matStd(SKY.cometIce, { roughness: 0.85, metalness: 0.05, emissive: 0x1c2a3a, emissiveIntensity: 0.5 }); // 彗核脏冰

/* —— 可播种随机（本页纹理需可复现，截图可对照） —— */
function sRand(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* 画布贴图工厂（颜色空间 + 各向异性，micro 同款习惯） */
function canvasTex(w, h, draw) {
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  draw(cv.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/* ---------------- 程序化贴图工厂 ---------------- */

/** 太阳光球米粒组织（等距圆柱 1024×512）：
 *  底色暖黄 → 2600 颗米粒胞元（亮核暖白 + 暗缘橙褐）→ 60 个超米粒大胞 →
 *  3 组黑子（本影 + 半影晕 + 伴生微孔）→ 50 处光斑增亮。同 seed 可复现。 */
function sunGranulationTexture() {
  const W = 1024, H = 512;
  const rnd = sRand(20261031);
  return canvasTex(W, H, (ctx) => {
    ctx.fillStyle = '#ffd47e';
    ctx.fillRect(0, 0, W, H);
    /* 超米粒大胞（低频亮暗起伏） */
    for (let i = 0; i < 60; i++) {
      const x = rnd() * W, y = rnd() * H, r = 26 + rnd() * 34;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      const hot = rnd() > 0.5;
      g.addColorStop(0, `rgba(${hot ? '255,240,200' : '212,132,38'},${0.05 + rnd() * 0.06})`);
      g.addColorStop(1, 'rgba(212,132,38,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    /* 米粒胞元：亮核（lighter）+ 暗缘（source-over）两遍 */
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 1600; i++) {
      const x = rnd() * W, y = rnd() * H, r = 2.5 + rnd() * 6;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(${SKY.granuleHot},${0.30 + rnd() * 0.30})`);
      g.addColorStop(1, `rgba(${SKY.granuleHot},0)`);
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    ctx.globalCompositeOperation = 'source-over';
    for (let i = 0; i < 1100; i++) {
      const x = rnd() * W, y = rnd() * H, r = 2 + rnd() * 5;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(0.7, `rgba(${SKY.granuleCool},${0.10 + rnd() * 0.12})`);
      g.addColorStop(1, `rgba(${SKY.granuleCool},0)`);
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    /* 黑子对：中纬度三组（本影椭圆 + 半影径向晕 + 伴生微孔/光斑） */
    const spot = (x0, y0, s) => {
      const pg = ctx.createRadialGradient(x0, y0, 0, x0, y0, s * 2.6);
      pg.addColorStop(0, `rgba(${SKY.penumbra},0.52)`);
      pg.addColorStop(0.55, `rgba(${SKY.penumbra},0.22)`);
      pg.addColorStop(1, `rgba(${SKY.penumbra},0)`);
      ctx.fillStyle = pg;
      ctx.fillRect(x0 - s * 2.6, y0 - s * 2.6, s * 5.2, s * 5.2);
      ctx.save();
      ctx.translate(x0, y0);
      ctx.rotate((rnd() - 0.5) * 0.8);
      ctx.scale(1, 0.62 + rnd() * 0.2);
      ctx.fillStyle = SKY.sunspot;
      ctx.globalAlpha = 0.88;
      ctx.beginPath();
      ctx.arc(0, 0, s, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.restore();
      for (let k = 0; k < 5; k++) {   /* 伴生微孔 */
        const a = rnd() * TAU, d = s * (1.6 + rnd() * 1.4);
        ctx.fillStyle = `rgba(70,32,10,${0.35 + rnd() * 0.3})`;
        ctx.beginPath();
        ctx.arc(x0 + Math.cos(a) * d, y0 + Math.sin(a) * d * 0.7, 1.2 + rnd() * 2.2, 0, TAU);
        ctx.fill();
      }
      for (let k = 0; k < 8; k++) {   /* 邻近光斑 */
        const a = rnd() * TAU, d = s * (2.4 + rnd() * 2.6);
        const fx = x0 + Math.cos(a) * d, fy = y0 + Math.sin(a) * d * 0.7;
        const fg = ctx.createRadialGradient(fx, fy, 0, fx, fy, 4 + rnd() * 5);
        fg.addColorStop(0, `rgba(${SKY.facula},0.4)`);
        fg.addColorStop(1, `rgba(${SKY.facula},0)`);
        ctx.fillStyle = fg;
        ctx.fillRect(fx - 10, fy - 10, 20, 20);
      }
    };
    spot(W * (0.18 + rnd() * 0.1), H * 0.30, 9 + rnd() * 4);
    spot(W * (0.46 + rnd() * 0.08), H * 0.68, 12 + rnd() * 5);
    spot(W * (0.72 + rnd() * 0.1), H * 0.36, 7 + rnd() * 3);
    /* 散布光斑提亮 */
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 50; i++) {
      const x = rnd() * W, y = rnd() * H, r = 3 + rnd() * 6;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(${SKY.facula},0.22)`);
      g.addColorStop(1, `rgba(${SKY.facula},0)`);
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    ctx.globalCompositeOperation = 'source-over';
  });
}

/** 日冕射线贴图（叠加混合 sprite 用）：140 条随机长度软射线 + 内核晕 + 中层辉光 */
function coronaRayTexture(seed) {
  const S = 512, C = S / 2;
  const rnd = sRand(seed);
  return canvasTex(S, S, (ctx) => {
    ctx.translate(C, C);
    for (let i = 0; i < 140; i++) {
      const a = rnd() * TAU;
      const len = S * (0.14 + Math.pow(rnd(), 2.1) * 0.34);
      const w = 0.8 + rnd() * 2.4;
      const g = ctx.createLinearGradient(0, 0, Math.cos(a) * len, Math.sin(a) * len);
      g.addColorStop(0, `rgba(${SKY.corona},${0.10 + rnd() * 0.10})`);
      g.addColorStop(1, `rgba(${SKY.corona},0)`);
      ctx.strokeStyle = g;
      ctx.lineWidth = w;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * S * 0.055, Math.sin(a) * S * 0.055);
      ctx.lineTo(Math.cos(a) * len, Math.sin(a) * len);
      ctx.stroke();
    }
    const core = ctx.createRadialGradient(0, 0, 0, 0, 0, S * 0.17);
    core.addColorStop(0, 'rgba(255,244,214,0.95)');
    core.addColorStop(0.5, 'rgba(255,222,150,0.42)');
    core.addColorStop(1, 'rgba(255,222,150,0)');
    ctx.fillStyle = core;
    ctx.fillRect(-C, -C, S, S);
    const halo = ctx.createRadialGradient(0, 0, 0, 0, 0, S * 0.48);
    halo.addColorStop(0, `rgba(${SKY.corona},0.30)`);
    halo.addColorStop(0.5, `rgba(${SKY.corona},0.10)`);
    halo.addColorStop(1, `rgba(${SKY.corona},0)`);
    ctx.fillStyle = halo;
    ctx.fillRect(-C, -C, S, S);
  });
}

/** 软粒子贴图（彗尾/星点通用）：径向柔斑 + 细噪环 */
function softDotTexture(rgb = SKY.coma) {
  const S = 64, C = S / 2;
  return canvasTex(S, S, (ctx) => {
    const g = ctx.createRadialGradient(C, C, 0, C, C, C);
    g.addColorStop(0, `rgba(${rgb},0.95)`);
    g.addColorStop(0.35, `rgba(${rgb},0.42)`);
    g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, S, S);
  });
}

/** 四针衍射亮星贴图：亮核 + 主十字针 + 45° 弱针 + 外晕（深空亮星道具） */
function diffractionStarTexture() {
  const S = 256, C = S / 2;
  return canvasTex(S, S, (ctx) => {
    ctx.translate(C, C);
    const spike = (ang, len, w, a0) => {
      ctx.save();
      ctx.rotate(ang);
      const g = ctx.createLinearGradient(0, 0, len, 0);
      g.addColorStop(0, `rgba(255,255,255,${a0})`);
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(0, -w);
      ctx.lineTo(len, 0);
      ctx.lineTo(0, w);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };
    for (const ang of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) spike(ang, S * 0.47, 1.6, 0.85);
    for (const ang of [Math.PI / 4, Math.PI * 3 / 4, Math.PI * 5 / 4, Math.PI * 7 / 4]) spike(ang, S * 0.2, 1.1, 0.3);
    const core = ctx.createRadialGradient(0, 0, 0, 0, 0, S * 0.1);
    core.addColorStop(0, 'rgba(255,255,255,1)');
    core.addColorStop(0.4, 'rgba(255,255,255,0.5)');
    core.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = core;
    ctx.fillRect(-C, -C, S, S);
    const halo = ctx.createRadialGradient(0, 0, 0, 0, 0, C);
    halo.addColorStop(0, 'rgba(220,235,255,0.20)');
    halo.addColorStop(1, 'rgba(220,235,255,0)');
    ctx.fillStyle = halo;
    ctx.fillRect(-C, -C, S, S);
  });
}

/** 旋涡星系贴图：核球暖晕 + 双对数螺臂点阵（HII 区点缀）+ 外盘雾 */
function spiralGalaxyTexture(seed) {
  const S = 512, C = S / 2;
  const rnd = sRand(seed);
  return canvasTex(S, S, (ctx) => {
    ctx.translate(C, C);
    const bulge = ctx.createRadialGradient(0, 0, 0, 0, 0, 92);
    bulge.addColorStop(0, 'rgba(255,238,214,0.9)');
    bulge.addColorStop(0.25, 'rgba(255,224,190,0.34)');
    bulge.addColorStop(1, 'rgba(255,224,190,0)');
    ctx.fillStyle = bulge;
    ctx.fillRect(-C, -C, S, S);
    const haze = ctx.createRadialGradient(0, 0, 0, 0, 0, C * 0.94);
    haze.addColorStop(0, 'rgba(168,186,235,0.16)');
    haze.addColorStop(1, 'rgba(168,186,235,0)');
    ctx.fillStyle = haze;
    ctx.fillRect(-C, -C, S, S);
    for (const arm of [0, Math.PI]) {
      for (let i = 0; i <= 640; i++) {
        const t = i / 640;
        const r = Math.min(18 * Math.exp(2.95 * t), C * 0.9);
        const th = arm + t * 4.7 + (rnd() - 0.5) * 0.16;
        const x = Math.cos(th) * r, y = Math.sin(th) * r * 0.96;
        const fade = (1 - t) * (0.32 + rnd() * 0.4);
        const pink = rnd() > 0.965;
        ctx.fillStyle = pink
          ? `rgba(255,178,196,${fade})`
          : `rgba(${215 + rnd() * 40 | 0},${222 + rnd() * 30 | 0},255,${fade})`;
        ctx.beginPath();
        ctx.arc(x, y, Math.max(0.5, 1.7 - t * 1.2) * (0.7 + rnd() * 0.9), 0, TAU);
        ctx.fill();
      }
    }
    for (let i = 0; i < 130; i++) {   /* 盘面散星 */
      const a = rnd() * TAU, r = Math.sqrt(rnd()) * C * 0.8;
      ctx.fillStyle = `rgba(235,240,255,${0.08 + rnd() * 0.22})`;
      ctx.fillRect(Math.cos(a) * r, Math.sin(a) * r, 1.1, 1.1);
    }
  });
}

/** 深空星云贴图（银河带用）：水平带内 fbm 团块叠加 + 散星点 */
function nebulaTexture(seed, rgb = '96,128,190') {
  const S = 512, C = S / 2;
  const rnd = sRand(seed);
  return canvasTex(S, S, (ctx) => {
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 120; i++) {
      const x = C + (rnd() + rnd() + rnd() - 1.5) * C * 0.62;
      const y = C + (rnd() + rnd() + rnd() - 1.5) * C * 0.3;
      const r = 16 + rnd() * 74;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(${rgb},${0.035 + rnd() * 0.055})`);
      g.addColorStop(1, `rgba(${rgb},0)`);
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    /* 暖色尘埃带暗芯（银河核心方向） */
    const core = ctx.createRadialGradient(C * 0.7, C, 0, C * 0.7, C, 120);
    core.addColorStop(0, 'rgba(228,196,150,0.10)');
    core.addColorStop(1, 'rgba(228,196,150,0)');
    ctx.fillStyle = core;
    ctx.fillRect(0, 0, S, S);
    for (let i = 0; i < 340; i++) {
      const x = rnd() * S, y = C + (rnd() - 0.5) * S * 0.5;
      ctx.fillStyle = `rgba(240,244,255,${0.10 + rnd() * 0.4})`;
      ctx.fillRect(x, y, rnd() > 0.94 ? 1.8 : 1, 1);
    }
    ctx.globalCompositeOperation = 'source-over';
  });
}

/** 公转刻度环贴图（2048² 环面）：12 月名 + 365 日刻（每 10 日加强 + 二分二至金刻）
 *  + 内圈度数环。贴图角 → 世界 φ 映射：本地 +Y 对世界 −Z，rotate(φ+π/2) 后画在 (0,−r)。 */
function orbitGraduatedTexture() {
  const S = 2048, C = S / 2, ROUT = C - 10, RIN = ROUT * (11.5 / 12.5);
  const K = S / (12.5 * 2 * ORBIT_R);   /* 环带宽 → 画布像素比例（RingGeometry UV 按外径归一） */
  return canvasTex(S, S, (ctx) => {
    /* 环面底 */
    ctx.beginPath();
    ctx.arc(C, C, ROUT, 0, TAU);
    ctx.arc(C, C, RIN, 0, TAU, true);
    ctx.fillStyle = 'rgba(150,178,214,0.055)';
    ctx.fill();
    /* 内外圈细描线 */
    for (const [r, a] of [[ROUT, 0.4], [RIN, 0.3]]) {
      ctx.strokeStyle = `rgba(170,195,225,${a})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(C, C, r, 0, TAU);
      ctx.stroke();
    }
    const at = (phi, fn) => {
      /* 世界方位角 φ → 画布：rotate(π/2 − φ) 后画在 (0,−r)（推导见构造处注释） */
      ctx.save();
      ctx.translate(C, C);
      ctx.rotate(Math.PI / 2 - phi);
      fn();
      ctx.restore();
    };
    /* 365 日刻 */
    for (let d = 1; d <= 365; d++) {
      const phi = TAU * (d - 80) / 365;
      const season = d === 80 || d === 173 || d === 266 || d === 355;
      const big = season || d % 10 === 0;
      const r1 = ROUT - (season ? 34 : big ? 20 : 11);
      at(phi, () => {
        ctx.strokeStyle = season ? SKY.dialTickHi : SKY.dialTick;
        ctx.lineWidth = season ? 5 : big ? 3 : 1.6;
        ctx.beginPath();
        ctx.moveTo(0, -ROUT);
        ctx.lineTo(0, -r1);
        ctx.stroke();
      });
    }
    /* 12 月名（各月月中位置） */
    const cum = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
    ctx.font = '600 46px "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let m = 0; m < 12; m++) {
      const phi = TAU * (cum[m] + 15.5 - 80) / 365;
      at(phi, () => {
        ctx.fillStyle = SKY.dialText;
        ctx.fillText(`${m + 1}月`, 0, -(RIN + (ROUT - RIN) * 0.56));
      });
    }
    /* 内圈度数环（每 5° 细刻 / 每 30° 长刻 + 数字） */
    const RDEG = RIN - 26;
    for (let deg = 0; deg < 360; deg += 5) {
      const big = deg % 30 === 0;
      at(deg * DEG, () => {
        ctx.strokeStyle = big ? 'rgba(170,195,225,0.5)' : SKY.dialTick;
        ctx.lineWidth = big ? 3 : 1.5;
        ctx.beginPath();
        ctx.moveTo(0, -RIN);
        ctx.lineTo(0, -(RIN - (big ? 22 : 11)));
        ctx.stroke();
      });
    }
    ctx.font = '400 30px "Helvetica Neue", sans-serif';
    for (let deg = 0; deg < 360; deg += 30) {
      at(deg * DEG, () => {
        ctx.fillStyle = SKY.dialDeg;
        ctx.fillText(`${deg}°`, 0, -(RDEG + 14));
      });
    }
    void K;
  });
}

/* ---------------- 造型工厂 ---------------- */

/** 黄铜车削轮廓（LatheGeometry）：点列 [半径, y] → 车削件网格（轴端/针座共用） */
function lathe(points, mat, seg = 22) {
  return mesh(new THREE.LatheGeometry(points.map((p) => new THREE.Vector2(p[0], p[1])), seg), mat);
}

/** 地轴总装：钢质轴杆 + 北极黄铜车削端（轴环→颈→鼓腹→球→尖顶）
 *  + 南极配重尾锥 + 极区轴环 ×2。放在 tilt 固定系（不随自转）。 */
function buildAxisAssembly() {
  const g = new THREE.Group();
  const shaft = mesh(new THREE.CylinderGeometry(0.014, 0.014, 3.1, 12), M_SHAFT);
  g.add(shaft);
  /* 北端车削件：LatheGeometry 车削轮廓（机床车削件观感的关键是轮廓转折） */
  const finial = lathe([
    [0.034, 0.000], [0.034, 0.024], [0.020, 0.038], [0.013, 0.056],
    [0.022, 0.074], [0.022, 0.092], [0.012, 0.106],
    [0.030, 0.126], [0.046, 0.152], [0.052, 0.186], [0.044, 0.220],
    [0.024, 0.244], [0.008, 0.258], [0.000, 0.264],
  ], M_BRASS2);
  finial.position.y = 1.44;
  /* 南端：轴环 + 配重尾锥（车削收尾） */
  const tail = lathe([
    [0.034, 0.000], [0.034, 0.022], [0.018, 0.036], [0.026, 0.060],
    [0.026, 0.082], [0.012, 0.104], [0.000, 0.118],
  ], M_BRASS2);
  tail.rotation.x = Math.PI;
  tail.position.y = -1.44;
  /* 极区轴环：轴杆穿入球体处的车削装饰环 */
  for (const y of [1.045, -1.045]) {
    const collar = mesh(new THREE.TorusGeometry(0.030, 0.010, 10, 24), M_BRASS2);
    collar.rotation.x = Math.PI / 2;
    collar.position.y = y;
    g.add(collar);
  }
  g.add(finial, tail);
  return g;
}

/** 纬线环实体化：Torus 管环（主）+ 内侧虚线伴随环（辅）；
 *  equator 档加 36 枚度数刻 Tick（InstancedMesh 单 draw call）。 */
function latRing(latDeg, colorHex, opts = {}) {
  const lat = latDeg * DEG;
  const r = Math.cos(lat) * 1.008;
  const g = new THREE.Group();
  g.position.y = Math.sin(lat) * 1.008;
  const tube = opts.tube ?? 0.0062;
  const ring = mesh(
    new THREE.TorusGeometry(r, tube, 8, 160),
    matStd(colorHex, {
      roughness: 0.42, metalness: 0.12,
      emissive: colorHex, emissiveIntensity: opts.glow ?? 0.4,
    })
  );
  ring.rotation.x = Math.PI / 2;
  g.add(ring);
  const dash = circleLine(r * 0.994, colorHex, 160);
  dash.material = new THREE.LineDashedMaterial({
    color: colorHex, transparent: true, opacity: 0.42, dashSize: 0.045, gapSize: 0.035,
  });
  dash.computeLineDistances();
  g.add(dash);
  if (opts.ticks) {
    const tickGeo = new THREE.BoxGeometry(0.020, 0.0032, 0.0032);
    const tickMat = matStd(colorHex, { roughness: 0.4, metalness: 0.2, emissive: colorHex, emissiveIntensity: 0.55 });
    const inst = new THREE.InstancedMesh(tickGeo, tickMat, 36);
    const m4 = new THREE.Matrix4();
    for (let i = 0; i < 36; i++) {
      const a = (i / 36) * TAU;
      m4.makeRotationY(-a);
      m4.setPosition(Math.cos(a) * (r + tube + 0.006), 0, -Math.sin(a) * (r + tube + 0.006));
      inst.setMatrixAt(i, m4);
    }
    inst.instanceMatrix.needsUpdate = true;
    g.add(inst);
  }
  if (opts.label) {
    /* 名称标签挂在环组内：章节 setVis 开关环组时标签随行 */
    const lbl = makeTextSprite(opts.label, { fontSize: 26, color: '#c3cfe0', scale: 0.0042 });
    lbl.position.set(0, 0.03, r + 0.09);
    g.add(lbl);
  }
  return g;
}

/** 教具图钉：锥杆（插地表）+ 发光珠头 + 切面光环。径向朝外摆放由调用方 quaternion 完成。 */
const UP_Y = new THREE.Vector3(0, 1, 0);
function makeMapPin({ color, head = 0.022, stem = 0.05, halo = 0.05, glow = 1.5 }) {
  const g = new THREE.Group();
  const pin = mesh(new THREE.ConeGeometry(0.011, stem, 10), M_PINMETAL);
  pin.rotation.x = Math.PI;                     /* 锥尖朝下插入地表 */
  pin.position.y = stem / 2;
  const bead = mesh(new THREE.SphereGeometry(head, 18, 14), matGlow(color, glow, { roughness: 0.35 }));
  bead.position.y = stem + head * 0.5;
  const ring = mesh(
    new THREE.TorusGeometry(halo, 0.0042, 8, 40),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = stem * 0.45;
  g.add(pin, bead, ring);
  g.userData.halo = ring;
  return g;
}

/** 方向弧管（自转/公转箭头共用工厂）：沿半径 R 圆弧放 TubeGeometry + 雪佛龙 ×3 + 端头箭锥。
 *  走向 = t 递减（+X 处朝 −Z），与地球自转/公转的实际转向（北极上空看逆时针）一致。 */
function makeDirArc(R, opts = {}) {
  const g = new THREE.Group();
  const col = opts.color ?? 0xffe08a;
  const chev = opts.chev ?? 1;
  const t0 = opts.t0 ?? 0.5;
  const span = opts.span ?? 1.6;
  const n = opts.segs ?? 56;
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = t0 - (i / n) * span;
    pts.push(new THREE.Vector3(Math.cos(t) * R, 0, Math.sin(t) * R));
  }
  g.add(mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), n, opts.tubeR ?? 0.011, 8, false),
    matGlow(col, 0.85, { roughness: 0.4 })
  ));
  const chevAt = (t, s = 1) => {
    const p = new THREE.Vector3(Math.cos(t) * R, 0, Math.sin(t) * R);
    const tan = new THREE.Vector3(Math.sin(t), 0, -Math.cos(t)).normalize();
    const c = mesh(new THREE.ConeGeometry(0.036 * chev, 0.1 * chev, 10), matGlow(col, 1.0, { roughness: 0.4 }));
    c.position.copy(p);
    c.quaternion.setFromUnitVectors(UP_Y, tan);
    c.scale.setScalar(s);
    return c;
  };
  for (const f of [0.78, 0.5, 0.22]) g.add(chevAt(t0 - f * span));
  g.add(chevAt(t0 - span * 0.94, 1.5));
  if (opts.label) {
    const lbl = makeTextSprite(opts.label, { fontSize: 30, color: opts.labelColor || '#ffe08a', scale: opts.labelScale ?? 0.0045 });
    lbl.position.set(0, opts.labelY ?? 0.35, -R - 0.28);
    g.add(lbl);
  }
  return g;
}

/* ================= 太阳总装（程序化光球 + 色球壳 + 双层日冕） ================= */

/* —— 太阳系骨架 —— */
const sunSys = new THREE.Group();      // 近景模式下移动到 -sunDir*SUN_DIST，公转模式回中心
scene.add(sunSys);

/** 太阳装配体：光球 shader（米粒组织贴图 + 时间扰动 + 临边昏暗）
 *  + 色球边缘壳（BackSide 加色 fresnel）+ 内外两层日冕射线 sprite（反向慢旋）。 */
function buildSunAssembly(radius) {
  const g = new THREE.Group();
  const granTex = sunGranulationTexture();
  granTex.wrapS = THREE.RepeatWrapping;
  const sunUniforms = { uMap: { value: granTex }, uTime: { value: 0 } };
  const core = mesh(new THREE.SphereGeometry(radius, 48, 32), new THREE.ShaderMaterial({
    uniforms: sunUniforms,
    vertexShader: /* glsl */`
      varying vec2 vUv; varying vec3 vN; varying vec3 vWp;
      void main() {
        vUv = uv;
        vN = normalize(mat3(modelMatrix) * normal);
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWp = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: /* glsl */`
      uniform sampler2D uMap; uniform float uTime;
      varying vec2 vUv; varying vec3 vN; varying vec3 vWp;
      void main() {
        /* 米粒组织翻滚：两级正弦扰动 uv（uTime 由全局播放速度驱动） */
        vec2 uv = vUv;
        uv.x += sin(uv.y * 28.0 + uTime * 0.55) * 0.0022 + sin(uv.y * 13.0 - uTime * 0.23) * 0.0031;
        uv.y += cos(uv.x * 22.0 + uTime * 0.41) * 0.0020;
        vec3 col = texture2D(uMap, uv).rgb;
        /* 临边昏暗：盘面边缘变暗转橙（真实太阳盘面观感） */
        vec3 N = normalize(vN);
        vec3 V = normalize(cameraPosition - vWp);
        float mu = max(dot(N, V), 0.0);
        float limb = pow(mu, 0.52);
        col *= 0.40 + 0.60 * limb;
        col = mix(vec3(1.0, 0.46, 0.17), col, 0.30 + 0.70 * limb);
        gl_FragColor = vec4(col * 1.30, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  }));
  /* 色球边缘壳：BackSide 加色 fresnel（沿用本页大气壳的成熟写法，换暖橙） */
  const chromo = mesh(new THREE.SphereGeometry(radius * 1.035, 48, 32), new THREE.ShaderMaterial({
    transparent: true,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    depthWrite: false,
    vertexShader: /* glsl */`
      varying vec3 vN; varying vec3 vWp;
      void main() {
        vN = normalize(mat3(modelMatrix) * normal);
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWp = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vN; varying vec3 vWp;
      void main() {
        vec3 v = normalize(cameraPosition - vWp);
        float rim = pow(max(dot(normalize(vN), v), 0.0), 2.6);
        gl_FragColor = vec4(vec3(1.0, 0.58, 0.25) * rim, rim * 0.85);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  }));
  /* 双层日冕：内层密集射线 + 外层大范围晕，反向慢旋（呼吸感） */
  const coronaIn = new THREE.Sprite(new THREE.SpriteMaterial({
    map: coronaRayTexture(4101), blending: THREE.AdditiveBlending,
    depthWrite: false, transparent: true, opacity: 0.85,
  }));
  coronaIn.scale.setScalar(radius * 3.6);
  const coronaOut = new THREE.Sprite(new THREE.SpriteMaterial({
    map: coronaRayTexture(8207), blending: THREE.AdditiveBlending,
    depthWrite: false, transparent: true, opacity: 0.5,
  }));
  coronaOut.scale.setScalar(radius * 6.2);
  g.add(core, chromo, coronaIn, coronaOut);
  return {
    group: g, core,
    tick(dt) {
      sunUniforms.uTime.value += dt;
      core.rotation.y += dt * 0.012;             /* 光球缓慢自转，米粒纹理随之漂移 */
      coronaIn.material.rotation += dt * 0.02;
      coronaOut.material.rotation -= dt * 0.013;
    },
  };
}
const sunAsm = buildSunAssembly(1.6);
sunSys.add(sunAsm.group);

const sunLight = new THREE.DirectionalLight(0xffffff, 2.4);
scene.add(sunLight);
sunLight.target = null; // 每帧指向地球

/* —— 光照氛围：低环境 + 冷色银河补光 + 半球环境（夜侧金属件不至于死黑）；
      scene.environment 走程序化摄影棚，只作用于 PBR 金属件（地球自绘 shader / 云层不受影响） —— */
scene.add(new THREE.AmbientLight(0x334455, 0.42));
const starFill = new THREE.DirectionalLight(0x8fb2d9, 0.32);
starFill.position.set(-6, -2.5, -5);
scene.add(starFill);
scene.add(new THREE.HemisphereLight(0x2c3e55, 0x11131a, 0.3));
scene.environment = makeStudioEnvironment(app.renderer);

/* 太阳名称标签（挂 scene，帧循环跟随 sunSys 并按模式调比例——sunSys 双模式缩放不同） */
const sunLbl = makeTextSprite('太阳', { fontSize: 34, color: '#ffd9a0', scale: 0.013 });
scene.add(sunLbl);
const SUN_LBL_BASE = { w: sunLbl.scale.x, h: sunLbl.scale.y };

scene.add(makeStars(700, 3000));

// —— 地球装配体 ——
const earthPos = new THREE.Group();    // 位置：近景在原点，公转在轨道上
scene.add(earthPos);
const tiltG = new THREE.Group();       // 黄赤交角：+Y → (0, cosε, sinε)
tiltG.rotation.x = EPS;
earthPos.add(tiltG);
const spinG = new THREE.Group();       // 自转
tiltG.add(spinG);

let earthMesh, cloudsMesh, atmoMesh;

const earthUniforms = {
  dayMap: { value: null },
  nightMap: { value: null },
  specMap: { value: null },
  normalMap: { value: null },
  sunDir: { value: new THREE.Vector3(1, 0, 0) },
  nightBrightness: { value: 0.9 },
};

const EARTH_VERT = /* glsl */`
  varying vec3 vN;
  varying vec3 vWorldPos;
  varying vec2 vUv;
  varying vec3 vT;
  varying vec3 vB;
  void main() {
    vUv = uv;
    vN = normalize(mat3(modelMatrix) * normal);
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    vec3 axisW = normalize((modelMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz);
    vT = normalize(cross(axisW, vN));        // 纬线向东
    vB = normalize(cross(vN, vT));           // 经线向北
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const EARTH_FRAG = /* glsl */`
  uniform sampler2D dayMap;
  uniform sampler2D nightMap;
  uniform sampler2D specMap;
  uniform sampler2D normalMap;
  uniform vec3 sunDir;
  uniform float nightBrightness;
  varying vec3 vN;
  varying vec3 vWorldPos;
  varying vec2 vUv;
  varying vec3 vT;
  varying vec3 vB;
  void main() {
    vec3 bump = texture2D(normalMap, vUv).xyz * 2.0 - 1.0;
    vec3 N = normalize(vN + vT * bump.x * 0.35 + vB * bump.y * 0.35);
    vec3 sunN = normalize(sunDir);
    float lambert = dot(N, sunN);
    float k = smoothstep(-0.10, 0.15, lambert);   // 晨昏线过渡

    vec3 dayCol = texture2D(dayMap, vUv).rgb * (0.22 + 0.95 * max(lambert, 0.0));
    vec3 nightCol = texture2D(nightMap, vUv).rgb * nightBrightness;
    vec3 col = mix(nightCol, dayCol, k);

    // 海面高光（specularMap 白色=海洋）
    vec3 viewDir = normalize(cameraPosition - vWorldPos);
    vec3 h = normalize(sunN + viewDir);
    float spec = pow(max(dot(N, h), 0.0), 46.0) * texture2D(specMap, vUv).r * k;
    col += spec * vec3(1.0, 0.93, 0.78) * 0.55;

    // 大气边缘散射
    float rim = pow(1.0 - max(dot(normalize(vN), viewDir), 0.0), 3.0);
    col += rim * vec3(0.22, 0.42, 0.85) * (0.25 + 0.55 * k);

    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

// —— 标注元素（tilt 固定系，不随自转） ——
const marks = new THREE.Group();
tiltG.add(marks);

/* 地轴总装（钢杆 + 黄铜车削端）替代旧细线；axisLine 符号保留指向总装组，
   各章节 setVis/visible 切换逻辑零改动 */
const axisLine = buildAxisAssembly();
const axisN = makeTextSprite('N', { fontSize: 40, color: '#ffd166', scale: 0.006 });
axisN.position.set(0, 1.86, 0);
marks.add(axisLine, axisN);

/* 纬线环实体化：赤道（管环+虚线+36 刻度 Tick）/ 南北回归线 / 南北极圈（带名称标签） */
const equatorRing = latRing(0, SKY.equator, { ticks: true, glow: 0.5, label: '赤道 0°' });
const tropicN = latRing(23.44, SKY.tropic, { label: '北回归线 23°26′N' });
const tropicS = latRing(-23.44, SKY.tropic, { label: '南回归线 23°26′S' });
const polarN = latRing(66.56, SKY.polar, { tube: 0.005, glow: 0.32, label: '北极圈 66°34′N' });
const polarS = latRing(-66.56, SKY.polar, { tube: 0.005, glow: 0.32, label: '南极圈 66°34′S' });
marks.add(equatorRing, tropicN, tropicS, polarN, polarS);

// 晨昏线圈（法向 = 太阳方向的大圆）：虚线主环 + 贴球暮光带（晨昏蒙影，双层）+ 标注
const terminator = new THREE.Group();
{
  const termPts = [];
  for (let i = 0; i <= 180; i++) {
    const a = (i / 180) * TAU;
    termPts.push(new THREE.Vector3(Math.cos(a) * 1.006, Math.sin(a) * 1.006, 0));
  }
  const line = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(termPts),
    new THREE.LineDashedMaterial({ color: 0xffffff, dashSize: 0.055, gapSize: 0.035, transparent: true, opacity: 0.85 })
  );
  line.computeLineDistances();
  /* 暮光带：主带 ±3.2°（较亮）+ 翼带 ±6.4°（渐隐），晨昏线两侧的大气过渡区示意；
     几何 = 以环面自身为"赤道"的球面纬带，先 rotateX(π/2) 把带轴 (+Y) 转到环面法向 (+Z)，
     再随晨昏面四元数同转（帧循环拨组四元数） */
  const twiMat = (op) => new THREE.MeshBasicMaterial({
    color: 0xff9a55, transparent: true, opacity: op,
    blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false,
  });
  const twiCoreGeo = new THREE.SphereGeometry(1.0035, 96, 8, 0, TAU, Math.PI / 2 - 0.056, 0.112);
  twiCoreGeo.rotateX(Math.PI / 2);
  const twiWingGeo = new THREE.SphereGeometry(1.0025, 96, 8, 0, TAU, Math.PI / 2 - 0.112, 0.224);
  twiWingGeo.rotateX(Math.PI / 2);
  const twiCore = mesh(twiCoreGeo, twiMat(0.13));
  const twiWing = mesh(twiWingGeo, twiMat(0.06));
  const lbl = makeTextSprite('晨昏线', { fontSize: 28, color: '#e8f0ff', scale: 0.0046 });
  lbl.position.set(0, 1.14, 0);
  terminator.add(line, twiWing, twiCore, lbl);
}
marks.add(terminator);

// 直射点标记（教具图钉：锥杆 + 发光珠 + 脉动光环；姿态随直射位置径向朝外）
const subSolar = new THREE.Group();
const ssPin = makeMapPin({ color: 0xff5533, head: 0.03, stem: 0.07, halo: 0.068, glow: 1.9 });
const ssLabel = makeTextSprite('直射点', { fontSize: 34, color: '#ff8873', scale: 0.0052 });
ssLabel.position.set(0.05, 0.17, 0);
subSolar.add(ssPin, ssLabel);
marks.add(subSolar);

// 北京标记（随地球自转；同款图钉语言，绿珠小一号）
const spinMarks = new THREE.Group();
spinG.add(spinMarks);
function latLonToVec(latDeg, lonDegE, r = 1.01) {
  const lat = latDeg * DEG, lon = lonDegE * DEG;
  return new THREE.Vector3(Math.cos(lat) * Math.cos(lon), Math.sin(lat), -Math.cos(lat) * Math.sin(lon)).multiplyScalar(r);
}
const bjDot = makeMapPin({ color: 0x59d999, head: 0.02, stem: 0.045, halo: 0.046, glow: 1.4 });
bjDot.position.copy(latLonToVec(39.9, OBS_LON));
bjDot.quaternion.setFromUnitVectors(UP_Y, bjDot.position.clone().normalize());
const bjLabel = makeTextSprite('北京', { fontSize: 34, color: '#7df0b6', scale: 0.005 });
bjLabel.position.copy(latLonToVec(39.9, OBS_LON, 1.1));
spinMarks.add(bjDot, bjLabel);

// 自转方向箭头（makeDirArc 共享工厂；走向与 spinG.rotation.y 实际转向一致）
const rotArrowGroup = makeDirArc(1.22, { label: '自转方向：自西向东', labelY: 0.35 });
marks.add(rotArrowGroup);

/* —— 黄赤交角演示装置：黄道面盘 + 赤道面盘（随地轴倾斜 ε）+ 二分线（两平面交线）
      + 交角弧与 ε 标注。挂 earthPos（未倾斜系 = 黄道参考面），总成淡入淡出，
      总览/公转/直射点三章默认开启，其余章节由 enterDefaults 收走。 —— */
const planeDemo = new THREE.Group();
earthPos.add(planeDemo);
planeDemo.visible = false;
const planeFadeMats = [];                    /* { m, base }：淡入淡出按 baseOpacity 比例缩放 */
function planeMatEntry(m, base) {
  m.transparent = true;
  m.opacity = 0;
  m.depthWrite = false;
  planeFadeMats.push({ m, base });
  return m;
}
let planeDemoK = 0;                          /* 当前淡入系数（帧循环向 target 缓动） */
let planeDemoTarget = 0;
{
  /* 黄道面盘：环带 1.32~2.55（暖黄，微发光）+ 外缘描线 */
  const ecl = mesh(
    new THREE.RingGeometry(1.32, 2.55, 96),
    planeMatEntry(matCoat(SKY.ecliptic, { roughness: 0.55, metalness: 0, emissive: SKY.ecliptic, emissiveIntensity: 0.22, side: THREE.DoubleSide }), 0.15)
  );
  ecl.rotation.x = -Math.PI / 2;
  const eclRim = circleLine(2.55, SKY.ecliptic, 128);
  planeMatEntry(eclRim.material, 0.5);
  planeDemo.add(ecl, eclRim);
  /* 赤道面盘：整体绕 X 轴倾斜 ε（与 tiltG 同倾角），青色 */
  const ceqG = new THREE.Group();
  ceqG.rotation.x = EPS;
  const ceq = mesh(
    new THREE.RingGeometry(1.16, 2.34, 96),
    planeMatEntry(matCoat(SKY.celestEq, { roughness: 0.55, metalness: 0, emissive: SKY.celestEq, emissiveIntensity: 0.2, side: THREE.DoubleSide }), 0.14)
  );
  ceq.rotation.x = -Math.PI / 2;
  const ceqRim = circleLine(2.34, SKY.celestEq, 128);
  planeMatEntry(ceqRim.material, 0.45);
  ceqG.add(ceq, ceqRim);
  const ceqLbl = makeTextSprite('赤道面', { fontSize: 30, color: '#9fd2f2', scale: 0.0052 });
  ceqLbl.position.set(0, 0.02, 2.62);
  ceqG.add(ceqLbl);
  planeDemo.add(ceqG);
  /* 二分线：两平面交线 = 本地 X 轴（黄赤交角绕 X 展开），虚线 + 春分/秋分方向标记 */
  const hingeGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-2.72, 0, 0), new THREE.Vector3(2.72, 0, 0),
  ]);
  const hinge = new THREE.Line(hingeGeo, new THREE.LineDashedMaterial({
    color: SKY.hinge, transparent: true, opacity: 0.8, dashSize: 0.09, gapSize: 0.06,
  }));
  hinge.computeLineDistances();
  planeMatEntry(hinge.material, 0.8);
  const hingeLbl = makeTextSprite('二分线', { fontSize: 28, color: '#ffe08a', scale: 0.0048 });
  hingeLbl.position.set(2.6, 0.14, 0);
  planeDemo.add(hinge, hingeLbl);
  for (const s of [-1, 1]) {
    const node = mesh(new THREE.OctahedronGeometry(0.05), matStd(SKY.hinge, { roughness: 0.35, metalness: 0.4, emissive: SKY.hinge, emissiveIntensity: 0.5 }));
    node.position.set(s * 2.55, 0, 0);
    node.scale.y = 0.55;
    planeDemo.add(node);
  }
  /* 交角弧：绕 X 轴从黄道法线 (+Y) 张开 ε 到赤道北极方向 (0, cosε, sinε) */
  const arcPts = [];
  for (let i = 0; i <= 24; i++) {
    const a = (i / 24) * EPS;
    arcPts.push(new THREE.Vector3(0, Math.cos(a) * 1.9, Math.sin(a) * 1.9));
  }
  const arcLine = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(arcPts),
    new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 })
  );
  planeMatEntry(arcLine.material, 0.9);
  const epsLbl = makeTextSprite('ε = 23°26′', { fontSize: 34, color: '#ffffff', scale: 0.0056, bg: 'rgba(10,16,24,0.72)' });
  const mid = EPS / 2;
  epsLbl.position.set(0, Math.cos(mid) * 2.14, Math.sin(mid) * 2.14);
  const eclLbl = makeTextSprite('黄道面', { fontSize: 30, color: '#f2d488', scale: 0.0052 });
  eclLbl.position.set(0, 0.02, -2.62);
  planeDemo.add(arcLine, epsLbl, eclLbl);
}
/* 章节开关：只拨目标值，淡入淡出交给帧循环（切章不生硬跳变） */
function setPlaneDemo(on) { planeDemoTarget = on ? 1 : 0; }
function planeDemoTick(dt) {
  const k0 = planeDemoK;
  planeDemoK += (planeDemoTarget - planeDemoK) * Math.min(dt * 7, 1);
  if (Math.abs(planeDemoK - planeDemoTarget) < 0.004) planeDemoK = planeDemoTarget;
  const vis = planeDemoK > 0.02;
  planeDemo.visible = vis;
  if (vis || k0 > 0.02) {
    for (const e of planeFadeMats) e.m.opacity = e.base * planeDemoK;
  }
}

// 正午太阳高度演示组
const noonG = new THREE.Group();
marks.add(noonG);
const noonState = {};
{
  const matLine = (c) => new THREE.LineBasicMaterial({ color: c, transparent: true, opacity: 0.95 });
  noonState.pointMarker = new THREE.Mesh(
    new THREE.SphereGeometry(0.03, 16, 12),
    new THREE.MeshBasicMaterial({ color: 0x59d999 })
  );
  noonState.zenith = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), matLine(0x9adfff));
  noonState.horizon = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), matLine(0x8a94a3));
  noonState.ray = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), matLine(0xffd166));
  const arcPts = [];
  for (let i = 0; i <= 24; i++) arcPts.push(new THREE.Vector3());
  noonState.arc = new THREE.Line(new THREE.BufferGeometry().setFromPoints(arcPts), matLine(0xffffff));
  noonState.lbl = makeTextSprite('', { fontSize: 36, color: '#ffffff', scale: 0.005, bg: 'rgba(10,16,24,0.72)' });
  noonG.add(noonState.pointMarker, noonState.zenith, noonState.horizon, noonState.ray, noonState.arc, noonState.lbl);
}

// 昼夜长短：纬线圈昼弧/夜弧（三重描边增粗，WebGL 不支持 linewidth）
const dayNightArc = { dayLines: [], nightLines: [] };
{
  const mk = (c, o) => new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]),
    new THREE.LineBasicMaterial({ color: c, transparent: true, opacity: o })
  );
  for (const rOff of [1.014, 1.022, 1.03]) {
    const l = mk(0xffc94d, 0.95); dayNightArc.dayLines.push({ line: l, rOff });
    const n = mk(0x6a7cff, 0.9); dayNightArc.nightLines.push({ line: n, rOff });
    marks.add(l, n);
  }
}
function updateDayNightArc(latDeg, sunDirWorld) {
  const lat = latDeg * DEG;
  const qTilt = tiltG.getWorldQuaternion(new THREE.Quaternion());
  const qInv = qTilt.clone().invert();
  const sunLocal = sunDirWorld.clone().applyQuaternion(qInv);
  const dayPts = [], nightPts = [];
  const p = new THREE.Vector3();
  for (let i = 0; i <= 360; i++) {
    const t = (i / 360) * TAU;
    p.set(Math.cos(lat) * Math.cos(t), Math.sin(lat), -Math.cos(lat) * Math.sin(t));
    const world = p.clone().applyQuaternion(qTilt);
    (world.dot(sunDirWorld) > 0 ? dayPts : nightPts).push(p.clone());
  }
  dayNightArc.dayLines.forEach((e) => setPts2(e, dayPts));
  dayNightArc.nightLines.forEach((e) => setPts2(e, nightPts));
  return sunLocal;
}
function setPts2(entry, sourcePts) {
  const line = entry.line;
  const scale = entry.rOff;
  const outPts = sourcePts.length > 1
    ? [...sourcePts.map((q) => q.clone().multiplyScalar(scale)), sourcePts[0].clone().multiplyScalar(scale)]
    : [new THREE.Vector3(), new THREE.Vector3()];
  line.geometry.dispose();
  line.geometry = new THREE.BufferGeometry().setFromPoints(outPts);
  line.visible = sourcePts.length > 1;
}

// 公转轨道元素（世界系）。太阳本体 = sunAsm（双模式常驻），公转模式归位原点并放大。
const orbitG = new THREE.Group();
scene.add(orbitG);
const orbitRing = circleLine(ORBIT_R, 0x8899bb, 256);
orbitRing.material.transparent = true;
orbitRing.material.opacity = 0.45;
orbitG.add(orbitRing);

// 月份刻度 + 公转刻度环 + 近日点/远日点（「轨道与月份」开关统一控制）
const monthLabels = new THREE.Group();
orbitG.add(monthLabels);
{
  /* 公转刻度环：CanvasTexture 环面（12 月名 + 365 日刻 + 度数环 + 二分二至金刻） */
  const gradRing = mesh(
    new THREE.RingGeometry(ORBIT_R - 0.5, ORBIT_R + 0.5, 256, 1),
    new THREE.MeshBasicMaterial({
      map: orbitGraduatedTexture(), transparent: true, opacity: 0.92,
      depthWrite: false, side: THREE.DoubleSide,
    })
  );
  gradRing.rotation.x = -Math.PI / 2;
  monthLabels.add(gradRing);
  /* 公转方向箭头：与地球公转实际走向一致（lambdaE 递增，+X 处朝 −Z） */
  monthLabels.add(makeDirArc(ORBIT_R, {
    tubeR: 0.028, chev: 3.2, span: 1.15, color: 0xffd166,
    label: '公转方向：自西向东', labelScale: 0.010, labelY: 0.55, labelColor: '#ffd166',
  }));
  /* 二分二至：黄铜车削月份针（底座 + 针杆 + 顶珠）+ 原有文字 sprite */
  const names = ['3月21日', '6月22日', '9月23日', '12月22日'];
  const Ns = [80, 173, 266, 356];
  Ns.forEach((N, i) => {
    const p = orbitPos(N, ORBIT_R + 1.6);
    const s = makeTextSprite(names[i], { fontSize: 32, color: '#c3cfe0', scale: 0.012 });
    s.position.copy(p);
    monthLabels.add(s);
    const pin = new THREE.Group();
    const foot = mesh(new THREE.CylinderGeometry(0.055, 0.07, 0.035, 14), M_BRASS2);
    foot.position.y = 0.017;
    const stem = mesh(new THREE.CylinderGeometry(0.013, 0.013, 0.2, 10), M_BRASS2);
    stem.position.y = 0.13;
    const bead = mesh(new THREE.SphereGeometry(0.036, 14, 10), matStd(0xffcf6e, { roughness: 0.35, metalness: 0.55, emissive: 0xcf9440, emissiveIntensity: 0.5 }));
    bead.position.y = 0.25;
    pin.add(foot, stem, bead);
    pin.position.copy(orbitPos(N, ORBIT_R));
    monthLabels.add(pin);
  });
  /* 近日点 / 远日点：地球轨道上的两个位置标记（公转章节正文知识点） */
  const ext = (N, txt) => {
    const g = new THREE.Group();
    const dia = mesh(new THREE.OctahedronGeometry(0.11), matStd(0xffd166, { roughness: 0.3, metalness: 0.5, emissive: 0xb98a2e, emissiveIntensity: 0.55 }));
    dia.scale.y = 0.5;
    dia.position.copy(orbitPos(N, ORBIT_R));
    dia.position.y = 0.05;
    const lbl = makeTextSprite(txt, { fontSize: 30, color: '#ffd166', scale: 0.0105 });
    lbl.position.copy(orbitPos(N, ORBIT_R - 1.15));
    lbl.position.y = 0.3;
    g.add(dia, lbl);
    return g;
  };
  monthLabels.add(ext(3, '近日点（1 月初）'), ext(184, '远日点（7 月初）'));
}
const sunEarthLine = new THREE.Line(
  new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]),
  new THREE.LineBasicMaterial({ color: 0xffd166, transparent: true, opacity: 0.7 })
);
orbitG.add(sunEarthLine);

/* —— 彗星道具：开普勒椭圆轨道（牛顿迭代解 E）+ 彗发 + 离子尾/尘埃尾双尾粒子。
      尾长随日距变化（近日拉长），尘埃尾沿轨道滞后弯曲；粒子 BufferAttribute 原位更新。 —— */
function keplerPoint(st, M) {
  let E = M;                                   /* 开普勒方程 M = E − e·sinE，牛顿迭代 4 步 */
  for (let k = 0; k < 4; k++) E -= (E - st.e * Math.sin(E) - M) / (1 - st.e * Math.cos(E));
  const x = st.a * (Math.cos(E) - st.e);
  const zp = -st.a * Math.sqrt(1 - st.e * st.e) * Math.sin(E);
  return new THREE.Vector3(x, -zp * Math.sin(st.inc), zp * Math.cos(st.inc));
}
const cometSt = { a: 9.4, e: 0.66, inc: 13 * DEG, M: 2.35, n: TAU / 30 };
const cometG = new THREE.Group();
orbitG.add(cometG);
const cometTick = (() => {
  /* 轨道虚线 */
  const pathPts = [];
  for (let i = 0; i <= 200; i++) pathPts.push(keplerPoint(cometSt, (i / 200) * TAU));
  const path = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(pathPts),
    new THREE.LineDashedMaterial({ color: 0x7f95b5, transparent: true, opacity: 0.5, dashSize: 0.22, gapSize: 0.16 })
  );
  path.computeLineDistances();
  cometG.add(path);
  /* 彗核 + 彗发 + 标注 */
  const nucleus = mesh(new THREE.IcosahedronGeometry(0.1, 1), M_COMETICE);
  const coma = new THREE.Sprite(new THREE.SpriteMaterial({
    map: softDotTexture(SKY.coma), blending: THREE.AdditiveBlending,
    depthWrite: false, transparent: true, opacity: 0.85,
  }));
  const lbl = makeTextSprite('彗星（示意轨道）', { fontSize: 26, color: '#a9c4e2', scale: 0.0088 });
  lbl.position.set(0.1, 0.34, 0);
  cometG.add(nucleus, coma, lbl);
  /* 双尾：预分配属性 + 逐粒子固定抖动向量（同帧可复现） */
  const mkTail = (count, size, rgb) => {
    const jit = [];
    const rnd = sRand(count * 7919 + 13);
    for (let i = 0; i < count; i++) {
      jit.push(new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).normalize().multiplyScalar(0.35 + rnd()));
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({
      size, map: softDotTexture(rgb), vertexColors: true,
      blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.9,
    }));
    pts.frustumCulled = false;
    cometG.add(pts);
    return { geo, jit, count };
  };
  const ionTail = mkTail(140, 0.19, SKY.coma);
  const ionCore = mkTail(90, 0.11, '210,236,255');   /* 离子尾亮芯：窄锥高亮，读出"尾"的形态 */
  const dustTail = mkTail(100, 0.17, '255,214,160');
  function updateTail(tail, dirMain, dirCurve, curveAmt, len, spread, colHi, colLo, t) {
    /* 位置写彗星本地系（Points 是 cometG 子组，cometG 仅平移无旋转，方向量可直接用）；
       此前误写世界坐标导致渲染位被二次平移到 2× 处（已修） */
    const pos = tail.geo.attributes.position.array;
    const col = tail.geo.attributes.color.array;
    for (let i = 0; i < tail.count; i++) {
      const f = (i + 0.5) / tail.count;
      const j = tail.jit[i];
      const sway = Math.sin(f * 8.5 + t * 1.6 + i * 0.7) * 0.1;
      const w = 0.015 + f * spread;
      const i3 = i * 3;
      pos[i3] = (dirMain.x * f + dirCurve.x * f * f * curveAmt + (j.x + sway * j.z) * w) * len;
      pos[i3 + 1] = (dirMain.y * f + dirCurve.y * f * f * curveAmt + j.y * w) * len;
      pos[i3 + 2] = (dirMain.z * f + dirCurve.z * f * f * curveAmt + (j.z - sway * j.x) * w) * len;
      const fade = Math.pow(f, 1.3);
      const b = 0.75 + tail.jit[i].length() * 0.25;
      col[i3] = (colHi[0] + (colLo[0] - colHi[0]) * fade) * b;
      col[i3 + 1] = (colHi[1] + (colLo[1] - colHi[1]) * fade) * b;
      col[i3 + 2] = (colHi[2] + (colLo[2] - colHi[2]) * fade) * b;
    }
    tail.geo.attributes.position.needsUpdate = true;
    tail.geo.attributes.color.needsUpdate = true;
  }
  const prevP = keplerPoint(cometSt, cometSt.M - 0.02);
  let t = 0;
  return function tick(dt) {
    t += dt;
    if (state.playing) cometSt.M = (cometSt.M + dt * state.speed * cometSt.n) % TAU;
    const p = keplerPoint(cometSt, cometSt.M);
    cometG.position.copy(p);
    const vel = p.clone().sub(prevP);
    const dist = Math.max(p.length(), 1e-4);
    const speed = vel.length() / Math.max(dt, 1e-4);
    const velN = speed > 1e-6 ? vel.multiplyScalar(1 / (speed * Math.max(dt, 1e-4) + 1e-9)).normalize() : new THREE.Vector3(0, 0, 1);
    prevP.copy(p);
    nucleus.rotation.x += dt * 0.5;
    nucleus.rotation.y += dt * 0.23;
    /* 彗发呼吸 + 近日增亮 */
    const near = clamp(5.2 / dist, 0.55, 2.1);
    coma.scale.setScalar(1.0 + near * 0.8 + Math.sin(t * 2.3) * 0.06);
    coma.material.opacity = 0.6 + clamp(near * 0.2, 0, 0.3);
    const anti = p.clone().multiplyScalar(-1 / dist);
    const lenIon = clamp(52 / dist, 1.0, 5.4);
    const lenDust = clamp(40 / dist, 0.8, 4.2);
    const dustDir = anti.clone().addScaledVector(velN, -0.5).normalize();
    updateTail(ionTail, anti, velN, 0.0, lenIon, 0.07, [0.8, 1.05, 1.25], [0.05, 0.13, 0.34], t);
    updateTail(ionCore, anti, velN, 0.0, lenIon * 1.04, 0.028, [1.15, 1.5, 1.8], [0.1, 0.22, 0.45], t);
    updateTail(dustTail, dustDir, velN, -0.3, lenDust, 0.1, [1.25, 1.02, 0.72], [0.2, 0.13, 0.06], t);
  };
})();

/* —— 深空叙事：银河带星云 ×5（倾斜大圆带）+ 旋涡星系 ×3 + 四针衍射亮星 ×6 —— */
{
  const deepSpace = new THREE.Group();
  scene.add(deepSpace);
  const bandQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(1.02, 0.35, 0.42));
  const bandCfg = [
    { az: 0.2, dy: 0.12, s: 1350, o: 0.17, seed: 41, tint: 0xaac4ee },
    { az: 1.35, dy: -0.06, s: 1150, o: 0.16, seed: 47, tint: 0x9db8e8 },
    { az: 2.6, dy: 0.16, s: 1500, o: 0.19, seed: 53, tint: 0xbccdf2 },
    { az: 3.9, dy: -0.1, s: 1250, o: 0.16, seed: 59, tint: 0xa2bce8 },
    { az: 5.1, dy: 0.05, s: 1350, o: 0.17, seed: 61, tint: 0xb0c6ee },
  ];
  for (const c of bandCfg) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({
      map: nebulaTexture(c.seed), transparent: true, opacity: c.o,
      blending: THREE.AdditiveBlending, depthWrite: false,
      rotation: (c.seed % 7) * 0.4,
    }));
    sp.material.color.setHex(c.tint);
    sp.position.set(Math.cos(c.az), c.dy, Math.sin(c.az)).normalize().applyQuaternion(bandQ).multiplyScalar(2250);
    sp.scale.setScalar(c.s);
    deepSpace.add(sp);
  }
  const galCfg = [
    { az: 0.9, el: 0.55, s: 82, seed: 71, tint: 0xd8e2ff },
    { az: 3.4, el: -0.4, s: 64, seed: 73, tint: 0xe8dcff },
    { az: 5.4, el: 0.25, s: 95, seed: 79, tint: 0xcfe0ff },
  ];
  for (const c of galCfg) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({
      map: spiralGalaxyTexture(c.seed), transparent: true, opacity: 0.72,
      depthWrite: false, rotation: (c.seed % 5) * 0.6,
    }));
    sp.material.color.setHex(c.tint);
    sp.position.set(Math.cos(c.az), c.el, Math.sin(c.az)).normalize().multiplyScalar(2100);
    sp.scale.setScalar(c.s);
    deepSpace.add(sp);
  }
  const starTex = diffractionStarTexture();
  const starCfg = [
    { az: 0.4, el: 0.8, s: 12, tint: 0xcfe4ff },
    { az: 1.8, el: -0.65, s: 9, tint: 0xffe9c9 },
    { az: 2.9, el: 0.35, s: 14, tint: 0xffd9d0 },
    { az: 4.2, el: 0.7, s: 8, tint: 0xd6e6ff },
    { az: 5.6, el: -0.3, s: 11, tint: 0xfff2da },
    { az: 2.2, el: 0.95, s: 10, tint: 0xdfe8ff },
  ];
  for (const c of starCfg) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({
      map: starTex, transparent: true, opacity: 0.85, depthWrite: false,
    }));
    sp.material.color.setHex(c.tint);
    sp.position.set(Math.cos(c.az), c.el, Math.sin(c.az)).normalize().multiplyScalar(2300);
    sp.scale.setScalar(c.s);
    deepSpace.add(sp);
  }
}

/* ---------------- 状态 ---------------- */

const state = {
  mode: 'earth',            // 'earth' 近景 | 'orbit' 公转全景
  playing: true,
  speed: 1,
  N: 108,                   // 一年中的第几天（约 4 月中旬）
  spin: 0,                  // 自转角
  spinPeriod: 12,           // 近景：每圈秒数
  orbitPeriod: 80,          // 公转：每年秒数
  showClouds: true,
  showNight: true,
  obsLat: 40,
  showTerminator: false,
  noonH: 45,
};

/* ---------------- 每帧更新 ---------------- */

const _qTilt = new THREE.Quaternion();
const _sunDirW = new THREE.Vector3();

function applyMode() {
  const m = state.mode;
  orbitG.visible = m === 'orbit';
  sunSys.visible = true;                  /* 太阳总装双模式常驻（近景远处 / 公转中心） */
  monthLabels.visible = m === 'orbit';
  sunEarthLine.visible = m === 'orbit';
  axisLine.visible = axisN.visible = true;
  if (m === 'earth') {
    earthPos.position.set(0, 0, 0);
    earthPos.scale.setScalar(1);
    sunAsm.group.scale.setScalar(1);
    controls.target.set(0, 0, 0);
  } else {
    earthPos.scale.setScalar(0.55);
    sunAsm.group.scale.setScalar(1.12);
    controls.target.set(0, 0, 0);
  }
}

let frameT = 0;

app.onFrame((dt) => {
  /* 相机缓动由 attachVFX 接管（tickCamera 在渲染钩子内） */
  frameT += dt;
  if (state.playing) {
    state.spin += (dt / state.spinPeriod) * TAU * state.speed;
    state.N += (dt / state.orbitPeriod) * YEAR_DAYS * state.speed;
    if (state.N > YEAR_DAYS) state.N -= YEAR_DAYS;
    if (activeCtl && activeCtl.dateSlider && activeCtl.dateSync) activeCtl.dateSlider.set(state.N);
  }
  spinG.rotation.y = state.spin;
  if (cloudsMesh) cloudsMesh.rotation.y += dt * 0.006 * (state.playing ? state.speed : 0);

  /* 视觉工艺联动：太阳米粒翻滚/日冕慢旋（随播放速度）、彗星开普勒运动与双尾、平面装置淡入淡出 */
  sunAsm.tick(dt * (state.playing ? state.speed : 0));
  cometTick(dt);
  planeDemoTick(dt);

  /* 太阳标签跟随：近景悬于日轮上方（大），公转居中（小） */
  sunLbl.position.copy(sunSys.position);
  sunLbl.position.y += state.mode === 'earth' ? 2.7 : 2.75;
  const kLbl = state.mode === 'earth' ? 2.1 : 1;
  sunLbl.scale.set(SUN_LBL_BASE.w * kLbl, SUN_LBL_BASE.h * kLbl, 1);

  const sunDir = sunDirVec(state.N);
  _sunDirW.copy(sunDir);

  // 太阳位置与光照
  if (state.mode === 'earth') {
    sunSys.position.copy(sunDir).multiplyScalar(-SUN_DIST);
    earthPos.position.set(0, 0, 0);
    sunLight.position.copy(sunSys.position);
    sunLight.target = earthPos;
  } else {
    const p = orbitPos(state.N);
    earthPos.position.copy(p);
    sunSys.position.set(0, 0, 0);
    sunLight.position.set(0, 0, 0);
    sunLight.target = earthPos;
    sunEarthLine.geometry.dispose();
    sunEarthLine.geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), p.clone().multiplyScalar(1 / earthPos.scale.x)]);
  }
  earthUniforms.sunDir.value.copy(sunDir);

  // 直射点（tilt 固定系）：位置落在地表 + 图钉径向朝外 + 光环脉动
  tiltG.getWorldQuaternion(_qTilt);
  const sunLocal = sunDir.clone().applyQuaternion(_qTilt.clone().invert());
  subSolar.position.copy(sunLocal).setLength(1.02);
  subSolar.quaternion.setFromUnitVectors(UP_Y, sunLocal.clone().normalize());
  if (subSolar.visible) {
    const pulse = 1 + Math.sin(frameT * 3.1) * 0.16;
    ssPin.userData.halo.scale.setScalar(pulse);
  }
  const delta = declination(state.N);

  // 晨昏线：平面法向 = 太阳方向
  terminator.visible = state.showTerminator;
  if (state.showTerminator) {
    terminator.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), sunLocal.clone().normalize());
  }

  if (cloudsMesh) {
    if (activeSectionId === 'daynight-arc') updateDayNightArc(state.obsLat, sunDir);
    if (activeSectionId === 'noon-alt') updateNoonViz(sunLocal, delta);
    if (activeSectionId === 'daynight' || activeSectionId === 'rotation') updateBeijingTime(sunLocal);
  }
  hud.el.style.display = hud.visibleNow ? '' : 'none';
  accSecs.data.classList.toggle('acc-empty', !hud.visibleNow);   /* 读数隐藏时数据块一并收走 */
  if (hud.visibleNow) hudRefresh(delta);
});

/* ---------------- HUD ---------------- */

const hud = makeHUD(document.getElementById('lcData'), [['date', '日期'], ['delta', '直射纬度'], ['extra', '读数']]);
hud.visibleNow = false;
function hudRefresh(delta) {
  hud.set('date', dateText(state.N));
  hud.set('delta', (delta / DEG).toFixed(1) + '°');
  if (hud.extraFn) hud.set('extra', hud.extraFn());
}

/* ---------------- 北京地方时（太阳时） ---------------- */

// 直射点经度必须换算到「随地球自转」的网格坐标系，与北京标记同 frame
function subsolarLonDeg(sunTiltLocal) {
  const qSpinInv = spinG.quaternion.clone().invert();
  const s = sunTiltLocal.clone().applyQuaternion(qSpinInv);
  return Math.atan2(-s.z, s.x) / DEG;
}
function updateBeijingTime(sunLocal) {
  const lonSS = subsolarLonDeg(sunLocal);
  let h = 12 + (OBS_LON - lonSS) / 15;
  h = ((h % 24) + 24) % 24;
  const hh = Math.floor(h);
  const mm = Math.floor((h - hh) * 60);
  hud.beijing = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

/* ---------------- 正午太阳高度演示 ---------------- */

function updateNoonViz(sunLocal, delta) {
  const lat = state.obsLat * DEG;
  const n = new THREE.Vector3(0, 1, 0); // tilt 系中的地轴
  const horiz = sunLocal.clone().sub(n.clone().multiplyScalar(sunLocal.dot(n)));
  if (horiz.lengthSq() < 1e-9) horiz.set(1, 0, 0);
  horiz.normalize();
  const point = horiz.clone().multiplyScalar(Math.cos(lat)).add(n.clone().multiplyScalar(Math.sin(lat))).multiplyScalar(1.005);
  const up = point.clone().normalize();
  const toSun = sunLocal.clone().normalize();

  noonState.pointMarker.position.copy(point);
  setLine(noonState.zenith, point, point.clone().add(up.clone().multiplyScalar(0.85)));
  // 地平面指示：当地经线方向（南北向）
  const northT = up.clone().cross(new THREE.Vector3(0, 1, 0)).normalize();
  setLine(noonState.horizon, point.clone().add(northT.clone().multiplyScalar(-0.55)), point.clone().add(northT.clone().multiplyScalar(0.55)));
  setLine(noonState.ray, point.clone().add(toSun.clone().multiplyScalar(0.06)), point.clone().add(toSun.clone().multiplyScalar(1.15)));

  // 角度弧：天顶方向 → 太阳方向
  const H = noonAltitude(state.obsLat, delta);
  const perp = up.clone().cross(toSun);
  const axisArc = perp.lengthSq() > 1e-8 ? perp.normalize() : new THREE.Vector3(0, 1, 0);
  const zAngle = Math.acos(clamp(up.dot(toSun), -1, 1));
  const arcPts = [];
  for (let i = 0; i <= 24; i++) {
    const a = (i / 24) * zAngle;
    arcPts.push(point.clone().add(up.clone().applyAxisAngle(axisArc, a).multiplyScalar(0.62)));
  }
  noonState.arc.geometry.dispose();
  noonState.arc.geometry = new THREE.BufferGeometry().setFromPoints(arcPts);

  const lblPos = point.clone().add(up.clone().multiplyScalar(0.72)).add(toSun.clone().multiplyScalar(0.42));
  setSpriteText(noonState.lbl, `H = ${H.toFixed(1)}°`, { fontSize: 36, color: '#ffffff', scale: 0.005, bg: 'rgba(10,16,24,0.72)' });
  noonState.lbl.position.copy(lblPos);
  state.noonH = H;
}
function setLine(line, a, b) {
  line.geometry.dispose();
  line.geometry = new THREE.BufferGeometry().setFromPoints([a, b]);
}

/* ---------------- 章节定义 ---------------- */

const ctl = createControlsPanel(document.getElementById('controls'));
let activeCtl = null;
let activeSectionId = null;
let activeSectionCleanup = null;

function setVis(...pairs) {
  pairs.forEach(([obj, v]) => { obj.visible = v; });
}

function baseCtl({ playing = true } = {}) {
  ctl.clear();
  activeCtl = { dateSync: false };
  state.playing = playing;
  const playBtn = ctl.button({
    label: playing ? '⏸ 暂停' : '▶ 播放',
    onClick() {
      state.playing = !state.playing;
      playBtn.textContent = state.playing ? '⏸ 暂停' : '▶ 播放';
      playBtn.classList.toggle('active', !state.playing);
    },
  });
  if (!playing) playBtn.classList.add('active');
  activeCtl.playBtn = playBtn;
  ctl.sep();
  const dateSlider = ctl.slider({
    label: '日期', min: 1, max: YEAR_DAYS, step: 1, value: Math.round(state.N),
    fmt: (v) => dateText(v),
    onInput: (v) => { state.N = v; },
  });
  activeCtl.dateSlider = dateSlider;
  return activeCtl;
}

function enterDefaults() {
  state.showTerminator = false;
  setVis([tropicN, false], [tropicS, false], [polarN, false], [polarS, false],
    [rotArrowGroup, false], [noonG, false],
    [subSolar, false], [bjDot, false], [bjLabel, false]);
  setPlaneDemo(false);
  dayNightArc.dayLines.forEach((e) => { e.line.visible = false; });
  dayNightArc.nightLines.forEach((e) => { e.line.visible = false; });
  cloudsMesh.visible = state.showClouds;
  earthUniforms.nightBrightness.value = state.showNight ? 0.9 : 0.35;
  hud.visibleNow = false;
}

const SECTIONS = [
  {
    id: 'overview',
    title: '地球运动总览',
    html: `<p>地球同时做着两种运动：<b>自转</b>（绕地轴，自西向东，周期约 24 小时）和<b>公转</b>（绕太阳，周期约 365.25 天）。</p>
<p>地轴始终是倾斜的，与公转轨道平面（黄道面）保持 <span class="hl">66°34′</span> 的夹角，倾角约 <span class="hl">23°26′</span>，且方向始终指向北极星附近——这为四季与昼夜长短的变化埋下伏笔。</p>
<p>拖动视图从各个角度观察：注意地轴的指向在公转过程中保持不变。</p>`,
    enter() {
      state.mode = 'orbit';
      state.spinPeriod = 9;
      state.orbitPeriod = 55;
      state.playing = true;
      applyMode();
      enterDefaults();
      app.setCamera([0, 13.5, 10.5], [0, 0, 0]);
      const c = baseCtl();
      c.dateSync = true;
      setPlaneDemo(true);
      ctl.sep();
      ctl.toggle({
        label: '黄道面与交角', value: true,
        onChange: (v) => setPlaneDemo(v),
      });
    },
  },
  {
    id: 'rotation',
    title: '地球自转',
    html: `<p>地球绕自转轴旋转，方向<b>自西向东</b>：从北极上空看是<b>逆时针</b>，从南极上空看是顺时针。</p>
<p>自转的地理意义：① 产生<b>昼夜交替</b>，周期约 24 小时（1 恒星日 = 23时56分4秒）；② 产生<b>时差</b>——经度每隔 15°，地方时相差 1 小时；③ 产生地转偏向力（北右南左）；④ 使赤道略鼓（角速度处处相等 ≈15°/h，线速度由赤道向两极递减）。</p>
<p>试用顶部按钮切换「北极俯视」视角，验证自转方向。</p>`,
    enter() {
      state.mode = 'earth';
      state.spinPeriod = 10;
      applyMode();
      enterDefaults();
      setVis([rotArrowGroup, true], [axisLine, true], [axisN, true], [equatorRing, true]);
      app.setCamera([1.8, 1.4, 2.9], [0, 0, 0]);
      hud.visibleNow = true;
      hud.extraFn = () => '北京地方时 ' + (hud.beijing || '--:--');
      baseCtl();
      ctl.sep();
      ctl.slider({
        label: '自转速度', min: 0.2, max: 4, step: 0.1, value: 1,
        fmt: (v) => v.toFixed(1) + '×',
        onInput: (v) => { state.speed = v; },
      });
      ctl.toggle({
        label: '北极俯视', value: false,
        onChange: (v) => {
          app.setCamera(v ? [0.02, 4.3, 0.02] : [1.8, 1.4, 2.9], [0, 0, 0]);
        },
      });
      ctl.toggle({
        label: '云层', value: true,
        onChange: (v) => { cloudsMesh.visible = v; state.showClouds = v; },
      });
    },
  },
  {
    id: 'daynight',
    title: '昼夜交替与晨昏线',
    html: `<p>地球是不透明的球体，同一时刻太阳只能照亮一半——被照亮的<b>昼半球</b>与背向太阳的<b>夜半球</b>的分界线叫<b>晨昏线</b>（圈）。</p>
<p>晨昏线经过赤道，与太阳光线垂直，把赤道平分；随着地球自西向东自转，晨昏线在地表自东向西扫过，各地因此经历昼夜交替。</p>
<p>顺地球自转方向，由夜进入昼的是<b>晨线</b>（当地 6 时附近），由昼进入夜的是<b>昏线</b>（18 时附近）。观察绿色的北京标记：它穿过晨线和昏线时，地方时分别是约 6 时和 18 时。拖动日期滑杆还能看到晨昏线与极圈的交角变化。</p>`,
    enter() {
      state.mode = 'earth';
      state.spinPeriod = 14;
      applyMode();
      enterDefaults();
      setVis([terminator, true], [bjDot, true], [bjLabel, true], [subSolar, true]);
      state.showTerminator = true;
      state.N = 81; // 春分前后：晨昏线过极点
      app.setCamera([2.2, 1.2, 2.6], [0, 0, 0]);
      hud.visibleNow = true;
      hud.extraFn = () => '北京地方时 ' + (hud.beijing || '--:--');
      baseCtl();
      ctl.sep();
      ctl.toggle({
        label: '夜半球灯光', value: true,
        onChange: (v) => { earthUniforms.nightBrightness.value = v ? 0.9 : 0.15; },
      });
      ctl.toggle({
        label: '晨昏线', value: true,
        onChange: (v) => { state.showTerminator = v; },
      });
    },
  },
  {
    id: 'revolution',
    title: '地球公转',
    html: `<p>地球绕太阳公转，方向也是<b>自西向东</b>（从北极上空看为逆时针），轨道是接近圆形的椭圆（偏心率仅 0.0167），周期约 <b>365.25 天</b>。</p>
<p>1 月初地球位于<b>近日点</b>（约 1.471 亿 km），7 月初位于<b>远日点</b>（约 1.521 亿 km）——冷暖季节差异主要来自<b>太阳高度与昼长</b>，而不是日地距离。</p>
<p>公转与自转方向一致；地轴倾斜方向在公转全程保持不变（指向北极星附近）。</p>`,
    enter() {
      state.mode = 'orbit';
      state.spinPeriod = 14;
      state.orbitPeriod = 60;
      applyMode();
      enterDefaults();
      app.setCamera([0, 14, 11], [0, 0, 0]);
      const c = baseCtl();
      c.dateSync = true;
      ctl.sep();
      ctl.toggle({
        label: '轨道与月份', value: true,
        onChange: (v) => { orbitRing.visible = v; monthLabels.visible = v; sunEarthLine.visible = v; },
      });
      ctl.toggle({
        label: '地轴', value: true,
        onChange: (v) => { axisLine.visible = axisN.visible = v; },
      });
      setPlaneDemo(true);
      ctl.toggle({
        label: '黄道面与交角', value: true,
        onChange: (v) => setPlaneDemo(v),
      });
    },
  },
  {
    id: 'subsolar',
    title: '太阳直射点的移动',
    html: `<p>由于黄赤交角的存在，太阳直射点在南北回归线之间往返移动：<b>夏至（6月22日前后）直射北回归线 23°26′N</b>，<b>冬至（12月22日前后）直射南回归线</b>，<b>春分/秋分直射赤道</b>。</p>
<p>直射点每年一个来回，周期为一个回归年（365天5时48分46秒）。直射点所在的纬线，正午太阳高度达全年最大（90°）。</p>
<p>拖动日期滑杆，看红色直射点沿所对经线在南北回归线之间移动；也可点「播放一年」自动演示。</p>`,
    enter() {
      state.mode = 'earth';
      applyMode();
      enterDefaults();
      setVis([subSolar, true], [tropicN, true], [tropicS, true], [equatorRing, true]);
      const sd = sunDirVec(state.N);
      app.setCamera([sd.x * 3.4, 1.1, sd.z * 3.4], [0, 0.1, 0]);
      hud.visibleNow = true;
      hud.extraFn = () => (state.N < 80 || (state.N >= 173 && state.N < 266) || state.N >= 356) ? '直射点北移 ↑' : '直射点南移 ↓';
      const c = baseCtl({ playing: false });
      c.playBtn.textContent = '▶ 播放一年';
      ctl.sep();
      ctl.toggle({
        label: '极圈', value: true,
        onChange: (v) => setVis([polarN, v], [polarS, v]),
      });
      setPlaneDemo(true);
      ctl.toggle({
        label: '黄道面与交角', value: true,
        onChange: (v) => setPlaneDemo(v),
      });
    },
  },
  {
    id: 'daynight-arc',
    title: '昼夜长短',
    html: `<p>晨昏线把任一纬线圈分成<b>昼弧</b>和<b>夜弧</b>——昼弧越长，该纬线上的白昼越长。</p>
<p>规律（以北半球为例）：① <b>春分→秋分</b>：昼长夜短，纬度越高昼越长；② <b>夏至</b>：昼最长，北极圈及其以北出现极昼；③ <b>冬至</b>相反；④ <b>赤道</b>全年昼夜平分；⑤ <b>春秋分</b>全球昼夜等长。</p>
<p>拖动「纬度」和「日期」滑杆，看橙色的昼弧与蓝色的夜弧如何变化，右侧同步给出昼长时数。</p>`,
    enter() {
      state.mode = 'earth';
      applyMode();
      enterDefaults();
      app.setCamera([2.8, 1.8, 2.4], [0, 0, 0]);
      hud.visibleNow = true;
      const refresh = () => {
        const d = dayLengthHours(state.obsLat, declination(state.N));
        hud.extraFn = () => {
          if (d >= 24) return '极昼（24 时）';
          if (d <= 0) return '极夜（0 时）';
          return `${Math.floor(d)}时${String(Math.round((d % 1) * 60)).padStart(2, '0')}分`;
        };
        hudRefresh(declination(state.N));
      };
      refresh();
      const c = baseCtl({ playing: false });
      state.spinPeriod = 999; // 该节不自转，只走日期
      ctl.sep();
      ctl.slider({
        label: '纬度', min: -90, max: 90, step: 1, value: state.obsLat,
        fmt: (v) => Math.abs(v) + '°' + (v >= 0 ? 'N' : 'S'),
        onInput: (v) => { state.obsLat = v; refresh(); },
      });
      // 日期滑杆变化时刷新昼长读数
      c.dateSlider.el.querySelector('input').addEventListener('input', refresh);
    },
  },
  {
    id: 'noon-alt',
    title: '正午太阳高度',
    html: `<p><b>正午太阳高度</b>＝当地正午时太阳光线与地平面的夹角，一天中的最大值。同一时刻，太阳高度从直射点向两侧递减。</p>
<p>公式：<span class="hl">H = 90° − |当地纬度 − 直射点纬度|</span>（同半球相减、异半球相加取绝对值）。</p>
<p>规律：夏至日北回归线及其以北地区 H 达全年最大；冬至日南回归线及其以南最大；赤道在春分秋分达 90°。</p>
<p>拖动「纬度」与「日期」，观察黄色的太阳光线、青色的铅垂线（指向天顶）之间的夹角 H。</p>`,
    enter() {
      state.mode = 'earth';
      applyMode();
      enterDefaults();
      setVis([noonG, true], [tropicN, true], [tropicS, true], [equatorRing, true]);
      hud.visibleNow = true;
      hud.extraFn = () => `H = ${state.noonH.toFixed(1)}°`;
      const refresh = () => hudRefresh(declination(state.N));
      refresh();
      const c = baseCtl({ playing: false });
      state.spinPeriod = 999;
      ctl.sep();
      ctl.slider({
        label: '纬度', min: -66, max: 66, step: 1, value: state.obsLat,
        fmt: (v) => Math.abs(v) + '°' + (v >= 0 ? 'N' : 'S'),
        onInput: (v) => { state.obsLat = v; refresh(); },
      });
      c.dateSlider.el.querySelector('input').addEventListener('input', refresh);
      aimNoonCamera();
    },
  },
  {
    id: 'seasons',
    title: '四季更替',
    html: `<p>四季更替的直接原因是<b>正午太阳高度</b>与<b>昼长</b>随季节变化——根源是黄赤交角与公转的组合。</p>
<p>二分二至（北半球）：① <b>春分 3月21日前后</b>，直射赤道；② <b>夏至 6月22日前后</b>，直射北回归线，北半球获得太阳辐射最多；③ <b>秋分 9月23日前后</b>；④ <b>冬至 12月22日前后</b>，直射南回归线。</p>
<p>注意：地球公转轨道是椭圆，1 月初过近日点——北半球冬季反而离太阳更近，可见季节与日地距离关系不大。四季最分明的地区是<b>中纬度</b>；赤道与极地只有干湿季或长昼长夜之分。</p>
<p>点击按钮跳到四个节气位置，对比地轴的倾向与昼夜分布。</p>`,
    enter() {
      state.mode = 'orbit';
      state.N = 173;
      state.orbitPeriod = 70;
      applyMode();
      enterDefaults();
      setVis([monthLabels, true], [sunEarthLine, true]);
      app.setCamera([10.5, 7.5, 10.5], [0, 0, 0]);
      hud.visibleNow = true;
      hud.extraFn = () => seasonText(state.N);
      hudRefresh(declination(state.N));
      const c = baseCtl();
      c.dateSync = true;
      ctl.sep();
      const jumps = [[80, '春分'], [173, '夏至'], [266, '秋分'], [356, '冬至']];
      jumps.forEach(([N, name]) => {
        ctl.button({
          label: name,
          onClick: () => { state.N = N; c.dateSlider.set(N); hudRefresh(declination(N)); },
        });
      });
    },
  },
  {
    id: 'quiz',
    title: '随堂检测',
    html: `<p>5 道选择题，检验一下本节课的掌握情况。答完可重新开始。</p>`,
    enter() {
      state.mode = 'earth';
      state.spinPeriod = 26;
      applyMode();
      enterDefaults();
      app.setCamera([1.6, 1.1, 2.8], [0, 0, 0]);
      ctl.clear();
      activeCtl = null;
      showQuiz();
    },
  },
];

function seasonText(N) {
  const n = Math.round(N);
  if (n >= 79 && n < 172) return '北半球：春季 → 夏季';
  if (n >= 172 && n < 266) return '北半球：夏季';
  if (n >= 266 && n < 356) return '北半球：秋季';
  return '北半球：冬季';
}

/* ---------------- 正午演示相机的初始对准 ---------------- */

// 进入 noon-alt 章节时，把相机摆到正午经线平面的正侧方（面向太阳光照来的方向）
function aimNoonCamera() {
  tiltG.getWorldQuaternion(_qTilt);
  const sunLocal = _sunDirW.clone().applyQuaternion(_qTilt.clone().invert());
  const n = new THREE.Vector3(0, 1, 0);
  const side = n.clone().cross(sunLocal).normalize();
  if (side.lengthSq() < 1e-6) side.set(1, 0, 0);
  // 让太阳方向大致朝向相机一侧（侧方偏太阳 40°）
  const towardSun = sunLocal.clone().normalize();
  const dir = side.multiplyScalar(Math.cos(0.7)).addScaledVector(towardSun, Math.sin(0.7)).normalize();
  app.setCamera([dir.x * 2.9, 1.0 + dir.y * 2.9, dir.z * 2.9], [0, 0.15, 0]);
}

/* ---------------- 随堂检测 ---------------- */

const QUIZ = [
  {
    q: '地球自转的正确方向是？',
    opts: ['自西向东', '自东向西', '自南向北', '顺时针（从北极上空看）'],
    a: 0,
    ex: '地球自西向东转（北极上空看为逆时针），因此晨昏线在地表自东向西移动，各地依次经历昼夜。',
  },
  {
    q: '关于晨昏线（圈），下列说法正确的是？',
    opts: ['晨昏线始终与经线圈重合', '晨昏线所在平面与太阳光线垂直', '晨昏线不经过赤道', '晨昏线上太阳高度为 45°'],
    a: 1,
    ex: '晨昏线是昼夜半球的分界，其所在平面与太阳光线垂直；晨昏线过赤道（除非在极昼极夜边缘特殊视觉），线上太阳高度为 0°；只有春分秋分时才与经线圈重合。',
  },
  {
    q: '6 月 22 日（夏至）前后，太阳直射点位于？',
    opts: ['赤道', '南回归线', '北回归线', '北极圈'],
    a: 2,
    ex: '夏至日太阳直射北回归线（23°26′N），此后直射点南移；冬至直射南回归线，春分秋分直射赤道。',
  },
  {
    q: '夏至日，北半球的昼夜长短状况是？',
    opts: ['全球昼夜等长', '昼最短夜最长', '昼最长夜最短，且纬度越高昼越长', '北极圈内全部极夜'],
    a: 2,
    ex: '夏至日北半球昼最长夜最短，纬度越高昼越长，北极圈及其以北出现极夜的反面——极昼；南半球相反。',
  },
  {
    q: '夏至日，北京（约 40°N）的正午太阳高度约为多少？',
    opts: ['约 26.5°', '约 50°', '约 73.5°', '约 90°'],
    a: 2,
    ex: 'H = 90° − |40° − 23.5°| = 73.5°。正午太阳高度由直射点向南北两侧递减。',
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
  activeSectionCleanup = () => panel.remove();
}

/* ================= 三栏布局驱动（左栏章节列表 / 右栏详解联动 / 栏折叠 / 专注模式） ================= */

const chapNav = document.getElementById('chapNav');
const chapCount = document.getElementById('chapCount');
const detailNo = document.getElementById('detailNo');
const detailTitle = document.getElementById('detailTitle');
const lessonEl = document.getElementById('lesson');
const detailBody = document.getElementById('detailBody');
const controlsEl = document.getElementById('controls');
const earthShell = document.getElementById('earthShell');
let chapterIdx = 0;

/* 章节竖排按钮：序号 + 标题，点击切章，当前章 .on 高亮 */
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
  if (activeSectionCleanup) { activeSectionCleanup(); activeSectionCleanup = null; }
  activeSectionId = sec.id;
  sec.enter();
  /* 本章无控件时整块手风琴收走（不动用户的手风琴偏好；数据块由帧循环按读数显隐同步） */
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
const focusBtn = document.getElementById('focusBtn');

const FOLD_KEY = { l: 'earth.foldL', r: 'earth.foldR' };
let foldL = false;
let foldR = false;
let focusSaved = null; /* 进入专注模式前的独立折叠状态 [foldL, foldR]，退出时恢复 */

try {
  foldL = localStorage.getItem(FOLD_KEY.l) === '1';
  foldR = localStorage.getItem(FOLD_KEY.r) === '1';
} catch (e) { /* localStorage 不可用（隐私模式等）时仅本次会话内生效 */ }

function applyFold() {
  earthShell.classList.toggle('fold-l', foldL);
  earthShell.classList.toggle('fold-r', foldR);
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
  earthShell.classList.toggle('focus-mode', on);
  focusBtn.textContent = on ? '退出专注' : '专注模式';
  focusBtn.setAttribute('aria-pressed', String(on));
  applyFold();
}

/* 独立折叠翻转并持久化；专注模式中点竖条展开钮 = 先退出专注（恢复原状）再翻转该侧 */
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

const ACC_KEYS = { lesson: 'earth.accLesson', controls: 'earth.accControls', data: 'earth.accData' };
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

/* ---------------- 启动 ---------------- */

const texUrls = {
  day: 'day-DmukkgAy.webp',
  night: 'night-7j0D73E-.webp',
  clouds: 'clouds-DTkGUc9f.webp',
  normal: 'earth_normal_2048-BD2vMuPH.jpg',
  spec: 'earth_specular_2048-6aAFN27D.jpg',
};

loadAll([
  { key: 'day', label: '昼半球', job: loadTexture(TEXDIR + texUrls.day) },
  { key: 'night', label: '夜半球', job: loadTexture(TEXDIR + texUrls.night) },
  { key: 'clouds', label: '云层', job: loadTexture(TEXDIR + texUrls.clouds, { colorSpace: null }) },
  { key: 'normal', label: '地形', job: loadTexture(TEXDIR + texUrls.normal, { colorSpace: null }) },
  { key: 'spec', label: '海面', job: loadTexture(TEXDIR + texUrls.spec, { colorSpace: null }) },
], (d, t, label) => loader.setText(`正在加载贴图 ${d}/${t}（${label}）`)).then((t) => {
  earthUniforms.dayMap.value = t.day;
  earthUniforms.nightMap.value = t.night;
  earthUniforms.specMap.value = t.spec;
  earthUniforms.normalMap.value = t.normal;

  earthMesh = new THREE.Mesh(
    new THREE.SphereGeometry(1, 128, 96),
    new THREE.ShaderMaterial({
      uniforms: earthUniforms,
      vertexShader: EARTH_VERT,
      fragmentShader: EARTH_FRAG,
    })
  );
  cloudsMesh = new THREE.Mesh(
    new THREE.SphereGeometry(1.012, 96, 64),
    new THREE.MeshLambertMaterial({
      color: 0xffffff,
      alphaMap: t.clouds,
      transparent: true,
      depthWrite: false,
      opacity: 0.85,
    })
  );
  atmoMesh = new THREE.Mesh(
    new THREE.SphereGeometry(1.06, 64, 48),
    new THREE.ShaderMaterial({
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      depthWrite: false,
      vertexShader: /* glsl */`
        varying vec3 vN; varying vec3 vWp;
        void main() {
          vN = normalize(mat3(modelMatrix) * normal);
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vWp = wp.xyz;
          gl_Position = projectionMatrix * viewMatrix * wp;
        }`,
      fragmentShader: /* glsl */`
        varying vec3 vN; varying vec3 vWp;
        void main() {
          vec3 v = normalize(cameraPosition - vWp);
          float rim = pow(max(dot(normalize(vN), v), 0.0), 2.2);
          gl_FragColor = vec4(vec3(0.28, 0.5, 0.95) * rim * 0.8, rim * 0.8);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    })
  );
  spinG.add(earthMesh, cloudsMesh);
  earthPos.add(atmoMesh);

  loader.hide();
  window.__eduSections = { select: selectChapter };
  /* 调试句柄（自动化验收/性能自查用） */
  window.__earthDebug = { vfx, app };
  selectChapter(0);
}).catch((err) => {
  loader.setText('资源加载失败：' + err.message);
  console.error(err);
});
