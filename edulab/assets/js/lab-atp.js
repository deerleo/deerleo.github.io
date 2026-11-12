/* EduLab · 细胞的能量“货币”（atp）
 * 章节：萤火虫为什么能发光 / ATP 的结构 / ATP 与 ADP 的相互转化 / ATP 合酶 / 随堂检测
 * 场景：暗室荧光实验台（四管对照）、球棍模型 ATP、ADP⇄ATP 能量循环、线粒体内膜 ATP 合酶旋转催化。
 */
import {
  THREE, TAU, clamp,
  createApp, makeLoader,
  createControlsPanel, makeHUD, makeTextSprite, setSpriteText, makeGlowTexture,
} from './edu-core.js';
import { attachVFX, makeWoodTexture, makeLabelTexture, matCoat, matGlass, matStd, matGlow } from './edu-vfx.js';

/* ---------------- 基础 ---------------- */

const stage = document.getElementById('stage');
const loader = makeLoader(stage, '正在搭建暗室实验台…');
const app = createApp({
  container: stage,
  fov: 42, near: 0.1, far: 200,
  cameraPos: [0, 2.8, 6.4], target: [0, 1.0, 0],
  minDistance: 1.2, maxDistance: 30,
  keepBackground: true,
});
const { scene, camera, controls } = app;
/* 视觉工艺接入：后处理管线接管渲染与相机缓动（setCamera 升级为 cubic 运镜） */
const vfx = attachVFX(app, 'illus');

const amb = new THREE.AmbientLight(0xdfe8f5, 1.05);
scene.add(amb);
const key = new THREE.DirectionalLight(0xfff2e0, 1.9);
key.position.set(4, 7, 5);
scene.add(key);
const fill = new THREE.DirectionalLight(0xbcd4ff, 0.55);
fill.position.set(-5, 3, -4);
scene.add(fill);

const M = (color, rough = 0.75, metal = 0, extra = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, ...extra });
const mesh = (geo, mat) => new THREE.Mesh(geo, mat);

function label(text, color = '#ffffff', scale = 0.006, bg = 'rgba(10,16,24,0.72)') {
  return makeTextSprite(text, { fontSize: 32, color, scale, bg });
}

/* ---------------- 深改工艺件（放样曲面 / 接触阴影 / 程序化贴图；以下工具全部进入渲染路径） ---------------- */

/**
 * 竖直轴 CatmullRomCurve3 放样：profile 为 [{y, r}] 变宽截面序列，
 * 采样曲线生成圆环带 → indexed BufferGeometry（底部/顶部可选封口）。
 * 试管圆底翻口、研钵碗体、酒精灯、电池壳、载体蛋白叶瓣均由它出形，替代裸 primitive 拼装。
 */
function buildLoft(profile, radialSegs = 28, opts = {}) {
  const pts = profile.map((p) => new THREE.Vector3(p.r, p.y, 0));
  const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.5);
  const div = opts.rows ?? Math.max(24, profile.length * 8);
  const rings = [];
  for (let i = 0; i <= div; i++) {
    const t = i / div;
    const p = curve.getPoint(t);
    rings.push({ y: p.x, r: Math.max(0.012, p.y) });
  }
  const pos = [], idx = [];
  for (let i = 0; i < rings.length; i++) {
    for (let j = 0; j <= radialSegs; j++) {
      const a = (j / radialSegs) * TAU;
      pos.push(Math.cos(a) * rings[i].r, rings[i].y, Math.sin(a) * rings[i].r);
    }
  }
  const row = radialSegs + 1;
  for (let i = 0; i < rings.length - 1; i++) {
    for (let j = 0; j < radialSegs; j++) {
      const a = i * row + j, b = a + row;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  if (opts.capBottom) {
    const c = pos.length / 3;
    pos.push(0, rings[0].y, 0);
    for (let j = 0; j < radialSegs; j++) idx.push(c, j + 1, j);
  }
  if (opts.capTop) {
    const c = pos.length / 3;
    const last = (rings.length - 1) * row;
    pos.push(0, rings[rings.length - 1].y, 0);
    for (let j = 0; j < radialSegs; j++) idx.push(c, last + j, last + j + 1);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

/* 接触阴影贴图：径向黑心软边（一次生成，全局复用） */
let _shadowTex = null;
function contactShadowTex() {
  if (_shadowTex) return _shadowTex;
  const cv = document.createElement('canvas');
  cv.width = cv.height = 128;
  const ctx = cv.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 62);
  g.addColorStop(0, 'rgba(0,0,0,0.85)');
  g.addColorStop(0.45, 'rgba(0,0,0,0.4)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  _shadowTex = new THREE.CanvasTexture(cv);
  return _shadowTex;
}
function addContactShadow(parent, x, z, r, opacity = 0.5) {
  const m = mesh(
    new THREE.PlaneGeometry(r * 2, r * 2),
    new THREE.MeshBasicMaterial({ map: contactShadowTex(), transparent: true, opacity, depthWrite: false })
  );
  m.rotation.x = -Math.PI / 2;
  m.position.set(x, 0.005, z);
  m.renderOrder = 1;
  parent.add(m);
  return m;
}

/* 电池包皮贴图：品名 + 电量条 + 极性标（ATP 满电亮 / ADP 放电暗） */
function batteryLabelTexture(name, sub, tint, charge) {
  const w = 256, h = 200;
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = tint;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fillRect(0, h - 64, w, 64);
  ctx.fillStyle = charge > 0.5 ? '#eaffd2' : '#aebdd2';
  ctx.font = '700 44px "PingFang SC", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(name, w / 2, 74);
  ctx.font = '400 22px "PingFang SC", sans-serif';
  ctx.fillText(sub, w / 2, 106);
  /* 电量条 */
  ctx.strokeStyle = 'rgba(255,255,255,0.65)';
  ctx.lineWidth = 3;
  ctx.strokeRect(46, h - 50, w - 92, 26);
  ctx.fillStyle = charge > 0.5 ? '#b6f09a' : '#7f92ad';
  ctx.fillRect(50, h - 46, (w - 100) * charge, 18);
  /* 极性标 */
  ctx.font = '700 26px sans-serif';
  ctx.fillStyle = '#ffe9c0';
  ctx.fillText('＋', w - 26, 34);
  ctx.fillStyle = '#c9d6e8';
  ctx.fillText('－', 26, 34);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/* 肌纤维条纹贴图（明暗横带 + 细肌节分割线） */
function muscleStripeTexture() {
  const w = 256, h = 128;
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const ctx = cv.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#b65a6a');
  g.addColorStop(1, '#7e3648');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  for (let y = 6; y < h; y += 18) {
    ctx.fillStyle = 'rgba(30,12,20,0.55)';
    ctx.fillRect(0, y, w, 5);
    ctx.fillStyle = 'rgba(255,214,214,0.28)';
    ctx.fillRect(0, y + 7, w, 2);
  }
  for (let x = 0; x < w; x += 32) {
    ctx.fillStyle = 'rgba(20,8,14,0.3)';
    ctx.fillRect(x, 0, 2, h);
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/* 防滑垫格纹贴图 */
function benchMatTexture() {
  const S = 256;
  const cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#232b36';
  ctx.fillRect(0, 0, S, S);
  ctx.strokeStyle = 'rgba(150,170,190,0.16)';
  ctx.lineWidth = 2;
  for (let i = 0; i <= 8; i++) {
    const p = (i / 8) * S;
    ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, S); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, p); ctx.lineTo(S, p); ctx.stroke();
  }
  ctx.fillStyle = 'rgba(200,220,240,0.05)';
  for (let i = 0; i < 500; i++) ctx.fillRect(Math.random() * S, Math.random() * S, 2, 2);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 1);
  return tex;
}

/*  compartment 渐变板贴图（膜上/下区间的浓度氛围） */
function gradientPanelTexture(topColor, bottomColor) {
  const cv = document.createElement('canvas');
  cv.width = 64; cv.height = 256;
  const ctx = cv.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, topColor);
  g.addColorStop(1, bottomColor);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 256);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/* 各章节场景组（互斥显示） */
const gFirefly = new THREE.Group();
const gMolecule = new THREE.Group();
const gCycle = new THREE.Group();
const gSynth = new THREE.Group();
scene.add(gFirefly, gMolecule, gCycle, gSynth);
const GROUPS = [gFirefly, gMolecule, gCycle, gSynth];

function showGroup(g) {
  GROUPS.forEach((x) => { x.visible = x === g; });
}

/* ================= 章节 1：萤火虫发光 ================= */

const bench = mesh(new THREE.BoxGeometry(7.4, 0.28, 2.6), M(0x3a4354, 0.85));
bench.position.y = -0.14;
gFirefly.add(bench);

const VIALS = [
  { x: -2.4, name: '① 蒸馏水', liquid: 0xbcd8ef, content: 'water' },
  { x: -0.85, name: '② 葡萄糖', liquid: 0xf3f7e2, content: 'glucose' },
  { x: 0.85, name: '③ ATP 溶液', liquid: 0xffe9a8, content: 'atp' },
  { x: 2.4, name: '④ ATP＋煮沸研磨', liquid: 0xffe9a8, content: 'atp_boiled' },
];
const glowTex = makeGlowTexture('220,255,160', [[0, 'rgba(C,0.95)'], [0.3, 'rgba(C,0.45)'], [1, 'rgba(C,0)']]);

VIALS.forEach((v) => {
  const g = new THREE.Group();
  g.position.set(v.x, 0, 0);
  const glass = mesh(new THREE.CylinderGeometry(0.5, 0.42, 1.7, 24), M(0xcfe4f2, 0.12, 0.05, { transparent: true, opacity: 0.22, depthWrite: false }));
  glass.position.y = 0.95;
  const liquid = mesh(new THREE.CylinderGeometry(0.44, 0.4, 1.15, 20), M(v.liquid, 0.32, 0, { transparent: true, opacity: 0.85 }));
  liquid.position.y = 0.68;
  const tissue = mesh(new THREE.SphereGeometry(0.3, 16, 12), M(0x8a7a4a, 0.9));
  tissue.scale.set(1, 0.45, 1);
  tissue.position.y = 0.22;
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 }));
  glow.position.y = 0.5;
  glow.scale.set(0.01, 0.01, 1);
  const lab = label(v.name, '#dfe9f5', 0.0048);
  lab.position.set(0, -0.42, 0);
  const stateTxt = label('待注入', '#9fb2c8', 0.0044);
  stateTxt.position.set(0, 1.98, 0);
  g.add(glass, liquid, tissue, glow, lab, stateTxt);
  v.group = g; v.glow = glow; v.stateTxt = stateTxt; v.liquid = liquid; v.lit = 0;
  gFirefly.add(g);
});
const fireflyLight = new THREE.PointLight(0xd8ffb0, 0, 7);
fireflyLight.position.set(VIALS[2].x, 1.1, 0.4);
gFirefly.add(fireflyLight);

const firefly = { injected: 0, dark: false, t: 0 };

function injectVial(i) {
  const v = VIALS[i];
  if (v.lit || v.injected) return;
  v.injected = true;
  v.stateTxt.position.y = 1.98;
  const on = v.content === 'atp' && i === 2;        // 只有新鲜研磨液 + ATP 才亮
  if (v.content === 'atp_boiled') {
    setSpriteText(v.stateTxt, '注入后仍不发光', { fontSize: 30, color: '#ff9d8a', scale: 0.0044, bg: 'rgba(10,16,24,0.72)' });
  } else if (on) {
    setSpriteText(v.stateTxt, '✦ 发光！', { fontSize: 34, color: '#e6ffc0', scale: 0.0052, bg: 'rgba(10,16,24,0.72)' });
  } else {
    setSpriteText(v.stateTxt, '不发光', { fontSize: 30, color: '#9fb2c8', scale: 0.0044, bg: 'rgba(10,16,24,0.72)' });
  }
  v.targetGlow = on ? 1 : 0;
  firefly.injected++;
}

function resetFirefly() {
  VIALS.forEach((v) => {
    v.injected = false; v.lit = 0; v.targetGlow = 0;
    v.glow.material.opacity = 0;
    v.glow.scale.set(0.01, 0.01, 1);
    setSpriteText(v.stateTxt, '待注入', { fontSize: 30, color: '#9fb2c8', scale: 0.0044, bg: 'rgba(10,16,24,0.72)' });
  });
  firefly.injected = 0;
}

function tickFirefly(dt) {
  VIALS.forEach((v, i) => {
    const want = v.targetGlow ? 1 : 0;
    v.lit += (want - v.lit) * Math.min(1, dt * 2.4);
    const flicker = v.lit > 0.05 ? 0.85 + 0.15 * Math.sin(firefly.t * (7 + i)) : 0;
    const k = v.lit * flicker;
    v.glow.material.opacity = k;
    v.glow.scale.set(2.6 * k + 0.01, 2.6 * k + 0.01, 1);
  });
  fireflyLight.intensity = VIALS[2].lit * (0.8 + 0.2 * Math.sin(firefly.t * 7)) * 22;
}

/* ---------- 章节 1 深化：台面质感 / 试管架 / 放样管口 / 试剂瓶阵列 / 研钵研杵 / 酒精灯 / 滴管 / 标本罐 ---------- */

/* 桌身（原 bench）上加木纹台面与包边，垫一张防滑格纹垫 */
{
  const woodTop = mesh(
    new THREE.BoxGeometry(7.52, 0.07, 2.72),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.58, metalness: 0.08, map: makeWoodTexture({ base: '#6b4a2e', dark: '#462c16', light: '#8a6440', seed: 11, planks: 5 }) })
  );
  woodTop.position.y = 0.035;
  gFirefly.add(woodTop);
  const rimMat = M(0x2c2318, 0.62);
  for (const [w, d, x, z] of [[7.52, 0.1, 0, 1.36], [7.52, 0.1, 0, -1.36], [0.1, 2.62, 3.71, 0], [0.1, 2.62, -3.71, 0]]) {
    const rim = mesh(new THREE.BoxGeometry(w, 0.11, d), rimMat);
    rim.position.set(x, 0.02, z);
    gFirefly.add(rim);
  }
  const mat = mesh(
    new THREE.PlaneGeometry(6.6, 2.1),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, metalness: 0.05, map: benchMatTexture() })
  );
  mat.rotation.x = -Math.PI / 2;
  mat.position.y = 0.074;
  gFirefly.add(mat);
}

/* 试管架：前后横杆 + 四腿 + 孔环，试管从孔中穿出 */
{
  const rackMat = matStd(0x54381f, { roughness: 0.66 });
  const front = mesh(new THREE.BoxGeometry(6.6, 0.1, 0.14), rackMat);
  front.position.set(0, 1.06, 0.52);
  const back = mesh(new THREE.BoxGeometry(6.6, 0.1, 0.14), rackMat);
  back.position.set(0, 0.62, 0.52);
  gFirefly.add(front, back);
  for (const lx of [-3.15, -1.1, 1.1, 3.15]) {
    const leg = mesh(new THREE.BoxGeometry(0.14, 0.94, 0.14), rackMat);
    leg.position.set(lx, 0.47, 0.52);
    gFirefly.add(leg);
  }
  const holeMat = matStd(0x8a6a48, { roughness: 0.5, metalness: 0.25 });
  VIALS.forEach((v) => {
    const ring = mesh(new THREE.TorusGeometry(0.52, 0.05, 10, 28), holeMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(v.x, 1.06, 0);
    gFirefly.add(ring);
  });
  /* 每支试管补放样唇口 + 圆底头，玻璃件从素 cylinder 升级为带翻口的器皿 */
  const lipMat = M(0xcfe4f2, 0.12, 0.05, { transparent: true, opacity: 0.3, depthWrite: false });
  const bumpMat = M(0xcfe4f2, 0.14, 0.05, { transparent: true, opacity: 0.26, depthWrite: false });
  VIALS.forEach((v) => {
    const lip = mesh(new THREE.TorusGeometry(0.5, 0.055, 10, 30), lipMat);
    lip.rotation.x = Math.PI / 2;
    lip.position.set(v.x, 1.86, 0);
    const base = mesh(new THREE.SphereGeometry(0.42, 20, 12), bumpMat);
    base.scale.set(1, 0.4, 1);
    base.position.set(v.x, 0.14, 0);
    gFirefly.add(lip, base);
    addContactShadow(gFirefly, v.x, 0, 0.62, 0.42);
  });
}

/* 试剂瓶阵列：托盘 + 三瓶（蒸馏水 / 葡萄糖溶液 / ATP 储液），程序化标签 */
{
  const tray = mesh(new THREE.BoxGeometry(4.6, 0.1, 0.8), matStd(0x3d4656, { roughness: 0.55, metalness: 0.15 }));
  tray.position.set(0.4, 0.12, -1.0);
  gFirefly.add(tray);
  addContactShadow(gFirefly, 0.4, -1.0, 1.9, 0.4);
  const REAG = [
    { x: -1.3, name: ['蒸馏水', 'DISTILLED WATER'], tint: '#b9d6ec', liquid: 0xbcd8ef },
    { x: 0.35, name: ['葡萄糖溶液', 'GLUCOSE 5%'], tint: '#e7efd2', liquid: 0xf3f7e2 },
    { x: 2.0, name: ['ATP 储液', 'ATP 10 mmol/L'], tint: '#ffe9a8', liquid: 0xffe9a8 },
  ];
  REAG.forEach((r) => {
    const g = new THREE.Group();
    g.position.set(r.x, 0.17, -1.0);
    const bodyGeo = buildLoft(
      [{ y: 0, r: 0.2 }, { y: 0.12, r: 0.24 }, { y: 0.52, r: 0.24 }, { y: 0.72, r: 0.19 }, { y: 0.78, r: 0.1 }],
      22, { capBottom: true, capTop: false }
    );
    const body = mesh(bodyGeo, matGlass(0xdfeef2, { opacity: 0.5 }));
    const liquid = mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.34, 18), M(r.liquid, 0.3, 0, { transparent: true, opacity: 0.85 }));
    liquid.position.y = 0.24;
    const cap = mesh(new THREE.CylinderGeometry(0.1, 0.11, 0.12, 14), M(0x35404e, 0.5, 0.3));
    cap.position.y = 0.86;
    const neck = mesh(new THREE.TorusGeometry(0.1, 0.024, 8, 18), M(0x35404e, 0.5, 0.3));
    neck.rotation.x = Math.PI / 2;
    neck.position.y = 0.8;
    const tag = mesh(
      new THREE.PlaneGeometry(0.3, 0.24),
      new THREE.MeshStandardMaterial({ map: makeLabelTexture(r.name, { w: 256, h: 200, accent: '#46586e' }), roughness: 0.8 })
    );
    tag.position.set(0, 0.34, 0.245);
    g.add(body, liquid, cap, neck, tag);
    gFirefly.add(g);
    addContactShadow(gFirefly, r.x, -1.0, 0.34, 0.4);
  });
}

/* 研钵 + 研杵（放样碗体/杵身）与提取液烧杯：研磨动画的舞台 */
const grind = {
  pestle: null, bowl: null, beakerLiquid: null, extractLit: 0,
  anim: null,   /* {t} 捣动进行中 */
};
{
  const g = new THREE.Group();
  g.position.set(-2.75, 0.07, -0.5);
  const bowl = mesh(
    buildLoft(
      [{ y: 0, r: 0.18 }, { y: 0.08, r: 0.34 }, { y: 0.3, r: 0.52 }, { y: 0.42, r: 0.56 }, { y: 0.5, r: 0.46 }],
      26, { capBottom: true, capTop: false }
    ),
    matCoat(0x9aa3ae, { roughness: 0.4, metalness: 0.12 })
  );
  const pestleG = new THREE.Group();
  pestleG.position.set(0.3, 0.52, 0.18);
  pestleG.rotation.z = -0.5;
  const pestle = mesh(
    buildLoft(
      [{ y: 0, r: 0.05 }, { y: 0.14, r: 0.1 }, { y: 0.34, r: 0.1 }, { y: 0.62, r: 0.06 }, { y: 0.78, r: 0.13 }, { y: 0.9, r: 0.1 }],
      16, { capBottom: true, capTop: true }
    ),
    matStd(0xb9bfc7, { roughness: 0.42, metalness: 0.2 })
  );
  pestleG.add(pestle);
  g.add(bowl, pestleG);
  /* 提取液小烧杯：研磨完成后出现微光液面 */
  const beaker = mesh(new THREE.CylinderGeometry(0.26, 0.24, 0.56, 20), matGlass(0xdfeef2, { opacity: 0.4 }));
  beaker.position.set(0.85, 0.28, 0.3);
  const bl = mesh(new THREE.CylinderGeometry(0.22, 0.21, 0.3, 18), matGlow(0xd6f2a1, 0.55, { opacity: 0.8 }));
  bl.position.set(0.85, 0.16, 0.3);
  bl.visible = false;
  g.add(beaker, bl);
  /* 组织碎块：研钵内几粒不规则小块 */
  const chunkMat = M(0x8a7a4a, 0.9);
  for (let i = 0; i < 5; i++) {
    const c = mesh(new THREE.SphereGeometry(0.05 + (i % 3) * 0.014, 8, 6), chunkMat);
    const a = (i / 5) * TAU;
    c.position.set(Math.cos(a) * 0.22, 0.42, Math.sin(a) * 0.22);
    c.scale.set(1, 0.7, 1.2);
    g.add(c);
  }
  grind.bowl = bowl;
  grind.pestle = pestleG;
  grind.beakerLiquid = bl;
  gFirefly.add(g);
  addContactShadow(gFirefly, -2.75, -0.5, 0.75, 0.45);
  addContactShadow(gFirefly, -2.05, -0.2, 0.34, 0.35);
}

function startGrind() {
  if (grind.anim) return;
  grind.anim = { t: 0 };
}

/* 酒精灯（放样灯体 + 火焰辉光 + 可脱卸灯帽）：水浴加热开关的具象载体 */
const lamp = { flame: null, light: null, on: false, cap: null };
{
  const g = new THREE.Group();
  g.position.set(2.75, 0.07, -0.5);
  const body = mesh(
    buildLoft(
      [{ y: 0, r: 0.3 }, { y: 0.1, r: 0.34 }, { y: 0.3, r: 0.3 }, { y: 0.36, r: 0.13 }, { y: 0.4, r: 0.1 }],
      24, { capBottom: true, capTop: false }
    ),
    matGlass(0xe8eef0, { opacity: 0.55 })
  );
  const fuel = mesh(new THREE.CylinderGeometry(0.27, 0.28, 0.2, 22), M(0xd9e4ea, 0.3, 0, { transparent: true, opacity: 0.75 }));
  fuel.position.y = 0.11;
  const wick = mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.18, 10), M(0xe8dfc8, 0.9));
  wick.position.y = 0.46;
  const flame = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeGlowTexture('255,176,84', [[0, 'rgba(C,1)'], [0.35, 'rgba(C,0.5)'], [1, 'rgba(C,0)']]),
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0,
  }));
  flame.position.y = 0.66;
  flame.scale.set(0.02, 0.02, 1);
  const light = new THREE.PointLight(0xffb06a, 0, 4.5);
  light.position.set(0, 0.8, 0);
  const cap = mesh(
    buildLoft([{ y: 0, r: 0.3 }, { y: 0.16, r: 0.3 }, { y: 0.3, r: 0.02 }], 22, { capBottom: false, capTop: true }),
    matStd(0x4a5563, { roughness: 0.45, metalness: 0.4 })
  );
  cap.position.set(1.0, 0.0, 0.4);
  g.add(body, fuel, wick, flame, light, cap);
  lamp.flame = flame;
  lamp.light = light;
  lamp.cap = cap;
  gFirefly.add(g);
  addContactShadow(gFirefly, 2.75, -0.5, 0.5, 0.45);
  addContactShadow(gFirefly, 3.75, -0.1, 0.32, 0.3);
}

function setBath(on) {
  lamp.on = on;
  /* 沸水浴点燃酒精灯；4 号管液色随之趋向煮沸色 */
  VIALS[3].heat = on ? 1 : 0;
}

/* 滴管（放样锥管 + 胶头 + 管内液柱）：注入动作的执行道具 */
const dropper = {
  g: null, drop: null, home: new THREE.Vector3(4.35, 1.6, 0.35),
  anim: null,   /* {phase:'move'|'drop'|'back', target, t} */
};
{
  const g = new THREE.Group();
  const tube = mesh(
    buildLoft([{ y: 0, r: 0.055 }, { y: 0.5, r: 0.05 }, { y: 0.9, r: 0.02 }], 14, { capBottom: true, capTop: false }),
    matGlass(0xdfeef2, { opacity: 0.5 })
  );
  const bulb = mesh(new THREE.SphereGeometry(0.13, 14, 10), M(0xc4d2dd, 0.6, 0.05));
  bulb.scale.set(1, 1.25, 1);
  bulb.position.y = 1.04;
  const juice = mesh(new THREE.CylinderGeometry(0.03, 0.024, 0.3, 10), M(0xffe9a8, 0.3, 0, { transparent: true, opacity: 0.9 }));
  juice.position.y = 0.2;
  const dropBall = mesh(new THREE.SphereGeometry(0.055, 10, 8), M(0xffe9a8, 0.25, 0, { transparent: true, opacity: 0.95 }));
  dropBall.visible = false;
  g.add(tube, bulb, juice, dropBall);
  g.position.copy(dropper.home);
  dropper.g = g;
  dropper.drop = dropBall;
  gFirefly.add(g);
}

/* 滴管注入编排：move（飞到目标管口上方）→ drop（一滴试剂落下）→ back（回架）→ 调原注入判定 */
function queueInject(i) {
  const v = VIALS[i];
  if (dropper.anim || v.injected) return;
  dropper.anim = { phase: 'move', target: i, t: 0 };
}

function resetDropper() {
  dropper.anim = null;
  dropper.g.position.copy(dropper.home);
  dropper.g.rotation.set(0, 0, 0);
  dropper.drop.visible = false;
}

function tickDropper(dt) {
  const a = dropper.anim;
  if (!a) return;
  const tgt = new THREE.Vector3(VIALS[a.target].x, 2.42, 0);
  a.t += dt;
  if (a.phase === 'move') {
    const k = Math.min(1, a.t / 0.45);
    dropper.g.position.lerpVectors(dropper.home, tgt, k * k * (3 - 2 * k));
    dropper.g.rotation.z = -0.35 * Math.sin(k * Math.PI);
    if (k >= 1) { a.phase = 'drop'; a.t = 0; dropper.drop.visible = true; dropper.drop.position.set(0, -0.15, 0); }
  } else if (a.phase === 'drop') {
    const k = Math.min(1, a.t / 0.3);
    dropper.drop.position.set(0, -0.15 - k * 1.45, 0);
    if (k >= 1) {
      dropper.drop.visible = false;
      injectVial(a.target);
      a.phase = 'back'; a.t = 0;
    }
  } else {
    const k = Math.min(1, a.t / 0.4);
    dropper.g.position.lerpVectors(tgt, dropper.home, k * k * (3 - 2 * k));
    dropper.g.rotation.z = 0;
    if (k >= 1) dropper.anim = null;
  }
}

/* 萤火虫标本罐：玻璃罐 + 放样腹部三节 + 发光尾端（暗场时脉动）——场景叙事道具 */
const jar = { glow: null };
{
  const g = new THREE.Group();
  g.position.set(-2.8, 0.07, 0.85);
  const pot = mesh(new THREE.CylinderGeometry(0.42, 0.38, 0.9, 22), matGlass(0xdfeef2, { opacity: 0.35 }));
  pot.position.y = 0.45;
  const lid = mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.1, 22), M(0x5a4630, 0.6, 0.2));
  lid.position.y = 0.95;
  /* 萤火虫躯干：头-胸-腹三节放样椭球，腹部末节发光 */
  const bugMat = M(0x6a5230, 0.7);
  const segs = [[0, 0.34, 0.13, 0x6a5230], [0, 0.52, 0.1, 0x5a4626], [0, 0.68, 0.11, 0x4e3c22]];
  segs.forEach(([x, y, r], i) => {
    const seg = mesh(
      i === 2
        ? buildLoft([{ y: 0, r: 0.1 }, { y: 0.1, r: 0.12 }, { y: 0.2, r: 0.06 }, { y: 0.26, r: 0.02 }], 14, { capBottom: true, capTop: false })
        : new THREE.SphereGeometry(r, 12, 9),
      bugMat
    );
    seg.position.set(x, y, 0);
    if (i < 2) seg.scale.set(1.15, 0.8, 1);
    g.add(seg);
  });
  const wingL = mesh(new THREE.SphereGeometry(0.16, 10, 8), M(0x3c3630, 0.5));
  wingL.scale.set(0.35, 1.4, 0.1);
  wingL.position.set(-0.1, 0.5, 0.1);
  wingL.rotation.z = 0.3;
  const wingR = wingL.clone();
  wingR.position.x = 0.1;
  wingR.rotation.z = -0.3;
  g.add(wingL, wingR);
  const tipGlow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeGlowTexture('255,214,120', [[0, 'rgba(C,1)'], [0.4, 'rgba(C,0.4)'], [1, 'rgba(C,0)']]),
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.4,
  }));
  tipGlow.position.set(0, 0.92, 0);
  tipGlow.scale.set(0.4, 0.4, 1);
  jar.glow = tipGlow;
  g.add(tipGlow);
  gFirefly.add(g);
  addContactShadow(gFirefly, -2.8, 0.85, 0.55, 0.4);
}

/* 章节 1 追加帧驱动：滴管编排 / 研磨捣动 / 火焰与加热色 / 标本罐呼吸 / 提取液微光 */
function tickFireflyExtra(dt, t) {
  tickDropper(dt);
  if (grind.anim) {
    grind.anim.t += dt;
    const k = grind.anim.t;
    /* 三次捣动：杵体上下 + 绕钵口小幅环摆 */
    const bounce = Math.max(0, Math.sin(k * 7)) ;
    grind.pestle.position.y = 0.52 - bounce * 0.2;
    grind.pestle.rotation.x = Math.sin(k * 3.4) * 0.22;
    if (k >= 1.5) {
      grind.pestle.position.y = 0.52;
      grind.pestle.rotation.x = 0;
      grind.beakerLiquid.visible = true;
      grind.anim = null;
    }
  }
  grind.extractLit += ((grind.beakerLiquid.visible ? 1 : 0) - grind.extractLit) * Math.min(1, dt * 2);
  grind.beakerLiquid.material.emissiveIntensity = 0.3 + grind.extractLit * (0.4 + 0.25 * Math.sin(t * 2.6));
  /* 酒精灯火焰与沸水染色 */
  const flameK = lamp.on ? 0.82 + 0.18 * Math.sin(t * 11) : 0;
  lamp.flame.material.opacity = flameK;
  lamp.flame.scale.set(0.35 + flameK * 0.5, 0.7 + flameK * 0.9, 1);
  lamp.light.intensity = lamp.on ? 3.2 * flameK : 0;
  lamp.cap.rotation.y += dt * 0.4;
  const boil = VIALS[3].heat || 0;
  const liq = VIALS[3].liquid;
  liq.material.color.lerpColors(new THREE.Color(0xffe9a8), new THREE.Color(0xffd28a), boil);
  liq.material.emissive.setHex(0xcf9020);
  liq.material.emissiveIntensity = boil * 0.22;
  /* 标本罐尾光呼吸（暗场开关由 amb 强度间接体现，尾光自持脉动） */
  const breathe = 0.3 + 0.22 * (0.5 + 0.5 * Math.sin(t * 1.8));
  jar.glow.material.opacity = breathe;
  jar.glow.scale.setScalar(0.34 + breathe * 0.5);
  jar.glow.scale.z = 1;
}

/* ================= 章节 2：ATP 球棍模型 ================= */

const ATOM = {
  C: { c: 0x5d6b82, r: 0.155 },
  N: { c: 0x4a7de0, r: 0.165 },
  O: { c: 0xe05252, r: 0.15 },
  P: { c: 0xff9d45, r: 0.2 },
};
const bondMat = M(0xaeb9c8, 0.55, 0.1);
const hiMat = M(0xffb054, 0.4, 0.1, { emissive: 0xff7a1a, emissiveIntensity: 0.25 });

const mol = new THREE.Group();
mol.position.set(-0.35, 1.15, 0);
gMolecule.add(mol);

// 原子/键装配工具（XY 平面分子，z 略错开增强立体感）
function atom(sym, x, y, z = 0) {
  const a = ATOM[sym];
  const m = mesh(new THREE.SphereGeometry(a.r, 18, 14), M(a.c, 0.42, 0.08));
  m.position.set(x, y, z);
  mol.add(m);
  return m;
}
function bond(a, b, mat = bondMat, r = 0.05) {
  const va = a.position, vb = b.position;
  const len = va.distanceTo(vb);
  const c = mesh(new THREE.CylinderGeometry(r, r, len, 10), mat);
  c.position.copy(va).add(vb).multiplyScalar(0.5);
  c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), vb.clone().sub(va).normalize());
  mol.add(c);
  return c;
}

// 腺嘌呤：六元环 + 并合五元环
const ade = new THREE.Group();
ade.position.set(0, 1.16, 0);
mol.add(ade);
{
  const hex = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU + TAU / 12;
    hex.push(new THREE.Vector3(Math.cos(a) * 0.46, Math.sin(a) * 0.46, 0));
  }
  const sym6 = ['N', 'C', 'N', 'C', 'N', 'C'];
  const atoms6 = hex.map((p, i) => {
    const m = mesh(new THREE.SphereGeometry(ATOM[sym6[i]].r, 16, 12), M(ATOM[sym6[i]].c, 0.42, 0.08));
    m.position.copy(p); ade.add(m); return m;
  });
  for (let i = 0; i < 6; i++) {
    const va = atoms6[i].position, vb = atoms6[(i + 1) % 6].position;
    const c = mesh(new THREE.CylinderGeometry(0.045, 0.045, va.distanceTo(vb), 8), bondMat);
    c.position.copy(va).add(vb).multiplyScalar(0.5);
    c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), vb.clone().sub(va).normalize());
    ade.add(c);
  }
  // 五元环：共享六元环的 4-5 边（右侧）
  const v4 = hex[4], v5 = hex[5];
  const mid = v4.clone().add(v5).multiplyScalar(0.5);
  const out = mid.clone().normalize();
  const pent = [v4.clone(), out.clone().multiplyScalar(0.62).add(new THREE.Vector3(-0.1, 0.22, 0)), out.clone().multiplyScalar(0.56).add(new THREE.Vector3(0.28, -0.34, 0)), v5.clone()];
  const sym5 = ['C', 'N', 'C', 'N'];
  const atoms5 = pent.map((p, i) => {
    const m = mesh(new THREE.SphereGeometry(ATOM[sym5[i]].r, 16, 12), M(ATOM[sym5[i]].c, 0.42, 0.08));
    m.position.copy(p); ade.add(m); return m;
  });
  for (let i = 0; i < atoms5.length - 1; i++) {
    const va = atoms5[i].position, vb = atoms5[i + 1].position;
    const c = mesh(new THREE.CylinderGeometry(0.045, 0.045, va.distanceTo(vb), 8), bondMat);
    c.position.copy(va).add(vb).multiplyScalar(0.5);
    c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), vb.clone().sub(va).normalize());
    ade.add(c);
  }
  // 氨基（C2 位）
  const nh2 = mesh(new THREE.SphereGeometry(ATOM.N.r, 14, 10), M(ATOM.N.c, 0.42, 0.08));
  nh2.position.copy(hex[0]).multiplyScalar(1.42);
  ade.add(nh2);
}
// 核糖（五元环，XY 平面）
const rib = new THREE.Group();
mol.add(rib);
const ribAtoms = [];
{
  const c1 = new THREE.Vector3(0.34, 0.34, 0);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * TAU - TAU / 4;
    ribAtoms.push(new THREE.Vector3(c1.x + Math.cos(a) * 0.3, c1.y + Math.sin(a) * 0.3, i % 2 ? 0.06 : -0.06));
  }
  const symR = ['C', 'C', 'C', 'O', 'C'];
  const atomsR = ribAtoms.map((p, i) => {
    const m = mesh(new THREE.SphereGeometry(ATOM[symR[i]].r, 16, 12), M(ATOM[symR[i]].c, 0.42, 0.08));
    m.position.copy(p); rib.add(m); return m;
  });
  for (let i = 0; i < 5; i++) {
    const va = atomsR[i].position, vb = atomsR[(i + 1) % 5].position;
    const c = mesh(new THREE.CylinderGeometry(0.042, 0.042, va.distanceTo(vb), 8), bondMat);
    c.position.copy(va).add(vb).multiplyScalar(0.5);
    c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), vb.clone().sub(va).normalize());
    rib.add(c);
  }
  // 糖苷键 C1′—N9
  const c1p = atomsR[0].position;
  const gly = mesh(new THREE.CylinderGeometry(0.042, 0.042, c1p.distanceTo(new THREE.Vector3(0.28, 0.62, 0)), 8), bondMat);
  gly.position.copy(c1p).add(new THREE.Vector3(0.28, 0.62, 0)).multiplyScalar(0.5);
  gly.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0.28, 0.62, 0).sub(c1p).normalize());
  rib.add(gly);
}

// 三磷酸链：O5′ → Pα → ~ → Pβ → ~ → Pγ
const phos = { Ps: [], hi: [], oxy: [], groups: [] };
{
  const chainY = [0.1, -0.34, -0.78];
  const parents = [];
  for (let k = 0; k < 3; k++) {
    const p = mesh(new THREE.SphereGeometry(ATOM.P.r, 18, 14), M(ATOM.P.c, 0.4, 0.1));
    p.position.set(0.78, chainY[k], 0);
    mol.add(p); phos.Ps.push(p);
    // 两个氧（左右）
    for (const dx of [-0.32, 0.34]) {
      const o = mesh(new THREE.SphereGeometry(ATOM.O.r * 0.85, 14, 10), M(ATOM.O.c, 0.42, 0.08));
      o.position.set(0.78 + dx, chainY[k] + 0.1, 0.12);
      mol.add(o); phos.oxy.push(o);
    }
    if (k > 0) {
      const bridge = mesh(new THREE.CylinderGeometry(0.045, 0.045, Math.abs(chainY[k] - chainY[k - 1]) - 0.2, 8), hiMat);
      bridge.position.set(0.78, (chainY[k] + chainY[k - 1]) / 2, 0);
      mol.add(bridge);
      phos.hi.push(bridge);
    }
    const grp = new THREE.Group();
    mol.add(grp); grp.add(p);
    phos.groups.push(grp);
    parents.push(p);
  }
  // O5′ 连接核糖与 Pα
  const o5 = mesh(new THREE.SphereGeometry(ATOM.O.r * 0.9, 14, 10), M(ATOM.O.c, 0.42, 0.08));
  o5.position.set(0.55, 0.32, 0);
  mol.add(o5);
  const b1 = mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.34, 8), bondMat);
  b1.position.set(0.66, 0.26, 0);
  b1.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0.12, -0.28, 0).normalize());
  mol.add(b1);
}

// 标注
const mL_ade = label('腺嘌呤（含氮碱基）', '#9db9ff', 0.0048);
mL_ade.position.set(-1.62, 2.42, 0);
const mL_rib = label('核糖', '#9db9ff', 0.0048);
mL_rib.position.set(-0.72, 0.86, 0);
const mL_phos = label('磷酸基团 ×3', '#ffc38a', 0.0048);
mL_phos.position.set(2.35, 0.42, 0);
const mL_hi = label('~ 特殊化学键', '#ffb054', 0.005);
mL_hi.position.set(2.15, -0.5, 0);
mol.add(mL_ade, mL_rib, mL_phos, mL_hi);

const flash = new THREE.Sprite(new THREE.SpriteMaterial({
  map: makeGlowTexture('255,200,120', [[0, 'rgba(C,1)'], [0.4, 'rgba(C,0.4)'], [1, 'rgba(C,0)']]),
  transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0,
}));
flash.position.set(1.9, 0.6, 0);
flash.scale.set(0.01, 0.01, 1);
mol.add(flash);

const molecule = { hydrolyzed: false, anim: null, count: 0, spin: true, hi: true };

function setHydrolyzed(h) {
  molecule.hydrolyzed = h;
  phos.groups[2].visible = !h;
  phos.hi[1].visible = !h;
  /* 铭牌随水解状态换牌 */
  plate.material.map = h ? plateTexADP : plateTexATP;
  plate.material.needsUpdate = true;
  if (h) {
    mL_hi.visible = false;
    mL_phos.position.set(2.35, 0.6, 0);
  } else {
    mL_hi.visible = true;
    mL_phos.position.set(2.35, 0.42, 0);
  }
}

function tickMolecule(dt, t) {
  if (molecule.spin && !molecule.anim) mol.rotation.y = t * 0.35;
  const pulse = molecule.hi ? 0.45 + 0.4 * (0.5 + 0.5 * Math.sin(t * 4.5)) : 0.25;
  hiMat.emissiveIntensity = pulse;
  if (molecule.anim) {
    const a = molecule.anim;
    a.t += dt;
    const k = clamp(a.t / 0.9, 0, 1);
    const ease = 1 - Math.pow(1 - k, 3);
    if (a.kind === 'out') {
      phos.groups[2].position.set(ease * 1.5, ease * 1.9, 0);
      flash.material.opacity = Math.sin(Math.min(k * 1.6, 1) * Math.PI) * 0.9;
      flash.scale.set(2.2 * k + 0.01, 2.2 * k + 0.01, 1);
      if (k >= 1) { setHydrolyzed(true); molecule.anim = null; flash.material.opacity = 0; }
    } else {
      const g = phos.groups[2];
      g.visible = true;
      g.position.set((1 - ease) * 1.5, (1 - ease) * 1.9, 0);
      if (k >= 1) { setHydrolyzed(false); molecule.anim = null; flash.material.opacity = 0; }
    }
  }
}

/* ---------- 章节 2 深化：展台 / 公式铭牌 / 氢原子与双键 / 高能键领圈 / 爆炸视图 ---------- */

/* 展示台：深色木台面 + 铬杆升降柱 + 托爪圆盘，把分子从悬空改为陈列造型 */
{
  const desk = mesh(
    new THREE.BoxGeometry(4.8, 0.14, 3.2),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6, metalness: 0.08, map: makeWoodTexture({ base: '#4a3826', dark: '#2e2114', light: '#6a5438', seed: 23, planks: 4 }) })
  );
  desk.position.set(-0.35, -0.07, 0);
  gMolecule.add(desk);
  const base = mesh(
    buildLoft([{ y: 0, r: 0.3 }, { y: 0.05, r: 0.36 }, { y: 0.12, r: 0.34 }, { y: 0.18, r: 0.22 }], 24, { capBottom: true, capTop: false }),
    matStd(0x3a4250, { roughness: 0.4, metalness: 0.55 })
  );
  base.position.set(-0.35, 0, 0.15);
  const pole = mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.92, 14), M(0xc9ced6, 0.16, 1));
  pole.position.set(-0.35, 0.6, 0.15);
  const dish = mesh(new THREE.CylinderGeometry(0.2, 0.16, 0.05, 18), M(0x9aa3ae, 0.35, 0.5));
  dish.position.set(-0.35, 1.06, 0.15);
  const clawA = mesh(new THREE.BoxGeometry(0.3, 0.05, 0.05), M(0x8a92a0, 0.4, 0.45));
  clawA.position.set(-0.5, 1.02, 0.15);
  clawA.rotation.z = 0.35;
  const clawB = clawA.clone();
  clawB.position.x = -0.2;
  clawB.rotation.z = -0.35;
  gMolecule.add(base, pole, dish, clawA, clawB);
  addContactShadow(gMolecule, -0.35, 0.15, 0.5, 0.4);
}

/* 公式铭牌：ATP ⇄ ADP 两版 CanvasTexture，随水解状态换牌 */
const plateTexATP = makeLabelTexture(['A—P~P~P', '三磷酸腺苷 · 两个高能键'], { w: 384, h: 168, accent: '#8a5a20', lineSizes: [52, 26] });
const plateTexADP = makeLabelTexture(['A—P~P ＋ Pi', '二磷酸腺苷 · 剩一个高能键'], { w: 384, h: 168, accent: '#3a5a8a', lineSizes: [46, 26] });
const plate = mesh(
  new THREE.PlaneGeometry(1.5, 0.66),
  new THREE.MeshStandardMaterial({ map: plateTexATP, roughness: 0.75 })
);
plate.position.set(1.35, 0.46, 1.15);
plate.rotation.set(0.08, -0.42, 0);
gMolecule.add(plate);
const plateFoot = mesh(new THREE.BoxGeometry(0.9, 0.05, 0.24), M(0x2e3440, 0.5, 0.3));
plateFoot.position.set(1.35, 0.06, 1.12);
gMolecule.add(plateFoot);
addContactShadow(gMolecule, 1.35, 1.12, 0.55, 0.35);

/* 氢原子补全：氨基两粒 + 核糖羟基一粒（挂 ade/rib 组，爆炸视图跟随平移） */
{
  const hMat = matCoat(0xf2f5f8, { roughness: 0.3 });
  const hGeo = new THREE.SphereGeometry(0.075, 12, 9);
  /* 氨基 N 位置 = 六元环 0 号顶点 × 1.42（与 ade 块内同一公式） */
  const aZero = TAU / 12;
  const nPos = new THREE.Vector3(Math.cos(aZero) * 0.46 * 1.42, Math.sin(aZero) * 0.46 * 1.42, 0);
  for (const s of [-1, 1]) {
    const h = mesh(hGeo, hMat);
    h.position.copy(nPos).add(new THREE.Vector3(s * 0.16, 0.12, 0.05));
    const stick = mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.2, 8), bondMat);
    stick.position.copy(nPos).add(new THREE.Vector3(s * 0.08, 0.06, 0.025));
    stick.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), h.position.clone().sub(nPos).normalize());
    ade.add(h, stick);
  }
  /* 核糖环上方一粒羟基氢 */
  const hRib = mesh(hGeo, hMat);
  hRib.position.set(0.34, 0.78, 0);
  const hRibStick = mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.16, 8), bondMat);
  hRibStick.position.set(0.34, 0.7, 0);
  rib.add(hRib, hRibStick);
}

/* 腺嘌呤六元环双键内线（三条交替短棒） */
{
  const innerMat = M(0x8894a8, 0.5, 0.08);
  for (let i = 0; i < 3; i++) {
    const e = i * 2;   /* 0-1, 2-3, 4-5 三条边 */
    const a0 = (e / 6) * TAU + TAU / 12, a1 = ((e + 1) / 6) * TAU + TAU / 12;
    const p0 = new THREE.Vector3(Math.cos(a0) * 0.34, Math.sin(a0) * 0.34, 0.05);
    const p1 = new THREE.Vector3(Math.cos(a1) * 0.34, Math.sin(a1) * 0.34, 0.05);
    const seg = mesh(new THREE.CylinderGeometry(0.02, 0.02, p0.distanceTo(p1), 6), innerMat);
    seg.position.copy(p0).add(p1).multiplyScalar(0.5);
    seg.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), p1.clone().sub(p0).normalize());
    ade.add(seg);
  }
}

/* 高能键脉冲领圈：两个 torus 套在 ~ 键中点，随 molecule.hi 呼吸 */
const collarMat = M(0xffb054, 0.4, 0.1, { emissive: 0xff7a1a, emissiveIntensity: 0.4, transparent: true, opacity: 0.85 });
const collars = [];
{
  const ys = [(0.1 + -0.34) / 2, (-0.34 + -0.78) / 2];
  ys.forEach((y) => {
    const c = mesh(new THREE.TorusGeometry(0.14, 0.03, 10, 24), collarMat);
    c.rotation.x = Math.PI / 2;
    c.position.set(0.78, y, 0);
    mol.add(c);
    collars.push(c);
  });
}

/* 爆炸视图：三段（腺嘌呤 / 核糖 / 磷酸链）沿 X 平滑拉开，标签同步跟随 */
const explodeParts = [];
function exPart(o, dx) {
  explodeParts.push({ o, bx: o.position.x, dx });
}
exPart(ade, -0.95);
exPart(rib, -0.55);
phos.groups.forEach((g) => exPart(g, 1.0));
phos.oxy.forEach((o) => exPart(o, 1.0));
exPart(phos.hi[0], 1.0);
exPart(phos.hi[1], 1.0);
collars.forEach((c) => exPart(c, 1.0));
explodeParts.forEach((p) => { p.by = p.o.position.y; p.bz = p.o.position.z; });
const molLabeled = [[mL_ade, -0.95], [mL_rib, -0.55], [mL_phos, 1.0], [mL_hi, 1.0]];
molLabeled.forEach(([o, dx]) => exPart(o, dx));

molecule.explode = false;
molecule.explodeK = 0;

function tickMoleculeExtra(dt, t) {
  /* 水解/合成动画推进期间让位（Pγ 位移由动画独占），动画结束恢复爆炸位移 */
  if (molecule.anim) return;
  const want = molecule.explode ? 1 : 0;
  molecule.explodeK += (want - molecule.explodeK) * Math.min(1, dt * 3.2);
  const e = molecule.explodeK;
  explodeParts.forEach((p) => {
    if (!p.o.visible) return;
    p.o.position.x = p.bx + p.dx * e;
    p.o.position.y = p.by;
    p.o.position.z = p.bz;
  });
  const ck = molecule.hi ? 0.5 + 0.45 * (0.5 + 0.5 * Math.sin(t * 4.5)) : 0.12;
  collarMat.emissiveIntensity = ck;
  collars.forEach((c) => { c.visible = molecule.hi || e > 0.3; });
}

/* ================= 章节 3：ATP ⇄ ADP 循环 ================= */

const capATP = mesh(new THREE.CapsuleGeometry(0.62, 1.15, 8, 18), M(0xffd257, 0.5, 0.05, { emissive: 0xcf9020, emissiveIntensity: 0.28 }));
capATP.position.set(-2.35, 1.5, 0);
const capADP = mesh(new THREE.CapsuleGeometry(0.55, 1.0, 8, 18), M(0x5f86c9, 0.55));
capADP.position.set(2.35, 1.5, 0);
gCycle.add(capATP, capADP);
const lbATP = label('ATP 充满电', '#ffd257', 0.006);
lbATP.position.set(-2.35, 2.85, 0);
const lbADP = label('ADP + Pi 放电后', '#9db9ff', 0.005);
lbADP.position.set(2.35, 2.72, 0);
gCycle.add(lbATP, lbADP);

function arcCurve(from, to, ctrl) { return new THREE.QuadraticBezierCurve3(from, ctrl, to); }
const arcUp = arcCurve(new THREE.Vector3(2.0, 2.1, 0), new THREE.Vector3(-2.0, 2.1, 0), new THREE.Vector3(0, 3.4, 0));
const arcDn = arcCurve(new THREE.Vector3(-2.0, 0.75, 0), new THREE.Vector3(2.0, 0.75, 0), new THREE.Vector3(0, -1.05, 0));
for (const [curve, color, tip] of [[arcUp, 0x7ddc8f, 1], [arcDn, 0xff9d6e, -1]]) {
  const pts = curve.getPoints(48);
  const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.85 }));
  const cone = mesh(new THREE.ConeGeometry(0.11, 0.3, 12), new THREE.MeshBasicMaterial({ color }));
  const end = pts[pts.length - 1], prev = pts[pts.length - 3];
  cone.position.copy(end);
  cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.clone().sub(prev).normalize());
  gCycle.add(line, cone);
}
const lbSyn = label('合成：ADP＋Pi＋能量 → ATP', '#8fe8a2', 0.0052);
lbSyn.position.set(0, 3.02, 0);
const lbSyn2 = label('能量来自呼吸作用 / 光合作用', '#8fe8a2', 0.004);
lbSyn2.position.set(0, 2.6, 0);
const lbHyd = label('水解：ATP → ADP＋Pi＋能量', '#ffab84', 0.0052);
lbHyd.position.set(0, -0.5, 0);
const lbHyd2 = label('能量用于肌肉收缩·神经传导·合成物质等', '#ffab84', 0.0038);
lbHyd2.position.set(0, -0.94, 0);
gCycle.add(lbSyn, lbSyn2, lbHyd, lbHyd2);

// 循环粒子
const cycleParts = { up: [], dn: [] };
{
  const gUp = M(0xa5f0b4, 0.35), gDn = M(0xffc09a, 0.35);
  for (let i = 0; i < 5; i++) {
    const pu = mesh(new THREE.SphereGeometry(0.09, 10, 8), gUp);
    const pd = mesh(new THREE.SphereGeometry(0.09, 10, 8), gDn);
    gCycle.add(pu, pd);
    cycleParts.up.push({ m: pu, off: i / 5 });
    cycleParts.dn.push({ m: pd, off: i / 5 });
  }
}

const cycle = { up: 2.2, dn: 2.2, made: 0, used: 0, tAcc: 0 };

function tickCycle(dt) {
  cycleParts.up.forEach((p) => {
    p.off = (p.off + dt * cycle.up * 0.14) % 1;
    arcUp.getPoint(p.off, p.m.position);
  });
  cycleParts.dn.forEach((p) => {
    p.off = (p.off + dt * cycle.dn * 0.14) % 1;
    arcDn.getPoint(p.off, p.m.position);
  });
  capATP.material.emissiveIntensity = 0.22 + 0.14 * Math.sin(performance.now() * 0.004) * (cycle.up / 5);
}

/* ---------- 章节 3 深化：脂膜条带 / Ca²⁺ 主动运输载体蛋白（磷酸化转运状态机）/ 电池道具 / 耗能场景 ---------- */

/* 膜条带：双层磷脂头（InstancedMesh 两叶）+ 膜芯 + 波浪尾纹，横贯下方 */
const cycleMemY = -1.9;
{
  const core = mesh(new THREE.BoxGeometry(6.4, 0.2, 1.5), M(0xc9a86a, 0.6, 0, { transparent: true, opacity: 0.5 }));
  core.position.set(0, cycleMemY, 0);
  gCycle.add(core);
  const headGeo = new THREE.SphereGeometry(0.1, 10, 8);
  const headMat = matStd(0xe8cf9a, { roughness: 0.45 });
  const perRow = 32;
  for (const side of [-1, 1]) {
    const inst = new THREE.InstancedMesh(headGeo, headMat, perRow * 2);
    const tmp = new THREE.Object3D();
    let k = 0;
    for (let i = 0; i < perRow; i++) {
      for (const z of [-0.3, 0.3]) {
        tmp.position.set(-3.05 + i * 0.2 + (z > 0 ? 0.09 : 0), cycleMemY + side * 0.17, z);
        tmp.updateMatrix();
        inst.setMatrixAt(k++, tmp.matrix);
      }
    }
    gCycle.add(inst);
  }
  /* 尾部波动纹理条（上下两片，程序化波浪线） */
  const tailTex = (() => {
    const cv = document.createElement('canvas');
    cv.width = 512; cv.height = 64;
    const ctx = cv.getContext('2d');
    ctx.clearRect(0, 0, 512, 64);
    for (let i = 0; i < 34; i++) {
      const x = 6 + i * 15;
      ctx.strokeStyle = 'rgba(150,120,80,0.6)';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.quadraticCurveTo(x + 7, 32, x + (i % 2 ? 4 : -4), 62);
      ctx.stroke();
    }
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  })();
  for (const side of [-1, 1]) {
    const tail = mesh(
      new THREE.PlaneGeometry(6.4, 0.42),
      new THREE.MeshStandardMaterial({ map: tailTex, transparent: true, roughness: 0.7, side: THREE.DoubleSide })
    );
    tail.rotation.x = -Math.PI / 2;
    tail.position.set(0, cycleMemY + side * 0.34, 0);
    gCycle.add(tail);
  }
}

/* 载体蛋白：双叶瓣放样体 + 磷酸化帽位 + Ca²⁺ 离子队列——「磷酸化转运一次」按钮的舞台 */
const pump = {
  lobeL: null, lobeR: null, capMat: null, cap: null, atpModel: null, piBall: null,
  ions: [], ionPaths: [],
  phase: 'idle', t: 0, count: 0, ionT: [],
};
{
  const g = new THREE.Group();
  g.position.set(0, cycleMemY, 0.55);
  const anchor = mesh(new THREE.CylinderGeometry(0.42, 0.5, 0.34, 20), matStd(0x8a7a5e, { roughness: 0.6 }));
  const lobeMat = matCoat(0x7a6f9d, { roughness: 0.42 });
  const lobeGeo = buildLoft(
    [{ y: 0, r: 0.06 }, { y: 0.16, r: 0.26 }, { y: 0.38, r: 0.32 }, { y: 0.62, r: 0.2 }, { y: 0.78, r: 0.06 }],
    18, { capBottom: true, capTop: false }
  );
  const pivotL = new THREE.Group();
  pivotL.position.set(-0.16, 0.17, 0);
  pivotL.rotation.z = 0.45;
  const loL = mesh(lobeGeo, lobeMat);
  loL.rotation.z = -0.25;
  pivotL.add(loL);
  const pivotR = new THREE.Group();
  pivotR.position.set(0.16, 0.17, 0);
  pivotR.rotation.z = -0.45;
  const loR = mesh(lobeGeo, lobeMat);
  loR.rotation.z = 0.25;
  pivotR.add(loR);
  /* 磷酸化帽：ATP 靠位后染橙 */
  const capMat = matStd(0x9aa3ae, { roughness: 0.5, metalness: 0.2 });
  const cap = mesh(new THREE.SphereGeometry(0.14, 14, 10, 0, TAU, 0, Math.PI / 2), capMat);
  cap.position.set(0, 0.62, 0);
  /* Ca²⁺ 离子：膜下三颗待运 + 膜上三颗已运（暗色） */
  const ionMatActive = matGlow(0x7adfff, 0.9);
  const ionMatDone = matStd(0x4a7a9d, { roughness: 0.4 });
  const ions = [];
  for (let i = 0; i < 3; i++) {
    const ion = mesh(new THREE.SphereGeometry(0.1, 12, 9), ionMatActive);
    ion.position.set(-0.7 + i * 0.24, -0.62, 0.36 + i * 0.12);
    ions.push(ion);
    g.add(ion);
    const done = mesh(new THREE.SphereGeometry(0.09, 10, 8), ionMatDone);
    done.position.set(0.85 + i * 0.26, 0.6, 0.3);
    g.add(done);
  }
  /* ATP 小模型（三球两棒）：停靠阶段飞向蛋白 */
  const atpModel = new THREE.Group();
  {
    const s1 = mesh(new THREE.SphereGeometry(0.1, 10, 8), matGlow(0xffd257, 0.5));
    const s2 = mesh(new THREE.SphereGeometry(0.09, 10, 8), matGlow(0xffb054, 0.5));
    s2.position.set(0.2, 0.1, 0);
    const s3 = mesh(new THREE.SphereGeometry(0.08, 10, 8), matGlow(0xff9d45, 0.6));
    s3.position.set(0.38, 0.2, 0);
    const b1 = mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.22, 8), M(0xaeb9c8, 0.5, 0.1));
    b1.position.set(0.1, 0.05, 0);
    b1.rotation.z = -0.45;
    const b2 = mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.2, 8), M(0xaeb9c8, 0.5, 0.1));
    b2.position.set(0.29, 0.15, 0);
    b2.rotation.z = -0.45;
    atpModel.add(s1, s2, s3, b1, b2);
    atpModel.position.set(1.7, -0.6, -0.8);
    atpModel.visible = false;
  }
  /* Pi 释放小球 */
  const piBall = mesh(new THREE.SphereGeometry(0.09, 10, 8), matGlow(0xffab84, 0.7, { transparent: true, opacity: 0.95 }));
  piBall.visible = false;
  g.add(anchor, pivotL, pivotR, cap, atpModel, piBall);
  pump.lobeL = pivotL;
  pump.lobeR = pivotR;
  pump.capMat = capMat;
  pump.cap = cap;
  pump.atpModel = atpModel;
  pump.piBall = piBall;
  pump.ions = ions;
  gCycle.add(g);
}

/* 电池道具 ×2（放样壳体 + 包皮标签 + 极帽）：ATP 满电亮 / ADP 放电暗 */
{
  const bodyGeo = buildLoft(
    [{ y: 0, r: 0.24 }, { y: 0.05, r: 0.3 }, { y: 0.8, r: 0.3 }, { y: 0.85, r: 0.24 }, { y: 0.87, r: 0.12 }],
    22, { capBottom: true, capTop: false }
  );
  for (const [x, name, sub, tint, charge, linkUp] of [
    [-2.85, 'ATP', '充满电', 0xffd257, 1, true],
    [2.85, 'ADP', '放完电', 0x5f86c9, 0.18, false],
  ]) {
    const g = new THREE.Group();
    g.position.set(x, 0, 1.05);
    /* 放样壳体走纯色（无 UV 不贴图），标签由带 UV 的 wrap 圆柱承担 */
    const body = mesh(bodyGeo, matStd(tint, { roughness: 0.5 }));
    const wrap = mesh(new THREE.CylinderGeometry(0.302, 0.302, 0.72, 22, 1, true), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5, metalness: 0.05, map: batteryLabelTexture(name, sub, tint, charge) }));
    const tip = mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.1, 14), M(0xb9bfc7, 0.3, 0.85));
    tip.position.y = 0.92;
    const skirt = mesh(new THREE.TorusGeometry(0.3, 0.03, 10, 26), M(0x39424e, 0.5, 0.4));
    skirt.rotation.x = Math.PI / 2;
    skirt.position.y = 0.05;
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({
      map: makeGlowTexture(linkUp ? '255,210,87' : '143,180,255'), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0,
    }));
    halo.position.y = 0.45;
    halo.scale.set(0.02, 0.02, 1);
    g.add(body, wrap, tip, skirt, halo);
    if (linkUp) cycle.battATP = { halo };
    else cycle.battADP = { halo };
    gCycle.add(g);
    const ped = mesh(new THREE.BoxGeometry(0.9, 0.14, 0.9), matStd(0x3d4656, { roughness: 0.55, metalness: 0.15 }));
    ped.position.set(x, -0.03, 1.05);
    gCycle.add(ped);
    const sh = addContactShadow(gCycle, x, 1.05, 0.55, 0.4);
    sh.position.y = 0.045;
  }
}

/* 耗能场景行：肌纤维块 + 神经元（Tube 放样轴突），水解速率滑杆驱动其辉光 */
const consumers = [];
{
  const muscle = mesh(
    new THREE.BoxGeometry(1.0, 0.5, 0.5),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6, metalness: 0.05, map: muscleStripeTexture(), emissive: 0xff6a5a, emissiveIntensity: 0.1 })
  );
  muscle.position.set(-1.6, -1.75, -1.6);
  muscle.rotation.y = 0.3;
  gCycle.add(muscle);
  consumers.push(muscle);
  const soma = mesh(new THREE.SphereGeometry(0.26, 16, 12), matCoat(0x8a6f9d, { roughness: 0.4, emissive: 0xcf90ff, emissiveIntensity: 0.1 }));
  soma.position.set(1.55, -1.8, -1.6);
  const axonCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(1.78, -1.72, -1.6),
    new THREE.Vector3(2.25, -1.62, -1.4),
    new THREE.Vector3(2.55, -1.38, -1.7),
    new THREE.Vector3(2.75, -1.15, -1.5),
  ]);
  const axon = new THREE.Mesh(
    new THREE.TubeGeometry(axonCurve, 24, 0.05, 10, false),
    matStd(0x9d8ab8, { roughness: 0.5, emissive: 0xcf90ff, emissiveIntensity: 0.1 })
  );
  const tipA = mesh(new THREE.SphereGeometry(0.07, 10, 8), matStd(0x9d8ab8, { roughness: 0.5, emissive: 0xcf90ff, emissiveIntensity: 0.12 }));
  tipA.position.set(2.75, -1.15, -1.5);
  const tipB = tipA.clone();
  tipB.position.set(2.57, -1.28, -1.75);
  tipB.scale.setScalar(0.8);
  gCycle.add(soma, axon, tipA, tipB);
  consumers.push(soma, axon);
}

/* 「磷酸化转运一次」状态机：dock（ATP 靠位）→ phos（染橙 · ADP 弹走）→ shift（叶瓣翻转 · Ca²⁺ 泵过膜）→ release（Pi 脱落） */
function startPump() {
  if (pump.phase !== 'idle') return;
  pump.phase = 'dock';
  pump.t = 0;
  pump.atpModel.visible = true;
}

const pumpIonPath = new THREE.CatmullRomCurve3([
  new THREE.Vector3(-0.24, cycleMemY - 0.52, 0.42),
  new THREE.Vector3(-0.1, cycleMemY - 0.1, 0.2),
  new THREE.Vector3(0.05, cycleMemY + 0.3, 0),
  new THREE.Vector3(0.18, cycleMemY + 0.72, -0.2),
  new THREE.Vector3(0.4, cycleMemY + 1.15, -0.3),
]);

function tickPump(dt) {
  if (pump.phase === 'idle') return;
  pump.t += dt;
  const k = pump.t;
  if (pump.phase === 'dock') {
    const p = Math.min(1, k / 0.9);
    const ease = p * p * (3 - 2 * p);
    pump.atpModel.position.lerpVectors(new THREE.Vector3(1.7, -0.6, -0.8), new THREE.Vector3(0.28, cycleMemY + 1.0, 0), ease);
    pump.atpModel.rotation.y = ease * 2.2;
    if (p >= 1) { pump.phase = 'phos'; pump.t = 0; }
  } else if (pump.phase === 'phos') {
    const p = Math.min(1, k / 0.7);
    pump.capMat.color.lerpColors(new THREE.Color(0x9aa3ae), new THREE.Color(0xff9d45), p);
    pump.capMat.emissive.setHex(0xcf5a1a);
    pump.capMat.emissiveIntensity = p * 0.8;
    /* ADP 部分向右上方弹开（整体模型淡出，末端 P 留在帽位） */
    pump.atpModel.position.x += dt * 1.4 * p;
    pump.atpModel.position.y += dt * 1.1 * p;
    pump.atpModel.rotation.z = p * 1.8;
    if (p >= 1) {
      pump.atpModel.visible = false;
      pump.piBall.visible = true;
      pump.piBall.position.set(0.28, cycleMemY + 1.05, 0);
      pump.phase = 'shift';
      pump.t = 0;
      pump.ionT = [0, -0.35, -0.7];
    }
  } else if (pump.phase === 'shift') {
    const p = Math.min(1, k / 1.4);
    const swing = Math.sin(p * Math.PI);
    pump.lobeL.rotation.z = 0.45 - swing * 0.75;
    pump.lobeR.rotation.z = -0.45 + swing * 0.75;
    pump.ions.forEach((ion, i) => {
      if (pump.ionT[i] < 0) { pump.ionT[i] += dt; return; }
      const q = pump.ionT[i] + dt;
      pump.ionT[i] = q;
      const tt = clamp(q / 1.1, 0, 1);
      pumpIonPath.getPoint(tt, ion.position);
      ion.material.opacity = 1;
    });
    if (p >= 1) { pump.phase = 'release'; pump.t = 0; }
  } else if (pump.phase === 'release') {
    const p = Math.min(1, k / 0.8);
    pump.piBall.position.y = cycleMemY + 1.05 + p * 0.8;
    pump.piBall.material.opacity = 1 - p;
    pump.capMat.emissiveIntensity = (1 - p) * 0.8;
    pump.capMat.color.lerpColors(new THREE.Color(0xff9d45), new THREE.Color(0x9aa3ae), p);
    pump.ions.forEach((ion, i) => {
      const q = pump.ionT[i] + dt;
      pump.ionT[i] = q;
      const tt = clamp(q / 1.1, 0, 1);
      pumpIonPath.getPoint(tt, ion.position);
      ion.material.transparent = true;
      ion.material.opacity = tt < 0.85 ? 1 : 1 - (tt - 0.85) / 0.15;
      if (tt >= 1) ion.visible = false;
    });
    if (p >= 1) {
      pump.phase = 'idle';
      pump.count++;
      pump.piBall.visible = false;
      pump.lobeL.rotation.z = 0.45;
      pump.lobeR.rotation.z = -0.45;
      pump.ions.forEach((ion, i) => {
        ion.visible = true;
        ion.position.set(-0.7 + i * 0.24, -0.62, 0.36 + i * 0.12);
      });
    }
  }
}

function tickCycleExtra(dt, t) {
  tickPump(dt);
  /* 电池/耗能道具与既有滑杆联动：合成速率点亮 ATP 电池，水解速率点亮耗能场景 */
  if (cycle.battATP) {
    const k = clamp(cycle.up / 5, 0, 1);
    cycle.battATP.halo.material.opacity = k * (0.3 + 0.15 * Math.sin(t * 3));
    cycle.battATP.halo.scale.setScalar(0.4 + k * 1.6);
  }
  if (cycle.battADP) {
    const k = clamp(cycle.dn / 5, 0, 1);
    cycle.battADP.halo.material.opacity = k * 0.18;
    cycle.battADP.halo.scale.setScalar(0.3 + k * 0.8);
  }
  const dk = clamp(cycle.dn / 5, 0, 1);
  consumers.forEach((m, i) => {
    m.material.emissiveIntensity = 0.08 + dk * (0.3 + 0.22 * Math.sin(t * 4.2 + i * 1.7));
  });
}

/* ================= 章节 4：ATP 合酶 ================= */

const mem = mesh(new THREE.BoxGeometry(9.2, 0.6, 3.6), M(0xd9b878, 0.62, 0, { transparent: true, opacity: 0.55 }));
mem.position.y = 0;
gSynth.add(mem);
// 磷脂头部示意
{
  const hm = M(0xf2d9a0, 0.5);
  for (let i = 0; i < 16; i++) {
    const s1 = mesh(new THREE.SphereGeometry(0.14, 8, 6), hm);
    s1.position.set(-4.2 + i * 0.56, 0.36, -1.2 + (i % 3) * 1.1);
    const s2 = s1.clone(); s2.position.y = -0.36;
    gSynth.add(s1, s2);
  }
}
const lbOut = label('膜间隙 · H⁺ 浓度高', '#9adfff', 0.0052);
lbOut.position.set(-3.1, 2.62, 0);
const lbIn = label('线粒体基质 · H⁺ 浓度低', '#b9c8dd', 0.0052);
lbIn.position.set(-3.1, -1.62, 0);
gSynth.add(lbOut, lbIn);

// 转子：c 环 + γ 轴 + F1 头
const rotor = new THREE.Group();
gSynth.add(rotor);
const cRing = new THREE.Group();
rotor.add(cRing);
for (let i = 0; i < 8; i++) {
  const a = (i / 8) * TAU;
  const c = mesh(new THREE.BoxGeometry(0.52, 0.52, 0.44), M(0xc4574e, 0.5));
  c.position.set(Math.cos(a) * 0.82, 0, Math.sin(a) * 0.82);
  c.rotation.y = -a;
  cRing.add(c);
}
const stalk = mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.15, 10), M(0xd9dde5, 0.4, 0.2));
stalk.position.y = 0.86;
rotor.add(stalk);
const f1 = new THREE.Group();
f1.position.y = 1.85;
rotor.add(f1);
/* β 亚基挂在独立枢轴上（α 直挂），枢轴 tilt 由转子角度按 120° 三态驱动——旋转催化的变构可视化 */
const betaPivots = [];
for (let i = 0; i < 6; i++) {
  const a = (i / 6) * TAU;
  const isBeta = i % 2 === 1;
  const sub = mesh(new THREE.CapsuleGeometry(0.3, 0.52, 6, 12), M(isBeta ? 0xe08a3c : 0x6f7d95, 0.55));
  if (isBeta) {
    const pv = new THREE.Group();
    pv.position.set(Math.cos(a) * 0.95, 0, Math.sin(a) * 0.95);
    pv.rotation.y = -a + Math.PI / 2;
    pv.add(sub);
    f1.add(pv);
    betaPivots.push(pv);
  } else {
    sub.position.set(Math.cos(a) * 0.95, 0, Math.sin(a) * 0.95);
    sub.rotation.y = -a + Math.PI / 2;
    f1.add(sub);
  }
}
const cap1 = mesh(new THREE.SphereGeometry(0.52, 18, 14), M(0x8892a5, 0.5));
cap1.scale.set(1, 0.62, 1);
cap1.position.y = 0.62;
f1.add(cap1);

// 定子臂（不旋转）
const stator1 = mesh(new THREE.BoxGeometry(0.34, 1.9, 0.34), M(0x9aa6b8, 0.55));
stator1.position.set(1.45, 1.3, 0);
const stator2 = mesh(new THREE.BoxGeometry(0.9, 0.28, 0.34), M(0x9aa6b8, 0.55));
stator2.position.set(1.0, 2.32, 0);
gSynth.add(stator1, stator2);
const aSub = mesh(new THREE.BoxGeometry(0.4, 0.72, 0.7), M(0x7a6f9d, 0.55));
aSub.position.set(1.35, 0, 0);
gSynth.add(aSub);

// H⁺ 粒子池
const protons = [];
{
  const pm = new THREE.MeshBasicMaterial({ color: 0x9adfff, transparent: true });
  for (let i = 0; i < 26; i++) {
    const p = mesh(new THREE.SphereGeometry(0.075, 8, 6), pm.clone());
    p.visible = false;
    gSynth.add(p);
    protons.push({ m: p, phase: 'idle', x: 0, y: 0, z: 0, t: 0, seed: Math.random() });
  }
}
// ADP/Pi 原料与 ATP 产物
const feeds = [];
{
  for (let i = 0; i < 6; i++) {
    const g = new THREE.Group();
    const adp = mesh(new THREE.SphereGeometry(0.1, 8, 6), new THREE.MeshBasicMaterial({ color: 0x8fb4ff }));
    const pi = mesh(new THREE.SphereGeometry(0.085, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffc38a }));
    pi.position.x = 0.24;
    g.add(adp, pi);
    g.visible = false;
    gSynth.add(g);
    feeds.push({ m: g, t: 0, active: false });
  }
}
const atpOut = [];
{
  for (let i = 0; i < 6; i++) {
    const m = mesh(new THREE.SphereGeometry(0.13, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffd257, transparent: true }));
    m.visible = false;
    gSynth.add(m);
    atpOut.push({ m, t: 0, active: false, dir: 1 });
  }
}
const synthFlash = new THREE.Sprite(new THREE.SpriteMaterial({
  map: makeGlowTexture('255,214,120'), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0,
}));
synthFlash.position.y = 1.85;
synthFlash.scale.set(0.01, 0.01, 1);
gSynth.add(synthFlash);

const synth = {
  gradient: 6, paused: false, angle: 0, spinRate: 0,
  made: 0, protonsThrough: 0, emitAcc: 0, spawnAcc: 0, feedAcc: 0, showFlow: true, flash: 0,
};

function spawnProton() {
  const p = protons.find((x) => x.phase === 'idle');
  if (!p) return;
  p.phase = 'approach';
  p.x = (Math.random() - 0.5) * 7;
  p.z = (Math.random() - 0.5) * 2.6;
  p.y = 2.9;
  p.t = 0;
  p.m.visible = synth.showFlow;
  p.m.position.set(p.x, p.y, p.z);
  p.m.material.opacity = 1;
}

function tickSynth(dt) {
  const rate = synth.paused ? 0 : synth.gradient * 0.85 * (synth.uncoupled ? 0.35 : 1);   // 每秒 H⁺ 数；解偶联时质子走漏、转速下滑
  synth.spawnAcc += dt * rate;
  while (synth.spawnAcc >= 1) { spawnProton(); synth.spawnAcc -= 1; }
  synth.spinRate = synth.paused ? 0 : clamp(rate * 0.55, 0.5, 5.2);
  synth.angle += dt * synth.spinRate;
  rotor.rotation.y = synth.angle;
  synth.emitAcc += dt * synth.spinRate / TAU;                     // 每转 1 圈产 3 个 ATP（示意）
  while (synth.emitAcc >= 1 / 3) {
    synth.emitAcc -= 1 / 3;
    const a = atpOut.find((x) => !x.active);
    if (a) {
      a.active = true; a.t = 0;
      a.dir = Math.random() > 0.5 ? 1 : -1;
      a.m.visible = true;
      a.m.position.set(0, 1.85, 0);
      synth.made++;
      synth.flash = 1;
    }
  }
  synth.feedAcc += dt * 0.7;
  if (synth.feedAcc >= 1) {
    synth.feedAcc = 0;
    const f = feeds.find((x) => !x.active);
    if (f) { f.active = true; f.t = 0; f.m.visible = true; }
  }
  // 粒子推进
  const funnel = new THREE.Vector3(1.18, 0.55, 0);
  protons.forEach((p) => {
    if (p.phase === 'idle') return;
    p.t += dt;
    const m = p.m;
    if (p.phase === 'approach') {
      const tgt = funnel;
      const k = Math.min(1, dt * 1.6);
      m.position.lerp(tgt, k);
      if (m.position.distanceTo(tgt) < 0.14) { p.phase = 'through'; p.t = 0; }
    } else if (p.phase === 'through') {
      const k = p.t / 0.85;
      const ang = synth.angle * 2 + p.seed * TAU;
      m.position.set(Math.cos(ang) * 0.6, 0.45 - k * 1.45, Math.sin(ang) * 0.6);
      if (k >= 1) { p.phase = 'exit'; p.t = 0; synth.protonsThrough++; }
    } else {
      const k = Math.min(1, p.t / 0.9);
      m.position.y = -1.05 - k * 0.9;
      m.material.opacity = 1 - k;
      if (k >= 1) { p.phase = 'idle'; m.visible = false; }
    }
    m.visible = m.visible && synth.showFlow || p.phase === 'through';
  });
  feeds.forEach((f) => {
    if (!f.active) return;
    f.t += dt;
    const k = f.t / 1.4;
    if (k >= 1) { f.active = false; f.m.visible = false; return; }
    const ang = synth.angle + Math.PI / 2;
    f.m.position.set(Math.cos(ang) * 1.9 * (1 - k), 1.85 + (1 - k) * -1.6 * k, Math.sin(ang) * 1.9 * (1 - k));
    f.m.visible = k < 0.92;
  });
  atpOut.forEach((a) => {
    if (!a.active) return;
    a.t += dt;
    const k = a.t / 1.1;
    if (k >= 1) { a.active = false; a.m.visible = false; return; }
    const ang = synth.angle + a.dir * Math.PI / 3;
    a.m.position.set(Math.cos(ang) * (1.1 + k * 1.6), 1.85 + k * 1.1, Math.sin(ang) * (1.1 + k * 1.6));
    a.m.material.opacity = 1 - k;
  });
  synth.flash = Math.max(0, synth.flash - dt * 2.2);
  synthFlash.material.opacity = synth.flash * 0.75;
  synthFlash.scale.set(0.5 + synth.flash * 1.4, 0.5 + synth.flash * 1.4, 1);
}

/* ---------- 章节 4 深化：磷脂双分子层 / H⁺ 结合位点 / γ 弯轴与配重 / β 三态变构 / 解偶联剂漏流 ---------- */

/* 双分子层：mem 盒两侧各一叶磷脂头（InstancedMesh）+ 波浪缘管；compartment 渐变板标出膜两侧 */
{
  const headGeo = new THREE.SphereGeometry(0.14, 10, 8);
  const headMat = matStd(0xe8cf9a, { roughness: 0.5 });
  const perRow = 44;
  for (const side of [-1, 1]) {
    const inst = new THREE.InstancedMesh(headGeo, headMat, perRow * 2);
    const tmp = new THREE.Object3D();
    let k = 0;
    for (let i = 0; i < perRow; i++) {
      for (const z of [-0.55, 0.55]) {
        tmp.position.set(-4.25 + i * 0.2 + (z > 0 ? 0.1 : 0), side * 0.42, z);
        tmp.updateMatrix();
        inst.setMatrixAt(k++, tmp.matrix);
      }
    }
    gSynth.add(inst);
  }
  /* 膜面上下缘的波浪轮廓管（CatmullRom 曲线放样 Tube） */
  const edgeMat = matStd(0xc9a86a, { roughness: 0.6 });
  for (const z of [-0.8, 0.8]) {
    const pts = [];
    for (let i = 0; i <= 14; i++) {
      const x = -4.5 + (i / 14) * 9;
      pts.push(new THREE.Vector3(x, Math.sin(i * 1.35) * 0.07, z));
    }
    const tube = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 42, 0.035, 8, false),
      edgeMat
    );
    gSynth.add(tube);
  }
  for (const [side, c1, c2] of [
    [1, 'rgba(122,223,255,0.16)', 'rgba(122,223,255,0.01)'],
    [-1, 'rgba(200,180,150,0.12)', 'rgba(200,180,150,0.01)'],
  ]) {
    const pnl = new THREE.Mesh(
      new THREE.PlaneGeometry(8.8, 1.7),
      new THREE.MeshBasicMaterial({ map: gradientPanelTexture(c1, c2), transparent: true, depthWrite: false, side: THREE.DoubleSide })
    );
    pnl.position.set(0, side * 1.45, -2.2);
    gSynth.add(pnl);
  }
}

/* c 环 H⁺ 结合位点：每个亚基外缘一粒辉光点，质子穿行时按转子角对应点亮 */
const cSiteMats = [];
const siteFlash = new Array(8).fill(0);
cRing.children.forEach((c, i) => {
  const a = (i / 8) * TAU;
  const s = mesh(new THREE.SphereGeometry(0.055, 10, 8), matGlow(0x9adfff, 0.25));
  s.position.set(Math.cos(a) * 1.06, 0.26, Math.sin(a) * 1.06);
  cRing.add(s);
  cSiteMats.push(s.material);
});

/* γ 轴上段弯轴 + 偏心配重：伸入 F₁ 头内的曲轴，随转子同步旋转 */
{
  const crankCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.5, 0),
    new THREE.Vector3(0.07, 1.1, 0.05),
    new THREE.Vector3(-0.08, 1.7, -0.04),
    new THREE.Vector3(0, 2.12, 0),
  ]);
  const crank = new THREE.Mesh(
    new THREE.TubeGeometry(crankCurve, 32, 0.06, 10, false),
    matStd(0xd9dde5, { roughness: 0.3, metalness: 0.45 })
  );
  const counterweight = mesh(new THREE.BoxGeometry(0.16, 0.3, 0.22), M(0x8892a5, 0.4, 0.5));
  counterweight.position.set(0.1, 1.32, 0.06);
  rotor.add(crank, counterweight);
}

/* δ/ε 柄小件：定子臂顶端与 F₁ 侧壁之间的连接件 */
{
  const delta = mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.34, 10), matStd(0x8a94a8, { roughness: 0.45, metalness: 0.3 }));
  delta.position.set(1.32, 2.06, 0);
  delta.rotation.z = 0.5;
  const epsilon = mesh(new THREE.SphereGeometry(0.09, 12, 9), matStd(0x7a6f9d, { roughness: 0.5 }));
  epsilon.position.set(1.14, 2.2, 0);
  gSynth.add(delta, epsilon);
}

/* 解偶联剂：H⁺ 经膜上旁路直接回流（不经 c 环），转子降速、ATP 减产 */
const leakPros = [];
{
  const lm = new THREE.MeshBasicMaterial({ color: 0x9adfff, transparent: true });
  for (let i = 0; i < 6; i++) {
    const p = mesh(new THREE.SphereGeometry(0.07, 8, 6), lm.clone());
    p.visible = false;
    gSynth.add(p);
    leakPros.push({ m: p, t: -1, x: 0 });
  }
}
let leakAcc = 0;

const BETA_STATES = [[0.42, 0.12], [0.0, 0.0], [-0.3, -0.1]];   /* 张开 / 半合 / 收紧 */

function tickSynthExtra(dt) {
  /* β 三态变构：转子每 120° 推进一档，三个 β 相位错开 */
  const step = Math.floor((((synth.angle % TAU) + TAU) % TAU) / (TAU / 3));
  betaPivots.forEach((pv, i) => {
    const st = BETA_STATES[(((step - i) % 3) + 3) % 3];
    pv.rotation.z += (st[0] - pv.rotation.z) * Math.min(1, dt * 6);
    pv.rotation.x += (st[1] - pv.rotation.x) * Math.min(1, dt * 6);
  });
  /* 结合位点闪光：质子刚进入穿膜段时点亮对应角度位点 */
  const idx = Math.floor((((synth.angle % TAU) + TAU) % TAU) / (TAU / 8)) % 8;
  protons.forEach((p) => {
    if (p.phase === 'through' && p.t < 0.09) siteFlash[idx] = 1;
  });
  for (let i = 0; i < 8; i++) {
    siteFlash[i] = Math.max(0, siteFlash[i] - dt * 2.6);
    cSiteMats[i].emissiveIntensity = 0.22 + siteFlash[i] * 1.9;
  }
  /* 解偶联漏流粒子：膜上远离合酶的位置直落穿膜 */
  if (synth.uncoupled && !synth.paused) {
    leakAcc += dt * 1.6;
    while (leakAcc >= 1) {
      leakAcc -= 1;
      const slot = leakPros.find((x) => x.t < 0);
      if (slot) {
        slot.t = 0;
        slot.x = (Math.random() > 0.5 ? 1 : -1) * (1.9 + Math.random() * 2.2);
        slot.m.visible = true;
        slot.m.material.opacity = 0.95;
      }
    }
  }
  leakPros.forEach((p) => {
    if (p.t < 0) return;
    p.t += dt;
    const k = p.t / 1.3;
    if (k >= 1) { p.t = -1; p.m.visible = false; return; }
    p.m.position.set(p.x + Math.sin(p.t * 5) * 0.04, 2.2 - k * 4.4, Math.sin(p.x * 3) * 0.5);
    p.m.material.opacity = k < 0.8 ? 0.95 : 0.95 * (1 - k) / 0.2;
  });
}

/* ---------------- 章节定义 ---------------- */

const ctl = createControlsPanel(document.getElementById('controls'));
let activeSectionId = null;
let activeCtl = null;

const hud = makeHUD(document.getElementById('lcData'), [['a', '状态'], ['b', '读数'], ['c', '补充']]);
hud.visibleNow = false;

function enterDefaults() {
  showGroup(gFirefly);
  hud.visibleNow = false;
  amb.intensity = 1.05;
  key.intensity = 1.9;
  resetDropper();
  setBath(false);
}

const SECTIONS = [
  {
    id: 'firefly',
    title: '萤火虫为什么能发光',
    html: `<p>把萤火虫的发光器捣碎做成研磨液，加入水后荧光就熄灭了；但加入某些物质又能让它<b>重新发光</b>。</p>
<p>经典实验对照：① 加蒸馏水 → 不亮；② 加葡萄糖 → 不亮；③ 加 <span class="hl">ATP</span> → 亮了！④ 把研磨液煮沸再加 ATP → 仍不亮（酶已高温失活）。</p>
<p>结论：萤火虫发光消耗的直接能源是 <span class="hl">ATP</span>，而不是葡萄糖——葡萄糖里的能量必须先经呼吸作用转移到 ATP 中，才能被生命活动直接利用。所以 ATP 被称为细胞的能量“货币”。</p>
<p>动手：先点「研磨提取」把发光器捣碎出提取液，再逐一点「注入」——滴管会把试剂送到管口；打开「暗场」观察谁在发光，「水浴加热」会点燃酒精灯煮沸 ④ 号管。</p>`,
    enter() {
      enterDefaults();
      resetFirefly();
      app.setCamera([0.3, 2.7, 9.6], [0, 1.0, 0]);
      hud.visibleNow = true;
      hud.set('c', '对照实验：单一变量（注入物不同）');
      ctl.clear();
      ctl.button({ label: '研磨提取', onClick: () => startGrind() });
      ctl.toggle({
        label: '水浴加热（④ 号管）', value: false,
        onChange: (v) => setBath(v),
      });
      ctl.sep();
      VIALS.forEach((v, i) => {
        ctl.button({ label: `注入${v.name}`, onClick: () => queueInject(i) });
        if (i === 1) ctl.sep();
      });
      ctl.sep();
      ctl.toggle({
        label: '暗场', value: false,
        onChange: (v) => { amb.intensity = v ? 0.14 : 1.05; key.intensity = v ? 0.3 : 1.9; },
      });
      ctl.button({ label: '重置', onClick: () => { resetFirefly(); resetDropper(); } });
      firefly.updateHud = () => {
        hud.set('a', `已注入 ${firefly.injected} / 4 管`);
        const lit = VIALS.map((v) => (v.lit > 0.25 ? '✦ 亮' : '—')).join('　');
        hud.set('b', lit);
      };
    },
  },
  {
    id: 'molecule',
    title: 'ATP 的结构',
    html: `<p>ATP（三磷酸腺苷）的结构简式：<span class="hl">A—P~P~P</span>。</p>
<p>其中 A = <b>腺苷</b>（腺嘌呤 + 核糖），P = 磷酸基团。<b>“~”代表特殊化学键</b>——水解时释放的能量远多于普通化学键（结构式中两个 ~）。</p>
<p>远离腺苷的那个特殊化学键最容易断裂：水解后释放能量，生成 <b>ADP + Pi</b>。点「💧 水解」看末端磷酸基团带着能量飞走，再点「⚡ 重新合成」把它接回去。</p>
<p>还可以打开「爆炸视图」把腺嘌呤、核糖、磷酸链三段拆开端详；台前的铭牌会随水解状态换成 ADP 版式。</p>`,
    enter() {
      enterDefaults();
      showGroup(gMolecule);
      setHydrolyzed(false);
      phos.groups[2].position.set(0, 0, 0);
      molecule.anim = null;
      molecule.explode = false;
      molecule.explodeK = 0;
      app.setCamera([0.35, 1.35, 5.9], [0, 1.3, 0]);
      hud.visibleNow = true;
      ctl.clear();
      ctl.toggle({
        label: '自转', value: true,
        onChange: (v) => { molecule.spin = v; },
      });
      ctl.toggle({
        label: '高亮特殊化学键', value: true,
        onChange: (v) => { molecule.hi = v; },
      });
      ctl.sep();
      ctl.toggle({
        label: '爆炸视图（拆三段）', value: false,
        onChange: (v) => { molecule.explode = v; },
      });
      ctl.button({ label: '聚焦腺苷', onClick: () => vfx.flyTo([-1.6, 2.6, 4.0], [-1.1, 1.7, 0], 0.9) });
      ctl.button({ label: '聚焦磷酸链', onClick: () => vfx.flyTo([2.6, 0.8, 4.6], [1.4, -0.1, 0], 0.9) });
      ctl.button({ label: '回到全貌', onClick: () => app.setCamera([0.35, 1.35, 5.9], [0, 1.3, 0]) });
      const hb = ctl.button({
        label: '💧 水解',
        onClick: () => {
          if (molecule.anim) return;
          if (!molecule.hydrolyzed) {
            molecule.anim = { kind: 'out', t: 0 };
            molecule.count++;
            molecule.spin = false;
            spinTgl.set(false);
            hb.textContent = '⚡ 重新合成';
          } else {
            molecule.anim = { kind: 'in', t: 0 };
            hb.textContent = '💧 水解';
          }
        },
      });
      const spinTgl = { set(v) { molecule.spin = v; } };
      molecule.updateHud = () => {
        hud.set('a', molecule.hydrolyzed ? 'ADP ＋ Pi' : 'ATP');
        hud.set('b', molecule.hydrolyzed ? '剩余特殊化学键 1 个' : '特殊化学键 2 个');
        hud.set('c', `已演示水解 ${molecule.count} 次`);
      };
    },
  },
  {
    id: 'cycle',
    title: 'ATP 与 ADP 的相互转化',
    html: `<p>ATP 与 ADP 在活细胞中不停顿地循环：<b>水解</b>（ATP → ADP＋Pi＋能量）为各项生命活动供能；<b>合成</b>（ADP＋Pi＋能量 → ATP）把呼吸作用 / 光合作用释放的能量重新“存进电池”。</p>
<p>这个转化<b>时刻不停地发生且处于动态平衡</b>：细胞内 ATP 含量很少，但转化极其迅速——成年人一天转化的 ATP 总量可达数十千克。</p>
<p>分别拖动「合成速率」「水解速率」两个滑杆：当两者相等时，系统处于动态平衡——这正是“货币”流通的常态。</p>
<p>下方是耗能现场：点「磷酸化转运一次」，看 ATP 把末端磷酸基团交给载体蛋白，蛋白构象随之翻转，把钙离子搬去膜的另一侧；肌纤维与神经元也会随水解速率一起亮起来。</p>`,
    enter() {
      enterDefaults();
      showGroup(gCycle);
      app.setCamera([0, 0.9, 10.0], [0, 0.15, 0]);
      hud.visibleNow = true;
      ctl.clear();
      ctl.slider({
        label: '合成速率', min: 0, max: 5, step: 0.1, value: cycle.up,
        fmt: (v) => v.toFixed(1),
        onInput: (v) => { cycle.up = v; },
      });
      ctl.slider({
        label: '水解速率', min: 0, max: 5, step: 0.1, value: cycle.dn,
        fmt: (v) => v.toFixed(1),
        onInput: (v) => { cycle.dn = v; },
      });
      ctl.sep();
      ctl.button({ label: '磷酸化转运一次', onClick: () => startPump() });
      cycle.updateHud = () => {
        const d = cycle.up - cycle.dn;
        hud.set('a', Math.abs(d) < 0.2 ? '动态平衡' : d > 0 ? 'ATP 倾向积累' : 'ATP 供不应求');
        hud.set('b', `合成 ${Math.round(cycle.made)} 次 / 水解 ${Math.round(cycle.used)} 次`);
        hud.set('c', '细胞内 ATP 含量少 · 转化极快');
      };
    },
  },
  {
    id: 'synthase',
    title: 'ATP 合酶',
    html: `<p>合成 ATP 的主力是一台“分子马达”——<span class="hl">ATP 合酶</span>，嵌在线粒体内膜上。</p>
<p>它由嵌膜的 <b>F₀（c 环）</b> 和凸出基质的 <b>F₁ 头部（α₃β₃）</b> 组成：H⁺ 顺浓度梯度从膜间隙经 F₀ 回到基质，像水流推动水轮机一样<b>驱动 c 环与中心轴（γ）旋转</b>；γ 轴的扭动让 β 亚基循环变构，把 ADP＋Pi 合成 ATP——这就是<b>旋转催化</b>。</p>
<p>拖动「H⁺ 浓度梯度」加大质子流，看转速与 ATP 产量如何上升。</p>
<p>试试打开「解偶联剂」：质子改走膜上旁路直接溜回基质，马达失去推力，转速与产量一起掉下来。</p>`,
    enter() {
      enterDefaults();
      showGroup(gSynth);
      synth.made = 0; synth.protonsThrough = 0; synth.angle = 0;
      synth.uncoupled = false;
      leakPros.forEach((p) => { p.t = -1; p.m.visible = false; });
      app.setCamera([3.6, 2.3, 7.8], [0, 0.9, 0]);
      hud.visibleNow = true;
      ctl.clear();
      ctl.slider({
        label: 'H⁺ 浓度梯度', min: 1, max: 10, step: 1, value: synth.gradient,
        fmt: (v) => '×' + v,
        onInput: (v) => { synth.gradient = v; },
      });
      ctl.toggle({
        label: '暂停旋转', value: false,
        onChange: (v) => { synth.paused = v; },
      });
      ctl.toggle({
        label: '显示 H⁺ 流', value: true,
        onChange: (v) => {
          synth.showFlow = v;
          protons.forEach((p) => { if (p.phase !== 'through') p.m.visible = v && p.phase !== 'idle'; });
        },
      });
      ctl.sep();
      ctl.toggle({
        label: '解偶联剂（H⁺ 直接回流）', value: false,
        onChange: (v) => { synth.uncoupled = v; },
      });
      synth.updateHud = () => {
        hud.set('a', `转速 ≈ ${(synth.spinRate / TAU).toFixed(1)} 圈/秒`);
        hud.set('b', `累计 ATP ${synth.made} 个 · H⁺ 通过 ${synth.protonsThrough}`);
        hud.set('c', '质子流 → 旋转 → 变构合成');
      };
    },
  },
  {
    id: 'quiz',
    title: '随堂检测',
    html: `<p>5 道选择题，检验一下本节课的掌握情况。答完可重新开始。</p>`,
    enter() {
      enterDefaults();
      showGroup(gMolecule);
      molecule.spin = true; molecule.hi = true;
      molecule.explode = false;
      molecule.explodeK = 0;
      app.setCamera([0.35, 1.35, 5.9], [0, 1.3, 0]);
      ctl.clear();
      hud.visibleNow = false;
      showQuiz();
    },
  },
];

/* ---------------- 随堂检测 ---------------- */

const QUIZ = [
  {
    q: '萤火虫发光器离体实验中，能让研磨组织重新发光的物质是？',
    opts: ['葡萄糖', 'ATP', '蛋白质', '蒸馏水'],
    a: 1,
    ex: '发光直接消耗的是 ATP 这类高能物质；葡萄糖里储存的能量必须先经过呼吸作用的转移，才能被各项生命活动拿来直接使用。',
  },
  {
    q: 'ATP 结构简式 A—P~P~P 中的“~”代表？',
    opts: ['普通化学键', '特殊化学键，水解释放大量能量', '氢键', '肽键'],
    a: 1,
    ex: '“~”是特殊化学键，其水解释放的能量远多于普通化学键，ATP 结构式中有两个这样的键。',
  },
  {
    q: 'ATP 水解的产物是？',
    opts: ['ADP ＋ Pi ＋ 能量', 'AMP ＋ 能量', '腺苷 ＋ 3 个磷酸', 'CO₂ 和 H₂O'],
    a: 0,
    ex: '远离腺苷的特殊化学键断裂，ATP 水解生成 ADP（二磷酸腺苷）、Pi（游离磷酸）并释放能量。',
  },
  {
    q: '绿色植物体内，合成 ATP 的能量来源是？',
    opts: ['只有呼吸作用', '只有光合作用', '光合作用和呼吸作用', 'ATP 自身水解'],
    a: 2,
    ex: '光合作用（光反应）与呼吸作用都能把能量转移到 ATP 中；动物与人体则只能靠呼吸作用合成 ATP。',
  },
  {
    q: '驱动 ATP 合酶（F₀F₁-ATPase）旋转的直接动力是？',
    opts: ['电子传递', 'H⁺ 顺浓度梯度通过 F₀', 'ADP 与 Pi 的碰撞', '葡萄糖氧化放热'],
    a: 1,
    ex: '线粒体内膜两侧 H⁺ 浓度差（跨膜质子动力势）驱动 H⁺ 经 F₀ 回流，推动 c 环与 γ 轴旋转，β 亚基循环变构合成 ATP。',
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

/* ---------------- 主循环 ---------------- */

app.onFrame((dt, t) => {
  hud.el.style.display = hud.visibleNow ? '' : 'none';
  accSecs.data.classList.toggle('acc-empty', !hud.visibleNow);   /* 读数隐藏时数据块一并收走 */
  firefly.t = t;
  if (activeSectionId === 'firefly') {
    tickFirefly(dt);
    tickFireflyExtra(dt, t);
    if (firefly.updateHud) firefly.updateHud();
  } else if (activeSectionId === 'molecule' || activeSectionId === 'quiz') {
    tickMolecule(dt, t);
    tickMoleculeExtra(dt, t);
    if (molecule.updateHud && hud.visibleNow) molecule.updateHud();
  } else if (activeSectionId === 'cycle') {
    cycle.made += dt * cycle.up * 0.5;
    cycle.used += dt * cycle.dn * 0.5;
    tickCycle(dt);
    tickCycleExtra(dt, t);
    cycle.tAcc += dt;
    if (cycle.tAcc > 0.25 && cycle.updateHud) { cycle.tAcc = 0; cycle.updateHud(); }
  } else if (activeSectionId === 'synthase') {
    tickSynth(dt);
    tickSynthExtra(dt);
    if (synth.updateHud) synth.updateHud();
  }
});

/* ---------------- 启动 ---------------- */

loader.hide();
initLayoutShell();

/* ================= 三栏布局驱动（左栏章节列表 / 右栏详解联动 / 栏折叠 / 专注模式） ================= */

const chapNav = document.getElementById('chapNav');
const chapCount = document.getElementById('chapCount');
const detailNo = document.getElementById('detailNo');
const detailTitle = document.getElementById('detailTitle');
const lessonEl = document.getElementById('lesson');
const detailBody = document.getElementById('detailBody');
const controlsEl = document.getElementById('controls');
let chapterIdx = 0;
let activeCleanup = null;   /* 随堂检测面板等章内浮动产物的清理钩子 */

/* 5 章竖排按钮：序号 + 标题，点击切章，当前章 .on 高亮 */
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
  if (activeCleanup) { activeCleanup(); activeCleanup = null; }
  activeSectionId = sec.id;
  sec.enter();
  /* 本章无控件时整块手风琴收走（不动用户的手风琴偏好；数据块由帧循环按 visibleNow 同步） */
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
const atpShell = document.getElementById('atpShell');
const focusBtn = document.getElementById('focusBtn');

const FOLD_KEY = { l: 'atp.foldL', r: 'atp.foldR' };
let foldL = false;
let foldR = false;
let focusSaved = null; /* 进入专注模式前的独立折叠状态 [foldL, foldR]，退出时恢复 */

try {
  foldL = localStorage.getItem(FOLD_KEY.l) === '1';
  foldR = localStorage.getItem(FOLD_KEY.r) === '1';
} catch (e) { /* localStorage 不可用（隐私模式等）时仅本次会话内生效 */ }

function applyFold() {
  atpShell.classList.toggle('fold-l', foldL);
  atpShell.classList.toggle('fold-r', foldR);
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
  atpShell.classList.toggle('focus-mode', on);
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

const ACC_KEYS = { lesson: 'atp.accLesson', controls: 'atp.accControls', data: 'atp.accData' };
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

function initLayoutShell() { /* 折叠/手风琴监听已在模块顶层就位，占位保证启动段语义清晰 */ }

window.__eduSections = { select: selectChapter };
/* 调试句柄（自动化验收/像素级自查用） */
window.__labDebug = { vfx, app };
selectChapter(0);
