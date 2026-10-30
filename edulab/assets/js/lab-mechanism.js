/* EduLab · 反应机理 · 分子动画（mechanism）
 * 章节：19 个反应机理逐步拆解 + 随堂检测。
 * 架构：
 *   数据格式  原子 a:[[元素,x,y,z],...]，键 b:[[i,j,键级],...]；
 *   快照 steps[k] = [位置增量{仅变化的原子}, {ab 增键/db 删键/ar 弯箭头/da 虚线/chg 电荷/col 换色/lbl 标注/hide/show/cap 字幕}]
 *   弯箭头 = 沿二次贝塞尔曲线的管几何 + 箭头锥，从电子对出发（b:键中点 / lp:孤对 / q:电荷）指向受体；
 *   虚线   = 过渡态部分键（分段小圆柱）；
 *   播放   = 原子位置插值 + 断键淡出 / 成键淡入 + 箭头生长 + 步骤字幕（DOM 覆盖层）。
 * 控件：上一步 / 下一步 / 自动播放 / 速度 / 重播（酯化章另有 ¹⁸O 示踪开关）。
 */
import {
  THREE, clamp, loadAll,
  createApp, cameraTweenTick, makeLoader,
  createSections, createControlsPanel, makeHUD, makeTextSprite, setSpriteText,
} from './edu-core.js';

/* ---------------- 专属样式（不改共享 CSS） ---------------- */

const style = document.createElement('style');
style.textContent = `
.lab-controls:empty { display: none; }
.mech-cap {
  position: absolute; left: 50%; bottom: 74px; transform: translateX(-50%);
  z-index: 12; max-width: min(720px, calc(100% - 28px));
  background: color-mix(in srgb, var(--card) 82%, transparent);
  backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
  border: 1px solid var(--card-border); border-radius: 12px;
  padding: 9px 16px; font-size: 13.5px; line-height: 1.6; color: var(--text);
  text-align: center; pointer-events: none;
}
.mech-cap b { color: var(--accent); }
@media (max-width: 640px) { .mech-cap { bottom: 64px; font-size: 12px; padding: 7px 10px; } }
`;
document.head.appendChild(style);

/* ---------------- 元素与几何常量 ---------------- */

// CPK 配色（题定）：[颜色, 半径]
const EL = {
  C: ['#42424a', 0.36], H: ['#f2f4f7', 0.24], O: ['#e0443a', 0.34], N: ['#3a62d8', 0.34],
  Cl: ['#3fae4a', 0.44], Na: ['#a05ad8', 0.46], Br: ['#8b2626', 0.48], Zn: ['#9aa4ae', 0.46],
  Cu: ['#e07030', 0.42], Fe: ['#8a5a2a', 0.44], Al: ['#c9cdd4', 0.44], Mg: ['#4fae62', 0.44],
  Ag: ['#b8bcc4', 0.44], S: ['#e0c030', 0.40],
};
const ARROW_COLOR = 0xff8c1a;
const DASH_COLOR = 0xb9c2cc;
const FONT = '-apple-system, "PingFang SC", "Microsoft YaHei", sans-serif';

const atomGeo = new THREE.SphereGeometry(1, 26, 20);
const bondGeo = new THREE.CylinderGeometry(1, 1, 1, 12, 1, true);

/* ---------------- 向量小工具（数据区用普通数组） ---------------- */

const V = (p) => new THREE.Vector3(p[0], p[1], p[2]);
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const scl = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
function norm(a) { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }
// 平移一组原子索引
const shift = (pts, d) => pts.map((p) => add(p, d));

/** 在中心 c 周围放 n 个氢：d 为中心指向非氢取代基的方向，氢位于反侧锥面（默认四面角） */
function Hs(c, d, r, n, ph = 0) {
  const ax = norm(scl(norm(d), -1));
  const half = 70.5 * Math.PI / 180;
  let u = norm(cross(Math.abs(ax[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0], ax));
  const w = norm(cross(ax, u));
  const out = [];
  for (let k = 0; k < n; k++) {
    const f = ph + k * Math.PI * 2 / n;
    const dir = add(scl(ax, Math.cos(half)), scl(add(scl(u, Math.cos(f)), scl(w, Math.sin(f))), Math.sin(half)));
    out.push(add(c, scl(dir, r)));
  }
  return out;
}

/* ---------------- 场景 ---------------- */

const stage = document.getElementById('stage');
const loader = makeLoader(stage, '正在搭建分子舞台…');

const app = createApp({
  container: stage,
  fov: 45, near: 0.05, far: 300,
  cameraPos: [0, 2, 9],
  target: [0, 0, 0],
  minDistance: 1.2, maxDistance: 60,
  keepBackground: true,
});
const { scene, camera, controls } = app;

scene.add(new THREE.AmbientLight(0xcdd6e0, 0.95));
const keyLight = new THREE.DirectionalLight(0xffffff, 1.7);
keyLight.position.set(5, 9, 7);
scene.add(keyLight);
const fillLight = new THREE.DirectionalLight(0x93a7c4, 0.55);
fillLight.position.set(-6, 3, -6);
scene.add(fillLight);

const world = new THREE.Group();
scene.add(world);

/* ---------------- 步骤字幕（DOM 覆盖层） ---------------- */

const capEl = document.createElement('div');
capEl.className = 'mech-cap';
capEl.style.display = 'none';
stage.appendChild(capEl);

/* ---------------- 状态累积：由快照 0..k 计算完整状态 ---------------- */

const bkey = (a, b) => (a < b ? a + '-' + b : b + '-' + a);

function rxState(rx, k) {
  const pos = rx.a.map((a) => [a[1], a[2], a[3]]);
  const bonds = (rx.b || []).map((x) => x.slice());
  const hidden = new Set(rx.hide || []);
  const chg = {}, col = Object.assign({}, rx.col0 || {}), lbl = Object.assign({}, rx.lbl || {});
  const rm = (a, b) => { const kk = bkey(a, b); const i = bonds.findIndex((x) => bkey(x[0], x[1]) === kk); if (i >= 0) bonds.splice(i, 1); };
  for (let s = 1; s <= k; s++) {
    const st = rx.steps[s];
    if (!st) continue;
    const d = st[0] || {}, o = st[1] || {};
    for (const i in d) pos[+i] = d[i];
    (o.db || []).forEach(([a, b]) => rm(a, b));
    (o.ab || []).forEach(([a, b, ord]) => { rm(a, b); bonds.push([a, b, ord || 1]); });
    (o.hide || []).forEach((i) => hidden.add(+i));
    (o.show || []).forEach((i) => hidden.delete(+i));
    Object.assign(chg, o.chg || {});
    Object.assign(col, o.col || {});
    Object.assign(lbl, o.lbl || {});
  }
  return { pos, bonds, hidden, chg, col, lbl };
}

/* ---------------- 渲染对象 ---------------- */

let disposables = [];   // 换章节时统一释放
function track(obj) { disposables.push(obj); return obj; }

let atomObjs = [];      // {mesh, mat, sprite, base:[el,r], cur:r}
let bondObjs = new Map(); // key -> {grp, mats, cyls, a, b, order}
let arrowObjs = [];     // {grp, tube, cone, set(g, o)}
let dashObjs = [];      // {grp, mats, set(o)}
let txtObjs = [];       // {grp(sprite), set(o)} 悬浮标注（2e⁻ / 火焰等）

function atomLabel(sprite, el, chg, lbl) {
  const base = lbl || el;
  const text = base + (chg || '');
  setSpriteText(sprite, text, { fontSize: 44, color: '#f4f7fb', scale: 0.0085 });
}

function buildMol(rx) {
  atomObjs = [];
  bondObjs = new Map();
  arrowObjs = [];
  dashObjs = [];
  txtObjs = [];
  rx.a.forEach((a, i) => {
    const [el] = a;
    const mat = track(new THREE.MeshStandardMaterial({ color: EL[el][0], roughness: 0.38, metalness: 0.12 }));
    const mesh = new THREE.Mesh(atomGeo, mat);
    world.add(mesh);
    const sprite = makeTextSprite('·', { fontSize: 44, color: '#f4f7fb', scale: 0.0085 });
    sprite.material = track(sprite.material);
    world.add(sprite);
    atomObjs.push({ mesh, mat, sprite, el, r: EL[el][1], tracer: el === 'H' });
  });
}

function makeBondMesh(a, b, order) {
  const grp = new THREE.Group();
  const mats = [];
  const n = order === 3 ? 3 : order;
  for (let k = 0; k < n; k++) {
    const m = track(new THREE.MeshStandardMaterial({ color: 0x8f9aa8, roughness: 0.5, metalness: 0.25, transparent: true }));
    mats.push(m);
    const cyl = new THREE.Mesh(bondGeo, m);
    grp.add(cyl);
  }
  world.add(grp);
  const o = { grp, mats, cyls: grp.children, a, b, order };
  bondObjs.set(bkey(a, b), o);
  return o;
}

function orientBond(grp, pa, pb, order, growK = 1) {
  const A = V(pa), B = V(pb);
  const dir = B.clone().sub(A);
  const len = Math.max(dir.length(), 0.001);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
  let perp = null;
  if (order >= 2) {
    perp = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0));
    if (perp.lengthSq() < 1e-6) perp = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(1, 0, 0));
    perp.normalize();
  }
  const offs = order === 1 ? [0] : order === 2 ? [-0.105, 0.105] : [-0.13, 0, 0.13];
  const cen = A.clone().add(B).multiplyScalar(0.5);
  grp.children.forEach((cyl, k) => {
    cyl.position.copy(perp ? cen.clone().add(perp.clone().multiplyScalar(offs[k])) : cen);
    cyl.quaternion.copy(q);
    cyl.scale.set(0.062, len * Math.max(growK, 0.001), 0.062);
  });
}

function makeArrow(pa, pb, bendSign) {
  const A = V(pa), B = V(pb);
  const dir = B.clone().sub(A);
  if (dir.lengthSq() < 1e-4) dir.set(0.001, 0.001, 0);
  let perp = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0));
  if (perp.lengthSq() < 1e-4) perp = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(1, 0, 0));
  perp.normalize().multiplyScalar(0.42 * (bendSign % 2 === 0 ? 1 : -1));
  const up = new THREE.Vector3(0, 1, 0).multiplyScalar(0.18);
  const ctrl = A.clone().add(B).multiplyScalar(0.5).add(perp).add(up);
  const curve = new THREE.QuadraticBezierCurve3(A, ctrl, B);
  const tubeGeo = track(new THREE.TubeGeometry(curve, 22, 0.042, 6, false));
  const tubeMat = track(new THREE.MeshBasicMaterial({ color: ARROW_COLOR, transparent: true }));
  const tube = new THREE.Mesh(tubeGeo, tubeMat);
  const coneGeo = track(new THREE.ConeGeometry(0.115, 0.3, 10));
  const coneMat = track(new THREE.MeshBasicMaterial({ color: ARROW_COLOR, transparent: true }));
  const cone = new THREE.Mesh(coneGeo, coneMat);
  const tan = B.clone().sub(ctrl).normalize();
  cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tan);
  cone.position.copy(B.clone().sub(tan.clone().multiplyScalar(0.1)));
  const grp = new THREE.Group();
  grp.add(tube); grp.add(cone);
  world.add(grp);
  const total = tubeGeo.index.count;
  const o = {
    grp, tube, cone,
    set(g, op) {
      tubeGeo.setDrawRange(0, Math.max(2, Math.floor(total * clamp(g, 0, 1))));
      const cs = clamp(g * 1.6, 0.001, 1);
      cone.scale.setScalar(cs);
      tubeMat.opacity = op; coneMat.opacity = op;
      grp.visible = op > 0.01 && g > 0.01;
    },
  };
  arrowObjs.push(o);
  return o;
}

function makeDash(pa, pb) {
  const grp = new THREE.Group();
  const A = V(pa), B = V(pb);
  const dir = B.clone().sub(A);
  const len = dir.length();
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
  const segs = 3;
  const mats = [];
  for (let k = 0; k < segs; k++) {
    const m = track(new THREE.MeshBasicMaterial({ color: DASH_COLOR, transparent: true, opacity: 0.9 }));
    mats.push(m);
    const cyl = new THREE.Mesh(bondGeo, m);
    const t0 = (k + 0.5) / segs;
    cyl.position.copy(A.clone().add(B).multiplyScalar(0)); // 下面统一算
    cyl.position.copy(A.clone().lerp(B, t0));
    cyl.quaternion.copy(q);
    cyl.scale.set(0.05, len / segs * 0.55, 0.05);
    grp.add(cyl);
  }
  world.add(grp);
  const o = {
    grp, mats,
    set(op) { grp.visible = op > 0.01; mats.forEach((m) => { m.opacity = 0.9 * op; }); },
  };
  dashObjs.push(o);
  return o;
}

/* ---------------- 箭头/虚线端点解析（对 state 解析） ---------------- */

function parseCode(c) { const i = c.indexOf(':'); return [c.slice(0, i), c.slice(i + 1)]; }
function endpoint(code, S, toward) {
  const [kind, arg] = parseCode(code);
  if (kind === 'b') {
    const [a, b] = arg.split('-').map(Number);
    return mid(S.pos[a], S.pos[b]);
  }
  const i = Number(arg);
  const p = S.pos[i];
  if (kind === 'lp' && toward) {
    // 孤对：从原子沿指向目标的方向外推到球外
    const r = atomObjs[i] ? atomObjs[i].r : 0.3;
    return add(p, scl(norm(sub(toward, p)), r + 0.14));
  }
  return p.slice();
}

/** 生成快照 k 的箭头/虚线（几何按 k-1 状态解析，断键箭头仍能取到键中点；k=0 无） */
function spawnFx(rx, k) {
  if (k <= 0) return;
  const S = rxState(rx, k - 1);
  const opts = (rx.steps[k] && rx.steps[k][1]) || {};
  let sign = 0;
  (opts.ar || []).forEach(([f, t]) => {
    const fpRaw = endpoint(f, S, null);
    const tp = endpoint(t, S, fpRaw);
    const fp = f.startsWith('lp:') ? endpoint(f, S, tp) : fpRaw;
    makeArrow(fp, tp, sign++);
  });
  (opts.da || []).forEach(([a, b]) => makeDash(S.pos[a], S.pos[b]));
  (opts.txt || []).forEach(([x, y, z, s]) => {
    const sp = makeTextSprite(s, { fontSize: 40, color: '#ffd9a0', scale: 0.0105 });
    sp.material = track(sp.material);
    sp.position.set(x, y, z);
    world.add(sp);
    txtObjs.push({ grp: sp, set(op) { sp.material.opacity = op; sp.visible = op > 0.01; } });
  });
}

/* ---------------- 播放状态机 ---------------- */

const st = {
  rx: null, si: 0, phase: 'hold', t: 0, playing: false, speed: 1, tracer: false,
  fromPos: null, toPos: null, hideA: [], showA: [], bondNew: [], bondOld: [],
  cap: '', hud: null, quizPanel: null, lastCam: null,
};
const HOLD = 2.6, MOVE = 1.05, GROW = 0.4;

function tracerOn(i) { return st.tracer && st.rx.tracerAtom === i; }

function applyAtom(i, p, k) {
  const o = atomObjs[i];
  o.mesh.position.set(p[0], p[1], p[2]);
  const vis = !S_hidden(k).has(i);
  o.mesh.visible = vis;
  const target = tracerOn(i) ? o.r * 1.12 : o.r;
  o.mesh.scale.setScalar(vis ? target : 0.001);
  // 标签：非 H 或有标注（电荷/自由基/示踪）时显示
  const chg = S_chg(k)[i] || '';
  const lbl = tracerOn(i) ? '¹⁸O' : S_lbl(k)[i] || '';
  const showLbl = vis && ((o.el !== 'H') || lbl || chg);
  o.sprite.visible = !!showLbl;
  if (showLbl) {
    atomLabel(o.sprite, o.el, chg, lbl);
    o.sprite.position.set(p[0], p[1] + o.r + 0.18, p[2]);
  }
  // 换色（CuO / 示踪等）
  if (tracerOn(i)) o.mat.color.set('#e26ad2');
  else if (S_col(k)[i]) o.mat.color.set(S_col(k)[i]);
  else o.mat.color.set(EL[o.el][0]);
}

// 缓存状态，避免每原子重复计算
let _cacheK = -1, _cacheS = null;
function S(k) {
  if (_cacheK !== k || _cacheS === null) { _cacheS = rxState(st.rx, k); _cacheK = k; }
  return _cacheS;
}
const S_hidden = (k) => S(k).hidden;
const S_chg = (k) => S(k).chg;
const S_col = (k) => S(k).col;
const S_lbl = (k) => S(k).lbl;

function applyFull(k) {
  _cacheK = -1; _cacheS = null;
  const s = S(k);
  atomObjs.forEach((o, i) => applyAtom(i, s.pos[i], k));
  // 键：全量重建
  bondObjs.forEach((o) => { world.remove(o.grp); });
  bondObjs = new Map();
  s.bonds.forEach(([a, b, ord]) => {
    const o = makeBondMesh(a, b, ord);
    orientBond(o.grp, s.pos[a], s.pos[b], ord, 1);
    o.mats.forEach((m) => { m.opacity = 1; });
  });
  arrowObjs.forEach((o) => world.remove(o.grp)); arrowObjs = [];
  dashObjs.forEach((o) => world.remove(o.grp)); dashObjs = [];
  txtObjs.forEach((o) => world.remove(o.grp)); txtObjs = [];
  (st.fadeArrows || []).forEach((o) => world.remove(o.grp));
  (st.fadeDashes || []).forEach((o) => world.remove(o.grp));
  (st.fadeTxts || []).forEach((o) => world.remove(o.grp));
  st.fadeArrows = []; st.fadeDashes = []; st.fadeTxts = [];
  spawnFx(st.rx, k);
  arrowObjs.forEach((o) => o.set(1, 1));
  dashObjs.forEach((o) => o.set(1));
  txtObjs.forEach((o) => o.set(1));
  updateCaption(k);
}

function capOf(k) {
  const o = (st.rx.steps[k] && st.rx.steps[k][1]) || {};
  let c = o.cap || '';
  if (st.tracer && st.rx.tracerNote && k === st.rx.steps.length - 1) c += st.rx.tracerNote;
  return c;
}
function updateCaption(k) {
  const c = capOf(k);
  st.cap = c;
  capEl.innerHTML = `<b>步骤 ${k}/${st.rx.steps.length - 1}</b>　` + c;
  capEl.style.display = '';
  if (st.hud) st.hud.set('step', `${k} / ${st.rx.steps.length - 1}`);
}

function beginTransition() {
  const k = st.si, k2 = k + 1;
  const from = rxState(st.rx, k), to = rxState(st.rx, k2);
  st.fromPos = from.pos.map((p) => p.slice());
  st.toPos = to.pos;
  st.hideA = [...to.hidden].filter((i) => !from.hidden.has(i));
  st.showA = [...from.hidden].filter((i) => !to.hidden.has(i));
  // 键差集
  const fromK = new Set(from.bonds.map((x) => bkey(x[0], x[1])));
  const toK = new Set(to.bonds.map((x) => bkey(x[0], x[1])));
  st.bondOld = from.bonds.filter((x) => !toK.has(bkey(x[0], x[1])));
  st.bondNew = to.bonds.filter((x) => !fromK.has(bkey(x[0], x[1])));
  // 旧箭头/旧虚线/旧标注转入淡出列表（move 结束后由 applyFull 统一移除）
  st.fadeArrows = arrowObjs; st.fadeDashes = dashObjs; st.fadeTxts = txtObjs;
  arrowObjs = []; dashObjs = []; txtObjs = [];
  st.phase = 'move'; st.t = 0;
  updateCaption(k2);
}

function finishTransition() {
  st.si += 1;
  applyFull(st.si);
  st.phase = 'hold'; st.t = 0;
}

function goNext() {
  if (!st.rx || st.phase === 'move') return;
  if (st.si < st.rx.steps.length - 1) beginTransition();
  else st.playing = false;
}
function jumpTo(k) {
  st.si = k; st.phase = 'hold'; st.t = 0; st.playing = false;
  applyFull(k);
}
function goPrev() { if (st.rx && st.phase !== 'move' && st.si > 0) jumpTo(st.si - 1); }
function replay() { jumpTo(0); st.playing = true; syncAuto(); }
function syncAuto() { if (st.autoCtl) st.autoCtl.set(st.playing); }

/* ---------------- 帧循环 ---------------- */

let labReady = false;
app.onFrame((dt) => {
  if (!labReady || !st.rx) return;
  cameraTweenTick(app, dt);
  const sdt = dt * st.speed;
  if (st.phase === 'hold') {
    st.t += sdt;
    const g = clamp(st.t / GROW, 0, 1);
    arrowObjs.forEach((o) => o.set(g, 1));
    dashObjs.forEach((o) => o.set(g));
    txtObjs.forEach((o) => o.set(g));
    if (st.playing && st.t >= HOLD && st.si < st.rx.steps.length - 1) beginTransition();
  } else if (st.phase === 'move') {
    st.t += sdt;
    const p = clamp(st.t / MOVE, 0, 1);
    const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
    // 原子插值
    for (let i = 0; i < atomObjs.length; i++) {
      const a = st.fromPos[i], b = st.toPos[i];
      const q = [a[0] + (b[0] - a[0]) * e, a[1] + (b[1] - a[1]) * e, a[2] + (b[2] - a[2]) * e];
      const o = atomObjs[i];
      o.mesh.position.set(q[0], q[1], q[2]);
      if (o.sprite.visible) o.sprite.position.set(q[0], q[1] + o.r + 0.18, q[2]);
    }
    // 隐/显原子
    st.hideA.forEach((i) => { const o = atomObjs[i]; const s2 = Math.max(0.001, o.r * (1 - e)); o.mesh.scale.setScalar(s2); if (e >= 1) { o.mesh.visible = false; o.sprite.visible = false; } });
    st.showA.forEach((i) => { const o = atomObjs[i]; o.mesh.visible = true; o.mesh.scale.setScalar(Math.max(0.001, o.r * e)); });
    // 键
    const kFrom = rxState(st.rx, st.si), kTo = rxState(st.rx, st.si + 1);
    st.bondOld.forEach(([a, b, ord]) => {
      const o = bondObjs.get(bkey(a, b));
      if (o) { orientBond(o.grp, kFrom.pos[a], kFrom.pos[b], ord, 1 - e); o.mats.forEach((m) => { m.opacity = 1 - e; }); }
    });
    st.bondNew.forEach(([a, b, ord]) => {
      let o = bondObjs.get(bkey(a, b));
      if (!o) { o = makeBondMesh(a, b, ord); }
      orientBond(o.grp, kTo.pos[a], kTo.pos[b], ord, e);
      o.mats.forEach((m) => { m.opacity = e; });
    });
    // 旧箭头/虚线淡出
    st.fadeArrows.forEach((o) => o.set(1, clamp(1 - p * 2.2, 0, 1)));
    st.fadeDashes.forEach((o) => o.set(clamp(1 - p * 2.2, 0, 1)));
    st.fadeTxts.forEach((o) => o.set(clamp(1 - p * 2.2, 0, 1)));
    if (p >= 1) finishTransition();
  }
});

/* ---------------- 相机适配 ---------------- */

function fitCamera() {
  // 取全部快照的并集包围盒，保证整条机理路径都在视野内
  let mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9];
  for (let k = 0; k < st.rx.steps.length; k++) {
    const s = rxState(st.rx, k);
    s.pos.forEach((p, i) => {
      if (s.hidden.has(i)) return;
      for (let d = 0; d < 3; d++) { mn[d] = Math.min(mn[d], p[d]); mx[d] = Math.max(mx[d], p[d]); }
    });
  }
  const c = [(mn[0] + mx[0]) / 2, (mn[1] + mx[1]) / 2, (mn[2] + mx[2]) / 2];
  let rad = 2;
  for (let k = 0; k < st.rx.steps.length; k++) {
    const s = rxState(st.rx, k);
    s.pos.forEach((p, i) => {
      if (s.hidden.has(i)) return;
      rad = Math.max(rad, Math.hypot(...sub(p, c)) + (atomObjs[i] ? atomObjs[i].r : 0.3));
    });
  }
  const dir = norm([0.32, 0.42, 1]);
  const dist = rad * 2.3 + 1.6;
  app.setCamera(add(c, scl(dir, dist)), c, true);
}

/* ---------------- 章节进入 ---------------- */

const ctl = createControlsPanel(document.getElementById('controls'));

function enterReaction(idx) {
  if (st.quizPanel) { st.quizPanel.remove(); st.quizPanel = null; }
  // 清场
  disposables.forEach((d) => { if (d.dispose) d.dispose(); });
  disposables = [];
  world.clear();
  _cacheK = -1; _cacheS = null;
  const rx = REACTIONS[idx];
  st.rx = rx; st.tracer = false; st.playing = false;
  buildMol(rx);
  jumpTo(0);
  fitCamera();
  // HUD
  if (st.hudWrap) st.hudWrap.remove();
  const hudWrap = document.createElement('div');
  hudWrap.className = 'lab-hud';
  stage.appendChild(hudWrap);
  st.hudWrap = hudWrap;
  st.hud = makeHUD(hudWrap, [['step', '步骤'], ['total', '反应']]);
  st.hud.set('step', `0 / ${rx.steps.length - 1}`);
  st.hud.set('total', rx.name);
  // 控件
  ctl.clear();
  ctl.button({ label: '⏮ 上一步', onClick: goPrev });
  ctl.button({ label: '下一步 ⏭', onClick: goNext });
  st.autoCtl = ctl.toggle({ label: '自动播放', value: false, onChange: (v) => { st.playing = v; } });
  ctl.slider({ label: '速度', min: 0.5, max: 2.5, step: 0.25, value: 1, fmt: (v) => v.toFixed(2) + '×', onInput: (v) => { st.speed = v; } });
  ctl.button({ label: '↺ 重播', onClick: replay });
  if (rx.tracerAtom !== undefined) {
    ctl.toggle({
      label: '¹⁸O 示踪', value: false,
      onChange: (v) => {
        const was = st.playing;
        st.tracer = v; jumpTo(st.si);
        st.playing = was; syncAuto();
      },
    });
  }
}

/* ---------------- 反应数据（19 个） ---------------- */
/* 快照格式 steps[k] = [位置增量{原子索引:[x,y,z]}, {ab/db/ar/da/chg/col/lbl/hide/show/cap}]
 * 弯箭头 ar: [from, to]，from: 'b:i-j'（键中点）/ 'lp:i'（孤对）/ 'q:i'（电荷位置），to: 'a:k' / 'b:i-j'
 * 几何按 k-1 状态解析（断键的箭头仍能取到键中点）。 */

/* —— 酯化分子坐标（第 1 / 19 章共用） —— */
// 索引：0 CH3-C  1 C(=O)  2 O羰基  3 O羟基  4 H(酸羟基)
//       5-7 CH3 的 H   8 O(醇)  9 CH2  10 CH3  11 H(醇羟基)  12-13 CH2 的 H  14-16 CH3 的 H
const esterMol = (() => {
  const C0 = [-2.5, 0, 0], C1 = [-1.35, 0.18, 0];
  const O2 = [-1.2, 1.15, 0], O3 = [-0.62, -0.6, 0];
  const h = Hs(C0, [1, 0.15, 0], 0.76, 3, 0.4);
  const H4 = add(O3, scl(norm([-0.55, -0.85, 0.1]), 0.64));
  const O8 = [1.6, 0.55, 0.25], C9 = [2.45, -0.05, 0], C10 = [3.55, 0.55, -0.2];
  const H11 = add(O8, scl(norm([-0.4, 0.9, 0.3]), 0.64));
  const h9 = Hs(C9, norm(sub(C9, O8)), 0.74, 2, 0.2);
  const h10 = Hs(C10, norm(sub(C10, C9)), 0.76, 3, 1.1);
  return [
    ['C', ...C0], ['C', ...C1], ['O', ...O2], ['O', ...O3],
    ['H', ...H4],
    ['H', ...h[0]], ['H', ...h[1]], ['H', ...h[2]],
    ['O', ...O8], ['C', ...C9], ['C', ...C10], ['H', ...H11],
    ['H', ...h9[0]], ['H', ...h9[1]],
    ['H', ...h10[0]], ['H', ...h10[1]], ['H', ...h10[2]],
  ];
})();
const etShifted = (i, d) => { const q = esterMol[i]; return [q[1] + d[0], q[2] + d[1], q[3] + d[2]]; };
const ET_IN = [-2.2, 0.15, 0.1];       // 乙醇进攻时整体平移
const ET_OUT = [1.1, -1.15, 0.55];     // 水离去方向

// —— 供 steps 在模块求值期引用的分子常量（须在 REACTIONS 之前定义） ——
const saponMol = (() => {
  const em = esterMol;
  const O = [-0.5, -2.3, 0.9];
  const Ho = add(O, scl(norm([0.7, 0.5, 0.3]), 0.62));
  return [em[0], em[1], em[2], em[3], em[5], em[6], em[7], em[8], em[9], em[10],
          em[12], em[13], em[14], em[15], em[16],
          ['O', ...O], ['H', ...Ho], ['Na', 1.6, -1.9, -0.4]];
})();
const polyMol = (() => {
  const Cs = [[-3.6, 0.3, 0], [-2.7, -0.3, 0], [-1.3, 0.3, 0], [-0.4, -0.3, 0], [1.0, 0.3, 0], [1.9, -0.3, 0]];
  const dirs = [[0.9, -0.6, 0], [-0.9, 0.6, 0], [0.9, -0.6, 0], [-0.9, 0.6, 0], [0.9, -0.6, 0], [-0.9, 0.6, 0]];
  const a = [];
  Cs.forEach((c, i) => {
    a.push(['C', ...c]);
    const hs = Hs(c, dirs[i], 0.72, 2, 0.4 + i * 0.9);
    hs.forEach((h) => a.push(['H', ...h]));
  });
  return a;
})();

const REACTIONS = [

/* 1. 酯化反应（简化三步 + ¹⁸O 示踪） */
{
  name: '酯化反应',
  eq: 'CH₃COOH + C₂H₅OH ⇌(浓H₂SO₄,Δ) CH₃COOC₂H₅ + H₂O',
  macro: '宏观现象：用饱和碳酸钠溶液收集产物——液面出现有香味、不溶于水的油状液体（乙酸乙酯）。浓硫酸兼作催化剂与吸水剂，促使平衡右移。',
  tracerAtom: 8,
  tracerNote: '　<b>¹⁸O 示踪：标记乙醇的 ¹⁸O 全部出现在酯的 C–O 单键上 → 「酸脱羟基、醇脱氢」。</b>',
  html: `<p>乙酸与乙醇在浓硫酸催化下加热，发生<b>酯化反应</b>（可逆）。机理三步：<span class="hl">① 醇氧孤对进攻羰基碳</span>（π 电子转向氧，生成四面体中间体）→ <b>② 质子转移</b>（醇的 H 转到酸的羟基氧）→ <b>③ 脱水</b>（水的两个 H 来自酸羟基与醇羟基，氧来自<b>酸的羟基</b>）。</p>
<p>打开「<b>¹⁸O 示踪</b>」开关，把乙醇的氧换成放射性同位素 ¹⁸O（粉色球）：动画结束后 ¹⁸O 出现在<b>酯的 C–O 单键</b>上，而不是水里——这正是「<b>酸脱羟基、醇脱氢</b>」的同位素证据。</p>`,
  a: esterMol,
  b: [[0, 1, 1], [1, 2, 2], [1, 3, 1], [3, 4, 1], [0, 5, 1], [0, 6, 1], [0, 7, 1],
      [8, 9, 1], [9, 10, 1], [8, 11, 1], [9, 12, 1], [9, 13, 1], [10, 14, 1], [10, 15, 1], [10, 16, 1]],
  steps: [
    [null, { cap: '反应物：乙酸 + 乙醇（浓硫酸催化、加热，可逆反应）。点击「下一步」看机理。' }],
    [(() => { // 乙醇整体靠近羰基
      const p = {};
      [8, 9, 10, 11, 12, 13, 14, 15, 16].forEach((i) => { p[i] = etShifted(i, ET_IN); });
      return p;
    })(), {
      db: [[1, 2]],
      ab: [[1, 2, 1], [1, 8, 1]],
      ar: [['lp:8', 'a:1'], ['b:1-2', 'a:2']],
      chg: { 8: '⁺' },
      cap: '① 醇羟基氧的<b>孤对电子</b>进攻羰基碳；羰基 π 电子转向氧 → 四面体中间体（醇氧带正电）',
    }],
    [{ 11: add(esterMol[3].slice(1), scl(norm([0.5, -0.85, 0.2]), 0.64)) }, {
      ar: [['b:8-11', 'a:3']],
      chg: { 8: '', 3: '⁺' },
      cap: '② 质子转移：乙醇羟基的 H 转移到乙酸的羟基氧上（生成 –OH₂⁺，水即将离去）',
    }],
    [(() => {
      const p = {};
      [3, 4, 11].forEach((i) => { p[i] = etShifted(i, i === 3 ? ET_OUT : scl(ET_OUT, 0.55)); });
      return p;
    })(), {
      db: [[1, 3]],
      ab: [[1, 2, 2]],
      ar: [['b:1-3', 'a:3'], ['lp:2', 'b:1-2']],
      chg: { 3: '' },
      cap: '③ 脱水：水分子（氧来自<b>酸的羟基</b>）离去，羰基双键恢复 → 乙酸乙酯（去质子已完成）',
    }],
  ],
},

/* 2. 酯的碱性水解（皂化） */
{
  name: '酯的碱性水解',
  eq: 'CH₃COOC₂H₅ + NaOH →(Δ) CH₃COONa + C₂H₅OH',
  macro: '宏观现象：油层逐渐消失、不再分层——碱性条件下水解进行到底。油脂的碱性水解即皂化反应，是制肥皂的原理。',
  html: `<p>碱性水解（皂化）<b>不可逆</b>，机理三步：<span class="hl">① OH⁻ 孤对进攻羰基碳</span>（π 电子转向氧，四面体中间体）→ <b>② 酰氧键断裂</b>，乙氧基带电子离去（羰基恢复）→ <b>③ 酸碱中和</b>：乙氧基夺取羧酸的 H，得到乙醇与乙酸钠。</p>
<p>与酸催化的酯化相反：碱提供的是<b>亲核试剂 OH⁻</b>，产物羧酸被碱中和成盐，使反应走到底。</p>`,
  a: saponMol,
  b: [[0, 1, 1], [1, 2, 2], [1, 3, 1], [0, 4, 1], [0, 5, 1], [0, 6, 1],
      [3, 7, 1], [7, 8, 1], [8, 10, 1], [8, 11, 1], [9, 12, 1], [9, 13, 1], [9, 14, 1], [15, 16, 1]],
  steps: [
    [null, { cap: '反应物：乙酸乙酯 + NaOH（Na⁺ 是旁观离子，真正起作用的是 OH⁻）。' }],
    [(() => { const O = [-0.72, -0.72, 0.85]; return { 15: O, 16: add(O, scl(norm([0.75, -0.35, 0.3]), 0.62)) }; })(), {
      db: [[1, 2]], ab: [[1, 2, 1], [1, 15, 1]],
      ar: [['lp:15', 'a:1'], ['b:1-2', 'a:2']],
      chg: { 2: '⁻' },
      cap: '① <b>OH⁻ 的孤对电子</b>进攻羰基碳；π 电子转向氧 → 四面体中间体（羰基氧带负电）',
    }],
    [(() => {
      const p = {}; const d = [1.5, 0.5, -0.45];
      [3, 7, 8, 9, 10, 11, 12, 13, 14].forEach((i) => { const q = saponMol[i].slice(1); p[i] = add(q, d); });
      return p;
    })(), {
      db: [[1, 3]], ab: [[1, 2, 2]],
      ar: [['b:1-3', 'a:3'], ['lp:2', 'b:1-2']],
      chg: { 2: '', 3: '⁻' },
      cap: '② <b>酰氧键断裂</b>：电子留给乙氧基（EtO⁻）离去；羰基恢复 → 乙酸 + 乙氧基',
    }],
    [(() => {
      // 步骤②中原子 3 随基团平移 d=[1.5,0.5,-0.45]，此处取其到达位置（模块求值期 st.rx 未就绪，须就地计算）
      const H = add(add(saponMol[3].slice(1), [1.5, 0.5, -0.45]), scl(norm([0.6, -0.7, 0.25]), 0.64));
      return { 16: H, 17: [0.3, -1.6, -0.2] };
    })(), {
      ar: [['lp:3', 'a:16'], ['b:15-16', 'a:15']],
      chg: { 3: '', 15: '⁻' },
      cap: '③ <b>酸碱中和</b>：乙氧基夺取羧酸的 H → 乙醇 + 乙酸钠（CH₃COO⁻ 与 Na⁺）。皂化反应不可逆',
    }],
  ],
},

/* 3. 乙烯与溴的加成 */
{
  name: '乙烯与溴的加成',
  eq: 'CH₂=CH₂ + Br₂ → CH₂BrCH₂Br',
  macro: '宏观现象：溴的四氯化碳溶液的红棕色迅速褪去——以此鉴别乙烯与甲烷。',
  html: `<p>乙烯的 <b>π 键</b>电子云暴露在外，遇到 Br₂ 时：① π 电子进攻 Br₂，Br–Br <b>异裂</b>（一对电子整体给了 Br⁻），生成环状溴鎓离子——教学中常<b>简化为碳正离子</b>；② Br⁻ 从<b>反面</b>进攻正碳，得到 1,2-二溴乙烷（反式加成）。</p>
<p>把溴的四氯化碳溶液倒进乙烯，红棕色立刻褪去——这正是检验碳碳双键的方法。</p>`,
  a: [['C', -0.9, 0, 0], ['C', 0.9, 0, 0],
      ['H', -1.55, 0.75, 0], ['H', -1.55, -0.75, 0], ['H', 1.55, 0.75, 0], ['H', 1.55, -0.75, 0],
      ['Br', 2.7, 0, 1.0], ['Br', 2.7, 0, 2.1]],
  b: [[0, 1, 2], [0, 2, 1], [0, 3, 1], [1, 4, 1], [1, 5, 1], [6, 7, 1]],
  steps: [
    [null, { cap: '反应物：乙烯（C=C 双键）+ 溴单质 Br₂。' }],
    [{ 6: [-1.75, 0, 0.85], 7: [2.5, 0, 2.6] }, {
      db: [[6, 7]], ab: [[0, 6, 1]],
      ar: [['b:0-1', 'a:6'], ['b:6-7', 'a:7']],
      chg: { 1: '⁺', 7: '⁻' },
      cap: '① π 电子进攻 Br₂，Br–Br <b>异裂</b>：Br 与左侧碳成键，另一端以 Br⁻ 离去 → 碳正离子（溴鎓离子的简化表示）',
    }],
    [{ 7: [1.55, 0, -1.25] }, {
      ab: [[1, 7, 1]],
      ar: [['lp:7', 'a:1']],
      chg: { 1: '', 7: '' },
      cap: '② Br⁻ 从<b>反面</b>进攻正碳中心 → 1,2-二溴乙烷。两个 Br 加在双键两端（加成反应，无小分子生成）',
    }],
  ],
},

/* 4. 乙烯的加聚反应 */
{
  name: '乙烯的加聚反应',
  eq: 'n CH₂=CH₂ →(催化剂) -[ CH₂-CH₂ ]n-',
  macro: '宏观现象：加热加压、催化剂条件下，乙烯聚合成聚乙烯——常见塑料，可制成保鲜膜、食品袋。',
  html: `<p>聚乙烯的合成：<b>加成聚合</b>。每个乙烯分子的 π 键打开，「两头」各伸出一半键能与相邻单体相连——<span class="hl">双键变单键、单体首尾相连</span>成长链。</p>
<p>这里演示 3 个单体（n = 3）：每按一次「下一步」，就有一个双键打开、生成一个新的 C–C 键，链增长一格。真实的 n 可达数千。</p>`,
  a: polyMol,
  b: (() => {
    const b = [[0, 1, 2], [2, 3, 2], [4, 5, 2]];
    for (let c = 0; c < 6; c++) { b.push([c, 6 + c * 2, 1], [c, 7 + c * 2, 1]); }
    return b;
  })(),
  steps: [
    [null, { cap: '3 个乙烯单体排成一排（实际 n 为几千）：双键是「握手」的备选位点。' }],
    [(() => { const p = {}; [0, 1, 6, 7, 8, 9].forEach((i) => { p[i] = add(polyMol[i].slice(1), [0.55, -0.02, 0]); }); return p; })(), {
      db: [[0, 1]], ab: [[0, 1, 1], [1, 2, 1]],
      ar: [['b:0-1', 'b:1-2']],
      cap: '① 第一个乙烯的 π 键打开：一半留在链内变成 C–C 单键，另一半与新邻居成键 → 链增长',
    }],
    [(() => { const p = {}; [2, 3, 10, 11, 12, 13].forEach((i) => { p[i] = add(polyMol[i].slice(1), [0.5, 0.05, 0]); }); return p; })(), {
      db: [[2, 3]], ab: [[2, 3, 1], [3, 4, 1]],
      ar: [['b:2-3', 'b:3-4']],
      cap: '② 第二个双键打开，链继续增长。注意每个碳始终 4 价：2 个 H + 2 个 C–C',
    }],
    [{}, {
      db: [[4, 5]], ab: [[4, 5, 1]],
      ar: [['b:4-5', 'a:5']],
      cap: '③ 链端仍留着活性位点继续反应……最终得到 <b>聚乙烯 -[CH₂-CH₂]n-</b>：塑料袋、保鲜膜的主要成分',
    }],
  ],
},

/* 5. 甲烷与氯气的取代（自由基链式） */
{
  name: '甲烷与氯气的取代',
  eq: 'CH₄ + Cl₂ →(光照) CH₃Cl + HCl',
  macro: '宏观现象：黄绿色逐渐变浅，试管内壁出现油状液滴、液面上升；暗处不反应——光照是引发条件。',
  html: `<p><b>自由基取代</b>三阶段：<span class="hl">链引发</span>——光照使 Cl–Cl 均裂，生成两个氯自由基 Cl·；<b>链传递</b>——Cl· 夺走甲烷的一个 H（生成 HCl 与 ·CH₃），·CH₃ 再与 Cl₂ 反应生成 CH₃Cl 并<b>再生 Cl·</b>；<b>链终止</b>——自由基相互结合湮灭。</p>
<p>「·」代表未成对电子。只要光照点燃第一颗火种，链式反应就会自己滚下去。</p>`,
  a: (() => {
    const TD = [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]].map((v) => scl(norm(v), 0.78));
    return [['C', 0, 0, 0], ['H', ...TD[0]], ['H', ...TD[1]], ['H', ...TD[2]], ['H', ...TD[3]],
            ['Cl', 2.3, 0, 0], ['Cl', 3.4, 0, 0]];
  })(),
  b: [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1], [5, 6, 1]],
  steps: [
    [null, { cap: '反应物：甲烷（正四面体）+ 氯气。条件：<b>光照</b>（或加热）。' }],
    [{ 6: [3.5, 1.2, 0.3] }, {
      db: [[5, 6]],
      ar: [['b:5-6', 'a:5'], ['b:5-6', 'a:6']],
      lbl: { 5: 'Cl·', 6: 'Cl·' },
      cap: '<b>链引发</b>：光照使 Cl–Cl <b>均裂</b>（每个 Cl 各带走一个电子）→ 两个氯自由基 Cl·',
    }],
    [{ 1: [0.45, 0.45, 0.45], 5: [0.87, 0.87, 0.87] }, {
      db: [[0, 1]], ab: [[1, 5, 1]],
      ar: [['lp:5', 'a:1'], ['b:0-1', 'a:0']],
      lbl: { 0: 'C·', 5: 'Cl', 6: 'Cl·' },
      cap: '<b>链传递 Ⅰ</b>：Cl· 夺取一个 H → HCl；C–H 键的一对电子留在碳上 → 甲基自由基 ·CH₃',
    }],
    [{ 1: [0.9, 1.05, 0.8], 5: [1.32, 1.45, 1.15], 6: [1.15, -0.62, -0.62] }, {
      ab: [[0, 6, 1]],
      ar: [['lp:0', 'a:6']],
      lbl: { 0: 'C', 6: 'Cl' },
      cap: '<b>链传递 Ⅱ</b>：·CH₃ + Cl₂ → CH₃Cl + Cl·（此处以复合示意）——Cl· 再生，反应循环继续，直至自由基相互结合而<b>链终止</b>',
    }],
  ],
},

/* 6. 乙醇的催化氧化（产物乙醛） */
{
  name: '乙醇的催化氧化',
  eq: '2 CH₃CH₂OH + O₂ →(Cu,Δ) 2 CH₃CHO + 2 H₂O',
  macro: '宏观现象：铜丝在火焰上变黑（CuO），插入乙醇后又变红，并闻到刺激性气味（乙醛）——铜反应前后不变，是催化剂。',
  html: `<p>铜催化氧化乙醇，产物是<b>乙醛 CH₃CHO</b>（不是乙酸）。铜丝在酒精灯上加热变黑（CuO），插进乙醇蒸气又变回亮红——「变黑又变红」正是催化剂循环的可见证据：</p>
<p><span class="hl">① Cu 夺取羟基 H</span>（Cu 被氧化为 CuO）→ <b>② CuO 夺取 α-碳上的 H</b>，脱氢生成乙醛 → <b>③ 两个 H 与 O₂ 结合为 H₂O</b>，CuO 还原回 Cu。</p>`,
  a: (() => {
    const C0 = [-1.7, -0.3, 0], C1 = [-0.65, 0.2, 0], O2 = [-0.35, 1.35, 0];
    const H3 = add(O2, scl(norm([0.75, 0.45, 0.15]), 0.62));
    const h0 = Hs(C0, [1, 0.45, 0], 0.75, 3, 0.3);
    const h1 = Hs(C1, norm(sub(C1, C0)), 0.74, 2, 0.8);
    return [['C', ...C0], ['C', ...C1], ['O', ...O2], ['H', ...H3],
            ['H', ...h0[0]], ['H', ...h0[1]], ['H', ...h0[2]],
            ['H', ...h1[0]], ['H', ...h1[1]],
            ['Cu', 1.7, -0.85, -0.35],
            ['O', 2.7, 1.05, 0.6], ['O', 3.4, 1.45, 0.9]];
  })(),
  b: [[0, 1, 1], [1, 2, 1], [2, 3, 1], [0, 4, 1], [0, 5, 1], [0, 6, 1], [1, 7, 1], [1, 8, 1], [10, 11, 2]],
  steps: [
    [null, { cap: '乙醇蒸气通过灼热的铜网（Cu 催化 + 加热），O₂ 参与循环。' }],
    [{ 3: [1.15, -0.6, -0.2] }, {
      db: [[2, 3]], ab: [[9, 3, 1]],
      ar: [['lp:9', 'a:3']],
      col: { 9: '#4a4a4a' }, lbl: { 9: 'CuO' },
      cap: '① Cu 夺取<b>羟基 H</b>：O–H 断裂，Cu 被氧化为 CuO（铜表面变黑）→ CH₃CH₂O• 吸附在表面',
    }],
    [{ 7: [1.05, -0.95, -0.5] }, {
      db: [[1, 7]], ab: [[1, 2, 2], [9, 7, 1]],
      ar: [['b:1-7', 'b:1-2'], ['lp:7', 'a:9']],
      cap: '② 再夺取 <b>α-碳上的 H</b>：C–H 的一对电子转为 C=O π 键 → <b>乙醛 CH₃CHO</b> 脱附（脱氢反应）',
    }],
    [{ 3: [2.0, -1.7, -0.45], 7: [2.35, -2.1, -0.1], 10: [2.15, -1.9, -0.3], 11: [3.7, 1.7, 1.15] }, {
      db: [[9, 3], [9, 7], [10, 11]], ab: [[3, 10, 1], [7, 10, 1]],
      col: { 9: '#e07030' }, lbl: { 9: 'Cu' },
      ar: [['lp:10', 'a:3'], ['lp:10', 'a:7']],
      cap: '③ 两个 H 与 O₂ 结合为 H₂O，CuO 还原回<b>亮红的 Cu</b>——催化剂循环再生。总式：2CH₃CH₂OH + O₂ →(Cu,Δ) 2CH₃CHO + 2H₂O',
    }],
  ],
},

/* 7. 乙醇的消去反应（分子内脱水） */
{
  name: '乙醇的消去反应',
  eq: 'CH₃CH₂OH →(浓H₂SO₄,170°C) CH₂=CH₂ ↑ + H₂O',
  macro: '宏观现象：生成的气体能使溴水、酸性高锰酸钾溶液褪色。温度要迅速升到 170 ℃：140 ℃ 时主要产物是乙醚。',
  html: `<p>乙醇与浓硫酸共热至 <b>170 °C</b>，发生<b>分子内脱水（消去）</b>：① 羟基被质子化变成 –OH₂⁺（好的离去基团）→ ② 水分子带着 C–O 键的一对电子离去，生成碳正离子 → ③ <b>β-碳上的 H</b> 带着一对电子转移到正碳，形成 C=C 双键 → 乙烯。</p>
<p>若温度只有 140 °C 则主要发生<b>分子间脱水</b>生成乙醚——温度决定「消去」还是「取代」。</p>`,
  a: (() => {
    const C0 = [-1.7, -0.2, 0], C1 = [-0.7, 0.25, 0], O2 = [0.05, 1.3, 0];
    const H3 = add(O2, scl(norm([0.8, 0.35, 0.1]), 0.62));
    const h0 = Hs(C0, [1, 0.4, 0], 0.75, 3, 0.3);
    const h1 = Hs(C1, norm(sub(C1, C0)), 0.74, 2, 0.9);
    return [['C', ...C0], ['C', ...C1], ['O', ...O2], ['H', ...H3],
            ['H', ...h0[0]], ['H', ...h0[1]], ['H', ...h0[2]],
            ['H', ...h1[0]], ['H', ...h1[1]],
            ['H', 1.25, 1.75, 0.5]];
  })(),
  b: [[0, 1, 1], [1, 2, 1], [2, 3, 1], [0, 4, 1], [0, 5, 1], [0, 6, 1], [1, 7, 1], [1, 8, 1]],
  steps: [
    [null, { cap: '乙醇 + 浓硫酸，加热到 170 °C（浓硫酸既是催化剂也是脱水剂）。' }],
    [{ 9: [0.38, 1.92, 0.38] }, {
      ab: [[2, 9, 1]],
      ar: [['lp:2', 'a:9']],
      chg: { 2: '⁺' },
      cap: '① <b>羟基质子化</b>：羟基氧孤对结合 H⁺ → –OH₂⁺（把难离去的 OH 变成易离去的水）',
    }],
    [{ 2: [0.6, 2.3, 0.65], 3: [1.2, 2.55, 0.5], 9: [0.1, 3.0, 0.85] }, {
      db: [[1, 2]],
      ar: [['b:1-2', 'a:2']],
      chg: { 2: '', 1: '⁺' },
      cap: '② <b>水分子离去</b>：C–O 键的一对电子留给碳 → 碳正离子（乙基正离子，sp² 平面）',
    }],
    [{ 4: [0.35, -1.75, 0.5] }, {
      db: [[0, 4]], ab: [[0, 1, 2]],
      ar: [['b:0-4', 'b:0-1']],
      chg: { 1: '' },
      cap: '③ <b>β-H 消去</b>：β-碳上的 C–H 一对电子转移到正碳，形成 C=C → <b>乙烯 ↑</b> + H₂O（分子内脱水）',
    }],
  ],
},

/* 8. 苯的溴代反应（亲电取代） */
{
  name: '苯的溴代反应',
  eq: 'C₆H₆ + Br₂ →(FeBr₃) C₆H₅Br + HBr',
  macro: '宏观现象：生成无色油状的溴苯（因溶有溴而呈褐色），导管口出现白雾（HBr 遇水蒸气）。苯不能使溴水褪色——大 π 键的稳定性。',
  html: `<p>苯环 π 电子密集，可与 Br₂ 发生<b>亲电取代</b>（需 FeBr₃ 催化）：① FeBr₃ 极化 Br₂，产生亲电试剂 <b>Br⁺</b> → ② 苯环 π 电子进攻 Br⁺，生成<b>σ 络合物</b>（碳正离子，正电荷离域在环上，芳香性暂时破坏）→ ③ FeBr₄⁻ 夺回质子，<b>芳香性恢复</b>——取代而非加成，因为恢复芳香大 π 键的能量回报太高。</p>`,
  a: (() => {
    const a = [], b = [];
    for (let k = 0; k < 6; k++) {
      const ang = k * Math.PI / 3;
      const c = [Math.cos(ang) * 1.05, Math.sin(ang) * 1.05, 0];
      a.push(['C', ...c]);
    }
    for (let k = 0; k < 6; k++) {
      const ang = k * Math.PI / 3;
      a.push(['H', Math.cos(ang) * 1.78, Math.sin(ang) * 1.78, 0]);
    }
    a.push(['Br', 3.0, 0.35, 0], ['Br', 4.1, 0.8, 0.35],
           ['Fe', 3.3, -1.5, -0.5], ['Br', 4.35, -1.35, -0.6], ['Br', 2.9, -2.35, -0.85], ['Br', 3.7, -1.1, -1.25]);
    return a;
  })(),
  b: (() => {
    const b = [];
    for (let k = 0; k < 6; k++) b.push([k, (k + 1) % 6, k % 2 === 0 ? 2 : 1]);
    for (let k = 0; k < 6; k++) b.push([k, 6 + k, 1]);
    b.push([12, 13, 1], [14, 15, 1], [14, 16, 1], [14, 17, 1]);
    return b;
  })(),
  steps: [
    [null, { cap: '苯（芳香大 π 键）+ Br₂，液溴与铁屑（实为 FeBr₃ 催化）。' }],
    [{ 12: [2.15, 0.4, 0], 13: [3.15, -0.85, -0.3] }, {
      db: [[12, 13]], ab: [[14, 13, 1]],
      ar: [['lp:12', 'a:14'], ['b:12-13', 'a:13']],
      chg: { 12: '⁺', 13: '⁻' },
      cap: '① Br₂ 与 FeBr₃ <b>络合</b>：Br–Br 异裂 → 亲电试剂 <b>Br⁺</b> + FeBr₄⁻（催化剂把溴分子极化）',
    }],
    [{ 12: [1.8, 0.18, 0] }, {
      db: [[0, 1]], ab: [[0, 1, 1], [0, 12, 1]],
      ar: [['b:0-1', 'a:12']],
      chg: { 12: '', 1: '⁺' },
      cap: '② 苯环 π 电子进攻 Br⁺ → <b>σ 络合物</b>：C–Br 已成键，正电荷离域在环上（芳香性暂时被破坏）',
    }],
    [{ 6: [2.85, -1.75, -0.4] }, {
      db: [[0, 6], [14, 13]], ab: [[0, 1, 2], [6, 13, 1]],
      ar: [['lp:13', 'a:6'], ['b:0-6', 'b:0-1']],
      chg: { 1: '', 13: '' },
      cap: '③ FeBr₄⁻ 夺回质子 → HBr，<b>芳香性恢复</b> → 溴苯 + HBr，FeBr₃ 再生。亲电<b>取代</b>而非加成',
    }],
  ],
},

/* 9. 酸碱中和 */
{
  name: '酸碱中和',
  eq: 'HCl + NaOH → NaCl + H₂O　（H⁺ + OH⁻ = H₂O）',
  macro: '宏观现象：滴有酚酞的 NaOH 溶液中逐滴加盐酸，红色恰好褪去时酸碱恰好中和，同时放出中和热。',
  html: `<p>盐酸与氢氧化钠溶液混合时，溶质早已完全电离：<b>H⁺、Cl⁻、Na⁺、OH⁻</b>（都是水合离子）。反应的实质只有一个——<span class="hl">H⁺ 与 OH⁻ 结合成水</span>；Na⁺ 与 Cl⁻ 自始至终没参与，叫<b>旁观离子</b>。</p>
<p>这一章没有弯箭头：酸碱中和是质子的直接结合，靠电荷标注与成键动画演示。中和反应放热。</p>`,
  a: [['H', -2.3, 0.4, 0], ['Cl', -1.5, 0.85, 0.2],
      ['Na', 1.9, -0.5, 0], ['O', 2.7, 0.1, 0], ['H', 3.25, 0.75, 0.2]],
  b: [[0, 1, 1], [3, 4, 1]],
  steps: [
    [null, { cap: '混合前：溶液中是水合的 H⁺、Cl⁻（左）与 Na⁺、OH⁻（右）。' }],
    [{ 0: [2.0, 0.8, 0.15] }, {
      ab: [[0, 3, 1]],
      chg: { 0: '⁺', 3: '⁻' },
      cap: '① H⁺ 与 OH⁻ 相互吸引、靠近、结合——质子直接转移到氧的孤对上（无电子转移弯箭头）',
    }],
    [{ 1: [-3.1, 1.1, 0.35], 2: [2.9, -1.15, -0.25], 0: [2.42, 0.42, 0.1] }, {
      chg: { 0: '', 3: '' },
      cap: '② <b>H₂O 生成</b>。离子方程式：<b>H⁺ + OH⁻ = H₂O</b>；Na⁺、Cl⁻ 是旁观离子（NaCl 留在溶液中）。中和反应放热',
    }],
  ],
},

/* 10. 生成氯化银沉淀 */
{
  name: '生成氯化银沉淀',
  eq: 'AgNO₃ + NaCl → AgCl ↓ + NaNO₃　（Ag⁺ + Cl⁻ = AgCl↓）',
  macro: '宏观现象：两溶液混合立即产生白色沉淀，加稀硝酸不溶解——常用来检验 Cl⁻。',
  html: `<p>硝酸银与氯化钠溶液混合，<b>Ag⁺ 与 Cl⁻</b> 一相遇就结合成难溶的 AgCl：先形成<b>晶核</b>，更多离子不断聚集，长成白色的沉淀颗粒。</p>
<p>溶液里 Na⁺、NO₃⁻ 始终自由移动（旁观离子）。沉淀的生成让溶液中 Ag⁺ 浓度骤降——这正是「复分解反应趋于完成」的条件。</p>`,
  a: [['Ag', -2.1, 0.4, 0], ['N', -1.25, 0.85, 0.2], ['O', -0.55, 1.5, 0.2], ['O', -1.95, 1.4, 0.1], ['O', -1.0, -0.1, 0.35],
      ['Na', 1.7, -0.4, 0], ['Cl', 2.5, 0.15, 0.2],
      ['Ag', -2.7, -1.5, -0.7], ['Cl', 3.0, -1.6, -0.6],
      ['Ag', -2.3, 2.0, 1.0], ['Cl', 2.3, 1.9, 0.9],
      ['Ag', -0.9, -2.2, -1.1], ['Cl', 1.3, 2.4, 1.1],
      ['Ag', 0.3, -2.6, -1.0], ['Cl', 1.9, -2.3, 0.9]],
  b: [[1, 2, 1], [1, 3, 1], [1, 4, 1]],
  hide: [7, 8, 9, 10, 11, 12, 13, 14],
  steps: [
    [null, { cap: '混合前：AgNO₃ 电离出 Ag⁺ 与 NO₃⁻，NaCl 电离出 Na⁺ 与 Cl⁻。' }],
    [{ 0: [0.3, 0.3, 0.05], 6: [-0.4, 0.3, 0] }, {
      ab: [[0, 6, 1]],
      chg: { 0: '⁺', 6: '⁻' },
      cap: '① Ag⁺ 与 Cl⁻ 相遇：静电结合 → <b>AgCl 晶核</b>（离子键，难溶于水）',
    }],
    [{ 7: [-1.05, -0.95, -0.55], 8: [-0.35, -1.25, -0.45], 9: [0.85, 1.15, 0.55], 10: [1.35, 0.95, 0.65] }, {
      show: [7, 8, 9, 10], ab: [[7, 8, 1], [9, 10, 1]],
      cap: '② 更多 Ag⁺ 与 Cl⁻ 从溶液中扩散过来，围绕晶核<b>聚集长大</b>',
    }],
    [{ 11: [-0.95, 1.0, -0.6], 12: [0.4, -1.0, -0.55], 13: [1.15, -0.45, -0.85], 14: [-1.25, -0.35, 0.65] }, {
      show: [11, 12, 13, 14], ab: [[11, 12, 1], [13, 14, 1]],
      cap: '③ 聚集成沉淀颗粒 → <b>AgCl↓（白色）</b>。离子方程式：<b>Ag⁺ + Cl⁻ = AgCl↓</b>；Na⁺、NO₃⁻ 留在溶液中',
    }],
  ],
},

/* 11. 锌置换铜 */
{
  name: '锌置换铜',
  eq: 'Zn + CuSO₄ → ZnSO₄ + Cu',
  macro: '宏观现象：锌片表面析出红色的铜，溶液蓝色逐渐变浅。',
  html: `<p>把锌片插进硫酸铜溶液：<span class="hl">Zn 失去 2 个电子</span>（氧化：Zn → Zn²⁺ + 2e⁻），电子经金属流向溶液中的 <b>Cu²⁺</b>；Cu²⁺ 得到电子（还原：Cu²⁺ + 2e⁻ → Cu），<b>红色的铜</b>析出附着在锌片表面，蓝色逐渐变浅。</p>
<p>这是典型的<b>置换反应</b>，也是原电池的雏形——氧化剂与还原剂不直接接触，电子转移在金属内部完成。</p>`,
  a: [['Zn', -2.2, 0, 0], ['Cu', 1.8, 0.2, 0],
      ['S', 2.75, 0.75, 0.3], ['O', 2.15, 1.45, 0.3], ['O', 3.5, 1.0, 0.15], ['O', 3.0, 0.35, 0.85], ['O', 2.5, 1.35, -0.4]],
  b: [[2, 3, 1], [2, 4, 1], [2, 5, 1], [2, 6, 1]],
  steps: [
    [null, { cap: '反应前：锌片（Zn₀）+ 硫酸铜溶液（蓝色，含 Cu²⁺ 与 SO₄²⁻）。' }],
    [{}, {
      ar: [['lp:0', 'a:1']],
      txt: [[-2.2, 1.1, 0, 'Zn −2e⁻'], [1.0, 1.25, 0, 'e⁻ →']],
      chg: { 0: '²⁺' }, lbl: { 0: 'Zn²⁺' },
      cap: '① <b>氧化</b>：Zn 失去 2 个电子（Zn → Zn²⁺ + 2e⁻），电子经金属流向 Cu²⁺；Zn²⁺ 进入溶液',
    }],
    [{ 1: [1.05, -0.1, -0.15], 2: [3.35, 1.05, 0.5], 3: [2.75, 1.75, 0.5], 4: [4.1, 1.3, 0.35], 5: [3.6, 0.65, 1.05], 6: [3.1, 1.65, -0.2] }, {
      col: { 1: '#e07030' }, lbl: { 1: 'Cu' }, chg: { 1: '' },
      cap: '② <b>还原</b>：Cu²⁺ + 2e⁻ → Cu，红色的铜析出附着在锌表面（Zn + CuSO₄ = ZnSO₄ + Cu）。活动性 Zn > Cu',
    }],
  ],
},

/* 12. 钠与水反应 */
{
  name: '钠与水反应',
  eq: '2 Na + 2 H₂O → 2 NaOH + H₂ ↑',
  macro: '宏观现象：钠浮在水面、熔成小球、四处游动、发出嘶嘶声；滴有酚酞的溶液变红。',
  html: `<p>钠密度比水小、熔点低，浮在水面<b>熔成闪亮小球</b>并四处游动——反应生成的 H₂ 气泡推动它。机理：<span class="hl">Na 失去电子（氧化）</span>，水中的 H 得到电子变成 H 原子，<b>两个 H 原子结合成 H₂</b> 冒出；剩余的 OH⁻ 与 Na⁺ 留在溶液（滴入酚酞变红）。</p>`,
  a: [['Na', -2.6, 0.2, 0], ['Na', 1.1, -1.9, -0.4],
      ['O', -0.6, 0.7, 0.2], ['H', 0.1, 1.1, 0.3], ['H', -0.95, 1.35, 0.05],
      ['O', 1.95, 0.45, 0.3], ['H', 2.55, 0.9, 0.4], ['H', 2.25, -0.35, 0.5]],
  b: [[2, 3, 1], [2, 4, 1], [5, 6, 1], [5, 7, 1]],
  steps: [
    [null, { cap: '2Na + 2H₂O → 2NaOH + H₂↑：钠浮出水面，反应剧烈。' }],
    [{}, {
      db: [[2, 3]],
      ar: [['lp:0', 'a:3']],
      lbl: { 0: 'Na⁺', 3: 'H·' }, chg: { 0: '⁺' },
      cap: '① <b>氧化</b>：Na → Na⁺ + e⁻；电子被水分子中的 H 获得 → H 原子（·H），O–H 键断裂',
    }],
    [{ 3: [-0.25, 1.95, 0.5], 6: [0.4, 2.05, 0.55] }, {
      db: [[5, 6]],
      ar: [['lp:1', 'a:6']],
      lbl: { 1: 'Na⁺', 6: 'H·' }, chg: { 1: '⁺' },
      cap: '② 第二个 Na 同样失去电子；两个 <b>·H</b>（各带一个未成对电子）相互靠近',
    }],
    [{ 3: [0.05, 2.15, 0.55], 6: [0.6, 2.25, 0.6], 0: [-1.7, 0.5, 0.1], 1: [1.4, -0.6, 0.1] }, {
      ab: [[3, 6, 1]],
      lbl: { 3: 'H', 6: 'H' },
      cap: '③ H· + H· → <b>H₂ ↑</b>（气泡推着钠球游动）；剩余 <b>OH⁻ 与 Na⁺</b> 留在溶液 → NaOH。2Na + 2H₂O = 2Na⁺ + 2OH⁻ + H₂↑',
    }],
  ],
},

/* 13. 甲烷燃烧 */
{
  name: '甲烷燃烧',
  eq: 'CH₄ + 2 O₂ →(点燃) CO₂ + 2 H₂O',
  macro: '宏观现象：淡蓝色火焰、放出大量热；罩在火焰上方的干冷烧杯内壁出现水珠，倒入澄清石灰水变浑浊。',
  html: `<p>燃烧是<b>剧烈的氧化反应</b>：点燃后反应物分子的化学键断裂，原子重新组合成更稳定的 CO₂ 与 H₂O，储存的化学能以<b>光和热</b>释放。</p>
<p>演示用简化模型：C–H 键与 O=O 键断裂 → 自由原子重新配对 → C 与两个 O 以双键连成<b>直线形 CO₂</b>，H 与 O 组成两个 H₂O。放热用波浪标注。</p>`,
  a: (() => {
    const TD = [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]].map((v) => scl(norm(v), 0.78));
    return [['C', 0, 0, 0], ['H', ...TD[0]], ['H', ...TD[1]], ['H', ...TD[2]], ['H', ...TD[3]],
            ['O', 2.2, 0.6, 0.3], ['O', 2.95, 0.95, 0.45],
            ['O', -2.4, -0.5, -0.2], ['O', -3.15, -0.85, -0.35]];
  })(),
  b: [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1], [5, 6, 2], [7, 8, 2]],
  steps: [
    [null, { cap: '反应物：CH₄（正四面体）+ 2 个 O₂。条件：点燃。' }],
    [{}, {
      db: [[5, 6], [7, 8], [0, 1], [0, 2], [0, 3], [0, 4]],
      ar: [['b:0-1', 'a:0'], ['b:5-6', 'a:5'], ['b:7-8', 'a:7']],
      cap: '① 点燃：C–H 键与 O=O 键<b>断裂</b>，原子重新组合（断键吸能，成键放能——总结果是放热）',
    }],
    [{ 5: [1.35, 0.15, 0], 7: [-1.35, -0.15, 0],
       6: [1.5, 1.65, 0.5], 1: [2.1, 1.95, 0.55], 2: [1.0, 2.15, 0.45],
       8: [-1.5, 1.75, 0.4], 3: [-2.1, 2.05, 0.45], 4: [-0.9, 2.25, 0.35] }, {
      ab: [[0, 5, 2], [0, 7, 2], [1, 6, 1], [2, 6, 1], [3, 8, 1], [4, 8, 1]],
      txt: [[0.9, -1.0, 0.4, '放热 ∿∿']],
      cap: '② 重新组合：<b>CO₂（直线形 O=C=O）+ 2 H₂O</b>。CH₄ + 2O₂ → 点燃 → CO₂ + 2H₂O（清洁能源，含氢量高）',
    }],
  ],
},

/* 14. 氢气在氯气中燃烧 */
{
  name: '氢气在氯气中燃烧',
  eq: 'H₂ + Cl₂ →(点燃) 2 HCl',
  macro: '宏观现象：安静燃烧、发出苍白色火焰，瓶口出现白雾（HCl 遇水蒸气形成盐酸小液滴）。',
  html: `<p>氢气能在氯气中安静地燃烧，发出<b>苍白色火焰</b>，瓶口出现白雾（HCl 遇水蒸气形成的盐酸小液滴）。两类键同时断裂、两根新键同时生成——化合反应一步完成。</p>
<p>工业上对应的光照路径则是<b>爆炸式</b>链反应：光照均裂 Cl₂ 产生的 Cl· 引发链传递（见「甲烷与氯气的取代」一章）。</p>`,
  a: [['H', -0.75, 0.35, 0], ['H', -0.05, 0.6, 0.1], ['Cl', 1.6, -0.4, -0.1], ['Cl', 2.65, -0.75, -0.25]],
  b: [[0, 1, 1], [2, 3, 1]],
  steps: [
    [null, { cap: '反应物：H₂ + Cl₂（点燃，安静燃烧）。' }],
    [{ 1: [-0.35, 1.45, 0.3], 3: [3.35, -1.3, -0.5] }, {
      db: [[0, 1], [2, 3]],
      ar: [['b:0-1', 'a:0'], ['b:2-3', 'a:2']],
      cap: '① 点燃：H–H 与 Cl–Cl 两根键同时<b>断裂</b>，原子重新组合',
    }],
    [{ 2: [0.85, -0.15, 0], 3: [0.6, 1.9, 0.4] }, {
      ab: [[0, 2, 1], [1, 3, 1]],
      txt: [[0.95, 1.05, 0.6, '苍白色火焰 ∿']],
      cap: '② 两根 H–Cl 新键生成 → <b>2 HCl</b>。苍白色火焰 + 瓶口白雾（盐酸小液滴）',
    }],
  ],
},

/* 15. 铝热反应 */
{
  name: '铝热反应',
  eq: '2 Al + Fe₂O₃ →(点燃Mg条) Al₂O₃ + 2 Fe',
  macro: '宏观现象：剧烈反应、火星四射，放出的热使生成的铁熔成液态落入沙中——可用于焊接钢轨。',
  html: `<p>铝热反应是<b>最剧烈的氧化还原之一</b>：镁条引燃后，Al 夺走 Fe₂O₃ 中的氧（Al → Al³⁺ + 3e⁻，两个 Al 共转移 <b>6e⁻</b>），Fe³⁺ 被还原成<b>高温熔融的铁水</b>下坠，火花四射，温度可达 2500 °C 以上——工业上用它<b>焊接钢轨</b>。</p>`,
  a: [['Al', -2.0, 0.5, 0], ['Al', -2.0, -1.0, 0.3],
      ['Fe', 1.6, 0.6, 0], ['Fe', 1.6, -0.7, 0],
      ['O', 0.8, 0.1, 0], ['O', 2.4, 0.1, 0.2], ['O', 1.6, -1.6, -0.2]],
  b: [[2, 4, 1], [2, 5, 1], [3, 4, 1], [3, 6, 1]],
  steps: [
    [null, { cap: '铝粉与氧化铁粉末混合，插上镁条——点燃！' }],
    [{}, {
      ar: [['lp:0', 'a:2'], ['lp:1', 'a:3']],
      txt: [[-2.1, 1.3, 0, 'Al −3e⁻'], [1.35, 1.55, 0.2, 'Fe³⁺ +3e⁻']],
      chg: { 0: '³⁺', 1: '³⁺' }, lbl: { 0: 'Al³⁺', 1: 'Al³⁺', 2: 'Fe', 3: 'Fe' },
      cap: '① 镁条引燃：<b>Al 失去电子</b>（每个 Al → Al³⁺ + 3e⁻，2Al 共转移 6e⁻）；Fe³⁺ 得到电子被还原',
    }],
    [{ 2: [1.4, -1.5, -0.65], 3: [2.15, -2.3, -1.05], 4: [-0.55, 0.35, 0.1], 5: [-0.75, -0.55, 0.3], 6: [-0.5, -1.35, 0.1] }, {
      db: [[2, 4], [2, 5], [3, 4], [3, 6]],
      ab: [[0, 4, 1], [0, 5, 1], [1, 6, 1]],
      txt: [[0.4, 2.0, 0.5, '强光 ∿ 2500°C']],
      chg: { 0: '', 1: '' }, lbl: { 0: 'Al', 1: 'Al', 2: 'Fe', 3: 'Fe' },
      cap: '② Fe 熔成<b>液滴下坠</b>，强光四射；Al 变成 Al₂O₃。2Al + Fe₂O₃ → Al₂O₃ + 2Fe（铝热焊）',
    }],
  ],
},

/* __MORE_REACTIONS__ */

/* 16. SN2（双分子亲核取代，大学机理） */
{
  name: 'SN2 反应',
  eq: 'CH₃Br + OH⁻ → CH₃OH + Br⁻',
  macro: '宏观现象：碱性水溶液中溴甲烷逐渐水解成甲醇；溶液里的 Br⁻ 可用 AgNO₃ 检出（溴化银沉淀）。速率与 CH₃Br、OH⁻ 浓度都成正比。',
  html: `<p><b>双分子亲核取代（SN2）</b>：一步协同完成，速率 = k[CH₃Br][OH⁻]，对两个反应物都是一级（总二级）。关键特征：<span class="hl">亲核试剂从离去基团的背面（180°）进攻</span>，成键与断键同步进行，手性碳发生<b>构型翻转（瓦尔登翻转）</b>——像大风把伞吹翻。</p>
<p>中心碳的三个 H 像一把伞：进攻前伞面朝向溴，过渡态被压平，产物翻向另一侧。若有手性，翻转会改变旋光方向。</p>`,
  a: [['C', 0, 0, 0], ['H', -0.63, 0.63, 0], ['H', -0.63, -0.32, 0.55], ['H', -0.63, -0.32, -0.55],
      ['Br', 1.94, 0, 0], ['O', -2.7, 0, 0], ['H', -3.25, 0.42, 0.25]],
  b: [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1], [5, 6, 1]],
  steps: [
    [null, { cap: '反应物：CH₃Br + OH⁻。C–Br 键极性很强，碳带部分正电荷；三个 H 像一把伞，伞面朝向左边（溴在右边）。' }],
    [{ 5: [-1.75, 0, 0], 6: [-2.35, 0.42, 0.25], 4: [2.15, 0, 0] }, {
      ar: [['lp:5', 'a:0'], ['b:0-4', 'a:4']],
      chg: { 5: '⁻' },
      cap: '① 背面进攻：OH⁻ 的孤对电子从溴的<b>正后方（180°）</b>指向碳；C–Br 键的电子向溴转移——新键生成与旧键断裂<b>同时</b>进行',
    }],
    [{ 5: [-1.02, 0, 0], 6: [-1.62, 0.42, 0.25], 4: [2.6, 0, 0],
       1: [-0.06, 0.95, 0], 2: [-0.06, -0.48, 0.82], 3: [-0.06, -0.48, -0.82] }, {
      da: [[5, 0, 0.32], [0, 4, 0.32]],
      chg: { 5: '⁻' },
      cap: '② 五配位过渡态：O···C···Br <b>共线</b>，三个 H 被翻到与 O–C–Br 垂直的平面上——像伞被吹到水平，新键和旧键都只"一半"',
    }],
    [{ 5: [-0.62, 0.02, 0], 6: [-1.1, 0.5, 0.3], 4: [3.6, -0.15, 0.3],
       1: [0.35, 0.62, 0.32], 2: [0.35, 0.02, -0.7], 3: [0.35, -0.66, 0.35] }, {
      ab: [[5, 0, 1]], db: [[0, 4]],
      chg: { 5: '', 4: '⁻' }, lbl: { 4: 'Br⁻' },
      cap: '③ <b>构型翻转</b>：三个 H 全部翻到另一侧——瓦尔登翻转完成。C–O 键生成、Br⁻ 带着一对电子离去，得到 CH₃OH',
    }],
  ],
},

/* 17. SN1（单分子亲核取代，大学机理） */
{
  name: 'SN1 反应',
  eq: '(CH₃)₃C–Br + H₂O → (CH₃)₃C–OH + HBr',
  macro: '宏观现象：叔丁基溴在水中水解明显比溴甲烷快，且速率只与卤代烷自身浓度成正比——叔碳正离子稳定。',
  html: `<p><b>单分子亲核取代（SN1）</b>：两步进行，速率 = k[(CH₃)₃CBr]，只与卤代烷浓度有关（一级）——决速步里没有亲核试剂参加。关键中间体：<span class="hl">平面三角形的碳正离子</span>（sp²，正电荷在空 p 轨道上），三个甲基的推电子效应使其稳定。</p>
<p>叔丁基溴的中心碳背面被三个甲基挡住，SN2 难以发生，所以走 SN1。水既当溶剂又当亲核试剂。</p>`,
  a: [['C', 0, 0, 0],
      ['C', -0.77, 0.9, 0.2], ['H', -1.15, 1.62, 0.65], ['H', -0.15, 1.5, 0.75], ['H', -1.65, 1.0, -0.2],
      ['C', -0.77, -0.9, 0.2], ['H', -1.15, -1.62, 0.65], ['H', -0.15, -1.5, 0.75], ['H', -1.65, -1.0, -0.2],
      ['C', -0.77, 0, -0.95], ['H', -1.2, 0.6, -1.55], ['H', -1.2, -0.6, -1.55], ['H', -0.15, 0, -1.7],
      ['Br', 1.95, 0, 0],
      ['O', 0.9, 2.6, 0.4], ['H', 1.7, 3.0, 0.1], ['H', 0.2, 3.1, 0.55],
      ['O', -2.6, 2.4, 0.9], ['H', -2.1, 2.75, 1.55], ['H', -3.3, 3.0, 1.0]],
  b: [[0, 1, 1], [1, 2, 1], [1, 3, 1], [1, 4, 1],
      [0, 5, 1], [5, 6, 1], [5, 7, 1], [5, 8, 1],
      [0, 9, 1], [9, 10, 1], [9, 11, 1], [9, 12, 1],
      [0, 13, 1], [14, 15, 1], [14, 16, 1], [17, 18, 1], [17, 19, 1]],
  hide: [14, 15, 16, 17, 18, 19],
  steps: [
    [null, { cap: '反应物：叔丁基溴。中心碳连着三个甲基和一个 Br，背面完全被挡住——SN2 很难发生，改走 SN1 途径。' }],
    [{ 13: [3.3, -0.6, 0.2] }, {
      db: [[0, 13]], ar: [['b:0-13', 'a:13']],
      chg: { 0: '⁺' }, lbl: { 13: 'Br⁻' },
      cap: '① <b>C–Br 异裂（慢，决速步）</b>：溴带着一对电子离开，生成叔丁基碳正离子——三个甲基的推电子作用使它比较稳定',
    }],
    [{ 1: [-0.78, 1.28, 0], 5: [-0.78, -1.28, 0], 9: [-0.78, 0, -1.35],
       2: [-1.5, 1.85, 0.3], 3: [-0.25, 1.75, 0.3], 4: [-1.75, 1.1, -0.15],
       6: [-1.5, -1.85, 0.3], 7: [-0.25, -1.75, 0.3], 8: [-1.75, -1.1, -0.15],
       10: [-1.4, 0.75, -1.75], 11: [-1.4, -0.75, -1.75], 12: [-0.2, 0, -1.95] }, {
      chg: { 0: '⁺' },
      cap: '② <b>平面碳正离子</b>：中心碳 sp² 杂化，三个甲基共平面，正电荷在空的 p 轨道上——水可以从平面的<b>上方或下方</b>进攻（手性中心会消旋）',
    }],
    [{ 14: [0.05, 0.85, 0.55], 15: [0.85, 1.45, 0.7], 16: [-0.75, 1.3, 1.0] }, {
      show: [14, 15, 16], ab: [[0, 14, 1]], ar: [['lp:14', 'a:0']],
      chg: { 14: '⁺' },
      cap: '③ <b>水进攻（快）</b>：水分子的孤对电子进攻碳正离子，生成质子化的叔丁醇（氧带正电）',
    }],
    [{ 16: [-1.15, 2.15, 1.35], 17: [-1.85, 2.55, 1.15], 18: [-1.4, 2.9, 1.8], 19: [-2.6, 3.15, 1.25] }, {
      show: [17, 18, 19], db: [[14, 16]], ab: [[17, 16, 1]], ar: [['lp:17', 'a:16']],
      chg: { 14: '', 17: '⁺' }, lbl: { 17: 'H₃O⁺' },
      cap: '④ <b>去质子</b>：另一个水分子夺走质子，得到叔丁醇和 H₃O⁺。SN1 两步走：异裂生成正碳（慢）→ 亲核试剂进攻（快）；正碳是平面，两面进攻可能消旋',
    }],
  ],
},

/* 18. E2 消除（大学机理） */
{
  name: 'E2 消除',
  eq: 'CH₃CH₂Br + OH⁻ → CH₂=CH₂↑ + H₂O + Br⁻',
  macro: '宏观现象：氢氧化钾乙醇溶液加热，溴乙烷脱去 HBr 生成乙烯——气体使溴水褪色。',
  html: `<p><b>E2 消除（双分子）</b>：一步协同，碱夺取 β-H 的同时 C–Br 断裂、C=C 生成，速率 = k[CH₃CH₂Br][OH⁻]。关键构象要求：<span class="hl">被夺的 β-H 与离去的 Br 处于<b>反式共平面</b></span>（二面角 180°）——只有这个几何位置，C–H 的电子才能顺势形成 π 键。</p>
<p>强碱（如 KOH 乙醇溶液）加热时 E2 常与 SN2 竞争：卤代烷体积越大、碱性越强，消除占比越高。</p>`,
  a: [['C', 0.3, 0, 0], ['C', -1.0, 0.25, 0],
      ['H', 1.0, 0.55, 0.6], ['H', 1.05, -0.6, 0.4], ['H', 0.35, 0.1, -0.85],
      ['H', -1.75, 0.35, 0.9], ['H', -1.3, 1.15, -0.55],
      ['Br', -1.35, -0.6, -0.85],
      ['O', -2.5, 1.7, 1.2], ['H', -2.3, 2.3, 1.75]],
  b: [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1], [1, 5, 1], [1, 6, 1], [1, 7, 1], [8, 9, 1]],
  steps: [
    [null, { cap: '反应物：溴乙烷 + OH⁻（加热）。E2 一步协同，但前提是 β-H（β 碳上的 H）与 Br 处于<b>反式共平面</b>——先旋转到这个构象。' }],
    [{ 4: [0.85, 0.5, 0.5], 8: [1.7, 1.15, 1.15], 9: [1.95, 1.8, 1.7] }, {
      cap: '① 反式共平面构象：β-H 旋转到与 Br 反向（沿 C–C 轴看去二面角 180°，一上一下）；OH⁻ 靠近 β-H',
    }],
    [{ 4: [1.15, 0.8, 0.7], 8: [1.6, 1.3, 1.0], 9: [2.0, 1.95, 1.6], 7: [-1.7, -0.95, -1.25] }, {
      da: [[8, 4, 0.3], [0, 4, 0.28], [1, 7, 0.3]],
      ar: [['lp:8', 'a:4'], ['b:0-4', 'b:0-1'], ['b:1-7', 'a:7']],
      cap: '② <b>三件事同时发生</b>：OH⁻ 夺取 β-H；C–H 键的电子转移形成 π 键；C–Br 键的电子随 Br⁻ 离开——过渡态里 O···H···C 与 C···Br 同时部分成键、部分断键，C–C 已带部分双键性质',
    }],
    [{ 4: [2.15, 0.85, 0.65], 8: [2.2, 1.1, 0.95], 9: [2.75, 1.75, 1.5], 7: [-2.6, -1.8, -2.0], 0: [0.2, 0, 0], 1: [-0.95, 0.2, 0] }, {
      ab: [[0, 1, 2], [8, 4, 1]], db: [[0, 4], [1, 7]],
      chg: { 7: '⁻' }, lbl: { 7: 'Br⁻', 8: 'H₂O' },
      cap: '③ 生成<b>乙烯 + H₂O + Br⁻</b>：C=C 双键形成。E2 与 SN2 竞争——强碱、加热、大体积卤代烷有利于消除',
    }],
  ],
},

/* 19. 费歇尔酯化完整机理（大学机理） */
(() => {
  // 在酯化分子基础上补一个 H₃O⁺（索引 17-20）
  const hyd = [['O', 1.4, 2.3, 0.5], ['H', 2.15, 2.55, 0.15], ['H', 0.8, 3.05, 0.8], ['H', 1.5, 1.95, 1.2]];
  const full = [...esterMol, ...hyd];
  return {
    name: '酯化反应完整机理（费歇尔）',
    macro: '宏观现象：酯化是可逆反应——饱和碳酸钠溶液液面上出现带香味、不溶于水的油状乙酸乙酯；浓硫酸吸水促使平衡右移。',
    eq: 'CH₃COOH + C₂H₅¹⁸OH ⇌(H⁺) CH₃CO¹⁸OC₂H₅ + H₂O',
    tracerAtom: 8,
    tracerNote: '　<b>¹⁸O 示踪：五步走完，标记乙醇的 ¹⁸O 始终留在酯的 C–O 单键上；离去的水的氧来自乙酸。</b>',
    html: `<p><b>费歇尔酯化</b>：加成–消除机理，经过四面体中间体，共 5 步、<span class="hl">每一步都可逆</span>。H⁺ 在第①步被消耗、第⑤步再生——这正是它作为<b>催化剂</b>的含义。</p>
<p>五步：① 羰基质子化（羰基碳正电性增强，好被弱亲核试剂进攻）→ ② 乙醇加成 → ③ 质子转移（把 –OH 变成好的离去基团 –OH₂⁺）→ ④ 脱水 → ⑤ 去质子、催化剂再生。高中版的简化机理（第一章）就是这五步的压缩。</p>`,
    lbl: { 17: 'H₃O⁺' },
    a: full,
    b: [...[[0, 1, 1], [1, 2, 2], [1, 3, 1], [3, 4, 1], [0, 5, 1], [0, 6, 1], [0, 7, 1],
      [8, 9, 1], [9, 10, 1], [8, 11, 1], [9, 12, 1], [9, 13, 1], [10, 14, 1], [10, 15, 1], [10, 16, 1]],
      [17, 18, 1], [17, 19, 1], [17, 20, 1]],
    steps: [
      [null, { cap: '反应物：乙酸、¹⁸O 标记的乙醇和催化剂 H₃O⁺。整个循环每一步都可逆——浓硫酸吸水、蒸出酯都是让平衡右移的手段。' }],
      [{ 18: [-0.85, 1.62, 0.15] }, {
        db: [[17, 18]], ab: [[2, 18, 1]], ar: [['b:17-18', 'a:2']],
        chg: { 2: '⁺', 17: '' }, lbl: { 17: 'H₂O' },
        cap: '① <b>羰基质子化</b>：H₃O⁺ 把 H⁺ 交给羰基氧——羰基碳的正电性大大增强，更容易被弱亲核试剂（乙醇）进攻',
      }],
      [(() => {
        const p = {};
        [8, 9, 10, 11, 12, 13, 14, 15, 16].forEach((i) => { p[i] = etShifted(i, [-1.9, 0.5, 0.1]); });
        return p;
      })(), {
        db: [[1, 2]], ab: [[1, 8, 1]],
        ar: [['lp:8', 'a:1'], ['b:1-2', 'a:2']],
        chg: { 2: '', 8: '⁺' },
        cap: '② <b>乙醇加成</b>：乙醇的 ¹⁸O 孤对进攻羰基碳，π 电子转回氧 → 四面体中间体（醇氧带正电）',
      }],
      [{ 11: [-0.25, -0.98, 0.2] }, {
        db: [[8, 11]], ab: [[3, 11, 1]], ar: [['b:8-11', 'a:3']],
        chg: { 3: '⁺', 8: '' },
        cap: '③ <b>质子转移</b>：质子从 ¹⁸O 转到原羧基的 –OH 上，把它变成好的离去基团 –OH₂⁺',
      }],
      [{ 3: [-0.4, -2.3, 0.9], 4: [-1.05, -2.6, 0.6], 11: [0.25, -2.15, 1.25] }, {
        db: [[1, 3]], ab: [[1, 2, 2]],
        ar: [['b:1-3', 'a:3']],
        chg: { 3: '', 8: '', 2: '⁺' },
        cap: '④ <b>脱水</b>：C=O 重新形成，一分子水离开——注意：<b>离开的水的氧来自乙酸</b>（不是标记的乙醇）',
      }],
      [{ 18: [2.15, 2.55, 0.15] }, {
        db: [[2, 18]], ab: [[17, 18, 1]], ar: [['b:2-18', 'a:17']],
        chg: { 2: '', 17: '⁺' }, lbl: { 17: 'H₃O⁺' },
        cap: '⑤ <b>去质子，催化剂再生</b>：H₂O 夺回 H⁺，得到乙酸乙酯，H₃O⁺ 再生。整个过程每一步都可逆——这就是"催化"的完整含义',
      }],
    ],
  };
})(),
];

/* ---------------- 随堂检测 ---------------- */

const QUIZ = [
  {
    q: '机理图中弯箭头（curly arrow）的含义是？',
    opts: ['原子移动的路径', '电子对（电子流）的转移方向', '反应放热方向', '化学键的旋转方向'],
    a: 1,
    ex: '弯箭头从提供电子的位点（σ 键/孤对/负电荷）出发，指向电子受体（成键或断键位置），表示一对电子的流向——箭头尾是电子的"来处"，箭头头是"去处"。',
  },
  {
    q: '¹⁸O 标记乙醇（C₂H₅¹⁸OH）与乙酸酯化，¹⁸O 出现在哪里？',
    opts: ['生成的水中', '酯的 C–O 单键氧上', '酯的羰基氧上', '随机分布'],
    a: 1,
    ex: '同位素示踪证明「酸脱羟基、醇脱氢」：水中的氧来自乙酸的羟基，乙醇的 ¹⁸O 保留在酯的 C–O 单键上。',
  },
  {
    q: 'SN2 与 SN1 机理的主要区别是？',
    opts: ['SN2 一步完成且构型翻转；SN1 两步经正碳离子中间体，可能消旋', 'SN2 需要光照；SN1 不需要', 'SN2 只发生在芳环上', 'SN1 的反应速率与亲核试剂浓度成正比'],
    a: 0,
    ex: 'SN2（双分子）：亲核试剂背面进攻、断键与成键同步、Walden 构型翻转；SN1（单分子）：先异裂生成正碳离子（决速步），再被亲核试剂从任意一面进攻，得到消旋化产物。',
  },
  {
    q: '甲烷与氯气的取代反应需要的条件是？',
    opts: ['高温高压', '催化剂', '光照（或加热）引发', '电解'],
    a: 2,
    ex: '光照使 Cl–Cl 键均裂产生氯自由基（Cl·），引发自由基链式反应：链引发→链传递（·CH₃ + Cl₂ → CH₃Cl + Cl·）→链终止。',
  },
  {
    q: '铝热反应 2Al + Fe₂O₃ → Al₂O₃ + 2Fe 中，转移电子的总数是？',
    opts: ['2 个', '3 个', '6 个', '9 个'],
    a: 2,
    ex: 'Al 从 0 → +3，每个 Al 失 3e⁻，2 个 Al 共失 6e⁻；2 个 Fe³⁺ 各得 3e⁻ 共得 6e⁻。氧化还原中得失电子总数相等，均为 6。',
  },
];

function showQuiz() {
  let idx = 0;
  let score = 0;
  const panel = document.createElement('div');
  panel.className = 'quiz-panel';
  stage.appendChild(panel);
  st.quizPanel = panel;
  capEl.style.display = 'none';

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
      <p style="color:var(--text-dim);margin:4px 0 18px">正确率 ${pct}%${pct >= 80 ? '，反应机理你已经掌握了！' : pct >= 60 ? '，大部分概念已经清楚，回顾一下错题。' : '，建议回到前面章节再看一遍哦。'}</p>`;
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
    row.appendChild(back);
    row.appendChild(again);
    card.appendChild(row);
    panel.appendChild(card);
  }

  renderQ();
}

/* ---------------- 章节装配与启动 ---------------- */

const SECTIONS = REACTIONS.map((rx, i) => ({
  title: rx.name,
  html: `<p style="font-family:${FONT}"><b style="color:var(--accent)">${rx.eq}</b></p>` + rx.html
    + (rx.macro ? `<p style="color:var(--text-dim)">${rx.macro}</p>` : ''),
  enter() { enterReaction(i); },
}));
SECTIONS.push({
  title: '随堂检测',
  html: '<p>5 道选择题：弯箭头含义、¹⁸O 示踪结论、SN1/SN2 区别、自由基取代条件、氧化还原电子转移数。</p>',
  enter() {
    if (st.quizPanel) { st.quizPanel.remove(); st.quizPanel = null; }
    capEl.style.display = 'none';
    if (st.hudWrap) { st.hudWrap.remove(); st.hudWrap = null; st.hud = null; }
    ctl.clear();
    // 留一个空场景即可
    showQuiz();
  },
});

loadAll([]).then(() => {
  labReady = true;
  loader.hide();
  const sections = createSections({
    nav: document.getElementById('sideNav'),
    descPanel: document.getElementById('descPanel'),
    sections: SECTIONS,
    onSelect(i, sec) { sec.enter(); },
  });
  window.__eduSections = sections;
  sections.select(0);
});
