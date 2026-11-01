/* EduLab · 传热与物态变化（heat）—— Micro 级深改版
 * 章节：温度计的使用 / 摄氏温度 / 熔化和凝固 / 水的沸腾 / 蒸发和液化 / 升华和凝华 /
 *       比较不同物质的吸热能力 / 热传导 / 热对流 / 热辐射 / 从冰到沸腾 / 随堂检测
 * 布局（micro 三件套移植）：真·三栏教学布局——左栏章节大纲（点击切章 + ‹01/12› 上下章）/ 中栏 3D 热学实验台
 *   （相机飞行）/ 右栏 讲解 + 本章控件 + 数据读数；左右栏独立折叠（28px 竖条）+ 专注模式 +
 *   右栏三块手风琴（localStorage 记忆，切章不重置）；温度曲线浮窗可折叠为 40px 圆形徽标（heat.foldChart）。
 * 视觉工艺（edu-vfx 轻接入 + Micro 级建模）：
 *   - 温度计：Lathe 玻璃壳（管身/收腰/球泡一体成型）+ 程序化刻度套膜（-20~110℃ 全刻度 CanvasTexture，
 *     0/100 红标）+ 红色液柱 setFrac + 金属端帽 + 挂环
 *   - 加热板：烤漆机身 + 微凸陶瓷顶板 + 发热线圈（联动发光）+ 散热栅阵列（InstancedMesh）+
 *     功率旋钮（随滑杆同步旋转）+ 橡胶脚垫 + 电源线 + 铭牌（程序化纹理）
 *   - 铁架台：车削铸铁底盘（圆角收边）+ 立杆 + 滚花调节环 + 横臂 + 圆环托
 *   - 玻璃器材全程序化：烧杯（卷边口沿 + 环面刻度贴片 + 倒流嘴）/ 小试管（圆底 + 卷口）/ 碘锤 /
 *     试剂瓶（弧面标签 + 双层内液 + 液面）/ 真空保温瓶（剖切外壳 + 镀银内胆 + 软木塞）
 *   - 场景叙事：试剂瓶阵列 / 试管架 + 空试管 / 火柴盒（磷皮纹理）/ 记录夹板（坐标纸 + 手绘曲线）/
 *     墙面物理海报（热传递三方式 / 晶体熔化曲线，程序化 CanvasTexture）/ 烘焙接触阴影
 *   - 程序化纹理：温标刻度 / 烧杯刻度 / 沙粒 / 磷皮 / 台面木纹 / 墙漆 / 海报 / 铭牌 / 压力表盘 / 记录纸
 *   - 光照氛围：主暖光 + 冷补光 + 正面柔光 + 桌面 bounce + 程序化摄影棚环境反射（makeStudioEnvironment）
 *   - 交互可视反馈：加热板旋钮随功率滑杆旋转 / 沸腾章气压表指针随气压摆动 / 风扇桨叶随开关启停 /
 *     高锰酸钾晶粒投放坠落动画 / 直接加热过熔点时碘熔化成液池 / 液化演示冷玻璃片升温读数
 * 教学交互（原版功能 1:1 对齐）：温度计使用（水温/玻璃泡位置/俯视平视仰视 + 三个读数预案）·
 *   摄氏温度（游标滑杆 + 放入冰水/沸水标定 + ℉/K 换算）· 熔化凝固（海波 vs 石蜡 + 水浴 + 曲线平台）·
 *   水的沸腾（气压滑杆 + 标准大气压/高原/高压锅预案 + 气泡前后对比 + 停止加热）·
 *   蒸发液化（湿泡示数/风扇/酒精量/重新蘸酒精 + 白气演示/换冷玻璃片 + 玻璃片升温）·
 *   升华凝华（水浴 vs 直接加热 + 碘过熔点熔化对比 + 冷端温度 + 凝华晶体）·
 *   比热容（水 vs 食用油/煤油/沙子 + 质量滑杆 + 比热容之比读数 + Q=cmΔt）·
 *   热传导（四棒火柴依导热系数掉落 + 热源温度滑杆 + 热成像 + 重新粘火柴）·
 *   热对流（底部/侧面加热 + 投入高锰酸钾 + 停止加热 + 换一槽清水 + 流线）·
 *   热辐射（灯照黑罐白罐 + 真空保温瓶对比 + 重新倒热水）· 从冰到沸腾（初温可调 + 四阶段跳转 + 两平台）·
 *   5 题随堂检测；全局：上一/下一章节（, .）· 播放/暂停（空格）· 收起面板（]）·
 *   重做实验 · 器材名称 · 画质/流畅度优先 · 大屏（课堂模式）。
 */
import {
  THREE, TAU, clamp,
  createApp, makeLoader,
  createControlsPanel, makeHUD, makeTextSprite, setSpriteText, makeGlowTexture,
} from './edu-core.js';
import {
  attachVFX, PAL,
  matCoat, matStd,
  makeStudioEnvironment, makeWoodTexture, makeLabelTexture, makeBackdropTexture,
} from './edu-vfx.js';

/* ---------------- 场景与工艺接入 ---------------- */

const stage = document.getElementById('stage');
const loader = makeLoader(stage, '正在搭建热学实验台…');
const app = createApp({
  container: stage,
  fov: 42, near: 0.05, far: 60,
  cameraPos: [0.6, 1.5, 3.0],
  target: [0, 1.02, 0],
  minDistance: 0.45, maxDistance: 9,
  exposure: 1.05,
  keepBackground: true,
});
const { scene } = app;
/* 视觉工艺轻接入：后处理管线接管渲染循环与相机缓动（setCamera 升级为 cubic 运镜）；
   金属/玻璃反射走程序化摄影棚，背景用程序化实验室渐变——零外部资产，首帧即建 */
const vfx = attachVFX(app, 'illus');
scene.environment = makeStudioEnvironment(app.renderer);
app.renderer.toneMappingExposure = 0.98;
const labBackdrop = makeBackdropTexture({ inner: '#d3dce1', outer: '#4e5860', glow: '#f7efdd', glowStrength: 0.3 });
scene.background = labBackdrop;

/* 灯光：暖主光 + 冷补光 + 正面柔光 + 桌面近距 bounce + 低环境 */
const keyLight = new THREE.DirectionalLight(0xfff0dd, 1.15);
keyLight.position.set(3.5, 5, 3);
scene.add(keyLight);
const fillLight = new THREE.DirectionalLight(0xdfe8ff, 0.45);
fillLight.position.set(-4, 3, -2.5);
scene.add(fillLight);
const frontLight = new THREE.DirectionalLight(0xeef4ff, 0.3);
frontLight.position.set(0.5, 2.4, 5);
scene.add(frontLight);
scene.add(new THREE.AmbientLight(0x9a948c, 0.34));
const deskBounce = new THREE.PointLight(0xffd9a0, 0.2, 5, 1.9);
deskBounce.position.set(0.2, 1.35, 1.6);
scene.add(deskBounce);

const mesh = (geo, mat) => new THREE.Mesh(geo, mat);
function box(w, h, d, mat) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); }
function stdMat(opts) { return new THREE.MeshStandardMaterial(opts); }
function label(text, color = '#ffffff', scale = 0.00085, bg = 'rgba(10,14,20,0.72)') {
  const s = makeTextSprite(text, { fontSize: 27, color, scale, bg });
  equipLabels.push(s);
  return s;
}

/* ---------------- 程序化纹理与小件工具 ---------------- */

/* 可播种伪随机（mulberry32）：同 seed 同纹理，道具可复现 */
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* 画布贴图工厂（颜色空间 + 各向异性） */
function canvasTex(w, h, draw) {
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  draw(cv.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/* 混凝土地面：底色 + 斑点骨料 + 细裂缝 + 分块缝线 */
function concreteTexture(size = 512) {
  const rnd = mulberry32(41);
  return canvasTex(size, size, (ctx) => {
    ctx.fillStyle = '#9aa0a6';
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 2600; i++) {
      const x = rnd() * size, y = rnd() * size, r = 0.6 + rnd() * 2.2;
      const g = 120 + rnd() * 70;
      ctx.fillStyle = `rgba(${g},${g + 3},${g + 6},${0.16 + rnd() * 0.2})`;
      ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    }
    ctx.strokeStyle = 'rgba(70,74,78,0.28)';
    for (let i = 0; i < 7; i++) {
      ctx.lineWidth = 0.7 + rnd() * 0.8;
      ctx.beginPath();
      let x = rnd() * size, y = rnd() * size;
      ctx.moveTo(x, y);
      for (let k = 0; k < 6; k++) { x += (rnd() - 0.5) * 90; y += (rnd() - 0.5) * 90; ctx.lineTo(x, y); }
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(84,88,92,0.5)';
    ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.moveTo(size / 2, 0); ctx.lineTo(size / 2, size); ctx.moveTo(0, size / 2); ctx.lineTo(size, size / 2); ctx.stroke();
  });
}

/* 墙面涂料：微噪 + 竖向轻渐变 */
function wallPaintTexture(size = 512) {
  const rnd = mulberry32(77);
  return canvasTex(size, size, (ctx) => {
    const g = ctx.createLinearGradient(0, 0, 0, size);
    g.addColorStop(0, '#e0e6ea');
    g.addColorStop(1, '#d2d9de');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 1800; i++) {
      const x = rnd() * size, y = rnd() * size;
      ctx.fillStyle = `rgba(120,126,132,${0.03 + rnd() * 0.05})`;
      ctx.fillRect(x, y, 1.4, 1.4);
    }
  });
}

/* 温度计刻度套膜：乳白底 + -20~110℃ 全刻度（0/100 红标），贴在管身右侧弧带上 */
function thermoScaleTexture() {
  return canvasTex(256, 512, (ctx) => {
    ctx.fillStyle = '#f2efe4';
    ctx.fillRect(0, 0, 256, 512);
    const rnd = mulberry32(5);
    for (let i = 0; i < 220; i++) {
      ctx.fillStyle = `rgba(120,110,88,${0.03 + rnd() * 0.05})`;
      ctx.fillRect(rnd() * 256, rnd() * 512, 1.6, 1.6);
    }
    /* 左侧留出液柱观察窗（半透明乳白），刻度贴右半 */
    ctx.fillStyle = 'rgba(238,234,222,0.55)';
    ctx.fillRect(0, 0, 96, 512);
    const yOf = (t) => 30 + (1 - (t + 20) / 130) * (512 - 60);
    for (let t = -20; t <= 110; t++) {
      const y = yOf(t);
      const maj = t % 10 === 0, mid = t % 5 === 0;
      const len = maj ? 46 : mid ? 28 : 15;
      ctx.strokeStyle = maj ? '#3a3f45' : mid ? '#7d838a' : '#adb3b9';
      ctx.lineWidth = maj ? 4 : 1.8;
      ctx.beginPath(); ctx.moveTo(252 - len, y); ctx.lineTo(252, y); ctx.stroke();
      if (maj) {
        const key = t === 0 || t === 100;
        ctx.fillStyle = key ? '#c23a28' : '#3a3f45';
        ctx.font = `700 ${key ? 26 : 22}px 'Avenir Next', 'Helvetica Neue', sans-serif`;
        ctx.textAlign = 'right';
        ctx.fillText(String(t), 252 - len - 8, y + 8);
      }
    }
    ctx.fillStyle = '#3a3f45';
    ctx.font = "700 24px 'Avenir Next', sans-serif";
    ctx.textAlign = 'left';
    ctx.fillText('℃', 108, 26);
  });
}

/* 烧杯环面刻度贴片：50 / 100 mL 横线 + 数字 */
function beakerGradTexture(full = true) {
  return canvasTex(128, 256, (ctx) => {
    ctx.clearRect(0, 0, 128, 256);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = "600 24px 'Avenir Next', sans-serif";
    ctx.textAlign = 'left';
    const rows = full ? [[0.78, '100'], [0.56, '50']] : [[0.72, '50']];
    rows.forEach(([k, txt]) => {
      const y = 256 * k;
      ctx.fillRect(8, y - 1.5, 52, 3);
      ctx.fillText(txt, 66, y + 9);
    });
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    for (let i = 1; i < 10; i++) ctx.fillRect(8, 256 * (0.1 + i * 0.075), 24, 2);
  });
}

/* 沙粒纹理（对比吸热章的沙子） */
function sandTexture(size = 256) {
  const rnd = mulberry32(29);
  return canvasTex(size, size, (ctx) => {
    ctx.fillStyle = '#d8b878';
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 2400; i++) {
      const x = rnd() * size, y = rnd() * size, r = 0.5 + rnd() * 1.6;
      const t = rnd();
      ctx.fillStyle = t > 0.6 ? `rgba(180,142,84,${0.5 + rnd() * 0.4})` : t > 0.3 ? `rgba(232,204,150,${0.6})` : `rgba(148,110,60,${0.5})`;
      ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    }
  });
}

/* 火柴盒侧面磷皮（暗红 + 颗粒） */
function strikerTexture(size = 128) {
  const rnd = mulberry32(17);
  return canvasTex(size, size, (ctx) => {
    ctx.fillStyle = '#5a2620';
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 700; i++) {
      const x = rnd() * size, y = rnd() * size;
      ctx.fillStyle = rnd() > 0.5 ? `rgba(140,60,44,${0.4 + rnd() * 0.4})` : `rgba(30,12,10,${0.4})`;
      ctx.fillRect(x, y, 1.6 + rnd() * 1.6, 1.2 + rnd());
    }
  });
}

/* 加热板铭牌 */
function brandPlateTexture() {
  return canvasTex(256, 96, (ctx) => {
    ctx.fillStyle = '#20242a';
    ctx.fillRect(0, 0, 256, 96);
    ctx.strokeStyle = 'rgba(210,190,150,0.5)';
    ctx.lineWidth = 3;
    ctx.strokeRect(5, 5, 246, 86);
    ctx.fillStyle = '#d8c690';
    ctx.font = "700 34px 'Avenir Next', sans-serif";
    ctx.textAlign = 'center';
    ctx.fillText('HEAT·PRO', 128, 44);
    ctx.font = "500 20px 'Avenir Next', sans-serif";
    ctx.fillStyle = '#9aa2ac';
    ctx.fillText('500 W · 220 V', 128, 76);
  });
}

/* 气压表盘（0.4~2.2 atm 弧形刻度） */
function gaugeTexture() {
  return canvasTex(256, 256, (ctx) => {
    ctx.fillStyle = '#f0ede4';
    ctx.beginPath(); ctx.arc(128, 128, 126, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#3a3f46';
    for (let i = 0; i <= 9; i++) {
      const a = -Math.PI * 0.78 + (i / 9) * Math.PI * 1.56;
      const r0 = i % 3 === 0 ? 74 : 86, r1 = 98;
      ctx.lineWidth = i % 3 === 0 ? 4 : 1.8;
      ctx.beginPath();
      ctx.moveTo(128 + Math.sin(a) * r0, 128 - Math.cos(a) * r0);
      ctx.lineTo(128 + Math.sin(a) * r1, 128 - Math.cos(a) * r1);
      ctx.stroke();
      if (i % 3 === 0) {
        ctx.fillStyle = '#3a3f46';
        ctx.font = "600 19px 'Avenir Next', sans-serif";
        ctx.textAlign = 'center';
        ctx.fillText(String(0.4 + i * 0.2), 128 + Math.sin(a) * 58, 128 - Math.cos(a) * 58 + 7);
      }
    }
    ctx.fillStyle = '#3a3f46';
    ctx.font = "600 17px 'Avenir Next', sans-serif";
    ctx.textAlign = 'center';
    ctx.fillText('atm', 128, 176);
  });
}

/* 记录夹板纸：坐标纸 + 手绘熔化平台曲线 */
function clipboardTexture() {
  return canvasTex(256, 352, (ctx) => {
    ctx.fillStyle = '#f6f3ea';
    ctx.fillRect(0, 0, 256, 352);
    ctx.strokeStyle = 'rgba(90,140,190,0.28)';
    ctx.lineWidth = 1;
    for (let x = 16; x < 256; x += 16) { ctx.beginPath(); ctx.moveTo(x, 12); ctx.lineTo(x, 340); ctx.stroke(); }
    for (let y = 12; y < 352; y += 16) { ctx.beginPath(); ctx.moveTo(16, y); ctx.lineTo(244, y); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(70,76,84,0.65)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(16, 16); ctx.lineTo(16, 336); ctx.lineTo(244, 336); ctx.stroke();
    ctx.strokeStyle = '#c2503a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(28, 320);
    ctx.lineTo(88, 236);
    ctx.lineTo(150, 236);
    ctx.lineTo(216, 84);
    ctx.stroke();
    ctx.fillStyle = '#8a919a';
    ctx.font = "500 17px 'PingFang SC', sans-serif";
    ctx.fillText('t/min', 208, 330);
    ctx.fillText('T/℃', 22, 30);
  });
}

/* 墙面海报：热传递三方式 / 晶体熔化曲线（教学叙事道具） */
function posterTexture(kind) {
  return canvasTex(360, 480, (ctx) => {
    ctx.fillStyle = '#f4f1e8';
    ctx.fillRect(0, 0, 360, 480);
    ctx.fillStyle = '#e7e2d4';
    ctx.fillRect(0, 0, 360, 64);
    ctx.fillStyle = '#2e3440';
    ctx.font = `700 26px 'PingFang SC', 'Microsoft YaHei', sans-serif`;
    ctx.textBaseline = 'middle';
    if (kind === 'transfer') {
      ctx.fillText('热传递的三种方式', 20, 34);
      /* 传导：棒 + 火苗 + 箭头 */
      ctx.fillStyle = '#b0854a';
      ctx.fillRect(30, 110, 200, 16);
      ctx.fillStyle = '#e07038';
      ctx.beginPath(); ctx.moveTo(236, 140); ctx.quadraticCurveTo(252, 108, 236, 84); ctx.quadraticCurveTo(228, 104, 218, 116); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#5a6470';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(60, 92); ctx.lineTo(120, 92); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(112, 84); ctx.lineTo(124, 92); ctx.lineTo(112, 100); ctx.stroke();
      ctx.fillStyle = '#2e3440';
      ctx.font = `600 19px 'PingFang SC', sans-serif`;
      ctx.fillText('传导：沿物体从高温到低温', 30, 176);
      /* 对流：环形箭头 */
      ctx.strokeStyle = '#3f8fd2';
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(96, 268, 40, 0.5, 4.6); ctx.stroke();
      ctx.fillStyle = '#3f8fd2';
      ctx.beginPath(); ctx.moveTo(124, 296); ctx.lineTo(104, 292); ctx.lineTo(118, 276); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#e07038';
      ctx.fillRect(70, 306, 52, 8);
      ctx.fillStyle = '#2e3440';
      ctx.fillText('对流：靠流动传热', 160, 268);
      /* 辐射：波纹 */
      ctx.strokeStyle = '#c2503a';
      ctx.lineWidth = 3;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath(); ctx.arc(70, 396, 14 + i * 13, -0.9, 0.9); ctx.stroke();
      }
      ctx.fillStyle = '#c2503a';
      ctx.beginPath(); ctx.arc(46, 396, 9, 0, TAU); ctx.fill();
      ctx.fillStyle = '#2e3440';
      ctx.fillText('辐射：不需要介质', 160, 396);
    } else {
      ctx.fillText('晶体熔化曲线', 20, 34);
      ctx.strokeStyle = 'rgba(70,76,84,0.7)';
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(48, 90); ctx.lineTo(48, 400); ctx.lineTo(330, 400); ctx.stroke();
      ctx.strokeStyle = '#c2503a';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(64, 380); ctx.lineTo(120, 260); ctx.lineTo(210, 260); ctx.lineTo(300, 130);
      ctx.stroke();
      ctx.setLineDash([6, 5]);
      ctx.strokeStyle = 'rgba(194,80,58,0.55)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(48, 260); ctx.lineTo(300, 260); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#c2503a';
      ctx.font = `600 18px 'PingFang SC', sans-serif`;
      ctx.fillText('熔点：吸热温度不变', 118, 242);
      ctx.fillStyle = '#8a919a';
      ctx.fillText('t/min', 292, 424);
      ctx.save();
      ctx.translate(36, 300); ctx.rotate(-Math.PI / 2);
      ctx.fillText('T/℃', 0, 0);
      ctx.restore();
      ctx.fillStyle = '#2e3440';
      ctx.font = `500 17px 'PingFang SC', sans-serif`;
      ctx.fillText('非晶体没有熔点，熔化时温度一直上升', 40, 452);
    }
    ctx.strokeStyle = 'rgba(46,52,64,0.35)';
    ctx.lineWidth = 6;
    ctx.strokeRect(6, 6, 348, 468);
  });
}

/* ---------------- 烘焙接触阴影（径向渐变 Blob，单 draw call 免实时 shadowMap） ---------------- */

const SHADOW_BLOBS = [];
function bakeContactShadow(x, z, w, d, opacity = 0.32) {
  SHADOW_BLOBS.push({ x, z, w, d, opacity });
}
function buildBenchShadow() {
  const BW = 5.2, BD = 1.8;               /* 台面阴影覆盖 5.2 × 1.8 */
  const CW = 1024, CH = Math.round(CW * BD / BW);
  const cv = document.createElement('canvas');
  cv.width = CW; cv.height = CH;
  const ctx = cv.getContext('2d');
  for (const b of SHADOW_BLOBS) {
    const px = ((b.x + 2.6) / BW) * CW;
    const pz = ((b.z + 0.95) / BD) * CH;
    const rx = (b.w / BW) * CW / 2;
    const rz = (b.d / BD) * CH / 2;
    const g = ctx.createRadialGradient(px, pz, 0, px, pz, Math.max(rx, rz));
    g.addColorStop(0, `rgba(16,10,5,${b.opacity})`);
    g.addColorStop(0.55, `rgba(16,10,5,${b.opacity * 0.5})`);
    g.addColorStop(1, 'rgba(16,10,5,0)');
    ctx.fillStyle = g;
    ctx.save();
    ctx.translate(px, pz);
    ctx.scale(1, rz / Math.max(rx, rz));
    ctx.beginPath(); ctx.arc(0, 0, Math.max(rx, rz), 0, TAU); ctx.fill();
    ctx.restore();
  }
  const tex = new THREE.CanvasTexture(cv);
  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(BW, BD),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false })
  );
  plane.rotation.x = -Math.PI / 2;
  plane.position.set(0, BENCH_Y + 0.0016, -0.05);
  worldG.add(plane);
}

/* ---------------- 实验室环境 ---------------- */

const worldG = new THREE.Group();
scene.add(worldG);
const BENCH_Y = 0.9;

function buildWorld() {
  const floor = mesh(new THREE.PlaneGeometry(16, 12), stdMat({
    color: 0xaeb4ba, roughness: 0.85, metalness: 0.05, map: concreteTexture(),
  }));
  floor.material.map.wrapS = floor.material.map.wrapT = THREE.RepeatWrapping;
  floor.material.map.repeat.set(6, 5);
  floor.rotation.x = -Math.PI / 2;
  worldG.add(floor);

  const wall = mesh(new THREE.PlaneGeometry(16, 5), stdMat({
    color: 0xdde2e6, roughness: 0.9, map: wallPaintTexture(),
  }));
  wall.material.map.wrapS = wall.material.map.wrapT = THREE.RepeatWrapping;
  wall.material.map.repeat.set(5, 1.6);
  wall.position.set(0, 2.5, -2.6);
  worldG.add(wall);

  /* 台面：木纹（makeWoodTexture 同族两 seed：桌身深 / 桌面浅） */
  const benchBody = box(4.9, 0.85, 1.5, matStd(PAL.ink, { roughness: 0.62, metalness: 0.06, color: 0x39424c }));
  benchBody.material.color.set(0x3c4650);
  benchBody.position.set(0, 0.425, -0.05);
  worldG.add(benchBody);

  const topTex = makeWoodTexture({ base: '#b08a52', dark: '#8a6538', light: '#c9a76c', streaks: 120, bands: 8, planks: 5, seed: 23 });
  topTex.repeat.set(3.2, 1.1);
  const benchTop = box(5.0, 0.05, 1.6, stdMat({ color: 0xffffff, roughness: 0.58, metalness: 0.04, map: topTex }));
  benchTop.position.set(0, 0.875, -0.05);
  worldG.add(benchTop);

  /* 台面前沿警示条（物理实验室常见黑黄贴条） */
  const trim = box(5.0, 0.012, 0.03, stdMat({ color: 0x2c2f34, roughness: 0.6 }));
  trim.position.set(0, 0.906, 0.72);
  worldG.add(trim);

  /* 墙面海报 ×2（热传递三方式 / 晶体熔化曲线） */
  const poster1 = mesh(new THREE.PlaneGeometry(0.52, 0.7), stdMat({ color: 0xffffff, roughness: 0.85, map: posterTexture('transfer') }));
  poster1.position.set(-1.7, 1.98, -2.58);
  worldG.add(poster1);
  const poster2 = mesh(new THREE.PlaneGeometry(0.52, 0.7), stdMat({ color: 0xffffff, roughness: 0.85, map: posterTexture('melt') }));
  poster2.position.set(1.7, 1.98, -2.58);
  worldG.add(poster2);
}

/* ---------------- 场景叙事道具（台面后沿阵列） ---------------- */

/* 试剂瓶：玻璃瓶身 + 双层内液 + 液面 + 铝盖 + 弧面标签 */
function reagentBottle(name, sub, liquidColor) {
  const g = new THREE.Group();
  const body = mesh(new THREE.LatheGeometry([
    [0, 0.004], [0.016, 0.005], [0.023, 0.012], [0.024, 0.02],
    [0.024, 0.05], [0.021, 0.055], [0.009, 0.06], [0.009, 0.068], [0.012, 0.072],
  ].map((p) => new THREE.Vector2(p[0], p[1])), 24), glassMat(0.3));
  const liquid = mesh(new THREE.CylinderGeometry(0.02, 0.021, 0.03, 18), liquidMat(liquidColor, 0.5));
  liquid.position.y = 0.02;
  const surf = mesh(new THREE.CylinderGeometry(0.0195, 0.0195, 0.0015, 18), stdMat({ color: liquidColor, roughness: 0.15 }));
  surf.position.y = 0.035;
  const cap = mesh(new THREE.LatheGeometry([
    [0.008, 0], [0.0135, 0], [0.0135, 0.012], [0.011, 0.014],
  ].map((p) => new THREE.Vector2(p[0], p[1])), 18), matStd(PAL.steel, { roughness: 0.32, metalness: 0.85 }));
  cap.position.y = 0.072;
  const lblTex = makeLabelTexture([name, sub], { w: 300, h: 170, lineSizes: [46, 26] });
  const lbl = mesh(new THREE.CylinderGeometry(0.0246, 0.0246, 0.026, 18, 1, true, -1.15, 2.3),
    stdMat({ map: lblTex, roughness: 0.7, transparent: true, opacity: 0.96 }));
  lbl.position.y = 0.033;
  g.add(body, liquid, surf, cap, lbl);
  return g;
}

/* 试管架 + 空试管 */
function tubeRackProp() {
  const g = new THREE.Group();
  const wood = matStd(0xffffff, { roughness: 0.6, map: makeWoodTexture({ base: '#9a7648', dark: '#74522c', light: '#b8946a', streaks: 70, bands: 6, seed: 61 }) });
  const base = box(0.1, 0.008, 0.05, wood);
  base.position.y = 0.004;
  const bar = box(0.1, 0.005, 0.018, wood);
  bar.position.set(0, 0.052, -0.012);
  const post1 = box(0.008, 0.05, 0.018, wood);
  post1.position.set(-0.044, 0.03, -0.012);
  const post2 = post1.clone(); post2.position.x = 0.044;
  g.add(base, bar, post1, post2);
  for (let i = -1; i <= 1; i++) {
    const t = makeTube(0.06, 0.008);
    t.position.set(i * 0.03, 0.008, 0.008);
    g.add(t);
  }
  return g;
}

/* 火柴盒（外盒 + 磷皮 + 顶标） */
function matchboxProp() {
  const g = new THREE.Group();
  const shell = box(0.05, 0.013, 0.036, matStd(0xc9a23c, { roughness: 0.7 }));
  shell.position.y = 0.0065;
  const striker = mesh(new THREE.PlaneGeometry(0.036, 0.012), stdMat({ map: strikerTexture(), roughness: 0.9 }));
  striker.position.set(0, 0.0065, 0.0185);
  const topLbl = mesh(new THREE.PlaneGeometry(0.044, 0.03), stdMat({ map: makeLabelTexture(['安全火柴'], { w: 256, h: 160, lineSizes: [40] }), roughness: 0.7 }));
  topLbl.rotation.x = -Math.PI / 2;
  topLbl.position.y = 0.0132;
  g.add(shell, striker, topLbl);
  return g;
}

/* 记录夹板（坐标纸 + 手绘曲线） */
function clipboardProp() {
  const g = new THREE.Group();
  const board = box(0.115, 0.004, 0.155, matStd(0x8a6a42, { roughness: 0.65 }));
  board.position.y = 0.002;
  const paper = mesh(new THREE.PlaneGeometry(0.1, 0.138), stdMat({ map: clipboardTexture(), roughness: 0.85 }));
  paper.rotation.x = -Math.PI / 2;
  paper.position.y = 0.0045;
  const clip = box(0.04, 0.006, 0.014, matStd(PAL.steel, { roughness: 0.35, metalness: 0.8 }));
  clip.position.set(0, 0.008, -0.066);
  g.add(board, paper, clip);
  return g;
}

/* ---------------- 材质与玻璃工具 ---------------- */

function glassMat(opacity = 0.18, color = 0xb9d2e2) {
  return new THREE.MeshPhysicalMaterial({
    color, metalness: 0, roughness: 0.05, transparent: true, opacity,
    envMapIntensity: 0.5, clearcoat: 0.6, clearcoatRoughness: 0.2,
    side: THREE.DoubleSide, depthWrite: false,
  });
}
function liquidMat(color, opacity = 0.45) {
  return new THREE.MeshPhysicalMaterial({
    color, metalness: 0, roughness: 0.12, transparent: true, opacity,
    envMapIntensity: 0.9, side: THREE.DoubleSide,
  });
}
const metalMat = stdMat({ color: 0x454b52, roughness: 0.42, metalness: 0.78 });
const equipLabels = [];

function lathe(pts, mat, seg = 40) {
  const geo = new THREE.LatheGeometry(pts.map((p) => new THREE.Vector2(p[0], p[1])), seg);
  return new THREE.Mesh(geo, mat);
}

/* ---------------- 深改建模 · 温度计（Lathe 玻璃壳 + 刻度套膜 + 液柱） ----------------
 * setFrac(0..1)：-20℃ → 110℃ 线性映射液柱高度；刻度套膜与液柱同一映射，读数自洽 */

const thermoScaleTex = thermoScaleTexture();
function makeThermometer(len = 0.17) {
  const g = new THREE.Group();
  /* 玻璃壳：球泡 + 收腰 + 管身 + 卷口，一体车削 */
  const shell = lathe([
    [0, 0.002], [0.006, 0.003], [0.0095, 0.008], [0.0105, 0.014],
    [0.0075, 0.021], [0.006, 0.026], [0.006, len - 0.004],
    [0.0066, len - 0.001], [0.007, len],
  ], glassMat(0.26), 20);
  /* 刻度套膜：管身右后侧弧带（θ 0.4~2.7），与液柱同映射 */
  const band = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0069, 0.0069, len * 0.94, 20, 1, true, -0.65, 2.3),
    stdMat({ map: thermoScaleTex, roughness: 0.55, transparent: true, opacity: 0.96 })
  );
  band.position.y = len * 0.5;
  /* 红色液柱（含球泡内的液芯） */
  const colGeo = new THREE.CylinderGeometry(0.0024, 0.0024, 1, 8);
  colGeo.translate(0, 0.5, 0);
  const column = new THREE.Mesh(colGeo, stdMat({ color: 0xe0392e, roughness: 0.35 }));
  const bulbCore = new THREE.Mesh(new THREE.SphereGeometry(0.0082, 12, 10), stdMat({ color: 0xe0392e, roughness: 0.35 }));
  bulbCore.position.y = 0.009;
  /* 金属端帽 + 挂环 */
  const cap = lathe([
    [0.005, 0], [0.0072, 0.001], [0.0072, 0.012], [0.0055, 0.014], [0, 0.0145],
  ], matStd(PAL.brass, { roughness: 0.35, metalness: 0.9 }), 16);
  cap.position.y = len + 0.001;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.004, 0.0011, 8, 16), matStd(PAL.brass, { roughness: 0.35, metalness: 0.9 }));
  ring.position.y = len + 0.019;
  g.add(shell, band, column, bulbCore, cap, ring);
  g.userData.setFrac = (f) => {
    const h = Math.max(0.004, len * 0.9 * clamp(f, 0, 1));
    column.scale.y = h;
    column.position.y = 0.012;
  };
  return g;
}

/* ---------------- 深改建模 · 烧杯（卷口 + 环面刻度 + 倒流嘴） ---------------- */

function makeBeaker(r = 0.055, h = 0.1, grad = true) {
  const g = new THREE.Group();
  const body = lathe([
    [0.004, 0], [r * 0.55, 0.002], [r * 0.92, 0.006], [r, 0.012],
    [r, h - 0.006], [r * 1.05, h - 0.002], [r * 1.09, h + 0.001], [r * 1.06, h + 0.004],
  ], glassMat(), 32);
  g.add(body);
  if (grad) {
    const strip = new THREE.Mesh(
      new THREE.CylinderGeometry(r + 0.0007, r + 0.0007, h * 0.62, 24, 1, true, -0.9, 1.8),
      stdMat({ map: beakerGradTexture(h > 0.09), roughness: 0.6, transparent: true, opacity: 0.85 })
    );
    strip.position.y = h * 0.44;
    g.add(strip);
  }
  /* 倒流嘴：口沿一侧的小翻边 */
  const spout = mesh(new THREE.SphereGeometry(r * 0.22, 10, 8, 0, TAU, 0, Math.PI / 2), glassMat());
  spout.scale.set(1.5, 0.5, 0.8);
  spout.position.set(r * 1.02, h + 0.002, 0);
  spout.rotation.z = -0.5;
  g.add(spout);
  return g;
}
function makeWater(r, h, color = 0x8ecbe2, op = 0.4) {
  return new THREE.Mesh(new THREE.CylinderGeometry(r - 0.004, r - 0.005, h, 24), liquidMat(color, op));
}

/* 小试管（圆底 + 卷口） */
function makeTube(len = 0.12, r = 0.02) {
  return lathe([
    [0, 0], [r * 0.45, 0], [r * 0.85, 0.003], [r * 0.98, 0.008],
    [r, 0.016], [r, len - 0.006], [r * 1.06, len - 0.002], [r * 1.1, len],
  ], glassMat(), 20);
}

/* ---------------- 深改建模 · 加热板（陶瓷顶板 + 发热线圈 + 旋钮 + 散热栅 + 铭牌） ---------------- */

const brandTex = brandPlateTexture();
function makeHotplate(w = 0.12, d = 0.12, withCable = false) {
  const g = new THREE.Group();
  const bodyMat = matStd(0x2e3238, { roughness: 0.5, metalness: 0.35, clearcoat: 0.3, clearcoatRoughness: 0.3 });
  const body = box(w, 0.022, d, bodyMat);
  body.position.y = 0.013;
  /* 微凸陶瓷顶板（联动红热） */
  const top = box(w - 0.012, 0.005, d - 0.012, stdMat({ color: 0x35261f, roughness: 0.42, metalness: 0.12, emissive: 0x000000 }));
  top.position.y = 0.0265;
  /* 发热线圈（顶板下的双圈，工作时透出红光） */
  const coilMat = stdMat({ color: 0x4a1c10, roughness: 0.5, emissive: 0x000000 });
  const coil = new THREE.Group();
  const r1 = new THREE.Mesh(new THREE.TorusGeometry(Math.min(w, d) * 0.3, 0.0021, 8, 28), coilMat);
  r1.rotation.x = Math.PI / 2;
  const r2 = new THREE.Mesh(new THREE.TorusGeometry(Math.min(w, d) * 0.18, 0.0021, 8, 24), coilMat);
  r2.rotation.x = Math.PI / 2;
  coil.add(r1, r2);
  coil.position.y = 0.0225;
  /* 正面散热栅（InstancedMesh 十条） */
  const vents = new THREE.InstancedMesh(
    new THREE.BoxGeometry(w * 0.052, 0.0032, 0.0022),
    stdMat({ color: 0x17191d, roughness: 0.85 }),
    10
  );
  const _m = new THREE.Matrix4();
  for (let i = 0; i < 10; i++) {
    _m.makeTranslation(-w * 0.23 + (i % 5) * w * 0.115, 0.008 + Math.floor(i / 5) * 0.007, d / 2 + 0.0008);
    vents.setMatrixAt(i, _m);
  }
  /* 功率旋钮（随滑杆同步旋转）+ 环刻度 */
  const knobG = new THREE.Group();
  const knobBase = new THREE.Mesh(new THREE.CylinderGeometry(0.0105, 0.0115, 0.005, 18), matStd(PAL.steel, { roughness: 0.4, metalness: 0.7 }));
  const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.0085, 0.0095, 0.006, 18), stdMat({ color: 0x22262c, roughness: 0.45, metalness: 0.55 }));
  knob.position.y = 0.005;
  const notch = box(0.0022, 0.0035, 0.0016, stdMat({ color: 0xe8b44a, roughness: 0.4 }));
  notch.position.set(0, 0.005, 0.0078);
  knobG.add(knobBase, knob, notch);
  knobG.rotation.x = Math.PI / 2;
  knobG.position.set(w * 0.28, 0.016, d / 2 + 0.004);
  /* 环形刻度贴片（旋钮周围的 min/max 白点） */
  for (const s of [-1, 1]) {
    const dot = mesh(new THREE.CircleGeometry(0.0013, 8), stdMat({ color: 0xdfe4ea, roughness: 0.5 }));
    dot.position.set(w * 0.28 + s * 0.016, 0.016, d / 2 + 0.0022);
    g.add(dot);
  }
  /* 橡胶脚垫 ×4 */
  const feet = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.005, 0.006, 0.004, 10),
    stdMat({ color: 0x1a1c20, roughness: 0.92 }),
    4
  );
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz], i) => {
    _m.makeTranslation(sx * (w / 2 - 0.008), 0.002, sz * (d / 2 - 0.008));
    feet.setMatrixAt(i, _m);
  });
  g.add(body, top, coil, vents, knobG, feet);
  /* 电源线（大板才带，省 draw call） */
  if (withCable) {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-w * 0.3, 0.006, -d / 2),
      new THREE.Vector3(-w * 0.34, 0.004, -d / 2 - 0.03),
      new THREE.Vector3(-w * 0.2, 0.002, -d / 2 - 0.08),
    ]);
    const cable = new THREE.Mesh(new THREE.TubeGeometry(curve, 12, 0.0022, 6), stdMat({ color: 0x23262b, roughness: 0.9 }));
    g.add(cable);
  }
  /* 铭牌 */
  const brand = mesh(new THREE.PlaneGeometry(w * 0.3, w * 0.11), stdMat({ map: brandTex, roughness: 0.5 }));
  brand.position.set(-w * 0.22, 0.016, d / 2 + 0.0012);
  g.add(brand);
  g.userData.setOn = (v, k = 1) => {
    top.material.emissive.setHex(v ? 0xd23c14 : 0x000000);
    top.material.emissiveIntensity = v ? 0.3 + k * 0.45 : 0;
    coilMat.emissive.setHex(v ? 0xe04010 : 0x000000);
    coilMat.emissiveIntensity = v ? 0.5 + k * 0.8 : 0;
  };
  g.userData.setKnob = (power) => {
    const frac = clamp((power - 0.5) / 1.5, 0, 1);
    knobG.rotation.z = (0.55 - frac) * 2.1;
  };
  return g;
}

/* ---------------- 深改建模 · 铁架台（车削底盘 + 滚花调节环） ---------------- */

function makeStandHold(rodH = 0.42, armLen = 0.13) {
  const g = new THREE.Group();
  /* 铸铁底盘：车削圆角收边 */
  const base = lathe([
    [0.02, 0], [0.075, 0], [0.09, 0.004], [0.1, 0.013], [0.098, 0.02], [0.06, 0.023], [0, 0.023],
  ], matStd(0x3a3f46, { roughness: 0.5, metalness: 0.7 }), 28);
  base.position.y = 0;
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, rodH, 12), metalMat);
  rod.position.y = rodH / 2 + 0.02;
  /* 滚花调节环（锯齿半径车削） */
  const knurlPts = [];
  for (let i = 0; i <= 14; i++) {
    knurlPts.push([0.0115 + (i % 2) * 0.0022, 0.02 + i * (0.02 / 14)]);
  }
  knurlPts.push([0, 0.042]);
  const collar = lathe(knurlPts, matStd(PAL.brass, { roughness: 0.38, metalness: 0.88 }), 18);
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, armLen, 10), metalMat);
  arm.rotation.x = Math.PI / 2;
  arm.position.set(0, rodH - 0.25, armLen / 2);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.012, 0.0022, 8, 20), metalMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.set(0, rodH - 0.25, armLen);
  g.add(base, rod, collar, arm, ring);
  g.userData.ringY = () => rodH - 0.25;
  return g;
}

/* 风扇：立杆 + 电机盒 + 护罩 + 双叶桨；spin 外部驱动 */
function makeFan() {
  const g = new THREE.Group();
  const pole = lathe([
    [0.006, 0], [0.016, 0.002], [0.018, 0.005], [0.005, 0.008], [0.0042, 0.14], [0.006, 0.145],
  ], metalMat, 14);
  const head = new THREE.Group();
  const motor = box(0.022, 0.022, 0.02, matStd(0x3c4048, { roughness: 0.5, metalness: 0.5 }));
  const guard = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.0018, 8, 24), metalMat);
  guard.rotation.y = Math.PI / 2;
  guard.position.x = 0.014;
  const spokes = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.0012, 0.056, 0.0012),
    metalMat,
    6
  );
  const _m = new THREE.Matrix4();
  const _q = new THREE.Quaternion();
  const _e = new THREE.Euler();
  for (let i = 0; i < 6; i++) {
    _e.set((i / 6) * Math.PI, 0, 0);
    _q.setFromEuler(_e);
    _m.compose(new THREE.Vector3(0.014, 0, 0), _q, new THREE.Vector3(1, 1, 1));
    spokes.setMatrixAt(i, _m);
  }
  const blades = new THREE.Group();
  for (let i = 0; i < 2; i++) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.0015, 0.05, 0.016), stdMat({ color: 0x9fb2c4, roughness: 0.4, metalness: 0.3 }));
    b.rotation.x = (i * Math.PI) / 2 + 0.35;
    blades.add(b);
  }
  blades.position.x = 0.012;
  head.add(motor, guard, spokes, blades);
  head.position.y = 0.145;
  g.add(pole, head);
  g.userData.blades = blades;
  return g;
}

/* 火柴：蜡粘点 + 木杆 + 红头（InstancedMesh 三件套，12 根火柴 3 个 draw call） */

const MAX_MATCH = 12;
const matchParts = [
  { geo: new THREE.SphereGeometry(0.0038, 8, 6), off: new THREE.Vector3(0, 0, 0), mat: () => stdMat({ color: 0xd9c27a, roughness: 0.6 }) },
  { geo: new THREE.CylinderGeometry(0.0011, 0.0011, 0.03, 6), off: new THREE.Vector3(0, -0.015, 0), mat: () => stdMat({ color: 0xd8c49e, roughness: 0.9 }) },
  { geo: new THREE.SphereGeometry(0.0034, 8, 6), off: new THREE.Vector3(0, -0.031, 0), mat: () => stdMat({ color: 0xb8362a, roughness: 0.55 }) },
];
const matchIMs = matchParts.map((p) => {
  const im = new THREE.InstancedMesh(p.geo, p.mat(), MAX_MATCH);
  im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  im.frustumCulled = false;
  im.visible = false;
  scene.add(im);
  return im;
});
const matchOffM = matchParts.map((p) => new THREE.Matrix4().makeTranslation(p.off.x, p.off.y, p.off.z));
const _mq = new THREE.Quaternion();
const _me = new THREE.Euler();
const _ms = new THREE.Vector3(1, 1, 1);
const _mm = new THREE.Matrix4();
function syncMatches(list) {
  matchParts.forEach((_, pi) => {
    const im = matchIMs[pi];
    list.forEach((m, i) => {
      _me.set(0, 0, m.rot);
      _mq.setFromEuler(_me);
      _mm.compose(new THREE.Vector3(m.x, m.y, m.z), _mq, _ms);
      _mm.multiply(matchOffM[pi]);
      im.setMatrixAt(i, _mm);
    });
    im.instanceMatrix.needsUpdate = true;
    im.visible = true;
  });
}
function hideMatches() { matchIMs.forEach((im) => { im.visible = false; }); }

/* 火焰精灵（双层 additive + 焰点点光） */
function makeFlame() {
  const g = new THREE.Group();
  const outer = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeGlowTexture('255,150,50', [[0, 'rgba(C,0.9)'], [0.4, 'rgba(C,0.4)'], [1, 'rgba(C,0)']]),
    blending: THREE.AdditiveBlending, transparent: true, depthWrite: false,
  }));
  outer.scale.set(0.045, 0.075, 1);
  const inner = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeGlowTexture('255,236,190', [[0, 'rgba(C,1)'], [0.5, 'rgba(C,0.55)'], [1, 'rgba(C,0)']]),
    blending: THREE.AdditiveBlending, transparent: true, depthWrite: false,
  }));
  inner.scale.set(0.02, 0.036, 1);
  inner.position.y = 0.004;
  g.add(outer, inner);
  g.userData.outer = outer;
  return g;
}

/* ---------------- 粒子池（气泡 / 碘蒸气 / 对流示踪 / 白气） ---------------- */

const _m4 = new THREE.Matrix4();
const _zero = new THREE.Matrix4().makeScale(0.0001, 0.0001, 0.0001);
const _q0 = new THREE.Quaternion();
const _s1 = new THREE.Vector3();

const MAX_BUB = 140;
const bubMesh = new THREE.InstancedMesh(
  new THREE.SphereGeometry(0.0035, 6, 5),
  new THREE.MeshPhysicalMaterial({ color: 0xdff2fa, transparent: true, opacity: 0.55, roughness: 0.1, metalness: 0 }),
  MAX_BUB
);
bubMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
bubMesh.frustumCulled = false;
scene.add(bubMesh);
const bubbles = Array.from({ length: MAX_BUB }, () => ({ on: false, p: new THREE.Vector3(), vy: 0, s: 1, g: 0, top: 1, wob: 0 }));
function spawnBubble(x, y, z, top, vy = 0.06, g = 0, s = 1) {
  const b = bubbles.find((q) => !q.on);
  if (!b) return;
  b.on = true;
  b.p.set(x + (Math.random() - 0.5) * 0.012, y, z + (Math.random() - 0.5) * 0.012);
  b.vy = vy * (0.75 + Math.random() * 0.5);
  b.s = s * (0.6 + Math.random() * 0.7);
  b.g = g;
  b.top = top;
  b.wob = Math.random() * TAU;
}

const MAX_VAP = 80;
const vapMesh = new THREE.InstancedMesh(
  new THREE.SphereGeometry(0.0042, 6, 5),
  new THREE.MeshBasicMaterial({ color: 0x9b4fc2, transparent: true, opacity: 0.38, depthWrite: false }),
  MAX_VAP
);
vapMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
vapMesh.frustumCulled = false;
scene.add(vapMesh);
const vapors = Array.from({ length: MAX_VAP }, () => ({ on: false, p: new THREE.Vector3(), d: new THREE.Vector3(), v: 0.05, t: 0, life: 1.5, s: 1 }));
function spawnVapor(x, y, z, dir, v = 0.05, life = 1.6) {
  const p = vapors.find((q) => !q.on);
  if (!p) return;
  p.on = true;
  p.p.set(x, y, z);
  p.d.copy(dir);
  p.v = v * (0.7 + Math.random() * 0.6);
  p.t = 0;
  p.life = life * (0.8 + Math.random() * 0.4);
  p.s = 0.7 + Math.random() * 0.8;
}

const MAX_TR = 140;
const trMesh = new THREE.InstancedMesh(
  new THREE.SphereGeometry(0.0028, 6, 5),
  new THREE.MeshBasicMaterial({ color: 0x8b2fa8, transparent: true, opacity: 0.85 }),
  MAX_TR
);
trMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
trMesh.frustumCulled = false;
scene.add(trMesh);
const tracers = Array.from({ length: MAX_TR }, () => ({ on: false, s: 0, sp: 0.14, jx: 0, jz: 0 }));
let convCurve = null; // 当前对流环路（热对流章激活）
function spawnTracer() {
  const p = tracers.find((q) => !q.on);
  if (!p) return;
  p.on = true;
  p.s = Math.random() * 0.15;
  p.sp = 0.12 + Math.random() * 0.1;
  p.jx = (Math.random() - 0.5) * 0.008;
  p.jz = (Math.random() - 0.5) * 0.008;
}

/* 白气团（液化演示 / 沸腾蒸汽） */
const puffs = [];
for (let i = 0; i < 8; i++) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(0.013, 8, 6), new THREE.MeshBasicMaterial({
    color: 0xdfe3e8, transparent: true, opacity: 0.5, depthWrite: false,
  }));
  m.visible = false;
  scene.add(m);
  puffs.push({ mesh: m, t: -1 });
}
function puffAt(x, y, z, rise = 0.03) {
  const p = puffs.find((q) => q.t < 0);
  if (!p) return;
  p.t = 0;
  p.rise = rise;
  p.mesh.visible = true;
  p.mesh.position.set(x, y, z);
}

function resetParticles() {
  bubbles.forEach((b) => { b.on = false; });
  vapors.forEach((v) => { v.on = false; });
  tracers.forEach((t) => { t.on = false; });
  convCurve = null;
  puffs.forEach((p) => { p.t = -1; p.mesh.visible = false; });
}

function updateParticles(dt, time) {
  bubbles.forEach((b, i) => {
    if (b.on) {
      b.p.y += b.vy * dt;
      b.p.x += Math.sin(time * 6 + b.wob) * 0.0006;
      b.s += b.g * dt;
      if (b.p.y >= b.top || b.s < 0.1 || b.s > 3.2) b.on = false;
      _s1.setScalar(Math.max(b.s, 0.1));
      _m4.compose(b.p, _q0, _s1);
    } else _m4.copy(_zero);
    bubMesh.setMatrixAt(i, _m4);
  });
  bubMesh.instanceMatrix.needsUpdate = true;

  vapors.forEach((v, i) => {
    if (v.on) {
      v.t += dt;
      const k = v.t / v.life;
      if (k >= 1) v.on = false;
      else {
        v.p.addScaledVector(v.d, v.v * dt);
        v.p.x += Math.sin(time * 5 + i) * 0.0007;
        const sc = v.s * (k < 0.25 ? k / 0.25 : Math.max(0.05, 1.2 * (1 - k)));
        _s1.setScalar(sc);
        _m4.compose(v.p, _q0, _s1);
      }
    }
    if (!v.on) _m4.copy(_zero);
    vapMesh.setMatrixAt(i, _m4);
  });
  vapMesh.instanceMatrix.needsUpdate = true;

  tracers.forEach((p, i) => {
    if (p.on && convCurve) {
      p.s += p.sp * dt;
      if (p.s >= 1) p.on = false;
      else {
        const pt = convCurve.getPointAt(p.s % 1);
        _s1.setScalar(1);
        _m4.compose(new THREE.Vector3(pt.x + p.jx, pt.y, pt.z + p.jz), _q0, _s1);
      }
    }
    if (!p.on) _m4.copy(_zero);
    trMesh.setMatrixAt(i, _m4);
  });
  trMesh.instanceMatrix.needsUpdate = true;

  puffs.forEach((p) => {
    if (p.t >= 0) {
      p.t += dt;
      p.mesh.position.y += dt * (p.rise || 0.03);
      p.mesh.material.opacity = Math.max(0, 0.5 * (1 - p.t / 1.4));
      if (p.t > 1.4) { p.t = -1; p.mesh.visible = false; }
    }
  });
}

/* ---------------- 主题色（2D 画布用） ---------------- */

let palCache = null;
function pal() {
  if (palCache) return palCache;
  const cs = getComputedStyle(document.documentElement);
  const g = (n, fb) => (cs.getPropertyValue(n) || fb).trim();
  palCache = {
    text: g('--text', '#2a3441'), dim: g('--text-dim', '#66717e'),
    accent: g('--accent', '#e8674a'), chip: g('--chip-bg', 'rgba(20,32,44,0.05)'),
    border: g('--card-border', 'rgba(20,32,44,0.09)'), card: g('--card', '#ffffff'),
  };
  return palCache;
}
window.addEventListener('edulabtheme', () => { palCache = null; });

function drawChart(win) {
  const cv = win.cv;
  const W = cv.clientWidth, H = 150;
  if (!W) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  if (cv.width !== Math.round(W * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
  const ctx = cv.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);
  const P = pal();
  const c = win.cfg;
  const L = 32, R = 10, T = 16, B = 18;
  const X = (t) => L + (t / c.xMax) * (W - L - R);
  const Y = (v) => T + (1 - (v - c.yMin) / (c.yMax - c.yMin)) * (H - T - B);
  (c.bands || []).forEach((bd) => {
    ctx.fillStyle = bd.c;
    ctx.fillRect(X(bd.t0), T, X(bd.t1) - X(bd.t0), H - T - B);
    if (c.ann && bd.label) {
      ctx.fillStyle = P.dim; ctx.font = '10px -apple-system, "PingFang SC", sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(bd.label, (X(bd.t0) + X(bd.t1)) / 2, T + 11);
    }
  });
  ctx.font = '10px -apple-system, "PingFang SC", sans-serif';
  ctx.textAlign = 'right';
  for (let v = c.yMin; v <= c.yMax + 0.001; v += c.yStep) {
    const y = Y(v);
    ctx.strokeStyle = P.border;
    ctx.beginPath(); ctx.moveTo(L, y); ctx.lineTo(W - R, y); ctx.stroke();
    ctx.fillStyle = P.dim;
    ctx.fillText(String(Math.round(v)), L - 4, y + 3);
  }
  ctx.textAlign = 'center';
  for (let t = 0; t <= c.xMax + 0.001; t += c.xStep) {
    const x = X(t);
    ctx.fillStyle = P.dim;
    ctx.fillText(t + 's', x, H - 5);
  }
  ctx.strokeStyle = P.border;
  ctx.strokeRect(L, T, W - L - R, H - T - B);
  (c.annLines || []).forEach((a) => {
    if (!c.ann) return;
    const y = Y(a.y);
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = a.c || P.accent;
    ctx.beginPath(); ctx.moveTo(L, y); ctx.lineTo(W - R, y); ctx.stroke();
    ctx.restore();
    if (a.label) {
      ctx.fillStyle = a.c || P.accent; ctx.textAlign = 'right';
      ctx.fillText(a.label, W - R - 2, y - 3);
    }
  });
  c.series.forEach((s) => {
    if (s.pts.length < 2) return;
    ctx.globalAlpha = s.dim ? 0.28 : 1;
    ctx.strokeStyle = s.color;
    ctx.lineWidth = 1.7;
    ctx.beginPath();
    s.pts.forEach((p, i) => { const px = X(p[0]), py = Y(p[1]); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); });
    ctx.stroke();
    ctx.globalAlpha = 1;
  });
  let lx = L + 6;
  ctx.textAlign = 'left';
  c.series.forEach((s) => {
    ctx.fillStyle = s.color;
    ctx.fillRect(lx, 4, 10, 3);
    ctx.fillStyle = P.dim;
    ctx.fillText(s.label, lx + 13, 9);
    lx += 13 + ctx.measureText(s.label).width + 12;
  });
}

/* ---------------- 第二章：2D 摄氏温标图（可拖拽平移 + 滚轮缩放 + 冰水/沸水标定动画） ---------------- */

const cv2 = document.createElement('canvas');
cv2.className = 'heat-cv2';
stage.appendChild(cv2);
const c2 = { T: 25, target: null, conv: true, ann: true, zoom: 1, panX: 0, panY: 0, drag: null };
cv2.addEventListener('pointerdown', (e) => {
  c2.drag = { x: e.clientX, y: e.clientY, px: c2.panX, py: c2.panY };
  cv2.setPointerCapture(e.pointerId);
});
cv2.addEventListener('pointermove', (e) => {
  if (!c2.drag) return;
  c2.panX = c2.drag.px + (e.clientX - c2.drag.x);
  c2.panY = c2.drag.py + (e.clientY - c2.drag.y);
});
cv2.addEventListener('pointerup', () => { c2.drag = null; });
cv2.addEventListener('wheel', (e) => {
  e.preventDefault();
  const z0 = c2.zoom;
  c2.zoom = clamp(z0 * Math.exp(-e.deltaY * 0.0012), 0.5, 3);
  c2.panY = c2.panY * (c2.zoom / z0); // 围绕画布中心缩放
}, { passive: false });

function draw2d() {
  const W = cv2.clientWidth, H = cv2.clientHeight;
  if (!W || !H) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  if (cv2.width !== Math.round(W * dpr)) { cv2.width = Math.round(W * dpr); cv2.height = Math.round(H * dpr); }
  const ctx = cv2.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const P = pal();
  ctx.fillStyle = P.card;
  ctx.fillRect(0, 0, W, H);

  const cx = W * 0.38 + c2.panX;
  const cy = H * 0.56 + c2.panY;
  const ppc = (H * 0.62 / 100) * c2.zoom;
  const yOf = (t) => cy - (t - 45) * ppc;
  const font = (w, s) => `${w} ${s}px -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif`;

  // 玻璃管
  const yTop = yOf(112), yBot = yOf(-24);
  ctx.fillStyle = 'rgba(140,185,215,0.10)';
  ctx.strokeStyle = P.dim;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(cx - 13, yTop, 26, yBot - yTop, 10);
  ctx.fill(); ctx.stroke();
  // 玻璃泡 + 液柱
  const yBulb = yOf(-20);
  const yCol = yOf(c2.T);
  ctx.fillStyle = '#e0392e';
  ctx.beginPath();
  ctx.roundRect(cx - 4.5, yCol, 9, Math.max(6, yBulb - yCol), 4);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, yBulb, 24, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = P.dim;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, yBulb, 24, 0, TAU);
  ctx.stroke();
  // 刻度：每 1℃ 小格、每 10℃ 标数（0 与 100 强调）
  ctx.textAlign = 'right';
  for (let t = -20; t <= 110; t++) {
    const y = yOf(t);
    if (y < 8 || y > H - 8) continue;
    const maj = t % 10 === 0, mid = t % 5 === 0;
    const len = maj ? 14 : mid ? 9 : 5;
    ctx.strokeStyle = maj ? P.text : mid ? P.dim : P.border;
    ctx.lineWidth = maj ? 1.6 : 1;
    ctx.beginPath();
    ctx.moveTo(cx - 13, y); ctx.lineTo(cx - 13 - len, y);
    ctx.stroke();
    if (maj) {
      const key = t === 0 || t === 100;
      ctx.fillStyle = key ? P.accent : P.dim;
      ctx.font = font(key ? '700' : '500', 11.5);
      ctx.fillText(String(t), cx - 30, y + 4);
    }
  }
  ctx.fillStyle = P.dim;
  ctx.font = font('600', 13);
  ctx.textAlign = 'center';
  ctx.fillText('℃', cx, yTop - 10);

  // 0℃ / 100℃ 标定虚线
  const bx = W * 0.74 + c2.panX * 0.4;
  ctx.save();
  ctx.setLineDash([5, 5]);
  [[0], [100]].forEach(([t]) => {
    ctx.strokeStyle = P.accent;
    ctx.globalAlpha = 0.55;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(cx + 16, yOf(t)); ctx.lineTo(bx - 60, yOf(t));
    ctx.stroke();
  });
  ctx.restore();

  // 100 等分标注
  if (c2.ann) {
    const ax = cx + 34;
    const y0 = yOf(0), y100 = yOf(100);
    ctx.strokeStyle = P.dim;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(ax, y0); ctx.lineTo(ax, y100);
    ctx.stroke();
    [[y100, 1], [y0, -1]].forEach(([y, d]) => {
      ctx.beginPath();
      ctx.moveTo(ax, y); ctx.lineTo(ax - 4, y + 6 * d); ctx.lineTo(ax + 4, y + 6 * d);
      ctx.closePath();
      ctx.fillStyle = P.dim;
      ctx.fill();
    });
    ctx.save();
    ctx.fillStyle = P.text;
    ctx.font = font('600', 12.5);
    ctx.textAlign = 'left';
    ctx.fillText('0℃ 到 100℃ 分成 100 等份', ax + 8, (y0 + y100) / 2 - 8);
    ctx.fillStyle = P.dim;
    ctx.font = font('500', 11.5);
    ctx.fillText('每一等份就是 1 ℃', ax + 8, (y0 + y100) / 2 + 10);
    ctx.restore();
  }

  // 冰水混合物碗（0℃ 标定）
  const y0 = yOf(0);
  ctx.strokeStyle = P.dim;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(bx, y0 + 6, 52, 20, 0, 0, Math.PI);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(bx - 52, y0 + 6); ctx.lineTo(bx + 52, y0 + 6);
  ctx.stroke();
  ctx.fillStyle = '#bfe0f2';
  ctx.strokeStyle = '#8fc2e0';
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i++) {
    const ix = bx - 36 + i * 17 + (i % 2) * 4;
    const iy = y0 - 2 - (i % 3) * 4;
    ctx.save();
    ctx.translate(ix, iy);
    ctx.rotate((i - 2) * 0.4);
    ctx.beginPath();
    ctx.roundRect(-8, -6, 16, 12, 3);
    ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  if (c2.ann) {
    ctx.fillStyle = P.text;
    ctx.font = font('600', 12.5);
    ctx.textAlign = 'center';
    ctx.fillText('冰水混合物 0℃', bx, y0 + 40);
  }

  // 沸水瓶（100℃ 标定）
  const y100 = yOf(100);
  ctx.strokeStyle = P.dim;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(bx - 7, y100 - 46);
  ctx.lineTo(bx - 7, y100 - 30);
  ctx.lineTo(bx - 34, y100);
  ctx.lineTo(bx + 34, y100);
  ctx.lineTo(bx + 7, y100 - 30);
  ctx.lineTo(bx + 7, y100 - 46);
  ctx.stroke();
  ctx.fillStyle = 'rgba(140,190,220,0.35)';
  ctx.beginPath();
  ctx.moveTo(bx - 27, y100 - 9);
  ctx.lineTo(bx + 27, y100 - 9);
  ctx.lineTo(bx + 34, y100);
  ctx.lineTo(bx - 34, y100);
  ctx.closePath();
  ctx.fill();
  // 蒸汽
  ctx.strokeStyle = P.dim;
  ctx.globalAlpha = 0.6;
  ctx.lineWidth = 1.4;
  for (const dx of [-10, 8]) {
    ctx.beginPath();
    ctx.moveTo(bx + dx, y100 - 52);
    ctx.bezierCurveTo(bx + dx + 6, y100 - 60, bx + dx - 6, y100 - 68, bx + dx, y100 - 76);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  if (c2.ann) {
    ctx.fillStyle = P.text;
    ctx.font = font('600', 12.5);
    ctx.textAlign = 'center';
    ctx.fillText('沸水 100℃', bx, y100 + 22);
  }

  // 游标
  const yT = yOf(c2.T);
  ctx.strokeStyle = P.accent;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx + 16, yT); ctx.lineTo(cx + 30, yT);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx + 34, yT, 3.5, 0, TAU);
  ctx.fillStyle = P.accent;
  ctx.fill();
  ctx.textAlign = 'left';
  ctx.fillStyle = P.text;
  ctx.font = font('700', 15);
  ctx.fillText(`${Math.round(c2.T)} ℃`, cx + 44, yT + 5);

  // 顶部读数与换算
  ctx.font = font('700', 16);
  ctx.fillText(`游标温度：${Math.round(c2.T)} ℃`, 16, 30);
  if (c2.conv) {
    const F = c2.T * 9 / 5 + 32;
    const K = c2.T + 273.15;
    ctx.fillStyle = P.chip;
    ctx.strokeStyle = P.border;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(W - 226, 14, 210, 60, 10);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = P.text;
    ctx.font = font('500', 12.5);
    ctx.fillText(`℉ = ℃×9/5 + 32 = ${F.toFixed(1)} ℉`, W - 212, 38);
    ctx.fillText(`K = ℃ + 273.15 = ${K.toFixed(1)} K`, W - 212, 60);
  }
  ctx.fillStyle = P.dim;
  ctx.font = font('500', 11.5);
  ctx.textAlign = 'left';
  ctx.fillText('拖拽平移 · 滚轮缩放 · 滑杆移动游标', 16, H - 12);
}

/* ---------------- 数据读数（右栏数据坞，按章换行集） ---------------- */

let hud = null;
const hudWrap = document.getElementById('lcData');
function setHUD(rows) {
  if (hud) { hud.el.remove(); hud = null; }
  if (rows && rows.length) {
    hud = makeHUD(hudWrap, rows);
    rows.forEach(([k]) => hud.set(k, '–'));
  }
}
function hset(key, text) { if (hud) hud.set(key, text); }

/* ---------------- 温度曲线浮窗（可折叠为 40px 圆形徽标，偏好全窗共享） ---------------- */

const CHART_FOLD_KEY = 'heat.foldChart';
const NARROW0 = window.innerWidth <= 1100;
let chartFolded = false;
try {
  const s = localStorage.getItem(CHART_FOLD_KEY);
  chartFolded = s !== null ? s === '1' : NARROW0;   /* 首访：窄屏默认折叠 */
} catch (e) { /* 忽略 */ }
function saveChartFold() { try { localStorage.setItem(CHART_FOLD_KEY, chartFolded ? '1' : '0'); } catch (e) { /* 忽略 */ } }

function makeCurveWin(title, cfg, badgeText) {
  const el = document.createElement('div');
  el.className = 'heat-chart';
  el.style.display = 'none';
  el.innerHTML = `
    <div class="cw-head"><b></b><span class="cw-info"></span>
      <button class="cw-fold" type="button" aria-label="收起曲线窗" title="收起曲线窗">−</button></div>
    <canvas></canvas>
    <button class="cw-badge" type="button" aria-label="展开曲线窗" title="展开曲线窗"></button>`;
  el.querySelector('.cw-head b').textContent = title;
  el.querySelector('.cw-badge').textContent = badgeText;
  const cv = el.querySelector('canvas');
  const info = el.querySelector('.cw-info');
  const apply = () => {
    el.classList.toggle('folded', chartFolded);
    el.querySelector('.cw-fold').setAttribute('aria-expanded', String(!chartFolded));
  };
  el.querySelector('.cw-fold').addEventListener('click', () => { chartFolded = true; saveChartFold(); apply(); });
  el.querySelector('.cw-badge').addEventListener('click', () => { chartFolded = false; saveChartFold(); apply(); });
  apply();
  stage.appendChild(el);
  return { el, cv, info, cfg, show(v) { el.style.display = v ? '' : 'none'; } };
}

const winMelt = makeCurveWin('熔化曲线 · 温度-时间', {
  xMax: 300, xStep: 60, yMin: 0, yMax: 80, yStep: 20, ann: true,
  annLines: [{ y: 48, label: '熔点 48℃ —— 晶体熔化吸热温度不变' }],
  series: [
    { label: '海波（晶体）', color: '#d98a2b', pts: [] },
    { label: '石蜡（非晶体）', color: '#5f9dd8', pts: [] },
  ],
}, '熔化');
const winBoil = makeCurveWin('沸腾曲线 · 温度-时间', {
  xMax: 240, xStep: 60, yMin: 20, yMax: 130, yStep: 20, ann: true, annLines: [],
  series: [{ label: '水温', color: '#3f8fd2', pts: [] }],
}, '沸腾');
const winCp = makeCurveWin('升温曲线 · 相同加热条件', {
  xMax: 240, xStep: 60, yMin: 0, yMax: 110, yStep: 20, ann: true, annLines: [{ y: 100, label: '水沸腾 100℃' }],
  series: [
    { label: '水', color: '#3f8fd2', pts: [] },
    { label: '食用油', color: '#d98a2b', pts: [] },
  ],
}, '升温');
const winRad = makeCurveWin('辐射加热 · 温度-时间', {
  xMax: 240, xStep: 60, yMin: 20, yMax: 100, yStep: 20, ann: false, annLines: [],
  series: [
    { label: '黑罐', color: '#444a52', pts: [] },
    { label: '白罐', color: '#c9ccd2', pts: [] },
  ],
}, '辐射');
const winStory = makeCurveWin('从冰到沸腾 · 完整曲线', {
  xMax: 160, xStep: 20, yMin: -30, yMax: 120, yStep: 20, ann: true,
  annLines: [
    { y: 0, label: '熔化平台：吸热温度不变' },
    { y: 100, label: '沸腾平台：吸热温度不变' },
  ],
  bands: [
    { t0: 0, t1: 44, c: 'rgba(110,160,215,0.14)', label: '固态 → 熔化' },
    { t0: 44, t1: 160, c: 'rgba(110,195,150,0.13)', label: '液态 → 沸腾' },
  ],
  series: [{ label: '温度', color: '#e8674a', pts: [] }],
}, '全程');
const WINS = [winMelt, winBoil, winCp, winRad, winStory];
function hideWins() { WINS.forEach((w) => w.show(false)); }

/* ---------------- 章节 1 · 温度计的使用 ---------------- */

const stT = { group: new THREE.Group(), T: 25, place: 'ok', view: 'level' };
scene.add(stT.group);
function buildStT() {
  const g = stT.group, SX = -1.7;
  const hp = makeHotplate(0.13, 0.13);
  hp.position.set(SX, BENCH_Y, 0.02);
  const beaker = makeBeaker(0.055, 0.1, false);
  beaker.position.set(SX, BENCH_Y + 0.022, 0.02);
  const water = makeWater(0.052, 0.072);
  water.position.set(SX, BENCH_Y + 0.064, 0.02);
  const stand = makeStandHold(0.42, 0.18);
  stand.position.set(SX, BENCH_Y, -0.16);
  const th = makeThermometer(0.17);
  th.position.set(SX, BENCH_Y + 0.06, 0.02);
  const lbl = label('水', '#9fd4e8');
  lbl.position.set(SX - 0.1, BENCH_Y + 0.15, 0.02);
  g.add(hp, beaker, water, stand, th, lbl);
  stT.hp = hp; stT.water = water; stT.th = th; stT.lbl = lbl;
  bakeContactShadow(SX, 0.02, 0.24, 0.2, 0.3);
  bakeContactShadow(SX, -0.16, 0.26, 0.24, 0.26);
}
const PLACE_OK = new THREE.Vector3(0, BENCH_Y + 0.06, 0.02);
const PLACE_ERR = { bottom: '玻璃泡碰到容器底：容器底直接受热，温度比水温高，示数偏大约 +8℃（正确做法：悬浮在水中，不碰底不碰壁）', wall: '玻璃泡碰到容器壁：壁温受外界影响，示数偏大约 +5℃（正确做法：让玻璃泡完全浸没在水中）', ok: '✓ 玻璃泡完全浸没、不碰底不碰壁' };
const VIEW_ERR = {
  level: '✓ 视线与液柱上表面相平，读数准确（口诀：俯大仰小）',
  down: '俯视读数偏大——视线斜向下，看到的刻度比实际液面高约 +2℃（口诀：俯大仰小）',
  up: '仰视读数偏小——视线斜向上，看到的刻度比实际液面低约 -2℃（口诀：俯大仰小）',
};

/* ---------------- 章节 3 · 熔化和凝固 ---------------- */

const stMelt = { group: new THREE.Group(), Tb: 20, Ts: 20, Tw: 20, melt: 0, power: 1, playing: false, t: 0, rec: 0, sel: 's' };
scene.add(stMelt.group);
function buildStMelt() {
  const g = stMelt.group, SX = -1.05;
  const hp = makeHotplate(0.17, 0.14, true);
  hp.position.set(SX, BENCH_Y, 0.02);
  const beaker = makeBeaker(0.075, 0.12);
  beaker.position.set(SX, BENCH_Y + 0.022, 0.02);
  const water = makeWater(0.072, 0.085, 0x9fd2e6, 0.38);
  water.position.set(SX, BENCH_Y + 0.0705, 0.02);
  const lid = box(0.19, 0.004, 0.11, stdMat({ color: 0xf0f2f4, roughness: 0.6 }));
  lid.position.set(SX, BENCH_Y + 0.146, 0.02);
  const t1 = makeTube(0.12, 0.02); t1.position.set(SX - 0.032, BENCH_Y + 0.048, 0.02);
  const t2 = makeTube(0.12, 0.02); t2.position.set(SX + 0.032, BENCH_Y + 0.048, 0.02);
  const f1 = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.045, 14), stdMat({ color: 0xd9cba0, roughness: 0.85 }));
  f1.position.set(SX - 0.032, BENCH_Y + 0.072, 0.02);
  const f2 = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.045, 14), liquidMat(0xf2eee2, 0.7));
  f2.position.set(SX + 0.032, BENCH_Y + 0.072, 0.02);
  /* 搅拌棒（水浴法细节：受热均匀）——细玻棒 + 底环，播放时轻摆 */
  function stir(x, ph) {
    const sg = new THREE.Group();
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.0012, 0.0012, 0.1, 6), glassMat(0.4, 0xdfe8ee));
    rod.position.y = -0.05;
    const loop = new THREE.Mesh(new THREE.TorusGeometry(0.006, 0.0011, 6, 14), glassMat(0.4, 0xdfe8ee));
    loop.rotation.x = Math.PI / 2;
    loop.position.y = -0.095;
    sg.add(rod, loop);
    sg.position.set(x, BENCH_Y + 0.175, 0.026);
    sg.userData.ph = ph;
    return sg;
  }
  const s1 = stir(SX - 0.02, 0), s2 = stir(SX + 0.045, 2.1);
  const l1 = label('海波（晶体）', '#e8c37d');
  l1.position.set(SX - 0.04, BENCH_Y + 0.21, 0.02);
  const l2 = label('石蜡（非晶体）', '#a9d3ee');
  l2.position.set(SX + 0.05, BENCH_Y + 0.24, 0.02);
  g.add(hp, beaker, water, lid, t1, t2, f1, f2, s1, s2, l1, l2);
  stMelt.hp = hp; stMelt.f1 = f1; stMelt.f2 = f2; stMelt.s1 = s1; stMelt.s2 = s2;
  bakeContactShadow(SX, 0.02, 0.3, 0.22, 0.32);
}

/* ---------------- 章节 4 · 水的沸腾 ---------------- */

const stBoil = { group: new THREE.Group(), P: 1, Tb: 100, T: 20, power: 1, playing: false, t: 0, rec: 0, boil: false, boilToast: false };
scene.add(stBoil.group);
function bpAt(p) { // 沸点-气压经验插值：0.5→81 / 1.0→100 / 1.5→112 / 2.0→120 ℃
  const pts = [[0.5, 81], [1.0, 100], [1.5, 112], [2.0, 120]];
  if (p <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) {
    if (p <= pts[i][0]) {
      const [p0, t0] = pts[i - 1], [p1, t1] = pts[i];
      return t0 + ((p - p0) / (p1 - p0)) * (t1 - t0);
    }
  }
  return pts[pts.length - 1][1];
}
const gaugeTex = gaugeTexture();
function buildStBoil() {
  const g = stBoil.group, SX = -0.45;
  const hp = makeHotplate(0.13, 0.13, true);
  hp.position.set(SX, BENCH_Y, 0.02);
  const beaker = makeBeaker(0.055, 0.1);
  beaker.position.set(SX, BENCH_Y + 0.022, 0.02);
  const water = makeWater(0.052, 0.07);
  water.position.set(SX, BENCH_Y + 0.063, 0.02);
  const stand = makeStandHold(0.42, 0.18);
  stand.position.set(SX, BENCH_Y, -0.16);
  const th = makeThermometer(0.17);
  th.position.set(SX + 0.02, BENCH_Y + 0.06, 0.02);
  /* 气压表：立杆 + 表盘（指针随气压滑杆摆动） */
  const gg = new THREE.Group();
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.0025, 0.003, 0.09, 8), metalMat);
  post.position.y = 0.045;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.02, 0.0022, 8, 22), matStd(PAL.brass, { roughness: 0.35, metalness: 0.85 }));
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.0195, 24), stdMat({ map: gaugeTex, roughness: 0.6 }));
  face.position.z = 0.001;
  const needleG = new THREE.Group();
  const needle = box(0.0016, 0.016, 0.0008, stdMat({ color: 0xc23a28, roughness: 0.4 }));
  needle.position.y = 0.007;
  needleG.add(needle);
  needleG.position.z = 0.003;
  gg.add(post, rim, face, needleG);
  gg.position.set(SX + 0.095, BENCH_Y + 0.022, 0.06);
  const lbl = label('气压表', '#cfd8e0');
  lbl.position.set(SX + 0.095, BENCH_Y + 0.2, 0.06);
  g.add(hp, beaker, water, stand, th, gg, lbl);
  stBoil.hp = hp; stBoil.water = water; stBoil.th = th; stBoil.needleG = needleG;
  bakeContactShadow(SX, 0.02, 0.26, 0.2, 0.3);
  bakeContactShadow(SX + 0.095, 0.06, 0.08, 0.08, 0.24);
}

/* ---------------- 章节 5 · 蒸发和液化 ---------------- */

const stEvap = { group: new THREE.Group(), fan: false, fspeed: 0, amb: 25, alcohol: 1, Tw: 25, mistT: 0, plateT: 5 };
scene.add(stEvap.group);
function buildStEvap() {
  const g = stEvap.group, SX = 0.2;
  const panel = box(0.22, 0.26, 0.012, stdMat({ color: 0xeef1f4, roughness: 0.7 }));
  panel.position.set(SX, BENCH_Y + 0.13, -0.035);
  const wet = makeThermometer(0.15);
  wet.position.set(SX - 0.03, BENCH_Y + 0.141, 0);
  const dry = makeThermometer(0.15);
  dry.position.set(SX + 0.05, BENCH_Y + 0.141, 0);
  const cotton = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.012, 0.02, 10), stdMat({ color: 0xf5f3ec, roughness: 1 }));
  cotton.position.set(SX - 0.03, BENCH_Y + 0.145, 0);
  const fan = makeFan();
  fan.position.set(SX - 0.13, BENCH_Y, 0);
  // 酒精瓶
  const bottle = lathe([
    [0, 0.002], [0.014, 0.003], [0.024, 0.008], [0.025, 0.014],
    [0.025, 0.05], [0.01, 0.056], [0.01, 0.07], [0.013, 0.074],
  ], glassMat(0.3, 0xd8e4da));
  bottle.position.set(SX + 0.1, BENCH_Y, 0.05);
  const alc = new THREE.Mesh(new THREE.CylinderGeometry(0.021, 0.023, 0.032, 16), liquidMat(0xd9e9f2, 0.45));
  alc.position.set(SX + 0.1, BENCH_Y + 0.022, 0.05);
  // 白气演示：水杯 + 上方冷玻璃片（水蒸气遇冷液化；玻璃片温度可读）
  const cup = makeBeaker(0.03, 0.05, false);
  cup.position.set(SX + 0.16, BENCH_Y + 0.001, 0.03);
  const hotW = makeWater(0.027, 0.032, 0xa9d4e6, 0.4);
  hotW.position.set(SX + 0.16, BENCH_Y + 0.026, 0.03);
  const post1 = new THREE.Mesh(new THREE.CylinderGeometry(0.002, 0.002, 0.115, 8), metalMat);
  post1.position.set(SX + 0.135, BENCH_Y + 0.0575, 0.03);
  const post2 = post1.clone(); post2.position.x = SX + 0.185;
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.004, 20), stdMat({ color: 0xcfdde6, roughness: 0.15, metalness: 0.4 }));
  plate.position.set(SX + 0.16, BENCH_Y + 0.116, 0.03);
  g.add(panel, wet, dry, cotton, fan, bottle, alc, cup, hotW, post1, post2, plate);
  stEvap.fan = fan; stEvap.cotton = cotton; stEvap.thW = wet; stEvap.thD = dry; stEvap.plate = plate;
  bakeContactShadow(SX - 0.13, 0, 0.1, 0.1, 0.22);
  bakeContactShadow(SX + 0.16, 0.03, 0.12, 0.1, 0.26);
}

/* ---------------- 章节 6 · 升华和凝华（碘锤：水浴 vs 直接加热） ---------------- */

const stSub = { group: new THREE.Group(), on: false, mode: 'bath', Tb6: 25, cold: 5, speckAcc: 0, vapAcc: 0, meltF: 0, meltToast: false };
scene.add(stSub.group);
function buildStSub() {
  const g = stSub.group, SX = 0.85;
  const stand = makeStandHold(0.38, 0.19);
  stand.position.set(SX - 0.18, BENCH_Y, -0.05);
  stand.rotation.y = 1.29;
  const tubeG = new THREE.Group();
  tubeG.position.set(SX, 1.02, 0);
  tubeG.rotation.z = 0.35;
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.16, 20), glassMat(0.2));
  const capB = new THREE.Mesh(new THREE.SphereGeometry(0.02, 16, 12), glassMat(0.2));
  capB.position.y = -0.08;
  const capT = capB.clone(); capT.position.y = 0.08;
  const solid = new THREE.Mesh(new THREE.IcosahedronGeometry(0.013, 0), stdMat({ color: 0x3a1250, roughness: 0.35, metalness: 0.15 }));
  solid.position.y = -0.06;
  /* 碘熔化的液池（直接加热过熔点时出现） */
  const liquid = new THREE.Mesh(new THREE.SphereGeometry(0.0145, 14, 10), liquidMat(0x4a1663, 0.75));
  liquid.scale.set(1, 0.3, 1);
  liquid.position.y = -0.068;
  liquid.visible = false;
  /* 凝华晶体（InstancedMesh 24 粒） */
  const specks = new THREE.InstancedMesh(
    new THREE.TetrahedronGeometry(0.0026, 0),
    stdMat({ color: 0x2d0d40, roughness: 0.4 }),
    24
  );
  const _sm = new THREE.Matrix4();
  const _sq = new THREE.Quaternion();
  const _se = new THREE.Euler();
  for (let i = 0; i < 24; i++) {
    const a = (i * 2.399) % TAU;
    _se.set(i * 0.7 % 3, i * 1.3 % 3, 0);
    _sq.setFromEuler(_se);
    _sm.compose(new THREE.Vector3(Math.cos(a) * 0.0145, 0.02 + (i % 8) * 0.0064, Math.sin(a) * 0.0145), _sq, new THREE.Vector3(1, 1, 1));
    specks.setMatrixAt(i, _sm);
  }
  tubeG.add(body, capB, capT, solid, liquid, specks);
  /* 热源两套：水浴烧杯 / 直接火焰 + 石棉网 */
  const bath = new THREE.Group();
  const bBeaker = makeBeaker(0.036, 0.06, false);
  const bWater = makeWater(0.033, 0.042, 0xa9c8de, 0.42);
  bWater.position.y = 0.026;
  bath.add(bBeaker, bWater);
  bath.position.set(SX, BENCH_Y + 0.0075, 0);
  const flame = makeFlame();
  flame.position.set(SX, BENCH_Y + 0.042, 0);
  const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.03, 0.003, 18), matStd(PAL.steel, { roughness: 0.4, metalness: 0.7 }));
  dish.position.set(SX, BENCH_Y + 0.006, 0);
  const heatLight = new THREE.PointLight(0xffa040, 1.4, 0.5, 2);
  heatLight.position.set(SX, BENCH_Y + 0.09, 0);
  heatLight.visible = false;
  const lbl = label('碘锤（密封玻璃管）', '#d5b6ea');
  lbl.position.set(SX + 0.02, 1.24, 0);
  const lbl2 = label('水浴 / 直接加热', '#e8cba0');
  lbl2.position.set(SX, BENCH_Y + 0.13, 0.1);
  g.add(stand, tubeG, bath, flame, dish, heatLight, lbl, lbl2);
  stSub.tubeG = tubeG; stSub.flame = flame; stSub.heatLight = heatLight;
  stSub.specks = specks; stSub.solid = solid; stSub.liquid = liquid;
  stSub.bath = bath; stSub.dish = dish;
  bakeContactShadow(SX, 0, 0.14, 0.12, 0.28);
}

/* ---------------- 章节 7 · 比较不同物质的吸热能力（水 vs 食用油/煤油/沙子） ---------------- */

const CP_MATS = {
  oil: { name: '食用油', c: 2.1, cap: 105, color: 0xd9a441, op: 0.7, series: '#d98a2b', yMax: 110, yStep: 20 },
  kero: { name: '煤油', c: 2.02, cap: 135, color: 0xc9b23c, op: 0.55, series: '#c9b23c', yMax: 150, yStep: 30 },
  sand: { name: '沙子', c: 0.92, cap: 320, color: 0xc2a06a, op: 1, series: '#c2a06a', yMax: 320, yStep: 80 },
};
const stCp = { group: new THREE.Group(), m: 0.2, Tw: 20, Tx: 20, playing: false, t: 0, rec: 0, sel: 'both', mat: 'oil' };
scene.add(stCp.group);
function buildStCp() {
  const g = stCp.group, SX = 1.6;
  const hp1 = makeHotplate(0.1, 0.1);
  hp1.position.set(SX - 0.062, BENCH_Y, 0.02);
  const hp2 = makeHotplate(0.1, 0.1);
  hp2.position.set(SX + 0.062, BENCH_Y, 0.02);
  const bw = makeBeaker(0.045, 0.08);
  bw.position.set(SX - 0.062, BENCH_Y + 0.022, 0.02);
  const bo = makeBeaker(0.045, 0.08);
  bo.position.set(SX + 0.062, BENCH_Y + 0.022, 0.02);
  const wwater = makeWater(0.042, 0.05, 0x7fb8d8, 0.45);
  wwater.position.set(SX - 0.062, BENCH_Y + 0.049, 0.02);
  /* 三种对比物：油 / 煤油（液体）/ 沙子（锥顶粉末），切题切换 */
  const oil = makeWater(0.042, 0.05, 0xd9a441, 0.7);
  oil.position.set(SX + 0.062, BENCH_Y + 0.049, 0.02);
  const kero = makeWater(0.042, 0.05, 0xc9b23c, 0.5);
  kero.position.set(SX + 0.062, BENCH_Y + 0.049, 0.02);
  const sandTex = sandTexture();
  const sandG = new THREE.Group();
  const sBody = new THREE.Mesh(new THREE.CylinderGeometry(0.041, 0.041, 0.038, 20), stdMat({ color: 0xffffff, roughness: 0.9, map: sandTex }));
  sBody.position.y = 0.019;
  const sCone = new THREE.Mesh(new THREE.ConeGeometry(0.041, 0.018, 20), stdMat({ color: 0xffffff, roughness: 0.9, map: sandTex }));
  sCone.position.y = 0.047;
  sandG.add(sBody, sCone);
  sandG.position.set(SX + 0.062, BENCH_Y + 0.022, 0.02);
  kero.visible = false; sandG.visible = false;
  const l1 = label('水', '#9fd4e8');
  l1.position.set(SX - 0.062, BENCH_Y + 0.155, 0.02);
  const l2 = label('食用油', '#eecc8a');
  l2.position.set(SX + 0.062, BENCH_Y + 0.205, 0.02);
  g.add(hp1, hp2, bw, bo, wwater, oil, kero, sandG, l1, l2);
  stCp.hp1 = hp1; stCp.hp2 = hp2; stCp.wwater = wwater;
  stCp.oil = oil; stCp.kero = kero; stCp.sandG = sandG;
  stCp.grpW = bw; stCp.grpO = bo; stCp.l1 = l1; stCp.l2 = l2;
  bakeContactShadow(SX - 0.062, 0.02, 0.16, 0.14, 0.26);
  bakeContactShadow(SX + 0.062, 0.02, 0.16, 0.14, 0.26);
}

/* ---------------- 章节 8 · 热传导（四棒 InstancedMesh + 火柴 InstancedMesh） ---------------- */

const ROD_DEF = [
  { name: '铜', k: '401', color: 0xc47a3a, kn: 1.0 },
  { name: '铝', k: '237', color: 0xdfe3e8, kn: 0.59 },
  { name: '铁', k: '80', color: 0x6d7078, kn: 0.2 },
  { name: '玻璃', k: '≈1', color: 0xcfe4ee, kn: 0.003 },
];
const ROD_Y = [0.975, 1.02, 1.065, 1.11];
const MATCH_X = [-0.1, 0.0, 0.1];
const SEG_T0 = 23;
const stCnd = { group: new THREE.Group(), on: false, time: 0, thermal: false, dropped: 0, heatT: 320 };
scene.add(stCnd.group);
function buildStCond() {
  const g = stCnd.group;
  const panel = box(0.72, 0.42, 0.016, stdMat({ color: 0xeef1f4, roughness: 0.75 }));
  panel.position.set(0, BENCH_Y + 0.21, -0.1);
  const blockMat = stdMat({ color: 0x33363c, roughness: 0.5, metalness: 0.4 });
  const heater = box(0.06, 0.26, 0.05, blockMat);
  heater.position.set(-0.335, 1.06, 0);
  const glow = box(0.05, 0.26, 0.056, stdMat({ color: 0x5a2018, roughness: 0.5, emissive: 0x000000 }));
  glow.position.set(-0.335, 1.06, 0.004);
  /* 加热块工作指示灯 + 小铭牌 */
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.0035, 8, 6), stdMat({ color: 0x701b10, emissive: 0x000000, roughness: 0.3 }));
  led.position.set(-0.335, 0.945, 0.028);
  const plate = mesh(new THREE.PlaneGeometry(0.04, 0.012), stdMat({ map: brandTex, roughness: 0.5 }));
  plate.position.set(-0.335, 1.2, 0.0265);
  g.add(panel, heater, glow, led, plate);
  stCnd.glow = glow; stCnd.led = led;
  /* 四根棒：每根一个 InstancedMesh（8 段），热成像用 instanceColor 渐变 */
  const rodGeo = new THREE.CylinderGeometry(0.007, 0.007, 0.0625, 12);
  rodGeo.rotateZ(Math.PI / 2);
  stCnd.segs = [];
  const _rm = new THREE.Matrix4();
  ROD_DEF.forEach((rd, ri) => {
    const y = ROD_Y[ri];
    const mat = rd.k === '≈1'
      ? new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0, roughness: 0.08, transparent: true, opacity: 0.5, envMapIntensity: 0.5 })
      : stdMat({ color: 0xffffff, metalness: 0.88, roughness: 0.35 });
    const im = new THREE.InstancedMesh(rodGeo, mat, 8);
    const Ts = [];
    for (let i = 0; i < 8; i++) {
      _rm.makeTranslation(-0.3 + 0.0625 * (i + 0.5), y, 0.01);
      im.setMatrixAt(i, _rm);
      im.setColorAt(i, new THREE.Color(rd.color));
      Ts.push(SEG_T0);
    }
    im.instanceColor.needsUpdate = true;
    g.add(im);
    stCnd.segs.push({ im, T: Ts, base: new THREE.Color(rd.color) });
    const lbl = label(rd.name, '#dfe6ee');
    lbl.position.set(0.27, y + 0.012, 0.01);
    g.add(lbl);
  });
  /* 12 根火柴：三件套 InstancedMesh，掉落动画走矩阵 */
  stCnd.matches = [];
  ROD_DEF.forEach((rd, ri) => {
    MATCH_X.forEach((mx, mi) => {
      stCnd.matches.push({ ri, si: [3, 4, 6][mi], x: mx, y: ROD_Y[ri] - 0.008, z: 0.01, fall: false, vy: 0, rot: 0 });
    });
  });
  bakeContactShadow(0, 0, 0.72, 0.2, 0.28);
}
function restickMatches() {
  stCnd.matches.forEach((m) => {
    m.fall = false; m.vy = 0; m.rot = 0;
    m.y = ROD_Y[m.ri] - 0.008;
    m.x = MATCH_X[m.si === 3 ? 0 : m.si === 4 ? 1 : 2];
    m.z = 0.01;
  });
  stCnd.dropped = 0;
}

/* ---------------- 章节 9 · 热对流（高锰酸钾示踪 + 投放动画 + 水体染色） ---------------- */

const stCnv = { group: new THREE.Group(), mode: 'bottom', power: 1, density: 0.6, lines: false, acc: 0, dropT: -1, tint: 0 };
scene.add(stCnv.group);
function buildStConv() {
  const g = stCnv.group, SX = 0.05;
  const hp = makeHotplate(0.12, 0.12);
  hp.position.set(SX, BENCH_Y, 0.02);
  const side = box(0.028, 0.06, 0.05, stdMat({ color: 0x3a3d44, roughness: 0.5, metalness: 0.4 }));
  side.position.set(SX - 0.058, BENCH_Y + 0.055, 0.02);
  const sideGlow = box(0.02, 0.056, 0.052, stdMat({ color: 0x5a2018, roughness: 0.5, emissive: 0x000000 }));
  sideGlow.position.set(SX - 0.05, BENCH_Y + 0.055, 0.02);
  const beaker = makeBeaker(0.055, 0.1);
  beaker.position.set(SX, BENCH_Y + 0.022, 0.02);
  const water = makeWater(0.052, 0.075, 0xbfe2ef, 0.28);
  water.position.set(SX, BENCH_Y + 0.064, 0.02);
  // 高锰酸钾晶粒（底部 / 侧壁两套，InstancedMesh 各 5 粒）
  function grains(cx) {
    const im = new THREE.InstancedMesh(
      new THREE.DodecahedronGeometry(0.0026, 0),
      stdMat({ color: 0x4a1150, roughness: 0.6 }),
      5
    );
    const _gm = new THREE.Matrix4();
    const _gq = new THREE.Quaternion();
    const _ge = new THREE.Euler();
    for (let i = 0; i < 5; i++) {
      _ge.set(i * 1.1 % 3, i * 0.7 % 3, i * 0.4 % 3);
      _gq.setFromEuler(_ge);
      _gm.compose(
        new THREE.Vector3(cx + (i - 2) * 0.004 + (i % 2) * 0.002, BENCH_Y + 0.031, 0.02 + ((i * 7) % 3 - 1) * 0.007),
        _gq,
        new THREE.Vector3(1 + (i % 2) * 0.4, 1, 1 + (i % 3) * 0.25)
      );
      im.setMatrixAt(i, _gm);
    }
    return im;
  }
  const grainsB = grains(SX);
  const grainsS = grains(SX - 0.034);
  g.add(hp, side, sideGlow, beaker, water, grainsB, grainsS);
  stCnv.hp = hp; stCnv.side = side; stCnv.sideGlow = sideGlow;
  stCnv.grainsB = grainsB; stCnv.grainsS = grainsS; stCnv.water = water;
  // 两条对流环路（世界坐标，闭合）
  const y0 = BENCH_Y + 0.034, y1 = BENCH_Y + 0.096, x0 = SX;
  const ptsB = [
    [x0, y0 + 0.008, 0.02], [x0, y1 - 0.01, 0.02], [x0 + 0.016, y1 - 0.004, 0.032],
    [x0 + 0.036, (y0 + y1) / 2, 0.024], [x0 + 0.02, y0 + 0.006, 0.008], [x0 - 0.008, y0 + 0.008, 0.016],
  ];
  const ptsS = [
    [x0 - 0.034, y0 + 0.01, 0.02], [x0 - 0.032, y1 - 0.008, 0.028], [x0 - 0.01, y1 - 0.004, 0.02],
    [x0 + 0.02, y1 - 0.01, 0.012], [x0 + 0.034, y0 + 0.04, 0.02], [x0 + 0.012, y0 + 0.005, 0.026], [x0 - 0.012, y0 + 0.008, 0.02],
  ];
  stCnv.curveB = new THREE.CatmullRomCurve3(ptsB.map((p) => new THREE.Vector3(...p)), true);
  stCnv.curveS = new THREE.CatmullRomCurve3(ptsS.map((p) => new THREE.Vector3(...p)), true);
  function lineOf(curve) {
    const geo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(80));
    return new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0x9b4fc2, transparent: true, opacity: 0.5 }));
  }
  stCnv.lineB = lineOf(stCnv.curveB);
  stCnv.lineS = lineOf(stCnv.curveS);
  stCnv.lineB.visible = stCnv.lineS.visible = false;
  g.add(stCnv.lineB, stCnv.lineS);
  bakeContactShadow(SX, 0.02, 0.2, 0.18, 0.3);
  bakeContactShadow(SX - 0.058, 0.02, 0.08, 0.1, 0.22);
}
function dropGrains() {
  stCnv.dropT = 0;
  const grp = stCnv.mode === 'bottom' ? stCnv.grainsB : stCnv.grainsS;
  grp.position.y = 0.075;
  grp.visible = true;
  for (let i = 0; i < 6; i++) spawnTracer();
  toast('高锰酸钾晶粒沉底后，紫色细流会跟着对流环走——它就是流动的示踪剂。', 'ok');
}

/* ---------------- 章节 10 · 热辐射（灯照黑白罐 / 真空保温瓶对比） ---------------- */

const stRadS = { group: new THREE.Group(), exp: 'lamp', on: false, power: 1, Tb: 25, Tw: 25, Tn: 85, Tv: 85, t: 0, rec: 0 };
scene.add(stRadS.group);
function buildStRad() {
  const g = stRadS.group;
  /* 灯照装置 */
  const lampG = new THREE.Group();
  const LX = -0.78;
  const base = box(0.09, 0.012, 0.12, metalMat);
  base.position.set(LX, BENCH_Y + 0.006, 0);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.16, 12), metalMat);
  pole.position.set(LX, BENCH_Y + 0.08, 0);
  const reflMat = stdMat({ color: 0xd7dde2, roughness: 0.28, metalness: 0.88, side: THREE.DoubleSide });
  const refl = new THREE.Mesh(new THREE.SphereGeometry(0.04, 18, 10, 0, TAU, 0, Math.PI / 2), reflMat);
  refl.rotation.z = Math.PI / 2;
  refl.position.set(LX, 1.06, 0);
  const bulbMat = stdMat({ color: 0xff8a4a, emissive: 0xff7a30, emissiveIntensity: 0, roughness: 0.3 });
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.013, 14, 10), bulbMat);
  bulb.position.set(-0.755, 1.06, 0);
  const cone = new THREE.Mesh(
    new THREE.ConeGeometry(0.1, 0.55, 24, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xffb070, transparent: true, opacity: 0.05, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  cone.rotation.z = Math.PI / 2;
  cone.position.set(-0.48, 1.06, 0);
  const light = new THREE.PointLight(0xffa060, 0, 2.4, 2);
  light.position.set(-0.7, 1.06, 0);
  lampG.add(base, pole, refl, bulb, cone, light);
  g.add(lampG);
  stRadS.lampG = lampG; stRadS.bulbMat = bulbMat; stRadS.cone = cone; stRadS.light = light;
  function can(color, z, name, lc) {
    const ped = box(0.028, 0.02, 0.028, stdMat({ color: 0x3a3d44, roughness: 0.5 }));
    ped.position.set(-0.12, BENCH_Y + 0.01, z);
    const bodyMat = stdMat({ color, roughness: 0.5, metalness: 0.1, emissive: 0x000000 });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.09, 22), bodyMat);
    body.position.set(-0.12, BENCH_Y + 0.065, z);
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.031, 0.031, 0.006, 22), stdMat({ color: 0x565b63, roughness: 0.4, metalness: 0.5 }));
    lid.position.set(-0.12, BENCH_Y + 0.113, z);
    const lbl = label(name, lc);
    lbl.position.set(-0.12, BENCH_Y + 0.16, z);
    lampG.add(ped, body, lid, lbl);
    return bodyMat;
  }
  stRadS.mB = can(0x1a1c20, -0.055, '黑罐', '#b9c2ca');
  stRadS.mW = can(0xe8eaee, 0.055, '白罐', '#e2e6ea');
  /* 保温瓶对比装置（真空阻断传导对流 + 镀银反射辐射 + 软木塞） */
  const flaskG = new THREE.Group();
  const FX = 0.05;
  /* 真空保温瓶：剖切外壳（留观察窗）+ 镀银内胆 + 软木塞 + 瓶胆夹层 */
  const shellMat = matStd(0x9fb6c4, { roughness: 0.3, metalness: 0.5, clearcoat: 0.5, clearcoatRoughness: 0.25, side: THREE.DoubleSide });
  const shell = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.03, 0.11, 24, 1, true, 0.5, 5.0), shellMat);
  shell.position.set(FX, BENCH_Y + 0.058, 0);
  const innerMat = stdMat({ color: 0xe6edf2, roughness: 0.07, metalness: 0.95 });
  const inner = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.022, 0.1, 20, 1, true), innerMat);
  inner.material.side = THREE.DoubleSide;
  inner.position.set(FX, BENCH_Y + 0.057, 0);
  const vacWater = makeWater(0.02, 0.07, 0xa9d4e6, 0.5);
  vacWater.position.set(FX, BENCH_Y + 0.042, 0);
  const cork = lathe([
    [0, 0.014], [0.014, 0.014], [0.016, 0.011], [0.016, 0.002], [0.013, 0], [0, 0],
  ], stdMat({ color: 0xc9a06a, roughness: 0.9 }), 14);
  cork.position.set(FX, BENCH_Y + 0.113, 0);
  const footRing = new THREE.Mesh(new THREE.TorusGeometry(0.028, 0.003, 8, 22), matStd(0x39424c, { roughness: 0.5, metalness: 0.4 }));
  footRing.rotation.x = Math.PI / 2;
  footRing.position.set(FX, BENCH_Y + 0.004, 0);
  const lblV = label('真空保温瓶', '#a8d4ee');
  lblV.position.set(FX, BENCH_Y + 0.175, 0);
  /* 普通广口瓶（无塞无镀层，作对照） */
  const jar = makeBeaker(0.03, 0.09, false);
  jar.position.set(FX + 0.085, BENCH_Y + 0.022, 0.02);
  const jarWater = makeWater(0.027, 0.062, 0xa9d4e6, 0.5);
  jarWater.position.set(FX + 0.085, BENCH_Y + 0.056, 0.02);
  const lblN = label('普通广口瓶', '#e8cba0');
  lblN.position.set(FX + 0.085, BENCH_Y + 0.165, 0.02);
  flaskG.add(shell, inner, vacWater, cork, footRing, lblV, jar, jarWater, lblN);
  flaskG.visible = false;
  g.add(flaskG);
  stRadS.flaskG = flaskG; stRadS.vacWater = vacWater; stRadS.jarWater = jarWater;
  bakeContactShadow(-0.12, 0, 0.14, 0.14, 0.26);
  bakeContactShadow(LX, 0, 0.12, 0.14, 0.24);
  bakeContactShadow(FX, 0, 0.24, 0.12, 0.26);
}

/* ---------------- 章节 11 · 从冰到沸腾（综合剧情：初温可调 + 三块碎冰） ---------------- */

const stSty = { group: new THREE.Group(), playing: true, speed: 1, t: 0, T: -20, ann: true, rec: 0, T0: -20, TL: null };
scene.add(stSty.group);
function calcTL(T0) {
  const d1 = Math.max(4, -T0 * 0.8);   /* 升温段时长随初温变化（速率 20℃/16s） */
  return { p1: [0, d1], p2: [d1, d1 + 28], p3: [d1 + 28, d1 + 92], p4: [d1 + 92, d1 + 134] };
}
function buildStStory() {
  const g = stSty.group, SX = 0.05;
  const hp = makeHotplate(0.13, 0.13, true);
  hp.position.set(SX, BENCH_Y, 0.02);
  const beaker = makeBeaker(0.055, 0.1);
  beaker.position.set(SX, BENCH_Y + 0.022, 0.02);
  const water = makeWater(0.052, 0.075, 0xa9d8ea, 0.42);
  water.position.set(SX, BENCH_Y + 0.064, 0.02);
  /* 三块碎冰（错落姿态，熔化时整体缩小） */
  const iceMat = new THREE.MeshPhysicalMaterial({
    color: 0xeef7fb, transparent: true, opacity: 0.85, roughness: 0.22,
    envMapIntensity: 0.6, clearcoat: 0.4, clearcoatRoughness: 0.3,
  });
  const ice = new THREE.Group();
  [[0, 0.015, 0, 0.032, 0.2], [0.02, 0.011, 0.008, 0.024, -0.5], [-0.017, 0.009, -0.006, 0.02, 0.9]].forEach(([ix, iy, iz, s, rz]) => {
    const c = box(s, s * 0.92, s, iceMat);
    c.position.set(ix, iy, iz);
    c.rotation.set(0.15, 0.4, rz);
    ice.add(c);
  });
  ice.position.set(SX, BENCH_Y + 0.09, 0.02);
  g.add(hp, beaker, water, ice);
  stSty.hp = hp; stSty.water = water; stSty.ice = ice;
  bakeContactShadow(SX, 0.02, 0.24, 0.2, 0.3);
}
function storyPhase(t) {
  const TLc = stSty.TL;
  if (t < TLc.p2[0]) {
    const k = clamp(t / TLc.p1[1], 0, 1);
    return { ph: 1, T: stSty.T0 * (1 - k) };
  }
  if (t < TLc.p3[0]) return { ph: 2, T: 0 };
  if (t < TLc.p4[0]) return { ph: 3, T: ((t - TLc.p3[0]) / (TLc.p3[1] - TLc.p3[0])) * 100 };
  return { ph: 4, T: 100 };
}
const PH_NAMES = { 1: '固态升温 → 0℃', 2: '熔化平台 0℃（吸热温度不变）', 3: '液态升温 0→100℃', 4: '沸腾平台 100℃（吸热温度不变）' };

/* ---------------- 台面叙事道具阵列（后沿，不进相机飞行路径） ---------------- */

function buildProps() {
  const flavors = [
    ['煤油', '易燃 · 液体', 0xc9b23c],
    ['酒精', '乙醇溶液', 0xd9e9f2],
    ['蒸馏水', '对比实验用', 0x8ecbe2],
    ['石蜡油', '非晶体样本', 0xe0c890],
  ];
  flavors.forEach(([n, sub, c], i) => {
    const b = reagentBottle(n, sub, c);
    b.position.set(-2.42 + i * 0.125, BENCH_Y, -0.55);
    b.rotation.y = -0.5 + i * 0.24;
    worldG.add(b);
  });
  bakeContactShadow(-2.23, -0.55, 0.56, 0.1, 0.22);
  const rack = tubeRackProp();
  rack.position.set(2.2, BENCH_Y, -0.55);
  rack.rotation.y = 0.35;
  worldG.add(rack);
  bakeContactShadow(2.2, -0.55, 0.14, 0.1, 0.2);
  const mbox = matchboxProp();
  mbox.position.set(-0.38, BENCH_Y, -0.6);
  mbox.rotation.y = -0.3;
  worldG.add(mbox);
  bakeContactShadow(-0.38, -0.6, 0.09, 0.06, 0.18);
  const clip = clipboardProp();
  clip.position.set(1.12, BENCH_Y, -0.6);
  clip.rotation.y = 0.4;
  worldG.add(clip);
  bakeContactShadow(1.12, -0.6, 0.14, 0.16, 0.18);
}

/* ---------------- UI：提示条 / 图例 ---------------- */

let toastTimer = null;
function toast(text, kind = '') {
  let el = stage.querySelector('.heat-toast');
  if (!el) { el = document.createElement('div'); el.className = 'heat-toast'; stage.appendChild(el); }
  el.textContent = text;
  el.className = 'heat-toast show' + (kind ? ' ' + kind : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3600);
}

let hintEl = null;
function setHint(text) {
  if (!text) { if (hintEl) { hintEl.remove(); hintEl = null; } return; }
  if (!hintEl) { hintEl = document.createElement('div'); hintEl.className = 'heat-hint'; stage.appendChild(hintEl); }
  hintEl.innerHTML = '';
  const row = document.createElement('div');
  row.className = 'lg-row';
  row.textContent = text;
  hintEl.appendChild(row);
}

/* 器材名称标签统一显隐 */
let labelsOn = true;
function applyLabels() {
  for (const s of equipLabels) s.visible = labelsOn;
}

function hideAll() {
  [stT, stMelt, stBoil, stEvap, stSub, stCp, stCnd, stCnv, stRadS, stSty].forEach((s) => { s.group.visible = false; });
  hideWins();
  cv2.style.display = 'none';
  setHint(null);
  resetParticles();
  hideMatches();
}

/* ---------------- 各章节逐帧状态更新 ---------------- */

function uT() {
  stT.th.userData.setFrac((stT.T + 20) / 130);
  stT.water.material.color.setHex(0x7fb8d8).lerp(new THREE.Color(0xbcdce8), clamp((stT.T - 20) / 80, 0, 1));
  const err = (stT.place === 'bottom' ? 8 : stT.place === 'wall' ? 5 : 0) + (stT.view === 'down' ? 2 : stT.view === 'up' ? -2 : 0);
  hset('read', (stT.T + err).toFixed(1) + ' ℃');
  hset('real', stT.T.toFixed(1) + ' ℃');
  hset('err', err === 0 ? '0 ℃' : (err > 0 ? '+' : '') + err + ' ℃');
}

function uMelt(dt, time) {
  const S = stMelt;
  if (S.playing) {
    S.Tb += (62 - S.Tb) * 0.10 * S.power * dt;
    if (S.melt < 1) {
      if (S.Ts < 48) {
        S.Ts += (S.Tb - S.Ts) * 0.14 * dt;
        if (S.Ts >= 47.6) S.Ts = 48; // 到达熔点后进入平台
      } else {
        S.melt = Math.min(1, S.melt + Math.max(0, S.Tb - 48) * 0.025 * S.power * dt);
      }
    } else {
      S.Ts += (S.Tb - S.Ts) * 0.14 * dt;
    }
    S.Tw += (S.Tb - S.Tw) * 0.14 * dt;
    S.t += dt; S.rec += dt;
    while (S.rec >= 0.4) {
      S.rec -= 0.4;
      winMelt.cfg.series[0].pts.push([S.t, S.Ts]);
      winMelt.cfg.series[1].pts.push([S.t, S.Tw]);
      if (winMelt.cfg.series[0].pts.length > 1600) { winMelt.cfg.series[0].pts.shift(); winMelt.cfg.series[1].pts.shift(); }
    }
  }
  S.hp.userData.setOn(S.playing, S.power);
  S.hp.userData.setKnob(S.power);
  /* 搅拌棒轻摆（水浴受热均匀的暗示） */
  const sw = S.playing ? Math.sin(time * 3.2) * 0.07 : 0;
  S.s1.rotation.x = sw; S.s2.rotation.x = Math.sin(time * 3.2 + 2.1) * 0.07 * (S.playing ? 1 : 0);
  winMelt.cfg.series[0].dim = S.sel !== 's';
  winMelt.cfg.series[1].dim = S.sel !== 'w';
  hset('bath', S.Tb.toFixed(1) + ' ℃');
  hset('s', S.Ts.toFixed(1) + ' ℃' + (S.melt > 0 && S.melt < 1 ? ' · 熔化中' : S.melt >= 1 ? ' · 熔完' : ''));
  hset('w', S.Tw.toFixed(1) + ' ℃');
}

function uBoil(dt) {
  const S = stBoil, SX = -0.45;
  S.Tb = bpAt(S.P);
  /* 气压表指针随气压摆动（交互可视反馈） */
  S.needleG.rotation.z = -Math.PI * 0.78 + clamp((S.P - 0.4) / 1.8, 0, 1) * Math.PI * 1.56;
  if (S.playing) {
    if (S.T < S.Tb) {
      S.T += (S.Tb - S.T) * 0.05 * S.power * dt;
      if (S.T > S.Tb - 0.4) S.T = S.Tb;
    } else if (S.T > S.Tb) {
      S.T -= (S.T - S.Tb) * 0.5 * dt; // 降压后快速回落到新沸点
    }
    S.t += dt; S.rec += dt;
    while (S.rec >= 0.4) {
      S.rec -= 0.4;
      winBoil.cfg.series[0].pts.push([S.t, S.T]);
      if (winBoil.cfg.series[0].pts.length > 1600) winBoil.cfg.series[0].pts.shift();
    }
    const topY = BENCH_Y + 0.092, botY = BENCH_Y + 0.034;
    const boiling = S.T >= S.Tb - 0.01;
    if (S.T > 75 && !boiling) {
      if (Math.random() < dt * 4) spawnBubble(SX, botY, 0.02, topY, 0.04, -0.4, 0.9); // 沸腾前：上升变小
    } else if (boiling) {
      if (Math.random() < dt * 20 * S.power) spawnBubble(SX, botY, 0.02, topY, 0.07, 0.9, 0.5); // 沸腾：底部生成上升变大
      if (Math.random() < dt * 2.2) puffAt(SX + (Math.random() - 0.5) * 0.03, topY + 0.012, 0.02, 0.03);
      if (!S.boilToast) {
        S.boilToast = true;
        toast('水开了！继续吸热，温度却停在沸点不再上升。', 'ok');
      }
    }
  }
  S.th.userData.setFrac((S.T + 20) / 130);
  S.hp.userData.setOn(S.playing, S.power);
  S.hp.userData.setKnob(S.power);
  winBoil.cfg.ann = true;
  winBoil.cfg.annLines = [{ y: S.Tb, label: '沸点 ' + Math.round(S.Tb) + '℃ · 沸腾吸热温度不变' }];
  hset('t', S.T.toFixed(1) + ' ℃');
  hset('tb', Math.round(S.Tb) + ' ℃ @ ' + S.P.toFixed(2) + ' atm');
  hset('st', !S.playing ? '停止加热' : S.T >= S.Tb - 0.01 ? '沸腾中' : S.T > 75 ? '接近沸腾' : '加热中');
}

function uEvap(dt) {
  const S = stEvap, SX = 0.2;
  S.thD.userData.setFrac((S.amb + 20) / 130);
  S.thW.userData.setFrac((S.Tw + 20) / 130);
  S.fspeed += ((S.fan ? 15 : 0) - S.fspeed) * Math.min(1, dt * 3);
  if (S.fan && S.fan.userData.blades) S.fan.userData.blades.rotation.x += S.fspeed * dt;
  const dT = S.alcohol > 0 ? Math.min(8.5, (2.5 + S.alcohol * 2.2) * (S.fan ? 1.45 : 1)) : 0;
  S.Tw += ((S.amb - dT) - S.Tw) * (0.25 + (S.fan ? 0.35 : 0)) * dt;
  /* 冷玻璃片：液化放热 → 玻璃片升温；静置后慢慢回到冷态 */
  if (S.mistT > 0) {
    S.mistT -= dt;
    if (Math.random() < dt * 6) puffAt(SX + 0.16 + (Math.random() - 0.5) * 0.02, BENCH_Y + 0.06, 0.03, 0.045);
    S.plateT += (38 - S.plateT) * Math.min(1, dt * 0.8);
  } else {
    S.plateT += (5 - S.plateT) * Math.min(1, dt * 0.12);
  }
  if (S.plate) S.plate.material.color.setHex(0xcfdde6).lerp(new THREE.Color(0xe8b9a0), clamp((S.plateT - 5) / 33, 0, 1) * 0.5);
  hset('dry', S.amb.toFixed(1) + ' ℃');
  hset('wet', S.Tw.toFixed(1) + ' ℃');
  hset('diff', (S.amb - S.Tw).toFixed(1) + ' ℃');
  hset('plate', S.plateT.toFixed(1) + ' ℃');
}

function uSub(dt, time) {
  const S = stSub;
  const cap = S.mode === 'bath' ? 97 : 158;
  S.Tb6 += ((S.on ? cap : 25) - S.Tb6) * (S.on ? 0.25 : 0.06) * dt;
  S.flame.visible = S.on;
  if (S.on) {
    const s = 1 + Math.sin(time * 0.03) * 0.12;
    S.flame.userData.outer.scale.set(0.045 * s, 0.075 * s, 1);
  }
  S.heatLight.visible = S.on;
  /* 水浴 / 直接加热 两套热源切换 */
  S.bath.visible = S.mode === 'bath';
  S.dish.position.x = S.mode === 'bath' ? 0.85 : 0.878;
  S.flame.position.set(S.mode === 'bath' ? 0.85 : 0.878, S.mode === 'bath' ? BENCH_Y + 0.042 : BENCH_Y + 0.052, 0);
  stSub.tubeG.position.y = S.mode === 'bath' ? 1.015 : 1.03;
  /* 碘熔化：只有直接加热过熔点（约 114℃）才会先液化 */
  if (S.on && S.Tb6 > 113.7) {
    S.meltF = Math.min(1, S.meltF + (S.Tb6 - 113.7) * 0.004 * dt);
    if (S.meltF > 0.05 && !S.meltToast) {
      S.meltToast = true;
      toast('温度超过了碘的熔点：碘先熔化成液体、再汽化——这样就不能证明固态"直接"变成气体了。', 'warn');
    }
  } else if (!S.on || S.Tb6 < 113.7) {
    S.meltF = Math.max(0, S.meltF - dt * 0.12);
    if (S.meltF === 0) S.meltToast = false;
  }
  S.solid.scale.setScalar(Math.max(0.12, 1 - S.meltF * 0.88));
  S.liquid.visible = S.meltF > 0.02;
  S.liquid.scale.set(1, 0.3 * Math.max(S.meltF, 0.02), 1);
  const dir = new THREE.Vector3(-Math.sin(0.35), Math.cos(0.35), 0);
  const wp = new THREE.Vector3();
  S.solid.getWorldPosition(wp);
  const vapOn = S.Tb6 > 55;
  if (vapOn) {
    S.vapAcc += dt * 9 * ((S.Tb6 - 55) / 65);
    while (S.vapAcc >= 1) { S.vapAcc -= 1; spawnVapor(wp.x, wp.y, wp.z, dir, 0.055, 1.7); }
  }
  if (vapOn && S.cold < 22) S.speckAcc += dt * (22 - S.cold) * 0.012;
  const n = Math.min(24, Math.floor(S.speckAcc));
  S.specks.count = 0;
  S.specks.count = n;   /* InstancedMesh：只画前 n 粒已凝华晶体 */
  hset('bot', Math.round(S.Tb6) + ' ℃');
  hset('cold', Math.round(S.cold) + ' ℃');
  hset('sp', n + ' / 24');
  hset('phase', S.meltF > 0.02 ? (S.meltF < 1 ? '熔化中（先液化）' : '已熔化 → 汽化') : '固态（未达熔点）');
}

function uCp(dt) {
  const S = stCp;
  const M = CP_MATS[S.mat];
  if (S.playing) {
    const rw = 0.55 * (4.2 / 4.2) * (0.2 / S.m);            // 水：c = 4.2×10³
    const rx = 0.55 * (4.2 / M.c) * (0.2 / S.m);            // 对比物：ΔT/Δt ∝ 1/c
    if (S.Tw < 100) S.Tw = Math.min(100, S.Tw + rw * dt);
    if (S.Tx < M.cap) S.Tx = Math.min(M.cap, S.Tx + rx * dt);
    S.t += dt; S.rec += dt;
    while (S.rec >= 0.4) {
      S.rec -= 0.4;
      winCp.cfg.series[0].pts.push([S.t, S.Tw]);
      winCp.cfg.series[1].pts.push([S.t, S.Tx]);
      if (winCp.cfg.series[0].pts.length > 1600) { winCp.cfg.series[0].pts.shift(); winCp.cfg.series[1].pts.shift(); }
    }
  }
  S.hp1.userData.setOn(S.playing, 1);
  S.hp2.userData.setOn(S.playing, 1);
  winCp.info.textContent = M.name + '升温 ≈ ' + (4.2 / M.c).toFixed(1) + '×水（Q=cmΔt）';
  hset('w', S.Tw.toFixed(1) + ' ℃');
  hset('x', S.Tx.toFixed(1) + ' ℃' + (S.Tx >= M.cap - 0.01 ? ' · 持续升温' : ''));
  hset('diff', (S.Tx - S.Tw).toFixed(1) + ' ℃');
  hset('ratio', '1 : ' + (4.2 / M.c).toFixed(2));
}

const HOTCOL = new THREE.Color(0xff5a22);
const _cc = new THREE.Color();
function uCond(dt) {
  const S = stCnd;
  if (S.on) S.time += dt;
  const heaterT = S.on ? S.heatT : SEG_T0;
  S.segs.forEach((seg, ri) => {
    let prev = heaterT;
    let dirty = false;
    seg.T.forEach((t0, si) => {
      let T = t0;
      T += (prev - T) * (S.on ? 0.55 * ROD_DEF[ri].kn : 0.05) * dt;
      T += (SEG_T0 - T) * 0.008 * dt;
      seg.T[si] = T;
      prev = T;
      const f = clamp((T - 24) / (S.heatT - 24) * 1.05, 0, 1);
      if (S.thermal) {
        _cc.copy(seg.base).lerp(HOTCOL, f);
        seg.im.setColorAt(si, _cc);
        dirty = true;
      } else if (!seg.clean) {
        seg.im.setColorAt(si, seg.base);
        dirty = true;
      }
    });
    if (!S.thermal) seg.clean = true;
    else seg.clean = false;
    if (dirty) seg.im.instanceColor.needsUpdate = true;
  });
  S.glow.material.emissive.setHex(S.on ? 0xd23c14 : 0x000000);
  S.glow.material.emissiveIntensity = S.on ? 0.9 : 0;
  S.led.material.emissive.setHex(S.on ? 0xff3020 : 0x000000);
  S.led.material.emissiveIntensity = S.on ? 1.4 : 0;
  S.matches.forEach((m) => {
    if (!m.fall && S.on && S.segs[m.ri].T[m.si] > 62) { m.fall = true; m.vy = 0; S.dropped++; }
    if (m.fall && m.y > BENCH_Y + 0.006) {
      m.vy += 3.5 * dt;
      m.y -= m.vy * dt;
      m.rot += dt * 2.5;
      if (m.y <= BENCH_Y + 0.006) m.y = BENCH_Y + 0.006;
    }
  });
  syncMatches(S.matches);
  hset('t', Math.floor(S.time) + ' s');
  hset('n', S.dropped + ' / 12');
}

function uConv(dt) {
  const S = stCnv;
  convCurve = S.mode === 'bottom' ? S.curveB : S.curveS;
  S.hp.visible = S.mode === 'bottom';
  S.side.visible = S.sideGlow.visible = S.mode === 'side';
  S.grainsB.visible = S.mode === 'bottom' && S.dropT !== -2;
  S.grainsS.visible = S.mode === 'side' && S.dropT !== -2;
  S.sideGlow.material.emissive.setHex(S.mode === 'side' ? 0xd23c14 : 0x000000);
  S.sideGlow.material.emissiveIntensity = S.mode === 'side' ? 0.8 : 0;
  S.hp.userData.setOn(S.mode === 'bottom' && S.power > 0.05, S.power);
  S.hp.userData.setKnob(S.power);
  S.lineB.visible = S.lines && S.mode === 'bottom';
  S.lineS.visible = S.lines && S.mode === 'side';
  /* 晶粒投放坠落动画 */
  if (S.dropT >= 0) {
    S.dropT += dt;
    const grp = S.mode === 'bottom' ? S.grainsB : S.grainsS;
    grp.position.y = Math.max(0, 0.075 * (1 - S.dropT * 2.6));
    if (S.dropT > 0.4) S.dropT = -1;
  }
  /* 晶粒溶解：水染上淡紫 */
  S.tint = Math.min(1, S.tint + dt * 0.02 * (S.power > 0.05 ? 1 : 0.3));
  S.water.material.color.setHex(0xbfe2ef).lerp(new THREE.Color(0x9a5ab8), S.tint * 0.45);
  if (S.power > 0.05) {
    S.acc += dt * 12 * S.density * S.power;
    while (S.acc >= 1) { S.acc -= 1; spawnTracer(); }
  }
  hset('st', S.power > 0.05 ? '对流中' : '停止加热');
  hset('n', tracers.filter((p) => p.on).length + ' / 140');
}

function uRad(dt) {
  const S = stRadS;
  if (S.exp === 'lamp') {
    if (S.on) {
      S.Tb = Math.min(95, S.Tb + 1.9 * S.power * dt);
      S.Tw = Math.min(95, S.Tw + 0.8 * S.power * dt);
      S.t += dt; S.rec += dt;
      while (S.rec >= 0.4) {
        S.rec -= 0.4;
        winRad.cfg.series[0].pts.push([S.t, S.Tb]);
        winRad.cfg.series[1].pts.push([S.t, S.Tw]);
        if (winRad.cfg.series[0].pts.length > 1600) { winRad.cfg.series[0].pts.shift(); winRad.cfg.series[1].pts.shift(); }
      }
    } else {
      S.Tb += (23 - S.Tb) * 0.05 * dt;
      S.Tw += (23 - S.Tw) * 0.05 * dt;
    }
    S.bulbMat.emissiveIntensity = S.on ? 1.2 * S.power : 0;
    S.light.intensity = S.on ? 1.1 * S.power : 0;
    S.cone.material.opacity = S.on ? 0.03 + 0.045 * S.power : 0;
    S.mB.emissive.setHex(0xcc2200);
    S.mB.emissiveIntensity = clamp((S.Tb - 25) / 70, 0, 1) * 0.3;
    S.mW.emissive.setHex(0xcc2200);
    S.mW.emissiveIntensity = clamp((S.Tw - 25) / 70, 0, 1) * 0.12;
    hset('b', S.Tb.toFixed(1) + ' ℃');
    hset('w', S.Tw.toFixed(1) + ' ℃');
    hset('diff', (S.Tb - S.Tw).toFixed(1) + ' ℃');
  } else {
    /* 保温瓶对比：真空 + 镀银 + 软木塞 → 降温慢得多 */
    S.Tn += (23 - S.Tn) * 0.024 * dt;
    S.Tv += (23 - S.Tv) * 0.0035 * dt;
    S.t += dt; S.rec += dt;
    while (S.rec >= 0.4) {
      S.rec -= 0.4;
      winRad.cfg.series[0].pts.push([S.t, S.Tn]);
      winRad.cfg.series[1].pts.push([S.t, S.Tv]);
      if (winRad.cfg.series[0].pts.length > 1600) { winRad.cfg.series[0].pts.shift(); winRad.cfg.series[1].pts.shift(); }
    }
    S.vacWater.material.color.setHex(0xa9d4e6).lerp(new THREE.Color(0xd88a6a), clamp((S.Tv - 30) / 55, 0, 1) * 0.4);
    S.jarWater.material.color.setHex(0xa9d4e6).lerp(new THREE.Color(0xd88a6a), clamp((S.Tn - 30) / 55, 0, 1) * 0.4);
    hset('n', S.Tn.toFixed(1) + ' ℃');
    hset('v', S.Tv.toFixed(1) + ' ℃');
    hset('diff', (S.Tn - S.Tv).toFixed(1) + ' ℃');
  }
}

function uStory(dt) {
  const S = stSty, SX = 0.05;
  const TLc = S.TL;
  const tEnd = TLc.p4[1] + 6;
  if (S.playing) {
    S.t = Math.min(tEnd, S.t + dt * S.speed);
    S.rec += dt * S.speed;
    while (S.rec >= 0.4) {
      S.rec -= 0.4;
      winStory.cfg.series[0].pts.push([S.t, S.T]);
      if (winStory.cfg.series[0].pts.length > 800) winStory.cfg.series[0].pts.shift();
    }
  }
  const cur = storyPhase(S.t);
  S.T = cur.T;
  let lvl = 0.55, iceS = 1;
  if (cur.ph === 2) {
    const k2 = clamp((S.t - TLc.p2[0]) / (TLc.p2[1] - TLc.p2[0]), 0, 1);
    iceS = 1 - k2 * 0.88;
    lvl = 0.55 + k2 * 0.45;
  } else if (cur.ph >= 3) { iceS = 0.12; lvl = 1; }
  S.water.scale.y = lvl;
  S.water.position.y = BENCH_Y + 0.028 + 0.0375 * lvl;
  S.ice.scale.setScalar(Math.max(iceS, 0.001));
  S.ice.position.y = BENCH_Y + 0.028 + 0.075 * lvl + 0.012 * iceS;
  S.ice.visible = iceS > 0.14;
  S.hp.userData.setOn(S.t > 0.5 && S.t < tEnd - 4, 1.2);
  S.hp.userData.setKnob(S.speed);
  const topY = BENCH_Y + 0.028 + 0.075 * lvl - 0.004;
  if (cur.ph === 4 && S.playing) {
    if (Math.random() < dt * 16) spawnBubble(SX, BENCH_Y + 0.034, 0.02, topY, 0.06, 0.8, 0.5);
    if (Math.random() < dt * 2.5) puffAt(SX + (Math.random() - 0.5) * 0.03, topY + 0.01, 0.02, 0.035);
  }
  hset('ph', PH_NAMES[cur.ph]);
  hset('t', Math.round(S.T) + ' ℃');
  hset('time', Math.floor(S.t) + ' s');
}

/* ---------------- 帧循环（attachVFX 接管渲染，这里只做逻辑推进） ---------------- */

let labReady = false;
app.onFrame((dt) => {
  if (!labReady) return;
  const time = performance.now() * 0.001;
  updateParticles(dt, time);
  /* 第二章游标温度向标定目标滑动（放入冰水 / 沸水动画） */
  if (c2.target !== null) {
    c2.T += (c2.target - c2.T) * Math.min(1, dt * 3.2);
    if (Math.abs(c2.target - c2.T) < 0.4) { c2.T = c2.target; c2.target = null; }
  }
  if (stT.group.visible) uT();
  if (stMelt.group.visible) uMelt(dt, time);
  if (stBoil.group.visible) uBoil(dt);
  if (stEvap.group.visible) uEvap(dt);
  if (stSub.group.visible) uSub(dt, time);
  if (stCp.group.visible) uCp(dt);
  if (stCnd.group.visible) uCond(dt);
  if (stCnv.group.visible) uConv(dt);
  if (stRadS.group.visible) uRad(dt);
  if (stSty.group.visible) uStory(dt);
  if (cv2.style.display !== 'none') draw2d();
  WINS.forEach((w) => { if (w.el.style.display !== 'none') drawChart(w); });
});

/* ================= 章节导航（左栏列表 + ‹01/12›）与折叠 ================= */

const chapNav = document.getElementById('chapNav');
const chapCount = document.getElementById('chapCount');
const detailNo = document.getElementById('detailNo');
const detailTitle = document.getElementById('detailTitle');
const lessonEl = document.getElementById('lesson');
const detailBody = document.getElementById('detailBody');
const controlsEl = document.getElementById('controls');
const heatShell = document.getElementById('heatShell');
let chapterIdx = 0;
let activeSectionCleanup = null;
let playToggle = null;   /* 空格键播放/暂停（有播放态的章节点亮） */

const ctl = createControlsPanel(controlsEl);
const SECTIONS = [];

/* ---------------- 章节定义（原版功能块 1:1 全覆盖） ---------------- */

SECTIONS.push(
  {
    title: '温度计的使用',
    hasData: true,
    hud: [['read', '温度计示数'], ['real', '真实水温'], ['err', '偏差']],
    html: `<p>实验室温度计的使用规则：<span class="hl">玻璃泡完全浸入被测液体，不碰容器底、不碰容器壁</span>；使用前先看清<b>量程</b>和<b>分度值</b>；待示数稳定后再读数；读数时玻璃泡继续留在液体中，<span class="hl">视线与液柱上表面相平</span>（口诀：<b>俯大仰小</b>）。</p>
<p>试试三种摆放与三种视线：错误摆放会让示数偏高，俯视 / 仰视会带来读数偏差，切到对应视角体会一下。</p>`,
    enter() {
      hideAll();
      stT.group.visible = true;
      stT.T = 45; stT.place = 'ok'; stT.view = 'level';
      stT.th.position.set(-1.7, PLACE_OK.y, 0.02);
      app.setCamera([-1.3, 1.12, 0.72], [-1.7, 1.0, 0]);
      ctl.clear();
      const waterSlider = ctl.slider({ label: '水温', min: 20, max: 100, step: 1, value: 45, fmt: (v) => v + ' ℃', onInput: (v) => { stT.T = v; } });
      const placeSeg = ctl.seg({
        options: [{ label: '正确悬挂', value: 'ok' }, { label: '碰容器底', value: 'bottom' }, { label: '碰容器壁', value: 'wall' }],
        value: 'ok',
        onChange: (v) => {
          stT.place = v;
          stT.th.position.set(-1.7 + (v === 'wall' ? 0.041 : 0), v === 'bottom' ? BENCH_Y + 0.03 : PLACE_OK.y, 0.02);
          toast(PLACE_ERR[v], v === 'ok' ? 'ok' : 'warn');
        },
      });
      const viewSeg = ctl.seg({
        options: [{ label: '平视 ✓', value: 'level' }, { label: '俯视', value: 'down' }, { label: '仰视', value: 'up' }],
        value: 'level',
        onChange: (v) => {
          stT.view = v;
          if (v === 'down') app.setCamera([-1.52, 1.52, 0.4], [-1.7, 1.05, 0.02]);
          else if (v === 'up') app.setCamera([-1.46, 0.7, 0.52], [-1.7, 1.0, 0.02]);
          else app.setCamera([-1.3, 1.12, 0.72], [-1.7, 1.0, 0]);
          toast(VIEW_ERR[v], v === 'level' ? 'ok' : 'warn');
        },
      });
      /* 原版预案 1:1：正确读数 / 俯视读数 / 仰视读数 */
      ctl.sep();
      ctl.button({ label: '预案 · 正确读数', onClick: () => { stT.T = 45; waterSlider.set(45); placeSeg.set('ok'); viewSeg.set('level'); } });
      ctl.button({ label: '预案 · 俯视读数', onClick: () => { viewSeg.set('down'); } });
      ctl.button({ label: '预案 · 仰视读数', onClick: () => { viewSeg.set('up'); } });
      ctl.button({ label: '↺ 重置', onClick: () => selectChapter(0) });
      setHint('玻璃泡全浸没 · 不碰底不碰壁 · 稳定再读 · 视线相平');
    },
  },
  {
    title: '摄氏温度',
    hasData: false,
    html: `<p>摄氏温度的规定：<span class="hl">标准大气压下，冰水混合物 0℃，沸水 100℃</span>；把 0℃ 和 100℃ 之间分成 <b>100 等份</b>，每一等份就是 1℃。</p>
<p>拖动画布平移、滚轮缩放；把温度计<b>放入冰水</b>或<b>放入沸水</b>，看液柱停在哪条刻度；打开换算可同时读出华氏温度（℉ = ℃×9/5+32）与热力学温度（K = ℃+273.15）。低于 0℃ 的温度读作"零下"。</p>`,
    enter() {
      hideAll();
      app.setCamera([0.6, 1.5, 3.0], [0, 1.02, 0]);
      cv2.style.display = 'block';
      ctl.clear();
      const c2Slider = ctl.slider({ label: '游标温度', min: -20, max: 120, step: 1, value: c2.T, fmt: (v) => v + ' ℃', onInput: (v) => { c2.T = v; c2.target = null; } });
      ctl.button({ label: '❄ 放入冰水（0℃）', onClick: () => { c2.target = 0; c2Slider.set(0); } });
      ctl.button({ label: '♨ 放入沸水（100℃）', onClick: () => { c2.target = 100; c2Slider.set(100); } });
      ctl.toggle({ label: '华氏 / 开氏换算', value: c2.conv, onChange: (v) => { c2.conv = v; } });
      ctl.toggle({ label: '标定与等分标注', value: c2.ann, onChange: (v) => { c2.ann = v; } });
      ctl.button({ label: '重置视图', onClick: () => { c2.zoom = 1; c2.panX = 0; c2.panY = 0; } });
      setHint('0℃ 与 100℃ 两个定点 · 中间 100 等份');
    },
  },
  {
    title: '熔化和凝固',
    hasData: true,
    hud: [['bath', '水浴温度'], ['s', '海波（晶体）'], ['w', '石蜡（非晶体）']],
    html: `<p>水浴法加热两支试管：<span class="hl">海波是晶体，熔点 48℃</span>——熔化时持续吸热但<b>温度保持不变</b>，曲线上出现一段平台；<span class="hl">石蜡是非晶体</span>——吸热过程中温度<b>持续上升</b>，没有固定熔点。</p>
<p>点「加热」开始记录曲线，对比两种物质的曲线形状；调节功率看平台长短变化。试管里的<b>搅拌棒</b>用来让物质受热均匀。</p>`,
    enter() {
      hideAll();
      stMelt.group.visible = true;
      Object.assign(stMelt, { Tb: 20, Ts: 20, Tw: 20, melt: 0, power: 1, playing: false, t: 0, rec: 0, sel: 's' });
      winMelt.cfg.series.forEach((s) => { s.pts.length = 0; });
      app.setCamera([-0.7, 1.17, 0.7], [-1.05, 1.01, 0]);
      winMelt.show(true);
      ctl.clear();
      ctl.seg({ options: [{ label: '看海波', value: 's' }, { label: '看石蜡', value: 'w' }], value: 's', onChange: (v) => { stMelt.sel = v; } });
      ctl.slider({ label: '加热功率', min: 0.5, max: 2, step: 0.1, value: 1, fmt: (v) => v.toFixed(1) + '×', onInput: (v) => { stMelt.power = v; } });
      const run = ctl.button({ label: '▶ 加热', onClick: () => { stMelt.playing = !stMelt.playing; run.textContent = stMelt.playing ? '⏸ 暂停' : '▶ 加热'; run.classList.toggle('active', stMelt.playing); } });
      run.title = '播放 / 暂停（空格）';
      ctl.button({ label: '清曲线', onClick: () => { winMelt.cfg.series.forEach((s) => { s.pts.length = 0; }); stMelt.t = 0; stMelt.rec = 0; } });
      ctl.button({ label: '↺ 重置', onClick: () => selectChapter(2) });
      playToggle = () => run.click();
      setHint('晶体：熔化吸热温度不变 · 非晶体：连续升温');
    },
  },
  {
    title: '水的沸腾',
    hasData: true,
    hud: [['t', '水温'], ['tb', '沸点'], ['st', '状态']],
    html: `<p>水沸腾时<span class="hl">持续吸热但温度保持在沸点不变</span>。沸腾前气泡上升过程中逐渐变小；沸腾时底部大量生成气泡、上升迅速变大，到液面破裂。</p>
<p>沸点与<span class="hl">气压</span>有关：气压越高沸点越高（高压锅原理），气压越低沸点越低（高山上煮不熟饭）。拖动气压滑杆或点预案，看沸点平台怎么移动；点「停止加热」，沸腾很快停止。</p>`,
    enter() {
      hideAll();
      stBoil.group.visible = true;
      Object.assign(stBoil, { P: 1, Tb: 100, T: 20, power: 1, playing: false, t: 0, rec: 0, boil: false, boilToast: false });
      winBoil.cfg.series[0].pts.length = 0;
      app.setCamera([-0.13, 1.14, 0.76], [-0.45, 0.99, 0]);
      winBoil.show(true);
      ctl.clear();
      const pSlider = ctl.slider({ label: '气压', min: 0.5, max: 2, step: 0.05, value: 1, fmt: (v) => v.toFixed(2) + ' atm', onInput: (v) => { stBoil.P = v; } });
      ctl.slider({ label: '加热功率', min: 0.5, max: 2, step: 0.1, value: 1, fmt: (v) => v.toFixed(1) + '×', onInput: (v) => { stBoil.power = v; } });
      const run = ctl.button({ label: '▶ 加热', onClick: () => { stBoil.playing = !stBoil.playing; run.textContent = stBoil.playing ? '⏸ 暂停' : '▶ 加热'; run.classList.toggle('active', stBoil.playing); } });
      run.title = '播放 / 暂停（空格）';
      ctl.sep();
      /* 原版预案 1:1：标准大气压 / 高原 / 高压锅 */
      ctl.button({ label: '标准大气压', onClick: () => { stBoil.P = 1; pSlider.set(1); toast('气压 1.00 atm，沸点 100℃。', ''); } });
      ctl.button({ label: '高原低气压（≈60 kPa）', onClick: () => { stBoil.P = 0.6; pSlider.set(0.6); toast('高原气压低，水不到 100℃ 就沸腾——饭煮不熟。', 'warn'); } });
      ctl.button({ label: '高压锅加压（≈200 kPa）', onClick: () => { stBoil.P = 2; pSlider.set(2); toast('高压锅气压高，沸点升到约 120℃——饭菜熟得快。', 'ok'); } });
      ctl.button({ label: '↺ 重置', onClick: () => selectChapter(3) });
      playToggle = () => run.click();
      setHint('沸腾前气泡上升变小 · 沸腾时气泡上升变大');
    },
  },
  {
    title: '蒸发和液化',
    hasData: true,
    hud: [['dry', '干泡（室温）'], ['wet', '湿泡（蘸酒精）'], ['diff', '温差'], ['plate', '玻璃片温度']],
    html: `<p>蒸发是只在<span class="hl">液体表面</span>进行的缓慢汽化，<b>任何温度下</b>都能发生，<span class="hl">蒸发吸热有致冷作用</span>——湿泡温度计的棉团蘸了酒精，示数会低于室温；开风扇加快空气流动，蒸发更快、降温更明显。酒精蒸干后示数回到室温。</p>
<p>「白气」不是水蒸气！水蒸气无色透明看不见，看得见的白气是水蒸气<b>遇冷液化</b>成的小水滴——液化<b>放热</b>，所以玻璃片温度会升高。</p>`,
    enter() {
      hideAll();
      stEvap.group.visible = true;
      Object.assign(stEvap, { fan: false, fspeed: 0, amb: 25, alcohol: 1, Tw: 25, mistT: 0, plateT: 5 });
      app.setCamera([0.5, 1.2, 0.74], [0.2, 1.04, 0]);
      ctl.clear();
      ctl.toggle({ label: '风扇', value: false, onChange: (v) => { stEvap.fan = v; toast(v ? '空气流动加快，蒸发加快，湿泡降温更明显。' : '风扇停。', v ? 'ok' : ''); } });
      ctl.slider({ label: '环境温度', min: 10, max: 35, step: 1, value: 25, fmt: (v) => v + ' ℃', onInput: (v) => { stEvap.amb = v; } });
      ctl.slider({ label: '酒精量', min: 0, max: 2, step: 0.25, value: 1, fmt: (v) => v.toFixed(2) + '×', onInput: (v) => { stEvap.alcohol = v; } });
      ctl.button({ label: '💨 白气演示', onClick: () => { stEvap.mistT = 2.5; toast('白气 = 水蒸气遇冷液化成的小水滴（液化放热），盯住「玻璃片温度」读数。', 'ok'); } });
      ctl.button({ label: '重新蘸酒精', onClick: () => { stEvap.alcohol = 1; toast('棉团重新蘸满酒精，蒸发重新开始，湿泡示数再次下降。', ''); } });
      ctl.button({ label: '换一块冷玻璃片', onClick: () => { stEvap.plateT = 5; toast('玻璃片重新冷到 5℃，可以再次演示液化。', ''); } });
      ctl.button({ label: '↺ 重置', onClick: () => selectChapter(4) });
      setHint('湿泡示数低于室温 = 蒸发吸热致冷');
    },
  },
  {
    title: '升华和凝华',
    hasData: true,
    hud: [['bot', '底部温度'], ['cold', '冷端温度'], ['sp', '凝华晶体'], ['phase', '碘的状态']],
    html: `<p>固态碘受热<span class="hl">直接变成紫色碘蒸气</span>——这是<b>升华</b>（升华吸热）；碘蒸气上升遇到冷的管壁<span class="hl">直接变回固态晶体</span>——这是<b>凝华</b>（凝华放热）。</p>
<p>为什么用<b>水浴</b>？碘的熔点约 <b>113.7℃</b>，热水最高不到 100℃——碘达不到熔点、不可能熔化，紫色气体只能是固态碘<b>直接</b>升华来的。切到「直接加热」超过熔点试试：碘会先熔化成液体再汽化，就说明不了「直接」了。</p>
<p>生活实例：霜、雾凇、冰花是水蒸气凝华；樟脑丸变小、冰冻衣服变干是升华。</p>`,
    enter() {
      hideAll();
      stSub.group.visible = true;
      Object.assign(stSub, { on: false, mode: 'bath', Tb6: 25, cold: 5, speckAcc: 0, vapAcc: 0, meltF: 0, meltToast: false });
      app.setCamera([1.12, 1.19, 0.8], [0.85, 1.04, 0]);
      ctl.clear();
      ctl.toggle({ label: '加热', value: false, onChange: (v) => { stSub.on = v; if (v) toast('固态碘受热升华为紫色碘蒸气——升华吸热；蒸气在冷端凝华成晶体——凝华放热。', 'ok'); } });
      ctl.seg({
        options: [{ label: '水浴加热', value: 'bath' }, { label: '直接加热', value: 'direct' }],
        value: 'bath',
        onChange: (v) => {
          stSub.mode = v;
          toast(v === 'bath' ? '水浴：热水不到 100℃，低于碘的熔点，碘只会升华、不会熔化。' : '直接加热：温度可以超过碘的熔点（约 114℃），盯住「碘的状态」。', v === 'bath' ? '' : 'warn');
        },
      });
      ctl.slider({ label: '冷端温度', min: -30, max: 25, step: 1, value: 5, fmt: (v) => v + ' ℃', onInput: (v) => { stSub.cold = v; } });
      ctl.button({ label: '🔍 视角拉近', onClick: () => app.setCamera([1.02, 1.12, 0.72], [0.87, 1.03, 0]) });
      ctl.button({ label: '↺ 重置', onClick: () => selectChapter(5) });
      setHint('升华：固→气（吸热）· 凝华：气→固（放热）');
    },
  },
  {
    title: '比较不同物质的吸热能力',
    hasData: true,
    hud: [['w', '水温'], ['x', '对比物质'], ['diff', '温差'], ['ratio', '比热容之比']],
    html: `<p>两个<b>相同的加热器</b>（相同时间放出相同的热量）加热<b>质量相同、初温相同</b>的水和对比物质：相同吸热时间内，<span class="hl">比热容小的升温更快</span>。水的比热容 c<sub>水</sub> = 4.2×10³ J/(kg·℃)，食用油 ≈ 2.1×10³，煤油 ≈ 2.0×10³，沙子 ≈ 0.92×10³。</p>
<p>吸热公式：<span class="hl">Q = cmΔt</span>。质量越大、升温越慢；调大质量再试一次。水到 100℃ 会沸腾，温度停在沸点不再上升。所以沿海地区昼夜温差小，内陆沙漠昼夜温差大；汽车发动机也用水来冷却。</p>`,
    enter() {
      hideAll();
      stCp.group.visible = true;
      Object.assign(stCp, { m: 0.2, Tw: 20, Tx: 20, playing: false, t: 0, rec: 0, sel: 'both', mat: 'oil' });
      applyCpMat('oil', true);
      stCp.grpW.visible = stCp.grpO.visible = stCp.l1.visible = stCp.l2.visible = true;
      winCp.cfg.series.forEach((s) => { s.pts.length = 0; });
      app.setCamera([1.84, 1.15, 0.92], [1.6, 0.98, 0]);
      winCp.show(true);
      ctl.clear();
      ctl.seg({
        options: [{ label: '水', value: 'w' }, { label: '对比物', value: 'o' }, { label: '双对比', value: 'both' }],
        value: 'both',
        onChange: (v) => {
          stCp.sel = v;
          stCp.grpW.visible = stCp.l1.visible = v !== 'o';
          stCp.grpO.visible = stCp.l2.visible = v !== 'w';
          winCp.cfg.series[0].dim = v === 'o';
          winCp.cfg.series[1].dim = v === 'w';
        },
      });
      ctl.seg({
        options: [{ label: 'vs 食用油', value: 'oil' }, { label: 'vs 煤油', value: 'kero' }, { label: 'vs 沙子', value: 'sand' }],
        value: 'oil',
        onChange: (v) => applyCpMat(v),
      });
      ctl.slider({ label: '质量', min: 0.1, max: 0.4, step: 0.05, value: 0.2, fmt: (v) => v.toFixed(2) + ' kg', onInput: (v) => { stCp.m = v; } });
      const run = ctl.button({ label: '▶ 加热', onClick: () => { stCp.playing = !stCp.playing; run.textContent = stCp.playing ? '⏸ 暂停' : '▶ 加热'; run.classList.toggle('active', stCp.playing); } });
      run.title = '播放 / 暂停（空格）';
      ctl.button({ label: '清曲线', onClick: () => { winCp.cfg.series.forEach((s) => { s.pts.length = 0; }); stCp.t = 0; stCp.rec = 0; } });
      ctl.button({ label: '↺ 重置', onClick: () => selectChapter(6) });
      playToggle = () => run.click();
      setHint('等质量、相同加热 → 比热容大的升温慢');
    },
  },
  {
    title: '热传导',
    hasData: true,
    hud: [['t', '加热时间'], ['n', '已掉火柴']],
    html: `<p>热量沿着物体从高温部分传向低温部分，这是<span class="hl">热传导</span>。四根棒（铜、铝、铁、玻璃）左端同时加热，蜡粘着的火柴按<span class="hl">导热系数从大到小</span>依次掉落：<b>铜 401 &gt; 铝 237 &gt; 铁 80 &gt; 玻璃 ≈1</b>（单位 W/(m·K)）。</p>
<p>金属是热的<b>良导体</b>，玻璃是热的不良导体（所以玻璃杯柄不烫手）。打开「热成像」看温度沿棒怎么传；调高「热源温度」火柴掉得更快；点「重新粘火柴」可以重做一轮。</p>`,
    enter() {
      hideAll();
      stCnd.group.visible = true;
      Object.assign(stCnd, { on: false, time: 0, thermal: false, dropped: 0, heatT: 320 });
      restickMatches();
      app.setCamera([0.2, 1.17, 1.02], [0, 1.05, 0]);
      ctl.clear();
      ctl.toggle({ label: '加热', value: false, onChange: (v) => { stCnd.on = v; if (v) stCnd.time = 0; toast(v ? '火柴将按 铜 → 铝 → 铁 顺序掉落，玻璃几乎不导热。' : '停止加热。', v ? 'ok' : ''); } });
      ctl.slider({ label: '热源温度', min: 200, max: 500, step: 10, value: 320, fmt: (v) => v + ' ℃', onInput: (v) => { stCnd.heatT = v; } });
      ctl.toggle({ label: '热成像', value: false, onChange: (v) => { stCnd.thermal = v; } });
      ctl.button({ label: '重新粘火柴', onClick: () => { restickMatches(); toast('火柴重新用蜡粘好了，可以再观察一轮掉落顺序。', 'ok'); } });
      ctl.seg({
        options: [{ label: '全部', value: 'all' }, { label: '铜', value: '0' }, { label: '铝', value: '1' }, { label: '铁', value: '2' }, { label: '玻璃', value: '3' }],
        value: 'all',
        onChange: (v) => {
          if (v === 'all') app.setCamera([0.2, 1.17, 1.02], [0, 1.05, 0]);
          else {
            const ri = parseInt(v, 10);
            app.setCamera([-0.16, ROD_Y[ri] + 0.045, 0.62], [-0.08, ROD_Y[ri], 0]);
          }
        },
      });
      ctl.readout({ label: '导热系数 W/(m·K)', value: '铜 401 · 铝 237 · 铁 80 · 玻璃 ≈1' });
      ctl.button({ label: '↺ 重置', onClick: () => selectChapter(7) });
      setHint('金属是热的良导体 · 火柴按导热系数依次掉落');
    },
  },
  {
    title: '热对流',
    hasData: true,
    hud: [['st', '状态'], ['n', '示踪粒子']],
    html: `<p>液体和气体主要靠<span class="hl">热对流</span>传热：受热部分体积膨胀、密度变小而<b>上升</b>，冷的部分下沉补充，形成循环流动。紫色的高锰酸钾就是示踪剂，跟着水流画出对流环。</p>
<p>点「投入高锰酸钾」看晶粒沉底后紫色细流怎么走；切换「加热位置」看对流方向怎么变（底部加热 vs 侧面加热）；打开「流线」看流动路径；「停止加热」后流动慢慢停下来，「换一槽清水」可以重做。</p>`,
    enter() {
      hideAll();
      stCnv.group.visible = true;
      Object.assign(stCnv, { mode: 'bottom', power: 1, density: 0.6, lines: false, acc: 0, dropT: -1, tint: 0 });
      app.setCamera([0.3, 1.19, 0.82], [0.05, 0.98, 0]);
      ctl.clear();
      ctl.seg({
        options: [{ label: '底部加热', value: 'bottom' }, { label: '侧面加热', value: 'side' }],
        value: 'bottom',
        onChange: (v) => { stCnv.mode = v; },
      });
      const pSlider = ctl.slider({ label: '加热功率', min: 0, max: 2, step: 0.1, value: 1, fmt: (v) => v.toFixed(1) + '×', onInput: (v) => { stCnv.power = v; } });
      ctl.toggle({ label: '显示流线', value: false, onChange: (v) => { stCnv.lines = v; } });
      ctl.slider({ label: '粒子密度', min: 0.2, max: 1, step: 0.1, value: 0.6, fmt: (v) => v.toFixed(1), onInput: (v) => { stCnv.density = v; } });
      ctl.sep();
      ctl.button({ label: '投入高锰酸钾', onClick: () => dropGrains() });
      ctl.button({ label: '停止加热', onClick: () => { stCnv.power = 0; pSlider.set(0); toast('停止加热：没有温差驱动，对流环慢慢停下来。', ''); } });
      ctl.button({ label: '换一槽清水', onClick: () => { stCnv.tint = 0; stCnv.dropT = -1; stCnv.grainsB.visible = stCnv.mode === 'bottom'; stCnv.grainsS.visible = stCnv.mode === 'side'; resetParticles(); toast('换了一槽清水，可以重新投放晶粒。', 'ok'); } });
      ctl.button({ label: '↺ 重置', onClick: () => selectChapter(8) });
      setHint('受热膨胀密度变小 → 上升 · 冷的下沉 → 对流环');
    },
  },
  {
    title: '热辐射',
    hasData: true,
    hud: [['b', '黑罐温度'], ['w', '白罐温度'], ['diff', '温差']],
    html: `<p>红外灯不用接触、也不靠空气，直接把热<span class="hl">以电磁波的形式</span>传给罐子——这就是<b>热辐射</b>，真空里也能传（太阳的热就是这样到达地球的）。</p>
<p>黑色表面<span class="hl">吸收辐射的本领强</span>，白色表面反射强——所以黑罐升温明显比白罐快；关灯之后，<b>善于吸收的物体也善于辐射</b>，黑罐降温也更快。夏天穿浅色衣服更凉快就是这个道理。</p>
<p><b>保温瓶</b>把三种传热方式一起挡住：夹层抽成<b>真空</b>阻断传导和对流，瓶口<b>软木塞</b>减少对流与蒸发，玻璃壁<b>镀银</b>把热辐射反射回去——切到「比较保温瓶」倒上热水看降温曲线。</p>`,
    enter() {
      hideAll();
      stRadS.group.visible = true;
      Object.assign(stRadS, { exp: 'lamp', on: false, power: 1, Tb: 25, Tw: 25, Tn: 85, Tv: 85, t: 0, rec: 0 });
      applyRadExp('lamp', true);
      app.setCamera([-0.28, 1.24, 1.0], [-0.3, 1.0, 0]);
      winRad.show(true);
      ctl.clear();
      ctl.seg({
        options: [{ label: '灯照黑白罐', value: 'lamp' }, { label: '比较保温瓶', value: 'flask' }],
        value: 'lamp',
        onChange: (v) => applyRadExp(v),
      });
      ctl.toggle({ label: '红外灯', value: false, onChange: (v) => { stRadS.on = v; if (v) stRadS.t = 0; } });
      ctl.slider({ label: '灯功率', min: 0.5, max: 2, step: 0.1, value: 1, fmt: (v) => v.toFixed(1) + '×', onInput: (v) => { stRadS.power = v; } });
      ctl.button({ label: '重新倒热水', onClick: () => { stRadS.Tn = 85; stRadS.Tv = 85; stRadS.t = 0; stRadS.rec = 0; winRad.cfg.series.forEach((s) => { s.pts.length = 0; }); toast('两瓶都重新倒满 85℃ 的热水，开始记录降温。', 'ok'); } });
      ctl.toggle({ label: '温度曲线窗', value: true, onChange: (v) => { winRad.show(v); } });
      ctl.button({ label: '↺ 重置', onClick: () => selectChapter(9) });
      setHint('辐射不需介质 · 黑吸白反 · 真空阻断传导对流');
    },
  },
  {
    title: '从冰到沸腾',
    hasData: true,
    hud: [['ph', '阶段'], ['t', '温度'], ['time', '时间']],
    html: `<p>综合剧情：一块 <b>-20℃ 的冰</b> → 升温到 <b>0℃ 熔化平台</b>（吸热温度不变）→ 水升温 → <b>100℃ 沸腾平台</b>（吸热温度不变）。3D 画面里碎冰融化成水、水面上升、最后气泡翻滚。</p>
<p>完整曲线上的<b>两个平台</b>就是晶体熔化与液体沸腾的特征——两段都在吸热，热量用来改变物态而不是升温。比较平台的长短：汽化 1 kg 水约需 <b>2.26×10⁶ J</b>，熔化 1 kg 冰约需 <b>3.34×10⁵ J</b>——汽化热将近是熔化热的 <b>7 倍</b>，所以沸腾平台比熔化平台长得多。</p>
<p>冰的<b>初温</b>可调，可以随时跳转到任意阶段，或调速度观察。</p>`,
    enter() {
      hideAll();
      stSty.group.visible = true;
      Object.assign(stSty, { playing: true, speed: 1, t: 0, T: -20, ann: true, rec: 0, T0: -20, TL: calcTL(-20) });
      winStory.cfg.series[0].pts.length = 0;
      winStory.cfg.xMax = 160;
      app.setCamera([0.33, 1.22, 0.86], [0.05, 0.99, 0]);
      winStory.show(true);
      ctl.clear();
      const playBtn = ctl.button({ label: '⏸ 暂停', onClick: () => { stSty.playing = !stSty.playing; playBtn.textContent = stSty.playing ? '⏸ 暂停' : '▶ 播放'; playBtn.classList.toggle('active', !stSty.playing); } });
      playBtn.title = '播放 / 暂停（空格）';
      ctl.slider({ label: '速度', min: 0.5, max: 4, step: 0.5, value: 1, fmt: (v) => v.toFixed(1) + '×', onInput: (v) => { stSty.speed = v; } });
      const t0Slider = ctl.slider({
        label: '冰的初温', min: -30, max: 10, step: 5, value: -20, fmt: (v) => v + ' ℃',
        onInput: (v) => {
          stSty.T0 = v;
          stSty.TL = calcTL(v);
          winStory.cfg.xMax = Math.ceil((stSty.TL.p4[1] + 20) / 20) * 20;
        },
      });
      ctl.button({
        label: '从头加热',
        onClick: () => {
          stSty.t = 0; stSty.rec = 0;
          stSty.TL = calcTL(stSty.T0);
          winStory.cfg.series[0].pts.length = 0;
          stSty.playing = true;
          playBtn.textContent = '⏸ 暂停';
          playBtn.classList.remove('active');
        },
      });
      ctl.sep();
      const jumps = [['冰', () => 0], ['熔化', () => stSty.TL.p2[0]], ['水', () => stSty.TL.p3[0]], ['沸腾', () => stSty.TL.p4[0]]];
      jumps.forEach(([n, tf]) => {
        ctl.button({
          label: n,
          onClick: () => {
            stSty.t = tf(); stSty.rec = 0;
            winStory.cfg.series[0].pts.length = 0;
          },
        });
      });
      ctl.toggle({ label: '平台标注', value: true, onChange: (v) => { winStory.cfg.ann = v; } });
      ctl.button({ label: '↺ 重置', onClick: () => selectChapter(10) });
      playToggle = () => playBtn.click();
      setHint('两个平台：熔化吸热温度不变 · 沸腾吸热温度不变');
    },
  },
  {
    title: '随堂检测',
    hasData: false,
    html: `<p>5 道选择题，覆盖本节课：温度计使用、晶体熔化、蒸发致冷、沸点与气压、热传递三方式。</p>`,
    enter() {
      hideAll();
      app.setCamera([0.7, 1.5, 2.9], [0.1, 1.0, 0]);
      ctl.clear();
      showQuiz();
    },
  },
);

/* 比热容对比物切换（视觉 + 常数 + 曲线窗联动） */
function applyCpMat(key, silent) {
  const M = CP_MATS[key];
  stCp.mat = key;
  stCp.Tx = 20;
  stCp.oil.visible = key === 'oil';
  stCp.kero.visible = key === 'kero';
  stCp.sandG.visible = key === 'sand';
  setSpriteText(stCp.l2, M.name);
  winCp.cfg.series[1].label = M.name;
  winCp.cfg.series[1].color = M.series;
  winCp.cfg.series[1].pts.length = 0;
  winCp.cfg.yMax = M.yMax;
  winCp.cfg.yStep = M.yStep;
  winCp.cfg.ann = true;
  winCp.cfg.annLines = [{ y: 100, label: '水沸腾 100℃' }];
  if (!silent) {
    stCp.rec = 0;
    toast('换成' + M.name + '：相同加热条件下升温更快，看曲线斜率。', '');
  }
}

/* 热辐射两套实验切换（装置可见性 + HUD 行集 + 曲线系列名） */
const RAD_HUD_LAMP = [['b', '黑罐温度'], ['w', '白罐温度'], ['diff', '温差']];
const RAD_HUD_FLASK = [['n', '普通瓶温度'], ['v', '保温瓶温度'], ['diff', '温差']];
function applyRadExp(mode, silent) {
  stRadS.exp = mode;
  stRadS.lampG.visible = mode === 'lamp';
  stRadS.flaskG.visible = mode === 'flask';
  stRadS.t = 0; stRadS.rec = 0;
  winRad.cfg.series.forEach((s) => { s.pts.length = 0; });
  if (mode === 'lamp') {
    winRad.cfg.series[0].label = '黑罐'; winRad.cfg.series[0].color = '#444a52';
    winRad.cfg.series[1].label = '白罐'; winRad.cfg.series[1].color = '#c9ccd2';
    winRad.cfg.yMin = 20; winRad.cfg.yMax = 100; winRad.cfg.yStep = 20;
    winRad.cfg.ann = false;
    setHUD(RAD_HUD_LAMP);
    app.setCamera([-0.28, 1.24, 1.0], [-0.3, 1.0, 0]);
    if (!silent) toast('同一盏红外灯：黑罐吸热升温快，白罐反射多升温慢。', '');
  } else {
    winRad.cfg.series[0].label = '普通广口瓶'; winRad.cfg.series[0].color = '#d98a2b';
    winRad.cfg.series[1].label = '真空保温瓶'; winRad.cfg.series[1].color = '#3f8fd2';
    winRad.cfg.yMin = 20; winRad.cfg.yMax = 100; winRad.cfg.yStep = 20;
    winRad.cfg.ann = true;
    winRad.cfg.annLines = [];
    setHUD(RAD_HUD_FLASK);
    app.setCamera([0.42, 1.18, 0.82], [0.09, 1.0, 0]);
    if (!silent) toast('真空阻断传导对流、镀银反射辐射、软木塞封口——保温瓶降温慢得多。', 'ok');
  }
}

/* ---------------- 随堂检测 ---------------- */

const QUIZ = [
  {
    q: '用温度计测烧杯中热水的温度，下列做法正确的是？',
    opts: [
      '玻璃泡碰到杯底，读数更准',
      '把温度计拿出来再读数',
      '玻璃泡完全浸没、不碰底不碰壁，示数稳定后视线与液柱上表面相平读数',
      '俯视读数可以消除误差',
    ],
    a: 2,
    ex: '玻璃泡要全部浸入被测液体、不碰容器底和容器壁；示数稳定后再读，且不能离开液体；视线要与液柱上表面相平——俯视读数偏大、仰视读数偏小（口诀：俯大仰小）。',
  },
  {
    q: '海波（晶体）熔化过程中，正确的说法是？',
    opts: [
      '持续吸热，温度不断上升',
      '持续吸热，温度保持在熔点 48℃ 不变',
      '放出热量，温度不变',
      '不需要吸热，温度不变',
    ],
    a: 1,
    ex: '晶体熔化的特点：持续吸热、温度保持在熔点不变（海波熔点约 48℃）。石蜡等非晶体没有固定熔点，熔化时温度持续上升。',
  },
  {
    q: '温度计的玻璃泡包上蘸了酒精的棉团后，示数会怎样变化？',
    opts: [
      '一直升高到超过室温',
      '先降到低于室温，酒精蒸干后回升到室温',
      '保持不变',
      '迅速升到 100℃',
    ],
    a: 1,
    ex: '酒精蒸发吸热，有致冷作用，所以湿泡示数先降到低于室温；酒精蒸干后停止蒸发，示数回升到室温。开风扇加快空气流动，蒸发更快，降温更明显。',
  },
  {
    q: '在高山上用普通锅煮饭不容易熟，主要原因是？',
    opts: [
      '高山上的火力不够大',
      '气压低，水的沸点低于 100℃',
      '水的比热容变大了',
      '米饭的熔点升高了',
    ],
    a: 1,
    ex: '液体的沸点随气压降低而降低（随气压升高而升高，高压锅就是利用这个原理）。高山上气压低，水不到 100℃ 就沸腾，沸腾后温度保持在较低的沸点不再上升，饭不容易熟。',
  },
  {
    q: '冬天摸铁栏杆觉得比木栏杆凉；晒太阳身体变暖；烧水时水上下翻滚——三个场景依次属于哪种传热方式？',
    opts: [
      '热传导、热辐射、热对流',
      '热对流、热传导、热辐射',
      '热辐射、热传导、热对流',
      '热传导、热对流、热辐射',
    ],
    a: 0,
    ex: '铁是热的良导体，传导带走手上的热快（传导）；太阳的热穿过真空以电磁波形式传来（辐射，黑罐比白罐吸得多也是这个道理）；烧水时受热的水膨胀密度变小上升、冷水下沉（对流）。',
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
        card.querySelector('.q-score').textContent = '得分：' + score;
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
      <p style="color:var(--text-dim);margin:4px 0 18px">正确率 ${pct}%${pct >= 80 ? '，热与物态变化你已经掌握了！' : pct >= 60 ? '，大部分概念已经清楚，回顾一下错题。' : '，建议回到前面章节再看一遍哦。'}</p>`;
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

/* ================= 章节选择（左栏高亮迁移 + 右栏联动） ================= */

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
  if (activeSectionCleanup) { activeSectionCleanup(); activeSectionCleanup = null; }
  playToggle = null;
  setHUD(sec.hud || null);
  sec.enter();
  accSecs.controls.classList.toggle('acc-empty', !controlsEl.children.length);
  accSecs.data.classList.toggle('acc-empty', !sec.hasData);
  detailBody.scrollTop = 0;
}

/* ================= 栏折叠（左右独立 28px 竖条）× 专注模式（双栏同折）× 大屏（课堂模式） ================= */

const foldLBtn = document.getElementById('foldLBtn');
const unfoldLBtn = document.getElementById('unfoldLBtn');
const foldRBtn = document.getElementById('foldRBtn');
const unfoldRBtn = document.getElementById('unfoldRBtn');
const railNoL = document.getElementById('railNoL');
const railTitleR = document.getElementById('railTitleR');
const focusBtn = document.getElementById('focusBtn');

const FOLD_KEY = { l: 'heat.foldL', r: 'heat.foldR' };
let foldL = false;
let foldR = false;
let focusSaved = null;
try {
  foldL = localStorage.getItem(FOLD_KEY.l) === '1';
  foldR = localStorage.getItem(FOLD_KEY.r) === '1';
} catch (e) { /* localStorage 不可用时仅会话内生效 */ }

function applyFold() {
  heatShell.classList.toggle('fold-l', foldL);
  heatShell.classList.toggle('fold-r', foldR);
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
  heatShell.classList.toggle('focus-mode', on);
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

/* 右栏三块手风琴（讲解 / 控件 / 读数），localStorage 记忆、切章不重置 */

const ACC_KEYS = { lesson: 'heat.accLesson', controls: 'heat.accControls', data: 'heat.accData' };
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

/* ---------------- 原版功能块 1:1：上一/下一章节（, .）· 重做实验 · 器材名称 ·
   画质/流畅度优先 · 大屏（课堂模式）· ] 收起右侧面板 · 空格播放/暂停 ---------------- */

const chapPrev = document.getElementById('chapPrev');
const chapNext = document.getElementById('chapNext');
const resetBtn = document.getElementById('resetBtn');
const labelBtn = document.getElementById('labelBtn');
const liteBtn = document.getElementById('liteBtn');
const bigBtn = document.getElementById('bigBtn');

function gotoChapter(i) { selectChapter((i + SECTIONS.length) % SECTIONS.length); }
chapPrev.addEventListener('click', () => gotoChapter(chapterIdx - 1));
chapNext.addEventListener('click', () => gotoChapter(chapterIdx + 1));

resetBtn.addEventListener('click', () => {
  selectChapter(chapterIdx);
  toast('参数已复位，实验从头开始。', 'ok');
});

/* 器材名称：台上标签统一显隐（localStorage 记忆） */
try { labelsOn = localStorage.getItem('heat.labels') !== '0'; } catch (e) { /* 忽略 */ }
function syncLabelBtn() {
  labelBtn.classList.toggle('on', labelsOn);
  labelBtn.setAttribute('aria-pressed', String(labelsOn));
}
labelBtn.addEventListener('click', () => {
  labelsOn = !labelsOn;
  try { localStorage.setItem('heat.labels', labelsOn ? '1' : '0'); } catch (e) { /* 忽略 */ }
  applyLabels();
  syncLabelBtn();
});
syncLabelBtn();

/* 画质优先 / 流畅度优先：流畅档压低像素比（本实现阴影为烘焙贴图，
   渲染主开销在像素比——原版语义「低配设备流畅运行」用同一切换达成），localStorage 记忆 */
const LITE_KEY = 'heat.lite';
let liteMode = false;
try { liteMode = localStorage.getItem(LITE_KEY) === '1'; } catch (e) { /* 忽略 */ }
function applyLite() {
  app.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, liteMode ? 1 : 2));
  liteBtn.textContent = liteMode ? '流畅度优先' : '画质优先';
  liteBtn.classList.toggle('on', liteMode);
  liteBtn.setAttribute('aria-pressed', String(liteMode));
}
liteBtn.addEventListener('click', () => {
  liteMode = !liteMode;
  try { localStorage.setItem(LITE_KEY, liteMode ? '1' : '0'); } catch (e) { /* 忽略 */ }
  applyLite();
});
applyLite();

/* 大屏（课堂模式）：放大舞台（专注）+ 面板与讲解文字放大 */
let bigMode = false;
function applyBig() {
  document.body.classList.toggle('heat-big', bigMode);
  bigBtn.textContent = '大屏';
  bigBtn.classList.toggle('on', bigMode);
  bigBtn.setAttribute('aria-pressed', String(bigMode));
}
bigBtn.addEventListener('click', () => {
  bigMode = !bigMode;
  setFocus(bigMode);
  applyBig();
});
applyBig();

/* 键盘快捷键：, 上一章节 / . 下一章节 / ] 收起·展开右侧面板 / 空格 播放·暂停 */
window.addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const t = e.target;
  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
  if (e.key === ',') gotoChapter(chapterIdx - 1);
  else if (e.key === '.') gotoChapter(chapterIdx + 1);
  else if (e.key === ']') toggleFold('r');
  else if (e.key === ' ') {
    if (playToggle) { e.preventDefault(); playToggle(); }
  }
});

/* ================= 启动（零外部资产：背景/环境/纹理全程序化，首帧即建） ================= */

buildWorld();
buildProps();
buildStT();
buildStMelt();
buildStBoil();
buildStEvap();
buildStSub();
buildStCp();
buildStCond();
buildStConv();
buildStRad();
buildStStory();
buildBenchShadow();
applyLabels();
labReady = true;

loader.hide();
window.__eduSections = { select: selectChapter };
window.__heatDebug = { vfx, app };
selectChapter(0);
