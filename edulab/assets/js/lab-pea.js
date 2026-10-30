/* EduLab · 孟德尔豌豆杂交实验（pea）
 * 章节：为什么选豌豆 / 人工异花授粉 / 一对相对性状的杂交 / 测交：验证分离 /
 *       两对相对性状的杂交 / 七对性状自由探究 / 假说—演绎法 / 随堂检测
 * 场景：修道院豆园（程序化豌豆植株 + 七对相对性状展台）、花的解剖特写（去雄/套袋/授粉/挂牌）、
 *       F1/F2 植株群 + 种子分拣台（随机抽样 + 卡方检验）、孟德尔纸棋盘（Punnett 画布板）。
 */
import {
  THREE, TAU, clamp,
  createApp, cameraTweenTick, makeLoader,
  createSections, createControlsPanel, makeHUD, makeTextSprite, setSpriteText,
} from './edu-core.js';

/* ---------------- 基础 ---------------- */

const stage = document.getElementById('stage');
const loader = makeLoader(stage, '正在翻土播种…');
const app = createApp({
  container: stage,
  fov: 42, near: 0.1, far: 300,
  cameraPos: [0, 3.2, 10.5], target: [0, 1.3, 0],
  minDistance: 1.0, maxDistance: 60,
});
const { scene, camera, controls } = app;

scene.add(new THREE.AmbientLight(0xe8eef2, 1.0));
const sun = new THREE.DirectionalLight(0xfff0d8, 2.0);
sun.position.set(-8, 14, 7);
scene.add(sun);
const fill = new THREE.DirectionalLight(0xbcd4ff, 0.4);
fill.position.set(6, 5, -6);
scene.add(fill);

const M = (color, rough = 0.8, metal = 0, extra = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, ...extra });
const mesh = (geo, mat) => new THREE.Mesh(geo, mat);
function label(text, color = '#ffffff', scale = 0.0046, bg = 'rgba(10,16,24,0.72)') {
  return makeTextSprite(text, { fontSize: 32, color, scale, bg });
}

const C_GREEN = 0x59a05a, C_GREEN_D = 0x3c7a42, C_POD = 0x6fae5e, C_POD_Y = 0xd9c25e;
const C_PURPLE = 0x9d6fd9, C_WHITE = 0xf2efe6, C_SOIL = 0x6b5238, C_YELLOW = 0xf2d05e;

/* ---------------- 程序化豌豆植株 ---------------- */

function makePlant({ height = 2.6, flowerColor = C_PURPLE, flowerTop = false, tendril = true }) {
  const g = new THREE.Group();
  // 茎（S 微弯）
  const pts = [];
  const seg = 10;
  for (let i = 0; i <= seg; i++) {
    const t = i / seg;
    pts.push(new THREE.Vector3(Math.sin(t * 4) * 0.09 * height * 0.4, t * height, Math.cos(t * 3) * 0.06));
  }
  const stem = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.035, 8), M(C_GREEN_D, 0.7));
  g.add(stem);
  // 复叶（三小叶椭圆板）
  const leafM = M(C_GREEN, 0.75);
  const leafR = 0.16 * clamp(height / 2.6, 0.4, 1);
  for (let i = 1; i <= Math.max(3, Math.round(height / 0.7)); i++) {
    const y = (i / (height / 0.7 + 1)) * height;
    for (const side of [-1, 1]) {
      const leaf = mesh(new THREE.SphereGeometry(leafR, 10, 8), leafM);
      leaf.scale.set(1.6, 0.45, 0.9);
      leaf.position.set(side * 0.24, y, 0.05 * i % 0.1);
      leaf.rotation.z = side * -0.5;
      g.add(leaf);
    }
  }
  // 卷须
  if (tendril) {
    const tp = [];
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      tp.push(new THREE.Vector3(Math.sin(t * 12) * 0.1 * t, height + t * 0.25, Math.cos(t * 10) * 0.1 * t));
    }
    g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(tp), 40, 0.012, 6), M(C_GREEN, 0.7)));
  }
  // 花（蝶形：旗翼龙骨瓣）
  function makeFlower(color) {
    const f = new THREE.Group();
    const pm = M(color, 0.6);
    const flag = mesh(new THREE.SphereGeometry(0.09, 10, 8), pm);
    flag.scale.set(1.4, 0.5, 1.1);
    flag.position.y = 0.09;
    const wingL = mesh(new THREE.SphereGeometry(0.07, 10, 8), pm);
    wingL.scale.set(0.7, 1.0, 0.6); wingL.position.set(-0.1, 0.02, 0); wingL.rotation.z = 0.7;
    const wingR = wingL.clone(); wingR.position.x = 0.1; wingR.rotation.z = -0.7;
    const keel = mesh(new THREE.SphereGeometry(0.075, 10, 8), M(color, 0.6, 0, { transparent: true, opacity: 0.92 }));
    keel.scale.set(0.8, 0.9, 1.2); keel.position.y = -0.01;
    f.add(flag, wingL, wingR, keel);
    return f;
  }
  if (flowerTop) {
    const f = makeFlower(flowerColor);
    f.position.set(0, height + 0.12, 0);
    g.add(f);
    g.userData.flowerAt = '顶';
  } else {
    const f = makeFlower(flowerColor);
    f.position.set(0.28, height * 0.62, 0.1);
    g.add(f);
    g.userData.flowerAt = '腋';
  }
  // 豆荚
  function makePod(color, constricted) {
    const pod = new THREE.Group();
    if (!constricted) {
      pod.add(mesh(new THREE.CapsuleGeometry(0.07, 0.3, 4, 10), M(color, 0.7)));
    } else {
      for (let i = 0; i < 3; i++) {
        const s = mesh(new THREE.SphereGeometry(0.08, 10, 8), M(color, 0.7));
        s.position.x = (i - 1) * 0.11;
        s.scale.set(1.25, 0.85, 0.85);
        pod.add(s);
      }
    }
    return pod;
  }
  const pod = makePod(C_POD, false);
  pod.position.set(-0.3, height * 0.45, 0.1);
  pod.rotation.z = 0.3;
  g.add(pod);
  g.userData.setPod = (color, constricted) => {
    pod.clear();
    pod.add(...(constricted
      ? [0, 1, 2].map((i) => {
        const s = mesh(new THREE.SphereGeometry(0.08, 10, 8), M(color, 0.7));
        s.position.x = (i - 1) * 0.11;
        s.scale.set(1.25, 0.85, 0.85);
        return s;
      })
      : [mesh(new THREE.CapsuleGeometry(0.07, 0.3, 4, 10), M(color, 0.7))]));
  };
  return g;
}

/* ================= 场景一：豆园 ================= */

const gGarden = new THREE.Group();
gGarden.visible = false;
scene.add(gGarden);

{
  // 土地与草皮
  const soil = mesh(new THREE.BoxGeometry(18, 0.5, 12), M(C_SOIL, 0.95));
  soil.position.y = -0.25;
  const grass = mesh(new THREE.BoxGeometry(18, 0.1, 12), M(0x7aa85a, 0.9));
  grass.position.y = 0.02;
  gGarden.add(soil, grass);
  // 种植行土垄
  const row = mesh(new THREE.BoxGeometry(9, 0.25, 1.6), M(0x5a442e, 0.95));
  row.position.set(-2.5, 0.1, 0);
  const row2 = row.clone(); row2.position.set(6.8, 0.1, 0); row2.scale.set(0.55, 1, 1);
  gGarden.add(row, row2);

  // 高茎 vs 矮茎
  const tall = makePlant({ height: 2.7 });
  tall.position.set(-4.2, 0.15, 0);
  const dwarf = makePlant({ height: 1.05, flowerColor: C_WHITE });
  dwarf.position.set(-1.2, 0.15, 0.35);
  gGarden.add(tall, dwarf);
  const tallLbl = label('高茎（1.8~2 m）', '#cfe6cf', 0.0046);
  tallLbl.position.set(-4.2, 3.1, 0);
  const dwarfLbl = label('矮茎（0.3~0.5 m）', '#cfe6cf', 0.0046);
  dwarfLbl.position.set(-1.2, 1.45, 0.35);
  gGarden.add(tallLbl, dwarfLbl);

  // 花色对照：紫花株
  const purple = makePlant({ height: 1.6 });
  purple.position.set(1.6, 0.15, -0.2);
  gGarden.add(purple);
  const purpleLbl = label('紫花', '#e2ccff', 0.0046);
  purpleLbl.position.set(1.6, 2.0, -0.2);
  gGarden.add(purpleLbl);

  // 七对相对性状展台（右侧）
  const bench = mesh(new THREE.BoxGeometry(3.6, 0.18, 1.3), M(0x8a6a48, 0.85));
  bench.position.set(7.0, 0.85, 0);
  gGarden.add(bench);
  const traitStands = [];
  const traitDefs = [
    ['茎的高矮', () => { const a = makePlant({ height: 0.8 }); a.position.y = 0.55; const b = makePlant({ height: 0.32 }); b.position.set(0.42, 0.5, 0); const g = new THREE.Group(); g.add(a, b); g.position.set(-1.45, 0, 0); return g; }, '高 × 矮'],
    ['花的位置', () => { const a = makePlant({ height: 0.75 }); a.userData.flowerAt = '腋'; const b = makePlant({ height: 0.7, flowerTop: true }); b.position.x = 0.42; const g = new THREE.Group(); g.add(a, b); g.position.set(-0.95, 0, 0); return g; }, '腋生 × 顶生'],
    ['花色', () => { const fa = makeFlowerMini(C_PURPLE); fa.position.set(-0.18, 1.02, 0); const fb = makeFlowerMini(C_WHITE); fb.position.set(0.24, 1.02, 0); const g = new THREE.Group(); g.add(fa, fb); return g; }, '紫 × 白'],
    ['荚形', () => { const pa = mesh(new THREE.CapsuleGeometry(0.09, 0.34, 4, 10), M(C_POD, 0.7)); pa.rotation.z = TAU / 4; pa.position.set(-0.18, 1.0, 0); const pb = new THREE.Group(); [0, 1, 2].forEach((i) => { const s = mesh(new THREE.SphereGeometry(0.095, 10, 8), M(C_POD, 0.7)); s.position.x = (i - 1) * 0.13; s.scale.set(1.3, 0.85, 0.85); pb.add(s); }); pb.position.set(0.24, 1.0, 0); const g = new THREE.Group(); g.add(pa, pb); return g; }, '饱满 × 缢缩'],
    ['荚色', () => { const pa = mesh(new THREE.CapsuleGeometry(0.09, 0.34, 4, 10), M(C_POD, 0.7)); pa.rotation.z = TAU / 4; pa.position.set(-0.18, 1.0, 0); const pb = mesh(new THREE.CapsuleGeometry(0.09, 0.34, 4, 10), M(C_POD_Y, 0.7)); pb.rotation.z = TAU / 4; pb.position.set(0.24, 1.0, 0); const g = new THREE.Group(); g.add(pa, pb); return g; }, '绿 × 黄'],
    ['种子形状', () => { const sa = mesh(new THREE.SphereGeometry(0.11, 14, 10), M(C_GREEN_D, 0.6)); sa.position.set(-0.18, 1.0, 0); const sb = mesh(new THREE.SphereGeometry(0.12, 14, 10), M(C_GREEN_D, 0.6)); sb.scale.set(1.25, 0.78, 0.9); sb.position.set(0.24, 1.0, 0); const g = new THREE.Group(); g.add(sa, sb); return g; }, '圆粒 × 皱粒'],
    ['子叶颜色', () => { const sa = mesh(new THREE.SphereGeometry(0.11, 14, 10), M(C_YELLOW, 0.6)); sa.position.set(-0.18, 1.0, 0); const sb = mesh(new THREE.SphereGeometry(0.11, 14, 10), M(C_GREEN_D, 0.6)); sb.position.set(0.24, 1.0, 0); const g = new THREE.Group(); g.add(sa, sb); return g; }, '黄 × 绿'],
  ];
  function makeFlowerMini(color) {
    const f = new THREE.Group();
    const flag = mesh(new THREE.SphereGeometry(0.1, 10, 8), M(color, 0.6));
    flag.scale.set(1.4, 0.5, 1.1);
    flag.position.y = 0.1;
    f.add(flag);
    return f;
  }
  traitDefs.forEach(([name, maker, pair]) => {
    const stand = mesh(new THREE.CylinderGeometry(0.1, 0.13, 0.85, 12), M(0x7a5c3e, 0.85));
    stand.position.set(0, 0.42, 0);
    const g = new THREE.Group();
    g.add(stand);
    g.add(maker());
    const lb = label(name + '\n' + pair, '#e8f0e0', 0.0034);
    lb.position.set(0, 1.55, 0);
    g.add(lb);
    g.position.y = 0.85;
    g.userData.pairName = pair;
    traitStands.push(g);
  });
  traitStands.forEach((g, i) => {
    g.position.x = 5.85 + (i % 4) * 0.82;
    g.position.z = i < 4 ? 0.35 : -0.35;
    gGarden.add(g);
  });
}

/* ================= 场景二：花的解剖特写（人工授粉） ================= */

const gFlower = new THREE.Group();
gFlower.visible = false;
scene.add(gFlower);

const flower = {};
{
  // 花萼 + 花柄
  const stem = mesh(new THREE.CylinderGeometry(0.09, 0.12, 2.4, 10), M(C_GREEN_D, 0.75));
  stem.position.y = -1.2;
  gFlower.add(stem);
  // 旗瓣/翼瓣/龙骨瓣（放大）
  const flag = mesh(new THREE.SphereGeometry(0.85, 16, 12), M(C_PURPLE, 0.6));
  flag.scale.set(1.5, 0.55, 1.25);
  flag.position.y = 0.75;
  const wingL = mesh(new THREE.SphereGeometry(0.6, 14, 10), M(0xb893e8, 0.6));
  wingL.scale.set(0.7, 1.05, 0.6); wingL.position.set(-0.95, 0.05, 0); wingL.rotation.z = 0.8;
  const wingR = wingL.clone(); wingR.position.x = 0.95; wingR.rotation.z = -0.8;
  gFlower.add(flag, wingL, wingR);
  flower.wings = [flag, wingL, wingR];
  // 龙骨瓣（包住雄蕊雌蕊，打开=剖开）
  const keelL = mesh(new THREE.SphereGeometry(0.62, 14, 10), M(0x8f5fd0, 0.55, 0, { transparent: true, opacity: 0.55 }));
  keelL.scale.set(0.9, 1.1, 0.5); keelL.position.set(-0.2, 0.15, 0.3);
  const keelR = keelL.clone(); keelR.position.z = -0.3;
  gFlower.add(keelL, keelR);
  flower.keels = [keelL, keelR];
  // 雄蕊 ×10（去雄对象）
  flower.stamens = new THREE.Group();
  {
    const antherM = M(0xf2c05e, 0.5);
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * TAU;
      const fil = mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.5, 6), M(0xe8e2cc, 0.6));
      fil.position.set(Math.cos(a) * 0.12, 0.25, Math.sin(a) * 0.12);
      fil.rotation.z = Math.cos(a) * 0.25;
      const anther = mesh(new THREE.SphereGeometry(0.05, 8, 6), antherM);
      anther.position.set(Math.cos(a) * 0.2, 0.5, Math.sin(a) * 0.2);
      flower.stamens.add(fil, anther);
    }
  }
  gFlower.add(flower.stamens);
  // 雌蕊（柱头）
  const pistil = mesh(new THREE.CylinderGeometry(0.035, 0.05, 0.65, 8), M(0xc9e8a0, 0.6));
  pistil.position.y = 0.3;
  const stigma = mesh(new THREE.SphereGeometry(0.075, 10, 8), M(0xd9f0b0, 0.5));
  stigma.position.y = 0.65;
  gFlower.add(pistil, stigma);
  flower.pollen = mesh(new THREE.SphereGeometry(0.1, 12, 8), M(0xf2d05e, 0.45, 0, { emissive: 0x8a6a10, emissiveIntensity: 0.35 }));
  flower.pollen.position.set(0.9, 1.3, 0.4);
  flower.pollen.visible = false;
  gFlower.add(flower.pollen);
  // 套袋（纸袋）
  const bag = mesh(new THREE.CylinderGeometry(0.62, 0.82, 1.6, 16, 1, true), M(0xd9cba8, 0.8, 0, { transparent: true, opacity: 0.4, side: THREE.DoubleSide }));
  bag.position.y = 0.4;
  bag.visible = false;
  gFlower.add(bag);
  flower.bag = bag;
  // 标牌
  const tag = label('杂交组合：紫花 × 白花', '#ffe9b0', 0.0044);
  tag.position.set(0, -2.0, 0);
  tag.visible = false;
  gFlower.add(tag);
  flower.tag = tag;
  // 镊子/毛刷提示
  const toolLbl = label('', '#ffffff', 0.0046);
  toolLbl.position.set(0, 2.3, 0);
  gFlower.add(toolLbl);
  flower.toolLbl = toolLbl;
}

const pollin = { step: 0 };  // 0 无 → 1 去雄 → 2 套袋 → 3 授粉 → 4 再套袋挂牌
const STEPS_P = [
  '① 除去未成熟花的全部雄蕊（去雄）',
  '② 套上纸袋（防止外来花粉干扰）',
  '③ 采集另一株的花粉，授在柱头上',
  '④ 再套袋 + 挂牌标记（杂交完成）',
];

function applyPollinStep() {
  flower.stamens.visible = pollin.step < 1;
  flower.bag.visible = pollin.step >= 2;
  flower.pollen.visible = pollin.step === 3;
  flower.tag.visible = pollin.step >= 4;
  flower.keels.forEach((k) => { k.material.opacity = pollin.step === 0 ? 0.55 : 0.18; });
  setSpriteText(flower.toolLbl, pollin.step === 0 ? '当前：花蕾期，雄蕊未成熟' : STEPS_P[Math.min(pollin.step, 4) - 1], { fontSize: 32, color: '#ffffff', scale: 0.0046, bg: 'rgba(10,16,24,0.72)' });
}

/* ================= 场景三：杂交 + 分拣台 ================= */

const gTray = new THREE.Group();
gTray.visible = false;
scene.add(gTray);

// 纸棋盘板（Punnett canvas）
const pCv = document.createElement('canvas');
pCv.width = 620; pCv.height = 470;
const pTex = new THREE.CanvasTexture(pCv);
pTex.colorSpace = THREE.SRGBColorSpace;
{
  const board = mesh(new THREE.PlaneGeometry(5.4, 4.1), new THREE.MeshBasicMaterial({ map: pTex }));
  board.position.set(0, 2.35, -0.6);
  gTray.add(board);
  const frame = mesh(new THREE.BoxGeometry(5.7, 4.4, 0.06), M(0x5a442e, 0.8));
  frame.position.set(0, 2.35, -0.66);
  gTray.add(frame);
}

function drawPunnett({ title, gametes1 = [], gametes2 = [], cells = [], note = '' }) {
  const c = pCv.getContext('2d');
  const W = pCv.width, H = pCv.height;
  const dark = document.documentElement.getAttribute('data-theme') === 'dark';
  c.fillStyle = dark ? '#12161e' : '#f6f2e8';
  c.fillRect(0, 0, W, H);
  const fg = dark ? '#e6ecf2' : '#1a2230';
  c.fillStyle = fg;
  c.font = 'bold 26px sans-serif';
  c.textAlign = 'center';
  c.fillText(title, W / 2, 40);
  const n1 = gametes1.length, n2 = gametes2.length;
  if (n1 && n2) {
    const x0 = 130, y0 = 110, cw = Math.min(90, (W - x0 - 30) / n2), ch = Math.min(60, (H - y0 - 90) / n1);
    c.font = 'bold 22px serif';
    gametes1.forEach((g, i) => c.fillText(g, x0 - 30, y0 + ch * (i + 0.5) + 8));
    gametes2.forEach((g, j) => c.fillText(g, x0 + cw * (j + 0.5), y0 - 16));
    cells.forEach((row, i) => row.forEach((cell, j) => {
      c.strokeStyle = dark ? '#3a4656' : '#9aa2ae';
      c.lineWidth = 1.5;
      c.strokeRect(x0 + j * cw, y0 + i * ch, cw, ch);
      c.fillStyle = fg;
      c.font = 'bold 20px serif';
      c.fillText(cell, x0 + cw * (j + 0.5), y0 + ch * (i + 0.5) + 7);
    }));
  }
  c.fillStyle = fg;
  c.font = '19px sans-serif';
  const lines = note.split('\n');
  lines.forEach((l, i) => c.fillText(l, W / 2, H - 100 + i * 26));
  pTex.needsUpdate = true;
}

// 种子托盘（InstancedMesh 球，可染色可压扁）
const TRAY_MAX = 240;
const seedMesh = new THREE.InstancedMesh(
  new THREE.SphereGeometry(0.16, 12, 10),
  new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.55 }),
  TRAY_MAX
);
{
  const tray = mesh(new THREE.BoxGeometry(7.4, 0.3, 2.6), M(0x8a6a48, 0.85));
  tray.position.set(0, -0.35, 0);
  gTray.add(tray);
  gTray.add(seedMesh);
  seedMesh.count = 0;
}
const seedDummy = new THREE.Object3D();
const seedColor = new THREE.Color();

function laySeeds(items) {
  // items: [{ color, wrinkled }]
  const n = Math.min(items.length, TRAY_MAX);
  seedMesh.count = n;
  items.slice(0, n).forEach((s, i) => {
    seedDummy.position.set(-3.3 + (i % 24) * 0.29, -0.2 + Math.floor(i / 24) * 0, -0.8 + Math.floor(i / 24) * 0.18);
    seedDummy.scale.setScalar(1);
    if (s.wrinkled) seedDummy.scale.set(1.25, 0.72, 0.9);
    seedDummy.rotation.set(Math.random(), Math.random(), Math.random());
    seedDummy.updateMatrix();
    seedMesh.setMatrixAt(i, seedDummy.matrix);
    seedColor.set(s.color);
    seedMesh.setColorAt(i, seedColor);
  });
  seedMesh.instanceMatrix.needsUpdate = true;
  if (seedMesh.instanceColor) seedMesh.instanceColor.needsUpdate = true;
}

// F2 植株迷你阵（茎高实验用）
const f2Group = new THREE.Group();
f2Group.position.set(0, -0.15, 1.6);
gTray.add(f2Group);
const f2Plants = [];
{
  for (let i = 0; i < 24; i++) {
    const p = makePlant({ height: 0.5, tendril: false });
    p.visible = false;
    f2Group.add(p);
    f2Plants.push(p);
  }
}
function layPlants(counts) {
  // counts: [tall, dwarf]
  const total = Math.min(counts[0] + counts[1], 24);
  let shown = { tall: 0, dwarf: 0 };
  const ratio = counts[0] / Math.max(1, counts[0] + counts[1]);
  for (let i = 0; i < total; i++) {
    const isTall = Math.random() < ratio;
    shown[isTall ? 'tall' : 'dwarf']++;
    const p = f2Plants[i];
    p.visible = true;
    p.scale.setScalar(1);
    // 重建高度：直接换子株（简单做法：缩放整株）
    p.scale.setScalar(isTall ? 1.35 : 0.6);
    p.position.set(-5.4 + (i % 12) * 0.98, 0, i < 12 ? -0.5 : 0.6);
    p.rotation.y = Math.random() * TAU;
  }
  for (let i = total; i < 24; i++) f2Plants[i].visible = false;
  return shown;
}

/* 卡方 */
function chi2(obs, exp) {
  let v = 0;
  for (let i = 0; i < obs.length; i++) v += Math.pow(obs[i] - exp[i], 2) / exp[i];
  return v;
}

/* 样本抽样 */
function sampleF2(n, p, k = 1) {
  const counts = new Array(k).fill(0);
  for (let i = 0; i < n; i++) {
    let cls = 0, acc = 0;
    const r = Math.random();
    for (let c = 0; c < k; c++) {
      acc += p[c];
      if (r <= acc) { cls = c; break; }
    }
    counts[cls]++;
  }
  return counts;
}

const cross = { n: 96, obs: null, mode: 'mono' };

/* ================= 场景四：假说—演绎法 ================= */

const gMethod = new THREE.Group();
gMethod.visible = false;
scene.add(gMethod);

const METHOD_STEPS = [
  { t: '① 观察现象', d: '纯种高茎 × 矮茎 → F1 全是高茎；F1 自交 → F2 出现 3:1 的性状分离。矮茎去哪了？' },
  { t: '② 提出问题', d: 'F1 为什么只表现高茎？F2 为什么出现 3:1？矮茎性状是消失了吗？' },
  { t: '③ 提出假说', d: '生物的性状由遗传因子（成对存在：D/d）决定；F1 为 Dd（高茎对矮茎为显性）；形成配子时成对遗传因子分离，D 与 d 数量相等；受精时雌雄配子随机结合。' },
  { t: '④ 演绎推理', d: '若假说成立，则 F1（Dd）与隐性纯合子（dd）测交，后代应为一半高茎、一半矮茎（1:1）。' },
  { t: '⑤ 实验验证', d: '孟德尔做了测交实验：后代 30 株高茎（实际比例接近 1:1），与预测吻合。' },
  { t: '⑥ 得出结论', d: '分离定律：控制同一性状的遗传因子成对存在，形成配子时彼此分离，分别进入不同配子。假说—演绎法从此成为遗传学研究的经典范式。' },
];
{
  const stations = [];
  METHOD_STEPS.forEach((s, i) => {
    const pos = new THREE.Vector3(-4.4 + i * 1.76, 1.1 + (i % 2) * 0.7, 0);
    const card = mesh(new THREE.BoxGeometry(1.5, 0.95, 0.08), M(0xe8e2d0, 0.85));
    card.position.copy(pos);
    const lb = label(s.t, '#3a3020', 0.0034, 'rgba(240,236,222,0.9)');
    lb.position.copy(pos).add(new THREE.Vector3(0, 0, 0.06));
    gMethod.add(card, lb);
    stations.push({ card, lb, pos });
    if (i > 0) {
      const prev = stations[i - 1].pos;
      const dir = pos.clone().sub(prev);
      const arrow = mesh(new THREE.ConeGeometry(0.09, 0.34, 10), M(0xc98a4a, 0.6));
      arrow.position.copy(prev).add(dir.clone().multiplyScalar(0.5)).add(new THREE.Vector3(0, 0, -0.15));
      arrow.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
      gMethod.add(arrow);
    }
  });
  gMethod.userData.stations = stations;
}
const method = { step: -1 };

function applyMethodStep() {
  const stations = gMethod.userData.stations;
  stations.forEach((s, i) => {
    s.card.material.color.set(i <= method.step ? 0xffe2a8 : 0xe8e2d0);
    s.card.scale.setScalar(i === method.step ? 1.12 : 1);
  });
}

/* ---------------- 章节定义 ---------------- */

const ctl = createControlsPanel(document.getElementById('controls'));
let activeSectionId = null;
let activeCleanup = null;

const hud = makeHUD(stage, [['a', '读数'], ['b', '统计'], ['c', '提示']]);
hud.visibleNow = false;

function fmtCounts(obs, exp, names) {
  return names.map((nm, i) => `${nm} ${obs[i]}（期 ${Math.round(exp[i] * 10) / 10}）`).join(' · ');
}

const SECTIONS = [
  {
    id: 'why-pea',
    title: '为什么选豌豆',
    html: `<p>孟德尔在修道院的小园子里种了 34 个豌豆品种。豌豆是理想的遗传学材料：</p>
<p>① <span class="hl">自花传粉、闭花授粉</span>——自然状态下都是纯种，结果可靠；② 具有<b>容易区分的相对性状</b>（右侧展台：7 对，看得见摸得着）；③ <b>花大</b>，便于人工去雄和授粉；④ 生长快、一代短，还能<b>数学统计</b>后代比例。</p>
<p>点击展台按钮逐对认识 7 对相对性状——它们是后面一切实验的"变量"。</p>`,
    enter() {
      showOnly(gGarden);
      hud.visibleNow = true;
      app.setCamera([1.2, 2.6, 12.2], [1.4, 0.9, 0]);
      ctl.clear();
      ctl.button({ label: '看高矮对照', onClick: () => app.setCamera([-2.6, 1.8, 7.2], [-2.7, 1.2, 0]) });
      ctl.button({ label: '看性状展台', onClick: () => app.setCamera([7.0, 1.9, 5.6], [7.0, 1.0, 0]) });
      ctl.button({ label: '总览', onClick: () => app.setCamera([1.2, 2.6, 12.2], [1.4, 0.9, 0]) });
      hud.set('a', '7 对相对性状 · 自花闭花授粉');
      hud.set('b', '茎:高/矮 · 花位:腋/顶 · 花色:紫/白 · 荚形:饱/缢 · 荚色:绿/黄 · 种形:圆/皱 · 子叶:黄/绿');
      hud.set('c', '纯种 × 稳定 = 适合做杂交统计');
    },
  },
  {
    id: 'pollinate',
    title: '人工异花授粉',
    html: `<p>豌豆是严格自花授粉——要做<b>杂交</b>，必须<span class="hl">人工干预</span>：</p>
<p>① 花蕾期<b>去雄</b>（除去全部未成熟的雄蕊，防止自花花粉）→ ② <b>套袋</b>（防止外来花粉）→ ③ 成熟后采集<b>另一株</b>的花粉，涂在去雄花的柱头上 → ④ <b>再套袋、挂牌</b>标记组合。</p>
<p>按顺序点下方按钮，完成整个授粉流程——顺序错了会被驳回哦。</p>`,
    enter() {
      showOnly(gFlower);
      pollin.step = 0;
      applyPollinStep();
      hud.visibleNow = true;
      app.setCamera([0.3, 0.9, 5.6], [0, 0.5, 0]);
      ctl.clear();
      ['去雄', '套袋', '授粉', '再套袋·挂牌'].forEach((name, i) => {
        ctl.button({
          label: `${i + 1}. ${name}`,
          active: pollin.step === i + 1,
          onClick: (btn) => {
            if (pollin.step === i) {
              pollin.step = i + 1;
              applyPollinStep();
              btn.classList.add('active');
              hud.set('a', STEPS_P[pollin.step - 1]);
              hud.set('c', pollin.step >= 4 ? '杂交完成！等它结出豆荚就是 F1 种子' : '进行下一步');
            } else if (pollin.step > i) {
              hud.set('c', '这一步已经做过了');
            } else {
              hud.set('c', '顺序不对——先完成前面的步骤');
            }
          },
        });
      });
      ctl.sep();
      ctl.button({
        label: '重置',
        onClick: () => { pollin.step = 0; applyPollinStep(); hud.set('a', '花蕾期'); hud.set('c', ''); },
      });
      hud.set('a', '花蕾期：雄蕊尚未成熟');
      hud.set('b', '去雄 → 套袋 → 授粉 → 再套袋挂牌');
      hud.set('c', '');
    },
  },
  {
    id: 'mono',
    title: '一对相对性状的杂交',
    html: `<p>纯种高茎（DD）× 纯种矮茎（dd）：<b>F1 全部高茎</b>（Dd，高茎为显性）。F1 自交 → <b>F2 出现性状分离，高:矮 ≈ 3:1</b>。</p>
<p>右侧棋盘是 Punnett 方阵：F1 产生 D、d 两种配子，随机结合 → DD:Dd:dd = 1:2:1，表现型 3:1。</p>
<p>拖动「F2 株数」重新随机种一批，观察卡方检验：χ² &lt; 3.84（df=1）说明与 3:1 无显著差异——孟德尔的结论正是这样被统计撑住的。</p>`,
    enter() {
      showOnly(gTray);
      cross.mode = 'mono';
      f2Group.visible = true;
      seedMesh.count = 0;
      hud.visibleNow = true;
      app.setCamera([0, 1.6, 11.6], [0, 1.7, 0]);
      ctl.clear();
      const nSlider = ctl.slider({
        label: 'F2 株数', min: 16, max: 300, step: 4, value: cross.n,
        fmt: (v) => v + ' 株',
        onInput: (v) => { cross.n = v; refreshMono(); },
      });
      ctl.button({
        label: '再种一批',
        onClick: () => refreshMono(),
      });
      cross.updateHud = () => {
        const obs = cross.obs;
        const x2 = chi2(obs, [(obs[0] + obs[1]) * 0.75, (obs[0] + obs[1]) * 0.25]);
        hud.set('a', `F2：高茎 ${obs[0]} 株 · 矮茎 ${obs[1]} 株（比例 ${(obs[0] / Math.max(1, obs[1])).toFixed(2)}:1）`);
        hud.set('b', `χ² = ${x2.toFixed(2)} ${x2 < 3.84 ? '< 3.84 ✓ 符合 3:1' : '≥ 3.84 ✗ 偏离（小样本波动）'}`);
        hud.set('c', 'DD : Dd : dd = 1 : 2 : 1');
      };
      function refreshMono() {
        cross.obs = sampleF2(cross.n, [0.75, 0.25], 2);
        const shown = layPlants([cross.obs[0], cross.obs[1]]);
        drawPunnett({
          title: 'F1（Dd）× F1（Dd）自交',
          gametes1: ['D', 'd'],
          gametes2: ['D', 'd'],
          cells: [['DD 高', 'Dd 高'], ['Dd 高', 'dd 矮']],
          note: '基因型 DD:Dd:dd = 1:2:1\n表现型 高茎 : 矮茎 = 3 : 1',
        });
        cross.updateHud();
      }
      refreshMono();
    },
  },
  {
    id: 'testcross',
    title: '测交：验证分离',
    html: `<p>孟德尔的聪明一步：<b>让 F1（Dd）与隐性纯合子（dd）杂交</b>——矮茎只能提供 d 配子，所以后代的性状直接"曝光"F1 配子的种类与比例。</p>
<p>预测：D 配子 → 高茎，d 配子 → 矮茎，<b>1 : 1</b>。实验结果与预测一致——假说被验证。</p>
<p>同样拖动株数与卡方（df=1，临界值 3.84）。</p>`,
    enter() {
      showOnly(gTray);
      cross.mode = 'test';
      f2Group.visible = false;
      seedMesh.count = 0;
      refreshTest();
      hud.visibleNow = true;
      app.setCamera([0, 1.6, 11.6], [0, 1.7, 0]);
      ctl.clear();
      ctl.slider({
        label: '测交后代数', min: 16, max: 300, step: 4, value: cross.n,
        fmt: (v) => v + ' 株',
        onInput: (v) => { cross.n = v; refreshTest(); },
      });
      ctl.button({ label: '再种一批', onClick: () => refreshTest() });
      function refreshTest() {
        cross.obs = sampleF2(cross.n, [0.5, 0.5], 2);
        drawPunnett({
          title: '测交：F1（Dd）× 矮茎（dd）',
          gametes1: ['D', 'd'],
          gametes2: ['d', 'd'],
          cells: [['Dd 高', 'Dd 高'], ['dd 矮', 'dd 矮']],
          note: '表现型 高茎 : 矮茎 = 1 : 1\n后代性状直接反映 F1 配子比例',
        });
        const obs = cross.obs;
        const x2 = chi2(obs, [(obs[0] + obs[1]) * 0.5, (obs[0] + obs[1]) * 0.5]);
        hud.set('a', `测交后代：高茎 ${obs[0]} 株 · 矮茎 ${obs[1]} 株`);
        hud.set('b', `χ² = ${x2.toFixed(2)} ${x2 < 3.84 ? '< 3.84 ✓ 符合 1:1' : '≥ 3.84 ✗ 偏离（小样本波动）'}`);
        hud.set('c', '测交 = 待测个体 × 隐性纯合子');
      }
      cross.updateHud = null;
    },
  },
  {
    id: 'di',
    title: '两对相对性状的杂交',
    html: `<p>纯种<b>黄色圆粒</b>（YYRR）× 纯种<b>绿色皱粒</b>（yyrr）：F1 全部黄圆（YyRr）。F1 自交 → F2 出现 <span class="hl">黄圆 : 绿圆 : 黄皱 : 绿皱 = 9 : 3 : 3 : 1</span>。</p>
<p>两对遗传因子在形成配子时<b>自由组合</b>：F1 产生 YR、Yr、yR、yr 四种等量配子 → 16 种组合。</p>
<p>下方托盘随机分拣一批 F2 种子（黄=亮色，绿=深色；圆=球，皱=扁圆），托盘上方是 4×4 方阵。df=3，卡方临界值 7.81。</p>`,
    enter() {
      showOnly(gTray);
      f2Group.visible = false;
      cross.mode = 'di';
      hud.visibleNow = true;
      app.setCamera([0, 1.0, 10.8], [0, 0.6, 0]);
      ctl.clear();
      ctl.slider({
        label: 'F2 种子数', min: 16, max: 240, step: 4, value: 160,
        fmt: (v) => v + ' 粒',
        onInput: (v) => { cross.n = v; refreshDi(); },
      });
      ctl.button({ label: '再分拣一批', onClick: () => refreshDi() });
      const NAMES = ['黄圆', '绿圆', '黄皱', '绿皱'];
      const COLORS = [C_YELLOW, 0x3c7a42, 0xd9b25e, 0x2f5f38];
      const WRINKLED = [false, false, true, true];
      function refreshDi() {
        cross.obs = sampleF2(cross.n, [9 / 16, 3 / 16, 3 / 16, 1 / 16], 4);
        laySeeds(cross.obs.flatMap((cnt, i) => Array.from({ length: cnt }, () => ({ color: COLORS[i], wrinkled: WRINKLED[i] }))));
        drawPunnett({
          title: 'F1（YyRr）× F1（YyRr）—— 4×4 方阵',
          gametes1: ['YR', 'Yr', 'yR', 'yr'],
          gametes2: ['YR', 'Yr', 'yR', 'yr'],
          cells: [
            ['黄圆', '黄圆', '黄圆', '黄圆'],
            ['黄圆', '黄皱', '黄圆', '黄皱'],
            ['黄圆', '黄圆', '绿圆', '绿圆'],
            ['黄圆', '黄皱', '绿圆', '绿皱'],
          ],
          note: '表现型 黄圆:绿圆:黄皱:绿皱 = 9:3:3:1\n两对遗传因子自由组合（非同源染色体上的非等位基因）',
        });
        const obs = cross.obs;
        const tot = obs[0] + obs[1] + obs[2] + obs[3];
        const exp = [9, 3, 3, 1].map((w) => tot * w / 16);
        const x2 = chi2(obs, exp);
        hud.set('a', fmtCounts(obs, exp, NAMES));
        hud.set('b', `χ² = ${x2.toFixed(2)} ${x2 < 7.81 ? '< 7.81 ✓ 符合 9:3:3:1' : '≥ 7.81 ✗ 偏离（小样本波动）'}`);
        hud.set('c', '自由组合定律的细胞学基础在减数分裂');
      }
      refreshDi();
    },
  },
  {
    id: 'explore',
    title: '七对性状自由探究',
    html: `<p>孟德尔做了 <b>7 对性状 × 两两杂交</b> 的组合，全部得到 9:3:3:1 的自由组合结果（F2 群体足够大时）。</p>
<p>选两对性状"打包"杂交，托盘按所选性状的 F2 分布抽样；每对性状都是显性:隐性 = 3:1，两对独立时正好 (3:1)² → 9:3:3:1。</p>`,
    enter() {
      showOnly(gTray);
      f2Group.visible = false;
      hud.visibleNow = true;
      app.setCamera([0, 1.0, 10.8], [0, 0.6, 0]);
      ctl.clear();
      const PAIRS = [
        { label: '子叶 黄/绿', p: 0.75 },
        { label: '种形 圆/皱', p: 0.75 },
        { label: '花色 紫/白', p: 0.75 },
        { label: '荚色 绿/黄', p: 0.75 },
      ];
      let selA = 0, selB = 1;
      refreshPair(selA, selB);
      PAIRS.forEach((pr, i) => {
        ctl.button({
          label: (i === selA ? 'A: ' : i === selB ? 'B: ' : '　 ') + pr.label,
          onClick: (btn) => {
            // 轮换选择：新点的替换 B，原 B→A
            if (i !== selA && i !== selB) { selA = selB; selB = i; }
            refreshPair(selA, selB);
            ctl.el.querySelectorAll('.ctl-btn').forEach((b, bi) => {
              const t = b.textContent.trim();
              if (bi < PAIRS.length) {
                b.classList.toggle('active', t.includes(PAIRS[selA].label) || t.includes(PAIRS[selB].label));
              }
            });
          },
        });
      });
      ctl.sep();
      ctl.slider({
        label: 'F2 种子数', min: 16, max: 240, step: 4, value: 160,
        fmt: (v) => v + ' 粒',
        onInput: (v) => { cross.n = v; refreshPair(selA, selB); },
      });
      function refreshPair(a, b) {
        // 两对独立显性 → F2 四类（双显/单显1/单显2/双隐）= 9:3:3:1
        cross.obs = sampleF2(cross.n, [9 / 16, 3 / 16, 3 / 16, 1 / 16], 4);
        const pa = PAIRS[a], pb = PAIRS[b];
        const seeds = [];
        cross.obs.forEach((cnt, cls) => {
          for (let i = 0; i < cnt; i++) {
            const domA = cls === 0 || cls === 1;
            const domB = cls === 0 || cls === 2;
            seeds.push({ color: domA ? C_YELLOW : 0x3c7a42, wrinkled: !domB });
          }
        });
        laySeeds(seeds);
        drawPunnett({
          title: `${pa.label} × ${pb.label} 组合的 F2`,
          gametes1: ['AB', 'Ab', 'aB', 'ab'],
          gametes2: ['AB', 'Ab', 'aB', 'ab'],
          cells: [
            ['双显', '双显', '双显', '双显'],
            ['双显', 'B隐', '双显', 'B隐'],
            ['双显', '双显', 'A隐', 'A隐'],
            ['双显', 'B隐', 'A隐', '双隐'],
          ],
          note: `任意两对独立性状：F2 都是 9:3:3:1\n（每对各自 3:1，两对相乘 = (3:1)²）`,
        });
        const obs = cross.obs;
        const tot = obs.reduce((s, x) => s + x, 0);
        const exp = [9, 3, 3, 1].map((w) => tot * w / 16);
        const x2 = chi2(obs, exp);
        hud.set('a', `双显 ${obs[0]} · B隐 ${obs[1]} · A隐 ${obs[2]} · 双隐 ${obs[3]}`);
        hud.set('b', `χ² = ${x2.toFixed(2)} ${x2 < 7.81 ? '< 7.81 ✓ 符合 9:3:3:1' : '≥ 7.81 ✗ 偏离（小样本波动）'}`);
        hud.set('c', `${pa.label} + ${pb.label} · (3:1)²`);
      }
      cross.updateHud = null;
    },
  },
  {
    id: 'method',
    title: '假说—演绎法',
    html: `<p>孟德尔不只是"做了实验"，他建立了一套研究范式——<span class="hl">假说—演绎法</span>：</p>
<p><b>观察现象 → 提出问题 → 提出假说 → 演绎推理 → 实验验证 → 得出结论</b>。关键在③→④：假说必须能推出<b>可检验的新预测</b>（测交 1:1），再让实验说话。</p>
<p>点「下一步」沿着这条链走一遍。</p>`,
    enter() {
      showOnly(gMethod);
      method.step = -1;
      applyMethodStep();
      hud.visibleNow = true;
      app.setCamera([0, 1.7, 11.6], [0, 1.4, 0]);
      ctl.clear();
      ctl.button({
        label: '下一步 →',
        onClick: () => {
          if (method.step < METHOD_STEPS.length - 1) method.step++;
          applyMethodStep();
          const s = METHOD_STEPS[method.step];
          hud.set('a', s.t);
          hud.set('b', s.d);
          hud.set('c', method.step === METHOD_STEPS.length - 1 ? '完成！这就是现代遗传学的起点' : '');
        },
      });
      ctl.button({
        label: '重置',
        onClick: () => { method.step = -1; applyMethodStep(); hud.set('a', ''); hud.set('b', ''); },
      });
      hud.set('a', '① 观察现象');
      hud.set('b', METHOD_STEPS[0].d);
    },
  },
  {
    id: 'quiz',
    title: '随堂检测',
    html: `<p>5 道选择题，检验一下本节课的掌握情况。答完可重新开始。</p>`,
    enter() {
      showOnly(gGarden);
      hud.visibleNow = false;
      app.setCamera([1.2, 2.6, 12.2], [1.4, 0.9, 0]);
      ctl.clear();
      showQuiz();
    },
  },
];

function showOnly(g) {
  gGarden.visible = gFlower.visible = gTray.visible = gMethod.visible = false;
  g.visible = true;
}

/* ---------------- 随堂检测 ---------------- */

const QUIZ = [
  {
    q: '豌豆作为遗传学实验材料的突出优点是？',
    opts: ['后代数量少，便于照顾', '自花传粉、闭花授粉，自然状态下是纯种', '性状不能区分', '生命周期长达数年'],
    a: 1,
    ex: '自花闭花授粉保证纯种；加之花大易操作、性状明显可分、生长快便于统计。',
  },
  {
    q: '人工异花授粉的正确操作顺序是？',
    opts: ['授粉→去雄→套袋→挂牌', '去雄→套袋→授粉→再套袋挂牌', '套袋→授粉→去雄→挂牌', '去雄→授粉→套袋→挂牌'],
    a: 1,
    ex: '花蕾期先去雄并套袋防止外来花粉，成熟后授以另一株花粉，再套袋挂牌标记组合。',
  },
  {
    q: 'F1（Dd）自交得到 F2，高:矮 = 3:1。对"3"的基因型解释正确的是？',
    opts: ['全部是 DD', 'DD 和 Dd 都表现高茎（1 份 DD + 2 份 Dd）', 'Dd 有 3 种', '矮茎发生了突变'],
    a: 1,
    ex: 'DD:Dd:dd = 1:2:1；D 对 d 显性，所以 DD 与 Dd 都表现高茎，合计 3 份。',
  },
  {
    q: '验证分离定律最巧妙的实验设计是？',
    opts: ['F1 自交再统计 F2', '让 F1 与隐性纯合子测交，后代 1:1', '继续自交到 F4', '换一种植物重复'],
    a: 1,
    ex: '测交中隐性纯合子只提供隐性配子，后代性状比例直接反映 F1 产生配子的种类与比例。',
  },
  {
    q: '两对相对性状自由组合，F2 的表现型比例是？',
    opts: ['3:1', '1:1', '9:3:3:1', '1:2:1'],
    a: 2,
    ex: '两对独立遗传的性状各自 3:1，组合起来 (3:1)² = 9:3:3:1（黄圆:绿圆:黄皱:绿皱）。',
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

/* ---------------- 主循环 ---------------- */

app.onFrame((dt, t) => {
  cameraTweenTick(app, dt);
  hud.el.style.display = hud.visibleNow ? '' : 'none';
  if (activeSectionId === 'why-pea' || activeSectionId === 'quiz') {
    // 花园微风吹动（展台和植株轻摆）
    gGarden.rotation.y = Math.sin(t * 0.12) * 0.02;
  }
});

/* ---------------- 启动 ---------------- */

drawPunnett({ title: 'PeaLab', note: '在章节里开始实验吧' });
const sections = createSections({
  nav: document.getElementById('sideNav'),
  descPanel: document.getElementById('descPanel'),
  sections: SECTIONS,
  onSelect(i, sec) {
    if (activeCleanup) { activeCleanup(); activeCleanup = null; }
    activeSectionId = sec.id;
    sec.enter();
  },
});
window.__eduSections = sections;
loader.hide();
sections.select(0);
