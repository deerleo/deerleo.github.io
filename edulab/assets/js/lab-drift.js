/* EduLab · 海陆的变迁（drift）
 * 章节：沧海桑田 / 高山上的海洋化石 / 海峡下的古河道 / 大陆漂移假说 /
 *       泛大陆的分裂 / 六大板块 / 火山与地震 / 张裂与碰撞 / 随堂检测
 * 场景：海岸升降 3D 模型、褶皱地层剖面、海峡剖面、世界地图大陆拼合与泛大陆分裂动画、板块边界图
 */
import {
  THREE, DEG, TAU, clamp, loadHDR, loadTexture, loadAll, createApp, cameraTweenTick,
  makeLoader, createSections, createControlsPanel, makeHUD, makeTextSprite,
} from './edu-core.js';

const TEXDIR = '../assets/textures/';

/* ---------------- 场景 ---------------- */

const stage = document.getElementById('stage');
const loader = makeLoader(stage, '正在准备海陆变迁实验…');

const app = createApp({
  container: stage, fov: 44, near: 0.1, far: 400,
  cameraPos: [7, 6, 10], target: [0, 0.4, 0],
  minDistance: 2, maxDistance: 40, exposure: 1.05,
});
const { scene, camera, controls } = app;

scene.add(new THREE.HemisphereLight(0xe8f1ff, 0xa89a80, 1.1));
const sunL = new THREE.DirectionalLight(0xfff2dc, 1.9);
sunL.position.set(6, 9, 5);
scene.add(sunL);

/* 各章场景组 */
const gCoast = new THREE.Group();   // 沧海桑田
const gStrata = new THREE.Group();  // 地层化石
const gStrait = new THREE.Group();  // 海峡古河道
const gMap = new THREE.Group();     // 大陆漂移 / 泛大陆 / 板块 / 火山地震
const gBound = new THREE.Group();   // 张裂与碰撞剖面
scene.add(gCoast, gStrata, gStrait, gMap, gBound);

const allGroups = [gCoast, gStrata, gStrait, gMap, gBound];
function showGroup(g) { allGroups.forEach((x) => { x.visible = x === g; }); }

/* 精灵标签统一管理 */
const sprites = [];
function addSprite(parent, text, x, y, z, opts) {
  const sp = makeTextSprite(text, opts || { fontSize: 28, color: '#ffe6c0', scale: 0.0042 });
  sp.position.set(x, y, z);
  parent.add(sp);
  sprites.push(sp);
  return sp;
}
function hideAllSprites() { sprites.forEach((s) => { s.visible = false; }); }
function showOnly(pred) { sprites.forEach((s) => { s.visible = !!pred(s); }); }

/* ---------------- 章 1：沧海桑田（海岸升降） ---------------- */

{
  // 地形块：一侧山丘 + 平缓海岸
  const geo = new THREE.PlaneGeometry(9, 7, 90, 70).rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const h = 0.9 * Math.exp(-((x + 2.6) ** 2 / 4 + (z - 0.6) ** 2 / 3))
      + 0.35 * Math.exp(-((x + 0.4) ** 2 / 2 + (z + 1.8) ** 2 / 2))
      - 0.55 + 0.12 * Math.sin(x * 1.7) * Math.cos(z * 1.9);
    pos.setY(i, Math.max(h, -0.7));
  }
  geo.computeVertexNormals();
  const land = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
    color: 0x7ba85c, roughness: 0.92, metalness: 0,
  }));
  land.position.y = 0.55;
  gCoast.add(land);
  // 海水
  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(11, 9).rotateX(-Math.PI / 2),
    new THREE.MeshPhysicalMaterial({
      color: 0x2f7fc4, transparent: true, opacity: 0.62, roughness: 0.14,
      clearcoat: 0.5, depthWrite: false, emissive: 0x0a2033, emissiveIntensity: 0.4,
    })
  );
  water.position.y = 0.25;
  water.name = 'coastWater';
  gCoast.add(water);
  // 底座
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(9, 0.4, 7),
    new THREE.MeshStandardMaterial({ color: 0x8a7a5e, roughness: 0.95 })
  );
  base.position.y = -0.95;
  gCoast.add(base);
  addSprite(gCoast, '陆地', -2.6, 1.8, 0.6, { fontSize: 28, color: '#d8ffc8' });
  const seaSp = addSprite(gCoast, '海洋', 2.8, 1.0, 2.2, { fontSize: 28, color: '#9fd8ff' });
  seaSp.name = 'coastSea';
}

/* ---------------- 章 2：高山上的海洋化石（褶皱地层） ---------------- */

const strataState = { t: 0.35 };
const strataLayers = [];
const FOSSIL_N = 4;
const fossilSprites = [];
{
  const X0 = -4.4, X1 = 4.4, SEG = 72;
  const layers = [
    { base: 0.0, amp: 1.0, color: 0xc8b088 },   // 砂岩（顶）
    { base: -0.42, amp: 0.92, color: 0x9aa878 },// 页岩
    { base: -0.86, amp: 0.8, color: 0xb8c4c8, fossil: true }, // 石灰岩（含化石）
    { base: -1.35, amp: 0.62, color: 0x8a8490 },// 底层
  ];
  const fold = (x) => 1.15 * Math.exp(-(x * x) / 3.6) + 0.35 * Math.exp(-((x + 2.6) ** 2) / 1.4) + 0.28 * Math.exp(-((x - 2.8) ** 2) / 1.6);
  for (const L of layers) {
    const geo = new THREE.PlaneGeometry(X1 - X0, 0.42, SEG, 1).rotateX(-Math.PI / 2);
    strataLayers.push({ mesh: new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: L.color, roughness: 0.9 })), base: L.base, amp: L.amp, fold });
    gStrata.add(strataLayers[strataLayers.length - 1].mesh);
  }
  gStrata.add(new THREE.Mesh(
    new THREE.BoxGeometry(9.6, 0.5, 2.6),
    new THREE.MeshStandardMaterial({ color: 0x6e6258, roughness: 0.95 })
  )).children;
  const baseMesh = gStrata.children[gStrata.children.length - 1];
  baseMesh.position.y = -2.05;
  for (let i = 0; i < FOSSIL_N; i++) {
    const sp = addSprite(gStrata, '🐚', 0, 0, 0, { fontSize: 44, color: '#ffffff', scale: 0.006 });
    fossilSprites.push(sp);
  }
  addSprite(gStrata, '海洋沉积（数亿年前）', 0, -0.5, -1.2, { fontSize: 24, color: '#cfe4ff' }).name = 'fo1';
  addSprite(gStrata, '抬升挤压 → 高山', 0, 2.0, 0, { fontSize: 28, color: '#ffcf9a' }).name = 'fo2';
  const upArrow = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(3.6, -0.6, 0), 1.6, 0xff8c42, 0.22, 0.13);
  upArrow.name = 'foArrow';
  gStrata.add(upArrow);
}
function updateStrata() {
  const t = strataState.t;
  for (const L of strataLayers) {
    const pos = L.mesh.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      pos.setY(i, L.base + L.fold(x) * t * L.amp);
    }
    pos.needsUpdate = true;
    L.mesh.geometry.computeVertexNormals();
  }
  // 化石贴在石灰岩面上
  fossilSprites.forEach((sp, i) => {
    const x = -3.2 + i * 2.1;
    const y = -0.86 + strataLayers[2].fold(x) * t * strataLayers[2].amp + 0.24;
    sp.position.set(x, y, 0.35);
  });
  const a = gStrata.getObjectByName('foArrow');
  if (a) a.position.set(3.6, -0.6 + t * 1.1, 0);
}

/* ---------------- 章 3：海峡下的古河道 ---------------- */

const straitState = { level: 0 };   // 米
{
  const geo = new THREE.PlaneGeometry(10, 4.6, 110, 50).rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    // 西侧大陆架 — 海峡 — 台湾岛
    const h = x < -1.2
      ? 1.1 * Math.exp(-((x + 4.6) ** 2) / 6) + 0.16
      : x > 1.6
        ? 0.95 * Math.exp(-((x - 3.4) ** 2) / 1.8) + 0.1
        : -0.28 + 0.05 * Math.sin(x * 3);
    pos.setY(i, h);
  }
  geo.computeVertexNormals();
  const land = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x86a860, roughness: 0.93 }));
  land.position.y = 0.55;
  gStrait.add(land);
  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(10.4, 5).rotateX(-Math.PI / 2),
    new THREE.MeshPhysicalMaterial({
      color: 0x2f7fc4, transparent: true, opacity: 0.6, roughness: 0.15,
      clearcoat: 0.5, depthWrite: false, emissive: 0x0a2033, emissiveIntensity: 0.45,
    })
  );
  water.position.y = 0.55;
  water.name = 'straitWater';
  gStrait.add(water);
  // 古河道（埋藏河谷）：深色弯曲条带
  const channel = new THREE.Mesh(
    new THREE.TorusGeometry(2.2, 0.16, 10, 40, Math.PI * 0.85),
    new THREE.MeshStandardMaterial({ color: 0x4a3a24, roughness: 1 })
  );
  channel.rotation.set(-Math.PI / 2, 0, Math.PI * 0.94);
  channel.position.set(-0.1, 0.42, 0.2);
  channel.name = 'paleoChannel';
  gStrait.add(channel);
  addSprite(gStrait, '大陆（福建沿岸）', -3.6, 2.3, 0, { fontSize: 26, color: '#d8ffc8' }).name = 'st1';
  addSprite(gStrait, '台湾岛', 3.4, 2.1, 0, { fontSize: 26, color: '#d8ffc8' }).name = 'st2';
  addSprite(gStrait, '台湾海峡', 0, 1.55, 0.6, { fontSize: 26, color: '#9fd8ff' }).name = 'st3';
  addSprite(gStrait, '古河道（河谷沉积）', -0.1, 0.95, 0.9, { fontSize: 24, color: '#ffd9a0' }).name = 'st4';
}

/* ---------------- 世界地图（章 4/5/6/7 共用） ---------------- */

const CONT = {
  namerica: [[-166, 66], [-140, 69], [-122, 69], [-100, 71], [-84, 71], [-70, 62], [-56, 51], [-66, 44], [-76, 35], [-81, 26], [-90, 18], [-97, 16], [-105, 21], [-117, 32], [-124, 40], [-124, 48], [-140, 59], [-158, 57]],
  samerica: [[-79, 8], [-70, 11], [-60, 8], [-50, 0], [-35, -6], [-38, -15], [-48, -26], [-56, -35], [-65, -43], [-70, -54], [-75, -47], [-72, -38], [-70, -28], [-70, -18], [-77, -8], [-80, -2]],
  africa: [[-10, 32], [0, 36], [10, 37], [20, 32], [32, 31], [35, 26], [43, 12], [51, 11], [40, -2], [40, -12], [34, -21], [30, -30], [24, -34], [17, -33], [12, -18], [8, -2], [-8, 4], [-17, 12], [-17, 22]],
  eurasia: [[-9, 37], [-1, 44], [-6, 49], [5, 54], [5, 59], [12, 65], [24, 70], [45, 68], [70, 72], [100, 76], [130, 72], [158, 69], [178, 65], [160, 58], [142, 52], [130, 42], [121, 30], [112, 21], [105, 9], [97, 7], [92, 17], [88, 22], [80, 14], [76, 9], [70, 22], [66, 25], [57, 25], [48, 14], [43, 12], [35, 30], [26, 38], [16, 40], [10, 44], [3, 42]],
  india: [[68, 24], [72, 21], [76, 9], [80, 8], [88, 22], [80, 26], [72, 27]],
  australia: [[114, -22], [122, -18], [131, -12], [137, -13], [142, -11], [147, -16], [151, -24], [152, -29], [149, -36], [144, -38], [138, -35], [132, -32], [124, -33], [115, -34], [113, -26]],
  antarctica: [[-180, -68], [-120, -72], [-60, -63], [0, -69], [60, -66], [120, -66], [180, -70], [180, -88], [-180, -88]],
  greenland: [[-52, 60], [-42, 62], [-30, 68], [-22, 72], [-30, 80], [-45, 82], [-58, 76], [-60, 66]],
};

const LL2X = (lon) => lon / 36;         // -180..180 → -5..5
const LL2Z = (lat) => -lat / 24;        // 北在上

function landMeshFrom(pts, color, depth = 0.1) {
  const shape = new THREE.Shape(pts.map(([lo, la]) => new THREE.Vector2(LL2X(lo), la / 24)));
  const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
  geo.rotateX(-Math.PI / 2);       // shape 的 y(lat) → -z（北朝远处）
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
    color, roughness: 0.9, metalness: 0.05,
  }));
  return m;
}

// 大陆网格：position 组（泛大陆动画）
const contMeshes = {};
const CONT_COLORS = { namerica: 0x86b062, samerica: 0x8ab06a, africa: 0xb09a58, eurasia: 0x9aa868, india: 0xc0a860, australia: 0xc8a860, antarctica: 0xe4e8ec, greenland: 0xdce4e8 };
for (const key of Object.keys(CONT)) {
  const m = landMeshFrom(CONT[key], CONT_COLORS[key]);
  m.name = key;
  contMeshes[key] = m;
  gMap.add(m);
}

// 泛大陆关键帧（每个大陆在不同年代的经纬偏移， Ma: [dLon, dLat]）
const PANGAEA_T = [250, 180, 120, 60, 0];
const PANGAEA_OFF = {
  namerica: [[52, 22], [38, 16], [24, 9], [10, 4], [0, 0]],
  greenland: [[40, 16], [30, 12], [18, 7], [8, 3], [0, 0]],
  samerica: [[48, 8], [36, 6], [21, 3], [9, 1], [0, 0]],
  africa: [[10, 6], [8, 4], [5, 2], [2, 1], [0, 0]],
  eurasia: [[-13, 7], [-10, 5], [-6, 3], [-2, 1], [0, 0]],
  india: [[30, -6], [21, -8], [12, -10], [4, -6], [0, 0]],
  australia: [[28, 0], [22, -3], [15, -6], [7, -4], [0, 0]],
  antarctica: [[6, 8], [4, 5], [3, 2], [1, 0], [0, 0]],
};
function pangaeaAt(ma) {
  // ma: 距今年代（250 → 0），插值偏移
  let i = 0;
  while (i < PANGAEA_T.length - 1 && ma < PANGAEA_T[i + 1]) i++;
  const t0 = PANGAEA_T[i], t1 = PANGAEA_T[Math.min(i + 1, PANGAEA_T.length - 1)];
  const k = t1 === t0 ? 0 : clamp((t0 - ma) / (t0 - t1), 0, 1);
  const ease = k * k * (3 - 2 * k);
  for (const key of Object.keys(PANGAEA_OFF)) {
    const a = PANGAEA_OFF[key][i], b = PANGAEA_OFF[key][Math.min(i + 1, PANGAEA_T.length - 1)];
    const dLon = a[0] + (b[0] - a[0]) * ease;
    const dLat = a[1] + (b[1] - a[1]) * ease;
    contMeshes[key].position.set(LL2X(dLon) * 0, 0, 0);
    contMeshes[key].userData.off = [dLon, dLat];
    const base = contMeshes[key].userData.base || [0, 0];
    contMeshes[key].position.x = LL2X(base[0] + dLon) - LL2X(base[0]);
    contMeshes[key].position.z = -(base[1] + dLat) / 24 + base[1] / 24;
  }
}

// 板块边界（多段线）
const PLATES_LINES = [
  [[-165, 62], [-152, 58], [-148, 48], [-140, 38], [-125, 38], [-112, 28], [-100, 18], [-88, 10], [-80, 0], [-74, -16], [-72, -34], [-76, -50]],
  [[150, 58], [158, 52], [156, 45], [145, 42], [140, 36], [133, 34], [126, 28], [122, 22], [121, 15], [126, 6], [132, -4], [138, -16], [148, -42], [166, -52]],
  [[-12, 36], [2, 38], [14, 38], [26, 37], [38, 36], [50, 32], [62, 30], [72, 34], [84, 28], [94, 26], [100, 21]],
  [[-32, 68], [-30, 52], [-16, 40], [-13, 25], [-14, 8], [-16, -8], [-14, -24], [-10, -40], [-6, -52]],
  [[40, -8], [46, -22], [52, -38], [60, -50], [80, -56], [110, -58], [140, -58]],
];
function buildPlateLines(color) {
  const group = new THREE.Group();
  for (const poly of PLATES_LINES) {
    const pts = poly.map(([lo, la]) => new THREE.Vector3(LL2X(lo), 0.14, LL2Z(la)));
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(pts),
      new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.95 })
    );
    group.add(line);
  }
  return group;
}
const plateLines = buildPlateLines(0xff5a3c);
plateLines.visible = false;
gMap.add(plateLines);

// 板块名称标注
const plateLabelDefs = [
  ['亚欧板块', 80, 48], ['太平洋板块', -145, 5], ['美洲板块', -100, 42],
  ['非洲板块', 18, -8], ['印度洋板块', 75, -28], ['南极洲板块', 0, -80],
];
const plateLabels = plateLabelDefs.map(([name, lo, la]) => {
  const sp = addSprite(gMap, name, LL2X(lo), 0.55, LL2Z(la), { fontSize: 30, color: '#ffe6c0', scale: 0.0046 });
  sp.visible = false;
  return sp;
});

// 火山地震带：脉动光点 + 火山锥 + 地震波环
const hotspotDefs = [[142, 38], [-121, 38], [-72, -34], [138, -8], [100, 21], [-16, 40], [50, -18]];
const hotDots = hotspotDefs.map(([lo, la]) => {
  const dot = new THREE.Mesh(
    new THREE.SphereGeometry(0.075, 12, 10),
    new THREE.MeshBasicMaterial({ color: 0xff7a3c })
  );
  dot.position.set(LL2X(lo), 0.16, LL2Z(la));
  dot.visible = false;
  gMap.add(dot);
  return dot;
});
const volcano = new THREE.Mesh(
  new THREE.ConeGeometry(0.34, 0.6, 20),
  new THREE.MeshStandardMaterial({ color: 0x6e5a48, roughness: 0.95 })
);
volcano.position.set(LL2X(138), 0.42, LL2Z(36));
volcano.visible = false;
gMap.add(volcano);
const quakeRings = [];
for (let i = 0; i < 3; i++) {
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.32, 0.4, 48).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0xffd166, transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false })
  );
  ring.position.set(LL2X(142), 0.17, LL2Z(38));
  ring.userData.phase = i / 3;
  ring.visible = false;
  quakeRings.push(ring);
  gMap.add(ring);
}

// 大陆漂移证据（章 4）：中龙与舌羊齿标记 + 大西洋中脊
const evidGroup = new THREE.Group();
evidGroup.visible = false;
gMap.add(evidGroup);
const evidDots = [[-38, -4, '中龙化石'], [12, -6, '中龙化石'], [-42, 3, '舌羊齿'], [22, -18, '舌羊齿'], [95, -22, '舌羊齿']].map(([lo, la, name]) => {
  const dot = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffd166 }));
  dot.position.set(LL2X(lo), 0.15, LL2Z(la));
  const sp = addSprite(evidGroup, name, LL2X(lo), 0.42, LL2Z(la), { fontSize: 22, color: '#ffd9a0', scale: 0.003 });
  evidGroup.add(dot);
  return sp;
});
const atlRidge = new THREE.Line(
  new THREE.BufferGeometry().setFromPoints(
    [[-30, 60], [-28, 45], [-15, 30], [-12, 10], [-14, -8], [-14, -26], [-10, -42]].map(([lo, la]) => new THREE.Vector3(LL2X(lo), 0.16, LL2Z(la)))
  ),
  new THREE.LineDashedMaterial({ color: 0xff8c42, dashSize: 0.16, gapSize: 0.1 })
);
atlRidge.computeLineDistances();
evidGroup.add(atlRidge);
const evidLabel = addSprite(evidGroup, '大西洋中脊', LL2X(-13), 0.5, LL2Z(-30), { fontSize: 24, color: '#ffcf9a', scale: 0.0035 });
evidGroup.add(evidLabel);

// 海洋底板
const ocean = new THREE.Mesh(
  new THREE.PlaneGeometry(10.6, 8.4).rotateX(-Math.PI / 2),
  new THREE.MeshStandardMaterial({ color: 0x2a5e94, roughness: 0.85 })
);
ocean.position.y = -0.02;
gMap.add(ocean);

/* ---------------- 章 8：张裂与碰撞 ---------------- */

const boundState = { t: 0.3 };
let riftPlates, colPlates, magma, mount;
{
  // 左：张裂（两块板块向两侧退开，中间岩浆上涌成脊）
  riftPlates = [];
  for (const s of [-1, 1]) {
    const plate = new THREE.Mesh(
      new THREE.BoxGeometry(2.6, 0.32, 1.6),
      new THREE.MeshStandardMaterial({ color: 0x8a9a6a, roughness: 0.9 })
    );
    plate.position.set(s * 1.5, 0.5, -1.4);
    plate.userData.side = s;
    riftPlates.push(plate);
    gBound.add(plate);
  }
  magma = new THREE.Mesh(
    new THREE.ConeGeometry(0.42, 0.75, 16),
    new THREE.MeshStandardMaterial({ color: 0xff5a2c, emissive: 0xb83a14, emissiveIntensity: 0.9, roughness: 0.7 })
  );
  magma.position.set(0, 0.55, -1.4);
  gBound.add(magma);
  const riftLabel = addSprite(gBound, '张裂（生长边界）', 0, 1.9, -1.4, { fontSize: 26, color: '#ff9a6a' });
  riftLabel.name = 'bd1';
  // 右：碰撞（大洋板块俯冲 + 大陆边缘隆起成山）
  colPlates = [];
  for (const s of [-1, 1]) {
    const plate = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 0.3, 1.6),
      new THREE.MeshStandardMaterial({ color: s < 0 ? 0x7a8aa8 : 0x9aa06a, roughness: 0.9 })
    );
    plate.position.set(s * 1.55 + 6.2, 0.5, -1.4);
    plate.rotation.z = s * -0.06;
    plate.userData.side = s;
    colPlates.push(plate);
    gBound.add(plate);
  }
  mount = new THREE.Mesh(
    new THREE.ConeGeometry(1.0, 1.15, 6),
    new THREE.MeshStandardMaterial({ color: 0x8a7a5c, roughness: 0.95, flatShading: true })
  );
  mount.position.set(6.2, 1.05, -1.4);
  mount.scale.set(1, 0.25, 1);
  gBound.add(mount);
  const colLabel = addSprite(gBound, '碰撞（消亡边界）', 6.2, 2.2, -1.4, { fontSize: 26, color: '#ffcf9a' });
  colLabel.name = 'bd2';
}
function updateBound() {
  const t = boundState.t;
  riftPlates.forEach((p) => { p.position.x = p.userData.side * (0.55 + t * 1.1); });
  magma.scale.setScalar(0.7 + t * 0.6);
  colPlates.forEach((p) => { p.position.x = 6.2 + p.userData.side * (2.35 - t * 0.75); });
  mount.scale.set(0.7 + t * 0.5, 0.25 + t * 1.0, 1);
  mount.position.y = 0.62 + (0.25 + t) * 0.55;
}

/* ---------------- HUD ---------------- */

const hud = makeHUD(stage, [['a', '读数'], ['b', ''], ['x', '']]);
hud.show(false);

/* ---------------- 控制条与章节 ---------------- */

const ctl = createControlsPanel(document.getElementById('controls'));

const state = { coastAuto: false, seaLevel: 0.25, ma: 250, playing: false, hotOn: true };

const SECTIONS = [
  {
    id: 'coast', title: '沧海桑田',
    html: `<p>「沧海桑田」说的是海洋可以变成陆地、陆地也可以变成海洋。海平面的升降与地壳的抬升、下降，都在不断改变着海岸的面貌。</p>
<p>拖动「海平面」滑杆或点「自动循环」：水位下降时海底出露成陆地（沧海→桑田），水位上升时沿海低地被淹没（桑田→沧海）。</p>`,
    enter() {
      showGroup(gCoast);
      hideAllSprites();
      showOnly((s) => s.name === 'coastSea');
      hud.show(false);
      ctl.clear();
      ctl.slider({
        label: '海平面', min: -0.5, max: 0.8, step: 0.02, value: state.seaLevel,
        fmt: (v) => (v >= 0.25 ? '高海面' : v >= 0.05 ? '中' : '低海面（海退）'),
        onInput: (v) => { state.seaLevel = v; state.coastAuto = false; },
      });
      ctl.button({
        label: '▶ 自动循环',
        onClick() { state.coastAuto = !state.coastAuto; },
      });
      app.setCamera([6.5, 5.2, 9.5], [0, 0, 0]);
    },
    tick(dt) {
      if (!state.coastAuto) return;
      state.seaLevel += dt * 0.22;
      if (state.seaLevel > 0.8) state.seaLevel = -0.5;
      const w = gCoast.getObjectByName('coastWater');
      if (w) w.position.y = state.seaLevel + 0.45;
    },
  },
  {
    id: 'fossil', title: '高山上的海洋化石',
    html: `<p>珠穆朗玛峰等高山岩层中发现了<b>三叶虫、菊石等海洋生物化石</b>——这里几亿年前曾是汪洋大海。海底的沉积岩层在<b>板块挤压</b>下褶皱、抬升，把海床举成了高山。</p>
<p>拖动「挤压抬升」滑杆，看水平的地层如何被挤成褶皱山，化石（🐚）随石灰岩层一起被抬到高处。</p>`,
    enter() {
      showGroup(gStrata);
      hideAllSprites();
      showOnly((s) => s.name === 'fo1' || s.name === 'fo2');
      fossilSprites.forEach((s) => { s.visible = true; });
      hud.show(false);
      ctl.clear();
      ctl.slider({
        label: '挤压抬升', min: 0, max: 1, step: 0.01, value: strataState.t,
        fmt: (v) => Math.round(v * 100) + '%',
        onInput: (v) => { strataState.t = v; updateStrata(); },
      });
      ctl.button({
        label: '▶ 演示全过程',
        onClick: () => { state.strataAnim = !state.strataAnim; },
      });
      updateStrata();
      app.setCamera([1.5, 3.2, 10.5], [0, -0.3, 0]);
    },
    tick(dt) {
      if (!state.strataAnim) return;
      strataState.t += dt * 0.12;
      if (strataState.t > 1) strataState.t = 0;
      const s = ctl.el.querySelector('input[type=range]');
      if (s) s.value = strataState.t;
      updateStrata();
    },
  },
  {
    id: 'paleo', title: '海峡下的古河道',
    html: `<p>台湾海峡海底发现了<b>古河道与河流沉积物</b>——冰期时海平面下降约 130 米，海峡露出成为陆地，河流在其上流淌；间冰期海面回升，河谷被海水淹没，成为「海峡下的古河道」。</p>
<p>拖动「海平面变化」（±140 米）看陆桥的出现与消失，开「露出古河道」找埋藏的河谷。</p>`,
    enter() {
      showGroup(gStrait);
      hideAllSprites();
      showOnly((s) => ['st1', 'st2', 'st3'].includes(s.name));
      hud.show(true);
      hud.set('a', '当前海平面 0 m');
      hud.set('b', '冰期低海面约 −130 m');
      hud.set('x', '');
      ctl.clear();
      ctl.slider({
        label: '海平面变化', min: -140, max: 40, step: 5, value: 0,
        fmt: (v) => (v > 0 ? '+' : '') + v + ' m',
        onInput: (v) => {
          straitState.level = v;
          const w = gStrait.getObjectByName('straitWater');
          if (w) w.position.y = 0.55 + v * 0.004;
          const ch = gStrait.getObjectByName('paleoChannel');
          if (ch) ch.visible = v < -50;
          const st4 = sprites.find((s) => s.name === 'st4');
          if (st4) st4.visible = v < -50;
          hud.set('a', `当前海平面 ${v > 0 ? '+' : ''}${v} m`);
          hud.set('b', v < -60 ? '海峡出露 → 陆桥相连' : v < -30 ? '海峡变窄' : '海峡（海水覆盖）');
        },
      });
      ctl.button({
        label: '冰期 −130 m',
        onClick: () => {
          const input = ctl.el.querySelector('input[type=range]');
          if (input) { input.value = -130; input.dispatchEvent(new Event('input')); }
        },
      });
      app.setCamera([1.0, 4.0, 9.8], [0, 0.3, 0]);
    },
  },
  {
    id: 'wegener', title: '大陆漂移假说',
    html: `<p>1912 年德国科学家<b>魏格纳</b>提出<b>大陆漂移假说</b>：大西洋两岸轮廓十分吻合，南美大陆东部与非洲大陆西部几乎可以拼合。</p>
<p>证据：① 两岸地形轮廓吻合；② <b>中龙等淡水爬行动物化石</b>在两岸同时出现（淡水生物无法横渡大洋）；③ 舌羊齿植物化石广泛分布于南方各大陆；④ 古冰川擦痕的拼接。</p>
<p>点「演示分离」，看南美与非洲沿大西洋中脊缓缓裂开。</p>`,
    enter() {
      showGroup(gMap);
      hideAllSprites();
      // 只显示大西洋两岸
      for (const key of Object.keys(contMeshes)) contMeshes[key].visible = ['samerica', 'africa', 'namerica', 'eurasia'].includes(key);
      contMeshes.samerica.position.set(0, 0, 0);
      contMeshes.africa.position.set(0, 0, 0);
      contMeshes.namerica.visible = false;
      contMeshes.eurasia.visible = false;
      evidGroup.visible = true;
      showEvid(true);
      state.driftK = 0;
      state.driftAnim = false;
      hud.show(false);
      ctl.clear();
      ctl.slider({
        label: '分离程度', min: 0, max: 1, step: 0.01, value: 0,
        fmt: (v) => Math.round(v * 100) + '%',
        onInput: (v) => { state.driftK = v; applyDrift(); },
      });
      ctl.button({
        label: '▶ 演示分离',
        onClick: () => { state.driftAnim = !state.driftAnim; },
      });
      ctl.sep();
      ctl.toggle({
        label: '化石与中脊标注', value: true,
        onChange: (v) => { showEvid(v); },
      });
      applyDrift();
      app.setCamera([0, 5.5, 7.6], [0, 0, -0.5]);
    },
    tick(dt) {
      if (!state.driftAnim) return;
      state.driftK += dt * 0.1;
      if (state.driftK > 1) state.driftK = 0;
      const input = ctl.el.querySelector('input[type=range]');
      if (input) input.value = state.driftK;
      applyDrift();
    },
  },
  {
    id: 'pangaea', title: '泛大陆的分裂',
    html: `<p>约 <b>2.5 亿年前</b>，全球大陆聚合成一块「<b>泛大陆</b>」（Pangaea，盘古大陆），周围是泛大洋。此后泛大陆逐渐分裂、漂移，形成了今天的海陆分布。</p>
<p>拖动「地质年代」滑杆（2.5 亿年前 → 今天）或点「播放」，看大陆如何从聚合走向分离。</p>`,
    enter() {
      showGroup(gMap);
      hideAllSprites();
      for (const key of Object.keys(contMeshes)) {
        contMeshes[key].visible = true;
        contMeshes[key].userData.base = [0, 0];
      }
      evidGroup.visible = false;
      plateLines.visible = false;
      plateLabels.forEach((s) => { s.visible = false; });
      hotDots.forEach((d) => { d.visible = false; });
      volcano.visible = false;
      quakeRings.forEach((r) => { r.visible = false; });
      state.ma = 250;
      state.playing = false;
      hud.show(true);
      hud.set('a', '距今年代 2.5 亿年前');
      hud.set('b', '泛大陆（盘古大陆）');
      hud.set('x', '');
      pangaeaAt(250);
      ctl.clear();
      ctl.slider({
        label: '地质年代', min: 0, max: 250, step: 1, value: 250,
        fmt: (v) => (v > 0 ? `${(v / 100).toFixed(2)} 亿年前` : '今天'),
        onInput: (v) => { state.ma = v; pangaeaAt(v); updateMaHud(); },
      });
      ctl.button({
        label: '▶ 播放',
        onClick(e) {
          state.playing = !state.playing;
          e.textContent = state.playing ? '⏸ 暂停' : '▶ 播放';
        },
      });
      ctl.sep();
      ctl.toggle({ label: '板块边界', value: false, onChange: (v) => { plateLines.visible = v; } });
      app.setCamera([0, 6.4, 7.2], [0, 0, -0.5]);
    },
    tick(dt) {
      if (!state.playing) return;
      state.ma -= dt * 14;
      if (state.ma < 0) state.ma = 250;
      pangaeaAt(state.ma);
      updateMaHud();
      const input = ctl.el.querySelector('input[type=range]');
      if (input) input.value = state.ma;
    },
  },
  {
    id: 'plates', title: '六大板块',
    html: `<p>全球岩石圈划分为<b>六大板块</b>：亚欧板块、太平洋板块、美洲板块、非洲板块、印度洋板块、南极洲板块。板块<b>内部</b>比较稳定，<b>边界</b>处地壳运动活跃。</p>
<p>红线即板块边界：红线下方大陆在漂移，海洋在生长与消亡。对照上一章的漂移动画，理解「大陆漂移」其实是「板块运动」的表现。</p>`,
    enter() {
      showGroup(gMap);
      hideAllSprites();
      for (const key of Object.keys(contMeshes)) {
        contMeshes[key].visible = true;
        contMeshes[key].userData.base = [0, 0];
        contMeshes[key].position.set(0, 0, 0);
      }
      pangaeaAt(0);
      evidGroup.visible = false;
      plateLines.visible = true;
      plateLabels.forEach((s) => { s.visible = true; });
      hotDots.forEach((d) => { d.visible = false; });
      volcano.visible = false;
      quakeRings.forEach((r) => { r.visible = false; });
      hud.show(false);
      ctl.clear();
      ctl.toggle({
        label: '板块名称', value: true,
        onChange: (v) => plateLabels.forEach((s) => { s.visible = v; }),
      });
      ctl.toggle({ label: '边界红线', value: true, onChange: (v) => { plateLines.visible = v; } });
      app.setCamera([0, 6.4, 7.2], [0, 0, -0.5]);
    },
  },
  {
    id: 'quake', title: '火山与地震',
    html: `<p>板块交界处地壳活跃，集中了全球绝大多数<b>火山与地震</b>，形成两大火山地震带：<b>环太平洋火山地震带</b>（全球约 80% 的地震）与<b>地中海—喜马拉雅火山地震带</b>。</p>
<p>黄色光点脉动处为典型活跃区，橙色圆锥是火山（示例：富士山）。开「地震波」看震中扩散的波纹。</p>`,
    enter() {
      showGroup(gMap);
      hideAllSprites();
      for (const key of Object.keys(contMeshes)) { contMeshes[key].visible = true; contMeshes[key].position.set(0, 0, 0); }
      pangaeaAt(0);
      evidGroup.visible = false;
      plateLines.visible = true;
      plateLabels.forEach((s) => { s.visible = false; });
      hotDots.forEach((d) => { d.visible = true; });
      volcano.visible = true;
      quakeRings.forEach((r) => { r.visible = state.hotOn; });
      hud.show(false);
      ctl.clear();
      ctl.toggle({
        label: '地震波', value: true,
        onChange: (v) => { state.hotOn = v; quakeRings.forEach((r) => { r.visible = v; }); },
      });
      ctl.sep();
      ctl.toggle({ label: '板块边界', value: true, onChange: (v) => { plateLines.visible = v; } });
      app.setCamera([0, 6.4, 7.2], [0, 0, -0.5]);
    },
    tick(dt) {
      const t = clockT;
      quakeRings.forEach((r) => {
        if (!r.visible) return;
        const ph = (t * 0.35 + r.userData.phase) % 1;
        r.scale.setScalar(0.5 + ph * 5);
        r.material.opacity = 0.85 * (1 - ph);
      });
      volcano.material.emissive = volcano.material.emissive || new THREE.Color(0, 0, 0);
      hotDots.forEach((d, i) => {
        d.material.color.setHSL(0.06, 0.9, 0.5 + 0.2 * Math.sin(t * 3 + i * 1.7));
      });
    },
  },
  {
    id: 'boundary', title: '张裂与碰撞',
    html: `<p>板块边界的两种基本运动：<b>张裂</b>（生长边界）——板块向两侧分离，软流层岩浆上涌冷凝形成新的大洋地壳，如大西洋中脊、东非大裂谷；<b>碰撞</b>（消亡边界）——板块相向挤压，大洋板块俯冲消减、大陆边缘隆起形成岛弧与高大山脉，如喜马拉雅山。</p>
<p>拖动「运动进程」看左（张裂）右（碰撞）两边同时演化。</p>`,
    enter() {
      showGroup(gBound);
      hideAllSprites();
      showOnly((s) => s.name === 'bd1' || s.name === 'bd2');
      sprites.forEach((s) => { if (s.name === 'bd1' || s.name === 'bd2') s.visible = true; });
      hud.show(false);
      ctl.clear();
      ctl.slider({
        label: '运动进程', min: 0, max: 1, step: 0.01, value: boundState.t,
        fmt: (v) => Math.round(v * 100) + '%',
        onInput: (v) => { boundState.t = v; updateBound(); },
      });
      app.setCamera([3.1, 3.4, 8.6], [3.1, 0.6, 0]);
      updateBound();
    },
  },
  {
    id: 'quiz', title: '随堂检测',
    html: `<p>5 道选择题，检验海陆变迁的掌握情况。</p>`,
    enter() {
      showGroup(gMap);
      hideAllSprites();
      for (const key of Object.keys(contMeshes)) { contMeshes[key].visible = true; contMeshes[key].position.set(0, 0, 0); }
      pangaeaAt(0);
      evidGroup.visible = false;
      plateLines.visible = true;
      hotDots.forEach((d) => { d.visible = false; });
      volcano.visible = false;
      quakeRings.forEach((r) => { r.visible = false; });
      hud.show(false);
      ctl.clear();
      app.setCamera([0, 6.4, 7.2], [0, 0, -0.5]);
      showQuiz();
    },
  },
];

function updateMaHud() {
  hud.set('a', state.ma > 0 ? `距今年代 ${(state.ma / 100).toFixed(2)} 亿年前` : '距今年代：今天');
  hud.set('b', state.ma > 220 ? '泛大陆聚合' : state.ma > 140 ? '开始分裂' : state.ma > 60 ? '大西洋张开，印度北漂' : '接近今日海陆格局');
}

function applyDrift() {
  const k = state.driftK;
  const ease = k * k * (3 - 2 * k);   // 0=拼合 1=今日
  contMeshes.samerica.position.x = (1 - ease) * 1.15;
  contMeshes.africa.position.x = -(1 - ease) * 0.5;
  contMeshes.samerica.position.z = (1 - ease) * 0.16;
  if (evidGroup.visible) evidDots.forEach((s) => { s.visible = true; });
}

function showEvid(v) {
  evidGroup.visible = v;
  evidDots.forEach((s) => { s.visible = v; });
}

/* ---------------- 随堂检测 ---------------- */

const QUIZ = [
  {
    q: '喜马拉雅山上发现海洋生物化石，说明什么？',
    opts: ['生物曾生活在山上', '这里几亿年前是海洋，后来抬升成山', '化石是风吹来的', '山曾经下沉过'],
    a: 1,
    ex: '海底沉积岩中的海洋化石出现在高山上，说明这里曾是海洋，后经地壳抬升（板块碰撞挤压）成为高山——「沧海桑田」。',
  },
  {
    q: '大陆漂移假说的提出者是？',
    opts: ['哥白尼', '魏格纳', '达尔文', '李四光'],
    a: 1,
    ex: '1912 年德国气象学家魏格纳系统提出大陆漂移假说，证据包括大西洋两岸轮廓吻合、古生物化石与古冰川的跨洋分布等。',
  },
  {
    q: '下列不属于大陆漂移证据的是？',
    opts: ['南美与非洲大陆轮廓的吻合', '中龙化石在南美和非洲都有分布', '各大陆上都发现有舌羊齿植物化石', '赤道地区全年高温多雨'],
    a: 3,
    ex: '赤道气候是纬度位置的结果，与大陆漂移无关；前三项正是魏格纳的经典证据。',
  },
  {
    q: '全球分为六大板块，板块之间发生张裂的地区常形成什么？',
    opts: ['高大山脉', '裂谷或新的海洋（如东非大裂谷、大西洋）', '高原', '深海沟'],
    a: 1,
    ex: '生长边界（张裂）处岩浆上涌形成裂谷与新的大洋地壳；碰撞挤压处（消亡边界）才形成高大山脉与海沟。',
  },
  {
    q: '世界两大火山地震带是？',
    opts: ['环太平洋带和地中海—喜马拉雅带', '大西洋中脊和东非大裂谷', '环大西洋带和环印度洋带', '太平洋中脊和非洲带'],
    a: 0,
    ex: '板块交界处地壳活跃：环太平洋火山地震带集中了全球约 80% 的地震，另一条是地中海—喜马拉雅带。',
  },
];

function showQuiz() {
  let idx = 0, score = 0;
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
      <h3></h3><div class="q-opts"></div><div class="q-explain"></div>
      <div class="q-foot"><span class="q-score">得分：${score}</span></div>`;
    card.querySelector('h3').textContent = item.q;
    const optsBox = card.querySelector('.q-opts');
    item.opts.forEach((opt, i) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'quiz-opt';
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
        const next = document.createElement('button');
        next.type = 'button'; next.className = 'ctl-btn active';
        next.textContent = idx < QUIZ.length - 1 ? '下一题 →' : '查看成绩 →';
        next.addEventListener('click', () => { idx++; idx < QUIZ.length ? renderQ() : renderResult(); });
        card.querySelector('.q-foot').appendChild(next);
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
      <p style="color:var(--text-dim);margin:4px 0 18px">正确率 ${pct}%${pct >= 80 ? '，板块学得很扎实！' : pct >= 60 ? '，大部分概念已清楚，回顾一下错题。' : '，建议回到前面章节对照模型再看一遍。'}</p>`;
    const again = document.createElement('button');
    again.type = 'button'; again.className = 'ctl-btn active'; again.textContent = '重新测验';
    again.addEventListener('click', () => { idx = 0; score = 0; renderQ(); });
    const back = document.createElement('button');
    back.type = 'button'; back.className = 'ctl-btn'; back.textContent = '返回第一章节';
    back.addEventListener('click', () => { panel.remove(); window.__eduSections.select(0); });
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:10px;justify-content:center';
    row.appendChild(back); row.appendChild(again);
    card.appendChild(row);
    panel.appendChild(card);
  }
  renderQ();
  activeSectionCleanup = () => panel.remove();
}

/* ---------------- 启动 ---------------- */

let clockT = 0;

loadAll([
  { key: 'sky', label: '环境光', job: loadHDR(TEXDIR + 'sky/sky_court-BLHJ2ADI.hdr') },
  { key: 'skyBg', label: '天空', job: loadTexture(TEXDIR + 'sky/sky_court-BKHrsJQE.webp') },
], (d, t, label) => loader.setText(`正在加载 ${d}/${t}（${label}）`)).then((t) => {
  scene.environment = t.sky;
  scene.background = t.skyBg;

  pangaeaAt(0);
  updateStrata();
  updateBound();

  loader.hide();
  const sections = createSections({
    nav: document.getElementById('sideNav'),
    descPanel: document.getElementById('descPanel'),
    sections: SECTIONS,
    onSelect(i, sec) {
      activeSectionCleanup();
      activeSectionCleanup = () => {};
      state.strataAnim = false;
      state.driftAnim = false;
      state.playing = false;
      state.coastAuto = false;
      hideAllSprites();
      sec.enter();
    },
  });
  window.__eduSections = sections;
  sections.select(0);

  app.onFrame((dt) => {
    cameraTweenTick(app, dt);
    clockT += dt;
    const sec = SECTIONS[sections.buttons.findIndex((b) => b.classList.contains('active'))] || SECTIONS[0];
    if (sec.tick) sec.tick(dt);
    // 沧海桑田水位应用
    const w = gCoast.getObjectByName('coastWater');
    if (w) w.position.y = state.seaLevel + 0.45;
  });
}).catch((err) => {
  loader.setText('资源加载失败：' + err.message);
  console.error(err);
});

let activeSectionCleanup = () => {};
