/* EduLab · 化学反应 · 微观世界（reaction）
 * 章节：有效碰撞 / 温度与活化分子 / 催化剂 / 浓度与压强 / 化学平衡的建立 / 平衡移动 / 链式反应 / 随堂检测
 * 场景：微观粒子世界——玻璃反应盒中的彩球原子与哑铃分子（双原子两球一杆），
 *       反应瞬间发光闪烁、产物弹开；麦克斯韦-玻尔兹曼分布与浓度-时间曲线
 *       画在 stage 内 DOM 覆盖卡片的小 canvas 上（右上角，随参数实时重绘）。
 */
import {
  THREE, clamp, TAU,
  loadHDR, loadAll, createApp, cameraTweenTick, makeLoader,
  createSections, createControlsPanel, makeHUD, makeTextSprite, setSpriteText, makeGlowTexture, circleLine,
} from './edu-core.js';

/* ---------------- 本实验专属样式（不改动共享 lab.css） ---------------- */

const style = document.createElement('style');
style.textContent = `
.lab-controls:empty { display: none; }
.rx-toast {
  position: absolute; top: 14px; left: 50%; transform: translate(-50%, -8px);
  z-index: 26; max-width: min(460px, calc(100% - 28px));
  padding: 9px 16px; border-radius: 12px; font-size: 13.5px; line-height: 1.55;
  background: color-mix(in srgb, var(--card) 92%, transparent);
  border: 1px solid var(--card-border); box-shadow: var(--shadow);
  color: var(--text); opacity: 0; pointer-events: none;
  transition: opacity .25s, transform .25s;
}
.rx-toast.show { opacity: 1; transform: translate(-50%, 0); }
.rx-toast.ok { border-color: color-mix(in srgb, #3fa96f 55%, transparent); }
.rx-toast.warn { border-color: color-mix(in srgb, #d98a4f 60%, transparent); }
.rx-chart {
  position: absolute; top: 14px; right: 14px; z-index: 12;
  width: min(330px, calc(100% - 28px));
  border-radius: 14px; overflow: hidden;
  border: 1px solid var(--card-border); box-shadow: var(--shadow);
  background: var(--card);
}
.rx-chart .rx-cv-head {
  display: flex; align-items: center; gap: 8px; padding: 7px 12px;
  font-size: 12.5px; color: var(--text-dim); background: var(--chip-bg);
}
.rx-chart .rx-cv-head b { color: var(--text); white-space: nowrap; }
.rx-chart .rx-cv-head .rx-info {
  margin-left: auto; font-size: 11px; font-variant-numeric: tabular-nums;
  color: var(--text-dim); text-align: right;
}
.rx-chart canvas { position: static; inset: auto; display: block; width: 100%; }
@media (max-width: 760px) {
  .rx-chart { top: 10px; right: 10px; width: 236px; }
  .rx-chart .rx-cv-head { font-size: 11.5px; padding: 6px 10px; }
}
`;
document.head.appendChild(style);

/* ---------------- 纹理（路径已 ls 核对，gas/heat 同款） ---------------- */

const TEX = {
  skyHdr: '../assets/textures/sky/sky_court-BLHJ2ADI.hdr',
};

/* ---------------- 场景 ---------------- */

const stage = document.getElementById('stage');
const loader = makeLoader(stage, '正在搭建微观粒子世界…');

const app = createApp({
  container: stage,
  fov: 42, near: 0.05, far: 80,
  cameraPos: [0.4, 1.0, 5.2],
  target: [0, 0, 0],
  minDistance: 1.1, maxDistance: 14,
  exposure: 1.05,
});
const { scene, camera, controls } = app;

scene.add(new THREE.AmbientLight(0xbcc6d4, 0.6));
const keyLight = new THREE.DirectionalLight(0xfff2e2, 1.5);
keyLight.position.set(3.5, 5, 3);
scene.add(keyLight);
const fillLight = new THREE.DirectionalLight(0xdfe8ff, 0.5);
fillLight.position.set(-4, 3, -2.5);
scene.add(fillLight);

/* 底座平台（随主题换色） */
const platform = new THREE.Mesh(
  new THREE.CylinderGeometry(4.6, 4.6, 0.18, 64),
  new THREE.MeshStandardMaterial({ color: 0xcfd6dd, roughness: 0.92, metalness: 0.02 })
);
platform.position.y = -1.72;
scene.add(platform);
const ring1 = circleLine(3.6, 0x8fa3b8, 96);
ring1.position.y = -1.62; ring1.material.opacity = 0.28;
scene.add(ring1);
const ring2 = circleLine(2.3, 0x8fa3b8, 80);
ring2.position.y = -1.62; ring2.material.opacity = 0.15;
scene.add(ring2);
function paintPlatform(dark) {
  platform.material.color.setHex(dark ? 0x161c25 : 0xcfd6dd);
}
paintPlatform(document.documentElement.getAttribute('data-theme') === 'dark');
window.addEventListener('edulabtheme', (e) => paintPlatform(e.detail.theme === 'dark'));

/* ---------------- 物种表与粒子池 ---------------- */

/* m:1 单球原子；m:0 双原子分子（两球一杆哑铃）；g:1 自由基（发光链载体） */
const KINDS = {
  A:    { m: 1, r: 0.085, c: 0xe0524a },
  B:    { m: 1, r: 0.085, c: 0x3f7fd8 },
  C:    { m: 1, r: 0.085, c: 0x2fa864 },
  inert:{ m: 1, r: 0.072, c: 0x9aa3ad },
  AB:   { m: 0, r: 0.085, c: 0xe0524a, c2: 0x3f7fd8, bc: 0xb9c2cc, len: 0.32 },
  BC:   { m: 0, r: 0.085, c: 0x2fa864, c2: 0x3f7fd8, bc: 0xb9c2cc, len: 0.32 },
  NO2:  { m: 1, r: 0.072, c: 0xc2542e },
  N2O4: { m: 0, r: 0.070, c: 0xd6cec2, c2: 0xd6cec2, bc: 0x9a948c, len: 0.27 },
  H2:   { m: 0, r: 0.060, c: 0xe8e2d6, c2: 0xe8e2d6, bc: 0xb9c2cc, len: 0.21 },
  Cl2:  { m: 0, r: 0.072, c: 0x3fae5a, c2: 0x3fae5a, bc: 0x2f8a48, len: 0.28 },
  HCl:  { m: 0, r: 0.066, c: 0xe8e2d6, c2: 0x3fae5a, bc: 0x8aa89a, len: 0.24 },
  CL:   { m: 1, r: 0.066, c: 0x74e884, g: 1 },
  H:    { m: 1, r: 0.056, c: 0xffd27a, g: 1 },
};

const R = { parts: [], timeScale: 1 };
const ATOM_CAP = 240, BOND_CAP = 120;

const atomMesh = new THREE.InstancedMesh(
  new THREE.SphereGeometry(1, 20, 14),
  new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.32, metalness: 0.08 }),
  ATOM_CAP
);
atomMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
atomMesh.frustumCulled = false;
scene.add(atomMesh);
const bondMesh = new THREE.InstancedMesh(
  new THREE.CylinderGeometry(1, 1, 1, 10),
  new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5, metalness: 0.2 }),
  BOND_CAP
);
bondMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
bondMesh.frustumCulled = false;
scene.add(bondMesh);
/* 预建 instanceColor 缓冲 */
for (let i = 0; i < ATOM_CAP; i++) atomMesh.setColorAt(i, new THREE.Color(1, 1, 1));
for (let i = 0; i < BOND_CAP; i++) bondMesh.setColorAt(i, new THREE.Color(1, 1, 1));

function rUnit(v) {
  v.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);
  if (v.lengthSq() < 1e-6) v.set(0, 1, 0);
  return v.normalize();
}
function gauss() {
  let u = 0, v = 0;
  while (!u) u = Math.random();
  while (!v) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v);
}

function applyKind(p, kind) {
  const d = KINDS[kind];
  p.kind = kind; p.mono = !!d.m; p.r = d.r;
  p.base.setHex(d.c);
  p.base2.setHex(d.c2 || d.c);
  p.bc.setHex(d.bc || 0xb9c2cc);
  p.len = d.len || 0;
  p.glow = !!d.g;
  p.heat = 0; p.squash = 0; p.ads = 0;
  return p;
}

function makeParticle(kind, x, y, z) {
  const p = {
    kind, mono: true, r: 0.08, len: 0,
    base: new THREE.Color(), base2: new THREE.Color(), bc: new THREE.Color(),
    p: new THREE.Vector3(x, y, z), v: new THREE.Vector3(),
    ax: rUnit(new THREE.Vector3()),
    spinAx: rUnit(new THREE.Vector3()), spinW: 0.7 + Math.random() * 1.5,
    flash: 0, cool: 0, dead: false, heat: 0, glow: false, squash: 0, ads: 0,
    gen: 0, ph: Math.random() * TAU,
  };
  applyKind(p, kind);
  R.parts.push(p);
  return p;
}

function sweepList(arr) {
  for (let i = arr.length - 1; i >= 0; i--) if (arr[i].dead) arr.splice(i, 1);
}

/* ---------------- 渲染：实例矩阵填充 ---------------- */

const _m4 = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _s = new THREE.Vector3();
const _c = new THREE.Color();
const _bc = new THREE.Color();
const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _v3 = new THREE.Vector3();
const _v4 = new THREE.Vector3();
const IDQ = new THREE.Quaternion();
const YUP = new THREE.Vector3(0, 1, 0);
const WARM = new THREE.Color(0xffa040);
const WHITE = new THREE.Color(0xffffff);

function renderParts(time) {
  let ai = 0, bi = 0;
  for (const p of R.parts) {
    if (p.dead) continue;
    if (p.mono) {
      _c.copy(p.base);
      if (p.heat > 0) _c.lerp(WARM, p.heat);
      if (p.glow) _c.lerp(WHITE, 0.22 + 0.18 * Math.sin(time * 9 + p.ph));
      if (p.flash > 0) _c.lerp(WHITE, Math.min(1, p.flash * 1.3));
      const pop = (p.flash > 0 ? p.flash * 0.45 : 0) + (p.glow ? 0.05 * Math.sin(time * 9 + p.ph) : 0);
      _s.set(p.r * (1 + pop), p.r * (1 + pop) * (p.squash > 0 ? p.squash : 1), p.r * (1 + pop));
      _m4.compose(p.p, IDQ, _s);
      atomMesh.setMatrixAt(ai, _m4);
      atomMesh.setColorAt(ai, _c);
      ai++;
    } else {
      const h = p.len / 2 - p.r * 0.35;
      const pop = p.flash > 0 ? p.flash * 0.4 : 0;
      const rr = p.r * (1 + pop);
      _v1.copy(p.ax).multiplyScalar(h).add(p.p);
      _v2.copy(p.ax).multiplyScalar(-h).add(p.p);
      _s.setScalar(rr);
      _m4.compose(_v1, IDQ, _s);
      atomMesh.setMatrixAt(ai, _m4);
      atomMesh.setColorAt(ai, _c.copy(p.base));
      ai++;
      _m4.compose(_v2, IDQ, _s);
      atomMesh.setMatrixAt(ai, _m4);
      atomMesh.setColorAt(ai, _c.copy(p.base2));
      ai++;
      _q.setFromUnitVectors(YUP, p.ax);
      _s.set(p.r * 0.24, p.len - p.r * 1.1, p.r * 0.24);
      _m4.compose(p.p, _q, _s);
      bondMesh.setMatrixAt(bi, _m4);
      bondMesh.setColorAt(bi, _bc.copy(p.bc));
      bi++;
    }
  }
  _m4.makeScale(1e-4, 1e-4, 1e-4);
  for (; ai < ATOM_CAP; ai++) atomMesh.setMatrixAt(ai, _m4);
  for (; bi < BOND_CAP; bi++) bondMesh.setMatrixAt(bi, _m4);
  atomMesh.instanceMatrix.needsUpdate = true;
  bondMesh.instanceMatrix.needsUpdate = true;
  if (atomMesh.instanceColor) atomMesh.instanceColor.needsUpdate = true;
  if (bondMesh.instanceColor) bondMesh.instanceColor.needsUpdate = true;
}

/* ---------------- 闪光与浮字 ---------------- */

const flashes = [];
for (let i = 0; i < 12; i++) {
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeGlowTexture('255,240,190', [[0, 'rgba(C,0.95)'], [0.3, 'rgba(C,0.5)'], [1, 'rgba(C,0)']]),
    blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0,
  }));
  sp.visible = false;
  scene.add(sp);
  flashes.push({ sp, t: 1, dur: 0.5, s0: 0.5 });
}
function flash(x, y, z, color = 0xffe9a8, scale = 0.5, dur = 0.5) {
  const f = flashes.find((q) => q.t >= 1) || flashes[0];
  f.t = 0; f.dur = dur; f.s0 = scale;
  f.sp.visible = true;
  f.sp.position.set(x, y, z);
  f.sp.material.color.set(color);
}

const labels = [];
for (let i = 0; i < 5; i++) {
  const sp = makeTextSprite(' ', { fontSize: 34, color: '#fff', bg: 'rgba(13,18,26,0.78)', scale: 0.0042 });
  sp.visible = false;
  scene.add(sp);
  labels.push({ sp, t: 1 });
}
function label(text, x, y, z, color = '#ffffff') {
  const l = labels.find((q) => q.t >= 1) || labels[0];
  setSpriteText(l.sp, text, { fontSize: 34, color, bg: 'rgba(13,18,26,0.78)', scale: 0.0042 });
  l.sp.visible = true;
  l.sp.position.set(x, y, z);
  l.t = 0;
}

function updateFx(dt) {
  for (const p of R.parts) {
    if (p.flash > 0) p.flash = Math.max(0, p.flash - dt * 1.8);
  }
  for (const f of flashes) {
    if (f.t < 1) {
      f.t = Math.min(1, f.t + dt / f.dur);
      f.sp.material.opacity = (1 - f.t) * 0.95;
      const s = f.s0 * (0.5 + f.t * 0.9);
      f.sp.scale.set(s, s, 1);
      if (f.t >= 1) f.sp.visible = false;
    }
  }
  for (const l of labels) {
    if (l.t < 1) {
      l.t = Math.min(1, l.t + dt / 1.5);
      l.sp.material.opacity = l.t < 0.12 ? l.t / 0.12 : Math.max(0, 1 - (l.t - 0.12) / 0.88);
      l.sp.position.y += dt * 0.16;
      if (l.t >= 1) l.sp.visible = false;
    }
  }
}

/* ---------------- 玻璃盒 / 活塞 ---------------- */

function stdMat(o) { return new THREE.MeshStandardMaterial(o); }
const metalMat = stdMat({ color: 0x454b52, roughness: 0.42, metalness: 0.78 });
function glassMat(op = 0.09) {
  return new THREE.MeshPhysicalMaterial({
    color: 0xb9d2e2, metalness: 0, roughness: 0.05, transparent: true, opacity: op,
    envMapIntensity: 0.5, clearcoat: 0.6, side: THREE.DoubleSide, depthWrite: false,
  });
}

function makeGlassBox(g, opts) {
  const w = opts.w, h = opts.h, d = opts.d;
  const glass = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), glassMat(opts.op));
  glass.position.set(opts.cx || 0, opts.cy || 0, opts.cz || 0);
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(glass.geometry),
    new THREE.LineBasicMaterial({ color: 0x7f95a8, transparent: true, opacity: 0.55 })
  );
  edges.position.copy(glass.position);
  g.add(glass, edges);
  const info = {
    min: new THREE.Vector3((opts.cx || 0) - w / 2, (opts.cy || 0) - h / 2, (opts.cz || 0) - d / 2),
    max: new THREE.Vector3((opts.cx || 0) + w / 2, (opts.cy || 0) + h / 2, (opts.cz || 0) + d / 2),
    glass, edges,
  };
  if (opts.tint) {
    const tint = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial({ color: 0xa83818, transparent: true, opacity: 0, depthWrite: false })
    );
    g.add(tint);
    info.tint = tint;
  }
  return info;
}

function makePiston(g, box, h, d) {
  const gp = new THREE.Group();
  const slab = new THREE.Mesh(
    new THREE.BoxGeometry(0.07, h - 0.08, d - 0.08),
    stdMat({ color: 0x59616c, roughness: 0.35, metalness: 0.8 })
  );
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.62, 12), metalMat);
  rod.rotation.z = Math.PI / 2;
  rod.position.x = 0.34;
  const knob = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09, 0.09, 0.05, 16),
    stdMat({ color: 0x3a3f47, roughness: 0.5, metalness: 0.6 })
  );
  knob.rotation.z = Math.PI / 2;
  knob.position.x = 0.67;
  gp.add(slab, rod, knob);
  g.add(gp);
  const minX = box.min.x + 0.05;
  const full = box.max.x - 0.12 - minX;
  const st = {
    gp, face: minX + 0.12 + full, target: minX + 0.12 + full, minX, full,
    setVol(v) { this.target = this.minX + 0.12 + this.full * clamp(v, 0.35, 1); },
    vol() { return (this.face - this.minX - 0.12) / this.full; },
    update(dt) {
      this.face += (this.target - this.face) * Math.min(1, dt * 3.5);
      gp.position.x = this.face;
    },
  };
  gp.position.x = st.face;
  return st;
}

/* ---------------- 气体引擎 ---------------- */

function setBoxSpeeds(parts, s0) {
  const k = s0 / Math.sqrt(3);
  for (const p of parts) p.v.set(gauss(), gauss(), gauss()).multiplyScalar(k);
}
function randPosIn(S, out) {
  out.set(
    S.min.x + 0.15 + Math.random() * (S.max.x - S.min.x - 0.3),
    S.min.y + 0.15 + Math.random() * (S.max.y - S.min.y - 0.3),
    S.min.z + 0.15 + Math.random() * (S.max.z - S.min.z - 0.3)
  );
  return out;
}

function stepGas(S, dt, onWall) {
  for (const p of S.parts) {
    if (p.dead) continue;
    p.p.addScaledVector(p.v, dt);
    if (!p.mono) p.ax.applyAxisAngle(p.spinAx, p.spinW * dt).normalize();
    if (p.cool > 0) p.cool -= dt;
    const r = p.r;
    let hit = false;
    if (p.p.x < S.min.x + r) { p.p.x = S.min.x + r; p.v.x = Math.abs(p.v.x); hit = true; }
    else if (p.p.x > S.max.x - r) { p.p.x = S.max.x - r; p.v.x = -Math.abs(p.v.x); hit = true; }
    if (p.p.y < S.min.y + r) { p.p.y = S.min.y + r; p.v.y = Math.abs(p.v.y); hit = true; }
    else if (p.p.y > S.max.y - r) { p.p.y = S.max.y - r; p.v.y = -Math.abs(p.v.y); hit = true; }
    if (p.p.z < S.min.z + r) { p.p.z = S.min.z + r; p.v.z = Math.abs(p.v.z); hit = true; }
    else if (p.p.z > S.max.z - r) { p.p.z = S.max.z - r; p.v.z = -Math.abs(p.v.z); hit = true; }
    if (hit) { S.wall++; if (onWall) onWall(p); }
  }
}

function pairScan(parts, fn) {
  for (let i = 0; i < parts.length; i++) {
    const a = parts[i];
    if (a.dead) continue;
    for (let j = i + 1; j < parts.length; j++) {
      const b = parts[j];
      if (b.dead || a.dead) continue;
      const dx = a.p.x - b.p.x, dy = a.p.y - b.p.y, dz = a.p.z - b.p.z;
      const rr = a.r + b.r + 0.02;
      if (dx * dx + dy * dy + dz * dz > rr * rr) continue;
      if (a.cool > 0 || b.cool > 0) continue;
      a.cool = b.cool = 0.15;
      if (fn(a, b) === false) a.cool = b.cool = 0;
    }
  }
}

function elastic(a, b) {
  _v1.subVectors(b.p, a.p);
  const d = _v1.length() || 0.001;
  _v1.divideScalar(d);
  _v2.subVectors(a.v, b.v);
  const rel = _v2.dot(_v1);
  if (rel > 0) {
    a.v.addScaledVector(_v1, -rel);
    b.v.addScaledVector(_v1, rel);
  }
  const overlap = (a.r + b.r + 0.02) - d;
  if (overlap > 0) {
    a.p.addScaledVector(_v1, -overlap / 2);
    b.p.addScaledVector(_v1, overlap / 2);
  }
}

/* ---------------- 图表：调色 / 画布 / MB 分布 / 时间序列 ---------------- */

let palCache = null;
function pal() {
  if (palCache) return palCache;
  const cs = getComputedStyle(document.documentElement);
  const g = (n, fb) => (cs.getPropertyValue(n) || fb).trim();
  palCache = {
    text: g('--text', '#2a3441'), dim: g('--text-dim', '#66717e'),
    accent: g('--accent', '#e8674a'), border: g('--card-border', 'rgba(20,32,44,0.09)'),
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

function makeChart(title, h) {
  const el = document.createElement('div');
  el.className = 'rx-chart';
  el.style.display = 'none';
  const head = document.createElement('div');
  head.className = 'rx-cv-head';
  const b = document.createElement('b');
  b.textContent = title;
  const info = document.createElement('span');
  info.className = 'rx-info';
  head.appendChild(b);
  head.appendChild(info);
  const cv = document.createElement('canvas');
  el.appendChild(head);
  el.appendChild(cv);
  stage.appendChild(el);
  return { el, cv, info, show(v) { el.style.display = v ? '' : 'none'; } };
}
const mbChart = makeChart('麦克斯韦-玻尔兹曼分布', 192);
const tChart = makeChart('浓度-时间曲线', 240);

/* MB 分布：f(v) 正比 v^2 exp(-v^2/2sig^2)，sig = 297*sqrt(T/300)（峰值速率 sqrt(2)*sig 约 420 m/s @300K） */
function drawMB() {
  const cfg = mbChart.cfg || {};
  const { ctx, W, H } = prepCanvas(mbChart.cv, 192);
  const P = pal();
  const L = 34, Rp = 10, T = 12, B = 18, pw = W - L - Rp, ph = H - T - B, VMAX = 2000;
  const X = (v) => L + (v / VMAX) * pw;
  const Y = (f) => T + (1 - f) * ph;
  const sig = 297 * Math.sqrt((cfg.T || 300) / 300);
  const fmax = 2 * sig * sig * Math.E;
  const F = (v) => Math.min(1, (v * v * Math.exp(-v * v / (2 * sig * sig))) / fmax);
  ctx.strokeStyle = P.border;
  ctx.fillStyle = P.dim;
  ctx.lineWidth = 1;
  ctx.font = FONT;
  ctx.textAlign = 'right';
  [0, 0.5, 1].forEach((f) => {
    const y = Y(f);
    ctx.globalAlpha = 0.45;
    ctx.beginPath(); ctx.moveTo(L, y); ctx.lineTo(L + pw, y); ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillText(Math.round(f * 100) + '%', L - 4, y + 3);
  });
  ctx.textAlign = 'center';
  for (let v = 0; v <= VMAX; v += 500) ctx.fillText(v === 0 ? '0' : (v / 1000) + 'k', X(v), H - 5);
  ctx.strokeRect(L, T, pw, ph);
  if (cfg.showRef) {
    const sr = 297, srf = 2 * sr * sr * Math.E;
    ctx.save();
    ctx.setLineDash([5, 4]); ctx.strokeStyle = P.dim; ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let v = 0; v <= VMAX; v += 25) {
      const y = Y(Math.min(1, (v * v * Math.exp(-v * v / (2 * sr * sr))) / srf));
      if (v) ctx.lineTo(X(v), y); else ctx.moveTo(X(v), y);
    }
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = P.dim; ctx.textAlign = 'left';
    ctx.fillText('300K', X(1050), Y(Math.min(1, (1050 * 1050 * Math.exp(-1050 * 1050 / (2 * sr * sr))) / srf)) - 4);
  }
  const eas = [{ va: cfg.va || 900, c: P.accent, a: 0.15, lab: 'Ea' }];
  if (cfg.cat) eas.unshift({ va: (cfg.va || 900) * 0.6, c: '#2fa864', a: 0.17, lab: 'Ea(催)' });
  for (const ea of eas) {
    ctx.beginPath();
    ctx.moveTo(X(ea.va), Y(0));
    for (let v = ea.va; v <= VMAX; v += 25) ctx.lineTo(X(v), Y(F(v)));
    ctx.lineTo(X(VMAX), Y(0));
    ctx.closePath();
    ctx.globalAlpha = ea.a;
    ctx.fillStyle = ea.c;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.save();
    ctx.setLineDash([4, 3]); ctx.strokeStyle = ea.c; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(X(ea.va), Y(0)); ctx.lineTo(X(ea.va), Y(0.92)); ctx.stroke();
    ctx.restore();
    ctx.fillStyle = ea.c; ctx.textAlign = 'left'; ctx.font = FONTB;
    ctx.fillText(ea.lab, X(ea.va) + 4, T + 10);
  }
  ctx.strokeStyle = P.accent;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let v = 0; v <= VMAX; v += 25) {
    const y = Y(F(v));
    if (v) ctx.lineTo(X(v), y); else ctx.moveTo(X(v), y);
  }
  ctx.stroke();
  ctx.fillStyle = P.dim; ctx.textAlign = 'right'; ctx.font = FONT;
  ctx.fillText('v/(m/s)', L + pw - 2, H - 5);
}

/* 活化分子比例：Ea 滑杆值(0.8~2.4) 映射速率阈值 va = Ea*750 m/s，数值积分 */
function mbFrac(va, T) {
  const sig = 297 * Math.sqrt(T / 300);
  let tot = 0, act = 0;
  for (let v = 0; v < 2400; v += 6) {
    const f = v * v * Math.exp(-v * v / (2 * sig * sig));
    tot += f;
    if (v >= va) act += f;
  }
  return act / tot;
}

/* 时间序列面板 */
function panel(ctx, px, py, pw, ph, o) {
  const P = pal();
  const L = 30, Rp = 8, T = 12, B = 15;
  const iw = pw - L - Rp, ih = ph - T - B;
  const x0 = px + L, y0 = py + T;
  const X = (t) => x0 + (t / o.xMax) * iw;
  const Y = (v) => y0 + (1 - (v - o.yMin) / (o.yMax - o.yMin)) * ih;
  ctx.strokeStyle = P.border;
  ctx.fillStyle = P.dim;
  ctx.lineWidth = 1;
  ctx.font = FONT;
  ctx.textAlign = 'right';
  for (let i = 0; i <= 2; i++) {
    const v = o.yMin + ((o.yMax - o.yMin) * i) / 2, y = Y(v);
    ctx.globalAlpha = 0.45;
    ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 + iw, y); ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillText(o.yFmt ? o.yFmt(v) : v.toFixed(1), x0 - 4, y + 3);
  }
  ctx.textAlign = 'center';
  const xs = o.xStep || Math.max(5, Math.ceil(o.xMax / 4 / 5) * 5);
  for (let t = 0; t <= o.xMax + 1e-6; t += xs) ctx.fillText(Math.round(t) + 's', X(t), y0 + ih + 12);
  ctx.strokeRect(x0, y0, iw, ih);
  (o.events || []).forEach((ev) => {
    if (ev.t < 0 || ev.t > o.xMax) return;
    ctx.save();
    ctx.setLineDash([4, 3]); ctx.strokeStyle = ev.c; ctx.globalAlpha = 0.7;
    ctx.beginPath(); ctx.moveTo(X(ev.t), y0); ctx.lineTo(X(ev.t), y0 + ih); ctx.stroke();
    ctx.restore();
    ctx.fillStyle = ev.c; ctx.textAlign = 'left'; ctx.font = FONTB;
    ctx.fillText(ev.lab, X(ev.t) + 3, y0 + 9);
  });
  (o.series || []).forEach((s) => {
    if (s.pts.length < 2) return;
    ctx.strokeStyle = s.c;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    let started = false;
    for (const pt of s.pts) {
      if (pt[0] < 0) continue;
      const x = X(pt[0]), y = Y(pt[1]);
      if (started) ctx.lineTo(x, y); else { ctx.moveTo(x, y); started = true; }
    }
    ctx.stroke();
  });
  let lx = x0 + 6;
  ctx.textAlign = 'left';
  ctx.font = FONT;
  (o.series || []).forEach((s) => {
    ctx.fillStyle = s.c;
    ctx.fillRect(lx, y0 - 8, 9, 3);
    ctx.fillStyle = P.dim;
    ctx.fillText(s.label, lx + 12, y0 - 4);
    lx += 16 + ctx.measureText(s.label).width;
  });
}

/* ---------------- HUD / 提示 ---------------- */

const hudWrap = document.createElement('div');
hudWrap.className = 'lab-hud';
stage.appendChild(hudWrap);
const hud1 = makeHUD(hudWrap, [['tot', '碰撞总数'], ['eff', '有效碰撞'], ['ori', '取向合适率']]);
const hud3 = makeHUD(hudWrap, [['a', '无催化剂反应'], ['b', '有催化剂反应'], ['t', '对照剩余']]);
const hud4 = makeHUD(hudWrap, [['col', '壁面碰撞频率'], ['eff', '有效碰撞频率'], ['n', '分子数 · 体积']]);
const hud7 = makeHUD(hudWrap, [['rad', '链载体数'], ['hcl', 'HCl 生成'], ['gen', '代数']]);

let toastTimer = null;
function toast(text, kind = '') {
  let el = stage.querySelector('.rx-toast');
  if (!el) {
    el = document.createElement('div');
    el.className = 'rx-toast';
    stage.appendChild(el);
  }
  el.textContent = text;
  el.className = 'rx-toast show' + (kind ? ' ' + kind : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 4200);
}
function hideToast() {
  const el = stage.querySelector('.rx-toast');
  if (el) el.classList.remove('show');
}

let legendEl = null;
function setLegend(rows) {
  if (!rows) {
    if (legendEl) { legendEl.remove(); legendEl = null; }
    return;
  }
  if (!legendEl) {
    legendEl = document.createElement('div');
    legendEl.className = 'legend';
    stage.appendChild(legendEl);
  }
  legendEl.innerHTML = '';
  for (const row of rows) {
    const r = document.createElement('div');
    r.className = 'lg-row';
    const sw = document.createElement('span');
    sw.className = 'sw dot';
    sw.style.background = row[0];
    r.appendChild(sw);
    r.appendChild(document.createTextNode(row[1]));
    legendEl.appendChild(r);
  }
}

/* ---------------- 章节注册与帧循环 ---------------- */

const ctl = createControlsPanel(document.getElementById('controls'));
const CHG = [];
const UPD = {};
let cur = -1;
let activeSectionCleanup = null;

function hideAll() {
  CHG.forEach((g) => { g.visible = false; });
  mbChart.show(false);
  tChart.show(false);
  [hud1, hud3, hud4, hud7].forEach((h) => { h.el.style.display = 'none'; });
  setLegend(null);
  hideToast();
  app.setPaused(false);
  R.timeScale = 1;
  R.parts.length = 0;
  cur = -1;
}

app.onFrame((dtRaw, time) => {
  cameraTweenTick(app, dtRaw);
  const dt = Math.min(dtRaw, 0.05) * R.timeScale;
  updateFx(Math.min(dtRaw, 0.05));
  if (cur >= 0 && UPD[cur]) UPD[cur](dt, Math.min(dtRaw, 0.05), time);
  renderParts(time);
});

/* ================= 章节 1 · 有效碰撞 ================= */
/* 模型：AB + C -> A + BC（置换型）。取向正确 = C 沿 A-B 键轴方向撞向 A 端；
 * 能量 >= Ea 且取向正确才反应；E < Ea 一律弹回（能量不足）。 */

const st1 = {
  g: new THREE.Group(),
  E: 1.2, Ea: 1.0,
  total: 0, eff: 0, ok: 0,
  auto: false, phase: 'idle', t: 0, wait: 0, mode: 'good',
  C: null, AB: null,
};
scene.add(st1.g);
CHG.push(st1.g);
{
  const zone = circleLine(1.5, 0x7f95a8, 72);
  zone.material.opacity = 0.3;
  st1.g.add(zone);
  const zone2 = circleLine(0.85, 0x7f95a8, 64);
  zone2.material.opacity = 0.14;
  st1.g.add(zone2);
}

function collide1() {
  const S = st1;
  R.parts.length = 0;
  S.AB = makeParticle('AB', 0, 0, 0);
  rUnit(S.AB.ax);
  const roll = Math.random();
  S.mode = roll < 0.34 ? 'good' : roll < 0.67 ? 'end' : 'side';
  const ax = S.AB.ax;
  const dir = _v3;
  if (S.mode === 'good') dir.copy(ax);
  else if (S.mode === 'end') dir.copy(ax).multiplyScalar(-1);
  else {
    dir.crossVectors(ax, Math.abs(ax.y) < 0.9 ? YUP : _v4.set(1, 0, 0)).normalize();
    dir.addScaledVector(ax, (Math.random() - 0.5) * 0.6);
  }
  _v1.crossVectors(dir, Math.abs(dir.y) < 0.9 ? YUP : _v4.set(1, 0, 0)).normalize();
  dir.addScaledVector(_v1, (Math.random() - 0.5) * 0.16).normalize();
  const speed = 1.1 + 1.2 * S.E;
  S.C = makeParticle('C', dir.x * 2.7, dir.y * 2.7, dir.z * 2.7);
  S.C.v.copy(dir).multiplyScalar(-speed);
  S.phase = 'approach';
}

function resolve1() {
  const S = st1;
  S.total++;
  if (S.mode === 'good') S.ok++;
  const cp = S.C.p;
  if (S.E < S.Ea) {
    S.C.v.multiplyScalar(-0.75);
    S.AB.v.copy(S.C.v).multiplyScalar(-0.12);
    label(S.mode === 'good' ? '能量不足：E < Ea，弹回' : '能量不足 · 取向不合', cp.x, cp.y + 0.32, cp.z, '#ffb14a');
    flash(cp.x, cp.y, cp.z, 0xffb14a, 0.5);
    S.phase = 'result';
    S.t = 0;
    return;
  }
  if (S.mode === 'good') {
    S.eff++;
    flash(0, 0, 0, 0xffe9a8, 1.15);
    label('有效碰撞：生成 A + BC', 0, 0.6, 0, '#7ee2a0');
    const half = S.AB.len / 2 - S.AB.r * 0.35;
    _v1.copy(S.AB.ax).multiplyScalar(half);
    _v2.crossVectors(S.AB.ax, YUP);
    if (_v2.lengthSq() < 1e-4) _v2.set(1, 0, 0);
    _v2.normalize();
    S.AB.dead = true;
    S.C.dead = true;
    const pa = makeParticle('A', _v1.x, _v1.y, _v1.z);
    pa.v.copy(S.AB.ax).multiplyScalar(1.35).addScaledVector(_v2, 0.3);
    const bc = makeParticle('BC', -_v1.x * 0.5, -_v1.y * 0.5, -_v1.z * 0.5);
    bc.ax.copy(S.AB.ax);
    bc.v.copy(S.AB.ax).multiplyScalar(-1.0).addScaledVector(_v2, -0.3);
  } else {
    S.C.v.multiplyScalar(-0.75);
    S.AB.v.copy(S.C.v).multiplyScalar(-0.15);
    label('取向不合，弹开', cp.x, cp.y + 0.32, cp.z, '#ffb14a');
    flash(cp.x, cp.y, cp.z, 0x9fb8d8, 0.45);
  }
  S.phase = 'result';
  S.t = 0;
}

UPD[0] = (dt) => {
  const S = st1;
  if (S.phase === 'approach' && S.C) {
    S.C.p.addScaledVector(S.C.v, dt);
    const half = S.AB.len / 2 - S.AB.r * 0.35;
    _v1.copy(S.AB.ax).multiplyScalar(half);
    _v2.copy(S.AB.ax).multiplyScalar(-half);
    const dA = _v1.distanceTo(S.C.p);
    const dB = _v2.distanceTo(S.C.p);
    if (dA < S.C.r + S.AB.r + 0.02 || dB < S.C.r + S.AB.r + 0.02) resolve1();
  } else if (S.phase === 'result') {
    S.t += dt;
    for (const p of R.parts) p.p.addScaledVector(p.v, dt);
    if (S.t > 1.15) {
      S.phase = 'idle';
      S.wait = 0.5;
      sweepList(R.parts);
    }
  } else if (S.auto) {
    S.wait -= dt;
    if (S.wait <= 0) collide1();
  }
  hud1.set('tot', String(S.total));
  hud1.set('eff', String(S.eff));
  hud1.set('ori', S.total ? Math.round((S.ok / S.total) * 100) + '%' : '—');
};

/* ================= 章节 2 · 温度与活化分子 ================= */

const st2 = { g: new THREE.Group(), T: 300, Tt: 300, Ea: 1.2, showRef: false };
scene.add(st2.g);
CHG.push(st2.g);
st2.box = makeGlassBox(st2.g, { w: 3.0, h: 1.7, d: 2.0 });
const S2 = { parts: R.parts, min: st2.box.min, max: st2.box.max, wall: 0, s0: 0.62 };

UPD[1] = (dt) => {
  const S = st2;
  if (Math.abs(S.Tt - S.T) > 0.5) {
    const f = Math.sqrt(S.Tt / S.T);
    for (const p of R.parts) p.v.multiplyScalar(f);
    S.T = S.Tt;
    S2.s0 = 0.62 * Math.sqrt(S.T / 300);
  }
  stepGas(S2, dt);
  pairScan(R.parts, (a, b) => { elastic(a, b); });
  for (const p of R.parts) {
    const sp = p.v.length();
    p.heat = Math.min(1, (sp / (S2.s0 * 2.1)) * (sp / (S2.s0 * 2.1))) * 0.9;
  }
  const va = S.Ea * 750;
  mbChart.cfg = { T: S.T, va, showRef: S.showRef, cat: false };
  drawMB();
  mbChart.info.textContent = Math.round(S.T) + ' K · v≥Ea：' + (mbFrac(va, S.T) * 100).toFixed(1) + '%';
};

/* ================= 章节 3 · 催化剂 ================= */
/* 上盒无催化剂（对照）、下盒有催化剂表面：分子撞上表面被吸附（贴附+压扁=键削弱），
 * 更容易越过低势垒（Ea 降为 0.6Ea）完成 A+B->AB 后脱附；计时 10 s 对照。 */

const st3 = {
  g: new THREE.Group(),
  T: 300, Tt: 300, cat: true, runT: 0, cTop: 0, cBot: 0, Ea: 1.2,
};
scene.add(st3.g);
CHG.push(st3.g);
st3.top = makeGlassBox(st3.g, { w: 3.0, h: 1.25, d: 2.0, cy: 1.05 });
st3.bot = makeGlassBox(st3.g, { w: 3.0, h: 1.25, d: 2.0, cy: -0.55 });
{
  const plate = new THREE.Mesh(
    new THREE.BoxGeometry(2.72, 0.07, 1.72),
    stdMat({ color: 0xb0a48e, roughness: 0.4, metalness: 0.7, emissive: 0x2a2114, emissiveIntensity: 0.4 })
  );
  plate.position.y = st3.bot.min.y + 0.06;
  st3.g.add(plate);
  st3.plate = plate;
  const lt = makeTextSprite('无催化剂（对照）', { fontSize: 26, color: '#c9ccd2', scale: 0.003 });
  lt.position.set(-2.1, 1.05, 0);
  st3.g.add(lt);
  const lb = makeTextSprite('有催化剂表面', { fontSize: 26, color: '#e8c88a', scale: 0.003 });
  lb.position.set(-2.1, -0.55, 0);
  st3.g.add(lb);
}
const S3T = { parts: [], min: st3.top.min, max: st3.top.max, wall: 0, s0: 0.62 };
const S3B = { parts: [], min: st3.bot.min, max: st3.bot.max, wall: 0, s0: 0.62 };

function fillBox3(list, S) {
  for (let i = 0; i < 16; i++) {
    const pa = makeParticle('A', 0, 0, 0);
    randPosIn(S, pa.p);
    const pb = makeParticle('B', 0, 0, 0);
    randPosIn(S, pb.p);
    list.push(pa, pb);
  }
  setBoxSpeeds(list, S.s0);
}
function resetBoxes3() {
  R.parts.length = 0;
  S3T.parts.length = 0;
  S3B.parts.length = 0;
  fillBox3(S3T.parts, S3T);
  fillBox3(S3B.parts, S3B);
}

function tryReact3(a, b, cat) {
  if ((a.kind !== 'A' && a.kind !== 'B') || (b.kind !== 'A' && b.kind !== 'B') || a.kind === b.kind) {
    elastic(a, b);
    return;
  }
  const s0 = 0.62 * Math.sqrt(st3.T / 300);
  const q2 = _v1.subVectors(a.v, b.v).lengthSq() / (s0 * s0);
  const adsorbed = cat && (a.ads > 0 || b.ads > 0);
  const pr = adsorbed ? 0.85 : clamp((q2 - 4) * 0.5, 0, 0.7);
  if (Math.random() < pr) {
    a.dead = b.dead = true;
    const m = makeParticle('AB', (a.p.x + b.p.x) / 2, (a.p.y + b.p.y) / 2, (a.p.z + b.p.z) / 2);
    m.v.copy(a.v).add(b.v).multiplyScalar(0.5);
    if (adsorbed) m.v.set((Math.random() - 0.5) * 0.3, 0.9 + Math.random() * 0.4, (Math.random() - 0.5) * 0.3);
    flash(m.p.x, m.p.y, m.p.z, 0xffe9a8, 0.5);
    if (cat) st3.cBot++; else st3.cTop++;
  } else {
    elastic(a, b);
  }
}

UPD[2] = (dt, rdt) => {
  const S = st3;
  if (Math.abs(S.Tt - S.T) > 0.5) {
    const f = Math.sqrt(S.Tt / S.T);
    S.T = S.Tt;
    S3T.s0 = S3B.s0 = 0.62 * Math.sqrt(S.T / 300);
    for (const p of R.parts) p.v.multiplyScalar(f);
  }
  stepGas(S3T, dt);
  stepGas(S3B, dt);
  if (S.cat) {
    for (const p of S3B.parts) {
      if (p.mono && p.ads <= 0 && p.p.y < S3B.min.y + 0.24 && Math.random() < dt * 5) {
        p.ads = 0.6 + Math.random() * 0.7;
        p.v.set(0, 0, 0);
      }
      if (p.ads > 0) {
        p.ads -= dt;
        p.v.set(0, 0, 0);
        p.p.y = Math.max(p.p.y, S3B.min.y + p.r * 0.55);
        p.squash = 0.55;
        for (const q of S3B.parts) {
          if (q !== p && q.ads <= 0 && q.kind !== p.kind && (q.kind === 'A' || q.kind === 'B') && q.p.distanceToSquared(p.p) < 0.36) {
            _v1.subVectors(p.p, q.p).normalize();
            q.v.addScaledVector(_v1, dt * 2.2);
          }
        }
        if (p.ads <= 0) {
          p.squash = 0;
          p.v.set((Math.random() - 0.5) * 0.4, 0.9 + Math.random() * 0.5, (Math.random() - 0.5) * 0.4);
        }
      } else if (p.squash > 0) {
        p.squash = 0;
      }
    }
  }
  pairScan(S3T.parts, (a, b) => { tryReact3(a, b, false); });
  pairScan(S3B.parts, (a, b) => { tryReact3(a, b, S.cat); });
  if (S.runT > 0) {
    S.runT -= rdt;
    if (S.runT <= 0) {
      S.runT = 0;
      const ratio = st3.cTop > 0 ? (st3.cBot / st3.cTop) : 0;
      toast('对照结束（10 s）：无催化剂 ' + st3.cTop + ' 次 · 有催化剂 ' + st3.cBot + ' 次' +
        (st3.cTop > 0 && ratio >= 1 ? '，催化后约 ' + (Math.round(ratio * 10) / 10) + ' 倍' : ''), 'ok');
    }
  }
  sweepList(S3T.parts);
  sweepList(S3B.parts);
  sweepList(R.parts);
  hud3.set('a', String(st3.cTop));
  hud3.set('b', String(st3.cBot));
  hud3.set('t', S.runT > 0 ? S.runT.toFixed(1) + ' s' : '—');
  const va = S.Ea * 750;
  mbChart.cfg = { T: S.T, va, showRef: false, cat: S.cat };
  drawMB();
  mbChart.info.textContent = '无催化 ' + (mbFrac(va, S.T) * 100).toFixed(1) + '% · 催化 ' + (mbFrac(va * 0.6, S.T) * 100).toFixed(1) + '%';
};

/* ================= 章节 4 · 浓度与压强 ================= */

const st4 = { g: new THREE.Group(), N: 60, flashOn: true, acc: 0, colCnt: 0, effCnt: 0, colLast: 0, effLast: 0, colRate: 0, effRate: 0 };
scene.add(st4.g);
CHG.push(st4.g);
st4.box = makeGlassBox(st4.g, { w: 3.4, h: 1.7, d: 2.0 });
st4.piston = makePiston(st4.g, st4.box, 1.7, 2.0);
const S4 = { parts: R.parts, min: st4.box.min, max: st4.box.max.clone(), wall: 0, s0: 0.62 };
S4.max.x = st4.piston.face - 0.04;

function spawnAB4() {
  const kind = Math.random() < 0.55 ? 'A' : 'B';
  const p = makeParticle(kind, 0, 0, 0);
  randPosIn(S4, p.p);
  const k = S4.s0 / Math.sqrt(3);
  p.v.set(gauss(), gauss(), gauss()).multiplyScalar(k);
  return p;
}

UPD[3] = (dt, rdt) => {
  const S = st4;
  S.piston.update(dt);
  S4.max.x = S.piston.face - 0.04;
  while (R.parts.length > S.N) R.parts.pop().dead = true;
  while (R.parts.length < S.N) spawnAB4();
  stepGas(S4, dt, (p) => {
    if (S.flashOn && Math.random() < 0.18) flash(p.p.x, p.p.y, p.p.z, 0x9fb8d8, 0.13, 0.3);
  });
  pairScan(R.parts, (a, b) => {
    elastic(a, b);
    S.colCnt++;
    if ((a.kind === 'A' && b.kind === 'B') || (a.kind === 'B' && b.kind === 'A')) {
      if (_v1.subVectors(a.v, b.v).lengthSq() > 1.5 * S4.s0 * S4.s0) {
        S.effCnt++;
        if (S.flashOn) flash((a.p.x + b.p.x) / 2, (a.p.y + b.p.y) / 2, (a.p.z + b.p.z) / 2, 0xffe9a8, 0.4);
      }
    }
  });
  S.acc += rdt;
  if (S.acc >= 0.25) {
    const k = S.acc;
    S.acc = 0;
    const ci = (S.colCnt - S.colLast) / k;
    const ei = (S.effCnt - S.effLast) / k;
    S.colLast = S.colCnt;
    S.effLast = S.effCnt;
    S.colRate += (ci - S.colRate) * 0.4;
    S.effRate += (ei - S.effRate) * 0.4;
  }
  hud4.set('col', S.colRate.toFixed(1) + ' 次/s');
  hud4.set('eff', S.effRate.toFixed(1) + ' 次/s');
  hud4.set('n', R.parts.length + ' · V ' + S.piston.vol().toFixed(2));
};

/* ================= 章节 5 · 化学平衡的建立 ================= */
/* A ⇌ B 动力学蒙特卡洛：每个 A 每秒以 kf 概率转化为 B，每个 B 以 kr 概率转回 A。
 * v正 = kf·x(A)、v逆 = kr·x(B)，平衡时 x(B)/x(A) = kf/kr = K。 */

const st5 = { g: new THREE.Group(), kf: 0.10, kr: 0.03, t: 0, rec: 0, showV: true };
scene.add(st5.g);
CHG.push(st5.g);
st5.box = makeGlassBox(st5.g, { w: 3.0, h: 1.7, d: 2.0 });
const S5 = { parts: R.parts, min: st5.box.min, max: st5.box.max, wall: 0, s0: 0.62 };

function reset5() {
  R.parts.length = 0;
  for (let i = 0; i < 60; i++) {
    const p = makeParticle('A', 0, 0, 0);
    randPosIn(S5, p.p);
  }
  setBoxSpeeds(R.parts, S5.s0);
  st5.t = 0;
  st5.rec = 0;
}
function flip5(p, kind) {
  applyKind(p, kind);
  p.flash = 0.55;
}
function pushPt(s, t, v) { s.pts.push([t, v]); }

UPD[4] = (dt, rdt) => {
  const S = st5;
  stepGas(S5, dt);
  pairScan(R.parts, (a, b) => { elastic(a, b); });
  for (const p of R.parts) {
    if (p.kind === 'A') { if (Math.random() < S.kf * dt) flip5(p, 'B'); }
    else if (Math.random() < S.kr * dt) flip5(p, 'A');
  }
  S.t += rdt;
  S.rec += rdt;
  let nA = 0;
  for (const p of R.parts) if (p.kind === 'A') nA++;
  const nB = R.parts.length - nA;
  const cfg = tChart.cfg;
  if (S.rec >= 0.3) {
    S.rec = 0;
    const xA = nA / Math.max(R.parts.length, 1);
    pushPt(cfg.sA, S.t, xA);
    pushPt(cfg.sB, S.t, 1 - xA);
    pushPt(cfg.vF, S.t, S.kf * xA);
    pushPt(cfg.vR, S.t, S.kr * (1 - xA));
    const XMAX = 90;
    if (S.t > XMAX) [cfg.sA, cfg.sB, cfg.vF, cfg.vR].forEach((s) => {
      while (s.pts.length && s.pts[0][0] < S.t - XMAX) s.pts.shift();
    });
  }
  const xMax = Math.min(Math.max(S.t, 12), 90);
  const { ctx, W, H } = prepCanvas(tChart.cv, 288);
  if (S.showV) {
    panel(ctx, 0, 2, W, 142, {
      xMax, yMin: 0, yMax: 1, yFmt: (v) => Math.round(v * 100) + '%',
      series: [cfg.sA, cfg.sB], events: [],
    });
    panel(ctx, 0, 148, W, 138, {
      xMax, yMin: 0, yMax: Math.max(S.kf, S.kr) * 1.2, yFmt: (v) => v.toFixed(2),
      series: [cfg.vF, cfg.vR], events: [],
    });
  } else {
    panel(ctx, 0, 20, W, 248, {
      xMax, yMin: 0, yMax: 1, yFmt: (v) => Math.round(v * 100) + '%',
      series: [cfg.sA, cfg.sB], events: [],
    });
  }
  tChart.info.textContent = 'K实测 ' + (nB / Math.max(nA, 1)).toFixed(2) + ' · K理论 ' + (S.kf / S.kr).toFixed(2);
};

/* ================= 章节 6 · 平衡移动（2NO2 ⇌ N2O4） ================= */
/* 2NO2 ⇌ N2O4（正反应放热 ΔH<0）。NO2 红棕色、N2O4 无色，盒内色深实时反映 [NO2]。
 * 动力学：正反应事件率 = (a/V)·C(n2,2)，逆反应事件率 = b·n4，Kc = a/(2b)；
 * 范特霍夫：Kc(T) = 0.06·exp(6856·(1/T - 1/300))，ΔH/R = -6856 K；300K 平衡约 18 NO2 + 19 N2O4。 */

function kc6(T) { return 0.06 * Math.exp(6856 * (1 / T - 1 / 300)); }

const st6 = {
  g: new THREE.Group(),
  T: 300, Tt: 300, vol: 1.0, t: 0, rec: 0, fwd: 0, rev: 0,
  told: { c: 0, p: 0 },
};
scene.add(st6.g);
CHG.push(st6.g);
st6.box = makeGlassBox(st6.g, { w: 3.4, h: 1.7, d: 2.0, tint: true });
st6.piston = makePiston(st6.g, st6.box, 1.7, 2.0);
const S6 = { parts: R.parts, min: st6.box.min, max: st6.box.max.clone(), wall: 0, s0: 0.62 };

function load6() {
  R.parts.length = 0;
  for (let i = 0; i < 40; i++) {
    const p = makeParticle('NO2', 0, 0, 0);
    randPosIn(S6, p.p);
  }
  for (let i = 0; i < 8; i++) {
    const p = makeParticle('N2O4', 0, 0, 0);
    randPosIn(S6, p.p);
  }
  setBoxSpeeds(R.parts, S6.s0);
  st6.t = 0; st6.rec = 0; st6.fwd = 0; st6.rev = 0;
  tChart.cfg.events.length = 0;
  tChart.cfg.s2.pts.length = 0;
  tChart.cfg.s4.pts.length = 0;
  st6.T = st6.Tt = 300;
  st6.vol = 1.0;
  st6.piston.setVol(1.0);
  st6.piston.face = st6.piston.target;
}
function ev6(lab, c) {
  const ev = tChart.cfg.events;
  ev.push({ t: st6.t, lab, c });
  if (ev.length > 8) ev.shift();
}
function count6() {
  let n2 = 0, n4 = 0;
  for (const p of R.parts) {
    if (p.kind === 'NO2') n2++;
    else if (p.kind === 'N2O4') n4++;
  }
  return [n2, n4];
}

UPD[5] = (dt, rdt) => {
  const S = st6;
  S.piston.update(dt);
  S6.max.x = S.piston.face - 0.04;
  const Vrel = clamp(S.piston.vol(), 0.38, 1);
  if (Math.abs(S.Tt - S.T) > 0.5) {
    const f = Math.sqrt(S.Tt / S.T);
    for (const p of R.parts) p.v.multiplyScalar(f);
    S.T = S.Tt;
    S6.s0 = 0.62 * Math.sqrt(S.T / 300);
  }
  stepGas(S6, dt);
  pairScan(R.parts, (a, b) => { elastic(a, b); });
  let n2, n4;
  [n2, n4] = count6();
  const K = kc6(S.T);
  const b = 0.35 * Math.sqrt(S.T / 300);
  const a = 2 * b * K;
  S.fwd += ((a / Vrel) * n2 * (n2 - 1) / 2) * dt;
  S.rev += b * n4 * dt;
  let guard = 0;
  while (S.fwd >= 1 && guard++ < 4) {
    S.fwd--;
    const n2s = R.parts.filter((p) => p.kind === 'NO2' && !p.dead);
    if (n2s.length < 2) break;
    const i1 = Math.floor(Math.random() * n2s.length);
    let i2 = Math.floor(Math.random() * n2s.length);
    if (i2 === i1) i2 = (i2 + 1) % n2s.length;
    const p1 = n2s[i1], p2 = n2s[i2];
    applyKind(p1, 'N2O4');
    p1.p.addVectors(p1.p, p2.p).multiplyScalar(0.5);
    p1.v.addVectors(p1.v, p2.v).multiplyScalar(0.5);
    p2.dead = true;
    p1.flash = 0.7;
    flash(p1.p.x, p1.p.y, p1.p.z, 0xd8d2c4, 0.35, 0.35);
    n2 -= 2; n4 += 1;
  }
  guard = 0;
  while (S.rev >= 1 && guard++ < 4) {
    S.rev--;
    const n4s = R.parts.filter((p) => p.kind === 'N2O4' && !p.dead);
    if (!n4s.length) break;
    const p = n4s[Math.floor(Math.random() * n4s.length)];
    applyKind(p, 'NO2');
    rUnit(_v1);
    rUnit(_v2);
    p.p.addScaledVector(_v1, 0.1);
    p.v.set(gauss(), gauss(), gauss()).multiplyScalar(S6.s0 / Math.sqrt(3)).addScaledVector(_v1, 1.1);
    const q = makeParticle('NO2', p.p.x - _v1.x * 0.2, p.p.y - _v1.y * 0.2, p.p.z - _v1.z * 0.2);
    q.v.copy(p.v).multiplyScalar(0.6).addScaledVector(_v1, -1.1);
    p.flash = 0.7;
    flash(p.p.x, p.p.y, p.p.z, 0xe8a880, 0.35, 0.35);
    n2 += 2; n4 -= 1;
  }
  sweepList(R.parts);
  /* 盒内 NO2 色深 */
  const tint = st6.box.tint;
  const conc = n2 / Vrel;
  tint.visible = conc > 0.4;
  if (tint.visible) {
    tint.material.opacity = clamp(conc * 0.014, 0, 0.42);
    tint.scale.set(S6.max.x - S6.min.x - 0.04, 1.62, 1.92);
    tint.position.set((S6.min.x + S6.max.x) / 2, 0, 0);
  }
  /* 记录曲线 */
  S.t += rdt;
  S.rec += rdt;
  const cfg = tChart.cfg;
  if (S.rec >= 0.3) {
    S.rec = 0;
    pushPt(cfg.s2, S.t, conc);
    pushPt(cfg.s4, S.t, n4 / Vrel);
    const XMAX = 120;
    if (S.t > XMAX) [cfg.s2, cfg.s4].forEach((s) => {
      while (s.pts.length && s.pts[0][0] < S.t - XMAX) s.pts.shift();
    });
  }
  let vmax = 1.2;
  for (const s of [cfg.s2, cfg.s4]) for (const pt of s.pts) if (pt[1] > vmax) vmax = pt[1];
  const { ctx, W } = prepCanvas(tChart.cv, 240);
  panel(ctx, 0, 4, W, 232, {
    xMax: Math.min(Math.max(S.t, 12), 120), yMin: 0, yMax: vmax * 1.12, yFmt: (v) => v.toFixed(0),
    series: [cfg.s2, cfg.s4], events: cfg.events,
  });
  tChart.info.textContent = 'NO2 ' + n2 + ' · N2O4 ' + n4 + ' · T ' + Math.round(S.T) + 'K · Kc ' + K.toFixed(2);
};

/* ================= 章节 7 · 链式反应（H2 + Cl2 光照爆炸） ================= */
/* 光照引爆：光子击中一个 Cl2 断键生成 2 个 Cl·（链引发，自由基高亮发光）；
 * 链传递：Cl· + H2 -> HCl + H·，H· + Cl2 -> HCl + Cl·，每代新自由基再传递（代数计数）；
 * 链终止：自由基相互结合，或撞到器壁/杂质失活。 */

const st7 = { g: new THREE.Group(), nCl2: 8, hcl: 0, gen: 0, termToast: 0 };
scene.add(st7.g);
CHG.push(st7.g);
st7.box = makeGlassBox(st7.g, { w: 2.8, h: 1.7, d: 2.0 });
const S7 = { parts: R.parts, min: st7.box.min, max: st7.box.max, wall: 0, s0: 0.62 };
const photon = new THREE.Sprite(new THREE.SpriteMaterial({
  map: makeGlowTexture('255,238,150', [[0, 'rgba(C,1)'], [0.35, 'rgba(C,0.55)'], [1, 'rgba(C,0)']]),
  blending: THREE.AdditiveBlending, transparent: true, depthWrite: false,
}));
photon.visible = false;
scene.add(photon);
const photonSt = { t: -1, target: null, from: new THREE.Vector3() };

function load7() {
  R.parts.length = 0;
  for (let i = 0; i < st7.nCl2; i++) {
    const p = makeParticle('Cl2', 0, 0, 0);
    randPosIn(S7, p.p);
  }
  for (let i = 0; i < st7.nCl2 * 2; i++) {
    const p = makeParticle('H2', 0, 0, 0);
    randPosIn(S7, p.p);
  }
  setBoxSpeeds(R.parts, S7.s0);
  st7.hcl = 0;
  st7.gen = 0;
  st7.termToast = 0;
  photonSt.t = -1;
  photon.visible = false;
}
function splitCl2(m) {
  m.dead = true;
  const half = m.len / 2 - m.r * 0.35;
  for (const s of [1, -1]) {
    const r = makeParticle('CL', m.p.x + m.ax.x * half * s, m.p.y + m.ax.y * half * s, m.p.z + m.ax.z * half * s);
    r.gen = 1;
    _v1.copy(m.ax).multiplyScalar(s);
    _v2.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
    r.v.copy(_v1).multiplyScalar(0.8).addScaledVector(_v2, 1.5);
  }
  flash(m.p.x, m.p.y, m.p.z, 0xfff3c0, 1.0);
  label('链引发：Cl2 断键生成 2Cl·', m.p.x, m.p.y + 0.45, m.p.z, '#ffe9a8');
}
function light7() {
  if (photonSt.t >= 0) return;
  const cl2 = R.parts.filter((p) => p.kind === 'Cl2' && !p.dead);
  if (!cl2.length) {
    toast('Cl2 已耗尽，点「重新装料」再来一次。', 'warn');
    return;
  }
  photonSt.target = cl2[Math.floor(Math.random() * cl2.length)];
  photonSt.from.set(photonSt.target.p.x, 2.3, photonSt.target.p.z);
  photonSt.t = 0;
  photon.visible = true;
}
function prop7(rad, mol) {
  let newKind = null;
  if (rad.kind === 'CL' && mol.kind === 'H2') newKind = 'H';
  else if (rad.kind === 'H' && mol.kind === 'Cl2') newKind = 'CL';
  else { elastic(rad, mol); return; }
  mol.dead = true;
  rad.dead = true;
  const hc = makeParticle('HCl', mol.p.x, mol.p.y, mol.p.z);
  hc.v.copy(mol.v).multiplyScalar(0.5);
  const nr = makeParticle(newKind, mol.p.x, mol.p.y, mol.p.z);
  nr.gen = (rad.gen || 1) + 1;
  st7.gen = Math.max(st7.gen, nr.gen);
  rUnit(nr.v).multiplyScalar(1.5 + Math.random() * 0.8);
  flash(mol.p.x, mol.p.y, mol.p.z, 0xffe9a8, 0.55);
  st7.hcl++;
}

UPD[6] = (dt0) => {
  const dt = dt0 * R.timeScale;
  stepGas(S7, dt, (p) => {
    if (!p.glow) return;
    if (Math.random() < 0.10) {
      p.dead = true;
      flash(p.p.x, p.p.y, p.p.z, 0xdfe4ea, 0.4);
      if (st7.termToast < 2) {
        st7.termToast++;
        label('链终止（撞壁失活）', p.p.x, p.p.y + 0.32, p.p.z, '#c9ccd2');
      }
    }
  });
  pairScan(R.parts, (a, b) => {
    if (a.glow && b.glow) {
      a.dead = b.dead = true;
      flash((a.p.x + b.p.x) / 2, (a.p.y + b.p.y) / 2, (a.p.z + b.p.z) / 2, 0xdfe4ea, 0.5);
      if (st7.termToast < 3) {
        st7.termToast++;
        label('链终止：自由基结合', a.p.x, a.p.y + 0.32, a.p.z, '#c9ccd2');
      }
      return;
    }
    if (a.glow && !b.glow) return prop7(a, b);
    if (b.glow && !a.glow) return prop7(b, a);
    elastic(a, b);
  });
  if (photonSt.t >= 0) {
    photonSt.t += dt / 0.55;
    if (photonSt.t >= 1 || !photonSt.target || photonSt.target.dead) {
      const m = photonSt.target;
      photon.visible = false;
      photonSt.t = -1;
      if (m && !m.dead) splitCl2(m);
    } else {
      const k = photonSt.t;
      const e = 1 - (1 - k) * (1 - k);
      _v1.lerpVectors(photonSt.from, photonSt.target.p, e);
      photon.position.copy(_v1);
      const s = 0.45 + Math.sin(k * 40) * 0.08;
      photon.scale.set(s, s * 1.7, 1);
    }
  }
  sweepList(R.parts);
  let nRad = 0;
  for (const p of R.parts) if (p.glow) nRad++;
  hud7.set('rad', String(nRad));
  hud7.set('hcl', String(st7.hcl));
  hud7.set('gen', String(st7.gen));
};

/* ================= 章节 8 · 随堂检测 ================= */

const QUIZ = [
  {
    q: '发生有效碰撞（能引发反应的碰撞）必须同时满足的两个条件是？',
    opts: ['分子数目足够多，碰撞足够频繁', '碰撞能量达到活化能，且碰撞取向合适', '只要能量足够大就行，取向无所谓', '只要有催化剂存在'],
    a: 1,
    ex: '有效碰撞两要素缺一不可：①能量达到活化能 Ea（活化分子）；②取向合适（碰在能成键的部位）。活化分子碰撞若取向不合，仍是无效碰撞。',
  },
  {
    q: '同一气体温度升高时，麦克斯韦-玻尔兹曼速率分布曲线的变化是？',
    opts: ['峰值向高速方向移动且变矮变宽', '峰值向低速方向移动且变高', '曲线形状完全不变，只是整体右移', '峰值位置不变，曲线整体升高'],
    a: 0,
    ex: 'T 升高，速率分布整体右移（峰值速率正比根号T），曲线变矮变宽，大于某速率（如达到 Ea 对应速率）的分子比例显著增大。',
  },
  {
    q: '关于催化剂的说法，正确的是？',
    opts: ['催化剂降低活化能，也同时改变反应热 ΔH', '催化剂使平衡向正反应方向移动，提高转化率', '催化剂降低活化能，但不改变 ΔH 也不改变平衡位置', '催化剂在反应中被消耗，需要不断补充'],
    a: 2,
    ex: '催化剂通过改变反应路径降低活化能、加快反应；但它不改变始末态能量（ΔH 不变），正逆反应速率同等倍数增大，因此不影响平衡位置，本身反应前后质量与化学性质不变。',
  },
  {
    q: '对 2NO2 ⇌ N2O4（正反应放热）的平衡体系压缩体积，红棕色深浅如何变化？',
    opts: ['一直变深，不再恢复', '先变深后变浅，最终仍比压缩前深', '先变浅后变深', '颜色始终不变'],
    a: 1,
    ex: '压缩瞬间 NO2 浓度增大，颜色先变深；随后平衡向气体分子数减小的方向（右，生成 N2O4）移动，NO2 减少而变浅；但因体积缩小、浓度仍高于压缩前，最终颜色比原来深。',
  },
  {
    q: 'H2 与 Cl2 的光照链式反应中，起链传递作用的“链载体”是？',
    opts: ['H2 和 Cl2 分子', 'HCl 分子', '光子', '自由基 Cl· 和 H·'],
    a: 3,
    ex: '光照只是链的引发（Cl2 断键生成 Cl·）。链传递靠自由基：Cl· 撞 H2 生成 HCl + H·，H· 撞 Cl2 生成 HCl + Cl·，自由基不断再生使反应像链条一样持续，直到自由基相互结合或撞壁失活而终止。',
  },
];

function showQuiz() {
  let idx = 0;
  let score = 0;
  const panelEl = document.createElement('div');
  panelEl.className = 'quiz-panel';
  stage.appendChild(panelEl);

  function renderQ() {
    const item = QUIZ[idx];
    panelEl.innerHTML = '';
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
        card.querySelector('.q-score').textContent = '得分：' + score;
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
    panelEl.appendChild(card);
  }

  function renderResult() {
    panelEl.innerHTML = '';
    const card = document.createElement('div');
    card.className = 'quiz-card q-result';
    const pct = Math.round((score / QUIZ.length) * 100);
    card.innerHTML = `
      <div class="q-progress">检测完成</div>
      <div class="big">${score} / ${QUIZ.length}</div>
      <p style="color:var(--text-dim);margin:4px 0 18px">正确率 ${pct}%${pct >= 80 ? '，反应速率与化学平衡的要点你已经掌握了！' : pct >= 60 ? '，大部分概念已经清楚，回顾一下错题。' : '，建议回到前面章节再看一遍哦。'}</p>`;
    const again = document.createElement('button');
    again.type = 'button';
    again.className = 'ctl-btn active';
    again.textContent = '重新测验';
    again.addEventListener('click', () => { idx = 0; score = 0; renderQ(); });
    const back = document.createElement('button');
    back.type = 'button';
    back.className = 'ctl-btn';
    back.textContent = '返回第一章节';
    back.addEventListener('click', () => { panelEl.remove(); window.__eduSections.select(0); });
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:10px;justify-content:center';
    row.appendChild(back);
    row.appendChild(again);
    card.appendChild(row);
    panelEl.appendChild(card);
  }

  renderQ();
  activeSectionCleanup = () => panelEl.remove();
}

/* ================= 章节定义 ================= */

const SECTIONS = [
  {
    title: '有效碰撞',
    html: `<p>化学反应的发生要有<b>有效碰撞</b>，两个条件缺一不可：<span class="hl">① 碰撞能量达到活化能 Ea；② 碰撞取向合适</span>。</p>
<p>演示模型：<b>AB + C → A + BC</b>（置换型）。C 原子沿 A—B 键轴方向撞向 A 端为「取向合适」；撞向 B 端或拦腰撞上为「取向不合」，即使能量够也弹开。</p>
<p>拖动「碰撞能量 E」滑杆：当 E &lt; Ea 时，即使取向合适也弹回（能量不足）。点「碰撞一次（随机取向）」累积统计，或打开「自动演示」连续观察；HUD 记录碰撞总数、有效数与取向合适率。</p>`,
    enter() {
      hideAll();
      cur = 0;
      st1.g.visible = true;
      st1.total = 0; st1.eff = 0; st1.ok = 0;
      st1.auto = false; st1.phase = 'idle'; st1.wait = 0;
      R.parts.length = 0;
      st1.AB = makeParticle('AB', 0, 0, 0); // 初始摆一个 AB 分子，避免空场
      app.setCamera([0.3, 0.75, 3.9], [0, 0, 0]);
      hud1.el.style.display = '';
      ctl.clear();
      ctl.slider({
        label: '碰撞能量 E', min: 0.2, max: 2, step: 0.05, value: st1.E,
        fmt: (v) => v.toFixed(2) + (v < st1.Ea ? ' · <Ea' : ' · ≥Ea'),
        onInput: (v) => { st1.E = v; },
      });
      ctl.button({ label: '⚛ 碰撞一次（随机取向）', onClick: () => { if (st1.phase === 'idle') collide1(); } });
      ctl.toggle({ label: '自动演示', value: false, onChange: (v) => { st1.auto = v; if (v) st1.wait = 0.2; } });
      ctl.button({ label: '↺ 计数清零', onClick: () => { st1.total = 0; st1.eff = 0; st1.ok = 0; } });
      setLegend([
        ['#e0524a', 'A 原子'], ['#3f7fd8', 'B 原子'], ['#2fa864', 'C 原子'],
        ['#ffb14a', '无效碰撞（弹开）'], ['#7ee2a0', '有效碰撞（反应）'],
      ]);
    },
  },
  {
    title: '温度与活化分子',
    html: `<p>一定温度下，分子速率服从<b>麦克斯韦-玻尔兹曼分布</b>：f(v) ∝ v²·e<sup>−mv²/2kT</sup>。温度升高，曲线峰值<b>向高速方向移动且变矮变宽</b>。</p>
<p>只有能量达到活化能 Ea 的<b>活化分子</b>碰撞才可能反应。右图中 Ea 竖线右侧的阴影面积就是<b>活化分子比例</b>（数字实时读出）。</p>
<p>升高温度 → 活化分子比例迅速增大 → 有效碰撞频率提高 → 反应速率加快。打开「300K 对比曲线」看双温度对比；3D 中速度快的分子会被染成暖色。</p>`,
    enter() {
      hideAll();
      cur = 1;
      st2.g.visible = true;
      st2.T = 300; st2.Tt = 300; st2.Ea = 1.2; st2.showRef = false;
      S2.s0 = 0.62;
      const mix = [['A', 38], ['B', 34], ['C', 28], ['inert', 20]];
      for (const item of mix) {
        for (let i = 0; i < item[1]; i++) {
          const p = makeParticle(item[0], 0, 0, 0);
          randPosIn(S2, p.p);
        }
      }
      setBoxSpeeds(R.parts, S2.s0);
      app.setCamera([0.3, 1.1, 4.9], [0, 0, 0]);
      mbChart.el.style.top = '';
      mbChart.show(true);
      ctl.clear();
      ctl.slider({
        label: '温度 T', min: 100, max: 900, step: 10, value: 300,
        fmt: (v) => Math.round(v) + ' K',
        onInput: (v) => { st2.Tt = v; },
      });
      ctl.slider({
        label: '活化能 Ea', min: 0.8, max: 2.4, step: 0.05, value: 1.2,
        fmt: (v) => '×10⁻¹⁹ J（v≥' + Math.round(v * 750) + '）',
        onInput: (v) => { st2.Ea = v; },
      });
      ctl.toggle({ label: '300K 对比曲线', value: false, onChange: (v) => { st2.showRef = v; } });
      ctl.toggle({ label: '暂停', value: false, onChange: (v) => app.setPaused(v) });
      setLegend([
        ['#3f7fd8', '慢分子（冷色）'], ['#ffa040', '快分子（暖色）'], ['#e0524a', 'A'], ['#2fa864', 'C'], ['#9aa3ad', '惰性分子'],
      ]);
    },
  },
  {
    title: '催化剂',
    html: `<p><b>催化剂</b>通过改变反应路径<span class="hl">降低活化能 Ea</span>，让更多分子成为活化分子，速率大大加快。但它<b>只改变速率</b>：不改变反应热 ΔH、不改变平衡位置，本身的质量和化学性质在反应前后都不变。</p>
<p>上盒无催化剂（对照）、下盒有催化剂表面：分子撞上表面被<b>吸附</b>（短暂贴附、小球被压扁示意键被削弱），更容易越过低势垒完成 A+B→AB 后脱附。</p>
<p>点「开始对照实验」：同温度、同分子数，计时 10 s 比较两盒反应数。右侧图中绿色虚线 Ea(催) 比橙色 Ea 更靠左，阴影面积更大。</p>`,
    enter() {
      hideAll();
      cur = 2;
      st3.g.visible = true;
      st3.T = 300; st3.Tt = 300; st3.cat = true;
      st3.runT = 0; st3.cTop = 0; st3.cBot = 0;
      st3.plate.visible = true;
      S3T.s0 = S3B.s0 = 0.62;
      resetBoxes3();
      app.setCamera([0.2, 0.3, 6.2], [0, 0.2, 0]);
      hud3.el.style.display = '';
      mbChart.el.style.top = window.matchMedia('(max-width:760px)').matches ? '88px' : '118px';
      mbChart.show(true);
      ctl.clear();
      ctl.slider({
        label: '温度 T', min: 150, max: 600, step: 10, value: 300,
        fmt: (v) => Math.round(v) + ' K',
        onInput: (v) => { st3.Tt = v; },
      });
      ctl.toggle({
        label: '底盒催化剂', value: true,
        onChange: (v) => { st3.cat = v; st3.plate.visible = v; },
      });
      ctl.button({
        label: '⏱ 开始对照实验（10s）',
        onClick: () => {
          resetBoxes3();
          st3.cTop = 0; st3.cBot = 0;
          st3.runT = 10;
          toast('对照实验开始：同温度、同分子数，计时 10 s…');
        },
      });
      ctl.button({ label: '↺ 重置', onClick: () => SECTIONS[2].enter() });
      setLegend([
        ['#e0524a', 'A 原子'], ['#3f7fd8', 'B 原子'], ['#e0524a ▸', 'AB 产物（红蓝哑铃）'], ['#b0a48e', '催化剂表面（吸附位）'],
      ]);
    },
  },
  {
    title: '浓度与压强',
    html: `<p>恒容下增大<b>浓度</b>（滑杆调分子数 N），或用<b>活塞压缩</b>增大压强，本质相同：<span class="hl">单位体积内分子数增多 → 碰撞频率升高 → 有效碰撞频率升高 → 反应速率加快</span>。</p>
<p>HUD 实时统计两个读数：<b>壁面碰撞频率</b>（分子撞器壁的次数/秒）和<b>有效碰撞频率</b>（A、B 分子间相对动能达标的碰撞，黄色闪光），它们就是速率的微观标志。</p>
<p>试试：N 不变时拖动活塞压缩——两个频率读数同步上升；再增大 N 对比。</p>`,
    enter() {
      hideAll();
      cur = 3;
      st4.g.visible = true;
      st4.N = 60;
      st4.colCnt = 0; st4.effCnt = 0; st4.colLast = 0; st4.effLast = 0;
      st4.colRate = 0; st4.effRate = 0; st4.acc = 0;
      st4.piston.setVol(1);
      st4.piston.face = st4.piston.target;
      S4.max.x = st4.piston.face - 0.04;
      S4.s0 = 0.62;
      for (let i = 0; i < 60; i++) spawnAB4();
      app.setCamera([0.9, 1.0, 4.8], [-0.2, 0, 0]);
      hud4.el.style.display = '';
      ctl.clear();
      ctl.slider({
        label: '分子数 N（浓度）', min: 10, max: 150, step: 2, value: 60,
        fmt: (v) => Math.round(v) + ' 个',
        onInput: (v) => { st4.N = v; },
      });
      ctl.slider({
        label: '活塞体积（压缩）', min: 0.4, max: 1, step: 0.02, value: 1,
        fmt: (v) => (v * 100).toFixed(0) + '%',
        onInput: (v) => { st4.piston.setVol(v); },
      });
      ctl.toggle({ label: '显示碰撞闪烁', value: true, onChange: (v) => { st4.flashOn = v; } });
      ctl.button({ label: '↺ 重置', onClick: () => SECTIONS[3].enter() });
      setLegend([
        ['#e0524a', 'A 分子'], ['#3f7fd8', 'B 分子'], ['#ffe9a8', '有效碰撞（能量达标）'], ['#9fb8d8', '壁面碰撞'],
      ]);
    },
  },
  {
    title: '化学平衡的建立',
    html: `<p><b>可逆反应</b> A ⇌ B：正反应 A→B 速率 v正 = k正·c(A)，逆反应 B→A 速率 v逆 = k逆·c(B)。初始全为 A，此时 v正 最大、v逆 为 0。</p>
<p>随着 A 消耗、B 生成，v正 减小、v逆 增大，直到 <span class="hl">v正 = v逆</span>——达到<b>化学平衡</b>：各组分浓度不再随时间变化，但微观上双向转化仍在进行（动态平衡）。</p>
<p>平衡时 [B]/[A] = k正/k逆 = K。上图画 c(A)/c(B) 曲线，下图 v正/v逆 两线<b>汇聚到相等</b>；顶部同时读出 K 实测与 K 理论。拖动 k正/k逆 滑杆，曲线会趋向新的平衡点。</p>`,
    enter() {
      hideAll();
      cur = 4;
      st5.g.visible = true;
      st5.kf = 0.10; st5.kr = 0.03; st5.showV = true;
      tChart.cfg = {
        sA: { label: 'c(A)', c: '#e0524a', pts: [] },
        sB: { label: 'c(B)', c: '#3f7fd8', pts: [] },
        vF: { label: 'v正', c: '#e8674a', pts: [] },
        vR: { label: 'v逆', c: '#3f8fd2', pts: [] },
        events: [],
      };
      reset5();
      app.setCamera([0.3, 1.0, 4.9], [0, 0, 0]);
      tChart.show(true);
      ctl.clear();
      ctl.slider({
        label: '正反应 k正', min: 0.02, max: 0.3, step: 0.01, value: 0.10,
        fmt: (v) => v.toFixed(2) + ' /s',
        onInput: (v) => { st5.kf = v; },
      });
      ctl.slider({
        label: '逆反应 k逆', min: 0.01, max: 0.3, step: 0.01, value: 0.03,
        fmt: (v) => v.toFixed(2) + ' /s',
        onInput: (v) => { st5.kr = v; },
      });
      ctl.toggle({ label: '暂停', value: false, onChange: (v) => app.setPaused(v) });
      ctl.toggle({ label: '显示速率曲线', value: true, onChange: (v) => { st5.showV = v; } });
      ctl.button({
        label: '↺ 重置（全 A）',
        onClick: () => {
          reset5();
          [tChart.cfg.sA, tChart.cfg.sB, tChart.cfg.vF, tChart.cfg.vR].forEach((s) => { s.pts.length = 0; });
        },
      });
      setLegend([
        ['#e0524a', 'A（红 ⇌ 蓝 B）'], ['#e8674a', 'v正 = k正·c(A)'], ['#3f8fd2', 'v逆 = k逆·c(B)'],
      ]);
    },
  },
  {
    title: '平衡移动',
    html: `<p>模型：<b>2NO₂ ⇌ N₂O₄</b>（正反应放热 ΔH&lt;0）。NO₂ 是<b>红棕色</b>气体，N₂O₄ 无色——盒内颜色深浅直接反映 [NO₂] 的高低。</p>
<p>三个扰动：① <b>增加 NO₂</b>：Q&lt;K，平衡右移；② <b>升温</b>：放热反应 K 随 T 减小，平衡左移，红棕色<b>加深</b>；③ <b>压缩体积</b>：NO₂ 浓度瞬间增大（颜色<b>先变深</b>），随后平衡向气体分子数减小的方向（右）移动，NO₂ 减少、颜色<b>再变浅</b>——但仍比压缩前深。</p>
<p>右图记录每次扰动后的浓度-时间曲线，竖虚线为扰动时刻。也可直接拖动活塞与温度滑杆连续扰动。</p>`,
    enter() {
      hideAll();
      cur = 5;
      st6.g.visible = true;
      tChart.cfg = {
        s2: { label: 'c(NO₂)', c: '#c2542e', pts: [] },
        s4: { label: 'c(N₂O₄)', c: '#8a94a0', pts: [] },
        events: [],
      };
      S6.s0 = 0.62;
      load6();
      app.setCamera([1.0, 1.0, 5.0], [-0.2, 0, 0]);
      tChart.show(true);
      ctl.clear();
      ctl.button({
        label: '＋ 增加 NO₂',
        onClick: () => {
          if (R.parts.length + 6 > 90) { toast('分子太多啦，先重置再来。', 'warn'); return; }
          addNO2(6);
          ev6('+NO₂', '#c2542e');
        },
      });
      ctl.button({
        label: '🔥 升高温度 +30K',
        onClick: () => { st6.Tt = Math.min(400, st6.Tt + 30); ev6('升温', '#e8674a'); },
      });
      ctl.button({
        label: '⇐ 压缩体积',
        onClick: () => {
          st6.vol = Math.max(0.4, st6.vol * 0.75);
          st6.piston.setVol(st6.vol);
          ev6('压缩', '#3f8fd2');
          toast('压缩：颜色先变深（NO₂ 浓度瞬间增大）→ 平衡右移（向分子数减小方向）→ NO₂ 减少，颜色再变浅。', 'ok');
        },
      });
      ctl.slider({
        label: '活塞体积', min: 0.4, max: 1, step: 0.02, value: 1,
        fmt: (v) => (v * 100).toFixed(0) + '%',
        onInput: (v) => { st6.vol = v; st6.piston.setVol(v); },
      });
      ctl.slider({
        label: '温度 T', min: 280, max: 400, step: 5, value: 300,
        fmt: (v) => Math.round(v) + ' K',
        onInput: (v) => { st6.Tt = v; },
      });
      ctl.button({ label: '↺ 重置', onClick: () => SECTIONS[5].enter() });
      setLegend([
        ['#c2542e', 'NO₂（红棕色）'], ['#d6cec2', 'N₂O₄（无色，淡色哑铃）'], ['#e8674a', '升温 → 平衡左移'], ['#3f8fd2', '压缩 → 平衡右移'],
      ]);
    },
  },
  {
    title: '链式反应',
    html: `<p><b>H₂ + Cl₂ 光照爆炸</b>是典型的<b>链式反应</b>。链的引发：光子击中 Cl₂，断键产生自由基 <span class="hl">Cl·</span>（高亮发光的绿色小球）。</p>
<p>链的传递：Cl· + H₂ → HCl + H·；H· + Cl₂ → HCl + Cl·——自由基（<b>链载体</b>）不断再生，一代一代传递下去（HUD 记录代数），HCl 越积越多。</p>
<p>链的终止：两个自由基相互结合、或撞到器壁/杂质而失活。点「光照引爆」观察链式生长；打开「慢放 0.25×」可以看清单步传递。</p>`,
    enter() {
      hideAll();
      cur = 6;
      st7.g.visible = true;
      S7.s0 = 0.62;
      load7();
      app.setCamera([0.2, 0.9, 4.8], [0, 0, 0]);
      hud7.el.style.display = '';
      ctl.clear();
      ctl.button({ label: '⚡ 光照引爆', onClick: light7 });
      ctl.slider({
        label: 'Cl₂ 分子数', min: 3, max: 12, step: 1, value: 8,
        fmt: (v) => Math.round(v) + ' 个',
        onInput: (v) => { st7.nCl2 = Math.round(v); load7(); },
      });
      ctl.toggle({
        label: '慢放 0.25×', value: false,
        onChange: (v) => { R.timeScale = v ? 0.25 : 1; },
      });
      ctl.button({ label: '↺ 重新装料', onClick: () => load7() });
      setLegend([
        ['#74e884', 'Cl· 自由基（链载体，发光）'], ['#ffd27a', 'H· 自由基（链载体）'],
        ['#3fae5a', 'Cl₂（绿哑铃）'], ['#e8e2d6', 'H₂ / HCl（白+绿）'],
      ]);
    },
  },
  {
    title: '随堂检测',
    html: `<p>5 道选择题，检验本节课的掌握情况。</p>`,
    enter() {
      hideAll();
      cur = 7;
      ctl.clear();
      st2.g.visible = true;
      S2.s0 = 0.62;
      for (let i = 0; i < 30; i++) {
        const p = makeParticle('inert', 0, 0, 0);
        randPosIn(S2, p.p);
      }
      setBoxSpeeds(R.parts, S2.s0);
      app.setCamera([0, 1.3, 6.5], [0, 0, 0]);
      showQuiz();
    },
  },
];

/* 背景章节（随堂检测）里让背景盒子继续飘动 */
UPD[7] = (dt) => {
  stepGas(S2, dt);
  pairScan(R.parts, (a, b) => { elastic(a, b); });
};

function addNO2(n) {
  for (let i = 0; i < n; i++) {
    const p = makeParticle('NO2', 0, 0, 0);
    p.p.set(S6.min.x + 0.2 + Math.random() * (S6.max.x - S6.min.x - 0.4), S6.max.y - 0.3, (Math.random() - 0.5) * 1.3);
    p.v.set((Math.random() - 0.5) * 0.4, -0.4 - Math.random() * 0.3, (Math.random() - 0.5) * 0.4);
    p.flash = 0.5;
  }
}

/* ---------------- 启动 ---------------- */

loadAll([
  { key: 'sky', label: '环境光', job: loadHDR(TEX.skyHdr) },
], (d, t, lb) => loader.setText('正在加载 ' + d + '/' + t + '（' + lb + '）')).then((t) => {
  scene.environment = t.sky;
  loader.hide();
  const sections = createSections({
    nav: document.getElementById('sideNav'),
    descPanel: document.getElementById('descPanel'),
    sections: SECTIONS,
    onSelect(i, sec) {
      if (activeSectionCleanup) { activeSectionCleanup(); activeSectionCleanup = null; }
      sec.enter();
    },
  });
  window.__eduSections = sections;
  sections.select(0);
}).catch((err) => {
  loader.setText('资源加载失败：' + err.message);
  console.error(err);
});
