/* EduLab · 立体几何实验室（geo）
 * 章节：几何体认识 / 展开与折叠 / 三视图与直观图 / 截面 / 空间角 / 空间向量与坐标 / 外接球与内切球 / 正四面体 / 随堂检测
 * 实现：three.js 程序化几何体（半透明面 + 棱线）；正方体 11 种展开图由折叠引擎自动验证生成；
 *       截面 = 平面×棱求交排序成多边形；三视图/斜二测用 CanvasTexture 面板。
 */
import {
  THREE, DEG, TAU, clamp,
  createApp, cameraTweenTick, makeLoader,
  createSections, createControlsPanel, makeHUD, makeTextSprite, setSpriteText,
} from './edu-core.js';

/* ---------------- 场景 ---------------- */

const stage = document.getElementById('stage');
const loader = makeLoader(stage, '正在搭建立体几何实验室…');
const app = createApp({
  container: stage,
  fov: 45,
  cameraPos: [4.6, 3.4, 5.6],
  target: [0, 1, 0],
  minDistance: 1.2,
  maxDistance: 60,
  toneMapping: THREE.NoToneMapping,
});
const { scene, camera, controls } = app;
scene.add(new THREE.AmbientLight(0xffffff, 0.9));
const dl = new THREE.DirectionalLight(0xffffff, 0.9);
dl.position.set(4, 7, 5);
scene.add(dl);

const COL = { accent: 0xe8674a, blue: 0x4a90d9, green: 0x3fa96f, gold: 0xd9a13f, purple: 0x9b6fd9, teal: 0x2fb3a5, dim: 0x8a94a3 };
const FACE_OPACITY = 0.16;

/* ---------------- 通用工具 ---------------- */

function faceMat(color) {
  return new THREE.MeshStandardMaterial({ color, transparent: true, opacity: FACE_OPACITY, side: THREE.DoubleSide, roughness: 0.7, depthWrite: false });
}
function makeEdges(geo, color = COL.dim, opacity = 0.85) {
  return new THREE.LineSegments(new THREE.EdgesGeometry(geo, 8), new THREE.LineBasicMaterial({ color, transparent: true, opacity }));
}
function dot(pos, color = COL.accent, r = 0.05) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 12), new THREE.MeshBasicMaterial({ color }));
  m.position.copy(pos);
  return m;
}
function label3(text, color, scale = 0.0058) {
  return makeTextSprite(text, { fontSize: 38, color, scale });
}
function clearGroup(g) {
  g.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) o.material.dispose?.();
  });
  g.clear();
}
/** 棱上取点：a→b 比例 t */
function onEdge(a, b, t) {
  return new THREE.Vector3().lerpVectors(a, b, t);
}

/* ---------------- 章节框架 ---------------- */

const ctl = createControlsPanel(document.getElementById('controls'));
const hud = makeHUD(stage, [['v1', '读数'], ['v2', ''], ['v3', '']]);
hud.show(false);
const world = new THREE.Group();   // 每章内容挂这里
scene.add(world);
let activeCleanup = null;
let chapterTick = null;
let autoRotate = false;

function camTo(pos, target) { app.setCamera(pos, target); }

/* ================= 章节 1：几何体认识 ================= */

function solidCube(s = 2) {
  const g = new THREE.Group();
  const geo = new THREE.BoxGeometry(s, s, s);
  const mesh = new THREE.Mesh(geo, faceMat(0x4a90d9));
  mesh.position.y = s / 2;
  const edges = makeEdges(geo);
  edges.position.y = s / 2;
  g.add(mesh, edges);
  return { group: g, V: 8, E: 12, F: 6 };
}
function solidPrism(s = 2) {
  const g = new THREE.Group();
  const shape = new THREE.Shape();
  shape.moveTo(-s * 0.6, 0); shape.lineTo(s * 0.6, 0); shape.lineTo(0, s);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: s, bevelEnabled: false });
  const mesh = new THREE.Mesh(geo, faceMat(0x3fa96f));
  mesh.position.set(0, 0, -s / 2);
  const edges = makeEdges(geo);
  edges.position.set(0, 0, -s / 2);
  g.add(mesh, edges);
  return { group: g, V: 6, E: 9, F: 5 };
}
function solidPyramid(s = 2) {
  const g = new THREE.Group();
  const geo = new THREE.ConeGeometry(s * 0.75, s, 4, 1);
  const mesh = new THREE.Mesh(geo, faceMat(0xd9a13f));
  mesh.position.y = s / 2;
  mesh.rotation.y = Math.PI / 4;
  const edges = makeEdges(geo, COL.dim, 0.85);
  edges.position.y = s / 2;
  edges.rotation.y = Math.PI / 4;
  g.add(mesh, edges);
  return { group: g, V: 5, E: 8, F: 5 };
}
function solidCylinder(s = 2) {
  const g = new THREE.Group();
  const geo = new THREE.CylinderGeometry(s * 0.45, s * 0.45, s, 48, 1, true);
  const mesh = new THREE.Mesh(geo, faceMat(0x9b6fd9));
  mesh.position.y = s / 2;
  g.add(mesh);
  for (const y of [0, s]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(s * 0.45, 0.012, 8, 64), new THREE.MeshBasicMaterial({ color: COL.dim }));
    ring.rotation.x = Math.PI / 2;
    ring.position.y = y;
    g.add(ring);
  }
  const r = s * 0.45;
  const N = 12;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * TAU;
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r),
      new THREE.Vector3(Math.cos(a) * r, s, Math.sin(a) * r),
    ]), new THREE.LineBasicMaterial({ color: COL.dim, transparent: true, opacity: 0.3 }));
    g.add(line);
  }
  return { group: g, V: 0, E: 0, F: 3 };
}
function solidCone(s = 2) {
  const g = new THREE.Group();
  const geo = new THREE.ConeGeometry(s * 0.5, s, 48, 1, true);
  const mesh = new THREE.Mesh(geo, faceMat(0x2fb3a5));
  mesh.position.y = s / 2;
  g.add(mesh);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(s * 0.5, 0.012, 8, 64), new THREE.MeshBasicMaterial({ color: COL.dim }));
  ring.rotation.x = Math.PI / 2;
  g.add(ring);
  return { group: g, V: 1, E: 0, F: 2 };
}
function solidSphere(s = 2) {
  const g = new THREE.Group();
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(s / 2, 48, 32), faceMat(0xe8674a));
  mesh.position.y = s / 2;
  const wire = new THREE.Mesh(new THREE.SphereGeometry(s / 2 * 1.002, 24, 16), new THREE.MeshBasicMaterial({ color: COL.dim, wireframe: true, transparent: true, opacity: 0.28 }));
  wire.position.y = s / 2;
  g.add(mesh, wire);
  return { group: g, V: 0, E: 0, F: 1 };
}

const SOLIDS = {
  cube: { name: '正方体', make: solidCube, curved: false },
  prism: { name: '三棱柱', make: solidPrism, curved: false },
  pyramid: { name: '四棱锥', make: solidPyramid, curved: false },
  cylinder: { name: '圆柱', make: solidCylinder, curved: true },
  cone: { name: '圆锥', make: solidCone, curved: true },
  sphere: { name: '球', make: solidSphere, curved: true },
};

const secSolids = {
  id: 'solids', title: '几何体认识',
  html: `<p>旋转观察常见几何体：<b>棱柱、棱锥</b>由平面围成（多面体）；<b>圆柱、圆锥、球</b>含曲面（旋转体）。</p>
<p>多面体有一条著名规律——<span class="hl">欧拉公式 V − E + F = 2</span>（顶点数 − 棱数 + 面数 = 2）。正方体 8−12+6=2，三棱柱 6−9+5=2，四棱锥 5−8+5=2……一律成立。</p>
<p>切换几何体核对计数（旋转体棱与顶点的计数约定不同，公式只对简单多面体成立）。打开「自动旋转」慢慢看。</p>`,
  enter() {
    clearGroup(world);
    camTo([4.2, 3.0, 5.2], [0, 1, 0]);
    hud.show(true);
    ctl.clear();
    let current = null;
    const build = (key) => {
      clearGroup(world);
      const s = SOLIDS[key].make(2);
      world.add(s.group);
      current = { key, s };
    };
    build('cube');
    ctl.seg({
      options: Object.keys(SOLIDS).map((k) => ({ label: SOLIDS[k].name, value: k })),
      value: 'cube',
      onChange: build,
    });
    ctl.sep();
    ctl.toggle({ label: '自动旋转', value: false, onChange: (v) => { autoRotate = v; } });
    chapterTick = () => {
      if (!current) return;
      const { key, s } = current;
      const info = SOLIDS[key];
      hud.set('v1', `${info.name}：V=${s.V}  E=${s.E}  F=${s.F}`);
      hud.set('v2', info.curved ? '旋转体（含曲面），欧拉公式不适用' : `V − E + F = ${s.V - s.E + s.F} ✓`);
      hud.set('v3', '拖拽旋转 · 滚轮缩放');
    };
  },
};

/* ================= 章节 2：展开与折叠 ================= */

/** 枚举全部自由六连方（35 种），交给折叠引擎验证 → 能折成正方体的恰为 11 种 */
function candidateNets() {
  const seen = new Set();
  const shapes = [];
  const key = (cells) => {
    // 8 种对称 + 平移归零 + 排序（canonical 与外部一致用 8 对称）
    const sym = [[1,0,0,1],[-1,0,0,1],[1,0,0,-1],[-1,0,0,-1],[0,1,1,0],[0,-1,1,0],[0,1,-1,0],[0,-1,-1,0]];
    let best = null;
    for (const s of sym) {
      const pts = cells.map(([x, y]) => [s[0] * x + s[1] * y, s[2] * x + s[3] * y]);
      const mx = Math.min(...pts.map((p) => p[0]));
      const my = Math.min(...pts.map((p) => p[1]));
      const k = pts.map(([x, y]) => (x - mx) + ',' + (y - my)).sort().join(';');
      if (best === null || k < best) best = k;
    }
    return best;
  };
  const grow = (cells) => {
    const k = key(cells);
    if (seen.has(k)) return;
    seen.add(k);
    if (cells.length === 6) { shapes.push(cells); return; }
    for (const [cx, cy] of cells) {
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const q = [cx + dx, cy + dy];
        if (!cells.some((p) => p[0] === q[0] && p[1] === q[1])) grow([...cells, q]);
      }
    }
  };
  grow([[0, 0]]);
  return shapes;
}

/** 折叠验证：把格位网折起来，检验 6 个面法向是否为 ±x±y±z 且中心构成正方体 */
function validateNet(cells) {
  // BFS 建树（相邻 = 曼哈顿距离 1）
  const key = (p) => p[0] + ',' + p[1];
  const set = new Map(cells.map((p) => [key(p), p]));
  const base = cells[0];
  const parent = new Map([[key(base), null]]);
  const queue = [base];
  while (queue.length) {
    const p = queue.shift();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const q = [p[0] + dx, p[1] + dy];
      if (set.has(key(q)) && !parent.has(key(q))) {
        parent.set(key(q), { from: p, dir: [dx, dy] });
        queue.push(q);
      }
    }
  }
  if (parent.size !== 6) return null;
  // 模拟折叠：面片用四元数链。face 平面 z=0，法向 +z。
  const S = 1;
  const state = new Map(); // key → {pos: Vector3(中心), quat: Quaternion}
  state.set(key(base), { pos: new THREE.Vector3(0, 0, 0), quat: new THREE.Quaternion() });
  const order = [base];
  while (order.length) {
    const p = order.shift();
    for (const [k, info] of parent) {
      if (info && key(info.from) === key(p) && !state.has(k)) {
        const q = set.get(k);
        const dir = info.dir;
        const ps = state.get(key(p));
        // 铰链在父面局部 (dir·s/2)，子面中心相对铰链再偏 dir·s/2
        const hingeLocal = new THREE.Vector3(dir[0] * S / 2, dir[1] * S / 2, 0).applyQuaternion(ps.quat).add(ps.pos);
        // 折 90°：绕铰链轴（局部 x 或 y）——直接构造子面最终位姿
        let quat;
        if (dir[1] === 1) quat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2);
        else if (dir[1] === -1) quat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);
        else if (dir[0] === 1) quat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI / 2);
        else quat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);
        quat.premultiply(ps.quat);
        const centerOffset = new THREE.Vector3(dir[0] * S / 2, dir[1] * S / 2, 0).applyQuaternion(quat);
        state.set(k, { pos: hingeLocal.clone().add(centerOffset), quat });
        order.push(q);
      }
    }
  }
  // 检验
  const normals = new Set();
  const centers = [];
  for (const [, s] of state) {
    const n = new THREE.Vector3(0, 0, 1).applyQuaternion(s.quat);
    normals.add([+n.x.toFixed(2), +n.y.toFixed(2), +n.z.toFixed(2)].join('|'));
    centers.push(s.pos.clone());
  }
  if (normals.size !== 6) return false;
  const c0 = centers[0];
  const d2 = centers.slice(1).map((c) => +c.distanceToSquared(c0).toFixed(3));
  // 其余五个面心到首个面心的距离平方 ∈ {0.5s²（相邻）, 1s²（相对）}
  return d2.every((d) => [0.5, 1].includes(d));
}

/** 网格形状规范形（4 种旋转 + 平移归零 + 排序），用于去重（镜像按惯例算不同展开图） */
function canonicalGrid(cells) {
  const sym = [[1, 0, 0, 1], [0, 1, -1, 0], [-1, 0, 0, -1], [0, -1, 1, 0]];
  let best = null;
  for (const [a, b, c, d] of sym) {
    const pts = cells.map(([x, y]) => [a * x + b * y, c * x + d * y]);
    const mx = Math.min(...pts.map((p) => p[0]));
    const my = Math.min(...pts.map((p) => p[1]));
    const key = pts.map(([x, y]) => `${x - mx},${y - my}`).sort().join(';');
    if (best === null || key < best) best = key;
  }
  return best;
}

const NETS = (() => {
  const seen = new Set();
  const out = [];
  candidateNets().forEach((cells) => {
    if (!validateNet(cells)) return;
    const canon = canonicalGrid(cells);
    if (seen.has(canon)) return;
    seen.add(canon);
    out.push(cells);
  });
  return out;
})();

const nf = { which: 0, t: 1, playing: false, colors: [0x4a90d9, 0x3fa96f, 0xd9a13f, 0x9b6fd9, 0x2fb3a5, 0xe8674a] };

function buildNetGroup(cells) {
  const S = 1;
  const root = new THREE.Group();
  const key = (p) => p[0] + ',' + p[1];
  const set = new Map(cells.map((p) => [key(p), p]));
  // 树
  const parent = new Map();
  const base = cells.reduce((m, p) => (p[1] < m[1] || (p[1] === m[1] && p[0] < m[0]) ? p : m), cells[0]);
  parent.set(key(base), null);
  const queue = [base];
  while (queue.length) {
    const p = queue.shift();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const q = [p[0] + dx, p[1] + dy];
      if (set.has(key(q)) && !parent.has(key(q))) {
        parent.set(key(q), { from: p, dir: [dx, dy] });
        queue.push(q);
      }
    }
  }
  // depth
  const depth = new Map([[key(base), 0]]);
  [...parent.keys()].forEach(() => {
    parent.forEach((info, k) => {
      if (info && depth.has(key(info.from)) && !depth.has(k)) depth.set(k, depth.get(key(info.from)) + 1);
    });
  });
  // 层级建模：每个面一个 pivot（含 mesh），子 pivot 挂在父 pivot 内铰链处
  const pivots = new Map();
  const geo = new THREE.PlaneGeometry(S, S);
  const makeFace = (p, color) => {
    const pivot = new THREE.Group();
    const mesh = new THREE.Mesh(geo, faceMat(color));
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: COL.dim, transparent: true, opacity: 0.9 }));
    pivot.add(mesh, edges);
    return pivot;
  };
  const buildPivot = (p) => {
    const k = key(p);
    if (pivots.has(k)) return pivots.get(k);
    const info = parent.get(k);
    const pivot = makeFace(p, nf.colors[depth.get(k) % 6]);
    pivot.userData.dir = info ? info.dir : null;
    pivot.userData.depth = depth.get(k);
    if (info) {
      const parentNode = buildPivot(info.from);
      // 铰链位于父面边缘中点：先平移到铰链，再反向平移半格（使 mesh 中心位于铰链另一侧）
      const hinge = new THREE.Group();
      hinge.position.set(info.dir[0] * S / 2, info.dir[1] * S / 2, 0);
      const inner = new THREE.Group();
      inner.position.set(0, 0, 0);
      hinge.add(inner);
      inner.add(pivot);
      pivot.position.set(0, 0, 0);
      // mesh 在 pivot 局部位于 +dir/2（铰链指向子面中心）
      pivot.children.forEach((ch) => { ch.position.set(info.dir[0] * S / 2, info.dir[1] * S / 2, 0); });
      parentNode.add(hinge);
      pivot.userData.hinge = hinge;
    }
    pivots.set(k, pivot);
    return pivot;
  };
  cells.forEach(buildPivot);
  root.add(pivots.get(key(base)));
  return { root, pivots, depth, key };
}

function applyFold(folded, t) {
  const { pivots } = folded;
  pivots.forEach((pivot) => {
    const { dir, depth = 0, hinge } = pivot.userData;
    if (!dir || !hinge) return;
    const local = clamp(t * 1.55 - depth * 0.18, 0, 1);
    const ang = (1 - Math.pow(1 - local, 3)) * Math.PI / 2;
    if (dir[1] === 1) hinge.rotation.x = ang;
    else if (dir[1] === -1) hinge.rotation.x = -ang;
    else if (dir[0] === 1) hinge.rotation.y = -ang;
    else hinge.rotation.y = ang;
  });
}

const secNet = {
  id: 'net', title: '展开与折叠',
  html: `<p>正方体沿棱剪开铺平，得到<b>展开图</b>。六个正方形连成一排的"日字六连方"有 35 种，但只有 <span class="hl">11 种能折成正方体</span>——本实验的每一种都经过程序自动折叠验证。</p>
<p>规律速记：「一线四格，两侧各一」基本都能折；<b>田字形（2×2）</b>和<b>五连方 + 侧挂</b>有重合面，折不出来（凹形 L 六连也不行）。</p>
<p>拖动「折叠」滑杆看 11 种展开图如何合拢成正方体；切换编号对比结构；「自动折叠」逐个演示。灰色棱是最终的正方体参考线框。</p>`,
  enter() {
    clearGroup(world);
    autoRotate = false;
    Object.assign(nf, { which: 0, t: 1, playing: false });
    camTo([2.6, 2.2, 3.4], [0, 1, 0]);
    hud.show(true);
    ctl.clear();
    let folded = null;
    let refCube = null;
    const rebuild = () => {
      clearGroup(world);
      folded = buildNetGroup(NETS[nf.which]);
      const cells = NETS[nf.which];
      const cx = cells.reduce((s, p) => s + p[0], 0) / 6;
      const cy = cells.reduce((s, p) => s + p[1], 0) / 6;
      folded.root.position.set(-cx, -cy + 1.6, 0);
      world.add(folded.root);
      applyFold(folded, nf.t);
      if (refCube) { refCube.geometry.dispose(); world.remove(refCube); }
      refCube = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)),
        new THREE.LineBasicMaterial({ color: COL.dim, transparent: true, opacity: 0.25 })
      );
      refCube.position.set(0, 1.6, 0);
      world.add(refCube);
    };
    rebuild();
    ctl.seg({
      options: NETS.map((_, i) => ({ label: String(i + 1), value: String(i) })),
      value: '0',
      onChange: (v) => { nf.which = +v; rebuild(); },
    });
    ctl.sep();
    ctl.slider({ label: '折叠', min: 0, max: 1, step: 0.01, value: 1, fmt: (v) => Math.round(v * 100) + '%', onInput: (v) => { nf.t = v; nf.playing = false; applyFold(folded, nf.t); } });
    const playBtn = ctl.button({
      label: '▶ 自动折叠',
      onClick() { nf.playing = !nf.playing; playBtn.classList.toggle('active', nf.playing); },
    });
    ctl.toggle({ label: '自动旋转', value: false, onChange: (v) => { autoRotate = v; } });
    chapterTick = (dt) => {
      if (nf.playing) {
        nf.t += dt * 0.35;
        if (nf.t >= 1.55) { nf.t = 0; nf.which = (nf.which + 1) % NETS.length; rebuild(); }
        applyFold(folded, nf.t);
        const input = ctl.el.querySelectorAll('input[type=range]')[0];
        if (input) input.value = Math.min(1, nf.t);
      }
      hud.set('v1', `展开图 ${nf.which + 1} / ${NETS.length} 种`);
      hud.set('v2', `折叠 ${Math.round(Math.min(1, nf.t) * 100)}%`);
      hud.set('v3', '六面各绕一条棱折 90° 合拢');
    };
  },
};

/* ================= 章节 3：三视图与直观图 ================= */

const LAYOUTS = {
  stair: { name: '阶梯形', cells: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [1, 1, 0], [1, 1, 1], [0, 0, 1], [0, 1, 1], [1, 2, 0]] },
  lshape: { name: 'L 形', cells: [[0, 0, 0], [1, 0, 0], [2, 0, 0], [0, 0, 1], [0, 1, 0], [0, 1, 1]] },
  crossT: { name: 'T 形', cells: [[0, 0, 0], [1, 0, 0], [2, 0, 0], [1, 0, 1], [1, 1, 1]] },
  tower: { name: '双柱', cells: [[0, 0, 0], [0, 0, 1], [0, 0, 2], [2, 0, 1], [2, 0, 2], [1, 0, 0]] },
};

function buildCubes(cells, size = 0.8) {
  const g = new THREE.Group();
  const geo = new THREE.BoxGeometry(size, size, size);
  cells.forEach(([x, y, z]) => {
    const mesh = new THREE.Mesh(geo, faceMat(0x4a90d9));
    mesh.position.set((x - 1) * size, (y + 0.5) * size, (z - 1) * size);
    const edges = makeEdges(geo, COL.dim, 0.8);
    edges.position.copy(mesh.position);
    g.add(mesh, edges);
  });
  return g;
}

/** 画三视图 canvas：w×h 格子，occupied = 布尔矩阵 */
function drawView(canvas, occupied, title) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  const rows = occupied.length, cols = occupied[0].length;
  const cell = Math.min((W - 20) / cols, (H - 34) / rows);
  const ox = (W - cell * cols) / 2, oy = (H - cell * rows) / 2 + 8;
  const cs = getComputedStyle(document.documentElement);
  const dark = document.documentElement.getAttribute('data-theme') === 'dark';
  ctx.fillStyle = dark ? 'rgba(255,255,255,0.05)' : 'rgba(20,32,44,0.05)';
  ctx.strokeStyle = dark ? 'rgba(255,255,255,0.25)' : 'rgba(20,32,44,0.3)';
  ctx.lineWidth = 1;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const x = ox + c * cell, y = oy + (rows - 1 - r) * cell;
    ctx.fillStyle = occupied[r][c] ? (dark ? 'rgba(232,103,74,0.75)' : 'rgba(232,103,74,0.7)') : (dark ? 'rgba(255,255,255,0.05)' : 'rgba(20,32,44,0.05)');
    ctx.fillRect(x, y, cell, cell);
    ctx.strokeRect(x, y, cell, cell);
  }
  ctx.fillStyle = dark ? '#c9d4de' : '#4a5560';
  ctx.font = '600 15px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, W / 2, 20);
}

const sv = { which: 'stair' };

const secViews = {
  id: 'views', title: '三视图与直观图',
  html: `<p>用小正方体搭出组合体，从<b>正面、左面、上面</b>三个方向平行投影，得到的轮廓就是<b>三视图</b>（主视图 / 左视图 / 俯视图）——工程图纸的语言。右侧三块面板实时刷新。</p>
<p><b>斜二测直观图</b>（画法：横不变、纵减半、角取 45°）在第四块面板：组合体"躺着"的样子，立体感来自 45° 的深度方向。</p>
<p>切换四种组合体，对照实物与三块投影：主视图看 x-z，左视图看 z-y，俯视图看 x-z 的顶视（x-y）。</p>`,
  enter() {
    clearGroup(world);
    autoRotate = false;
    Object.assign(sv, { which: 'stair' });
    ctl.clear();
    camTo([5.6, 3.6, 2.6], [0.9, 1.2, 0]);
    hud.show(true);
    const panels = {};
    const panelDefs = [['front', '主视图'], ['left', '左视图'], ['top', '俯视图'], ['oblique', '斜二测直观图']];
    panelDefs.forEach(([name]) => {
      const cv = document.createElement('canvas');
      cv.width = 256; cv.height = 210;
      panels[name] = cv;
    });
    const meshes = {};
    const panelWall = [  // 2×2 面板墙（x = 3.4 平面，朝 +x，正对初始相机）
      ['front', 3.4, 2.1, -0.85], ['left', 3.4, 2.1, 0.85],
      ['top', 3.4, 0.5, -0.85], ['oblique', 3.4, 0.5, 0.85],
    ];
    const refreshPanels = () => {
      const cells = LAYOUTS[sv.which].cells;
      // 主视图：x-z（最大 y 投影）
      const maxX = 3, maxZ = 2, maxY = Math.max(...cells.map((c) => c[1])) + 1;
      const front = Array.from({ length: maxY }, () => Array(maxX).fill(false));
      const left = Array.from({ length: maxY }, () => Array(maxZ).fill(false));
      const top = Array.from({ length: maxZ }, () => Array(maxX).fill(false));
      cells.forEach(([x, y, z]) => { front[y][x] = true; left[y][z] = true; top[z][x] = true; });
      drawView(panels.front, front, '主视图');
      drawView(panels.left, left, '左视图');
      drawView(panels.top, top, '俯视图');
      drawOblique(panels.oblique, cells, '斜二测直观图');
      Object.entries(meshes).forEach(([k, m]) => {
        const tex = new THREE.CanvasTexture(panels[k]);
        tex.colorSpace = THREE.SRGBColorSpace;
        m.material.map.dispose();
        m.material.map = tex;
        m.material.needsUpdate = true;
      });
    };
    function drawOblique(cv, cells, title) {
      const ctx = cv.getContext('2d');
      const W = cv.width, H = cv.height;
      ctx.clearRect(0, 0, W, H);
      const cs = getComputedStyle(document.documentElement);
      const dark = document.documentElement.getAttribute('data-theme') === 'dark';
      const size = 44;
      const ox = W / 2 - size * 1.5 + 8, oy = H - 64;
      const s2 = size * 0.5;    // 纵减半
      const ang = -Math.PI / 4; // 45°
      const px = (x, y, z) => [ox + x * size + z * Math.cos(ang) * s2, oy - y * size - z * Math.sin(ang) * s2 * -1];
      // 可见性：按 y 从低到高画（画家算法，够用）
      const sorted = [...cells].sort((a, b) => a[1] - b[1]);
      sorted.forEach(([x, y, z]) => {
        // 画顶面、前面、右面（斜二测可见三面）
        const col = dark ? 'rgba(232,103,74,0.55)' : 'rgba(232,103,74,0.65)';
        const colTop = dark ? 'rgba(232,103,74,0.4)' : 'rgba(232,103,74,0.5)';
        const colSide = dark ? 'rgba(232,103,74,0.3)' : 'rgba(232,103,74,0.38)';
        const [x0, y0] = px(x, y, z);
        const p1 = [x0, y0], p2 = [x0 + size, y0], p3 = [x0 + size, y0 - size];
        const p4 = [x0, y0 - size];
        const d = [Math.cos(ang) * s2, Math.sin(ang) * s2 * -1 + s2 * 0];
        const dv = [Math.cos(ang) * s2, Math.sin(ang) * s2];
        // 前面
        ctx.fillStyle = col;
        ctx.beginPath(); ctx.moveTo(...p1); ctx.lineTo(...p2); ctx.lineTo(...p3); ctx.lineTo(...p4); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = dark ? '#e4ebf1' : '#2a3441'; ctx.lineWidth = 1.2; ctx.stroke();
        // 顶面
        ctx.fillStyle = colTop;
        ctx.beginPath(); ctx.moveTo(...p4); ctx.lineTo(...p3); ctx.lineTo(p3[0] + dv[0], p3[1] - dv[1]); ctx.lineTo(p4[0] + dv[0], p4[1] - dv[1]); ctx.closePath(); ctx.fill(); ctx.stroke();
        // 右面
        ctx.fillStyle = colSide;
        ctx.beginPath(); ctx.moveTo(...p2); ctx.lineTo(p2[0] + dv[0], p2[1] - dv[1]); ctx.lineTo(p3[0] + dv[0], p3[1] - dv[1]); ctx.lineTo(...p3); ctx.closePath(); ctx.fill(); ctx.stroke();
      });
      ctx.fillStyle = dark ? '#c9d4de' : '#4a5560';
      ctx.font = '600 15px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(title, W / 2, 20);
    }
    panelWall.forEach(([name, px, py, pz]) => {
      const tex = new THREE.CanvasTexture(panels[name]);
      tex.colorSpace = THREE.SRGBColorSpace;
      const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1.75, 1.44), mat);
      mesh.position.set(px, py, pz);
      mesh.rotation.y = Math.PI / 2;   // 面板法向 +x，正对相机初始方向
      world.add(mesh);
      meshes[name] = mesh;
    });
    let cubes = null;
    const rebuild = () => {
      if (cubes) clearGroup(cubes), world.remove(cubes);
      cubes = buildCubes(LAYOUTS[sv.which].cells);
      world.add(cubes);
      refreshPanels();
    };
    rebuild();
    ctl.seg({
      options: Object.entries(LAYOUTS).map(([k, v]) => ({ label: v.name, value: k })),
      value: 'stair',
      onChange: (v) => { sv.which = v; rebuild(); },
    });
    ctl.sep();
    ctl.toggle({ label: '自动旋转', value: false, onChange: (v) => { autoRotate = v; } });
    chapterTick = () => {
      hud.set('v1', `组合体：${LAYOUTS[sv.which].name}（${LAYOUTS[sv.which].cells.length} 个单位正方体）`);
      hud.set('v2', '主视图 x-z · 左视图 z-y · 俯视图 x-y');
      hud.set('v3', '斜二测：横不变 · 纵减半 · 角 45°');
    };
  },
};

/* ================= 章节 4：截面 ================= */

const ct = { preset: 'hexagon', d: 0, tiltDeg: 35, showCube: true };

const CUBE_H = 2;
const CUBE_MIN = -1, CUBE_MAX = 1;   // 立方体 [-1,1]³（y: 0..2）

function cubeCorners() {
  const pts = [];
  for (const x of [CUBE_MIN, CUBE_MAX]) for (const z of [CUBE_MIN, CUBE_MAX]) for (const y of [0, CUBE_H]) pts.push(new THREE.Vector3(x, y, z));
  return pts;
}

/** 平面（法向 n，过点 p0）截立方体：收集 12 条棱上的交点，按绕平面法向的角排序 */
function cutCube(n, p0) {
  const edges = [];
  const cs = cubeCorners();
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  // 12 条棱：沿 x（4）、z（4）、y（4）
  for (const y of [0, CUBE_H]) for (const z of [CUBE_MIN, CUBE_MAX]) edges.push([V(CUBE_MIN, y, z), V(CUBE_MAX, y, z)]);
  for (const y of [0, CUBE_H]) for (const x of [CUBE_MIN, CUBE_MAX]) edges.push([V(x, y, CUBE_MIN), V(x, y, CUBE_MAX)]);
  for (const x of [CUBE_MIN, CUBE_MAX]) for (const z of [CUBE_MIN, CUBE_MAX]) edges.push([V(x, 0, z), V(x, CUBE_H, z)]);
  const pts = [];
  edges.forEach(([a, b]) => {
    const da = n.dot(a) - n.dot(p0);
    const db = n.dot(b) - n.dot(p0);
    if (Math.abs(da) < 1e-9 && Math.abs(db) < 1e-9) { pts.push(a.clone(), b.clone()); return; }
    if (da * db < 0) pts.push(onEdge(a, b, da / (da - db)));
  });
  // 排序：投影到平面坐标系按极角
  if (pts.length < 3) return [];
  const center = pts.reduce((s, p) => s.add(p), new THREE.Vector3()).multiplyScalar(1 / pts.length);
  const u = new THREE.Vector3(1, 0, 0);
  const e1 = u.clone().sub(n.clone().multiplyScalar(u.dot(n))).normalize();
  const e2 = n.clone().cross(e1);
  return pts.sort((a, b) => {
    const aa = Math.atan2(a.clone().sub(center).dot(e2), a.clone().sub(center).dot(e1));
    const bb = Math.atan2(b.clone().sub(center).dot(e2), b.clone().sub(center).dot(e1));
    return aa - bb;
  });
}

const secCut2 = {
  id: 'cut2', title: '截面',
  html: `<p>平面截正方体，能截出<b>三角形、梯形、五边形、六边形</b>——最多六条边（正方体只有 6 个面，每个面最多贡献一条交线）。</p>
<p>经典截面：<b>对角面</b>（过两条对棱，矩形）；<b>正三角形</b>（过三条棱的等分点）；<b>正六边形</b>（垂直于体对角线、过中心的平面——六条边全等）。</p>
<p>切换预设，再拖「平移 d」让平面扫过立方体，看多边形如何从一点长大再缩小消失；橙色多边形就是截面。</p>`,
  enter() {
    ctl.clear();
    clearGroup(world);
    autoRotate = false;
    Object.assign(ct, { preset: 'hexagon', d: 0 });
    camTo([3.4, 2.8, 4.4], [0, 1, 0]);
    hud.show(true);
    const cubeEdges = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(2, 2, 2)),
      new THREE.LineBasicMaterial({ color: COL.dim, transparent: true, opacity: 0.9 })
    );
    cubeEdges.position.y = 1;
    world.add(cubeEdges);
    const faces = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), faceMat(0x4a90d9));
    faces.position.y = 1;
    world.add(faces);
    const polyMesh = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial({ color: COL.accent, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false }));
    world.add(polyMesh);
    const polyEdge = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0xff5533, transparent: true, opacity: 1 }));
    world.add(polyEdge);
    let cornerDots = [];
    const rebuild = () => {
      let n, p0;
      const center = new THREE.Vector3(0, 1, 0);
      if (ct.preset === 'hexagon') {
        n = new THREE.Vector3(1, 1, 1).normalize();
        p0 = center.clone().add(n.clone().multiplyScalar(ct.d));
      } else if (ct.preset === 'diag') {
        n = new THREE.Vector3(1, 0, 1).normalize();
        p0 = center.clone().add(n.clone().multiplyScalar(ct.d));
      } else if (ct.preset === 'tri') {
        n = new THREE.Vector3(1, 1, 1).normalize();
        p0 = new THREE.Vector3(1, 0, 1).clone().add(n.clone().multiplyScalar(ct.d));
      } else {
        n = new THREE.Vector3(Math.cos(ct.tiltDeg * DEG), Math.sin(ct.tiltDeg * DEG), 0).normalize();
        p0 = center.clone().add(n.clone().multiplyScalar(ct.d));
      }
      const poly = cutCube(n, p0);
      if (poly.length >= 3) {
        polyMesh.geometry.dispose();
        const geo = new THREE.BufferGeometry().setFromPoints(poly.map((p) => p.clone()));
        polyMesh.geometry = geo;
        polyMesh.geometry.computeVertexNormals();
        polyEdge.geometry.dispose();
        polyEdge.geometry = new THREE.BufferGeometry().setFromPoints([...poly, poly[0]]);
        cornerDots.forEach((d) => world.remove(d));
        cornerDots = poly.map((p) => dot(p, 0xff5533, 0.045));
        cornerDots.forEach((d) => world.add(d));
      } else {
        polyMesh.geometry.dispose();
        polyMesh.geometry = new THREE.BufferGeometry();
        polyEdge.geometry.dispose();
        polyEdge.geometry = new THREE.BufferGeometry();
        cornerDots.forEach((d) => world.remove(d));
        cornerDots = [];
      }
      hud.set('v1', `截面：${poly.length >= 3 ? poly.length + ' 边形' : '未相交'}`);
      hud.set('v2', `平移 d = ${ct.d.toFixed(2)}`);
      hud.set('v3', { hexagon: '正六边形：⊥体对角线', diag: '对角面：矩形', tri: '正三角形', tilt: '自由倾角' }[ct.preset]);
    };
    rebuild();
    ctl.seg({
      options: [
        { label: '正六边形', value: 'hexagon' }, { label: '对角面', value: 'diag' },
        { label: '正三角形', value: 'tri' }, { label: '自由倾角', value: 'tilt' },
      ],
      value: 'hexagon',
      onChange: (v) => { ct.preset = v; rebuild(); },
    });
    ctl.sep();
    ctl.slider({ label: '平移 d', min: -1.6, max: 1.6, step: 0.02, value: 0, fmt: (v) => v.toFixed(2), onInput: (v) => { ct.d = v; rebuild(); } });
    ctl.slider({ label: '倾角（自由模式）', min: 10, max: 80, step: 1, value: 35, fmt: (v) => v + '°', onInput: (v) => { ct.tiltDeg = v; if (ct.preset === 'tilt') rebuild(); } });
    ctl.toggle({ label: '自动旋转', value: false, onChange: (v) => { autoRotate = v; } });
    chapterTick = () => {};
  },
};

/* ================= 章节 5：空间角 ================= */

const sa = { which: 'skew' };

const secAngles = {
  id: 'angles', title: '空间角',
  html: `<p>三类空间角都在正方体里看：<b>① 异面直线所成角</b>（平移一条线使二者相交，转化为相交直线角；这里直接用方向向量 cosθ = |a·b|/(|a||b|)）；</p>
<p><b>② 直线与平面所成角</b>：线在面上的射影与线的夹角，sinθ = 距离/线长。体对角线 AC₁ 与底面的夹角 θ 满足 sinθ = 2/(2√3) = 1/√3，θ ≈ 35.3°。</p>
<p><b>③ 二面角</b>：从棱出发的两个半平面；用两面的法向量夹角求（或作垂线）。BD 棱上，底面与对角面 BDD₁B₁ 的二面角为 45°。</p>
<p>三种情况可切换，读数给出几何值与向量法两种口径。</p>`,
  enter() {
    ctl.clear();
    clearGroup(world);
    autoRotate = false;
    Object.assign(sa, { which: 'skew' });
    camTo([3.6, 3.0, 4.6], [0, 1, 0]);
    hud.show(true);
    const S = 2;
    const A = new THREE.Vector3(0, 0, 0), B = new THREE.Vector3(S, 0, 0), C = new THREE.Vector3(S, 0, S), D = new THREE.Vector3(0, 0, S);
    const A1 = A.clone().setY(S), B1 = B.clone().setY(S), C1 = C.clone().setY(S), D1 = D.clone().setY(S);
    const cubeEdge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(S, S, S)), new THREE.LineBasicMaterial({ color: COL.dim, transparent: true, opacity: 0.35 }));
    cubeEdge.position.set(S / 2, S / 2, S / 2);
    world.add(cubeEdge);
    const marks = new THREE.Group();
    world.add(marks);
    const hl = (a, b, color) => marks.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([a, b]), new THREE.LineBasicMaterial({ color, transparent: true, opacity: 1 })));
    const lbl = (text, pos, color) => {
      const l = label3(text, color, 0.005);
      l.position.copy(pos);
      marks.add(l);
      return l;
    };
    function build(which) {
      clearGroup(marks);
      if (which === 'skew') {
        // 异面直线：AA₁（z 向）与 BC₁?? 用 AB（x 向底棱）与 C₁D₁?? 选 AA₁ 与 B C₁
        const a1 = A.clone(), a2 = A1.clone();     // AA₁
        const b1 = B.clone(), b2 = C1.clone();     // BC₁
        hl(a1, a2, COL.accent); hl(b1, b2, COL.blue);
        [lbl('A', a1.clone().add(new THREE.Vector3(-0.25, -0.05, 0)), '#e8674a'),
         lbl('A₁', a2.clone().add(new THREE.Vector3(-0.25, 0.15, 0)), '#e8674a'),
         lbl('B', b1.clone().add(new THREE.Vector3(0.22, -0.2, 0)), '#4a90d9'),
         lbl('C₁', b2.clone().add(new THREE.Vector3(0.24, 0.15, 0)), '#4a90d9')];
        const va = a2.clone().sub(a1), vb = b2.clone().sub(b1);
        const cosv = Math.abs(va.dot(vb)) / (va.length() * vb.length());
        hud.set('v1', `cosθ = |a·b|/(|a||b|) = ${cosv.toFixed(3)}`);
        hud.set('v2', `θ = ${(Math.acos(cosv) / DEG).toFixed(1)}°`);
        hud.set('v3', 'AA₁ 与 BC₁：平移后相交即得夹角');
        camTo([3.6, 3.0, 4.6], [S / 2, S / 2, S / 2]);
      } else if (which === 'lineplane') {
        hl(A, C1, COL.accent);                 // 体对角线 AC₁
        hl(C, C1, COL.gold);                   // 高 CC₁
        hl(A, C, COL.blue);                    // 射影 AC
        [lbl('A', A.clone().add(new THREE.Vector3(-0.3, 0, 0)), '#8a94a3'),
         lbl('C', C.clone().add(new THREE.Vector3(0.25, -0.05, 0.25)), '#8a94a3'),
         lbl('C₁', C1.clone().add(new THREE.Vector3(0.25, 0.15, 0.25)), '#8a94a3')];
        const th = Math.asin(S / (S * Math.sqrt(3)));
        hud.set('v1', `sinθ = CC₁/AC₁ = ${S}/${(S * Math.sqrt(3)).toFixed(2)} = ${(1 / Math.sqrt(3)).toFixed(3)}`);
        hud.set('v2', `θ = ${(th / DEG).toFixed(1)}°（体对角线与底面）`);
        hud.set('v3', '黄 = 高线 · 蓝 = 射影 · 橙 = 斜线');
        camTo([4.4, 2.6, 4.8], [S / 2, S / 2, S / 2]);
      } else {
        // 二面角：棱 BD，半平面①底面 ABCD，②对角面 BDD₁B₁
        hl(B, D, COL.accent);
        hl(B, B1, COL.gold); hl(D, D1, COL.gold); hl(B1, D1, COL.gold);
        const n1 = new THREE.Vector3(0, 1, 0);
        const n2 = new THREE.Vector3(1, 1, 0).normalize();
        const cosv = Math.abs(n1.dot(n2));
        // 中点标记
        const midB = onEdge(B, D, 0.5);
        lbl('B', B.clone().add(new THREE.Vector3(0.2, -0.2, -0.1)), '#8a94a3');
        lbl('D', D.clone().add(new THREE.Vector3(-0.3, -0.2, 0.1)), '#8a94a3');
        lbl('B₁', B1.clone().add(new THREE.Vector3(0.2, 0.15, -0.1)), '#8a94a3');
        lbl('D₁', D1.clone().add(new THREE.Vector3(-0.35, 0.15, 0.1)), '#8a94a3');
        hud.set('v1', `cosθ = |n₁·n₂| = ${cosv.toFixed(3)}`);
        hud.set('v2', `θ = ${(Math.acos(cosv) / DEG).toFixed(0)}°（底面 ⊖ 对角面 BDD₁B₁）`);
        hud.set('v3', '橙 = 棱 BD · 金 = 对角面边界');
        camTo([4.2, 2.4, 4.6], [S / 2, S / 2, S / 2]);
      }
    }
    build('skew');
    ctl.seg({
      options: [{ label: '异面直线', value: 'skew' }, { label: '线面角', value: 'lineplane' }, { label: '二面角', value: 'dihedral' }],
      value: 'skew',
      onChange: build,
    });
    ctl.sep();
    ctl.toggle({ label: '自动旋转', value: false, onChange: (v) => { autoRotate = v; } });
    chapterTick = () => {};
  },
};

/* ================= 章节 6：空间向量与坐标 ================= */

const vec = { ax: 2, ay: 0, az: 0, bx: 0, by: 2, bz: 2, showSum: true };

const secVectors = {
  id: 'vectors', title: '空间向量与坐标',
  html: `<p>建立空间直角坐标系 O-xyz（原点在正方体一角），向量 <b>a = (x, y, z)</b> 就是从 O 指向对应点的箭头。</p>
<p>运算法全部按坐标代数地进行：<b>a·b = x₁x₂ + y₁y₂ + z₁z₂</b>；夹角 <span class="hl">cosθ = a·b / (|a||b|)</span>；a⊥b ⇔ a·b = 0。</p>
<p>拖动 a、b 的分量滑杆（端点吸附在正方体格点上）：看绿色箭头 a+b、夹角读数实时变化；调到 a·b = 0 体会"垂直"的坐标含义。</p>`,
  enter() {
    ctl.clear();
    clearGroup(world);
    autoRotate = false;
    Object.assign(vec, { ax: 2, ay: 0, az: 0, bx: 0, by: 2, bz: 2, showSum: true });
    camTo([4.2, 3.2, 5.0], [1, 1, 0]);
    hud.show(true);
    // 坐标轴
    const axes = new THREE.Group();
    [['x', COL.dim, [4, 0, 0]], ['y', COL.dim, [0, 3, 0]], ['z', COL.dim, [0, 0, 4]]].forEach(([name, color, end]) => {
      axes.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(...end)]), new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.7 })));
      const l = label3(name, '#8a94a3', 0.005);
      l.position.set(end[0] + 0.15, end[1] + 0.15, end[2] + 0.15);
      axes.add(l);
    });
    world.add(axes);
    // 立方参考框
    const cubeEdge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(2, 2, 2)), new THREE.LineBasicMaterial({ color: COL.dim, transparent: true, opacity: 0.25 }));
    cubeEdge.position.set(1, 1, 1);
    world.add(cubeEdge);
    const mkArrow = (color) => {
      const g = new THREE.Group();
      const shaftMat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 1 });
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, 0.01, 0)]), shaftMat);
      const head = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.22, 14), new THREE.MeshBasicMaterial({ color }));
      g.add(line, head);
      world.add(g);
      return { g, line, head };
    };
    const arrA = mkArrow(COL.accent), arrB = mkArrow(COL.blue), arrS = mkArrow(COL.green);
    const lblA = label3('a', '#e8674a', 0.006), lblB = label3('b', '#4a90d9', 0.006), lblS = label3('a+b', '#3fa96f', 0.006);
    world.add(lblA, lblB, lblS);
    function setArrow(arr, lbl, v) {
      const tip = new THREE.Vector3(v[0], v[1], v[2]);
      arr.line.geometry.dispose();
      arr.line.geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), tip.clone().multiplyScalar(0.985)]);
      arr.head.position.copy(tip);
      arr.head.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tip.clone().normalize());
      lbl.position.copy(tip.clone().add(tip.clone().normalize().multiplyScalar(0.22)));
    }
    const refresh = () => {
      const a = [vec.ax, vec.ay, vec.az], b = [vec.bx, vec.by, vec.bz];
      setArrow(arrA, lblA, a);
      setArrow(arrB, lblB, b);
      const s = [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
      arrS.g.visible = vec.showSum; lblS.visible = vec.showSum;
      if (vec.showSum) setArrow(arrS, lblS, s);
      const dotv = a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
      const la = Math.hypot(...a), lb = Math.hypot(...b);
      const cosv = la && lb ? dotv / (la * lb) : 0;
      hud.set('v1', `a·b = ${dotv}`);
      hud.set('v2', `cosθ = ${cosv.toFixed(3)} → θ = ${(Math.acos(clamp(cosv, -1, 1)) / DEG).toFixed(1)}°`);
      hud.set('v3', `|a|=${la.toFixed(2)} |b|=${lb.toFixed(2)}`);
    };
    refresh();
    const addVec = (tag) => {
      ['x', 'y', 'z'].forEach((comp, i) => {
        ctl.slider({
          label: `${tag}${comp}`, min: 0, max: 4, step: 1, value: vec[tag + comp],
          fmt: (v) => String(v),
          onInput: (v) => { vec[tag + comp] = v; refresh(); },
        });
        if (i === 2) ctl.sep();
      });
    };
    addVec('a');
    addVec('b');
    ctl.toggle({ label: 'a+b', value: true, onChange: (v) => { vec.showSum = v; refresh(); } });
    chapterTick = () => {};
  },
};

/* ================= 章节 7：外接球与内切球 ================= */

const bs = { which: 'cube', size: 2 };

const secBalls = {
  id: 'balls', title: '外接球与内切球',
  html: `<p><b>外接球</b>：过几何体所有顶点的球（球心到各顶点等距）；<b>内切球</b>：与各面都相切的球。它们的半径是考试高频公式：</p>
<p>正方体（棱 a）：<span class="hl">R = √3a/2</span>（体对角线一半），r = a/2。长方体：R = √(a²+b²+c²)/2（无内切球）。<b>正四面体</b>：R = √6a/4，r = √6a/12，且 R = 3r。圆柱（底面半径 r₀ 高 h）：R = √(r₀² + (h/2)²)。</p>
<p>切换几何体、拖尺寸滑杆：金色线框是外接球，青色是内切球（有的几何体没有，读数会注明）。发现规律：正方体切掉四角变正四面体时，两球是同一颗。</p>`,
  enter() {
    ctl.clear();
    clearGroup(world);
    autoRotate = false;
    Object.assign(bs, { which: 'cube', size: 2 });
    camTo([4.4, 3.2, 5.0], [0, 1.2, 0]);
    hud.show(true);
    let outBall = null, inBall = null;
    const build = () => {
      clearGroup(world);
      outBall = null; inBall = null;
      const s = bs.size;
      const g = new THREE.Group();
      let outR = null, inR = null;
      const outC = new THREE.Vector3(0, s / 2, 0), inC = outC.clone();
      let note = '';
      if (bs.which === 'cube') {
        const so = solidCube(s);
        g.add(so.group);
        outR = Math.sqrt(3) * s / 2; inR = s / 2;
      } else if (bs.which === 'box') {
        // 长方体 a×b×c = s×0.8s×0.6s
        const dims = [s, s * 0.8, s * 0.6];
        const geo = new THREE.BoxGeometry(...dims);
        const mesh = new THREE.Mesh(geo, faceMat(0x4a90d9));
        mesh.position.y = dims[1] / 2;
        const edges = makeEdges(geo);
        edges.position.y = dims[1] / 2;
        g.add(mesh, edges);
        outR = Math.hypot(...dims) / 2;
        outC.set(0, dims[1] / 2, 0);
        inC.copy(outC);
        note = '长方体一般没有内切球';
      } else if (bs.which === 'tetra') {
        const so = solidTetra(s);
        g.add(so.group);
        outR = Math.sqrt(6) / 4 * s; inR = Math.sqrt(6) / 12 * s;
        const h = Math.sqrt(2 / 3) * s;
        outC.set(0, h / 4 + 0.28, 0);   // 高的 1/4 处（近似重心高度）
        inC.copy(outC);
      } else {
        const r0 = s * 0.45, h = s * 1.3;
        const so = solidCylinder(h);
        g.add(so.group);
        so.group.scale.set(r0 / (h * 0.45), h / h, r0 / (h * 0.45));
        outR = Math.hypot(r0, h / 2);
        outC.set(0, h / 2, 0); inC.copy(outC);
        note = '圆柱：等边圆柱（h = 2r₀）才有内切球';
      }
      world.add(g);
      if (outR) {
        outBall = new THREE.Mesh(new THREE.SphereGeometry(outR, 40, 26), new THREE.MeshBasicMaterial({ color: COL.gold, wireframe: true, transparent: true, opacity: 0.22 }));
        outBall.position.copy(outC);
        world.add(outBall);
      }
      if (inR) {
        inBall = new THREE.Mesh(new THREE.SphereGeometry(inR, 40, 26), new THREE.MeshBasicMaterial({ color: 0x2fb3a5, wireframe: true, transparent: true, opacity: 0.3 }));
        inBall.position.copy(inC);
        world.add(inBall);
      }
      hud.set('v1', { cube: `R = √3a/2 = ${outR.toFixed(3)}，r = a/2 = ${inR?.toFixed(3)}`, box: `R = √(a²+b²+c²)/2 = ${outR.toFixed(3)}（${note}）`, tetra: `R = √6a/4 = ${outR.toFixed(3)}，r = √6a/12 = ${inR.toFixed(3)}（R = 3r）`, cyl: `R = √(r₀²+(h/2)²) = ${outR.toFixed(3)}（${note}）` }[bs.which]);
      hud.set('v2', `尺寸 a = ${s.toFixed(2)}`);
      hud.set('v3', '金框 = 外接球 · 青框 = 内切球');
    };
    build();
    ctl.seg({
      options: [{ label: '正方体', value: 'cube' }, { label: '长方体', value: 'box' }, { label: '正四面体', value: 'tetra' }, { label: '圆柱', value: 'cyl' }],
      value: 'cube',
      onChange: (v) => { bs.which = v; build(); },
    });
    ctl.sep();
    ctl.slider({ label: '棱长 a', min: 1.2, max: 3, step: 0.05, value: 2, fmt: (v) => v.toFixed(2), onInput: (v) => { bs.size = v; build(); } });
    ctl.toggle({ label: '自动旋转', value: false, onChange: (v) => { autoRotate = v; } });
    chapterTick = () => {};
  },
};

/* 正四面体（边长 a，底面在 y=0） */
function solidTetra(a) {
  const g = new THREE.Group();
  const r = a / Math.sqrt(3);       // 底面外接圆半径
  const h = Math.sqrt(2 / 3) * a;   // 高
  const base = [
    new THREE.Vector3(r, 0, 0),
    new THREE.Vector3(-r / 2, 0, r * Math.sqrt(3) / 2),
    new THREE.Vector3(-r / 2, 0, -r * Math.sqrt(3) / 2),
  ];
  const apex = new THREE.Vector3(0, h, 0);
  const geo = new THREE.BufferGeometry();
  const verts = [];
  const push = (p) => verts.push(p.x, p.y, p.z);
  for (let i = 0; i < 3; i++) {
    push(base[i]); push(base[(i + 1) % 3]); push(apex);
  }
  push(base[0]); push(base[1]); push(base[2]);
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(verts), 3));
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, faceMat(0xe8674a));
  const eg = new THREE.EdgesGeometry(geo, 8);
  const edges = new THREE.LineSegments(eg, new THREE.LineBasicMaterial({ color: COL.dim, transparent: true, opacity: 0.9 }));
  g.add(mesh, edges);
  return { group: g, V: 4, E: 6, F: 4 };
}

/* ================= 章节 8：正四面体 ================= */

const tt = { a: 2.2, showBalls: true, showCube: false };

const secTetra = {
  id: 'tetra', title: '正四面体',
  html: `<p>正四面体是立体几何的"明星模型"：四 个面全等、所有棱相等。设棱长 a：</p>
<p>高 h = √(2/3)a；体积 <span class="hl">V = √2a³/12</span>；外接球 R = √6a/4；内切球 r = √6a/12（R = 3r）；侧面与底面所成二面角 cosθ = 1/3（θ ≈ 70.5°）；两棱所成角 60°。</p>
<p>还有一个漂亮的「补形」技巧：把正四面体放进正方体——它的四个顶点恰好是正方体相间的四个顶点，棱长 = 正方体面对角线。于是 R = √3·(a/√2)/2 = √6a/4 一眼得出。</p>
<p>打开「补形正方体」亲自验证；打开两球对照 R = 3r。</p>`,
  enter() {
    ctl.clear();
    clearGroup(world);
    autoRotate = false;
    Object.assign(tt, { a: 2.2, showBalls: true, showCube: false });
    camTo([3.8, 3.0, 4.8], [0, 1, 0]);
    hud.show(true);
    const build = () => {
      clearGroup(world);
      const a = tt.a;
      const so = solidTetra(a);
      world.add(so.group);
      const h = Math.sqrt(2 / 3) * a;
      const r = a / Math.sqrt(3);
      const centroid = new THREE.Vector3(0, 0, 0);
      const apex = new THREE.Vector3(0, h, 0);
      if (tt.showHeight !== false) {
        world.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), apex]), new THREE.LineBasicMaterial({ color: COL.gold, transparent: true, opacity: 0.9 })));
        const lbl = label3('h', '#d9a13f', 0.005);
        lbl.position.set(0.18, h / 2, 0);
        world.add(lbl);
        // 底面外接圆
        for (let i = 0; i < 64; i++) {
          const a1 = (i / 64) * TAU, a2 = ((i + 1) / 64) * TAU;
          world.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(Math.cos(a1) * r, 0, Math.sin(a1) * r),
            new THREE.Vector3(Math.cos(a2) * r, 0, Math.sin(a2) * r),
          ]), new THREE.LineDashedMaterial({ color: COL.dim, dashSize: 0.07, gapSize: 0.05, transparent: true, opacity: 0.5 })));
        }
      }
      if (tt.showBalls) {
        const R = Math.sqrt(6) / 4 * a, ri = Math.sqrt(6) / 12 * a;
        const c = new THREE.Vector3(0, h / 4, 0);
        const outB = new THREE.Mesh(new THREE.SphereGeometry(R, 40, 26), new THREE.MeshBasicMaterial({ color: COL.gold, wireframe: true, transparent: true, opacity: 0.2 }));
        const inB = new THREE.Mesh(new THREE.SphereGeometry(ri, 40, 26), new THREE.MeshBasicMaterial({ color: 0x2fb3a5, wireframe: true, transparent: true, opacity: 0.32 }));
        outB.position.copy(c); inB.position.copy(c);
        world.add(outB, inB);
      }
      if (tt.showCube) {
        const s = a / Math.SQRT2;   // 正方体棱长
        const cube = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(s, s, s)), new THREE.LineBasicMaterial({ color: 0x4a90d9, transparent: true, opacity: 0.8 }));
        cube.position.set(0, s / 2, 0);
        world.add(cube);
      }
      const V = Math.sqrt(2) / 12 * a ** 3;
      hud.set('v1', `V = √2a³/12 = ${V.toFixed(2)} · h = ${h.toFixed(2)}`);
      hud.set('v2', `R = ${(Math.sqrt(6) / 4 * a).toFixed(2)}，r = ${(Math.sqrt(6) / 12 * a).toFixed(2)}（R = 3r）`);
      hud.set('v3', '二面角 cosθ = 1/3 ≈ 70.5°');
    };
    build();
    ctl.slider({ label: '棱长 a', min: 1.2, max: 3, step: 0.05, value: 2.2, fmt: (v) => v.toFixed(2), onInput: (v) => { tt.a = v; build(); } });
    ctl.sep();
    ctl.toggle({ label: '两球（R=3r）', value: true, onChange: (v) => { tt.showBalls = v; build(); } });
    ctl.toggle({ label: '补形正方体', value: false, onChange: (v) => { tt.showCube = v; build(); } });
    ctl.toggle({ label: '自动旋转', value: false, onChange: (v) => { autoRotate = v; } });
    chapterTick = () => {};
  },
};

/* ================= 章节 9：随堂检测 ================= */

const QUIZ = [
  {
    q: '简单多面体的欧拉公式是？',
    opts: ['V + E − F = 2', 'V − E + F = 2', 'V × E × F = 2', 'E = V + F'],
    a: 1,
    ex: 'V − E + F = 2（顶点数 − 棱数 + 面数 = 2）。正方体 8−12+6=2，四棱锥 5−8+5=2。',
  },
  {
    q: '下列哪种六连方不能折成正方体？',
    opts: ['1-4-1 十字形', '2-2-2 阶梯形', '2×2 田字形加两格', '3-3 阶梯'],
    a: 2,
    ex: '含"田"字（2×2 方块）的展开图折叠时会有两个面重合，折不成正方体。11 种可行展开图中不含田字形。',
  },
  {
    q: '正方体被平面所截，截面最多是几边形？',
    opts: ['四边形', '五边形', '六边形', '八边形'],
    a: 2,
    ex: '正方体只有 6 个面，截面每穿过一个面得到一条边，所以最多六边形（如过中心的正六边形截面）。',
  },
  {
    q: '棱长为 a 的正方体外接球半径是？',
    opts: ['a/2', '√2a/2', '√3a/2', '√3a'],
    a: 2,
    ex: '外接球心在正方体中心，直径 = 体对角线 = √3a，所以 R = √3a/2。',
  },
  {
    q: '棱长为 a 的正四面体，外接球半径 R 与内切球半径 r 的关系是？',
    opts: ['R = 2r', 'R = 3r', 'R = 4r', 'R = r'],
    a: 1,
    ex: 'R = √6a/4，r = √6a/12，故 R = 3r。正四面体中心把高分成的两段之比正是 3:1。',
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
    back.addEventListener('click', () => { panel.remove(); window.__eduSections.select(0); });
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:10px;justify-content:center';
    row.appendChild(back); row.appendChild(again);
    card.appendChild(row);
    panel.appendChild(card);
  }

  renderQ();
  activeCleanup = () => panel.remove();
}

/* ---------------- 启动 ---------------- */

const SECTIONS = [secSolids, secNet, secViews, secCut2, secAngles, secVectors, secBalls, secTetra, {
  id: 'quiz', title: '随堂检测',
  html: `<p>5 道题检验本章掌握情况。答完可重新开始。</p>`,
  enter() {
    clearGroup(world);
    autoRotate = false;
    camTo([4.2, 3.0, 5.2], [0, 1, 0]);
    hud.show(false);
    ctl.clear();
    // 背景装饰线框正方体 + 正四面体
    const cube = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(2, 2, 2)), new THREE.LineBasicMaterial({ color: COL.dim, transparent: true, opacity: 0.3 }));
    cube.position.set(0, 1, 0);
    world.add(cube);
    showQuiz();
  },
}];

const sections = createSections({
  nav: document.getElementById('sideNav'),
  descPanel: document.getElementById('descPanel'),
  sections: SECTIONS,
  onSelect(i, sec) {
    if (activeCleanup) { activeCleanup(); activeCleanup = null; }
    chapterTick = null;
    autoRotate = false;
    sec.enter();
  },
});
window.__eduSections = sections;
window.__NETS = NETS;  // 调试钩子
sections.select(0);

app.onFrame((dt, t) => {
  cameraTweenTick(app, dt);
  if (chapterTick) chapterTick(dt, t);
  if (autoRotate) {
    const ang = dt * 0.35;
    const off = camera.position.clone().sub(controls.target);
    off.applyAxisAngle(new THREE.Vector3(0, 1, 0), ang);
    camera.position.copy(controls.target).add(off);
  }
});

loader.hide();
