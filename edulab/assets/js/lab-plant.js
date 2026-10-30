/* EduLab · 植物的一生（plant）
 * 章节：一株菜豆 / 种子萌发的条件 / 幼苗出土与黄化 / 根的生长与向地性 / 光照强度与光合作用 /
 *       绿叶在光下制造淀粉 / 蒸腾作用 / 向光性与生长素 / 开花与结果 / 自由培养 / 随堂检测
 * 实现：three.js 程序化菜豆（按生理日程参数化生长：弯钩出土→子叶→真叶→三出复叶→蝶形花→豆荚，
 *       根系沿根箱玻璃生长）；萌发对照 / 金鱼藻放氧 / 碘液淀粉检测 / 蒸腾 / 胚芽鞘均为本场景小装置。
 */
import {
  THREE, DEG, TAU, clamp,
  createApp, cameraTweenTick, makeLoader,
  createSections, createControlsPanel, makeHUD, makeTextSprite, setSpriteText,
} from './edu-core.js';

/* ---------------- 场景：玻璃温室 ---------------- */

const stage = document.getElementById('stage');
const loader = makeLoader(stage, '正在搭建温室…');
const app = createApp({
  container: stage,
  fov: 42,
  cameraPos: [3.2, 1.7, 4.2],
  target: [0, 0.8, 0],
  minDistance: 0.8,
  maxDistance: 30,
  toneMapping: THREE.NoToneMapping,
});
const { scene, camera, controls } = app;
scene.add(new THREE.HemisphereLight(0xcfe4ff, 0x6a5a3e, 0.85));
const sun = new THREE.DirectionalLight(0xfff2d8, 1.6);
sun.position.set(4, 6, 3);
scene.add(sun);
const amb = new THREE.AmbientLight(0xffffff, 0.25);
scene.add(amb);

function setSunlight(on) {
  sun.intensity = on ? 1.6 : 0.55;
  amb.intensity = on ? 0.25 : 0.45;
}
setSunlight(true);

/* 地面与土壤 */
{
  const ground = new THREE.Mesh(new THREE.CircleGeometry(9, 48), new THREE.MeshStandardMaterial({ color: 0x8a9a6a, roughness: 1 }));
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);
  const bed = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.3, 1.6), new THREE.MeshStandardMaterial({ color: 0x5d4a32, roughness: 1 }));
  bed.position.y = -0.13;   // 顶面 y=0.02，高于地面圆盘，避免 z-fighting
  scene.add(bed);
}
/* 玻璃温室壳（后墙+两侧，不挡正面视线） */
{
  const glass = new THREE.MeshStandardMaterial({ color: 0xbfe3f2, transparent: true, opacity: 0.16, roughness: 0.1, side: THREE.DoubleSide, depthWrite: false });
  const back = new THREE.Mesh(new THREE.PlaneGeometry(7, 3), glass);
  back.position.set(0, 1.5, -1.6);
  const left = new THREE.Mesh(new THREE.PlaneGeometry(4, 3), glass);
  left.position.set(-3.5, 1.5, 0);
  left.rotation.y = Math.PI / 2;
  const roof = new THREE.Mesh(new THREE.PlaneGeometry(7, 2.6), glass);
  roof.position.set(0, 3.1, -0.6);
  roof.rotation.x = -1.05;
  roof.material = roof.material.clone();
  roof.material.opacity = 0.08;
  scene.add(back, left, roof);
}

const COL = { stem: 0x4f8f3a, leaf: 0x3f9142, leafDark: 0x2e7034, pale: 0xd9d078, pod: 0x6fae4e, flower: 0xe8b4c8, root: 0xdccfb2, soil: 0x5d4a32, foil: 0x9aa4ad, water: 0x4a90d9 };
const world = new THREE.Group();
scene.add(world);

/* ---------------- 通用工具 ---------------- */

const ctl = createControlsPanel(document.getElementById('controls'));
const hud = makeHUD(stage, [['v1', '读数'], ['v2', ''], ['v3', '']]);
hud.show(false);
let chapterTick = null;
let activeCleanup = null;

function camTo(pos, target) { app.setCamera(pos, target); }
function clearGroup(g) {
  g.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) o.material.dispose?.();
  });
  g.clear();
}
function label3(text, color, scale = 0.0055) {
  return makeTextSprite(text, { fontSize: 38, color, scale });
}
/** 时间轴控制组（播放 + 滑杆） */
function timeline(ctl, { min = 0, max = 60, value = 0, speed = 3, fmt = (v) => `第 ${Math.round(v)} 天`, onFrame }) {
  const st = { value, playing: false, speed, onFrame, min, max };
  st.playBtn = ctl.button({
    label: '▶ 播放', onClick() {
      st.playing = !st.playing;
      st.playBtn.textContent = st.playing ? '⏸ 暂停' : '▶ 播放';
      st.playBtn.classList.toggle('active', st.playing);
    },
  });
  st.slider = ctl.slider({ label: '天数', min, max, step: 0.1, value, fmt, onInput: (v) => { st.value = v; st.playing = false; st.playBtn.textContent = '▶ 播放'; st.playBtn.classList.remove('active'); st.onFrame(v); } });
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
  return st;
}

/* ---------------- 植物部件几何（共享） ---------------- */

function makeLeafGeometry() {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.bezierCurveTo(0.16, 0.10, 0.22, 0.34, 0, 0.62);
  shape.bezierCurveTo(-0.22, 0.34, -0.16, 0.10, 0, 0);
  const geo = new THREE.ShapeGeometry(shape, 10);
  return geo;
}
const LEAF_GEO = makeLeafGeometry();
function makeLeafMesh(color) {
  return new THREE.Mesh(LEAF_GEO, new THREE.MeshStandardMaterial({ color, side: THREE.DoubleSide, roughness: 0.7 }));
}
function stemTube(points, color = COL.stem, radius = 0.012) {
  const curve = new THREE.CatmullRomCurve3(points);
  return new THREE.Mesh(new THREE.TubeGeometry(curve, 24, radius, 6), new THREE.MeshStandardMaterial({ color, roughness: 0.8 }));
}
function makeCotyledon(color) {
  return new THREE.Mesh(new THREE.SphereGeometry(0.032, 12, 8), new THREE.MeshStandardMaterial({ color: 0x7aa844, roughness: 0.7 }));
}
function makeFlower() {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: COL.flower, side: THREE.DoubleSide, roughness: 0.6 });
  // 旗瓣（上，大圆）
  const banner = new THREE.Mesh(new THREE.CircleGeometry(0.028, 16), mat);
  banner.position.y = 0.028; banner.rotation.x = -0.4;
  // 翼瓣（两侧）
  for (const s of [-1, 1]) {
    const wing = new THREE.Mesh(new THREE.CircleGeometry(0.02, 14), mat);
    wing.position.set(s * 0.02, 0.012, 0.008);
    wing.rotation.set(0.6, s * 0.7, 0);
    g.add(wing);
  }
  // 龙骨瓣
  const keel = new THREE.Mesh(new THREE.CircleGeometry(0.017, 12), mat);
  keel.position.set(0, 0.004, 0.014);
  keel.rotation.x = 1.0;
  g.add(banner, keel);
  const calyx = new THREE.Mesh(new THREE.SphereGeometry(0.012, 10, 8), new THREE.MeshStandardMaterial({ color: 0x4f8f3a }));
  g.add(calyx);
  return g;
}
function makePod(len) {
  const pts = [];
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    pts.push(new THREE.Vector3(0, t * len, Math.sin(t * Math.PI) * 0.015));
  }
  const curve = new THREE.CatmullRomCurve3(pts);
  return new THREE.Mesh(new THREE.TubeGeometry(curve, 12, 0.014, 8), new THREE.MeshStandardMaterial({ color: COL.pod, roughness: 0.7 }));
}

/* ---------------- 菜豆参数化生长模型 ---------------- */

const SCHED = {
  hookPeak: 6.5, hookEnd: 9,          // 弯钩顶土期
  emerge: 7,                           // 子叶出土
  primaryDay: 10,                      // 第一对真叶（单叶）
  tri0Day: 14, triGap: 5, triN: 5,     // 三出复叶节点
  branchDay: 30,
  budDay: 32, flowerDay: 36, podDay: 44,
};

function growCurve(d0, d1, t0 = 0, t1 = 1) {
  return (day) => t0 + (t1 - t0) * clamp((day - d0) / (d1 - d0), 0, 1);
}
const smooth = (t) => t * t * (3 - 2 * t);

/** 地上部分（含叶/花/荚）。opts: {dark, droop, colorMod, scale} */
function buildBean(day, opts = {}) {
  const g = new THREE.Group();
  const dark = !!opts.dark;
  const droop = opts.droop || 0;
  const colMod = opts.colorMod || 0;    // 1 = 偏黄
  const H = 1.5 * Math.pow(clamp((day - 6) / 42, 0, 1), 0.85) * (dark ? 1.35 : 1);
  if (day < SCHED.emerge - 1) {
    // 未出土：只有土壤下的弯钩雏形
    if (day >= 4) {
      const hk = 0.1 * clamp((day - 4) / 3, 0, 1);
      g.add(stemTube([
        new THREE.Vector3(0, -0.06, 0), new THREE.Vector3(0.02, -0.02, 0),
        new THREE.Vector3(0.035, hk * 0.5, 0), new THREE.Vector3(0.02, hk, 0.01),
      ], COL.stem, 0.014));
    }
    return g;
  }
  // 弯钩：出土期弯曲，之后伸直
  const hookT = 1 - smooth(clamp((day - SCHED.hookPeak) / (SCHED.hookEnd - SCHED.hookPeak), 0, 1));
  // 主茎控制点：基部直立，顶部依 hookT 弯折
  const pts = [new THREE.Vector3(0, -0.06, 0)];
  const N = 9;
  const bend = hookT * 0.24;
  for (let i = 1; i <= N; i++) {
    const t = i / N;
    const y = H * t;
    const sway = Math.sin(t * 3.1 + day * 0.05) * 0.015 * t;    // 轻微自然弯曲
    pts.push(new THREE.Vector3(sway + Math.sin(t * 2.2) * 0.01, y, Math.cos(t * 2.2) * 0.012));
  }
  // 弯钩作用于最上部两点
  const tip = pts[N];
  pts[N] = new THREE.Vector3(tip.x + bend, tip.y - bend * 0.5, tip.z);
  pts[N - 1] = new THREE.Vector3(pts[N - 1].x + bend * 0.4, pts[N - 1].y, pts[N - 1].z);
  const stemCol = dark ? 0xb9ae62 : COL.stem;
  g.add(stemTube(pts, stemCol, 0.013));
  const stemHeight = H;

  const leafColor = new THREE.Color(dark ? COL.pale : COL.leaf).lerp(new THREE.Color(0xd9c25a), colMod);

  function attachLeaf(tHeight, side, size, days, droopExtra = 0) {
    const grow = smooth(clamp(days, 0, 1));
    if (grow <= 0.02) return;
    const idx = Math.round(tHeight / stemHeight * N);
    const base = pts[Math.min(N, Math.max(1, idx))] || pts[N];
    const leaf = makeLeafMesh(leafColor.getHex());
    leaf.scale.setScalar(size * grow);
    leaf.position.set(base.x, base.y, base.z);
    leaf.rotation.set(-0.5 + droop * 0.9 + droopExtra, side * 1.9, side * 0.5);
    const stalk = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([base, base.clone().add(new THREE.Vector3(side * 0.04, 0.05, 0))]),
      new THREE.LineBasicMaterial({ color: stemCol, transparent: true, opacity: 0.9 })
    );
    g.add(leaf, stalk);
    return leaf;
  }
  function attachTrifoliate(tHeight, side, size, days) {
    const grow = smooth(clamp(days, 0, 1));
    if (grow <= 0.02) return;
    const idx = Math.round(tHeight / stemHeight * N);
    const base = pts[Math.min(N, Math.max(1, idx))] || pts[N];
    const grp = new THREE.Group();
    for (const [dx, rot] of [[0, 0], [-0.6, -1.1], [0.6, 1.1]]) {
      const leaf = makeLeafMesh(leafColor.getHex());
      leaf.scale.setScalar(size * grow);
      leaf.position.set(dx * size * 0.4, 0.05, 0);
      leaf.rotation.set(-0.55 + droop, rot * 1.6, 0);
      grp.add(leaf);
    }
    grp.position.set(base.x, base.y, base.z);
    grp.rotation.y = side * 2.2;
    g.add(grp);
  }
  // 子叶（出土后留在下胚轴顶端，渐萎缩）
  if (day < 22) {
    const cs = 1 - smooth(clamp((day - 14) / 8, 0, 1)) * 0.7;
    for (const s of [-1, 1]) {
      const cot = makeCotyledon(dark ? 0xb9ae62 : 0x7aa844);
      cot.scale.setScalar(0.9 + s * 0.1);
      cot.position.set(s * 0.02, 0.1, 0.01);
      cot.scale.multiplyScalar(cs);
      g.add(cot);
    }
  }
  // 第一对真叶（单叶，对生）
  const pDays = (day - SCHED.primaryDay) / 7;
  attachLeaf(stemHeight * 0.13, -1, dark ? 0.16 : 0.34, pDays);
  attachLeaf(stemHeight * 0.13, 1, dark ? 0.16 : 0.34, pDays);
  // 三出复叶
  for (let k = 0; k < SCHED.triN; k++) {
    const d0 = SCHED.tri0Day + k * SCHED.triGap;
    if (d0 > day) break;
    const tH = clamp(0.24 + k * 0.2, 0.1, stemHeight * 0.92);
    attachTrifoliate(tH, k % 2 === 0 ? 1 : -1, (dark ? 0.17 : 0.34) * (1 + k * 0.05), (day - d0) / 6);
  }
  // 分枝
  if (day >= SCHED.branchDay) {
    for (const k of [1, 2]) {
      const d0 = SCHED.branchDay + k * 4;
      if (d0 > day) break;
      const grow = smooth(clamp((day - d0) / 10, 0, 1));
      const base = pts[Math.min(N, Math.round((0.24 + k * 0.2) / Math.max(0.2, stemHeight) * N))] || pts[3];
      const bpts = [base.clone(),
        base.clone().add(new THREE.Vector3(k % 2 ? 0.2 : -0.2, 0.18, 0.02).multiplyScalar(grow)),
        base.clone().add(new THREE.Vector3(k % 2 ? 0.34 : -0.34, 0.4, 0.03).multiplyScalar(grow))];
      g.add(stemTube(bpts, stemCol, 0.009));
      const bl = makeLeafMesh(leafColor.getHex());
      bl.scale.setScalar(0.26 * grow);
      bl.position.copy(bpts[2]);
      bl.rotation.set(-0.6 + droop, k % 2 ? -1.6 : 1.6, 0);
      g.add(bl);
    }
  }
  // 花 → 荚（节点 2..4）
  const podNodes = [2, 3, 4];
  podNodes.forEach((k, i) => {
    const d0 = SCHED.budDay + i * 3;
    if (d0 > day) return;
    const tH = clamp(0.28 + k * 0.2, 0.15, stemHeight * 0.85);
    const idx = Math.round(tH / Math.max(0.2, stemHeight) * N);
    const base = pts[Math.min(N, Math.max(1, idx))] || pts[3];
    const side = i % 2 ? 0.12 : -0.12;
    if (day < SCHED.podDay + i * 2) {
      // 花苞 / 开花
      const fl = makeFlower();
      const open = smooth(clamp((day - SCHED.flowerDay - i * 2) / 2, 0, 1));
      fl.scale.setScalar((day < SCHED.flowerDay + i * 2 ? 0.55 : 0.8 + open * 0.3));
      fl.position.set(base.x + side, base.y - 0.04, base.z + 0.03);
      g.add(fl);
    } else {
      // 豆荚
      const plen = 0.06 + 0.16 * smooth(clamp((day - SCHED.podDay - i * 2) / 10, 0, 1));
      const pod = makePod(plen);
      pod.position.set(base.x + side, base.y - 0.02, base.z + 0.03);
      pod.rotation.z = side * 2.6;
      g.add(pod);
    }
  });
  return g;
}

/** 根系（画在根箱玻璃面 z≈0.3 平面）。tiltDay: 横放发生的天数（null 未横放） */
function buildRoots(day, tiltDay = null) {
  const g = new THREE.Group();
  if (day < 2) return g;
  g.position.z = 0.12;
  const mat = new THREE.LineBasicMaterial({ color: COL.root, transparent: true, opacity: 0.95 });
  const growR = smooth(clamp((day - 2) / 16, 0, 1));
  const len = 0.85 * growR;
  // 主根：基底沿"重力方向"（若横放后，逐渐向下弯）
  const pts = [];
  const SEG = 16;
  let dir = new THREE.Vector2(0, -1);
  if (tiltDay !== null && day > tiltDay) {
    const resp = smooth(clamp((day - tiltDay) / 4, 0, 1));   // 向地性恢复
    dir = new THREE.Vector2(1, 0).lerp(new THREE.Vector2(0, -1), resp).normalize();
  }
  let p = new THREE.Vector2(0, -0.05);
  pts.push(new THREE.Vector3(p.x, p.y, 0));
  for (let i = 1; i <= SEG; i++) {
    const t = i / SEG;
    // 横放后：根部沿茎轴先延伸，再朝世界下方弯
    let dNow = dir.clone();
    if (tiltDay !== null && day > tiltDay && t < 0.5) {
      const bendK = 1 - smooth(clamp((day - tiltDay) / 4, 0, 1));
      dNow = new THREE.Vector2(0, -1).lerp(new THREE.Vector2(1, 0), bendK * (1 - t)).normalize();
    }
    p = p.clone().add(dNow.clone().multiplyScalar(len / SEG));
    p.x += Math.sin(t * 9 + day * 0.3) * 0.006;
    pts.push(new THREE.Vector3(p.x, p.y, 0));
  }
  g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat));
  // 侧根
  const nLat = 5;
  for (let i = 0; i < nLat; i++) {
    const d0 = 5 + i * 2.5;
    if (d0 > day) break;
    const t = 0.18 + 0.55 * (i / nLat);
    const idx = Math.round(t * SEG);
    const base = pts[Math.min(idx, pts.length - 1)];
    const side = i % 2 ? 1 : -1;
    const ll = 0.2 * smooth(clamp((day - d0) / 8, 0, 1));
    const lp = [base.clone()];
    for (let j = 1; j <= 5; j++) {
      lp.push(base.clone().add(new THREE.Vector3(side * ll * j / 5 * Math.cos(0.7), ll * j / 5 * Math.sin(0.7) * -0.4, 0)));
    }
    g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(lp), new THREE.LineBasicMaterial({ color: COL.root, transparent: true, opacity: 0.8 })));
  }
  // 根尖标记
  const tip = pts[pts.length - 1];
  const tipDot = new THREE.Mesh(new THREE.SphereGeometry(0.014, 10, 8), new THREE.MeshBasicMaterial({ color: 0xd9534f }));
  tipDot.position.copy(tip);
  g.add(tipDot);
  return g;
}

/** 根箱：土壤块在箱体后半，正面玻璃在 z=0，根系贴玻璃外侧生长（z=0.12，始终可见） */
function makeRootBox() {
  const g = new THREE.Group();
  const soil = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.9, 0.34), new THREE.MeshStandardMaterial({ color: COL.soil, roughness: 1 }));
  soil.position.set(0, -0.45, -0.12);
  g.add(soil);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.9), new THREE.MeshStandardMaterial({ color: 0xbfe3f2, transparent: true, opacity: 0.12, side: THREE.DoubleSide, roughness: 0.1, depthWrite: false }));
  glass.position.set(0, -0.45, 0.06);
  g.add(glass);
  return g;
}
/** 菜豆种子 */
function makeSeed(swollen = 1) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(0.032, 14, 10), new THREE.MeshStandardMaterial({ color: 0xc9a86a, roughness: 0.7 }));
  m.scale.set(swollen, swollen * 0.7, swollen * 0.6);
  return m;
}

/* ================= 章节 1：一株菜豆 ================= */

const ch1 = { day: 16, labels: true };

const secOverview = {
  id: 'overview', title: '一株菜豆',
  html: `<p>按真实生理节奏延时放完一株菜豆的一生（约 56 天）：种子吸胀 → 弯钩顶土 → 子叶出土 → 第一对真叶 → 三出复叶节节高 → 分枝 → 蝶形花 → 豆荚鼓粒。</p>
<p>留意两个经典细节：① 出土时幼芽不是"顶"出来的，而是弯成<b>弯钩</b>、以弯背拱土，保护生长点；② 子叶出土后逐渐萎缩——它把储存的养分让渡给了幼苗。</p>
<p>拖动时间轴或播放；打开「部位标注」对照各结构名称。</p>`,
  enter() {
    clearGroup(world);
    setSunlight(true);
    camTo([1.6, 0.9, 2.1], [0.05, 0.42, 0]);
    hud.show(true);
    ctl.clear();
    const labelsG = new THREE.Group();
    world.add(labelsG);
    const plantG = new THREE.Group();
    world.add(plantG);
    const refresh = () => {
      clearGroup(plantG);
      plantG.add(buildBean(ch1.day));
      clearGroup(labelsG);
      const H = 1.5 * Math.pow(clamp((ch1.day - 6) / 42, 0, 1), 0.85);
      if (ch1.labels) {
        const put = (text, color, pos) => {
          const l = label3(text, color, 0.0042);
          l.position.copy(pos);
          labelsG.add(l);
        };
        if (ch1.day >= 6 && ch1.day < 10) put('弯钩（保护生长点）', '#ffd166', new THREE.Vector3(0.5, 0.25, 0));
        if (ch1.day >= 9 && ch1.day < 22) put('子叶（储存养分）', '#ffd166', new THREE.Vector3(-0.55, 0.14, 0));
        if (ch1.day >= 12) put('真叶', '#9fe870', new THREE.Vector3(0.5, H * 0.22, 0));
        if (ch1.day >= 20) put('三出复叶', '#9fe870', new THREE.Vector3(-0.6, H * 0.5, 0));
        if (ch1.day >= 36) put('蝶形花', '#f2b8cb', new THREE.Vector3(0.45, H * 0.62, 0));
        if (ch1.day >= 46) put('豆荚', '#9fe870', new THREE.Vector3(0.45, H * 0.5, 0));
      }
      hud.set('v1', `第 ${Math.round(ch1.day)} 天 · ${stageName(ch1.day)}`);
      hud.set('v2', `株高 ${H.toFixed(2)} m`);
      hud.set('v3', ch1.day < 56 ? '拖动时间轴或播放' : '一生完成 ↺');
    };
    const tl = timeline(ctl, { max: 56, value: ch1.day, speed: 4, onFrame: (v) => { ch1.day = v; refresh(); } });
    ctl.sep();
    ctl.toggle({ label: '部位标注', value: true, onChange: (v) => { ch1.labels = v; refresh(); } });
    ch1.tick = tl.tick;
    refresh();
    chapterTick = (dt) => { tl.tick(dt); };
  },
  leave() { ch1.tick = null; },
};

function stageName(day) {
  if (day < 4) return '吸胀';
  if (day < 7) return '弯钩顶土';
  if (day < 10) return '出土展子叶';
  if (day < 14) return '真叶展开';
  if (day < 30) return '营养生长（复叶节节高）';
  if (day < 36) return '现蕾';
  if (day < 44) return '开花';
  return '结荚鼓粒';
}

/* ================= 章节 2：种子萌发的条件 ================= */

const ch2 = { day: 7 };

const secGerminate = {
  id: 'germinate', title: '种子萌发的条件',
  html: `<p>四只烧杯做<b>对照实验</b>，每杯 10 粒同批菜豆种子（实际用 1 粒演示）：</p>
<p><b>A</b> 室温 + 适量水 + 通气（<span class="hl">对照</span>）；<b>B</b> 室温 + 不加水；<b>C</b> 加水淹没种子（隔绝空气）；<b>D</b> 适量水 + 冰箱低温。</p>
<p>只有 A 萌发 → 菜豆种子萌发必须同时满足三个外界条件：<span class="hl">充足的水分、充足的空气、适宜的温度</span>（内部条件：胚完整且有活力）。</p>
<p>拖动「天数」看 7 天里的差别；打开标签核对每组变量。</p>`,
  enter() {
    clearGroup(world);
    setSunlight(true);
    camTo([2.4, 1.1, 3.2], [0.9, 0.25, 0]);
    hud.show(true);
    ctl.clear();
    const cupsG = new THREE.Group();
    world.add(cupsG);
    const CUPS = [
      { name: 'A 对照', cond: '水+气+25℃', ok: true },
      { name: 'B 无水', cond: '不加水', ok: false },
      { name: 'C 无气', cond: '水淹没种子', ok: false },
      { name: 'D 低温', cond: '4℃ 冰箱', ok: false },
    ];
    let labels = [];
    const refresh = () => {
      clearGroup(cupsG);
      labels.forEach((l) => world.remove(l));
      labels = [];
      CUPS.forEach((cup, i) => {
        const g = new THREE.Group();
        const x = 0.3 + i * 0.55;
        g.position.x = x;
        // 玻璃杯
        const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.14, 0.42, 24, 1, true),
          new THREE.MeshStandardMaterial({ color: 0xbfe3f2, transparent: true, opacity: 0.22, side: THREE.DoubleSide, roughness: 0.1 }));
        glass.position.y = 0.21;
        g.add(glass);
        // 土壤
        const wet = cup.name === 'B 无水' ? 0x7a6448 : cup.name === 'C 无气' ? 0x3e4a5c : 0x5d4a32;
        const soil = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.13, 0.3, 24), new THREE.MeshStandardMaterial({ color: wet, roughness: 1 }));
        soil.position.y = 0.15;
        g.add(soil);
        // 种子（埋在土表下）
        const seed = makeSeed(ch2.day >= 1 ? 1.25 : 1);
        seed.position.y = 0.27;
        g.add(seed);
        // 萌发状态
        if (cup.ok && ch2.day >= 2) {
          const d = ch2.day;
          const rootLen = smooth(clamp((d - 2) / 4, 0, 1)) * 0.2;
          g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0.26, 0), new THREE.Vector3(0.01, 0.26 - rootLen, 0),
          ]), new THREE.LineBasicMaterial({ color: COL.root })));
          if (d >= 4) {
            const shoot = smooth(clamp((d - 4) / 3, 0, 1)) * 0.22;
            g.add(stemTube([
              new THREE.Vector3(0, 0.26, 0),
              new THREE.Vector3(0.015, 0.26 + shoot * 0.6, 0),
              new THREE.Vector3(0.03, 0.26 + shoot, 0),
            ], COL.stem, 0.009));
            if (d >= 6) {
              const cot = makeCotyledon();
              cot.position.set(0.03, 0.26 + shoot, 0);
              g.add(cot);
            }
          }
        } else if (cup.name === 'C 无气' && ch2.day >= 4) {
          // 水面 + 泡
          const w = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.16, 24),
            new THREE.MeshStandardMaterial({ color: 0x4a90d9, transparent: true, opacity: 0.35 }));
          w.position.y = 0.24;
          g.add(w);
        } else if (cup.name === 'D 低温') {
          // 雪花标注
          const snow = label3('❄', '#9adfff', 0.006);
          snow.position.set(0, 0.5, 0);
          labels.push(snow);
          world.add(snow);
        }
        cupsG.add(g);
        const lbl = label3(`${cup.name} · ${cup.cond}`, cup.ok ? '#9fe870' : '#c9d4de', 0.0042);
        lbl.position.set(x, cup.name === 'D 低温' ? 0.62 : 0.52, 0);
        labels.push(lbl);
        world.add(lbl);
      });
      const sprouted = CUPS[0].ok && ch2.day >= 5 ? '仅 A 杯萌发' : '尚未萌发';
      hud.set('v1', `第 ${Math.round(ch2.day)} 天 · ${sprouted}`);
      hud.set('v2', '变量：水分 / 空气 / 温度');
      hud.set('v3', '单一变量对照 → 结论可靠');
    };
    const tl = timeline(ctl, { max: 7, value: 7, speed: 1.2, onFrame: (v) => { ch2.day = v; refresh(); } });
    ch2.tick = tl.tick;
    refresh();
    chapterTick = (dt) => tl.tick(dt);
  },
};

/* ================= 章节 3：幼苗出土与黄化 ================= */

const ch3 = { day: 12, dark: true };

const secEtiolate = {
  id: 'etiolate', title: '幼苗出土与黄化',
  html: `<p>左边正常光照，右边罩上<b>不透光黑罩</b>（叶绿素合成需要光）。生长十几天后对比：</p>
<p><b>黄化现象</b>：暗处幼苗 <span class="hl">又高又细、叶片小而发黄</span>——没有光就不能合成叶绿素，植株把有限的养分全投给"蹿个子"，赌一把够到光。</p>
<p>这组对照说明：<b>光</b>不是萌发的必需条件（种子在土里也能萌发），但却是<b>幼苗正常发育</b>（叶绿素合成、叶片展开）的必需条件。</p>
<p>切掉黑罩看看右边怎么"追光"变绿——叶绿素几天内重新合成。</p>`,
  enter() {
    clearGroup(world);
    setSunlight(true);
    camTo([2.2, 1.1, 3.4], [0.6, 0.4, 0]);
    hud.show(true);
    ctl.clear();
    const g = new THREE.Group();
    world.add(g);
    const refresh = () => {
      clearGroup(g);
      const left = buildBean(ch3.day, {});
      left.position.x = 0;
      const right = buildBean(ch3.day, { dark: ch3.dark });
      right.position.x = 1.2;
      g.add(left, right);
      if (ch3.dark) {
        // 黑罩
        const cover = new THREE.Mesh(new THREE.BoxGeometry(0.85, 1.6, 0.85), new THREE.MeshStandardMaterial({ color: 0x223042, transparent: true, opacity: 0.85, roughness: 0.6 }));
        cover.position.set(1.2, 0.8, 0);
        g.add(cover);
        const lbl = label3('黑罩', '#9fb2c8', 0.0045);
        lbl.position.set(1.2, 1.75, 0);
        g.add(lbl);
      }
      const lblL = label3('正常光照', '#9fe870', 0.0045);
      lblL.position.set(0, 1.5, 0);
      const lblR = label3(ch3.dark ? '黑暗 → 黄化苗' : '解除黑暗 → 转绿', ch3.dark ? '#e8d98a' : '#9fe870', 0.0045);
      lblR.position.set(1.2, 1.78, 0);
      g.add(lblL, lblR);
      const h1 = 1.5 * Math.pow(clamp((ch3.day - 6) / 42, 0, 1), 0.85);
      const h2 = h1 * 1.35;
      hud.set('v1', `正常株高 ${h1.toFixed(2)} m`);
      hud.set('v2', `黄化株高 ${(ch3.dark ? h2 : h1).toFixed(2)} m（细弱、叶黄）`);
      hud.set('v3', '叶绿素合成必须要有光');
    };
    const tl = timeline(ctl, { min: 8, max: 24, value: 12, speed: 2, onFrame: (v) => { ch3.day = v; refresh(); } });
    ctl.sep();
    ctl.toggle({ label: '黑罩', value: true, onChange: (v) => { ch3.dark = v; refresh(); } });
    refresh();
    chapterTick = (dt) => tl.tick(dt);
  },
};

/* ================= 章节 4：根的生长与向地性 ================= */

const ch4 = { day: 10, tiltDay: null, showTip: true };

const secGeotrop = {
  id: 'geotrop', title: '根的生长与向地性',
  html: `<p>透过根箱玻璃观察根：主根<b>垂直向下</b>扎，侧根斜向四周——这是<b>向地性</b>（重力方向引导的生长）。</p>
<p>做经典的"横放实验"：把整株幼苗<b>横过来放</b>（90°），几天内根尖会<b>主动拐弯</b>重新朝下——重力改变了生长素在根中的分布，靠地一侧生长素多，抑制根的生长，外侧长得快，根于是向下弯。</p>
<p>（茎恰好相反：横放后靠地一侧生长快，茎背地向上弯——根正茎负，方向感相反。）</p>
<p>点「把幼苗横放」，拖天数看根尖的拐弯；红色点是根尖（生长最活跃处）。</p>`,
  enter() {
    clearGroup(world);
    setSunlight(true);
    camTo([1.5, 0.75, 2.3], [0, 0.28, 0.1]);
    hud.show(true);
    ctl.clear();
    const box = makeRootBox();
    box.position.y = 0.78;          // 抬到实验台上，地面不再遮挡
    world.add(box);
    // 实验台
    const table = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.08, 0.9), new THREE.MeshStandardMaterial({ color: 0x8a6844, roughness: 0.9 }));
    table.position.set(0, 0.32, 0);
    world.add(table);
    for (const [lx, lz] of [[-0.6, -0.3], [0.6, -0.3], [-0.6, 0.3], [0.6, 0.3]]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.3, 10), new THREE.MeshStandardMaterial({ color: 0x6f5436 }));
      leg.position.set(lx, 0.14, lz);
      world.add(leg);
    }
    const plantG = new THREE.Group();
    const rootG = new THREE.Group();
    plantG.position.y = 0.78;
    rootG.position.y = 0.78;
    world.add(plantG, rootG);
    const refresh = () => {
      clearGroup(plantG);
      clearGroup(rootG);
      // 苗横放：主茎绕基部转到水平
      if (ch4.tiltDay !== null && ch4.day >= ch4.tiltDay) {
        const stem = buildBean(Math.max(ch4.day - ch4.tiltDay + 8, 8), {});
        stem.rotation.z = -Math.PI / 2;
        plantG.add(stem);
      } else {
        plantG.add(buildBean(Math.min(ch4.day, 12), {}));
      }
      rootG.add(buildRoots(ch4.day, ch4.tiltDay));
      if (ch4.tiltDay !== null && ch4.day >= ch4.tiltDay) {
        const resp = smooth(clamp((ch4.day - ch4.tiltDay) / 4, 0, 1));
        hud.set('v1', `横放后第 ${Math.max(0, Math.round(ch4.day - ch4.tiltDay))} 天`);
        hud.set('v2', `根尖已向地弯折 ${Math.round(resp * 90)}°`);
        hud.set('v3', '茎：背地向上弯 · 根：向地向下弯');
      } else {
        hud.set('v1', `第 ${Math.round(ch4.day)} 天 · 主根垂直向下`);
        hud.set('v2', `根长 ${(0.85 * smooth(clamp((ch4.day - 2) / 16, 0, 1))).toFixed(2)} m`);
        hud.set('v3', '点「横放」做向地性实验');
      }
    };
    const tl = timeline(ctl, { min: 2, max: 18, value: 10, speed: 1.5, onFrame: (v) => { ch4.day = v; if (ch4.tiltDay !== null && ch4.day < ch4.tiltDay) ch4.tiltDay = ch4.day; refresh(); } });
    ctl.sep();
    ctl.button({
      label: '⤵ 把幼苗横放',
      onClick() { ch4.tiltDay = ch4.day; refresh(); },
    });
    ctl.button({
      label: '↺ 复位重种',
      onClick() { ch4.tiltDay = null; ch4.day = 10; tl.slider.set(10); refresh(); },
    });
    refresh();
    chapterTick = (dt) => tl.tick(dt);
  },
};

/* ================= 章节 5：光照强度与光合作用 ================= */

const ch5 = { dist: 30, bubbles: true };

const secPhotosyn = {
  id: 'photosyn', title: '光照强度与光合作用',
  html: `<p>经典装置：一缸水，放进<b>金鱼藻</b>，用灯从侧面照射。光合作用放出的氧气不溶解的部分会形成<b>气泡</b>从切口冒出——数气泡就是数光合速率。</p>
<p>拖动「灯距」：灯越近光照越强，气泡越密；拉远灯，气泡立刻变稀——<span class="hl">在一定范围内，光照越强，光合作用越强</span>。距离足够远（光弱到补偿点以下）时，光合弱于呼吸，不再冒泡。</p>
<p>这个实验（黑-close 装置同源）也是"光合作用释放的氧气来自光的反应"的直接证据。</p>`,
  enter() {
    clearGroup(world);
    setSunlight(false);   // 关日光，只看灯光变量
    camTo([1.6, 0.7, 2.6], [0.2, 0.25, 0]);
    hud.show(true);
    ctl.clear();
    const g = new THREE.Group();
    world.add(g);
    // 水缸
    const tank = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.42, 0.4),
      new THREE.MeshStandardMaterial({ color: 0xbfe3f2, transparent: true, opacity: 0.18, roughness: 0.1, side: THREE.DoubleSide }));
    tank.position.y = 0.21;
    g.add(tank);
    const water = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.36, 0.36),
      new THREE.MeshStandardMaterial({ color: 0x3f7fbf, transparent: true, opacity: 0.3 }));
    water.position.y = 0.19;
    g.add(water);
    // 金鱼藻：几株细丝
    const weed = new THREE.Group();
    for (let i = 0; i < 5; i++) {
      const x = -0.22 + i * 0.11;
      const h = 0.22 + (i % 3) * 0.04;
      const strand = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.006, h, 6), new THREE.MeshStandardMaterial({ color: 0x2e7034, roughness: 0.8 }));
      strand.position.set(x, 0.02 + h / 2, 0);
      strand.rotation.z = (i % 2 ? 1 : -1) * 0.08;
      weed.add(strand);
      for (let k = 0; k < 4; k++) {
        const whorl = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.03, 5), new THREE.MeshStandardMaterial({ color: 0x3f9142, roughness: 0.8 }));
        whorl.position.set(x, 0.06 + k * h / 4, 0);
        whorl.rotation.z = Math.PI / 2;
        whorl.scale.set(1, 0.5, 1);
        weed.add(whorl);
      }
    }
    g.add(weed);
    // 灯
    const lampG = new THREE.Group();
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 12), new THREE.MeshBasicMaterial({ color: 0xffe9a8 }));
    const lampLight = new THREE.PointLight(0xffe9a8, 2.2, 8, 1.6);
    lampG.add(bulb, lampLight);
    const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.55, 8), new THREE.MeshStandardMaterial({ color: 0x8a94a3 }));
    stand.position.y = 0.27;
    lampG.add(stand);
    g.add(lampG);
    // 气泡池
    const bubbles = [];
    for (let i = 0; i < 26; i++) {
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.006 + Math.random() * 0.004, 8, 6), new THREE.MeshBasicMaterial({ color: 0xdff3ff, transparent: true, opacity: 0.85 }));
      b.visible = false;
      bubbles.push({ mesh: b, life: 0, x: 0 });
      g.add(b);
    }
    let spawnAcc = 0;
    const placeLamp = () => {
      const dx = ch5.dist / 100;          // 米
      lampG.position.set(dx, 0.32, 0.1);
      lampLight.intensity = 3.2 / Math.max(0.12, dx);
      bulb.material.color.setHSL(0.12, 0.6, 0.5 + 0.35 / Math.max(1, ch5.dist / 20) * 0.3);
    };
    const rate = () => Math.max(0, Math.round(150 / ch5.dist - 1.1));   // 气泡/分钟（示意模型）
    const refresh = () => {
      placeLamp();
      hud.set('v1', `灯距 ${ch5.dist} cm → 约 ${rate()} 个气泡/分钟`);
      hud.set('v2', rate() <= 0 ? '光太弱：光合 ≤ 呼吸，不冒泡' : '光越强，气泡越密');
      hud.set('v3', '单位时间气泡数 ∝ 光合速率');
    };
    ctl.slider({ label: '灯距 cm', min: 10, max: 90, step: 1, value: 30, fmt: (v) => String(v), onInput: (v) => { ch5.dist = v; refresh(); } });
    ctl.toggle({ label: '气泡', value: true, onChange: (v) => { ch5.bubbles = v; bubbles.forEach((b) => { b.mesh.visible = v && b.life > 0; }); } });
    refresh();
    chapterTick = (dt) => {
      // 气泡生成与上升
      spawnAcc += dt * rate() / 60 * 14;
      while (spawnAcc >= 1) {
        spawnAcc -= 1;
        const b = bubbles.find((bb) => bb.life <= 0);
        if (b) {
          b.life = 1;
          b.x = -0.22 + Math.random() * 0.44;
          b.mesh.position.set(b.x, 0.05, 0);
          b.mesh.visible = ch5.bubbles;
        }
      }
      bubbles.forEach((b) => {
        if (b.life <= 0) return;
        b.life -= dt * 0.4;
        b.mesh.position.y += dt * 0.09;
        b.mesh.position.x += Math.sin(b.mesh.position.y * 40) * 0.0008;
        if (b.life <= 0) b.mesh.visible = false;
      });
      // 水草轻摆
      weed.children.forEach((c, i) => { if (c.geometry?.type === 'CylinderGeometry') c.rotation.x = Math.sin(Date.now() / 900 + i) * 0.05; });
    };
  },
};

/* ================= 章节 6：绿叶在光下制造淀粉 ================= */

const ch6 = { step: 0 };

const secStarch = {
  id: 'starch', title: '绿叶在光下制造淀粉',
  html: `<p>经典五步（萨克斯实验，1862）：① <b>暗处理</b>一昼夜——把原有淀粉运走耗尽；② <b>部分遮光</b>后光照几小时；③ <b>酒精脱色</b>——叶片变黄白色（叶绿素溶入酒精）；④ <b>滴碘液</b>；⑤ 冲洗观察。</p>
<p>结果：见光部分<b>变蓝</b>（淀粉遇碘变蓝），遮光部分不变蓝 → <span class="hl">淀粉是光合作用的产物，光是它的必需条件，叶绿体（见光的绿色部分）是场所</span>。铝箔遮住的部分就是天然的"无光对照"。</p>
<p>点「下一步」走完五步，看叶片颜色如何揭示答案。</p>`,
  enter() {
    clearGroup(world);
    setSunlight(true);
    camTo([1.2, 0.7, 2.2], [0.3, 0.35, 0]);
    hud.show(true);
    ctl.clear();
    const g = new THREE.Group();
    world.add(g);
    // 花盆 + 小株
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.09, 0.18, 20), new THREE.MeshStandardMaterial({ color: 0xa8683f, roughness: 0.9 }));
    pot.position.y = 0.09;
    g.add(pot);
    const stemM = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.01, 0.5, 8), new THREE.MeshStandardMaterial({ color: COL.stem }));
    stemM.position.y = 0.43;
    g.add(stemM);
    // 两片小叶
    for (const s of [-1, 1]) {
      const leaf = makeLeafMesh(COL.leaf);
      leaf.scale.setScalar(0.45);
      leaf.position.set(s * 0.05, 0.55, 0);
      leaf.rotation.set(-1.2, s * 1.6, s * 0.6);
      g.add(leaf);
    }
    // 实验大叶（左右两半独立着色，正对相机）
    function makeHalfLeaf(side) {
      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.bezierCurveTo(side * 0.16, 0.10, side * 0.22, 0.34, 0, 0.62);
      shape.lineTo(0, 0);
      return new THREE.ShapeGeometry(shape, 10);
    }
    const matExposed = new THREE.MeshStandardMaterial({ color: 0x2a5038, side: THREE.DoubleSide, roughness: 0.7 });
    const matCovered = new THREE.MeshStandardMaterial({ color: 0x2a5038, side: THREE.DoubleSide, roughness: 0.7 });
    const halfExposed = new THREE.Mesh(makeHalfLeaf(-1), matExposed);   // 左半 = 见光
    const halfCovered = new THREE.Mesh(makeHalfLeaf(1), matCovered);    // 右半 = 遮光
    const foil = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.66), new THREE.MeshStandardMaterial({ color: COL.foil, side: THREE.DoubleSide, roughness: 0.5, transparent: true, opacity: 0.95 }));
    foil.position.set(0.11, 0.31, 0.01);
    const petiole = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.008, 0.14, 8), new THREE.MeshStandardMaterial({ color: COL.stem }));
    petiole.position.set(0, -0.06, 0);
    const expGroup = new THREE.Group();
    expGroup.add(halfExposed, halfCovered, foil, petiole);
    expGroup.scale.setScalar(1.45);
    expGroup.position.set(0.34, 0.4, 0.26);
    expGroup.rotation.set(-0.3, -0.5, 0.12);
    g.add(expGroup);
    // 烧杯（脱色用）
    const beaker = new THREE.Group();
    const bkGlass = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.2, 20, 1, true), new THREE.MeshStandardMaterial({ color: 0xbfe3f2, transparent: true, opacity: 0.25, side: THREE.DoubleSide }));
    const bkLiq = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.078, 0.12, 20), new THREE.MeshStandardMaterial({ color: 0xd8e8c8, transparent: true, opacity: 0.7 }));
    bkLiq.position.y = -0.02;
    beaker.add(bkGlass, bkLiq);
    beaker.position.set(-0.35, 0.1, 0.2);
    beaker.visible = false;
    g.add(beaker);
    const iodine = new THREE.Mesh(new THREE.SphereGeometry(0.02, 10, 8), new THREE.MeshStandardMaterial({ color: 0x6a4a2f }));
    iodine.visible = false;
    iodine.position.set(0.5, 0.62, 0.2);
    g.add(iodine);
    const stepNames = ['① 暗处理一昼夜', '② 遮光后光照 3 小时', '③ 摘叶，酒精隔水加热脱色', '④ 滴碘液', '⑤ 清洗，观察颜色变化'];
    const apply = () => {
      const st = ch6.step;
      foil.visible = st >= 1 && st <= 2;
      beaker.visible = st === 2;
      iodine.visible = st === 3;
      // 两半着色：见光半边随步骤变化，遮光半边永远"无淀粉"
      if (st <= 1) {
        matExposed.color.set(st === 0 ? 0x2a5038 : COL.leaf);
        matCovered.color.set(st === 0 ? 0x2a5038 : COL.leaf);
        matExposed.transparent = matCovered.transparent = false;
      } else if (st === 2) {
        matExposed.color.set(0xd8d8be);
        matCovered.color.set(0xd8d8be);
        matExposed.transparent = matCovered.transparent = true;
        matExposed.opacity = matCovered.opacity = 0.9;
      } else {
        matExposed.color.set(0x2b2b3a);      // 见光半边：遇碘变蓝黑
        matCovered.color.set(0xd8d0a8);      // 遮光半边：不变蓝
        matExposed.transparent = matCovered.transparent = false;
      }
      hud.set('v1', `当前步骤：${stepNames[ch6.step]}`);
      hud.set('v2', st < 4 ? '按「下一步」推进实验' : '见光半边变蓝（有淀粉），遮光半边不变蓝');
      hud.set('v3', st >= 4 ? '结论：淀粉是光合作用产物，光是必需条件' : '铝箔遮光处 = 无光对照');
      ctl.el.querySelectorAll('.ctl-btn').forEach((b, i) => {
        if (i < stepNames.length) b.classList.toggle('active', i === ch6.step);
      });
    };
    stepNames.forEach((name, i) => {
      ctl.button({ label: name.slice(0, 5), onClick: () => { ch6.step = i; apply(); } });
    });
    apply();
    chapterTick = null;
  },
};

/* ================= 章节 7：蒸腾作用 ================= */

const ch7 = { minutes: 0, bagOn: true, wind: false, light: 60 };

const secTranspire = {
  id: 'transpire', title: '蒸腾作用',
  html: `<p>给盆栽的一根枝条罩上<b>干燥的塑料袋</b>扎紧，放到光下：过一会儿袋内壁出现<b>水珠</b>——水从哪里来？只能来自植物体内，通过叶片<b>气孔</b>以水蒸气形式散出来，这就是<b>蒸腾作用</b>。</p>
<p>影响蒸腾的因素都可以用这套装置测：<span class="hl">光照越强、风越大、空气越干燥，蒸腾越快</span>（气孔张开、水蒸气被带走）。蒸腾的意义：拉动根吸水的水流、运输矿物质、降温。</p>
<p>拖动光照与时间滑杆，开/关风扇，数袋里的水珠。</p>`,
  enter() {
    clearGroup(world);
    setSunlight(true);
    camTo([2.2, 1.0, 2.8], [0.35, 0.75, 0]);
    hud.show(true);
    ctl.clear();
    const g = new THREE.Group();
    world.add(g);
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.1, 0.2, 20), new THREE.MeshStandardMaterial({ color: 0xa8683f, roughness: 0.9 }));
    pot.position.y = 0.1;
    g.add(pot);
    const plantG = new THREE.Group();
    world.add(plantG);
    // 袋 + 水珠
    const bag = new THREE.Mesh(new THREE.SphereGeometry(0.14, 18, 14), new THREE.MeshStandardMaterial({ color: 0xdff3ff, transparent: true, opacity: 0.18, roughness: 0.2 }));
    bag.visible = ch7.bagOn;
    const drops = [];
    for (let i = 0; i < 16; i++) {
      const d = new THREE.Mesh(new THREE.SphereGeometry(0.011, 8, 6), new THREE.MeshBasicMaterial({ color: 0xbfe3f2, transparent: true, opacity: 0.9 }));
      d.visible = false;
      drops.push(d);
      g.add(d);
    }
    g.add(bag);
    const windLines = [];
    for (let i = 0; i < 4; i++) {
      const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-0.6 + i * 0.02, 0.75 + i * 0.06, 0.05), new THREE.Vector3(-0.25 + i * 0.02, 0.72 + i * 0.06, 0.05),
      ]), new THREE.LineDashedMaterial({ color: 0x9fb2c8, dashSize: 0.04, gapSize: 0.05, transparent: true, opacity: 0.8 }));
      l.computeLineDistances();
      l.visible = false;
      windLines.push(l);
      g.add(l);
    }
    const rate = () => {
      if (!ch7.bagOn) return 0;
      const lightF = 0.4 + ch7.light / 100 * 1.2;
      const windF = ch7.wind ? 2.1 : 1;
      return lightF * windF;
    };
    const refresh = () => {
      clearGroup(plantG);
      const plant = buildBean(30, {});
      plant.position.y = 0.2;
      plant.scale.setScalar(0.85);
      plantG.add(plant);
      bag.visible = ch7.bagOn;
      bag.position.set(0.18, 1.15, 0.05);
      bag.scale.set(1.25, 1.45, 1.1);
      windLines.forEach((l) => { l.visible = ch7.wind; });
      const n = Math.min(drops.length, Math.floor(ch7.minutes * rate() / 9));
      drops.forEach((d, i) => {
        d.visible = i < n && ch7.bagOn;
        const ang = (i / drops.length) * Math.PI * 2;
        d.position.set(0.18 + Math.cos(ang) * 0.12, 1.15 + (i % 5) * 0.07 - 0.1, 0.05 + Math.sin(ang) * 0.09);
      });
      hud.set('v1', ch7.bagOn ? `袋内水珠 ${n} 滴（约 ${Math.round(rate() * 10)} 滴/小时）` : '未套袋（水汽散失，看不到水珠）');
      hud.set('v2', `光照 ${Math.round(ch7.light)}%${ch7.wind ? ' · 风扇开' : ''}`);
      hud.set('v3', `已模拟 ${Math.round(ch7.minutes)} 分钟`);
    };
    const tl = timeline(ctl, { min: 0, max: 60, value: 0, speed: 9, fmt: (v) => `${Math.round(v)} 分钟`, onFrame: (v) => { ch7.minutes = v; refresh(); } });
    ctl.sep();
    ctl.slider({ label: '光照 %', min: 10, max: 100, step: 5, value: 60, fmt: (v) => String(v), onInput: (v) => { ch7.light = v; refresh(); } });
    ctl.toggle({ label: '套袋', value: true, onChange: (v) => { ch7.bagOn = v; refresh(); } });
    ctl.toggle({ label: '风扇', value: false, onChange: (v) => { ch7.wind = v; refresh(); } });
    refresh();
    chapterTick = (dt) => tl.tick(dt);
  },
};

/* ================= 章节 8：向光性与生长素 ================= */

const ch8 = { pick: 0 };

const secAuxin = {
  id: 'auxin', title: '向光性与生长素',
  html: `<p>窗台上的幼苗总是弯向窗外——<b>向光性</b>。为什么？两代科学家接力揭秘：</p>
<p><b>达尔文</b>（1880）：金丝雀虉草胚芽鞘在单侧光下弯向光源；<b>切去尖端</b>或<b>罩住尖端</b>就不弯也不长 → 感光的是<b>尖端</b>；<b>温特</b>（1927）：把尖端接触过的琼脂块放在去尖端鞘的一侧，鞘照样弯——尖端真的产生了某种<b>可传递的物质</b>，即<b>生长素</b>。</p>
<p>机理：单侧光让生长素在<b>背光侧</b>积累 → 背光侧长得快 → 芽弯向光源。</p>
<p>四组胚芽鞘再现四个关键对照；点选查看结论。</p>`,
  enter() {
    clearGroup(world);
    setSunlight(true);
    camTo([0.8, 0.55, 1.55], [0.68, 0.26, 0]);
    hud.show(true);
    ctl.clear();
    const g = new THREE.Group();
    world.add(g);
    // 光源（右侧，箭头指向标本）
    const lightG = new THREE.Group();
    const sunDot = new THREE.Mesh(new THREE.SphereGeometry(0.05, 14, 10), new THREE.MeshBasicMaterial({ color: 0xffe9a8 }));
    sunDot.position.set(0, 0, 0);
    for (let i = 0; i < 3; i++) {
      const ray = new THREE.Line(new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-0.03 - i * 0.06, (i - 1) * 0.04, 0),
        new THREE.Vector3(-0.34 - i * 0.06, (i - 1) * 0.04, 0),
      ]), new THREE.LineBasicMaterial({ color: 0xffe08a, transparent: true, opacity: 0.8 }));
      lightG.add(ray);
    }
    const lbl = label3('单侧光', '#ffd166', 0.003);
    lbl.position.set(-0.28, -0.15, 0);
    lightG.add(sunDot, lbl);
    lightG.position.set(1.72, 0.58, 0);
    g.add(lightG);
    const SPECS = [
      { name: 'A 常规', desc: '尖端感光 → 弯向光源', bend: 1 },
      { name: 'B 切尖', desc: '无尖端：不生长不弯曲', bend: 0 },
      { name: 'C 尖端罩锡箔', desc: '尖端感不到光 → 直立生长', bend: 0 },
      { name: 'D 尖端下罩锡箔', desc: '尖端仍感光 → 照常弯曲', bend: 1 },
    ];
    let groups = [];
    const build = () => {
      groups.forEach((grp) => clearGroup(grp));
      groups.forEach((grp) => g.remove(grp));
      groups = [];
      SPECS.forEach((sp, i) => {
        const grp = new THREE.Group();
        const x = 0.18 + i * 0.44;
        const bend = sp.bend * 0.24;
        const bends = (i === 0 || i === 3);   // A 与 D 弯向光源
        const pts = [];
        for (let k = 0; k <= 6; k++) {
          const t = k / 6;
          const bx = bends ? bend * t * t : 0;
          pts.push(new THREE.Vector3(x + bx, 0.26 * t, 0));
        }
        grp.add(stemTube(pts, 0xd9d078, 0.015));
        if (sp.name === 'B 切尖') {
          const cut = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.006, 10), new THREE.MeshStandardMaterial({ color: 0xb9ae62 }));
          cut.position.set(x, 0.26, 0);
          grp.add(cut);
        }
        if (i === 2 || i === 3) {
          const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.019, 0.019, i === 2 ? 0.05 : 0.06, 12),
            new THREE.MeshStandardMaterial({ color: COL.foil, roughness: 0.5 }));
          cap.position.set(x, i === 2 ? 0.235 : 0.175, 0);
          grp.add(cap);
        }
        if (sp.bend) {
          const aux = new THREE.Mesh(new THREE.SphereGeometry(0.011, 8, 6), new THREE.MeshBasicMaterial({ color: 0xd9a13f, transparent: true, opacity: 0.85 }));
          aux.position.set(x - bend * 0.4 - 0.016, 0.15, 0);   // 背光侧（远离光源）
          grp.add(aux);
        }
        const lbl = label3(sp.name.slice(0, 1), i === ch8.pick ? '#e8674a' : '#8a94a3', 0.0032);
        lbl.position.set(x, 0.38, 0);
        grp.add(lbl);
        groups.push(grp);
        g.add(grp);
      });
      const sp = SPECS[ch8.pick];
      hud.set('v1', `${sp.name}：${sp.desc}`);
      hud.set('v2', ch8.pick === 0 ? '对照：弯向光源' : ch8.pick === 1 ? '变量：无尖端' : ch8.pick === 2 ? '变量：尖端遮光' : '变量：尖端下部遮光');
      hud.set('v3', '金色点 = 背光侧生长素（长得快）');
    };
    ctl.seg({
      options: SPECS.map((sp, i) => ({ label: sp.name.replace(/^A |^B |^C |^D /, ''), value: String(i) })),
      value: '0',
      onChange: (v) => { ch8.pick = +v; build(); },
    });
    ctl.sep();
    ctl.toggle({ label: '单侧光', value: true, onChange: (v) => { lightG.visible = v; } });
    build();
    chapterTick = null;
  },
};

/* ================= 章节 9：开花与结果 ================= */

const ch9 = { day: 36, pollinated: false };

const secFlower = {
  id: 'flower', title: '开花与结果',
  html: `<p>菜豆是<b>自花传粉</b>作物：蝶形花冠包着雄蕊与雌蕊，多在开花前已完成自交。传粉受精后，花的剧本这样改写：</p>
<p><span class="hl">花萼宿存 · 花瓣凋落 · 雄蕊凋落 · 柱头与花柱凋落 · 子房发育成果实（豆荚） · 胚珠发育成种子（豆粒）</span>。</p>
<p>把时间轴拖过 36 天：花谢的地方结出细荚，荚一天天鼓起来——里面就是下一代的种子。点「授粉结荚」直接跳到结果期。</p>`,
  enter() {
    clearGroup(world);
    setSunlight(true);
    camTo([2.4, 1.5, 3.2], [0, 1.0, 0]);
    hud.show(true);
    ctl.clear();
    const plantG = new THREE.Group();
    world.add(plantG);
    const labelsG = new THREE.Group();
    world.add(labelsG);
    const refresh = () => {
      clearGroup(plantG);
      clearGroup(labelsG);
      const d = ch9.pollinated ? Math.max(ch9.day, 46) : ch9.day;
      plantG.add(buildBean(Math.min(d, 56)));
      if (ch9.pollinated && ch9.day >= 46) {
        const lbl = label3('子房 → 豆荚（果实）', '#9fe870', 0.0045);
        lbl.position.set(0.5, 0.85, 0);
        labelsG.add(lbl);
      }
      hud.set('v1', `第 ${Math.round(d)} 天 · ${d < 36 ? '现蕾' : d < 44 ? '开花（自花传粉）' : '结荚鼓粒'}`);
      hud.set('v2', d < 44 ? '花瓣内已完成传粉受精' : '子房壁→果皮 · 胚珠→种子');
      hud.set('v3', ch9.pollinated ? '已授粉：荚在鼓粒' : '拖动天数或点「授粉结荚」');
    };
    const tl = timeline(ctl, { min: 30, max: 56, value: 36, speed: 2.4, onFrame: (v) => { ch9.day = v; refresh(); } });
    ctl.sep();
    ctl.button({
      label: '授粉结荚 →',
      onClick() { ch9.pollinated = true; ch9.day = 46; tl.slider.set(46); refresh(); },
    });
    ctl.button({
      label: '↺ 回到开花',
      onClick() { ch9.pollinated = false; ch9.day = 36; tl.slider.set(36); refresh(); },
    });
    refresh();
    chapterTick = (dt) => tl.tick(dt);
  },
};

/* ================= 章节 10：自由培养 ================= */

const ch10 = { day: 30, light: 70, water: 65, temp: 24, fert: 50 };

const secSandbox = {
  id: 'sandbox', title: '自由培养',
  html: `<p>自由实验台：四个环境旋钮随你调，看这株菜豆怎么长：</p>
<p><b>光照</b>：低于 30% 黄化徒长（又高又细叶发黄），高于 70% 叶色深绿；<b>水分</b>：低于 30% 缺水萎蔫（叶片下垂），过高易烂根（长势也降）；<b>温度</b>：15–32℃ 舒适区间，过冷过热都减速；<b>肥料</b>：中等最健康——注意"多多益善"是误区，过量施肥（烧根）反而长不好。</p>
<p>综合长势 = 光 × 水 × 温 × 肥的乘性组合——任何一项成为短板都会拖垮整体（<b>短板效应</b>）。</p>`,
  enter() {
    clearGroup(world);
    setSunlight(true);
    camTo([2.6, 1.4, 3.0], [0, 0.7, 0]);
    hud.show(true);
    ctl.clear();
    const plantG = new THREE.Group();
    world.add(plantG);
    const health = () => {
      const lf = ch10.light < 30 ? 0.45 : 0.8 + (ch10.light - 30) / 70 * 0.3;
      const wf = ch10.water < 30 ? 0.35 + ch10.water / 30 * 0.4 : ch10.water > 92 ? 0.6 : 0.85 + (ch10.water - 30) / 70 * 0.2;
      const tf = ch10.temp < 12 || ch10.temp > 34 ? 0.25 : ch10.temp < 15 || ch10.temp > 32 ? 0.6 : 1;
      const ff = 1 - Math.abs(ch10.fert - 55) / 55 * 0.55;
      return Math.max(0.15, lf * wf * tf * ff);
    };
    const effH = () => health();
    const refresh = () => {
      clearGroup(plantG);
      const h = health();
      const day = 12 + ch10.day * h * 0.9;
      const opts = {
        dark: ch10.light < 25,
        droop: ch10.water < 32 ? (32 - ch10.water) / 32 * 0.8 : 0,
        colorMod: (ch10.light < 40 ? 0.7 : 0) + (ch10.fert > 88 ? 0.4 : 0),
      };
      const plant = buildBean(day, opts);
      plant.scale.setScalar(0.55 + h * 0.5);
      plantG.add(plant);
      const grade = h > 0.62 ? '茁壮' : h > 0.42 ? '正常' : h > 0.28 ? '蔫头耷脑' : '危在旦夕';
      hud.set('v1', `长势：${grade}（综合系数 ${(h * 100).toFixed(0)}）`);
      const notes = [];
      if (ch10.light < 30) notes.push('光照不足→黄化徒长');
      if (ch10.water < 30) notes.push('缺水→萎蔫');
      if (ch10.water > 92) notes.push('积水→烂根');
      if (ch10.temp < 15 || ch10.temp > 32) notes.push('温度不适→生长停滞');
      if (ch10.fert > 88) notes.push('肥过量→烧根');
      if (!notes.length) notes.push('各条件都在舒适区间');
      hud.set('v2', notes.join(' · '));
      hud.set('v3', '任一短板都会拖垮整体');
    };
    ctl.slider({ label: '光照 %', min: 5, max: 100, step: 5, value: 70, fmt: (v) => String(v), onInput: (v) => { ch10.light = v; refresh(); } });
    ctl.slider({ label: '水分 %', min: 5, max: 100, step: 5, value: 65, fmt: (v) => String(v), onInput: (v) => { ch10.water = v; refresh(); } });
    ctl.slider({ label: '温度 ℃', min: 5, max: 40, step: 1, value: 24, fmt: (v) => String(v), onInput: (v) => { ch10.temp = v; refresh(); } });
    ctl.slider({ label: '肥料 %', min: 0, max: 100, step: 5, value: 50, fmt: (v) => String(v), onInput: (v) => { ch10.fert = v; refresh(); } });
    ctl.sep();
    ctl.slider({ label: '培养天数', min: 10, max: 55, step: 1, value: 30, fmt: (v) => String(v), onInput: (v) => { ch10.day = v; refresh(); } });
    refresh();
    chapterTick = null;
  },
};

/* ================= 章节 11：随堂检测 ================= */

const QUIZ = [
  {
    q: '种子萌发必需的外界条件组合是？',
    opts: ['光、水、肥', '水分、空气、适宜温度', '光、空气、土壤', '水、光、温度'],
    a: 1,
    ex: '对照实验表明：充足水分、充足空气、适宜温度三者缺一不可。光不是萌发必需（土里的种子照样萌发）。',
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
    ex: '根具有向地性：横放后重力使生长素在靠地侧积累，抑制根的生长，外侧长得快，根向下弯（茎则背地向上弯）。',
  },
  {
    q: '萨克斯实验中，叶片遮光部分滴碘后不变蓝，说明？',
    opts: ['遮光处没有叶绿体', '淀粉是光合作用产物且光为必需条件', '碘只与叶绿素反应', '遮光处呼吸作用强'],
    a: 1,
    ex: '见光部分变蓝（有淀粉）、遮光部分不变蓝（无淀粉）——淀粉是光合作用的产物，光是它的必需条件。',
  },
  {
    q: '胚芽鞘切去尖端后放在单侧光下，结果是？',
    opts: ['弯向光源', '弯向背光侧', '不生长也不弯曲', '先直后弯'],
    a: 2,
    ex: '达尔文实验：无尖端则既不生长也不弯曲——尖端产生生长素并感受光刺激。温特进一步证明这种"影响"可以从尖端传递。',
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

const SECTIONS = [
  secOverview, secGerminate, secEtiolate, secGeotrop, secPhotosyn,
  secStarch, secTranspire, secAuxin, secFlower, secSandbox,
  {
    id: 'quiz', title: '随堂检测',
    html: `<p>5 道题检验本章掌握情况。答完可重新开始。</p>`,
    enter() {
      clearGroup(world);
      setSunlight(true);
      camTo([2.6, 1.4, 3.0], [0, 0.7, 0]);
      hud.show(false);
      ctl.clear();
      // 背景：成熟的菜豆线稿感
      const plant = buildBean(50, {});
      world.add(plant);
      showQuiz();
    },
  },
];

const sections = createSections({
  nav: document.getElementById('sideNav'),
  descPanel: document.getElementById('descPanel'),
  sections: SECTIONS,
  onSelect(i, sec) {
    if (activeCleanup) { activeCleanup(); activeCleanup = null; }
    chapterTick = null;
    sec.enter();
  },
});
window.__eduSections = sections;
sections.select(0);

app.onFrame((dt) => {
  cameraTweenTick(app, dt);
  if (chapterTick) chapterTick(dt);
});

loader.hide();
