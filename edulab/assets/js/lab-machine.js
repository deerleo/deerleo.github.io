/* EduLab · 简单机械（machine）—— Micro 级建模深改
 * =====================================================================
 * 章节：杠杆平衡条件 / 杠杆的分类 / 定滑轮与动滑轮 / 滑轮组 / 斜面 / 轮轴 /
 *       机械效率 / 生活中的机械 / 随堂检测
 *
 * 布局（micro 三件套移植）：真·三栏——左栏章节大纲（点击切章 + ‹01/09› 前后翻 +
 *   键盘 , . ← →）/ 中栏 3D 工坊舞台（切章相机飞行）/ 右栏 知识点详解 + 实验控件 +
 *   数据读数与测量记录；左右栏独立折叠（28px 竖条）+ 专注模式 + 大屏课堂模式 +
 *   右栏三块手风琴（machine.acc* 记忆，切章不重置）。
 *
 * 视觉工艺（edu-vfx 接入 + Micro 级建模密度）：
 *   - 工地/工坊语境：程序化混凝土地坪（骨料斑点 + 伸缩缝 + 斑渍 + 安全黄线）、
 *     砖垛（InstancedMesh）/ 锥桶 / 钢丝绳卷 / 工具箱（标签贴图）道具阵列，烘焙接触阴影。
 *   - 主体建模全部曲线放样或车削：撬棍（CatmullRom 变截面放样，扁嘴端 + 滚花握把）、
 *     塔吊起重臂（变宽三角桁架放样 + 腹杆阵列）、辘轳卷筒（Lathe + 螺旋缠绳管）、
 *     滑轮（Lathe 绳槽 + 叉板架 + 链环吊轴）、桔槔横木（锥形放样）、液压缸（缸筒 + 活塞杆）。
 *   - 程序化纹理：混凝土、砖面（砂浆缝 + 三孔）、木板（粗糙/刨光两档）、菱形防滑钢板、
 *     秤星铜刻度、 石纹、 LCD 吊秤屏、货签模板 —— CanvasTexture 矢量绘制 40+ 处。
 *   - 材质工艺：四级材质工厂（matCoat 烤漆 / matStd 金属分区 / matGlass 玻璃 / matGlow）+
 *     烤漆橘皮粗糙度贴图 + 滚花法线 + makeStudioEnvironment 程序化摄影棚反射。
 *   - 光照氛围：暖主光 + 冷补光 + 正面柔光 + 暖调棚拍背景（studio-warm）。
 *
 * 教学交互（原版功能块 1:1 对齐，文案全部自研改写）：
 *   - 杠杆平衡：支点滑杆 + 三种用力方向 + 下压演示，F₁/F₂/L₁/L₂ 与 F₁L₁、F₂L₂ 实时对照，
 *     力不够 600 N 时撬棍纹丝不动的卡死判定。
 *   - 杠杆分类：独轮车（砂位三选）/ 随车吊（吊重三档 + 液压缸伸缩）/ 杆秤（四样货物 +
 *     秤砣滑杆找水平），突出显示当前器械。
 *   - 定滑轮与动滑轮：双机位对比，砖数 / 拉绳偏角 / 动滑轮质量 / 摩擦四参数，
 *     弹簧拉力计 + 电子吊秤双读数，绳端距离 s 与物升 h 联动演示。
 *   - 滑轮组：n = 2..5 绕绳（偶数系定滑轮、奇数系动滑轮），绳段逐段编号，
 *     上拉 / 下拉换向，托盘砖数与动滑轮重、摩擦可调。
 *   - 斜面：跳板长度四档（高度固定 1.2 m）、四种板面（粗糙木板 / 刨光木板 / 花纹钢板 /
 *     垫滚杠）、木箱三档，重力分解箭头开关，推箱上车的做功对照与 η。
 *   - 轮轴：辘轳井全套（石砌井圈 + 木架 + 卷筒缠绳 + 摇把），R / r / 水量 / 摩擦可调，
 *     摇动动画中圈数、手走过的路、水桶升高同步读数。
 *   - 机械效率：滑轮组 / 斜面两器械复用，匀速提升（拉动）完成后「记录数据」落一行，
 *     测量记录表 + η–G 曲线（分组折线 + 图例）看物重 / 动滑轮重 / 摩擦 / 板面的影响。
 *   - 生活中的机械：塔吊（四种吊物 / 2·4 倍率吊钩组 / 变幅小车 / 力矩限制器超载报警 +
 *     起吊放下）与桔槔（配重石四档 / 拉绳放桶 / 松手提桶 / 数桶计数）。
 *   - 随堂检测：8 题覆盖杠杆 / 滑轮 / 滑轮组 / 斜面效率 / 轮轴 / 塔吊力矩。
 *
 * 全局：‹ › 或 ← → 切章 / ] 收起右栏 / R 复位视角 / ↺ 重做 / 模型标签 /
 *       画质优先与流畅度优先切换 / 大屏课堂模式。
 * =====================================================================
 */
import {
  THREE, TAU, clamp,
  createApp, makeLoader, createControlsPanel, makeHUD, makeTextSprite, setSpriteText,
} from './edu-core.js';
import {
  attachVFX, PAL,
  matCoat, matStd, matGlass,
  makeStudioEnvironment, makeWoodTexture, makeLabelTexture,
} from './edu-vfx.js';

/* ---------------- 场景与工艺接入 ---------------- */

const stage = document.getElementById('stage');
const loader = makeLoader(stage, '正在搭建工地与农家院…');
const app = createApp({
  container: stage,
  fov: 40, near: 0.1, far: 400,
  cameraPos: [10.5, 7.4, 14.5], target: [0, 2.1, 0],
  minDistance: 2, maxDistance: 90,
  exposure: 1.05,
  keepBackground: true,
});
const { scene } = app;
const vfx = attachVFX(app, 'illus', { bg: 'studio-warm' });
scene.environment = makeStudioEnvironment(app.renderer);

/* 灯光：暖主光 + 冷补光 + 正面柔光（机械金属的高光走向靠这三层） */
const keyLight = new THREE.DirectionalLight(0xffe4c4, 1.25);
keyLight.position.set(7, 11, 6.5);
scene.add(keyLight);
const fillLight = new THREE.DirectionalLight(0xcfe0ff, 0.42);
fillLight.position.set(-8, 5, -5);
scene.add(fillLight);
const frontLight = new THREE.DirectionalLight(0xf2f6ff, 0.3);
frontLight.position.set(0, 3.2, 8.5);
scene.add(frontLight);
scene.add(new THREE.AmbientLight(0x9aa0a8, 0.42));

/* ---------------- 色族（全部从 PAL 取色；派生档用 Color 运算生成） ---------------- */

const tone = (hex, mul) => {
  const c = new THREE.Color(hex);
  c.multiplyScalar(mul);
  return c.getHex();
};
const CV = {
  steel: PAL.steel,                 // 结构钢
  steelDeep: tone(PAL.steel, 0.42), // 深色机件
  chrome: PAL.centriole,            // 镀铬白
  brass: PAL.brass,                 // 黄铜
  safety: PAL.golgiHi,              // 塔吊安全黄
  craneDeep: tone(PAL.golgiHi, 0.72),
  paintOrange: PAL.mitoShell,       // 货车驾驶室橙
  paintGreen: PAL.cellWall,         // 独轮车斗漆绿
  brick: PAL.cristae,               // 砖红
  brickDeep: tone(PAL.cristae, 0.7),
  concrete: PAL.starch,             // 混凝土基底
  rockGray: tone(PAL.pili, 0.9),    // 岩石灰
  rope: PAL.flagellum,              // 麻绳
  wire: tone(PAL.steel, 0.7),       // 钢丝绳
  water: PAL.vacuole,               // 水
  wood: PAL.membraneDeep,           // 木料基色
  lcd: PAL.stroma,                  // LCD 底
  arrowF: PAL.golgiHi,              // 动力箭头（暖黄）
  arrowG: PAL.vacuole,              // 重力箭头（蓝）
  arrowN: PAL.lysosome,             // 分力箭头（洋红）
  ok: PAL.stroma,
  warn: PAL.mitoShell,
};
const css = (key, mul = 1) => '#' + new THREE.Color(CV[key]).multiplyScalar(mul).getHexString();

/* ---------------- 通用工具 ---------------- */

const mesh = (geo, mat) => new THREE.Mesh(geo, mat);
const box = (w, h, d, mat) => mesh(new THREE.BoxGeometry(w, h, d), mat);
const cyl = (rt, rb, h, mat, seg = 20) => mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const lerp = (a, b, t) => a + (b - a) * t;
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
function dataTex(w, h, draw, repeat = 1) {
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  draw(cv.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  return tex;
}
function label(text, color = '#ffe9cf', scale = 0.005) {
  return makeTextSprite(text, { fontSize: 32, color, scale, bg: 'rgba(10,14,20,0.66)' });
}
const _spriteOpt = { fontSize: 30 };
function retext(sprite, text, color) {
  setSpriteText(sprite, text, { ..._spriteOpt, color, scale: sprite.userData.scale || 0.005, bg: 'rgba(10,14,20,0.66)' });
}
/* 接触阴影贴片：径向渐变烘焙 */
function shadowBlob(radius = 1.4, alpha = 0.34) {
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
/* 圆角矩形轮廓（Shape），roundedSlab 用 */
function roundedRectShape(w, d, r) {
  const s = new THREE.Shape();
  const x = -w / 2, y = -d / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false);
  s.lineTo(x + w, y + d - r);
  s.absarc(x + w - r, y + d - r, r, 0, Math.PI / 2, false);
  s.lineTo(x + r, y + d);
  s.absarc(x + r, y + d - r, r, Math.PI / 2, Math.PI, false);
  s.lineTo(x, y + r);
  s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);
  return s;
}
/* 圆角平板（挤出 + 倒角），rot: 'flat' 平放 / 'up' 立起 */
function roundedSlab(w, d, h, r, mat, bevel = 0.015, rot = 'flat') {
  const g = new THREE.ExtrudeGeometry(roundedRectShape(w, d, r), {
    depth: h, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel,
    bevelSegments: 3, curveSegments: 14,
  });
  g.rotateX(rot === 'flat' ? -Math.PI / 2 : 0);
  if (rot === 'up') g.translate(0, 0, -h / 2);
  return mesh(g, mat);
}
/* 铭牌 / 贴花面片（多边形偏移防 z-fight） */
function decalPlane(tex, w, h) {
  const m = mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({
    map: tex, transparent: true, roughness: 0.85,
    polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1,
  }));
  return m;
}

/* ================= 程序化纹理库（工地族） ================= */

/* 混凝土：底色 + 骨料斑点 + 模板孔 + 浇筑缝 + 泛霜 */
function concreteTexture(base = '#a8a49a', w = 512, h = 512, seed = 5) {
  let s = seed;
  const rnd = () => { s = (s * 16807 + 19) % 2147483647; return s / 2147483647; };
  return canvasTex(w, h, (ctx) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 26; i++) {
      const g = ctx.createRadialGradient(rnd() * w, rnd() * h, 0, rnd() * w, rnd() * h, 40 + rnd() * 120);
      const c = rnd() > 0.5 ? '190,186,176' : '142,138,128';
      g.addColorStop(0, `rgba(${c},${0.1 + rnd() * 0.14})`);
      g.addColorStop(1, `rgba(${c},0)`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }
    for (let i = 0; i < 2400; i++) {
      ctx.fillStyle = rnd() > 0.5 ? `rgba(60,58,52,${0.05 + rnd() * 0.16})` : `rgba(224,220,208,${0.05 + rnd() * 0.13})`;
      const r = 0.6 + rnd() * 2.4;
      ctx.beginPath();
      ctx.arc(rnd() * w, rnd() * h, r, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(52,50,46,0.5)';
    for (let ry = 1; ry < 4; ry++) {
      for (let rx = 1; rx < 5; rx++) {
        const x = (rx / 5) * w + (rnd() - 0.5) * 6, y = (ry / 4) * h + (rnd() - 0.5) * 6;
        ctx.beginPath(); ctx.arc(x, y, 4.2, 0, TAU); ctx.fill();
        ctx.fillStyle = 'rgba(235,232,222,0.28)';
        ctx.beginPath(); ctx.arc(x + 1.4, y + 1.6, 2.4, 0, TAU); ctx.fill();
        ctx.fillStyle = 'rgba(52,50,46,0.5)';
      }
    }
    for (const fy of [h * 0.33, h * 0.66]) {
      ctx.fillStyle = 'rgba(70,68,62,0.34)';
      ctx.fillRect(0, fy, w, 2.4);
      ctx.fillStyle = 'rgba(238,236,228,0.2)';
      ctx.fillRect(0, fy + 2.4, w, 3.2);
    }
  });
}
/* 砖面：砖红底 + 砂浆缝 + 三圆孔 + 磨损斑 */
function brickTexture() {
  return canvasTex(128, 64, (ctx, w, h) => {
    ctx.fillStyle = css('brick');
    ctx.fillRect(0, 0, w, h);
    let s = 41;
    const rnd = () => { s = (s * 16807 + 19) % 2147483647; return s / 2147483647; };
    for (let i = 0; i < 240; i++) {
      ctx.fillStyle = rnd() > 0.5 ? `rgba(60,26,18,${0.05 + rnd() * 0.2})` : `rgba(226,150,120,${0.05 + rnd() * 0.16})`;
      ctx.beginPath();
      ctx.arc(rnd() * w, rnd() * h, 0.6 + rnd() * 2.2, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(20,14,12,0.55)';
    for (const cx of [w * 0.28, w * 0.5, w * 0.72]) {
      ctx.beginPath();
      ctx.ellipse(cx, h / 2, 8, 5, 0, 0, TAU);
      ctx.fill();
    }
    ctx.strokeStyle = 'rgba(206,196,180,0.85)';
    ctx.lineWidth = 3;
    ctx.strokeRect(1.5, 1.5, w - 3, h - 3);
  });
}
/* 花纹钢板：菱形防滑凸纹（灰度 → roughness/normal 双用） */
function treadPlateTexture() {
  return canvasTex(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#5e646c';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(200,208,218,0.62)';
    ctx.lineWidth = 7;
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 4; x++) {
        const cx = x * 64 + 32 + (y % 2) * 32, cy = y * 64 + 32;
        ctx.beginPath();
        ctx.moveTo(cx - 22, cy);
        ctx.lineTo(cx, cy - 13);
        ctx.lineTo(cx + 22, cy);
        ctx.lineTo(cx, cy + 13);
        ctx.closePath();
        ctx.stroke();
      }
    }
    let s = 77;
    const rnd = () => { s = (s * 16807 + 19) % 2147483647; return s / 2147483647; };
    for (let i = 0; i < 130; i++) {
      ctx.fillStyle = `rgba(30,32,36,${0.08 + rnd() * 0.2})`;
      ctx.fillRect(rnd() * w, rnd() * h, 2 + rnd() * 3, 2 + rnd() * 3);
    }
  });
}
/* 石纹：花岗岩底 + 矿粒 + 裂纹 */
function stoneTexture(seed = 13) {
  return canvasTex(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#8d8880';
    ctx.fillRect(0, 0, w, h);
    const rnd = mulberry32(seed);
    for (let i = 0; i < 1500; i++) {
      const v = rnd();
      ctx.fillStyle = v > 0.62 ? `rgba(228,224,214,${0.1 + rnd() * 0.24})`
        : v > 0.3 ? `rgba(88,84,76,${0.08 + rnd() * 0.2})` : `rgba(150,90,60,${0.05 + rnd() * 0.16})`;
      ctx.beginPath();
      ctx.arc(rnd() * w, rnd() * h, 0.5 + rnd() * 2.6, 0, TAU);
      ctx.fill();
    }
    ctx.strokeStyle = 'rgba(52,48,42,0.3)';
    ctx.lineWidth = 1.6;
    for (let i = 0; i < 7; i++) {
      let x = rnd() * w, y = rnd() * h;
      ctx.beginPath();
      ctx.moveTo(x, y);
      for (let k = 0; k < 5; k++) {
        x += (rnd() - 0.5) * 60; y += (rnd() - 0.5) * 60;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  });
}
/* 粗糙木板：粗木底 + 深沟 + 毛刺 + 结疤（刨光板另用淡版） */
function plankTexture(rough = true, seed = 31) {
  return canvasTex(256, 256, (ctx, w, h) => {
    const rnd = mulberry32(seed);
    ctx.fillStyle = rough ? '#9c7a4e' : '#c2a06c';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 60; i++) {
      ctx.strokeStyle = `rgba(70,48,24,${(rough ? 0.16 : 0.09) + rnd() * 0.14})`;
      ctx.lineWidth = 0.8 + rnd() * 2.4;
      const y = rnd() * h;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(w * 0.3, y + (rnd() - 0.5) * 8, w * 0.7, y + (rnd() - 0.5) * 8, w, y + (rnd() - 0.5) * 6);
      ctx.stroke();
    }
    if (rough) {
      for (let i = 0; i < 130; i++) {
        ctx.fillStyle = `rgba(56,36,18,${0.1 + rnd() * 0.2})`;
        ctx.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 2, 1 + rnd() * 4);
      }
    }
    for (let i = 0; i < 3; i++) {
      const x = rnd() * w, y = rnd() * h;
      const g = ctx.createRadialGradient(x, y, 1, x, y, 10 + rnd() * 8);
      g.addColorStop(0, 'rgba(60,38,20,0.6)');
      g.addColorStop(1, 'rgba(60,38,20,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, 18, 0, TAU); ctx.fill();
    }
  });
}
/* 烤漆橘皮粗糙度贴图 */
function paintNoiseTexture(repeat = 3) {
  return dataTex(256, 256, (ctx) => {
    const img = ctx.createImageData(256, 256);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = clamp(150 + Math.random() * 90, 0, 255);
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }, repeat);
}
/* 滚花法线贴图（握把 / 摇把防滑纹） */
function knurlNormalTexture(cols = 42, amp = 0.8) {
  const w = 512, h = 32;
  return dataTex(w, h, (ctx) => {
    for (let x = 0; x < w; x++) {
      const s = Math.sin((x / w) * cols * Math.PI * 2) * amp;
      ctx.fillStyle = `rgb(${Math.round((s * 0.5 + 0.5) * 255)},128,${Math.round(Math.sqrt(Math.max(0, 1 - s * s)) * 127 + 128)})`;
      ctx.fillRect(x, 0, 1, h);
    }
  });
}
/* 秤星铜刻度：黄铜杆面 + 星点刻度（随周长环绕） */
function steelyardTexture(maxKg = 6) {
  return canvasTex(1024, 64, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#8a6a34');
    g.addColorStop(0.5, '#c79a52');
    g.addColorStop(1, '#6e5226');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(46,32,14,0.8)';
    ctx.textAlign = 'center';
    for (let kg = 1; kg <= maxKg; kg++) {
      const x = w * 0.16 + (kg / maxKg) * w * 0.8;
      for (let d = 0; d < 4; d++) {
        const xd = x - d * (w * 0.8 / maxKg) / 4;
        ctx.fillRect(xd - 1.4, h * 0.2, 2.8, d === 0 ? h * 0.5 : h * 0.26);
      }
      ctx.font = '700 26px sans-serif';
      ctx.fillText(String(kg), x, h * 0.18);
      ctx.beginPath();
      ctx.arc(x, h * 0.78, 4.4, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < 60; i++) {
      ctx.fillStyle = 'rgba(60,44,20,0.24)';
      ctx.fillRect(Math.random() * w, Math.random() * h, 3, 1.6);
    }
  });
}
/* LCD 吊秤屏画布（数字可重绘） */
function makeLcdCanvas(initial) {
  const cv = document.createElement('canvas');
  cv.width = 256; cv.height = 128;
  const ctx = cv.getContext('2d');
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  const paint = (text) => {
    ctx.fillStyle = '#12221a';
    ctx.fillRect(0, 0, 256, 128);
    ctx.fillStyle = 'rgba(120,200,150,0.14)';
    for (let i = 0; i < 40; i++) ctx.fillRect((i * 37) % 256, (i * 61) % 128, 14, 2);
    ctx.fillStyle = '#9fe8b8';
    ctx.font = '700 64px "DejaVu Sans Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(text, 128, 78);
    ctx.font = '500 26px "PingFang SC", sans-serif';
    ctx.fillText('kg', 200, 108);
    tex.needsUpdate = true;
  };
  paint(initial);
  return { tex, paint };
}
/* 砖垛警示牌 / 货签 */
function yardSign(lines, accent = '#8a4030') {
  return decalPlane(makeLabelTexture(lines, { w: 256, h: 130, lineSizes: [38, 24], accent }), 1.1, 0.56);
}

/* ================= 材质分层（工坊族单例） ================= */

const PAINT_NOISE = paintNoiseTexture(3);
const KNURL = knurlNormalTexture();
function paintMat(color, opts = {}) {
  const m = matCoat(color, { roughness: 0.4, metalness: 0.08, clearcoat: 0.72, clearcoatRoughness: 0.26, ...opts });
  m.roughnessMap = PAINT_NOISE;
  m.envMapIntensity = 0.8;
  return m;
}
const MX = {
  chrome: matStd(CV.chrome, { roughness: 0.14, metalness: 1 }),
  satin: matStd(CV.steel, { roughness: 0.28, metalness: 0.95 }),
  forged: matStd(tone(CV.steel, 0.72), { roughness: 0.42, metalness: 0.88 }),
  dark: matStd(CV.steelDeep, { roughness: 0.5, metalness: 0.72 }),
  brass: matStd(CV.brass, { roughness: 0.3, metalness: 0.92 }),
  brassOld: matStd(tone(CV.brass, 0.78), { roughness: 0.45, metalness: 0.85 }),
  rubber: matStd(tone(CV.steelDeep, 0.55), { roughness: 0.92, metalness: 0.03 }),
  grip: matStd(tone(CV.wood, 0.5), { roughness: 0.85 }),
  brick: null,        // 启动时挂砖纹
  stone: null,
  plankRough: null,
  plankSmooth: null,
  tread: null,
  concretePad: null,
};
const woodMat = (base, seed, rough = 0.72) => {
  const tex = makeWoodTexture({ base, dark: '#4a3120', light: '#8a6640', streaks: 100, bands: 7, seed });
  const m = matStd(0xffffff, { roughness: rough, metalness: 0.03 });
  m.map = tex;
  return m;
};

/* ================= 共用小件 ================= */

/* 力箭头（+Y 为正向），set(from, to, text) */
function makeArrow(color) {
  const g = new THREE.Group();
  const hex = '#' + new THREE.Color(color).getHexString();
  const mat = new THREE.MeshBasicMaterial({ color });
  const shaft = cyl(0.05, 0.05, 1, mat, 10);
  shaft.geometry.translate(0, 0.5, 0);
  const head = mesh(new THREE.ConeGeometry(0.15, 0.34, 12), mat);
  g.add(shaft, head);
  const lbl = makeTextSprite('', { fontSize: 30, color: hex, scale: 0.0062, bg: 'rgba(12,18,26,0.68)' });
  g.add(lbl);
  const up = new THREE.Vector3(0, 1, 0), q = new THREE.Quaternion(), dir = new THREE.Vector3();
  g.set = (from, to, text) => {
    dir.subVectors(to, from);
    const len = Math.max(dir.length(), 0.01);
    q.setFromUnitVectors(up, dir.clone().normalize());
    g.quaternion.copy(q);
    g.position.copy(from);
    shaft.scale.y = Math.max(len - 0.3, 0.05);
    head.position.y = len - 0.17;
    g.visible = true;
    if (text !== undefined) setSpriteText(lbl, text, { fontSize: 30, color: hex, scale: 0.0062, bg: 'rgba(12,18,26,0.68)' });
    lbl.position.set(0, len + 0.3, 0);
  };
  g.hide = () => { g.visible = false; };
  return g;
}
/* 尺寸标注条（地面上两枚端刺 + 中间Sprite），set(x1, x2, y, text) */
function makeDim(color) {
  const g = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ color });
  const bar = box(1, 0.016, 0.016, mat);
  const t1 = box(0.016, 0.016, 0.14, mat);
  const t2 = t1.clone();
  g.add(bar, t1, t2);
  const sp = makeTextSprite('', { fontSize: 26, color: '#' + new THREE.Color(color).getHexString(), scale: 0.0052, bg: 'rgba(12,18,26,0.6)' });
  g.add(sp);
  g.set = (x1, x2, y, z, text) => {
    const mid = (x1 + x2) / 2;
    g.position.set(mid, y, z);
    bar.scale.x = Math.abs(x2 - x1);
    t1.position.x = x1 - mid; t2.position.x = x2 - mid;
    sp.position.set(0, 0.36, 0);
    if (text !== undefined) setSpriteText(sp, text, { fontSize: 26, color: '#' + new THREE.Color(color).getHexString(), scale: 0.0052, bg: 'rgba(12,18,26,0.6)' });
  };
  return g;
}
/* 直绳段：两点间拉直的细圆柱 */
function makeRope(color = CV.rope, thick = 0.035) {
  const m = mesh(new THREE.CylinderGeometry(thick, thick, 1, 8), matStd(color, { roughness: 0.9 }));
  m.geometry.translate(0, 0.5, 0);
  const d = new THREE.Vector3();
  m.set = (p1, p2) => {
    d.subVectors(p2, p1);
    m.position.copy(p1);
    m.scale.set(1, Math.max(d.length(), 0.01), 1);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize());
  };
  return m;
}
/* 绕绳：经过滑轮顶弧的管状绳（CatmullRom 过切点 + 弧顶） */
function makeWrapRope(color = CV.rope, thick = 0.03) {
  const m = new THREE.Mesh(new THREE.BufferGeometry(), matStd(color, { roughness: 0.9 }));
  m.set = (p1, C, r, p2) => {
    const dA = new THREE.Vector3().subVectors(p1, C);
    const dB = new THREE.Vector3().subVectors(p2, C);
    dA.y = Math.max(dA.y, 0.001); dB.y = Math.max(dB.y, 0.001);
    const aA = dA.clone().normalize(), aB = dB.clone().normalize();
    const A = C.clone().addScaledVector(aA, r);
    const B = C.clone().addScaledVector(aB, r);
    const midDir = aA.clone().add(aB).normalize();
    const mid = C.clone().addScaledVector(midDir, r);
    const pts = [p1, A, mid, B, p2].map((p) => p.clone());
    const curve = new THREE.CatmullRomCurve3(pts);
    const g = new THREE.TubeGeometry(curve, 28, thick, 6, false);
    m.geometry.dispose();
    m.geometry = g;
  };
  return m;
}
/* 弹簧拉力计：吊环 + 烤漆壳体 + 双面刻度窗 + 指针 + 下钩 */
function buildPullGauge(scale = 1) {
  const g = new THREE.Group();
  const shackle = mesh(new THREE.TorusGeometry(0.085, 0.022, 8, 16), MX.satin);
  shackle.position.y = 0.23;
  const body = cyl(0.18, 0.18, 0.3, paintMat(css('steelHi', 1.35), { clearcoat: 0.9 }), 22);
  const ring = mesh(new THREE.TorusGeometry(0.185, 0.024, 8, 24), MX.satin);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = -0.15;
  const dialTex = canvasTex(256, 200, (ctx, w, h) => {
    ctx.fillStyle = '#f4f0e2';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#2a2a2a';
    ctx.fillStyle = '#2a2a2a';
    ctx.textAlign = 'center';
    for (let i = 0; i <= 10; i++) {
      const x = 22 + (i / 10) * (w - 44);
      ctx.fillRect(x, 26, 3, i % 5 === 0 ? 22 : 12);
      if (i % 5 === 0) {
        ctx.font = '700 26px sans-serif';
        ctx.fillText(String(i * 100), x, 76);
      }
    }
    ctx.font = '500 22px "PingFang SC", sans-serif';
    ctx.fillText('拉力 N', w / 2, 112);
  });
  const windowM = mesh(new THREE.PlaneGeometry(0.24, 0.19), new THREE.MeshBasicMaterial({ map: dialTex }));
  windowM.rotation.y = Math.PI / 2;
  windowM.position.set(0.181, 0.02, 0);
  const needle = box(0.008, 0.14, 0.03, matStd(CV.brick, { roughness: 0.5 }));
  needle.geometry.translate(0, 0.07, 0);
  needle.rotation.z = Math.PI / 2;
  needle.position.set(0.185, -0.02, 0);
  const windowM2 = windowM.clone(); windowM2.rotation.y = -Math.PI / 2; windowM2.position.x = -0.181;
  const needle2 = needle.clone(); needle2.position.x = -0.185;
  const hookRing = mesh(new THREE.TorusGeometry(0.055, 0.018, 8, 16), MX.satin);
  hookRing.rotation.x = Math.PI / 2;
  hookRing.position.y = -0.23;
  g.add(shackle, body, ring, windowM, windowM2, needle, needle2, hookRing);
  g.userData = {
    needles: [needle, needle2],
    setForce(f) {
      const ang = clamp(f / 1000, 0, 1) * 2.4 - 1.2;
      for (const n of this.needles) n.rotation.z = Math.PI / 2 + ang;
    },
  };
  g.scale.setScalar(scale);
  return g;
}
/* 电子吊秤：扁壳体 + LCD 双面屏 + 上下吊环 */
function makeDigitalScale() {
  const g = new THREE.Group();
  const topRing = mesh(new THREE.TorusGeometry(0.07, 0.02, 8, 16), MX.satin);
  topRing.position.y = 0.2;
  const body = roundedSlab(0.4, 0.16, 0.24, 0.06, MX.dark, 0.02, 'flat');
  body.rotation.x = 0;
  body.position.y = 0;
  const eye = mesh(new THREE.TorusGeometry(0.05, 0.016, 8, 14), MX.satin);
  eye.position.y = -0.16;
  const lcd = makeLcdCanvas('0');
  const winMat = new THREE.MeshBasicMaterial({ map: lcd.tex });
  const winL = mesh(new THREE.PlaneGeometry(0.3, 0.15), winMat);
  winL.position.set(0, 0, 0.081);
  const winR = winL.clone(); winR.rotation.y = Math.PI; winR.position.z = -0.081;
  g.add(topRing, body, eye, winL, winR);
  g.userData = { lcd, set(kg) { this.lcd.paint(kg.toFixed(0)); } };
  return g;
}
/* 滑轮：Lathe 绳槽轮体 + 轮毂 + 轴 + 双叉板 + 吊环（r=槽半径） */
function makeSheave(r = 0.3, cheek = true) {
  const g = new THREE.Group();
  const prof = [
    new THREE.Vector2(0.001, 0),
    new THREE.Vector2(r * 0.42, 0),
    new THREE.Vector2(r * 0.52, r * 0.1),
    new THREE.Vector2(r * 0.56, r * 0.4),
    new THREE.Vector2(r * 0.7, r * 0.5),
    new THREE.Vector2(r * 0.8, r * 0.44),
    new THREE.Vector2(r * 0.82, r * 0.34),
    new THREE.Vector2(r * 0.98, r * 0.4),
    new THREE.Vector2(r, r * 0.2),
    new THREE.Vector2(r * 0.98, 0.0),
  ];
  const wheel = mesh(new THREE.LatheGeometry(prof, 30), matStd(tone(CV.brass, 0.9), { roughness: 0.4, metalness: 0.75 }));
  g.add(wheel);
  const hub = cyl(r * 0.2, r * 0.2, r * 0.52, MX.dark, 14);
  hub.rotation.x = Math.PI / 2;
  g.add(hub);
  const axle = cyl(r * 0.08, r * 0.08, r * 0.95, MX.chrome, 10);
  axle.rotation.x = Math.PI / 2;
  g.add(axle);
  if (cheek) {
    const cp = new THREE.Shape();
    cp.moveTo(-r * 0.5, -r * 1.7);
    cp.lineTo(r * 0.5, -r * 1.7);
    cp.lineTo(r * 0.5, r * 0.4);
    cp.lineTo(r * 1.18, r * 0.4);
    cp.lineTo(r * 1.18, r * 0.62);
    cp.lineTo(-r * 0.5, r * 0.62);
    cp.closePath();
    const cg = new THREE.ExtrudeGeometry(cp, { depth: r * 0.07, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 2 });
    const cMat = paintMat(css('craneDeep', 1), { metalness: 0.2 });
    const c1 = mesh(cg, cMat); c1.position.z = -r * 0.62;
    const c2 = mesh(cg, cMat); c2.position.z = r * 0.55;
    g.add(c1, c2);
    const hanger = mesh(new THREE.TorusGeometry(r * 0.34, r * 0.075, 8, 18), MX.satin);
    hanger.position.y = r * 0.92;
    g.add(hanger);
  }
  g.userData.r = r;
  return g;
}
/* 起重钩：锻弯钩身 + 钩尖 + 压板吊轴 */
function makeHook(s = 1) {
  const g = new THREE.Group();
  const arc = mesh(new THREE.TorusGeometry(0.11, 0.038, 10, 22, Math.PI * 1.28), MX.forged);
  arc.rotation.z = Math.PI * 0.86;
  arc.position.y = -0.1;
  const tip = mesh(new THREE.SphereGeometry(0.04, 10, 8), MX.forged);
  tip.position.set(0.115, -0.205, 0);
  const top = cyl(0.03, 0.03, 0.12, MX.satin, 10);
  top.position.y = 0.06;
  const nut = cyl(0.05, 0.05, 0.045, MX.brass, 6);
  nut.position.y = 0.14;
  g.add(arc, tip, top, nut);
  g.scale.setScalar(s);
  return g;
}
/* 砖：单块造型（圆角 + 三孔观感靠贴图），stack 用 InstancedMesh 摆垛 */
let _brickGeo = null;
function brickGeo() {
  if (!_brickGeo) _brickGeo = new THREE.BoxGeometry(0.5, 0.24, 0.24);
  return _brickGeo;
}
function brickStack(count, mat, perRow = count > 12 ? 6 : 5) {
  const im = new THREE.InstancedMesh(brickGeo(), mat, Math.max(count, 1));
  const m4 = new THREE.Matrix4();
  const rows = Math.ceil(count / perRow);
  let i = 0;
  for (let r = 0; r < rows; r++) {
    const cols = Math.min(perRow, count - r * perRow);
    for (let c = 0; c < cols && i < count; c++, i++) {
      m4.makeTranslation((c - (cols - 1) / 2) * 0.52 + (r % 2) * 0.04, 0.12 + r * 0.25, (r % 2) * 0.05);
      im.setMatrixAt(i, m4);
    }
  }
  im.count = count;
  im.instanceMatrix.needsUpdate = true;
  return im;
}
/* 木箱：板条箱体 + 铁皮护角 + 钢印模板字 */
function makeCrate(s = 0.8, caption = '木箱') {
  const g = new THREE.Group();
  const tex = plankTexture(true, 51);
  const bodyMat = matStd(0xffffff, { roughness: 0.85 });
  bodyMat.map = tex;
  const body = box(s, s, s, bodyMat);
  body.position.y = s / 2;
  g.add(body);
  const bandMat = matStd(tone(CV.steelDeep, 0.8), { roughness: 0.5, metalness: 0.6 });
  for (const ys of [s * 0.18, s * 0.82]) {
    const band = box(s * 1.02, s * 0.09, s * 1.02, bandMat);
    band.position.y = ys;
    g.add(band);
  }
  const stencil = decalPlane(makeLabelTexture([caption, 'HANDLE · CARE'], { w: 220, h: 110, lineSizes: [34, 20], accent: '#6e4a26' }), s * 0.62, s * 0.31);
  stencil.position.set(0, s * 0.52, s / 2 + 0.006);
  g.add(stencil);
  return g;
}
/* 铁皮水桶：桶身（下窄上宽）+ 两道箍 + 提梁 + 水面 */
function makePail(r = 0.2, withWater = true) {
  const g = new THREE.Group();
  const body = mesh(new THREE.CylinderGeometry(r, r * 0.78, r * 1.6, 18), galvanizedMat());
  body.position.y = r * 0.8;
  g.add(body);
  for (const hy of [r * 0.34, r * 1.28]) {
    const hoop = mesh(new THREE.TorusGeometry(hy === r * 0.34 ? r * 0.845 : r * 1.015, 0.014, 6, 24), MX.dark);
    hoop.rotation.x = Math.PI / 2;
    hoop.position.y = hy;
    g.add(hoop);
  }
  const bail = mesh(new THREE.TorusGeometry(r * 1.02, 0.014, 6, 20, Math.PI), MX.satin);
  bail.position.y = r * 1.3;
  g.add(bail);
  if (withWater) {
    const water = cyl(r * 0.92, r * 0.74, 0.02, waterMat(), 18);
    water.position.y = r * 1.16;
    g.add(water);
    g.userData.water = water;
  }
  g.userData.h = r * 1.62;
  return g;
}
let _galvMat = null, _waterMat = null;
function galvanizedMat() {
  if (!_galvMat) {
    _galvMat = matStd(tone(CV.chrome, 0.9), { roughness: 0.42, metalness: 0.85 });
    _galvMat.roughnessMap = paintNoiseTexture(6);
  }
  return _galvMat;
}
function waterMat() {
  if (!_waterMat) {
    _waterMat = new THREE.MeshPhysicalMaterial({
      color: CV.water, transparent: true, opacity: 0.78, roughness: 0.12, metalness: 0.05,
    });
  }
  return _waterMat;
}
/* 托盘（滑轮组 / 塔吊用）：木板条 + 纵梁 */
function makePallet(w = 1.3) {
  const g = new THREE.Group();
  const plankMatT = woodMat('#8a6440', 67, 0.8);
  for (let i = 0; i < 5; i++) {
    const p = box(w, 0.05, 0.16, plankMatT);
    p.position.set(0, 0.1, -w / 2 + 0.14 + i * (w - 0.28) / 4);
    g.add(p);
  }
  for (const zs of [-w / 2 + 0.14, 0, w / 2 - 0.14]) {
    const beam = box(w, 0.1, 0.12, woodMat('#6e4c2c', 68, 0.82));
    beam.position.set(0, 0.02, zs);
    g.add(beam);
  }
  return g;
}

/* ================= 工地地面与道具阵列（全章共享语境） ================= */

const world = new THREE.Group();
scene.add(world);

{
  const padTex = concreteTexture('#9a978c', 512, 512, 5);
  padTex.wrapS = padTex.wrapT = THREE.RepeatWrapping;
  padTex.repeat.set(7, 5);
  const padMat = matStd(0xffffff, { roughness: 0.94, metalness: 0.02 });
  padMat.map = padTex;
  const pad = mesh(new THREE.PlaneGeometry(42, 30), padMat);
  pad.rotation.x = -Math.PI / 2;
  scene.add(pad);
  /* 地坪外的碎石土肩 */
  const vergeTex = plankTexture(true, 91);
  vergeTex.wrapS = vergeTex.wrapT = THREE.RepeatWrapping;
  vergeTex.repeat.set(10, 8);
  const vergeMat = matStd(tone(CV.rockGray, 0.6), { roughness: 0.97 });
  vergeMat.map = vergeTex;
  const verge = mesh(new THREE.PlaneGeometry(120, 90), vergeMat);
  verge.rotation.x = -Math.PI / 2;
  verge.position.y = -0.06;
  scene.add(verge);
  /* 安全黄线（贴花） */
  const lineTex = canvasTex(64, 8, (ctx) => {
    ctx.fillStyle = '#d8b23a';
    ctx.fillRect(0, 0, 64, 8);
    ctx.clearRect(24, 0, 16, 8);
  });
  lineTex.wrapS = THREE.RepeatWrapping;
  lineTex.repeat.set(24, 1);
  const line = mesh(new THREE.PlaneGeometry(40, 0.3), new THREE.MeshBasicMaterial({
    map: lineTex, transparent: true, opacity: 0.7, depthWrite: false,
  }));
  line.rotation.x = -Math.PI / 2;
  line.position.set(0, 0.012, 6.4);
  scene.add(line);
}

/* 道具阵列（场地后缘，各章共享语境） */
const propsGroup = new THREE.Group();
scene.add(propsGroup);
const equipLabels = [];
let brickMatShared = null;
{
  brickMatShared = matStd(0xffffff, { roughness: 0.9 });
  brickMatShared.map = brickTexture();
  MX.brick = brickMatShared;

  /* 砖垛 ×2（InstancedMesh 垛） */
  const s1 = brickStack(24, brickMatShared);
  s1.position.set(-7.6, 0, -6.2);
  propsGroup.add(s1);
  const s2 = brickStack(15, brickMatShared);
  s2.position.set(-6.6, 0, -7.1);
  s2.rotation.y = 0.3;
  propsGroup.add(s2);
  const p1 = makePallet(1.5);
  p1.position.set(-7.6, 0, -6.2);
  propsGroup.add(p1);

  /* 锥桶 ×2 */
  const coneGeoProf = [
    new THREE.Vector2(0.02, 0.62), new THREE.Vector2(0.14, 0.5),
    new THREE.Vector2(0.15, 0.46), new THREE.Vector2(0.3, 0.05),
    new THREE.Vector2(0.34, 0.02), new THREE.Vector2(0.34, 0), new THREE.Vector2(0.02, 0),
  ];
  const coneMat = paintMat(css('warn', 1), { roughness: 0.5 });
  for (const [x, z] of [[5.8, -6.4], [6.9, -5.6]]) {
    const cone = mesh(new THREE.LatheGeometry(coneGeoProf, 18), coneMat);
    cone.position.set(x, 0, z);
    propsGroup.add(cone);
    const band = cyl(0.165, 0.19, 0.09, matStd(css('chrome', 1), { roughness: 0.5 }), 16);
    band.position.set(x, 0.36, z);
    propsGroup.add(band);
  }

  /* 钢丝绳卷：三圈 Torus 叠放 */
  const coilMat = matStd(CV.wire, { roughness: 0.6, metalness: 0.7 });
  for (let i = 0; i < 3; i++) {
    const ring = mesh(new THREE.TorusGeometry(0.34 - i * 0.045, 0.028, 8, 30), coilMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(8.2, 0.03 + i * 0.055, -6.6);
    ring.rotation.z = i * 0.7;
    propsGroup.add(ring);
  }

  /* 工具箱：箱体 + 竖纹 + 标签 */
  const tb = new THREE.Group();
  const shellM = paintMat(css('warn', 0.85), { roughness: 0.42 });
  const shell = roundedSlab(1.0, 0.5, 0.44, 0.07, shellM, 0.02, 'flat');
  shell.position.y = 0.24;
  tb.add(shell);
  const lid = roundedSlab(1.02, 0.52, 0.1, 0.05, shellM, 0.015, 'flat');
  lid.position.y = 0.5;
  lid.rotation.z = 0.06;
  tb.add(lid);
  const latch = box(0.1, 0.06, 0.05, MX.brass);
  latch.position.set(0, 0.46, 0.26);
  tb.add(latch);
  const tbSign = decalPlane(makeLabelTexture(['工 具 箱', 'TOOLS'], { w: 200, h: 96, lineSizes: [32, 20], accent: '#7a5410' }), 0.62, 0.3);
  tbSign.position.set(0, 0.3, 0.256);
  tb.add(tbSign);
  tb.position.set(2.6, 0, -6.8);
  tb.rotation.y = -0.24;
  propsGroup.add(tb);

  /* 油桶 */
  const drum = cyl(0.32, 0.32, 0.86, matStd(tone(PAL.thylakoid, 1.1), { roughness: 0.55, metalness: 0.3 }), 20);
  drum.position.set(-4.6, 0.43, -6.9);
  propsGroup.add(drum);
  for (const hy of [0.22, 0.43, 0.64]) {
    const hoop = mesh(new THREE.TorusGeometry(0.325, 0.016, 6, 24), MX.dark);
    hoop.rotation.x = Math.PI / 2;
    hoop.position.set(-4.6, hy, -6.9);
    propsGroup.add(hoop);
  }

  /* 砂堆 */
  const sandGeo = new THREE.ConeGeometry(1.0, 0.62, 22, 1);
  const sandPos = sandGeo.attributes.position;
  const sandSeed = mulberry32(8);
  for (let i = 0; i < sandPos.count; i++) {
    sandPos.setX(i, sandPos.getX(i) * (1 + (sandSeed() - 0.5) * 0.2));
    sandPos.setZ(i, sandPos.getZ(i) * (1 + (sandSeed() - 0.5) * 0.2));
  }
  sandGeo.computeVertexNormals();
  const sandMat = matStd(css('rockGray', 1.12), { roughness: 0.97 });
  sandMat.map = plankTexture(true, 92);
  const sand = mesh(sandGeo, sandMat);
  sand.position.set(10.4, 0.3, -6.4);
  propsGroup.add(sand);

  const lblBricks = label('砖垛 · 标准砖', '#dfe8ee', 0.0036);
  lblBricks.position.set(-7.6, 1.3, -6.2);
  const lblCoil = label('钢丝绳卷', '#dfe8ee', 0.0036);
  lblCoil.position.set(8.2, 0.9, -6.6);
  propsGroup.add(lblBricks, lblCoil);
  equipLabels.push(lblBricks, lblCoil);
  propsGroup.add(shadowBlob(2.4, 0.3)).children.at(-1).position.set(-7.6, 0.01, -6.2);
  const sh2 = shadowBlob(1.2, 0.3); sh2.position.set(8.2, 0.01, -6.6); propsGroup.add(sh2);
  const sh3 = shadowBlob(0.7, 0.28); sh3.position.set(2.6, 0.01, -6.8); propsGroup.add(sh3);
  const sh4 = shadowBlob(0.7, 0.3); sh4.position.set(-4.6, 0.01, -6.9); propsGroup.add(sh4);
  const sh5 = shadowBlob(1.5, 0.26); sh5.position.set(10.4, 0.01, -6.4); propsGroup.add(sh5);
}

/* ================= 章节注册（懒建 + 显隐切换） ================= */

const scenes = {};
let activeScene = null;
function useScene(key, build) {
  if (activeScene && activeScene !== scenes[key]) activeScene.visible = false;
  if (!scenes[key]) {
    const g = new THREE.Group();
    g.visible = false;
    world.add(g);
    scenes[key] = g;
  }
  const g = scenes[key];
  if (!g.userData.built) { build(g); g.userData.built = true; }
  g.visible = true;
  activeScene = g;
  return g;
}

/* ============ 01 杠杆平衡（撬棍撬石） ============ */

const LEV = {
  pivot: -1.2, dir: 'down', press: 0, pressing: false,
  G: 1200,   // 石块压撬棍尖的阻力（约为 600 kg 石块对撬棍的作用力折算）
};
function buildLever(g) {
  /* 巨石：二十面体 + fbm 顶点扰动 + 石纹 */
  const rockGeo = new THREE.IcosahedronGeometry(0.72, 2);
  const rp = rockGeo.attributes.position;
  for (let i = 0; i < rp.count; i++) {
    const x = rp.getX(i), y = rp.getY(i), z = rp.getZ(i);
    const n = 0.14 * Math.sin(x * 5.3 + z * 3.1) * Math.cos(y * 4.2 - x * 2.2)
      + 0.05 * Math.sin(y * 11.1 + z * 7.7);
    const k = 1 + n;
    rp.setXYZ(i, x * k, y * k, z * k);
  }
  rockGeo.computeVertexNormals();
  if (!MX.stone) {
    MX.stone = matStd(0xffffff, { roughness: 0.95 });
    MX.stone.map = stoneTexture(13);
  }
  LEV.rock = mesh(rockGeo, MX.stone);
  LEV.rock.position.set(-3.2, 0.62, 0);
  LEV.rock.rotation.set(0.3, 0.7, 0.12);
  g.add(LEV.rock);
  const rock2 = mesh(new THREE.DodecahedronGeometry(0.3, 1), MX.stone);
  rock2.position.set(-4.4, 0.26, -0.8);
  rock2.rotation.set(0.4, 1.2, 0.2);
  g.add(rock2);
  g.add(shadowBlob(1.9, 0.4)).children;
  const shRock = g.children.at(-1);
  shRock.position.set(-3.2, 0.012, 0);

  /* 垫石支座：楔形石块（挤出梯形 + 顶槽） */
  const wedgeShape = new THREE.Shape();
  wedgeShape.moveTo(-0.34, 0);
  wedgeShape.lineTo(0.34, 0);
  wedgeShape.lineTo(0.2, 0.86);
  wedgeShape.lineTo(-0.2, 0.86);
  wedgeShape.closePath();
  const wedgeGeo = new THREE.ExtrudeGeometry(wedgeShape, { depth: 0.5, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 2 });
  wedgeGeo.rotateY(Math.PI / 2);
  wedgeGeo.translate(0, 0, -0.25);
  LEV.fulcrum = mesh(wedgeGeo, MX.stone);
  g.add(LEV.fulcrum);
  const shWedge = shadowBlob(0.9, 0.34);
  shWedge.position.set(0, 0.012, 0);
  g.add(shWedge);

  /* 撬棍：CatmullRom 变截面放样（扁嘴端 → 圆杆 → 握把端），杆体绕支点转 */
  LEV.barGroup = new THREE.Group();
  g.add(LEV.barGroup);
  const curve = new THREE.CatmullRomCurve3([
    V3(-3.35, 1.06, 0), V3(-2.2, 1.02, 0), V3(-0.6, 1.0, 0),
    V3(1.2, 1.0, 0), V3(2.6, 1.02, 0), V3(3.2, 1.0, 0),
  ]);
  const barGeo = sweepBar(curve, 64);
  LEV.bar = mesh(barGeo, MX.forged);
  LEV.barGroup.add(LEV.bar);
  /* 扁嘴端帽（更薄的劈口） */
  const tipCap = box(0.1, 0.035, 0.07, MX.dark);
  tipCap.position.set(-3.38, 1.06, 0);
  LEV.barGroup.add(tipCap);
  /* 滚花握把套 */
  const grip = cyl(0.075, 0.075, 0.62, MX.grip, 16);
  grip.rotation.z = Math.PI / 2;
  grip.position.set(2.75, 1.01, 0);
  grip.material.normalMap = KNURL;
  grip.material.normalScale = new THREE.Vector2(0.8, 0.8);
  LEV.barGroup.add(grip);
  const collar1 = cyl(0.082, 0.082, 0.05, MX.brass, 14);
  collar1.rotation.z = Math.PI / 2;
  collar1.position.set(2.42, 1.01, 0);
  const collar2 = collar1.clone();
  collar2.position.x = 3.08;
  LEV.barGroup.add(collar1, collar2);
  /* 弯钩端（防止手滑的小弯） */
  const bend = new THREE.CatmullRomCurve3([V3(3.2, 1.0, 0), V3(3.42, 1.04, 0), V3(3.5, 1.2, 0)]);
  const bendM = mesh(new THREE.TubeGeometry(bend, 10, 0.05, 10, false), MX.forged);
  LEV.barGroup.add(bendM);
  const shBar = shadowBlob(4.6, 0.22);
  shBar.scale.set(1, 0.24, 1);
  shBar.position.set(-0.2, 0.012, 0);
  g.add(shBar);

  /* 拉力计（把手端）+ 石块上重力箭头 + 力臂标注 */
  LEV.gauge = buildPullGauge(0.85);
  LEV.barGroup.add(LEV.gauge);
  LEV.handArrow = makeArrow(CV.arrowF);
  g.add(LEV.handArrow);
  LEV.gArrow = makeArrow(CV.arrowG);
  g.add(LEV.gArrow);
  LEV.l1 = makeDim(0xffb46e);
  LEV.l2 = makeDim(0x8fc6ff);
  g.add(LEV.l1, LEV.l2);
  LEV.tFul = label('支点 O', '#ffd9a8', 0.0042);
  g.add(LEV.tFul);
  LEV.tBar = label('撬棍', '#dfe8ee', 0.0036);
  g.add(LEV.tBar);
  LEV.tRock = label('石块', '#dfe8ee', 0.0036);
  g.add(LEV.tRock);
  equipLabels.push(LEV.tFul, LEV.tBar, LEV.tRock);
  updLever();
}
/** 撬棍变截面放样：圆角超椭圆截面，宽度沿曲线关键帧插值 */
function sweepBar(curve, segs) {
  const wKeys = [[0, 0.19], [0.1, 0.13], [0.5, 0.115], [0.86, 0.13], [1, 0.15]];
  const dKeys = [[0, 0.055], [0.1, 0.1], [0.5, 0.115], [1, 0.13]];
  const keyAt = (keys, t) => {
    if (t <= keys[0][0]) return keys[0][1];
    for (let i = 0; i < keys.length - 1; i++) {
      const [a, va] = keys[i], [b, vb] = keys[i + 1];
      if (t <= b) {
        const k = (t - a) / Math.max(b - a, 1e-6);
        return va + (vb - va) * (k * k * (3 - 2 * k));
      }
    }
    return keys[keys.length - 1][1];
  };
  const pts = curve.getPoints(segs);
  const ringM = 14;
  const ring = [];
  for (let k = 0; k < ringM; k++) {
    const th = (k / ringM) * TAU;
    const cx = Math.cos(th), sy = Math.sin(th);
    ring.push([Math.sign(cx) * Math.pow(Math.abs(cx), 0.4), Math.sign(sy) * Math.pow(Math.abs(sy), 0.4)]);
  }
  const pos = [], idx = [];
  const uAxis = new THREE.Vector3(0, 0, 1);
  for (let i = 0; i <= segs; i++) {
    const t = i / segs, p = pts[i];
    const T = new THREE.Vector3().subVectors(pts[Math.min(segs, i + 1)], pts[Math.max(0, i - 1)]).normalize();
    const vAxis = new THREE.Vector3().crossVectors(T, uAxis).normalize();
    const w = keyAt(wKeys, t) / 2, d = keyAt(dKeys, t) / 2;
    for (let k = 0; k < ringM; k++) {
      const [ux, vy] = ring[k];
      pos.push(
        p.x + uAxis.x * ux * w + vAxis.x * vy * d,
        p.y + uAxis.y * ux * w + vAxis.y * vy * d,
        p.z + uAxis.z * ux * w + vAxis.z * vy * d,
      );
    }
  }
  for (let i = 0; i < segs; i++) {
    for (let k = 0; k < ringM; k++) {
      const k1 = (k + 1) % ringM;
      const a = i * ringM + k, b = (i + 1) * ringM + k, c = (i + 1) * ringM + k1, dd = i * ringM + k1;
      idx.push(a, b, c, a, c, dd);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}
function updLever() {
  const F = LEV.pivot;
  const L1eff = (3.2 - F) * (LEV.dir === 'slant' ? Math.cos(Math.PI / 6) : 1);
  const L2 = F + 3.2;
  const F2 = LEV.G;
  const F1need = F2 * L2 / L1eff;
  const stuck = F1need > 600;
  const th = LEV.press * 0.135;
  /* 撬棍整体绕支点顶（O 点）转动 */
  LEV.barGroup.position.set(F, 0.87, 0);
  LEV.barGroup.rotation.z = -th;
  LEV.fulcrum.position.set(F, 0, 0);
  LEV.tFul.position.set(F, 1.35, 0.4);
  /* 石块被撬端顶起（随杆端位移 + 轻微滚转） */
  const tipUp = Math.sin(th) * (3.2 - F);
  LEV.rock.position.y = 0.62 + Math.max(tipUp, 0);
  LEV.rock.rotation.z = -Math.max(tipUp, 0) * 0.35;
  /* 手端下压量 */
  const handDown = Math.sin(th) * (3.2 + F);
  const gripWorldX = F + Math.cos(th) * 2.75;
  const gripWorldY = 0.87 + Math.sin(-th) * 2.75;
  /* 拉力计挂在弯钩端 */
  LEV.gauge.position.set(3.5, 0.2, 0);
  LEV.gauge.rotation.z = -th;
  /* 力箭头：手端动力（方向随用力方式）+ 石块重力 */
  const fShow = stuck ? 620 : F1need;
  LEV.gauge.userData.setForce(fShow);
  const fScale = 0.7 + Math.min(F1need, 900) / 900;
  if (LEV.dir === 'down') {
    LEV.handArrow.set(V3(gripWorldX, gripWorldY + 0.4 + fScale, 0), V3(gripWorldX, gripWorldY + 0.4, 0),
      (stuck ? '>600' : F1need.toFixed(0)) + ' N');
  } else if (LEV.dir === 'perp') {
    LEV.handArrow.set(V3(gripWorldX + Math.sin(th) * fScale, gripWorldY + Math.cos(th) * fScale, 0),
      V3(gripWorldX, gripWorldY, 0), (stuck ? '>600' : F1need.toFixed(0)) + ' N');
  } else {
    LEV.handArrow.set(V3(gripWorldX + 0.5 * fScale, gripWorldY + 0.86 * fScale, 0),
      V3(gripWorldX, gripWorldY, 0), (stuck ? '>600' : F1need.toFixed(0)) + ' N');
  }
  LEV.gArrow.set(V3(-3.2, LEV.rock.position.y + 1.6, 0), V3(-3.2, LEV.rock.position.y + 0.85, 0),
    'G=' + (F2 * 2).toFixed(0) + ' N');
  LEV.l1.set(F, 3.2, 0.03, 0.9, 'L₁=' + L1eff.toFixed(2) + ' m');
  LEV.l2.set(-3.2, F, 0.03, 0.9, 'L₂=' + L2.toFixed(2) + ' m');
  LEV.tBar.position.set(0.2, 1.9, 0);
  LEV.tRock.position.set(-3.2, LEV.rock.position.y + 1.0, 0);
  hset('f1', stuck ? '>600 N（拉不动）' : F1need.toFixed(0) + ' N');
  hset('f2', F2.toFixed(0) + ' N');
  hset('l1', L1eff.toFixed(2) + ' m' + (LEV.dir === 'slant' ? '（斜拉变短）' : ''));
  hset('l2', L2.toFixed(2) + ' m');
  hset('m1', stuck ? '—（未撬动）' : (F1need * L1eff).toFixed(0) + ' N·m');
  hset('m2', stuck ? '—（未撬动）' : (F2 * L2).toFixed(0) + ' N·m');
}

/* ============ 02 杠杆的分类（独轮车 / 随车吊 / 杆秤） ============ */

const KND = {
  kind: 'wheelbarrow', mLoad: 60, pos: 'mid', jibLoad: 600,
  item: 'rice', load: 3, slider: 0.55, tilt: 0, tiltDir: 0, pumping: false,
};
function buildKinds(g) {
  KND.stations = {};
  /* —— 独轮车 —— */
  {
    const s = new THREE.Group();
    s.position.set(-4.8, 0, 0.6);
    g.add(s);
    const paintG = paintMat(css('paintGreen', 1), { roughness: 0.42 });
    /* 车轮：轮胎 + 辐条 + 毂 */
    const wheel = new THREE.Group();
    const tire = mesh(new THREE.TorusGeometry(0.32, 0.09, 12, 30), MX.rubber);
    wheel.add(tire);
    const hubC = cyl(0.1, 0.1, 0.12, MX.dark, 14);
    hubC.rotation.x = Math.PI / 2;
    wheel.add(hubC);
    for (let i = 0; i < 6; i++) {
      const sp = box(0.028, 0.5, 0.028, MX.satin);
      sp.rotation.z = (i / 6) * Math.PI;
      wheel.add(sp);
    }
    wheel.rotation.y = Math.PI / 2;
    wheel.position.set(0, 0.41, 0);
    s.add(wheel);
    KND.wheel = wheel;
    /* 车斗：梯形斗（挤出）+ 车架 + 支腿 + 把手 */
    const trayShape = new THREE.Shape();
    trayShape.moveTo(-0.62, 0);
    trayShape.lineTo(0.62, 0);
    trayShape.lineTo(0.44, 0.3);
    trayShape.lineTo(-0.44, 0.3);
    trayShape.closePath();
    const trayGeo = new THREE.ExtrudeGeometry(trayShape, { depth: 0.62, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 2 });
    trayGeo.translate(0, 0, -0.31);
    const tray = mesh(trayGeo, paintG);
    tray.position.set(0.25, 0.52, 0);
    s.add(tray);
    KND.tray = tray;
    const sandMatS = matStd(css('rockGray', 1.1), { roughness: 0.97 });
    KND.sand = mesh(new THREE.ConeGeometry(0.3, 0.2, 14), sandMatS);
    KND.sand.position.set(0.25, 0.86, 0);
    s.add(KND.sand);
    const frame1 = box(1.7, 0.05, 0.05, woodMat('#7a5a38', 71, 0.7));
    frame1.position.set(0.45, 0.42, 0.22);
    const frame2 = frame1.clone(); frame2.position.z = -0.22;
    s.add(frame1, frame2);
    for (const zs of [0.22, -0.22]) {
      const leg = box(0.045, 0.4, 0.045, woodMat('#7a5a38', 72, 0.7));
      leg.position.set(1.05, 0.2, zs);
      leg.rotation.z = 0.12;
      s.add(leg);
      const gripH = cyl(0.032, 0.032, 0.2, MX.rubber, 12);
      gripH.rotation.z = Math.PI / 2;
      gripH.position.set(1.62, 0.62, zs);
      s.add(gripH);
    }
    const shW = shadowBlob(1.6, 0.34);
    shW.position.set(0.2, 0.012, 0);
    s.add(shW);
    KND.stations.wheelbarrow = s;
  }
  /* —— 随车吊 —— */
  {
    const s = new THREE.Group();
    s.position.set(0.2, 0, 0);
    g.add(s);
    const truckM = paintMat(css('paintOrange', 1), { roughness: 0.4 });
    /* 底盘 + 驾驶室 + 货台 + 车轮 */
    const chassis = box(4.4, 0.14, 1.1, MX.dark);
    chassis.position.y = 0.5;
    s.add(chassis);
    const cab = roundedSlab(1.0, 1.24, 0.9, 0.12, truckM, 0.03, 'flat');
    cab.position.set(-1.7, 0.98, 0);
    s.add(cab);
    const windshield = box(0.06, 0.42, 1.0, matGlass(css('chrome', 0.85), { opacity: 0.7 }));
    windshield.position.set(-1.18, 1.18, 0);
    windshield.rotation.z = -0.14;
    s.add(windshield);
    const grille = box(0.08, 0.3, 1.0, MX.dark);
    grille.position.set(-2.22, 0.72, 0);
    s.add(grille);
    for (const hx of [-2.18, 2.2]) {
      for (const hz of [0.42, -0.42]) {
        const wheelT = new THREE.Group();
        const tireT = mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.24, 18), MX.rubber);
        tireT.rotation.x = Math.PI / 2;
        wheelT.add(tireT);
        const hubT = cyl(0.17, 0.17, 0.26, MX.satin, 12);
        hubT.rotation.x = Math.PI / 2;
        wheelT.add(hubT);
        wheelT.position.set(hx, 0.37, hz);
        s.add(wheelT);
      }
    }
    /* 起重臂：变截面放样 + 液压缸 + 钢管吊重 */
    KND.boomPivot = new THREE.Group();
    KND.boomPivot.position.set(0.9, 1.06, 0);
    s.add(KND.boomPivot);
    const boomCurve = new THREE.CatmullRomCurve3([V3(0, 0, 0), V3(1.3, 0.06, 0), V3(2.6, 0.1, 0)]);
    const boomGeo2 = sweepBar(boomCurve, 30);
    boomGeo2.rotateZ(0.14);
    const boom = mesh(boomGeo2, paintMat(css('safety', 0.95), { roughness: 0.44 }));
    boom.rotation.z = 0.42;
    boom.scale.set(1.35, 1.35, 1.35);
    KND.boomPivot.add(boom);
    KND.boom = boom;
    /* 液压缸：缸筒（斜置）+ 伸缩活塞杆 */
    KND.cylBody = cyl(0.075, 0.075, 0.62, MX.dark, 14);
    KND.cylBody.position.set(0.62, 0.78, 0.2);
    KND.cylBody.rotation.z = 1.05;
    s.add(KND.cylBody);
    KND.rod = cyl(0.04, 0.04, 0.6, MX.chrome, 12);
    KND.rod.position.set(0.95, 1.05, 0.2);
    KND.rod.rotation.z = 0.85;
    s.add(KND.rod);
    /* 吊重：钢管捆挂在臂端 */
    KND.pipeGroup = new THREE.Group();
    KND.pipeGroup.position.set(3.4, 2.1, 0);
    for (let i = 0; i < 3; i++) {
      const pipe = cyl(0.055, 0.055, 1.7, matStd(tone(CV.wire, 1.05), { roughness: 0.4, metalness: 0.8 }), 12);
      pipe.rotation.x = Math.PI / 2;
      pipe.position.set(0, -0.12, (i - 1) * 0.13);
      KND.pipeGroup.add(pipe);
    }
    const sling = makeRope(CV.wire, 0.016);
    sling.set(V3(0, 0, 0), V3(0, 0.5, 0));
    KND.pipeGroup.add(sling);
    s.add(KND.pipeGroup);
    KND.pipes = KND.pipeGroup;
    const shT = shadowBlob(3.6, 0.3);
    shT.scale.set(1, 0.6, 1);
    shT.position.set(0, 0.012, 0);
    s.add(shT);
    KND.stations.boom = s;
  }
  /* —— 杆秤 —— */
  {
    const s = new THREE.Group();
    s.position.set(5.2, 0, 0.6);
    g.add(s);
    /* 秤架：立柱 + 顶钩 */
    const post = cyl(0.04, 0.06, 2.5, woodMat('#7a5a38', 75, 0.72), 12);
    post.position.set(0, 1.25, -0.3);
    s.add(post);
    const baseP = cyl(0.3, 0.36, 0.12, MX.stone || matStd(css('rockGray', 1), { roughness: 0.95 }), 18);
    baseP.position.set(0, 0.06, -0.3);
    s.add(baseP);
    /* 秤杆：锥形黄铜杆 + 秤星贴图环绕 + 提纽 + 秤钩 */
    KND.beam = new THREE.Group();
    KND.beam.position.set(0, 2.6, 0);
    s.add(KND.beam);
    const rodG = new THREE.CylinderGeometry(0.032, 0.016, 2.2, 12);
    rodG.rotateZ(Math.PI / 2);
    if (!MX.brassOld.map) MX.brassOld.map = steelyardTexture(6);
    const rod = mesh(rodG, MX.brassOld);
    rod.position.x = 0.55;
    KND.beam.add(rod);
    /* 提纽绳套（挂在架上） */
    const knobRope = makeRope(CV.rope, 0.014);
    knobRope.set(V3(-0.15, 0, 0), V3(-0.15, 0.42, -0.3).sub(V3(0, 2.6, 0)));
    KND.beam.add(knobRope);
    const knobRope2 = makeRope(CV.rope, 0.014);
    knobRope2.set(V3(-0.15, 0, 0), V3(0.15, 0.4, -0.3).sub(V3(0, 2.6, 0)));
    KND.beam.add(knobRope2);
    /* 秤钩 + 货物 */
    const hookR = mesh(new THREE.TorusGeometry(0.05, 0.012, 6, 14), MX.satin);
    hookR.position.set(-0.44, -0.09, 0);
    KND.beam.add(hookR);
    KND.goods = new THREE.Group();
    KND.goods.position.set(-0.44, -0.62, 0);
    KND.beam.add(KND.goods);
    /* 四样货物（切换显示） */
    const cab = new THREE.Group();
    const cabbageHead = mesh(new THREE.SphereGeometry(0.16, 14, 10), matStd(css('cellWall', 1), { roughness: 0.8 }));
    for (let i = 0; i < 5; i++) {
      const leaf = mesh(new THREE.SphereGeometry(0.15, 10, 8), matStd(tone(PAL.cellWall, 0.8), { roughness: 0.85 }));
      leaf.position.set(Math.cos(i * 1.256) * 0.07, 0.04, Math.sin(i * 1.256) * 0.07);
      leaf.scale.set(1, 0.7, 1);
      cab.add(leaf);
    }
    cab.add(cabbageHead);
    KND.itemMeshes = { greens: cab };
    const fish = new THREE.Group();
    const fBody = mesh(new THREE.SphereGeometry(0.13, 12, 9), matStd(tone(PAL.steel, 0.8), { roughness: 0.35, metalness: 0.6 }));
    fBody.scale.set(1.9, 0.7, 0.55);
    fish.add(fBody);
    const tail = mesh(new THREE.ConeGeometry(0.09, 0.2, 8), matStd(tone(PAL.steel, 0.7), { roughness: 0.4, metalness: 0.6 }));
    tail.rotation.z = Math.PI / 2;
    tail.position.set(-0.3, 0, 0);
    tail.scale.set(1, 1, 0.5);
    fish.add(tail);
    KND.itemMeshes.fish = fish;
    const eggBox = new THREE.Group();
    const baskProf = [
      new THREE.Vector2(0.001, 0), new THREE.Vector2(0.2, 0.02), new THREE.Vector2(0.26, 0.14),
      new THREE.Vector2(0.3, 0.2), new THREE.Vector2(0.29, 0.21), new THREE.Vector2(0.25, 0.15),
      new THREE.Vector2(0.19, 0.04), new THREE.Vector2(0.001, 0.02),
    ];
    const bask = mesh(new THREE.LatheGeometry(baskProf, 18), woodMat('#8a6440', 76, 0.85));
    eggBox.add(bask);
    for (let i = 0; i < 6; i++) {
      const egg = mesh(new THREE.SphereGeometry(0.055, 10, 8), matStd(css('starch', 1), { roughness: 0.6 }));
      egg.position.set(Math.cos(i * 1.047) * 0.12, 0.2, Math.sin(i * 1.047) * 0.12);
      egg.scale.y = 1.3;
      eggBox.add(egg);
    }
    KND.itemMeshes.eggbox = eggBox;
    const sack = new THREE.Group();
    const sackBody = mesh(new THREE.CapsuleGeometry ? new THREE.CapsuleGeometry(0.16, 0.2, 6, 12) : new THREE.SphereGeometry(0.2, 12, 10),
      matStd(css('starch', 0.92), { roughness: 0.9 }));
    sackBody.scale.set(1, 1.25, 1);
    sack.add(sackBody);
    const tie = cyl(0.05, 0.09, 0.1, matStd(tone(CV.rope, 0.9), { roughness: 0.9 }), 10);
    tie.position.y = 0.34;
    sack.add(tie);
    KND.itemMeshes.rice = sack;
    for (const k of Object.keys(KND.itemMeshes)) {
      KND.itemMeshes[k].visible = false;
      KND.goods.add(KND.itemMeshes[k]);
    }
    /* 秤砣：算盘珠形黄铜砣 + 绳 */
    KND.weight = new THREE.Group();
    const wt = mesh(new THREE.SphereGeometry(0.085, 12, 10), MX.brass);
    wt.scale.y = 0.9;
    KND.weight.add(wt);
    const wtLoop = mesh(new THREE.TorusGeometry(0.03, 0.01, 6, 12), MX.brass);
    wtLoop.position.y = 0.1;
    KND.weight.add(wtLoop);
    s.add(KND.weight);
    KND.wtRope = makeRope(CV.rope, 0.012);
    s.add(KND.wtRope);
    const shS = shadowBlob(1.1, 0.3);
    shS.position.set(0, 0.012, 0.2);
    s.add(shS);
    KND.stations.scale = s;
    KND.beam.rotation.z = 0;
  }
  updKinds();
}
function updKinds() {
  if (!KND.stations) return;
  /* —— 独轮车 —— */
  {
    const tilt = KND.tiltDir === 1 ? KND.tilt * -0.3 : 0;
    const station = KND.stations.wheelbarrow;
    station.rotation.z = tilt;
    /* 砂堆位置：front/mid/back → 阻力臂变化 */
    const sandX = KND.pos === 'front' ? -0.1 : KND.pos === 'back' ? 0.55 : 0.25;
    KND.sand.position.x = sandX;
    KND.sand.scale.setScalar(Math.cbrt(KND.mLoad / 60) * 0.9);
    /* 抬把手力：车轮支点 x=wheel, 重物 G=mLoad·g（N 折算 ×9.8 → 显示 N 取整 10） */
    const G = KND.mLoad * 9.8;
    const L1 = 1.67 - 0.41;           // 把手到轮轴的水平距离
    const L2 = Math.abs(sandX + 0.25 - 0);   // 砂到轮轴（轮在局部 x=0）
    const F1 = G * L2 / L1 / 10;
    const wheelW = station.children[0];
    if (KND.tiltDir === 1) wheelW.rotation.x = -KND.tilt * 1.6;
    hset('kF1', (F1).toFixed(0) + ' N');
    hset('kF2', G.toFixed(0) + ' N');
    hset('kL1', L1.toFixed(2) + ' m');
    hset('kL2', L2.toFixed(2) + ' m');
    hset('kS', (KND.tiltDir === 1 ? KND.tilt * 0.16 : 0).toFixed(3) + ' m');
    hset('kH', (KND.tiltDir === 1 ? KND.tilt * 0.05 : 0).toFixed(3) + ' m');
  }
  /* —— 随车吊 —— */
  {
    const load = KND.jibLoad;
    /* 臂：根部支点 → 液压缸顶点（近根部）→ 吊重（远端） */
    const dHyd = 0.5, dTip = 3.4;
    const ratio = dTip / dHyd;
    const F1 = load * 9.8 / ratio;
    const ext = 0.3 + KND.tilt * 0.45;
    KND.rod.scale.y = 0.6 + KND.tilt * 0.75;
    KND.rod.position.set(0.95 + KND.tilt * 0.06, 1.05 + KND.tilt * 0.1, 0.2);
    const boomAng = 0.42 + KND.tilt * 0.24;
    KND.boom.rotation.z = boomAng;
    KND.pipes.position.set(0.9 + Math.cos(boomAng) * 2.45, 1.06 + Math.sin(boomAng) * 2.45, 0);
    KND.pipes.rotation.z = -boomAng * 0.3;
    hset('bF1', F1.toFixed(0) + ' N');
    hset('bF2', load.toFixed(0) + ' N');
    hset('bL1', dHyd.toFixed(2) + ' m');
    hset('bL2', dTip.toFixed(2) + ' m');
    hset('bS', (KND.tilt * 0.14).toFixed(3) + ' m');
    hset('bH', (KND.tilt * 1.05).toFixed(3) + ' m');
  }
  /* —— 杆秤 —— */
  {
    const m = KND.load;
    const m0 = 0.5;
    const Lgoods = 0.29;                       // 提纽到秤钩
    const x = clamp(KND.slider, 0.02, 1.25);
    const torque = m * 9.8 * Lgoods - m0 * 9.8 * x;
    const isLevel = Math.abs(torque) < 0.35;
    const tilt = clamp(torque * 0.24, -0.22, 0.22);
    KND.beam.rotation.z = isLevel ? 0 : tilt;
    /* 货物显示切换 */
    for (const k of Object.keys(KND.itemMeshes)) KND.itemMeshes[k].visible = k === KND.item;
    /* 砣位置（世界系） */
    const beamW = KND.beam;
    beamW.updateWorldMatrix(true, false);
    const wp = new THREE.Vector3(x, 0, 0).applyMatrix4(beamW.matrixWorld);
    KND.weight.position.set(wp.x, wp.y - 0.14, wp.z);
    KND.wtRope.set(V3(wp.x, wp.y, wp.z), V3(wp.x, wp.y - 0.1, wp.z));
    hset('sX', (x * 100).toFixed(1) + ' cm');
    hset('sBal', isLevel ? '水平 ✓' : torque > 0 ? '砣端翘起' : '钩端下沉');
    hset('sRead', isLevel ? m.toFixed(2) + ' kg' : '—');
    hset('sM0', m0.toFixed(1) + ' kg');
  }
}
function focusKinds() {
  for (const k of Object.keys(KND.stations)) {
    const on = k === KND.kind;
    KND.stations[k].traverse((o) => {
      if (o.isMesh && o.material && !o.material.userData?.keep) {
        o.material.transparent = !on;
        o.material.opacity = on ? 1 : 0.16;
      }
    });
  }
}
function unfocusKinds() {
  for (const k of Object.keys(KND.stations)) {
    KND.stations[k].traverse((o) => {
      if (o.isMesh && o.material && !o.material.userData?.keep) {
        o.material.transparent = false;
        o.material.opacity = 1;
      }
    });
  }
}

/* ============ 03 定滑轮与动滑轮 ============ */

const PUL = { bricks: 6, angle: 0, gp: 1, k: 1, lift: 0, lifting: false };
function buildPulleyScene(g) {
  const mk = (x, moving) => {
    const s = new THREE.Group();
    s.position.x = x;
    g.add(s);
    /* 脚手架：双立柱 + 顶梁 + 斜撑 + 底板（钢管 + 接头箍） */
    const tube = matStd(tone(CV.steel, 0.85), { roughness: 0.5, metalness: 0.6 });
    for (const px of [-0.9, 0.9]) {
      const post = cyl(0.055, 0.055, 4.6, tube, 14);
      post.position.set(px, 2.3, -0.5);
      s.add(post);
      const plateB = box(0.3, 0.04, 0.3, MX.dark);
      plateB.position.set(px, 0.02, -0.5);
      s.add(plateB);
      for (const hy of [1.4, 2.6, 3.8]) {
        const coupler = cyl(0.075, 0.075, 0.14, MX.dark, 12);
        coupler.position.set(px, hy, -0.5);
        s.add(coupler);
      }
    }
    const beam = box(2.3, 0.09, 0.09, tube);
    beam.position.set(0, 4.55, -0.5);
    s.add(beam);
    const diag = box(0.05, 1.3, 0.05, tube);
    diag.rotation.x = 0.72;
    diag.position.set(-0.9, 0.95, -0.15);
    s.add(diag);
    /* 滑轮（叉板架挂在顶梁） */
    const pul = makeSheave(0.3, true);
    if (!moving) pul.position.set(0, 4.3, 0);
    s.add(pul);
    /* 砖桶 + 电子吊秤 */
    const scaleD = makeDigitalScale();
    scaleD.position.y = 0.9;
    s.add(scaleD);
    const pail = makePail(0.21, false);
    pail.position.y = 0.5;
    s.add(pail);
    const bricks = brickStack(8, brickMatShared);
    bricks.scale.setScalar(0.62);
    bricks.position.y = 0.52;
    pail.add(bricks);
    /* 绳（两段直绳 + 绕轮管） */
    const ropeA = makeWrapRope(CV.rope, 0.028);
    const ropeB = makeRope(CV.rope, 0.028);
    s.add(ropeA, ropeB);
    /* 手端拉力计 */
    const gauge = buildPullGauge(0.8);
    s.add(gauge);
    const tag = label(moving ? '动滑轮' : '定滑轮', moving ? '#8fc6ff' : '#9be29b', 0.0044);
    tag.position.set(0, 5.3, 0);
    s.add(tag);
    const tagScale = label('电子吊秤', '#dfe8ee', 0.003);
    tagScale.position.set(0, 1.55, 0.3);
    s.add(tagScale);
    equipLabels.push(tag, tagScale);
    g.add(shadowBlob(1.6, 0.3)).children;
    const sh = g.children.at(-1);
    sh.position.set(x, 0.012, 0);
    return { pul, scaleD, pail, ropeA, ropeB, gauge, moving };
  };
  PUL.fixed = mk(-2.6, false);
  PUL.mov = mk(2.6, true);
  updPulley();
}
function updPulley() {
  if (!PUL.fixed) return;
  const G = PUL.bricks * 98;
  const Gp = PUL.gp * 9.8;
  const h = PUL.lift * 1.2;
  const kEff = PUL.k;
  { /* 定滑轮：F = G（摩擦时 ÷0.94，方向可偏） */
    const u = PUL.fixed;
    const hookY = 3.55 - h - u.pail.userData.h;
    u.pail.position.y = hookY;
    u.scaleD.position.y = hookY + u.pail.userData.h + 0.1;
    const pullLen = 1.5 + h;
    const angR = PUL.angle * Math.PI / 180;
    const handX = Math.sin(angR) * pullLen;
    u.ropeA.set(V3(-0.02, hookY + u.pail.userData.h + 0.32, 0), V3(0, 4.3, 0), 0.31, V3(0.34, 4.3, 0));
    u.ropeB.set(V3(0.36, 4.22, 0), V3(0.36 + handX * 0.35, 4.3 - pullLen, 0));
    u.gauge.position.set(0.36 + handX * 0.35, 4.3 - pullLen - 0.3, 0);
    u.gauge.userData.setForce((G / kEff));
    u.scaleD.userData.set(G / 9.8);
    hset('pG', G.toFixed(0) + ' N');
    hset('pF', (G / kEff).toFixed(1) + ' N');
  }
  { /* 动滑轮：两段绳分担 G+G动，s = 2h */
    const u = PUL.mov;
    const pulY = 3.7 - h;
    u.pul.position.y = pulY;
    const loadY = pulY - 0.5 - u.pail.userData.h;
    u.pail.position.y = loadY;
    u.scaleD.position.y = loadY + u.pail.userData.h + 0.1;
    const pullY = 4.3 + 2 * h - 0.35;
    u.ropeA.set(V3(-0.32, 4.45, 0), V3(0, pulY, 0), 0.31, V3(0.32, pulY, 0));
    u.ropeB.set(V3(0.34, pulY + 0.1, 0), V3(0.34, pullY, 0));
    u.gauge.position.set(0.34, pullY - 0.28, 0);
    u.gauge.userData.setForce((G + Gp) / 2 / kEff);
    u.scaleD.userData.set((G + Gp) / 9.8);
    hset('mF', ((G + Gp) / 2 / kEff).toFixed(1) + ' N');
    hset('pS', '定 ' + (1.2 * PUL.lift).toFixed(2) + ' m · 动 ' + (2.4 * PUL.lift).toFixed(2) + ' m');
    hset('pGp', PUL.gp.toFixed(1) + ' kg（' + Gp.toFixed(0) + ' N）');
    hset('pR', (G / (G + Gp) * (2 / 2) / 1).toFixed(2) + ' → F/G=' + (((G + Gp) / 2 / kEff) / G).toFixed(2));
  }
}

/* ============ 04 滑轮组 ============ */

const BLK = { n: 3, pullDown: true, bricks: 16, gp: 1, k: 1, lift: 0, lifting: false };
function buildBlockScene(g) {
  /* 龙门架：双 A 字柱 + 顶梁（工字梁）+ 底横撑 */
  const tube = matStd(tone(CV.steel, 0.85), { roughness: 0.5, metalness: 0.6 });
  for (const sx of [-1.7, 1.7]) {
    for (const sz of [-0.4, 0.4]) {
      const post = cyl(0.07, 0.07, 5.4, tube, 14);
      post.position.set(sx, 2.7, sz);
      g.add(post);
      const foot = box(0.36, 0.05, 0.36, MX.dark);
      foot.position.set(sx, 0.025, sz);
      g.add(foot);
    }
    const cross = box(0.07, 0.07, 0.86, tube);
    cross.position.set(sx, 3.4, 0);
    g.add(cross);
    const cross2 = box(0.07, 0.07, 0.86, tube);
    cross2.position.set(sx, 1.7, 0);
    g.add(cross2);
  }
  const girder = box(3.9, 0.16, 0.12, tube);
  girder.position.set(0, 5.3, -0.4);
  g.add(girder);
  const girder2 = box(3.9, 0.16, 0.12, tube);
  girder2.position.set(0, 5.3, 0.4);
  g.add(girder2);
  for (const zs of [-0.4, 0.4]) {
    for (let i = 0; i < 6; i++) {
      const lace = box(0.05, 0.05, 0.82, tube);
      lace.position.set(-1.6 + i * 0.64, 5.3, zs * 0.86);
      g.add(lace);
    }
  }
  /* 定滑轮组（挂顶梁下）+ 动滑轮组（随载移动） */
  BLK.fixCluster = new THREE.Group();
  BLK.fixCluster.position.set(0, 5.05, 0);
  g.add(BLK.fixCluster);
  BLK.movCluster = new THREE.Group();
  BLK.movCluster.position.set(0, 2.6, 0);
  g.add(BLK.movCluster);
  /* 托盘 + 砖（brickMesh 与计数状态分离，计数由 updBlock 重建同步） */
  BLK.pallet = makePallet(1.3);
  g.add(BLK.pallet);
  BLK.brickMesh = brickStack(BLK.bricks, brickMatShared);
  BLK.brickMesh.scale.setScalar(0.85);
  BLK.brickMesh.userData.count = BLK.bricks;
  g.add(BLK.brickMesh);
  /* 绳段（最多 5 段）+ 编号 Sprite + 自由端拉力计 */
  BLK.ropes = [];
  BLK.nos = [];
  for (let i = 0; i < 5; i++) {
    const r = makeWrapRope(CV.rope, 0.026);
    g.add(r);
    BLK.ropes.push(r);
    const no = label('①', '#ffd166', 0.0032);
    g.add(no);
    BLK.nos.push(no);
  }
  BLK.free = makeRope(CV.wire, 0.024);
  g.add(BLK.free);
  BLK.gauge = buildPullGauge(0.85);
  g.add(BLK.gauge);
  const tagB = label('滑轮组 · n 段承重', '#ffd166', 0.0042);
  tagB.position.set(0, 6.2, 0);
  g.add(tagB);
  equipLabels.push(tagB);
  g.add(shadowBlob(2.6, 0.34));
  updBlock();
}
function updBlock() {
  if (!BLK.fixCluster) return;
  const n = BLK.n;
  const G = BLK.bricks * 100;
  const Gp = BLK.gp * 9.8 * (n >= 4 ? 2 : 1);
  const h = BLK.lift * 1.6;
  /* 载荷平台位置 */
  BLK.movCluster.position.y = 2.6 + h;
  BLK.pallet.position.set(0, BLK.movCluster.position.y - 0.42, 0);
  /* 砖数与画面同步：计数变了就重建实例堆（几何体共享缓存，旧实例缓冲即弃） */
  if (BLK.brickMesh.userData.count !== BLK.bricks) {
    const oldBricks = BLK.brickMesh;
    BLK.brickMesh = brickStack(BLK.bricks, oldBricks.material);
    BLK.brickMesh.scale.setScalar(0.85);
    BLK.brickMesh.userData.count = BLK.bricks;
    oldBricks.parent.add(BLK.brickMesh);
    oldBricks.parent.remove(oldBricks);
    oldBricks.dispose();
  }
  BLK.brickMesh.position.set(0, BLK.pallet.position.y + 0.16, 0);
  /* 滑轮布局：定滑轮 ceil(n/2) 只上排，动滑轮 floor(n/2) 只下排（奇数时动滑轮多一只） */
  const nFix = Math.ceil(n / 2) + (n % 2 === 0 ? 0 : 0);
  const nMov = Math.floor(n / 2) + (n % 2);
  while (BLK.fixCluster.children.length < nFix) {
    const p = makeSheave(0.24, false);
    BLK.fixCluster.add(p);
  }
  while (BLK.movCluster.children.length < nMov) {
    const p = makeSheave(0.24, false);
    BLK.movCluster.add(p);
  }
  BLK.fixCluster.children.forEach((p, i) => { p.visible = i < nFix; p.position.set((i - (nFix - 1) / 2) * 0.5, 0, 0); });
  BLK.movCluster.children.forEach((p, i) => { p.visible = i < nMov; p.position.set((i - (nMov - 1) / 2) * 0.5, 0, 0); });
  /* n 段绳：奇偶交替出绳（从定滑轮 / 动滑轮），绳段编号贴在绳中点 */
  const topY = BLK.fixCluster.position.y;
  const botY = BLK.movCluster.position.y;
  for (let i = 0; i < 5; i++) {
    const r = BLK.ropes[i];
    const no = BLK.nos[i];
    if (i >= n) { r.visible = false; no.visible = false; continue; }
    r.visible = true; no.visible = true;
    const z = (i - (n - 1) / 2) * 0.16;
    const xF = BLK.fixCluster.children[Math.min(Math.floor(i / 2), nFix - 1)]?.position.x || 0;
    const xM = BLK.movCluster.children[Math.min(Math.floor(i / 2), nMov - 1)]?.position.x || 0;
    if (i % 2 === 0) {
      r.set(V3(xF, topY - 0.05, z), V3(xF, topY, z), 0.25, V3(xM, botY + 0.05, z));
      no.position.set(xF, (topY + botY) / 2 + 0.3, z);
    } else {
      r.set(V3(xM, botY + 0.05, z), V3(xM, botY, z), 0.25, V3(xF, topY - 0.05, z));
      no.position.set(xM, (topY + botY) / 2 + 0.3, z);
    }
  }
  /* 自由端：绕过最后一只定滑轮 → 下拉到拉力计（或上拉） */
  const freeX = 1.45;
  const freeY = BLK.pullDown
    ? clamp(1.6 + n * h, 0.4, 4.4)
    : clamp(1.6 + n * h, 0.4, 5.2);
  BLK.free.visible = true;
  const F = (G + Gp) / n / BLK.k;
  if (BLK.pullDown) {
    BLK.free.set(V3(freeX, 4.98, 0), V3(freeX, freeY, 0));
    BLK.gauge.position.set(freeX, freeY - 0.3, 0);
    BLK.gauge.rotation.set(0, 0, Math.PI);
  } else {
    BLK.free.set(V3(freeX, 4.98, 0), V3(freeX, freeY, 0));
    BLK.gauge.position.set(freeX, freeY + 0.3, 0);
    BLK.gauge.rotation.set(0, 0, 0);
  }
  BLK.gauge.userData.setForce(F);
  hset('n', String(n));
  hset('gG', (G + Gp).toFixed(0) + ' N');
  hset('f', F.toFixed(1) + ' N');
  hset('fn', ((G + Gp) / n).toFixed(1) + ' N');
  hset('h', h.toFixed(2) + ' m');
  hset('s', (n * h).toFixed(2) + ' m');
}

/* ============ 05 斜面（货车 + 跳板 + 木箱） ============ */

const RAMP = { L: 3, surface: 'rough', m: 100, push: 0, pushing: false, decomp: false };
const RAMP_MU = { rough: 0.3, smooth: 0.16, steel: 0.08, roller: 0.03 };
const RAMP_H = 1.2;
function buildRamp(g) {
  /* 货车：底盘大梁 + 驾驶室（车窗/后视镜/格栅/大灯）+ 货台护栏 + 六轮 */
  const truck = new THREE.Group();
  truck.position.set(4.4, 0, 0);
  g.add(truck);
  const cabM = paintMat(css('paintOrange', 1), { roughness: 0.38 });
  const frame = box(4.6, 0.2, 1.5, MX.dark);
  frame.position.y = 0.62;
  truck.add(frame);
  const bed = box(3.2, 0.12, 1.7, woodMat('#7a5a38', 81, 0.75));
  bed.position.set(0.5, 1.32, 0);
  truck.add(bed);
  for (const zs of [0.82, -0.82]) {
    const rail = box(3.2, 0.5, 0.06, matStd(tone(CV.steelDeep, 0.9), { roughness: 0.5, metalness: 0.5 }));
    rail.position.set(0.5, 1.62, zs);
    truck.add(rail);
  }
  const cabB = roundedSlab(1.15, 1.6, 1.0, 0.14, cabM, 0.03, 'flat');
  cabB.position.set(-1.95, 1.35, 0);
  truck.add(cabB);
  const winF = box(0.06, 0.46, 1.3, matGlass(css('chrome', 0.9), { opacity: 0.66 }));
  winF.position.set(-1.4, 1.62, 0);
  winF.rotation.z = -0.12;
  truck.add(winF);
  const winS1 = box(0.7, 0.4, 0.04, matGlass(css('chrome', 0.9), { opacity: 0.6 }));
  winS1.position.set(-1.95, 1.6, 0.81);
  const winS2 = winS1.clone(); winS2.position.z = -0.81;
  truck.add(winS1, winS2);
  const grille = box(0.07, 0.34, 1.2, MX.dark);
  grille.position.set(-2.54, 0.85, 0);
  truck.add(grille);
  for (const hz of [0.5, -0.5]) {
    const lamp = cyl(0.07, 0.07, 0.05, matStd(css('starch', 1.05), { roughness: 0.3, emissive: 0x554411, emissiveIntensity: 0.5 }), 12);
    lamp.rotation.z = Math.PI / 2;
    lamp.position.set(-2.56, 1.0, hz);
    truck.add(lamp);
    const mirror = box(0.04, 0.18, 0.12, MX.dark);
    mirror.position.set(-1.55, 1.78, hz * 1.15);
    truck.add(mirror);
  }
  for (const hx of [-1.95, 0.1, 2.0]) {
    for (const hz of [0.86, -0.86]) {
      const wheelT = new THREE.Group();
      const tireT = mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.26, 20), MX.rubber);
      tireT.rotation.x = Math.PI / 2;
      wheelT.add(tireT);
      const hubT = cyl(0.2, 0.2, 0.28, MX.satin, 14);
      hubT.rotation.x = Math.PI / 2;
      wheelT.add(hubT);
      for (let i = 0; i < 5; i++) {
        const lug = box(0.05, 0.1, 0.29, MX.dark);
        lug.position.set(0, 0.16, 0);
        lug.rotation.x = (i / 5) * Math.PI;
        wheelT.add(lug);
      }
      wheelT.position.set(hx, 0.43, hz);
      truck.add(wheelT);
    }
  }
  const shT = shadowBlob(4.4, 0.32);
  shT.scale.set(1, 0.62, 1);
  shT.position.set(4.4, 0.012, 0);
  g.add(shT);

  /* 跳板：三块板条 + 横撑（板面材质随选项切换 / 滚杠模式变滚筒阵列） */
  RAMP.plank = new THREE.Group();
  g.add(RAMP.plank);
  const boardMats = {
    rough: matStd(0xffffff, { roughness: 0.92 }),
    smooth: matStd(0xffffff, { roughness: 0.55 }),
    steel: matStd(0xffffff, { roughness: 0.42, metalness: 0.55 }),
  };
  boardMats.rough.map = plankTexture(true, 95);
  boardMats.smooth.map = plankTexture(false, 96);
  boardMats.steel.map = treadPlateTexture();
  RAMP.boardMats = boardMats;
  for (let i = 0; i < 3; i++) {
    const b = box(4.8, 0.06, 0.42, boardMats.rough);
    b.position.set(0, 0, (i - 1) * 0.5);
    RAMP.plank.add(b);
  }
  for (const bx of [-1.8, 0, 1.8]) {
    const brace = box(0.1, 0.08, 1.3, matStd(tone(CV.steelDeep, 0.8), { roughness: 0.6, metalness: 0.5 }));
    brace.position.set(bx, -0.06, 0);
    RAMP.plank.add(brace);
  }
  /* 滚杠（roller 模式显示） */
  RAMP.rollers = new THREE.Group();
  const rollMat = matStd(tone(CV.chrome, 0.92), { roughness: 0.3, metalness: 0.85 });
  for (let i = 0; i < 5; i++) {
    const roll = cyl(0.09, 0.09, 1.2, rollMat, 14);
    roll.rotation.z = Math.PI / 2;
    roll.position.set((i - 2) * 0.85, 0.09, 0);
    RAMP.rollers.add(roll);
  }
  g.add(RAMP.rollers);
  /* 木箱 */
  RAMP.crate = makeCrate(0.8, '木箱 · 100 kg');
  g.add(RAMP.crate);
  /* 力箭头：沿板拉力 + 重力分解 */
  RAMP.pull = makeArrow(CV.arrowF);
  g.add(RAMP.pull);
  RAMP.gDown = makeArrow(CV.arrowN);
  g.add(RAMP.gDown);
  RAMP.gPress = makeArrow(CV.arrowG);
  g.add(RAMP.gPress);
  const tagR = label('货车车厢 · 台面高 1.2 m', '#dfe8ee', 0.004);
  tagR.position.set(4.4, 2.6, 0);
  g.add(tagR);
  equipLabels.push(tagR);
  updRamp();
}
function updRamp() {
  if (!RAMP.plank) return;
  const L = RAMP.L;
  const th = Math.asin(clamp(RAMP_H / L, 0, 1));
  const len = L / Math.cos(th) + 0.4;
  /* 跳板姿态：底端在 x=-1.2，顶端搭上货台 */
  const baseX = -1.2, baseY = 0.05;
  const topX = 2.86, topY = RAMP_H + 0.12;
  RAMP.plank.position.set((baseX + topX) / 2, (baseY + topY) / 2 + 0.05, 0);
  RAMP.plank.rotation.z = Math.atan2(topY - baseY, topX - baseX);
  const rollMode = RAMP.surface === 'roller';
  RAMP.rollers.visible = rollMode;
  RAMP.plank.children.forEach((b, i) => { if (i < 3) b.material = rollMode ? boardNullMat() : RAMP.boardMats[RAMP.surface]; });
  /* 木箱沿板位置 */
  const d = 0.9 + RAMP.push * (L - 1.5);
  const dirV = new THREE.Vector3(Math.cos(RAMP.plank.rotation.z), Math.sin(RAMP.plank.rotation.z), 0);
  const cx = baseX + dirV.x * d;
  const cy = baseY + dirV.y * d + (rollMode ? 0.28 : 0.43);
  RAMP.crate.position.set(cx, cy, 0);
  RAMP.crate.rotation.z = RAMP.plank.rotation.z;
  /* 力学量 */
  const G = RAMP.m * 9.8;
  const mu = RAMP_MU[RAMP.surface];
  const Fneed = G * Math.sin(th) + mu * G * Math.cos(th);
  const ideal = G * RAMP_H / L;
  const tip = new THREE.Vector3(cx + dirV.x * 0.45, cy + dirV.y * 0.45, 0);
  RAMP.pull.set(tip.clone().addScaledVector(dirV, 1.25), tip, 'F=' + Fneed.toFixed(0) + ' N');
  if (RAMP.decomp) {
    const c0 = new THREE.Vector3(cx, cy + 0.32, 0.72);
    const downhill = new THREE.Vector3(-dirV.y, -dirV.x, 0).multiplyScalar(-1);
    downhill.set(-Math.sin(RAMP.plank.rotation.z) * -1, -Math.cos(RAMP.plank.rotation.z), 0);
    const press = new THREE.Vector3(Math.sin(RAMP.plank.rotation.z), -Math.cos(RAMP.plank.rotation.z), 0);
    RAMP.gDown.set(c0, c0.clone().addScaledVector(downhill.normalize(), 0.2 + G * Math.sin(th) / 900), '沿板分力');
    RAMP.gPress.set(c0, c0.clone().addScaledVector(press, 0.2 + G * Math.cos(th) / 1100), '压板分力');
  } else { RAMP.gDown.hide(); RAMP.gPress.hide(); }
  const eta = Fneed > 0 ? (G * RAMP_H) / (Fneed * L) * 100 : 100;
  hset('iF', Fneed.toFixed(0) + ' N');
  hset('iG', G.toFixed(0) + ' N');
  hset('iAng', (th * 180 / Math.PI).toFixed(1) + '°');
  hset('iIdeal', ideal.toFixed(0) + ' N');
  hset('iS', (RAMP.push * L).toFixed(2) + ' m');
  hset('iEta', eta.toFixed(1) + ' %');
}
let _nullMat = null;
function boardNullMat() {
  if (!_nullMat) _nullMat = matStd(css('rockGray', 0.5), { roughness: 0.9 });
  return _nullMat;
}

/* ============ 06 轮轴（辘轳） ============ */

const WIN = { R: 0.35, r: 0.09, water: 10, k: 1, turns: 0, spinning: false };
function buildWinch(g) {
  if (!MX.stone) {
    MX.stone = matStd(0xffffff, { roughness: 0.95 });
    MX.stone.map = stoneTexture(13);
  }
  /* 石砌井台：环形石块（InstancedMesh）+ 井口内圈 + 水面 */
  const ringCount = 20;
  const stoneBlock = box(0.52, 0.3, 0.3, MX.stone);
  const ring = new THREE.InstancedMesh(stoneBlock.geometry, MX.stone, ringCount);
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  for (let i = 0; i < ringCount; i++) {
    const a = (i / ringCount) * TAU;
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -a + Math.PI / 2);
    m4.compose(V3(Math.cos(a) * 1.02, 0.15, Math.sin(a) * 1.02), q, V3(1, 1, 1));
    ring.setMatrixAt(i, m4);
  }
  g.add(ring);
  const inner = cyl(0.78, 0.82, 0.3, matStd(tone(CV.rockGray, 0.7), { roughness: 0.96 }), 24, 1, true);
  g.add(inner);
  const waterD = cyl(0.72, 0.72, 0.03, waterMat(), 24);
  waterD.position.y = 0.2;
  g.add(waterD);
  const shW = shadowBlob(2.5, 0.36);
  shW.position.set(0, 0.012, 0);
  g.add(shW);
  /* 木架：A 形双柱 + 顶梁 + 铁皮护板 */
  const legMat = woodMat('#7a5a38', 97, 0.72);
  for (const sx of [-0.85, 0.85]) {
    const leg = cyl(0.07, 0.09, 2.7, legMat, 12);
    leg.position.set(sx * 1.06, 1.35, 0);
    leg.rotation.z = sx > 0 ? -0.08 : 0.08;
    g.add(leg);
    const strap = box(0.16, 0.2, 0.02, matStd(tone(CV.steelDeep, 0.85), { roughness: 0.5, metalness: 0.6 }));
    strap.position.set(sx * 1.14, 2.45, 0);
    strap.rotation.z = sx > 0 ? -0.08 : 0.08;
    g.add(strap);
  }
  const beamW = box(2.5, 0.13, 0.13, legMat);
  beamW.position.y = 2.62;
  g.add(beamW);
  /* 卷筒：Lathe 鼓形 + 轴 + 螺旋缠绳 */
  WIN.drum = new THREE.Group();
  WIN.drum.position.y = 2.3;
  g.add(WIN.drum);
  const drumProf = [
    new THREE.Vector2(0.001, 0), new THREE.Vector2(0.12, 0.02), new THREE.Vector2(0.14, 0.1),
    new THREE.Vector2(0.14, 0.5), new THREE.Vector2(0.12, 0.58), new THREE.Vector2(0.001, 0.6),
  ];
  const drumBody = mesh(new THREE.LatheGeometry(drumProf, 22), woodMat('#8a6440', 98, 0.78));
  drumBody.rotation.z = Math.PI / 2;
  drumBody.rotation.y = Math.PI / 2;
  drumBody.position.y = -0.3;
  WIN.drum.add(drumBody);
  WIN.axle = cyl(0.05, 0.05, 2.2, MX.satin, 12);
  WIN.axle.rotation.z = Math.PI / 2;
  WIN.drum.add(WIN.axle);
  WIN.wrap = mesh(new THREE.BufferGeometry(), matStd(CV.rope, { roughness: 0.9 }));
  WIN.drum.add(WIN.wrap);
  /* 摇把：曲柄臂（放样）+ 木柄（滚花） */
  WIN.crank = new THREE.Group();
  WIN.crank.position.set(0.34, 2.3, 0);
  g.add(WIN.crank);
  const armCurve = new THREE.CatmullRomCurve3([V3(0, 0, 0), V3(0.16, 0.2, 0), V3(0.22, 0.42, 0)]);
  const arm = mesh(new THREE.TubeGeometry(armCurve, 12, 0.032, 8, false), MX.forged);
  WIN.crank.add(arm);
  WIN.handle = cyl(0.042, 0.042, 0.3, MX.grip, 12);
  WIN.handle.rotation.x = Math.PI / 2;
  WIN.handle.position.set(0.22, 0.5, 0.06);
  WIN.handle.material.normalMap = KNURL;
  WIN.crank.add(WIN.handle);
  const hubCap = cyl(0.07, 0.07, 0.08, MX.brass, 12);
  hubCap.rotation.z = Math.PI / 2;
  WIN.crank.add(hubCap);
  /* 水桶 + 吊绳 */
  WIN.ropeMain = makeRope(CV.rope, 0.026);
  g.add(WIN.ropeMain);
  WIN.bucket = makePail(0.19, true);
  g.add(WIN.bucket);
  const tagW = label('辘轳 · 轮轴', '#ffd166', 0.0042);
  tagW.position.set(0, 3.5, 0);
  g.add(tagW);
  equipLabels.push(tagW);
  updWinch();
}
function updWinch() {
  if (!WIN.drum) return;
  const { R, r, k } = WIN;
  /* 水桶重：桶 30 N + 水（5L≈49N） */
  const Gw = 30 + WIN.water * 9.8;
  const F = Gw * r / R / k;
  /* 缠绳螺旋：随圈数更新管几何 */
  const turns = WIN.turns;
  const lifted = turns * TAU * r;
  const coilTurns = 1 + turns;
  const coilPts = [];
  for (let i = 0; i <= 26; i++) {
    const t = i / 26;
    const a = t * TAU * coilTurns;
    /* 缠绳贴着卷筒筒身堆积（每圈约 0.045 厚，随圈数下移） */
    coilPts.push(V3(Math.cos(a) * (r + 0.035), 0.26 - t * Math.min(turns * 0.045, 0.24), Math.sin(a) * (r + 0.035)));
  }
  {
    const curve = new THREE.CatmullRomCurve3(coilPts);
    const g2 = new THREE.TubeGeometry(curve, 40, 0.02, 6, false);
    WIN.wrap.geometry.dispose();
    WIN.wrap.geometry = g2;
  }
  /* 摇把姿态：绕轴转 turns 圈 */
  WIN.crank.rotation.z = -turns * TAU;
  /* 桶位置：从井口升到卷筒下方（h = turns·2πr，桶到筒底即停） */
  const bucketY = clamp(0.62 + lifted, 0.62, 1.55);
  WIN.bucket.position.set(0, bucketY, 0);
  WIN.ropeMain.set(V3(0, 2.28, 0), V3(0, bucketY + 0.34, 0));
  /* 手走过的路 s = turns·2πR，桶升高 h = turns·2πr */
  hset('wF', F.toFixed(1) + ' N');
  hset('wG', Gw.toFixed(0) + ' N');
  hset('wIdeal', (Gw * r / R).toFixed(1) + ' N');
  hset('wTurns', turns.toFixed(1) + ' 圈');
  hset('wHand', (turns * TAU * R).toFixed(2) + ' m');
  hset('wH', Math.min(lifted, 0.93).toFixed(2) + ' m');
}

/* ============ 07 机械效率（复用滑轮组 / 斜面，记录 + 曲线） ============ */

const EFF = { machine: 'pulley', n: 3, pullDown: false, bricks: 16, gp: 1, k: 0.94, surface: 'rough', m: 100, L: 3, lift: 0, lifting: false, liftedOnce: false };
function buildEff(g) {
  /* 滑轮组侧（n=3） */
  EFF.gPulley = new THREE.Group();
  g.add(EFF.gPulley);
  buildBlockScene(EFF.gPulley);
  BLK.n = 3; BLK.pullDown = false; BLK.k = 0.94;
  updBlock();
  /* 斜面侧（复用造型，独立组） */
  EFF.gRamp = new THREE.Group();
  EFF.gRamp.position.set(-1.5, 0, 0);
  g.add(EFF.gRamp);
  buildRamp(EFF.gRamp);
  RAMP.L = 3; RAMP.m = 100;
  updRamp();
  updEff();
}
function effParams() {
  const G = (EFF.machine === 'pulley' ? EFF.bricks * 100 : EFF.m * 9.8);
  let F, h, s, useful, total;
  if (EFF.machine === 'pulley') {
    const Gp = EFF.gp * 9.8 * (EFF.n >= 4 ? 2 : 1);
    F = (G + Gp) / EFF.n / EFF.k;
    h = EFF.lift * 1.6;
    s = EFF.n * h;
    useful = G * h;
    total = F * s;
  } else {
    const th = Math.asin(clamp(RAMP_H / EFF.L, 0, 1));
    const mu = RAMP_MU[EFF.surface];
    F = G * Math.sin(th) + mu * G * Math.cos(th);
    h = RAMP_H;
    s = EFF.L;
    useful = G * h;
    total = F * s * (EFF.lift > 0 ? 1 : 0.999);
  }
  const eta = total > 0 ? useful / total * 100 : 0;
  return { G, F, h, s, useful, total, eta };
}
function updEff() {
  if (EFF.machine === 'pulley') {
    EFF.gPulley.visible = true;
    EFF.gRamp.visible = false;
    BLK.n = EFF.n; BLK.pullDown = EFF.pullDown; BLK.bricks = EFF.bricks; BLK.gp = EFF.gp; BLK.k = EFF.k;
    BLK.lift = EFF.lift;
    updBlock();
  } else {
    EFF.gPulley.visible = false;
    EFF.gRamp.visible = true;
    RAMP.L = EFF.L; RAMP.surface = EFF.surface; RAMP.m = EFF.m; RAMP.push = EFF.lift;
    updRamp();
  }
  const p = effParams();
  hset('eWu', p.useful.toFixed(1) + ' J');
  hset('eWt', p.total.toFixed(1) + ' J');
  hset('eWe', (p.total - p.useful).toFixed(1) + ' J');
  hset('eEta', p.h > 0.01 || EFF.machine === 'incline' ? p.eta.toFixed(1) + ' %' : '—');
  hset('eG', p.G.toFixed(0) + ' N');
  hset('eF', p.F.toFixed(1) + ' N');
}

/* ============ 08 生活中的机械（塔吊 + 桔槔） ============ */

const CRANE_MMAX = 600;   // 额定力矩 600 kN·m（教学档）
const LIFE = {
  machine: 'crane', load: 'bricks', falls: 4, radius: 3, h: 0,
  stone: 20, pull: 0, pulling: false, buckets: 0,
  lifting: false,
};
const CRANE_LOADS = [
  ['bricks', '砖托 1.2 t', 1.2],
  ['rebar', '钢筋捆 2 t', 2],
  ['hopper', '混凝土料斗 3.2 t', 3.2],
  ['stair', '楼梯预制板 5 t', 5],
];
function buildCrane(g) {
  const c = new THREE.Group();
  LIFE.crane = c;
  g.add(c);
  /* 基础：混凝土块 + 压重 + 塔身底节 */
  const base = roundedSlab(3.4, 3.4, 0.5, 0.08, matStd(0xffffff, { roughness: 0.92 }), 0.02, 'flat');
  base.material.map = concreteTexture('#8f8b82', 384, 384, 71);
  base.position.y = 0.25;
  c.add(base);
  const shC = shadowBlob(4.4, 0.36);
  shC.position.set(0, 0.012, 0);
  g.add(shC);
  const yellowM = paintMat(css('safety', 1), { roughness: 0.42 });
  /* 塔身：格构柱（四主肢 + 水平/斜腹杆 InstancedMesh） */
  const mastH = 9.2, seg = 1.15, w = 0.62;
  const chordGeo = box(0.09, seg, 0.09, yellowM);
  const chords = new THREE.InstancedMesh(chordGeo.geometry, yellowM, 4 * Math.ceil(mastH / seg));
  const braces = new THREE.InstancedMesh(box(0.05, 0.05, 1).geometry, yellowM, 60);
  let ci = 0, bi = 0;
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  for (let y = 0; y < mastH - 0.1; y += seg) {
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      m4.compose(V3(sx * w / 2, y + seg / 2, sz * w / 2), q, V3(1, 1, 1));
      chords.setMatrixAt(ci++, m4);
    }
    for (const sz of [-1, 1]) {
      m4.compose(V3(0, y + seg, sz * w / 2), q.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2), V3(w, 1, 1));
      braces.setMatrixAt(bi++ % 60, m4);
      m4.compose(V3(w / 2 * (bi % 2 ? 1 : -1), y + seg / 2, 0), q.setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(1, 0.6, 0).normalize()), V3(w * 1.12, 1, 1));
      braces.setMatrixAt(bi++ % 60, m4);
      q.identity();
    }
  }
  chords.count = ci;
  braces.count = Math.min(bi, 60);
  chords.instanceMatrix.needsUpdate = true;
  braces.instanceMatrix.needsUpdate = true;
  c.add(chords, braces);
  /* 回转平台 + 机器房 + 驾驶室 */
  const slew = cyl(0.8, 0.9, 0.3, MX.dark, 20);
  slew.position.y = mastH + 0.15;
  c.add(slew);
  const house = roundedSlab(1.5, 1.0, 0.8, 0.08, yellowM, 0.02, 'flat');
  house.position.set(-0.2, mastH + 0.62, 0);
  c.add(house);
  const drumH = cyl(0.22, 0.22, 0.7, MX.dark, 16);
  drumH.rotation.x = Math.PI / 2;
  drumH.position.set(-0.2, mastH + 1.05, 0);
  c.add(drumH);
  LIFE.drumH = drumH;
  const cabB = roundedSlab(0.8, 0.9, 0.85, 0.1, yellowM, 0.02, 'flat');
  cabB.position.set(0.85, mastH + 0.6, 0.35);
  c.add(cabB);
  const cabWin = box(0.66, 0.5, 0.66, matGlass(css('chrome', 0.8), { opacity: 0.62 }));
  cabWin.position.set(0.85, mastH + 0.72, 0.35);
  c.add(cabWin);
  /* 塔尖 + 拉索 */
  const apex = mesh(new THREE.ConeGeometry(0.16, 1.5, 8), yellowM);
  apex.position.set(-0.4, mastH + 1.9, 0);
  c.add(apex);
  /* 平衡臂（短）+ 配重块 ×3 */
  const cjib = box(3.0, 0.22, 0.6, yellowM);
  cjib.position.set(-2.4, mastH + 0.4, 0);
  c.add(cjib);
  for (const zs of [-0.22, 0.22]) {
    const cRail = box(3.0, 0.08, 0.08, yellowM);
    cRail.position.set(-2.4, mastH + 0.75, zs);
    c.add(cRail);
  }
  const cwMat = matStd(0xffffff, { roughness: 0.92 });
  cwMat.map = concreteTexture('#8f8b82', 256, 256, 67);
  for (let i = 0; i < 3; i++) {
    const cw = box(0.72, 0.6, 0.52, cwMat);
    cw.position.set(-3.3 + 0, mastH + 0.1 - i * 0.62 + 0.5, 0);
    c.add(cw);
  }
  /* 起重臂：变宽三角桁架放样（下弦双肢 + 上弦 + 腹杆阵列） */
  LIFE.jib = new THREE.Group();
  LIFE.jib.position.y = mastH + 0.42;
  c.add(LIFE.jib);
  const jibLen = 9.6;
  const jibCurve = new THREE.CatmullRomCurve3([V3(0.4, 0, 0), V3(3, 0.12, 0), V3(6, 0.06, 0), V3(9.3, -0.14, 0)]);
  const lowerGeo = sweepBar(jibCurve, 40);
  const lower1 = mesh(lowerGeo, yellowM);
  lower1.position.z = 0.2;
  const lower2 = mesh(lowerGeo, yellowM);
  lower2.position.z = -0.2;
  LIFE.jib.add(lower1, lower2);
  const topChordPts = [];
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    topChordPts.push(V3(0.4 + t * 8.9, 0.5 - t * 0.22, 0));
  }
  const topChord = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(topChordPts), 30, 0.05, 8, false), yellowM);
  LIFE.jib.add(topChord);
  const webGeo = box(0.04, 1, 0.04, yellowM);
  const webs = new THREE.InstancedMesh(webGeo.geometry, yellowM, 26);
  let wi = 0;
  for (let i = 0; i < 11; i++) {
    const t = i / 10;
    const y0 = 0.5 - t * 0.22;
    const len = Math.hypot(y0, 0.2);
    q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, y0, 0.2).normalize());
    m4.compose(V3(0.4 + t * 8.9, y0 / 2, 0.2 / 2), q, V3(1, len, 1));
    webs.setMatrixAt(wi++ % 26, m4);
    q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, y0, -0.2).normalize());
    m4.compose(V3(0.4 + t * 8.9, y0 / 2, -0.2 / 2), q, V3(1, len, 1));
    webs.setMatrixAt(wi++ % 26, m4);
  }
  q.identity();
  webs.count = Math.min(wi, 26);
  webs.instanceMatrix.needsUpdate = true;
  LIFE.jib.add(webs);
  /* 塔尖拉索 → 臂中段 + 臂尖 */
  LIFE.tieA = makeRope(CV.wire, 0.026);
  LIFE.tieB = makeRope(CV.wire, 0.026);
  LIFE.jib.add(LIFE.tieA, LIFE.tieB);
  /* 变幅小车 + 吊钩滑轮组 + 吊物 */
  LIFE.trolley = new THREE.Group();
  const tb = box(0.42, 0.2, 0.55, MX.dark);
  LIFE.trolley.add(tb);
  for (const zs of [-0.16, 0.16]) {
    const shv = cyl(0.11, 0.11, 0.05, MX.chrome, 14);
    shv.rotation.x = Math.PI / 2;
    shv.position.set(0, -0.14, zs);
    LIFE.trolley.add(shv);
  }
  LIFE.jib.add(LIFE.trolley);
  LIFE.hookBlock = new THREE.Group();
  const hb = roundedSlab(0.3, 0.4, 0.18, 0.04, MX.dark, 0.01, 'flat');
  LIFE.hookBlock.add(hb);
  LIFE.hookSheaves = [];
  for (let i = 0; i < 2; i++) {
    const shv = cyl(0.1, 0.1, 0.05, MX.chrome, 14);
    shv.rotation.x = Math.PI / 2;
    shv.position.set(0, 0.14, i === 0 ? -0.1 : 0.1);
    LIFE.hookBlock.add(shv);
    LIFE.hookSheaves.push(shv);
  }
  LIFE.hook = makeHook(1.2);
  LIFE.hook.position.y = -0.34;
  LIFE.hookBlock.add(LIFE.hook);
  c.add(LIFE.hookBlock);
  /* 四种吊物（切换显示） */
  LIFE.loads = {};
  {
    const bricks = brickStack(30, brickMatShared);
    bricks.scale.set(1.5, 1.5, 1.5);
    bricks.position.y = 0.18;
    const pal = makePallet(1.9);
    LIFE.loads.bricks = new THREE.Group();
    LIFE.loads.bricks.add(pal, bricks);
    LIFE.loads.bricks.userData.mass = 1.2;
  }
  {
    const bundle = new THREE.Group();
    const rebarM = matStd(tone(CV.wire, 0.85), { roughness: 0.5, metalness: 0.7 });
    for (let i = 0; i < 7; i++) {
      const bar = cyl(0.045, 0.045, 4.2, rebarM, 10);
      bar.rotation.x = Math.PI / 2;
      const a = (i / 7) * TAU;
      bar.position.set(0, Math.cos(a) * 0.13, Math.sin(a) * 0.13);
      bundle.add(bar);
    }
    for (const bx of [-1.4, 1.4]) {
      const bind = mesh(new THREE.TorusGeometry(0.2, 0.016, 6, 16), MX.dark);
      bind.position.set(bx, 0, 0);
      bundle.add(bind);
    }
    LIFE.loads.rebar = bundle;
    LIFE.loads.rebar.userData.mass = 2;
  }
  {
    const hop = new THREE.Group();
    const hopShape = new THREE.Shape();
    hopShape.moveTo(-0.55, 0.9);
    hopShape.lineTo(0.55, 0.9);
    hopShape.lineTo(0.32, 0);
    hopShape.lineTo(-0.32, 0);
    hopShape.closePath();
    const hopGeo = new THREE.ExtrudeGeometry(hopShape, { depth: 0.9, bevelEnabled: false });
    hopGeo.translate(0, 0, -0.45);
    const hopM = paintMat(css('safety', 0.9), { roughness: 0.46 });
    const hopB = mesh(hopGeo, hopM);
    hop.add(hopB);
    const bail = mesh(new THREE.TorusGeometry(0.3, 0.03, 8, 18), MX.dark);
    bail.position.y = 1.0;
    hop.add(bail);
    LIFE.loads.hopper = hop;
    LIFE.loads.hopper.userData.mass = 3.2;
  }
  {
    const stair = new THREE.Group();
    const stM = matStd(0xffffff, { roughness: 0.9 });
    stM.map = concreteTexture('#a8a8a2', 256, 256, 83);
    const stShape = new THREE.Shape();
    stShape.moveTo(0, 0);
    for (let i = 0; i < 6; i++) {
      stShape.lineTo(i * 0.28, i * 0.2);
      stShape.lineTo(i * 0.28 + 0.28, i * 0.2);
    }
    stShape.lineTo(6 * 0.28 + 0.28, 0);
    stShape.closePath();
    const stGeo = new THREE.ExtrudeGeometry(stShape, { depth: 1.0, bevelEnabled: false });
    stGeo.translate(0, 0, -0.5);
    stair.add(mesh(stGeo, stM));
    const eyeL = mesh(new THREE.TorusGeometry(0.07, 0.02, 6, 14), MX.dark);
    eyeL.position.set(0.5, 1.35, 0);
    stair.add(eyeL);
    LIFE.loads.stair = stair;
    LIFE.loads.stair.userData.mass = 5;
  }
  for (const k of Object.keys(LIFE.loads)) {
    LIFE.loads[k].visible = false;
    c.add(LIFE.loads[k]);
  }
  /* 地面吊物垫 + 标签 */
  LIFE.loadTag = label('', '#9be29b', 0.0046);
  c.add(LIFE.loadTag);
  const tagC = label('塔吊 · 力矩限制器', '#ffd166', 0.005);
  tagC.position.set(-0.4, mastH + 3.1, 0);
  c.add(tagC);
  equipLabels.push(tagC);
  LIFE.momentPad = mesh(new THREE.RingGeometry(1.2, 1.5, 32), new THREE.MeshBasicMaterial({
    color: CV.warn, transparent: true, opacity: 0.3, side: THREE.DoubleSide,
  }));
  LIFE.momentPad.rotation.x = -Math.PI / 2;
  LIFE.momentPad.position.y = 0.02;
  g.add(LIFE.momentPad);
}
function buildSweep(g) {
  /* 桔槔：石座 + 立柱 + 锥形横木 + 配重石 + 水井 + 吊桶 */
  const s = new THREE.Group();
  LIFE.sweep = s;
  g.add(s);
  if (!MX.stone) {
    MX.stone = matStd(0xffffff, { roughness: 0.95 });
    MX.stone.map = stoneTexture(13);
  }
  const base = mesh(new THREE.CylinderGeometry(0.5, 0.62, 0.4, 18), MX.stone);
  base.position.y = 0.2;
  s.add(base);
  const post = cyl(0.09, 0.12, 3.3, woodMat('#7a5a38', 61, 0.74), 14);
  post.position.y = 1.85;
  s.add(post);
  const fork = box(0.26, 0.08, 0.08, MX.forged);
  fork.position.y = 3.4;
  s.add(fork);
  LIFE.beam = new THREE.Group();
  LIFE.beam.position.y = 3.42;
  s.add(LIFE.beam);
  const beamCurve = new THREE.CatmullRomCurve3([V3(-1.05, 0.02, 0), V3(-0.2, 0, 0), V3(1.2, -0.04, 0), V3(3.1, -0.1, 0)]);
  const beamM = mesh(sweepBar(beamCurve, 40), woodMat('#8a6845', 62, 0.72));
  beamM.scale.set(0.8, 0.8, 1.5);
  LIFE.beam.add(beamM);
  /* 短臂端：配重石（stoneMesh 与配重档位状态分离） */
  LIFE.stoneMesh = mesh(new THREE.DodecahedronGeometry(0.34, 1), MX.stone);
  s.add(LIFE.stoneMesh);
  LIFE.sRope = makeRope(CV.rope, 0.024);
  s.add(LIFE.sRope);
  /* 长臂端：水井 + 吊桶 */
  const well = mesh(new THREE.CylinderGeometry(0.66, 0.72, 0.5, 20, 1, true), MX.stone);
  well.material.side = THREE.DoubleSide;
  well.position.set(4.6, 0.25, 0);
  s.add(well);
  const wellWater = cyl(0.58, 0.58, 0.02, waterMat(), 20);
  wellWater.position.set(4.6, 0.18, 0);
  s.add(wellWater);
  LIFE.bucket = makePail(0.2, true);
  s.add(LIFE.bucket);
  LIFE.bRope = makeRope(CV.rope, 0.024);
  s.add(LIFE.bRope);
  const tagS = label('桔槔 · 配重提水', '#ffd166', 0.0042);
  tagS.position.set(0, 4.3, 0);
  s.add(tagS);
  const tagSt = label('配重石', '#8fc6ff', 0.0032);
  tagSt.position.set(-1.0, 3.9, 0);
  s.add(tagSt);
  equipLabels.push(tagS, tagSt);
  const shS = shadowBlob(3.4, 0.3);
  shS.scale.set(1, 0.7, 1);
  shS.position.set(1.6, 0.012, 0);
  s.add(shS);
}
function buildReal(g) {
  buildCrane(g);
  buildSweep(g);
  updReal();
}
const _beamTip = new THREE.Vector3();
function updReal() {
  /* —— 塔吊 —— */
  if (LIFE.crane) {
    const mass = LIFE.loads[LIFE.load].userData.mass;
    const r = LIFE.radius;
    const rated = CRANE_MMAX / (9.8 * r);
    const over = mass > rated;
    const h = LIFE.h * 3.6;
    LIFE.trolley.position.set(clamp(r, 1.2, 9.2), 0.28, 0);
    LIFE.tieA.set(V3(-0.4, 1.45, 0).add(LIFE.jib.position), V3(4.6, 0.2, 0).add(LIFE.jib.position));
    LIFE.tieB.set(V3(-0.4, 1.45, 0).add(LIFE.jib.position), V3(8.6, -0.05, 0).add(LIFE.jib.position));
    /* 吊钩组 + 吊物位置 */
    const hookY = LIFE.jib.position.y + 0.05 - 0.5 - h;
    LIFE.hookBlock.position.set(clamp(r, 1.2, 9.2), hookY, 0);
    LIFE.hookSheaves.forEach((sh, i) => { sh.visible = LIFE.falls === 4; });
    LIFE.hook.visible = LIFE.falls === 2;
    const loadG = LIFE.loads[LIFE.load];
    loadG.visible = true;
    for (const k of Object.keys(LIFE.loads)) if (k !== LIFE.load) LIFE.loads[k].visible = false;
    loadG.position.set(clamp(r, 1.2, 9.2), hookY - 0.5, 0);
    /* 钢丝绳：卷筒 → 小车 → 吊钩（倍率决定股数感） */
    LIFE.cableA = LIFE.cableA || makeRope(CV.wire, 0.02);
    if (!LIFE.cableA.parent) LIFE.crane.add(LIFE.cableA);
    LIFE.cableA.set(V3(clamp(r, 1.2, 9.2), LIFE.jib.position.y + 0.05, 0), V3(clamp(r, 1.2, 9.2), hookY + 0.28, 0));
    /* 超载表现：臂头下压 + 报警圈 + 红 tag */
    LIFE.jib.rotation.z = over ? -0.02 - Math.min((mass / rated - 1) * 0.03, 0.05) : 0;
    LIFE.momentPad.visible = over;
    retext(LIFE.loadTag, over
      ? '超载！' + mass.toFixed(1) + ' t > 额定 ' + rated.toFixed(2) + ' t'
      : mass.toFixed(1) + ' t ≤ 额定 ' + rated.toFixed(2) + ' t', over ? '#ff8a7a' : '#9be29b');
    LIFE.loadTag.position.set(clamp(r, 1.2, 9.2), hookY - 1.1, 0);
    LIFE.drumH.rotation.x = LIFE.h * 8;
    hset('cR', r.toFixed(1) + ' m');
    hset('cM', mass.toFixed(1) + ' t');
    hset('cRated', rated.toFixed(2) + ' t');
    hset('cLoad', (mass * 9.8 * r / CRANE_MMAX * 100).toFixed(0) + ' %' + (over ? '（超载）' : ''));
    hset('cWire', (mass * 9.8 / LIFE.falls).toFixed(1) + ' kN（' + LIFE.falls + ' 倍率）');
    hset('cH', Math.max((1 - LIFE.h) * 3.6, 0).toFixed(1) + ' m');
  }
  /* —— 桔槔 —— */
  if (LIFE.sweep) {
    const Gstone = LIFE.stone * 9.8;
    const Gfull = 130, Gempty = 22;
    const Llong = 3.1, Lshort = 1.0;
    /* pull: 0 = 松手（配重压下短臂 → 长臂吊桶上升）；1 = 按住长臂（桶落井） */
    const ang = lerp(0.1, -0.34, LIFE.pull);
    LIFE.beam.rotation.z = ang;
    LIFE.beam.updateWorldMatrix(true, false);
    _beamTip.set(3.1, -0.1, 0).applyMatrix4(LIFE.beam.matrixWorld);
    const ropeLen = lerp(0.62, 1.5, LIFE.pull);
    LIFE.bucket.position.set(_beamTip.x, _beamTip.y - ropeLen - 0.16, _beamTip.z);
    LIFE.bRope.set(_beamTip.clone(), V3(_beamTip.x, _beamTip.y - ropeLen, _beamTip.z));
    _beamTip.set(-1.0, 0.02, 0).applyMatrix4(LIFE.beam.matrixWorld);
    LIFE.stoneMesh.visible = LIFE.stone > 0;
    if (LIFE.stone > 0) LIFE.stoneMesh.scale.setScalar(0.72 + (LIFE.stone / 30) * 0.5);
    LIFE.stoneMesh.position.set(_beamTip.x, _beamTip.y - 0.4, _beamTip.z);
    LIFE.sRope.set(_beamTip.clone(), V3(_beamTip.x, _beamTip.y - 0.22, _beamTip.z));
    /* 用力读数 */
    const Fdown = Math.max((Gstone * Lshort - Gempty * Llong) / Llong, 0);
    const Fup = Math.max((Gfull * Llong - Gstone * Lshort) / Llong, 0);
    const FnoStone = Gfull;
    const full = LIFE.pull < 0.4;
    hset('jDown', Fdown.toFixed(0) + ' N');
    hset('jUp', Fup.toFixed(0) + ' N');
    hset('jNo', FnoStone.toFixed(0) + ' N');
    hset('jNow', (LIFE.pull > 0.6 ? Fdown : Fup).toFixed(0) + ' N');
    hset('jWater', full ? '满桶' : '空桶');
    hset('jCnt', LIFE.buckets + ' 桶');
  }
}

/* ============ 09 随堂检测 ============ */

const QUIZ = [
  {
    q: '用撬棍起一块大石头，想把用的力降到最小，下面哪种操作最合适？',
    opts: ['垫块挨着石头，手握撬棍末端，顺着撬棍斜着使劲', '垫块挨着石头，手握撬棍末端，垂直撬棍使劲', '垫块移到手边，手握撬棍中间', '手握位置无所谓，只要使劲就行'],
    a: 1,
    ex: '支点越靠近石头，阻力臂 L₂ 越短；手握末端，动力臂 L₁ 最长；垂直撬棍用力时力臂不打折。三者同时满足才最省力，斜着用力会把力臂缩短一截。',
  },
  {
    q: '下面几件器械里，属于费力杠杆的是？',
    opts: ['独轮车', '瓶起子', '钓鱼竿', '钢丝钳'],
    a: 2,
    ex: '钓鱼竿的手握端到支点的动力臂，远小于鱼到支点的阻力臂，费力但省距离——手抖一小段，竿尖甩出很大弧线。其余三件都是省力杠杆。',
  },
  {
    q: '用定滑轮把重物匀速吊起，下面说法正确的是？',
    opts: ['可以省一半的力', '能改变用力的方向，但省不了力', '绳端移动的距离是重物升高的一半', '斜着拉绳时拉力会明显变大'],
    a: 1,
    ex: '定滑轮实质是等臂杠杆：力臂始终等于轮半径，所以不省力也不费距离，但能把向下的拉力换成把物体向上吊——升旗就是典型用法。',
  },
  {
    q: '用 n = 4 的滑轮组匀速吊起 360 N 的货箱，动滑轮共重 40 N，不计绳重与摩擦，绳端拉力是？',
    opts: ['90 N', '100 N', '180 N', '400 N'],
    a: 1,
    ex: '动滑轮的重量也被 n 段绳子分担：F = (G + G动) / n = (360 + 40) / 4 = 100 N。同时绳端要移动 s = 4h，省力必然费距离。',
  },
  {
    q: '沿长 3 m、高 1.2 m 的跳板把 500 N 的木箱匀速拉上车，拉力 250 N，斜面的机械效率是？',
    opts: ['40%', '60%', '80%', '100%'],
    a: 2,
    ex: 'W有 = G·h = 500 × 1.2 = 600 J；W总 = F·L = 250 × 3 = 750 J；η = 600 / 750 = 80%。多出来的 150 J 花在了克服摩擦上。',
  },
  {
    q: '辘轳摇把长 40 cm，轴半径 8 cm，不计摩擦，吊起 150 N 的水桶需要多大的力？',
    opts: ['30 N', '60 N', '150 N', '750 N'],
    a: 0,
    ex: '轮轴是连续旋转的杠杆：F × R = G × r，即 F = 150 × 0.08 / 0.4 = 30 N。代价是手要走过 5 倍于水桶升高的路程。',
  },
  {
    q: '想让一套滑轮组的机械效率变高，可行的做法是？',
    opts: ['给滑轮组多加一段承重绳', '换更重的动滑轮', '吊更重的货物', '把货物吊得更高'],
    a: 2,
    ex: '额外功（提动滑轮、克服摩擦）基本不随物重变化，货物越重，有用功在总功里的占比就越大。加重动滑轮反而增加额外功，效率下降。',
  },
  {
    q: '塔吊的变幅小车往外走，能吊起的最大质量跟着变小，原因是什么？',
    opts: ['钢丝绳被拉长了', '吊重的力臂变长，力矩更容易顶到上限', '配重块变轻了', '吊钩滑轮组的倍率变小了'],
    a: 1,
    ex: '平衡臂配重能扛的力矩有上限。幅度 r 越大，「起重量 × 幅度」越容易越界，所以额定起重量随幅度递减——力矩限制器就是盯着这个乘积的。',
  },
];

function showQuiz() {
  let idx = 0, score = 0;
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
      <p style="color:var(--text-dim);margin:4px 0 18px">正确率 ${pct}%${pct >= 80 ? '，简单机械这章很扎实！' : pct >= 60 ? '，大概念清楚了，错题值得再过一遍。' : '，建议回到前面章节把各件器械再看一遍。'}</p>`;
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
  }
  renderQ();
  return () => panel.remove();
}

/* ================= HUD / 测量记录 / 曲线 ================= */

let hud = null;
function setHudRows(rows) {
  const wrap = document.getElementById('lcData');
  if (hud) { hud.el.remove(); hud = null; }
  clearLog();
  if (rows && rows.length) {
    hud = makeHUD(wrap, rows);
    rows.forEach(([k]) => hud.set(k, '–'));
  }
  ensureLog(wrap);
}
function hset(key, text) { if (hud) hud.set(key, text); }

/* 测量记录表（原版功能 1:1）：条件行 + 数值列 + 清空；机械效率章带 η–G 曲线 */
const REC = {};   // chapterId -> { cols, rows, key, cond }
let logBox = null;
function ensureLog(wrap) {
  if (logBox && logBox.isConnected) return;
  logBox = document.createElement('div');
  logBox.className = 'mach-log';
  logBox.innerHTML = `
    <div class="mach-log-head">测量记录<span class="log-count" id="logCount"></span><button class="log-clear" type="button" id="logClearBtn">清空</button></div>
    <div class="log-empty" id="logEmpty">还没有数据。操作后按「记录数据」。</div>
    <div class="log-scroll" id="logScroll" style="display:none"><table><thead id="logHead"></thead><tbody id="logBody"></tbody></table></div>
    <canvas class="mach-chart" id="etaChart" width="300" height="170" style="display:none"></canvas>
    <div class="chart-note" id="chartNote" style="display:none">横轴：物重 G（N） · 纵轴：机械效率 η。同色折线 = 同一套条件，点越多曲线越完整。</div>`;
  logBox.querySelector('#logClearBtn').addEventListener('click', clearLog);
  wrap.appendChild(logBox);
}
function logSetCols(chapterId, cols) {
  const rec = REC[chapterId] || (REC[chapterId] = { cols, rows: [], key: '', cond: '' });
  rec.cols = cols;
  paintLog(chapterId);
}
function logSetCond(chapterId, cond) {
  const rec = REC[chapterId] || (REC[chapterId] = { cols: [], rows: [] });
  rec.cond = cond;
}
function logAddRow(chapterId, row, opts = {}) {
  const rec = REC[chapterId] || (REC[chapterId] = { cols: [], rows: [] });
  rec.rows.push({ row, bad: !!opts.bad, key: opts.key || rec.cond });
  paintLog(chapterId);
}
function clearLog() {
  const cur = window.__machineChapter;
  if (cur && REC[cur]) {
    REC[cur].rows = [];
    paintLog(cur);
  }
}
function paintLog(chapterId) {
  const rec = REC[chapterId];
  if (!logBox || !rec) return;
  const head = logBox.querySelector('#logHead');
  const body = logBox.querySelector('#logBody');
  const empty = logBox.querySelector('#logEmpty');
  const scroll = logBox.querySelector('#logScroll');
  const count = logBox.querySelector('#logCount');
  if (!rec.rows.length) {
    scroll.style.display = 'none';
    empty.style.display = '';
    if (head) head.innerHTML = '';
    if (count) count.textContent = '';
  } else {
    empty.style.display = 'none';
    scroll.style.display = '';
    head.innerHTML = '<tr>' + rec.cols.map((c) => '<th>' + c + '</th>').join('') + '</tr>';
    body.innerHTML = rec.rows.map((r) => '<tr' + (r.bad ? ' class="bad"' : '') + '>' + r.row.map((v) => '<td>' + v + '</td>').join('') + '</tr>').join('');
    scroll.scrollTop = scroll.scrollHeight;
    count.textContent = rec.rows.length + ' 行';
  }
  const chart = logBox.querySelector('#etaChart');
  const note = logBox.querySelector('#chartNote');
  if (chapterId === 'eff') {
    chart.style.display = '';
    note.style.display = '';
    drawEtaChart(chart);
  } else {
    chart.style.display = 'none';
    note.style.display = 'none';
  }
}
/* η–G 曲线：按条件分组折线 + 网格 + 图例 */
const CHART_COLORS = ['#f6b93f', '#4fb3e8', '#a4d96e', '#f0907e', '#b39ddb', '#ef9ab5'];
function drawEtaChart(cv) {
  const ctx = cv.getContext('2d');
  const W = cv.width, H = cv.height;
  const padL = 34, padR = 10, padT = 10, padB = 22;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(10,14,20,0.55)';
  ctx.fillRect(0, 0, W, H);
  const rec = REC.eff;
  const groups = {};
  let gMax = 1000;
  if (rec && rec.rows.length) {
    rec.rows.forEach((r) => {
      (groups[r.key] || (groups[r.key] = [])).push({ G: r.row[0], eta: parseFloat(r.row[6]) });
    });
    gMax = Math.max(1000, ...rec.rows.map((r) => r.row[0])) * 1.1;
  }
  const xOf = (g) => padL + (g / gMax) * (W - padL - padR);
  const yOf = (e) => padT + (1 - e / 100) * (H - padT - padB);
  ctx.strokeStyle = 'rgba(226,231,236,0.14)';
  ctx.fillStyle = 'rgba(226,231,236,0.55)';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'right';
  for (const e of [0, 25, 50, 75, 100]) {
    ctx.beginPath();
    ctx.moveTo(padL, yOf(e));
    ctx.lineTo(W - padR, yOf(e));
    ctx.stroke();
    ctx.fillText(e + '%', padL - 4, yOf(e) + 3);
  }
  ctx.textAlign = 'center';
  const step = gMax > 2400 ? 800 : gMax > 1200 ? 400 : 200;
  for (let g = 0; g <= gMax; g += step) {
    ctx.fillText(String(g), xOf(g), H - 8);
  }
  let li = 0;
  for (const [key, pts] of Object.entries(groups)) {
    const color = CHART_COLORS[li % CHART_COLORS.length];
    pts.sort((a, b) => a.G - b.G);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    pts.forEach((p, i) => {
      const x = xOf(p.G), y = yOf(p.eta);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.fillStyle = color;
    pts.forEach((p) => {
      ctx.beginPath();
      ctx.arc(xOf(p.G), yOf(p.eta), 2.6, 0, TAU);
      ctx.fill();
    });
    ctx.fillStyle = 'rgba(240,240,240,0.85)';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(key, padL + 4 + (li % 3) * 92, padT + 10 + Math.floor(li / 3) * 13);
    li++;
  }
  if (!li) {
    ctx.fillStyle = 'rgba(226,231,236,0.5)';
    ctx.font = '11px "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('记录两三个物重档后，这里画出 η–G 折线', W / 2, H / 2);
  }
}

/* ================= 控件与章节装配 ================= */

const ctl = createControlsPanel(document.getElementById('controls'));
let chapterTick = null;
let activeCleanup = null;
let quizCleanup = null;

function camTo(pos, target) { app.setCamera(pos, target); }

/* 操作提示条（插在控件区顶部，对应原版每章的操作指引） */
function hintEl(text) {
  const d = document.createElement('div');
  d.className = 'mach-hint';
  d.innerHTML = '<i>做法</i><span>' + text + '</span>';
  ctl.el.appendChild(d);
}

/* —— 01 杠杆 —— */
function leverCtl() {
  ctl.clear();
  ctl.slider({
    label: '支点位置', min: -2.4, max: 1.8, step: 0.05, value: LEV.pivot,
    fmt: (v) => 'x=' + v.toFixed(1),
    onInput: (v) => { LEV.pivot = v; updLever(); },
  });
  ctl.seg({
    options: [
      { label: '竖直向下', value: 'down' },
      { label: '垂直撬棍', value: 'perp' },
      { label: '斜着用力', value: 'slant' },
    ],
    value: LEV.dir,
    onChange: (v) => { LEV.dir = v; updLever(); },
  });
  ctl.sep();
  ctl.button({
    label: '▼ 下压撬棍', active: true,
    onClick: () => { if (!LEV.pressing && LEV.press < 1) LEV.pressing = true; },
  });
  ctl.button({ label: '↺ 复位', onClick: () => { LEV.press = 0; LEV.pressing = false; updLever(); } });
  ctl.sep();
  ctl.toggle({
    label: '模型标注', value: labelsOn,
    onChange: (v) => { setLabels(v); },
  });
  hintEl('按「下压撬棍」看拉力计读数与石块抬升；换一种用力方向，再挪动支点对比力臂。');
  setHudRows([
    ['f1', '动力 F₁'], ['f2', '阻力 F₂'],
    ['l1', '动力臂 L₁'], ['l2', '阻力臂 L₂'],
    ['m1', 'F₁ × L₁'], ['m2', 'F₂ × L₂'],
  ]);
  updLever();
}

/* —— 02 分类 —— */
function kindsCtl() {
  ctl.clear();
  ctl.seg({
    options: [
      { label: '独轮车', value: 'wheelbarrow' },
      { label: '随车吊', value: 'boom' },
      { label: '杆秤', value: 'scale' },
    ],
    value: KND.kind,
    onChange: (v) => {
      KND.kind = v;
      focusKinds();
      camTo(...CAM_DEFAULTS.kinds[v]);
      kindsCtl();
    },
  });
  ctl.sep();
  if (KND.kind === 'wheelbarrow') {
    ctl.seg({
      options: [
        { label: '砂 30 kg', value: 30 }, { label: '砂 60 kg', value: 60 }, { label: '砂 90 kg', value: 90 },
      ].map((o) => ({ label: o.label, value: o.value })),
      value: KND.mLoad,
      onChange: (v) => { KND.mLoad = v; updKinds(); },
    });
    ctl.seg({
      options: [
        { label: '砂靠车轮', value: 'front' }, { label: '砂在中间', value: 'mid' }, { label: '砂靠把手', value: 'back' },
      ],
      value: KND.pos,
      onChange: (v) => { KND.pos = v; updKinds(); },
    });
    ctl.button({
      label: '▲ 抬起把手', active: true,
      onClick: () => { KND.tiltDir = 1; if (KND.tilt < 1) KND.tilting = true; },
    });
    ctl.button({ label: '↺ 放平', onClick: () => { KND.tilt = 0; KND.tiltDir = 0; updKinds(); } });
    setHudRows([['kF1', '手上抬的力 F₁'], ['kF2', '阻力 F₂（载重）'], ['kL1', '动力臂 L₁'], ['kL2', '阻力臂 L₂'], ['kS', '把手抬高'], ['kH', '砂子升高']]);
  } else if (KND.kind === 'boom') {
    ctl.seg({
      options: [
        { label: '钢管 300 N', value: 300 }, { label: '钢管 600 N', value: 600 }, { label: '钢管 900 N', value: 900 },
      ],
      value: KND.jibLoad,
      onChange: (v) => { KND.jibLoad = v; updKinds(); },
    });
    ctl.button({
      label: '▲ 升起起重臂', active: true,
      onClick: () => { if (KND.tilt < 1) KND.tilting = true; },
    });
    ctl.button({ label: '↺ 落臂', onClick: () => { KND.tilt = 0; updKinds(); } });
    setHudRows([['bF1', '液压缸的推力 F₁'], ['bF2', '阻力 F₂（吊重）'], ['bL1', '动力臂 L₁'], ['bL2', '阻力臂 L₂'], ['bS', '液压缸伸长'], ['bH', '吊钩升高']]);
  } else {
    ctl.seg({
      options: [
        { label: '一棵白菜', value: 'greens' }, { label: '一条鱼', value: 'fish' },
        { label: '一篮鸡蛋', value: 'eggbox' }, { label: '一袋米', value: 'rice' },
      ],
      value: KND.item,
      onChange: (v) => { KND.item = v; KND.load = ITEM_MASS[v]; updKinds(); },
    });
    ctl.slider({
      label: '秤砣位置', min: 0.05, max: 1.25, step: 0.01, value: KND.slider,
      fmt: (v) => (v * 100).toFixed(0) + ' cm',
      onInput: (v) => { KND.slider = v; updKinds(); },
    });
    setHudRows([['sX', '秤砣到提纽'], ['sBal', '秤杆'], ['sRead', '秤星读数'], ['sM0', '秤砣质量']]);
  }
  hintEl(KND.kind === 'wheelbarrow'
    ? '挪动砂堆位置（滑杆三选），再抬一把把手——砂越靠车轮越省力。'
    : KND.kind === 'boom'
      ? '换吊重档位再升起起重臂：液压缸只伸长一点点，吊钩却升高很多。'
      : '换货物后拖动秤砣滑杆，把秤杆调到水平，读数就是对准的秤星。');
  updKinds();
}
const ITEM_MASS = { greens: 3, fish: 1.5, eggbox: 2.5, rice: 5 };

/* —— 03 定滑轮与动滑轮 —— */
function pulleyCtl() {
  ctl.clear();
  ctl.slider({
    label: '桶里的砖', min: 0, max: 10, step: 1, value: PUL.bricks,
    fmt: (v) => v + ' 块',
    onInput: (v) => { PUL.bricks = v; updPulley(); },
  });
  ctl.slider({
    label: '拉绳方向（偏离竖直）', min: 0, max: 60, step: 5, value: PUL.angle,
    fmt: (v) => v + '°',
    onInput: (v) => { PUL.angle = v; updPulley(); },
  });
  ctl.seg({
    options: [
      { label: '动滑轮 0.5 kg', value: 0.5 }, { label: '动滑轮 1 kg', value: 1 }, { label: '动滑轮 3 kg', value: 3 },
    ],
    value: PUL.gp,
    onChange: (v) => { PUL.gp = v; updPulley(); },
  });
  ctl.seg({
    options: [{ label: '不计摩擦', value: 1 }, { label: '计摩擦（×0.94）', value: 0.94 }],
    value: PUL.k,
    onChange: (v) => { PUL.k = v; updPulley(); },
  });
  ctl.sep();
  ctl.button({
    label: '▲ 提升', active: true,
    onClick: () => { if (!PUL.lifting) { PUL.lifting = true; PUL.lift = 0; } },
  });
  ctl.button({ label: '↺ 复位', onClick: () => { PUL.lift = 0; PUL.lifting = false; updPulley(); } });
  ctl.sep();
  ctl.toggle({ label: '模型标注', value: labelsOn, onChange: (v) => setLabels(v) });
  hintEl('按「提升」吊一桶砖：左侧绳端放 1 格长度，右侧要拉 2 格；再加重动滑轮看拉力怎么涨。');
  setHudRows([
    ['pG', '物重 G'], ['pF', '定滑轮拉力 F'],
    ['mF', '动滑轮拉力 F'], ['pS', '绳端移动 s'],
    ['pGp', '动滑轮自重 G动'], ['pR', 'F ÷ G'],
  ]);
  updPulley();
}

/* —— 04 滑轮组 —— */
function blockCtl() {
  ctl.clear();
  ctl.seg({
    options: [2, 3, 4, 5].map((n) => ({ label: n + ' 段绳', value: n })),
    value: BLK.n,
    onChange: (v) => { BLK.n = v; updBlock(); },
  });
  ctl.seg({
    options: [{ label: '绳端向下拉', value: true }, { label: '绳端向上拉', value: false }],
    value: BLK.pullDown,
    onChange: (v) => { BLK.pullDown = v; updBlock(); },
  });
  ctl.slider({
    label: '托盘上的砖', min: 4, max: 48, step: 4, value: BLK.bricks,
    fmt: (v) => v + ' 块',
    onInput: (v) => { BLK.bricks = v; updBlock(); },
  });
  ctl.seg({
    options: [
      { label: '每只动滑轮 0.5 kg', value: 0.5 }, { label: '每只 1 kg', value: 1 }, { label: '每只 3 kg', value: 3 },
    ],
    value: BLK.gp,
    onChange: (v) => { BLK.gp = v; updBlock(); },
  });
  ctl.seg({
    options: [{ label: '不计摩擦', value: 1 }, { label: '计摩擦（×0.94）', value: 0.94 }],
    value: BLK.k,
    onChange: (v) => { BLK.k = v; updBlock(); },
  });
  ctl.sep();
  ctl.button({
    label: '▲ 提升', active: true,
    onClick: () => { if (!BLK.lifting) { BLK.lifting = true; BLK.lift = 0; } },
  });
  ctl.sep();
  ctl.toggle({ label: '模型标注', value: labelsOn, onChange: (v) => setLabels(v) });
  hintEl('换不同的绳子段数 n，数一数直接连在动滑轮上的绳段（画面上有编号）；试试「向上拉 / 向下拉」，n 不变。');
  setHudRows([
    ['n', '绳子段数 n'], ['gG', 'G + G动'],
    ['f', '拉力 F'], ['fn', '(G + G动) ÷ n'],
    ['h', '物体升高 h'], ['s', '绳端移动 s'],
  ]);
  updBlock();
}

/* —— 05 斜面 —— */
function rampCtl() {
  ctl.clear();
  ctl.seg({
    options: [
      { label: '2.4 m', value: 2.4 }, { label: '3 m', value: 3 }, { label: '4 m', value: 4 }, { label: '5 m', value: 5 },
    ],
    value: RAMP.L,
    onChange: (v) => { RAMP.L = v; updRamp(); },
  });
  ctl.seg({
    options: [
      { label: '粗糙木板', value: 'rough' }, { label: '刨光木板', value: 'smooth' },
      { label: '花纹钢板', value: 'steel' }, { label: '垫滚杠', value: 'roller' },
    ],
    value: RAMP.surface,
    onChange: (v) => { RAMP.surface = v; updRamp(); },
  });
  ctl.seg({
    options: [
      { label: '木箱 50 kg', value: 50 }, { label: '木箱 100 kg', value: 100 }, { label: '木箱 150 kg', value: 150 },
    ],
    value: RAMP.m,
    onChange: (v) => { RAMP.m = v; updRamp(); },
  });
  ctl.sep();
  ctl.toggle({
    label: '显示重力分解', value: RAMP.decomp,
    onChange: (v) => { RAMP.decomp = v; updRamp(); },
  });
  ctl.button({
    label: '▲ 推箱上车', active: true,
    onClick: () => { if (!RAMP.pushing) { RAMP.pushing = true; RAMP.push = 0; } },
  });
  ctl.sep();
  ctl.toggle({ label: '模型标注', value: labelsOn, onChange: (v) => setLabels(v) });
  hintEl('换一种板面再推一次：钢板比粗木板滑，垫上滚杠把滑动变成滚动；盯着拉力与效率两行读数。');
  setHudRows([
    ['iF', '拉力 F'], ['iG', '物重 G'],
    ['iAng', '倾角'], ['iIdeal', 'G·h ÷ L'],
    ['iS', '沿板移动 s'], ['iEta', '斜面效率 η'],
  ]);
  updRamp();
}

/* —— 06 轮轴 —— */
function winchCtl() {
  ctl.clear();
  ctl.seg({
    options: [
      { label: 'R = 25 cm', value: 0.25 }, { label: 'R = 35 cm', value: 0.35 }, { label: 'R = 50 cm', value: 0.5 },
    ],
    value: WIN.R,
    onChange: (v) => { WIN.R = v; updWinch(); },
  });
  ctl.seg({
    options: [
      { label: 'r = 6 cm', value: 0.06 }, { label: 'r = 9 cm', value: 0.09 }, { label: 'r = 12 cm', value: 0.12 },
    ],
    value: WIN.r,
    onChange: (v) => { WIN.r = v; updWinch(); },
  });
  ctl.seg({
    options: [
      { label: '水 5 L', value: 5 }, { label: '水 10 L', value: 10 }, { label: '水 15 L', value: 15 },
    ],
    value: WIN.water,
    onChange: (v) => { WIN.water = v; updWinch(); },
  });
  ctl.seg({
    options: [{ label: '轴不计摩擦', value: 1 }, { label: '计摩擦（×0.9）', value: 0.9 }],
    value: WIN.k,
    onChange: (v) => { WIN.k = v; updWinch(); },
  });
  ctl.sep();
  ctl.button({
    label: '⟳ 摇动辘轳', active: true,
    onClick: () => { if (!WIN.spinning && WIN.turns < 3.4) WIN.spinning = true; },
  });
  ctl.button({ label: '↺ 倒回井底', onClick: () => { WIN.turns = 0; WIN.spinning = false; updWinch(); } });
  ctl.sep();
  ctl.toggle({ label: '模型标注', value: labelsOn, onChange: (v) => setLabels(v) });
  hintEl('摇动辘轳把水桶提上来：摇把转一大圈，桶只升起一点点——省下的力都换成了多走的路。');
  setHudRows([
    ['wF', '摇把需要的力 F'], ['wG', '桶和水重 G'],
    ['wIdeal', 'G·r ÷ R'], ['wTurns', '转过的圈数'],
    ['wHand', '手走过的路'], ['wH', '水桶升高'],
  ]);
  updWinch();
}

/* —— 07 机械效率 —— */
function effCtl() {
  ctl.clear();
  ctl.seg({
    options: [{ label: '滑轮组', value: 'pulley' }, { label: '斜面', value: 'incline' }],
    value: EFF.machine,
    onChange: (v) => {
      EFF.machine = v;
      EFF.lift = 0; EFF.lifting = false; EFF.liftedOnce = false;
      updEff();
      effCtl();
    },
  });
  if (EFF.machine === 'pulley') {
    ctl.slider({
      label: '托盘上的砖', min: 4, max: 48, step: 4, value: EFF.bricks,
      fmt: (v) => v + ' 块',
      onInput: (v) => { EFF.bricks = v; updEff(); },
    });
    ctl.seg({
      options: [
        { label: '每只动滑轮 0.5 kg', value: 0.5 }, { label: '每只 1 kg', value: 1 }, { label: '每只 3 kg', value: 3 },
      ],
      value: EFF.gp,
      onChange: (v) => { EFF.gp = v; updEff(); },
    });
    ctl.seg({
      options: [
        { label: '不计摩擦', value: 1 }, { label: '一般（×0.94）', value: 0.94 }, { label: '生锈（×0.85）', value: 0.85 },
      ],
      value: EFF.k,
      onChange: (v) => { EFF.k = v; updEff(); },
    });
  } else {
    ctl.seg({
      options: [
        { label: '粗糙木板', value: 'rough' }, { label: '刨光木板', value: 'smooth' },
        { label: '花纹钢板', value: 'steel' }, { label: '垫滚杠', value: 'roller' },
      ],
      value: EFF.surface,
      onChange: (v) => { EFF.surface = v; updEff(); },
    });
    ctl.seg({
      options: [
        { label: '2.4 m', value: 2.4 }, { label: '3 m', value: 3 }, { label: '4 m', value: 4 }, { label: '5 m', value: 5 },
      ],
      value: EFF.L,
      onChange: (v) => { EFF.L = v; updEff(); },
    });
    ctl.seg({
      options: [
        { label: '木箱 50 kg', value: 50 }, { label: '木箱 100 kg', value: 100 }, { label: '木箱 150 kg', value: 150 },
      ],
      value: EFF.m,
      onChange: (v) => { EFF.m = v; updEff(); },
    });
  }
  ctl.sep();
  ctl.button({
    label: EFF.machine === 'pulley' ? '▲ 匀速提升' : '▲ 匀速拉到顶',
    active: true,
    onClick: () => { if (!EFF.lifting) { EFF.lifting = true; EFF.lift = 0; } },
  });
  ctl.button({
    label: '✎ 记录数据',
    onClick: () => {
      if (!EFF.liftedOnce) {
        toast('先把重物匀速拉起一段距离，再来记录数据。', 'warn');
        return;
      }
      const p = effParams();
      const cond = EFF.machine === 'pulley'
        ? 'n=' + EFF.n + '·G动' + (EFF.gp * (EFF.n >= 4 ? 2 : 1) * 9.8).toFixed(0) + 'N·' + (EFF.k === 1 ? '无摩擦' : 'k=' + EFF.k)
        : EFF.L + 'm·' + SURF_NAME[EFF.surface];
      logSetCond('eff', cond);
      logAddRow('eff',
        [p.G.toFixed(0), p.F.toFixed(1), p.h.toFixed(2), p.s.toFixed(2), p.useful.toFixed(1), p.total.toFixed(1), p.eta.toFixed(1)],
        { key: cond });
      toast('已记入测量记录：' + cond, 'ok');
    },
  });
  ctl.sep();
  ctl.toggle({ label: '模型标注', value: labelsOn, onChange: (v) => setLabels(v) });
  hintEl('先匀速提升一次，再按「记录数据」；换物重 / 动滑轮 / 摩擦多做几组，下方表格和 η–G 曲线会告诉规律。');
  setHudRows([
    ['eWu', '有用功 W有 = G·h'], ['eWt', '总功 W总 = F·s'],
    ['eWe', '额外功'], ['eEta', '机械效率 η'],
    ['eG', '物重 G'], ['eF', '拉力 F'],
  ]);
  logSetCols('eff', ['G/N', 'F/N', 'h/m', 's/m', 'W有/J', 'W总/J', 'η/%']);
  updEff();
}
const SURF_NAME = { rough: '粗糙板', smooth: '刨光板', steel: '钢板', roller: '滚杠' };

/* —— 08 生活中的机械 —— */
function realCtl() {
  ctl.clear();
  ctl.seg({
    options: [{ label: '塔吊', value: 'crane' }, { label: '桔槔', value: 'sweep' }],
    value: LIFE.machine,
    onChange: (v) => {
      LIFE.machine = v;
      camTo(...CAM_DEFAULTS.real[v]);
      realCtl();
    },
  });
  ctl.sep();
  if (LIFE.machine === 'crane') {
    LIFE.crane.visible = true;
    LIFE.sweep.visible = false;
    ctl.seg({
      options: CRANE_LOADS.map(([k, name]) => ({ label: name, value: k })),
      value: LIFE.load,
      onChange: (v) => { LIFE.load = v; updReal(); },
    });
    ctl.seg({
      options: [{ label: '2 倍率', value: 2 }, { label: '4 倍率', value: 4 }],
      value: LIFE.falls,
      onChange: (v) => { LIFE.falls = v; updReal(); },
    });
    ctl.slider({
      label: '变幅小车（幅度）', min: 1.5, max: 9, step: 0.1, value: LIFE.radius,
      fmt: (v) => v.toFixed(1) + ' m',
      onInput: (v) => { LIFE.radius = v; updReal(); },
    });
    ctl.sep();
    ctl.button({
      label: LIFE.h > 0.5 ? '▲ 起吊' : '▼ 放下', active: true,
      onClick: () => { LIFE.liftTarget = LIFE.h > 0.5 ? 0 : 1; LIFE.lifting = true; },
    });
    setHudRows([
      ['cR', '幅度 r'], ['cM', '吊重'],
      ['cRated', '额定起重量'], ['cLoad', '力矩负荷'],
      ['cWire', '钢丝绳拉力'], ['cH', '吊物离地'],
    ]);
    hintEl('拖动变幅小车滑杆：走得越远，额定起重量越小；挑一件重物再往外走，力矩限制器会拦住超载。');
  } else {
    LIFE.crane.visible = false;
    LIFE.sweep.visible = true;
    ctl.seg({
      options: [
        { label: '不加配重', value: 0 }, { label: '配重 10 kg', value: 10 },
        { label: '配重 20 kg', value: 20 }, { label: '配重 30 kg', value: 30 },
      ],
      value: LIFE.stone,
      onChange: (v) => { LIFE.stone = v; updReal(); },
    });
    ctl.button({
      label: LIFE.pulling ? '⏫ 松手，让配重提桶' : '▼ 拉绳，放下空桶',
      active: true,
      onClick: () => {
        LIFE.pulling = !LIFE.pulling;
        if (!LIFE.pulling && LIFE.stoneWentDown) {
          LIFE.buckets++;
          LIFE.stoneWentDown = false;
        }
        if (LIFE.pulling) LIFE.stoneWentDown = true;
        updReal();
        realCtl();
      },
    });
    setHudRows([
      ['jDown', '放空桶下拉的力'], ['jUp', '提满桶上提的力'],
      ['jNo', '无配重时提满桶'], ['jNow', '此刻的用力'],
      ['jWater', '桶里的水'], ['jCnt', '已打上的水'],
    ]);
    hintEl('先拉绳放下空桶，再松手让配重把满桶提上来；换几档配重，找出放桶、提桶都省力的那档。');
  }
  updReal();
}

/* —— 09 检测 —— */
function quizCtl() {
  ctl.clear();
  ctl.toggle({
    label: '自动旋转', value: false,
    onChange: (v) => { quizSpin = v; },
  });
  setHudRows([['qNo', '进度'], ['qScore', '得分']]);
  activeCleanup = showQuiz();
}
let quizSpin = false;

/* ================= 章节表 ================= */

const CAM_DEFAULTS = {
  lever: [[1.6, 3.4, 8.6], [-0.2, 1.1, 0]],
  kinds: {
    wheelbarrow: [[-4.6, 2.6, 6.4], [-4.4, 0.8, 0.6]],
    boom: [[1.0, 2.8, 7.6], [0.6, 1.4, 0]],
    scale: [[5.4, 3.1, 8.2], [5.4, 2.3, 0.5]],
  },
  pulley: [[0, 3.6, 9.4], [0, 2.6, 0]],
  block: [[4.2, 4.6, 8.4], [0.3, 2.9, 0]],
  ramp: [[1.2, 3.2, 8.8], [1.4, 1.0, 0]],
  winch: [[2.6, 3.2, 5.4], [0, 1.6, 0]],
  eff: [[4.2, 4.6, 8.4], [0.3, 2.9, 0]],
  real: {
    crane: [[3.2, 9.2, 20.5], [3.0, 5.9, 0]],
    sweep: [[2.2, 3.6, 8.6], [1.6, 1.7, 0]],
  },
  quiz: [[0, 2.6, 9.8], [0, 1.0, 0]],
};

const secLever = {
  id: 'lever', title: '杠杆平衡条件',
  html: `<p>撬棍撬石块是最经典的杠杆：<b>支点</b>在垫石上，手压的一端是<b>动力</b>，石块压撬棍的力是<b>阻力</b>。撬棍绕支点缓慢转动时满足 <span class="hl">F₁·L₁ = F₂·L₂</span>。</p>
<p><b>力臂是支点到力的作用线的距离，不是到作用点的距离</b>——切换三种用力方向试试：同样握在末端，斜着用力时作用线离支点更近，力臂变短，要使更大的力。把支点挪近石块，阻力臂 L₂ 变短，所需压力随之变小——「给我一个支点，我能撬起地球」。</p>
<p>一个人最多能使出约 <span class="hl">600 N</span>：支点离得太远、力臂吃亏太多时，拉力计会告诉你撬棍纹丝不动。</p>`,
  enter() {
    useScene('lever', buildLever);
    camTo(...CAM_DEFAULTS.lever);
    chapterTick = tickLever;
    leverCtl();
  },
};

const secKinds = {
  id: 'kinds', title: '杠杆的分类',
  html: `<p>按动力臂与阻力臂的长短，杠杆分三类：</p>
<p>① <b>省力杠杆</b>（L₁>L₂）：撬棍、独轮车、瓶起子——省力费距离。独轮车的车轮是支点，砂装得越靠近车轮，阻力臂越短，抬着越省力；② <b>费力杠杆</b>（L₁<L₂）：镊子、钓鱼竿、起重臂——费力省距离，换来操作灵活：随车吊的液压缸只伸长一点点，吊钩就升高很多；③ <b>等臂杠杆</b>（L₁=L₂）：天平、定滑轮——不省力也不费距离。<b>杆秤</b>靠移动秤砣改变力臂：砣走到哪里，秤星就"报"出多重。</p>
<p>用上方控件切换三件器械，逐件对照左右两栏的力臂数值。</p>`,
  enter() {
    useScene('kinds', buildKinds);
    camTo(...CAM_DEFAULTS.kinds[KND.kind]);
    chapterTick = tickKinds;
    kindsCtl();
  },
};

const secPulley = {
  id: 'pulley', title: '定滑轮与动滑轮',
  html: `<p>滑轮是变形的杠杆。<b>定滑轮</b>（轴固定不动）实质是等臂杠杆：不省力也不费力，但能<span class="hl">改变力的方向</span>——往下拉绳，砖桶向上升。改变拉绳的偏角，拉力几乎不变（力臂始终是轮半径）。</p>
<p><b>动滑轮</b>（随重物一起移动）实质是动力臂为阻力臂 2 倍的杠杆：两段绳共同分担重量，不计绳重与摩擦时 <span class="hl">F = (G + G<sub>动</sub>) / 2</span>，但绳端要移动 2 倍距离——动滑轮自己越重，省下的力被"吃"掉越多。</p>
<p>按「提升」对比两侧：左边绳端只放 1.2 m，右边要拉 2.4 m。</p>`,
  enter() {
    useScene('pulley', buildPulleyScene);
    camTo(...CAM_DEFAULTS.pulley);
    chapterTick = tickPulley;
    pulleyCtl();
  },
};

const secBlock = {
  id: 'block', title: '滑轮组',
  html: `<p>把定滑轮和动滑轮组合起来就是<b>滑轮组</b>：既省力又能改变力的方向。由 <span class="hl">n 段绳承担物重</span>时（不计动滑轮重与摩擦）<span class="hl">F = G / n</span>，绳端距离 <span class="hl">s = n·h</span>——省力必然费距离。</p>
<p>绕绳有个规律：<b>n 为偶数</b>时绳头系在定滑轮上；<b>n 为奇数</b>时绳头系在动滑轮上。绳端最后绕过的那只定滑轮只改变方向，不承担物重——切「向上拉 / 向下拉」，n 不变，拉力也不变。</p>
<p>画面上每段承重绳都标了号，数一数就知道 n 是几。</p>`,
  enter() {
    useScene('block', buildBlockScene);
    camTo(...CAM_DEFAULTS.block);
    chapterTick = tickBlock;
    blockCtl();
  },
};

const secRamp = {
  id: 'ramp', title: '斜面',
  html: `<p>沿跳板把木箱推上货车，用的就是<b>斜面</b>。斜面是一种省力机械：跳板越长坡越缓越省力，但要把箱子沿更长的路推上去。</p>
<p>光滑斜面上 <span class="hl">F = G·sinθ</span>；粗糙时还要克服摩擦 <span class="hl">+ μG·cosθ</span>。无论斜面多省力，<b>直接提升与沿斜面推上去做的功差不多</b>（粗糙时反而更多）——机械不省功。斜面自己的效率 <span class="hl">η = G·h / (F·L)</span>：面越光滑 η 越高，坡越陡 η 也越高。</p>
<p>盘山公路、楼梯、螺丝钉的螺纹，都是斜面的变体。</p>`,
  enter() {
    useScene('ramp', buildRamp);
    camTo(...CAM_DEFAULTS.ramp);
    chapterTick = tickRamp;
    rampCtl();
  },
};

const secWinch = {
  id: 'winch', title: '轮轴',
  html: `<p>农家院里的辘轳是<b>轮轴</b>：大轮（摇把绕的圆）和小轴（缠绳的滚筒）固定在一起转动。轮半径 R 大于轴半径 r，匀速时 <span class="hl">F·R = G·r</span>，即 <span class="hl">F = G·r/R</span>。</p>
<p>轮轴是可以<span class="hl">连续旋转的杠杆</span>：支点在轴心，摇把转一整圈画出的圆是"轮"。桶升起 h 时，手要走过 h × R / r 的弧长——R 越大、r 越小越省力，但手走的路也越多。</p>
<p>门把手、方向盘、扳手、螺丝刀，都是轮轴的化身。</p>`,
  enter() {
    useScene('winch', buildWinch);
    camTo(...CAM_DEFAULTS.winch);
    chapterTick = tickWinch;
    winchCtl();
  },
};

const secEff = {
  id: 'eff', title: '机械效率',
  html: `<p>实际使用滑轮组时，动滑轮有重量、绳与轮之间有摩擦——拉力做的功（<b>总功</b>）没有全部用于提升货物（<b>有用功</b>），多出来的<b>额外功</b>花在提动滑轮、克服摩擦上。</p>
<p><span class="hl">机械效率 η = W有用 / W总 × 100%</span>，永远小于 100%。同一滑轮组：<b>货物越重 η 越高</b>（额外功几乎不变，有用功占比变大）；<b>动滑轮越重、摩擦越大 η 越低</b>；斜面越光滑 η 越高，坡越陡 η 也越高。</p>
<p>把重物匀速拉起后按「记录数据」，换条件多做几组——下方表格与 η–G 曲线把上面三条规律画给你看。</p>`,
  enter() {
    useScene('eff', buildEff);
    camTo(...CAM_DEFAULTS.eff);
    chapterTick = tickEff;
    effCtl();
  },
};

const secReal = {
  id: 'real', title: '生活中的机械',
  html: `<p>没有实验器材，生活本身就是实验室：</p>
<p><b>塔吊</b>：起重臂和平衡臂架在塔身顶上，像一根巨大的杠杆，平衡臂上的配重块平衡吊物的力矩。变幅小车走得越远，吊物的力臂越长，能吊的就越少——驾驶室旁的<span class="hl">力矩限制器</span>按「起重量 × 幅度」实时核算，超载就报警、不让起吊。吊钩是一组滑轮组：<b>4 倍率</b>时每根钢丝绳只承担吊重的四分之一。</p>
<p><b>桔槔</b>：两千多年前的提水工具。木杆架在桩上，一头挂水桶、一头绑石块。往下拉绳放下空桶，满桶靠石块的重力帮着提上来——挑一档配重，让放桶和提桶都省力。</p>`,
  enter() {
    useScene('real', buildReal);
    LIFE.h = 0; LIFE.lifting = false; LIFE.liftTarget = 0;
    camTo(...CAM_DEFAULTS.real[LIFE.machine]);
    chapterTick = tickReal;
    realCtl();
  },
};

const secQuiz = {
  id: 'quiz', title: '随堂检测',
  html: `<p>8 道选择题，检验一下简单机械的掌握情况——既有杠杆、滑轮、轮轴的概念题，也有滑轮组拉力、斜面效率的计算题。答完可重新作答。</p>`,
  enter() {
    useScene('kinds', buildKinds);
    unfocusKinds();
    camTo(...CAM_DEFAULTS.quiz);
    chapterTick = null;
    quizCtl();
  },
};

const SECTIONS = [secLever, secKinds, secPulley, secBlock, secRamp, secWinch, secEff, secReal, secQuiz];

/* ================= 章节推演帧逻辑 ================= */

function tickLever(dt) {
  if (LEV.pressing) {
    LEV.press = Math.min(LEV.press + dt * 0.4, 1);
    if (LEV.press >= 1) LEV.pressing = false;
    updLever();
  }
}
function tickKinds(dt) {
  if (KND.tilting) {
    KND.tilt = Math.min(KND.tilt + dt * 0.5, 1);
    if (KND.tilt >= 1) KND.tilting = false;
    updKinds();
  }
}
function tickPulley(dt) {
  if (PUL.lifting) {
    PUL.lift = Math.min(PUL.lift + dt * 0.3, 1);
    if (PUL.lift >= 1) PUL.lifting = false;
    updPulley();
  }
}
function tickBlock(dt) {
  if (BLK.lifting) {
    BLK.lift = Math.min(BLK.lift + dt * 0.3, 1);
    if (BLK.lift >= 1) BLK.lifting = false;
    updBlock();
  }
}
function tickRamp(dt) {
  if (RAMP.pushing) {
    RAMP.push = Math.min(RAMP.push + dt * 0.22, 1);
    if (RAMP.push >= 1) RAMP.pushing = false;
    updRamp();
  }
}
function tickWinch(dt) {
  if (WIN.spinning) {
    WIN.turns = Math.min(WIN.turns + dt * 0.55, 3.4);
    if (WIN.turns >= 3.4) WIN.spinning = false;
    updWinch();
  }
}
function tickEff(dt) {
  if (EFF.lifting) {
    EFF.lift = Math.min(EFF.lift + dt * 0.28, 1);
    if (EFF.lift >= 1) {
      EFF.lifting = false;
      EFF.liftedOnce = true;
    }
    updEff();
  }
}
function tickReal(dt) {
  if (LIFE.lifting) {
    LIFE.h += Math.sign(LIFE.liftTarget - LIFE.h) * dt * 0.3;
    if ((LIFE.liftTarget - LIFE.h) * Math.sign(LIFE.liftTarget - LIFE.h) <= 0.001 || Math.abs(LIFE.liftTarget - LIFE.h) < 0.01) {
      LIFE.h = LIFE.liftTarget;
      LIFE.lifting = false;
      /* 起吊/放下按钮文案随到位状态翻转 */
      const hoistBtn = [...document.querySelectorAll('#controls button')]
        .find((b) => b.textContent.includes('起吊') || b.textContent.includes('放下'));
      if (hoistBtn) hoistBtn.textContent = LIFE.h > 0.5 ? '▲ 起吊' : '▼ 放下';
    }
    updReal();
  }
  LIFE.pull += ((LIFE.pulling ? 1 : 0) - LIFE.pull) * Math.min(1, dt * 2.4);
  if (Math.abs(LIFE.pull - (LIFE.pulling ? 1 : 0)) > 0.002) updReal();
}

/* ================= 布局驱动（三栏 / 折叠 / 专注 / 手风琴 / 快捷键 / 舞台工具） ================= */

const chapNav = document.getElementById('chapNav');
const chapCount = document.getElementById('chapCount');
const detailNo = document.getElementById('detailNo');
const detailTitle = document.getElementById('detailTitle');
const lessonEl = document.getElementById('lesson');
const detailBody = document.getElementById('detailBody');
const controlsEl = document.getElementById('controls');
const shell = document.getElementById('machineShell');
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
  window.__machineChapter = sec.id;
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
  if (activeCleanup) { activeCleanup(); activeCleanup = null; }
  if (quizCleanup) { quizCleanup(); quizCleanup = null; }
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
const FOLD_KEY = { l: 'machine.foldL', r: 'machine.foldR' };
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
const ACC_KEYS = { lesson: 'machine.accLesson', controls: 'machine.accControls', data: 'machine.accData' };
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

/* 舞台工具：重做 / 模型标签 / 视角 / 画质 / 大屏 + 键盘 ← → ] R */
const chapPrev = document.getElementById('chapPrev');
const chapNext = document.getElementById('chapNext');
const resetBtn = document.getElementById('resetBtn');
const labelBtn = document.getElementById('labelBtn');
const viewBtn = document.getElementById('viewBtn');
const qualBtn = document.getElementById('qualBtn');
const bigBtn = document.getElementById('bigBtn');

function gotoChapter(i) { selectChapter((i + SECTIONS.length) % SECTIONS.length); }
chapPrev.addEventListener('click', () => gotoChapter(chapterIdx - 1));
chapNext.addEventListener('click', () => gotoChapter(chapterIdx + 1));
resetBtn.addEventListener('click', () => {
  const cur = SECTIONS[chapterIdx].id;
  if (REC[cur]) REC[cur].rows = [];
  if (cur === 'real') { LIFE.buckets = 0; LIFE.pulling = false; LIFE.h = 0; }
  if (cur === 'eff') { EFF.lift = 0; EFF.lifting = false; }
  selectChapter(chapterIdx);
  toast('实验已复位：器械归位，测量记录清空。', 'ok');
});
let labelsOn = true;
try { labelsOn = localStorage.getItem('machine.labels') !== '0'; } catch (e) { /* 忽略 */ }
function setLabels(on) {
  labelsOn = on;
  for (const s of equipLabels) s.visible = labelsOn;
  labelBtn.classList.toggle('on', labelsOn);
  labelBtn.setAttribute('aria-pressed', String(labelsOn));
  try { localStorage.setItem('machine.labels', labelsOn ? '1' : '0'); } catch (e) { /* 忽略 */ }
}
labelBtn.addEventListener('click', () => setLabels(!labelsOn));
viewBtn.addEventListener('click', () => {
  const d = CAM_DEFAULTS[SECTIONS[chapterIdx].id];
  const [p, t] = Array.isArray(d) ? d : (d[LIFE.machine] || d[KND.kind] || Object.values(d)[0]);
  camTo(p, t);
  toast('视角已复位。', 'ok');
});
/* 画质优先 / 流畅度优先：切换辉光 + 颗粒（后期全关可救低配机） */
let qualityHigh = true;
function applyQuality() {
  const bloomPass = vfx.composer.passes.find((p) => p.strength !== undefined);
  const finishPass = vfx.composer.passes.find((p) => p.uniforms && p.uniforms.uGrainAmt);
  if (bloomPass) bloomPass.enabled = qualityHigh;
  if (finishPass) {
    finishPass.uniforms.uGrainAmt.value = qualityHigh ? 0.028 : 0;
    finishPass.uniforms.uCA.value = qualityHigh ? 0 : 0;
  }
  qualBtn.textContent = qualityHigh ? '画质优先' : '流畅度优先';
  qualBtn.classList.toggle('on', qualityHigh);
  qualBtn.setAttribute('aria-pressed', String(qualityHigh));
}
qualBtn.addEventListener('click', () => {
  qualityHigh = !qualityHigh;
  applyQuality();
  toast(qualityHigh
    ? '已切到画质优先：辉光与颗粒后期已打开。'
    : '已切到流畅度优先：后期效果已关，低配置设备更流畅。', 'ok');
});
let bigMode = false;
function applyBig() {
  document.body.classList.toggle('machine-big', bigMode);
  bigBtn.classList.toggle('on', bigMode);
  bigBtn.setAttribute('aria-pressed', String(bigMode));
}
bigBtn.addEventListener('click', () => {
  bigMode = !bigMode;
  setFocus(bigMode);
  applyBig();
});
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
  const old = stage.querySelector('.machine-toast');
  if (old) old.remove();
  const el = document.createElement('div');
  el.className = 'machine-toast ' + kind;
  el.textContent = text;
  stage.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 300);
  }, kind === 'warn' ? 4200 : 3400);
}

/* ================= 帧循环与启动 ================= */

app.onFrame((dt) => {
  if (chapterTick) chapterTick(dt);
  if (quizSpin && scenes.kinds && scenes.kinds.visible) scenes.kinds.rotation.y += dt * 0.35;
});

setLabels(labelsOn);
applyQuality();
applyBig();
setTimeout(() => {
  loader.hide();
  window.__eduSections = { select: selectChapter };
  window.__machineDebug = { vfx, app, PAL, CV };
  selectChapter(0);
}, 60);
