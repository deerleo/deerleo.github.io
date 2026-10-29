/* EduLab · 地球运动课堂（earth）
 * 章节：总览 / 自转 / 昼夜交替与晨昏线 / 公转 / 直射点移动 / 昼夜长短 / 正午太阳高度 / 四季更替 / 随堂检测
 * 场景：贴图地球（day/night/clouds/normal/specular）+ 太阳，黄赤交角 23.44°，自转公转联动。
 */
import {
  THREE, DEG, TAU, clamp,
  loadTexture, loadAll, createApp, cameraTweenTick, makeLoader,
  createSections, createControlsPanel, makeHUD, makeTextSprite, setSpriteText, makeGlowTexture,
  circleLine, makeStars,
} from './edu-core.js';

/* ---------------- 常量与天文公式 ---------------- */

const TEXDIR = '../assets/textures/earth/';
const EPS = 23.44 * DEG;          // 黄赤交角
const ORBIT_R = 12;               // 公转轨道半径（示意）
const SUN_DIST = 40;              // 近景模式下太阳摆放距离
const OBS_LON = 116.4;            // 北京经度（东经，度）
const YEAR_DAYS = 365;

const DEG_2PI = TAU / 360;
// 一年中的第 N 天（1=1月1日）→ 太阳黄经（地球位置角）
function lambdaE(N) { return TAU * (N - 80) / YEAR_DAYS; }
// 太阳赤纬 δ = asin(sin ε · sin λe)
function declination(N) { return Math.asin(Math.sin(EPS) * Math.sin(lambdaE(N))); }
// 地球在轨道上的位置（黄道面 XZ，+Y 为黄道北）
function orbitPos(N, radius = ORBIT_R) {
  const l = lambdaE(N);
  return new THREE.Vector3(Math.cos(l) * radius, 0, -Math.sin(l) * radius);
}
// 太阳方向（地心指向太阳，世界系）
function sunDirVec(N) { return orbitPos(N, 1).multiplyScalar(-1); }

const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
function dateText(N) {
  let n = clamp(Math.round(N), 1, YEAR_DAYS), m = 0;
  while (n > MONTH_DAYS[m]) { n -= MONTH_DAYS[m]; m++; }
  return `${m + 1}月${n}日`;
}
// 昼长（小时）：cos ω0 = −tanφ·tanδ
function dayLengthHours(latDeg, deltaRad) {
  const x = -Math.tan(latDeg * DEG) * Math.tan(deltaRad);
  if (x <= -1) return 24;
  if (x >= 1) return 0;
  return (2 * Math.acos(x)) / DEG_2PI / 15;
}
function noonAltitude(latDeg, deltaRad) { return 90 - Math.abs(latDeg - deltaRad / DEG); }

/* ---------------- 场景搭建 ---------------- */

const stage = document.getElementById('stage');
const loader = makeLoader(stage, '正在加载地球贴图…');

const app = createApp({
  container: stage,
  fov: 42,
  near: 0.05, far: 3000,
  cameraPos: [0, 1.6, 3.6],
  target: [0, 0, 0],
  minDistance: 1.25,
  maxDistance: 40,
  toneMapping: THREE.NoToneMapping,
});
const { scene, camera, controls } = app;

// —— 太阳系骨架 ——
const sunSys = new THREE.Group();      // 近景模式下移动到 -sunDir*SUN_DIST
scene.add(sunSys);
const sunMesh = new THREE.Mesh(
  new THREE.SphereGeometry(1.6, 32, 16),
  new THREE.MeshBasicMaterial({ color: 0xfff2c8 })
);
const sunGlow = new THREE.Sprite(new THREE.SpriteMaterial({
  map: makeGlowTexture('255,236,180'),
  blending: THREE.AdditiveBlending, depthWrite: false, transparent: true,
}));
sunGlow.scale.set(14, 14, 1);
sunSys.add(sunMesh, sunGlow);
const sunLight = new THREE.DirectionalLight(0xffffff, 2.4);
scene.add(sunLight);
sunLight.target = null; // 每帧指向地球

scene.add(new THREE.AmbientLight(0x334455, 0.5));
scene.add(makeStars(700, 3000));

// —— 地球装配体 ——
const earthPos = new THREE.Group();    // 位置：近景在原点，公转在轨道上
scene.add(earthPos);
const tiltG = new THREE.Group();       // 黄赤交角：+Y → (0, cosε, sinε)
tiltG.rotation.x = EPS;
earthPos.add(tiltG);
const spinG = new THREE.Group();       // 自转
tiltG.add(spinG);

let earthMesh, cloudsMesh, atmoMesh;

const earthUniforms = {
  dayMap: { value: null },
  nightMap: { value: null },
  specMap: { value: null },
  normalMap: { value: null },
  sunDir: { value: new THREE.Vector3(1, 0, 0) },
  nightBrightness: { value: 0.9 },
};

const EARTH_VERT = /* glsl */`
  varying vec3 vN;
  varying vec3 vWorldPos;
  varying vec2 vUv;
  varying vec3 vT;
  varying vec3 vB;
  void main() {
    vUv = uv;
    vN = normalize(mat3(modelMatrix) * normal);
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    vec3 axisW = normalize((modelMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz);
    vT = normalize(cross(axisW, vN));        // 纬线向东
    vB = normalize(cross(vN, vT));           // 经线向北
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const EARTH_FRAG = /* glsl */`
  uniform sampler2D dayMap;
  uniform sampler2D nightMap;
  uniform sampler2D specMap;
  uniform sampler2D normalMap;
  uniform vec3 sunDir;
  uniform float nightBrightness;
  varying vec3 vN;
  varying vec3 vWorldPos;
  varying vec2 vUv;
  varying vec3 vT;
  varying vec3 vB;
  void main() {
    vec3 bump = texture2D(normalMap, vUv).xyz * 2.0 - 1.0;
    vec3 N = normalize(vN + vT * bump.x * 0.35 + vB * bump.y * 0.35);
    vec3 sunN = normalize(sunDir);
    float lambert = dot(N, sunN);
    float k = smoothstep(-0.10, 0.15, lambert);   // 晨昏线过渡

    vec3 dayCol = texture2D(dayMap, vUv).rgb * (0.22 + 0.95 * max(lambert, 0.0));
    vec3 nightCol = texture2D(nightMap, vUv).rgb * nightBrightness;
    vec3 col = mix(nightCol, dayCol, k);

    // 海面高光（specularMap 白色=海洋）
    vec3 viewDir = normalize(cameraPosition - vWorldPos);
    vec3 h = normalize(sunN + viewDir);
    float spec = pow(max(dot(N, h), 0.0), 46.0) * texture2D(specMap, vUv).r * k;
    col += spec * vec3(1.0, 0.93, 0.78) * 0.55;

    // 大气边缘散射
    float rim = pow(1.0 - max(dot(normalize(vN), viewDir), 0.0), 3.0);
    col += rim * vec3(0.22, 0.42, 0.85) * (0.25 + 0.55 * k);

    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

// —— 标注元素（tilt 固定系，不随自转） ——
const marks = new THREE.Group();
tiltG.add(marks);

const AXIS_COLOR = 0xffd166;
const axisLine = new THREE.Line(
  new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -1.45, 0), new THREE.Vector3(0, 1.45, 0)]),
  new THREE.LineBasicMaterial({ color: AXIS_COLOR, transparent: true, opacity: 0.9 })
);
const axisN = makeTextSprite('N', { fontSize: 40, color: '#ffd166', scale: 0.006 });
axisN.position.set(0, 1.62, 0);
marks.add(axisLine, axisN);

const equatorRing = circleLine(1.002, 0x9adfff, 160);
marks.add(equatorRing);

function latCircle(latDeg, color, radius = 1.004) {
  const lat = latDeg * DEG;
  const r = Math.cos(lat) * radius;
  const y = Math.sin(lat) * radius;
  const ring = circleLine(r, color, 160);
  ring.position.y = y;
  return ring;
}
const tropicN = latCircle(23.44, 0xffb35c);
const tropicS = latCircle(-23.44, 0xffb35c);
const polarN = latCircle(66.56, 0x8fd3ff);
const polarS = latCircle(-66.56, 0x8fd3ff);
marks.add(tropicN, tropicS, polarN, polarS);

// 晨昏线圈（法向 = 太阳方向的大圆）
const termPts = [];
for (let i = 0; i <= 180; i++) {
  const a = (i / 180) * TAU;
  termPts.push(new THREE.Vector3(Math.cos(a) * 1.006, Math.sin(a) * 1.006, 0));
}
const termGeo = new THREE.BufferGeometry().setFromPoints(termPts);
const terminator = new THREE.Line(termGeo, new THREE.LineDashedMaterial({
  color: 0xffffff, dashSize: 0.055, gapSize: 0.035, transparent: true, opacity: 0.85,
}));
terminator.computeLineDistances();
marks.add(terminator);

// 直射点标记
const subSolar = new THREE.Group();
const ssDot = new THREE.Mesh(
  new THREE.SphereGeometry(0.028, 16, 12),
  new THREE.MeshBasicMaterial({ color: 0xff5533 })
);
const ssLabel = makeTextSprite('直射点', { fontSize: 34, color: '#ff8873', scale: 0.0052 });
ssLabel.position.set(0.1, 0.16, 0);
subSolar.add(ssDot, ssLabel);
marks.add(subSolar);

// 北京标记（随地球自转）
const spinMarks = new THREE.Group();
spinG.add(spinMarks);
const bjDot = new THREE.Mesh(
  new THREE.SphereGeometry(0.024, 16, 12),
  new THREE.MeshBasicMaterial({ color: 0x59d999 })
);
function latLonToVec(latDeg, lonDegE, r = 1.01) {
  const lat = latDeg * DEG, lon = lonDegE * DEG;
  return new THREE.Vector3(Math.cos(lat) * Math.cos(lon), Math.sin(lat), -Math.cos(lat) * Math.sin(lon)).multiplyScalar(r);
}
bjDot.position.copy(latLonToVec(39.9, OBS_LON));
const bjLabel = makeTextSprite('北京', { fontSize: 34, color: '#7df0b6', scale: 0.005 });
bjLabel.position.copy(latLonToVec(39.9, OBS_LON, 1.1));
spinMarks.add(bjDot, bjLabel);

// 自转方向箭头（赤道上空的东向弧线箭头）
const rotArrowGroup = new THREE.Group();
{
  const curve = new THREE.EllipseCurve(0, 0, 1.22, 1.22, -0.5, 1.1, false, 0);
  const pts = curve.getPoints(40).map((p) => new THREE.Vector3(p.x, 0, p.y));
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xffe08a, transparent: true, opacity: 0.9 }));
  const tip = pts[pts.length - 1];
  const prev = pts[pts.length - 4];
  const cone = new THREE.Mesh(
    new THREE.ConeGeometry(0.045, 0.14, 12),
    new THREE.MeshBasicMaterial({ color: 0xffe08a })
  );
  cone.position.copy(tip);
  cone.lookAt(tip.clone().sub(prev).add(tip));
  cone.rotateX(Math.PI / 2);
  const lbl = makeTextSprite('自转方向：自西向东', { fontSize: 30, color: '#ffe08a', scale: 0.0045 });
  lbl.position.set(0, 0.35, -1.5);
  rotArrowGroup.add(line, cone, lbl);
}
marks.add(rotArrowGroup);

// 正午太阳高度演示组
const noonG = new THREE.Group();
marks.add(noonG);
const noonState = {};
{
  const matLine = (c) => new THREE.LineBasicMaterial({ color: c, transparent: true, opacity: 0.95 });
  noonState.pointMarker = new THREE.Mesh(
    new THREE.SphereGeometry(0.03, 16, 12),
    new THREE.MeshBasicMaterial({ color: 0x59d999 })
  );
  noonState.zenith = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), matLine(0x9adfff));
  noonState.horizon = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), matLine(0x8a94a3));
  noonState.ray = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), matLine(0xffd166));
  const arcPts = [];
  for (let i = 0; i <= 24; i++) arcPts.push(new THREE.Vector3());
  noonState.arc = new THREE.Line(new THREE.BufferGeometry().setFromPoints(arcPts), matLine(0xffffff));
  noonState.lbl = makeTextSprite('', { fontSize: 36, color: '#ffffff', scale: 0.005, bg: 'rgba(10,16,24,0.72)' });
  noonG.add(noonState.pointMarker, noonState.zenith, noonState.horizon, noonState.ray, noonState.arc, noonState.lbl);
}

// 昼夜长短：纬线圈昼弧/夜弧（三重描边增粗，WebGL 不支持 linewidth）
const dayNightArc = { dayLines: [], nightLines: [] };
{
  const mk = (c, o) => new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]),
    new THREE.LineBasicMaterial({ color: c, transparent: true, opacity: o })
  );
  for (const rOff of [1.014, 1.022, 1.03]) {
    const l = mk(0xffc94d, 0.95); dayNightArc.dayLines.push({ line: l, rOff });
    const n = mk(0x6a7cff, 0.9); dayNightArc.nightLines.push({ line: n, rOff });
    marks.add(l, n);
  }
}
function updateDayNightArc(latDeg, sunDirWorld) {
  const lat = latDeg * DEG;
  const qTilt = tiltG.getWorldQuaternion(new THREE.Quaternion());
  const qInv = qTilt.clone().invert();
  const sunLocal = sunDirWorld.clone().applyQuaternion(qInv);
  const dayPts = [], nightPts = [];
  const p = new THREE.Vector3();
  for (let i = 0; i <= 360; i++) {
    const t = (i / 360) * TAU;
    p.set(Math.cos(lat) * Math.cos(t), Math.sin(lat), -Math.cos(lat) * Math.sin(t));
    const world = p.clone().applyQuaternion(qTilt);
    (world.dot(sunDirWorld) > 0 ? dayPts : nightPts).push(p.clone());
  }
  dayNightArc.dayLines.forEach((e) => setPts2(e, dayPts));
  dayNightArc.nightLines.forEach((e) => setPts2(e, nightPts));
  return sunLocal;
}
function setPts2(entry, sourcePts) {
  const line = entry.line;
  const scale = entry.rOff;
  const outPts = sourcePts.length > 1
    ? [...sourcePts.map((q) => q.clone().multiplyScalar(scale)), sourcePts[0].clone().multiplyScalar(scale)]
    : [new THREE.Vector3(), new THREE.Vector3()];
  line.geometry.dispose();
  line.geometry = new THREE.BufferGeometry().setFromPoints(outPts);
  line.visible = sourcePts.length > 1;
}

// 公转轨道元素（世界系）
const orbitG = new THREE.Group();
scene.add(orbitG);
const orbitRing = circleLine(ORBIT_R, 0x8899bb, 256);
orbitRing.material.transparent = true;
orbitRing.material.opacity = 0.45;
const sunOrbitMesh = new THREE.Mesh(new THREE.SphereGeometry(1.6, 32, 16), new THREE.MeshBasicMaterial({ color: 0xfff2c8 }));
const sunOrbitGlow = new THREE.Sprite(new THREE.SpriteMaterial({
  map: makeGlowTexture('255,236,180'), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true,
}));
sunOrbitGlow.scale.set(10, 10, 1);
orbitG.add(orbitRing, sunOrbitMesh, sunOrbitGlow);

// 月份刻度
const monthLabels = new THREE.Group();
orbitG.add(monthLabels);
{
  const names = ['3月21日', '6月22日', '9月23日', '12月22日'];
  const Ns = [80, 173, 266, 356];
  Ns.forEach((N, i) => {
    const p = orbitPos(N, ORBIT_R + 1.6);
    const s = makeTextSprite(names[i], { fontSize: 32, color: '#c3cfe0', scale: 0.012 });
    s.position.copy(p);
    monthLabels.add(s);
    const tick = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffcf6e }));
    tick.position.copy(orbitPos(N, ORBIT_R));
    monthLabels.add(tick);
  });
}
const sunEarthLine = new THREE.Line(
  new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]),
  new THREE.LineBasicMaterial({ color: 0xffd166, transparent: true, opacity: 0.7 })
);
orbitG.add(sunEarthLine);

/* ---------------- 状态 ---------------- */

const state = {
  mode: 'earth',            // 'earth' 近景 | 'orbit' 公转全景
  playing: true,
  speed: 1,
  N: 108,                   // 一年中的第几天（约 4 月中旬）
  spin: 0,                  // 自转角
  spinPeriod: 12,           // 近景：每圈秒数
  orbitPeriod: 80,          // 公转：每年秒数
  showClouds: true,
  showNight: true,
  obsLat: 40,
  showTerminator: false,
  noonH: 45,
};

/* ---------------- 每帧更新 ---------------- */

const _qTilt = new THREE.Quaternion();
const _sunDirW = new THREE.Vector3();

function applyMode() {
  const m = state.mode;
  orbitG.visible = m === 'orbit';
  sunSys.visible = m === 'earth';
  monthLabels.visible = m === 'orbit';
  sunEarthLine.visible = m === 'orbit';
  axisLine.visible = axisN.visible = true;
  if (m === 'earth') {
    earthPos.position.set(0, 0, 0);
    earthPos.scale.setScalar(1);
    controls.target.set(0, 0, 0);
  } else {
    earthPos.scale.setScalar(0.55);
    controls.target.set(0, 0, 0);
  }
}

app.onFrame((dt) => {
  cameraTweenTick(app, dt);
  if (state.playing) {
    state.spin += (dt / state.spinPeriod) * TAU * state.speed;
    state.N += (dt / state.orbitPeriod) * YEAR_DAYS * state.speed;
    if (state.N > YEAR_DAYS) state.N -= YEAR_DAYS;
    if (activeCtl && activeCtl.dateSlider && activeCtl.dateSync) activeCtl.dateSlider.set(state.N);
  }
  spinG.rotation.y = state.spin;
  if (cloudsMesh) cloudsMesh.rotation.y += dt * 0.006 * (state.playing ? state.speed : 0);

  const sunDir = sunDirVec(state.N);
  _sunDirW.copy(sunDir);

  // 太阳位置与光照
  if (state.mode === 'earth') {
    sunSys.position.copy(sunDir).multiplyScalar(-SUN_DIST);
    earthPos.position.set(0, 0, 0);
    sunLight.position.copy(sunSys.position);
    sunLight.target = earthPos;
  } else {
    const p = orbitPos(state.N);
    earthPos.position.copy(p);
    sunSys.position.set(0, 0, 0);
    sunLight.position.set(0, 0, 0);
    sunLight.target = earthPos;
    sunEarthLine.geometry.dispose();
    sunEarthLine.geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), p.clone().multiplyScalar(1 / earthPos.scale.x)]);
  }
  earthUniforms.sunDir.value.copy(sunDir);

  // 直射点（tilt 固定系）
  tiltG.getWorldQuaternion(_qTilt);
  const sunLocal = sunDir.clone().applyQuaternion(_qTilt.clone().invert());
  subSolar.position.copy(sunLocal).setLength(1.02);
  const delta = declination(state.N);

  // 晨昏线：平面法向 = 太阳方向
  terminator.visible = state.showTerminator;
  if (state.showTerminator) {
    terminator.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), sunLocal.clone().normalize());
  }

  if (cloudsMesh) {
    if (activeSectionId === 'daynight-arc') updateDayNightArc(state.obsLat, sunDir);
    if (activeSectionId === 'noon-alt') updateNoonViz(sunLocal, delta);
    if (activeSectionId === 'daynight' || activeSectionId === 'rotation') updateBeijingTime(sunLocal);
  }
  hud.el.style.display = hud.visibleNow ? '' : 'none';
  if (hud.visibleNow) hudRefresh(delta);
});

/* ---------------- HUD ---------------- */

const hud = makeHUD(stage, [['date', '日期'], ['delta', '直射纬度'], ['extra', '读数']]);
hud.visibleNow = false;
function hudRefresh(delta) {
  hud.set('date', dateText(state.N));
  hud.set('delta', (delta / DEG).toFixed(1) + '°');
  if (hud.extraFn) hud.set('extra', hud.extraFn());
}

/* ---------------- 北京地方时（太阳时） ---------------- */

// 直射点经度必须换算到「随地球自转」的网格坐标系，与北京标记同 frame
function subsolarLonDeg(sunTiltLocal) {
  const qSpinInv = spinG.quaternion.clone().invert();
  const s = sunTiltLocal.clone().applyQuaternion(qSpinInv);
  return Math.atan2(-s.z, s.x) / DEG;
}
function updateBeijingTime(sunLocal) {
  const lonSS = subsolarLonDeg(sunLocal);
  let h = 12 + (OBS_LON - lonSS) / 15;
  h = ((h % 24) + 24) % 24;
  const hh = Math.floor(h);
  const mm = Math.floor((h - hh) * 60);
  hud.beijing = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

/* ---------------- 正午太阳高度演示 ---------------- */

function updateNoonViz(sunLocal, delta) {
  const lat = state.obsLat * DEG;
  const n = new THREE.Vector3(0, 1, 0); // tilt 系中的地轴
  const horiz = sunLocal.clone().sub(n.clone().multiplyScalar(sunLocal.dot(n)));
  if (horiz.lengthSq() < 1e-9) horiz.set(1, 0, 0);
  horiz.normalize();
  const point = horiz.clone().multiplyScalar(Math.cos(lat)).add(n.clone().multiplyScalar(Math.sin(lat))).multiplyScalar(1.005);
  const up = point.clone().normalize();
  const toSun = sunLocal.clone().normalize();

  noonState.pointMarker.position.copy(point);
  setLine(noonState.zenith, point, point.clone().add(up.clone().multiplyScalar(0.85)));
  // 地平面指示：当地经线方向（南北向）
  const northT = up.clone().cross(new THREE.Vector3(0, 1, 0)).normalize();
  setLine(noonState.horizon, point.clone().add(northT.clone().multiplyScalar(-0.55)), point.clone().add(northT.clone().multiplyScalar(0.55)));
  setLine(noonState.ray, point.clone().add(toSun.clone().multiplyScalar(0.06)), point.clone().add(toSun.clone().multiplyScalar(1.15)));

  // 角度弧：天顶方向 → 太阳方向
  const H = noonAltitude(state.obsLat, delta);
  const perp = up.clone().cross(toSun);
  const axisArc = perp.lengthSq() > 1e-8 ? perp.normalize() : new THREE.Vector3(0, 1, 0);
  const zAngle = Math.acos(clamp(up.dot(toSun), -1, 1));
  const arcPts = [];
  for (let i = 0; i <= 24; i++) {
    const a = (i / 24) * zAngle;
    arcPts.push(point.clone().add(up.clone().applyAxisAngle(axisArc, a).multiplyScalar(0.62)));
  }
  noonState.arc.geometry.dispose();
  noonState.arc.geometry = new THREE.BufferGeometry().setFromPoints(arcPts);

  const lblPos = point.clone().add(up.clone().multiplyScalar(0.72)).add(toSun.clone().multiplyScalar(0.42));
  setSpriteText(noonState.lbl, `H = ${H.toFixed(1)}°`, { fontSize: 36, color: '#ffffff', scale: 0.005, bg: 'rgba(10,16,24,0.72)' });
  noonState.lbl.position.copy(lblPos);
  state.noonH = H;
}
function setLine(line, a, b) {
  line.geometry.dispose();
  line.geometry = new THREE.BufferGeometry().setFromPoints([a, b]);
}

/* ---------------- 章节定义 ---------------- */

const ctl = createControlsPanel(document.getElementById('controls'));
let activeCtl = null;
let activeSectionId = null;
let activeSectionCleanup = null;

function setVis(...pairs) {
  pairs.forEach(([obj, v]) => { obj.visible = v; });
}

function baseCtl({ playing = true } = {}) {
  ctl.clear();
  activeCtl = { dateSync: false };
  state.playing = playing;
  const playBtn = ctl.button({
    label: playing ? '⏸ 暂停' : '▶ 播放',
    onClick() {
      state.playing = !state.playing;
      playBtn.textContent = state.playing ? '⏸ 暂停' : '▶ 播放';
      playBtn.classList.toggle('active', !state.playing);
    },
  });
  if (!playing) playBtn.classList.add('active');
  activeCtl.playBtn = playBtn;
  ctl.sep();
  const dateSlider = ctl.slider({
    label: '日期', min: 1, max: YEAR_DAYS, step: 1, value: Math.round(state.N),
    fmt: (v) => dateText(v),
    onInput: (v) => { state.N = v; },
  });
  activeCtl.dateSlider = dateSlider;
  return activeCtl;
}

function enterDefaults() {
  state.showTerminator = false;
  setVis([tropicN, false], [tropicS, false], [polarN, false], [polarS, false],
    [rotArrowGroup, false], [noonG, false],
    [subSolar, false], [bjDot, false], [bjLabel, false]);
  dayNightArc.dayLines.forEach((e) => { e.line.visible = false; });
  dayNightArc.nightLines.forEach((e) => { e.line.visible = false; });
  cloudsMesh.visible = state.showClouds;
  earthUniforms.nightBrightness.value = state.showNight ? 0.9 : 0.35;
  hud.visibleNow = false;
}

const SECTIONS = [
  {
    id: 'overview',
    title: '地球运动总览',
    html: `<p>地球同时做着两种运动：<b>自转</b>（绕地轴，自西向东，周期约 24 小时）和<b>公转</b>（绕太阳，周期约 365.25 天）。</p>
<p>地轴始终是倾斜的，与公转轨道平面（黄道面）保持 <span class="hl">66°34′</span> 的夹角，倾角约 <span class="hl">23°26′</span>，且方向始终指向北极星附近——这为四季与昼夜长短的变化埋下伏笔。</p>
<p>拖动视图从各个角度观察：注意地轴的指向在公转过程中保持不变。</p>`,
    enter() {
      state.mode = 'orbit';
      state.spinPeriod = 9;
      state.orbitPeriod = 55;
      state.playing = true;
      applyMode();
      enterDefaults();
      app.setCamera([0, 13.5, 10.5], [0, 0, 0]);
      const c = baseCtl();
      c.dateSync = true;
    },
  },
  {
    id: 'rotation',
    title: '地球自转',
    html: `<p>地球绕自转轴旋转，方向<b>自西向东</b>：从北极上空看是<b>逆时针</b>，从南极上空看是顺时针。</p>
<p>自转的地理意义：① 产生<b>昼夜交替</b>，周期约 24 小时（1 恒星日 = 23时56分4秒）；② 产生<b>时差</b>——经度每隔 15°，地方时相差 1 小时；③ 产生地转偏向力（北右南左）；④ 使赤道略鼓（角速度处处相等 ≈15°/h，线速度由赤道向两极递减）。</p>
<p>试用顶部按钮切换「北极俯视」视角，验证自转方向。</p>`,
    enter() {
      state.mode = 'earth';
      state.spinPeriod = 10;
      applyMode();
      enterDefaults();
      setVis([rotArrowGroup, true], [axisLine, true], [axisN, true], [equatorRing, true]);
      app.setCamera([1.8, 1.4, 2.9], [0, 0, 0]);
      hud.visibleNow = true;
      hud.extraFn = () => '北京地方时 ' + (hud.beijing || '--:--');
      baseCtl();
      ctl.sep();
      ctl.slider({
        label: '自转速度', min: 0.2, max: 4, step: 0.1, value: 1,
        fmt: (v) => v.toFixed(1) + '×',
        onInput: (v) => { state.speed = v; },
      });
      ctl.toggle({
        label: '北极俯视', value: false,
        onChange: (v) => {
          app.setCamera(v ? [0.02, 4.3, 0.02] : [1.8, 1.4, 2.9], [0, 0, 0]);
        },
      });
      ctl.toggle({
        label: '云层', value: true,
        onChange: (v) => { cloudsMesh.visible = v; state.showClouds = v; },
      });
    },
  },
  {
    id: 'daynight',
    title: '昼夜交替与晨昏线',
    html: `<p>地球是不透明的球体，同一时刻太阳只能照亮一半——被照亮的<b>昼半球</b>与背向太阳的<b>夜半球</b>的分界线叫<b>晨昏线</b>（圈）。</p>
<p>晨昏线经过赤道，与太阳光线垂直，把赤道平分；随着地球自西向东自转，晨昏线在地表自东向西扫过，各地因此经历昼夜交替。</p>
<p>顺地球自转方向，由夜进入昼的是<b>晨线</b>（当地 6 时附近），由昼进入夜的是<b>昏线</b>（18 时附近）。观察绿色的北京标记：它穿过晨线和昏线时，地方时分别是约 6 时和 18 时。拖动日期滑杆还能看到晨昏线与极圈的交角变化。</p>`,
    enter() {
      state.mode = 'earth';
      state.spinPeriod = 14;
      applyMode();
      enterDefaults();
      setVis([terminator, true], [bjDot, true], [bjLabel, true], [subSolar, true]);
      state.showTerminator = true;
      state.N = 81; // 春分前后：晨昏线过极点
      app.setCamera([2.2, 1.2, 2.6], [0, 0, 0]);
      hud.visibleNow = true;
      hud.extraFn = () => '北京地方时 ' + (hud.beijing || '--:--');
      baseCtl();
      ctl.sep();
      ctl.toggle({
        label: '夜半球灯光', value: true,
        onChange: (v) => { earthUniforms.nightBrightness.value = v ? 0.9 : 0.15; },
      });
      ctl.toggle({
        label: '晨昏线', value: true,
        onChange: (v) => { state.showTerminator = v; },
      });
    },
  },
  {
    id: 'revolution',
    title: '地球公转',
    html: `<p>地球绕太阳公转，方向也是<b>自西向东</b>（从北极上空看为逆时针），轨道是接近圆形的椭圆（偏心率仅 0.0167），周期约 <b>365.25 天</b>。</p>
<p>1 月初地球位于<b>近日点</b>（约 1.471 亿 km），7 月初位于<b>远日点</b>（约 1.521 亿 km）——冷暖季节差异主要来自<b>太阳高度与昼长</b>，而不是日地距离。</p>
<p>公转与自转方向一致；地轴倾斜方向在公转全程保持不变（指向北极星附近）。</p>`,
    enter() {
      state.mode = 'orbit';
      state.spinPeriod = 14;
      state.orbitPeriod = 60;
      applyMode();
      enterDefaults();
      app.setCamera([0, 14, 11], [0, 0, 0]);
      const c = baseCtl();
      c.dateSync = true;
      ctl.sep();
      ctl.toggle({
        label: '轨道与月份', value: true,
        onChange: (v) => { orbitRing.visible = v; monthLabels.visible = v; sunEarthLine.visible = v; },
      });
      ctl.toggle({
        label: '地轴', value: true,
        onChange: (v) => { axisLine.visible = axisN.visible = v; },
      });
    },
  },
  {
    id: 'subsolar',
    title: '太阳直射点的移动',
    html: `<p>由于黄赤交角的存在，太阳直射点在南北回归线之间往返移动：<b>夏至（6月22日前后）直射北回归线 23°26′N</b>，<b>冬至（12月22日前后）直射南回归线</b>，<b>春分/秋分直射赤道</b>。</p>
<p>直射点每年一个来回，周期为一个回归年（365天5时48分46秒）。直射点所在的纬线，正午太阳高度达全年最大（90°）。</p>
<p>拖动日期滑杆，看红色直射点沿所对经线在南北回归线之间移动；也可点「播放一年」自动演示。</p>`,
    enter() {
      state.mode = 'earth';
      applyMode();
      enterDefaults();
      setVis([subSolar, true], [tropicN, true], [tropicS, true], [equatorRing, true]);
      const sd = sunDirVec(state.N);
      app.setCamera([sd.x * 3.4, 1.1, sd.z * 3.4], [0, 0.1, 0]);
      hud.visibleNow = true;
      hud.extraFn = () => (state.N < 80 || (state.N >= 173 && state.N < 266) || state.N >= 356) ? '直射点北移 ↑' : '直射点南移 ↓';
      const c = baseCtl({ playing: false });
      c.playBtn.textContent = '▶ 播放一年';
      ctl.sep();
      ctl.toggle({
        label: '极圈', value: true,
        onChange: (v) => setVis([polarN, v], [polarS, v]),
      });
    },
  },
  {
    id: 'daynight-arc',
    title: '昼夜长短',
    html: `<p>晨昏线把任一纬线圈分成<b>昼弧</b>和<b>夜弧</b>——昼弧越长，该纬线上的白昼越长。</p>
<p>规律（以北半球为例）：① <b>春分→秋分</b>：昼长夜短，纬度越高昼越长；② <b>夏至</b>：昼最长，北极圈及其以北出现极昼；③ <b>冬至</b>相反；④ <b>赤道</b>全年昼夜平分；⑤ <b>春秋分</b>全球昼夜等长。</p>
<p>拖动「纬度」和「日期」滑杆，看橙色的昼弧与蓝色的夜弧如何变化，右侧同步给出昼长时数。</p>`,
    enter() {
      state.mode = 'earth';
      applyMode();
      enterDefaults();
      app.setCamera([2.8, 1.8, 2.4], [0, 0, 0]);
      hud.visibleNow = true;
      const refresh = () => {
        const d = dayLengthHours(state.obsLat, declination(state.N));
        hud.extraFn = () => {
          if (d >= 24) return '极昼（24 时）';
          if (d <= 0) return '极夜（0 时）';
          return `${Math.floor(d)}时${String(Math.round((d % 1) * 60)).padStart(2, '0')}分`;
        };
        hudRefresh(declination(state.N));
      };
      refresh();
      const c = baseCtl({ playing: false });
      state.spinPeriod = 999; // 该节不自转，只走日期
      ctl.sep();
      ctl.slider({
        label: '纬度', min: -90, max: 90, step: 1, value: state.obsLat,
        fmt: (v) => Math.abs(v) + '°' + (v >= 0 ? 'N' : 'S'),
        onInput: (v) => { state.obsLat = v; refresh(); },
      });
      // 日期滑杆变化时刷新昼长读数
      c.dateSlider.el.querySelector('input').addEventListener('input', refresh);
    },
  },
  {
    id: 'noon-alt',
    title: '正午太阳高度',
    html: `<p><b>正午太阳高度</b>＝当地正午时太阳光线与地平面的夹角，一天中的最大值。同一时刻，太阳高度从直射点向两侧递减。</p>
<p>公式：<span class="hl">H = 90° − |当地纬度 − 直射点纬度|</span>（同半球相减、异半球相加取绝对值）。</p>
<p>规律：夏至日北回归线及其以北地区 H 达全年最大；冬至日南回归线及其以南最大；赤道在春分秋分达 90°。</p>
<p>拖动「纬度」与「日期」，观察黄色的太阳光线、青色的铅垂线（指向天顶）之间的夹角 H。</p>`,
    enter() {
      state.mode = 'earth';
      applyMode();
      enterDefaults();
      setVis([noonG, true], [tropicN, true], [tropicS, true], [equatorRing, true]);
      hud.visibleNow = true;
      hud.extraFn = () => `H = ${state.noonH.toFixed(1)}°`;
      const refresh = () => hudRefresh(declination(state.N));
      refresh();
      const c = baseCtl({ playing: false });
      state.spinPeriod = 999;
      ctl.sep();
      ctl.slider({
        label: '纬度', min: -66, max: 66, step: 1, value: state.obsLat,
        fmt: (v) => Math.abs(v) + '°' + (v >= 0 ? 'N' : 'S'),
        onInput: (v) => { state.obsLat = v; refresh(); },
      });
      c.dateSlider.el.querySelector('input').addEventListener('input', refresh);
      aimNoonCamera();
    },
  },
  {
    id: 'seasons',
    title: '四季更替',
    html: `<p>四季更替的直接原因是<b>正午太阳高度</b>与<b>昼长</b>随季节变化——根源是黄赤交角与公转的组合。</p>
<p>二分二至（北半球）：① <b>春分 3月21日前后</b>，直射赤道；② <b>夏至 6月22日前后</b>，直射北回归线，北半球获得太阳辐射最多；③ <b>秋分 9月23日前后</b>；④ <b>冬至 12月22日前后</b>，直射南回归线。</p>
<p>注意：地球公转轨道是椭圆，1 月初过近日点——北半球冬季反而离太阳更近，可见季节与日地距离关系不大。四季最分明的地区是<b>中纬度</b>；赤道与极地只有干湿季或长昼长夜之分。</p>
<p>点击按钮跳到四个节气位置，对比地轴的倾向与昼夜分布。</p>`,
    enter() {
      state.mode = 'orbit';
      state.N = 173;
      state.orbitPeriod = 70;
      applyMode();
      enterDefaults();
      setVis([monthLabels, true], [sunEarthLine, true]);
      app.setCamera([10.5, 7.5, 10.5], [0, 0, 0]);
      hud.visibleNow = true;
      hud.extraFn = () => seasonText(state.N);
      hudRefresh(declination(state.N));
      const c = baseCtl();
      c.dateSync = true;
      ctl.sep();
      const jumps = [[80, '春分'], [173, '夏至'], [266, '秋分'], [356, '冬至']];
      jumps.forEach(([N, name]) => {
        ctl.button({
          label: name,
          onClick: () => { state.N = N; c.dateSlider.set(N); hudRefresh(declination(N)); },
        });
      });
    },
  },
  {
    id: 'quiz',
    title: '随堂检测',
    html: `<p>5 道选择题，检验一下本节课的掌握情况。答完可重新开始。</p>`,
    enter() {
      state.mode = 'earth';
      state.spinPeriod = 26;
      applyMode();
      enterDefaults();
      app.setCamera([1.6, 1.1, 2.8], [0, 0, 0]);
      ctl.clear();
      activeCtl = null;
      showQuiz();
    },
  },
];

function seasonText(N) {
  const n = Math.round(N);
  if (n >= 79 && n < 172) return '北半球：春季 → 夏季';
  if (n >= 172 && n < 266) return '北半球：夏季';
  if (n >= 266 && n < 356) return '北半球：秋季';
  return '北半球：冬季';
}

/* ---------------- 正午演示相机的初始对准 ---------------- */

// 进入 noon-alt 章节时，把相机摆到正午经线平面的正侧方（面向太阳光照来的方向）
function aimNoonCamera() {
  tiltG.getWorldQuaternion(_qTilt);
  const sunLocal = _sunDirW.clone().applyQuaternion(_qTilt.clone().invert());
  const n = new THREE.Vector3(0, 1, 0);
  const side = n.clone().cross(sunLocal).normalize();
  if (side.lengthSq() < 1e-6) side.set(1, 0, 0);
  // 让太阳方向大致朝向相机一侧（侧方偏太阳 40°）
  const towardSun = sunLocal.clone().normalize();
  const dir = side.multiplyScalar(Math.cos(0.7)).addScaledVector(towardSun, Math.sin(0.7)).normalize();
  app.setCamera([dir.x * 2.9, 1.0 + dir.y * 2.9, dir.z * 2.9], [0, 0.15, 0]);
}

/* ---------------- 随堂检测 ---------------- */

const QUIZ = [
  {
    q: '地球自转的正确方向是？',
    opts: ['自西向东', '自东向西', '自南向北', '顺时针（从北极上空看）'],
    a: 0,
    ex: '地球自西向东转（北极上空看为逆时针），因此晨昏线在地表自东向西移动，各地依次经历昼夜。',
  },
  {
    q: '关于晨昏线（圈），下列说法正确的是？',
    opts: ['晨昏线始终与经线圈重合', '晨昏线所在平面与太阳光线垂直', '晨昏线不经过赤道', '晨昏线上太阳高度为 45°'],
    a: 1,
    ex: '晨昏线是昼夜半球的分界，其所在平面与太阳光线垂直；晨昏线过赤道（除非在极昼极夜边缘特殊视觉），线上太阳高度为 0°；只有春分秋分时才与经线圈重合。',
  },
  {
    q: '6 月 22 日（夏至）前后，太阳直射点位于？',
    opts: ['赤道', '南回归线', '北回归线', '北极圈'],
    a: 2,
    ex: '夏至日太阳直射北回归线（23°26′N），此后直射点南移；冬至直射南回归线，春分秋分直射赤道。',
  },
  {
    q: '夏至日，北半球的昼夜长短状况是？',
    opts: ['全球昼夜等长', '昼最短夜最长', '昼最长夜最短，且纬度越高昼越长', '北极圈内全部极夜'],
    a: 2,
    ex: '夏至日北半球昼最长夜最短，纬度越高昼越长，北极圈及其以北出现极夜的反面——极昼；南半球相反。',
  },
  {
    q: '夏至日，北京（约 40°N）的正午太阳高度约为多少？',
    opts: ['约 26.5°', '约 50°', '约 73.5°', '约 90°'],
    a: 2,
    ex: 'H = 90° − |40° − 23.5°| = 73.5°。正午太阳高度由直射点向南北两侧递减。',
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
  activeSectionCleanup = () => panel.remove();
}

/* ---------------- 启动 ---------------- */

const texUrls = {
  day: 'day-DmukkgAy.webp',
  night: 'night-7j0D73E-.webp',
  clouds: 'clouds-DTkGUc9f.webp',
  normal: 'earth_normal_2048-BD2vMuPH.jpg',
  spec: 'earth_specular_2048-6aAFN27D.jpg',
};

loadAll([
  { key: 'day', label: '昼半球', job: loadTexture(TEXDIR + texUrls.day) },
  { key: 'night', label: '夜半球', job: loadTexture(TEXDIR + texUrls.night) },
  { key: 'clouds', label: '云层', job: loadTexture(TEXDIR + texUrls.clouds, { colorSpace: null }) },
  { key: 'normal', label: '地形', job: loadTexture(TEXDIR + texUrls.normal, { colorSpace: null }) },
  { key: 'spec', label: '海面', job: loadTexture(TEXDIR + texUrls.spec, { colorSpace: null }) },
], (d, t, label) => loader.setText(`正在加载贴图 ${d}/${t}（${label}）`)).then((t) => {
  earthUniforms.dayMap.value = t.day;
  earthUniforms.nightMap.value = t.night;
  earthUniforms.specMap.value = t.spec;
  earthUniforms.normalMap.value = t.normal;

  earthMesh = new THREE.Mesh(
    new THREE.SphereGeometry(1, 128, 96),
    new THREE.ShaderMaterial({
      uniforms: earthUniforms,
      vertexShader: EARTH_VERT,
      fragmentShader: EARTH_FRAG,
    })
  );
  cloudsMesh = new THREE.Mesh(
    new THREE.SphereGeometry(1.012, 96, 64),
    new THREE.MeshLambertMaterial({
      color: 0xffffff,
      alphaMap: t.clouds,
      transparent: true,
      depthWrite: false,
      opacity: 0.85,
    })
  );
  atmoMesh = new THREE.Mesh(
    new THREE.SphereGeometry(1.06, 64, 48),
    new THREE.ShaderMaterial({
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      depthWrite: false,
      vertexShader: /* glsl */`
        varying vec3 vN; varying vec3 vWp;
        void main() {
          vN = normalize(mat3(modelMatrix) * normal);
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vWp = wp.xyz;
          gl_Position = projectionMatrix * viewMatrix * wp;
        }`,
      fragmentShader: /* glsl */`
        varying vec3 vN; varying vec3 vWp;
        void main() {
          vec3 v = normalize(cameraPosition - vWp);
          float rim = pow(max(dot(normalize(vN), v), 0.0), 2.2);
          gl_FragColor = vec4(vec3(0.28, 0.5, 0.95) * rim * 0.8, rim * 0.8);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    })
  );
  spinG.add(earthMesh, cloudsMesh);
  earthPos.add(atmoMesh);

  loader.hide();
  const sections = createSections({
    nav: document.getElementById('sideNav'),
    descPanel: document.getElementById('descPanel'),
    sections: SECTIONS,
    onSelect(i, sec) {
      if (activeSectionCleanup) { activeSectionCleanup(); activeSectionCleanup = null; }
      activeSectionId = sec.id;
      sec.enter();
    },
  });
  window.__eduSections = sections;
  sections.select(0);
}).catch((err) => {
  loader.setText('资源加载失败：' + err.message);
  console.error(err);
});
