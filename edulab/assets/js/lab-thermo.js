/* EduLab · 热力学工作站（thermo）— Micro 级深改
 * 12 章：热力学工作站 / 分子热运动与温度 / 气体压强从哪里来 / 玻意耳定律 /
 *        盖-吕萨克定律 / 查理定律 / 做功与内能 / 热力学第一定律 / 四冲程汽油机 /
 *        热机效率与卡诺循环 / 热力学第二定律 / 自由实验
 * 工艺：three.js 程序化热学工作站——玻璃气缸（法兰 + 三根拉杆 + 刻度条）+ 黄铜活塞（两道密封圈）+
 *       手轮·丝杠·半螺母·红色拨杆/锁扣 + 加热制冷台（发热线圈/结霜/数显窗）+ 压力表/温度计（铜管探头）+
 *       控制台（双屏幕 + 双推拉杆带 LED）+ 压缩引火仪 + 跳塞瓶 + 剖开四冲程汽油机（单缸/赛车 V8）+
 *       自由扩散箱 + 冷热铜块。全程序化建模。
 * 交互：台面推拉杆与手轮可直接拖拽（与滑杆双向同步）/ 撞击计数与冲量压强 / 数据记录 /
 *       发火顺序 1-8-4-3-6-5-7-2 / 转矩对比 / WebAudio 音效。
 * 依赖：edu-core（three 场景与控件）+ edu-vfx（后处理管线 / 色板 / 材质工厂 / 程序化纹理）。
 */
import {
  THREE, TAU, clamp,
  createApp, makeLoader, makeHUD, makeTextSprite, setSpriteText, makeGlowTexture,
} from './edu-core.js';
import {
  attachVFX, PAL,
  matSheen, matCoat, matStd, matGlow,
  makeWoodTexture, makeLabelTexture, makeStudioEnvironment,
} from './edu-vfx.js';

/* ---------------- 色板（PAL 通用族 + 热学场景族；裸色仅在此登记） ---------------- */

const COL = {
  // 热学主体族
  heatCoil: 0xd85426, heatCoilHot: 0xff5a1e, frost: 0xdfeef6, bath: 0x3f7fae,
  // 金属族（PAL brass / steel 衍生）
  brass: PAL.brass, brassHi: 0xd9b566, brassDeep: 0x7a5f2c,
  steel: PAL.steel, steelDark: 0x5c646c, iron: 0x4a4f55, chrome: 0xcfd6dd,
  copper: 0xb46a3c, copperHot: 0xe8834a, copperCold: 0x8fa2b8,
  // 玻璃/液体族
  glass: 0xbfd9ea, gasMist: 0xdff0f8,
  // 分子族（温度映射：冷蓝 → 暖橙红）
  molCool: 0x5aa8e6, molMid: 0xe8975a, molHot: 0xff6a3a,
  // 发动机族
  engPaint: 0x9c3428, engPaintHi: 0xc04a34, engBlock: 0x767c84, engHead: 0x8a9098,
  pistonAlu: 0xc9ced6, crank: 0x6e757d, flywheel: 0x565c63, exhaust: 0x8e9299,
  intake: 0xa8b0ba, redline: 0xff4444,
  // 台面/环境族
  deskWood: 0x8a6844, deskWoodDeep: 0x5e4630, frame: 0x3a332c, rubber: 0x2e3236,
  panelDark: 0x24262a, panelFace: 0x2e3238, ledGreen: 0x69e8a0, ledAmber: 0xffb347,
  // 火焰/雾
  flame: 0xffa03a, flameCore: 0xffe8b0, fog: 0xe8f2f8,
  // 纸标签
  paper: PAL.paper, ink: PAL.ink,
};

/* ---------------- 场景与后处理接入（暖调棚拍 + ACES） ---------------- */

const stage = document.getElementById('stage');
const loader = makeLoader(stage, '正在布置热学工作站…');
const app = createApp({
  container: stage,
  keepBackground: true,
  fov: 42,
  cameraPos: [2.5, 2.9, 5.0],
  target: [-0.35, 2.1, 0],
  minDistance: 0.5,
  maxDistance: 30,
});
const vfx = attachVFX(app, 'illus', { bg: 'studio-warm' });
const { scene, camera, controls } = app;
scene.environment = makeStudioEnvironment(app.renderer);

/* 光照组：主暖光 + 补光 + 反弹 + 半球环境（傍晚工作室氛围，可被发动机章切换） */
const hemi = new THREE.HemisphereLight(0xcfd4e0, 0x40342a, 0.6);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff0d2, 1.5);
sun.position.set(3.4, 5.2, 2.8);
scene.add(sun);
const fill = new THREE.DirectionalLight(0x9fb4cc, 0.35);
fill.position.set(-3.2, 2.4, 1.6);
scene.add(fill);
const bounce = new THREE.DirectionalLight(0xe8b98a, 0.26);
bounce.position.set(-1.2, 0.9, -3.0);
scene.add(bounce);
const amb = new THREE.AmbientLight(0xffffff, 0.18);
scene.add(amb);
function setWorkshopLight(k) {   // k: 1=工作室常态 0=展示暗场
  sun.intensity = 1.5 * k + 0.35 * (1 - k);
  hemi.intensity = 0.6 * k + 0.3 * (1 - k);
  amb.intensity = 0.18 * k + 0.26 * (1 - k);
}
setWorkshopLight(1);

/* ---------------- 通用工具 ---------------- */

const world = new THREE.Group();
scene.add(world);
let chapterTick = null;
let activeCleanup = null;
let hud = null;

const smooth = (t) => t * t * (3 - 2 * t);
const easeIO = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
function camTo(pos, target, dur) {
  if (dur) vfx.flyTo(pos, target, dur); else app.setCamera(pos, target);
}
function clearGroup(g) {
  g.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) {
      if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose());
      else m.dispose();
    }
  });
  g.clear();
}
const M = (color, rough = 0.8, metal = 0) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal });
const box = (w, h, d, mat) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
const cyl = (rt, rb, h, mat, seg = 20) => new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);

/** 接触阴影（径向衰减黑晕，贴地片用） */
function makeShadowTexture() {
  const S = 256;
  const cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const ctx = cv.getContext('2d');
  const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, 'rgba(8,8,10,0.5)');
  g.addColorStop(0.55, 'rgba(8,8,10,0.24)');
  g.addColorStop(1, 'rgba(8,8,10,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
const shadowTex = makeShadowTexture();
function contactShadow(w, d, opacity = 0.9) {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(w, d),
    new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, opacity })
  );
  m.rotation.x = -Math.PI / 2;
  return m;
}
/** 光晕精灵（火焰/点火/热辉光） */
function glowSprite(size = 0.3, color = '255,180,90') {
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeGlowTexture(color, [[0, 'rgba(C,0.95)'], [0.25, 'rgba(C,0.42)'], [1, 'rgba(C,0)']]),
    transparent: true, depthWrite: false,
  }));
  sp.scale.setScalar(size);
  return sp;
}
function lbl(text, color = '#ffd9a8', scale = 0.0028) {
  return makeTextSprite(text, { fontSize: 30, color, scale, bg: 'rgba(26,20,14,0.68)' });
}

/** 玻璃材质（去 transmission 版，防透射 pass 翻倍 draw call） */
function matGlassLite(color, o = {}) {
  const m = matCoat(color, {
    roughness: o.roughness ?? 0.06,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.12,
    transparent: true,
    opacity: o.opacity ?? 0.24,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  m.forceSinglePass = true;
  return m;
}
const glassMat = matGlassLite(COL.glass, { opacity: 0.2 });

/* 右栏控件 mount（复用 lab.css 的 ctl 样式） */
const controlsEl = document.getElementById('controls');
const ctl = (() => {
  const el = controlsEl;
  const api = {
    el,
    clear() { el.innerHTML = ''; },
    sep() { const s = document.createElement('span'); s.className = 'ctl-sep'; el.appendChild(s); },
    slider({ label: text, min, max, step = 1, value, fmt = (v) => String(v), onInput }) {
      const wrap = document.createElement('div'); wrap.className = 'ctl';
      const lab = document.createElement('label'); lab.textContent = text; wrap.appendChild(lab);
      const input = document.createElement('input'); input.type = 'range';
      input.min = min; input.max = max; input.step = step; input.value = value;
      const val = document.createElement('span'); val.className = 'ctl-val';
      const paint = () => { val.textContent = fmt(parseFloat(input.value)); };
      input.addEventListener('input', () => { paint(); onInput(parseFloat(input.value)); });
      wrap.appendChild(input); wrap.appendChild(val); paint(); el.appendChild(wrap);
      return { el: wrap, set(v) { input.value = v; paint(); }, get() { return parseFloat(input.value); } };
    },
    toggle({ label: text, value = false, onChange }) {
      const lab = document.createElement('label'); lab.className = 'ctl-toggle';
      const input = document.createElement('input'); input.type = 'checkbox'; input.checked = value;
      const track = document.createElement('span'); track.className = 'track';
      lab.appendChild(input); lab.appendChild(track); lab.appendChild(document.createTextNode(text));
      input.addEventListener('change', () => onChange(input.checked));
      el.appendChild(lab);
      return { el: lab, set(v) { input.checked = v; onChange(v); }, get() { return input.checked; } };
    },
    button({ label: text, onClick, cls = '' }) {
      const b = document.createElement('button'); b.type = 'button';
      b.className = 'ctl-btn' + (cls ? ' ' + cls : ''); b.textContent = text;
      b.addEventListener('click', () => { sfx.tick(); onClick(b); });
      el.appendChild(b);
      return b;
    },
    seg({ label: text, options, value, onChange }) {
      if (text) {
        const lab = document.createElement('div'); lab.className = 'ctl-label'; lab.textContent = text; el.appendChild(lab);
      }
      const btns = [];
      const row = document.createElement('div'); row.className = 'lc-btnrow'; el.appendChild(row);
      const paint = () => btns.forEach(({ b, v }) => b.classList.toggle('active', v === value));
      options.forEach((opt) => {
        const b = document.createElement('button'); b.type = 'button';
        b.className = 'ctl-btn'; b.textContent = opt.label;
        b.addEventListener('click', () => { sfx.tick(); value = opt.value; paint(); onChange(value); });
        row.appendChild(b);
        btns.push({ b, v: opt.value });
      });
      paint();
      return { set(v) { value = v; paint(); onChange(v); } };
    },
    btnrow() {
      const row = document.createElement('div'); row.className = 'lc-btnrow'; el.appendChild(row);
      return {
        add(label, onClick) {
          const b = document.createElement('button'); b.type = 'button';
          b.className = 'ctl-btn'; b.textContent = label;
          b.addEventListener('click', () => { sfx.tick(); onClick(b); });
          row.appendChild(b);
          return b;
        },
        el: row,
      };
    },
    note(text) {
      const n = document.createElement('div'); n.className = 'ctl-note'; n.textContent = text; el.appendChild(n);
      return n;
    },
  };
  return api;
})();
function buildHud(rows) {
  const box = document.getElementById('thmData');
  box.innerHTML = '';
  hud = makeHUD(box, rows);
  return hud;
}
function hset(key, text) { if (hud) hud.set(key, text); }

/* 提示条 */
function toast(text) {
  const old = stage.querySelector('.thm-toast');
  if (old) old.remove();
  const el = document.createElement('div');
  el.className = 'thm-toast';
  el.textContent = text;
  stage.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 300);
  }, 2400);
}

/* ---------------- 音效（WebAudio：推拉杆/面板咔哒 + 发动机轰鸣） ---------------- */

const sfx = (() => {
  let ctx = null;
  let on = true;
  let eng = null;
  function ac() {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { on = false; }
    }
    if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  }
  function blip(freq, dur, gain, type = 'sine') {
    const c = ac();
    if (!c || !on) return;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(gain, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
    o.connect(g).connect(c.destination);
    o.start();
    o.stop(c.currentTime + dur);
  }
  return {
    tick() { blip(720, 0.05, 0.05, 'triangle'); },           // 面板/按钮咔哒
    thump() { blip(140, 0.16, 0.09, 'sine'); },              // 推拉杆落位
    pop() { blip(58, 0.3, 0.14, 'sawtooth'); },              // 瓶塞跳起
    get enabled() { return on; },
    toggle() { on = !on; if (!on) this.engOff(); return on; },
    /** 发动机持续轰鸣：freq 跟随转速 */
    engineStart() {
      const c = ac();
      if (!c || !on || eng) return;
      const o = c.createOscillator();
      const o2 = c.createOscillator();
      const g = c.createGain();
      const lp = c.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 420;
      o.type = 'sawtooth';
      o2.type = 'square';
      o2.detune.value = 8;
      g.gain.value = 0.0001;
      o.connect(lp); o2.connect(lp); lp.connect(g).connect(c.destination);
      o.start(); o2.start();
      eng = { o, o2, g };
    },
    engineSet(rpm, cylinders) {
      if (!eng) return;
      const f = Math.max(18, (rpm / 60) * (cylinders / 2));
      eng.o.frequency.setTargetAtTime(f, ctx.currentTime, 0.08);
      eng.o2.frequency.setTargetAtTime(f * 2.02, ctx.currentTime, 0.08);
      eng.g.gain.setTargetAtTime(0.035, ctx.currentTime, 0.15);
    },
    engOff() {
      if (!eng) return;
      const e = eng; eng = null;
      try {
        e.g.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.05);
        setTimeout(() => { try { e.o.stop(); e.o2.stop(); } catch (err) { /* 已停止 */ } }, 260);
      } catch (err) { /* 忽略 */ }
    },
  };
})();

/* ---------------- 气体状态与物理 ---------------- */

const R = 8.314;                                    // J/(mol·K)
const KV = (n, T, VL) => (n * R * T) / (VL * 1e-3) / 1000;   // kPa（V 单位 L）

const G = {
  N: 70,            // 示意分子数
  T: 300,           // K
  V: 1.0,           // L
  gas: 'mono',      // mono | di
  slow: false,      // 分子慢放
  nMol() { return this.N * 8.571e-4; },           // N=70 → 0.06 mol
  pKPa() { return KV(this.nMol(), this.T, this.V); },
  cv() { return this.gas === 'mono' ? 1.5 * R : 2.5 * R; },
  gamma() { return this.gas === 'mono' ? 5 / 3 : 7 / 5; },
  adiabatT(T0, V0, V1) { return T0 * Math.pow(V0 / V1, this.gamma() - 1); },
};

/* 气缸几何：V∈[0.2,2.0] L 线性映射到气柱高度 */
const CYL = { cx: -1.05, r: 0.30, y0: 1.42, hMin: 0.26, hMax: 1.42 };
const gasH = (V) => CYL.hMin + (V - 0.2) / (2.0 - 0.2) * (CYL.hMax - CYL.hMin);
const pistonY = () => CYL.y0 + gasH(G.V);

/* ---------------- 场景注册（懒建 + 切换） ---------------- */

const scenes = {};
let activeScene = null;
let activeSceneKey = null;
function useScene(key, build) {
  if (activeScene && activeScene !== scenes[key]) activeScene.visible = false;
  if (!scenes[key]) {
    const g = new THREE.Group();
    g.visible = false;
    world.add(g);
    scenes[key] = g;
  }
  const g = scenes[key];
  if (!g.userData.built) { build(g); g.userData.built = true; }
  g.visible = true;
  activeScene = g;
  activeSceneKey = key;
  return g;
}

/* ---------------- 工作站场景（主场景） ---------------- */

const STN = {
  molecules: null, pollen: null, heater: null, heaterMat: [], frost: null, dispTex: null,
  piston: null, handwheel: null, halfnut: null, stalkRed: null, lockCatch: null,
  screw: null, yoke: null, gaugeP: null, needleP: null, gaugeT: null, needleT: null,
  screenA: null, screenB: null, stalkL: null, stalkR: null, ledLTex: null, ledRTex: null,
  labels: [], highlights: null, consoleG: null,
};

let deskMat, wallMat, floorMat;
function buildStudio(g) {
  /* 地板与后墙 */
  floorMat = M(0x453b3e, 0.94);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(34, 34), floorMat);
  floor.rotation.x = -Math.PI / 2;
  g.add(floor);
  wallMat = M(0x4c4148, 0.95);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(34, 13), wallMat);
  wall.position.set(0, 6.5, -7);
  g.add(wall);
  /* 踢脚线 + 墙上搁板（场景叙事） */
  const skirt = box(34, 0.18, 0.06, M(0x35302c, 0.8));
  skirt.position.set(0, 0.09, -6.96);
  g.add(skirt);
  const shelf = box(2.2, 0.05, 0.34, M(0x5e4a34, 0.7));
  shelf.position.set(1.9, 2.72, -6.4);
  g.add(shelf);
  const shelf2 = box(1.6, 0.05, 0.34, M(0x5e4a34, 0.7));
  shelf2.position.set(-2.5, 3.1, -6.4);
  g.add(shelf2);

  /* 工作台：木面台板 + 桌腿 + 后挡板 */
  deskMat = new THREE.MeshStandardMaterial({
    map: makeWoodTexture({ base: '#8a6844', dark: '#5e4630', light: '#a8845c', streaks: 26, bands: 5, planks: 3, seed: 27 }),
    roughness: 0.72,
  });
  const deskTop = box(4.9, 0.1, 1.62, deskMat);
  deskTop.position.set(0.1, 1.17, -0.1);
  g.add(deskTop);
  const deskEdge = box(4.9, 0.05, 1.68, M(COL.deskWoodDeep, 0.8));
  deskEdge.position.set(0.1, 1.1, -0.1);
  g.add(deskEdge);
  for (const [lx, lz] of [[-2.25, -0.72], [2.35, -0.72], [-2.25, 0.52], [2.35, 0.52]]) {
    const leg = box(0.13, 1.06, 0.13, M(0x39332d, 0.82));
    leg.position.set(lx, 0.53, lz);
    g.add(leg);
    const foot = box(0.2, 0.04, 0.2, M(0x2c2824, 0.9));
    foot.position.set(lx, 0.02, lz);
    g.add(foot);
  }
  const backPanel = box(4.9, 0.5, 0.05, M(0x443c34, 0.85));
  backPanel.position.set(0.1, 0.86, -0.88);
  g.add(backPanel);
  { const sh = contactShadow(5.6, 2.1, 0.75); sh.position.set(0.1, 0.012, -0.1); g.add(sh); }

  /* 暖色吊灯（灯罩 + 灯泡辉光 + 点光） */
  const lampG = new THREE.Group();
  const cord = cyl(0.008, 0.008, 0.7, M(0x222222, 0.9), 6);
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.26, 24, 1, true), M(0x354050, 0.5, 0.4));
  shade.material.side = THREE.DoubleSide;
  const bulb = glowSprite(0.3, '255,214,150');
  bulb.position.y = -0.1;
  const lampLight = new THREE.PointLight(0xffd9a0, 14, 9, 2);
  lampLight.position.y = -0.12;
  lampG.add(cord, shade, bulb, lampLight);
  cord.position.y = 0.35;
  shade.position.y = 0.02;
  lampG.position.set(0.3, 3.34, 0.35);
  g.add(lampG);

  buildCylinderAssembly(g);
  buildGauges(g);
  buildConsole(g);
  buildProps(g);
  buildMolecules(g);
  buildTourHighlights(g);
}

/* ---- 玻璃气缸总成：底座 + 加热制冷台 + 厚壁玻璃筒 + 法兰/拉杆 + 刻度条 + 黄铜活塞 + 手轮丝杠 ---- */

function buildCylinderAssembly(g) {
  const cx = CYL.cx;
  const grp = new THREE.Group();
  g.add(grp);

  /* 加热/制冷台（Peltier 风格金属台 + 发热线圈 + 结霜层 + 数显窗） */
  const heaterBody = box(0.98, 0.2, 0.66, M(0x39424c, 0.5, 0.55));
  heaterBody.position.set(cx, 1.27, 0);
  grp.add(heaterBody);
  const heaterTop = box(0.9, 0.03, 0.6, M(0x8b929c, 0.35, 0.8));
  heaterTop.position.set(cx, 1.385, 0);
  grp.add(heaterTop);
  /* 发热线圈：5 圈密绕螺线管（浅盘内可见） */
  STN.heater = new THREE.Group();
  const coilMat = new THREE.MeshStandardMaterial({ color: COL.heatCoil, roughness: 0.42, metalness: 0.65, emissive: COL.heatCoilHot, emissiveIntensity: 0 });
  STN.heaterMat = [coilMat];
  const coilCurve = [];
  for (let i = 0; i <= 130; i++) {
    const t = i / 130;
    coilCurve.push(new THREE.Vector3(Math.cos(t * TAU * 5.5) * 0.24, t * 0.16, Math.sin(t * TAU * 5.5) * 0.24));
  }
  const coilGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(coilCurve), 150, 0.012, 7, false);
  const coil = new THREE.Mesh(coilGeo, coilMat);
  coil.position.set(cx, 1.4 - 0.13, 0);
  STN.heater.add(coil);
  STN.heater.position.set(0, 0, 0);
  grp.add(STN.heater);
  /* 结霜层（制冷时出现） */
  const frostTex = makeFrostTexture();
  STN.frost = new THREE.Mesh(
    new THREE.PlaneGeometry(0.88, 0.58),
    new THREE.MeshBasicMaterial({ map: frostTex, transparent: true, opacity: 0, depthWrite: false })
  );
  STN.frost.rotation.x = -Math.PI / 2;
  STN.frost.position.set(cx, 1.402, 0);
  grp.add(STN.frost);
  /* 数显窗（前面板，设定温度数码管） */
  const dispCv = document.createElement('canvas');
  dispCv.width = 256; dispCv.height = 96;
  STN.dispTex = new THREE.CanvasTexture(dispCv);
  STN.dispTex.colorSpace = THREE.SRGBColorSpace;
  const dispFrame = box(0.34, 0.13, 0.03, M(0x14161a, 0.4, 0.3));
  dispFrame.position.set(cx, 1.27, 0.345);
  grp.add(dispFrame);
  const disp = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.105), new THREE.MeshBasicMaterial({ map: STN.dispTex }));
  disp.position.set(cx, 1.27, 0.362);
  grp.add(disp);
  drawHeaterDisplay('恒温', G.T, false);
  /* 散热鳍片（台体两侧，InstancedMesh 单 draw call） */
  {
    const fins = new THREE.InstancedMesh(new THREE.BoxGeometry(0.03, 0.16, 0.5), M(0x6d747c, 0.5, 0.7), 10);
    const dumF = new THREE.Object3D();
    let fi = 0;
    for (const sx of [-1, 1]) {
      for (let i = 0; i < 5; i++) {
        dumF.position.set(cx + sx * (0.5 + i * 0.028), 1.3, 0);
        dumF.updateMatrix();
        fins.setMatrixAt(fi++, dumF.matrix);
      }
    }
    fins.instanceMatrix.needsUpdate = true;
    grp.add(fins);
  }

  /* 导热铜板 + 玻璃筒底 */
  const copperPlate = cyl(CYL.r + 0.05, CYL.r + 0.05, 0.035, M(COL.copper, 0.35, 0.85), 30);
  copperPlate.position.set(cx, CYL.y0 - 0.02, 0);
  grp.add(copperPlate);

  /* 厚壁玻璃筒：外壁 + 内壁 + 环形空气夹层（顶点着色无，用双圆柱 + 底环封） */
  const wallT = 0.032;
  const hWall = CYL.hMax + 0.34;
  const outer = new THREE.Mesh(new THREE.CylinderGeometry(CYL.r + wallT, CYL.r + wallT, hWall, 34, 1, true), glassMat);
  outer.position.set(cx, CYL.y0 + hWall / 2 - 0.02, 0);
  grp.add(outer);
  const inner = new THREE.Mesh(new THREE.CylinderGeometry(CYL.r, CYL.r, hWall, 34, 1, true), glassMat);
  inner.position.copy(outer.position);
  grp.add(inner);
  const wallRing = new THREE.Mesh(new THREE.RingGeometry(CYL.r, CYL.r + wallT, 34), glassMat);
  wallRing.rotation.x = -Math.PI / 2;
  wallRing.position.set(cx, CYL.y0 + hWall - 0.02, 0);
  grp.add(wallRing);

  /* 上/下法兰 + 三根拉杆 + 双螺母 */
  const flangeMat = M(0x565e66, 0.42, 0.75);
  const flangeTop = new THREE.Mesh(new THREE.CylinderGeometry(CYL.r + 0.1, CYL.r + 0.1, 0.045, 34), flangeMat);
  flangeTop.position.set(cx, CYL.y0 + hWall - 0.02, 0);
  grp.add(flangeTop);
  const flangeBot = flangeTop.clone();
  flangeBot.position.y = CYL.y0 - 0.045;
  grp.add(flangeBot);
  const rodMat = M(0x9ba3ab, 0.3, 0.85);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * TAU + Math.PI / 6;
    const rx = cx + Math.cos(a) * (CYL.r + 0.075);
    const rz = Math.sin(a) * (CYL.r + 0.075);
    const rod = cyl(0.016, 0.016, hWall + 0.1, rodMat, 10);
    rod.position.set(rx, CYL.y0 + hWall / 2 - 0.02, rz);
    grp.add(rod);
    for (const ny of [CYL.y0 + hWall + 0.03, CYL.y0 - 0.1]) {
      const nut = cyl(0.032, 0.032, 0.03, M(0x77808a, 0.35, 0.8), 6);
      nut.position.set(rx, ny, rz);
      grp.add(nut);
    }
  }

  /* 背后刻度条（读气柱高度：CanvasTexture 主刻度 0..2.0 L） */
  const scaleCv = makeScaleTexture();
  const scaleBar = new THREE.Mesh(
    new THREE.PlaneGeometry(0.1, CYL.hMax + 0.1),
    new THREE.MeshBasicMaterial({ map: scaleCv, transparent: true })
  );
  scaleBar.position.set(cx - CYL.r - 0.1, CYL.y0 + (CYL.hMax + 0.1) / 2 - 0.03, -CYL.r - 0.115);
  scaleBar.rotation.y = Math.PI * 0.08;
  grp.add(scaleBar);
  STN.scaleBar = scaleBar;

  /* 黄铜活塞：活塞体 + 两道橡胶密封圈 + 活塞杆 + 顶部轭架 */
  STN.piston = new THREE.Group();
  const pBody = cyl(CYL.r - 0.012, CYL.r - 0.012, 0.1, M(COL.brass, 0.32, 0.72), 30);
  const pFace = cyl(CYL.r - 0.012, CYL.r - 0.012, 0.012, M(COL.brassHi, 0.26, 0.7), 30);
  pFace.position.y = 0.055;
  STN.piston.add(pBody, pFace);
  for (const dy of [-0.03, 0.015]) {
    const seal = new THREE.Mesh(new THREE.TorusGeometry(CYL.r - 0.006, 0.011, 8, 30), M(COL.rubber, 0.9));
    seal.rotation.x = Math.PI / 2;
    seal.position.y = dy;
    STN.piston.add(seal);
  }
  STN.piston.add(buildKnurlBand(CYL.r - 0.012, 0.02, M(COL.brassDeep, 0.4, 0.6)));
  const rod = cyl(0.024, 0.024, 0.9, M(COL.chrome, 0.22, 0.9), 14);
  rod.position.y = 0.48;
  STN.piston.add(rod);
  const yoke = new THREE.Group();
  const yokeBar = box(0.3, 0.055, 0.09, M(0x49505a, 0.4, 0.7));
  const yokeBoss = cyl(0.05, 0.05, 0.09, M(0x49505a, 0.4, 0.7), 18);
  yokeBoss.rotation.x = Math.PI / 2;
  yoke.add(yokeBar, yokeBoss);
  yoke.position.y = 0.94;
  STN.piston.add(yoke);
  STN.yoke = yoke;
  grp.add(STN.piston);

  /* 丝杠 + 半螺母 + 手轮 + 红色拨杆/锁扣 */
  const screw = cyl(0.017, 0.017, 1.62, rodMat, 12);
  screw.position.set(cx, CYL.y0 + 1.9, 0);
  grp.add(screw);
  STN.screw = screw;
  /* 螺纹视觉：细环带（InstancedMesh 密排小环） */
  const threadGeo = new THREE.TorusGeometry(0.019, 0.0045, 5, 20);
  const threadMat = M(0x8b939b, 0.35, 0.85);
  const threads = new THREE.InstancedMesh(threadGeo, threadMat, 44);
  threads.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const dum = new THREE.Object3D();
  for (let i = 0; i < 44; i++) {
    dum.position.set(cx, CYL.y0 + 1.12 + i * 0.033, 0);
    dum.rotation.set(Math.PI / 2, 0, 0);
    dum.updateMatrix();
    threads.setMatrixAt(i, dum.matrix);
  }
  grp.add(threads);
  STN.threads = threads;

  /* 顶横梁支架 + 轴承座 */
  const bracket = new THREE.Group();
  for (const sx of [-1, 1]) {
    const col = box(0.06, 2.5, 0.06, M(0x44484e, 0.5, 0.6));
    col.position.set(cx + sx * 0.42, CYL.y0 + 1.25, -0.44);
    bracket.add(col);
  }
  const topBeam = box(0.96, 0.07, 0.1, M(0x44484e, 0.5, 0.6));
  topBeam.position.set(cx, CYL.y0 + 2.5, -0.44);
  bracket.add(topBeam);
  const bearSeat = cyl(0.055, 0.055, 0.1, M(0x6d747c, 0.35, 0.8), 18);
  bearSeat.rotation.x = Math.PI / 2;
  bearSeat.position.set(cx, CYL.y0 + 2.5, -0.36);
  bracket.add(bearSeat);
  grp.add(bracket);

  /* 手轮：轮辋 + 六辐条 + 轮毂 + 把手球，轴水平指向 +z，微仰便于观察 */
  STN.handwheel = new THREE.Group();
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.02, 10, 36), M(0x3f4650, 0.4, 0.7));
  const hub = cyl(0.045, 0.045, 0.07, M(0x565e68, 0.4, 0.75), 16);
  hub.rotation.x = Math.PI / 2;
  STN.handwheel.add(rim, hub);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU;
    const spoke = cyl(0.011, 0.011, 0.33, M(0x4a515b, 0.45, 0.65), 8);
    spoke.position.set(Math.cos(a) * 0.085, Math.sin(a) * 0.085, 0);
    spoke.rotation.z = a + Math.PI / 2;
    STN.handwheel.add(spoke);
  }
  const grip = new THREE.Mesh(new THREE.SphereGeometry(0.032, 12, 10), M(0x2e3236, 0.85));
  grip.position.set(0, 0.17, 0.03);
  STN.handwheel.add(grip);
  /* 隐形命中盘：射线拾取用（视觉不可见，扩大可点面积） */
  const hitDisc = new THREE.Mesh(
    new THREE.CircleGeometry(0.2, 20),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide })
  );
  hitDisc.position.z = 0.02;
  STN.handwheel.add(hitDisc);
  /* 滚花外缘 */
  const knurl = buildKnurlBand(0.17, 0.036, M(0x333a42, 0.5, 0.6));
  knurl.rotation.x = Math.PI / 2;
  knurl.position.z = 0;
  STN.handwheel.add(knurl);
  STN.handwheel.position.set(cx, CYL.y0 + 2.5, -0.3);
  grp.add(STN.handwheel);

  /* 半螺母（滑块）+ 红色拨杆 */
  STN.halfnut = new THREE.Group();
  const hnBody = box(0.09, 0.12, 0.11, M(0x5a626c, 0.42, 0.7));
  const hnGuide = box(0.14, 0.03, 0.13, M(0x3f4650, 0.5, 0.6));
  hnGuide.position.y = -0.075;
  STN.halfnut.add(hnBody, hnGuide);
  STN.stalkRed = new THREE.Group();
  const lrArm = box(0.02, 0.1, 0.02, M(0xb33a26, 0.5));
  lrArm.position.y = 0.05;
  const lrKnob = new THREE.Mesh(new THREE.SphereGeometry(0.018, 10, 8), M(0xd8442e, 0.5));
  lrKnob.position.y = 0.1;
  STN.stalkRed.add(lrArm, lrKnob);
  STN.stalkRed.position.set(0.055, 0.03, 0);
  STN.stalkRed.rotation.z = 0.9;         // 扳起 = 松开
  STN.halfnut.add(STN.stalkRed);
  STN.halfnut.position.set(cx, CYL.y0 + 1.62, 0);
  grp.add(STN.halfnut);

  /* 红色锁扣（顶部小夹钳，锁住时闭合咬住丝杠） */
  STN.lockCatch = new THREE.Group();
  const lcBody = box(0.1, 0.07, 0.08, M(0xb33a26, 0.55));
  const lcJaw = box(0.03, 0.05, 0.05, M(0x7a2418, 0.6));
  lcJaw.position.set(0, -0.05, 0);
  STN.lockCatch.add(lcBody, lcJaw);
  STN.lockCatch.position.set(cx + 0.09, CYL.y0 + 2.86, 0);
  STN.lockCatch.visible = false;
  grp.add(STN.lockCatch);

  updPiston(0);
}

/** 滚花环带（细齿 InstancedMesh，车削件观感；单 draw call） */
function buildKnurlBand(radius, width, mat) {
  const n = 26;
  const inst = new THREE.InstancedMesh(new THREE.BoxGeometry(0.008, width, 0.012), mat, n);
  const dum = new THREE.Object3D();
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    dum.position.set(Math.cos(a) * (radius + 0.004), 0, Math.sin(a) * (radius + 0.004));
    dum.rotation.set(0, -a, 0);
    dum.updateMatrix();
    inst.setMatrixAt(i, dum.matrix);
  }
  inst.instanceMatrix.needsUpdate = true;
  return inst;
}

/** 结霜纹理（白色冰晶噪声） */
function makeFrostTexture() {
  const S = 256;
  const cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = 'rgba(0,0,0,0)';
  ctx.clearRect(0, 0, S, S);
  for (let i = 0; i < 240; i++) {
    const x = Math.random() * S, y = Math.random() * S;
    const r = 1 + Math.random() * 2.6;
    const a = 0.16 + Math.random() * 0.4;
    ctx.fillStyle = `rgba(228,242,250,${a.toFixed(2)})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
  }
  for (let i = 0; i < 46; i++) {           // 冰晶羽毛
    const x = Math.random() * S, y = Math.random() * S;
    const len = 8 + Math.random() * 22;
    const ang = Math.random() * TAU;
    ctx.strokeStyle = `rgba(240,250,255,${(0.2 + Math.random() * 0.3).toFixed(2)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** 刻度条纹理：0..2.0 L 主刻度 + 0.25 细分 */
function makeScaleTexture() {
  const W = 64, H = 512;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = 'rgba(235,228,212,0.92)';
  ctx.beginPath();
  ctx.roundRect(0, 0, W, H, 8);
  ctx.fill();
  ctx.fillStyle = '#4a4038';
  ctx.fillRect(W - 14, 0, 4, H);
  ctx.font = '600 15px -apple-system, sans-serif';
  for (let v = 0; v <= 2.001; v += 0.25) {
    const y = H - 20 - (v / 2.0) * (H - 40);
    const major = Math.abs(v * 4 - Math.round(v * 4)) < 0.01;
    ctx.fillRect(W - 14 - (major ? 16 : 8), y - 1.5, major ? 16 : 8, 3);
    if (major) {
      ctx.textAlign = 'right';
      ctx.fillText(v.toFixed(1), W - 34, y + 5);
    }
  }
  ctx.save();
  ctx.translate(12, H / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.font = '600 17px -apple-system, sans-serif';
  ctx.fillStyle = '#8a5a2a';
  ctx.fillText('气柱高度 V / L', 0, 0);
  ctx.restore();
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** 数显窗绘制（设定温度 + 状态行） */
function drawHeaterDisplay(modeText, tempK, active) {
  if (!STN.dispTex) return;
  const cv = STN.dispTex.image;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#101418';
  ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.font = '700 44px "SF Mono", ui-monospace, monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = active ? '#ff9a4a' : '#3ddc84';
  ctx.fillText(tempK.toFixed(0).padStart(3, ' ') + ' K', 12, 40);
  ctx.font = '600 20px -apple-system, sans-serif';
  ctx.fillStyle = active ? '#ff9a4a' : '#8fa8b8';
  ctx.fillText(modeText, 12, 76);
  ctx.fillStyle = 'rgba(120,160,180,0.5)';
  ctx.textAlign = 'right';
  ctx.fillText('设定', cv.width - 10, 76);
  STN.dispTex.needsUpdate = true;
}

/* ---- 压力表 + 温度计（表盘 CanvasTexture + 铜管/探头连到气缸底部） ---- */

function buildGauges(g) {
  const cx = CYL.cx;
  const dialP = makeDialTexture(0, 400, 'kPa', '压强 p', 30);
  const gP = new THREE.Group();
  const caseP = cyl(0.14, 0.14, 0.06, M(COL.steelDark, 0.4, 0.7), 26);
  caseP.rotation.x = Math.PI / 2;
  const faceP = new THREE.Mesh(new THREE.CircleGeometry(0.125, 26), new THREE.MeshBasicMaterial({ map: dialP }));
  faceP.position.z = 0.032;
  const needleP = box(0.012, 0.115, 0.006, M(COL.redline, 0.5));
  needleP.geometry.translate(0, 0.05, 0);
  needleP.position.z = 0.04;
  const hubP = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.014, 10), M(0x333333, 0.5));
  hubP.rotation.x = Math.PI / 2;
  hubP.position.z = 0.042;
  const stemP = box(0.05, 0.24, 0.05, M(0x44484e, 0.5, 0.6));
  stemP.position.y = -0.19;
  gP.add(caseP, faceP, needleP, hubP, stemP);
  gP.position.set(cx + 0.95, 1.95, 0.28);
  gP.rotation.y = -0.5;
  g.add(gP);
  STN.needleP = needleP;
  /* 铜管：从表座弯到加热台侧面（CatmullRom 放样 TubeGeometry） */
  const tubeCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(cx + 0.95, 1.71, 0.28),
    new THREE.Vector3(cx + 0.95, 1.56, 0.3),
    new THREE.Vector3(cx + 0.72, 1.42, 0.32),
    new THREE.Vector3(cx + 0.5, 1.36, 0.3),
    new THREE.Vector3(cx + 0.34, 1.33, 0.18),
    new THREE.Vector3(cx + 0.3, 1.32, 0.05),
  ]);
  const tube = new THREE.Mesh(new THREE.TubeGeometry(tubeCurve, 40, 0.014, 8, false), M(COL.copper, 0.35, 0.85));
  g.add(tube);

  const dialT = makeDialTexture(-20, 120, '°C', '温度 t', 30);
  const gT = new THREE.Group();
  const caseT = cyl(0.13, 0.13, 0.055, M(0xf0e8d8, 0.45, 0.1), 26);
  caseT.rotation.x = Math.PI / 2;
  const faceT = new THREE.Mesh(new THREE.CircleGeometry(0.115, 26), new THREE.MeshBasicMaterial({ map: dialT }));
  faceT.position.z = 0.03;
  const needleT = box(0.01, 0.1, 0.005, M(0xc23a2a, 0.5));
  needleT.geometry.translate(0, 0.045, 0);
  needleT.position.z = 0.037;
  const hubT = hubP.clone();
  hubT.position.z = 0.039;
  const stemT = box(0.045, 0.2, 0.045, M(0xd8d0c0, 0.5, 0.15));
  stemT.position.y = -0.16;
  gT.add(caseT, faceT, needleT, hubT, stemT);
  gT.position.set(cx - 0.98, 1.9, 0.3);
  gT.rotation.y = 0.5;
  g.add(gT);
  STN.needleT = needleT;
  /* 探头毛细管：弯进气缸底部 */
  const probeCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(cx - 0.98, 1.66, 0.3),
    new THREE.Vector3(cx - 0.98, 1.5, 0.32),
    new THREE.Vector3(cx - 0.72, 1.38, 0.32),
    new THREE.Vector3(cx - 0.48, 1.34, 0.26),
    new THREE.Vector3(cx - 0.3, 1.34, 0.1),
    new THREE.Vector3(cx - 0.24, 1.33, 0),
  ]);
  const probe = new THREE.Mesh(new THREE.TubeGeometry(probeCurve, 40, 0.01, 8, false), M(0x9aa2aa, 0.4, 0.75));
  g.add(probe);
  updGauges();
}

/** 表盘纹理：起止值 + 单位 + 名称 + 刻度弧 */
function makeDialTexture(v0, v1, unit, name, step) {
  const S = 256;
  const cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#f4efe2';
  ctx.beginPath();
  ctx.arc(128, 128, 126, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#20242a';
  ctx.font = '600 20px -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(name, 128, 168);
  ctx.font = '500 16px -apple-system, sans-serif';
  ctx.fillStyle = '#5a6470';
  ctx.fillText(unit, 128, 192);
  const a0 = Math.PI * 0.78, a1 = Math.PI * 2.22;
  for (let v = v0; v <= v1 + 0.001; v += step / 2) {
    const t = (v - v0) / (v1 - v0);
    const a = a0 + (a1 - a0) * t;
    const major = Math.abs(v / step - Math.round(v / step)) < 0.01;
    const r1 = major ? 92 : 102, r2 = 112;
    ctx.strokeStyle = major ? '#20242a' : '#8a92a0';
    ctx.lineWidth = major ? 3 : 1.5;
    ctx.beginPath();
    ctx.moveTo(128 + Math.cos(a) * r1, 128 + Math.sin(a) * r1);
    ctx.lineTo(128 + Math.cos(a) * r2, 128 + Math.sin(a) * r2);
    ctx.stroke();
    if (major) {
      ctx.fillStyle = '#20242a';
      ctx.font = '600 17px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const lr = 74;
      ctx.fillText(String(Math.round(v)), 128 + Math.cos(a) * lr, 128 + Math.sin(a) * lr);
    }
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
function updGauges() {
  if (!STN.needleP) return;
  const p = G.pKPa();
  const pT = clamp(p / 400, 0, 1);
  STN.needleP.rotation.z = -(Math.PI * 0.78 + Math.PI * 1.44 * pT);
  const tC = G.T - 273.15;
  const tT = clamp((tC + 20) / 140, 0, 1);
  STN.needleT.rotation.z = -(Math.PI * 0.78 + Math.PI * 1.44 * tT);
}

/* ---- 控制台：斜面台 + 双屏幕 + 双推拉杆（LED 数显）+ 面板细节 ---- */

function buildConsole(g) {
  const grp = new THREE.Group();
  g.add(grp);
  STN.consoleG = grp;
  const cx0 = 1.0;
  /* 台体：斜面顶 + 立板 + 底座 */
  const base = box(1.7, 0.5, 0.72, M(0x33363c, 0.6, 0.25));
  base.position.set(cx0, 1.42, -0.08);
  grp.add(base);
  const slant = new THREE.Group();
  const slab = box(1.64, 0.06, 0.98, M(0x3e4248, 0.5, 0.35));
  slant.add(slab);
  const lip = box(1.64, 0.05, 0.08, M(0x2c3036, 0.55, 0.3));
  lip.position.set(0, -0.03, 0.47);
  slant.add(lip);
  slant.position.set(cx0, 1.72, -0.06);
  slant.rotation.x = -0.42;
  grp.add(slant);

  /* 双屏幕（嵌在斜面上） */
  STN.screenA = makeScreenMesh('p–V 图');
  STN.screenA.grp.position.set(cx0 - 0.42, 1.84, -0.22);
  STN.screenA.grp.rotation.x = -0.42;
  grp.add(STN.screenA.grp);
  STN.screenB = makeScreenMesh('速率分布');
  STN.screenB.grp.position.set(cx0 + 0.42, 1.84, -0.22);
  STN.screenB.grp.rotation.x = -0.42;
  grp.add(STN.screenB.grp);

  /* 双推拉杆：滑槽 + 握把 + LED 数显条 */
  STN.stalkL = buildLever(cx0 - 0.44, 'T');
  STN.stalkR = buildLever(cx0 + 0.44, 'V');
  grp.add(STN.stalkL.grp, STN.stalkR.grp);
  /* 面板小铭牌 */
  const plateTex = makeLabelTexture(['ThermoLab 控制台', '推拉杆 · 实时图线'], { w: 256, h: 72, lineSizes: [24, 15] });
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.105), new THREE.MeshBasicMaterial({ map: plateTex, transparent: false }));
  plate.position.set(cx0, 1.66, 0.42);
  plate.rotation.x = -0.42;
  grp.add(plate);
}

function makeScreenMesh(title) {
  const grp = new THREE.Group();
  const frame = box(0.78, 0.6, 0.045, M(0x23262b, 0.5, 0.35));
  const cv = document.createElement('canvas');
  cv.width = 512; cv.height = 384;
  const ctx = cv.getContext('2d');
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 0.54), new THREE.MeshBasicMaterial({ map: tex }));
  scr.position.z = 0.026;
  const t = lbl(title, '#ffcf9c', 0.0022);
  t.position.y = 0.36;
  grp.add(frame, scr, t);
  return { grp, canvas: cv, ctx, tex, screen: scr, titleSprite: t };
}

function buildLever(x0, kind) {
  const grp = new THREE.Group();
  const slot = box(0.05, 0.02, 0.5, M(0x171a1e, 0.6, 0.2));
  const slotFrame = box(0.11, 0.03, 0.56, M(0x3a3f45, 0.5, 0.3));
  slotFrame.position.y = -0.008;
  grp.add(slotFrame, slot);
  /* LED 数显条（槽侧） */
  const cv = document.createElement('canvas');
  cv.width = 128; cv.height = 48;
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  const led = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.06), new THREE.MeshBasicMaterial({ map: tex }));
  led.position.set(0.17, 0.012, 0.2);
  led.rotation.x = -0.42;
  grp.add(led);
  const handle = new THREE.Group();
  const stem = cyl(0.014, 0.014, 0.09, M(COL.steelDark, 0.35, 0.7), 10);
  const grip = cyl(0.026, 0.03, 0.1, M(0x2e3338, 0.75), 12);
  grip.position.y = 0.08;
  const capBall = new THREE.Mesh(new THREE.SphereGeometry(0.033, 12, 10), M(0xd8442e, 0.55));
  capBall.position.y = 0.15;
  handle.add(stem, grip, capBall);
  const hitBall = new THREE.Mesh(
    new THREE.SphereGeometry(0.055, 10, 8),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
  );
  hitBall.position.y = 0.08;
  handle.add(hitBall);
  handle.position.z = -0.12;
  grp.add(handle);
  grp.position.set(x0, 1.6, 0.13);
  grp.rotation.x = -0.42;
  return { grp, handle, tex, cv, kind, z: -0.12 };
}

function drawLED(lever, text) {
  if (!lever) return;
  const ctx = lever.cv.getContext('2d');
  ctx.fillStyle = '#0d1210';
  ctx.fillRect(0, 0, 128, 48);
  ctx.font = '700 30px "SF Mono", ui-monospace, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = lever.kind === 'T' ? '#ffb347' : '#69e8a0';
  ctx.fillText(text, 64, 26);
  lever.tex.needsUpdate = true;
}

/* ---- 台面道具阵列（场景叙事：气瓶/保温杯/记录本/标签） ---- */

function buildProps(g) {
  /* 氮气钢瓶（小样瓶，带标签） */
  const bottle = new THREE.Group();
  const bBody = cyl(0.075, 0.085, 0.3, M(0x3d6a52, 0.4, 0.5), 18);
  const bShoulder = new THREE.Mesh(new THREE.SphereGeometry(0.075, 18, 10, 0, TAU, 0, Math.PI / 2), M(0x3d6a52, 0.4, 0.5));
  bShoulder.position.y = 0.15;
  const bNeck = cyl(0.022, 0.03, 0.05, M(0x2e5240, 0.4, 0.5), 12);
  bNeck.position.y = 0.32;
  const bCap = cyl(0.026, 0.026, 0.03, M(0x8a929a, 0.4, 0.7), 12);
  bCap.position.y = 0.36;
  const bLabel = new THREE.Mesh(
    new THREE.PlaneGeometry(0.1, 0.075),
    new THREE.MeshBasicMaterial({ map: makeLabelTexture(['高纯氮气', 'N₂  99.99%'], { w: 128, h: 96, lineSizes: [20, 14] }) })
  );
  bLabel.position.set(0, 0.02, 0.088);
  bottle.add(bBody, bShoulder, bNeck, bCap, bLabel);
  bottle.position.set(-2.15, 1.32, 0.42);
  bottle.rotation.y = 0.5;
  g.add(bottle);
  { const sh = contactShadow(0.3, 0.3, 0.7); sh.position.set(-2.15, 1.23, 0.42); g.add(sh); }

  /* 保温杯 */
  const cup = new THREE.Group();
  const cBody = cyl(0.05, 0.055, 0.19, matSheen(0x9c3428, { clearcoat: 0.9, clearcoatRoughness: 0.2 }), 18);
  const cLip = cyl(0.048, 0.048, 0.015, M(COL.steelDark, 0.35, 0.7), 18);
  cLip.position.y = 0.1;
  cup.add(cBody, cLip);
  cup.position.set(-0.15, 1.31, 0.52);
  g.add(cup);

  /* 记录本 + 铅笔 */
  const book = box(0.28, 0.02, 0.2, M(0xe8e2d0, 0.85));
  book.position.set(0.16, 1.235, 0.4);
  book.rotation.y = -0.3;
  g.add(book);
  const pencil = cyl(0.006, 0.006, 0.16, M(0xd8a848, 0.7), 8);
  pencil.rotation.z = Math.PI / 2;
  pencil.rotation.y = 0.5;
  pencil.position.set(0.16, 1.252, 0.4);
  g.add(pencil);

  /* 后搁板道具：两摞资料 + 小盆栽 */
  const stack1 = box(0.3, 0.09, 0.22, M(0x6a6258, 0.8));
  stack1.position.set(1.55, 2.79, -6.4);
  g.add(stack1);
  const stack2 = box(0.26, 0.07, 0.2, M(0x7a7268, 0.8));
  stack2.position.set(2.25, 2.77, -6.4);
  g.add(stack2);
  const pot = cyl(0.05, 0.04, 0.08, M(0xa8613c, 0.8), 12);
  pot.position.set(-2.5, 3.17, -6.4);
  g.add(pot);
  for (let i = 0; i < 5; i++) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), M(0x4f8f3a, 0.7));
    leaf.scale.set(1, 0.5, 0.6);
    leaf.position.set(-2.5 + (Math.random() - 0.5) * 0.06, 3.24 + Math.random() * 0.05, -6.4 + (Math.random() - 0.5) * 0.05);
    g.add(leaf);
  }
}

/* ---- 部件标签（显示标签开关 + 导览高亮） ---- */

function buildTourHighlights(g) {
  const defs = [
    ['气缸', new THREE.Vector3(CYL.cx, CYL.y0 + CYL.hMax * 0.72, CYL.r + 0.1), new THREE.Vector3(CYL.cx, CYL.y0 + 0.7, 0)],
    ['活塞', new THREE.Vector3(CYL.cx + CYL.r + 0.16, 1.9, 0), new THREE.Vector3(CYL.cx, pistonY(), 0)],
    ['手轮与半螺母', new THREE.Vector3(CYL.cx + 0.4, CYL.y0 + 2.75, 0.15), new THREE.Vector3(CYL.cx, CYL.y0 + 2.5, -0.3)],
    ['加热 · 制冷台', new THREE.Vector3(CYL.cx + 0.62, 1.5, 0.35), new THREE.Vector3(CYL.cx, 1.3, 0.2)],
    ['压力表', new THREE.Vector3(CYL.cx + 1.25, 2.25, 0.5), new THREE.Vector3(CYL.cx + 0.95, 1.95, 0.28)],
    ['温度计', new THREE.Vector3(CYL.cx - 1.3, 2.2, 0.5), new THREE.Vector3(CYL.cx - 0.98, 1.9, 0.3)],
    ['屏幕', new THREE.Vector3(1.0, 2.35, 0.35), new THREE.Vector3(1.0, 1.86, -0.2)],
    ['推拉杆', new THREE.Vector3(1.44, 1.95, 0.55), new THREE.Vector3(1.0, 1.6, 0.14)],
  ];
  STN.labels = [];
  const labGroup = new THREE.Group();
  g.add(labGroup);
  for (const [name, labPos] of defs) {
    const sp = lbl(name, '#ffd9a8', 0.0028);
    sp.position.copy(labPos);
    labGroup.add(sp);
    STN.labels.push(sp);
  }
  STN.labelGroup = labGroup;
  setLabelsVisible(true);
  /* 高亮环（导览落点） */
  const hl = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.008, 8, 36), new THREE.MeshBasicMaterial({ color: 0xffb347, transparent: true, opacity: 0.9 }));
  hl.rotation.x = Math.PI / 2;
  hl.visible = false;
  g.add(hl);
  STN.highlight = hl;
}
function setLabelsVisible(v) {
  if (STN.labelGroup) STN.labelGroup.visible = v;
}
function highlightAt(pos) {
  if (!STN.highlight) return;
  if (!pos) { STN.highlight.visible = false; return; }
  STN.highlight.visible = true;
  STN.highlight.position.copy(pos);
  STN.highlight.position.y += 0.02;
}

/* ---- 分子（InstancedMesh）：速度场 + 壁面/活塞碰撞 + 冲量统计 ---- */

const NM_MAX = 220;
const mols = [];
for (let i = 0; i < NM_MAX; i++) mols.push({ p: new THREE.Vector3(), v: new THREE.Vector3() });
const MOL_R = 0.02;
let hitWindow = [];                 // 最近 1s（画面时间）的活塞撞击冲量
let hitCountWindow = [];
let simTime = 0;
const impulseCalib = { k: 1 };      // 冲量压强 ↔ pV=nRT 的标定系数

function resetMols() {
  const py = pistonY();
  mols.forEach((m) => {
    const a = Math.random() * TAU, rr = Math.sqrt(Math.random()) * (CYL.r - 0.05);
    m.p.set(CYL.cx + Math.cos(a) * rr, CYL.y0 + MOL_R + Math.random() * Math.max(py - CYL.y0 - 2 * MOL_R, 0.05), Math.sin(a) * rr);
    const th = Math.random() * TAU, ph = Math.acos(2 * Math.random() - 1);
    const sigma = 0.55 / 1.2533;
    const sp = sigma * Math.sqrt(-2 * Math.log(Math.max(Math.random(), 1e-6)));
    m.v.set(sp * Math.sin(ph) * Math.cos(th), sp * Math.cos(ph), sp * Math.sin(ph) * Math.sin(th));
  });
  hitWindow = [];
  hitCountWindow = [];
  simTime = 0;
  calibrateImpulse();
}
/** 冲量压强标定：在标定态做一次短采样，令 pImp(标定态) = pKPa(标定态)。
 *  pImp ∝ N·T（速率 ∝√T、频率 ∝√T），与 pV=nRT 的标度一致，单系数全量程成立。 */
let calibFrame = null;
function calibrateImpulse() {
  calibFrame = { samples: [], t0: simTime };
}
function moleculeColor(T) {
  const t = clamp((T - 120) / (600 - 120), 0, 1);
  const c = new THREE.Color(COL.molCool).lerp(new THREE.Color(COL.molHot), Math.pow(t, 0.85));
  return c;
}
const dummy = new THREE.Object3D();
const molColor = new THREE.Color();
function stepMols(dt) {
  const sdt = dt * (G.slow ? 0.22 : 1);
  simTime += sdt;
  const py = pistonY();
  const target = 0.55 * Math.sqrt(G.T / 300);
  let speedSum = 0;
  for (const m of mols) speedSum += m.v.length();
  const avg = speedSum / mols.length || 1;
  const k = clamp((target / avg - 1) * sdt * 1.5, -0.06, 0.06);
  const rMax = CYL.r - MOL_R - 0.004;
  let impulse = 0, hits = 0;
  for (const m of mols) {
    m.v.multiplyScalar(1 + k);
    m.p.addScaledVector(m.v, sdt * 1.7);
    const dx = m.p.x - CYL.cx, dz = m.p.z;
    const rr = Math.sqrt(dx * dx + dz * dz);
    if (rr > rMax) {
      const nx = dx / rr, nz = dz / rr;
      const dot = m.v.x * nx + m.v.z * nz;
      if (dot > 0) { m.v.x -= 2 * dot * nx; m.v.z -= 2 * dot * nz; }
      m.p.x = CYL.cx + nx * rMax;
      m.p.z = nz * rMax;
    }
    if (m.p.y < CYL.y0 + MOL_R) { m.p.y = CYL.y0 + MOL_R; if (m.v.y < 0) m.v.y *= -1; }
    if (m.p.y > py - MOL_R) {
      m.p.y = py - MOL_R;
      if (m.v.y > 0) { impulse += 2 * Math.abs(m.v.y); hits++; m.v.y *= -1; }
    }
  }
  hitWindow.push({ i: impulse, s: sdt, c: hits });
  {
    let span = 0;
    for (const e of hitWindow) span += e.s;
    while (span > 1.25 && hitWindow.length > 2) { span -= hitWindow[0].s; hitWindow.shift(); }
  }
  /* 冲量压强标定采样（首个 1.2s 窗口） */
  if (calibFrame) {
    calibFrame.samples.push(impulse);
    if (calibFrame.samples.length >= 72) {
      const sum = calibFrame.samples.reduce((a, b) => a + b, 0);
      const pRaw = (sum / calibFrame.samples.length) / (sdt || 1);
      impulseCalib.k = pRaw > 1e-9 ? G.pKPa() / pRaw : 1;
      calibFrame = null;
    }
  }
  /* 分子颜色随温度 */
  molColor.copy(moleculeColor(G.T));
  if (STN.molecules && STN.molecules.material.color.getHex() !== molColor.getHex()) {
    STN.molecules.material.color.copy(molColor);
    STN.molecules.material.emissive.copy(molColor).multiplyScalar(0.35);
  }
  /* 可视化（只显示前 N 个，其余缩为点） */
  const showN = Math.min(G.N, NM_MAX);
  for (let i = 0; i < NM_MAX; i++) {
    const m = mols[i];
    dummy.position.copy(m.p);
    dummy.scale.setScalar(i < showN ? 1 : 0.0001);
    dummy.updateMatrix();
    STN.molecules.setMatrixAt(i, dummy.matrix);
  }
  STN.molecules.instanceMatrix.needsUpdate = true;
  /* 布朗花粉颗粒 */
  if (STN.pollen.visible) {
    const t = performance.now() * 0.001;
    STN.pollen.position.set(
      CYL.cx + Math.sin(t * 1.7) * 0.12 + Math.sin(t * 5.3) * 0.04,
      CYL.y0 + 0.42 + Math.sin(t * 2.3) * 0.1 + Math.sin(t * 6.1) * 0.03,
      Math.cos(t * 1.9) * 0.12 + Math.cos(t * 4.7) * 0.04
    );
  }
}
function impactStats() {
  const n = hitWindow.length;
  if (n < 10) return { rate: null, pImp: null };
  let sumI = 0, sumC = 0, span = 0;
  for (const e of hitWindow) { sumI += e.i; sumC += e.c; span += e.s; }
  span = Math.max(span, 0.2);
  const area = Math.PI * CYL.r * CYL.r;
  const rate = sumC / span;
  const pImp = (sumI / span) * impulseCalib.k / area;
  return { rate, pImp };
}

function buildMolecules(g) {
  const geo = new THREE.SphereGeometry(MOL_R, 10, 8);
  const mat = new THREE.MeshStandardMaterial({ color: COL.molMid, roughness: 0.35, emissive: 0x974a10, emissiveIntensity: 0.4 });
  STN.molecules = new THREE.InstancedMesh(geo, mat, NM_MAX);
  STN.molecules.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  STN.molecules.frustumCulled = false;
  g.add(STN.molecules);
  STN.pollen = new THREE.Mesh(new THREE.SphereGeometry(0.06, 14, 10), matStd(0xd8cfa8, { roughness: 0.9 }));
  STN.pollen.position.set(CYL.cx, CYL.y0 + 0.4, 0);
  STN.pollen.visible = false;
  g.add(STN.pollen);
}

/* ---- 活塞 / 手轮 / 半螺母 / 推拉杆 联动 ---- */

let pistonLock = false;             // 查理/第一定律锁住
let leverMode = { L: 'T', R: 'V' }; // 本章两根杆的绑定（null = 本课题不用）
let animV = null;                   // { from, to, t, dur, wheelFrom, wheelTo } 手轮动画
let animT = null;

function updPiston(dt) {
  if (!STN.piston) return;
  STN.piston.position.set(CYL.cx, pistonY(), 0);
  STN.piston.visible = true;
  if (animV) {
    const k = easeIO(clamp(animV.t / animV.dur, 0, 1));
    const rot = animV.wheelFrom + (animV.wheelTo - animV.wheelFrom) * k;
    if (STN.handwheel) STN.handwheel.rotation.z = rot;
    if (STN.threads) STN.threads.rotation.y = -rot * 1.4;
  }
}
function updHalfnut() {
  if (!STN.halfnut) return;
  STN.halfnut.position.y = pistonY() + 0.52;
  /* 拨杆：锁住 = 水平啮合(0.15)；自由 = 扳起(0.9) */
  STN.stalkRed.rotation.z = pistonLock ? 0.12 : 0.9;
  STN.lockCatch.visible = pistonLock;
  STN.lockCatch.position.y = pistonY() + 1.18;
}

/* 手轮动画：把 V 平滑推到目标（拖动滑杆 / 预设按钮共用） */
function driveV(toV, dur = 1.2, onDone) {
  toV = clamp(toV, 0.2, 2.0);
  animV = {
    from: G.V, to: toV, t: 0, dur,
    wheelFrom: STN.handwheel ? STN.handwheel.rotation.z : 0,
    wheelTo: (STN.handwheel ? STN.handwheel.rotation.z : 0) + (toV - G.V) * 9,
    onDone,
  };
}
function driveT(toT, dur = 1.4, onDone) {
  animT = { from: G.T, to: clamp(toT, 120, 650), t: 0, dur, onDone };
}
function stepDrive(dt) {
  if (animV) {
    animV.t += dt;
    const k = easeIO(clamp(animV.t / animV.dur, 0, 1));
    G.V = animV.from + (animV.to - animV.from) * k;
    if (animV.t >= animV.dur) { const d = animV.onDone; animV = null; G.V = animV ? G.V : clamp(G.V, 0.2, 2.0); if (d) d(); }
    syncGasUI();
  }
  if (animT) {
    animT.t += dt;
    const k = easeIO(clamp(animT.t / animT.dur, 0, 1));
    G.T = animT.from + (animT.to - animT.from) * k;
    if (animT.t >= animT.dur) { const d = animT.onDone; animT = null; G.T = clamp(G.T, 120, 650); if (d) d(); }
    syncGasUI();
  }
}

/** 台面交互：射线拾取手轮/推拉杆 → 拖拽改 V/T（与滑杆双向同步） */
let dragTarget = null;
let dragStartY = 0;
let dragStartVal = 0;
function bindStageDrag() {
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const pickables = () => {
    const list = [];
    if (STN.handwheel && (leverMode.R === 'V' || leverMode.L === 'V')) list.push(STN.handwheel);
    if (STN.stalkL) list.push(STN.stalkL.grp);
    if (STN.stalkR) list.push(STN.stalkR.grp);
    return list;
  };
  function hitType(e) {
    const rect = app.renderer.domElement.getBoundingClientRect();
    ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObjects(pickables(), true);
    if (!hits.length) return null;
    let o = hits[0].object;
    while (o) {
      if (o === STN.handwheel) return 'wheel';
      if (STN.stalkL && o === STN.stalkL.grp) return 'stalkL';
      if (STN.stalkR && o === STN.stalkR.grp) return 'stalkR';
      o = o.parent;
    }
    return null;
  }
  app.renderer.domElement.addEventListener('pointerdown', (e) => {
    const t = hitType(e);
    if (!t) return;
    if (t === 'stalkL' && !leverMode.L) { toast('这个课题不用这只推杆。'); return; }
    if (t === 'stalkR' && !leverMode.R) { toast('这个课题不用这只推杆。'); return; }
    if (t === 'wheel' && pistonLock) { toast('活塞被红色锁扣锁住了，先松开。'); return; }
    dragTarget = t;
    dragStartY = e.clientY;
    dragStartVal = (t === 'wheel' || t === 'stalkR') ? G.V : null;
    if (t === 'stalkL') dragStartValT = G.T;
    controls.enabled = false;
    sfx.thump();
    e.preventDefault();
  });
  window.addEventListener('pointermove', (e) => {
    if (!dragTarget) return;
    const dy = (dragStartY - e.clientY) / 260;      // 上推 = 增
    if (dragTarget === 'wheel') {
      const nv = clamp(dragStartVal + dy * 1.4, 0.2, 2.0);
      if (Math.abs(nv - G.V) > 0.003) { G.V = nv; onManualGasChange(); }
    } else if (dragTarget === 'stalkL') {
      if (leverMode.L !== 'T') { toast('这个课题不用这只推杆。'); dragTarget = null; controls.enabled = true; return; }
      const nt = clamp(dragStartValT + dy * 320, 120, 650);
      G.T = nt;
      onManualGasChange();
    } else if (dragTarget === 'stalkR') {
      if (leverMode.R !== 'V') { toast('这个课题不用这只推杆。'); dragTarget = null; return; }
      const nv = clamp(dragStartVal + dy * 1.4, 0.2, 2.0);
      if (Math.abs(nv - G.V) > 0.003) { G.V = nv; onManualGasChange(); }
    }
  });
  let dragStartValT = 0;
  const _pd = app.renderer.domElement.addEventListener.bind(app.renderer.domElement);
  window.addEventListener('pointerup', () => { if (dragTarget) { dragTarget = null; sfx.thump(); } });
  /* 温度杆按下时记录初值（借 pointerdown 的 dragStartVal 通道） */
  app.renderer.domElement.addEventListener('pointerdown', (e) => {
    /* 与上一监听共享：stalkL 拖拽以 dragStartValT 记初值 */
    const rect = app.renderer.domElement.getBoundingClientRect();
    ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObjects(pickables(), true);
    if (hits.length) dragStartValT = G.T;
  }, true);
}
let dragStartValT_ = 0;

/* ---- 气体状态 UI 同步 ---- */

let gasUiHook = null;   // 本章额外的读数刷新钩子（滑杆/拖拽/动画共用）
const sliderN = { ref: null };
const sliderT = { ref: null };
const sliderV = { ref: null };
function syncGasUI() {
  updPiston();
  updHalfnut();
  updGauges();
  if (sliderN.ref) sliderN.ref.set(G.N);
  if (sliderT.ref) sliderT.ref.set(G.T);
  if (sliderV.ref) sliderV.ref.set(G.V);
  drawLED(STN.stalkL, G.T.toFixed(0));
  drawLED(STN.stalkR, G.V.toFixed(2));
  drawHeaterDisplay(heaterState(), G.T, heaterActive);
  if (gasUiHook) gasUiHook();
}
function heaterState() {
  if (heaterActive === 'heat') return '加热中';
  if (heaterActive === 'cool') return '制冷中';
  return '恒温';
}
let heaterActive = null;            // 'heat' | 'cool' | null（加热台开关）
let bathMode = null;                // 'bath' | 'insulate' | null（第一定律容器）
function stepHeater(dt) {
  let coilI = 0, frostO = 0;
  if (heaterActive === 'heat') {
    G.T = Math.min(G.T + dt * 30, 650);
    coilI = 1.4 + Math.sin(performance.now() * 0.004) * 0.25;
    frostO = 0;
    syncGasUI();
  } else if (heaterActive === 'cool') {
    G.T = Math.max(G.T - dt * 30, 220);
    coilI = 0;
    frostO = Math.min(frostO + dt * 1.5, 0.85);
    syncGasUI();
  } else {
    frostO = 0;
  }
  if (STN.heaterMat[0]) STN.heaterMat[0].emissiveIntensity = coilI;
  if (STN.frost) STN.frost.material.opacity = frostO;
  /* 恒温水浴：温度向 300 缓慢回拉（第一定律章用） */
  if (bathMode === 'bath' && !animT) {
    G.T += (300 - G.T) * Math.min(dt * 0.8, 1);
  }
}

/* ---------------- 屏幕绘图库（LCD 深底，全章共用） ---------------- */

const SCR = { W: 512, H: 384, x0: 58, y0: 330, w: 424, h: 268 };
const ACC = '#ff9b5e';
const GRID = '#3d4a58';
const TXT = '#9aa8b4';
const VAL = '#c9d6e2';

function scrClear(ctx, title) {
  ctx.clearRect(0, 0, SCR.W, SCR.H);
  ctx.fillStyle = '#161b21';
  ctx.fillRect(0, 0, SCR.W, SCR.H);
  /* 扫描线质感 */
  ctx.fillStyle = 'rgba(255,255,255,0.015)';
  for (let y = 0; y < SCR.H; y += 4) ctx.fillRect(0, y, SCR.W, 1);
  if (title) {
    ctx.fillStyle = '#7f92a2';
    ctx.font = '600 20px -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(title, 14, 26);
  }
}
function scrAxes(ctx, xl, yl, ymax = 1) {
  ctx.strokeStyle = '#55606a';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(SCR.x0, SCR.y0 - SCR.h);
  ctx.lineTo(SCR.x0, SCR.y0);
  ctx.lineTo(SCR.x0 + SCR.w, SCR.y0);
  ctx.stroke();
  ctx.fillStyle = TXT;
  ctx.font = '16px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(xl, SCR.x0 + SCR.w, SCR.y0 + 24);
  ctx.textAlign = 'left';
  ctx.fillText(yl, SCR.x0 + 6, SCR.y0 - SCR.h - 8);
}
const vX = (v) => SCR.x0 + (v / 2.3) * SCR.w;
const pY = (p) => SCR.y0 - (clamp(p, 0, 520) / 520) * SCR.h;
const tX = (T) => SCR.x0 + ((T - 60) / 620) * SCR.w;
function dot(ctx, x, y, r = 6, color = ACC) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
}
function poly(ctx, pts, color, width = 2.4, dash = null) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  if (dash) ctx.setLineDash(dash);
  ctx.beginPath();
  pts.forEach((q, i) => { if (i === 0) ctx.moveTo(q[0], q[1]); else ctx.lineTo(q[0], q[1]); });
  ctx.stroke();
  ctx.setLineDash([]);
}
function isothermPts(n, T, v0 = 0.22, v1 = 2.25) {
  const pts = [];
  for (let i = 0; i <= 60; i++) {
    const v = v0 + (i / 60) * (v1 - v0);
    pts.push([vX(v), pY(KV(n, T, v))]);
  }
  return pts;
}

/* ---- 屏 A：p–V（模式：plain/trace/boyle/isobar/isochor/carnot/otto） ---- */

let tracePath = [];          // 第一定律过程轨迹 {v, p}
let traceLabel = '';
function drawScreenA(mode) {
  if (!STN.screenA) return;
  const { ctx } = STN.screenA;
  const n = G.nMol();
  scrClear(ctx, '压强–体积  p–V');
  scrAxes(ctx, 'V/L', 'p/kPa');
  /* 当前温度等温线（淡参考） */
  poly(ctx, isothermPts(n, G.T), GRID, 1.5, [4, 5]);
  if (mode === 'boyle') {
    poly(ctx, isothermPts(n, G.T), ACC, 2.5);
    ctx.fillStyle = VAL;
    ctx.font = '15px sans-serif';
    ctx.fillText('等温线 T = ' + G.T.toFixed(0) + ' K（双曲线）', SCR.x0 + 90, 52);
    ctx.fillText('pV = ' + (G.pKPa() * G.V).toFixed(0) + ' kPa·L', SCR.x0 + 90, 74);
    for (const q of HIST.pts) {
      dot(ctx, vX(q.V), pY(q.p), 5, '#6fb3e0');
      ctx.fillStyle = '#8fc2e8';
      ctx.font = '13px sans-serif';
      ctx.fillText((q.V * q.p).toFixed(0), vX(q.V) + 8, pY(q.p) - 8);
    }
  } else if (mode === 'trace') {
    if (tracePath.length > 1) {
      poly(ctx, tracePath.map((q) => [vX(q.v), pY(q.p)]), ACC, 2.6);
      const L = tracePath[0], R0 = tracePath[tracePath.length - 1];
      ctx.fillStyle = VAL;
      ctx.font = '15px sans-serif';
      ctx.fillText(traceLabel, SCR.x0 + 80, 52);
      dot(ctx, vX(R0.v), pY(R0.p), 6);
    }
    ctx.fillStyle = TXT;
    ctx.font = '14px sans-serif';
    ctx.fillText('过程轨迹：' + (traceLabel || '等待操作'), SCR.x0 + 80, 74);
  } else if (mode === 'isobar') {
    const p = G.pKPa();
    poly(ctx, [[vX(0.22), pY(p)], [vX(2.25), pY(p)]], ACC, 2.5);
    ctx.fillStyle = VAL;
    ctx.font = '15px sans-serif';
    ctx.fillText('p = ' + p.toFixed(0) + ' kPa（恒定）', SCR.x0 + 100, pY(p) - 10);
  } else if (mode === 'isochor') {
    poly(ctx, [[vX(G.V), SCR.y0], [vX(G.V), pY(510)]], ACC, 2.5);
    ctx.fillStyle = VAL;
    ctx.font = '15px sans-serif';
    ctx.fillText('V = ' + G.V.toFixed(2) + ' L（恒定）', vX(G.V) + 8, 120);
  } else if (mode === 'carnot') {
    drawCarnotLoop(ctx, n);
  } else if (mode === 'otto') {
    drawOttoLoop(ctx, ENG.cr, (ENG.theta * 180 / Math.PI) % 720, '#c9d6e2');
  }
  dot(ctx, vX(G.V), pY(G.pKPa()));
  STN.screenA.tex.needsUpdate = true;
}

/* ---- 卡诺循环（屏 A + 读数） ---- */

const CAR = { T1: 600, T2: 300, t: 0, speed: 0.24, animate: true, segNow: 0 };
function carnotPts() {
  const n = G.nMol();
  const VA = 0.5, VB = 1.35;
  const ratio = Math.pow(CAR.T1 / Math.max(CAR.T2, 120), 1.5);
  const VC = Math.min(VB * ratio, 2.18), VD = Math.min(VA * ratio, 2.18);
  const P = (T, v) => KV(n, T, v);
  return {
    A: { v: VA, p: P(CAR.T1, VA) }, B: { v: VB, p: P(CAR.T1, VB) },
    C: { v: VC, p: P(CAR.T2, VC) }, D: { v: VD, p: P(CAR.T2, VD) },
    VA, VB, VC, VD,
  };
}
function carnotState(t) {
  const n = G.nMol();
  const { VA, VB, VC, VD } = carnotPts();
  const seg = (t * 4) % 4;
  const adT = (T0, v0, v) => T0 * Math.pow(v0 / v, 2 / 3);
  CAR.segNow = Math.floor(seg);
  if (seg < 1) { const v = VA + (VB - VA) * seg; return { v, p: KV(n, CAR.T1, v) }; }
  if (seg < 2) { const v = VB + (VC - VB) * (seg - 1); return { v, p: KV(n, adT(CAR.T1, VB, v), v) }; }
  if (seg < 3) { const v = VC + (VD - VC) * (seg - 2); return { v, p: KV(n, CAR.T2, v) }; }
  const v = VD + (VA - VD) * (seg - 3);
  return { v, p: KV(n, adT(CAR.T2, VD, v), v) };
}
const CARNOT_SEG = [
  { name: '① 等温膨胀', desc: '接高温热源 · 等温膨胀', color: '#e8a15e' },
  { name: '② 绝热膨胀', desc: '绝热 · 绝热膨胀', color: '#6fb3e0' },
  { name: '③ 等温压缩', desc: '接低温热源 · 等温压缩', color: '#5ec8a8' },
  { name: '④ 绝热压缩', desc: '绝热 · 绝热压缩', color: '#8f8fd0' },
];
function drawCarnotLoop(ctx, n) {
  const { A, B, C, D } = carnotPts();
  const isoT = (T, v0, v1, color) => {
    const pts = [];
    for (let i = 0; i <= 30; i++) { const v = v0 + (v1 - v0) * i / 30; pts.push([vX(v), pY(KV(n, T, v))]); }
    poly(ctx, pts, color, 2.2);
  };
  const adiabat = (T0, v0, v1, color) => {
    const pts = [];
    for (let i = 0; i <= 30; i++) {
      const v = v0 + (v1 - v0) * i / 30;
      const T = T0 * Math.pow(v0 / v, 2 / 3);
      pts.push([vX(v), pY(KV(n, T, v))]);
    }
    poly(ctx, pts, color, 2.2);
  };
  CARNOT_SEG.forEach((s, i) => {
    if (i === 0) isoT(CAR.T1, A.v, B.v, s.color);
    else if (i === 1) adiabat(CAR.T1, B.v, C.v, s.color);
    else if (i === 2) isoT(CAR.T2, C.v, D.v, s.color);
    else adiabat(CAR.T2, D.v, A.v, s.color);
  });
  /* 当前段高亮标签 */
  const pt = carnotState(CAR.t);
  dot(ctx, vX(pt.v), pY(pt.p), 7);
  const seg = CARNOT_SEG[CAR.segNow];
  ctx.fillStyle = seg.color;
  ctx.font = '600 17px sans-serif';
  ctx.fillText(seg.name, SCR.x0 + 96, 54);
  ctx.fillStyle = VAL;
  ctx.font = '16px sans-serif';
  ctx.fillText('η卡诺 = 1 − T₂/T₁ = ' + ((1 - CAR.T2 / CAR.T1) * 100).toFixed(0) + '%', SCR.x0 + 96, 78);
}

/* ---- 奥托循环（屏 A，发动机章） ---- */

function ottoPts(cr, k = 0.4) {
  /* 示意：A(吸气末) → B(压缩末) → C(点火后) → D(做功末) → A */
  const V1 = 1.9, V2 = V1 / cr;
  const pA = 95;
  const pB = pA * Math.pow(cr, k + 0.2);
  const pC = pB * 3.1;
  const pD = pC / Math.pow(cr, k + 0.2);
  return { V1, V2, pA, pB, pC, pD };
}
function ottoAdiabatPts(v0, v1, p0, k) {
  const pts = [];
  for (let i = 0; i <= 26; i++) {
    const v = v0 + (v1 - v0) * i / 26;
    const p = p0 * Math.pow(v0 / v, k + 0.2);
    pts.push([vX(v), pY(p)]);
  }
  return pts;
}
function drawOttoLoop(ctx, cr, thetaDeg, loopColor = ACC) {
  const { V1, V2, pA, pB, pC, pD } = ottoPts(cr);
  poly(ctx, ottoAdiabatPts(V1, V2, pA, 0.4), '#8f8fd0', 2);        // 压缩
  poly(ctx, [[vX(V2), pY(pB)], [vX(V2), pY(pC)]], '#e8a15e', 2);   // 等容吸热
  poly(ctx, ottoAdiabatPts(V2, V1, pC, 0.4), '#6fb3e0', 2);        // 膨胀
  poly(ctx, [[vX(V1), pY(pD)], [vX(V1), pY(pA)]], '#5ec8a8', 2);   // 等容放热
  /* 运行点 */
  const deg = ((thetaDeg % 720) + 720) % 720;
  let q;
  const k = 0.4;
  if (deg < 180) { const v = V1 + (V2 - V1) * deg / 180; q = { v, p: pA * Math.pow(V1 / v, k) }; }
  else if (deg < 200) { const t2 = (deg - 180) / 20; q = { v: V2, p: pB + (pC - pB) * t2 }; }
  else if (deg < 540) { const v = V2 + (V1 - V2) * (deg - 200) / 340; q = { v, p: pC * Math.pow(V2 / v, k) }; }
  else { const t2 = (deg - 540) / 180; q = { v: V1, p: pD + (pA - pD) * t2 }; }
  dot(ctx, vX(q.v), pY(q.p), 6, '#ffd166');
  const eta = 1 - 1 / Math.pow(cr, 0.4);
  ctx.fillStyle = VAL;
  ctx.font = '16px sans-serif';
  ctx.fillText('奥托循环（r = ' + cr.toFixed(1) + ' : 1）', SCR.x0 + 96, 54);
  ctx.fillText('理想效率 η = 1 − 1/r^(γ−1) = ' + (eta * 100).toFixed(0) + '%', SCR.x0 + 96, 78);
}

/* ---- 屏 B 各模式 ---- */

function drawScreenB(mode) {
  if (!STN.screenB) return;
  const { ctx } = STN.screenB;
  if (mode === 'vt' || mode === 'pt') {
    const isV = mode === 'vt';
    scrClear(ctx, isV ? '体积–温度  V–T（等压）' : '压强–温度  p–T（等容）');
    ctx.strokeStyle = '#55606a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(SCR.x0, SCR.y0 - SCR.h);
    ctx.lineTo(SCR.x0, SCR.y0);
    ctx.lineTo(SCR.x0 + SCR.w, SCR.y0);
    ctx.stroke();
    /* −273.15 °C 原点延长线提示 */
    ctx.strokeStyle = GRID;
    ctx.setLineDash([3, 5]);
    ctx.beginPath();
    ctx.moveTo(tX(0), SCR.y0);
    ctx.lineTo(tX(0), SCR.y0 - SCR.h * 0.55);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = TXT;
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('−273.15 °C', tX(0), SCR.y0 + 22);
    ctx.textAlign = 'left';
    ctx.fillText('T/K', SCR.x0 + SCR.w - 36, SCR.y0 + 24);
    ctx.fillText(isV ? 'V/L' : 'p/kPa', SCR.x0 + 6, SCR.y0 - SCR.h - 8);
    const T0 = HIST.T0 || 300;
    const valNow = isV ? G.V : G.pKPa();
    const valMax = isV ? 2.05 : 520;
    const yOf = (val) => SCR.y0 - (clamp(val, 0, valMax) / valMax) * SCR.h;
    /* 过原点直线（T=0 → 现在） */
    poly(ctx, [[tX(0), yOf(0)], [tX(Math.max(G.T, 90)), yOf(valNow)]], ACC, 2.5);
    /* T₀ 参考态 */
    const val0 = isV ? (HIST.V0 || G.V) * T0 / Math.max(G.T, 90) : G.pKPa() * T0 / Math.max(G.T, 90);
    dot(ctx, tX(T0), yOf(val0), 5, '#6fb3e0');
    ctx.fillStyle = '#8fc2e8';
    ctx.font = '14px sans-serif';
    ctx.fillText('T₀ = ' + T0.toFixed(0) + ' K', tX(T0) + 8, yOf(val0) + 18);
    dot(ctx, tX(G.T), yOf(valNow));
    for (const q of HIST.pts) {
      dot(ctx, tX(q.T), yOf(isV ? q.V : q.p), 4, '#6fb3e0');
    }
    ctx.fillStyle = VAL;
    ctx.font = '15px sans-serif';
    ctx.fillText(isV
      ? 'V/T = 常量（过原点的直线）'
      : 'p/T = 常量 · 定容气体温度计原理', SCR.x0 + 84, 48);
    if (!isV) {
      ctx.fillStyle = TXT;
      ctx.font = '14px sans-serif';
      ctx.fillText('热力学温度 T = t + 273.15 K', SCR.x0 + 84, 70);
    }
    STN.screenB.tex.needsUpdate = true;
    return;
  }
  if (mode === 'p1v') {
    scrClear(ctx, '压强–体积的倒数  p–1/V');
    scrAxes(ctx, '1/V（L⁻¹）', 'p/kPa');
    const ivMax = 5.0;
    const ivX = (iv) => SCR.x0 + (iv / ivMax) * SCR.w;
    const n = G.nMol();
    poly(ctx, (() => {
      const pts = [];
      for (let i = 0; i <= 50; i++) {
        const v = 0.24 + (i / 50) * 1.9;
        pts.push([ivX(1 / v), pY(KV(n, G.T, v))]);
      }
      return pts;
    })(), ACC, 2.5);
    for (const q of HIST.pts) {
      dot(ctx, ivX(1 / q.V), pY(q.p), 5, '#6fb3e0');
    }
    ctx.fillStyle = VAL;
    ctx.font = '15px sans-serif';
    ctx.fillText('化曲为直：p 与 1/V 成正比', SCR.x0 + 90, 50);
    ctx.fillStyle = TXT;
    ctx.font = '14px sans-serif';
    ctx.fillText('温度越高等温线斜率越大', SCR.x0 + 90, 70);
    STN.screenB.tex.needsUpdate = true;
    return;
  }
  if (mode === 'dist') {
    scrClear(ctx, '分子速率分布（麦克斯韦分布）');
    scrAxes(ctx, 'v/(m·s⁻¹)', '分子数占比');
    const vp = Math.sqrt(2 * 1.38e-23 * G.T / (4.65e-26));
    const curve = (T, color, dash) => {
      const vpk = Math.sqrt(2 * 1.38e-23 * T / (4.65e-26));
      const pts = [];
      for (let i = 0; i <= 80; i++) {
        const v = (i / 80) * 900;
        const x = v / vpk;
        const f = x * x * Math.exp(-x * x);
        pts.push([SCR.x0 + (v / 900) * SCR.w, SCR.y0 - f * SCR.h * 0.92]);
      }
      poly(ctx, pts, color, 2.4, dash ? [5, 5] : null);
      return vpk;
    };
    if (HIST.T0 && Math.abs(HIST.T0 - G.T) > 1) curve(HIST.T0, '#4f7fa8', true);
    curve(G.T, ACC, false);
    /* 实际分子直方图 */
    const bins = new Array(15).fill(0);
    const showN = Math.min(G.N, NM_MAX);
    for (let i = 0; i < showN; i++) {
      const sp = mols[i].v.length() / 0.55;
      const vPhys = sp * vp;
      const bi = Math.min(14, Math.floor(vPhys / 900 * 15));
      bins[bi]++;
    }
    const mx = Math.max(...bins, 1);
    ctx.fillStyle = 'rgba(255,155,94,0.4)';
    bins.forEach((b, i) => {
      const bw = SCR.w / 15;
      const hgt = (b / mx) * SCR.h * 0.85;
      ctx.fillRect(SCR.x0 + i * bw + 1, SCR.y0 - hgt, bw - 2, hgt);
    });
    ctx.fillStyle = VAL;
    ctx.font = '15px sans-serif';
    let vsum = 0;
    for (let i = 0; i < showN; i++) vsum += mols[i].v.length() / 0.55 * vp;
    ctx.fillText('平均 ' + (showN ? vsum / showN : 0).toFixed(0) + ' m/s　最概然 ' + vp.toFixed(0) + ' m/s（T = ' + G.T.toFixed(0) + ' K）', 44, 60);
    ctx.fillStyle = TXT;
    ctx.font = '14px sans-serif';
    ctx.fillText('温度越高 → 曲线变矮变宽、峰值右移', 64, 82);
    STN.screenB.tex.needsUpdate = true;
    return;
  }
  if (mode === 'impact') {
    scrClear(ctx, '撞击计数（活塞底面）');
    const { rate, pImp } = impactStats();
    const pTh = G.pKPa();
    ctx.font = '600 22px sans-serif';
    ctx.fillStyle = VAL;
    ctx.fillText(G.N + ' 个分子（数密度 n = N/V）', 40, 66);
    ctx.font = '500 18px sans-serif';
    ctx.fillStyle = TXT;
    ctx.fillText('每秒撞击活塞 ' + (rate === null ? '采样中…' : rate.toFixed(0) + ' 次/秒（画面时间）'), 40, 108);
    /* 双压强对比条 */
    const bar = (label, val, color, y) => {
      ctx.font = '500 17px sans-serif';
      ctx.fillStyle = TXT;
      ctx.fillText(label, 40, y);
      const w = clamp((val || 0) / 420, 0.02, 1) * 330;
      ctx.fillStyle = color;
      ctx.fillRect(40, y + 10, w, 18);
      ctx.fillStyle = VAL;
      ctx.font = '600 17px sans-serif';
      ctx.fillText((val === null ? '…' : val.toFixed(1)) + ' kPa', 46 + w, y + 25);
    };
    bar('由撞击冲量算出的压强', pImp, '#ff9b5e', 168);
    bar('由 pV = nRT 算出的压强', pTh, '#69b3d8', 240);
    ctx.fillStyle = TXT;
    ctx.font = '14px sans-serif';
    ctx.fillText('两把尺子量同一个 p：压强取决于分子的数密度和平均动能', 40, 330);
    STN.screenB.tex.needsUpdate = true;
    return;
  }
  if (mode === 'ledger') {
    scrClear(ctx, '能量账本（本过程累计）');
    const rows = [
      ['Q 吸热', FL.accumQ, '#ff9b5e'],
      ['W 外界做功', FL.accumW, '#69b3d8'],
      ['ΔU = Q + W', FL.accumQ + FL.accumW, '#9fe870'],
    ];
    rows.forEach(([label, v, color], i) => {
      const y = 74 + i * 76;
      ctx.font = '500 18px sans-serif';
      ctx.fillStyle = TXT;
      ctx.fillText(label, 40, y);
      const wMax = 300;
      const w = clamp(Math.abs(v) / 40, 0.005, 1) * wMax * (v >= 0 ? 1 : 0.45);
      const x0 = v >= 0 ? 150 : 150 - w;
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.75;
      ctx.fillRect(x0, y - 22, Math.max(w, 2), 30);
      ctx.globalAlpha = 1;
      ctx.fillStyle = VAL;
      ctx.font = '600 19px sans-serif';
      ctx.fillText((v >= 0 ? '+' : '') + v.toFixed(1) + ' kJ', 470, y - 2);
    });
    ctx.fillStyle = TXT;
    ctx.font = '14px sans-serif';
    ctx.fillText('Q > 0 吸热　W > 0 外界对气体做功（能量守恒）', 40, 330);
    STN.screenB.tex.needsUpdate = true;
    return;
  }
  if (mode === 'carnot4') {
    scrClear(ctx, '卡诺循环 · 能量流');
    const eta = 1 - CAR.T2 / CAR.T1;
    const q1 = 100;                       // 归一化吸热
    const w = q1 * eta;
    const q2 = q1 - w;
    /* 能量流条 */
    ctx.font = '500 18px sans-serif';
    ctx.fillStyle = TXT;
    ctx.fillText('W = Q₁ − Q₂（每循环）', 40, 60);
    const y0 = 100, H2 = 34, W0 = 380, X0 = 56;
    ctx.fillStyle = '#e8a15e';
    ctx.fillRect(X0, y0, W0, H2);
    ctx.fillStyle = '#9fe870';
    ctx.fillRect(X0, y0, W0 * eta, H2);
    ctx.strokeStyle = '#20262c';
    ctx.strokeRect(X0, y0, W0, H2);
    ctx.fillStyle = '#14231a';
    ctx.font = '600 17px sans-serif';
    ctx.fillText('W 净功 ' + w.toFixed(0), X0 + W0 * eta / 2, y0 + 23);
    ctx.fillStyle = VAL;
    ctx.font = '600 16px sans-serif';
    ctx.fillText('Q₁ 吸热 ' + q1.toFixed(0), X0, y0 - 10);
    ctx.fillStyle = '#6fb3e0';
    ctx.fillText('Q₂ 放热 ' + q2.toFixed(0), X0 + W0 * eta + 12, y0 + H2 + 24);
    ctx.font = '500 17px sans-serif';
    ctx.fillStyle = VAL;
    ctx.fillText('效率 ' + (eta * 100).toFixed(1) + '%', 40, 236);
    ctx.fillStyle = TXT;
    ctx.font = '14px sans-serif';
    ctx.fillText('第 ' + (CAR.segNow + 1) + ' 段：' + CARNOT_SEG[CAR.segNow].desc, 40, 268);
    ctx.fillText('上限与工质无关：η = 1 − T₂/T₁，永远 < 100%', 40, 330);
    STN.screenB.tex.needsUpdate = true;
    return;
  }
  if (mode === 'torque') {
    scrClear(ctx, '转矩：单缸 vs V8');
    scrAxes(ctx, '曲轴角/°', '转矩/N·m');
    const xOf = (deg) => SCR.x0 + (deg / 720) * SCR.w;
    const yOfT = (t) => SCR.y0 - clamp(t, 0, 1.15) * (SCR.h - 20);
    /* 单缸转矩（做功冲程大脉冲 + 压缩负脉冲），×8 归一 */
    const single = [];
    for (let i = 0; i <= 120; i++) {
      const deg = i * 6;
      single.push([xOf(deg), yOfT(singleTorque(deg) )]);
    }
    poly(ctx, single, ACC, 2.2);
    const v8 = [];
    for (let i = 0; i <= 120; i++) {
      const deg = i * 6;
      let s = 0;
      for (const ph of V8_FIRE_PHASE) s += singleTorque(((deg - ph) % 720 + 720) % 720);
      v8.push([xOf(deg), yOfT(s)]);
    }
    poly(ctx, v8, '#69b3d8', 2.2);
    ctx.fillStyle = ACC;
    ctx.font = '15px sans-serif';
    ctx.fillText('— 单缸（×8，同样的平均转矩）', SCR.x0 + 96, 52);
    ctx.fillStyle = '#69b3d8';
    ctx.fillText('— 赛车 V8', SCR.x0 + 320, 52);
    ctx.fillStyle = VAL;
    ctx.font = '600 16px sans-serif';
    ctx.fillText('平均 ' + ENG.avgTorque.toFixed(1) + ' N·m', SCR.x0 + 96, 76);
    ctx.fillStyle = TXT;
    ctx.font = '14px sans-serif';
    ctx.fillText('单缸大起大落靠飞轮硬撑；V8 每 90° 一次点火，几乎一条直线', 30, 330);
    STN.screenB.tex.needsUpdate = true;
    return;
  }
  if (mode === 'otto-info') {
    scrClear(ctx, '四冲程汽油机 · 实时读数');
    const eta = 1 - 1 / Math.pow(ENG.cr, 0.4);
    const deg = ((ENG.theta * 180 / Math.PI) % 720 + 720) % 720;
    const st = engStage(deg);
    ctx.font = '500 18px sans-serif';
    const line = (label, val, y, color = VAL) => {
      ctx.fillStyle = TXT;
      ctx.fillText(label, 40, y);
      ctx.fillStyle = color;
      ctx.font = '600 18px sans-serif';
      ctx.fillText(val, 250, y);
      ctx.font = '500 18px sans-serif';
    };
    line('当前冲程', st.name + '（' + st.valve + '）', 64, st.name.includes('做功') ? '#ffb347' : VAL);
    line('曲轴转角', deg.toFixed(0) + '°（一循环 720°）', 100);
    line('压缩比', ENG.cr.toFixed(1) + ' : 1', 136);
    line('每个循环净功', ENG.netWork.toFixed(0) + ' J', 172);
    line('理想效率 η = 1 − 1/r^(γ−1)', (eta * 100).toFixed(0) + '%', 208);
    line('1 号缸压强', engCyl1Pressure(deg).toFixed(0) + ' kPa', 244);
    line('1 号缸温度', engCyl1Temp(deg).toFixed(0) + ' K', 280);
    ctx.fillStyle = TXT;
    ctx.font = '14px sans-serif';
    ctx.fillText('发火顺序 1-8-4-3-6-5-7-2 · 每转 90° 点火一次', 40, 330);
    STN.screenB.tex.needsUpdate = true;
    return;
  }
  if (mode === 'tt') {
    scrClear(ctx, '压缩引火 · 筒内温度');
    const pts = IGN.curve.map((q, i) => [SCR.x0 + (i / Math.max(IGN.curve.length - 1, 1)) * SCR.w, SCR.y0 - clamp(q.T / 900, 0, 1) * (SCR.h - 30)]);
    if (pts.length > 1) poly(ctx, pts, ACC, 2.5);
    /* 着火线 */
    poly(ctx, [[SCR.x0, SCR.y0 - (460 / 900) * (SCR.h - 30)], [SCR.x0 + SCR.w, SCR.y0 - (460 / 900) * (SCR.h - 30)]], '#ff5a4a', 1.5, [5, 5]);
    ctx.fillStyle = '#ff8a7a';
    ctx.font = '14px sans-serif';
    ctx.fillText('硝化棉着火点', SCR.x0 + SCR.w - 128, SCR.y0 - (460 / 900) * (SCR.h - 30) - 8);
    ctx.fillStyle = TXT;
    ctx.font = '15px sans-serif';
    ctx.fillText('温度–时间（下压过程）', SCR.x0 + 96, 56);
    ctx.fillStyle = VAL;
    ctx.font = '600 18px sans-serif';
    ctx.fillText('最高 ' + IGN.maxT.toFixed(0) + ' K' + (IGN.burnt ? ' · 已燃烧' : IGN.tried ? ' · 未到着火点' : ''), 60, 84);
    ctx.fillStyle = TXT;
    ctx.font = '14px sans-serif';
    ctx.fillText('迅速压下：来不及散热 → 内能增加温度骤升；缓慢压下：一边做功一边散热', 34, 330);
    STN.screenB.tex.needsUpdate = true;
    return;
  }
  if (mode === 'bottle') {
    scrClear(ctx, '瓶塞跳起 · 瓶内状态');
    const yOf = (v, max) => SCR.y0 - clamp(v / max, 0, 1) * (SCR.h - 30);
    /* 压强历史 */
    const pts = BOT.hist.map((q, i) => [SCR.x0 + (i / Math.max(BOT.hist.length - 1, 1)) * SCR.w, yOf(q.p, 320)]);
    if (pts.length > 1) poly(ctx, pts, '#69b3d8', 2.4);
    dot(ctx, SCR.x0 + SCR.w - 4, yOf(BOT.p, 320), 5);
    ctx.fillStyle = VAL;
    ctx.font = '600 18px sans-serif';
    ctx.fillText('瓶内压强 ' + BOT.p.toFixed(0) + ' kPa　瓶内温度 ' + BOT.T.toFixed(0) + ' K', 40, 58);
    ctx.fillStyle = TXT;
    ctx.font = '15px sans-serif';
    ctx.fillText('打气次数 ' + BOT.pumps + '（跳起阈值 ≈ 210 kPa）', 40, 86);
    ctx.fillStyle = BOT.popped ? '#ffb347' : TXT;
    ctx.font = BOT.popped ? '600 17px sans-serif' : '500 15px sans-serif';
    ctx.fillText(BOT.popped
      ? '塞子已跳起：气体膨胀对外做功 → 内能减少温度降低 → 水汽液化成白雾'
      : '继续打气，压强升到阈值塞子就会跳起', 40, 330);
    STN.screenB.tex.needsUpdate = true;
    return;
  }
  if (mode === 'temp2') {
    scrClear(ctx, '两块铜块的温度');
    const yOf = (T) => SCR.y0 - clamp((T - 260) / 340, 0, 1) * (SCR.h - 40);
    const ptsH = [], ptsC = [];
    CU.hist.forEach((q, i) => {
      const x = SCR.x0 + (i / Math.max(CU.hist.length - 1, 1)) * SCR.w;
      ptsH.push([x, yOf(q.Th)]);
      ptsC.push([x, yOf(q.Tc)]);
    });
    if (ptsH.length > 1) { poly(ctx, ptsH, '#ff7a4a', 2.4); poly(ctx, ptsC, '#6fb3e0', 2.4); }
    ctx.fillStyle = '#ff7a4a';
    ctx.font = '15px sans-serif';
    ctx.fillText('— 热块 ' + CU.Th.toFixed(1) + ' K', SCR.x0 + 110, 60);
    ctx.fillStyle = '#6fb3e0';
    ctx.fillText('— 冷块 ' + CU.Tc.toFixed(1) + ' K', SCR.x0 + 260, 60);
    ctx.fillStyle = TXT;
    ctx.font = '14px sans-serif';
    ctx.fillText(CU.rewinding
      ? '倒放：冷的越来越冷、热的越来越热——能量守恒并不禁止它，但它不会自发发生'
      : '热量自发地从高温物体传到低温物体 · 总内能保持不变', 40, 330);
    STN.screenB.tex.needsUpdate = true;
    return;
  }
  /* 缺省：温度–时间示意（备用） */
  scrClear(ctx, '温度–时间');
  scrAxes(ctx, 't/s', 'T/K');
  STN.screenB.tex.needsUpdate = true;
}

/* ---------------- 共享状态对象 ---------------- */

const HIST = { T0: 300, V0: 1.0, pts: [] };
const FL = { Q: 10, W: 0, accumQ: 0, accumW: 0, anim: null };

/* ---------------- 四冲程汽油机（独立场景：单缸剖面 / 赛车 V8） ---------------- */

const ENG = {
  theta: 0, rpm: 90, running: false, cr: 10, sound: false, engine: 'single',
  avgTorque: 62, netWork: 620, slowMo: 1, fireQueue: -1, strokeStep: -1,
};
/** 单缸转矩形状（720° 一循环，做功冲程 0..180° 正脉冲，压缩 -90..0 负脉冲） */
function singleTorque(deg) {
  const d = ((deg % 720) + 720) % 720;
  if (d < 180) return 1.0 * Math.sin(Math.PI * d / 180);
  if (d > 540 && d <= 630) return -0.22 * Math.sin(Math.PI * (d - 540) / 90);
  return 0.02;
}
/** V8 发火相位（1-8-4-3-6-5-7-2，每 90° 一次） */
const V8_FIRE_PHASE = [0, 630, 270, 180, 360, 450, 540, 90];   // 缸 i 在此角度点火
function engStage(deg) {
  if (deg < 180) return { name: '① 吸气', valve: '进气门开', idx: 0 };
  if (deg < 360) return { name: '② 压缩', valve: '两门全闭', idx: 1 };
  if (deg < 540) return { name: '③ 做功', valve: '点火·两门全闭', idx: 2 };
  return { name: '④ 排气', valve: '排气门开', idx: 3 };
}
const STROKE_TEXT = [
  '<b>吸气冲程</b>　进气门打开，活塞下行，吸入汽油和空气的混合物。',
  '<b>压缩冲程</b>　两个气门关闭，活塞上行压缩混合物：机械能转化为内能，温度升高。',
  '<b>做功冲程</b>　火花塞点火，燃气猛烈膨胀推动活塞下行：内能转化为机械能。',
  '<b>排气冲程</b>　排气门打开，活塞上行把废气排出。',
];
function engCyl1Pressure(deg) {
  const { V1, V2, pA, pB, pC, pD } = ottoPts(ENG.cr);
  if (deg < 180) { const v = V1 + (V2 - V1) * deg / 180; return pA * Math.pow(V1 / v, 0.4); }
  if (deg < 200) return pB + (pC - pB) * (deg - 180) / 20;
  if (deg < 540) { const v = V2 + (V1 - V2) * (deg - 200) / 340; return pC * Math.pow(V2 / v, 0.4); }
  return pD + (pA - pD) * (deg - 540) / 180;
}
function engCyl1Temp(deg) {
  const { V1, V2 } = ottoPts(ENG.cr);
  if (deg < 180) return 340 * Math.pow(V1 / (V1 + (V2 - V1) * deg / 180), 0.4);
  if (deg < 200) return 780 + 1900 * (deg - 180) / 20;
  if (deg < 540) { const v = V2 + (V1 - V2) * (deg - 200) / 340; return 2680 * Math.pow(V2 / v, 0.4); }
  return 940 - 600 * (deg - 540) / 180;
}

/* ---- 单缸剖面建模 ---- */

const EG = {};       // 单缸部件引用
function buildEngine(g) {
  setWorkshopLight(0.35);
  /* 展示台座 */
  const pedestal = cyl(0.95, 1.05, 0.16, M(0x37332e, 0.7, 0.2), 30);
  pedestal.position.set(0, 0.1, 0);
  g.add(pedestal);
  { const sh = contactShadow(2.4, 2.4, 0.8); sh.position.set(0, 0.012, 0); g.add(sh); }
  const column = cyl(0.16, 0.22, 0.72, M(0x44484e, 0.55, 0.5), 20);
  column.position.set(0, 0.5, 0);
  g.add(column);

  const engG = new THREE.Group();
  engG.position.set(0, 1.02, 0);
  g.add(engG);
  EG.root = engG;

  const bore = 0.36;
  EG.bore = bore;
  /* 曲轴箱（下半剖视：外壳 + 剖切面封板） */
  const crankY = 0.24;
  EG.crankY = crankY;
  const crankcase = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.5, 0.62, 28, 1, false, Math.PI * 0.48, Math.PI * 1.04), M(COL.engBlock, 0.5, 0.55));
  crankcase.position.set(0, crankY, 0);
  engG.add(crankcase);
  const cutFace = box(0.09, 0.64, 0.9, M(0x565c64, 0.42, 0.6));
  cutFace.position.set(0.0, crankY, 0);
  engG.add(cutFace);
  /* 油底壳 */
  const pan = box(0.5, 0.16, 0.62, M(0x3c4046, 0.6, 0.4));
  pan.position.set(0, crankY - 0.4, 0);
  engG.add(pan);
  /* 缸体水套（半剖玻璃缸套 + 金属背壳 + 散热鳍） */
  const cylTop = crankY + 0.98;
  EG.cylTop = cylTop;
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(bore, bore, 0.78, 26, 1, true, Math.PI * 0.12, Math.PI * 1.76), matGlassLite(COL.glass, { opacity: 0.22 }));
  glass.position.set(0, crankY + 0.55, 0);
  engG.add(glass);
  const wallSolid = new THREE.Mesh(new THREE.CylinderGeometry(bore + 0.035, bore + 0.035, 0.78, 26, 1, true, Math.PI * 0.88, Math.PI * 0.24), M(COL.engBlock, 0.48, 0.6));
  wallSolid.position.copy(glass.position);
  engG.add(wallSolid);
  for (let i = 0; i < 9; i++) {
    const fin = new THREE.Mesh(new THREE.TorusGeometry(bore + 0.045, 0.02, 6, 26), M(0x565c64, 0.5, 0.55));
    fin.rotation.x = Math.PI / 2;
    fin.position.set(0, crankY + 0.3 + i * 0.082, 0);
    engG.add(fin);
  }
  /* 缸盖 + 燃烧室顶 + 火花塞 + 进排气道 */
  const head = box(0.86, 0.16, 0.62, M(COL.engHead, 0.45, 0.55));
  head.position.set(0, cylTop + 0.02, 0);
  engG.add(head);
  const valveMat = M(0xb8bec6, 0.3, 0.85);
  function buildValve(dx, color) {
    const vg = new THREE.Group();
    const stem = cyl(0.014, 0.014, 0.3, valveMat, 8);
    stem.position.y = 0.15;
    const discM = cyl(0.078, 0.06, 0.026, valveMat, 16);
    discM.position.y = 0.005;
    /* 气门弹簧（螺旋管） */
    const springCurve = [];
    for (let i = 0; i <= 60; i++) {
      const t = i / 60;
      springCurve.push(new THREE.Vector3(Math.cos(t * TAU * 5) * 0.034, 0.06 + t * 0.17, Math.sin(t * TAU * 5) * 0.034));
    }
    const spring = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(springCurve), 90, 0.007, 6, false), M(color, 0.5, 0.5));
    spring.position.y = 0.1;
    vg.add(stem, discM, spring);
    vg.position.set(dx, cylTop + 0.06, 0);
    engG.add(vg);
    return vg;
  }
  EG.valveIn = buildValve(-0.15, 0x8fa2b8);
  EG.valveEx = buildValve(0.15, 0xc07a50);
  /* 进排气道口 */
  const portIn = cyl(0.05, 0.05, 0.16, M(0x8fa2b8, 0.5, 0.4), 12);
  portIn.rotation.z = Math.PI / 2;
  portIn.position.set(-0.5, cylTop + 0.09, 0);
  const portEx = cyl(0.05, 0.05, 0.16, M(0xc07a50, 0.55, 0.35), 12);
  portEx.rotation.z = Math.PI / 2;
  portEx.position.set(0.5, cylTop + 0.09, 0);
  engG.add(portIn, portEx);
  /* 火花塞 */
  const plug = cyl(0.026, 0.026, 0.2, M(0xe8e2d4, 0.35, 0.2), 12);
  plug.position.set(0, cylTop + 0.18, 0);
  const plugTip = cyl(0.012, 0.012, 0.06, M(0xd8d8dc, 0.3, 0.8), 8);
  plugTip.position.set(0, cylTop + 0.07, 0);
  engG.add(plug, plugTip);
  EG.spark = glowSprite(0.3, '255,240,200');
  EG.spark.material.opacity = 0;
  EG.spark.position.set(0, cylTop + 0.02, 0);
  engG.add(EG.spark);

  /* 活塞 + 活塞环 + 活塞销 */
  EG.piston = new THREE.Group();
  const pBody = cyl(bore - 0.016, bore - 0.016, 0.24, M(COL.pistonAlu, 0.32, 0.75), 26);
  const pCrown = cyl(bore - 0.016, bore - 0.016, 0.014, M(0xe2e6ea, 0.28, 0.7), 26);
  pCrown.position.y = 0.126;
  EG.piston.add(pBody, pCrown);
  for (let i = 0; i < 2; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(bore - 0.01, 0.008, 6, 26), M(0x3a3f44, 0.6));
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.09 - i * 0.055;
    EG.piston.add(ring);
  }
  const skirtCut = box(bore * 1.2, 0.1, bore * 1.2, M(0x101418, 0.9));
  skirtCut.position.y = -0.17;
  EG.piston.add(skirtCut);
  engG.add(EG.piston);

  /* 连杆（工字杆身 + 大小端孔） */
  EG.rod = new THREE.Group();
  const rodShaft = box(0.055, 0.5, 0.036, M(0x9aa1a8, 0.35, 0.7));
  rodShaft.position.y = 0.22;
  const rodSmall = cyl(0.032, 0.032, 0.05, M(0x9aa1a8, 0.35, 0.7), 14);
  const rodBig = cyl(0.05, 0.05, 0.055, M(0x8a9198, 0.35, 0.7), 16);
  rodBig.position.y = -0.03;
  EG.rod.add(rodShaft, rodSmall, rodBig);
  engG.add(EG.rod);

  /* 曲轴：主轴颈 + 曲柄臂 + 配重 + 连杆轴颈 */
  EG.crank = new THREE.Group();
  const mainJ = cyl(0.055, 0.055, 0.7, M(COL.crank, 0.4, 0.7), 16);
  mainJ.rotation.x = Math.PI / 2;
  const armA = box(0.075, 0.3, 0.09, M(COL.crank, 0.45, 0.65));
  armA.position.y = 0.12;
  const armB = box(0.075, 0.14, 0.12, M(0x565c64, 0.5, 0.6));
  armB.position.y = -0.14;
  const throwPin = cyl(0.045, 0.045, 0.12, M(0x9aa1a8, 0.35, 0.75), 14);
  throwPin.rotation.x = Math.PI / 2;
  throwPin.position.y = 0.22;
  EG.crank.add(mainJ, armA, armB, throwPin);
  EG.crank.position.set(0, crankY, 0);
  engG.add(EG.crank);

  /* 飞轮（轮缘 + 齿圈 InstancedMesh） */
  EG.flywheel = new THREE.Group();
  const fwDisc = cyl(0.34, 0.34, 0.045, M(COL.flywheel, 0.5, 0.6), 36);
  fwDisc.rotation.x = Math.PI / 2;
  const fwHub = cyl(0.08, 0.08, 0.06, M(0x6a7078, 0.45, 0.6), 16);
  fwHub.rotation.x = Math.PI / 2;
  EG.flywheel.add(fwDisc, fwHub);
  const teeth = new THREE.InstancedMesh(new THREE.BoxGeometry(0.02, 0.028, 0.05), M(0x6a7078, 0.5, 0.6), 40);
  const dum = new THREE.Object3D();
  for (let i = 0; i < 40; i++) {
    const a = (i / 40) * TAU;
    dum.position.set(Math.cos(a) * 0.355, Math.sin(a) * 0.355, 0);
    dum.rotation.set(0, 0, a + Math.PI / 2);
    dum.updateMatrix();
    teeth.setMatrixAt(i, dum.matrix);
  }
  EG.flywheel.add(teeth);
  EG.flywheel.position.set(0, crankY, -0.44);
  engG.add(EG.flywheel);

  /* 燃烧粒子 */
  EG.burst = [];
  for (let i = 0; i < 24; i++) {
    const s = glowSprite(0.09, '255,150,60');
    s.material.opacity = 0;
    engG.add(s);
    EG.burst.push(s);
  }
  engKin(0);
  computeEngStats();
}

function engKin(theta) {
  const r = 0.15, L = 0.42;
  const th = theta;
  const py = EG.crankY + r * Math.cos(th) + Math.sqrt(L * L - (r * Math.sin(th)) ** 2) + 0.17;
  EG.piston.position.set(0, py, 0);
  const pinY = EG.crankY + r * Math.cos(th);
  const pinX = r * Math.sin(th);
  EG.rod.position.set(pinX * 0.5, (py - 0.14 + pinY) / 2, 0);
  EG.rod.rotation.z = Math.atan2(pinY - (py - 0.14), pinX) - Math.PI / 2 + Math.PI;
  EG.crank.rotation.z = th;
  EG.flywheel.rotation.z = -th;
}

/* ---- 赛车 V8 建模：两排各 4 缸（90° 夹角）+ 横平面曲轴 + 进气总管/排气歧管 ---- */

const V8 = {};
const V8_BANK = Math.PI / 4;        // 45° 半夹角 → 两排夹角 90°
const V8_THROW_PHASE = [0, Math.PI / 2, Math.PI * 1.5, Math.PI];   // 4 个曲柄相位（横平面）
function buildV8(g) {
  setWorkshopLight(0.35);
  const pedestal = cyl(1.1, 1.2, 0.16, M(0x37332e, 0.7, 0.2), 30);
  pedestal.position.set(0, 0.1, 0);
  g.add(pedestal);
  { const sh = contactShadow(2.8, 2.4, 0.8); sh.position.set(0, 0.012, 0); g.add(sh); }
  const stand = box(1.5, 0.3, 0.7, M(0x44484e, 0.6, 0.4));
  stand.position.set(0, 0.42, 0);
  g.add(stand);

  const root = new THREE.Group();
  root.position.set(0, 1.16, 0);
  g.add(root);
  V8.root = root;

  /* 曲轴：主轴线 + 4 个互成 90° 的曲柄 */
  const crankG = new THREE.Group();
  const mainLine = cyl(0.05, 0.05, 1.7, M(COL.crank, 0.4, 0.7), 14);
  mainLine.rotation.x = Math.PI / 2;
  crankG.add(mainLine);
  V8.throws = [];
  for (let j = 0; j < 4; j++) {
    const ph = V8_THROW_PHASE[j];
    const tG = new THREE.Group();
    const armA = box(0.09, 0.3, 0.05, M(COL.crank, 0.45, 0.65));
    armA.position.y = 0.13;
    armA.rotation.z = ph;
    const armB = box(0.09, 0.3, 0.05, M(COL.crank, 0.45, 0.65));
    armB.position.y = 0.13;
    armB.rotation.z = ph + Math.PI;
    const cw1 = cyl(0.09, 0.075, 0.05, M(0x565c64, 0.5, 0.6), 18);
    cw1.rotation.x = Math.PI / 2;
    cw1.rotation.z = ph + Math.PI;
    cw1.position.set(Math.cos(ph + Math.PI) * 0.13, Math.sin(ph + Math.PI) * 0.13, 0);
    const pin = cyl(0.042, 0.042, 0.62, M(0x9aa1a8, 0.35, 0.75), 12);
    pin.rotation.x = Math.PI / 2;
    pin.position.set(Math.cos(ph) * 0.19, Math.sin(ph) * 0.19, 0);
    tG.add(armA, armB, cw1, pin);
    const x = -0.63 + j * 0.42;
    tG.position.set(x, 0, 0);
    crankG.add(tG);
    V8.throws.push({ g: tG, ph, x });
  }
  /* 飞轮 + 曲轴带轮 */
  const fw = cyl(0.3, 0.3, 0.05, M(COL.flywheel, 0.5, 0.6), 32);
  fw.rotation.x = Math.PI / 2;
  fw.position.set(0.95, 0, 0);
  const pulley = cyl(0.14, 0.14, 0.06, M(0x6a7078, 0.45, 0.6), 20);
  pulley.rotation.x = Math.PI / 2;
  pulley.position.set(-0.95, 0, 0);
  crankG.add(fw, pulley);
  root.add(crankG);
  V8.crank = crankG;

  /* 两排气缸排（bank sign ±1，与竖直方向成 45°） */
  V8.cyls = [];
  const bankSigns = [1, -1];
  const glassBank = matGlassLite(COL.glass, { opacity: 0.2 });
  bankSigns.forEach((sign, bi) => {
    for (let ci = 0; ci < 4; ci++) {
      const cg = new THREE.Group();
      /* 缸筒：半剖玻璃 + 金属背壳，沿 bank 轴向放置 */
      const len = 0.66;
      const glassC = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, len, 20, 1, true), glassBank);
      const solidC = new THREE.Mesh(new THREE.CylinderGeometry(0.185, 0.185, len, 20, 1, true, Math.PI * 0.85, Math.PI * 0.3), M(COL.engPaint, 0.42, 0.3));
      glassC.position.y = 0.6;
      solidC.position.y = 0.6;
      cg.add(glassC, solidC);
      /* 缸体连接块（缸筒底 → 曲轴箱） */
      const skirt = box(0.3, 0.34, 0.26, M(COL.engPaint, 0.45, 0.3));
      skirt.position.set(0, 0.16, 0);
      cg.add(skirt);
      /* 缸盖小件 + 火花塞 */
      const hc = box(0.34, 0.08, 0.3, M(COL.engHead, 0.45, 0.55));
      hc.position.y = 0.79;
      cg.add(hc);
      const plugC = cyl(0.018, 0.018, 0.1, M(0xe8e2d4, 0.35, 0.2), 8);
      plugC.position.y = 0.87;
      cg.add(plugC);
      const sparkC = glowSprite(0.14, '255,240,200');
      sparkC.material.opacity = 0;
      sparkC.position.y = 0.78;
      cg.add(sparkC);
      /* 活塞 */
      const pg = new THREE.Group();
      const pb = cyl(0.128, 0.128, 0.16, M(COL.pistonAlu, 0.32, 0.75), 20);
      const ringC = new THREE.Mesh(new THREE.TorusGeometry(0.132, 0.006, 6, 20), M(0x3a3f44, 0.6));
      ringC.rotation.x = Math.PI / 2;
      ringC.position.y = 0.06;
      pg.add(pb, ringC);
      cg.add(pg);
      /* 连杆 */
      const rg = box(0.04, 0.34, 0.026, M(0x9aa1a8, 0.35, 0.7));
      rg.position.y = 0.17;
      cg.add(rg);
      /* bank 轴向：绕 z 轴旋转 sign*45° */
      cg.rotation.z = sign * V8_BANK;
      /* 缸位：沿曲轴 x 排布，对到对应曲柄 throw */
      const throwIdx = ci % 4;
      const tx = V8.throws[throwIdx].x;
      cg.position.set(tx + sign * 0.02, 0, sign * 0.16);
      root.add(cg);
      /* 全局缸号（1-8）：右排(+) 1,3,5,7 → ci 0..3；左排(−) 2,4,6,8 */
      const cylNo = bi === 0 ? ci * 2 + 1 : ci * 2 + 2;
      V8.cyls.push({ cg, pg, rg, spark: sparkC, sign, throwIdx, cylNo, firePhase: V8_FIRE_PHASE[cylNo - 1] });
    }
  });

  /* V 谷缸体（两排斜置缸体块 + 曲轴箱壳 + 油底壳） */
  const crankBox = box(1.62, 0.4, 0.6, M(COL.engBlock, 0.5, 0.5));
  crankBox.position.set(0, 0.06, 0);
  root.add(crankBox);
  for (const sign of [1, -1]) {
    const bankBlock = box(1.58, 0.6, 0.36, M(COL.engPaint, 0.45, 0.3));
    bankBlock.rotation.z = sign * V8_BANK;
    const off = new THREE.Vector3(0, 0.42, 0).applyAxisAngle(new THREE.Vector3(0, 0, 1), sign * V8_BANK);
    bankBlock.position.set(off.x, off.y, sign * 0.1);
    root.add(bankBlock);
  }
  /* 进气总管（顶置腔 + 8 根进气歧管接到各缸盖） + 排气歧管（两侧 4 出 1） */
  const plenum = box(1.5, 0.16, 0.32, M(COL.intake, 0.4, 0.45));
  plenum.position.set(0, 1.22, 0);
  root.add(plenum);
  for (const c of V8.cyls) {
    /* 缸盖世界位：local(0,0.98,0) 绕 z 转 bank 角 + 缸位平移 */
    const rot = c.sign * V8_BANK;
    const headLocal = new THREE.Vector3(0, 0.98, 0).applyAxisAngle(new THREE.Vector3(0, 0, 1), rot);
    const headW = new THREE.Vector3(c.cg.position.x + headLocal.x, headLocal.y, c.cg.position.z + headLocal.z);
    const runnerCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(c.cg.position.x, 1.16, 0),
      new THREE.Vector3((c.cg.position.x + headW.x) / 2, 1.1, (headW.z) * 0.6),
      new THREE.Vector3(headW.x, headW.y + 0.04, headW.z),
    ]);
    const runner = new THREE.Mesh(new THREE.TubeGeometry(runnerCurve, 20, 0.032, 8, false), M(COL.intake, 0.45, 0.4));
    root.add(runner);
    const headerCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(headW.x * 0.92, headW.y - 0.18, c.sign * 0.3),
      new THREE.Vector3(c.cg.position.x * 0.7, 0.42, c.sign * 0.4),
      new THREE.Vector3(c.cg.position.x * 0.3, 0.3, c.sign * 0.44),
      new THREE.Vector3(c.sign * -0.5, 0.26, c.sign * 0.46),
    ]);
    const header = new THREE.Mesh(new THREE.TubeGeometry(headerCurve, 24, 0.03, 8, false), M(COL.exhaust, 0.5, 0.5));
    root.add(header);
  }
  /* 油底壳 */
  const pan8 = box(1.66, 0.3, 0.52, M(0x3c4046, 0.6, 0.4));
  pan8.position.set(0, -0.32, 0);
  root.add(pan8);
  /* 缸号贴纸 */
  for (const c of V8.cyls) {
    const no = lbl(String(c.cylNo), '#ffd9a8', 0.0022);
    no.position.set(0, 0.74, 0.17);
    c.cg.add(no);
    c.label = no;
  }
  v8Kin(ENG.theta);
  computeEngStats();
}

function v8Kin(theta) {
  V8.crank.rotation.x = theta;
  for (const c of V8.cyls) {
    const t = V8.throws[c.throwIdx];
    const th = theta + t.ph;
    const r = 0.19, L = 0.42;
    /* 缸轴方向 = bank 轴向（绕 z 转 sign*45°）。活塞沿轴向外滑动：位置 = f(throw 相位) */
    const travel = r * Math.cos(th) + Math.sqrt(L * L - (r * Math.sin(th)) ** 2);
    c.pg.position.y = 0.36 + travel;
    c.rg.position.y = (0.36 + travel - 0.05 + Math.cos(th) * r) / 2 + 0.02;
  }
}

/** 发动机统计（净功 / 平均转矩） */
function computeEngStats() {
  const { V1, V2, pA, pB, pC } = ottoPts(ENG.cr);
  /* 净功 ≈（膨胀功 − 压缩功）× 缸内气体示意 n */
  const k = 1.4;
  const Wexp = (pC * V2 - pC * V2 * Math.pow(V2 / V1, k - 1)) / (k - 1) * 1e3;
  const Wcomp = (pA * V1 - pA * V1 * Math.pow(V1 / V2, k - 1) * -1) / (k - 1) * 1e3;
  ENG.netWork = Math.max(60, (Wexp - Math.abs(pA * (V1 - V2)) * 1e3 * 0.4)) * 0.16;
  const firePerRev = ENG.engine === 'v8' ? 4 : 0.5;
  ENG.avgTorque = ENG.engine === 'v8' ? 62 + (ENG.cr - 10) * 4.2 : 62 + (ENG.cr - 10) * 4.2;
}

function stepEngine(dt) {
  const targetRpm = ENG.rpm;
  if (ENG.running) {
    const radS = targetRpm * TAU / 60;
    ENG.theta += radS * dt * 0.14 * ENG.slowMo;    // 画面慢放
  }
  const deg = ((ENG.theta * 180 / Math.PI) % 720 + 720) % 720;
  if (ENG.engine === 'single') {
    engKin(ENG.theta);
    const st = engStage(deg);
    /* 气门升程 */
    const lift = 0.055;
    const vinLift = st.idx === 0 ? lift * Math.abs(Math.sin(ENG.theta * 2)) : (st.idx === 3 ? 0.004 : 0);
    const vexLift = st.idx === 3 ? lift * Math.abs(Math.sin(ENG.theta * 2)) : 0;
    EG.valveIn.position.y = EG.cylTop + 0.06 - vinLift;
    EG.valveEx.position.y = EG.cylTop + 0.06 - vexLift;
    /* 点火（做功冲程起始 20°） */
    const firing = deg >= 360 && deg < 380;
    EG.spark.material.opacity = firing ? 0.95 : 0;
    if (firing && !EG.burstOn) {
      EG.burstOn = true;
      EG.burst.forEach((s) => {
        const a = Math.random() * TAU;
        s.position.set(Math.cos(a) * 0.09, EG.cylTop - 0.12 + Math.random() * 0.16, Math.sin(a) * 0.09);
        s.material.opacity = 0.85;
        s.userData.vx = Math.cos(a) * 0.4;
        s.userData.vy = -0.5 - Math.random() * 0.3;
        s.userData.vz = Math.sin(a) * 0.4;
      });
    }
    if (!firing) EG.burstOn = false;
    EG.burst.forEach((s) => {
      if (s.material.opacity > 0) {
        s.material.opacity -= dt * 1.5;
        s.position.x += s.userData.vx * dt;
        s.position.y += s.userData.vy * dt;
        s.position.z += s.userData.vz * dt;
      }
    });
    if (ENG.sound) sfx.engineSet(ENG.rpm, 1); else sfx.engOff();
  } else {
    v8Kin(ENG.theta);
    /* V8 点火：deg 进入缸 i 的 firePhase ±8° 时闪 */
    for (const c of V8.cyls) {
      const dd = ((deg - c.firePhase) % 720 + 720) % 720;
      const on = dd < 10;
      c.spark.material.opacity = on ? 0.9 : 0;
      if (c.label) c.label.material.color.set(on ? 0xffd166 : 0xffd9a8);
    }
    if (ENG.sound) sfx.engineSet(ENG.rpm, 8); else sfx.engOff();
  }
  /* 章内 HUD */
  if (hud) {
    const st = engStage(deg);
    hset('stroke', st.name + '（' + st.valve + '）');
    hset('crank', deg.toFixed(0) + '° / 720°');
    hset('rpm', (ENG.running ? '运转中 ' : '暂停 · ') + ENG.rpm + ' 转/min');
  }
}

/* ---------------- 做功与内能：压缩引火仪 + 瓶塞跳起（独立场景） ---------------- */

const IGN = { T: 300, maxT: 300, ratio: 4, burnt: false, tried: false, curve: [], plunger: null, flame: null, cotton: null, smoke: [] };
function buildIgniter(g) {
  setWorkshopLight(1);
  /* 展示桌（小台面） */
  const bench = box(1.7, 0.12, 1.0, deskMat || M(0x8a6844, 0.75));
  bench.position.set(0, 1.0, 0);
  g.add(bench);
  for (const [lx, lz] of [[-0.75, -0.4], [0.75, -0.4], [-0.75, 0.4], [0.75, 0.4]]) {
    const leg = box(0.1, 0.94, 0.1, M(0x39332d, 0.82));
    leg.position.set(lx, 0.47, lz);
    g.add(leg);
  }
  { const sh = contactShadow(2.1, 1.4, 0.75); sh.position.set(0, 0.012, 0); g.add(sh); }
  /* 厚壁玻璃筒：底座法兰 + 筒身 + 顶盖压杆 */
  const base = cyl(0.26, 0.3, 0.12, M(0x4a4f55, 0.5, 0.6), 24);
  base.position.set(0, 1.12, 0);
  g.add(base);
  const tubeH = 0.52;
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, tubeH, 26, 1, true), matGlassLite(COL.glass, { opacity: 0.26 }));
  tube.position.set(0, 1.12 + 0.06 + tubeH / 2, 0);
  g.add(tube);
  const tubeBottom = new THREE.Mesh(new THREE.CircleGeometry(0.155, 26), matGlassLite(COL.glass, { opacity: 0.3 }));
  tubeBottom.rotation.x = -Math.PI / 2;
  tubeBottom.position.set(0, 1.19, 0);
  g.add(tubeBottom);
  /* 顶部导套 */
  const topCap = cyl(0.2, 0.2, 0.07, M(0x565e66, 0.42, 0.7), 24);
  topCap.position.set(0, 1.12 + 0.06 + tubeH + 0.035, 0);
  g.add(topCap);
  /* 压杆 + T 型手柄 + 皮碗活塞 */
  IGN.plunger = new THREE.Group();
  const rod2 = cyl(0.022, 0.022, 0.62, M(COL.chrome, 0.25, 0.85), 12);
  rod2.position.y = 0.31;
  const handle = box(0.24, 0.038, 0.05, M(0x3a3f45, 0.5, 0.4));
  handle.position.y = 0.62;
  for (const sx of [-1, 1]) {
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), M(0x2e3236, 0.8));
    knob.position.set(sx * 0.12, 0.62, 0);
    IGN.plunger.add(knob);
  }
  const cup = cyl(0.148, 0.148, 0.05, M(0x6a5a48, 0.85), 22);   // 皮碗
  cup.position.y = 0;
  const cupFace = cyl(0.15, 0.15, 0.014, M(0x7a6a58, 0.8), 22);
  cupFace.position.y = -0.032;
  IGN.plunger.add(rod2, handle, cup, cupFace);
  IGN.plunger.position.set(0, 1.12 + 0.06 + tubeH + 0.07, 0);
  g.add(IGN.plunger);
  /* 硝化棉（底部棉团：小簇球） */
  IGN.cotton = new THREE.Group();
  for (let i = 0; i < 9; i++) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.016 + Math.random() * 0.012, 7, 6), matStd(0xd8c8a0, { roughness: 0.95 }));
    b.position.set((Math.random() - 0.5) * 0.1, 1.22 + Math.random() * 0.03, (Math.random() - 0.5) * 0.1);
    IGN.cotton.add(b);
  }
  g.add(IGN.cotton);
  /* 火焰 + 烟 */
  IGN.flame = glowSprite(0.3, '255,170,70');
  IGN.flame.material.opacity = 0;
  IGN.flame.position.set(0, 1.3, 0);
  g.add(IGN.flame);
  for (let i = 0; i < 10; i++) {
    const s = glowSprite(0.12, '200,200,205');
    s.material.opacity = 0;
    g.add(s);
    IGN.smoke.push(s);
  }
  updIgniterPlunger();
}
function ignPlungerY(ratio) {
  /* ratio = V0/V1 压缩比：皮碗 y 从筒顶 → 接近筒底 */
  const topY = 1.12 + 0.58 + 0.07;
  const botY = 1.12 + 0.1;
  return botY + (topY - botY) / Math.max(ratio, 1.05);
}
function updIgniterPlunger() {
  if (!IGN.plunger) return;
  const r = IGN.ratio;
  IGN.plunger.position.y = ignPlungerY(r);
}
/** 执行下压：way = 'fast' | 'slow'；绝热升温 + 热损对比；达着火点燃烧 */
function runIgnition(way) {
  IGN.tried = true;
  IGN.curve = [];
  const r = IGN.ratio;
  const gamma1 = 0.4;
  const Tad = 300 * Math.pow(r, gamma1);
  const Tfinal = way === 'fast' ? Tad : 300 + (Tad - 300) * 0.28;
  const steps = 46;
  IGN.play = { t: 0, dur: way === 'fast' ? 0.9 : 2.2, way, Tfinal, r };
}
function stepIgniter(dt) {
  if (IGN.play) {
    const p = IGN.play;
    p.t += dt;
    const k = easeIO(clamp(p.t / p.dur, 0, 1));
    const T = 300 + (p.Tfinal - 300) * k;
    IGN.T = T;
    IGN.maxT = Math.max(IGN.maxT, T);
    IGN.curve.push({ T });
    updIgniterPlunger();
    if (p.t >= p.dur) {
      IGN.play = null;
      if (IGN.T >= 460 && !IGN.burnt) {
        IGN.burnt = true;
        toast('温度超过硝化棉的着火点，棉花燃烧起来了！');
        sfx.pop();
        /* 火苗渐起 */
        IGN.burn = 0;
      } else {
        toast('同样压到底' + (p.way === 'slow' ? '，热量一边做功一边散掉——温度升得不高，棉花点不着。' : '，温度到了 ' + IGN.T.toFixed(0) + ' K。'));
      }
      if (hud) updIgnHud();
    }
  }
  /* 燃烧表现 */
  if (IGN.burnt) {
    IGN.burn = Math.min((IGN.burn || 0) + dt, 1);
    IGN.flame.material.opacity = Math.min(0.9, IGN.burn * 1.4) * (0.85 + Math.sin(performance.now() * 0.02) * 0.15);
    IGN.flame.scale.setScalar(0.22 + IGN.burn * 0.2);
    IGN.cotton.children.forEach((b) => { b.material.color.lerp(new THREE.Color(0x3a2a20), dt * 1.2); });
    if (Math.random() < 0.12) {
      const s = IGN.smoke.find((q) => q.material.opacity <= 0);
      if (s) {
        s.position.set(0, 1.36, 0);
        s.material.opacity = 0.5;
        s.userData.vy = 0.3 + Math.random() * 0.2;
        s.userData.vx = (Math.random() - 0.5) * 0.06;
      }
    }
  }
  IGN.smoke.forEach((s) => {
    if (s.material.opacity > 0) {
      s.material.opacity -= dt * 0.35;
      s.position.y += s.userData.vy * dt;
      s.position.x += s.userData.vx * dt;
    }
  });
  if (hud) {
    hset('tin', IGN.T.toFixed(0) + ' K');
    hset('tmax', IGN.maxT.toFixed(0) + ' K');
    hset('ratio', '1 : ' + IGN.ratio.toFixed(1));
    hset('state', IGN.burnt ? '硝化棉已燃烧' : IGN.tried ? (IGN.T >= 460 ? '超过着火点' : '未到着火点') : '待实验');
  }
}
function updIgnHud() {
  hset('tin', IGN.T.toFixed(0) + ' K');
  hset('tmax', IGN.maxT.toFixed(0) + ' K');
  hset('ratio', '1 : ' + IGN.ratio.toFixed(1));
  hset('state', IGN.burnt ? '硝化棉已燃烧' : IGN.tried ? (IGN.T >= 460 ? '超过着火点' : '未到着火点') : '待实验');
}
function resetIgniter(keepCotton = false) {
  IGN.T = 300; IGN.maxT = 300; IGN.tried = false; IGN.curve = []; IGN.play = null;
  if (!keepCotton) {
    IGN.burnt = false; IGN.burn = 0;
    IGN.cotton.children.forEach((b) => { b.material.color.set(0xd8c8a0); });
  }
  IGN.flame.material.opacity = 0;
  IGN.smoke.forEach((s) => { s.material.opacity = 0; });
  updIgniterPlunger();
  if (hud) updIgnHud();
}

/* ---- 瓶塞跳起 ---- */

const BOT = { p: 101, T: 300, pumps: 0, popped: false, corked: true, hist: [], cork: null, fog: [], pump: null, lever: null };
function buildBottle(g) {
  setWorkshopLight(1);
  const bench = box(1.7, 0.12, 1.0, deskMat || M(0x8a6844, 0.75));
  bench.position.set(0.35, 1.0, 0);
  g.add(bench);
  for (const [lx, lz] of [[-0.4, -0.4], [1.1, -0.4], [-0.4, 0.4], [1.1, 0.4]]) {
    const leg = box(0.1, 0.94, 0.1, M(0x39332d, 0.82));
    leg.position.set(lx, 0.47, lz);
    g.add(leg);
  }
  { const sh = contactShadow(2.1, 1.4, 0.75); sh.position.set(0.35, 0.012, 0); g.add(sh); }
  /* 玻璃瓶（Lathe 剖面：瓶身 + 肩 + 颈口） */
  const prof = [
    [0, 0], [0.16, 0], [0.17, 0.04], [0.17, 0.3], [0.15, 0.4], [0.085, 0.5], [0.075, 0.58], [0.075, 0.64], [0.085, 0.65],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const bottle = new THREE.Mesh(new THREE.LatheGeometry(prof, 30), matGlassLite(COL.glass, { opacity: 0.3 }));
  bottle.position.set(0.35, 1.06, 0);
  g.add(bottle);
  const bottleBase = new THREE.Mesh(new THREE.CircleGeometry(0.16, 30), matGlassLite(COL.glass, { opacity: 0.34 }));
  bottleBase.rotation.x = -Math.PI / 2;
  bottleBase.position.set(0.35, 1.062, 0);
  g.add(bottleBase);
  /* 瓶内水位（示意） */
  const water = cyl(0.15, 0.155, 0.1, matGlassLite(0x7ab8d8, { opacity: 0.5 }), 26);
  water.position.set(0.35, 1.13, 0);
  g.add(water);
  /* 橡皮塞（锥台） */
  BOT.cork = new THREE.Group();
  const corkBody = cyl(0.06, 0.082, 0.1, M(0x6a4a34, 0.9), 16);
  BOT.cork.add(corkBody);
  BOT.cork.position.set(0.35, 1.06 + 0.66, 0);
  g.add(BOT.cork);
  /* 打气筒：筒身 + 推杆 + 皮管到瓶口 */
  BOT.pump = new THREE.Group();
  const barrel = cyl(0.05, 0.05, 0.4, M(0x4a4f55, 0.5, 0.4), 16);
  barrel.position.y = 0.2;
  const rod3 = cyl(0.012, 0.012, 0.44, M(COL.chrome, 0.3, 0.8), 8);
  rod3.position.y = 0.42;
  const grip3 = box(0.16, 0.03, 0.04, M(0x2e3236, 0.8));
  grip3.position.y = 0.64;
  BOT.pump.add(barrel, rod3, grip3);
  BOT.pump.position.set(-0.85, 1.06, 0.15);
  BOT.pump.rotation.z = 0.14;
  g.add(BOT.pump);
  const hoseCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.85, 1.16, 0.15),
    new THREE.Vector3(-0.6, 1.24, 0.3),
    new THREE.Vector3(-0.1, 1.4, 0.3),
    new THREE.Vector3(0.28, 1.58, 0.12),
    new THREE.Vector3(0.35, 1.66, 0.08),
  ]);
  const hose = new THREE.Mesh(new THREE.TubeGeometry(hoseCurve, 40, 0.016, 8, false), M(0x3a3f45, 0.8));
  g.add(hose);
  /* 白雾粒子 */
  for (let i = 0; i < 16; i++) {
    const s = glowSprite(0.1, '225,238,246');
    s.material.opacity = 0;
    g.add(s);
    BOT.fog.push(s);
  }
  /* 气压表（小表盘贴在瓶侧架） */
  const dialB = makeDialTexture(0, 320, 'kPa', '瓶内压强', 40);
  const gb = new THREE.Group();
  const caseB = cyl(0.1, 0.1, 0.045, M(COL.steelDark, 0.4, 0.7), 22);
  caseB.rotation.x = Math.PI / 2;
  const faceB = new THREE.Mesh(new THREE.CircleGeometry(0.09, 22), new THREE.MeshBasicMaterial({ map: dialB }));
  faceB.position.z = 0.025;
  BOT.needleB = box(0.009, 0.085, 0.005, M(COL.redline, 0.5));
  BOT.needleB.geometry.translate(0, 0.04, 0);
  BOT.needleB.position.z = 0.033;
  gb.add(caseB, faceB, BOT.needleB);
  gb.position.set(-0.2, 1.55, 0.3);
  gb.rotation.y = 0.4;
  g.add(gb);
  updBottle();
}
function updBottle() {
  if (!BOT.cork) return;
  BOT.cork.visible = BOT.corked;
  BOT.cork.position.y = BOT.corkFly !== undefined ? BOT.corkFly : 1.06 + 0.66;
  if (BOT.needleB) {
    const t = clamp(BOT.p / 320, 0, 1);
    BOT.needleB.rotation.z = -(Math.PI * 0.78 + Math.PI * 1.44 * t);
  }
  if (hud) {
    hset('p', BOT.p.toFixed(0) + ' kPa');
    hset('t', BOT.T.toFixed(0) + ' K');
    hset('n', String(BOT.pumps));
    hset('state', BOT.popped ? '塞子已跳起' : BOT.corked ? '塞紧状态' : '瓶口敞开');
  }
}
function pumpOnce() {
  if (!BOT.corked) { toast('先把塞子塞回瓶口。'); return; }
  if (BOT.popped) { toast('塞子已经跳掉了，塞回再试。'); return; }
  BOT.pumps++;
  BOT.p = Math.min(101 + BOT.pumps * 26, 300);
  BOT.T = Math.min(300 + BOT.pumps * 3.4, 330);
  BOT.hist.push({ p: BOT.p });
  BOT.pumpStroke = 0;
  sfx.thump();
  updBottle();
  if (BOT.p >= 210) toast('压强够了！点「塞子跳起」。');
}
function popCork() {
  if (BOT.popped) { toast('已经跳过了，塞回塞子重新打气。'); return; }
  if (BOT.p < 210) { toast('再打几口气，压强还不到 210 kPa。'); return; }
  BOT.popped = true;
  /* 绝热膨胀降温：T = T0 (p0/p)^((γ-1)/γ) */
  const gamma1 = 0.4 / 1.4;
  BOT.T = Math.max(300 * Math.pow(101 / BOT.p, gamma1), 258);
  BOT.p = 101;
  BOT.corkPop = { t: 0 };
  sfx.pop();
  /* 白雾 */
  BOT.fog.forEach((s, i) => {
    s.position.set(0.35 + (Math.random() - 0.5) * 0.16, 1.74 + Math.random() * 0.1, (Math.random() - 0.5) * 0.16);
    s.material.opacity = 0.75;
    s.userData.vy = 0.25 + Math.random() * 0.3;
    s.userData.vx = (Math.random() - 0.5) * 0.2;
    s.userData.vz = (Math.random() - 0.5) * 0.2;
  });
  toast('塞子跳起，瓶内气体膨胀对外做功、温度降到 ' + BOT.T.toFixed(0) + ' K，水蒸气液化成白雾。');
  updBottle();
}
function stepBottle(dt) {
  /* 打气筒推杆动画 */
  if (BOT.pumpStroke !== undefined && BOT.pumpStroke !== null) {
    BOT.pumpStroke += dt * 3.2;
    const s = Math.sin(Math.min(BOT.pumpStroke, 1) * Math.PI);
    if (BOT.pump) BOT.pump.children[1].position.y = 0.42 + s * 0.14;
    if (BOT.pumpStroke >= 1) {
      BOT.pump.children[1].position.y = 0.42;
      BOT.pumpStroke = null;
    }
  }
  /* 塞子跳起飞行 */
  if (BOT.corkPop) {
    BOT.corkPop.t += dt;
    const t = BOT.corkPop.t;
    BOT.corkFly = 1.06 + 0.66 + 1.5 * t - 4.9 * t * t;
    BOT.cork.rotation.x += dt * 7;
    BOT.cork.rotation.z += dt * 3;
    if (BOT.corkFly < 1.06 + 0.2) {
      BOT.corkFly = undefined;
      BOT.cork.visible = false;
      BOT.corkPop = null;
      BOT.corked = false;
    }
    updBottle();
  }
  BOT.fog.forEach((s) => {
    if (s.material.opacity > 0) {
      s.material.opacity -= dt * 0.3;
      s.position.y += s.userData.vy * dt;
      s.position.x += s.userData.vx * dt;
      s.position.z += s.userData.vz * dt;
      s.scale.multiplyScalar(1 + dt * 0.7);
    }
  });
}
function resetBottle() {
  BOT.p = 101; BOT.T = 300; BOT.pumps = 0; BOT.popped = false;
  BOT.corked = true; BOT.corkFly = undefined; BOT.corkPop = null;
  BOT.cork.rotation.set(0, 0, 0);
  BOT.hist = [{ p: 101 }];
  BOT.fog.forEach((s) => { s.material.opacity = 0; });
  updBottle();
}

/* ---------------- 热力学第二定律：自由扩散箱 + 冷热铜块 ---------------- */

const DIFF = { N: 40, open: 0, door: 1, playing: false, rewinding: false, mols: [], exp: 'gas' };
function buildDiffuse(g) {
  setWorkshopLight(1);
  /* 展示桌 */
  const bench = box(2.2, 0.12, 1.1, deskMat || M(0x8a6844, 0.75));
  bench.position.set(0, 1.0, 0);
  g.add(bench);
  for (const [lx, lz] of [[-1.0, -0.45], [1.0, -0.45], [-1.0, 0.45], [1.0, 0.45]]) {
    const leg = box(0.1, 0.94, 0.1, M(0x39332d, 0.82));
    leg.position.set(lx, 0.47, lz);
    g.add(leg);
  }
  { const sh = contactShadow(2.6, 1.5, 0.75); sh.position.set(0, 0.012, 0); g.add(sh); }
  /* 玻璃箱 + 框架（8 棱） */
  const w = 1.6, h = 0.9, d = 0.8, cy = 1.62;
  const bx = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), matGlassLite(COL.glass, { opacity: 0.13 }));
  bx.position.set(0, cy, 0);
  g.add(bx);
  const frameM = M(0x5a5248, 0.6, 0.3);
  const edges = [
    [w, 0.05, 0.05, 0, h / 2, -d / 2], [w, 0.05, 0.05, 0, h / 2, d / 2],
    [w, 0.05, 0.05, 0, -h / 2, -d / 2], [w, 0.05, 0.05, 0, -h / 2, d / 2],
    [0.05, h, 0.05, -w / 2, 0, -d / 2], [0.05, h, 0.05, -w / 2, 0, d / 2],
    [0.05, h, 0.05, w / 2, 0, -d / 2], [0.05, h, 0.05, w / 2, 0, d / 2],
  ];
  edges.forEach(([ew, eh, ed, ex, ey, ez]) => {
    const e = box(ew, eh, ed, frameM);
    e.position.set(ex, cy + ey, ez);
    g.add(e);
  });
  /* 左右腔底色淡雾片（可视化左腔/全腔） */
  const leftTint = new THREE.Mesh(new THREE.PlaneGeometry(w / 2 - 0.02, h - 0.06), new THREE.MeshBasicMaterial({ color: 0x2a5a8a, transparent: true, opacity: 0.1, depthWrite: false }));
  leftTint.position.set(-w / 4, cy, -d / 2 + 0.01);
  g.add(leftTint);
  DIFF.leftTint = leftTint;
  /* 隔板（可下缩的磨砂板） */
  DIFF.doorMesh = box(0.026, h - 0.06, d - 0.06, M(0x8a9aa8, 0.5, 0.3));
  DIFF.doorMesh.position.set(0, cy, 0);
  g.add(DIFF.doorMesh);
  /* 分子 */
  const geo = new THREE.SphereGeometry(0.026, 8, 6);
  const mat = new THREE.MeshStandardMaterial({ color: 0x6fb3e0, roughness: 0.4, emissive: 0x1a4a7a, emissiveIntensity: 0.6 });
  DIFF.inst = new THREE.InstancedMesh(geo, mat, 210);
  DIFF.inst.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  DIFF.inst.frustumCulled = false;
  g.add(DIFF.inst);
  /* 分隔标签 */
  const tagL = lbl('左半 · 初始', '#8fc2e8', 0.0022);
  tagL.position.set(-w / 4, cy + h / 2 + 0.12, 0);
  g.add(tagL);
  DIFF.tagL = tagL;
  resetDiff();
}
function resetDiff() {
  const w = 1.6, h = 0.9, d = 0.8, cy = 1.62;
  DIFF.mols = [];
  const n = Math.min(DIFF.N, 200);
  for (let i = 0; i < n; i++) {
    const m = {
      p: new THREE.Vector3(-0.72 + Math.random() * (w / 2 - 0.12), cy + (Math.random() - 0.5) * (h - 0.12), (Math.random() - 0.5) * (d - 0.1)),
      v: new THREE.Vector3(), home: null,
    };
    const th = Math.random() * TAU, ph = Math.acos(2 * Math.random() - 1);
    m.v.set(Math.sin(ph) * Math.cos(th), Math.cos(ph), Math.sin(ph) * Math.sin(th)).multiplyScalar(0.5);
    m.home = m.p.clone();
    DIFF.mols.push(m);
  }
  DIFF.door = 1; DIFF.open = 0; DIFF.playing = false; DIFF.rewinding = false;
  paintDiff();
  if (hud) {
    hset('left', DIFF.N + ' / ' + DIFF.N);
    hset('prob', probText(DIFF.N));
    hset('tier', probTier(DIFF.N));
    hset('state', '隔板关闭，气体全在左半');
  }
}
function probText(N) {
  if (N <= 20) return '1 / 2^' + N + ' = ' + (1 / Math.pow(2, N)).toExponential(1);
  return '1 / 2^' + N + ' ≈ 10^-' + Math.round(N * 0.301);
}
function probTier(N) {
  if (N <= 8) return '分子很少时，偶尔能看到它们全挤在一边';
  if (N <= 60) return '已经很难等到了';
  return '宇宙的年龄里也等不到一次';
}
function playDiff(rewind) {
  if (rewind) {
    DIFF.rewinding = true; DIFF.playing = false;
    if (hud) hset('state', '「倒放」中……分子正在退回左半');
  } else {
    DIFF.playing = true; DIFF.rewinding = false;
    if (hud) {
      hset('state', '隔板抽起——气体自发扩散');
      hset('left', '——');
    }
  }
}
function paintDiff() {
  if (!DIFF.inst) return;
  const dum = new THREE.Object3D();
  const n = DIFF.mols.length;
  for (let i = 0; i < 210; i++) {
    const m = DIFF.mols[i];
    if (!m) { dum.position.set(0, -100, 0); dum.scale.setScalar(0.0001); }
    else { dum.position.copy(m.p); dum.scale.setScalar(1); }
    dum.updateMatrix();
    DIFF.inst.setMatrixAt(i, dum.matrix);
  }
  DIFF.inst.count = Math.max(n, 1);
  DIFF.inst.instanceMatrix.needsUpdate = true;
  DIFF.doorMesh.scale.y = Math.max(DIFF.door, 0.02);
  DIFF.doorMesh.position.y = 1.62 - (1 - DIFF.door) * 0.42;
  if (DIFF.leftTint) DIFF.leftTint.material.opacity = DIFF.door > 0.5 ? 0.1 : 0.02;
}
function stepDiffuse(dt) {
  if (DIFF.playing) DIFF.door = Math.min(DIFF.door - dt * 0.8, 0);
  if (DIFF.rewinding) {
    DIFF.door = Math.min(DIFF.door + dt * 0.8, 1);
    if (DIFF.door >= 0.99 && DIFF.mols.every((m) => m.p.distanceTo(m.home) < 0.02)) {
      DIFF.rewinding = false;
      if (hud) {
        hset('state', '这是倒放的录像：分子自己全部跑回左边——现实中从来没有发生过');
        hset('left', DIFF.N + ' / ' + DIFF.N);
      }
    }
  }
  const xLim = DIFF.door > 0.5 ? -0.04 : 0.76;
  let leftN = 0;
  for (const m of DIFF.mols) {
    if (DIFF.rewinding) {
      m.p.lerp(m.home, Math.min(1, dt * 1.4));
    } else {
      m.p.addScaledVector(m.v, dt * 1.4);
      if (m.p.x < -0.76 + 0.03) { m.p.x = -0.76 + 0.03; m.v.x = Math.abs(m.v.x); }
      if (m.p.x > xLim) {
        if (xLim < 0 && m.p.x > -0.04) { m.p.x = -0.07; m.v.x = -Math.abs(m.v.x); }
        else if (xLim > 0) { m.p.x = xLim; m.v.x = -Math.abs(m.v.x); }
      }
      if (m.p.y < 1.62 - 0.4) { m.p.y = 1.62 - 0.4; m.v.y = Math.abs(m.v.y); }
      if (m.p.y > 1.62 + 0.4) { m.p.y = 1.62 + 0.4; m.v.y = -Math.abs(m.v.y); }
      if (m.p.z < -0.34) { m.p.z = -0.34; m.v.z = Math.abs(m.v.z); }
      if (m.p.z > 0.34) { m.p.z = 0.34; m.v.z = -Math.abs(m.v.z); }
    }
    if (m.p.x < 0) leftN++;
  }
  if (DIFF.playing && DIFF.door <= 0) {
    DIFF.playing = false;
    if (hud) {
      hset('state', '已均匀充满全箱（自发）——反过来「全部退回左半」从未自发发生');
      hset('left', leftN + ' / ' + DIFF.mols.length);
    }
  } else if (hud && !DIFF.rewinding && !DIFF.playing && DIFF.door <= 0.5) {
    hset('left', leftN + ' / ' + DIFF.mols.length);
  }
  paintDiff();
}

/* ---- 冷热铜块接触 ---- */

const CU = { Th: 480, Tc: 280, Th0: 480, Tc0: 280, contact: 0, sliding: false, rewinding: false, rewT: 0, hist: [], arrows: null, hotG: null, coldG: null };
function buildCopper(g) {
  setWorkshopLight(1);
  const bench = box(2.2, 0.12, 1.1, deskMat || M(0x8a6844, 0.75));
  bench.position.set(0, 1.0, 0);
  g.add(bench);
  for (const [lx, lz] of [[-1.0, -0.45], [1.0, -0.45], [-1.0, 0.45], [1.0, 0.45]]) {
    const leg = box(0.1, 0.94, 0.1, M(0x39332d, 0.82));
    leg.position.set(lx, 0.47, lz);
    g.add(leg);
  }
  { const sh = contactShadow(2.6, 1.5, 0.75); sh.position.set(0, 0.012, 0); g.add(sh); }
  /* 绝热垫 */
  const pad = box(1.9, 0.05, 0.8, M(0x3a3330, 0.9));
  pad.position.set(0, 1.085, 0);
  g.add(pad);
  /* 热块 + 冷块（铜色，温度映射 emissive） */
  const mk = () => new THREE.Group();
  CU.hotG = mk(); CU.coldG = mk();
  const hotMat = M(COL.copperHot, 0.42, 0.75);
  hotMat.emissive = new THREE.Color(0xa03010);
  hotMat.emissiveIntensity = 0.3;
  const coldMat = M(0x9aa8b8, 0.45, 0.7);
  coldMat.emissive = new THREE.Color(0x10202e);
  coldMat.emissiveIntensity = 0.25;
  CU.hotMat = hotMat; CU.coldMat = coldMat;
  const hotBody = box(0.5, 0.34, 0.5, hotMat);
  const coldBody = box(0.5, 0.34, 0.5, coldMat);
  CU.hotG.add(hotBody, contactShadow(0.8, 0.8, 0.8));
  CU.coldG.add(coldBody, contactShadow(0.8, 0.8, 0.8));
  CU.hotG.position.set(-0.62, 1.28, 0);
  CU.coldG.position.set(0.62, 1.28, 0);
  g.add(CU.hotG, CU.coldG);
  /* 表面温度微光片 */
  const hotGlow = glowSprite(0.5, '255,120,60');
  hotGlow.position.y = 0.1;
  const coldGlow = glowSprite(0.36, '130,180,230');
  coldGlow.position.y = 0.1;
  CU.hotG.add(hotGlow);
  CU.coldG.add(coldGlow);
  CU.hotGlow = hotGlow; CU.coldGlow = coldGlow;
  /* 提手（黄铜环） */
  const ring = (rg) => {
    const h = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.012, 8, 22), M(COL.brass, 0.4, 0.7));
    h.position.y = 0.22;
    h.rotation.x = Math.PI / 2;
    rg.add(h);
  };
  ring(CU.hotG); ring(CU.coldG);
  /* 标签 */
  const tH = lbl('热块', '#ffab8a', 0.0024);
  tH.position.set(0, 0.4, 0.3);
  const tC = lbl('冷块', '#9ec2e8', 0.0024);
  tC.position.set(0, 0.4, 0.3);
  CU.hotG.add(tH); CU.coldG.add(tC);
  /* 热流方向箭头（接触传热时显示，指向冷块） */
  const arrowG = new THREE.Group();
  const shaft = cyl(0.012, 0.012, 0.2, new THREE.MeshBasicMaterial({ color: 0xffb347 }), 6);
  shaft.rotation.z = Math.PI / 2;
  shaft.position.x = -0.05;
  const head = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.07, 10), new THREE.MeshBasicMaterial({ color: 0xffb347 }));
  head.rotation.z = -Math.PI / 2;
  head.position.x = 0.09;
  arrowG.add(shaft, head);
  arrowG.position.set(0, 1.24, 0.3);
  arrowG.visible = false;
  g.add(arrowG);
  CU.arrow = arrowG;
  resetCopper();
}
function resetCopper() {
  CU.Th = CU.Th0; CU.Tc = CU.Tc0; CU.contact = 0; CU.sliding = false;
  CU.rewinding = false; CU.rewT = 0; CU.hist = [{ Th: CU.Th, Tc: CU.Tc }];
  CU.arrow.visible = false;
  if (hud) {
    hset('th', CU.Th.toFixed(1) + ' K');
    hset('tc', CU.Tc.toFixed(1) + ' K');
    hset('dir', '尚未接触');
    hset('sum', (CU.Th + CU.Tc).toFixed(1) + ' K（守恒）');
  }
  updCopperVisual();
}
function updCopperVisual() {
  const kH = clamp((CU.Th - 280) / 240, 0, 1.2);
  CU.hotMat.emissiveIntensity = 0.15 + kH * 0.6;
  CU.hotGlow.material.opacity = 0.25 + kH * 0.4;
  const kC = clamp((400 - CU.Tc) / 140, 0, 1);
  CU.coldMat.emissiveIntensity = 0.1 + kC * 0.2;
  CU.coldGlow.material.opacity = 0.12 + kC * 0.3;
}
function touchCopper() {
  if (CU.sliding || CU.contact > 0.5) return;
  CU.sliding = true;
  sfx.thump();
}
function rewindCopper() {
  CU.rewinding = true;
  CU.rewT = 0;
  if (hud) hset('dir', '倒放：热量从冷的流向热的——现实中不会自发发生');
}
function stepCopper(dt) {
  if (CU.sliding) {
    CU.contact = Math.min(CU.contact + dt * 1.2, 1);
    CU.hotG.position.x = -0.62 + CU.contact * 0.36;
    if (CU.contact >= 1) {
      CU.sliding = false;
      CU.arrow.visible = true;
      if (hud) hset('dir', '热量自发地从高温物体传到低温物体');
    }
  }
  const touching = CU.contact >= 1;
  if (touching && !CU.rewinding) {
    const k = 0.55;
    const dT = (CU.Th - CU.Tc) * k * dt;
    CU.Th -= dT; CU.Tc += dT;                 // 总和守恒
    if (Math.abs(CU.Th - CU.Tc) < 0.25) { CU.Th = CU.Tc = (CU.Th + CU.Tc) / 2; }
  }
  if (CU.rewinding) {
    CU.rewT += dt;
    /* 倒放演示：温差扩大，演示 ~2.2s 后停下并说明不会自发发生 */
    const target = 1 + Math.min(CU.rewT, 2.2) * 0.9;
    CU.Th = CU.Th0 - 30 + (CU.Th0 - 30 - (CU.Tc0 + 30)) / 2 * target * 0.55;
    CU.Tc = CU.Tc0 + 30 - (CU.Th0 - 30 - (CU.Tc0 + 30)) / 2 * target * 0.55;
    if (CU.rewT > 2.4) {
      CU.rewinding = false;
      CU.Th = CU.Th0 - 55; CU.Tc = CU.Tc0 + 55;
      toast('倒放：冷的越来越冷、热的越来越热——能量守恒并不禁止它，但它不会自发发生。');
    }
    if (hud) hset('dir', '◀◀ 倒放中（不会自发发生）');
  }
  if (touching || CU.rewinding) {
    CU.hist.push({ Th: CU.Th, Tc: CU.Tc });
    if (CU.hist.length > 240) CU.hist.shift();
  }
  /* 接触时箭头脉动 */
  if (CU.arrow.visible) {
    CU.arrow.position.x = CU.hotG.position.x + 0.28 + (CU.Th > CU.Tc ? 0 : 0.56);
    CU.arrow.children.forEach((c) => { if (c.rotation.z !== undefined && CU.Th < CU.Tc) c.rotation.z += Math.PI; });
    CU.arrow.rotation.y = 0;
  }
  updCopperVisual();
  if (hud) {
    hset('th', CU.Th.toFixed(1) + ' K');
    hset('tc', CU.Tc.toFixed(1) + ' K');
    hset('sum', (CU.Th + CU.Tc).toFixed(1) + ' K（守恒）');
  }
}

/* ---------------- 章节状态与辅助 ---------------- */

function clearChapterState() {
  animV = null; animT = null;
  heaterActive = null; bathMode = null;
  pistonLock = false;
  tracePath = []; traceLabel = '';
  HIST.pts = []; HIST.T0 = 300; HIST.V0 = G.V;
  FL.accumQ = 0; FL.accumW = 0; FL.anim = null;
  leverMode = { L: 'T', R: 'V' };
  gasUiHook = null;
  removeStageCard();
  setWorkshopLight(1);
  if (STN.highlight) STN.highlight.visible = false;
}
const CAM_PRESETS = {
  0: [[2.5, 2.9, 5.0], [-0.35, 2.1, 0]],
  1: [[-0.05, 2.6, 3.8], [-0.85, 2.2, 0]],
  2: [[0.45, 2.3, 3.7], [-0.8, 2.05, 0]],
  3: [[0.85, 2.8, 4.8], [-0.4, 2.15, 0]],
  4: [[0.9, 2.8, 4.8], [-0.25, 2.15, 0]],
  5: [[0.9, 2.8, 4.8], [-0.25, 2.15, 0]],
  6: [[0.3, 2.3, 3.1], [0.1, 1.55, 0]],
  7: [[1.05, 2.7, 4.6], [-0.15, 2.1, 0]],
  8: [[2.1, 2.0, 4.7], [0, 1.6, 0]],
  9: [[1.3, 2.6, 4.4], [0.6, 2.1, 0]],
  10: [[0.5, 2.2, 3.6], [0, 1.7, 0]],
  11: [[2.1, 2.9, 4.9], [0.15, 2.1, 0]],
};
function frameStation() {
  const p = CAM_PRESETS[chapterIdx] || CAM_PRESETS[0];
  app.setCamera(p[0], p[1]);
}

/* 舞台覆盖卡（导览/冲程） */
let stageCard = null;
function removeStageCard() {
  if (stageCard) { stageCard.remove(); stageCard = null; }
}
function buildStageCard(cls, title) {
  removeStageCard();
  const el = document.createElement('div');
  el.className = 'thm-card ' + cls;
  el.innerHTML = '<h3>' + title + '</h3>';
  stage.appendChild(el);
  stageCard = el;
  return el;
}

function gasSliders(opts = {}) {
  if (opts.N) {
    const s = ctl.slider({ label: '分子数 N', min: 20, max: 200, step: 5, value: G.N, fmt: (v) => v + ' 个', onInput: (v) => { G.N = clamp(v, 20, 200); onManualGasChange(); } });
    sliderN.ref = s;
  }
  if (opts.T !== false) {
    const s = ctl.slider({ label: '温度 T', min: 120, max: 650, step: 5, value: G.T, fmt: (v) => v + ' K', onInput: (v) => { G.T = clamp(v, 120, 650); onManualGasChange(); } });
    sliderT.ref = s;
  }
  if (opts.V !== false) {
    const s = ctl.slider({ label: '体积 V（活塞）', min: 0.2, max: 2.0, step: 0.02, value: G.V, fmt: (v) => v.toFixed(2) + ' L', onInput: (v) => { G.V = clamp(v, 0.2, 2.0); onManualGasChange(); } });
    sliderV.ref = s;
  }
}
function clearSliderRefs() { sliderN.ref = null; sliderT.ref = null; sliderV.ref = null; }
function onManualGasChange() {
  updPiston();
  updHalfnut();
  updGauges();
  if (sliderN.ref) sliderN.ref.set(G.N);
  if (sliderT.ref) sliderT.ref.set(G.T);
  if (sliderV.ref) sliderV.ref.set(G.V);
  drawLED(STN.stalkL, G.T.toFixed(0));
  drawLED(STN.stalkR, G.V.toFixed(2));
  drawHeaterDisplay(heaterState(), G.T, heaterActive === 'heat');
  if (gasUiHook) gasUiHook();
}
function recordPt() { HIST.pts.push({ V: G.V, T: G.T, p: G.pKPa() }); }
function gasBar() {
  /* 数据读数首行组（p/V/T/n 实时读数） */
  hset('p', G.pKPa().toFixed(1) + ' kPa');
  hset('v', G.V.toFixed(2) + ' L');
  hset('t', G.T.toFixed(0) + ' K（' + (G.T - 273.15).toFixed(1) + ' °C）');
  hset('n', G.nMol().toFixed(3) + ' mol');
}

/* ---------------- 12 章定义 ---------------- */

const SECTIONS = [];

/* 第 1 章：认识工作站（逐个认识部件导览） */
const TOUR_STEPS = [
  { name: '气缸', cam: [[0.1, 2.3, 3.0], [-1.05, 2.0, 0]], hl: [CYL.cx, CYL.y0 + 0.7, 0], note: '厚壁玻璃筒，上下用法兰和三根拉杆夹紧；里面封着一定质量的气体。小球是放大画出的气体分子。' },
  { name: '活塞', cam: [[0.2, 2.3, 2.9], [-1.05, pistonY(), 0]], hl: [CYL.cx, pistonY(), 0], note: '黄铜活塞，两道橡胶密封圈防止漏气。活塞的位置决定气体的体积，背后的刻度条可以直接读气柱高度。' },
  { name: '手轮与半螺母', cam: [[0.3, 3.5, 3.1], [CYL.cx, CYL.y0 + 2.5, -0.2]], hl: [CYL.cx, CYL.y0 + 2.5, -0.3], note: '手轮带动丝杠推拉活塞。扳起红色拨杆，半螺母松开，活塞就自由浮动；套上红色锁扣，活塞被锁住。' },
  { name: '加热 · 制冷台', cam: [[0.2, 2.0, 2.9], [CYL.cx, 1.45, 0.1]], hl: [CYL.cx, 1.32, 0.2], note: '加热台可以把气缸底部加热到 600 K，也能制冷到 220 K。线圈发红是在加热，结霜是在制冷；前面的数显窗是设定温度。' },
  { name: '压力表', cam: [[0.6, 2.3, 3.1], [CYL.cx + 0.95, 2.0, 0.28]], hl: [CYL.cx + 0.95, 1.95, 0.28], note: '通过铜管连到气缸底部，指示气体的绝对压强（kPa）。' },
  { name: '温度计', cam: [[-1.6, 2.3, 3.0], [CYL.cx - 0.98, 1.95, 0.3]], hl: [CYL.cx - 0.98, 1.9, 0.3], note: '探头伸进气缸底部，表盘以摄氏度为单位。热力学温度 T = t + 273.15 K。' },
  { name: '屏幕', cam: [[1.55, 2.4, 3.3], [1.0, 1.95, -0.15]], hl: [1.0, 1.86, -0.2], note: '两块屏幕实时画图：左边一般是 p–V 图，右边随课题变化。' },
  { name: '推拉杆', cam: [[1.85, 2.2, 3.1], [1.18, 1.7, 0.15]], hl: [1.18, 1.6, 0.14], note: '像飞机油门一样：按住握把往前推、往回拉，或者直接点在槽边想要的位置。左边的推杆多半是温度，右边的多半是活塞位置；槽边的 LED 显示当前值。' },
];
let tourIdx = 0;
const secStation = {
  title: '认识工作站',
  group: '认识 · 基础',
  html: `<p>台面上是一只<b>玻璃气缸</b>，里面封着一定质量的气体。气缸里的小球是放大画出来的<b>气体分子</b>：颜色越暖，跑得越快。</p>
<p>黄铜<b>活塞</b>可以上下移动；上方的<b>手轮</b>通过丝杠推拉活塞，松开半螺母时活塞自由浮动。气缸下面的<b>加热台</b>能加热也能制冷；右边的<b>压力表</b>、左边的<b>温度计</b>随时读数。</p>
<p>控制台斜面上的两块屏幕实时画图，两边的推拉杆可以直接用鼠标推拉。点下面的<b>下一处</b>，逐个认识它们；台面上的部件也可以直接拖拽。</p>`,
  enter() {
    clearChapterState();
    useScene('studio', buildStudio);
    resetMols();
    STN.pollen.visible = false;
    frameStation();
    clearSliderRefs();
    ctl.clear();
    const row = ctl.btnrow();
    row.add('⇢ 下一处（逐个认识）', () => { tourStep((tourIdx + 1) % TOUR_STEPS.length); });
    row.add('↺ 返回全景', () => { tourStop(); });
    ctl.sep();
    ctl.toggle({ label: '加热器', value: false, onChange: (v) => { heaterActive = v ? 'heat' : null; } });
    buildHud([['part', '当前部件'], ['note', '部件说明'], ['p', '压强'], ['t', '温度']]);
    gasBar();
    hset('part', '全景');
    hset('note', '点「下一处」逐个认识台面上的部件');
    tourCard();
    tourStop();
    leverMode = { L: null, R: null };
    gasUiHook = () => gasBar();
    bindStageDragOnce();
  },
};
function tourCard() {
  const el = buildStageCard('thm-tour', '认识工作站');
  const rowsBox = document.createElement('div');
  el.appendChild(rowsBox);
  const noteBox = document.createElement('div');
  noteBox.className = 'tour-note';
  el.appendChild(noteBox);
  TOUR_STEPS.forEach((s, i) => {
    const r = document.createElement('div');
    r.className = 'tour-row';
    r.innerHTML = '<span class="no">' + String(i + 1).padStart(2, '0') + '</span><span>' + s.name + '</span>';
    r.addEventListener('click', () => tourStep(i));
    rowsBox.appendChild(r);
  });
  STN.tourRows = rowsBox;
  STN.tourNote = noteBox;
}
function tourStep(i) {
  tourIdx = i;
  const s = TOUR_STEPS[i];
  camTo(s.cam[0], s.cam[1], 1.1);
  highlightAt(new THREE.Vector3(s.hl[0], s.hl[1], s.hl[2]));
  if (STN.tourRows) {
    STN.tourRows.querySelectorAll('.tour-row').forEach((r, j) => r.classList.toggle('on', j === i));
  }
  if (STN.tourNote) STN.tourNote.textContent = s.note;
  hset('part', s.name);
  hset('note', s.note);
}
function tourStop() {
  frameStation();
  highlightAt(null);
  if (STN.tourRows) STN.tourRows.querySelectorAll('.tour-row').forEach((r) => r.classList.remove('on'));
  if (STN.tourNote) STN.tourNote.textContent = '点「下一处」逐个认识台面上的部件，或直接点清单里的名字。';
  hset('part', '全景');
  hset('note', '点「下一处」逐个认识台面上的部件');
  tourIdx = -1;
}

/* 第 2 章：分子热运动与温度 */
const secKinetic = {
  title: '分子热运动与温度',
  group: '认识 · 基础',
  html: `<p>气体分子在永不停息地做<b>无规则运动</b>，彼此碰撞、撞击器壁。每个分子的速率各不相同，而且每次碰撞都在变。1827 年布朗看到水中的花粉颗粒不停乱动——正是液体分子从四面八方撞击它的结果。</p>
<p>右屏是此刻分子的<b>速率分布</b>：中间多、两头少，白线是麦克斯韦分布曲线。把推杆往前推加热：分子越跑越快、颜色变暖，分布曲线<b>变矮变宽、峰值右移</b>。</p>
<p><b>温度是分子平均动能的标志</b>：温度越高，分子热运动越剧烈。本章活塞锁住了，只有温度在变；悬浮的花粉颗粒可以单独打开观察布朗运动。</p>`,
  enter() {
    clearChapterState();
    useScene('studio', buildStudio);
    resetMols();
    pistonLock = true;
    leverMode = { L: 'T', R: null };
    frameStation();
    frameStation();
    clearSliderRefs();
    ctl.clear();
    const row = ctl.btnrow();
    row.add('加热到 500 K', () => driveT(500, 1.6));
    row.add('冷却到 220 K', () => driveT(220, 1.6));
    row.add('回到室温', () => driveT(300, 1.6));
    ctl.sep();
    ctl.slider({ label: '温度 T', min: 120, max: 650, step: 5, value: G.T, fmt: (v) => v + ' K', onInput: (v) => { G.T = clamp(v, 120, 650); onManualGasChange(); } });
    ctl.toggle({ label: '分子慢放', value: G.slow, onChange: (v) => { G.slow = v; } });
    ctl.toggle({ label: '花粉颗粒（布朗运动）', value: STN.pollen.visible, onChange: (v) => { STN.pollen.visible = v; } });
    buildHud([['p', '压强'], ['v', '体积'], ['t', '温度'], ['ek', '分子平均动能'], ['law', '结论']]);
    HIST.T0 = 300;
    gasBar();
    hset('ek', '随温度升高而增大');
    hset('law', 'T↑ → 平均动能↑ → 曲线右移');
    drawScreenA('plain');
    drawScreenB('dist');
    gasUiHook = () => { gasBar(); drawScreenB('dist'); };
    bindStageDragOnce();
  },
};

/* 第 3 章：气体压强从哪里来 */
const secPressure = {
  title: '气体压强从哪里来',
  group: '认识 · 基础',
  html: `<p>把视线贴到活塞底面：视野里的每个小亮点，都是一个分子撞上来再弹开的一瞬。单颗分子的撞击断断续续，但亿万个分子<b>频繁、密集</b>地轮番撞上去，汇成一股均匀又稳定的推力——这就是<b>气体压强</b>。</p>
<p>右屏统计每秒的撞击次数和由冲量算出的压强，并与 pV = nRT 算出的压强并排对比。试试：</p>
<p>· <b>分子数加倍</b>（同样的体积，数密度翻一倍）：撞得更密，压强也跟着翻倍；</p>
<p>· <b>升高温度</b>：分子跑得更急，每一下撞得更狠、来得更勤，压强随之走高。</p>
<p><span class="hl">压强取决于分子的数密度和分子的平均动能。</span></p>`,
  enter() {
    clearChapterState();
    useScene('studio', buildStudio);
    resetMols();
    pistonLock = true;
    leverMode = { L: 'T', R: null };
    frameStation();
    clearSliderRefs();
    ctl.clear();
    const row = ctl.btnrow();
    row.add('分子数加倍', () => { G.N = Math.min(G.N * 2, 200); onManualGasChange(); });
    row.add('温度加倍', () => { G.T = Math.min(G.T * 2, 620); onManualGasChange(); });
    ctl.sep();
    ctl.slider({ label: '分子数 N', min: 20, max: 200, step: 5, value: G.N, fmt: (v) => v + ' 个', onInput: (v) => { G.N = clamp(v, 20, 200); onManualGasChange(); } });
    ctl.slider({ label: '温度 T', min: 120, max: 650, step: 5, value: G.T, fmt: (v) => v + ' K', onInput: (v) => { G.T = clamp(v, 120, 650); onManualGasChange(); } });
    ctl.slider({ label: '体积 V（活塞）', min: 0.2, max: 2.0, step: 0.02, value: G.V, fmt: (v) => v.toFixed(2) + ' L', onInput: (v) => { G.V = clamp(v, 0.2, 2.0); onManualGasChange(); } });
    ctl.toggle({ label: '分子慢放', value: G.slow, onChange: (v) => { G.slow = v; } });
    buildHud([['p', '压强'], ['v', '体积'], ['t', '温度'], ['n', '物质的量'], ['hits', '撞壁'], ['law', '结论']]);
    gasBar();
    hset('hits', '统计中…');
    hset('law', 'p = nRT/V');
    drawScreenA('plain');
    drawScreenB('impact');
    gasUiHook = () => { gasBar(); };
    bindStageDragOnce();
  },
  tick(dt) {
    if (hud) {
      const { rate, pImp } = impactStats();
      hset('hits', rate === null ? '采样中…' : rate.toFixed(0) + ' 次/s · 冲量压强 ' + (pImp === null ? '…' : pImp.toFixed(0)) + ' kPa');
    }
  },
};

/* 第 4 章：玻意耳定律 */
const secBoyle = {
  title: '玻意耳定律',
  group: '气体三定律',
  html: `<p><b>等温变化</b>：温度不变时，一定质量气体的压强与体积成反比：</p>
<p><span class="hl">p₁V₁ = p₂V₂</span>（玻意耳–马略特定律，1662）。p–V 图上是一条<b>双曲线</b>——压下去，压力反弹；改用 p–1/V 作图则是一条过原点的直线（化曲为直好验证）。温度越高，等温线离原点越远。</p>
<p>转手轮（或拖活塞滑杆）压气，屏幕上描出等温线；点「记录数据」攒几组 p·V，看乘积是否恒定。换 340 K 水温再看一条线。</p>`,
  enter() {
    clearChapterState();
    useScene('studio', buildStudio);
    resetMols();
    pistonLock = false;
    leverMode = { L: null, R: 'V' };
    frameStation();
    clearSliderRefs();
    ctl.clear();
    const row = ctl.btnrow();
    row.add('压缩到一半', () => driveV(G.V / 2, 1.4));
    row.add('拉到两倍', () => driveV(Math.min(G.V * 2, 2.0), 1.4));
    row.add('换水温 340 K', () => { driveT(340, 1.4); toast('恒温水浴换到 340 K，等温线整体抬高。'); });
    ctl.sep();
    ctl.slider({ label: '体积 V（活塞）', min: 0.2, max: 2.0, step: 0.02, value: G.V, fmt: (v) => v.toFixed(2) + ' L', onInput: (v) => { G.V = clamp(v, 0.2, 2.0); onManualGasChange(); } });
    ctl.slider({ label: '恒温水浴 T（实验条件）', min: 220, max: 500, step: 10, value: G.T, fmt: (v) => v + ' K', onInput: (v) => { G.T = clamp(v, 220, 500); onManualGasChange(); } });
    ctl.sep();
    const row2 = ctl.btnrow();
    row2.add('⌘ 记录数据', () => { recordPt(); updBoyleHud(); });
    row2.add('✕ 清除记录', () => { HIST.pts.length = 0; updBoyleHud(); });
    buildHud([['p', '压强'], ['v', '体积'], ['t', '温度'], ['n', '物质的量'], ['pv', 'pV 乘积'], ['pts', '已记录组数']]);
    gasBar();
    updBoyleHud();
    drawScreenA('boyle');
    drawScreenB('p1v');
    gasUiHook = () => { gasBar(); drawScreenA('boyle'); drawScreenB('p1v'); updBoyleHud(); };
    bindStageDragOnce();
  },
};
function updBoyleHud() {
  hset('pv', (G.pKPa() * G.V).toFixed(1) + ' kPa·L');
  hset('pts', HIST.pts.length ? HIST.pts.length + ' 组 · 乘积 ' + HIST.pts.map((q) => (q.p * q.V).toFixed(0)).join(' / ') + ' kPa·L' : '点「记录数据」攒组');
  gasBar();
}

/* 第 5 章：盖-吕萨克定律 */
const secGay = {
  title: '盖-吕萨克定律',
  group: '气体三定律',
  html: `<p><b>等压变化</b>：压强不变（活塞可自由浮动）时，体积与热力学温度成正比：</p>
<p><span class="hl">V₁/T₁ = V₂/T₂</span>（盖-吕萨克定律，1802）。V–T 图是<b>过原点的直线</b>——把直线外推到 V = 0，交在 −273.15 °C，那就是<b>绝对零度</b>的由来；热力学温度 T = t + 273.15 K。</p>
<p>加热到 450 K、冷却到 240 K，看活塞跟着升降；点「记录数据」攒几组点，蓝点是初始参考态。</p>`,
  enter() {
    clearChapterState();
    useScene('studio', buildStudio);
    resetMols();
    pistonLock = false;
    leverMode = { L: 'T', R: null };
    HIST.V0 = G.V; HIST.T0 = G.T;
    frameStation();
    clearSliderRefs();
    ctl.clear();
    const row = ctl.btnrow();
    row.add('加热到 450 K', () => driveT(450, 1.6, () => { G.V = clamp(HIST.V0 * G.T / HIST.T0, 0.2, 2.0); onManualGasChange(); }));
    row.add('冷却到 240 K', () => driveT(240, 1.6, () => { G.V = clamp(HIST.V0 * G.T / HIST.T0, 0.2, 2.0); onManualGasChange(); }));
    row.add('回到室温', () => driveT(300, 1.6, () => { G.V = clamp(HIST.V0 * G.T / HIST.T0, 0.2, 2.0); onManualGasChange(); }));
    ctl.sep();
    ctl.slider({ label: '温度 T（活塞随之浮动）', min: 120, max: 650, step: 5, value: G.T, fmt: (v) => v + ' K', onInput: (v) => { const T = clamp(v, 120, 650); G.V = clamp(HIST.V0 * T / HIST.T0, 0.2, 2.0); G.T = T; onManualGasChange(); } });
    ctl.sep();
    const row2 = ctl.btnrow();
    row2.add('⌘ 记录数据', () => { recordPt(); HIST.pts[HIST.pts.length - 1].T = G.T; HIST.pts[HIST.pts.length - 1].V = G.V; updGayHud(); drawScreenB('vt'); });
    row2.add('✕ 清除记录', () => { HIST.pts.length = 0; updGayHud(); drawScreenB('vt'); });
    buildHud([['p', '压强'], ['v', '体积'], ['t', '温度'], ['vt', 'V/T 比值'], ['pts', '已记录组数'], ['note', '等压条件']]);
    gasBar();
    hset('note', '活塞可自由浮动（p 恒定）');
    updGayHud();
    drawScreenA('isobar');
    drawScreenB('vt');
    gasUiHook = () => { gasBar(); drawScreenB('vt'); updGayHud(); };
    bindStageDragOnce();
  },
};
function updGayHud() {
  hset('vt', (G.V / G.T * 1000).toFixed(2) + ' mL/K');
  hset('pts', HIST.pts.length ? HIST.pts.length + ' 组' : '点「记录数据」攒组');
  gasBar();
}

/* 第 6 章：查理定律 */
const secCharles = {
  title: '查理定律',
  group: '气体三定律',
  html: `<p><b>等容变化</b>：活塞被红色锁扣卡死、体积不变时，压强与热力学温度成正比：</p>
<p><span class="hl">p₁/T₁ = p₂/T₂</span>（查理定律，1787）。p–T 图同样过原点——这也是<b>查理温度计</b>（定容气体温度计）的原理；体积越小，等容线越陡。</p>
<p>加热到 450 K、600 K，冷却到 240 K，看压强读数线性变化；点「记录数据」攒几组点。</p>`,
  enter() {
    clearChapterState();
    useScene('studio', buildStudio);
    resetMols();
    pistonLock = true;
    leverMode = { L: 'T', R: null };
    HIST.T0 = G.T;
    frameStation();
    clearSliderRefs();
    ctl.clear();
    const row = ctl.btnrow();
    row.add('加热到 450 K', () => driveT(450, 1.6));
    row.add('加热到 600 K', () => driveT(600, 1.8));
    row.add('冷却到 240 K', () => driveT(240, 1.6));
    ctl.sep();
    ctl.slider({ label: '温度 T（活塞锁住）', min: 120, max: 650, step: 5, value: G.T, fmt: (v) => v + ' K', onInput: (v) => { G.T = clamp(v, 120, 650); onManualGasChange(); } });
    ctl.sep();
    const row2 = ctl.btnrow();
    row2.add('⌘ 记录数据', () => { recordPt(); HIST.pts[HIST.pts.length - 1].T = G.T; HIST.pts[HIST.pts.length - 1].p = G.pKPa(); updCharlesHud(); drawScreenB('pt'); });
    row2.add('✕ 清除记录', () => { HIST.pts.length = 0; updCharlesHud(); drawScreenB('pt'); });
    buildHud([['p', '压强'], ['v', '体积'], ['t', '温度'], ['pt', 'p/T 比值'], ['pts', '已记录组数'], ['note', '等容条件']]);
    gasBar();
    hset('note', '活塞锁住（V 恒定）');
    updCharlesHud();
    drawScreenA('isochor');
    drawScreenB('pt');
    gasUiHook = () => { gasBar(); drawScreenB('pt'); updCharlesHud(); };
    bindStageDragOnce();
  },
};
function updCharlesHud() {
  hset('pt', (G.pKPa() / G.T * 1000).toFixed(2) + ' kPa/K');
  hset('pts', HIST.pts.length ? HIST.pts.length + ' 组' : '点「记录数据」攒组');
  gasBar();
}

/* 第 7 章：做功与内能（双实验选择） */
let workExp = 'ign';
const secWork = {
  title: '做功与内能',
  group: '能量 · 热机',
  html: `<p><b>压缩引火仪</b>：厚壁玻璃筒底部放一小团硝化棉，<b>迅速</b>压下活塞——棉花燃烧起来。活塞对筒内空气<b>做功</b>，空气来不及向外散热，内能增加、温度骤升，超过了硝化棉的着火点。换成<b>缓慢</b>下压：同样压到底，热量一边做功一边散掉，温度升得不高，棉花点不着。</p>
<p><b>瓶塞跳起</b>：往瓶里打气，瓶塞跳起的一瞬间，瓶内气体膨胀<b>对外做功</b>，内能减少、温度降低，水蒸气液化成小水珠——瓶口出现白雾。</p>
<p><b>做功和热传递都能改变物体的内能。</b>外界对物体做功，内能增加；物体对外做功，内能减少。</p>`,
  enter() {
    clearChapterState();
    workExp = workExp || 'ign';
    leverMode = { L: null, R: null };
    ctl.clear();
    ctl.seg({
      label: '选择实验', value: workExp, options: [
        { label: '压缩引火仪', value: 'ign' },
        { label: '瓶塞跳起', value: 'bottle' },
      ], onChange: (v) => { workExp = v; secWork.enter(); },
    });
    if (workExp === 'ign') {
      useScene('igniter', buildIgniter);
      resetIgniter();
      frameStation();
      clearSliderRefs();
      ctl.sep();
      ctl.slider({ label: '压缩程度（下压深度）', min: 1.5, max: 7, step: 0.5, value: IGN.ratio, fmt: (v) => '压缩比 1 : ' + v.toFixed(1), onInput: (v) => { IGN.ratio = v; updIgniterPlunger(); updIgnHud(); } });
      ctl.seg({
        label: '下压方式', value: 'fast', options: [
          { label: '迅速压到底', value: 'fast' },
          { label: '缓慢压到底', value: 'slow' },
        ], onChange: () => {},
      });
      const row = ctl.btnrow();
      row.add('⬇ 迅速压下', () => runIgnition('fast'));
      row.add('⬇ 缓慢压下', () => runIgnition('slow'));
      row.add('⬆ 拉回活塞', () => { IGN.ratio = 1.2; updIgniterPlunger(); });
      row.add('↺ 换一团棉花', () => resetIgniter());
      buildHud([['tin', '筒内温度'], ['tmax', '最高温度'], ['ratio', '压缩比'], ['state', '状态'], ['law', '结论']]);
      updIgnHud();
      hset('law', '外界对气体做功 → 内能增加');
      drawScreenB('tt');
    } else {
      useScene('bottle', buildBottle);
      resetBottle();
      camTo([0.85, 2.2, 3.2], [0.05, 1.45, 0], 1.1);
      clearSliderRefs();
      ctl.sep();
      const row = ctl.btnrow();
      row.add('🌀 打一口气', () => pumpOnce());
      row.add('⤴ 塞子跳起', () => popCork());
      row.add('⤓ 塞回塞子', () => { resetBottle(); });
      buildHud([['p', '瓶内压强'], ['t', '瓶内温度'], ['n', '打气次数'], ['state', '状态'], ['law', '结论']]);
      updBottle();
      hset('law', '气体对外做功 → 内能减少');
      drawScreenB('bottle');
    }
    bindStageDragOnce();
  },
  tick(dt) {
    if (workExp === 'ign') {
      stepIgniter(dt);
      drawScreenB('tt');
    } else {
      stepBottle(dt);
      drawScreenB('bottle');
    }
  },
};

/* 第 8 章：热力学第一定律 */
const secFirstLaw = {
  title: '热力学第一定律',
  group: '能量 · 热机',
  html: `<p>改变内能只有两条路：传热 <b>Q</b>（吸热为正）和做功 <b>W</b>（外界对气体做功为正）：</p>
<p><span class="hl">ΔU = Q + W</span>。内能变了，温度跟着变：对理想气体 ΔU = n·C<sub>V</sub>·ΔT；单原子气体 C<sub>V</sub> = 3R/2，双原子 5R/2。</p>
<p>四种典型过程一键演示：绝热压缩 / 绝热膨胀（Q = 0）/ 等温压缩（水浴补热）/ 等压加热。容器可切换加热台 / 恒温水浴 / 隔热套，活塞可锁可自由；屏 A 描出真实过程轨迹，右屏是能量账本 Q / W / ΔU。</p>`,
  enter() {
    clearChapterState();
    useScene('studio', buildStudio);
    resetMols();
    pistonLock = true;
    leverMode = { L: 'T', R: null };
    FL.Q = 0; FL.W = 0; FL.accumQ = 0; FL.accumW = 0;
    frameStation();
    clearSliderRefs();
    ctl.clear();
    const row = ctl.btnrow();
    row.add('绝热压缩', () => runProcess('ad-comp'));
    row.add('绝热膨胀', () => runProcess('ad-exp'));
    row.add('等温压缩', () => runProcess('isoT-comp'));
    row.add('等压加热', () => runProcess('isoP-heat'));
    ctl.sep();
    ctl.seg({
      label: '容器（热传递条件）', value: 'insulate', options: [
        { label: '隔热套 Q = 0', value: 'insulate' },
        { label: '恒温水浴', value: 'bath' },
        { label: '加热台', value: 'heater' },
      ], onChange: (v) => {
        heaterActive = v === 'heater' ? 'heat' : null;
        bathMode = v === 'bath' ? 'bath' : null;
        if (v === 'bath') hset('note', '恒温水浴：Q 自动补到 T=300K');
        if (v === 'heater') hset('note', '加热台：持续 Q > 0');
        if (v === 'insulate') hset('note', '隔热套：Q = 0');
      },
    });
    ctl.toggle({ label: '活塞锁住（等容）', value: true, onChange: (v) => { pistonLock = v; updHalfnut(); } });
    ctl.sep();
    ctl.slider({ label: '温度 T', min: 120, max: 650, step: 5, value: G.T, fmt: (v) => v + ' K', onInput: (v) => { G.T = clamp(v, 120, 650); onManualGasChange(); } });
    ctl.slider({ label: '体积 V（解锁后可用）', min: 0.2, max: 2.0, step: 0.02, value: G.V, fmt: (v) => v.toFixed(2) + ' L', onInput: (v) => { G.V = clamp(v, 0.2, 2.0); onManualGasChange(); } });
    ctl.sep();
    ctl.button({ label: '↺ 复位 T=300K · V=1.0L', onClick: () => { G.T = 300; G.V = 1.0; FL.accumQ = 0; FL.accumW = 0; tracePath = []; onManualGasChange(); drawScreenA('trace'); drawScreenB('ledger'); updFLHud(); } });
    buildHud([['p', '压强'], ['v', '体积'], ['t', '温度'], ['q', 'Q 吸热'], ['w', 'W 外界做功'], ['du', 'ΔU 内能变化'], ['note', '容器']]);
    gasBar();
    hset('q', '±0.0 kJ');
    hset('w', '±0.0 kJ');
    hset('du', '±0.0 kJ');
    hset('note', '隔热套：Q = 0');
    drawScreenA('trace');
    drawScreenB('ledger');
    gasUiHook = () => { gasBar(); updFLHud(); drawScreenA('trace'); drawScreenB('ledger'); };
    bindStageDragOnce();
  },
  tick(dt) { stepProcess(dt); },
};
/** 四种过程动画：沿 p-V 路径推进，累计 Q / W */
function runProcess(kind) {
  const n = G.nMol();
  const cv = G.cv();
  const V0 = G.V, T0 = G.T, p0 = G.pKPa();
  let V1 = V0, T1 = T0, Q = 0, W = 0, label = '';
  if (kind === 'ad-comp') {
    V1 = clamp(V0 * 0.62, 0.2, 2.0);
    T1 = G.adiabatT(T0, V0, V1);
    Q = 0; W = n * cv * (T1 - T0) / 1000;
    label = '绝热压缩（Q = 0，W > 0 → 内能增加）';
    pistonLock = false;
  } else if (kind === 'ad-exp') {
    V1 = clamp(V0 * 1.6, 0.2, 2.0);
    T1 = G.adiabatT(T0, V0, V1);
    Q = 0; W = n * cv * (T1 - T0) / 1000;
    label = '绝热膨胀（Q = 0，W < 0 → 内能减少）';
    pistonLock = false;
  } else if (kind === 'isoT-comp') {
    V1 = clamp(V0 * 0.62, 0.2, 2.0);
    T1 = T0;
    W = n * R * T0 * Math.log(V0 / V1) / 1000;
    Q = -W;
    label = '等温压缩（ΔU = 0，外界做功 W，放热 Q < 0）';
    pistonLock = false;
  } else {
    T1 = clamp(T0 * 1.32, 120, 650);
    V1 = clamp(V0 * T1 / T0, 0.2, 2.0);
    W = 0; Q = n * cv * (T1 - T0) / 1000;
    label = '等压加热（W = 0，Q > 0 → 内能增加）';
    pistonLock = false;
  }
  updHalfnut();
  FL.anim = { kind, t: 0, dur: 1.8, V0, T0, V1, T1, Q, W, label, n, cv };
  tracePath = [{ v: V0, p: p0 }];
  traceLabel = label;
  FL.accumQ = 0; FL.accumW = 0;
}
function stepProcess(dt) {
  stepDrive(dt);
  const a = FL.anim;
  if (a) {
    a.t += dt;
    const k = easeIO(clamp(a.t / a.dur, 0, 1));
    G.V = a.V0 + (a.V1 - a.V0) * k;
    G.T = a.T0 + (a.T1 - a.T0) * k;
    FL.accumQ = a.Q * k;
    FL.accumW = a.W * k;
    tracePath.push({ v: G.V, p: G.pKPa() });
    if (tracePath.length > 160) tracePath.shift();
    onManualGasChange();
    if (a.t >= a.dur) { FL.anim = null; updFLHud(); }
  }
  if (heaterActive === 'heat') { G.T = Math.min(G.T + dt * 22, 650); onManualGasChange(); }
  if (bathMode === 'bath' && !FL.anim) { G.T += (300 - G.T) * Math.min(dt * 0.8, 1); onManualGasChange(); }
  if (hud) {
    const { rate, pImp } = impactStats();
    /* 能量账本随动画持续刷新 */
  }
  drawScreenB('ledger');
}
function updFLHud() {
  const n = G.nMol();
  const cv = G.cv();
  const dU = FL.accumQ + FL.accumW;
  hset('q', (FL.accumQ >= 0 ? '+' : '') + FL.accumQ.toFixed(1) + ' kJ');
  hset('w', (FL.accumW >= 0 ? '+' : '') + FL.accumW.toFixed(1) + ' kJ');
  hset('du', (dU >= 0 ? '+' : '') + dU.toFixed(1) + ' kJ → ΔT = ' + (dU * 1000 / (n * cv)).toFixed(0) + ' K');
  gasBar();
}

/* 第 9 章：四冲程汽油机 */
let strokesCard = null;
const secEngine = {
  title: '四冲程汽油机',
  group: '能量 · 热机',
  html: `<p>这是一台剖开的单缸四冲程汽油机。曲轴转两圈，活塞上下各两次，完成一个工作循环：</p>
<p>① <b>吸气</b>：进气门打开，活塞下行，吸入汽油和空气的混合物；② <b>压缩</b>：两个气门关闭，活塞上行压缩混合物，<b>机械能转化为内能</b>；③ <b>做功</b>：火花塞点火，燃气猛烈膨胀推动活塞下行，<b>内能转化为机械能</b>——只有这个冲程对外做功；④ <b>排气</b>：排气门打开，活塞上行排出废气。其余三个冲程靠飞轮的惯性完成。</p>
<p>左屏是对应的理想循环（奥托循环）：围成的面积就是每个循环对外做的净功。提高<b>压缩比</b>，效率 η = 1 − 1/r<sup>γ−1</sup> 变高。</p>
<p>切换到<b>赛车 V8</b>：两排各 4 个缸，按 1-8-4-3-6-5-7-2 的顺序点火，曲轴每转 90° 就有一个缸做功，任何时刻总有两个缸在推曲轴。右屏比较两种发动机的转矩：单缸一圈里大起大落、大部分时间靠飞轮硬撑，V8 的转矩几乎是一条平稳的线——这就是多缸发动机运转平顺的原因。</p>`,
  enter() {
    clearChapterState();
    leverMode = { L: null, R: null };
    ctl.clear();
    ctl.seg({
      label: '发动机类型', value: ENG.engine, options: [
        { label: '单缸剖面', value: 'single' },
        { label: '赛车 V8', value: 'v8' },
      ], onChange: (v) => { ENG.engine = v; secEngine.enter(); },
    });
    if (ENG.engine === 'single') {
      useScene('engine', buildEngine);
      frameStation();
    } else {
      useScene('v8', buildV8);
      camTo([3.0, 2.5, 5.2], [0, 1.6, 0], 1.1);
    }
    clearSliderRefs();
    strokesCard = buildStageCard('thm-strokes', '一个工作循环');
    const rowsBox = document.createElement('div');
    strokesCard.appendChild(rowsBox);
    const noteBox = document.createElement('div');
    noteBox.className = 'stroke-note';
    strokesCard.appendChild(noteBox);
    ['吸气', '压缩', '做功', '排气'].forEach((t, i) => {
      const r = document.createElement('div');
      r.className = 'stroke-row';
      r.innerHTML = '<span class="no">' + ['①', '②', '③', '④'][i] + '</span><span>' + t + '</span>';
      r.addEventListener('click', () => { ENG.theta = i * Math.PI; ENG.running = false; refreshStrokes(); });
      rowsBox.appendChild(r);
    });
    STN.strokeRows = rowsBox;
    STN.strokeNote = noteBox;
    ctl.sep();
    const row = ctl.btnrow();
    row.add('下一冲程', () => { ENG.theta += Math.PI / 2; ENG.running = false; });
    row.add('下一次点火', () => { const deg = ((ENG.theta * 180 / Math.PI) % 720 + 720) % 720; ENG.theta += (360 - (deg % 360)) * Math.PI / 180; ENG.running = false; });
    ctl.sep();
    ctl.toggle({ label: '自动运转（空格也可暂停/继续）', value: ENG.running, onChange: (v) => { ENG.running = v; if (v && soundOn) sfx.engineStart(); if (!v) sfx.engOff(); } });
    ctl.slider({ label: '转速（慢放）', min: 30, max: 7000, step: 10, value: ENG.rpm, fmt: (v) => (v >= 1000 ? (v / 1000).toFixed(1) + ' 千转' : v + ' 转/min'), onInput: (v) => { ENG.rpm = clamp(v, 30, 7000); ENG.slowMo = ENG.rpm > 400 ? 0.08 : 1; } });
    const row2 = ctl.btnrow();
    row2.add('怠速 900 转', () => { ENG.rpm = 900; ENG.running = true; ENG.slowMo = 0.08; syncEngineUI(); });
    row2.add('红线 7000 转', () => { ENG.rpm = 7000; ENG.running = true; ENG.slowMo = 0.05; syncEngineUI(); });
    ctl.sep();
    ctl.slider({ label: '压缩比 r', min: 6, max: 13, step: 0.5, value: ENG.cr, fmt: (v) => v.toFixed(1) + ' : 1', onInput: (v) => { ENG.cr = clamp(v, 6, 13); computeEngStats(); } });
    ctl.button({ label: '⤒ 提高压缩比（效率 ↑）', onClick: () => { ENG.cr = Math.min(ENG.cr + 1, 13); computeEngStats(); syncEngineUI(); toast('压缩比提高到 ' + ENG.cr.toFixed(1) + ' : 1，理想效率 ' + ((1 - 1 / Math.pow(ENG.cr, 0.4)) * 100).toFixed(0) + '%。'); } });
    buildHud([['stroke', '当前冲程'], ['crank', '曲轴转角'], ['rpm', '转速'], ['eta', '理想效率（奥托）'], ['work', '每循环净功'], ['firing', '发火顺序']]);
    hset('firing', ENG.engine === 'v8' ? '1-8-4-3-6-5-7-2 · 每 90° 一次' : '单缸 · 每 720° 一次');
    computeEngStats();
    drawScreenA('otto');
    drawScreenB(ENG.engine === 'v8' ? 'torque' : 'otto-info');
    if (ENG.running && soundOn) sfx.engineStart();
    bindStageDragOnce();
  },
  tick(dt) {
    stepEngine(dt);
    if (ENG.engine === 'single') drawScreenA('otto');
    refreshStrokes();
    if (soundOn && ENG.running) {
      if (ENG.engine === 'single') sfx.engineSet(ENG.rpm, 1); else sfx.engineSet(ENG.rpm, 8);
    }
    if (hud) {
      const eta = 1 - 1 / Math.pow(ENG.cr, 0.4);
      hset('eta', (eta * 100).toFixed(0) + '%（r = ' + ENG.cr.toFixed(1) + '，γ = 1.4）');
      hset('work', ENG.netWork.toFixed(0) + ' J');
    }
  },
  leave() {
    sfx.engOff();
    removeStageCard();
    strokesCard = null;
  },
};
function syncEngineUI() {
  const s = document.querySelector('#controls input[type=range]');
  if (s) s.value = ENG.rpm;
}
function refreshStrokes() {
  if (!STN.strokeRows) return;
  const deg = ((ENG.theta * 180 / Math.PI) % 720 + 720) % 720;
  const idx = Math.floor(deg / 180);
  STN.strokeRows.querySelectorAll('.stroke-row').forEach((r, j) => r.classList.toggle('on', j === idx));
  if (STN.strokeNote) {
    STN.strokeNote.innerHTML = STROKE_TEXT[idx] + (ENG.engine === 'v8'
      ? '<div class="stroke-extra"><b>赛车 V8</b>　两排各 4 个缸，夹角 90°，按 1-8-4-3-6-5-7-2 的顺序点火：曲轴每转 90° 就有一个缸做功。</div>'
      : '<div class="stroke-extra"><b>单缸</b>　一圈里只有做功冲程出力，其余 540° 靠飞轮的惯性硬撑。</div>');
  }
}

/* 第 10 章：热机效率与卡诺循环 */
const secCarnot = {
  title: '热机效率与卡诺循环',
  group: '能量 · 热机',
  html: `<p>热机把<b>吸收的热 Q₁</b> 一部分变成有用功 W，其余排给冷源 Q₂：<span class="hl">η = W/Q₁ = 1 − Q₂/Q₁ = 1 − T₂/T₁</span>。</p>
<p>卡诺证明：在温度 T₁（热源）与 T₂（冷源）之间工作的理想热机，效率存在上限——与用什么工质无关。p–V 图上的闭合曲线（两条等温线 + 两条绝热线）围出的面积就是每次循环的净功；循环经过 ① 等温膨胀 → ② 绝热膨胀 → ③ 等温压缩 → ④ 绝热压缩 四段。</p>
<p>拧 T₁、T₂（或点「温差最大 / 温差很小」）看效率上限怎么变：想更高效，要么烧得更热，要么把废热排得更冷——上限永远小于 100%。</p>`,
  enter() {
    clearChapterState();
    useScene('studio', buildStudio);
    resetMols();
    pistonLock = true;
    leverMode = { L: null, R: null };
    frameStation();
    clearSliderRefs();
    ctl.clear();
    ctl.slider({ label: '高温热源 T₁', min: 400, max: 900, step: 10, value: CAR.T1, fmt: (v) => v + ' K', onInput: (v) => { CAR.T1 = clamp(v, 400, 900); drawScreenA('carnot'); drawScreenB('carnot4'); updCarnotHud(); } });
    ctl.slider({ label: '低温热源 T₂', min: 250, max: 400, step: 10, value: CAR.T2, fmt: (v) => v + ' K', onInput: (v) => { CAR.T2 = clamp(v, 250, 400); drawScreenA('carnot'); drawScreenB('carnot4'); updCarnotHud(); } });
    ctl.sep();
    const row = ctl.btnrow();
    row.add('温差最大', () => { CAR.T1 = 900; CAR.T2 = 250; syncCarnotSliders(); drawScreenA('carnot'); drawScreenB('carnot4'); updCarnotHud(); });
    row.add('温差很小', () => { CAR.T1 = 420; CAR.T2 = 390; syncCarnotSliders(); drawScreenA('carnot'); drawScreenB('carnot4'); updCarnotHud(); });
    ctl.sep();
    ctl.slider({ label: '循环速度', min: 0.05, max: 0.8, step: 0.05, value: CAR.speed, fmt: (v) => '×' + (v / 0.24).toFixed(1), onInput: (v) => { CAR.speed = v; } });
    ctl.toggle({ label: '循环动画（空格暂停/继续）', value: CAR.animate, onChange: (v) => { CAR.animate = v; } });
    ctl.button({ label: '↺ 回到 A 点', onClick: () => { CAR.t = 0; } });
    buildHud([['eta', '卡诺效率'], ['seg', '当前段'], ['w', '净功'], ['q2', '排给冷源'], ['note', '提示']]);
    updCarnotHud();
    drawScreenA('carnot');
    drawScreenB('carnot4');
    gasUiHook = () => {};
    bindStageDragOnce();
  },
  tick(dt) {
    if (CAR.animate) CAR.t += dt * CAR.speed * 4;
    drawScreenA('carnot');
    drawScreenB('carnot4');
    hset('seg', '第 ' + (CAR.segNow + 1) + ' 段 · ' + CARNOT_SEG[CAR.segNow].name);
  },
};
function syncCarnotSliders() {
  const inputs = document.querySelectorAll('#controls input[type=range]');
  if (inputs[0]) inputs[0].value = CAR.T1;
  if (inputs[1]) inputs[1].value = CAR.T2;
}
function updCarnotHud() {
  const eta = 1 - CAR.T2 / CAR.T1;
  hset('eta', (eta * 100).toFixed(0) + ' %');
  hset('w', '每次循环输出净功（围成面积）');
  hset('q2', 'Q₂ = Q₁ · T₂/T₁');
  hset('note', 'T₂ 越低或 T₁ 越高 → η 越大，永远 < 100%');
}

/* 第 11 章：热力学第二定律（双实验选择） */
let law2Exp = 'gas';
const secSecondLaw = {
  title: '热力学第二定律',
  group: '方向 · 自由',
  html: `<p><b>气体自由膨胀</b>：隔板一抽开，左腔的气体会迅速铺满整个箱子。反过来——让所有分子自己退回左半边——从来没有人见过。点「◀◀ 倒放」，看到的就是这个"不可能"的过程。症结在概率：单个分子留在左半的几率是一半，N 个分子<b>同时</b>挤回左半的几率就是 (1/2)<sup>N</sup>。4 个分子偶有可能齐刷刷回去；换成 200 个，这个几率小到等上宇宙的年纪也见不到一回。</p>
<p><b>冷热铜块接触</b>：两块一碰，热自动从热的那块流向冷的那块，直到两块一样冷热；让冷的越冷、热的越热的「反向输运」从不自己发生。</p>
<p><b>热力学第二定律</b>：热量不会自发地从低温物体流向高温物体（<b>克劳修斯表述</b>）；也不存在只从单一热源吸热、把它全部变成功而不留任何其他影响的热机（<b>开尔文表述</b>）。一切与热现象相关的宏观自然过程都具有<b>不可逆性</b>。</p>`,
  enter() {
    clearChapterState();
    law2Exp = law2Exp || 'gas';
    leverMode = { L: null, R: null };
    ctl.clear();
    ctl.seg({
      label: '选择实验', value: law2Exp, options: [
        { label: '气体自由膨胀', value: 'gas' },
        { label: '冷热铜块接触', value: 'cu' },
      ], onChange: (v) => { law2Exp = v; secSecondLaw.enter(); },
    });
    if (law2Exp === 'gas') {
      useScene('diffuse', buildDiffuse);
      frameStation();
      clearSliderRefs();
      ctl.sep();
      ctl.slider({ label: '分子数 N', min: 4, max: 200, step: 4, value: DIFF.N, fmt: (v) => v + ' 个', onInput: (v) => { DIFF.N = clamp(v, 4, 200); resetDiff(); } });
      const row = ctl.btnrow();
      row.add('只有 4 个分子', () => { DIFF.N = 4; resetDiff(); });
      row.add('200 个分子', () => { DIFF.N = 200; resetDiff(); });
      ctl.sep();
      const row2 = ctl.btnrow();
      row2.add('抽掉隔板（自发扩散）', () => playDiff(false));
      row2.add('◀◀ 倒放', () => playDiff(true));
      row2.add('↺ 复位', () => resetDiff());
      buildHud([['left', '左边的分子数'], ['prob', '全部回到左边的概率'], ['tier', '量级感受'], ['state', '状态'], ['law', '第二定律']]);
      resetDiff();
      hset('law', '孤立系统：自发过程有方向');
      drawScreenB('dist2');
      bindStageDragOnce();
    } else {
      useScene('copper', buildCopper);
      frameStation();
      clearSliderRefs();
      ctl.sep();
      const row = ctl.btnrow();
      row.add('让它们接触', () => touchCopper());
      row.add('◀◀ 倒放', () => rewindCopper());
      row.add('↺ 复位', () => resetCopper());
      buildHud([['th', '热块温度'], ['tc', '冷块温度'], ['dir', '热量的方向'], ['sum', '两块总温'], ['law', '第二定律']]);
      resetCopper();
      hset('law', '克劳修斯表述：热量不能自发地从低温物体传到高温物体');
      drawScreenB('temp2');
      bindStageDragOnce();
    }
  },
  tick(dt) {
    if (law2Exp === 'gas') stepDiffuse(dt);
    else stepCopper(dt);
  },
};

/* 第 12 章：自由实验 */
const secFree = {
  title: '自由实验',
  group: '方向 · 自由',
  html: `<p>所有控件都打开了：活塞自由、用手轮推拉或锁住；加热台、恒温水浴或隔热套；单原子或双原子气体。</p>
<p>试着设计一个循环：先<b>等容加热</b>，再<b>等压膨胀</b>，再<b>等容冷却</b>，最后<b>等压压缩</b>，看看 p–V 图上围成的面积，和右屏累计的功。</p>
<p>比较单原子和双原子气体：同样的绝热压缩，哪个温度升得更高？为什么？（提示：C<sub>V</sub> 不同，同样的 W 换来不同的 ΔT。）</p>`,
  enter() {
    clearChapterState();
    useScene('studio', buildStudio);
    resetMols();
    pistonLock = false;
    leverMode = { L: 'T', R: 'V' };
    frameStation();
    clearSliderRefs();
    ctl.clear();
    gasSliders({ N: true, T: true, V: true });
    ctl.sep();
    ctl.seg({
      label: '容器（热传递条件）', value: 'insulate', options: [
        { label: '隔热套 Q = 0', value: 'insulate' },
        { label: '恒温水浴', value: 'bath' },
        { label: '加热台', value: 'heater' },
        { label: '制冷台', value: 'cooler' },
      ], onChange: (v) => {
        heaterActive = v === 'heater' ? 'heat' : v === 'cooler' ? 'cool' : null;
        bathMode = v === 'bath' ? 'bath' : null;
      },
    });
    ctl.toggle({ label: '活塞锁住（等容）', value: false, onChange: (v) => { pistonLock = v; updHalfnut(); } });
    ctl.seg({
      label: '气体种类（比热比 γ）', value: G.gas, options: [
        { label: '单原子 γ = 5/3', value: 'mono' },
        { label: '双原子 γ = 7/5', value: 'di' },
      ], onChange: (v) => { G.gas = v; hset('gamma', v === 'mono' ? '单原子 Cᵥ = 3R/2' : '双原子 Cᵥ = 5R/2'); },
    });
    ctl.sep();
    const row = ctl.btnrow();
    row.add('↺ 全部复位', () => { G.N = 70; G.T = 300; G.V = 1.0; G.gas = 'mono'; heaterActive = null; bathMode = null; tracePath = []; resetMols(); onManualGasChange(); });
    buildHud([['p', '压强'], ['v', '体积'], ['t', '温度'], ['n', '物质的量'], ['pv', 'pV 乘积'], ['gamma', '气体']]);
    gasBar();
    hset('gamma', G.gas === 'mono' ? '单原子 Cᵥ = 3R/2' : '双原子 Cᵥ = 5R/2');
    hset('pv', (G.pKPa() * G.V).toFixed(1) + ' kPa·L');
    drawScreenA('trace');
    drawScreenB('dist');
    gasUiHook = () => { gasBar(); hset('gamma', G.gas === 'mono' ? '单原子 Cᵥ = 3R/2' : '双原子 Cᵥ = 5R/2'); hset('pv', (G.pKPa() * G.V).toFixed(1) + ' kPa·L'); };
    bindStageDragOnce();
  },
};

/* =====================================================================
 * 布局驱动（三栏 / 折叠 / 专注 / 课堂 / 手风琴 / 快捷键 / 启动）
 * ===================================================================== */

const thmShell = document.getElementById('thmShell');
const chapNav = document.getElementById('chapNav');
const chapCount = document.getElementById('chapCount');
const detailNo = document.getElementById('detailNo');
const detailTitle = document.getElementById('detailTitle');
const lessonEl = document.getElementById('lesson');
const controlsEl2 = document.getElementById('controls');
const detailBody = document.getElementById('detailBody');

SECTIONS.push(secStation, secKinetic, secPressure, secBoyle, secGay, secCharles,
  secWork, secFirstLaw, secEngine, secCarnot, secSecondLaw, secFree);

let chapterIdx = 0;
let lastSection = null;

/* 左栏章节列表（编组行 + 章节按钮） */
const chapBtns = [];
{
  let gi = 0;
  while (gi < SECTIONS.length) {
    const gh = document.createElement('div');
    gh.className = 'chap-group';
    const gr = SECTIONS[gi].group;
    gh.textContent = gr;
    chapNav.appendChild(gh);
    while (gi < SECTIONS.length && SECTIONS[gi].group === gr) {
      const i = gi;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'chap-btn';
      b.dataset.idx = String(i);
      const n = document.createElement('span');
      n.className = 'chap-n';
      n.textContent = String(i + 1).padStart(2, '0');
      const tt = document.createElement('span');
      tt.className = 'chap-t';
      tt.textContent = SECTIONS[i].title;
      b.append(n, tt);
      b.addEventListener('click', () => selectChapter(i));
      chapNav.appendChild(b);
      chapBtns.push(b);
      gi++;
    }
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
  chapCount.textContent = String(chapterIdx + 1).padStart(2, '0') + '/' + String(SECTIONS.length).padStart(2, '0');
  detailNo.textContent = String(chapterIdx + 1).padStart(2, '0');
  detailTitle.textContent = sec.title;
  railNoL.textContent = String(chapterIdx + 1).padStart(2, '0');
  railTitleR.textContent = sec.title;
  lessonEl.innerHTML = sec.html || '';
  history.replaceState(null, '', '#' + (chapterIdx + 1));
  sfx.engOff();
  if (lastSection && lastSection.leave) lastSection.leave();
  lastSection = sec;
  if (activeCleanup) { activeCleanup(); activeCleanup = null; }
  chapterTick = null;
  hud = null;
  chapterPlayToggle = null;
  sec.enter();
  if (typeof sec.tick === 'function') chapterTick = (dt) => sec.tick(dt);
  accSecs.controls.classList.toggle('acc-empty', !controlsEl.children.length);
  accSecs.data.classList.toggle('acc-empty', !document.querySelector('#thmData .hud-card'));
  detailBody.scrollTop = 0;
}

/* 栏折叠 × 专注模式 */
const foldLBtn = document.getElementById('foldLBtn');
const unfoldLBtn = document.getElementById('unfoldLBtn');
const foldRBtn = document.getElementById('foldRBtn');
const unfoldRBtn = document.getElementById('unfoldRBtn');
const railNoL = document.getElementById('railNoL');
const railTitleR = document.getElementById('railTitleR');
const focusBtn = document.getElementById('focusBtn');
const FOLD_KEY = { l: 'thermo.foldL', r: 'thermo.foldR' };
let foldL = false;
let foldR = false;
let focusSaved = null;
try {
  foldL = localStorage.getItem(FOLD_KEY.l) === '1';
  foldR = localStorage.getItem(FOLD_KEY.r) === '1';
} catch (e) { /* localStorage 不可用时仅会话内生效 */ }
function applyShellFold() {
  thmShell.classList.toggle('fold-l', foldL);
  thmShell.classList.toggle('fold-r', foldR);
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
  thmShell.classList.toggle('focus-mode', on);
  focusBtn.textContent = on ? '退出专注' : '专注模式';
  focusBtn.setAttribute('aria-pressed', String(on));
  applyShellFold();
}
function toggleFold(side) {
  if (focusSaved !== null) setFocus(false);
  if (classroom) setClassroom(false);   // 课堂模式下栏内容浮于舞台，先退出再折
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

/* 右栏三块手风琴（详解 / 控件 / 读数），localStorage 记忆、切章不重置 */
const ACC_KEYS = { lesson: 'thermo.accLesson', controls: 'thermo.accControls', data: 'thermo.accData' };
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
  const sec2 = accSecs[name];
  sec2.classList.toggle('closed', accClosed[name]);
  sec2.querySelector('.acc-head').setAttribute('aria-expanded', String(!accClosed[name]));
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

/* 上一/下一章 + 舞台工具 */
const chapPrev = document.getElementById('chapPrev');
const chapNext = document.getElementById('chapNext');
const viewBtn = document.getElementById('viewBtn');
const fsBtn = document.getElementById('fsBtn');
function gotoChapter(i) { selectChapter((i + SECTIONS.length) % SECTIONS.length); }
chapPrev.addEventListener('click', () => gotoChapter(chapterIdx - 1));
chapNext.addEventListener('click', () => gotoChapter(chapterIdx + 1));
viewBtn.addEventListener('click', () => { frameStation(); tourIdx = -1; });
fsBtn.addEventListener('click', () => {
  if (document.fullscreenElement) document.exitFullscreen();
  else document.documentElement.requestFullscreen?.().catch(() => toast('浏览器拒绝了全屏请求。'));
});

/* 显示标签开关 */
const labelBtn = document.getElementById('labelBtn');
let labelsOn = true;
labelBtn.addEventListener('click', () => {
  labelsOn = !labelsOn;
  setLabelsVisible(labelsOn);
  labelBtn.textContent = labelsOn ? '显示标签' : '隐藏标签';
  labelBtn.classList.toggle('active', !labelsOn);
  toast(labelsOn ? '台面部件标签已显示。' : '台面部件标签已隐藏。');
});

/* 声音开关（推拉杆 / 面板 / 发动机音效） */
const soundBtn = document.getElementById('soundBtn');
let soundOn = true;
soundBtn.addEventListener('click', () => {
  soundOn = sfx.toggle();
  soundBtn.textContent = soundOn ? '声音 开' : '声音 关';
  soundBtn.classList.toggle('active', !soundOn);
  if (!soundOn) sfx.engOff();
  else if (ENG.running && activeSceneKey !== null && (activeSceneKey === 'engine' || activeSceneKey === 'v8')) sfx.engineStart();
});

/* 课堂模式 */
const classroomBtn = document.getElementById('classroomBtn');
let classroom = false;
let classroomSaved = null;
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
  thmShell.classList.toggle('classroom', classroom);
  classroomBtn.classList.toggle('active', classroom);
  classroomBtn.textContent = classroom ? '退出课堂' : '课堂模式';
  applyShellFold();
  toast(classroom ? '课堂模式：舞台放大，讲解与读数浮于右侧。' : '已退出课堂模式。');
}
classroomBtn.addEventListener('click', () => setClassroom(!classroom));

/* 画质优先 / 流畅度优先 */
const qualityBtn = document.getElementById('qualityBtn');
const QUALITY_KEY = 'thermo.quality';
let hiQuality = true;
try { hiQuality = localStorage.getItem(QUALITY_KEY) !== '0'; } catch (e) { /* 忽略 */ }
function applyQuality() {
  const pr = hiQuality ? Math.min(window.devicePixelRatio || 1, 2) : 1;
  app.renderer.setPixelRatio(pr);
  vfx.composer.setPixelRatio(pr);
  qualityBtn.textContent = hiQuality ? '画质优先' : '流畅优先';
  qualityBtn.classList.toggle('active', !hiQuality);
}
qualityBtn.addEventListener('click', () => {
  hiQuality = !hiQuality;
  try { localStorage.setItem(QUALITY_KEY, hiQuality ? '1' : '0'); } catch (e) { /* 忽略 */ }
  applyQuality();
  toast(hiQuality ? '画质优先：满分辨率渲染。' : '流畅优先：1x 渲染，帧率更稳。');
});
applyQuality();

/* 重做实验 */
const redoBtn = document.getElementById('redoBtn');
redoBtn.addEventListener('click', () => {
  G.N = 70; G.T = 300; G.V = 1.0; G.gas = 'mono'; G.slow = false;
  workExp = 'ign'; law2Exp = 'gas'; ENG.engine = 'single';
  tourIdx = -1;
  selectChapter(chapterIdx);
  toast('已恢复默认参数，从头开始。');
});

/* 台面拖拽（首次交互时绑定一次） */
let dragBound = false;
function bindStageDragOnce() {
  if (!dragBound) { bindStageDrag(); dragBound = true; }
}

/* 键盘快捷键（←→ 或 ,/. 切章 / ] 折叠 / R 或 Esc 复位视角 / F 全屏 / 空格 播放） */
window.addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const t = e.target;
  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
  if (e.key === 'ArrowLeft' || e.key === ',') gotoChapter(chapterIdx - 1);
  else if (e.key === 'ArrowRight' || e.key === '.') gotoChapter(chapterIdx + 1);
  else if (e.key === ']') toggleFold('r');
  else if (e.key === 'r' || e.key === 'R' || e.key === 'Escape') { frameStation(); toast('已返回实验台视角。'); }
  else if (e.key === 'f' || e.key === 'F') fsBtn.click();
  else if (e.key === ' ') {
    e.preventDefault();
    if (activeSceneKey === 'engine' || activeSceneKey === 'v8') {
      ENG.running = !ENG.running;
      const tog = document.querySelector('#controls .ctl-toggle input');
      if (tog) tog.checked = ENG.running;
      if (ENG.running && soundOn) sfx.engineStart(); else sfx.engOff();
    } else if (chapterPlayToggle) chapterPlayToggle();
  }
});
/* 章内播放切换钩子（空格） */
let chapterPlayToggle = null;

/* ================= 帧循环与启动 ================= */

let labReady = false;
let redrawT = 0;

app.onFrame((dt) => {
  if (!labReady) return;
  if (chapterTick) chapterTick(dt);
  const key = activeSceneKey;
  if (key === 'studio') {
    stepDrive(dt);
    stepHeater(dt);
    stepMols(dt);
    /* 主场景内实时重绘（节流） */
    redrawT += dt;
    if (redrawT >= 0.15) {
      redrawT = 0;
      if (screenBMode === 'dist' || screenBMode === 'impact') drawScreenB(screenBMode);
      if (screenAMode === 'carnot' && CAR.animate) drawScreenA('carnot');
      if (screenAMode === 'otto' && ENG.running) drawScreenA('otto');
    }
  } else if (key === 'engine' || key === 'v8') {
    stepEngine(0);   // tick 内已推进；此处仅兜底联动
  }
});

/* 屏幕模式记录（供节流重绘） */
let screenAMode = 'plain';
let screenBMode = 'dist';
{
  const _a = drawScreenA, _b = drawScreenB;
  drawScreenA = function (mode) { screenAMode = mode; return _a(mode); };
  drawScreenB = function (mode) { screenBMode = mode; return _b(mode); };
}

function boot() {
  labReady = true;
  loader.hide();
  window.__thermoSections = { select: selectChapter };
  window.__thermoDebug = { vfx, app, stats: () => vfx.stats() };
  const h = parseInt(location.hash.slice(1), 10);
  const start = Number.isFinite(h) && h >= 1 && h <= SECTIONS.length ? h - 1 : 0;
  selectChapter(start);
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
