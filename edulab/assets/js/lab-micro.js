/* EduLab · 显微镜实验台（micro）
 * 章节：认识显微镜 / 规范操作 / 成像特点 / 低倍换高倍 / 判断污点位置 / 植物细胞 / 动物细胞 /
 *       草履虫 / 叶片与叶绿体 / 质壁分离与复原 / 有丝分裂 / 血涂片与油镜 / 测微尺 / 血球计数板 /
 *       明场暗场与相差 / 自由观察
 * 视觉工艺（edu-vfx 接入）：
 *       - 后处理管线：暖调工作室背景 + bloom + 暗角 + 颗粒
 *       - 布局：全屏画布铺底 + 左课题卡（章节下拉/上下章/折叠/控件/数据坞）+ 右目镜栏
 *       - 显微镜建模：CatmullRom 中心线放样 C 形弯臂（自研变宽度截面 sweep：金属根/烤漆身/托架三段
 *         质感 + 握持内凹垫 + 横担托架与枢轴轴座）/ 奶油烤漆 clearcoat + 噪点粗糙度 /
 *         物镜 4 枚独立车削造型（铭牌套筒 + 色环 + 油镜环 + 滚花环 + 前透镜）/
 *         同轴粗细准焦旋钮（程序化滚花法线贴图 + 指示点）/ 黄铜压片夹（弹片 + 螺栓）/
 *         双面可翻转反光镜 / 阶梯聚光器 + 光圈拨杆 / 阶梯底座 + 橡胶脚垫
 *       - 桌面道具：试剂瓶阵列（弧面标签：试剂名大字+浓度小字；双层内液+液面高光）/ 开盖载玻片盒
 *         （薄盒体+端部斜切挡板+磨砂端玻片叠）/ 抽纸擦镜纸盒 / 叠放培养皿（微透明皿盖+琼脂面）/ 白瓷滴板
 *       - 接触阴影：程序化径向渐变贴片（免实时 shadowMap）
 *       - 目镜视野：样品离屏画布 + 明场/暗场(反相)/相差(光晕) 合成 + 非线性离焦 + 油镜增亮；
 *         真实感层：暖白照明 + 聚光器光锥渐晕 + 字形墨迹（浸润缘/纤维/针孔）+ 载膜纤维 +
 *         微尘气泡静物 + 半对焦双影；虚拟粗/细准焦旋钮拖拽与 3D 镜身旋钮联动
 * 章节结构 / 交互逻辑 / 随堂检测与旧版一致。
 */
import {
  THREE, TAU, clamp,
  createApp, makeLoader,
  createControlsPanel, makeHUD, makeTextSprite,
} from './edu-core.js';
import {
  PAL, attachVFX, makeStudioEnvironment,
  matCoat, matStd,
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

/* 灯光：暖主光 + 左侧窗光补光 + 正面冷光 + 桌面近距 bounce + 低环境（奶油漆面怕过曝，全链路压低） */
const keyLight = new THREE.DirectionalLight(0xffdcae, 1.5);
keyLight.position.set(4.5, 7.5, 6);
scene.add(keyLight);
const frontLight = new THREE.DirectionalLight(0xe8f0ff, 0.5);
frontLight.position.set(1.5, 3, 9);
scene.add(frontLight);
const windowFill = new THREE.DirectionalLight(0xcfe0f0, 0.45);
windowFill.position.set(-6, 4.5, 2);
scene.add(windowFill);
const ambLight = new THREE.AmbientLight(0x9a948a, 0.32);
scene.add(ambLight);
const deskBounce = new THREE.PointLight(0xffd9a0, 0.35, 7, 1.8);
deskBounce.position.set(1.6, 1.1, 2.4);
scene.add(deskBounce);
const lampPoint = new THREE.PointLight(0xffd9a0, 1.4, 5, 1.6);
lampPoint.position.set(0, 0.55, 0.6);
scene.add(lampPoint);
/* 暖调棚拍下再压一档曝光，保住烤漆高光层次 */
app.renderer.toneMappingExposure = 0.92;

const mesh = (geo, mat) => new THREE.Mesh(geo, mat);
function label(text, color = '#ffffff', scale = 0.0042, bg = 'rgba(8,12,18,0.72)') {
  return makeTextSprite(text, { fontSize: 32, color, scale, bg });
}

/* ---------------- 程序化工艺贴图 ---------------- */

/* 漆面微噪点粗糙度贴图（烤漆上的细密橘皮/划痕感） */
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

/* 滚花法线贴图：逐列正弦沟槽 → 法线编码（旋钮防滑纹） */
function knurlNormalTexture(cols = 64) {
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

/* 铭牌贴花面片（品牌字样，多边形偏移防 z-fight） */
function decalPlane(tex, w, h) {
  const mat = new THREE.MeshStandardMaterial({
    map: tex, transparent: true, roughness: 0.5, metalness: 0,
    depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2,
  });
  return mesh(new THREE.PlaneGeometry(w, h), mat);
}

/* 镜臂侧面品牌铭牌（自绘文案） */
function brandDecalTexture() {
  return canvasTex(512, 160, (ctx) => {
    ctx.clearRect(0, 0, 512, 160);
    ctx.fillStyle = 'rgba(58,56,52,0.92)';
    ctx.font = `700 92px 'Avenir Next', 'Helvetica Neue', sans-serif`;
    ctx.textBaseline = 'middle';
    ctx.fillText('EDULAB', 12, 62);
    ctx.font = `400 30px 'Avenir Next', 'Helvetica Neue', sans-serif`;
    ctx.fillStyle = 'rgba(176,96,58,0.95)';
    ctx.fillText('M-16 · STUDENT MICROSCOPE', 14, 130);
  });
}

/* 物镜铭牌套筒贴图（倍率 / 数值孔径 / 机械筒长，两列重复便于环绕） */
function objectiveSleeveTexture(spec) {
  return canvasTex(512, 64, (ctx) => {
    ctx.fillStyle = '#ded9cc';
    ctx.fillRect(0, 0, 512, 64);
    ctx.fillStyle = '#26292e';
    ctx.font = `600 26px 'Helvetica Neue', Arial, sans-serif`;
    ctx.textBaseline = 'middle';
    const line = `EDU ${spec.mag}× / NA ${spec.na.toFixed(2)}${spec.oil ? ' OIL' : ''}`;
    ctx.fillText(line, 10, 34);
    ctx.fillText(line, 262, 34);
  });
}

/* 接触阴影：桌面级一张径向渐变烘焙贴图（单 draw call，免实时 shadowMap） */
const SHADOW_BLOBS = [];
function bakeContactShadow(x, z, w, d, opacity = 0.4) {
  SHADOW_BLOBS.push({ x, z, w, d, opacity });
}
function buildTableShadow() {
  const CW = 1024, CH = 704;              /* 桌面 9.6 × 6.6 */
  const cv = document.createElement('canvas');
  cv.width = CW; cv.height = CH;
  const ctx = cv.getContext('2d');
  for (const b of SHADOW_BLOBS) {
    const px = ((b.x + 4.8) / 9.6) * CW;
    const pz = ((b.z + 3.3) / 6.6) * CH;
    const rx = (b.w / 9.6) * CW / 2;
    const rz = (b.d / 6.6) * CH / 2;
    const g = ctx.createRadialGradient(px, pz, 0, px, pz, Math.max(rx, rz));
    g.addColorStop(0, `rgba(10,7,4,${b.opacity})`);
    g.addColorStop(0.55, `rgba(10,7,4,${b.opacity * 0.5})`);
    g.addColorStop(1, 'rgba(10,7,4,0)');
    ctx.save();
    ctx.translate(px, pz);
    ctx.scale(rx / Math.max(rx, rz), rz / Math.max(rx, rz));
    ctx.translate(-px, -pz);
    ctx.fillStyle = g;
    ctx.fillRect(px - Math.max(rx, rz), pz - Math.max(rx, rz), Math.max(rx, rz) * 2, Math.max(rx, rz) * 2);
    ctx.restore();
  }
  const tex = new THREE.CanvasTexture(cv);
  const m = mesh(new THREE.PlaneGeometry(9.6, 6.6), new THREE.MeshBasicMaterial({
    map: tex, transparent: true, depthWrite: false,
  }));
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.0045;
  m.renderOrder = -1;
  return m;
}

/* ---------------- 圆角几何小工具 ---------------- */

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

/* 圆角平板（挤出 + 倒角，rotateX 落平：顶面 y = h + bevel） */
function roundedSlab(w, d, h, r, mat, bevel = 0.02) {
  const g = new THREE.ExtrudeGeometry(roundedRectShape(w, d, r), {
    depth: h, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel,
    bevelSegments: 3, curveSegments: 14,
  });
  g.rotateX(-Math.PI / 2);
  return new THREE.Mesh(g, mat);
}

/* ---------------- 材质分层（金属/烤漆工艺） ---------------- */

const M_PAINT = matCoat(0xe9e4d8, {            // 奶油烤漆（镜身主体）
  roughness: 0.42, metalness: 0.04, clearcoat: 0.7, clearcoatRoughness: 0.25,
});
M_PAINT.roughnessMap = paintNoiseTexture(256, 3);
const M_PAINT_DARK = matCoat(0x2a2e34, {       // 深色饰件烤漆
  roughness: 0.4, metalness: 0.1, clearcoat: 0.45, clearcoatRoughness: 0.3,
});
const M_STAGE_DARK = matCoat(0x121519, {       // 载物台深色台面
  roughness: 0.48, metalness: 0.2, clearcoat: 0.35, clearcoatRoughness: 0.4,
});
const M_RUBBER = matStd(0x1d2126, { roughness: 0.88, metalness: 0.04 });   // 橡胶握纹
const M_CHROME = matStd(0xe6e9ee, { roughness: 0.14, metalness: 1 });      // 镀铬
const M_SATIN = matStd(0xc9cdd3, { roughness: 0.3, metalness: 1 });        // 缎面金属
M_SATIN.roughnessMap = paintNoiseTexture(128, 2);
const M_BRASS = matStd(PAL.brass, { roughness: 0.3, metalness: 1 });       // 黄铜
const M_STEEL_DARK = matStd(0x3a3d42, { roughness: 0.35, metalness: 0.9 });
const M_GLASS = matCoat(0xe6f0f2, { roughness: 0.05, opacity: 0.26 });   /* 玻璃（透明 + 高光，免 transmission 通道） */
const M_LENS = matCoat(0x262e38, {             // 镜片（虹彩镀膜观感）
  roughness: 0.05, metalness: 0.2, clearcoat: 1,
});
M_LENS.iridescence = 1;
M_LENS.iridescenceIOR = 1.6;
M_LENS.envMapIntensity = 1.6;
/* 滚花材质工厂（法线贴图 + 密度可调） */
function matKnurl(color, metal = 0.4, cols = 64) {
  const m = matStd(color, { roughness: 0.38, metalness: metal });
  m.normalMap = knurlNormalTexture(cols);
  m.normalScale = new THREE.Vector2(1.3, 1.3);
  return m;
}

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
/* 试剂瓶（LatheGeometry 瓶身 + 双层内液 + 液面高光片 + 弧面标签 + 瓶盖 + 接触阴影）
 * o: { liquid 液色, surf 液面色, name 试剂名, sub 浓度小字, level 液面高度 } */
function makeBottle(x, z, o, heightScale = 1) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  /* 瓶身旋转轮廓：底 → 鼓腹 → 收肩 → 颈口 */
  const prof = [
    [0.0, 0], [0.26, 0], [0.3, 0.03], [0.36, 0.18], [0.4, 0.42], [0.36, 0.62], [0.2, 0.78], [0.14, 0.88], [0.14, 1.0], [0.17, 1.04],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  const glass = matCoat(0xdfeae8, { roughness: 0.08, opacity: 0.3 });
  const body = mesh(new THREE.LatheGeometry(prof, 26), glass);
  g.add(body);
  /* 内液：双层圆柱（底部缓升段 + 主体）+ 液面圆片（低于瓶肩，高光泽） */
  const lv = o.level ?? 0.52;
  const liqMat = matStd(o.liquid, { roughness: 0.25, emissive: o.liquid, emissiveIntensity: o.glow ?? 0.32 });
  const liqLow = mesh(new THREE.CylinderGeometry(0.26, 0.21, 0.1, 20), liqMat);
  liqLow.position.y = 0.1;
  const liqMain = mesh(new THREE.CylinderGeometry(0.295, 0.26, lv - 0.16, 20), liqMat);
  liqMain.position.y = 0.15 + (lv - 0.16) / 2;
  /* 液面圆片：低 env/clearcoat 防白_env 漂白，靠自发光保住色相 */
  const surf = mesh(new THREE.CircleGeometry(0.295, 22), matCoat(o.surf ?? o.liquid, {
    roughness: 0.14, clearcoat: 0.35, emissive: o.liquid, emissiveIntensity: (o.glow ?? 0.32) * 1.5, envMapIntensity: 0.55,
  }));
  surf.rotation.x = -TAU / 4;
  surf.position.y = lv + 0.002;
  /* 液面弯月面高光：斜置细长亮条贴片 */
  const gleamTex = canvasTex(128, 64, (ctx) => {
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
  const gleam = mesh(new THREE.PlaneGeometry(0.3, 0.14), new THREE.MeshBasicMaterial({
    map: gleamTex, transparent: true, depthWrite: false,
  }));
  gleam.rotation.x = -TAU / 4;
  gleam.position.set(-0.05, lv + 0.006, 0.1);
  g.add(liqLow, liqMain, surf, gleam);
  /* 瓶盖 */
  const cap = mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.12, 16), M_RUBBER);
  cap.position.y = 1.1;
  g.add(cap);
  /* 标签：弧面圆柱贴片（贴合瓶身曲率）+ 试剂名大字 + 浓度小字 + 边框
   * （Cylinder 侧面 u 沿 θ 从观察者左到右递增，贴图天然正向，无需翻转） */
  const lblTex = makeLabelTexture([o.name, o.sub], { w: 320, h: 200, lineSizes: [58, 30] });
  const lbMat = matStd(0xffffff, { roughness: 0.85, metalness: 0 });
  lbMat.map = lblTex;
  const lb = mesh(new THREE.CylinderGeometry(0.378, 0.396, 0.3, 18, 1, true, -0.52, 1.04), lbMat);
  lb.position.y = 0.42;
  g.add(lb);
  bakeContactShadow(x, z, 1.0 * heightScale + 0.25, 1.0 * heightScale + 0.25, 0.3);
  g.scale.setScalar(heightScale);
  return g;
}
scene.add(makeBottle(-3.3, -1.7, { liquid: 0xd8c890, name: '蔗糖溶液', sub: '0.3 g/mL' }));
scene.add(makeBottle(-2.5, -2.0, { liquid: 0x96591a, surf: 0xa4641e, glow: 0.85, name: '碘液', sub: 'Lugol' }));
scene.add(makeBottle(-1.7, -1.75, { liquid: 0x2b4bb8, surf: 0x3a5cc8, glow: 0.4, name: '亚甲基蓝', sub: '染色剂' }, 0.85));
scene.add(makeBottle(-2.9, -1.0, { liquid: 0xc09838, surf: 0xd0a848, glow: 0.3, name: '香柏油', sub: 'n=1.515' }, 0.7));
scene.add(makeBottle(-1.9, -1.05, { liquid: 0xcfe2ea, surf: 0xe4eff4, glow: 0.1, name: '清水', sub: '蒸馏水' }, 0.75));
/* 载玻片盒：开盖态，薄盒体 + 端部斜切挡板 + 内部 4 片玻片（磨砂端朝外） */
{
  const g = new THREE.Group();
  g.position.set(2.75, 0, -2.25);
  g.rotation.y = -0.25;
  const boxMat = matStd(0x8a4a34, { roughness: 0.55 });
  /* 薄盒底（带内腔暗底） */
  const base = mesh(new THREE.BoxGeometry(1.7, 0.12, 1.02), boxMat);
  base.position.y = 0.06;
  const cavity = mesh(new THREE.BoxGeometry(1.56, 0.02, 0.88), matStd(0x241610, { roughness: 0.9 }));
  cavity.position.y = 0.125;
  g.add(base, cavity);
  /* 端部斜切挡板：梯形轮廓挤出（外沿压低，方便抽插玻片） */
  const endShape = new THREE.Shape();
  endShape.moveTo(-0.44, 0);
  endShape.lineTo(0.44, 0);
  endShape.lineTo(0.44, 0.24);
  endShape.lineTo(-0.44, 0.34);
  endShape.lineTo(-0.44, 0);
  const endGeo = new THREE.ExtrudeGeometry(endShape, { depth: 0.05, bevelEnabled: false });
  for (const s of [-1, 1]) {
    const wall = mesh(endGeo, boxMat);
    wall.rotation.y = Math.PI / 2;          /* 轮廓面朝 ±X，斜肩沿盒宽向 */
    wall.position.set(s * 0.83, 0.12, 0);
    if (s > 0) wall.rotation.y += Math.PI;  /* 两端斜肩镜像：外侧低、内侧高 */
    g.add(wall);
  }
  /* 侧挡板 */
  for (const s of [-1, 1]) {
    const side = mesh(new THREE.BoxGeometry(1.66, 0.3, 0.05), boxMat);
    side.position.set(0, 0.24, s * 0.5);
    g.add(side);
  }
  /* 玻片 ×4：玻璃片身 + 磨砂端（错位叠放） */
  const slideGlass = matCoat(0xe8f2f4, { roughness: 0.04, opacity: 0.55 });
  const frosted = matStd(0xe8e4da, { roughness: 0.9 });
  for (let i = 0; i < 4; i++) {
    const sg = new THREE.Group();
    const body = mesh(new THREE.BoxGeometry(1.05, 0.012, 0.4), slideGlass);
    body.position.x = -0.13;
    const end = mesh(new THREE.BoxGeometry(0.26, 0.013, 0.4), frosted);
    end.position.x = 0.6;
    sg.add(body, end);
    sg.position.set((i % 2) * 0.06 - 0.03, 0.14 + i * 0.016, (i % 3) * 0.03 - 0.03);
    sg.rotation.y = (i % 2) * 0.04;
    g.add(sg);
  }
  /* 盒盖：铰链在后排，翻开立起 */
  const lid = mesh(new THREE.BoxGeometry(1.7, 0.045, 1.02), boxMat);
  lid.position.set(0, 0.42, -0.5);
  lid.rotation.x = -1.35;
  /* 前侧标签 */
  const lbMat = matStd(0xffffff, { roughness: 0.8 });
  lbMat.map = makeLabelTexture(['载玻片'], { w: 180, h: 100 });
  const lb = mesh(new THREE.PlaneGeometry(0.5, 0.28), lbMat);
  lb.position.set(0, 0.09, 0.53);
  lb.rotation.x = -0.5;
  bakeContactShadow(2.75, -2.25, 2.0, 1.3, 0.34);
  g.add(lid, lb);
  scene.add(g);
}
/* 擦镜纸盒：抽纸状态 */
{
  const g = new THREE.Group();
  g.position.set(-4.15, 0, -0.6);
  g.rotation.y = 0.3;
  const box = mesh(new THREE.BoxGeometry(0.95, 0.5, 0.7), matStd(0xe4ddd0, { roughness: 0.7 }));
  box.position.y = 0.25;
  const slot = mesh(new THREE.BoxGeometry(0.6, 0.02, 0.06), matStd(0x9a9284, { roughness: 0.8 }));
  slot.position.set(0, 0.5, 0);
  /* 抽出的纸巾（两片错角） */
  const t1 = mesh(new THREE.PlaneGeometry(0.4, 0.3), matStd(0xf4efe4, { roughness: 0.92, side: THREE.DoubleSide }));
  t1.position.set(0.02, 0.6, 0.04);
  t1.rotation.x = -0.5;
  const t2 = mesh(new THREE.PlaneGeometry(0.34, 0.26), matStd(0xeee8da, { roughness: 0.92, side: THREE.DoubleSide }));
  t2.position.set(-0.06, 0.58, -0.03);
  t2.rotation.set(-0.62, 0.2, 0.08);
  bakeContactShadow(-4.15, -0.6, 1.15, 0.85, 0.3);
  g.add(box, slot, t1, t2);
  scene.add(g);
}
/* 培养皿 ×2（叠放：玻璃皿壁 + 微透明皿盖 + 淡黄琼脂面） */
function makePetriDish(withAgar) {
  const g = new THREE.Group();
  const glass = matCoat(0xe2ecee, { roughness: 0.05, opacity: 0.4 });
  const lidGlass = matCoat(0xe2ecee, { roughness: 0.05, opacity: 0.22 });   /* 皿盖更通透 */
  const bottom = mesh(new THREE.CylinderGeometry(0.56, 0.56, 0.025, 36), glass);
  bottom.position.y = 0.05;
  const wall = mesh(new THREE.CylinderGeometry(0.56, 0.56, 0.09, 36, 1, true), glass);
  wall.position.y = 0.095;
  const rim = mesh(new THREE.TorusGeometry(0.56, 0.012, 8, 40), glass);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.14;
  g.add(bottom, wall, rim);
  if (withAgar) {
    /* 琼脂面：淡黄圆片 + 稀疏菌落斑点纹理 */
    const agarTex = canvasTex(256, 256, (ctx) => {
      ctx.fillStyle = '#e8ddc0';
      ctx.fillRect(0, 0, 256, 256);
      const rnd = mulberry32(43);
      for (let i = 0; i < 14; i++) {
        const a = rnd() * TAU, r = rnd() * 95;
        ctx.fillStyle = `rgba(196,168,120,${0.18 + rnd() * 0.22})`;
        ctx.beginPath();
        ctx.arc(128 + Math.cos(a) * r, 128 + Math.sin(a) * r, 1.5 + rnd() * 4.5, 0, TAU);
        ctx.fill();
      }
      for (let i = 0; i < 40; i++) {
        ctx.fillStyle = 'rgba(255,250,232,0.12)';
        ctx.fillRect(rnd() * 256, rnd() * 256, 3, 3);
      }
    });
    const agarMat = matStd(0xffffff, { roughness: 0.55 });
    agarMat.map = agarTex;
    const agar = mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.014, 30), agarMat);
    agar.position.y = 0.072;
    g.add(agar);
  }
  /* 皿盖（更浅的一圈，微透明） */
  const lidWall = mesh(new THREE.CylinderGeometry(0.575, 0.575, 0.045, 36, 1, true), lidGlass);
  lidWall.position.y = 0.155;
  const lidTop = mesh(new THREE.CylinderGeometry(0.575, 0.575, 0.02, 36), lidGlass);
  lidTop.position.y = 0.185;
  g.add(lidWall, lidTop);
  return g;
}
{
  const d1 = makePetriDish(true);
  d1.position.set(3.95, 0, 0.5);
  d1.rotation.y = 0.4;
  const d2 = makePetriDish(true);
  d2.position.set(4.05, 0.2, 0.62);
  d2.rotation.y = 0.9;
  bakeContactShadow(4.0, 0.55, 1.7, 1.7, 0.3);
  scene.add(d1, d2);
}
/* 白瓷滴板（六孔 + 一滴染色液） */
{
  const g = new THREE.Group();
  g.position.set(3.6, 0, -1.65);
  g.rotation.y = -0.35;
  const plate = roundedSlab(1.0, 0.6, 0.06, 0.09, matStd(0xf2efe8, { roughness: 0.32, metalness: 0 }), 0.015);
  plate.position.y = -0.015;
  g.add(plate);
  const wellGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.012, 18);
  const wellMat = matStd(0xd8d4c8, { roughness: 0.5 });
  for (let i = 0; i < 6; i++) {
    const well = mesh(wellGeo, wellMat);
    well.position.set(-0.33 + (i % 3) * 0.33, 0.055, i < 3 ? -0.14 : 0.14);
    g.add(well);
  }
  /* 一滴亚甲基蓝 */
  const drop = mesh(new THREE.SphereGeometry(0.032, 12, 8), matStd(0x3a5ac8, { roughness: 0.15, emissive: 0x22378a, emissiveIntensity: 0.3 }));
  drop.scale.y = 0.45;
  drop.position.set(-0.33, 0.068, 0.14);
  bakeContactShadow(3.6, -1.65, 1.2, 0.8, 0.26);
  g.add(drop);
  scene.add(g);
}
/* 显微镜整体接触阴影（桌面统一烘焙） */
bakeContactShadow(0.15, 0.05, 3.7, 2.7, 0.4);
scene.add(buildTableShadow());

/* ================= 3D 显微镜（深度精修建模） ================= */

const gScope = new THREE.Group();
scene.add(gScope);
const parts = {};
{
  /* ---- 镜座：阶梯底座 + 橡胶脚垫 + 镀铬饰线 + 透射光源 ---- */
  const footMat = M_RUBBER;
  for (const [fx, fz] of [[-1.18, -0.92], [1.18, -0.92], [-1.18, 0.92], [1.18, 0.92]]) {
    const pad = mesh(new THREE.CylinderGeometry(0.09, 0.1, 0.07, 14), footMat);
    pad.position.set(fx, 0.035, fz);
    gScope.add(pad);
  }
  const baseSlab = roundedSlab(2.6, 2.05, 0.24, 0.16, M_PAINT, 0.035);
  baseSlab.position.y = 0.038;   /* 顶面 ≈ 0.31 */
  const baseStep = roundedSlab(1.9, 0.5, 0.1, 0.12, M_PAINT_DARK, 0.02);
  baseStep.position.set(0, 0.03, 0.88);   /* 前踏台（承反光镜座） */
  const trim = mesh(new THREE.BoxGeometry(2.62, 0.024, 2.07), M_CHROME);
  trim.position.y = 0.315;
  gScope.add(baseSlab, baseStep, trim);
  /* 镜座铭牌 */
  const plate = decalPlane(canvasTex(360, 120, (ctx) => {
    ctx.clearRect(0, 0, 360, 120);
    ctx.fillStyle = 'rgba(60,58,54,0.85)';
    ctx.font = `600 34px 'Avenir Next', sans-serif`;
    ctx.textBaseline = 'middle';
    ctx.fillText('EDULAB OPTICS', 14, 38);
    ctx.fillStyle = 'rgba(120,116,108,0.9)';
    ctx.font = `400 22px 'Avenir Next', sans-serif`;
    ctx.fillText('M-16 · 10× EYEPIECE', 14, 82);
  }), 0.62, 0.2);
  plate.rotation.x = -Math.PI / 2;   /* 平贴座面，文字朝前读 */
  plate.position.set(-0.88, 0.323, 0.68);
  gScope.add(plate);
  /* 透射光源（底座前孔）：暖色发光面 */
  const lampHousing = mesh(new THREE.CylinderGeometry(0.28, 0.34, 0.18, 22), M_STEEL_DARK);
  lampHousing.position.set(0, 0.28, 0.52);
  const lampRing = mesh(new THREE.TorusGeometry(0.24, 0.02, 8, 22), M_BRASS);
  lampRing.rotation.x = TAU / 4;
  lampRing.position.set(0, 0.375, 0.52);
  const lamp = mesh(new THREE.CircleGeometry(0.22, 22), new THREE.MeshBasicMaterial({ color: 0xffe9b0 }));
  lamp.rotation.x = -TAU / 4;
  lamp.position.set(0, 0.38, 0.52);
  gScope.add(lampHousing, lampRing, lamp);
  parts.lamp = lamp;
  /* 亮度拨盘（装饰） */
  const dimKnob = mesh(new THREE.CylinderGeometry(0.07, 0.075, 0.05, 18), matKnurl(0x1d2126, 0.3, 40));
  dimKnob.rotation.x = TAU / 4;
  dimKnob.position.set(0.85, 0.33, 0.62);
  gScope.add(dimKnob);

  /* ---- 镜臂：CatmullRom 中心线放样 C 形弯臂（变宽度截面 sweep + 三段质感） ---- */
  /* 中心线：底座后部生根 → 向上后弯 → 背点 → 回弯前倾 → 顶端抱向镜筒（微 X 内收增强立体感） */
  const armCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.58, 0.16, -0.54),
    new THREE.Vector3(-0.72, 0.72, -0.66),
    new THREE.Vector3(-0.78, 1.44, -0.72),
    new THREE.Vector3(-0.73, 2.04, -0.58),
    new THREE.Vector3(-0.62, 2.40, -0.28),
    new THREE.Vector3(-0.50, 2.58, 0.14),
  ], false, 'catmullrom', 0.6);
  /* 截面宽度/深度沿弧长参数的关键帧（根部金属套座 → 握持段收窄 → 上端再展宽接托架） */
  const armWKeys = [[0, 0.38], [0.06, 0.36], [0.10, 0.30], [0.32, 0.235], [0.46, 0.225], [0.62, 0.25], [0.82, 0.29], [1, 0.33]];
  const armDKeys = [[0, 0.32], [0.06, 0.30], [0.10, 0.26], [0.32, 0.21], [0.46, 0.20], [0.62, 0.22], [0.82, 0.245], [1, 0.27]];
  const keyLerp = (keys, t) => {
    for (let i = 0; i < keys.length - 1; i++) {
      if (t <= keys[i + 1][0]) {
        const [t0, v0] = keys[i], [t1, v1] = keys[i + 1];
        const k = (t - t0) / Math.max(t1 - t0, 1e-6);
        const s = k * k * (3 - 2 * k);           /* smoothstep 缓动，避免折角 */
        return v0 + (v1 - v0) * s;
      }
    }
    return keys[keys.length - 1][1];
  };
  /* 圆角矩形截面轮廓（单位宽深，角部圆弧采样点，闭环） */
  const armRing = (() => {
    const rc = 0.30, seg = 5, pts = [];
    const cs = [[0.5 - rc, 0.5 - rc, 0], [0.5 - rc, -0.5 + rc, Math.PI / 2], [-0.5 + rc, -0.5 + rc, Math.PI], [-0.5 + rc, 0.5 - rc, Math.PI * 1.5]];
    for (const [cx, cy, a0] of cs) {
      for (let k = 0; k <= seg; k++) {
        const a = a0 + (k / seg) * (Math.PI / 2);
        pts.push([cx + Math.cos(a) * rc, cy + Math.sin(a) * rc]);
      }
    }
    return pts;
  })();
  /* 自研 sweep：沿曲线取 frame（宽度轴固定 X，深度轴取切线叉乘），逐环缩放截面并缝合；
   * 单一 geometry + 三段材质分组：根部连接件(金属深灰) / 中段烤漆 / 上端托架(缎面金属) */
  function buildArmGeometry(curve, segs) {
    const pts = curve.getSpacedPoints(segs);
    const ringM = armRing.length;
    const pos = [], idx = [];
    const breaks = [Math.round(segs * 0.045), Math.round(segs * 0.82)];
    const vAt = (i3) => new THREE.Vector3(pos[i3], pos[i3 + 1], pos[i3 + 2]);
    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      const p = pts[i];
      const pPrev = pts[Math.max(0, i - 1)], pNext = pts[Math.min(segs, i + 1)];
      const T = new THREE.Vector3().subVectors(pNext, pPrev).normalize();
      const Nn = new THREE.Vector3().crossVectors(T, new THREE.Vector3(1, 0, 0)).normalize();
      const w = keyLerp(armWKeys, t), d = keyLerp(armDKeys, t);
      for (let k = 0; k < ringM; k++) {
        const [ux, vy] = armRing[k];
        pos.push(p.x + ux * w, p.y + vy * d * Nn.y, p.z + vy * d * Nn.z);
      }
    }
    for (let i = 0; i < segs; i++) {
      for (let k = 0; k < ringM; k++) {
        const k1 = (k + 1) % ringM;
        const a = i * ringM + k, b = (i + 1) * ringM + k, c = (i + 1) * ringM + k1, dd = i * ringM + k1;
        idx.push(a, b, c, a, c, dd);
      }
      /* 端帽：扇面封口，按法线朝向自动翻转绕序 */
      if (i === 0 || i === segs - 1) {
        const centerBase = pos.length / 3;
        const p = pts[i === 0 ? 0 : segs];
        pos.push(p.x, p.y, p.z);
        const T = new THREE.Vector3().subVectors(pts[Math.min(segs, i + 1)], pts[Math.max(0, i - 1)]).normalize();
        const ringBase = i * ringM;
        for (let k = 0; k < ringM; k++) {
          const k1 = (k + 1) % ringM;
          const tri = [centerBase, ringBase + k, ringBase + k1];
          const n = new THREE.Vector3().subVectors(vAt(tri[1] * 3), vAt(tri[0] * 3))
            .cross(new THREE.Vector3().subVectors(vAt(tri[2] * 3), vAt(tri[0] * 3)));
          idx.push(...(n.dot(T) < 0 ? tri : [tri[0], tri[2], tri[1]]));
        }
      }
    }
    /* 三段分组（三角索引切分）：[0, br0) 金属 / [br0, br1) 烤漆 / [br1, end) 托架
     * 索引累计：段 0 含端帽 9·ringM，其后每段 6·ringM → 段 k 结束于 ringM·(6k+3) */
    const br0 = ringM * (6 * breaks[0] + 3);
    const br1 = ringM * (6 * breaks[1] + 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setIndex(idx);
    geo.clearGroups();
    geo.addGroup(0, br0, 0);
    geo.addGroup(br0, br1 - br0, 1);
    geo.addGroup(br1, idx.length - br1, 2);
    geo.computeVertexNormals();
    return geo;
  }
  /* 根部金属段压入基座内（不外露），外露臂身整体烤漆；基座衔接用亮色金属圈套座表达 */
  const armMesh = new THREE.Mesh(
    buildArmGeometry(armCurve, 64),
    [M_STEEL_DARK, M_PAINT, M_SATIN],
  );
  gScope.add(armMesh);
  {
    const fp = armCurve.getPoint(0.05);
    const ferrule = mesh(new THREE.CylinderGeometry(0.24, 0.27, 0.08, 22), M_SATIN);
    ferrule.position.set(fp.x, 0.30, fp.z);
    gScope.add(ferrule);
  }
  gScope.add(armMesh);
  /* 握持段内凹弧（人机工学暗示）：外侧面橡胶握垫，随曲线最窄处内嵌 */
  {
    const gp = armCurve.getPoint(0.42);
    const pad = roundedSlab(0.32, 0.16, 0.045, 0.05, M_RUBBER, 0.012);
    pad.rotation.z = -Math.PI / 2;               /* 厚度沿 X，长度顺臂身 */
    pad.position.set(gp.x - keyLerp(armWKeys, 0.42) / 2 - 0.012, gp.y, gp.z);
    gScope.add(pad);
  }
  /* 上端托架：横担 + 枢轴轴座 + 锁紧螺钉（镜臂与镜头的机械衔接件） */
  const yoke = mesh(new THREE.BoxGeometry(0.95, 0.16, 0.26), M_SATIN);
  yoke.position.set(-0.13, 2.56, 0.22);
  const pivotHub = mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.44, 22), M_CHROME);
  pivotHub.rotation.z = TAU / 4;
  pivotHub.position.set(0.25, 2.5, 0.33);
  const clampScrew = mesh(new THREE.CylinderGeometry(0.03, 0.034, 0.06, 12), M_CHROME);
  clampScrew.position.set(-0.1, 2.68, 0.22);
  gScope.add(yoke, pivotHub, clampScrew);
  /* 品牌铭牌：横担前面板（默认机位直读，避开曲面臂身） */
  {
    const dF = decalPlane(brandDecalTexture(), 0.6, 0.19);
    dF.position.set(-0.16, 2.56, 0.355);
    gScope.add(dF);
  }

  /* ---- 双面反光镜（平面/凹面 + 镜柄，可翻转） ---- */
  const mirrorAsm = new THREE.Group();
  mirrorAsm.position.set(0.35, 0.5, 0.86);
  const mirrorFork = mesh(new THREE.BoxGeometry(0.05, 0.3, 0.26), M_STEEL_DARK);
  mirrorFork.position.set(0, -0.14, -0.02);
  const hub = mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.16, 12), M_BRASS);
  hub.rotation.x = TAU / 4;
  const mirrorDisc = mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.016, 26), matStd(0xf6f8fb, { roughness: 0.08, metalness: 1, envMapIntensity: 0.85 }));
  mirrorDisc.rotation.x = TAU / 4;                 /* 盘面法向 = 局部 Z */
  const concave = mesh(new THREE.SphereGeometry(0.38, 26, 12, 0, TAU, 0, 0.47), matStd(0xeef1f5, { roughness: 0.12, metalness: 1, side: THREE.BackSide, envMapIntensity: 0.8 }));
  concave.rotation.x = -Math.PI / 2;
  concave.position.z = -0.012;                     /* 凹面在盘背面 */
  const mirrorHandle = mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.16, 10), M_BRASS);
  mirrorHandle.position.set(0, -0.1, 0.12);
  mirrorHandle.rotation.x = 0.9;
  mirrorAsm.add(mirrorFork, hub, mirrorDisc, concave, mirrorHandle);
  mirrorAsm.rotation.x = -0.72;
  gScope.add(mirrorAsm);
  parts.mirrorAsm = mirrorAsm;

  /* ---- 载物台总成（调焦时整体微升降） ---- */
  const stageAsm = new THREE.Group();
  parts.stageAsm = stageAsm;
  parts.stageBaseY = 0;
  /* 台面：圆角平板 + 中央通光孔（Shape.holes 挖孔挤出） */
  const stageShape = roundedRectShape(2.05, 1.85, 0.12);
  const aperturePath = new THREE.Path();
  aperturePath.absarc(0, 0, 0.15, 0, TAU, true);
  stageShape.holes.push(aperturePath);
  const stageGeo = new THREE.ExtrudeGeometry(stageShape, {
    depth: 0.085, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012,
    bevelSegments: 2, curveSegments: 16,
  });
  stageGeo.rotateX(-Math.PI / 2);
  const table = mesh(stageGeo, M_STAGE_DARK);
  table.position.set(0.25, 1.19, 0);   /* 顶面 ≈ 1.285 */
  stageAsm.add(table);
  /* 通光孔内的暗腔 */
  const aperture = mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.1, 20), new THREE.MeshBasicMaterial({ color: 0x0c0e12 }));
  aperture.position.set(0.25, 1.24, 0);
  stageAsm.add(aperture);
  /* 台面导尺（刻线装饰） */
  const ruler = mesh(new THREE.BoxGeometry(1.5, 0.006, 0.03), M_CHROME);
  ruler.position.set(0.25, 1.292, -0.72);
  stageAsm.add(ruler);
  /* 黄铜压片夹 ×2：弹片 + 卷曲端 + 螺栓头 */
  for (const sx of [-1, 1]) {
    const clip = new THREE.Group();
    const bar = mesh(new THREE.BoxGeometry(0.3, 0.022, 0.07), M_BRASS);
    bar.position.set(sx * 0.48, 1.312, 0);
    bar.rotation.z = sx * 0.04;
    const curl = mesh(new THREE.TorusGeometry(0.045, 0.013, 8, 14, Math.PI), M_BRASS);
    curl.rotation.y = Math.PI / 2;
    curl.position.set(sx * 0.66, 1.302, 0);
    const bolt = mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.024, 12), M_STEEL_DARK);
    bolt.position.set(sx * 0.63, 1.30, 0);
    const boltSlot = mesh(new THREE.BoxGeometry(0.036, 0.006, 0.008), matStd(0x14161a, { roughness: 0.6 }));
    boltSlot.position.set(sx * 0.63, 1.313, 0);
    clip.add(bar, curl, bolt, boltSlot);
    stageAsm.add(clip);
  }
  /* 玻片：透射玻璃 */
  const slide = mesh(new THREE.BoxGeometry(1.1, 0.03, 0.62), matCoat(0xe8f2f4, { roughness: 0.03, opacity: 0.5 }));
  slide.position.set(0.25, 1.3, 0);
  stageAsm.add(slide);
  parts.slide = slide;
  /* 聚光器：阶梯圆柱 ×3 + 光圈拨杆 */
  const condMat = M_STEEL_DARK;
  const cond1 = mesh(new THREE.CylinderGeometry(0.21, 0.23, 0.1, 20), condMat);
  cond1.position.set(0.25, 1.11, 0);
  const cond2 = mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.09, 20), condMat);
  cond2.position.set(0.25, 1.02, 0);
  const cond3 = mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.08, 18), condMat);
  cond3.position.set(0.25, 0.94, 0);
  const condLens = mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.02, 16), M_GLASS);
  condLens.position.set(0.25, 0.895, 0);
  stageAsm.add(cond1, cond2, cond3, condLens);
  /* 遮光器（孔径光阑）：镀铬环 + 黄铜拨杆 */
  const iris = mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.045, 24), M_CHROME);
  iris.position.set(0.25, 0.87, 0);
  const irisLever = new THREE.Group();
  const leverArm = mesh(new THREE.BoxGeometry(0.22, 0.014, 0.03), M_BRASS);
  leverArm.position.set(-0.11, 0, 0);
  const leverTip = mesh(new THREE.SphereGeometry(0.024, 10, 8), M_BRASS);
  leverTip.position.set(-0.23, 0, 0);
  irisLever.add(leverArm, leverTip);
  irisLever.position.set(0.25, 0.87, 0);
  irisLever.rotation.y = -0.6;
  stageAsm.add(cond1, cond2, cond3, condLens, iris, irisLever);
  parts.iris = iris;
  gScope.add(stageAsm);

  /* ---- 弯头镜筒总成（整体前倾 0.35，局部 Y 沿筒轴） ---- */
  const head = new THREE.Group();
  head.position.set(0.25, 2.5, 0.4);
  head.rotation.x = 0.35;
  gScope.add(head);
  parts.head = head;
  const tubeLow = mesh(new THREE.CylinderGeometry(0.175, 0.19, 0.36, 26), M_PAINT);
  tubeLow.position.y = -0.42;
  const tubeMidRing = mesh(new THREE.CylinderGeometry(0.185, 0.185, 0.055, 26), M_CHROME);
  tubeMidRing.position.y = -0.25;
  const tubeUp = mesh(new THREE.CylinderGeometry(0.15, 0.155, 0.62, 24), M_PAINT);
  tubeUp.position.y = 0.12;
  const tubeTopRing = mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.045, 24), M_CHROME);
  tubeTopRing.position.y = 0.42;
  const tubeBand = mesh(new THREE.CylinderGeometry(0.152, 0.152, 0.05, 24), M_PAINT_DARK);
  tubeBand.position.y = -0.08;
  const deco1 = mesh(new THREE.TorusGeometry(0.156, 0.011, 8, 26), M_CHROME);
  deco1.rotation.x = TAU / 4;
  deco1.position.y = 0.02;
  const deco2 = mesh(new THREE.TorusGeometry(0.156, 0.011, 8, 26), M_CHROME);
  deco2.rotation.x = TAU / 4;
  deco2.position.y = 0.3;
  head.add(tubeLow, tubeMidRing, tubeUp, tubeTopRing, tubeBand, deco1, deco2);
  /* 目镜：软胶眼罩 + 镀铬压圈 + 镜片 */
  const eyecup = mesh(new THREE.CylinderGeometry(0.125, 0.105, 0.17, 22), M_RUBBER);
  eyecup.position.y = 0.62;
  const eyeRim = mesh(new THREE.TorusGeometry(0.115, 0.014, 8, 22), M_CHROME);
  eyeRim.rotation.x = TAU / 4;
  eyeRim.position.y = 0.705;
  const eyeLens = mesh(new THREE.CylinderGeometry(0.095, 0.095, 0.018, 20), M_LENS);
  eyeLens.position.y = 0.7;
  head.add(eyecup, eyeRim, eyeLens);
  parts.eyeLens = eyeLens;

  /* ---- 转换器：倾斜盘 + 滚花握环 + 物镜 ×4（各自独立造型） ---- */
  const noseTilt = new THREE.Group();
  noseTilt.position.y = -0.62;
  /* 教学机型：物镜全平行布置，盘的倾斜由父级 head 提供 */
  head.add(noseTilt);
  const noseDisc = mesh(new THREE.CylinderGeometry(0.295, 0.295, 0.1, 26), M_PAINT);
  const noseEdge = mesh(new THREE.TorusGeometry(0.295, 0.012, 8, 26), M_CHROME);
  noseEdge.rotation.x = TAU / 4;
  noseEdge.position.y = -0.052;
  const noseGrip = mesh(new THREE.CylinderGeometry(0.315, 0.315, 0.07, 30, 1, true), matKnurl(0xd6d9de, 0.5, 72));
  noseGrip.position.y = 0.02;
  noseTilt.add(noseDisc, noseEdge, noseGrip);
  const noseSpin = new THREE.Group();
  noseTilt.add(noseSpin);
  parts.noseSpin = noseSpin;
  parts.objectives = [];
  const OBJ_SPEC = [
    { mag: 4, na: 0.10, len: 0.40, tip: 0.052, color: 0xc85a4e },
    { mag: 10, na: 0.25, len: 0.48, tip: 0.047, color: 0xc4b24e },
    { mag: 40, na: 0.65, len: 0.55, tip: 0.038, color: 0x4e9ac4 },
    { mag: 100, na: 1.25, len: 0.62, tip: 0.034, color: 0x39404a, oil: true },
  ];
  OBJ_SPEC.forEach((s, i) => {
    const holder = new THREE.Group();
    const a = (i / 4) * TAU;
    holder.position.set(Math.sin(a) * 0.205, -0.055, Math.cos(a) * 0.205);
    holder.rotation.y = a;   /* 套筒铭牌朝外 */
    /* 车削镜身（阶梯收细锥尖）：黄铜镀铬层 */
    const bodyProf = [
      [0.056, 0.008], [0.058, 0.004], [0.058, -0.02], [0.05, -0.032],
      [s.tip * 1.5, -0.05], [s.tip * 1.5, -s.len * 0.42],
      [s.tip * 1.24, -s.len * 0.72], [s.tip * 1.04, -s.len * 0.92],
      [s.tip, -s.len], [0.001, -s.len],
    ].map(([r, y]) => new THREE.Vector2(r, y));
    const body = mesh(new THREE.LatheGeometry(bodyProf, 26), M_CHROME);
    holder.add(body);
    /* 铭牌套筒（倍率/孔径印刷） */
    const sleeveMat = matCoat(0xffffff, { roughness: 0.32, metalness: 0.05, clearcoat: 0.6 });
    sleeveMat.map = objectiveSleeveTexture(s);
    const sleeve = mesh(new THREE.CylinderGeometry(s.tip * 1.5 + 0.004, s.tip * 1.5 + 0.004, s.len * 0.4, 24, 1, true), sleeveMat);
    sleeve.position.y = -s.len * 0.42;
    holder.add(sleeve);
    /* 倍率色环（+ 油镜黑环） */
    const ringMat = matCoat(s.color, { roughness: 0.3, metalness: 0.05, clearcoat: 1 });
    const colorRing = mesh(new THREE.CylinderGeometry(s.tip * 1.5 + 0.007, s.tip * 1.5 + 0.007, 0.026, 24, 1, true), ringMat);
    colorRing.position.y = -s.len * 0.2;
    holder.add(colorRing);
    if (s.oil) {
      const oilRing = mesh(new THREE.CylinderGeometry(s.tip * 1.5 + 0.007, s.tip * 1.5 + 0.007, 0.014, 24, 1, true), matCoat(0x151515, { roughness: 0.4 }));
      oilRing.position.y = -s.len * 0.2 - 0.028;
      holder.add(oilRing);
    }
    /* 顶部滚花环 */
    const knurl = mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.034, 26, 1, true), matKnurl(0xc8ccd2, 0.7, 56));
    knurl.position.y = -0.024;
    holder.add(knurl);
    /* 前透镜（半球冠） */
    const tipGlass = mesh(new THREE.SphereGeometry(s.tip * 0.52, 14, 8, 0, TAU, 0, Math.PI / 2), M_LENS);
    tipGlass.rotation.x = Math.PI;
    tipGlass.position.y = -s.len + 0.004;
    holder.add(tipGlass);
    noseSpin.add(holder);
    parts.objectives.push(holder);
  });

  /* ---- 同轴粗/细准焦旋钮（滚花 + 镀铬端盖 + 指示点，绕臂侧 X 轴） ---- */
  const axle = mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.5, 14), M_CHROME);
  axle.rotation.z = TAU / 4;
  axle.position.set(-1.02, 1.75, 0.1);
  gScope.add(axle);
  const knobCoarse = new THREE.Group();
  knobCoarse.position.set(-1.26, 1.75, 0.1);
  const kcGrip = mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.15, 30, 1, true), matKnurl(0x1d2126, 0.25, 84));
  kcGrip.rotation.z = TAU / 4;
  const kcRimF = mesh(new THREE.TorusGeometry(0.2, 0.012, 8, 30), M_CHROME);
  kcRimF.rotation.y = TAU / 4;
  kcRimF.position.x = -0.078;
  const kcCap = mesh(new THREE.CylinderGeometry(0.13, 0.145, 0.022, 26), M_CHROME);
  kcCap.rotation.z = TAU / 4;
  kcCap.position.x = -0.086;
  const kcDot = mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.006, 10), matStd(0xe8e4d8, { roughness: 0.5 }));
  kcDot.rotation.z = TAU / 4;
  kcDot.position.set(-0.099, 0.172, 0);
  knobCoarse.add(kcGrip, kcRimF, kcCap, kcDot);
  const knobFine = new THREE.Group();
  knobFine.position.set(-1.04, 1.75, 0.1);
  const kfGrip = mesh(new THREE.CylinderGeometry(0.115, 0.115, 0.11, 24, 1, true), matKnurl(0x3a3d42, 0.6, 60));
  kfGrip.rotation.z = TAU / 4;
  const kfCap = mesh(new THREE.CylinderGeometry(0.065, 0.08, 0.02, 20), M_CHROME);
  kfCap.rotation.z = TAU / 4;
  kfCap.position.x = -0.062;
  const kfDot = mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.006, 8), matStd(0xe8e4d8, { roughness: 0.5 }));
  kfDot.rotation.z = TAU / 4;
  kfDot.position.set(-0.073, 0.1, 0);
  knobFine.add(kfGrip, kfCap, kfDot);
  gScope.add(knobCoarse, knobFine);
  parts.knobCoarse = knobCoarse;
  parts.knobFine = knobFine;

  /* ---- 部件标注（认识显微镜章节） ---- */
  const partLabels = [
    ['目镜', [0.25, 3.35, 0.62]], ['镜筒', [0.25, 2.75, 0.72]], ['转换器', [0.25, 1.85, 0.78]],
    ['物镜', [0.85, 1.62, 0.5]], ['载物台', [1.4, 1.5, 0.3]], ['压片夹', [-0.55, 1.48, 0]],
    ['遮光器', [0.85, 0.9, 0.3]], ['反光镜', [0.95, 0.55, 0.85]], ['粗准焦螺旋', [-1.62, 1.98, 0.1]],
    ['细准焦螺旋', [-1.42, 1.42, 0.1]], ['镜臂', [-1.15, 2.3, -0.7]], ['镜座', [0, 0.14, -1.3]],
  ];
  parts.labels = partLabels.map(([t, p]) => {
    const l = label(t, '#e2ebf5', 0.0032);
    l.position.set(...p);
    l.visible = false;
    gScope.add(l);
    return l;
  });
}

/* ================= 目镜视野画布（离屏样品 + 合成管线，常驻右栏） ================= */

const EYE_MAG = 10;
const OBJ_MAGS = [4, 10, 40, 100];
const S = 512;
const eyeWrap = document.getElementById('eyeWrap');
const eCv = document.createElement('canvas');
eCv.width = eCv.height = S;
eCv.setAttribute('aria-label', '目镜视野');
eyeWrap.appendChild(eCv);
const eCtx = eCv.getContext('2d');
/* 样品离屏画布：先按照明模式画样品，再统一合成到 eCv（暗场反相 / 相差光晕） */
const sCv = document.createElement('canvas');
sCv.width = sCv.height = S;
const sCtx = sCv.getContext('2d');

/* ---- 视野真实感基建：种子随机 / 纤维贴样 / 字形墨迹画布 / 视野静物装饰 ---- */

/* 可播种伪随机（mulberry32）：装饰与纹理逐帧一致，截图可复现 */
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* 载膜纤维纹理：白底 + 随机弯折短纤维（灰阶），平铺后叠给样品/字形 */
const fiberTex = (() => {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const x = c.getContext('2d');
  x.fillStyle = '#ffffff';
  x.fillRect(0, 0, 256, 256);
  const rnd = mulberry32(71);
  x.lineCap = 'round';
  for (let i = 0; i < 130; i++) {
    let px = rnd() * 256, py = rnd() * 256;
    const a = rnd() * TAU, len = 14 + rnd() * 46, bend = (rnd() - 0.5) * 0.6;
    const g = Math.round(232 - rnd() * 44);
    x.strokeStyle = `rgb(${g},${g - 4},${g - 9})`;
    x.lineWidth = 0.8 + rnd() * 1.6;
    x.beginPath();
    x.moveTo(px, py);
    const steps = 4 + ((rnd() * 4) | 0);
    for (let s2 = 1; s2 <= steps; s2++) {
      const f = s2 / steps;
      px += Math.cos(a + bend * f) * (len / steps);
      py += Math.sin(a + bend * f) * (len / steps);
      x.lineTo(px, py);
    }
    x.stroke();
  }
  return c;
})();
const sFiberPat = sCtx.createPattern(fiberTex, 'repeat');

/* 字形墨迹画布（缓存）：柔焦晕染底层 + 多次微位移叠印（边缘参差）+
 * 纤维纹理（source-atop 只染字形像素）+ 针孔侵蚀（destination-out 微点） */
const glyphCache = new Map();
function glyphCanvas(ch, font, size) {
  const key = ch + '|' + font + size;
  if (glyphCache.has(key)) return glyphCache.get(key);
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const x = c.getContext('2d');
  const rnd = mulberry32(ch.charCodeAt(0) * 131 + 7);
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  x.font = `900 ${size}px ${font}`;
  /* 墨水浸润：两级柔焦晕染垫底 */
  x.filter = 'blur(5px)';
  x.fillStyle = 'rgba(38, 44, 56, 0.30)';
  x.fillText(ch, S / 2, S / 2);
  x.filter = 'blur(2px)';
  x.fillStyle = 'rgba(38, 44, 56, 0.35)';
  x.fillText(ch, S / 2, S / 2);
  x.filter = 'none';
  /* 主体：多次微位移叠印出参差墨缘 */
  for (let k = 0; k < 6; k++) {
    x.fillStyle = `rgba(38, 44, 56, ${(0.16 + rnd() * 0.06).toFixed(3)})`;
    x.fillText(ch, S / 2 + (rnd() - 0.5) * 3.2, S / 2 + (rnd() - 0.5) * 3.2);
  }
  x.fillStyle = 'rgba(30, 35, 45, 0.9)';
  x.fillText(ch, S / 2, S / 2);
  /* 纤维纹理：只染字形像素 */
  x.globalCompositeOperation = 'source-atop';
  x.globalAlpha = 0.4;
  x.fillStyle = x.createPattern(fiberTex, 'repeat');
  x.fillRect(0, 0, S, S);
  /* 针孔侵蚀：墨膜深浅斑驳 */
  x.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 900; i++) {
    x.globalAlpha = 0.05 + rnd() * 0.12;
    x.beginPath();
    x.arc(rnd() * S, rnd() * S, 0.6 + rnd() * 1.8, 0, TAU);
    x.fill();
  }
  x.globalCompositeOperation = 'source-over';
  x.globalAlpha = 1;
  glyphCache.set(key, c);
  return c;
}

/* 视野静物装饰：微尘颗粒 + 气泡环（固定种子；读数类玻片跳过，防干扰计数/污点判断） */
const FIELD_DECOR = (() => {
  const rnd = mulberry32(2026);
  const dust = [];
  for (let i = 0; i < 5; i++) {
    const a = rnd() * TAU, r = S * (0.18 + rnd() * 0.24);
    dust.push([S / 2 + Math.cos(a) * r, S / 2 + Math.sin(a) * r, 1 + rnd() * 2.2, 0.10 + rnd() * 0.14]);
  }
  return { dust, bubbles: [[S * 0.68, S * 0.30, 9], [S * 0.26, S * 0.74, 6]] };
})();
function drawFieldDecor(ctx) {
  if (optic.slide === 'counter' || optic.slide === 'dust') return;
  for (const [x, y, r, a] of FIELD_DECOR.dust) {
    ctx.fillStyle = `rgba(84, 74, 58, ${a})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
  }
  for (const [x, y, r] of FIELD_DECOR.bubbles) {
    ctx.strokeStyle = 'rgba(96, 88, 70, 0.34)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255, 252, 240, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.55, 0, TAU);
    ctx.stroke();
  }
}

/* 显微镜状态 */
const optic = {
  slide: 'letter', obj: 1, focus: 62, light: 'bright', oil: false,
  pan: { x: 0, y: 0 }, labels: false, running: true,
  paraAngle: 0, plasm: 0, plasmT: 0, phaseHi: -1, countSq: -1,
  speck: null, speckMoves: { pan: false, rotate: false, obj: false },
  lampOn: true, stageH: 0, mirrorFlip: false, letterRot: 0, paraSpeed: 1,
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
      /* 墨迹字形画布：浸润边缘 + 纤维纹理 + 针孔侵蚀（glyphCanvas 缓存，逐帧仅 drawImage） */
      ctx.drawImage(glyphCanvas('e', 'Georgia, serif', 210), -S / 2 + o.pan.x * 1.2, -S / 2 + o.pan.y * 1.2);
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
      ctx.drawImage(glyphCanvas('p', 'Georgia, serif', 150), 0, 0);
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

/* 每帧渲染目镜视野：样品离屏（含真实感装饰）→ 合成（明/暗/相差 + 光锥渐晕 + 半焦双影） → 遮罩装饰 */
function renderEyepiece(t) {
  const mode = optic.lampOn ? optic.light : 'off';
  const isDark = mode === 'dark';
  const isPhase = mode === 'phase';
  /* 离屏样品底色：暖白照明（明场）/ 暗场浅底（反相后变黑）/ 相差灰绿底 */
  sCtx.setTransform(1, 0, 0, 1, 0, 0);
  sCtx.fillStyle = isDark ? '#f2ede0' : isPhase ? '#d4d8cc' : '#fdf6e6';
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
  drawFieldDecor(sCtx);              /* 微尘 + 气泡随玻片移动 */
  sCtx.restore();
  /* 载膜纤维：整幅低对比平铺（有机质感底层） */
  sCtx.globalCompositeOperation = 'multiply';
  sCtx.globalAlpha = 0.06;
  sCtx.fillStyle = sFiberPat;
  sCtx.fillRect(0, 0, S, S);
  sCtx.globalAlpha = 1;
  sCtx.globalCompositeOperation = 'source-over';

  /* 主画布：背景 + 圆形视野裁剪 */
  eCtx.setTransform(1, 0, 0, 1, 0, 0);
  eCtx.fillStyle = isDark ? '#050608' : isPhase ? '#c9cec2' : mode === 'off' ? '#101216' : '#fdf6e6';
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
  /* 半对焦双影：主像 + 低位移低透明重像（钟形窗口，全焦/重糊时消退） */
  const dFocus = optic.focus - idealFocus();
  const ghostA = Math.exp(-Math.pow((Math.abs(dFocus) - 3.2) / 2.6, 2)) * 0.26;
  if (ghostA > 0.02 && blur < 4.5) {
    const off = 1 + Math.min(Math.abs(dFocus), 8) * 0.18;
    eCtx.globalAlpha = ghostA;
    eCtx.drawImage(sCv, dFocus > 0 ? off : -off, dFocus > 0 ? off * 0.6 : -off * 0.6);
    eCtx.globalAlpha = 1;
  }

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
  /* 聚光器光锥：中心暖白提升 + 边缘暗角过渡（明场暖调 / 相差中性 / 暗场只留轻暗角） */
  if (optic.lampOn) {
    if (!isDark) {
      const hg = eCtx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S * 0.30);
      hg.addColorStop(0, isPhase ? 'rgba(255, 250, 238, 0.06)' : 'rgba(255, 246, 220, 0.10)');
      hg.addColorStop(1, 'rgba(255, 246, 220, 0)');
      eCtx.fillStyle = hg;
      eCtx.fillRect(0, 0, S, S);
    }
    const vg = eCtx.createRadialGradient(S / 2, S / 2, S * 0.06, S / 2, S / 2, S * 0.47);
    vg.addColorStop(0, 'rgba(150, 132, 105, 0)');
    vg.addColorStop(0.55, `rgba(150, 132, 105, ${isDark ? 0.06 : 0.10})`);
    vg.addColorStop(1, `rgba(150, 132, 105, ${isDark ? 0.30 : 0.62})`);
    eCtx.globalCompositeOperation = 'multiply';
    eCtx.fillStyle = vg;
    eCtx.fillRect(0, 0, S, S);
    eCtx.globalCompositeOperation = 'source-over';
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
}

/* ---------------- 目镜视野交互（滚轮准焦 / 拖动移片 / 放大与 ESC） ---------------- */

function nudgeFocus(delta) {
  optic.focus = clamp(optic.focus + delta, 0, 100);
}
eyeWrap.addEventListener('wheel', (e) => {
  e.preventDefault();
  const step = e.shiftKey ? 4 : 1.2;
  nudgeFocus(e.deltaY > 0 ? step : -step);
}, { passive: false });

{
  let dragging = null;
  eyeWrap.addEventListener('pointerdown', (e) => {
    dragging = { x: e.clientX, y: e.clientY };
    eyeWrap.setPointerCapture(e.pointerId);
  });
  eyeWrap.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const k = 0.55 * (10 / OBJ_MAGS[optic.obj]);
    optic.pan.x = clamp(optic.pan.x + (e.clientX - dragging.x) * k, -170, 170);
    optic.pan.y = clamp(optic.pan.y + (e.clientY - dragging.y) * k, -170, 170);
    dragging.x = e.clientX;
    dragging.y = e.clientY;
  });
  const endDrag = (e) => {
    if (dragging && e.pointerId !== undefined) eyeWrap.releasePointerCapture(e.pointerId);
    dragging = null;
  };
  eyeWrap.addEventListener('pointerup', endDrag);
  eyeWrap.addEventListener('pointercancel', endDrag);
}

const eyePanel = document.getElementById('eyePanel');
const btnExpand = document.getElementById('eyeExpand');
const btnExit = document.getElementById('eyeExit');
function setEyeExpanded(v) {
  eyePanel.classList.toggle('expanded', v);
  btnExpand.textContent = v ? '收起放大' : '放大视野';
}
btnExpand.addEventListener('click', () => setEyeExpanded(!eyePanel.classList.contains('expanded')));
btnExit.addEventListener('click', () => setEyeExpanded(false));
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') setEyeExpanded(false);
});

/* ---------------- 虚拟准焦旋钮（拖拽 → focus，3D 镜身旋钮同步转动） ---------------- */

document.querySelectorAll('.knob-dial').forEach((dial) => {
  const kind = dial.dataset.knob;
  const speed = kind === 'coarse' ? 0.3 : 0.1;   /* 每像素焦距增量 */
  let drag = null;
  dial.addEventListener('pointerdown', (e) => {
    drag = { y: e.clientY, f: optic.focus };
    dial.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  dial.addEventListener('pointermove', (e) => {
    if (!drag) return;
    optic.focus = clamp(drag.f + (drag.y - e.clientY) * speed, 0, 100);
  });
  const stop = (e) => {
    if (drag && e.pointerId !== undefined) dial.releasePointerCapture(e.pointerId);
    drag = null;
  };
  dial.addEventListener('pointerup', stop);
  dial.addEventListener('pointercancel', stop);
});

/* ---------------- 章节控件（左课题卡内） ---------------- */

const ctl = createControlsPanel(document.getElementById('controls'));
let activeSectionId = null;
let activeCleanup = null;

const hud = makeHUD(document.getElementById('lcData'), [['a', '读数'], ['b', '要点'], ['c', '提示']]);
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
  if (parts.noseSpin) parts.noseSpin.rotation.y = -i * (TAU / 4);
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
<p>打开「标注」用按钮飞到各部件特写；「翻转反光镜」可切换平面镜/凹面镜。</p>`,
    enter() {
      optic.slide = 'letter';
      app.setCamera([6.2, 7.0, 12.8], [0.75, 1.0, -0.25]);
      hud.visibleNow = true;
      ctl.clear();
      ctl.toggle({
        label: '部件标注', value: false,
        onChange: (v) => { parts.labels.forEach((l) => { l.visible = v; }); },
      });
      ctl.button({
        label: '翻转反光镜',
        onClick: () => {
          optic.mirrorFlip = !optic.mirrorFlip;
          hud.set('c', optic.mirrorFlip ? '凹面镜：会聚光线，光线弱时用' : '平面镜：平行反射，光线强时用');
        },
      });
      ctl.sep();
      [
        ['整体', [6.2, 7.0, 12.8], [0.75, 1.0, -0.25]],
        ['目镜与镜筒', [1.6, 4.6, 3.0], [0.25, 3.0, 0.4]],
        ['转换器与物镜', [1.8, 1.7, 3.2], [0.25, 2.0, 0.2]],
        ['准焦螺旋', [-3.0, 2.3, 1.8], [-1.25, 1.85, 0.1]],
        ['遮光器与反光镜', [1.4, 0.6, 2.9], [0.3, 0.8, 0.45]],
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

/* ================= 章节管理（左课题卡：下拉 + 上下章 + 折叠） ================= */

const lessonEl = document.getElementById('lesson');
const chapSel = document.getElementById('chapSel');
const chapCount = document.getElementById('chapCount');
const btnPrev = document.getElementById('chapPrev');
const btnNext = document.getElementById('chapNext');
const lessonCard = document.getElementById('lessonCard');
let chapterIdx = 0;

function selectChapter(i) {
  chapterIdx = clamp(i, 0, SECTIONS.length - 1);
  const sec = SECTIONS[chapterIdx];
  chapSel.value = String(chapterIdx);
  chapCount.textContent = `${String(chapterIdx + 1).padStart(2, '0')}/${SECTIONS.length}`;
  btnPrev.disabled = chapterIdx === 0;
  btnNext.disabled = chapterIdx === SECTIONS.length - 1;
  lessonEl.innerHTML = sec.html || '';
  lessonEl.scrollTop = 0;
  if (activeCleanup) { activeCleanup(); activeCleanup = null; }
  if (sec.id !== 'imaging') optic.letterRot = 0;
  activeSectionId = sec.id;
  sec.enter();
  document.getElementById('lcData').scrollTop = 0;
}
chapSel.addEventListener('change', () => selectChapter(parseInt(chapSel.value, 10)));
btnPrev.addEventListener('click', () => selectChapter(chapterIdx - 1));
btnNext.addEventListener('click', () => selectChapter(chapterIdx + 1));
document.getElementById('lcMinBtn').addEventListener('click', () => {
  const min = lessonCard.classList.toggle('lc-min');
  document.getElementById('lcMinBtn').textContent = min ? '+' : '—';
  document.getElementById('lcMinBtn').setAttribute('aria-label', min ? '展开课题卡' : '折叠课题卡');
});
/* 窄屏默认收起课题卡（抽屉态） */
if (window.matchMedia('(max-width: 560px)').matches) {
  lessonCard.classList.add('lc-min');
  document.getElementById('lcMinBtn').textContent = '+';
}
SECTIONS.forEach((s, i) => {
  const o = document.createElement('option');
  o.value = String(i);
  o.textContent = `${String(i + 1).padStart(2, '0')} · ${s.title}`;
  chapSel.appendChild(o);
});

/* ================= 主循环 ================= */

const magBigEl = document.getElementById('magBig');
const dialCoarse = document.querySelector('[data-knob="coarse"]');
const dialFine = document.querySelector('[data-knob="fine"]');
let lastMag = -1;

app.onFrame((dt, t) => {
  hud.el.style.display = hud.visibleNow ? '' : 'none';
  /* 调焦旋钮联动（3D 镜身 + 右栏虚拟旋钮）+ 载物台微升降 */
  if (parts.knobCoarse) {
    parts.knobCoarse.rotation.x = optic.focus * 0.08;
    parts.knobFine.rotation.x = -optic.focus * 0.14;
  }
  dialCoarse.style.transform = `rotate(${optic.focus * 2.4}deg)`;
  dialFine.style.transform = `rotate(${-optic.focus * 4}deg)`;
  if (parts.stageAsm) {
    parts.stageAsm.position.y = (62 - optic.focus) * 0.0009;
  }
  /* 台下光源联动 */
  if (parts.lamp) {
    parts.lamp.material.color.setScalar(optic.lampOn ? 1 : 0.18);
    lampPoint.intensity = optic.lampOn ? 2.2 : 0.3;
  }
  /* 暗场/相差模式下环境光自动压暗（聚焦观察氛围） */
  const dimmed = optic.light === 'dark' || optic.light === 'phase';
  const k = Math.min(1, dt * 4);
  ambLight.intensity += ((dimmed ? 0.16 : 0.5) - ambLight.intensity) * k;
  windowFill.intensity += ((dimmed ? 0.3 : 0.9) - windowFill.intensity) * k;
  /* 反光镜翻转（平面 ↔ 凹面） */
  if (parts.mirrorAsm) {
    const target = optic.mirrorFlip ? -0.72 + Math.PI : -0.72;
    parts.mirrorAsm.rotation.x += (target - parts.mirrorAsm.rotation.x) * Math.min(1, dt * 5);
  }
  /* 目镜视野 + 放大读数 */
  renderEyepiece(t);
  if (totalMag() !== lastMag) {
    lastMag = totalMag();
    magBigEl.textContent = lastMag + '×';
  }
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
    back.addEventListener('click', () => { panel.remove(); selectChapter(0); });
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

window.__eduSections = { select: selectChapter };
/* 调试句柄（自动化截图/像素级自查用） */
window.__microDebug = { optic, renderEyepiece: (t = 1) => renderEyepiece(t), sampleCanvas: sCv, eyeCanvas: eCv, vfx, app };
/* 随堂检测入口（顶栏按钮） */
const quizBtn = document.createElement('button');
quizBtn.type = 'button';
quizBtn.className = 'edu-header-btn';
quizBtn.textContent = '随堂检测';
quizBtn.addEventListener('click', () => {
  const old = stage.querySelector('.quiz-panel');
  if (old) old.remove();
  showQuiz();
});
document.querySelector('.micro-toprow .spacer').before(quizBtn);
loader.hide();
selectChapter(0);
