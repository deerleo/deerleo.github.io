/* EduLab · DNA 的结构（dna）
 * 章节：照片 51 号 / 动手搭 DNA 模型 / DNA 双螺旋的结构 / 随堂检测
 * 场景：X 射线衍射图样实时计算（螺距/半径/链数可调，对照照片 51 号）、
 *       脱氧核苷酸组装与互补配对、按序列生成的 B 型双螺旋（点碱基对看氢键、查哥夫规则计算器）。
 */
import {
  THREE, DEG, TAU, clamp,
  createApp, cameraTweenTick, makeLoader,
  createSections, createControlsPanel, makeHUD, makeTextSprite, setSpriteText,
} from './edu-core.js';

/* ---------------- 基础 ---------------- */

const stage = document.getElementById('stage');
const loader = makeLoader(stage, '正在生成双螺旋模型…');
const app = createApp({
  container: stage,
  fov: 42, near: 0.1, far: 200,
  cameraPos: [0, 1.6, 8.2], target: [0, 1.4, 0],
  minDistance: 1.2, maxDistance: 40,
});
const { scene, camera, controls } = app;

scene.add(new THREE.AmbientLight(0xe6ecf5, 1.15));
const key = new THREE.DirectionalLight(0xfff2e0, 1.7);
key.position.set(5, 8, 6);
scene.add(key);
const rim = new THREE.DirectionalLight(0xbcd4ff, 0.5);
rim.position.set(-6, 2, -5);
scene.add(rim);

const M = (color, rough = 0.7, metal = 0, extra = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, ...extra });
const mesh = (geo, mat) => new THREE.Mesh(geo, mat);

function label(text, color = '#ffffff', scale = 0.0055, bg = 'rgba(10,16,24,0.72)') {
  return makeTextSprite(text, { fontSize: 32, color, scale, bg });
}

const BASE_COLORS = { A: 0x59d999, T: 0xe05252, G: 0xffb054, C: 0x6f9de0 };
const COMPLEMENT = { A: 'T', T: 'A', G: 'C', C: 'G' };
const HBONDS = { A: 2, T: 2, G: 3, C: 3 };   // 与互补碱基之间的氢键数（A=T 2，G≡C 3）

const gPhoto = new THREE.Group();
const gBuild = new THREE.Group();
const gStruct = new THREE.Group();
scene.add(gPhoto, gBuild, gStruct);
const GROUPS = [gPhoto, gBuild, gStruct];
function showGroup(g) { GROUPS.forEach((x) => { x.visible = x === g; }); }

/* 螺旋生成器：骨架管 + 碱基对横档 */
function buildHelix({ pitch = 3.4, radius = 1.0, rise = 0.34, height = 6, strands = 2, tubes = true, bps = true, baseLen = 0.86, phase2 = 0.4 }) {
  const g = new THREE.Group();
  const bpCount = Math.max(2, Math.round(height / rise));
  const turns = pitch / rise;
  const strandMat = M(0x8a94a8, 0.4, 0.25);
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
      const tube = new THREE.Mesh(
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 200, 0.055, 8),
        strandMat
      );
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

const pentMat = M(0x6f9de0, 0.5);
const phosMat = M(0xffb054, 0.45);
const bondGray = M(0xaeb9c8, 0.55);

/* 单个脱氧核苷酸：磷酸（橙）+ 脱氧核糖（蓝五边形）+ 含氮碱基（字母板） */
function makeNucleotide(base) {
  const g = new THREE.Group();
  // 磷酸
  const p = mesh(new THREE.SphereGeometry(0.17, 14, 10), phosMat);
  p.position.set(0, 0.34, 0);
  const o1 = mesh(new THREE.SphereGeometry(0.09, 10, 8), M(0xe05252, 0.5));
  o1.position.set(0.15, 0.46, 0.05);
  const o2 = o1.clone(); o2.position.set(-0.13, 0.44, -0.05);
  g.add(p, o1, o2);
  // 脱氧核糖（五元环）
  const ribPts = [];
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * TAU - TAU / 2;
    ribPts.push(new THREE.Vector3(Math.cos(a) * 0.17, Math.sin(a) * 0.17 + 0.02, 0));
  }
  const ribAtoms = ribPts.map((pt) => {
    const m = mesh(new THREE.SphereGeometry(0.075, 10, 8), pentMat);
    m.position.copy(pt);
    g.add(m);
    return m;
  });
  for (let i = 0; i < 5; i++) {
    const va = ribAtoms[i].position, vb = ribAtoms[(i + 1) % 5].position;
    const c = mesh(new THREE.CylinderGeometry(0.026, 0.026, va.distanceTo(vb), 6), bondGray);
    c.position.copy(va).add(vb).multiplyScalar(0.5);
    c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), vb.clone().sub(va).normalize());
    g.add(c);
  }
  // 糖苷键 + 碱基
  const gly = mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.24, 6), bondGray);
  gly.position.set(0.1, 0.16, 0);
  gly.rotation.z = -TAU / 8;
  g.add(gly);
  const plate = mesh(new THREE.BoxGeometry(0.62, 0.34, 0.09), M(BASE_COLORS[base], 0.45));
  plate.position.set(0.62, 0.3, 0);
  g.add(plate);
  const ch = label(base, '#' + new THREE.Color(BASE_COLORS[base]).getHexString(), 0.0042);
  ch.position.set(0.62, 0.3, 0.14);
  g.add(ch);
  return g;
}

const TEMPLATE_SEQ = ['A', 'G', 'T', 'C', 'A'];
const buildState = { step: 0, paired: 0, wrongFlash: 0, twisted: 0, twistTarget: 0, done: false, spinAll: true };
const buildParts = { template: [], incoming: [], hb: [], bps: [], ladder: null, axis: null, hint: null };

function initBuild() {
  if (buildParts.ladder) return;
  const ladder = new THREE.Group();
  ladder.position.set(-0.32, 0, 0);
  gBuild.add(ladder);
  buildParts.ladder = ladder;
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
  buildParts.axis.position.set(-0.32, 4.35, 0);
  gBuild.add(buildParts.axis);
  buildParts.hint = label('从 5′ 端开始：点下方碱基按钮完成互补配对', '#ffd166', 0.0046);
  buildParts.hint.position.set(1.2, 4.35, 0);
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
      if (o.material && o.material.dispose && o.isMesh) o.material.dispose();
    });
  }
  bpPickables.length = 0;
  modelRoot = new THREE.Group();
  const seqU = (seq || 'AGTC').toUpperCase().replace(/[^ATGC]/g, '') || 'AGTC';
  const n = seqU.length;
  const RADIUS = 1.0, RISE = 0.34, TWIST = 36 * DEG, PHASE2 = 140 * DEG;
  const H = (n - 1) * RISE;
  const strandMat = M(0x8a94a8, 0.38, 0.3);

  function pt(bpIndex, phase) {
    const y = H / 2 - bpIndex * RISE;
    const a = bpIndex * TWIST + phase;
    return new THREE.Vector3(Math.cos(a) * RADIUS, y, Math.sin(a) * RADIUS);
  }
  // 骨架
  for (const phase of [0, PHASE2]) {
    const pts = [];
    for (let i = 0; i < n; i++) pts.push(pt(i, phase));
    pts.push(pt(n - 1 + 0.55, phase));
    modelRoot.add(new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), n * 12, 0.06, 8),
      strandMat
    ));
  }
  // 末端标记 5'/3'
  const l5a = label('5′', '#ffd166', 0.0045); l5a.position.copy(pt(0, 0)).multiplyScalar(1.22);
  const l3a = label('3′', '#ffd166', 0.0045); l3a.position.copy(pt(n - 1 + 0.5, 0)).multiplyScalar(1.22);
  const l3b = label('3′', '#9adfff', 0.0045); l3b.position.copy(pt(0, PHASE2)).multiplyScalar(1.22);
  const l5b = label('5′', '#9adfff', 0.0045); l5b.position.copy(pt(n - 1 + 0.5, PHASE2)).multiplyScalar(1.22);
  modelRoot.add(l5a, l3a, l3b, l5b);

  // 碱基对
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
      const plate = mesh(new THREE.BoxGeometry(0.78, 0.3, 0.1), M(BASE_COLORS[base], 0.42));
      plate.position.x = s * (0.62 + halfGap);
      plate.name = 'baseplate';
      plate.userData = { bp: i, base };
      pair.add(plate);
      bpPickables.push(plate);
      const ch = label(base, '#' + new THREE.Color(BASE_COLORS[base]).getHexString(), 0.0038);
      ch.position.set(s * (0.62 + halfGap), 0, 0.16);
      ch.name = 'letter';
      pair.add(ch);
    }
    // 氢键短横线
    const hbn = HBONDS[b1];
    const dashMat = new THREE.LineDashedMaterial({ color: 0xffe08a, dashSize: 0.05, gapSize: 0.045 });
    for (let k = 0; k < hbn; k++) {
      const yOff = (k - (hbn - 1) / 2) * 0.085;
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-halfGap, yOff, 0), new THREE.Vector3(halfGap, yOff, 0)]),
        dashMat
      );
      line.computeLineDistances();
      pair.add(line);
    }
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

const hud = makeHUD(stage, [['a', '读数'], ['b', '校验'], ['c', '提示']]);
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
<p><b>碱基计算器</b>：改写下方输入框生成任意序列的原子级模型，右侧实时验证<span class="hl">查哥夫规则</span>（A=T、G=C、嘌呤总数 = 嘧啶总数）。</p>
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
  cameraTweenTick(app, dt);
  hud.el.style.display = hud.visibleNow ? '' : 'none';
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

/* ---------------- 启动 ---------------- */

loader.setText('正在生成 B 型双螺旋…');
rebuildHelix1();
buildBModel(struct.seq);
loader.hide();

const sections = createSections({
  nav: document.getElementById('sideNav'),
  descPanel: document.getElementById('descPanel'),
  sections: SECTIONS,
  onSelect(i, sec) {
    if (activeQuizCleanup) { activeQuizCleanup(); activeQuizCleanup = null; }
    activeSectionId = sec.id;
    sec.enter();
  },
});
window.__eduSections = sections;
sections.select(0);
