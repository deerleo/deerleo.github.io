/* EduLab 共享 3D 工具模块
 * 贴图/HDR 加载器、场景脚手架、章节管理、控制条 UI 组件、文字精灵等。
 * 依赖：页面 importmap 提供 'three' 与 'three/addons/'（本地副本，见 assets/lib/three/）。
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

export { THREE };

export const DEG = Math.PI / 180;
export const TAU = Math.PI * 2;

export function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }

/* ================= 加载器 ================= */

const texLoader = new THREE.TextureLoader();

export function loadTexture(url, opts = {}) {
  return new Promise((resolve, reject) => {
    texLoader.load(url, (tex) => {
      if (opts.colorSpace !== null) tex.colorSpace = opts.colorSpace || THREE.SRGBColorSpace;
      tex.anisotropy = opts.anisotropy || 8;
      if (opts.wrap) { tex.wrapS = tex.wrapT = THREE.RepeatWrapping; }
      if (opts.repeat) tex.repeat.set(opts.repeat[0], opts.repeat[1]);
      resolve(tex);
    }, undefined, () => reject(new Error('贴图加载失败: ' + url)));
  });
}

export function loadHDR(url) {
  return new Promise((resolve, reject) => {
    new RGBELoader().load(url, (tex) => {
      tex.mapping = THREE.EquirectangularReflectionMapping;
      resolve(tex);
    }, undefined, () => reject(new Error('HDR 加载失败: ' + url)));
  });
}

/** 并行加载，onProgress(loaded, total) 汇报进度 */
export async function loadAll(tasks, onProgress) {
  let done = 0;
  const total = tasks.length;
  const jobs = tasks.map((t) =>
    Promise.resolve(t.job).then((v) => {
      done++;
      if (onProgress) onProgress(done, total, t.label);
      return v;
    })
  );
  return Promise.all(jobs).then((vals) => {
    const out = {};
    tasks.forEach((t, i) => { out[t.key] = vals[i]; });
    return out;
  });
}

/* ================= 场景脚手架 ================= */

const THEMES = {
  light: { bg: 0xdfe6ee },
  dark: { bg: 0x090c10 },
};

export function createApp(opts = {}) {
  const container = opts.container;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = opts.toneMapping === undefined ? THREE.ACESFilmicToneMapping : opts.toneMapping;
  renderer.toneMappingExposure = opts.exposure || 1.0;
  container.appendChild(renderer.domElement);
  renderer.domElement.tabIndex = 0;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(opts.fov || 45, 1, opts.near || 0.05, opts.far || 2000);
  camera.position.set(...(opts.cameraPos || [0, 2, 6]));

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = opts.minDistance || 0.5;
  controls.maxDistance = opts.maxDistance || 100;
  if (opts.target) controls.target.set(...opts.target);
  controls.update();

  function resize() {
    const w = container.clientWidth || 1;
    const h = container.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(container);
  resize();

  const frameCbs = [];
  let paused = false;
  const clock = new THREE.Clock();

  renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 0.1);
    if (!paused) for (const cb of frameCbs) cb(dt, clock.elapsedTime);
    controls.update();
    /* 渲染钩子：attachVFX() 等后处理管线接管输出时设置 app._renderHook；
     * 未设置时保持默认直渲（向后兼容，其余实验零影响）。 */
    if (app._renderHook) app._renderHook(dt, clock.elapsedTime);
    else renderer.render(scene, camera);
  });

  function applyTheme(t) {
    const th = THEMES[t] || THEMES.light;
    if (!opts.keepBackground) scene.background = new THREE.Color(th.bg);
    if (opts.onTheme) opts.onTheme(t);
  }
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const savedTheme = () => {
    try { return localStorage.getItem('edulab-theme'); } catch (e) { return null; }
  };
  const mqHandler = () => {
    const saved = savedTheme();
    if (saved !== 'light' && saved !== 'dark') applyTheme(mq.matches ? 'dark' : 'light');
  };
  if (mq.addEventListener) mq.addEventListener('change', mqHandler);
  window.addEventListener('edulabtheme', (e) => applyTheme(e.detail.theme));
  {
    const saved = savedTheme();
    applyTheme(saved === 'dark' || (saved !== 'light' && mq.matches) ? 'dark' : 'light');
  }

  const app = {
    THREE, scene, camera, renderer, controls,
    dom: renderer.domElement,
    onFrame(cb) { frameCbs.push(cb); },
    setPaused(v) { paused = v; },
    get paused() { return paused; },
    setCamera(pos, target, immediate = false) {
      if (immediate) {
        camera.position.set(...pos);
        if (target) controls.target.set(...target);
        controls.update();
        app._camTween = null;
      } else {
        app._camTween = { to: pos, target, t: 0 };
      }
    },
    dispose() {
      renderer.setAnimationLoop(null);
      renderer.dispose();
      if (renderer.domElement.parentNode === container) container.removeChild(renderer.domElement);
    },
    _camTween: null,
  };
  return app;
}

/** 每帧调用的相机缓动（在 app.onFrame 里挂一次） */
export function cameraTweenTick(app, dt) {
  const tw = app._camTween;
  if (!tw) return;
  tw.t += dt * 3.2;
  const k = 1 - Math.exp(-6 * dt);
  app.camera.position.lerp(new THREE.Vector3(...tw.to), k);
  if (tw.target) app.controls.target.lerp(new THREE.Vector3(...tw.target), k);
  if (tw.t > 3) app._camTween = null;
}

/* ================= 加载遮罩 ================= */

export function makeLoader(container, text = '正在准备实验…') {
  const el = document.createElement('div');
  el.className = 'lab-loader';
  el.innerHTML = '<div class="spin"></div><div class="load-text"></div>';
  el.querySelector('.load-text').textContent = text;
  container.appendChild(el);
  return {
    setText(t) { el.querySelector('.load-text').textContent = t; },
    hide() { el.classList.add('hide'); setTimeout(() => el.remove(), 450); },
  };
}

/* ================= 章节管理 ================= */

export function createSections({ nav, descPanel, sections, onSelect }) {
  const buttons = [];
  const body = descPanel.querySelector('.desc-body');
  const headTitle = descPanel.querySelector('.desc-head h2');

  sections.forEach((sec, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chap-btn';
    b.innerHTML = '<span class="chap-n"></span><span class="chap-t"></span>';
    b.querySelector('.chap-n').textContent = String(i + 1).padStart(2, '0');
    b.querySelector('.chap-t').textContent = sec.title;
    b.addEventListener('click', () => select(i));
    nav.appendChild(b);
    buttons.push(b);
  });

  // 说明卡折叠
  const head = descPanel.querySelector('.desc-head');
  head.addEventListener('click', () => descPanel.classList.toggle('collapsed'));

  function select(i) {
    buttons.forEach((b, j) => b.classList.toggle('active', j === i));
    const sec = sections[i];
    headTitle.textContent = sec.title;
    body.innerHTML = sec.html || '';
    descPanel.classList.remove('collapsed');
    body.scrollTop = 0;
    nav.classList.remove('open'); // 移动端抽屉收起
    if (onSelect) onSelect(i, sec);
  }

  return { select, buttons };
}

/* ================= 控制条 UI ================= */

export function createControlsPanel(el) {
  function clear() { el.innerHTML = ''; }
  function sep() {
    const s = document.createElement('span');
    s.className = 'ctl-sep';
    el.appendChild(s);
  }
  function label(text) {
    const l = document.createElement('label');
    l.textContent = text;
    return l;
  }

  function slider({ label: text, min, max, step = 1, value, fmt = (v) => String(v), onInput }) {
    const wrap = document.createElement('div');
    wrap.className = 'ctl';
    wrap.appendChild(label(text));
    const input = document.createElement('input');
    input.type = 'range';
    input.min = min; input.max = max; input.step = step; input.value = value;
    const val = document.createElement('span');
    val.className = 'ctl-val';
    const paint = () => { val.textContent = fmt(parseFloat(input.value)); };
    input.addEventListener('input', () => { paint(); onInput(parseFloat(input.value)); });
    wrap.appendChild(input); wrap.appendChild(val);
    paint();
    el.appendChild(wrap);
    return { el: wrap, set(v) { input.value = v; paint(); }, get() { return parseFloat(input.value); } };
  }

  function toggle({ label: text, value = false, onChange }) {
    const lab = document.createElement('label');
    lab.className = 'ctl-toggle';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = value;
    const track = document.createElement('span');
    track.className = 'track';
    lab.appendChild(input); lab.appendChild(track);
    lab.appendChild(document.createTextNode(text));
    input.addEventListener('change', () => onChange(input.checked));
    el.appendChild(lab);
    return { el: lab, set(v) { input.checked = v; onChange(v); }, get() { return input.checked; } };
  }

  function button({ label: text, active = false, onClick }) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'ctl-btn' + (active ? ' active' : '');
    b.textContent = text;
    b.addEventListener('click', () => onClick(b));
    el.appendChild(b);
    return b;
  }

  function seg({ options, value, onChange }) {
    const btns = [];
    const paint = () => btns.forEach(({ b, v }) => b.classList.toggle('active', v === value));
    options.forEach((opt) => {
      const b = button({
        label: opt.label,
        onClick: () => { value = opt.value; paint(); onChange(value); },
      });
      btns.push({ b, v: opt.value });
    });
    paint();
    return { set(v) { value = v; paint(); onChange(v); } };
  }

  function readout({ label: text, value = '' }) {
    const wrap = document.createElement('div');
    wrap.className = 'ctl';
    wrap.appendChild(label(text));
    const val = document.createElement('span');
    val.className = 'ctl-val';
    val.textContent = value;
    wrap.appendChild(val);
    el.appendChild(wrap);
    return { el: wrap, update(t) { val.textContent = t; } };
  }

  return { el, clear, sep, slider, toggle, button, seg, readout };
}

/* ================= HUD 读数卡 ================= */

export function makeHUD(container, rows) {
  const card = document.createElement('div');
  card.className = 'hud-card';
  const els = {};
  rows.forEach(([key, label]) => {
    const r = document.createElement('div');
    r.className = 'hud-row';
    const l = document.createElement('span');
    l.textContent = label;
    const v = document.createElement('b');
    v.textContent = '–';
    r.appendChild(l); r.appendChild(v);
    card.appendChild(r);
    els[key] = v;
  });
  container.appendChild(card);
  return {
    el: card,
    set(key, text) { if (els[key]) els[key].textContent = text; },
    show(v = true) { card.style.display = v ? '' : 'none'; },
  };
}

/* ================= 文字精灵 / 光晕贴图 ================= */

export function makeTextTexture(text, opts = {}) {
  const fontSize = opts.fontSize || 42;
  const pad = 14;
  const canvas = document.createElement('canvas');
  let ctx = canvas.getContext('2d');
  const font = `600 ${fontSize}px -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif`;
  ctx.font = font;
  const lines = Array.isArray(text) ? text : [text];
  const w = Math.max(...lines.map((l) => ctx.measureText(l).width)) + pad * 2;
  const h = lines.length * fontSize * 1.3 + pad * 1.4;
  canvas.width = Math.ceil(w);
  canvas.height = Math.ceil(h);
  ctx = canvas.getContext('2d');
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (opts.bg) {
    ctx.fillStyle = opts.bg;
    ctx.beginPath();
    ctx.roundRect(4, 4, canvas.width - 8, canvas.height - 8, 14);
    ctx.fill();
  }
  ctx.fillStyle = opts.color || '#ffffff';
  ctx.shadowColor = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur = 6;
  lines.forEach((l, i) => {
    ctx.fillText(l, canvas.width / 2, pad * 0.7 + fontSize * 0.65 + i * fontSize * 1.3);
  });
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return { tex, width: canvas.width, height: canvas.height };
}

export function makeTextSprite(text, opts = {}) {
  const { tex, width, height } = makeTextTexture(text, opts);
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: !opts.alwaysOnTop, depthWrite: false });
  const sprite = new THREE.Sprite(mat);
  const scale = opts.scale || 0.01;
  sprite.scale.set(width * scale, height * scale, 1);
  return sprite;
}

/** 原地更新精灵文字（仅文本变化时重建纹理） */
export function setSpriteText(sprite, text, opts = {}) {
  if (sprite.userData.__text === text) return;
  sprite.userData.__text = text;
  const old = sprite.material.map;
  const { tex, width, height } = makeTextTexture(text, opts);
  sprite.material.map = tex;
  sprite.material.needsUpdate = true;
  if (old) old.dispose();
  const scale = opts.scale || sprite.userData.__scale || 0.01;
  sprite.userData.__scale = scale;
  sprite.scale.set(width * scale, height * scale, 1);
}

/** 径向渐变光晕贴图（太阳辉光、云朵等） */
export function makeGlowTexture(color = '255,240,200', stops = [[0, 'rgba(C,1)'], [0.25, 'rgba(C,0.5)'], [1, 'rgba(C,0)']]) {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  stops.forEach(([p, c]) => g.addColorStop(p, c.replaceAll('C', color)));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/* ================= 几何小工具 ================= */

/** 圆环线（LineLoop），axis: 'x'|'y'|'z' */
export function circleLine(radius, color, segments = 128, axis = 'y') {
  const pts = [];
  for (let i = 0; i < segments; i++) {
    const a = (i / segments) * TAU;
    if (axis === 'y') pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, -Math.sin(a) * radius));
    else if (axis === 'x') pts.push(new THREE.Vector3(0, Math.cos(a) * radius, -Math.sin(a) * radius));
    else pts.push(new THREE.Vector3(Math.cos(a) * radius, Math.sin(a) * radius, 0));
  }
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  return new THREE.LineLoop(geo, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.85 }));
}

/** 星空背景（球壳随机点） */
export function makeStars(radius = 300, count = 2600) {
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < count; i++) {
    const u = Math.random() * 2 - 1;
    const a = Math.random() * TAU;
    const s = Math.sqrt(1 - u * u);
    const r = radius * (0.75 + Math.random() * 0.25);
    pos[i * 3] = s * Math.cos(a) * r;
    pos[i * 3 + 1] = u * r;
    pos[i * 3 + 2] = s * Math.sin(a) * r;
    c.setHSL(0.55 + Math.random() * 0.1, 0.25 + Math.random() * 0.3, 0.75 + Math.random() * 0.25);
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const mat = new THREE.PointsMaterial({
    size: 1.15, sizeAttenuation: false, vertexColors: true,
    transparent: true, opacity: 0.9, depthWrite: false,
  });
  const pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false;
  return pts;
}
