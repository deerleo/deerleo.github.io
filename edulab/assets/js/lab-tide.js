/* EduLab · 潮汐的形成（tide）— Micro 级 3D 深改
 * =====================================================================
 * 章节（原版 5 章文案块 1:1）：潮起潮落 / 引潮力 / 两次涨落 / 大潮与小潮 / 日潮不等
 *
 * 三栏布局：左课程大纲（5 章列表，点击切章高亮迁移）· 中地月系统舞台 · 右知识点详解（三手风琴）
 * 折叠体系：左右栏 28px 竖条折叠 × 海边实时小窗/两张图窗折叠为 40px 圆徽标 × 右栏手风琴
 *           × 专注模式（双栏同折）× 课堂模式（舞台放大 + 讲解浮层）——全部 localStorage 记忆
 *
 * 场景工艺（edu-vfx 接入）：
 *   地球 = 昼夜光照自定义 shader（昼图 × 日照因子 + 夜面城市灯光 + 海面高光 + 法线起伏）
 *          + 程序化云层球（慢速自旋）+ 大气边缘辉光壳（fresnel 加色）
 *   月球 = 程序化 CanvasTexture（月海斑块 ×40 + 环形山 ×130：双弧影+高光边，1024×512）
 *          + 同源凹凸贴图；月相照明由太阳方向实时驱动
 *   太阳 = 边缘变暗 + 光晕的自定义 shader 圆盘（billboard），加色辉光 sprite
 *   潮汐水壳 = 顶点位移 shader（平衡潮公式实时驱动）+ 等潮线（fwidth 抗锯齿等值线）
 *              + fresnel 边缘透明；向月/背月双隆起方向标
 *   引潮力箭头 = 大圆 16 采样点 × 三分量（引力 / 惯性离心力 / 引潮力），①②③ 分步演示
 *   海岸观测站（海边小窗第二场景）= fbm 沙洲地形（干湿双色带）+ 自研波动水面 shader
 *          （多向正弦波叠加 + 岸线泡沫带 + 深度透明）+ 验潮桩（刻度板 CanvasTexture）
 *          + 高脚观测屋（坡顶 + 柱廊）+ 木船（CatmullRom 截面放样船壳 + 坐板 + 桨）
 *          + 浮标（条纹球 + 环 + 天线，随浪起伏）+ 防波堤石阵 + 昼夜天穹
 * 图窗（原版 chart 家族 1:1）：朔望月每日潮差包络 / 潮位曲线 ±18 小时
 * 原版功能块 1:1：开场飞览（跳过/重看）/ 海边小窗点击放大(Esc)/ 月地距离（近-远）/ 月球质量 /
 *   月赤纬上限 / 观测点纬度 / 观测地点（青岛·大连·厦门·三亚）/ 月龄（农历初一~三十）/
 *   太阳潮（叠加/只看月球）/ 箭头三分量开关 / 教学比例 vs 真实比例 / 标签开关（月球·双隆起·
 *   太阳光·观测地点）/ 重置 / 课堂模式 / 上一章(,) 下一章(.) / 空格播放暂停 / 时间流速 ×12 /
 *   「月球引潮力 · 相对均值」读数 / 每章任务 chip / 教学放大注释
 * 自研增设：每章随堂检测（判分 + 解析）/ 下次高潮时刻预报 / 等潮线环
 * =====================================================================
 */
import {
  THREE, DEG, TAU, clamp,
  createApp, createControlsPanel, makeLoader, loadAll, loadTexture, makeHUD,
  makeTextSprite, setSpriteText, makeGlowTexture, circleLine, makeStars,
} from './edu-core.js';
import {
  attachVFX, makeStudioEnvironment,
  matStd, matCoat, matSheen, matGlow, PAL, fbm3,
} from './edu-vfx.js';

/* ---------------- 舞台与工艺接入 ---------------- */

const stage = document.getElementById('stage');
const loader = makeLoader(stage, '正在搭建地月系统…');

const app = createApp({
  container: stage,
  fov: 42, near: 0.1, far: 4000,
  cameraPos: [3.4, 2.4, 5.0],
  target: [0, 0, 0],
  minDistance: 1.35, maxDistance: 220,
  exposure: 1.05,
  keepBackground: true,
});
const { scene, camera, controls } = app;
const vfx = attachVFX(app, 'illus');
scene.environment = makeStudioEnvironment(app.renderer);

scene.add(new THREE.HemisphereLight(0x93a7bd, 0x101a22, 0.5));
const keyLight = new THREE.DirectionalLight(0xfff4e0, 1.1);
keyLight.position.set(4, 3, 2);
scene.add(keyLight);
const fillLight = new THREE.DirectionalLight(0xa9c4e0, 0.32);
fillLight.position.set(-4, 2.4, -2);
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

/* 接触阴影贴片（道具落沙的重量感来源） */
function shadowPatch(w, d, opacity = 0.38) {
  const tex = canvasTex(256, 256, (ctx) => {
    const g = ctx.createRadialGradient(128, 128, 10, 128, 128, 126);
    g.addColorStop(0, 'rgba(20,14,8,' + opacity + ')');
    g.addColorStop(0.62, 'rgba(20,14,8,' + opacity * 0.5 + ')');
    g.addColorStop(1, 'rgba(20,14,8,0)');
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

/* 场景色板（PAL 延展：海洋天体族；仅本实验使用） */
const C = {
  ocean: 0x2a6ea8, oceanDeep: 0x123252, oceanHi: 0x63b7e8,
  foam: 0xeef6f2, sandDry: 0xd8c39a, sandWet: 0x8f7a58,
  wood: 0x7c5a36, woodDeep: 0x52381f, rope: 0xb49a6a,
  gauge: 0xf3eee2, gaugeInk: 0x27313a,
  rock: 0x8d9298, buoyRed: 0xd4583c, buoyWhite: 0xf2f0e8,
  hut: 0x9c7348, roof: 0xb04a32,
  gold: 0xe2b34a, axisC: 0xffd166,
  moon: 0xc9c6bd, moonMare: 0x8f8d88,
  sunCore: 0xfff3cd,
};

/* ---------------- 物理内核（自研简化天文模型） ----------------
 * 常数为通用天文事实：朔望月 29.530589 天、回归年 365.2422 天、恒星日 0.99726958 天、
 * 交点月（赤纬周期）27.2122 天、近点月（距离周期）27.5546 天、月赤纬上限 28.6°、
 * 月地平均距离 60.27 地球半径、月球质量比 0.0123、太阳质量比 332946（距离 23455 地球半径）。
 * 平衡潮：η(n) = Σk Am,k·(3(n·d̂k)² − 1)/2 —— 教科书公式。 */
const PH = {
  SYNODIC: 29.530589,        // 朔望月（天）
  SIDEREAL_DAY: 0.99726958,  // 恒星日（天）
  DRACONIC: 27.2122,         // 交点月（赤纬往返周期，天）
  ANOMALISTIC: 27.5546,      // 近点月（月地距离周期，天）
  SIDEREAL_MONTH: 27.3217,   // 恒星月（月球公转周期，天）
  DECL_MAX: 28.6,            // 月赤纬上限（度）
  MOON_DIST_R: 60.27,        // 月地距离（地球半径）
  ECC: 0.0549,               // 月轨偏心率（距离 ±5.5%）
  MASS_MOON: 0.0123,         // 月地质量比
  SOLAR_RATIO: 0.46,         // 太阳潮幅 / 月球潮幅
};
const LUNAR_DAYS = ['初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十', '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十', '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'];
function lunarDayName(ageDays) {
  return LUNAR_DAYS[Math.min(29, Math.max(0, Math.floor(ageDays - 0.02)))];
}
function phaseNameOf(ageDays) {
  const f = ((ageDays % PH.SYNODIC) + PH.SYNODIC) % PH.SYNODIC / PH.SYNODIC;
  if (f < 0.0625 || f >= 0.9375) return '朔 · 新月';
  if (f < 0.1875) return '蛾眉月';
  if (f < 0.3125) return '上弦月';
  if (f < 0.4375) return '盈凸月';
  if (f < 0.5625) return '望 · 满月';
  if (f < 0.6875) return '亏凸月';
  if (f < 0.8125) return '下弦月';
  return '残月';
}

/* 观测城市（纬度 / 东经） */
const CITIES = [
  { name: '青岛', lat: 36.1, lon: 120.4 },
  { name: '大连', lat: 38.9, lon: 121.6 },
  { name: '厦门', lat: 24.5, lon: 118.1 },
  { name: '三亚', lat: 18.3, lon: 109.5 },
];

function latLonToVec(latDeg, lonDegE, r = 1) {
  const lat = latDeg * DEG, lon = lonDegE * DEG;
  return new THREE.Vector3(Math.cos(lat) * Math.cos(lon), Math.sin(lat), -Math.cos(lat) * Math.sin(lon)).multiplyScalar(r);
}

/* ---------------- 全局状态 ---------------- */

const state = {
  playing: true,
  speed: 1,               // 时间流速倍率（1× = 每真实秒 2 模拟小时）
  simH: 6.5,              // 模拟时刻（小时）
  distScale: 7.5,         // 月地距离（教学比例，地球半径数）
  massFactor: 1,          // 月球质量倍率
  declMax: 0,             // 月赤纬上限（度，0~28.6）
  obsCity: 0,             // 观测城市索引
  obsLatOverride: null,   // 手动纬度（覆盖城市纬度）
  solarTide: true,        // 叠加太阳潮
  arrowsStep: 0,          // 引力演示步：0 全隐 / 1 引力 / 2 +离心 / 3 +引潮力
  teachScale: true,       // 教学比例（false = 真实比例）
  labels: { moon: true, bulge: true, sun: true, obs: true },
  ageLocked: false,       // 月龄是否被滑杆锁定（第 4 章滑杆拖动）
  intro: null,            // 开场飞览句柄
  narrate: false,         // 讲解模式
  HOURS_PER_SEC: 2,       // 1× 流速下每真实秒的模拟小时数
};
const MOON_DIST_TEACH = 7.5;   // 教学比例的默认月距（地球半径数）
const TIDE_AMP = 0.13;         // 平衡潮视觉基准幅（世界单位，教学比例，教学放大）
const EXAG_NOTE = '潮汐隆起按教学比例放大显示（真实仅毫米级）；海岸潮差按典型岸段尺度呈现';

/* 模拟时刻 → 月球方位角（世界系，相对太阳方向 +X） */
function moonAzimuthAt(simH) {
  return TAU * (simH / 24) / PH.SYNODIC;
}
function declAt(simH, declMaxDeg) {
  return declMaxDeg * Math.sin(TAU * simH / (24 * PH.DRACONIC));
}
function distFactorAt(simH) {
  const cyc = Math.cos(TAU * simH / (24 * PH.ANOMALISTIC));
  const r = 1 - PH.ECC * cyc;                       // 归一化到平均距离
  return Math.pow(1 / r, 3);                        // 引潮力 ∝ 1/r³
}
function moonDirAt(simH) {
  const az = moonAzimuthAt(simH);
  const dec = declAt(simH, state.declMax) * DEG;
  return new THREE.Vector3(Math.cos(az) * Math.cos(dec), Math.sin(dec), -Math.sin(az) * Math.cos(dec));
}
function spinAngleAt(simH) {
  return TAU * simH / 24;
}
function obsWorldDirAt(simH) {
  const city = CITIES[state.obsCity];
  const lat = state.obsLatOverride !== null ? state.obsLatOverride : city.lat;
  const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), spinAngleAt(simH));
  return latLonToVec(lat, city.lon).applyQuaternion(q);
}
/* 观测点平衡潮（无量纲，单位 = TIDE_AMP 口径） */
function etaObsAt(simH) {
  const n = obsWorldDirAt(simH);
  const m = moonDirAt(simH);
  const dm = Math.pow(MOON_DIST_TEACH / state.distScale, 3) * distFactorAt(simH) * state.massFactor;
  let eta = TIDE_AMP * dm * (3 * n.dot(m) * n.dot(m) - 1) / 2;
  if (state.solarTide) {
    const ds = n.dot(new THREE.Vector3(1, 0, 0));
    eta += TIDE_AMP * PH.SOLAR_RATIO * (3 * ds * ds - 1) / 2;
  }
  return eta;
}
/* 潮位换算：平衡潮 → 典型海岸潮差口径（米）。基准：教学距离大潮全日潮差约 3.2 m */
const M_PER_UNIT = 17.0;
function etaToMeters(eta) { return eta * M_PER_UNIT; }

/* 未来一段时间内的下次高潮（解析扫描，步长 0.1h） */
function nextHighTide(simH) {
  let best = null;
  let prev = etaObsAt(simH);
  for (let dt = 0.05; dt <= 26.5; dt += 0.1) {
    const e = etaObsAt(simH + dt);
    if (prev < e) { best = { rising: true, dt }; }
    if (best && best.rising && e < prev) { return { dt: dt - 0.1, h: etaObsAt(simH + dt - 0.1) }; }
    prev = e;
  }
  return best ? { dt: null, h: null } : { dt: null, h: null };
}

/* ---------------- 星空与太阳 ---------------- */

scene.add(makeStars(1600, 2400));

const sunG = new THREE.Group();
const sunDiscMat = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false,
  uniforms: { uI: { value: 1 } },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */`
    uniform float uI;
    varying vec2 vUv;
    void main() {
      float r = length(vUv - 0.5) * 2.0;
      /* 边缘变暗的日面：视边界半径 0.34，向外柔和衰减出光晕 */
      float core = 1.0 - smoothstep(0.30, 0.34, r);
      float limb = pow(max(0.0, 1.0 - r * r / (0.34 * 0.34)), 0.55);
      float halo = exp(-max(0.0, r - 0.34) * 5.0) * (1.0 - smoothstep(0.7, 1.0, r));
      vec3 warm = vec3(1.0, 0.93, 0.78);
      vec3 col = warm * (limb * 0.35 + 0.65) * core * 2.6 + warm * halo * 0.5;
      gl_FragColor = vec4(col * uI, 1.0);
    }`,
});
const sunDisc = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), sunDiscMat);
sunDisc.scale.setScalar(9);
sunG.add(sunDisc);
const sunHalo = new THREE.Sprite(new THREE.SpriteMaterial({
  map: makeGlowTexture('255,226,168'), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.85,
}));
sunHalo.scale.set(30, 30, 1);
sunG.add(sunHalo);
const SUN_POS = new THREE.Vector3(170, 0, 0);
sunG.position.copy(SUN_POS);
scene.add(sunG);
const sunLight = new THREE.DirectionalLight(0xffffff, 2.4);
sunLight.position.copy(SUN_POS).normalize().multiplyScalar(60);
scene.add(sunLight);
const sunLabel = makeTextSprite('太阳光', { fontSize: 34, color: '#ffe3a0', scale: 0.02 });
sunLabel.position.set(120, 10, 0);
scene.add(sunLabel);

/* ---------------- 地球（昼夜 shader + 云层 + 大气辉光） ---------------- */

const earthG = new THREE.Group();
scene.add(earthG);
const spinG = new THREE.Group();
earthG.add(spinG);

const TEXDIR = '../assets/textures/earth/';

let earthSurfaceMat = null;

function buildEarth(t) {
  /* 昼夜光照 shader：昼图 × 日照因子；夜面压暗并叠城市灯光；海面高光随视线闪 */
  const nightTex = t.night || t.day;
  earthSurfaceMat = new THREE.ShaderMaterial({
    uniforms: {
      uDay: { value: t.day },
      uNight: { value: nightTex },
      uSpec: { value: t.spec },
      uNormal: { value: t.normal },
      uSun: { value: new THREE.Vector3(1, 0, 0) },
      uNightMix: { value: 0.85 },
    },
    vertexShader: /* glsl */`
      varying vec2 vUv;
      varying vec3 vN;
      varying vec3 vWp;
      void main() {
        vUv = uv;
        vN = normalize(mat3(modelMatrix) * normal);
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWp = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: /* glsl */`
      uniform sampler2D uDay, uNight, uSpec, uNormal;
      uniform vec3 uSun;
      uniform float uNightMix;
      varying vec2 vUv;
      varying vec3 vN;
      varying vec3 vWp;
      void main() {
        vec3 n = normalize(vN);
        vec3 v = normalize(cameraPosition - vWp);
        float mu = dot(n, uSun);
        /* 晨昏带 0.12 宽的柔和过渡，夜半球不至死黑 */
        float dayK = smoothstep(-0.12, 0.16, mu);
        vec3 day = texture2D(uDay, vUv).rgb;
        vec3 night = texture2D(uNight, vUv).rgb;
        /* 海面镜面高光：spec 图 R 通道为水体掩码 */
        float water = texture2D(uSpec, vUv).r;
        vec3 h = normalize(uSun + v);
        float spec = pow(max(dot(n, h), 0.0), 42.0) * water * dayK * 0.5;
        vec3 col = day * (0.045 + 0.955 * dayK * max(mu, 0.0) * 1.15);
        col += spec * vec3(1.0, 0.97, 0.9);
        /* 夜面：城市灯光（灯图已自发光），再压一层冷蓝以免死黑 */
        float nk = (1.0 - dayK) * uNightMix;
        col += night * night * 2.1 * nk;
        col += vec3(0.012, 0.02, 0.038) * (1.0 - dayK);
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  const earthMesh = new THREE.Mesh(new THREE.SphereGeometry(1, 128, 96), earthSurfaceMat);
  spinG.add(earthMesh);

  /* 云层：半透明球慢速自旋，昼夜两面亮度都由太阳方向衰减 */
  const cloudMat = new THREE.MeshLambertMaterial({
    map: t.clouds, transparent: true, depthWrite: false, opacity: 0.62,
  });
  const cloudMesh = new THREE.Mesh(new THREE.SphereGeometry(1.014, 96, 64), cloudMat);
  cloudMesh.renderOrder = 4;
  spinG.add(cloudMesh);
  earthG.userData.cloudMesh = cloudMesh;

  /* 大气边缘辉光壳：fresnel 加色，正面薄、掠射厚 */
  const atmMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.BackSide, blending: THREE.AdditiveBlending,
    uniforms: { uSun: { value: new THREE.Vector3(1, 0, 0) } },
    vertexShader: /* glsl */`
      varying vec3 vN;
      varying vec3 vWp;
      void main() {
        vN = normalize(mat3(modelMatrix) * normal);
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWp = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uSun;
      varying vec3 vN;
      varying vec3 vWp;
      void main() {
        vec3 v = normalize(cameraPosition - vWp);
        float rim = pow(1.0 - abs(dot(normalize(vN), v)), 3.2);
        float dayK = clamp(dot(normalize(vN), uSun) * 0.5 + 0.62, 0.0, 1.0);
        vec3 col = mix(vec3(0.16, 0.34, 0.62), vec3(0.4, 0.66, 0.95), dayK);
        gl_FragColor = vec4(col * rim * 0.85, rim * 0.7);
      }`,
  });
  const atmMesh = new THREE.Mesh(new THREE.SphereGeometry(1.06, 96, 64), atmMat);
  atmMesh.renderOrder = 6;
  earthG.add(atmMesh);
  earthG.userData.atmMat = atmMat;
}

/* ---------------- 地轴与纬度圈 ---------------- */

const axisLine = new THREE.Line(
  new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -1.42, 0), new THREE.Vector3(0, 1.42, 0)]),
  new THREE.LineBasicMaterial({ color: C.axisC, transparent: true, opacity: 0.85 })
);
earthG.add(axisLine);
const axisN = makeTextSprite('N', { fontSize: 40, color: '#ffd166', scale: 0.006 });
axisN.position.set(0, 1.58, 0);
earthG.add(axisN);

/* 观测纬度圈（金色）：随观测点纬度移动，日潮不等章的主角 */
const latCircle = circleLine(1.012, C.gold, 160);
latCircle.material.transparent = true;
latCircle.material.opacity = 0.75;
earthG.add(latCircle);
const obsG = new THREE.Group();
spinG.add(obsG);
const obsDot = new THREE.Mesh(
  new THREE.SphereGeometry(0.034, 16, 12),
  new THREE.MeshStandardMaterial({ color: 0x59d999, emissive: 0x2fae72, emissiveIntensity: 0.8, roughness: 0.4 })
);
const obsLabel = makeTextSprite('观测点', { fontSize: 32, color: '#8df0bd', scale: 0.005 });
obsLabel.position.set(0, 0.15, 0);
obsG.add(obsDot, obsLabel);

function applyObsPosition() {
  const city = CITIES[state.obsCity];
  const lat = state.obsLatOverride !== null ? state.obsLatOverride : city.lat;
  obsG.position.copy(latLonToVec(lat, city.lon, 1.012));
  setSpriteText(obsLabel, CITIES[state.obsCity].name + ' · 观测点', { fontSize: 32, color: '#8df0bd', scale: 0.005 });
  latCircle.visible = Math.abs(lat) > 0.5;
  latCircle.scale.setScalar(Math.cos(lat * DEG) * 1.012);
  latCircle.position.y = Math.sin(lat * DEG) * 1.012;
}

/* ---------------- 月球（程序化纹理 + 凹凸） ---------------- */

const moonOrbitG = new THREE.Group();   // 供倾斜（赤纬通过 moonDirAt 驱动，环随月球方向转动）
scene.add(moonOrbitG);
const moonRing = circleLine(MOON_DIST_TEACH, 0x7d8698, 220);
moonRing.material.transparent = true;
moonRing.material.opacity = 0.22;
moonOrbitG.add(moonRing);
const moonG = new THREE.Group();
moonOrbitG.add(moonG);

function buildMoonTexture() {
  /* 月海：暗斑；环形山：暗影弧 + 亮缘弧（同名 CanvasTexture 兼作凹凸源，灰度即深度） */
  const W = 1024, H = 512;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, '#cfccc3');
  g.addColorStop(0.5, '#c2bfb6');
  g.addColorStop(1, '#b6b3aa');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  /* 细颗粒 */
  for (let i = 0; i < 2600; i++) {
    const v = 180 + Math.random() * 60;
    ctx.fillStyle = `rgba(${v},${v - 4},${v - 10},${0.06 + Math.random() * 0.1})`;
    ctx.fillRect(Math.random() * W, Math.random() * H, 1.6, 1.6);
  }
  /* 月海斑块（随机大椭圆） */
  let seed = 9;
  const rnd = () => { seed = (seed * 16807 + 19) % 2147483647; return seed / 2147483647; };
  for (let i = 0; i < 40; i++) {
    const x = rnd() * W, y = H * 0.18 + rnd() * H * 0.64;
    const rx = 26 + rnd() * 90, ry = 18 + rnd() * 60;
    const gr = ctx.createRadialGradient(x, y, 2, x, y, Math.max(rx, ry));
    const tone = 118 + rnd() * 26;
    gr.addColorStop(0, `rgba(${tone},${tone},${tone + 4},0.5)`);
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gr;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1, ry / rx);
    ctx.beginPath();
    ctx.arc(0, 0, rx, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
  /* 环形山：影弧 + 受光缘 */
  for (let i = 0; i < 130; i++) {
    const x = rnd() * W, y = H * 0.06 + rnd() * H * 0.88;
    const r = 2.5 + rnd() * 15;
    ctx.strokeStyle = `rgba(84,82,78,${0.16 + rnd() * 0.22})`;
    ctx.lineWidth = r * 0.34;
    ctx.beginPath();
    ctx.arc(x, y, r, Math.PI * 0.15, Math.PI * 1.05);
    ctx.stroke();
    ctx.strokeStyle = `rgba(236,234,228,${0.14 + rnd() * 0.2})`;
    ctx.beginPath();
    ctx.arc(x, y, r * 0.92, Math.PI * 1.15, Math.PI * 1.95);
    ctx.stroke();
    if (r > 8) {
      ctx.fillStyle = 'rgba(96,94,90,0.3)';
      ctx.beginPath();
      ctx.arc(x, y, r * 0.4, 0, TAU);
      ctx.fill();
    }
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  const bump = new THREE.CanvasTexture(cv);
  bump.anisotropy = 4;
  return { map: tex, bump };
}

const moonTex = buildMoonTexture();
const moonMesh = new THREE.Mesh(
  new THREE.SphereGeometry(0.273, 64, 48),
  new THREE.MeshStandardMaterial({
    map: moonTex.map, bumpMap: moonTex.bump, bumpScale: 0.02,
    color: 0xffffff, roughness: 0.96, metalness: 0, envMapIntensity: 0.12,
  })
);
moonG.add(moonMesh);
const moonLabel = makeTextSprite('月球', { fontSize: 34, color: '#e8edf6', scale: 0.008 });
moonLabel.position.set(0, 0.52, 0);
moonG.add(moonLabel);

/* 月球潮幅标尺：指示向月/背月隆起 */
const bulgeMarks = [];
for (const s of [1, -1]) {
  const g = new THREE.Group();
  const dot = new THREE.Mesh(
    new THREE.SphereGeometry(0.032, 14, 10),
    new THREE.MeshBasicMaterial({ color: 0xffb35c })
  );
  const lbl = makeTextSprite(s > 0 ? '向月隆起' : '背月隆起', { fontSize: 28, color: '#ffcf9a', scale: 0.0045 });
  lbl.position.set(0, 0.17, 0);
  g.add(dot, lbl);
  scene.add(g);
  bulgeMarks.push(g);
}
/* ---------------- 潮汐水壳（顶点位移 + 等潮线 shader） ----------------
 * 平衡潮形状在顶点着色器实时计算：r = R + exaggeration·η(n)。
 * 片元：fwidth 抗锯齿等潮线（像地形图晕渲，掠射处清晰、正对镜头淡出）
 * + fresnel 边缘透明 + 昼夜微染色。自研 GLSL，公式为教科书平衡潮。 */

const waterMat = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false,
  uniforms: {
    uMoon: { value: new THREE.Vector3(1, 0, 0) },
    uSun: { value: new THREE.Vector3(1, 0, 0) },
    uAm: { value: TIDE_AMP },
    uAs: { value: TIDE_AMP * PH.SOLAR_RATIO },
    uExag: { value: 1 },
    uOpacity: { value: 0.5 },
    uBase: { value: 1.042 },
    uTime: { value: 0 },
  },
  vertexShader: /* glsl */`
    uniform vec3 uMoon, uSun;
    uniform float uAm, uAs, uExag, uBase;
    varying float vH;
    varying vec3 vN;
    varying vec3 vWp;
    float etaAt(vec3 n) {
      float a = dot(n, uMoon), b = dot(n, uSun);
      return uAm * (3.0 * a * a - 1.0) * 0.5 + uAs * (3.0 * b * b - 1.0) * 0.5;
    }
    void main() {
      vec3 n = normalize(position);
      vH = etaAt(n);
      vN = normalize(mat3(modelMatrix) * n);
      vec3 p = n * (uBase + uExag * (vH + (uAm + uAs) * 0.5));
      vec4 wp = modelMatrix * vec4(p, 1.0);
      vWp = wp.xyz;
      gl_Position = projectionMatrix * viewMatrix * wp;
    }`,
  fragmentShader: /* glsl */`
    uniform vec3 uMoon, uSun;
    uniform float uAm, uAs, uOpacity, uTime;
    varying float vH;
    varying vec3 vN;
    varying vec3 vWp;
    void main() {
      vec3 v = normalize(cameraPosition - vWp);
      vec3 n = normalize(vN);
      float fres = pow(1.0 - max(0.0, dot(n, v)), 2.4);
      /* 等潮线：η 的等值线，掠射清晰、正对淡出（地形图晕渲式） */
      float k = vH / max(uAm * 0.02 + 1e-5, 1e-5);
      float step2 = (uAm + uAs) * 0.5;
      float kk = vH / max(step2 * 0.34, 1e-5);
      float f = abs(fract(kk + 0.5) - 0.5) / max(fwidth(kk), 1e-4);
      float line = 1.0 - smoothstep(0.0, 1.15, f);
      float lineVis = line * smoothstep(0.18, 0.75, fres);
      float amp = max(uAm + uAs, 1e-4);
      float hi = clamp(vH / (amp * 0.67), -0.5, 1.0);
      float dayK = 0.45 + 0.55 * smoothstep(-0.3, 0.6, dot(n, uSun));
      vec3 col = mix(vec3(0.10, 0.30, 0.52), vec3(0.36, 0.68, 0.90), hi * 0.5 + 0.5) * dayK;
      /* 隆起脊线的微光：高潮处提亮 */
      col += vec3(0.55, 0.75, 0.95) * max(hi, 0.0) * 0.18;
      col += vec3(0.75, 0.88, 1.0) * lineVis * 0.35;
      float alpha = (0.10 + 0.16 * max(hi, 0.0) + 0.50 * fres + 0.30 * lineVis) * uOpacity * 2.0;
      gl_FragColor = vec4(col, clamp(alpha, 0.0, 0.95));
    }`,
});
const waterMesh = new THREE.Mesh(new THREE.SphereGeometry(1.042, 128, 96), waterMat);
waterMesh.renderOrder = 10;
earthG.add(waterMesh);

/* ---------------- 等潮线环（可选叠加，几何环更醒目） ---------------- */

const cotidalRings = [];
const ringRoot = new THREE.Group();
earthG.add(ringRoot);
for (const psiDeg of [30, 60, 90, 120, 150]) {
  const line = circleLine(1, psiDeg <= 90 ? 0xffb35c : 0x8fd3ff, 128);
  line.material.transparent = true;
  line.material.opacity = 0.55;
  ringRoot.add(line);
  cotidalRings.push({ line, psiDeg });
}
function updateRings(moonDirW) {
  const m = moonDirW.clone().normalize();
  const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), m);
  const base = 1.042;
  for (const { line, psiDeg } of cotidalRings) {
    const psi = psiDeg * DEG;
    const eta = TIDE_AMP * (3 * Math.cos(psi) * Math.cos(psi) - 1) / 2;
    const rr = base * (1 + eta);
    line.scale.setScalar(Math.sin(psi) * rr);
    line.position.copy(m).multiplyScalar(Math.cos(psi) * rr);
    line.quaternion.copy(quat);
  }
}

/* ---------------- 引潮力箭头阵列（大圆 16 采样 × 三分量，①②③ 分步） ---------------- */

const ARROW_N = 16;
const arrowRoot = new THREE.Group();
scene.add(arrowRoot);
const arrowSets = { g: [], c: [], r: [] };
for (let i = 0; i < ARROW_N; i++) {
  const mk = (c) => new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(), 0.2, c, 0.085, 0.05);
  arrowSets.g.push(mk(0x6fa8dc));
  arrowSets.c.push(mk(0x98a2ac));
  arrowSets.r.push(mk(0xff8c42));
  arrowRoot.add(arrowSets.g[i], arrowSets.c[i], arrowSets.r[i]);
}
const stepLabels = [];
for (const [txt, color] of [['① 引力', '#9cc4f0'], ['② 惯性离心力', '#b7bfc7'], ['③ 引潮力', '#ffb27e']]) {
  const s = makeTextSprite(txt, { fontSize: 30, color, scale: 0.0048 });
  s.visible = false;
  scene.add(s);
  stepLabels.push(s);
}

function updateArrows(moonDirW, moonDistEff) {
  const nAxis = new THREE.Vector3(0, 1, 0);
  const side = nAxis.clone().cross(moonDirW).normalize();
  const inPlane = moonDirW.clone().normalize();
  const K = 1.5 * moonDistEff * moonDistEff;   // 地心处引力长度归一为 1.5
  const cLen = 1.5;
  for (let i = 0; i < ARROW_N; i++) {
    const a = (i / ARROW_N) * TAU;
    const d = inPlane.clone().multiplyScalar(Math.cos(a)).addScaledVector(side, Math.sin(a));
    const p = d.clone().multiplyScalar(1.06);
    const toMoon = moonDirW.clone().multiplyScalar(moonDistEff).sub(p);
    const rLen = Math.max(toMoon.length(), 1e-4);
    const gLen = K / (rLen * rLen);
    const gDir = toMoon.divideScalar(rLen);
    const cDir = moonDirW.clone().negate();
    arrowSets.g[i].position.copy(p);
    arrowSets.g[i].setDirection(gDir);
    arrowSets.g[i].setLength(gLen, 0.1, 0.055);
    arrowSets.c[i].position.copy(p);
    arrowSets.c[i].setDirection(cDir);
    arrowSets.c[i].setLength(cLen, 0.1, 0.055);
    const res = gDir.clone().multiplyScalar(gLen).addScaledVector(cDir, cLen);
    arrowSets.r[i].position.copy(p);
    if (res.lengthSq() > 1e-6) {
      arrowSets.r[i].setDirection(res.clone().normalize());
      arrowSets.r[i].setLength(Math.max(res.length(), 0.09), 0.09, 0.05);
    } else {
      arrowSets.r[i].setLength(0.001, 0.001, 0.001);
    }
  }
  /* 分步标签：各分量首箭头旁的编号说明（抬高避开地球轮廓） */
  if (arrowRoot.visible) {
    stepLabels[0].position.copy(inPlane).multiplyScalar(1.06).addScaledVector(side, 0.42).add(new THREE.Vector3(0, 0.72, 0));
    stepLabels[1].position.copy(inPlane).multiplyScalar(-1.06).addScaledVector(side, 0.42).add(new THREE.Vector3(0, 0.78, 0));
    stepLabels[2].position.copy(inPlane).multiplyScalar(1.06).addScaledVector(side, -0.52).add(new THREE.Vector3(0, 0.62, 0));
  }
}
function applyArrowStep() {
  const s = state.arrowsStep;
  arrowRoot.visible = s > 0;
  for (let i = 0; i < ARROW_N; i++) {
    arrowSets.g[i].visible = s >= 1;
    arrowSets.c[i].visible = s >= 2;
    arrowSets.r[i].visible = s >= 3;
  }
  stepLabels[0].visible = s >= 1;
  stepLabels[1].visible = s >= 2;
  stepLabels[2].visible = s >= 3;
}

/* ---------------- 海岸观测站（海边小窗的第二场景） ----------------
 * 沙洲地形 + 波浪水面 + 验潮桩 + 高脚观测屋 + 放样木船 + 浮标 + 防波堤石阵 + 昼夜天穹。
 * 以 scissor 视口渲染进左下角小窗；点击放大 / Esc 还原 / 折叠为 40px 徽标。 */

const beach = {};
{
  const bs = new THREE.Scene();
  const bc = new THREE.PerspectiveCamera(46, 1.7, 0.1, 260);
  bc.position.set(0, 2.35, 8.4);
  bc.lookAt(0, 0.55, 0);
  beach.scene = bs;
  beach.cam = bc;

  /* 光照：主光随昼夜转动 + 环境半球光 */
  const hemi = new THREE.HemisphereLight(0xbdd2e4, 0x6b5a42, 0.75);
  bs.add(hemi);
  beach.hemi = hemi;
  const bLight = new THREE.DirectionalLight(0xfff2dd, 1.6);
  bs.add(bLight);
  beach.light = bLight;

  /* 沙洲地形：fbm 起伏 + 向海倾斜；顶点色做干/湿沙分带 */
  const sandTex = canvasTex(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#d3bd93';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 1500; i++) {
      const v = Math.random();
      ctx.fillStyle = v > 0.5 ? 'rgba(90,70,44,0.16)' : 'rgba(244,232,200,0.14)';
      ctx.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5);
    }
    /* 潮纹：一组近平行的微波曲线 */
    ctx.strokeStyle = 'rgba(120,98,66,0.2)';
    ctx.lineWidth = 1.4;
    for (let i = 0; i < 34; i++) {
      const y0 = (i / 34) * h;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 14) {
        const y = y0 + Math.sin(x * 0.045 + i * 1.7) * 6;
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  });
  sandTex.wrapS = sandTex.wrapT = THREE.RepeatWrapping;
  sandTex.repeat.set(5, 3);
  const SAND_W = 26, SAND_D = 15;
  const sandGeo = new THREE.PlaneGeometry(SAND_W, SAND_D, 88, 56);
  const sandBase = sandGeo.attributes.position.clone();
  {
    const pos = sandGeo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const dry = new THREE.Color(C.sandDry), wet = new THREE.Color(C.sandWet);
    for (let i = 0; i < pos.count; i++) {
      const x = sandBase.getX(i), y = sandBase.getY(i);
      const hSand = fbm3(x * 0.24, y * 0.24, 3.1, 17) * 0.32 - y * 0.16 + 0.1;
      pos.setZ(i, hSand);
      const c = dry.clone().lerp(wet, clamp((0.42 - hSand) * 1.9, 0, 1));
      colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
    }
    sandGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    sandGeo.computeVertexNormals();
  }
  const sandMesh = new THREE.Mesh(sandGeo, new THREE.MeshStandardMaterial({
    map: sandTex, vertexColors: true, roughness: 0.94, metalness: 0,
  }));
  sandMesh.rotation.x = -Math.PI / 2;
  sandMesh.position.y = -0.9;
  bs.add(sandMesh);
  beach.sand = sandMesh;

  /* 波动水面：多向正弦叠加 + 岸线泡沫带 + 深度透明（自研 GLSL） */
  beach.waterUniforms = {
    uTime: { value: 0 },
    uLevel: { value: 0.2 },
    uSunDir: { value: new THREE.Vector3(0.4, 0.8, 0.3) },
    uNight: { value: 0 },
  };
  const waterGeo = new THREE.PlaneGeometry(34, 105, 96, 72);
  const beachWaterMat = new THREE.MeshStandardMaterial({
    color: C.ocean, roughness: 0.16, metalness: 0.06,
    transparent: true, opacity: 0.92, depthWrite: true,
  });
  beachWaterMat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, beach.waterUniforms);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', `#include <common>
        uniform float uTime;
        varying vec3 vWp2;
        vec3 waveOfs(vec2 p) {
          float w = sin(p.x * 1.6 + p.y * 0.7 + uTime * 2.0) * 0.028
                  + sin(p.x * 0.9 - p.y * 1.8 + uTime * 1.4) * 0.036
                  + sin(p.x * 3.3 + p.y * 2.9 + uTime * 3.1) * 0.011;
          return vec3(0.0, w, 0.0);
        }`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        transformed += waveOfs(position.xy);`)
      .replace('#include <worldpos_vertex>', `#include <worldpos_vertex>
        vWp2 = (modelMatrix * vec4(transformed, 1.0)).xyz;`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        uniform float uTime, uNight;
        varying vec3 vWp2;
        float shoreN(vec2 p) {
          return sin(p.x * 1.1 + p.y * 2.3 + uTime * 1.9) * 0.5
               + sin(p.x * 2.7 - uTime * 1.1) * 0.3
               + sin(p.y * 4.1 + p.x * 0.6 + uTime * 2.7) * 0.2;
        }`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        /* 水深 = 水面高 − 沙面高（沙面沿 z 向岸抬升 + 噪声起伏，与地形同源） */
        float ground = 0.1 + vWp2.z * 0.16 + (sin(vWp2.x * 0.75) + sin(vWp2.z * 0.55)) * 0.12;
        float depth = vWp2.y - ground;
        /* 浅水偏青、越深越墨绿 */
        vec3 shallowC = vec3(0.16, 0.42, 0.44);
        diffuseColor.rgb = mix(shallowC, diffuseColor.rgb, smoothstep(0.0, 1.7, depth));
        /* 岸线泡沫：贴着水线来回涌动的一条亮带 */
        float edge = 1.0 - smoothstep(0.0, 0.3, depth);
        float foam = smoothstep(0.35, 0.85, shoreN(vWp2.xz * 1.7) * edge * 1.5);
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.88, 0.93, 0.9), foam * 0.85);
        diffuseColor.rgb *= mix(1.0, 0.34, uNight);`)
      .replace('#include <opaque_fragment>', `#include <opaque_fragment>
        float aOut = mix(0.5, 0.95, smoothstep(0.0, 1.2, depth));
        gl_FragColor = vec4(gl_FragColor.rgb, aOut);`);
  };
  const beachWater = new THREE.Mesh(waterGeo, beachWaterMat);
  beachWater.rotation.x = -Math.PI / 2;
  beachWater.position.set(0, -0.7, -50.5);
  bs.add(beachWater);
  beach.water = beachWater;

  /* 验潮桩：木柱 + 刻度板（CanvasTexture）+ 顶帽 + 斜撑（落在沙面上，沙面高 ≈0.29） */
  const woodMat = new THREE.MeshStandardMaterial({ color: C.wood, roughness: 0.72, metalness: 0.02 });
  const woodDeepMat = new THREE.MeshStandardMaterial({ color: C.woodDeep, roughness: 0.8 });
  const gaugeG = new THREE.Group();
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.07, 2.2, 14), woodMat);
  post.position.set(-3.4, 1.4, 1.2);
  gaugeG.add(post);
  const brace = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 1.5, 10), woodDeepMat);
  brace.position.set(-3.15, 0.95, 1.2);
  brace.rotation.z = 0.72;
  gaugeG.add(brace);
  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.16, 10), woodDeepMat);
  cap.position.set(-3.4, 2.58, 1.2);
  gaugeG.add(cap);
  /* 刻度板：0~6 m，每 0.5 m 一格 */
  const gaugeTex = canvasTex(220, 560, (ctx, w, h) => {
    ctx.fillStyle = '#f3eee2';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#27313a';
    ctx.lineWidth = 7;
    ctx.strokeRect(6, 6, w - 12, h - 12);
    ctx.fillStyle = '#27313a';
    ctx.font = '700 30px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('水位 / m', w / 2, 42);
    ctx.font = '600 24px -apple-system, sans-serif';
    for (let m = 0; m <= 6; m += 0.5) {
      const y = 80 + (m / 6) * (h - 130);
      const major = m % 1 === 0;
      ctx.strokeStyle = '#27313a';
      ctx.lineWidth = major ? 4 : 2;
      ctx.beginPath();
      ctx.moveTo(w - 24, y);
      ctx.lineTo(w - (major ? 66 : 46), y);
      ctx.stroke();
      if (major) ctx.fillText(m.toFixed(0), w - 96, y + 8);
    }
  });
  const board = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 1.5, 0.045),
    [
      woodDeepMat, woodDeepMat, woodDeepMat, woodDeepMat,
      new THREE.MeshStandardMaterial({ map: gaugeTex, roughness: 0.6 }),
      woodDeepMat,
    ]
  );
  board.position.set(-3.18, 1.25, 1.2);
  gaugeG.add(board);
  const gPatch = shadowPatch(1.6, 1.2, 0.3);
  gPatch.position.set(-3.4, 0.3, 1.2);
  gaugeG.add(gPatch);
  bs.add(gaugeG);
  beach.gauge = gaugeG;

  /* 高脚观测屋：柱廊 + 屋体 + 坡顶 + 栏杆（沙面高 ≈0.2，短柱落地） */
  const hutG = new THREE.Group();
  const stilts = [
    [-1.1, -2.2], [1.1, -2.2], [-1.1, 0.4], [1.1, 0.4],
  ];
  for (const [sx, sz] of stilts) {
    const st = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.062, 0.9, 10), woodDeepMat);
    st.position.set(sx, 0.6, sz);
    hutG.add(st);
  }
  const deck = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.09, 3.1), woodMat);
  deck.position.y = 1.09;
  hutG.add(deck);
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 1.15, 2.4),
    new THREE.MeshStandardMaterial({ color: C.hut, roughness: 0.68 })
  );
  body.position.y = 1.71;
  hutG.add(body);
  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(2.06, 0.82, 4),
    new THREE.MeshStandardMaterial({ color: C.roof, roughness: 0.6 })
  );
  roof.position.y = 2.7;
  roof.rotation.y = Math.PI / 4;
  hutG.add(roof);
  /* 窗（自发光，夜里亮） */
  beach.windowMat = new THREE.MeshStandardMaterial({
    color: 0xf7e3a8, emissive: 0xffd890, emissiveIntensity: 0.25, roughness: 0.3,
  });
  for (const wx of [-0.62, 0.62]) {
    const win = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.4, 0.02), beach.windowMat);
    win.position.set(wx, 1.78, 1.22);
    hutG.add(win);
  }
  const winSide = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.4, 0.42), beach.windowMat);
  winSide.position.set(-1.12, 1.78, 0);
  hutG.add(winSide);
  /* 栏杆 */
  const rail = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.05, 0.05), woodDeepMat);
  rail.position.set(0, 1.51, 1.52);
  hutG.add(rail);
  for (const rx of [-1.32, 0, 1.32]) {
    const rp = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.4, 8), woodDeepMat);
    rp.position.set(rx, 1.31, 1.52);
    hutG.add(rp);
  }
  hutG.position.set(1.6, 0, 0.6);
  const hPatch = shadowPatch(3.6, 3.6, 0.34);
  hPatch.position.y = 0.2;
  hutG.add(hPatch);
  bs.add(hutG);
  beach.hut = hutG;

  /* 木船：CatmullRom 截面放样船壳（放样变宽截面）+ 坐板 + 双桨 */
  function loftGeometry(sections, closeEnds = true) {
    const n = sections[0].length;
    const verts = [];
    const idx = [];
    for (const sec of sections) for (const p of sec) verts.push(p.x, p.y, p.z);
    for (let s = 0; s < sections.length - 1; s++) {
      for (let i = 0; i < n; i++) {
        const a = s * n + i, b = s * n + (i + 1) % n, c = (s + 1) * n + i, d = (s + 1) * n + (i + 1) % n;
        idx.push(a, c, b, b, c, d);
      }
    }
    if (closeEnds) {
      const bowC = verts.length / 3, sternC = bowC + 1;
      const bow = sections[0].reduce((acc, p) => acc.add(p), new THREE.Vector3()).divideScalar(n);
      const stern = sections[sections.length - 1].reduce((acc, p) => acc.add(p), new THREE.Vector3()).divideScalar(n);
      verts.push(bow.x, bow.y, bow.z, stern.x, stern.y, stern.z);
      for (let i = 0; i < n; i++) {
        idx.push(bowC, i, (i + 1) % n);
        const off = (sections.length - 1) * n;
        idx.push(sternC, off + (i + 1) % n, off + i);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }
  function buildBoat() {
    /* 闭环截面放样：右舾顶 → 右舷 → 底 → 左舷 → 左舾顶 → 顶沿回程（微下沉当舱口沿）。
     * 截面宽度沿船长用 CatmullRom 包络：首尾收尖、舯部最宽。 */
    const KEEL = 2.6, HH = 0.4;
    const widthCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.02, 0, 0), new THREE.Vector3(0.3, 0, 0), new THREE.Vector3(0.5, 0, 0),
      new THREE.Vector3(0.56, 0, 0), new THREE.Vector3(0.56, 0, 0), new THREE.Vector3(0.44, 0, 0),
      new THREE.Vector3(0.18, 0, 0),
    ]);
    const NPTS = 12;   // 闭环：0..10 唯一点 + 回绕到 0
    function sectionPoint(i, hw) {
      const gw = hw * 0.82;
      switch (i) {
        case 0: return [gw, HH * 0.5];                 // 右舾顶
        case 1: return [gw, -HH * 0.05];               // 右舷中
        case 2: return [gw * 0.96, -HH * 0.5];         // 右舾底
        case 3: return [gw * 0.55, -HH * 0.62];        // 底右
        case 4: return [0, -HH * 0.66];                // 底中
        case 5: return [-gw * 0.55, -HH * 0.62];       // 底左
        case 6: return [-gw * 0.96, -HH * 0.5];        // 左舾底
        case 7: return [-gw, -HH * 0.05];              // 左舷中
        case 8: return [-gw, HH * 0.5];                // 左舾顶
        case 9: return [-gw * 0.5, HH * 0.46];         // 顶沿（微下沉）
        case 10: return [gw * 0.5, HH * 0.46];
        default: return [gw, HH * 0.5];
      }
    }
    const secs = [];
    for (let s = 0; s <= 12; s++) {
      const t = s / 12;
      const z = (t - 0.5) * KEEL;
      const hw = widthCurve.getPoint(t).x;
      const sec = [];
      for (let i = 0; i < NPTS; i++) {
        const [x, y] = sectionPoint(i, hw);
        sec.push(new THREE.Vector3(x, y + 0.3, z));
      }
      secs.push(sec);
    }
    const hullGeo = loftGeometry(secs);
    const hullMat = new THREE.MeshStandardMaterial({
      color: C.wood, roughness: 0.62, metalness: 0.03, side: THREE.DoubleSide,
    });
    const hull = new THREE.Mesh(hullGeo, hullMat);
    const boatG = new THREE.Group();
    boatG.add(hull);
    /* 舾缘加强条：沿两舷顶边各一根弯管（CatmullRom + Tube） */
    for (const side of [1, -1]) {
      const pts = [];
      for (let s = 0; s <= 12; s++) {
        const t = s / 12;
        const hw = widthCurve.getPoint(t).x;
        pts.push(new THREE.Vector3(side * hw * 0.82, 0.3 + HH * 0.5, (t - 0.5) * KEEL));
      }
      const tube = new THREE.Mesh(
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.026, 6),
        woodDeepMat
      );
      boatG.add(tube);
    }
    /* 艏艉横板 */
    for (const zz of [KEEL / 2 - 0.06, -KEEL / 2 + 0.06]) {
      const tp = new THREE.Mesh(new THREE.BoxGeometry(0.86, HH, 0.05), woodDeepMat);
      tp.position.set(0, 0.3 + HH * 0.08, zz);
      boatG.add(tp);
    }
    /* 坐板 ×2 */
    for (const bz of [-0.55, 0.55]) {
      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.94, 0.05, 0.24), woodDeepMat);
      seat.position.set(0, 0.3 + HH * 0.2, bz);
      boatG.add(seat);
    }
    /* 双桨 */
    for (const side of [-1, 1]) {
      const oar = new THREE.Group();
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.03, 1.5, 8), woodDeepMat);
      shaft.rotation.z = side * (Math.PI / 2 - 0.24);
      oar.add(shaft);
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.03, 0.3), woodDeepMat);
      blade.position.set(side * 0.78, -0.32, 0);
      blade.rotation.z = 0.3 * side;
      oar.add(blade);
      oar.position.set(side * 0.42, 0.3 + HH * 0.5, 0.1);
      boatG.add(oar);
    }
    return boatG;
  }
  const boat = buildBoat();
  boat.position.set(-1.2, -0.5, -5.2);
  boat.rotation.y = 0.6;
  bs.add(boat);
  beach.boat = boat;

  /* 浮标：条纹球 + 环箍 + 天线小旗，随浪起伏 */
  const buoyTex = canvasTex(64, 128, (ctx, w, h) => {
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = i % 2 ? C.buoyWhite : C.buoyRed;
      ctx.fillRect(0, (i / 6) * h, w, h / 6);
    }
  });
  const buoyG = new THREE.Group();
  const buoyBody = new THREE.Mesh(
    new THREE.SphereGeometry(0.24, 24, 18),
    new THREE.MeshStandardMaterial({ map: buoyTex, roughness: 0.5 })
  );
  buoyG.add(buoyBody);
  const buoyRing = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.03, 8, 28), new THREE.MeshStandardMaterial({ color: C.buoyWhite, roughness: 0.5 }));
  buoyRing.rotation.x = Math.PI / 2;
  buoyRing.position.y = 0.06;
  buoyG.add(buoyRing);
  const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.5, 6), matStd(PAL.steel, { metalness: 0.6, roughness: 0.35 }));
  antenna.position.y = 0.42;
  buoyG.add(antenna);
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.1), new THREE.MeshBasicMaterial({ color: C.buoyRed, side: THREE.DoubleSide }));
  flag.position.set(0.08, 0.62, 0);
  buoyG.add(flag);
  buoyG.position.set(2.6, -0.5, -1.8);
  bs.add(buoyG);
  beach.buoy = buoyG;

  /* 防波堤石阵：不规则多面体石块 + 木桩（沙面高 ≈0.5，半埋落沙） */
  const rockMat = new THREE.MeshStandardMaterial({ color: C.rock, roughness: 0.9, flatShading: true });
  const rockG = new THREE.Group();
  let rseed = 5;
  const rrnd = () => { rseed = (rseed * 48271 + 11) % 2147483647; return rseed / 2147483647; };
  for (let i = 0; i < 7; i++) {
    const r = 0.16 + rrnd() * 0.2;
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 0), rockMat);
    rock.position.set(-5.6 + i * 0.42 + rrnd() * 0.2, 0.42 + r * 0.34, 2.1 + rrnd() * 0.8);
    rock.rotation.set(rrnd() * TAU, rrnd() * TAU, rrnd() * TAU);
    rockG.add(rock);
  }
  for (let i = 0; i < 3; i++) {
    const pl = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 1.1, 10), woodDeepMat);
    pl.position.set(-5.2 + i * 1.05, 0.42, 2.6);
    rockG.add(pl);
  }
  bs.add(rockG);
  beach.rocks = rockG;

  /* 昼夜天穹：渐变天空 shader + 日月贴片 + 夜星 */
  beach.skyUniforms = {
    uTop: { value: new THREE.Color(0x77b0e2) },
    uBottom: { value: new THREE.Color(0xd8e8f2) },
    uNight: { value: 0 },
  };
  const skyDome = new THREE.Mesh(
    new THREE.SphereGeometry(120, 32, 20),
    new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false,
      uniforms: beach.skyUniforms,
      vertexShader: /* glsl */`
        varying vec3 vD;
        void main() { vD = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */`
        uniform vec3 uTop, uBottom;
        uniform float uNight;
        varying vec3 vD;
        void main() {
          float k = clamp(normalize(vD).y * 0.5 + 0.5, 0.0, 1.0);
          vec3 day = mix(uBottom, uTop, pow(k, 0.9));
          vec3 night = vec3(0.03, 0.05, 0.10) + vec3(0.02, 0.03, 0.05) * k;
          gl_FragColor = vec4(mix(day, night, uNight), 1.0);
        }`,
    })
  );
  bs.add(skyDome);
  /* 夜星：简单 Points 云 */
  const starN = 260;
  const starPos = new Float32Array(starN * 3);
  for (let i = 0; i < starN; i++) {
    const th = Math.random() * TAU, ph = Math.acos(Math.random() * 0.9);
    starPos[i * 3] = Math.sin(ph) * Math.cos(th) * 110;
    starPos[i * 3 + 1] = Math.cos(ph) * 110;
    starPos[i * 3 + 2] = Math.sin(ph) * Math.sin(th) * 110;
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  beach.starMat = new THREE.PointsMaterial({ color: 0xdfe8f4, size: 1.4, sizeAttenuation: false, transparent: true, opacity: 0 });
  const beachStars = new THREE.Points(starGeo, beach.starMat);
  bs.add(beachStars);
  beach.sunBill = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeGlowTexture('255,232,170'), transparent: true, depthWrite: false, opacity: 0.95,
  }));
  beach.sunBill.scale.set(16, 16, 1);
  bs.add(beach.sunBill);
  beach.moonBill = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeGlowTexture('226,232,244'), transparent: true, depthWrite: false, opacity: 0,
  }));
  beach.moonBill.scale.set(8, 8, 1);
  bs.add(beach.moonBill);
}

/* ---------------- 海边小窗 DOM（点击放大 / Esc 还原 / 折叠徽标） ---------------- */

const coastalWin = document.createElement('div');
coastalWin.className = 'coastal-win';
coastalWin.innerHTML = `
  <div class="cw-head"><b>海岸实况 · 观测点</b><span class="cw-info">--:-- · -- m</span></div>
  <button class="cw-fold" type="button" aria-label="收起海岸小窗" title="收起海岸小窗">−</button>
  <div class="cw-note">${EXAG_NOTE} · 点按放大 · Esc 复原</div>`;
stage.appendChild(coastalWin);
const cwInfo = coastalWin.querySelector('.cw-info');

let cwFolded = false;
let cwEnlarged = false;
try { cwFolded = localStorage.getItem('tide.foldCoast') === '1'; } catch (e) { /* 忽略 */ }
if (window.innerWidth <= 1100 && localStorage.getItem('tide.foldCoast') === null) cwFolded = true;
function applyCoast() {
  coastalWin.classList.toggle('folded', cwFolded);
  coastalWin.classList.toggle('enlarged', cwEnlarged && !cwFolded);
  coastalWin.querySelector('.cw-fold').textContent = cwFolded ? '+' : '−';
  beach.renderOn = !cwFolded;
  /* 放大态让位：图窗暂时隐藏（不改编折状态） */
  const hideCharts = cwEnlarged && !cwFolded;
  stage.querySelectorAll('.tide-chart').forEach((c) => { c.style.visibility = hideCharts ? 'hidden' : ''; });
}
coastalWin.addEventListener('click', (e) => {
  if (e.target.closest('.cw-fold')) return;
  if (cwFolded) { cwFolded = false; try { localStorage.setItem('tide.foldCoast', '0'); } catch (err) { /* 忽略 */ } applyCoast(); return; }
  cwEnlarged = !cwEnlarged;
  applyCoast();
});
coastalWin.querySelector('.cw-fold').addEventListener('click', (e) => {
  e.stopPropagation();
  cwFolded = !cwFolded;
  if (cwFolded) cwEnlarged = false;
  try { localStorage.setItem('tide.foldCoast', cwFolded ? '1' : '0'); } catch (err) { /* 忽略 */ }
  applyCoast();
});
applyCoast();

/* 第二场景渲染：主渲染完成后用 scissor 覆画小窗矩形（DOM 只画边框与文字，中心透明） */
let earthReady = false;
function renderCoastalViewport() {
  if (!beach.renderOn || !earthReady) return;
  const renderer = app.renderer;
  const rect = coastalWin.getBoundingClientRect();
  const canvasRect = renderer.domElement.getBoundingClientRect();
  const pr = renderer.getPixelRatio();
  const x = (rect.left - canvasRect.left) * pr;
  const y = (canvasRect.bottom - rect.bottom) * pr;
  const w = rect.width * pr;
  const h = rect.height * pr;
  if (w < 8 || h < 8) return;
  renderer.setScissorTest(true);
  renderer.setScissor(x, y, w, h);
  renderer.setViewport(x, y, w, h);
  beach.cam.aspect = rect.width / Math.max(rect.height, 1);
  beach.cam.updateProjectionMatrix();
  renderer.render(beach.scene, beach.cam);
  renderer.setScissorTest(false);
  renderer.setViewport(0, 0, canvasRect.width * pr, canvasRect.height * pr);
}

/* 覆写渲染钩子：主渲染 → 第二场景视口 */
const baseRenderHook = app._renderHook;
app._renderHook = (dt) => {
  baseRenderHook(dt);
  renderCoastalViewport();
};
/* ---------------- 提示浮条 ---------------- */

const toastEl = document.createElement('div');
toastEl.className = 'tide-toast';
stage.appendChild(toastEl);
let toastTimer = 0;
function toast(msg, kind = '') {
  toastEl.textContent = msg;
  toastEl.className = 'tide-toast show' + (kind ? ' ' + kind : '');
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
  el.className = 'tide-chart';
  if (posKey) el.dataset.win = posKey;
  const head = document.createElement('div');
  head.className = 'tide-cv-head';
  const b = document.createElement('b');
  b.textContent = title;
  const info = document.createElement('span');
  info.className = 'tide-info';
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
  badgeBtn.className = 'tide-badge';
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
  };
}
const rangeChart = makeChartWin('朔望月 · 每日潮差包络', 190, '潮差', 'tide.foldRange', 'range');
const levelChart = makeChartWin('潮位曲线 · ±18 小时（米）', 210, '水位', 'tide.foldLevel', 'level');
const CHARTS = [rangeChart, levelChart];
function hideAllCharts() { CHARTS.forEach((c) => c.show(false)); }

/* 当前观测纬度 */
function curObsLat() {
  return state.obsLatOverride !== null ? state.obsLatOverride : CITIES[state.obsCity].lat;
}

/* 通用平衡潮（观测点，无量纲 TIDE_AMP 口径）—— simH 驱动全部周期 */
function etaAt(simH, o = {}) {
  const declMax = o.declMax !== undefined ? o.declMax : state.declMax;
  const dist = o.distScale !== undefined ? o.distScale : state.distScale;
  const mass = o.massFactor !== undefined ? o.massFactor : state.massFactor;
  const solar = o.solarTide !== undefined ? o.solarTide : state.solarTide;
  const lat = o.lat !== undefined ? o.lat : curObsLat();
  const lon = CITIES[state.obsCity].lon;
  const az = TAU * (simH / 24) / PH.SYNODIC;
  const dec = declMax * Math.sin(TAU * simH / (24 * PH.DRACONIC)) * DEG;
  const m = new THREE.Vector3(Math.cos(az) * Math.cos(dec), Math.sin(dec), -Math.sin(az) * Math.cos(dec));
  const dFac = Math.pow(MOON_DIST_TEACH / dist, 3)
    * Math.pow(1 / (1 - PH.ECC * Math.cos(TAU * simH / (24 * PH.ANOMALISTIC))), 3)
    * mass;
  const n = latLonToVec(lat, lon).applyAxisAngle(new THREE.Vector3(0, 1, 0), TAU * simH / 24);
  const dm = n.dot(m);
  let eta = TIDE_AMP * dFac * (3 * dm * dm - 1) / 2;
  if (solar) {
    const ds = n.x;
    eta += TIDE_AMP * PH.SOLAR_RATIO * (3 * ds * ds - 1) / 2;
  }
  return eta;
}

/* 每日潮差（米）：月龄 ageDays 当天，观测点一天内的 max−min */
function dayRangeMeters(ageDays, o = {}) {
  let mn = Infinity, mx = -Infinity;
  for (let h = 0; h <= 24; h += 0.5) {
    const e = etaAt(ageDays * 24 + h, o);
    if (e < mn) mn = e;
    if (e > mx) mx = e;
  }
  return (mx - mn) * M_PER_UNIT;
}

/* 潮差图：一个朔望月逐日潮差包络 + 朔望弦标记 + 当前月龄游标 */
function drawRange() {
  const { ctx, W, H } = prepCanvas(rangeChart.cv, 190);
  const P = pal();
  const L = 30, Rp = 8, T = 14, B = 20, pw = W - L - Rp, ph = H - T - B;
  const N = 120;
  const vals = [];
  let vmax = 0;
  for (let i = 0; i <= N; i++) {
    const age = (i / N) * PH.SYNODIC;
    const v = dayRangeMeters(age);
    vals.push(v);
    if (v > vmax) vmax = v;
  }
  const Y = (v) => T + (1 - v / (vmax * 1.12)) * ph;
  ctx.strokeStyle = P.border;
  ctx.lineWidth = 1;
  ctx.font = FONT;
  ctx.fillStyle = P.dim;
  ctx.textAlign = 'right';
  for (let k = 0; k <= 2; k++) {
    const v = vmax * k / 2;
    const y = Y(v);
    ctx.beginPath(); ctx.moveTo(L, y); ctx.lineTo(W - Rp, y); ctx.stroke();
    ctx.fillText(v.toFixed(1), L - 4, y + 3);
  }
  /* 大潮 / 小潮相位底标：初一 / 初八 / 十五 / 廿三 */
  ctx.textAlign = 'center';
  [[0, '初一'], [7.4, '初八'], [14.77, '十五'], [22.1, '廿三']].forEach(([age, lab]) => {
    const x = L + (age / PH.SYNODIC) * pw;
    ctx.fillText(lab, x, H - 6);
    ctx.strokeStyle = P.border;
    ctx.beginPath(); ctx.moveTo(x, T); ctx.lineTo(x, T + ph); ctx.stroke();
  });
  /* 包络曲线 */
  ctx.strokeStyle = P.accent;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  vals.forEach((v, i) => {
    const x = L + (i / N) * pw, y = Y(v);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.stroke();
  /* 曲线下淡填充 */
  ctx.lineTo(W - Rp, T + ph); ctx.lineTo(L, T + ph); ctx.closePath();
  ctx.fillStyle = 'rgba(230,120,90,0.13)';
  ctx.fill();
  /* 当前月龄游标 */
  const ageNow = ((moonAzimuthAt(state.simH) / TAU) * PH.SYNODIC) % PH.SYNODIC;
  const xc = L + (ageNow / PH.SYNODIC) * pw;
  ctx.strokeStyle = '#ffd166';
  ctx.lineWidth = 1.4;
  ctx.setLineDash([4, 3]);
  ctx.beginPath(); ctx.moveTo(xc, T); ctx.lineTo(xc, T + ph); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#ffd166';
  ctx.beginPath(); ctx.arc(xc, T + 5, 3, 0, TAU); ctx.fill();
  rangeChart.info.textContent = '今天 ' + lunarDayName(ageNow) + ' · ' + dayRangeMeters(ageNow).toFixed(1) + ' m';
}

/* 水位图：±18 小时解析潮位 + 当前时刻游标 */
function drawLevel() {
  const { ctx, W, H } = prepCanvas(levelChart.cv, 210);
  const P = pal();
  const L = 30, Rp = 8, T = 12, B = 20, pw = W - L - Rp, ph = H - T - B;
  const N = 144;
  const vals = [];
  let mn = Infinity, mx = -Infinity;
  for (let i = 0; i <= N; i++) {
    const h = -18 + (i / N) * 36;
    const m = etaToMeters(etaAt(state.simH + h));
    vals.push(m);
    if (m < mn) mn = m;
    if (m > mx) mx = m;
  }
  const pad = Math.max((mx - mn) * 0.15, 0.3);
  const lo = mn - pad, hi = mx + pad;
  const Y = (v) => T + (1 - (v - lo) / (hi - lo)) * ph;
  const X = (h) => L + ((h + 18) / 36) * pw;
  ctx.strokeStyle = P.border;
  ctx.lineWidth = 1;
  ctx.font = FONT;
  ctx.fillStyle = P.dim;
  ctx.textAlign = 'right';
  const yMid = Y((lo + hi) / 2);
  ctx.beginPath(); ctx.moveTo(L, yMid); ctx.lineTo(W - Rp, yMid); ctx.stroke();
  ctx.fillText(((lo + hi) / 2).toFixed(1), L - 4, yMid + 3);
  ctx.fillText(hi.toFixed(1), L - 4, Y(hi) + 3);
  ctx.fillText(lo.toFixed(1), L - 4, Y(lo) + 3);
  ctx.textAlign = 'center';
  [-18, -12, -6, 0, 6, 12, 18].forEach((h) => {
    ctx.fillText(h === 0 ? '现在' : (h > 0 ? '+' : '') + h + 'h', X(h), H - 6);
  });
  /* 水位曲线 */
  ctx.strokeStyle = '#6fb7de';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  vals.forEach((v, i) => {
    const x = X(-18 + (i / N) * 36), y = Y(v);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.stroke();
  ctx.lineTo(X(18), T + ph); ctx.lineTo(X(-18), T + ph); ctx.closePath();
  ctx.fillStyle = 'rgba(80,150,200,0.13)';
  ctx.fill();
  /* 当前时刻游标 */
  ctx.strokeStyle = '#ffd166';
  ctx.lineWidth = 1.4;
  ctx.setLineDash([4, 3]);
  ctx.beginPath(); ctx.moveTo(X(0), T); ctx.lineTo(X(0), T + ph); ctx.stroke();
  ctx.setLineDash([]);
  const nowM = etaToMeters(etaAt(state.simH));
  ctx.fillStyle = '#ffd166';
  ctx.beginPath(); ctx.arc(X(0), Y(nowM), 3.2, 0, TAU); ctx.fill();
  const trend = etaAt(state.simH + 0.25) > etaAt(state.simH - 0.25);
  levelChart.info.textContent = `${nowM.toFixed(2)} m · ${trend ? '涨潮中 ↑' : '落潮中 ↓'}`;
}

/* ---------------- 读数卡 ---------------- */

const hud = makeHUD(stage, [
  ['age', '月龄'],
  ['eta', '观测点潮位'],
  ['range', '今日潮差'],
  ['nextHigh', '下次高潮'],
  ['force', '月球引潮力 · 相对均值'],
  ['daynight', '观测点'],
]);
document.getElementById('lcData').appendChild(hud.el);

/* ---------------- 任务系统（原版 tasks 1:1） ---------------- */

let taskDefs = [];
let taskDone = new Set();

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

/* ---------------- 随堂检测（每章 2 题，判分 + 解析） ---------------- */

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
  head.textContent = '随堂一问';
  box.appendChild(head);
  items.forEach((item) => {
    const q = document.createElement('div');
    q.style.marginBottom = '10px';
    const qt = document.createElement('div');
    qt.style.cssText = 'font-size:12.5px;color:var(--text);line-height:1.55;margin-bottom:6px';
    qt.textContent = item.q;
    q.appendChild(qt);
    const ex = document.createElement('div');
    ex.style.cssText = 'font-size:11.5px;line-height:1.55;color:var(--text-dim);margin-top:5px;display:none';
    item.opts.forEach((opt, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'ctl-btn';
      b.style.cssText = 'display:flex;width:100%;text-align:left;font-size:11.5px;line-height:1.45;margin-bottom:4px;padding:5px 9px';
      b.textContent = String.fromCharCode(65 + i) + '. ' + opt;
      b.addEventListener('click', () => {
        q.querySelectorAll('button').forEach((bb, j) => {
          bb.disabled = true;
          if (j === item.a) { bb.classList.add('active'); bb.style.borderColor = '#3fa96f'; }
          else if (j === i) bb.style.opacity = '0.55';
        });
        ex.style.display = 'block';
        ex.textContent = (i === item.a ? '✓ ' : '✗ ') + item.ex;
      });
      q.appendChild(b);
    });
    q.appendChild(ex);
    box.appendChild(q);
  });
  document.getElementById('lesson').appendChild(box);
}

/* ---------------- 章节定义 ---------------- */

let chapterIdx = 0;
let activeCleanup = null;
let pauseCtl = null;

/* 开场飞览：三段运镜 + 字幕（原版开场 1:1；跳过 / 重看） */
const introCaption = document.createElement('div');
introCaption.className = 'intro-caption';
stage.appendChild(introCaption);
const introSkipBtn = document.createElement('button');
introSkipBtn.type = 'button';
introSkipBtn.className = 'stage-tool-btn intro-skip';
introSkipBtn.textContent = '跳过开场 »';
introSkipBtn.style.display = 'none';
stage.appendChild(introSkipBtn);

const INTRO_SEQ = [
  { pos: [2.1, 1.3, 3.1], tgt: [0, 0, 0], dur: 2.8, cap: '海岸潮位一天之中起落两回，多数岸段都是如此。' },
  { pos: [5.6, 3.2, 8.3], tgt: [0, 0, 0], dur: 3.2, cap: '古人很早就注意到：涨落时刻每天延后约五十分钟，与月亮升起的节奏一致。' },
  { pos: [2.4, 1.6, 3.6], tgt: [0, 0.05, 0], dur: 3.2, cap: '海水为何起落？答案挂在与我们相距三十八万公里的月球上。' },
];
let introTimers = [];
function stopIntro(silent) {
  introTimers.forEach(clearTimeout);
  introTimers = [];
  introCaption.classList.remove('show');
  introSkipBtn.style.display = 'none';
  state.intro = null;
  if (!silent) taskHit('watchIntro');
}
function playIntro() {
  stopIntro(true);
  state.intro = true;
  let delay = 0;
  introSkipBtn.style.display = '';
  INTRO_SEQ.forEach((seg, i) => {
    introTimers.push(setTimeout(() => {
      vfx.flyTo(seg.pos, seg.tgt, seg.dur);
      introCaption.textContent = seg.cap;
      introCaption.classList.add('show');
    }, delay * 1000));
    delay += seg.dur * 0.96;
  });
  introTimers.push(setTimeout(() => {
    introCaption.classList.remove('show');
    introSkipBtn.style.display = 'none';
    state.intro = null;
    taskHit('watchIntro');
  }, delay * 1000 + 600));
}
introSkipBtn.addEventListener('click', () => { stopIntro(false); toast('已跳过开场'); });

/* 公共控件片段 */
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
    label: '时间流速', min: 0.25, max: 12, step: 0.25, value: state.speed,
    fmt: (v) => v + '×' + (v >= 12 ? '（12 倍速）' : ''),
    onInput: (v) => {
      state.speed = v;
      if (v >= 12) taskHit('speed12');
    },
  });
  ctl.button({ label: '↺ 重置本章', onClick: () => selectChapter(chapterIdx, true) });
  return playBtn;
}
function citySeg(onChange) {
  return ctl.seg({
    options: CITIES.map((c, i) => ({ label: c.name, value: i })),
    value: state.obsCity,
    onChange: (v) => {
      state.obsCity = v;
      state.obsLatOverride = null;
      applyObsPosition();
      chartDirty = true;
      taskHit('cityChange');
      if (onChange) onChange(v);
    },
  });
}
function obsLatSlider() {
  latSliderRef = ctl.slider({
    label: '观测点纬度', min: -60, max: 60, step: 1,
    value: curObsLat(),
    fmt: (v) => Math.abs(v).toFixed(0) + '°' + (v >= 0 ? 'N' : 'S'),
    onInput: (v) => {
      state.obsLatOverride = v;
      applyObsPosition();
      chartDirty = true;
      taskHit('latChange');
    },
  });
  return latSliderRef;
}
function distSlider() {
  return ctl.slider({
    label: '月地距离', min: 4.2, max: 60, step: 0.1, value: state.distScale,
    fmt: (v) => (v <= 10.1 ? v.toFixed(1) + ' R（教学）' : v.toFixed(1) + ' R') + (v < 5 ? ' · 很近' : ''),
    onInput: (v) => {
      state.distScale = v;
      moonRing.scale.setScalar(v);
      moonRing.position.set(0, 0, 0);
      chartDirty = true;
      if (v <= 4.6) taskHit('moonCloser');
    },
  });
}
function declSlider() {
  declSliderRef = ctl.slider({
    label: '月赤纬上限', min: 0, max: PH.DECL_MAX, step: 0.2, value: state.declMax,
    fmt: (v) => v.toFixed(1) + '°' + (v === 0 ? '（在赤道上空）' : v >= 28 ? '（接近上限）' : ''),
    onInput: (v) => {
      state.declMax = v;
      chartDirty = true;
      if (v === 0) taskHit('declZero');
      if (v >= 28) taskHit('declBig');
    },
  });
  return declSliderRef;
}
function labelToggles() {
  ctl.sep();
  const defs = [
    ['月球', 'moon'], ['向月隆起', 'bulge'], ['背月隆起', 'bulge'], ['太阳光', 'sun'], ['观测地点', 'obs'],
  ];
  const seen = new Set();
  for (const [lab, key] of defs) {
    if (seen.has(lab)) continue;
    seen.add(lab);
    ctl.toggle({
      label: '标签 · ' + lab,
      value: state.labels[key],
      onChange: (v) => { state.labels[key] = v; applyLabels(); },
    });
  }
}
function applyLabels() {
  moonLabel.visible = state.labels.moon;
  bulgeMarks[0].children[1].visible = state.labels.bulge;
  bulgeMarks[1].children[1].visible = state.labels.bulge;
  bulgeMarks[0].visible = state.labels.bulge;
  bulgeMarks[1].visible = state.labels.bulge;
  sunLabel.visible = state.labels.sun;
  obsLabel.visible = state.labels.obs;
}
function solarSeg() {
  return ctl.seg({
    options: [{ label: '叠加太阳潮', value: true }, { label: '只看月球潮', value: false }],
    value: state.solarTide,
    onChange: (v) => {
      state.solarTide = v;
      chartDirty = true;
      if (!v) taskHit('solarOff');
    },
  });
}
function scaleSeg() {
  return ctl.seg({
    options: [{ label: '教学比例', value: true }, { label: '真实比例', value: false }],
    value: state.teachScale,
    onChange: (v) => {
      state.teachScale = v;
      state.distScale = v ? MOON_DIST_TEACH : PH.MOON_DIST_R;
      moonRing.scale.setScalar(state.distScale);
      toast(v ? '教学比例：月距压缩到 7.5 个地球半径，方便观察。' : '真实比例：月距约 60 个地球半径，月球小得像一颗星。');
      if (!v) taskHit('realScale');
    },
  });
}

/* 五章（原版文案块 1:1 + 任务 + 随堂检测） */
const SECTIONS = [
  {
    title: '潮起潮落',
    cam: [2.4, 1.6, 3.6], tgt: [0, 0.05, 0],
    html: `<p>在海岸待满一整天就能看到：海水<b>涨到最高</b>是高潮，<b>退到最低</b>是低潮。白天涨的叫<b>潮</b>、夜里涨的叫<b>汐</b>，合起来就是<b>潮汐</b>。</p>
<p>我国绝大多数岸段一天经历<b>两次</b>高潮与低潮，且高潮时刻每天<b>顺延约五十分钟</b>——月亮升起的时刻每天也恰好晚这么久。左下角的小窗实时显示观测点海岸的潮位。</p>`,
    tasks: [
      { t: '看完开场演示', key: 'watchIntro' },
      { t: '播放到一次高潮出现', key: 'highTide' },
      { t: '旋转视角看地月系统', key: 'drag' },
      { t: '放大左下角的海岸窗', key: 'coastBig' },
    ],
    quiz: [
      {
        q: '「潮汐」两个字分别指什么？',
        opts: ['涨潮叫潮，退潮叫汐', '白天涨的叫潮，夜里涨的叫汐', '大潮叫潮，小潮叫汐', '海潮叫潮，湖潮叫汐'],
        a: 1,
        ex: '白天的海水上涨叫「潮」，夜间的叫「汐」，合称潮汐。每天约两次涨、两次落。',
      },
      {
        q: '相邻两天的高潮时刻相差大约多少？',
        opts: ['约 24 分钟', '约 50 分钟', '约 2 小时', '不推迟'],
        a: 1,
        ex: '月出平均每天晚约五十分钟，高潮跟着月亮走，于是也一天天顺延。',
      },
    ],
    enter() {
      hideAllCharts();
      levelChart.show(true);
      chartDirty = true;
      ringRoot.visible = true;
      applyArrowStep();
      state.arrowsStep = 0; applyArrowStep();
      state.solarTide = true;
      state.declMax = 0;
      state.distScale = MOON_DIST_TEACH;
      moonRing.scale.setScalar(MOON_DIST_TEACH);
      baseCtl();
      ctl.sep();
      labelToggles();
      ctl.sep();
      ctl.button({ label: '↻ 回放开场', onClick: () => playIntro() });
      ctl.toggle({ label: '讲解模式（自动播放 · 逐句高亮）', value: state.narrate, onChange: (v) => setNarrate(v) });
      if (!state.introPlayed) {
        state.introPlayed = true;
        playIntro();     // 开场飞览自己运镜，不再叠加机位
      } else {
        setCameraSoon([2.4, 1.6, 3.6], [0, 0.05, 0]);
      }
    },
  },
  {
    title: '引潮力',
    cam: [0.8, 1.3, 6.2], tgt: [0, 0, 0],
    html: `<p>月球拉地球各处的<b>引力</b>并不均匀：离得近的一侧被拉得更狠，远的一侧更弱。</p>
<p>同时，地月绕<b>共同质心</b>公转，地球上每个位置都分到一份大小相同、方向背离月球的<b>惯性离心力</b>。</p>
<p>两笔合成的净值就是<b>引潮力</b>：正对月亮与背对月亮的两点都<b>朝外</b>鼓、量级几乎一样；侧向的点则被压向地心。它跟月距的<b>三次方成反比</b>：距离砍半，引潮力翻 8 倍。</p>`,
    tasks: [
      { t: '分步看完三个力的演示', key: 'stepAll' },
      { t: '拉近月球，验证 1/d³', key: 'moonCloser' },
      { t: '切到真实比例看月距', key: 'realScale' },
    ],
    quiz: [
      {
        q: '引潮力等于什么？',
        opts: ['月球引力本身', '引力与惯性离心力的合成（差）', '太阳引力减月球引力', '地球自转离心力'],
        a: 1,
        ex: '把各处所受月球引力减去（合成）整体平动的惯性离心力，剩下的差值才是引潮力——它才是掀起潮汐的净效果。',
      },
      {
        q: '月地距离缩短到一半，引潮力变为几倍？',
        opts: ['2 倍', '4 倍', '8 倍', '不变'],
        a: 2,
        ex: '引潮力 ∝ 1/d³。距离减半 → 1/(1/2)³ = 8 倍。潮汐对距离比对普通引力（∝1/d²）更敏感。',
      },
    ],
    enter() {
      hideAllCharts();
      ringRoot.visible = false;
      state.arrowsStep = 0;
      applyArrowStep();
      state.playing = false;
      if (pauseCtl) pauseCtl.set(false);
      baseCtl();
      ctl.sep();
      ctl.button({
        label: '▶ 下一步演示（引力 → 离心 → 引潮力）',
        onClick: () => {
          state.arrowsStep = Math.min(3, state.arrowsStep + 1);
          applyArrowStep();
          if (state.arrowsStep === 1) toast('① 引力：指向月球，离月越近越大（∝1/r²）');
          if (state.arrowsStep === 2) toast('② 惯性离心力：处处等大，方向背离月球');
          if (state.arrowsStep === 3) { toast('③ 引潮力 = 引力 − 平动惯性：两端向外、侧向指向地心'); taskHit('stepAll'); }
        },
      });
      ctl.sep();
      distSlider();
      ctl.button({ label: '月球距离减半', onClick: () => { state.distScale = Math.max(4.2, state.distScale * 0.5); moonRing.scale.setScalar(state.distScale); chartDirty = true; taskHit('moonCloser'); } });
      ctl.sep();
      scaleSeg();
      setCameraSoon([0.8, 1.3, 6.2], [0, 0, 0]);
    },
  },
  {
    title: '两次涨落',
    cam: [1.1, 2.9, 5.0], tgt: [0, 0, 0],
    html: `<p>引潮力将海水拉成<b>椭球</b>：朝着月亮与背着月亮的方向，各鼓起一团<b>隆起</b>。</p>
<p>观测点随地球自转，每经过一团隆起就遇上一场高潮；一天绕行一圈，恰好穿过两团——<b>一天两涨两落</b>。</p>
<p>月亮自身也在东移，地球要多转过约五十分钟，才能重新对准它——高潮因此每天顺延。</p>
<p class="note">这是理想的「平衡潮」图像：真实海洋受陆地阻挡与海床形态影响，高潮会滞后、潮差也因地而异。</p>`,
    tasks: [
      { t: '换个观测城市', key: 'cityChange' },
      { t: '加速时间轴看隆起跟月', key: 'speed12' },
      { t: '直接跳到下个高潮', key: 'jumpHigh' },
      { t: '流速拉到 12×', key: 'speed12' },
    ],
    quiz: [
      {
        q: '为什么一天有两次高潮？',
        opts: ['月球一天绕地球两圈', '潮汐隆起在地球两端，自转一天穿过两个隆起', '太阳和月亮各造成一次', '海底地形反射造成'],
        a: 1,
        ex: '引潮力使海水在向月、背月两侧同时鼓起。地球自转一周，观测点先后经过两个隆起 → 两次高潮。',
      },
      {
        q: '两次高潮间隔为什么比 12 小时长一点？',
        opts: ['地球自转在变慢', '月球也在向东移动，地球要多转约 50 分钟才能追上它', '太阳引力的干扰', '观测误差'],
        a: 1,
        ex: '月球公转方向与地球自转相同。地球自转 360° 后月球已东移约 12°，要再转约 12° 才对准它——约 50 分钟。',
      },
    ],
    enter() {
      hideAllCharts();
      levelChart.show(true);
      chartDirty = true;
      ringRoot.visible = true;
      state.arrowsStep = 0;
      applyArrowStep();
      state.declMax = 0;
      state.playing = true;
      if (pauseCtl) pauseCtl.set(true);
      baseCtl();
      ctl.sep();
      citySeg();
      ctl.button({
        label: '⏭ 跳到下个高潮',
        onClick: () => {
          const nh = nextHighTide(state.simH);
          if (nh && nh.dt) {
            state.simH += nh.dt;
            toast(`已跳到高潮时刻（+${nh.dt.toFixed(1)} 小时，潮位 ${etaToMeters(nh.h).toFixed(2)} m）`);
            taskHit('jumpHigh');
            chartDirty = true;
          } else toast('暂未算到下一次高潮，稍后再试', 'warn');
        },
      });
      ctl.button({ label: '⏩ 流速 12×', onClick: () => { state.speed = 12; taskHit('speed12'); } });
      setCameraSoon([1.1, 2.9, 5.0], [0, 0, 0]);
    },
  },
  {
    title: '大潮与小潮',
    cam: [1.5, 6.5, 23.5], tgt: [0.5, 0, 0],
    html: `<p>太阳质量虽大，距离却太远——折算成引潮力只有月潮的四成半左右（<b>0.46</b> 倍），也会带起一对小隆起。</p>
<p><b>朔</b>（初一）与<b>望</b>（十五）：日、月、地近似排成一线，两对隆起同向叠加，潮差攀到峰值，是为<b>大潮</b>；<b>上弦</b>（初八）与<b>下弦</b>（廿三）：日月互成直角，太阳隆起恰好填进月亮的低潮谷里，互相抵消，潮差跌到谷底——<b>小潮</b>。</p>
<p>唐人窦叔蒙所著《海涛志》已记下潮汐随月相涨落的规律；右上「朔望月 · 每日潮差包络」画出了完整一个月的走势。</p>`,
    tasks: [
      { t: '切到朔/望观察大潮', key: 'phaseSyzygy' },
      { t: '切到弦月观察小潮', key: 'phaseQuadrature' },
      { t: '关掉太阳潮做对比', key: 'solarOff' },
    ],
    quiz: [
      {
        q: '大潮发生在什么时候？',
        opts: ['月球离地球最近时', '朔和望（初一、十五）', '上弦和下弦（初八、廿三）', '任何涨潮时'],
        a: 1,
        ex: '朔望时三个天体近似排成一线，太阳潮与月亮潮同向叠加，潮差攀峰；上下弦互成直角时互相削弱，为小潮。',
      },
      {
        q: '太阳潮的幅度大约是月球潮的多少？',
        opts: ['与月球相当', '约 46%', '约 5%', '可以忽略为零'],
        a: 1,
        ex: '太阳质量虽大但距离远，引潮力 ∝ M/d³，算下来只有月亮潮的 0.46 倍上下——大潮小潮的差异因此相当可观。',
      },
    ],
    enter() {
      hideAllCharts();
      rangeChart.show(true);
      chartDirty = true;
      ringRoot.visible = false;
      state.arrowsStep = 0;
      applyArrowStep();
      state.solarTide = true;
      state.playing = true;
      if (pauseCtl) pauseCtl.set(true);
      baseCtl();
      ctl.sep();
      const ageSlider = ctl.slider({
        label: '月龄（农历）', min: 0, max: PH.SYNODIC, step: 0.05,
        value: lunarAgeNow(),
        fmt: (v) => lunarDayName(v) + ' · ' + phaseNameOf(v),
        onInput: (v) => {
          state.ageLocked = true;
          setLunarAge(v);
          chartDirty = true;
        },
      });
      phaseSlider = ageSlider;
      ctl.sep();
      ctl.button({ label: '朔 · 初一 · 大潮', onClick: () => { setLunarAge(0.2); phaseSlider.set(0.2); taskHit('phaseSyzygy'); chartDirty = true; } });
      ctl.button({ label: '上弦 · 初八 · 小潮', onClick: () => { setLunarAge(7.4); phaseSlider.set(7.4); taskHit('phaseQuadrature'); chartDirty = true; } });
      ctl.button({ label: '望 · 十五 · 大潮', onClick: () => { setLunarAge(14.77); phaseSlider.set(14.77); taskHit('phaseSyzygy'); chartDirty = true; } });
      ctl.button({ label: '下弦 · 廿三 · 小潮', onClick: () => { setLunarAge(22.15); phaseSlider.set(22.15); taskHit('phaseQuadrature'); chartDirty = true; } });
      ctl.sep();
      solarSeg();
      setCameraSoon([1.5, 6.5, 23.5], [0.5, 0, 0]);
    },
  },
  {
    title: '日潮不等',
    cam: [2.9, 2.5, 4.6], tgt: [0, 0.08, 0],
    html: `<p>月球轨道面与赤道面之间存在夹角，<b>赤纬</b>每 27.3 天左右在南北回归间摆动一轮。赤纬为零时，两团隆起对称地跨在赤道两侧，同一纬度上一天的两场高潮等高。</p>
<p>月球偏北时，向月隆起北移、背月隆起南移。金色纬线圈上的观测点每转一圈：先驶过一团隆起的<b>最厚处</b>，再擦过另一团的<b>薄边</b>——两场高潮<b>高度一高一低</b>，即<b>日潮不等</b>；纬度越高、赤纬越大，差异越明显；部分海区甚至一天只剩一次高潮。</p>`,
    tasks: [
      { t: '赤纬归零，看两峰等高', key: 'declZero' },
      { t: '拉大赤纬，看两峰分高下', key: 'declBig' },
      { t: '调整观测纬度', key: 'latChange' },
    ],
    quiz: [
      {
        q: '日潮不等是指什么？',
        opts: ['一天两次高潮时间间隔不等', '一天两次高潮高度一高一低', '涨潮快、落潮慢', '不同海区潮差不同'],
        a: 1,
        ex: '月赤纬≠0 时观测点先后穿过向月、背月两个倾斜隆起的厚处与边缘，两次高潮高度不同，即日潮不等。',
      },
      {
        q: '月赤纬调回 0° 时，中纬度观测点的两次高潮会？',
        opts: ['一样高', '差得更多', '变成一次高潮', '消失'],
        a: 0,
        ex: '赤纬为 0 时隆起关于赤道面对称，同一纬度两次穿过隆起的位置对称 → 两次高潮等高。',
      },
    ],
    enter() {
      hideAllCharts();
      levelChart.show(true);
      chartDirty = true;
      ringRoot.visible = true;
      state.arrowsStep = 0;
      applyArrowStep();
      state.playing = true;
      if (pauseCtl) pauseCtl.set(true);
      baseCtl();
      ctl.sep();
      declSlider();
      ctl.button({ label: '赤纬 0 · 月球在赤道面', onClick: () => { state.declMax = 0; declCtlRefresh(); chartDirty = true; taskHit('declZero'); } });
      ctl.button({ label: '赤纬拉满 28.6°', onClick: () => { state.declMax = PH.DECL_MAX; declCtlRefresh(); chartDirty = true; taskHit('declBig'); } });
      ctl.sep();
      obsLatSlider();
      ctl.button({ label: '观测点切到 45°N', onClick: () => { state.obsLatOverride = 45; applyObsPosition(); latCtlRefresh(); chartDirty = true; taskHit('latChange'); } });
      setCameraSoon([2.9, 2.5, 4.6], [0, 0.08, 0]);
    },
  },
];

let phaseSlider = null;
let declSliderRef = null;
let latSliderRef = null;
function declCtlRefresh() { if (declSliderRef) declSliderRef.set(state.declMax); }
function latCtlRefresh() { if (latSliderRef) latSliderRef.set(curObsLat()); }
function lunarAgeNow() {
  return ((moonAzimuthAt(state.simH) / TAU) * PH.SYNODIC) % PH.SYNODIC;
}
function setLunarAge(age) {
  /* 月龄 ↔ simH 一一对应：az = TAU·simH/24/SYNODIC → 月龄 = simH/24 */
  state.simH = age * 24;
}

/* 控件容器与章节切换 */
const ctl = createControlsPanel(document.getElementById('controls'));

let camTimer = 0;
function setCameraSoon(pos, tgt) {
  clearTimeout(camTimer);
  camTimer = setTimeout(() => app.setCamera(pos, tgt), 60);
}

const chapNav = document.getElementById('chapNav');
const chapCount = document.getElementById('chapCount');
const railNoL = document.getElementById('railNoL');
const railTitleR = document.getElementById('railTitleR');
const detailNo = document.getElementById('detailNo');
const detailTitle = document.getElementById('detailTitle');
const lessonEl = document.getElementById('lesson');
const detailBody = document.getElementById('detailBody');
const controlsEl = document.getElementById('controls');
const tideShell = document.getElementById('tideShell');

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
  chapCount.textContent = String(chapterIdx + 1).padStart(2, '0') + '/' + String(SECTIONS.length).padStart(2, '0');
  detailNo.textContent = String(chapterIdx + 1).padStart(2, '0');
  detailTitle.textContent = sec.title;
  railNoL.textContent = String(chapterIdx + 1).padStart(2, '0');
  railTitleR.textContent = sec.title;
  stopIntro(true);
  if (activeCleanup) { activeCleanup(); activeCleanup = null; }
  lessonEl.innerHTML = sec.html;
  taskDefs = sec.tasks || [];
  renderTasks();
  renderQuiz(sec.quiz);
  sec.enter();
  accSecs.controls.classList.toggle('acc-empty', !controlsEl.children.length);
  hud.el.style.display = '';
  accSecs.data.classList.toggle('acc-empty', false);
  detailBody.scrollTop = 0;
  if (!replay) app.setCamera(sec.cam, sec.tgt);
  if (state.narrate) startNarrate();
}

function gotoChapter(i) { selectChapter((i + SECTIONS.length) % SECTIONS.length); }

/* ---------------- 讲解模式：自动播放 + 知识点逐句高亮 ---------------- */

let narrateTimer = 0;
function setNarrate(v) {
  state.narrate = v;
  if (!v) { clearInterval(narrateTimer); clearNarrateHL(); return; }
  state.playing = true;
  if (pauseCtl) pauseCtl.set(true);
  startNarrate();
  toast('讲解模式：已自动播放并逐句高亮知识点');
}
function clearNarrateHL() {
  lessonEl.querySelectorAll('p').forEach((p) => p.style.removeProperty('background'));
}
function startNarrate() {
  clearInterval(narrateTimer);
  clearNarrateHL();
  const ps = Array.from(lessonEl.querySelectorAll('p'));
  if (!ps.length) return;
  let k = 0;
  const step = () => {
    clearNarrateHL();
    if (k >= ps.length) k = 0;
    const p = ps[k];
    p.style.background = 'color-mix(in srgb, var(--accent) 14%, transparent)';
    p.style.borderRadius = '6px';
    p.style.boxShadow = '0 0 0 4px color-mix(in srgb, var(--accent) 14%, transparent)';
    p.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    k++;
  };
  step();
  narrateTimer = setInterval(step, 5200);
}

/* ---------------- 栏折叠（左右独立 28px 竖条）× 专注模式（双栏同折） ---------------- */

const foldLBtn = document.getElementById('foldLBtn');
const unfoldLBtn = document.getElementById('unfoldLBtn');
const foldRBtn = document.getElementById('foldRBtn');
const unfoldRBtn = document.getElementById('unfoldRBtn');
const focusBtn = document.getElementById('focusBtn');
const classroomBtn = document.getElementById('classroomBtn');

const FOLD_KEY = { l: 'tide.foldL', r: 'tide.foldR' };
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
  tideShell.classList.toggle('fold-l', foldL);
  tideShell.classList.toggle('fold-r', foldR);
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
  tideShell.classList.toggle('focus-mode', on);
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
applyFold();

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
  tideShell.classList.toggle('classroom', classroom);
  classroomBtn.classList.toggle('active', classroom);
  classroomBtn.textContent = classroom ? '退出课堂' : '课堂模式';
  applyFold();
  toast(classroom ? '课堂模式：舞台放大，讲解浮于右侧。' : '已退出课堂模式。');
}
classroomBtn.addEventListener('click', () => setClassroom(!classroom));

/* ---------------- 右栏三块手风琴（详解 / 控件 / 读数） ---------------- */

const ACC_KEYS = { lesson: 'tide.accLesson', controls: 'tide.accControls', data: 'tide.accData' };
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

/* ---------------- 舞台工具与键盘（原版功能块 1:1：,/./空格/Esc/R/F） ---------------- */

const chapPrev = document.getElementById('chapPrev');
const chapNext = document.getElementById('chapNext');
const camResetBtn = document.getElementById('camResetBtn');
const fullBtn = document.getElementById('fullBtn');
chapPrev.addEventListener('click', () => gotoChapter(chapterIdx - 1));
chapNext.addEventListener('click', () => gotoChapter(chapterIdx + 1));
function resetView() { app.setCamera(SECTIONS[chapterIdx].cam, SECTIONS[chapterIdx].tgt); }
camResetBtn.addEventListener('click', resetView);
fullBtn.addEventListener('click', () => {
  if (document.fullscreenElement) document.exitFullscreen();
  else document.querySelector('.lab-stage3d').requestFullscreen().catch(() => { /* 静默 */ });
});
document.addEventListener('fullscreenchange', () => {
  fullBtn.textContent = document.fullscreenElement ? '⛶ 退出全屏' : '⛶ 全屏';
});
window.addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const t = e.target;
  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
  if (e.key === ',') gotoChapter(chapterIdx - 1);
  else if (e.key === '.') gotoChapter(chapterIdx + 1);
  else if (e.key === ' ') { e.preventDefault(); if (pauseCtl) pauseCtl.set(!state.playing); }
  else if (e.key === 'Escape') {
    if (cwEnlarged) { cwEnlarged = false; applyCoast(); }
    else if (classroom) setClassroom(false);
    else if (focusSaved !== null) setFocus(false);
  }
  else if (e.key === 'r' || e.key === 'R') resetView();
  else if (e.key === 'f' || e.key === 'F') fullBtn.click();
});

/* 拖动画面 → 任务命中；放大海边小窗 → 任务命中 */
app.renderer.domElement.addEventListener('pointerdown', () => taskHit('drag'), { once: false });
coastalWin.addEventListener('click', () => { if (cwEnlarged) taskHit('coastBig'); });

/* ---------------- 主循环 ---------------- */

let chartDirty = true;
let chartClock = 0;
let hudClock = 0;
let nhClock = 0.5;
let nhCache = null;
let prevEta = null;
let risingRun = 0;
const _v = new THREE.Vector3();

app.onFrame((dtReal) => {
  if (!earthReady) return;
  const dtH = state.playing ? dtReal * state.speed * state.HOURS_PER_SEC : 0;
  if (dtH) {
    state.simH += dtH;
    chartDirty = chartDirty || Math.floor(state.simH * 4) !== Math.floor((state.simH - dtH) * 4);
  }

  /* 地球自转 / 云层慢漂 */
  spinG.rotation.y = spinAngleAt(state.simH);
  const clouds = earthG.userData.cloudMesh;
  if (clouds) clouds.rotation.y = spinAngleAt(state.simH) * 0.92 + state.simH * 0.004;

  /* 月球位置（方位角 + 赤纬 + 距离） */
  const moonDir = moonDirAt(state.simH);
  const distW = state.distScale;
  moonG.position.copy(moonDir).multiplyScalar(distW);
  moonRing.scale.setScalar(distW);
  moonOrbitG.rotation.set(0, 0, 0);

  /* 潮汐水壳 uniforms */
  const dFac = Math.pow(MOON_DIST_TEACH / state.distScale, 3) * distFactorAt(state.simH) * state.massFactor;
  waterMat.uniforms.uMoon.value.copy(moonDir);
  waterMat.uniforms.uAm.value = TIDE_AMP * dFac;
  waterMat.uniforms.uAs.value = TIDE_AMP * PH.SOLAR_RATIO * (state.solarTide ? 1 : 0);
  waterMat.uniforms.uTime.value += dtReal;
  waterMesh.visible = true;

  /* 箭头与方向标 */
  if (arrowRoot.visible) updateArrows(moonDir, distW);
  const bulgeR = 1.042 + waterMat.uniforms.uAm.value + waterMat.uniforms.uAs.value;
  bulgeMarks[0].position.copy(moonDir).multiplyScalar(bulgeR + 0.1);
  bulgeMarks[1].position.copy(moonDir).multiplyScalar(-(bulgeR + 0.1));
  if (ringRoot.visible) updateRings(moonDir);

  /* 太阳 billboard 朝向相机 */
  sunDisc.quaternion.copy(camera.quaternion);

  /* 观测点潮位与涨落 */
  const etaObs = etaAt(state.simH);
  const obsDir = obsWorldDirAt(state.simH);
  const sunDirW = new THREE.Vector3(1, 0, 0);
  const dayMu = obsDir.dot(sunDirW);
  const dayK = clamp((dayMu + 0.18) / 0.4, 0, 1);

  /* 高潮任务检测：涨转落且幅值够大 */
  if (prevEta !== null && state.playing) {
    if (etaObs > prevEta) risingRun = Math.max(risingRun, 0) + 1;
    else if (risingRun > 6) {
      if (prevEta > TIDE_AMP * 0.7 * dFac) taskHit('highTide');
      risingRun = 0;
    } else risingRun = Math.max(0, risingRun - 1);
  }
  prevEta = etaObs;

  /* 海岸第二场景：水位 / 昼夜 / 浮具 */
  if (beach.scene) {
    const waterY = -0.44 + (etaObs / (TIDE_AMP * 1.6)) * 0.30;
    beach.waterUniforms.uTime.value += dtReal;
    beach.water.position.y = waterY;
    beach.waterUniforms.uNight.value = 1 - dayK;
    beach.light.intensity = 0.38 + 1.45 * dayK;
    beach.light.position.set(0.6 + dayK * 0.4, 1.2 + dayK * 1.4, 0.5);
    beach.hemi.intensity = 0.4 + 0.55 * dayK;
    beach.skyUniforms.uNight.value = 1 - dayK;
    beach.starMat.opacity = (1 - dayK) * 0.9;
    beach.sunBill.material.opacity = dayK * 0.95;
    beach.sunBill.position.set(60, 26 + dayK * 20, 30);
    beach.moonBill.material.opacity = (1 - dayK) * 0.75;
    beach.moonBill.position.set(-48, 30, -20);
    beach.windowMat.emissiveIntensity = 0.12 + (1 - dayK) * 1.4;
    const bob = Math.sin(performance.now() * 0.0011) * 0.02;
    beach.boat.position.y = waterY - 0.12 + bob;
    beach.boat.rotation.z = Math.sin(performance.now() * 0.0009) * 0.05;
    beach.buoy.position.y = waterY + 0.08 + bob * 1.4;
    beach.buoy.rotation.z = Math.sin(performance.now() * 0.0013) * 0.08;
  }

  /* 小窗信息行 */
  const hh = Math.floor(((state.simH % 24) + 24) % 24);
  const mm = Math.floor((((state.simH % 24) + 24) % 24 - hh) * 60);
  cwInfo.textContent = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')} · ${etaToMeters(etaObs).toFixed(2)} m · ${dayK > 0.5 ? '昼' : '夜'}`;

  /* 图窗重绘（节流：0.4s 一次 + 参数脏标记） */
  chartClock += dtReal;
  if (chartDirty && chartClock > 0.4) {
    chartClock = 0;
    chartDirty = false;
    if (rangeChart.open) drawRange();
    if (levelChart.open) drawLevel();
  }

  /* 读数（节流 0.25s；下次高潮解析扫描 0.8s 一次） */
  hudClock += dtReal;
  nhClock += dtReal;
  if (nhClock > 0.8) { nhClock = 0; nhCache = nextHighTide(state.simH); }
  if (hudClock > 0.25) {
    hudClock = 0;
    const age = lunarAgeNow();
    hud.set('age', `${lunarDayName(age)} · ${phaseNameOf(age)}`);
    hud.set('eta', `${etaToMeters(etaObs).toFixed(2)} m（${dayK > 0.5 ? '昼' : '夜'}）`);
    const rToday = (function () {
      let mn = Infinity, mx = -Infinity;
      const d0 = Math.floor(state.simH / 24) * 24;
      for (let h = 0; h <= 24; h += 1) {
        const e = etaAt(d0 + h);
        if (e < mn) mn = e;
        if (e > mx) mx = e;
      }
      return ((mx - mn) * M_PER_UNIT).toFixed(2);
    })();
    hud.set('range', `${rToday} m`);
    hud.set('nextHigh', nhCache && nhCache.dt ? `+${nhCache.dt.toFixed(1)} h（${etaToMeters(nhCache.h).toFixed(2)} m）` : '—');
    const relForce = Math.pow(MOON_DIST_TEACH / state.distScale, 3) * distFactorAt(state.simH) * state.massFactor;
    hud.set('force', `× ${relForce.toFixed(2)}`);
    hud.set('daynight', `${CITIES[state.obsCity].name}${state.obsLatOverride !== null ? `（${Math.abs(state.obsLatOverride).toFixed(0)}°${state.obsLatOverride >= 0 ? 'N' : 'S'}）` : ''} · ${dayK > 0.5 ? '白昼' : '夜间'}`);
  }
});

/* ---------------- 资源加载与启动 ---------------- */

loadAll([
  { key: 'day', label: '地球昼面', job: loadTexture(TEXDIR + 'day-DmukkgAy.webp') },
  { key: 'night', label: '夜面灯光', job: loadTexture(TEXDIR + 'night-7j0D73E-.webp') },
  { key: 'clouds', label: '云层', job: loadTexture(TEXDIR + 'clouds-DTkGUc9f.webp', { colorSpace: null, wrap: true }) },
  { key: 'spec', label: '海陆掩码', job: loadTexture(TEXDIR + 'earth_specular_2048-6aAFN27D.jpg', { colorSpace: null }) },
  { key: 'normal', label: '地形起伏', job: loadTexture(TEXDIR + 'earth_normal_2048-BD2vMuPH.jpg', { colorSpace: null }) },
], (d, t, label) => loader.setText(`正在加载 ${d}/${t}（${label}）`)).then((t) => {
  buildEarth(t);
  applyObsPosition();
  applyLabels();
  earthReady = true;
  window.__eduSections = { select: selectChapter };
  window.__tideStats = () => vfx.stats();
  window.__tideState = state;   // 质检句柄
  selectChapter(0);
  loader.setText('就绪');
  loader.hide();
}).catch((err) => {
  loader.setText('资源加载失败：' + err.message);
  console.error(err);
});
