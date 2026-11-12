/* EduLab · 海陆的变迁（drift）
 * 章节：沧海桑田 / 高山岩层中的海洋化石 / 海峡下的古河道 / 大陆漂移假说 /
 *       泛大陆的分裂 / 六大板块 / 火山与地震 / 张裂与碰撞 / 随堂检测
 * 场景：海岸升降 3D 模型、褶皱地层剖面、海峡剖面、世界地图大陆拼合与泛大陆分裂动画、板块边界图
 * 布局：真·三栏（左章节大纲 / 中 3D 舞台 / 右知识点详解）+ 全元素折叠 + 专注模式，
 *       视觉工艺经 attachVFX 轻接入（后处理管线 + cubic 运镜；HDR 只作环境光，背景由工艺管理）。
 */
import {
  THREE, DEG, clamp, loadHDR, loadAll, createApp,
  makeLoader, createControlsPanel, makeHUD, makeTextSprite, makeGlowTexture,
} from './edu-core.js';
import {
  attachVFX, PAL, matSheen, matCoat, matStd, matGlow, matGlass,
  makeWoodTexture, makeLabelTexture, makeStudioEnvironment, fbm3,
} from './edu-vfx.js';

const TEXDIR = '../assets/textures/';

/* ---------------- 场景与工艺接入 ---------------- */

const stage = document.getElementById('stage');
const loader = makeLoader(stage, '正在准备海陆变迁实验…');

const app = createApp({
  container: stage, fov: 44, near: 0.1, far: 400,
  cameraPos: [7, 6, 10], target: [0, 0.4, 0],
  minDistance: 2, maxDistance: 40, exposure: 1.05,
  keepBackground: true,
});
const { scene, camera, controls } = app;
/* 视觉工艺接入：后处理管线接管渲染与相机缓动（setCamera 升级为 cubic 运镜） */
const vfx = attachVFX(app, 'illus');

scene.add(new THREE.HemisphereLight(0xe8f1ff, 0xa89a80, 1.1));
const sunL = new THREE.DirectionalLight(0xfff2dc, 1.9);
sunL.position.set(6, 9, 5);
scene.add(sunL);
/* 补光 + 地面反弹：暗部层次与暖色回光，金属/玻璃的高光走向靠环境反射补足 */
const fillL = new THREE.DirectionalLight(0xbcd4ee, 0.55);
fillL.position.set(-7, 4.5, -4);
scene.add(fillL);
const bounceL = new THREE.PointLight(0xffdcae, 0.4, 26);
bounceL.position.set(0, 2.2, 3.4);
scene.add(bounceL);

/* 各章场景组 */
const gCoast = new THREE.Group();   // 沧海桑田
const gStrata = new THREE.Group();  // 地层化石
const gStrait = new THREE.Group();  // 海峡古河道
const gMap = new THREE.Group();     // 大陆漂移 / 泛大陆 / 板块 / 火山地震
const gBound = new THREE.Group();   // 张裂与碰撞剖面
scene.add(gCoast, gStrata, gStrait, gMap, gBound);

const allGroups = [gCoast, gStrata, gStrait, gMap, gBound];
/* showGroup(g, ...extra)：主场景组互斥显隐；叙事道具组（书桌/标本盒/地震仪）只随点名章节亮出 */
function showGroup(g, ...extra) {
  allGroups.forEach((x) => { x.visible = x === g; });
  for (const p of [gDesk, gCase, gSeismo]) p.visible = extra.includes(p);
}

/* 精灵标签统一管理 */
const sprites = [];
function addSprite(parent, text, x, y, z, opts) {
  const sp = makeTextSprite(text, opts || { fontSize: 28, color: '#ffe6c0', scale: 0.0042 });
  sp.position.set(x, y, z);
  parent.add(sp);
  sprites.push(sp);
  return sp;
}
function hideAllSprites() { sprites.forEach((s) => { s.visible = false; }); }
function showOnly(pred) { sprites.forEach((s) => { s.visible = !!pred(s); }); }

/* ==================== 建模工艺扩展（本实验自研工具箱，全部进渲染路径） ====================
 * 内容：曲线放样（变宽条带 / 变径圆管）、沉积岩程序化纹理、标本卡与地图纸贴图、
 *      接触阴影贴片、金属/橡胶材质分层、菊石-三叶虫-箭石化石建模、地震仪滚筒动态纸带。
 * 方法均参照 CRAFT-STANDARD：CanvasTexture 矢量绘制 + CatmullRomCurve3 放样 + PAL 取色。
 */

const D_MATS = {
  brass: matStd(PAL.brass, { roughness: 0.3, metalness: 0.88 }),
  brassDark: matStd(0x8a6c34, { roughness: 0.42, metalness: 0.8 }),
  steel: matStd(0x66707c, { roughness: 0.36, metalness: 0.85 }),
  steelDark: matStd(0x3c434c, { roughness: 0.5, metalness: 0.78 }),
  rubber: matStd(0x2e3238, { roughness: 0.94, metalness: 0 }),
  paper: matStd(0xf0ecdd, { roughness: 0.85, metalness: 0 }),
  wood: null,        // 建造时用 makeWoodTexture 填充
  woodDark: null,
};

/* 沿 CatmullRom 曲线放样变宽条带：中轴取样 → 切线×上向量得横向 → 两顶点/段三角带。
 * 用于：洋中脊脊体、埋藏古河道、熔岩流、潮沫线、俯冲板片。 */
/* 实例摆放共用临时量（模块级，避免各块重复建对象） */
const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _v = new THREE.Vector3();

function loftRibbon(pts, widthFn, material, opts = {}) {
  const curve = new THREE.CatmullRomCurve3(pts);
  const segs = opts.segs ?? 96;
  const up = opts.up || new THREE.Vector3(0, 1, 0);
  const lift = opts.lift ?? 0;
  const vRep = opts.vScale ?? 1;
  const pos = [], uvs = [], idx = [];
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const p = curve.getPointAt(t);
    const tan = curve.getTangentAt(t);
    const side = new THREE.Vector3().crossVectors(tan, up).normalize();
    const w = widthFn(t);
    pos.push(p.x - side.x * w, p.y + lift, p.z - side.z * w);
    pos.push(p.x + side.x * w, p.y + lift, p.z + side.z * w);
    uvs.push(0, t * vRep, 1, t * vRep);
  }
  for (let i = 0; i < segs; i++) {
    const a = i * 2, b = a + 1, c = a + 2, d = a + 3;
    idx.push(a, c, b, b, c, d);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, material);
  mesh.geometry.curve = curve;
  return mesh;
}

/* 沿 CatmullRom 曲线放样变径圆管：Frenet 框架展开环形顶点，管径随弧长参数变化。
 * 原生 TubeGeometry 只支持恒定半径，菊石壳这种渐粗螺管必须手写放样。 */
function loftTube(pts, rFn, material, opts = {}) {
  const curve = new THREE.CatmullRomCurve3(pts);
  const segs = opts.segs ?? 72;
  const radial = opts.radial ?? 12;
  const frames = curve.computeFrenetFrames(segs, false);
  const vRep = opts.vScale ?? 6;
  const pos = [], nrm = [], uvs = [], idx = [];
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const p = curve.getPointAt(t);
    const r = rFn(t);
    const N = frames.normals[i], B = frames.binormals[i];
    for (let j = 0; j <= radial; j++) {
      const a = (j / radial) * Math.PI * 2;
      const cos = Math.cos(a), sin = Math.sin(a);
      const nx = cos * N.x + sin * B.x, ny = cos * N.y + sin * B.y, nz = cos * N.z + sin * B.z;
      pos.push(p.x + r * nx, p.y + r * ny, p.z + r * nz);
      nrm.push(nx, ny, nz);
      uvs.push(j / radial, t * vRep);
    }
  }
  for (let i = 0; i < segs; i++) {
    for (let j = 0; j < radial; j++) {
      const a = i * (radial + 1) + j, b = a + radial + 1;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(idx);
  const mesh = new THREE.Mesh(geo, material);
  mesh.geometry.curve = curve;
  return mesh;
}

/* 径向渐变接触阴影贴片：黑心向边缘淡出，压在道具落点下消除「漂浮感」 */
const shadowTex = (() => {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 128;
  const c = cv.getContext('2d');
  const g = c.createRadialGradient(64, 64, 6, 64, 64, 62);
  g.addColorStop(0, 'rgba(6,10,14,0.62)');
  g.addColorStop(0.55, 'rgba(6,10,14,0.26)');
  g.addColorStop(1, 'rgba(6,10,14,0)');
  c.fillStyle = g;
  c.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(cv);
})();
function addContactShadow(parent, w, d, y, opacity = 0.8) {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(w, d).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, opacity, depthWrite: false })
  );
  m.position.y = y;
  m.renderOrder = -1;
  parent.add(m);
  return m;
}

/* 沉积岩程序化纹理：按岩性画层理/页理/缝合线/气孔，配颗粒噪点。
 * kind: sandstone 砂岩 / shale 页岩 / limestone 石灰岩 / mudstone 泥岩 / basalt 玄武岩 */
function makeRockTexture(kind = 'sandstone', seed = 3) {
  const S = 512;
  const cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const c = cv.getContext('2d');
  let rndSeed = seed;
  const rnd = () => {
    rndSeed = (rndSeed * 16807) % 2147483647;
    return rndSeed / 2147483647;
  };
  const THEME = {
    sandstone: { base: '#c9b289', band: '#a8906a', spec: '#e0cba2', lines: 16 },
    shale: { base: '#9aa878', band: '#7a8a5e', spec: '#b4c490', lines: 42 },
    limestone: { base: '#bcc8ca', band: '#9aaab0', spec: '#dde6e6', lines: 10 },
    mudstone: { base: '#8c8792', band: '#726d7a', spec: '#a8a2ae', lines: 20 },
    basalt: { base: '#4c4e56', band: '#3a3c44', spec: '#62646e', lines: 8 },
  }[kind] || { base: '#a0a0a0', band: '#808080', spec: '#c0c0c0', lines: 16 };
  c.fillStyle = THEME.base;
  c.fillRect(0, 0, S, S);
  /* 沉积层理：低频水平暗带 */
  for (let i = 0; i < THEME.lines; i++) {
    const y = rnd() * S;
    const h = 3 + rnd() * 14;
    const lg = c.createLinearGradient(0, y - h, 0, y + h);
    lg.addColorStop(0, 'rgba(40,32,22,0)');
    lg.addColorStop(0.5, `rgba(40,32,22,${0.14 + rnd() * 0.2})`);
    lg.addColorStop(1, 'rgba(40,32,22,0)');
    c.fillStyle = lg;
    c.fillRect(0, y - h, S, h * 2);
  }
  /* 亮色胶结条与缝合线波曲 */
  c.strokeStyle = THEME.spec;
  c.globalAlpha = 0.25;
  for (let i = 0; i < 6; i++) {
    const y0 = rnd() * S;
    c.lineWidth = 0.8 + rnd() * 1.6;
    c.beginPath();
    for (let x = 0; x <= S; x += 10) {
      const y = y0 + Math.sin(x / 46 + i * 2.2) * (2 + rnd() * 3);
      x === 0 ? c.moveTo(x, y) : c.lineTo(x, y);
    }
    c.stroke();
  }
  c.globalAlpha = 1;
  /* 颗粒噪点 */
  for (let i = 0; i < 3200; i++) {
    c.fillStyle = rnd() > 0.5 ? 'rgba(30,24,16,0.12)' : 'rgba(235,225,200,0.1)';
    const s = 1 + rnd() * 2.4;
    c.fillRect(rnd() * S, rnd() * S, s, s);
  }
  if (kind === 'limestone') {
    /* 生物碎屑印痕：小螺圈与椭圆屑粒 */
    c.strokeStyle = 'rgba(90,100,104,0.5)';
    for (let i = 0; i < 26; i++) {
      const x = rnd() * S, y = rnd() * S;
      if (rnd() > 0.45) {
        c.beginPath();
        let px = x, py = y;
        c.moveTo(px, py);
        for (let k = 1; k < 26; k++) {
          const th = k * 0.42, r = 1.1 + k * 0.24;
          px = x + Math.cos(th) * r; py = y + Math.sin(th) * r;
          c.lineTo(px, py);
        }
        c.lineWidth = 1.1;
        c.stroke();
      } else {
        c.beginPath();
        c.ellipse(x, y, 3 + rnd() * 7, 1.6 + rnd() * 3.4, rnd() * 3.14, 0, Math.PI * 2);
        c.lineWidth = 1;
        c.stroke();
      }
    }
  }
  if (kind === 'basalt') {
    /* 气孔：随机暗椭圆 */
    c.fillStyle = 'rgba(14,14,18,0.6)';
    for (let i = 0; i < 90; i++) {
      c.beginPath();
      c.ellipse(rnd() * S, rnd() * S, 1.4 + rnd() * 5, 1 + rnd() * 3.6, rnd() * 3.1, 0, Math.PI * 2);
      c.fill();
    }
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

/* 标本采集卡：纸底双框 + 名称/产地/年代/编号 + 角落印章圈，贴在标本盒前立面 */
function makeSpecimenCard(name, meta, no, accent = '#8a4030') {
  const w = 220, h = 300;
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const c = cv.getContext('2d');
  c.fillStyle = '#efe9d8';
  c.fillRect(0, 0, w, h);
  for (let i = 0; i < 160; i++) {
    c.fillStyle = 'rgba(120,100,70,0.05)';
    c.fillRect(Math.random() * w, Math.random() * h, 2, 2);
  }
  c.strokeStyle = accent;
  c.lineWidth = 4;
  c.strokeRect(10, 10, w - 20, h - 20);
  c.lineWidth = 1.4;
  c.strokeRect(18, 18, w - 36, h - 36);
  c.fillStyle = '#2c2620';
  c.textAlign = 'center';
  c.font = '900 30px "PingFang SC","Microsoft YaHei",sans-serif';
  c.fillText(name, w / 2, 74);
  c.strokeStyle = accent;
  c.beginPath();
  c.moveTo(40, 92);
  c.lineTo(w - 40, 92);
  c.stroke();
  c.font = '400 19px "PingFang SC",sans-serif';
  meta.split('|').forEach((line, i) => c.fillText(line.trim(), w / 2, 128 + i * 30));
  /* 编号章 */
  c.beginPath();
  c.arc(w / 2, h - 66, 30, 0, Math.PI * 2);
  c.strokeStyle = accent;
  c.lineWidth = 2.4;
  c.stroke();
  c.fillStyle = accent;
  c.font = '900 22px Georgia,serif';
  c.fillText(no, w / 2, h - 58);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/* 等距圆柱投影海陆贴图：CONT 多边形 → 经纬画布，海陆分色 + 网格 + 浅海陆缘。地球仪球面用 */
function makeGlobeTexture() {
  const W = 1024, H = 512;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const c = cv.getContext('2d', { willReadFrequently: true });   // 陆内噪点需逐像素取样
  const sea = c.createLinearGradient(0, 0, 0, H);
  sea.addColorStop(0, '#274c74');
  sea.addColorStop(0.5, '#2e5f8e');
  sea.addColorStop(1, '#274c74');
  c.fillStyle = sea;
  c.fillRect(0, 0, W, H);
  const px = (lo) => (lo + 180) / 360 * W;
  const py = (la) => (90 - la) / 180 * H;
  /* 浅海陆缘：大陆外扩描边（先粗后细两圈） */
  for (const pass of [[7, 'rgba(90,160,200,0.5)'], [3, 'rgba(120,190,225,0.7)']]) {
    c.strokeStyle = pass[1];
    c.lineWidth = pass[0];
    for (const key of Object.keys(CONT)) {
      const poly = CONT[key];
      c.beginPath();
      poly.forEach(([lo, la], i) => (i ? c.lineTo(px(lo), py(la)) : c.moveTo(px(lo), py(la))));
      c.closePath();
      c.stroke();
    }
  }
  /* 陆地色块 */
  for (const key of Object.keys(CONT)) {
    c.fillStyle = '#' + CONT_COLORS[key].toString(16).padStart(6, '0');
    c.beginPath();
    CONT[key].forEach(([lo, la], i) => (i ? c.lineTo(px(lo), py(la)) : c.moveTo(px(lo), py(la))));
    c.closePath();
    c.fill();
    c.strokeStyle = 'rgba(70,58,30,0.5)';
    c.lineWidth = 1.6;
    c.stroke();
  }
  /* 陆内噪点肌理 */
  c.globalAlpha = 0.14;
  for (let i = 0; i < 1500; i++) {
    c.fillStyle = '#3a4a24';
    const x = Math.random() * W, y = Math.random() * H;
    const d = c.getImageData(x | 0, y | 0, 1, 1).data;
    if (d[1] > d[2]) c.fillRect(x, y, 2, 2);
  }
  c.globalAlpha = 1;
  /* 经纬网 */
  c.strokeStyle = 'rgba(230,235,240,0.22)';
  c.lineWidth = 1;
  for (let lo = -150; lo <= 150; lo += 30) {
    c.beginPath(); c.moveTo(px(lo), 0); c.lineTo(px(lo), H); c.stroke();
  }
  for (let la = -60; la <= 60; la += 30) {
    c.beginPath(); c.moveTo(0, py(la)); c.lineTo(W, py(la)); c.stroke();
  }
  c.strokeStyle = 'rgba(230,235,240,0.4)';
  c.beginPath(); c.moveTo(0, py(0)); c.lineTo(W, py(0)); c.stroke();
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/* 泛大陆复原图纸：米白纸底 + 经纬网 + 大陆色块 + 大西洋中脊虚线 + 指北针 + 标题图例 */
function makeMapSheetTexture() {
  const W = 1024, H = 724;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const c = cv.getContext('2d');
  c.fillStyle = '#ece5cf';
  c.fillRect(0, 0, W, H);
  for (let i = 0; i < 420; i++) {
    c.fillStyle = 'rgba(110,90,60,0.05)';
    c.fillRect(Math.random() * W, Math.random() * H, 2, 2);
  }
  /* 纸边做旧 */
  const edge = c.createRadialGradient(W / 2, H / 2, H * 0.4, W / 2, H / 2, H * 0.78);
  edge.addColorStop(0, 'rgba(90,66,30,0)');
  edge.addColorStop(1, 'rgba(90,66,30,0.24)');
  c.fillStyle = edge;
  c.fillRect(0, 0, W, H);
  const px = (lo) => W / 2 + lo / 36 * (W / 10.6) * 0.92;
  const py = (la) => H / 2 - la / 24 * (H / 8.4) * 0.92;
  c.strokeStyle = 'rgba(90,80,60,0.3)';
  c.lineWidth = 1;
  for (let lo = -150; lo <= 150; lo += 30) {
    c.beginPath(); c.moveTo(px(lo), py(84)); c.lineTo(px(lo), py(-84)); c.stroke();
  }
  for (let la = -60; la <= 80; la += 20) {
    c.beginPath(); c.moveTo(px(-180), py(la)); c.lineTo(px(180), py(la)); c.stroke();
  }
  c.fillStyle = 'rgba(60,52,36,0.88)';
  c.font = '900 34px "Songti SC","SimSun",serif';
  c.textAlign = 'left';
  c.fillText('泛大陆复原图 · PANGAEA', 46, 56);
  c.font = '400 17px "PingFang SC",sans-serif';
  c.fillText('据 魏格纳 1912 手稿重绘 · 比例 1:120,000,000', 46, 84);
  for (const key of Object.keys(CONT)) {
    c.fillStyle = '#' + CONT_COLORS[key].toString(16).padStart(6, '0');
    c.beginPath();
    CONT[key].forEach(([lo, la], i) => (i ? c.lineTo(px(lo), py(la)) : c.moveTo(px(lo), py(la))));
    c.closePath();
    c.fill();
    c.strokeStyle = 'rgba(80,60,30,0.65)';
    c.lineWidth = 2;
    c.stroke();
  }
  /* 大西洋中脊：红虚线 + 锯齿符号 */
  c.strokeStyle = '#c04a2c';
  c.lineWidth = 2.6;
  c.setLineDash([12, 8]);
  c.beginPath();
  [[-30, 60], [-28, 45], [-15, 30], [-12, 10], [-14, -8], [-14, -26], [-10, -42]].forEach(([lo, la], i) =>
    (i ? c.lineTo(px(lo), py(la)) : c.moveTo(px(lo), py(la))));
  c.stroke();
  c.setLineDash([]);
  /* 指北针 */
  c.strokeStyle = '#4a4030';
  c.lineWidth = 2;
  const nx = px(168), ny = py(66);
  c.beginPath(); c.arc(nx, ny, 26, 0, Math.PI * 2); c.stroke();
  c.beginPath(); c.moveTo(nx, ny + 18); c.lineTo(nx, ny - 18); c.stroke();
  c.beginPath(); c.moveTo(nx - 7, ny - 8); c.lineTo(nx, ny - 18); c.lineTo(nx + 7, ny - 8); c.stroke();
  c.font = '900 20px Georgia,serif';
  c.textAlign = 'center';
  c.fillText('N', nx, ny + 48);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/* 菊石壳：对数螺线中轴 × 渐粗圆管放样，生长纹与缝合线走管身贴图 */
function makeAmmoniteTexture() {
  const S = 256;
  const cv = document.createElement('canvas');
  cv.width = 16; cv.height = S;
  const c = cv.getContext('2d');
  c.fillStyle = '#c8b490';
  c.fillRect(0, 0, 16, S);
  for (let i = 0; i < 46; i++) {
    const y = (i / 46) * S;
    c.fillStyle = i % 5 === 0 ? 'rgba(90,64,36,0.85)' : 'rgba(120,90,54,0.5)';
    c.fillRect(0, y, 16, i % 5 === 0 ? 2.6 : 1.2);
  }
  c.fillStyle = 'rgba(240,226,196,0.28)';
  c.fillRect(3, 0, 2, S);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}
function buildAmmonite(scale = 1) {
  const pts = [];
  const N = 140;
  for (let i = 0; i <= N; i++) {
    const th = (i / N) * Math.PI * 2 * 3.6;
    const r = 0.042 * Math.exp(0.215 * th);
    pts.push(new THREE.Vector3(Math.cos(th) * r, Math.sin(th) * r, 0));
  }
  const shell = loftTube(pts, (t) => 0.008 + 0.062 * t * t,
    new THREE.MeshStandardMaterial({ map: makeAmmoniteTexture(), roughness: 0.62, metalness: 0.05 }),
    { segs: 150, radial: 14, vScale: 22 });
  /* 口缘：壳口一圈微厚唇 */
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(0.075, 0.012, 10, 28),
    matStd(0xb09c76, { roughness: 0.55 })
  );
  const end = pts[pts.length - 1];
  rim.position.set(end.x, end.y, 0);
  rim.rotation.z = Math.atan2(end.y, end.x);
  const grp = new THREE.Group();
  grp.add(shell, rim);
  grp.scale.setScalar(scale);
  return grp;
}

/* 三叶虫：头甲半椭 + 胸节 8 环 + 尾盾，分件建模、面甲与颊刺独立 */
function buildTrilobite(scale = 1) {
  const g = new THREE.Group();
  const shellMat = matSheen(0x8a7448, { roughness: 0.5, sheen: 0.55 });
  const darkMat = matStd(0x5e4c2e, { roughness: 0.6 });
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 18, 12), shellMat);
  head.scale.set(1.25, 0.34, 1);
  g.add(head);
  const glabella = new THREE.Mesh(new THREE.SphereGeometry(0.07, 14, 10), darkMat);
  glabella.scale.set(0.8, 0.5, 1);
  glabella.position.set(0.09, 0.05, 0);
  g.add(glabella);
  for (const s of [-1, 1]) {
    const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 8), shellMat);
    cheek.scale.set(0.8, 0.3, 0.9);
    cheek.position.set(0.05, 0.03, s * 0.085);
    g.add(cheek);
    const spine = new THREE.Mesh(new THREE.ConeGeometry(0.016, 0.14, 8), darkMat);
    spine.rotation.z = Math.PI / 2;
    spine.rotation.y = s * 0.5;
    spine.position.set(0.12, 0, s * 0.11);
    g.add(spine);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.016, 8, 6), matGlow(0xffd98a, 0.5));
    eye.position.set(0.1, 0.035, s * 0.055);
    g.add(eye);
  }
  const segMat = matStd(0x94805a, { roughness: 0.62 });
  for (let i = 0; i < 8; i++) {
    const t = i / 7;
    const ring = new THREE.Mesh(new THREE.BoxGeometry(0.088, 0.045, 0.24 - t * 0.06), segMat);
    ring.position.set(0.16 + i * 0.083, 0.008 - Math.sin(t * 0.5) * 0.012, 0);
    ring.rotation.z = -0.05 - t * 0.06;
    g.add(ring);
    for (const s of [-1, 1]) {
      const pl = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.09, 6), segMat);
      pl.rotation.x = s * Math.PI / 2;
      pl.position.set(0.16 + i * 0.083, 0, s * (0.14 - t * 0.03));
      g.add(pl);
    }
  }
  const pygo = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.2, 10), shellMat);
  pygo.rotation.z = Math.PI / 2;
  pygo.scale.set(1, 1, 0.55);
  pygo.position.set(0.92, -0.02, 0);
  g.add(pygo);
  g.scale.setScalar(scale);
  return g;
}

/* 箭石：直锥鞘 + 横向腔室纹，白垩纪标本 */
function buildBelemnite(scale = 1) {
  const pts = [];
  for (let i = 0; i <= 12; i++) pts.push(new THREE.Vector3(i * 0.052, 0, 0));
  const tex = (() => {
    const cv = document.createElement('canvas');
    cv.width = 64; cv.height = 256;
    const c = cv.getContext('2d');
    c.fillStyle = '#d8ccb0';
    c.fillRect(0, 0, 64, 256);
    for (let y = 0; y < 256; y += 9) {
      c.fillStyle = 'rgba(110,90,60,0.55)';
      c.fillRect(0, y, 64, 2);
    }
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  })();
  const body = loftTube(pts, (t) => 0.05 * (1 - t * 0.88) + 0.006,
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6, metalness: 0.04 }),
    { segs: 48, radial: 12, vScale: 3 });
  body.rotation.z = Math.PI / 2;
  const g = new THREE.Group();
  g.add(body);
  g.scale.setScalar(scale);
  return g;
}

/* 灯塔塔身条纹贴图：白底两道红环带（车削体 v 向重复） */
function makeLighthouseTexture() {
  const cv = document.createElement('canvas');
  cv.width = 64; cv.height = 256;
  const c = cv.getContext('2d');
  c.fillStyle = '#e8e2d4';
  c.fillRect(0, 0, 64, 256);
  c.fillStyle = '#c04a3a';
  c.fillRect(0, 60, 64, 34);
  c.fillRect(0, 150, 64, 34);
  for (let i = 0; i < 300; i++) {
    c.fillStyle = 'rgba(60,40,30,0.06)';
    c.fillRect(Math.random() * 64, Math.random() * 256, 2, 2);
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

/* 地震仪滚筒纸：格网 + 时标红线，贴滚筒圆柱 */
function makeSeismoPaper() {
  const cv = document.createElement('canvas');
  cv.width = 512; cv.height = 256;
  const c = cv.getContext('2d');
  c.fillStyle = '#f2ecd8';
  c.fillRect(0, 0, 512, 256);
  c.strokeStyle = 'rgba(120,110,90,0.4)';
  c.lineWidth = 1;
  for (let x = 0; x <= 512; x += 16) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, 256); c.stroke(); }
  for (let y = 0; y <= 256; y += 16) { c.beginPath(); c.moveTo(0, y); c.lineTo(512, y); c.stroke(); }
  c.strokeStyle = 'rgba(190,70,50,0.8)';
  for (let x = 0; x <= 512; x += 128) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, 256); c.stroke(); }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

/* 烟雾粒子贴图：软边灰团 */
function makeSmokeTexture() {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 96;
  const c = cv.getContext('2d');
  const g = c.createRadialGradient(48, 48, 4, 48, 48, 46);
  g.addColorStop(0, 'rgba(210,206,200,0.85)');
  g.addColorStop(0.5, 'rgba(190,186,180,0.4)');
  g.addColorStop(1, 'rgba(180,176,170,0)');
  c.fillStyle = g;
  c.fillRect(0, 0, 96, 96);
  return new THREE.CanvasTexture(cv);
}

/* ---------------- 章 1：沧海桑田（海岸升降） ---------------- */

{
  // 地形块：一侧山丘 + 平缓海岸
  const geo = new THREE.PlaneGeometry(9, 7, 90, 70).rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const h = 0.9 * Math.exp(-((x + 2.6) ** 2 / 4 + (z - 0.6) ** 2 / 3))
      + 0.35 * Math.exp(-((x + 0.4) ** 2 / 2 + (z + 1.8) ** 2 / 2))
      - 0.55 + 0.12 * Math.sin(x * 1.7) * Math.cos(z * 1.9);
    pos.setY(i, Math.max(h, -0.7));
  }
  geo.computeVertexNormals();
  const land = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
    color: 0x7ba85c, roughness: 0.92, metalness: 0,
  }));
  land.position.y = 0.55;
  gCoast.add(land);
  // 海水（分段网格：顶点波动在帧循环里推进，潮位由滑杆驱动整体升降）
  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(11, 9, 56, 44).rotateX(-Math.PI / 2),
    new THREE.MeshPhysicalMaterial({
      color: 0x2f7fc4, transparent: true, opacity: 0.62, roughness: 0.14,
      clearcoat: 0.5, depthWrite: false, emissive: 0x0a2033, emissiveIntensity: 0.4,
    })
  );
  water.position.y = 0.25;
  water.name = 'coastWater';
  gCoast.add(water);
  const waveBase = Float32Array.from(water.geometry.attributes.position.array);
  water.userData.waveBase = waveBase;
  // 潮沫线：贴着岸线的白色半透明条带，帧循环里沿法向往复推进，模拟潮水进退
  const foamPts = [[3.9, -3.4], [3.3, -2.2], [3.1, -0.9], [3.35, 0.4], [3.9, 1.6], [4.6, 2.8]]
    .map(([x, z]) => new THREE.Vector3(x, 0, z));
  const foam = loftRibbon(foamPts, (t) => 0.06 + 0.03 * Math.sin(t * 9),
    new THREE.MeshBasicMaterial({ color: 0xeaf6ff, transparent: true, opacity: 0.5, depthWrite: false }),
    { segs: 60, lift: 0.03 });
  foam.name = 'coastFoam';
  gCoast.add(foam);
  // 沙滩贝壳散点（两种形各一池实例，随机旋转贴地）
  const shellGeoA = new THREE.SphereGeometry(0.05, 10, 6, 0, Math.PI);
  const shellGeoB = new THREE.ConeGeometry(0.045, 0.1, 9);
  const shellMat = matStd(0xe8dcc0, { roughness: 0.6 });
  const shells = new THREE.InstancedMesh(shellGeoA, shellMat, 16);
  const shells2 = new THREE.InstancedMesh(shellGeoB, matStd(0xdccbb4, { roughness: 0.65 }), 10);
  const shellSpots = [[3.0, -2.6], [3.3, -1.7], [2.9, -0.4], [3.2, 0.8], [3.6, 1.9], [2.8, -2.1], [3.1, 0.2], [3.5, -1.1]];
  shellSpots.forEach(([x, z], i) => {
    _e.set(Math.PI / 2 + (i % 3 - 1) * 0.4, i * 2.1, i * 1.3);
    _q.setFromEuler(_e);
    _v.set(x, 0.32 + (i % 4) * 0.015, z + i * 0.23);
    _m4.compose(_v, _q, _v.clone().set(1, 1, 1));
    shells.setMatrixAt(i, _m4);
    _e.set((i % 2) * 0.3, i * 2.7, 0.1 * i);
    _q.setFromEuler(_e);
    _v.set(x - 0.4, 0.3, z + 0.5);
    _m4.compose(_v, _q, _v.clone().set(1, 1, 1));
    shells2.setMatrixAt(i % 10, _m4);
  });
  gCoast.add(shells, shells2);
  // 防波堤：两排扭块石（十二面体随机压扁），护住湾口
  const riprap = new THREE.InstancedMesh(
    new THREE.DodecahedronGeometry(0.085),
    matStd(0x6e6e74, { roughness: 1 }), 18
  );
  for (let i = 0; i < 18; i++) {
    const row = i % 2, col = (i / 2) | 0;
    _q.setFromEuler(new THREE.Euler(Math.random() * 3, Math.random() * 3, Math.random() * 3));
    _v.set(2.0 + col * 0.3, 0.22 + row * 0.1 + Math.random() * 0.04, 2.55 + (i % 2) * 0.26);
    _m4.compose(_v, _q, new THREE.Vector3(1 + Math.random() * 0.35, 0.75 + Math.random() * 0.3, 1 + Math.random() * 0.3));
    riprap.setMatrixAt(i, _m4);
  }
  gCoast.add(riprap);
  // 木栈桥：四根桩 + 面板（板缝木纹），伸进海里
  const pier = new THREE.Group();
  const pierWood = makeWoodTexture({ base: '#6e4c2e', dark: '#4e341e', light: '#8a6640', streaks: 60, seed: 11 });
  for (const [px, pz] of [[-0.5, 0.4], [-0.5, 1.6], [0.6, 0.4], [0.6, 1.6]]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.075, 1.5, 10), new THREE.MeshStandardMaterial({ map: pierWood, roughness: 0.9 }));
    post.position.set(px, 0.2, pz);
    pier.add(post);
  }
  const deck = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.09, 1.9), new THREE.MeshStandardMaterial({ map: pierWood, color: 0x9a8a76, roughness: 0.95 }));
  deck.position.set(0.05, 0.86, 1.0);
  pier.add(deck);
  /* 栏杆：两侧扶手 + 立柱，码头语汇完整 */
  for (const sxA of [-0.62, 0.72]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 1.8), new THREE.MeshStandardMaterial({ map: pierWood, roughness: 0.9 }));
    rail.position.set(sxA, 1.08, 1.0);
    pier.add(rail);
    for (const rz of [0.2, 1.0, 1.8]) {
      const baluster = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.34, 8), new THREE.MeshStandardMaterial({ map: pierWood, roughness: 0.9 }));
      baluster.position.set(sxA, 0.92, rz);
      pier.add(baluster);
    }
  }
  /* 系船柱 + 缆绳：两根车削短柱，缆绳沿悬链线搭到礁石（曲线 Line3D） */
  for (const bz of [0.2, 1.6]) {
    const bollard = new THREE.Mesh(
      new THREE.LatheGeometry([[0, 0], [0.05, 0], [0.055, 0.02], [0.04, 0.06], [0.045, 0.1], [0.06, 0.12], [0.055, 0.15], [0.03, 0.17]].map(([r, y]) => new THREE.Vector2(r, y)), 14),
      D_MATS.steelDark
    );
    bollard.position.set(0.72, 0.95, bz);
    pier.add(bollard);
  }
  const ropePts = [];
  for (let i = 0; i <= 14; i++) {
    const tt = i / 14;
    const x = 2.6 + 0.72 * 0.9 - tt * 0.2;
    const z = 0.6 + 0.2 + tt * 2.0;
    const sag = Math.sin(tt * Math.PI) * 0.22;
    ropePts.push(new THREE.Vector3(x, 1.05 - sag, z));
  }
  const rope = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(new THREE.CatmullRomCurve3(ropePts).getPoints(40)),
    new THREE.LineBasicMaterial({ color: 0xd8c8a0 })
  );
  gCoast.add(rope);
  pier.position.set(2.6, 0, 0.6);
  pier.rotation.y = -0.4;
  gCoast.add(pier);
  addContactShadow(gCoast, 1.9, 1.9, 0.29, 0.55).position.set(2.6, 0.29, 1.5);
  // 潮池：低洼处两个小水面，退潮后留在滩上
  for (const [x, z] of [[3.4, -0.6], [2.9, 1.9]]) {
    const pool = new THREE.Mesh(
      new THREE.CircleGeometry(0.2 + Math.random() * 0.1, 20).rotateX(-Math.PI / 2),
      new THREE.MeshPhysicalMaterial({ color: 0x3a86b8, transparent: true, opacity: 0.7, roughness: 0.1, clearcoat: 0.6, depthWrite: false })
    );
    pool.position.set(x, 0.31, z);
    gCoast.add(pool);
  }
  /* 海星：五腕海星趴在防波堤旁（五锥腕 + 中心盘 + 逐腕渐细），潮间带叙事小件 */
  function buildStarfish(scale, color) {
    const g = new THREE.Group();
    const mat = matStd(color, { roughness: 0.7 });
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.016, 12), mat);
    g.add(disc);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      /* 臂组：绕 y 转向腕位方向，锥臂在组内沿 +Z 平放外伸 */
      const armGrp = new THREE.Group();
      armGrp.rotation.y = Math.PI / 2 - a;
      const arm = new THREE.Mesh(new THREE.ConeGeometry(0.024, 0.14, 8), mat);
      arm.rotation.x = Math.PI / 2;
      arm.position.z = 0.075;
      armGrp.add(arm);
      for (const k of [1, 2]) {
        const spine = new THREE.Mesh(new THREE.ConeGeometry(0.006, 0.02, 6), mat);
        spine.position.set(0, 0.018 + 0.004 * k, 0.045 * k + 0.03);
        armGrp.add(spine);
      }
      g.add(armGrp);
    }
    g.scale.setScalar(scale);
    return g;
  }
  const star1 = buildStarfish(1, 0xe89a6a);
  star1.position.set(2.3, 0.32, -1.2);
  star1.rotation.y = 0.8;
  gCoast.add(star1);
  const star2 = buildStarfish(0.75, 0xd8788a);
  star2.position.set(3.7, 0.32, 0.6);
  star2.rotation.y = 2.2;
  gCoast.add(star2);
  /* 礁石群：水线附近一组压扁漂砾（实例化），浪花带以白沫贴面 */
  const reefRocks = new THREE.InstancedMesh(
    new THREE.IcosahedronGeometry(0.16),
    matStd(0x6e6a66, { roughness: 0.98 }), 8
  );
  const REEF_SPOTS = [[3.9, 2.9], [4.3, 2.6], [4.6, 3.1], [4.1, 3.3], [4.8, 2.4], [4.4, 3.5], [3.8, 3.4], [4.9, 2.9]];
  REEF_SPOTS.forEach(([x, z], i) => {
    _q.setFromEuler(new THREE.Euler(Math.random() * 0.6, Math.random() * 6.28, Math.random() * 0.6));
    const s = 0.6 + Math.random() * 0.7;
    _m4.compose(_v.set(x, 0.16 + Math.random() * 0.08, z), _q, new THREE.Vector3(s, s * 0.7, s));
    reefRocks.setMatrixAt(i, _m4);
  });
  gCoast.add(reefRocks);
  /* 滩涂沙带：岸线内侧一条浅色沙纹带（loftRibbon 顺潮沫线走向），与草地分界 */
  const sandTex = (() => {
    const cv = document.createElement('canvas');
    cv.width = 128; cv.height = 128;
    const c = cv.getContext('2d');
    c.fillStyle = '#dcc896';
    c.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 700; i++) {
      c.fillStyle = Math.random() > 0.5 ? 'rgba(150,120,70,0.25)' : 'rgba(240,225,180,0.3)';
      c.fillRect(Math.random() * 128, Math.random() * 128, 1.5, 1.5);
    }
    const t2 = new THREE.CanvasTexture(cv);
    t2.colorSpace = THREE.SRGBColorSpace;
    t2.wrapS = t2.wrapT = THREE.RepeatWrapping;
    return t2;
  })();
  const sandStrip = loftRibbon(
    foamPts.map((p) => p.clone().add(new THREE.Vector3(-0.3, 0, 0))),
    () => 0.16,
    new THREE.MeshStandardMaterial({ map: sandTex, roughness: 1 }),
    { segs: 60, lift: 0.29, vScale: 5 }
  );
  gCoast.add(sandStrip);
  // 底座
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(9, 0.4, 7),
    new THREE.MeshStandardMaterial({ color: 0x8a7a5e, roughness: 0.95 })
  );
  base.position.y = -0.95;
  gCoast.add(base);
  addSprite(gCoast, '陆地', -2.6, 1.8, 0.6, { fontSize: 28, color: '#d8ffc8' });
  const seaSp = addSprite(gCoast, '海洋', 2.8, 1.0, 2.2, { fontSize: 28, color: '#9fd8ff' });
  seaSp.name = 'coastSea';
}

/* ---------------- 章 2：高山岩层中的海洋化石（褶皱地层） ---------------- */

const strataState = { t: 0.35 };
const strataLayers = [];
const FOSSIL_N = 4;
const fossilSprites = [];
const fossil3d = [];   // 真 3D 化石标本（菊石/三叶虫/箭石），随石灰岩层同步抬升
const rockTexes = {
  sandstone: makeRockTexture('sandstone', 31),
  shale: makeRockTexture('shale', 57),
  limestone: makeRockTexture('limestone', 73),
  mudstone: makeRockTexture('mudstone', 91),
};
{
  const X0 = -4.4, X1 = 4.4, SEG = 72;
  const layers = [
    { base: 0.0, amp: 1.0, color: 0xc8b088, tex: rockTexes.sandstone, r: 1.6 },  // 砂岩（顶）
    { base: -0.42, amp: 0.92, color: 0x9aa878, tex: rockTexes.shale, r: 1.2 },   // 页岩
    { base: -0.86, amp: 0.8, color: 0xb8c4c8, tex: rockTexes.limestone, r: 1.4, fossil: true }, // 石灰岩（含化石）
    { base: -1.35, amp: 0.62, color: 0x8a8490, tex: rockTexes.mudstone, r: 1 },  // 底层
  ];
  const fold = (x) => 1.15 * Math.exp(-(x * x) / 3.6) + 0.35 * Math.exp(-((x + 2.6) ** 2) / 1.4) + 0.28 * Math.exp(-((x - 2.8) ** 2) / 1.6);
  for (const L of layers) {
    const tex = L.tex.clone();
    tex.needsUpdate = true;
    tex.repeat.set(L.r, 1);
    const geo = new THREE.BoxGeometry(X1 - X0, 0.42, 2.6, SEG, 1, 2);
    const mat = new THREE.MeshStandardMaterial({ color: L.color, map: tex, roughness: 0.92 });
    const mesh = new THREE.Mesh(geo, mat);
    strataLayers.push({ mesh, base: L.base, amp: L.amp, fold });
    gStrata.add(mesh);
  }
  // 岩层间渗水痕与节理：给顶板加几条暗色缝隙线，褶皱时跟随顶板高度
  const seamPts = [[-3.4, -1.1], [-2.2, -0.6], [-0.6, -0.9], [1.2, -0.7], [2.9, -1.2]]
    .map(([x, z]) => new THREE.Vector3(x, 0, z));
  const seam = loftRibbon(seamPts, () => 0.02,
    new THREE.MeshBasicMaterial({ color: 0x2c2418, transparent: true, opacity: 0.4, depthWrite: false }),
    { segs: 48, lift: 0.36 });
  seam.name = 'strataSeam';
  gStrata.add(seam);
  gStrata.add(new THREE.Mesh(
    new THREE.BoxGeometry(9.6, 0.5, 2.6),
    new THREE.MeshStandardMaterial({ color: 0x6e6258, roughness: 0.95 })
  )).children;
  const baseMesh = gStrata.children[gStrata.children.length - 1];
  baseMesh.position.y = -2.05;
  /* 3D 化石标本三件：菊石（螺旋壳）、三叶虫（分节）、箭石（直锥），嵌在石灰岩顶面 */
  const amm = buildAmmonite(0.85);
  amm.rotation.x = -Math.PI / 2;
  amm.userData.fx = -2.9;
  const trilo = buildTrilobite(0.72);
  trilo.rotation.x = -Math.PI / 2;
  trilo.rotation.z = 0.35;
  trilo.userData.fx = -0.3;
  const belem = buildBelemnite(0.9);
  belem.rotation.x = -Math.PI / 2;
  belem.rotation.y = 0.5;
  belem.userData.fx = 1.9;
  for (const f of [amm, trilo, belem]) {
    f.userData.fz = 0.3;
    gStrata.add(f);
    fossil3d.push(f);
    /* 化石小铜牌：随标本同步抬升（updateStrata 里按 fx/fz 定位） */
    const tagNames = { '-2.9': '菊石 · Ammonite', '-0.3': '三叶虫 · Trilobite', '1.9': '箭石 · Belemnite' };
    const tagTex2 = makeLabelTexture([tagNames[String(f.userData.fx)] || '化石标本', '中生代 · 海相地层'], { accent: '#6e563a', w: 220, h: 96, fontSize: 22 });
    const tag2 = new THREE.Mesh(
      new THREE.BoxGeometry(0.34, 0.15, 0.015),
      new THREE.MeshStandardMaterial({ map: tagTex2, roughness: 0.75 })
    );
    tag2.rotation.x = -0.45;
    tag2.userData.fx = f.userData.fx;
    tag2.userData.fz = 0.78;
    tag2.userData.isTag = true;
    gStrata.add(tag2);
    fossil3d.push(tag2);
  }
  for (let i = 0; i < FOSSIL_N; i++) {
    const sp = addSprite(gStrata, '🐚', 0, 0, 0, { fontSize: 44, color: '#ffffff', scale: 0.006 });
    fossilSprites.push(sp);
  }
  addSprite(gStrata, '海洋沉积（数亿年前）', 0, -0.5, -1.2, { fontSize: 24, color: '#cfe4ff' }).name = 'fo1';
  addSprite(gStrata, '抬升挤压 → 高山', 0, 2.0, 0, { fontSize: 28, color: '#ffcf9a' }).name = 'fo2';
  const upArrow = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(3.6, -0.6, 0), 1.6, 0xff8c42, 0.22, 0.13);
  upArrow.name = 'foArrow';
  gStrata.add(upArrow);
  /* 坡面碎石：褶皱山脊两侧滚落的风化碎屑（实例化二十面体，大小随高度衰减） */
  const scree = new THREE.InstancedMesh(
    new THREE.IcosahedronGeometry(0.05),
    matStd(0x8c8072, { roughness: 0.96 }), 22
  );
  for (let i = 0; i < 22; i++) {
    const x = -3.6 + Math.random() * 7.2;
    const yTop = fold(x) * strataState.t;
    const y = Math.max(-1.6, yTop - 0.16 - Math.random() * 0.3);
    _q.setFromEuler(new THREE.Euler(Math.random() * 3, Math.random() * 3, Math.random() * 3));
    const s = 0.5 + Math.random() * 0.8;
    _m4.compose(new THREE.Vector3(x, y, 1.1 + Math.random() * 0.5), _q, new THREE.Vector3(s, s, s));
    scree.setMatrixAt(i, _m4);
  }
  scree.name = 'strataScree';
  gStrata.add(scree);
}

/* 地层层序尺（章 2）：竖立的地层柱状图例，四色段对应主场景四个岩层，顶端游标随滑杆抬升 */
const gColumn = new THREE.Group();
let columnCursor = null;
{
  const defs = [
    { h: 0.62, tex: rockTexes.sandstone, tag: '砂岩' },
    { h: 0.55, tex: rockTexes.shale, tag: '页岩' },
    { h: 0.66, tex: rockTexes.limestone, tag: '灰岩' },
    { h: 0.5, tex: rockTexes.mudstone, tag: '泥岩' },
  ];
  let y0 = 0;
  for (const [i, d] of defs.entries()) {
    const seg = new THREE.Mesh(
      new THREE.BoxGeometry(0.34, d.h, 0.2),
      new THREE.MeshStandardMaterial({ map: d.tex, color: 0xa8a296, roughness: 0.95 })
    );
    seg.position.y = y0 + d.h / 2;
    seg.rotation.y = 0.3;
    gColumn.add(seg);
    /* 段间界线（薄膜黄铜条） */
    if (i > 0) {
      const lip = new THREE.Mesh(new THREE.BoxGeometry(0.37, 0.012, 0.22), D_MATS.brass);
      lip.position.y = y0;
      lip.rotation.y = 0.3;
      gColumn.add(lip);
    }
    y0 += d.h;
  }
  /* 游标：黄铜滑环 + 小旗，帧循环里跟随挤压抬升进度在柱身上滑动 */
  columnCursor = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.018, 8, 26), D_MATS.brass);
  ring.rotation.x = Math.PI / 2;
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.1), new THREE.MeshBasicMaterial({ color: 0xff8c42, side: THREE.DoubleSide }));
  flag.position.set(0.2, 0.04, 0);
  columnCursor.add(ring, flag);
  gColumn.add(columnCursor);
  /* 底座 */
  const plinth = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 0.1, 0.4),
    new THREE.MeshStandardMaterial({ color: 0x5e5248, roughness: 0.9 })
  );
  plinth.position.y = -0.05;
  gColumn.add(plinth);
  gColumn.position.set(-3.4, -1.78, 1.5);
  gColumn.rotation.y = 0.55;
  gStrata.add(gColumn);
  addContactShadow(gStrata, 0.9, 0.7, -1.77, 0.6).position.set(-3.4, -1.77, 1.5);
  /* 地质锤与放大镜（野外三件套之二）：木柄钢头锤 + 黄铜柄放大镜，搁在主场景底座前沿 */
  const hammer = new THREE.Group();
  const hshaft = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.038, 0.5, 10), new THREE.MeshStandardMaterial({ map: makeWoodTexture({ base: '#8a6440', dark: '#66482c', light: '#a8825a', streaks: 40, seed: 51 }), roughness: 0.6 }));
  const hhead = new THREE.Group();
  const face = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.062, 0.09, 14), D_MATS.steel);
  face.rotation.z = Math.PI / 2;
  const pick = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.22, 10), D_MATS.steel);
  pick.rotation.z = Math.PI / 2;
  pick.position.x = 0.14;
  hhead.add(face, pick);
  hhead.position.y = 0.26;
  hammer.add(hshaft, hhead);
  hammer.rotation.z = 1.35;
  hammer.rotation.x = 0.2;
  hammer.position.set(-1.6, -1.72, 1.62);
  gStrata.add(hammer);
  const lens2 = new THREE.Group();
  const lrim = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.012, 8, 24), D_MATS.brass);
  const llens = new THREE.Mesh(new THREE.CircleGeometry(0.062, 22), matGlass(0xd4e6ec, { transmission: 0.9, thickness: 0.12 }));
  lens2.add(lrim, llens);
  lens2.rotation.x = -1.2;
  lens2.position.set(-0.9, -1.74, 1.66);
  gStrata.add(lens2);
}

/* 标本盒（章 2 叙事道具）：木框四格，砂岩/页岩/石灰岩/玄武岩四块带采集卡，菊石实体在盒外展台 */
const gCase = new THREE.Group();
gCase.visible = false;
scene.add(gCase);
{
  D_MATS.wood = makeWoodTexture({ base: '#7c5533', dark: '#5a3a20', light: '#9a7047', streaks: 80, bands: 6, planks: 3, seed: 21 });
  D_MATS.woodDark = makeWoodTexture({ base: '#5e4228', dark: '#42301c', light: '#7c5a38', streaks: 50, seed: 22 });
  const boxMat = new THREE.MeshStandardMaterial({ map: D_MATS.wood, roughness: 0.85 });
  const boxMatDark = new THREE.MeshStandardMaterial({ map: D_MATS.woodDark, roughness: 0.88 });
  const caseGrp = new THREE.Group();
  const W = 2.3, Hh = 0.62, Dd = 1.7, th = 0.09;
  const bottom = new THREE.Mesh(new THREE.BoxGeometry(W, 0.1, Dd), boxMat);
  bottom.position.y = 0.05;
  const back = new THREE.Mesh(new THREE.BoxGeometry(W, Hh, th), boxMatDark);
  back.position.set(0, Hh / 2 + 0.05, -Dd / 2 + th / 2);
  caseGrp.add(bottom, back);
  for (const s of [-1, 1]) {
    const side = new THREE.Mesh(new THREE.BoxGeometry(th, Hh, Dd), boxMat);
    side.position.set(s * (W / 2 - th / 2), Hh / 2 + 0.05, 0);
    caseGrp.add(side);
  }
  for (const zz of [-Dd / 4, Dd / 4]) {
    const div = new THREE.Mesh(new THREE.BoxGeometry(W - th * 2, Hh - 0.06, 0.05), boxMatDark);
    div.position.set(0, Hh / 2 + 0.05, zz);
    caseGrp.add(div);
  }
  const midDiv = new THREE.Mesh(new THREE.BoxGeometry(0.05, Hh - 0.06, Dd - th * 2), boxMatDark);
  midDiv.position.set(0, Hh / 2 + 0.05, 0);
  caseGrp.add(midDiv);
  /* 盖子斜靠背后（打开态） */
  const lid = new THREE.Mesh(new THREE.BoxGeometry(W, 0.06, Dd), boxMat);
  lid.position.set(0.1, Hh + 0.28, -Dd / 2 - 0.28);
  lid.rotation.x = -1.15;
  caseGrp.add(lid);
  /* 四格岩石标本：各自岩性纹理 + 微斜放 */
  const SPEC = [
    { kind: 'sandstone', tex: rockTexes.sandstone, size: [0.62, 0.3, 0.5], tilt: 0.12 },
    { kind: 'shale', tex: rockTexes.shale, size: [0.6, 0.16, 0.46], tilt: -0.05 },
    { kind: 'limestone', tex: rockTexes.limestone, size: [0.58, 0.3, 0.48], tilt: 0.2 },
    { kind: 'basalt', tex: makeRockTexture('basalt', 44), size: [0.5, 0.3, 0.52], tilt: -0.16 },
  ];
  SPEC.forEach((sp, i) => {
    const cx = (i % 2 - 0.5) * (W / 2) * 0.92;
    const cz = ((i / 2 | 0) - 0.5) * (Dd / 2) * 0.9;
    const rock = new THREE.Mesh(new THREE.BoxGeometry(...sp.size), new THREE.MeshStandardMaterial({ map: sp.tex, roughness: 0.94 }));
    rock.position.set(cx, 0.1 + sp.size[1] / 2, cz);
    rock.rotation.z = sp.tilt;
    rock.rotation.y = i * 0.4;
    caseGrp.add(rock);
  });
  /* 采集卡贴前立面 */
  const CARDS = [
    ['砂岩', '滨海相沉积|粒度 中|层理清晰', 'D-01'],
    ['页岩', '深水静水沉积|页理发育|可剥片', 'D-02'],
    ['石灰岩', '浅海相生物碎屑|含菊石·三叶虫', 'D-03'],
    ['玄武岩', '喷出岩·气孔构造|海底枕状', 'D-04'],
  ];
  CARDS.forEach(([name, meta, no], i) => {
    const tex = makeSpecimenCard(name, meta, no, i === 2 ? '#4a6c8a' : '#8a4030');
    const card = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.46), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8 }));
    const cx = (i % 2 - 0.5) * (W / 2) * 0.92;
    const cz = ((i / 2 | 0) - 0.5) * (Dd / 2) * 0.9 + Dd / 2 - 0.13;
    card.position.set(cx - 0.02, 0.34, cz);
    card.rotation.x = -0.5;
    caseGrp.add(card);
  });
  caseGrp.position.set(3.6, -1.62, -2.4);
  caseGrp.rotation.y = 0.5;
  gCase.add(caseGrp);
  /* 展台菊石：独立展示件，斜座 + 黄铜托 */
  const ammStand = new THREE.Group();
  const amm = buildAmmonite(1.5);
  amm.rotation.set(-1.2, 0, 0.4);
  amm.position.y = 0.36;
  const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.1, 20), D_MATS.brass);
  stand.position.y = 0.05;
  ammStand.add(stand, amm);
  ammStand.position.set(2.1, -1.62, -2.9);
  gCase.add(ammStand);
  addContactShadow(gCase, 2.8, 2.2, -1.6, 0.7).position.set(2.9, -1.6, -2.6);
}

function updateStrata() {
  const t = strataState.t;
  for (const L of strataLayers) {
    const pos = L.mesh.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      pos.setY(i, L.base + L.fold(x) * t * L.amp);
    }
    pos.needsUpdate = true;
    L.mesh.geometry.computeVertexNormals();
  }
  // 化石贴在石灰岩面上（emoji 标记 + 真 3D 标本同高）
  fossilSprites.forEach((sp, i) => {
    const x = -3.2 + i * 2.1;
    const y = -0.86 + strataLayers[2].fold(x) * t * strataLayers[2].amp + 0.24;
    sp.position.set(x, y, 0.35);
  });
  fossil3d.forEach((f) => {
    const x = f.userData.fx;
    const y = -0.62 + strataLayers[2].fold(x) * t * strataLayers[2].amp;
    f.position.set(x, f.userData.isTag ? y - 0.12 : y, f.userData.fz);
  });
  const seam = gStrata.getObjectByName('strataSeam');
  if (seam) {
    const pos = seam.geometry.attributes.position;
    const layers0 = strataLayers[0];
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      pos.setY(i, layers0.base + layers0.fold(x) * t * layers0.amp + 0.36);
    }
    pos.needsUpdate = true;
  }
  const a = gStrata.getObjectByName('foArrow');
  if (a) a.position.set(3.6, -0.6 + t * 1.1, 0);
  /* 层序尺游标随挤压抬升进度滑动 */
  if (columnCursor) columnCursor.position.y = 0.3 + t * 1.7;
  /* 数据读数：化石所在高度（垂直比例夸大 400 倍换算）与抬升进度实时联动 */
  const hy = -0.62 + strataLayers[2].fold(fossil3d[0]?.userData.fx ?? 0) * t * strataLayers[2].amp;
  hud.set('a', `化石所在高度 ${Math.round(hy * 400)} m`);
  hud.set('b', `褶皱抬升 ${Math.round(t * 100)}%`);
}

/* ---------------- 章 3：海峡下的古河道 ---------------- */

const straitState = { level: 0 };   // 米
{
  const geo = new THREE.PlaneGeometry(10, 4.6, 110, 50).rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    // 西侧大陆架 — 海峡 — 台湾岛
    const h = x < -1.2
      ? 1.1 * Math.exp(-((x + 4.6) ** 2) / 6) + 0.16
      : x > 1.6
        ? 0.95 * Math.exp(-((x - 3.4) ** 2) / 1.8) + 0.1
        : -0.28 + 0.05 * Math.sin(x * 3);
    pos.setY(i, h);
  }
  geo.computeVertexNormals();
  const land = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x86a860, roughness: 0.93 }));
  land.position.y = 0.55;
  gStrait.add(land);
  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(10.4, 5).rotateX(-Math.PI / 2),
    new THREE.MeshPhysicalMaterial({
      color: 0x2f7fc4, transparent: true, opacity: 0.6, roughness: 0.15,
      clearcoat: 0.5, depthWrite: false, emissive: 0x0a2033, emissiveIntensity: 0.45,
    })
  );
  water.position.y = 0.55;
  water.name = 'straitWater';
  gStrait.add(water);
  // 古河道（埋藏河谷）：CatmullRom 曲线放样的弯曲河谷带（宽窄随程变化），深色河床相沉积
  const channelTex = (() => {
    const cv = document.createElement('canvas');
    cv.width = 128; cv.height = 256;
    const c = cv.getContext('2d');
    c.fillStyle = '#4a3a26';
    c.fillRect(0, 0, 128, 256);
    /* 砾石与砂纹：河床相的双凸透镜体 */
    for (let i = 0; i < 160; i++) {
      c.fillStyle = Math.random() > 0.5 ? 'rgba(200,180,140,0.35)' : 'rgba(30,22,12,0.5)';
      c.beginPath();
      c.ellipse(Math.random() * 128, Math.random() * 256, 1.5 + Math.random() * 4, 1 + Math.random() * 2.6, Math.random() * 3, 0, Math.PI * 2);
      c.fill();
    }
    for (let y = 0; y < 256; y += 18) {
      c.strokeStyle = 'rgba(160,140,100,0.22)';
      c.beginPath();
      for (let x = 0; x <= 128; x += 8) {
        const yy = y + Math.sin(x / 22) * 3;
        x === 0 ? c.moveTo(x, yy) : c.lineTo(x, yy);
      }
      c.stroke();
    }
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  })();
  const channel = loftRibbon(
    [[-4.4, -0.6], [-3.0, 0.2], [-1.8, -0.35], [-0.5, 0.15], [0.6, -0.3], [1.7, 0.1], [2.6, -0.2]]
      .map(([x, z]) => new THREE.Vector3(x, 0, z)),
    (t) => 0.16 + 0.14 * Math.sin(t * Math.PI),
    new THREE.MeshStandardMaterial({ map: channelTex, roughness: 1 }),
    { segs: 90, lift: 0.42, vScale: 3 }
  );
  channel.name = 'paleoChannel';
  gStrait.add(channel);
  /* 半埋沉船残骸：船底肋骨列（弯曲箱骨弧线排布）+ 断桅，搁在河湾外侧泥滩
   * ——「渔网常捞起陆生哺乳动物化石」的水下叙事锚点 */
  const wreck = new THREE.Group();
  const ribMat = matStd(0x5a4a34, { roughness: 0.95 });
  for (let i = 0; i < 7; i++) {
    const tt = i / 6;
    const rib = new THREE.Mesh(new THREE.TorusGeometry(0.34 - Math.abs(tt - 0.5) * 0.22, 0.018, 8, 20, Math.PI * 0.9), ribMat);
    rib.rotation.set(Math.PI / 2, 0, Math.PI / 2 + 0.15);
    rib.position.set(-0.62 + i * 0.2, -0.12, 0);
    rib.scale.z = 0.75;
    wreck.add(rib);
  }
  const keel = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.05, 0.05), ribMat);
  keel.position.y = -0.12;
  wreck.add(keel);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.03, 0.85, 10), ribMat);
  mast.position.set(0.1, 0.28, 0.12);
  mast.rotation.z = 1.25;
  wreck.add(mast);
  wreck.position.set(-2.2, 0.5, 0.75);
  wreck.rotation.y = 0.5;
  wreck.name = 'wreck';
  gStrait.add(wreck);
  // 河床砾石：沿河道散布的小卵石实例
  const gravels = new THREE.InstancedMesh(
    new THREE.IcosahedronGeometry(0.035),
    matStd(0xb8a884, { roughness: 0.9 }), 46
  );
  {
    const curve = channel.geometry.curve;
    for (let i = 0; i < 46; i++) {
      const t = (i + Math.random() * 0.7) / 46;
      const p = curve.getPointAt(clamp(t, 0, 1));
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.random() * 3, Math.random() * 3, Math.random() * 3));
      const s = 0.6 + Math.random() * 0.9;
      _m4.compose(new THREE.Vector3(p.x + (Math.random() - 0.5) * 0.3, 0.47, p.z + (Math.random() - 0.5) * 0.3), q, new THREE.Vector3(s, s, s));
      gravels.setMatrixAt(i, _m4);
    }
  }
  gravels.name = 'paleoGravel';
  gravels.visible = false;
  gStrait.add(gravels);
  /* 剖面展示板：两块带黄铜支脚的沉积层序样板立在两岸（层理 CanvasTexture），替身探槽 */
  const trenchTex = (() => {
    const cv = document.createElement('canvas');
    cv.width = 256; cv.height = 320;
    const c = cv.getContext('2d');
    const BANDS = [['#c9b289', 64], ['#9aa878', 58], ['#bcc8ca', 74], ['#8c8792', 62], ['#4a5a6e', 62]];
    let y = 0;
    for (const [col, h] of BANDS) {
      c.fillStyle = col;
      c.fillRect(0, y, 256, h);
      c.fillStyle = 'rgba(40,32,22,0.35)';
      c.fillRect(0, y + h - 5, 256, 5);
      y += h;
    }
    for (let i = 0; i < 900; i++) {
      c.fillStyle = Math.random() > 0.5 ? 'rgba(30,24,16,0.14)' : 'rgba(240,230,200,0.1)';
      c.fillRect(Math.random() * 256, Math.random() * 320, 2, 2);
    }
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  })();
  const panelMat = new THREE.MeshStandardMaterial({ map: trenchTex, color: 0x9a948a, roughness: 0.95 });
  for (const [px, py, pz, ry] of [[-3.6, 2.3, 1.6, 0.8], [2.2, 1.5, -1.6, -0.6]]) {
    const panelGrp = new THREE.Group();
    const slab = new THREE.Mesh(new THREE.BoxGeometry(1.15, 1.3, 0.1), panelMat);
    slab.position.y = 0.72;
    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.23, 1.38, 0.06), D_MATS.brassDark);
    frame.position.set(0, 0.72, -0.05);
    panelGrp.add(frame, slab);
    for (const s of [-1, 1]) {
      const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, 0.14, 10), D_MATS.brassDark);
      foot.position.set(s * 0.45, 0.07, 0.02);
      panelGrp.add(foot);
    }
    panelGrp.position.set(px, py - 0.72, pz);
    panelGrp.rotation.y = ry;
    gStrait.add(panelGrp);
    addContactShadow(gStrait, 1.6, 1.0, py + 0.01, 0.5).position.set(px, py + 0.01, pz);
  }
  /* 渔排：双浮筒 + 网箱框 + 看护小屋，漂在海峡南缘（帧循环随浪轻晃） */
  const raft = new THREE.Group();
  const raftMat = matStd(0x7a6a4c, { roughness: 0.85 });
  for (const s of [-1, 1]) {
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.3, 10).rotateZ(Math.PI / 2), raftMat);
    tube.position.set(0, 0, s * 0.42);
    raft.add(tube);
  }
  for (const s of [-1, 1]) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 1.0), raftMat);
    bar.position.set(s * 0.6, 0.05, 0);
    raft.add(bar);
  }
  const cage = new THREE.Mesh(
    new THREE.BoxGeometry(0.55, 0.3, 0.7),
    new THREE.MeshStandardMaterial({ color: 0x2e4a58, transparent: true, opacity: 0.5, roughness: 0.7, wireframe: true })
  );
  cage.position.y = 0.02;
  raft.add(cage);
  const hut = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.26, 0.3), new THREE.MeshStandardMaterial({ map: D_MATS.wood || null, color: D_MATS.wood ? 0xffffff : 0x9a7047, roughness: 0.9 }));
  hut.position.set(-0.3, 0.22, 0);
  raft.add(hut);
  const hutRoof = new THREE.Mesh(new THREE.ConeGeometry(0.27, 0.16, 4), matStd(0x554432, { roughness: 0.9 }));
  hutRoof.position.set(-0.3, 0.42, 0);
  hutRoof.rotation.y = Math.PI / 4;
  raft.add(hutRoof);
  raft.position.set(-1.2, 0.62, 1.9);
  raft.rotation.y = 0.7;
  raft.name = 'straitRaft';
  gStrait.add(raft);
  /* 灯塔：车削塔身（白红环带贴图）+ 灯室玻璃 + 旋转光锥 + 基座，立于台湾岛南端 */
  const lighthouse = new THREE.Group();
  const towerProfile = [
    [0.0, 0], [0.34, 0.02], [0.3, 0.3], [0.24, 0.9], [0.19, 1.5], [0.17, 1.9],
    [0.17, 2.02], [0.22, 2.06], [0.2, 2.12], [0.14, 2.16], [0.0, 2.18],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  const tower = new THREE.Mesh(
    new THREE.LatheGeometry(towerProfile, 26),
    new THREE.MeshStandardMaterial({ map: makeLighthouseTexture(), roughness: 0.55, metalness: 0.04 })
  );
  lighthouse.add(tower);
  const lampRoom = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.16, 14), matGlass(0xdfeef2, { transmission: 0.86 }));
  lampRoom.position.y = 2.24;
  lighthouse.add(lampRoom);
  const lampCore = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 10), matGlow(0xffdf9a, 1.4));
  lampCore.position.y = 2.24;
  lighthouse.add(lampCore);
  const roofCap = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.12, 14), D_MATS.brassDark);
  roofCap.position.y = 2.38;
  lighthouse.add(roofCap);
  const beam = new THREE.Mesh(
    new THREE.ConeGeometry(0.34, 2.6, 14, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xffe6b0, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false })
  );
  beam.rotation.z = Math.PI / 2;
  beam.position.set(1.3, 2.24, 0);
  const beamPivot = new THREE.Group();
  beamPivot.position.y = 0;
  beamPivot.add(beam);
  beamPivot.name = 'lhBeam';
  lighthouse.add(beamPivot);
  lighthouse.position.set(4.0, 1.42, -1.7);
  lighthouse.rotation.y = -0.6;
  lighthouse.name = 'straitLighthouse';
  gStrait.add(lighthouse);
  addContactShadow(gStrait, 1.2, 1.2, 1.43, 0.6).position.set(4.0, 1.43, -1.7);
  addSprite(gStrait, '大陆（福建沿岸）', -3.6, 2.3, 0, { fontSize: 26, color: '#d8ffc8' }).name = 'st1';
  addSprite(gStrait, '台湾岛', 3.4, 2.1, 0, { fontSize: 26, color: '#d8ffc8' }).name = 'st2';
  addSprite(gStrait, '台湾海峡', 0, 1.55, 0.6, { fontSize: 26, color: '#9fd8ff' }).name = 'st3';
  addSprite(gStrait, '古河道（河谷沉积）', -0.1, 0.95, 0.9, { fontSize: 24, color: '#ffd9a0' }).name = 'st4';
}

/* 深潜器（章 3）：小型科考潜艇沿海峡水下巡航——耐压舱球体 + 玻璃舷窗 + 尾舵 +
 * 螺旋桨 + 顶部舱盖，头灯（SpotLight）扫过海床照亮埋藏古河道，帧循环沿闭环路径巡航。 */
const sub = new THREE.Group();
let subLight = null;
{
  const hullMat = matCoat(0xc8a03e, { metalness: 0.55, roughness: 0.3, clearcoat: 0.8 });  // 科考黄涂装
  const hull = new THREE.Mesh(new THREE.SphereGeometry(0.16, 20, 14), hullMat);
  const stern = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.26, 14), hullMat);
  stern.rotation.z = -Math.PI / 2;
  stern.position.x = -0.24;
  const hatch = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.05, 12), D_MATS.brassDark);
  hatch.position.y = 0.15;
  const port = new THREE.Mesh(new THREE.SphereGeometry(0.055, 14, 10), matGlass(0xbfe0ea, { transmission: 0.9, thickness: 0.1 }));
  port.position.set(0.08, 0.02, 0.13);
  const port2 = port.clone();
  port2.position.set(0.08, 0.02, -0.13);
  for (const s of [-1, 1]) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.02, 0.09), hullMat);
    fin.position.set(-0.3, s * 0.09, 0);
    fin.rotation.x = s * 0.5;
    sub.add(fin);
    const finH = fin.clone();
    finH.position.set(-0.3, 0, s * 0.1);
    finH.rotation.x = s * Math.PI / 2;
    finH.rotation.z = 0;
    sub.add(finH);
  }
  const prop = new THREE.Group();
  for (let b = 0; b < 4; b++) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.05, 0.02), D_MATS.brass);
    blade.rotation.x = (b / 4) * Math.PI * 2;
    blade.position.x = -0.4;
    prop.add(blade);
  }
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.08, 8), D_MATS.steel);
  shaft.rotation.z = Math.PI / 2;
  shaft.position.x = -0.38;
  prop.add(shaft);
  sub.add(hull, stern, hatch, port, port2, prop);
  /* 头灯：聚光照向艇前方海床（target 动态跟随） */
  subLight = new THREE.SpotLight(0xbfe0ff, 2.2, 5, 0.55, 0.65, 1.4);
  subLight.position.set(0.16, 0, 0);
  const lightTarget = new THREE.Object3D();
  lightTarget.position.set(1.2, -0.3, 0);
  sub.add(subLight, lightTarget);
  subLight.target = lightTarget;
  /* 巡航路径：海峡湾内闭环（CatmullRom），getPointAt 取点、切线定向 */
  sub.userData.path = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-2.6, 0.35, 0.9), new THREE.Vector3(-1.0, 0.3, 1.3),
    new THREE.Vector3(0.8, 0.32, 0.8), new THREE.Vector3(1.8, 0.36, -0.2),
    new THREE.Vector3(0.6, 0.3, -1.1), new THREE.Vector3(-1.4, 0.34, -0.8),
    new THREE.Vector3(-2.4, 0.36, 0.2),
  ]);
  sub.userData.prop = prop;
  sub.position.copy(sub.userData.path.getPointAt(0));
  gStrait.add(sub);
}
/* 海底岩芯架（章 3 道具）：三根采样柱立在黄铜架上，管内沉积层序（砂/粉砂/河床砾）
 * 用分段圆柱拼接，中间那根含「古河道层」色带——岩芯正是识别埋藏河谷的直接证据。 */
const gCores = new THREE.Group();
{
  const rackMat = D_MATS.brassDark;
  const shelf = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.07, 0.5), new THREE.MeshStandardMaterial({ map: makeWoodTexture({ base: '#6a4c30', dark: '#4c341e', light: '#86613e', streaks: 44, seed: 61 }), roughness: 0.7 }));
  shelf.position.y = 0.035;
  gCores.add(shelf);
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.034, 0.1, 10), rackMat);
    leg.position.set(sx * 0.66, 0.05, sz * 0.2);
    gCores.add(leg);
  }
  /* 三根岩芯：芯管玻璃罩 + 内芯分层圆柱 */
  const CORE_DEFS = [
    { bands: [['#c9b289', 0.3], ['#9aa878', 0.26], ['#8c8792', 0.24]], label: '浅滩芯' },
    { bands: [['#c9b289', 0.22], ['#4a3a26', 0.18], ['#b8a884', 0.14], ['#8c8792', 0.26]], label: '河道芯', river: true },
    { bands: [['#9aa878', 0.3], ['#bcc8ca', 0.28], ['#4a5a6e', 0.22]], label: '深槽芯' },
  ];
  CORE_DEFS.forEach((d, i) => {
    const x = (i - 1) * 0.5;
    let y = 0.07;
    for (const [col, h] of d.bands) {
      const seg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.055, 0.055, h, 14),
        new THREE.MeshStandardMaterial({ color: new THREE.Color(col), roughness: 0.9 })
      );
      y += h / 2;
      seg.position.set(x, y, 0);
      gCores.add(seg);
      y += h / 2;
    }
    const tube = new THREE.Mesh(
      new THREE.CylinderGeometry(0.075, 0.075, y + 0.06, 16, 1, true),
      matGlass(0xd8e6ea, { transmission: 0.85, thickness: 0.1, opacity: 0.5 })
    );
    tube.position.set(x, (y + 0.06) / 2 + 0.03, 0);
    gCores.add(tube);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.03, 16), rackMat);
    cap.position.set(x, y + 0.1, 0);
    gCores.add(cap);
    if (d.river) {
      /* 河道芯顶小旗：标出含古河道沉积的那根 */
      const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.09), new THREE.MeshBasicMaterial({ color: 0xffd166, side: THREE.DoubleSide }));
      flag.position.set(x, y + 0.22, 0);
      gCores.add(flag);
    }
  });
  gCores.position.set(2.9, 1.44, 1.4);
  gCores.rotation.y = -0.85;
  gStrait.add(gCores);
  addContactShadow(gStrait, 1.8, 0.9, 1.45, 0.6).position.set(2.9, 1.45, 1.4);
}

/* ---------------- 世界地图（章 4/5/6/7 共用） ---------------- */

const CONT = {
  namerica: [[-166, 66], [-140, 69], [-122, 69], [-100, 71], [-84, 71], [-70, 62], [-56, 51], [-66, 44], [-76, 35], [-81, 26], [-90, 18], [-97, 16], [-105, 21], [-117, 32], [-124, 40], [-124, 48], [-140, 59], [-158, 57]],
  samerica: [[-79, 8], [-70, 11], [-60, 8], [-50, 0], [-35, -6], [-38, -15], [-48, -26], [-56, -35], [-65, -43], [-70, -54], [-75, -47], [-72, -38], [-70, -28], [-70, -18], [-77, -8], [-80, -2]],
  africa: [[-10, 32], [0, 36], [10, 37], [20, 32], [32, 31], [35, 26], [43, 12], [51, 11], [40, -2], [40, -12], [34, -21], [30, -30], [24, -34], [17, -33], [12, -18], [8, -2], [-8, 4], [-17, 12], [-17, 22]],
  eurasia: [[-9, 37], [-1, 44], [-6, 49], [5, 54], [5, 59], [12, 65], [24, 70], [45, 68], [70, 72], [100, 76], [130, 72], [158, 69], [178, 65], [160, 58], [142, 52], [130, 42], [121, 30], [112, 21], [105, 9], [97, 7], [92, 17], [88, 22], [80, 14], [76, 9], [70, 22], [66, 25], [57, 25], [48, 14], [43, 12], [35, 30], [26, 38], [16, 40], [10, 44], [3, 42]],
  india: [[68, 24], [72, 21], [76, 9], [80, 8], [88, 22], [80, 26], [72, 27]],
  australia: [[114, -22], [122, -18], [131, -12], [137, -13], [142, -11], [147, -16], [151, -24], [152, -29], [149, -36], [144, -38], [138, -35], [132, -32], [124, -33], [115, -34], [113, -26]],
  antarctica: [[-180, -68], [-120, -72], [-60, -63], [0, -69], [60, -66], [120, -66], [180, -70], [180, -88], [-180, -88]],
  greenland: [[-52, 60], [-42, 62], [-30, 68], [-22, 72], [-30, 80], [-45, 82], [-58, 76], [-60, 66]],
};

const LL2X = (lon) => lon / 36;         // -180..180 → -5..5
const LL2Z = (lat) => -lat / 24;        // 北在上

function landMeshFrom(pts, color, depth = 0.1) {
  const shape = new THREE.Shape(pts.map(([lo, la]) => new THREE.Vector2(LL2X(lo), la / 24)));
  const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
  geo.rotateX(-Math.PI / 2);       // shape 的 y(lat) → -z（北朝远处）
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
    color, roughness: 0.9, metalness: 0.05,
  }));
  return m;
}

/* 大陆架裙边：大陆轮廓相对质心外扩后的薄挤出，浅海色，表示水面下的大陆架 */
function shelfMeshFrom(pts, depth = 0.05, grow = 1.09) {
  let cx = 0, cy = 0;
  for (const [lo, la] of pts) { cx += LL2X(lo); cy += la / 24; }
  cx /= pts.length; cy /= pts.length;
  const shape = new THREE.Shape(pts.map(([lo, la]) => {
    const x = LL2X(lo), y = la / 24;
    return new THREE.Vector2(cx + (x - cx) * grow, cy + (y - cy) * grow);
  }));
  const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
  geo.rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
    color: 0x3f7aa8, roughness: 0.72, metalness: 0.02, transparent: true, opacity: 0.85,
  }));
  m.position.y = -depth + 0.015;
  return m;
}

// 大陆网格：position 组（泛大陆动画）+ 陆架裙边跟随大陆平移
const contMeshes = {};
const CONT_COLORS = { namerica: 0x86b062, samerica: 0x8ab06a, africa: 0xb09a58, eurasia: 0x9aa868, india: 0xc0a860, australia: 0xc8a860, antarctica: 0xe4e8ec, greenland: 0xdce4e8 };
for (const key of Object.keys(CONT)) {
  const m = landMeshFrom(CONT[key], CONT_COLORS[key]);
  const shelf = shelfMeshFrom(CONT[key]);
  shelf.name = key + 'Shelf';
  m.add(shelf);
  m.name = key;
  contMeshes[key] = m;
  gMap.add(m);
}

// 泛大陆关键帧（每个大陆在不同年代的经纬偏移， Ma: [dLon, dLat]）
const PANGAEA_T = [250, 180, 120, 60, 0];
const PANGAEA_OFF = {
  namerica: [[52, 22], [38, 16], [24, 9], [10, 4], [0, 0]],
  greenland: [[40, 16], [30, 12], [18, 7], [8, 3], [0, 0]],
  samerica: [[48, 8], [36, 6], [21, 3], [9, 1], [0, 0]],
  africa: [[10, 6], [8, 4], [5, 2], [2, 1], [0, 0]],
  eurasia: [[-13, 7], [-10, 5], [-6, 3], [-2, 1], [0, 0]],
  india: [[30, -6], [21, -8], [12, -10], [4, -6], [0, 0]],
  australia: [[28, 0], [22, -3], [15, -6], [7, -4], [0, 0]],
  antarctica: [[6, 8], [4, 5], [3, 2], [1, 0], [0, 0]],
};
function pangaeaAt(ma) {
  // ma: 距今年代（250 → 0），插值偏移
  let i = 0;
  while (i < PANGAEA_T.length - 1 && ma < PANGAEA_T[i + 1]) i++;
  const t0 = PANGAEA_T[i], t1 = PANGAEA_T[Math.min(i + 1, PANGAEA_T.length - 1)];
  const k = t1 === t0 ? 0 : clamp((t0 - ma) / (t0 - t1), 0, 1);
  const ease = k * k * (3 - 2 * k);
  for (const key of Object.keys(PANGAEA_OFF)) {
    const a = PANGAEA_OFF[key][i], b = PANGAEA_OFF[key][Math.min(i + 1, PANGAEA_T.length - 1)];
    const dLon = a[0] + (b[0] - a[0]) * ease;
    const dLat = a[1] + (b[1] - a[1]) * ease;
    contMeshes[key].position.set(LL2X(dLon) * 0, 0, 0);
    contMeshes[key].userData.off = [dLon, dLat];
    const base = contMeshes[key].userData.base || [0, 0];
    contMeshes[key].position.x = LL2X(base[0] + dLon) - LL2X(base[0]);
    contMeshes[key].position.z = -(base[1] + dLat) / 24 + base[1] / 24;
  }
  /* 劳亚/冈瓦纳罩体跟随各自大陆群质心（罩体只在 2.4~1.8 亿年前区间渐显；开关在泛大陆章） */
  if (superDomes) {
    const vis = ma > 170 ? clamp((ma - 170) / 30, 0, 1) : clamp((240 - ma) / 30, 0, 1);
    superDomes.visible = state.superOn === true && vis > 0.05;
    superDomes.children.forEach((d) => {
      if (!d.isSprite) d.material.opacity = vis * 0.45;
      if (d.isSprite) d.material.opacity = vis;
    });
    let lx = 0, lz = 0, n = 0;
    for (const key of ['namerica', 'greenland', 'eurasia']) {
      const p = contMeshes[key].position;
      lx += p.x; lz += p.z; n++;
    }
    superDomes.children[0].position.set(lx / n, 0.16, lz / n);
    lx = 0; lz = 0; n = 0;
    for (const key of ['samerica', 'africa', 'india', 'australia', 'antarctica']) {
      const p = contMeshes[key].position;
      lx += p.x; lz += p.z; n++;
    }
    superDomes.children[1].position.set(lx / n, 0.16, lz / n);
    /* 特提斯海标注：钉在劳亚-冈瓦纳的开口带，随年代收窄、透明度渐隐 */
    const pN = superDomes.children[0].position, pS = superDomes.children[1].position;
    tethysSp.position.set((pN.x + pS.x) / 2 + 0.5, 0.5, (pN.z + pS.z) / 2 + 0.3);
    const fade = clamp((ma - 20) / 120, 0, 1);
    tethysSp.visible = fade > 0.05;
    tethysSp.material.opacity = fade;
  }
}

/* 劳亚古陆 / 冈瓦纳古陆：泛大陆分裂第一阶段的南北两半（半透明罩 + 名称浮标） */
let superDomes = null;
let tethysSp = null;
{
  const domeMat = (col) => new THREE.MeshStandardMaterial({
    color: col, transparent: true, opacity: 0.16, roughness: 0.55,
    emissive: 0x1a2632, emissiveIntensity: 0.5,
    side: THREE.DoubleSide, depthWrite: false,
  });
  const north = new THREE.Mesh(new THREE.SphereGeometry(0.98, 26, 14, 0, Math.PI * 2, 0, Math.PI / 2), domeMat(0x88b6e0));
  const south = new THREE.Mesh(new THREE.SphereGeometry(1.12, 26, 14, 0, Math.PI * 2, 0, Math.PI / 2), domeMat(0xd0a86a));
  north.scale.y = 0.55;
  south.scale.y = 0.55;
  north.position.set(-0.6, 0.16, -0.3);
  south.position.set(0.4, 0.16, 0.5);
  const gSuper = new THREE.Group();
  gSuper.add(north, south);
  const spN = addSprite(gSuper, '劳亚古陆（北）', 0, 1.35, 0, { fontSize: 26, color: '#bfe0ff', scale: 0.0042 });
  const spS = addSprite(gSuper, '冈瓦纳古陆（南）', 0, 1.5, 0, { fontSize: 26, color: '#ffd9a0', scale: 0.0042 });
  spN.position.set(0, 1.3, 0);
  spS.position.set(0, 1.45, 0);
  north.add(spN);
  south.add(spS);
  gSuper.visible = false;
  gMap.add(gSuper);
  superDomes = gSuper;
  /* 特提斯海浮标：劳亚与冈瓦纳之间的古海洋，随分裂推进被印度挤合收窄直至消失 */
  tethysSp = addSprite(gMap, '特提斯海', LL2X(60), 0.5, LL2Z(8), { fontSize: 24, color: '#9fd8ff', scale: 0.004 });
  tethysSp.visible = false;
}

// 板块边界（多段线）
const PLATES_LINES = [
  [[-165, 62], [-152, 58], [-148, 48], [-140, 38], [-125, 38], [-112, 28], [-100, 18], [-88, 10], [-80, 0], [-74, -16], [-72, -34], [-76, -50]],
  [[150, 58], [158, 52], [156, 45], [145, 42], [140, 36], [133, 34], [126, 28], [122, 22], [121, 15], [126, 6], [132, -4], [138, -16], [148, -42], [166, -52]],
  [[-12, 36], [2, 38], [14, 38], [26, 37], [38, 36], [50, 32], [62, 30], [72, 34], [84, 28], [94, 26], [100, 21]],
  [[-32, 68], [-30, 52], [-16, 40], [-13, 25], [-14, 8], [-16, -8], [-14, -24], [-10, -40], [-6, -52]],
  [[40, -8], [46, -22], [52, -38], [60, -50], [80, -56], [110, -58], [140, -58]],
];
function buildPlateLines(color) {
  const group = new THREE.Group();
  const tubeMats = [];
  for (const poly of PLATES_LINES) {
    const pts = poly.map(([lo, la]) => new THREE.Vector3(LL2X(lo), 0.14, LL2Z(la)));
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(pts),
      new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.35 })
    );
    group.add(line);
    /* 边界立体化：细发光管沿边界线放样，帧循环里呼吸脉动 */
    const tubeMat = matGlow(0xff5a3c, 0.9, { roughness: 0.45 });
    const tube = loftTube(pts, () => 0.014, tubeMat, { segs: poly.length * 10, radial: 8 });
    tube.userData.mat = tubeMat;
    group.add(tube);
    tubeMats.push(tubeMat);
  }
  group.userData.tubeMats = tubeMats;
  /* 运动方向箭头组：在代表性边界处给一对示意箭头（张开/相向），帮助读图 */
  const arrowMat = matGlow(0xffd166, 0.4, { roughness: 0.5 });
  function addArrow(lo, la, dirLon, dirLat) {
    const dir = new THREE.Vector3(dirLon, 0, dirLat).normalize();
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.15, 10), arrowMat);
    const base = new THREE.Vector3(LL2X(lo), 0.14, LL2Z(la));
    cone.position.copy(base).addScaledVector(dir, 0.08);
    cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    group.add(cone);
  }
  addArrow(-19, 0, -1, 0);  addArrow(-9, 0, 1, 0);          // 大西洋中脊：东西张开
  addArrow(-25, -25, -0.8, -0.4); addArrow(-3, -25, 0.8, -0.4); // 南大西洋
  addArrow(126, 34, 0.9, 0.3);  addArrow(133, 28, -0.9, -0.3);  // 日本海沟：相向
  addArrow(88, 26, 0.4, -0.9);  addArrow(70, 20, -0.4, 0.9);    // 喜马拉雅：相向
  addArrow(-86, 12, 0, 1);      addArrow(-86, 0, 0, -1);        // 中美海沟
  return group;
}
const plateLines = buildPlateLines(0xff5a3c);
plateLines.visible = false;
gMap.add(plateLines);

// 板块名称标注（sprite + 黄铜立杆，杆随 sprite 显隐）
const plateLabelDefs = [
  ['亚欧板块', 80, 48], ['太平洋板块', -145, 5], ['美洲板块', -100, 42],
  ['非洲板块', 18, -8], ['印度洋板块', 75, -28], ['南极洲板块', 0, -80],
];
const plateLabels = plateLabelDefs.map(([name, lo, la]) => {
  const sp = addSprite(gMap, name, LL2X(lo), 0.55, LL2Z(la), { fontSize: 30, color: '#ffe6c0', scale: 0.0046 });
  sp.visible = false;
  /* 立杆 + 顶端小铭牌（中英双行，CanvasTexture），杆随 sprite 显隐 */
  const pole = new THREE.Group();
  const rod = new THREE.Mesh(
    new THREE.CylinderGeometry(0.008, 0.012, 0.42, 8),
    D_MATS.brassDark
  );
  rod.position.y = 0.21;
  pole.add(rod);
  const tagTex = makeLabelTexture([name, { '亚欧板块': 'Eurasian', '太平洋板块': 'Pacific', '美洲板块': 'American', '非洲板块': 'African', '印度洋板块': 'Indo-Australian', '南极洲板块': 'Antarctic' }[name] || 'Plate'], { accent: '#7a5a2e', w: 256, h: 128 });
  const tag = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.15, 0.02),
    new THREE.MeshStandardMaterial({ map: tagTex, roughness: 0.8 })
  );
  tag.position.y = 0.5;
  pole.add(tag);
  pole.position.set(LL2X(lo), 0.08, LL2Z(la));
  pole.name = 'labelPole';
  sp.userData.pole = pole;
  gMap.add(pole);
  return sp;
});

// 火山地震带：脉动光点 + 火山锥 + 地震波环
const hotspotDefs = [[142, 38], [-121, 38], [-72, -34], [138, -8], [100, 21], [-16, 40], [50, -18]];
const hotDots = hotspotDefs.map(([lo, la]) => {
  const dot = new THREE.Mesh(
    new THREE.SphereGeometry(0.075, 12, 10),
    new THREE.MeshBasicMaterial({ color: 0xff7a3c })
  );
  dot.position.set(LL2X(lo), 0.16, LL2Z(la));
  dot.visible = false;
  gMap.add(dot);
  return dot;
});
/* 火山立体建模：车削山体（径向 fbm 扰动）+ 火山口内凹 + 熔岩湖 + 两条熔岩流管放样
 * + 山脚村落实例 + 烟柱精灵阵列（帧循环上升）。示例点位：富士山。 */
const volcano = new THREE.Group();
let volcanoLava, smokeSprites = [];
{
  const rock = makeRockTexture('basalt', 61);
  const bodyTex = rock;
  const prof = [];
  const N0 = 16;
  for (let i = 0; i <= N0; i++) {
    const t = i / N0;
    const r = 0.62 * (1 - t) + 0.13;
    prof.push(new THREE.Vector2(t > 0.88 ? r * (1 - (t - 0.88) / 0.12 * 0.55) : r, t * 0.78));
  }
  prof.push(new THREE.Vector2(0.16, 0.72));   // 口缘内收到火山口坑
  prof.push(new THREE.Vector2(0.1, 0.68));    // 坑底
  const bodyGeo = new THREE.LatheGeometry(prof, 30);
  const bp = bodyGeo.attributes.position;
  for (let i = 0; i < bp.count; i++) {
    const x = bp.getX(i), z = bp.getZ(i), y = bp.getY(i);
    const r = Math.sqrt(x * x + z * z);
    if (r > 0.02 && y > 0.02 && y < 0.74) {
      const n = fbm3(x * 6, y * 5, z * 6, 17);
      const k = 1 + n * 0.16;
      bp.setX(i, x * k);
      bp.setZ(i, z * k);
      bp.setY(i, y + n * 0.02);
    }
  }
  bodyGeo.computeVertexNormals();
  const body = new THREE.Mesh(bodyGeo, new THREE.MeshStandardMaterial({ map: bodyTex, color: 0x9a8e80, roughness: 0.92 }));
  volcano.add(body);
  /* 熔岩湖：火山口内发亮圆盘 */
  volcanoLava = new THREE.Mesh(
    new THREE.CircleGeometry(0.1, 20).rotateX(-Math.PI / 2),
    matGlow(0xff6a2a, 0.9)
  );
  volcanoLava.position.y = 0.685;
  volcano.add(volcanoLava);
  /* 两条熔岩流：从口沿坡蜿蜒而下（变径管放样 + 发光材质） */
  for (const dir of [0.4, 3.4]) {
    const pts = [];
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      const r = 0.12 + t * 0.5;
      const y = 0.7 - t * 0.56;
      pts.push(new THREE.Vector3(Math.cos(dir + t * 0.9) * r, y, Math.sin(dir + t * 0.9) * r));
    }
    const flow = loftTube(pts, (t) => 0.03 * (1 - t * 0.5) + 0.008,
      matGlow(0xff7a30, 0.6, { roughness: 0.4 }), { segs: 40, radial: 10 });
    volcano.add(flow);
  }
  /* 山脚村落：小屋实例环半圈 */
  const houses = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.09, 0.07, 0.09),
    matStd(0xd8ccb4, { roughness: 0.8 }), 10
  );
  const roofs = new THREE.InstancedMesh(
    new THREE.ConeGeometry(0.075, 0.05, 4),
    matStd(0x7c5844, { roughness: 0.85 }), 10
  );
  for (let i = 0; i < 10; i++) {
    const a = Math.PI * 0.25 + (i / 9) * Math.PI * 1.3;
    const r = 0.85 + (i % 3) * 0.12;
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    _q.setFromEuler(new THREE.Euler(0, -a, 0));
    _m4.compose(_v.set(x, 0.035, z), _q, _v.clone().set(1, 1, 1));
    houses.setMatrixAt(i, _m4);
    _m4.compose(_v.set(x, 0.085, z), _q, _v.clone().set(1, 1, 1));
    roofs.setMatrixAt(i, _m4);
  }
  volcano.add(houses, roofs);
  /* 烟柱：软边灰团精灵 8 枚，帧循环上升+放大+淡出；高空灰云 4 枚更淡、横向缓慢漂移 */
  const smokeTex = makeSmokeTexture();
  for (let i = 0; i < 8; i++) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: smokeTex, transparent: true, opacity: 0.55, depthWrite: false }));
    sp.userData.phase = i / 8;
    sp.scale.setScalar(0.2);
    sp.visible = false;
    volcano.add(sp);
    smokeSprites.push(sp);
  }
  for (let i = 0; i < 4; i++) {
    const cloud = new THREE.Sprite(new THREE.SpriteMaterial({ map: smokeTex, transparent: true, opacity: 0.22, depthWrite: false }));
    cloud.userData.phase = i / 4;
    cloud.scale.set(0.9, 0.5, 1);
    cloud.position.set((i - 1.5) * 0.5, 1.15 + i * 0.1, -0.2 + i * 0.15);
    cloud.visible = false;
    volcano.add(cloud);
    smokeSprites.push(cloud);
  }
  volcano.scale.setScalar(1.05);
  volcano.position.set(LL2X(138), 0.05, LL2Z(36));
  volcano.visible = false;
  volcano.name = 'fujiVolcano';
  gMap.add(volcano);
  addContactShadow(gMap, 2.4, 2.4, 0.06, 0.55).position.set(LL2X(138), 0.06, LL2Z(36));
}

/* 热点海山链（章 7）：板片滑过固定热点留下一串年龄渐变的海山——链的走向即板块运动轨迹。
 * 出露的成岛（锥+植被裙），水下的为海山（暗色矮锥），东南端活火山口发微光。 */
const hotspotChain = new THREE.Group();
hotspotChain.visible = false;
gMap.add(hotspotChain);
{
  const CHAIN = [
    { lo: -155, la: 20, h: 0.5, live: true },
    { lo: -157.5, la: 24, h: 0.4, live: false },
    { lo: -160, la: 29, h: 0.34, live: false },
    { lo: -163, la: 35, h: 0.28, live: false },
    { lo: -166.5, la: 41, h: 0.24, live: false },
    { lo: -169, la: 46, h: 0.2, live: false },
    { lo: -171, la: 51, h: 0.17, live: false },
  ];
  const isleMat = matStd(0x7a8a5e, { roughness: 0.9 });
  const shelfMat = matStd(0x3e6c96, { roughness: 0.75 });
  CHAIN.forEach((d, i) => {
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(0.14 - i * 0.008, d.h, 14),
      d.live ? matStd(0x6e5a48, { roughness: 0.95 }) : isleMat
    );
    cone.position.set(LL2X(d.lo), d.h / 2 - 0.02, LL2Z(d.la));
    hotspotChain.add(cone);
    if (d.live) {
      const vent = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), matGlow(0xff8a4a, 0.9));
      vent.position.set(LL2X(d.lo), d.h - 0.02, LL2Z(d.la));
      hotspotChain.add(vent);
    }
    /* 水下裙座：更大的暗色底盘表示被侵蚀的海山基座 */
    const skirt = new THREE.Mesh(
      new THREE.ConeGeometry(0.3 - i * 0.02, d.h * 0.5, 12),
      shelfMat
    );
    skirt.position.set(LL2X(d.lo), d.h * 0.12 - 0.03, LL2Z(d.la));
    hotspotChain.add(skirt);
    if (d.live || i === 3) {
      addSprite(hotspotChain, d.live ? '活火山岛（年轻）' : '海山链（渐老）', LL2X(d.lo), d.h + 0.18, LL2Z(d.la), { fontSize: 20, color: '#ffe6c0', scale: 0.0028 });
    }
  });
  addContactShadow(gMap, 0.9, 2.6, 0.13, 0.4).position.set(LL2X(-162), 0.13, LL2Z(34));
}

/* 地震仪（章 7 道具）：黄铜底座 + 旋转滚筒（纸带 CanvasTexture 每帧推进并画波形，
 * 幅度与「地震波」开关联动）+ 悬臂笔尖 + 接触阴影。 */
const gSeismo = new THREE.Group();
gSeismo.visible = false;
scene.add(gSeismo);
const seismoTrace = { cv: null, ctx: null, tex: null, x: 0, amp: 1 };
let seismoDrum = null;
{
  const plateTex = makeWoodTexture({ base: '#6a4c30', dark: '#4c341e', light: '#86613e', streaks: 70, seed: 41 });
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(1.05, 0.09, 0.62),
    new THREE.MeshStandardMaterial({ map: plateTex, roughness: 0.7 })
  );
  base.position.y = 0.045;
  gSeismo.add(base);
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.06, 0.05, 12), D_MATS.brassDark);
    foot.position.set(sx * 0.44, 0.025, sz * 0.24);
    gSeismo.add(foot);
  }
  /* 滚筒：纸带贴图圆柱 + 两端黄铜轴盘 */
  seismoDrum = new THREE.Group();
  const paper = new THREE.Mesh(
    new THREE.CylinderGeometry(0.17, 0.17, 0.44, 26, 1, true),
    new THREE.MeshStandardMaterial({ map: makeSeismoPaper(), roughness: 0.9, side: THREE.DoubleSide })
  );
  paper.rotation.z = Math.PI / 2;
  seismoDrum.add(paper);
  for (const s of [-1, 1]) {
    const flange = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.02, 26), D_MATS.brass);
    flange.rotation.z = Math.PI / 2;
    flange.position.x = s * 0.23;
    seismoDrum.add(flange);
  }
  seismoDrum.position.set(-0.18, 0.38, 0);
  gSeismo.add(seismoDrum);
  /* 支柱 + 悬臂 + 笔尖 */
  const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.03, 0.62, 12), D_MATS.steelDark);
  pillar.position.set(0.42, 0.4, 0);
  gSeismo.add(pillar);
  /* 铭牌：底座前沿的黄铜铭板（蚀刻校名与仪器号） */
  const nameplateTex = (() => {
    const cv = document.createElement('canvas');
    cv.width = 256; cv.height = 64;
    const c = cv.getContext('2d');
    c.fillStyle = '#8a6c34';
    c.fillRect(0, 0, 256, 64);
    c.strokeStyle = '#e8d8ae';
    c.lineWidth = 3;
    c.strokeRect(6, 6, 244, 52);
    c.fillStyle = '#f4e8c8';
    c.textAlign = 'center';
    c.font = '900 26px "Songti SC","SimSun",serif';
    c.fillText('地 动 仪 · 仿 制 07 号', 128, 30);
    c.font = '400 14px Georgia,serif';
    c.fillText('SEISMOSCOPE · 1900 mm/min', 128, 50);
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  })();
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.105), new THREE.MeshStandardMaterial({ map: nameplateTex, roughness: 0.4, metalness: 0.5 }));
  plate.position.set(-0.18, 0.09, 0.32);
  plate.rotation.x = -0.35;
  gSeismo.add(plate);
  /* 烈度记录卡：立式小卡（Ⅰ~Ⅴ 罗马烈度刻度 + 说明行），靠在仪器座旁 */
  const intensityTex = (() => {
    const cv = document.createElement('canvas');
    cv.width = 220; cv.height = 300;
    const c = cv.getContext('2d');
    c.fillStyle = '#efe9d8';
    c.fillRect(0, 0, 220, 300);
    for (let i = 0; i < 130; i++) {
      c.fillStyle = 'rgba(120,100,70,0.05)';
      c.fillRect(Math.random() * 220, Math.random() * 300, 2, 2);
    }
    c.fillStyle = '#2c2620';
    c.textAlign = 'center';
    c.font = '900 26px "Songti SC","SimSun",serif';
    c.fillText('地 震 烈 度 记 录', 110, 44);
    const ROWS = [['Ⅰ', '无感，仪器记录'], ['Ⅱ', '少数人有感'], ['Ⅲ', '悬挂物摇晃'], ['Ⅳ', '门窗作响'], ['Ⅴ', '器皿倾倒·墙裂']];
    c.font = '600 20px "Songti SC",serif';
    ROWS.forEach(([r, d], i) => {
      const y = 84 + i * 42;
      c.fillStyle = ['#9aa4ae', '#b0a06a', '#d0a04a', '#e08a3a', '#d05a2e'][i];
      c.fillText(r, 34, y);
      c.fillStyle = '#3a342c';
      c.textAlign = 'left';
      c.fillText(d, 62, y);
      c.textAlign = 'center';
    });
    c.strokeStyle = '#8a4030';
    c.lineWidth = 4;
    c.strokeRect(8, 8, 204, 284);
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  })();
  const intensityCard = new THREE.Mesh(
    new THREE.PlaneGeometry(0.26, 0.35),
    new THREE.MeshStandardMaterial({ map: intensityTex, roughness: 0.85 })
  );
  intensityCard.position.set(0.52, 0.24, 0.3);
  intensityCard.rotation.set(-0.42, -0.35, 0.06);
  gSeismo.add(intensityCard);
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.035, 0.05), D_MATS.steel);
  arm.position.set(0.14, 0.68, 0);
  gSeismo.add(arm);
  const stylus = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.1, 8), D_MATS.steelDark);
  stylus.rotation.x = Math.PI;
  stylus.position.set(-0.16, 0.6, 0);
  gSeismo.add(stylus);
  const weight = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 10), D_MATS.brass);
  weight.position.set(0.38, 0.55, 0);
  gSeismo.add(weight);
  /* 波形纸带：512×128 离屏画布，每帧左移 2px 画新采样点（幅度按震波开关缩放） */
  const cv = document.createElement('canvas');
  cv.width = 512; cv.height = 128;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#f2ecd8';
  ctx.fillRect(0, 0, 512, 128);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  const strip = new THREE.Mesh(
    new THREE.PlaneGeometry(0.44, 0.14),
    new THREE.MeshBasicMaterial({ map: tex })
  );
  strip.position.set(-0.18, 0.38, 0.175);
  strip.rotation.x = -0.12;
  gSeismo.add(strip);
  seismoTrace.cv = cv;
  seismoTrace.ctx = ctx;
  seismoTrace.tex = tex;
  gSeismo.position.set(3.3, 0.06, 2.8);
  gSeismo.rotation.y = -0.5;
  addContactShadow(gSeismo, 1.6, 1.1, 0.055, 0.7);
}
const quakeRings = [];
for (let i = 0; i < 3; i++) {
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.32, 0.4, 48).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0xffd166, transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false })
  );
  ring.position.set(LL2X(142), 0.17, LL2Z(38));
  ring.userData.phase = i / 3;
  ring.visible = false;
  quakeRings.push(ring);
  gMap.add(ring);
}
/* S 波环：蓝色、相位滞后（S 波走得慢），与黄色 P 波环同圆心扩散——直观展示两种波速差 */
const sWaveRings = [];
for (let i = 0; i < 3; i++) {
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.26, 0.33, 48).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0x7ab0ff, transparent: true, opacity: 0.7, side: THREE.DoubleSide, depthWrite: false })
  );
  ring.position.set(LL2X(142), 0.165, LL2Z(38));
  ring.userData.phase = ((i / 3) + 0.55) % 1;
  ring.visible = false;
  sWaveRings.push(ring);
  gMap.add(ring);
}

/* 历史强震震中散点（章 6/7）：全球著名强震落点（实例化暗红圆点贴海床），
 * 印证「震中多沿板块交界带分布」；标注两处大家最熟悉的。 */
const epicenters = new THREE.InstancedMesh(
  new THREE.CircleGeometry(0.05, 14).rotateX(-Math.PI / 2),
  new THREE.MeshBasicMaterial({ color: 0xc03428, transparent: true, opacity: 0.85, depthWrite: false }), 10
);
{
  const EQS = [[140, 36], [103, 31], [142, 38], [-72, -34], [126, 4], [-15, 44], [38, 36], [-97, 18], [148, -6], [70, 36]];
  EQS.forEach(([lo, la], i) => {
    _m4.compose(_v.set(LL2X(lo), 0.125, LL2Z(la)), _q.identity(), _v.clone().set(1, 1, 1));
    epicenters.setMatrixAt(i, _m4);
  });
}
epicenters.visible = false;
gMap.add(epicenters);
const eqLabelSp = addSprite(gMap, '历史强震震中', LL2X(103), 0.4, LL2Z(31), { fontSize: 20, color: '#ffb0a0', scale: 0.0028 });
eqLabelSp.visible = false;

// 大陆漂移证据（章 4）：中龙与舌羊齿标记 + 大西洋中脊
const evidGroup = new THREE.Group();
evidGroup.visible = false;
gMap.add(evidGroup);
const evidDots = [[-38, -4, '中龙化石'], [12, -6, '中龙化石'], [-42, 3, '舌羊齿'], [22, -18, '舌羊齿'], [95, -22, '舌羊齿']].map(([lo, la, name]) => {
  const dot = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffd166 }));
  dot.position.set(LL2X(lo), 0.15, LL2Z(la));
  const sp = addSprite(evidGroup, name, LL2X(lo), 0.42, LL2Z(la), { fontSize: 22, color: '#ffd9a0', scale: 0.003 });
  evidGroup.add(dot);
  return sp;
});
const atlRidge = new THREE.Line(
  new THREE.BufferGeometry().setFromPoints(
    [[-30, 60], [-28, 45], [-15, 30], [-12, 10], [-14, -8], [-14, -26], [-10, -42]].map(([lo, la]) => new THREE.Vector3(LL2X(lo), 0.16, LL2Z(la)))
  ),
  new THREE.LineDashedMaterial({ color: 0xff8c42, dashSize: 0.16, gapSize: 0.1 })
);
atlRidge.computeLineDistances();
evidGroup.add(atlRidge);
/* 中脊立体脊体：沿脊线的变宽条带（中轴略凹成轴谷），微发光表示新洋壳生长带 */
const atlRidgeBody = loftRibbon(
  [[-30, 60], [-28, 45], [-15, 30], [-12, 10], [-14, -8], [-14, -26], [-10, -42]].map(([lo, la]) => new THREE.Vector3(LL2X(lo), 0.085, LL2Z(la))),
  (t) => 0.34 - 0.1 * Math.exp(-((t - 0.5) ** 2) / 0.08),
  new THREE.MeshStandardMaterial({
    color: 0x3c5a78, roughness: 0.8, metalness: 0.06,
    emissive: 0x2a3c50, emissiveIntensity: 0.5,
  }),
  { segs: 110, lift: 0.075, vScale: 4 }
);
atlRidgeBody.name = 'atlRidgeBody';
evidGroup.add(atlRidgeBody);
/* 脊顶轴谷发光缝：细窄亮带标出海底生长轴 */
const atlRidgeAxis = loftRibbon(
  [[-30, 60], [-28, 45], [-15, 30], [-12, 10], [-14, -8], [-14, -26], [-10, -42]].map(([lo, la]) => new THREE.Vector3(LL2X(lo), 0.1, LL2Z(la))),
  () => 0.028,
  matGlow(0xffa04a, 0.8, { roughness: 0.5 }),
  { segs: 110, lift: 0.1 }
);
atlRidgeAxis.name = 'atlRidgeAxis';
evidGroup.add(atlRidgeAxis);

/* 古冰川擦痕组（章 4 证据④）：南方各大陆上的平行磨蚀槽 + 汇聚箭头，共同指向
 * 泛古陆时期的统一冰盖中心——大陆重新拼合后擦痕才能连成同心的放射状。 */
const glacialGroup = new THREE.Group();
glacialGroup.visible = false;
evidGroup.add(glacialGroup);
{
  const grooveMat = new THREE.MeshStandardMaterial({ color: 0xdde8f2, roughness: 0.4, metalness: 0.1, transparent: true, opacity: 0.75 });
  const arrowMat = matGlow(0x9ad0ff, 0.7, { roughness: 0.5 });
  const poleSpot = new THREE.Mesh(
    new THREE.CircleGeometry(0.22, 26).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0x9ad0ff, transparent: true, opacity: 0.3, depthWrite: false })
  );
  poleSpot.position.set(LL2X(24), 0.12, LL2Z(-62));
  glacialGroup.add(poleSpot);
  addSprite(glacialGroup, '泛古陆冰盖中心', LL2X(24), 0.4, LL2Z(-62), { fontSize: 22, color: '#bfe0ff', scale: 0.003 });
  /* 每条擦痕：细长条带从大陆上的一点指向冰盖中心（方向对齐由 ribbon 沿曲线自然生成） */
  const STRIAE = [
    [[-8, -22], [-4, -34], [2, -46], [10, -56]],     // 非洲
    [[-62, -12], [-54, -24], [-44, -38], [-32, -50]],// 南美
    [[74, -12], [64, -26], [52, -42], [40, -54]],    // 印度
    [[122, -20], [112, -32], [100, -46], [86, -56]], // 澳大利亚
  ];
  for (const chainPts of STRIAE) {
    const pts = chainPts.map(([lo, la]) => new THREE.Vector3(LL2X(lo), 0.115, LL2Z(la)));
    const groove = loftRibbon(pts, (t) => 0.02 + t * 0.015, grooveMat, { segs: 46, lift: 0.115 });
    glacialGroup.add(groove);
    /* 末端箭头锥：指向运动反方向（冰流从中心向外 → 擦痕箭头朝外） */
    const tip = pts[pts.length - 1];
    const prev = pts[pts.length - 2];
    const dir = new THREE.Vector3().subVectors(tip, prev).normalize();
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.14, 10), arrowMat);
    cone.position.copy(tip).addScaledVector(dir, 0.09);
    cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    glacialGroup.add(cone);
  }
}
const evidLabel = addSprite(evidGroup, '大西洋中脊', LL2X(-13), 0.5, LL2Z(-30), { fontSize: 24, color: '#ffcf9a', scale: 0.0035 });
evidGroup.add(evidLabel);

// 海洋底板
const ocean = new THREE.Mesh(
  new THREE.PlaneGeometry(10.6, 8.4).rotateX(-Math.PI / 2),
  new THREE.MeshStandardMaterial({ color: 0x2a5e94, roughness: 0.85 })
);
ocean.position.y = -0.02;
gMap.add(ocean);

/* 年代弧尺（章 5）：泛大陆地图下缘的弧形地质年代表（CanvasTexture 刻度环段），
 * 泛大陆章切换年代时游标随滑杆在弧上滑动——时间轴可视化。 */
const gTimescale = new THREE.Group();
let timescaleCursor = null;
{
  const arcTex = (() => {
    const cv = document.createElement('canvas');
    cv.width = 1024; cv.height = 128;
    const c = cv.getContext('2d');
    c.fillStyle = '#20303e';
    c.fillRect(0, 0, 1024, 128);
    const TICKS = [[0, '今天'], [60, '6千万年'], [120, '1.2亿年'], [180, '1.8亿年'], [250, '2.5亿年']];
    const ux = (ma) => 40 + (1 - ma / 250) * 944;
    c.strokeStyle = '#d8e4ee';
    c.fillStyle = '#d8e4ee';
    c.font = '600 26px "PingFang SC",sans-serif';
    c.textAlign = 'center';
    for (const [ma, label] of TICKS) {
      const x = ux(ma);
      c.lineWidth = 3;
      c.beginPath(); c.moveTo(x, 64); c.lineTo(x, 96); c.stroke();
      c.fillText(label, x, 40);
    }
    c.lineWidth = 2;
    for (let ma = 10; ma < 250; ma += 10) {
      const x = ux(ma);
      c.beginPath(); c.moveTo(x, 80); c.lineTo(x, 96); c.stroke();
    }
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  })();
  const arcBar = new THREE.Mesh(
    new THREE.PlaneGeometry(3.6, 0.45),
    new THREE.MeshBasicMaterial({ map: arcTex, transparent: true, opacity: 0.92 })
  );
  arcBar.position.set(0, -3.1, 2.2);
  arcBar.rotation.x = -0.5;
  gTimescale.add(arcBar);
  /* 游标：小三角指针，随地质年代滑杆左右滑动（帧循环由 updateMaHud 联动） */
  timescaleCursor = new THREE.Mesh(
    new THREE.ConeGeometry(0.09, 0.2, 4),
    matGlow(0xffd166, 0.9)
  );
  timescaleCursor.rotation.x = Math.PI;
  timescaleCursor.position.set(0, -2.78, 2.2);
  gTimescale.add(timescaleCursor);
  gTimescale.visible = false;
  gMap.add(gTimescale);
}

/* ==================== 魏格纳的书桌（章 4 叙事场景） ====================
 * 木书桌 + 摊开的泛大陆图纸（CanvasTexture）+ 地球仪（程序化海陆贴图、黄铜弧支架、
 * 帧循环自转）+ 放大镜（玻璃 transmission）+ 墨水瓶与蘸水笔 + 手稿笔记本。
 * 桌在地图南侧前景，与「大西洋两岸拼合」的讲解互为语境。 */
const gDesk = new THREE.Group();
gDesk.visible = false;
scene.add(gDesk);
let deskGlobeSpin = null;
{
  const deskWood = new THREE.MeshStandardMaterial({ map: makeWoodTexture({ base: '#8a6440', dark: '#66482c', light: '#a8825a', streaks: 110, bands: 8, planks: 4, seed: 33 }), roughness: 0.62, metalness: 0.04 });
  const deskGrp = new THREE.Group();
  const top = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.14, 1.9), deskWood);
  top.position.y = -0.62;
  deskGrp.add(top);
  /* 黄铜包角 */
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const corner = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.16), D_MATS.brass);
    corner.position.set(sx * (1.8 - 0.06), -0.62 + 0.05, sz * (0.95 - 0.06));
    corner.scale.set(sx > 0 ? 1 : 1, 1, 1);
    deskGrp.add(corner);
  }
  /* 车削线脚桌腿 */
  const legProfile = [
    [0.0, 0], [0.09, 0], [0.075, 0.04], [0.075, 0.06], [0.05, 0.1],
    [0.05, 0.58], [0.066, 0.62], [0.066, 0.66], [0.05, 0.7], [0.05, 0.78],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const leg = new THREE.Mesh(new THREE.LatheGeometry(legProfile, 14), deskWood);
    leg.position.set(sx * 1.5, -0.69 - 0.78, sz * 0.72);
    deskGrp.add(leg);
  }
  deskGrp.position.set(1.2, 0, 3.2);
  deskGrp.rotation.y = -0.18;
  gDesk.add(deskGrp);
  addContactShadow(gDesk, 4.4, 2.8, -1.5, 0.75).position.set(1.2, -1.49, 3.2);
  /* 摊开的泛大陆图纸 */
  const sheet = new THREE.Mesh(
    new THREE.PlaneGeometry(1.42, 1.0),
    new THREE.MeshStandardMaterial({ map: makeMapSheetTexture(), roughness: 0.9 })
  );
  sheet.rotation.x = -Math.PI / 2;
  sheet.rotation.z = 0.06;
  sheet.position.set(-0.35, -0.545, 3.15);
  gDesk.add(sheet);
  for (const [dx, dz] of [[-0.62, -0.42], [0.62, -0.42], [-0.62, 0.42], [0.62, 0.42]]) {
    const pin = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 6), D_MATS.brass);
    pin.position.set(-0.35 + dx, -0.53, 3.15 + dz);
    gDesk.add(pin);
  }
  /* 地球仪：海陆贴图球 + 经纬细线 + 黄铜弧支架 + 车削底座 + 旋钮，帧循环缓慢自转 */
  const globeGrp = new THREE.Group();
  const ball = new THREE.Mesh(
    new THREE.SphereGeometry(0.27, 40, 28),
    new THREE.MeshStandardMaterial({ map: makeGlobeTexture(), roughness: 0.5, metalness: 0.05 })
  );
  globeGrp.add(ball);
  const graticule = new THREE.Mesh(
    new THREE.SphereGeometry(0.278, 24, 16),
    new THREE.MeshBasicMaterial({ color: 0xd8e4ee, wireframe: true, transparent: true, opacity: 0.14 })
  );
  globeGrp.add(graticule);
  /* 赤道环与两条经度环（黄铜细箍），像老式地球仪的金属子午圈 */
  for (const [r, tilt] of [[0.274, 0], [0.274, Math.PI / 2], [0.274, Math.PI / 4]]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.006, 8, 48), D_MATS.brass);
    ring.rotation.x = tilt;
    globeGrp.add(ring);
  }
  const arc = new THREE.Mesh(
    new THREE.TorusGeometry(0.31, 0.016, 10, 40, Math.PI),
    D_MATS.brass
  );
  arc.rotation.z = Math.PI / 2;
  arc.rotation.y = Math.PI / 2;
  globeGrp.add(arc);
  const axisN = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.1, 8), D_MATS.brass);
  axisN.position.y = 0.31;
  globeGrp.add(axisN);
  const deskGlobe = new THREE.Group();
  deskGlobe.add(globeGrp);
  globeGrp.rotation.z = 0.41;   // 黄道倾角
  const globePost = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.2, 10), D_MATS.brassDark);
  globePost.position.y = -0.12;
  deskGlobe.add(globePost);
  const globeBase = new THREE.Mesh(
    new THREE.LatheGeometry([[0, 0], [0.14, 0], [0.15, 0.03], [0.1, 0.05], [0.05, 0.06], [0.045, 0.1]].map(([r, y]) => new THREE.Vector2(r, y)), 20),
    D_MATS.brassDark
  );
  deskGlobe.add(globeBase);
  /* 底座刻度盘：罗盘式经度刻线 CanvasTexture 圆盘，标注本初子午线与赤道读数 */
  const dialTex = (() => {
    const cv = document.createElement('canvas');
    cv.width = cv.height = 256;
    const c = cv.getContext('2d');
    c.fillStyle = '#2c2a26';
    c.beginPath();
    c.arc(128, 128, 126, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = '#d8c896';
    for (let i = 0; i < 36; i++) {
      const a = (i / 36) * Math.PI * 2;
      const r1 = i % 9 === 0 ? 96 : 108;
      c.lineWidth = i % 9 === 0 ? 3 : 1.4;
      c.beginPath();
      c.moveTo(128 + Math.cos(a) * r1, 128 + Math.sin(a) * r1);
      c.lineTo(128 + Math.cos(a) * 118, 128 + Math.sin(a) * 118);
      c.stroke();
    }
    c.fillStyle = '#d8c896';
    c.font = '700 22px Georgia,serif';
    c.textAlign = 'center';
    c.fillText('0°', 128, 24);
    c.fillText('180°', 128, 240);
    c.font = '400 15px Georgia,serif';
    c.fillText('90°E', 234, 134);
    c.fillText('90°W', 22, 134);
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  })();
  const dial = new THREE.Mesh(new THREE.CircleGeometry(0.15, 36).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: dialTex, roughness: 0.5, metalness: 0.3 }));
  dial.position.y = 0.005;
  deskGlobe.add(dial);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.028, 10, 8), D_MATS.wood ? matStd(0x4a3020, { roughness: 0.4, metalness: 0.2 }) : matStd(0x4a3020));
  knob.position.y = -0.16;
  deskGlobe.add(knob);
  deskGlobe.position.set(0.95, -0.34, 2.85);
  gDesk.add(deskGlobe);
  deskGlobeSpin = globeGrp;
  /* 地质罗盘：黄铜圆壳 + 玻璃盖 + 方位刻度盘 + 磁针（红北蓝南，帧循环轻微抖动）+ 水准泡 */
  const compass = new THREE.Group();
  const dialC = (() => {
    const cv = document.createElement('canvas');
    cv.width = cv.height = 256;
    const c = cv.getContext('2d');
    c.fillStyle = '#efe8d4';
    c.beginPath(); c.arc(128, 128, 124, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#4a4030';
    c.fillStyle = '#4a4030';
    c.font = '900 30px "Songti SC",serif';
    c.textAlign = 'center';
    c.fillText('北', 128, 46);
    for (let i = 0; i < 72; i++) {
      const a = (i / 72) * Math.PI * 2;
      const r1 = i % 18 === 0 ? 78 : i % 6 === 0 ? 92 : 102;
      c.lineWidth = i % 6 === 0 ? 3 : 1.2;
      c.beginPath();
      c.moveTo(128 + Math.cos(a) * r1, 128 + Math.sin(a) * r1);
      c.lineTo(128 + Math.cos(a) * 112, 128 + Math.sin(a) * 112);
      c.stroke();
    }
    for (const [lab, aa] of [['东', 0], ['南', Math.PI / 2], ['西', Math.PI], ['北', -Math.PI / 2]]) {
      c.font = '700 24px "Songti SC",serif';
      c.fillText(lab, 128 + Math.cos(aa) * 66, 136 + Math.sin(aa) * 66);
    }
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  })();
  const dialPlate = new THREE.Mesh(new THREE.CircleGeometry(0.105, 36).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: dialC, roughness: 0.6 }));
  compass.add(dialPlate);
  const needleGrp = new THREE.Group();
  const nNorth = new THREE.Mesh(new THREE.ConeGeometry(0.016, 0.13, 8), matGlow(0xd8402a, 0.35, { roughness: 0.4 }));
  nNorth.position.y = 0.055;
  const nSouth = new THREE.Mesh(new THREE.ConeGeometry(0.016, 0.13, 8), matStd(0x2c4e78, { roughness: 0.4 }));
  nSouth.position.y = -0.055;
  nSouth.rotation.x = Math.PI;
  const cap2 = new THREE.Mesh(new THREE.SphereGeometry(0.014, 10, 8), D_MATS.brass);
  needleGrp.add(nNorth, nSouth, cap2);
  needleGrp.name = 'compassNeedle';
  needleGrp.position.y = 0.02;
  compass.add(needleGrp);
  const bowl = new THREE.Mesh(
    new THREE.LatheGeometry([[0.105, 0], [0.115, 0.005], [0.115, 0.02], [0.1, 0.03], [0.1, 0.045], [0.108, 0.05]].map(([r, y]) => new THREE.Vector2(r, y)), 30).rotateX(Math.PI),
    D_MATS.brass
  );
  compass.add(bowl);
  const cover = new THREE.Mesh(new THREE.SphereGeometry(0.115, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2), matGlass(0xdceaf0, { transmission: 0.9, thickness: 0.08, opacity: 0.4 }));
  compass.add(cover);
  compass.position.set(0.42, -0.52, 3.35);
  compass.rotation.y = -0.7;
  gDesk.add(compass);
  /* 红铅笔拼合线：图纸上沿大西洋两岸走向的两条红虚线带（魏格纳亲手拼对处） */
  const pencilLine = loftRibbon(
    [[-24, 55], [-26, 40], [-18, 22], [-11, 4], [-10, -18], [-6, -38]].map(([lo, la]) => new THREE.Vector3(-0.35 + lo / 36 * 0.92, -0.535, 3.15 - la / 24 * 0.2)),
    () => 0.006,
    new THREE.MeshBasicMaterial({ color: 0xc04a3c }),
    { segs: 50, lift: 0, vScale: 1 }
  );
  pencilLine.name = 'pencilLine';
  gDesk.add(pencilLine);
  /* 放大镜：黄铜框 + 玻璃镜片 + 木柄，斜倚图纸右上角 */
  const magGrp = new THREE.Group();
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.014, 10, 30), D_MATS.brass);
  const lens = new THREE.Mesh(new THREE.CircleGeometry(0.082, 26), matGlass(0xcfe4ec, { transmission: 0.9, thickness: 0.18 }));
  magGrp.add(rim, lens);
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.018, 0.16, 10), matStd(0x5e4228, { roughness: 0.5 }));
  handle.position.set(0, -0.15, 0);
  magGrp.add(handle);
  magGrp.rotation.x = -Math.PI / 2 + 0.32;
  magGrp.rotation.y = 0.3;
  magGrp.position.set(0.42, -0.5, 2.72);
  gDesk.add(magGrp);
  /* 墨水瓶（玻璃瓶身 + 深蓝墨液 + 黄铜盖）与蘸水笔 */
  const inkGrp = new THREE.Group();
  const bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.055, 0.12, 16), matGlass(0xd8e6ea, { transmission: 0.88, thickness: 0.2 }));
  const inkFluid = new THREE.Mesh(new THREE.CylinderGeometry(0.043, 0.048, 0.07, 14), matStd(0x1c2c4e, { roughness: 0.25 }));
  inkFluid.position.y = -0.015;
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.05, 12), D_MATS.brassDark);
  cap.position.y = 0.085;
  inkGrp.add(bottle, inkFluid, cap);
  inkGrp.position.set(0.28, -0.46, 3.62);
  gDesk.add(inkGrp);
  const pen = new THREE.Group();
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.012, 0.3, 8), matStd(0x3a3028, { roughness: 0.5 }));
  const nib = new THREE.Mesh(new THREE.ConeGeometry(0.01, 0.05, 6), D_MATS.steel);
  nib.rotation.x = Math.PI;
  nib.position.y = -0.17;
  pen.add(shaft, nib);
  pen.rotation.z = 1.1;
  pen.rotation.x = 0.5;
  pen.position.set(0.15, -0.53, 3.42);
  gDesk.add(pen);
  /* 手稿笔记本：纸芯 + 深色封皮带绑绳 */
  const note = new THREE.Group();
  const pages = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.05, 0.24), D_MATS.paper);
  const band = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.056, 0.07), matStd(0x6a3a2e, { roughness: 0.7 }));
  note.add(pages, band);
  note.rotation.y = 0.5;
  note.position.set(1.62, -0.52, 3.5);
  gDesk.add(note);
  /* 证据立牌两块：中龙化石 / 舌羊齿，斜立在小展架上（对应讲解里的证据清单） */
  const evidenceCards = [
    ['中龙 Mesosaurus', '南美·非洲两岸同期淡水爬行类', '#a05a3a'],
    ['舌羊齿 Glossopteris', '南方诸大陆同属植物化石', '#4a7a4e'],
  ];
  evidenceCards.forEach(([name, sub, accent], i) => {
    const tex = makeSpecimenCard(name.split(' ')[0], `${name.split(' ')[1]}|${sub}`, `W-0${i + 1}`, accent);
    const cardGrp = new THREE.Group();
    const card = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.33), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85 }));
    card.position.y = 0.17;
    const standBar = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.2, 8), D_MATS.brassDark);
    standBar.position.set(0, 0.09, -0.01);
    standBar.rotation.x = -0.5;
    const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.02, 12), D_MATS.brassDark);
    foot.position.y = 0.01;
    cardGrp.add(card, standBar, foot);
    cardGrp.position.set(-1.15 + i * 0.34, -0.545, 3.62 + i * 0.05);
    cardGrp.rotation.y = -0.4 + i * 0.25;
    cardGrp.rotation.x = -0.18;
    gDesk.add(cardGrp);
  });
  /* 图纸上的化石产地彩钉：蓝=中龙 群落、绿=舌羊齿 群落、白=冰川擦痕区 */
  const PINS = [
    { u: -0.52, v: 0.1, c: 0x3a6ea8 }, { u: 0.18, v: 0.08, c: 0x3a6ea8 },
    { u: 0.34, v: -0.3, c: 0x3a7a4e }, { u: 0.52, v: -0.28, c: 0x3a7a4e },
    { u: -0.05, v: -0.42, c: 0xdce4ee },
  ];
  PINS.forEach((p) => {
    const pin = new THREE.Mesh(new THREE.SphereGeometry(0.016, 10, 8), matStd(p.c, { roughness: 0.35, metalness: 0.3 }));
    pin.position.set(-0.35 + p.u, -0.51, 3.15 + p.v);
    gDesk.add(pin);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.03, 6), D_MATS.steel);
    stem.position.set(-0.35 + p.u, -0.525, 3.15 + p.v);
    gDesk.add(stem);
  });
  /* 桌尾立相框：青年魏格纳剪影（程序化头像轮廓）+ 黄铜框 + 支架斜撑 */
  const portrait = (() => {
    const cv = document.createElement('canvas');
    cv.width = 128; cv.height = 160;
    const c = cv.getContext('2d');
    c.fillStyle = '#e8e0cc';
    c.fillRect(0, 0, 128, 160);
    c.fillStyle = '#3a3430';
    /* 剪影：头颈肩（弧线近似） */
    c.beginPath();
    c.arc(64, 62, 26, 0, Math.PI * 2);
    c.fill();
    c.beginPath();
    c.moveTo(26, 160);
    c.quadraticCurveTo(30, 96, 64, 92);
    c.quadraticCurveTo(98, 96, 102, 160);
    c.closePath();
    c.fill();
    /* 分头缝 */
    c.strokeStyle = '#e8e0cc';
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(58, 40);
    c.quadraticCurveTo(64, 58, 70, 74);
    c.stroke();
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  })();
  const frameGrp = new THREE.Group();
  const photo = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.25), new THREE.MeshStandardMaterial({ map: portrait, roughness: 0.9 }));
  photo.position.y = 0.16;
  const frameRim = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.29, 0.014), D_MATS.brassDark);
  frameRim.position.set(0, 0.16, -0.008);
  const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.22, 8), D_MATS.brassDark);
  strut.position.set(0, 0.1, -0.09);
  strut.rotation.x = -0.5;
  frameGrp.add(frameRim, photo, strut);
  frameGrp.position.set(-1.5, -0.545, 2.98);
  frameGrp.rotation.y = 0.5;
  frameGrp.rotation.x = -0.12;
  gDesk.add(frameGrp);
}

/* ---------------- 章 8：张裂与碰撞 ---------------- */

const boundState = { t: 0.3 };
let riftPlates, colPlates, magma, mount, ridgeValley, subSlab, arcCones = [], foldPeaks = [], riftPool, wedgeSlices = [];
{
  // 左：张裂（两块板块向两侧退开，中间岩浆上涌成脊）
  riftPlates = [];
  for (const s of [-1, 1]) {
    const plate = new THREE.Mesh(
      new THREE.BoxGeometry(2.6, 0.32, 1.6),
      new THREE.MeshStandardMaterial({ color: 0x8a9a6a, roughness: 0.9 })
    );
    plate.position.set(s * 1.5, 0.5, -1.4);
    plate.userData.side = s;
    riftPlates.push(plate);
    gBound.add(plate);
    /* 对称磁条带：正负磁极交替的洋壳条带（海底扩张证据），贴在各自板块顶面随之移动 */
    const stripes = new THREE.Group();
    for (let i = 0; i < 6; i++) {
      const pol = i % 2 === 0;
      const strip = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.02, 1.5),
        new THREE.MeshStandardMaterial({
          color: pol ? 0x5a6a4e : 0x38423a,
          roughness: 0.85, metalness: pol ? 0.05 : 0,
          emissive: pol ? 0x1a2418 : 0x000000, emissiveIntensity: 0.4,
        })
      );
      strip.position.set(s * (0.2 + i * 0.32), 0.18, 0);
      stripes.add(strip);
    }
    stripes.name = 'magStripes';
    plate.add(stripes);
    /* 转换断层刻痕：垂直于扩张轴的横向错断（洋脊分段），贴在板块顶面 */
    for (const zz of [-0.4, 0.35]) {
      const fault = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, 0.035, 0.08),
        matStd(0x6a5a3e, { roughness: 0.85 })
      );
      fault.position.set(s * 0.1, 0.185, zz);
      plate.add(fault);
    }
  }
  magma = new THREE.Mesh(
    new THREE.ConeGeometry(0.42, 0.75, 16),
    new THREE.MeshStandardMaterial({ color: 0xff5a2c, emissive: 0xb83a14, emissiveIntensity: 0.9, roughness: 0.7 })
  );
  magma.position.set(0, 0.55, -1.4);
  gBound.add(magma);
  /* 中脊轴谷：两板块豁口正中的窄发光条（新洋壳生长轴），张裂时随裂口中线平移 */
  ridgeValley = loftRibbon(
    [[0, -2.2], [0, -1.4], [0, -0.6]].map(([x, z]) => new THREE.Vector3(x, 0, z)),
    () => 0.05,
    matGlow(0xffa04a, 0.55, { roughness: 0.5 }),
    { segs: 30, lift: 0.68 }
  );
  gBound.add(ridgeValley);
  const riftLabel = addSprite(gBound, '张裂（生长边界）', 0, 1.9, -1.4, { fontSize: 26, color: '#ff9a6a' });
  riftLabel.name = 'bd1';
  // 右：碰撞（大洋板块俯冲 + 大陆边缘隆起成山）
  colPlates = [];
  for (const s of [-1, 1]) {
    const plate = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 0.3, 1.6),
      new THREE.MeshStandardMaterial({ color: s < 0 ? 0x7a8aa8 : 0x9aa06a, roughness: 0.9 })
    );
    plate.position.set(s * 1.55 + 6.2, 0.5, -1.4);
    plate.rotation.z = s * -0.06;
    plate.userData.side = s;
    colPlates.push(plate);
    gBound.add(plate);
  }
  /* 俯冲板片：从大洋板块前缘向下弯折的弧形条带（随大洋板块推进而伸入） */
  subSlab = loftRibbon(
    [[0, 0.34], [0.3, 0.1], [0.5, -0.28], [0.6, -0.7]].map(([x, y]) => new THREE.Vector3(x, y, 0)),
    () => 0.75,
    new THREE.MeshStandardMaterial({ color: 0x5e728e, roughness: 0.82, metalness: 0.1, side: THREE.DoubleSide }),
    { segs: 40, up: new THREE.Vector3(0, 0, 1), vScale: 3 }
  );
  subSlab.rotation.y = Math.PI / 2;
  subSlab.position.set(0, 0.32, -1.4);
  gBound.add(subSlab);
  /* 海沟：俯冲带上的 V 形凹谷（两块斜楔） */
  for (const s of [-1, 1]) {
    const wedge = new THREE.Mesh(
      new THREE.ConeGeometry(0.32, 0.5, 4),
      new THREE.MeshStandardMaterial({ color: 0x46506a, roughness: 0.95, flatShading: true })
    );
    wedge.scale.set(1.6, 1, 0.5);
    wedge.rotation.z = s * 2.35;
    wedge.position.set(4.85 + s * 0.16, 0.6, -1.4);
    wedge.name = 'trenchWedge';
    gBound.add(wedge);
  }
  /* 增生楔：大洋板块刮落的海底沉积在大洋一侧叠瓦状堆叠（碰撞进度越大片数越多） */
  for (let i = 0; i < 4; i++) {
    const slice = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.05, 1.3),
      new THREE.MeshStandardMaterial({ color: 0x8a94a8, roughness: 0.88 })
    );
    slice.position.set(4.35 - i * 0.2, 0.62 + i * 0.055, -1.4);
    slice.rotation.z = -0.5 + i * 0.16;
    wedgeSlices.push(slice);
    gBound.add(slice);
  }
  wedgeSlices.forEach((s) => { s.scale.setScalar(0.6); });
  /* 中脊轴谷熔岩湖：magma 锥脚下的小发亮熔潭，帧循环微闪 */
  riftPool = new THREE.Mesh(
    new THREE.CircleGeometry(0.12, 18).rotateX(-Math.PI / 2),
    matGlow(0xff7a3c, 0.7, { roughness: 0.4 })
  );
  riftPool.position.set(0, 0.67, -1.4);
  gBound.add(riftPool);
  /* 火山弧：俯冲带后方大陆侧的锥列（岩浆上升熔融） */
  for (let i = 0; i < 3; i++) {
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(0.16 + (i === 1 ? 0.05 : 0), 0.4 + (i === 1 ? 0.14 : 0), 12),
      matStd(0x6a5a48, { roughness: 0.95 })
    );
    cone.position.set(7.15 + i * 0.5, 0.78, -1.9 + i * 0.35);
    cone.name = 'arcCone';
    arcCones.push(cone);
    gBound.add(cone);
  }
  mount = new THREE.Mesh(
    new THREE.ConeGeometry(1.0, 1.15, 6),
    new THREE.MeshStandardMaterial({ color: 0x8a7a5c, roughness: 0.95, flatShading: true })
  );
  mount.position.set(6.2, 1.05, -1.4);
  mount.scale.set(1, 0.25, 1);
  gBound.add(mount);
  /* 褶皱山群：主峰两侧的卫星峰（碰撞进度越大越隆起） */
  for (const [dx, dz, r, h] of [[-0.95, 0.25, 0.55, 0.8], [0.9, 0.3, 0.6, 0.9], [-0.6, -0.4, 0.45, 0.7], [0.7, -0.45, 0.5, 0.75]]) {
    const peak = new THREE.Mesh(
      new THREE.ConeGeometry(r, h, 5),
      new THREE.MeshStandardMaterial({ color: 0x83765e, roughness: 0.95, flatShading: true })
    );
    peak.position.set(6.2 + dx, 0.7, -1.4 + dz);
    peak.scale.set(1, 0.22, 1);
    foldPeaks.push(peak);
    gBound.add(peak);
  }
  const colLabel = addSprite(gBound, '碰撞（消亡边界）', 6.2, 2.2, -1.4, { fontSize: 26, color: '#ffcf9a' });
  colLabel.name = 'bd2';
}
function updateBound() {
  const t = boundState.t;
  riftPlates.forEach((p) => { p.position.x = p.userData.side * (0.55 + t * 1.1); });
  magma.scale.setScalar(0.5 + t * 0.35);
  /* 轴谷跟随裂口中线（磁条带随板块移动已由父子关系自动跟随） */
  ridgeValley.position.x = (riftPlates[0].position.x + riftPlates[1].position.x) / 2;
  colPlates.forEach((p) => { p.position.x = 6.2 + p.userData.side * (2.35 - t * 0.75); });
  /* 俯冲板片随大洋板块推进向大陆下方伸入（倾角渐陡） */
  const oceanFront = colPlates[0].position.x + 1.2;
  subSlab.position.x = oceanFront + t * 0.5;
  subSlab.rotation.y = Math.PI / 2;
  subSlab.scale.setScalar(1 + t * 0.35);
  mount.scale.set(0.7 + t * 0.4, 0.22 + t * 0.75, 1);
  mount.position.y = 0.62 + (0.22 + t * 0.75) * 0.55;
  foldPeaks.forEach((p, i) => {
    p.scale.set(0.6 + t * 0.5, 0.16 + t * (0.62 + (i % 2) * 0.2), 1);
    p.position.y = 0.66 + (0.16 + t * (0.62 + (i % 2) * 0.2)) * 0.5;
  });
  arcCones.forEach((c, i) => { c.scale.setScalar(0.7 + t * 0.5); });
  riftPool.material.emissiveIntensity = 0.62 + Math.sin(clockT * 5.2) * 0.2;
  /* 增生楔随碰撞推进向陆侧加厚展开 */
  wedgeSlices.forEach((s, i) => {
    s.scale.setScalar(0.4 + t * 0.7);
    s.position.x = 4.35 - i * (0.14 + t * 0.07);
  });
}

/* ---------------- HUD ---------------- */

const hud = makeHUD(document.getElementById('lcData'), [['a', '读数'], ['b', ''], ['x', '']]);
hud.show(false);

/* ---------------- 控制条与章节 ---------------- */

const ctl = createControlsPanel(document.getElementById('controls'));

const state = { coastAuto: false, seaLevel: 0.25, ma: 250, playing: false, hotOn: true, superOn: false };

const SECTIONS = [
  {
    id: 'coast', title: '沧海桑田',
    html: `<p>「沧海桑田」说的是海洋可以变成陆地、陆地也可以变成海洋。海平面的升降与地壳的抬升、下降，都在不断改变着海岸的面貌。</p>
<p>拖动「海平面」滑杆或点「自动循环」：水位下降时海底出露成陆地（沧海→桑田），水位上升时沿海低地被淹没（桑田→沧海）。</p>`,
    enter() {
      showGroup(gCoast);
      hideAllSprites();
      showOnly((s) => s.name === 'coastSea');
      hud.show(false);
      ctl.clear();
      ctl.slider({
        label: '海平面', min: -0.5, max: 0.8, step: 0.02, value: state.seaLevel,
        fmt: (v) => (v >= 0.25 ? '高海面' : v >= 0.05 ? '中' : '低海面（海退）'),
        onInput: (v) => { state.seaLevel = v; state.coastAuto = false; },
      });
      ctl.button({
        label: '▶ 自动循环',
        onClick() { state.coastAuto = !state.coastAuto; },
      });
      app.setCamera([6.5, 5.2, 9.5], [0, 0, 0]);
    },
    tick(dt) {
      if (!state.coastAuto) return;
      state.seaLevel += dt * 0.22;
      if (state.seaLevel > 0.8) state.seaLevel = -0.5;
      const w = gCoast.getObjectByName('coastWater');
      if (w) w.position.y = state.seaLevel + 0.45;
    },
  },
  {
    id: 'fossil', title: '高山岩层中的海洋化石',
    html: `<p>珠穆朗玛峰一带的岩层里，找到了<b>菊石、三叶虫这类海洋生物留下的化石</b>——这片山地几亿年前曾是汪洋。海底的沉积岩层在<b>板块挤压</b>下褶皱、抬升，海床被举成了高山。</p>
<p>拖动「挤压抬升」滑杆，看水平的地层如何被挤成褶皱山，化石（🐚）随石灰岩层一起被抬到高处。</p>`,
    enter() {
      showGroup(gStrata, gCase);
      hideAllSprites();
      showOnly((s) => s.name === 'fo1' || s.name === 'fo2');
      fossilSprites.forEach((s) => { s.visible = true; });
      hud.show(true);
      hud.set('a', '化石所在高度 0 m');
      hud.set('b', '褶皱抬升 35%');
      hud.set('x', '');
      ctl.clear();
      ctl.slider({
        label: '挤压抬升', min: 0, max: 1, step: 0.01, value: strataState.t,
        fmt: (v) => Math.round(v * 100) + '%',
        onInput: (v) => { strataState.t = v; updateStrata(); },
      });
      ctl.button({
        label: '▶ 演示全过程',
        onClick: () => { state.strataAnim = !state.strataAnim; },
      });
      updateStrata();
      app.setCamera([1.5, 3.2, 10.5], [0, -0.3, 0]);
    },
    tick(dt) {
      if (!state.strataAnim) return;
      strataState.t += dt * 0.12;
      if (strataState.t > 1) strataState.t = 0;
      const s = ctl.el.querySelector('input[type=range]');
      if (s) s.value = strataState.t;
      updateStrata();
    },
  },
  {
    id: 'paleo', title: '海峡下的古河道',
    html: `<p>在台湾海峡的洋底，探测找到了<b>埋藏的古河道与河流相沉积</b>——冰期里洋面比现在低约 130 米，海峡因此敞露成片陆地，江河在陆桥上穿行；暖期洋面回升，古河谷重新没入水下，就成了「海峡下的古河道」。</p>
<p>拖动「海平面变化」（±140 米）看陆桥的出现与消失，开「露出古河道」找埋藏的河谷。</p>`,
    enter() {
      showGroup(gStrait);
      hideAllSprites();
      showOnly((s) => ['st1', 'st2', 'st3'].includes(s.name));
      hud.show(true);
      hud.set('a', '当前海平面 0 m');
      hud.set('b', '冰期低海面约 −130 m');
      hud.set('x', '');
      ctl.clear();
      ctl.slider({
        label: '海平面变化', min: -140, max: 40, step: 5, value: 0,
        fmt: (v) => (v > 0 ? '+' : '') + v + ' m',
        onInput: (v) => {
          straitState.level = v;
          const w = gStrait.getObjectByName('straitWater');
          if (w) w.position.y = 0.55 + v * 0.004;
          const ch = gStrait.getObjectByName('paleoChannel');
          if (ch) ch.visible = v < -50;
          const st4 = sprites.find((s) => s.name === 'st4');
          if (st4) st4.visible = v < -50;
          const gravel = gStrait.getObjectByName('paleoGravel');
          if (gravel) gravel.visible = v < -50;
          const raftX = gStrait.getObjectByName('straitRaft');
          if (raftX) raftX.visible = v > -60;   // 海退陆桥出露，渔排暂离
          sub.visible = v > -60;                // 潜艇同理
          hud.set('a', `当前海平面 ${v > 0 ? '+' : ''}${v} m`);
          hud.set('b', v < -60 ? '海峡出露 → 陆桥相连' : v < -30 ? '海峡变窄' : '海峡（海水覆盖）');
        },
      });
      ctl.button({
        label: '冰期 −130 m',
        onClick: () => {
          const input = ctl.el.querySelector('input[type=range]');
          if (input) { input.value = -130; input.dispatchEvent(new Event('input')); }
        },
      });
      app.setCamera([1.0, 4.0, 9.8], [0, 0.3, 0]);
    },
  },
  {
    id: 'wegener', title: '大陆漂移假说',
    html: `<p>1912 年，德国的气象学者<b>魏格纳</b>率先给出了<b>大陆漂移</b>假说：大西洋两侧大陆的轮廓彼此咬合，南美洲东缘与非洲西缘几乎能对接到一起。</p>
<p>证据：① 两岸地形轮廓吻合；② <b>中龙等淡水爬行动物化石</b>在两岸同时出现（淡水生物无法横渡大洋）；③ 舌羊齿植物化石广泛分布于南方各大陆；④ 古冰川擦痕的拼接。</p>
<p>点「演示分离」，看南美与非洲沿大西洋中脊缓缓裂开。</p>`,
    enter() {
      showGroup(gMap, gDesk);
      hideAllSprites();
      // 南方大陆一并亮出：古冰川擦痕证据跨南美/非洲/印度/澳大利亚分布
      for (const key of Object.keys(contMeshes)) contMeshes[key].visible = ['samerica', 'africa', 'namerica', 'eurasia', 'india', 'australia', 'antarctica'].includes(key);
      contMeshes.samerica.position.set(0, 0, 0);
      contMeshes.africa.position.set(0, 0, 0);
      contMeshes.india.position.set(0, 0, 0);
      contMeshes.australia.position.set(0, 0, 0);
      contMeshes.namerica.visible = false;
      contMeshes.eurasia.visible = false;
      epicenters.visible = false;
      evidGroup.visible = true;
      glacialGroup.visible = true;
      showEvid(true);
      state.driftK = 0;
      state.driftAnim = false;
      hud.show(false);
      ctl.clear();
      ctl.slider({
        label: '分离程度', min: 0, max: 1, step: 0.01, value: 0,
        fmt: (v) => Math.round(v * 100) + '%',
        onInput: (v) => { state.driftK = v; applyDrift(); },
      });
      ctl.button({
        label: '▶ 演示分离',
        onClick: () => { state.driftAnim = !state.driftAnim; },
      });
      ctl.sep();
      ctl.toggle({
        label: '化石与中脊标注', value: true,
        onChange: (v) => { showEvid(v); },
      });
      ctl.toggle({
        label: '古冰川擦痕', value: true,
        onChange: (v) => { glacialGroup.visible = v; },
      });
      applyDrift();
      app.setCamera([0, 5.5, 7.6], [0, 0, -0.5]);
    },
    tick(dt) {
      if (!state.driftAnim) return;
      state.driftK += dt * 0.1;
      if (state.driftK > 1) state.driftK = 0;
      const input = ctl.el.querySelector('input[type=range]');
      if (input) input.value = state.driftK;
      applyDrift();
    },
  },
  {
    id: 'pangaea', title: '泛大陆的分裂',
    html: `<p>约 <b>2.5 亿年前</b>，全球大陆聚合成一块「<b>泛大陆</b>」（Pangaea，盘古大陆），周围是泛大洋。此后泛大陆逐渐分裂、漂移，形成了今天的海陆分布。</p>
<p>拖动「地质年代」滑杆（2.5 亿年前 → 今天）或点「播放」，看大陆如何从聚合走向分离。</p>`,
    enter() {
      showGroup(gMap);
      hideAllSprites();
      for (const key of Object.keys(contMeshes)) {
        contMeshes[key].visible = true;
        contMeshes[key].userData.base = [0, 0];
      }
      evidGroup.visible = false;
      epicenters.visible = false;
      plateLines.visible = false;
      plateLabels.forEach((s) => { s.visible = false; s.userData.pole.visible = false; });
      hotDots.forEach((d) => { d.visible = false; });
      volcano.visible = false;
      quakeRings.forEach((r) => { r.visible = false; });
      state.ma = 250;
      state.playing = false;
      state.superOn = true;   // 泛大陆章默认亮出劳亚/冈瓦纳罩体
      gTimescale.visible = true;
      hud.show(true);
      hud.set('a', '距今年代 2.5 亿年前');
      hud.set('b', '泛大陆（盘古大陆）');
      hud.set('x', '');
      pangaeaAt(250);
      ctl.clear();
      ctl.slider({
        label: '地质年代', min: 0, max: 250, step: 1, value: 250,
        fmt: (v) => (v > 0 ? `${(v / 100).toFixed(2)} 亿年前` : '今天'),
        onInput: (v) => { state.ma = v; pangaeaAt(v); updateMaHud(); },
      });
      ctl.button({
        label: '▶ 播放',
        onClick(e) {
          state.playing = !state.playing;
          e.textContent = state.playing ? '⏸ 暂停' : '▶ 播放';
        },
      });
      ctl.sep();
      ctl.toggle({
        label: '古陆标注', value: true,
        onChange: (v) => { state.superOn = v; pangaeaAt(state.ma); },
      });
      ctl.toggle({ label: '板块边界', value: false, onChange: (v) => { plateLines.visible = v; } });
      app.setCamera([0, 6.4, 7.2], [0, 0, -0.5]);
    },
    tick(dt) {
      if (!state.playing) return;
      state.ma -= dt * 14;
      if (state.ma < 0) state.ma = 250;
      pangaeaAt(state.ma);
      updateMaHud();
      const input = ctl.el.querySelector('input[type=range]');
      if (input) input.value = state.ma;
    },
  },
  {
    id: 'plates', title: '六大板块',
    html: `<p>全球岩石圈划分为<b>六大板块</b>：亚欧板块、太平洋板块、美洲板块、非洲板块、印度洋板块、南极洲板块。板块<b>内部</b>相对安稳，<b>边界</b>一带地壳运动活跃。</p>
<p>红线即板块边界：红线下方大陆在漂移，海洋在生长与消亡。对照上一章的漂移动画，理解「大陆漂移」其实是「板块运动」的表现。</p>`,
    enter() {
      showGroup(gMap);
      hideAllSprites();
      for (const key of Object.keys(contMeshes)) {
        contMeshes[key].visible = true;
        contMeshes[key].userData.base = [0, 0];
        contMeshes[key].position.set(0, 0, 0);
      }
      state.superOn = false;   // 先关古陆罩再重算大陆位（否则 pangaeaAt 会带罩进本章）
      pangaeaAt(0);
      gTimescale.visible = false;
      evidGroup.visible = false;
      hotspotChain.visible = false;
      epicenters.visible = true;
      eqLabelSp.visible = true;
      plateLines.visible = true;
      plateLabels.forEach((s) => { s.visible = true; s.userData.pole.visible = true; });
      hotDots.forEach((d) => { d.visible = false; });
      volcano.visible = false;
      quakeRings.forEach((r) => { r.visible = false; });
      hud.show(false);
      ctl.clear();
      ctl.toggle({
        label: '板块名称', value: true,
        onChange: (v) => plateLabels.forEach((s) => { s.visible = v; s.userData.pole.visible = v; }),
      });
      ctl.toggle({ label: '边界红线', value: true, onChange: (v) => { plateLines.visible = v; } });
      app.setCamera([0, 6.4, 7.2], [0, 0, -0.5]);
    },
  },
  {
    id: 'quake', title: '火山与地震',
    html: `<p>板块交界带地壳活跃，全球绝大多数<b>火山与地震</b>都集中在这里，构成两大地震带：<b>环太平洋一带的火山地震带</b>（全球约 80% 的地震）与<b>地中海—喜马拉雅一带的火山地震带</b>。</p>
<p>黄色光点脉动处为典型活跃区，橙色圆锥是火山（示例：富士山）。开「地震波」看震中扩散的波纹。</p>`,
    enter() {
      showGroup(gMap, gSeismo);
      hideAllSprites();
      for (const key of Object.keys(contMeshes)) { contMeshes[key].visible = true; contMeshes[key].position.set(0, 0, 0); }
      state.superOn = false;
      pangaeaAt(0);
      gTimescale.visible = false;
      evidGroup.visible = false;
      epicenters.visible = true;
      eqLabelSp.visible = false;
      plateLines.visible = true;
      plateLabels.forEach((s) => { s.visible = false; s.userData.pole.visible = false; });
      hotDots.forEach((d) => { d.visible = true; });
      volcano.visible = true;
      hotspotChain.visible = true;
      smokeSprites.forEach((sp) => { sp.visible = true; });
      quakeRings.forEach((r) => { r.visible = state.hotOn; });
      sWaveRings.forEach((r) => { r.visible = state.hotOn; });
      hud.show(false);
      ctl.clear();
      ctl.toggle({
        label: '地震波', value: true,
        onChange: (v) => {
          state.hotOn = v;
          quakeRings.forEach((r) => { r.visible = v; });
          sWaveRings.forEach((r) => { r.visible = v; });
          seismoTrace.amp = v ? 1 : 0.18;   // 地震仪纸带幅度同步拨动
        },
      });
      ctl.sep();
      ctl.toggle({ label: '板块边界', value: true, onChange: (v) => { plateLines.visible = v; } });
      app.setCamera([0, 6.4, 7.2], [0, 0, -0.5]);
    },
    tick(dt) {
      const t = clockT;
      quakeRings.forEach((r) => {
        if (!r.visible) return;
        const ph = (t * 0.35 + r.userData.phase) % 1;
        r.scale.setScalar(0.5 + ph * 5);
        r.material.opacity = 0.85 * (1 - ph);
      });
      /* S 波环走得慢（速率为 P 波的 ~0.6），滞后相位拉开双层波前 */
      sWaveRings.forEach((r) => {
        if (!r.visible) return;
        const ph = (t * 0.22 + r.userData.phase) % 1;
        r.scale.setScalar(0.5 + ph * 5);
        r.material.opacity = 0.7 * (1 - ph);
      });
      hotDots.forEach((d, i) => {
        d.material.color.setHSL(0.06, 0.9, 0.5 + 0.2 * Math.sin(t * 3 + i * 1.7));
      });
    },
  },
  {
    id: 'boundary', title: '张裂与碰撞',
    html: `<p>板块边界的两种基本运动：<b>张裂</b>（生长边界）——板块向两侧分离，软流层岩浆上涌冷凝形成新的大洋地壳，如大西洋中脊、东非大裂谷；<b>碰撞</b>（消亡边界）——板块相向挤压，大洋板块俯冲消减、大陆边缘隆起形成岛弧与高大山脉，如喜马拉雅山。</p>
<p>拖动「运动进程」看左（张裂）右（碰撞）两边同时演化。</p>`,
    enter() {
      showGroup(gBound);
      hideAllSprites();
      showOnly((s) => s.name === 'bd1' || s.name === 'bd2');
      sprites.forEach((s) => { if (s.name === 'bd1' || s.name === 'bd2') s.visible = true; });
      hud.show(false);
      ctl.clear();
      ctl.slider({
        label: '运动进程', min: 0, max: 1, step: 0.01, value: boundState.t,
        fmt: (v) => Math.round(v * 100) + '%',
        onInput: (v) => { boundState.t = v; updateBound(); },
      });
      app.setCamera([3.1, 3.4, 8.6], [3.1, 0.6, 0]);
      updateBound();
    },
  },
  {
    id: 'quiz', title: '随堂检测',
    html: `<p>5 道选择题，检验海陆变迁的掌握情况。</p>`,
    enter() {
      showGroup(gMap);
      hideAllSprites();
      for (const key of Object.keys(contMeshes)) { contMeshes[key].visible = true; contMeshes[key].position.set(0, 0, 0); }
      state.superOn = false;
      pangaeaAt(0);
      gTimescale.visible = false;
      evidGroup.visible = false;
      hotspotChain.visible = false;
      epicenters.visible = false;
      eqLabelSp.visible = false;
      plateLines.visible = true;
      hotDots.forEach((d) => { d.visible = false; });
      volcano.visible = false;
      quakeRings.forEach((r) => { r.visible = false; });
      sWaveRings.forEach((r) => { r.visible = false; });
      hud.show(false);
      ctl.clear();
      app.setCamera([0, 6.4, 7.2], [0, 0, -0.5]);
      showQuiz();
    },
  },
];

function updateMaHud() {
  hud.set('a', state.ma > 0 ? `距今年代 ${(state.ma / 100).toFixed(2)} 亿年前` : '距今年代：今天');
  hud.set('b', state.ma > 220 ? '泛大陆聚合' : state.ma > 140 ? '开始分裂' : state.ma > 60 ? '大西洋张开，印度北漂' : '接近今日海陆格局');
  /* 年代弧尺游标随滑杆滑动（刻度映射与纹理上的画法保持一致） */
  if (timescaleCursor) {
    const u = 40 + (1 - state.ma / 250) * 944;
    timescaleCursor.position.x = (u / 1024 - 0.5) * 3.6;
  }
}

function applyDrift() {
  const k = state.driftK;
  const ease = k * k * (3 - 2 * k);   // 0=拼合 1=今日
  contMeshes.samerica.position.x = (1 - ease) * 1.15;
  contMeshes.africa.position.x = -(1 - ease) * 0.5;
  contMeshes.samerica.position.z = (1 - ease) * 0.16;
  if (evidGroup.visible) evidDots.forEach((s) => { s.visible = true; });
}

function showEvid(v) {
  evidGroup.visible = v;
  evidDots.forEach((s) => { s.visible = v; });
}

/* ---------------- 随堂检测 ---------------- */

const QUIZ = [
  {
    q: '喜马拉雅山上发现海洋生物化石，说明什么？',
    opts: ['生物曾生活在山上', '这里几亿年前是海洋，后来抬升成山', '化石是风吹来的', '山曾经下沉过'],
    a: 1,
    ex: '海底沉积岩中的海洋化石出现在高山上，说明这里曾是海洋，后经地壳抬升（板块碰撞挤压）成为高山——「沧海桑田」。',
  },
  {
    q: '大陆漂移学说由谁提出？',
    opts: ['哥白尼', '魏格纳', '达尔文', '李四光'],
    a: 1,
    ex: '1912 年，魏格纳——一位德国气象学者——率先系统地提出了大陆漂移学说；两岸轮廓的咬合、古生物与古冰川遗迹的跨洋对应，都是他的论据。',
  },
  {
    q: '以下哪项不算大陆漂移的证据？',
    opts: ['南美与非洲大陆轮廓的吻合', '中龙化石在南美和非洲都有分布', '各大陆上都发现有舌羊齿植物化石', '赤道地区全年高温多雨'],
    a: 3,
    ex: '赤道气候是纬度位置的结果，与大陆漂移无关；前三项正是魏格纳的经典证据。',
  },
  {
    q: '六大板块之间彼此张裂的地带，通常会出现什么？',
    opts: ['高大山脉', '裂谷或新的海洋（如东非大裂谷、大西洋）', '高原', '深海沟'],
    a: 1,
    ex: '生长边界（张裂）处岩浆上涌形成裂谷与新的大洋地壳；碰撞挤压处（消亡边界）才形成高大山脉与海沟。',
  },
  {
    q: '世界两大火山地震带是？',
    opts: ['环太平洋带和地中海—喜马拉雅带', '大西洋中脊和东非大裂谷', '环大西洋带和环印度洋带', '太平洋中脊和非洲带'],
    a: 0,
    ex: '两大地震带正处在板块交界带上：环太平洋一带集中着全球约 80% 的地震，另一条沿地中海—喜马拉雅山系展布。',
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
      <h3></h3><div class="q-opts"></div><div class="q-explain"></div>
      <div class="q-foot"><span class="q-score">得分：${score}</span></div>`;
    card.querySelector('h3').textContent = item.q;
    const optsBox = card.querySelector('.q-opts');
    item.opts.forEach((opt, i) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'quiz-opt';
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
        const next = document.createElement('button');
        next.type = 'button'; next.className = 'ctl-btn active';
        next.textContent = idx < QUIZ.length - 1 ? '下一题 →' : '查看成绩 →';
        next.addEventListener('click', () => { idx++; idx < QUIZ.length ? renderQ() : renderResult(); });
        card.querySelector('.q-foot').appendChild(next);
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
      <p style="color:var(--text-dim);margin:4px 0 18px">正确率 ${pct}%${pct >= 80 ? '，板块学得很扎实！' : pct >= 60 ? '，大部分概念已清楚，回顾一下错题。' : '，建议回到前面章节对照模型再看一遍。'}</p>`;
    const again = document.createElement('button');
    again.type = 'button'; again.className = 'ctl-btn active'; again.textContent = '重新测验';
    again.addEventListener('click', () => { idx = 0; score = 0; renderQ(); });
    const back = document.createElement('button');
    back.type = 'button'; back.className = 'ctl-btn'; back.textContent = '返回第一章节';
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
const driftShell = document.getElementById('driftShell');
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
  activeSectionCleanup();
  activeSectionCleanup = () => {};
  state.strataAnim = false;
  state.driftAnim = false;
  state.playing = false;
  state.coastAuto = false;
  hideAllSprites();
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

const FOLD_KEY = { l: 'drift.foldL', r: 'drift.foldR' };
let foldL = false;
let foldR = false;
let focusSaved = null; /* 进入专注模式前的独立折叠状态 [foldL, foldR]，退出时恢复 */

try {
  foldL = localStorage.getItem(FOLD_KEY.l) === '1';
  foldR = localStorage.getItem(FOLD_KEY.r) === '1';
} catch (e) { /* localStorage 不可用（隐私模式等）时仅本次会话内生效 */ }

function applyFold() {
  driftShell.classList.toggle('fold-l', foldL);
  driftShell.classList.toggle('fold-r', foldR);
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
  driftShell.classList.toggle('focus-mode', on);
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

const ACC_KEYS = { lesson: 'drift.accLesson', controls: 'drift.accControls', data: 'drift.accData' };
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

/* ---------------- 帧循环动效（只在对应场景可见时推进，省 draw 与 CPU） ---------------- */

function updateLabFx(dt) {
  const t = clockT;
  /* 章 1：海面顶点波动（叠加双正弦，波高随潮位微调） */
  if (gCoast.visible) {
    const w = gCoast.getObjectByName('coastWater');
    if (w) {
      const pos = w.geometry.attributes.position;
      const base = w.userData.waveBase;
      for (let i = 0; i < pos.count; i++) {
        const x = base[i * 3], z = base[i * 3 + 2];
        pos.setY(i, Math.sin(x * 1.35 + t * 1.9) * 0.035 + Math.cos(z * 1.7 + t * 1.4) * 0.03);
      }
      pos.needsUpdate = true;
    }
    const foam = gCoast.getObjectByName('coastFoam');
    if (foam) {
      const wY = state.seaLevel + 0.45;
      foam.position.set(Math.sin(t * 0.7) * 0.06, wY - 0.44, Math.cos(t * 0.5) * 0.045);
    }
  }
  /* 章 3：渔排随浪轻晃 + 灯塔光束旋转 + 深潜器沿闭环路径巡航（螺旋桨旋转、头灯扫海床） */
  if (gStrait.visible) {
    const raft = gStrait.getObjectByName('straitRaft');
    if (raft) {
      raft.rotation.z = Math.sin(t * 1.1) * 0.035;
      raft.position.y = 0.62 + Math.sin(t * 1.35) * 0.022;
    }
    const beamPivot = gStrait.getObjectByName('lhBeam');
    if (beamPivot) beamPivot.rotation.y = t * 1.1;
    const path = sub.userData.path;
    const prog = (t * 0.045) % 1;
    sub.position.copy(path.getPointAt(prog));
    sub.position.y += Math.sin(t * 0.9) * 0.05;
    const look = path.getPointAt((prog + 0.02) % 1);
    sub.lookAt(look);
    sub.rotateY(-Math.PI / 2);   // 艇首 +x 对齐行进方向
    sub.userData.prop.rotation.x += dt * 14;
    subLight.intensity = 1.8 + Math.sin(t * 2.7) * 0.5;   // 探照灯微闪，扫过河床
  }
  /* 章 4：桌面地球仪缓慢自转 + 罗盘磁针随磁偏角轻抖 */
  if (gDesk.visible) {
    if (deskGlobeSpin) deskGlobeSpin.rotation.y += dt * 0.16;
    const needle = gDesk.getObjectByName('compassNeedle');
    if (needle) needle.rotation.y = Math.sin(t * 0.7) * 0.06 + Math.sin(t * 1.9) * 0.025;
  }
  /* 章 6：板块边界发光管呼吸脉动 */
  if (plateLines.visible && plateLines.userData.tubeMats) {
    plateLines.userData.tubeMats.forEach((m, i) => {
      m.emissiveIntensity = 0.72 + 0.3 * Math.sin(t * 2.1 + i * 1.3);
    });
  }
  /* 章 7：烟柱上升 + 熔岩湖闪烁 + 地震仪滚筒与纸带（每帧推进波形） */
  if (volcano.visible) {
    volcanoLava.material.emissiveIntensity = 1.35 + Math.sin(t * 6.4) * 0.3;
    smokeSprites.forEach((sp, i) => {
      if (i < 8) {
        const ph = (t * 0.22 + sp.userData.phase) % 1;
        sp.position.set(Math.sin(ph * 5 + sp.userData.phase * 7) * 0.1, 0.72 + ph * 0.95, Math.cos(ph * 4) * 0.06);
        sp.scale.setScalar(0.18 + ph * 0.5);
        sp.material.opacity = 0.5 * (1 - ph);
      } else {
        /* 高空灰云：缓慢横漂 + 微升，循环回卷 */
        const ph = (t * 0.05 + sp.userData.phase) % 1;
        sp.position.x = -1.4 + ph * 2.8;
        sp.position.y = 1.15 + Math.sin(t * 0.4 + i) * 0.08;
        sp.material.opacity = 0.24 * Math.sin(ph * Math.PI);
      }
    });
  }
  if (gSeismo.visible && seismoTrace.ctx) {
    seismoDrum.rotation.x += dt * (state.hotOn ? 2.4 : 0.5);
    const c = seismoTrace.ctx;
    c.globalCompositeOperation = 'copy';
    c.drawImage(seismoTrace.cv, -2, 0);
    c.globalCompositeOperation = 'source-over';
    const y = 64 + (Math.sin(t * 9) * 12 + Math.sin(t * 23.7) * 7 + Math.sin(t * 4.3) * 6) * seismoTrace.amp
      + (Math.random() - 0.5) * 3 * seismoTrace.amp;
    c.strokeStyle = '#3c3450';
    c.lineWidth = 1.6;
    c.beginPath();
    c.moveTo(508, seismoTrace.lastY ?? y);
    c.lineTo(510.5, y);
    c.stroke();
    seismoTrace.lastY = y;
    seismoTrace.tex.needsUpdate = true;
  }
}

/* ---------------- 启动 ---------------- */

let clockT = 0;

loadAll([
  { key: 'sky', label: '环境光', job: loadHDR(TEXDIR + 'sky/sky_court-BLHJ2ADI.hdr') },
], (d, t, label) => loader.setText(`正在加载 ${d}/${t}（${label}）`)).then((t) => {
  scene.environment = t.sky;   /* HDR 只作环境反射光；背景由 attachVFX 的 illus 模式管理 */

  pangaeaAt(0);
  updateStrata();
  updateBound();

  loader.hide();
  window.__eduSections = { select: selectChapter };
  /* 调试句柄（自动化验收/像素级自查用） */
  window.__driftDebug = { vfx, app, state };
  selectChapter(0);

  app.onFrame((dt) => {
    /* 相机缓动由 attachVFX 接管（tickCamera 在渲染钩子内） */
    clockT += dt;
    /* 读数隐藏时（多数章节）数据手风琴块一并收走 */
    accSecs.data.classList.toggle('acc-empty', hud.el.style.display === 'none');
    const sec = SECTIONS[chapterIdx] || SECTIONS[0];
    if (sec.tick) sec.tick(dt);
    updateLabFx(dt);
    // 沧海桑田水位应用
    const w = gCoast.getObjectByName('coastWater');
    if (w) w.position.y = state.seaLevel + 0.45;
  });
}).catch((err) => {
  /* HDR 不可达时退回程序化摄影棚环境（金属/玻璃反射不受影响），页面照常可用 */
  scene.environment = makeStudioEnvironment(app.renderer);
  console.warn('HDR 加载失败，改用程序化环境反射：', err.message);

  pangaeaAt(0);
  updateStrata();
  updateBound();

  loader.hide();
  window.__eduSections = { select: selectChapter };
  window.__driftDebug = { vfx, app, state };
  selectChapter(0);

  app.onFrame((dt) => {
    clockT += dt;
    accSecs.data.classList.toggle('acc-empty', hud.el.style.display === 'none');
    const sec = SECTIONS[chapterIdx] || SECTIONS[0];
    if (sec.tick) sec.tick(dt);
    updateLabFx(dt);
    const w = gCoast.getObjectByName('coastWater');
    if (w) w.position.y = state.seaLevel + 0.45;
  });
});

let activeSectionCleanup = () => {};
