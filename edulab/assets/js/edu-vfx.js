/* EduLab 共享视觉工艺模块（edu-vfx）
 * =====================================================================
 * 为所有实验提供三件套工艺基建（后续 37 个实验的标准模板）：
 *
 *   1. 电影级后处理管线 —— EffectComposer 全链路：
 *      RenderPass → UnrealBloomPass → 精修 ShaderPass（暗角/胶片颗粒/色差一体）→ OutputPass
 *      预置两种观感模式：
 *        'illus' 科学插画模式：低曝光、柔和 bloom、轻暗角、极轻颗粒、无色差、深色渐变背景
 *        'fluor' 荧光显微模式：高曝光、强 bloom 低阈值、重暗角、明显颗粒、轻微色差、纯黑背景
 *
 *   2. 科学插画色板 PAL —— 深色背景高对比的学科色系（暖膜色 / 深青细胞质 /
 *      紫核系 / 橙黄能量器官系…），材质分级见 docs/CRAFT-STANDARD.md
 *
 *   3. 程序化纹理与几何工具 —— 渐变背景、木纹、瓶签、工作室环境反射、
 *      值噪声 fbm、有机剖壳几何（顶点噪声雕刻 + 剖面封边）
 *
 * ── 三行接入 ──
 *   import { attachVFX } from './edu-vfx.js';
 *   const app = createApp({ container: stage, keepBackground: true, ... });
 *   const vfx = attachVFX(app, 'illus');          // 渲染循环与相机缓动自动接管
 *   之后 vfx.setMode('fluor') 随时换观感；app.setCamera(...) 照常用（已升级为 cubic 缓动）。
 * =====================================================================
 */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

export { THREE };

/* =====================================================================
 * 一、模式预设（调性参数集中在此，微调只改这里）
 * ===================================================================== */

/**
 * 两种观感模式的参数集。
 * - exposure：ACESFilmic 曝光（OutputPass 出口生效）
 * - bloom：UnrealBloomPass 三参数 [strength, radius, threshold]（线性 HDR 空间）
 * - vignette / grain / aberration：精修通道强度
 * - bg：场景背景（渐变 canvas 或纯色）
 */
export const VFX_MODES = {
  illus: {
    label: '科学插画',
    exposure: 1.05,
    bloom: { strength: 0.45, radius: 0.6, threshold: 0.86 },
    vignette: 0.38,
    grain: 0.028,
    aberration: 0,
    bg: 'studio-teal',      // 深青渐变插画背景
  },
  fluor: {
    label: '荧光显微',
    exposure: 1.2,
    bloom: { strength: 0.85, radius: 0.7, threshold: 0.08 },
    vignette: 0.55,
    grain: 0.05,
    aberration: 0.0016,
    bg: 'black',            // 纯黑荧光暗视野
  },
};

/* 预置渐变背景配方：makeBackdropTexture 的入参档位 */
export const BACKDROPS = {
  // 深青插画棚拍背景：中心微亮、四角压暗，衬任何高饱和器官色
  'studio-teal': { inner: '#25505e', outer: '#0a1720', glow: '#37707a', glowStrength: 0.4 },
  // 暖调实验室木桌背景：暖灰中心 + 深咖边缘，配木纹与金属高光
  'studio-warm': { inner: '#3d3226', outer: '#161009', glow: '#66513a', glowStrength: 0.45 },
};

/* =====================================================================
 * 二、科学插画色板（深背景高对比体系）
 * ===================================================================== */

/**
 * 学科色板：同一器官族内亮/暗两档，便于做"膜壳亮、内容暗"的双层配色。
 * 调性约束（不要破坏）：暖膜色 / 深青细胞质 / 紫核系 / 橙黄能量器官系，
 * 全部按深色背景上的对比度挑选；新增颜色先想清楚它属于哪个族。
 */
export const PAL = {
  /* 膜系（暖） */
  membrane: 0xe9b488, membraneHi: 0xffdfb5, membraneDeep: 0xb97f4e,
  /* 细胞质（深青） */
  cytosol: 0x2a5a64, cytosolLit: 0x53909b, cytosolDeep: 0x142f36,
  /* 核系（紫） */
  nucleus: 0x9a7fe0, nucleoplasm: 0x51409f, chromatin: 0xd4b8f2, nucleolus: 0x7337c2, pore: 0xe8ddff,
  /* 能量器官系（橙黄） */
  mitoShell: 0xef7f4d, mitoInner: 0xd64a2e, mitoMatrix: 0xf7b489, cristae: 0xa83818,
  golgi: 0xe39a35, golgiHi: 0xf7b95c,
  vesicle: 0xf2c979,
  /* 其他细胞器 */
  rer: 0x45b2c4, ser: 0x5cc7a4, ribosome: 0xe8d89e, lysosome: 0xd75a92, granule: 0xf2a0be,
  centriole: 0xdfe4ee,
  /* 植物系 */
  chloroplast: 0x46a84e, thylakoid: 0x18722f, stroma: 0xaad694, starch: 0xf0ead8,
  vacuole: 0x74bfe8, vacMem: 0xa8dcf2, cellWall: 0x9ec85e, cellWallDeep: 0x5e8a34,
  /* 细胞骨架 */
  microtubule: 0x6cc8ef, actin: 0xe86ea8, intermediate: 0xd0b478,
  /* 原核细胞 */
  dna: 0xc9a4ef, plasmid: 0xfa9cd6, capsule: 0x88d6c0, flagellum: 0xd8d2b8, pili: 0xb9c4a8,
  /* 通用 */
  ink: 0x131a22, paper: 0xf2efe6, brass: 0xb08d4a, steel: 0x9aa4ae,
};

/* =====================================================================
 * 三、精修通道 Shader（暗角 + 颗粒 + 色差，一个 pass 全做）
 * ===================================================================== */

const FinishShader = {
  uniforms: {
    tDiffuse: { value: null },
    uVin: { value: 0.38 },       // 暗角强度
    uGrainAmt: { value: 0.028 }, // 颗粒强度（线性空间叠加）
    uCA: { value: 0.0 },         // 径向色差强度
    uT: { value: 0.0 },          // 时间（颗粒动画）
    uAspect: { value: 1.0 },
  },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse;
    uniform float uVin, uGrainAmt, uCA, uT, uAspect;
    varying vec2 vUv;
    float hashPix(vec2 p) {
      return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
    }
    void main() {
      vec2 uv = vUv;
      vec2 c = (uv - 0.5) * vec2(uAspect, 1.0);
      float r = length(c);
      /* 径向色差：R/B 通道沿半径反向微移（只在高倍放大时可见，模拟镜组边缘） */
      vec2 ca = c * uCA * r * 6.0;
      vec3 col;
      col.r = texture2D(tDiffuse, uv + ca).r;
      col.g = texture2D(tDiffuse, uv).g;
      col.b = texture2D(tDiffuse, uv - ca).b;
      /* 椭圆暗角：边缘平滑压暗，中心留亮区 */
      float fall = smoothstep(0.32, 1.02, r * 1.32);
      col *= 1.0 - uVin * fall;
      /* 胶片颗粒：逐像素白噪声，时间流动 */
      float gn = hashPix(gl_FragCoord.xy + vec2(fract(uT * 61.7) * 101.0, fract(uT * 47.3) * 57.0)) - 0.5;
      col += gn * uGrainAmt;
      gl_FragColor = vec4(col, 1.0);
    }`,
};

/* =====================================================================
 * 四、后处理管线
 * ===================================================================== */

/**
 * 创建后处理管线。
 * @param {THREE.WebGLRenderer} renderer 需已配置 ACESFilmicToneMapping + SRGBColorSpace
 * @param {THREE.Scene} scene
 * @param {THREE.Camera} camera
 * @param {object} [opts] { mode: 'illus'|'fluor' } 初始模式
 * @returns {{ composer: EffectComposer, bloomPass: UnrealBloomPass, finishPass: ShaderPass,
 *             setMode(mode:string):void, resize(w,h):void, render(dt:number):void }}
 */
export function createVFX(renderer, scene, camera, opts = {}) {
  const composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera);
  const bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.45, 0.6, 0.86);
  const finishPass = new ShaderPass(FinishShader);
  const outputPass = new OutputPass();
  composer.addPass(renderPass);
  composer.addPass(bloomPass);
  composer.addPass(finishPass);
  composer.addPass(outputPass);
  /* EffectComposer 每个 pass 内部各自 render() 会重置 info——关掉自动重置，
   * 改为每帧手动清零，stats() 读到的才是整帧合计（draw call 预算验收用） */
  renderer.info.autoReset = false;

  function resize(w, h) {
    composer.setSize(w, h);
    /* bloom 内部 mip 从 resolution/2 起算——压到半分辨率可省 4× 模糊开销，辉光本身是模糊量视觉无损 */
    bloomPass.setSize(Math.max(1, Math.round(w / 2)), Math.max(1, Math.round(h / 2)));
    finishPass.uniforms.uAspect.value = w / Math.max(h, 1);
  }
  const setSizeFromRenderer = () => {
    const size = new THREE.Vector2();
    renderer.getSize(size);
    resize(size.x, size.y);
  };
  setSizeFromRenderer();

  function setMode(mode) {
    const P = VFX_MODES[mode] || VFX_MODES.illus;
    renderer.toneMappingExposure = P.exposure;
    bloomPass.strength = P.bloom.strength;
    bloomPass.radius = P.bloom.radius;
    bloomPass.threshold = P.bloom.threshold;
    finishPass.uniforms.uVin.value = P.vignette;
    finishPass.uniforms.uGrainAmt.value = P.grain;
    finishPass.uniforms.uCA.value = P.aberration;
    /* 实验室可用 opts.bg 覆盖该模式的默认背景（如 micro 用暖调棚拍） */
    applyBackground(scene, opts.bg || P.bg);
  }
  setMode(opts.mode || 'illus');

  return {
    composer, bloomPass, finishPass,
    setMode,
    resize,
    render(dt) {
      finishPass.uniforms.uT.value += dt;
      /* 自适应尺寸：容器变化后 renderer 已被 edu-core 更新，这里每帧轻量校验 */
      const size = new THREE.Vector2();
      renderer.getSize(size);
      if (size.x !== composer._width || size.y !== composer._height) resize(size.x, size.y);
      renderer.info.reset();
      composer.render(dt);
    },
  };
}

/**
 * 给 createApp 实例挂上后处理管线（推荐入口，兼容三行接入）。
 * - 接管渲染循环（app._renderHook → composer）
 * - 接管 app.setCamera：升级为 easeInOutCubic 的目标插值缓动
 * @param {object} app edu-core createApp 返回值（需 keepBackground: true）
 * @param {string} [mode='illus'] 初始观感模式
 * @param {object} [opts] { backdrop: BACKDROPS 键或自定义 makeBackdropTexture 入参 }
 * @returns {{ composer, setMode, flyTo, get mode, resize }}
 */
export function attachVFX(app, mode = 'illus', opts = {}) {
  const vfx = createVFX(app.renderer, app.scene, app.camera, { mode, bg: opts.bg });
  const pr = app.renderer.getPixelRatio();
  vfx.composer.setPixelRatio(pr);

  /* 相机缓动：easeInOutCubic，比指数收敛更有"运镜到位"的仪式感 */
  const tween = { on: false, t: 0, dur: 1.1, fromP: new THREE.Vector3(), fromT: new THREE.Vector3(), toP: new THREE.Vector3(), toT: new THREE.Vector3() };
  const easeCubic = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  function flyTo(pos, target, dur = 1.1) {
    tween.on = true; tween.t = 0; tween.dur = Math.max(dur, 0.05);
    tween.fromP.copy(app.camera.position);
    tween.fromT.copy(app.controls.target);
    tween.toP.set(...pos);
    if (target) tween.toT.set(...target); else tween.toT.copy(app.controls.target);
  }
  app.setCamera = (pos, target, immediate = false) => {
    if (immediate) {
      app.camera.position.set(...pos);
      if (target) app.controls.target.set(...target);
      app.controls.update();
      tween.on = false;
    } else flyTo(pos, target);
  };
  function tickCamera(dt) {
    if (!tween.on) return;
    tween.t += dt / tween.dur;
    const k = easeCubic(Math.min(tween.t, 1));
    app.camera.position.lerpVectors(tween.fromP, tween.toP, k);
    app.controls.target.lerpVectors(tween.fromT, tween.toT, k);
    if (tween.t >= 1) tween.on = false;
  }

  app._renderHook = (dt) => {
    tickCamera(dt);
    vfx.render(dt);
  };

  return {
    composer: vfx.composer,
    get mode() { return vfx._mode || mode; },
    setMode(m) { vfx._mode = m; vfx.setMode(m); },
    flyTo,
    resize: vfx.resize,
    /** 渲染统计（draw call / 三角形数），性能自查用 */
    stats: () => ({
      calls: app.renderer.info.render.calls,
      tris: app.renderer.info.render.triangles,
    }),
  };
}

/* =====================================================================
 * 五、背景
 * ===================================================================== */

/**
 * 全屏渐变背景贴图（scene.background 用，自动铺满画布）。
 * @param {string|object} spec BACKDROPS 键，或 { inner, outer, glow, glowStrength }
 * @returns {THREE.CanvasTexture}
 */
export function makeBackdropTexture(spec = 'studio-teal') {
  const P = typeof spec === 'string' ? (BACKDROPS[spec] || BACKDROPS['studio-teal']) : spec;
  const S = 512;
  const cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const ctx = cv.getContext('2d');
  /* 基底：外圈深色向中心浅色的径向渐变 */
  const g = ctx.createRadialGradient(S * 0.5, S * 0.42, S * 0.08, S * 0.5, S * 0.5, S * 0.72);
  g.addColorStop(0, P.inner);
  g.addColorStop(0.62, P.outer);
  g.addColorStop(1, P.outer);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  /* 中心柔光斑（模拟棚拍主灯余晖） */
  if (P.glow) {
    const glow = ctx.createRadialGradient(S * 0.5, S * 0.46, 0, S * 0.5, S * 0.46, S * 0.4);
    glow.addColorStop(0, hexA(P.glow, P.glowStrength ?? 0.4));
    glow.addColorStop(1, hexA(P.glow, 0));
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, S, S);
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** 应用背景：'black' 纯色，否则走渐变贴图档位 */
export function applyBackground(scene, spec) {
  if (spec === 'black') {
    scene.background = new THREE.Color(0x000000);
  } else {
    scene.background = makeBackdropTexture(spec);
  }
}

/* =====================================================================
 * 六、材质分级工厂（主体 Physical / 次要 Standard，见 CRAFT-STANDARD.md）
 * ===================================================================== */

/**
 * 绒面主体质感（细胞质/核质等"凝胶"表面）。
 * MeshPhysicalMaterial + sheen：边缘泛出一圈织物般的柔光，深色背景上极出效果。
 */
export function matSheen(color, o = {}) {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: o.roughness ?? 0.52,
    metalness: 0,
    sheen: o.sheen ?? 0.5,
    sheenColor: new THREE.Color(o.sheenColor ?? 0xbfd8dd),
    sheenRoughness: o.sheenRoughness ?? 0.6,
    transparent: o.opacity !== undefined,
    opacity: o.opacity ?? 1,
    emissive: new THREE.Color(o.emissive ?? 0x000000),
    emissiveIntensity: o.emissiveIntensity ?? 1,
    side: o.side ?? THREE.FrontSide,
    depthWrite: o.depthWrite ?? true,
  });
}

/**
 * 膜壳质感（细胞器膜/镜筒漆面等"亮面包裹层"）。
 * clearcoat 提供"膜上的高光带"，是双层膜结构的观感命根。
 */
export function matCoat(color, o = {}) {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: o.roughness ?? 0.34,
    metalness: o.metalness ?? 0.05,
    clearcoat: o.clearcoat ?? 1,
    clearcoatRoughness: o.clearcoatRoughness ?? 0.28,
    transparent: o.opacity !== undefined,
    opacity: o.opacity ?? 1,
    transmission: o.transmission ?? 0,
    thickness: o.thickness ?? 0,
    ior: o.ior ?? 1.45,
    side: o.side ?? THREE.FrontSide,
    depthWrite: o.depthWrite ?? true,
    emissive: new THREE.Color(o.emissive ?? 0x000000),
    emissiveIntensity: o.emissiveIntensity ?? 1,
  });
}

/** 次要材质（支架/底座/小件），MeshStandardMaterial 足够，省性能 */
export function matStd(color, o = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: o.roughness ?? 0.6,
    metalness: o.metalness ?? 0.08,
    transparent: o.opacity !== undefined,
    opacity: o.opacity ?? 1,
    emissive: new THREE.Color(o.emissive ?? 0x000000),
    emissiveIntensity: o.emissiveIntensity ?? 1,
    side: o.side ?? THREE.FrontSide,
    depthWrite: o.depthWrite ?? true,
  });
}

/** 自发光材质（荧光模式下被 bloom 点亮的成分） */
export function matGlow(color, intensity = 1.2, o = {}) {
  return new THREE.MeshStandardMaterial({
    color: o.color ?? color,
    emissive: new THREE.Color(color),
    emissiveIntensity: intensity,
    roughness: o.roughness ?? 0.5,
    metalness: 0,
    transparent: o.opacity !== undefined,
    opacity: o.opacity ?? 1,
  });
}

/** 光学玻璃（镜片/瓶身），transmission 透射 */
export function matGlass(color = 0xdfeef2, o = {}) {
  return matCoat(color, {
    roughness: o.roughness ?? 0.06,
    transmission: o.transmission ?? 0.88,
    thickness: o.thickness ?? 0.5,
    ior: o.ior ?? 1.52,
    opacity: o.opacity,
    side: THREE.DoubleSide,
  });
}

/**
 * 注册可切换发光强度的材质（荧光模式升 / 插画模式降）。
 * @returns 传入的材质本身（便于链式书写）
 */
export function registerGlow(list, mat, illusI, fluorI, opt = {}) {
  list.push({ mat, illusI, fluorI, illusO: opt.illusO, fluorO: opt.fluorO });
  return mat;
}

/** 一次性把材质清单拨到某个模式（发光强度 + 可选透明度） */
export function applyGlowMode(list, mode) {
  for (const g of list) {
    g.mat.emissiveIntensity = mode === 'fluor' ? g.fluorI : g.illusI;
    if (g.illusO !== undefined) g.mat.opacity = mode === 'fluor' ? g.fluorO : g.illusO;
  }
}

/* =====================================================================
 * 七、工作室环境反射（金属/玻璃的 PBR 反射来源，无需外部 HDR 资产）
 * ===================================================================== */

let _envCache = new WeakMap();

/**
 * 用程序化"摄影棚"小场景生成 PMREM 环境贴图：渐变穹顶 + 三块柔光板。
 * 结果按 renderer 缓存，多次调用零开销。返回的 texture 赋给 scene.environment。
 */
export function makeStudioEnvironment(renderer) {
  if (_envCache.has(renderer)) return _envCache.get(renderer);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const scn = new THREE.Scene();
  /* 穹顶：中性灰渐变，整体偏亮（给 PBR 反射足够的能量） */
  const domeTex = makeBackdropTexture({ inner: '#b6bac0', outer: '#5e6268', glow: '#eeeef0', glowStrength: 0.5 });
  scn.add(new THREE.Mesh(
    new THREE.SphereGeometry(10, 24, 16),
    new THREE.MeshBasicMaterial({ map: domeTex, side: THREE.BackSide })
  ));
  /* 三块柔光板：主暖光 / 侧冷光 / 顶白光 */
  const panel = (w, h, color, pos, lookAt = [0, 0, 0]) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color }));
    m.position.set(...pos);
    m.lookAt(...lookAt);
    scn.add(m);
  };
  panel(7, 5, 0xfff0dc, [6, 5, 6]);
  panel(6, 4, 0xc8d8e8, [-7, 3, 2]);
  panel(5, 5, 0xffffff, [0, 8, -3]);
  const tex = pmrem.fromScene(scn, 0.04).texture;
  pmrem.dispose();
  domeTex.dispose();
  _envCache.set(renderer, tex);
  return tex;
}

/* =====================================================================
 * 八、程序化纹理
 * ===================================================================== */

/** 可播种的伪随机（mulberry32）：同 seed 同纹理，保证纹理可复现 */
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * 程序化木纹：底色渐变 + 年轮宽色带 + 长条波浪纹 + 噪点 + 可选板缝。
 * @param {object} [opts]
 *   base/streak/dark: 颜色     streaks: 细纹条数   bands: 年轮带数
 *   planks: 竖直板缝数(0=整张)  seed: 随机种子      size: 画布边长
 * @returns {THREE.CanvasTexture} RepeatWrapping + anisotropy，可直接贴桌面
 */
export function makeWoodTexture(opts = {}) {
  const S = opts.size || 1024;
  const rnd = mulberry32(opts.seed ?? 7);
  const cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const ctx = cv.getContext('2d');
  const base = opts.base || '#7c5533';
  const dark = opts.dark || '#5a3a20';
  const light = opts.light || '#9a7047';
  /* 底色：左上到右下微渐变 */
  const g = ctx.createLinearGradient(0, 0, S, S);
  g.addColorStop(0, light);
  g.addColorStop(0.5, base);
  g.addColorStop(1, dark);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  /* 年轮宽色带：低频水平暗带，软边 */
  const bands = opts.bands ?? 7;
  for (let i = 0; i < bands; i++) {
    const y = rnd() * S;
    const h = S * (0.04 + rnd() * 0.09);
    const bg = ctx.createLinearGradient(0, y - h, 0, y + h);
    bg.addColorStop(0, 'rgba(60,36,18,0)');
    bg.addColorStop(0.5, `rgba(60,36,18,${0.1 + rnd() * 0.14})`);
    bg.addColorStop(1, 'rgba(60,36,18,0)');
    ctx.fillStyle = bg;
    ctx.fillRect(0, y - h, S, h * 2);
  }
  /* 长条波浪细纹：木纤维 */
  const streaks = opts.streaks ?? 90;
  for (let i = 0; i < streaks; i++) {
    const y0 = rnd() * S;
    const amp = 2 + rnd() * 7;
    const per = 120 + rnd() * 380;
    const ph = rnd() * Math.PI * 2;
    ctx.strokeStyle = rnd() > 0.5
      ? `rgba(48,28,12,${0.05 + rnd() * 0.13})`
      : `rgba(210,168,120,${0.04 + rnd() * 0.09})`;
    ctx.lineWidth = 0.6 + rnd() * 2.4;
    ctx.beginPath();
    for (let x = 0; x <= S; x += 12) {
      const y = y0 + Math.sin(x / per * Math.PI * 2 + ph) * amp + Math.sin(x / 31 + ph * 2) * 1.2;
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  /* 噪点：细颗粒肌理 */
  ctx.globalAlpha = 0.05;
  for (let i = 0; i < 2600; i++) {
    ctx.fillStyle = rnd() > 0.5 ? '#2c1808' : '#e0b988';
    ctx.fillRect(rnd() * S, rnd() * S, 1.6, 1 + rnd() * 2.2);
  }
  ctx.globalAlpha = 1;
  /* 板缝：竖直暗缝 + 受光高光边 */
  const planks = opts.planks ?? 0;
  if (planks > 0) {
    for (let i = 1; i < planks; i++) {
      const x = (i / planks) * S;
      ctx.fillStyle = 'rgba(18,10,4,0.55)';
      ctx.fillRect(x - 2, 0, 4, S);
      ctx.fillStyle = 'rgba(235,205,160,0.13)';
      ctx.fillRect(x + 3, 0, 1.6, S);
    }
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

/**
 * 试剂瓶标签贴图：纸底 + 边框 + 化学式文字（可多行）。
 * @param {string[]} lines 第一行通常为名称，后续行为浓度/说明
 * @param {object} [opts] { w, h, accent 边框色, lineSizes 每行字号数组（缺省全部同号，兼容旧调用） }
 * @returns {THREE.CanvasTexture}
 */
export function makeLabelTexture(lines, opts = {}) {
  const w = opts.w || 256;
  const h = opts.h || 160;
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#efe9d8';
  ctx.fillRect(0, 0, w, h);
  /* 纸纹噪点 */
  for (let i = 0; i < 240; i++) {
    ctx.fillStyle = 'rgba(120,100,70,0.05)';
    ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
  }
  ctx.strokeStyle = opts.accent || '#8a4030';
  ctx.lineWidth = 5;
  ctx.strokeRect(8, 8, w - 16, h - 16);
  ctx.fillStyle = '#2c2620';
  ctx.textAlign = 'center';
  const fs = opts.fontSize || Math.min(30, (h - 40) / Math.max(lines.length, 1) * 0.62);
  /* 每行字号：lineSizes 指定行距节奏按最大号算，旧调用不受影响 */
  const sizes = opts.lineSizes || lines.map(() => fs);
  const lead = Math.max(...sizes);
  lines.forEach((ln, i) => {
    ctx.font = (i === 0 ? '700 ' : '400 ') + sizes[i] + 'px "PingFang SC", sans-serif';
    ctx.fillText(ln, w / 2, h / 2 + (i - (lines.length - 1) / 2) * lead * 1.3 + sizes[i] * 0.4);
  });
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/* =====================================================================
 * 九、值噪声与有机几何
 * ===================================================================== */

/** 三维整数格哈希 → [-1,1]（确定性，可播种） */
function hash3i(x, y, z, seed) {
  let h = (x * 374761393 + y * 668265263 + z * 2147483647 + seed * 974634599) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return ((h >>> 0) / 4294967296) * 2 - 1;
}
const smoo = (t) => t * t * (3 - 2 * t);

/** 三线性插值的值噪声，输出约 [-1,1] */
export function noise3(x, y, z, seed = 0) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = smoo(x - xi), yf = smoo(y - yi), zf = smoo(z - zi);
  const L = (a, b, k) => a + (b - a) * k;
  const c00 = L(hash3i(xi, yi, zi, seed), hash3i(xi + 1, yi, zi, seed), xf);
  const c10 = L(hash3i(xi, yi + 1, zi, seed), hash3i(xi + 1, yi + 1, zi, seed), xf);
  const c01 = L(hash3i(xi, yi, zi + 1, seed), hash3i(xi + 1, yi, zi + 1, seed), xf);
  const c11 = L(hash3i(xi, yi + 1, zi + 1, seed), hash3i(xi + 1, yi + 1, zi + 1, seed), xf);
  return L(L(c00, c10, yf), L(c01, c11, yf), zf);
}

/** 分形布朗运动（3 octave）：有机轮廓的"手作感"来源 */
export function fbm3(x, y, z, seed = 0) {
  let v = 0, amp = 0.62, f = 1;
  for (let o = 0; o < 3; o++) {
    v += noise3(x * f, y * f, z * f, seed + o * 31) * amp;
    amp *= 0.5; f *= 2.13;
  }
  return v;
}

/** 半径扰动函数：单位方向 → 缩放系数，壳与剖面共用以保证严丝合缝 */
function radiusScale(dirX, dirY, dirZ, amp, freq, seed) {
  if (amp <= 0) return 1;
  return 1 + amp * fbm3(dirX * freq, dirY * freq, dirZ * freq, seed);
}

/**
 * 有机剖壳：顶点噪声雕刻的球壳 + 剖面封边条，实现"剖开看见壁厚"。
 * 生成 5 个 mesh：外膜壳 / 内壁壳 / 两条剖面封边（环带）。
 * 内外壁位移共享同一 fbm 场 → 切口处严丝合缝。
 *
 * @param {object} o
 *   radius 外壳半径        thickness 壁厚        wedge 剖开方位角弧度(<TAU)
 *   amp/freq/seed 噪声     segP/segsT 细分       mats { outer, inner, band }
 * @returns {THREE.Group} 全部已应用噪声位移，可直接 add
 */
export function makeCutShell(o = {}) {
  const R = o.radius ?? 2.5;
  const TH = o.thickness ?? 0.16;
  const wedge = o.wedge ?? Math.PI * 1.16;
  const amp = o.amp ?? 0.1;
  const freq = o.freq ?? 1.7;
  const seed = o.seed ?? 11;
  const segP = o.segsP ?? 64;
  const segT = o.segsT ?? 44;
  const mats = o.mats || {};

  const disp = (v) => {
    const len = v.length() || 1;
    const s = radiusScale(v.x / len, v.y / len, v.z / len, amp, freq, seed);
    v.multiplyScalar(s);
    return v;
  };

  const group = new THREE.Group();
  /* 外壳：部分方位角球面 */
  const outer = new THREE.SphereGeometry(R, segP, segT, 0, wedge, 0, Math.PI);
  {
    const pos = outer.attributes.position;
    for (let i = 0; i < pos.count; i++) disp(new THREE.Vector3().fromBufferAttribute(pos, i));
    outer.computeVertexNormals();
  }
  /* 内壁壳 */
  const innerR = R - TH;
  const inner = new THREE.SphereGeometry(innerR, Math.max(24, segP >> 1), Math.max(16, segT >> 1), 0, wedge, 0, Math.PI);
  {
    const pos = inner.attributes.position;
    for (let i = 0; i < pos.count; i++) disp(new THREE.Vector3().fromBufferAttribute(pos, i));
    inner.computeVertexNormals();
  }
  group.add(new THREE.Mesh(outer, mats.outer));
  group.add(new THREE.Mesh(inner, mats.inner));

  /* 剖面封边：两条环带（外弧→内弧），把"壁厚截面"表现出来 */
  for (const phi of [0, wedge]) {
    const rim = [];
    const N = segT;
    const nrm = new THREE.Vector3(Math.cos(phi), 0, -Math.sin(phi)); // 该剖面的法向（朝外）
    for (let k = 0; k <= N; k++) {
      const th = (k / N) * Math.PI;
      /* 外弧点：方向 (sinθcosφ, cosθ, sinθsinφ) × R × 位移 */
      const dx = Math.sin(th) * Math.cos(phi), dy = Math.cos(th), dz = Math.sin(th) * Math.sin(phi);
      const s = radiusScale(dx, dy, dz, amp, freq, seed);
      rim.push(new THREE.Vector3(dx * R * s, dy * R * s, dz * R * s));
      rim.push(new THREE.Vector3(dx * innerR * s, dy * innerR * s, dz * innerR * s));
    }
    const idx = [];
    for (let k = 0; k < N; k++) {
      const a = k * 2, b = k * 2 + 1, c = k * 2 + 2, d = k * 2 + 3;
      idx.push(a, b, c, b, d, c);
    }
    const geo = new THREE.BufferGeometry()
      .setFromPoints(rim)
      .setIndex(idx);
    geo.computeVertexNormals();
    const band = new THREE.Mesh(geo, mats.band || mats.inner);
    band.userData.normal = nrm;
    group.add(band);
  }
  return group;
}

/**
 * 剖开胶囊（线粒体等"两端圆中间直"的器官，可看到内部构造）。
 * 组成：中段部分圆柱 + 两端部分球 + 剖面平板封口。外壁用半透明膜材质即可透视内部。
 * @param {object} o { radius, halfLen, wedge, mats:{ shell, cap, inner? }, segs }
 * @returns {THREE.Group} 轴向为 Y；使用时自行旋转
 */
export function makeCutCapsule(o = {}) {
  const R = o.radius ?? 0.3;
  const HL = o.halfLen ?? 0.55;
  const wedge = o.wedge ?? Math.PI * 1.25;
  const segs = o.segs ?? 20;
  const mats = o.mats || {};
  const group = new THREE.Group();
  const mid = new THREE.Mesh(new THREE.CylinderGeometry(R, R, HL * 2, segs, 1, true, 0, wedge), mats.shell);
  group.add(mid);
  for (const y of [HL, -HL]) {
    const cap = new THREE.Mesh(new THREE.SphereGeometry(R, segs, Math.max(8, segs >> 1), 0, wedge, 0, Math.PI / 2), mats.shell);
    cap.position.y = y;
    if (y < 0) cap.rotation.x = Math.PI;
    group.add(cap);
  }
  /* 剖面封口半圆盘：CircleGeometry 在 XY 平面（局部 +X=径向、+Y=纵向），
   * 旋转 y = φ - π/2 后局部 +X 对准剖面方位 (sinφ, 0, cosφ)，再纵向拉伸至全长 */
  const capGeo = new THREE.CircleGeometry(R, segs, 0, wedge);
  for (const phi of [0, wedge]) {
    const plane = new THREE.Mesh(capGeo, mats.cap || mats.shell);
    plane.rotation.y = phi - Math.PI / 2;
    plane.scale.set(1, HL + R, 1);
    plane.userData.phi = phi;
    group.add(plane);
  }
  return group;
}

/* =====================================================================
 * 十、杂项工具
 * ===================================================================== */

/** '#rrggbb' + alpha → rgba() 字符串 */
export function hexA(hex, a) {
  const c = new THREE.Color(hex);
  return `rgba(${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)},${a})`;
}

/** 把一组透明材质设为"膜 ghost"参数（透视内部结构的标准配方） */
export function ghostify(mat, opacity = 0.42) {
  mat.transparent = true;
  mat.opacity = opacity;
  mat.depthWrite = false;
  mat.side = THREE.DoubleSide;
  return mat;
}

/** 器官注册表：轻量包装"名称 + 组 + 说明"，两个 lab 共用的注解习惯 */
export function makeOrganicNoiseSeed(seed) {
  return seed;
}
