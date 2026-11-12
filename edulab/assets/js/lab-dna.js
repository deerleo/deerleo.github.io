/* EduLab · DNA 的结构（dna）
 * 章节：照片 51 号 / 动手搭 DNA 模型 / DNA 双螺旋的结构 / 随堂检测
 * 场景：X 射线衍射图样实时计算（螺距/半径/链数可调，对照照片 51 号）、
 *       脱氧核苷酸组装与互补配对、按序列生成的 B 型双螺旋（点碱基对看氢键、查哥夫规则计算器）。
 * 工艺：CatmullRom 变宽放样主链（磷酸珠串轮廓）+ 车削玻璃器皿 + 顶点色小件烘培合并 +
 *       程序化木纹/粉笔板/标签/手绘记录本贴图 + 摄影棚环境反射与接触阴影体系 +
 *       实验台-背景货架-试剂道具阵列叙事；结构章碱基对悬停高亮与随转提示牌联动。
 * 布局：真·三栏（左章节大纲 / 中 3D 舞台 / 右知识点详解）+ 全元素折叠 + 专注模式，
 *       视觉工艺经 attachVFX 接入（后处理管线 + cubic 运镜）。
 */
import {
  THREE, DEG, TAU, clamp,
  createApp, makeLoader,
  createControlsPanel, makeHUD, makeTextSprite, setSpriteText,
} from './edu-core.js';
import {
  attachVFX, PAL, matSheen, matCoat, matStd,
  makeStudioEnvironment, makeWoodTexture, makeLabelTexture, fbm3,
} from './edu-vfx.js';

/* ---------------- 基础与工艺接入 ---------------- */

const stage = document.getElementById('stage');
const loader = makeLoader(stage, '正在生成双螺旋模型…');
const app = createApp({
  container: stage,
  fov: 42, near: 0.1, far: 200,
  cameraPos: [0, 1.6, 8.2], target: [0, 1.4, 0],
  minDistance: 1.2, maxDistance: 40,
  keepBackground: true,
});
const { scene, camera, controls } = app;
/* 视觉工艺接入：后处理管线接管渲染与相机缓动（setCamera 升级为 cubic 运镜） */
const vfx = attachVFX(app, 'illus');

/* 摄影棚环境反射：金属件与玻璃器皿的 PBR 反射来源（程序化，按 renderer 缓存） */
scene.environment = makeStudioEnvironment(app.renderer);

scene.add(new THREE.AmbientLight(0xe6ecf5, 1.15));
const key = new THREE.DirectionalLight(0xfff2e0, 1.7);
key.position.set(5, 8, 6);
scene.add(key);
const rim = new THREE.DirectionalLight(0xbcd4ff, 0.5);
rim.position.set(-6, 2, -5);
scene.add(rim);
/* 补光体系：天光罩（上冷下暖）+ 低位补光 + 地面反弹，消除背光面的死黑 */
const hemi = new THREE.HemisphereLight(0xdfe9f4, 0x35281a, 0.55);
scene.add(hemi);
const fill = new THREE.DirectionalLight(0xd9e5f2, 0.5);
fill.position.set(-3.5, 4.5, 7.5);
scene.add(fill);
const bounce = new THREE.DirectionalLight(0xffe2c2, 0.28);
bounce.position.set(2.5, -3.5, -6);
scene.add(bounce);

const M = (color, rough = 0.7, metal = 0, extra = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, ...extra });
const mesh = (geo, mat) => new THREE.Mesh(geo, mat);

function label(text, color = '#ffffff', scale = 0.0055, bg = 'rgba(10,16,24,0.72)') {
  return makeTextSprite(text, { fontSize: 32, color, scale, bg });
}

const BASE_COLORS = { A: 0x59d999, T: 0xe05252, G: 0xffb054, C: 0x6f9de0 };
const BASE_NAMES = { A: '腺嘌呤', T: '胸腺嘧啶', G: '鸟嘌呤', C: '胞嘧啶' };
const BASE_EN = { A: 'Adenine', T: 'Thymine', G: 'Guanine', C: 'Cytosine' };
const COMPLEMENT = { A: 'T', T: 'A', G: 'C', C: 'G' };
const HBONDS = { A: 2, T: 2, G: 3, C: 3 };   // 与互补碱基之间的氢键数（A=T 2，G≡C 3）
const PLATE_W = { A: 0.88, G: 0.88, T: 0.64, C: 0.64 };   // 嘌呤双环宽 / 嘧啶单环窄

/* ---------------- 工艺工具集（材质分层 / 变宽放样 / 倒角板件 / 接触阴影） ---------------- */

/* 按角色分层的共享材质：骨架漆面 / 磷酸黄铜 / 糖环绒面 / 器皿玻璃 / 台面深金属。
   全部常驻复用，rebuild 时只释放几何体，勿 dispose 这批材质。 */
const craftMats = {
  backbone: matCoat(0x9aa6ba, { roughness: 0.3, metalness: 0.2, clearcoatRoughness: 0.2 }),
  phosphorus: matStd(PAL.brass, { roughness: 0.34, metalness: 0.85 }),
  sugar: matSheen(0x8fb6d8, { roughness: 0.42, sheen: 0.55 }),
  /* 器皿玻璃：透明清漆近似（不用 transmission——那会让渲染器每帧多跑一趟全场景，draw call 翻倍） */
  glass: matCoat(0xd9edf2, { roughness: 0.08, metalness: 0.06, clearcoatRoughness: 0.12, opacity: 0.26, side: THREE.DoubleSide }),
  metalDark: matStd(0x39424f, { roughness: 0.42, metalness: 0.72 }),
  plinth: matStd(0x48535f, { roughness: 0.5, metalness: 0.58 }),
  steel: matStd(PAL.steel, { roughness: 0.28, metalness: 0.92 }),
  paper: matStd(PAL.paper, { roughness: 0.85 }),
};
/* 四种碱基各一块绒面材质（板件经 clone 出独立副本身份，供悬停高亮单独打光） */
const plateMats = {};
for (const b of Object.keys(BASE_COLORS)) {
  plateMats[b] = matSheen(BASE_COLORS[b], { roughness: 0.4, sheen: 0.62 });
}
/* 氢键虚线的共享线材质（两个章节复用，规格一致就不必逐对新建） */
const dashMat = new THREE.LineDashedMaterial({ color: 0xffe08a, dashSize: 0.055, gapSize: 0.05 });

/* 变宽截面放样：沿 CatmullRom 样条扫掠半径随弧长参数变化的圆截面。
   截面法向按 parallel transport 逐段递推（上一段法向投影到当前法平面），急弯不翻扭转。
   用于磷酸-脱氧核糖主链管：radiusFn 制造等间距「珠粒」隆起 + fbm 细微肌理。 */
function loftTube(pts, radiusFn, { segs = 200, radial = 10, mat } = {}) {
  const curve = new THREE.CatmullRomCurve3(pts);
  const pos = [], uvs = [], idx = [];
  let prevN = null;
  for (let s = 0; s <= segs; s++) {
    const u = s / segs;
    const c = curve.getPointAt(u);
    const t = curve.getTangentAt(u).normalize();
    const ref = Math.abs(t.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
    let n = ref.sub(t.clone().multiplyScalar(ref.dot(t))).normalize();
    if (prevN) n = prevN.clone().sub(t.clone().multiplyScalar(prevN.dot(t))).normalize();
    prevN = n.clone();
    const b = t.clone().cross(n).normalize();
    const r = radiusFn(u);
    for (let j = 0; j <= radial; j++) {
      const a = (j / radial) * TAU;
      const dir = n.clone().multiplyScalar(Math.cos(a)).add(b.clone().multiplyScalar(Math.sin(a)));
      pos.push(c.x + dir.x * r, c.y + dir.y * r, c.z + dir.z * r);
      uvs.push(j / radial, u);
    }
  }
  const ring = radial + 1;
  for (let s = 0; s < segs; s++) {
    for (let j = 0; j < radial; j++) {
      const a = s * ring + j, bq = a + ring;
      idx.push(a, bq, a + 1, a + 1, bq, bq + 1);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  const grp = new THREE.Group();
  grp.add(new THREE.Mesh(geo, mat));
  /* 链两端各封一个圆头，避免管口露馅 */
  const capGeo = new THREE.SphereGeometry(Math.max(radiusFn(0), radiusFn(1)) * 1.08, 10, 8);
  for (const u of [0, 1]) {
    const cap = mesh(capGeo, mat);
    cap.position.copy(curve.getPointAt(u));
    grp.add(cap);
  }
  return grp;
}

/* 倒角圆角板件：碱基板 / 试剂标签底板用，替代裸 Box 的塑料感。
   嘌呤（A/G 双环）比嘧啶（T/C 单环）更宽更厚，化学上站得住。 */
function plateGeo(w, h, d, r = 0.05) {
  const s = new THREE.Shape();
  s.moveTo(-w / 2 + r, -h / 2);
  s.lineTo(w / 2 - r, -h / 2);
  s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
  s.lineTo(w / 2, h / 2 - r);
  s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
  s.lineTo(-w / 2 + r, h / 2);
  s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
  s.lineTo(-w / 2, -h / 2 + r);
  s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
  const geo = new THREE.ExtrudeGeometry(s, {
    depth: Math.max(0.01, d - r * 1.6),
    bevelEnabled: true, bevelThickness: r * 0.8, bevelSize: r * 0.8, bevelSegments: 2, curveSegments: 5,
  });
  geo.translate(0, 0, -(d - r * 1.6) / 2);
  return geo;
}

/* 接触阴影贴片：径向渐变圆盘压在道具落地处，消除「漂浮感」 */
const shadowTex = (() => {
  const S = 128;
  const cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const c = cv.getContext('2d');
  const g = c.createRadialGradient(S / 2, S / 2, S * 0.06, S / 2, S / 2, S * 0.5);
  g.addColorStop(0, 'rgba(4,8,12,0.52)');
  g.addColorStop(0.55, 'rgba(4,8,12,0.2)');
  g.addColorStop(1, 'rgba(4,8,12,0)');
  c.fillStyle = g;
  c.fillRect(0, 0, S, S);
  return new THREE.CanvasTexture(cv);
})();
function contactShadow(rx, rz, opacity = 0.55, y = 0.005) {
  const m = mesh(
    new THREE.PlaneGeometry(rx * 2, rz * 2),
    new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, opacity, depthWrite: false })
  );
  m.rotation.x = -Math.PI / 2;
  m.position.y = y;
  m.renderOrder = 2;
  return m;
}

/* 车削玻璃瓶：LatheGeometry 瓶身轮廓（瓶底圆角 → 直身 → 收肩 → 瓶口），
   内部液面 + 弯月面 + 黄铜旋盖 + 双面标签，四种碱基溶液一套。 */
function makeReagentBottle(base) {
  const g = new THREE.Group();
  const prof = [
    [0.02, 0.02], [0.3, 0.02], [0.34, 0.1], [0.35, 0.5], [0.31, 0.76], [0.18, 0.9], [0.155, 1.04], [0.165, 1.1],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const body = mesh(new THREE.LatheGeometry(prof, 26), craftMats.glass);
  g.add(body);
  const liqMat = matSheen(BASE_COLORS[base], { roughness: 0.24, sheen: 0.4, opacity: 0.85 });
  const liq = mesh(new THREE.CylinderGeometry(0.295, 0.315, 0.4, 22), liqMat);
  liq.position.y = 0.26;
  g.add(liq);
  const meniscus = mesh(new THREE.SphereGeometry(0.295, 20, 8, 0, TAU, 0, Math.PI / 2), liqMat);
  meniscus.scale.y = 0.24;
  meniscus.position.y = 0.46;
  g.add(meniscus);
  const cap = mesh(new THREE.CylinderGeometry(0.185, 0.185, 0.15, 18), craftMats.phosphorus);
  cap.position.y = 1.17;
  const capRing = mesh(new THREE.TorusGeometry(0.185, 0.022, 8, 20), craftMats.steel);
  capRing.rotation.x = Math.PI / 2;
  capRing.position.y = 1.1;
  g.add(cap, capRing);
  const accent = '#' + new THREE.Color(BASE_COLORS[base]).getHexString();
  const lblTex = makeLabelTexture(
    [`${base} · ${BASE_NAMES[base]}`, BASE_EN[base], '0.10 mol/L'],
    { w: 256, h: 150, accent, lineSizes: [34, 22, 20] }
  );
  const lblMat = new THREE.MeshStandardMaterial({ map: lblTex, roughness: 0.85 });
  const lbl = mesh(new THREE.PlaneGeometry(0.44, 0.27), lblMat);
  lbl.position.set(0, 0.42, 0.353);
  lbl.rotation.x = -0.05;
  const lblBack = lbl.clone();
  lblBack.rotation.y = Math.PI;
  lblBack.position.z = -0.353;
  g.add(lbl, lblBack);
  return g;
}

/* 小件烘培合并：把一组（几何+颜色）小件合成单个顶点色网格。
   核苷酸的磷酸/氧/五碳糖/环键等 14 个微件合并为 1 个 draw，散件不减造型。 */
const bakeMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.52, metalness: 0.12 });
function bakePartsToMesh(parts, mat = bakeMat) {
  let vCount = 0;
  const filled = parts.map(({ geo, color }) => {
    const g = geo.index ? geo.toNonIndexed() : geo;
    if (!g.attributes.normal) g.computeVertexNormals();
    const n = g.attributes.position.count;
    const col = new Float32Array(n * 3);
    const c = new THREE.Color(color);
    for (let i = 0; i < n; i++) { col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    vCount += n;
    return g;
  });
  const pos = new Float32Array(vCount * 3);
  const nor = new Float32Array(vCount * 3);
  const colAll = new Float32Array(vCount * 3);
  let o = 0;
  for (const g of filled) {
    pos.set(g.attributes.position.array, o * 3);
    nor.set(g.attributes.normal.array, o * 3);
    colAll.set(g.attributes.color.array, o * 3);
    o += g.attributes.position.count;
  }
  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  merged.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  merged.setAttribute('color', new THREE.BufferAttribute(colAll, 3));
  return mesh(merged, mat);
}

/* 两点间成键：圆柱沿键向量定向（糖环键 / 糖苷键共用），返回已摆到位的几何 */
function bondGeoBetween(va, vb, r = 0.026) {
  const len = va.distanceTo(vb);
  const g = new THREE.CylinderGeometry(r, r, len, 8);
  const q = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    vb.clone().sub(va).normalize()
  );
  g.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(q));
  const mid = va.clone().add(vb).multiplyScalar(0.5);
  g.translate(mid.x, mid.y, mid.z);
  return g;
}

const gPhoto = new THREE.Group();
const gBuild = new THREE.Group();
const gStruct = new THREE.Group();
scene.add(gPhoto, gBuild, gStruct);
const GROUPS = [gPhoto, gBuild, gStruct];
function showGroup(g) { GROUPS.forEach((x) => { x.visible = x === g; }); }

/* ================= 实验室场景叙事（地台 / 实验台 / 背景货架 / 试剂道具阵列，全章常驻） ================= */

const FLOOR_Y = -4.4;
const BENCH_TOP_Y = FLOOR_Y + 0.72;   /* 实验台顶面高度（展台底座与道具均以此为地面） */
const gEnv = new THREE.Group();
scene.add(gEnv);

/* 木质实验台：桌面木纹（程序化年轮+纤维纹）+ 前缘护边 + 四根收腿 + 台底接触阴影 */
function buildBench() {
  const g = new THREE.Group();
  const woodTop = makeWoodTexture({ base: '#6e4f30', dark: '#4a3016', light: '#8a6a42', seed: 11, planks: 5 });
  woodTop.repeat.set(2.6, 1.0);
  const topMat = new THREE.MeshStandardMaterial({ map: woodTop, roughness: 0.7, metalness: 0.03 });
  const top = mesh(new THREE.BoxGeometry(15, 0.2, 4.6), topMat);
  top.position.set(0, BENCH_TOP_Y - 0.1, 0.2);
  g.add(top);
  const trim = mesh(new THREE.BoxGeometry(15.12, 0.09, 4.72), craftMats.metalDark);
  trim.position.set(0, BENCH_TOP_Y - 0.18, 0.2);
  g.add(trim);
  for (const [lx, lz] of [[-6.9, -1.7], [6.9, -1.7], [-6.9, 1.9], [6.9, 1.9]]) {
    const leg = mesh(new THREE.CylinderGeometry(0.09, 0.13, 0.62, 12), craftMats.metalDark);
    leg.position.set(lx, FLOOR_Y + 0.31, lz);
    const foot = mesh(new THREE.CylinderGeometry(0.15, 0.16, 0.05, 14), craftMats.steel);
    foot.position.set(lx, FLOOR_Y + 0.03, lz);
    g.add(leg, foot);
  }
  const cross = mesh(new THREE.BoxGeometry(13.4, 0.07, 0.09), craftMats.metalDark);
  cross.position.set(0, FLOOR_Y + 0.18, -1.7);
  g.add(cross);
  g.add(contactShadow(7.6, 2.7, 0.5, FLOOR_Y + 0.012));
  gEnv.add(g);
}

/* 背景货架：双层木板 + 侧立板 + 背板（板面上手写粉笔要点，教学氛围道具） */
function makeBoardTexture() {
  const cv = document.createElement('canvas');
  cv.width = 1024; cv.height = 200;
  const c = cv.getContext('2d');
  c.fillStyle = '#1a222b';
  c.fillRect(0, 0, 1024, 200);
  /* 板面擦痕 */
  for (let i = 0; i < 60; i++) {
    c.fillStyle = 'rgba(255,255,255,0.015)';
    const x = Math.random() * 1024, y = Math.random() * 200;
    c.fillRect(x, y, 30 + Math.random() * 70, 2 + Math.random() * 5);
  }
  c.strokeStyle = 'rgba(216,201,160,0.35)';
  c.lineWidth = 4;
  c.strokeRect(10, 10, 1004, 180);
  c.fillStyle = 'rgba(226,214,182,0.5)';
  c.font = '600 40px "PingFang SC", sans-serif';
  c.fillText('A = T    G ≡ C    嘌呤 = 嘧啶', 60, 82);
  c.font = '400 26px "PingFang SC", sans-serif';
  c.fillStyle = 'rgba(226,214,182,0.38)';
  c.fillText('螺距 3.4 nm · 直径 2 nm · 每圈 10 对碱基', 62, 148);
  /* 右侧小螺旋涂鸦：两条正弦弧 + 横档 */
  c.strokeStyle = 'rgba(159,216,200,0.4)';
  c.lineWidth = 3;
  for (const off of [0, Math.PI]) {
    c.beginPath();
    for (let x = 0; x <= 120; x += 4) {
      const y = 100 + Math.sin(x / 38 + off) * 34;
      x === 0 ? c.moveTo(870 + x, y) : c.lineTo(870 + x, y);
    }
    c.stroke();
  }
  for (let i = 0; i < 7; i++) {
    const x = 878 + i * 16;
    const y1 = 100 + Math.sin(x / 38) * 34, y2 = 100 + Math.sin(x / 38 + Math.PI) * 34;
    c.beginPath(); c.moveTo(x, y1); c.lineTo(x, y2); c.stroke();
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function buildShelf() {
  const g = new THREE.Group();
  const wood = makeWoodTexture({ base: '#6f5a3e', dark: '#4e3d24', light: '#8d744e', seed: 23 });
  wood.repeat.set(3.2, 0.4);
  const boardMat = new THREE.MeshStandardMaterial({ map: wood, roughness: 0.6, metalness: 0.04 });
  const mkBoard = (y) => {
    const b = mesh(new THREE.BoxGeometry(13.6, 0.12, 1.05), boardMat);
    b.position.set(0, y, -3.62);
    return b;
  };
  g.add(mkBoard(-0.52), mkBoard(1.14));
  for (const sx of [-6.85, 6.85]) {
    const side = mesh(new THREE.BoxGeometry(0.16, 2.2, 1.02), boardMat);
    side.position.set(sx, 0.31, -3.62);
    g.add(side);
  }
  const back = mesh(
    new THREE.PlaneGeometry(13.3, 2.1),
    new THREE.MeshStandardMaterial({ map: makeBoardTexture(), roughness: 0.92, color: 0xb8c2ca })
  );
  back.position.set(0, 0.31, -4.14);
  g.add(back);
  gEnv.add(g);
}

/* 离心管架：木座 4 孔 + A/T/G/C 四色盖离心管（管身磨砂玻璃感） */
function buildTubeRack() {
  const g = new THREE.Group();
  const block = mesh(new THREE.BoxGeometry(1.5, 0.16, 0.42), craftMats.backbone);
  block.position.y = 0.08;
  g.add(block);
  const holes = mesh(new THREE.BoxGeometry(1.34, 0.03, 0.3), craftMats.metalDark);
  holes.position.y = 0.165;
  g.add(holes);
  const order = ['A', 'T', 'G', 'C'];
  order.forEach((b, i) => {
    const x = (i - 1.5) * 0.3;
    const tube = mesh(new THREE.CylinderGeometry(0.09, 0.07, 0.4, 12), craftMats.glass);
    tube.position.set(x, 0.36, 0);
    const cap = mesh(new THREE.CylinderGeometry(0.098, 0.098, 0.09, 12), plateMats[b]);
    cap.position.set(x, 0.56, 0);
    g.add(tube, cap);
  });
  g.add(contactShadow(1.05, 0.42, 0.4, 0.014));
  g.position.set(-0.9, -0.46, -3.58);
  g.rotation.y = 0.06;
  gEnv.add(g);
}

/* 烧杯 + 移液滴管 + 刻度贴：玻璃器皿一件三网格（杯身/水柱/滴管斜靠） */
function makeGraduationTexture() {
  const cv = document.createElement('canvas');
  cv.width = 64; cv.height = 320;
  const c = cv.getContext('2d');
  c.clearRect(0, 0, 64, 320);
  c.strokeStyle = 'rgba(255,255,255,0.75)';
  for (let i = 0; i < 7; i++) {
    const y = 288 - i * 40;
    const w = i % 2 === 0 ? 34 : 20;
    c.lineWidth = i % 2 === 0 ? 3 : 2;
    c.beginPath(); c.moveTo(10, y); c.lineTo(10 + w, y); c.stroke();
  }
  const tex = new THREE.CanvasTexture(cv);
  return tex;
}

function buildBeaker() {
  const g = new THREE.Group();
  const prof = [
    [0.02, 0.02], [0.42, 0.02], [0.46, 0.08], [0.46, 0.96], [0.5, 1.0], [0.47, 1.04],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const body = mesh(new THREE.LatheGeometry(prof, 24), craftMats.glass);
  g.add(body);
  const water = mesh(new THREE.CylinderGeometry(0.42, 0.43, 0.5, 22),
    matSheen(0x9fd4d8, { roughness: 0.18, sheen: 0.5, opacity: 0.55 }));
  water.position.y = 0.31;
  g.add(water);
  const gradu = mesh(new THREE.PlaneGeometry(0.14, 0.66),
    new THREE.MeshBasicMaterial({ map: makeGraduationTexture(), transparent: true }));
  gradu.position.set(0.18, 0.56, 0.4);
  g.add(gradu);
  const pipe = mesh(new THREE.CylinderGeometry(0.014, 0.02, 1.15, 8), craftMats.glass);
  pipe.position.set(-0.2, 0.72, 0.12);
  pipe.rotation.z = 0.42;
  const pipeTip = mesh(new THREE.ConeGeometry(0.022, 0.1, 8), craftMats.glass);
  pipeTip.position.set(-0.415, 0.24, 0.12);
  pipeTip.rotation.z = 0.42;
  g.add(pipe, pipeTip);
  g.add(contactShadow(0.62, 0.62, 0.42));
  return g;
}

/* 培养皿：皿体 + 培养基淡面 + 皿盖（盖沿留缝），旁边平放 */
function buildPetri() {
  const g = new THREE.Group();
  const dish = mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.07, 30), craftMats.glass);
  const agar = mesh(new THREE.CylinderGeometry(0.47, 0.47, 0.035, 26), matSheen(0xd8cfa8, { roughness: 0.5, opacity: 0.8 }));
  agar.position.y = 0.012;
  const lid = mesh(new THREE.CylinderGeometry(0.58, 0.58, 0.055, 30), craftMats.glass);
  lid.position.y = 0.1;
  g.add(dish, agar, lid);
  g.add(contactShadow(0.7, 0.7, 0.36));
  return g;
}

/* 实验记录本：摊开双页（方格纸 + X 衍射手绘草图 + 潦草笔记 + 咖啡杯环）+ 木质铅笔 */
function makeNotebookTexture() {
  const cv = document.createElement('canvas');
  cv.width = 512; cv.height = 384;
  const c = cv.getContext('2d');
  c.fillStyle = '#f2eede';
  c.fillRect(0, 0, 512, 384);
  /* 纸纹噪点 */
  for (let i = 0; i < 500; i++) {
    c.fillStyle = 'rgba(120,110,80,0.045)';
    c.fillRect(Math.random() * 512, Math.random() * 384, 2, 2);
  }
  /* 方格 */
  c.strokeStyle = 'rgba(96,138,158,0.16)';
  c.lineWidth = 1;
  for (let x = 24; x < 512; x += 24) { c.beginPath(); c.moveTo(x, 16); c.lineTo(x, 368); c.stroke(); }
  for (let y = 16; y < 384; y += 24) { c.beginPath(); c.moveTo(24, y); c.lineTo(488, y); c.stroke(); }
  /* 左页：X 形衍射示意——沿对角撒 300 个墨点，四处交叉亮斑 */
  c.save();
  c.translate(150, 190);
  c.strokeStyle = 'rgba(40,50,60,0.5)';
  c.lineWidth = 2;
  c.beginPath(); c.arc(0, 0, 120, 0, TAU); c.stroke();
  for (const dir of [-1, 1]) {
    for (let i = 0; i < 150; i++) {
      const t = (i / 150 - 0.5) * 2;
      const spread = (Math.random() - 0.5) * 22;
      const a = (1 - Math.abs(t)) * 0.85;
      c.fillStyle = `rgba(45,52,66,${0.1 + a * 0.4 * Math.random()})`;
      const r = 3 + Math.random() * 5 * a;
      c.beginPath();
      c.arc(t * 105 * dir + spread * 0.4, t * 88 + spread, r, 0, TAU);
      c.fill();
    }
  }
  for (const [sx, sy] of [[-52, -44], [52, 44], [-52, 44], [52, -44]]) {
    c.fillStyle = 'rgba(30,36,46,0.5)';
    c.beginPath(); c.arc(sx, sy, 7, 0, TAU); c.fill();
  }
  c.restore();
  /* 右页：潦草笔记横线 + 下划重点 */
  c.strokeStyle = 'rgba(52,60,74,0.6)';
  for (let i = 0; i < 8; i++) {
    const y = 52 + i * 34;
    c.lineWidth = 2.4;
    c.beginPath();
    c.moveTo(300, y);
    const wob = 2 + Math.random() * 3;
    for (let x = 300; x < 470; x += 14) c.lineTo(x, y + Math.sin(x / 17) * wob);
    c.stroke();
    if (i === 2 || i === 5) {
      c.strokeStyle = 'rgba(200,90,60,0.7)';
      c.beginPath(); c.moveTo(300, y + 8); c.lineTo(430, y + 8); c.stroke();
      c.strokeStyle = 'rgba(52,60,74,0.6)';
    }
  }
  /* 咖啡杯环 */
  c.strokeStyle = 'rgba(150,96,52,0.28)';
  c.lineWidth = 9;
  c.beginPath(); c.arc(430, 300, 42, 0.4, 5.6); c.stroke();
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function buildNotebook() {
  const g = new THREE.Group();
  const cover = mesh(new THREE.BoxGeometry(1.5, 0.045, 1.1), craftMats.metalDark);
  g.add(cover);
  const pageMat = new THREE.MeshStandardMaterial({ map: makeNotebookTexture(), roughness: 0.95, color: 0xc9c4b4 });
  const pgL = mesh(new THREE.PlaneGeometry(0.72, 1.02), pageMat);
  pgL.rotation.x = -Math.PI / 2;
  pgL.rotation.z = Math.PI / 2;
  pgL.position.set(-0.365, 0.028, 0);
  const pgR = pgL.clone();
  pgR.position.x = 0.365;
  g.add(pgL, pgR);
  /* 铅笔：木杆 + 笔芯尖 + 黄铜箍 */
  const pencil = new THREE.Group();
  const shaft = mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.62, 10), craftMats.paper);
  shaft.rotation.z = Math.PI / 2;
  const tip = mesh(new THREE.ConeGeometry(0.028, 0.09, 10), craftMats.phosphorus);
  tip.rotation.z = Math.PI / 2;
  tip.position.x = -0.35;
  const eraser = mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.06, 10), matSheen(PAL.granule, { roughness: 0.6 }));
  eraser.rotation.z = Math.PI / 2;
  eraser.position.x = 0.34;
  pencil.add(shaft, tip, eraser);
  pencil.position.set(0.1, 0.06, 0.62);
  pencil.rotation.y = 0.5;
  g.add(pencil);
  g.add(contactShadow(0.95, 0.75, 0.4));
  return g;
}

/* 底片盒 + 储物木箱（X 射线底片与备用试剂的语境道具） */
function buildFilmBox() {
  const g = new THREE.Group();
  const box = mesh(new THREE.BoxGeometry(1.15, 0.3, 0.78), craftMats.metalDark);
  box.position.y = 0.15;
  const lid = mesh(new THREE.BoxGeometry(1.18, 0.05, 0.8), craftMats.steel);
  lid.position.y = 0.32;
  const lbl = mesh(new THREE.PlaneGeometry(0.8, 0.22),
    new THREE.MeshStandardMaterial({
      map: makeLabelTexture(['X 射线底片', '5 cm × 5 cm', '避光保存'], { w: 256, h: 110, lineSizes: [30, 22, 18] }),
      roughness: 0.85,
    }));
  lbl.rotation.x = -Math.PI / 2;
  lbl.position.y = 0.352;
  g.add(box, lid, lbl);
  g.add(contactShadow(0.78, 0.58, 0.42));
  return g;
}

function buildCrate() {
  const g = new THREE.Group();
  const wood = makeWoodTexture({ base: '#7a5a36', dark: '#553a1e', light: '#95734a', seed: 37, planks: 3 });
  wood.repeat.set(1.2, 1.2);
  const boxMat = new THREE.MeshStandardMaterial({ map: wood, roughness: 0.75 });
  const box = mesh(new THREE.BoxGeometry(1.5, 1.15, 1.15), boxMat);
  box.position.y = 0.575;
  const frame = mesh(new THREE.BoxGeometry(1.56, 0.08, 1.2), craftMats.metalDark);
  frame.position.y = 1.13;
  const lbl = mesh(new THREE.PlaneGeometry(0.9, 0.3),
    new THREE.MeshStandardMaterial({
      map: makeLabelTexture(['ATGC 试剂（备用）', '干燥 避光'], { w: 256, h: 110, lineSizes: [30, 22], accent: '#5a4630' }),
      roughness: 0.85,
    }));
  lbl.position.set(0, 0.62, 0.59);
  g.add(box, frame, lbl);
  g.add(contactShadow(1.0, 0.85, 0.45));
  return g;
}

/* 展台底座：模型落位处的金属圆盘 + 立柱 + 支撑面接触阴影，把悬浮模型「放」进房间 */
function makePlinth(rTop, yTop, x = 0, z = 0, sx = 1, sz = 1, baseY = BENCH_TOP_Y) {
  const g = new THREE.Group();
  const top = mesh(new THREE.CylinderGeometry(rTop, rTop * 1.08, 0.12, 36), craftMats.plinth);
  top.scale.set(sx, 1, sz);
  top.position.set(x, yTop - 0.06, z);
  const colH = Math.max(0.05, yTop - 0.12 - baseY);
  const col = mesh(new THREE.CylinderGeometry(rTop * 0.24, rTop * 0.34, colH, 14), craftMats.plinth);
  col.scale.set(sx, 1, sz);
  col.position.set(x, baseY + colH / 2, z);
  const sh = contactShadow(rTop * 1.2 * sx, rTop * 1.2 * sz, 0.38, baseY + 0.012);
  sh.position.x = x;
  sh.position.z = z;
  g.add(top, col, sh);
  return g;
}

/* 地面 + 家具落位（装配一次，此后常驻；阴影贴片逐件铺设） */
buildBench();
buildShelf();
buildTubeRack();
{
  const floor = mesh(new THREE.PlaneGeometry(64, 40), matStd(0x1c242d, { roughness: 0.94 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = FLOOR_Y;
  gEnv.add(floor);
  const bA = makeReagentBottle('A'); bA.position.set(-4.95, -0.46, -3.6); bA.rotation.y = -0.3;
  const bT = makeReagentBottle('T'); bT.position.set(-3.9, -0.46, -3.64); bT.rotation.y = 0.22;
  const bG = makeReagentBottle('G'); bG.position.set(4.3, -0.46, -3.6); bG.rotation.y = 0.4;
  const bC = makeReagentBottle('C'); bC.position.set(5.35, -0.46, -3.66); bC.rotation.y = -0.15;
  for (const b of [bA, bT, bG, bC]) {
    b.add(contactShadow(0.52, 0.52, 0.4));
    gEnv.add(b);
  }
  const beaker = buildBeaker();
  beaker.position.set(-1.95, 1.2, -3.55);
  beaker.rotation.y = -0.4;
  gEnv.add(beaker);
  const petri = buildPetri();
  petri.position.set(-0.55, 1.2, -3.6);
  gEnv.add(petri);
  const note = buildNotebook();
  note.position.set(1.5, 1.2, -3.55);
  note.rotation.y = -0.35;
  gEnv.add(note);
  const filmBox = buildFilmBox();
  filmBox.position.set(6.1, -0.46, -3.55);
  filmBox.rotation.y = 0.5;
  gEnv.add(filmBox);
  const crate = buildCrate();
  crate.position.set(-5.7, FLOOR_Y, -3.3);
  crate.rotation.y = 0.3;
  gEnv.add(crate);
  /* 各章模型落位底座（章节 2 梯子直接落台面，阴影在 initBuild 里铺） */
  gPhoto.add(makePlinth(1.35, -3.08));
  gStruct.add(makePlinth(1.45, -2.68));
}

/* 螺旋生成器：骨架管 + 碱基对横档 */
function buildHelix({ pitch = 3.4, radius = 1.0, rise = 0.34, height = 6, strands = 2, tubes = true, bps = true, baseLen = 0.86, phase2 = 0.4 }) {
  const g = new THREE.Group();
  const bpCount = Math.max(2, Math.round(height / rise));
  const turns = pitch / rise;
  const strandMat = craftMats.backbone;
  const bpMat = M(0xb9c2d4, 0.5);

  function strandPoint(t, phase) {
    const y = -height / 2 + t * height;
    const a = TAU * (y / pitch) + phase * TAU;
    return new THREE.Vector3(Math.cos(a) * radius, y, Math.sin(a) * radius);
  }
  const phases = [];
  for (let s = 0; s < strands; s++) phases.push(s === 0 ? 0 : s * phase2);

  if (tubes) {
    for (const ph of phases) {
      const pts = [];
      const N = 120;
      for (let i = 0; i <= N; i++) pts.push(strandPoint(i / N, ph));
      /* 变宽放样：核苷酸节距处「珠粒」微隆 + fbm 肌理，主链呈磷酸-糖交替的串珠观感 */
      const beads = Math.max(4, Math.round(height / rise));
      const tube = loftTube(pts, (u) => {
        const bead = Math.pow(0.5 + 0.5 * Math.cos(u * beads * TAU), 2.6);
        return 0.048 + bead * 0.03 + fbm3(u * 36, ph * 5.3, 1.7, 5) * 0.004;
      }, { segs: 200, radial: 10, mat: strandMat });
      g.add(tube);
    }
  }
  if (bps && strands >= 2) {
    for (let i = 0; i < bpCount; i++) {
      const t = (i + 0.5) / bpCount;
      const p1 = strandPoint(t, phases[0]);
      const p2 = strandPoint(t, phases[1]);
      const len = p1.distanceTo(p2);
      const c = mesh(new THREE.CylinderGeometry(0.035, 0.035, len - baseLen * 0.4, 8), bpMat);
      c.position.copy(p1).add(p2).multiplyScalar(0.5);
      c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), p2.clone().sub(p1).normalize());
      g.add(c);
    }
  }
  g.userData.sampleAtoms = () => {
    // 仅取骨架链采样点：X 形交叉来自螺旋主链（碱基对横档会把层线糊成全宽条带）
    const atoms = [];
    for (const ph of phases) for (let i = 0; i <= 60; i++) atoms.push(strandPoint(i / 60, ph));
    return atoms;
  };
  return g;
}

/* 衍射强度 → 灰度画布（|Σe^{i q·r}|²，对数标尺） */
function computeDiffraction(canvas, atoms, qxMax = 0.85, qyMax = 1.2, size = 0) {
  const N = size || canvas.width;
  if (canvas.width !== N) { canvas.width = canvas.height = N; }
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(N, N);
  const data = img.data;
  const buf = new Float64Array(N * N);
  let maxV = 1e-9;
  for (let py = 0; py < N; py++) {
    const qy = qyMax * (py / (N - 1) - 0.5) * 2;
    for (let px = 0; px < N; px++) {
      const qx = qxMax * (px / (N - 1) - 0.5) * 2;
      let re = 0, im = 0;
      for (let k = 0; k < atoms.length; k++) {
        const a = atoms[k];
        const ang = TAU * (qx * a.x + qy * a.y);   // q 单位为 cycles/nm，相位需带 2π
        re += Math.cos(ang);
        im += Math.sin(ang);
      }
      const v = (re * re + im * im) / atoms.length;
      buf[py * N + px] = v;
      if (v > maxV) maxV = v;
    }
  }
  for (let i = 0; i < N * N; i++) {
    const norm = buf[i] / maxV;
    const v = Math.pow(Math.log1p(norm * 15) / Math.log(16), 0.85);
    const g = Math.round(255 - v * 252);           // 底片：暗场白点 → 反相成 X 光底片风格
    data[i * 4] = 16 + (255 - g) * 0.96;
    data[i * 4 + 1] = 18 + (255 - g) * 0.97;
    data[i * 4 + 2] = 24 + (255 - g) * 0.98;
    data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  // 中心准直光斑遮盖（直射束）
  ctx.save();
  ctx.globalAlpha = 0.92;
  ctx.fillStyle = '#10131a';
  ctx.beginPath();
  ctx.arc(N / 2, N / 2, N * 0.045, 0, TAU);
  ctx.fill();
  ctx.restore();
}

/* ================= 章节 1：照片 51 号 ================= */

let helix1 = null;
const photo = { pitch: 3.4, radius: 1.0, strands: 2, spin: true, dirty: true, lastCalc: 0, refReady: false };

const filmCv = document.createElement('canvas');
filmCv.width = filmCv.height = 144;
const filmTex = new THREE.CanvasTexture(filmCv);
filmTex.colorSpace = THREE.SRGBColorSpace;
const filmMat = new THREE.MeshBasicMaterial({ map: filmTex });
const film = mesh(new THREE.PlaneGeometry(3.2, 3.2), filmMat);
film.position.set(4.3, 2.2, 0);
gPhoto.add(film);
const filmBorder = mesh(new THREE.BoxGeometry(3.5, 3.5, 0.06), M(0x2c3442, 0.7));
filmBorder.position.set(4.3, 2.2, -0.04);
gPhoto.add(filmBorder);
const filmLbl = label('计算衍射图样', '#cfdcee', 0.005);
filmLbl.position.set(4.3, 0.26, 0);
gPhoto.add(filmLbl);

const refCv = document.createElement('canvas');
refCv.width = refCv.height = 144;
const refTex = new THREE.CanvasTexture(refCv);
refTex.colorSpace = THREE.SRGBColorSpace;
const refFilm = mesh(new THREE.PlaneGeometry(3.2, 3.2), new THREE.MeshBasicMaterial({ map: refTex }));
refFilm.position.set(-4.3, 2.2, 0);
gPhoto.add(refFilm);
const refBorder = mesh(new THREE.BoxGeometry(3.5, 3.5, 0.06), M(0x2c3442, 0.7));
refBorder.position.set(-4.3, 2.2, -0.04);
gPhoto.add(refBorder);
const refLbl = label('照片 51 号（示意）', '#ffd166', 0.005);
refLbl.position.set(-4.3, 0.26, 0);
gPhoto.add(refLbl);
const photoTitle = label('B 型 DNA：螺距 3.4 nm · 半径 1.0 nm · 双链', '#9adfff', 0.0048);
photoTitle.position.set(0, -1.2, 0);
gPhoto.add(photoTitle);

function rebuildHelix1() {
  if (helix1) { gPhoto.remove(helix1); helix1.traverse((o) => { if (o.geometry) o.geometry.dispose(); }); }
  helix1 = buildHelix({ pitch: photo.pitch, radius: photo.radius, height: 6, strands: photo.strands });
  helix1.position.x = 0;
  gPhoto.add(helix1);
  photo.dirty = true;
}

function calcRef51() {
  const refAtoms = buildHelix({ pitch: 3.4, radius: 1.0, height: 7, strands: 2 }).userData.sampleAtoms();
  computeDiffraction(refCv, refAtoms);
  refTex.needsUpdate = true;
  photo.refReady = true;
}

/* ================= 章节 2：动手搭 DNA 模型 ================= */

/* 单个脱氧核苷酸：磷酸（橙）+ 两个氧 + 脱氧核糖五元环 + 糖苷键烘为一件顶点色网格，
   含氮碱基用倒角板件独立成形（嘌呤双环宽、嘧啶单环窄）+ 字母浮牌。 */
function makeNucleotide(base) {
  const g = new THREE.Group();
  const parts = [];
  /* 磷酸基团：中心磷球 + 两侧氧原子 */
  parts.push({ geo: new THREE.SphereGeometry(0.17, 14, 10).translate(0, 0.34, 0), color: 0xffb054 });
  parts.push({ geo: new THREE.SphereGeometry(0.09, 10, 8).translate(0.15, 0.46, 0.05), color: 0xe05252 });
  parts.push({ geo: new THREE.SphereGeometry(0.09, 10, 8).translate(-0.13, 0.44, -0.05), color: 0xe05252 });
  /* 脱氧核糖（五元环）：糖原子与环内 C-O 键 */
  const ribPts = [];
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * TAU - TAU / 2;
    ribPts.push(new THREE.Vector3(Math.cos(a) * 0.17, Math.sin(a) * 0.17 + 0.02, 0));
  }
  for (const rp of ribPts) {
    parts.push({ geo: new THREE.SphereGeometry(0.075, 10, 8).translate(rp.x, rp.y, rp.z), color: 0x8fb6d8 });
  }
  for (let i = 0; i < 5; i++) {
    parts.push({ geo: bondGeoBetween(ribPts[i], ribPts[(i + 1) % 5], 0.026), color: 0xaeb9c8 });
  }
  /* 糖苷键：从糖环接向碱基板内缘 */
  parts.push({ geo: bondGeoBetween(new THREE.Vector3(0.08, 0.08, 0), new THREE.Vector3(0.42, 0.3, 0), 0.026), color: 0xaeb9c8 });
  g.add(bakePartsToMesh(parts));
  const w = PLATE_W[base] * 0.76;
  const plate = mesh(plateGeo(w, 0.32, 0.1, 0.04), plateMats[base]);
  plate.position.set(0.42 + w / 2, 0.3, 0);
  g.add(plate);
  const ch = label(base, '#' + new THREE.Color(BASE_COLORS[base]).getHexString(), 0.0042);
  ch.position.set(0.42 + w / 2, 0.3, 0.14);
  g.add(ch);
  return g;
}

const TEMPLATE_SEQ = ['A', 'G', 'T', 'C', 'A'];
const buildState = { step: 0, paired: 0, wrongFlash: 0, twisted: 0, twistTarget: 0, done: false, spinAll: true };
const buildParts = { template: [], incoming: [], hb: [], bps: [], ladder: null, axis: null, hint: null };

function initBuild() {
  if (buildParts.ladder) return;
  const ladder = new THREE.Group();
  ladder.position.set(-0.32, 0.55, 0);
  gBuild.add(ladder);
  buildParts.ladder = ladder;
  /* 台面接触阴影：梯子落位在实验台上方，投影贴着桌面 */
  const benchSh = contactShadow(3.1, 1.6, 0.42, -3.662);
  benchSh.position.x = 1.15;
  gBuild.add(benchSh);
  // 每对碱基一个支点组（绕中轴扭转）
  TEMPLATE_SEQ.forEach((b, i) => {
    const pivot = new THREE.Group();
    pivot.position.set(0, 3.6 - i * 0.95, 0);
    const tpl = makeNucleotide(b);
    tpl.position.set(-0.58, 0, 0);
    pivot.add(tpl);
    const inc = makeNucleotide(COMPLEMENT[b]);
    inc.rotation.y = Math.PI;                    // 反向平行（镜像）
    inc.position.set(2.9, -3.2, 0);              // 等候区（局部坐标）
    inc.visible = false;
    pivot.add(inc);
    ladder.add(pivot);
    buildParts.template.push(tpl);
    buildParts.incoming.push(inc);
    buildParts.bps.push(pivot);
  });
  buildParts.axis = label('模板链 5′→3′（自上而下）', '#cfdcee', 0.0046);
  buildParts.axis.position.set(-0.32, 4.92, 0);
  gBuild.add(buildParts.axis);
  buildParts.hint = label('从 5′ 端开始：点下方碱基按钮完成互补配对', '#ffd166', 0.0046);
  buildParts.hint.position.set(1.2, 4.92, 0);
  gBuild.add(buildParts.hint);
}

function pairClick(picked) {
  if (buildState.done) return;
  const i = buildState.paired;
  const want = COMPLEMENT[TEMPLATE_SEQ[i]];
  const inc = buildParts.incoming[i];
  if (picked !== want) {
    buildState.wrongFlash = 1;
    setSpriteText(buildParts.hint, `不对哦：与 ${TEMPLATE_SEQ[i]} 配对的是谁？`, { fontSize: 30, color: '#ff9d8a', scale: 0.0046, bg: 'rgba(10,16,24,0.72)' });
    return;
  }
  inc.visible = true;
  inc.userData.from = inc.position.clone();
  inc.userData.to = new THREE.Vector3(0.58, 0, 0);
  inc.userData.animT = 0;
  // 氢键（A-T 2 条，G-C 3 条）
  const n = HBONDS[TEMPLATE_SEQ[i]];
  const dashes = new THREE.Group();
  const dashMat = new THREE.LineDashedMaterial({ color: 0xffe08a, dashSize: 0.07, gapSize: 0.05 });
  for (let k = 0; k < n; k++) {
    const yOff = (k - (n - 1) / 2) * 0.1;
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-0.22, yOff, 0), new THREE.Vector3(0.2, yOff, 0)]),
      dashMat
    );
    line.computeLineDistances();
    dashes.add(line);
  }
  dashes.position.set(0, 0.3, 0);
  dashes.visible = false;
  buildParts.bps[i].add(dashes);
  buildParts.hb.push({ grp: dashes, idx: i });
  buildState.paired++;
  if (buildState.paired >= TEMPLATE_SEQ.length) {
    buildState.done = true;
    setSpriteText(buildParts.hint, '配对完成！拖动「扭转」把梯子拧成右旋双螺旋', { fontSize: 30, color: '#8fe8a2', scale: 0.0046, bg: 'rgba(10,16,24,0.72)' });
  } else {
    setSpriteText(buildParts.hint, `✓ ${TEMPLATE_SEQ[i]}—${want} 配对成功（${n} 个氢键）`, { fontSize: 30, color: '#8fe8a2', scale: 0.0046, bg: 'rgba(10,16,24,0.72)' });
  }
}

function tickBuild(dt) {
  buildState.wrongFlash = Math.max(0, buildState.wrongFlash - dt * 1.6);
  buildParts.incoming.forEach((n) => {
    if (!n.visible || n.userData.animT === undefined) return;
    if (n.userData.animT < 1) {
      n.userData.animT += dt * 1.6;
      const k = clamp(n.userData.animT, 0, 1);
      const e = 1 - Math.pow(1 - k, 3);
      n.position.lerpVectors(n.userData.from, n.userData.to, e);
    }
  });
}

/* ================= 章节 3：DNA 双螺旋的结构 ================= */

const struct = { seq: 'AGTCATGCCTAG', spin: true, spinRate: 0.25, picked: -1, pulse: 0, model: null, lettersOn: true };

const hbGroup = new THREE.Group();
gStruct.add(hbGroup);
let modelRoot = null;
const bpPickables = [];

function buildBModel(seq) {
  if (modelRoot) {
    gStruct.remove(modelRoot);
    modelRoot.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      /* 仅释放板件 clone 出的独立材质；共享工艺材质（骨架/磷酸/氢键线）常驻复用 */
      if (o.isMesh && o.material && o.material.userData && o.material.userData.own) o.material.dispose();
    });
  }
  bpPickables.length = 0;
  modelRoot = new THREE.Group();
  const seqU = (seq || 'AGTC').toUpperCase().replace(/[^ATGC]/g, '') || 'AGTC';
  const n = seqU.length;
  const RADIUS = 1.0, RISE = 0.34, TWIST = 36 * DEG, PHASE2 = 140 * DEG;
  const H = (n - 1) * RISE;
  const strandMat = craftMats.backbone;

  function pt(bpIndex, phase) {
    const y = H / 2 - bpIndex * RISE;
    const a = bpIndex * TWIST + phase;
    return new THREE.Vector3(Math.cos(a) * RADIUS, y, Math.sin(a) * RADIUS);
  }
  // 骨架：变宽放样（核苷酸站点处珠粒微隆），替代等径直管
  for (const phase of [0, PHASE2]) {
    const pts = [];
    for (let i = 0; i < n; i++) pts.push(pt(i, phase));
    pts.push(pt(n - 1 + 0.55, phase));
    modelRoot.add(loftTube(pts, (u) => {
      const bead = Math.pow(0.5 + 0.5 * Math.cos(u * (n - 0.55) * TAU), 3);
      return 0.052 + bead * 0.022 + fbm3(u * 30, phase * 3.7, 2.3, 9) * 0.003;
    }, { segs: Math.max(120, n * 14), radial: 10, mat: strandMat }));
  }
  // 磷酸珠：两条链的核苷酸站点各一粒黄铜珠（实例化，1 个 draw）
  const beads = new THREE.InstancedMesh(new THREE.SphereGeometry(0.085, 10, 8), craftMats.phosphorus, n * 2);
  {
    const tmpM = new THREE.Matrix4();
    let bi = 0;
    for (const phase of [0, PHASE2]) {
      for (let i = 0; i < n; i++) {
        const p = pt(i, phase);
        tmpM.makeTranslation(p.x, p.y, p.z);
        beads.setMatrixAt(bi++, tmpM);
      }
    }
  }
  modelRoot.add(beads);
  // 链末端化学封头：5′ 端磷酸锥 + 3′ 端羟基球
  for (const phase of [0, PHASE2]) {
    const p5 = pt(0, phase);
    const tip = mesh(new THREE.ConeGeometry(0.08, 0.18, 10), craftMats.phosphorus);
    tip.position.copy(p5);
    tip.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), p5.clone().setY(0).normalize());
    const p3 = pt(n - 1 + 0.55, phase);
    const oh = mesh(new THREE.SphereGeometry(0.075, 10, 8), craftMats.sugar);
    oh.position.copy(p3);
    modelRoot.add(tip, oh);
  }
  // 末端标记 5'/3'
  const l5a = label('5′', '#ffd166', 0.0045); l5a.position.copy(pt(0, 0)).multiplyScalar(1.22);
  const l3a = label('3′', '#ffd166', 0.0045); l3a.position.copy(pt(n - 1 + 0.5, 0)).multiplyScalar(1.22);
  const l3b = label('3′', '#9adfff', 0.0045); l3b.position.copy(pt(0, PHASE2)).multiplyScalar(1.22);
  const l5b = label('5′', '#9adfff', 0.0045); l5b.position.copy(pt(n - 1 + 0.5, PHASE2)).multiplyScalar(1.22);
  modelRoot.add(l5a, l3a, l3b, l5b);

  // 碱基对：倒角板件（嘌呤宽/嘧啶窄），板身材质 clone 出独立身份供悬停高亮
  const counts = { A: 0, T: 0, G: 0, C: 0 };
  for (let i = 0; i < n; i++) {
    const b1 = seqU[i], b2 = COMPLEMENT[b1];
    counts[b1]++; counts[b2]++;
    const p1 = pt(i, 0), p2 = pt(i, PHASE2);
    const mid = p1.clone().lerp(p2, 0.5);
    const dir = p2.clone().sub(p1).normalize();
    const halfGap = 0.16;
    const pair = new THREE.Group();
    pair.position.copy(mid);
    pair.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    for (const [base, s] of [[b1, -1], [b2, 1]]) {
      const w = PLATE_W[base];
      const pm = plateMats[base].clone();
      pm.userData.own = true;
      const plate = mesh(plateGeo(w, 0.3, 0.1, 0.045), pm);
      plate.position.x = s * (halfGap + w / 2);
      plate.name = 'baseplate';
      plate.userData = { bp: i, base };
      pair.add(plate);
      bpPickables.push(plate);
      const ch = label(base, '#' + new THREE.Color(BASE_COLORS[base]).getHexString(), 0.0038);
      ch.position.set(s * (halfGap + w / 2), 0, 0.16);
      ch.name = 'letter';
      pair.add(ch);
    }
    // 氢键短横线：一对并成一条 LineSegments（2~3 段一次画完，共享线材质）
    const hbn = HBONDS[b1];
    const dashPts = [];
    for (let k = 0; k < hbn; k++) {
      const yOff = (k - (hbn - 1) / 2) * 0.085;
      dashPts.push(new THREE.Vector3(-halfGap, yOff, 0), new THREE.Vector3(halfGap, yOff, 0));
    }
    const dashes = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(dashPts), dashMat);
    dashes.computeLineDistances();
    pair.add(dashes);
    modelRoot.add(pair);
  }
  // 沟标注
  const gMaj = label('大沟', '#9adfff', 0.0045);
  gMaj.position.set(RADIUS * 1.9, H * 0.18, RADIUS * 0.6);
  const gMin = label('小沟', '#cfdcee', 0.004);
  gMin.position.set(-RADIUS * 0.2, -H * 0.3, RADIUS * 1.75);
  modelRoot.add(gMaj, gMin);

  gStruct.add(modelRoot);
  struct.counts = counts;
  struct.seqUsed = seqU;
  struct.hbTotal = n;
  applyLetters(struct.lettersOn);
  return seqU;
}

function applyLetters(on) {
  if (!modelRoot) return;
  modelRoot.traverse((o) => { if (o.name === 'letter') o.visible = on; });
}

function updateChargaffHud() {
  const c = struct.counts || { A: 0, T: 0, G: 0, C: 0 };
  const okAT = c.A === c.T, okGC = c.G === c.C;
  const pur = c.A + c.G, pyr = c.T + c.C;
  hud.set('a', `A ${c.A} · T ${c.T} · G ${c.G} · C ${c.C}`);
  hud.set('b', `A=T ${okAT ? '✓' : '✗'} · G=C ${okGC ? '✓' : '✗'} · 嘌呤 ${pur} = 嘧啶 ${pyr} ${pur === pyr ? '✓' : '✗'}`);
  hud.set('c', struct.picked >= 0 ? `选中第 ${struct.picked + 1} 对碱基` : '点击碱基对查看氢键');
}

// 射线拾取
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let downXY = null;
app.dom.addEventListener('pointerdown', (e) => { downXY = [e.clientX, e.clientY]; });
app.dom.addEventListener('pointerup', (e) => {
  if (!downXY) return;
  const dx = e.clientX - downXY[0], dy = e.clientY - downXY[1];
  downXY = null;
  if (dx * dx + dy * dy > 25) return;             // 拖拽不算点击
  if (activeSectionId !== 'structure') return;
  const r = app.dom.getBoundingClientRect();
  pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(bpPickables, false);
  if (hits.length) {
    const { bp, base } = hits[0].object.userData;
    struct.picked = bp;
    struct.pulse = 1;
    updateChargaffHud();
  }
});

/* 悬停联动：结构章指针掠过碱基对 → 板件即时提亮 + 浮动提示牌跟随（氢键数一眼可读） */
const tipSprite = label('', '#ffe9b0', 0.0042);
tipSprite.visible = false;
let hoveredPlate = null;
function setHover(plate) {
  if (hoveredPlate === plate) return;
  if (hoveredPlate && hoveredPlate.material.userData.own) {
    hoveredPlate.material.emissive.setHex(0x000000);
    hoveredPlate.material.emissiveIntensity = 1;
  }
  hoveredPlate = plate;
  if (plate && activeSectionId === 'structure') {
    plate.material.emissive.setHex(0xf2f6ff);
    plate.material.emissiveIntensity = 0.3;
    const { base } = plate.userData;
    setSpriteText(tipSprite, `${base}—${COMPLEMENT[base]} · ${HBONDS[base]} 个氢键`, { fontSize: 30, color: '#ffe9b0', scale: 0.0042, bg: 'rgba(10,16,24,0.78)' });
    /* 提示牌挂到碱基对组上：模型自转时跟着转，不脱锚 */
    plate.parent.add(tipSprite);
    tipSprite.position.set(0, 0.62, 0);
    tipSprite.visible = true;
    app.dom.style.cursor = 'pointer';
  } else {
    tipSprite.visible = false;
    app.dom.style.cursor = '';
  }
}
app.dom.addEventListener('pointermove', (e) => {
  if (activeSectionId !== 'structure' || !modelRoot) { setHover(null); return; }
  const r = app.dom.getBoundingClientRect();
  pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(bpPickables, false);
  setHover(hits.length ? hits[0].object : null);
});

function tickStruct(dt, t) {
  if (modelRoot && struct.spin) modelRoot.rotation.y = t * struct.spinRate;
  if (struct.pulse > 0 && modelRoot) {
    struct.pulse = Math.max(0, struct.pulse - dt * 1.4);
    const k = 1 + 0.35 * Math.sin(struct.pulse * Math.PI);
    modelRoot.traverse((o) => {
      if (o.name === 'baseplate' && o.userData.bp === struct.picked) o.scale.setScalar(k);
    });
  }
}

/* ---------------- 章节定义 ---------------- */

const ctl = createControlsPanel(document.getElementById('controls'));
let activeSectionId = null;
let activeQuizCleanup = null;

const hud = makeHUD(document.getElementById('lcData'), [['a', '读数'], ['b', '校验'], ['c', '提示']]);
hud.visibleNow = false;

const SEQ_NOTE = '默认序列 AGTCATGCCTAG';

const SECTIONS = [
  {
    id: 'photo51',
    title: '照片 51 号',
    html: `<p>1952 年，<b>罗莎琳德·富兰克林</b>拍下了 DNA 的 X 射线衍射照片——著名的<b>「照片 51 号」</b>。图样呈清晰的 <span class="hl">X 形交叉</span>，透露出两个关键信息：<b>DNA 是螺旋结构</b>（交叉衍射是螺旋的标志），并且能直接读出<b>螺距</b>与<b>直径</b>。</p>
<p>沃森和克里克正是依据这张照片（以及碱基配对的化学数据）提出了双螺旋模型。</p>
<p>动手：右侧是按当前参数<b>实时计算的衍射图样</b>。调节螺距、半径与链数，让它与左侧的照片 51 号吻合——试试单链或三链，看 X 形交叉是否还成立。</p>`,
    enter() {
      showGroup(gPhoto);
      hud.visibleNow = true;
      app.setCamera([0.4, 2.6, 10.6], [0, 2.0, 0]);
      photo.spin = true;
      if (!photo.refReady) calcRef51();
      ctl.clear();
      ctl.slider({
        label: '螺距（nm/圈）', min: 2.0, max: 5.0, step: 0.05, value: photo.pitch,
        fmt: (v) => v.toFixed(2),
        onInput: (v) => { photo.pitch = v; rebuildHelix1(); },
      });
      ctl.slider({
        label: '螺旋半径（nm）', min: 0.5, max: 1.8, step: 0.02, value: photo.radius,
        fmt: (v) => v.toFixed(2),
        onInput: (v) => { photo.radius = v; rebuildHelix1(); },
      });
      ctl.seg({
        options: [{ label: '单链', value: 1 }, { label: '双链', value: 2 }, { label: '三链', value: 3 }],
        value: photo.strands,
        onChange: (v) => { photo.strands = v; rebuildHelix1(); },
      });
      photo.updateHud = () => {
        const match = Math.abs(photo.pitch - 3.4) < 0.12 && Math.abs(photo.radius - 1.0) < 0.09 && photo.strands === 2;
        hud.set('a', `螺距 ${photo.pitch.toFixed(2)} · 半径 ${photo.radius.toFixed(2)} · ${photo.strands} 链`);
        hud.set('b', `每圈约 ${Math.max(1, Math.round(photo.pitch / 0.34))} 个碱基`);
        hud.set('c', match ? '✓ 与照片 51 号吻合！' : '调整参数，使右图与左图一致');
      };
    },
  },
  {
    id: 'assemble',
    title: '动手搭 DNA 模型',
    html: `<p>一个 <b>脱氧核苷酸</b> = <span class="hl">磷酸</span>（橙）＋ <span class="hl">脱氧核糖</span>（蓝色五边形）＋ <span class="hl">含氮碱基</span>（字母板）。</p>
<p>左侧是模板链（5′→3′）。碱基互补配对规则：<b>A—T</b>（2 个氢键）、<b>G—C</b>（3 个氢键）。按顺序点下方按钮，把互补的核苷酸一个个接上去，DNA 的两条链<b>反向平行</b>（新链是镜像）。</p>
<p>配对完成后，拖动「扭转」滑杆——直梯子拧成<span class="hl">右手双螺旋</span>。</p>`,
    enter() {
      showGroup(gBuild);
      hud.visibleNow = true;
      initBuild();
      app.setCamera([0.3, 2.2, 8.8], [0, 1.85, 0]);
      ctl.clear();
      ['A', 'T', 'G', 'C'].forEach((b) => {
        ctl.button({
          label: '接入 ' + b,
          active: true,
          onClick: () => pairClick(b),
        });
      });
      ctl.sep();
      ctl.slider({
        label: '扭转成螺旋', min: 0, max: 1, step: 0.01, value: 0,
        fmt: (v) => Math.round(v * 100) + '%',
        onInput: (v) => { buildState.twistTarget = v; },
      });
      ctl.toggle({
        label: '自转', value: true,
        onChange: (v) => { buildState.spinAll = v; },
      });
      buildState.updateHud = () => {
        hud.set('a', `已配对 ${buildState.paired} / ${TEMPLATE_SEQ.length}`);
        const hbTotal = buildParts.hb.reduce((s, e) => s + HBONDS[TEMPLATE_SEQ[e.idx]], 0);
        hud.set('b', `氢键共 ${hbTotal} 个`);
        hud.set('c', buildState.done ? '梯子完成，试试扭转' : 'A—T · G—C');
      };
    },
  },
  {
    id: 'structure',
    title: 'DNA 双螺旋的结构',
    html: `<p>沃森、克里克模型（B 型 DNA）要点：① <b>双链反向平行</b>（一条 5′→3′，另一条 3′→5′）；② <b>右手双螺旋</b>，螺距 3.4 nm，每圈 10 对碱基，直径 2 nm；③ 碱基对平面叠在螺旋内部，<b>A=T（2 氢键）、G≡C（3 氢键）</b>；④ 螺旋表面有<b>大沟与小沟</b>。</p>
<p><b>碱基计算器</b>：改写下方输入框生成任意序列的原子级模型，右栏读数即时核对<span class="hl">查哥夫规则</span>（A=T、G=C、嘌呤总数 = 嘧啶总数）。</p>
<p><b>点击任一碱基</b>，看高亮与氢键数量提示。</p>`,
    enter() {
      showGroup(gStruct);
      hud.visibleNow = true;
      buildBModel(struct.seq);
      struct.picked = -1;
      app.setCamera([5.4, 1.8, 8.6], [0, 0.1, 0]);
      ctl.clear();
      const seqWrap = document.createElement('div');
      seqWrap.className = 'ctl';
      seqWrap.appendChild(Object.assign(document.createElement('label'), { textContent: '序列（A/T/G/C）' }));
      const input = document.createElement('input');
      input.type = 'text';
      input.value = struct.seq;
      input.maxLength = 24;
      input.style.cssText = 'width:130px;background:var(--chip-bg,rgba(128,148,178,.15));border:1px solid rgba(128,148,178,.4);border-radius:8px;color:var(--text);padding:4px 8px;font:inherit;font-size:13px';
      input.addEventListener('change', () => {
        const cleaned = input.value.toUpperCase().replace(/[^ATGC]/g, '').slice(0, 24);
        if (cleaned.length >= 2) {
          struct.seq = cleaned;
          buildBModel(cleaned);
          struct.picked = -1;
          updateChargaffHud();
        } else {
          input.value = struct.seqUsed || struct.seq;
        }
      });
      seqWrap.appendChild(input);
      ctl.el.appendChild(seqWrap);
      ctl.sep();
      ctl.toggle({
        label: '自转', value: true,
        onChange: (v) => { struct.spin = v; },
      });
      ctl.toggle({
        label: '碱基字母', value: true,
        onChange: (v) => { struct.lettersOn = v; applyLetters(v); },
      });
      updateChargaffHud();
    },
  },
  {
    id: 'quiz',
    title: '随堂检测',
    html: `<p>5 道选择题，检验一下本节课的掌握情况。答完可重新开始。</p>`,
    enter() {
      showGroup(gStruct);
      if (!modelRoot) buildBModel(struct.seq);
      struct.spin = true;
      app.setCamera([4.2, 1.5, 7.4], [0, 0.1, 0]);
      ctl.clear();
      hud.visibleNow = false;
      showQuiz();
    },
  },
];

/* ---------------- 随堂检测 ---------------- */

const QUIZ = [
  {
    q: 'DNA 双链之间碱基互补配对的正确方式是？',
    opts: ['A—G、T—C', 'A—T、G—C', 'A—C、G—T', 'A—U、G—C'],
    a: 1,
    ex: '互补配对专一：A 与 T 配对（2 个氢键），G 与 C 配对（3 个氢键）。U 是 RNA 的碱基。',
  },
  {
    q: '一条 DNA 单链的序列是 AATCG，其互补链是？',
    opts: ['TTAGC', 'UUAGC', 'AATCG', 'CGATT'],
    a: 0,
    ex: '逐个取互补：A→T、A→T、T→A、C→G、G→C，得 TTAGC。注意方向相反（反向平行）。',
  },
  {
    q: '双链 DNA 分子中，若 A 占全部碱基的 20%，则 G 占？',
    opts: ['20%', '30%', '40%', '10%'],
    a: 1,
    ex: 'A=T=20%，共 40%；剩下 G+C=60%，由 G=C 得 G=30%。',
  },
  {
    q: 'A 与 T 之间、G 与 C 之间的氢键数目分别是？',
    opts: ['2 和 2', '2 和 3', '3 和 2', '3 和 3'],
    a: 1,
    ex: 'A=T 之间 2 个氢键，G≡C 之间 3 个氢键——这也是高温下 G、C 含量高的 DNA 更稳定的原因。',
  },
  {
    q: '沃森和克里克建立 DNA 双螺旋模型的关键实验依据是？',
    opts: ['孟德尔的豌豆杂交实验', '富兰克林的 X 射线衍射照片（照片 51 号）', '摩尔根的果蝇实验', '达尔文的自然选择学说'],
    a: 1,
    ex: '照片 51 号的 X 形衍射图样直接给出了螺旋的螺距与直径，是双螺旋模型最关键的证据之一。',
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
  activeQuizCleanup = () => panel.remove();
}

/* ---------------- 主循环 ---------------- */

app.onFrame((dt, t) => {
  /* 相机缓动由 attachVFX 接管（tickCamera 在渲染钩子内） */
  hud.el.style.display = hud.visibleNow ? '' : 'none';
  /* 读数隐藏时（quiz 章等）数据手风琴块一并收走 */
  accSecs.data.classList.toggle('acc-empty', !hud.visibleNow);
  if (activeSectionId === 'photo51') {
    if (helix1 && photo.spin) helix1.rotation.y = t * 0.4;
    if (photo.dirty && t - photo.lastCalc > 0.22) {
      photo.lastCalc = t;
      photo.dirty = false;
      const atoms = helix1.userData.sampleAtoms();
      computeDiffraction(filmCv, atoms);
      filmTex.needsUpdate = true;
    }
    if (photo.updateHud) photo.updateHud();
  } else if (activeSectionId === 'assemble') {
    // 每对碱基绕中轴扭转 → 右手螺旋；梯子整体缓转
    const twist = buildState.twistTarget;
    buildState.twisted += (twist - buildState.twisted) * Math.min(1, dt * 4);
    buildParts.bps.forEach((pivot, i) => {
      pivot.rotation.y = buildState.twisted * -i * 0.62;
    });
    buildParts.ladder.rotation.y = buildState.spinAll ? t * 0.3 : 0;
    tickBuild(dt);
    if (buildState.updateHud) buildState.updateHud();
  } else if (activeSectionId === 'structure' || activeSectionId === 'quiz') {
    tickStruct(dt, t);
    if (activeSectionId === 'structure' && hud.visibleNow) updateChargaffHud();
  }
});

/* ================= 三栏布局驱动（左栏章节列表 / 右栏详解联动 / 栏折叠 / 专注模式） ================= */

const chapNav = document.getElementById('chapNav');
const chapCount = document.getElementById('chapCount');
const detailNo = document.getElementById('detailNo');
const detailTitle = document.getElementById('detailTitle');
const lessonEl = document.getElementById('lesson');
const detailBody = document.getElementById('detailBody');
const controlsEl = document.getElementById('controls');
const dnaShell = document.getElementById('dnaShell');
let chapterIdx = 0;

/* 章节竖排按钮：序号 + 标题，点击切章，当前章 .on 高亮 */
const chapBtns = SECTIONS.map((s, i) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'chap-btn';
  b.dataset.idx = String(i);
  const n = document.createElement('span');
  n.className = 'chap-n';
  n.textContent = String(i + 1).padStart(2, '0');
  const t = document.createElement('span');
  t.className = 'chap-t';
  t.textContent = s.title;
  b.append(n, t);
  b.addEventListener('click', () => selectChapter(i));
  chapNav.appendChild(b);
  return b;
});

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
  chapCount.textContent = `${String(chapterIdx + 1).padStart(2, '0')}/${SECTIONS.length}`;
  detailNo.textContent = String(chapterIdx + 1).padStart(2, '0');
  detailTitle.textContent = sec.title;
  /* 折叠竖条上的章节信息同步（左栏序号 / 右栏竖排标题） */
  railNoL.textContent = String(chapterIdx + 1).padStart(2, '0');
  railTitleR.textContent = sec.title;
  lessonEl.innerHTML = sec.html || '';
  if (activeQuizCleanup) { activeQuizCleanup(); activeQuizCleanup = null; }
  activeSectionId = sec.id;
  if (sec.id !== 'structure') setHover(null);
  sec.enter();
  /* 本章无控件时整块手风琴收走（不动用户的手风琴偏好；数据块由帧循环按读数显隐同步） */
  accSecs.controls.classList.toggle('acc-empty', !controlsEl.children.length);
  detailBody.scrollTop = 0;
}

/* ---------------- 栏折叠（左右独立 28px 竖条）× 专注模式（双栏同折）统一管理 ---------------- */

const foldLBtn = document.getElementById('foldLBtn');
const unfoldLBtn = document.getElementById('unfoldLBtn');
const foldRBtn = document.getElementById('foldRBtn');
const unfoldRBtn = document.getElementById('unfoldRBtn');
const railNoL = document.getElementById('railNoL');
const railTitleR = document.getElementById('railTitleR');
const focusBtn = document.getElementById('focusBtn');

const FOLD_KEY = { l: 'dna.foldL', r: 'dna.foldR' };
let foldL = false;
let foldR = false;
let focusSaved = null; /* 进入专注模式前的独立折叠状态 [foldL, foldR]，退出时恢复 */

try {
  foldL = localStorage.getItem(FOLD_KEY.l) === '1';
  foldR = localStorage.getItem(FOLD_KEY.r) === '1';
} catch (e) { /* localStorage 不可用（隐私模式等）时仅本次会话内生效 */ }

function applyFold() {
  dnaShell.classList.toggle('fold-l', foldL);
  dnaShell.classList.toggle('fold-r', foldR);
  for (const [btn, folded] of [[foldLBtn, foldL], [unfoldLBtn, foldL], [foldRBtn, foldR], [unfoldRBtn, foldR]]) {
    btn.setAttribute('aria-expanded', String(!folded));
  }
}

/* 专注模式：双栏同时折叠；退出恢复进入前状态（不写 localStorage，保持独立折叠记忆不变） */
function setFocus(on) {
  if (on && focusSaved === null) {
    focusSaved = [foldL, foldR];
    foldL = true;
    foldR = true;
  } else if (!on && focusSaved !== null) {
    [foldL, foldR] = focusSaved;
    focusSaved = null;
  }
  dnaShell.classList.toggle('focus-mode', on);
  focusBtn.textContent = on ? '退出专注' : '专注模式';
  focusBtn.setAttribute('aria-pressed', String(on));
  applyFold();
}

function toggleFold(side) {
  if (focusSaved !== null) setFocus(false);
  if (side === 'l') foldL = !foldL;
  else foldR = !foldR;
  try {
    localStorage.setItem(FOLD_KEY[side], (side === 'l' ? foldL : foldR) ? '1' : '0');
  } catch (e) { /* 忽略持久化失败 */ }
  applyFold();
}

foldLBtn.addEventListener('click', () => toggleFold('l'));
unfoldLBtn.addEventListener('click', () => toggleFold('l'));
foldRBtn.addEventListener('click', () => toggleFold('r'));
unfoldRBtn.addEventListener('click', () => toggleFold('r'));
focusBtn.addEventListener('click', () => setFocus(focusSaved === null));
applyFold();

/* ---------------- 右栏三块手风琴（详解 / 控件 / 读数），localStorage 记忆、切章不重置 ---------------- */

const ACC_KEYS = { lesson: 'dna.accLesson', controls: 'dna.accControls', data: 'dna.accData' };
const accSecs = {
  lesson: document.getElementById('accLesson'),
  controls: document.getElementById('accControls'),
  data: document.getElementById('accData'),
};

const NARROW_VIEW = window.innerWidth <= 1100;   /* 小屏首访清爽态判据 */
const accClosed = {};
for (const name of Object.keys(accSecs)) {
  let saved = null;
  try { saved = localStorage.getItem(ACC_KEYS[name]); } catch (e) { /* 忽略 */ }
  /* 首访（无记忆）：≤1100px 默认收起数据读数；此后记忆优先，不随视口变 */
  accClosed[name] = saved !== null ? saved === '1' : (name === 'data' && NARROW_VIEW);
}
function applyAcc(name) {
  const sec = accSecs[name];
  sec.classList.toggle('closed', accClosed[name]);
  sec.querySelector('.acc-head').setAttribute('aria-expanded', String(!accClosed[name]));
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

/* ---------------- 启动 ---------------- */

loader.setText('正在生成 B 型双螺旋…');
rebuildHelix1();
buildBModel(struct.seq);
loader.hide();

window.__eduSections = { select: selectChapter };
/* 调试句柄（自动化验收/像素级自查用） */
window.__dnaDebug = { vfx, app, photo, buildState, struct, hover: () => hoveredPlate };

selectChapter(0);
