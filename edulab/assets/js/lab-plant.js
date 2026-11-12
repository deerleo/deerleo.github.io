/* EduLab · 植物的一生（plant）— Micro 级深改
 * 12 章：一株菜豆 / 种子萌发的条件 / 种子的结构 / 幼苗出土与黄化 / 根系伸长与向地反应 /
 *        光照强弱与光合速率 / 绿叶见光合成淀粉 / 蒸腾作用 / 向光性与生长素 / 开花与结果 /
 *        自由培养 / 随堂检测
 * 工艺：three.js 程序化温室花房——木架操作台 + 砖墙裙 + 玻璃暖房 + 园艺道具（陶盆/育苗盘/喷壶/移栽铲/标签/玻璃罐），
 *       菜豆全株按生理日程参数化生长（弯钩出土→子叶→真叶→三出复叶→蝶形花→豆荚鼓粒），
 *       茎走 Frenet 放样变径管，叶走轮廓贝塞尔 + 叶脉 CanvasTexture + 杯状拱曲，花走蝶形花冠五件套，
 *       根系走渐细侧枝阵列 + 根毛 + 根瘤，种子走种脐/种孔/种脊细节件。
 * 交互：萌发四杯对照 / 种子解剖（浸泡·干种子 / 菜豆·玉米） / 黑罩黄化 / 根箱横放+转动 /
 *       金鱼藻气泡+灯距+昼夜光源组合 / 萨克斯五步（隔水加热装置） / 蒸腾双枝对照+风扇 /
 *       向光性五标本+暗箱开窗 / 授粉结荚+豆荚剖开 / 自由培养四旋钮 / 随堂检测。
 * 依赖：edu-core（three 场景与控件）+ edu-vfx（后处理管线 / 色板 / 材质工厂 / 程序化纹理）。
 */
import {
  THREE, TAU, clamp,
  createApp, makeLoader, makeHUD, makeTextSprite, setSpriteText, makeGlowTexture,
} from './edu-core.js';
import {
  attachVFX, PAL,
  matSheen, matCoat, matStd, matGlow,
  makeWoodTexture, makeLabelTexture, makeStudioEnvironment, fbm3, ghostify,
} from './edu-vfx.js';

/* ---------------- 色板（PAL 植物族 + 温室场景族；裸色仅在此登记） ---------------- */

const COL = {
  // 茎叶族（PAL 植物绿系衍生）
  stem: 0x3d8a40, stemDeep: 0x27662e, stemHi: 0x63a84e,
  leaf: 0x3f9142, leafDeep: 0x1e5c2c, leafVein: 0x8fce9e, leafVeinDark: 0x2c7038,
  pale: 0xd9d078, etiolate: 0xc9bd6a, cotyledon: 0x8fb554,
  // 花荚族
  petal: 0xf0b8cd, petalHi: 0xfadcea, keel: 0xf3ecd9, calyx: 0x4f8f3a,
  pod: 0x6fae4e, podRipe: 0xa8b86a, seedSkin: 0xc9a86a, seedDeep: 0x9a7c48,
  // 根族
  root: 0xe2d4ae, rootDeep: 0xb9a87e, rootTip: 0xd9534f, nodule: 0xb98f5e,
  // 场景族（温室）
  soil: 0x54402a, soilWet: 0x3e3222, gravel: 0x8a8578, brick: 0x9c5f43, brickJoint: 0xc8b49a,
  terra: 0xb06a44, terraDeep: 0x8a4f30, wood: 0x8a6844, woodDeep: 0x5e4630,
  water: 0x4a90d9, glassTint: 0xbfe3f2, foil: 0xb9c2cc,
  // 实验化学族
  iodine: 0x8a5a2a, starchBlue: 0x2b3166, alcohol: 0xd8e8c8, auxin: 0xe8b23f,
  flame: 0xffb347, glowWarm: 0xffd88a, marker: 0xe8674a,
  brass: PAL.brass, steel: PAL.steel, paper: PAL.paper, ink: PAL.ink,
};

/* ---------------- 场景与后处理接入（暖调棚拍 + ACES） ---------------- */

/** 玻璃材质（去 transmission 版）。three r170 含 transmission 的材质会触发整场景透射渲染
 *  pass（renderTransmissionPass），把不透明列表每帧多画一遍——温室玻璃件多，一律走本工厂：
 *  普通透明物理材质 + clearcoat 高光 + forceSinglePass（免 transparent+DoubleSide 双 pass），
 *  观感保持"亮面玻璃"，draw call 预算守得住。 */
function matGlassLite(color, o = {}) {
  const m = matCoat(color, {
    roughness: o.roughness ?? 0.06,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.12,
    transparent: true,
    opacity: o.opacity ?? 0.26,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  m.forceSinglePass = true;
  return m;
}

const stage = document.getElementById('stage');
const loader = makeLoader(stage, '正在搭建温室…');
const app = createApp({
  container: stage,
  keepBackground: true,
  fov: 42,
  cameraPos: [2.7, 1.45, 3.2],
  target: [0, 0.72, 0],
  minDistance: 0.55,
  maxDistance: 26,
});
const vfx = attachVFX(app, 'illus', { bg: 'studio-warm' });
const { scene, camera, controls } = app;
scene.environment = makeStudioEnvironment(app.renderer);

/* 光照组：主暖光（日光，可调）+ 补光 + 反弹 + 半球环境 */
const hemi = new THREE.HemisphereLight(0xcfe0d8, 0x4a3a28, 0.62);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff0d2, 1.75);
sun.position.set(3.6, 5.4, 2.6);
sun.castShadow = false;
scene.add(sun);
const fill = new THREE.DirectionalLight(0x9fb4cc, 0.34);
fill.position.set(-3.2, 2.2, 1.4);
scene.add(fill);
const bounce = new THREE.DirectionalLight(0xe8b98a, 0.24);
bounce.position.set(-1.4, 0.8, -3.0);
scene.add(bounce);
const amb = new THREE.AmbientLight(0xffffff, 0.2);
scene.add(amb);

const DAY_LIGHT = { sun: 1.75, hemi: 0.62, amb: 0.2 };
const NIGHT_LIGHT = { sun: 0.12, hemi: 0.2, amb: 0.3 };
function setDaylight(k) {          // k: 1=正午 0=夜
  sun.intensity = DAY_LIGHT.sun + (NIGHT_LIGHT.sun - DAY_LIGHT.sun) * (1 - k);
  hemi.intensity = DAY_LIGHT.hemi + (NIGHT_LIGHT.hemi - DAY_LIGHT.hemi) * (1 - k);
  amb.intensity = DAY_LIGHT.amb + (NIGHT_LIGHT.amb - DAY_LIGHT.amb) * (1 - k);
}
setDaylight(1);

/* ---------------- 通用工具 ---------------- */

const world = new THREE.Group();
scene.add(world);
const ctl = createControlsPanelMount();
let hud = null;
let chapterTick = null;
let activeCleanup = null;

function createControlsPanelMount() {
  // 复用 lab.css 的 ctl 样式，容器在右栏「实验控件」手风琴里
  return buildControls(document.getElementById('controls'));
}
function buildControls(el) {
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
    button({ label: text, active = false, onClick }) {
      const b = document.createElement('button'); b.type = 'button';
      b.className = 'ctl-btn' + (active ? ' active' : ''); b.textContent = text;
      b.addEventListener('click', () => onClick(b)); el.appendChild(b);
      return b;
    },
    seg({ options, value, onChange }) {
      const btns = [];
      const paint = () => btns.forEach(({ b, v }) => b.classList.toggle('active', v === value));
      options.forEach((opt) => btns.push({ b: api.button({ label: opt.label, onClick: () => { value = opt.value; paint(); onChange(value); } }), v: opt.value }));
      paint();
      return { set(v) { value = v; paint(); onChange(v); } };
    },
    btnrow() {
      const row = document.createElement('div'); row.className = 'lc-btnrow'; el.appendChild(row);
      return {
        add(label, onClick, active = false) {
          const b = document.createElement('button'); b.type = 'button';
          b.className = 'ctl-btn' + (active ? ' active' : ''); b.textContent = label;
          b.addEventListener('click', () => onClick(b)); row.appendChild(b);
          return b;
        },
        el: row,
      };
    },
  };
  return api;
}
function buildHud(rows) {
  const box = document.getElementById('lcData');
  box.innerHTML = '';
  hud = makeHUD(box, rows);
  return hud;
}
function camTo(pos, target, dur) {
  if (dur) vfx.flyTo(pos, target, dur); else app.setCamera(pos, target);
}
function clearGroup(g) {
  g.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) {
      if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose());
      else o.material.dispose();
    }
  });
  g.clear();
}
const smooth = (t) => t * t * (3 - 2 * t);
function growSeg(d0, d1, t0 = 0, t1 = 1) {
  return (day) => t0 + (t1 - t0) * clamp((day - d0) / (d1 - d0), 0, 1);
}

/* ---------------- 程序化纹理工厂（温室 + 植物细节） ---------------- */

/** 接触阴影（径向衰减黑晕，贴地片用） */
function makeShadowTexture() {
  const S = 256;
  const cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const ctx = cv.getContext('2d');
  const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, 'rgba(8,10,14,0.5)');
  g.addColorStop(0.55, 'rgba(8,10,14,0.24)');
  g.addColorStop(1, 'rgba(8,10,14,0)');
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

/** 光晕精灵（太阳/灯光的辉光片） */
function makeGlowSprite(size = 0.3, color = '255,232,168') {
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeGlowTexture(color, [[0, 'rgba(C,0.95)'], [0.25, 'rgba(C,0.42)'], [1, 'rgba(C,0)']]),
    transparent: true, depthWrite: false,
  }));
  sp.scale.setScalar(size);
  return sp;
}

/** 砾石地坪：暖灰底 + 数百颗碎石（椭圆描边 + 双色面 + 阴影侧），零重复感 */
function makeGravelTexture(seed = 41) {
  const S = 1024;
  const rnd = mulberry(seed);
  const cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#6d6a60';
  ctx.fillRect(0, 0, S, S);
  // 土基低频色斑
  for (let i = 0; i < 60; i++) {
    const g = ctx.createRadialGradient(rnd() * S, rnd() * S, 0, rnd() * S, rnd() * S, 40 + rnd() * 130);
    g.addColorStop(0, rnd() > 0.5 ? 'rgba(88,82,70,0.24)' : 'rgba(118,112,100,0.2)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, S, S);
  }
  // 碎石：两层密度（远景小石 500 / 近景大石 220），每颗三笔（底面 / 受光面 / 阴影缘）
  const pebble = (x, y, r) => {
    const rot = rnd() * Math.PI;
    const sx = 0.62 + rnd() * 0.55;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.scale(sx, 1);
    const baseC = ['#8d897d', '#9a948a', '#7e7a6e', '#a5a094', '#767068'][Math.floor(rnd() * 5)];
    ctx.fillStyle = baseC;
    ctx.beginPath();
    ctx.ellipse(0, 0, r, r * (0.68 + rnd() * 0.3), 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,250,238,0.16)';
    ctx.beginPath();
    ctx.ellipse(-r * 0.22, -r * 0.26, r * 0.52, r * 0.34, 0.4, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(30,28,24,0.4)';
    ctx.lineWidth = Math.max(0.7, r * 0.16);
    ctx.beginPath();
    ctx.ellipse(0, 0, r, r * (0.68 + rnd() * 0.3), 0, 0.4, Math.PI * 1.35);
    ctx.stroke();
    ctx.restore();
  };
  for (let i = 0; i < 520; i++) pebble(rnd() * S, rnd() * S, 2.2 + rnd() * 3.4);
  for (let i = 0; i < 230; i++) pebble(rnd() * S, rnd() * S, 5 + rnd() * 7.5);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

/** 砖墙：错缝丁砖 + 砖面颗粒 + 缝泥 + 白灰渍，半天光下略泛暖 */
function makeBrickTexture(seed = 17) {
  const S = 1024;
  const rnd = mulberry(seed);
  const cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#c3ae96';
  ctx.fillRect(0, 0, S, S);
  const rows = 14;
  const bh = S / rows;
  for (let r = 0; r < rows; r++) {
    const off = (r % 2) * bh;
    for (let x = -bh; x < S; x += bh * 2) {
      const bx = x + off + bh * 0.08;
      const by = r * bh + bh * 0.09;
      const bw = bh * 2 * 0.84;
      const bhh = bh * 0.82;
      const tone = 0.82 + rnd() * 0.3;
      const rr = Math.floor(156 * tone), gg = Math.floor(95 * tone), bb = Math.floor(67 * tone);
      ctx.fillStyle = `rgb(${rr},${gg},${bb})`;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(bx, by, bw, bhh, bh * 0.12);
      else ctx.rect(bx, by, bw, bhh);
      ctx.fill();
      // 砖面颗粒
      ctx.globalAlpha = 0.16;
      for (let k = 0; k < 60; k++) {
        ctx.fillStyle = rnd() > 0.5 ? '#5e3423' : '#d89a76';
        ctx.fillRect(bx + rnd() * bw, by + rnd() * bhh, 1.6, 1.6);
      }
      ctx.globalAlpha = 1;
      // 受光上缘 + 落影下缘
      ctx.fillStyle = 'rgba(255,235,210,0.18)';
      ctx.fillRect(bx, by, bw, 1.8);
      ctx.fillStyle = 'rgba(60,30,20,0.22)';
      ctx.fillRect(bx, by + bhh - 2, bw, 2);
      // 白灰渍（低概率）
      if (rnd() > 0.86) {
        ctx.fillStyle = 'rgba(232,226,214,0.2)';
        ctx.beginPath();
        ctx.ellipse(bx + rnd() * bw, by + rnd() * bhh, bh * 0.4, bh * 0.18, rnd(), 0, TAU);
        ctx.fill();
      }
    }
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

/** 陶土花盆：底色 + 烧结斑 + 轮制细纹 + 盐渍白圈 + 沿口磨损 */
function makeTerraTexture(seed = 23) {
  const S = 512;
  const rnd = mulberry(seed);
  const cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const ctx = cv.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, S, 0);
  g.addColorStop(0, '#a05c3a');
  g.addColorStop(0.5, '#b06a44');
  g.addColorStop(1, '#8f4f30');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  // 轮制细纹（水平弧线）
  for (let y = 8; y < S; y += 7 + rnd() * 9) {
    ctx.strokeStyle = rnd() > 0.5 ? 'rgba(70,36,20,0.14)' : 'rgba(232,178,132,0.1)';
    ctx.lineWidth = 1 + rnd();
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= S; x += 24) ctx.lineTo(x, y + Math.sin(x * 0.02 + y) * 1.2);
    ctx.stroke();
  }
  // 烧结斑
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = `rgba(${120 + rnd() * 60 | 0},${50 + rnd() * 30 | 0},${28 + rnd() * 20 | 0},${0.08 + rnd() * 0.14})`;
    ctx.beginPath();
    ctx.ellipse(rnd() * S, rnd() * S, 8 + rnd() * 40, 5 + rnd() * 22, rnd() * Math.PI, 0, TAU);
    ctx.fill();
  }
  // 盐渍白圈（盆口/盆底渗盐）
  for (const yy of [S * 0.1, S * 0.92]) {
    for (let i = 0; i < 5; i++) {
      ctx.strokeStyle = `rgba(236,228,210,${0.1 + rnd() * 0.14})`;
      ctx.lineWidth = 2 + rnd() * 3;
      ctx.beginPath();
      ctx.moveTo(0, yy + (rnd() - 0.5) * 10);
      ctx.bezierCurveTo(S * 0.3, yy + (rnd() - 0.5) * 14, S * 0.7, yy + (rnd() - 0.5) * 14, S, yy + (rnd() - 0.5) * 10);
      ctx.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

/** 培养土：深色腐殖土 + 颗粒 + 蛭石亮屑 + 大土块阴影 */
function makeSoilTexture(wet = 0, seed = 53) {
  const S = 512;
  const rnd = mulberry(seed);
  const cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const ctx = cv.getContext('2d');
  const damp = wet;
  const mix = (c1, c2, k) => `rgb(${Math.round(c1[0] + (c2[0] - c1[0]) * k)},${Math.round(c1[1] + (c2[1] - c1[1]) * k)},${Math.round(c1[2] + (c2[2] - c1[2]) * k)})`;
  ctx.fillStyle = mix([84, 64, 42], [46, 38, 26], damp);
  ctx.fillRect(0, 0, S, S);
  for (let i = 0; i < 2600; i++) {
    const r = 1 + rnd() * 3.2;
    ctx.fillStyle = rnd() > 0.5
      ? mix([64, 48, 32], [36, 30, 20], damp)
      : mix([110, 86, 58], [66, 54, 38], damp);
    ctx.globalAlpha = 0.25 + rnd() * 0.4;
    ctx.beginPath();
    ctx.arc(rnd() * S, rnd() * S, r, 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  // 蛭石亮屑（干土更亮）
  for (let i = 0; i < 170; i++) {
    ctx.fillStyle = `rgba(226,206,166,${(0.5 - damp * 0.3) * (0.4 + rnd() * 0.6)})`;
    ctx.save();
    ctx.translate(rnd() * S, rnd() * S);
    ctx.rotate(rnd() * Math.PI);
    ctx.fillRect(0, 0, 2.5 + rnd() * 4, 1.4 + rnd() * 2);
    ctx.restore();
  }
  // 大土块团影
  for (let i = 0; i < 26; i++) {
    ctx.fillStyle = `rgba(20,14,8,${0.1 + rnd() * 0.16})`;
    ctx.beginPath();
    ctx.ellipse(rnd() * S, rnd() * S, 10 + rnd() * 30, 6 + rnd() * 18, rnd() * Math.PI, 0, TAU);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** 叶脉贴图：底色 + 中脉 + 侧脉弓形 + 细网脉 + 微斑点，绿底深脉双面用 */
function makeLeafTexture(baseHex, veinHex, seed = 5) {
  const S = 512;
  const rnd = mulberry(seed);
  const cv = document.createElement('canvas');
  cv.width = S; cv.height = S;
  const ctx = cv.getContext('2d');
  const cBase = new THREE.Color(baseHex);
  const cVein = new THREE.Color(veinHex);
  const css = (c) => `#${c.getHexString()}`;
  const rgba = (c, a) => `rgba(${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)},${a})`;
  // 叶面底色：横向微渐变 + 噪点斑
  const g = ctx.createLinearGradient(0, 0, S, 0);
  g.addColorStop(0, rgba(cBase.clone().multiplyScalar(0.82), 1));
  g.addColorStop(0.5, css(cBase));
  g.addColorStop(1, rgba(cBase.clone().multiplyScalar(0.86), 1));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  ctx.globalAlpha = 0.08;
  for (let i = 0; i < 900; i++) {
    ctx.fillStyle = rnd() > 0.5 ? '#123c18' : '#8fce9e';
    ctx.fillRect(rnd() * S, rnd() * S, 2, 2);
  }
  ctx.globalAlpha = 1;
  // 中脉：中央竖向亮脉 + 侧缘阴影
  const cx = S * 0.5;
  ctx.lineCap = 'round';
  ctx.strokeStyle = rgba(cVein, 0.9);
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(cx, S * 0.02);
  ctx.bezierCurveTo(cx + 6, S * 0.3, cx - 4, S * 0.68, cx + 2, S * 0.985);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(20,50,24,0.3)';
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.moveTo(cx + 5, S * 0.04);
  ctx.bezierCurveTo(cx + 11, S * 0.3, cx + 1, S * 0.68, cx + 7, S * 0.98);
  ctx.stroke();
  // 侧脉：5 对弓形脉（羽状）
  for (let i = 0; i < 5; i++) {
    const y = S * (0.14 + i * 0.16);
    for (const s of [-1, 1]) {
      ctx.strokeStyle = rgba(cVein, 0.62);
      ctx.lineWidth = 3.4;
      ctx.beginPath();
      ctx.moveTo(cx, y);
      ctx.quadraticCurveTo(cx + s * S * 0.22, y + S * 0.015, cx + s * S * 0.44, y + S * 0.1);
      ctx.stroke();
      // 细网脉
      ctx.strokeStyle = rgba(cVein, 0.3);
      ctx.lineWidth = 1.1;
      for (let k = 1; k <= 3; k++) {
        const t = k / 3.6;
        const px = cx + s * S * 0.44 * t;
        const py = y + S * 0.1 * t * t;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.quadraticCurveTo(px + s * 16, py + 12 + rnd() * 8, px + s * 30, py + 30 + rnd() * 10);
        ctx.stroke();
      }
    }
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** 种皮斑驳贴图：褐底 + 深浅斑点 + 近种脐晕 */
function makeSeedTexture(seed = 71) {
  const S = 256;
  const rnd = mulberry(seed);
  const cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#c9a86a';
  ctx.fillRect(0, 0, S, S);
  for (let i = 0; i < 1500; i++) {
    ctx.fillStyle = rnd() > 0.55 ? 'rgba(122,92,50,0.28)' : 'rgba(226,202,152,0.22)';
    ctx.beginPath();
    ctx.arc(rnd() * S, rnd() * S, 1 + rnd() * 4, 0, TAU);
    ctx.fill();
  }
  for (let i = 0; i < 26; i++) {
    ctx.fillStyle = `rgba(90,64,34,${0.1 + rnd() * 0.16})`;
    ctx.beginPath();
    ctx.ellipse(rnd() * S, rnd() * S, 6 + rnd() * 20, 4 + rnd() * 12, rnd() * Math.PI, 0, TAU);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** 铝箔遮光片：银灰底 + 定向拉丝 + 折痕高光 + 圆角缺口 */
function makeFoilTexture(seed = 29) {
  const S = 256;
  const rnd = mulberry(seed);
  const cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#b9c2cc';
  ctx.fillRect(0, 0, S, S);
  for (let y = 0; y < S; y += 2) {
    ctx.strokeStyle = rnd() > 0.5 ? 'rgba(255,255,255,0.1)' : 'rgba(70,80,92,0.1)';
    ctx.lineWidth = 0.8 + rnd() * 0.8;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(S, y + (rnd() - 0.5) * 3);
    ctx.stroke();
  }
  for (let i = 0; i < 9; i++) {
    const x = rnd() * S;
    ctx.strokeStyle = `rgba(255,255,255,${0.14 + rnd() * 0.2})`;
    ctx.lineWidth = 1 + rnd() * 2;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.bezierCurveTo(x + 8, S * 0.4, x - 10, S * 0.7, x + 4, S);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** 碘液棕黄 + 碘液小瓶签 */
function makeIodineLabelTexture() {
  return makeLabelTexture(['碘液', 'I₂·KI 溶液'], { w: 220, h: 130, accent: '#6a4418', lineSizes: [34, 16] });
}
function makeBenchPlateTexture() {
  return makeLabelTexture(['温室花房 · 菜豆栽培台', 'PLANTLAB GREENHOUSE BENCH'], { w: 512, h: 92, accent: '#4a3010', lineSizes: [36, 15] });
}
function makeSeedPackTexture(title, sub) {
  return makeLabelTexture([title, sub], { w: 240, h: 320, accent: '#5a3a1c', lineSizes: [30, 17] });
}

/** 木纹薄板贴图变体（台面 / 架腿 / 根箱框用同族色，不同 seed） */
const WOOD = {
  top: () => makeWoodTexture({ base: '#7c5a38', dark: '#5a3f24', light: '#98754c', streaks: 96, bands: 8, planks: 5, seed: 61 }),
  leg: () => makeWoodTexture({ base: '#6a4c2e', dark: '#4c341c', light: '#82623e', streaks: 70, bands: 6, seed: 62 }),
  box: () => makeWoodTexture({ base: '#8a6844', dark: '#66492c', light: '#a5825a', streaks: 60, bands: 5, seed: 63 }),
};

/* 可播种伪随机（纹理与散点共用，保证可复现） */
function mulberry(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 滚花法线（喷壶盖 / 标本杯口防滑纹） */
function makeKnurlNormalTexture(cols = 44) {
  const S = 256;
  const cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = 'rgb(128,128,255)';
  ctx.fillRect(0, 0, S, S);
  for (let i = 0; i < cols; i++) {
    const x = (i / cols) * S;
    const g = ctx.createLinearGradient(x - 2, 0, x + 2, 0);
    g.addColorStop(0, 'rgb(94,94,255)');
    g.addColorStop(0.5, 'rgb(128,128,255)');
    g.addColorStop(1, 'rgb(174,174,255)');
    ctx.fillStyle = g;
    ctx.fillRect(x - 2, 0, 4, S);
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}
function matKnurl(color, metal = 0.42, cols = 52) {
  const m = matStd(color, { roughness: 0.4, metalness: metal });
  m.normalMap = makeKnurlNormalTexture(cols);
  m.normalScale = new THREE.Vector2(1.2, 1.2);
  return m;
}

/* ---------------- 放样工具：沿曲线变径管（Frenet 框架自研 sweep） ---------------- */

/**
 * sweepTube(curvePts, rFn, opts)
 * - curvePts: Vector3[] 控制点（内部 CatmullRom）
 * - rFn(t): 半径函数（0..1），支持截面 {sx, sz} 椭圆缩放
 * - opts: { segs, radialSegs, capStart, capEnd, up }
 * 返回 BufferGeometry（含端帽扇面封口）。
 */
function sweepTube(curvePts, rFn, opts = {}) {
  const segs = opts.segs ?? 36;
  const radial = opts.radialSegs ?? 10;
  const curve = new THREE.CatmullRomCurve3(curvePts);
  const frames = curve.computeFrenetFrames(segs, false);
  const pos = [];
  const norm = [];
  const idx = [];
  const uvA = [];
  const refUp = opts.up ? new THREE.Vector3(...opts.up) : null;
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const c = curve.getPointAt(t);
    let n = frames.normals[Math.min(i, segs)];
    let b = frames.binormals[Math.min(i, segs)];
    if (refUp) {
      const tan = curve.getTangentAt(t);
      b = new THREE.Vector3().crossVectors(tan, refUp).normalize();
      n = new THREE.Vector3().crossVectors(b, tan).normalize();
    }
    const rr = rFn(t);
    for (let j = 0; j <= radial; j++) {
      const a = (j / radial) * TAU;
      const cx = Math.cos(a), cy = Math.sin(a);
      pos.push(
        c.x + n.x * cx * rr.sx + b.x * cy * rr.sz,
        c.y + n.y * cx * rr.sx + b.y * cy * rr.sz,
        c.z + n.z * cx * rr.sx + b.z * cy * rr.sz
      );
      norm.push(
        n.x * cx + b.x * cy,
        n.y * cx + b.y * cy,
        n.z * cx + b.z * cy
      );
      uvA.push(j / radial, t);
    }
  }
  const ring = radial + 1;
  for (let i = 0; i < segs; i++) {
    for (let j = 0; j < radial; j++) {
      const a = i * ring + j;
      const b2 = a + ring;
      idx.push(a, b2, a + 1, b2, b2 + 1, a + 1);
    }
  }
  // 端帽
  const capInto = (isStart) => {
    const c = curve.getPointAt(isStart ? 0 : 1);
    const centerI = pos.length / 3;
    pos.push(c.x, c.y, c.z);
    norm.push(isStart ? -curve.getTangentAt(0).x : curve.getTangentAt(1).x,
      isStart ? -curve.getTangentAt(0).y : curve.getTangentAt(1).y,
      isStart ? -curve.getTangentAt(0).z : curve.getTangentAt(1).z);
    uvA.push(0.5, 0.5);
    const base = isStart ? 0 : segs * ring;
    for (let j = 0; j < radial; j++) {
      const a1 = base + j, a2 = base + j + 1;
      if (isStart) idx.push(centerI, a2, a1);
      else idx.push(centerI, a1, a2);
    }
  };
  if (opts.capStart !== false) capInto(true);
  if (opts.capEnd !== false) capInto(false);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(norm, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvA, 2));
  geo.setIndex(idx);
  return geo;
}
/** 简写：等径管 */
function tubeMesh(pts, radius, mat, opts = {}) {
  return new THREE.Mesh(sweepTube(pts, () => ({ sx: radius, sz: radius }), opts), mat);
}
/** 渐细管：底 r0 → 顶 r1 */
function taperTube(pts, r0, r1, mat, opts = {}) {
  return new THREE.Mesh(sweepTube(pts, (t) => ({ sx: r0 + (r1 - r0) * t, sz: r0 + (r1 - r0) * t }), opts), mat);
}

/* ---------------- 同材质静态件合批（省 draw call：叶柄/花蕊/叶脉等小件每株上百个，
 *    逐个 draw 轻松破 200 预算；按材质合并成单 mesh，视觉零变化，重建时每帧重合批成本 <1ms） ---------------- */

/** 轻量几何拼接（同 attribute 集：position/normal/uv，全部转非索引后拼数组） */
function mergeGeos(geos) {
  const list = geos.map((g0) => (g0.index ? g0.toNonIndexed() : g0));
  const nMul = list.map((g0) => {
    if (g0.attributes.uv) return g0;
    g0.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g0.attributes.position.count * 2), 2));
    return g0;
  });
  const out = new THREE.BufferGeometry();
  let total = 0;
  for (const g0 of nMul) total += g0.attributes.position.count;
  const P = new Float32Array(total * 3), N = new Float32Array(total * 3), U = new Float32Array(total * 2);
  let vo = 0;
  for (const g0 of nMul) {
    P.set(g0.attributes.position.array, vo * 3);
    N.set(g0.attributes.normal.array, vo * 3);
    U.set(g0.attributes.uv.array, vo * 2);
    vo += g0.attributes.position.count;
    g0.dispose();
  }
  out.setAttribute('position', new THREE.BufferAttribute(P, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(N, 3));
  out.setAttribute('uv', new THREE.BufferAttribute(U, 2));
  return out;
}

/** 把 root 下命中 pred 的无贴图小件按材质合并为单 mesh（变换烘焙到 root 局部空间，视觉零变化）。
 *  带 map 的网格（叶片等）不参与合并——贴图各异，合并需烘焙 uv 会串图。 */
function mergeBatched(root, pred = (o) => !o.material.map) {
  root.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const byMat = new Map();
  const doomed = [];
  root.traverse((o) => {
    if (o.isMesh && !Array.isArray(o.material) && (o.geometry.groups?.length ?? 0) <= 1 && pred(o)) doomed.push(o);
  });
  if (!doomed.length) return [];
  for (const o of doomed) {
    const key = o.material.uuid;
    if (!byMat.has(key)) byMat.set(key, { mat: o.material, geos: [] });
    const geo = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
    geo.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld));
    byMat.get(key).geos.push(geo);
  }
  for (const o of doomed) { o.parent.remove(o); o.geometry.dispose(); }
  const out = [];
  for (const { mat, geos } of byMat.values()) {
    const m = new THREE.Mesh(mergeGeos(geos), mat);
    root.add(m);
    out.push(m);
  }
  return out;
}

/* ---------------- 温室环境：地坪 + 砖墙 + 玻璃暖房 + 木操作台 + 道具 ---------------- */

const BENCH_Y = 0;               // 操作台面高度 = 世界 y=0（植株基准面）
const FLOOR_Y = -0.78;

function buildEnv() {
  const g = new THREE.Group();

  // 砾石地坪
  const gravelTex = makeGravelTexture();
  gravelTex.repeat.set(5, 5);
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(11, 64),
    new THREE.MeshStandardMaterial({ map: gravelTex, roughness: 0.95, metalness: 0.02 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = FLOOR_Y;
  g.add(floor);

  // 砖墙裙（后 + 左，半天光暖砖）
  const brickTex = makeBrickTexture();
  brickTex.repeat.set(3, 1.1);
  const brickMat = new THREE.MeshStandardMaterial({ map: brickTex, roughness: 0.92, metalness: 0.02 });
  const wallB = new THREE.Mesh(new THREE.BoxGeometry(8.6, 0.72, 0.24), brickMat);
  wallB.position.set(0, FLOOR_Y + 0.36, -2.75);
  g.add(wallB);
  const brickTexL = brickTex.clone();
  brickTexL.needsUpdate = true;
  brickTexL.repeat.set(1.4, 1.1);
  const wallL = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.72, 5.4), brickMat);
  wallL.position.set(-4.3, FLOOR_Y + 0.36, -0.1);
  g.add(wallL);
  // 墙裙压顶条
  const capB = new THREE.Mesh(new THREE.BoxGeometry(8.72, 0.06, 0.34), matStd(COL.woodDeep, { roughness: 0.7 }));
  capB.position.set(0, FLOOR_Y + 0.75, -2.75);
  const capL = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.06, 5.52), matStd(COL.woodDeep, { roughness: 0.7 }));
  capL.position.set(-4.3, FLOOR_Y + 0.75, -0.1);
  g.add(capB, capL);

  // 玻璃暖房壳（框 + 玻，背/左/顶，不挡正面视线）
  const frameMat = matStd(0x4a5844, { roughness: 0.5, metalness: 0.3 });
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: COL.glassTint, transparent: true, opacity: 0.13, roughness: 0.08,
    metalness: 0, side: THREE.DoubleSide, depthWrite: false, forceSinglePass: true,
  });
  const pane = (w, h, pos, rot) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), glassMat);
    m.position.set(...pos);
    if (rot) m.rotation.set(...rot);
    g.add(m);
    // 框条
    const bh = new THREE.Mesh(new THREE.BoxGeometry(w, 0.045, 0.045), frameMat);
    bh.position.set(pos[0], pos[1] - h / 2, pos[2]);
    const bt = bh.clone(); bt.position.y = pos[1] + h / 2;
    if (rot) { bh.rotation.set(...rot); bt.rotation.set(...rot); }
    g.add(bh, bt);
  };
  pane(8.4, 1.9, [0, FLOOR_Y + 1.72, -2.62], null);                 // 后墙玻璃
  pane(5.2, 1.9, [-4.18, FLOOR_Y + 1.72, -0.1], [0, Math.PI / 2, 0]); // 左墙玻璃
  const roofG = new THREE.Mesh(new THREE.PlaneGeometry(8.4, 4.6), glassMat.clone());
  roofG.material.opacity = 0.08;
  roofG.position.set(0, 3.1, -0.9);
  roofG.rotation.x = -1.02;
  g.add(roofG);
  // 屋顶檩条 ×3
  for (const off of [-2.6, 0, 2.6]) {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 5.2), frameMat);
    beam.position.set(off, 3.14, -0.95);
    beam.rotation.x = 0.55;
    g.add(beam);
  }

  // 木操作台：台面（五拼板）+ 前后裙板 + 四腿 + 横撑 + 铭牌
  const woodTop = WOOD.top();
  const benchMat = new THREE.MeshStandardMaterial({ map: woodTop, roughness: 0.66, metalness: 0.03 });
  const top = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.09, 1.5), benchMat);
  top.position.y = BENCH_Y - 0.045;
  g.add(top);
  const legMat = new THREE.MeshStandardMaterial({ map: WOOD.leg(), roughness: 0.72, metalness: 0.02 });
  for (const [lx, lz] of [[-1.58, -0.64], [1.58, -0.64], [-1.58, 0.64], [1.58, 0.64]]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.72, 0.11), legMat);
    leg.position.set(lx, BENCH_Y - 0.41, lz);
    g.add(leg);
  }
  const apron = new THREE.Mesh(new THREE.BoxGeometry(3.28, 0.16, 0.05), legMat);
  apron.position.set(0, BENCH_Y - 0.17, 0.72);
  const apronB = apron.clone(); apronB.position.z = -0.72;
  g.add(apron, apronB);
  const stretcher = new THREE.Mesh(new THREE.BoxGeometry(3.16, 0.08, 0.08), legMat);
  stretcher.position.set(0, BENCH_Y - 0.6, 0);
  g.add(stretcher);
  // 台面下沿装饰线
  const trim = new THREE.Mesh(new THREE.BoxGeometry(3.42, 0.035, 1.52), matStd(COL.woodDeep, { roughness: 0.6 }));
  trim.position.y = BENCH_Y - 0.1;
  g.add(trim);
  // 铭牌（斜面小铜牌）
  const plate = new THREE.Mesh(
    new THREE.BoxGeometry(0.62, 0.11, 0.02),
    matStd(COL.brass, { metalness: 0.75, roughness: 0.36 })
  );
  plate.position.set(-1.35, BENCH_Y - 0.165, 0.71);
  plate.rotation.x = 0.5;
  g.add(plate);
  const plateFace = new THREE.Mesh(
    new THREE.PlaneGeometry(0.58, 0.085),
    new THREE.MeshStandardMaterial({ map: makeBenchPlateTexture(), roughness: 0.6 })
  );
  plateFace.position.set(-1.35, BENCH_Y - 0.152, 0.718);
  plateFace.rotation.x = 0.5;
  g.add(plateFace);

  // —— 台面道具 ——
  // 陶盆 ×2（LatheGeometry 放样：口沿外翻 → 束腰 → 底足）
  const terraTex = makeTerraTexture();
  const terraMat = new THREE.MeshStandardMaterial({ map: terraTex, roughness: 0.86, metalness: 0.02 });
  function makeTerraPot(r = 0.24, h = 0.24, x = 0, z = 0, rotY = 0) {
    const prof = [
      [r * 0.62, 0], [r * 0.64, 0.012], [r * 0.7, h * 0.16], [r * 0.88, h * 0.62],
      [r * 0.97, h * 0.9], [r, h * 0.96], [r * 1.04, h], [r * 1.03, h * 1.03],
    ].map(([rr, y]) => new THREE.Vector2(rr, y));
    const pot = new THREE.Mesh(new THREE.LatheGeometry(prof, 40), terraMat);
    pot.position.set(x, BENCH_Y, z);
    pot.rotation.y = rotY;
    const inner = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.95, r * 0.62, h * 0.92, 32), matStd(0x4a3826, { roughness: 0.95 }));
    inner.position.set(x, BENCH_Y + h * 0.46, z);
    const soilTop = new THREE.Mesh(
      new THREE.CircleGeometry(r * 0.93, 32),
      new THREE.MeshStandardMaterial({ map: makeSoilTexture(0.4, 91), roughness: 0.98 })
    );
    soilTop.rotation.x = -Math.PI / 2;
    soilTop.position.set(x, BENCH_Y + h * 0.86, z);
    const sh = contactShadow(r * 2.5, r * 2.5, 0.85);
    sh.position.set(x, BENCH_Y + 0.002, z);
    const grp = new THREE.Group();
    grp.add(pot, inner, soilTop, sh);
    g.add(grp);
    return { grp, pot, soilTop, r, h, x, z };
  }
  makeTerraPot(0.21, 0.2, -1.28, 0.28, 0.3);
  makeTerraPot(0.14, 0.15, -1.02, -0.34, -0.6);

  // 育苗盘（黑塑盘 + 四行播种沟 + 土）
  const tray = new THREE.Group();
  const trayBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.62, 0.09, 0.34),
    matStd(0x2a2f2a, { roughness: 0.7, metalness: 0.05 })
  );
  tray.add(trayBody);
  for (let r = 0; r < 4; r++) {
    const ridge = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.02, 0.026), matStd(0x3a403a, { roughness: 0.75 }));
    ridge.position.set(0, 0.055, -0.12 + r * 0.08);
    tray.add(ridge);
  }
  const traySoil = new THREE.Mesh(
    new THREE.BoxGeometry(0.56, 0.015, 0.28),
    new THREE.MeshStandardMaterial({ map: makeSoilTexture(0.25, 77), roughness: 0.97 })
  );
  traySoil.position.y = 0.052;
  tray.add(traySoil);
  tray.position.set(1.22, BENCH_Y + 0.05, -0.28);
  tray.rotation.y = -0.18;
  g.add(tray);
  const traySh = contactShadow(0.78, 0.46, 0.8);
  traySh.position.set(1.22, BENCH_Y + 0.002, -0.28);
  g.add(traySh);

  // 喷壶（壶身放样 + 长嘴 sweep + 侧把手环 + 滚花盖）
  const can = new THREE.Group();
  const galvMat = matStd(0x8f9aa4, { roughness: 0.34, metalness: 0.82 });
  const bodyProf = [
    [0.001, 0], [0.1, 0.01], [0.13, 0.06], [0.15, 0.16], [0.15, 0.3],
    [0.14, 0.36], [0.1, 0.38], [0.085, 0.4],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  const body = new THREE.Mesh(new THREE.LatheGeometry(bodyProf, 36), galvMat);
  can.add(body);
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.085, 0.035, 24), matKnurl(0x76828c, 0.8, 40));
  lid.position.y = 0.41;
  can.add(lid);
  const spout = taperTube([
    new THREE.Vector3(0.12, 0.1, 0.02), new THREE.Vector3(0.24, 0.16, 0.05),
    new THREE.Vector3(0.34, 0.28, 0.06), new THREE.Vector3(0.4, 0.36, 0.06),
  ], 0.02, 0.013, galvMat, { segs: 20 });
  can.add(spout);
  const rose = new THREE.Mesh(new THREE.SphereGeometry(0.022, 12, 10), matKnurl(0x76828c, 0.8, 26));
  rose.position.set(0.4, 0.37, 0.06);
  can.add(rose);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.011, 10, 28, Math.PI * 1.2), galvMat);
  handle.position.set(-0.06, 0.3, 0);
  handle.rotation.z = -Math.PI / 2;
  handle.rotation.y = Math.PI / 2;
  can.add(handle);
  can.position.set(-1.62, BENCH_Y, -0.3);
  can.rotation.y = 2.6;
  g.add(can);
  const canSh = contactShadow(0.5, 0.5, 0.8);
  canSh.position.set(-1.62, BENCH_Y + 0.002, -0.3);
  g.add(canSh);

  // 移栽铲（木柄 + 铁铲头，插在陶盆边）
  const trowel = new THREE.Group();
  const bladeShape = new THREE.Shape();
  bladeShape.moveTo(0, 0);
  bladeShape.bezierCurveTo(0.035, 0.01, 0.045, 0.07, 0.028, 0.13);
  bladeShape.bezierCurveTo(0.014, 0.155, -0.014, 0.155, -0.028, 0.13);
  bladeShape.bezierCurveTo(-0.045, 0.07, -0.035, 0.01, 0, 0);
  const blade = new THREE.Mesh(
    new THREE.ExtrudeGeometry(bladeShape, { depth: 0.006, bevelEnabled: true, bevelThickness: 0.003, bevelSize: 0.004, bevelSegments: 2 }),
    matStd(0x6a7480, { roughness: 0.3, metalness: 0.85 })
  );
  blade.rotation.x = Math.PI / 2;
  trowel.add(blade);
  const shaft = taperTube([
    new THREE.Vector3(0, 0.02, 0), new THREE.Vector3(0, 0.1, -0.01), new THREE.Vector3(0, 0.19, -0.015),
  ], 0.012, 0.014, matStd(COL.wood, { roughness: 0.6 }), { segs: 10 });
  trowel.add(shaft);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.02, 12, 10), matStd(COL.woodDeep, { roughness: 0.55 }));
  knob.position.set(0, 0.2, -0.015);
  trowel.add(knob);
  trowel.position.set(-0.86, BENCH_Y, 0.42);
  trowel.rotation.set(1.1, 0.3, 0.2);
  g.add(trowel);
  const twSh = contactShadow(0.24, 0.3, 0.7);
  twSh.position.set(-0.86, BENCH_Y + 0.002, 0.42);
  g.add(trowelSh(twSh));

  // 玻璃罐（泡种子用）：玻璃罐身 + 水体 + 弯月面 + 铜盖
  const jar = new THREE.Group();
  const jarProf = [
    [0.001, 0], [0.075, 0], [0.082, 0.012], [0.082, 0.15], [0.078, 0.158], [0.062, 0.162], [0.06, 0.175],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  const jarGlass = new THREE.Mesh(new THREE.LatheGeometry(jarProf, 32), matGlassLite(COL.glassTint));
  jar.add(jarGlass);
  const jarWater = new THREE.Mesh(
    new THREE.CylinderGeometry(0.076, 0.076, 0.1, 28),
    new THREE.MeshPhysicalMaterial({ color: COL.water, transparent: true, opacity: 0.32, roughness: 0.1 })
  );
  jarWater.position.y = 0.06;
  jar.add(jarWater);
  const meniscus = new THREE.Mesh(
    new THREE.CircleGeometry(0.076, 28),
    new THREE.MeshStandardMaterial({ color: 0xdff2ff, transparent: true, opacity: 0.4, roughness: 0.05, metalness: 0.1 })
  );
  meniscus.rotation.x = -Math.PI / 2;
  meniscus.position.y = 0.112;
  jar.add(meniscus);
  const jarLid = new THREE.Mesh(new THREE.CylinderGeometry(0.064, 0.064, 0.02, 24), matKnurl(COL.brass, 0.78, 34));
  jarLid.position.y = 0.185;
  jar.add(jarLid);
  jar.position.set(0.62, BENCH_Y, 0.44);
  jar.rotation.y = -0.4;
  g.add(jar);
  const jarSh = contactShadow(0.3, 0.3, 0.8);
  jarSh.position.set(0.62, BENCH_Y + 0.002, 0.44);
  g.add(jarSh);

  // 种子袋 ×2（纸袋挤出 + 标签纹理）
  const packDefs = [
    ['菜豆种子', 'Phaseolus vulgaris', -2.0, 0.05],
    ['玉米种子', 'Zea mays（果实）', 1.66, -0.06],
  ];
  for (const [t, s, px, pz] of packDefs) {
    const pack = new THREE.Group();
    const bodyP = new THREE.Mesh(
      new THREE.BoxGeometry(0.17, 0.24, 0.045),
      new THREE.MeshStandardMaterial({ color: 0xd8cdb4, roughness: 0.85 })
    );
    pack.add(bodyP);
    const packLabel = new THREE.Mesh(
      new THREE.PlaneGeometry(0.15, 0.2),
      new THREE.MeshStandardMaterial({ map: makeSeedPackTexture(t, s), roughness: 0.7 })
    );
    packLabel.position.z = 0.026;
    pack.add(packLabel);
    const seal = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.02, 0.047), matStd(0x9aa4ae, { roughness: 0.4, metalness: 0.6 }));
    seal.position.y = 0.125;
    pack.add(seal);
    pack.position.set(px, BENCH_Y + 0.12, pz);
    pack.rotation.y = px > 0 ? -0.5 : 0.4;
    pack.rotation.z = px > 0 ? -0.08 : 0.06;
    g.add(pack);
    const pkSh = contactShadow(0.3, 0.2, 0.65);
    pkSh.position.set(px, BENCH_Y + 0.002, pz + 0.06);
    g.add(pkSh);
  }

  // 木标签签 ×3（斜插小木牌 + 手写风标签）
  const tagDefs = [
    ['A 对照', 2.0, 0.3, '#3a5a2c'],
    ['根箱', -2.0, -0.2, '#5a3a1c'],
    ['第 7 天', -0.4, 0.62, '#6a3a2c'],
  ];
  for (const [t, tx, tz, accent] of tagDefs) {
    const stick = new THREE.Group();
    const post = taperTube([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.01, 0.16, 0)], 0.007, 0.009, matStd(COL.wood, { roughness: 0.7 }), { segs: 8 });
    stick.add(post);
    const card = new THREE.Mesh(
      new THREE.BoxGeometry(0.13, 0.075, 0.008),
      new THREE.MeshStandardMaterial({ color: 0xefe6d2, roughness: 0.8 })
    );
    card.position.set(0.01, 0.19, 0);
    card.rotation.z = 0.12;
    stick.add(card);
    const cardFace = new THREE.Mesh(
      new THREE.PlaneGeometry(0.12, 0.06),
      new THREE.MeshStandardMaterial({ map: makeLabelTexture([t], { w: 220, h: 110, accent, lineSizes: [34] }), roughness: 0.75 })
    );
    cardFace.position.set(0.01, 0.19, 0.006);
    cardFace.rotation.z = 0.12;
    stick.add(cardFace);
    stick.position.set(tx, BENCH_Y, tz);
    stick.rotation.y = (tx * 7 + tz * 3) % Math.PI;
    stick.rotation.z = -0.06;
    g.add(stick);
  }

  // 操作台地面接触阴影
  const benchSh = contactShadow(3.8, 1.9, 0.75);
  benchSh.position.set(0, FLOOR_Y + 0.005, 0);
  g.add(benchSh);

  g.userData.pots = { makeTerraPot };
  return g;
}
function trowelSh(m) { return m; }

const envGroup = buildEnv();
world.add(envGroup);

/** 章级场景组：入队统一管理，切章统一清空 */
const sceneGroups = [];
function newSceneGroup(parent = world) {
  const g = new THREE.Group();
  parent.add(g);
  sceneGroups.push(g);
  return g;
}

/** 环境归零（保留 envGroup，仅清章场景组） */
function resetWorld() {
  for (const c of sceneGroups) clearGroup(c);
  sceneGroups.length = 0;
  setDaylight(1);
}
/* =====================================================================
 * 植物部件工艺层：叶 / 茎 / 子叶 / 花 / 荚 / 种子 / 根
 * ===================================================================== */

/** 叶片贴图缓存（同色同 seed 复用，省纹理重绘） */
const leafTexCache = new Map();
/** 叶中脉材质缓存（按 veinHex 共享，配合 mergeBatched 合批） */
const midribMatCache = new Map();
function leafTexture(baseHex, veinHex, seed) {
  const key = baseHex + '-' + veinHex + '-' + seed;
  if (!leafTexCache.has(key)) leafTexCache.set(key, makeLeafTexture(baseHex, veinHex, seed));
  return leafTexCache.get(key);
}

/**
 * 叶片网格：贝塞尔轮廓 ShapeGeometry + 叶脉贴图 + 顶点杯状拱曲 + 中脉加厚棱
 * shape: 'heart'（菜豆顶小叶，阔卵）| 'oval'（侧小叶）| 'simple'（真叶单叶）
 */
function makeLeafMesh(shape = 'heart', opts = {}) {
  const size = Math.max(opts.size ?? 0.34, 0.006);   // 下限防零/负尺寸退化成 NaN 单顶点 Shape
  const cup = opts.cup ?? 0.22;
  const baseHex = opts.color ?? COL.leaf;
  const veinHex = opts.vein ?? COL.leafVeinDark;
  const seed = opts.seed ?? 5;
  const tex = leafTexture(baseHex, veinHex, seed);
  const mat = new THREE.MeshStandardMaterial({
    map: tex,
    side: THREE.DoubleSide,
    roughness: 0.62,
    metalness: 0.02,
    transparent: true,
    alphaTest: 0.08,
    forceSinglePass: true,   // transparent+DoubleSide 免双 pass（alphaTest 已负责镂空）
  });
  const s = new THREE.Shape();
  const w = size, h = size * 1.42;
  if (shape === 'heart') {
    s.moveTo(0, 0);
    s.bezierCurveTo(w * 0.62, h * 0.06, w * 0.66, h * 0.46, w * 0.3, h * 0.82);
    s.bezierCurveTo(w * 0.18, h * 0.94, w * 0.05, h * 0.99, 0, h);
    s.bezierCurveTo(-w * 0.05, h * 0.99, -w * 0.18, h * 0.94, -w * 0.3, h * 0.82);
    s.bezierCurveTo(-w * 0.66, h * 0.46, -w * 0.62, h * 0.06, 0, 0);
  } else if (shape === 'oval') {
    s.moveTo(0, 0);
    s.bezierCurveTo(w * 0.5, h * 0.1, w * 0.52, h * 0.5, w * 0.24, h * 0.84);
    s.bezierCurveTo(w * 0.1, h * 0.96, -w * 0.1, h * 0.96, -w * 0.24, h * 0.84);
    s.bezierCurveTo(-w * 0.52, h * 0.5, -w * 0.5, h * 0.1, 0, 0);
  } else {
    s.moveTo(0, 0);
    s.bezierCurveTo(w * 0.42, h * 0.12, w * 0.44, h * 0.52, w * 0.2, h * 0.82);
    s.bezierCurveTo(w * 0.08, h * 0.95, -w * 0.08, h * 0.95, -w * 0.2, h * 0.82);
    s.bezierCurveTo(-w * 0.44, h * 0.52, -w * 0.42, h * 0.12, 0, 0);
  }
  const geo = new THREE.ShapeGeometry(s, 14);
  // 杯状拱曲：沿叶宽方向二次曲线 + 沿叶长的轻卷（顶点级位移，保持贴图 UV）
  const posAttr = geo.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i), y = posAttr.getY(i);
    const k = Math.abs(x) / (w * 0.7);
    posAttr.setZ(i, -cup * size * k * k - size * 0.04 * Math.max(0, y - h * 0.5) / (h * 0.5));
  }
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, mat);
  // 中脉棱：细放样管贴着叶中脉，叶背观感更立体（材质按 veinHex 缓存——同色中脉共材质才能合批）
  const midMatKey = 'vein' + veinHex;
  if (!midribMatCache.has(midMatKey)) {
    midribMatCache.set(midMatKey, new THREE.MeshStandardMaterial({ color: new THREE.Color(veinHex).multiplyScalar(1.15), roughness: 0.6 }));
  }
  const midrib = taperTube(
    [new THREE.Vector3(0, 0, -cup * size * 0.06), new THREE.Vector3(0, h * 0.55, -cup * size * 0.1), new THREE.Vector3(0, h * 0.98, -cup * size * 0.05)],
    size * 0.012, size * 0.004,
    midribMatCache.get(midMatKey),
    { segs: 12, radialSegs: 5 }
  );
  const grp = new THREE.Group();
  grp.add(mesh, midrib);
  return grp;
}

/** 叶枕 + 叶柄组件（三出复叶的叶柄有膨大关节） */
function makePetiole(len, r, mat, droop = 0.5) {
  const g = new THREE.Group();
  const pts = [
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, len * 0.5, -Math.sin(droop) * len * 0.22),
    new THREE.Vector3(0, len * 0.92, -Math.sin(droop) * len * 0.5),
  ];
  const stalk = taperTube(pts, r * 1.25, r * 0.8, mat, { segs: 10, radialSegs: 6 });
  g.add(stalk);
  const pulvinus = new THREE.Mesh(
    new THREE.SphereGeometry(r * 1.7, 10, 8),
    mat
  );
  pulvinus.scale.set(1, 1.3, 1);
  pulvinus.position.y = r * 0.2;
  g.add(pulvinus);
  return g;
}

/** 三出复叶组件（顶小叶 + 两侧小叶，各自带小叶柄与叶枕） */
function makeTrifoliate(size, color, opts = {}) {
  const g = new THREE.Group();
  const stemMat = new THREE.MeshStandardMaterial({ color: opts.stemColor ?? COL.stemDeep, roughness: 0.66 });
  const petiole = makePetiole(size * 0.62, size * 0.032, stemMat, opts.droop ?? 0.45);
  g.add(petiole);
  const tipY = size * 0.62 * 0.92 - Math.sin(opts.droop ?? 0.45) * size * 0.62 * 0.5;
  const tipZ = -Math.sin(opts.droop ?? 0.45) * size * 0.62 * 0.5;
  // 顶小叶
  const mid = makeLeafMesh('heart', { size: size * 0.62, color, seed: opts.seed ?? 5, cup: 0.24 });
  mid.position.set(0, tipY + size * 0.02, tipZ);
  mid.rotation.set(-0.9 - (opts.droop ?? 0) * 0.5, 0, 0);
  g.add(mid);
  // 两侧小叶（对生，微下垂）
  for (const sd of [-1, 1]) {
    const pet2 = makePetiole(size * 0.3, size * 0.022, stemMat, 0.6);
    pet2.position.set(sd * size * 0.05, tipY - size * 0.04, tipZ);
    pet2.rotation.z = -sd * 0.95;
    g.add(pet2);
    const lf = makeLeafMesh('oval', { size: size * 0.5, color, seed: (opts.seed ?? 5) + sd * 3 + 1, cup: 0.26 });
    lf.position.set(sd * (size * 0.24), tipY - size * 0.02, tipZ + size * 0.1);
    lf.rotation.set(-1.05 - (opts.droop ?? 0) * 0.5, -sd * 0.5, -sd * 0.3);
    g.add(lf);
  }
  // 叶柄/叶枕/小叶柄/中脉按材质合批（叶片带贴图不参与），一叶 10 draw → 3 叶片 + 2 合批
  mergeBatched(g, (o) => !o.material.map);
  return g;
}

/** 子叶（豆瓣）：两瓣饱满半球壳，_split=张开角，wilt=萎缩系数 */
function makeCotyledon(wilt = 0, split = 0.28) {
  const g = new THREE.Group();
  const mat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(COL.cotyledon).lerp(new THREE.Color(COL.etiolate), 0.35),
    roughness: 0.5,
    clearcoat: 0.35,
    clearcoatRoughness: 0.4,
    sheen: 0.3,
    sheenColor: new THREE.Color(0xd8e8b0),
  });
  for (const sd of [-1, 1]) {
    const half = new THREE.Mesh(new THREE.SphereGeometry(0.05, 18, 14, 0, Math.PI, 0, Math.PI), mat);
    half.rotation.y = sd > 0 ? 0 : Math.PI;
    half.rotation.z = sd * split;
    half.scale.set(1 - wilt * 0.55, 0.82 - wilt * 0.3, 0.72 - wilt * 0.3);
    g.add(half);
    // 子叶分缝脊线
    if (sd < 0) {
      const seam = tubeMesh(
        [new THREE.Vector3(0, 0.042, 0.01), new THREE.Vector3(0, 0.045, -0.02), new THREE.Vector3(0, 0.036, -0.042)],
        0.004, new THREE.MeshStandardMaterial({ color: 0x6f8f3e, roughness: 0.6 }),
        { segs: 8, radialSegs: 5 }
      );
      g.add(seam);
    }
  }
  return g;
}

/** 茎节点环（豆科茎的略膨大关节） */
function makeStemNode(r, mat) {
  const m = new THREE.Mesh(new THREE.TorusGeometry(r * 1.22, r * 0.32, 8, 16), mat);
  m.rotation.x = Math.PI / 2;
  return m;
}

/** 茎系统：多段控制点 → 渐细放样管 + 节环 + 节间微 S 摆动 */
function buildStem(pts, r0, r1, opts = {}) {
  const g = new THREE.Group();
  const mat = new THREE.MeshPhysicalMaterial({
    color: opts.color ?? COL.stem,
    roughness: 0.58,
    clearcoat: 0.25,
    clearcoatRoughness: 0.5,
    sheen: 0.22,
    sheenColor: new THREE.Color(0xcfe0b8),
  });
  const curve = new THREE.CatmullRomCurve3(pts);
  const stem = new THREE.Mesh(
    sweepTube(pts, (t) => {
      const r = r0 + (r1 - r0) * t;
      // 方棱幼茎：截面微四角化（豆科幼苗横切近方形）
      const squarish = opts.young ? 1 + Math.abs(Math.cos(t * Math.PI * 2)) * 0.08 : 1;
      return { sx: r * squarish, sz: r * (opts.young ? 0.94 : 1) };
    }, { segs: opts.segs ?? 40, radialSegs: 12, capStart: false, up: [0, 0, 1] }),
    mat
  );
  g.add(stem);
  // 节环：按 t 表在曲线上放环
  if (opts.nodes && opts.nodes.length) {
    const nodeMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(opts.color ?? COL.stem).multiplyScalar(0.88), roughness: 0.62 });
    for (const nt of opts.nodes) {
      const p = curve.getPointAt(clamp(nt, 0.02, 0.98));
      const tan = curve.getTangentAt(clamp(nt, 0.02, 0.98));
      const node = makeStemNode(r0 + (r1 - r0) * nt, nodeMat);
      node.position.copy(p);
      node.lookAt(p.clone().add(tan));
      g.add(node);
    }
  }
  return g;
}

/** 弯钩（出土期保护性弯拱）：下胚轴弧 + 种壳残留 */
function makeHook(stage) {
  const g = new THREE.Group();
  // 0..1：弯钩深度（出土时最弯，之后逐渐立起）
  const k = clamp(stage, 0, 1);
  const bendAng = Math.PI * (0.95 - 0.62 * k);   // 弯钩张开度
  const pts = [];
  const R = 0.075 + 0.02 * k;
  const segs = 22;
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const ang = -Math.PI * 0.62 + bendAng * t;
    pts.push(new THREE.Vector3(Math.sin(ang) * R * (1 - 0.28 * t), 0.04 + t * 0.11 * k + (1 - t) * 0.02, Math.cos(ang) * R * 0.3));
  }
  g.add(buildStem(pts, 0.016, 0.013, { young: true, color: 0xc9bd6a, segs: 24 }));
  // 顶端对折小叶雏（两片嫩黄窄叶合拢）
  const tip = pts[pts.length - 1];
  for (const sd of [-1, 1]) {
    const bud = makeLeafMesh('simple', { size: 0.05, color: 0xd2c476, vein: 0xa89c58, seed: 9 + sd });
    bud.position.set(tip.x + sd * 0.008, tip.y + 0.012, tip.z);
    bud.rotation.set(-1.2, sd * 1.4, sd * 0.5);
    bud.scale.setScalar(0.85 - k * 0.25);
    g.add(bud);
  }
  // 种壳（裂开的种皮残片挂在子叶上）
  const shellMat = new THREE.MeshStandardMaterial({ map: makeSeedTexture(), roughness: 0.7 });
  const shell = new THREE.Mesh(new THREE.SphereGeometry(0.05, 14, 10, 0, Math.PI * 0.7), shellMat);
  shell.scale.set(1, 0.72, 0.6);
  shell.position.set(0, 0.055, 0.012);
  shell.rotation.set(-0.7, 0, 0.4);
  g.add(shell);
  return g;
}

/** 蝶形花（旗瓣 / 翼瓣 / 龙骨瓣 / 花萼 / 隐藏雄雌蕊），open=开放度 0..1 */
function makeFlower(open = 1, scale = 1) {
  const g = new THREE.Group();
  const petalMat = new THREE.MeshPhysicalMaterial({
    color: COL.petal, roughness: 0.42, clearcoat: 0.5, clearcoatRoughness: 0.32,
    sheen: 0.5, sheenColor: new THREE.Color(COL.petalHi), side: THREE.DoubleSide,
  });
  const keelMat = new THREE.MeshPhysicalMaterial({
    color: COL.keel, roughness: 0.5, clearcoat: 0.3, sheen: 0.3,
    sheenColor: new THREE.Color(0xffffff), side: THREE.DoubleSide,
  });
  // 花萼管（宿存：结荚后仍在）
  const calyxMat = new THREE.MeshStandardMaterial({ color: COL.calyx, roughness: 0.6 });
  const calyxProf = [[0.004, 0], [0.011, 0.008], [0.013, 0.02], [0.011, 0.032], [0.009, 0.038]].map(([r, y]) => new THREE.Vector2(r, y));
  const calyx = new THREE.Mesh(new THREE.LatheGeometry(calyxProf, 20), calyxMat);
  g.add(calyx);
  for (let i = 0; i < 5; i++) {
    const sep = makeLeafMesh('simple', { size: 0.014, color: COL.calyx, vein: 0x2c6030, seed: 21 + i, cup: 0.5 });
    sep.position.set(Math.sin((i / 5) * TAU) * 0.009, 0.034, Math.cos((i / 5) * TAU) * 0.009);
    sep.rotation.set(-0.9, (i / 5) * TAU, 0);
    g.add(sep);
  }
  // 旗瓣：大圆瓣，边缘波浪，展开角随 open
  const bannerShape = new THREE.Shape();
  const bw = 0.036, bh = 0.034;
  bannerShape.moveTo(-bw * 0.5, 0);
  for (let i = 0; i <= 12; i++) {
    const t = i / 12;
    const x = -bw * 0.5 + bw * t;
    const wave = Math.sin(t * Math.PI * 3) * 0.004;
    bannerShape.lineTo(x, Math.sin(t * Math.PI) * (bh * 0.94) + wave);
  }
  bannerShape.lineTo(bw * 0.5, 0);
  bannerShape.lineTo(-bw * 0.5, 0);
  const bannerGeo = new THREE.ShapeGeometry(bannerShape, 10);
  const bp = bannerGeo.attributes.position;
  for (let i = 0; i < bp.count; i++) {
    const x = bp.getX(i), y = bp.getY(i);
    bp.setZ(i, -0.008 * (y / bh) - 0.014 * Math.pow(Math.abs(x) / (bw * 0.5), 2));
  }
  bannerGeo.computeVertexNormals();
  const banner = new THREE.Mesh(bannerGeo, petalMat);
  banner.position.y = 0.04;
  banner.rotation.x = -0.9 + open * 0.55;
  g.add(banner);
  const bannerBack = banner.clone();
  bannerBack.material = petalMat;
  bannerBack.position.y += 0.002;
  bannerBack.scale.z = -1;
  g.add(bannerBack);
  // 翼瓣 ×2：侧向张开
  for (const sd of [-1, 1]) {
    const wingShape = new THREE.Shape();
    const ww = 0.026, wh = 0.03;
    wingShape.moveTo(0, 0);
    wingShape.bezierCurveTo(ww * 0.8, wh * 0.14, ww * 0.86, wh * 0.6, ww * 0.3, wh * 0.92);
    wingShape.bezierCurveTo(ww * 0.1, wh * 1.02, -ww * 0.24, wh * 0.9, -ww * 0.3, wh * 0.5);
    wingShape.bezierCurveTo(-ww * 0.32, wh * 0.2, -ww * 0.12, wh * 0.04, 0, 0);
    const wingGeo = new THREE.ShapeGeometry(wingShape, 10);
    const wp = wingGeo.attributes.position;
    for (let i = 0; i < wp.count; i++) wp.setZ(i, -0.01 * (wp.getY(i) / wh));
    wingGeo.computeVertexNormals();
    const wing = new THREE.Mesh(wingGeo, petalMat);
    wing.position.set(sd * 0.008, 0.03, 0.004);
    wing.rotation.set(-0.2, sd * (0.75 + open * 0.4), -sd * 0.35);
    g.add(wing);
  }
  // 龙骨瓣（合拢包被雄雌蕊）：两片弯壳
  for (const sd of [-1, 1]) {
    const keelShape = new THREE.Shape();
    keelShape.moveTo(0, 0);
    keelShape.bezierCurveTo(0.02, 0.012, 0.022, 0.026, 0.008, 0.04);
    keelShape.bezierCurveTo(0.002, 0.046, -0.01, 0.044, -0.014, 0.034);
    keelShape.bezierCurveTo(-0.02, 0.02, -0.012, 0.006, 0, 0);
    const keelGeo = new THREE.ShapeGeometry(keelShape, 8);
    const kp = keelGeo.attributes.position;
    for (let i = 0; i < kp.count; i++) kp.setZ(i, -0.006 + sd * 0.004 * (kp.getX(i) / 0.02));
    keelGeo.computeVertexNormals();
    const keel = new THREE.Mesh(keelGeo, keelMat);
    keel.position.set(sd * 0.002, 0.028, 0.012);
    keel.rotation.set(1.15 + (1 - open) * 0.2, 0, sd * 0.18);
    g.add(keel);
  }
  // 雄蕊束（10 枚，9+1）+ 雌蕊：藏在龙骨内，开放时微露
  const filMat = new THREE.MeshStandardMaterial({ color: 0xe8e4cc, roughness: 0.6 });
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI;
    const fil = taperTube(
      [new THREE.Vector3(Math.cos(a) * 0.004, 0.03, 0.014), new THREE.Vector3(Math.cos(a) * 0.008, 0.05, 0.02)],
      0.0016, 0.0012, filMat, { segs: 6, radialSegs: 4 }
    );
    g.add(fil);
    const anther = new THREE.Mesh(new THREE.SphereGeometry(0.0028, 8, 6), new THREE.MeshStandardMaterial({ color: 0xe8d070, roughness: 0.5 }));
    anther.position.set(Math.cos(a) * 0.008, 0.052, 0.02);
    g.add(anther);
  }
  const style = taperTube(
    [new THREE.Vector3(0, 0.03, 0.014), new THREE.Vector3(0.006, 0.056, 0.018), new THREE.Vector3(0.012, 0.066, 0.02)],
    0.0018, 0.0012, filMat, { segs: 8, radialSegs: 4 }
  );
  g.add(style);
  // 花瓣/龙骨/花丝/花药/萼筒按材质合批（萼片带贴图不参与），整花 ~28 draw → ~7
  mergeBatched(g, (o) => !o.material.map);
  g.scale.setScalar(scale);
  return g;
}

/** 豆荚：弧形放样 + 鼓粒波浪半径 + 缝合线 + 喙尖 + 花萼残留，bulge=鼓粒度 0..1 */
function makePod(len = 0.16, bulge = 1, ripe = 0) {
  const g = new THREE.Group();
  const col = new THREE.Color(COL.pod).lerp(new THREE.Color(COL.podRipe), ripe * 0.7);
  const mat = new THREE.MeshPhysicalMaterial({
    color: col, roughness: 0.42, clearcoat: 0.55, clearcoatRoughness: 0.3,
    sheen: 0.3, sheenColor: new THREE.Color(0xd8e8b0),
  });
  const pts = [];
  const N = 26;
  const arc = 0.35;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    pts.push(new THREE.Vector3(
      Math.sin(t * Math.PI) * len * arc * 0.35,
      t * len,
      Math.sin(t * Math.PI * 2) * 0.004
    ));
  }
  const seeds = 5;
  const pod = new THREE.Mesh(
    sweepTube(pts, (t) => {
      const base = 0.016 * (1 + 0.4 * bulge);
      // 鼓粒：沿荚长 5 粒种子的波浪鼓起
      const wave = bulge > 0.02
        ? Math.pow(Math.max(0, Math.sin(t * Math.PI * seeds)), 0.8) * 0.0055 * bulge
        : 0;
      const tipTaper = t > 0.9 ? 1 - (t - 0.9) / 0.1 : 1;
      const baseTaper = t < 0.08 ? 0.55 + t / 0.08 * 0.45 : 1;
      return { sx: (base + wave) * tipTaper * baseTaper, sz: (base * 0.72 + wave * 0.9) * tipTaper * baseTaper };
    }, { segs: 44, radialSegs: 12, capStart: false, up: [0, 0, 1] }),
    mat
  );
  g.add(pod);
  // 缝合线：背缝与腹缝两条细棱
  const curve = new THREE.CatmullRomCurve3(pts);
  const seamMat = new THREE.MeshStandardMaterial({ color: col.clone().multiplyScalar(0.82), roughness: 0.5 });
  for (const sd of [1, -1]) {
    const sp = [];
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      const p = curve.getPointAt(t);
      const r = 0.016 * (1 + 0.4 * bulge) * (t > 0.9 ? 1 - (t - 0.9) / 0.1 : 1);
      sp.push(new THREE.Vector3(p.x + sd * r * 0.5, p.y, p.z - r * 0.8));
    }
    g.add(tubeMesh(sp, 0.0022, seamMat, { segs: 20, radialSegs: 4, capStart: false, capEnd: false }));
  }
  // 喙尖（花柱残留的弯曲小尖）
  const tip = pts[pts.length - 1];
  const beak = taperTube(
    [tip.clone(), tip.clone().add(new THREE.Vector3(0.004, 0.008, 0)), tip.clone().add(new THREE.Vector3(0.01, 0.009, 0))],
    0.003, 0.0008, mat, { segs: 6, radialSegs: 5 }
  );
  g.add(beak);
  // 花萼残留
  const calyx = new THREE.Mesh(
    new THREE.LatheGeometry([[0.006, 0], [0.012, 0.008], [0.01, 0.016]].map(([r, y]) => new THREE.Vector2(r, y)), 14),
    new THREE.MeshStandardMaterial({ color: COL.calyx, roughness: 0.62 })
  );
  g.add(calyx);
  return g;
}

/** 豆荚剖面（开花结果章的剖开展示）：两片荚壳 + 5 粒种子着生腹缝 */
function makePodCutaway(len = 0.2) {
  const g = new THREE.Group();
  const shellMat = new THREE.MeshPhysicalMaterial({
    color: COL.pod, roughness: 0.5, clearcoat: 0.3,
    side: THREE.DoubleSide, sheen: 0.25, sheenColor: new THREE.Color(0xd8e8b0),
  });
  const innerMat = new THREE.MeshStandardMaterial({ color: 0xdfe8c2, roughness: 0.85, side: THREE.DoubleSide });
  const seeds = 5;
  const N = 30;
  const spine = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    spine.push(new THREE.Vector3(Math.sin(t * Math.PI) * len * 0.1, t * len, 0));
  }
  for (const sd of [1, -1]) {
    const prof = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const half = 0.017 * (1 + 0.35 * Math.pow(Math.max(0, Math.sin(t * Math.PI * seeds)), 0.9));
      // 壳的剖面弧：从腹缝到背缝
      for (let j = 0; j <= 10; j++) {
        const a = (j / 10) * Math.PI;
        const x = sd > 0 ? Math.cos(a) * half : -Math.cos(a) * half;
        const z = Math.sin(a) * half * 1.35 - (sd > 0 ? 0.001 : 0);
        prof.push(new THREE.Vector3(
          spine[i].x + x * 0.55,
          spine[i].y,
          z
        ));
      }
    }
    // 壳面：横向条带网格（两圈：外皮 / 内壁）
    const rows = N + 1;
    const cols = 11;
    const posArr = [];
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        const p = prof[i * cols + j];
        posArr.push(p.x, p.y, p.z + (sd > 0 ? 0.0008 : -0.0008));
      }
    }
    const idxArr = [];
    for (let i = 0; i < rows - 1; i++) {
      for (let j = 0; j < cols - 1; j++) {
        const a = i * cols + j, b = a + 1, c2 = a + cols, d = c2 + 1;
        idxArr.push(a, c2, b, b, c2, d);
      }
    }
    const shellGeo = new THREE.BufferGeometry();
    shellGeo.setAttribute('position', new THREE.Float32BufferAttribute(posArr, 3));
    shellGeo.setIndex(idxArr);
    shellGeo.computeVertexNormals();
    const shell = new THREE.Mesh(shellGeo, shellMat);
    shell.rotation.y = sd > 0 ? 0.85 : -0.85;
    g.add(shell);
  }
  // 种子着生腹缝
  for (let i = 0; i < seeds; i++) {
    const t = (i + 0.5) / seeds;
    const p = new THREE.Vector3(Math.sin(t * Math.PI) * len * 0.1, t * len, 0);
    const seed = makeSeed(1.25);
    seed.position.copy(p);
    seed.rotation.z = Math.PI * 0.5;
    seed.rotation.y = Math.sin(t * 9) * 0.2;
    g.add(seed);
    // 珠柄（funiculus 细丝）
    g.add(tubeMesh(
      [p.clone().add(new THREE.Vector3(0, -0.004, 0)), p.clone().add(new THREE.Vector3(0, -0.018, 0.006))],
      0.0016, new THREE.MeshStandardMaterial({ color: 0xd8e0b0, roughness: 0.7 }),
      { segs: 5, radialSegs: 4 }
    ));
  }
  return g;
}

/** 种子：椭球 + 种脐（ hilum 椭圆凹斑）+ 种孔 + 种脊；swollen=吸胀度 */
function makeSeed(swollen = 1, withHilum = true) {
  const g = new THREE.Group();
  const skin = new THREE.MeshPhysicalMaterial({
    map: makeSeedTexture(),
    roughness: 0.48,
    clearcoat: 0.5,
    clearcoatRoughness: 0.3,
  });
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.026, 22, 16), skin);
  body.scale.set(swollen, swollen * 0.72, swollen * 0.46);
  g.add(body);
  if (withHilum) {
    // 种脐：侧面 oval 深斑（微凹）
    const hilumMat = new THREE.MeshStandardMaterial({ color: 0x6a5232, roughness: 0.8 });
    const hilum = new THREE.Mesh(new THREE.CircleGeometry(0.008, 14), hilumMat);
    hilum.position.set(swollen * 0.024, -0.002, 0.002);
    hilum.rotation.y = Math.PI / 2;
    hilum.scale.set(1, 1.6, 1);
    g.add(hilum);
    // 种孔：种脐上端小点
    const micropyle = new THREE.Mesh(new THREE.CircleGeometry(0.0016, 8), hilumMat);
    micropyle.position.set(swollen * 0.0245, 0.008, 0.002);
    micropyle.rotation.y = Math.PI / 2;
    g.add(micropyle);
    // 种脊：种脐下端延伸细棱
    const raphe = taperTube(
      [new THREE.Vector3(swollen * 0.023, -0.006, 0.002), new THREE.Vector3(swollen * 0.02, -0.014, 0.003), new THREE.Vector3(swollen * 0.014, -0.018, 0.004)],
      0.0012, 0.0005, hilumMat, { segs: 6, radialSegs: 4 }
    );
    g.add(raphe);
  }
  return g;
}

/** 玉米颖果（果实！）：果皮种皮愈合 + 顶部花柱痕 + 基部果柄痕 + 胚在侧面 */
function makeMaizeGrain(scale = 1) {
  const g = new THREE.Group();
  const mat = new THREE.MeshPhysicalMaterial({
    color: 0xe8c860, roughness: 0.34, clearcoat: 0.8, clearcoatRoughness: 0.22,
  });
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.03, 24, 18), mat);
  body.scale.set(0.9, 1.25, 0.62);
  body.rotation.z = 0.06;
  g.add(body);
  // 冠部凹陷（dent corn 顶凹）
  const dent = new THREE.Mesh(new THREE.SphereGeometry(0.008, 12, 8, 0, Math.PI), new THREE.MeshStandardMaterial({ color: 0xc8a848, roughness: 0.5 }));
  dent.position.set(0, 0.028, 0);
  dent.rotation.x = Math.PI;
  dent.scale.set(1.6, 0.6, 1.1);
  g.add(dent);
  // 果柄痕（基部白点）
  const stem = new THREE.Mesh(new THREE.CircleGeometry(0.004, 10), new THREE.MeshStandardMaterial({ color: 0xf2ead2, roughness: 0.7 }));
  stem.position.set(0, -0.037, 0);
  stem.rotation.x = -Math.PI / 2;
  g.add(stem);
  // 胚区（侧面浅色盾片区）
  const embryoMat = new THREE.MeshPhysicalMaterial({ color: 0xe8d89a, roughness: 0.42, clearcoat: 0.4 });
  const embryo = new THREE.Mesh(new THREE.SphereGeometry(0.011, 14, 10), embryoMat);
  embryo.position.set(0.017, -0.008, 0.006);
  embryo.scale.set(0.5, 1.15, 0.8);
  embryo.rotation.z = -0.25;
  g.add(embryo);
  const scutellum = new THREE.Mesh(new THREE.CapsuleGeometry(0.005, 0.012, 4, 10), embryoMat);
  scutellum.position.set(0.02, -0.004, 0.004);
  scutellum.rotation.z = -0.3;
  g.add(scutellum);
  g.scale.setScalar(scale);
  return g;
}

/* ---------------- 根系（渐细主根 + 侧根阵列 + 根毛 + 根瘤 + 根冠） ---------------- */

/** 根贴地行进曲线：垂地 / 横放后拐弯向下，resp=向地性恢复进度 0..1 */
function rootSpine(day, tiltDay, resp) {
  const pts = [];
  const SEG = 22;
  const len = 0.9 * smooth(clamp((day - 2) / 16, 0, 1));
  const dirNow = new THREE.Vector2(0, -1);
  const tiltActive = tiltDay !== null && day > tiltDay;
  const bendK = tiltActive ? 1 - resp : 0;
  let p = new THREE.Vector2(0, -0.02);
  pts.push(new THREE.Vector3(p.x, p.y, 0));
  for (let i = 1; i <= SEG; i++) {
    const t = i / SEG;
    let d = dirNow.clone();
    if (tiltActive) {
      // 横放段先沿茎轴延伸，越靠尖端越早拐向下
      d = new THREE.Vector2(0, -1).lerp(new THREE.Vector2(1, 0), bendK * Math.max(0, 1 - t * 1.6)).normalize();
    }
    p = p.clone().add(d.multiplyScalar(len / SEG));
    p.x += Math.sin(t * 8 + day * 0.35) * 0.006;   // 根的自然波曲
    pts.push(new THREE.Vector3(p.x, p.y, 0));
  }
  return { pts, len };
}

function buildRoots(day, tiltDay = null) {
  const g = new THREE.Group();
  if (day < 2) return g;
  const resp = tiltDay !== null && day > tiltDay ? smooth(clamp((day - tiltDay) / 4, 0, 1)) : 0;
  const { pts, len } = rootSpine(day, tiltDay, resp);
  const curve = new THREE.CatmullRomCurve3(pts);
  const rootMat = new THREE.MeshStandardMaterial({ color: COL.root, roughness: 0.72 });
  g.add(taperTube(pts, 0.011, 0.0016, rootMat, { segs: 30, radialSegs: 8, capEnd: false }));
  // 根冠（分生区保护帽，微透明亮色）
  const tip = pts[pts.length - 1];
  const cap = new THREE.Mesh(
    new THREE.SphereGeometry(0.0042, 10, 8),
    new THREE.MeshStandardMaterial({ color: 0xe8dcc0, roughness: 0.4, transparent: true, opacity: 0.75 })
  );
  cap.position.copy(tip);
  g.add(cap);
  // 根尖生长点红标（教学定位点，章内可开关）
  const tipDot = new THREE.Mesh(
    new THREE.SphereGeometry(0.008, 10, 8),
    new THREE.MeshBasicMaterial({ color: COL.rootTip })
  );
  tipDot.position.copy(tip);
  g.add(tipDot);
  // 侧根：交错列 + 渐细 + 二级小侧根
  const nLat = 7;
  for (let i = 0; i < nLat; i++) {
    const d0 = 5 + i * 2.2;
    if (d0 > day) break;
    const t = 0.14 + 0.6 * (i / nLat);
    const idx = Math.round(t * (pts.length - 1));
    const base = pts[Math.min(idx, pts.length - 1)];
    const side = i % 2 ? 1 : -1;
    const ll = 0.24 * smooth(clamp((day - d0) / 8, 0, 1)) * (1 - t * 0.3);
    const lpts = [base.clone()];
    const sag = 0.5;
    for (let j = 1; j <= 7; j++) {
      const u = j / 7;
      lpts.push(base.clone().add(new THREE.Vector3(
        side * ll * u * Math.cos(sag),
        -ll * u * Math.sin(sag),
        Math.sin(u * 5 + i) * 0.004
      )));
    }
    g.add(taperTube(lpts, 0.0038, 0.0007, rootMat, { segs: 12, radialSegs: 6, capEnd: false }));
    // 二级侧根
    if (ll > 0.09) {
      for (let k = 0; k < 3; k++) {
        const u = 0.4 + k * 0.22;
        const bp2 = lpts[Math.round(u * 7)];
        const s2 = k % 2 ? 1 : -1;
        const l2 = ll * 0.3 * smooth(clamp((day - d0 - 4) / 6, 0, 1));
        if (l2 < 0.01) continue;
        g.add(taperTube(
          [bp2.clone(), bp2.clone().add(new THREE.Vector3(s2 * l2 * 0.5, -l2 * 0.55, 0)), bp2.clone().add(new THREE.Vector3(s2 * l2 * 0.8, -l2 * 0.95, 0))],
          0.0018, 0.0004, rootMat, { segs: 8, radialSegs: 4, capEnd: false }
        ));
      }
    }
  }
  // 根毛：成熟区密集细毛（InstancedMesh 省.draw call）
  const hairN = 64;
  const hairGeo = new THREE.CylinderGeometry(0.00035, 0.00012, 0.02, 3);
  const hairMat = new THREE.MeshBasicMaterial({ color: 0xe8dcc0, transparent: true, opacity: 0.55 });
  const hairs = new THREE.InstancedMesh(hairGeo, hairMat, hairN);
  const dummy = new THREE.Object3D();
  const rnd = mulberry(88);
  for (let i = 0; i < hairN; i++) {
    const t = 0.2 + rnd() * 0.6;
    const p = curve.getPointAt(t);
    const a = rnd() * TAU;
    dummy.position.set(p.x + Math.cos(a) * 0.006, p.y + rnd() * 0.014 - 0.007, Math.sin(a) * 0.006);
    dummy.rotation.set(rnd() * 0.8 + 0.4, rnd() * TAU, rnd() * 0.6);
    dummy.scale.setScalar(0.7 + rnd() * 0.8);
    dummy.updateMatrix();
    hairs.setMatrixAt(i, dummy.matrix);
  }
  g.add(hairs);
  // 根瘤（豆科固氮共生的圆瘤，成熟侧根上 3 个）
  if (day >= 12) {
    const nodMat = new THREE.MeshPhysicalMaterial({ color: COL.nodule, roughness: 0.62, clearcoat: 0.2 });
    for (let i = 0; i < 3; i++) {
      const t = 0.3 + i * 0.22;
      const p = curve.getPointAt(t);
      const nod = new THREE.Mesh(new THREE.SphereGeometry(0.009, 12, 10), nodMat);
      nod.scale.set(1, 1.25, 1);
      nod.position.set(p.x + (i % 2 ? 0.02 : -0.02), p.y + 0.01, 0.012 + i * 0.004);
      g.add(nod);
      const lob = new THREE.Mesh(new THREE.SphereGeometry(0.005, 10, 8), nodMat);
      lob.position.copy(nod.position).add(new THREE.Vector3(i % 2 ? 0.006 : -0.006, -0.008, 0.004));
      g.add(lob);
    }
  }
  return g;
}
/* =====================================================================
 * 菜豆全株参数化生长模型（按生理日程）
 * ===================================================================== */

const SCHED = {
  imbibed: 1,          // 吸胀
  hookStart: 3,        // 弯钩开始顶土
  emerge: 7,           // 子叶出土
  hookErect: 9,        // 弯钩伸直
  primaryDay: 10,      // 第一对真叶（单叶）
  tri0: 14, triGap: 5, triN: 5,   // 三出复叶
  branchDay: 30,
  budDay: 32, bloomDay: 36, podDay: 44,
  mature: 56,
};

function stageName(day) {
  if (day < SCHED.hookStart) return '吸胀';
  if (day < SCHED.emerge) return '弯钩顶土';
  if (day < SCHED.hookErect + 2) return '出土展子叶';
  if (day < 14) return '真叶展开';
  if (day < SCHED.budDay) return '营养生长（复叶节节高）';
  if (day < SCHED.podDay) return '现蕾开花';
  return '结荚鼓粒';
}

/**
 * 菜豆全株构建器。opts: { dark(黄化苗), droop(萎蔫), colorMod(偏黄), scale }
 * 返回 Group，原点在土表。
 */
function buildBean(day, opts = {}) {
  const dark = !!opts.dark;
  const droop = opts.droop || 0;
  const colMod = opts.colorMod || 0;
  const g = new THREE.Group();
  const H = 1.5 * Math.pow(clamp((day - 6) / 42, 0, 1), 0.85) * (dark ? 1.35 : 1);
  const leafTint = new THREE.Color(dark ? COL.pale : COL.leaf).lerp(new THREE.Color(0xd8c058), colMod);
  const stemCol = dark ? 0xb9ae62 : COL.stem;
  const stemMat = new THREE.MeshPhysicalMaterial({
    color: stemCol, roughness: 0.58, clearcoat: 0.25, clearcoatRoughness: 0.5,
    sheen: 0.22, sheenColor: new THREE.Color(0xcfe0b8),
  });

  /* —— 地下：种子 + 初根 —— */
  if (day >= 0.5) {
    const seed = makeSeed(clamp(1 + (day - 1) * 0.16, 1, 1.32));
    seed.position.set(0, -0.075, 0);
    seed.rotation.z = 0.5;
    g.add(seed);
    if (day >= 1.5) {
      const radLen = clamp((day - 1.5) / 4, 0, 1) * 0.16;
      g.add(taperTube(
        [new THREE.Vector3(0, -0.09, 0), new THREE.Vector3(0.008, -0.09 - radLen * 0.6, 0.004), new THREE.Vector3(0.012, -0.09 - radLen, 0.006)],
        0.005, 0.0012, new THREE.MeshStandardMaterial({ color: COL.root, roughness: 0.72 }),
        { segs: 10, radialSegs: 6, capEnd: false }
      ));
    }
  }

  /* —— 未出土：弯钩雏形 —— */
  if (day < SCHED.emerge - 0.5) {
    if (day >= SCHED.hookStart) {
      const rise = clamp((day - SCHED.hookStart) / (SCHED.emerge - SCHED.hookStart), 0, 1);
      const hook = makeHook(0.15 + rise * 0.1);
      hook.position.y = -0.12 + rise * 0.14;
      hook.scale.setScalar(0.7 + rise * 0.25);
      g.add(hook);
    }
    return g;
  }

  /* —— 出土后：弯钩立起期，整株以弯钩为主 —— */
  if (day < SCHED.hookErect + 1.5) {
    const erect = clamp((day - SCHED.emerge) / (SCHED.hookErect - SCHED.emerge + 1), 0, 1);
    const hook = makeHook(0.25 + erect * 0.75);
    hook.position.y = 0.02 + erect * 0.05;
    g.add(hook);
    const cots = makeCotyledon(0.12 * erect, 0.34);
    cots.position.y = 0.055;
    cots.rotation.y = 0.3;
    g.add(cots);
    return g;
  }

  /* —— 直立生长期 —— */
  const hookResid = Math.max(0, 1 - (day - SCHED.hookErect) / 3);   // 顶端残余弯钩
  const pts = [new THREE.Vector3(0, -0.03, 0)];
  const N = 12;
  for (let i = 1; i <= N; i++) {
    const t = i / N;
    const y = H * t;
    const sway = Math.sin(t * 2.6 + day * 0.04) * 0.022 * t + Math.sin(t * 5.2 + 1.1) * 0.006 * t;
    pts.push(new THREE.Vector3(sway, y, Math.cos(t * 2.2 + day * 0.02) * 0.012));
  }
  // 顶端残余弯钩：最上两点随 hookResid 向一侧折
  if (hookResid > 0.02) {
    const bend = hookResid * 0.3;
    pts[N] = new THREE.Vector3(pts[N].x + bend, pts[N].y - bend * 0.55, pts[N].z);
    pts[N - 1] = new THREE.Vector3(pts[N - 1].x + bend * 0.45, pts[N - 1].y, pts[N - 1].z);
  }
  // 复叶节点 t 值表
  const nodeTs = [];
  const triT = [];
  for (let k = 0; k < SCHED.triN; k++) {
    const tH = clamp(0.16 + k * 0.155, 0.08, 0.94);
    const d0 = SCHED.tri0 + k * SCHED.triGap;
    if (d0 <= day) triT.push({ t: tH, age: day - d0, side: k % 2 === 0 ? 1 : -1, k });
    nodeTs.push(tH);
  }
  const stem = buildStem(pts, dark ? 0.015 : 0.021, 0.01, {
    color: stemCol, young: day < 16, nodes: nodeTs, mat: stemMat, segs: 46,
  });
  g.add(stem);

  // 子叶（出土后留在下胚轴，逐渐萎缩脱落）
  if (day < 24) {
    const wilt = smooth(clamp((day - 12) / 12, 0, 1));
    const cots = makeCotyledon(wilt * 0.9, 0.3);
    cots.position.y = 0.052;
    cots.rotation.y = 0.35;
    cots.scale.setScalar(1 - wilt * 0.35);
    cots.visible = wilt < 0.96;
    g.add(cots);
  }
  // 第一对真叶（对生单叶）
  const primAge = (day - SCHED.primaryDay) / 7;
  if (primAge > 0.02) {
    for (const sd of [-1, 1]) {
      const leaf = makeLeafMesh('simple', { size: (dark ? 0.13 : 0.26) * smooth(clamp(primAge, 0, 1)), color: leafTint.getHex(), vein: dark ? 0xa89c58 : COL.leafVeinDark, seed: 11 + sd });
      const anchor = stemCurvePoint(pts, 0.1);
      leaf.position.copy(anchor).add(new THREE.Vector3(sd * 0.012, 0.015, 0));
      leaf.rotation.set(-1.15 - droop * 0.8, sd * 1.85, sd * 0.42);
      g.add(leaf);
      g.add(taperTube(
        [anchor.clone(), anchor.clone().add(new THREE.Vector3(sd * 0.024, 0.032, 0))],
        0.005, 0.003, stemMat, { segs: 6, radialSegs: 5 }
      ));
    }
  }
  // 三出复叶
  for (const tri of triT) {
    const grow = smooth(clamp(tri.age / 6, 0, 1));
    if (grow < 0.03) continue;
    const anchor = stemCurvePoint(pts, tri.t);
    const leafGrp = makeTrifoliate((dark ? 0.15 : 0.32) * (1 + tri.k * 0.045) * grow, leafTint.getHex(), {
      droop: droop * 0.6 + (tri.age > 12 ? 0.12 : 0),
      stemColor: stemCol,
      seed: 20 + tri.k * 3,
    });
    leafGrp.position.copy(anchor);
    leafGrp.rotation.y = tri.side * 2.1 + Math.sin(tri.k * 2.4) * 0.3;
    leafGrp.rotation.z = -tri.side * 0.12 - droop * 0.25;
    g.add(leafGrp);
  }
  // 分枝（两条，自复叶节上方斜出）
  if (day >= SCHED.branchDay) {
    for (const bi of [1, 2]) {
      const d0 = SCHED.branchDay + bi * 3;
      if (d0 > day) break;
      const grow = smooth(clamp((day - d0) / 9, 0, 1));
      if (grow < 0.03) continue;   // 恰在分枝日：叶尺寸为 0，跳过防零尺寸退化几何
      const anchor = stemCurvePoint(pts, 0.3 + bi * 0.22);
      const dir = bi % 2 ? 1 : -1;
      const bpts = [
        anchor.clone(),
        anchor.clone().add(new THREE.Vector3(dir * 0.1 * grow, 0.14 * grow, 0.02)),
        anchor.clone().add(new THREE.Vector3(dir * 0.24 * grow, 0.3 * grow, 0.03)),
      ];
      g.add(buildStem(bpts, 0.012, 0.006, { color: stemCol, segs: 16 }));
      const bl = makeTrifoliate(0.24 * grow, leafTint.getHex(), { droop: droop * 0.5, stemColor: stemCol, seed: 40 + bi });
      bl.position.copy(bpts[2]);
      bl.rotation.y = dir * 1.4;
      g.add(bl);
    }
  }
  // 花 → 荚（三个结实节）
  const podNodes = [0.3, 0.48, 0.66];
  podNodes.forEach((tH, i) => {
    const d0 = SCHED.budDay + i * 2.5;
    if (d0 > day) return;
    const anchor = stemCurvePoint(pts, tH);
    const side = i % 2 ? 0.05 : -0.05;
    const pos = anchor.clone().add(new THREE.Vector3(side, -0.035, 0.028));
    if (day < SCHED.podDay + i * 2) {
      const open = smooth(clamp((day - SCHED.bloomDay - i * 2) / 2.2, 0, 1));
      const fl = makeFlower(0.15 + open * 0.85, 0.9 + open * 0.25);
      fl.position.copy(pos);
      fl.rotation.set(-0.5, side * 3.4, side * 0.4);
      g.add(fl);
    } else {
      const grow = smooth(clamp((day - SCHED.podDay - i * 2) / 10, 0, 1));
      const pod = makePod(0.07 + 0.17 * grow, grow, clamp((day - 50) / 6, 0, 1));
      pod.position.copy(pos);
      pod.rotation.set(-0.35, side * 2.2, side * 1.1);
      g.add(pod);
    }
  });
  g.scale.setScalar(opts.scale || 1);
  return g;
}

/** 在茎控制点序列上取参数 t 处的位置（含 Catmull 插值近似） */
function stemCurvePoint(pts, t) {
  const curve = new THREE.CatmullRomCurve3(pts);
  return curve.getPointAt(clamp(t, 0.02, 0.98));
}

/* =====================================================================
 * 章节（12 章 · 三编组）
 * ===================================================================== */

/* ---------- 第 1 章：一株菜豆 ---------- */

const ST1 = { day: 16, labels: true, playing: false };

const secOverview = {
  title: '一株菜豆',
  group: '观察 · 生活史',
  html: `<p>按真实生理节奏，延时放完一株菜豆的一生（约 56 天）：种子吸胀 → 弯钩顶土 → 子叶出土 → 第一对真叶 → 三出复叶节节高 → 分枝 → 蝶形花 → 豆荚鼓粒。</p>
<p>留意两个经典细节：① 出土时幼芽不是"顶"出来的，而是弯成<b>弯钩</b>、以弯背拱土，保护生长点；② 子叶出土后逐渐萎缩——它把储存的养分让渡给了幼苗。</p>
<p>拖动时间轴或按空格播放；打开「部位标注」对照各结构名称。</p>`,
  enter() {
    resetWorld();
    camTo([1.75, 1.05, 2.35], [0.02, 0.5, 0]);
    const grp = newSceneGroup();
    buildHud([['day', '生理日程'], ['height', '株高'], ['stage', '物候期'], ['fruit', '结实数']]);
    ctl.clear();
    const plantG = new THREE.Group();
    grp.add(plantG);
    const labelsG = new THREE.Group();
    grp.add(labelsG);
    const label3 = (text, color, scale = 0.0022) => makeTextSprite(text, { fontSize: 40, color, scale });
    const refresh = () => {
      clearGroup(plantG);
      plantG.add(buildBean(ST1.day));
      clearGroup(labelsG);
      const H = 1.5 * Math.pow(clamp((ST1.day - 6) / 42, 0, 1), 0.85);
      if (ST1.labels) {
        const put = (text, color, pos) => {
          const l = label3(text, color);
          l.position.copy(pos);
          labelsG.add(l);
        };
        if (ST1.day >= 5 && ST1.day < 10) put('弯钩（护住生长点）', '#ffd166', new THREE.Vector3(0.34, 0.3, 0));
        if (ST1.day >= 8 && ST1.day < 24) put('子叶（储存养分）', '#ffd166', new THREE.Vector3(-0.42, 0.12, 0.06));
        if (ST1.day >= 11) put('真叶', '#9fe870', new THREE.Vector3(0.36, H * 0.16, 0));
        if (ST1.day >= 18) put('三出复叶', '#9fe870', new THREE.Vector3(-0.5, H * 0.46, 0.05));
        if (ST1.day >= 36) put('蝶形花', '#f2b8cb', new THREE.Vector3(0.42, H * 0.6, 0.08));
        if (ST1.day >= 46) put('豆荚（果实）', '#9fe870', new THREE.Vector3(0.42, H * 0.44, 0.1));
        if (ST1.day < 8) put('种子（土下吸胀）', '#e2d4ae', new THREE.Vector3(0.3, 0.12, 0));
      }
      let fruit = 0;
      if (ST1.day >= SCHED.podDay) fruit = Math.min(3, Math.floor((ST1.day - SCHED.podDay) / 2) + 1);
      hud.set('day', `第 ${Math.round(ST1.day)} 天`);
      hud.set('height', `${H.toFixed(2)} m`);
      hud.set('stage', stageName(ST1.day));
      hud.set('fruit', ST1.day < SCHED.budDay ? '—' : `${fruit} 荚 · ${fruit * 5} 粒种子`);
    };
    const tl = timelineCtl({ min: 0, max: 56, value: ST1.day, speed: 4, onFrame: (v) => { ST1.day = v; refresh(); } });
    ctl.sep();
    ctl.toggle({ label: '部位标注', value: ST1.labels, onChange: (v) => { ST1.labels = v; refresh(); } });
    ctl.button({ label: '↺ 从头看一遍', onClick: () => { ST1.day = 0; tl.slider.set(0); refresh(); } });
    refresh();
    ST1.tick = tl.tick;
    bindPlayToggle(tl);
    chapterTick = (dt) => { tl.tick(dt); };
  },
  leave() { ST1.tick = null; },
};

/** 时间轴控件（播放 + 滑杆 + 空格联动），每章实例化 */
function timelineCtl({ min = 0, max = 60, value = 0, speed = 3, fmt, onFrame }) {
  const st = { value, playing: false, speed, onFrame, min, max };
  st.playBtn = ctl.button({
    label: '▶ 播放',
    onClick() {
      st.playing = !st.playing;
      st.playBtn.textContent = st.playing ? '⏸ 暂停' : '▶ 播放';
      st.playBtn.classList.toggle('active', st.playing);
    },
  });
  st.slider = ctl.slider({
    label: fmt?.slider ?? '进度',
    min, max, step: fmt ? fmt.step : 0.2, value,
    fmt: (v) => (fmt ? fmt.fmt(v) : `第 ${Math.round(v)} 天`),
    onInput: (v) => {
      st.value = v; st.playing = false;
      st.playBtn.textContent = '▶ 播放';
      st.playBtn.classList.remove('active');
      st.onFrame(v);
    },
  });
  st.tick = (dt) => {
    if (!st.playing) return;
    st.value += dt * st.speed;
    if (st.value >= st.max) {
      st.value = st.max;
      st.playing = false;
      st.playBtn.textContent = '▶ 播放';
      st.playBtn.classList.remove('active');
    }
    st.slider.set(st.value);
    st.onFrame(st.value);
  };
  st.toggle = () => st.playBtn.click();
  return st;
}

/* ---------- 第 2 章：种子萌发的条件 ---------- */

const ST2 = { day: 7 };

const secGerminate = {
  title: '种子萌发的条件',
  group: '观察 · 生活史',
  html: `<p>四只烧杯做<b>对照实验</b>，每杯放同批菜豆种子：</p>
<p><b>A</b> 室温 + 适量水 + 通气（<span class="hl">对照组</span>）；<b>B</b> 室温 + 不加水；<b>C</b> 加水淹没种子（隔绝空气）；<b>D</b> 适量水 + 冰箱低温。</p>
<p>只有 A 萌发 → 菜豆种子萌发必须同时满足三个外界条件：<span class="hl">充足的水分、充足的空气、适宜的温度</span>。内部条件是胚完整且有大养料储备（子叶）。</p>
<p>拖动「天数」看 7 天里的差别；只有 A 杯的种子按萌发三部曲（吸水 → 弯钩 → 子叶出土）变化。</p>`,
  enter() {
    resetWorld();
    camTo([2.5, 1.25, 3.1], [0.55, 0.22, 0]);
    const grp = newSceneGroup();
    buildHud([['day', '实验日程'], ['germ', '萌发的种子'], ['grate', '萌发率'], ['var', '单一变量'], ['rule', '结论']]);
    ctl.clear();
    const cupsG = new THREE.Group();
    grp.add(cupsG);
    const CUPS = [
      { name: 'A 对照', cond: '水 + 气 + 25℃', ok: true },
      { name: 'B 无水', cond: '不加水', ok: false },
      { name: 'C 无气', cond: '加水淹没', ok: false },
      { name: 'D 低温', cond: '4℃ 冰箱', ok: false },
    ];
    let cards = [];
    const refresh = () => {
      clearGroup(cupsG);
      cards.forEach((c) => {
        if (c.material) { c.material.map?.dispose?.(); c.material.dispose(); }
        grp.remove(c);
      });
      cards = [];
      const glassMat = matGlassLite(COL.glassTint, { opacity: 0.32 });
      CUPS.forEach((cup, i) => {
        const gg = new THREE.Group();
        const x = 0.18 + i * 0.52;
        gg.position.x = x;
        // 玻璃杯（Lathe 放样：口沿外翻 + 壁厚 + 杯底圆角）
        const prof = [
          [0.001, 0], [0.132, 0], [0.148, 0.012], [0.152, 0.03], [0.156, 0.34], [0.162, 0.37], [0.166, 0.385], [0.158, 0.39],
        ].map(([r, y]) => new THREE.Vector2(r, y));
        gg.add(new THREE.Mesh(new THREE.LatheGeometry(prof, 36), glassMat));
        // 土壤（干/湿双色）
        const wet = cup.name === 'B 无水' ? 0 : cup.name === 'C 无气' ? 0.85 : 0.5;
        const soil = new THREE.Mesh(
          new THREE.CylinderGeometry(0.142, 0.128, 0.26, 30),
          new THREE.MeshStandardMaterial({ map: makeSoilTexture(wet, 50 + i * 7), roughness: 0.96 })
        );
        soil.position.y = 0.135;
        gg.add(soil);
        // 土表三粒种子（微露）
        for (let s = 0; s < 3; s++) {
          const seed = makeSeed(ST2.day >= 1 ? 1.24 : 1, s === 0);
          const a = (s / 3) * TAU + i;
          seed.position.set(Math.cos(a) * 0.05, 0.268 - s * 0.004, Math.sin(a) * 0.05);
          seed.rotation.y = a * 2;
          gg.add(seed);
        }
        // A 杯萌发三部曲
        if (cup.ok && ST2.day >= 2) {
          const d = ST2.day;
          const rootLen = smooth(clamp((d - 2) / 4, 0, 1)) * 0.17;
          const rootMat = new THREE.MeshStandardMaterial({ color: COL.root, roughness: 0.72 });
          gg.add(taperTube(
            [new THREE.Vector3(0, 0.26, 0), new THREE.Vector3(0.012, 0.26 - rootLen * 0.6, 0.004), new THREE.Vector3(0.018, 0.26 - rootLen, 0.005)],
            0.005, 0.001, rootMat, { segs: 10, radialSegs: 6, capEnd: false }
          ));
          if (d >= 3.5) {
            const hook = makeHook(clamp((d - 3.5) / 3, 0, 1));
            hook.position.y = 0.26;
            hook.scale.setScalar(0.8);
            gg.add(hook);
          }
        }
        // C 杯：水面淹没 + 缺氧泡
        if (cup.name === 'C 无气' && ST2.day >= 0.5) {
          const w = new THREE.Mesh(
            new THREE.CylinderGeometry(0.15, 0.15, 0.16, 30),
            new THREE.MeshPhysicalMaterial({ color: COL.water, transparent: true, opacity: 0.4, roughness: 0.1 })
          );
          w.position.y = 0.3;
          gg.add(w);
          const surface = new THREE.Mesh(new THREE.CircleGeometry(0.15, 30), new THREE.MeshStandardMaterial({ color: 0xcfe8f8, transparent: true, opacity: 0.5, roughness: 0.05, metalness: 0.1 }));
          surface.rotation.x = -Math.PI / 2;
          surface.position.y = 0.381;
          gg.add(surface);
          // 泡皮生物膜（隔绝空气的暗示）：水面上细密小泡
          for (let b = 0; b < 9; b++) {
            const bb = new THREE.Mesh(new THREE.SphereGeometry(0.006 + (b % 3) * 0.003, 8, 6), new THREE.MeshStandardMaterial({ color: 0xd8f0ff, transparent: true, opacity: 0.5 }));
            bb.position.set(Math.sin(b * 2.3) * 0.11, 0.384, Math.cos(b * 2.3) * 0.11);
            bb.scale.y = 0.4;
            gg.add(bb);
          }
        }
        // D 杯：雪花标注 + 低温青调
        if (cup.name === 'D 低温') {
          const snow = makeTextSprite('❄', { fontSize: 60, color: '#9adfff', scale: 0.01 });
          snow.position.set(x, 0.62, 0);
          cards.push(snow);
          grp.add(snow);
          gg.traverse((o) => { if (o.material && o.material.color && !o.material.map) o.material = o.material.clone(); });
        }
        // 变量标签牌（立在杯前）
        const card = new THREE.Mesh(
          new THREE.PlaneGeometry(0.24, 0.1),
          new THREE.MeshStandardMaterial({
            map: makeLabelTexture([cup.name, cup.cond], { w: 256, h: 106, accent: cup.ok ? '#3a6a2c' : '#6a4a3c', lineSizes: [30, 17] }),
            roughness: 0.7, side: THREE.DoubleSide,
          })
        );
        card.position.set(x, 0.035, 0.3);
        card.rotation.x = -0.18;
        cards.push(card);
        grp.add(card);
        const sh = contactShadow(0.5, 0.5, 0.75);
        sh.position.set(x, BENCH_Y + 0.003, 0);
        cupsG.add(sh);
        cupsG.add(gg);
      });
      const sprouted = CUPS[0].ok && ST2.day >= 5 ? '仅 A 杯萌发（3 部曲走完）' : ST2.day >= 2 ? 'A 杯正在弯钩顶土' : '尚未萌发';
      const germN = ST2.day >= 5 ? 3 : ST2.day >= 2 ? 1 : 0;
      hud.set('day', `第 ${Math.round(ST2.day)} 天`);
      hud.set('germ', sprouted);
      hud.set('grate', `${germN}/3 · ${Math.round((germN / 3) * 100)}%${ST2.day >= 5 ? '（A 杯全萌发）' : ST2.day >= 2 ? '（破皮露白中）' : ''}`);
      hud.set('var', '水分 / 空气 / 温度（每次只动一个）');
      hud.set('rule', ST2.day >= 5 ? '三条件缺一不可 → 对照实验的推理力量' : '对照：只有变量不同，其余全同');
    };
    const tl = timelineCtl({ max: 7, value: ST2.day, speed: 1.2, onFrame: (v) => { ST2.day = v; refresh(); } });
    ctl.sep();
    ctl.button({ label: '↺ 复位重种', onClick: () => { ST2.day = 0; tl.slider.set(0); refresh(); } });
    refresh();
    ST2.tick = tl.tick;
    bindPlayToggle(tl);
    chapterTick = (dt) => tl.tick(dt);
  },
  leave() { ST2.tick = null; },
};

/* ---------- 第 3 章：种子的结构 ---------- */

const ST3 = { soak: true, crop: 'bean', part: 0 };

const PARTS_BEAN = [
  ['种皮', '保护胚，控制透气透水；浸泡一夜后变软易剥。'],
  ['子叶 ×2', '肥厚储养库——萌发初期的"饭盒"，出土后见光转绿渐萎缩。'],
  ['胚芽', '顶端生长点，将来长成茎和叶。'],
  ['胚轴', '连接芽根的过渡区，出土型种子靠它把子叶顶出土。'],
  ['胚根', '萌发时率先拱破种皮，此后长成主根。'],
];
const PARTS_MAIZE = [
  ['果皮 + 种皮', '愈合为一层（所以玉米"种子"其实是果实）——与菜豆分离的种皮不同。'],
  ['胚乳', '占绝大部分的营养储备（淀粉），菜豆没有这一层。'],
  ['子叶 ×1', '一片，形如盾牌（盾片），负责吸收胚乳养分喂给胚。'],
  ['胚芽', '外包芽鞘，出土靠芽鞘穿刺。'],
  ['胚根', '外包根鞘，萌发先出。'],
];

const secSeed = {
  title: '种子的结构',
  group: '观察 · 生活史',
  html: `<p>解剖一粒泡软的菜豆种子：<span class="hl">种皮</span>（保护）剥开后是两片肥厚的<b>子叶</b>，夹在中间的<b>胚</b>由胚芽、胚轴、胚根组成——胚是新植株的雏形，子叶是它的"行军粮"。</p>
<p>对照玉米"种子"：果皮与种皮<b>愈合在一起</b>分不开（颖果），养分主要存在<b>胚乳</b>——所以玉米粒其实是<b>果实</b>。两类种子对比着看，"单子叶 vs 双子叶"一目了然。</p>
<p>点左侧清单逐个高亮；切换「干种子 / 浸泡一夜」看吸胀变化；切换菜豆 / 玉米对照。</p>`,
  enter() {
    resetWorld();
    camTo([0.62, 0.42, 0.95], [0, 0.22, 0]);
    const grp = newSceneGroup();
    buildHud([['crop', '标本'], ['soak', '状态'], ['part', '当前结构'], ['note', '备注']]);
    ctl.clear();
    const modelG = new THREE.Group();
    grp.add(modelG);
    const leadersG = new THREE.Group();
    grp.add(leadersG);
    // 解剖盘（浅陶盘 + 盘底水痕）
    const dish = new THREE.Group();
    const dishProf = [[0.005, 0], [0.3, 0.01], [0.34, 0.05], [0.36, 0.07], [0.355, 0.075]].map(([r, y]) => new THREE.Vector2(r, y));
    const dishMat = new THREE.MeshPhysicalMaterial({ color: 0xe8e2d4, roughness: 0.3, clearcoat: 0.7, clearcoatRoughness: 0.2 });
    dish.add(new THREE.Mesh(new THREE.LatheGeometry(dishProf, 48), dishMat));
    dish.position.y = BENCH_Y;
    grp.add(dish);
    const dishSh = contactShadow(0.95, 0.95, 0.8);
    dishSh.position.set(0, BENCH_Y + 0.003, 0);
    grp.add(dishSh);
    let highlight = [];
    const parts = () => (ST3.crop === 'bean' ? PARTS_BEAN : PARTS_MAIZE);
    const buildModel = () => {
      clearGroup(modelG);
      highlight.forEach((m) => m.parent && m.parent.remove(m));
      highlight = [];
      const swollen = ST3.soak ? 1.22 : 1;
      if (ST3.crop === 'bean') {
        // 菜豆：两瓣子叶微张开（露出夹在中间的胚）
        const split = ST3.soak ? 0.42 : 0.3;
        for (const sd of [-1, 1]) {
          const cotMat = new THREE.MeshPhysicalMaterial({
            color: ST3.soak ? 0xd8e2b0 : 0xc8bd90,
            roughness: 0.42, clearcoat: 0.4, clearcoatRoughness: 0.3,
            sheen: 0.4, sheenColor: new THREE.Color(0xe8f0c8),
          });
          const half = new THREE.Mesh(new THREE.SphereGeometry(0.16, 32, 24, 0, Math.PI * 0.96, 0, Math.PI), cotMat);
          half.rotation.y = sd > 0 ? 0.02 : Math.PI - 0.02;
          half.rotation.z = sd * split * 0.5;
          half.scale.set(1.15 * swollen, 0.86 * swollen, 0.62 * swollen);
          half.position.y = 0.12;
          half.userData.part = sd > 0 ? 1 : 1;
          modelG.add(half);
          highlight.push(half);
          // 子叶剖面内侧（半圆平面，淡黄）
          const face = new THREE.Mesh(new THREE.CircleGeometry(0.155, 28, 0, Math.PI), new THREE.MeshStandardMaterial({ color: 0xe8e0b8, roughness: 0.85, side: THREE.DoubleSide }));
          face.rotation.y = sd > 0 ? Math.PI / 2 : -Math.PI / 2;
          face.rotation.x = 0.06;
          face.scale.set(swollen, swollen * 0.62, 1);
          face.position.set(sd * 0.004 * split, 0.12, 0);
          modelG.add(face);
        }
        // 种皮：剥开的两片壳（半透明膜片，翻在两侧）
        const skinMat = new THREE.MeshPhysicalMaterial({
          map: makeSeedTexture(), roughness: 0.5, clearcoat: 0.5,
          transparent: true, opacity: ST3.soak ? 0.72 : 0.95, side: THREE.DoubleSide, forceSinglePass: true,
        });
        for (const sd of [-1, 1]) {
          const shell = new THREE.Mesh(new THREE.SphereGeometry(0.175, 26, 18, 0, Math.PI * 0.5, 0.2, Math.PI * 0.7), skinMat);
          shell.rotation.z = sd * (1.9 - (ST3.soak ? 0.15 : 0));
          shell.rotation.y = sd * 0.4;
          shell.scale.set(1.14 * swollen, 0.9 * swollen, 0.5 * swollen);
          shell.position.y = 0.115;
          shell.userData.part = 0;
          modelG.add(shell);
          highlight.push(shell);
        }
        // 胚：胚芽（两片雏叶）+ 胚轴 + 胚根，夹在子叶间
        const embY = 0.13;
        const embMat = new THREE.MeshStandardMaterial({ color: 0xb8d878, roughness: 0.55 });
        const radicle = taperTube(
          [new THREE.Vector3(0, embY - 0.02, 0.02), new THREE.Vector3(0.01, embY - 0.11, 0.03), new THREE.Vector3(0.018, embY - 0.18, 0.034)],
          0.016, 0.007, embMat, { segs: 12, radialSegs: 8 }
        );
        radicle.userData.part = 4;
        modelG.add(radicle);
        highlight.push(radicle);
        const axis = new THREE.Mesh(new THREE.CapsuleGeometry(0.013, 0.05, 4, 12), embMat);
        axis.position.set(0.004, embY - 0.015, 0.02);
        axis.rotation.x = 0.25;
        axis.userData.part = 3;
        modelG.add(axis);
        highlight.push(axis);
        for (const sd of [-1, 1]) {
          const plumule = makeLeafMesh('simple', { size: 0.045, color: 0x9fce60, vein: 0x6a9a3e, seed: 31 + sd, cup: 0.6 });
          plumule.position.set(sd * 0.008, embY + 0.045, 0.02);
          plumule.rotation.set(-0.8, sd * 0.8, sd * 0.35);
          plumule.scale.setScalar(0.9);
          plumule.traverse((o) => { o.userData.part = 2; });
          modelG.add(plumule);
          highlight.push(plumule);
        }
      } else {
        // 玉米颖果纵剖：外果皮壳 + 大胚乳 + 侧面胚
        const pericarpMat = new THREE.MeshPhysicalMaterial({
          color: 0xe8c860, roughness: 0.36, clearcoat: 0.75, clearcoatRoughness: 0.25, side: THREE.DoubleSide,
        });
        const shellGeo = new THREE.SphereGeometry(0.2, 30, 22, 0, Math.PI * 0.92, 0, Math.PI * 1.05);
        const shell = new THREE.Mesh(shellGeo, pericarpMat);
        shell.scale.set(0.95, 1.2, 0.75);
        shell.position.y = 0.15;
        shell.userData.part = 0;
        modelG.add(shell);
        highlight.push(shell);
        // 胚乳（内芯，切面朝向镜头）
        const endoMat = new THREE.MeshPhysicalMaterial({ color: 0xf2e0a0, roughness: 0.4, clearcoat: 0.3 });
        const endo = new THREE.Mesh(new THREE.SphereGeometry(0.175, 28, 20, 0, Math.PI), endoMat);
        endo.scale.set(0.88, 1.14, 0.7);
        endo.position.y = 0.15;
        endo.userData.part = 1;
        modelG.add(endo);
        highlight.push(endo);
        const endoFace = new THREE.Mesh(new THREE.CircleGeometry(0.17, 28), new THREE.MeshStandardMaterial({ color: 0xf2e6b8, roughness: 0.75, side: THREE.DoubleSide }));
        endoFace.rotation.y = Math.PI / 2;
        endoFace.scale.set(1, 1.12, 0.72);
        endoFace.position.set(0.002, 0.15, 0);
        endoFace.userData.part = 1;
        modelG.add(endoFace);
        // 盾片子叶 + 胚芽 + 胚根（嵌在侧面）
        const embMat = new THREE.MeshStandardMaterial({ color: 0xd8e090, roughness: 0.55 });
        const scut = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.12, 4, 14), embMat);
        scut.position.set(0.115, 0.115, 0.05);
        scut.rotation.z = 0.5;
        scut.scale.set(0.6, 1, 0.7);
        scut.userData.part = 2;
        modelG.add(scut);
        highlight.push(scut);
        const shoot = taperTube(
          [new THREE.Vector3(0.13, 0.22, 0.05), new THREE.Vector3(0.15, 0.3, 0.05)],
          0.014, 0.01, embMat, { segs: 8, radialSegs: 7 }
        );
        shoot.userData.part = 3;
        modelG.add(shoot);
        highlight.push(shoot);
        const coleoptile = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.05, 12), new THREE.MeshStandardMaterial({ color: 0xc8d878, roughness: 0.5 }));
        coleoptile.position.set(0.152, 0.325, 0.05);
        coleoptile.rotation.z = -0.2;
        coleoptile.userData.part = 3;
        modelG.add(coleoptile);
        highlight.push(coleoptile);
        const radicle2 = taperTube(
          [new THREE.Vector3(0.125, 0.02, 0.05), new THREE.Vector3(0.14, -0.06, 0.05)],
          0.012, 0.006, embMat, { segs: 8, radialSegs: 7 }
        );
        radicle2.userData.part = 4;
        modelG.add(radicle2);
        highlight.push(radicle2);
        const rootSheath = new THREE.Mesh(new THREE.ConeGeometry(0.014, 0.035, 10), new THREE.MeshStandardMaterial({ color: 0xc8d878, roughness: 0.5 }));
        rootSheath.position.set(0.142, -0.075, 0.05);
        rootSheath.rotation.x = Math.PI;
        rootSheath.userData.part = 4;
        modelG.add(rootSheath);
        highlight.push(rootSheath);
      }
      hud.set('crop', ST3.crop === 'bean' ? '菜豆种子（双子叶）' : '玉米颖果（单子叶 · 果实）');
      hud.set('soak', ST3.soak ? '浸泡一夜（吸胀变软）' : '风干种子');
      hud.set('part', parts()[ST3.part][0]);
      hud.set('note', parts()[ST3.part][1]);
      paintList();
    };
    // 左侧结构清单卡
    let listEl = null;
    const paintList = () => {
      if (!listEl) {
        listEl = document.createElement('div');
        listEl.className = 'plant-card plant-parts';
        stage.appendChild(listEl);
        activeCleanupExtra = () => listEl.remove();
      }
      listEl.innerHTML = '<h3>' + (ST3.crop === 'bean' ? '菜豆 · 解剖清单' : '玉米 · 果实清单') + '</h3>' +
        parts().map((p, i) => `<div class="pp-row${i === ST3.part ? ' on' : ''}" data-i="${i}"><b>${p[0]}</b><span>${p[1].slice(0, 18)}…</span></div>`).join('');
      listEl.querySelectorAll('.pp-row').forEach((r) => r.addEventListener('click', () => {
        ST3.part = +r.dataset.i;
        buildModel();
        camTo(ST3.camPresets()[ST3.part], ST3.targets()[ST3.part], 0.9);
      }));
    };
    ST3.camPresets = () => ST3.crop === 'bean'
      ? [[0.62, 0.42, 0.95], [0.6, 0.4, 0.92], [0.4, 0.5, 0.75], [0.4, 0.46, 0.78], [0.3, 0.32, 0.72]]
      : [[0.66, 0.5, 1.0], [0.5, 0.44, 0.8], [0.72, 0.4, 0.72], [0.5, 0.52, 0.66], [0.5, 0.3, 0.7]];
    ST3.targets = () => ST3.crop === 'bean'
      ? [[0, 0.2, 0], [0, 0.18, 0.02], [0, 0.24, 0.02], [0, 0.12, 0.02], [0.01, -0.02, 0.03]]
      : [[0, 0.22, 0], [0, 0.2, 0], [0.11, 0.18, 0.05], [0.14, 0.26, 0.05], [0.13, 0.0, 0.05]];
    ctl.clear();
    ctl.toggle({ label: '浸泡一夜（吸胀）', value: ST3.soak, onChange: (v) => { ST3.soak = v; buildModel(); } });
    ctl.sep();
    ctl.seg({
      options: [{ label: '菜豆（双子叶）', value: 'bean' }, { label: '玉米（单子叶）', value: 'maize' }],
      value: ST3.crop,
      onChange: (v) => { ST3.crop = v; ST3.part = 0; buildModel(); camTo(ST3.camPresets()[0], ST3.targets()[0], 0.9); },
    });
    ctl.sep();
    ctl.button({ label: '↺ 复位视角', onClick: () => camTo([0.62, 0.42, 0.95], [0, 0.22, 0], 0.9) });
    buildModel();
    chapterTick = null;
  },
  leave() { ST3.camPresets = null; ST3.targets = null; },
};
/* ---------- 第 4 章：幼苗出土与黄化 ---------- */

const ST4 = { day: 13, dark: true };

const secEtiolate = {
  title: '幼苗出土与黄化',
  group: '观察 · 生活史',
  html: `<p>左边正常光照，右边罩上<b>不透光黑罩</b>。生长十几天后对比——<b>黄化现象</b>：暗处幼苗<span class="hl">又高又细、叶片小而发黄</span>。没有光就不能合成叶绿素，植株把有限的养分全投给"蹿个子"，赌一把够到光。</p>
<p>这组对照说明：<b>光</b>不是萌发的必需条件（土里的种子照样萌发），但却是<b>幼苗正常发育</b>（叶绿素合成、叶片展开）的必需条件。</p>
<p>掀开黑罩看看右边怎么"追光"变绿——几天内叶绿素重新合成。</p>`,
  enter() {
    resetWorld();
    camTo([2.35, 1.15, 3.3], [0.55, 0.42, 0]);
    const grp = newSceneGroup();
    buildHud([['hL', '正常株高'], ['hR', '右侧株高'], ['hyp', '下胚轴长度'], ['dw', '干重（含子叶）'], ['leafR', '右侧叶色'], ['rule', '结论']]);
    ctl.clear();
    const g = new THREE.Group();
    grp.add(g);
    // 两只同款陶盆
    const terraTex = makeTerraTexture();
    const terraMat = new THREE.MeshStandardMaterial({ map: terraTex, roughness: 0.86 });
    const pots = [];
    for (const px of [-0.55, 0.95]) {
      const potGrp = new THREE.Group();
      const prof = [[0.13, 0], [0.145, 0.05], [0.185, 0.17], [0.21, 0.24], [0.22, 0.255]].map(([r, y]) => new THREE.Vector2(r, y));
      const pot = new THREE.Mesh(new THREE.LatheGeometry(prof, 36), terraMat);
      potGrp.add(pot);
      const soil = new THREE.Mesh(new THREE.CircleGeometry(0.2, 30), new THREE.MeshStandardMaterial({ map: makeSoilTexture(0.45, 61), roughness: 0.97 }));
      soil.rotation.x = -Math.PI / 2;
      soil.position.y = 0.225;
      potGrp.add(soil);
      potGrp.position.set(px, BENCH_Y, 0);
      g.add(potGrp);
      const sh = contactShadow(0.6, 0.6, 0.8);
      sh.position.set(px, BENCH_Y + 0.003, 0);
      g.add(sh);
      pots.push(potGrp);
    }
    const refresh = () => {
      g.children.filter((c) => c.userData.plant).forEach((c) => { g.remove(c); clearGroup(c); });
      const left = buildBean(ST4.day, {});
      left.userData.plant = 1;
      left.position.x = -0.55;
      left.position.y = 0.22;
      const right = buildBean(ST4.day, { dark: ST4.dark });
      right.userData.plant = 2;
      right.position.x = 0.95;
      right.position.y = 0.22;
      g.add(left, right);
      // 黑罩（木框暗箱：箱体 + 顶盖提手 + 暗调漆面）
      const oldBox = g.children.find((c) => c.userData.darkbox);
      if (oldBox) { g.remove(oldBox); clearGroup(oldBox); }
      if (ST4.dark) {
        const box = new THREE.Group();
        const shellMat = new THREE.MeshPhysicalMaterial({ color: 0x1d2b22, roughness: 0.44, clearcoat: 0.3, clearcoatRoughness: 0.3 });
        const shell = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.35, 0.6), shellMat);
        box.add(shell);
        const lid = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.07, 0.64), shellMat);
        lid.position.y = 0.71;
        box.add(lid);
        const knob = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 10), matStd(COL.brass, { metalness: 0.7, roughness: 0.35 }));
        knob.position.y = 0.79;
        box.add(knob);
        // 箱底框脚
        for (const [cx, cz] of [[-0.27, -0.27], [0.27, -0.27], [-0.27, 0.27], [0.27, 0.27]]) {
          const foot = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.04, 0.05), matStd(COL.woodDeep, { roughness: 0.6 }));
          foot.position.set(cx, -0.665, cz);
          box.add(foot);
        }
        // 木框饰线（四条竖棱）
        for (const [cx, cz] of [[-0.3, -0.3], [0.3, -0.3], [-0.3, 0.3], [0.3, 0.3]]) {
          const post = new THREE.Mesh(new THREE.BoxGeometry(0.045, 1.35, 0.045), matStd(0x2a3a2e, { roughness: 0.5 }));
          post.position.set(cx, 0, cz);
          box.add(post);
        }
        box.position.set(0.95, BENCH_Y + 0.7, 0);
        box.userData.darkbox = 1;
        g.add(box);
        const lbl = makeTextSprite('黑罩 · 黄化苗', { fontSize: 40, color: '#9fb2c8', scale: 0.0026 });
        lbl.position.set(0.95, 1.95, 0);
        lbl.userData.plant = 1;
        g.add(lbl);
      } else {
        const lbl = makeTextSprite('解除黑暗 → 转绿', { fontSize: 40, color: '#9fe870', scale: 0.0026 });
        lbl.position.set(0.95, 1.75, 0);
        lbl.userData.plant = 1;
        g.add(lbl);
      }
      const lblL = makeTextSprite('正常光照', { fontSize: 40, color: '#9fe870', scale: 0.0026 });
      lblL.position.set(-0.55, 1.72, 0);
      lblL.userData.plant = 1;
      g.add(lblL);
      const h1 = 1.5 * Math.pow(clamp((ST4.day - 6) / 42, 0, 1), 0.85);
      const h2 = h1 * 1.35;
      // 下胚轴：黄化苗把"蹿个子"全押在下胚轴拉长上（占比 0.38 → 0.58）
      const hyp1 = h1 * 0.38;
      const hyp2 = h2 * 0.58;
      const dt4 = clamp((ST4.day - 8) / 16, 0, 1);
      const dwL = 0.26 * (1 - dt4 * 0.72) + 0.05 * dt4;                 // 光下：储备渐耗，光合补偿
      const dwR = ST4.dark ? 0.26 * (1 - dt4 * 0.88) : dwL;             // 暗处：只耗不补
      hud.set('hL', `${h1.toFixed(2)} m`);
      hud.set('hR', ST4.dark ? `${h2.toFixed(2)} m（细弱徒长）` : `${h1.toFixed(2)} m（追光后回稳）`);
      hud.set('hyp', `${(hyp1 * 100).toFixed(1)} cm ｜ 罩内 ${(hyp2 * 100).toFixed(1)} cm`);
      hud.set('dw', `${dwL.toFixed(2)} g ｜ 罩内 ${dwR.toFixed(2)} g`);
      hud.set('leafR', ST4.dark ? '黄白（无叶绿素）' : '转绿（叶绿素合成）');
      hud.set('rule', ST4.dark ? '光非萌发必需，却是幼苗发育必需' : '见光几天 → 叶绿素重新合成');
    };
    const tl = timelineCtl({ min: 8, max: 24, value: ST4.day, speed: 1.8, onFrame: (v) => { ST4.day = v; refresh(); } });
    ctl.sep();
    ctl.toggle({ label: '黑罩', value: ST4.dark, onChange: (v) => { ST4.dark = v; refresh(); } });
    refresh();
    ST4.tick = tl.tick;
    bindPlayToggle(tl);
    chapterTick = (dt) => tl.tick(dt);
  },
  leave() { ST4.tick = null; },
};

/* ---------- 第 5 章：根系伸长与向地反应 ---------- */

const ST5 = { day: 10, tiltDay: null, spin: 0 };

const secGeotrop = {
  title: '根系伸长与向地反应',
  group: '实验 · 探究',
  html: `<p>透过根箱玻璃看根：主根<b>垂直向下</b>扎，侧根斜向四周——这是<b>向地性</b>（重力引导的生长）。</p>
<p>经典"横放实验"：把整株苗<b>横过来</b>，几天内根尖<b>主动拐弯</b>重新朝下——重力使生长素分布在靠地侧增多，抑制根生长，背地侧长得快，根于是向下弯。（茎恰好相反：横放后背地向上弯——根正茎负，方向感相反。）</p>
<p>点「把幼苗横放」做实验，拖天数看根尖拐弯；「转动根箱」从侧面看弯折姿态。红色点是根尖（生长最活跃处）。</p>`,
  enter() {
    resetWorld();
    camTo([1.45, 0.62, 2.2], [0, 0.24, 0.06]);
    const grp = newSceneGroup();
    buildHud([['day', '日程'], ['depth', '主根深度'], ['dw', '干重（含子叶）'], ['tilt', '横放实验'], ['bend', '根尖弯折角'], ['stem', '茎的表现']]);
    ctl.clear();
    // 根箱：木框 + 前玻璃 + 侧观察玻璃 + 土壤 + 顶部苗
    const boxGrp = new THREE.Group();
    grp.add(boxGrp);
    const woodMat = new THREE.MeshStandardMaterial({ map: WOOD.box(), roughness: 0.68 });
    // 后板 + 左右板 + 底板（木）
    const back = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.95, 0.05), woodMat);
    back.position.set(0, -0.48, -0.2);
    const left = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.95, 0.5), woodMat);
    left.position.set(-0.62, -0.48, 0.03);
    const right = left.clone(); right.position.x = 0.62;
    const bottom = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.05, 0.5), woodMat);
    bottom.position.set(0, -0.945, 0.03);
    boxGrp.add(back, left, right, bottom);
    // 玻璃前面 + 玻璃右侧面（可透视根系）
    const glassMat = matGlassLite(COL.glassTint, { opacity: 0.16 });
    const front = new THREE.Mesh(new THREE.PlaneGeometry(1.24, 0.9), glassMat);
    front.position.set(0, -0.48, 0.282);
    const side = new THREE.Mesh(new THREE.PlaneGeometry(0.44, 0.9), glassMat);
    side.position.set(0.59, -0.48, 0.03);
    side.rotation.y = Math.PI / 2;
    boxGrp.add(front, side);
    // 框条包边
    for (const [w, h, d, x, y, z] of [
      [1.34, 0.07, 0.6, 0, 0.0, 0.03], [1.34, 0.07, 0.6, 0, -0.95, 0.03],
      [0.07, 0.95, 0.6, -0.665, -0.48, 0.03], [0.07, 0.95, 0.6, 0.665, -0.48, 0.03],
    ]) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), woodMat);
      bar.position.set(x, y, z);
      boxGrp.add(bar);
    }
    // 土壤体（占箱内 4/5，前缘留玻璃观察带）
    const soil = new THREE.Mesh(
      new THREE.BoxGeometry(1.24, 0.88, 0.44),
      new THREE.MeshStandardMaterial({ map: makeSoilTexture(0.55, 83), roughness: 0.97 })
    );
    soil.position.set(0, -0.5, 0.0);
    boxGrp.add(soil);
    // 土壤前缘剖面（靠玻璃的"剖面"深色层，衬托白色根系）
    const soilFace = new THREE.Mesh(
      new THREE.PlaneGeometry(1.22, 0.84),
      new THREE.MeshStandardMaterial({ map: makeSoilTexture(0.7, 84), roughness: 0.95, side: THREE.DoubleSide })
    );
    soilFace.position.set(0, -0.5, 0.222);
    boxGrp.add(soilFace);
    // 根箱提手（铜环）
    for (const hx of [-0.58, 0.58]) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.032, 0.008, 8, 20), matStd(COL.brass, { metalness: 0.75, roughness: 0.35 }));
      ring.position.set(hx, 0.0, 0.03);
      ring.rotation.x = Math.PI / 2;
      boxGrp.add(ring);
    }
    boxGrp.position.set(0, 0.96, 0);
    const boxSh = contactShadow(1.7, 0.9, 0.8);
    boxSh.position.set(0, BENCH_Y + 0.003, 0);
    grp.add(boxSh);
    const plantG = new THREE.Group();
    const rootG = new THREE.Group();
    boxGrp.add(plantG, rootG);
    plantG.position.y = 0.02;
    rootG.position.y = 0.02;
    rootG.position.z = 0.235;   // 根贴着前玻璃内侧（土壤剖面前）生长，透过玻璃可观察
    const refresh = () => {
      clearGroup(plantG);
      clearGroup(rootG);
      const tiltOn = ST5.tiltDay !== null && ST5.day >= ST5.tiltDay;
      // 苗：横放时绕基部倒向 +Z 侧（观察面），生长继续
      if (tiltOn) {
        const daysSinceTilt = ST5.day - ST5.tiltDay;
        const stem = buildBean(Math.max(daysSinceTilt + 8, 8), {});
        stem.rotation.z = -Math.PI / 2;
        plantG.add(stem);
        // 茎背地向上弯（横放后茎尖回翘）
        const lift = smooth(clamp(daysSinceTilt / 5, 0, 1)) * 0.5;
        stem.rotation.y = -lift * 0.5;
      } else {
        plantG.add(buildBean(Math.min(ST5.day, 12), {}));
      }
      rootG.add(buildRoots(ST5.day, ST5.tiltDay));
      const resp = tiltOn ? smooth(clamp((ST5.day - ST5.tiltDay) / 4, 0, 1)) : 0;
      // 主根深度：与 buildRoots 的根长同源（根箱 0.9 单位 ≈ 36 cm 土深）；横放后先折向侧向再回垂
      const rootLenU = 0.9 * smooth(clamp((ST5.day - 2) / 16, 0, 1));
      const depthCm = rootLenU * 40 * (tiltOn ? 1 - resp * 0.66 : 1);
      const dt5 = clamp((ST5.day - 2) / 16, 0, 1);
      const dw5 = 0.26 * (1 - dt5 * 0.62) + 0.04 * dt5 * dt5;
      hud.set('day', `第 ${Math.round(ST5.day)} 天`);
      hud.set('depth', `${depthCm.toFixed(1)} cm${tiltOn ? '（拐弯回垂中）' : '（垂直向下）'}`);
      hud.set('dw', `${dw5.toFixed(2)} g`);
      hud.set('tilt', tiltOn ? `横放第 ${Math.max(0, Math.round(ST5.day - ST5.tiltDay))} 天` : '未横放 · 主根垂直向下');
      hud.set('bend', tiltOn ? `${Math.round(resp * 90)}°（重力复位）` : '0°');
      hud.set('stem', tiltOn ? '茎：背地向上弯（与根相反）' : '茎：垂直向上');
    };
    const tl = timelineCtl({ min: 2, max: 18, value: ST5.day, speed: 1.6, onFrame: (v) => {
      ST5.day = v;
      if (ST5.tiltDay !== null && ST5.day < ST5.tiltDay) ST5.tiltDay = ST5.day;
      refresh();
    } });
    ctl.sep();
    ctl.button({ label: '⤵ 把幼苗横放', onClick: () => { ST5.tiltDay = ST5.day; refresh(); hudToast('已横放——观察根尖几天内的拐弯。'); } });
    ctl.button({ label: '↻ 旋转根箱', onClick: () => { ST5.spin += Math.PI / 2; } });
    ctl.button({ label: '↺ 复位重种', onClick: () => { ST5.tiltDay = null; ST5.day = 10; ST5.spin = 0; boxGrp.rotation.y = 0; tl.slider.set(10); refresh(); } });
    refresh();
    ST5.tick = tl.tick;
    bindPlayToggle(tl);
    chapterTick = (dt) => {
      tl.tick(dt);
      boxGrp.rotation.y += (ST5.spin - boxGrp.rotation.y) * Math.min(dt * 3, 1);
    };
  },
  leave() { ST5.tick = null; },
};

/* ---------- 第 6 章：光照强弱与光合速率 ---------- */

const ST6 = { dist: 30, source: 'day', bubbles: true };

const secPhotosyn = {
  title: '光照强弱与光合速率',
  group: '实验 · 探究',
  html: `<p>经典装置：一缸水，放进<b>金鱼藻</b>，灯从侧面照。光合放出的氧不溶解的部分形成<b>气泡</b>从切口冒出——<span class="hl">数气泡就是数光合速率</span>。</p>
<p>拖动「灯距」：灯越近光越强，气泡越密；拉远到补偿点以下，光合弱于呼吸，不再冒泡。</p>
<p>「光源组合」还能切昼夜：夜里只开补光灯——光合照样进行，只要给足光。</p>`,
  enter() {
    resetWorld();
    setDaylight(ST6.source === 'night' ? 0.06 : 1);
    camTo([1.7, 0.85, 2.5], [0.3, 0.28, 0]);
    const grp = newSceneGroup();
    buildHud([['dist', '灯距 / 光强'], ['rate', '气泡速率'], ['pnet', '净光合速率'], ['zone', '光区判定'], ['clock', '时刻设定']]);
    ctl.clear();
    const g = new THREE.Group();
    grp.add(g);
    // 水族缸（玻璃 + 水体 + 水面 + 缸底砂）
    const tankGrp = new THREE.Group();
    const glassMat = matGlassLite(COL.glassTint, { opacity: 0.22 });
    const prof = [
      [0.001, 0], [0.34, 0], [0.36, 0.008], [0.36, 0.46], [0.345, 0.475], [0.335, 0.46], [0.335, 0.02], [0.02, 0.008],
    ].map(([r, y]) => new THREE.Vector2(r, y));
    const tank = new THREE.Mesh(new THREE.LatheGeometry(prof, 40), glassMat);
    tankGrp.add(tank);
    const water = new THREE.Mesh(
      new THREE.CylinderGeometry(0.335, 0.335, 0.4, 36),
      new THREE.MeshPhysicalMaterial({ color: COL.water, transparent: true, opacity: 0.3 })
    );
    water.position.y = 0.21;
    tankGrp.add(water);
    const surface = new THREE.Mesh(new THREE.CircleGeometry(0.335, 36), new THREE.MeshStandardMaterial({ color: 0xcfe8f8, transparent: true, opacity: 0.45, roughness: 0.05, metalness: 0.15 }));
    surface.rotation.x = -Math.PI / 2;
    surface.position.y = 0.412;
    tankGrp.add(surface);
    // 缸底砂层
    const sand = new THREE.Mesh(
      new THREE.CylinderGeometry(0.33, 0.33, 0.035, 32),
      new THREE.MeshStandardMaterial({ color: 0xcab894, roughness: 0.95 })
    );
    sand.position.y = 0.03;
    tankGrp.add(sand);
    // 砂面小卵石
    for (let i = 0; i < 14; i++) {
      const peb = new THREE.Mesh(new THREE.SphereGeometry(0.012 + (i % 3) * 0.005, 8, 6), matStd(0xa89880, { roughness: 0.9 }));
      const a = i * 2.3;
      peb.position.set(Math.cos(a) * 0.24, 0.05, Math.sin(a) * 0.24);
      peb.scale.y = 0.55;
      tankGrp.add(peb);
    }
    // 金鱼藻：五株（茎 + 轮生叶轮 ×4 + 切口）
    const weed = new THREE.Group();
    const stemMat = new THREE.MeshStandardMaterial({ color: 0x2e7034, roughness: 0.55 });
    const whorlMat = new THREE.MeshStandardMaterial({ color: 0x3f9142, roughness: 0.6, side: THREE.DoubleSide });
    const cutMat = new THREE.MeshStandardMaterial({ color: 0x8fce9e, roughness: 0.3, emissive: 0x2a5030, emissiveIntensity: 0.4 });
    for (let i = 0; i < 5; i++) {
      const px = -0.2 + i * 0.1;
      const h = 0.2 + (i % 3) * 0.05;
      const stem = taperTube(
        [new THREE.Vector3(px, 0.05, 0.02 * Math.sin(i * 2)), new THREE.Vector3(px + 0.008, 0.05 + h * 0.5, 0.02), new THREE.Vector3(px + 0.014, 0.05 + h, 0.01)],
        0.005, 0.0032, stemMat, { segs: 14, radialSegs: 6 }
      );
      weed.add(stem);
      for (let k = 0; k < 4; k++) {
        for (let l = 0; l < 5; l++) {
          const la = (l / 5) * TAU + k * 0.6;
          const blade = new THREE.Mesh(new THREE.PlaneGeometry(0.008, 0.03), whorlMat);
          blade.position.set(px + 0.008 + Math.cos(la) * 0.012, 0.07 + k * h / 4.2, 0.02 + Math.sin(la) * 0.012);
          blade.rotation.set(Math.PI / 2 - 0.5, la, 0.3);
          weed.add(blade);
        }
      }
      // 切口（冒泡点，亮绿）
      const cut = new THREE.Mesh(new THREE.CircleGeometry(0.0035, 8), cutMat);
      cut.position.set(px + 0.014, 0.05 + h + 0.002, 0.01);
      cut.rotation.x = -Math.PI / 2;
      weed.add(cut);
    }
    // 五株的 100 片轮生叶同材质 → 合批（110 draw → 3）；叶片全静态，视觉零变化
    mergeBatched(weed, (o) => !o.material.map);
    weed.position.y = 0;
    tankGrp.add(weed);
    tankGrp.position.set(0.25, BENCH_Y, 0);
    g.add(tankGrp);
    const tankSh = contactShadow(1.1, 1.1, 0.8);
    tankSh.position.set(0.25, BENCH_Y + 0.003, 0);
    g.add(tankSh);
    // 灯架（底座 + 立杆 + 横臂 + 反光罩灯泡）
    const lampG = new THREE.Group();
    const steelMat = matStd(0x5a646e, { roughness: 0.35, metalness: 0.8 });
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.135, 0.035, 24), steelMat);
    lampG.add(base);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.85, 12), steelMat);
    pole.position.y = 0.44;
    lampG.add(pole);
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.32, 10), steelMat);
    arm.position.set(-0.16, 0.84, 0);
    arm.rotation.z = Math.PI / 2;
    lampG.add(arm);
    const shade = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.09, 24, 1, true), matStd(0x8f9aa4, { roughness: 0.3, metalness: 0.75, side: THREE.DoubleSide }));
    shade.position.set(-0.32, 0.79, 0);
    shade.rotation.x = Math.PI * 0.4;
    lampG.add(shade);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.028, 16, 12), new THREE.MeshBasicMaterial({ color: 0xffe9a8 }));
    bulb.position.set(-0.32, 0.765, 0);
    lampG.add(bulb);
    const lampLight = new THREE.PointLight(0xffe2a0, 2.4, 6, 1.8);
    lampLight.position.set(-0.32, 0.75, 0);
    lampG.add(lampLight);
    g.add(lampG);
    const lampSh = contactShadow(0.5, 0.5, 0.6);
    g.add(lampSh);
    // 光锥可视化（透明锥体，强度随距离）
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(0.2, 0.75, 20, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xffd88a, transparent: true, opacity: 0.1, side: THREE.DoubleSide, depthWrite: false, forceSinglePass: true })
    );
    g.add(cone);
    // 距离标尺（台面上的尺）
    const ruler = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.012, 0.05), matStd(0xe8dcc0, { roughness: 0.7 }));
    ruler.position.set(0.25, BENCH_Y + 0.008, 0.32);
    g.add(ruler);
    for (let i = 0; i <= 9; i++) {
      const tick = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.002, 0.03), matStd(0x5a4632, { roughness: 0.6 }));
      tick.position.set(0.25 - 0.4 + i * 0.1, BENCH_Y + 0.016, 0.32);
      g.add(tick);
    }
    // 气泡池
    const bubbles = [];
    for (let i = 0; i < 30; i++) {
      const b = new THREE.Mesh(
        new THREE.SphereGeometry(0.005 + (i % 4) * 0.002, 8, 6),
        new THREE.MeshPhysicalMaterial({ color: 0xdff3ff, transparent: true, opacity: 0.75 })
      );
      b.visible = false;
      bubbles.push({ mesh: b, life: 0, x: 0 });
      g.add(b);
    }
    const lightLevel = () => {
      const lampI = 150 / ST6.dist;                    // 灯的平方反比近似
      const dayI = ST6.source === 'day' ? 1 : ST6.source === 'both' ? 0.9 : 0.06;
      return { lampI, dayI, total: lampI * (ST6.source === 'day' ? 0.45 : 1) + dayI * 1.2 };
    };
    const rate = () => Math.max(0, Math.round(lightLevel().total - 1.15));   // 补偿点约 1.15
    const placeLamp = () => {
      const dx = ST6.dist / 100;
      lampG.position.set(0.25 + dx, BENCH_Y, 0.12);
      lampG.rotation.y = -0.55;
      lampLight.intensity = 1.2 + 2.6 / Math.max(0.2, dx);
      bulb.material.color.setHSL(0.115, 0.65, 0.55 + 0.3 / Math.max(1.2, ST6.dist / 18));
      cone.position.set(0.25 + dx - 0.28, 0.42, 0.12);
      cone.rotation.z = -0.5;
      const op = clamp(1.6 / (dx + 0.35), 0.02, 0.14);
      cone.material.opacity = op;
      lampSh.position.set(0.25 + dx, BENCH_Y + 0.003, 0.12);
    };
    const refresh = () => {
      placeLamp();
      setDaylight(ST6.source === 'night' ? 0.06 : ST6.source === 'both' ? 0.75 : 1);
      const lv = lightLevel();
      hud.set('dist', `${Math.round(ST6.dist)} cm / 光强 ${lv.total.toFixed(2)}`);
      hud.set('rate', ST6.bubbles ? `${rate()} 个气泡 / 分钟` : '气泡观察已关闭');
      const net = Math.max(0, lv.total - 1.15) * 0.62;   // 扣除呼吸（补偿点 1.15），气泡量 → 同化量
      hud.set('pnet', net > 0 ? `≈ ${net.toFixed(2)} μmol/(m²·s)` : '≤ 0（光合 ≤ 呼吸）');
      hud.set('zone', rate() > 3 ? '强光区 · 光合旺盛' : rate() > 0 ? '有效光区' : '低于补偿点：光合 ≤ 呼吸');
      hud.set('clock', ST6.source === 'day' ? '白天 · 自然光' : ST6.source === 'both' ? '白天 · 自然光 + 补光' : '夜 21:30 · 只开补光灯');
    };
    ctl.slider({ label: '灯距 cm', min: 10, max: 90, step: 1, value: ST6.dist, fmt: (v) => `${Math.round(v)}`, onInput: (v) => { ST6.dist = v; refresh(); } });
    ctl.sep();
    ctl.seg({
      options: [{ label: '白天自然光', value: 'day' }, { label: '白天 + 补光', value: 'both' }, { label: '夜·只补光', value: 'night' }],
      value: ST6.source,
      onChange: (v) => { ST6.source = v; refresh(); },
    });
    ctl.sep();
    ctl.toggle({ label: '气泡观察', value: ST6.bubbles, onChange: (v) => { ST6.bubbles = v; refresh(); } });
    refresh();
    let spawnAcc = 0;
    chapterTick = (dt) => {
      spawnAcc += dt * rate() / 60 * 16;
      while (spawnAcc >= 1) {
        spawnAcc -= 1;
        const b = bubbles.find((bb) => bb.life <= 0);
        if (b) {
          b.life = 1;
          const wi = Math.floor(Math.random() * 5);
          b.x = -0.2 + wi * 0.1 + 0.014;
          b.mesh.position.set(0.25 + b.x, 0.27, 0.012);
          b.mesh.visible = ST6.bubbles;
        }
      }
      bubbles.forEach((b) => {
        if (b.life <= 0) return;
        b.life -= dt * 0.42;
        b.mesh.position.y += dt * 0.1;
        b.mesh.position.x += Math.sin(b.mesh.position.y * 42) * 0.0007;
        if (b.life <= 0 || b.mesh.position.y > 0.41) { b.life = 0; b.mesh.visible = false; }
      });
      // 水草轻摆
      weed.rotation.z = Math.sin(performance.now() / 1600) * 0.012;
      // 夜模式灯泡更亮
      bulb.material.color.setHSL(0.115, 0.6, ST6.source === 'night' ? 0.62 : 0.58);
    };
  },
  leave() { ST6.tick = null; },
};

/* ---------- 第 7 章：绿叶见光合成淀粉 ---------- */

const ST7 = { step: 0 };

const STARCH_STEPS = [
  ['① 暗处理', '置暗一昼夜：叶中原存的淀粉被转运耗光——后面测到的才全是"新合成"的。'],
  ['② 遮光照光', '用铝箔把叶片一部分上下两面遮住，再移到光下照几小时——遮光处就是天然的"无光对照"。'],
  ['③ 酒精脱色', '摘下叶片，酒精隔水加热：叶绿素溶出，叶片褪成黄白（酒精可燃，必须水浴加热！）。'],
  ['④ 滴加碘液', '向黄白叶片滴碘液——淀粉遇碘变蓝。'],
  ['⑤ 清水漂洗', '洗掉浮色观察：见光部分蓝黑色（有淀粉），遮光部分黄白（无淀粉）。'],
];

const secStarch = {
  title: '绿叶见光合成淀粉',
  group: '实验 · 探究',
  html: `<p>萨克斯实验（1862）五步走：① <b>暗处理</b>一昼夜——耗尽原有淀粉；② <b>部分遮光</b>后光照几小时；③ <b>酒精隔水加热</b>脱色（酒精易燃！）；④ <b>滴碘液</b>；⑤ 清水漂洗观察。</p>
<p>结果：见光部分<span class="hl">变蓝</span>（淀粉遇碘变蓝），遮光部分不变蓝 → <span class="hl">淀粉由光合作用制造而来——光不可或缺，见光处的叶绿体就是"合成车间"</span>。</p>
<p>点步骤单推进实验，看叶片在每一步的颜色变化。</p>`,
  enter() {
    resetWorld();
    camTo([0.9, 0.75, 2.05], [0.25, 0.34, 0]);
    const grp = newSceneGroup();
    buildHud([['step', '当前步骤'], ['leaf', '叶片状态'], ['hint', '操作提示'], ['rule', '实验结论']]);
    ctl.clear();
    const g = new THREE.Group();
    grp.add(g);
    // 实验台景：盆栽天竺葵（阔叶）+ 遮光罩 + 水浴装置 + 碘液瓶 + 滴管
    // 盆栽
    const plantGrp = new THREE.Group();
    const potProf = [[0.16, 0], [0.18, 0.07], [0.23, 0.22], [0.26, 0.3], [0.27, 0.32]].map(([r, y]) => new THREE.Vector2(r, y));
    const pot = new THREE.Mesh(new THREE.LatheGeometry(potProf, 36), new THREE.MeshStandardMaterial({ map: makeTerraTexture(27), roughness: 0.85 }));
    plantGrp.add(pot);
    const soil = new THREE.Mesh(new THREE.CircleGeometry(0.25, 30), new THREE.MeshStandardMaterial({ map: makeSoilTexture(0.4, 93), roughness: 0.97 }));
    soil.rotation.x = -Math.PI / 2;
    soil.position.y = 0.29;
    plantGrp.add(soil);
    // 茎 + 侧叶簇（大实验叶单独做）
    const stemMat = new THREE.MeshStandardMaterial({ color: COL.stem, roughness: 0.6 });
    plantGrp.add(taperTube(
      [new THREE.Vector3(0, 0.28, 0), new THREE.Vector3(0.01, 0.5, 0.01), new THREE.Vector3(0.02, 0.78, 0.01), new THREE.Vector3(0.03, 1.0, 0)],
      0.014, 0.008, stemMat, { segs: 20, radialSegs: 8 }
    ));
    const foliage = new THREE.Group();
    for (let i = 0; i < 6; i++) {
      const leaf = makeLeafMesh('heart', { size: 0.2 + (i % 3) * 0.05, color: COL.leaf, vein: COL.leafVeinDark, seed: 51 + i * 2 });
      const a = (i / 6) * TAU + 0.4;
      leaf.position.set(Math.cos(a) * 0.1, 0.45 + i * 0.09, Math.sin(a) * 0.08);
      leaf.rotation.set(-1.1 - (i % 3) * 0.2, a + Math.PI / 2, 0.25);
      foliage.add(leaf);
      foliage.add(taperTube(
        [new THREE.Vector3(Math.cos(a) * 0.015, 0.42 + i * 0.09, Math.sin(a) * 0.012), leaf.position.clone()],
        0.006, 0.003, stemMat, { segs: 8, radialSegs: 5 }
      ));
    }
    plantGrp.add(foliage);
    plantGrp.position.set(-0.45, BENCH_Y, 0.08);
    g.add(plantGrp);
    const plantSh = contactShadow(0.7, 0.7, 0.8);
    plantSh.position.set(-0.45, BENCH_Y + 0.003, 0.08);
    g.add(plantSh);
    // 大实验叶（独立悬挂在架子上，双半叶：左见光/右遮光）
    const expGrp = new THREE.Group();
    const leafStem = taperTube(
      [new THREE.Vector3(0, -0.09, 0), new THREE.Vector3(0.02, -0.02, 0)],
      0.008, 0.005, stemMat, { segs: 8, radialSegs: 6 }
    );
    expGrp.add(leafStem);
    const matExposed = new THREE.MeshStandardMaterial({ color: 0x2a5038, roughness: 0.62, side: THREE.DoubleSide });
    const matCovered = new THREE.MeshStandardMaterial({ color: 0x2a5038, roughness: 0.62, side: THREE.DoubleSide });
    const halfShape = (side) => {
      const s = new THREE.Shape();
      const w = 0.2, h = 0.56;
      s.moveTo(0, 0);
      s.bezierCurveTo(side * w * 0.6, h * 0.1, side * w * 0.64, h * 0.5, side * w * 0.3, h * 0.82);
      s.bezierCurveTo(side * w * 0.14, h * 0.95, 0, h, 0, h);
      s.lineTo(0, 0);
      const geo = new THREE.ShapeGeometry(s, 12);
      const pp = geo.attributes.position;
      for (let i = 0; i < pp.count; i++) {
        const x = pp.getX(i), y = pp.getY(i);
        pp.setZ(i, -0.045 * Math.pow(Math.abs(x) / w, 2) - 0.02 * Math.max(0, y - h * 0.5) / (h * 0.5));
      }
      geo.computeVertexNormals();
      return geo;
    };
    const halfL = new THREE.Mesh(halfShape(-1), matExposed);
    const halfR = new THREE.Mesh(halfShape(1), matCovered);
    expGrp.add(halfL, halfR);
    // 中脉
    expGrp.add(taperTube(
      [new THREE.Vector3(0, 0, 0.004), new THREE.Vector3(0, 0.3, 0.006), new THREE.Vector3(0, 0.55, 0.004)],
      0.006, 0.002, matStd(0x4a7a3a, { roughness: 0.6 }), { segs: 10, radialSegs: 5 }
    ));
    // 铝箔遮光片（贴右半叶前后两面）
    const foilMat = new THREE.MeshStandardMaterial({ map: makeFoilTexture(), roughness: 0.35, metalness: 0.65, side: THREE.DoubleSide });
    const foil = new THREE.Mesh(new THREE.PlaneGeometry(0.17, 0.5), foilMat);
    foil.position.set(0.115, 0.3, 0.008);
    foil.rotation.z = 0.06;
    expGrp.add(foil);
    const foilB = foil.clone();
    foilB.position.z = -0.008;
    expGrp.add(foilB);
    expGrp.position.set(0.42, 0.52, 0.22);
    expGrp.rotation.set(-0.15, -0.35, 0.1);
    g.add(expGrp);
    // 水浴装置：铁架台（底座+杆+铁圈）+ 大烧杯水 + 小烧杯酒精 + 酒精灯 + 火苗
    const bathGrp = new THREE.Group();
    const standBase = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.03, 0.26), matStd(0x4a545e, { roughness: 0.4, metalness: 0.7 }));
    const standPole = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.75, 12), matStd(0x4a545e, { roughness: 0.35, metalness: 0.8 }));
    standPole.position.y = 0.38;
    bathGrp.add(standBase, standPole);
    const ringMat = matStd(0x5a646e, { roughness: 0.4, metalness: 0.7 });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.008, 8, 24), ringMat);
    ring.position.set(-0.02, 0.42, 0);
    ring.rotation.x = Math.PI / 2;
    bathGrp.add(ring);
    // 石棉网
    const gauze = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.008, 0.22), matStd(0x8a8276, { roughness: 0.9 }));
    gauze.position.set(-0.02, 0.4, 0);
    bathGrp.add(gauze);
    // 大烧杯（水）
    const beakerProf = [[0.005, 0], [0.1, 0], [0.106, 0.005], [0.106, 0.17], [0.112, 0.18]].map(([r, y]) => new THREE.Vector2(r, y));
    const beakerGlass = new THREE.Mesh(new THREE.LatheGeometry(beakerProf, 30), matGlassLite(COL.glassTint, { opacity: 0.3 }));
    beakerGlass.position.set(-0.02, 0.4, 0);
    bathGrp.add(beakerGlass);
    const bathWater = new THREE.Mesh(new THREE.CylinderGeometry(0.096, 0.096, 0.1, 28), new THREE.MeshPhysicalMaterial({ color: COL.water, transparent: true, opacity: 0.35, roughness: 0.15 }));
    bathWater.position.set(-0.02, 0.45, 0);
    bathGrp.add(bathWater);
    // 小烧杯（酒精 + 叶片）
    const smallProf = [[0.004, 0], [0.05, 0], [0.054, 0.004], [0.054, 0.075], [0.058, 0.082]].map(([r, y]) => new THREE.Vector2(r, y));
    const smallGlass = new THREE.Mesh(new THREE.LatheGeometry(smallProf, 24), matGlassLite(COL.glassTint, { opacity: 0.24 }));
    smallGlass.position.set(-0.02, 0.42, 0);
    bathGrp.add(smallGlass);
    const alcohol = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.048, 0.05, 22), new THREE.MeshPhysicalMaterial({ color: COL.alcohol, transparent: true, opacity: 0.5, roughness: 0.1 }));
    alcohol.position.set(-0.02, 0.445, 0);
    bathGrp.add(alcohol);
    const bathLeaf = new THREE.Mesh(halfShape(1), new THREE.MeshStandardMaterial({ color: 0x2a5038, roughness: 0.62, side: THREE.DoubleSide }));
    bathLeaf.scale.set(0.3, 0.3, 0.3);
    bathLeaf.rotation.set(0.3, 0.4, 0.2);
    bathLeaf.position.set(-0.02, 0.47, 0.01);
    bathGrp.add(bathLeaf);
    // 酒精灯（玻璃灯体 + 铜芯套 + 火苗锥）
    const lampGlass = new THREE.Mesh(new THREE.SphereGeometry(0.035, 16, 12), new THREE.MeshPhysicalMaterial({ color: 0xcfe4ee, transparent: true, opacity: 0.5, roughness: 0.1 }));
    const lampNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.02, 0.02, 12), matStd(COL.brass, { metalness: 0.7, roughness: 0.35 }));
    lampNeck.position.y = 0.035;
    const wick = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.004, 0.02, 8), new THREE.MeshStandardMaterial({ color: 0xe8e0c8, roughness: 0.9 }));
    wick.position.y = 0.05;
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.011, 0.038, 12), new THREE.MeshBasicMaterial({ color: COL.flame, transparent: true, opacity: 0.85 }));
    flame.position.y = 0.078;
    const flameIn = new THREE.Mesh(new THREE.ConeGeometry(0.006, 0.022, 10), new THREE.MeshBasicMaterial({ color: 0xfff2c8 }));
    flameIn.position.y = 0.07;
    bathGrp.add(lampGlass, lampNeck, wick, flame, flameIn);
    lampGlass.position.set(0.16, 0.035, 0.06);
    lampNeck.position.set(0.16, 0.07, 0.06);
    wick.position.set(0.16, 0.092, 0.06);
    flame.position.set(0.16, 0.115, 0.06);
    flameIn.position.set(0.16, 0.105, 0.06);
    bathGrp.position.set(0.95, BENCH_Y, -0.02);
    g.add(bathGrp);
    const bathSh = contactShadow(0.8, 0.6, 0.8);
    bathSh.position.set(0.95, BENCH_Y + 0.003, -0.02);
    g.add(bathSh);
    // 碘液瓶（棕瓶 + 标签 + 滴管）
    const iodGrp = new THREE.Group();
    const iodBottle = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.034, 0.1, 20), new THREE.MeshPhysicalMaterial({ color: 0x6a4a2a, roughness: 0.3, clearcoat: 0.6 }));
    const iodNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.014, 0.03, 12), new THREE.MeshStandardMaterial({ color: 0x2a1c10, roughness: 0.4 }));
    iodNeck.position.y = 0.062;
    const iodCap = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.018, 12), matStd(0x2a2a2e, { roughness: 0.5 }));
    iodCap.position.y = 0.085;
    const iodLabel = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.04), new THREE.MeshStandardMaterial({ map: makeIodineLabelTexture(), roughness: 0.7 }));
    iodLabel.position.set(0, 0.015, 0.0345);
    iodGrp.add(iodBottle, iodNeck, iodCap, iodLabel);
    iodGrp.position.set(1.3, BENCH_Y, 0.22);
    iodGrp.rotation.y = -0.5;
    g.add(iodGrp);
    // 滴管（悬浮在叶上方，④步出现）
    const dropperGrp = new THREE.Group();
    const tube = taperTube([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -0.1, 0)], 0.006, 0.002, matGlassLite(COL.glassTint, { opacity: 0.35 }), { segs: 8, radialSegs: 8 });
    const bulb2 = new THREE.Mesh(new THREE.SphereGeometry(0.014, 12, 10), new THREE.MeshStandardMaterial({ color: 0x8a6844, roughness: 0.5 }));
    bulb2.position.y = 0.016;
    dropperGrp.add(tube, bulb2);
    dropperGrp.position.set(0.42, 1.2, 0.3);
    dropperGrp.visible = false;
    g.add(dropperGrp);
    // 碘滴落动画粒子
    const drops = [];
    for (let i = 0; i < 6; i++) {
      const d = new THREE.Mesh(new THREE.SphereGeometry(0.004, 8, 6), new THREE.MeshBasicMaterial({ color: 0x8a5a2a }));
      d.visible = false;
      drops.push(d);
      g.add(d);
    }
    // 暗处理遮光罩（罩住盆栽，①步出现）
    const shadeBox = new THREE.Group();
    const shadeShell = new THREE.Mesh(new THREE.BoxGeometry(0.85, 1.3, 0.75), new THREE.MeshPhysicalMaterial({ color: 0x1a2420, roughness: 0.45, clearcoat: 0.25 }));
    const shadeLid = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.06, 0.78), new THREE.MeshPhysicalMaterial({ color: 0x1a2420, roughness: 0.45 }));
    shadeLid.position.y = 0.68;
    shadeBox.add(shadeShell, shadeLid);
    shadeBox.position.set(-0.45, BENCH_Y + 0.68, 0.08);
    shadeBox.visible = false;
    g.add(shadeBox);
    // 步骤清单卡（左上）
    let stepsEl = null;
    const paintSteps = () => {
      if (!stepsEl) {
        stepsEl = document.createElement('div');
        stepsEl.className = 'plant-card plant-steps';
        stage.appendChild(stepsEl);
        activeCleanupExtra = () => stepsEl.remove();
      }
      stepsEl.innerHTML = '<h3>萨克斯五步</h3>' + STARCH_STEPS.map((s, i) =>
        `<div class="step-row${i === ST7.step ? ' on' : ''}${i < ST7.step ? ' done' : ''}" data-i="${i}"><span class="no">${i + 1}</span><span>${s[0]}</span></div>`
      ).join('') + `<div class="step-note">${STARCH_STEPS[ST7.step][1]}</div>`;
      stepsEl.querySelectorAll('.step-row').forEach((r) => r.addEventListener('click', () => { ST7.step = +r.dataset.i; applyStep(); }));
    };
    const applyStep = () => {
      const st = ST7.step;
      shadeBox.visible = st === 0;
      foil.visible = foilB.visible = st >= 1 && st <= 2;
      dropperGrp.visible = st === 3;
      flame.visible = flameIn.visible = st === 2;
      bathLeaf.visible = st === 2;
      // 染色状态
      if (st <= 1) {
        matExposed.color.set(st === 0 ? 0x2a5038 : COL.leaf);
        matCovered.color.set(st === 0 ? 0x2a5038 : COL.leaf);
      } else if (st === 2) {
        matExposed.color.set(0xd8d8be);
        matCovered.color.set(0xd8d8be);
        bathLeaf.material.color.set(0xd8d8be);
      } else {
        matExposed.color.set(0x2b2b5e);      // 见光：碘蓝黑
        matCovered.color.set(0xd8d0a8);      // 遮光：黄白
        bathLeaf.material.color.set(0xd8d0a8);
      }
      setDaylight(st === 0 ? 0.1 : 1);
      hud.set('step', `${st + 1}/5 · ${STARCH_STEPS[st][0]}`);
      hud.set('leaf', st === 0 ? '绿色（淀粉将耗尽）' : st <= 1 ? '绿色（正在造淀粉）' : st === 2 ? '黄白色（叶绿素溶入酒精）' : st === 3 ? '正在滴碘…' : '显色完成');
      hud.set('hint', STARCH_STEPS[st][1].slice(0, 26) + '…');
      hud.set('rule', st >= 4 ? '见光变蓝（淀粉）/ 遮光不变 → 淀粉是光合产物，光是必需条件' : '推进到第 5 步看显色');
      paintSteps();
    };
    ctl.clear();
    ctl.button({ label: '▶ 下一步', onClick: () => { if (ST7.step < 4) { ST7.step++; applyStep(); } } });
    ctl.button({ label: '↺ 回到第一步', onClick: () => { ST7.step = 0; applyStep(); } });
    ctl.sep();
    ctl.button({ label: '🔍 看叶片特写', onClick: () => camTo([0.7, 0.9, 1.15], [0.42, 0.75, 0.22], 1.0) });
    ctl.button({ label: '⚗ 看水浴装置', onClick: () => camTo([1.5, 0.7, 1.35], [0.95, 0.5, -0.02], 1.0) });
    applyStep();
    // 碘滴落：第④步每 0.5s 落一滴
    let dropAcc = 0;
    chapterTick = (dt) => {
      if (ST7.step !== 3) { drops.forEach((d) => { d.visible = false; }); return; }
      dropAcc += dt;
      drops.forEach((d, i) => {
        const ph = (dropAcc * 1.8 + i * 0.35) % 1.4;
        if (ph < 1) {
          d.visible = true;
          d.position.set(0.42 + Math.sin(i * 2.1) * 0.05, 1.08 - ph * 0.5, 0.3 + Math.cos(i * 1.7) * 0.03);
        } else d.visible = false;
      });
      // 火苗摆动
      flame.scale.x = flame.scale.z = 0.9 + Math.sin(performance.now() / 90) * 0.14;
      flameIn.position.y = 0.105 + Math.sin(performance.now() / 120) * 0.002;
    };
  },
  leave() { ST7.tick = null; },
};

/* ---------- 第 8 章：蒸腾作用 ---------- */

const ST8 = { minutes: 0, bagOn: true, deleaf: false, wind: false, light: 60, soilWet: 60 };

const secTranspire = {
  title: '蒸腾作用',
  group: '实验 · 探究',
  html: `<p>给盆栽的一根枝条罩上<b>干燥塑料袋</b>扎紧，放到光下：袋内壁出现<b>水珠</b>——水只能来自植物体内，经叶片<b>气孔</b>以水汽散出，这就是<b>蒸腾作用</b>。</p>
<p>「去叶对照」剪掉另一枝的叶片再套袋——没有叶就没有蒸腾，袋子是干的。这组对照直接指认<span class="hl">叶片是蒸腾的门户</span>。</p>
<p>影响因素都能测：<span class="hl">光照越强、风越大、越干燥，蒸腾越快</span>；土壤缺水则叶片萎蔫下垂。意义：拉动根吸水、运矿质、降温。</p>`,
  enter() {
    resetWorld();
    camTo([2.15, 1.05, 2.7], [0.3, 0.72, 0]);
    const grp = newSceneGroup();
    buildHud([['drops', '袋内水珠'], ['rate', '蒸腾速率'], ['soil', '土壤含水量'], ['leaf', '叶片状态']]);
    ctl.clear();
    const g = new THREE.Group();
    grp.add(g);
    // 大陶盆
    const potProf = [[0.18, 0], [0.2, 0.08], [0.25, 0.26], [0.28, 0.35], [0.29, 0.37]].map(([r, y]) => new THREE.Vector2(r, y));
    const pot = new THREE.Mesh(new THREE.LatheGeometry(potProf, 36), new THREE.MeshStandardMaterial({ map: makeTerraTexture(31), roughness: 0.85 }));
    pot.position.y = BENCH_Y;
    g.add(pot);
    const potSh = contactShadow(0.75, 0.75, 0.8);
    potSh.position.set(0, BENCH_Y + 0.003, 0);
    g.add(potSh);
    // 植株（含套袋枝）
    const plantG = new THREE.Group();
    g.add(plantG);
    // 塑料袋（透明 + 束颈 + 扎绳）
    const bagGrp = new THREE.Group();
    const bagMat = new THREE.MeshPhysicalMaterial({ color: 0xdff2ff, transparent: true, opacity: 0.16, roughness: 0.15, clearcoat: 0.6, side: THREE.DoubleSide, depthWrite: false });
    const bagBody = new THREE.Mesh(new THREE.SphereGeometry(0.15, 22, 16), bagMat);
    bagBody.scale.set(1.05, 1.5, 0.95);
    const bagNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 0.08, 12), bagMat);
    bagNeck.position.y = -0.2;
    bagGrp.add(bagBody, bagNeck);
    const tie = new THREE.Mesh(new THREE.TorusGeometry(0.037, 0.006, 6, 16), matStd(0x9aa46a, { roughness: 0.6 }));
    tie.rotation.x = Math.PI / 2;
    tie.position.y = -0.185;
    bagGrp.add(tie);
    // 袋内凝水珠（渐显）
    const drops = [];
    for (let i = 0; i < 18; i++) {
      const d = new THREE.Mesh(new THREE.SphereGeometry(0.01, 8, 6), new THREE.MeshPhysicalMaterial({ color: 0xcfe8f8, transparent: true, opacity: 0.85, roughness: 0.05, clearcoat: 1 }));
      d.visible = false;
      drops.push(d);
      bagGrp.add(d);
    }
    g.add(bagGrp);
    // 风扇（桌扇：底座+杆+护罩+叶轮）
    const fanGrp = new THREE.Group();
    const fanMat = matStd(0x6a7480, { roughness: 0.4, metalness: 0.6 });
    const fBase = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.03, 20), fanMat);
    const fPole = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.3, 10), fanMat);
    fPole.position.y = 0.16;
    const fHub = new THREE.Mesh(new THREE.SphereGeometry(0.03, 14, 10), fanMat);
    fHub.position.y = 0.34;
    fanGrp.add(fBase, fPole, fHub);
    const blades = new THREE.Group();
    const bladeMat = new THREE.MeshStandardMaterial({ color: 0xb8c4cc, roughness: 0.3, metalness: 0.5, side: THREE.DoubleSide, transparent: true, opacity: 0.85 });
    for (let i = 0; i < 4; i++) {
      const b = new THREE.Mesh(new THREE.PlaneGeometry(0.035, 0.1), bladeMat);
      b.position.y = 0.03;
      b.rotation.z = (i / 4) * TAU;
      const holder = new THREE.Group();
      holder.add(b);
      holder.rotation.y = (i / 4) * TAU;
      blades.add(holder);
    }
    blades.position.y = 0.34;
    fanGrp.add(blades);
    const cage = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.006, 6, 28), fanMat);
    cage.position.y = 0.34;
    fanGrp.add(cage);
    for (let i = 0; i < 5; i++) {
      const spoke = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.0018, 4, 20, Math.PI), fanMat);
      spoke.position.y = 0.34;
      spoke.rotation.z = (i / 5) * Math.PI;
      fanGrp.add(spoke);
    }
    fanGrp.position.set(-1.05, BENCH_Y, 0.35);
    fanGrp.rotation.y = 0.85;
    fanGrp.visible = false;
    g.add(fanGrp);
    // 风线（流动虚线）
    const windLines = [];
    for (let i = 0; i < 4; i++) {
      const l = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(-0.85 + i * 0.03, 0.8 + i * 0.07, 0.18), new THREE.Vector3(-0.35 + i * 0.03, 0.76 + i * 0.07, 0.18),
        ]),
        new THREE.LineDashedMaterial({ color: 0x9fb2c8, dashSize: 0.03, gapSize: 0.04, transparent: true, opacity: 0.7 })
      );
      l.computeLineDistances();
      l.visible = false;
      windLines.push(l);
      g.add(l);
    }
    const rate = () => {
      if (!ST8.bagOn) return 0;
      const lightF = 0.4 + (ST8.light / 100) * 1.2;
      const windF = ST8.wind ? 2.1 : 1;
      const dryF = 1 + (60 - ST8.soilWet) / 60 * 0.5;
      return lightF * windF * dryF;
    };
    const refresh = () => {
      clearGroup(plantG);
      const droopK = ST8.soilWet < 32 ? (32 - ST8.soilWet) / 32 * 0.8 : 0;
      const plant = buildBean(30, { droop: droopK, colorMod: ST8.light < 40 ? 0.5 : 0 });
      plant.position.y = 0.37;
      plant.scale.setScalar(0.85);
      plantG.add(plant);
      // 去叶对照枝（右侧细瓶中的切枝）——独立小组，切换时整组重建（材质全部专用，可安全 dispose）
      if (ST8.ctrlGrp) { g.remove(ST8.ctrlGrp); clearGroup(ST8.ctrlGrp); ST8.ctrlGrp = null; ST8.bag2Drop = null; }
      if (ST8.deleaf) {
        const cg = new THREE.Group();
        const jar2 = new THREE.Group();
        const jarProf = [[0.004, 0], [0.05, 0], [0.056, 0.01], [0.056, 0.12], [0.06, 0.13]].map(([r, y]) => new THREE.Vector2(r, y));
        jar2.add(new THREE.Mesh(new THREE.LatheGeometry(jarProf, 24), matGlassLite(COL.glassTint, { opacity: 0.3 })));
        const waterIn = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.07, 20), new THREE.MeshPhysicalMaterial({ color: COL.water, transparent: true, opacity: 0.4 }));
        waterIn.position.y = 0.045;
        jar2.add(waterIn);
        const twig = taperTube([new THREE.Vector3(0, 0.03, 0), new THREE.Vector3(0.01, 0.16, 0)], 0.006, 0.004, new THREE.MeshStandardMaterial({ color: 0xb9ae62, roughness: 0.7 }), { segs: 8, radialSegs: 6 });
        jar2.add(twig);
        // 切口（亮色）
        const cut = new THREE.Mesh(new THREE.CircleGeometry(0.005, 10), new THREE.MeshStandardMaterial({ color: 0xd8e8b0, roughness: 0.4, emissive: 0x3a5a2c, emissiveIntensity: 0.3 }));
        cut.rotation.x = -Math.PI / 2;
        cut.position.y = 0.165;
        jar2.add(cut);
        jar2.position.set(1.05, BENCH_Y, 0.25);
        cg.add(jar2);
        const jar2Sh = contactShadow(0.3, 0.3, 0.7);
        jar2Sh.position.set(1.05, BENCH_Y + 0.003, 0.25);
        cg.add(jar2Sh);
        // 对照枝小袋（专用材质副本，clearGroup 可安全释放）
        const bagMat2 = bagMat.clone();
        bagMat2.depthWrite = true;
        const bag2 = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 12), bagMat2);
        bag2.scale.set(1, 1.3, 0.9);
        bag2.position.set(1.05, 0.42, 0.25);
        cg.add(bag2);
        const d2 = new THREE.Mesh(new THREE.SphereGeometry(0.006, 8, 6), new THREE.MeshPhysicalMaterial({ color: 0xcfe8f8, transparent: true, opacity: 0.85 }));
        d2.visible = false;
        cg.add(d2);
        ST8.bag2Drop = d2;
        ST8.ctrlGrp = cg;
        g.add(cg);
      }
      // 主袋位置：套在枝条上部
      bagGrp.visible = ST8.bagOn;
      bagGrp.position.set(0.16, 1.28, 0.05);
      bagGrp.rotation.z = 0.12;
      bagGrp.children[0].scale.set(1.05, 1.35, 0.95);
      const n = Math.min(drops.length, Math.floor(ST8.minutes * rate() / 8));
      drops.forEach((d, i) => {
        d.visible = i < n && ST8.bagOn;
        const a = (i / drops.length) * TAU;
        d.position.set(Math.cos(a) * 0.115, 0.22 + (i % 5) * 0.055 - 0.1, Math.sin(a) * 0.1);
      });
      if (ST8.deleaf && ST8.bag2Drop) ST8.bag2Drop.visible = n > 8;
      windLines.forEach((l) => { l.visible = ST8.wind; });
      fanGrp.visible = ST8.wind;
      hud.set('drops', ST8.bagOn ? `${n} 滴（约 ${Math.round(rate() * 9)} 滴/时）` : '未套袋——水汽散失看不到');
      hud.set('rate', ST8.deleaf ? '对照枝：袋是干的（无叶=无蒸腾）' : rate() > 1.6 ? '快（光足风大）' : '正常');
      hud.set('soil', `${Math.round(ST8.soilWet)}%${ST8.soilWet < 32 ? ' · 缺水' : ST8.soilWet > 90 ? ' · 积水' : ''}`);
      hud.set('leaf', droopK > 0.3 ? '明显萎蔫下垂' : droopK > 0 ? '轻微萎蔫' : '舒展正常');
    };
    const tl = timelineCtl({ min: 0, max: 60, value: 0, speed: 9, fmt: { fmt: (v) => `${Math.round(v)} 分钟` }, onFrame: (v) => { ST8.minutes = v; refresh(); } });
    ctl.sep();
    ctl.slider({ label: '光照 %', min: 10, max: 100, step: 5, value: ST8.light, fmt: (v) => `${Math.round(v)}`, onInput: (v) => { ST8.light = v; refresh(); } });
    ctl.slider({ label: '盆土湿度 %', min: 10, max: 100, step: 5, value: ST8.soilWet, fmt: (v) => `${Math.round(v)}`, onInput: (v) => { ST8.soilWet = v; refresh(); } });
    ctl.sep();
    ctl.toggle({ label: '套袋', value: ST8.bagOn, onChange: (v) => { ST8.bagOn = v; refresh(); } });
    ctl.toggle({ label: '去叶对照枝', value: ST8.deleaf, onChange: (v) => { ST8.deleaf = v; refresh(); } });
    ctl.toggle({ label: '风扇', value: ST8.wind, onChange: (v) => { ST8.wind = v; refresh(); } });
    refresh();
    bindPlayToggle(tl);
    chapterTick = (dt) => {
      tl.tick(dt);
      if (ST8.wind) blades.rotation.y -= dt * 22;
      windLines.forEach((l, i) => {
        const mat = l.material;
        mat.opacity = 0.4 + Math.sin(performance.now() / 300 + i * 1.6) * 0.3;
      });
    };
  },
  leave() { ST8.tick = null; },
};
/* ---------- 第 9 章：向光性与生长素 ---------- */

const ST9 = { pick: 0, light: true, darkbox: false, auxin: true };

const AUX_SPECS = [
  { name: '① 完整', desc: '胚芽鞘完整：单侧光下弯向光源', bend: 1, cut: false, capTop: false, capLow: false, agar: false },
  { name: '② 切去尖端', desc: '无尖端：不生长也不弯曲', bend: 0, cut: true, capTop: false, capLow: false, agar: false },
  { name: '③ 尖端罩锡箔帽', desc: '尖端感不到光 → 直立生长', bend: 0, cut: false, capTop: true, capLow: false, agar: false },
  { name: '④ 尖端下套锡箔', desc: '尖端感光部位未遮 → 照常弯曲', bend: 1, cut: false, capTop: false, capLow: true, agar: false },
  { name: '⑤ 琼脂块偏放', desc: '温特：含生长素的琼脂块放在一侧 → 无光也弯', bend: 1, cut: true, capTop: false, capLow: false, agar: true },
];

const secAuxin = {
  title: '向光性与生长素',
  group: '拓展 · 检测',
  html: `<p>窗台上的幼苗总弯向窗外——<b>向光性</b>。两代科学家接力揭秘：</p>
<p><b>达尔文</b>（1880）：金丝雀虉草胚芽鞘单侧光下弯曲；<b>切去尖端</b>或<b>罩住尖端</b>则不弯不长 → 感光部位是<b>尖端</b>。<b>温特</b>（1927）：把尖端接触过的<b>琼脂块</b>放在去尖端鞘的一侧，鞘照样弯——尖端确实产生了可传递的物质，即<b>生长素</b>。</p>
<p>机理：单侧光让生长素在<b>背光侧</b>集中 → 背光侧长得快 → 芽弯向光源。</p>
<p>五个标本重现全部对照（含琼脂块验证）；可开关暗箱（只留一窗）与生长素显示。</p>`,
  enter() {
    resetWorld();
    camTo([1.05, 0.7, 1.7], [0.62, 0.3, 0]);
    const grp = newSceneGroup();
    buildHud([['spec', '标本'], ['tiltA', '茎尖倾斜角'], ['bendA', '弯曲角度'], ['result', '表现'], ['auxin', '生长素分布'], ['concl', '结论']]);
    ctl.clear();
    const g = new THREE.Group();
    grp.add(g);
    // 标本盘（长托盘 + 五只小土杯）
    const tray = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.05, 0.5), new THREE.MeshStandardMaterial({ map: WOOD.box(), roughness: 0.7 }));
    tray.position.set(0.62, BENCH_Y + 0.025, 0);
    g.add(tray);
    const traySh = contactShadow(2.3, 0.7, 0.8);
    traySh.position.set(0.62, BENCH_Y + 0.003, 0);
    g.add(traySh);
    const cupProf = [[0.05, 0], [0.058, 0.012], [0.062, 0.07], [0.064, 0.082]].map(([r, y]) => new THREE.Vector2(r, y));
    const cupGlassMat = matGlassLite(COL.glassTint, { opacity: 0.3 });
    const cups = [];
    AUX_SPECS.forEach((sp, i) => {
      const cup = new THREE.Mesh(new THREE.LatheGeometry(cupProf, 26), cupGlassMat);
      const x = -0.12 + i * 0.37;
      cup.position.set(x, BENCH_Y + 0.05, 0);
      g.add(cup);
      const soil = new THREE.Mesh(new THREE.CylinderGeometry(0.056, 0.052, 0.05, 22), new THREE.MeshStandardMaterial({ map: makeSoilTexture(0.45, 70 + i), roughness: 0.96 }));
      soil.position.set(x, BENCH_Y + 0.085, 0);
      g.add(soil);
      cups.push(x);
      const tag = new THREE.Mesh(
        new THREE.PlaneGeometry(0.17, 0.075),
        new THREE.MeshStandardMaterial({ map: makeLabelTexture([sp.name], { w: 220, h: 96, accent: i === ST9.pick ? '#8a3a2c' : '#4a5a3c', lineSizes: [30] }), roughness: 0.7, side: THREE.DoubleSide })
      );
      tag.position.set(x, BENCH_Y + 0.028, 0.26);
      tag.rotation.x = -0.3;
      tag.userData.specTag = 1;
      g.add(tag);
    });
    let specimenGrp = new THREE.Group();
    let tagGrps = [];
    g.add(specimenGrp);
    const lightG = new THREE.Group();
    g.add(lightG);
    const buildSpecimen = () => {
      clearGroup(specimenGrp);
      tagGrps.forEach((t) => g.remove(t));
      tagGrps = [];
      AUX_SPECS.forEach((sp, i) => {
        const sg = new THREE.Group();
        const x = cups[i];
        const bendDir = -1;      // 弯向 -X（光源在右侧 +X）
        const bend = sp.bend * 0.16;
        const H = 0.24;
        // 胚芽鞘：渐细管 + 顶端圆锥尖端
        const pts = [];
        const N = 10;
        for (let k = 0; k <= N; k++) {
          const t = k / N;
          const bx = sp.bend ? bend * t * t : 0;
          pts.push(new THREE.Vector3(x + bx * bendDir, BENCH_Y + 0.09 + H * t, 0));
        }
        const coleo = taperTube(pts, 0.011, 0.008, new THREE.MeshPhysicalMaterial({ color: 0xd8d078, roughness: 0.5, clearcoat: 0.3, sheen: 0.3, sheenColor: new THREE.Color(0xf2ecd0) }), { segs: 24, radialSegs: 10 });
        sg.add(coleo);
        if (!sp.cut) {
          const tip = new THREE.Mesh(new THREE.ConeGeometry(0.0085, 0.028, 12), new THREE.MeshStandardMaterial({ color: 0xc9bd6a, roughness: 0.5 }));
          tip.position.set(x + (sp.bend ? bend * bendDir : 0), BENCH_Y + 0.09 + H + 0.012, 0);
          tip.rotation.z = sp.bend ? bendDir * bend * 2 : 0;
          sg.add(tip);
        } else {
          // 切口断面（亮色圆片）
          const cutFace = new THREE.Mesh(new THREE.CircleGeometry(0.009, 12), new THREE.MeshStandardMaterial({ color: 0xe8e0b0, roughness: 0.4, emissive: 0x3a3a20, emissiveIntensity: 0.25 }));
          cutFace.rotation.x = -Math.PI / 2;
          cutFace.position.set(x, BENCH_Y + 0.09 + H, 0);
          sg.add(cutFace);
        }
        if (sp.capTop) {
          const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.0125, 0.0135, 0.05, 14, 1, true), new THREE.MeshStandardMaterial({ map: makeFoilTexture(), roughness: 0.3, metalness: 0.6, side: THREE.DoubleSide }));
          cap.position.set(x, BENCH_Y + 0.09 + H - 0.012, 0);
          sg.add(cap);
        }
        if (sp.capLow) {
          const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.0125, 0.0135, 0.06, 14, 1, true), new THREE.MeshStandardMaterial({ map: makeFoilTexture(), roughness: 0.3, metalness: 0.6, side: THREE.DoubleSide }));
          cap.position.set(x, BENCH_Y + 0.09 + H * 0.55, 0);
          sg.add(cap);
        }
        if (sp.agar) {
          // 琼脂块：半透明小块偏放在切口一侧
          const agar = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.02, 0.026), new THREE.MeshPhysicalMaterial({ color: 0xf2ecd0, roughness: 0.35, clearcoat: 0.5 }));
          agar.position.set(x + 0.012, BENCH_Y + 0.09 + H + 0.01, 0);
          sg.add(agar);
        }
        // 生长素标记（背光侧金点，弯的标本才有"浓度差"）
        if (ST9.auxin && sp.bend) {
          const dotMat = new THREE.MeshBasicMaterial({ color: COL.auxin, transparent: true, opacity: 0.9 });
          for (let k = 0; k < 4; k++) {
            const dot = new THREE.Mesh(new THREE.SphereGeometry(0.0045, 8, 6), dotMat);
            dot.position.set(x + bend * bendDir - 0.014 - bendDir * 0.004, BENCH_Y + 0.12 + k * 0.035, 0);
            sg.add(dot);
          }
        }
        // 选中态：圈线
        if (i === ST9.pick) {
          const ring = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.004, 8, 32), new THREE.MeshBasicMaterial({ color: COL.marker }));
          ring.rotation.x = Math.PI / 2;
          ring.position.set(x, BENCH_Y + 0.055, 0);
          sg.add(ring);
        }
        specimenGrp.add(sg);
        // 标签更新（选中红色）
        const tag = g.children.find((c) => c.userData.specTag && Math.abs(c.position.x - x) < 0.01);
        if (tag) {
          tag.material.dispose();
          tag.material = new THREE.MeshStandardMaterial({ map: makeLabelTexture([sp.name], { w: 220, h: 96, accent: i === ST9.pick ? '#8a3a2c' : '#4a5a3c', lineSizes: [30] }), roughness: 0.7, side: THREE.DoubleSide });
        }
      });
      // 暗箱（罩住 ① 号，只朝光源一侧开窗）
      g.children.filter((c) => c.userData.darkbox).forEach((c) => { g.remove(c); clearGroup(c); });
      if (ST9.darkbox) {
        const box = new THREE.Group();
        const shell = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, 0.3), new THREE.MeshPhysicalMaterial({ color: 0x1a2420, roughness: 0.42, clearcoat: 0.3 }));
        box.add(shell);
        // 开窗（右壁挖窗：亮洞口 + 木框条）
        const win = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.14), new THREE.MeshBasicMaterial({ color: 0xf2e6c0 }));
        win.position.set(0.149, 0.05, 0);
        win.rotation.y = Math.PI / 2;
        box.add(win);
        const winFrame = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.17, 0.17), matStd(COL.woodDeep, { roughness: 0.6 }));
        winFrame.position.set(0.152, 0.05, 0);
        box.add(winFrame);
        box.userData.darkbox = 1;
        box.position.set(cups[0], BENCH_Y + 0.3, 0);
        g.add(box);
      }
      // 单侧光（从 +X 侧射向 ① 号）
      clearGroup(lightG);
      if (ST9.light) {
        const sunDisc = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 12), new THREE.MeshBasicMaterial({ color: 0xffe9a8 }));
        sunDisc.position.set(2.2, 0.75, 0);
        lightG.add(sunDisc);
        const halo = makeGlowSprite(0.35);
        halo.position.copy(sunDisc.position);
        lightG.add(halo);
        for (let i = 0; i < 5; i++) {
          const y = 0.18 + i * 0.1;
          const ray = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(2.1, y + 0.28, 0), new THREE.Vector3(0.62, y, 0)]),
            new THREE.LineBasicMaterial({ color: 0xffe08a, transparent: true, opacity: 0.5 })
          );
          lightG.add(ray);
        }
        const rayLbl = makeTextSprite('单侧光', { fontSize: 36, color: '#ffd166', scale: 0.0026 });
        rayLbl.position.set(1.9, 0.62, 0);
        lightG.add(rayLbl);
      }
      const sp = AUX_SPECS[ST9.pick];
      const bendDeg = sp.bend ? (sp.agar ? 45 : 52) : 0;
      hud.set('spec', `${sp.name}${sp.agar ? '（温特验证）' : ''}`);
      hud.set('tiltA', sp.bend ? `${bendDeg}°（${sp.agar ? '无光也弯 · 偏离竖直' : '弯向光源'}）` : '0°（直立生长）');
      hud.set('bendA', sp.bend ? `弯曲段 ≈ ${bendDeg}°（背光侧多长）` : '无弯曲');
      hud.set('result', sp.desc);
      hud.set('auxin', ST9.auxin ? (sp.bend ? '背光侧（+X 对侧）浓度高' : '无尖端 → 无生长素来源') : '显示已关');
      hud.set('concl', ST9.pick === 0 ? '感光部位在尖端' : ST9.pick === 1 ? '尖端产生生长素' : ST9.pick === 2 ? '感光 = 尖端感受到单侧光' : ST9.pick === 3 ? '感光部位 ≠ 弯曲部位（尖端下）' : '生长素可从尖端传递（琼脂块证明）');
    };
    ctl.clear();
    ctl.seg({
      options: AUX_SPECS.map((sp, i) => ({ label: sp.name, value: String(i) })),
      value: String(ST9.pick),
      onChange: (v) => {
        ST9.pick = +v;
        buildSpecimen();
        camTo([cups[ST9.pick] + 0.5, 0.5, 0.95], [cups[ST9.pick], 0.28, 0], 0.9);
      },
    });
    ctl.sep();
    ctl.toggle({ label: '单侧光', value: ST9.light, onChange: (v) => { ST9.light = v; buildSpecimen(); } });
    ctl.toggle({ label: '暗箱留窗（罩①号）', value: ST9.darkbox, onChange: (v) => { ST9.darkbox = v; buildSpecimen(); } });
    ctl.toggle({ label: '生长素标记', value: ST9.auxin, onChange: (v) => { ST9.auxin = v; buildSpecimen(); } });
    buildSpecimen();
    // 标本轻微"生长摆动"
    chapterTick = (dt) => {
      specimenGrp.children.forEach((sg, i) => {
        sg.rotation.z = Math.sin(performance.now() / 1400 + i * 2) * 0.008;
      });
    };
  },
  leave() { ST9.tick = null; },
};

/* ---------- 第 10 章：开花与结果 ---------- */

const ST10 = { day: 36, pollinated: false, cutaway: false };

const FLOWER_FATE = [
  ['花萼', '宿存（豆荚基部还在）', 44],
  ['花冠', '凋落', 45],
  ['雄蕊', '凋落', 45],
  ['柱头与花柱', '凋落', 45],
  ['子房', '持续发育 → 豆荚（果实）', 44],
  ['胚珠', '发育成种子（豆粒）', 46],
];

const secFlower = {
  title: '开花与结果',
  group: '拓展 · 检测',
  html: `<p>菜豆是<b>自花传粉</b>作物：蝶形花冠包着雄蕊与雌蕊，多在开花前已完成自交。受精后，花的"剧本"改写：</p>
<p><span class="hl">花萼宿存 · 花瓣凋落 · 雄蕊凋落 · 柱头花柱凋落 · 子房发育成果实（豆荚） · 胚珠发育成种子（豆粒）</span>。</p>
<p>拖时间轴过 36 天：花谢处结出细荚，一天天鼓起来——里面就是下一代。点「授粉结荚」直达结果期，「剖开豆荚」看种子着生。</p>`,
  enter() {
    resetWorld();
    camTo([2.1, 1.3, 2.9], [0.05, 0.95, 0]);
    const grp = newSceneGroup();
    buildHud([['day', '日程'], ['phase', '阶段'], ['fate', '花器官去向'], ['count', '花与豆荚']]);
    ctl.clear();
    const plantG = new THREE.Group();
    grp.add(plantG);
    const labelsG = new THREE.Group();
    grp.add(labelsG);
    // 花器官命运卡（左上）
    let fateEl = null;
    const paintFate = () => {
      if (!fateEl) {
        fateEl = document.createElement('div');
        fateEl.className = 'plant-card plant-parts';
        stage.appendChild(fateEl);
        activeCleanupExtra = () => fateEl.remove();
      }
      fateEl.innerHTML = '<h3>花器官的命运</h3>' + FLOWER_FATE.map(([o, f, d]) =>
        `<div class="pp-row${ST10.day >= d ? ' on' : ''}"><b>${o}</b><span>${f}</span></div>`
      ).join('');
    };
    const refresh = () => {
      clearGroup(plantG);
      clearGroup(labelsG);
      const d = ST10.pollinated ? Math.max(ST10.day, 46) : ST10.day;
      plantG.add(buildBean(Math.min(d, 56)));
      if (ST10.pollinated && ST10.day >= 46) {
        const lbl = makeTextSprite('子房 → 豆荚（果实）', { fontSize: 40, color: '#9fe870', scale: 0.0026 });
        lbl.position.set(0.52, 0.9, 0);
        labelsG.add(lbl);
      }
      // 剖开豆荚特写标本
      if (ST10.cutaway) {
        const podCut = makePodCutaway(0.22);
        podCut.position.set(0.95, 0.62, 0.35);
        podCut.rotation.set(0.3, -0.9, 0.2);
        plantG.add(podCut);
        const lblA = makeTextSprite('豆荚剖面 · 胚珠 → 种子', { fontSize: 38, color: '#f2d8a0', scale: 0.0024 });
        lblA.position.set(0.95, 0.95, 0.35);
        labelsG.add(lblA);
      }
      hud.set('day', `第 ${Math.round(d)} 天`);
      hud.set('phase', d < 36 ? '现蕾' : d < 44 ? '开花（自花传粉已完成）' : d < 50 ? '结荚' : '鼓粒成熟');
      hud.set('fate', d >= 44 ? '萼存 · 瓣落 · 雄蕊落 · 柱头落' : '花朵结构完整');
      const pods = d >= 46 ? Math.min(3, Math.floor((d - 44) / 3)) : 0;
      hud.set('count', d >= 44 ? `${pods || 1} 荚 × 5 种子 = ${Math.max(1, pods) * 5} 粒（花谢结荚）` : `蝶形花 ${Math.max(1, Math.round((d - 34) / 2))} 朵 · 待传粉`);
      paintFate();
    };
    const tl = timelineCtl({ min: 30, max: 56, value: ST10.day, speed: 2.4, onFrame: (v) => { ST10.day = v; refresh(); } });
    ctl.sep();
    ctl.button({ label: '授粉结荚 →', onClick: () => { ST10.pollinated = true; ST10.day = 46; tl.slider.set(46); refresh(); hudToast2('受精完成：子房开始发育成豆荚。'); } });
    ctl.button({ label: '↺ 回到开花', onClick: () => { ST10.pollinated = false; ST10.day = 36; tl.slider.set(36); refresh(); } });
    ctl.toggle({ label: '剖开豆荚（特写标本）', value: ST10.cutaway, onChange: (v) => { ST10.cutaway = v; if (v) camTo([1.45, 0.85, 1.5], [0.95, 0.72, 0.35], 1.0); refresh(); } });
    refresh();
    bindPlayToggle(tl);
    chapterTick = (dt) => tl.tick(dt);
  },
  leave() { ST10.tick = null; },
};

/* ---------- 第 11 章：自由培养 ---------- */

const ST11 = { day: 30, light: 70, water: 65, temp: 24, fert: 50 };

const secSandbox = {
  title: '自由培养',
  group: '拓展 · 检测',
  html: `<p>自由实验台：四个环境旋钮随你调，看这株菜豆怎么长。</p>
<p><b>光照</b>：低于 30% 黄化徒长（又高又细叶发黄），高于 70% 叶色深绿；<b>水分</b>：低于 30% 缺水萎蔫（叶片下垂），高于 90% 积水烂根（长势也掉）；<b>温度</b>：15–32℃ 舒适区间，过冷过热都减速；<b>肥料</b>：中等最健康——"多多益善"是误区，过量施肥（烧根）反而长不好。</p>
<p>综合长势 = 光 × 水 × 温 × 肥的<span class="hl">乘性组合</span>——任何一项成为短板都会拖垮整体（<b>短板效应 / Liebig 最小因子律</b>）。</p>`,
  enter() {
    resetWorld();
    camTo([2.35, 1.25, 2.9], [0, 0.62, 0]);
    const grp = newSceneGroup();
    buildHud([['grade', '综合长势'], ['idx', '长势系数'], ['notes', '限制因素'], ['law', '短板效应']]);
    ctl.clear();
    const plantG = new THREE.Group();
    grp.add(plantG);
    const health = () => {
      const lf = ST11.light < 30 ? 0.45 : 0.8 + ((ST11.light - 30) / 70) * 0.3;
      const wf = ST11.water < 30 ? 0.35 + (ST11.water / 30) * 0.4 : ST11.water > 92 ? 0.6 : 0.85 + ((ST11.water - 30) / 70) * 0.2;
      const tf = ST11.temp < 12 || ST11.temp > 34 ? 0.25 : ST11.temp < 15 || ST11.temp > 32 ? 0.6 : 1;
      const ff = 1 - Math.abs(ST11.fert - 55) / 55 * 0.55;
      return Math.max(0.15, lf * wf * tf * ff);
    };
    const refresh = () => {
      clearGroup(plantG);
      const h = health();
      const day = 12 + ST11.day * h * 0.9;
      const opts = {
        dark: ST11.light < 25,
        droop: ST11.water < 32 ? ((32 - ST11.water) / 32) * 0.8 : 0,
        colorMod: (ST11.light < 40 ? 0.7 : 0) + (ST11.fert > 88 ? 0.4 : 0),
        scale: 0.55 + h * 0.5,
      };
      plantG.add(buildBean(day, opts));
      const grade = h > 0.62 ? '茁壮' : h > 0.42 ? '正常' : h > 0.28 ? '蔫头耷脑' : '危在旦夕';
      hud.set('grade', `${grade}（第 ${Math.round(day)} 天的株型）`);
      hud.set('idx', `${Math.round(h * 100)} / 100`);
      const notes = [];
      if (ST11.light < 30) notes.push('光照不足 → 黄化徒长');
      if (ST11.water < 30) notes.push('缺水 → 萎蔫');
      if (ST11.water > 92) notes.push('积水 → 烂根');
      if (ST11.temp < 15 || ST11.temp > 32) notes.push('温度不适 → 生长停滞');
      if (ST11.fert > 88) notes.push('肥过量 → 烧根');
      if (!notes.length) notes.push('各条件都在舒适区间');
      hud.set('notes', notes.join(' · '));
      hud.set('law', `乘性组合：${(ST11.light / 100).toFixed(2)}×${(Math.min(1, ST11.water / 70)).toFixed(2)}×${(ST11.temp >= 15 && ST11.temp <= 32 ? 1 : 0.6).toFixed(2)}×${(1 - Math.abs(ST11.fert - 55) / 100).toFixed(2)} → ${Math.round(h * 100)}`);
    };
    ctl.slider({ label: '光照 %', min: 5, max: 100, step: 5, value: ST11.light, fmt: (v) => `${Math.round(v)}`, onInput: (v) => { ST11.light = v; refresh(); } });
    ctl.slider({ label: '水分 %', min: 5, max: 100, step: 5, value: ST11.water, fmt: (v) => `${Math.round(v)}`, onInput: (v) => { ST11.water = v; refresh(); } });
    ctl.slider({ label: '温度 ℃', min: 5, max: 40, step: 1, value: ST11.temp, fmt: (v) => `${Math.round(v)}`, onInput: (v) => { ST11.temp = v; refresh(); } });
    ctl.slider({ label: '肥料 %', min: 0, max: 100, step: 5, value: ST11.fert, fmt: (v) => `${Math.round(v)}`, onInput: (v) => { ST11.fert = v; refresh(); } });
    ctl.sep();
    ctl.slider({ label: '培养天数', min: 10, max: 55, step: 1, value: ST11.day, fmt: (v) => `${Math.round(v)}`, onInput: (v) => { ST11.day = v; refresh(); } });
    ctl.sep();
    ctl.button({ label: '🌱 满配试试', onClick: () => { ST11.light = 85; ST11.water = 65; ST11.temp = 24; ST11.fert = 55; syncSliders(); refresh(); } });
    ctl.button({ label: '🚰 只缺水试试', onClick: () => { ST11.light = 85; ST11.water = 12; ST11.temp = 24; ST11.fert = 55; syncSliders(); refresh(); } });
    refresh();
    let sliders = null;
    const syncSliders = () => {
      if (!sliders) sliders = [...ctl.el.querySelectorAll('input[type="range"]')];
      const [sl, sw, st, sf, sd] = sliders;
      sl.value = ST11.light; sw.value = ST11.water; st.value = ST11.temp; sf.value = ST11.fert; sd.value = ST11.day;
      [sl, sw, st, sf, sd].forEach((el) => el.dispatchEvent(new Event('input')));
    };
    syncSliders();
    chapterTick = null;
  },
  leave() { ST11.tick = null; },
};

/* ---------- 第 12 章：随堂检测 ---------- */

const PLANT_QUIZ = [
  {
    q: '种子萌发必需的外界条件组合是？',
    opts: ['光、水、肥', '水分、空气、适宜温度', '光、空气、土壤', '水、光、温度'],
    a: 1,
    ex: '对照实验表明：充足水分、充足空气、适宜温度三者缺一不可。光不是萌发必需——土里的种子照样萌发。',
  },
  {
    q: '菜豆幼苗出土时，幼芽弯成"弯钩"的作用是？',
    opts: ['好看', '保护生长点不被泥土磨伤', '储存水分', '吸引昆虫'],
    a: 1,
    ex: '弯钩以弯背拱土，把娇嫩的顶端分生组织护在弯内，出土后再伸直——兜住生长点的"安全帽"。',
  },
  {
    q: '把幼苗横放，几天后根尖向下弯。这体现了根的？',
    opts: ['向光性', '向地性', '向水性', '背地性'],
    a: 1,
    ex: '根具有向地性：横放后重力使生长素在靠地侧积累，抑制根的生长，背地侧长得快，根向下弯（茎则背地向上弯）。',
  },
  {
    q: '萨克斯实验中，叶片遮光部分滴碘后不变蓝，说明？',
    opts: ['遮光处没有叶绿体', '淀粉是光合产物且光是必需条件', '碘只与叶绿素反应', '遮光处呼吸作用强'],
    a: 1,
    ex: '见光部分变蓝（有淀粉）、遮光处不变蓝（无淀粉）——淀粉靠光合作用制造，光是这一过程的必需条件。',
  },
  {
    q: '胚芽鞘切去尖端后放在单侧光下，结果是？',
    opts: ['弯向光源', '弯向背光侧', '不生长也不弯曲', '先直后弯'],
    a: 2,
    ex: '达尔文实验：无尖端则既不生长也不弯曲——尖端产生生长素并感受光刺激。温特进一步证明这种"影响"可以从尖端传递到琼脂块。',
  },
  {
    q: '玉米粒其实是果实，判据是？',
    opts: ['它只有一片子叶', '果皮与种皮愈合在一起', '它的养分存在胚乳', '它有颖壳包被'],
    a: 1,
    ex: '玉米颖果的果皮与种皮紧贴愈合、分不开——果实 = 果皮 + 种子。养分储在胚乳是单子叶特征，但不是"果实"的判据。',
  },
];

const secQuiz = {
  title: '随堂检测',
  group: '拓展 · 检测',
  html: '<p>6 道题检验本章掌握情况——覆盖萌发条件、弯钩、向地性、萨克斯实验、胚芽鞘与果实判断。答完可重新开始。</p>',
  enter() {
    resetWorld();
    camTo([2.4, 1.3, 3.0], [0, 0.7, 0]);
    const grp = newSceneGroup();
    grp.add(buildBean(52));
    hud = null;
    document.getElementById('lcData').innerHTML = '';
    ctl.clear();
    ctl.button({ label: '↺ 复位视角', onClick: () => camTo([2.4, 1.3, 3.0], [0, 0.7, 0], 0.9) });
    showQuizPanel();
    chapterTick = null;
  },
};

/* =====================================================================
 * 随堂检测面板（stage 内浮层，lab.css 的 quiz 视觉）
 * ===================================================================== */

function hudEl() { return hud || { show() {}, set() {} }; }

function showQuizPanel() {
  let idx = 0;
  let score = 0;
  const panel = document.createElement('div');
  panel.className = 'quiz-panel';
  stage.appendChild(panel);
  activeCleanupExtra = () => panel.remove();

  function renderQ() {
    const item = PLANT_QUIZ[idx];
    panel.innerHTML = '';
    const card = document.createElement('div');
    card.className = 'quiz-card';
    card.innerHTML = `
      <div class="q-progress">第 ${idx + 1} / ${PLANT_QUIZ.length} 题</div>
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
        next.textContent = idx < PLANT_QUIZ.length - 1 ? '下一题 →' : '查看成绩 →';
        next.addEventListener('click', () => {
          idx++;
          if (idx < PLANT_QUIZ.length) renderQ();
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
    const pct = Math.round((score / PLANT_QUIZ.length) * 100);
    card.innerHTML = `
      <div class="q-progress">检测完成</div>
      <div class="big">${score} / ${PLANT_QUIZ.length}</div>
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
    back.addEventListener('click', () => { panel.remove(); window.__plantSections.select(0); });
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:10px;justify-content:center';
    row.appendChild(back); row.appendChild(again);
    card.appendChild(row);
    panel.appendChild(card);
  }

  renderQ();
}

/* =====================================================================
 * 布局驱动（三栏 / 折叠 / 专注 / 手风琴 / 快捷键 / 启动）
 * ===================================================================== */

const plantShell = document.getElementById('plantShell');
const chapNav = document.getElementById('chapNav');
const chapCount = document.getElementById('chapCount');
const detailNo = document.getElementById('detailNo');
const detailTitle = document.getElementById('detailTitle');
const lessonEl = document.getElementById('lesson');
const controlsEl = document.getElementById('controls');
const detailBody = document.getElementById('detailBody');

const SECTIONS = [
  secOverview, secGerminate, secSeed, secEtiolate,
  secGeotrop, secPhotosyn, secStarch, secTranspire,
  secAuxin, secFlower, secSandbox, secQuiz,
];

/* 运行态变量（章节 enter 在 boot 之后运行，声明顺序安全） */
let chapterIdx = 0;
let activeCleanupExtra = null;

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
  if (activeCleanupExtra) { activeCleanupExtra(); activeCleanupExtra = null; }
  if (activeCleanup) { activeCleanup(); activeCleanup = null; }
  chapterTick = null;
  chapterPlayToggle = null;
  hud = null;
  sec.enter();
  accSecs.controls.classList.toggle('acc-empty', !controlsEl.children.length);
  accSecs.data.classList.toggle('acc-empty', !document.querySelector('#lcData .hud-card'));
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
const FOLD_KEY = { l: 'plant.foldL', r: 'plant.foldR' };
let foldL = false;
let foldR = false;
let focusSaved = null;
try {
  foldL = localStorage.getItem(FOLD_KEY.l) === '1';
  foldR = localStorage.getItem(FOLD_KEY.r) === '1';
} catch (e) { /* localStorage 不可用时仅会话内生效 */ }
function applyShellFold() {
  plantShell.classList.toggle('fold-l', foldL);
  plantShell.classList.toggle('fold-r', foldR);
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
  plantShell.classList.toggle('focus-mode', on);
  focusBtn.textContent = on ? '退出专注' : '专注模式';
  focusBtn.setAttribute('aria-pressed', String(on));
  applyShellFold();
}
function toggleFold(side) {
  if (focusSaved !== null) setFocus(false);
  if (classroom) setClassroom(false);   // 课堂模式下栏内容浮于舞台，先退出再折，防 28px 列溢出
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
const ACC_KEYS = { lesson: 'plant.accLesson', controls: 'plant.accControls', data: 'plant.accData' };
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

/* 舞台工具（视角 / 全屏）+ 键盘 ←→ R F Space ] */
const chapPrev = document.getElementById('chapPrev');
const chapNext = document.getElementById('chapNext');
const viewBtn = document.getElementById('viewBtn');
const fsBtn = document.getElementById('fsBtn');

function gotoChapter(i) { selectChapter((i + SECTIONS.length) % SECTIONS.length); }
chapPrev.addEventListener('click', () => gotoChapter(chapterIdx - 1));
chapNext.addEventListener('click', () => gotoChapter(chapterIdx + 1));
viewBtn.addEventListener('click', () => {
  framePlant();
  toast('视角已复位（R）。');
});
fsBtn.addEventListener('click', () => {
  if (document.fullscreenElement) document.exitFullscreen();
  else document.documentElement.requestFullscreen?.().catch(() => toast('浏览器拒绝了全屏请求。'));
});

/* ---------- 课堂模式：放大舞台，右栏（讲解文字 + 观察记录）浮于舞台 ---------- */
const classroomBtn = document.getElementById('classroomBtn');
let classroom = false;
let classroomSaved = null;
function setClassroom(on) {
  if (on === classroom) return;
  classroom = on;
  if (on) {
    classroomSaved = [foldL, foldR];
    foldL = true;                       // 左栏收起，舞台放大
  } else if (classroomSaved) {
    [foldL, foldR] = classroomSaved;    // 退出时恢复进入前的折叠状态
    classroomSaved = null;
  }
  plantShell.classList.toggle('classroom', classroom);
  classroomBtn.classList.toggle('active', classroom);
  classroomBtn.textContent = classroom ? '退出课堂' : '课堂模式';
  applyShellFold();
  toast(classroom ? '课堂模式：舞台放大，讲解与观察记录浮于右侧。' : '已退出课堂模式。');
}
classroomBtn.addEventListener('click', () => setClassroom(!classroom));

/* ---------- 画质优先 / 流畅度优先（渲染分辨率 2x ↔ 1x） ---------- */
const qualityBtn = document.getElementById('qualityBtn');
const QUALITY_KEY = 'plant.quality';
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

/* ---------- 重做实验：全部章节实验状态复位回初始 ---------- */
const ST_INIT = {
  1: { ...ST1 }, 2: { ...ST2 }, 3: { ...ST3 }, 4: { ...ST4 }, 5: { ...ST5 }, 6: { ...ST6 },
  7: { ...ST7 }, 8: { ...ST8 }, 9: { ...ST9 }, 10: { ...ST10 }, 11: { ...ST11 },
};
const redoBtn = document.getElementById('redoBtn');
redoBtn.addEventListener('click', () => {
  for (let n = 1; n <= 11; n++) Object.assign([ST1, ST2, ST3, ST4, ST5, ST6, ST7, ST8, ST9, ST10, ST11][n - 1], ST_INIT[n]);
  selectChapter(chapterIdx);
  toast('实验已重做：本章状态复位。');
});

/** 当前章的默认机位（R 键复位用） */
function framePlant() {
  const presets = {
    0: [[1.42, 0.88, 1.95], [0.02, 0.42, 0]],
    1: [[2.5, 1.25, 3.1], [0.55, 0.22, 0]],
    2: [[0.62, 0.42, 0.95], [0, 0.22, 0]],
    3: [[2.35, 1.15, 3.3], [0.55, 0.42, 0]],
    4: [[1.45, 0.62, 2.2], [0, 0.24, 0.06]],
    5: [[1.7, 0.85, 2.5], [0.3, 0.28, 0]],
    6: [[0.9, 0.75, 2.05], [0.25, 0.34, 0]],
    7: [[2.15, 1.05, 2.7], [0.3, 0.72, 0]],
    8: [[1.05, 0.7, 1.7], [0.62, 0.3, 0]],
    9: [[2.1, 1.3, 2.9], [0.05, 0.95, 0]],
    10: [[2.35, 1.25, 2.9], [0, 0.62, 0]],
    11: [[2.4, 1.3, 3.0], [0, 0.7, 0]],
  };
  const p = presets[chapterIdx] || presets[0];
  app.setCamera(p[0], p[1]);
}
window.addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const t = e.target;
  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
  if (e.key === 'ArrowLeft') gotoChapter(chapterIdx - 1);
  else if (e.key === 'ArrowRight') gotoChapter(chapterIdx + 1);
  else if (e.key === ']') toggleFold('r');
  else if (e.key === 'r' || e.key === 'R') { framePlant(); toast('视角已复位（R）。'); }
  else if (e.key === 'f' || e.key === 'F') fsBtn.click();
  else if (e.key === ' ') {
    e.preventDefault();
    if (typeof chapterPlayToggle === 'function') chapterPlayToggle();
  }
});

/* 提示条 */
function toast(text) {
  const old = stage.querySelector('.plant-toast');
  if (old) old.remove();
  const el = document.createElement('div');
  el.className = 'plant-toast';
  el.textContent = text;
  stage.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 300);
  }, 2200);
}
/** 别名（部分章节引用旧名） */
function hudToast(text) { toast(text); }
function hudToast2(text) { toast(text); }

/** 时间轴章的空格播放切换注册器 */
let chapterPlayToggle = null;
function bindPlayToggle(st) { chapterPlayToggle = () => st.toggle(); }

/* ================= 帧循环与启动 ================= */

let labReady = false;

app.onFrame((dt) => {
  if (!labReady) return;
  if (chapterTick) chapterTick(dt);
});

function boot() {
  labReady = true;
  loader.hide();
  window.__plantSections = { select: selectChapter };
  window.__plantDebug = {
    vfx, app,
    stats: () => vfx.stats(),
  };
  const h = parseInt(location.hash.slice(1), 10);
  const start = Number.isFinite(h) && h >= 1 && h <= SECTIONS.length ? h - 1 : 0;
  selectChapter(start);
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
