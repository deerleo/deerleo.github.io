/* EduLab · 实验室制取气体（gas）
 * 课题：加热高锰酸钾制氧气 / 分解过氧化氢制氧气 / 制取二氧化碳 / 氧气与二氧化碳的性质 / 随堂检测
 * 布局（micro 三件套移植）：真·三栏教学布局——左栏课题列表（点击切章 + ‹01/05› 上下课题）/ 中栏 3D 化学实验台
 *   （相机飞行）/ 右栏 讲解 + 实验步骤·条件 + 实验记录；左右栏独立折叠（28px 竖条）+ 专注模式 +
 *   右栏三块手风琴（localStorage 记忆，切章不重置）；导管口气流曲线浮窗可折叠为 40px 圆形徽标（gas.foldChart）。
 * 视觉工艺（edu-vfx 轻接入 + Micro 级建模）：
 *   - 酒精灯：Lathe 灯壶（鼓腹/收肩/颈口沿）+ 双层燃料 + 液面高光 + 黄铜芯套 + 棉芯 + 灯帽（点/熄动画）+
 *     双锥火焰（外焰/内焰 additive）+ 焰点点光；预热时整灯来回移动、集中加热时停在药品下方
 *   - 铁架台：铸铁底座（圆角挤出 + 筋条）+ 立杆 + 滚花调节环 + 十字夹头；烧瓶夹长臂 + 关节球 +
 *     弹簧夹爪（夹合动画 + 翼形螺钉旋转）+ 橡胶衬垫
 *   - 玻璃器材全程序化：试管（圆底 + 卷边口沿 + 磨口）/ 锥形瓶（底缘 + 锥面 + 卷口）/ 集气瓶（磨边口沿）/
 *     分液漏斗（球腔 + 锥腔 + 旋塞开度→手柄旋转 + 铁圈托）/ 长颈漏斗（喇叭杯 + 长管）/ 水槽（挤出厚壁玻璃缸 +
 *     水面高光）；导管 CatmullRom 变径玻璃管 + 乳胶管段
 *   - 场景叙事：试剂瓶阵列（弧面标签 + 双层内液 + 液面高光 + 弯月面）/ 试管架 + 空试管 / 火柴盒（磷皮纹理）+
 *     火柴 / 镊子 / 托盘天平（表盘程序化纹理）/ 过滤台（烧杯 + 漏斗 + 滤纸）/ 墙面化学海报（程序化 CanvasTexture）
 *   - 程序化纹理：高锰酸钾粉末颗粒 / 大理石纹 / 混凝土地面 / 火柴盒磷皮 / 天平表盘 / 器材标签 / 接触阴影烘焙
 *   - 光照氛围：主暖光 + 冷补光 + 桌面 bounce + 程序化摄影棚环境反射（makeStudioEnvironment）+ 接触阴影贴片
 *   - 交互可视反馈：火焰随火力滑杆伸缩 + 灯帽盖灭动画 + 夹爪开合 + 旋塞随开度旋转 + 试管倾斜选择 +
 *     木条/铁丝移动动画 + CO₂ 倾倒动画 + 气泡/气流粒子 + 气流-纯度 60 秒曲线
 * 教学交互（原版功能 1:1 对齐）：查装定点收离熄验八步（定有管口朝向选择、点分点燃/预热/集中加热、
 *   收记录收集时机纯度、验三结果）/ 过氧化氢（查气密→加液→加 MnO₂→活塞开度→收集→验满→检验→回收称量）/
 *   二氧化碳（查气密→装药品→注酸（液封选择）→收集→验满→石灰水检验，酸×形态药品矩阵）/ 气体性质
 *   （木条复燃、铁丝燃烧+瓶底水选择、阶梯蜡烛、石蕊红变紫）/ 7 题随堂检测；桌上的器材可直接点击操作。
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
const loader = makeLoader(stage, '正在搭建化学实验台…');
const app = createApp({
  container: stage,
  fov: 42, near: 0.05, far: 60,
  cameraPos: [0.6, 2.1, 3.5],
  target: [0, 1.0, 0],
  minDistance: 0.6, maxDistance: 9,
  exposure: 1.05,
  keepBackground: true,
});
const { scene } = app;
/* 视觉工艺轻接入：后处理管线接管渲染循环与相机缓动（setCamera 升级为 cubic 运镜）；
   金属/玻璃反射走程序化摄影棚，背景用程序化实验室渐变——零外部资产，首帧即建 */
const vfx = attachVFX(app, 'illus');
scene.environment = makeStudioEnvironment(app.renderer);
app.renderer.toneMappingExposure = 0.95;
const labBackdrop = makeBackdropTexture({ inner: '#cdd8de', outer: '#59646e', glow: '#f6f1e2', glowStrength: 0.32 });
scene.background = labBackdrop;

/* 灯光：暖主光 + 冷补光 + 正面柔光 + 桌面近距 bounce + 低环境 */
const keyLight = new THREE.DirectionalLight(0xffe6c4, 1.1);
keyLight.position.set(3.5, 5, 3);
scene.add(keyLight);
const fillLight = new THREE.DirectionalLight(0xdfe8ff, 0.45);
fillLight.position.set(-4, 3, -2.5);
scene.add(fillLight);
const frontLight = new THREE.DirectionalLight(0xeef4ff, 0.32);
frontLight.position.set(0.5, 2.4, 5);
scene.add(frontLight);
scene.add(new THREE.AmbientLight(0x9a948c, 0.34));
const deskBounce = new THREE.PointLight(0xffd9a0, 0.3, 6, 1.8);
deskBounce.position.set(0.2, 1.35, 1.6);
scene.add(deskBounce);

const mesh = (geo, mat) => new THREE.Mesh(geo, mat);
function label(text, color = '#ffffff', scale = 0.0015, bg = 'rgba(10,14,20,0.72)') {
  return makeTextSprite(text, { fontSize: 30, color, scale, bg });
}

/* ---------------- 程序化纹理与工艺小件 ---------------- */

/* 可播种伪随机（mulberry32）：同 seed 同纹理，保证道具可复现 */
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

/* 漆面微噪点粗糙度贴图（柜体烤漆的细密橘皮感） */
function paintNoiseTexture(size = 256, repeat = 3) {
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const ctx = cv.getContext('2d');
  const img = ctx.createImageData(size, size);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = clamp(150 + Math.random() * 90, 0, 255);
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
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
    /* 细裂缝 */
    ctx.strokeStyle = 'rgba(70,74,78,0.28)';
    for (let i = 0; i < 7; i++) {
      ctx.lineWidth = 0.7 + rnd() * 0.8;
      ctx.beginPath();
      let x = rnd() * size, y = rnd() * size;
      ctx.moveTo(x, y);
      for (let k = 0; k < 6; k++) { x += (rnd() - 0.5) * 90; y += (rnd() - 0.5) * 90; ctx.lineTo(x, y); }
      ctx.stroke();
    }
    /* 分块缝线（十字） */
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
    g.addColorStop(0, '#dde3e8');
    g.addColorStop(1, '#cfd6dc');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 1800; i++) {
      const x = rnd() * size, y = rnd() * size;
      ctx.fillStyle = `rgba(120,126,132,${0.03 + rnd() * 0.05})`;
      ctx.fillRect(x, y, 1.4, 1.4);
    }
  });
}

/* 化学教学海报（墙面叙事）：元素周期表节选 / 实验安全须知 */
function posterTexture(kind) {
  return canvasTex(360, 480, (ctx) => {
    ctx.fillStyle = '#f4f1e8';
    ctx.fillRect(0, 0, 360, 480);
    ctx.fillStyle = '#e7e2d4';
    ctx.fillRect(0, 0, 360, 64);
    ctx.fillStyle = '#2e3440';
    ctx.font = `700 26px 'PingFang SC', 'Microsoft YaHei', sans-serif`;
    ctx.textBaseline = 'middle';
    if (kind === 'periodic') {
      ctx.fillText('元素周期表', 20, 34);
      /* 元素格子阵 */
      const cells = [
        ['H', '#c56a4a'], ['He', '#7a5fa0'], ['Li', '#4a8ac5'], ['Be', '#4ac58e'],
        ['B', '#b0a34a'], ['C', '#5a5f66'], ['N', '#4a7ac5'], ['O', '#c55a4a'],
        ['F', '#a0c54a'], ['Ne', '#c58a4a'], ['Na', '#8a5ac5'], ['Mg', '#4ac5a8'],
        ['Al', '#6a9ab0'], ['Si', '#8a8a5a'], ['P', '#c58e4a'], ['S', '#d4b84a'],
        ['Cl', '#4ac578'], ['Ar', '#a08ac5'],
      ];
      cells.forEach(([sym, c], i) => {
        const cx = 20 + (i % 6) * 55, cy = 92 + Math.floor(i / 6) * 62;
        ctx.fillStyle = 'rgba(46,52,64,0.1)';
        ctx.fillRect(cx, cy, 46, 52);
        ctx.fillStyle = c;
        ctx.fillRect(cx + 2, cy + 2, 42, 48);
        ctx.fillStyle = '#fff';
        ctx.font = `700 22px 'Avenir Next', 'Helvetica Neue', sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(sym, cx + 23, cy + 30);
        ctx.textAlign = 'left';
      });
      ctx.fillStyle = '#6a7280';
      ctx.font = `400 14px 'PingFang SC', sans-serif`;
      ctx.fillText('K · Ca · Na · Mg · Al · Zn · Fe · Sn · Pb · (H) · Cu', 20, 386);
      ctx.fillText('金属活动性顺序', 20, 410);
    } else {
      ctx.fillText('实验安全须知', 20, 34);
      const rows = [
        ['①', '取用药品限量，不入口、不触摸'],
        ['②', '加热试管先预热，管口不对人'],
        ['③', '闻气体用扇闻，绝不俯身直吸'],
        ['④', '废液入缸，玻璃器皿轻拿轻放'],
        ['⑤', '酒精灯用灯帽盖灭，禁止吹灭'],
      ];
      ctx.font = `500 17px 'PingFang SC', 'Microsoft YaHei', sans-serif`;
      rows.forEach(([n, t], i) => {
        ctx.fillStyle = '#c56a4a';
        ctx.fillText(n, 22, 108 + i * 52);
        ctx.fillStyle = '#2e3440';
        ctx.fillText(t, 52, 108 + i * 52);
      });
      ctx.fillStyle = '#e7e2d4';
      ctx.fillRect(20, 386, 320, 66);
      ctx.fillStyle = '#8a5a3a';
      ctx.font = `600 15px 'PingFang SC', sans-serif`;
      ctx.fillText('安全第一 · 规范操作 · 好观察记录', 30, 425);
    }
    /* 边框 */
    ctx.strokeStyle = 'rgba(46,52,64,0.35)';
    ctx.lineWidth = 6;
    ctx.strokeRect(6, 6, 348, 468);
  });
}

/* 高锰酸钾粉末颗粒纹理（紫黑晶体碎粒） */
function kmno4Texture(size = 256) {
  const rnd = mulberry32(9);
  return canvasTex(size, size, (ctx) => {
    ctx.fillStyle = '#2c1436';
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 900; i++) {
      const x = rnd() * size, y = rnd() * size, r = 0.8 + rnd() * 2.6;
      const t = rnd();
      ctx.fillStyle = t > 0.72 ? `rgba(122,52,150,${0.5 + rnd() * 0.4})` : t > 0.4 ? `rgba(58,24,74,${0.6 + rnd() * 0.3})` : `rgba(16,8,22,${0.6})`;
      ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    }
    for (let i = 0; i < 60; i++) {
      const x = rnd() * size, y = rnd() * size;
      ctx.fillStyle = `rgba(180,120,205,${0.35 + rnd() * 0.3})`;
      ctx.fillRect(x, y, 1.6 + rnd(), 1.2 + rnd());
    }
  });
}

/* 大理石纹理（灰白底 + 灰色脉络） */
function marbleTexture(size = 256) {
  const rnd = mulberry32(63);
  return canvasTex(size, size, (ctx) => {
    ctx.fillStyle = '#d8dade';
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 10; i++) {
      ctx.strokeStyle = `rgba(122,128,138,${0.16 + rnd() * 0.22})`;
      ctx.lineWidth = 0.8 + rnd() * 2.4;
      ctx.beginPath();
      let x = rnd() * size, y = -10;
      ctx.moveTo(x, y);
      while (y < size + 10) { x += (rnd() - 0.5) * 60; y += 18 + rnd() * 30; ctx.lineTo(x, y); }
      ctx.stroke();
    }
    for (let i = 0; i < 500; i++) {
      const x = rnd() * size, y = rnd() * size;
      ctx.fillStyle = `rgba(160,166,174,${0.1 + rnd() * 0.12})`;
      ctx.fillRect(x, y, 1.2, 1.2);
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

/* 托盘天平表盘（指针刻度盘） */
function dialTexture(size = 256) {
  return canvasTex(size, size, (ctx) => {
    ctx.fillStyle = '#f0ede4';
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = '#3a3f46';
    for (let i = 0; i <= 20; i++) {
      const a = -Math.PI * 0.75 + (i / 20) * Math.PI * 1.5;
      const r0 = i % 5 === 0 ? 78 : 88, r1 = 96;
      ctx.lineWidth = i % 5 === 0 ? 3 : 1.4;
      ctx.beginPath();
      ctx.moveTo(128 + Math.sin(a) * r0, 128 - Math.cos(a) * r0);
      ctx.lineTo(128 + Math.sin(a) * r1, 128 - Math.cos(a) * r1);
      ctx.stroke();
    }
    ctx.fillStyle = '#3a3f46';
    ctx.font = `600 20px 'Avenir Next', sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('g', 128, 190);
    ctx.fillText('0', 128 + Math.sin(-Math.PI * 0.75) * 62, 128 - Math.cos(-Math.PI * 0.75) * 62);
    ctx.fillText('100', 128 + Math.sin(Math.PI * 0.75) * 62, 128 - Math.cos(Math.PI * 0.75) * 62);
  });
}

/* 接触阴影：实验台一张烘焙贴图（径向渐变 Blob，单 draw call 免实时 shadowMap） */
const SHADOW_BLOBS = [];
function bakeContactShadow(x, z, w, d, opacity = 0.34) {
  SHADOW_BLOBS.push({ x, z, w, d, opacity });
}
function buildBenchShadow() {
  const CW = 1024, CH = 464;              /* 台面 5.2 × 2.36 */
  const cv = document.createElement('canvas');
  cv.width = CW; cv.height = CH;
  const ctx = cv.getContext('2d');
  for (const b of SHADOW_BLOBS) {
    const px = ((b.x + 2.6) / 5.2) * CW;
    const pz = ((b.z + 1.18) / 2.36) * CH;
    const rx = (b.w / 5.2) * CW / 2;
    const rz = (b.d / 2.36) * CH / 2;
    const g = ctx.createRadialGradient(px, pz, 0, px, pz, Math.max(rx, rz));
    g.addColorStop(0, `rgba(16,10,5,${b.opacity})`);
    g.addColorStop(0.55, `rgba(16,10,5,${b.opacity * 0.5})`);
    g.addColorStop(1, 'rgba(16,10,5,0)');
    ctx.save();
    ctx.translate(px, pz);
    ctx.scale(rx / Math.max(rx, rz), rz / Math.max(rx, rz));
    ctx.translate(-px, -pz);
    ctx.fillStyle = g;
    ctx.fillRect(px - Math.max(rx, rz), pz - Math.max(rx, rz), Math.max(rx, rz) * 2, Math.max(rx, rz) * 2);
    ctx.restore();
  }
  const tex = new THREE.CanvasTexture(cv);
  const m = mesh(new THREE.PlaneGeometry(5.2, 2.36), new THREE.MeshBasicMaterial({
    map: tex, transparent: true, depthWrite: false,
  }));
  m.rotation.x = -Math.PI / 2;
  m.position.set(0, 0.9055, 0.02);
  m.renderOrder = -1;
  return m;
}

/* ---------------- 材质分层（玻璃器皿 / 金属 / 橡胶 / 液体） ---------------- */

/* 玻璃：透明 + 高光（免 transmission 通道，显微线同款工艺） */
function glassMat(opacity = 0.2, color = 0xd4e2ea) {
  return matCoat(color, {
    roughness: 0.05, opacity, metalness: 0.02,
    clearcoat: 0.8, clearcoatRoughness: 0.16,
    side: THREE.DoubleSide, depthWrite: false,
  });
}
/* 磨口玻璃（管口/塞口加厚段，雾感更重） */
function frostedMat() {
  return matCoat(0xe4edf2, { roughness: 0.3, opacity: 0.5, clearcoat: 0.4, clearcoatRoughness: 0.35, depthWrite: false });
}
function liquidMat(color, opacity = 0.45) {
  return matCoat(color, { roughness: 0.16, opacity, clearcoat: 0.5, clearcoatRoughness: 0.2, side: THREE.DoubleSide, depthWrite: false });
}
const M_CHROME = matStd(0xdfe3e9, { roughness: 0.16, metalness: 1 });      // 镀铬
const M_SATIN = matStd(0xc4c9d0, { roughness: 0.32, metalness: 1 });       // 缎面金属
M_SATIN.roughnessMap = paintNoiseTexture(128, 2);
const M_CAST = matStd(0x33373d, { roughness: 0.52, metalness: 0.82 });     // 铸铁
const M_STEEL_DARK = matStd(0x40444b, { roughness: 0.36, metalness: 0.9 });
const M_BRASS = matStd(PAL.brass, { roughness: 0.3, metalness: 1 });       // 黄铜（灯芯套/螺钉）
const M_RUBBER = matStd(0x2a2d33, { roughness: 0.9, metalness: 0.03 });    // 橡胶塞
const M_LATEX = matStd(0x4a4e58, { roughness: 0.86, metalness: 0.02 });    // 乳胶管
const M_CORK = matStd(0xb98d5a, { roughness: 0.85 });                      // 软木/木柄
const M_WOOD = matStd(0xc9a06a, { roughness: 0.8 });                       // 木条/火柴杆
const M_WICK = matStd(0xe8e2d2, { roughness: 1 });                         // 棉芯
const M_PAINT_BODY = matStd(0xe8eaee, { roughness: 0.42, metalness: 0.06 }); // 柜体烤漆
M_PAINT_BODY.roughnessMap = paintNoiseTexture(256, 2);
const M_DOOR = matStd(0xdfe3e9, { roughness: 0.4, metalness: 0.06 });
M_DOOR.roughnessMap = paintNoiseTexture(256, 2);

/* 滚花法线贴图（调节环防滑纹） */
function knurlNormalTexture(cols = 48) {
  const w = 512, h = 32;
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const ctx = cv.getContext('2d');
  for (let x = 0; x < w; x++) {
    const s = Math.sin((x / w) * cols * Math.PI * 2) * 0.75;
    ctx.fillStyle = `rgb(${Math.round((s * 0.5 + 0.5) * 255)},128,${Math.round(Math.sqrt(Math.max(0, 1 - s * s)) * 127 + 128)})`;
    ctx.fillRect(x, 0, 1, h);
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}
function matKnurl(color, cols = 48) {
  const m = matStd(color, { roughness: 0.4, metalness: 0.7 });
  m.normalMap = knurlNormalTexture(cols);
  m.normalScale = new THREE.Vector2(1.2, 1.2);
  return m;
}
const M_KNURL = matKnurl(0x8a9099);

/* 圆角矩形轮廓（absarc 四角），w×d 在 XY 面 */
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
/* 圆角平板（挤出 + 倒角，rotateX 落平：顶面 y ≈ h + bevel） */
function roundedSlab(w, d, h, r, mat, bevel = 0.01) {
  const g = new THREE.ExtrudeGeometry(roundedRectShape(w, d, r), {
    depth: h, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel,
    bevelSegments: 3, curveSegments: 12,
  });
  g.rotateX(-Math.PI / 2);
  return new THREE.Mesh(g, mat);
}

function lathe(pts, mat, seg = 32) {
  const geo = new THREE.LatheGeometry(pts.map((p) => new THREE.Vector2(p[0], p[1])), seg);
  return new THREE.Mesh(geo, mat);
}
function box(w, h, d, mat) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); }
function cyl(rt, rb, h, mat, seg = 16, open = false) {
  return new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg, 1, open), mat);
}

/* 液面高光贴片（弯月面，斜置细长亮条） */
function makeGleam(w = 0.3, h = 0.12) {
  const tex = canvasTex(128, 64, (ctx) => {
    ctx.clearRect(0, 0, 128, 64);
    const gg = ctx.createRadialGradient(40, 32, 2, 40, 32, 46);
    gg.addColorStop(0, 'rgba(255,255,250,0.85)');
    gg.addColorStop(0.5, 'rgba(255,255,250,0.25)');
    gg.addColorStop(1, 'rgba(255,255,250,0)');
    ctx.save();
    ctx.translate(64, 32);
    ctx.scale(1.35, 0.42);
    ctx.translate(-64, -32);
    ctx.fillStyle = gg;
    ctx.fillRect(0, 0, 128, 64);
    ctx.restore();
  });
  const m = mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
  m.rotation.x = -TAU / 4;
  return m;
}

/* ---------------- 玻璃器材（程序化深造型） ---------------- */

/* 试管：圆底 + 直身 + 卷边口沿 + 磨口加粗段 */
function makeTestTube(len = 0.13, r = 0.022) {
  const pts = [
    [0, 0.004], [r * 0.35, 0.004], [r * 0.72, 0.005], [r * 0.94, 0.011],
    [r, 0.02], [r, len - 0.012], [r * 1.04, len - 0.008], [r * 1.12, len - 0.004],
    [r * 1.16, len], [r * 1.02, len + 0.003],
  ];
  /* 主体器材玻璃略加厚着色（近景对墙时仍可读） */
  return lathe(pts, glassMat(0.32, 0xc6dbe6), 28);
}
/* 锥形瓶：底缘 + 直壁短裙 + 锥面 + 肩 + 颈 + 卷口 */
function makeFlask() {
  const pts = [
    [0, 0.003], [0.014, 0.003], [0.032, 0.006], [0.049, 0.012], [0.052, 0.022],
    [0.038, 0.062], [0.023, 0.1], [0.021, 0.126], [0.021, 0.142],
    [0.0235, 0.145], [0.0265, 0.15], [0.023, 0.153],
  ];
  return lathe(pts, glassMat(), 30);
}
/* 集气瓶：直身 + 厚底 + 磨边口沿（瓶口白边） */
function makeGasJar(h = 0.115, r = 0.045) {
  const pts = [
    [0, 0.005], [r * 0.55, 0.005], [r * 0.88, 0.008], [r, 0.014],
    [r, h - 0.008], [r * 1.06, h - 0.004], [r * 1.08, h], [r * 1.08, h + 0.006],
    [r * 1.0, h + 0.008],
  ];
  return lathe(pts, glassMat(), 30);
}
/* 毛玻璃片：磨砂面 + 边缘透明 */
function makeGlassPlate(r = 0.05) {
  const m = box(r * 2.2, 0.004, r * 2.2, glassMat(0.3, 0xe6eef4));
  m.rotation.y = 0.35;
  return m;
}
/* 橡胶塞：双锥台 + 穿孔暗孔 + 顶部圆角 */
function makeStopper(r = 0.0235, holes = 2) {
  const g = new THREE.Group();
  const body = lathe([
    [r * 0.6, 0], [r, 0.006], [r * 1.04, 0.014], [r * 0.96, 0.019], [r * 0.62, 0.024], [r * 0.6, 0.026],
  ], M_RUBBER, 22);
  g.add(body);
  const holeMat = matStd(0x1b1d22, { roughness: 0.7 });
  if (holes >= 1) {
    const h1 = cyl(0.0062, 0.0062, 0.03, holeMat, 10);
    h1.position.x = holes >= 2 ? -0.009 : 0;
    g.add(h1);
  }
  if (holes >= 2) {
    const h2 = cyl(0.0062, 0.0062, 0.03, holeMat, 10);
    h2.position.x = 0.009;
    g.add(h2);
  }
  return g;
}

/* 分液漏斗：上球腔 + 锥形下腔 + 磨口塞 + 旋塞（开度→手柄旋转）+ 尖嘴下管
 * 返回 { g, cock(旋塞组), liquid(漏斗内液组), liqSurf } */
function makeSepFunnel(scale = 1) {
  const g = new THREE.Group();
  const s = scale;
  /* 腔体：球形上腔 + 收锥 + 直管（Lathe 一体成形） */
  const body = lathe([
    [0.006 * s, 0.175 * s], [0.018 * s, 0.172 * s], [0.03 * s, 0.16 * s], [0.033 * s, 0.14 * s],
    [0.033 * s, 0.116 * s], [0.02 * s, 0.095 * s], [0.008 * s, 0.088 * s],
    [0.006 * s, 0.07 * s], [0.006 * s, 0.052 * s],
  ], glassMat(), 28);
  /* 顶口沿 + 磨口塞 */
  const rim = lathe([[0.007 * s, 0.175 * s], [0.02 * s, 0.179 * s], [0.021 * s, 0.185 * s], [0.019 * s, 0.187 * s]], glassMat(), 20);
  const stopperTop = lathe([[0.004 * s, 0.186 * s], [0.012 * s, 0.188 * s], [0.019 * s, 0.194 * s], [0.019 * s, 0.2 * s], [0.016 * s, 0.203 * s], [0.008 * s, 0.204 * s]], frostedMat(), 18);
  const knob = mesh(new THREE.SphereGeometry(0.009 * s, 10, 8), frostedMat());
  knob.position.y = 0.212 * s;
  /* 旋塞：横穿壳体 + 锥形阀芯 + 翼形手柄（绕 Z 轴旋转表达开度） */
  const cock = new THREE.Group();
  cock.position.y = 0.05 * s;
  const shell = box(0.026 * s, 0.016 * s, 0.016 * s, glassMat(0.5, 0xddeaf2));
  const vcore = cyl(0.0065 * s, 0.0065 * s, 0.03 * s, M_BRASS, 12);
  vcore.rotation.z = TAU / 4;
  const handle = new THREE.Group();
  const bar = box(0.008 * s, 0.008 * s, 0.052 * s, M_BRASS);
  const tipL = mesh(new THREE.SphereGeometry(0.006 * s, 8, 6), M_BRASS); tipL.position.z = -0.026 * s;
  const tipR = mesh(new THREE.SphereGeometry(0.006 * s, 8, 6), M_BRASS); tipR.position.z = 0.026 * s;
  handle.add(bar, tipL, tipR);
  cock.add(shell, vcore, handle);
  cock.userData.handle = handle;
  /* 尖嘴下管（尖端收口） */
  const stem = lathe([
    [0.0055 * s, 0.052 * s], [0.0055 * s, 0.018 * s], [0.005 * s, 0.008 * s], [0.0032 * s, 0.002 * s], [0.0038 * s, 0],
  ], glassMat(0.3, 0xb0c8d8), 14);
  g.add(body, rim, stopperTop, knob, cock, stem);
  /* 漏斗内液（加液动画：scale.y 0→1 + 位置跟随） */
  const liquid = new THREE.Group();
  const liq = mesh(new THREE.SphereGeometry(0.0315 * s, 20, 14, 0, TAU, 0, Math.PI * 0.62), liquidMat(0xdff2f8, 0.5));
  liq.rotation.x = Math.PI;
  liq.position.y = 0.148 * s;
  const liqSurf = mesh(new THREE.CircleGeometry(0.019 * s, 18), matCoat(0xeaf6fa, { roughness: 0.15, clearcoat: 0.4, opacity: 0.75, depthWrite: false }));
  liqSurf.rotation.x = -TAU / 4;
  liquid.add(liq, liqSurf);
  liquid.scale.y = 0.001;
  g.add(liquid);
  g.userData.cock = cock;
  g.userData.liquid = liquid;
  g.userData.liqSurf = liqSurf;
  g.userData.stemTipY = 0;
  return g;
}

/* 长颈漏斗：喇叭杯（翻边） + 长管 + 杯内液环（液封视觉） */
function makeThistleFunnel() {
  const g = new THREE.Group();
  const neck = cyl(0.0052, 0.0052, 0.165, glassMat(0.3, 0xb0c8d8), 14);
  neck.position.y = 0.0825;
  const cup = lathe([
    [0.0052, 0.162], [0.008, 0.166], [0.02, 0.172], [0.032, 0.178], [0.0345, 0.184],
    [0.036, 0.192], [0.034, 0.193], [0.0325, 0.186], [0.028, 0.181], [0.014, 0.174],
  ], glassMat(), 26);
  g.add(neck, cup);
  return g;
}

/* 酒精灯（精修）：灯壶 + 双层燃料 + 液面高光 + 黄铜芯套 + 棉芯 + 灯帽 + 双锥火焰 + 点光
 * 返回 { g, flame, flameCore, glow, light, cap(灯帽组), wick } */
function makeAlcoholLamp() {
  const g = new THREE.Group();
  /* 灯壶：鼓腹 → 收肩 → 颈口（Lathe） */
  const body = lathe([
    [0, 0.002], [0.012, 0.003], [0.026, 0.008], [0.0345, 0.018], [0.0355, 0.03],
    [0.03, 0.04], [0.013, 0.046], [0.0095, 0.052], [0.0105, 0.056], [0.012, 0.058],
  ], glassMat(0.28, 0xd8e4da), 30);
  /* 燃料：双层（底部缓升段 + 主体）+ 液面圆片 + 高光 */
  const fuelMat = liquidMat(0xa8d8ec, 0.4);
  const fuelLow = cyl(0.012, 0.024, 0.009, fuelMat, 18);
  fuelLow.position.y = 0.0125;
  const fuelMain = cyl(0.0335, 0.012, 0.015, fuelMat, 20);
  fuelMain.position.y = 0.0245;
  const fuelSurf = mesh(new THREE.CircleGeometry(0.0335, 20), matCoat(0xc2e6f2, { roughness: 0.14, clearcoat: 0.4, opacity: 0.7, depthWrite: false }));
  fuelSurf.rotation.x = -TAU / 4;
  fuelSurf.position.y = 0.0325;
  const gleam = makeGleam(0.05, 0.02);
  gleam.position.set(-0.008, 0.034, 0.016);
  /* 黄铜芯套 + 棉芯 */
  const collar = cyl(0.0125, 0.0135, 0.012, M_BRASS, 16);
  collar.position.y = 0.058;
  const wick = cyl(0.0032, 0.0042, 0.016, M_WICK, 8);
  wick.position.y = 0.066;
  g.add(body, fuelLow, fuelMain, fuelSurf, gleam, collar, wick);
  /* 灯帽（点燃时移到旁边，熄灭时盖回） */
  const cap = new THREE.Group();
  const capBody = lathe([
    [0.045, 0], [0.043, 0.004], [0.036, 0.014], [0.024, 0.024], [0.012, 0.03], [0.005, 0.032],
  ], glassMat(0.34, 0xcfdce2), 24);
  const capTop = mesh(new THREE.SphereGeometry(0.008, 10, 8), M_BRASS);
  capTop.position.y = 0.033;
  cap.add(capBody, capTop);
  cap.position.set(0.055, 0, 0.03);
  cap.rotation.z = -0.5;
  g.add(cap);
  /* 火焰：外焰锥 + 内焰锥 + glow 精灵 + 点光（挂 flame 组，随火力缩放） */
  const flame = new THREE.Group();
  const outer = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeGlowTexture('255,150,50', [[0, 'rgba(C,0.9)'], [0.4, 'rgba(C,0.4)'], [1, 'rgba(C,0)']]),
    blending: THREE.AdditiveBlending, transparent: true, depthWrite: false,
  }));
  outer.scale.set(0.05, 0.085, 1);
  outer.position.y = 0.014;
  const coneOuter = mesh(new THREE.ConeGeometry(0.0085, 0.03, 10, 1, true), new THREE.MeshBasicMaterial({
    color: 0xff9a40, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  }));
  coneOuter.position.y = 0.012;
  const coneInner = mesh(new THREE.ConeGeometry(0.0045, 0.018, 8, 1, true), new THREE.MeshBasicMaterial({
    color: 0xfff2cc, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  }));
  coneInner.position.y = 0.008;
  const light = new THREE.PointLight(0xffa040, 0, 0.7, 2);
  light.position.y = 0.03;
  flame.add(outer, coneOuter, coneInner, light);
  flame.position.y = 0.07;
  flame.visible = false;
  g.add(flame);
  g.userData = { flame, outer, coneOuter, coneInner, light, cap, wick };
  return g;
}

/* 铁架台（精修）：铸铁底座（圆角挤出 + 顶面筋条）+ 立杆 + 滚花调节环 + 顶帽 */
function makeStand() {
  const g = new THREE.Group();
  const base = roundedSlab(0.2, 0.28, 0.014, 0.024, M_CAST, 0.004);
  base.position.y = 0.008;
  /* 底座顶面筋条 */
  const ribs = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const rib = box(0.15, 0.004, 0.014, M_STEEL_DARK);
    rib.position.set(0, 0.0175, -0.08 + i * 0.08);
    ribs.add(rib);
  }
  const rod = cyl(0.0075, 0.0075, 0.56, M_SATIN, 14);
  rod.position.set(0, 0.288, -0.1);
  const rodCap = mesh(new THREE.SphereGeometry(0.009, 10, 8), M_SATIN);
  rodCap.position.set(0, 0.568, -0.1);
  /* 立杆根部的滚花锁紧环（车削件观感） */
  const lockRing = cyl(0.016, 0.018, 0.024, M_KNURL, 18);
  lockRing.position.set(0, 0.036, -0.1);
  g.add(base, ribs, rod, rodCap, lockRing);
  return g;
}

/* 烧瓶夹（精修）：关节球 + 长臂（沿 +z）+ 竖向茎 + 弹簧夹爪（弧形爪片）+ 橡胶衬垫 + 翼形螺钉
 * 返回 { g, jaw1, jaw2, wing(螺钉，夹紧时旋转) }，爪口世界位置 ≈ 局部 (0,0,0.28) */
function makeClamp() {
  const g = new THREE.Group();
  /* 十字夹头：双螺栓 + 环抱座（贴在立杆上） */
  const hub = cyl(0.013, 0.013, 0.036, M_CAST, 14);
  hub.rotation.x = TAU / 4;
  hub.position.z = 0.014;
  const boltA = cyl(0.005, 0.005, 0.016, M_CHROME, 8);
  boltA.rotation.x = TAU / 4; boltA.position.set(0, 0, 0.036);
  const boltB = cyl(0.005, 0.005, 0.016, M_CHROME, 8);
  boltB.position.set(0, 0.02, 0.006);
  /* 关节球 + 短颈 */
  const knuckle = mesh(new THREE.SphereGeometry(0.012, 12, 10), M_CAST);
  knuckle.position.z = 0.036;
  /* 长臂：两段（近粗远细）+ 中段滚花握纹 */
  const armA = cyl(0.006, 0.0068, 0.12, M_SATIN, 12);
  armA.rotation.x = TAU / 4; armA.position.z = 0.098;
  const armB = cyl(0.0052, 0.006, 0.17, M_SATIN, 12);
  armB.rotation.x = TAU / 4; armB.position.z = 0.235;
  /* 竖向茎 + 夹爪座 */
  const stem = cyl(0.005, 0.005, 0.05, M_SATIN, 10);
  stem.position.set(0, -0.02, 0.282);
  const jawSeat = box(0.03, 0.014, 0.012, M_CAST);
  jawSeat.position.set(0, 0, 0.286);
  /* 弹簧夹爪 ×2：弧形爪片（Torus 半环）+ 橡胶衬垫 + 翼形螺钉 */
  const jawMat = M_SATIN;
  function jaw(sign) {
    const grp = new THREE.Group();
    const arc = mesh(new THREE.TorusGeometry(0.014, 0.0032, 8, 14, Math.PI * 0.62), jawMat);
    arc.rotation.z = sign > 0 ? Math.PI * 0.19 : -Math.PI * 0.81;
    arc.position.set(0, sign * 0.008, 0);
    const pad = box(0.026, 0.004, 0.008, M_RUBBER);
    pad.position.set(0, sign * 0.004, 0.004);
    grp.add(arc, pad);
    grp.position.z = 0.292;
    return grp;
  }
  const jaw1 = jaw(1); jaw1.position.y = 0.012;
  const jaw2 = jaw(-1); jaw2.position.y = -0.012;
  /* 翼形螺钉（夹紧动画：绕 x 旋紧） */
  const wing = new THREE.Group();
  const screw = cyl(0.0035, 0.0035, 0.014, M_CHROME, 8);
  screw.rotation.x = TAU / 4;
  const wingL = box(0.004, 0.016, 0.004, M_CHROME); wingL.position.y = 0.008;
  const wingR = box(0.004, 0.016, 0.004, M_CHROME); wingR.position.y = -0.008;
  wing.add(screw, wingL, wingR);
  wing.position.set(0.014, 0.02, 0.286);
  g.add(hub, boltA, boltB, knuckle, armA, armB, stem, jawSeat, jaw1, jaw2, wing);
  g.userData = { jaw1, jaw2, wing };
  return g;
}

/* 水槽：厚壁玻璃缸（圆角外轮廓 + 内腔挖孔一次挤出）+ 水（液面 + 高光） */
function makeTrough() {
  const g = new THREE.Group();
  const w = 0.26, h = 0.075, d = 0.15, wall = 0.005;
  const outer = roundedRectShape(w, d, 0.018);
  const hole = new THREE.Path();
  const inner = roundedRectShape(w - wall * 2, d - wall * 2, 0.012);
  /* 内腔路径按外轮廓中心对齐（roundedRectShape 以原点为中心） */
  hole.curves = inner.curves;
  outer.holes.push(hole);
  const geo = new THREE.ExtrudeGeometry(outer, {
    depth: h, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004,
    bevelSegments: 2, curveSegments: 10,
  });
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, h + 0.004, 0);
  const tank = new THREE.Mesh(geo, glassMat(0.26));
  const water = box(w - 0.02, h - 0.026, d - 0.02, liquidMat(0x8ecbe2, 0.36));
  water.position.y = (h - 0.026) / 2 + 0.008;
  const wSurf = mesh(new THREE.PlaneGeometry(w - 0.02, d - 0.02), matCoat(0xa8d8ec, { roughness: 0.12, clearcoat: 0.5, opacity: 0.5, depthWrite: false }));
  wSurf.rotation.x = -TAU / 4;
  wSurf.position.y = h - 0.012;
  const gleam = makeGleam(0.16, 0.06);
  gleam.position.set(-0.04, h - 0.008, 0.03);
  g.add(tank, water, wSurf, gleam);
  g.userData.water = water;
  return g;
}

/* 导管：CatmullRom 玻璃管（两端磨口加粗） */
function tubeAlong(points, radius = 0.004) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
  const grp = new THREE.Group();
  const main = new THREE.Mesh(new THREE.TubeGeometry(curve, 44, radius, 8), glassMat(0.3, 0xb0c8d8));
  grp.add(main);
  /* 两端磨口加粗环 */
  for (const t of [0, 1]) {
    const p = curve.getPointAt(t);
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(radius * 1.5, radius * 1.7, 0.012, 10), frostedMat());
    const tan = curve.getTangentAt(t);
    collar.lookAt(p.clone().add(tan));
    collar.position.copy(p);
    grp.add(collar);
  }
  return { mesh: grp, curve };
}

/* 木条（带火星端头）：杆身 + 红热火星点 + 火焰（复燃时点亮） */
function makeSplint(len = 0.1) {
  const g = new THREE.Group();
  const stick = box(len, 0.005, 0.005, M_WOOD);
  const tip = mesh(new THREE.SphereGeometry(0.0035, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff6a20 }));
  tip.position.x = -len / 2 - 0.002;
  const fl = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeGlowTexture('255,170,60', [[0, 'rgba(C,0.95)'], [0.4, 'rgba(C,0.45)'], [1, 'rgba(C,0)']]),
    blending: THREE.AdditiveBlending, transparent: true, depthWrite: false,
  }));
  fl.scale.set(0.03, 0.05, 1);
  fl.position.copy(tip.position);
  fl.visible = false;
  g.add(stick, tip, fl);
  g.userData = { tip, fl };
  return g;
}

/* 铁丝（螺旋 + 火柴）：下部螺旋绕成弹簧状 + 火柴杆 + 火柴火焰 */
function makeIronWire() {
  const g = new THREE.Group();
  const pts = [];
  const turns = 5, H = 0.05, R = 0.008;
  for (let i = 0; i <= 60; i++) {
    const t = i / 60;
    pts.push(new THREE.Vector3(Math.cos(t * turns * TAU) * R, 0.02 + t * H, Math.sin(t * turns * TAU) * R));
  }
  pts.push(new THREE.Vector3(0, 0.09, 0));
  const curve = new THREE.CatmullRomCurve3(pts);
  const wire = new THREE.Mesh(new THREE.TubeGeometry(curve, 90, 0.0012, 6), matStd(0x5a616b, { roughness: 0.35, metalness: 0.9 }));
  /* 直杆上段（手持段） */
  const shaft = cyl(0.0012, 0.0012, 0.05, matStd(0x5a616b, { roughness: 0.35, metalness: 0.9 }), 6);
  shaft.position.y = 0.115;
  /* 火柴：木杆 + 红头 + 火焰（点燃时） */
  const match = box(0.032, 0.003, 0.003, M_WOOD);
  match.position.set(0.018, 0.022, 0);
  const head = mesh(new THREE.SphereGeometry(0.0028, 8, 6), matStd(0x7a2a24, { roughness: 0.6 }));
  head.position.set(0.035, 0.022, 0);
  const fl = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeGlowTexture('255,170,60', [[0, 'rgba(C,0.95)'], [0.4, 'rgba(C,0.45)'], [1, 'rgba(C,0)']]),
    blending: THREE.AdditiveBlending, transparent: true, depthWrite: false,
  }));
  fl.scale.set(0.026, 0.042, 1);
  fl.position.set(0.037, 0.03, 0);
  fl.visible = false;
  g.add(wire, shaft, match, head, fl);
  g.userData = { fl, head };
  return g;
}

/* 阶梯蜡烛（精修）：蜡身渐变纹理 + 烛泪环 + 烛芯 + 火焰 */
function makeCandle(h) {
  const grp = new THREE.Group();
  const tex = canvasTex(64, 128, (ctx) => {
    const g2 = ctx.createLinearGradient(0, 0, 64, 0);
    g2.addColorStop(0, '#e8dfc8');
    g2.addColorStop(0.5, '#f6efdc');
    g2.addColorStop(1, '#d8cdb2');
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, 64, 128);
    for (let i = 0; i < 26; i++) {
      ctx.fillStyle = `rgba(180,168,140,${0.14 + Math.random() * 0.16})`;
      ctx.fillRect(Math.random() * 64, Math.random() * 128, 1.6, 6 + Math.random() * 14);
    }
  });
  const bodyMat = matStd(0xffffff, { roughness: 0.42 });
  bodyMat.map = tex;
  const body = cyl(0.008, 0.0095, h, bodyMat, 16);
  body.position.y = h / 2;
  /* 烛泪环（顶部外翻薄环） */
  const tear = cyl(0.0105, 0.009, 0.006, matStd(0xf2ead4, { roughness: 0.3 }), 16);
  tear.position.y = h - 0.002;
  const wick = cyl(0.0012, 0.0012, 0.009, matStd(0x2e2a24, { roughness: 0.9 }), 6);
  wick.position.y = h + 0.004;
  const fl = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeGlowTexture('255,190,90', [[0, 'rgba(C,0.95)'], [0.45, 'rgba(C,0.4)'], [1, 'rgba(C,0)']]),
    blending: THREE.AdditiveBlending, transparent: true, depthWrite: false,
  }));
  fl.scale.set(0.022, 0.038, 1);
  fl.position.y = h + 0.018;
  grp.add(body, tear, wick, fl);
  return { grp, fl };
}

/* ---------------- 实验室环境（全程序化：地面 / 墙面 / 海报 / 实验台） ---------------- */

const worldG = new THREE.Group();
scene.add(worldG);

function buildWorld() {
  /* 地面：混凝土（程序化纹理） */
  const floorTex = concreteTexture(512);
  floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
  floorTex.repeat.set(7, 5);
  const floorMat = matStd(0xffffff, { roughness: 0.88, metalness: 0.04 });
  floorMat.map = floorTex;
  const floor = mesh(new THREE.PlaneGeometry(16, 12), floorMat);
  floor.rotation.x = -Math.PI / 2;
  worldG.add(floor);
  /* 墙面：涂料 + 踢脚线 + 化学海报 ×2 */
  const wallTex = wallPaintTexture(512);
  wallTex.wrapS = wallTex.wrapT = THREE.RepeatWrapping;
  wallTex.repeat.set(6, 2);
  const wallMat = matStd(0xffffff, { roughness: 0.9 });
  wallMat.map = wallTex;
  const wall = mesh(new THREE.PlaneGeometry(16, 5), wallMat);
  wall.position.set(0, 2.5, -2.6);
  worldG.add(wall);
  const skirt = box(16, 0.14, 0.02, matStd(0x565a60, { roughness: 0.5 }));
  skirt.position.set(0, 0.07, -2.59);
  worldG.add(skirt);
  const poster1Mat = matStd(0xffffff, { roughness: 0.85 });
  poster1Mat.map = posterTexture('periodic');
  const poster1 = mesh(new THREE.PlaneGeometry(0.72, 0.96), poster1Mat);
  poster1.position.set(-2.9, 1.72, -2.585);
  poster1.rotation.y = 0.06;
  worldG.add(poster1);
  const poster2Mat = matStd(0xffffff, { roughness: 0.85 });
  poster2Mat.map = posterTexture('safety');
  const poster2 = mesh(new THREE.PlaneGeometry(0.72, 0.96), poster2Mat);
  poster2.position.set(2.9, 1.72, -2.585);
  poster2.rotation.y = -0.06;
  worldG.add(poster2);
  /* 实验台：柜体（烤漆 + 三门 + 拉手）+ 木质台面（木纹 + 前后封边） */
  const benchBody = box(4.9, 0.85, 1.5, M_PAINT_BODY);
  benchBody.position.set(0, 0.425, -0.05);
  worldG.add(benchBody);
  for (let i = 0; i < 3; i++) {
    const door = box(1.42, 0.62, 0.02, M_DOOR);
    door.position.set(-1.5 + i * 1.5, 0.36, 0.706);
    worldG.add(door);
    const seam = box(1.44, 0.006, 0.022, matStd(0x9aa0a8, { roughness: 0.5, metalness: 0.4 }));
    seam.position.set(-1.5 + i * 1.5, 0.66, 0.707);
    worldG.add(seam);
    const handle = cyl(0.008, 0.008, 0.14, M_SATIN, 10);
    handle.rotation.z = TAU / 4;
    handle.position.set(-1.5 + i * 1.5, 0.36, 0.728);
    worldG.add(handle);
  }
  const woodTop = makeWoodTexture({ base: '#6a4526', dark: '#4a2f18', light: '#7f5c33', streaks: 110, bands: 8, seed: 23 });
  woodTop.repeat.set(3.4, 1.1);
  const topMat = matStd(0xffffff, { roughness: 0.58, metalness: 0.04 });
  topMat.map = woodTop;
  const benchTop = box(5.0, 0.05, 1.6, topMat);
  benchTop.position.set(0, 0.875, -0.05);
  worldG.add(benchTop);
  const edgeF = box(5.0, 0.06, 0.03, matStd(0x4e341e, { roughness: 0.7 }));
  edgeF.position.set(0, 0.875, 0.755);
  const edgeB = box(5.0, 0.06, 0.03, matStd(0x4e341e, { roughness: 0.7 }));
  edgeB.position.set(0, 0.875, -0.855);
  worldG.add(edgeF, edgeB);
}
const BENCH_Y = 0.9; // 台面高度

/* ---------------- 桌面道具阵列（叙事：试剂瓶 / 试管架 / 火柴 / 镊子 / 天平 / 过滤台） ---------------- */

const propG = new THREE.Group();
scene.add(propG);
const equipLabels = [];   // 器材名称标签（大屏 toggle 统一显隐）

/* 试剂瓶：Lathe 瓶身 + 双层内液 + 液面高光 + 弧面标签 + 瓶盖（micro 工艺同款） */
function makeBottle(x, z, o, heightScale = 1) {
  const g = new THREE.Group();
  g.position.set(x, BENCH_Y, z);
  const prof = [
    [0.0, 0], [0.26, 0], [0.3, 0.03], [0.36, 0.18], [0.4, 0.42], [0.36, 0.62], [0.2, 0.78], [0.14, 0.88], [0.14, 1.0], [0.17, 1.04],
  ].map(([r, y]) => new THREE.Vector2(r, y * heightScale));
  const glass = matCoat(0xdfeae8, { roughness: 0.08, opacity: 0.3 });
  const body = mesh(new THREE.LatheGeometry(prof, 24), glass);
  g.add(body);
  const lv = (o.level ?? 0.52) * heightScale;
  const liqMat2 = matStd(o.liquid, { roughness: 0.25, emissive: o.liquid, emissiveIntensity: o.glow ?? 0.3 });
  const liqLow = mesh(new THREE.CylinderGeometry(0.26, 0.21, 0.1 * heightScale, 18), liqMat2);
  liqLow.position.y = 0.1 * heightScale;
  const liqMain = mesh(new THREE.CylinderGeometry(0.295, 0.26, (lv - 0.16) * heightScale, 18), liqMat2);
  liqMain.position.y = (0.15 + (lv - 0.16) / 2) * heightScale;
  const surf = mesh(new THREE.CircleGeometry(0.295, 20), matCoat(o.surf ?? o.liquid, {
    roughness: 0.14, clearcoat: 0.35, emissive: o.liquid, emissiveIntensity: (o.glow ?? 0.3) * 1.5, envMapIntensity: 0.55, opacity: 0.92, depthWrite: false,
  }));
  surf.rotation.x = -TAU / 4;
  surf.position.y = lv + 0.002;
  const gleam = makeGleam(0.3, 0.14);
  gleam.position.set(-0.05, lv + 0.006, 0.1);
  g.add(liqLow, liqMain, surf, gleam);
  const cap = cyl(0.16, 0.16, 0.12 * heightScale, M_RUBBER, 16);
  cap.position.y = 1.1 * heightScale;
  g.add(cap);
  /* 标签：弧面圆柱贴片（贴合瓶身，文字天然正向） */
  const lblTex = makeLabelTexture([o.name, o.sub], { w: 320, h: 200, lineSizes: [54, 28] });
  const lbMat = matStd(0xffffff, { roughness: 0.85, metalness: 0 });
  lbMat.map = lblTex;
  const lb = mesh(new THREE.CylinderGeometry(0.378, 0.396, 0.3 * heightScale, 16, 1, true, -0.52, 1.04), lbMat);
  lb.position.y = 0.42 * heightScale;
  g.add(lb);
  bakeContactShadow(x, z, 0.5, 0.5, 0.3);
  return g;
}

function buildProps() {
  /* 试剂瓶阵列：高锰酸钾 / 过氧化氢 / 稀盐酸 / 澄清石灰水（B/C 工位后方一排） */
  const bottles = [
    { x: -0.62, z: -0.52, o: { liquid: 0x5a2a72, surf: 0x6a347e, name: '高锰酸钾', sub: 'KMnO₄ · 紫黑晶体' } },
    { x: -0.28, z: -0.55, o: { liquid: 0xd8ecf4, surf: 0xe8f4f8, name: '过氧化氢', sub: 'H₂O₂ · 5%' } },
    { x: 0.72, z: -0.52, o: { liquid: 0xe2eef4, surf: 0xeef6fa, name: '稀盐酸', sub: 'HCl · 稀' } },
    { x: 1.06, z: -0.55, o: { liquid: 0xeef6fa, surf: 0xf6fafc, name: '澄清石灰水', sub: 'Ca(OH)₂' } },
  ];
  for (const b of bottles) {
    const s = 0.22;
    const g = makeBottle(b.x, b.z, b.o);
    g.scale.set(s, s, s);
    propG.add(g);
  }
  /* 试管架 + 空试管（InstancedMesh 管）+ 架板 */
  const rack = new THREE.Group();
  rack.position.set(-2.22, BENCH_Y, 0.32);
  const plate = roundedSlab(0.2, 0.1, 0.012, 0.016, matStd(0xd8d2c4, { roughness: 0.6 }), 0.004);
  plate.position.y = 0.014;
  const plate2 = plate.clone();
  plate2.position.y = 0.052;
  const tubeGeo = new THREE.CylinderGeometry(0.011, 0.011, 0.07, 10, 1, true);
  const tubes = new THREE.InstancedMesh(tubeGeo, glassMat(0.3), 4);
  tubes.instanceMatrix.setUsage(THREE.StaticDrawUsage);
  const _m = new THREE.Matrix4();
  for (let i = 0; i < 4; i++) {
    _m.makeTranslation(-0.06 + i * 0.04, 0.05, 0);
    tubes.setMatrixAt(i, _m);
  }
  rack.add(plate, plate2, tubes);
  propG.add(rack);
  bakeContactShadow(-2.22, 0.32, 0.24, 0.14, 0.3);
  /* 火柴盒（磷皮贴图）+ 火柴 ×3（InstancedMesh） */
  const mbox = new THREE.Group();
  mbox.position.set(1.16, BENCH_Y, -0.34);
  mbox.rotation.y = -0.4;
  const mbody = box(0.09, 0.022, 0.05, matStd(0xd8cdb4, { roughness: 0.7 }));
  const mcore = box(0.086, 0.016, 0.046, matStd(0xcfc2a6, { roughness: 0.8 }));
  mcore.position.z = -0.002;
  const strikeMat = matStd(0xffffff, { roughness: 0.85 });
  strikeMat.map = strikerTexture();
  const strike = box(0.03, 0.024, 0.002, strikeMat);
  strike.position.set(0.028, 0, 0.0252);
  mbox.add(mbody, mcore, strike);
  propG.add(mbox);
  bakeContactShadow(1.16, -0.34, 0.12, 0.08, 0.3);
  const matchGeo = new THREE.CylinderGeometry(0.0016, 0.0016, 0.05, 6);
  const matches = new THREE.InstancedMesh(matchGeo, M_WOOD, 3);
  const _m2 = new THREE.Matrix4();
  const _e = new THREE.Euler();
  const _q = new THREE.Quaternion();
  for (let i = 0; i < 3; i++) {
    _e.set(0, 0.2 + i * 0.16, 1.52 + Math.PI / 2);
    _q.setFromEuler(_e);
    _m2.compose(new THREE.Vector3(1.06 + i * 0.022, BENCH_Y + 0.003, -0.2), _q, new THREE.Vector3(1, 1, 1));
    matches.setMatrixAt(i, _m2);
  }
  propG.add(matches);
  /* 镊子：两臂 + 铆钉 */
  const tz = new THREE.Group();
  tz.position.set(1.32, BENCH_Y + 0.004, 0.06);
  tz.rotation.y = 0.7;
  const armGeo = new THREE.BoxGeometry(0.006, 0.002, 0.09);
  const a1 = mesh(armGeo, M_SATIN); a1.position.set(-0.0035, 0, -0.02); a1.rotation.y = 0.06;
  const a2 = mesh(armGeo, M_SATIN); a2.position.set(0.0035, 0, -0.02); a2.rotation.y = -0.06;
  const tipJ = box(0.012, 0.002, 0.012, M_SATIN);
  tipJ.position.set(0, 0, 0.032);
  const rivet = cyl(0.003, 0.003, 0.004, M_CHROME, 8);
  rivet.position.set(0, 0.002, 0.008);
  tz.add(a1, a2, tipJ, rivet);
  propG.add(tz);
  /* 托盘天平：底座 + 立柱 + 横梁 + 双盘 + 指针表盘（回收称量 MnO₂ 的道具） */
  const bal = new THREE.Group();
  bal.position.set(2.3, BENCH_Y, 0.3);
  bal.rotation.y = -0.5;
  const balBase = roundedSlab(0.24, 0.14, 0.02, 0.02, M_CAST, 0.004);
  balBase.position.y = 0.012;
  const balCol = cyl(0.008, 0.01, 0.16, M_SATIN, 12);
  balCol.position.y = 0.1;
  const beam = box(0.3, 0.008, 0.012, M_SATIN);
  beam.position.y = 0.19;
  const center = mesh(new THREE.SphereGeometry(0.012, 10, 8), M_BRASS);
  center.position.y = 0.19;
  const dialMat = matStd(0xffffff, { roughness: 0.5 });
  dialMat.map = dialTexture();
  const dial = cyl(0.05, 0.05, 0.006, dialMat, 20);
  dial.rotation.x = TAU / 4;
  dial.position.set(0, 0.19, 0.02);
  const needle = box(0.002, 0.002, 0.05, matStd(0xc23a2e, { roughness: 0.4, metalness: 0.3 }));
  needle.position.set(0, 0.19, 0.026);
  needle.rotation.x = 0.5;
  function pan(px) {
    const grp = new THREE.Group();
    const dish = cyl(0.045, 0.038, 0.008, matStd(0xe4e7ec, { roughness: 0.3, metalness: 0.7 }), 20);
    dish.position.y = -0.078;
    const link = cyl(0.0016, 0.0016, 0.05, M_CHROME, 6);
    link.position.y = -0.052;
    grp.add(dish, link);
    grp.position.set(px, 0.186, 0);
    return grp;
  }
  bal.add(balBase, balCol, beam, center, dial, needle, pan(-0.14), pan(0.14));
  propG.add(bal);
  bakeContactShadow(2.3, 0.3, 0.3, 0.2, 0.3);
  /* 过滤台：烧杯 + 漏斗 + 滤纸（回收 MnO₂ 叙事道具） */
  const filt = new THREE.Group();
  filt.position.set(-1.28, BENCH_Y, -0.52);
  const beaker = cyl(0.032, 0.03, 0.06, glassMat(0.3), 18, true);
  beaker.position.y = 0.032;
  const bLip = cyl(0.034, 0.032, 0.004, glassMat(0.3), 18, true);
  bLip.position.y = 0.064;
  const bBase = cyl(0.03, 0.032, 0.004, glassMat(0.35), 18);
  bBase.position.y = 0.003;
  const fun = lathe([
    [0.004, 0.1], [0.006, 0.098], [0.006, 0.06], [0.03, 0.104], [0.033, 0.11], [0.033, 0.116], [0.031, 0.117],
  ], glassMat(0.3, 0xb0c8d8), 20);
  /* 滤纸锥（白色圆锥贴合漏斗内壁） */
  const paper = mesh(new THREE.ConeGeometry(0.026, 0.034, 14, 1, true), matStd(0xf6f4ee, { roughness: 0.9, side: THREE.DoubleSide }));
  paper.position.y = 0.094;
  filt.add(beaker, bLip, bBase, fun, paper);
  propG.add(filt);
  bakeContactShadow(-1.28, -0.52, 0.1, 0.1, 0.26);
}
/* ---------------- 工位 A：加热高锰酸钾制氧气 ---------------- */

const stA = {
  group: new THREE.Group(), step: 0, lit: false, preheatDone: false, tiltUp: false,
  heating: false, heatT: 0, power: 1, collected: 0, purity: 0.98, kmno4: 3.0,
  fault: false, collecting: false, fullToast: false, jarOut: false, swingT: -1, swingDir: 1,
};
scene.add(stA.group);

let A = {};
function buildStationA() {
  const g = stA.group;
  const stand = makeStand();
  stand.position.set(-1.78, BENCH_Y, -0.36);
  const clamp = makeClamp();
  clamp.position.set(-1.78, 1.02, -0.475);
  clamp.rotation.y = 0.56;   /* 臂斜伸：爪口落在试管 1/3 处（x≈-1.60, z≈-0.19） */
  /* 试管组（含药品/棉花/瓶塞），管口可向下/向上倾斜（定的选择） */
  const tube = makeTestTube();
  const tubeG = new THREE.Group();
  tubeG.add(tube);
  const drugMat = matStd(0xffffff, { roughness: 0.95 });
  drugMat.map = kmno4Texture();
  drugMat.emissive = new THREE.Color(0x4a1f5e);
  drugMat.emissiveIntensity = 0.3;
  drugMat.emissiveMap = drugMat.map;
  const drug = mesh(new THREE.ConeGeometry(0.014, 0.016, 14), drugMat);
  drug.position.set(-0.042, 0.009, 0);
  drug.visible = false;
  const cotton = mesh(new THREE.SphereGeometry(0.009, 10, 8), matStd(0xf2f0ea, { roughness: 1 }));
  cotton.position.set(0.052, 0.006, 0);
  cotton.scale.set(1.25, 0.72, 1);
  cotton.visible = false;
  const stopper = makeStopper(0.0235, 1);
  stopper.position.set(0.068, -0.006, 0);
  tubeG.add(drug, cotton, stopper);
  tubeG.position.set(-1.615, 1.02, -0.18);
  tubeG.rotation.z = -0.14;
  /* 导管：塞口 → 下弯 → 水槽（乳胶管段衔接玻璃直管） */
  const del = tubeAlong([
    [-1.547, 1.004, -0.18], [-1.5, 0.99, -0.17], [-1.44, 0.955, -0.16],
    [-1.36, 0.93, -0.06], [-1.26, 0.93, 0.08], [-1.14, 0.94, 0.2], [-1.075, 0.965, 0.27],
  ], 0.0038);
  /* 酒精灯 + 预热底座 */
  const lamp = makeAlcoholLamp();
  lamp.position.set(-1.655, BENCH_Y, -0.18);
  bakeContactShadow(-1.655, -0.18, 0.1, 0.1, 0.32);
  bakeContactShadow(-1.78, -0.36, 0.26, 0.34, 0.36);
  /* 水槽 + 倒扣集气瓶 + 玻璃片 */
  const trough = makeTrough();
  trough.position.set(-1.06, BENCH_Y, 0.28);
  bakeContactShadow(-1.06, 0.28, 0.3, 0.2, 0.34);
  const jar = makeGasJar();
  const jarG = new THREE.Group();
  jarG.add(jar);
  const jarWater = mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.105, 20), liquidMat(0x8ecbe2, 0.38));
  jarWater.position.y = 0.0525;
  jarG.add(jarWater);
  jarG.rotation.x = Math.PI;
  jarG.position.set(-1.06, 1.079, 0.28);
  const plate = makeGlassPlate();
  plate.position.set(-1.06, 1.26, 0.28);
  plate.visible = false;
  /* 器材名称标签（器材名称 toggle 统一显隐） */
  const lbls = [
    ['试管', -1.615, 1.165, -0.18, '#ffd9a8'],
    ['高锰酸钾', -1.705, 1.052, -0.125, '#d8a8f0'],
    ['棉花', -1.545, 1.098, -0.125, '#eef0ee'],
    ['铁架台', -1.78, 1.56, -0.36, '#cfd6df'],
    ['酒精灯', -1.665, 0.962, -0.18, '#ffc98a'],
    ['导气管', -1.3, 1.03, 0.05, '#a8d4e8'],
    ['水槽', -1.06, 1.03, 0.28, '#9fd4e8'],
    ['集气瓶', -1.06, 1.22, 0.28, '#9fd4e8'],
  ];
  for (const [t, x, y, z, c] of lbls) {
    const s = label(t, c);
    s.position.set(x, y, z);
    g.add(s);
    equipLabels.push(s);
  }
  g.add(stand, clamp, tubeG, del.mesh, lamp, trough, jarG, plate);
  A = { stand, clamp, tubeG, drug, cotton, stopper, del, lamp, trough, jarG, jarWater, plate, ...clamp.userData };
}

/* ---------------- 工位 B：分解过氧化氢制氧气 ---------------- */

const stB = { group: new THREE.Group(), running: false, step: 0, cock: 0.55, mno2Added: false, mno2Recycled: false, mode: 'drain', collected: 0, total: 0, funnelML: 0 };
scene.add(stB.group);

let B = {};
function buildStationB() {
  const g = stB.group;
  const flask = makeFlask();
  flask.position.set(0, BENCH_Y, 0.02);
  /* 瓶内液（H₂O₂，注入后可见） */
  const liquid = mesh(new THREE.CylinderGeometry(0.045, 0.048, 0.055, 22), liquidMat(0xcfeef7, 0.42));
  liquid.position.set(0, BENCH_Y + 0.028, 0.02);
  liquid.visible = false;
  /* MnO₂ 粉末堆（黑色颗粒锥） */
  const mno2 = mesh(new THREE.ConeGeometry(0.02, 0.014, 16), matStd(0x15161a, { roughness: 0.95 }));
  mno2.position.set(0, BENCH_Y + 0.009, 0.02);
  mno2.visible = false;
  const stopper = makeStopper(0.0255, 2);
  stopper.position.set(0, BENCH_Y + 0.143, 0.02);
  /* 分液漏斗（旋塞可转）+ 液封位置 */
  const funnel = makeSepFunnel(0.92);
  funnel.position.set(-0.009, BENCH_Y + 0.13, 0.02);
  /* 两条导管：排水法（管口没入水槽）/ 向上排空气（管口伸入瓶内） */
  const delDrain = tubeAlong([
    [0.009, BENCH_Y + 0.148, 0.02], [0.06, BENCH_Y + 0.14, 0.03], [0.16, BENCH_Y + 0.1, 0.12],
    [0.3, BENCH_Y + 0.05, 0.18], [0.42, BENCH_Y + 0.03, 0.24], [0.55, BENCH_Y + 0.03, 0.28],
  ], 0.0038);
  const delAir = tubeAlong([
    [0.009, BENCH_Y + 0.148, 0.02], [0.06, BENCH_Y + 0.14, 0.03], [0.16, BENCH_Y + 0.1, 0.12],
    [0.34, BENCH_Y + 0.1, 0.2], [0.46, BENCH_Y + 0.15, 0.26], [0.55, BENCH_Y + 0.06, 0.28],
  ], 0.0038);
  const trough = makeTrough();
  trough.position.set(0.55, BENCH_Y, 0.28);
  bakeContactShadow(0.55, 0.28, 0.3, 0.2, 0.34);
  bakeContactShadow(0, 0.02, 0.16, 0.14, 0.3);
  const jarU = makeGasJar();
  const jarUG = new THREE.Group();
  jarUG.add(jarU);
  const jarUFill = mesh(new THREE.CylinderGeometry(0.041, 0.041, 0.11, 20), new THREE.MeshBasicMaterial({
    color: 0x9fd4e8, transparent: true, opacity: 0.12, depthWrite: false,
  }));
  jarUFill.position.y = 0.055; jarUFill.scale.y = 0.001;
  jarUG.add(jarUFill);
  jarUG.position.set(0.55, BENCH_Y, 0.28);
  const plateU = makeGlassPlate(); plateU.position.set(0.55, BENCH_Y + 0.122, 0.28); plateU.rotation.z = 0.12;
  const jarD = makeGasJar();
  const jarDG = new THREE.Group();
  jarDG.add(jarD);
  const jarDWater = mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.105, 20), liquidMat(0x8ecbe2, 0.38));
  jarDWater.position.y = 0.0525;
  jarDG.add(jarDWater);
  jarDG.position.set(0.55, BENCH_Y + 0.172, 0.28);
  jarDG.rotation.x = Math.PI;
  /* 器材名称标签 */
  const lbls = [
    ['分液漏斗', -0.02, 1.34, 0.02, '#a8d4e8'],
    ['活塞', -0.06, 0.955, 0.02, '#ffd9a8'],
    ['锥形瓶', 0, 1.11, 0.02, '#cfd6df'],
    ['二氧化锰', 0.06, 0.94, 0.02, '#9aa0a8'],
    ['导气管', 0.3, 1.0, 0.18, '#a8d4e8'],
    ['集气瓶', 0.55, 1.1, 0.28, '#9fd4e8'],
    ['水槽', 0.55, 1.04, 0.28, '#9fd4e8'],
  ];
  for (const [t, x, y, z, c] of lbls) {
    const s = label(t, c);
    s.position.set(x, y, z);
    g.add(s);
    equipLabels.push(s);
  }
  g.add(flask, liquid, mno2, stopper, funnel, delDrain.mesh, delAir.mesh, trough, jarUG, plateU, jarDG);
  B = { flask, liquid, mno2, stopper, funnel, delDrain, delAir, del: delDrain, trough, jarUG, jarUFill, plateU, jarDG, jarDWater, bubbleXZ: [0, 0.02] };
}

/* ---------------- 工位 C：制取二氧化碳 ---------------- */

const stC = { group: new THREE.Group(), running: false, step: 0, acid: 'hcl', form: 'chunk', acidML: 0, sealed: false, placed: false, collected: 0, total: 0, chokeT: 0, limeCloud: 0 };
scene.add(stC.group);

let C = {};
function buildStationC() {
  const g = stC.group;
  const flask = makeFlask();
  flask.position.set(1.5, BENCH_Y, 0.02);
  /* 酸液（注酸后出现；scale.y 表液量） */
  const liquid = mesh(new THREE.CylinderGeometry(0.046, 0.049, 0.058, 22), liquidMat(0xdff2f8, 0.42));
  liquid.position.set(1.5, BENCH_Y + 0.03, 0.02);
  liquid.scale.y = 0.001;
  /* 大理石块（fbm 顶点扰动 + 大理石纹理）×5 */
  const marbleTex = marbleTexture(256);
  const chips = new THREE.Group();
  const chipGeo = new THREE.DodecahedronGeometry(0.0085, 1);
  {
    const pa = chipGeo.attributes.position;
    for (let i = 0; i < pa.count; i++) {
      const j = 0.86 + Math.random() * 0.3;
      pa.setXYZ(i, pa.getX(i) * j, pa.getY(i) * (0.8 + Math.random() * 0.4), pa.getZ(i) * j);
    }
    chipGeo.computeVertexNormals();
  }
  const chipMat = matStd(0xffffff, { roughness: 0.62 });
  chipMat.map = marbleTex;
  for (let i = 0; i < 5; i++) {
    const c = mesh(chipGeo, chipMat);
    c.position.set(1.5 + (Math.random() - 0.5) * 0.05, BENCH_Y + 0.009, 0.02 + (Math.random() - 0.5) * 0.05);
    c.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
    chips.add(c);
  }
  /* 大理石粉末堆 */
  const powderMat = matStd(0xe4e6ea, { roughness: 0.85 });
  powderMat.map = marbleTex;
  const powder = mesh(new THREE.ConeGeometry(0.024, 0.012, 16), powderMat);
  powder.position.set(1.5, BENCH_Y + 0.007, 0.02);
  powder.visible = false;
  const stopper = makeStopper(0.0255, 2);
  stopper.position.set(1.5, BENCH_Y + 0.143, 0.02);
  const funnel = makeThistleFunnel();
  funnel.position.set(1.491, BENCH_Y + 0.13, 0.02);
  /* 漏斗内水柱（查气密的视觉反馈，短暂显示） */
  const fWater = mesh(new THREE.CylinderGeometry(0.0046, 0.0046, 0.15, 10), liquidMat(0xa8d4ec, 0.5));
  fWater.position.set(1.491, BENCH_Y + 0.212, 0.02);
  fWater.scale.y = 0.001;
  const del = tubeAlong([
    [1.509, BENCH_Y + 0.148, 0.02], [1.62, BENCH_Y + 0.13, 0.05], [1.78, BENCH_Y + 0.11, 0.14],
    [1.93, BENCH_Y + 0.14, 0.24], [2.0, BENCH_Y + 0.06, 0.28],
  ], 0.0038);
  const jar = makeGasJar();
  const jarG = new THREE.Group();
  const fill = mesh(new THREE.CylinderGeometry(0.041, 0.041, 0.11, 20), new THREE.MeshBasicMaterial({
    color: 0xa8d8a8, transparent: true, opacity: 0.12, depthWrite: false,
  }));
  fill.position.y = 0.055; fill.scale.y = 0.001;
  jarG.add(jar, fill);
  jarG.position.set(2.0, BENCH_Y, 0.28);
  const plate = makeGlassPlate(); plate.position.set(2.0, BENCH_Y + 0.122, 0.28); plate.rotation.z = 0.12;
  /* 澄清石灰水（小烧杯，石灰水检验用） */
  const limeCup = cyl(0.026, 0.028, 0.05, glassMat(0.35), 18, true);
  limeCup.position.set(2.32, BENCH_Y + 0.027, 0.1);
  const limeBase = cyl(0.024, 0.028, 0.004, glassMat(0.4), 18);
  limeBase.position.set(2.32, BENCH_Y + 0.003, 0.1);
  const limeLiquid = mesh(new THREE.CylinderGeometry(0.023, 0.025, 0.032, 18), liquidMat(0xeef6fa, 0.4));
  limeLiquid.position.set(2.32, BENCH_Y + 0.018, 0.1);
  bakeContactShadow(1.5, 0.02, 0.16, 0.14, 0.3);
  bakeContactShadow(2.0, 0.28, 0.16, 0.16, 0.3);
  bakeContactShadow(2.32, 0.1, 0.09, 0.09, 0.28);
  /* 器材名称标签（药品名随形态切换文案） */
  const lbls = [
    ['长颈漏斗', 1.48, 1.28, 0.02, '#a8d4e8'],
    ['锥形瓶', 1.5, 1.11, 0.02, '#cfd6df'],
    ['大理石', 1.44, 0.94, 0.02, '#dfe3e9'],
    ['导气管', 1.8, 1.05, 0.16, '#a8d4e8'],
    ['集气瓶', 2.0, 1.1, 0.28, '#bfe8bf'],
    ['澄清石灰水', 2.32, 1.03, 0.1, '#dfe6ee'],
  ];
  C.lblMarble = null;
  for (const [t, x, y, z, c] of lbls) {
    const s = label(t, c);
    s.position.set(x, y, z);
    g.add(s);
    equipLabels.push(s);
    if (t === '大理石') C.lblMarble = s;
  }
  g.add(flask, liquid, chips, powder, stopper, funnel, fWater, del.mesh, jarG, plate, limeCup, limeBase, limeLiquid);
  C = Object.assign(C, { flask, liquid, chips, powder, stopper, funnel, fWater, del, jarG, fill, plate, limeLiquid, bubbleXZ: [1.5, 0.02] });
}

/* ---------------- 工位 D：气体性质与检验 ---------------- */

const stD = { group: new THREE.Group(), busy: false, limeRed: false, ironJar: 'wet', pourT: -1 };
scene.add(stD.group);

let D = {};
function buildStationD() {
  const g = stD.group;
  /* 两瓶氧气：瓶底有水 / 瓶底无水（铁丝实验的选择） */
  function jarWithGas(x, label_, fillColor, labelColor, withWater) {
    const grp = new THREE.Group();
    const jar = makeGasJar();
    const fill = mesh(new THREE.CylinderGeometry(0.041, 0.041, 0.108, 20), new THREE.MeshBasicMaterial({
      color: fillColor, transparent: true, opacity: 0.12, depthWrite: false,
    }));
    fill.position.y = 0.054;
    const plate = makeGlassPlate(); plate.position.y = 0.12;
    const water = mesh(new THREE.CylinderGeometry(0.04, 0.041, 0.012, 20), liquidMat(0x8ecbe2, 0.4));
    water.position.y = 0.008;
    water.visible = withWater;
    const lbl = label(label_, labelColor, 0.0013);
    lbl.position.y = withWater ? 0.185 : 0.15;
    grp.add(jar, fill, plate, water, lbl);
    grp.position.set(x, BENCH_Y, 0.5);
    bakeContactShadow(x, 0.5, 0.16, 0.16, 0.3);
    return { grp, fill, water };
  }
  const o2w = jarWithGas(0.06, '氧气 · 瓶底有少量水', 0x9fd4e8, '#9fd4e8', true);
  const o2d = jarWithGas(0.22, '氧气 · 瓶底没放水', 0x9fd4e8, '#9fd4e8', false);
  const co2 = jarWithGas(0.52, '二氧化碳', 0xa8d8a8, '#bfe8bf', false);
  /* 铁丝（实验时移入氧气瓶） */
  const iron = makeIronWire();
  iron.position.set(-0.3, BENCH_Y + 0.004, 0.5);
  iron.visible = false;
  /* 澄清石灰水（锥形瓶） */
  const limeBottle = makeFlask();
  limeBottle.position.set(0.92, BENCH_Y, 0.5);
  const lime = mesh(new THREE.CylinderGeometry(0.045, 0.048, 0.05, 22), liquidMat(0xeef6fa, 0.4));
  lime.position.set(0.92, BENCH_Y + 0.026, 0.5);
  /* 木条（静置在台面，实验时移动） */
  const splint = makeSplint(0.1);
  splint.position.set(-0.28, BENCH_Y + 0.004, 0.5);
  splint.rotation.y = 0.5;
  /* 阶梯蜡烛（一低一高） */
  const candLow = makeCandle(0.03);
  candLow.grp.position.set(0.42, BENCH_Y, 0.2);
  const candHigh = makeCandle(0.055);
  candHigh.grp.position.set(0.6, BENCH_Y, 0.2);
  bakeContactShadow(0.5, 0.2, 0.2, 0.08, 0.3);
  /* 紫色石蕊试液（烧杯） */
  const indLiquid = mesh(new THREE.CylinderGeometry(0.03, 0.032, 0.04, 20), liquidMat(0x8a5fc0, 0.55));
  indLiquid.position.set(-0.62, BENCH_Y + 0.02, 0.5);
  const indCup = cyl(0.032, 0.03, 0.055, glassMat(0.35), 20, true);
  indCup.position.set(-0.62, BENCH_Y + 0.028, 0.5);
  const indBase = cyl(0.03, 0.032, 0.004, glassMat(0.4), 20);
  indBase.position.set(-0.62, BENCH_Y + 0.003, 0.5);
  /* 器材名称标签 */
  const lbls = [
    ['阶梯蜡烛', 0.37, 0.965, 0.2, '#ffd9a8'],
    ['紫色石蕊试液', -0.62, 1.05, 0.5, '#d0b4f0'],
    ['澄清石灰水', 0.92, 1.1, 0.5, '#dfe6ee'],
  ];
  for (const [t, x, y, z, c] of lbls) {
    const s = label(t, c);
    s.position.set(x, y, z);
    g.add(s);
    equipLabels.push(s);
  }
  g.add(o2w.grp, o2d.grp, co2.grp, iron, limeBottle, lime, splint, candLow.grp, candHigh.grp, indLiquid, indCup, indBase);
  D = { o2w, o2d, co2, iron, lime, limeBottle, splint, candLow, candHigh, indLiquid, indCup };
}

/* ---------------- 粒子：气泡 / 气流点 / 烟尘（灰烟/火星/CO₂ 白雾） ---------------- */

const MAX_BUB = 150;
const bubMesh = new THREE.InstancedMesh(
  new THREE.SphereGeometry(0.0035, 6, 5),
  matCoat(0xdff2fa, { roughness: 0.1, opacity: 0.55, metalness: 0 }),
  MAX_BUB
);
bubMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
bubMesh.frustumCulled = false;
scene.add(bubMesh);
const bubbles = Array.from({ length: MAX_BUB }, () => ({ on: false, p: new THREE.Vector3(), vy: 0, wob: Math.random() * TAU, top: 1 }));

const MAX_DOT = 10;
const dotMesh = new THREE.InstancedMesh(
  new THREE.SphereGeometry(0.0045, 8, 6),
  new THREE.MeshBasicMaterial({ color: 0xdff0ff, transparent: true, opacity: 0.75 }),
  MAX_DOT
);
dotMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
dotMesh.frustumCulled = false;
scene.add(dotMesh);
const dots = Array.from({ length: MAX_DOT }, () => ({ on: false, t: 0, speed: 0.25 }));

/* 烟尘泡（kind: smoke 灰烟 / spark 火星 / mist CO₂ 白雾） */
const puffs = [];
for (let i = 0; i < 12; i++) {
  const m = mesh(new THREE.SphereGeometry(0.011, 8, 6), new THREE.MeshBasicMaterial({
    color: 0xc9ccd2, transparent: true, opacity: 0.5, depthWrite: false,
  }));
  m.visible = false;
  scene.add(m);
  puffs.push({ mesh: m, t: -1, kind: 'smoke', vy: 0.03, drift: 0 });
}
function puffAt(x, y, z, kind = 'smoke') {
  const p = puffs.find((q) => q.t < 0);
  if (!p) return;
  p.t = 0;
  p.kind = kind;
  p.vy = kind === 'mist' ? -0.05 : kind === 'spark' ? 0.075 : 0.03;
  p.drift = (Math.random() - 0.5) * 0.02;
  p.mesh.visible = true;
  p.mesh.material.color.set(kind === 'spark' ? 0xff8a30 : kind === 'mist' ? 0xdfe8ee : 0xc9ccd2);
  p.mesh.material.opacity = kind === 'spark' ? 0.85 : 0.5;
  p.mesh.scale.setScalar(kind === 'mist' ? 0.8 + Math.random() * 0.4 : 1);
  p.mesh.position.set(x, y, z);
}

const _m4 = new THREE.Matrix4();
const _zero = new THREE.Matrix4().makeScale(0.0001, 0.0001, 0.0001);

function spawnBubble(x, y, z, top, vy = 0.05) {
  const b = bubbles.find((q) => !q.on);
  if (!b) return;
  b.on = true;
  b.p.set(x + (Math.random() - 0.5) * 0.015, y, z + (Math.random() - 0.5) * 0.015);
  b.vy = vy * (0.75 + Math.random() * 0.5);
  b.top = top;
  b.wob = Math.random() * TAU;
}
function spawnDot() {
  const d = dots.find((q) => !q.on);
  if (!d) return;
  d.on = true; d.t = 0;
  d.speed = 0.16 + Math.random() * 0.1;
}

function updateParticles(dt, time) {
  for (let i = 0; i < bubbles.length; i++) {
    const b = bubbles[i];
    if (b.on) {
      b.p.y += b.vy * dt;
      b.p.x += Math.sin(time * 6 + b.wob) * 0.0006;
      if (b.p.y >= b.top) b.on = false;
      _m4.makeTranslation(b.p.x, b.p.y, b.p.z);
    } else {
      _m4.copy(_zero);
    }
    bubMesh.setMatrixAt(i, _m4);
  }
  bubMesh.instanceMatrix.needsUpdate = true;

  for (let i = 0; i < dots.length; i++) {
    const d = dots[i];
    if (d.on) {
      d.t += d.speed * dt;
      const path = activeDotPath;
      if (!path || d.t >= 1) {
        d.on = false;
        if (path && d.t >= 1 && onDotArrive) onDotArrive();
      } else {
        const p = path.getPointAt(Math.min(d.t, 1));
        _m4.makeTranslation(p.x, p.y, p.z);
      }
    }
    if (!d.on) _m4.copy(_zero);
    dotMesh.setMatrixAt(i, _m4);
  }
  dotMesh.instanceMatrix.needsUpdate = true;

  for (const p of puffs) {
    if (p.t >= 0) {
      p.t += dt;
      p.mesh.position.y += p.vy * dt;
      p.mesh.position.x += p.drift * dt;
      p.mesh.material.opacity = Math.max(0, (p.kind === 'spark' ? 0.85 : 0.5) * (1 - p.t / 1.2));
      if (p.kind === 'mist') p.mesh.scale.multiplyScalar(1 + dt * 0.5);
      if (p.t > 1.2) { p.t = -1; p.mesh.visible = false; }
    }
  }
}

let activeDotPath = null;
let onDotArrive = null;

/* ---------------- 补间与帧循环 ---------------- */

const tweens = [];
function addTween(dur, fn, onDone) { tweens.push({ t: 0, dur, fn, onDone }); }

let labReady = false;

/* ---------------- UI：提示条 / 子操作行 / 故障卡 ---------------- */

let toastTimer = null;
function toast(text, kind = '') {
  let el = stage.querySelector('.gas-toast');
  if (!el) {
    el = document.createElement('div');
    el.className = 'gas-toast';
    stage.appendChild(el);
  }
  el.textContent = text;
  el.className = 'gas-toast show' + (kind ? ' ' + kind : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3600);
}

let faultEl = null;
function showFault(html) {
  if (!faultEl) {
    faultEl = document.createElement('div');
    faultEl.className = 'gas-fault';
    stage.appendChild(faultEl);
  }
  faultEl.innerHTML = html;
  faultEl.classList.add('show');
}
function hideFault() { if (faultEl) faultEl.classList.remove('show'); }

/* ---------------- 数据读数（实验记录，按课题换行集） ---------------- */

let hud = null;
const hudWrap = document.getElementById('lcData');
function setHUD(rows) {
  if (hud) hud.el.remove();
  hud = rows ? makeHUD(hudWrap, rows) : null;
  if (hud) rows.forEach(([k]) => hud.set(k, '–'));
}
function hset(key, text) { if (hud) hud.set(key, text); }

/* ---------------- 导管口气流曲线浮窗（最近 60 秒：气流 + 纯度） ---------------- */

let chartCv = null;
let chartEl = null;
const flowHist = [];      // { flow, purity } 每秒采样，保留 60 条
let flowAcc = 0;
function initChartWindow() {
  const el = document.createElement('div');
  el.className = 'gas-chart';
  el.id = 'gasChart';
  el.innerHTML = `
    <div class="cw-head"><b>导管口气流</b><span style="color:var(--text-faint)">最近 60 秒</span>
      <button class="cw-fold" type="button" aria-label="收起气流曲线窗" title="收起气流曲线窗">−</button></div>
    <canvas height="300"></canvas>
    <button class="cw-badge" type="button" aria-label="展开气流曲线窗" title="展开气流曲线窗">气流</button>`;
  stage.appendChild(el);
  chartCv = el.querySelector('canvas');
  chartEl = el;
  const FOLD_KEY = 'gas.foldChart';
  const NARROW = window.innerWidth <= 1100;
  let folded = false;
  try { folded = localStorage.getItem(FOLD_KEY) !== null ? localStorage.getItem(FOLD_KEY) === '1' : NARROW; } catch (e) { /* 忽略 */ }
  const apply = () => {
    el.classList.toggle('folded', folded);
    el.querySelector('.cw-fold').setAttribute('aria-expanded', String(!folded));
  };
  const save = () => { try { localStorage.setItem(FOLD_KEY, folded ? '1' : '0'); } catch (e) { /* 忽略 */ } };
  el.querySelector('.cw-fold').addEventListener('click', () => { folded = true; apply(); save(); });
  el.querySelector('.cw-badge').addEventListener('click', () => { folded = false; apply(); save(); });
  apply();
}
function chartSetVisible(v) { if (chartEl) chartEl.style.display = v ? '' : 'none'; }
/* 当前章的实时气流/纯度（0..1），由各章帧循环写 */
let chartFlow = 0;
let chartPurity = 1;
function drawFlowChart() {
  if (!chartCv || chartEl.style.display === 'none') return;
  const W = chartCv.clientWidth || 240, H = 130;
  if (chartCv.width !== W * 2) { chartCv.width = W * 2; chartCv.height = H * 2; }
  const ctx = chartCv.getContext('2d');
  ctx.setTransform(2, 0, 0, 2, 0, 0);
  ctx.clearRect(0, 0, W, H);
  const css = getComputedStyle(document.documentElement);
  const dim = css.getPropertyValue('--text-faint').trim() || '#8a94a0';
  const acc = css.getPropertyValue('--accent').trim() || '#e8674a';
  const mL = 8, mR = 10, mT = 10, mB = 18;
  const pw = W - mL - mR, ph = H - mT - mB;
  const N = 60;
  ctx.strokeStyle = dim;
  ctx.globalAlpha = 0.4;
  ctx.lineWidth = 1;
  ctx.strokeRect(mL, mT, pw, ph);
  /* 50% 参考线 */
  ctx.globalAlpha = 0.22;
  ctx.beginPath();
  ctx.moveTo(mL, mT + ph / 2); ctx.lineTo(mL + pw, mT + ph / 2);
  ctx.stroke();
  ctx.globalAlpha = 1;
  const X = (i) => mL + (i / (N - 1)) * pw;
  const Y = (v) => mT + (1 - clamp(v, 0, 1)) * ph;
  /* 气流（accent 实线） */
  ctx.strokeStyle = acc;
  ctx.lineWidth = 2;
  ctx.beginPath();
  flowHist.forEach((s, i) => { const x = X(i), y = Y(s.flow); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
  ctx.stroke();
  /* 纯度（绿色虚线） */
  ctx.strokeStyle = '#3fa96f';
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  flowHist.forEach((s, i) => { const x = X(i), y = Y(s.purity); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
  ctx.stroke();
  ctx.setLineDash([]);
  /* 图例与轴注 */
  ctx.font = '10px sans-serif';
  ctx.fillStyle = acc;
  ctx.fillText('气流', mL + 4, mT + 9);
  ctx.fillStyle = '#3fa96f';
  ctx.fillText('纯度', mL + 34, mT + 9);
  ctx.fillStyle = dim;
  ctx.textAlign = 'right';
  ctx.fillText('-60s', mL + pw, H - 5);
  ctx.fillText('现在', mL + pw, mT + 9);
  ctx.textAlign = 'left';
}
/* ================= 工位 A 步骤机：查 装 定 点 收 离 熄 验 ================= */

const STEP_NAMES_A = ['查', '装', '定', '点', '收', '离', '熄', '验'];
const STEP_FULL_A = ['检查气密性', '装入药品', '固定试管', '点燃加热', '排水收集', '撤出导管', '熄灭酒精灯', '木条检验'];

function resetStationA() {
  stA.step = 0; stA.lit = false; stA.preheatDone = false; stA.tiltUp = false;
  stA.heating = false; stA.heatT = 0; stA.power = 1; stA.collected = 0;
  stA.purity = 0.98; stA.kmno4 = 3.0; stA.fault = false; stA.collecting = false;
  stA.fullToast = false; stA.jarOut = false; stA.swingT = -1; stA.swingDir = 1;
  stA.burstT = 0;
  A.drug.visible = false; A.cotton.visible = false;
  A.jarWater.scale.y = 1; A.jarWater.position.y = 0.0525;
  A.jarG.rotation.x = Math.PI;
  A.jarG.position.set(-1.06, 1.079, 0.28);
  A.plate.visible = false;
  A.tubeG.rotation.z = -0.14;
  A.lamp.userData.cap.position.set(0.055, 0, 0.03);
  A.lamp.userData.cap.rotation.z = -0.5;
  A.lamp.userData.flame.visible = false;
  A.lamp.userData.light.intensity = 0;
  A.lamp.position.set(-1.655, BENCH_Y, -0.18);
  A.del.mesh.position.set(0, 0, 0);
  A.del.mesh.children.forEach((c) => { c.material && c.material.color && c.material.color.set(0xb0c8d8); });
  setJaw(0);
  hudTextA.phase = '还没有操作';
  hudTextA.temp = '25 ℃'; hudTextA.flow = '—'; hudTextA.purity = '—';
  hudTextA.collect = '0%'; hudTextA.vol = '0%'; hudTextA.kmno4 = '3.0 g';
  hudTextA.collected = '0%';
  hideFault();
}

/* 熄灯：灯帽盖回芯口（火焰同时熄灭） */
function coverLamp() {
  const u = A.lamp.userData;
  u.flame.visible = false;
  addTween(0.45, (k) => {
    u.cap.position.set(0.085 - k * 0.084, 0.02 + k * 0.042, 0.05 - k * 0.049);
    u.cap.rotation.z = -0.8 + k * 0.8;
  });
}

/* 夹爪开合（k: 0 开 → 1 夹紧）+ 翼形螺钉联动 */
function setJaw(k) {
  A.jaw1.position.y = 0.012 - k * 0.011;
  A.jaw2.position.y = -0.012 + k * 0.011;
  A.wing.rotation.x = k * Math.PI * 1.5;
}

function paintSteps(btns, idx) {
  btns.forEach((b, i) => {
    b.classList.toggle('done', i < idx);
    b.classList.toggle('now', i === idx);
  });
}

/* 子操作行（上下文相关的下一步动作，也可以直接点击桌上的器材） */
const subRow = document.createElement('div');
subRow.className = 'gas-subrow';
function renderSub(list) {
  subRow.innerHTML = '';
  for (const it of list) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'ctl-btn gas-sub' + (it.warn ? ' warn' : '');
    b.textContent = it.label;
    b.addEventListener('click', () => it.onClick(b));
    subRow.appendChild(b);
  }
}
function clearSub() { subRow.innerHTML = ''; }

function doStepA(i) {
  if (stA.fault) { toast('实验失败：仪器损坏了。点击「重做实验」或「重置」再试一次。', 'warn'); return; }
  if (stA.step >= STEP_NAMES_A.length) { toast('实验已完成，点击「重做实验」可以再来一次。', 'ok'); return; }
  /* 故意做错：还没撤导管就熄灯 → 倒吸炸裂（原版事故演示） */
  if (i === 6 && stA.step < 6 && stA.heating) { tryFaultBlowOut(); return; }
  if (i !== stA.step) {
    if (i < stA.step) { toast(`第 ${i + 1} 步已完成，进行「${STEP_FULL_A[stA.step]}」。`, 'warn'); return; }
    toast(`要先完成「${STEP_FULL_A[stA.step]}」，才能进行「${STEP_FULL_A[i]}」。`, 'warn');
    return;
  }
  switch (i) {
    case 0: { // 查：手握试管，导管口有气泡，松手水柱回流
      stA.step++;
      toast('两手掌心贴住试管壁：导管口马上冒出气泡；手一松，导管里倒吸回一段水柱——气密性没问题。', 'ok');
      stA.burstT = 1.6;
      break;
    }
    case 1: // 装
      stA.step++;
      A.drug.visible = true; A.cotton.visible = true;
      toast('用纸槽把高锰酸钾送进试管底部，药品不沾管壁；管口搁一小团棉花，挡住粉末别让它冲进导管。', 'ok');
      break;
    case 2: // 定：子选择（管口向下 ✓ / 向上 ✗），选定后才算完成
      renderSub([
        { label: '管口略向下倾斜', onClick: () => { doTilt(false); } },
        { label: '管口向上倾斜', warn: true, onClick: () => { doTilt(true); } },
      ]);
      return;
    case 3: // 点：子操作（点燃 → 预热 → 集中加热），集中加热后才算完成
      renderSub([
        { label: '① 点燃酒精灯', onClick: () => doLightLamp() },
        { label: '② 来回移动预热', onClick: () => doPreheat() },
        { label: '③ 对准药品集中加热', onClick: () => doFocusHeat() },
      ]);
      return;
    case 4: // 收：记录收集时机（早收 → 混入空气）
      stA.step++;
      if (!stA.heating) { toast('还没点燃酒精灯加热，先完成「点燃加热」。', 'warn'); stA.step--; paintSteps(stA.stepBtns, stA.step); break; }
      if (stA.heatT < 2.5) {
        stA.purity = 0.55;
        stA.collecting = true;
        toast('这会儿冒出的还是管内受热膨胀的空气——现在就收，瓶里的氧气会掺进空气。', 'warn');
      } else {
        stA.purity = 0.98;
        stA.collecting = true;
        toast('气泡连成一串又均匀了，说明管内空气已经排干净——开始排水收集（氧气不易溶于水）。', 'ok');
      }
      break;
    case 5: { // 离：先水下盖玻璃片取出正放（若已集满），再撤导管
      stA.step++;
      stA.collecting = false;
      stA.collected = Math.max(stA.collected, stA.collected);
      const finishTube = () => {
        const from = A.del.mesh.position.clone();
        addTween(0.7, (k) => { A.del.mesh.position.set(from.x, from.y + k * 0.012, from.z + k * 0.05); });
        toast('第一步：把导管口从水槽里撤出来……', 'ok');
      };
      if (stA.collected >= 0.99 && !stA.jarOut) {
        coverJarAndLift(() => finishTube());
      } else {
        finishTube();
      }
      break;
    }
    case 6: // 熄
      stA.step++;
      stA.heating = false;
      coverLamp();
      toast('盖上灯帽把火熄灭——这步必须排在撤导管之后，不然水会倒吸进热试管。', 'ok');
      break;
    case 7: // 验：木条伸入瓶中，三种结果
      stA.step++;
      renderSub([{ label: '把带火星的木条伸到瓶里', onClick: () => doVerifyA() }]);
      break;
  }
  hudTextA.phase = stA.step <= 0 ? '还没有操作' : stA.step >= 8 ? '实验完成 ✓' : STEP_FULL_A[stA.step - 1] + ' ✓';
  if (stA.stepBtns) paintSteps(stA.stepBtns, stA.step);
}

/* 定：管口朝向（false 向下 ✓ / true 向上 ✗）——向上倾斜在集中加热时炸裂 */
function doTilt(up) {
  stA.tiltUp = up;
  stA.step++;   // 选定朝向，「定」才算完成
  clearSub();
  const from = A.tubeG.rotation.z;
  const to = up ? 0.14 : -0.14;
  setJaw(1);
  addTween(0.5, (k) => { A.tubeG.rotation.z = from + (to - from) * k; });
  if (up) {
    toast('管口向上倾斜……加热时药品里的水分会在管口冷凝，倒流回灼热的管底。', 'warn');
  } else {
    toast('铁夹夹在距管口约三分之一处，管口微微朝下——免得冷凝水倒流回滚烫的管底。', 'ok');
  }
  hudTextA.phase = '固定试管 ✓';
  if (stA.stepBtns) paintSteps(stA.stepBtns, stA.step);
}

function doLightLamp() {
  if (stA.lit) { toast('酒精灯已点燃，进行下一步：来回移动预热。', 'warn'); return; }
  stA.lit = true;
  const u = A.lamp.userData;
  u.flame.visible = true;
  addTween(0.3, (k) => {
    u.cap.position.set(0.055 + k * 0.03, k * 0.02, 0.03 + k * 0.02);
    u.cap.rotation.z = -0.5 - k * 0.3;
  });
  toast('摘下灯帽，拿火柴去点灯芯（切记：不能拿一盏燃着的酒精灯去点另一盏）。', 'ok');
}

function doPreheat() {
  if (!stA.lit) { toast('先点燃酒精灯，再来回移动预热。', 'warn'); return; }
  if (stA.swingT >= 0 || stA.preheatDone) {
    if (stA.preheatDone) toast('预热已经完成，可以对准药品部位集中加热了。', 'warn');
    return;
  }
  stA.swingT = 0;
  toast('预热：拿着酒精灯在试管下来回平移，让管子先均匀受热……', 'ok');
}

function doFocusHeat() {
  if (!stA.lit) { toast('先点燃酒精灯。', 'warn'); return; }
  if (!stA.preheatDone) {
    blowTube('试管炸裂了！跳过预热直接集中加热，管子各处受热不均，直接炸开。');
    return;
  }
  if (stA.tiltUp) {
    blowTube('试管炸裂了！管口朝上，冷凝水顺着管壁流回滚烫的管底，一激就裂。');
    return;
  }
  stA.step++;   // 集中加热完成，「点」才算完成
  stA.heating = true;
  stA.heatT = 0;
  clearSub();
  hudTextA.phase = '点燃加热 ✓';
  if (stA.stepBtns) paintSteps(stA.stepBtns, stA.step);
  toast('把外焰固定在药品的位置加热——火焰三层里数外焰温度最高。', 'ok');
}

/* 倒吸 / 炸裂通用演出：水球沿导管逆向 + 导管闪红 + 试管抖动倾斜 */
function blowTube(reason) {
  if (stA.fault) return;
  stA.fault = true;
  stA.heating = false;
  stA.lit = false;
  stA.swingT = -1;
  A.lamp.userData.flame.visible = false;
  A.lamp.userData.light.intensity = 0;
  hudTextA.phase = '实验失败';
  showFault(`<b>试管炸裂！</b>${reason}<br><b>正确操作</b>：先来回预热再集中加热；管口略向下倾斜；先撤导管再熄灯。点击「重做实验」重新开始。`);
  activeDotPath = A.del.curve;
  const ball = mesh(new THREE.SphereGeometry(0.006, 10, 8), liquidMat(0x6db8d8, 0.85));
  scene.add(ball);
  addTween(1.1, (k) => {
    const p = A.del.curve.getPointAt(1 - k);
    ball.position.copy(p);
    A.del.mesh.children[0].material.color.setHSL(0, 0.7, 0.5 + Math.sin(k * 12) * 0.1);
  }, () => {
    scene.remove(ball);
    A.del.mesh.children[0].material.color.set(0xb0c8d8);
    addTween(0.5, (k) => { A.tubeG.rotation.x = Math.sin(k * 20) * 0.025 * (1 - k); });
  });
}

/* 熄灯时若未先离 → 倒吸炸裂 */
function tryFaultBlowOut() {
  if (stA.fault || stA.step >= 6) return false;
  if (stA.heating) {
    blowTube('灯先灭了，导管还泡在水里！管内气体遇冷收缩、压强变小，水槽的水顺着导管被吸进灼热的试管。正确次序：先撤导管，后熄灯。');
    return true;
  }
  return false;
}

/* 收集满后：水下盖玻璃片 → 取出正放到桌面（silent=true 时不重复播报，避免盖掉集满提示） */
function coverJarAndLift(onDone, silent = false) {
  stA.jarOut = true;
  A.plate.visible = true;
  const p0 = A.jarG.position.clone();
  const r0 = A.jarG.rotation.x;
  addTween(1.2, (k) => {
    /* 前 0.35：玻璃片落到瓶口；后 0.65：瓶上移出水面 → 平移到台面 → 转正 */
    if (k < 0.35) {
      const kk = k / 0.35;
      A.plate.position.set(-1.06, 1.19 + (1 - kk) * 0.07, 0.28);
    } else {
      const kk = (k - 0.35) / 0.65;
      const e = kk < 0.5 ? 2 * kk * kk : 1 - Math.pow(-2 * kk + 2, 2) / 2;
      A.jarG.position.set(
        p0.x + (-1.06 - p0.x) * e,
        p0.y + ((BENCH_Y + 0.0575) - p0.y) * e,
        p0.z + (-0.06 - p0.z) * e
      );
      A.jarG.rotation.x = r0 * (1 - e);
      A.plate.position.set(-1.06, BENCH_Y + 0.128 + 0.002, -0.06);
    }
  }, () => { onDone && onDone(); });
  if (!silent) toast('在水里用玻璃片把瓶口盖严，再取出水面正立放到台面上——氧气的密度比空气大。', 'ok');
}

/* 验：木条伸入瓶中，按收集时机给出三种结果 */
function doVerifyA() {
  clearSub();
  moveSplintInto(() => {
    const pure = stA.purity >= 0.9;
    if (stA.collected >= 0.99 && pure) {
      verifyStick.userData.fl.visible = true;
      toast('带火星的木条一下子烧了起来——这就是复燃，证明瓶里是助燃性很强的氧气。', 'ok');
    } else if (stA.collected >= 0.99 && !pure) {
      toast('木条烧得亮了些，却没有复燃：瓶里掺了不少空气——是收集早了。', 'warn');
    } else if (stA.collected >= 0.5) {
      toast('木条维持原样：瓶里收到的氧气还不够一瓶。', 'warn');
    } else {
      toast('木条没什么动静：这瓶里基本还是空气。', 'warn');
    }
    setTimeout(() => {
      if (verifyStick) verifyStick.userData.fl.visible = false;
      moveSplintHomeA();
    }, 1600);
  });
}

/* 木条从 D 工位“借用”演出：直接在 A 工位生成一根短木条移动 */
let verifyStick = null;
function moveSplintInto(onDone) {
  if (verifyStick) { scene.remove(verifyStick); verifyStick = null; }
  verifyStick = makeSplint(0.07);
  const tgt = stA.jarOut ? new THREE.Vector3(-1.06, BENCH_Y + 0.09, -0.06) : new THREE.Vector3(-1.06, 1.06, 0.28);
  verifyStick.position.set(-0.85, BENCH_Y + 0.02, 0.1);
  verifyStick.rotation.y = 0.9;
  scene.add(verifyStick);
  addTween(0.7, (k) => {
    const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    verifyStick.position.lerpVectors(new THREE.Vector3(-0.85, BENCH_Y + 0.02, 0.1), tgt, e);
  }, () => { onDone && onDone(); });
}
function moveSplintHomeA() {
  if (!verifyStick) return;
  const from = verifyStick.position.clone();
  addTween(0.6, (k) => {
    const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    verifyStick.position.lerpVectors(from, new THREE.Vector3(-0.85, BENCH_Y + 0.02, 0.1), e);
  }, () => { scene.remove(verifyStick); verifyStick = null; });
}

/* ================= 工位 B 步骤机 ================= */

const STEP_NAMES_B = ['查', '加液', '加MnO₂', '收集', '验满', '检验', '回收'];
const STEP_FULL_B = ['检查气密性', '加入过氧化氢', '加入二氧化锰', '滴加收集', '瓶口验满', '木条检验', '回收称量'];

function resetStationB() {
  stB.running = false; stB.step = 0; stB.cock = 0; stB.mno2Added = false; stB.mno2Recycled = false;
  stB.mode = 'drain'; stB.collected = 0; stB.total = 0; stB.funnelML = 0;
  stB.burstT = 0; stB.fullToast = false;
  B.liquid.visible = false;
  B.mno2.visible = false;
  B.funnel.userData.liquid.scale.y = 0.001;
  applyCock(0);
  B.jarDG.visible = true; B.trough.visible = true;
  B.jarUG.visible = false; B.plateU.visible = false;
  B.jarDWater.scale.y = 1; B.jarDWater.position.y = 0.0525;
  B.jarUFill.scale.y = 0.001;
  B.delAir.mesh.visible = false; B.delDrain.mesh.visible = true;
  hudTextB.phase = '还没有操作';
  hudTextB.drip = '0.0 滴/秒'; hudTextB.rate = '—'; hudTextB.funnel = '0 mL';
  hudTextB.vol = '0%'; hudTextB.mno2 = '未加'; hudTextB.total = '0 mL';
  hideFault();
}

/* 旋塞开度 → 手柄旋转 90°（0=全关 手柄横着；1=全开 手柄顺着管） */
function applyCock(v) {
  stB.cock = v;
  const h = B.funnel.userData.cock.userData.handle;
  if (h) h.rotation.x = (1 - v) * (TAU / 4);
}

function doStepB(i) {
  if (stB.step >= STEP_NAMES_B.length) { toast('实验已完成，点击「重做实验」可以再来一次。', 'ok'); return; }
  if (i < stB.step) { toast(`第 ${i + 1} 步已完成。`, 'warn'); return; }
  switch (i) {
    case 0: { // 查：关闭活塞，手握锥形瓶
      stB.step = Math.max(stB.step, 1);
      applyCock(0);
      if (cockSlider) cockSlider.set(0);
      stB.burstT = 1.5;
      toast('先关严活塞，再把导管口伸进水里，两手捂热锥形瓶：看到气泡冒出来——说明装置不漏气。', 'ok');
      break;
    }
    case 1: { // 加液：分液漏斗中加入 40 mL 5% 过氧化氢
      if (i !== stB.step && stB.step === 0) { toast('装药前最好先查气密——漏气的装置收不到气体，白费药品。', 'warn'); }
      stB.step = Math.max(stB.step, 2);
      stB.funnelML = 40;
      const liq = B.funnel.userData.liquid;
      addTween(0.8, (k) => { liq.scale.y = 0.001 + k * 0.999; });
      B.liquid.visible = false;   // 液体随滴加落瓶后再显形
      toast('活塞先关好，再往分液漏斗里倒 40 mL 质量分数 5% 的过氧化氢溶液。', 'ok');
      break;
    }
    case 2: { // 加 MnO₂（可选：对比前后速率）
      stB.step = Math.max(stB.step, 3);
      if (stB.mno2Added) { toast('二氧化锰已经加入了。', 'warn'); break; }
      stB.mno2Added = true;
      B.mno2.visible = true;
      toast('撒入少量黑色二氧化锰粉末——它是催化剂，反应前后自身质量和化学性质都保持不变。', 'ok');
      break;
    }
    case 3: { // 收集：打开活塞滴加（活塞开度控制速率）
      if (stB.funnelML <= 0.5) { toast('分液漏斗里还没有过氧化氢，先「加液」。', 'warn'); return; }
      if (stB.cock <= 0.02) { toast('活塞全关着，打开活塞（拖动「活塞开度」滑杆）才能滴加。', 'warn'); return; }
      stB.step = Math.max(stB.step, 4);
      stB.running = !stB.running;
      hudTextB.phase = stB.running ? '进行中……' : '已暂停滴加';
      break;
    }
    case 4: { // 验满：带火星木条放瓶口
      stB.step = Math.max(stB.step, 5);
      moveVerifyStickB(0.55, 0.28, () => {
        if (stB.collected >= 0.95) {
          bStick.userData.fl.visible = true;
          toast('木条一放到瓶口就复燃了——这瓶氧气已经集满。', 'ok');
          setTimeout(() => { if (bStick) bStick.userData.fl.visible = false; }, 1400);
        } else {
          toast('木条放到瓶口没有复燃——瓶子还没收满，接着收。', 'warn');
        }
      });
      break;
    }
    case 5: { // 检验：木条伸入瓶中
      stB.step = Math.max(stB.step, 6);
      moveVerifyStickB(0.55, 0.28, () => {
        if (stB.collected > 0.2) {
          bStick.userData.fl.visible = true;
          toast('带火星的木条一下子烧了起来——这就是复燃，证明瓶里是助燃性很强的氧气。', 'ok');
          setTimeout(() => { if (bStick) bStick.userData.fl.visible = false; }, 1400);
        } else {
          toast('木条没什么动静：这瓶里基本还是空气。', 'warn');
        }
      });
      break;
    }
    case 6: { // 回收称量：过滤干燥后 MnO₂ 仍 1.00 g
      stB.step = 7;
      stB.mno2Recycled = true;
      toast('把二氧化锰过滤、洗净、烘干再上秤：读数还是 1.00 g——反应前后质量和化学性质都没变，这正是催化剂的定义。', 'ok');
      break;
    }
  }
  hudTextB.phase = hudTextB.phase === '进行中……' || stB.running ? hudTextB.phase : (stB.step <= 0 ? '还没有操作' : STEP_FULL_B[Math.min(stB.step, 7) - 1] + (stB.step >= 7 ? ' ✓' : ''));
  if (stB.stepBtns) paintSteps(stB.stepBtns, Math.min(stB.step, 7));
}

/* 验满/检验用小木条（B 工位内移动） */
let bStick = null;
function moveVerifyStickB(x, z, onDone) {
  if (bStick) { scene.remove(bStick); bStick = null; }
  bStick = makeSplint(0.07);
  const from = new THREE.Vector3(x + 0.16, BENCH_Y + 0.02, z + 0.18);
  const to = new THREE.Vector3(x, BENCH_Y + 0.14, z);
  bStick.position.copy(from);
  bStick.rotation.y = -0.8;
  scene.add(bStick);
  addTween(0.7, (k) => {
    const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    bStick.position.lerpVectors(from, to, e);
  }, () => { onDone && onDone(); setTimeout(() => {
    if (!bStick) return;
    const f = bStick.position.clone();
    addTween(0.6, (k) => { bStick.position.lerpVectors(f, from, k); }, () => { scene.remove(bStick); bStick = null; });
  }, 1500); });
}

/* ================= 工位 C 步骤机 ================= */

const STEP_NAMES_C = ['查', '装药品', '注酸', '收集', '验满', '石灰水'];
const STEP_FULL_C = ['检查气密性', '放入药品', '注入酸液', '收集气体', '瓶口验满', '石灰水检验'];

function resetStationC() {
  stC.running = false; stC.step = 0; stC.acid = 'hcl'; stC.form = 'chunk';
  stC.acidML = 0; stC.sealed = false; stC.placed = false; stC.collected = 0;
  stC.total = 0; stC.chokeT = 0; stC.limeCloud = 0;
  stC.fullToastC = false; stC.chokeToasted = false;
  C.liquid.scale.y = 0.001;
  C.chips.visible = false;
  C.powder.visible = false;
  C.fWater.scale.y = 0.001;
  C.fill.scale.y = 0.001;
  C.limeLiquid.material.color.set(0xeef6fa);
  C.limeLiquid.material.opacity = 0.4;
  hudTextC.phase = '还没有操作';
  hudTextC.rate = '—'; hudTextC.leak = '无'; hudTextC.vol = '0%';
  hudTextC.acid = '未注入'; hudTextC.lime = '澄清'; hudTextC.total = '0 mL';
  hideFault();
}

function doStepC(i) {
  if (i < stC.step && i !== 2) { toast(`第 ${i + 1} 步已完成。`, 'warn'); return; }
  switch (i) {
    case 0: {
      stC.step = Math.max(stC.step, 1);
      const fw = C.fWater;
      addTween(0.5, (k) => { fw.scale.y = 0.001 + k * 0.999; }, () => {
        setTimeout(() => addTween(0.6, (k) => { fw.scale.y = 1 - k * 0.999; }), 900);
      });
      toast('捏住胶皮管不让气跑，再从长颈漏斗里灌水：漏斗颈里能稳稳托住一段水柱，气密性就合格。', 'ok');
      break;
    }
    case 1: {
      stC.step = Math.max(stC.step, 2);
      if (stC.placed) { toast('药品已经放好了。', 'warn'); break; }
      stC.placed = true;
      if (stC.form === 'powder') {
        C.powder.visible = true;
        toast('倒进的是大理石粉末——提醒：粉末跟酸的接触面太大，反应会猛得收不住。', 'warn');
      } else {
        C.chips.visible = true;
        toast('块状药品用镊子夹，贴着倾斜的瓶壁轻轻滑到底——直接扔进去会把瓶底砸破。', 'ok');
      }
      break;
    }
    case 2: {
      renderSub([
        { label: '先倒少量酸（漏斗下端露在液面上）', warn: true, onClick: () => pourAcid(5) },
        { label: '加酸没过漏斗下端（液封）', onClick: () => pourAcid(40) },
      ]);
      toast('注入酸时注意液封：长颈漏斗下端必须浸在液面以下，气体才不会从漏斗口逸出。', 'ok');
      break;
    }
    case 3: {
      if (stC.acidML <= 0) { toast('还没有注酸，先「注酸」。', 'warn'); return; }
      if (!stC.placed) { toast('锥形瓶里还没有药品，先「装药品」。', 'warn'); return; }
      stC.step = Math.max(stC.step, 4);
      if (stC.running) { stC.running = false; runBtnTxtC(false); hudTextC.phase = '已暂停'; break; }
      stC.running = true;
      stC.chokeT = 0;
      runBtnTxtC(true);
      hudTextC.phase = '进行中……';
      if (!stC.sealed) {
        toast('酸倒得太少，漏斗下端还露在液面外——气体正顺着漏斗口往外跑。', 'warn');
      }
      break;
    }
    case 4: {
      stC.step = Math.max(stC.step, 5);
      moveVerifyStickB(2.0, 0.28, () => {
        if (stC.collected >= 0.95) {
          bStick.userData.fl.visible = true;
          setTimeout(() => {
            if (bStick) {
              bStick.userData.fl.visible = false;
              puffAt(bStick.position.x, bStick.position.y + 0.01, bStick.position.z);
            }
          }, 900);
          toast('燃着的木条刚靠到瓶口就熄灭了——CO₂ 已经集满一瓶。', 'ok');
        } else {
          toast('木条到瓶口还在烧：瓶口处还不是纯 CO₂，说明没集满。记住验满时木条只能搁瓶口，不能伸进去。', 'warn');
        }
      });
      break;
    }
    case 5: {
      stC.step = 6;
      /* 导管伸入石灰水的演出：气泡 + 变浑浊 */
      for (let i = 0; i < 5; i++) setTimeout(() => spawnBubble(2.32, BENCH_Y + 0.008, 0.1, BENCH_Y + 0.036), i * 160);
      setTimeout(() => {
        if (stC.acid === 'conc') {
          toast('浓盐酸挥发出的 HCl 混进了气体，把石灰水的浑浊现象搅黄了。所以制气要用稀盐酸。', 'warn');
          hudTextC.lime = '仍澄清（混有 HCl）';
        } else if (stC.collected > 0.3) {
          stC.limeCloud = 0.85;
          C.limeLiquid.material.color.set(0xffffff);
          C.limeLiquid.material.opacity = 0.85;
          toast('石灰水泛起白色浑浊：CO₂ + Ca(OH)₂ = CaCO₃↓ + H₂O——见到浑浊就能确认是二氧化碳。', 'ok');
          hudTextC.lime = '变浑浊';
        } else {
          toast('瓶里收到的 CO₂ 还不够，石灰水一点没变。', 'warn');
        }
      }, 900);
      break;
    }
  }
  if (stC.stepBtns) paintSteps(stC.stepBtns, Math.min(stC.step, 6));
  if (stC.step >= 6) clearSub();
}

function pourAcid(ml) {
  clearSub();
  stC.acidML = ml;
  stC.sealed = ml >= 40;
  const k = ml / 40;
  addTween(0.9, (k2) => { C.liquid.scale.y = 0.001 + (k * 0.9 + 0.001) * k2; });
  if (stC.sealed) {
    toast('继续加酸，把漏斗下端泡进液面以下——这叫液封，气体只能走导管，不会从漏斗口溜走。', 'ok');
  } else {
    toast('酸倒得太少，长颈漏斗的下端还露在液面外头。', 'warn');
  }
}

/* ================= 工位 D 实验 ================= */

function resetStationD() {
  stD.busy = false; stD.limeRed = false; stD.ironJar = 'wet'; stD.pourT = -1;
  D.lime.material.color.set(0xeef6fa); D.lime.material.opacity = 0.4;
  D.splint.userData.fl.visible = false;
  D.iron.visible = false;
  D.iron.userData.fl.visible = false;
  D.candLow.fl.visible = false;
  D.candHigh.fl.visible = false;
  D.co2.grp.rotation.z = 0;
  D.co2.grp.position.set(0.52, BENCH_Y, 0.5);
  D.o2d.grp.rotation.z = 0;
  D.o2d.grp.position.set(0.22, BENCH_Y, 0.5);
  hudTextD.o2 = '2 瓶'; hudTextD.co2 = '1 瓶'; hudTextD.indi = '紫色';
  hideFault();
}

function moveObj(obj, to, dur, onDone) {
  const from = obj.position.clone();
  const r0 = obj.rotation.clone();
  addTween(dur, (k) => {
    const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    obj.position.lerpVectors(from, to, e);
    obj.rotation.y = r0.y * (1 - e) + 0.3 * Math.sin(e * Math.PI);
  }, () => { onDone && onDone(); });
}

function doSplintO2() {
  if (stD.busy) return;
  stD.busy = true;
  moveObj(D.splint, new THREE.Vector3(0.14, BENCH_Y + 0.1, 0.5), 0.7, () => {
    D.splint.userData.fl.visible = true;
    toast('带火星的木条一进瓶就复燃了。', 'ok');
    setTimeout(() => { D.splint.userData.fl.visible = false; moveObj(D.splint, new THREE.Vector3(-0.28, BENCH_Y + 0.004, 0.5), 0.6, () => { stD.busy = false; }); }, 1500);
  });
}

function doSplintCO2() {
  if (stD.busy) return;
  stD.busy = true;
  moveObj(D.splint, new THREE.Vector3(0.52, BENCH_Y + 0.1, 0.5), 0.7, () => {
    for (let i = 0; i < 4; i++) setTimeout(() => puffAt(0.52 + (Math.random() - 0.5) * 0.02, BENCH_Y + 0.12, 0.5), i * 180);
    toast('火焰当场熄灭——CO₂ 自己不烧，也不帮别人烧。', 'warn');
    setTimeout(() => moveObj(D.splint, new THREE.Vector3(-0.28, BENCH_Y + 0.004, 0.5), 0.6, () => { stD.busy = false; }), 1300);
  });
}

function doLime() {
  if (stD.busy) return;
  stD.busy = true;
  for (let i = 0; i < 5; i++) setTimeout(() => spawnBubble(0.92, BENCH_Y + 0.012, 0.5, BENCH_Y + 0.05), i * 160);
  setTimeout(() => {
    D.lime.material.color.set(0xffffff);
    D.lime.material.opacity = 0.85;
    hudTextD.lime = '变浑浊';
    toast('晃一晃，石灰水慢慢泛白变浑（白色 CaCO₃ 沉淀）——这是 CO₂ 的专属检验法。', 'ok');
    stD.busy = false;
  }, 700);
}

function doIron() {
  if (stD.busy) return;
  stD.busy = true;
  const dry = stD.ironJar === 'dry';
  const jarX = dry ? 0.22 : 0.06;
  D.iron.visible = true;
  D.iron.position.set(-0.3, BENCH_Y + 0.02, 0.5);
  D.iron.userData.fl.visible = true;
  toast('划着火柴系在铁丝下端，等火柴快烧完时再把铁丝伸进氧气瓶……', 'ok');
  setTimeout(() => {
    moveObj(D.iron, new THREE.Vector3(jarX, BENCH_Y + 0.05, 0.5), 0.8, () => {
      for (let i = 0; i < 8; i++) setTimeout(() => puffAt(jarX + (Math.random() - 0.5) * 0.05, BENCH_Y + 0.05 + Math.random() * 0.05, 0.5, 'spark'), i * 130);
      if (dry) {
        setTimeout(() => {
          D.iron.userData.fl.visible = false;
          D.iron.visible = false;
          /* 瓶底炸裂演出：瓶体倾倒 */
          addTween(0.6, (k) => {
            D.o2d.grp.rotation.z = -k * 1.2;
            D.o2d.grp.position.z = 0.5 - k * 0.06;
          });
          showFault('<b>瓶底炸裂了！</b>铁丝烧得火星四溅，高温熔融物直接砸在没有水的瓶底上。<br><b>正确操作</b>：实验前瓶里要预先放少量水或铺一层细沙。换「瓶底有少量水」的氧气瓶重做。');
          hudTextD.o2 = '1 瓶（1 瓶已损坏）';
          stD.busy = false;
        }, 1200);
      } else {
        toast('铁丝烧得又红又亮，火星四处飞溅，放出大量热，留下黑色固体（Fe₃O₄）。瓶底那点水正好接住熔融物，保住了瓶底。', 'ok');
        setTimeout(() => {
          D.iron.userData.fl.visible = false;
          D.iron.visible = false;
          stD.busy = false;
        }, 1600);
      }
    });
  }, 900);
}

function doPourCO2() {
  if (stD.busy) return;
  stD.busy = true;
  D.candLow.fl.visible = true;
  D.candHigh.fl.visible = true;
  const g = D.co2.grp;
  addTween(1.6, (k) => {
    g.rotation.z = Math.sin(Math.min(k * 1.4, 1) * Math.PI * 0.5) * 1.15;
    g.position.y = BENCH_Y + Math.sin(Math.min(k * 1.4, 1) * Math.PI * 0.5) * 0.05;
    if (k > 0.25 && Math.random() < 0.6) {
      puffAt(0.44 + Math.random() * 0.14, BENCH_Y + 0.09 - k * 0.05, 0.2, 'mist');
    }
  }, () => {
    addTween(0.8, (k) => {
      g.rotation.z = 1.15 * (1 - k);
      g.position.y = BENCH_Y + 0.05 * (1 - k);
    });
  });
  toast('像倒水那样，把二氧化碳缓缓倾进烧杯里……', 'ok');
  setTimeout(() => { D.candLow.fl.visible = false; toast('……下层的蜡烛先灭了……', 'warn'); }, 1000);
  setTimeout(() => {
    D.candHigh.fl.visible = false;
    toast('……上层的蜡烛这才熄灭。CO₂ 沉在底部往上堆——密度比空气大，自己不烧也不让别人烧。', 'warn');
    stD.busy = false;
  }, 2000);
}

function doIndCO2() {
  if (stD.busy) return;
  stD.busy = true;
  for (let i = 0; i < 4; i++) setTimeout(() => spawnBubble(-0.62, BENCH_Y + 0.012, 0.5, BENCH_Y + 0.038), i * 200);
  setTimeout(() => {
    D.indLiquid.material.color.set(0xd85a6a);
    stD.limeRed = true;
    hudTextD.indi = '红色';
    toast('紫色石蕊试液慢慢变红：CO₂ 溶于水生成 H₂CO₃，是碳酸把石蕊染红的。再点「加热石蕊」看看会怎样。', 'ok');
    stD.busy = false;
  }, 1000);
}

function doIndHeat() {
  if (stD.busy) return;
  if (!stD.limeRed) { toast('先通入 CO₂ 让石蕊变红，再加热观察。', 'warn'); return; }
  stD.busy = true;
  for (let i = 0; i < 3; i++) setTimeout(() => puffAt(-0.62, BENCH_Y + 0.07, 0.5), i * 260);
  setTimeout(() => {
    D.indLiquid.material.color.set(0x8a5fc0);
    stD.limeRed = false;
    hudTextD.indi = '紫色';
    toast('红色渐渐褪掉，溶液回到紫色：碳酸太不稳定，一加热就分解 H₂CO₃ = H₂O + CO₂↑。', 'ok');
    stD.busy = false;
  }, 900);
}
/* ================= 控件面板与章节 ================= */

const ctl = createControlsPanel(document.getElementById('controls'));
const stepBar = document.getElementById('stepBar');
let activeSectionCleanup = null;
let cockSlider = null;   // B 章活塞开度滑杆引用

const hudTextA = { phase: '还没有操作', temp: '25 ℃', flow: '—', purity: '—', collect: '0%', vol: '0%', kmno4: '3.0 g' };
const hudTextB = { phase: '还没有操作', drip: '0.0 滴/秒', rate: '—', funnel: '0 mL', vol: '0%', mno2: '未加', total: '0 mL' };
const hudTextC = { phase: '还没有操作', rate: '—', leak: '无', vol: '0%', acid: '未注入', lime: '澄清', total: '0 mL' };
const hudTextD = { o2: '2 瓶', co2: '1 瓶', indi: '紫色' };

function hideAllStations() {
  stA.group.visible = false;
  stB.group.visible = false;
  stC.group.visible = false;
  stD.group.visible = false;
  setHUD(null);
  clearSub();
  hideFault();
  stA.heating = false; stA.lit = false; stA.collecting = false; stA.swingT = -1;
  stB.running = false;
  stC.running = false;
  stD.busy = false;
  activeDotPath = null; onDotArrive = null;
  if (verifyStick) { scene.remove(verifyStick); verifyStick = null; }
  if (bStick) { scene.remove(bStick); bStick = null; }
  if (D.iron) { D.iron.visible = false; D.iron.userData.fl.visible = false; }
  chartSetVisible(false);
  registerClicks([]);
}

function buildSteps(btnDefs) {
  stepBar.style.display = '';
  stepBar.innerHTML = '';
  const btns = btnDefs.map(([n, full, i], idx) => {
    const b = ctl.button({ label: n, onClick: () => btnDefs[idx][3]() });
    b.classList.add('gas-step');
    b.title = full;
    stepBar.appendChild(b);
    return b;
  });
  return btns;
}

/* 器材点击（射线拾取）：也可以直接点击桌上的器材执行当前步骤 */
const clickTargets = [];   // { root, id }
function registerClicks(list) {
  clickTargets.length = 0;
  clickTargets.push(...list);
}
function bindClick(root, id) {
  root.traverse((o) => { o.userData.clickId = id; });
  clickTargets.push({ root, id });
}

const raycaster = new THREE.Raycaster();
const pointerNdc = new THREE.Vector2();
stage.addEventListener('pointerup', (e) => {
  if (!labReady || clickTargets.length === 0) return;
  const r = stage.getBoundingClientRect();
  pointerNdc.x = ((e.clientX - r.left) / r.width) * 2 - 1;
  pointerNdc.y = -((e.clientY - r.top) / r.height) * 2 + 1;
  raycaster.setFromCamera(pointerNdc, app.camera);
  /* 只对当前可见的器材做拾取（隐藏工位的 root 不参与） */
  const isShown = (o) => { let n = o; while (n) { if (!n.visible) return false; n = n.parent; } return true; };
  const roots = clickTargets.filter((t) => isShown(t.root)).map((t) => t.root);
  if (!roots.length) return;
  const hits = raycaster.intersectObjects(roots, true);
  if (!hits.length) return;
  let o = hits[0].object;
  while (o && !o.userData.clickId) o = o.parent;
  if (!o) return;
  stationClick(o.userData.clickId);
});

function stationClick(id) {
  const idx = chapterIdx;
  if (idx === 0) {
    /* A 工位：试管=查/装、酒精灯=点燃或盖灭、集气瓶=收集/盖片、导管口=离、烧瓶夹=定 */
    if (id === 'tube') {
      if (stA.step === 0) doStepA(0);
      else if (stA.step === 1) doStepA(1);
      else toast(`下一步：「${STEP_FULL_A[stA.step] || '已完成'}」。`, 'warn');
    } else if (id === 'lamp') {
      if (stA.step === 3 && !stA.lit) doLightLamp();
      else if (stA.step === 6) doStepA(6);
      else if (stA.step === 3 && stA.lit) doPreheat();
      else toast(stA.step === 4 ? '酒精灯正在加热，可以收集气体了。' : '下一步：「' + (STEP_FULL_A[stA.step] || '实验已完成') + '」。', 'warn');
    } else if (id === 'clamp') {
      if (stA.step === 2) doStepA(2);
      else toast('下一步：「' + (STEP_FULL_A[stA.step] || '实验已完成') + '」。', 'warn');
    } else if (id === 'jar') {
      if (stA.step === 4 && stA.heating) doStepA(4);
      else if (stA.collected >= 0.99 && !stA.jarOut) coverJarAndLift();
      else toast('下一步：「' + (STEP_FULL_A[stA.step] || '实验已完成') + '」。', 'warn');
    } else if (id === 'del') {
      if (stA.step === 5) doStepA(5);
      else toast('下一步：「' + (STEP_FULL_A[stA.step] || '实验已完成') + '」。', 'warn');
    }
  } else if (idx === 1) {
    if (id === 'funnel') { if (stB.step <= 1) doStepB(1); else toast('下一步：「' + (STEP_FULL_B[Math.min(stB.step, 6)] || '已完成') + '」。', 'warn'); }
    else if (id === 'flask') { if (stB.step <= 2 && !stB.mno2Added) doStepB(2); else doStepB(3); }
    else if (id === 'jarU' || id === 'jarD') { if (stB.step >= 3 && !stB.running) doStepB(3); else doStepB(4); }
  } else if (idx === 2) {
    if (id === 'flask') { if (!stC.placed) doStepC(1); else doStepC(3); }
    else if (id === 'funnel') { if (stC.step <= 2) doStepC(2); else toast('下一步：「' + (STEP_FULL_C[Math.min(stC.step, 5)] || '已完成') + '」。', 'warn'); }
    else if (id === 'jar') doStepC(4);
  } else if (idx === 3) {
    if (id === 'o2w' || id === 'o2d') doSplintO2();
    else if (id === 'co2') doSplintCO2();
    else if (id === 'lime') doLime();
    else if (id === 'candle') doPourCO2();
    else if (id === 'indi') doIndCO2();
    else if (id === 'iron') doIron();
  }
}

const SECTIONS = [
  {
    title: '加热高锰酸钾制氧气',
    html: `<p>高锰酸钾是紫黑色的晶体，受热分解放出氧气。氧气<b>不易溶于水</b>，可以用<b>排水法</b>收集。</p>
<p>记住七个字：<span class="hl">查、装、定、点、收、离、熄</span>，最后用带火星的木条<b>验</b>。按顺序完成步骤——也可以故意做错一步，看看会发生什么。</p>
<p>⚠️ 试管口要<b>略向下倾斜</b>；先<b>预热</b>再集中加热；结束先<b>撤导管</b>再熄灯，否则水倒吸炸裂试管。</p>
<p>反应原理：2KMnO₄ —Δ→ K₂MnO₄ + MnO₂ + O₂↑</p>`,
    enter() {
      hideAllStations();
      resetStationA();
      stA.group.visible = true;
      app.setCamera([-0.72, 1.68, 1.85], [-1.42, 1.0, 0.03]);
      chartSetVisible(true);
      flowHist.length = 0;
      setHUD([
        ['phase', '状态'], ['temp', '试管温度'], ['flow', '导管口气流'],
        ['purity', '气泡含氧量'], ['vol', '瓶内 O₂ 体积分数'], ['collected', '已收集'], ['kmno4', 'KMnO₄ 剩余'],
      ]);
      ctl.clear();
      stA.stepBtns = buildSteps(STEP_NAMES_A.map((n, i) => [n, STEP_FULL_A[i], i, () => doStepA(i)]));
      ctl.el.appendChild(subRow);
      ctl.sep();
      ctl.slider({
        label: '酒精灯火力', min: 0.4, max: 2, step: 0.1, value: 1,
        fmt: (v) => (v < 0.8 ? '小 ' : v > 1.5 ? '大 ' : '') + v.toFixed(1) + '×',
        onInput: (v) => { stA.power = v; },
      });
      ctl.button({ label: '↺ 重置', onClick: () => SECTIONS[0].enter() });
      /* 器材点击注册 */
      registerClicks([]);
      bindClick(A.tubeG, 'tube');
      bindClick(A.lamp, 'lamp');
      bindClick(A.clamp, 'clamp');
      bindClick(A.jarG, 'jar');
      bindClick(A.del.mesh, 'del');
      toast('下一步看步骤条 · 也可以直接点桌上的器材', 'ok');
    },
  },
  {
    title: '分解过氧化氢制氧气',
    html: `<p>过氧化氢溶液在常温下分解得很慢；加入<b>二氧化锰</b>后迅速放出氧气，二氧化锰本身的质量和化学性质不变——它是<b>催化剂</b>。</p>
<p>这套装置<b>不需要加热</b>。用<b>分液漏斗</b>控制滴加速度，从而控制反应速率。先不加二氧化锰滴一会儿，再加入，比较冒泡的快慢。</p>
<p>2H₂O₂ <span class="hl">—MnO₂→</span> 2H₂O + O₂↑；氧气<b>不易溶于水</b>（排水法）、<b>密度比空气略大</b>（向上排空气法）。</p>`,
    enter() {
      hideAllStations();
      resetStationB();
      stB.group.visible = true;
      app.setCamera([0.62, 1.9, 2.35], [0.18, 0.97, 0.1]);
      chartSetVisible(true);
      flowHist.length = 0;
      setHUD([
        ['phase', '状态'], ['drip', '滴加速度'], ['rate', 'O₂ 生成速率'], ['funnel', '分液漏斗中'],
        ['vol', '瓶内 O₂ 体积分数'], ['mno2', '二氧化锰'], ['total', '累计 O₂ 产量'],
      ]);
      ctl.clear();
      stB.stepBtns = buildSteps(STEP_NAMES_B.map((n, i) => [n, STEP_FULL_B[i], i, () => doStepB(i)]));
      ctl.sep();
      const modeSeg = ctl.seg({
        options: [{ label: '排水法', value: 'drain' }, { label: '向上排空气', value: 'air' }],
        value: 'drain',
        onChange: (v) => {
          stB.mode = v;
          stB.collected = 0;
          B.jarDWater.scale.y = 1; B.jarDWater.position.y = 0.0525;
          B.jarUFill.scale.y = 0.001;
          B.jarDG.visible = B.trough.visible = v === 'drain';
          B.jarUG.visible = B.plateU.visible = v === 'air';
          B.delAir.mesh.visible = v === 'air';
          B.delDrain.mesh.visible = v === 'drain';
          activeDotPath = (v === 'drain' ? B.delDrain : B.delAir).curve;
          hudTextB.vol = '0%';
        },
      });
      cockSlider = ctl.slider({
        label: '活塞开度', min: 0, max: 1, step: 0.02, value: 0,
        fmt: (v) => (v <= 0.02 ? '全关' : v >= 0.98 ? '全开' : Math.round(v * 100) + '%'),
        onInput: (v) => applyCock(v),
      });
      applyCock(0);
      ctl.button({ label: '↺ 重置', onClick: () => SECTIONS[1].enter() });
      activeDotPath = B.delDrain.curve;
      registerClicks([]);
      bindClick(B.funnel, 'funnel');
      bindClick(B.flask, 'flask');
      bindClick(B.jarUG, 'jarU');
      bindClick(B.jarDG, 'jarD');
      toast('下一步看步骤条 · 也可以直接点桌上的器材', 'ok');
    },
  },
  {
    title: '制取二氧化碳',
    html: `<p>实验室用<b>大理石（或石灰石）与稀盐酸</b>反应制取二氧化碳，不需要加热。</p>
<p>CaCO₃ + 2HCl = CaCl₂ + H₂O + CO₂↑</p>
<p>CO₂ <b>能溶于水</b>、<b>密度比空气大</b>，用<span class="hl">向上排空气法</span>收集；验满时把燃着的木条放在<b>瓶口</b>；用澄清石灰水检验。</p>
<p>换成稀硫酸、浓盐酸或大理石粉末试试，想一想实验室为什么不用它们。长颈漏斗下端必须<span class="hl">泡在液面以下</span>形成液封。</p>`,
    enter() {
      hideAllStations();
      resetStationC();
      stC.group.visible = true;
      app.setCamera([2.28, 1.9, 2.35], [1.72, 0.97, 0.1]);
      chartSetVisible(true);
      flowHist.length = 0;
      setHUD([
        ['phase', '状态'], ['rate', 'CO₂ 生成速率'], ['leak', '从漏斗逸出'],
        ['vol', '瓶内 CO₂ 体积分数'], ['acid', '瓶中的酸量'], ['lime', '石灰水浑浊度'], ['total', '累计 CO₂ 产量'],
      ]);
      ctl.clear();
      stC.stepBtns = buildSteps(STEP_NAMES_C.map((n, i) => [n, STEP_FULL_C[i], i, () => doStepC(i)]));
      ctl.el.appendChild(subRow);
      ctl.sep();
      /* 条件改变 → 实验重新开始（步骤机整体复位，保留所选药品组合） */
      function restartExperimentC(hint) {
        stC.running = false; stC.step = 0;
        stC.acidML = 0; stC.sealed = false; stC.placed = false;
        stC.collected = 0; stC.total = 0; stC.chokeT = 0; stC.limeCloud = 0;
        stC.fullToastC = false; stC.chokeToasted = false;
        C.liquid.scale.y = 0.001;
        C.chips.visible = false; C.powder.visible = false;
        C.fWater.scale.y = 0.001;
        C.fill.scale.y = 0.001;
        C.limeLiquid.material.color.set(0xeef6fa);
        C.limeLiquid.material.opacity = 0.4;
        hudTextC.phase = '条件已改变，实验重新开始';
        hudTextC.rate = '—'; hudTextC.leak = '无'; hudTextC.vol = '0%';
        hudTextC.acid = '未注入'; hudTextC.lime = '澄清'; hudTextC.total = '0 mL';
        clearSub();
        if (stC.stepBtns) paintSteps(stC.stepBtns, 0);
        if (hint) toast(hint, 'warn');
      }
      ctl.seg({
        options: [
          { label: '酸：稀盐酸', value: 'hcl' },
          { label: '酸：稀硫酸', value: 'h2so4' },
          { label: '酸：浓盐酸', value: 'conc' },
        ],
        value: 'hcl',
        onChange: (v) => {
          stC.acid = v;
          let hint = null;
          if (v === 'h2so4') hint = '提示：生成的 CaSO₄ 微溶于水，会覆盖在大理石表面使反应停止。';
          if (v === 'conc') hint = '提示：浓盐酸易挥发，制得的 CO₂ 混有 HCl，石灰水不易变浑浊。';
          restartExperimentC(hint);
        },
      });
      ctl.seg({
        options: [
          { label: '大理石：块状', value: 'chunk' },
          { label: '大理石：粉末', value: 'powder' },
        ],
        value: 'chunk',
        onChange: (v) => {
          stC.form = v;
          if (C.lblMarble) setSpriteText(C.lblMarble, v === 'powder' ? '大理石粉末' : '大理石');
          restartExperimentC(v === 'powder' ? '提示：粉末与酸接触面积太大，反应会过于剧烈，不便收集。' : null);
        },
      });
      ctl.button({ label: '↺ 重置', onClick: () => SECTIONS[2].enter() });
      activeDotPath = C.del.curve;
      registerClicks([]);
      bindClick(C.flask, 'flask');
      bindClick(C.funnel, 'funnel');
      bindClick(C.jarG, 'jar');
      toast('下一步看步骤条 · 也可以直接点桌上的器材', 'ok');
    },
  },
  {
    title: '氧气与二氧化碳的性质',
    html: `<p>桌上已经准备好收集满的氧气和二氧化碳。</p>
<p><b>氧气</b>能支持燃烧：带火星的木条复燃；铁丝在氧气中剧烈燃烧、火星四射，生成黑色固体四氧化三铁——<span class="hl">瓶底要预先放少量水或细沙</span>，防止高温熔融物炸裂瓶底。</p>
<p><b>二氧化碳</b>不能燃烧也不支持燃烧，密度比空气大（阶梯蜡烛下层先灭），能与水反应生成碳酸（石蕊变红，受热又褪回紫色）。</p>`,
    enter() {
      hideAllStations();
      resetStationD();
      stD.group.visible = true;
      app.setCamera([0.78, 1.85, 2.8], [0.28, 0.97, 0.3]);
      setHUD([['o2', '氧气瓶'], ['co2', '二氧化碳瓶'], ['indi', '石蕊试液']]);
      ctl.clear();
      ctl.seg({
        options: [{ label: '铁丝实验：瓶底留少量水', value: 'wet' }, { label: '铁丝实验：瓶底不放水', value: 'dry' }],
        value: 'wet',
        onChange: (v) => { stD.ironJar = v; },
      });
      ctl.sep();
      ctl.button({ label: '🔥 带火星木条 → O₂瓶', onClick: doSplintO2 });
      ctl.button({ label: '🕯 燃着木条 → CO₂瓶', onClick: doSplintCO2 });
      ctl.button({ label: '💧 倒石灰水 → CO₂瓶', onClick: doLime });
      ctl.button({ label: '⛓ 铁丝 → O₂瓶', onClick: doIron });
      ctl.button({ label: '🕯 CO₂ → 阶梯蜡烛', onClick: doPourCO2 });
      ctl.button({ label: '🧪 CO₂ → 紫色石蕊', onClick: doIndCO2 });
      ctl.button({ label: '🔥 加热石蕊', onClick: doIndHeat });
      ctl.button({ label: '📋 验满演示', onClick: () => toast('验满 O₂：带火星木条搁瓶口，复燃即满；验满 CO₂：燃着木条搁瓶口，火灭即满。', 'ok') });
      ctl.button({ label: '↺ 重置', onClick: () => SECTIONS[3].enter() });
      registerClicks([]);
      bindClick(D.o2w.grp, 'o2w');
      bindClick(D.o2d.grp, 'o2d');
      bindClick(D.co2.grp, 'co2');
      bindClick(D.limeBottle, 'lime');
      const candWrap = new THREE.Group();
      candWrap.add(D.candLow.grp, D.candHigh.grp);
      stD.group.add(candWrap);
      bindClick(candWrap, 'candle');
      bindClick(D.indLiquid, 'indi');
      bindClick(D.indCup, 'indi');
      bindClick(D.iron, 'iron');
      toast('观察现象，或在右侧调整条件；也可以直接点击桌上的器材', 'ok');
    },
  },
  {
    title: '随堂检测',
    html: `<p>回顾四个实验，完成下面的 7 道选择题。</p>`,
    enter() {
      hideAllStations();
      app.setCamera([0.7, 2.2, 3.6], [0.1, 1.0, 0]);
      ctl.clear();
      showQuiz();
    },
  },
];

function runBtnTxtC(on) { hudTextC.phase = on ? '进行中……' : stC.step >= 4 ? '已暂停' : '待反应'; }

/* ---------------- 随堂检测（7 题） ---------------- */

const QUIZ = [
  {
    q: '加热高锰酸钾制氧气时，要求试管口稍稍向下倾斜，主要原因是',
    opts: ['方便加热操作', '防止冷凝水倒流回灼热管底，造成试管炸裂', '让氧气排得更快', '避免药品粉末进入导管'],
    a: 1,
    ex: '加热时药品里的水分会在管口凝成水珠。管口朝上，水珠会倒流回灼热的管底，试管一激就裂——所以管口要微微朝下。（挡粉末靠的是管口的棉花。）',
  },
  {
    q: '排水法收集氧气完毕，正确的收尾操作是',
    opts: ['先灭酒精灯，后撤导管', '先撤导管，后灭酒精灯', '两个动作一起做', '顺序不重要'],
    a: 1,
    ex: '灯先灭的话，管内气体遇冷收缩、压强变小，水槽里的水会顺着导管被吸进灼热的试管，一激就裂。口诀：先「离」后「熄」。',
  },
  {
    q: '排水法收集氧气时，什么时候开始收集最合适？',
    opts: ['导管口刚冒出第一个气泡', '酒精灯一点着就收', '气泡连成一串、均匀冒出时', '试管内药品发黑时'],
    a: 2,
    ex: '最先冒出的气泡是管内受热膨胀的空气；等气泡连成一串又均匀时，出来的才是较纯的氧气。收早了，瓶里的氧气会掺进空气。',
  },
  {
    q: '过氧化氢分解实验里，对二氧化锰的描述哪项是对的？',
    opts: ['加了它氧气产量会变大', '反应完后质量变轻', '加快反应速率，自身质量和化学性质保持不变', '没有它过氧化氢就完全不分解'],
    a: 2,
    ex: '催化剂只管改变速率：反应前后自身质量和化学性质都不变，也不增加产量。没有催化剂过氧化氢照样分解，只是慢得多。',
  },
  {
    q: '实验室制 CO₂，应选择的药品组合是',
    opts: ['大理石 + 稀硫酸', '碳酸钠粉末 + 稀盐酸', '大理石 + 浓盐酸', '大理石 + 稀盐酸'],
    a: 3,
    ex: '稀硫酸的产物 CaSO₄ 微溶，糊在大理石表面让反应停摆；碳酸钠粉末反应猛得收不住；浓盐酸挥发出的 HCl 会搅黄石灰水的浑浊——所以用大理石（石灰石）配稀盐酸。',
  },
  {
    q: '怎么判断一瓶二氧化碳已经集满？',
    opts: ['燃着的木条伸进瓶内', '燃着的木条搁在瓶口', '灌入澄清石灰水', '带火星的木条放瓶口'],
    a: 1,
    ex: '验满看的是瓶口还有没有空气：燃着的木条搁在瓶口，火一灭就算满。石灰水用来检验 CO₂，不是验满；带火星木条是氧气的专用工具。',
  },
  {
    q: '铁丝在氧气中燃烧实验前，瓶底要先放少量水，目的是',
    opts: ['溶解生成的四氧化三铁', '接住高温溅落物，防止炸裂瓶底', '帮铁丝烧得更旺', '消耗瓶内多余的氧气'],
    a: 1,
    ex: '铁丝烧得火星四溅，高温熔融物直接砸在干瓶底上会把瓶底炸裂——预先放少量水（或铺细沙）就是用来接住它们的。',
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
      <div class="big">答对 ${score} / ${QUIZ.length} 题</div>
      <p style="color:var(--text-dim);margin:4px 0 18px">正确率 ${pct}%${pct >= 80 ? '，气体制备的要点你已经掌握了！' : pct >= 60 ? '，大部分概念已经清楚，回顾一下错题。' : '，建议回到前面课题再看一遍哦。'}</p>`;
    const again = document.createElement('button');
    again.type = 'button';
    again.className = 'ctl-btn active';
    again.textContent = '重新作答';
    again.addEventListener('click', () => { idx = 0; score = 0; renderQ(); });
    const back = document.createElement('button');
    back.type = 'button';
    back.className = 'ctl-btn';
    back.textContent = '返回第一个课题';
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

/* ================= 章节导航（左栏列表 + ‹01/05›）与折叠 ================= */

const chapNav = document.getElementById('chapNav');
const chapCount = document.getElementById('chapCount');
const detailNo = document.getElementById('detailNo');
const detailTitle = document.getElementById('detailTitle');
const lessonEl = document.getElementById('lesson');
const detailBody = document.getElementById('detailBody');
const controlsEl = document.getElementById('controls');
const gasShell = document.getElementById('gasShell');
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
  if (activeSectionCleanup) { activeSectionCleanup(); activeSectionCleanup = null; }
  stepBar.style.display = 'none';
  sec.enter();
  accSecs.controls.classList.toggle('acc-empty', !controlsEl.children.length);
  accSecs.data.classList.toggle('acc-empty', chapterIdx >= 4);
  detailBody.scrollTop = 0;
}

/* 栏折叠（左右独立 28px 竖条）× 专注模式（双栏同折）× 大屏（课堂模式） */

const foldLBtn = document.getElementById('foldLBtn');
const unfoldLBtn = document.getElementById('unfoldLBtn');
const foldRBtn = document.getElementById('foldRBtn');
const unfoldRBtn = document.getElementById('unfoldRBtn');
const railNoL = document.getElementById('railNoL');
const railTitleR = document.getElementById('railTitleR');
const focusBtn = document.getElementById('focusBtn');

const FOLD_KEY = { l: 'gas.foldL', r: 'gas.foldR' };
let foldL = false;
let foldR = false;
let focusSaved = null;
try {
  foldL = localStorage.getItem(FOLD_KEY.l) === '1';
  foldR = localStorage.getItem(FOLD_KEY.r) === '1';
} catch (e) { /* localStorage 不可用时仅会话内生效 */ }

function applyFold() {
  gasShell.classList.toggle('fold-l', foldL);
  gasShell.classList.toggle('fold-r', foldR);
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
  gasShell.classList.toggle('focus-mode', on);
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

/* 右栏三块手风琴（讲解 / 条件 / 记录），localStorage 记忆、切章不重置 */

const ACC_KEYS = { lesson: 'gas.accLesson', controls: 'gas.accControls', data: 'gas.accData' };
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

/* 原版功能块：上一/下一课题（, .）· 重做实验 · 器材名称 · 大屏（课堂模式）· ] 收起右侧面板 */

const chapPrev = document.getElementById('chapPrev');
const chapNext = document.getElementById('chapNext');
const resetBtn = document.getElementById('resetBtn');
const labelBtn = document.getElementById('labelBtn');
const bigBtn = document.getElementById('bigBtn');

function gotoChapter(i) { selectChapter((i + SECTIONS.length) % SECTIONS.length); }
chapPrev.addEventListener('click', () => gotoChapter(chapterIdx - 1));
chapNext.addEventListener('click', () => gotoChapter(chapterIdx + 1));

resetBtn.addEventListener('click', () => {
  selectChapter(chapterIdx);
  toast('实验已复位，器材回到初始状态。', 'ok');
});

/* 器材名称：桌上器材标签统一显隐（localStorage 记忆） */
let labelsOn = true;
try { labelsOn = localStorage.getItem('gas.labels') !== '0'; } catch (e) { /* 忽略 */ }
let labelsZoomHidden = false;   /* 相机贴近器材时暂时收起标签（不改变用户偏好） */
function applyLabels(force) {
  if (!force && labelsZoomHidden) return;   /* 特写态由帧循环恢复 */
  for (const s of equipLabels) s.visible = labelsOn;
  labelBtn.textContent = '器材名称';
  labelBtn.classList.toggle('on', labelsOn);
  labelBtn.setAttribute('aria-pressed', String(labelsOn));
}
labelBtn.addEventListener('click', () => {
  labelsOn = !labelsOn;
  try { localStorage.setItem('gas.labels', labelsOn ? '1' : '0'); } catch (e) { /* 忽略 */ }
  applyLabels();
});
applyLabels();

/* 大屏（课堂模式）：放大舞台（专注）+ 面板与讲解文字放大 */
let bigMode = false;
function applyBig() {
  document.body.classList.toggle('gas-big', bigMode);
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

/* 键盘快捷键：, 上一课题 / . 下一课题 / ] 收起·展开右侧面板 */
window.addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const t = e.target;
  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
  if (e.key === ',') gotoChapter(chapterIdx - 1);
  else if (e.key === '.') gotoChapter(chapterIdx + 1);
  else if (e.key === ']') toggleFold('r');
});

/* ================= 帧循环 ================= */

let chartTick = 0;
let chartDrawTick = 0;

app.onFrame((dt) => {
  if (!labReady) return;
  const time = performance.now() * 0.001;

  for (let i = tweens.length - 1; i >= 0; i--) {
    const tw = tweens[i];
    tw.t += dt;
    const k = Math.min(tw.t / tw.dur, 1);
    tw.fn(k);
    if (k >= 1) { tweens.splice(i, 1); if (tw.onDone) tw.onDone(); }
  }

  /* —— 工位 A：火焰 / 预热摆动 / 反应推进 —— */
  const uA = A.lamp.userData;
  if (stA.group.visible && uA.flame) {
    uA.flame.visible = stA.lit;
    if (stA.lit) {
      const s = (0.85 + Math.sin(time * 18) * 0.1 + Math.random() * 0.05) * (0.7 + stA.power * 0.3);
      uA.outer.scale.set(0.05 * s, 0.085 * s, 1);
      uA.coneOuter.scale.setScalar(0.9 + stA.power * 0.15);
      uA.light.intensity = 0.85 + Math.sin(time * 20) * 0.2 * stA.power;
    } else {
      uA.light.intensity = 0;
    }
    /* 预热：整灯来回移动 */
    if (stA.swingT >= 0) {
      stA.swingT += dt;
      A.lamp.position.x = -1.655 + Math.sin(stA.swingT * 5) * 0.03;
      if (stA.swingT > 3) {
        stA.swingT = -1;
        stA.preheatDone = true;
        A.lamp.position.x = -1.655;
        toast('预热完成，气泡还在断续——用外焰对准药品部位集中加热吧。', 'ok');
      }
    }
  }
  if (stA.group.visible && stA.step >= 0 && !stA.fault) {
    if (stA.heating) {
      stA.heatT += dt;
      stA.kmno4 = Math.max(0, stA.kmno4 - dt * 0.004 * stA.power);
    }
    if (stA.burstT > 0) {
      stA.burstT -= dt;
      if (Math.random() < dt * 12) spawnBubble(-1.075, 0.955, 0.27, 0.968);
    }
    const bubbling = stA.heating && stA.heatT > 2.5;
    if (bubbling && Math.random() < dt * 8 * stA.power) {
      spawnBubble(-1.075 + (Math.random() - 0.5) * 0.01, 0.95, 0.27, 0.968);
    }
    hudTextA.temp = stA.heating ? Math.round(25 + Math.min(stA.heatT * stA.power * 105, 520)) + ' ℃' : Math.max(25, Math.round((parseFloat(hudTextA.temp) || 25) - dt * 60)) + ' ℃';
    hudTextA.flow = bubbling ? (stA.power * 8).toFixed(0) + ' 气泡/秒' : stA.heating ? '预热中…' : '—';
    hudTextA.purity = bubbling ? Math.round((stA.heatT > 5 ? 0.98 : 0.6 + 0.08 * stA.heatT) * 100) + '%' : '—';
    if (stA.collecting) {
      stA.collected = Math.min(1, stA.collected + dt * 0.09 * stA.power);
      A.jarWater.scale.y = Math.max(0.001, 1 - stA.collected);
      A.jarWater.position.y = 0.0525 * A.jarWater.scale.y;
      if (Math.random() < dt * 6) spawnDot();
      if (stA.collected >= 1 && !stA.fullToast) {
        stA.fullToast = true;
        stA.collecting = false;
        if (!stA.jarOut) {
          toast('瓶里的水全被挤了出去，瓶口正往外翻大气泡——气体收满一瓶了。先在水下盖好玻璃片再取出正放。', 'ok');
          coverJarAndLift(null, true);
        } else {
          toast('瓶里的水全被挤了出去，瓶口正往外翻大气泡——气体收满一瓶了。', 'ok');
        }
      }
    }
    hudTextA.collected = Math.round(stA.collected * 100) + '%';
    hudTextA.vol = Math.round(stA.collected * stA.purity * 100) + '%';
    hudTextA.kmno4 = stA.kmno4.toFixed(1) + ' g';
    chartFlow = bubbling ? clamp(stA.power * 8 / 26, 0, 1) : 0;
    chartPurity = bubbling ? (stA.heatT > 5 ? 0.98 : 0.6 + 0.08 * stA.heatT) : 1;
  }

  /* —— 工位 B：滴加 / 反应 —— */
  if (stB.group.visible) {
    if (stB.burstT > 0) {
      stB.burstT -= dt;
      if (Math.random() < dt * 10) spawnBubble(0.55, BENCH_Y + 0.03, 0.28, BENCH_Y + 0.06);
    }
    const dripping = stB.running && stB.cock > 0.02 && stB.funnelML > 0.5;
    if (dripping) {
      stB.funnelML = Math.max(0, stB.funnelML - dt * stB.cock * 2.2);
      const liq = B.funnel.userData.liquid;
      liq.scale.y = Math.max(0.001, stB.funnelML / 40);
      if (!B.liquid.visible) B.liquid.visible = true;
      const rate = stB.mno2Added ? 26 * stB.cock : 3.5 * stB.cock;
      if (Math.random() < dt * rate) spawnBubble(B.bubbleXZ[0], BENCH_Y + 0.02, B.bubbleXZ[1], BENCH_Y + 0.052, 0.05 + stB.cock * 0.03);
      stB.total += dt * rate * 2.4;
      const acc2 = (stB.mno2Added ? 0.11 : 0.02) * stB.cock;
      stB.collected = Math.min(1, stB.collected + dt * acc2);
      if (Math.random() < dt * (stB.mno2Added ? 5 : 1)) spawnDot();
      if (stB.collected >= 1 && !stB.fullToast) { stB.fullToast = true; toast('氧气收满一瓶了——盖好玻璃片，正立放到台面上。', 'ok'); }
      hudTextB.rate = (stB.mno2Added ? '剧烈（催化）' : '缓慢（无催化剂）') + ' ' + rate.toFixed(0) + ' 气泡/秒';
      chartFlow = clamp(rate / 28, 0, 1);
      chartPurity = stB.mno2Added ? 0.98 : 0.9;
    } else {
      hudTextB.rate = stB.running ? '已滴完（分液漏斗空了）' : '—';
      chartFlow = 0;
      chartPurity = 1;
    }
    hudTextB.drip = (stB.running ? stB.cock * 2.4 : 0).toFixed(1) + ' 滴/秒';
    hudTextB.funnel = Math.round(stB.funnelML) + ' mL';
    hudTextB.vol = Math.round(stB.collected * 100) + '%';
    hudTextB.mno2 = stB.mno2Recycled ? '已回收 · 1.00 g' : stB.mno2Added ? '已加 · 1.00 g' : '未加';
    hudTextB.total = Math.round(stB.total) + ' mL';
    if (stB.mode === 'drain') {
      B.jarDWater.scale.y = Math.max(0.001, 1 - stB.collected);
      B.jarDWater.position.y = 0.0525 * B.jarDWater.scale.y;
      B.jarUFill.scale.y = 0.001;
    } else {
      B.jarUFill.scale.y = Math.max(0.001, stB.collected);
      B.jarDWater.scale.y = 1;
      B.jarDWater.position.y = 0.0525;
    }
  }

  /* —— 工位 C：反应 / 淤塞 / 液封 —— */
  if (stC.group.visible) {
    let rate = 0;
    const sealedOk = stC.sealed;
    if (stC.running && stC.acidML > 0 && stC.placed) {
      if (stC.acid === 'hcl') rate = 16;
      else if (stC.acid === 'h2so4') {
        stC.chokeT += dt;
        rate = stC.chokeT < 3.5 ? 12 : 0;
        if (stC.chokeT >= 3.5 && !stC.chokeToasted) {
          stC.chokeToasted = true;
          toast('气泡越来越稀，最后干脆停了：生成的 CaSO₄ 微溶，糊在大理石表面把酸隔开——这就是不用稀硫酸的原因。', 'warn');
        }
      } else if (stC.acid === 'conc') rate = 16;
      if (stC.form === 'powder') rate = Math.max(rate * 3.6, 58);
    }
    if (rate > 0) {
      if (Math.random() < dt * rate) spawnBubble(C.bubbleXZ[0], BENCH_Y + 0.02, C.bubbleXZ[1], BENCH_Y + 0.048, stC.form === 'powder' ? 0.12 : 0.06);
      if (!sealedOk && Math.random() < dt * 6) {
        /* 气体从长颈漏斗口逸出（漏斗杯口冒泡） */
        spawnBubble(1.491, BENCH_Y + 0.3, 0.02, BENCH_Y + 0.33, 0.02);
      }
    }
    hudTextC.rate = rate === 0 ? (stC.running && stC.acid === 'h2so4' ? '已停止（表面被覆盖）' : '—') : rate > 40 ? '过于剧烈！' : '平稳均匀';
    hudTextC.leak = !sealedOk && rate > 0 ? `有（${(rate * 0.6).toFixed(0)} 气泡/秒）` : '无';
    if (rate > 0 && sealedOk && stC.acid !== 'h2so4') {
      stC.total += dt * rate * 2.2;
      if (stC.acid === 'hcl') {
        stC.collected = Math.min(1, stC.collected + dt * 0.1);
        if (Math.random() < dt * 4) spawnDot();
        if (stC.collected >= 1 && !stC.fullToastC) {
          stC.fullToastC = true;
          stC.running = false;
          runBtnTxtC(false);
          toast('CO₂ 收满一瓶了！验满时把燃着的木条平放在瓶口。', 'ok');
        }
      }
    }
    hudTextC.vol = Math.round(stC.collected * 100) + '%';
    hudTextC.acid = stC.acidML === 0 ? '未注入' : stC.acidML <= 5 ? '少量 5 mL（未液封）' : '足量 40 mL（已液封）';
    hudTextC.lime = stC.acid === 'conc' && stC.limeCloud > 0 ? '仍澄清（混有 HCl）' : stC.limeCloud > 0 ? '变浑浊' : '澄清';
    hudTextC.total = Math.round(stC.total) + ' mL';
    chartFlow = clamp(rate / 60, 0, 1);
    chartPurity = rate > 0 ? (sealedOk ? 0.98 : 0.4) : 1;
  }

  /* —— 工位 D：火焰摆动 / 倾倒烟雾 —— */
  if (stD.group.visible) {
    if (D.candLow.fl.visible) D.candLow.fl.scale.setScalar(1 + Math.sin(time * 16) * 0.1);
    if (D.candHigh.fl.visible) D.candHigh.fl.scale.setScalar(1 + Math.sin(time * 15 + 2) * 0.1);
  }

  updateParticles(dt, time);

  /* 读数写入 */
  if (hud) {
    if (chapterIdx === 0) {
      hud.set('phase', hudTextA.phase);
      hud.set('temp', hudTextA.temp);
      hud.set('flow', hudTextA.flow);
      hud.set('purity', hudTextA.purity);
      hud.set('collected', hudTextA.collected);
      hud.set('vol', hudTextA.vol);
      hud.set('kmno4', hudTextA.kmno4);
    } else if (chapterIdx === 1) {
      hud.set('phase', hudTextB.phase);
      hud.set('drip', hudTextB.drip);
      hud.set('rate', hudTextB.rate);
      hud.set('funnel', hudTextB.funnel);
      hud.set('vol', hudTextB.vol);
      hud.set('mno2', hudTextB.mno2);
      hud.set('total', hudTextB.total);
    } else if (chapterIdx === 2) {
      hud.set('phase', hudTextC.phase);
      hud.set('rate', hudTextC.rate);
      hud.set('leak', hudTextC.leak);
      hud.set('vol', hudTextC.vol);
      hud.set('acid', hudTextC.acid);
      hud.set('lime', hudTextC.lime);
      hud.set('total', hudTextC.total);
    } else if (chapterIdx === 3) {
      hud.set('o2', hudTextD.o2);
      hud.set('co2', hudTextD.co2);
      hud.set('indi', hudTextD.indi);
    }
  }

  /* 相机贴近器材（特写态）时自动收起标签，拉远后恢复（不动用户偏好） */
  const camClose = app.camera.position.distanceTo(app.controls.target) < 0.85;
  if (camClose !== labelsZoomHidden) {
    labelsZoomHidden = camClose;
    if (camClose) { for (const s of equipLabels) s.visible = false; }
    else applyLabels(true);
  }

  /* 气流曲线：每秒采样 + 4Hz 重绘 */
  chartTick += dt;
  if (chartTick >= 1) {
    chartTick = 0;
    flowHist.push({ flow: chartFlow, purity: chartPurity });
    if (flowHist.length > 60) flowHist.shift();
  }
  chartDrawTick += dt;
  if (chartDrawTick >= 0.25) {
    chartDrawTick = 0;
    drawFlowChart();
  }
});

/* ================= 启动 ================= */

buildWorld();
buildProps();
buildStationA();
buildStationB();
buildStationC();
buildStationD();
initChartWindow();
chartSetVisible(false);
labReady = true;

setTimeout(() => {
  loader.hide();
  window.__eduSections = { select: selectChapter };
  window.__gasDebug = { vfx, app };
  selectChapter(0);
}, 60);
