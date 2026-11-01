/* EduLab · 液体压强与浮力（float）
 * 章节：液体压强与深度 / 连通器：船闸 / 浮力的成因 / 称重法测浮力 / 阿基米德原理
 *       浮沉条件：潜艇 / 轮船与载重线 / 密度计与水尺计重 / 随堂检测
 * 布局（micro 三件套移植）：真·三栏教学布局——左栏课程大纲列表（点击切章）/ 中栏 3D 港湾舞台
 *       （相机飞行）/ 右栏知识点详解 + 本章控件 + 数据读数；左右栏独立折叠（28px 竖条）+
 *       专注模式 + 右栏三块手风琴（localStorage 记忆，切章不重置）；
 *       浮力曲线浮窗可折叠为 40px 圆形徽标（float.foldChart）。
 * 视觉工艺（edu-vfx 轻接入 + Micro 级建模）：
 *   - 深潜器/潜艇壳体：CatmullRom 轮廓放样（Lathe），舷侧分板/水线带用顶点色分区；
 *   - 货船船壳：沿船长 28 站位变半宽放样（自研 loft，艏尖削、艉圆、舷弧升高）；
 *   - 吊车吊臂：sweepRoundedSection 变宽截面沿 CatmullRom 中心线放样；
 *   - 溢水嘴/海带：CatmullRom 曲线 TubeGeometry；岩阵/气泡/海带叶 InstancedMesh；
 *   - 程序化纹理：混凝土/吃水标尺/载重线圆盘/容器瓦楞/密度计纸尺/深度水尺/闸墙铭牌/标签；
 *   - 光照氛围：主暖光 + 冷补光 + makeStudioEnvironment 程序化摄影棚反射 + 烘焙接触阴影；
 *   - 交互可视反馈：吊车卷筒随浸入转动、闸阀手轮随充水转动、螺旋桨常转、
 *     沉箱/密度计指针拖拽（射线拾取 + 竖直面求交）、密度计松手阻尼振荡、船体装偏横倾、
 *     浮力-浸入曲线窗实时描点。
 */
import {
  THREE, TAU, clamp,
  createApp, makeLoader,
  createControlsPanel, makeHUD, makeTextSprite, setSpriteText,
} from './edu-core.js';
import {
  attachVFX, PAL,
  matCoat, matStd, matGlow, matGlass,
  makeStudioEnvironment, makeWoodTexture, makeLabelTexture, fbm3, makeBackdropTexture,
} from './edu-vfx.js';

/* ---------------- 场景与工艺接入 ---------------- */

const stage = document.getElementById('stage');
const loader = makeLoader(stage, '正在注水入港…');
const app = createApp({
  container: stage,
  fov: 42, near: 0.1, far: 500,
  cameraPos: [10, 6, 14], target: [0, 0, 0],
  minDistance: 2, maxDistance: 90,
  keepBackground: true,
});
const { scene, camera, controls } = app;
/* 视觉工艺轻接入：后处理管线接管渲染循环与相机缓动（setCamera 升级为 cubic 运镜）；
   金属/玻璃反射走程序化摄影棚，不再引外部 HDR/天空贴图 */
const vfx = attachVFX(app, 'illus');
scene.environment = makeStudioEnvironment(app.renderer);

/* 背景档位：港湾晨空（水面章节）与深海水体（下潜章节），全程序化渐变 */
const skyBackdrop = makeBackdropTexture({ inner: '#8fc3e6', outer: '#2c4d68', glow: '#f2d8a8', glowStrength: 0.42 });
const uwBackdrop = makeBackdropTexture({ inner: '#1a6b92', outer: '#041d2b', glow: '#7fcbe0', glowStrength: 0.3 });
scene.background = skyBackdrop;

scene.add(new THREE.HemisphereLight(0xd9e8f7, 0x44525e, 0.62));
const sunLight = new THREE.DirectionalLight(0xfff0d8, 1.6);
sunLight.position.set(-12, 18, 9);
scene.add(sunLight);
const fillLight = new THREE.DirectionalLight(0xdfe8ff, 0.45);
fillLight.position.set(10, 7, -8);
scene.add(fillLight);

const G = 9.8;
const lerp = (a, b, t) => a + (b - a) * t;
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

/* ================= 工艺基建（材质分层 / 程序化纹理 / 几何小件） ================= */

/* 画布贴图工厂（颜色空间 + 各向异性一次配齐） */
function canvasTex(w, h, draw) {
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  draw(cv.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}
/* 灰度画布贴图（roughnessMap 用，线性空间 + 平铺） */
function dataTex(w, h, draw, repeat = 1) {
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  draw(cv.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  return tex;
}
/* 烤漆微噪点粗糙度贴图（漆面橘皮） */
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
/* 滚花法线贴图（阀门手轮/吊钩横杠防滑纹），列数与强度可调 */
function knurlNormalTexture(cols = 48, amp = 0.75) {
  const w = 512, h = 32;
  return dataTex(w, h, (ctx) => {
    for (let x = 0; x < w; x++) {
      const s = Math.sin((x / w) * cols * Math.PI * 2) * amp;
      ctx.fillStyle = `rgb(${Math.round((s * 0.5 + 0.5) * 255)},128,${Math.round(Math.sqrt(Math.max(0, 1 - s * s)) * 127 + 128)})`;
      ctx.fillRect(x, 0, 1, h);
    }
  });
}
/* 程序化混凝土：底色 + 骨料斑点 + 模板孔 + 水平浇筑缝 + 边缘泛霜 */
function concreteTexture(base = '#a8a49a', w = 512, h = 512, seed = 5) {
  let s = seed;
  const rnd = () => { s = (s * 16807 + 19) % 2147483647; return s / 2147483647; };
  return canvasTex(w, h, (ctx) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);
    /* 大块色斑（浇筑批次差异） */
    for (let i = 0; i < 26; i++) {
      const g = ctx.createRadialGradient(rnd() * w, rnd() * h, 0, rnd() * w, rnd() * h, 40 + rnd() * 120);
      const c = rnd() > 0.5 ? '190,186,176' : '142,138,128';
      g.addColorStop(0, `rgba(${c},${0.1 + rnd() * 0.14})`);
      g.addColorStop(1, `rgba(${c},0)`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }
    /* 骨料细斑点 */
    for (let i = 0; i < 2600; i++) {
      ctx.fillStyle = rnd() > 0.5 ? `rgba(60,58,52,${0.05 + rnd() * 0.16})` : `rgba(224,220,208,${0.05 + rnd() * 0.13})`;
      const r = 0.6 + rnd() * 2.4;
      ctx.beginPath();
      ctx.arc(rnd() * w, rnd() * h, r, 0, TAU);
      ctx.fill();
    }
    /* 模板对拉螺栓孔（横竖成排的小凹圆） */
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
    /* 水平浇筑缝 + 泛霜 */
    for (const fy of [h * 0.33, h * 0.66]) {
      ctx.fillStyle = 'rgba(70,68,62,0.34)';
      ctx.fillRect(0, fy, w, 2.4);
      ctx.fillStyle = 'rgba(238,236,228,0.2)';
      ctx.fillRect(0, fy + 2.4, w, 3.2);
    }
  });
}
/* 吃水标尺贴图（主刻度数字 = m×mult，白底黑字耐海水；mult=1 米尺 / 10 深度尺） */
function draftScaleTexture(mult = 1) {
  return canvasTex(128, 1024, (ctx, w, h) => {
    ctx.fillStyle = '#e8e2ce';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(120,110,90,0.14)';
    for (let i = 0; i < 340; i++) ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
    ctx.fillStyle = '#1c1a16';
    ctx.textAlign = 'center';
    for (let m = 0; m <= 6; m++) {          // 每 1 m 一条长划 + 汉字数字位（奇偶错位）
      const y = (m / 6) * (h - 40) + 20;
      ctx.fillRect(14, y, 62, 13);
      ctx.font = '700 46px "PingFang SC", sans-serif';
      ctx.fillText(String(m * mult), 88, y + 12);
      if (m < 6) {
        for (let d = 1; d < 10; d++) {      // 分米短划
          const y2 = y + (d / 10) * ((h - 40) / 6);
          ctx.fillRect(d % 5 === 0 ? 30 : 44, y2, d % 5 === 0 ? 46 : 32, 6);
        }
      }
    }
  });
}
/* 载重线圆盘贴图（Plimsoll：圆环 + 横线 + S/T/W/F/TF 各线与字母） */
function plimsollTexture() {
  return canvasTex(256, 256, (ctx, w, h) => {
    const c = w / 2;
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = '#e8e2ce';
    ctx.fillStyle = '#e8e2ce';
    ctx.lineWidth = 11;
    ctx.beginPath(); ctx.arc(c, c, 74, 0, TAU); ctx.stroke();
    ctx.lineWidth = 13;
    ctx.beginPath(); ctx.moveTo(c - 96, c); ctx.lineTo(c + 96, c); ctx.stroke();
    ctx.font = '700 30px "DejaVu Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    /* LR 船级社位（圆内上方），环外四线 S/T/W/F */
    ctx.fillText('LR', c, c - 30);
    const line = (dy, key, above) => {
      ctx.lineWidth = 7;
      ctx.beginPath(); ctx.moveTo(c - 44, c + dy); ctx.lineTo(c + 44, c + dy); ctx.stroke();
      ctx.fillText(key, c + 86, c + dy);
    };
    line(-64, 'T'); line(-30, 'S');
    line(38, 'W'); line(72, 'F');
  });
}
/* 船壳涂装贴图：v 坐标=型深方向（0=龙骨 → 1=舷顶），
   底部防污红 → 焊缝黑水线带 → 上层船壳漆 → 舷顶窄条 */
function hullPaintTexture(topColor = '#2f5d43') {
  return canvasTex(64, 512, (ctx, w, h) => {
    const bands = [
      [0.00, 0.55, '#7a3a2c'],   // 防污漆（水下红棕；轻载时露出水面即见-boot top）
      [0.55, 0.62, '#20242a'],   // 水线黑带（设计吃水附近）
      [0.62, 0.94, topColor],    // 船壳主漆
      [0.94, 1.00, '#d8d2c0'],   // 舷顶条
    ];
    for (const [a, b, col] of bands) {
      ctx.fillStyle = col;
      ctx.fillRect(0, a * h, w, (b - a) * h + 1);
    }
    /* 钢板横缝（每 1/8 一条暗线）+ 焊点 */
    ctx.fillStyle = 'rgba(10,12,14,0.35)';
    for (let i = 1; i < 8; i++) ctx.fillRect(0, (i / 8) * h, w, 2);
    ctx.fillStyle = 'rgba(255,255,255,0.09)';
    for (let i = 0; i < 90; i++) ctx.fillRect(Math.random() * w, Math.random() * h, 2.4, 2.4);
  });
}
/* 容器瓦楞纹法线（竖向波纹，横向平铺） */
function corrugationNormal() {
  const w = 256, h = 64;
  const tex = dataTex(w, h, (ctx) => {
    for (let x = 0; x < w; x++) {
      const s = Math.sin((x / w) * 18 * Math.PI * 2);
      ctx.fillStyle = `rgb(${Math.round((s * 0.85 + 0.5) * 255)},128,128)`;
      ctx.fillRect(x, 0, 1, h);
    }
  }, 1);
  tex.repeat.set(3, 1);
  return tex;
}

/* ---- 材质分层（港湾教具族：船漆 / 混凝土 / 镀铬 / 黄铜 / 橡胶 / 玻璃 / 泡沫） ---- */
const PAINT_NOISE = paintNoiseTexture(3);
const KNURL = knurlNormalTexture();

function texStd(tex, rough = 0.85, extra = {}) {
  const m = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: rough, metalness: 0.02, ...extra });
  m.map = tex;
  return m;
}
/* 漆面（clearcoat + 橘皮粗糙度） */
function paintMat(color, opts = {}) {
  const m = matCoat(color, { roughness: 0.42, metalness: 0.07, clearcoat: 0.72, clearcoatRoughness: 0.26, ...opts });
  m.roughnessMap = PAINT_NOISE;
  m.envMapIntensity = 0.8;
  return m;
}
const M_CHROME = matStd(0xe6e9ee, { roughness: 0.16, metalness: 1 });
const M_SATIN = matStd(0xc9cdd3, { roughness: 0.3, metalness: 1 });
const M_BRASS = matStd(PAL.brass, { roughness: 0.3, metalness: 1 });
const M_STEEL_DARK = matStd(0x3a3d42, { roughness: 0.38, metalness: 0.9 });
const M_RUBBER = matStd(0x1d2126, { roughness: 0.9, metalness: 0.03 });
const M_MUD = matStd(0x5d5142, { roughness: 0.96, metalness: 0 });
const M_FOAM = matStd(0xf2efe6, { roughness: 0.7, metalness: 0 });
const M_WOOD_DARK = matStd(0x4e341e, { roughness: 0.72 });
const M_GLASS_TANK = matCoat(0xbfe4f5, { roughness: 0.05, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false });

/* ---- 圆角几何小工具 ---- */
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
/* 圆角平板（挤出+倒角，顶面 y=0），rot: 'flat' 平放 / 'up' 立起 */
function roundedSlab(w, d, h, r, mat, bevel = 0.015, rot = 'flat') {
  const g = new THREE.ExtrudeGeometry(roundedRectShape(w, d, r), {
    depth: h, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel,
    bevelSegments: 3, curveSegments: 14,
  });
  g.rotateX(rot === 'flat' ? -Math.PI / 2 : 0);
  if (rot === 'up') g.translate(0, 0, -h / 2);
  return new THREE.Mesh(g, mat);
}
/* 铭牌/贴花面片（多边形偏移防 z-fight） */
function decalPlane(tex, w, h) {
  const mat = new THREE.MeshStandardMaterial({
    map: tex, transparent: true, roughness: 0.55, metalness: 0,
    depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2,
  });
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
}
/* 黄铜滚花吊环（螺栓 + 圆环），沉箱/物块吊点通用 */
function liftEye(r = 0.09) {
  const g = new THREE.Group();
  const boss = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.6, r * 0.72, r * 0.4, 14), M_STEEL_DARK);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(r, r * 0.22, 8, 20), M_SATIN);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = r * 0.55;
  g.add(boss, ring);
  return g;
}

/* ---- 沿曲线的变宽截面放样（吊臂 / C 形结构件）：
 * 曲线 frame 的宽度轴固定世界 X、深度轴取切线×X；截面为圆角矩形环，
 * 宽深沿弧长关键帧 + smoothstep 缓动；端帽扇面封口（法线朝向自动翻转绕序） */
function sweepRoundedSection(curve, segs, wKeys, dKeys) {
  const rc = 0.3, seg = 5, ring = [];
  const cs = [[0.5 - rc, 0.5 - rc, 0], [0.5 - rc, -0.5 + rc, Math.PI / 2], [-0.5 + rc, -0.5 + rc, Math.PI], [-0.5 + rc, 0.5 - rc, Math.PI * 1.5]];
  for (const [cx, cy, a0] of cs) {
    for (let k = 0; k <= seg; k++) {
      const a = a0 + (k / seg) * (Math.PI / 2);
      ring.push([cx + Math.cos(a) * rc, cy + Math.sin(a) * rc]);
    }
  }
  const keyAt = (keys, t) => {
    for (let i = 0; i < keys.length - 1; i++) {
      if (t <= keys[i + 1][0]) {
        const [t0, v0] = keys[i], [t1, v1] = keys[i + 1];
        const k = (t - t0) / Math.max(t1 - t0, 1e-6);
        return v0 + (v1 - v0) * k * k * (3 - 2 * k);
      }
    }
    return keys[keys.length - 1][1];
  };
  const pts = curve.getSpacedPoints(segs);
  const ringM = ring.length;
  const pos = [], idx = [];
  const vAt = (i3) => new THREE.Vector3(pos[i3], pos[i3 + 1], pos[i3 + 2]);
  for (let i = 0; i <= segs; i++) {
    const t = i / segs, p = pts[i];
    const T = new THREE.Vector3().subVectors(pts[Math.min(segs, i + 1)], pts[Math.max(0, i - 1)]).normalize();
    const Nn = new THREE.Vector3().crossVectors(T, new THREE.Vector3(1, 0, 0)).normalize();
    const w = keyAt(wKeys, t), d = keyAt(dKeys, t);
    for (let k = 0; k < ringM; k++) {
      const [ux, vy] = ring[k];
      pos.push(p.x + ux * w, p.y + vy * d * Nn.y, p.z + vy * d * Nn.z);
    }
  }
  for (let i = 0; i < segs; i++) {
    for (let k = 0; k < ringM; k++) {
      const k1 = (k + 1) % ringM;
      const a = i * ringM + k, b = (i + 1) * ringM + k, c = (i + 1) * ringM + k1, dd = i * ringM + k1;
      idx.push(a, b, c, a, c, dd);
    }
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
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

/* CatmullRom 轮廓 → LatheGeometry（回转壳体：潜艇/深潜器/瓶身）。
 * prof: Vector2 数组（x=回转半径，y=沿轴），经 CatmullRom 平滑后采样 smoothSeg 点 */
function latheSmooth(prof, smoothSeg = 40, radial = 28) {
  const pts3 = prof.map((p) => new THREE.Vector3(p.x, p.y, 0));
  const curve = new THREE.CatmullRomCurve3(pts3, false, 'catmullrom', 0.5);
  const pts2 = curve.getSpacedPoints(smoothSeg).map((p) => new THREE.Vector2(Math.max(p.x, 0.001), p.y));
  return new THREE.LatheGeometry(pts2, radial);
}

/* 船壳放样：沿船长 stations 个站位，每站一条闭合剖面环（左舷舷顶 → 龙骨 → 右舷舷顶 → 甲板合拢），
 * 半宽/舷弧/艏艉收分按参数缓动；uv.x 沿船长（×6 平铺板缝），uv.y 为型深归一化高度。
 * 收尾自动校验绕序：取 +z 最远顶点的法线，朝内则整体翻转索引（防内外翻渲染丢失）。 */
function buildHullGeometry({ len = 12.6, depth = 3.0, beamHalf = 2.05, stations = 30, secPts = 14 }) {
  const pos = [], uv = [], idx = [];
  const sheer = (t) => 0.16 * Math.pow(Math.abs(t - 0.5) * 2, 2.2);           // 舷弧：艏艉上翘
  const halfW = (t) => {
    const bow = 1 - Math.pow(clamp((t - 0.62) / 0.38, 0, 1), 1.35);           // 艏尖削
    const stern = 0.82 + 0.18 * Math.pow(clamp(t / 0.16, 0, 1), 0.7);         // 艉微收
    return beamHalf * bow * stern;
  };
  const keelRise = (t) => depth * 0.42 * (Math.pow(clamp((0.1 - t) / 0.1, 0, 1), 1.4) + Math.pow(clamp((t - 0.9) / 0.1, 0, 1), 1.4));
  const deckY = (t) => depth * 0.56 + sheer(t);
  const rowM = secPts * 2 + 2;   /* U 环（2n+1 点）+ 甲板合拢点 */
  for (let i = 0; i <= stations; i++) {
    const t = i / stations;
    const x = -len / 2 + t * len;
    const hw = Math.max(halfW(t), 0.002);
    const kY = -depth * 0.62 + keelRise(t);
    const dY = deckY(t);
    for (let k = 0; k < rowM; k++) {
      let s, y;
      if (k <= secPts * 2) {
        s = (k / (secPts * 2)) * 2 - 1;                       /* -1 左舷 → 0 龙骨 → +1 右舷 */
        y = kY + (dY - kY) * Math.pow(Math.abs(s), 0.8);
      } else {
        s = -1; y = dY + 0.03;                                /* 甲板合拢（沿甲板面走回左舷） */
      }
      const z = hw * Math.sign(s) * Math.pow(Math.abs(s), 0.72);
      pos.push(x, y, z);
      uv.push(t * 6, clamp((y + depth * 0.62) / (depth * 1.2), 0, 1));
    }
  }
  for (let i = 0; i < stations; i++) {
    for (let k = 0; k < rowM - 1; k++) {
      const a = i * rowM + k, b = (i + 1) * rowM + k, c = (i + 1) * rowM + k + 1, d = i * rowM + k + 1;
      idx.push(a, b, c, a, c, d);
    }
  }
  /* 艏柱封板（收分到尖）与艉封板 */
  for (const end of [0, stations]) {
    const t = end / stations;
    const x = -len / 2 + t * len;
    const dY = deckY(t), kY = -depth * 0.62 + keelRise(t);
    const center = pos.length / 3;
    pos.push(x + (end === stations ? 0.42 : -0.3), (dY + kY) / 2, 0);
    uv.push(t * 6, 0.6);
    const base = end * rowM;
    for (let k = 0; k < rowM - 1; k++) {
      const a = base + k, b = base + k + 1;
      if (end === stations) idx.push(a, b, center); else idx.push(b, a, center);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  /* 绕序自检：+z 最远顶点若法线朝内（-z），整体翻转 */
  let zMaxI = -1, zMax = -Infinity;
  for (let i = 0; i < pos.length / 3; i++) { if (pos[i * 3 + 2] > zMax) { zMax = pos[i * 3 + 2]; zMaxI = i; } }
  if (geo.attributes.normal.getZ(zMaxI) < 0) {
    for (let i = 0; i < idx.length; i += 3) { const tmp = idx[i + 1]; idx[i + 1] = idx[i + 2]; idx[i + 2] = tmp; }
    geo.setIndex(idx);
    geo.computeVertexNormals();
  }
  return geo;
}

/* ---- 接触阴影：一张烘焙径向渐变贴图（单 draw call，免实时 shadowMap） ---- */
function shadowPatch(width, depth, blobs, y = 0.0045) {
  const CW = 512;
  const CH = Math.max(64, Math.round((512 * depth) / width));
  const cv = document.createElement('canvas');
  cv.width = CW; cv.height = CH;
  const ctx = cv.getContext('2d');
  for (const b of blobs) {
    const px = ((b.x + width / 2) / width) * CW;
    const pz = ((b.z + depth / 2) / depth) * CH;
    const rx = (b.w / width) * CW / 2;
    const rz = (b.d / depth) * CH / 2;
    const g = ctx.createRadialGradient(px, pz, 0, px, pz, Math.max(rx, rz));
    g.addColorStop(0, `rgba(8,6,3,${b.o ?? 0.4})`);
    g.addColorStop(0.55, `rgba(8,6,3,${(b.o ?? 0.4) * 0.5})`);
    g.addColorStop(1, 'rgba(8,6,3,0)');
    ctx.save();
    ctx.translate(px, pz);
    ctx.scale(rx / Math.max(rx, rz, 1e-4), rz / Math.max(rx, rz, 1e-4));
    ctx.translate(-px, -pz);
    ctx.fillStyle = g;
    ctx.fillRect(px - Math.max(rx, rz), pz - Math.max(rx, rz), Math.max(rx, rz) * 2, Math.max(rx, rz) * 2);
    ctx.restore();
  }
  const tex = new THREE.CanvasTexture(cv);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), new THREE.MeshBasicMaterial({
    map: tex, transparent: true, depthWrite: false,
  }));
  m.rotation.x = -Math.PI / 2;
  m.position.y = y;
  m.renderOrder = -1;
  return m;
}

/* ---- 3D 拖拽（竖直面求交）：沉箱上下拖 / 密度计按压 ----
 * pickables: 射线拾取目标（mesh 数组）；originFn: 拖拽平面锚点；
 * onDrag(point)：point 为指针在竖直平面上的世界坐标；控件在拖拽期间锁定 */
function makeYDragger(pickables, originFn, onDrag, onEnd) {
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const plane = new THREE.Plane();
  const hit = new THREE.Vector3();
  const camDir = new THREE.Vector3();
  let dragging = false;
  const dom = app.renderer.domElement;
  const setNdc = (e) => {
    const r = dom.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  };
  dom.addEventListener('pointerdown', (e) => {
    if (!pickables[0]) return;
    let vis = true;
    for (let o = pickables[0]; o; o = o.parent) { if (!o.visible) { vis = false; break; } }
    if (!vis) return;
    setNdc(e);
    ray.setFromCamera(ndc, camera);
    if (!ray.intersectObjects(pickables, false).length) return;
    dragging = true;
    controls.enabled = false;
    dom.setPointerCapture(e.pointerId);
    camera.getWorldDirection(camDir);
    camDir.y = 0;
    if (camDir.lengthSq() < 1e-6) camDir.set(0, 0, -1);
    camDir.normalize().negate();
    plane.setFromNormalAndCoplanarPoint(camDir, originFn());
    stage.style.cursor = 'grabbing';
  });
  dom.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    setNdc(e);
    ray.setFromCamera(ndc, camera);
    if (ray.ray.intersectPlane(plane, hit)) onDrag(hit);
  });
  const stop = () => {
    if (!dragging) return;
    dragging = false;
    controls.enabled = true;
    stage.style.cursor = '';
    if (onEnd) onEnd();
  };
  dom.addEventListener('pointerup', stop);
  dom.addEventListener('pointercancel', stop);
}

/* ---------------- 通用小件 ---------------- */

const M = (color, rough = 0.8, metal = 0) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal });
const box = (w, h, d, mat) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
const cyl = (rt, rb, h, mat, seg = 20) => new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);

function makeArrow(color) {
  const g = new THREE.Group();
  const hex = '#' + new THREE.Color(color).getHexString();
  const mat = new THREE.MeshBasicMaterial({ color });
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1, 10), mat);
  shaft.geometry.translate(0, 0.5, 0);
  const head = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.32, 12), mat);
  g.add(shaft, head);
  const lbl = makeTextSprite('', { fontSize: 30, color: hex, scale: 0.0065, bg: 'rgba(12,18,26,0.66)' });
  g.add(lbl);
  const up = new THREE.Vector3(0, 1, 0), q = new THREE.Quaternion(), dir = new THREE.Vector3();
  g.set = (from, to, text) => {
    dir.subVectors(to, from);
    const len = Math.max(dir.length(), 0.01);
    q.setFromUnitVectors(up, dir.clone().normalize());
    g.quaternion.copy(q);
    g.position.copy(from);
    shaft.scale.y = Math.max(len - 0.3, 0.05);
    head.position.y = len - 0.16;
    g.visible = true;
    if (text !== undefined) setSpriteText(lbl, text, { fontSize: 30, color: hex, scale: 0.0065, bg: 'rgba(12,18,26,0.66)' });
    lbl.position.set(0, len + 0.34, 0);
  };
  g.hide = () => { g.visible = false; };
  return g;
}
function lbl(text, color = '#e8f0fa', scale = 0.007) {
  return makeTextSprite(text, { fontSize: 30, color, scale, bg: 'rgba(12,18,26,0.6)' });
}
function makeRope(color = 0xd8ccb0, thick = 0.035) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(thick, thick, 1, 8), M(color, 0.9));
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
/* 系船柱（车削轮廓：法兰盘 → 鼓身 → 双角羊角） */
function makeBollard() {
  const g = new THREE.Group();
  const flange = new THREE.Mesh(new THREE.LatheGeometry([
    new THREE.Vector2(0.001, 0), new THREE.Vector2(0.3, 0), new THREE.Vector2(0.3, 0.05),
    new THREE.Vector2(0.2, 0.08), new THREE.Vector2(0.19, 0.34), new THREE.Vector2(0.26, 0.4),
    new THREE.Vector2(0.1, 0.5), new THREE.Vector2(0.001, 0.52),
  ], 8), M_STEEL_DARK);
  g.add(flange);
  const horn = cyl(0.075, 0.09, 0.34, M_STEEL_DARK, 12);
  horn.position.set(0.13, 0.44, 0);
  horn.rotation.z = -0.5;
  const horn2 = horn.clone();
  horn2.rotation.z = 0.5;
  horn2.position.x = -0.13;
  g.add(horn, horn2);
  return g;
}
/* 铆钉排（一列小半球，用于闸门/吊车结构件的接缝装饰） */
function rivetRow(n, span, r = 0.02) {
  const g = new THREE.Group();
  const geo = new THREE.SphereGeometry(r, 8, 6);
  const m = M_STEEL_DARK;
  for (let i = 0; i < n; i++) {
    const s = new THREE.Mesh(geo, m);
    s.position.set(lerp(-span / 2, span / 2, n === 1 ? 0.5 : i / (n - 1)), 0, 0);
    g.add(s);
  }
  return g;
}

/* ---------------- 波浪与水面 ---------------- */

function waveH(x, z, t) {
  return Math.sin(x * 0.55 + t * 1.25) * 0.075 + Math.cos(z * 0.8 + t * 0.9) * 0.055 + Math.sin((x + z) * 0.32 + t * 0.6) * 0.05;
}
const waters = [];   // {mesh, base}
function buildWater(g, w = 60, d = 44, y = 0, opacity = 0.78) {
  const geo = new THREE.PlaneGeometry(w, d, 56, 44);
  geo.rotateX(-Math.PI / 2);
  const mat = new THREE.MeshPhysicalMaterial({
    color: 0x2f7bb5, transparent: true, opacity,
    roughness: 0.16, metalness: 0.06, clearcoat: 0.7, clearcoatRoughness: 0.2,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = y;
  g.add(mesh);
  waters.push({ mesh, base: geo.attributes.position.clone() });
  return mesh;
}

/* ---------------- 场景注册（懒建） ---------------- */

const scenes = {};
let activeScene = null;
function setUnderwater(on, depthNorm = 0) {
  if (on) {
    scene.background = uwBackdrop;
    /* 水体随深度变浓：红光先被吸收，越深越蓝越暗（教学点：几十米只剩蓝绿） */
    scene.fog = new THREE.FogExp2(0x0b3a52, 0.03 + depthNorm * 0.012);
  } else {
    scene.background = skyBackdrop;
    scene.fog = null;
  }
  /* 水下观感：压低水面环境反射（否则掠射角把明亮摄影棚 env 全反射出来，一片惨白） */
  for (const w of waters) w.mesh.material.envMapIntensity = on ? 0.22 : 1;
}
function useScene(key, build) {
  if (activeScene && activeScene !== scenes[key]) activeScene.visible = false;
  if (!scenes[key]) {
    const g = new THREE.Group();
    g.visible = false;
    scene.add(g);
    scenes[key] = g;
  }
  const g = scenes[key];
  if (!g.userData.built) { build(g); g.userData.built = true; }
  g.visible = true;
  activeScene = g;
  return g;
}

/* ---------------- 港湾固定景物（程序化混凝土 + 系船柱 + 护舷） ---------------- */

const M_CONCRETE = matStd(0xffffff, { roughness: 0.92 });
M_CONCRETE.map = concreteTexture('#a2a096', 512, 512, 11);
const M_CONCRETE2 = matStd(0xffffff, { roughness: 0.94 });
M_CONCRETE2.map = concreteTexture('#b0aca0', 512, 512, 29);
const M_EDGE_STONE = matStd(0xd8d2c4, { roughness: 0.85 });

/** 码头岸壁：z>zd 一侧的岸台，顶面 y=topY；护木/系船柱/爬梯/泊位牌齐全 */
function buildQuay(g, topY, zd = 8, w = 60, depth = 14) {
  const q = box(w, topY, depth, M_CONCRETE);
  q.position.set(0, topY / 2, zd + depth / 2);
  g.add(q);
  /* 岸缘花岗岩压顶 + 橡胶 D 形护舷（等距 6 条） */
  const edge = box(w, 0.12, 0.55, M_EDGE_STONE);
  edge.position.set(0, topY + 0.06, zd + 0.27);
  g.add(edge);
  const fenderGeo = new THREE.CylinderGeometry(0.16, 0.16, 2.2, 12, 1, false, 0, Math.PI);
  fenderGeo.rotateX(Math.PI / 2);
  fenderGeo.rotateY(Math.PI / 2);
  const fenders = new THREE.InstancedMesh(fenderGeo, M_RUBBER, 6);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < 6; i++) {
    dummy.position.set(-24 + i * 9.6, topY - 0.55, zd + 0.06);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    fenders.setMatrixAt(i, dummy.matrix);
  }
  g.add(fenders);
  /* 系船柱（车削羊角）×4 */
  [[-12], [-4], [4], [12]].forEach(([x]) => {
    const b = makeBollard();
    b.position.set(x, topY, zd + 1.1);
    b.rotation.y = Math.PI / 2;
    g.add(b);
  });
  /* 岸壁爬梯（下到水面的检修梯） */
  const ladder = new THREE.Group();
  const railGeo = new THREE.CylinderGeometry(0.035, 0.035, topY + 1.6, 8);
  const r1 = new THREE.Mesh(railGeo, M_STEEL_DARK); r1.position.set(-0.22, -(topY + 1.6) / 2 + 0.8, 0);
  const r2 = r1.clone(); r2.position.x = 0.22;
  ladder.add(r1, r2);
  const rungGeo = new THREE.CylinderGeometry(0.028, 0.028, 0.44, 8);
  for (let i = 0; i < 8; i++) {
    const rg = new THREE.Mesh(rungGeo, M_STEEL_DARK);
    rg.rotation.z = Math.PI / 2;
    rg.position.set(0, 0.7 - i * ((topY + 1.0) / 7), 0);
    ladder.add(rg);
  }
  ladder.position.set(16, topY, zd + 0.12);
  g.add(ladder);
  /* 泊位编号牌 */
  const sign = decalPlane(makeLabelTexture(['3 号泊位', 'BERTH No.3'], { w: 256, h: 120, lineSizes: [40, 22] }), 2.4, 1.1);
  sign.position.set(-16, topY - 1.4, zd + 0.02);
  sign.rotation.y = Math.PI;
  g.add(sign);
}

/* ============ 01 液体压强与深度 ============ */

const PRS = { depth: 12, fresh: false, showArrows: true };
const ROCK_MAT = new THREE.MeshStandardMaterial({ color: 0x8f8878, roughness: 0.95, metalness: 0 });
/* 岩石基几何：二十面体细分 + fbm 顶点扰动（InstancedMesh 共享一份） */
function makeRockGeo(detail = 1) {
  const geo = new THREE.DodecahedronGeometry(0.26, detail);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const v = new THREE.Vector3().fromBufferAttribute(pos, i);
    const s = 1 + 0.34 * fbm3(v.x * 2.1, v.y * 2.1, v.z * 2.1, 17);
    v.multiplyScalar(s);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  return geo;
}
/* 海底岩阵（InstancedMesh，一次 42 颗，仅 1 draw call） */
function buildRockField(g, cx, cz, spanX, spanZ, y, count = 42) {
  const rocks = new THREE.InstancedMesh(makeRockGeo(1), ROCK_MAT, count);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < count; i++) {
    dummy.position.set(cx + (Math.random() - 0.5) * spanX, y + 0.1, cz + (Math.random() - 0.5) * spanZ);
    dummy.rotation.set(Math.random() * TAU, Math.random() * TAU, Math.random() * TAU);
    dummy.scale.setScalar(0.5 + Math.random() * 1.7);
    dummy.updateMatrix();
    rocks.setMatrixAt(i, dummy.matrix);
  }
  g.add(rocks);
}
/* 海带阵列：管状叶柄（CatmullRom 摆线，几何以根部为原点）+ 叶片 InstancedMesh，
 * 帧循环绕根部轻微摇曳 */
function buildKelpField(g, cx, cz, spanX, spanZ, y, count = 9) {
  const kelpMat = matStd(0x2f6b3f, { roughness: 0.66, metalness: 0, side: THREE.DoubleSide });
  const strands = [];
  const anchors = [];
  for (let i = 0; i < count; i++) {
    const x = cx + (Math.random() - 0.5) * spanX;
    const z = cz + (Math.random() - 0.5) * spanZ;
    const h = 1.6 + Math.random() * 3.4;
    const pts = [];
    for (let k = 0; k <= 5; k++) {
      const t = k / 5;
      pts.push(V3(Math.sin(t * 3.1 + i) * 0.5 * t, t * h, Math.cos(t * 2.3 + i * 1.7) * 0.4 * t));
    }
    const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 12, 0.045, 6), kelpMat);
    tube.position.set(x, y, z);
    g.add(tube);
    strands.push({ grp: tube, phase: Math.random() * TAU, h });
    anchors.push([x, z]);
    /* 叶片：同一份扁球几何 × 每株 5 片，全场景合并为一张 InstancedMesh */
  }
  const leafGeo = new THREE.SphereGeometry(0.3, 6, 4);
  leafGeo.scale(1, 0.22, 0.55);
  const leaves = new THREE.InstancedMesh(leafGeo, kelpMat, count * 5);
  const dummy = new THREE.Object3D();
  let li = 0;
  for (let i = 0; i < count; i++) {
    for (let k = 0; k < 5; k++) {
      const t = 0.3 + k * 0.16;
      dummy.position.set(
        anchors[i][0] + Math.sin(t * 3.1 + i) * 0.5 * t,
        y + t * strands[i].h,
        anchors[i][1] + Math.cos(t * 2.3 + i * 1.7) * 0.4 * t,
      );
      dummy.rotation.set(Math.random() * TAU, Math.random() * TAU, Math.random() * 0.8);
      dummy.scale.setScalar(0.7 + Math.random() * 0.9);
      dummy.updateMatrix();
      leaves.setMatrixAt(li++, dummy.matrix);
    }
  }
  g.add(leaves);
  return strands;
}
/* 呼吸气泡：上升→水面重置（InstancedMesh，帧循环刷矩阵） */
function buildBubbleField(g, cx, y, count = 24) {
  const bubbles = new THREE.InstancedMesh(new THREE.SphereGeometry(0.045, 8, 6),
    new THREE.MeshPhysicalMaterial({ color: 0xcfeaff, transparent: true, opacity: 0.4, roughness: 0.1, depthWrite: false }), count);
  const seeds = [];
  for (let i = 0; i < count; i++) seeds.push({ x: cx + (Math.random() - 0.5) * 3, z: (Math.random() - 0.5) * 2.4, y: y + Math.random() * 12, v: 0.5 + Math.random() * 0.8 });
  g.add(bubbles);
  return { mesh: bubbles, seeds, y0: y };
}

/** 深潜器（CatmullRom 轮廓放样壳体 + 部件独立造型 + 材质分层） */
function buildDeepSub() {
  const sub = new THREE.Group();
  const PAINT_Y = paintMat(0xf0b429);
  /* 耐压壳：轮廓经 CatmullRom 平滑后旋成 */
  const hullGeo = latheSmooth([
    new THREE.Vector2(0.2, -1.32), new THREE.Vector2(0.44, -1.02), new THREE.Vector2(0.55, -0.5),
    new THREE.Vector2(0.56, 0.2), new THREE.Vector2(0.49, 0.72), new THREE.Vector2(0.33, 1.1),
    new THREE.Vector2(0.13, 1.27), new THREE.Vector2(0.001, 1.33),
  ], 36, 24);
  const hull = new THREE.Mesh(hullGeo, PAINT_Y);
  hull.rotation.z = -Math.PI / 2;   /* +y(艏) → +x */
  sub.add(hull);
  /* 艏部观察窗：钢圈 + 玻璃穹面 */
  const winRim = new THREE.Mesh(new THREE.TorusGeometry(0.21, 0.045, 10, 22), M_SATIN);
  winRim.rotation.y = Math.PI / 2;
  winRim.position.set(1.12, 0.12, 0);
  const winGlass = new THREE.Mesh(new THREE.SphereGeometry(0.21, 18, 12, 0, TAU, 0, Math.PI / 2.4),
    matGlass(0xbfe8ff, { roughness: 0.08, opacity: 0.55 }));
  winGlass.rotation.z = Math.PI / 2;
  winGlass.position.set(1.12, 0.12, 0);
  sub.add(winRim, winGlass);
  /* 舷侧一排小圆窗（3 只）+ 舷名贴花 */
  for (let i = 0; i < 3; i++) {
    const p = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.022, 8, 14), M_SATIN);
    p.position.set(-0.3 + i * 0.5, 0.3, 0.545);
    p.rotation.x = 0.12;
    const glass = new THREE.Mesh(new THREE.CircleGeometry(0.07, 12), matGlass(0x9adfff, { opacity: 0.6 }));
    glass.position.set(-0.3 + i * 0.5, 0.3, 0.55);
    glass.rotation.x = 0.12;
    sub.add(p, glass);
    const p2 = p.clone(); p2.position.z = -0.545; p2.rotation.y = Math.PI;
    const g2 = glass.clone(); g2.position.z = -0.55; g2.rotation.y = Math.PI;
    sub.add(p2, g2);
  }
  const name = decalPlane(makeLabelTexture(['EDU-01', '深潜号'], { w: 220, h: 110, lineSizes: [34, 26], accent: '#7a5410' }), 0.6, 0.3);
  name.position.set(0.45, 0.02, 0.565);
  name.rotation.x = -0.06;
  sub.add(name);
  /* 指挥台（围壳）：圆角壳 + 观察窗带 + 顶部信号灯 */
  const sail = roundedSlab(0.6, 0.95, 0.36, 0.1, paintMat(0xd89a1d), 0.03, 'up');
  sail.position.set(-0.15, 0.62, 0);
  const sailWin = box(0.42, 0.13, 0.02, matGlass(0x1c3644, { opacity: 0.85 }));
  sailWin.position.set(-0.15, 0.72, 0.47);
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), matGlow(0xffd166, 1.1, { color: 0xffe2b0 }));
  beacon.position.set(-0.15, 0.86, 0);
  sub.add(sail, sailWin, beacon);
  /* 首尾升降舵 + 垂直舵（圆角板 + 端部弧） */
  const planeMat = paintMat(0xc98d18);
  const mkPlane = (w, d) => roundedSlab(w, d, 0.05, 0.024, planeMat, 0.012, 'flat');
  const bowPlane = mkPlane(1.5, 0.44); bowPlane.position.set(0.82, 0, 0); bowPlane.rotation.z = 0;
  const sternPlane = mkPlane(1.2, 0.4); sternPlane.position.set(-1.12, 0.05, 0);
  const rudder = roundedSlab(0.5, 0.7, 0.05, 0.024, planeMat, 0.012, 'up');
  rudder.position.set(-1.18, 0.12, 0);
  const rudder2 = rudder.clone(); rudder2.rotation.x = Math.PI / 2; rudder2.position.y = 0;
  sub.add(bowPlane, sternPlane, rudder, rudder2);
  /* 尾轴 + 四叶螺旋桨（帧循环自转） */
  const prop = new THREE.Group();
  const shaft = cyl(0.055, 0.055, 0.34, M_SATIN, 10);
  shaft.rotation.z = Math.PI / 2;
  shaft.position.x = -0.12;
  const hub = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 8), M_BRASS);
  const bladeGeo = new THREE.BoxGeometry(0.05, 0.34, 0.14);
  bladeGeo.translate(0, 0.2, 0);
  const blades = [];
  for (let i = 0; i < 4; i++) {
    const b = new THREE.Mesh(bladeGeo, M_BRASS);
    b.rotation.x = (i / 4) * TAU;
    b.rotation.y = 0.5;
    blades.push(b);
    prop.add(b);
  }
  prop.add(shaft, hub);
  prop.position.set(-1.32, 0, 0);
  sub.add(prop);
  /* 着底滑橇 ×2 + 支柱 */
  for (const zs of [0.42, -0.42]) {
    const skid = box(1.9, 0.06, 0.12, M_STEEL_DARK);
    skid.position.set(-0.1, -0.72, zs);
    const strutF = cyl(0.035, 0.035, 0.3, M_STEEL_DARK, 8); strutF.position.set(0.62, -0.56, zs); strutF.rotation.x = 0.35;
    const strutB = cyl(0.035, 0.035, 0.3, M_STEEL_DARK, 8); strutB.position.set(-0.8, -0.56, zs); strutB.rotation.x = -0.35;
    sub.add(skid, strutF, strutB);
  }
  /* 舷外挂泡沫杯（下潜被压小的教学道具）：绳 + 杯体（深度联动缩放） */
  const cupGrp = new THREE.Group();
  const lanyard = makeRope(0x999a96, 0.012);
  lanyard.set(V3(0, 0.1, 0), V3(0, 0.5, 0));
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.125, 0.2, 14), M_FOAM);
  cupGrp.add(lanyard, cup);
  sub.add(cupGrp);
  sub.userData.prop = prop;
  sub.userData.cupGrp = cupGrp;
  sub.userData.cup = cup;
  return sub;
}

function buildPressure(g) {
  /* 海底：fbm 顶点扰动的大平面 + 岩阵 + 海带 + 气泡 */
  const floorGeo = new THREE.PlaneGeometry(70, 50, 46, 34);
  floorGeo.rotateX(-Math.PI / 2);
  {
    const pos = floorGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      pos.setY(i, 0.4 * fbm3(x * 0.14, 0, z * 0.14, 9));
    }
    floorGeo.computeVertexNormals();
  }
  const floor = new THREE.Mesh(floorGeo, new THREE.MeshStandardMaterial({ color: 0xa89670, roughness: 0.97, metalness: 0 }));
  floor.position.y = -13.9;
  g.add(floor);
  buildRockField(g, 0, 0, 52, 30, -13.55);
  PRS.kelp = buildKelpField(g, 4, -6, 22, 10, -13.5);
  PRS.bubbles = buildBubbleField(g, -1.5, -13);
  /* 深潜器停驻点的烘焙接触阴影 */
  g.add(shadowPatch(14, 8, [{ x: -1.5, z: 0, w: 5, d: 3, o: 0.34 }], -13.36));
  /* 深度水尺：贴图刻度带（每 2 m 细刻 / 每 10 m 大刻）+ 背杆 */
  const ruler = new THREE.Group();
  const pole = cyl(0.045, 0.045, 12.4, M_SATIN, 10);
  pole.position.set(6.2, -6.8, -0.12);
  ruler.add(pole);
  const tapeMats = [];
  const tapeSide = M(0x8a8878, 0.7);
  const tapeFace = texStd(draftScaleTexture(10), 0.6);
  tapeMats.push(tapeFace, tapeFace);
  for (let i = 0; i < 4; i++) tapeMats.push(tapeSide);
  const tape = new THREE.Mesh(new THREE.BoxGeometry(0.05, 12, 0.3), tapeMats);
  tape.position.set(6.2, -6.8, 0);
  ruler.add(tape);
  g.add(ruler);
  /* 深潜器（放样壳体总成） */
  const sub = buildDeepSub();
  g.add(sub);
  PRS.sub = sub;
  PRS.arrows = [];
  for (let i = 0; i < 4; i++) { const a = makeArrow(0x8fd3ff); g.add(a); PRS.arrows.push(a); }
  const top = makeArrow(0xc9a2ff); g.add(top); PRS.top = top;
  const bot = makeArrow(0x7dffc4); g.add(bot); PRS.bot = bot;
  buildWater(g, 64, 48);
  updPressure();
}
function updPressure() {
  const rho = PRS.fresh ? 1000 : 1030;
  const d = PRS.depth;
  const p = rho * G * d;            // Pa（表压）
  const pAtm = p + 101325;          // 绝对压强（加大气压）
  const y = -d / 5 - 0.4;
  PRS.sub.position.set(-1.5, y, 0);
  PRS.sub.rotation.z = Math.sin(performance.now() * 0.0006) * 0.04;
  /* 泡沫杯：深处被压扁（非线性压缩，60 m 约缩到 82%） */
  const cupK = 1 - Math.pow(d / 60, 0.8) * 0.18;
  PRS.sub.userData.cup.scale.setScalar(Math.max(cupK, 0.5));
  PRS.sub.userData.cupGrp.position.set(-0.35, -0.86, 0.3);
  /* 水体雾密度随深度变浓 */
  if (scenes.pressure && scenes.pressure.visible && scene.fog) {
    scene.fog.density = 0.03 + (d / 60) * 0.012;
  }
  const show = PRS.showArrows && d > 0.3;
  const L = clamp(0.5 + d / 22, 0.5, 2.2);
  const dirs = [[1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1]];
  PRS.arrows.forEach((a, i) => {
    if (!show) { a.hide(); return; }
    const dv = new THREE.Vector3(...dirs[i]);
    const end = i < 2 ? 1.85 : 1.15;         // x 向艇身更长
    const from = new THREE.Vector3(-1.5, y, 0).addScaledVector(dv, end + L + 0.4);
    a.set(from, new THREE.Vector3(-1.5, y, 0).addScaledVector(dv, end), 'p=' + (p / 1000).toFixed(0) + ' kPa');
  });
  if (!show) { PRS.top.hide(); PRS.bot.hide(); }
  else {
    PRS.top.set(new THREE.Vector3(-1.5, y - 1.6 - L * 0.55, 0), new THREE.Vector3(-1.5, y - 0.85, 0), '向下的压强');
    PRS.bot.set(new THREE.Vector3(-1.5, y + 1.0 + L * 0.75, 0), new THREE.Vector3(-1.5, y + 0.62, 0), '向上的压强');
  }
  hset('p', (p / 1000).toFixed(1) + ' kPa');
  hset('patm', (pAtm / 1000).toFixed(1) + ' kPa');
  hset('ratm', '约 ' + (pAtm / 101325).toFixed(1) + ' 倍');
  hset('f1', ((pAtm * 1e-4)).toFixed(2) + ' N');
  hset('rho', rho + ' kg/m³');
  hset('d', d.toFixed(0) + ' m');
  hset('cup', (cupK * 100).toFixed(0) + ' %');
  hset('note', d < 0.3 ? '液面处（h≈0）表压≈0' : 'p=ρgh，随深度线性增大');
}

/* ============ 02 连通器：船闸 ============ */

const LOCK = { step: 0, level: 0, anim: -1 };
const LOCK_STEPS = [
  '船从下游驶入闸室，下游闸门关闭',
  '打开上游阀门：闸室与上游构成连通器，水位升高',
  '闸室水位与上游相平，打开上游闸门',
  '船驶出闸室，进入上游航道',
  '回程反向操作：放水到下游水位，船驶向下游',
];
/** 人字闸门板块（钢板 + 横梁肋 + 顶部检修桥 + 底部滚轮） */
function buildGateLeaf() {
  const gate = new THREE.Group();
  const skin = box(0.22, 3.2, 2.85, M_STEEL_DARK);
  gate.add(skin);
  for (let i = 0; i < 4; i++) {
    const rib = box(0.3, 0.24, 2.9, M(0x4a525c, 0.55, 0.5));
    rib.position.y = 1.25 - i * 0.78;
    gate.add(rib);
    const rivets = rivetRow(9, 2.7, 0.018);
    rivets.position.set(0.16, rib.position.y + 0.18, 0);
    rivets.rotation.x = Math.PI / 2;
    gate.add(rivets);
  }
  const walk = box(0.5, 0.07, 3.0, M(0x5d6771, 0.6, 0.5));
  walk.position.y = 1.66;
  gate.add(walk);
  for (const zs of [-1.4, 1.4]) {
    const post = cyl(0.03, 0.03, 0.62, M_SATIN, 8);
    post.position.set(0.2, 1.98, zs);
    gate.add(post);
  }
  const handrail = cyl(0.026, 0.026, 2.9, M_SATIN, 8);
  handrail.rotation.x = Math.PI / 2;
  handrail.position.set(0.2, 2.28, 0);
  gate.add(handrail);
  for (const zs of [-1.05, 1.05]) {
    const wheel = cyl(0.16, 0.16, 0.1, M_CHROME, 14);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(0, -1.62, zs);
    gate.add(wheel);
  }
  return gate;
}
/** 输水廊道阀门手轮（充水时转动） */
function buildValveWheel() {
  const g = new THREE.Group();
  const stem = cyl(0.05, 0.05, 0.3, M_SATIN, 10);
  stem.rotation.x = Math.PI / 2;
  const spin = new THREE.Group();
  const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.035, 8, 20), paintMat(0xb7413a));
  for (let i = 0; i < 3; i++) {
    const sp = box(0.04, 0.4, 0.035, M_BRASS);
    sp.rotation.z = (i / 3) * Math.PI;
    spin.add(sp);
  }
  const hubC = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), M_BRASS);
  spin.add(wheel, hubC);
  g.add(stem, spin);
  g.userData.spin = spin;
  return g;
}
/** 闸室拖船（小艇：船体 + 驾驶室 + 轮胎护舷 + 桅杆） */
function buildTugboat() {
  const tug = new THREE.Group();
  const hull = box(4.2, 1.1, 2.0, paintMat(0x3f7f5f));
  hull.position.y = 0.4;
  const bowShape = new THREE.Shape();
  bowShape.moveTo(-0.8, -0.95); bowShape.lineTo(0, 0); bowShape.lineTo(0.8, 0); bowShape.lineTo(0.8, -0.95); bowShape.closePath();
  const bowGeo = new THREE.ExtrudeGeometry(bowShape, { depth: 1.05, bevelEnabled: false });
  bowGeo.rotateY(Math.PI / 2);
  bowGeo.translate(2.1, 0.93, 0);
  const bow = new THREE.Mesh(bowGeo, hull.material);
  const rub = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.1, 8, 16), M_RUBBER);
  rub.rotation.y = Math.PI / 2;
  for (let i = 0; i < 3; i++) {
    const r = rub.clone();
    r.position.set(-1.2 + i * 1.2, 0.35, 1.02);
    tug.add(r);
    const r2 = r.clone(); r2.position.z = -1.02;
    tug.add(r2);
  }
  const cabin = box(1.2, 1.0, 1.6, paintMat(0xe8e4da));
  cabin.position.set(-1.2, 1.4, 0);
  const cabinWin = box(1.22, 0.34, 1.62, matGlass(0x1c3644, { opacity: 0.8 }));
  cabinWin.position.set(-1.2, 1.62, 0);
  const mast = cyl(0.04, 0.05, 1.3, M_SATIN, 8);
  mast.position.set(-1.2, 2.5, 0);
  const light = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), matGlow(0xffd166, 0.9, { color: 0xffe2b0 }));
  light.position.set(-1.2, 3.2, 0);
  const deck = box(4.3, 0.08, 2.1, M(0x8f6a4a, 0.8));
  deck.position.y = 1.0;
  tug.add(hull, bow, cabin, cabinWin, mast, light, deck);
  return tug;
}
function buildLock(g) {
  buildQuay(g, 4.2, 7.5, 60, 14);
  /* 闸室两侧墙（混凝土贴图 + 帽石 + 廊道进水口拱 + 铭牌） */
  const wallGeo = new THREE.BoxGeometry(10, 3.4, 0.5);
  for (const zs of [-1.75, 1.75]) {
    const wl = new THREE.Mesh(wallGeo, M_CONCRETE2);
    wl.position.set(0, 1.7, zs);
    g.add(wl);
    const cap = box(10.3, 0.16, 0.72, M_EDGE_STONE);
    cap.position.set(0, 3.48, zs);
    g.add(cap);
    for (const xs of [-3.2, 3.2]) {   /* 输水廊道出水口（半圆拱暗嵌） */
      const arch = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.54, 14, 1, false, 0, Math.PI), M(0x23282e, 0.9));
      arch.rotation.x = Math.PI / 2;
      arch.position.set(xs, 0.52, zs + (zs > 0 ? -0.01 : 0.01));
      g.add(arch);
    }
  }
  const plate = decalPlane(makeLabelTexture(['船闸', 'LOCK · 通航水位差 2.6 m'], { w: 300, h: 130, lineSizes: [46, 22], accent: '#3a4a5a' }), 2.6, 1.15);
  plate.position.set(0, 2.2, 1.53);
  g.add(plate);
  /* 上、下游闸门（可升降板 + 人字门细节） */
  const gateU = buildGateLeaf(); gateU.position.set(4.8, 1.4, 0); g.add(gateU);
  const gateD = buildGateLeaf(); gateD.position.set(-4.8, 1.4, 0); g.add(gateD);
  LOCK.gateU = gateU; LOCK.gateD = gateD;
  /* 阀门手轮（墙顶，step1 充水时旋转） */
  LOCK.valveWheel = buildValveWheel();
  LOCK.valveWheel.position.set(6.3, 3.75, 1.15);
  LOCK.valveWheel.rotation.y = Math.PI / 2;
  g.add(LOCK.valveWheel);
  /* 上游高水位水体（左外侧）与下游低水位（右外侧） */
  const wUp = box(14, 2.6, 3.4, new THREE.MeshPhysicalMaterial({ color: 0x2f7bb5, transparent: true, opacity: 0.75, roughness: 0.2 }));
  wUp.position.set(13.5, 1.3, 0); g.add(wUp);
  LOCK.wUp = wUp;
  /* 闸室水体（水位动画） */
  const chamber = box(9.0, 1.0, 3.0, new THREE.MeshPhysicalMaterial({ color: 0x3385c2, transparent: true, opacity: 0.72, roughness: 0.2 }));
  g.add(chamber);
  LOCK.chamber = chamber;
  buildWater(g, 24, 4.6, 0, 0.75).position.x = -13.5;
  /* 拖船 */
  const boat = buildTugboat();
  g.add(boat);
  LOCK.boat = boat;
  LOCK.tags = {
    up: lbl('上游（高位）', '#bfe3ff', 0.005),
    down: lbl('下游（低位）', '#bfe3ff', 0.005),
    ch: lbl('闸室', '#ffe1a8', 0.005),
  };
  LOCK.tags.up.position.set(13.5, 3.4, 0);
  LOCK.tags.down.position.set(-14, 1.5, 0);
  LOCK.tags.ch.position.set(0, 4.6, 0);
  g.add(LOCK.tags.up, LOCK.tags.down, LOCK.tags.ch);
  LOCK.valveTag = lbl('▲ 输水阀门', '#7dffc4', 0.0045);
  LOCK.valveTag.position.set(6.3, 4.5, 0);
  g.add(LOCK.valveTag);
  LOCK.stageLbl = lbl('', '#ffffff', 0.006);
  LOCK.stageLbl.position.set(0, -2.4, 0);
  g.add(LOCK.stageLbl);
  setLockStep(0, true);
}
function setLockStep(i, instant = false) {
  LOCK.step = clamp(i, 0, 4);
  if (instant) LOCK.level = LOCK.step === 0 ? 0 : LOCK.step >= 2 ? 2.6 : 0;
  LOCK.anim = -1;
  setSpriteText(LOCK.stageLbl, (LOCK.step + 1) + '．' + LOCK_STEPS[LOCK.step], { fontSize: 32, color: '#ffffff', scale: 0.006, bg: 'rgba(12,18,26,0.66)' });
  hset('stage', (LOCK.step + 1) + ' / 5');
  hset('desc', LOCK_STEPS[LOCK.step]);
  hset('princ', LOCK.step === 1 ? '连通器：静止时各容器液面相平' : '闸室水位 ' + (2.6).toFixed(1) + ' m 级差中的 ' + LOCK.level.toFixed(1) + ' m');
  layoutLock();
}
function layoutLock() {
  const lv = LOCK.level;
  LOCK.chamber.scale.y = Math.max(lv, 0.001);
  LOCK.chamber.position.y = lv / 2;
  const boatFloat = Math.max(lv - 0.35, 0.28);
  const out = LOCK.step >= 3;
  LOCK.boat.position.set(out ? 10.5 : 0, boatFloat, 0);
  LOCK.gateU.position.y = LOCK.step >= 2 ? 4.6 : 1.4;
  LOCK.gateD.position.y = LOCK.step >= 1 ? 4.6 : 1.4;
  LOCK.valveTag.visible = LOCK.step === 1;
}

/* ============ 03 浮力的成因（沉箱可拖拽） ============ */

const CUBE = { size: 1.2, depth: 0.5, showNum: true, sealed: false };
function buildCube(g) {
  /* 玻璃水箱：钢框四角柱 + 顶圈 + 玻璃壳 + 器壁弯月面 */
  const steelM = M(0x8fa3ad, 0.5, 0.4);
  const tank = new THREE.Mesh(new THREE.BoxGeometry(5, 3.4, 4), M_GLASS_TANK);
  tank.position.y = 1.7 - 2.2;   // 箱底 -2.2，水面 0
  g.add(tank);
  for (const [xs, zs] of [[-2.5, -2], [2.5, -2], [-2.5, 2], [2.5, 2]]) {
    const post = box(0.09, 3.44, 0.09, steelM);
    post.position.set(xs, -0.5, zs);
    g.add(post);
  }
  for (const zs of [-2, 2]) {
    const rail = box(5.08, 0.09, 0.09, steelM);
    rail.position.set(0, 1.22, zs);
    g.add(rail);
  }
  const rim = new THREE.Mesh(new THREE.BoxGeometry(5.1, 0.08, 4.1), steelM);
  rim.position.y = 1.24;
  g.add(rim);
  buildWater(g, 4.96, 3.96, 0, 0.5);
  /* 箱底淤泥堆（沉箱坐底时可见） */
  const mudGeo = new THREE.SphereGeometry(1.15, 18, 10, 0, TAU, 0, Math.PI / 2);
  {
    const pos = mudGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const v = new THREE.Vector3().fromBufferAttribute(pos, i);
      const s = 1 + 0.2 * fbm3(v.x * 2.4, v.y * 2.4, v.z * 2.4, 31);
      v.multiplyScalar(s);
      pos.setXYZ(i, v.x, v.y * 0.4, v.z);
    }
    mudGeo.computeVertexNormals();
  }
  CUBE.mud = new THREE.Mesh(mudGeo, M_MUD);
  CUBE.mud.position.set(0, -2.18, 0);
  CUBE.mud.visible = false;
  g.add(CUBE.mud);
  /* 沉箱：混凝土圆角箱 + 四只吊环 + 提手（可整体拖拽） */
  const caisMat = matStd(0xffffff, { roughness: 0.9 });
  caisMat.map = concreteTexture('#b4a98f', 512, 512, 41);
  const cais = new THREE.Group();
  const body = roundedSlab(1, 1, 1, 0.07, caisMat, 0.035, 'flat');
  cais.add(body);
  const seam = box(1.02, 0.035, 1.02, M(0x8a8068, 0.9));
  seam.position.y = 0.5;
  cais.add(seam);
  for (const [xs, zs] of [[-0.34, -0.34], [0.34, -0.34], [-0.34, 0.34], [0.34, 0.34]]) {
    const eye = liftEye(0.09);
    eye.position.set(xs, 0.5, zs);
    cais.add(eye);
  }
  g.add(cais);
  CUBE.cube = cais;   /* 兼容既有 updCube 引用（整体缩放/定位） */
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.02, 1.02, 1.02)), new THREE.LineBasicMaterial({ color: 0xffd166, transparent: true, opacity: 0.55 }));
  cais.add(edges);
  CUBE.aTop = makeArrow(0xc9a2ff); g.add(CUBE.aTop);
  CUBE.aBot = makeArrow(0x7dffc4); g.add(CUBE.aBot);
  CUBE.aSide = [];
  for (let i = 0; i < 2; i++) { const a = makeArrow(0x9fb4c4); g.add(a); CUBE.aSide.push(a); }
  updCube();
  /* 上下拖动沉箱（射线拾取 + 竖直面求交 → 上表面深度） */
  makeYDragger(
    [body],
    () => cais.position.clone(),
    (hit) => { CUBE.depth = clamp(-(hit.y + CUBE.size / 2), -1.4, 2); updCube(); syncCUBEControls(); },
  );
}

function updCube() {
  const a = CUBE.size;                      // 棱长 m
  CUBE.cube.scale.setScalar(a);
  const topY = -CUBE.depth;                 // 上表面深度（正值=在水下）
  const botY = topY - a;
  CUBE.cube.position.set(0, topY - a / 2, 0);
  const pTop = Math.max(-topY, 0) * 9800;   // Pa（顶面在水下才有）
  const pBot = CUBE.sealed ? 0 : Math.max(-botY, 0) * 9800;   // 底面陷进淤泥：下面没有水
  const net = (pBot - pTop) * a * a;
  CUBE.mud.visible = CUBE.sealed;
  const visible = CUBE.showNum;
  // 顶面箭头（下压）
  if (pTop > 50) {
    const L = clamp(pTop / 12000, 0.25, 1.6);
    CUBE.aTop.set(new THREE.Vector3(0, topY - L - 0.05, 0), new THREE.Vector3(0, topY, 0), visible ? 'p顶=' + (pTop / 1000).toFixed(1) + ' kPa' : '');
  } else CUBE.aTop.hide();
  // 底面箭头（上托）
  const Lb = clamp(pBot / 12000, 0.3, 2.2);
  if (pBot > 50) CUBE.aBot.set(new THREE.Vector3(0, botY + Lb + 0.05, 0), new THREE.Vector3(0, botY, 0), visible ? 'p底=' + (pBot / 1000).toFixed(1) + ' kPa' : '');
  else CUBE.aBot.hide();
  // 侧面一对（前后方向），说明侧向抵消
  const Ls = clamp((pTop + pBot) / 2 / 14000, 0.2, 1.2);
  CUBE.aSide[0].set(new THREE.Vector3(0, (topY + botY) / 2, -Ls - a / 2 - 0.05), new THREE.Vector3(0, (topY + botY) / 2, -a / 2), '侧面相互抵消');
  CUBE.aSide[1].set(new THREE.Vector3(0, (topY + botY) / 2, Ls + a / 2 + 0.05), new THREE.Vector3(0, (topY + botY) / 2, a / 2), '');
  hset('ptop', pTop > 50 ? (pTop / 1000).toFixed(1) + ' kPa' : '0（露出水面）');
  hset('pbot', CUBE.sealed ? '0（底面无水）' : (pBot / 1000).toFixed(1) + ' kPa');
  hset('ftop', pTop > 50 ? (pTop * a * a / 1000).toFixed(2) + ' kN' : '0');
  hset('fbot', CUBE.sealed ? '0' : (pBot * a * a / 1000).toFixed(2) + ' kN');
  hset('fb', CUBE.sealed ? '0！底面没有水向上托' : (net / 1000).toFixed(2) + ' kN');
  hset('arch', CUBE.sealed ? '陷进淤泥/贴死容器底 → 无浮力（桥墩同理）' : 'F浮=(p底−p顶)·S=' + (net / 1000).toFixed(2) + ' kN');
}

/* ============ 04 称重法测浮力（塔吊 + 测力计 + 浮力曲线窗） ============ */

const WEI = { vol: 1, frac: 0, rhoObj: 2400, dipping: null };
/** 实验塔吊：混凝土基座 + 爬梯塔身 + 回转盘 + 变截面吊臂（CatmullRom 放样）+ 卷扬 + 吊钩 */
function buildCrane({ paint = 0xc2743a, signText = ['塔吊 · TC-EDU', '最大吊重 30 kN'], scale = 1 } = {}) {
  const crane = new THREE.Group();
  const PAINT = paintMat(paint);
  /* 基座：混凝土块 + 地脚螺栓 */
  const pedMat = matStd(0xffffff, { roughness: 0.92 });
  pedMat.map = concreteTexture('#9a968c', 384, 384, 53);
  const ped = roundedSlab(2.2, 2.2, 0.5, 0.08, pedMat, 0.04, 'flat');
  crane.add(ped);
  for (const [xs, zs] of [[-0.8, -0.8], [0.8, -0.8], [-0.8, 0.8], [0.8, 0.8]]) {
    const bolt = cyl(0.035, 0.035, 0.14, M_SATIN, 8);
    bolt.position.set(xs, 0.52, zs);
    crane.add(bolt);
  }
  /* 塔身：格构柱（四角柱 + 水平横撑）+ 铭牌 */
  const legGeo = new THREE.BoxGeometry(0.1, 3.4, 0.1);
  for (const [xs, zs] of [[-0.28, -0.28], [0.28, -0.28], [-0.28, 0.28], [0.28, 0.28]]) {
    const leg = new THREE.Mesh(legGeo, PAINT);
    leg.position.set(xs, 2.2, zs);
    crane.add(leg);
  }
  for (let i = 0; i < 3; i++) {
    for (const zs of [-0.28, 0.28]) {
      const brace = box(0.56, 0.07, 0.07, PAINT);
      brace.position.set(0, 0.9 + i * 1.15, zs);
      crane.add(brace);
      const brace2 = box(0.07, 0.07, 0.56, PAINT);
      brace2.position.set(zs, 0.9 + i * 1.15 + 0.55, 0);
      crane.add(brace2);
    }
  }
  /* 回转盘 + 驾驶室 + 铭牌 */
  const slew = cyl(0.42, 0.48, 0.28, M_STEEL_DARK, 18);
  slew.position.y = 4.02;
  crane.add(slew);
  const cab = roundedSlab(0.62, 0.66, 0.56, 0.09, PAINT, 0.03, 'flat');
  cab.position.set(0.28, 4.18, 0.34);
  const cabWin = box(0.5, 0.24, 0.02, matGlass(0x27414e, { opacity: 0.82 }));
  cabWin.position.set(0.28, 4.42, 0.66);
  crane.add(cab, cabWin);
  const plate = decalPlane(makeLabelTexture(signText, { w: 260, h: 110, lineSizes: [36, 22] }), 1.15, 0.5);
  plate.position.set(-0.36, 1.7, 0.315);
  crane.add(plate);
  /* 吊臂：变宽截面沿 CatmullRom 微拱中心线放样（工艺：sweepRoundedSection） */
  const jibCurve = new THREE.CatmullRomCurve3([
    V3(0, 4.14, -0.3), V3(0, 4.3, -1.5), V3(0, 4.36, -3.0), V3(0, 4.28, -4.4), V3(0, 4.14, -5.2),
  ]);
  const jib = new THREE.Mesh(sweepRoundedSection(
    jibCurve, 46,
    [[0, 0.52], [0.3, 0.44], [0.65, 0.36], [1, 0.3]],
    [[0, 0.44], [0.3, 0.4], [0.65, 0.34], [1, 0.28]],
  ), PAINT);
  crane.add(jib);
  /* 脊索拉杆（塔顶→吊臂中段） */
  const tie = makeRope(0xb8bcc2, 0.028);
  tie.set(V3(0, 4.85, 0), V3(0, 4.42, -3.4));
  crane.add(tie);
  const apex = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.42, 10), PAINT);
  apex.position.set(0, 4.95, 0);
  crane.add(apex);
  /* 配重臂（短）+ 配重块 */
  const cjib = box(0.4, 0.3, 1.5, PAINT);
  cjib.position.set(0, 4.14, 1.15);
  crane.add(cjib);
  const cwMat = matStd(0xffffff, { roughness: 0.92 });
  cwMat.map = concreteTexture('#8f8b82', 256, 256, 67);
  for (let i = 0; i < 2; i++) {
    const cw = box(0.7, 0.55, 0.5, cwMat);
    cw.position.set(0, 3.72 - i * 0.58, 1.55);
    crane.add(cw);
  }
  /* 卷扬卷筒（浸入时转动）+ 电机壳 */
  const drum = cyl(0.17, 0.17, 0.48, M_STEEL_DARK, 16);
  drum.rotation.x = Math.PI / 2;
  drum.position.set(0, 3.95, -0.15);
  const motor = roundedSlab(0.34, 0.42, 0.46, 0.06, M(0x4a4e54, 0.5, 0.6), 0.02, 'flat');
  motor.position.set(0, 3.92, 0.42);
  crane.add(drum, motor);
  /* 小车 + 双滑轮 + 吊钩组 */
  const trolley = new THREE.Group();
  const tbox = box(0.3, 0.22, 0.5, M_STEEL_DARK);
  trolley.add(tbox);
  for (const zs of [-0.14, 0.14]) {
    const sheave = cyl(0.09, 0.09, 0.05, M_CHROME, 14);
    sheave.rotation.x = Math.PI / 2;
    sheave.position.set(0, -0.12, zs);
    trolley.add(sheave);
  }
  trolley.position.set(0, 4.22, -4.85);
  crane.add(trolley);
  const hook = new THREE.Group();
  const hHousing = roundedSlab(0.22, 0.3, 0.16, 0.05, M_STEEL_DARK, 0.015, 'flat');
  const hSheave = cyl(0.08, 0.08, 0.05, M_CHROME, 14);
  hSheave.rotation.x = Math.PI / 2;
  hSheave.position.y = 0.12;
  const hookArc = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.032, 8, 16, Math.PI * 1.35), M_SATIN);
  hookArc.rotation.z = Math.PI * 0.82;
  hookArc.position.y = -0.16;
  hook.add(hHousing, hSheave, hookArc);
  hook.position.set(0, 4.0, -4.85);
  crane.add(hook);
  crane.scale.setScalar(scale);
  crane.userData = { drum, trolley, hook, tie, apex };
  return crane;
}
/** 弹簧测力计（吊秤）：吊环 + 壳体 + 刻度窗 + 实时偏转指针 + 下钩 */
function buildSpringGauge() {
  const g = new THREE.Group();
  const shackle = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.024, 8, 16), M_SATIN);
  shackle.position.y = 0.24;
  const body = cyl(0.2, 0.2, 0.3, paintMat(0xd8dce0, { clearcoat: 0.9 }), 22);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.026, 8, 24), M_SATIN);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = -0.15;
  /* 刻度窗（面向 +x 观察方向）+ 指针（示重 → 偏角） */
  const windowM = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.2), new THREE.MeshBasicMaterial({
    map: canvasTex(256, 200, (ctx, w, h) => {
      ctx.fillStyle = '#f4f0e2';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#2a2a2a';
      ctx.fillStyle = '#2a2a2a';
      ctx.textAlign = 'center';
      for (let i = 0; i <= 10; i++) {
        const x = 22 + (i / 10) * (w - 44);
        ctx.fillRect(x, 24, 3, i % 5 === 0 ? 22 : 12);
        if (i % 5 === 0) {
          ctx.font = '700 26px sans-serif';
          ctx.fillText(String(i), x, 74);
        }
      }
      ctx.font = '500 20px "PingFang SC", sans-serif';
      ctx.fillText('示重 kN', w / 2, 110);
      ctx.fillStyle = '#b33a2a';
      ctx.font = '700 30px sans-serif';
      ctx.fillText('F浮=G−F示', w / 2, 152);
    }),
  }));
  windowM.rotation.y = Math.PI / 2;
  windowM.position.set(0.201, 0.02, 0);
  const needle = box(0.008, 0.14, 0.03, M(0xb33a2a, 0.5));
  needle.geometry.translate(0, 0.07, 0);
  needle.rotation.z = Math.PI / 2;
  needle.position.set(0.205, -0.02, 0);
  const windowM2 = windowM.clone(); windowM2.rotation.y = -Math.PI / 2; windowM2.position.x = -0.201;
  const needle2 = needle.clone(); needle2.position.x = -0.205;
  const hookRing = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.02, 8, 16), M_SATIN);
  hookRing.rotation.x = Math.PI / 2;
  hookRing.position.y = -0.24;
  g.add(shackle, body, ring, windowM, windowM2, needle, needle2, hookRing);
  g.userData.needles = [needle, needle2];
  return g;
}
function buildWeigh(g) {
  buildQuay(g, 2.6, 6, 60, 14);
  /* 塔吊（放样吊臂总成），立柱在码头后沿，吊臂伸向水面 */
  const crane = buildCrane();
  crane.position.set(-1.2, 2.6, 7.0);
  g.add(crane);
  WEI.crane = crane;
  /* 吊索 + 测力计 + 混凝土块 */
  WEI.cable = makeRope(0xd8ccb0, 0.03); g.add(WEI.cable);
  const gauge = buildSpringGauge();
  g.add(gauge);
  WEI.gauge = gauge;
  WEI.gaugeLbl = lbl('', '#ffb46e', 0.005);
  g.add(WEI.gaugeLbl);
  const blkMat = matStd(0xffffff, { roughness: 0.92 });
  blkMat.map = concreteTexture('#a8a8a2', 384, 384, 71);
  const blk = new THREE.Group();
  const bbody = roundedSlab(1, 1, 1, 0.06, blkMat, 0.03, 'flat');
  blk.add(bbody);
  const beye = liftEye(0.08);
  beye.position.y = 0.52;
  blk.add(beye);
  g.add(blk);
  WEI.blk = blk;
  buildWater(g, 64, 48);
  updWeigh();
}
function updWeigh() {
  const V = WEI.vol;                        // m³
  const subF = WEI.frac;                    // 浸没体积比例
  const rhoW = 1030;
  const mObj = WEI.rhoObj * V;
  const Gt = mObj * G;
  const Fb = rhoW * G * V * subF;
  const Fshow = Gt - Fb;
  const topY = 2.2 - WEI.frac * 2.9;        // 块顶高度：从水上降到水下
  const blkSize = Math.cbrt(V);
  WEI.blk.scale.setScalar(blkSize);
  WEI.blk.position.set(-1.2, topY - blkSize / 2, 2);
  const hookY = topY + 0.35;
  WEI.cable.set(new THREE.Vector3(-1.2, 6.72, 2.05), new THREE.Vector3(-1.2, hookY + 0.28, 2.0));
  WEI.gauge.position.set(-1.2, hookY + 0.15, 2);
  WEI.gaugeLbl.position.set(-1.2, hookY + 0.62, 2);
  setSpriteText(WEI.gaugeLbl, '示重 ' + Fshow.toFixed(0) + ' N', { fontSize: 30, color: '#ffb46e', scale: 0.005, bg: 'rgba(12,18,26,0.66)' });
  /* 测力计指针偏角：示重 0..24 kN → ±72°（双面窗） */
  const ang = clamp(Fshow / 24000, 0, 1) * 2.51 - 1.26;
  for (const n of WEI.gauge.userData.needles) n.rotation.z = Math.PI / 2 + ang;
  /* 卷筒随浸入转动 */
  if (WEI.crane) WEI.crane.userData.drum.rotation.y = WEI.frac * 9;
  hset('g', Gt.toFixed(0) + ' N');
  hset('f', Fshow.toFixed(0) + ' N');
  hset('fb', Fb.toFixed(0) + ' N');
  hset('v', 'V排=' + (V * subF).toFixed(2) + ' m³');
  hset('note', subF >= 0.999 ? '完全浸没后再下放，浮力不再变化' : '浸入越多，排开的水越多，浮力越大');
  drawBuoyChart(Fb, rhoW * G * V);
}

/* ============ 05 阿基米德原理（溢水杯 + 接水烧杯 + 滴水动画） ============ */

const ARCH = { vol: 0.5, kind: 'stone', dipped: 0, dipping: null };
/** 实验桌：木纹台面 + 前后封边 + 车削桌腿 + 拉杆 + 烘焙接触阴影 */
function buildLabTable(g, w = 7, d = 3.4, topY = 1.1, seed = 61) {
  const woodTop = makeWoodTexture({ base: '#6e4c2c', dark: '#4a3120', light: '#8a6640', streaks: 96, bands: 7, seed });
  woodTop.repeat.set(2.2, 1.2);
  const benchMat = matStd(0xffffff, { roughness: 0.58, metalness: 0.04 });
  benchMat.map = woodTop;
  const top = box(w, 0.14, d, benchMat);
  top.position.y = topY - 0.07;
  g.add(top);
  for (const zs of [d / 2 - 0.09, -d / 2 + 0.09]) {
    const edge = box(w, 0.42, 0.1, M_WOOD_DARK);
    edge.position.set(0, topY - 0.34, zs);
    g.add(edge);
  }
  const legProf = [
    new THREE.Vector2(0.001, 0), new THREE.Vector2(0.17, 0), new THREE.Vector2(0.14, 0.06),
    new THREE.Vector2(0.1, 0.3), new THREE.Vector2(0.13, 0.62), new THREE.Vector2(0.09, 0.96),
    new THREE.Vector2(0.11, 1.0), new THREE.Vector2(0.001, 1.0),
  ];
  for (const [xs, zs] of [[-w / 2 + 0.35, -d / 2 + 0.35], [w / 2 - 0.35, -d / 2 + 0.35], [-w / 2 + 0.35, d / 2 - 0.35], [w / 2 - 0.35, d / 2 - 0.35]]) {
    const leg = new THREE.Mesh(new THREE.LatheGeometry(legProf, 16), M_WOOD_DARK);
    leg.position.set(xs, topY - 0.14 - 1.0, zs);
    g.add(leg);
  }
  for (const zs of [d / 2 - 0.5, -d / 2 + 0.5]) {
    const rod = cyl(0.045, 0.045, w - 1.2, M_WOOD_DARK, 10);
    rod.rotation.z = Math.PI / 2;
    rod.position.set(0, topY - 0.72, zs);
    g.add(rod);
  }
  /* 桌面接触阴影（主道具区） */
  g.add(shadowPatch(w, d, [
    { x: -1.4, z: 0, w: 2.2, d: 2.2, o: 0.32 },
    { x: 1.3, z: 0, w: 1.8, d: 1.8, o: 0.28 },
  ], topY - 0.135));
}
function buildArch(g) {
  buildLabTable(g, 7, 3.4, 1.1);
  /* 溢水杯：车削玻璃杯身 + CatmullRom 溢水嘴 */
  const glass = new THREE.MeshPhysicalMaterial({ color: 0xcfe9f5, transparent: true, opacity: 0.2, roughness: 0.05 });
  const prof = [
    new THREE.Vector2(0.62, 0), new THREE.Vector2(0.84, 0.03), new THREE.Vector2(0.85, 0.2),
    new THREE.Vector2(0.85, 1.55), new THREE.Vector2(0.88, 1.68), new THREE.Vector2(0.87, 1.72),
  ];
  const cup = new THREE.Mesh(latheSmooth(prof, 26, 30), glass);
  cup.position.set(-1.4, 1.18, 0);
  g.add(cup);
  const cupBottom = cyl(0.8, 0.84, 0.05, glass, 30); cupBottom.position.set(-1.4, 1.2, 0); g.add(cupBottom);
  const spoutCurve = new THREE.CatmullRomCurve3([
    V3(-0.62, 2.78, 0), V3(-0.5, 2.86, 0), V3(-0.38, 2.8, 0), V3(-0.3, 2.66, 0),
  ]);
  const spout = new THREE.Mesh(new THREE.TubeGeometry(spoutCurve, 12, 0.062, 10), glass);
  spout.position.set(-0.78, 0, 0);
  g.add(spout);
  ARCH.spout = spout;
  /* 杯内水（满到溢水口）+ 液面高光片 */
  ARCH.cupWater = cyl(0.8, 0.8, 1.55, new THREE.MeshPhysicalMaterial({ color: 0x3d8ec9, transparent: true, opacity: 0.6, roughness: 0.15 }), 26);
  ARCH.cupWater.position.set(-1.4, 1.24 + 0.78, 0);
  g.add(ARCH.cupWater);
  /* 小烧杯（接水）：车削 + 倒嘴 + 刻度贴花 */
  const beakProf = [
    new THREE.Vector2(0.4, 0), new THREE.Vector2(0.52, 0.02), new THREE.Vector2(0.55, 0.12),
    new THREE.Vector2(0.55, 0.95), new THREE.Vector2(0.56, 1.02), new THREE.Vector2(0.5, 1.06),
  ];
  const beak = new THREE.Mesh(latheSmooth(beakProf, 22, 26), glass);
  beak.position.set(1.3, 1.18, 0);
  g.add(beak);
  const grad = decalPlane(canvasTex(64, 256, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(40,60,70,0.75)';
    ctx.fillStyle = 'rgba(40,60,70,0.85)';
    for (let i = 0; i < 5; i++) {
      const y = h - 26 - i * ((h - 60) / 4);
      ctx.lineWidth = i % 2 === 0 ? 4 : 2.4;
      ctx.beginPath(); ctx.moveTo(8, y); ctx.lineTo(i % 2 === 0 ? 40 : 28, y); ctx.stroke();
    }
  }), 0.3, 0.9);
  grad.position.set(1.3, 1.7, 0.545);
  g.add(grad);
  ARCH.beakWater = cyl(0.5, 0.44, 0.01, new THREE.MeshPhysicalMaterial({ color: 0x3d8ec9, transparent: true, opacity: 0.6, roughness: 0.15 }), 22);
  ARCH.beakWater.position.set(1.3, 1.26, 0);
  g.add(ARCH.beakWater);
  /* 接水托盘 */
  const tray = roundedSlab(1.9, 1.5, 0.07, 0.12, M_SATIN, 0.02, 'flat');
  tray.position.set(1.3, 1.13, 0);
  g.add(tray);
  /* 流下的水柱 + 溅落水珠（InstancedMesh，帧循环滴落） */
  ARCH.stream = cyl(0.045, 0.06, 1, new THREE.MeshPhysicalMaterial({ color: 0x6fb8e8, transparent: true, opacity: 0.75, roughness: 0.1 }), 8);
  ARCH.stream.geometry.translate(0, 0.5, 0);
  ARCH.stream.position.set(-0.38, 2.42, 0);
  ARCH.stream.rotation.z = 0.28;
  ARCH.stream.visible = false;
  g.add(ARCH.stream);
  const dropGeo = new THREE.SphereGeometry(0.035, 8, 6);
  ARCH.drops = new THREE.InstancedMesh(dropGeo, new THREE.MeshPhysicalMaterial({ color: 0x8fc6ea, transparent: true, opacity: 0.8, roughness: 0.1 }), 7);
  ARCH.dropSeeds = [];
  for (let i = 0; i < 7; i++) ARCH.dropSeeds.push({ t: Math.random(), v: 1.4 + Math.random() * 0.8 });
  g.add(ARCH.drops);
  /* 物体（fbm 雕刻石块）+ 吊绳 + 吊钩 */
  const stoneGeo = new THREE.DodecahedronGeometry(1, 1);
  {
    const pos = stoneGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const v = new THREE.Vector3().fromBufferAttribute(pos, i);
      const s = 1 + 0.22 * fbm3(v.x * 1.8, v.y * 1.8, v.z * 1.8, 43);
      v.multiplyScalar(s);
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    stoneGeo.computeVertexNormals();
  }
  ARCH.obj = new THREE.Mesh(stoneGeo, matStd(0x8f8878, { roughness: 0.93 }));
  ARCH.obj.scale.setScalar(0.42);
  g.add(ARCH.obj);
  ARCH.rope = makeRope(); g.add(ARCH.rope);
  const hookA = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.016, 8, 14), M_SATIN);
  hookA.rotation.x = Math.PI / 2;
  ARCH.obj.add(hookA);
  hookA.position.y = 1.05;
  /* 铁架台：底座 + 立柱 + 十字夹（滚花螺栓） */
  const standMat = M(0x6f747b, 0.5, 0.6);
  const sBase = roundedSlab(0.7, 0.5, 0.06, 0.05, standMat, 0.015, 'flat');
  sBase.position.set(-1.4, 1.17, -0.9);
  const stand = box(0.08, 2.6, 0.08, standMat); stand.position.set(-1.4, 1.18 + 1.3, -0.9);
  const armB = box(0.08, 0.08, 1.0, standMat); armB.position.set(-1.4, 1.18 + 2.55, -0.4);
  const clampK = cyl(0.05, 0.05, 0.09, M_BRASS, 12);
  clampK.rotation.x = Math.PI / 2;
  clampK.position.set(-1.4, 1.18 + 2.55, -0.16);
  clampK.material.normalMap = KNURL;
  g.add(sBase, stand, armB, clampK);
  /* 原理提示牌（桌面小立牌） */
  const card = new THREE.Group();
  const board = box(1.15, 0.62, 0.03, M(0x2e3a30, 0.7));
  const text = decalPlane(canvasTex(512, 256, (ctx, w, h) => {
    ctx.fillStyle = '#22302a';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(200,220,200,0.5)';
    ctx.lineWidth = 6;
    ctx.strokeRect(10, 10, w - 20, h - 20);
    ctx.fillStyle = '#e8f2e4';
    ctx.textAlign = 'center';
    ctx.font = '700 64px "PingFang SC", sans-serif';
    ctx.fillText('F浮 = G排', w / 2, h / 2 - 14);
    ctx.font = '400 40px "PingFang SC", sans-serif';
    ctx.fillText('= ρ液·g·V排', w / 2, h / 2 + 62);
  }), 1.06, 0.53);
  text.position.z = 0.017;
  const foot1 = cyl(0.02, 0.02, 0.3, M_SATIN, 8); foot1.position.set(-0.4, -0.45, 0); foot1.rotation.x = 0.3;
  const foot2 = foot1.clone(); foot2.position.x = 0.4;
  card.add(board, text, foot1, foot2);
  card.position.set(0.6, 1.72, -1.15);
  card.rotation.y = -0.28;
  g.add(card);
  updArch();
}
function updArch() {
  const V = ARCH.vol;
  const kind = ARCH.kind;
  const rhoObj = kind === 'stone' ? 2600 : kind === 'wood' ? 600 : 2700;
  const t = ARCH.dipped;                     // 0..1 浸入过程
  const objR = 0.42 * Math.cbrt(V / 0.5);
  const objY = lerp(4.4, 1.24 + 1.1, t);     // 从高处降到杯内
  ARCH.obj.position.set(-1.4, objY, 0);
  ARCH.obj.scale.setScalar(objR);
  ARCH.rope.set(new THREE.Vector3(-1.4, 3.73, 0.1), new THREE.Vector3(-1.4, objY + objR, 0));
  const submerged = kind === 'wood' ? clamp(rhoObj / 1000, 0, 1) : 1;
  const Vdisp = kind === 'wood' ? V * submerged * (t > 0.85 ? 1 : 0) : V * (t > 0.85 ? 1 : 0);
  const Fb = 1000 * 9.8 * Vdisp;
  const Gdisp = Fb;
  const isFloat = kind === 'wood';
  ARCH.stream.visible = t > 0.55 && t < 0.98;
  const bwH = clamp(Vdisp / 0.75, 0.001, 0.9);
  ARCH.beakWater.scale.y = Math.max(bwH, 0.001);
  ARCH.beakWater.position.y = 1.26 + bwH / 2;
  const Gobj = rhoObj * V * 9.8;
  hset('fb', Fb.toFixed(1) + ' N');
  hset('gdisp', Gdisp.toFixed(1) + ' N');
  hset('gobj', Gobj.toFixed(1) + ' N');
  hset('vdisp', Vdisp.toFixed(2) + ' m³');
  hset('eq', Fb > 0 ? 'F浮 = G排 ✓（' + Fb.toFixed(1) + ' = ' + Gdisp.toFixed(1) + '）' : '把物体压入溢水杯试试');
  hset('note', isFloat ? '木块漂浮：F浮 = G木，排开的水更少' : (kind === 'stone' ? '石块密度大于水，浸没下沉' : '铝块浸没：V排 = 物体体积'));
}

/* ============ 06 浮沉条件：潜艇（放样艇体 + 压载水舱注水可视） ============ */

const SUB = { fill: 20, depth: 0, diving: null, jumpy: false };
/** 潜艇总成：CatmullRom 轮廓放样耐压壳 + 指挥台 + 升降舵/方向舵 + 五叶桨 + 压载水舱半透壳 */
function buildSubmarine() {
  const sub = new THREE.Group();
  /* 耐压壳：纵向放样（艏尖、艉收），舷侧分板缝贴图 */
  const hullTex = canvasTex(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#3d454e';
    ctx.fillRect(0, 0, w, h);
    /* 纵向板缝（沿艇长）+ 环向肋骨线 */
    ctx.strokeStyle = 'rgba(12,14,18,0.5)';
    for (let i = 1; i < 6; i++) { ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(0, (i / 6) * h); ctx.lineTo(w, (i / 6) * h); ctx.stroke(); }
    for (let i = 0; i < 14; i++) {
      const x = (i / 14) * w + Math.sin(i * 3.7) * 8;
      ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    /* 铆钉 */
    ctx.fillStyle = 'rgba(190,200,210,0.14)';
    for (let i = 0; i < 300; i++) ctx.fillRect(Math.random() * w, Math.random() * h, 2.2, 2.2);
    /* 出水口格栅 */
    ctx.fillStyle = 'rgba(10,12,14,0.6)';
    for (const gy of [h * 0.3, h * 0.72]) ctx.fillRect(w * 0.2, gy, 46, 8);
  });
  const hullMat = new THREE.MeshStandardMaterial({ map: hullTex, roughness: 0.52, metalness: 0.42 });
  const hullGeo = latheSmooth([
    new THREE.Vector2(0.3, -3.1), new THREE.Vector2(0.62, -2.6), new THREE.Vector2(0.78, -1.5),
    new THREE.Vector2(0.8, 0.6), new THREE.Vector2(0.72, 1.9), new THREE.Vector2(0.5, 2.8),
    new THREE.Vector2(0.2, 3.25), new THREE.Vector2(0.001, 3.4),
  ], 44, 30);
  const hull = new THREE.Mesh(hullGeo, hullMat);
  hull.rotation.z = -Math.PI / 2;   /* +y(艏) → +x */
  sub.add(hull);
  /* 指挥台（围壳）：圆角壳 + 观察窗 + 跳板扶手 + 潜望镜 */
  const sail = roundedSlab(0.95, 1.7, 0.72, 0.16, matStd(0x333b44, { roughness: 0.5, metalness: 0.4 }), 0.05, 'flat');
  sail.position.set(0.35, 1.02, 0);
  const sailWin = box(0.7, 0.2, 0.03, matGlass(0x14232c, { opacity: 0.9 }));
  sailWin.position.set(0.78, 1.28, 0);
  const sailWin2 = sailWin.clone(); sailWin2.rotation.y = Math.PI / 2; sailWin2.position.set(0.35, 1.28, 0.6); sailWin2.scale.set(0.72, 1, 1);
  const periscope = new THREE.Group();
  const periMast = cyl(0.05, 0.05, 1.15, M_SATIN, 10);
  periMast.position.y = 0.55;
  const periHead = box(0.14, 0.1, 0.1, M_STEEL_DARK);
  periHead.position.y = 1.16;
  const periGlint = new THREE.Mesh(new THREE.CircleGeometry(0.032, 10), matGlow(0xbfe8ff, 0.7, { color: 0xdff4ff }));
  periGlint.position.set(0.06, 1.17, 0.052);
  periscope.add(periMast, periHead, periGlint);
  periscope.position.set(0.25, 1.38, 0.28);
  sub.add(sail, sailWin, sailWin2, periscope);
  /* 首升降舵 + 尾水平舵 + 垂直舵 */
  const finMat = matStd(0x2c333b, { roughness: 0.5, metalness: 0.45 });
  const mkFin = (w, d) => roundedSlab(w, d, 0.07, 0.03, finMat, 0.02, 'flat');
  const bowFin = mkFin(2.2, 0.7); bowFin.position.set(2.35, -0.1, 0);
  const sternFin = mkFin(1.7, 0.62); sternFin.position.set(-2.55, 0.1, 0);
  const rudderV = roundedSlab(0.85, 1.15, 0.07, 0.03, finMat, 0.02, 'up');
  rudderV.position.set(-2.6, 0.25, 0);
  sub.add(bowFin, sternFin, rudderV);
  /* 尾轴 + 五叶大侧斜螺旋桨（帧循环自转） */
  const prop = new THREE.Group();
  const shaft = cyl(0.07, 0.07, 0.5, M_SATIN, 10);
  shaft.rotation.z = Math.PI / 2;
  shaft.position.x = -0.2;
  const hub = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.3, 12), M_BRASS);
  hub.rotation.z = -Math.PI / 2;
  hub.position.x = -0.28;
  const bladeGeo = new THREE.BoxGeometry(0.06, 0.62, 0.2);
  bladeGeo.translate(0, 0.34, 0);
  for (let i = 0; i < 5; i++) {
    const b = new THREE.Mesh(bladeGeo, M_BRASS);
    b.rotation.x = (i / 5) * TAU;
    b.rotation.y = 0.55;
    prop.add(b);
  }
  prop.add(shaft, hub);
  prop.position.set(-3.15, 0, 0);
  sub.add(prop);
  /* 压载水舱半透壳（ghost 化）+ 舱内水位可视柱 */
  const tankMat = new THREE.MeshPhysicalMaterial({ color: 0x3d8ec9, transparent: true, opacity: 0.12, roughness: 0.3, depthWrite: false, side: THREE.DoubleSide });
  const tank = new THREE.Mesh(new THREE.CapsuleGeometry(0.92, 5.6, 10, 24), tankMat);
  tank.rotation.z = Math.PI / 2;
  tank.userData.isTank = true;
  sub.add(tank);
  const tankWater = cyl(0.8, 0.8, 5.4, new THREE.MeshPhysicalMaterial({ color: 0x2f7bb5, transparent: true, opacity: 0, roughness: 0.2, depthWrite: false }), 20);
  tankWater.rotation.z = Math.PI / 2;
  tankWater.scale.y = 0.001;
  sub.add(tankWater);
  /* 甲板系泊小件：导缆钳 ×2 + 艏部声呐罩 */
  for (const xs of [1.5, -0.6]) {
    const chock = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.026, 8, 14), M_STEEL_DARK);
    chock.rotation.x = Math.PI / 2;
    chock.position.set(xs, 0.82, 0);
    sub.add(chock);
  }
  const sonar = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 12, 0, TAU, 0, Math.PI / 2), matStd(0x22303c, { roughness: 0.35, metalness: 0.3 }));
  sonar.rotation.z = Math.PI / 2;
  sonar.position.set(2.9, 0, 0);
  sub.add(sonar);
  sub.userData.prop = prop;
  sub.userData.tankWater = tankWater;
  return sub;
}
function buildSub(g) {
  buildQuay(g, 2.6, 7, 60, 14);
  const floorGeo = new THREE.PlaneGeometry(70, 40, 40, 26);
  floorGeo.rotateX(-Math.PI / 2);
  {
    const pos = floorGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      pos.setY(i, 0.32 * fbm3(x * 0.15, 0, z * 0.15, 21));
    }
    floorGeo.computeVertexNormals();
  }
  const seaFloor = new THREE.Mesh(floorGeo, new THREE.MeshStandardMaterial({ color: 0xa89670, roughness: 0.97, metalness: 0 }));
  seaFloor.position.y = -8.85;
  g.add(seaFloor);
  buildRockField(g, 2, -3, 40, 20, -8.6, 30);
  /* 两只海星（五角放样挤出，海底点缀） */
  const starMat = paintMat(0xd75a4a);
  for (const [sx, sz, sr] of [[-4.5, 2.5, 0.5], [6.5, -1.5, 0.34]]) {
    const shape = new THREE.Shape();
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * TAU;
      const r = i % 2 === 0 ? 1 : 0.42;
      const px = Math.cos(a) * r, py = Math.sin(a) * r;
      i === 0 ? shape.moveTo(px, py) : shape.lineTo(px, py);
    }
    shape.closePath();
    const star = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.14, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.07, bevelSegments: 2 }), starMat);
    star.rotation.x = -Math.PI / 2;
    star.rotation.z = sr;
    star.scale.setScalar(sr);
    star.position.set(sx, -8.62, sz);
    g.add(star);
  }
  g.add(shadowPatch(20, 10, [{ x: 0, z: 0, w: 9, d: 4, o: 0.3 }], -8.58));
  const sub = buildSubmarine();
  g.add(sub);
  SUB.sub = sub;
  SUB.tank = sub.children.find((c) => c.userData && c.userData.isTank);
  const tankLbl = lbl('', '#ffd166', 0.005);
  g.add(tankLbl);
  SUB.tankLbl = tankLbl;
  buildWater(g, 64, 44);
  updSub();
}
function updSub() {
  const rhoSub = 900 + SUB.fill * 2;         // 注水 0→100 ⇒ 900→1100
  // 密度跃层（"海中断崖"）：水下海水密度骤降，浮力跟着变小，悬浮的潜艇会急速掉深
  const rhoW = SUB.jumpy && SUB.depth < -2 ? 980 : 1030;
  const Vd = 100;                            // 排开水的体积（示意常数，m³）
  const prevY = SUB.depth;
  let targetY, status;
  if (rhoSub < rhoW - 15) {
    const frac = rhoSub / rhoW;              // 吃水比例
    targetY = 0.85 - frac * 1.5;
    status = SUB.depth > targetY + 0.05 ? '上浮中（ρ潜 < ρ水）' : '漂浮（ρ潜 < ρ水）';
  } else if (rhoSub > rhoW + 15) {
    targetY = -7.6;
    status = SUB.jumpy && rhoSub < 1030 - 15 ? '⚠ 掉深！跃层下方浮力骤减（海中断崖）'
      : (SUB.depth < targetY - 0.05 ? '下沉中（ρ潜 > ρ水）' : '沉底（ρ潜 > ρ水）');
  } else {
    targetY = -3.2;
    status = '悬浮（ρ潜 ≈ ρ水）';
  }
  SUB.depth += (targetY - SUB.depth) * 0.04;
  const bob = SUB.depth > -1 ? waveH(0, 0, performance.now() * 0.001) * 0.5 : 0;
  SUB.sub.position.set(0, SUB.depth + bob, 0);
  SUB.sub.rotation.x = Math.sin(performance.now() * 0.0007) * 0.02;
  /* 压载水舱：舱内水体（与舱壳同形回转体，沿艇轴）随注水"涨满"并加深染色 */
  const t = SUB.fill / 100;
  const tw = SUB.sub.userData.tankWater;
  tw.material.opacity = clamp(t * 0.55, 0, 0.55);
  tw.visible = t > 0.005;
  const shrink = 0.99 - t * 0.08;   /* 水体略小于舱壳，随水位增高向壳壁贴近 */
  tw.scale.set(shrink, t === 0 ? 0.01 : 1, shrink);
  SUB.tankLbl.position.set(2.6, SUB.sub.position.y + 1.9, 0);
  setSpriteText(SUB.tankLbl, '水舱注水 ' + SUB.fill + '%', { fontSize: 30, color: '#ffd166', scale: 0.005, bg: 'rgba(12,18,26,0.66)' });
  hset('rho', rhoSub.toFixed(0) + ' kg/m³');
  hset('rw', rhoW + ' kg/m³' + (SUB.jumpy ? '（跃层下 980）' : ''));
  hset('g', (rhoSub * Vd * G / 1000).toFixed(0) + ' kN');
  hset('fb', (rhoW * Vd * G / 1000).toFixed(0) + ' kN');
  hset('st', status);
  hset('y', (SUB.sub.position.y * 3).toFixed(1) + ' m（示意）');
}

/* ============ 07 轮船与载重线（放样船壳 + 岸桥吊装 + 横倾 + 六面吃水） ============ */

const SHIP = { n: 4, fresh: false, draft: 1.5, wave: true, heel: 0, heelTarget: 0 };
const SHIP_T = { empty: 60, boxT: 15, A: 40, hullD: 4.2, limit: 3.4 };  // 空载吨/每箱吨/水线面积 m²/型深/载重线吃水
const CONT_COLORS = [0xc0563e, 0x3f7f5f, 0x4a6fa5, 0xc2913a, 0x7a5ba0];
const CONT_NORMAL = corrugationNormal();
/** 集装箱：瓦楞纹法线 + 五色漆面（共享几何与法线贴图） */
function makeContainer() {
  const geo = new THREE.BoxGeometry(2.4, 1.0, 1.7);
  const i = makeContainer.idx = (makeContainer.idx || 0);
  makeContainer.idx = i + 1;
  const mat = new THREE.MeshStandardMaterial({
    color: CONT_COLORS[i % 5], roughness: 0.62, metalness: 0.22,
    normalMap: CONT_NORMAL, normalScale: new THREE.Vector2(0.55, 0.55),
  });
  return new THREE.Mesh(geo, mat);
}
/** 集装箱货船：站位放样船壳（涂装贴图：防污红/水线黑/船壳漆）+ 上层建筑 + 货舱盖 + 旗杆 */
function buildCargoShip() {
  const ship = new THREE.Group();
  const hullTex = hullPaintTexture('#2f5d43');
  hullTex.wrapS = THREE.RepeatWrapping;   /* uv.x 沿船长 ×6 平铺板缝 */
  hullTex.flipY = false;                  /* 色带按 v 直接绘制（v=0 龙骨红 → v=1 舷顶米白） */
  const hullMat = new THREE.MeshStandardMaterial({ map: hullTex, roughness: 0.55, metalness: 0.28, side: THREE.DoubleSide });
  const hull = new THREE.Mesh(buildHullGeometry({ len: 12.6, depth: 3.0, beamHalf: 2.05, stations: 30, secPts: 15 }), hullMat);
  ship.add(hull);
  /* 舷墙（甲板边窄条）+ 货舱盖三排 */
  const deckY = 1.68;
  for (const zs of [1.95, -1.95]) {
    const bulwark = box(11.4, 0.26, 0.07, matStd(0xd8d2c0, { roughness: 0.6 }));
    bulwark.position.set(0, deckY + 0.13, zs);
    ship.add(bulwark);
  }
  const hatchMat = matStd(0x8a5a3a, { roughness: 0.7 });
  for (const xs of [-2.4, 0, 2.4]) {
    const hatch = roundedSlab(2.1, 3.5, 0.12, 0.05, hatchMat, 0.02, 'up');
    hatch.position.set(xs, deckY, 0);
    ship.add(hatch);
  }
  /* 上层建筑（驾驶桥楼）：主体 + 玻璃驾驶窗带 + 甲板室层线 + 桅杆雷达 */
  const house = roundedSlab(1.9, 1.6, 3.1, 0.1, paintMat(0xe8e4da), 0.04, 'flat');
  house.position.set(-4.6, deckY, 0);
  const bridgeFrame = box(0.05, 0.5, 1.5, paintMat(0xf2eee2));
  bridgeFrame.position.set(-3.66, deckY + 2.5, 0);
  const bridgeGlass = box(0.06, 0.42, 1.34, matGlass(0x1c3644, { opacity: 0.82 }));
  bridgeGlass.position.set(-3.62, deckY + 2.5, 0);
  ship.add(house, bridgeFrame, bridgeGlass);
  const mast = cyl(0.045, 0.06, 1.5, M_SATIN, 8);
  mast.position.set(-4.6, deckY + 3.8, 0);
  const radar = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.02, 6, 18), M_SATIN);
  radar.rotation.x = Math.PI / 2;
  radar.position.set(-4.6, deckY + 4.55, 0);
  const radarBar = box(0.5, 0.03, 0.06, M_SATIN);
  radarBar.position.set(-4.6, deckY + 4.55, 0);
  ship.add(mast, radar, radarBar);
  /* 烟囱（斜切顶 + 色带） */
  const funnelProf = [
    new THREE.Vector2(0.001, 0), new THREE.Vector2(0.34, 0), new THREE.Vector2(0.36, 0.1),
    new THREE.Vector2(0.33, 1.05), new THREE.Vector2(0.36, 1.12), new THREE.Vector2(0.001, 1.14),
  ];
  const funnel = new THREE.Mesh(latheSmooth(funnelProf, 16, 18), paintMat(0xc2743a));
  funnel.position.set(-5.0, deckY + 3.04, 0);
  const funnelBand = cyl(0.345, 0.35, 0.2, paintMat(0x1c1e22), 18);
  funnelBand.position.set(-5.0, deckY + 3.96, 0);
  ship.add(funnel, funnelBand);
  /* 救生艇（橙色闭式艇，吊架） */
  const boat = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.75, 6, 12), paintMat(0xe8672e));
  boat.rotation.z = Math.PI / 2;
  boat.position.set(-3.4, deckY + 1.05, 1.85);
  const davit = cyl(0.025, 0.025, 0.5, M_SATIN, 8);
  davit.position.set(-3.4, deckY + 1.35, 1.85);
  ship.add(boat, davit);
  /* 栏杆立柱（InstancedMesh）+ 上下两道扶手 */
  const postGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.5, 6);
  const posts = new THREE.InstancedMesh(postGeo, M_SATIN, 26);
  const dummy = new THREE.Object3D();
  let pi = 0;
  for (const zs of [1.98, -1.98]) {
    for (let i = 0; i < 13; i++) {
      dummy.position.set(-5.6 + i * 0.95, deckY + 0.25, zs);
      dummy.updateMatrix();
      posts.setMatrixAt(pi++, dummy.matrix);
    }
  }
  ship.add(posts);
  for (const zs of [1.98, -1.98]) {
    for (const ry of [0.24, 0.46]) {
      const rail = cyl(0.014, 0.014, 11.4, M_SATIN, 6);
      rail.rotation.z = Math.PI / 2;
      rail.position.set(0, deckY + ry, zs);
      ship.add(rail);
    }
  }
  /* 吃水标尺（艏/艉左右舷贴图水尺） */
  const dTex = draftScaleTexture();
  const tapeSide = M(0x8a8878, 0.7);
  const tapeFace = texStd(dTex, 0.6);
  for (const [tx, tz, tRot] of [[3.6, 1.46, -0.42], [3.6, -1.46, 0.42], [-5.4, 1.74, 0.34], [-5.4, -1.74, -0.34]]) {
    const mats = [tapeSide, tapeSide, tapeSide, tapeSide, tapeFace, tapeFace];
    const tape = new THREE.Mesh(new THREE.BoxGeometry(0.36, 3.0, 0.03), mats);
    tape.position.set(tx, -0.36, tz);
    tape.rotation.y = tRot;
    ship.add(tape);
  }
  /* 载重线圆盘（船中两舷） */
  const plTex = plimsollTexture();
  for (const zs of [2.07, -2.07]) {
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.6), new THREE.MeshBasicMaterial({ map: plTex, transparent: true }));
    pl.position.set(1.7, -0.42, zs);
    if (zs < 0) pl.rotation.y = Math.PI;
    ship.add(pl);
  }
  const plimLbl = lbl('载重线', '#ff9a8a', 0.0032);
  plimLbl.position.set(1.7, 0.7, 2.1);
  ship.add(plimLbl);
  /* 集装箱阵列（初始隐藏，updShip 按箱数点亮） */
  ship.userData.containers = [];
  for (let i = 0; i < 14; i++) {
    const c = makeContainer();
    const row = Math.floor(i / 5), col = i % 5;
    c.position.set(-2.4 + col * 1.05, deckY + 0.62 + row * 1.04, 0);
    c.visible = false;
    ship.add(c);
    ship.userData.containers.push(c);
  }
  ship.userData.deckY = deckY;
  return ship;
}
/* 岸桥吊点（复用塔吊总成，蓝色涂装 + 装卸铭牌；钩心世界坐标供吊装动画取用） */
const QUAY_CRANE_HOOK = V3(0, 6.6, 4.15);
/** 待装集装箱堆场（码头后方） */
function buildContainerYard(g) {
  const yard = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const c = makeContainer();
    c.position.set(3.2 + (i % 2) * 0.3, 0.52 + Math.floor(i / 2) * 1.05, 6.4);
    yard.add(c);
  }
  const frame = new THREE.Group();
  const sign = decalPlane(makeLabelTexture(['待装箱区', 'STAGING'], { w: 220, h: 100, lineSizes: [40, 22] }), 1.6, 0.7);
  sign.position.set(4.6, 1.6, 5.99);
  const post1 = cyl(0.03, 0.03, 2.0, M_SATIN, 8); post1.position.set(3.9, 1.0, 5.99);
  const post2 = post1.clone(); post2.position.x = 5.3;
  frame.add(sign, post1, post2);
  yard.add(frame);
  g.add(yard);
}
function buildShip(g) {
  buildQuay(g, 2.6, 8, 60, 14);
  g.add(buildCargoShip());
  SHIP.ship = g.children[g.children.length - 1];
  const crane = buildCrane({ paint: 0x2f6db3, signText: ['岸桥 · QC-01', '集装箱装卸区'] });
  crane.position.set(0, 2.6, 9.0);
  g.add(crane);
  SHIP.crane = crane;
  buildContainerYard(g);
  /* 吊装中的集装箱（跟随吊钩，平时隐藏）+ 吊索 */
  SHIP.flying = makeContainer();
  SHIP.flying.visible = false;
  g.add(SHIP.flying);
  SHIP.loadCable = makeRope(0xb8bcc2, 0.018);
  SHIP.loadCable.visible = false;
  g.add(SHIP.loadCable);
  SHIP.loadT = -1;    /* 吊装动画进度：<0 空闲 */
  buildWater(g, 64, 48);
  updShip();
}
function updShip() {
  const totalT = SHIP_T.empty + SHIP.n * SHIP_T.boxT;
  const rhoW = SHIP.fresh ? 1000 : 1030;
  const draft = totalT * 1000 / (rhoW * SHIP_T.A);        // m
  SHIP.draft += (draft - SHIP.draft) * 0.06;
  const ship = SHIP.ship;
  const conts = ship.userData.containers;
  conts.forEach((c, i) => { c.visible = i < SHIP.n; });
  const over = SHIP.draft > SHIP_T.limit;
  const waveBob = SHIP.wave ? waveH(0, 0, performance.now() * 0.001) * 0.35 : 0;
  ship.position.y = 1.86 - SHIP.draft + waveBob;
  ship.rotation.z = Math.sin(performance.now() * 0.0006) * (SHIP.wave ? 0.012 : 0);
  ship.rotation.x = Math.cos(performance.now() * 0.0005) * (SHIP.wave ? 0.018 : 0) - SHIP.heel;
  /* 六面吃水读数（左右舷对称，艏/艉随纵摇微差） */
  const trim = Math.sin(performance.now() * 0.0006) * (SHIP.wave ? 0.05 : 0);
  const dBow = SHIP.draft + trim, dMid = SHIP.draft, dStern = SHIP.draft - trim;
  hset('w', totalT.toFixed(0) + ' t');
  hset('disp', '排水 ' + totalT.toFixed(0) + ' t（=自重）');
  hset('draft', SHIP.draft.toFixed(2) + ' m');
  hset('dBow', dBow.toFixed(2) + ' m');
  hset('dMid', dMid.toFixed(2) + ' m');
  hset('dStern', dStern.toFixed(2) + ' m');
  hset('safe', over ? '⚠ 低于载重线，超载危险！' : '吃水在载重线之上，安全');
  hset('cargo', SHIP.heelTarget > 0 ? '偏向左舷（船身横倾）' : '左右均匀');
}
/** 吊装一箱：堆场抓箱 → 提升过钩点 → 横移到船 → 落舱（帧循环推进，钩点固定） */
function startLoad() {
  if (SHIP.n >= 14 || SHIP.loadT >= 0) return;
  SHIP.loadT = 0;
}
function tickLoad(dt) {
  if (SHIP.loadT < 0) return;
  SHIP.loadT += dt / 3.4;                 /* 全程 3.4 s */
  const u = SHIP.loadT;
  const deckY = SHIP.ship.userData.deckY;
  const row = Math.floor(SHIP.n / 5), col = SHIP.n % 5;
  const slotWorldY = deckY + 0.62 + row * 1.04 + 0.5 + SHIP.ship.position.y;
  const slotPos = V3(-2.4 + col * 1.05, slotWorldY, 0);
  const yardPos = V3(3.4, 1.62, 6.4);
  const liftPos = V3(0, QUAY_CRANE_HOOK.y - 0.9, QUAY_CRANE_HOOK.z - 0.5);
  const fly = SHIP.flying;
  const cable = SHIP.loadCable;
  if (u < 0.22) {                          /* 抓箱提升 */
    const k = u / 0.22;
    fly.visible = true;
    fly.position.set(lerp(yardPos.x, liftPos.x, k), lerp(yardPos.y, liftPos.y, k * k * (3 - 2 * k)), lerp(yardPos.z, liftPos.z, k));
  } else if (u < 0.5) {                    /* 横移到船上方 */
    const k = (u - 0.22) / 0.28;
    const e = k * k * (3 - 2 * k);
    fly.position.set(lerp(liftPos.x, slotPos.x, e), lerp(liftPos.y, slotPos.y + 2.2, e), lerp(liftPos.z, slotPos.z, e));
  } else if (u < 0.78) {                   /* 缓慢落舱 */
    const k = (u - 0.5) / 0.28;
    fly.position.set(slotPos.x, lerp(slotPos.y + 2.2, slotPos.y, k), slotPos.z);
  } else if (u < 1) {                      /* 脱钩回收 */
    fly.visible = false;
  } else {
    SHIP.loadT = -1;
    cable.visible = false;
    SHIP.n += 1;
    updShip();
    syncShipControls();
    return;
  }
  /* 吊索：钩心 → 箱顶（吊装全程可见） */
  cable.visible = fly.visible;
  if (fly.visible) cable.set(QUAY_CRANE_HOOK, V3(fly.position.x, fly.position.y + 0.55, fly.position.z));
}

/* ============ 08 密度计与水尺计重（纸尺刻度 + 按压回弹振荡） ============ */

const HYD = { liquid: 1030, showScale: true, press: 0, y: 0, vel: 0, dragging: false };
const HYD_LIQUIDS = {
  790: { name: '酒精', color: 0xc8dde6 },
  1000: { name: '淡水', color: 0x3d8ec9 },
  1030: { name: '海水', color: 0x3a86bd },
  1150: { name: '饱和盐水', color: 0x4a9a8e },
};
/* 密度计杆内纸尺：非均匀刻度（mark 局部高 = 1.05×1000/ρ，与浸入公式同源） */
function hydScaleTexture() {
  return canvasTex(96, 512, (ctx, w, h) => {
    ctx.fillStyle = '#f2ecd8';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 160; i++) {
      ctx.fillStyle = 'rgba(150,130,90,0.06)';
      ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
    }
    const yOf = (rho) => {
      const local = clamp(1.05 * (1000 / rho), 0.6, 1.66);   /* 杆局部高 */
      return h - ((local - 0.55) / 1.2) * h;                  /* 纸尺 span 0.55..1.75 */
    };
    ctx.fillStyle = '#8a3a22';
    ctx.textAlign = 'left';
    for (let rho = 750; rho <= 1450; rho += 25) {
      if (rho % 100 !== 0 && rho % 50 !== 0) continue;
      const y = yOf(rho);
      if (y < 6 || y > h - 6) continue;
      const major = rho % 100 === 0;
      ctx.fillStyle = major ? '#8a3a22' : '#5a5248';
      ctx.fillRect(10, y - 1.4, major ? 34 : 20, 2.8);
      if (major) {
        ctx.font = '700 21px sans-serif';
        ctx.fillText(String(rho), 50, y + 7);
      }
    }
  });
}
function buildHydrometer(g) {
  buildLabTable(g, 8, 3.2, 1.5, 87);
  /* 大搪瓷托盘（车削翻边） */
  const trayProf = [
    new THREE.Vector2(0.001, 0), new THREE.Vector2(3.45, 0), new THREE.Vector2(3.47, 0.02),
    new THREE.Vector2(3.55, 0.1), new THREE.Vector2(3.47, 0.11), new THREE.Vector2(3.4, 0.045),
    new THREE.Vector2(0.001, 0.04),
  ];
  const tray = new THREE.Mesh(latheSmooth(trayProf, 20, 40), matStd(0x9aa2a8, { roughness: 0.5, metalness: 0.7 }));
  tray.position.set(0, 1.5, 0);
  g.add(tray);
  const glass = new THREE.MeshPhysicalMaterial({ color: 0xcfe9f5, transparent: true, opacity: 0.2, roughness: 0.05 });
  HYD.cups = [];
  HYD.meters = [];
  const surfaceY = 1.62 + 2.2;
  const conf = [
    { x: -2.2, rho: 1000, name: '淡水 ρ=1000' },
    { x: 2.2, rho: HYD.liquid, name: '待测液体' },
  ];
  conf.forEach((c, ci) => {
    /* 量筒：车削杯身 + 倒嘴 + 刻度贴花 */
    const beakProf = [
      new THREE.Vector2(0.82, 0), new THREE.Vector2(1.02, 0.03), new THREE.Vector2(1.05, 0.14),
      new THREE.Vector2(1.05, 2.55), new THREE.Vector2(1.08, 2.64), new THREE.Vector2(1.0, 2.68),
    ];
    const beak = new THREE.Mesh(latheSmooth(beakProf, 26, 30), glass);
    beak.position.set(c.x, 1.58, 0);
    g.add(beak);
    const waterMat = new THREE.MeshPhysicalMaterial({ color: HYD_LIQUIDS[c.rho]?.color ?? 0x3d8ec9, transparent: true, opacity: 0.55, roughness: 0.15 });
    const water = cyl(0.98, 0.9, 2.2, waterMat, 26);
    water.position.set(c.x, 1.62 + 1.1, 0);
    g.add(water);
    const grad = decalPlane(canvasTex(64, 512, (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(40,60,70,0.8)';
      for (let i = 0; i < 9; i++) {
        const y = h - 30 - i * ((h - 70) / 8);
        ctx.lineWidth = i % 2 === 0 ? 4.5 : 2.6;
        ctx.beginPath(); ctx.moveTo(8, y); ctx.lineTo(i % 2 === 0 ? 42 : 28, y); ctx.stroke();
      }
    }), 0.34, 2.1);
    grad.position.set(c.x, 1.58 + 1.35, 1.053);
    if (ci === 1) grad.rotation.y = Math.PI;
    g.add(grad);
    /* 密度计：玻璃球泡（含铅丸）+ 细杆 + 杆内纸尺（非均匀刻度） */
    const m = new THREE.Group();
    const bodyProf = [
      new THREE.Vector2(0.001, -0.16), new THREE.Vector2(0.14, -0.14), new THREE.Vector2(0.27, -0.02),
      new THREE.Vector2(0.3, 0.12), new THREE.Vector2(0.2, 0.32), new THREE.Vector2(0.062, 0.42),
      new THREE.Vector2(0.055, 0.55), new THREE.Vector2(0.055, 1.8), new THREE.Vector2(0.062, 1.9),
      new THREE.Vector2(0.001, 1.92),
    ];
    const bodyMat = new THREE.MeshPhysicalMaterial({ color: 0xe8f2f5, transparent: true, opacity: 0.24, roughness: 0.06, transmission: 0.6, thickness: 0.3, ior: 1.5 });
    const body = new THREE.Mesh(latheSmooth(bodyProf, 34, 22), bodyMat);
    m.add(body);
    /* 铅丸配重（球底一堆小珠，InstancedMesh） */
    const shot = new THREE.InstancedMesh(new THREE.SphereGeometry(0.032, 8, 6), M_STEEL_DARK, 14);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < 14; i++) {
      const a = Math.random() * TAU;
      const r = Math.random() * 0.14;
      dummy.position.set(Math.cos(a) * r, -0.1 + Math.random() * 0.06, Math.sin(a) * r);
      dummy.updateMatrix();
      shot.setMatrixAt(i, dummy.matrix);
    }
    m.add(shot);
    /* 纸尺（开口圆柱面贴图，字面朝 +z 观察向） */
    const paper = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.045, 1.2, 18, 1, true, -1.1, 2.2),
      new THREE.MeshBasicMaterial({ map: hydScaleTexture(), side: THREE.DoubleSide }),
    );
    paper.position.y = 1.15;
    m.add(paper);
    /* 杆顶封帽 */
    const cap = cyl(0.062, 0.062, 0.03, matStd(0xd8d2c0, { roughness: 0.4 }), 12);
    cap.position.y = 1.91;
    m.add(cap);
    m.position.set(c.x, surfaceY - clamp(1.05 * (1000 / c.rho), 0.5, 1.66) - 0.15, 0);
    g.add(m);
    HYD.cups.push({ water, beak });
    HYD.meters.push(m);
  });
  /* 液体名签（桌面小立牌） */
  HYD.tags = [
    (() => {
      const grp = new THREE.Group();
      const bd = box(1.3, 0.4, 0.03, M(0xece6d2, 0.7));
      const tx = decalPlane(makeLabelTexture(['淡水', 'ρ ≈ 1000 kg/m³'], { w: 260, h: 90, lineSizes: [38, 24] }), 1.22, 0.34);
      tx.position.z = 0.017;
      grp.add(bd, tx);
      grp.position.set(-2.2, 1.78, 2.0);
      grp.rotation.x = -0.22;
      return grp;
    })(),
    (() => {
      const grp = new THREE.Group();
      const bd = box(1.3, 0.4, 0.03, M(0xece6d2, 0.7));
      const tx = decalPlane(makeLabelTexture(['待测液体', '看液面对准哪格'], { w: 260, h: 90, lineSizes: [38, 24] }), 1.22, 0.34);
      tx.position.z = 0.017;
      grp.add(bd, tx);
      grp.position.set(2.2, 1.78, 2.0);
      grp.rotation.x = -0.22;
      return grp;
    })(),
  ];
  g.add(HYD.tags[0], HYD.tags[1]);
  /* 备用密度计（木盒里，场景叙事道具） */
  const caseBox = roundedSlab(1.6, 0.5, 0.22, 0.05, M_WOOD_DARK, 0.02, 'flat');
  caseBox.position.set(0.2, 1.61, -1.2);
  const caseLbl = decalPlane(makeLabelTexture(['密度计', '比重计'], { w: 200, h: 80, lineSizes: [34, 22] }), 0.9, 0.34);
  caseLbl.position.set(0.2, 1.73, -0.945);
  g.add(caseBox, caseLbl);
  updHyd();
  /* 按压密度计（射线拖拽：向下压 → 松手阻尼回弹） */
  const m1 = HYD.meters[1];
  makeYDragger(
    m1.children.filter((c) => c.isMesh),
    () => m1.position.clone(),
    (hit) => {
      HYD.dragging = true;
      const lineLocal = clamp(1.05 * (1000 / HYD.liquid), 0.5, 1.66);
      HYD.press = clamp((m1.position.y - HYD.y - hit.y) * 1.4, 0, 0.5);
      HYD.y = HYD.press;
      HYD.vel = 0;
    },
    () => {
      HYD.dragging = false;
      HYD.press = 0;
    },
  );
}
function updHyd() {
  // 教学口径：漂浮时 F浮=m·g 一定，ρ↑ → V排↓ → 浸入线沿杆下移（浮得高）
  const conf = [
    { rho: 1000, x: -2.2 },
    { rho: HYD.liquid, x: 2.2 },
  ];
  conf.forEach((c, i) => {
    const surfaceY = 1.62 + 2.2;
    const lineLocal = clamp(1.05 * (1000 / c.rho), 0.5, 1.66);
    HYD.meters[i].position.set(c.x, surfaceY - lineLocal - 0.15 - (i === 1 ? HYD.y : 0), 0);
    if (i === 1) {
      const info = HYD_LIQUIDS[HYD.liquid] || { name: '待测液体' };
      HYD.cups[1].water.material.color.set(info.color ?? 0x3d8ec9);
      hset('read', '液面停在 ρ=' + HYD.liquid + ' 刻度附近');
      hset('rho2', HYD.liquid + ' kg/m³（' + info.name + '）');
      hset('deep', (1000 / HYD.liquid * 100).toFixed(1) + ' % 浸入（相对淡水）');
      hset('law', '刻度上小下大、上疏下密（h∝1/ρ，不均匀）');
    }
  });
}
/* 松手后的阻尼振荡（帧循环）：y'' = −k·y − c·y'，回弹两三个来回后停稳 */
function tickHyd(dt) {
  if (HYD.dragging) { HYD.vel = 0; return; }
  if (Math.abs(HYD.y) < 1e-4 && Math.abs(HYD.vel) < 1e-4) return;
  const k = 42, c = 3.4;
  HYD.vel += (-k * HYD.y - c * HYD.vel) * dt;
  HYD.y += HYD.vel * dt;
  const lineLocal = clamp(1.05 * (1000 / HYD.liquid), 0.5, 1.66);
  const baseY = (1.62 + 2.2) - lineLocal - 0.15;
  HYD.meters[1].position.y = baseY - HYD.y;
  hset('note', Math.abs(HYD.vel) > 0.12 ? '等密度计停稳了再读数…' : '停稳了：液面对准的刻度即液体密度');
}

/* ============ HUD（右栏数据坞） ============ */

let hud = null;
const hudWrap = document.getElementById('lcData');
function setHUD(rows) {
  if (hud) hud.el.remove();
  hud = makeHUD(hudWrap, rows);
  rows.forEach(([k]) => hud.set(k, '–'));
}
function hset(key, text) { if (hud) hud.set(key, text); }

/* ============ 控制条与章节 ============ */

const ctl = createControlsPanel(document.getElementById('controls'));
let activeSectionCleanup = null;

function pressureCtl() {
  ctl.clear();
  ctl.slider({ label: '深度', min: 0, max: 60, step: 1, value: PRS.depth, fmt: (v) => v + ' m', onInput: (v) => { PRS.depth = v; updPressure(); } });
  ctl.sep();
  const presets = [['海面 0 m', 0], ['浅海 20 m', 20], ['大陆架 50 m', 50]];
  presets.forEach(([t, v]) => {
    ctl.button({ label: t, onClick: () => { PRS.depth = v; updPressure(); } });
  });
  const btns = [];
  const paint = () => btns.forEach(({ b, v }) => b.classList.toggle('active', (v === 'sea') !== PRS.fresh));
  [['fresh', '淡水'], ['sea', '海水']].forEach(([v, t]) => {
    const b = ctl.button({ label: t, onClick: () => { PRS.fresh = v === 'fresh'; paint(); updPressure(); } });
    btns.push({ b, v });
  });
  paint();
  ctl.toggle({ label: '压强箭头', value: true, onChange: (v) => { PRS.showArrows = v; updPressure(); } });
  setHUD([['p', '该深度压强 ρgh'], ['patm', '加上大气压'], ['ratm', '约为大气压的'], ['f1', '1 cm² 上的压力'], ['rho', '液体密度'], ['d', '深度 h'], ['cup', '泡沫杯大小'], ['note', '规律']]);
  updPressure();
}
function lockCtl() {
  ctl.clear();
  ctl.button({ label: '下一步 ▸', onClick: () => setLockStep(LOCK.step + 1) });
  ctl.button({
    label: '自动播放',
    onClick(btn) {
      LOCK.auto = !LOCK.auto;
      btn.classList.toggle('active', LOCK.auto);
      btn.textContent = LOCK.auto ? '⏸ 停止' : '自动播放';
    },
  });
  ctl.button({ label: '↺ 重置', onClick() { setLockStep(0, true); } });
  setHUD([['stage', '步骤'], ['desc', '正在发生'], ['lb', '港池（下游）水位'], ['lc', '闸室水位'], ['lu', '内河（上游）水位'], ['flow', '输水流量'], ['gated', '下闸门两侧水位差'], ['gateu', '上闸门两侧水位差']]);
  setLockStep(0, true);
}
function lockReadouts() {
  hset('lb', '0.0 m');
  hset('lu', '2.6 m');
  hset('lc', LOCK.level.toFixed(1) + ' m');
  hset('flow', LOCK.step === 1 ? '约 12 m³/min（输水中）' : '0（阀门关闭）');
  hset('gated', Math.abs(0 - LOCK.level).toFixed(1) + ' m');
  hset('gateu', Math.abs(2.6 - LOCK.level).toFixed(1) + ' m');
}
function cubeCtl() {
  ctl.clear();
  CUBE.depthSlider = ctl.slider({ label: '上表面深度', min: -1.4, max: 2, step: 0.05, value: CUBE.depth, fmt: (v) => (v >= 0 ? v.toFixed(2) : '露出 ' + (-v).toFixed(2)) + ' m', onInput: (v) => { CUBE.depth = v; updCube(); } });
  CUBE.sizeSlider = ctl.slider({ label: '棱长', min: 0.6, max: 2, step: 0.05, value: CUBE.size, fmt: (v) => v.toFixed(2) + ' m', onInput: (v) => { CUBE.size = v; updCube(); } });
  ctl.sep();
  ctl.toggle({ label: '显示压强数值', value: true, onChange: (v) => { CUBE.showNum = v; updCube(); } });
  ctl.toggle({ label: '底面陷进淤泥', value: false, onChange: (v) => { CUBE.sealed = v; updCube(); } });
  ctl.sep();
  ctl.button({ label: '✋ 也可以直接上下拖动沉箱', onClick() { } });
  setHUD([['ptop', '上表面的压强'], ['pbot', '下表面的压强'], ['ftop', '上表面压力 F上'], ['fbot', '下表面压力 F下'], ['fb', 'F浮 = F下 − F上'], ['arch', 'ρ g V排 验证']]);
  updCube();
}
function syncCUBEControls() {
  if (CUBE.depthSlider) CUBE.depthSlider.set(CUBE.depth);
}
function weighCtl() {
  ctl.clear();
  ctl.slider({ label: '浸入深度比例', min: 0, max: 1, step: 0.01, value: 0, fmt: (v) => (v * 100).toFixed(0) + ' %', onInput: (v) => { WEI.frac = v; updWeigh(); } });
  ctl.slider({ label: '物块体积', min: 0.3, max: 2, step: 0.05, value: 1, fmt: (v) => v.toFixed(2) + ' m³', onInput: (v) => { WEI.vol = v; updWeigh(); } });
  const mbtns = [];
  const paintM = () => mbtns.forEach(({ b, v }) => b.classList.toggle('active', v === WEI.rhoObj));
  [[2400, '混凝土块 1 m³'], [7800, '钢块 1 m³']].forEach(([v, t]) => {
    const b = ctl.button({ label: t, onClick: () => { WEI.rhoObj = v; updWeigh(); paintM(); } });
    mbtns.push({ b, v });
  });
  paintM();
  ctl.sep();
  ctl.button({ label: '▼ 缓慢浸入', onClick() { if (!WEI.dipping) WEI.dipping = +1; } });
  ctl.button({ label: '▲ 提升', onClick() { if (!WEI.dipping) WEI.dipping = -1; } });
  setHUD([['g', '物块重力 G'], ['f', '吊秤读数 F'], ['fb', '浮力 F浮 = G − F'], ['v', '排开海水的体积'], ['note', '规律']]);
  updWeigh();
}
function archCtl() {
  ctl.clear();
  ctl.slider({ label: '物体体积', min: 0.2, max: 0.9, step: 0.05, value: ARCH.vol, fmt: (v) => v.toFixed(2) + ' m³', onInput: (v) => { ARCH.vol = v; updArch(); } });
  ctl.sep();
  const btns = [];
  const paint = () => btns.forEach(({ b, v }) => b.classList.toggle('active', v === ARCH.kind));
  [['stone', '石块'], ['wood', '木块'], ['alu', '铝块']].forEach(([v, t]) => {
    const b = ctl.button({ label: t, onClick: () => { ARCH.kind = v; updArch(); paint(); } });
    btns.push({ b, v });
  });
  paint();
  ctl.button({ label: '▼ 浸入', onClick() { if (!ARCH.dipping) ARCH.dipping = +1; } });
  setHUD([['fb', '物体受到的浮力'], ['gdisp', '排开的水重 G排'], ['vdisp', '溢出的水体积'], ['eq', '对比'], ['note', '说明']]);
  updArch();
}
function subCtl() {
  ctl.clear();
  ctl.slider({ label: '压载水舱注水', min: 0, max: 100, step: 1, value: SUB.fill, fmt: (v) => v + ' %', onInput: (v) => { SUB.fill = v; updSub(); } });
  ctl.sep();
  ctl.button({ label: '悬浮预设 65%', onClick() { SUB.fill = 65; updSub(); } });
  ctl.toggle({ label: '海水密度跃层', value: false, onChange: (v) => { SUB.jumpy = v; updSub(); } });
  ctl.button({ label: '⚠ 紧急吹除', onClick() { SUB.fill = 10; updSub(); } });
  ctl.toggle({ label: '压载水舱显示', value: true, onChange: (v) => {
    if (SUB.tank) SUB.tank.visible = v;
    SUB.sub.userData.tankWater.visible = v && SUB.fill > 0.5;
  } });
  setHUD([['rho', '潜艇平均密度'], ['rw', '周围海水密度'], ['g', '重力 G'], ['fb', '浮力 F浮'], ['st', '状态'], ['y', '深度']]);
  updSub();
}
function shipCtl() {
  ctl.clear();
  SHIP.nSlider = ctl.slider({ label: '甲板上的集装箱', min: 0, max: 14, step: 1, value: SHIP.n, fmt: (v) => v + ' 箱', onInput: (v) => { SHIP.n = v; SHIP.loadT = -1; SHIP.flying.visible = false; SHIP.loadCable.visible = false; updShip(); } });
  ctl.sep();
  ctl.button({ label: '🏗 吊装一箱', onClick: startLoad });
  const hbtns = [];
  const paintH = () => hbtns.forEach(({ b, v }) => b.classList.toggle('active', (v === 'even') === (SHIP.heelTarget === 0)));
  [['even', '左右均匀'], ['port', '偏向左舷']].forEach(([v, t]) => {
    const b = ctl.button({ label: t, onClick: () => { SHIP.heelTarget = v === 'even' ? 0 : 0.075; paintH(); updShip(); } });
    hbtns.push({ b, v });
  });
  paintH();
  const btns = [];
  const paint = () => btns.forEach(({ b, v }) => b.classList.toggle('active', (v === 'sea') !== SHIP.fresh));
  [['river', '内河（淡水）'], ['sea', '海港（海水）']].forEach(([v, t]) => {
    const b = ctl.button({ label: t, onClick: () => { SHIP.fresh = v === 'river'; paint(); updShip(); } });
    btns.push({ b, v });
  });
  paint();
  ctl.toggle({ label: '波浪', value: true, onChange: (v) => { SHIP.wave = v; updShip(); } });
  setHUD([['w', '船总重'], ['disp', '排水量（船 + 货）'], ['draft', '船中吃水'], ['dBow', '船首 左 / 右'], ['dMid', '船中 左 / 右'], ['dStern', '船尾 左 / 右'], ['safe', '载重线检查'], ['cargo', '甲板货']]);
  updShip();
}
function syncShipControls() {
  if (SHIP.nSlider) SHIP.nSlider.set(SHIP.n);
}
function hydCtl() {
  ctl.clear();
  const btns = [];
  const paint = () => btns.forEach(({ b, v }) => b.classList.toggle('active', v === HYD.liquid));
  [[790, '酒精'], [1000, '淡水'], [1030, '海水'], [1150, '饱和盐水']].forEach(([v, t]) => {
    const b = ctl.button({ label: t, onClick: () => { HYD.liquid = v; updHyd(); paint(); } });
    btns.push({ b, v });
  });
  paint();
  ctl.sep();
  ctl.button({ label: '✋ 按住密度计往下压，松手看回弹', onClick() { } });
  setHUD([['read', '液面对准的刻度'], ['rho2', '液体的真实密度'], ['deep', '细管浸入'], ['law', '原理'], ['note', '提示']]);
  updHyd();
}

/* ============ 浮力曲线浮窗（称重法章节，可折叠徽标） ============ */

let chartCv = null;
function initChartWindow() {
  const el = document.createElement('div');
  el.className = 'float-chart';
  el.id = 'floatChart';
  el.innerHTML = `
    <div class="cw-head"><b>浮力曲线</b><span style="color:var(--text-faint)">F浮 – 浸入比例</span>
      <button class="cw-fold" type="button" aria-label="收起浮力曲线窗" title="收起浮力曲线窗">−</button></div>
    <canvas height="300"></canvas>
    <button class="cw-badge" type="button" aria-label="展开浮力曲线窗" title="展开浮力曲线窗">曲线</button>`;
  stage.appendChild(el);
  chartCv = el.querySelector('canvas');
  const FOLD_KEY = 'float.foldChart';
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
  initChartWindow.el = el;
  drawBuoyChart(0, 1);
}
function drawBuoyChart(fbNow, fbMax) {
  if (!chartCv) return;
  const W = chartCv.clientWidth || 240, H = 150;
  if (chartCv.width !== W * 2) { chartCv.width = W * 2; chartCv.height = H * 2; }
  const ctx = chartCv.getContext('2d');
  ctx.setTransform(2, 0, 0, 2, 0, 0);
  ctx.clearRect(0, 0, W, H);
  const css = getComputedStyle(document.documentElement);
  const dim = css.getPropertyValue('--text-faint').trim() || '#8a94a0';
  const acc = css.getPropertyValue('--accent').trim() || '#e8674a';
  const mL = 40, mR = 10, mT = 12, mB = 26;
  const pw = W - mL - mR, ph = H - mT - mB;
  const X = (f) => mL + f * pw;
  const Y = (v) => mT + (1 - v) * ph;
  ctx.strokeStyle = dim; ctx.fillStyle = dim;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.5;
  ctx.strokeRect(mL, mT, pw, ph);
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('F浮max', mL - 4, mT + 8);
  ctx.fillText('0', mL - 4, Y(0) + 3);
  ctx.textAlign = 'center';
  ctx.fillText('0', X(0), H - 12);
  ctx.fillText('浸入 100%', X(1), H - 12);
  ctx.fillText('（完全浸没后不再变化）', X(0.62), H - 2);
  ctx.globalAlpha = 1;
  /* 曲线：线性上升到浸没 → 平台 */
  ctx.strokeStyle = acc;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(X(0), Y(0));
  ctx.lineTo(X(1), Y(1));
  ctx.lineTo(X(1.32), Y(1));
  ctx.stroke();
  /* 当前点 */
  if (fbMax > 0) {
    const f = clamp(fbNow / fbMax, 0, 1);
    const px = X(WEI.frac * 1.32), py = Y(f);
    ctx.fillStyle = acc;
    ctx.beginPath(); ctx.arc(px, py, 4, 0, TAU); ctx.fill();
    ctx.font = '600 10.5px sans-serif';
    ctx.textAlign = px > W - 66 ? 'right' : 'left';
    ctx.fillText((fbNow / 1000).toFixed(1) + ' kN', px + (px > W - 66 ? -7 : 7), py - 6);
  }
}

/* ============ 随堂检测 ============ */

const QUIZ = [
  {
    q: '“奋斗者”号下潜到 10 000 m 深处，海水密度取 1.03×10³ kg/m³，g 取 10 N/kg，它受到海水的压强约为？',
    opts: ['1.03×10⁶ Pa', '1.03×10⁷ Pa', '1.03×10⁸ Pa', '1.03×10⁹ Pa'],
    a: 2,
    ex: 'p=ρgh=1.03×10³×10×10⁴≈1.03×10⁸ Pa（约 1000 个大气压）。可见深海压强之大，舱体要承受巨大的压力。',
  },
  {
    q: '关于液体压强，下列说法正确的是？',
    opts: ['只与深度有关，与液体密度无关', '同种液体中，深度越大压强越大', '方向只能向上', '与容器形状有关'],
    a: 1,
    ex: 'p=ρgh：同种液体压强随深度增大；不同液体同一深度还要比密度。液体内部各个方向都有压强。',
  },
  {
    q: '下列利用连通器原理工作的是？',
    opts: ['注射器吸药液', '船闸与茶壶', '吸尘器', '气压计'],
    a: 1,
    ex: '上端开口、底部连通的容器才是连通器：船闸、茶壶、锅炉水位计都是；注射器与吸尘器靠大气压，气压计测大气压。',
  },
  {
    q: '浸没在水中的正方体，其浮力产生的原因是？',
    opts: ['侧面压力不平衡', '下表面受到向上的压力大于上表面向下的压力', '水的重量直接压在物体上', '物体排开了空气'],
    a: 1,
    ex: '浮力来自上下表面的压力差：F浮=F向上−F向下。侧面压力对称抵消。',
  },
  {
    q: '把同体积的钢块和混凝土块都浸没在海水中，它们受到的浮力？',
    opts: ['钢块大', '混凝土块大', '一样大', '无法比较'],
    a: 2,
    ex: '浸没时 V排 相同、液体密度相同，由 F浮=ρ液gV排，浮力一样大——与物体的材料、轻重无关。',
  },
  {
    q: '用吊秤称一个物块：空气中读数 24 kN，浸没在水中读数 14 kN。物块受到的浮力和排开水的体积分别是（g 取 10 N/kg，ρ水=1000 kg/m³）',
    opts: ['10 kN；1 m³', '10 kN；10 m³', '24 kN；2.4 m³', '38 kN；3.8 m³'],
    a: 0,
    ex: 'F浮 = G − F示 = 24 − 14 = 10 kN；V排 = F浮/(ρ水g) = 10000/(1000×10) = 1 m³。',
  },
  {
    q: '潜艇从水面下潜到水下，是靠？',
    opts: ['改变自身体积', '改变自身重力', '改变海水密度', '螺旋桨向下推'],
    a: 1,
    ex: '浸没后 V排 不变、浮力不变，潜艇靠向压载水舱注水/吹除压缩空气来改变自重，实现浮沉。',
  },
  {
    q: '一艘船从海里开进内河，船受到的浮力和吃水的变化是？',
    opts: ['浮力变小，吃水变浅', '浮力不变，吃水变深', '浮力变大，吃水变深', '浮力不变，吃水不变'],
    a: 1,
    ex: '漂浮时浮力始终等于重力（不变）；内河水密度更小，V排=F浮/(ρg) 变大，吃水变深——所以载重线标志里 F（淡水）线在 S（海水）线之上。',
  },
  {
    q: '同一支密度计放进三种液体都漂浮，浮得最高的那种液体？',
    opts: ['密度最大', '密度最小', '对密度计的浮力最大', '对密度计的浮力最小'],
    a: 0,
    ex: '漂浮时 F浮=G 不变；浮得最高 → V排 最小 → 由 F浮=ρ液gV排 知该液体密度最大（如饱和盐水）。',
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
        ex.textContent = (correct ? '✓ 回答正确。' : '✗ 再想想。') + item.ex;
        ex.classList.add('show');
        card.querySelector('.q-score').textContent = `得分：${score}`;
        const foot = card.querySelector('.q-foot');
        const next = document.createElement('button');
        next.type = 'button';
        next.className = 'ctl-btn active';
        next.textContent = idx < QUIZ.length - 1 ? '下一题 →' : '查看成绩 →';
        next.addEventListener('click', () => { idx++; if (idx < QUIZ.length) renderQ(); else renderResult(); });
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

/* ============ 章节定义 ============ */

const SECTIONS = [
  {
    id: 'pressure', title: '液体压强与深度',
    html: `<p>液体内部存在压强，方向是<b>四面八方</b>都有。大小只由<b>深度</b>和<b>液体密度</b>决定：</p>
<p><span class="hl">p = ρgh</span>（h 是从自由液面到该点的竖直距离）。</p>
<p>跟着深潜器下潜：拖动深度滑杆，看压强读数从 0 线性涨到 600 kPa 量级（每下潜 10 m 约增加一个大气压！）；切换海水/淡水比较密度的影响。同一深度，各个方向的压强<b>相等</b>。</p>
<p>留意两个细节：舷外挂着的<b>泡沫杯</b>会被海水慢慢压瘪；水色随深度变暗——红光最先被吸收，几十米以下只剩蓝绿一片。</p>`,
    enter() {
      useScene('pressure', buildPressure);
      app.setCamera([4.5, -2.2, 10.5], [-1, -2.2, 0]);
      setUnderwater(true, PRS.depth / 60);
      pressureCtl();
    },
  },
  {
    id: 'lock', title: '连通器：船闸',
    html: `<p>上端开口、底部连通的容器叫<b>连通器</b>：液体静止时各容器<b>液面总保持相平</b>。</p>
<p>船闸是连通器最壮观的应用：闸室先与下游构成连通器（水面齐下游），再与上游构成连通器（水面齐上游），船就能「走楼梯」翻过水位差。</p>
<p>点「下一步」逐步完成一次过闸，注意每一步哪个阀门/闸门在动、闸室水位在与谁看齐。读数栏里两道闸门两侧的<b>水位差</b>：差值不为零时硬开闸门，门要承受几百吨的水压力。</p>`,
    enter() {
      useScene('lock', buildLock);
      app.setCamera([12.5, 8, 9.5], [0, 0.8, 0]);
      LOCK.auto = false;
      lockCtl();
    },
  },
  {
    id: 'cube', title: '浮力的成因',
    html: `<p>浸在液体里的物体，各个面都受到液体的压力：<b>前后、左右的压力对称抵消</b>；但下表面更深、压强更大——<b>向上的压力大于向下的压力</b>。</p>
<p>这个压力差就是浮力：<span class="hl">F浮 = F向上 − F向下 = (p底 − p顶)·S</span>。</p>
<p>把沉箱的「上表面深度」调到负值（露出一半）：顶面在水面上，压强为 0，浮力全部来自底面的向上压力。再整体下潜，观察上下压强都变大、但<b>差值不变</b>——浸没后浮力与深度无关。打开「底面陷进淤泥」：下面没有水向上托，浮力消失，沉箱被压在海底拔不起来——桥墩也不受浮力。</p>
<p>也可以<b>直接上下拖动沉箱</b>，实时看两个面的压强此消彼长。</p>`,
    enter() {
      useScene('cube', buildCube);
      app.setCamera([4.2, 1.6, 8.2], [0, -0.6, 0]);
      cubeCtl();
    },
  },
  {
    id: 'weigh', title: '称重法测浮力',
    html: `<p>塔吊把物块缓缓吊入海水：吊秤的读数<b>越来越小</b>。</p>
<p>物体在水中受到向上的浮力，测力计的示数因此变小：<span class="hl">F浮 = G − F示</span>——这就是<b>称重法</b>，实验室里测浮力的第一手段。左下角的<b>浮力曲线</b>画出浮力随浸入的变化：浸入越多浮力越大，<b>完全浸没</b>后再往下放，浮力不再变化。</p>
<p>换成<b>钢块</b>：钢块重得多，可完全浸没后浮力和混凝土块一样大——浮力只和排开液体的体积有关，与物体的轻重、材料无关。</p>`,
    enter() {
      useScene('weigh', buildWeigh);
      app.setCamera([8.0, 6.0, 12.5], [-1.2, 2.0, 2.4]);
      WEI.frac = 0; WEI.dipping = null;
      weighCtl();
    },
  },
  {
    id: 'arch', title: '阿基米德原理',
    html: `<p>溢水杯装满水，把石块缓缓压入：排开的水顺着溢水嘴流进小烧杯。</p>
<p>称一称：<b>物体受到的浮力，恰好等于它排开的水所受的重力</b>——这就是阿基米德原理：</p>
<p><span class="hl">F浮 = G排 = ρ液·g·V排</span></p>
<p>换成木块试试：木块漂浮，浸入更少、排开的水更少，但 F浮 依然等于 G排（也等于木块自重）。原理对一切浸——部分浸或全浸——的物体都成立。</p>`,
    enter() {
      useScene('arch', buildArch);
      app.setCamera([1.6, 3.4, 8.6], [0.1, 1.7, 0]);
      ARCH.dipped = 0; ARCH.dipping = null;
      archCtl();
    },
  },
  {
    id: 'sub', title: '浮沉条件：潜艇',
    html: `<p>物体的浮沉取决于<b>自身密度与液体密度</b>的比较：ρ物&lt;ρ液 → 漂浮；ρ物=ρ液 → 悬浮；ρ物&gt;ρ液 → 下沉。</p>
<p>潜艇浸没后 V排 不变、浮力不变，它靠向<b>压载水舱</b>注水/吹除压缩空气来改变<b>自重</b>：注水变重下潜，排水变轻上浮，注到恰好等于水密度就悬停在水中。拖动注水滑杆，看水舱里的水一点点涨起来。</p>
<p>打开「海水密度跃层」再悬浮试试：60 m 以下海水密度骤然变小，浮力跟着变小，悬浮的潜艇会急速「掉深」——这叫<b>海中断崖</b>。2014 年我国 372 潜艇就遭遇过，官兵紧急向水舱供气排水（点「紧急吹除」），三分钟内化险为夷。</p>`,
    enter() {
      useScene('sub', buildSub);
      app.setCamera([10.0, -1.1, 7.8], [0, -0.9, 0]);
      setUnderwater(true, 0.3);
      subCtl();
    },
  },
  {
    id: 'ship', title: '轮船与载重线',
    html: `<p>轮船是空心的大「密度」智慧：钢板密度远大于水，但做成空壳后<b>平均密度小于水</b>，于是漂浮。漂浮时：</p>
<p><span class="hl">F浮 = G总</span>（排水量 = 总重）。装得越重，排开水越多，吃水越深。</p>
<p>点「吊装一箱」看岸桥往船上装集装箱，船越来越重、吃水越来越深——看船首船尾的<b>吃水标尺</b>和船中的<b>载重线标志</b>（S 夏季海水 / W 冬季 / T 热带 / F 夏季淡水）。切「入海」：海水密度大，同样载重吃水变浅。把货物装<b>偏向左舷</b>：船身会向一侧横倾。</p>`,
    enter() {
      useScene('ship', buildShip);
      app.setCamera([14.5, 6.8, 11.5], [0, 0.4, 0.6]);
      SHIP.loadT = -1;
      shipCtl();
    },
  },
  {
    id: 'hyd', title: '密度计与水尺计重',
    html: `<p><b>密度计</b>是一支下方装铅粒的密封玻璃浮计：漂浮时 F浮 = G（不变），所以</p>
<p><span class="hl">V排 = G / (ρ液·g)</span> —— 液体密度越大，密度计浸入越浅、浮得越高。杆上的刻度越往下数值越大，液面对着哪格，密度就是多少。</p>
<p><b>直接按住密度计往下压再松手</b>：它会上下振荡几下才停稳——这提示我们，读数要等它静止。切换待测液体，对比两只量筒里同一支密度计的吃水：酒精里沉得深，饱和盐水里浮得高。商船的「水尺计重」（读六面吃水算货重）与「曹冲称象」用的也是同一原理。</p>`,
    enter() {
      useScene('hyd', buildHydrometer);
      app.setCamera([0, 4.2, 9.0], [0, 2.6, 0]);
      HYD.press = 0; HYD.y = 0; HYD.vel = 0; HYD.dragging = false;
      hydCtl();
    },
  },
  {
    id: 'quiz', title: '随堂检测',
    html: `<p>9 道选择题，检验一下压强与浮力的掌握情况——概念与计算都有。答完可重新开始。</p>`,
    enter() {
      useScene('ship', buildShip);
      app.setCamera([10.8, 4.0, 7.6], [0, 0.7, 0]);
      ctl.clear();
      showQuiz();
    },
  },
];

/* ============ 帧循环 ============ */

app.onFrame((dt) => {
  const t = performance.now() * 0.001;
  /* 水面波浪（仅可见场景） */
  for (const w of waters) {
    if (!w.mesh.parent.visible) continue;
    const pos = w.mesh.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const bx = w.base.getX(i), bz = w.base.getZ(i);
      pos.setY(i, waveH(bx + w.mesh.position.x, bz + w.mesh.position.z, t));
    }
    pos.needsUpdate = true;
  }
  /* 船闸动画 + 阀门手轮转动 */
  if (scenes.lock && scenes.lock.visible) {
    if (LOCK.step === 1) {
      LOCK.level += (2.6 - LOCK.level) * Math.min(1, dt * 0.9);
      layoutLock();
      hset('princ', '闸室水位升至 ' + LOCK.level.toFixed(1) + ' m（上游 2.6 m）');
      lockReadouts();
      LOCK.valveWheel.userData.spin.rotation.z += dt * 5;
    } else {
      lockReadouts();
    }
    if (LOCK.auto) {
      LOCK.autoT = (LOCK.autoT || 0) + dt;
      if (LOCK.autoT > 2.8) { LOCK.autoT = 0; setLockStep(LOCK.step + 1 > 4 ? 0 : LOCK.step + 1); }
    }
  }
  /* 称重法自动浸入 */
  if (scenes.weigh && scenes.weigh.visible && WEI.dipping) {
    WEI.frac = clamp(WEI.frac + WEI.dipping * dt * 0.22, 0, 1);
    if (WEI.frac <= 0 || WEI.frac >= 1) WEI.dipping = null;
    updWeigh();
  }
  /* 阿基米德浸入 + 滴落水珠 */
  if (scenes.arch && scenes.arch.visible) {
    if (ARCH.dipping) {
      ARCH.dipped = clamp(ARCH.dipped + ARCH.dipping * dt * 0.35, 0, 1);
      if (ARCH.dipped <= 0 || ARCH.dipped >= 1) ARCH.dipping = null;
      updArch();
    }
    if (ARCH.stream.visible) {
      const dummy = new THREE.Object3D();
      ARCH.dropSeeds.forEach((s, i) => {
        s.t += s.v * dt;
        if (s.t > 1) s.t -= 1;
        dummy.position.set(-0.36 + Math.sin(s.t * 20 + i) * 0.02, 2.5 - s.t * 1.1, 0);
        dummy.scale.setScalar(0.7 + 0.5 * Math.sin(s.t * 12 + i));
        dummy.updateMatrix();
        ARCH.drops.setMatrixAt(i, dummy.matrix);
      });
      ARCH.drops.instanceMatrix.needsUpdate = true;
    }
  }
  /* 潜艇 + 螺旋桨 */
  if (scenes.sub && scenes.sub.visible) {
    updSub();
    SUB.sub.userData.prop.rotation.x += dt * 2.4;
  }
  /* 轮船 + 横倾 + 岸桥吊装 */
  if (scenes.ship && scenes.ship.visible) {
    updShip();
    SHIP.heel += (SHIP.heelTarget - SHIP.heel) * Math.min(1, dt * 2.2);
    tickLoad(dt);
  }
  /* 深潜器姿态/螺旋桨/海带/气泡 */
  if (scenes.pressure && scenes.pressure.visible) {
    PRS.sub.userData.prop.rotation.x += dt * 2.2;
    if (PRS.kelp) PRS.kelp.forEach((s) => { s.grp.rotation.z = Math.sin(t * 0.8 + s.phase) * 0.055; });
    if (PRS.bubbles) {
      const dummy = new THREE.Object3D();
      PRS.bubbles.seeds.forEach((s, i) => {
        s.y += s.v * dt;
        if (s.y > 0.1) s.y = PRS.bubbles.y0;
        dummy.position.set(s.x + Math.sin(t * 1.4 + i) * 0.08, s.y, s.z);
        dummy.scale.setScalar(0.6 + 0.7 * Math.sin(i * 2.1));
        dummy.updateMatrix();
        PRS.bubbles.mesh.setMatrixAt(i, dummy.matrix);
      });
      PRS.bubbles.mesh.instanceMatrix.needsUpdate = true;
    }
  }
  /* 密度计回弹振荡 */
  if (scenes.hyd && scenes.hyd.visible) tickHyd(dt);
});

/* ============ 三栏布局驱动（左栏章节列表 / 右栏详解联动 / 栏折叠 / 专注模式） ============ */

const chapNav = document.getElementById('chapNav');
const chapCount = document.getElementById('chapCount');
const detailNo = document.getElementById('detailNo');
const detailTitle = document.getElementById('detailTitle');
const lessonEl = document.getElementById('lesson');
const detailBody = document.getElementById('detailBody');
const controlsEl = document.getElementById('controls');
const floatShell = document.getElementById('floatShell');
let chapterIdx = 0;

/* 拖拽提示角标（可拖物体的章节显示） */
const dragHint = document.createElement('div');
dragHint.className = 'stage-drag-hint';
stage.appendChild(dragHint);
const DRAG_HINTS = { cube: '✋ 直接上下拖动沉箱', hyd: '✋ 按住密度计下压，松手看回弹' };

/* 章节竖排按钮：序号 + 标题，点击切章，当前章 .on 高亮 */
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
  /* 折叠竖条上的章节信息同步（左栏序号 / 右栏竖排标题） */
  railNoL.textContent = String(chapterIdx + 1).padStart(2, '0');
  railTitleR.textContent = sec.title;
  lessonEl.innerHTML = sec.html || '';
  if (activeSectionCleanup) { activeSectionCleanup(); activeSectionCleanup = null; }
  setUnderwater(false);
  sec.enter();
  /* 本章无控件时整块手风琴收走（不动用户的手风琴偏好） */
  accSecs.controls.classList.toggle('acc-empty', !controlsEl.children.length);
  accSecs.data.classList.toggle('acc-empty', false);
  /* 拖拽提示 / 曲线浮窗按章节显隐 */
  dragHint.textContent = DRAG_HINTS[sec.id] || '';
  dragHint.classList.toggle('show', !!DRAG_HINTS[sec.id]);
  if (initChartWindow.el) initChartWindow.el.style.display = sec.id === 'weigh' ? '' : 'none';
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

const FOLD_KEY = { l: 'float.foldL', r: 'float.foldR' };
let foldL = false;
let foldR = false;
let focusSaved = null; /* 进入专注模式前的独立折叠状态 [foldL, foldR]，退出时恢复 */

try {
  foldL = localStorage.getItem(FOLD_KEY.l) === '1';
  foldR = localStorage.getItem(FOLD_KEY.r) === '1';
} catch (e) { /* localStorage 不可用（隐私模式等）时仅本次会话内生效 */ }

function applyFold() {
  floatShell.classList.toggle('fold-l', foldL);
  floatShell.classList.toggle('fold-r', foldR);
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
  floatShell.classList.toggle('focus-mode', on);
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

const ACC_KEYS = { lesson: 'float.accLesson', controls: 'float.accControls', data: 'float.accData' };
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

/* ---------------- 原版功能块 1:1：上一/下一课题（, .）· 重做实验 · 画质/流畅度优先 · 测量记录折叠（]） ---------------- */

const chapPrev = document.getElementById('chapPrev');
const chapNext = document.getElementById('chapNext');
const resetBtn = document.getElementById('resetBtn');
const liteBtn = document.getElementById('liteBtn');

/* 上一课题 / 下一个课题：与原版快捷键一致（, 上一 / . 下一），列表末尾循环 */
function gotoChapter(i) { selectChapter((i + SECTIONS.length) % SECTIONS.length); }
chapPrev.addEventListener('click', () => gotoChapter(chapterIdx - 1));
chapNext.addEventListener('click', () => gotoChapter(chapterIdx + 1));

/* 重做实验：恢复各章可交互参数到定义初值后重进当前章（enter() 内的复位与相机/控件重建照常执行） */
const RESET_STATES = () => ({ PRS, LOCK, CUBE, WEI, ARCH, SUB, SHIP, HYD });
const STATE_DEFAULT = (() => {
  const snap = {};
  for (const [k, o] of Object.entries(RESET_STATES())) {
    const d = {};
    for (const [pk, pv] of Object.entries(o)) {
      if (typeof pv === 'number' || typeof pv === 'boolean' || typeof pv === 'string') d[pk] = pv;
    }
    snap[k] = d;
  }
  return snap;
})();
function redoExperiment() {
  const live = RESET_STATES();
  for (const [k, d] of Object.entries(STATE_DEFAULT)) Object.assign(live[k], d);
  selectChapter(chapterIdx);
  /* 两处几何不进帧循环的章节：称重吊件与船闸水位立即按复位值重排 */
  if (scenes.weigh && scenes.weigh.visible) updWeigh();
  if (scenes.lock && scenes.lock.visible) setLockStep(LOCK.step, true);
}
resetBtn.addEventListener('click', redoExperiment);

/* 画质优先 / 流畅度优先：流畅档压低像素比（本实现阴影为烘焙贴图、无后期链路，
   渲染主开销在像素比——原版语义「低配设备流畅运行」用同一切换达成），localStorage 记忆 */
const LITE_KEY = 'float.lite';
let liteMode = false;
try { liteMode = localStorage.getItem(LITE_KEY) === '1'; } catch (e) { /* 隐私模式等忽略 */ }
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

/* 键盘快捷键：, 上一课题 / . 下一课题 / ] 收起·展开测量记录（数据读数块） */
window.addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const t = e.target;
  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
  if (e.key === ',') gotoChapter(chapterIdx - 1);
  else if (e.key === '.') gotoChapter(chapterIdx + 1);
  else if (e.key === ']') toggleAcc('data');
});

/* ============ 启动（零外部资产：背景/环境/纹理全程序化，首帧即建） ============ */

initChartWindow();
setTimeout(() => {
  loader.hide();
  window.__eduSections = { select: selectChapter };
  /* 调试句柄（自动化验收/性能自查用） */
  window.__floatDebug = { vfx, app };
  selectChapter(0);
}, 60);
