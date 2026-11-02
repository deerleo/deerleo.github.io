/* EduLab · 神经网络识数字（neuro）—— Micro 级建模深改
 * =====================================================================
 * 章节：图像就是数字 / 一个神经元 / 多层网络 / 现场训练 / 卷积网络 / AI 也会犯错
 *
 * 布局（micro 三件套移植）：真·三栏——左栏章节大纲（点击切章 + ‹01/06› 前后翻 +
 *   键盘 , . ← →）/ 中栏 3D 神经展台（切章相机飞行）/ 右栏 知识点讲解与小任务 +
 *   实验控件 + 数据读数；左右栏独立折叠（28px 竖条）+ 专注模式 + 大屏课堂模式 +
 *   右栏三块手风琴（neuro.acc* 记忆，切章不重置）+ 手写板浮窗（折叠成徽标）。
 *
 * 视觉工艺（edu-vfx 接入 + Micro 级建模密度）：
 *   - 展台语境：拉丝金属大平台（圆角挤出 + 支脚 + 铭牌）、蚀刻网格输入托盘、
 *     训练终端（斜面显示器 + 实时损失 LCD 画布）、手写样本卡盒（数字样本卡 +
 *     斜切挡板）、参考书堆（书脊贴图）、电路板（走线丝印贴图 + 芯片 + 排容）、
 *     弧形走线管（CatmullRom）——道具阵列各章共享，全部烘焙接触阴影。
 *   - 主体建模：输入体素场（256 根 InstancedMesh 圆柱，高度=像素/颜色=权重）、
 *     神经元球（膜壳 clearcoat + 核体 sheen + 光晕 + 顶部树突突起）、
 *     多层网络机架（黄铜框架 + 三层神经元阵列 + 弧形信号干道管）、
 *     卷积扫描窗（四边框浮动窗 + 卷积核瓦片阵列 + 特征柱阵列）。
 *   - 程序化纹理：拉丝金属、蚀刻网格、LCD 终端屏（实时曲线）、电路板走线丝印、
 *     数字样本卡、书脊、盒签 —— CanvasTexture 矢量绘制 60+ 处。
 *   - 材质工艺：四级材质工厂（matCoat 膜壳 / matStd 金属分区 / matGlass / matSheen）
 *     + makeStudioEnvironment 程序化摄影棚反射。
 *   - 光照氛围：暖主光 + 冷补光 + 正面柔光 + 深青棚拍背景（studio-teal）。
 *
 * 教学交互（原版功能块 1:1 对齐，文案全部自研）：
 *   - 图像就是数字：手写板书写 → 16×16=256 像素灰度体素场；分辨率 7/16/24 采样
 *     对比（低分辨率重采样后再识别）；预处理演示（框笔迹→缩放→重心居中四步动画）；
 *     随机样本 / 清空；有笔迹像素计数。
 *   - 一个神经元：体素场高度=试样本像素、颜色=权重（蓝正橙负）；顶部神经元球 +
 *     贡献光束；画笔直接在方块上画权重（正/负/擦除，再点画笔回旋转视角）；
 *     竖线探测器预设 / 清空权重 / 恢复原样；试一个 1 / 试一个 0；
 *     激活函数四选（阶跃 / Sigmoid / ReLU / tanh）；Σwx、偏置 b、输出 a 读数；
 *     权重图（16×16 蓝橙图）。
 *   - 多层网络：256→48→10 三层机架；前向传播逐层点亮动画（信号粒子流）；
 *     蓝线支持 / 橙线反对（连线只画贡献最大的）；重放信号；
 *     点隐藏层任一神经元 → 头顶浮出它的 256 个权重拼成的图（"它在找的笔画"）；
 *     看最活跃的神经元；识别结果大数字 + 十类置信度柱。
 *   - 现场训练：重置为随机权重 → 开始/暂停训练（3000 张程序生成样本流式喂入，
 *     样本速度可调）；损失 + 训练/测试准确率双轴曲线；学习率滑杆 + 发散检测
 *     （权重自动回退到上一正常状态并提示）；第一层 48 张权重图画廊
 *     （雪花噪点慢慢长出笔画）；轮次 / 已看样本 / 样本速度 / 参数量读数；
 *     训练中终端屏实时画损失曲线；自动停止（轮数上限 / 准确率平台 / 达标）。
 *   - 卷积网络：5×5 卷积核扫描动画（3D 扫描窗 + 核瓦片 + 特征柱同步升起，
 *     扫描速度可调）；六个第一层卷积核（竖边 / 横边 / 斜线×2 / 竖笔画 / 横笔画）；
 *     2×2 最大池化；第二层 12 个组合核（每个 6 片作用在池化图上再相加）；
 *     点任意特征图查看它的卷积核；写一个数字看哪些特征图亮。
 *   - AI 也会犯错：旋转 / 平移 / 噪点三滑杆（旋转 90° 快捷键）；
 *     多层网络 vs 卷积思路（池化特征模板匹配）双模型置信度对照；
 *     看它在更难测试集上认错的例子（错例画廊：正确答案 vs 认成）；
 *     画笑脸或字母考考它（没有"我不知道"选项）。
 *   - 全局：讲解与小任务（完成自动打勾 + 蓝色快捷操作链接）、首次进入引导
 *     （开始吧 / 下一步 / 跳过）、重做 / 模型标签 / 视角 R / 画质优先 / 大屏课堂模式。
 * =====================================================================
 */
import {
  THREE, TAU, clamp, createApp, makeLoader, createControlsPanel, makeTextSprite, setSpriteText,
} from './edu-core.js';
import {
  attachVFX, PAL, matCoat, matStd, matSheen, ghostify,
  makeStudioEnvironment, makeLabelTexture,
} from './edu-vfx.js';

/* ---------------- 场景与工艺接入 ---------------- */

const stage = document.getElementById('stage');
const loader = makeLoader(stage, '正在点亮神经元…');
const app = createApp({
  container: stage,
  fov: 40, near: 0.1, far: 200,
  cameraPos: [1.0, 3.0, 7.4], target: [-0.5, 0.8, 0],
  minDistance: 1.2, maxDistance: 40,
  exposure: 1.05,
  keepBackground: true,
});
const { scene } = app;
const vfx = attachVFX(app, 'illus');
scene.environment = makeStudioEnvironment(app.renderer);

/* 灯光：暖主光 + 冷补光 + 正面柔光（青蓝信号色的高光走向靠这三层） */
const keyLight = new THREE.DirectionalLight(0xffe8d0, 1.15);
keyLight.position.set(6, 10, 7);
scene.add(keyLight);
const fillLight = new THREE.DirectionalLight(0xcfe4ff, 0.4);
fillLight.position.set(-7, 4.5, -5);
scene.add(fillLight);
const frontLight = new THREE.DirectionalLight(0xeef6ff, 0.28);
frontLight.position.set(1, 3.4, 8.5);
scene.add(frontLight);
scene.add(new THREE.AmbientLight(0x8fa0b0, 0.4));

/* ---------------- 色族（全部从 PAL 取色；派生档用 Color 运算生成） ---------------- */

const tone = (hex, mul) => {
  const c = new THREE.Color(hex);
  c.multiplyScalar(mul);
  return c.getHex();
};
const CV = {
  pos: PAL.capsule,                 // 正权重·青绿（有笔画就加分）
  posDeep: tone(PAL.capsule, 0.5),
  neg: PAL.mitoShell,               // 负权重·橙（有笔画就扣分）
  negDeep: tone(PAL.mitoShell, 0.55),
  field: PAL.cytosol,               // 输入场基调·深青
  fieldLit: PAL.cytosolLit,
  fieldDeep: PAL.cytosolDeep,
  accent: PAL.rer,                  // 主强调·亮青
  purple: PAL.nucleus,              // 神经元紫
  purpleDeep: PAL.nucleoplasm,
  signal: PAL.chromatin,            // 信号粒子·淡紫
  steel: PAL.steel,
  steelDeep: tone(PAL.steel, 0.38),
  brass: PAL.brass,
  dark: tone(PAL.cytosolDeep, 1.25),// 平台深色
  slab: tone(PAL.steel, 0.5),       // 平台基底
  pcb: tone(PAL.thylakoid, 0.85),   // 电路板绿
  paper: PAL.paper,
  lcd: PAL.stroma,
  ink: PAL.ink,
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
function label(text, color = '#d7e6ee', scale = 0.0042) {
  return makeTextSprite(text, { fontSize: 30, color, scale, bg: 'rgba(8,13,18,0.62)' });
}
const _spriteOpt = { fontSize: 30 };
function retext(sprite, text, color) {
  setSpriteText(sprite, text, { ..._spriteOpt, color, scale: sprite.userData.scale || 0.0042, bg: 'rgba(8,13,18,0.62)' });
}
/* 接触阴影贴片：径向渐变烘焙（纹理缓存共享） */
const _blobTexCache = new Map();
function blobTexture(alpha) {
  const key = Math.round(alpha * 100);
  if (!_blobTexCache.has(key)) {
    _blobTexCache.set(key, canvasTex(128, 128, (ctx) => {
      const g = ctx.createRadialGradient(64, 64, 6, 64, 64, 62);
      g.addColorStop(0, `rgba(5,8,12,${alpha})`);
      g.addColorStop(0.55, `rgba(5,8,12,${alpha * 0.5})`);
      g.addColorStop(1, 'rgba(5,8,12,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 128, 128);
    }));
  }
  return _blobTexCache.get(key);
}
function shadowBlob(radius = 1.4, alpha = 0.34) {
  const m = mesh(new THREE.PlaneGeometry(radius * 2, radius * 2), new THREE.MeshBasicMaterial({
    map: blobTexture(alpha), transparent: true, depthWrite: false,
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
  return mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({
    map: tex, transparent: true, roughness: 0.85,
    polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1,
  }));
}
/* 弧形走线管：CatmullRom 过点 + 两端小球端子 */
function arcTube(points, radius = 0.028, mat, segs = 40) {
  const curve = new THREE.CatmullRomCurve3(points);
  const g = new THREE.TubeGeometry(curve, segs, radius, 8, false);
  const grp = new THREE.Group();
  grp.add(mesh(g, mat));
  for (const p of [points[0], points[points.length - 1]]) {
    const cap = mesh(new THREE.SphereGeometry(radius * 1.7, 10, 8), mat);
    cap.position.copy(p);
    grp.add(cap);
  }
  return grp;
}

/* ================= 程序化纹理库（AI 展台族） ================= */

/* 拉丝金属：深底 + 细划痕 + 微渐变 */
function brushedTexture(base = css('slab', 1), w = 512, seed = 5) {
  return canvasTex(w, w, (ctx) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, w);
    const rnd = mulberry32(seed);
    /* 水平拉丝 */
    for (let i = 0; i < 340; i++) {
      const y = rnd() * w;
      const ln = w * (0.08 + rnd() * 0.5);
      const x0 = rnd() * w;
      ctx.strokeStyle = rnd() > 0.5
        ? `rgba(210,224,238,${0.025 + rnd() * 0.05})`
        : `rgba(8,12,18,${0.04 + rnd() * 0.07})`;
      ctx.lineWidth = 0.7 + rnd() * 1.6;
      ctx.beginPath();
      ctx.moveTo(x0, y);
      ctx.lineTo(x0 + ln, y + (rnd() - 0.5) * 2);
      ctx.stroke();
    }
    /* 面积斑渍 */
    for (let i = 0; i < 14; i++) {
      const x = rnd() * w, y = rnd() * w, r = 20 + rnd() * 60;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(10,14,20,${0.05 + rnd() * 0.06})`);
      g.addColorStop(1, 'rgba(10,14,20,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
  });
}

/* 蚀刻网格托盘面：16×16 格线 + 基准十字 + 角标刻度 */
function gridEtchTexture(w = 512) {
  return canvasTex(w, w, (ctx) => {
    ctx.fillStyle = css('dark', 1);
    ctx.fillRect(0, 0, w, w);
    const m = w * 0.055;
    const inner = w - m * 2;
    const cell = inner / 16;
    /* 内盘微渐变 */
    const g = ctx.createLinearGradient(0, 0, w, w);
    g.addColorStop(0, 'rgba(120,160,180,0.10)');
    g.addColorStop(1, 'rgba(10,16,22,0.16)');
    ctx.fillStyle = g;
    ctx.fillRect(m, m, inner, inner);
    /* 格线 */
    ctx.strokeStyle = 'rgba(150,190,210,0.22)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 16; i++) {
      const p = m + i * cell;
      ctx.beginPath(); ctx.moveTo(p, m); ctx.lineTo(p, w - m); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(m, p); ctx.lineTo(w - m, p); ctx.stroke();
    }
    /* 每 4 格加重线 */
    ctx.strokeStyle = 'rgba(170,215,235,0.34)';
    ctx.lineWidth = 2;
    for (let i = 0; i <= 16; i += 4) {
      const p = m + i * cell;
      ctx.beginPath(); ctx.moveTo(p, m); ctx.lineTo(p, w - m); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(m, p); ctx.lineTo(w - m, p); ctx.stroke();
    }
    /* 中心基准十字 */
    ctx.strokeStyle = 'rgba(190,230,250,0.5)';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(w / 2 - cell * 0.9, w / 2); ctx.lineTo(w / 2 + cell * 0.9, w / 2);
    ctx.moveTo(w / 2, w / 2 - cell * 0.9); ctx.lineTo(w / 2, w / 2 + cell * 0.9);
    ctx.stroke();
    /* 角标刻度数字 */
    ctx.fillStyle = 'rgba(170,200,220,0.5)';
    ctx.font = `600 ${Math.round(w * 0.02)}px ui-monospace, monospace`;
    ctx.textAlign = 'center';
    for (let i = 0; i <= 16; i += 4) {
      const p = m + i * cell;
      ctx.fillText(String(i), p, m - w * 0.018);
      ctx.fillText(String(i), w * 0.5, i === 0 ? w - m + w * 0.045 : p + w * 0.014);
    }
    /* 外框 */
    ctx.strokeStyle = 'rgba(190,225,245,0.55)';
    ctx.lineWidth = 4;
    ctx.strokeRect(m, m, inner, inner);
  });
}

/* 训练终端 LCD：可实时重绘（boot 文案 + 损失迷你曲线 + 轮次） */
function makeTerminalScreen() {
  const W = 320, H = 200;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d');
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  const lossHist = [];
  let epochTxt = 'STANDBY';
  let accTxt = '--';
  function paint() {
    ctx.fillStyle = '#0a141a';
    ctx.fillRect(0, 0, W, H);
    /* 顶栏 */
    ctx.fillStyle = '#122530';
    ctx.fillRect(0, 0, W, 30);
    ctx.fillStyle = '#67d8c8';
    ctx.font = '700 15px ui-monospace, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('NEUROLAB / TRAIN', 12, 20);
    ctx.fillStyle = '#8fb4bd';
    ctx.font = '600 13px ui-monospace, monospace';
    ctx.textAlign = 'right';
    ctx.fillText(epochTxt, W - 12, 20);
    /* 网格 */
    ctx.strokeStyle = 'rgba(90,140,155,0.18)';
    ctx.lineWidth = 1;
    for (let y = 46; y < H - 14; y += 26) {
      ctx.beginPath(); ctx.moveTo(12, y); ctx.lineTo(W - 12, y); ctx.stroke();
    }
    /* 曲线 */
    if (lossHist.length > 1) {
      const max = Math.max(...lossHist, 0.4);
      ctx.strokeStyle = '#f0a35e';
      ctx.lineWidth = 3;
      ctx.beginPath();
      lossHist.forEach((v, i) => {
        const x = 12 + (i / (lossHist.length - 1)) * (W - 24);
        const y = (H - 20) - (v / max) * (H - 72);
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      });
      ctx.stroke();
      /* 末点 */
      const lx = W - 12, ly = (H - 20) - (lossHist[lossHist.length - 1] / max) * (H - 72);
      ctx.fillStyle = '#f0a35e';
      ctx.beginPath(); ctx.arc(lx - 2, ly, 4, 0, TAU); ctx.fill();
    } else {
      ctx.fillStyle = '#42606b';
      ctx.font = '600 15px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('LOSS —', W / 2, H / 2 + 8);
    }
    ctx.fillStyle = '#9fd8ce';
    ctx.font = '700 16px ui-monospace, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('loss ' + (lossHist.length ? lossHist[lossHist.length - 1].toFixed(3) : '--'), 12, H - 14);
    ctx.textAlign = 'right';
    ctx.fillText('acc ' + accTxt, W - 12, H - 14);
    tex.needsUpdate = true;
  }
  paint();
  return {
    tex,
    push(v) { lossHist.push(v); if (lossHist.length > 64) lossHist.shift(); paint(); },
    set(epoch, acc) { epochTxt = epoch; accTxt = acc; paint(); },
    reset() { lossHist.length = 0; paint(); },
  };
}

/* 电路板：走线 + 焊盘 + 丝印 */
function pcbTexture(w = 512) {
  return canvasTex(w, w, (ctx) => {
    ctx.fillStyle = css('pcb', 0.9);
    ctx.fillRect(0, 0, w, w);
    const rnd = mulberry32(21);
    /* 走线：横平竖直折线 */
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    for (let i = 0; i < 46; i++) {
      let x = rnd() * w, y = rnd() * w;
      ctx.strokeStyle = i % 3 === 0 ? 'rgba(200,180,90,0.75)' : 'rgba(120,170,150,0.55)';
      ctx.beginPath();
      ctx.moveTo(x, y);
      const legs = 2 + (rnd() * 3) | 0;
      for (let s = 0; s < legs; s++) {
        if (rnd() > 0.5) x += (rnd() - 0.5) * w * 0.42;
        else y += (rnd() - 0.5) * w * 0.42;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
      /* 焊盘 */
      ctx.fillStyle = 'rgba(214,196,120,0.9)';
      ctx.beginPath(); ctx.arc(x, y, 6.5, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(30,40,44,0.9)';
      ctx.beginPath(); ctx.arc(x, y, 3, 0, TAU); ctx.fill();
    }
    /* 丝印字符 */
    ctx.fillStyle = 'rgba(230,240,235,0.8)';
    ctx.font = `700 ${Math.round(w * 0.036)}px ui-monospace, monospace`;
    ctx.textAlign = 'left';
    ctx.fillText('NEURO-CORE', w * 0.08, w * 0.12);
    ctx.font = `600 ${Math.round(w * 0.026)}px ui-monospace, monospace`;
    ctx.fillText('16 × 16 · 256 px', w * 0.08, w * 0.17);
    ctx.fillText('MLP-48 / KERNEL-5', w * 0.08, w * 0.215);
    /* 边缘金手指 */
    ctx.fillStyle = 'rgba(214,196,120,0.85)';
    for (let i = 0; i < 18; i++) ctx.fillRect(w * 0.16 + i * (w * 0.04), w - 14, w * 0.022, 14);
  });
}

/* 数字样本卡：纸底 + 墨迹数字 + 编号 */
function digitCardTexture(d, paperTone = 0) {
  const W = 128, H = 168;
  return canvasTex(W, H, (ctx) => {
    const papers = ['#f2efe6', '#f4f1e4', '#efece0'];
    ctx.fillStyle = papers[paperTone % 3];
    ctx.fillRect(0, 0, W, H);
    /* 纸纹 */
    const rnd = mulberry32(d * 7 + 3);
    for (let i = 0; i < 90; i++) {
      ctx.fillStyle = `rgba(120,110,90,${0.03 + rnd() * 0.05})`;
      ctx.fillRect(rnd() * W, rnd() * H, 1.6, 1.6);
    }
    /* 顶栏打孔 */
    ctx.fillStyle = 'rgba(90,90,90,0.55)';
    ctx.beginPath(); ctx.arc(W / 2, 12, 4, 0, TAU); ctx.fill();
    /* 墨迹数字（点阵手写感） */
    ctx.save();
    ctx.translate(W / 2, H / 2 - 6);
    ctx.fillStyle = '#1c2026';
    const cell = 13;
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 5; c++) {
        if (FONT[d][r][c] === '1') {
          ctx.beginPath();
          ctx.arc((c - 2) * cell, (r - 3) * cell, 6.4 + rnd() * 1.2, 0, TAU);
          ctx.fill();
        }
      }
    }
    ctx.restore();
    /* 底部编号 */
    ctx.fillStyle = 'rgba(60,64,70,0.85)';
    ctx.font = '600 15px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('NO.' + d + ' ×30', W / 2, H - 14);
    ctx.strokeStyle = 'rgba(120,116,100,0.5)';
    ctx.lineWidth = 3;
    ctx.strokeRect(6, 6, W - 12, H - 12);
  });
}

/* 书脊贴图 */
function bookSpineTexture(title, accent = '#4a7d8c', w = 96, h = 256) {
  return canvasTex(w, h, (ctx) => {
    ctx.fillStyle = accent;
    ctx.fillRect(0, 0, w, h);
    /* 上下饰带 */
    ctx.fillStyle = 'rgba(235,240,235,0.85)';
    ctx.fillRect(0, h * 0.06, w, 5);
    ctx.fillRect(0, h * 0.9, w, 5);
    /* 竖排书名 */
    ctx.fillStyle = 'rgba(240,244,240,0.94)';
    ctx.font = '700 30px "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    const chars = [...title];
    const startY = h * 0.16;
    chars.forEach((ch, i) => ctx.fillText(ch, w / 2, startY + i * 38));
    /* 索引号 */
    ctx.font = '600 15px ui-monospace, monospace';
    ctx.fillStyle = 'rgba(240,244,240,0.65)';
    ctx.save();
    ctx.translate(w / 2, h * 0.93);
    ctx.fillText('TP·' + (11 + title.length), 0, 0);
    ctx.restore();
  });
}

/* ================= 手写数字引擎（5×7 点阵 → 16×16 向量） ================= */

const RES = 16;
const FONT = [
  ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
  ['11111', '00010', '00100', '00010', '00001', '10001', '01110'],
  ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  ['00110', '01000', '10000', '11110', '10001', '10001', '01110'],
  ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  ['01110', '10001', '10001', '01111', '00001', '00010', '01100'],
];

/* 点阵按随机扰动画到画布（墨点大小随种子抖动），降采样成 16×16 灰度向量 */
function renderDigit(digit, rng, SZ = 96) {
  const cv = document.createElement('canvas');
  cv.width = SZ; cv.height = SZ;
  const c = cv.getContext('2d', { willReadFrequently: true });
  c.fillStyle = '#000'; c.fillRect(0, 0, SZ, SZ);
  c.save();
  c.translate(SZ / 2, SZ / 2);
  if (rng) {
    c.rotate((rng() - 0.5) * 0.36);                 // ±10°
    const s = 0.85 + rng() * 0.35;
    c.scale(s, s);
    c.translate((rng() - 0.5) * 14, (rng() - 0.5) * 14);
  }
  const cell = SZ / 8.6;
  c.fillStyle = '#fff';
  for (let r = 0; r < 7; r++) {
    for (let col = 0; col < 5; col++) {
      if (FONT[digit][r][col] === '1') {
        const rad = cell * (rng ? 0.33 + rng() * 0.22 : 0.42);
        c.beginPath();
        c.arc((col - 2) * cell, (r - 3) * cell, rad, 0, TAU);
        c.fill();
      }
    }
  }
  c.restore();
  return sampleCanvas(cv);
}

/* 抽取画布 → 裁边居中 → RES×RES 灰度 Float32Array(0~1)（即"预处理"的框选+缩放+居中） */
function sampleCanvas(cv) {
  const SZ = cv.width;
  const c = cv.getContext('2d', { willReadFrequently: true });
  const data = c.getImageData(0, 0, SZ, SZ).data;
  let minX = SZ, minY = SZ, maxX = -1, maxY = -1;
  for (let y = 0; y < SZ; y++) {
    for (let x = 0; x < SZ; x++) {
      if (data[(y * SZ + x) * 4] > 60) {
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
      }
    }
  }
  const out = new Float32Array(RES * RES);
  if (maxX < 0) return out;
  const bw = maxX - minX + 1, bh = maxY - minY + 1;
  const s = Math.max(bw, bh) * 1.32;              // 留边
  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
  const small = document.createElement('canvas');
  small.width = RES; small.height = RES;
  const sc = small.getContext('2d', { willReadFrequently: true });
  sc.imageSmoothingEnabled = true;
  sc.drawImage(cv, cx - s / 2, cy - s / 2, s, s, 0, 0, RES, RES);
  const sd = sc.getImageData(0, 0, RES, RES).data;
  for (let i = 0; i < RES * RES; i++) out[i] = sd[i * 4] / 255;
  return out;
}

/* 向量 → 灰度画布（错例画廊 / 预处理演示用） */
function vecToCanvas(vec, px = 128) {
  const cv = document.createElement('canvas');
  cv.width = px; cv.height = px;
  const c = cv.getContext('2d');
  const cell = px / RES;
  c.fillStyle = '#0d1117';
  c.fillRect(0, 0, px, px);
  for (let r = 0; r < RES; r++) {
    for (let col = 0; col < RES; col++) {
      const v = vec[r * RES + col];
      if (v > 0.04) {
        c.fillStyle = `rgba(${46 + v * 196},${52 + v * 186},${64 + v * 172},${0.25 + v * 0.75})`;
        c.fillRect(col * cell, r * cell, cell - 0.5, cell - 0.5);
      }
    }
  }
  return cv;
}

/* 向量统计：笔迹包围盒 + 重心（预处理演示用） */
function vecStats(vec) {
  let minX = 99, minY = 99, maxX = -1, maxY = -1, mass = 0, cx = 0, cy = 0, lit = 0;
  for (let r = 0; r < RES; r++) {
    for (let c = 0; c < RES; c++) {
      const v = vec[r * RES + c];
      if (v > 0.18) {
        lit++;
        if (c < minX) minX = c; if (c > maxX) maxX = c;
        if (r < minY) minY = r; if (r > maxY) maxY = r;
        mass += v; cx += c * v; cy += r * v;
      }
    }
  }
  if (!mass) return null;
  return { minX, minY, maxX, maxY, lit, cx: cx / mass, cy: cy / mass };
}

/* ================= 小型多层感知机（256 → 48 → 10） ================= */

class MLP {
  constructor(nIn, nHid, nOut) {
    this.nIn = nIn; this.nHid = nHid; this.nOut = nOut;
    this.paramCount = nIn * nHid + nHid + nHid * nOut + nOut;
    this.reset();
  }
  reset() {
    const g = (n, m) => {
      const w = new Float32Array(n * m);
      for (let i = 0; i < w.length; i++) w[i] = (Math.random() * 2 - 1) * Math.sqrt(2 / n);
      return w;
    };
    this.W1 = g(this.nHid, this.nIn); this.b1 = new Float32Array(this.nHid);
    this.W2 = g(this.nOut, this.nHid); this.b2 = new Float32Array(this.nOut);
  }
  snapshot() {
    this._snap = {
      W1: this.W1.slice(), b1: this.b1.slice(),
      W2: this.W2.slice(), b2: this.b2.slice(),
    };
  }
  restore() {
    if (!this._snap) return false;
    this.W1.set(this._snap.W1); this.b1.set(this._snap.b1);
    this.W2.set(this._snap.W2); this.b2.set(this._snap.b2);
    return true;
  }
  forward(x) {
    const h = new Float32Array(this.nHid);
    for (let j = 0; j < this.nHid; j++) {
      let s = this.b1[j];
      const off = j * this.nIn;
      for (let i = 0; i < this.nIn; i++) s += this.W1[off + i] * x[i];
      h[j] = Math.tanh(s);
    }
    const o = new Float32Array(this.nOut);
    let max = -1e9;
    for (let k = 0; k < this.nOut; k++) {
      let s = this.b2[k];
      const off = k * this.nHid;
      for (let j = 0; j < this.nHid; j++) s += this.W2[off + j] * h[j];
      o[k] = s; if (s > max) max = s;
    }
    let sum = 0;
    for (let k = 0; k < this.nOut; k++) { o[k] = Math.exp(o[k] - max); sum += o[k]; }
    for (let k = 0; k < this.nOut; k++) o[k] /= sum;
    return { h, o };
  }
  /* 训练 idx 列表里的样本（批量 16 累积后下降），返回平均损失 */
  trainSamples(idx, X, Y, lr) {
    const gW1 = new Float32Array(this.W1.length), gW2 = new Float32Array(this.W2.length);
    const gb1 = new Float32Array(this.b1.length), gb2 = new Float32Array(this.b2.length);
    let loss = 0;
    const B = 16;
    for (let b = 0; b < idx.length; b++) {
      const n = idx[b];
      const x = X[n];
      const { h, o } = this.forward(x);
      const y = Y[n];
      for (let k = 0; k < this.nOut; k++) loss -= y[k] * Math.log(o[k] + 1e-9);
      const dO = new Float32Array(this.nOut);
      for (let k = 0; k < this.nOut; k++) dO[k] = o[k] - y[k];
      const dH = new Float32Array(this.nHid);
      for (let k = 0; k < this.nOut; k++) {
        const off = k * this.nHid;
        gb2[k] += dO[k];
        for (let j = 0; j < this.nHid; j++) {
          gW2[off + j] += dO[k] * h[j];
          dH[j] += this.W2[off + j] * dO[k];
        }
      }
      for (let j = 0; j < this.nHid; j++) {
        dH[j] *= (1 - h[j] * h[j]);
        gb1[j] += dH[j];
        const off = j * this.nIn;
        for (let i = 0; i < this.nIn; i++) gW1[off + i] += dH[j] * x[i];
      }
      if ((b + 1) % B === 0 || b === idx.length - 1) {
        const k2 = lr / Math.min(B, idx.length);
        for (let i = 0; i < this.W1.length; i++) { this.W1[i] -= gW1[i] * k2; gW1[i] = 0; }
        for (let i = 0; i < this.W2.length; i++) { this.W2[i] -= gW2[i] * k2; gW2[i] = 0; }
        for (let i = 0; i < this.b1.length; i++) { this.b1[i] -= gb1[i] * k2; gb1[i] = 0; }
        for (let i = 0; i < this.b2.length; i++) { this.b2[i] -= gb2[i] * k2; gb2[i] = 0; }
      }
    }
    return loss / idx.length;
  }
  accuracy(X, Y) {
    let ok = 0;
    for (let n = 0; n < X.length; n++) {
      const { o } = this.forward(X[n]);
      let bi = 0, bj = 0;
      for (let k = 0; k < 10; k++) { if (o[k] > o[bi]) bi = k; if (Y[n][k] > Y[n][bj]) bj = k; }
      if (bi === bj) ok++;
    }
    return ok / X.length;
  }
}

let net = new MLP(RES * RES, 48, 10);

/* 训练集（程序生成的抖动点阵字）与更难测试集（强抖动，用于错例画廊） */
const DATASET = { X: [], Y: [], Xt: [], Yt: [], N_TRAIN: 3000, N_TEST: 120, built: false };

function oneHot(d) {
  const y = new Float32Array(10); y[d] = 1;
  return y;
}
function buildDatasetChunk(start, count, hard) {
  const rng = Math.random;
  for (let n = 0; n < count; n++) {
    const i = start + n;
    const d = i % 10;
    if (hard) {
      /* 更难条件：±16° 旋转 + 大幅平移缩放 —— 测试集比训练集苛刻，错例才会出现 */
      const SZ = 96;
      const cv = document.createElement('canvas');
      cv.width = SZ; cv.height = SZ;
      const c = cv.getContext('2d', { willReadFrequently: true });
      c.fillStyle = '#000'; c.fillRect(0, 0, SZ, SZ);
      c.save();
      c.translate(SZ / 2, SZ / 2);
      c.rotate((rng() - 0.5) * 0.56);
      c.scale(0.78 + rng() * 0.4, 0.78 + rng() * 0.4);
      c.translate((rng() - 0.5) * 24, (rng() - 0.5) * 24);
      const cell = SZ / 8.6;
      c.fillStyle = '#fff';
      for (let r = 0; r < 7; r++) for (let col = 0; col < 5; col++) {
        if (FONT[d][r][col] === '1') {
          c.beginPath();
          c.arc((col - 2) * cell, (r - 3) * cell, cell * (0.32 + rng() * 0.24), 0, TAU);
          c.fill();
        }
      }
      c.restore();
      (hard ? DATASET.Xt : DATASET.X).push(Array.from(sampleCanvas(cv)));
    } else {
      DATASET.X.push(Array.from(renderDigit(d, rng)));
    }
    if (hard) DATASET.Yt.push(oneHot(d)); else DATASET.Y.push(oneHot(d));
  }
}

/* ================= 卷积引擎（6×5×5 → 池化 → 12 组合核×6 片） ================= */

const K5 = [
  { name: '竖直边缘', k: [-1, 0, 1, -2, 0, 2, -2, 0, 2, -1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { name: '水平边缘', k: [-1, -2, -2, -1, 0, 0, 0, 0, 0, 0, 1, 2, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { name: '斜线 ╲', k: [2, 1, 0, 0, 0, 1, 2, 1, 0, 0, 0, 1, 2, 1, 0, 0, 0, 1, 2, 1, 0, 0, 0, 1, 2] },
  { name: '斜线 ╱', k: [0, 0, 0, 1, 2, 0, 0, 1, 2, 1, 0, 1, 2, 1, 0, 1, 2, 1, 0, 0, 2, 1, 0, 0, 0] },
  { name: '竖笔画', k: [0, 0, -1, 0, 0, 0, 0, -1, 0, 0, 1, 1, 2, 1, 1, 0, 0, -1, 0, 0, 0, 0, -1, 0, 0] },
  { name: '横笔画', k: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, -1, -1, 2, -1, -1, 0, 0, -1, 0, 0, 0, 0, -1, 0, 0] },
];
/* 3×3 基元（第二层组合核的切片） */
const K3 = [
  [-1, 0, 1, -2, 0, 2, -1, 0, 1],     // 竖边
  [-1, -2, -1, 0, 0, 0, 1, 2, 1],     // 横边
  [2, 1, 0, 1, 2, 1, 0, 1, 2],        // 斜 ╲
  [0, 1, 2, 1, 2, 1, 2, 1, 0],        // 斜 ╱
  [-1, -1, -1, -1, 8, -1, -1, -1, -1],// 孤点/端点
  [1, 1, 1, 1, -6, 1, 1, 1, 1],       // 环绕
];
/* 第二层 12 个组合核：每个核 6 片（作用在池化后的 6 张图上再相加） */
const K2SET = (() => {
  const rnd = mulberry32(77);
  const set = [];
  for (let n = 0; n < 12; n++) {
    const slices = [];
    let norm = 0;
    for (let s = 0; s < 6; s++) {
      const w = (rnd() * 2 - 1);
      norm += Math.abs(w);
      slices.push({ base: (n + s) % 6, w, k: K3[(n * 2 + s) % 6] });
    }
    slices.forEach((s) => { s.w /= norm || 1; });
    set.push({ name: '组合 ' + (n + 1), slices });
  }
  return set;
})();

/* 第一层卷积：16×16 → 单张 12×12 响应图（-1..1） */
function conv15(vec, k) {
  const out = new Float32Array(12 * 12);
  for (let r = 0; r < 12; r++) {
    for (let c = 0; c < 12; c++) {
      let s = 0;
      for (let dy = 0; dy < 5; dy++) {
        for (let dx = 0; dx < 5; dx++) {
          s += vec[(r + dy) * RES + (c + dx)] * k[dy * 5 + dx];
        }
      }
      out[r * 12 + c] = clamp(s / 5, -1, 1);
    }
  }
  return out;
}
/* 2×2 最大池化：12×12 → 6×6 */
function pool2(m, side = 12) {
  const half = side / 2;
  const out = new Float32Array(half * half);
  for (let r = 0; r < half; r++) {
    for (let c = 0; c < half; c++) {
      out[r * half + c] = Math.max(
        m[r * 2 * side + c * 2], m[r * 2 * side + c * 2 + 1],
        m[(r * 2 + 1) * side + c * 2], m[(r * 2 + 1) * side + c * 2 + 1],
      );
    }
  }
  return out;
}
/* 六核全跑 + 池化（缓存供面板 / 第二层 / 模板匹配用） */
function convFrontend(vec) {
  const maps = K5.map((K) => conv15(vec, K.k));
  const pooled = maps.map((m) => pool2(m, 12));
  return { maps, pooled };
}
/* 第二层卷积：6×6×6 → 12 张 4×4 */
function convL2(pooled) {
  return K2SET.map((K) => {
    const out = new Float32Array(16);
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        let s = 0;
        for (const sl of K.slices) {
          for (let dy = 0; dy < 3; dy++) {
            for (let dx = 0; dx < 3; dx++) {
              s += sl.w * sl.k[dy * 3 + dx] * pooled[sl.base][(r + dy) * 6 + (c + dx)];
            }
          }
        }
        out[r * 4 + c] = clamp(s * 0.8, -1, 1);
      }
    }
    return out;
  });
}
/* 卷积思路的对照识别：池化特征与每类干净模板做余弦匹配（平移鲁棒性远好于摊平网络） */
const CONV_TPL = [];
function pooledFlat(pooled) {
  const f = new Float32Array(pooled.length * 36);
  pooled.forEach((m, i) => f.set(m, i * 36));
  return f;
}
function buildConvTemplates() {
  CONV_TPL.length = 0;
  for (let d = 0; d < 10; d++) {
    const vec = renderDigit(d, null);
    CONV_TPL.push(pooledFlat(convFrontend(vec).pooled));
  }
}
function convMatch(vec) {
  const f = pooledFlat(convFrontend(vec).pooled);
  let nrm = 0;
  for (const v of f) nrm += v * v;
  nrm = Math.sqrt(nrm) || 1;
  const sims = CONV_TPL.map((t) => {
    let tn = 0, dot = 0;
    for (let i = 0; i < f.length; i++) { tn += t[i] * t[i]; dot += t[i] * f[i]; }
    return dot / (nrm * Math.sqrt(tn) || 1);
  });
  /* 相似度 → 温度化 softmax */
  const mx = Math.max(...sims);
  const ex = sims.map((s) => Math.exp((s - mx) * 14));
  const sum = ex.reduce((a, b) => a + b, 0);
  return ex.map((e) => e / sum);
}

/* ================= 展台世界（平台 + 道具阵列，全章共享） ================= */

/* 压环境反射：摄影棚反射只保留四成能量，深青棚拍不被暖光板洗成 beige */
function tameEnv(root, v = 0.42) {
  root.traverse((o) => {
    const m = o.material;
    if (!m) return;
    if (Array.isArray(m)) m.forEach((mm) => { if ('envMapIntensity' in mm) mm.envMapIntensity = v; });
    else if ('envMapIntensity' in m) m.envMapIntensity = v;
  });
}

const world = new THREE.Group();
scene.add(world);
const WORLD = { fieldCap: null };

/* 材质单例 */
const MX = {};
function initMaterials() {
  MX.slab = matStd(0xffffff, { roughness: 0.62, metalness: 0.35 });
  MX.slab.map = brushedTexture(css('dark', 1.35), 512, 5);
  MX.slab.needsUpdate = true;
  MX.dark = matStd(tone(CV.dark, 1), { roughness: 0.62, metalness: 0.35 });
  MX.brass = matStd(CV.brass, { roughness: 0.32, metalness: 0.9 });
  MX.chrome = matStd(PAL.centriole, { roughness: 0.18, metalness: 0.95 });
  MX.rubber = matStd(tone(PAL.ink, 2.2), { roughness: 0.92, metalness: 0.02 });
  MX.paper = matStd(CV.paper, { roughness: 0.85 });
  MX.pcb = matStd(0xffffff, { roughness: 0.7, metalness: 0.1 });
  MX.pcb.map = pcbTexture(512);
  MX.pcb.needsUpdate = true;
  MX.cable = matStd(tone(PAL.ink, 2.6), { roughness: 0.7 });
  MX.fieldBase = matStd(0xffffff, { roughness: 0.5, metalness: 0.45 });
  MX.fieldBase.map = gridEtchTexture(512);
  MX.fieldBase.needsUpdate = true;
  MX.pillar = matStd(0xffffff, { roughness: 0.32, metalness: 0.12, emissive: 0x0a0e12, emissiveIntensity: 0.6 });
  MX.shell = ghostify(matCoat(CV.purple, { clearcoat: 1, clearcoatRoughness: 0.22 }), 0.42);
  MX.nucleus = matSheen(CV.purpleDeep, { sheen: 0.62, emissive: tone(CV.purple, 0.5), emissiveIntensity: 0.55 });
  MX.tile = matStd(0xffffff, { roughness: 0.3, metalness: 0.1, transparent: true, opacity: 0.92 });
}

/* 平台与地面 */
const FIELD_X = -2.2;          // 输入场在平台上的位置
const FIELD_SP = 0.1;          // 体素间距
const PLAT_TOP = 0.36;         // 平台上表面
const TRAY_TOP = 0.45;         // 输入托盘上表面（体素场根部）
function buildWorld() {
  /* 地面（暗青灰，略带纹理） */
  const gndTex = brushedTexture(css('fieldDeep', 0.55), 512, 41);
  gndTex.wrapS = gndTex.wrapT = THREE.RepeatWrapping;
  gndTex.repeat.set(5, 5);
  const gnd = mesh(new THREE.PlaneGeometry(90, 70), matStd(0xffffff, { roughness: 0.97, metalness: 0.0 }));
  gnd.material.map = gndTex;
  gnd.material.envMapIntensity = 0.22;
  gnd.material.needsUpdate = true;
  gnd.rotation.x = -Math.PI / 2;
  gnd.position.y = -0.02;
  world.add(gnd);

  /* 主平台：圆角挤出 + 拉丝金属 + 支脚（板体 0.08~0.36） */
  const slab = roundedSlab(11.2, 6.6, 0.24, 0.14, MX.slab, 0.02, 'flat');
  slab.position.y = 0.10;
  world.add(slab);
  /* 顶缘装饰圈（略大一号的薄环，压在台面上） */
  const trimShape = roundedRectShape(11.34, 6.74, 0.16);
  const trim = mesh(new THREE.ExtrudeGeometry(trimShape, { depth: 0.014, bevelEnabled: false, curveSegments: 12 }), MX.brass);
  trim.rotation.x = -Math.PI / 2;
  trim.position.y = PLAT_TOP + 0.004;
  world.add(trim);
  for (const [fx, fz] of [[-4.9, -2.6], [4.9, -2.6], [-4.9, 2.6], [4.9, 2.6]]) {
    const foot = cyl(0.09, 0.13, 0.16, MX.dark, 12);
    foot.position.set(fx, 0.0, fz);
    world.add(foot);
    const cap = cyl(0.13, 0.13, 0.024, MX.rubber, 12);
    cap.position.set(fx, -0.092, fz);
    world.add(cap);
  }
  /* 铭牌（台面右前角） */
  const plate = decalPlane(makeLabelTexture(['神经网络识数字', 'NEUROLAB · 256 PX IN · 48 HIDDEN'], { w: 300, h: 110, lineSizes: [30, 17], accent: '#3f6d7c' }), 1.3, 0.48);
  plate.position.set(3.55, PLAT_TOP + 0.006, 2.55);
  plate.rotation.x = Math.PI / 2;
  plate.rotation.z = Math.PI;
  world.add(plate);

  /* 输入托盘（体素场的底座，全章常驻） */
  const tray = box(2.06, 0.09, 2.06, MX.fieldBase);
  tray.position.set(FIELD_X, PLAT_TOP + 0.045, 0);
  world.add(tray);
  /* 托盘边框（四条倒角梁） */
  for (const [rx, rz, rw, rd] of [[0, -1.03, 2.14, 0.09], [0, 1.03, 2.14, 0.09], [-1.03, 0, 0.09, 2.14], [1.03, 0, 0.09, 2.14]]) {
    const beam = box(rw, 0.1, rd, MX.dark);
    beam.position.set(FIELD_X + rx, PLAT_TOP + 0.07, rz);
    world.add(beam);
  }
  /* 托盘四角基准柱 */
  for (const [px, pz] of [[-1.06, -1.06], [1.06, -1.06], [-1.06, 1.06], [1.06, 1.06]]) {
    const post = cyl(0.024, 0.024, 0.2, MX.brass, 8);
    post.position.set(FIELD_X + px, TRAY_TOP + 0.1, pz);
    world.add(post);
    const tip = mesh(new THREE.SphereGeometry(0.034, 8, 6), MX.chrome);
    tip.position.set(FIELD_X + px, TRAY_TOP + 0.21, pz);
    world.add(tip);
  }
  const traySh = shadowBlob(2.6, 0.36);
  traySh.position.set(FIELD_X, PLAT_TOP + 0.003, 0);
  world.add(traySh);

  buildProps();
  buildDust();
}

/* 工作室浮尘：慢速漂移的微点，给棚拍打光空气感 */
let dust = null;
function buildDust() {
  const N = 150;
  const pos = new Float32Array(N * 3);
  const seed = mulberry32(9);
  for (let i = 0; i < N; i++) {
    pos[i * 3] = (seed() - 0.5) * 14;
    pos[i * 3 + 1] = 0.3 + seed() * 4.2;
    pos[i * 3 + 2] = (seed() - 0.5) * 10;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  dust = new THREE.Points(g, new THREE.PointsMaterial({
    color: 0x9fc8d8, size: 0.02, transparent: true, opacity: 0.4, depthWrite: false,
  }));
  dust.frustumCulled = false;
  dust.userData.seed = seed;
  scene.add(dust);
}
function tickDust(dt) {
  if (!dust) return;
  const posAttr = dust.geometry.attributes.position;
  const t = performance.now() / 1000;
  for (let i = 0; i < posAttr.count; i += 3) {
    /* 每 3 粒取同一相位，省计算又成团 */
    const dx = Math.sin(t * 0.22 + i) * 0.055;
    const dy = Math.cos(t * 0.16 + i * 0.7) * 0.04;
    for (let k = 0; k < 3 && i + k < posAttr.count; k++) {
      posAttr.setY(i + k, posAttr.getY(i + k) + dy * 0.02);
      posAttr.setX(i + k, posAttr.getX(i + k) + dx * 0.02);
    }
  }
  posAttr.needsUpdate = true;
}

/* 道具阵列（平台后方与两侧） */
const equipLabels = [];
let terminal = null;
function buildProps() {
  const props = new THREE.Group();
  world.add(props);

  /* ── 训练终端（斜面显示器 + 实时 LCD） ── */
  terminal = makeTerminalScreen();
  const mon = new THREE.Group();
  const shellM = matStd(tone(CV.dark, 1.5), { roughness: 0.4, metalness: 0.3 });
  const shellB = roundedSlab(1.5, 0.1, 0.96, 0.06, shellM, 0.012, 'up');
  mon.add(shellB);
  const bezel = box(1.38, 0.84, 0.03, MX.rubber);
  bezel.position.set(0, 0, 0.055);
  mon.add(bezel);
  const screen = mesh(new THREE.PlaneGeometry(1.26, 0.72), new THREE.MeshBasicMaterial({ map: terminal.tex }));
  screen.position.set(0, 0, 0.074);
  mon.add(screen);
  const stand = cyl(0.05, 0.09, 0.3, MX.dark, 10);
  stand.position.set(0, -0.62, -0.06);
  mon.add(stand);
  const base = cyl(0.26, 0.3, 0.05, MX.dark, 16);
  base.position.set(0, -0.79, -0.06);
  mon.add(base);
  mon.position.set(4.0, 1.17, -2.1);
  mon.rotation.set(0.34, -0.5, 0);
  props.add(mon);
  const termLbl = label('训练终端 · 实时损失', '#bcd8e2', 0.0036);
  termLbl.position.set(4.0, 2.1, -2.1);
  props.add(termLbl);
  equipLabels.push(termLbl);
  const termSh = shadowBlob(0.9, 0.3);
  termSh.position.set(4.0, PLAT_TOP + 0.004, -2.1);
  props.add(termSh);

  /* ── 手写样本卡盒（斜切挡板 + 内部数字卡） ── */
  const cardBox = new THREE.Group();
  const boxMat = matStd(tone(CV.dark, 1.7), { roughness: 0.55, metalness: 0.25 });
  const boxBody = roundedSlab(1.15, 0.5, 0.14, 0.03, boxMat, 0.01, 'flat');
  boxBody.position.y = 0.08;
  cardBox.add(boxBody);
  /* 两端斜切挡板（梯形轮廓挤出，外低内高） */
  const flapShape = new THREE.Shape();
  flapShape.moveTo(-0.26, 0);
  flapShape.lineTo(0.26, 0);
  flapShape.lineTo(0.26, 0.34);
  flapShape.lineTo(-0.26, 0.2);
  flapShape.closePath();
  for (const side of [-1, 1]) {
    const flapGeo = new THREE.ExtrudeGeometry(flapShape, { depth: 0.035, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 2 });
    const flap = mesh(flapGeo, boxMat);
    flap.rotation.y = side > 0 ? 0 : Math.PI;
    flap.position.set(side * 0.55, 0.14, side > 0 ? -0.25 : 0.25);
    cardBox.add(flap);
  }
  /* 内部数字卡 0-4 错位叠放 */
  for (let d = 0; d < 5; d++) {
    const card = mesh(new THREE.PlaneGeometry(0.3, 0.4), new THREE.MeshStandardMaterial({
      map: digitCardTexture(d, d), roughness: 0.85,
      polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    }));
    card.rotation.x = -Math.PI / 2 + 0.5;
    card.rotation.z = (d - 2) * 0.06;
    card.position.set(-0.3 + d * 0.15, 0.16 + d * 0.012, -0.02 + (d % 2) * 0.03);
    cardBox.add(card);
  }
  /* 盒签 */
  const boxSign = decalPlane(makeLabelTexture(['手写样本卡', 'SAMPLES · 0-9 · 3000 张'], { w: 220, h: 92, lineSizes: [26, 15], accent: '#7c5a28' }), 0.6, 0.26);
  boxSign.position.set(0, 0.2, 0.262);
  cardBox.add(boxSign);
  cardBox.position.set(-6.5, 0, -2.3);
  cardBox.rotation.y = 0.42;
  props.add(cardBox);
  const cardLbl = label('手写样本卡盒', '#bcd8e2', 0.0036);
  cardLbl.position.set(-6.5, 0.9, -2.3);
  props.add(cardLbl);
  equipLabels.push(cardLbl);
  props.add(shadowBlob(1.4, 0.3)).children;
  props.children.at(-1).position.set(-6.5, 0.005, -2.3);

  /* ── 参考书堆 ×3 ── */
  const bookDefs = [
    ['模式识别', '#3f6d7c', 1.05, 0.09],
    ['神经网络', '#7c4a3f', 0.98, 0.085],
    ['深度学习', '#4a6b46', 0.9, 0.08],
  ];
  let bookY = 0;
  bookDefs.forEach(([title, accent, bw, bh], i) => {
    const bkMat = matStd(0xffffff, { roughness: 0.68 });
    bkMat.map = canvasTex(64, 64, (ctx) => {
      ctx.fillStyle = accent;
      ctx.fillRect(0, 0, 64, 64);
      const rnd = mulberry32(i * 13 + 1);
      for (let k = 0; k < 130; k++) {
        ctx.fillStyle = `rgba(20,24,26,${0.04 + rnd() * 0.06})`;
        ctx.fillRect(rnd() * 64, rnd() * 64, 2, 1.2);
      }
    });
    bkMat.needsUpdate = true;
    const cover = roundedSlab(bw, bw * 0.72, bh, 0.012, bkMat, 0.006, 'flat');
    cover.position.set(6.15, bookY + bh / 2, -1.35 + i * 0.1);
    cover.rotation.y = (i - 1) * 0.14;
    props.add(cover);
    /* 书脊（贴图面片贴外沿） */
    const spine = decalPlane(bookSpineTexture(title, accent), bw * 0.7 * 0.52, bw * 0.7);
    spine.rotation.x = -Math.PI / 2;
    spine.rotation.z = Math.PI / 2;
    spine.position.set(6.15 - bw * 0.36, bookY + bh + 0.004, -1.35 + i * 0.1);
    spine.rotation.y = cover.rotation.y;
    props.add(spine);
    bookY += bh + 0.012;
  });
  const bookLbl = label('参考书', '#bcd8e2', 0.0036);
  bookLbl.position.set(6.15, 0.85, -1.3);
  props.add(bookLbl);
  equipLabels.push(bookLbl);
  props.add(shadowBlob(1.1, 0.3)).children;
  props.children.at(-1).position.set(6.15, 0.005, -1.3);

  /* ── 电路板（走线丝印 + 芯片 + 排容） ── */
  const pcb = new THREE.Group();
  const board = roundedSlab(1.5, 1.06, 0.035, 0.02, MX.pcb, 0.006, 'flat');
  board.position.y = 0.075;
  pcb.add(board);
  /* 四角铜柱 */
  for (const [px, pz] of [[-0.66, -0.45], [0.66, -0.45], [-0.66, 0.45], [0.66, 0.45]]) {
    const post = cyl(0.02, 0.02, 0.06, MX.brass, 8);
    post.position.set(px, 0.045, pz);
    pcb.add(post);
  }
  /* 主芯片（黑色 QFP + 引脚） */
  const chip = box(0.34, 0.03, 0.34, matStd(tone(PAL.ink, 1.9), { roughness: 0.5 }));
  chip.position.set(-0.12, 0.1, 0);
  pcb.add(chip);
  const chipDot = mesh(new THREE.CircleGeometry(0.018, 10), matStd(tone(PAL.ink, 3.2), { roughness: 0.4 }));
  chipDot.rotation.x = -Math.PI / 2;
  chipDot.position.set(-0.2, 0.118, -0.08);
  pcb.add(chipDot);
  for (let s = 0; s < 4; s++) {
    for (let p = 0; p < 7; p++) {
      const leg = box(0.022, 0.008, 0.05, MX.chrome);
      const a = (s * Math.PI) / 2;
      const off = -0.18 + p * 0.06;
      leg.position.set(-0.12 + Math.cos(a) * 0.2 + Math.sin(a) * off, 0.096, Math.sin(a) * 0.2 - Math.cos(a) * off * 0);
      leg.position.x = -0.12 + (s === 0 ? 0.2 : s === 2 ? -0.2 : off);
      leg.position.z = s === 1 ? 0.2 : s === 3 ? -0.2 : 0;
      if (s === 1 || s === 3) leg.rotation.y = Math.PI / 2;
      pcb.add(leg);
    }
  }
  /* 小芯片 ×2 + 排容 ×4 */
  for (const [cx, cz, cw] of [[0.34, -0.22, 0.2], [0.38, 0.16, 0.14]]) {
    const small = box(cw, 0.02, cw * 0.8, matStd(tone(PAL.ink, 1.9), { roughness: 0.5 }));
    small.position.set(cx, 0.095, cz);
    pcb.add(small);
  }
  for (let i = 0; i < 4; i++) {
    const capc = cyl(0.022, 0.022, 0.045, matStd(tone(PAL.vacuole, 0.85), { roughness: 0.4 }), 10);
    capc.position.set(-0.42 + i * 0.06, 0.1, 0.32);
    pcb.add(capc);
  }
  pcb.position.set(-6.4, 0, 0.6);
  pcb.rotation.y = 0.5;
  props.add(pcb);
  const pcbLbl = label('推理加速卡', '#bcd8e2', 0.0036);
  pcbLbl.position.set(-6.4, 0.72, 0.6);
  props.add(pcbLbl);
  equipLabels.push(pcbLbl);
  props.add(shadowBlob(1.2, 0.3)).children;
  props.children.at(-1).position.set(-6.4, 0.005, 0.6);

  /* ── 打印结果纸：一叠印着像素网格的输出报告（平台右前） ── */
  const paperTex = canvasTex(256, 320, (ctx) => {
    ctx.fillStyle = '#f2efe6';
    ctx.fillRect(0, 0, 256, 320);
    const rnd = mulberry32(4);
    for (let i = 0; i < 130; i++) {
      ctx.fillStyle = `rgba(110,104,88,${0.03 + rnd() * 0.05})`;
      ctx.fillRect(rnd() * 256, rnd() * 320, 2, 2);
    }
    ctx.fillStyle = '#20262c';
    ctx.font = '700 17px ui-monospace, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('OUTPUT · No.0042', 14, 26);
    ctx.font = '600 11px ui-monospace, monospace';
    ctx.fillStyle = '#5a646e';
    ctx.fillText('conf 0.97 · epoch 12', 14, 44);
    /* 像素网格打印 */
    const cell = 11;
    for (let r = 0; r < 16; r++) {
      for (let c = 0; c < 16; c++) {
        const on = FONT[4][r % 7][c % 5] === '1' && r < 14 && c < 12 && rnd() > 0.12;
        ctx.fillStyle = on ? '#20262c' : '#e4e0d4';
        ctx.fillRect(58 + c * cell, 58 + r * cell, cell - 1.4, cell - 1.4);
      }
    }
    ctx.strokeStyle = 'rgba(120,116,100,0.5)';
    ctx.lineWidth = 2;
    ctx.strokeRect(8, 8, 240, 304);
  });
  const paperGrp = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const sheet = box(0.62, 0.008, 0.8, MX.paper);
    sheet.position.set((i - 1.5) * 0.012, 0.006 + i * 0.009, (i - 1.5) * 0.01);
    sheet.rotation.y = (i - 1.5) * 0.035 + 0.12;
    paperGrp.add(sheet);
  }
  const top = mesh(new THREE.PlaneGeometry(0.56, 0.72), new THREE.MeshStandardMaterial({
    map: paperTex, roughness: 0.85,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
  }));
  top.rotation.x = -Math.PI / 2;
  top.rotation.z = 0.12;
  top.position.y = 0.045;
  paperGrp.add(top);
  paperGrp.position.set(2.6, PLAT_TOP, 1.9);
  world.add(paperGrp);
  const paperSh = shadowBlob(0.8, 0.26);
  paperSh.position.set(2.6, PLAT_TOP + 0.004, 1.9);
  world.add(paperSh);
  const paperLbl = label('识别报告', '#bcd8e2', 0.0034);
  paperLbl.position.set(2.6, PLAT_TOP + 0.52, 1.9);
  world.add(paperLbl);
  equipLabels.push(paperLbl);

  /* ── 弧形走线：台面 → 终端 / 台面 → 电路板 ── */
  world.add(arcTube(
    [V3(4.5, PLAT_TOP + 0.015, -1.2), V3(5.1, 0.2, -1.7), V3(4.7, 0.12, -2.4), V3(4.15, 0.5, -2.15), V3(4.02, 0.62, -2.12)],
    0.026, MX.cable, 36,
  ));
  world.add(arcTube(
    [V3(-4.5, PLAT_TOP + 0.015, 1.4), V3(-5.3, 0.18, 1.3), V3(-6.0, 0.1, 1.0), V3(-6.38, 0.09, 0.78)],
    0.024, MX.cable, 32,
  ));

  /* ── 场景大标签：输入场（随 field 显隐） ── */
  const fieldCap = label('输入场 · 16 × 16', '#9fd8ce', 0.0042);
  fieldCap.position.set(FIELD_X, 0.96, 1.38);
  world.add(fieldCap);
  equipLabels.push(fieldCap);
  WORLD.fieldCap = fieldCap;
}

/* ================= 输入体素场（256 根 InstancedMesh 圆柱） ================= */

let field = null;            // InstancedMesh
const FIELD_H = 0.62;        // 满值高度
let fieldMode = 'ink';       // 'ink' 高度=像素色=墨量 | 'weights' 高度=像素色=权重
let fieldHeights = new Float32Array(RES * RES);
const _m4 = new THREE.Matrix4();
const _q0 = new THREE.Quaternion();
const _vs = new THREE.Vector3();
const _vp = new THREE.Vector3();

function buildField() {
  const geo = new THREE.CylinderGeometry(0.04, 0.044, 1, 10);
  geo.translate(0, 0.5, 0);           // 底部对齐，scale.y 直接抬升
  field = new THREE.InstancedMesh(geo, MX.pillar, RES * RES);
  field.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  world.add(field);
  world.add(paintPlane);
  const col = new THREE.Color(0x0c1218);
  for (let i = 0; i < RES * RES; i++) {
    field.setMatrixAt(i, _m4.compose(fieldCellPos(i % RES, (i / RES) | 0), _q0, _vs.set(1, 0.02, 1)));
    field.setColorAt(i, col);
  }
  field.instanceMatrix.needsUpdate = true;
  field.instanceColor.needsUpdate = true;
  field.userData.paint = { enabled: false, weights: null, onPaint: null };
}
function fieldCellPos(c, r) {
  return V3(FIELD_X + (c - (RES - 1) / 2) * FIELD_SP, TRAY_TOP, ((RES - 1) / 2 - r) * FIELD_SP);
}
const _fc = new THREE.Color();
function setFieldCell(i, h, colorHex, glow = 1) {
  _m4.compose(fieldCellPos(i % RES, (i / RES) | 0), _q0, _vs.set(1, Math.max(h, 0.018), 1));
  field.setMatrixAt(i, _m4);
  _fc.setHex(colorHex).multiplyScalar(glow);
  field.setColorAt(i, _fc);
}
function flushField() {
  field.instanceMatrix.needsUpdate = true;
  field.instanceColor.needsUpdate = true;
}
/* 高度=输入像素；颜色按模式（墨量 / 权重正负） */
function updateField(vec, weights = null) {
  fieldHeights = vec || fieldHeights;
  for (let i = 0; i < RES * RES; i++) {
    const v = fieldHeights[i];
    let hex, glow = 1;
    const h = v * FIELD_H + 0.02;
    if (weights) {
      const w = weights[i];
      const mag = Math.min(Math.abs(w), 1.4);
      hex = w >= 0 ? CV.pos : CV.neg;
      glow = 0.16 + Math.min(mag, 1) * 0.9;
      setFieldCell(i, h, hex, glow);
    } else if (v > 0.045) {
      /* 墨迹柱：亮青，越亮越白（按 sRGB 写入，转线性后上屏不发白） */
      _fc.setRGB(0.30 + v * 0.55, 0.62 + v * 0.33, 0.74 + v * 0.24, THREE.SRGBColorSpace);
      field.setColorAt(i, _fc);
      _m4.compose(fieldCellPos(i % RES, (i / RES) | 0), _q0, _vs.set(1, h, 1));
      field.setMatrixAt(i, _m4);
    } else {
      setFieldCell(i, h, 0x0c1218, 1);
    }
  }
  flushField();
}
/* 权重画笔模式：高度=像素、颜色=权重 */
function updateFieldWeightMode(vec, weights) {
  updateField(vec, weights);
}

/* ================= 场景注册（懒建 + 显隐切换） ================= */

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
  if (!g.userData.built) { build(g); tameEnv(g, 0.45); g.userData.built = true; }
  g.visible = true;
  activeScene = g;
  return g;
}

/* ---------------- 全局状态 ---------------- */

const UIREF = {};            // 控件引用注册表（小任务快捷链接用）
const state = {
  canvasVec: new Float32Array(RES * RES),
  drawing: false, lastPt: null,
  viewRes: 16, showValues: false,
  training: false, epoch: 0, seen: 0,
  lossHist: [], accTrainHist: [], accTestHist: [],
  lr: 0.5, speed: 24,
  trainOrder: [], trainCursor: 0,
  bestLoss: Infinity, bestSnap: null, plateau: 0, stopReason: '',
  pulsesPerSec: 0, _ppsT: 0, _ppsN: 0,
  neuron: { w: null, b: -0.5, act: 'sigmoid', brush: 0, testVec: null, zSum: 0, a: 0 },
  netSel: { hiddenIdx: -1 },
  conv: { kernelIdx: 0, speed: 1.5, px: 0, py: 0, phase: 'scan', holdT: 0, front: null },
  robust: { rot: 0, shift: 0, noise: 0, srcCanvas: null, srcDigit: 3, vec: null },
};
const neuronState = state.neuron;

/* 神经元章默认权重：竖线探测器（中间列正、两侧负） */
function verticalLineWeights() {
  const w = new Float32Array(RES * RES);
  for (let r = 0; r < RES; r++) {
    for (let c = 0; c < RES; c++) {
      const dc = Math.abs(c - 7.5);
      w[r * RES + c] = dc < 0.8 ? 1.0 : (dc < 2.9 ? -0.75 : 0);
    }
  }
  return w;
}
function resetNeuronWeights(preset) {
  neuronState.w = preset === 'zero' ? new Float32Array(RES * RES) : verticalLineWeights();
}

/* ================= 场景 · 一个神经元（体素场 + 神经元球 + 贡献光束） ================= */

const NEU = { beams: null, halo: null, dendrites: null, brushRing: null };
function buildNeuronScene(g) {
  /* 神经元球：外膜壳（ghost）+ 核体 + 光晕 */
  const neu = new THREE.Group();
  const shell = mesh(new THREE.SphereGeometry(0.42, 40, 28), MX.shell);
  neu.add(shell);
  const core = mesh(new THREE.SphereGeometry(0.27, 28, 20), MX.nucleus);
  neu.add(core);
  const coreDot = mesh(new THREE.SphereGeometry(0.09, 16, 12), matStd(tone(PAL.chromatin, 1), { roughness: 0.4, emissive: PAL.chromatin, emissiveIntensity: 0.8 }));
  coreDot.position.set(0.08, 0.06, 0.12);
  neu.add(coreDot);
  /* 树突：5 根弯管从壳顶伸出 */
  const dendMat = matStd(tone(CV.purple, 0.8), { roughness: 0.5 });
  const dGrp = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * TAU + 0.4;
    const pts = [
      V3(Math.cos(a) * 0.3, 0.3, Math.sin(a) * 0.3),
      V3(Math.cos(a) * 0.52, 0.55, Math.sin(a) * 0.52),
      V3(Math.cos(a + 0.3) * 0.72, 0.8 + (i % 2) * 0.16, Math.sin(a + 0.3) * 0.72),
    ];
    dGrp.add(arcTube(pts, 0.026, dendMat, 18));
  }
  neu.add(dGrp);
  NEU.dendrites = dGrp;
  neu.position.set(FIELD_X, 2.45, 0);
  g.add(neu);
  /* 底部光锥（神经元俯视输入场的暗示） */
  const cone = mesh(new THREE.CylinderGeometry(0.06, 1.05, 1.7, 24, 1, true), new THREE.MeshBasicMaterial({
    color: CV.purple, transparent: true, opacity: 0.1, side: THREE.DoubleSide, depthWrite: false,
  }));
  cone.position.set(FIELD_X, 1.32, 0);
  g.add(cone);
  /* 贡献光束：Top-24 像素 → 神经元底（动态 LineSegments） */
  const bGeo = new THREE.BufferGeometry();
  bGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(24 * 6), 3));
  bGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(24 * 6), 3));
  NEU.beams = new THREE.LineSegments(bGeo, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.9 }));
  g.add(NEU.beams);
  /* 光晕精灵 */
  NEU.halo = makeTextSprite('', { fontSize: 10 });
  NEU.halo.visible = false;
  g.add(NEU.halo);
  /* 画笔悬停环 */
  const ring = mesh(new THREE.TorusGeometry(0.075, 0.012, 8, 26), new THREE.MeshBasicMaterial({ color: CV.accent }));
  ring.rotation.x = -Math.PI / 2;
  ring.visible = false;
  NEU.brushRing = ring;
  g.add(ring);

  const capL = label('权重画在方块上 · 蓝正橙负', '#e8c9b0', 0.0036);
  capL.position.set(FIELD_X, 1.06, 1.42);
  g.add(capL);
  equipLabels.push(capL);
  resetNeuronWeights();
}

/* 神经元前向：z = Σw·x + b，a = f(z) */
const ACTS = {
  step: { name: '阶跃', f: (z) => (z > 0 ? 1 : 0) },
  sigmoid: { name: 'Sigmoid', f: (z) => 1 / (1 + Math.exp(-z * 1.6)) },
  relu: { name: 'ReLU', f: (z) => Math.max(z * 0.5, 0) },
  tanh: { name: 'tanh', f: (z) => Math.tanh(z * 1.2) },
};
function neuronForward() {
  const { w, b, act, testVec } = neuronState;
  let s = b;
  if (testVec && w) {
    for (let i = 0; i < RES * RES; i++) s += w[i] * testVec[i];
  }
  neuronState.zSum = s;
  neuronState.a = ACTS[act].f(s);
  return neuronState.a;
}
/* 更新贡献光束（取 |w·x| 最大的 24 个像素） */
function updateNeuronBeams() {
  if (!NEU.beams) return;
  const pos = NEU.beams.geometry.attributes.position;
  const col = NEU.beams.geometry.attributes.color;
  const { w, testVec } = neuronState;
  const top = [];
  if (w && testVec) {
    for (let i = 0; i < RES * RES; i++) {
      const c = w[i] * testVec[i];
      if (Math.abs(c) > 0.02) top.push([Math.abs(c), c, i]);
    }
    top.sort((a, b) => b[0] - a[0]);
  }
  const n = Math.min(top.length, 24);
  const tip = V3(FIELD_X, 2.02, 0);
  for (let k = 0; k < 24; k++) {
    if (k < n) {
      const [mag, c, i] = top[k];
      const p = fieldCellPos(i % RES, (i / RES) | 0);
      const y0 = TRAY_TOP + fieldHeights[i] * FIELD_H;
      pos.setXYZ(k * 2, p.x, y0, p.z);
      pos.setXYZ(k * 2 + 1, tip.x + (p.x - tip.x) * 0.12, tip.y, tip.z + (p.z - tip.z) * 0.12);
      const cc = c >= 0 ? _fc.setHex(CV.pos) : _fc.setHex(CV.neg);
      const gl = Math.min(mag * 2.2, 1) * 0.9 + 0.1;
      col.setXYZ(k * 2, cc.r * gl, cc.g * gl, cc.b * gl);
      col.setXYZ(k * 2 + 1, cc.r * gl * 0.7, cc.g * gl * 0.7, cc.b * gl * 0.7);
    } else {
      pos.setXYZ(k * 2, 0, -10, 0);
      pos.setXYZ(k * 2 + 1, 0, -10.2, 0);
    }
  }
  pos.needsUpdate = true;
  col.needsUpdate = true;
}
/* 神经元章整场刷新：高度=试样本像素、颜色=权重 */
function neuronSceneRefresh() {
  const a = neuronForward();
  updateField(neuronState.testVec || state.canvasVec, neuronState.w);
  updateNeuronBeams();
  if (NEU.nucleusPulse === undefined) NEU.nucleusPulse = 0;
  const glow = clamp(a, 0, 1.4);
  MX.nucleus.emissiveIntensity = 0.4 + glow * 1.6;
  return a;
}

/* ================= 场景 · 多层网络（机架 + 连线 + 信号粒子） ================= */

const NET = {
  IN_X: -3.55, HID_X: -0.4, OUT_X: 2.0,
  hidMesh: null, outMesh: null, hidPos: [], outPos: [],
  connIH: null, connHO: null, miniTex: null, miniCv: null,
  tubes: [], particles: null, partsData: null,
  rackH: null, rackO: null, weightSprite: null, labels: [],
};
function buildNetworkScene(g) {
  /* 迷你输入屏（画布纹理，随输入实时刷新） */
  const miniCv = document.createElement('canvas');
  miniCv.width = 64; miniCv.height = 64;
  NET.miniCv = miniCv;
  NET.miniTex = new THREE.CanvasTexture(miniCv);
  NET.miniTex.colorSpace = THREE.SRGBColorSpace;
  NET.miniTex.magFilter = THREE.NearestFilter;
  const frame = box(1.24, 1.24, 0.07, MX.dark);
  frame.position.set(NET.IN_X, 1.5, 0);
  g.add(frame);
  const mini = mesh(new THREE.PlaneGeometry(1.12, 1.12), new THREE.MeshBasicMaterial({ map: NET.miniTex }));
  mini.position.set(NET.IN_X, 1.5, 0.042);
  g.add(mini);
  const inLbl = label('输入层 · 256 像素', '#9fd8ce', 0.0038);
  inLbl.position.set(NET.IN_X, 2.32, 0);
  g.add(inLbl);
  NET.labels.push(inLbl);

  /* 隐藏层机架（黄铜框 + 48 神经元，3 列 × 16 行） */
  const rack = new THREE.Group();
  const RW = 0.94, RH = 2.62;
  const beamTL = box(0.07, RH + 0.16, 0.07, MX.brass);
  beamTL.position.set(-RW / 2 - 0.06, 1.5, 0);
  rack.add(beamTL);
  const beamTR = beamTL.clone();
  beamTR.position.x = RW / 2 + 0.06;
  rack.add(beamTR);
  const beamB = box(RW + 0.26, 0.07, 0.07, MX.brass);
  beamB.position.set(0, 1.5 - RH / 2 - 0.08, 0);
  rack.add(beamB);
  const beamT = beamB.clone();
  beamT.position.y = 1.5 + RH / 2 + 0.08;
  rack.add(beamT);
  /* 底座支柱 */
  for (const px of [-RW / 2 - 0.06, RW / 2 + 0.06]) {
    const leg = cyl(0.035, 0.05, 0.5, MX.dark, 10);
    leg.position.set(px, 0.32, 0);
    rack.add(leg);
  }
  /* 48 神经元（InstancedMesh，instanceColor 驱动激活辉光） */
  const sph = new THREE.SphereGeometry(0.072, 16, 12);
  NET.hidMesh = new THREE.InstancedMesh(sph, matStd(0xffffff, { roughness: 0.35, metalness: 0.1, emissive: 0xffffff, emissiveIntensity: 0.0 }), 48);
  NET.hidMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const HC = 3, HR = 16;
  const dim = new THREE.Color(0x39424e);
  for (let j = 0; j < 48; j++) {
    const cx = (j % HC) - (HC - 1) / 2;
    const cy = (HR - 1) / 2 - ((j / HC) | 0);
    const p = V3(cx * 0.3, 1.5 + cy * 0.152, 0);
    NET.hidPos.push(p);
    _m4.compose(p, _q0, _vs.set(1, 1, 1));
    NET.hidMesh.setMatrixAt(j, _m4);
    NET.hidMesh.setColorAt(j, dim);
  }
  NET.hidMesh.userData.dim = dim;
  rack.add(NET.hidMesh);
  rack.position.set(NET.HID_X, 0, 0);
  g.add(rack);
  NET.rackH = rack;
  const hidLbl = label('隐藏层 · 48 神经元（点它看权重图）', '#cbb8ee', 0.0038);
  hidLbl.position.set(NET.HID_X, 3.05, 0);
  g.add(hidLbl);
  NET.labels.push(hidLbl);

  /* 输出层（10 球 + 数字标签） */
  const oRack = new THREE.Group();
  NET.outMesh = new THREE.InstancedMesh(sph, matStd(0xffffff, { roughness: 0.35, metalness: 0.1, emissive: 0xffffff, emissiveIntensity: 0.0 }), 10);
  NET.outMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  NET.outMesh.userData.dim = dim.clone();
  for (let k = 0; k < 10; k++) {
    const p = V3(0, 2.78 - k * 0.29, 0);
    NET.outPos.push(p);
    _m4.compose(p, _q0, _vs.set(1, 1, 1));
    NET.outMesh.setMatrixAt(k, _m4);
    NET.outMesh.setColorAt(k, NET.outMesh.userData.dim);
    const sp = makeTextSprite(String(k), { fontSize: 30, color: '#cfe0ff', scale: 0.0036 });
    sp.position.set(0.36, p.y, 0);
    oRack.add(sp);
  }
  oRack.add(NET.outMesh);
  oRack.position.set(NET.OUT_X, 0, 0);
  g.add(oRack);
  NET.rackO = oRack;
  const outLbl = label('输出层 · 10 类', '#9fd8ce', 0.0038);
  outLbl.position.set(NET.OUT_X, 3.05, 0);
  g.add(outLbl);
  NET.labels.push(outLbl);

  /* 连线：输入→隐藏取 |W1| 前 320，隐藏→输出全画，颜色随权重符号与幅度 */
  NET.connIH = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.5 }));
  NET.connHO = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.72 }));
  g.add(NET.connIH, NET.connHO);

  /* 弧形信号干道：2 根 CatmullRom 管（输入屏顶 → 机架顶 → 输出顶），低弧不抢主体 */
  const tubeMat = matStd(tone(CV.accent, 0.6), { roughness: 0.4, metalness: 0.35, emissive: tone(CV.accent, 0.4), emissiveIntensity: 0.3 });
  for (let i = 0; i < 2; i++) {
    const zOff = i === 0 ? 0.16 : -0.16;
    const pts = [
      V3(NET.IN_X + 0.2, 2.18, zOff),
      V3(-2.4, 2.62 + i * 0.16, zOff * 1.6),
      V3(NET.HID_X, 2.9 + i * 0.14, 0),
      V3(0.9, 2.78 + i * 0.16, zOff),
      V3(NET.OUT_X, 2.96 - i * 0.1, 0),
    ];
    const tube = arcTube(pts, 0.014, tubeMat, 44);
    g.add(tube);
    NET.tubes.push(tube);
  }

  /* 信号粒子（一次前向的流动可视化） */
  const N = 240;
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
  const pMat = new THREE.PointsMaterial({ color: CV.signal, size: 0.055, transparent: true, opacity: 0.95, depthWrite: false, sizeAttenuation: true });
  NET.particles = new THREE.Points(pGeo, pMat);
  NET.particles.visible = false;
  NET.particles.frustumCulled = false;
  g.add(NET.particles);
  NET.partsData = { n: N, seeds: new Float32Array(N), lane: new Uint8Array(N) };
  for (let i = 0; i < N; i++) {
    NET.partsData.seeds[i] = Math.random();
    NET.partsData.lane[i] = i % 2;   // 0=输入→隐藏 1=隐藏→输出
  }

  /* 点击隐藏层神经元 → 头顶权重图精灵 */
  NET.weightSprite = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthTest: false }));
  NET.weightSprite.scale.set(0.9, 0.9, 1);
  NET.weightSprite.visible = false;
  NET.weightSprite.renderOrder = 5;
  g.add(NET.weightSprite);
}
/* 迷你输入屏刷新 */
function updateMiniInput(vec) {
  const ctx = NET.miniCv.getContext('2d');
  ctx.fillStyle = '#0a0f14';
  ctx.fillRect(0, 0, 64, 64);
  const cell = 4;
  for (let r = 0; r < RES; r++) {
    for (let c = 0; c < RES; c++) {
      const v = vec[r * RES + c];
      if (v > 0.05) {
        const g = Math.round(60 + v * 180);
        ctx.fillStyle = `rgb(${g},${Math.round(g * 1.06)},${Math.round(g * 1.12)})`;
        ctx.fillRect(c * cell, r * cell, cell - 0.4, cell - 0.4);
      }
    }
  }
  NET.miniTex.needsUpdate = true;
}
/* 连线重建（训练时随权重变化；网络场景未建时跳过，进章时会重调） */
function buildConnections() {
  if (!NET.hidPos.length) return;
  /* 隐藏→输出 */
  {
    const n = 48 * 10;
    const pos = new Float32Array(n * 6);
    const col = new Float32Array(n * 6);
    let p = 0;
    for (let k = 0; k < 10; k++) {
      for (let j = 0; j < 48; j++) {
        const a = NET.hidPos[j], b = NET.outPos[k];
        pos[p] = a.x + NET.HID_X; pos[p + 1] = a.y; pos[p + 2] = a.z;
        pos[p + 3] = b.x + NET.OUT_X; pos[p + 4] = b.y; pos[p + 5] = b.z;
        const w = net.W2[k * 48 + j];
        const cc = w >= 0 ? _fc.setHex(CV.pos) : _fc.setHex(CV.neg);
        const mag = Math.min(Math.abs(w) * 2.2, 1) * 0.8 + 0.08;
        col[p] = cc.r * mag; col[p + 1] = cc.g * mag; col[p + 2] = cc.b * mag;
        p += 3;
      }
    }
    col.needsUpdate = true;
    NET.connHO.geometry.dispose();
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    NET.connHO.geometry = g;
  }
  /* 输入→隐藏（抽前 320 强连接，端点在迷你屏面内） */
  if (net) {
    const pairs = [];
    for (let j = 0; j < 48; j++) {
      for (let i = 0; i < RES * RES; i++) pairs.push([Math.abs(net.W1[j * RES * RES + i]), j, i]);
    }
    pairs.sort((a, b) => b[0] - a[0]);
    const top = pairs.slice(0, 200);
    const pos = new Float32Array(top.length * 6);
    const col = new Float32Array(top.length * 6);
    top.forEach(([mag, j, i], n) => {
      const r = (i / RES) | 0, c = i % RES;
      const x = NET.IN_X + (c - (RES - 1) / 2) * 0.064;
      const y = 1.5 + ((RES - 1) / 2 - r) * 0.064;
      const b = NET.hidPos[j];
      pos.set([x, y, 0.06, b.x + NET.HID_X, b.y, b.z], n * 6);
      const w = net.W1[j * RES * RES + i];
      const cc = w >= 0 ? _fc.setHex(0x5a9fb8) : _fc.setHex(0xb87a5a);
      const mm = Math.min(mag * 2.6, 1) * 0.55 + 0.06;
      col.set([cc.r * mm, cc.g * mm, cc.b * mm, cc.r * mm, cc.g * mm, cc.b * mm], n * 6);
    });
    NET.connIH.geometry.dispose();
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    NET.connIH.geometry = g;
  }
}
/* 权重图纹理（16×16 蓝橙图 → CanvasTexture） */
const _wmCv = document.createElement('canvas');
function weightMapTexture(wVec, px = 128, res = RES) {
  _wmCv.width = px; _wmCv.height = px;
  const ctx = _wmCv.getContext('2d');
  ctx.fillStyle = '#0a0f14';
  ctx.fillRect(0, 0, px, px);
  const cell = px / res;
  let maxAbs = 1e-6;
  for (let i = 0; i < res * res; i++) maxAbs = Math.max(maxAbs, Math.abs(wVec[i]));
  for (let r = 0; r < res; r++) {
    for (let c = 0; c < res; c++) {
      const w = wVec[r * res + c];
      const t = Math.abs(w) / maxAbs;
      if (t < 0.03) continue;
      ctx.fillStyle = w >= 0
        ? `rgba(96,205,180,${0.15 + t * 0.8})`
        : `rgba(233,132,86,${0.15 + t * 0.8})`;
      ctx.fillRect(c * cell, r * cell, cell - 0.5, cell - 0.5);
    }
  }
  const tex = new THREE.CanvasTexture(_wmCv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.magFilter = THREE.NearestFilter;
  return tex;
}
/* 点选隐藏层神经元：头顶浮出权重图 + 右栏同步 */
function showHiddenWeight(j) {
  state.netSel.hiddenIdx = j;
  if (NET.weightSprite) {
    if (NET.weightSprite.material.map) NET.weightSprite.material.map.dispose();
    NET.weightSprite.material.map = weightMapTexture(net.W1.subarray(j * RES * RES, (j + 1) * RES * RES), 128);
    NET.weightSprite.material.needsUpdate = true;
    NET.weightSprite.position.set(NET.hidPos[j].x + NET.HID_X, NET.hidPos[j].y + 0.34, 0.1);
    NET.weightSprite.visible = true;
  }
  const hc = document.getElementById('hiddenWeight');
  if (hc) {
    const cv = hc.querySelector('canvas');
    const ctx = cv.getContext('2d');
    ctx.clearRect(0, 0, cv.width, cv.height);
    const tex = weightMapTexture(net.W1.subarray(j * RES * RES, (j + 1) * RES * RES), cv.width);
    ctx.drawImage(tex.image, 0, 0);
    tex.dispose();
    hc.closest('.data-block').style.display = '';
    const cap = document.getElementById('hiddenWeightCap');
    if (cap) cap.textContent = `隐藏层 · 第 ${j + 1} 个神经元的权重图`;
    const note = document.getElementById('hiddenWeightNote');
    if (note) note.textContent = '蓝格的位置有笔画它会更兴奋，橙格的位置会抑制它——整张图就是它在找的笔画形状。';
  }
  const gal = document.querySelectorAll('.wgallery canvas');
  gal.forEach((cv, i) => cv.classList.toggle('picked', i === j));
}

/* ================= 场景 · 卷积扫描（扫描窗 + 核瓦片 + 特征柱） ================= */

const CONV3D = { frame: null, tiles: null, feats: null, featTray: null, capL: null };
function buildConvScene(g) {
  /* 5×5 扫描窗：四条边梁 */
  const fr = new THREE.Group();
  const W = 5 * FIELD_SP;
  const barMat = matStd(tone(CV.accent, 1), { roughness: 0.3, metalness: 0.5, emissive: tone(CV.accent, 0.6), emissiveIntensity: 0.5 });
  for (const [ox, oy, oz, sx, sz] of [
    [0, 0, -W / 2, W + 0.06, 0.028], [0, 0, W / 2, W + 0.06, 0.028],
    [-W / 2, 0, 0, 0.028, W + 0.06], [W / 2, 0, 0, 0.028, W + 0.06],
  ]) {
    const b = box(sx, 0.03, sz, barMat);
    b.position.set(ox, 0.012, oz);
    fr.add(b);
  }
  /* 四角小柱 */
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const post = cyl(0.014, 0.014, 0.3, barMat, 8);
    post.position.set((sx * W) / 2, 0.15, (sz * W) / 2);
    fr.add(post);
  }
  fr.position.set(0, 0.52, 0);   // 贴着托盘上沿
  CONV3D.frame = fr;
  const frameHolder = new THREE.Group();
  frameHolder.position.set(FIELD_X, 0, 0);
  frameHolder.add(fr);
  g.add(frameHolder);
  CONV3D.holder = frameHolder;

  /* 卷积核瓦片：25 片浮在扫描窗上方，颜色=核权重正负 */
  const tileGeo = new THREE.BoxGeometry(0.075, 0.02, 0.075);
  CONV3D.tiles = new THREE.InstancedMesh(tileGeo, MX.tile, 25);
  CONV3D.tiles.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  CONV3D.tiles.position.set(FIELD_X, 0, 0);
  g.add(CONV3D.tiles);

  /* 特征柱托盘 + 12×12 特征柱（当前选中核的响应） */
  const tray = box(1.4, 0.07, 1.4, MX.fieldBase);
  tray.position.set(1.95, PLAT_TOP + 0.035, 0);
  g.add(tray);
  for (const [rx, rz, rw, rd] of [[0, -0.7, 1.48, 0.07], [0, 0.7, 1.48, 0.07], [-0.7, 0, 0.07, 1.48], [0.7, 0, 0.07, 1.48]]) {
    const beam = box(rw, 0.08, rd, MX.dark);
    beam.position.set(1.95 + rx, PLAT_TOP + 0.055, rz);
    g.add(beam);
  }
  const fGeo = new THREE.CylinderGeometry(0.032, 0.036, 1, 8);
  fGeo.translate(0, 0.5, 0);
  CONV3D.feats = new THREE.InstancedMesh(fGeo, MX.pillar.clone(), 144);
  CONV3D.feats.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  g.add(CONV3D.feats);
  const dimc = new THREE.Color(0x10161c);
  for (let i = 0; i < 144; i++) {
    const c = i % 12, r = (i / 12) | 0;
    _m4.compose(V3(1.95 + (c - 5.5) * 0.108, PLAT_TOP + 0.07, (5.5 - r) * 0.108), _q0, _vs.set(1, 0.02, 1));
    CONV3D.feats.setMatrixAt(i, _m4);
    CONV3D.feats.setColorAt(i, dimc);
  }
  CONV3D.feats.instanceMatrix.needsUpdate = true;
  CONV3D.feats.instanceColor.needsUpdate = true;
  const fLbl = label('特征图 · 12 × 12', '#9fd8ce', 0.0038);
  fLbl.position.set(1.95, 1.42, 0);
  g.add(fLbl);
  equipLabels.push(fLbl);

  const capL = label('5 × 5 卷积核逐格扫描', '#ffd9b0', 0.0042);
  capL.position.set(FIELD_X, 1.78, 0);
  g.add(capL);
  CONV3D.capL = capL;
  equipLabels.push(capL);
}
/* 核瓦片颜色与位置刷新 */
const _tc = new THREE.Color();
function refreshConvTiles() {
  const k = K5[state.conv.kernelIdx].k;
  const W = 5 * FIELD_SP;
  let maxA = 1e-6;
  for (let i = 0; i < 25; i++) maxA = Math.max(maxA, Math.abs(k[i]));
  for (let i = 0; i < 25; i++) {
    const cx = (i % 5) - 2, cy = 2 - ((i / 5) | 0);
    _m4.compose(
      V3((cx - 2) * 0.082, 0.34 + cy * 0.014, cy * 0.082),
      _q0, _vs.set(1, 1, 1),
    );
    CONV3D.tiles.setMatrixAt(i, _m4);
    const t = Math.abs(k[i]) / maxA;
    _tc.setHex(k[i] >= 0 ? CV.pos : CV.neg).multiplyScalar(0.25 + t * 0.85);
    CONV3D.tiles.setColorAt(i, _tc);
  }
  CONV3D.tiles.instanceMatrix.needsUpdate = true;
  CONV3D.tiles.instanceColor.needsUpdate = true;
}
/* 特征柱刷新（按已扫描进度） */
const _fcc = new THREE.Color();
function refreshConvFeats(map, uptoRow, uptoCol) {
  for (let i = 0; i < 144; i++) {
    const c = i % 12, r = (i / 12) | 0;
    const done = r < uptoRow || (r === uptoRow && c < uptoCol);
    if (!done || !map) {
      _m4.compose(V3(1.95 + (c - 5.5) * 0.108, PLAT_TOP + 0.07, (5.5 - r) * 0.108), _q0, _vs.set(1, 0.02, 1));
      _fcc.setHex(0x10161c);
    } else {
      const v = map[i];
      _m4.compose(V3(1.95 + (c - 5.5) * 0.108, PLAT_TOP + 0.07, (5.5 - r) * 0.108), _q0, _vs.set(1, Math.max(Math.abs(v), 0.03) * 0.9, 1));
      _fcc.setHex(v >= 0 ? CV.pos : CV.neg).multiplyScalar(0.35 + Math.min(Math.abs(v), 1) * 0.8);
    }
    CONV3D.feats.setMatrixAt(i, _m4);
    CONV3D.feats.setColorAt(i, _fcc);
  }
  CONV3D.feats.instanceMatrix.needsUpdate = true;
  CONV3D.feats.instanceColor.needsUpdate = true;
}
/* 扫描一步（tick 内推进） */
function convScanStep(dt) {
  const C = state.conv;
  C.px += dt * 6 * C.speed;
  while (C.px >= 12) {
    C.px -= 12;
    C.py += 1;
  }
  if (C.py >= 12) {
    C.py = 0;
    C.px = 0;
  }
  const col = Math.min(Math.floor(C.px), 11);
  CONV3D.frame.position.set((col - 5.5) * FIELD_SP, 0.52, ((5.5 - C.py) * FIELD_SP));
  CONV3D.tiles.position.set(FIELD_X + (col - 5.5) * FIELD_SP, 1.58, (5.5 - C.py) * FIELD_SP);
  if (C.front) {
    const map = C.front.maps[C.kernelIdx];
    refreshConvFeats(map, C.py, col);
  }
}

/* ================= 场景 · AI 也会犯错（扰动指示环） ================= */

const MIST = { ring: null, arrow: null };
function buildMistakeScene(g) {
  /* 旋转指示弧 + 箭头（rot=0 时隐藏） */
  const arc = mesh(new THREE.TorusGeometry(1.28, 0.016, 8, 60, Math.PI * 0.72), new THREE.MeshBasicMaterial({
    color: CV.warn, transparent: true, opacity: 0.85,
  }));
  arc.rotation.x = -Math.PI / 2;
  arc.position.set(FIELD_X, 1.42, 0);
  MIST.ring = arc;
  g.add(arc);
  const arrowHead = mesh(new THREE.ConeGeometry(0.06, 0.16, 10), new THREE.MeshBasicMaterial({ color: CV.warn }));
  arrowHead.rotation.z = Math.PI / 2;
  MIST.arrow = arrowHead;
  g.add(arrowHead);
  const capL = label('旋转 · 平移 · 噪点 考垮它', '#f0c0a8', 0.0042);
  capL.position.set(FIELD_X, 1.86, 0);
  g.add(capL);
  equipLabels.push(capL);
}
function updateMistakeIndicators() {
  const rot = state.robust.rot;
  MIST.ring.visible = Math.abs(rot) > 0.5;
  MIST.arrow.visible = MIST.ring.visible;
  if (MIST.ring.visible) {
    const frac = Math.abs(rot) / 40;
    MIST.ring.geometry.dispose();
    MIST.ring.geometry = new THREE.TorusGeometry(1.28, 0.016, 8, 60, Math.max(Math.PI * 0.72 * frac, 0.1));
    MIST.ring.rotation.z = 0;
    const a0 = rot >= 0 ? -Math.PI / 2 : -Math.PI / 2 - Math.PI * 0.72 * frac;
    MIST.arrow.position.set(FIELD_X + Math.cos(a0) * 1.28, 1.42, -Math.sin(a0) * 1.28);
    MIST.arrow.rotation.set(-Math.PI / 2, 0, 0);
    MIST.arrow.rotation.y = -a0;
  }
}

/* ================= 前向传播动画（逐层点亮 + 粒子流） ================= */

let pulse = { on: false, t: 0, vec: null, h: null, o: null, hidDone: false };
function startPulse(vec) {
  const { h, o } = net.forward(vec);
  pulse = { on: true, t: 0, vec: vec.slice(), h, o, hidDone: true };
  NET.particles.visible = true;
}
function tickPulse(dt) {
  if (!pulse.on) return;
  pulse.t += dt;
  const t = pulse.t;
  const dimH = NET.hidMesh.userData.dim, dimO = NET.outMesh.userData.dim;
  const cH = new THREE.Color(), cO = new THREE.Color();
  /* 粒子：前半程 输入→隐藏，后半程 隐藏→输出 */
  const posAttr = NET.particles.geometry.attributes.position;
  const ph = clamp(t / 1.15, 0, 1.6);
  for (let i = 0; i < NET.partsData.n; i++) {
    const lane = NET.partsData.lane[i];
    const s = NET.partsData.seeds[i];
    let x, y, z = (s - 0.5) * 0.14;
    if (lane === 0) {
      const r = clamp(ph * 1.25 - s * 0.25, 0, 1);
      const a = V3(NET.IN_X + (s - 0.5) * 0.9, 0.9 + s * 1.3, 0);
      const b = NET.hidPos[i % 48];
      x = lerp(a.x, b.x + NET.HID_X, r);
      y = lerp(a.y, b.y, r) + Math.sin(r * Math.PI) * 0.55;
    } else {
      const r = clamp((ph - 0.5) * 1.7 - s * 0.2, 0, 1);
      const a = NET.hidPos[(i * 7) % 48];
      const b = NET.outPos[i % 10];
      x = lerp(a.x + NET.HID_X, b.x + NET.OUT_X, r);
      y = lerp(a.y, b.y, r) + Math.sin(r * Math.PI) * 0.32;
    }
    posAttr.setXYZ(i, x, y, z);
  }
  posAttr.needsUpdate = true;
  /* 逐层辉光 */
  const g1 = Math.exp(-Math.pow((t - 0.55) * 2.1, 2));
  const g2 = Math.exp(-Math.pow((t - 1.05) * 2.0, 2));
  for (let j = 0; j < 48; j++) {
    const act = pulse.h ? Math.abs(pulse.h[j]) : 0;
    const glow = 0.18 + act * g1 * 1.5;
    cH.copy(dimH).lerp(new THREE.Color(0.55, 0.85, 0.95), Math.min(glow, 1));
    NET.hidMesh.setColorAt(j, cH);
  }
  NET.hidMesh.instanceColor.needsUpdate = true;
  for (let k = 0; k < 10; k++) {
    const p = pulse.o ? pulse.o[k] : 0;
    const glow = 0.15 + p * g2 * 2.6;
    cO.copy(dimO).lerp(new THREE.Color(0.98, 0.72, 0.42), Math.min(glow, 1));
    NET.outMesh.setColorAt(k, cO);
  }
  NET.outMesh.instanceColor.needsUpdate = true;
  if (t > 2.2) {
    pulse.on = false;
    NET.particles.visible = false;
    for (let j = 0; j < 48; j++) NET.hidMesh.setColorAt(j, dimH);
    for (let k = 0; k < 10; k++) NET.outMesh.setColorAt(k, dimO);
    NET.hidMesh.instanceColor.needsUpdate = true;
    NET.outMesh.instanceColor.needsUpdate = true;
  }
}

/* ================= 右栏数据坞（DOM 构件） ================= */

const lcData = document.getElementById('lcData');
const controlsEl = document.getElementById('controls');
const lessonEl = document.getElementById('lesson');
const ctl = createControlsPanel(controlsEl);

function elHud(rows) {
  const card = document.createElement('div');
  card.className = 'hud-card';
  const els = {};
  rows.forEach(([key, cap]) => {
    const r = document.createElement('div');
    r.className = 'hud-row';
    const l = document.createElement('span');
    l.textContent = cap;
    const v = document.createElement('b');
    v.textContent = '–';
    r.appendChild(l); r.appendChild(v);
    card.appendChild(r);
    els[key] = v;
  });
  return { el: card, set(key, t) { if (els[key]) els[key].textContent = t; } };
}
function elBlock(cap, badge = '') {
  const b = document.createElement('div');
  b.className = 'data-block';
  const h = document.createElement('div');
  h.className = 'db-cap';
  h.innerHTML = `<span>${cap}</span>${badge ? `<em>${badge}</em>` : ''}`;
  b.appendChild(h);
  return { el: b, badgeEl: h.querySelector('em') };
}
function elCanvasBlock(cap, w, h, badge = '') {
  const blk = elBlock(cap, badge);
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  blk.el.appendChild(cv);
  blk.cv = cv;
  return blk;
}
function clearData() { lcData.innerHTML = ''; }

/* 置信度柱 ×10 */
function elBars() {
  const blk = elBlock('十类置信度');
  const wrap = document.createElement('div');
  wrap.className = 'bars-10';
  const rows = [];
  for (let d = 0; d < 10; d++) {
    const r = document.createElement('div');
    r.className = 'bar-row';
    r.innerHTML = `<span class="bar-label">${d}</span><span class="bar-track"><span class="bar-fill"></span></span><span class="bar-val">0%</span>`;
    wrap.appendChild(r);
    rows.push({ fill: r.querySelector('.bar-fill'), val: r.querySelector('.bar-val') });
  }
  blk.el.appendChild(wrap);
  blk.rows = rows;
  blk.set = (probs) => {
    let best = 0;
    probs.forEach((p, i) => { if (p > probs[best]) best = i; });
    probs.forEach((p, i) => {
      rows[i].fill.style.width = Math.round(clamp(p, 0, 1) * 100) + '%';
      rows[i].fill.style.background = i === best ? 'var(--accent)' : 'var(--chip-bg)';
      rows[i].val.textContent = Math.round(p * 100) + '%';
    });
  };
  return blk;
}
/* 识别结果（大数字 + 置信度） */
function elVerdict() {
  const blk = elBlock('识别结果');
  const v = document.createElement('div');
  v.className = 'verdict';
  v.innerHTML = `<div class="vd-digit">–</div><div class="vd-side"><div class="vd-label">网络给出的答案</div><div class="vd-conf">–</div></div>`;
  blk.el.appendChild(v);
  blk.digitEl = v.querySelector('.vd-digit');
  blk.confEl = v.querySelector('.vd-conf');
  blk.set = (best, prob, second, secondP) => {
    if (blk.digitEl.textContent !== String(best)) {
      blk.digitEl.textContent = String(best);
      blk.digitEl.classList.remove('pop');
      void blk.digitEl.offsetWidth;
      blk.digitEl.classList.add('pop');
    }
    blk.confEl.textContent = `${Math.round(prob * 100)}%` + (second !== undefined ? `　次选 ${second}（${Math.round(secondP * 100)}%）` : '');
  };
  return blk;
}
/* 像素灰度视图（分辨率可变 + 显示数值 + 预处理演示帧） */
function drawPixelGrid(ctx, W, H, vec, res, showValues) {
  ctx.fillStyle = '#0d1117';
  ctx.fillRect(0, 0, W, H);
  const cs = W / res;
  ctx.font = '600 9px ui-monospace, monospace';
  for (let r = 0; r < res; r++) {
    for (let c = 0; c < res; c++) {
      const i = r * res + c;
      const v = vec ? vec[i] : 0;
      ctx.fillStyle = `rgb(${40 + v * 200},${44 + v * 190},${54 + v * 180})`;
      ctx.fillRect(c * cs, r * cs, cs - 0.7, cs - 0.7);
      if (showValues && res <= 16 && v > 0.06) {
        ctx.fillStyle = v > 0.55 ? '#10141a' : '#dfe6f2';
        ctx.fillText(String(Math.round(v * 99)), c * cs + 1.5, r * cs + 9);
      }
    }
  }
}
/* 16×16 向量重采样为 res×res 再升回（低分辨率识别用） */
function resampleVec(vec, res) {
  if (res === RES) return vec;
  const small = new Float32Array(res * res);
  const f = RES / res;
  for (let r = 0; r < res; r++) {
    for (let c = 0; c < res; c++) {
      let s = 0, n = 0;
      const r0 = Math.floor(r * f), r1 = Math.min(RES, Math.max(r0 + 1, Math.floor((r + 1) * f)));
      const c0 = Math.floor(c * f), c1 = Math.min(RES, Math.max(c0 + 1, Math.floor((c + 1) * f)));
      for (let rr = r0; rr < r1; rr++) for (let cc = c0; cc < c1; cc++) { s += vec[rr * RES + cc]; n++; }
      small[r * res + c] = s / (n || 1);
    }
  }
  /* 升回 16×16（最近邻放大后模型仍吃 256 维输入） */
  const up = new Float32Array(RES * RES);
  const g = res / RES;
  for (let r = 0; r < RES; r++) {
    for (let c = 0; c < RES; c++) {
      up[r * RES + c] = small[Math.min(res - 1, (r * g) | 0) * res + Math.min(res - 1, (c * g) | 0)];
    }
  }
  return up;
}
/* 训练双轴曲线：损失 + 训练/测试准确率 */
function drawTrainChart(cv) {
  const ctx = cv.getContext('2d');
  const W = cv.width, H = cv.height;
  ctx.fillStyle = '#0d1117';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(120,150,170,0.16)';
  ctx.lineWidth = 1;
  for (let i = 1; i < 4; i++) {
    const y = (H - 26) * i / 4 + 8;
    ctx.beginPath(); ctx.moveTo(30, y); ctx.lineTo(W - 8, y); ctx.stroke();
  }
  const plot = (hist, max, color, y0 = 8, y1 = H - 26) => {
    if (hist.length < 2) return;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    hist.forEach((v, i) => {
      const x = 30 + (i / (hist.length - 1)) * (W - 42);
      const y = y1 - clamp(v / max, 0, 1) * (y1 - y0);
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    });
    ctx.stroke();
  };
  const maxLoss = Math.max(...state.lossHist, 0.4);
  plot(state.lossHist, maxLoss, '#f0a35e');
  plot(state.accTrainHist, 1, '#a98fe6');
  plot(state.accTestHist, 1, '#5ecfdc');
  ctx.font = '600 11px ui-monospace, monospace';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#f0a35e';
  ctx.fillText('损失 ' + (state.lossHist.length ? state.lossHist[state.lossHist.length - 1].toFixed(3) : '--'), 32, 16);
  ctx.fillStyle = '#a98fe6';
  ctx.fillText('训 ' + (state.accTrainHist.length ? Math.round(state.accTrainHist[state.accTrainHist.length - 1] * 100) + '%' : '--'), 118, 16);
  ctx.fillStyle = '#5ecfdc';
  ctx.fillText('测 ' + (state.accTestHist.length ? Math.round(state.accTestHist[state.accTestHist.length - 1] * 100) + '%' : '--'), 176, 16);
}
/* 第一层权重画廊（48 格画布） */
function drawWeightToCanvas(cv, wVec) {
  const ctx = cv.getContext('2d');
  const px = cv.width;
  ctx.fillStyle = '#0d1117';
  ctx.fillRect(0, 0, px, px);
  const cell = px / RES;
  let maxAbs = 1e-6;
  for (let i = 0; i < RES * RES; i++) maxAbs = Math.max(maxAbs, Math.abs(wVec[i]));
  for (let r = 0; r < RES; r++) {
    for (let c = 0; c < RES; c++) {
      const w = wVec[r * RES + c];
      const t = Math.abs(w) / maxAbs;
      if (t < 0.06) continue;
      ctx.fillStyle = w >= 0
        ? `rgba(96,205,180,${0.12 + t * 0.85})`
        : `rgba(233,132,86,${0.12 + t * 0.85})`;
      ctx.fillRect(c * cell, r * cell, cell - 0.4, cell - 0.4);
    }
  }
}
function refreshWeightGallery(gal) {
  if (!gal) return;
  const canvases = gal.querySelectorAll ? gal.querySelectorAll('canvas') : gal;
  canvases.forEach((cv, j) => {
    drawWeightToCanvas(cv, net.W1.subarray(j * RES * RES, (j + 1) * RES * RES));
  });
}

/* ================= 小任务（完成自动打勾 + 快捷链接） ================= */

const TASK_STATE = {};
try {
  const saved = JSON.parse(localStorage.getItem('neuro.tasks') || '{}');
  Object.assign(TASK_STATE, saved);
} catch (e) { /* 忽略 */ }
let taskHooks = {};
function saveTasks() {
  try { localStorage.setItem('neuro.tasks', JSON.stringify(TASK_STATE)); } catch (e) { /* 忽略 */ }
}
function elTasks(defs) {
  const wrap = document.createElement('div');
  wrap.className = 'task-list';
  wrap.innerHTML = '<div class="task-cap">小任务 · 做完自动打勾</div>';
  const items = {};
  defs.forEach(([id, labelHtml]) => {
    const it = document.createElement('div');
    it.className = 'task-item';
    it.innerHTML = `<span class="tk-box">✓</span><span class="tk-text">${labelHtml}</span>`;
    wrap.appendChild(it);
    items[id] = it;
    it.querySelectorAll('.tk-link').forEach((a) => {
      a.addEventListener('click', () => taskHooks[a.dataset.act]?.());
    });
  });
  wrap.refresh = () => {
    defs.forEach(([id]) => {
      items[id].classList.toggle('done', !!TASK_STATE[id]);
    });
  };
  wrap.check = (id) => {
    if (!TASK_STATE[id]) {
      TASK_STATE[id] = 1;
      saveTasks();
      wrap.refresh();
    }
  };
  wrap.reset = (ids) => {
    ids.forEach((id) => { delete TASK_STATE[id]; });
    saveTasks();
    wrap.refresh();
  };
  wrap.refresh();
  return wrap;
}

/* ================= 提示条 ================= */

function toast(text, kind = 'ok') {
  const old = stage.querySelector('.neuro-toast');
  if (old) old.remove();
  const el = document.createElement('div');
  el.className = 'neuro-toast ' + kind;
  el.textContent = text;
  stage.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 300);
  }, kind === 'warn' ? 4200 : 3000);
}

/* ================= 手写板（浮窗画布 → 向量） ================= */

const boardPanel = document.getElementById('boardPanel');
const board = document.getElementById('board');
const bctx = board.getContext('2d', { willReadFrequently: true });
function clearBoard(silent = false) {
  bctx.fillStyle = '#0d1017';
  bctx.fillRect(0, 0, 240, 240);
  state.canvasVec = new Float32Array(RES * RES);
  afterBoardChange();
  if (!silent) toast('画板已清空。');
}
function boardToVec() {
  const cv = document.createElement('canvas');
  cv.width = 240; cv.height = 240;
  cv.getContext('2d').drawImage(board, 0, 0);
  state.canvasVec = sampleCanvas(cv);
  afterBoardChange();
}
function boardPos(e) {
  const r = board.getBoundingClientRect();
  const p = e.touches ? e.touches[0] : e;
  return [(p.clientX - r.left) / r.width * 240, (p.clientY - r.top) / r.height * 240];
}
function strokeTo(x, y) {
  bctx.strokeStyle = '#f2f5f8';
  bctx.lineWidth = 15; bctx.lineCap = 'round'; bctx.lineJoin = 'round';
  if (state.lastPt) {
    bctx.beginPath();
    bctx.moveTo(state.lastPt[0], state.lastPt[1]);
    bctx.lineTo(x, y);
    bctx.stroke();
  } else {
    bctx.fillStyle = '#f2f5f8';
    bctx.beginPath();
    bctx.arc(x, y, 7.5, 0, TAU);
    bctx.fill();
  }
  state.lastPt = [x, y];
}
board.addEventListener('pointerdown', (e) => {
  state.drawing = true;
  state.lastPt = null;
  const [x, y] = boardPos(e);
  strokeTo(x, y);
  e.preventDefault();
});
window.addEventListener('pointermove', (e) => {
  if (!state.drawing) return;
  const [x, y] = boardPos(e);
  strokeTo(x, y);
});
window.addEventListener('pointerup', () => {
  if (!state.drawing) return;
  state.drawing = false;
  state.lastPt = null;
  boardToVec();
});
/* 把 16×16 向量放大印回画板（随机样本 / 示例按钮） */
function stampVecToBoard(vec) {
  const tmp = document.createElement('canvas');
  tmp.width = RES; tmp.height = RES;
  const tc = tmp.getContext('2d');
  const id = tc.createImageData(RES, RES);
  for (let i = 0; i < RES * RES; i++) {
    const g = Math.round(vec[i] * 255);
    id.data[i * 4] = g; id.data[i * 4 + 1] = g; id.data[i * 4 + 2] = g; id.data[i * 4 + 3] = 255;
  }
  tc.putImageData(id, 0, 0);
  bctx.imageSmoothingEnabled = false;
  bctx.drawImage(tmp, 0, 0, 240, 240);
  boardToVec();
}
function demoDigit(d) {
  stampVecToBoard(renderDigit(d, Math.random));
  taskHooks.afterSample?.(d);
}
document.getElementById('boardClear').addEventListener('click', () => clearBoard());
document.getElementById('boardRandom').addEventListener('click', () => {
  demoDigit((Math.random() * 10) | 0);
});
/* 画板内容变化后的章节钩子 */
let boardHook = null;
function afterBoardChange() {
  taskHooks.onWrite?.();
  if (boardHook) boardHook();
}

/* ================= 画笔直接在体素场上画权重（神经元章） ================= */

const raycaster = new THREE.Raycaster();
const paintPlane = new THREE.Mesh(
  new THREE.PlaneGeometry(2.2, 2.2),
  new THREE.MeshBasicMaterial({ visible: false }),
);
paintPlane.rotation.x = -Math.PI / 2;
paintPlane.position.set(FIELD_X, TRAY_TOP + 0.01, 0);
function pickFieldCell(e) {
  const r = app.dom.getBoundingClientRect();
  const ndc = new THREE.Vector2(
    ((e.clientX - r.left) / r.width) * 2 - 1,
    -((e.clientY - r.top) / r.height) * 2 + 1,
  );
  raycaster.setFromCamera(ndc, app.camera);
  const hit = raycaster.intersectObject(paintPlane, false)[0];
  if (!hit) return -1;
  const lx = hit.point.x - FIELD_X;
  const lz = hit.point.z;
  const c = Math.round(lx / FIELD_SP + (RES - 1) / 2);
  const row = Math.round((RES - 1) / 2 - lz / FIELD_SP);
  if (c < 0 || c >= RES || row < 0 || row >= RES) return -1;
  return row * RES + c;
}
/* 3D 点选：隐藏层神经元 → 权重图；输出神经元 → 对应置信度柱 */
let pickDown = null;
app.dom.addEventListener('pointerdown', (e) => {
  pickDown = [e.clientX, e.clientY];
});
app.dom.addEventListener('pointerup', (e) => {
  if (!pickDown || Math.hypot(e.clientX - pickDown[0], e.clientY - pickDown[1]) > 5) { pickDown = null; return; }
  pickDown = null;
  if (field.userData.paint.enabled) return;
  const sec = SECTIONS[chapterIdx];
  if (!scenes.network || !scenes.network.visible) return;
  const r = app.dom.getBoundingClientRect();
  const ndc = new THREE.Vector2(
    ((e.clientX - r.left) / r.width) * 2 - 1,
    -((e.clientY - r.top) / r.height) * 2 + 1,
  );
  raycaster.setFromCamera(ndc, app.camera);
  const hitH = raycaster.intersectObject(NET.hidMesh, false)[0];
  if (hitH) {
    showHiddenWeight(hitH.instanceId);
    if (classifyEls && classifyEls.hiddenBlock) classifyEls.hiddenBlock.style.display = '';
    toast(`第 ${hitH.instanceId + 1} 个神经元的 256 个权重——这就是它在找的笔画。`);
    taskHooks.onGallery?.();
    return;
  }
  const hitO = raycaster.intersectObject(NET.outMesh, false)[0];
  if (hitO && classifyEls && classifyEls.bars) {
    const k = hitO.instanceId;
    const row = classifyEls.bars.rows[k];
    if (row) {
      row.fill.style.background = 'var(--accent)';
      row.val.textContent = '←';
      setTimeout(() => classifyVector(state.canvasVec), 900);
    }
    toast(`输出神经元 ${k}：这一类当前的置信度见右栏。`);
  }
});
/* 悬停指针提示（隐藏层 / 输出层可点） */
app.dom.addEventListener('pointermove', (e) => {
  if (field.userData.paint.enabled) return;
  if (!scenes.network || !scenes.network.visible) { app.dom.style.cursor = ''; return; }
  const r = app.dom.getBoundingClientRect();
  const ndc = new THREE.Vector2(
    ((e.clientX - r.left) / r.width) * 2 - 1,
    -((e.clientY - r.top) / r.height) * 2 + 1,
  );
  raycaster.setFromCamera(ndc, app.camera);
  const over = raycaster.intersectObject(NET.hidMesh, false).length || raycaster.intersectObject(NET.outMesh, false).length;
  app.dom.style.cursor = over ? 'pointer' : '';
});
/* 场值悬浮读数（第 1 / 6 章：悬停体素柱显示灰度值） */
const fieldTip = document.createElement('div');
fieldTip.className = 'field-tip';
fieldTip.style.display = 'none';
stage.appendChild(fieldTip);
app.dom.addEventListener('pointermove', (e) => {
  const sec = SECTIONS[chapterIdx];
  const on = sec && (sec.id === 'pixels' || sec.id === 'mistake') && !field.userData.paint.enabled;
  if (!on) { fieldTip.style.display = 'none'; return; }
  const cell = pickFieldCell(e);
  if (cell < 0) { fieldTip.style.display = 'none'; return; }
  const v = fieldHeights[cell];
  const sr = app.dom.getBoundingClientRect();
  fieldTip.style.display = '';
  fieldTip.style.left = (e.clientX - sr.left + 14) + 'px';
  fieldTip.style.top = (e.clientY - sr.top - 10) + 'px';
  fieldTip.textContent = `第 ${(cell / RES | 0) + 1} 行 · 第 ${cell % RES + 1} 列 → ${v.toFixed(2)}`;
});

let paintDrag = false;
app.dom.addEventListener('pointerdown', (e) => {
  if (!field.userData.paint.enabled) return;
  const cell = pickFieldCell(e);
  if (cell < 0) return;
  paintDrag = true;
  app.controls.enabled = false;
  paintCell(cell);
  e.preventDefault();
});
window.addEventListener('pointermove', (e) => {
  if (!field || !field.userData.paint.enabled) return;
  const cell = pickFieldCell(e);
  if (NEU.brushRing) {
    NEU.brushRing.visible = cell >= 0;
    if (cell >= 0) {
      const p = fieldCellPos(cell % RES, (cell / RES) | 0);
      NEU.brushRing.position.set(p.x, TRAY_TOP + fieldHeights[cell] * FIELD_H + 0.05, p.z);
    }
  }
  if (paintDrag && cell >= 0) paintCell(cell);
});
window.addEventListener('pointerup', () => {
  if (paintDrag) {
    paintDrag = false;
    app.controls.enabled = true;
    neuronSceneRefresh();
    refreshNeuronPanel();
    taskHooks.onPaint?.();
  }
});
const BRUSH = [
  { name: '正权重', val: 0.9 },
  { name: '负权重', val: -0.55 },
  { name: '擦除', val: 0 },
];
function paintCell(cell) {
  if (!neuronState.w) return;
  neuronState.w[cell] = BRUSH[neuronState.brush].val;
  neuronSceneRefresh();
}

/* ================= 识别 / 鲁棒性引擎 ================= */

let classifyEls = null;   // 当前章的结果展示件 { verdict, bars }
function classifyVector(vec, opts = {}) {
  const { o } = net.forward(vec);
  let best = 0;
  o.forEach((p, i) => { if (p > o[best]) best = i; });
  let second = -1, secondP = 0;
  o.forEach((p, i) => { if (i !== best && p > secondP) { second = i; secondP = p; } });
  if (classifyEls) {
    classifyEls.verdict.set(best, o[best], second, secondP);
    classifyEls.bars.set(o);
  }
  const conv = convMatch(vec);
  if (classifyEls && classifyEls.convBars) classifyEls.convBars.set(conv);
  if (classifyEls && classifyEls.cmp) drawCmpChart(classifyEls.cmp, o, conv);
  if (opts.pop) {
    classifyEls?.verdict.digitEl.classList.remove('pop');
    void classifyEls?.verdict.digitEl.offsetWidth;
    classifyEls?.verdict.digitEl.classList.add('pop');
  }
  return { best, prob: o[best], probs: o, conv };
}

/* 章 6：对源图施加旋转 / 平移 / 噪点后喂给两个模型 */
function renderRobustVec() {
  const R = state.robust;
  if (!R.srcCanvas) {
    R.srcCanvas = document.createElement('canvas');
    R.srcCanvas.width = R.srcCanvas.height = 96;
  }
  const SZ = 96;
  const cv = document.createElement('canvas');
  cv.width = SZ; cv.height = SZ;
  const c = cv.getContext('2d', { willReadFrequently: true });
  c.fillStyle = '#000'; c.fillRect(0, 0, SZ, SZ);
  /* 源图：画板内容 or 字体样本 */
  let src = R.srcCanvas;
  if (!R.fromBoard) {
    const t = src.getContext('2d');
    t.fillStyle = '#000'; t.fillRect(0, 0, SZ, SZ);
    t.save();
    t.translate(SZ / 2, SZ / 2);
    const cell = SZ / 8.6;
    t.fillStyle = '#fff';
    for (let r = 0; r < 7; r++) for (let col = 0; col < 5; col++) {
      if (FONT[R.srcDigit][r][col] === '1') {
        t.beginPath(); t.arc((col - 2) * cell, (r - 3) * cell, cell * 0.42, 0, TAU); t.fill();
      }
    }
    t.restore();
  }
  c.save();
  c.translate(SZ / 2, SZ / 2);
  c.rotate(R.rot * Math.PI / 180);
  c.translate(R.shift * 2.2, R.shift * 1.5);
  c.drawImage(src, -SZ / 2, -SZ / 2);
  c.restore();
  if (R.noise > 0) {
    const n = R.noise * 700;
    for (let i = 0; i < n; i++) {
      c.fillStyle = Math.random() > 0.5 ? '#fff' : '#333';
      c.fillRect(Math.random() * SZ, Math.random() * SZ, 3, 3);
    }
  }
  R.vec = sampleCanvas(cv);
  return R.vec;
}
function robustUseBoard(fromBoard) {
  state.robust.fromBoard = fromBoard;
  if (!fromBoard) state.robust.srcDigit = (Math.random() * 10) | 0;
}
function updateRobust() {
  const vec = renderRobustVec();
  updateField(vec);
  updateMistakeIndicators();
  const r = classifyVector(vec);
  if (classifyEls && classifyEls.hud) {
    classifyEls.hud.set('rot', state.robust.rot + '°');
    classifyEls.hud.set('shift', state.robust.shift.toFixed(1) + ' px');
    classifyEls.hud.set('noise', Math.round(state.robust.noise * 100) + '%');
    classifyEls.hud.set('best', `认成 ${r.best}（${Math.round(r.prob * 100)}%）`);
  }
}
/* 多层 vs 卷积思路 对照图（10 组双柱） */
function drawCmpChart(cv, mlp, conv) {
  const ctx = cv.getContext('2d');
  const W = cv.width, H = cv.height;
  ctx.fillStyle = '#0d1117';
  ctx.fillRect(0, 0, W, H);
  const gy = 12, gh = H - 30;
  const bw = (W - 46) / 10;
  for (let d = 0; d < 10; d++) {
    const x = 40 + d * bw;
    const h1 = clamp(mlp[d], 0, 1) * gh;
    const h2 = clamp(conv[d], 0, 1) * gh;
    ctx.fillStyle = '#e0976b';
    ctx.fillRect(x, gy + gh - h1, bw * 0.32, h1);
    ctx.fillStyle = '#5ecfdc';
    ctx.fillRect(x + bw * 0.4, gy + gh - h2, bw * 0.32, h2);
    ctx.fillStyle = 'rgba(200,215,225,0.75)';
    ctx.font = '600 10px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(String(d), x + bw * 0.36, H - 8);
  }
  ctx.textAlign = 'left';
  ctx.fillStyle = '#e0976b';
  ctx.fillText('■ 多层网络', 4, 10);
  ctx.fillStyle = '#5ecfdc';
  ctx.fillText('■ 卷积思路', 4, 24);
}

/* ================= 预处理演示（框笔迹 → 缩放 → 重心居中） ================= */

let preprocess = { on: false, t: 0, vec: null };
function startPreprocess() {
  if (!state.canvasVec.some((v) => v > 0.2)) {
    toast('先在手写板上写一个数字，再看预处理。', 'warn');
    return;
  }
  preprocess = { on: true, t: 0, vec: state.canvasVec.slice() };
  toast('预处理：框出笔迹 → 缩放到 13×13 → 按重心放正中。');
}
function tickPreprocess(dt) {
  if (!preprocess.on) return;
  preprocess.t += dt;
  const el = document.getElementById('preprocessCv');
  const cap = document.getElementById('preprocessCap');
  if (!el) { preprocess.on = false; return; }
  const stage2 = Math.min(3, Math.floor(preprocess.t / 0.8));
  const ctx = el.getContext('2d');
  const W = el.width, H = el.height;
  const st = vecStats(preprocess.vec);
  ctx.fillStyle = '#0d1117';
  ctx.fillRect(0, 0, W, H);
  const cs = W / RES;
  const drawGrid = (vec, alpha = 1) => {
    ctx.globalAlpha = alpha;
    for (let r = 0; r < RES; r++) {
      for (let c = 0; c < RES; c++) {
        const v = vec[r * RES + c];
        if (v > 0.06) {
          ctx.fillStyle = `rgb(${46 + v * 196},${52 + v * 186},${64 + v * 172})`;
          ctx.fillRect(c * cs, r * cs, cs - 0.6, cs - 0.6);
        }
      }
    }
    ctx.globalAlpha = 1;
  };
  drawGrid(preprocess.vec, stage2 >= 1 ? 0.35 : 1);
  if (stage2 >= 1 && st) {
    ctx.strokeStyle = '#f0a35e';
    ctx.lineWidth = 2;
    ctx.strokeRect(st.minX * cs - 2, st.minY * cs - 2, (st.maxX - st.minX + 1) * cs + 4, (st.maxY - st.minY + 1) * cs + 4);
  }
  if (stage2 >= 2 && st) {
    /* 缩放目标：长边压到 13 格 */
    const bw = st.maxX - st.minX + 1, bh = st.maxY - st.minY + 1;
    const sc = 13 / Math.max(bw, bh);
    const nw = bw * sc, nh = bh * sc;
    ctx.strokeStyle = '#5ecfdc';
    ctx.setLineDash([4, 3]);
    ctx.lineWidth = 1.6;
    ctx.strokeRect((RES - nw) / 2 * cs, (RES - nh) / 2 * cs, nw * cs, nh * cs);
    ctx.setLineDash([]);
  }
  if (stage2 >= 3 && st) {
    /* 重心居中箭头 */
    const tgt = 7.5;
    const dx = tgt - st.cx, dy = tgt - st.cy;
    if (Math.abs(dx) > 0.3 || Math.abs(dy) > 0.3) {
      ctx.strokeStyle = '#cbb8ee';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(st.cx * cs, st.cy * cs);
      ctx.lineTo((st.cx + dx) * cs, (st.cy + dy) * cs);
      ctx.stroke();
      ctx.fillStyle = '#cbb8ee';
      ctx.beginPath();
      ctx.arc((st.cx + dx) * cs, (st.cy + dy) * cs, 3, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = '#cbb8ee';
    ctx.font = '600 11px ui-monospace, monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`重心 (${st.cx.toFixed(1)}, ${st.cy.toFixed(1)}) → (7.5, 7.5)`, 6, 14);
  }
  const caps = ['① 原始输入 16×16', '② 框出笔迹', '③ 等比缩放到 13×13 以内', '④ 按重心放到正中间'];
  if (cap) cap.textContent = caps[stage2];
  if (preprocess.t > 3.6) {
    preprocess.on = false;
    taskHooks.onPreprocess?.();
  }
}

/* ================= 章节定义 ================= */

const CAM_DEFAULTS = {
  pixels: [[0.5, 2.1, 4.2], [FIELD_X, 0.72, 0]],
  neuron: [[1.7, 2.7, 6.3], [FIELD_X, 1.32, 0]],
  network: [[0.3, 2.6, 9.7], [-0.65, 1.55, 0]],
  train: [[0.3, 2.6, 9.7], [-0.65, 1.55, 0]],
  conv: [[-0.15, 3.15, 9.8], [-0.25, 0.8, 0]],
  mistake: [[0.55, 2.5, 4.8], [FIELD_X, 0.82, 0]],
};
function camTo(id) {
  const [p, t] = CAM_DEFAULTS[id] || CAM_DEFAULTS.pixels;
  app.setCamera(p, t);
}

/* —— 第 1 章 图像就是数字 —— */
let pxPanel = null;
const secPixels = {
  id: 'pixels', title: '图像就是数字',
  html: `<p>计算机眼里的手写数字不是「形状」，而是一张<b>灰度值表格</b>。画板内容会被缩成 <b>16 × 16 = 256 个小格子</b>，每格一个 0~1 的数：0 是黑，1 是白。中间的体素场<b>越高就越亮</b>。</p>
<p>所以在计算机眼里，你写的字只是 <b>256 个数</b>——后面所有的「识别」，都是对这 256 个数做加减乘除。</p>
<p>动笔之前还有一步<b>预处理</b>：先框出笔迹，等比缩小，再按「重心」放到正中间——写得大小、位置不同也不要紧。点下方按钮看这四步动画。</p>
<div class="fnote">样本说明：本页训练样本由程序按点阵字体加随机抖动生成，不依赖外部数据集。</div>`,
  enter() {
    useScene('pixels', (g) => { g.userData.built = true; });
    camTo('pixels');
    fieldMode = 'ink';
    field.userData.paint.enabled = false;
    updateField(state.canvasVec);
    chapterTick = tickPixels;
    boardHook = () => { updateField(state.canvasVec); drawPixelPanel(); };
    buildPixelsPanel();
    updateField(state.canvasVec);
  },
};
function buildPixelsPanel() {
  clearData();
  pxPanel = {};
  const cvBlk = elCanvasBlock('数字视角：像素灰度值', 288, 288, '16×16');
  pxPanel.cvBlk = cvBlk;
  lcData.appendChild(cvBlk.el);
  const pre = elCanvasBlock('预处理四步', 288, 288);
  pre.el.querySelector('canvas').id = 'preprocessCv';
  const note = document.createElement('div');
  note.className = 'db-note';
  note.id = 'preprocessCap';
  note.textContent = '点左侧「看一遍预处理」开始四步动画';
  pre.el.appendChild(note);
  pre.el.style.display = 'none';
  lcData.appendChild(pre.el);
  pxPanel.preEl = pre.el;
  const hud = elHud([['lit', '有笔迹的像素'], ['res', '当前显示分辨率'], ['dim', '模型输入']]);
  lcData.appendChild(hud.el);
  pxPanel.hud = hud;
  drawPixelPanel();
}
function drawPixelPanel() {
  if (!pxPanel) return;
  const R = state.viewRes;
  pxPanel.cvBlk.badgeEl.textContent = R + '×' + R;
  const tmp = document.createElement('canvas');
  tmp.width = 240; tmp.height = 240;
  tmp.getContext('2d').drawImage(board, 0, 0);
  const small = document.createElement('canvas');
  small.width = R; small.height = R;
  const sc = small.getContext('2d', { willReadFrequently: true });
  sc.drawImage(tmp, 0, 0, R, R);
  const sd = sc.getImageData(0, 0, R, R).data;
  const smallVec = new Float32Array(R * R);
  for (let i = 0; i < R * R; i++) smallVec[i] = sd[i * 4] / 255;
  drawPixelGrid(pxPanel.cvBlk.cv.getContext('2d'), 288, 288, smallVec, R, state.showValues);
  const st = vecStats(state.canvasVec);
  pxPanel.hud.set('lit', st ? st.lit + ' / 256' : '0 / 256');
  pxPanel.hud.set('res', R + ' × ' + R);
  pxPanel.hud.set('dim', '256 维（固定）');
}
function tickPixels(dt) {
  drawPixelPanel();
  tickPreprocess(dt);
}
function pixelsCtl() {
  ctl.clear();
  ctl.seg({
    options: [{ label: '7×7', value: 7 }, { label: '16×16', value: 16 }, { label: '24×24', value: 24 }],
    value: state.viewRes,
    onChange: (v) => {
      state.viewRes = v;
      drawPixelPanel();
      if (v < RES) {
        /* 低分辨率重采样后再识别：看还认不认得出 */
        const low = resampleVec(state.canvasVec, v);
        const r = classifyVector(low);
        toast(`${v}×${v} 采样后网络认成 ${r.best}（${Math.round(r.prob * 100)}%）——像素太少，笔画细节先丢了。`);
        taskHooks.onLowRes?.();
      }
    },
  });
  ctl.toggle({
    label: '显示数值', value: state.showValues,
    onChange: (v) => { state.showValues = v; drawPixelPanel(); },
  });
  ctl.sep();
  ctl.button({ label: '看一遍预处理', onClick: () => { pxPanel.preEl.style.display = ''; startPreprocess(); } });
  ctl.button({ label: '示例：5', onClick: () => demoDigit(5) });
  ctl.button({ label: '示例：3', onClick: () => demoDigit(3) });
  ctl.button({ label: '清空画板', onClick: () => clearBoard() });
}

/* —— 第 2 章 一个神经元 —— */
let neuronPanel = null;
const secNeuron = {
  id: 'neuron', title: '一个神经元',
  html: `<p>一个<b>神经元</b>只做一件事：把 256 个像素各乘上一个<b>权重</b>再全部加起来，加上<b>偏置</b> b 得到 z；再经过<b>激活函数</b>变成输出 a。<span class="hl">a = f(Σw·x + b)</span></p>
<p>看体素场：<b>高度是试样本的像素</b>，<b>颜色是权重</b>——青绿是正权重（这里有笔画就加分），橙是负权重（有笔画就扣分）。亮束从像素连向神经元，越亮贡献越大。</p>
<p>选中「画笔」后直接在场上的方块上<b>拖动画权重</b>（再点一次画笔回到旋转视角）。试着设计一个只认「1」的神经元：中间画一条青绿竖线，两侧补橙，再用「试一个 1」「试一个 0」检验。</p>`,
  enter() {
    useScene('neuron', buildNeuronScene);
    camTo('neuron');
    field.userData.paint.enabled = false;
    if (!neuronState.testVec) neuronState.testVec = renderDigit(1, null);
    neuronSceneRefresh();
    chapterTick = tickNeuron;
    boardHook = null;
    buildNeuronPanel();
    boardPanel.style.display = 'none';
  },
};
function buildNeuronPanel() {
  clearData();
  neuronPanel = {};
  const wm = elCanvasBlock('它的 256 个权重', 288, 288);
  lcData.appendChild(wm.el);
  neuronPanel.wm = wm;
  const hud = elHud([['sum', '加权和 Σwx'], ['b', '偏置 b'], ['act', '激活函数'], ['a', '输出 a'], ['judge', '结论']]);
  lcData.appendChild(hud.el);
  neuronPanel.hud = hud;
  refreshNeuronPanel();
}
function refreshNeuronPanel() {
  if (!neuronPanel) return;
  const a = neuronForward();
  if (neuronPanel.wm) {
    const tex = weightMapTexture(neuronState.w || new Float32Array(RES * RES), 288);
    const ctx = neuronPanel.wm.cv.getContext('2d');
    ctx.clearRect(0, 0, 288, 288);
    ctx.drawImage(tex.image, 0, 0);
    tex.dispose();
  }
  if (neuronPanel.hud) {
    neuronPanel.hud.set('sum', neuronState.zSum.toFixed(2));
    neuronPanel.hud.set('b', neuronState.b.toFixed(2));
    neuronPanel.hud.set('act', ACTS[neuronState.act].name);
    neuronPanel.hud.set('a', a.toFixed(3));
    neuronPanel.hud.set('judge', a > 0.5 ? '点亮（像它要找的笔画）' : '熄灭（不像）');
  }
  if (a > 0.5 && neuronState.lastTest === 1) taskHooks.onLit?.();
  if (a < 0.5 && neuronState.lastTest === 0) taskHooks.onDark?.();
}
function tickNeuron(dt) {
  /* 神经元核呼吸辉光 + 贡献束流动 */
  if (scenes.neuron && scenes.neuron.visible) {
    const t = performance.now() / 1000;
    MX.nucleus.emissiveIntensity = 0.4 + clamp(neuronState.a, 0, 1.4) * 1.5 + Math.sin(t * 2.2) * 0.08;
    if (NEU.beams) NEU.beams.material.opacity = 0.72 + Math.sin(t * 3.1) * 0.18;
    if (NEU.dendrites) NEU.dendrites.rotation.y = Math.sin(t * 0.4) * 0.06;
  }
}
function neuronCtl() {
  ctl.clear();
  ctl.button({
    label: neuronState.brush >= 0 && field.userData.paint.enabled ? '🖌 画笔中（点我回旋转）' : '🖌 画笔：在场地上画权重',
    onClick(e) {
      field.userData.paint.enabled = !field.userData.paint.enabled;
      e.textContent = field.userData.paint.enabled ? '🖌 画笔中（点我回旋转）' : '🖌 画笔：在场地上画权重';
      toast(field.userData.paint.enabled
        ? '画笔已选：按住鼠标在方块上拖动涂权重（可切正/负/擦）。'
        : '已回到旋转视角。');
    },
  });
  ctl.seg({
    options: BRUSH.map((b, i) => ({ label: b.name, value: i })),
    value: neuronState.brush,
    onChange: (v) => { neuronState.brush = v; },
  });
  ctl.sep();
  ctl.button({ label: '竖线探测器', onClick: () => { resetNeuronWeights(); neuronSceneRefresh(); refreshNeuronPanel(); taskHooks.onPreset?.(); } });
  ctl.button({ label: '清空权重', onClick: () => { resetNeuronWeights('zero'); neuronSceneRefresh(); refreshNeuronPanel(); } });
  ctl.button({ label: '恢复原样', onClick: () => { resetNeuronWeights(); neuronSceneRefresh(); refreshNeuronPanel(); } });
  ctl.sep();
  UIREF.test1 = ctl.button({
    label: '试一个 1',
    onClick: () => {
      neuronState.testVec = renderDigit(1, null);
      neuronState.lastTest = 1;
      neuronSceneRefresh();
      refreshNeuronPanel();
      taskHooks.onTest1?.();
    },
  });
  UIREF.test0 = ctl.button({
    label: '试一个 0',
    onClick: () => {
      neuronState.testVec = renderDigit(0, null);
      neuronState.lastTest = 0;
      neuronSceneRefresh();
      refreshNeuronPanel();
      taskHooks.onTest0?.();
    },
  });
  ctl.sep();
  ctl.slider({
    label: '偏置 b', min: -4, max: 4, step: 0.1, value: neuronState.b,
    fmt: (v) => v.toFixed(1),
    onInput: (v) => { neuronState.b = v; neuronForward(); refreshNeuronPanel(); },
  });
  ctl.seg({
    options: Object.keys(ACTS).map((k) => ({ label: ACTS[k].name, value: k })),
    value: neuronState.act,
    onChange: (v) => { neuronState.act = v; neuronForward(); refreshNeuronPanel(); },
  });
}

/* —— 第 3 章 多层网络 —— */
const secNetwork = {
  id: 'network', title: '多层网络',
  html: `<p>把许多神经元<b>分层</b>串起来：输入层（256 个像素）→ 隐藏层（48 个神经元）→ 输出层（10 个数字各自的把握）。输出经 softmax 变成概率，最高的就是答案。</p>
<p>信号从左往右逐层流过去。连线只画贡献最大的那些：<b>青绿是支持</b>，<b>橙是反对</b>。</p>
<p><b>点隐藏层的任意一个方块</b>，它头顶会浮出它的 256 个权重拼成的图——那就是它在找的笔画形状。这些权重不是人设计的，是下一章训练时它自己学出来的。</p>`,
  enter() {
    useScene('network', buildNetworkScene);
    camTo('network');
    field.visible = false;
    field.userData.paint.enabled = false;
    boardHook = () => {
      updateMiniInput(state.canvasVec);
      clearTimeout(boardHook.timer);
      boardHook.timer = setTimeout(() => startPulse(state.canvasVec), 350);
      setTimeout(() => classifyVector(state.canvasVec), 900);
      taskHooks.onWritePulse?.();
    };
    chapterTick = tickNetwork;
    updateMiniInput(state.canvasVec);
    buildConnections();
    buildNetworkPanel();
    classifyVector(state.canvasVec);
    boardPanel.style.display = '';
  },
};
function buildNetworkPanel() {
  clearData();
  classifyEls = {};
  const v = elVerdict();
  lcData.appendChild(v.el);
  classifyEls.verdict = v;
  const b = elBars();
  lcData.appendChild(b.el);
  classifyEls.bars = b;
  const hw = elCanvasBlock('点选神经元的权重图', 288, 288);
  hw.el.style.display = 'none';
  hw.el.querySelector('canvas').id = 'hiddenWeight';
  const capNote = document.createElement('div');
  capNote.className = 'db-note';
  const cap = document.createElement('div');
  cap.id = 'hiddenWeightCap';
  cap.textContent = '隐藏层 · 第 ? 个神经元的权重图';
  const note = document.createElement('div');
  note.id = 'hiddenWeightNote';
  capNote.appendChild(cap);
  capNote.appendChild(note);
  hw.el.appendChild(capNote);
  lcData.appendChild(hw.el);
  classifyEls.hiddenBlock = hw.el;
}
function tickNetwork(dt) {
  tickPulse(dt);
  /* 呼吸微光让机架有"通电感" */
  if (NET.hidMesh && !pulse.on) {
    const t = performance.now() / 1000;
    const breathe = 0.5 + Math.sin(t * 1.6) * 0.12;
    NET.tubes.forEach((tb, i) => {
      tb.children[0].material.emissiveIntensity = 0.25 + breathe * 0.3;
    });
  }
}
function networkCtl() {
  ctl.clear();
  ctl.button({ label: '▶ 前向传播', onClick: () => startPulse(state.canvasVec) });
  ctl.button({ label: '↻ 重放信号', onClick: () => startPulse(state.canvasVec) });
  ctl.sep();
  UIREF.active = ctl.button({
    label: '看最活跃的神经元',
    onClick: () => {
      if (!state.canvasVec.some((v) => v > 0.2)) { toast('先在手写板上写个数字。', 'warn'); return; }
      const { h } = net.forward(state.canvasVec);
      let bj = 0;
      h.forEach((v, j) => { if (Math.abs(v) > Math.abs(h[bj])) bj = j; });
      showHiddenWeight(bj);
      if (classifyEls && classifyEls.hiddenBlock) classifyEls.hiddenBlock.style.display = '';
      toast(`当前输入下最活跃的是第 ${bj + 1} 个神经元。`);
      taskHooks.onActive?.();
    },
  });
  ctl.toggle({
    label: '显示输入连线', value: true,
    onChange: (v) => { NET.connIH.visible = v; },
  });
  ctl.sep();
  ctl.button({ label: '示例：7', onClick: () => demoDigit(7) });
  ctl.button({ label: '清空画板', onClick: () => clearBoard() });
}

/* —— 第 4 章 现场训练 —— */
let trainPanel = null;
const secTrain = {
  id: 'train', title: '现场训练',
  html: `<p>这一次，把网络的权重<b>全部重置为随机数</b>：它什么也不会。点「开始训练」，它一张张地看 <b>3000 个带答案的手写样本</b>：先猜，再用<b>损失</b>衡量猜得多错，把每个权重朝「让损失变小」的方向挪一小步——这就是<b>梯度下降</b>。</p>
<p>看第一层的 <b>48 张权重图</b>：一开始是雪花噪点，训练中慢慢长出笔画的形状。右边的曲线里，损失在下降，准确率在爬升。</p>
<p><b>学习率</b>决定每步挪多远：太小学得慢，太大会在谷底两边来回跳，甚至越学越糟——试试把学习率拉满，看它发散（权重会自动退回上一次正常的状态）。训练暂停后，用手写板考考它。</p>
<div class="fnote">数据说明：训练样本由程序生成（每类 300 张 · 共 3000 张）；测试集是抖动更强的 120 张难例。</div>`,
  enter() {
    useScene('train', buildNetworkScene);
    camTo('train');
    field.visible = false;
    field.userData.paint.enabled = false;
    boardHook = () => {
      updateMiniInput(state.canvasVec);
      setTimeout(() => { classifyVector(state.canvasVec); startPulse(state.canvasVec); }, 200);
    };
    chapterTick = tickTrain;
    buildConnections();
    updateMiniInput(state.canvasVec);
    buildTrainPanel();
    trainPanel.chart.timer = 0;
    boardPanel.style.display = '';
  },
};
function buildTrainPanel() {
  clearData();
  classifyEls = null;
  trainPanel = {};
  const chart = elCanvasBlock('损失与准确率', 288, 170);
  chart.el.querySelector('canvas').id = 'trainChart';
  lcData.appendChild(chart.el);
  trainPanel.chart = chart;
  const hud = elHud([['epoch', '轮次'], ['seen', '已看样本'], ['rate', '样本速度'], ['tr', '训练准确率'], ['te', '测试准确率'], ['params', '参数量']]);
  lcData.appendChild(hud.el);
  trainPanel.hud = hud;
  refreshTrainHud();
  const gBlk = elBlock('第一层 · 48 张权重图', '点图看大图');
  const gal = document.createElement('div');
  gal.className = 'wgallery';
  for (let j = 0; j < 48; j++) {
    const cv = document.createElement('canvas');
    cv.width = 52; cv.height = 52;
    cv.title = `第 ${j + 1} 个神经元`;
    cv.addEventListener('click', () => {
      showHiddenWeight(j);
      toast(`第 ${j + 1} 个神经元的权重图——它在找这样的笔画。`);
      taskHooks.onGallery?.();
    });
    gal.appendChild(cv);
  }
  gBlk.el.appendChild(gal);
  lcData.appendChild(gBlk.el);
  trainPanel.gallery = gal;
  refreshWeightGallery(gal);
  const note = document.createElement('div');
  note.className = 'db-note';
  note.textContent = '训练中每轮刷新：噪点慢慢长出笔画。';
  gBlk.el.appendChild(note);
}
function refreshTrainHud() {
  if (!trainPanel) return;
  trainPanel.hud.set('epoch', String(state.epoch));
  trainPanel.hud.set('seen', String(state.seen));
  trainPanel.hud.set('rate', state.speed + ' 张/帧');
  trainPanel.hud.set('params', String(net.paramCount));
  drawTrainChart(trainPanel.chart.cv);
}
function tickTrain(dt) {
  tickPulse(dt);
  /* 训练流：每帧喂 speed 张样本 */
  if (state.training && DATASET.built) {
    if (!state.trainOrder.length || state.trainCursor >= state.trainOrder.length) {
      /* 新一轮：洗牌 */
      state.trainOrder = Array.from({ length: DATASET.X.length }, (_, i) => i);
      for (let i = state.trainOrder.length - 1; i > 0; i--) {
        const j = (Math.random() * (i + 1)) | 0;
        [state.trainOrder[i], state.trainOrder[j]] = [state.trainOrder[j], state.trainOrder[i]];
      }
      state.trainCursor = 0;
      state.epoch++;
      /* 每轮评估 */
      const trSet = state.trainOrder.slice(0, 300);
      const trX = trSet.map((i) => DATASET.X[i]);
      const trY = trSet.map((i) => DATASET.Y[i]);
      const tr = net.accuracy(trX, trY);
      const te = net.accuracy(DATASET.Xt, DATASET.Yt);
      state.accTrainHist.push(tr);
      state.accTestHist.push(te);
      refreshWeightGallery(trainPanel?.gallery);
      if (state.lossHist.length) {
        const last = state.lossHist[state.lossHist.length - 1];
        if (last < state.bestLoss - 0.005) {
          state.bestLoss = last;
          state.plateau = 0;
          net.snapshot();
        } else {
          state.plateau++;
          if (last > state.bestLoss * 2.2 + 0.35 && net.restore()) {
            toast(`发散了！学习率太大，损失越来越大——权重已退回上一次正常的状态。把学习率调小再继续。`, 'warn');
            taskHooks.onDiverge?.();
            state.plateau = 0;
          }
        }
      }
      /* 自动停止三条件 */
      if (state.epoch >= 30 && state.training) {
        stopTraining(`已经训练了 ${state.epoch} 轮，自动停止。在手写板上写个数字考考它。`);
      } else if (state.plateau >= 6 && state.training) {
        stopTraining('准确率已经不再提高，自动停止。在手写板上写个数字考考它。');
      } else if (state.accTrainHist.length && state.accTrainHist[state.accTrainHist.length - 1] >= 0.97 && state.training) {
        stopTraining(`训练准确率达到 ${Math.round(state.accTrainHist[state.accTrainHist.length - 1] * 100)}%，自动停止。在手写板上写个数字考考它。`);
      }
      if (trainPanel?.hud) {
        trainPanel.hud.set('tr', Math.round(tr * 100) + '%');
        trainPanel.hud.set('te', Math.round(te * 100) + '%');
        if (te >= 0.9) taskHooks.onAcc90?.();
      }
      if (terminal) terminal.set('EPOCH ' + state.epoch, Math.round((te || 0) * 100) + '%');
      buildConnections();
    }
    const batch = state.trainOrder.slice(state.trainCursor, state.trainCursor + state.speed);
    const loss = net.trainSamples(batch, DATASET.X, DATASET.Y, state.lr);
    state.seen += batch.length;
    state.trainCursor += batch.length;
    if (batch.length) {
      state._ppsN += batch.length;
      /* 平滑损失：每 8 帧推一个点 */
      trainPanel.chart.timer = (trainPanel.chart.timer || 0) + dt;
      if (trainPanel.chart.timer > 0.25) {
        trainPanel.chart.timer = 0;
        state.lossHist.push(loss);
        if (state.lossHist.length > 80) state.lossHist.shift();
        if (terminal) terminal.push(loss);
        drawTrainChart(trainPanel.chart.cv);
      }
    }
    if (trainPanel?.hud) trainPanel.hud.set('seen', String(state.seen));
  }
  /* 样本速度统计 */
  state._ppsT += dt;
  if (state._ppsT > 1) {
    state.pulsesPerSec = Math.round(state._ppsN / state._ppsT);
    state._ppsT = 0; state._ppsN = 0;
  }
}
function stopTraining(msg) {
  state.training = false;
  const btn = document.getElementById('trainToggleBtn');
  if (btn) btn.textContent = '▶ 继续训练';
  toast(msg);
}
function trainCtl() {
  ctl.clear();
  const toggleBtn = ctl.button({
    label: state.training ? '⏸ 暂停训练' : '▶ 开始训练',
    onClick(e) {
      if (!DATASET.built) { toast('样本还在生成，马上就好…', 'warn'); return; }
      state.training = !state.training;
      e.textContent = state.training ? '⏸ 暂停训练' : '▶ 继续训练';
      e.id = 'trainToggleBtn';
      if (state.training) toast('训练中：看权重图从噪点长出笔画。');
    },
  });
  toggleBtn.id = 'trainToggleBtn';
  UIREF.toggleTrain = toggleBtn;
  UIREF.resetWeights = ctl.button({
    label: '重置为随机权重',
    onClick: () => {
      state.training = false;
      net.reset();
      state.epoch = 0; state.seen = 0;
      state.lossHist = []; state.accTrainHist = []; state.accTestHist = [];
      state.bestLoss = Infinity; state.plateau = 0;
      state.trainOrder = []; state.trainCursor = 0;
      if (terminal) { terminal.reset(); terminal.set('RANDOM W', '--'); }
      buildConnections();
      refreshWeightGallery(trainPanel?.gallery);
      drawTrainChart(trainPanel.chart.cv);
      refreshTrainHud();
      const btn = document.getElementById('trainToggleBtn');
      if (btn) btn.textContent = '▶ 开始训练';
      toast('权重已全部重置为随机数。点「开始训练」看它学认数字。');
      taskHooks.onReset?.();
    },
  });
  ctl.sep();
  UIREF.lrSlider = ctl.slider({
    label: '学习率', min: 0.05, max: 3, step: 0.05, value: state.lr,
    fmt: (v) => v.toFixed(2),
    onInput: (v) => { state.lr = v; },
  });
  UIREF.lrMax = ctl.button({
    label: '试试学习率拉满',
    onClick: () => {
      state.lr = 3;
      UIREF.lrSlider.set(3);
      if (!state.training) { state.training = true; const btn = document.getElementById('trainToggleBtn'); if (btn) btn.textContent = '⏸ 暂停训练'; }
      toast('学习率已拉满——看损失曲线会不会发散。');
      taskHooks.onLrMax?.();
    },
  });
  ctl.slider({
    label: '训练速度', min: 4, max: 96, step: 4, value: state.speed,
    fmt: (v) => v + ' 张/帧',
    onInput: (v) => { state.speed = v; },
  });
  ctl.sep();
  ctl.button({ label: '示例：1', onClick: () => demoDigit(1) });
  ctl.button({ label: '清空画板', onClick: () => clearBoard() });
}

/* —— 第 5 章 卷积网络 —— */
let convPanel = null;
const secConv = {
  id: 'conv', title: '卷积网络',
  html: `<p>普通网络把 256 个像素<b>摊平</b>，数字挪一下位置就不认识了。<b>卷积</b>换个思路：用一个 <b>5 × 5 的小窗口（卷积核）</b>在图上逐格滑动，每到一处都问「这里有没有我要找的笔画」，结果排成一张<b>特征图</b>。</p>
<p>第一层有 <b>6 个卷积核</b>，找竖边、横边、斜线这样的简单笔画；<b>池化</b>把每 2 × 2 取最大值，图变小但特征保留；第二层 <b>12 个组合核</b>（每个 6 片）把简单笔画组合成拐角、圆弧。</p>
<p>看中间的扫描动画，再<b>点右栏任意一张特征图</b>看它的卷积核。全图共享同一组核，参数量骤减，数字写在哪儿都能被检测到。</p>`,
  enter() {
    useScene('conv', buildConvScene);
    camTo('conv');
    field.userData.paint.enabled = false;
    updateField(state.canvasVec);
    state.conv.px = 0; state.conv.py = 0;
    state.conv.front = convFrontend(state.canvasVec);
    refreshConvTiles();
    refreshConvFeats(state.conv.front.maps[state.conv.kernelIdx], 0, 0);
    chapterTick = tickConv;
    boardHook = () => {
      updateField(state.canvasVec);
      state.conv.front = convFrontend(state.canvasVec);
      state.conv.px = 0; state.conv.py = 0;
      refreshConvTiles();
      taskHooks.onWriteConv?.();
    };
    buildConvPanel();
    boardPanel.style.display = '';
  },
};
function buildConvPanel() {
  clearData();
  classifyEls = null;
  convPanel = {};
  /* 输入 / 核 / 输出三联 */
  const trio = elBlock('卷积 1 · 扫描动画', '点核区换核');
  const row = document.createElement('div');
  row.className = 'conv-row';
  const mkCell = (cap, cls = '') => {
    const cell = document.createElement('div');
    cell.className = 'conv-cell ' + cls;
    const cv = document.createElement('canvas');
    cell.appendChild(cv);
    const cp = document.createElement('div');
    cp.className = 'cc-cap';
    cp.textContent = cap;
    cell.appendChild(cp);
    return { cell, cv, cap: cp };
  };
  const cin = mkCell('输入 16×16');
  const ck = mkCell('卷积核 5×5');
  const cout = mkCell('输出 12×12');
  row.appendChild(cin.cell); row.appendChild(ck.cell); row.appendChild(cout.cell);
  ck.cell.classList.add('clickable');
  ck.cv.addEventListener('click', () => selectConvKernel((state.conv.kernelIdx + 1) % K5.length));
  trio.el.appendChild(row);
  lcData.appendChild(trio.el);
  convPanel.trio = { cin, ck, cout };
  /* 6 张特征图（可点选换核） */
  const f6 = elBlock('六张特征图 · 亮了就是找到了', '点击看卷积核');
  const fmapGrid = document.createElement('div');
  fmapGrid.className = 'fmaps f6';
  convPanel.fmaps = [];
  K5.forEach((K, i) => {
    const cv = document.createElement('canvas');
    cv.width = 44; cv.height = 44;
    cv.title = K.name;
    cv.addEventListener('click', () => selectConvKernel(i));
    fmapGrid.appendChild(cv);
    convPanel.fmaps.push(cv);
  });
  f6.el.appendChild(fmapGrid);
  lcData.appendChild(f6.el);
  /* 核查看器 */
  const kView = elCanvasBlock('卷积核', 288, 150, '');
  kView.el.querySelector('canvas').id = 'convKernelCv';
  const kNote = document.createElement('div');
  kNote.className = 'db-note';
  kNote.id = 'convKernelNote';
  kView.el.appendChild(kNote);
  lcData.appendChild(kView.el);
  convPanel.kView = kView;
  /* 池化 1 */
  const p6 = elBlock('池化 1 · 每 2×2 只留最大', '12×12 → 6×6');
  const poolGrid = document.createElement('div');
  poolGrid.className = 'fmaps f6';
  convPanel.pmaps = [];
  K5.forEach((K, i) => {
    const cv = document.createElement('canvas');
    cv.width = 44; cv.height = 44;
    poolGrid.appendChild(cv);
    convPanel.pmaps.push(cv);
  });
  p6.el.appendChild(poolGrid);
  const poolNote = document.createElement('div');
  poolNote.className = 'db-note';
  poolNote.textContent = '图缩小一半，但「这附近有没有这种笔画」保留了下来——这也是它对平移更宽容的原因。';
  p6.el.appendChild(poolNote);
  lcData.appendChild(p6.el);
  /* 卷积 2（12 张组合核输出，可点看 6 片） */
  const f12 = elBlock('卷积 2 · 组合笔画', '12 核 × 6 片');
  const grid12 = document.createElement('div');
  grid12.className = 'fmaps f12';
  convPanel.l2maps = [];
  K2SET.forEach((K, i) => {
    const cv = document.createElement('canvas');
    cv.width = 32; cv.height = 32;
    cv.title = K.name;
    cv.addEventListener('click', () => showL2Kernel(i));
    grid12.appendChild(cv);
    convPanel.l2maps.push(cv);
  });
  f12.el.appendChild(grid12);
  const l2note = document.createElement('div');
  l2note.className = 'db-note';
  l2note.textContent = '第二层每个核有 6 片，分别作用在池化后的 6 张图上再相加——它找的是拐角、圆弧这类组合笔画。';
  f12.el.appendChild(l2note);
  lcData.appendChild(f12.el);
  convPanel.l2note = l2note;
  refreshConvPanel();
  showKernelView(state.conv.kernelIdx, false);
}
function drawSmallMap(cv, map, side, pos = true) {
  const ctx = cv.getContext('2d');
  const px = cv.width;
  const cell = px / side;
  ctx.fillStyle = '#0d1117';
  ctx.fillRect(0, 0, px, px);
  for (let i = 0; i < side * side; i++) {
    const v = map[i];
    if (pos) {
      const a = Math.min(Math.abs(v), 1);
      if (a < 0.05) continue;
      ctx.fillStyle = v >= 0
        ? `rgba(96,205,180,${0.12 + a * 0.8})`
        : `rgba(233,132,86,${0.12 + a * 0.8})`;
    } else {
      const g = Math.round(clamp((v + 1) / 2, 0, 1) * 235);
      ctx.fillStyle = `rgb(${g},${g},${g})`;
    }
    ctx.fillRect((i % side) * cell, ((i / side) | 0) * cell, cell - 0.5, cell - 0.5);
  }
}
function refreshConvPanel() {
  if (!convPanel) return;
  const F = state.conv.front;
  if (!F) return;
  /* 输入小图 + 扫描框 */
  const cinCtx = convPanel.trio.cin.cv.getContext('2d');
  drawPixelGrid(cinCtx, convPanel.trio.cin.cv.width, convPanel.trio.cin.cv.height, state.canvasVec, RES, false);
  const cs = convPanel.trio.cin.cv.width / RES;
  cinCtx.strokeStyle = '#f0a35e';
  cinCtx.lineWidth = 2;
  cinCtx.strokeRect(Math.floor(state.conv.px) * cs - 1.5, state.conv.py * cs - 1.5, cs * 5 + 3, cs * 5 + 3);
  /* 输出当前核响应进度 */
  const map = F.maps[state.conv.kernelIdx];
  const side = 12;
  const ctx = convPanel.trio.cout.cv.getContext('2d');
  const px = convPanel.trio.cout.cv.width;
  const cell = px / side;
  ctx.fillStyle = '#0d1117';
  ctx.fillRect(0, 0, px, px);
  for (let r = 0; r < side; r++) {
    for (let c = 0; c < side; c++) {
      const done = r < state.conv.py || (r === state.conv.py && c < state.conv.px);
      if (!done) continue;
      const v = map[r * side + c];
      const a = Math.min(Math.abs(v), 1);
      if (a < 0.05) continue;
      ctx.fillStyle = v >= 0 ? `rgba(96,205,180,${0.12 + a * 0.8})` : `rgba(233,132,86,${0.12 + a * 0.8})`;
      ctx.fillRect(c * cell, r * cell, cell - 0.5, cell - 0.5);
    }
  }
  /* 6 特征图 + 6 池化 + 12 二层 */
  F.maps.forEach((m, i) => drawSmallMap(convPanel.fmaps[i], m, 12));
  F.pooled.forEach((m, i) => drawSmallMap(convPanel.pmaps[i], m, 6));
  const l2 = convL2(F.pooled);
  l2.forEach((m, i) => drawSmallMap(convPanel.l2maps[i], m, 4));
  convPanel.curL2 = l2;
}
function selectConvKernel(i) {
  state.conv.kernelIdx = i;
  state.conv.px = 0; state.conv.py = 0;
  refreshConvTiles();
  showKernelView(i, false);
  convPanel.fmaps.forEach((cv, k) => cv.classList.toggle('picked', k === i));
}
/* 核查看器：L1 显示 5×5 大核；withL2=true 时显示某二层核的 6 片 3×3 */
function showKernelView(i, isL2, l2Idx = 0) {
  const cv = document.getElementById('convKernelCv');
  const note = document.getElementById('convKernelNote');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const W = cv.width, H = cv.height;
  ctx.fillStyle = '#0d1117';
  ctx.fillRect(0, 0, W, H);
  const drawK = (k, side, x0, y0, size, labelTxt) => {
    const cell = size / side;
    let mx = 1e-6;
    for (const v of k) mx = Math.max(mx, Math.abs(v));
    ctx.font = '600 10px ui-monospace, monospace';
    ctx.textAlign = 'center';
    for (let r = 0; r < side; r++) {
      for (let c = 0; c < side; c++) {
        const v = k[r * side + c];
        const t = Math.abs(v) / mx;
        ctx.fillStyle = v >= 0 ? `rgba(96,205,180,${0.14 + t * 0.8})` : `rgba(233,132,86,${0.14 + t * 0.8})`;
        ctx.fillRect(x0 + c * cell, y0 + r * cell, cell - 1, cell - 1);
        if (cell > 24 && Math.abs(v) > 0.01) {
          ctx.fillStyle = '#e8eef4';
          ctx.fillText(String(Math.round(v * 10) / 10), x0 + c * cell + cell / 2, y0 + r * cell + cell / 2 + 3);
        }
      }
    }
    if (labelTxt) {
      ctx.fillStyle = '#9fb4c0';
      ctx.fillText(labelTxt, x0 + size / 2, y0 + size + 12);
    }
  };
  if (!isL2) {
    drawK(K5[i].k, 5, W / 2 - 66, 8, 132, K5[i].name);
    if (note) note.textContent = '这个 5×5 窗口在整张图上滑动：笔画和它的青绿部分越吻合，特征图上对应的格子就越亮。窗口里的数字就是权重。';
  } else {
    const K = K2SET[l2Idx];
    K.slices.forEach((sl, s) => {
      const x0 = 10 + (s % 6) * 46;
      drawK(sl.k, 3, x0, 8, 40, null);
      ctx.fillStyle = '#9fb4c0';
      ctx.font = '600 10px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('×' + sl.w.toFixed(2), x0 + 20, 62);
    });
    if (note) note.textContent = `「${K.name}」的 6 片：每片作用在一张池化图上，加权相加成一张 4×4 输出——简单笔画就这样组合成拐角与圆弧。`;
  }
}
function showL2Kernel(i) {
  showKernelView(state.conv.kernelIdx, true, i);
  if (convPanel.l2maps) convPanel.l2maps.forEach((cv, k) => cv.classList.toggle('picked', k === i));
  if (convPanel.l2note) convPanel.l2note.textContent = '已显示「' + K2SET[i].name + '」的 6 片切片（上方核查看器）。再点其它图换着看。';
  taskHooks.onKernel?.();
}
function tickConv(dt) {
  convScanStep(dt);
  convPanelRefreshLite();
}
let _convLiteT = 0;
function convPanelRefreshLite() {
  /* 三联小图每 2 帧刷一次，省 DOM */
  _convLiteT++;
  if (_convLiteT % 2 === 0 && convPanel) refreshConvPanel();
}
function convCtl() {
  ctl.clear();
  ctl.seg({
    options: K5.map((K, i) => ({ label: K.name, value: i })),
    value: state.conv.kernelIdx,
    onChange: (v) => selectConvKernel(v),
  });
  ctl.slider({
    label: '扫描速度', min: 0.5, max: 4, step: 0.5, value: state.conv.speed,
    fmt: (v) => v.toFixed(1) + '×',
    onInput: (v) => { state.conv.speed = v; },
  });
  ctl.sep();
  ctl.button({ label: '示例：0', onClick: () => demoDigit(0) });
  ctl.button({ label: '清空画板', onClick: () => clearBoard() });
}

/* —— 第 6 章 AI 也会犯错 —— */
let mistakePanel = null;
const secMistake = {
  id: 'mistake', title: 'AI 也会犯错',
  html: `<p>训练好的网络只认识「它见过的样子」。把数字<b>旋转</b>、<b>挪到角落</b>、撒<b>噪点</b>——人眼轻松识别，它的把握却剧烈摇摆甚至认错。多层网络对位置尤其敏感；下面那组<b>卷积思路</b>的对照（池化特征模板匹配）稳得多，但也不是不会错。</p>
<p>点「看它认错的数字」，翻翻<b>更难测试集</b>里它真的认错的例子——有些连人也要犹豫。再在手写板上画一个笑脸或字母：它只认识 0 到 9，没有「我不知道」这个选项，照样会自信地报出一个数字。</p>
<p>所以 AI 的判断要看<b>训练数据</b>是否全面，重要的事情还需要人来把关。</p>`,
  enter() {
    useScene('mistake', buildMistakeScene);
    camTo('mistake');
    field.userData.paint.enabled = false;
    boardHook = () => {
      robustUseBoard(true);
      updateRobust();
      taskHooks.onSmiley?.();
    };
    chapterTick = null;
    if (!state.robust.srcCanvas) state.robust.srcCanvas = document.createElement('canvas');
    buildMistakePanel();
    robustUseBoard(false);
    updateRobust();
    boardPanel.style.display = '';
  },
};
function buildMistakePanel() {
  clearData();
  classifyEls = {};
  const v = elVerdict();
  lcData.appendChild(v.el);
  classifyEls.verdict = v;
  const hud = elHud([['rot', '旋转'], ['shift', '平移'], ['noise', '噪点'], ['best', '网络判断']]);
  lcData.appendChild(hud.el);
  classifyEls.hud = hud;
  const b = elBars();
  b.el.querySelector('.db-cap span').textContent = '多层网络 · 十类置信度';
  lcData.appendChild(b.el);
  classifyEls.bars = b;
  const cmp = elCanvasBlock('对照：卷积思路（池化特征匹配）', 288, 150);
  classifyEls.cmp = cmp.cv;
  const cmpNote = document.createElement('div');
  cmpNote.className = 'db-note';
  cmpNote.textContent = '每个数字两根柱：橙=多层网络，青=池化特征匹配。把数字挪到角落，看谁先崩。';
  cmp.el.appendChild(cmpNote);
  lcData.appendChild(cmp.el);
  /* 错例画廊 */
  const eg = elBlock('它在难例集上认错的数字', '翻着看');
  const view = document.createElement('div');
  view.className = 'err-view';
  view.innerHTML = `
    <canvas width="96" height="96"></canvas>
    <div class="err-side">
      <div class="err-text">–</div>
      <div class="err-pager">
        <button class="pn-btn" data-dir="-1" type="button">‹</button>
        <span class="err-no" style="font-size:11.5px;color:var(--text-faint)">–</span>
        <button class="pn-btn" data-dir="1" type="button">›</button>
      </div>
    </div>`;
  eg.el.appendChild(view);
  const emptyNote = document.createElement('div');
  emptyNote.className = 'db-note';
  lcData.appendChild(eg.el);
  const errs = findErrors();
  mistakePanel = { errs, idx: 0, view, emptyNote, egEl: eg.el };
  renderError();
  view.querySelectorAll('.pn-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (!mistakePanel.errs.length) return;
      mistakePanel.idx = (mistakePanel.idx + Number(btn.dataset.dir) + mistakePanel.errs.length) % mistakePanel.errs.length;
      renderError();
      taskHooks.onErrors?.();
    });
  });
}
function findErrors() {
  const errs = [];
  for (let n = 0; n < DATASET.Xt.length; n++) {
    const { o } = net.forward(DATASET.Xt[n]);
    let bi = 0, bj = 0;
    for (let k = 0; k < 10; k++) { if (o[k] > o[bi]) bi = k; if (DATASET.Yt[n][k] > DATASET.Yt[n][bj]) bj = k; }
    if (bi !== bj) errs.push({ vec: DATASET.Xt[n], truth: bj, pred: bi, conf: o[bi] });
  }
  errs.sort((a, b) => b.conf - a.conf);
  return errs;
}
function renderError() {
  const { errs, idx, view, emptyNote, egEl } = mistakePanel;
  const txt = view.querySelector('.err-text');
  const no = view.querySelector('.err-no');
  const cv = view.querySelector('canvas');
  emptyNote.remove();
  if (!errs.length) {
    view.style.display = 'none';
    emptyNote.textContent = '当前这版权重在难例集上全对——重训一轮（或把学习率调小重跑）再看，错例通常躲在最潦草的那批样本里。';
    egEl.appendChild(emptyNote);
    return;
  }
  view.style.display = '';
  const e = errs[idx];
  const ctx = cv.getContext('2d');
  ctx.clearRect(0, 0, 96, 96);
  ctx.drawImage(vecToCanvas(e.vec, 96), 0, 0);
  txt.innerHTML = `第 ${idx + 1} / ${errs.length} 个错例：正确答案是 <b>${e.truth}</b>，它认成了 <b class="wrong">${e.pred}</b>（把握 ${Math.round(e.conf * 100)}%）。`;
  no.textContent = `${idx + 1}/${errs.length}`;
}
function mistakeCtl() {
  ctl.clear();
  UIREF.rotSlider = ctl.slider({
    label: '旋转', min: -40, max: 40, step: 1, value: state.robust.rot,
    fmt: (v) => v + '°',
    onInput: (v) => { state.robust.rot = v; updateRobust(); },
  });
  ctl.button({
    label: '旋转 90°',
    onClick: () => {
      state.robust.rot = ((state.robust.rot + 90 + 40) > 40) ? -40 : state.robust.rot + 90;
      UIREF.rotSlider.set(state.robust.rot);
      updateRobust();
      taskHooks.onRotate?.();
    },
  });
  UIREF.shiftSlider = ctl.slider({
    label: '平移', min: -4, max: 4, step: 0.5, value: state.robust.shift,
    fmt: (v) => v.toFixed(1) + ' px',
    onInput: (v) => { state.robust.shift = v; updateRobust(); },
  });
  ctl.button({
    label: '挪到角落',
    onClick: () => {
      state.robust.shift = 4;
      UIREF.shiftSlider.set(4);
      updateRobust();
      taskHooks.onCorner?.();
    },
  });
  ctl.slider({
    label: '噪点', min: 0, max: 0.6, step: 0.02, value: state.robust.noise,
    fmt: (v) => Math.round(v * 100) + '%',
    onInput: (v) => { state.robust.noise = v; updateRobust(); },
  });
  ctl.sep();
  UIREF.newSample = ctl.button({ label: '换一个样本', onClick: () => { robustUseBoard(false); updateRobust(); } });
  ctl.button({ label: '用画板上的字', onClick: () => {
    if (!state.canvasVec.some((v) => v > 0.2)) { toast('画板还是空的，先写一个数字。', 'warn'); return; }
    robustUseBoard(true);
    updateRobust();
  } });
}

/* ================= 章节装配与切换 ================= */

const SECTIONS = [secPixels, secNeuron, secNetwork, secTrain, secConv, secMistake];
const TASKS = {
  pixels: [
    ['write', '在<span class="tk-link" data-act="sample">手写板</span>上写一个数字'],
    ['pre', '看一遍<span class="tk-link" data-act="pre">预处理</span>的过程'],
    ['lowres', '把<span class="tk-link" data-act="lowres">分辨率降到 7×7</span>，看还认不认得出'],
  ],
  neuron: [
    ['paint', '<span class="tk-link" data-act="brushhint">用画笔</span>在方块上画权重'],
    ['t1', '试一个 <span class="tk-link" data-act="t1">1</span>'],
    ['t0', '试一个 <span class="tk-link" data-act="t0">0</span>'],
    ['goal', '让它被「1」点亮，同时不被「0」点亮'],
  ],
  network: [
    ['pulse', '写一个数字，看<span class="tk-link" data-act="pulse">信号传播</span>'],
    ['weight', '<span class="tk-link" data-act="pick">点一个隐藏层神经元</span>，看它在找什么'],
    ['active', '看<span class="tk-link" data-act="active">最活跃的神经元</span>'],
  ],
  train: [
    ['reset', '<span class="tk-link" data-act="resetw">重置为随机权重</span>'],
    ['start', '开始训练，让测试准确率超过 <span class="tk-link" data-act="watch">90%</span>'],
    ['lr', '<span class="tk-link" data-act="lrmax">试试学习率太大会怎样</span>'],
  ],
  conv: [
    ['scan', '看一遍<span class="tk-link" data-act="scan">扫描动画</span>'],
    ['maps', '写一个数字，看哪些特征图亮了'],
    ['kernel', '点一张特征图，看它的<span class="tk-link" data-act="kernel">卷积核</span>'],
  ],
  mistake: [
    ['rotate', '把数字<span class="tk-link" data-act="rot">旋转到认错</span>'],
    ['corner', '把数字<span class="tk-link" data-act="corner">挪到角落</span>'],
    ['errors', '看它<span class="tk-link" data-act="errors">认错的数字</span>'],
    ['smiley', '画一个<span class="tk-link" data-act="smiley">笑脸</span>考考它'],
  ],
};
const CTL_BUILDERS = {
  pixels: pixelsCtl, neuron: neuronCtl, network: networkCtl,
  train: trainCtl, conv: convCtl, mistake: mistakeCtl,
};
let chapterTick = null;
let chapterIdx = 0;
let taskList = null;
const chapNav = document.getElementById('chapNav');
const chapCount = document.getElementById('chapCount');
const detailNo = document.getElementById('detailNo');
const detailTitle = document.getElementById('detailTitle');
const railNoL = document.getElementById('railNoL');
const railTitleR = document.getElementById('railTitleR');
const detailBody = document.getElementById('detailBody');
const shell = document.getElementById('neuroShell');

function installTaskHooks() {
  taskHooks = {
    onWrite: () => { taskList?.check('write'); taskList?.check('maps'); },
    onWritePulse: () => { taskList?.check('pulse'); taskList?.check('maps'); },
    onWriteConv: () => { taskList?.check('maps'); },
    onPreprocess: () => taskList?.check('pre'),
    onLowRes: () => taskList?.check('lowres'),
    onPaint: () => taskList?.check('paint'),
    onPreset: () => taskList?.check('paint'),
    onTest1: () => { taskList?.check('t1'); neuronState.lastTest = 1; refreshNeuronPanel(); },
    onTest0: () => { taskList?.check('t0'); neuronState.lastTest = 0; refreshNeuronPanel(); },
    onLit: () => taskList?.check('goal'),
    onDark: () => { if (TASK_STATE.t1 && TASK_STATE.t0) taskList?.check('goal'); },
    onActive: () => taskList?.check('active'),
    onGallery: () => taskList?.check('weight'),
    onReset: () => taskList?.check('reset'),
    onAcc90: () => taskList?.check('start'),
    onDiverge: () => taskList?.check('lr'),
    onLrMax: () => taskList?.check('lr'),
    onKernel: () => taskList?.check('kernel'),
    onRotate: () => taskList?.check('rotate'),
    onCorner: () => taskList?.check('corner'),
    onErrors: () => taskList?.check('errors'),
    onSmiley: () => taskList?.check('smiley'),
    afterSample: () => {},
    /* 快捷链接动作 */
    sample: () => demoDigit((Math.random() * 10) | 0),
    pre: () => { if (pxPanel?.preEl) pxPanel.preEl.style.display = ''; startPreprocess(); },
    lowres: () => applyLowRes(7),
    brushhint: () => toast('先在控件里点「画笔」，再按住场上的方块拖动。'),
    t1: () => UIREF.test1?.click(),
    t0: () => UIREF.test0?.click(),
    pulse: () => startPulse(state.canvasVec),
    pick: () => { showHiddenWeight((Math.random() * 48) | 0); taskList?.check('weight'); },
    active: () => UIREF.active?.click(),
    resetw: () => UIREF.resetWeights?.click(),
    watch: () => toast('训练中盯着「测试准确率」读数，过 90% 任务自动打勾。'),
    lrmax: () => UIREF.lrMax?.click(),
    scan: () => toast('扫描动画正在进行——看中栏的窗口与右栏的输入小图同步。'),
    kernel: () => selectConvKernel((state.conv.kernelIdx + 1) % K5.length),
    rot: () => { state.robust.rot = 40; updateRobust(); mistakeCtlSliders(); },
    corner: () => { state.robust.shift = 4; updateRobust(); mistakeCtlSliders(); },
    errors: () => toast('用错例画廊下方的 ‹ › 翻页。'),
    smiley: () => toast('在画板上画个笑脸或字母——它照样会报一个数字。'),
  };
}
function mistakeCtlSliders() {
  UIREF.rotSlider?.set(state.robust.rot);
  UIREF.shiftSlider?.set(state.robust.shift);
}
function selectChapterRefreshCtl() {
  CTL_BUILDERS[SECTIONS[chapterIdx].id]();
  if (chapterIdx === 0) drawPixelPanel();
}
function applyLowRes(v) {
  state.viewRes = v;
  selectChapterRefreshCtl();
  if (v < RES) {
    const low = resampleVec(state.canvasVec, v);
    const r = classifyVector(low);
    toast(`${v}×${v} 采样后网络认成 ${r.best}（${Math.round(r.prob * 100)}%）——像素太少，笔画细节先丢了。`);
    taskHooks.onLowRes?.();
  }
}
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
  taskList = elTasks(TASKS[sec.id]);
  lessonEl.appendChild(taskList);
  installTaskHooks();
  if (state.training) {
    state.training = false;
    const btn = document.getElementById('trainToggleBtn');
    if (btn) btn.textContent = '▶ 继续训练';
  }
  /* 场景显隐：默认只留常驻世界；各章场景在 enter 里 useScene */
  for (const k of Object.keys(scenes)) scenes[k].visible = false;
  activeScene = null;
  if (NET.weightSprite) NET.weightSprite.visible = false;
  if (NEU.brushRing) NEU.brushRing.visible = false;
  if (field) { field.visible = true; field.userData.paint.enabled = false; }
  boardPanel.style.display = '';
  boardPanel.classList.remove('expanded');
  chapterTick = null;
  classifyEls = null;
  pxPanel = null; neuronPanel = null; trainPanel = null; convPanel = null; mistakePanel = null;
  sec.enter();
  CTL_BUILDERS[sec.id]();
  accSecs.controls.classList.toggle('acc-empty', !controlsEl.children.length);
  accSecs.data.classList.toggle('acc-empty', !lcData.children.length);
  detailBody.scrollTop = 0;
}
function gotoChapter(i) { selectChapter((i + SECTIONS.length) % SECTIONS.length); }

/* 左栏章节按钮（含副标题） */
const CHAP_SUBS = [
  '256 个数 · 采样与预处理',
  '画权重 · 激活函数',
  '信号传播 · 权重图',
  '梯度下降 · 48 张权重图',
  '5×5 扫描 · 池化 · 组合核',
  '旋转平移噪点 · 错例',
];
const chapBtns = SECTIONS.map((sec, i) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'chap-btn';
  b.innerHTML = '<span class="chap-n"></span><span class="chap-t"></span><span class="chap-sub"></span>';
  b.querySelector('.chap-n').textContent = String(i + 1).padStart(2, '0');
  b.querySelector('.chap-t').textContent = sec.title;
  b.querySelector('.chap-sub').textContent = CHAP_SUBS[i];
  b.addEventListener('click', () => selectChapter(i));
  chapNav.appendChild(b);
  return b;
});

/* ================= 栏折叠 × 专注模式 × 大屏 ================= */

const foldLBtn = document.getElementById('foldLBtn');
const unfoldLBtn = document.getElementById('unfoldLBtn');
const foldRBtn = document.getElementById('foldRBtn');
const unfoldRBtn = document.getElementById('unfoldRBtn');
const focusBtn = document.getElementById('focusBtn');
const FOLD_KEY = { l: 'neuro.foldL', r: 'neuro.foldR' };
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

/* 右栏三块手风琴 + 手写板折叠（localStorage 记忆；≤1100px 首访清爽态：读数默认收） */
const ACC_KEYS = { lesson: 'neuro.accLesson', controls: 'neuro.accControls', data: 'neuro.accData' };
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
  accSecs[name].classList.toggle('closed', accClosed[name]);
  accSecs[name].querySelector('.acc-head').setAttribute('aria-expanded', String(!accClosed[name]));
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

/* 手写板浮窗折叠 / 放大 */
const boardFoldBtn = document.getElementById('boardFoldBtn');
const boardBadge = document.getElementById('boardBadge');
const boardExpandBtn = document.getElementById('boardExpand');
let boardFolded = false;
try { boardFolded = localStorage.getItem('neuro.foldBoard') === '1'; } catch (e) { /* 忽略 */ }
function applyBoardFold() {
  boardPanel.classList.toggle('folded', boardFolded);
  boardFoldBtn.setAttribute('aria-expanded', String(!boardFolded));
}
boardFoldBtn.addEventListener('click', () => {
  boardFolded = true;
  try { localStorage.setItem('neuro.foldBoard', '1'); } catch (e) { /* 忽略 */ }
  applyBoardFold();
});
boardBadge.addEventListener('click', () => {
  boardFolded = false;
  try { localStorage.setItem('neuro.foldBoard', '0'); } catch (e) { /* 忽略 */ }
  applyBoardFold();
});
boardExpandBtn.addEventListener('click', () => {
  boardPanel.classList.toggle('expanded');
});
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && boardPanel.classList.contains('expanded')) {
    boardPanel.classList.remove('expanded');
    return;
  }
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const t = e.target;
  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
  if (e.key === 'ArrowLeft' || e.key === ',') gotoChapter(chapterIdx - 1);
  else if (e.key === 'ArrowRight' || e.key === '.') gotoChapter(chapterIdx + 1);
  else if (e.key === ']') toggleFold('r');
  else if (e.key === 'r' || e.key === 'R') viewBtn.click();
});

/* 舞台工具：重做 / 模型标签 / 视角 / 画质 / 大屏 */
const chapPrev = document.getElementById('chapPrev');
const chapNext = document.getElementById('chapNext');
const resetBtn = document.getElementById('resetBtn');
const labelBtn = document.getElementById('labelBtn');
const viewBtn = document.getElementById('viewBtn');
const qualBtn = document.getElementById('qualBtn');
const bigBtn = document.getElementById('bigBtn');
chapPrev.addEventListener('click', () => gotoChapter(chapterIdx - 1));
chapNext.addEventListener('click', () => gotoChapter(chapterIdx + 1));
resetBtn.addEventListener('click', () => {
  clearBoard(true);
  state.robust.rot = 0; state.robust.shift = 0; state.robust.noise = 0;
  state.robust.fromBoard = false;
  state.conv.px = 0; state.conv.py = 0;
  selectChapter(chapterIdx);
  toast('实验已复位：输入、权重与读数回到本章初始状态。', 'ok');
});
let labelsOn = true;
try { labelsOn = localStorage.getItem('neuro.labels') !== '0'; } catch (e) { /* 忽略 */ }
function setLabels(on) {
  labelsOn = on;
  for (const s of equipLabels) s.visible = labelsOn;
  labelBtn.classList.toggle('on', labelsOn);
  labelBtn.setAttribute('aria-pressed', String(labelsOn));
  try { localStorage.setItem('neuro.labels', labelsOn ? '1' : '0'); } catch (e) { /* 忽略 */ }
}
labelBtn.addEventListener('click', () => setLabels(!labelsOn));
viewBtn.addEventListener('click', () => {
  camTo(SECTIONS[chapterIdx].id);
  toast('视角已复位。', 'ok');
});
/* 画质优先 / 流畅度优先：切换辉光 + 颗粒 */
let qualityHigh = true;
function applyQuality() {
  const bloomPass = vfx.composer.passes.find((p) => p.strength !== undefined);
  const finishPass = vfx.composer.passes.find((p) => p.uniforms && p.uniforms.uGrainAmt);
  if (bloomPass) bloomPass.enabled = qualityHigh;
  if (finishPass) {
    finishPass.uniforms.uGrainAmt.value = qualityHigh ? 0.028 : 0;
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
  document.body.classList.toggle('neuro-big', bigMode);
  bigBtn.classList.toggle('on', bigMode);
  bigBtn.setAttribute('aria-pressed', String(bigMode));
}
bigBtn.addEventListener('click', () => {
  bigMode = !bigMode;
  setFocus(bigMode);
  applyBig();
});

/* ================= 首次进入引导 ================= */

function runTour() {
  let done = false;
  try { done = localStorage.getItem('neuro.tour') === 'done'; } catch (e) { /* 忽略 */ }
  if (done || window.innerWidth <= 860) return;
  const STEPS = [
    {
      target: '.lab-chapters', cap: '第 1 站 / 共 4 站', h: '章节都在左边',
      p: '六个课题按顺序讲：从「图像就是数字」到「AI 也会犯错」。点标题切章，也可以用键盘 ← →。',
      pos: { left: '16px', top: '110px' },
    },
    {
      target: '.lab-stage3d', cap: '第 2 站 / 共 4 站', h: '中间是 3D 神经展台',
      p: '输入场、神经元、网络机架都在这里。拖动旋转、滚轮缩放；左上角有重做、视角和课堂大屏。',
      pos: { left: '50%', top: '80px', transform: 'translateX(-50%)' },
    },
    {
      target: '.neuro-board', cap: '第 3 站 / 共 4 站', h: '在这块手写板上写字',
      p: '按住鼠标或手指写 0 到 9，网络会一边看一边认。写错点「清空」，也可以点「随机样本」。',
      pos: { right: '284px', top: '190px' },
    },
    {
      target: '.lab-detail', cap: '第 4 站 / 共 4 站', h: '讲解、控件与读数在右边',
      p: '每章都有小任务，完成一项自动打勾；蓝色文字是快捷操作，点一下就能看到效果。数据读数也在这里。',
      pos: { right: '368px', top: '120px' },
    },
  ];
  const mask = document.createElement('div');
  mask.className = 'tour-mask';
  stage.appendChild(mask);
  const card = document.createElement('div');
  card.className = 'tour-card';
  stage.appendChild(card);
  let idx = -1;
  function render() {
    document.querySelectorAll('.tour-hi').forEach((el) => el.classList.remove('tour-hi'));
    if (idx < 0) {
      Object.assign(card.style, { left: '50%', top: '34%', transform: 'translateX(-50%)' });
      card.innerHTML = `
        <div class="tc-step">欢迎使用</div>
        <h3>神经网络识数字</h3>
        <p>亲手把一个网络从随机噪声训练到认得你写的字。四站小导览，一分钟看完。</p>
        <div class="tc-foot"><button class="tc-skip" type="button">跳过引导</button><span class="spacer"></span><button class="tc-btn primary" type="button">开始吧</button></div>`;
    } else {
      const s = STEPS[idx];
      const target = shell.querySelector(s.target);
      if (target) target.classList.add('tour-hi');
      Object.assign(card.style, s.pos, { transform: s.pos.transform || '' });
      card.innerHTML = `
        <div class="tc-step">${s.cap}</div>
        <h3>${s.h}</h3>
        <p>${s.p}</p>
        <div class="tc-foot"><button class="tc-skip" type="button">跳过引导</button><span class="spacer"></span><button class="tc-btn" id="tourPrev" type="button" ${idx === 0 ? 'disabled' : ''}>上一步</button><button class="tc-btn primary" id="tourNext" type="button">${idx === STEPS.length - 1 ? '完成' : '下一步'}</button></div>`;
    }
    card.querySelector('.tc-skip').addEventListener('click', finish);
    const next = card.querySelector('#tourNext') || card.querySelector('.tc-btn.primary');
    next.addEventListener('click', () => {
      if (idx < 0) idx = 0;
      else if (idx >= STEPS.length - 1) return finish();
      else idx++;
      render();
    });
    const prev = card.querySelector('#tourPrev');
    if (prev) prev.addEventListener('click', () => { idx = Math.max(idx - 1, 0); render(); });
    requestAnimationFrame(() => {
      mask.classList.add('on');
      card.classList.add('on');
    });
  }
  function finish() {
    mask.classList.remove('on');
    card.classList.remove('on');
    document.querySelectorAll('.tour-hi').forEach((el) => el.classList.remove('tour-hi'));
    try { localStorage.setItem('neuro.tour', 'done'); } catch (e) { /* 忽略 */ }
    setTimeout(() => { mask.remove(); card.remove(); }, 320);
  }
  render();
}

/* ================= 帧循环与启动 ================= */

app.onFrame((dt) => {
  if (chapterTick) chapterTick(dt);
  tickDust(dt);
  /* 卷积核瓦片轻微悬浮呼吸 */
  if (CONV3D.tiles && scenes.conv && scenes.conv.visible) {
    CONV3D.tiles.position.y = 1.58 + Math.sin(performance.now() / 640) * 0.02;
  }
});

setLabels(labelsOn);
applyQuality();
applyBig();

/* 预训练：分帧进行避免卡首屏（12 轮，损失进终端屏） */
function pretrain() {
  let e = 0;
  const step = () => {
    const t0 = performance.now();
    while (e < 16 && performance.now() - t0 < 28) {
      const order = Array.from({ length: DATASET.X.length }, (_, i) => i);
      const loss = net.trainSamples(order, DATASET.X, DATASET.Y, 0.6);
      state.lossHist.push(loss);
      state.epoch++;
      e++;
      if (terminal) terminal.push(loss);
    }
    if (e < 12) {
      loader.setText(`正在预训练模型… 第 ${e}/12 轮`);
      requestAnimationFrame(step);
    } else {
      const te = net.accuracy(DATASET.Xt, DATASET.Yt);
      state.accTestHist.push(te);
      state.accTrainHist.push(net.accuracy(DATASET.X.slice(0, 300), DATASET.Y.slice(0, 300)));
      net.snapshot();
      state.bestLoss = state.lossHist[state.lossHist.length - 1] || Infinity;
      if (terminal) terminal.set('EPOCH ' + state.epoch, Math.round(te * 100) + '%');
      buildConnections();
      loader.hide();
      selectChapter(0);
      runTour();
    }
  };
  loader.setText('正在预训练模型…');
  requestAnimationFrame(step);
}
/* 样本生成：分块保证进度可见 */
function buildSamples() {
  const CHUNK = 240;
  let done = 0;
  const step = () => {
    const t0 = performance.now();
    while (done < DATASET.N_TRAIN && performance.now() - t0 < 26) {
      buildDatasetChunk(done, Math.min(CHUNK, DATASET.N_TRAIN - done), false);
      done += CHUNK;
    }
    if (done < DATASET.N_TRAIN) {
      loader.setText(`正在生成手写样本… ${done}/${DATASET.N_TRAIN}`);
      requestAnimationFrame(step);
    } else {
      let dt2 = 0;
      const step2 = () => {
        const t1 = performance.now();
        while (dt2 < DATASET.N_TEST && performance.now() - t1 < 26) {
          buildDatasetChunk(dt2, Math.min(40, DATASET.N_TEST - dt2), true);
          dt2 += 40;
        }
        if (dt2 < DATASET.N_TEST) requestAnimationFrame(step2);
        else {
          DATASET.built = true;
          buildConvTemplates();
          pretrain();
        }
      };
      requestAnimationFrame(step2);
    }
  };
  requestAnimationFrame(step);
}

setTimeout(() => {
  initMaterials();
  buildWorld();
  tameEnv(world, 0.42);
  buildField();
  loader.setText('正在生成手写样本…');
  buildSamples();
  /* QA / 主控终审钩子 */
  window.__eduSections = { select: selectChapter };
  window.__neuroDebug = { app, vfx, scene, PAL, state, net, stats: () => vfx.stats() };
  window.__neuroQA = { demoDigit, clearBoard, showHiddenWeight, selectConvKernel, showL2Kernel, applyLowRes, startPreprocess, startPulse, updateRobust };
}, 40);

