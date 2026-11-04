/* EduLab · 水循环三维沙盘（water）· Micro 级深改
 * =====================================================================
 * 真·三栏布局：左课程大纲（11 章）/ 中剖面沙盘舞台 / 右知识点详解。
 * 折叠体系：左右栏 28px 竖条 × 数据图窗 40px 圆徽标 × 右栏三块手风琴
 *           × 专注模式（双栏同折）× 课堂模式（舞台放大 + 讲解浮层）——localStorage 记忆。
 * 沙盘叙事：海洋（波浪+岸线泡沫）— 海滩 — 城市（楼群窗纹/路灯/行道树）—
 *           大坝水库（弧形坝/闸墩/泄洪台阶/闸门吊塔）— 高山（V 形谷/雪线/山谷冰川/针叶林）
 *           — 内陆高原 — 内陆湖（季节冰壳）；河口三角洲、跨流域调水渠、增雨飞机、气象站。
 * 粒子系统：蒸发 / 云雨 / 六环节粒子 / 泥沙 / 增雨催化，可按环节 dim。
 * 物理内核：下渗-径流分配模型 + 两库 Nash 瞬时单位线流量过程线 + 水量平衡收支。
 * ===================================================================== */
import {
  THREE, DEG, TAU, clamp,
  createApp, createControlsPanel, makeLoader, loadAll, loadTexture, makeHUD,
  makeTextSprite, setSpriteText, makeGlowTexture,
} from './edu-core.js';
import {
  attachVFX, makeStudioEnvironment,
  matStd, matCoat, matSheen, matGlow, ghostify, PAL, fbm3,
} from './edu-vfx.js';

/* ---------------- 舞台与工艺接入 ---------------- */

const stage = document.getElementById('stage');
const loader = makeLoader(stage, '正在构建水循环沙盘…');

const app = createApp({
  container: stage,
  fov: 40, near: 0.1, far: 600,
  cameraPos: [1, 17, 37],
  target: [1, 0.5, 0],
  minDistance: 4, maxDistance: 90,
  exposure: 1.05,
  keepBackground: true,
});
const { scene, camera, controls } = app;
const vfx = attachVFX(app, 'illus');
scene.environment = makeStudioEnvironment(app.renderer);

scene.add(new THREE.HemisphereLight(0xcfe4f4, 0x63553c, 0.55));
const sunLight = new THREE.DirectionalLight(0xfff1dc, 1.75);
sunLight.position.set(-16, 24, 12);
scene.add(sunLight);
const fillLight = new THREE.DirectionalLight(0xa9c4e0, 0.3);
fillLight.position.set(14, 10, -10);
scene.add(fillLight);

/* ---------------- 工艺基建 ---------------- */

const canvasTex = (w, h, draw, opts = {}) => {
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  draw(cv.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(cv);
  if (!opts.linear) tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
};

/* 轻量几何合并（toNonIndexed 后拼接 position/normal/uv）——省 draw call 的主力工具 */
function mergeGeoms(geos) {
  const parts = geos.map((g) => (g.index ? g.toNonIndexed() : g));
  const total = parts.reduce((n, g) => n + g.attributes.position.count, 0);
  const pos = new Float32Array(total * 3);
  const nor = new Float32Array(total * 3);
  const uv = new Float32Array(total * 2);
  let vo = 0, to = 0;
  for (const g of parts) {
    if (g.attributes.position) pos.set(g.attributes.position.array, vo * 3);
    if (g.attributes.normal) nor.set(g.attributes.normal.array, vo * 3);
    if (g.attributes.uv) uv.set(g.attributes.uv.array, to * 2);
    vo += g.attributes.position.count;
    to += g.attributes.position.count;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  out.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return out;
}
/* 平移缩放一段几何（合并前摆位） */
function placeGeo(geo, x, y, z, s = 1, ry = 0) {
  geo.scale(s, s, s);
  if (ry) geo.rotateY(ry);
  geo.translate(x, y, z);
  return geo;
}

/* 接触阴影贴片（道具落地的重量感来源） */
function shadowPatch(w, d, opacity = 0.36) {
  const tex = canvasTex(256, 256, (ctx) => {
    const g = ctx.createRadialGradient(128, 128, 10, 128, 128, 126);
    g.addColorStop(0, 'rgba(16,12,8,' + opacity + ')');
    g.addColorStop(0.62, 'rgba(16,12,8,' + opacity * 0.5 + ')');
    g.addColorStop(1, 'rgba(16,12,8,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
  }, { linear: true });
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(w, d),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false })
  );
  m.rotation.x = -Math.PI / 2;
  m.renderOrder = 2;
  return m;
}

/* 场景色板（PAL 延展：水沙盘地貌族；仅本实验使用） */
const C = {
  sea: 0x2f7bb5, seaDeep: 0x1c4a74, seaHi: 0x6cc2ee, foam: 0xeef6f2,
  grass: 0x71b25e, grassWinter: 0x8f9568, forest: 0x2f6b3f, trunk: 0x6b4a2c,
  damBody: 0xb5b0a4, damDark: 0x8d897d, concrete: 0xc9c4b6,
  snow: 0xeef2f5, ice: 0xcfe6f2, iceDeep: 0x9cc4dc,
  rock: 0x8d8579, rockHi: 0xa39a8b, scree: 0x979068,
  wall: 0xd8d3c8, wallHi: 0xeae5da, roof: 0x8f8f92, glass: 0x9fc4d8,
  road: 0x5a5d63, roadMark: 0xe8e4d8, permeable: 0x9c8f7a,
  spongeGreen: 0x4f9d4a, spongeDeep: 0x3a7a38, flower: 0xe8a0b4, flowerAlt: 0xf2c979,
  sandDry: 0xdcc9a0, sandWet: 0xb9a77e, seabed: 0x8a7a58,
  sediment: 0xb9955e, plume: 0x9a8352,
  metal: 0x9aa4ae, brassLamp: 0xd8b46a, solar: 0x2c3e50,
  canal: 0xa8997e, waterTable: 0x4aa8d8,
  accentA: 0xe8674a, gold: 0xe2b34a,
};

/* ---------------- 数据表 ---------------- */

/* 水体库：占比（全球水量份额）与平均更新周期（通用水文常识数据） */
const STORES = [
  { key: 'ocean',   name: '海洋水',   share: 96.5,   renew: '约 2500 年', renewNum: 2500 * 365, color: '#3f8fc9',
    pos: [-13, 0.6, 0],   cam: 'overview', note: '水循环的源头与归宿，咸水不可直接利用' },
  { key: 'glacier', name: '冰川积雪', share: 1.74,   renew: '约 9700 年', renewNum: 9700 * 365, color: '#cfe6f2',
    pos: [9.6, 5.2, 0.6], cam: 'mountain', note: '淡水的最大储存库，近七成淡水在两极与高山' },
  { key: 'ground',  name: '地下水',   share: 1.69,   renew: '约 1400 年', renewNum: 1400 * 365, color: '#4aa8d8',
    pos: [-1.4, -0.4, 2.4], cam: 'well', note: '更新慢，超采会形成降落漏斗与地面沉降' },
  { key: 'lake',    name: '湖泊水',   share: 0.013,  renew: '约 17 年',   renewNum: 17 * 365, color: '#5fb0e8',
    pos: [17.7, 2.5, 0],  cam: 'inland',  note: '淡水湖泊是人类重要的饮用水源' },
  { key: 'river',   name: '河流水',   share: 0.0002, renew: '约 16 天',   renewNum: 16, color: '#6cc2ee',
    pos: [-2.6, 0.5, 0],  cam: 'faceWide', note: '更新最快的人类主要利用水源' },
  { key: 'soil',    name: '土壤水',   share: 0.001,  renew: '约 1 年',    renewNum: 365, color: '#7fd0a8',
    pos: [-3.5, 0.3, 3.2], cam: 'face',   note: '供给植物生长，联结下渗与蒸腾' },
  { key: 'atmos',   name: '大气水',   share: 0.001,  renew: '约 8 天',    renewNum: 8, color: '#d8ecf8',
    pos: [-1.6, 6.6, 0],  cam: 'faceWide', note: '汽态水汽总量虽小，却是输送水量的咽喉' },
];

/* 土壤质地：饱和下渗率（mm/h，通用土壤学量级） */
const SOILS = {
  sand: { name: '砂土', k: 42,  hue: 0xc9b088 },
  loam: { name: '壤土', k: 14,  hue: 0x9c8258 },
  clay: { name: '黏土', k: 3.5, hue: 0x8a6a4c },
};

/* 相机预设（沙盘地貌部位 × 10） */
const CAMS = {
  overview:  { pos: [1, 17, 37],     tgt: [1, 0.5, 0] },
  mountain:  { pos: [9.5, 8.5, 15],  tgt: [9, 2.6, 0] },
  slope:     { pos: [5.2, 5.4, 10.5], tgt: [5.8, 1.1, 0] },
  face:      { pos: [-1.2, 4.2, 8.8], tgt: [-0.8, 0.6, 0.4] },
  faceWide:  { pos: [0.2, 6.2, 14.5], tgt: [0.4, 0.9, 0] },
  city:      { pos: [-3.6, 5.6, 9.6], tgt: [-1.6, 0.5, 1.2] },
  dam:       { pos: [0.8, 4.6, 6.8],  tgt: [3.8, 1.2, -0.3] },
  inland:    { pos: [16.2, 8.2, 12],  tgt: [17.7, 1.6, 0] },
  delta:     { pos: [-5.4, 4.4, 7.8], tgt: [-6.8, 0.3, 0.2] },
  well:      { pos: [-1.9, 3.4, 7.6], tgt: [-2.1, -0.3, 2.1] },
};

/* ---------------- 全局状态（地形函数依赖，需先声明） ---------------- */

const state = {
  playing: true,
  speed: 1,               // 时间流速（倍）
  simDay: 3.2,            // 模拟天数（时间条推进）
  season: 'summer',       // 夏季 / 冬季
  warming: 0,             // 全球变暖幅度（°C 0~4）
  harden: 0.35,           // 城市硬化率（0.1~0.8）
  wind: 0.5,              // 向陆风强度（0~1）
  slope: 15,              // 山地坡度（度 6~30）
  veg: 0.7,               // 植被覆盖率（0.1~1）
  soil: 'loam',           // 土壤质地（sand / loam / clay）
  reservoir: true,        // 水库调蓄（默认建库）
  transfer: false,        // 跨流域调水
  sponge: false,          // 海绵城市
  pumping: 10,            // 地下水开采强度（0~100）
  stormI: 1.0,            // 暴雨雨强倍率（0.5~2）
  stormVisual: 0,         // 暴雨 3D 视觉强度（0~1，河道展宽/水位上涨）
  sediment: 0.35,         // 泥沙负荷（植被/暴雨驱动，0~1）
  seedActive: 0,          // 人工增雨作业强度（0~1，衰减）
  cycleMode: 'all',       // 三类循环筛选
  processMode: 'all',     // 环节高亮筛选
  quizMode: false,        // 随堂检测：箭头换字母
};

/* ---------------- 地形函数 ---------------- */

function smoothstep(a, b, x) {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
}

const X0 = -24, X1 = 24, Z0 = -6, Z1 = 6;

/* 山地坡度参数（split 章滑杆驱动，重塑山体前坡梯度） */
function slopeFactor() { return 0.55 + (state.slope - 6) / 24 * 0.85; }

function baseHeight(x) {
  if (x < -8) return -3 + Math.sin(x * 0.4) * 0.12;                        // 海洋盆地
  if (x < -6) return -3 + smoothstep(-8, -6, x) * 3.85;                    // 海滩
  if (x < 3.0) return 0.55 + Math.sin(x * 1.7) * 0.03;                     // 沿海平原（城市）
  if (x < 3.4) return 0.55 + smoothstep(3.0, 3.4, x) * 1.35;               // 大坝
  if (x < 5.2) {                                                           // 水库碗
    const bowl = smoothstep(3.4, 3.9, x) * smoothstep(5.2, 4.7, x);
    return 1.55 - bowl * 0.35;
  }
  if (x < 6.4) return 1.45 + smoothstep(5.2, 6.4, x) * 0.85;               // 山前过渡
  if (x < 13.5) {                                                          // 高山（坡度可调）
    const t = (x - 6.4) / 7.1;
    const ridge = Math.sin(t * Math.PI) * (2.2 + 1.1 * Math.sin(x * 2.3 + 1)) * slopeFactor();
    return 2.3 + Math.max(ridge, 0) + fbm3(x * 0.55, 0, 0, 9) * 0.12;      // 山体细部噪声
  }
  if (x < 15) return 2.3 + smoothstep(13.5, 15, x) * 0.2;                  // 山地→高原
  if (x < 21) return 2.5 + Math.sin(x * 1.3) * 0.1;                        // 内陆高原
  return 2.5 + smoothstep(21, 24, x) * 2.2;                                // 内陆边缘高地
}

/* 河道下切（坝下 → 海洋，沿 z≈0）；高水位时河道略宽（storm 展宽视觉） */
function riverCarve(x, z) {
  if (x >= 3.0 || x < -7.6) return 0;
  const along = smoothstep(3.0, 2.4, x) * smoothstep(-7.6, -6.4, x);
  const w = 0.8 + state.stormVisual * 0.22;
  const width = Math.exp(-(z * z) / (2 * w * w));
  return 0.46 * along * width;
}

/* V 形谷：山上主谷（冰川与径流路径所在） */
function valleyCarve(x, z) {
  if (x < 7.2 || x > 13.2) return 0;
  const along = smoothstep(7.2, 8.2, x) * smoothstep(13.2, 12.2, x);
  const width = Math.exp(-(z * z) / (2 * 0.62 * 0.62));
  return 0.52 * along * width;
}

/* 内陆湖盆 */
function lakeCarve(x, z) {
  if (x < 15.6 || x > 19.8) return 0;
  const dx = (x - 17.7) / 2.1, dz = z / 2.4;
  const d2 = dx * dx + dz * dz;
  return d2 < 1 ? (1 - d2) * 0.42 : 0;
}

function terrainH(x, z) {
  return baseHeight(x) - riverCarve(x, z) - lakeCarve(x, z) - valleyCarve(x, z);
}

/* ---------------- 地形网格（顶点色 + 动态雪线） ---------------- */

let terrainMesh = null;
let terrainGeo = null;
const SEG_X = 260, SEG_Z = 72;

/* 雪线高度（世界 Y）：夏季高、冬季低；变暖抬升 */
function snowlineY() {
  const base = state.season === 'summer' ? 3.95 : 2.7;
  return base + state.warming * (state.season === 'summer' ? 0.52 : 0.42);
}

function terrainColor(x, z, y, out) {
  if (x < -6.6) out.set(C.seabed).multiplyScalar(0.55 + Math.min(1, (x + 24) / 18) * 0.25);  // 海底
  else if (x < -5.2) out.set(C.sandDry);                                                      // 海滩
  else if (x < 2.9) {                                                                         // 平原（植被/硬化联动）
    if (state.harden > 0.5 && Math.abs(z) < 4.6) {
      out.set(C.wall).lerp(new THREE.Color(C.road), (state.harden - 0.5) * 0.9);
    } else {
      out.set(C.grass).lerp(new THREE.Color(C.grassWinter), state.season === 'winter' ? 0.55 : 0);
      out.lerp(new THREE.Color(C.permeable), clamp(state.harden * 0.5, 0, 0.45));
    }
  }
  else if (x < 3.4) out.set(C.damBody);                                                       // 大坝
  else if (x < 5.4) out.set(0x7fae62);                                                        // 水库岸
  else if (y > snowlineY()) out.set(C.snow);                                                  // 雪线以上
  else if (y > 2.9) out.set(C.rock);                                                          // 山地岩石
  else if (x < 13.8) {                                                                        // 山麓（林线随植被）
    out.set(C.scree).lerp(new THREE.Color(C.forest), clamp(state.veg * 0.85, 0, 0.8));
    if (state.season === 'winter') out.lerp(new THREE.Color(0x7a8168), 0.4);
  }
  else if (y < 2.32 && x > 15.5) out.set(0x88a06c);                                           // 内陆湖盆
  else out.set(0xa9af6d);                                                                     // 内陆高原
  out.offsetHSL(0, 0, (fbm3(x * 3.1, z * 3.1, y, 4)) * 0.032);                                // 手作颗粒肌理
  return out;
}

function buildTerrain(normalMap) {
  const geo = new THREE.PlaneGeometry(X1 - X0, Z1 - Z0, SEG_X, SEG_Z);
  geo.rotateX(-Math.PI / 2);
  terrainGeo = geo;
  const mat = new THREE.MeshStandardMaterial({
    vertexColors: true, roughness: 0.92, metalness: 0,
    normalMap, normalScale: new THREE.Vector2(0.5, 0.5),
  });
  terrainMesh = new THREE.Mesh(geo, mat);
  refreshTerrain();
  scene.add(terrainMesh);
  return terrainMesh;
}

/* 全量重算地形顶点（参数变化时调用；~1.9 万顶点，几毫秒级） */
const _tc = new THREE.Color();
function refreshTerrain() {
  if (!terrainGeo) return;
  const pos = terrainGeo.attributes.position;
  let col = terrainGeo.attributes.color;
  if (!col) {
    terrainGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(pos.count * 3), 3));
    col = terrainGeo.attributes.color;
  }
  const colors = col.array;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const y = terrainH(x, z);
    pos.setY(i, y);
    terrainColor(x, z, y, _tc);
    colors[i * 3] = _tc.r; colors[i * 3 + 1] = _tc.g; colors[i * 3 + 2] = _tc.b;
  }
  pos.needsUpdate = true;
  col.needsUpdate = true;
  terrainGeo.computeVertexNormals();
}

/* ---------------- 水体 ---------------- */

const WATER_BLUE = C.sea;

/* 海面：正弦叠加波（多向波包）+ 岸线泡沫带贴图 */
function makeOcean() {
  const g = new THREE.PlaneGeometry(17, Z1 - Z0, 96, 24);
  g.rotateX(-Math.PI / 2);
  const m = new THREE.MeshPhysicalMaterial({
    color: WATER_BLUE, transparent: true, opacity: 0.82,
    roughness: 0.14, metalness: 0.05, clearcoat: 0.8, clearcoatRoughness: 0.18,
    envMapIntensity: 1.1,
  });
  const mesh = new THREE.Mesh(g, m);
  mesh.position.set(-15.45, 0.02, 0);
  scene.add(mesh);
  return mesh;
}
const ocean = makeOcean();
const oceanBase = ocean.geometry.attributes.position.clone();

/* 岸线泡沫：贴海滩边缘的窄条（透明贴图 + 缓慢呼吸） */
function makeFoam() {
  const tex = canvasTex(256, 64, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, 'rgba(238,246,242,0.85)');
    g.addColorStop(0.45, 'rgba(238,246,242,0.32)');
    g.addColorStop(1, 'rgba(238,246,242,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    /* 泡沫细碎气泡 */
    for (let i = 0; i < 130; i++) {
      const x = Math.random() * w * 0.6, y = Math.random() * h;
      const r = 1 + Math.random() * 3.2;
      ctx.fillStyle = `rgba(255,255,255,${0.14 + Math.random() * 0.3})`;
      ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    }
  });
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(2.6, Z1 - Z0),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0.75 })
  );
  m.rotation.x = -Math.PI / 2;
  m.position.set(-6.4, 0.05, 0);
  scene.add(m);
  return m;
}
const foam = makeFoam();

/* 河面：流动条纹贴图（流速随暴雨/水库调节变化） */
function makeRiver() {
  const tex = canvasTex(256, 64, (ctx, w, h) => {
    ctx.fillStyle = 'rgba(95,176,232,0.92)';
    ctx.fillRect(0, 0, w, h);
    /* 顺流条纹（沿 +x 流动方向） */
    for (let i = 0; i < 26; i++) {
      const y = Math.random() * h;
      const len = 30 + Math.random() * 90;
      const x0 = Math.random() * w;
      ctx.strokeStyle = `rgba(220,240,252,${0.14 + Math.random() * 0.2})`;
      ctx.lineWidth = 1.2 + Math.random() * 2;
      ctx.beginPath();
      ctx.moveTo(x0, y);
      ctx.quadraticCurveTo(x0 + len / 2, y + (Math.random() - 0.5) * 10, x0 + len, y);
      ctx.stroke();
    }
    /* 波光点 */
    for (let i = 0; i < 90; i++) {
      ctx.fillStyle = `rgba(255,255,255,${0.1 + Math.random() * 0.22})`;
      ctx.fillRect(Math.random() * w, Math.random() * h, 2.4, 1.4);
    }
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 1);
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(9.6, 1.25, 30, 3),
    new THREE.MeshStandardMaterial({
      color: 0xdceaf4, map: tex, transparent: true, opacity: 0.78,
      roughness: 0.18, metalness: 0.05,
    })
  );
  m.rotation.x = -Math.PI / 2;
  m.position.set(-2.7, 0.24, 0);
  scene.add(m);
  return { mesh: m, tex };
}
const river = makeRiver();

/* 水库水面 + 内陆湖面 */
function makeStillWater(w, d, y, x, opacity = 0.75) {
  const g = new THREE.PlaneGeometry(w, d, 8, 4);
  g.rotateX(-Math.PI / 2);
  const m = new THREE.MeshPhysicalMaterial({
    color: WATER_BLUE, transparent: true, opacity,
    roughness: 0.14, metalness: 0.05, clearcoat: 0.8, clearcoatRoughness: 0.18,
    envMapIntensity: 1.1,
  });
  const mesh = new THREE.Mesh(g, m);
  mesh.position.set(x, y, 0);
  scene.add(mesh);
  return mesh;
}
const reservoir = makeStillWater(1.7, 4.6, 1.38, 4.3);
const inlandLake = makeStillWater(3.4, 3.9, 2.34, 17.7);

/* 内陆湖季节冰壳（冬季可见） */
const iceShell = new THREE.Mesh(
  new THREE.PlaneGeometry(3.3, 3.8),
  new THREE.MeshPhysicalMaterial({
    color: C.ice, transparent: true, opacity: 0.62, roughness: 0.2,
    clearcoat: 0.9, clearcoatRoughness: 0.2,
  })
);
iceShell.rotation.x = -Math.PI / 2;
iceShell.position.set(17.7, 2.37, 0);
iceShell.visible = false;
scene.add(iceShell);

/* 泥沙入海口羽流（meaning 章 / 浊度驱动） */
const plume = new THREE.Mesh(
  new THREE.CircleGeometry(2.6, 40),
  new THREE.MeshBasicMaterial({ color: C.plume, transparent: true, opacity: 0, depthWrite: false })
);
plume.rotation.x = -Math.PI / 2;
plume.position.set(-8.2, 0.035, 0.4);
plume.scale.set(1.6, 0.8, 1);
scene.add(plume);

/* ---------------- 城市（楼群窗纹 / 道路 / 路灯 / 行道树） ---------------- */

const cityG = new THREE.Group();
scene.add(cityG);
const roofSpecs = [];
const bShadowSpecs = [];

/* 楼体窗纹贴图（四种户型 × 夜窗点亮）；返回 { day, night } 双贴图 */
function buildingTexture(cols, rows, tone) {
  const mk = (night) => canvasTex(128, 256, (ctx, w, h) => {
    ctx.fillStyle = tone;
    ctx.fillRect(0, 0, w, h);
    /* 窗格：夜窗随机点亮暖黄 */
    const gap = 10, cw = (w - gap * 2) / cols, ch = (h - gap * 2) / rows;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = gap + c * cw + 2, y = gap + r * ch + 2;
        if (night && Math.random() < 0.42) ctx.fillStyle = 'rgba(255,214,140,0.92)';
        else ctx.fillStyle = 'rgba(120,160,185,0.55)';
        ctx.fillRect(x, y, cw - 5, ch - 6);
      }
    }
    /* 楼层分隔线 */
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    for (let r = 0; r <= rows; r++) ctx.fillRect(0, gap + r * ch - 1, w, 2);
  });
  return { day: mk(false), night: mk(true) };
}
const WALL_TONES = ['#d8d3c8', '#cfc6b4', '#c4bfae', '#dcd4c2'];
const WALL_TEXES = WALL_TONES.map((tone) => buildingTexture(4, 8, tone));

[
  [1.9, 2.1, 0.85, 0.8, 0.85, 0], [0.4, 2.3, 0.7, 0.7, 1.25, 1], [-1.2, 2.0, 0.75, 0.9, 0.7, 2],
  [1.7, 3.7, 0.8, 0.7, 0.6, 3], [0.2, 3.9, 0.65, 0.75, 1.0, 1], [-1.4, 3.7, 0.9, 0.7, 0.8, 2],
  [-2.6, 2.2, 0.7, 0.8, 1.1, 0], [-4.2, 2.4, 0.8, 0.8, 0.75, 3], [-3.0, 3.8, 0.7, 0.7, 0.9, 1],
  [-4.4, 3.7, 0.8, 0.65, 0.65, 2],
].forEach(([x, z, w, d, h, ti]) => {
  const tex = WALL_TEXES[ti % WALL_TEXES.length];
  /* 单材质六面（顶面被屋顶盖帽遮挡、底面入地），一楼一 draw call */
  const wallMat = new THREE.MeshStandardMaterial({
    map: tex.day, emissiveMap: tex.night, emissive: 0xffd88a, emissiveIntensity: 0, roughness: 0.82,
  });
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
  const gy = terrainH(x, z);
  mesh.position.set(x, gy + h / 2 - 0.03, z);
  cityG.add(mesh);
  roofSpecs.push({ x, z, w: w + 0.08, d: d + 0.08, y: gy + h });
  bShadowSpecs.push({ x, z, w: w * 1.9, d: d * 1.9, y: gy + 0.012 });
});

/* 屋顶盖帽 × InstancedMesh（1 draw call） */
{
  const roofGeo = new THREE.BoxGeometry(1, 0.07, 1);
  const roofMat = new THREE.MeshStandardMaterial({ color: C.roof, roughness: 0.9 });
  const roofs = new THREE.InstancedMesh(roofGeo, roofMat, roofSpecs.length);
  const m = new THREE.Matrix4();
  roofSpecs.forEach((r, i) => {
    m.makeScale(r.w, 1, r.d);
    m.setPosition(r.x, r.y, r.z);
    roofs.setMatrixAt(i, m);
  });
  roofs.instanceMatrix.needsUpdate = true;
  cityG.add(roofs);
}
/* 楼群接触阴影 × InstancedMesh（1 draw call） */
{
  const tex = canvasTex(256, 256, (ctx) => {
    const g = ctx.createRadialGradient(128, 128, 10, 128, 128, 126);
    g.addColorStop(0, 'rgba(16,12,8,0.34)');
    g.addColorStop(0.62, 'rgba(16,12,8,0.17)');
    g.addColorStop(1, 'rgba(16,12,8,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
  }, { linear: true });
  const shGeo = new THREE.PlaneGeometry(1, 1);
  shGeo.rotateX(-Math.PI / 2);
  const shMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false });
  const shadows = new THREE.InstancedMesh(shGeo, shMat, bShadowSpecs.length);
  const m = new THREE.Matrix4();
  bShadowSpecs.forEach((r, i) => {
    m.makeScale(r.w, 1, r.d);
    m.setPosition(r.x, r.y, r.z);
    shadows.setMatrixAt(i, m);
  });
  shadows.instanceMatrix.needsUpdate = true;
  shadows.renderOrder = 2;
  cityG.add(shadows);
}

/* 道路：普通沥青 / 海绵透水砖两种贴图 */
const roadTexNormal = canvasTex(128, 128, (ctx, w, h) => {
  ctx.fillStyle = '#57585c';
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 300; i++) {
    ctx.fillStyle = `rgba(${Math.random() > 0.5 ? '255,255,255' : '0,0,0'},${0.03 + Math.random() * 0.05})`;
    ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
  }
  ctx.strokeStyle = 'rgba(232,228,216,0.85)';
  ctx.lineWidth = 3;
  ctx.setLineDash([12, 10]);
  ctx.beginPath(); ctx.moveTo(w / 2, 0); ctx.lineTo(w / 2, h); ctx.stroke();
  ctx.setLineDash([]);
});
const roadTexSponge = canvasTex(128, 128, (ctx, w, h) => {
  ctx.fillStyle = '#9c8f7a';
  ctx.fillRect(0, 0, w, h);
  /* 联锁透水砖缝 */
  for (let y = 0; y < h; y += 16) {
    for (let x = 0; x < w; x += 16) {
      const off = (y / 16) % 2 ? 8 : 0;
      ctx.strokeStyle = 'rgba(60,48,32,0.5)';
      ctx.strokeRect(x + off, y, 16, 16);
      ctx.fillStyle = 'rgba(90,110,80,0.25)';
      ctx.fillRect(x + off + 4, y + 4, 8, 8);
    }
  }
});
roadTexNormal.wrapS = roadTexNormal.wrapT = roadTexSponge.wrapS = roadTexSponge.wrapT = THREE.RepeatWrapping;

const roadMat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: roadTexNormal, roughness: 0.95 });
const spongeRoadMat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: roadTexSponge, roughness: 1 });
const road1 = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.05, 0.55), roadMat);
road1.position.set(-1.4, terrainH(-1.4, 0) + 0.06, 3.05);
const road2 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 4.4), roadMat);
road2.position.set(1.2, terrainH(1.2, 0) + 0.06, 2.2);
cityG.add(road1, road2);

/* 路灯（灯杆 + 暖光头，双 InstancedMesh） */
{
  const lampSites = [[-3.6, 3.05], [-1.4, 3.05], [0.6, 3.05], [1.2, 3.6], [1.2, 2.2], [-2.4, 2.2]];
  const poleGeo = new THREE.CylinderGeometry(0.022, 0.03, 0.62, 8);
  const headGeo = new THREE.SphereGeometry(0.045, 12, 8);
  const poles = new THREE.InstancedMesh(poleGeo, matStd(C.metal, { metalness: 0.6, roughness: 0.4 }), lampSites.length);
  const heads = new THREE.InstancedMesh(headGeo, matGlow(0xffdf9e, 0.25), lampSites.length);
  const m = new THREE.Matrix4();
  lampSites.forEach(([x, z], i) => {
    const gy = terrainH(x, z);
    m.makeTranslation(x, gy + 0.31, z);
    poles.setMatrixAt(i, m);
    m.makeTranslation(x, gy + 0.62, z);
    heads.setMatrixAt(i, m);
  });
  poles.instanceMatrix.needsUpdate = true;
  heads.instanceMatrix.needsUpdate = true;
  cityG.add(poles, heads);
}

/* 行道树（InstancedMesh：锥冠 + 杆干），数量随植被覆盖率变化 */
const treeCrownGeo = new THREE.ConeGeometry(0.12, 0.3, 8);
const treeTrunkGeo = new THREE.CylinderGeometry(0.018, 0.024, 0.14, 6);
const crownMat = matStd(C.forest, { roughness: 0.85 });
const trunkMat = matStd(C.trunk, { roughness: 0.9 });
const TREE_SITES = [
  [-2.2, 2.6], [-1.0, 2.65], [0.3, 2.6], [1.5, 2.55], [2.4, 2.6],
  [-2.0, 3.45], [-0.8, 3.5], [0.5, 3.45], [1.8, 3.5], [-3.2, 2.5],
  [-4.8, 2.5], [-3.6, 3.5], [-4.6, 3.5], [2.2, 3.5], [-4.9, 4.3],
];
const treeCrowns = new THREE.InstancedMesh(treeCrownGeo, crownMat, TREE_SITES.length);
const treeTrunks = new THREE.InstancedMesh(treeTrunkGeo, trunkMat, TREE_SITES.length);
cityG.add(treeCrowns, treeTrunks);
function layoutTrees() {
  const m = new THREE.Matrix4();
  const n = Math.round(TREE_SITES.length * clamp(state.veg, 0.15, 1));
  TREE_SITES.forEach(([x, z], i) => {
    const on = i < n;
    const y = terrainH(x, z);
    const s = 0.8 + fbm3(x * 7, z * 7, 0, 3) * 0.3;
    m.makeScale(on ? s : 0.001, on ? s : 0.001, on ? s : 0.001);
    m.setPosition(x, y + 0.14 * s + 0.15 * s, z);
    treeCrowns.setMatrixAt(i, m);
    m.setPosition(x, y + 0.07 * s, z);
    treeTrunks.setMatrixAt(i, m);
  });
  treeCrowns.instanceMatrix.needsUpdate = true;
  treeTrunks.instanceMatrix.needsUpdate = true;
}

/* ---------------- 海绵城市元素（默认隐藏） ---------------- */

const spongeParts = [];
const spongeG = new THREE.Group();
spongeG.visible = false;
cityG.add(spongeG);

/* 绿色屋顶（草皮块，奇数楼位），仅海绵模式可见 */
roofSpecs.forEach((r, i) => {
  if (i % 2) return;
  const green = new THREE.Mesh(
    new THREE.BoxGeometry(r.w - 0.05, 0.05, r.d - 0.05),
    matStd(C.spongeGreen, { roughness: 0.9 })
  );
  green.position.set(r.x, r.y + 0.05, r.z);
  spongeG.add(green);
});

/* 雨水花园（下凹绿地 + 花丛色点） */
[[1.0, 2.95], [-1.8, 2.9], [2.0, 3.3]].forEach(([x, z]) => {
  const g = new THREE.Group();
  const bed = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.6, 0.1, 20), matStd(C.spongeDeep, { roughness: 0.95 }));
  bed.position.y = 0.03;
  g.add(bed);
  const flowers = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.028, 6, 5),
    matGlow(C.flower, 0.3), 26
  );
  const m = new THREE.Matrix4();
  for (let i = 0; i < 26; i++) {
    const a = Math.random() * TAU, r = 0.1 + Math.random() * 0.4;
    m.makeTranslation(Math.cos(a) * r, 0.09 + Math.random() * 0.05, Math.sin(a) * r);
    flowers.setMatrixAt(i, m);
  }
  flowers.instanceMatrix.needsUpdate = true;
  g.add(flowers);
  g.position.set(x, terrainH(x, z) + 0.06, z);
  spongeG.add(g);
  spongeParts.push(g);
});

/* 地下蓄水模块剖面（半埋于路侧，展示「蓄」） */
const cistern = new THREE.Group();
const cisternBody = new THREE.Mesh(
  new THREE.BoxGeometry(0.7, 0.3, 0.42),
  new THREE.MeshPhysicalMaterial({ color: 0x8fb6a0, transparent: true, opacity: 0.55, roughness: 0.35, clearcoat: 0.6 })
);
cisternBody.position.y = -0.12;
const cisternGrid = new THREE.Mesh(
  new THREE.BoxGeometry(0.72, 0.3, 0.44),
  new THREE.MeshStandardMaterial({ color: 0x5a7a6a, wireframe: true, transparent: true, opacity: 0.5 })
);
cisternGrid.position.y = -0.12;
cistern.add(cisternBody, cisternGrid);
cistern.position.set(2.35, terrainH(2.35, 4.1) + 0.1, 4.1);
spongeG.add(cistern);
spongeParts.push(cistern);

/* ---------------- 大坝水库（弧形坝 / 闸墩 / 泄洪台阶 / 吊塔 / 变电塔） ---------------- */

const damG = new THREE.Group();
scene.add(damG);

function buildDam() {
  /* 弧形坝体：沿 z 拱起的分段盒阵（InstancedMesh，1 draw call） */
  const pierMat = matStd(C.damBody, { roughness: 0.8 });
  const darkMat = matStd(C.damDark, { roughness: 0.9 });
  const ARC_N = 9;
  {
    const pierGeo = new THREE.BoxGeometry(1, 1.42, 0.34);
    const piers = new THREE.InstancedMesh(pierGeo, pierMat, ARC_N + 1);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    for (let i = 0; i <= ARC_N; i++) {
      const t = i / ARC_N - 0.5;
      const z = t * 4.4;
      const arc = 1 - t * t * 0.55;
      e.set(0, -t * 0.5, 0);
      q.setFromEuler(e);
      m.compose(
        new THREE.Vector3(3.25 + (1 - arc) * 0.3, terrainH(3.2, z) * 0.35 + 0.72, z),
        q,
        new THREE.Vector3(1.05 * arc + 0.35, 1, 1)
      );
      piers.setMatrixAt(i, m);
    }
    piers.instanceMatrix.needsUpdate = true;
    damG.add(piers);
  }
  /* 坝顶路面 + 栏杆（双排立柱 InstancedMesh） */
  const deck = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.06, 4.7), darkMat);
  deck.position.set(3.35, 1.47, 0);
  damG.add(deck);
  const railGeo = new THREE.CylinderGeometry(0.014, 0.014, 0.14, 6);
  const railMat = matStd(C.metal, { metalness: 0.55, roughness: 0.45 });
  const rails = new THREE.InstancedMesh(railGeo, railMat, 24);
  const m = new THREE.Matrix4();
  let ri = 0;
  for (let i = 0; i < 12; i++) {
    const z = -2.3 + i * 0.42;
    m.makeTranslation(2.86, 1.55, z); rails.setMatrixAt(ri++, m);
    m.makeTranslation(3.85, 1.55, z); rails.setMatrixAt(ri++, m);
  }
  rails.instanceMatrix.needsUpdate = true;
  damG.add(rails);
  /* 栏杆横杆 ×4 → 合并单几何 */
  {
    const bars = [];
    [-0.02, 0.11].forEach((dy) => {
      [2.86, 3.85].forEach((x) => {
        const b = new THREE.BoxGeometry(0.02, 0.02, 4.6);
        placeGeo(b, x, 1.62 + dy, 0);
        bars.push(b);
      });
    });
    damG.add(new THREE.Mesh(mergeGeoms(bars), railMat));
  }
  /* 泄洪台阶（下游坡面消能，InstancedMesh） */
  {
    const stepGeo = new THREE.BoxGeometry(0.16, 0.09, 1.6);
    const steps = new THREE.InstancedMesh(stepGeo, darkMat, 5);
    for (let i = 0; i < 5; i++) {
      m.makeTranslation(2.72 - i * 0.13, 1.32 - i * 0.2, -0.9);
      steps.setMatrixAt(i, m);
    }
    steps.instanceMatrix.needsUpdate = true;
    damG.add(steps);
  }
  /* 闸门（水库调蓄开关联动升降） */
  const gate = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 0.62, 1.06),
    matStd(0xc44a32, { metalness: 0.35, roughness: 0.55 })
  );
  gate.position.set(2.62, 1.05, 0.9);
  damG.add(gate);
  damG.userData.gate = gate;
  /* 门式吊机（提取闸门的塔架） */
  const hoist = new THREE.Group();
  const legGeo = new THREE.BoxGeometry(0.05, 0.62, 0.05);
  [[-0.1, -0.14], [-0.1, 0.14], [0.1, -0.14], [0.1, 0.14]].forEach(([lx, lz]) => {
    const leg = new THREE.Mesh(legGeo, matStd(C.metal, { metalness: 0.5 }));
    leg.position.set(lx, 0.31, lz);
    hoist.add(leg);
  });
  const beam = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.05, 0.4), matStd(C.metal, { metalness: 0.5 }));
  beam.position.y = 0.64;
  const winch = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.12, 10), matStd(0x444a52, { metalness: 0.6 }));
  winch.rotation.x = Math.PI / 2;
  winch.position.y = 0.56;
  hoist.add(beam, winch);
  hoist.position.set(2.5, 1.3, 1.35);
  damG.add(hoist);
  /* 变电塔（输电铁塔侧影） */
  const tower = new THREE.Group();
  const tLeg = new THREE.CylinderGeometry(0.016, 0.026, 0.9, 5);
  [[-0.1, 0], [0.1, 0]].forEach(([lx]) => {
    const leg = new THREE.Mesh(tLeg, matStd(C.metal, { metalness: 0.5 }));
    leg.position.set(lx, 0.45, 0);
    leg.rotation.z = lx > 0 ? -0.09 : 0.09;
    tower.add(leg);
  });
  for (let i = 0; i < 3; i++) {
    const cross = new THREE.Mesh(new THREE.BoxGeometry(0.24 - i * 0.05, 0.016, 0.016), matStd(C.metal, { metalness: 0.5 }));
    cross.position.y = 0.3 + i * 0.24;
    tower.add(cross);
  }
  tower.position.set(4.15, terrainH(4.15, -3.4) + 0.02, -3.4);
  damG.add(tower);
  const sh = shadowPatch(3.4, 5.2, 0.3);
  sh.position.set(3.3, terrainH(3.3, 0) + 0.02, 0);
  damG.add(sh);
  /* 坝名牌 */
  const plate = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.18, 0.02),
    new THREE.MeshStandardMaterial({ map: canvasTex(256, 96, (ctx, w, h) => {
      ctx.fillStyle = '#efe9d8'; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#8a4030'; ctx.lineWidth = 6; ctx.strokeRect(6, 6, w - 12, h - 12);
      ctx.fillStyle = '#2c2620'; ctx.textAlign = 'center';
      ctx.font = '700 34px "PingFang SC", sans-serif';
      ctx.fillText('沙河水库', w / 2, h / 2 + 12);
      ctx.font = '400 18px "PingFang SC", sans-serif';
      ctx.fillText('SHAHE RESERVOIR', w / 2, h / 2 + 38);
    }), roughness: 0.7 })
  );
  plate.position.set(2.7, 1.32, -1.6);
  plate.rotation.y = -0.9;
  damG.add(plate);
}
buildDam();

/* 水库水位尺（刻度板贴图） */
const staffGauge = new THREE.Group();
{
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.024, 0.7, 8), matStd(C.trunk, { roughness: 0.9 }));
  post.position.y = 0.35;
  const plate = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.6, 0.015),
    new THREE.MeshStandardMaterial({ map: canvasTex(128, 256, (ctx, w, h) => {
      ctx.fillStyle = '#f3eee2'; ctx.fillRect(0, 0, w, h);
      ctx.font = '600 22px sans-serif'; ctx.textAlign = 'left';
      for (let i = 0; i <= 10; i++) {
        const y = 14 + i * 22;
        const major = i % 2 === 0;
        ctx.fillStyle = '#27313a';
        ctx.fillRect(major ? 10 : 10, y, major ? 44 : 24, 3);
        if (major) ctx.fillText(String(2.6 - i * 0.2).replace(/\.0$/, ''), 60, y + 8);
      }
    }), roughness: 0.7 })
  );
  plate.position.set(0.05, 0.36, 0);
  staffGauge.add(post, plate);
  staffGauge.position.set(3.72, 1.35, 1.9);
  staffGauge.rotation.y = 0.5;
  scene.add(staffGauge);
}

/* ---------------- 高山：山谷冰川 + 针叶林 ---------------- */

/* 山谷冰川：CatmullRom 包络放样冰舌（沿 V 形谷），变暖退缩 */
function buildGlacier() {
  const N = 26;
  const half = [];
  const wEnv = (t) => (0.16 + Math.sin(t * Math.PI) * 0.34) * (1 - t * 0.25);
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    half.push([t, wEnv(t)]);
  }
  const pos = [];
  const idx = [];
  const x0 = 8.2, x1 = 12.4;
  for (let s = 0; s < 2; s++) {
    const side = s === 0 ? 1 : -1;
    for (let i = 0; i <= N; i++) {
      const [t, w] = half[i];
      const x = x0 + (x1 - x0) * t;
      const z = side * w;
      const y = terrainH(x, z * 0.6) + 0.09 + Math.sin(t * Math.PI) * 0.16;
      pos.push(x, y, z);
    }
  }
  for (let i = 0; i < N; i++) {
    const a = i, b = i + 1, c = N + 1 + i, d = N + 2 + i;
    idx.push(a, b, c, b, d, c);
  }
  /* 冰川端头封口 */
  const tipBase = N, tipTop = N * 2 + 1;
  pos.push(pos[tipBase * 3], (pos[tipBase * 3 + 1] + pos[tipTop * 3 + 1]) / 2 - 0.1, 0);
  for (let i = 0; i < N; i++) idx.push(i, i + 1, pos.length / 3 - 1);
  for (let i = 0; i < N; i++) idx.push(N + 1 + i, pos.length / 3 - 1, N + 2 + i);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  /* 冰舌：透明+clearcoat 出冰感（禁用 transmission——它会强制全场景额外渲染一遍，draw call 翻倍） */
  const mat = new THREE.MeshPhysicalMaterial({
    color: C.ice, roughness: 0.24, metalness: 0,
    clearcoat: 0.9, clearcoatRoughness: 0.24,
    transparent: true, opacity: 0.86,
    emissive: new THREE.Color(0x9cc4dc), emissiveIntensity: 0.08,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geo, mat);
  /* 冰裂缝纹理（横向暗纹贴图模拟） */
  mesh.userData.baseScaleX = 1;
  scene.add(mesh);
  return mesh;
}
const glacier = buildGlacier();

/* 冰川消融视觉：变暖 → 冰舌缩短（scale.x 收缩 + 端头上移） */
function applyGlacier() {
  const warm = clamp(state.warming / 4, 0, 1);
  const seasonK = state.season === 'winter' ? 1.12 : 1;
  const s = Math.max(0.34, (1 - warm * 0.62) * seasonK);
  glacier.scale.set(1, 1, s);
}

/* 山地针叶林（InstancedMesh：锥冠 ×3 层 + 干），密度随植被覆盖率 */
const MOUNT_TREES = 170;
const mountCrownGeo = new THREE.ConeGeometry(0.09, 0.24, 7);
const mountTrunkGeo = new THREE.CylinderGeometry(0.012, 0.016, 0.1, 5);
const mountCrowns = new THREE.InstancedMesh(mountCrownGeo, crownMat, MOUNT_TREES);
const mountTrunks = new THREE.InstancedMesh(mountTrunkGeo, trunkMat, MOUNT_TREES);
scene.add(mountCrowns, mountTrunks);
function layoutMountForest() {
  const m = new THREE.Matrix4();
  const _p = new THREE.Vector3();
  const seedRnd = (() => { let a = 12345; return () => { a = (a * 16807) % 2147483647; return a / 2147483647; }; })();
  let placed = 0;
  for (let i = 0; i < MOUNT_TREES; i++) {
    /* 在山体坡面（6.6~13.4）散播，避开 V 形谷与雪线以上 */
    const x = 6.8 + seedRnd() * 6.4;
    const z = (seedRnd() * 2 - 1) * 4.6;
    const y = terrainH(x, z);
    const inValley = Math.abs(z) < 0.75 && x > 7.2 && x < 13.2;
    const aboveSnow = y > snowlineY() - 0.1;
    const alive = placed < MOUNT_TREES * clamp(state.veg, 0.2, 1);
    if (!alive || inValley || aboveSnow || seedRnd() > 0.9) {
      m.makeScale(0.001, 0.001, 0.001);
      mountCrowns.setMatrixAt(i, m);
      mountTrunks.setMatrixAt(i, m);
      continue;
    }
    placed++;
    const s = 0.8 + seedRnd() * 0.7;
    m.makeScale(s, s * (state.season === 'winter' ? 0.94 : 1), s);
    m.setPosition(x, y + 0.12 * s + 0.1 * s, z);
    mountCrowns.setMatrixAt(i, m);
    m.setPosition(x, y + 0.05 * s, z);
    mountTrunks.setMatrixAt(i, m);
  }
  mountCrowns.instanceMatrix.needsUpdate = true;
  mountTrunks.instanceMatrix.needsUpdate = true;
}

/* ---------------- 河口三角洲（泥沙 toggle 生长动画） ---------------- */

const deltaG = new THREE.Group();
scene.add(deltaG);
const deltaLobes = [];
{
  const lobeMat = new THREE.MeshStandardMaterial({ color: C.sandWet, roughness: 0.92 });
  const lobeSpec = [
    [0.9, 0.05, -7.35, 0.1, 0.5], [0.62, 0.035, -7.9, 0.05, 0.9], [0.44, 0.025, -8.3, 0.02, 1.3],
  ];
  lobeSpec.forEach(([r, y, x, dz, phase]) => {
    const lobe = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 12), lobeMat);
    lobe.scale.set(1.5, y * 8, 0.75);
    lobe.position.set(x, 0.02, dz);
    lobe.userData.phase = phase;
    lobe.userData.grow = 0;
    deltaG.add(lobe);
    deltaLobes.push(lobe);
  });
}
function setDeltaGrowth(k, instant = false) {
  deltaLobes.forEach((lobe, i) => {
    const target = clamp(k * (1 - i * 0.18) - lobe.userData.phase * 0.35, 0, 1);
    if (instant) lobe.userData.grow = target;
    lobe.userData.target = target;
  });
}
function tickDelta(dt) {
  deltaLobes.forEach((lobe) => {
    lobe.userData.grow += (lobe.userData.target - lobe.userData.grow) * Math.min(1, dt * 1.4);
    const g = Math.max(0.001, lobe.userData.grow);
    const s = lobe.geometry.parameters.radius;
    lobe.scale.set(1.5 * g + 0.001, Math.max(0.002, g * s * 0.4), (0.75 * g + 0.001));
    lobe.position.y = 0.02;
    lobe.visible = g > 0.01;
  });
}

/* ---------------- 道具阵列：气象站 / 雨量筒 / 增雨飞机 / 调水渠 / 小船 ---------------- */

/* 气象站（三脚架 + 风杯风速仪 + 风向标 + 百叶箱 + 太阳板），风杯转速 ∝ 向陆风强度 */
const weatherStation = new THREE.Group();
let anemometerArms = null;
let windVane = null;
{
  const metalMat = matStd(C.metal, { metalness: 0.55, roughness: 0.45 });
  /* 三脚架腿 ×3 → InstancedMesh */
  {
    const legGeo = new THREE.CylinderGeometry(0.012, 0.016, 0.55, 6);
    const legs = new THREE.InstancedMesh(legGeo, metalMat, 3);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * TAU;
      e.set(-Math.sin(a) * 0.24, 0, Math.cos(a) * 0.24);
      q.setFromEuler(e);
      m.compose(new THREE.Vector3(Math.cos(a) * 0.09, 0.26, Math.sin(a) * 0.09), q, new THREE.Vector3(1, 1, 1));
      legs.setMatrixAt(i, m);
    }
    legs.instanceMatrix.needsUpdate = true;
    weatherStation.add(legs);
  }
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.5, 6), metalMat);
  mast.position.y = 0.68;
  weatherStation.add(mast);
  /* 风杯：毂 + 三臂（合并）+ 三杯（InstancedMesh） */
  anemometerArms = new THREE.Group();
  {
    const hub = new THREE.Mesh(new THREE.SphereGeometry(0.024, 10, 8), metalMat);
    const armParts = [];
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * TAU;
      const arm = new THREE.BoxGeometry(0.14, 0.008, 0.008);
      placeGeo(arm, Math.cos(a) * 0.07, 0, Math.sin(a) * 0.07, 1, -a);
      armParts.push(arm);
    }
    anemometerArms.add(hub, new THREE.Mesh(mergeGeoms(armParts), metalMat));
    const cupGeo = new THREE.SphereGeometry(0.026, 10, 8, 0, TAU, 0, Math.PI / 2);
    const cups = new THREE.InstancedMesh(cupGeo, matStd(0xd4583c, { roughness: 0.5 }), 3);
    const m = new THREE.Matrix4();
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * TAU;
      m.makeRotationX(Math.PI);
      m.setPosition(Math.cos(a) * 0.14, 0.01, Math.sin(a) * 0.14);
      cups.setMatrixAt(i, m);
    }
    cups.instanceMatrix.needsUpdate = true;
    anemometerArms.add(cups);
  }
  anemometerArms.position.y = 0.92;
  weatherStation.add(anemometerArms);
  /* 风向标 */
  windVane = new THREE.Group();
  const needle = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.16, 6), matStd(C.gold, { metalness: 0.4 }));
  needle.rotation.x = Math.PI / 2;
  needle.position.x = 0.1;
  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.05, 0.006), matStd(0xd4583c));
  tail.position.x = -0.1;
  windVane.add(needle, tail);
  windVane.position.y = 0.82;
  weatherStation.add(windVane);
  /* 百叶箱（箱体 + 百叶片合并） */
  {
    const shelter = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.18, 0.16),
      matStd(0xf2efe6, { roughness: 0.8 })
    );
    shelter.position.set(0.16, 0.24, 0.05);
    const slats = [];
    for (let i = 0; i < 4; i++) {
      const s = new THREE.BoxGeometry(0.17, 0.012, 0.17);
      placeGeo(s, 0.16, 0.17 + i * 0.045, 0.05);
      slats.push(s);
    }
    weatherStation.add(shelter, new THREE.Mesh(mergeGeoms(slats), matStd(0xf2efe6, { roughness: 0.8 })));
  }
  /* 太阳板 */
  const panel = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.01, 0.1), matStd(C.solar, { roughness: 0.4, metalness: 0.3 }));
  panel.position.set(-0.14, 0.4, 0.08);
  panel.rotation.z = 0.5;
  weatherStation.add(panel);
  weatherStation.position.set(-4.9, terrainH(-4.9, -3.6) + 0.01, -3.6);
  weatherStation.rotation.y = 0.7;
  const sh = shadowPatch(0.9, 0.9, 0.32);
  sh.position.y = 0.012;
  weatherStation.add(sh);
  scene.add(weatherStation);
}

/* 雨量筒 */
const rainGauge = new THREE.Group();
{
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.24, 14), matStd(C.metal, { metalness: 0.4, roughness: 0.5 }));
  body.position.y = 0.12;
  const funnel = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.07, 14, 1, true), matStd(C.metal, { metalness: 0.4, roughness: 0.45, side: THREE.DoubleSide }));
  funnel.position.y = 0.27;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.065, 0.008, 6, 16), matStd(C.brassLamp, { metalness: 0.6 }));
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.3;
  const water = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.05, 10), matStd(0x4aa8d8, { roughness: 0.3 }));
  water.position.y = 0.05;
  water.name = 'gaugeWater';
  rainGauge.add(body, funnel, rim, water);
  rainGauge.position.set(-3.1, terrainH(-3.1, 3.9) + 0.01, 3.9);
  const sh = shadowPatch(0.4, 0.4, 0.3);
  sh.position.y = 0.01;
  rainGauge.add(sh);
  scene.add(rainGauge);
}

/* 人工增雨飞机（作业时入场巡航）：机身 + 机翼 + 尾翼 + 螺旋桨 + 撒播杆 */
const planeG = new THREE.Group();
let planeProp = null;
{
  const bodyMat = matStd(0xe8e4d8, { roughness: 0.5, metalness: 0.15 });
  const fuselage = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.42, 6, 12), bodyMat);
  fuselage.rotation.z = Math.PI / 2;
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 8), matStd(0xc44a32, { roughness: 0.5 }));
  nose.position.x = 0.3;
  const wing = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.014, 0.7), bodyMat);
  wing.position.y = 0.05;
  const tailW = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.01, 0.26), bodyMat);
  tailW.position.set(-0.26, 0.04, 0);
  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.01), matStd(0xc44a32, { roughness: 0.5 }));
  fin.position.set(-0.26, 0.1, 0);
  planeProp = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.14, 0.02), matStd(0x333a42));
    blade.rotation.x = (i / 3) * TAU;
    planeProp.add(blade);
  }
  planeProp.position.set(0.34, 0, 0);
  planeG.add(fuselage, nose, wing, tailW, fin, planeProp);
  /* 撒播杆（机翼后缘喷口） */
  for (const sz of [-0.28, 0.28]) {
    const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.1, 6), matStd(C.metal));
    nozzle.rotation.x = Math.PI / 2;
    nozzle.position.set(-0.02, -0.02, sz);
    planeG.add(nozzle);
  }
  planeG.visible = false;
  scene.add(planeG);
}

/* 跨流域调水渠：水库 → 城市 受水区（梯形渠 + 流水条 + 分水闸），transfer 开关显隐 */
const canalG = new THREE.Group();
canalG.visible = false;
let canalWaterTex = null;
{
  const bedMat = matStd(C.canal, { roughness: 0.92 });
  const wallMat = matStd(0xbfae8e, { roughness: 0.9 });
  /* 渠道路径：水库西端 (3.1,1.5) → 城市东侧 (1.6,0.55) 平面上走 z=1.2 带 */
  const pts = [
    new THREE.Vector3(3.05, 1.52, 1.0), new THREE.Vector3(2.6, 1.2, 1.35),
    new THREE.Vector3(2.1, 0.8, 1.5), new THREE.Vector3(1.65, 0.62, 1.4),
  ];
  const curve = new THREE.CatmullRomCurve3(pts);
  const frame = curve.getPoints(24);
  const bedGeo = new THREE.BufferGeometry();
  const verts = [];
  const idxs = [];
  const width = 0.14;
  for (let i = 0; i < frame.length; i++) {
    const p = frame[i];
    const q = frame[Math.min(i + 1, frame.length - 1)];
    const dir = new THREE.Vector3().subVectors(q, p).normalize();
    const side = new THREE.Vector3(-dir.z, 0, dir.x).multiplyScalar(width);
    verts.push(p.x + side.x, p.y + 0.01, p.z + side.z);
    verts.push(p.x - side.x, p.y + 0.01, p.z - side.z);
    if (i < frame.length - 1) {
      const a = i * 2;
      idxs.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  bedGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(verts), 3));
  bedGeo.setIndex(idxs);
  bedGeo.computeVertexNormals();
  const bed = new THREE.Mesh(bedGeo, bedMat);
  canalG.add(bed);
  /* 侧墙：两条管（Tube 沿曲线抬升） */
  for (const sgn of [1, -1]) {
    const wallPts = frame.map((p, i) => {
      const q = frame[Math.min(i + 1, frame.length - 1)];
      const dir = new THREE.Vector3().subVectors(q, p).normalize();
      const side = new THREE.Vector3(-dir.z, 0, dir.x).multiplyScalar(width * sgn);
      return new THREE.Vector3(p.x + side.x, p.y + 0.075, p.z + side.z);
    });
    const wall = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(wallPts), 24, 0.022, 6),
      wallMat
    );
    canalG.add(wall);
  }
  /* 渠内流水条（流动贴图） */
  canalWaterTex = canvasTex(128, 32, (ctx, w, h) => {
    ctx.fillStyle = 'rgba(95,176,232,0.95)';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 12; i++) {
      const x = Math.random() * w;
      ctx.strokeStyle = 'rgba(225,242,252,0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, Math.random() * h);
      ctx.lineTo(x + 14 + Math.random() * 26, Math.random() * h);
      ctx.stroke();
    }
  });
  canalWaterTex.wrapS = canalWaterTex.wrapT = THREE.RepeatWrapping;
  canalWaterTex.repeat.set(6, 1);
  const waterGeo = bedGeo.clone();
  const water = new THREE.Mesh(
    waterGeo,
    new THREE.MeshStandardMaterial({ color: 0xdceaf4, map: canalWaterTex, transparent: true, opacity: 0.85, roughness: 0.2 })
  );
  water.position.y = 0.035;
  canalG.add(water);
  /* 分水闸（渠首小闸箱） */
  const gateBox = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.2, 0.2), matStd(0x8d897d, { roughness: 0.8 }));
  gateBox.position.set(3.05, 1.66, 1.0);
  const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.012, 6, 14), matStd(C.metal, { metalness: 0.6 }));
  wheel.position.set(3.05, 1.8, 1.0);
  wheel.rotation.y = Math.PI / 2;
  canalG.add(gateBox, wheel);
  scene.add(canalG);
}

/* 内陆小船（湖面 + 海面各一，随浪起伏） */
function buildBoat(scale = 1) {
  const g = new THREE.Group();
  const hullMat = matStd(0x8a5a3a, { roughness: 0.75 });
  const hullPts = [];
  const N = 8;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const x = (t - 0.5) * 0.62;
    const w = 0.1 * Math.sin(Math.PI * (0.15 + t * 0.7)) + 0.02;
    const y = -0.05 + Math.sin(t * Math.PI) * 0.04;
    hullPts.push(new THREE.Vector2(w, y));
  }
  const hull = new THREE.Mesh(new THREE.LatheGeometry(hullPts, 14), hullMat);
  hull.rotation.z = Math.PI / 2;
  hull.scale.set(1, 1, 0.7);
  const deck = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.015, 0.16), matStd(0xa8714a, { roughness: 0.8 }));
  deck.position.y = 0.015;
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 0.11), matStd(0xe8e4d8, { roughness: 0.7 }));
  cabin.position.set(-0.05, 0.06, 0);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.008, 0.3, 6), hullMat);
  mast.position.set(0.12, 0.16, 0);
  g.add(hull, deck, cabin, mast);
  g.scale.setScalar(scale);
  return g;
}
const boatLake = buildBoat(0.9);
boatLake.position.set(16.9, 2.36, 1.1);
boatLake.rotation.y = 0.6;
scene.add(boatLake);
const boatSea = buildBoat(1.15);
boatSea.position.set(-11.5, 0.02, -2.6);
boatSea.rotation.y = -0.4;
scene.add(boatSea);

/* 水库/河道浮标（条纹桶 + 顶灯） */
function buildBuoy(x, y, z) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.14, 12), matStd(0xd4583c, { roughness: 0.6 }));
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.056, 0.056, 0.035, 12), matStd(0xf2f0e8, { roughness: 0.6 }));
  band.position.y = 0.02;
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6), matGlow(0xffd166, 0.7));
  lamp.position.y = 0.095;
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.07, 5), matStd(C.metal));
  mast.position.y = 0.06;
  g.add(body, band, lamp, mast);
  g.position.set(x, y, z);
  scene.add(g);
  return g;
}
const buoyRiver = buildBuoy(-5.2, 0.3, 0.55);
const buoyRes = buildBuoy(4.4, 1.42, -1.4);

/* ---------------- 云（多球合并云团 ×4 群，随风漂移） ---------------- */

const cloudG = new THREE.Group();
scene.add(cloudG);
const cloudGroups = [];
function buildCloud(cx, cy, cz, puffs, tint = 0xffffff) {
  const mat = new THREE.MeshStandardMaterial({
    color: tint, roughness: 1, metalness: 0,
    transparent: true, opacity: 0.92, flatShading: true,
  });
  /* 云团合并为单一几何（1 draw call / 云） */
  const parts = [];
  for (let i = 0; i < puffs; i++) {
    const r = 0.5 + Math.random() * 0.75;
    const puff = new THREE.SphereGeometry(r, 10, 8);
    puff.scale(1, 0.62 + Math.random() * 0.2, 1);
    placeGeo(puff, (Math.random() - 0.5) * 3.4, (Math.random() - 0.5) * 0.7, (Math.random() - 0.5) * 1.8);
    parts.push(puff);
  }
  const g = new THREE.Mesh(mergeGeoms(parts), mat);
  g.position.set(cx, cy, cz);
  g.userData.drift = 0.14 + Math.random() * 0.1;
  cloudG.add(g);
  return g;
}
const cloudCity = buildCloud(-1.6, 5.9, 0.6, 7);
const cloudMountain = buildCloud(9.4, 7.0, 0, 8, 0xf4f8fc);
const cloudSea = buildCloud(-12, 5.2, -0.6, 5);
const cloudLake = buildCloud(17.8, 6.0, 0.4, 5, 0xf6f9fd);
cloudGroups.push(cloudCity, cloudMountain, cloudSea, cloudLake);

/* 增雨催化目标云增亮（作业时） */
const seedGlowMat = new THREE.MeshStandardMaterial({
  color: 0xfdf6e0, roughness: 1, metalness: 0, transparent: true, opacity: 0.94, flatShading: true,
});

/* ---------------- 粒子系统 ---------------- */

let _softDot = null;
function softDot() {
  if (_softDot) return _softDot;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.5, 'rgba(255,255,255,0.55)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  _softDot = new THREE.CanvasTexture(c);
  return _softDot;
}

function pathPoint(pts, t) {
  const segs = pts.length - 1;
  const f = clamp(t, 0, 0.99999) * segs;
  const i = Math.floor(f);
  return pts[i].clone().lerp(pts[i + 1], f - i);
}

const rnd = (a, b) => a + Math.random() * (b - a);

class Stream {
  constructor({ count, color, size = 2.6, opacity = 0.85, spawn, velocity, life, path = null, speed = 1, yFromTerrain = false }) {
    this.maxCount = count;
    this.factor = 1;
    this.opacity = opacity;
    this.baseColor = new THREE.Color(color);
    this.spawn = spawn;
    this.velocity = velocity;
    this.life = life;
    this.path = path;
    this.speed = speed;
    this.yFromTerrain = yFromTerrain;
    this.geo = new THREE.BufferGeometry();
    this.geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    this.vel = new Float32Array(count * 3);
    this.age = new Float32Array(count);
    this.lifeArr = new Float32Array(count);
    this.tProg = new Float32Array(count);
    this.pathSpeed = new Float32Array(count);
    this.mat = new THREE.PointsMaterial({
      color, size, transparent: true, opacity,
      map: softDot(), depthWrite: false, sizeAttenuation: true,
    });
    this.points = new THREE.Points(this.geo, this.mat);
    this.points.frustumCulled = false;
    scene.add(this.points);
    for (let i = 0; i < count; i++) this.reset(i, true);
  }

  reset(i, scatter = false) {
    const p = this.spawn();
    const v = this.velocity();
    this.vel[i * 3] = v.x; this.vel[i * 3 + 1] = v.y; this.vel[i * 3 + 2] = v.z;
    const total = this.life * (0.6 + Math.random() * 0.8);
    this.lifeArr[i] = total;
    this.age[i] = scatter ? Math.random() * total : 0;
    this.tProg[i] = scatter ? Math.random() : 0;
    this.pathSpeed[i] = this.speed * (0.75 + Math.random() * 0.5);
    const posAttr = this.geo.attributes.position;
    if (this.path) {
      const pt = pathPoint(this.path, this.tProg[i]);
      const y = this.yFromTerrain ? terrainH(pt.x, pt.z) + 0.07 : pt.y;
      posAttr.setXYZ(i, pt.x, y, pt.z);
    } else {
      posAttr.setXYZ(i, p.x, p.y, p.z);
    }
  }

  update(dt) {
    const posAttr = this.geo.attributes.position;
    const alive = Math.max(0, Math.round(this.maxCount * this.factor));
    for (let i = 0; i < this.maxCount; i++) {
      if (i >= alive) { posAttr.setXYZ(i, 0, -999, 0); continue; }
      this.age[i] += dt;
      if (this.age[i] >= this.lifeArr[i]) { this.reset(i); continue; }
      if (this.path) {
        this.tProg[i] += dt * this.pathSpeed[i];
        if (this.tProg[i] >= 1) { this.reset(i); continue; }
        const pt = pathPoint(this.path, this.tProg[i]);
        const y = this.yFromTerrain ? terrainH(pt.x, pt.z) + 0.07 : pt.y;
        posAttr.setXYZ(i, pt.x, y, pt.z);
      } else {
        let x = posAttr.getX(i) + this.vel[i * 3] * dt;
        let y = posAttr.getY(i) + this.vel[i * 3 + 1] * dt;
        const z = posAttr.getZ(i) + this.vel[i * 3 + 2] * dt;
        if (this.wiggle) {
          y += Math.sin(this.age[i] * 4 + i) * 0.12 * dt;
          x += Math.cos(this.age[i] * 3 + i) * 0.05 * dt;
        }
        if (this.dieBelow !== undefined && y < this.dieBelow) { this.reset(i); continue; }
        if (this.dieBelowX !== undefined && x < this.dieBelowX) { this.reset(i); continue; }
        if (this.dieOnTerrain && y <= terrainH(x, z) + 0.06) { this.reset(i); continue; }
        posAttr.setXYZ(i, x, y, z);
      }
    }
    posAttr.needsUpdate = true;
  }

  setDim(dim) {
    this.mat.opacity = dim ? 0.06 : this.opacity;
  }

  tint(hex, k = 1) {
    this.mat.color.set(this.baseColor).lerp(new THREE.Color(hex), k);
  }
}

const S = {};
let allStreams = [];

function buildStreams() {
  /* 蒸发（海面 + 湖面） */
  S.evapOcean = new Stream({
    count: 160, color: 0xbfe3ff, size: 2.4, opacity: 0.75, life: 4.2,
    spawn: () => ({ x: rnd(-15.5, -9.5), y: 0.06, z: rnd(-5.5, 5.5) }),
    velocity: () => new THREE.Vector3(rnd(0.3, 0.55), rnd(0.85, 1.25), rnd(-0.08, 0.08)),
  });
  S.evapOcean.wiggle = true;
  S.evapLake = new Stream({
    count: 60, color: 0xbfe3ff, size: 2.2, opacity: 0.7, life: 3.6,
    spawn: () => ({ x: rnd(16.4, 19.2), y: 2.42, z: rnd(-1.8, 1.8) }),
    velocity: () => new THREE.Vector3(rnd(-0.1, 0.2), rnd(0.8, 1.15), rnd(-0.08, 0.08)),
  });
  S.evapLake.wiggle = true;
  /* 植物蒸腾（平原绿地上升气流） */
  S.evapPlant = new Stream({
    count: 46, color: 0xd2f2de, size: 2.0, opacity: 0.6, life: 3.4,
    spawn: () => ({ x: rnd(-5, 2.4), y: 0.62, z: rnd(-4.8, 4.8) }),
    velocity: () => new THREE.Vector3(rnd(0.05, 0.2), rnd(0.55, 0.9), rnd(-0.06, 0.06)),
  });
  S.evapPlant.wiggle = true;

  /* 云（四群漂移粒子） */
  S.cloudCity = new Stream({
    count: 26, color: 0xffffff, size: 6.5, opacity: 0.85, life: 16,
    spawn: () => ({ x: rnd(-4.5, 1.5), y: rnd(5.4, 6.2), z: rnd(-2.6, 3.6) }),
    velocity: () => new THREE.Vector3(0.06, 0, rnd(-0.01, 0.01)),
  });
  S.cloudMountain = new Stream({
    count: 30, color: 0xf4f8fc, size: 7.5, opacity: 0.85, life: 18,
    spawn: () => ({ x: rnd(6.8, 12.2), y: rnd(6.6, 7.8), z: rnd(-3, 3) }),
    velocity: () => new THREE.Vector3(0.05, 0, 0),
  });
  S.cloudSea = new Stream({
    count: 16, color: 0xffffff, size: 6, opacity: 0.8, life: 14,
    spawn: () => ({ x: rnd(-13.5, -10.5), y: rnd(4.8, 5.6), z: rnd(-2.5, 2.5) }),
    velocity: () => new THREE.Vector3(0.04, 0, 0),
  });
  S.cloudLake = new Stream({
    count: 12, color: 0xf6f9fd, size: 5.5, opacity: 0.8, life: 14,
    spawn: () => ({ x: rnd(15.8, 19.6), y: rnd(5.6, 6.4), z: rnd(-2, 2) }),
    velocity: () => new THREE.Vector3(0.03, 0, 0),
  });

  /* 降水（城市 / 山地 / 海面 / 湖面） */
  S.rainCity = new Stream({
    count: 170, color: 0x9fd0f2, size: 2.2, opacity: 0.8, life: 1.5,
    spawn: () => ({ x: rnd(-4.2, 1.4), y: rnd(5.0, 5.6), z: rnd(-2.4, 3.4) }),
    velocity: () => new THREE.Vector3(0, -4.6, 0),
  });
  S.rainCity.dieBelow = 0.62;
  S.rainMountain = new Stream({
    count: 200, color: 0xa8d4f5, size: 2.2, opacity: 0.8, life: 1.6,
    spawn: () => ({ x: rnd(6.8, 12.4), y: rnd(6.2, 7.4), z: rnd(-3.2, 3.2) }),
    velocity: () => new THREE.Vector3(0, -5, 0),
  });
  S.rainMountain.dieOnTerrain = true;
  S.rainSea = new Stream({
    count: 120, color: 0x9fd0f2, size: 2.2, opacity: 0.8, life: 1.4,
    spawn: () => ({ x: rnd(-13.2, -10.6), y: rnd(4.4, 5.2), z: rnd(-2.4, 2.4) }),
    velocity: () => new THREE.Vector3(0, -4.2, 0),
  });
  S.rainSea.dieBelow = 0.04;
  S.rainLake = new Stream({
    count: 70, color: 0xa8d4f5, size: 2.2, opacity: 0.8, life: 1.5,
    spawn: () => ({ x: rnd(16, 19.4), y: rnd(5.2, 6), z: rnd(-1.8, 1.8) }),
    velocity: () => new THREE.Vector3(0, -4.4, 0),
  });
  S.rainLake.dieBelow = 2.42;

  /* 地表径流路径（山体两路 + 城市一路） */
  const pathMountainA = [
    new THREE.Vector3(8.6, 0, 2.6), new THREE.Vector3(7.6, 0, 1.6), new THREE.Vector3(6.8, 0, 0.8),
    new THREE.Vector3(5.6, 0, 0.35), new THREE.Vector3(4.0, 0, 0.25), new THREE.Vector3(2.0, 0, 0.15),
    new THREE.Vector3(-0.5, 0, 0.1), new THREE.Vector3(-3.5, 0, 0.05), new THREE.Vector3(-6.2, 0, 0),
    new THREE.Vector3(-8.5, 0, -0.2),
  ];
  const pathMountainB = [
    new THREE.Vector3(11.8, 0, -2.4), new THREE.Vector3(10.6, 0, -1.5), new THREE.Vector3(9.4, 0, -0.8),
    new THREE.Vector3(8.2, 0, -0.3), new THREE.Vector3(6.6, 0, 0), new THREE.Vector3(4.6, 0, 0.2),
    new THREE.Vector3(2.2, 0, 0.15), new THREE.Vector3(-0.6, 0, 0.1), new THREE.Vector3(-3.6, 0, 0.05),
    new THREE.Vector3(-6.4, 0, 0), new THREE.Vector3(-8.6, 0, -0.25),
  ];
  const pathCity = [
    new THREE.Vector3(2.2, 0, 1.9), new THREE.Vector3(1.2, 0, 1.35), new THREE.Vector3(0.2, 0, 0.9),
    new THREE.Vector3(-1.2, 0, 0.5), new THREE.Vector3(-3.2, 0, 0.3), new THREE.Vector3(-6, 0, 0.05),
    new THREE.Vector3(-8.4, 0, -0.2),
  ];
  S.runoffMountain = new Stream({
    count: 130, color: 0x5fb0e8, size: 2.8, opacity: 0.9, life: 14,
    path: pathMountainA, speed: 0.085, yFromTerrain: true,
    spawn: () => new THREE.Vector3(), velocity: () => new THREE.Vector3(),
  });
  S.runoffMountain2 = new Stream({
    count: 110, color: 0x5fb0e8, size: 2.8, opacity: 0.9, life: 15,
    path: pathMountainB, speed: 0.08, yFromTerrain: true,
    spawn: () => new THREE.Vector3(), velocity: () => new THREE.Vector3(),
  });
  S.runoffCity = new Stream({
    count: 70, color: 0x6cb8ee, size: 2.8, opacity: 0.9, life: 10,
    path: pathCity, speed: 0.1, yFromTerrain: true,
    spawn: () => new THREE.Vector3(), velocity: () => new THREE.Vector3(),
  });

  /* 下渗 + 地下径流 */
  S.infiltration = new Stream({
    count: 90, color: 0x7fd0a8, size: 2.4, opacity: 0.75, life: 2.2,
    spawn: () => ({ x: rnd(-5, 2.2), y: 0.52, z: rnd(-4.6, 4.6) }),
    velocity: () => new THREE.Vector3(0, -0.55, 0),
  });
  S.infiltration.dieBelow = -0.85;
  S.underground = new Stream({
    count: 90, color: 0x4aa8d8, size: 2.6, opacity: 0.7, life: 11,
    spawn: () => ({ x: rnd(-1.5, 2.2), y: rnd(-1.0, -0.5), z: rnd(-2.5, 2.5) }),
    velocity: () => new THREE.Vector3(-0.55, 0.02, 0),
  });
  S.underground.dieBelowX = -8.2;

  /* 泥沙（沿河入海，浊度驱动） */
  const pathSediment = [
    new THREE.Vector3(6.6, 0, 0), new THREE.Vector3(4.6, 0, 0.2), new THREE.Vector3(2.2, 0, 0.15),
    new THREE.Vector3(-0.6, 0, 0.1), new THREE.Vector3(-3.6, 0, 0.05), new THREE.Vector3(-6.4, 0, 0),
    new THREE.Vector3(-8.3, 0, -0.1),
  ];
  S.sediment = new Stream({
    count: 80, color: 0xb9955e, size: 3.0, opacity: 0.0, life: 12,
    path: pathSediment, speed: 0.075, yFromTerrain: true,
    spawn: () => new THREE.Vector3(), velocity: () => new THREE.Vector3(),
  });

  /* 增雨催化剂尾迹 */
  S.seeding = new Stream({
    count: 70, color: 0xf2ead2, size: 2.2, opacity: 0.8, life: 2.2,
    spawn: () => ({ x: planeG.position.x - 0.2, y: planeG.position.y - 0.08, z: planeG.position.z + rnd(-0.3, 0.3) }),
    velocity: () => new THREE.Vector3(rnd(-0.1, 0.05), rnd(-0.25, -0.1), rnd(-0.05, 0.05)),
  });
  S.seeding.wiggle = true;

  allStreams = Object.values(S);
}

/* ---------------- 环节标签 / 三态标注 / quiz 字母 ---------------- */

const LABELS = {};
function buildLabels() {
  const mk = (text, x, y, z, color = '#eaf6ff', scale = 0.016) => {
    const s = makeTextSprite(text, { fontSize: 30, color, scale, bg: 'rgba(15,30,45,0.55)' });
    s.position.set(x, y, z);
    scene.add(s);
    return s;
  };
  LABELS.evap = mk('蒸发', -12.5, 2.2, 0);
  LABELS.evapPlant = mk('蒸腾', -2.6, 1.7, -2.8, '#d8f2e2');
  LABELS.transport = mk('水汽输送', -1.6, 7.4, 0);
  LABELS.rainM = mk('地形雨', 9.4, 7.9, 0, '#dff0fc');
  LABELS.rain = mk('降水', -1.5, 4.7, 0);
  LABELS.infil = mk('下渗', -2.2, 0.3, 6.6);
  LABELS.underground = mk('地下径流', -4.5, -0.5, 6.6);
  LABELS.runoff = mk('地表径流', -3.4, 1.15, 0);
  LABELS.delta = mk('三角洲', -6.9, 0.5, 1.1, '#f2e2c2');
  LABELS.delta.visible = false;
  LABELS.dam = mk('水库调蓄', 3.3, 2.15, -0.6, '#ffe2c2');
  /* 三态变化标注（phase 章显示） */
  LABELS.stVapor = mk('汽化 · 吸热', -12.5, 3.1, 0, '#ffd9a8');
  LABELS.stLiquefy = mk('液化 · 成云', -1.6, 6.9, 0.5, '#d2ecff');
  LABELS.stDepose = mk('凝华 · 冰晶', 9.4, 8.4, 0, '#e2f4ff');
  LABELS.stMelt = mk('熔化 · 融水', 11.6, 4.6, -1.4, '#d2f6ff');
  /* 热量交换标注（meaning 章 heat 模式） */
  LABELS.heatIn = mk('蒸发带走热量', -12.5, 3.6, 0, '#ffb37a');
  LABELS.heatOut = mk('凝结送回热量', -1.6, 7.9, 0, '#ff9a6a');
  ['stVapor', 'stLiquefy', 'stDepose', 'stMelt', 'heatIn', 'heatOut'].forEach((k) => { LABELS[k].visible = false; });
}

/* quiz letters: A evap / B trans / C rain / D runoff / E infil / F ground / G etp */
const QUIZ_LETTER_DEF = [
  ['A', -12.5, 2.2, 0], ['B', -1.6, 7.4, 0], ['C', -1.5, 4.7, 0],
  ['D', -3.4, 1.15, 0], ['E', -2.2, 0.3, 6.6], ['F', -4.5, -0.5, 6.6], ['G', -2.6, 1.7, -2.8],
];
const QUIZ_LETTER_MAP = { A: '蒸发', E: '下渗', B: '水汽输送', F: '地下径流', C: '降水', G: '植物蒸腾', D: '地表径流' };
const letterSprites = [];
function buildLetterSprites() {
  QUIZ_LETTER_DEF.forEach(([ch, x, y, z]) => {
    const s = makeTextSprite(ch, { fontSize: 64, color: '#ffd166', scale: 0.02, bg: 'rgba(20,26,36,0.72)' });
    s.position.set(x, y, z);
    s.visible = false;
    scene.add(s);
    letterSprites.push(s);
  });
}
function applyQuizMode() {
  letterSprites.forEach((s) => { s.visible = state.quizMode; });
  Object.values(LABELS).forEach((s) => { s.visible = !state.quizMode && s.visible; });
}

/* ---------------- 水量平衡箭头（含辉光盘 + 数值标签） ---------------- */

const fluxG = new THREE.Group();
scene.add(fluxG);
const FLUXES = [
  { key: 'evapOcean', label: '海洋蒸发 E=505', at: [-13, 0.1, -3], v: 505, color: 0xcfe9ff, rot: 'up' },
  { key: 'precOcean', label: '海洋降水 P=458', at: [-10.5, 4.4, 3.4], v: 458, color: 0x9fd0f2, rot: 'down' },
  { key: 'precLand', label: '陆地降水 P=119', at: [-0.8, 4.6, -3.6], v: 119, color: 0x9fd0f2, rot: 'down' },
  { key: 'evapLand', label: '陆地蒸发 E=73', at: [3.4, 1.2, -4.6], v: 73, color: 0xd8ecd2, rot: 'up' },
  { key: 'runoffSea', label: '径流入海 R=46', at: [-4.2, 0.85, 2.4], v: 46, color: 0x5fb0e8, rot: 'left' },
];
const fluxMeshes = {};
function buildFluxArrows() {
  /* 杆+头合并为单一几何（1 draw call / 箭） */
  const arrowBody = (() => {
    const shaft = new THREE.CylinderGeometry(1, 1, 2, 14);
    shaft.translate(0, 1.0, 0);
    const head = new THREE.ConeGeometry(2.1, 1.2, 14);
    head.translate(0, 2.6, 0);
    return mergeGeoms([shaft, head]);
  })();
  const haloTex = makeGlowTexture('207,233,255');
  for (const f of FLUXES) {
    const g = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({
      color: f.color, transparent: true, opacity: 0.72, roughness: 0.5,
      emissive: f.color, emissiveIntensity: 0.15,
    });
    const body = new THREE.Mesh(arrowBody, mat);
    /* 箭尾辉光盘（起点视觉锚） */
    const halo = new THREE.Mesh(
      new THREE.CircleGeometry(1.5, 20),
      new THREE.MeshBasicMaterial({ map: haloTex, transparent: true, opacity: 0.4, depthWrite: false })
    );
    halo.rotation.x = -Math.PI / 2;
    halo.position.y = f.rot === 'down' ? -0.1 : 0.05;
    g.add(body, halo);
    if (f.rot === 'down') g.rotation.x = Math.PI;
    else if (f.rot === 'left') g.rotation.z = Math.PI / 2;
    g.position.set(...f.at);
    const lbl = makeTextSprite(f.label, { fontSize: 26, color: '#ffffff', scale: 0.012, bg: 'rgba(15,30,45,0.55)' });
    lbl.position.set(0, 3.6, 0);
    g.add(lbl);
    fluxG.add(g);
    fluxMeshes[f.key] = { g, body, lbl, label: f.label, v: f.v };
  }
  updateFlux(1);
}
function updateFlux(k) {
  for (const f of FLUXES) {
    const m = fluxMeshes[f.key];
    const v = f.v * k;
    const r = Math.max(0.14, Math.sqrt(v / 505) * 0.52);
    m.body.scale.set(r, 1, r);
    setSpriteText(m.lbl, m.label.replace(/=\d+/, '=' + Math.round(v)), { fontSize: 26, color: '#ffffff', scale: 0.012, bg: 'rgba(15,30,45,0.55)' });
  }
}

/* ---------------- 物理内核：下渗-径流分配 + 流量过程线 ---------------- */

/*
 * 暴雨事件模型（教学简化）：
 * · 有效降雨 Pe = P × (1 − 下渗份额)；下渗份额 f 由土壤渗透率 k、坡度、植被、硬化率共同决定
 * · 直接径流用两库 Nash 瞬时单位线：Q(t) ∝ Pe · (t/τ)² · e^(−2t/τ)；τ 随坡度增大而缩短、随植被/下渗而拉长
 * · 基流 B：地下水补给，与下渗份额和水库调节正相关（枯水期流量）
 * · 水库调蓄：洪峰段削减（削峰）、基流段抬升（补枯）
 * 输出：48h 流量过程线 + 洪峰 Qp + 峰现时间 tp（自降雨起）
 */
const HYD = { DUR: 48, DT: 0.25 };

function infiltrationShare(o = {}) {
  const soil = SOILS[o.soil || state.soil];
  const veg = o.veg !== undefined ? o.veg : state.veg;
  const harden = o.harden !== undefined ? o.harden : state.harden;
  const slopeDeg = o.slope !== undefined ? o.slope : state.slope;
  const sponge = o.sponge !== undefined ? o.sponge : state.sponge;
  const intensity = o.stormI || state.stormI;
  /* 归一化渗透能力：土壤质地为主，坡度陡→快流少渗，硬化→几乎不渗 */
  const kNorm = clamp(soil.k / 42, 0, 1);
  const slopeK = clamp(1 - (slopeDeg - 6) / 24 * 0.55, 0.2, 1);
  const vegK = 0.72 + veg * 0.28;
  const hardK = 1 - clamp(harden, 0, 0.8) * 0.85;
  const spongeK = sponge ? 1.35 : 1;
  /* 雨强越大相对下渗越弱（来不及渗） */
  const iK = clamp(1 / (0.72 + intensity * 0.34), 0.35, 1.1);
  return clamp(0.05 + kNorm * slopeK * vegK * hardK * spongeK * iK * 0.72, 0.04, 0.9);
}

function hydrograph(o = {}) {
  const P = 42 * (o.stormI !== undefined ? o.stormI : state.stormI);       // 场次降雨量（mm）
  const fInf = infiltrationShare(o);
  const Pe = P * (1 - fInf);
  const slopeDeg = o.slope !== undefined ? o.slope : state.slope;
  const veg = o.veg !== undefined ? o.veg : state.veg;
  const sponge = o.sponge !== undefined ? o.sponge : state.sponge;
  const reservoir = o.reservoir !== undefined ? o.reservoir : state.reservoir;
  const urbanQ = 1 + clamp((o.harden !== undefined ? o.harden : state.harden) - 0.2, 0, 0.7) * 0.9 + (sponge ? -0.28 : 0);
  const tau = clamp(4.4 - (slopeDeg - 6) * 0.09 - (urbanQ - 1) * 1.6 + veg * 1.1 + (sponge ? 1.2 : 0), 1.1, 9.5);
  const Qbase = 1.1 + fInf * 5.2 * (sponge ? 1.25 : 1);
  const out = [];
  let peak = 0, tp = 0;
  for (let t = 0; t <= HYD.DUR; t += HYD.DT) {
    /* 雨程：2h 起雨，持续 3h；单位线响应延迟 0.6h */
    const rain = t > 2 && t < 5 ? (o.stormI !== undefined ? o.stormI : state.stormI) : 0;
    const te = Math.max(0, t - 2.6);
    let q = Qbase + Pe / 12 * Math.pow(te / tau, 2) * Math.exp(-2 * te / tau) * urbanQ;
    if (reservoir) {
      /* 削峰补枯：峰段按超出量削 26%，枯段补 32% 基流 */
      const over = Math.max(0, q - Qbase * 1.6);
      q -= over * 0.26;
      q += (1 - Math.min(1, te / 26)) * Qbase * 0.3;
    }
    if (rain > 0) q += rain * 0.12;
    out.push(q);
    if (q > peak) { peak = q; tp = t; }
  }
  return { series: out, peak, tp, P, Pe, fInf, Qbase, tau };
}

/* 场地分配比例（径流 / 下渗 / 蒸散） */
function splitRatios(o = {}) {
  const fInf = infiltrationShare(o);
  const veg = o.veg !== undefined ? o.veg : state.veg;
  const season = o.season || state.season;
  const harden = o.harden !== undefined ? o.harden : state.harden;
  const sponge = o.sponge !== undefined ? o.sponge : state.sponge;
  const et = clamp(0.14 + veg * 0.3 + (season === 'summer' ? 0.14 : 0.04) + (sponge ? 0.03 : 0), 0.08, 0.46);
  let r = 1 - fInf - et;
  r = clamp(r, 0.05, 0.9);
  /* 归一化到 100% */
  const s = r + fInf + et;
  return { runoff: Math.round(r / s * 100), infil: Math.round(fInf / s * 100), et: Math.round(et / s * 100) };
}

/* 暴雨事件状态机（3D 视觉 + 河水响应） */
const storm = { on: false, t: 0, dur: 9 };
function startStorm() {
  storm.on = true;
  storm.t = 0;
  if (hydroWin) { hydroWin.show(true); hydroDirty = true; }
  if (typeof taskHit === 'function' && currentTasks) taskHit('storm');
}
function tickStorm(dt) {
  if (!storm.on) return;
  storm.t += dt;
  const u = storm.t / storm.dur;
  /* 强度包络：快起缓落 */
  state.stormVisual = Math.sin(Math.min(u, 1) * Math.PI) * 0.8 + (u < 1 ? 0.2 : 0);
  if (u >= 1) { storm.on = false; state.stormVisual = 0; }
}

/* 泥沙负荷（植被减少 / 暴雨 / 坡度大 → 浊度升高） */
function sedimentLoad() {
  const erod = (1 - state.veg) * 0.62 + (state.slope - 6) / 24 * 0.3 + state.stormVisual * 0.5 + (state.harden * 0.12);
  return clamp(erod, 0, 1);
}

/* ---------------- 参数联动（apply 系列） ---------------- */

const glowList = [];
let snowDirty = false;

function applySeasonWarming() {
  snowDirty = true;
  applyGlacier();
  layoutMountForest();
  iceShell.visible = state.season === 'winter' && state.warming < 2.6;
  const snowline = snowlineY();
  LABELS.stMelt.position.set(12.1, terrainH(12.1, -1.2) + 0.9, -1.2);
  /* 湖水冬季色偏灰 */
  inlandLake.material.color.set(state.season === 'winter' ? 0x58869e : WATER_BLUE);
}

function applyWind() {
  const w = state.wind;
  const boost = 0.6 + w * 1.7;
  cloudGroups.forEach((g) => { g.userData.drift = 0.14 + w * 0.24; });
  /* 云粒子随风加速：改 speed（逐粒随机倍率仍然生效） */
  S.cloudCity.speed = boost;
  S.cloudMountain.speed = boost;
  S.cloudSea.speed = boost;
  S.cloudLake.speed = boost;
  /* 蒸发粒子向陆漂移增强 */
  S.evapOcean.speed = 1 + w * 0.5;
}

function applyLandParams() {
  snowDirty = true;
  layoutTrees();
  layoutMountForest();
  /* 城市径流因子：硬化越高径流越多；海绵拦截 */
  S.runoffCity.factor = clamp((state.harden - 0.15) * 1.7, 0.05, 1.4) * (state.sponge ? 0.3 : 1);
  /* 下渗因子：海绵 1.7×，硬化抑制 */
  S.infiltration.factor = clamp(state.veg * 1.2 + (state.sponge ? 0.8 : 0) - state.harden * 0.6, 0.08, 1.8);
  S.infiltration.opacity = 0.75;
  /* 蒸腾因子随植被 */
  S.evapPlant.factor = clamp(state.veg * 1.4, 0.05, 1.3);
  /* 河水浊度 */
  const sed = sedimentLoad();
  S.sediment.opacity = sed * 0.75;
  S.sediment.factor = sed > 0.08 ? 1 : 0;
  river.mesh.material.color.set('#dceaf4').lerp(new THREE.Color(0xb9955e), sed * 0.62);
  plume.material.opacity = sed * 0.34;
  setDeltaGrowth(0.25 + sed * 0.85);
  /* 海绵元素显隐 */
  spongeG.visible = state.sponge;
  road1.material = road2.material = state.sponge ? spongeRoadMat : roadMat;
  applySeasonWarming();
}

function applyHuman() {
  /* 大坝闸门：水库调蓄关→闸门提升（泄流）*/
  const gate = damG.userData.gate;
  gate.userData.target = state.reservoir ? 0 : -0.42;
  /* 水库水面：无库→水位下降（守不住水） */
  reservoir.userData.targetY = state.reservoir ? 1.38 : 1.18;
  /* 调水渠显隐 + 受水影响 */
  canalG.visible = state.transfer;
  /* 地下水位：开采强度驱动剖面窗 */
  if (sectionWin) sectionDirty = true;
  /* 抽水引起轻微地面沉降：城市楼群整体微沉 */
  const sink = state.pumping / 100 * 0.06;
  cityG.position.y = -sink;
}

function applyCycleMode() {
  fluxG.visible = false;
  Object.keys(LABELS).forEach((k) => { LABELS[k].visible = true; });
  dimAllExcept(null);
  const m = state.cycleMode;
  if (m === 'landsea') {
    [S.cloudSea, S.cloudLake, S.rainSea, S.rainLake, S.evapLake].forEach((s) => s.setDim(true));
  } else if (m === 'sea') {
    [S.cloudCity, S.cloudMountain, S.cloudLake, S.rainCity, S.rainMountain, S.rainLake, S.evapLake].forEach((s) => s.setDim(true));
  } else if (m === 'land') {
    [S.evapOcean, S.cloudSea, S.cloudCity, S.cloudMountain, S.rainSea, S.rainCity, S.rainMountain].forEach((s) => s.setDim(true));
  }
}

const PROCESS_STREAMS = {
  evap: () => [S.evapOcean, S.evapLake],
  trans: () => [S.cloudCity, S.cloudMountain, S.cloudSea, S.cloudLake],
  rain: () => [S.rainCity, S.rainMountain, S.rainSea, S.rainLake],
  runoff: () => [S.runoffMountain, S.runoffMountain2, S.runoffCity],
  infil: () => [S.infiltration],
  ground: () => [S.underground],
  etp: () => [S.evapPlant],
};

function dimAllExcept(activeKeys) {
  allStreams.forEach((s) => s.setDim(false));
  if (!activeKeys) return;
  const active = new Set();
  activeKeys.forEach((k) => PROCESS_STREAMS[k]().forEach((s) => active.add(s)));
  allStreams.forEach((s) => { if (!active.has(s)) s.setDim(true); });
}

function applyProcessMode() {
  const m = state.processMode;
  if (m === 'all') dimAllExcept(null);
  else dimAllExcept([m]);
  const showMap = { evap: ['evap', 'stVapor'], trans: ['transport'], rain: ['rain', 'rainM'], runoff: ['runoff'], infil: ['infil'], ground: ['underground'], etp: ['evapPlant'], all: null };
  const show = showMap[m];
  Object.keys(LABELS).forEach((k) => {
    if (k.startsWith('st') || k === 'heatIn' || k === 'heatOut' || k === 'delta' || k === 'dam') return;
    LABELS[k].visible = !state.quizMode && (show === null || show.includes(k));
  });
}

/* ---------------- 提示浮条 ---------------- */

const toastEl = document.createElement('div');
toastEl.className = 'water-toast';
stage.appendChild(toastEl);
let toastTimer = 0;
function toast(msg, kind = '') {
  toastEl.textContent = msg;
  toastEl.className = 'water-toast show' + (kind ? ' ' + kind : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2600);
}

/* ---------------- 图表窗（头部折叠 → 40px 圆徽标） ---------------- */

let palCache = null;
function pal() {
  if (palCache) return palCache;
  const cs = getComputedStyle(document.documentElement);
  const g = (n, fb) => (cs.getPropertyValue(n) || fb).trim();
  palCache = {
    text: g('--text', '#e2e8f0'), dim: g('--text-faint', '#8a95a3'),
    accent: g('--accent', '#e8674a'), border: g('--card-border', 'rgba(200,220,240,0.12)'),
  };
  return palCache;
}
window.addEventListener('edulabtheme', () => { palCache = null; });

const FONT = '9.5px -apple-system, "PingFang SC", sans-serif';
const FONTB = '600 10.5px -apple-system, "PingFang SC", sans-serif';

function prepCanvas(cv, hCss) {
  const W = cv.clientWidth || 300;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(hCss * dpr)) {
    cv.width = Math.round(W * dpr);
    cv.height = Math.round(hCss * dpr);
    cv.style.height = hCss + 'px';
  }
  const ctx = cv.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, hCss);
  return { ctx, W, H: hCss };
}

function makeChartWin(title, hCss, badgeText, foldKey, posKey) {
  const el = document.createElement('div');
  el.className = 'water-chart';
  if (posKey) el.dataset.win = posKey;
  const head = document.createElement('div');
  head.className = 'wcv-head';
  const b = document.createElement('b');
  b.textContent = title;
  const info = document.createElement('span');
  info.className = 'wc-info';
  const foldBtn = document.createElement('button');
  foldBtn.type = 'button';
  foldBtn.className = 'fold-btn';
  foldBtn.textContent = '−';
  foldBtn.setAttribute('aria-label', '收起' + title + '窗');
  head.appendChild(b);
  head.appendChild(info);
  head.appendChild(foldBtn);
  const cv = document.createElement('canvas');
  el.appendChild(head);
  el.appendChild(cv);
  const badgeBtn = document.createElement('button');
  badgeBtn.type = 'button';
  badgeBtn.className = 'water-badge';
  badgeBtn.textContent = badgeText;
  badgeBtn.setAttribute('aria-label', '展开' + title + '窗');
  el.appendChild(badgeBtn);
  stage.appendChild(el);

  let folded = false;
  let shown = false;
  try {
    const saved = localStorage.getItem(foldKey);
    folded = saved !== null ? saved === '1' : window.innerWidth <= 1100;
  } catch (e) { folded = window.innerWidth <= 1100; }
  function apply() {
    el.classList.toggle('folded', folded);
    foldBtn.setAttribute('aria-expanded', String(!folded));
  }
  function toggle() {
    folded = !folded;
    try { localStorage.setItem(foldKey, folded ? '1' : '0'); } catch (e) { /* 忽略 */ }
    apply();
  }
  foldBtn.addEventListener('click', toggle);
  badgeBtn.addEventListener('click', toggle);
  apply();
  return {
    el, cv, info,
    show(v) { shown = v; el.style.display = v ? '' : 'none'; },
    get open() { return shown && !folded; },
    get visible() { return shown; },
  };
}

/* 水体库窗：占比环图 + 可点击列表（点击飞相机 + 沙盘标注） */
const storesWin = makeChartWin('地球上的水体 · 占比与更新周期', 236, '水体', 'water.foldStores', 'stores');
{
  const rows = document.createElement('div');
  rows.className = 'store-rows';
  storesWin.el.appendChild(rows);
  STORES.forEach((s) => {
    const r = document.createElement('button');
    r.type = 'button';
    r.className = 'store-row';
    r.dataset.key = s.key;
    r.innerHTML = `<span class="sw-dot" style="background:${s.color}"></span><span class="sw-name">${s.name}</span><span class="sw-share">${s.share}%</span>`;
    r.addEventListener('click', () => selectStore(s.key));
    rows.appendChild(r);
  });
  storesWin.rows = rows;
}

let selectedStore = null;
function selectStore(key) {
  const s = STORES.find((x) => x.key === key);
  if (!s) return;
  selectedStore = s;
  storesWin.rows.querySelectorAll('.store-row').forEach((r) => r.classList.toggle('on', r.dataset.key === key));
  /* 相机飞到该水体预设机位 */
  const cam = CAMS[s.cam] || CAMS.overview;
  app.setCamera(cam.pos, cam.tgt);
  /* 沙盘标注环 */
  storeMarker.position.set(...s.pos);
  storeMarker.visible = true;
  storesWin.info.textContent = `${s.name} · ${s.share}% · 更新${s.renew}`;
  if (typeof taskHit === 'function' && currentTasks) taskHit('store');
}
/* 水体标注环（脉冲呼吸） */
const storeMarker = new THREE.Group();
{
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.5, 0.03, 8, 40),
    matGlow(C.gold, 0.9)
  );
  ring.rotation.x = Math.PI / 2;
  const halo = new THREE.Mesh(
    new THREE.CircleGeometry(0.62, 24),
    new THREE.MeshBasicMaterial({ map: makeGlowTexture('226,179,74'), transparent: true, opacity: 0.4, depthWrite: false })
  );
  halo.rotation.x = -Math.PI / 2;
  storeMarker.add(ring, halo);
  storeMarker.visible = false;
  scene.add(storeMarker);
}

/* 流量过程线窗：当前参数 vs 参照（默认条件）双曲线 + 洪峰/峰现标注 */
const hydroWin = makeChartWin('流量过程线 · 一场暴雨（48h）', 200, '流量', 'water.foldHyd', 'hydro');

function drawHydro() {
  const { ctx, W, H } = prepCanvas(hydroWin.cv, 200);
  const P = pal();
  const L = 30, Rp = 8, T = 14, B = 20, pw = W - L - Rp, ph = H - T - B;
  const cur = hydrograph();
  const ref = hydrograph({ veg: 0.7, harden: 0.35, slope: 15, soil: 'loam', sponge: false, stormI: 1, reservoir: state.reservoir });
  let vmax = Math.max(cur.peak, ref.peak) * 1.18;
  const X = (t) => L + (t / HYD.DUR) * pw;
  const Y = (q) => T + (1 - q / vmax) * ph;
  /* 网格 */
  ctx.strokeStyle = P.border;
  ctx.lineWidth = 1;
  ctx.font = FONT;
  ctx.fillStyle = P.dim;
  ctx.textAlign = 'right';
  for (let k = 0; k <= 3; k++) {
    const q = vmax * k / 3;
    const y = Y(q);
    ctx.beginPath(); ctx.moveTo(L, y); ctx.lineTo(W - Rp, y); ctx.stroke();
    ctx.fillText(q.toFixed(0), L - 4, y + 3);
  }
  ctx.textAlign = 'center';
  [0, 12, 24, 36, 48].forEach((t) => ctx.fillText(t + 'h', X(t), H - 6));
  /* 雨程柱（2~5h） */
  ctx.fillStyle = 'rgba(120,180,230,0.16)';
  ctx.fillRect(X(2), T, X(5) - X(2), ph);
  ctx.fillStyle = P.dim;
  ctx.font = FONT;
  ctx.fillText('降雨', X(3.5), T + 9);
  /* 参照曲线（虚线） */
  ctx.strokeStyle = P.dim;
  ctx.lineWidth = 1.2;
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ref.series.forEach((q, i) => {
    const x = X(i * HYD.DT), y = Y(q);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.stroke();
  ctx.setLineDash([]);
  /* 当前曲线 + 填充 */
  ctx.strokeStyle = P.accent;
  ctx.lineWidth = 2;
  ctx.beginPath();
  cur.series.forEach((q, i) => {
    const x = X(i * HYD.DT), y = Y(q);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.stroke();
  ctx.lineTo(X(HYD.DUR), T + ph); ctx.lineTo(X(0), T + ph); ctx.closePath();
  ctx.fillStyle = 'rgba(230,103,74,0.12)';
  ctx.fill();
  /* 洪峰标注 */
  const px = X(cur.tp), py = Y(cur.peak);
  ctx.strokeStyle = '#ffd166';
  ctx.lineWidth = 1.2;
  ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, T + ph); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#ffd166';
  ctx.beginPath(); ctx.arc(px, py, 3.4, 0, TAU); ctx.fill();
  ctx.font = FONTB;
  ctx.textAlign = px > W - 70 ? 'right' : 'left';
  ctx.fillStyle = P.text;
  ctx.fillText(`洪峰 ${cur.peak.toFixed(1)}`, px + (px > W - 70 ? -7 : 7), py - 6);
  ctx.fillText(`峰现 +${cur.tp.toFixed(1)}h`, px + (px > W - 70 ? -7 : 7), py + 12);
  hydroWin.info.textContent = `径流 ${cur.Pe.toFixed(0)}mm · 下渗 ${(cur.fInf * 100).toFixed(0)}%`;
}

/* 全球水量平衡窗：等式验证 + 流域计算器读数 */
const balanceWin = makeChartWin('水量平衡 · 全球与流域', 216, '平衡', 'water.foldBalance', 'balance');
const balCalc = { P: 630, E: 380, R: 250 };

function drawBalance() {
  const { ctx, W, H } = prepCanvas(balanceWin.cv, 216);
  const P = pal();
  const L = 12, T = 12, B = 18;
  ctx.font = FONT;
  /* 上半：全球收支（万 km³/年）水平条图 */
  const rows = [
    { label: '海洋蒸发 E', v: 505, color: '#8fd0f0' },
    { label: '陆上蒸发 E', v: 73, color: '#8fd0f0' },
    { label: '海洋降水 P', v: 458, color: '#6aa8d8' },
    { label: '陆上降水 P', v: 119, color: '#6aa8d8' },
    { label: '入海径流 R', v: 46, color: '#7fd0a8' },
  ];
  const rowH = 16, barMax = W - L - 118;
  ctx.textAlign = 'left';
  rows.forEach((r, i) => {
    const y = T + 4 + i * (rowH + 3);
    ctx.fillStyle = P.dim;
    ctx.fillText(r.label, L, y + 9);
    const bw = (r.v / 505) * barMax;
    ctx.fillStyle = r.color;
    ctx.globalAlpha = 0.85;
    ctx.fillRect(L + 76, y + 2, bw, 9);
    ctx.globalAlpha = 1;
    ctx.fillStyle = P.text;
    ctx.fillText(String(r.v), L + 80 + bw, y + 10);
  });
  /* 两条等式 */
  ctx.font = FONTB;
  ctx.fillStyle = P.text;
  const eqY = T + 4 + rows.length * (rowH + 3) + 4;
  const okA = Math.abs(458 + 46 - 505) < 2;
  const okB = Math.abs(119 - (73 + 46)) < 2;
  ctx.fillStyle = okA ? '#5fbf8a' : P.dim;
  ctx.fillText(`海洋：458 + 46 = 505 ✓`, L, eqY + 8);
  ctx.fillStyle = okB ? '#5fbf8a' : P.dim;
  ctx.fillText(`陆地：119 = 73 + 46 ✓`, L + 150, eqY + 8);
  /* 下半：流域计算器（mm/年） */
  const cy = eqY + 22;
  ctx.strokeStyle = P.border;
  ctx.beginPath(); ctx.moveTo(L, cy); ctx.lineTo(W - L, cy); ctx.stroke();
  ctx.font = FONT;
  ctx.fillStyle = P.dim;
  ctx.fillText('流域计算器（mm/年）：', L, cy + 14);
  const items = [
    { k: 'P', label: '降水 P', v: balCalc.P, color: '#6aa8d8' },
    { k: 'E', label: '蒸发 E', v: balCalc.E, color: '#8fd0f0' },
    { k: 'R', label: '径流 R', v: balCalc.R, color: '#7fd0a8' },
  ];
  items.forEach((it, i) => {
    const x = L + i * 92;
    ctx.fillStyle = it.color;
    ctx.fillText(it.label, x, cy + 32);
    ctx.font = FONTB;
    ctx.fillStyle = P.text;
    ctx.fillText(String(it.v), x, cy + 46);
    ctx.font = FONT;
  });
  const dS = balCalc.P - balCalc.E - balCalc.R;
  ctx.font = FONTB;
  ctx.fillStyle = Math.abs(dS) <= 12 ? '#5fbf8a' : '#d98a4f';
  ctx.fillText(`ΔS = P − E − R = ${dS > 0 ? '+' : ''}${dS}`, L, cy + 62);
  ctx.font = FONT;
  ctx.fillStyle = P.dim;
  ctx.fillText(Math.abs(dS) <= 12 ? '收支平衡，水储量变化可忽略' : '收支不平衡：水储量在变化（湿地/地下水增减）', L + 150, cy + 62);
  balanceWin.info.textContent = `沙盘流域 ${sandBasinFlux().R.toFixed(1)} mm/天`;
}

/* 流域计算器滑杆引用 */
let balSliders = null;
function balanceCalcControls() {
  ctl.sep();
  const group = document.createElement('div');
  group.className = 'ctl-group';
  group.textContent = '流域收支计算器 · 年水量口径（mm）';
  document.getElementById('controls').appendChild(group);
  balSliders = ['P', 'E', 'R'].map((k) => {
    const labels = { P: '降水 P', E: '蒸发 E', R: '径流 R' };
    return ctl.slider({
      label: labels[k],
      min: k === 'P' ? 200 : k === 'E' ? 100 : 0,
      max: k === 'P' ? 1600 : k === 'E' ? 900 : 700,
      step: 10, value: balCalc[k],
      fmt: (v) => v + ' mm',
      onInput: (v) => {
        balCalc[k] = v;
        if (balanceWin.open) drawBalance();
        if (typeof taskHit === 'function' && currentTasks) taskHit('calc');
      },
    });
  });
}

/* 沙盘流域收支（mm/天，按当前参数折算的教学口径） */
function sandBasinFlux() {
  const seasonK = state.season === 'summer' ? 1.25 : 0.8;
  const P = 1.72 * seasonK * (1 + state.stormVisual * 1.8);
  const ratios = splitRatios();
  const E = P * ratios.et / 100 * 0.9;
  const R = P * ratios.runoff / 100;
  return { P, E, R, dS: P - E - R };
}

/* 地下水剖面窗：含水层 / 潜水面 / 降落漏斗 / 咸水楔 / 抽水井（2D 剖面示意） */
const sectionWin = makeChartWin('地下水剖面 · 城市段', 176, '剖面', 'water.foldSection', 'section');
let sectionDirty = true;
let sectionClock = 0;

function drawSection() {
  const { ctx, W, H } = prepCanvas(sectionWin.cv, 176);
  const P = pal();
  const L = 10, Rp = 10, T = 10, B = 16;
  const pw = W - L - Rp, ph = H - T - B;
  const groundY = T + ph * 0.3;               // 地面线
  const bedY = T + ph;                        // 隔水底板
  /* 地层 */
  ctx.fillStyle = 'rgba(150,120,80,0.32)';
  ctx.fillRect(L, groundY, pw, bedY - groundY);
  ctx.fillStyle = 'rgba(90,80,70,0.4)';
  ctx.fillRect(L, bedY - 6, pw, 6);
  ctx.font = FONT;
  ctx.fillStyle = P.dim;
  ctx.fillText('隔水底板', L + pw - 44, bedY - 9);
  /* 潜水面曲线：基准 + 抽水中心漏斗（高斯形） */
  const pump = state.pumping / 100;
  const wellX = L + pw * 0.42;
  const baseWL = groundY + (bedY - groundY) * (0.32 - (1 - infiltrationShare()) * 0.1);
  const coneDepth = pump * (bedY - baseWL) * 0.6;
  ctx.beginPath();
  for (let i = 0; i <= 60; i++) {
    const x = L + (i / 60) * pw;
    const cone = coneDepth * Math.exp(-Math.pow((x - wellX) / (pw * 0.24), 2));
    const tilt = (x - wellX) / pw * pump * 6;
    const y = baseWL + cone + tilt;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.strokeStyle = '#4aa8d8';
  ctx.lineWidth = 1.8;
  ctx.stroke();
  /* 含水层水体质感（潜水面以下淡蓝） */
  ctx.lineTo(L + pw, bedY - 6);
  ctx.lineTo(L, bedY - 6);
  ctx.closePath();
  ctx.fillStyle = 'rgba(74,168,216,0.22)';
  ctx.fill();
  /* 咸水楔（沿海侧楔形） */
  const wedgeLen = pw * (0.1 + pump * 0.34 + state.harden * 0.06);
  ctx.beginPath();
  ctx.moveTo(L + pw, bedY - 6);
  ctx.lineTo(L + pw - wedgeLen, bedY - 6);
  ctx.quadraticCurveTo(L + pw - wedgeLen * 0.5, bedY - 16, L + pw, baseWL + 14);
  ctx.closePath();
  ctx.fillStyle = 'rgba(120,160,150,0.4)';
  ctx.fill();
  ctx.fillStyle = '#7aa8a0';
  ctx.font = FONT;
  ctx.fillText('咸水楔', L + pw - wedgeLen * 0.6 + 6, bedY - 8);
  /* 抽水井 */
  ctx.strokeStyle = P.text;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(wellX, groundY - 2);
  ctx.lineTo(wellX, baseWL + coneDepth + 8);
  ctx.stroke();
  ctx.fillStyle = P.text;
  ctx.fillRect(wellX - 5, groundY - 8, 10, 6);
  ctx.fillStyle = pump > 0.55 ? '#d98a4f' : P.dim;
  ctx.fillText('抽水井', wellX - 14, groundY - 12);
  /* 地表：城市 + 补给箭头（下渗份额驱动） */
  ctx.fillStyle = P.dim;
  ctx.fillText('城市', L + 4, groundY - 3);
  const fInf = infiltrationShare();
  const nArrows = Math.round(2 + fInf * 6);
  ctx.strokeStyle = '#7fd0a8';
  ctx.lineWidth = 1.4;
  for (let i = 0; i < nArrows; i++) {
    const x = L + 26 + i * (pw - 60) / Math.max(nArrows - 1, 1);
    ctx.beginPath();
    ctx.moveTo(x, groundY + 4);
    ctx.lineTo(x, groundY + 16);
    ctx.lineTo(x - 3, groundY + 12);
    ctx.moveTo(x, groundY + 16);
    ctx.lineTo(x + 3, groundY + 12);
    ctx.stroke();
  }
  /* 地下径流方向箭头（流向海洋=画面左侧） */
  ctx.strokeStyle = '#4aa8d8';
  ctx.beginPath();
  const ugY = baseWL + 18;
  ctx.moveTo(wellX + 30, ugY);
  ctx.lineTo(wellX - 20, ugY);
  ctx.lineTo(wellX - 26, ugY - 3);
  ctx.moveTo(wellX - 20, ugY);
  ctx.lineTo(wellX - 26, ugY + 3);
  ctx.stroke();
  const wlDepth = ((baseWL + coneDepth * 0.7) - groundY) / (bedY - groundY);
  sectionWin.info.textContent = `潜水面埋深 ${(2 + pump * 14).toFixed(1)} m · 开采 ${state.pumping}%`;
}

/* ---------------- 读数卡 ---------------- */

const hud = makeHUD(stage, [
  ['season', '季节 · 雪线'],
  ['glacier', '冰川储量'],
  ['process', '当前环节'],
  ['split', '径流 : 下渗'],
  ['flood', '洪峰 · 峰现'],
  ['water', '潜水位'],
  ['basin', '沙盘流域 P/E/R'],
  ['day', '模拟时间'],
]);
document.getElementById('lcData').appendChild(hud.el);

/* ---------------- 任务系统（原版 steps 1:1） ---------------- */

let taskDefs = [];
let taskDone = new Set();
let currentTasks = false;

function renderTasks() {
  let box = document.querySelector('#lesson .lc-tasks');
  if (box) box.remove();
  if (!taskDefs.length) return;
  box = document.createElement('div');
  box.className = 'lc-tasks';
  taskDefs.forEach((t, i) => {
    const chip = document.createElement('div');
    chip.className = 'task-chip' + (taskDone.has(taskKey(i)) ? ' done' : '');
    chip.innerHTML = '<span class="tk-box">✓</span>';
    const txt = document.createElement('span');
    txt.textContent = t.t;
    chip.appendChild(txt);
    box.appendChild(chip);
  });
  document.getElementById('lesson').appendChild(box);
}
function taskKey(i) { return chapterIdx + ':' + i; }
function taskHit(key) {
  taskDefs.forEach((t, i) => {
    if (t.key === key && !taskDone.has(taskKey(i))) {
      taskDone.add(taskKey(i));
      renderTasks();
    }
  });
}

/* ---------------- 随堂检测（判分 + 解析） ---------------- */

function renderQuiz(items) {
  let box = document.querySelector('#lesson .lc-quiz');
  if (box) box.remove();
  if (!items || !items.length) return;
  box = document.createElement('div');
  box.className = 'lc-quiz';
  box.style.marginTop = '10px';
  box.style.paddingTop = '10px';
  box.style.borderTop = '1px dashed var(--card-border)';
  const head = document.createElement('div');
  head.style.cssText = 'font-size:11.5px;font-weight:600;letter-spacing:0.1em;color:var(--text-faint);margin-bottom:8px';
  head.textContent = items.length > 2 ? '随堂检测' : '随堂一问';
  box.appendChild(head);
  items.forEach((item) => {
    const q = document.createElement('div');
    q.style.marginBottom = '10px';
    const qt = document.createElement('div');
    qt.style.cssText = 'font-size:12.5px;color:var(--text);line-height:1.55;margin-bottom:6px';
    qt.textContent = typeof item.q === 'function' ? item.q() : item.q;
    q.appendChild(qt);
    const ex = document.createElement('div');
    ex.style.cssText = 'font-size:11.5px;line-height:1.55;color:var(--text-dim);margin-top:5px;display:none';
    const opts = typeof item.opts === 'function' ? item.opts() : item.opts;
    const ans = typeof item.a === 'function' ? item.a() : item.a;
    opts.forEach((opt, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'ctl-btn';
      b.style.cssText = 'display:flex;width:100%;text-align:left;font-size:11.5px;line-height:1.45;margin-bottom:4px;padding:5px 9px';
      b.textContent = String.fromCharCode(65 + i) + '. ' + opt;
      b.addEventListener('click', () => {
        q.querySelectorAll('button').forEach((bb, j) => {
          bb.disabled = true;
          if (j === ans) { bb.classList.add('active'); bb.style.borderColor = '#3fa96f'; }
          else if (j === i) bb.style.opacity = '0.55';
        });
        const exText = typeof item.ex === 'function' ? item.ex() : item.ex;
        ex.style.display = 'block';
        ex.textContent = (i === ans ? '✓ ' : '✗ ') + exText;
        if (typeof taskHit === 'function' && currentTasks) taskHit('quizAnswer');
      });
      q.appendChild(b);
    });
    q.appendChild(ex);
    box.appendChild(q);
  });
  document.getElementById('lesson').appendChild(box);
}

/* ---------------- 题库（10 题：9 静态 + 1 动态字母题） ---------------- */

function letterQuestion() {
  const keys = Object.keys(QUIZ_LETTER_MAP);
  const k = keys[Math.floor(Math.random() * keys.length)];
  const others = keys.filter((x) => x !== k).slice(0, 3);
  const opts = [QUIZ_LETTER_MAP[k], QUIZ_LETTER_MAP[others[0]], QUIZ_LETTER_MAP[others[1]], QUIZ_LETTER_MAP[others[2]]];
  /* 打乱选项，记录正确位 */
  for (let i = opts.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [opts[i], opts[j]] = [opts[j], opts[i]];
  }
  return {
    q: () => `沙盘上字母 ${k} 标注的环节是`,
    opts: () => opts,
    a: () => opts.indexOf(QUIZ_LETTER_MAP[k]),
    ex: () => `${k} 处在${k === 'B' ? '高空水平方向' : k === 'F' ? '地下' : k === 'E' ? '地表向土壤内' : '地表'}的位置：${QUIZ_LETTER_MAP[k]}。按箭头位置读图即可。`,
  };
}

const QUIZ_BANK = [
  {
    q: '修水库、调水、给地面加硬壳，动的都是哪个环节？',
    opts: ['高空水汽输送', '地表径流', '云上降水', '海陆间大搬家'],
    a: 1,
    ex: '这些工程都作用在地面水流上——拦蓄、引导、加速汇流，直接改变地表径流的时空分布。大气中的环节难以直接干预。',
  },
  {
    q: '哪类循环让陆上的淡水用掉还能补回来？',
    opts: ['海上内循环（洋面）', '海陆间循环（跨海陆）', '陆地内循环（内陆）', '三者本领一样'],
    a: 2,
    ex: '海陆之间来回的水循环，是陆上淡水的补给线：海面蒸发的水汽翻山过来落成雨，河再把它送回海。',
  },
  {
    q: '城区地面大面积水泥化之后，河流水情的变化是',
    opts: ['洪峰更高、出现更早', '洪峰更小、出现更晚', '枯水期流量变大', '下渗缩水、径流膨胀'],
    a: 0,
    ex: '水泥地面不喝水：下渗锐减、径流猛增，雨水经排水管网快速汇入河道，洪峰陡涨且提前，内涝风险随之升高。',
  },
  {
    q: '西北内陆盆地算哪类循环',
    opts: ['海上内循环（洋面）', '海陆间循环（跨海陆）', '陆地内循环（内陆）', '哪类都不沾'],
    a: 1,
    ex: '盆地窝在内陆深处，河水要么淌进内陆湖、要么渗没在沙漠里，压根到不了海——水量就在陆地上自蒸发、自降水地转圈。',
  },
  {
    q: '南水北调这类调水工程，动的是水循环的哪一项',
    opts: ['各处降水的多少', '蒸发的强弱', '径流在空间上的分布', '水汽输送的快慢'],
    a: 2,
    ex: '调水把甲流域的河水和乙流域接通，改的是径流「落在哪里」，不是天上的降水或大气输送。',
  },
  {
    q: '造林会怎样改变水循环',
    opts: ['下渗增多、径流变少、蒸腾变旺', '下渗变少、径流变多', '降水蒸发双降', '循环照旧不受影响'],
    a: 0,
    ex: '树冠兜住一部分雨，松软的枯落物放雨水慢慢往下走——地表径流随之变少、洪水更平缓；蒸腾还给大气添水汽。',
  },
  {
    q: '哪类循环搬运的水量最大',
    opts: ['海上内循环（洋面）', '海陆间循环（跨海陆）', '陆地内循环（内陆）', '三者持平'],
    a: 2,
    ex: '海洋面积广阔、蒸发量巨大，且大部分水汽直接在海洋上空凝结降回海面——海上内循环的水量遥遥领先。',
  },
  {
    q: '下面哪一项不是水循环带来的',
    opts: ['让各地降水量变得一样', '托住全球水量的收支平衡', '刻蚀与堆积塑造地表', '让淡水取用后能再补上'],
    a: 0,
    ex: '水循环缓解热量收支、搬运物质、更新淡水、平衡水量——但它不会抹平各地降水的差异，地区分布依然悬殊。',
  },
  {
    q: '滨海城市狂抽地下水，后果多半是',
    opts: ['地面沉降与海水入侵', '潜水面一路下滑', '洪峰提前赶到', '海平面反而下降'],
    a: 1,
    ex: '抽水量超过补给速度，潜水面就会一路下探、凹出一个漏斗；含水层失去水的支撑被压密实，地面跟着下陷；滨海地区淡水压力减弱，海水便顺着含水层倒灌进来。',
  },
  letterQuestion(),
];

/* ---------------- 公共控件片段 ---------------- */

const ctl = createControlsPanel(document.getElementById('controls'));

function ctlGroup(text) {
  const g = document.createElement('div');
  g.className = 'ctl-group';
  g.textContent = text;
  document.getElementById('controls').appendChild(g);
}

function baseCtl() {
  ctl.clear();
  const playBtn = ctl.button({
    label: state.playing ? '⏸ 暂停' : '▶ 播放',
    onClick() {
      state.playing = !state.playing;
      playBtn.textContent = state.playing ? '⏸ 暂停' : '▶ 播放';
    },
  });
  pauseCtl = { set(v) { state.playing = v; playBtn.textContent = v ? '⏸ 暂停' : '▶ 播放'; } };
  ctl.slider({
    label: '时间流速', min: 0.25, max: 8, step: 0.25, value: state.speed,
    fmt: (v) => v + '×',
    onInput: (v) => { state.speed = v; },
  });
  ctl.button({ label: '↺ 重置本章', onClick: () => selectChapter(chapterIdx, true) });
  return playBtn;
}
let pauseCtl = null;

function seasonSeg() {
  return ctl.seg({
    options: [{ label: '☀ 夏季', value: 'summer' }, { label: '❄ 冬季', value: 'winter' }],
    value: state.season,
    onChange: (v) => {
      state.season = v;
      if (seasonRef) seasonRef.paintOnly(v);
      applySeasonWarming();
      if (typeof taskHit === 'function' && currentTasks) taskHit(v === 'winter' ? 'winter' : 'summer');
    },
  });
}
let seasonRef = null;
/* seg 组件没有 set——包一层带 paintOnly 的 seg */
function makeSeasonSeg() {
  const seg = seasonSeg();
  seg.paintOnly = () => { /* seg 内部 value 已同步，重进章时以 state 为准 */ };
  seasonRef = seg;
  return seg;
}

function warmingSlider() {
  return ctl.slider({
    label: '全球变暖', min: 0, max: 4, step: 0.1, value: state.warming,
    fmt: (v) => '+' + v.toFixed(1) + ' °C' + (v >= 3 ? '（冰川大幅退缩）' : v >= 1.5 ? '（雪线明显抬升）' : ''),
    onInput: (v) => {
      state.warming = v;
      snowDirty = true;
      applyGlacier();
      if (v >= 3 && typeof taskHit === 'function' && currentTasks) taskHit('warm');
    },
  });
}

function windSlider() {
  return ctl.slider({
    label: '向陆风强度', min: 0, max: 1, step: 0.05, value: state.wind,
    fmt: (v) => (v < 0.2 ? '微风' : v < 0.55 ? '和风' : v < 0.85 ? '强风' : '强向陆风'),
    onInput: (v) => {
      state.wind = v;
      applyWind();
      if (v >= 0.85 && typeof taskHit === 'function' && currentTasks) taskHit('windBig');
    },
  });
}

function hardenSlider() {
  return ctl.slider({
    label: '城市硬化率', min: 0.1, max: 0.8, step: 0.05, value: state.harden,
    fmt: (v) => Math.round(v * 100) + '%' + (v >= 0.7 ? '（接近全硬化）' : ''),
    onInput: (v) => {
      state.harden = v;
      applyLandParams();
      sectionDirty = true;
      if (v >= 0.75 && typeof taskHit === 'function' && currentTasks) taskHit('hardenBig');
    },
  });
}

function vegSlider() {
  return ctl.slider({
    label: '植被覆盖率', min: 0.1, max: 1, step: 0.05, value: state.veg,
    fmt: (v) => Math.round(v * 100) + '%',
    onInput: (v) => {
      state.veg = v;
      applyLandParams();
      if (v <= 0.2 && typeof taskHit === 'function' && currentTasks) taskHit('vegLow');
    },
  });
}

function slopeSlider() {
  return ctl.slider({
    label: '山地坡度', min: 6, max: 30, step: 1, value: state.slope,
    fmt: (v) => v + '°' + (v >= 26 ? '（陡坡）' : v <= 10 ? '（缓坡）' : ''),
    onInput: (v) => {
      state.slope = v;
      slopeDirty = true;
      if (v >= 26 && typeof taskHit === 'function' && currentTasks) taskHit('slopeBig');
    },
  });
}

function soilSeg() {
  return ctl.seg({
    options: [
      { label: '砂土 · 渗得快', value: 'sand' },
      { label: '壤土 · 居中', value: 'loam' },
      { label: '黏土 · 渗得慢', value: 'clay' },
    ],
    value: state.soil,
    onChange: (v) => {
      state.soil = v;
      sectionDirty = true;
      if (typeof taskHit === 'function' && currentTasks) taskHit('soil');
    },
  });
}

function stormISlider() {
  return ctl.slider({
    label: '暴雨雨强', min: 0.5, max: 2, step: 0.1, value: state.stormI,
    fmt: (v) => '×' + v.toFixed(1) + (v >= 1.8 ? '（特大暴雨）' : ''),
    onInput: (v) => {
      state.stormI = v;
      hydroDirty = true;
      if (v >= 1.8 && typeof taskHit === 'function' && currentTasks) taskHit('rainBig');
    },
  });
}

function stormButton(label = '⛈ 来一场暴雨') {
  return ctl.button({
    label,
    onClick: () => {
      startStorm();
      hydroDirty = true;
      toast('暴雨开始：观察河水上涨、坡面汇流与城市积水', 'ok');
    },
  });
}

function spongeToggle() {
  return ctl.toggle({
    label: '海绵城市（透水铺装 · 绿屋顶 · 雨水花园）', value: state.sponge,
    onChange: (v) => {
      state.sponge = v;
      applyLandParams();
      hydroDirty = true;
      sectionDirty = true;
      if (v && typeof taskHit === 'function' && currentTasks) taskHit('sponge');
    },
  });
}

function reservoirToggle() {
  return ctl.toggle({
    label: '水库调蓄（削峰补枯）', value: state.reservoir,
    onChange: (v) => {
      state.reservoir = v;
      applyHuman();
      hydroDirty = true;
      if (!v && typeof taskHit === 'function' && currentTasks) taskHit('resOff');
    },
  });
}

function transferToggle() {
  return ctl.toggle({
    label: '跨流域调水（水库 → 城市）', value: state.transfer,
    onChange: (v) => {
      state.transfer = v;
      applyHuman();
      if (v && typeof taskHit === 'function' && currentTasks) taskHit('transfer');
      toast(v ? '调水渠开启：受水区得到外来补给' : '调水渠关闭', v ? 'ok' : '');
    },
  });
}

function pumpingSlider() {
  return ctl.slider({
    label: '地下水开采', min: 0, max: 100, step: 5, value: state.pumping,
    fmt: (v) => v + '%' + (v >= 70 ? '（超采！漏斗扩大）' : v >= 40 ? '（漏斗形成）' : ''),
    onInput: (v) => {
      state.pumping = v;
      applyHuman();
      sectionDirty = true;
      if (v >= 70 && typeof taskHit === 'function' && currentTasks) taskHit('pumpBig');
    },
  });
}

function setCameraSoon(pos, tgt) {
  clearTimeout(camTimer);
  camTimer = setTimeout(() => app.setCamera(pos, tgt), 60);
}
let camTimer = 0;

function hideAllWins() {
  storesWin.show(false);
  hydroWin.show(false);
  balanceWin.show(false);
  sectionWin.show(false);
}

/* ---------------- 章节定义（原版 11 章 1:1） ---------------- */

let chapterIdx = 0;
let activeCleanup = null;
let slopeDirty = false;
let hydroDirty = true;

/* meaning 章教学小动画句柄 */
const meaning = { sedimentAnim: 0, heatMode: false, erosion: false };

const SECTIONS = [
  /* 1 水体盘点 */
  {
    title: '地球上的水体',
    cam: 'overview',
    html: `<p>论水量，<b>海洋水</b>是绝对大户——全球总水量的 96.5% 都在它手里；陆上的湖泊河流、冰川与地下水，再算上大气里的水汽和生物体内的水，全部加起来也只有 3.5% 上下。</p>
<p><b>淡水</b>只占 2.5% 上下，近七成冻在两极冰盖与高山冰川里。河流、淡水湖、浅层地下这三种水，人类伸手就能取用，折算下来不足淡水总量的 0.3%。</p>
<p>在右侧列表<b>点一个水体</b>：沙盘会亮出它的位置并飞到近前。顺带留意右侧那份<b>更新周期</b>清单：大气水 8 天换一轮，深层地下水一换要上千年。</p>`,
    tasks: [
      { t: '比一比海洋水跟淡水谁多谁少', key: 'store' },
      { t: '找到冰川、地下水与河流的位置', key: 'store' },
      { t: '比一比各水体多久轮换一遍', key: 'store' },
      { t: '旋转视角观察沙盘', key: 'drag' },
    ],
    quiz: [QUIZ_BANK[6]],
    enter() {
      hideAllWins();
      storesWin.show(true);
      drawStoresDonut();
      baseCtl();
      ctl.sep();
      ctl.button({
        label: '⊙ 定位海洋',
        onClick: () => selectStore('ocean'),
      });
      ctl.button({
        label: '⊙ 定位冰川',
        onClick: () => selectStore('glacier'),
      });
      ctl.button({
        label: '⊙ 定位河流',
        onClick: () => selectStore('river'),
      });
      state.quizMode = false;
      applyQuizMode();
      dimAllExcept(null);
      const cam = CAMS.overview;
      setCameraSoon(cam.pos, cam.tgt);
    },
  },

  /* 2 水的三态变化 */
  {
    title: '水的三态变化',
    cam: 'mountain',
    html: `<p>冰雪是固态，江海湖溪是液态，看不见的水汽是气态——水就在这三副面孔之间不停变身，水循环正是被这些相变推动的。</p>
<p>太阳把海面和湖面晒热，水<b>汽化</b>着升上天空；水汽爬高遇冷，<b>液化</b>成云里的小水滴，到了更冷的高空干脆<b>凝华</b>成冰晶；冬天山里落雪封存，开春雪和冰川一<b>熔化</b>，融水便汇进河道。</p>
<p>切换<b>夏季 / 冬季</b>，观察雪线的升降；再拖动<b>全球变暖</b>，看雪线抬升、冰川退缩的长期趋势。</p>`,
    tasks: [
      { t: '点出汽化（蒸发）发生的位置', key: 'evapSpot' },
      { t: '看云怎么长成：液化与凝华分工', key: 'cloudWatch' },
      { t: '拨到冬季，看落雪与积雪封山', key: 'winter' },
      { t: '拨回夏季，看融雪汇进河流', key: 'summer' },
      { t: '把变暖拉到 3°C 以上', key: 'warm' },
    ],
    quiz: [
      {
        q: '高空云中的冰晶主要来自哪种相变？',
        opts: ['熔化', '凝华', '汽化', '凝固'],
        a: 1,
        ex: '水汽不经过液态、直接变为冰晶的过程是凝华，发生在足够寒冷的高空；液化成的是云滴，两者并存。',
      },
      {
        q: '全球变暖会首先观察到什么变化？',
        opts: ['海洋面积骤减', '雪线爬高、冰川收缩', '大气水汽消失', '地下水位上升'],
        a: 1,
        ex: '温度升高使降雪与融雪的平衡线上移：积雪区收缩、冰川消融加速，雪线随之抬升。',
      },
    ],
    enter() {
      hideAllWins();
      baseCtl();
      ctl.sep();
      makeSeasonSeg();
      warmingSlider();
      ctl.sep();
      ctl.toggle({ label: '显示三态标注', value: true, onChange: (v) => {
        ['stVapor', 'stLiquefy', 'stDepose', 'stMelt'].forEach((k) => { LABELS[k].visible = v; });
        if (v) LABELS.stMelt.position.set(12.1, terrainH(12.1, -1.2) + 0.9, -1.2);
      } });
      state.quizMode = false;
      applyQuizMode();
      applySeasonWarming();
      /* 高亮三态环节粒子 */
      dimAllExcept(['evap', 'trans', 'rain']);
      const cam = CAMS.mountain;
      setCameraSoon(cam.pos, cam.tgt);
      if (typeof taskHit === 'function' && currentTasks) {
        setTimeout(() => taskHit('evapSpot'), 900);
        setTimeout(() => taskHit('cloudWatch'), 1800);
      }
    },
  },

  /* 3 大循环 */
  {
    title: '海陆间循环',
    cam: 'overview',
    html: `<p>这条大循环连接海洋与陆地，是水的大迁徙，沿着六个环节走完全程：</p>
<p>① <b>蒸发</b>：太阳把海水晒成水汽送上高空<br>② <b>水汽输送</b>：风推着海洋上空的水汽奔向陆地<br>③ <b>降水</b>：水汽撞上迎风坡被抬升变冷，成云致雨（雪）<br>④ <b>地表径流</b>：顺坡的雨水进河，一路奔海<br>⑤ <b>下渗</b>：一部分雨水钻进土壤，朝着潜水面一路向下<br>⑥ <b>地下径流</b>：地下水在透水层里慢慢挪，补给了河流或直抵海洋</p>
<p>点<b>分步观察</b>逐环节点亮，或点下方按钮单独聚焦某一环节。</p>`,
    tasks: [
      { t: '分步看完六个环节', key: 'stepAll' },
      { t: '单独聚焦一个环节', key: 'focusOne' },
      { t: '拖动画面跟随水汽路径', key: 'drag' },
    ],
    quiz: [
      {
        q: '海陆间循环中，把水汽从海洋上空送往陆地上空的是',
        opts: ['水汽输送', '地表径流', '下渗', '蒸发'],
        a: 0,
        ex: '水汽输送靠大气环流完成：风把蒸发到海洋上空的水汽水平搬运到陆地上空，是连接海洋与陆地的关键一跳。',
      },
      {
        q: '雨水下渗后进入土壤，最终去向是',
        opts: ['原地消失', '沿地下径流缓慢补给河流或入海', '全部蒸发回云', '变成矿物'],
        a: 1,
        ex: '渗入土壤的水在透水层中缓慢流动，成为地下径流，多以泉水或河道基流的形式重返地表水系统。',
      },
    ],
    enter() {
      hideAllWins();
      baseCtl();
      ctl.sep();
      ctl.button({
        label: '▶ 分步观察（①蒸发 → ⑥地下径流）',
        onClick: () => {
          state.seaStep = (state.seaStep || 0) + 1;
          applySeaStep();
          if (state.seaStep >= 6) {
            if (typeof taskHit === 'function' && currentTasks) taskHit('stepAll');
          }
        },
      });
      ctl.sep();
      const items = [
        ['all', '全部'], ['evap', '① 蒸发（海面起汽）'], ['trans', '② 水汽输送（随风赴陆）'], ['rain', '③ 降水（成云致雨）'],
        ['runoff', '④ 地表径流（沿坡入河）'], ['infil', '⑤ 下渗（钻进土壤）'], ['ground', '⑥ 地下径流（暗流归海）'],
      ];
      const btns = [];
      const paint = () => btns.forEach(({ b, v }) => b.classList.toggle('active', v === state.processMode));
      items.forEach(([v, label]) => {
        const b = ctl.button({
          label,
          onClick: () => {
            state.processMode = v;
            applyProcessMode();
            paint();
            if (v !== 'all' && typeof taskHit === 'function' && currentTasks) taskHit('focusOne');
          },
        });
        btns.push({ b, v });
      });
      paint();
      state.quizMode = false;
      applyQuizMode();
      state.seaStep = 0;
      state.processMode = 'all';
      applyProcessMode();
      const cam = CAMS.overview;
      setCameraSoon(cam.pos, cam.tgt);
    },
  },

  /* 4 三类水循环 */
  {
    title: '三类水循环',
    cam: 'overview',
    html: `<p>拿空间范围当标尺，水循环分成三类：</p>
<p>① <b>海陆间循环</b>（大循环）：海洋 ⇄ 陆地，海水蒸发后输送到陆地上空降水，再以径流回海——陆地水由此不断得到补充，与人类关系最密切；② <b>陆地内循环</b>：内陆湖面蒸发与植物蒸腾的水汽在陆地上空成雨，水量虽小却是内陆地区的生命线；③ <b>海上内循环</b>：海水蒸发后直接在海洋上空降水，参与水量最大。</p>
<p>三类循环<b>同时开动</b>、互相交织，合在一起才是完整的全球水循环。点按钮切换，被点亮的粒子即该循环的参与环节。</p>`,
    tasks: [
      { t: '切换三类循环逐一观察', key: 'cycleSwitch' },
      { t: '对比三类循环的参与水量', key: 'cycleCompare' },
    ],
    quiz: [
      {
        q: '内陆干旱区主要依赖哪类循环补水？',
        opts: ['海上内循环（洋面）', '海陆间循环（跨海陆）', '陆地内循环（内陆）', '都没有'],
        a: 1,
        ex: '深居内陆的地区远离海洋水汽，湖面蒸发与植物蒸腾再降水（陆地内循环）是当地有限但关键的补水途径。',
      },
    ],
    enter() {
      hideAllWins();
      baseCtl();
      ctl.sep();
      const items = [
        ['sea', '海上内循环 · 洋面'], ['landsea', '海陆间循环 · 跨海陆'], ['land', '陆地内循环 · 内陆'], ['all', '全部同时进行'],
      ];
      const btns = [];
      const paint = () => btns.forEach(({ b, v }) => b.classList.toggle('active', v === state.cycleMode));
      items.forEach(([v, label]) => {
        const b = ctl.button({
          label,
          onClick: () => {
            state.cycleMode = v;
            applyCycleMode();
            paint();
            if (typeof taskHit === 'function' && currentTasks) taskHit('cycleSwitch');
          },
        });
        btns.push({ b, v });
      });
      paint();
      state.cycleMode = 'landsea';
      applyCycleMode();
      state.quizMode = false;
      applyQuizMode();
      const cam = CAMS.overview;
      setCameraSoon(cam.pos, cam.tgt);
    },
  },

  /* 5 下渗与地表径流 */
  {
    title: '下渗与地表径流',
    cam: 'slope',
    html: `<p>一场雨落地，只有三条去处：先被植被<b>截留</b>着蒸发一部分，一部分<b>下渗</b>进土壤，剩下的淌成<b>地表径流</b>。渗下去的多，跑掉的就少，地下水的进账也就足。</p>
<p>左右下渗量的是什么：<b>雨强</b>——下得越急，来得及渗的越少；<b>坡度</b>——坡陡流急，下渗少；<b>植被</b>——根系与枯落物让土壤疏松，下渗多；<b>土质</b>——砂土孔隙大、渗得快，黏土闷得慢；<b>硬化地面</b>——水泥与沥青基本不喝水。</p>
<p>参数拨好后按一下<b>来一场暴雨</b>，对照右侧<b>流量过程线</b>读洪峰与峰现时间。</p>`,
    tasks: [
      { t: '把植被覆盖率调低，看径流比例怎么动', key: 'vegLow' },
      { t: '坡度加大，再跑一场暴雨', key: 'slopeBig' },
      { t: '土壤在砂土、黏土之间各换一次', key: 'soil' },
      { t: '雨强调大，看下渗还来不来得及', key: 'rainBig' },
      { t: '来一场暴雨，读洪峰与峰现时间', key: 'storm' },
    ],
    quiz: [
      {
        q: '其他条件相同，坡度变陡后',
        opts: ['下渗增多、径流减少', '下渗减少、径流增多且更快', '只有蒸发变化', '土壤吸水能力增强'],
        a: 1,
        ex: '坡陡水急：雨水停留时间短、入渗机会少，大部分迅速转化为地表径流，汇流速度也更快。',
      },
      {
        q: '砂土下暴雨与黏土下暴雨相比',
        opts: ['砂土地表径流更大', '黏土地表径流更大', '两者完全相同', '砂土完全不产流'],
        a: 1,
        ex: '砂土孔隙大渗透快，大部分雨水就地入渗；黏土渗率低，雨强一旦超过渗透能力便迅速转为径流。',
      },
    ],
    enter() {
      hideAllWins();
      hydroWin.show(true);
      hydroDirty = true;
      state.veg = 0.7; state.slope = 15; state.soil = 'loam'; state.stormI = 1;
      baseCtl();
      ctl.sep();
      vegSlider();
      slopeSlider();
      soilSeg();
      stormISlider();
      ctl.sep();
      stormButton();
      /* 分配比例条 */
      const card = document.createElement('div');
      card.className = 'hud-card';
      card.style.cssText = 'width:100%;background:var(--chip-bg);border:1px solid var(--card-border);box-shadow:none';
      card.innerHTML = `
        <div style="margin-bottom:4px"><b>本场暴雨去向</b>（随参数实时变化）</div>
        <div class="bar-row"><span class="bar-label">径流</span><div class="bar-track"><div class="bar-fill" id="wc-bar-runoff" style="background:#e2934a"></div></div><span class="bar-val" id="wc-val-runoff">–</span></div>
        <div class="bar-row"><span class="bar-label">下渗</span><div class="bar-track"><div class="bar-fill" id="wc-bar-infil" style="background:#4f9d8a"></div></div><span class="bar-val" id="wc-val-infil">–</span></div>
        <div class="bar-row"><span class="bar-label">蒸散</span><div class="bar-track"><div class="bar-fill" id="wc-bar-et" style="background:#7aa6d9"></div></div><span class="bar-val" id="wc-val-et">–</span></div>`;
      document.getElementById('controls').appendChild(card);
      updateSplitCard();
      state.quizMode = false;
      applyQuizMode();
      applyLandParams();
      const cam = CAMS.slope;
      setCameraSoon(cam.pos, cam.tgt);
    },
  },

  /* 6 意义 */
  {
    title: '水循环的四大地理意义',
    cam: 'overview',
    html: `<p>四大意义落在四个圈层上——<b>岩石圈、水圈、大气圈、生物圈</b>被水循环缝成一体：</p>
<p>① <b>水量动态平衡</b>：海里蒸发掉的水，靠降水与径流如数归还，收支长期持平；② <b>物质搬运与能量交换</b>：泥沙和溶解物随河流从陆地搬向海洋，蒸发时夺走热量、凝结时如数奉还，低纬的盈余就这样输往高纬；③ <b>雕刻地表</b>：上游急流下切出 V 形谷，下游与河口慢下来堆出平原和三角洲；④ <b>淡水不断更新</b>：取用掉的淡水，靠循环补回来。</p>
<p>点下方按钮在沙盘上逐项验证。</p>`,
    tasks: [
      { t: '点「泥沙入海」——看河口三角洲往外长', key: 'deltaGrow' },
      { t: '点「热量交换」——找到吸热与放热的位置', key: 'heatWatch' },
      { t: '点「侵蚀与堆积」——认出 V 形谷与三角洲', key: 'erosionWatch' },
      { t: '植被调少，看河水变浑浊', key: 'vegLow' },
    ],
    quiz: [
      {
        q: '河流把低纬度的热量送往高纬度，主要靠的是',
        opts: ['河水的流动', '蒸发吸热与凝结放热的接力', '地下径流', '冰川运动'],
        a: 1,
        ex: '水在低纬蒸发时吸热，水汽被输送到高纬凝结时放热——潜热输送是全球热量收支的重要平衡机制。',
      },
    ],
    enter() {
      hideAllWins();
      baseCtl();
      ctl.sep();
      ctl.button({
        label: '🟤 泥沙入海 · 三角洲生长',
        onClick: () => {
          meaning.sedimentAnim = 6;
          S.sediment.opacity = 0.8;
          S.sediment.factor = 1.4;
          const cam = CAMS.delta;
          setCameraSoon(cam.pos, cam.tgt);
          if (typeof taskHit === 'function' && currentTasks) taskHit('deltaGrow');
          toast('泥沙沿河而下，在河口堆积——三角洲正在向外生长', 'ok');
        },
      });
      ctl.button({
        label: '🔥 热量交换 · 吸热与放热',
        onClick: () => {
          meaning.heatMode = !meaning.heatMode;
          LABELS.heatIn.visible = meaning.heatMode;
          LABELS.heatOut.visible = meaning.heatMode;
          dimAllExcept(meaning.heatMode ? ['evap', 'trans', 'rain'] : null);
          if (meaning.heatMode && typeof taskHit === 'function' && currentTasks) taskHit('heatWatch');
          toast(meaning.heatMode ? '海面蒸发吸热（冷），水汽凝结放热（暖）——热量被搬往高处与高纬' : '已关闭热量标注');
        },
      });
      ctl.button({
        label: '⛰ 侵蚀与堆积 · 找 V 形谷与三角洲',
        onClick: () => {
          meaning.erosion = !meaning.erosion;
          LABELS.delta.visible = meaning.erosion;
          if (meaning.erosion && typeof taskHit === 'function' && currentTasks) taskHit('erosionWatch');
          if (meaning.erosion) {
            setCameraSoon(CAMS.mountain.pos, CAMS.mountain.tgt);
            toast('上游急流下切出 V 形谷（山地）；下游流速放缓，泥沙在河口堆出三角洲');
          }
        },
      });
      ctl.sep();
      vegSlider();
      state.quizMode = false;
      applyQuizMode();
      applyLandParams();
      LABELS.heatIn.visible = false;
      LABELS.heatOut.visible = false;
      meaning.heatMode = false;
      meaning.erosion = false;
      const cam = CAMS.overview;
      setCameraSoon(cam.pos, cam.tgt);
    },
  },

  /* 7 城市与海绵 */
  {
    title: '海绵城市与城市化应对',
    cam: 'city',
    html: `<p>城市扩张把农田绿地换成楼群、水泥与沥青：雨水<b>下渗锐减、径流猛增</b>，又经排水管网迅速压向河道——</p>
<p>· 洪峰更猛、来得更早，内涝风险升高<br>· 地下水断了补给，枯水期河里的水明显变少<br>· 蒸散变弱，城区又干又热</p>
<p><b>海绵城市</b>靠透水砖、绿屋顶、下凹绿地与雨水花园，让城区学着海绵「渗、滞、蓄、净、用、排」——先吸住、存下、滤净，要用时再放出来。</p>
<p>拨动<b>硬化率</b>、切换<b>海绵城市</b>，来一场暴雨对比流量过程线；再看<b>剖面窗</b>里地下水补给的差别。</p>`,
    tasks: [
      { t: '把硬化率从 10% 拉到 80%', key: 'hardenBig' },
      { t: '跑一场暴雨，把洪峰和峰现时间读出来', key: 'storm' },
      { t: '开启海绵模式，再跑一场做对比', key: 'sponge' },
      { t: '看剖面：地下水补给怎样变化', key: 'sectionWatch' },
    ],
    quiz: [
      {
        q: '海绵城市的「渗、滞、蓄」主要针对城市水循环的哪一对矛盾？',
        opts: ['降水太多与太少', '径流过快与地下水补给不足', '蒸发过强与过弱', '水汽输送的方向'],
        a: 1,
        ex: '硬化让雨水跑得太快（洪峰陡）、渗得太少（地下水亏）。海绵设施把水留住、渗下去、慢慢放，同时缓解内涝与缺水。',
      },
    ],
    enter() {
      hideAllWins();
      hydroWin.show(true);
      sectionWin.show(true);
      hydroDirty = true;
      sectionDirty = true;
      state.harden = 0.35;
      state.sponge = false;
      baseCtl();
      ctl.sep();
      hardenSlider();
      spongeToggle();
      ctl.sep();
      stormButton();
      ctl.sep();
      /* 对比读数：城市化以前 vs 当前 */
      const card = document.createElement('div');
      card.className = 'hud-card';
      card.style.cssText = 'width:100%;background:var(--chip-bg);border:1px solid var(--card-border);box-shadow:none';
      card.id = 'wc-urban-card';
      document.getElementById('controls').appendChild(card);
      updateUrbanCard();
      state.quizMode = false;
      applyQuizMode();
      applyLandParams();
      applyHuman();
      const cam = CAMS.city;
      setCameraSoon(cam.pos, cam.tgt);
      setTimeout(() => { if (typeof taskHit === 'function' && currentTasks) taskHit('sectionWatch'); }, 1200);
    },
  },

  /* 8 人类活动 */
  {
    title: '人类怎么改水循环',
    cam: 'dam',
    html: `<p>人类插手最多的是<b>地表径流</b>这一环，下渗、蒸发、降水也会被波及：</p>
<p>· <b>修水库</b>：洪水来了拦一拦、枯水季放一放，<b>削峰补枯</b>；库面变大后蒸发也跟着多<br>· <b>人工增雨</b>：往云里撒催化剂，帮水汽提前变成雨<br>· <b>跨流域调水</b>（南水北调即是）：把水送进另一个流域，径流的<b>空间分布</b>随之改变<br>· <b>种树造林</b>：下渗和蒸腾一起涨，地表径流与水土流失一起落<br>· <b>地下水超采</b>：抽出一个<b>降落漏斗</b>，地面跟着沉降，滨海还会招来<b>海水入侵</b></p>
<p>逐项打开右侧开关，对照<b>剖面窗</b>与<b>流量过程线</b>观察后果。</p>`,
    tasks: [
      { t: '水库一关，暴雨一来，对比洪峰变化', key: 'resOff' },
      { t: '开通调水渠，看受水区有什么变化', key: 'transfer' },
      { t: '地下水开采拉满，看漏斗与咸水楔', key: 'pumpBig' },
      { t: '派飞机上天，做一次增雨作业', key: 'seed' },
    ],
    quiz: [
      {
        q: '水库「削峰补枯」改变了径流的',
        opts: ['总量', '时间分布', '空间分布', '化学成分'],
        a: 1,
        ex: '水库把洪水期的水存起来、枯水期再放——径流的时间分配被摊平，总水量基本不变；跨流域调水才是改变空间分布。',
      },
    ],
    enter() {
      hideAllWins();
      sectionWin.show(true);
      hydroWin.show(true);
      sectionDirty = true;
      hydroDirty = true;
      state.pumping = 10;
      state.transfer = false;
      baseCtl();
      ctl.sep();
      reservoirToggle();
      transferToggle();
      pumpingSlider();
      ctl.sep();
      ctl.button({
        label: '✈ 人工增雨作业',
        onClick: () => {
          state.seedActive = 1;
          planeG.visible = true;
          planeG.userData.t = 0;
          if (typeof taskHit === 'function' && currentTasks) taskHit('seed');
          toast('飞机已起飞，正在云层里撒播催化剂催雨', 'ok');
        },
      });
      state.quizMode = false;
      applyQuizMode();
      applyHuman();
      applyLandParams();
      const cam = CAMS.dam;
      setCameraSoon(cam.pos, cam.tgt);
    },
  },

  /* 9 水量平衡 */
  {
    title: '水量平衡',
    cam: 'overview',
    html: `<p>把时间拉到多年平均，全球的水账是<b>平</b>的（单位：万 km³/年）：</p>
<p><b>海洋</b>：蒸发 505 = 降水 458 + 入海径流 46；<b>陆地</b>：降水 119 = 径流 46 + 蒸发 73。<b>海洋既是水循环的起点，也是它的终点</b>——多蒸发出来的水汽，正是陆上降水的家底。</p>
<p>对任一流域，同样满足 <b>ΔS = P − E − R</b>：降水减蒸发再减径流，就是储量的变化。长期不灌溉、不开采时 ΔS≈0；过度用水或毁林会打破局地平衡。</p>
<p>右侧图窗逐项验证两条等式；拖动<b>流域计算器</b>的 P、E、R，看收支何时失衡。</p>`,
    tasks: [
      { t: '对着全球收支图核一遍两条等式', key: 'balanceRead' },
      { t: '拨动流域计算器的 P、E、R', key: 'calc' },
      { t: '把夏季、冬季的沙盘流域收支各读一遍', key: 'basinCompare' },
    ],
    quiz: [
      {
        q: '某流域多年平均 P=800、E=420、R=330（mm/年），说明',
        opts: ['收支平衡', '水储量每年增加 50 mm', '水储量每年减少 50 mm', '观测有误'],
        a: 1,
        ex: 'ΔS = P − E − R = 800 − 420 − 330 = +50：每年有盈余补给储量（湿地扩大、水位回升等），收支并未失衡。',
      },
    ],
    enter() {
      hideAllWins();
      balanceWin.show(true);
      drawBalance();
      fluxG.visible = true;
      Object.values(S).forEach((s) => s.setDim(true));
      baseCtl();
      ctl.sep();
      ctl.slider({
        label: '全球降水变化', min: -30, max: 30, step: 1, value: 0,
        fmt: (v) => (v > 0 ? '+' : '') + v + '%',
        onInput: (v) => updateFlux(1 + v / 100),
      });
      balanceCalcControls();
      ctl.sep();
      const card = document.createElement('div');
      card.className = 'hud-card';
      card.style.cssText = 'width:100%;background:var(--chip-bg);border:1px solid var(--card-border);box-shadow:none';
      card.id = 'wc-basin-card';
      document.getElementById('controls').appendChild(card);
      state.quizMode = false;
      applyQuizMode();
      applyHuman();
      updateBasinCard();
      if (typeof taskHit === 'function' && currentTasks) setTimeout(() => taskHit('balanceRead'), 900);
      const cam = CAMS.overview;
      setCameraSoon(cam.pos, cam.tgt);
    },
  },

  /* 10 随堂检测（字母读图） */
  {
    title: '随堂检测',
    cam: 'faceWide',
    html: `<p>环节标签都换成了<b>字母</b>钉在沙盘上。对照字母读图作答，答完显示解析。</p>
<p>提示：先认准「海面 → 高空 → 陆地 → 河道 → 地下」的路径顺序，再对号入座。</p>`,
    tasks: [
      { t: '答对 3 题', key: 'quizAnswer' },
    ],
    quiz: [
      letterQuestion(),
      QUIZ_BANK[0], QUIZ_BANK[1], QUIZ_BANK[2],
      QUIZ_BANK[3], QUIZ_BANK[4], QUIZ_BANK[5],
      QUIZ_BANK[6], QUIZ_BANK[7], QUIZ_BANK[8],
    ],
    enter() {
      hideAllWins();
      baseCtl();
      state.quizMode = true;
      applyQuizMode();
      state.processMode = 'all';
      applyProcessMode();
      dimAllExcept(null);
      const cam = CAMS.faceWide;
      setCameraSoon(cam.pos, cam.tgt);
    },
    leave() {
      state.quizMode = false;
      applyQuizMode();
    },
  },

  /* 11 自由探索 */
  {
    title: '自由探索',
    cam: 'overview',
    html: `<p>全部参数都交到你手上。自由组合条件，看各环节怎么接招：</p>
<p>· <b>强向陆风 + 盛夏</b>：迎风坡泼下暴雨，河水猛涨<br>· <b>冬季</b>：山头积雪封顶，河水改由地下水撑着<br>· <b>毁林 + 高硬化 + 暴雨</b>：洪峰陡得像墙，泥沙翻倍<br>· <b>全球变暖</b>：雪线抬升，冰川持续退缩</p>
<p>也可以从下方<b>情境预设</b>一键直达。</p>`,
    tasks: [
      { t: '试出「强向陆风 + 夏季」的迎风坡暴雨', key: 'windBig' },
      { t: '试出冬季的积雪与地下水补给', key: 'winter' },
      { t: '试出「毁林 + 高硬化 + 暴雨」的陡涨洪峰', key: 'combo' },
      { t: '把全球变暖拉满看冰川', key: 'warm' },
    ],
    quiz: [],
    enter() {
      hideAllWins();
      baseCtl();
      ctl.sep();
      ctlGroup('环境参数');
      makeSeasonSeg();
      warmingSlider();
      ctl.sep();
      ctlGroup('循环环节');
      vegSlider();
      slopeSlider();
      windSlider();
      soilSeg();
      stormISlider();
      ctl.sep();
      ctlGroup('人为调控');
      hardenSlider();
      spongeToggle();
      ctl.sep();
      ctlGroup('综合演练');
      reservoirToggle();
      transferToggle();
      pumpingSlider();
      ctl.sep();
      stormButton();
      ctl.sep();
      ctlGroup('情境预设');
      const presets = [
        ['⛈ 迎风坡暴雨', () => { state.season = 'summer'; state.wind = 1; state.stormI = 1.6; applyWind(); applyLandParams(); }],
        ['❄ 冬季封雪', () => { state.season = 'winter'; state.warming = 0; applySeasonWarming(); }],
        ['🪓 毁林 + 高硬化 + 暴雨', () => { state.veg = 0.15; state.harden = 0.8; state.stormI = 1.8; state.sponge = false; applyLandParams(); if (typeof taskHit === 'function' && currentTasks) taskHit('combo'); }],
        ['🌡 全球变暖', () => { state.warming = 4; state.season = 'summer'; applySeasonWarming(); }],
      ];
      presets.forEach(([label, fn]) => {
        ctl.button({
          label,
          onClick: () => { fn(); startStorm(); hydroDirty = true; toast('已套用情境：' + label.replace(/^\S+\s/, ''), 'ok'); },
        });
      });
      state.quizMode = false;
      applyQuizMode();
      applyWind();
      applyLandParams();
      applyHuman();
      const cam = CAMS.overview;
      setCameraSoon(cam.pos, cam.tgt);
    },
  },
];

/* ---------------- 章节切换 ---------------- */

const chapNav = document.getElementById('chapNav');
const chapCount = document.getElementById('chapCount');
const railNoL = document.getElementById('railNoL');
const railTitleR = document.getElementById('railTitleR');
const detailNo = document.getElementById('detailNo');
const detailTitle = document.getElementById('detailTitle');
const lessonEl = document.getElementById('lesson');
const detailBody = document.getElementById('detailBody');
const controlsEl = document.getElementById('controls');
const waterShell = document.getElementById('waterShell');

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

function selectChapter(i, replay = false) {
  chapterIdx = clamp(i, 0, SECTIONS.length - 1);
  const sec = SECTIONS[chapterIdx];
  chapBtns.forEach((b, j) => {
    const on = j === chapterIdx;
    b.classList.toggle('on', on);
    if (on) b.setAttribute('aria-current', 'true');
    else b.removeAttribute('aria-current');
  });
  /* 滚动到可见 */
  const onBtn = chapBtns[chapterIdx];
  if (onBtn && onBtn.scrollIntoView) onBtn.scrollIntoView({ block: 'nearest' });
  chapCount.textContent = String(chapterIdx + 1).padStart(2, '0') + '/' + String(SECTIONS.length).padStart(2, '0');
  detailNo.textContent = String(chapterIdx + 1).padStart(2, '0');
  detailTitle.textContent = sec.title;
  railNoL.textContent = String(chapterIdx + 1).padStart(2, '0');
  railTitleR.textContent = sec.title;
  if (activeCleanup) { activeCleanup(); activeCleanup = null; }
  const prev = lastSection;
  if (prev && prev.leave) prev.leave();
  lastSection = sec;
  lessonEl.innerHTML = sec.html;
  taskDefs = sec.tasks || [];
  taskDone.clear();
  currentTasks = taskDefs.length > 0;
  /* 水量平衡箭头只在第 9 章出现 */
  fluxG.visible = chapterIdx === 8;
  renderTasks();
  renderQuiz(sec.quiz);
  sec.enter();
  accSecs.controls.classList.toggle('acc-empty', !controlsEl.children.length);
  accSecs.data.classList.toggle('acc-empty', false);
  hud.el.style.display = '';
  detailBody.scrollTop = 0;
  if (!replay) {
    const cam = CAMS[sec.cam] || CAMS.overview;
    app.setCamera(cam.pos, cam.tgt);
  }
}
let lastSection = null;

function gotoChapter(i) { selectChapter((i + SECTIONS.length) % SECTIONS.length); }

/* seaLand 分步演示：逐步点亮环节 */
function applySeaStep() {
  let step = state.seaStep || 0;
  if (step > 6) step = state.seaStep = 1;
  const order = ['evap', 'trans', 'rain', 'runoff', 'infil', 'ground'];
  const captions = [
    '① 蒸发：海水吸热变为水汽上升',
    '② 输送：风推着水汽奔向陆地',
    '③ 降水：迎风坡抬升冷却，成云致雨',
    '④ 地表径流：雨水沿坡汇河入海',
    '⑤ 下渗：部分雨水钻进土壤',
    '⑥ 地下径流：地下水缓慢补给河流与海洋',
  ];
  if (step <= 0) { dimAllExcept(null); return; }
  const keys = order.slice(0, step);
  dimAllExcept(keys);
  toast(captions[step - 1], 'ok');
}

/* ---------------- 分配比例 / 城市对比 / 流域收支卡片 ---------------- */

function updateSplitCard() {
  const q = (s) => document.getElementById(s);
  if (!q('wc-bar-runoff')) return;
  const r = splitRatios();
  q('wc-bar-runoff').style.width = r.runoff + '%'; q('wc-val-runoff').textContent = r.runoff + '%';
  q('wc-bar-infil').style.width = r.infil + '%'; q('wc-val-infil').textContent = r.infil + '%';
  q('wc-bar-et').style.width = r.et + '%'; q('wc-val-et').textContent = r.et + '%';
}

function updateUrbanCard() {
  const card = document.getElementById('wc-urban-card');
  if (!card) return;
  const cur = hydrograph();
  const pre = hydrograph({ harden: 0.1, veg: 0.9, sponge: false });
  const rise = (cur.peak / Math.max(pre.peak, 0.01) - 1) * 100;
  card.innerHTML = `
    <div style="margin-bottom:4px"><b>流量对比</b>（vs 城市化以前）</div>
    <div class="bar-row"><span class="bar-label">洪峰</span><div class="bar-track"><div class="bar-fill" style="background:#e2934a;width:${clamp(rise, 0, 100)}%"></div></div><span class="bar-val">${rise >= 0 ? '+' : ''}${rise.toFixed(0)}%</span></div>
    <div class="bar-row"><span class="bar-label">峰现</span><div class="bar-track"><div class="bar-fill" style="background:#d9803f;width:${clamp((pre.tp - cur.tp) * 22, 0, 100)}%"></div></div><span class="bar-val">提前 ${(pre.tp - cur.tp).toFixed(1)}h</span></div>
    <div class="bar-row"><span class="bar-label">地下水补给</span><div class="bar-track"><div class="bar-fill" style="background:#4f9d8a;width:${clamp(cur.fInf / pre.fInf * 100 - 20, 0, 100)}%"></div></div><span class="bar-val">${(cur.fInf * 100).toFixed(0)}%</span></div>`;
}

function updateBasinCard() {
  const card = document.getElementById('wc-basin-card');
  if (!card) return;
  const f = sandBasinFlux();
  card.innerHTML = `
    <div style="margin-bottom:4px"><b>沙盘流域账本（mm/天）</b></div>
    <div style="font-size:12px;line-height:1.6;color:var(--text-dim)">降水 P ${f.P.toFixed(2)} · 蒸发 E ${f.E.toFixed(2)} · 径流 R ${f.R.toFixed(2)}<br>ΔS = ${f.dS >= 0 ? '+' : ''}${f.dS.toFixed(2)} mm/天（${Math.abs(f.dS) < 0.2 ? '基本平衡' : f.dS > 0 ? '储水增加' : '储水消耗'}）</div>`;
}

/* 水体占比环图 */
function drawStoresDonut() {
  const { ctx, W, H } = prepCanvas(storesWin.cv, 96);
  const P = pal();
  const cx = 58, cy = H / 2, r = 36;
  const parts = [
    ['海洋水', 96.5, '#3f8fc9'], ['冰川', 1.74, '#cfe6f2'], ['地下水', 1.69, '#4aa8d8'],
    ['其他', 0.07, '#8a95a3'],
  ];
  let a0 = -Math.PI / 2;
  parts.forEach(([label, v, color]) => {
    const a1 = a0 + (v / 100) * TAU;
    ctx.beginPath();
    ctx.arc(cx, cy, r, a0, a1);
    ctx.arc(cx, cy, r * 0.62, a1, a0, true);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    a0 = a1;
  });
  /* 中心留白文字 */
  ctx.fillStyle = P.text;
  ctx.font = FONTB;
  ctx.textAlign = 'center';
  ctx.fillText('97.5%', cx, cy + 1);
  ctx.font = FONT;
  ctx.fillStyle = P.dim;
  ctx.fillText('咸水', cx, cy + 13);
  /* 图例 */
  ctx.textAlign = 'left';
  ctx.font = FONT;
  parts.forEach(([label, v, color], i) => {
    const y = 16 + i * 17;
    ctx.fillStyle = color;
    ctx.fillRect(108, y - 7, 9, 9);
    ctx.fillStyle = P.dim;
    ctx.fillText(`${label} ${v}%`, 122, y + 2);
  });
}

/* ---------------- 栏折叠 × 专注 × 课堂 ---------------- */

const foldLBtn = document.getElementById('foldLBtn');
const unfoldLBtn = document.getElementById('unfoldLBtn');
const foldRBtn = document.getElementById('foldRBtn');
const unfoldRBtn = document.getElementById('unfoldRBtn');
const focusBtn = document.getElementById('focusBtn');
const classroomBtn = document.getElementById('classroomBtn');

const FOLD_KEY = { l: 'water.foldL', r: 'water.foldR' };
let foldL = false;
let foldR = false;
let focusSaved = null;
let classroom = false;
let classroomSaved = null;

try {
  foldL = localStorage.getItem(FOLD_KEY.l) === '1';
  foldR = localStorage.getItem(FOLD_KEY.r) === '1';
} catch (e) { /* 忽略 */ }

function applyFold() {
  waterShell.classList.toggle('fold-l', foldL);
  waterShell.classList.toggle('fold-r', foldR);
  for (const [btn, folded] of [[foldLBtn, foldL], [unfoldLBtn, foldL], [foldRBtn, foldR], [unfoldRBtn, foldR]]) {
    btn.setAttribute('aria-expanded', String(!folded));
  }
}
function setFocus(on) {
  if (on && focusSaved === null) {
    focusSaved = [foldL, foldR];
    foldL = true; foldR = true;
  } else if (!on && focusSaved !== null) {
    [foldL, foldR] = focusSaved;
    focusSaved = null;
  }
  waterShell.classList.toggle('focus-mode', on);
  focusBtn.textContent = on ? '退出专注' : '专注模式';
  focusBtn.setAttribute('aria-pressed', String(on));
  applyFold();
}
function toggleFold(side) {
  if (focusSaved !== null) setFocus(false);
  if (side === 'l') foldL = !foldL; else foldR = !foldR;
  try { localStorage.setItem(FOLD_KEY[side], (side === 'l' ? foldL : foldR) ? '1' : '0'); } catch (e) { /* 忽略 */ }
  applyFold();
}
foldLBtn.addEventListener('click', () => toggleFold('l'));
unfoldLBtn.addEventListener('click', () => toggleFold('l'));
foldRBtn.addEventListener('click', () => toggleFold('r'));
unfoldRBtn.addEventListener('click', () => toggleFold('r'));
focusBtn.addEventListener('click', () => setFocus(focusSaved === null));
/* 启动恢复折叠态不做动画（避免每次刷新播放收拢动画）；150ms 后恢复过渡能力 */
waterShell.classList.add('no-anim');
applyFold();
setTimeout(() => waterShell.classList.remove('no-anim'), 150);

/* 课堂模式：舞台放大 + 右栏浮层（进入时折叠左栏，退出恢复） */
function setClassroom(on) {
  if (on === classroom) return;
  classroom = on;
  if (on) {
    classroomSaved = [foldL, foldR];
    foldL = true;
  } else if (classroomSaved) {
    [foldL, foldR] = classroomSaved;
    classroomSaved = null;
  }
  waterShell.classList.toggle('classroom', classroom);
  classroomBtn.classList.toggle('active', classroom);
  classroomBtn.textContent = classroom ? '退出课堂' : '课堂模式';
  applyFold();
  toast(classroom ? '课堂模式：舞台放大，讲解浮于右侧。' : '已退出课堂模式。');
}
classroomBtn.addEventListener('click', () => setClassroom(!classroom));

/* ---------------- 右栏三块手风琴 ---------------- */

const ACC_KEYS = { lesson: 'water.accLesson', controls: 'water.accControls', data: 'water.accData' };
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
for (const name of Object.keys(accSecs)) applyAcc(name);
for (const name of Object.keys(accSecs)) {
  accSecs[name].querySelector('.acc-head').addEventListener('click', () => {
    accClosed[name] = !accClosed[name];
    try { localStorage.setItem(ACC_KEYS[name], accClosed[name] ? '1' : '0'); } catch (e) { /* 忽略 */ }
    applyAcc(name);
  });
}

/* ---------------- 舞台工具与键盘（原版功能块：,/./空格/Esc/R/F + 时间条） ---------------- */

const chapPrev = document.getElementById('chapPrev');
const chapNext = document.getElementById('chapNext');
const camResetBtn = document.getElementById('camResetBtn');
const fullBtn = document.getElementById('fullBtn');
chapPrev.addEventListener('click', () => gotoChapter(chapterIdx - 1));
chapNext.addEventListener('click', () => gotoChapter(chapterIdx + 1));
function resetView() {
  const cam = CAMS[SECTIONS[chapterIdx].cam] || CAMS.overview;
  app.setCamera(cam.pos, cam.tgt);
}
camResetBtn.addEventListener('click', resetView);
fullBtn.addEventListener('click', () => {
  if (document.fullscreenElement) document.exitFullscreen();
  else document.querySelector('.lab-stage3d').requestFullscreen().catch(() => { /* 静默 */ });
});
document.addEventListener('fullscreenchange', () => {
  fullBtn.textContent = document.fullscreenElement ? '⛶ 退出全屏' : '⛶ 全屏';
});

/* 时间条（模拟天数 · 播放暂停 · 流速档） */
const timebar = document.createElement('div');
timebar.className = 'timebar';
timebar.innerHTML = `<button class="tb-btn" id="tbPlay" type="button">⏸</button><span>第 <b id="tbDay">3</b> 天 <b id="tbHour">08:00</b></span><button class="tb-btn" id="tbFast" type="button">1×</button>`;
stage.appendChild(timebar);
const tbPlay = timebar.querySelector('#tbPlay');
const tbDay = timebar.querySelector('#tbDay');
const tbHour = timebar.querySelector('#tbHour');
const tbFast = timebar.querySelector('#tbFast');
tbPlay.addEventListener('click', () => {
  state.playing = !state.playing;
  tbPlay.textContent = state.playing ? '⏸' : '▶';
  if (pauseCtl) pauseCtl.set(state.playing);
});
tbFast.addEventListener('click', () => {
  state.speed = state.speed >= 8 ? 1 : state.speed * 2;
  tbFast.textContent = state.speed + '×';
});

window.addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const t = e.target;
  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
  if (e.key === ',') gotoChapter(chapterIdx - 1);
  else if (e.key === '.') gotoChapter(chapterIdx + 1);
  else if (e.key === ' ') { e.preventDefault(); tbPlay.click(); }
  else if (e.key === 'Escape') {
    if (classroom) setClassroom(false);
    else if (focusSaved !== null) setFocus(false);
  }
  else if (e.key === 'r' || e.key === 'R') resetView();
  else if (e.key === 'f' || e.key === 'F') fullBtn.click();
});

/* 拖动画面 → 任务命中 */
app.renderer.domElement.addEventListener('pointerdown', () => {
  if (typeof taskHit === 'function' && currentTasks) taskHit('drag');
});

/* ---------------- 主循环 ---------------- */

const _oceanPos = ocean.geometry.attributes.position;

app.onFrame((dtReal) => {
  if (!booted) return;
  const t = performance.now() * 0.001;

  /* 时间推进（1× = 每秒 0.1 天） */
  if (state.playing) {
    const dDay = dtReal * state.speed * 0.1;
    state.simDay += dDay;
  }

  /* 暴雨事件 */
  tickStorm(dtReal);

  /* 海面多向波 */
  for (let i = 0; i < _oceanPos.count; i++) {
    const bx = oceanBase.getX(i), bz = oceanBase.getZ(i);
    const y = Math.sin(bx * 0.5 + t * 1.2) * 0.05 + Math.cos(bz * 0.8 + t * 0.9) * 0.04
      + Math.sin(bx * 0.23 + bz * 0.31 + t * 0.6) * 0.03 * (1 + state.stormVisual);
    _oceanPos.setY(i, y);
  }
  _oceanPos.needsUpdate = true;
  foam.material.opacity = 0.6 + Math.sin(t * 1.4) * 0.18 + state.stormVisual * 0.2;

  /* 河面：流动 + 暴雨涨水 */
  river.tex.offset.x -= (0.14 + state.stormVisual * 0.55) * dtReal * (state.reservoir ? 1 : 1.6);
  const riverTargetY = 0.24 + state.stormVisual * 0.3 * (state.reservoir ? 0.4 : 1);
  river.mesh.position.y += (riverTargetY - river.mesh.position.y) * Math.min(1, dtReal * 2.2);
  river.mesh.material.opacity = 0.72 + state.stormVisual * 0.2;

  /* 水库水面 + 闸门动画 */
  if (reservoir.userData.targetY !== undefined) {
    reservoir.position.y += (reservoir.userData.targetY - reservoir.position.y) * Math.min(1, dtReal * 1.5);
  }
  const gate = damG.userData.gate;
  if (gate) {
    gate.userData.cur = gate.userData.cur === undefined ? 0 : gate.userData.cur;
    gate.userData.cur += ((gate.userData.target || 0) - gate.userData.cur) * Math.min(1, dtReal * 1.8);
    gate.position.y = 1.05 + gate.userData.cur;
  }

  /* 粒子全量推进 */
  allStreams.forEach((s) => s.update(dtReal));

  /* 云团漂移（风 + 增雨作业时增亮） */
  cloudGroups.forEach((g, i) => {
    g.position.x += g.userData.drift * dtReal * (1 + state.wind);
    if (g.position.x > 26) g.position.x = -26;
    const boosting = state.seedActive > 0 && (i === 0 || i === 1);
    g.material.opacity += ((boosting ? 0.99 : 0.92) - g.material.opacity) * Math.min(1, dtReal * 2);
    if (boosting) g.material.emissive.setHex(0x8a7a5a).multiplyScalar(state.seedActive * 0.4);
    else g.material.emissive.setHex(0x000000);
  });

  /* 增雨飞机巡航（绕城市云 → 山地云） */
  if (planeG.visible) {
    planeG.userData.t = (planeG.userData.t || 0) + dtReal;
    const pt = planeG.userData.t;
    const u = (pt * 0.14) % 1;
    const a = u * TAU;
    const overMountain = Math.sin(pt * 0.3) > 0;
    const cx = overMountain ? 9.4 : -1.6;
    const cy = overMountain ? 7.2 : 6.0;
    planeG.position.set(cx + Math.cos(a) * 2.6, cy + Math.sin(a * 2) * 0.3, Math.sin(a) * 1.8);
    planeG.rotation.y = -a - Math.PI / 2;
    planeG.rotation.z = Math.sin(a * 2) * 0.08;
    if (planeProp) planeProp.rotation.x += dtReal * 30;
    S.seeding.spawn = () => ({ x: planeG.position.x - 0.15, y: planeG.position.y - 0.06, z: planeG.position.z + rnd(-0.3, 0.3) });
    state.seedActive = Math.max(0, state.seedActive - dtReal * 0.035);
    /* 增雨效果：云下 Rain 因子提升 */
    S.rainCity.factor = 1 + state.seedActive * 0.9;
    S.rainMountain.factor = 1 + state.seedActive * 0.7;
    if (state.seedActive <= 0) {
      planeG.visible = false;
      S.rainCity.factor = 1;
      S.rainMountain.factor = 1;
    }
  }

  /* 泥沙入海动画段 */
  if (meaning.sedimentAnim > 0) {
    meaning.sedimentAnim -= dtReal;
    plume.material.opacity = Math.min(0.5, plume.material.opacity + dtReal * 0.2);
    if (meaning.sedimentAnim <= 0) applyLandParams();
  } else {
    setDeltaGrowth(0.25 + sedimentLoad() * 0.85);
  }
  tickDelta(dtReal);

  /* 水体标注环脉冲 */
  if (storeMarker.visible) {
    const s = 1 + Math.sin(t * 2.6) * 0.1;
    storeMarker.scale.setScalar(s);
    storeMarker.rotation.y += dtReal * 0.6;
  }

  /* 浮具随浪 */
  boatLake.position.y = 2.36 + Math.sin(t * 1.1) * 0.014;
  boatLake.rotation.z = Math.sin(t * 0.9) * 0.05;
  boatSea.position.y = 0.02 + Math.sin(t * 1.3) * 0.02 * (1 + state.stormVisual);
  boatSea.rotation.z = Math.sin(t * 1.0) * 0.06 * (1 + state.stormVisual);
  buoyRiver.position.y = river.mesh.position.y + 0.06 + Math.sin(t * 1.5) * 0.012;
  buoyRes.position.y = reservoir.position.y + 0.05 + Math.sin(t * 1.2) * 0.01;

  /* 雨量筒水位随雨强 */
  const gaugeWater = rainGauge.getObjectByName('gaugeWater');
  if (gaugeWater) {
    const lvl = 0.03 + state.stormI * 0.012 + state.stormVisual * 0.02;
    gaugeWater.scale.y = clamp(lvl / 0.05, 0.4, 1.6);
    gaugeWater.position.y = 0.05 + (gaugeWater.scale.y - 1) * 0.02;
  }

  /* 气象站：风杯转速 ∝ 风强；风向标指向来风 */
  if (anemometerArms) anemometerArms.rotation.y += dtReal * (1.2 + state.wind * 14);
  if (windVane) windVane.rotation.y += (Math.PI * 0.75 + (state.wind - 0.5) * 0.8 - windVane.rotation.y) * Math.min(1, dtReal * 2);

  /* 参数脏处理：地形重算节流 */
  snowClock += dtReal;
  if ((snowDirty || slopeDirty) && snowClock > 0.16) {
    snowClock = 0;
    snowDirty = false;
    slopeDirty = false;
    refreshTerrain();
    layoutMountForest();
    layoutTrees();
  }

  /* 城市内涝积水片（普通城市暴雨时） */
  floodPatch.visible = state.stormVisual > 0.25 && state.harden > 0.45 && !state.sponge;
  if (floodPatch.visible) floodPatch.material.opacity = Math.min(0.5, state.stormVisual * 0.6);

  /* 图窗与卡片（节流重绘） */
  chartClock += dtReal;
  if (chartClock > 0.5) {
    chartClock = 0;
    if (hydroWin.open && hydroDirty) { drawHydro(); hydroDirty = false; }
    else if (hydroWin.open && state.stormVisual > 0.05) drawHydro();
    if (sectionWin.open && sectionDirty) { drawSection(); sectionDirty = false; }
    else if (sectionWin.open && state.pumping >= 0) drawSection();
    if (balanceWin.open) drawBalance();
    if (storesWin.open) { /* 列表态，无需重绘 */ }
    if (document.getElementById('wc-bar-runoff')) updateSplitCard();
    if (document.getElementById('wc-urban-card')) updateUrbanCard();
    if (document.getElementById('wc-basin-card')) updateBasinCard();
  }

  /* HUD（节流 0.25s） */
  hudClock += dtReal;
  if (hudClock > 0.25) {
    hudClock = 0;
    const sl = snowlineY();
    hud.set('season', `${state.season === 'summer' ? '夏季' : '冬季'} · 雪线 ${sl.toFixed(1)}${state.warming > 0 ? `（+${state.warming.toFixed(1)}°C）` : ''}`);
    const gLeft = Math.round((1 - clamp(state.warming / 4, 0, 1) * 0.6) * 100);
    hud.set('glacier', `剩余约 ${gLeft}%${state.warming >= 3 ? '（快速退缩）' : state.warming >= 1.5 ? '（退缩中）' : ''}`);
    const pn = { all: '全部环节', evap: '蒸发', infil: '下渗', trans: '水汽输送', ground: '地下径流', rain: '降水', etp: '蒸腾', runoff: '地表径流' };
    hud.set('process', state.quizMode ? '读图作答中' : pn[state.processMode] || '全部环节');
    const sp = splitRatios();
    hud.set('split', `${sp.runoff}% : ${sp.infil}%${state.sponge ? '（海绵）' : ''}`);
    const hy = hydrograph();
    hud.set('flood', `${hy.peak.toFixed(1)} m³/s · +${hy.tp.toFixed(1)}h`);
    hud.set('water', `埋深 ${(2 + state.pumping / 100 * 14).toFixed(1)} m${state.pumping >= 70 ? '（超采）' : ''}`);
    const f = sandBasinFlux();
    hud.set('basin', `${f.P.toFixed(1)} / ${f.E.toFixed(1)} / ${f.R.toFixed(1)} mm/天`);
    const dayI = Math.floor(state.simDay);
    const hh = Math.floor((state.simDay - dayI) * 24);
    const mm = Math.floor((((state.simDay - dayI) * 24) - hh) * 60);
    hud.set('day', `第 ${dayI} 天 ${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}${state.playing ? '' : '（暂停）'}`);
    tbDay.textContent = String(dayI);
    tbHour.textContent = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  }
});

let snowClock = 0;
let chartClock = 0;
let hudClock = 0;

/* 城市内涝积水片 */
const floodPatch = new THREE.Mesh(
  new THREE.PlaneGeometry(7.4, 5.2),
  new THREE.MeshPhysicalMaterial({ color: 0x5f9fc9, transparent: true, opacity: 0, roughness: 0.12, clearcoat: 0.7 })
);
floodPatch.rotation.x = -Math.PI / 2;
floodPatch.position.set(-1.4, 0.66, 1.4);
floodPatch.visible = false;
scene.add(floodPatch);

/* ---------------- 资源加载与启动 ---------------- */

const TEXDIR_SKY = '../assets/textures/sky/sky_court-BKHrsJQE.webp';
const TEXDIR_PBR_GROUND = '../assets/textures/pbr/ground_nor-c2-TseGf.webp';

let booted = false;

loadAll([
  { key: 'sky', label: '天空', job: loadTexture(TEXDIR_SKY) },
  { key: 'ground', label: '地表细节', job: loadTexture(TEXDIR_PBR_GROUND, { colorSpace: null, wrap: true, repeat: [22, 6] }) },
], (d, t, label) => loader.setText(`正在加载 ${d}/${t}（${label}）`)).then((t) => {
  t.sky.mapping = THREE.EquirectangularReflectionMapping;
  scene.background = t.sky;
  scene.environment = t.sky;

  buildTerrain(t.ground);
  buildStreams();
  buildLabels();
  buildFluxArrows();
  buildLetterSprites();
  layoutTrees();
  layoutMountForest();
  applyGlacier();
  applySeasonWarming();
  applyLandParams();
  applyHuman();
  setDeltaGrowth(0.4, true);
  iceShell.visible = false;

  booted = true;
  window.__eduSections = { select: selectChapter };
  window.__waterStats = () => vfx.stats();
  window.__waterRawStats = () => { const r = app.renderer; r.info.reset(); r.render(scene, camera); const s = { calls: r.info.render.calls, tris: r.info.render.triangles }; return s; };
  window.__waterState = state;   // 质检句柄
  window.__waterScene = scene;   // 场景遍历（质检用）
  loader.setText('就绪');
  loader.hide();
  selectChapter(0);
}).catch((err) => {
  loader.setText('资源加载失败：' + err.message);
  console.error(err);
});
