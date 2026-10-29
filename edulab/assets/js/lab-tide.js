/* EduLab · 潮汐的形成（tide）
 * 章节：潮起潮落 / 引潮力 / 两次涨落 / 大潮与小潮 / 日潮不等
 * 场景：地球 + 月球系统；引潮力箭头分解；随月球移动的潮汐隆起与等潮线；
 *       角落海岸小窗实时显示观测点涨落、水尺读数与昼夜。
 */
import {
  THREE, DEG, TAU, clamp,
  loadTexture, loadHDR, loadAll, createApp, cameraTweenTick, makeLoader,
  createSections, createControlsPanel, makeHUD, makeTextSprite, makeGlowTexture,
  circleLine, makeStars,
} from './edu-core.js';

/* ---------------- 常量 ---------------- */

const TEXDIR = '../assets/textures/';
const EARTH_R = 1;
const WATER_R = 1.045;
const MOON_R = 0.273;            // 与地球半径比（真实值 0.273）
const MOON_DIST = 7.2;           // 示意距离（真实约 60 倍地球半径）
const SUN_DIR = new THREE.Vector3(1, 0, 0);   // 太阳固定在 +X 远处
const SUN_DIST = 90;
const TIDE_AMP = 0.085;          // 潮汐隆起幅度（视觉夸大）
const SOLAR_RATIO = 0.46;        // 太阳潮幅约为月球潮的 46%

function latLonToVec(latDeg, lonDegE, r = 1) {
  const lat = latDeg * DEG, lon = lonDegE * DEG;
  return new THREE.Vector3(Math.cos(lat) * Math.cos(lon), Math.sin(lat), -Math.cos(lat) * Math.sin(lon)).multiplyScalar(r);
}

/* ---------------- 场景 ---------------- */

const stage = document.getElementById('stage');
const loader = makeLoader(stage, '正在准备潮汐实验…');

const app = createApp({
  container: stage,
  fov: 42, near: 0.1, far: 3000,
  cameraPos: [3.2, 2.2, 4.6],
  target: [0, 0, 0],
  minDistance: 1.6, maxDistance: 30,
  exposure: 1.05,
});
const { scene, camera, controls } = app;

scene.add(makeStars(500, 2400));
scene.add(new THREE.AmbientLight(0x445566, 0.55));

// 太阳（远处光源 + 视觉球）
const sunSys = new THREE.Group();
const sunMesh = new THREE.Mesh(new THREE.SphereGeometry(2.2, 24, 16), new THREE.MeshBasicMaterial({ color: 0xfff2c8 }));
const sunGlow = new THREE.Sprite(new THREE.SpriteMaterial({
  map: makeGlowTexture('255,236,180'), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true,
}));
sunGlow.scale.set(20, 20, 1);
sunSys.add(sunMesh, sunGlow);
sunSys.position.copy(SUN_DIR).multiplyScalar(SUN_DIST);
scene.add(sunSys);
const sunLight = new THREE.DirectionalLight(0xffffff, 2.6);
sunLight.position.copy(SUN_DIR).multiplyScalar(50);
scene.add(sunLight);
const sunLabel = makeTextSprite('太阳光', { fontSize: 34, color: '#ffe9b0', scale: 0.02 });
sunLabel.position.copy(SUN_DIR).multiplyScalar(34);
scene.add(sunLabel);

// —— 地球 + 水壳 ——
const earthG = new THREE.Group();       // 不自转的参考系（月地方向在此定义）
scene.add(earthG);
const spinG = new THREE.Group();        // 地球自转
earthG.add(spinG);

const axisLine = new THREE.Line(
  new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -1.4, 0), new THREE.Vector3(0, 1.4, 0)]),
  new THREE.LineBasicMaterial({ color: 0xffd166, transparent: true, opacity: 0.8 })
);
earthG.add(axisLine);
const axisN = makeTextSprite('N', { fontSize: 40, color: '#ffd166', scale: 0.006 });
axisN.position.set(0, 1.56, 0);
earthG.add(axisN);

let waterMesh, waterBase;

// 观测点（海岸城市，随地球自转）
const obsG = new THREE.Group();         // spinG 子节点
spinG.add(obsG);
const obsDot = new THREE.Mesh(new THREE.SphereGeometry(0.03, 14, 10), new THREE.MeshBasicMaterial({ color: 0x59d999 }));
const obsLabel = makeTextSprite('观测点', { fontSize: 32, color: '#7df0b6', scale: 0.005 });
obsLabel.position.set(0, 0.14, 0);
obsG.add(obsDot, obsLabel);

// —— 月球系统 ——
const moonOrbitG = new THREE.Group();   // 可倾斜（月赤纬）
scene.add(moonOrbitG);
const moonRing = circleLine(MOON_DIST, 0x8b93a8, 200);
moonRing.material.transparent = true;
moonRing.material.opacity = 0.3;
moonOrbitG.add(moonRing);
const moonG = new THREE.Group();
moonOrbitG.add(moonG);
const moonMesh = new THREE.Mesh(
  new THREE.SphereGeometry(MOON_R, 48, 32),
  new THREE.MeshStandardMaterial({ color: 0xb9b6ae, roughness: 0.95, metalness: 0, envMapIntensity: 0.15 })
);
const moonLabel = makeTextSprite('月球', { fontSize: 34, color: '#dfe6f2', scale: 0.008 });
moonLabel.position.set(0, 0.55, 0);
moonG.add(moonMesh, moonLabel);

// —— 引潮力箭头（大圆采样点） ——
const ARROW_N = 15;
const arrows = { g: [], c: [], r: [], points: [] };
const arrowRoot = new THREE.Group();
scene.add(arrowRoot);
for (let i = 0; i < ARROW_N; i++) {
  const mk = (c) => new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(), 0.2, c, 0.07, 0.045);
  arrows.g.push(mk(0x6fa8dc));
  arrows.c.push(mk(0x9aa3ad));
  arrows.r.push(mk(0xff8c42));
  arrowRoot.add(arrows.g[i], arrows.c[i], arrows.r[i]);
}

// —— 等潮线（潮汐隆起等值圈） ——
const cotidalRings = [];
const ringRoot = new THREE.Group();
scene.add(ringRoot);
for (const psiDeg of [25, 55, 90, 125, 155]) {
  const color = psiDeg < 90 ? 0xffb35c : 0x8fd3ff;
  const line = circleLine(1, color, 120);
  line.material.transparent = true;
  line.material.opacity = 0.65;
  cotidalRings.push({ line, psiDeg });
  ringRoot.add(line);
}

// 潮汐隆起方向标（指向/背向月球两个峰）
const bulgeMarks = [];
for (const s of [1, -1]) {
  const dot = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffb35c }));
  const lbl = makeTextSprite(s > 0 ? '顺月隆起' : '背月隆起', { fontSize: 28, color: '#ffcf9a', scale: 0.0042 });
  const g = new THREE.Group();
  g.add(dot, lbl);
  if (s < 0) lbl.position.set(0, 0.16, 0); else lbl.position.set(0, 0.16, 0);
  scene.add(g);
  bulgeMarks.push(g);
}

/* ---------------- 状态 ---------------- */

const state = {
  playing: true,
  speed: 1,
  t: 0,                    // 模拟秒
  spinPeriod: 9,           // 地球自转一圈的秒数
  moonPeriod: 74,          // 月球公转一圈的秒数（示意压缩）
  moonPhase: TAU * 0.1,    // 月球相位角（相对太阳方向）
  moonDecl: 0,             // 月赤纬（度）
  moonDist: MOON_DIST,
  obsLat: 30,
  solarTide: false,
  showArrows: true,
  showComponents: true,
  showResultant: true,
  showRings: false,
  showWindow: true,
  mode: 'flow',            // flow | force | twicerun
  moonFrozen: false,
};

/* ---------------- 潮高与受力 ---------------- */

// 平衡潮高度：η = A·(3(d·m)² − 1)/2，d 为地表点单位方向（世界系）
function tideHeight(dirWorld, moonDirW, moonDistEff, solarOn) {
  const distFactor = Math.pow(MOON_DIST / moonDistEff, 3);
  const d = dirWorld.dot(moonDirW);
  let eta = TIDE_AMP * distFactor * (3 * d * d - 1) / 2;
  if (solarOn) {
    const ds = dirWorld.dot(SUN_DIR);
    eta += TIDE_AMP * SOLAR_RATIO * (3 * ds * ds - 1) / 2;
  }
  return eta;
}

function updateWater(moonDirW, moonDistEff, solarOn) {
  const pos = waterMesh.geometry.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < waterBase.count; i++) {
    v.fromBufferAttribute(waterBase, i);
    const len = v.length();
    const dir = v.divideScalar(len);
    const eta = tideHeight(dir, moonDirW, moonDistEff, solarOn);
    const r = len + eta;
    pos.setXYZ(i, dir.x * r, dir.y * r, dir.z * r);
  }
  pos.needsUpdate = true;
  waterMesh.geometry.computeVertexNormals();
}

// 大圆上的引潮力分解（大圆 = 含地轴与月地方向的平面）
// 长度按 K·D²/r² 归一（中心=1.5），保持「引力∝1/r²、离心力处处相等」的真实比例
function updateArrows(moonDirW, moonDistEff) {
  const n = new THREE.Vector3(0, 1, 0);
  const side = n.clone().cross(moonDirW).normalize(); // 大圆法向
  const inPlane = moonDirW.clone().normalize();
  const K = 1.5 * moonDistEff * moonDistEff;          // 归一化：地心处引力长度 = 1.5
  const cLen = 1.5;                                    // 惯性离心力（处处相同）
  for (let i = 0; i < ARROW_N; i++) {
    const a = (i / ARROW_N) * TAU;
    const d = inPlane.clone().multiplyScalar(Math.cos(a)).addScaledVector(side, Math.sin(a));
    const p = d.clone().multiplyScalar(EARTH_R);
    // 月球引力：指向月球，大小 ∝ 1/r²
    const toMoon = moonDirW.clone().multiplyScalar(moonDistEff).sub(p);
    const rLen = toMoon.length();
    const gLen = K / (rLen * rLen);
    arrows.g[i].position.copy(p);
    arrows.g[i].setDirection(toMoon.clone().divideScalar(rLen));
    arrows.g[i].setLength(gLen, 0.09, 0.05);
    // 惯性离心力：各地相同，方向背离月球
    const cDir = moonDirW.clone().negate();
    arrows.c[i].position.copy(p);
    arrows.c[i].setDirection(cDir);
    arrows.c[i].setLength(cLen, 0.09, 0.05);
    // 合力（引潮力）＝ 引力 + 离心力（矢量叠加，长度同比例）
    const res = toMoon.clone().divideScalar(rLen).multiplyScalar(gLen).addScaledVector(cDir, cLen);
    arrows.r[i].position.copy(p);
    if (res.lengthSq() > 1e-6) {
      arrows.r[i].setDirection(res.clone().normalize());
      arrows.r[i].setLength(Math.max(res.length(), 0.08), 0.08, 0.046);
    } else {
      arrows.r[i].setLength(0.001, 0.001, 0.001);
    }
  }
}

function updateRings(moonDirW) {
  const m = moonDirW.clone().normalize();
  const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), m);
  for (const { line, psiDeg } of cotidalRings) {
    const psi = psiDeg * DEG;
    const eta = TIDE_AMP * (3 * Math.cos(psi) * Math.cos(psi) - 1) / 2;
    const rr = WATER_R * (1 + eta);
    const radius = Math.sin(psi) * rr;
    line.scale.setScalar(radius);
    line.position.copy(m).multiplyScalar(Math.cos(psi) * rr);
    line.quaternion.copy(quat);
    line.material.color.set(psiDeg <= 90 ? 0xffb35c : 0x8fd3ff);
  }
}

function updateBulgeMarks(moonDirW) {
  bulgeMarks[0].position.copy(moonDirW).normalize().multiplyScalar(WATER_R * 1.07);
  bulgeMarks[1].position.copy(moonDirW).normalize().multiplyScalar(-WATER_R * 1.07);
  bulgeMarks[1].children[1].position.set(0, 0.16, 0);
}

/* ---------------- 海岸小窗 ---------------- */

const cwBox = document.createElement('div');
cwBox.className = 'coastal-window';
cwBox.innerHTML = '<div class="cw-head"><b>观测点</b><span class="cw-info">海岸水尺</span></div>';
const cwCanvas = document.createElement('canvas');
cwCanvas.width = 600; cwCanvas.height = 300;
cwBox.appendChild(cwCanvas);
stage.appendChild(cwBox);
const cwc = cwCanvas.getContext('2d');

const tideHistory = [];        // {hSim, eta}
const HIST_MAX = 24 * 3600;    // 保留 24 模拟小时

function drawCoastalWindow(etaNow, isDay, dayFrac) {
  const W = cwCanvas.width, H = cwCanvas.height;
  const midY = H * 0.30;
  const amp = H * 0.24;
  cwc.clearRect(0, 0, W, H);
  // 天空
  const sky = cwc.createLinearGradient(0, 0, 0, H);
  if (isDay) { sky.addColorStop(0, '#8ec9ec'); sky.addColorStop(1, '#d9ecf7'); }
  else { sky.addColorStop(0, '#0b1226'); sky.addColorStop(1, '#2a3352'); }
  cwc.fillStyle = sky;
  cwc.fillRect(0, 0, W, H);
  if (!isDay) {
    cwc.fillStyle = 'rgba(255,255,255,0.8)';
    for (let i = 0; i < 30; i++) {
      const x = (i * 97.3) % W, y = (i * 53.7) % (midY - 20);
      cwc.fillRect(x, y, 1.6, 1.6);
    }
    // 月牙
    cwc.fillStyle = '#e8ecf4';
    cwc.beginPath(); cwc.arc(W * 0.82, H * 0.16, 13, 0, TAU); cwc.fill();
    cwc.fillStyle = sky;
    cwc.beginPath(); cwc.arc(W * 0.82 + 7, H * 0.16 - 3, 11, 0, TAU); cwc.fill();
  } else {
    cwc.fillStyle = '#ffe9a8';
    cwc.beginPath(); cwc.arc(W * 0.82, H * 0.14, 12, 0, TAU); cwc.fill();
  }
  // 昼夜分界提示线
  cwc.strokeStyle = 'rgba(255,255,255,0.25)';
  cwc.setLineDash([6, 6]);
  cwc.beginPath(); cwc.moveTo(0, midY); cwc.lineTo(W, midY); cwc.stroke();
  cwc.setLineDash([]);

  // 潮汐曲线（过去 24 模拟小时）
  const t0 = state.t - HIST_MAX;
  cwc.strokeStyle = 'rgba(255,255,255,0.85)';
  cwc.lineWidth = 2.4;
  cwc.beginPath();
  let started = false;
  for (const s of tideHistory) {
    const x = ((s.h - t0) / HIST_MAX) * W;
    const y = midY - s.eta * amp * 8;
    if (!started) { cwc.moveTo(x, y); started = true; } else cwc.lineTo(x, y);
  }
  cwc.stroke();

  // 海面
  const level = midY - etaNow * amp * 8;
  const sea = cwc.createLinearGradient(0, level, 0, H);
  sea.addColorStop(0, 'rgba(52,120,190,0.85)');
  sea.addColorStop(1, 'rgba(20,52,100,0.95)');
  cwc.fillStyle = sea;
  cwc.beginPath();
  cwc.moveTo(0, level);
  // 轻微波浪
  for (let x = 0; x <= W; x += 12) {
    cwc.lineTo(x, level + Math.sin(x * 0.05 + state.t * 0.002) * 3);
  }
  cwc.lineTo(W, H); cwc.lineTo(0, H); cwc.closePath(); cwc.fill();

  // 水尺（右侧）
  cwc.strokeStyle = 'rgba(255,255,255,0.75)';
  cwc.lineWidth = 2;
  cwc.beginPath(); cwc.moveTo(W - 36, midY - amp * 8); cwc.lineTo(W - 36, midY + amp * 8); cwc.stroke();
  cwc.fillStyle = 'rgba(255,255,255,0.85)';
  cwc.font = '600 15px -apple-system, "PingFang SC", sans-serif';
  cwc.textAlign = 'right';
  const meters = etaToMeters(etaNow);
  cwc.fillText(`${meters.toFixed(2)} m`, W - 44, level - 8);
  cwc.font = '500 12px -apple-system, "PingFang SC", sans-serif';
  cwc.fillText('高', W - 26, midY - amp * 8 - 4);
  cwc.fillText('低', W - 26, midY + amp * 8 + 14);

  // 模拟钟
  const hh = Math.floor(dayFrac * 24), mm = Math.floor(((dayFrac * 24) % 1) * 60);
  cwc.textAlign = 'left';
  cwc.fillStyle = 'rgba(255,255,255,0.9)';
  cwc.font = '600 15px -apple-system, "PingFang SC", sans-serif';
  cwc.fillText(`${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`, 12, 22);
  // 图例说明
  cwc.fillStyle = 'rgba(255,255,255,0.65)';
  cwc.font = '500 12px -apple-system, "PingFang SC", sans-serif';
  cwc.fillText('← 过去 24 小时潮位', 12, H - 10);
}

function etaToMeters(eta) {
  // 折算真实量级：视觉幅度 → 米（大潮潮差约 2~4 m 量级）
  return eta * 28;
}

/* ---------------- HUD ---------------- */

const hud = makeHUD(stage, [['eta', '当前潮位'], ['range', '潮差（估）'], ['extra', '']]);
hud.visibleNow = true;

/* ---------------- 帧循环 ---------------- */

const _moonW = new THREE.Vector3();
const _obsW = new THREE.Vector3();
const _qSpin = new THREE.Quaternion();

app.onFrame((dt) => {
  cameraTweenTick(app, dt);
  if (!waterMesh) return;   // 资源未加载完成前只做相机缓动
  if (state.playing) {
    const dts = dt * state.speed;
    state.t += dts;
    if (!state.moonFrozen) state.moonPhase += dts / state.moonPeriod * TAU;
  }
  spinG.rotation.y = TAU * state.t / state.spinPeriod;
  moonOrbitG.rotation.x = state.moonDecl * DEG;
  const a = state.moonPhase;
  moonG.position.set(Math.cos(a) * state.moonDist, 0, -Math.sin(a) * state.moonDist);
  moonG.getWorldPosition(_moonW);
  const moonDirW = _moonW.clone().normalize();

  updateWater(moonDirW, state.moonDist, state.solarTide);
  if (state.showRings) updateRings(moonDirW);
  updateBulgeMarks(moonDirW);

  // 观测点潮高
  obsG.getWorldPosition(_obsW);
  const obsDir = _obsW.clone().normalize();
  const etaObs = tideHeight(obsDir, moonDirW, state.moonDist, state.solarTide);
  const isDay = obsDir.dot(SUN_DIR) > 0;
  const dayFrac = (state.t / state.spinPeriod) % 1;

  tideHistory.push({ h: state.t, eta: etaObs });
  while (tideHistory.length && tideHistory[0].h < state.t - HIST_MAX) tideHistory.shift();

  if (state.showWindow) drawCoastalWindow(etaObs, isDay, dayFrac);

  if (state.showArrows) updateArrows(moonDirW, state.moonDist);

  // HUD
  hud.set('eta', (etaObs >= 0 ? '+' : '') + (etaObs * 28).toFixed(2) + ' m');
  const distFactor = Math.pow(MOON_DIST / state.moonDist, 3);
  const ampNow = TIDE_AMP * distFactor * (state.solarTide ? 1 + SOLAR_RATIO : 1);
  hud.set('range', (ampNow * 2 * 28).toFixed(2) + ' m');
  hud.set('extra', isDay ? '☀ 白昼' : '☾ 夜晚');
});

/* ---------------- 控制条 ---------------- */

const ctl = createControlsPanel(document.getElementById('controls'));

function baseCtl({ playing = true } = {}) {
  ctl.clear();
  setIntervalKeep = null;
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
  ctl.sep();
  ctl.slider({
    label: '速度', min: 0.2, max: 4, step: 0.1, value: state.speed,
    fmt: (v) => v.toFixed(1) + '×',
    onInput: (v) => { state.speed = v; },
  });
  return playBtn;
}

function latCtl(onChange) {
  return ctl.slider({
    label: '观测点纬度', min: -60, max: 60, step: 1, value: state.obsLat,
    fmt: (v) => Math.abs(v) + '°' + (v >= 0 ? 'N' : 'S'),
    onInput: (v) => {
      state.obsLat = v;
      obsG.position.copy(latLonToVec(v, 0, 1.07));
      if (onChange) onChange(v);
    },
  });
}

/* ---------------- 章节 ---------------- */

const SECTIONS = [
  {
    id: 'flow',
    title: '潮起潮落',
    html: `<p>海水在天体（主要是<b>月球</b>，其次<b>太阳</b>）引潮力作用下，产生周期性的涨落，这就是<b>潮汐</b>。</p>
<p>观察右下角的海岸小窗：观测点随地球自转，一天中两次经过潮汐隆起——两次涨潮、两次落潮，一个潮汐周期约 <span class="hl">12 小时 25 分</span>（比 12 小时长，因为月球也在公转，每天约推迟 50 分钟）。</p>
<p>三维视图里半透明的水壳显示了全球的<b>潮汐隆起</b>：朝向月球一侧和背向月球一侧各有一个「鼓包」，随月球移动。</p>`,
    enter() {
      state.mode = 'flow';
      state.moonFrozen = false;
      state.solarTide = false;
      state.moonPeriod = 74;
      state.moonDecl = 0;
      state.showArrows = false;
      arrowRoot.visible = false;
      state.showRings = true;
      ringRoot.visible = true;
      setArrowVis();
      baseCtl();
      ctl.sep();
      latCtl();
      ctl.sep();
      ctl.toggle({
        label: '海岸小窗', value: true,
        onChange: (v) => { state.showWindow = v; cwBox.style.display = v ? '' : 'none'; },
      });
      ctl.toggle({
        label: '等潮线', value: true,
        onChange: (v) => { state.showRings = v; ringRoot.visible = v; },
      });
      app.setCamera([3.0, 2.0, 4.4], [0, 0, 0]);
    },
  },
  {
    id: 'force',
    title: '引潮力',
    html: `<p>潮汐的根源是<b>引潮力</b>＝天体引力 与 惯性离心力 的<b>差</b>。</p>
<p>① <span style="color:#6fa8dc"><b>蓝色箭头：月球引力</b></span>——指向月球，离月球越近越大（∝ 1/r²）；② <span style="color:#9aa3ad"><b>灰色箭头：惯性离心力</b></span>——地球绕地月公共质心运动，地球上每一点都受到大小相等、方向背离月球的离心力；③ <span style="color:#ff8c42"><b>橙色箭头：引潮力（合力）</b></span>。</p>
<p>合力结果：朝月一侧引力胜出 → <b>指向月球</b>；背月一侧离心力胜出 → <b>背离月球</b>；两侧之间有微小的切向分量。这就是<b>两个</b>潮汐隆起总是同时出现在地球两端的原因。</p>
<p>把「月球距离」拉近，看引潮力按 <span class="hl">1/d³</span> 迅速增大（潮汐比引力对距离更敏感）。</p>`,
    enter() {
      state.moonFrozen = false;
      state.showArrows = true;
      arrowRoot.visible = true;
      state.showComponents = true;
      state.showResultant = true;
      setArrowVis();
      state.showRings = false;
      ringRoot.visible = false;
      baseCtl({ playing: false });
      state.moonPhase = 0.4;
      ctl.sep();
      ctl.slider({
        label: '月球距离', min: 3.6, max: 12, step: 0.1, value: state.moonDist,
        fmt: (v) => (v * 5.6).toFixed(0) + ' 千km',
        onInput: (v) => { state.moonDist = v; },
      });
      ctl.sep();
      ctl.toggle({
        label: '月球引力', value: true, onChange: (v) => { state.showComponents = v; setArrowVis(); },
      });
      ctl.toggle({
        label: '惯性离心力', value: true, onChange: (v) => { state.showComponents = v; setArrowVis(); },
      });
      ctl.toggle({
        label: '引潮力合力', value: true, onChange: (v) => { state.showResultant = v; setArrowVis(); },
      });
      app.setCamera([0.5, 1.4, 8.6], [0, 0, 0]);
    },
  },
  {
    id: 'twice',
    title: '两次涨落',
    html: `<p>为什么一天有<b>两次</b>高潮？因为潮汐隆起在地球的<b>两端</b>同时存在：观测点随地球自转，先经过朝月隆起（第一次高潮），约 12 小时 25 分后再经过背月隆起（第二次高潮）。</p>
<p>本节把月球<b>固定</b>住，只让地球转——看右下角小窗，两次峰值几乎一样高（纬度不太高时）。「两次涨落相隔 12 时 25 分」是半日潮港的典型特征。</p>
<p>顺带观察绿色观测点：它穿过隆起正下方时为高潮，穿过两隆起之间时为低潮。</p>`,
    enter() {
      state.moonFrozen = true;
      state.moonPhase = 0;          // 月球固定在 +X
      state.moonDecl = 0;
      state.solarTide = false;
      state.showArrows = false;
      arrowRoot.visible = false;
      state.showRings = true;
      ringRoot.visible = true;
      setArrowVis();
      baseCtl();
      state.spinPeriod = 6;
      ctl.sep();
      latCtl();
      app.setCamera([1.0, 4.2, 7.8], [0, 0, 0]);
    },
  },
  {
    id: 'spring-neap',
    title: '大潮与小潮',
    html: `<p>太阳也会引起潮汐，只是幅度约为月球的 <span class="hl">46%</span>。日、月、地三者的相对位置决定潮差大小：</p>
<p>① <b>朔望大潮</b>：新月（日月同侧）与满月（日月两侧）时，日、月引潮力互相叠加，潮差最大；② <b>上下弦小潮</b>：上弦月与下弦月时，日、月引潮力互相垂直抵消，潮差最小。</p>
<p>拖动「月相」滑杆或点四个阶段按钮，看水壳隆起幅度的变化与小窗潮差的起伏。一个朔望月（约 29.5 天）中，大潮各出现 2 次。</p>`,
    enter() {
      state.moonFrozen = false;
      state.solarTide = true;
      state.showArrows = false;
      arrowRoot.visible = false;
      state.showRings = false;
      ringRoot.visible = false;
      setArrowVis();
      const play = baseCtl();
      state.moonPeriod = 46;   // 一个朔望月压缩到 46 秒
      ctl.sep();
      const phaseSlider = ctl.slider({
        label: '月相', min: 0, max: 360, step: 1, value: (state.moonPhase / DEG) % 360,
        fmt: (v) => phaseName(v),
        onInput: (v) => { state.moonPhase = v * DEG; },
      });
      setIntervalKeep = () => { phaseSlider.set(((state.moonPhase / DEG) % 360 + 360) % 360); };
      ctl.sep();
      const setPhase = (deg) => { state.moonPhase = deg * DEG; phaseSlider.set(deg); };
      ctl.button({ label: '新月·大潮', onClick: () => setPhase(0) });
      ctl.button({ label: '上弦·小潮', onClick: () => setPhase(90) });
      ctl.button({ label: '满月·大潮', onClick: () => setPhase(180) });
      ctl.button({ label: '下弦·小潮', onClick: () => setPhase(270) });
      app.setCamera([1.4, 3.6, 9.6], [0, 0, 0]);
      sunLabel.visible = true;
    },
  },
  {
    id: 'inequality',
    title: '日潮不等',
    html: `<p>月球公转轨道（白道）与赤道面有最大 <span class="hl">28°36′</span> 的夹角（月赤纬）。当月赤纬不为零时，潮汐隆起的轴线也倾斜了：</p>
<p>中纬度观测点一天两次经过隆起的位置不再对称——<b>两次高潮高度不等、两次低潮也不等</b>，这就是<b>日潮不等</b>。月赤纬为 0 时（月球在赤道面上），两次高潮恢复相等。</p>
<p>拖动「月赤纬」和「观测点纬度」观察小窗曲线的变化。按不等程度，潮汐可分为：<b>正规半日潮</b>（两次相近）、<b>不正规半日潮</b>（明显不等）、<b>正规全日潮</b>（一天一次，如北部湾）。</p>`,
    enter() {
      state.moonFrozen = false;
      state.solarTide = false;
      state.showArrows = false;
      arrowRoot.visible = false;
      state.showRings = true;
      ringRoot.visible = true;
      setArrowVis();
      baseCtl();
      state.moonPeriod = 60;
      ctl.sep();
      ctl.slider({
        label: '月赤纬', min: 0, max: 28.6, step: 0.2, value: 18,
        fmt: (v) => v.toFixed(1) + '°',
        onInput: (v) => { state.moonDecl = v; },
      });
      ctl.sep();
      state.obsLat = 45;
      obsG.position.copy(latLonToVec(45, 0, 1.07));
      latCtl();
      app.setCamera([3.4, 3.0, 5.2], [0, 0, 0]);
    },
  },
];

let setIntervalKeep = null;   // 大潮小潮节的滑杆跟随器

function setArrowVis() {
  arrows.g.forEach((a) => { a.visible = state.showArrows && state.showComponents; });
  arrows.c.forEach((a) => { a.visible = state.showArrows && state.showComponents; });
  arrows.r.forEach((a) => { a.visible = state.showArrows && state.showResultant; });
}

function phaseName(deg) {
  const d = ((deg % 360) + 360) % 360;
  if (d < 22.5 || d >= 337.5) return '新月';
  if (d < 67.5) return '蛾眉月';
  if (d < 112.5) return '上弦月';
  if (d < 157.5) return '盈凸月';
  if (d < 202.5) return '满月';
  if (d < 247.5) return '亏凸月';
  if (d < 292.5) return '下弦月';
  return '残月';
}

/* ---------------- 启动 ---------------- */

obsG.position.copy(latLonToVec(state.obsLat, 0, 1.07));

loadAll([
  { key: 'day', label: '地球', job: loadTexture(TEXDIR + 'earth/day-DmukkgAy.webp') },
  { key: 'water', label: '水面', job: loadTexture(TEXDIR + 'earth/water-CiZebwCi.webp', { colorSpace: null, wrap: true }) },
  { key: 'sky', label: '环境光', job: loadHDR(TEXDIR + 'sky/sky_harbor-BruSQyW8.hdr') },
], (d, t, label) => loader.setText(`正在加载 ${d}/${t}（${label}）`)).then((t) => {
  const earthMesh = new THREE.Mesh(
    new THREE.SphereGeometry(EARTH_R, 96, 64),
    new THREE.MeshPhongMaterial({ map: t.day, shininess: 6, specular: new THREE.Color(0x222c33) })
  );
  spinG.add(earthMesh);

  const waterGeo = new THREE.SphereGeometry(WATER_R, 96, 64);
  waterBase = waterGeo.attributes.position.clone();
  waterMesh = new THREE.Mesh(waterGeo, new THREE.MeshPhysicalMaterial({
    color: 0x3a86c8,
    transparent: true,
    opacity: 0.5,
    roughness: 0.16,
    metalness: 0.05,
    clearcoat: 0.6,
    clearcoatRoughness: 0.2,
    envMapIntensity: 0.9,
    depthWrite: false,
    emissive: new THREE.Color(0x0d2036),
    emissiveIntensity: 0.55,
  }));
  earthG.add(waterMesh);
  scene.environment = t.sky;

  loader.hide();
  const sections = createSections({
    nav: document.getElementById('sideNav'),
    descPanel: document.getElementById('descPanel'),
    sections: SECTIONS,
    onSelect(i, sec) {
      activeSectionCleanupFn();
      sec.enter();
    },
  });
  window.__eduSections = sections;
  sections.select(0);

  // 章节切换后的滑杆跟随
  app.onFrame(() => {
    if (setIntervalKeep) setIntervalKeep();
  });
}).catch((err) => {
  loader.setText('资源加载失败：' + err.message);
  console.error(err);
});

let activeSectionCleanupFn = () => {};
