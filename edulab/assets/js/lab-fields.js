/* EduLab · 电场与磁场（fields）
 * 章节：电场线与等势面 / 电场力做功与电势能 / 平行板电容器 / 示波管 / 磁感线 / 安培力 /
 *       洛伦兹力 / 质谱仪与回旋加速器 / 电磁感应与楞次定律 / 交流发电机 / 自由实验 / 随堂检测
 * 场线用 RK2 数值积分（拖动电荷节流重建并 dispose 旧 geometry）；
 * 洛伦兹力用绕 B 轴精确旋转（速率恒定），沙盒合场用半隐式积分 F=qE+qv×B。
 * 布局（micro 三件套移植）：真·三栏教学布局——左栏课程大纲列表（点击切章）/ 中栏 3D 舞台
 *       （相机飞行）/ 右栏知识点详解 + 本章控件 + 数据读数；左右栏独立折叠（28px 竖条）+
 *       专注模式 + 右栏三块手风琴（localStorage 记忆，切章不重置）；
 *       角落浮窗（铁屑/检流计/波形）可折叠为 40px 圆形徽标。
 * 视觉工艺（edu-vfx 轻接入）：后处理管线 + cubic 运镜；HDR 只作环境反射光，背景由工艺管理。
 */
import {
  THREE, TAU, clamp,
  createApp, makeLoader,
  createControlsPanel, makeHUD, makeTextSprite, makeGlowTexture,
} from './edu-core.js';
import {
  attachVFX, PAL,
  matCoat, matStd, matGlow,
  makeStudioEnvironment, makeWoodTexture, makeLabelTexture,
} from './edu-vfx.js';

/* ---------------- 本实验专属样式（不改动共享 lab.css） ---------------- */

const style = document.createElement('style');
style.textContent = `
.fields-corner2 { position:absolute; left:14px; bottom:82px; z-index:12; width:280px;
  border-radius:14px; overflow:hidden; border:1px solid var(--card-border);
  box-shadow:var(--shadow); background:var(--card); }
.fields-corner2 .cw-head { display:flex; align-items:center; gap:8px; padding:7px 12px;
  font-size:12.5px; color:var(--text-dim); background:var(--chip-bg); }
.fields-corner2 .cw-head b { color:var(--text); }
.fields-corner2 canvas { display:block; width:100%; height:150px; }
@media (max-width: 640px) { .fields-corner2 { left:10px; bottom:74px; width:216px; } }
`;
document.head.appendChild(style);

/* ---------------- 场景 ---------------- */

const stage = document.getElementById('stage');
const loader = makeLoader(stage, '正在搭建电场磁场实验室…');

const app = createApp({
  container: stage,
  fov: 42, near: 0.05, far: 80,
  cameraPos: [0, 3.2, 4.6],
  target: [0, 1.05, 0],
  minDistance: 0.8, maxDistance: 14,
  exposure: 1.0,
  keepBackground: true,
});
const { scene, camera, controls } = app;
/* 视觉工艺轻接入：后处理管线接管渲染循环与相机缓动（setCamera 升级为 cubic 运镜），
   背景交给 illus 模式管理；金属/玻璃反射走程序化摄影棚（不再引外部 HDR） */
const vfx = attachVFX(app, 'illus');
scene.environment = makeStudioEnvironment(app.renderer);

scene.add(new THREE.AmbientLight(0xbcc6d4, 0.52));
const sunLight = new THREE.DirectionalLight(0xfff2e2, 1.55);
sunLight.position.set(3.5, 5, 3);
scene.add(sunLight);
const fillLight = new THREE.DirectionalLight(0xdfe8ff, 0.5);
fillLight.position.set(-4, 3, -2.5);
scene.add(fillLight);
/* 台面暖色反弹：从木纹桌面往上补一层低强度暖光，压住"漂浮感" */
const deskBounce = new THREE.PointLight(0xffd9a0, 0.4, 8, 1.8);
deskBounce.position.set(0, 0.4, 1.1);
scene.add(deskBounce);

const PLANE_Y = 1.06; // 电荷 / 粒子所在水平面高度
const UPV = new THREE.Vector3(0, 1, 0);
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
function stdMat(opts) { return new THREE.MeshStandardMaterial(opts); }
function box(w, h, d, mat) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); }
function cyl(r1, r2, h, mat) { return new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, 24), mat); }

/* ================= 工艺基建（材质分层 / 程序化纹理 / 接触阴影 / 圆角几何） ================= */

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
/* 灰度画布贴图（roughnessMap / normalMap 用，保持线性空间） */
function dataTex(w, h, draw) {
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  draw(cv.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}
/* 烤漆微噪点粗糙度贴图（漆面橘皮/细划痕） */
function paintNoiseTexture(size = 256, repeat = 3) {
  const tex = dataTex(size, size, (ctx) => {
    const img = ctx.createImageData(size, size);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = clamp(150 + Math.random() * 90, 0, 255);
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  });
  tex.repeat.set(repeat, repeat);
  return tex;
}
/* 滚花法线贴图（接线柱/旋钮防滑纹） */
function knurlNormalTexture(cols = 48) {
  const w = 512, h = 32;
  return dataTex(w, h, (ctx) => {
    for (let x = 0; x < w; x++) {
      const s = Math.sin((x / w) * cols * Math.PI * 2) * 0.75;
      ctx.fillStyle = `rgb(${Math.round((s * 0.5 + 0.5) * 255)},128,${Math.round(Math.sqrt(Math.max(0, 1 - s * s)) * 127 + 128)})`;
      ctx.fillRect(x, 0, 1, h);
    }
  });
}

/* ---- 材质分层（电磁教具族：烤漆 / 镀铬 / 黄铜 / 紫铜 / 胶木 / 陶瓷 / 玻璃） ---- */
const F_PAINT_RED = matCoat(0xc23b30, { roughness: 0.4, metalness: 0.06, clearcoat: 0.7, clearcoatRoughness: 0.26 });
F_PAINT_RED.roughnessMap = paintNoiseTexture(256, 3);
F_PAINT_RED.envMapIntensity = 0.75;
const F_PAINT_BLUE = matCoat(0x2e5fb8, { roughness: 0.4, metalness: 0.06, clearcoat: 0.7, clearcoatRoughness: 0.26 });
F_PAINT_BLUE.envMapIntensity = 0.75;
F_PAINT_BLUE.roughnessMap = F_PAINT_RED.roughnessMap;
const F_BAKELITE = matCoat(0x27221d, { roughness: 0.46, metalness: 0.08, clearcoat: 0.4, clearcoatRoughness: 0.34 });
const M_CHROME = matStd(0xe6e9ee, { roughness: 0.16, metalness: 1 });
const M_SATIN = matStd(0xc9cdd3, { roughness: 0.3, metalness: 1 });
M_SATIN.roughnessMap = paintNoiseTexture(128, 2);
const M_BRASS = matStd(PAL.brass, { roughness: 0.3, metalness: 1 });
const M_COPPER = matStd(0xb87346, { roughness: 0.34, metalness: 1 });
const M_STEEL_DARK = matStd(0x3a3d42, { roughness: 0.35, metalness: 0.9 });
const M_RUBBER = matStd(0x1d2126, { roughness: 0.88, metalness: 0.04 });
const M_CERAMIC = matCoat(0xe9e4d6, { roughness: 0.34, metalness: 0.03, clearcoat: 0.5, clearcoatRoughness: 0.3 });
const M_GLASS = matCoat(0xe6f0f2, { roughness: 0.05, opacity: 0.26 });
const M_PLASTIC_SLAB = matCoat(0xe8e6da, { roughness: 0.42, opacity: 0.4 });
const M_WOOD_DARK = matStd(0x4e341e, { roughness: 0.7 });
function matKnurl(color, metal = 0.4, cols = 48) {
  const m = matStd(color, { roughness: 0.38, metalness: metal });
  m.normalMap = knurlNormalTexture(cols);
  m.normalScale = new THREE.Vector2(1.3, 1.3);
  return m;
}
const M_KNURL_BRASS = matKnurl(PAL.brass, 1, 44);

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
/* 圆角平板（挤出+倒角，顶面 y=0），rot: 'flat' 平放 / 'up' 立起（厚度沿 Z） */
function roundedSlab(w, d, h, r, mat, bevel = 0.015, rot = 'flat') {
  const g = new THREE.ExtrudeGeometry(roundedRectShape(w, d, r), {
    depth: h, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel,
    bevelSegments: 3, curveSegments: 14,
  });
  g.rotateX(rot === 'flat' ? -Math.PI / 2 : 0);
  if (rot === 'up') g.translate(0, 0, -h / 2);
  return new THREE.Mesh(g, mat);
}
/* 铭牌贴花面片（多边形偏移防 z-fight） */
function decalPlane(tex, w, h) {
  const mat = new THREE.MeshStandardMaterial({
    map: tex, transparent: true, roughness: 0.5, metalness: 0,
    depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2,
  });
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
}
/* 黄铜接线柱（底座圆盘 + 滚花旋钮 + 一字槽），教学装置通用件 */
function makePost(h = 0.09) {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.052, 0.016, 14), M_BRASS);
  base.position.y = 0.008;
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, h, 12), M_BRASS);
  stem.position.y = h / 2 + 0.012;
  const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.031, 0.028, 0.024, 16), M_KNURL_BRASS);
  knob.position.y = h + 0.03;
  const slot = box(0.042, 0.006, 0.009, matStd(0x14161a, { roughness: 0.6 }));
  slot.position.y = h + 0.043;
  g.add(base, stem, knob, slot);
  return g;
}

/* ---- 接触阴影：桌面一张烘焙径向渐变贴图（单 draw call，免实时 shadowMap） ---- */
const SHADOW_BLOBS = [];
function bakeContactShadow(x, z, w, d, opacity = 0.4) {
  SHADOW_BLOBS.push({ x, z, w, d, opacity });
}
function buildBenchShadow() {
  const CW = 1024, CH = 704;
  const cv = document.createElement('canvas');
  cv.width = CW; cv.height = CH;
  const ctx = cv.getContext('2d');
  for (const b of SHADOW_BLOBS) {
    const px = ((b.x + 4.8) / 9.6) * CW;
    const pz = ((b.z + 3.3) / 6.6) * CH;
    const rx = (b.w / 9.6) * CW / 2;
    const rz = (b.d / 6.6) * CH / 2;
    const g = ctx.createRadialGradient(px, pz, 0, px, pz, Math.max(rx, rz));
    g.addColorStop(0, `rgba(8,6,3,${b.opacity})`);
    g.addColorStop(0.55, `rgba(8,6,3,${b.opacity * 0.5})`);
    g.addColorStop(1, 'rgba(8,6,3,0)');
    ctx.save();
    ctx.translate(px, pz);
    ctx.scale(rx / Math.max(rx, rz), rz / Math.max(rx, rz));
    ctx.translate(-px, -pz);
    ctx.fillStyle = g;
    ctx.fillRect(px - Math.max(rx, rz), pz - Math.max(rx, rz), Math.max(rx, rz) * 2, Math.max(rx, rz) * 2);
    ctx.restore();
  }
  const tex = new THREE.CanvasTexture(cv);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(9.6, 6.6), new THREE.MeshBasicMaterial({
    map: tex, transparent: true, depthWrite: false,
  }));
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.0045;
  m.renderOrder = -1;
  return m;
}

/* 沿曲线的变宽截面放样（教学装置 C 形 / 弯臂结构件）：
 * 曲线 frame 的宽度轴固定世界 X、深度轴取切线×X；截面为圆角矩形环，
 * 宽深沿弧长关键帧 + smoothstep 缓动；端帽扇面封口（法线朝向自动翻转绕序） */
function sweepRoundedSection(curve, segs, wKeys, dKeys, groupBreaks = null) {
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
  if (groupBreaks) {
    geo.clearGroups();
    const brs = [...groupBreaks.map((f) => Math.round(ringM * (6 * f + 3))), idx.length];
    let start = 0;
    brs.forEach((end, gi) => { geo.addGroup(start, end - start, gi); start = end; });
  }
  geo.computeVertexNormals();
  return geo;
}

const worldG = new THREE.Group();
scene.add(worldG);
function buildWorld() {
  /* ---- 环境地面（深色摄影棚地台，承托实验桌） ---- */
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(14, 48),
    matStd(0x1a2027, { roughness: 0.96, metalness: 0 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.96;
  worldG.add(ground);

  /* ---- 木纹实验桌（顶面 y=0：台面板 + 前后封边 + 四条车削桌腿 + 拉杆） ---- */
  const woodTop = makeWoodTexture({ base: '#6e4c2c', dark: '#4a3120', light: '#8a6640', streaks: 105, bands: 8, seed: 41 });
  woodTop.repeat.set(2.2, 1.6);
  const benchMat = matStd(0xffffff, { roughness: 0.6, metalness: 0.04 });
  benchMat.map = woodTop;
  const top = box(9.6, 0.16, 6.6, benchMat);
  top.position.y = -0.08;
  worldG.add(top);
  for (const zs of [3.3, -3.3]) {
    const edge = box(9.6, 0.5, 0.16, M_WOOD_DARK);
    edge.position.set(0, -0.42, zs);
    worldG.add(edge);
  }
  /* 车削桌腿（LatheGeometry 轮廓：柱头 → 鼓腹 → 收脚 → 踢脚） */
  const legProf = [
    [0.11, 0], [0.13, 0.05], [0.095, 0.16], [0.085, 0.5], [0.105, 0.72],
    [0.075, 0.88], [0.07, 0.93], [0.085, 0.97],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  for (const [lx, lz] of [[-4.4, -2.9], [4.4, -2.9], [-4.4, 2.9], [4.4, 2.9]]) {
    const leg = new THREE.Mesh(new THREE.LatheGeometry(legProf, 18), M_WOOD_DARK);
    leg.position.set(lx, -0.98, lz);
    leg.scale.y = -1;   /* 轮廓以 y∈[0,0.97] 向下生长 */
    worldG.add(leg);
  }
  for (const zs of [-2.9, 2.9]) {
    const bar = box(8.5, 0.07, 0.1, M_WOOD_DARK);
    bar.position.set(0, -0.78, zs);
    worldG.add(bar);
  }

  /* ---- 坐标纸垫（深色制图纸：细格 + 10 格加重线 + 边框），场区教学锚点 ---- */
  const matTex = canvasTex(512, 384, (ctx) => {
    ctx.fillStyle = '#2c3641';
    ctx.fillRect(0, 0, 512, 384);
    ctx.strokeStyle = 'rgba(255,255,255,0.09)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= 512; x += 16) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 384); ctx.stroke(); }
    for (let y = 0; y <= 384; y += 16) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(512, y); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(255,255,255,0.17)';
    for (let x = 0; x <= 512; x += 80) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 384); ctx.stroke(); }
    for (let y = 0; y <= 384; y += 80) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(512, y); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 3;
    ctx.strokeRect(2, 2, 508, 380);
  });
  const matMesh = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 3.6), matStd(0xffffff, { roughness: 0.85, metalness: 0 }));
  matMesh.material.map = matTex;
  matMesh.rotation.x = -Math.PI / 2;
  matMesh.position.y = 0.003;
  matMesh.renderOrder = -1;
  worldG.add(matMesh);

  /* ---- 道具阵列（电磁实验室语境件，全部带接触阴影） ---- */

  /* 小磁针：黄铜底座 + 顶针 + 菱形磁针（红 N / 米白 S）+ 玻璃罩 */
  {
    const g = new THREE.Group();
    g.position.set(3.55, 0, -1.85);
    g.rotation.y = 0.42;
    const base = new THREE.Mesh(new THREE.LatheGeometry([
      [0.02, 0], [0.22, 0], [0.24, 0.03], [0.19, 0.06], [0.07, 0.1], [0.045, 0.16], [0.02, 0.2],
    ].map(([r, y]) => new THREE.Vector2(r, y)), 22), M_BRASS);
    const needleG = new THREE.Group();
    needleG.position.y = 0.21;
    const nCone = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.19, 10), F_PAINT_RED);
    nCone.position.y = 0.095;
    const sCone = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.19, 10), matStd(0xe8e2d2, { roughness: 0.5 }));
    sCone.rotation.x = Math.PI;
    sCone.position.y = -0.095;
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.024, 10, 8), M_BRASS);
    needleG.add(nCone, sCone, cap);
    needleG.rotation.y = -0.7;
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.27, 22, 12, 0, TAU, 0, Math.PI / 2), M_GLASS);
    dome.position.y = 0.1;
    g.add(base, needleG, dome);
    bakeContactShadow(3.55, -1.85, 0.85, 0.85, 0.3);
    worldG.add(g);
  }

  /* 铁屑罐：铁皮罐身 + 撒孔穹顶（凸点纹理）+ 提环 + 标签 */
  {
    const g = new THREE.Group();
    g.position.set(4.15, 0, -0.95);
    g.rotation.y = -0.3;
    const body = cyl(0.17, 0.17, 0.3, matStd(0x8b939c, { roughness: 0.42, metalness: 0.75 }));
    body.position.y = 0.15;
    const lidTex = canvasTex(128, 128, (ctx) => {
      ctx.fillStyle = '#7c848d';
      ctx.fillRect(0, 0, 128, 128);
      for (let i = 0; i < 46; i++) {
        const a = (i * 2.399) % TAU, r = 6 + (i / 46) * 52;
        ctx.fillStyle = '#191d21';
        ctx.beginPath();
        ctx.arc(64 + Math.cos(a) * r, 64 + Math.sin(a) * r, 3.1, 0, TAU);
        ctx.fill();
      }
    });
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.17, 20, 10, 0, TAU, 0, Math.PI / 2),
      matStd(0xffffff, { roughness: 0.45, metalness: 0.7 }));
    dome.material.map = lidTex;
    dome.scale.y = 0.55;
    dome.position.y = 0.3;
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.008, 6, 18, Math.PI), M_STEEL_DARK);
    handle.position.y = 0.41;
    const lblMat = matStd(0xffffff, { roughness: 0.85 });
    lblMat.map = makeLabelTexture(['铁屑', '磁感线演示用'], { w: 220, h: 130, lineSizes: [40, 22] });
    const lbl = new THREE.Mesh(new THREE.CylinderGeometry(0.175, 0.175, 0.16, 18, 1, true, -0.7, 1.4), lblMat);
    lbl.position.y = 0.16;
    g.add(body, dome, handle, lbl);
    bakeContactShadow(4.15, -0.95, 0.75, 0.75, 0.3);
    worldG.add(g);
  }

  /* 漆包线线轴：木质轴体 + 两端挡板 + 紫铜绕线 + 标签 */
  {
    const g = new THREE.Group();
    g.position.set(3.8, 0, 1.95);
    g.rotation.set(Math.PI / 2, 0, -0.5);
    const windTex = canvasTex(256, 64, (ctx) => {
      ctx.fillStyle = '#8a4f28';
      ctx.fillRect(0, 0, 256, 64);
      for (let x = 0; x < 256; x += 5) {
        ctx.fillStyle = x % 10 ? '#c07a40' : '#a3602f';
        ctx.fillRect(x, 0, 3, 64);
      }
      ctx.fillStyle = 'rgba(255,220,180,0.25)';
      for (let x = 0; x < 256; x += 5) ctx.fillRect(x, 6, 1.4, 52);
    });
    const windMat = matStd(0xffffff, { roughness: 0.35, metalness: 0.8 });
    windMat.map = windTex;
    const core = cyl(0.11, 0.11, 0.34, M_WOOD_DARK);
    core.rotation.z = Math.PI / 2;
    const wind = cyl(0.155, 0.155, 0.26, windMat);
    wind.rotation.z = Math.PI / 2;
    g.add(core, wind);
    for (const s of [-1, 1]) {
      const flange = cyl(0.21, 0.21, 0.028, M_WOOD_DARK);
      flange.rotation.z = Math.PI / 2;
      flange.position.x = s * 0.185;
      g.add(flange);
    }
    bakeContactShadow(3.8, 1.95, 0.8, 0.55, 0.28);
    worldG.add(g);
  }

  /* 干电池盒：双节电池 + 极性标 + 接线柱 + 引线 */
  {
    const g = new THREE.Group();
    g.position.set(-3.9, 0, 1.6);
    g.rotation.y = 0.35;
    const holder = box(0.62, 0.12, 0.24, F_BAKELITE);
    holder.position.y = 0.06;
    g.add(holder);
    for (const sx of [-1, 1]) {
      const cell = cyl(0.052, 0.052, 0.28, matStd(sx > 0 ? 0xb8452f : 0x2f3f56, { roughness: 0.4, metalness: 0.15 }));
      cell.rotation.z = Math.PI / 2;
      cell.position.set(sx * 0.15, 0.14, 0);
      const nub = cyl(0.018, 0.018, 0.02, M_BRASS);
      nub.rotation.z = Math.PI / 2;
      nub.position.set(sx * 0.15 + 0.15, 0.14, 0);
      g.add(cell, nub);
    }
    const post1 = makePost(0.07);
    post1.position.set(-0.26, 0.12, 0.06);
    const post2 = makePost(0.07);
    post2.position.set(0.26, 0.12, 0.06);
    g.add(post1, post2);
    const lblMat2 = matStd(0xffffff, { roughness: 0.85 });
    lblMat2.map = makeLabelTexture(['干电池', '1.5 V × 2'], { w: 220, h: 120, lineSizes: [38, 24] });
    const lbl2 = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.16), lblMat2);
    lbl2.position.set(0, 0.062, 0.125);
    lbl2.rotation.x = -Math.PI / 2;
    g.add(lbl2);
    bakeContactShadow(-3.9, 1.6, 1.0, 0.7, 0.3);
    worldG.add(g);
  }

  worldG.add(buildBenchShadow());
}

/* ---------------- 通用小工具：箭头 / 条形磁铁 / 角落窗 / 提示 ---------------- */

const SHAFT_GEO = new THREE.CylinderGeometry(0.012, 0.012, 0.62, 6);
SHAFT_GEO.translate(0, 0.31, 0);
const HEAD_GEO = new THREE.ConeGeometry(0.036, 0.16, 8);
HEAD_GEO.translate(0, 0.9, 0);

function makeArrow(color = 0x9aa7b5, opacity = 0.9) {
  const g = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity });
  const shaft = new THREE.Mesh(SHAFT_GEO, mat);
  const head = new THREE.Mesh(HEAD_GEO, mat);
  g.add(shaft, head);
  g.userData.mat = mat;
  return g;
}
function setArrow(g, pos, dir, len) {
  g.position.copy(pos);
  g.quaternion.setFromUnitVectors(UPV, dir);
  g.scale.setScalar(len);
}

/* 条形磁铁（教学主力件，第 5/9 章共用）：圆角挤出红/蓝烤漆半体（橘皮漆面）+
 * 镀铬磁轭中带 + 两端缎面极帽 + 侧面 N/S 刻字贴花 + 顶部教学字标 */
function makeBarMagnet(len = 1.1, h = 0.16) {
  const g = new THREE.Group();
  const halfGeo = new THREE.ExtrudeGeometry(roundedRectShape(h, h * 0.9, 0.035), {
    depth: len / 2 - 0.02, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012,
    bevelSegments: 2, curveSegments: 10,
  });
  halfGeo.rotateY(Math.PI / 2);   /* 轮廓 XY→截面，挤出沿 -X 后翻转 */
  halfGeo.translate(0.024, 0, 0);
  const n = new THREE.Mesh(halfGeo, F_PAINT_RED); n.position.x = 0.012;
  const s = new THREE.Mesh(halfGeo, F_PAINT_BLUE); s.rotation.y = Math.PI; s.position.x = -0.012;
  /* 中带磁轭（微宽于漆面，车削件观感） */
  const keeper = box(0.09, h * 1.04, h * 0.94, M_CHROME);
  const capGeoR = new THREE.CylinderGeometry(h * 0.47, h * 0.47, 0.03, 18);
  const capN = new THREE.Mesh(capGeoR, M_SATIN);
  capN.rotation.z = Math.PI / 2; capN.position.x = len / 2 + 0.004;
  const capS = new THREE.Mesh(capGeoR, M_SATIN);
  capS.rotation.z = Math.PI / 2; capS.position.x = -len / 2 - 0.004;
  const nLbl = makeTextSprite('N', { fontSize: 60, color: '#ffd9d4', scale: 0.0026 });
  nLbl.position.set(len / 4, h * 0.9, 0);
  const sLbl = makeTextSprite('S', { fontSize: 60, color: '#cfe2ff', scale: 0.0026 });
  sLbl.position.set(-len / 4, h * 0.9, 0);
  /* 两侧刻字贴花（阳极氧化白字，直接读面） */
  const sideTex = (t) => canvasTex(160, 96, (ctx) => {
    ctx.clearRect(0, 0, 160, 96);
    ctx.fillStyle = t;
    ctx.font = `800 74px 'Avenir Next', 'Helvetica Neue', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(t, 80, 52);
  });
  const nDecal = decalPlane(sideTex('N'), h * 0.6, h * 0.36);
  nDecal.position.set(len / 4, 0, h * 0.452);
  const sDecal = decalPlane(sideTex('S'), h * 0.6, h * 0.36);
  sDecal.position.set(-len / 4, 0, h * 0.452);
  g.add(n, s, keeper, capN, capS, nLbl, sLbl, nDecal, sDecal);
  g.userData.halfLen = len / 2;
  return g;
}

let cornerFolded = false;   /* 浮窗折叠态（会话内共享，一个实验同一时刻只有一角窗）；初值在下方读取偏好 */
{
  let saved = null;
  try { saved = localStorage.getItem('fields.foldCorner'); } catch (e) { /* 忽略 */ }
  cornerFolded = saved !== null ? saved === '1' : window.innerWidth <= 1100;
}

const cornerWins = [];
/* 浮窗折叠偏好：localStorage 记忆（fields.foldCorner），首访不写、用户操作后落盘；
   无记忆时 ≤1100px 首访清爽态默认折叠 */
function cornerFoldPref() {
  let saved = null;
  try { saved = localStorage.getItem('fields.foldCorner'); } catch (e) { /* 隐私模式忽略 */ }
  return saved !== null ? saved === '1' : window.innerWidth <= 1100;
}
function makeCorner(title, width = 280) {
  const win = document.createElement('div');
  win.className = 'fields-corner2';
  win.style.width = width + 'px';
  const head = document.createElement('div');
  head.className = 'cw-head';
  const b = document.createElement('b');
  b.textContent = title;
  head.appendChild(b);
  const foldBtn = document.createElement('button');
  foldBtn.type = 'button';
  foldBtn.className = 'cw-fold';
  foldBtn.textContent = '−';
  foldBtn.title = '收起浮窗';
  head.appendChild(foldBtn);
  const cv = document.createElement('canvas');
  cv.width = width * 2;
  cv.height = 300;
  const badge = document.createElement('button');
  badge.type = 'button';
  badge.className = 'cw-badge';
  badge.textContent = title.charAt(0);
  badge.title = '展开「' + title + '」浮窗';
  win.appendChild(head);
  win.appendChild(cv);
  win.appendChild(badge);
  /* 折叠态：头部与画布隐藏，整窗收成 40px 圆形徽标（贴原锚点）；偏好落盘 */
  const applyFold = () => {
    win.classList.toggle('folded', cornerFolded);
    foldBtn.textContent = cornerFolded ? '+' : '−';
    foldBtn.setAttribute('aria-expanded', String(!cornerFolded));
  };
  foldBtn.addEventListener('click', () => {
    cornerFolded = !cornerFolded;
    try { localStorage.setItem('fields.foldCorner', cornerFolded ? '1' : '0'); } catch (e) { /* 忽略 */ }
    applyFold();
  });
  badge.addEventListener('click', () => {
    cornerFolded = false;
    try { localStorage.setItem('fields.foldCorner', '0'); } catch (e) { /* 忽略 */ }
    applyFold();
  });
  stage.appendChild(win);
  cornerWins.push(win);
  stage.classList.add('has-corner');   /* 让图例避让同锚点的浮窗（历史重叠） */
  applyFold();
  return { win, cv, ctx: cv.getContext('2d') };
}
function clearCorners() {
  cornerWins.forEach((w) => w.remove());
  cornerWins.length = 0;
  stage.classList.remove('has-corner');
}

let hintEl = null;
function setHint(rows) {
  if (!rows || !rows.length) { if (hintEl) { hintEl.remove(); hintEl = null; } return; }
  if (!hintEl) {
    hintEl = document.createElement('div');
    hintEl.className = 'legend';
    stage.appendChild(hintEl);
  }
  hintEl.innerHTML = '';
  rows.forEach((t) => {
    const r = document.createElement('div');
    r.className = 'lg-row';
    r.textContent = t;
    hintEl.appendChild(r);
  });
}

/* ---------------- 电荷场工厂（第 1 章 / 自由实验共用） ---------------- */

const CHARGE_SPHERE_GEO = new THREE.SphereGeometry(0.13, 24, 18);
const CHARGE_BAND_GEO = new THREE.TorusGeometry(0.131, 0.006, 6, 32);
const SEL_RING_GEO = new THREE.RingGeometry(0.18, 0.23, 32);
const posMat = matCoat(0xe5484d, { roughness: 0.3, metalness: 0.15, clearcoat: 0.7, emissive: 0x571512 });
const negMat = matCoat(0x3f7de0, { roughness: 0.3, metalness: 0.15, clearcoat: 0.7, emissive: 0x11295c });
const selMat = new THREE.MeshBasicMaterial({ color: 0xffd166, transparent: true, opacity: 0.9, side: THREE.DoubleSide });
const ARROW_CONE_GEO = new THREE.ConeGeometry(0.02, 0.058, 6);

function fieldVec2D(px, pz, list) {
  let ex = 0, ez = 0;
  for (const c of list) {
    const dx = px - c.pos.x, dz = pz - c.pos.z;
    const r2 = dx * dx + dz * dz;
    if (r2 < 1e-4) return null;
    const e = c.q / (r2 * Math.sqrt(r2));
    ex += e * dx; ez += e * dz;
  }
  return [ex, ez];
}

function integrateLine(seed, sgn, list) {
  const pts = [seed.clone()];
  const p = seed.clone();
  const ds = 0.045;
  for (let s = 0; s < 300; s++) {
    let v = fieldVec2D(p.x, p.z, list);
    if (!v) break;
    let len = Math.hypot(v[0], v[1]);
    if (len < 1e-3) break;
    const k1x = (sgn * v[0]) / len, k1z = (sgn * v[1]) / len;
    v = fieldVec2D(p.x + k1x * ds * 0.5, p.z + k1z * ds * 0.5, list);
    if (!v) break;
    len = Math.hypot(v[0], v[1]);
    if (len < 1e-3) break;
    p.x += (sgn * v[0]) / len * ds;
    p.z += (sgn * v[1]) / len * ds;
    pts.push(p.clone());
    if (Math.abs(p.x) > 4.3 || Math.abs(p.z) > 4.3) break;
    let ended = false;
    for (const c of list) {
      const dx = p.x - c.pos.x, dz = p.z - c.pos.z;
      const r = Math.hypot(dx, dz);
      if (r < 0.15) {
        if (c.q * sgn < 0) { // 终止于异号电荷：吸附到表面
          p.x = c.pos.x + dx * (0.15 / r);
          p.z = c.pos.z + dz * (0.15 / r);
          pts.push(p.clone());
        }
        ended = true;
        break;
      }
    }
    if (ended) break;
  }
  return pts;
}

const _im4 = new THREE.Matrix4();
const _iq = new THREE.Quaternion();
const _idv = new THREE.Vector3();

/** 合成电场的等势线（marching squares）：φ = Σ kq/r，逐格判断电平穿越并线性插值 */
function equipotentialSegs(charges) {
  const NX = 104, NZ = 68, X0 = -3.2, X1 = 3.2, Z0 = -2.2, Z1 = 2.2;
  const dx = (X1 - X0) / (NX - 1), dz = (Z1 - Z0) / (NZ - 1);
  const phi = new Float32Array(NX * NZ);
  for (let j = 0; j < NZ; j++) {
    for (let i = 0; i < NX; i++) {
      const x = X0 + i * dx, z = Z0 + j * dz;
      let p = 0;
      for (const c of charges) {
        const r2 = (x - c.pos.x) * (x - c.pos.x) + (z - c.pos.z) * (z - c.pos.z);
        p += r2 < 0.02 ? NaN : c.q / Math.sqrt(r2);
      }
      phi[j * NX + i] = p;
    }
  }
  const levels = [-3.5, -2.2, -1.2, -0.6, 0.6, 1.2, 2.2, 3.5];
  const segs = [];
  const E = [[0, 1], [1, 2], [2, 3], [3, 0]];
  for (let j = 0; j < NZ - 1; j++) {
    for (let i = 0; i < NX - 1; i++) {
      const v = [phi[j * NX + i], phi[j * NX + i + 1], phi[(j + 1) * NX + i + 1], phi[(j + 1) * NX + i]];
      if (v.some((t) => Number.isNaN(t))) continue;
      const x0 = X0 + i * dx, z0 = Z0 + j * dz;
      const pts = [[x0, z0], [x0 + dx, z0], [x0 + dx, z0 + dz], [x0, z0 + dz]];
      for (const L of levels) {
        const idx = v.reduce((acc, t, k) => acc | (t > L ? 1 << k : 0), 0);
        if (idx === 0 || idx === 15) continue;
        const crossings = [];
        E.forEach(([k1, k2]) => {
          if ((v[k1] > L) !== (v[k2] > L)) {
            const t = (L - v[k1]) / (v[k2] - v[k1]);
            crossings.push([pts[k1][0] + (pts[k2][0] - pts[k1][0]) * t, pts[k1][1] + (pts[k2][1] - pts[k1][1]) * t]);
          }
        });
        if (crossings.length === 2) {
          segs.push(crossings[0][0], 0, crossings[0][1], crossings[1][0], 0, crossings[1][1]);
        } else if (crossings.length === 4) {
          segs.push(crossings[0][0], 0, crossings[0][1], crossings[1][0], 0, crossings[1][1]);
          segs.push(crossings[2][0], 0, crossings[2][1], crossings[3][0], 0, crossings[3][1]);
        }
      }
    }
  }
  return segs;
}

function createChargeField(parent, colors, hidden = false) {
  const grp = new THREE.Group();
  grp.position.y = PLANE_Y;
  parent.add(grp);
  const lineGroup = new THREE.Group();
  const equipGroup = new THREE.Group();
  const chargeGroup = new THREE.Group();
  grp.add(lineGroup, equipGroup, chargeGroup);

  const lineMat = new THREE.LineBasicMaterial({ color: colors.line, transparent: true, opacity: 0.9 });
  const arrowMat = new THREE.MeshBasicMaterial({ color: colors.line });
  const arrowMesh = new THREE.InstancedMesh(ARROW_CONE_GEO, arrowMat, 480);
  arrowMesh.count = 0;
  arrowMesh.frustumCulled = false;
  grp.add(arrowMesh);

  const charges = [];
  const opts = { lines: 14, showLines: true, showEquip: false };

  function addCharge(q, x, z) {
    let mesh, ring = null;
    if (hidden) {
      mesh = new THREE.Object3D(); // 磁单极子等不可见锚点
      mesh.position.set(x, 0, z);
    } else {
      mesh = new THREE.Mesh(CHARGE_SPHERE_GEO, q > 0 ? posMat : negMat);
      mesh.position.set(x, 0, z);
      const band = new THREE.Mesh(CHARGE_BAND_GEO, M_SATIN);
      band.rotation.x = Math.PI / 2;   /* 赤道金属环：可拖点电荷的"极"味 */
      mesh.add(band);
      const lbl = makeTextSprite(q > 0 ? '+' : '−', { fontSize: 64, color: q > 0 ? '#ffd9d4' : '#cfe2ff', scale: 0.0034 });
      lbl.position.set(0, 0.17, 0);
      mesh.add(lbl);
      ring = new THREE.Mesh(SEL_RING_GEO, selMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = -0.13;
      ring.visible = false;
      mesh.add(ring);
    }
    chargeGroup.add(mesh);
    const c = { q, mesh, ring, lines: opts.lines, pos: mesh.position };
    charges.push(c);
    return c;
  }
  function clearCharges() {
    for (const c of charges) {
      c.mesh.traverse((o) => { if (o.isSprite) { o.material.map.dispose(); o.material.dispose(); } });
      chargeGroup.remove(c.mesh);
    }
    charges.length = 0;
  }
  function rebuild() {
    for (const ch of lineGroup.children) ch.geometry.dispose();
    lineGroup.clear();
    for (const ch of equipGroup.children) { ch.geometry.dispose(); ch.material.dispose(); }
    equipGroup.clear();
    const posArr = [];
    let arrowCount = 0;
    if (opts.showLines) {
      for (const c of charges) {
        const hasOpp = charges.some((o) => o.q * c.q < 0);
        if (c.q < 0 && hasOpp) continue; // 负电荷的场线由正电荷一侧积分到达
        const n = Math.round(c.lines);
        for (let i = 0; i < n; i++) {
          const a = (i / n) * TAU + 0.19;
          const seed = V3(c.mesh.position.x + Math.cos(a) * 0.19, 0, c.mesh.position.z + Math.sin(a) * 0.19);
          const pts = integrateLine(seed, c.q > 0 ? 1 : -1, charges);
          for (let k = 0; k < pts.length - 1; k++) {
            posArr.push(pts[k].x, 0, pts[k].z, pts[k + 1].x, 0, pts[k + 1].z);
          }
          for (let k = 7; k < pts.length - 3; k += 10) {
            if (arrowCount >= 480) break;
            const dx = pts[k + 1].x - pts[k - 1].x, dz = pts[k + 1].z - pts[k - 1].z;
            const dl = Math.hypot(dx, dz);
            if (dl < 1e-4) continue;
            let near = false;
            for (const o of charges) {
              if (Math.hypot(pts[k].x - o.mesh.position.x, pts[k].z - o.mesh.position.z) < 0.3) { near = true; break; }
            }
            if (near) continue;
            _idv.set(dx / dl, 0, dz / dl);
            _iq.setFromUnitVectors(UPV, _idv);
            _im4.makeRotationFromQuaternion(_iq);
            _im4.setPosition(pts[k].x, 0, pts[k].z);
            arrowMesh.setMatrixAt(arrowCount++, _im4);
          }
        }
      }
    }
    arrowMesh.count = arrowCount;
    arrowMesh.instanceMatrix.needsUpdate = true;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(posArr), 3));
    lineGroup.add(new THREE.LineSegments(geo, lineMat));
    if (opts.showEquip && charges.length) {
      // 合成电场的等势线（多电荷时按矢量叠加电势求等值线，处处与电场线垂直）
      const segs = equipotentialSegs(charges);
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(segs), 3));
      const eq = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: colors.equip, transparent: true, opacity: 0.55 }));
      equipGroup.add(eq);
    }
  }
  return {
    grp, charges, opts, addCharge, clearCharges, rebuild,
    markDirty() { this.dirty = true; },
    forceRebuild() { this.force = true; },
    dirty: false, force: true, last: -1,
    tick(time) {
      if (this.force || (this.dirty && time - this.last > 0.12)) {
        this.rebuild();
        this.dirty = this.force = false;
        this.last = time;
      }
    },
  };
}

/* ---------------- 电荷拖拽（Raycaster + 水平面求交，与 OrbitControls 互斥） ---------------- */

const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
const dragPlane = new THREE.Plane(V3(0, 1, 0), -PLANE_Y);
const dragHit = new THREE.Vector3();
let dragField = null;   // 当前允许拖拽的电荷场（第 1 章 / 自由实验）
let dragCharge = null;
let onSelectCharge = null; // 自由实验的选中回调

function setPointerNdc(e) {
  const rect = app.dom.getBoundingClientRect();
  ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
}

app.dom.addEventListener('pointerdown', (e) => {
  if (!labReady || !dragField) return;
  setPointerNdc(e);
  raycaster.setFromCamera(ndc, camera);
  const hits = raycaster.intersectObjects(dragField.charges.map((c) => c.mesh), false);
  if (!hits.length) return;
  const c = dragField.charges.find((q) => q.mesh === hits[0].object);
  dragCharge = c;
  controls.enabled = false;
  app.dom.setPointerCapture(e.pointerId);
  if (onSelectCharge) onSelectCharge(c);
});
app.dom.addEventListener('pointermove', (e) => {
  if (!dragCharge || !dragField) return;
  setPointerNdc(e);
  raycaster.setFromCamera(ndc, camera);
  if (raycaster.ray.intersectPlane(dragPlane, dragHit)) {
    dragCharge.mesh.position.x = clamp(dragHit.x, -2.9, 2.9);
    dragCharge.mesh.position.z = clamp(dragHit.z, -2.4, 2.4);
    dragField.dirty = true;
  }
});
function endDrag() {
  if (dragCharge && dragField) dragField.force = true;
  dragCharge = null;
  controls.enabled = true;
}
app.dom.addEventListener('pointerup', endDrag);
app.dom.addEventListener('pointerleave', endDrag);

/* ---------------- 第 1 章 · 电场线与等势面 ---------------- */

const g1 = new THREE.Group();
scene.add(g1);
const cf1 = createChargeField(g1, { line: 0xff8a3d, equip: 0x5a9bff });
const st1 = { cfg: 'pair-opp', lines: 14 };

function setCfg1(cfg) {
  st1.cfg = cfg;
  cf1.clearCharges();
  if (cfg === 'single') cf1.addCharge(1, 0, 0);
  else if (cfg === 'pair-opp') { cf1.addCharge(1, -1.15, 0); cf1.addCharge(-1, 1.15, 0); }
  else { cf1.addCharge(1, -1.15, 0); cf1.addCharge(1, 1.15, 0); }
  for (const c of cf1.charges) c.lines = st1.lines;
  cf1.force = true;
}

/* ---------------- 第 2 章 · 电场力做功与电势能 ---------------- */

const g2 = new THREE.Group();
scene.add(g2);
const st2 = { q: 2, E: 4, d: 0.8, path: 'along', anim: null };
let w2 = {};
function buildWork() {
  /* 极板：圆角挤出烤漆钢板（正/负双色）+ 顶缘接线柱 + 双瓷绝缘支脚落台 */
  const plateGeo = new THREE.ExtrudeGeometry(roundedRectShape(1.15, 1.5, 0.05), {
    depth: 0.07, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012,
    bevelSegments: 2, curveSegments: 10,
  });
  plateGeo.rotateY(Math.PI / 2);
  const plateMat = matCoat(0xb7413a, { roughness: 0.36, metalness: 0.35, clearcoat: 0.5 });
  const negPlateMat = matCoat(0x3661a8, { roughness: 0.36, metalness: 0.35, clearcoat: 0.5 });
  const standGeo = new THREE.CylinderGeometry(0.042, 0.05, 0.3, 12);
  const footGeo = new THREE.CylinderGeometry(0.09, 0.1, 0.024, 14);
  for (const [px, mat] of [[-1.3, plateMat], [1.3, negPlateMat]]) {
    const p = new THREE.Mesh(plateGeo, mat);
    p.position.set(px, 1.06, 0);
    const post = makePost(0.05);
    post.position.set(px, 1.83, 0);
    g2.add(p, post);
    for (const zs of [-0.42, 0.42]) {
      const st = new THREE.Mesh(standGeo, M_CERAMIC);
      st.position.set(px, 0.16, zs);
      const ft = new THREE.Mesh(footGeo, M_STEEL_DARK);
      ft.position.set(px, 0.012, zs);
      g2.add(st, ft);
    }
  }
  const lblL = makeTextSprite('＋', { fontSize: 70, color: '#ffd0cb', scale: 0.004 });
  lblL.position.set(-1.3, 1.95, 0);
  const lblR = makeTextSprite('－', { fontSize: 70, color: '#cfe0ff', scale: 0.004 });
  lblR.position.set(1.3, 1.95, 0);
  const arrows = [];
  for (const x of [-0.9, -0.45, 0, 0.45, 0.9]) {
    for (const z of [-0.4, 0, 0.4]) {
      const a = makeArrow(0xc7ccd4, 0.75);
      setArrow(a, V3(x, 1.06, z), V3(1, 0, 0), 0.4);
      g2.add(a); arrows.push(a);
    }
  }
  /* 试探电荷：导电小球 + 绝缘手柄（对比/demo 两用教具形制） */
  const probe = new THREE.Group();
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.09, 18, 14),
    matCoat(0xffd166, { roughness: 0.28, metalness: 0.3, clearcoat: 0.7, emissive: 0x5c430e }));
  const stem = cyl(0.012, 0.012, 0.2, M_CERAMIC);
  stem.position.y = 0.19;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.026, 0.007, 8, 16), M_BRASS);
  ring.position.y = 0.3;
  const probeLbl = makeTextSprite('试探电荷', { fontSize: 30, color: '#ffe2a8', scale: 0.0028 });
  probeLbl.position.set(0, 0.48, 0);
  probe.add(ball, stem, ring, probeLbl);
  probe.position.set(-1.05, 1.06, 0);
  g2.add(lblL, lblR, probe);
  w2 = { arrows, probe };
}
function probeStart() {
  if (st2.path === 'along') return { p: V3(-1.05, 1.06, 0), dir: V3(1, 0, 0) };
  if (st2.path === 'against') return { p: V3(1.05, 1.06, 0), dir: V3(-1, 0, 0) };
  if (st2.path === 'bent') {
    // 折线：先沿等势面平移（不做功），再顺场线走 d —— 与直线殊途同归
    return { p: V3(-1.05, 1.06, -0.7), via: V3(-1.05, 1.06, 0.7), dir: V3(1, 0, 0) };
  }
  return { p: V3(0, 1.06, -0.85), dir: V3(0, 0, 1) };
}
function resetProbe() {
  st2.anim = null;
  const s = probeStart();
  w2.probe.position.copy(s.p);
}

/* ---------------- 第 3 章 · 平行板电容器 ---------------- */

const g3 = new THREE.Group();
scene.add(g3);
const st3 = { U: 200, d: 10, S: 100, show: true, mode: 'U', eps: 1, Q: 2 };
const DIELECTRICS = [
  { name: '空气', eps: 1.0 },
  { name: '塑料', eps: 2.5 },
  { name: '玻璃', eps: 5.0 },
];
let w3 = {};
function buildCap() {
  /* 底座导轨：钢槽 + 双导轨条（瓷支脚随板距在轨上滑动） */
  const channel = box(2.5, 0.05, 1.0, M_STEEL_DARK);
  channel.position.y = 0.025;
  g3.add(channel);
  for (const zs of [-0.2, 0.2]) {
    const rail = box(2.4, 0.012, 0.05, matStd(0x14161a, { roughness: 0.5, metalness: 0.6 }));
    rail.position.set(0, 0.056, zs);
    g3.add(rail);
  }
  /* 极板总成（左右各一）：圆角钢板 + 顶部接线柱 + 瓷支脚（组内随板平移） */
  const plateGeo = new THREE.ExtrudeGeometry(roundedRectShape(0.8, 0.8, 0.04), {
    depth: 0.05, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01,
    bevelSegments: 2, curveSegments: 10,
  });
  plateGeo.rotateY(Math.PI / 2);
  const plateMat = matCoat(0xd6dade, { roughness: 0.3, metalness: 0.85, clearcoat: 0.4 });
  const colGeo = new THREE.CylinderGeometry(0.036, 0.042, 0.6, 12);
  const footGeo = new THREE.CylinderGeometry(0.075, 0.085, 0.02, 14);
  const mkPlateAsm = () => {
    const asm = new THREE.Group();
    const slab = new THREE.Mesh(plateGeo, plateMat);
    const post = makePost(0.05);
    post.position.y = 0.44;
    const column = new THREE.Mesh(colGeo, M_CERAMIC);
    column.position.y = -0.72;
    const foot = new THREE.Mesh(footGeo, M_STEEL_DARK);
    foot.position.y = -1.03;
    asm.add(slab, post, column, foot);
    asm.userData.slab = slab;
    return asm;
  };
  const pL = mkPlateAsm();
  const pR = mkPlateAsm();
  const lblL = makeTextSprite('＋', { fontSize: 64, color: '#ffd0cb', scale: 0.0036 });
  const lblR = makeTextSprite('－', { fontSize: 64, color: '#cfe0ff', scale: 0.0036 });
  const arrows = [];
  for (const x of [-0.35, 0, 0.35]) {
    for (const z of [-0.25, 0.08, 0.33]) {
      const a = makeArrow(0xd8543e, 0.85);
      g3.add(a); arrows.push(a);
    }
  }
  /* 介质板：插入/抽出动画（塑料=乳白半透 / 玻璃=青玻），与 εr 联动 */
  const glassSlabMat = matCoat(0xbcd8d2, { roughness: 0.06, opacity: 0.34 });
  const slab = box(1, 0.72, 0.66, M_PLASTIC_SLAB);
  slab.position.y = 2.4;   /* 待插入位（上方），applyCap 设定目标高度 */
  g3.add(pL, pR, lblL, lblR, slab);
  bakeContactShadow(0, 0, 3.0, 1.5, 0.26);
  w3 = { pL, pR, lblL, lblR, arrows, slab, glassMat: glassSlabMat, slabTargetY: 2.4 };
}
function capC() { return (0.885 * st3.eps * st3.S) / st3.d; }          // pF
function capU() { return st3.mode === 'U' ? st3.U : (st3.Q * 1e-9) / (capC() * 1e-12); } // V
function capE() { return capU() / st3.d; }                             // V/mm
function applyCap() {
  const gap = 0.25 + (st3.d - 2) * (0.95 / 18); // 板距视觉映射 2~20mm
  const s = Math.sqrt(st3.S / 100);
  for (const [asm, sx] of [[w3.pL, -1], [w3.pR, 1]]) {
    asm.position.set(sx * gap / 2, 1.06, 0);
    asm.userData.slab.scale.set(1, s, s);
    asm.children[1].position.y = 0.44 * s + 0.03;   /* 接线柱随板缘 */
  }
  w3.lblL.position.set(-gap / 2 - 0.06, 1.06 + 0.42 * s, 0);
  w3.lblR.position.set(gap / 2 + 0.06, 1.06 + 0.42 * s, 0);
  /* 介质板：厚度贴合板距（单位厚度 × x 缩放），材质按介质切换；空气=抽出待命 */
  const slab = w3.slab;
  slab.scale.set(Math.max(gap - 0.045, 0.03), s, s);
  slab.material = st3.eps >= 5 ? w3.glassMat : M_PLASTIC_SLAB;
  w3.slabTargetY = st3.eps > 1 ? 1.06 : 2.4;
  const Evm = capE(); // V/mm
  const len = Evm <= 0 ? 0 : 0.18 + clamp(Evm / 60, 0, 1) * 0.5;
  let i = 0;
  for (const x of [-0.35, 0, 0.35]) {
    for (const z of [-0.25, 0.08, 0.33]) {
      const a = w3.arrows[i++];
      a.visible = st3.show && len > 0.02;
      a.scale.setScalar(Math.max(len, 0.001) * s);
      setArrow(a, V3(x * s, 1.06, z * s), V3(1, 0, 0), Math.max(len, 0.001));
    }
  }
}

/* ---------------- 第 4 章 · 示波管 ---------------- */

const g4 = new THREE.Group();
scene.add(g4);
const st4 = { Uy: 60, freq: 1.5, gain: 1.4, sweep: true, U1: 1.5 };
let w4 = {};
function buildScope() {
  /* ---- 玻壳总成：LatheGeometry 旋转轮廓（灯尾 → 管颈 → 漏斗锥 → 屏面） ---- */
  const glassEnv = matCoat(0xaec6d4, { roughness: 0.05, opacity: 0.17, side: THREE.DoubleSide, depthWrite: false });
  glassEnv.envMapIntensity = 1.35;
  const prof = [
    [0.0, 0.02], [0.1, 0.05], [0.155, 0.14], [0.16, 0.5], [0.16, 1.28],
    [0.19, 1.4], [0.3, 1.92], [0.352, 2.66], [0.362, 3.18], [0.358, 3.6], [0.34, 3.88], [0.315, 3.98],
  ].map(([r, t]) => new THREE.Vector2(r, t));
  const envGeo = new THREE.LatheGeometry(prof, 40);
  envGeo.rotateX(Math.PI / 2);          /* 旋转轴 +Y → +Z（屏朝 +Z） */
  const envelope = new THREE.Mesh(envGeo, glassEnv);
  envelope.position.set(0, 1.06, -2.4); /* t=0 对齐管颈尾端 */
  g4.add(envelope);

  /* ---- 电子枪总成：阴极（灯丝辉点）+ 调制极杯 + 两级阳极膜片 + 云母隔片 ---- */
  const gunG = new THREE.Group();
  gunG.position.set(0, 1.06, -2.0);
  const cathode = cyl(0.05, 0.055, 0.16, M_STEEL_DARK);
  const heatSpot = new THREE.Mesh(new THREE.SphereGeometry(0.02, 10, 8),
    matGlow(0xffc46a, 0.85, { color: 0xffe2b0 }));
  heatSpot.position.z = -0.1;
  const wehnelt = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.075, 0.055, 18, 1, true), M_SATIN);
  wehnelt.rotation.x = Math.PI / 2;
  wehnelt.position.z = -0.045;
  const anodeGeo = new THREE.CylinderGeometry(0.105, 0.105, 0.016, 20);
  const a1 = new THREE.Mesh(anodeGeo, M_SATIN); a1.rotation.x = Math.PI / 2; a1.position.z = 0.14;
  const a2 = new THREE.Mesh(anodeGeo, M_SATIN); a2.rotation.x = Math.PI / 2; a2.position.z = 0.38;
  for (const az of [a1, a2]) {
    const hole = new THREE.Mesh(new THREE.CircleGeometry(0.024, 14), new THREE.MeshBasicMaterial({ color: 0x0a0d10 }));
    hole.position.set(0, 0, az.position.z + 0.012);
    gunG.add(hole);
  }
  const mica = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.012, 18),
    matStd(0xd8d2c4, { roughness: 0.7, transparent: true, opacity: 0.5 }));
  mica.rotation.x = Math.PI / 2; mica.position.z = 0.26;
  const rail = cyl(0.012, 0.012, 0.6, M_STEEL_DARK);
  rail.rotation.x = Math.PI / 2; rail.position.set(0, -0.14, 0.16);
  gunG.add(cathode, heatSpot, wehnelt, a1, a2, mica, rail);
  const gunLbl = makeTextSprite('电子枪', { fontSize: 30, color: '#c9d4de', scale: 0.0028 });
  gunLbl.position.set(0.3, 1.44, -2.0);
  g4.add(gunG, gunLbl);

  /* ---- 偏转板：YY′/XX′ 板对 + 边缘引脚 + 出线软管（TubeGeometry 走线） ---- */
  const yyTop = box(0.5, 0.02, 0.3, matCoat(0xb7413a, { roughness: 0.38, metalness: 0.4, clearcoat: 0.4 }));
  yyTop.position.set(0, 1.3, -0.95);
  const yyBot = box(0.5, 0.02, 0.3, matCoat(0x3661a8, { roughness: 0.38, metalness: 0.4, clearcoat: 0.4 }));
  yyBot.position.set(0, 0.82, -0.95);
  const xxL = box(0.02, 0.24, 0.3, matCoat(0xb7413a, { roughness: 0.38, metalness: 0.4, clearcoat: 0.4 }));
  xxL.position.set(-0.22, 1.06, -0.4);
  const xxR = xxL.clone(); xxR.position.x = 0.22;
  const yyLbl = makeTextSprite('YY′ 竖直偏转板', { fontSize: 30, color: '#e8c9b8', scale: 0.0028 });
  yyLbl.position.set(0.55, 1.5, -0.95);
  const xxLbl = makeTextSprite('XX′ 扫描板', { fontSize: 30, color: '#e8c9b8', scale: 0.0028 });
  xxLbl.position.set(0.5, 0.72, -0.4);
  g4.add(yyTop, yyBot, yyLbl, xxL, xxR, xxLbl);
  const wireMat = matStd(0x2c3138, { roughness: 0.6 });
  const leadDefs = [
    [[0.24, 1.3, -0.85], [0.42, 1.05, -1.2], [0.5, 0.72, -1.62], [0.44, 0.5, -2.2]],
    [[-0.24, 0.84, -0.85], [-0.4, 0.75, -1.3], [-0.42, 0.55, -1.7], [-0.34, 0.46, -2.16]],
    [[-0.2, 1.06, -0.3], [-0.3, 0.86, -0.66], [-0.36, 0.6, -1.3], [-0.3, 0.48, -2.1]],
    [[0.2, 1.06, -0.3], [0.32, 0.9, -0.72], [0.4, 0.62, -1.4], [0.38, 0.48, -2.14]],
  ];
  for (const pts of leadDefs) {
    const c = new THREE.CatmullRomCurve3(pts.map((p) => V3(...p)));
    g4.add(new THREE.Mesh(new THREE.TubeGeometry(c, 24, 0.008, 6), wireMat));
  }

  /* ---- 荧光屏：磷光底衬 + 显示画布 + 面环压圈 ---- */
  const scrCv = document.createElement('canvas');
  scrCv.width = 256; scrCv.height = 256;
  const scrTex = new THREE.CanvasTexture(scrCv);
  scrTex.colorSpace = THREE.SRGBColorSpace;
  const phosphor = new THREE.Mesh(new THREE.CircleGeometry(0.312, 40),
    matGlow(0x0e2f1c, 0.35, { color: 0x123522 }));
  phosphor.position.set(0, 1.06, 1.418);   /* 磷光底衬在描迹画布之后（画布在前发亮） */
  const screen = new THREE.Mesh(new THREE.CircleGeometry(0.31, 40), new THREE.MeshBasicMaterial({ map: scrTex }));
  screen.position.set(0, 1.06, 1.43);
  const bezel = new THREE.Mesh(new THREE.TorusGeometry(0.325, 0.028, 10, 44), matStd(0x3a4048, { roughness: 0.42, metalness: 0.5 }));
  bezel.position.set(0, 1.06, 1.47);
  const scrLbl = makeTextSprite('荧光屏', { fontSize: 30, color: '#a8ffd0', scale: 0.0028 });
  scrLbl.position.set(0, 1.56, 1.42);
  g4.add(phosphor, screen, bezel, scrLbl);

  /* ---- 管座 + 引脚 + 支鞍座（前后两座，弧口托住玻壳） ---- */
  const socket = cyl(0.13, 0.145, 0.1, F_BAKELITE);
  socket.rotation.x = Math.PI / 2;
  socket.position.set(0, 1.06, -2.42);
  g4.add(socket);
  const pinGeo = new THREE.CylinderGeometry(0.011, 0.011, 0.07, 8);
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * TAU + 0.3;
    const pin = new THREE.Mesh(pinGeo, M_BRASS);
    pin.rotation.x = Math.PI / 2;
    pin.position.set(Math.cos(a) * 0.085, 1.06 + Math.sin(a) * 0.085, -2.49);
    g4.add(pin);
  }
  const saddleDef = [
    [-1.7, 0.175, 0.28], [0.72, 0.375, 0.42],
  ];
  for (const [sz, sr, footW] of saddleDef) {
    const arc = 3.4;
    const saddle = new THREE.Mesh(new THREE.TorusGeometry(sr, 0.022, 8, 24, arc), M_STEEL_DARK);
    saddle.rotation.z = -Math.PI / 2 - arc / 2;   /* 弧口朝上托住玻壳 */
    saddle.position.set(0, 1.06, sz);
    const colH = 1.06 - sr - 0.03;
    const column = box(0.055, colH, 0.055, M_STEEL_DARK);
    column.position.set(0, colH / 2, sz);
    const foot = box(footW, 0.03, 0.3, M_STEEL_DARK);
    foot.position.set(0, 0.015, sz);
    g4.add(saddle, column, foot);
  }
  bakeContactShadow(0, -0.4, 3.6, 1.4, 0.24);

  const MAXDOT = 8;
  const beamMesh = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.02, 8, 6),
    new THREE.MeshBasicMaterial({ color: 0x9dffc0, transparent: true, opacity: 0.9 }),
    MAXDOT
  );
  beamMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  beamMesh.frustumCulled = false;
  g4.add(beamMesh);
  const dots = Array.from({ length: MAXDOT }, (_, i) => ({ p: i / MAXDOT }));
  w4 = { scrCv, scrCtx: scrCv.getContext('2d'), scrTex, beamMesh, dots };
  w4.scrCtx.fillStyle = '#04140a';
  w4.scrCtx.fillRect(0, 0, 256, 256);
}
function sig4(t) {
  // 偏转量 ∝ U₂/U₁（y = U₂L²/(4dU₁)，加速电压 U₁ 越高电子越"不易弯"）
  return ((st4.Uy / 100) * st4.gain * Math.sin(TAU * st4.freq * t) * 1.5) / st4.U1;
}

/* ---------------- 第 5 章 · 磁感线（条形磁铁偶极子场） ---------------- */

const g5 = new THREE.Group();
scene.add(g5);
const cf5 = createChargeField(g5, { line: 0x35b5c9 }, true);
const st5 = { cfg: 'single', flip: false, filings: true, wireDir: 1 };
let w5 = {};
function buildMagnet() {
  const magA = makeBarMagnet(1.1);
  const magB = makeBarMagnet(1.1);
  // 通电直导线（沿 y 轴，双支架装夹）+ 同心圆磁感线
  const wire = cyl(0.018, 0.018, 1.3, M_COPPER);
  wire.position.set(0, PLANE_Y, 0);
  const wireLbl = makeTextSprite('通电直导线', { fontSize: 28, color: '#e0c9b8', scale: 0.0026 });
  wireLbl.position.set(0, PLANE_Y + 0.8, 0);
  wire.add(wireLbl);
  /* 鼓架式装夹：底座 + 立杆 + 横臂 + 导线夹环（导线绷直的物理交代，随直导线模式显隐） */
  const wireStands = new THREE.Group();
  for (const sx of [-1, 1]) {
    const stand = new THREE.Group();
    stand.position.set(sx * 0.62, 0, 0);
    const foot = cyl(0.11, 0.13, 0.03, M_STEEL_DARK);
    foot.position.y = 0.015;
    const rod = cyl(0.016, 0.016, 1.62, M_SATIN);
    rod.position.y = 0.83;
    const arm = box(0.62, 0.028, 0.028, M_SATIN);
    arm.position.set(-sx * 0.31, 1.58, 0);
    const collar = new THREE.Mesh(new THREE.TorusGeometry(0.032, 0.01, 8, 16), M_BRASS);
    collar.position.set(0, 1.58, 0);
    stand.add(foot, rod, arm, collar);
    wireStands.add(stand);
  }
  const circlesG = new THREE.Group();
  const cMat = new THREE.LineBasicMaterial({ color: 0x35b5c9, transparent: true, opacity: 0.75 });
  const wireArrows = [];
  const tangGeo = new THREE.ConeGeometry(0.03, 0.09, 8);
  const tangMat = new THREE.MeshBasicMaterial({ color: 0x35b5c9 });
  for (const R of [0.35, 0.7, 1.1, 1.6, 2.1]) {
    const pts = [];
    for (let k = 0; k <= 60; k++) {
      const aa = (k / 60) * TAU;
      pts.push(V3(Math.cos(aa) * R, PLANE_Y, Math.sin(aa) * R));
    }
    circlesG.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), cMat));
    for (let k = 0; k < 4; k++) {
      const cone = new THREE.Mesh(tangGeo, tangMat);
      circlesG.add(cone);
      wireArrows.push({ cone, R, a: (k / 4) * TAU + 0.35 });
    }
  }
  const wireG = new THREE.Group();
  wireG.add(wire, circlesG, wireStands);
  wireG.visible = false;
  g5.add(magA, magB, wireG);
  w5 = { magA, magB, filingsCv: null, wireG, wireArrows };
}
function magnetPoles() {
  // 返回单极子列表（教学近似）：N=+1、S=−1；flip 通过整体旋转磁铁实现场线反向
  const poles = [];
  const pushMag = (cx, flipRot, on) => {
    if (!on) return;
    const dir = flipRot ? -1 : 1; // N 极在 +x（dir=1）或 −x（dir=-1）
    poles.push({ q: 1, pos: { x: cx + dir * 0.475, z: 0 } });
    poles.push({ q: -1, pos: { x: cx - dir * 0.475, z: 0 } });
  };
  if (st5.cfg === 'single') pushMag(0, st5.flip, true);
  else { pushMag(-1.2, st5.flip, true); pushMag(1.2, !st5.flip, true); }
  return poles;
}
function fieldAt5(x, z) {
  if (st5.cfg === 'wire') {
    // 通电直导线：B = μ₀I/(2πr)，方向按安培定则（I 沿 +y 时 B = I·ŷ×r̂）
    const r2 = x * x + z * z;
    if (r2 < 0.02) return null;
    const s = st5.wireDir;
    return [(s * z) / r2, (-s * x) / r2];
  }
  return fieldVec2D(x, z, magnetPoles());
}
function orientWireArrows() {
  const s = st5.wireDir;
  for (const { cone, R, a } of w5.wireArrows) {
    const x = Math.cos(a) * R, z = Math.sin(a) * R;
    _idv.set(z * s, 0, -x * s).normalize();
    cone.position.set(x, PLANE_Y, z);
    cone.quaternion.setFromUnitVectors(UPV, _idv);
  }
}
function applyMagnet() {
  const wire = st5.cfg === 'wire';
  w5.wireG.visible = wire;
  w5.magA.visible = !wire;
  w5.magB.visible = !wire && st5.cfg !== 'single';
  if (wire) {
    cf5.clearCharges();
    cf5.opts.showLines = false;
    cf5.force = true;
    orientWireArrows();
  } else {
    w5.magA.position.set(st5.cfg === 'single' ? 0 : -1.2, PLANE_Y, 0);
    w5.magB.position.set(1.2, PLANE_Y, 0);
    w5.magA.rotation.y = st5.flip ? Math.PI : 0;
    w5.magB.rotation.y = st5.cfg !== 'single' && !st5.flip ? Math.PI : 0;
    cf5.clearCharges();
    for (const p of magnetPoles()) {
      const c = cf5.addCharge(p.q, p.pos.x, p.pos.z);
      c.lines = 12;
    }
    cf5.opts.showLines = true;
    cf5.force = true;
  }
  if (st5.filings) drawFilings();
}
function drawFilings() {
  if (!w5.filingsCv) w5.filingsCv = makeCorner('铁屑模拟（俯视）');
  const { ctx } = w5.filingsCv;
  const W = ctx.canvas.width, H = ctx.canvas.height;
  ctx.fillStyle = '#161a1f';
  ctx.fillRect(0, 0, W, H);
  const poles = st5.cfg === 'wire' ? [] : magnetPoles();
  const NX = 36, NZ = 19;
  ctx.strokeStyle = '#9aa3ac';
  ctx.lineWidth = 2;
  for (let i = 0; i < NX; i++) {
    for (let j = 0; j < NZ; j++) {
      const x = -2.3 + (i / (NX - 1)) * 4.6;
      const z = -1.12 + (j / (NZ - 1)) * 2.24;
      let close = false;
      for (const p of poles) if (Math.hypot(x - p.pos.x, z - p.pos.z) < 0.28) close = true;
      if (close) continue;
      const v = fieldAt5(x, z);
      if (!v) continue;
      const mag = Math.hypot(v[0], v[1]);
      const len = clamp(Math.log10(1 + mag * 40) * 9, 4, 17);
      const ux = v[0] / mag, uz = v[1] / mag;
      const px = (i / (NX - 1)) * (W - 20) + 10;
      const pz = (j / (NZ - 1)) * (H - 20) + 10;
      ctx.beginPath();
      ctx.moveTo(px - ux * len, pz - uz * len);
      ctx.lineTo(px + ux * len, pz + uz * len);
      ctx.stroke();
    }
  }
}

/* ---------------- 第 6 章 · 安培力 ---------------- */

const g6 = new THREE.Group();
scene.add(g6);
const st6 = { I: 1.5, B: 0.8, L: 0.8, dir: 1, z: 0, v: 0 };
let w6 = {};
function buildAmpere() {
  /* ---- 导轨桥：双轨 + 四腿落台 + 黄铜导体棒（含端帽，电流箭头组随动） ---- */
  const railA = box(0.06, 0.04, 2.8, M_SATIN); railA.position.set(-0.34, 0.94, 0);
  const railB = railA.clone(); railB.position.x = 0.34;
  g6.add(railA, railB);
  const legGeo6 = new THREE.BoxGeometry(0.09, 0.92, 0.09);
  const footGeo6 = new THREE.CylinderGeometry(0.075, 0.09, 0.024, 12);
  for (const lx of [-0.34, 0.34]) {
    for (const lz of [-1.3, 1.3]) {
      const leg = new THREE.Mesh(legGeo6, M_STEEL_DARK);
      leg.position.set(lx, 0.46, lz);
      const foot = new THREE.Mesh(footGeo6, M_STEEL_DARK);
      foot.position.set(lx, 0.012, lz);
      g6.add(leg, foot);
    }
  }
  const rod = box(0.94, 0.07, 0.07, M_BRASS);
  const rodG = new THREE.Group();
  rodG.add(rod);
  const endCapGeo = new THREE.CylinderGeometry(0.052, 0.052, 0.03, 14);
  for (const sx of [-1, 1]) {
    const cap = new THREE.Mesh(endCapGeo, M_KNURL_BRASS);
    cap.rotation.z = Math.PI / 2;
    cap.position.x = sx * 0.485;
    rodG.add(cap);
  }
  const curArrows = new THREE.Group();
  const coneGeo = new THREE.ConeGeometry(0.032, 0.1, 8);
  const curMat = new THREE.MeshBasicMaterial({ color: 0x35d07a });
  for (const x of [-0.25, 0, 0.25]) {
    const c = new THREE.Mesh(coneGeo, curMat);
    c.rotation.z = -Math.PI / 2;
    c.position.set(x, 0, 0);
    curArrows.add(c);
  }
  rodG.add(curArrows);
  rodG.position.set(0, 1.0, 0);
  g6.add(rodG);

  /* ---- 蹄形磁铁：CatmullRom 变截面放样 C 形轭铁（红烤漆）+ 上下钢质极靴 ----
   * 磁场区（导轨/导体棒所在间隙）的几何与旧版一致：极面 y≈0.64 / 1.48，z 跨 ±0.8 */
  const shoeMat = matCoat(0x9ba3ac, { roughness: 0.3, metalness: 0.9, clearcoat: 0.3 });
  const shoeGeo = roundedSlab(1.5, 1.4, 0.05, 0.05, shoeMat, 0.012);
  const shoeTop = shoeGeo.clone(); shoeTop.position.set(0, 1.4775, 0);
  const shoeBot = shoeGeo.clone(); shoeBot.position.set(0, 0.5975, 0);
  const yokeCurve = new THREE.CatmullRomCurve3([
    V3(0, 0.62, -0.55), V3(0, 0.60, -0.85), V3(0, 0.75, -1.12), V3(0, 1.05, -1.22),
    V3(0, 1.38, -1.12), V3(0, 1.52, -0.85), V3(0, 1.50, -0.55),
  ], false, 'catmullrom', 0.6);
  const yokeWKeys = [[0, 2.0], [0.22, 2.06], [0.5, 2.1], [0.78, 2.06], [1, 2.0]];
  const yokeDKeys = [[0, 0.3], [0.22, 0.33], [0.5, 0.36], [0.78, 0.33], [1, 0.3]];
  const yoke = new THREE.Mesh(sweepRoundedSection(yokeCurve, 56, yokeWKeys, yokeDKeys), F_PAINT_RED);
  g6.add(shoeTop, shoeBot, yoke);
  /* 轭铁入靴处的镀铬压板（机械衔接交代，随宽轭同宽） */
  for (const fy of [0.63, 1.49]) {
    const clampPlate = box(2.12, 0.36, 0.05, M_CHROME);
    clampPlate.position.set(0, fy, -0.52);
    g6.add(clampPlate);
  }
  const nLbl = makeTextSprite('N', { fontSize: 60, color: '#ffd9d4', scale: 0.0026 });
  nLbl.position.set(0, 1.68, 0);
  const sLbl = makeTextSprite('S', { fontSize: 60, color: '#cfe2ff', scale: 0.0026 });
  sLbl.position.set(0, 0.44, 0);
  /* 磁铁支脚：轭靴整体落在四只钢支脚上 */
  const postGeo6 = new THREE.BoxGeometry(0.1, 0.58, 0.1);
  for (const px of [-0.68, 0.68]) {
    for (const pz of [-0.6, 0.6]) {
      const post = new THREE.Mesh(postGeo6, M_STEEL_DARK);
      post.position.set(px, 0.29, pz);
      const foot = new THREE.Mesh(footGeo6, M_STEEL_DARK);
      foot.position.set(px, 0.012, pz);
      g6.add(post, foot);
    }
  }
  const arrows = [];
  for (const x of [-0.5, 0, 0.5]) {
    for (const z of [-0.55, 0, 0.55]) {
      const a = makeArrow(0x7fb2ff, 0.6);
      g6.add(a); arrows.push(a);
    }
  }
  /* ---- 电源盒（胶木壳 + 铭牌 + 双接线柱）+ 引线到轨尾 ---- */
  const batt = box(0.4, 0.2, 0.28, F_BAKELITE);
  batt.position.set(1.1, 0.1, -1.62);
  const battLblMat = matStd(0xffffff, { roughness: 0.85 });
  battLblMat.map = makeLabelTexture(['低压电源', 'DC 0-12V'], { w: 200, h: 110, lineSizes: [34, 22] });
  const battLblPlate = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.16), battLblMat);
  battLblPlate.position.set(1.1, 0.1, -1.477);
  const battP1 = makePost(0.06); battP1.position.set(0.97, 0.2, -1.56);
  const battP2 = makePost(0.06); battP2.position.set(1.23, 0.2, -1.56);
  const wireMat6 = matStd(0x2c3138, { roughness: 0.6 });
  const wCurve1 = new THREE.CatmullRomCurve3([V3(0.97, 0.26, -1.56), V3(0.7, 0.2, -1.5), V3(0.42, 0.3, -1.36), V3(0.34, 0.9, -1.32)]);
  const wCurve2 = new THREE.CatmullRomCurve3([V3(1.23, 0.26, -1.56), V3(1.05, 0.24, -1.52), V3(-0.1, 0.16, -1.42), V3(-0.34, 0.9, -1.32)]);
  g6.add(batt, battLblPlate, battP1, battP2,
    new THREE.Mesh(new THREE.TubeGeometry(wCurve1, 20, 0.01, 6), wireMat6),
    new THREE.Mesh(new THREE.TubeGeometry(wCurve2, 20, 0.01, 6), wireMat6));
  const battLbl = makeTextSprite('电源', { fontSize: 30, color: '#c9d4de', scale: 0.0026 });
  battLbl.position.set(1.1, 0.42, -1.62);
  g6.add(nLbl, sLbl, battLbl);
  bakeContactShadow(0, 0, 3.4, 3.4, 0.3);
  w6 = { rodG, curArrows, arrows };
}
function applyAmpereArrows() {
  let i = 0;
  for (const x of [-0.5, 0, 0.5]) {
    for (const z of [-0.55, 0, 0.55]) {
      setArrow(w6.arrows[i++], V3(x, 0.85, z), V3(0, -1, 0), 0.18 + st6.B * 0.2);
    }
  }
  w6.curArrows.rotation.y = st6.dir > 0 ? 0 : Math.PI;
  w6.rodG.scale.x = st6.L;
}

/* ---------------- 第 7 章 · 洛伦兹力 ---------------- */

const g7 = new THREE.Group();
scene.add(g7);
const st7 = { v: 1.5, B: 0.8, m: 1, q: 1, alpha: 0, active: false, pos: new THREE.Vector3(), vel: new THREE.Vector3() };
let w7 = {};
const TRAIL7 = 240;
function buildLorentz() {
  /* ---- 磁场区玻璃室：轻透明玻璃罩 + 钢质棱柱/顶框 + 底托盘（原线框实体化） ---- */
  const chamberGlass = matCoat(0xcfe2ea, { roughness: 0.06, opacity: 0.15, side: THREE.DoubleSide, depthWrite: false });
  const chamber = new THREE.Mesh(new THREE.BoxGeometry(2.9, 1.05, 2.9), chamberGlass);
  chamber.position.y = 1.06;
  g7.add(chamber);
  const postGeo7 = new THREE.BoxGeometry(0.035, 1.05, 0.035);
  for (const px of [-1.45, 1.45]) {
    for (const pz of [-1.45, 1.45]) {
      const post = new THREE.Mesh(postGeo7, M_SATIN);
      post.position.set(px, 1.06, pz);
      g7.add(post);
    }
  }
  const barX = new THREE.BoxGeometry(2.9, 0.03, 0.03);
  const barZ = new THREE.BoxGeometry(0.03, 0.03, 2.9);
  for (const pz of [-1.45, 1.45]) {
    const bar = new THREE.Mesh(barX, M_SATIN);
    bar.position.set(0, 1.585, pz);
    g7.add(bar);
  }
  for (const px of [-1.45, 1.45]) {
    const bar = new THREE.Mesh(barZ, M_SATIN);
    bar.position.set(px, 1.585, 0);
    g7.add(bar);
  }
  const tray = roundedSlab(3.2, 3.2, 0.045, 0.05, M_STEEL_DARK, 0.012);
  tray.position.y = 0.492;
  g7.add(tray);
  const footGeo7 = new THREE.CylinderGeometry(0.06, 0.075, 0.47, 12);
  for (const px of [-1.4, 1.4]) {
    for (const pz of [-1.4, 1.4]) {
      const ft = new THREE.Mesh(footGeo7, M_STEEL_DARK);
      ft.position.set(px, 0.257, pz);
      g7.add(ft);
    }
  }
  bakeContactShadow(0, 0, 3.8, 3.8, 0.26);
  const arrows = [];
  for (const x of [-0.9, -0.3, 0.3, 0.9]) {
    for (const z of [-0.9, -0.3, 0.3, 0.9]) {
      const a = makeArrow(0x7fb2ff, 0.5);
      g7.add(a); arrows.push(a);
    }
  }
  const particle = new THREE.Mesh(
    new THREE.SphereGeometry(0.075, 16, 12),
    stdMat({ color: 0x35e0c8, emissive: 0x0c5e51, roughness: 0.3 })
  );
  particle.position.set(-0.9, PLANE_Y, 0);
  const trailPos = new Float32Array(TRAIL7 * 3);
  const trailGeo = new THREE.BufferGeometry();
  trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPos, 3));
  trailGeo.setDrawRange(0, 0);
  const trail = new THREE.Line(trailGeo, new THREE.LineBasicMaterial({ color: 0x35e0c8, transparent: true, opacity: 0.8 }));
  trail.frustumCulled = false;
  g7.add(particle, trail);
  w7 = { arrows, particle, trail, trailPos, trailGeo, trailLen: 0 };
}
function launch7() {
  st7.pos.set(-0.9, PLANE_Y, 0);
  const al = (st7.alpha * Math.PI) / 180;
  st7.vel.set(st7.v * Math.cos(al), st7.v * Math.sin(al), 0);
  st7.active = true;
  w7.trailLen = 0;
  w7.trailGeo.setDrawRange(0, 0);
  w7.particle.visible = true;
}
function pushTrail7() {
  if (w7.trailLen < TRAIL7) {
    w7.trailPos.set([st7.pos.x, st7.pos.y, st7.pos.z], w7.trailLen * 3);
    w7.trailLen++;
  } else {
    w7.trailPos.copyWithin(0, 3);
    w7.trailPos.set([st7.pos.x, st7.pos.y, st7.pos.z], (TRAIL7 - 1) * 3);
  }
  w7.trailGeo.attributes.position.needsUpdate = true;
  w7.trailGeo.setDrawRange(0, w7.trailLen);
}

/* ---------------- 第 8 章 · 质谱仪与回旋加速器 ---------------- */

const g8ms = new THREE.Group();
const g8cyc = new THREE.Group();
scene.add(g8ms, g8cyc);
const st8 = { mode: 'ms', U: 600, B: 0.5, msTime: 0 };
const ISOTOPES = [
  { name: 'C-12', mass: 12, color: 0xffd166 },
  { name: 'C-13', mass: 13, color: 0x8fd48a },
  { name: 'C-14', mass: 14, color: 0x7fb2ff },
];
let w8ms = {};
function buildMS() {
  /* ---- 离子源：枪体（散热鳍 + 喷口辉点）+ 落台支柱 ---- */
  const srcG = new THREE.Group();
  srcG.position.set(-2.35, 1.06, 0);
  const gunBody = cyl(0.13, 0.15, 0.42, matStd(0x5a6470, { roughness: 0.4, metalness: 0.75 }));
  gunBody.rotation.x = Math.PI / 2;
  const nozzle = cyl(0.05, 0.09, 0.1, M_SATIN);
  nozzle.rotation.x = Math.PI / 2;
  nozzle.position.z = 0.25;
  const beamDot = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), matGlow(0xffc46a, 1.4, { color: 0xffe2b0 }));
  beamDot.position.z = 0.27;
  for (let k = 0; k < 4; k++) {
    const fin = box(0.3, 0.014, 0.1, M_STEEL_DARK);
    fin.position.set(0, 0.16 - k * 0.005, -0.08 - k * 0.05);
    srcG.add(fin);
  }
  const srcPost = cyl(0.05, 0.07, 0.85, M_STEEL_DARK);
  srcPost.position.y = -0.62;
  const srcFoot = cyl(0.14, 0.17, 0.03, M_STEEL_DARK);
  srcFoot.position.y = -1.045;
  srcG.add(gunBody, nozzle, beamDot, srcPost, srcFoot);
  const srcLbl = makeTextSprite('离子源', { fontSize: 30, color: '#c9d4de', scale: 0.0028 });
  srcLbl.position.set(-2.35, 1.5, 0);
  g8ms.add(srcG, srcLbl);

  /* ---- 速度选择器：板对 + 侧框杆 + 支架 ---- */
  const plateMat = matCoat(0xb7413a, { roughness: 0.38, metalness: 0.4, clearcoat: 0.4 });
  const plateMat2 = matCoat(0x3661a8, { roughness: 0.38, metalness: 0.4, clearcoat: 0.4 });
  const selTop = box(0.7, 0.03, 0.45, plateMat); selTop.position.set(-1.35, 1.28, 0);
  const selBot = box(0.7, 0.03, 0.45, plateMat2); selBot.position.set(-1.35, 0.84, 0);
  const selRodGeo = new THREE.CylinderGeometry(0.014, 0.014, 0.47, 8);
  for (const sz of [-0.2, 0.2]) {
    const rod = new THREE.Mesh(selRodGeo, M_SATIN);
    rod.position.set(-1.68, 1.06, sz);
    g8ms.add(rod);
  }
  const selPost = cyl(0.045, 0.06, 0.8, M_STEEL_DARK);
  selPost.position.set(-1.68, 0.43, 0.2);
  const selFoot = cyl(0.12, 0.15, 0.03, M_STEEL_DARK);
  selFoot.position.set(-1.68, 0.015, 0.2);
  const selLbl = makeTextSprite('速度选择器', { fontSize: 30, color: '#e8c9b8', scale: 0.0028 });
  selLbl.position.set(-1.35, 1.62, 0);
  g8ms.add(selTop, selBot, selLbl, selPost, selFoot);

  /* ---- 窄缝：双挡板（真实缝口）+ 门形架 ---- */
  const slitMat = matStd(0x5a6470, { roughness: 0.42, metalness: 0.7 });
  const slit1 = box(0.09, 0.5, 0.09, slitMat);
  slit1.position.set(-0.62, 1.35, 0);
  const slit2 = slit1.clone(); slit2.position.y = 0.77;
  const slitTopBar = box(0.1, 0.03, 0.12, M_SATIN);
  slitTopBar.position.set(-0.62, 1.62, 0);
  const slitPost2 = cyl(0.03, 0.04, 1.64, M_STEEL_DARK);
  slitPost2.position.set(-0.62, 0.82, 0);
  const slitLbl = makeTextSprite('窄缝', { fontSize: 26, color: '#c9d4de', scale: 0.0026 });
  slitLbl.position.set(-0.62, 1.78, 0);
  g8ms.add(slit1, slit2, slitTopBar, slitPost2, slitLbl);

  /* ---- 偏转磁场区：轻玻璃罩 + 四角棱柱（示界不挡视线） ---- */
  const regionGlass = matCoat(0xcfe2ea, { roughness: 0.06, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false });
  const region = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.95, 2.6), regionGlass);
  region.position.set(0.85, 1.06, -1.2);
  g8ms.add(region);
  const regionPostGeo = new THREE.BoxGeometry(0.03, 0.95, 0.03);
  for (const px of [-0.45, 2.15]) {
    for (const pz of [-2.5, 0.1]) {
      const p = new THREE.Mesh(regionPostGeo, M_SATIN);
      p.position.set(px, 1.06, pz);
      g8ms.add(p);
    }
  }
  const arrows = [];
  for (const x of [-0.1, 0.85, 1.8]) {
    for (const z of [-2.0, -1.2, -0.4]) {
      const a = makeArrow(0x7fb2ff, 0.5);
      g8ms.add(a); arrows.push(a);
    }
  }

  /* ---- 感光屏：钢背板 + 乳白感光膜 + 上下夹条 + 支架 ---- */
  const detBack = box(0.03, 0.44, 2.56, M_STEEL_DARK);
  detBack.position.set(-0.655, 1.06, -1.2);
  const film = box(0.018, 0.36, 2.5, matStd(0xe8e2d2, { roughness: 0.55, emissive: 0x8a8474, emissiveIntensity: 0.12 }));
  film.position.set(-0.63, 1.06, -1.2);
  const clipGeo8 = box(0.06, 0.03, 2.56, M_SATIN);
  const clipT = clipGeo8.clone();
  clipT.position.set(-0.63, 1.3, -1.2);
  const clipB = clipGeo8.clone();
  clipB.position.set(-0.63, 0.82, -1.2);
  for (const dz of [-1.15, 1.15]) {
    const leg = cyl(0.03, 0.04, 0.84, M_STEEL_DARK);
    leg.position.set(-0.66, 0.42, -1.2 + dz);
    const ft = cyl(0.09, 0.11, 0.024, 12);
    ft.position.set(-0.66, 0.012, -1.2 + dz);
    g8ms.add(leg, ft);
  }
  const detLbl = makeTextSprite('感光屏', { fontSize: 30, color: '#e8e2d2', scale: 0.0028 });
  detLbl.position.set(-0.62, 1.46, -2.3);
  g8ms.add(detBack, film, clipT, clipB, detLbl);
  bakeContactShadow(0, -1.2, 4.4, 3.4, 0.24);
  const ions = [];
  const trails = [];
  const labels = [];
  const TRN = 140;
  ISOTOPES.forEach((iso) => {
    const m = new THREE.Mesh(
      new THREE.SphereGeometry(0.055, 14, 10),
      new THREE.MeshBasicMaterial({ color: iso.color })
    );
    m.visible = false;
    g8ms.add(m);
    const tPos = new Float32Array(TRN * 3);
    const tGeo = new THREE.BufferGeometry();
    tGeo.setAttribute('position', new THREE.BufferAttribute(tPos, 3));
    tGeo.setDrawRange(0, 0);
    const line = new THREE.Line(tGeo, new THREE.LineBasicMaterial({ color: iso.color, transparent: true, opacity: 0.75 }));
    line.frustumCulled = false;
    g8ms.add(line);
    const lbl = makeTextSprite(iso.name, { fontSize: 30, color: '#ffffff', scale: 0.003 });
    lbl.visible = false;
    g8ms.add(lbl);
    ions.push({ iso, mesh: m, phi: 0, r: 0, active: false, tPos, tGeo, tLen: 0 });
    trails.push(line);
    labels.push(lbl);
  });
  const flash = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeGlowTexture('255,240,190'), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false,
  }));
  flash.scale.set(0.28, 0.28, 1);
  flash.visible = false;
  g8ms.add(flash);
  w8ms = { arrows, ions, labels, flash, flashT: -1 };
}
function applyMSArrows() {
  let i = 0;
  for (const x of [-0.1, 0.85, 1.8]) {
    for (const z of [-2.0, -1.2, -0.4]) {
      setArrow(w8ms.arrows[i++], V3(x, 0.72, z), V3(0, -1, 0), 0.16 + st8.B * 0.16);
    }
  }
}
function launchMS() {
  for (let i = 0; i < w8ms.ions.length; i++) {
    const ion = w8ms.ions[i];
    ion.active = false;
    ion.hit = false;
    ion.mesh.visible = false;
    ion.tLen = 0;
    ion.tGeo.setDrawRange(0, 0);
    ion.delay = i * 0.55;
    const mKg = ion.iso.mass * 1.66e-27;
    const rM = Math.sqrt((2 * mKg * st8.U) / (1.6e-19 * st8.B * st8.B));
    ion.rReal = rM;
    ion.r = clamp(rM * 26, 0.15, 2.3);
    ion.speed = 1.5 * Math.sqrt(st8.U / 600);
    w8ms.labels[i].visible = false;
  }
  st8.msTime = 0;
}
function msRadiusText() {
  const mKg = 12 * 1.66e-27;
  const rM = Math.sqrt((2 * mKg * st8.U) / (1.6e-19 * st8.B * st8.B));
  return (rM * 100).toFixed(1) + ' cm';
}

let w8c = {};
const TRAIL8 = 420;
function buildCyc() {
  /* ---- D 形盒：半圆扁盒（外缘车削倒边）+ 馈电铜杆 + 高频电源箱 ---- */
  const deeMat = matCoat(0x8f9aa6, { roughness: 0.3, metalness: 0.85, clearcoat: 0.35 });
  const dee1 = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 0.15, 40, 1, false, 0, Math.PI), deeMat);
  dee1.position.set(0.07, PLANE_Y, 0);
  const dee2 = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 0.15, 40, 1, false, Math.PI, Math.PI), deeMat);
  dee2.position.set(-0.07, PLANE_Y, 0);
  const lipGeoPos = new THREE.TorusGeometry(1.15, 0.018, 8, 40, Math.PI);
  lipGeoPos.rotateX(Math.PI / 2);       /* 放平：π 弧先盖 z>0 半边 */
  lipGeoPos.rotateY(Math.PI / 2);       /* 转到 x>0 半边（对齐 D₁ 盒） */
  const lipGeoNeg = lipGeoPos.clone();
  lipGeoNeg.rotateY(Math.PI);           /* 镜像到 x<0（D₂ 盒） */
  for (const [geo, dx] of [[lipGeoPos, 0.07], [lipGeoNeg, -0.07]]) {
    for (const ly of [PLANE_Y + 0.075, PLANE_Y - 0.075]) {
      const lip = new THREE.Mesh(geo, M_SATIN);
      lip.position.set(dx, ly, 0);
      g8cyc.add(lip);
    }
  }
  const d1Lbl = makeTextSprite('D₁', { fontSize: 36, color: '#dfe6ee', scale: 0.003 });
  d1Lbl.position.set(0.65, PLANE_Y + 0.2, 0.65);
  const d2Lbl = makeTextSprite('D₂', { fontSize: 36, color: '#dfe6ee', scale: 0.003 });
  d2Lbl.position.set(-0.65, PLANE_Y + 0.2, -0.65);
  /* 馈电杆：D 盒底 → 高频电源箱 */
  const stemMat = M_COPPER;
  for (const sx of [-1, 1]) {
    const stem = cyl(0.035, 0.045, 0.85, stemMat);
    stem.position.set(sx * 0.55, 0.56, 0.42);
    g8cyc.add(stem);
    const bend = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.035, 8, 14, Math.PI / 1.6), stemMat);
    bend.rotation.set(0, Math.PI / 2, sx > 0 ? -0.5 : Math.PI + 0.5);
    bend.position.set(sx * 0.62, 0.17, 0.42);
    g8cyc.add(bend);
  }
  const rfBox = box(1.05, 0.26, 0.5, F_BAKELITE);
  rfBox.position.set(0, 0.13, 0.55);
  const rfVentTex = canvasTex(256, 96, (ctx) => {
    ctx.fillStyle = '#27221d';
    ctx.fillRect(0, 0, 256, 96);
    ctx.fillStyle = '#12100d';
    for (let y = 14; y < 82; y += 18) ctx.fillRect(20, y, 216, 7);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 2;
    for (let y = 14; y < 82; y += 18) ctx.strokeRect(20, y, 216, 7);
  });
  const rfVentMat = matStd(0xffffff, { roughness: 0.55 });
  rfVentMat.map = rfVentTex;
  const rfVent = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 0.18), rfVentMat);
  rfVent.position.set(0, 0.15, 0.802);
  const rfKnob = cyl(0.045, 0.05, 0.05, matKnurl(0x1d2126, 0.3, 36));
  rfKnob.rotation.x = Math.PI / 2;
  rfKnob.position.set(0.38, 0.16, 0.83);
  const rfLblMat = matStd(0xffffff, { roughness: 0.85 });
  rfLblMat.map = makeLabelTexture(['射频电源', 'f = qB/2πm'], { w: 230, h: 110, lineSizes: [34, 22] });
  const rfLblPlate = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.2), rfLblMat);
  rfLblPlate.position.set(-0.2, 0.15, 0.802);
  const rfFootGeo = new THREE.CylinderGeometry(0.05, 0.06, 0.04, 10);
  for (const fx of [-0.45, 0.45]) {
    const ffoot = new THREE.Mesh(rfFootGeo, M_STEEL_DARK);
    ffoot.position.set(fx, 0.02, 0.55);
    g8cyc.add(ffoot);
  }
  g8cyc.add(rfBox, rfVent, rfKnob, rfLblPlate);
  const gapFlash = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.2, 0.5),
    new THREE.MeshBasicMaterial({ color: 0xffb347, transparent: true, opacity: 0 })
  );
  gapFlash.position.set(0, PLANE_Y, 0);
  const particle = new THREE.Mesh(
    new THREE.SphereGeometry(0.05, 12, 10),
    new THREE.MeshBasicMaterial({ color: 0xffd166 })
  );
  particle.visible = false;
  const trailPos = new Float32Array(TRAIL8 * 3);
  const trailGeo = new THREE.BufferGeometry();
  trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPos, 3));
  trailGeo.setDrawRange(0, 0);
  const trail = new THREE.Line(trailGeo, new THREE.LineBasicMaterial({ color: 0xffd166, transparent: true, opacity: 0.85 }));
  trail.frustumCulled = false;
  g8cyc.add(dee1, dee2, d1Lbl, d2Lbl, gapFlash, particle, trail);
  bakeContactShadow(0, 0.3, 3.0, 2.6, 0.26);
  w8c = { dee1, dee2, gapFlash, particle, trail, trailPos, trailGeo, trailLen: 0, flashT: 0 };
}
function launchCyc() {
  w8c.trailLen = 0;
  w8c.trailGeo.setDrawRange(0, 0);
  st8c.pos.set(-0.32, PLANE_Y, 0);
  st8c.vel.set(0.45 + 0.25 * (st8.U / 600), 0, 0);
  st8c.crossings = 0;
  st8c.active = true;
  st8c.prevX = st8c.pos.x;
  w8c.particle.visible = true;
}
const st8c = { pos: new THREE.Vector3(), vel: new THREE.Vector3(), active: false, crossings: 0, prevX: 0 };

/* ---------------- 第 9 章 · 电磁感应与楞次定律 ---------------- */

const g9 = new THREE.Group();
scene.add(g9);
const st9 = { speed: 1.2, N: 12, action: 'still', magX: 2.4, anim: false, animDir: 0, emf: 0, showArrows: true, mode: 'magnet' };
const st9r = { F: 0.12, B: 0.5, L: 0.8, R: 2, v: 0, x: -0.7 };
let w9 = {};
let w9r = {};
function buildInduction() {
  /* ---- 线圈总成：漆包铜线匝（匝数可调）+ 骨架圆管 + 两端木挡板 + 底板支柱 + 引线接线柱 ---- */
  const coilMat = M_COPPER;
  const coilG = new THREE.Group();
  coilG.position.y = PLANE_Y;
  const tori = [];
  const torusGeo9 = new THREE.TorusGeometry(0.36, 0.021, 8, 30);
  for (let i = 0; i < 18; i++) {
    const t = new THREE.Mesh(torusGeo9, coilMat);
    t.rotation.y = Math.PI / 2;
    coilG.add(t);
    tori.push(t);
  }
  const coreTube = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.33, 1.46, 24, 1, true), matStd(0xd8cdb4, { roughness: 0.8 }));
  coreTube.rotation.z = Math.PI / 2;
  coilG.add(coreTube);
  const cheekGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.035, 26);
  for (const sx of [-1, 1]) {
    const cheek = new THREE.Mesh(cheekGeo, matStd(0xffffff, { roughness: 0.6 }));
    cheek.material.map = makeWoodTexture({ base: '#7a5836', dark: '#54371e', light: '#95713f', streaks: 60, bands: 5, seed: 77 });
    cheek.rotation.z = Math.PI / 2;
    cheek.position.x = sx * 0.76;
    coilG.add(cheek);
  }
  const curArrows = new THREE.Group();
  const coneGeo = new THREE.ConeGeometry(0.035, 0.1, 8);
  const curMat = new THREE.MeshBasicMaterial({ color: 0x35d07a });
  for (let k = 0; k < 4; k++) {
    const c = new THREE.Mesh(coneGeo, curMat);
    curArrows.add(c);
  }
  coilG.add(curArrows);
  g9.add(coilG);
  /* 底板 + 双支柱托住线圈 + 接线柱 + 引线 */
  const coilBoard = roundedSlab(2.1, 0.9, 0.05, 0.04, matStd(0xffffff, { roughness: 0.62 }), 0.012);
  coilBoard.material.map = makeWoodTexture({ base: '#6e4c2c', dark: '#4a3120', light: '#8a6640', streaks: 80, bands: 6, seed: 55 });
  coilBoard.position.set(0, 0.025, 0);
  const riserGeo9 = new THREE.CylinderGeometry(0.045, 0.06, 0.66, 12);
  for (const sx of [-1, 1]) {
    const riser = new THREE.Mesh(riserGeo9, M_STEEL_DARK);
    riser.position.set(sx * 0.82, 0.35, 0);
    g9.add(riser);
  }
  const cp1 = makePost(0.06); cp1.position.set(-0.88, 0.05, 0.32);
  const cp2 = makePost(0.06); cp2.position.set(-0.68, 0.05, 0.32);
  g9.add(coilBoard, cp1, cp2);
  /* ---- 磁铁导轨（双轨 + 端挡 + 支脚），磁铁沿轨插拔 ---- */
  const railGeo9 = new THREE.BoxGeometry(3.6, 0.035, 0.06);
  const magnetRails = new THREE.Group();
  for (const rz of [-0.09, 0.09]) {
    const rail = new THREE.Mesh(railGeo9, M_SATIN);
    rail.position.set(0.4, 0.9, rz);
    magnetRails.add(rail);
  }
  for (const sx of [-1.38, 2.18]) {
    const stop = box(0.05, 0.1, 0.24, M_STEEL_DARK);
    stop.position.set(sx, 0.92, 0);
    magnetRails.add(stop);
  }
  const railFootGeo = new THREE.CylinderGeometry(0.06, 0.075, 0.88, 12);
  for (const rx of [-1.1, 0.4, 1.9]) {
    const rf = new THREE.Mesh(railFootGeo, M_STEEL_DARK);
    rf.position.set(rx, 0.455, 0);
    magnetRails.add(rf);
  }
  g9.add(magnetRails);
  const magnet = makeBarMagnet(1.0, 0.14);
  magnet.rotation.y = Math.PI; // N 极朝 −x，先插入的是 N 极
  const magLbl = makeTextSprite('条形磁铁', { fontSize: 28, color: '#e0c9b8', scale: 0.0026 });
  magLbl.position.set(0, 0.26, 0);
  magnet.add(magLbl);
  g9.add(magnet);

  /* ---- 灵敏电流计（3D 实体）：胶木壳 + 表盘贴花 + 动圈指针（帧循环随 e 偏转）+ 玻璃面 ---- */
  const galv = new THREE.Group();
  galv.position.set(-1.1, 0, 1.35);
  galv.rotation.y = 0.42;
  const case9 = roundedSlab(0.58, 0.5, 0.26, 0.05, F_BAKELITE, 0.018, 'up');
  case9.position.y = 0.27;   /* 壳体前脸含倒角 ≈ z+0.148，表盘 0.16 露出 12mm 不 z-fight */
  const dialTex = canvasTex(256, 160, (ctx) => {
    ctx.fillStyle = '#efe9d8';
    ctx.fillRect(0, 0, 256, 160);
    ctx.strokeStyle = '#8a4030';
    ctx.lineWidth = 4;
    ctx.strokeRect(6, 6, 244, 148);
    const cx = 128, cy = 152, R = 118;
    ctx.strokeStyle = '#3a3a3a';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(cx, cy, R, Math.PI + Math.PI / 7, TAU - Math.PI / 7);
    ctx.stroke();
    ctx.fillStyle = '#3a3a3a';
    ctx.font = '600 17px sans-serif';
    ctx.textAlign = 'center';
    for (let k = -3; k <= 3; k++) {
      const a = Math.PI / 2 + (k / 3.4) * (Math.PI * 5 / 12);
      ctx.strokeStyle = '#3a3a3a';
      ctx.lineWidth = k % 2 ? 1.6 : 2.6;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * (R - 12), cy - Math.sin(a) * (R - 12));
      ctx.lineTo(cx + Math.cos(a) * R, cy - Math.sin(a) * R);
      ctx.stroke();
      if (k % 2 === 0) ctx.fillText(String(Math.abs(k) * 30), cx + Math.cos(a) * (R - 28), cy - Math.sin(a) * (R - 28) + 5);
    }
    ctx.font = '500 15px sans-serif';
    ctx.fillText('μA', cx, 26);
    ctx.fillText('0', cx, cy - 8);
  });
  const dial = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.3), matStd(0xffffff, { roughness: 0.6 }));
  dial.material.map = dialTex;
  dial.position.set(0, 0.3, 0.16);
  const needle9 = new THREE.Group();
  needle9.position.set(0, 0.19, 0.166);
  const nBar = box(0.012, 0.24, 0.005, matStd(0xd23b30, { roughness: 0.4 }));
  nBar.position.y = 0.1;
  const nHub = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.014, 10), M_BRASS);
  nHub.rotation.x = Math.PI / 2;
  needle9.add(nBar, nHub);
  const glassFace = new THREE.Mesh(new THREE.PlaneGeometry(0.52, 0.32), matCoat(0xdfeef2, { roughness: 0.04, opacity: 0.14 }));
  glassFace.position.set(0, 0.3, 0.174);
  const gp1 = makePost(0.05); gp1.position.set(-0.18, 0.52, 0.05);
  const gp2 = makePost(0.05); gp2.position.set(0.18, 0.52, 0.05);
  galv.add(case9, dial, needle9, glassFace, gp1, gp2);
  /* 线圈 → 电流计 引线（两根软管走线） */
  const wireMat9 = matStd(0x2c3138, { roughness: 0.6 });
  const gCurve1 = new THREE.CatmullRomCurve3([V3(-0.88, 0.14, 0.32), V3(-1.0, 0.1, 0.7), V3(-1.18, 0.56, 1.28), V3(-1.28, 0.55, 1.4)]);
  const gCurve2 = new THREE.CatmullRomCurve3([V3(-0.68, 0.14, 0.32), V3(-0.7, 0.1, 0.85), V3(-0.92, 0.55, 1.35), V3(-0.92, 0.55, 1.4)]);
  g9.add(galv,
    new THREE.Mesh(new THREE.TubeGeometry(gCurve1, 20, 0.009, 6), wireMat9),
    new THREE.Mesh(new THREE.TubeGeometry(gCurve2, 20, 0.009, 6), wireMat9));
  bakeContactShadow(0, 0, 4.6, 2.4, 0.26);
  w9 = { coilG, magnetRails, tori, curArrows, magnet, galvCv: null, galvNeedle: needle9 };

  /* 导体棒切割子台（mode='rod' 时显示） */
  const rg = new THREE.Group();
  rg.visible = false;
  const railMat = M_SATIN;
  const railA = box(2.6, 0.04, 0.06, railMat); railA.position.set(0.1, 0.94, -0.3);
  const railB = railA.clone(); railB.position.z = 0.3;
  const legGeo9 = new THREE.BoxGeometry(0.09, 0.92, 0.09);
  const legFootGeo = new THREE.CylinderGeometry(0.07, 0.085, 0.024, 12);
  for (const lx of [-1.1, 1.3]) {
    for (const lz of [-0.3, 0.3]) {
      const leg = new THREE.Mesh(legGeo9, M_STEEL_DARK);
      leg.position.set(lx, 0.46, lz);
      const lfoot = new THREE.Mesh(legFootGeo, M_STEEL_DARK);
      lfoot.position.set(lx, 0.012, lz);
      rg.add(leg, lfoot);
    }
  }
  const rod = box(0.07, 0.07, 0.66, M_BRASS);
  rod.position.y = 1.0;
  const rodG = new THREE.Group();
  rodG.add(rod);
  rodG.position.x = -0.7;
  const pullArr = makeArrow(0x35d07a, 0.9);
  setArrow(pullArr, V3(-0.25, 1.06, 0), V3(1, 0, 0), 0.35);
  rodG.add(pullArr);
  const rodLbl = makeTextSprite('导体棒（受恒定拉力）', { fontSize: 26, color: '#b8ecc9', scale: 0.0024 });
  rodLbl.position.set(0, 0.3, 0);
  rodG.add(rodLbl);
  const bArrows = [];
  for (const x of [-0.7, 0.1, 0.9]) {
    const a = makeArrow(0x7fb2ff, 0.6);
    rg.add(a); bArrows.push(a);
  }
  /* 电阻：瓷管绕线电阻（色环 + 端帽）+ 支架 */
  const resG = new THREE.Group();
  resG.position.set(-1.35, 1.0, 0);
  const resTube = cyl(0.07, 0.07, 0.2, M_CERAMIC);
  resTube.rotation.z = Math.PI / 2;
  const bandMat = matStd(0x2f3338, { roughness: 0.5 });
  for (const bx of [-0.055, 0, 0.055]) {
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.072, 0.02, 16), bandMat);
    band.rotation.z = Math.PI / 2;
    band.position.x = bx;
    resG.add(band);
  }
  for (const sx of [-1, 1]) {
    const endCap = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.03, 12), M_BRASS);
    endCap.rotation.z = Math.PI / 2;
    endCap.position.x = sx * 0.125;
    const lead = cyl(0.008, 0.008, 0.1, M_BRASS);
    lead.rotation.z = Math.PI / 2;
    lead.position.x = sx * 0.19;
    resG.add(endCap, lead);
  }
  const resStand = box(0.09, 0.9, 0.09, M_STEEL_DARK);
  resStand.position.set(-1.35, 0.46, 0);
  const resFoot = new THREE.Mesh(legFootGeo, M_STEEL_DARK);
  resFoot.position.set(-1.35, 0.012, 0);
  const resLbl = makeTextSprite('电阻 R', { fontSize: 26, color: '#c9d4de', scale: 0.0024 });
  resLbl.position.set(-1.35, 1.3, 0);
  rg.add(resG, resStand, resFoot, resLbl);
  g9.add(rg);
  w9r = { g: rg, rodG, bArrows };
}
function applyMode9() {
  const rod = st9.mode === 'rod';
  w9.coilG.visible = !rod;
  w9.magnetRails.visible = !rod;
  w9.magnet.visible = !rod;
  w9r.g.visible = rod;
  w9r.bArrows.forEach((a) => {
    a.visible = rod;
    setArrow(a, a.position, V3(0, -1, 0), 0.2 + st9r.B * 0.22);
  });
  w9r.bArrows[0].position.set(-0.7, 0.8, 0);
  w9r.bArrows[1].position.set(0.1, 0.8, 0);
  w9r.bArrows[2].position.set(0.9, 0.8, 0);
}
function applyCoilTurns() {
  const N = st9.N;
  for (let i = 0; i < 18; i++) {
    const t = w9.tori[i];
    t.visible = i < N;
    t.position.x = -0.65 + ((i + 0.5) / N) * 1.3;
  }
}
function setAction9(act) {
  st9.action = act;
  if (act === 'insert') { st9.anim = true; st9.animDir = -1; }
  else if (act === 'pull') { st9.anim = true; st9.animDir = 1; }
  else st9.anim = false;
}
function emf9(vx) {
  // Φ(d)=N/(d²+c)^1.5 的解析导数：raw = 3N·d·v·(d²+c)^-2.5，插入为负、拔出为正（归一化时 /900）
  const d = Math.abs(st9.magX);
  return 3 * st9.N * d * vx * Math.pow(d * d + 0.18, -2.5);
}
function drawGalv(needle) {
  if (!w9.galvCv) w9.galvCv = makeCorner('灵敏电流计');
  const { ctx } = w9.galvCv;
  const W = ctx.canvas.width, H = ctx.canvas.height;
  ctx.fillStyle = '#161a1f';
  ctx.fillRect(0, 0, W, H);
  const cx = W / 2, cy = H * 0.86, R = H * 0.62;
  ctx.strokeStyle = '#6d7884';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, R, Math.PI + (Math.PI / 6), TAU - (Math.PI / 6));
  ctx.stroke();
  ctx.fillStyle = '#9aa3ac';
  ctx.font = '22px sans-serif';
  ctx.textAlign = 'center';
  for (let k = -3; k <= 3; k++) {
    const a = Math.PI / 2 + (k / 3.4) * (Math.PI * 5 / 12);
    const x1 = cx + Math.cos(a) * (R - 12), y1 = cy - Math.sin(a) * (R - 12);
    const x2 = cx + Math.cos(a) * R, y2 = cy - Math.sin(a) * R;
    ctx.strokeStyle = '#9aa3ac';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    if (k % 2 === 0) ctx.fillText(String(Math.abs(k) * 10), cx + Math.cos(a) * (R - 34), cy - Math.sin(a) * (R - 34) + 6);
  }
  ctx.fillStyle = '#c9d4de';
  ctx.fillText('μA', cx, cy - R - 8);
  ctx.fillText('0', cx, cy + 4);
  const ang = Math.PI / 2 + clamp(needle, -1, 1) * (Math.PI * 5 / 12);
  ctx.strokeStyle = '#e5484d';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(ang) * (R - 16), cy - Math.sin(ang) * (R - 16));
  ctx.stroke();
  ctx.fillStyle = '#e5484d';
  ctx.beginPath();
  ctx.arc(cx, cy, 6, 0, TAU);
  ctx.fill();
}

/* ---------------- 第 10 章 · 交流发电机 ---------------- */

const g10 = new THREE.Group();
scene.add(g10);
const st10 = { n: 1.2, B: 0.8, Nt: 12, bulb: true, theta: 0 };
let w10 = {};
function buildGenerator() {
  /* ---- 定子：红/蓝烤漆磁极 + 钢质极靴（展磁面）+ 机座轭背 + 双支座落台 ---- */
  const poleN = box(0.3, 1.3, 1.3, F_PAINT_RED);
  poleN.position.set(-1.5, 1.06, 0);
  const poleS = box(0.3, 1.3, 1.3, F_PAINT_BLUE);
  poleS.position.set(1.5, 1.06, 0);
  const shoeGeo10 = box(0.06, 1.5, 1.5, matCoat(0x9ba3ac, { roughness: 0.3, metalness: 0.9, clearcoat: 0.3 }));
  const shoeN = shoeGeo10.clone(); shoeN.position.set(-1.32, 1.06, 0);
  const shoeS = shoeGeo10.clone(); shoeS.position.set(1.32, 1.06, 0);
  const yokeBack = box(3.4, 1.5, 0.24, matStd(0x454b52, { roughness: 0.5, metalness: 0.6 }));
  yokeBack.position.set(0, 1.06, -0.86);
  const basePlate10 = box(3.6, 0.08, 2.0, matStd(0x454b52, { roughness: 0.55, metalness: 0.5 }));
  basePlate10.position.set(0, 0.04, -0.1);
  const pedGeo10 = new THREE.BoxGeometry(0.26, 0.33, 1.3);
  for (const px of [-1.5, 1.5]) {
    const ped = new THREE.Mesh(pedGeo10, matStd(0x454b52, { roughness: 0.55, metalness: 0.5 }));
    ped.position.set(px, 0.245, 0);
    g10.add(ped);
  }
  const nLbl = makeTextSprite('N', { fontSize: 60, color: '#ffd9d4', scale: 0.0026 });
  nLbl.position.set(-1.5, 1.85, 0);
  const sLbl = makeTextSprite('S', { fontSize: 60, color: '#cfe2ff', scale: 0.0026 });
  sLbl.position.set(1.5, 1.85, 0);
  g10.add(poleN, poleS, shoeN, shoeS, yokeBack, basePlate10, nLbl, sLbl);
  bakeContactShadow(0, -0.1, 4.4, 2.8, 0.28);
  const arrows = [];
  for (const y of [0.68, 1.44]) {
    for (const z of [-0.42, 0, 0.42]) {
      const a = makeArrow(0xc7ccd4, 0.7);
      g10.add(a); arrows.push(a);
    }
  }

  /* ---- 转子：多匝矩形线圈 + 轴 + 换向器（双铜半环 + 云母隔层）+ 碳刷（弹簧压臂）---- */
  const coilMat = M_COPPER;
  const coilG = new THREE.Group();
  coilG.position.y = PLANE_Y;
  const loopPts = [
    V3(0, -0.34, -0.28), V3(0, 0.34, -0.28), V3(0, 0.34, 0.28), V3(0, -0.34, 0.28),
  ];
  for (const s of [1, 0.88, 0.76]) {
    const pts = loopPts.map((p) => p.clone().multiplyScalar(s));
    const curve = new THREE.CatmullRomCurve3(pts, true, 'catmullrom', 0.6);
    coilG.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 48, 0.016, 8, true), coilMat));
  }
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.7, 10), M_SATIN);
  shaft.rotation.x = Math.PI / 2;
  coilG.add(shaft);
  /* 换向器：两只铜半环（缝隙 8°）+ 云母芯 */
  const segGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.075, 18, 1, false, 0, Math.PI - 0.14);
  for (const rot of [0, Math.PI + 0.14]) {
    const seg = new THREE.Mesh(segGeo, M_BRASS);
    seg.rotation.x = Math.PI / 2;
    seg.rotation.y = rot;
    seg.position.z = 0.14;
    coilG.add(seg);
  }
  const micaCore = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.08, 12), matStd(0xd8d2c4, { roughness: 0.7 }));
  micaCore.rotation.x = Math.PI / 2;
  micaCore.position.z = 0.14;
  coilG.add(micaCore);
  g10.add(coilG);
  /* 电刷架：碳块 + 弹簧压臂 + 支柱 + 出线接线柱 */
  const brushG = new THREE.Group();
  brushG.position.set(0, PLANE_Y, 0.14);
  for (const sa of [0.3, Math.PI + 0.3]) {
    const holder = new THREE.Group();
    const carbon = box(0.03, 0.05, 0.035, matStd(0x2f3338, { roughness: 0.7 }));
    carbon.position.set(Math.cos(sa) * 0.072, Math.sin(sa) * 0.072, 0);
    carbon.rotation.z = sa;
    const arm = box(0.016, 0.11, 0.02, M_SATIN);
    arm.position.set(Math.cos(sa) * 0.115, Math.sin(sa) * 0.115, 0);
    arm.rotation.z = sa;
    const post10 = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.09, 8), M_SATIN);
    post10.position.set(Math.cos(sa) * 0.15, Math.sin(sa) * 0.15, 0);
    holder.add(carbon, arm, post10);
    brushG.add(holder);
  }
  g10.add(brushG);

  /* ---- 演示灯泡：车削玻壳 + 灯丝（螺旋管，与玻璃同步发光）+ 黄铜螺口 + 灯座 ---- */
  const bulbBase = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.09, 14), matStd(0x5a6470, { roughness: 0.5, metalness: 0.5 }));
  bulbBase.position.set(1.0, 0.875, 0.8);
  const bulbGlassMat = matCoat(0xffe9b8, { roughness: 0.22, emissive: 0xffb347, emissiveIntensity: 0 });
  const bulbProf = [
    [0.0, 0], [0.055, 0.005], [0.075, 0.04], [0.085, 0.1], [0.08, 0.17], [0.06, 0.2],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  const bulb = new THREE.Mesh(new THREE.LatheGeometry(bulbProf, 20), bulbGlassMat);
  bulb.position.set(1.0, 0.92, 0.8);
  const filamentMat = matGlow(0xffb347, 0, { color: 0xffd9a0 });
  const filCurve = new THREE.CatmullRomCurve3([
    V3(-0.03, 0.05, 0), V3(-0.015, 0.09, 0.012), V3(0, 0.05, -0.012), V3(0.015, 0.09, 0.012), V3(0.03, 0.05, 0),
  ]);
  const filament = new THREE.Mesh(new THREE.TubeGeometry(filCurve, 24, 0.004, 5), filamentMat);
  filament.position.copy(bulb.position);
  const screwShell = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.048, 0.07, 14), M_BRASS);
  screwShell.position.set(1.0, 0.895, 0.8);
  for (const ty of [0.876, 0.893, 0.91]) {
    const thread = new THREE.Mesh(new THREE.TorusGeometry(0.046, 0.005, 6, 16), M_BRASS);
    thread.rotation.x = Math.PI / 2;
    thread.position.set(1.0, ty, 0.8);
    g10.add(thread);
  }
  const bulbGlow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeGlowTexture('255,220,150'), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0,
  }));
  bulbGlow.position.set(1.0, 1.03, 0.8);
  bulbGlow.scale.set(0.3, 0.3, 1);
  const stand = box(0.18, 0.04, 0.18, M_STEEL_DARK);
  stand.position.set(1.0, 0.82, 0.8);
  const wireCurve = new THREE.CatmullRomCurve3([
    V3(0, PLANE_Y - 0.1, -0.1), V3(0.32, 0.8, -0.05), V3(0.68, 0.92, 0.45), V3(0.97, 0.9, 0.72),
  ]);
  const wireCurve2 = new THREE.CatmullRomCurve3([
    V3(0, PLANE_Y + 0.1, 0.1), V3(0.4, 1.34, 0.4), V3(0.78, 1.12, 0.68), V3(0.99, 1.02, 0.78),
  ]);
  const wireMat = matStd(0x2c3138, { roughness: 0.6 });
  g10.add(bulbBase, bulb, filament, screwShell, bulbGlow, stand,
    new THREE.Mesh(new THREE.TubeGeometry(wireCurve, 32, 0.008, 6), wireMat),
    new THREE.Mesh(new THREE.TubeGeometry(wireCurve2, 32, 0.008, 6), wireMat));
  w10 = { arrows, coilG, bulbMat: bulbGlassMat, filamentMat, bulbGlow, waveCv: null, samples: new Array(160).fill(0) };
}
function applyGenArrows() {
  let i = 0;
  for (const y of [0.68, 1.44]) {
    for (const z of [-0.42, 0, 0.42]) {
      setArrow(w10.arrows[i++], V3(0, y, z), V3(1, 0, 0), 0.22 + st10.B * 0.22);
    }
  }
}
function drawWave(eN) {
  if (!w10.waveCv) w10.waveCv = makeCorner('感应电动势 e(t)');
  w10.samples.push(eN);
  w10.samples.shift();
  const { ctx } = w10.waveCv;
  const W = ctx.canvas.width, H = ctx.canvas.height;
  ctx.fillStyle = '#161a1f';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = '#39424d';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke();
  ctx.strokeStyle = '#ffd166';
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let i = 0; i < w10.samples.length; i++) {
    const x = (i / (w10.samples.length - 1)) * (W - 16) + 8;
    const y = H / 2 - clamp(w10.samples[i], -1.1, 1.1) * (H * 0.4);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

/* ---------------- 第 11 章 · 自由实验（电荷沙盒 + 合场粒子） ---------------- */

const g11 = new THREE.Group();
scene.add(g11);
const cf2 = createChargeField(g11, { line: 0xff8a3d, equip: 0x5a9bff });
const st11 = { Bon: false, B: 0.8, ptype: 'electron' };
const PTYPE11 = {
  electron: { label: '电子', q: -1, m: 0.5, color: 0x7be0ff },
  proton: { label: '质子', q: 1, m: 1, color: 0xff9a7b },
  alpha: { label: 'α 粒子', q: 2, m: 4, color: 0xffd166 },
};
let w11 = {};
function buildSandbox() {
  /* 匀强磁场线圈对（亥姆霍兹式骨架环）：开启磁场时现身，与蓝色箭头同义 */
  const coilRings = new THREE.Group();
  const ringMat11 = M_COPPER;
  for (const rz of [-1.5, 1.5]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.85, 0.035, 10, 48), ringMat11);
    ring.position.set(0, 1.06, rz);
    coilRings.add(ring);
    for (const sx of [-1, 1]) {
      const leg = cyl(0.03, 0.04, 1.06, M_STEEL_DARK);
      leg.position.set(sx * 1.62, 0.53, rz);
      const lfoot = cyl(0.07, 0.085, 0.024, 12);
      lfoot.position.set(sx * 1.62, 0.012, rz);
      coilRings.add(leg, lfoot);
    }
  }
  coilRings.visible = false;
  g11.add(coilRings);
  const arrows = [];
  for (const x of [-1.6, -0.8, 0, 0.8, 1.6]) {
    for (const z of [-1.6, -0.8, 0, 0.8, 1.6]) {
      const a = makeArrow(0x7fb2ff, 0.45);
      setArrow(a, V3(x, 0.62, z), UPV, 0.34);
      a.visible = false;
      g11.add(a); arrows.push(a);
    }
  }
  const parts = [];
  const PMAX = 4;
  const partGeo = new THREE.SphereGeometry(0.055, 12, 10);
  const partMats = {};
  for (const k of Object.keys(PTYPE11)) {
    partMats[k] = new THREE.MeshBasicMaterial({ color: PTYPE11[k].color });
  }
  const TRP = 240;
  for (let i = 0; i < PMAX; i++) {
    const m = new THREE.Mesh(partGeo, partMats.electron);
    m.visible = false;
    g11.add(m);
    const tPos = new Float32Array(TRP * 3);
    const tGeo = new THREE.BufferGeometry();
    tGeo.setAttribute('position', new THREE.BufferAttribute(tPos, 3));
    tGeo.setDrawRange(0, 0);
    const line = new THREE.Line(tGeo, new THREE.LineBasicMaterial({ color: 0x7be0ff, transparent: true, opacity: 0.7 }));
    line.frustumCulled = false;
    g11.add(line);
    parts.push({ mesh: m, vel: new THREE.Vector3(), active: false, q: -1, mm: 0.5, tPos, tGeo, tLen: 0 });
  }
  w11 = { arrows, parts, TRP, selected: null, partMats, coilRings };
}
function launchParticle11() {
  const p = w11.parts.find((q) => !q.active);
  if (!p) return;
  const pt = PTYPE11[st11.ptype];
  p.active = true;
  p.q = pt.q;
  p.mm = pt.m;
  p.mesh.material = w11.partMats[st11.ptype];
  p.mesh.visible = true;
  p.mesh.position.set(-2.75, PLANE_Y, (Math.random() - 0.5) * 2.6);
  p.vel.set(1.4 + Math.random() * 0.6, 0, 0);
  p.tLen = 0;
  p.tGeo.setDrawRange(0, 0);
}
function clearSelection11() {
  if (w11.selected) w11.selected.ring.visible = false;
  w11.selected = null;
}
function selectCharge11(c) {
  clearSelection11();
  w11.selected = c;
  if (c && c.ring) c.ring.visible = true;
}
function addSandboxCharge(q) {
  if (cf2.charges.length >= 8) return false;
  let x, z, ok = false;
  for (let t = 0; t < 24 && !ok; t++) {
    x = (Math.random() - 0.5) * 3.6;
    z = (Math.random() - 0.5) * 3.2;
    ok = cf2.charges.every((c) => Math.hypot(c.mesh.position.x - x, c.mesh.position.z - z) > 0.75);
  }
  cf2.addCharge(q, x, z);
  cf2.force = true;
  return true;
}
function removeSelectedCharge11() {
  const c = w11.selected;
  if (!c) return;
  const idx = cf2.charges.indexOf(c);
  if (idx >= 0) cf2.charges.splice(idx, 1);
  c.mesh.traverse((o) => { if (o.isSprite) { o.material.map.dispose(); o.material.dispose(); } });
  const chargeGroup = cf2.grp.children[2];
  chargeGroup.remove(c.mesh);
  w11.selected = null;
  cf2.force = true;
}
function clearSandbox11() {
  clearSelection11();
  cf2.clearCharges();
  cf2.force = true;
  w11.parts.forEach((p) => { p.active = false; p.mesh.visible = false; p.tGeo.setDrawRange(0, 0); p.tLen = 0; });
}

/* ---------------- HUD 卡片（收纳进右栏「数据读数」坞） ---------------- */

const hudWrap = document.getElementById('lcData');
function mkHud(rows) { const h = makeHUD(hudWrap, rows); h.el.style.display = 'none'; return h; }
const huds = [
  mkHud([['cfg', '配置'], ['lines', '每电荷场线'], ['drag', '电荷可拖动']]),
  mkHud([['f', '电场力 F=qE'], ['w', '做功 W=qEd'], ['ep', 'ΔEp=−W'], ['note', '移动方向']]),
  mkHud([['e', '场强 E'], ['u', '电压 U'], ['c', '电容 C=εrε₀S/d'], ['note', '规律']]),
  mkHud([['u1', '加速电压 U₁'], ['uy', '偏转电压 U₂'], ['dy', '竖直偏转量'], ['sw', '扫描']]),
  mkHud([['cfg', '装置'], ['dir', '磁感线方向'], ['note', '铁屑俯视']]),
  mkHud([['f', '安培力 F=BIL'], ['dir', '力的方向'], ['v', '导体棒速率']]),
  mkHud([['r', '半径 r=mv/qB'], ['t', '周期 T=2πm/qB'], ['pitch', '螺距 v∥·T'], ['st', '状态']]),
  mkHud([['r', 'C-12 偏转半径'], ['law', '分离规律'], ['st', '状态']]),
  mkHud([['t', '周期 T=2πm/qB'], ['n', '加速次数'], ['ek', '最终动能 Ek'], ['st', '状态']]),
  mkHud([['flux', '磁通变化'], ['emf', '感应电动势'], ['cur', '感应电流方向']]),
  mkHud([['em', '峰值 Em=NBSω'], ['f', '频率 f'], ['rms', '有效值 E=Em/√2'], ['e', '瞬时 e']]),
  mkHud([['n', '电荷数'], ['b', '外加磁场'], ['p', '粒子数']]),
];
const hudsRod = mkHud([['e', '电动势 E=BLv'], ['i', '感应电流 I=E/R'], ['fa', '安培力 F=B²L²v/R'], ['v', '速度 v / 收尾速度']]);
function showHud(i) {
  huds.forEach((h, j) => h.el.style.display = j === i ? '' : 'none');
  hudsRod.el.style.display = i === 'rod' ? '' : 'none';
  /* 本章无读数时「数据读数」手风琴整块收走（不动用户的手风琴偏好；
     showHud 仅在章节 enter() 内被调用，此时布局管理段已初始化完毕） */
  accSecs.data.classList.toggle('acc-empty', i === -1);
}

/* ---------------- 帧循环 ---------------- */

let labReady = false;
const _m4f = new THREE.Matrix4();
const _zerof = new THREE.Matrix4().makeScale(1e-4, 1e-4, 1e-4);

app.onFrame((dt) => {
  if (!labReady) return;
  /* 相机缓动由 attachVFX 接管（tickCamera 在渲染钩子内） */
  const time = performance.now() * 0.001;

  cf1.tick(time);
  cf5.tick(time);
  cf2.tick(time);

  /* 第 2 章：试探电荷移动动画 */
  if (g2.visible && st2.anim) {
    const a = st2.anim;
    a.t += dt / 1.3;
    const k = Math.min(a.t, 1);
    if (a.via) {
      // 折线两段：第一段沿等势面（W=0），第二段顺场线走 d
      if (k < 0.5) {
        w2.probe.position.lerpVectors(a.from, a.via, k / 0.5);
        a.W = 0;
      } else {
        const k2 = (k - 0.5) / 0.5;
        const e = k2 < 0.5 ? 2 * k2 * k2 : 1 - Math.pow(-2 * k2 + 2, 2) / 2;
        w2.probe.position.lerpVectors(a.via, a.to, e);
        a.W = a.q * a.E * e * a.d; // μC·kV/m·m = mJ
      }
    } else {
      const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      w2.probe.position.lerpVectors(a.from, a.to, e);
      const traveled = e * a.d;
      a.W = a.q * a.E * traveled; // μC·kV/m·m = mJ
    }
    a.done = k >= 1;
  }

  /* 第 3 章：介质板插入/抽出（指数缓动滑入板间） */
  if (g3.visible && w3.slab) {
    w3.slab.position.y += (w3.slabTargetY - w3.slab.position.y) * Math.min(1, dt * 6.5);
    w3.slab.visible = w3.slab.position.y < 2.3;
  }

  /* 第 4 章：示波管 */
  if (g4.visible) {
    const ctx = w4.scrCtx;
    ctx.fillStyle = 'rgba(4,20,10,0.20)';
    ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = 'rgba(90,160,120,0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 128); ctx.lineTo(256, 128);
    ctx.moveTo(128, 0); ctx.lineTo(128, 256);
    ctx.stroke();
    const t = time;
    const sx = st4.sweep ? ((t * 0.45) % 1) * 256 : 128;
    const sy = 128 - sig4(t) * 80;
    ctx.fillStyle = '#b6ffd6';
    ctx.shadowColor = '#6affa8';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(sx, sy, 2.6, 0, TAU);
    ctx.fill();
    ctx.shadowBlur = 0;
    w4.scrTex.needsUpdate = true;
    let i = 0;
    for (const d of w4.dots) {
      d.p += dt / 1.15;
      if (d.p >= 1) d.p -= 1;
      const z = -2.0 + d.p * 3.45;
      const tt = t - (1 - d.p) * 1.15;
      let y = 0, x = 0;
      if (d.p > 0.58) {
        const k2 = Math.min((d.p - 0.58) / 0.32, 1);
        y = sig4(tt) * 0.26 * k2;
        x = st4.sweep ? ((((t * 0.45) % 1) * 2 - 1) * 0.14) * k2 : 0;
      }
      _m4f.makeTranslation(x, PLANE_Y + y, z);
      w4.beamMesh.setMatrixAt(i++, _m4f);
    }
    w4.beamMesh.instanceMatrix.needsUpdate = true;
  }

  /* 第 6 章：导体棒安培力滑动 */
  if (g6.visible) {
    const F = st6.B * st6.I * st6.L;
    const dirSign = st6.dir > 0 ? -1 : 1; // B=−y：I=+x → F=−z；I 反向 → +z
    st6.v += dirSign * F * 0.4 * dt;
    st6.v = clamp(st6.v, -1.4, 1.4);
    st6.z += st6.v * dt;
    if (st6.z < -1.15) { st6.z = -1.15; if (st6.v < 0) st6.v = 0; }
    if (st6.z > 1.15) { st6.z = 1.15; if (st6.v > 0) st6.v = 0; }
    w6.rodG.position.z = st6.z;
  }

  /* 第 7 章：洛伦兹圆周运动（精确旋转，速率恒定） */
  if (g7.visible && st7.active) {
    const sub = 3;
    const omega = (0.9 * st7.q * st7.B) / st7.m;
    for (let s = 0; s < sub; s++) {
      const ang = -omega * dt / sub;
      st7.vel.applyAxisAngle(UPV, ang);
      st7.pos.addScaledVector(st7.vel, dt / sub);
    }
    w7.particle.position.copy(st7.pos);
    pushTrail7();
    if (Math.abs(st7.pos.x) > 1.55 || Math.abs(st7.pos.z) > 1.55 || Math.abs(st7.pos.y - PLANE_Y) > 0.55) st7.active = false;
  }

  /* 第 8 章：质谱仪离子飞行 */
  if (g8ms.visible) {
    st8.msTime += dt;
    for (const ion of w8ms.ions) {
      if (!ion.active && !ion.hit && st8.msTime >= ion.delay) {
        ion.active = true;
        ion.phi = 0;
        ion.mesh.visible = true;
        ion.mesh.position.set(-0.62, PLANE_Y, 0);
      }
      if (ion.active) {
        ion.phi += (ion.speed / ion.r) * dt;
        if (ion.phi >= Math.PI) {
          ion.phi = Math.PI;
          ion.active = false;
          ion.hit = true;
          ion.mesh.visible = false;
          const zHit = -2 * ion.r;
          const idx = w8ms.ions.indexOf(ion);
          const lbl = w8ms.labels[idx];
          lbl.visible = true;
          lbl.position.set(-0.62, PLANE_Y + 0.14, zHit - 0.22);
          w8ms.flash.visible = true;
          w8ms.flash.position.set(-0.62, PLANE_Y, zHit);
          w8ms.flashT = 0.001;
        } else {
          const cx = -0.62, cz = -ion.r;
          ion.mesh.position.set(cx + Math.sin(ion.phi) * ion.r, PLANE_Y, cz + Math.cos(ion.phi) * ion.r);
          if (ion.tLen < 140) {
            ion.tPos.set([ion.mesh.position.x, PLANE_Y, ion.mesh.position.z], ion.tLen * 3);
            ion.tLen++;
            ion.tGeo.attributes.position.needsUpdate = true;
            ion.tGeo.setDrawRange(0, ion.tLen);
          }
        }
      }
    }
    if (w8ms.flashT > 0) {
      w8ms.flashT += dt;
      const k = w8ms.flashT / 0.5;
      if (k >= 1) { w8ms.flash.visible = false; w8ms.flashT = -1; }
      else w8ms.flash.material.opacity = 0.85 * (1 - k);
    }
  }

  /* 第 8 章：回旋加速器 */
  if (g8cyc.visible && st8c.active) {
    const sub = 3;
    const omega = 2.2 * st8.B;
    for (let s = 0; s < sub; s++) {
      st8c.prevX = st8c.pos.x;
      st8c.vel.applyAxisAngle(UPV, -omega * dt / sub);
      st8c.pos.addScaledVector(st8c.vel, dt / sub);
      if (Math.abs(st8c.pos.x) < 0.14 && ((st8c.prevX > 0) !== (st8c.pos.x > 0))) {
        const sp = st8c.vel.length();
        st8c.vel.multiplyScalar(1 + 0.42 * (st8.U / 600) / (1 + sp / 2.4));
        st8c.crossings++;
        w8c.flashT = 0.14;
      }
    }
    w8c.particle.position.copy(st8c.pos);
    if (w8c.trailLen < TRAIL8) {
      w8c.trailPos.set([st8c.pos.x, st8c.pos.y, st8c.pos.z], w8c.trailLen * 3);
      w8c.trailLen++;
      w8c.trailGeo.attributes.position.needsUpdate = true;
      w8c.trailGeo.setDrawRange(0, w8c.trailLen);
    }
    if (st8c.vel.length() / omega > 1.05) {
      st8c.active = false;
    }
  }
  if (g8cyc.visible && w8c.flashT > 0) {
    w8c.flashT -= dt;
    w8c.gapFlash.material.opacity = Math.max(0, w8c.flashT / 0.14) * 0.75;
  } else if (g8cyc.visible) {
    w8c.gapFlash.material.opacity = 0;
  }

  /* 第 9 章：磁铁插拔 + 检流计 / 导体棒切割 */
  if (g9.visible && st9.mode === 'rod') {
    // 导体棒：恒定拉力 − 安培力（B²L²v/R）→ 收尾速度 v = FR/(B²L²)，E = BLv
    const Fa = (st9r.B * st9r.B * st9r.L * st9r.L * st9r.v) / st9r.R;
    const acc = (st9r.F - Fa) / 0.1;
    st9r.v = clamp(st9r.v + acc * dt, 0, 4);
    st9r.x += st9r.v * dt * 0.4;
    if (st9r.x > 1.0) { st9r.x = 1.0; st9r.v = 0; }
    w9r.rodG.position.x = st9r.x;
    hudsRod.set('e', (st9r.B * st9r.L * st9r.v).toFixed(3) + ' V');
    hudsRod.set('i', ((st9r.B * st9r.L * st9r.v) / st9r.R).toFixed(3) + ' A');
    hudsRod.set('fa', Fa.toFixed(3) + ' N（拉力 ' + st9r.F.toFixed(2) + ' N）');
    hudsRod.set('v', st9r.v.toFixed(2) + ' m/s → 收尾 ' + ((st9r.F * st9r.R) / (st9r.B * st9r.B * st9r.L * st9r.L)).toFixed(2) + ' m/s');
  } else if (g9.visible) {
    let vx = 0;
    if (st9.anim) {
      vx = st9.animDir * st9.speed * 0.85;
      st9.magX += vx * dt;
      if (st9.animDir < 0 && st9.magX <= 0.18) { st9.magX = 0.18; st9.anim = false; vx = 0; }
      if (st9.animDir > 0 && st9.magX >= 2.4) { st9.magX = 2.4; st9.anim = false; vx = 0; }
    }
    st9.emf = st9.anim ? emf9(vx) : st9.emf * Math.max(0, 1 - dt * 4);
    w9.magnet.position.set(st9.magX, PLANE_Y, 0);
    const needle = clamp(st9.emf / 900, -1, 1);
    st9.needle = needle;
    drawGalv(needle);
    if (w9.galvNeedle) w9.galvNeedle.rotation.z = -needle * 0.85;   /* 3D 表针与浮窗同步偏转 */
    const s = needle > 0.05 ? 1 : needle < -0.05 ? -1 : 0;
    if (st9.showArrows && s !== 0) {
      w9.curArrows.visible = true;
      for (let k = 0; k < 4; k++) {
        const a = (k / 4) * TAU + 0.4;
        const cone = w9.curArrows.children[k];
        cone.position.set(0, Math.sin(a) * 0.46, Math.cos(a) * 0.46);
        _idv.set(0, -Math.sin(a) * s, Math.cos(a) * s);
        cone.quaternion.setFromUnitVectors(UPV, _idv);
      }
    } else {
      w9.curArrows.visible = false;
    }
  }

  /* 第 10 章：发电机 */
  if (g10.visible) {
    st10.theta += TAU * st10.n * dt;
    w10.coilG.rotation.z = st10.theta;
    const Em = st10.Nt * st10.B * 0.02 * TAU * st10.n;
    const e = Em * Math.sin(st10.theta);
    const eN = Em > 1e-6 ? e / Em : 0;
    w10.bulbMat.emissiveIntensity = st10.bulb ? Math.abs(eN) * 1.9 : 0;
    w10.filamentMat.emissiveIntensity = st10.bulb ? Math.abs(eN) * 2.2 : 0;
    w10.bulbGlow.material.opacity = st10.bulb ? Math.abs(eN) * 0.85 : 0;
    drawWave(eN);
  }

  /* 第 11 章：沙盒粒子（F = qE + qv×B，半隐式积分） */
  if (g11.visible) {
    for (const p of w11.parts) {
      if (!p.active) continue;
      const list = cf2.charges.map((c) => ({ q: c.q, pos: { x: c.mesh.position.x, z: c.mesh.position.z } }));
      const sub = 3;
      for (let s = 0; s < sub; s++) {
        const ev = fieldVec2D(p.mesh.position.x, p.mesh.position.z, list);
        const ex = ev ? ev[0] * 0.45 : 0;
        const ez = ev ? ev[1] * 0.45 : 0;
        const B = st11.Bon ? st11.B : 0;
        const vx = p.vel.x, vz = p.vel.z;
        // a = (qE + qv×B)/m，电荷与质量按粒子类型取值
        const ax = (p.q * (ex - vz * B)) / p.mm;
        const az = (p.q * (ez + vx * B)) / p.mm;
        p.vel.x += ax * dt / sub;
        p.vel.z += az * dt / sub;
        p.mesh.position.x += p.vel.x * dt / sub;
        p.mesh.position.z += p.vel.z * dt / sub;
      }
      if (p.tLen < w11.TRP) {
        p.tPos.set([p.mesh.position.x, PLANE_Y, p.mesh.position.z], p.tLen * 3);
        p.tLen++;
        p.tGeo.attributes.position.needsUpdate = true;
        p.tGeo.setDrawRange(0, p.tLen);
      }
      if (Math.abs(p.mesh.position.x) > 3.3 || Math.abs(p.mesh.position.z) > 2.8) {
        p.active = false;
        p.mesh.visible = false;
      }
    }
  }

  /* HUD 刷新 */
  if (g1.visible) {
    huds[0].set('cfg', st1.cfg === 'single' ? '单个正电荷' : st1.cfg === 'pair-opp' ? '等量异号' : '等量同号');
    huds[0].set('lines', String(st1.lines) + ' 条');
    huds[0].set('drag', '按住电荷拖动');
  } else if (g2.visible) {
    const a = st2.anim;
    huds[1].set('f', (st2.q * st2.E).toFixed(1) + ' mN');
    huds[1].set('w', a ? a.W.toFixed(2) + ' mJ' : '点击「移动」');
    huds[1].set('ep', a ? '−' + a.W.toFixed(2) + ' mJ' : '−W');
    huds[1].set('note', st2.path === 'along' ? '顺着场线（直线）' : st2.path === 'against' ? '逆着场线' : st2.path === 'bent' ? '折线：先平移再顺场线' : '垂直场线');
  } else if (g3.visible) {
    huds[2].set('e', capE().toFixed(1) + ' V/mm');
    huds[2].set('u', capU().toFixed(0) + ' V');
    huds[2].set('c', capC().toFixed(2) + ' pF');
    huds[2].set('note', st3.mode === 'U'
      ? 'U 不变：d↑ → C↓、Q=CU↓、E=U/d↓'
      : 'Q 不变：d↑ → C↓、U=Q/C↑（静电计偏角大）、E 不变');
  } else if (g4.visible) {
    huds[3].set('u1', st4.U1.toFixed(1) + ' kV');
    huds[3].set('uy', (st4.Uy * st4.gain).toFixed(0) + ' %');
    huds[3].set('dy', (sig4(time) * 10).toFixed(1) + ' 格（∝U₂/U₁）');
    huds[3].set('sw', st4.sweep ? '开（正弦波形）' : '关（竖直亮线）');
  } else if (g5.visible) {
    huds[4].set('cfg', st5.cfg === 'single' ? '单条形磁铁' : st5.cfg === 'wire' ? '通电直导线（安培定则）' : '双磁铁同极相对');
    huds[4].set('dir', st5.cfg === 'wire' ? (st5.wireDir > 0 ? '逆时针（俯视）' : '顺时针（俯视）') : st5.flip ? '已翻转（N/S 互换）' : 'N 出 S 入');
    huds[4].set('note', st5.cfg === 'wire' ? 'B = μ₀I/(2πr) ∝ 1/r' : st5.filings ? '铁屑开（右下角）' : '铁屑关');
  } else if (g6.visible) {
    const F = st6.B * st6.I * st6.L;
    huds[5].set('f', F.toFixed(2) + ' N');
    huds[5].set('dir', F < 0.01 ? '—' : (st6.dir > 0 ? '−z 方向' : '+z 方向'));
    huds[5].set('v', Math.abs(st6.v).toFixed(2) + ' 格/s');
  } else if (g7.visible) {
    const w7om = (0.9 * st7.q * st7.B) / st7.m;
    const T7 = Math.abs(TAU / w7om);
    huds[6].set('r', ((st7.m * st7.v * Math.cos((st7.alpha * Math.PI) / 180)) / (Math.abs(st7.q) * st7.B)).toFixed(2) + '（相对）');
    huds[6].set('t', T7.toFixed(2) + '（相对，与 v 无关）');
    huds[6].set('pitch', st7.alpha > 0 ? (st7.v * Math.sin((st7.alpha * Math.PI) / 180) * T7).toFixed(2) : '—（α=0）');
    huds[6].set('st', st7.active ? (st7.alpha > 0 ? '螺旋线运动中' : '圆周运动中') : '已停止');
  } else if (g8ms.visible) {
    huds[7].set('r', msRadiusText());
    huds[7].set('law', 'r∝√m · √U · 1/B');
    huds[7].set('st', st8.msTime > 0 && st8.msTime < 3 ? '离子飞行中…' : '待发射');
  } else if (g8cyc.visible) {
    const mKg = 12 * 1.66e-27;
    const T = (TAU * mKg) / (1.6e-19 * st8.B) * 1e6;
    const Rcyc = 1.15 / 26;   // D 形盒视觉半径对应的物理半径（与离子轨迹缩放一致）
    const EkkeV = ((1.6e-19 * st8.B * Rcyc) ** 2) / (2 * mKg) / 1.6e-22;
    huds[8].set('t', T.toFixed(2) + ' μs（恒定）');
    huds[8].set('n', st8c.crossings + ' 次（n = Ek/qU）');
    huds[8].set('ek', EkkeV.toFixed(1) + ' keV（与 U 无关）');
    huds[8].set('st', st8c.active ? '螺旋加速中' : st8c.crossings > 0 ? '达到能量上限引出' : '待发射');
  } else if (g9.visible) {
    const nd = st9.needle || 0;
    huds[9].set('flux', st9.anim ? (st9.animDir < 0 ? '增大（插入）' : '减小（拔出）') : '不变（静止）');
    huds[9].set('emf', Math.abs(nd) < 0.02 ? '0' : (Math.abs(nd) * 100).toFixed(0) + '（相对）');
    huds[9].set('cur', Math.abs(nd) < 0.02 ? '无' : nd > 0 ? '正向（拔出）' : '反向（插入）');
  } else if (g10.visible) {
    const Em = st10.Nt * st10.B * 0.02 * TAU * st10.n;
    huds[10].set('em', Em.toFixed(1) + ' V');
    huds[10].set('f', st10.n.toFixed(1) + ' Hz');
    huds[10].set('rms', (Em / Math.SQRT2).toFixed(1) + ' V');
    huds[10].set('e', (Em * Math.sin(st10.theta)).toFixed(1) + ' V');
  } else if (g11.visible) {
    huds[11].set('n', cf2.charges.length + ' / 8');
    huds[11].set('b', st11.Bon ? '开 · B=' + st11.B.toFixed(1) : '关');
    huds[11].set('p', w11.parts.filter((p) => p.active).length + ' / 4');
  }
});

/* ---------------- 章节切换与控件 ---------------- */

const ctl = createControlsPanel(document.getElementById('controls'));
let activeSectionCleanup = null;

/* 第 9 章控件：按模式（磁铁插拔 / 导体棒切割）重建 */
function buildControls9() {
  ctl.clear();
  ctl.seg({
    options: [{ label: '磁铁插拔线圈', value: 'magnet' }, { label: '导体棒切割', value: 'rod' }],
    value: st9.mode,
    onChange: (v) => {
      st9.mode = v;
      applyMode9();
      if (v === 'rod') { st9r.v = 0; st9r.x = -0.7; w9r.rodG.position.x = -0.7; showHud('rod'); }
      else showHud(9);
      buildControls9();
    },
  });
  ctl.sep();
  if (st9.mode === 'magnet') {
    ctl.seg({
      options: [{ label: '插入', value: 'insert' }, { label: '拔出', value: 'pull' }, { label: '静止', value: 'still' }],
      value: 'still',
      onChange: (v) => {
        if (v === 'insert' && st9.magX <= 0.19) st9.magX = 2.4;
        if (v === 'pull' && st9.magX >= 2.39) st9.magX = 0.18;
        setAction9(v);
      },
    });
    ctl.sep();
    ctl.slider({
      label: '磁铁速度', min: 0.5, max: 3, step: 0.1, value: st9.speed,
      fmt: (v) => '×' + v.toFixed(1),
      onInput: (v) => { st9.speed = v; },
    });
    ctl.slider({
      label: '线圈匝数 N', min: 6, max: 18, step: 1, value: st9.N,
      fmt: (v) => v + ' 匝',
      onInput: (v) => { st9.N = v; applyCoilTurns(); },
    });
    ctl.toggle({
      label: '显示感应电流方向', value: st9.showArrows,
      onChange: (v) => { st9.showArrows = v; },
    });
  } else {
    ctl.slider({
      label: '拉力 F', min: 0.02, max: 0.4, step: 0.01, value: st9r.F,
      fmt: (v) => v.toFixed(2) + ' N',
      onInput: (v) => { st9r.F = v; },
    });
    ctl.slider({
      label: '磁感应强度 B', min: 0.2, max: 1, step: 0.05, value: st9r.B,
      fmt: (v) => v.toFixed(2) + ' T',
      onInput: (v) => { st9r.B = v; applyMode9(); },
    });
    ctl.slider({
      label: '导轨间距 L', min: 0.4, max: 1.2, step: 0.05, value: st9r.L,
      fmt: (v) => v.toFixed(2) + ' m',
      onInput: (v) => { st9r.L = v; },
    });
    ctl.slider({
      label: '回路电阻 R', min: 0.5, max: 5, step: 0.1, value: st9r.R,
      fmt: (v) => v.toFixed(1) + ' Ω',
      onInput: (v) => { st9r.R = v; },
    });
    ctl.sep();
    ctl.button({
      label: '↺ 复位导体棒',
      onClick: () => { st9r.v = 0; st9r.x = -0.7; w9r.rodG.position.x = -0.7; },
    });
  }
}

function hideAllChapters() {
  [g1, g2, g3, g4, g5, g6, g7, g8ms, g8cyc, g9, g10, g11].forEach((g) => { g.visible = false; });
  clearCorners();
  if (w5.filingsCv) w5.filingsCv = null;
  if (w9.galvCv) w9.galvCv = null;
  if (w10.waveCv) w10.waveCv = null;
  setHint(null);
  showHud(-1);
  dragField = null;
  onSelectCharge = null;
  st2.anim = null;
  st7.active = false;
  st8c.active = false;
}

const SECTIONS = [
  {
    title: '电场线与等势面',
    html: `<p><b>电场线</b>从正电荷出发、到负电荷终止（或伸向无穷远），<span class="hl">不闭合、不相交</span>；线的疏密表示场强强弱——电荷附近最密、场最强。点电荷场强 E = kQ/r²。</p>
<p>拖动任意电荷试试：电场线会实时重新计算。切换「等量异号 / 等量同号」对比场线形状：异号电荷的线<span class="hl">从一个直接连到另一个</span>，同号电荷的线<b>相互排斥</b>、中间出现「真空」区。</p>
<p><b>等势线</b>（蓝色）按合成电场的电势 φ = ΣkQ/r（标量直接相加）绘出，<span class="hl">处处与电场线垂直</span>；沿电场线方向电势降低，沿等势线移动电荷电场力不做功。异号电荷对的中垂线就是 φ=0 的等势线。</p>`,
    enter() {
      hideAllChapters();
      g1.visible = true;
      dragField = cf1;
      cf1.opts.showLines = true;
      cf1.opts.showEquip = false;
      setCfg1(st1.cfg);
      app.setCamera([0.4, 3.4, 4.4], [0, 1.05, 0]);
      showHud(0);
      ctl.clear();
      ctl.seg({
        options: [
          { label: '单个正电荷', value: 'single' },
          { label: '等量异号', value: 'pair-opp' },
          { label: '等量同号', value: 'pair-same' },
        ],
        value: st1.cfg,
        onChange: (v) => setCfg1(v),
      });
      ctl.sep();
      ctl.slider({
        label: '电荷量（场线密度）', min: 8, max: 20, step: 1, value: st1.lines,
        fmt: (v) => v + ' 条',
        onInput: (v) => {
          st1.lines = v;
          for (const c of cf1.charges) c.lines = v;
          cf1.dirty = true;
        },
      });
      ctl.toggle({
        label: '显示电场线', value: true,
        onChange: (v) => { cf1.opts.showLines = v; cf1.force = true; },
      });
      ctl.toggle({
        label: '显示等势面', value: false,
        onChange: (v) => { cf1.opts.showEquip = v; cf1.force = true; },
      });
    },
  },
  {
    title: '电场力做功与电势能',
    html: `<p>两块平行板间是<span class="hl">匀强电场</span>（箭头均匀、方向一致，E=U/d）。试探电荷（正）受恒定电场力 F=qE，电场力做功 <span class="hl">W=qU=qEd</span>。</p>
<p>关键性质：W <b>只与起点、终点有关，与路径无关</b>——和重力做功一样，所以才能定义电势能 E<sub>p</sub>=qφ：电场力做正功，电势能减少；做负功，电势能增加。选「折线路径」先沿等势面平移（W=0）再顺场线走，与直接走做功相同。</p>
<p>顺着场线 W＞0 电势能减小；逆着场线 W＜0 电势能增大；垂直场线 W=0（沿等势面移动）。点「移动」看动画，HUD 实时累计做功。</p>`,
    enter() {
      hideAllChapters();
      g2.visible = true;
      resetProbe();
      app.setCamera([1.6, 2.2, 3.6], [0, 1.05, 0]);
      showHud(1);
      ctl.clear();
      ctl.seg({
        options: [
          { label: '顺着场线', value: 'along' },
          { label: '逆着场线', value: 'against' },
          { label: '垂直场线', value: 'perp' },
          { label: '折线路径', value: 'bent' },
        ],
        value: st2.path,
        onChange: (v) => { st2.path = v; resetProbe(); },
      });
      ctl.sep();
      ctl.slider({
        label: '移动距离 d', min: 0.2, max: 1.6, step: 0.1, value: st2.d,
        fmt: (v) => v.toFixed(1) + ' m',
        onInput: (v) => { st2.d = v; if (!st2.anim) resetProbe(); },
      });
      ctl.slider({
        label: '电荷量 q', min: 0.5, max: 4, step: 0.1, value: st2.q,
        fmt: (v) => v.toFixed(1) + ' μC',
        onInput: (v) => { st2.q = v; },
      });
      ctl.slider({
        label: '场强 E', min: 1, max: 8, step: 0.5, value: st2.E,
        fmt: (v) => v.toFixed(1) + ' kV/m',
        onInput: (v) => { st2.E = v; },
      });
      ctl.sep();
      const moveBtn = ctl.button({
        label: '▶ 移动',
        onClick: () => {
          const s = probeStart();
          const to = (s.via ? s.via.clone() : s.p.clone()).addScaledVector(s.dir, st2.d);
          w2.probe.position.copy(s.p);
          st2.anim = { t: 0, from: s.p, to, via: s.via || null, W: 0, done: false };
        },
      });
      ctl.button({ label: '↺ 复位', onClick: () => resetProbe() });
      void moveBtn;
    },
  },
  {
    title: '平行板电容器',
    html: `<p>平行板电容器电容 <span class="hl">C = ε<sub>r</sub>ε<sub>0</sub>S / d</span>：正对面积 S 越大、板距 d 越小、插入介质（ε<sub>r</sub>↑）电容越大。C 只由构造决定，与是否带电无关。</p>
<p><b>充电后断开电源（Q 不变）</b>：由 U = Q/C，增大 d、减小 S 或抽出介质 → C 变小 → <b>U 变大（静电计偏角变大）</b>，而板间场强 E = Q/(ε<sub>r</sub>ε<sub>0</sub>S) <b>与 d 无关</b>。</p>
<p><b>始终接电源（U 不变）</b>：改变 d 时 Q = CU 和 E = U/d 都随之变化。两种模式切换对比；记录多组 (C, 1/d)，C–1/d 图像是一条过原点的直线。</p>`,
    enter() {
      hideAllChapters();
      g3.visible = true;
      applyCap();
      app.setCamera([2.2, 1.8, 3.2], [0, 1.05, 0]);
      showHud(2);
      ctl.clear();
      ctl.seg({
        options: [{ label: '接电源（U 不变）', value: 'U' }, { label: '充电后断开（Q 不变）', value: 'Q' }],
        value: st3.mode,
        onChange: (v) => { st3.mode = v; applyCap(); },
      });
      ctl.sep();
      ctl.slider({
        label: '电压 U（U 不变模式）', min: 0, max: 500, step: 10, value: st3.U,
        fmt: (v) => v.toFixed(0) + ' V',
        onInput: (v) => { st3.U = v; applyCap(); },
      });
      ctl.slider({
        label: '电荷量 Q（Q 不变模式）', min: 0.5, max: 5, step: 0.1, value: st3.Q,
        fmt: (v) => v.toFixed(1) + ' nC',
        onInput: (v) => { st3.Q = v; applyCap(); },
      });
      ctl.slider({
        label: '板距 d', min: 2, max: 20, step: 1, value: st3.d,
        fmt: (v) => v.toFixed(0) + ' mm',
        onInput: (v) => { st3.d = v; applyCap(); },
      });
      ctl.slider({
        label: '正对面积 S', min: 20, max: 200, step: 5, value: st3.S,
        fmt: (v) => v.toFixed(0) + ' cm²',
        onInput: (v) => { st3.S = v; applyCap(); },
      });
      ctl.seg({
        options: DIELECTRICS.map((dd) => ({ label: dd.name, value: dd.name })),
        value: '空气',
        onChange: (name) => { st3.eps = DIELECTRICS.find((dd) => dd.name === name).eps; applyCap(); },
      });
      ctl.toggle({
        label: '显示电场箭头', value: st3.show,
        onChange: (v) => { st3.show = v; applyCap(); },
      });
    },
  },
  {
    title: '示波管',
    html: `<p>阴极被灯丝加热发射电子，经加速电压 U₁ 加速（eU₁ = ½mv₀²），穿过 <b>YY′ 竖直偏转板</b>做<b>类平抛运动</b>，出板后匀速直线上屏——看起来像从偏转板中点沿直线射出。偏移量 <span class="hl">y = U₂L²/(4dU₁)</span>：与 U₂ 成正比、与 U₁ 成反比（偏转灵敏度 Y/U₂ ∝ 1/U₁）。</p>
<p><b>扫描开</b>：XX′ 板加锯齿扫描电压，光点从左到右匀速扫过，屏上画出<span class="hl">信号的正弦波形</span>——这就是示波器测电压的原理；<b>扫描关</b>：屏上是一条竖直亮线。</p>
<p>调 U₂ 看幅度、调 U₁ 看灵敏度、调频率看波形疏密。</p>`,
    enter() {
      hideAllChapters();
      g4.visible = true;
      app.setCamera([2.5, 1.85, 3.4], [0, 1.06, -0.4]);
      showHud(3);
      ctl.clear();
      ctl.slider({
        label: '加速电压 U₁', min: 0.5, max: 3, step: 0.1, value: st4.U1,
        fmt: (v) => v.toFixed(1) + ' kV',
        onInput: (v) => { st4.U1 = v; },
      });
      ctl.slider({
        label: '信号电压 U₂（幅度）', min: 0, max: 100, step: 5, value: st4.Uy,
        fmt: (v) => v.toFixed(0) + '%',
        onInput: (v) => { st4.Uy = v; },
      });
      ctl.slider({
        label: '信号频率', min: 0.3, max: 4, step: 0.1, value: st4.freq,
        fmt: (v) => v.toFixed(1) + ' Hz',
        onInput: (v) => { st4.freq = v; },
      });
      ctl.slider({
        label: '增益', min: 0.5, max: 3, step: 0.1, value: st4.gain,
        fmt: (v) => '×' + v.toFixed(1),
        onInput: (v) => { st4.gain = v; },
      });
      ctl.toggle({
        label: '扫描', value: st4.sweep,
        onChange: (v) => { st4.sweep = v; },
      });
      ctl.button({
        label: '↺ 清屏',
        onClick: () => { w4.scrCtx.fillStyle = '#04140a'; w4.scrCtx.fillRect(0, 0, 256, 256); },
      });
    },
  },
  {
    title: '磁感线',
    html: `<p>玻璃板上撒铁屑、轻敲，铁屑沿磁场方向排成曲线——这就是<b>磁感线</b>的显示方法。条形磁铁的磁感线从 N 极出来、回到 S 极（磁体内部从 S 到 N，构成<span class="hl">闭合曲线</span>）。</p>
<p>电流也能产生磁场（<b>奥斯特实验</b>）。<b>通电直导线</b>的磁感线是一圈圈同心圆，B = <span class="hl">μ₀I/(2πr) ∝ 1/r</span>，方向用<b>安培定则</b>（右手螺旋）判断：拇指指电流，四指环绕方向即磁感线方向。通电<b>螺线管</b>的外磁场与条形磁铁相似，内部近似匀强。切到「通电直导线」模式，反转电流方向看磁感线整体反向。</p>
<p>切换「双磁铁·同极相对」看中间的<span class="hl">排斥区</span>：两束磁感线互不相交、彼此推开。</p>`,
    enter() {
      hideAllChapters();
      g5.visible = true;
      applyMagnet();
      app.setCamera([0.3, 3.6, 3.6], [0, 1.0, 0]);
      showHud(4);
      ctl.clear();
      ctl.seg({
        options: [
          { label: '单磁铁', value: 'single' },
          { label: '双磁铁·同极相对', value: 'double' },
          { label: '通电直导线', value: 'wire' },
        ],
        value: st5.cfg,
        onChange: (v) => { st5.cfg = v; applyMagnet(); },
      });
      ctl.toggle({
        label: '磁极翻转（磁铁模式）', value: st5.flip,
        onChange: (v) => { st5.flip = v; applyMagnet(); },
      });
      ctl.toggle({
        label: '电流反向（直导线模式）', value: false,
        onChange: (v) => { st5.wireDir = v ? -1 : 1; applyMagnet(); },
      });
      ctl.toggle({
        label: '铁屑窗（俯视）', value: st5.filings,
        onChange: (v) => {
          st5.filings = v;
          if (!v && w5.filingsCv) { w5.filingsCv.win.remove(); w5.filingsCv = null; cornerWins.length = 0; }
          if (v) drawFilings();
        },
      });
      ctl.toggle({
        label: '显示磁感线', value: cf5.opts.showLines,
        onChange: (v) => { cf5.opts.showLines = v; cf5.force = true; },
      });
      setHint(['铁屑窗 = 俯视的磁场分布', '直导线模式：B ∝ 1/r，方向由安培定则确定']);
    },
  },
  {
    title: '安培力',
    html: `<p>磁场中的通电导体受<span class="hl">安培力 F=BIL</span>。蹄形磁铁 N 上 S 下（磁场竖直向下），导体棒电流沿棒流动——棒沿导轨滑动。</p>
<p><b>左手定则</b>：伸开左手，让磁场穿过掌心（掌心朝上），四指指向电流方向，拇指所指就是安培力方向。切换电流方向，棒立刻反向滑动。</p>
<p>调大 I、B、L 任一个，F 都变大、加速更猛。F=BIL 用国际单位制实时计算。</p>`,
    enter() {
      hideAllChapters();
      g6.visible = true;
      st6.z = 0; st6.v = 0;
      w6.rodG.position.z = 0;
      applyAmpereArrows();
      app.setCamera([1.7, 2.3, 3.4], [0, 1.05, 0]);
      showHud(5);
      setHint([
        '左手定则：磁场垂直穿入掌心（此处掌心朝上）',
        '四指指向电流方向（绿色箭头）',
        '拇指即安培力方向（棒的滑动方向）',
      ]);
      ctl.clear();
      ctl.slider({
        label: '电流 I', min: 0, max: 3, step: 0.1, value: st6.I,
        fmt: (v) => v.toFixed(1) + ' A',
        onInput: (v) => { st6.I = v; },
      });
      ctl.slider({
        label: '磁感应强度 B', min: 0.2, max: 1.5, step: 0.1, value: st6.B,
        fmt: (v) => v.toFixed(1) + ' T',
        onInput: (v) => { st6.B = v; applyAmpereArrows(); },
      });
      ctl.slider({
        label: '导体棒长度 L', min: 0.4, max: 1.2, step: 0.05, value: st6.L,
        fmt: (v) => v.toFixed(2) + ' m',
        onInput: (v) => { st6.L = v; applyAmpereArrows(); },
      });
      ctl.seg({
        options: [{ label: '电流 A→B', value: 'fwd' }, { label: '电流 B→A', value: 'rev' }],
        value: st6.dir > 0 ? 'fwd' : 'rev',
        onChange: (v) => {
          st6.dir = v === 'fwd' ? 1 : -1;
          st6.v = 0;
          applyAmpereArrows();
        },
      });
      ctl.sep();
      ctl.button({
        label: '↺ 复位导体棒',
        onClick: () => { st6.z = 0; st6.v = 0; },
      });
    },
  },
  {
    title: '洛伦兹力',
    html: `<p>磁场里的运动带电粒子受<span class="hl">洛伦兹力 F=qv×B</span>——它始终与速度垂直，<b>只改变方向、不做功</b>，所以粒子做匀速圆周运动。</p>
<p>半径 <b>r=mv/qB</b>：v 越大 r 越大，B 越强 r 越小；周期 <b>T=2πm/qB</b> 与 v 无关。切换电荷正负，旋转方向立刻相反（蓝箭头为竖直向上的匀强磁场）。</p>
<p>把「倾角 α」调大（电子枪不再垂直磁场射入）：平行于 B 的速度分量不受力，粒子一边做圆周运动一边沿磁场方向匀速前进——径迹变成<span class="hl">螺旋线</span>，螺距 = v<sub>∥</sub>·T。</p>
<p>点「发射」观察轨迹尾迹；粒子飞出场区说明 r 太大——调小 v 或增大 B。</p>`,
    enter() {
      hideAllChapters();
      g7.visible = true;
      st7.active = false;
      w7.trailLen = 0;
      w7.trailGeo.setDrawRange(0, 0);
      w7.particle.position.set(-0.9, PLANE_Y, 0);
      app.setCamera([0.2, 3.8, 3.0], [0, 1.0, 0]);
      showHud(6);
      ctl.clear();
      ctl.slider({
        label: '速率 v', min: 0.5, max: 3, step: 0.1, value: st7.v,
        fmt: (v) => v.toFixed(1),
        onInput: (v) => { st7.v = v; },
      });
      ctl.slider({
        label: '磁感应强度 B', min: 0.2, max: 1.5, step: 0.1, value: st7.B,
        fmt: (v) => v.toFixed(1) + ' T',
        onInput: (v) => { st7.B = v; },
      });
      ctl.slider({
        label: '质量 m', min: 0.5, max: 2, step: 0.1, value: st7.m,
        fmt: (v) => v.toFixed(1),
        onInput: (v) => { st7.m = v; },
      });
      ctl.slider({
        label: '电子枪倾角 α（0=垂直 B）', min: 0, max: 50, step: 5, value: st7.alpha,
        fmt: (v) => v.toFixed(0) + '°',
        onInput: (v) => { st7.alpha = v; },
      });
      ctl.seg({
        options: [{ label: '正电荷', value: 'pos' }, { label: '负电荷', value: 'neg' }],
        value: st7.q > 0 ? 'pos' : 'neg',
        onChange: (v) => { st7.q = v === 'pos' ? 1 : -1; },
      });
      ctl.sep();
      ctl.button({ label: '● 发射', onClick: () => launch7() });
      ctl.button({
        label: '↺ 清除轨迹',
        onClick: () => { w7.trailLen = 0; w7.trailGeo.setDrawRange(0, 0); },
      });
      setHint(['α=0：圆周运动；α>0：平行 B 的分量不受力 → 螺旋线']);
    },
  },
  {
    title: '质谱仪与回旋加速器',
    html: `<p><b>质谱仪</b>：离子经电压 U 加速（qU = ½mv²）后进入偏转磁场做半圆运动打在感光屏上：<span class="hl">r = mv/(qB) = √(2mU/q)/B</span>。电荷量相同的同位素质量越大半径越大，r₁:r₂ = √m₁:√m₂，按质荷比分成一条条<b>谱线</b>——阿斯顿就是这样发现了氖的同位素。</p>
<p><b>回旋加速器</b>：粒子每经过 D 形盒缝隙被加速一次，半径螺旋增大，但<span class="hl">周期 T=2πm/qB 恒定</span>（与速率无关），交变电压频率不用变。最终动能 <span class="hl">E<sub>k</sub> = q²B²R²/(2m)</span> 只取决于 B 和 D 形盒半径 R，<b>与加速电压 U 无关</b>——U 越大加速次数 n = E<sub>k</sub>/(qU) 越少，但最终能量一样。</p>
<p>调加速电压 U 与磁场 B，看两种装置里半径/圈数如何变化。</p>`,
    enter() {
      hideAllChapters();
      st8.mode = st8.mode || 'ms';
      const applyMode = (m) => {
        st8.mode = m;
        g8ms.visible = m === 'ms';
        g8cyc.visible = m === 'cyc';
        if (m === 'ms') {
          applyMSArrows();
          launchMS();
          app.setCamera([0.6, 2.6, 3.6], [0.3, 1.0, -0.7]);
        } else {
          app.setCamera([0.3, 3.6, 3.0], [0, 1.0, 0]);
        }
      };
      g8ms.visible = false; g8cyc.visible = false;
      applyMode(st8.mode);
      showHud(st8.mode === 'ms' ? 7 : 8);
      ctl.clear();
      ctl.seg({
        options: [{ label: '质谱仪', value: 'ms' }, { label: '回旋加速器', value: 'cyc' }],
        value: st8.mode,
        onChange: (v) => {
          applyMode(v);
          showHud(v === 'ms' ? 7 : 8);
        },
      });
      ctl.sep();
      ctl.slider({
        label: '加速电压 U', min: 200, max: 1200, step: 20, value: st8.U,
        fmt: (v) => v.toFixed(0) + ' V',
        onInput: (v) => {
          st8.U = v;
          if (st8.mode === 'ms') launchMS();
        },
      });
      ctl.slider({
        label: '磁场 B', min: 0.3, max: 1, step: 0.05, value: st8.B,
        fmt: (v) => v.toFixed(2) + ' T',
        onInput: (v) => {
          st8.B = v;
          if (st8.mode === 'ms') { applyMSArrows(); launchMS(); }
        },
      });
      ctl.sep();
      ctl.button({
        label: '● 发射',
        onClick: () => { if (st8.mode === 'ms') launchMS(); else launchCyc(); },
      });
    },
  },
  {
    title: '电磁感应与楞次定律',
    html: `<p>穿过闭合回路的<b>磁通量</b>发生变化，回路中就产生感应电流——<b>电磁感应</b>（法拉第）。感应电动势 <span class="hl">E = N·ΔΦ/Δt</span>：磁铁插入与拔出，检流计偏转方向相反；静止时磁通不变、无电流；插拔越快，偏转越大。</p>
<p><b>楞次定律</b>：感应电流的磁场总要<b>阻碍</b>磁通变化（增反减同，力学效果即「来拒去留」）——它是能量守恒的体现：插拔磁铁都要克服感应磁场力做功，机械能转化为电能。</p>
<p><b>导体棒切割</b>模式：棒在磁场中切割磁感线，<span class="hl">E = BLv</span>，感应电流使棒受到与运动方向相反的安培力 F = B²L²v/R；恒定拉力下棒最终<b>匀速</b>运动（收尾速度 v = FR/(B²L²)）。</p>`,
    enter() {
      hideAllChapters();
      g9.visible = true;
      st9.magX = 2.4;
      st9.anim = false;
      st9.emf = 0;
      w9.magnet.position.set(2.4, PLANE_Y, 0);
      applyCoilTurns();
      st9.mode = 'magnet';
      st9r.v = 0; st9r.x = -0.7;
      applyMode9();
      app.setCamera([2.4, 2.0, 3.4], [0.2, 1.05, 0]);
      showHud(9);
      setHint(['楞次定律口诀：增反减同 · 来拒去留']);
      buildControls9();
    },
  },
  {
    title: '交流发电机',
    html: `<p>矩形线圈在磁场中匀速转动，从中性面开始计时产生正弦交流电：<span class="hl">e = E<sub>m</sub>·sin ωt，E<sub>m</sub> = NBSω</span>。</p>
<p>线圈平面与磁场垂直的位置叫<b>中性面</b>：此时磁通<b>最大</b>但变化率为零——e=0、电流换向（每经过中性面一次，电流方向改变一次）；线圈平面与磁场平行时 e 最大。</p>
<p>正弦交流电的<b>有效值</b> E = E<sub>m</sub>/√2 ≈ 0.707E<sub>m</sub>：让交流与直流通过相同电阻、相同时间内发热相等——<b>交流电表读数、用电器铭牌电压都是有效值</b>。</p>
<p>右下角波形窗实时滚动 e(t)。调「转速 n」：转速加倍 → 频率 f=n 加倍、峰值 Em=NBSω 也加倍。灯泡亮度随 |e| 闪烁。</p>`,
    enter() {
      hideAllChapters();
      g10.visible = true;
      st10.theta = 0;
      applyGenArrows();
      app.setCamera([2.4, 2.0, 3.4], [0.2, 1.05, 0]);
      showHud(10);
      ctl.clear();
      ctl.slider({
        label: '转速 n', min: 0.3, max: 3, step: 0.1, value: st10.n,
        fmt: (v) => v.toFixed(1) + ' r/s',
        onInput: (v) => { st10.n = v; applyGenArrows(); },
      });
      ctl.slider({
        label: '磁感应强度 B', min: 0.3, max: 1.5, step: 0.1, value: st10.B,
        fmt: (v) => v.toFixed(1) + ' T',
        onInput: (v) => { st10.B = v; applyGenArrows(); },
      });
      ctl.slider({
        label: '匝数 N', min: 5, max: 20, step: 1, value: st10.Nt,
        fmt: (v) => v + ' 匝',
        onInput: (v) => { st10.Nt = v; },
      });
      ctl.toggle({
        label: '灯泡接入', value: st10.bulb,
        onChange: (v) => { st10.bulb = v; },
      });
    },
  },
  {
    title: '自由实验',
    html: `<p>电荷沙盒：<b>添加正/负电荷</b>（最多 8 个），<span class="hl">点击选中、按住拖动</span>，电场线实时重算；「删除选中」「清空」整理台面。试试让电子绕着正电荷转圈。</p>
<p>选择粒子类型（<b>电子 / 质子 / α 粒子</b>，电荷与质量不同）后「发射」：粒子在<span class="hl">合场</span>中按 F = qE + qv×B 运动（慢镜头）——开启匀强磁场后，质子在磁场里转半圈又回来，电子则反向打转。</p>
<p>粒子最多同时 4 个，飞出场区自动消失。</p>`,
    enter() {
      hideAllChapters();
      g11.visible = true;
      dragField = cf2;
      onSelectCharge = (c) => selectCharge11(c);
      cf2.opts.showLines = true;
      cf2.opts.showEquip = false;
      clearSelection11();
      cf2.clearCharges();
      w11.parts.forEach((p) => { p.active = false; p.mesh.visible = false; p.tGeo.setDrawRange(0, 0); p.tLen = 0; });
      cf2.addCharge(1, -1.1, 0);
      cf2.addCharge(-1, 1.1, 0);
      cf2.force = true;
      app.setCamera([0.3, 3.5, 4.2], [0, 1.05, 0]);
      showHud(11);
      setHint(['点击电荷可选中，按住拖动可移动', '粒子受 qE + qv×B 合力（蓝箭头=竖直磁场，慢放播放）']);
      ctl.clear();
      ctl.button({ label: '＋ 添加正电荷', onClick: () => { addSandboxCharge(1); } });
      ctl.button({ label: '－ 添加负电荷', onClick: () => { addSandboxCharge(-1); } });
      ctl.button({
        label: '🗑 删除选中',
        onClick: () => removeSelectedCharge11(),
      });
      ctl.button({ label: '✕ 清空电荷', onClick: () => clearSandbox11() });
      ctl.sep();
      ctl.seg({
        options: [{ label: '电子', value: 'electron' }, { label: '质子', value: 'proton' }, { label: 'α 粒子', value: 'alpha' }],
        value: st11.ptype,
        onChange: (v) => { st11.ptype = v; },
      });
      ctl.toggle({
        label: '匀强磁场（竖直）', value: st11.Bon,
        onChange: (v) => {
          st11.Bon = v;
          w11.arrows.forEach((a) => { a.visible = v; });
          w11.coilRings.visible = v;
        },
      });
      ctl.slider({
        label: '磁感应强度 B', min: 0.3, max: 2, step: 0.1, value: st11.B,
        fmt: (v) => v.toFixed(1) + ' T',
        onInput: (v) => { st11.B = v; },
      });
      ctl.button({ label: '● 发射带电粒子', onClick: () => launchParticle11() });
    },
  },
  {
    title: '随堂检测',
    html: `<p>5 道选择题，覆盖电场线、左手定则、洛伦兹力、楞次定律与交流电。答完看成绩与解析。</p>`,
    enter() {
      hideAllChapters();
      app.setCamera([0.3, 3.2, 4.6], [0, 1.0, 0]);
      showHud(-1);
      ctl.clear();
      showQuiz();
    },
  },
];

/* ---------------- 随堂检测 ---------------- */

const QUIZ = [
  {
    q: '关于电场线，下列说法正确的是？',
    opts: ['电场线是闭合曲线', '电场线从正电荷出发，到负电荷终止', '两条电场线可以相交', '电场线越密的地方场强越小'],
    a: 1,
    ex: '电场线起于正电荷（或无穷远）、止于负电荷（或无穷远），不闭合、不相交；疏密表示场强强弱——越密场强越大。',
  },
  {
    q: '通电直导线电流水平向右，所在处磁场竖直向下，用左手定则判断安培力方向是？',
    opts: ['竖直向上', '竖直向下', '水平指向读者（垂直导线向外）', '水平指离读者（垂直导线向里）'],
    a: 3,
    ex: '左手摊平、掌心朝上接住向下的磁场，四指指向电流（向右），拇指即安培力方向——垂直导线指离读者（也可由 F=IL×B 验证：x̂×(−ŷ)=−ẑ，指向纸内）。',
  },
  {
    q: '带电粒子在匀强磁场中做匀速圆周运动，若速率 v 加倍（m、q、B 不变），半径 r 与周期 T 如何变化？',
    opts: ['r 加倍，T 不变', 'r 加倍，T 加倍', 'r 不变，T 加倍', 'r、T 都不变'],
    a: 0,
    ex: 'r=mv/qB，与 v 成正比，v 加倍则 r 加倍；T=2πm/qB 与 v 无关，保持不变——这也是回旋加速器能用固定频率交变电压的原因。',
  },
  {
    q: '把条形磁铁 N 极插入螺线管使磁通增大时，感应电流的磁场方向与插 入磁场方向的关系是？（楞次定律）',
    opts: ['相同，帮助磁通增大', '相反，阻碍磁通增大', '始终垂直于原磁场', '没有关系'],
    a: 1,
    ex: '楞次定律：感应电流的效果总是阻碍磁通变化——增大时感应磁场与原磁场反向（增反），减小时同向（减同）；从力学效果看即「来拒去留」。',
  },
  {
    q: '交流发电机转速从 n 变为 2n（B、N、S 不变），电动势最大值 Em 与频率 f 的变化是？',
    opts: ['Em 不变，f 加倍', 'Em 加倍，f 不变', 'Em、f 都加倍', 'Em、f 都不变'],
    a: 2,
    ex: 'ω=2πn 加倍 → Em=NBSω 加倍；f=ω/2π=n 也加倍。转速同时抬高峰值与频率。',
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
      <p style="color:var(--text-dim);margin:4px 0 18px">正确率 ${pct}%${pct >= 80 ? '，电场与磁场的要点你已经掌握了！' : pct >= 60 ? '，大部分概念已经清楚，回顾一下错题。' : '，建议回到前面章节再看一遍哦。'}</p>`;
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

/* ---------------- 启动 ---------------- */

/* 环境反射走程序化摄影棚（makeStudioEnvironment，按 renderer 缓存）；
   背景由 attachVFX 的 illus 模式管理，零外部 HDR 依赖 */
setTimeout(() => {
  buildWorld();
  buildWork();
  buildCap();
  buildScope();
  buildMagnet();
  buildAmpere();
  buildLorentz();
  buildMS();
  buildCyc();
  buildInduction();
  buildGenerator();
  buildSandbox();
  labReady = true;

  loader.hide();
  window.__eduSections = { select: selectChapter };
  /* 调试句柄（自动化验收/性能自查用） */
  window.__fieldsDebug = { vfx, app };
  selectChapter(0);
}, 60);

/* ================= 三栏布局驱动（左栏章节列表 / 右栏详解联动 / 栏折叠 / 专注模式） ================= */

const chapNav = document.getElementById('chapNav');
const chapCount = document.getElementById('chapCount');
const detailNo = document.getElementById('detailNo');
const detailTitle = document.getElementById('detailTitle');
const lessonEl = document.getElementById('lesson');
const detailBody = document.getElementById('detailBody');
const controlsEl = document.getElementById('controls');
const fieldsShell = document.getElementById('fieldsShell');
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
  sec.enter();
  /* 本章无控件时整块手风琴收走（不动用户的手风琴偏好；数据块由 showHud 按章同步） */
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

const FOLD_KEY = { l: 'fields.foldL', r: 'fields.foldR' };
let foldL = false;
let foldR = false;
let focusSaved = null; /* 进入专注模式前的独立折叠状态 [foldL, foldR]，退出时恢复 */

try {
  foldL = localStorage.getItem(FOLD_KEY.l) === '1';
  foldR = localStorage.getItem(FOLD_KEY.r) === '1';
} catch (e) { /* localStorage 不可用（隐私模式等）时仅本次会话内生效 */ }

function applyFold() {
  fieldsShell.classList.toggle('fold-l', foldL);
  fieldsShell.classList.toggle('fold-r', foldR);
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
  fieldsShell.classList.toggle('focus-mode', on);
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

const ACC_KEYS = { lesson: 'fields.accLesson', controls: 'fields.accControls', data: 'fields.accData' };
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
