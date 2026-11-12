/* EduLab · 等高线 3D 课堂（contour）
 * 章节：等高线地形图初识 / 等高线的形成 / 海拔与相对高度 / 等高距与坡度 /
 *       山顶与盆地 / 山脊与山谷 / 鞍部 / 陡崖 / 地形剖面图 / 随堂检测
 * 场景：程序化高度场地形 + Marching Squares 等高线 + 水平面切割 + 同步平面地形图 + 剖面图
 * 视觉工艺（edu-vfx 接入）：后处理管线（bloom + 暗角 + 颗粒，深青棚拍背景）接管渲染循环；
 *       app.setCamera 升级为 cubic 缓动运镜，切章即飞至对应地貌机位。
 * 布局（micro 三件套移植）：真·三栏教学布局——左栏课程大纲列表（点击切章）/
 *       中栏 3D 地形舞台（地形图/剖面图浮窗收成 40px 圆徽标）/ 右栏知识点详解 + 本章控件 + 数据读数；
 *       左右栏独立折叠（28px 竖条）+ 专注模式 + 右栏三块手风琴（localStorage 记忆，切章不重置）。
 */
import {
  THREE, TAU, clamp, loadTexture, loadHDR, loadAll, createApp,
  makeLoader, createControlsPanel, makeHUD, makeTextSprite, setSpriteText,
} from './edu-core.js';
import {
  attachVFX, matCoat, matSheen, matStd, matGlass, matGlow,
  makeWoodTexture, makeLabelTexture, makeStudioEnvironment, fbm3, PAL,
} from './edu-vfx.js';

const TEXDIR = '../assets/textures/';
const S = 10;                 // 地形边长（世界单位）
const N = 120;                // 网格单元数
const VS = N + 1;
const HSCALE = 1000;          // 世界 1 单位 = 1000 米

/* ---------------- 高度预设（返回米） ---------------- */

const G = (x, z, cx, cz, sx, sz, a) =>
  a * Math.exp(-(((x - cx) * (x - cx)) / (2 * sx * sx) + ((z - cz) * (z - cz)) / (2 * sz * sz)));

const PRESETS = {
  overview(x, z) {
    return 250 + G(x, z, -1.6, 1.1, 1.5, 1.2, 1350) + G(x, z, 1.9, -0.7, 1.25, 1.1, 950)
      + G(x, z, 0.3, 2.5, 0.85, 0.8, 520) + G(x, z, -2.9, -1.7, 0.9, 0.9, 400);
  },
  formation(x, z) { return 140 + G(x, z, -0.2, 0.3, 1.75, 1.5, 1460) + G(x, z, 2.7, -2.3, 0.9, 0.8, 330); },
  elevation(x, z) { return 120 + G(x, z, -1.8, 0.2, 1.15, 1.05, 1500) + G(x, z, 1.7, 0.5, 1.2, 1.1, 880); },
  slope(x, z) {
    let h;
    if (x < -0.5) h = 1400 * Math.pow(clamp((x + 4.2) / 3.7, 0, 1), 0.8);
    else h = 1400 * Math.pow(1 - clamp((x + 0.5) / 4.6, 0, 1), 1.9);
    return 80 + h * (1 - 0.10 * (z * z) / 25);
  },
  peak(x, z) { return 130 + G(x, z, -0.3, 0, 1.5, 1.4, 1420); },
  basin(x, z) { return 1460 - G(x, z, -0.3, 0, 1.55, 1.45, 1360); },
  ridgevalley(x, z) {
    let h = 950 - 20 * (z * z) / 5;
    h += 760 * G(x, z, -1.5, 0, 0.62, 3.4, 1);
    h -= 430 * G(x, z, 1.7, 0, 0.85, 3.4, 1);
    return clamp(h, 60, 1620);
  },
  saddle(x, z) {
    return 430 + G(x, z, -1.75, 0.35, 1.05, 0.95, 1000) + G(x, z, 1.75, -0.35, 1.05, 0.95, 1080);
  },
  cliff(x, z) {
    const t = clamp((x + 0.55) / 0.22, 0, 1);
    return 130 + 1250 * (1 - Math.pow(1 - t, 2)) * (1 - 0.05 * (z * z) / 14) + G(x, z, 2.7, 2.0, 0.8, 0.7, 280);
  },
  profile(x, z) {
    return 200 + G(x, z, -2.7, 1.5, 1.1, 1.0, 720) + G(x, z, 0.4, -0.9, 1.35, 1.25, 1020)
      + G(x, z, 2.8, 1.8, 0.9, 0.8, 560) + G(x, z, -1.2, -2.6, 0.9, 0.8, 420);
  },
};

/* ---------------- 场景 ---------------- */

const stage = document.getElementById('stage');
const loader = makeLoader(stage, '正在准备等高线实验…');

const app = createApp({
  container: stage, fov: 42, near: 0.1, far: 300,
  cameraPos: [7.4, 6.4, 9.6], target: [0, 0.4, 0],
  minDistance: 2, maxDistance: 40, exposure: 1.0,
  keepBackground: true,
});
const { scene, camera, controls } = app;
/* 视觉工艺接入：后处理管线接管渲染与相机缓动（setCamera 升级为 cubic 运镜） */
const vfx = attachVFX(app, 'illus');

scene.add(new THREE.HemisphereLight(0xe8f1ff, 0xb0a184, 1.15));
const sun = new THREE.DirectionalLight(0xfff2dc, 2.2);
sun.position.set(-6, 9, 4);
scene.add(sun);
/* 工作室环境反射贴图（按 renderer 缓存）：只挂给道具金属/玻璃材质，
 * 不设 scene.environment——避免 IBL 漫射抬高地形整体亮度；冷侧补光平衡暖主光 */
const studioEnv = makeStudioEnvironment(app.renderer);
const fillLight = new THREE.DirectionalLight(0xcfe0f2, 0.5);
fillLight.position.set(7, 5.5, -6.5);
scene.add(fillLight);

const terrainG = new THREE.Group();   // 地形 + 等高线 + 水面（统一竖向夸张）
scene.add(terrainG);
const annoG = new THREE.Group();      // 标注（手动按夸张系数定位，防精灵拉伸）
scene.add(annoG);

/* 地形网格 */
const terrainGeo = new THREE.PlaneGeometry(S, S, N, N).rotateX(-Math.PI / 2);
terrainGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(terrainGeo.attributes.position.count * 3), 3));
const H = new Float32Array(VS * VS);          // 高度场（米）
let Hfrom = null, Hto = null, morphT = 1, morphDur = 1.1;

const hColorRamp = [
  [0.00, [0.50, 0.70, 0.38]], [0.18, [0.63, 0.74, 0.36]], [0.38, [0.85, 0.78, 0.42]],
  [0.58, [0.80, 0.62, 0.38]], [0.78, [0.66, 0.50, 0.38]], [0.92, [0.84, 0.82, 0.78]], [1.00, [0.99, 0.99, 1.0]],
];
function heightColor(hm, out) {
  const t = clamp(hm / 1650, 0, 1);
  for (let i = 1; i < hColorRamp.length; i++) {
    if (t <= hColorRamp[i][0]) {
      const [t0, c0] = hColorRamp[i - 1], [t1, c1] = hColorRamp[i];
      const k = (t - t0) / (t1 - t0);
      out[0] = c0[0] + (c1[0] - c0[0]) * k; out[1] = c0[1] + (c1[1] - c0[1]) * k; out[2] = c0[2] + (c1[2] - c0[2]) * k;
      return out;
    }
  }
  out[0] = 0.97; out[1] = 0.97; out[2] = 0.98; return out;
}

function samplePreset(name) {
  const f = PRESETS[name];
  for (let j = 0; j < VS; j++) {
    const z = -S / 2 + (j / N) * S;
    for (let i = 0; i < VS; i++) {
      H[j * VS + i] = f(-S / 2 + (i / N) * S, z);
    }
  }
}

const _c = [0, 0, 0];
function applyHeights() {
  const pos = terrainGeo.attributes.position;
  const col = terrainGeo.attributes.color;
  for (let j = 0; j < VS; j++) {
    for (let i = 0; i < VS; i++) {
      const id = j * VS + i;
      const y = H[id] / HSCALE;
      pos.setY(id, y);
      heightColor(H[id], _c);
      col.setXYZ(id, _c[0], _c[1], _c[2]);
    }
  }
  pos.needsUpdate = true; col.needsUpdate = true;
  terrainGeo.computeVertexNormals();
}

/* ---------------- Marching Squares 等高线 ---------------- */

const MAXSEG = 52000;
const segBuf = new Float32Array(MAXSEG * 6);
const idxBuf = new Float32Array(MAXSEG * 6);
let segN = 0, idxN = 0;

// 边定义：0=上(TL-TR) 1=右(TR-BR) 2=下(BL-BR) 3=左(TL-BL)；查表：掩码→[边对…]
const EDGEPAIRS = [null, [[3, 0]], [[0, 1]], [[3, 1]], [[1, 2]], [[3, 0], [1, 2]], [[0, 2]], [[3, 2]],
  [[2, 3]], [[0, 2]], [[0, 1], [2, 3]], [[1, 2]], [[3, 1]], [[0, 1]], [[3, 0]]];

function edgePoint(e, i, j, lv, v00, v10, v01, v11, out) {
  const x0 = -S / 2 + (i / N) * S, z0 = -S / 2 + (j / N) * S, d = S / N;
  let t;
  switch (e) {
    case 0: t = (lv - v00) / (v10 - v00); out[0] = x0 + t * d; out[1] = z0; break;
    case 1: t = (lv - v10) / (v11 - v10); out[0] = x0 + d; out[1] = z0 + t * d; break;
    case 2: t = (lv - v01) / (v11 - v01); out[0] = x0 + t * d; out[1] = z0 + d; break;
    default: t = (lv - v00) / (v01 - v00); out[0] = x0; out[1] = z0 + t * d; break;
  }
}

function computeContours(interval) {
  segN = 0; idxN = 0;
  let maxH = 0;
  for (let k = 0; k < H.length; k++) if (H[k] > maxH) maxH = H[k];
  const lvArr = [];
  for (let lv = interval; lv < maxH - 1; lv += interval) lvArr.push(lv);
  const p = [0, 0], q = [0, 0];
  for (const lv of lvArr) {
    const isIdx = Math.round(lv / interval) % 5 === 0;
    for (let j = 0; j < N; j++) {
      for (let i = 0; i < N; i++) {
        const b = j * VS + i;
        const v00 = H[b], v10 = H[b + 1], v01 = H[b + VS], v11 = H[b + VS + 1];
        let m = 0;
        if (v00 > lv) m |= 1; if (v10 > lv) m |= 2; if (v11 > lv) m |= 4; if (v01 > lv) m |= 8;
        if (m === 0 || m === 15) continue;
        const pairs = EDGEPAIRS[m];
        for (const [e1, e2] of pairs) {
          edgePoint(e1, i, j, lv, v00, v10, v01, v11, p);
          edgePoint(e2, i, j, lv, v00, v10, v01, v11, q);
          const buf = isIdx ? idxBuf : segBuf;
          const n = (isIdx ? idxN : segN);
          if (n >= MAXSEG - 1) continue;
          const o = n * 6;
          buf[o] = p[0]; buf[o + 1] = lv / HSCALE + 0.012; buf[o + 2] = p[1];
          buf[o + 3] = q[0]; buf[o + 4] = lv / HSCALE + 0.012; buf[o + 5] = q[1];
          if (isIdx) idxN++; else segN++;
        }
      }
    }
  }
  contourLines.geometry.attributes.position.needsUpdate = true;
  contourLines.geometry.setDrawRange(0, segN * 2);
  indexLines.geometry.attributes.position.needsUpdate = true;
  indexLines.geometry.setDrawRange(0, idxN * 2);
  mapDirty = true;
}

const contourLines = new THREE.LineSegments(
  new THREE.BufferGeometry(),
  new THREE.LineBasicMaterial({ color: 0x5b3d1e, transparent: true, opacity: 0.78 })
);
contourLines.geometry.setAttribute('position', new THREE.BufferAttribute(segBuf, 3));
contourLines.frustumCulled = false;
const indexLines = new THREE.LineSegments(
  new THREE.BufferGeometry(),
  new THREE.LineBasicMaterial({ color: 0x9c2f14, transparent: true, opacity: 0.95 })
);
indexLines.geometry.setAttribute('position', new THREE.BufferAttribute(idxBuf, 3));
indexLines.frustumCulled = false;
terrainG.add(contourLines, indexLines);

/* 地面投影等高线（形成章节） */
const projLines = new THREE.LineSegments(
  new THREE.BufferGeometry(),
  new THREE.LineBasicMaterial({ color: 0xe8674a, transparent: true, opacity: 0.85 })
);
projLines.geometry.setAttribute('position', new THREE.BufferAttribute(segBuf, 3));
projLines.frustumCulled = false;
projLines.position.y = 0.004;
projLines.scale.y = 0.0001;   // 压扁到地面（复制同一缓冲，几何 y 由 scale 近似归零）
projLines.visible = false;
terrainG.add(projLines);

/* ---------------- 水面 ---------------- */

const water = new THREE.Mesh(
  new THREE.PlaneGeometry(S * 1.0001, S * 1.0001).rotateX(-Math.PI / 2),
  new THREE.MeshPhysicalMaterial({
    color: 0x2f7fc4, transparent: true, opacity: 0.55, roughness: 0.15, metalness: 0,
    clearcoat: 0.5, depthWrite: false, emissive: 0x0a2033, emissiveIntensity: 0.4,
  })
);
water.position.y = 0.5;
water.visible = false;
terrainG.add(water);

/* ---------------- 标注 ---------------- */

const peakMarker = new THREE.Mesh(
  new THREE.ConeGeometry(0.09, 0.24, 12),
  new THREE.MeshBasicMaterial({ color: 0xe8553a })
);
peakMarker.rotation.x = Math.PI;
const dashedMat = new THREE.LineDashedMaterial({ color: 0xe8674a, dashSize: 0.14, gapSize: 0.1, transparent: true, opacity: 0.9 });
const dropLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), dashedMat);

const measureMat = new THREE.LineBasicMaterial({ color: 0xffd166 });
const cliffMeasure = new THREE.Group();
cliffMeasure.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(
  [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1, 0)]), measureMat));

const labelSprites = {};
function addLabel(key, text, opts) {
  const o = opts || { fontSize: 30, color: '#ffd9a0', scale: 0.0042 };
  let sp = labelSprites[key];
  if (sp) { setSpriteText(sp, text, o); sp.visible = true; return sp; }
  sp = makeTextSprite(text, o);
  labelSprites[key] = sp;
  annoG.add(sp);
  return sp;
}

/* 山谷水流箭头 */
const valleyArrows = [];
{
  const arrowGeo = new THREE.ConeGeometry(0.05, 0.16, 10);
  const arrowMat = new THREE.MeshBasicMaterial({ color: 0x59b7ff });
  for (let k = 0; k < 4; k++) {
    const m = new THREE.Mesh(arrowGeo, arrowMat);
    valleyArrows.push(m); annoG.add(m);
  }
}

/* 剖面线（3D 贴地线） */
const profLine3D = new THREE.Line(
  new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array(160 * 3), 3)),
  new THREE.LineBasicMaterial({ color: 0xffd166 })
);
profLine3D.frustumCulled = false;
profLine3D.visible = false;
terrainG.add(profLine3D);

/* 鞍部旅行者 */
const travelers = [];
{
  const g = new THREE.SphereGeometry(0.06, 12, 10);
  for (const c of [0xff8c42, 0x59d999]) {
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: c }));
    m.visible = false; travelers.push(m); annoG.add(m);
  }
}

/* ---------------- 地形图窗口（2D） ---------------- */

const mapBox = document.createElement('div');
mapBox.className = 'coastal-window';
mapBox.id = 'mapBox';
mapBox.style.bottom = '86px';
mapBox.innerHTML = '<div class="cw-head"><b>地形图（俯视）</b><span class="cw-info">等高线</span></div>';
const mapCanvas = document.createElement('canvas');
mapCanvas.width = 480; mapCanvas.height = 480;
mapCanvas.style.position = 'relative';
mapCanvas.style.height = '232px';
mapBox.appendChild(mapCanvas);
stage.appendChild(mapBox);
const mctx = mapCanvas.getContext('2d');

const waterBuf = new Float32Array(24000 * 6);
let waterN = 0;
function computeWaterLine(level) {
  waterN = 0;
  const p = [0, 0], q = [0, 0];
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const b = j * VS + i;
      const v00 = H[b], v10 = H[b + 1], v01 = H[b + VS], v11 = H[b + VS + 1];
      let m = 0;
      if (v00 > level) m |= 1; if (v10 > level) m |= 2; if (v11 > level) m |= 4; if (v01 > level) m |= 8;
      if (m === 0 || m === 15) continue;
      for (const [e1, e2] of EDGEPAIRS[m]) {
        edgePoint(e1, i, j, level, v00, v10, v01, v11, p);
        edgePoint(e2, i, j, level, v00, v10, v01, v11, q);
        if (waterN >= 23999) break;
        const o = waterN * 6;
        waterBuf[o] = p[0]; waterBuf[o + 1] = level / HSCALE; waterBuf[o + 2] = p[1];
        waterBuf[o + 3] = q[0]; waterBuf[o + 4] = level / HSCALE; waterBuf[o + 5] = q[1];
        waterN++;
      }
    }
  }
}

let mapDirty = true;
function drawMap(waterLevel, showWater) {
  const W = mapCanvas.width, pad = 26;
  const px = (x) => pad + (x + S / 2) / S * (W - pad * 2);
  const py = (z) => pad + (z + S / 2) / S * (W - pad * 2);
  mctx.fillStyle = '#f5efdf';
  mctx.fillRect(0, 0, W, W);
  // 图框
  mctx.strokeStyle = '#b7a77f'; mctx.lineWidth = 2;
  mctx.strokeRect(pad, pad, W - pad * 2, W - pad * 2);
  // 等高线
  const draw = (buf, n, color, width) => {
    mctx.strokeStyle = color; mctx.lineWidth = width;
    mctx.beginPath();
    for (let k = 0; k < n; k++) {
      const o = k * 6;
      mctx.moveTo(px(buf[o]), py(buf[o + 2]));
      mctx.lineTo(px(buf[o + 3]), py(buf[o + 5]));
    }
    mctx.stroke();
  };
  draw(segBuf, segN, 'rgba(94,64,32,0.75)', 1.6);
  draw(idxBuf, idxN, 'rgba(150,44,18,0.95)', 3);
  // 水面切线
  if (showWater && waterLevel > 20) {
    computeWaterLine(waterLevel);
    mctx.strokeStyle = '#1d6fb8'; mctx.lineWidth = 3.4;
    mctx.setLineDash([]);
    mctx.beginPath();
    for (let k = 0; k < waterN; k++) {
      const o = k * 6;
      mctx.moveTo(px(waterBuf[o]), py(waterBuf[o + 2]));
      mctx.lineTo(px(waterBuf[o + 3]), py(waterBuf[o + 5]));
    }
    mctx.stroke();
    mctx.fillStyle = '#1d6fb8';
    mctx.font = '600 20px -apple-system,"PingFang SC",sans-serif';
    mctx.fillText('水面 ' + Math.round(waterLevel) + ' m', pad + 8, W - pad - 10);
  }
  // 指北针 + 等高距注记
  mctx.fillStyle = '#5e4020';
  mctx.font = '600 24px -apple-system,"PingFang SC",sans-serif';
  mctx.fillText('N', W - pad - 24, pad + 30);
  mctx.beginPath(); mctx.moveTo(W - pad - 18, pad + 34); mctx.lineTo(W - pad - 18, pad + 56); mctx.stroke();
  mctx.font = '500 17px -apple-system,"PingFang SC",sans-serif';
  mctx.fillText('等高距 ' + state.interval + ' 米', pad + 8, pad + 24);
  /* 同步图板（3D 沙盘侧）跟随重绘 */
  boardMapTex.needsUpdate = true;
  mapDirty = false;
}

/* ---------------- 剖面窗口（2D） ---------------- */

const profBox = document.createElement('div');
profBox.className = 'coastal-window';
profBox.id = 'profBox';
profBox.style.cssText += 'left:14px;right:auto;bottom:86px;width:330px;';
profBox.innerHTML = '<div class="cw-head"><b>地形剖面图</b><span class="cw-info">A → B</span></div>';
const profCanvas = document.createElement('canvas');
profCanvas.width = 620; profCanvas.height = 300;
profCanvas.style.position = 'relative';
profCanvas.style.height = '150px';
profBox.appendChild(profCanvas);
profBox.style.display = 'none';
stage.appendChild(profBox);
const pctx = profCanvas.getContext('2d');

/* ================= 沙盘展台与测绘道具阵列（场景叙事层，全部进入渲染路径） =================
 * 地形模型立于木纹沙盘桌上：黄铜包边 + 闭合嵌线放样 + 变截面桌腿；桌旁布置
 * 三脚架水准仪（漆面镜筒 / 黄铜件 / 玻璃窗 / 自发光水准泡分层）、红白测杆、
 * fbm 岩样、图筒、指北针、仪器箱、水准尺、海拔标尺柱，以及一块同步图板——
 * 图板实时镜像右下角地形图画布，等高距或水面一动即联动重绘。
 * 金属与玻璃的反射来自 makeStudioEnvironment 程序化摄影棚；小件均带接触阴影。 */

const TABLE_TOP = 0.02;                 // 沙盘桌面顶面（世界单位）
const tableG = new THREE.Group();       // 展台与道具：不随竖向夸张缩放
scene.add(tableG);

/* —— 变截面放样：沿 CatmullRom 曲线扫掠半径随弧长变化的管体 —— */
function sweepTube(curve, radiusFn, segs, radial, mat, closed = false) {
  const frames = curve.computeFrenetFrames(segs, closed);
  const pos = [], nor = [], idx = [];
  const P = new THREE.Vector3();
  const ring = radial + 1;
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    curve.getPointAt(closed ? t % 1 : t, P);
    const r = radiusFn(t);
    const N = frames.normals[Math.min(i, frames.normals.length - 1)];
    const B = frames.binormals[Math.min(i, frames.binormals.length - 1)];
    for (let j = 0; j <= radial; j++) {
      const a = (j / radial) * Math.PI * 2;
      const ca = Math.cos(a), sa = Math.sin(a);
      const nx = ca * N.x + sa * B.x, ny = ca * N.y + sa * B.y, nz = ca * N.z + sa * B.z;
      pos.push(P.x + nx * r, P.y + ny * r, P.z + nz * r);
      nor.push(nx, ny, nz);
    }
  }
  for (let i = 0; i < segs; i++) {
    for (let j = 0; j < radial; j++) {
      const a = i * ring + j, b = a + ring;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  geo.setIndex(idx);
  return new THREE.Mesh(geo, mat);
}

/* —— 同属性集几何拼接（本地实现，沿用 lab-motion 先例，免引 BufferGeometryUtils） —— */
function mergePlainGeos(list) {
  const parts = list.map((g0) => (g0.index ? g0.toNonIndexed() : g0));
  let total = 0;
  for (const p of parts) total += p.attributes.position.count;
  const pos = new Float32Array(total * 3);
  const nor = new Float32Array(total * 3);
  let off = 0;
  for (const p of parts) {
    pos.set(p.attributes.position.array, off * 3);
    nor.set(p.attributes.normal.array, off * 3);
    off += p.attributes.position.count;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  return out;
}

/* —— 接触阴影贴片（径向渐变，柔边不抢戏） —— */
const blobShadowTex = (() => {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const rg = g.createRadialGradient(64, 64, 6, 64, 64, 62);
  rg.addColorStop(0, 'rgba(8,10,14,0.5)');
  rg.addColorStop(0.55, 'rgba(8,10,14,0.24)');
  rg.addColorStop(1, 'rgba(8,10,14,0)');
  g.fillStyle = rg;
  g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
})();
function contactShadow(size, x, z, opacity = 1, y = TABLE_TOP + 0.004) {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(size, size),
    new THREE.MeshBasicMaterial({ map: blobShadowTex, transparent: true, opacity, depthWrite: false })
  );
  m.rotation.x = -Math.PI / 2;
  m.position.set(x, y, z);
  m.renderOrder = 2;
  tableG.add(m);
  return m;
}

/* 确定性伪随机（植被散点落位可复现） */
function seededRng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/* —— 沙盘桌材质族：木纹两变体 + 黄铜 + 钢 + 橡胶 —— */
const woodTexTop = makeWoodTexture({ base: '#7a5230', dark: '#58391d', light: '#9c744a', streaks: 120, bands: 9, seed: 41 });
woodTexTop.repeat.set(2.4, 2.4);
const woodMatTop = new THREE.MeshStandardMaterial({ map: woodTexTop, roughness: 0.62, metalness: 0.04 });
const woodTexDark = makeWoodTexture({ base: '#5b3d22', dark: '#402a14', light: '#7d5836', streaks: 80, bands: 6, seed: 77 });
const woodMatDark = new THREE.MeshStandardMaterial({ map: woodTexDark, roughness: 0.72, metalness: 0.03 });
const brassMat = new THREE.MeshStandardMaterial({ color: PAL.brass, roughness: 0.32, metalness: 0.85 });
const steelMat = new THREE.MeshStandardMaterial({ color: PAL.steel, roughness: 0.38, metalness: 0.75 });
const rubberMat = matStd(0x1d1f24, { roughness: 0.92 });

/* —— 桌体：面板 / 黄铜包边 / 闭合嵌线（CatmullRom 放样）/ 四腿变截面放样 / 裙板 —— */
const tableTop = new THREE.Mesh(new THREE.BoxGeometry(13.8, 0.24, 13.8), woodMatTop);
tableTop.position.y = TABLE_TOP - 0.12;
tableG.add(tableTop);

const brassBand = new THREE.Mesh(new THREE.BoxGeometry(13.92, 0.07, 13.92), brassMat);
brassBand.position.y = TABLE_TOP - 0.025;
tableG.add(brassBand);

const inlayPts = [];
for (let k = 0; k < 14; k++) {
  const a = (k / 14) * Math.PI * 2;
  const rr = 5.92 + 0.14 * Math.sin(a * 3);
  inlayPts.push(new THREE.Vector3(Math.cos(a) * rr, TABLE_TOP + 0.012, Math.sin(a) * rr));
}
const inlayCurve = new THREE.CatmullRomCurve3(inlayPts, true, 'catmullrom', 0.6);
tableG.add(sweepTube(inlayCurve, () => 0.02, 150, 8, brassMat, true));

for (const [lx, lz] of [[-6.1, -6.1], [6.1, -6.1], [6.1, 6.1], [-6.1, 6.1]]) {
  const dl = Math.SQRT1_2;
  const pts = [];
  for (let k = 0; k <= 6; k++) {
    const t = k / 6;
    pts.push(new THREE.Vector3(
      lx + dl * 0.17 * t + Math.sin(t * 2.6) * 0.03,
      -0.2 - 1.52 * t,
      lz + dl * 0.17 * t + Math.cos(t * 2.2) * 0.03
    ));
  }
  tableG.add(sweepTube(new THREE.CatmullRomCurve3(pts), (t) => 0.135 - 0.045 * t, 24, 10, woodMatDark));
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.17, 0.07, 14), rubberMat);
  foot.position.set(lx + dl * 0.17, -1.735, lz + dl * 0.17);
  tableG.add(foot);
}
for (const s of [-1, 1]) {
  const apronX = new THREE.Mesh(new THREE.BoxGeometry(11.4, 0.34, 0.18), woodMatDark);
  apronX.position.set(0, -0.44, s * 5.72);
  tableG.add(apronX);
  const apronZ = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.34, 11.4), woodMatDark);
  apronZ.position.set(s * 5.72, -0.44, 0);
  tableG.add(apronZ);
}
/* 桌面定位铜销一周（InstancedMesh，模型摆放基准） */
{
  const pinGeo = new THREE.CylinderGeometry(0.05, 0.065, 0.1, 10);
  const pins = new THREE.InstancedMesh(pinGeo, brassMat, 12);
  const m4 = new THREE.Matrix4();
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2 + 0.26;
    const rr = 5.55 + 0.3 * (((k * 7) % 5) / 5);
    m4.makeTranslation(Math.cos(a) * rr, TABLE_TOP + 0.05, Math.sin(a) * rr);
    pins.setMatrixAt(k, m4);
  }
  pins.instanceMatrix.needsUpdate = true;
  tableG.add(pins);
}
contactShadow(11.6, 0, 0, 0.9);           // 地形模型在桌面上的落影

/* —— 同步图板：3D 侧实时镜像地形图画布（等高距 / 水面一变即重绘） —— */
const boardMapTex = new THREE.CanvasTexture(mapCanvas);
boardMapTex.colorSpace = THREE.SRGBColorSpace;
boardMapTex.anisotropy = 8;
const boardG = new THREE.Group();
boardG.position.set(4.95, TABLE_TOP, 3.55);
boardG.rotation.y = -0.22;
tableG.add(boardG);
const boardBase = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.09, 3.6), woodMatTop);
boardBase.position.y = 0.045;
boardG.add(boardBase);
const boardFace = new THREE.Mesh(
  new THREE.PlaneGeometry(3.14, 3.14),
  new THREE.MeshBasicMaterial({ map: boardMapTex })
);
boardFace.rotation.x = -Math.PI / 2;
boardFace.position.y = 0.096;
boardG.add(boardFace);
/* 图板黄铜角扣 ×4 + 背面斜撑 ×2 */
{
  const clipGeo = new THREE.BoxGeometry(0.26, 0.035, 0.1);
  const clips = new THREE.InstancedMesh(clipGeo, brassMat, 4);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  const pv = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1);
  [[-1, -1, 0], [1, -1, Math.PI / 2], [1, 1, Math.PI], [-1, 1, -Math.PI / 2]].forEach(([cx, cz, rot], k) => {
    e.set(0, rot, 0);
    q.setFromEuler(e);
    pv.set(cx * 1.68, 0.106, cz * 1.68);
    m4.compose(pv, q, one);
    clips.setMatrixAt(k, m4);
  });
  clips.instanceMatrix.needsUpdate = true;
  boardG.add(clips);
}
for (const s of [-1, 1]) {
  const brace = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.5, 8), steelMat);
  brace.position.set(s * 1.15, -0.62, 1.5);
  brace.rotation.x = 0.83;
  boardG.add(brace);
}
const boardLegendTex = makeLabelTexture(['沙盘同步图板', 'CONTOUR · LIVE MIRROR'], { w: 512, h: 96, accent: '#7a4a20', lineSizes: [38, 20] });
const boardLegend = new THREE.Mesh(new THREE.PlaneGeometry(1.95, 0.37), new THREE.MeshBasicMaterial({ map: boardLegendTex }));
boardLegend.rotation.set(-Math.PI / 2, 0, 0);
boardLegend.position.set(0, 0.012, 2.08);
boardG.add(boardLegend);

/* —— 桌面比例尺条（程序化黑白分段 + 刻字） —— */
const scaleBarTex = (() => {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 48;
  const g = c.getContext('2d');
  g.fillStyle = '#efe6cf';
  g.fillRect(0, 0, 512, 48);
  g.strokeStyle = '#241a10';
  g.lineWidth = 4;
  g.strokeRect(3, 8, 505, 22);
  for (let k = 0; k < 8; k++) {
    g.fillStyle = k % 2 ? '#efe6cf' : '#241a10';
    g.fillRect(5 + k * 62, 10, 62, 18);
  }
  g.fillStyle = '#241a10';
  g.font = '700 15px "JetBrains Mono", monospace';
  g.textAlign = 'center';
  g.fillText('0', 6, 45);
  g.fillText('1', 191, 45);
  g.fillText('2 km', 448, 45);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
})();
const scaleBar = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 0.22), new THREE.MeshBasicMaterial({ map: scaleBarTex }));
scaleBar.rotation.set(-Math.PI / 2, 0, 0.06);
scaleBar.position.set(-2.6, TABLE_TOP + 0.012, 5.9);
tableG.add(scaleBar);

/* —— 地形模型铭牌（黄铜底板 + 纸标贴） —— */
const plateTex = makeLabelTexture(['等高线沙盘模型', 'CONTOUR RELIEF TABLE'], { w: 512, h: 96, accent: '#8a6a2a', lineSizes: [36, 19] });
const plate = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.05, 0.5), brassMat);
plate.position.set(0.9, TABLE_TOP + 0.025, 6.35);
plate.rotation.y = 0.04;
tableG.add(plate);
const plateFace = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.36), new THREE.MeshBasicMaterial({ map: plateTex }));
plateFace.rotation.set(-Math.PI / 2, 0, -0.04);
plateFace.position.set(0.9, TABLE_TOP + 0.052, 6.35);
tableG.add(plateFace);

/* —— 测绘三脚架 + 水准仪：腿为变截面放样；漆面镜筒（clearcoat）/ 黄铜件 / 玻璃窗 / 自发光水准泡 —— */
const tripodG = new THREE.Group();
tripodG.position.set(-5.15, TABLE_TOP, -4.7);
tripodG.rotation.y = 0.5;
tableG.add(tripodG);

const paintMat = matCoat(0x2e4a3e, { roughness: 0.3, metalness: 0.06, clearcoatRoughness: 0.2 });
const hubMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.19, 0.14, 16), brassMat);
hubMesh.position.y = 1.18;
tripodG.add(hubMesh);
for (let k = 0; k < 3; k++) {
  const ang = (k / 3) * Math.PI * 2 + 0.4;
  const ux = Math.cos(ang), uz = Math.sin(ang);
  const pts = [];
  for (let j = 0; j <= 6; j++) {
    const t = j / 6;
    pts.push(new THREE.Vector3(
      ux * (0.1 + 0.64 * t),
      1.14 - 1.3 * t + Math.sin(t * 3.4) * 0.02,
      uz * (0.1 + 0.64 * t)
    ));
  }
  tripodG.add(sweepTube(new THREE.CatmullRomCurve3(pts), (t) => 0.052 - 0.02 * t, 22, 10, steelMat));
  const shoe = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.12, 10), brassMat);
  shoe.rotation.x = Math.PI;
  shoe.position.set(ux * 0.74, -0.22, uz * 0.74);
  tripodG.add(shoe);
}
const post = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.22, 12), steelMat);
post.position.y = 1.36;
tripodG.add(post);
const trimKnob = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.05, 12), brassMat);
trimKnob.rotation.z = Math.PI / 2;
trimKnob.position.set(0.13, 1.3, 0.05);
tripodG.add(trimKnob);

const scopeG = new THREE.Group();
scopeG.position.y = 1.52;
scopeG.rotation.y = -0.7;
tripodG.add(scopeG);
const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.095, 0.95, 18), paintMat);
barrel.rotation.z = Math.PI / 2;
scopeG.add(barrel);
const objRing = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.1, 0.1, 18), brassMat);
objRing.rotation.z = Math.PI / 2;
objRing.position.x = 0.47;
scopeG.add(objRing);
const objGlass = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.03, 18), matGlass(0xcfe4ee));
objGlass.rotation.z = Math.PI / 2;
objGlass.position.x = 0.5;
scopeG.add(objGlass);
const eyepiece = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.075, 0.16, 14), brassMat);
eyepiece.rotation.z = Math.PI / 2;
eyepiece.position.x = -0.53;
scopeG.add(eyepiece);
const eyeGlass = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.048, 0.02, 14), matGlass(0xd8ecf4));
eyeGlass.rotation.z = Math.PI / 2;
eyeGlass.position.x = -0.6;
scopeG.add(eyeGlass);
const vialGlass = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.16, 12), matGlass(0xd6f2ea, { roughness: 0.1 }));
vialGlass.position.y = 0.125;
scopeG.add(vialGlass);
const vialBubble = new THREE.Mesh(new THREE.SphereGeometry(0.02, 10, 8), matGlow(0x59d999, 1.3));
vialBubble.position.y = 0.168;
scopeG.add(vialBubble);
contactShadow(2.7, -5.15, -4.7, 0.8);

/* —— 红白测杆 ×2（程序化环纹贴图 + 黄铜尖顶） —— */
const poleTex = (() => {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 256;
  const g = c.getContext('2d');
  for (let k = 0; k < 8; k++) {
    g.fillStyle = k % 2 ? '#d8402a' : '#f2ede2';
    g.fillRect(0, k * 32, 64, 32);
  }
  g.fillStyle = 'rgba(0,0,0,0.16)';
  g.fillRect(0, 0, 9, 256);
  g.fillRect(55, 0, 9, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
})();
const poleMat = new THREE.MeshStandardMaterial({ map: poleTex, roughness: 0.5, metalness: 0.05 });
for (const [px, pz, lean] of [[5.7, -3.2, 0.1], [-4.3, 4.9, -0.14]]) {
  const poleG = new THREE.Group();
  poleG.position.set(px, TABLE_TOP, pz);
  poleG.rotation.z = lean;
  tableG.add(poleG);
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 2.1, 12), poleMat);
  rod.position.y = 1.05;
  poleG.add(rod);
  const rodTip = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.14, 10), brassMat);
  rodTip.position.y = 2.16;
  poleG.add(rodTip);
  contactShadow(0.85, px, pz, 0.75);
}

/* —— 岩样 ×3：fbm 顶点扰动 + 平直着色，冷暖两族材质 —— */
const rockMatCool = new THREE.MeshStandardMaterial({ color: 0x6f6a62, roughness: 0.95, metalness: 0.02, flatShading: true });
const rockMatWarm = new THREE.MeshStandardMaterial({ color: 0x8a705a, roughness: 0.9, metalness: 0.02, flatShading: true });
for (const [rx, rz, rr, rmat, seedv] of [
  [3.9, -5.3, 0.34, rockMatCool, 11], [-3.6, -5.5, 0.26, rockMatWarm, 23], [6.15, 1.6, 0.2, rockMatCool, 37],
]) {
  const rockGeo = new THREE.IcosahedronGeometry(rr, 1);
  const pa = rockGeo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pa.count; i++) {
    v.fromBufferAttribute(pa, i);
    const d = 1 + 0.3 * fbm3(v.x * 3.2, v.y * 3.2, v.z * 3.2, seedv);
    pa.setXYZ(i, v.x * d, v.y * d * 0.8, v.z * d);
  }
  rockGeo.computeVertexNormals();
  const rock = new THREE.Mesh(rockGeo, rmat);
  rock.position.set(rx, TABLE_TOP + rr * 0.6, rz);
  rock.rotation.y = seedv;
  tableG.add(rock);
  contactShadow(rr * 4.6, rx, rz, 0.7);
}

/* —— 图筒 ×2（纸面 sheen + 木端盖 + 黄铜捆带） —— */
const scrollMat = matSheen(0xd9c9a8, { roughness: 0.66 });
for (const [sx, sz, ry] of [[2.1, 5.5, 0.5], [2.75, 5.95, -0.3]]) {
  const scrollG = new THREE.Group();
  scrollG.position.set(sx, TABLE_TOP + 0.09, sz);
  scrollG.rotation.set(0, ry, Math.PI / 2 - 0.03);
  tableG.add(scrollG);
  scrollG.add(new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 1.5, 14), scrollMat));
  for (const s of [-1, 1]) {
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.098, 0.098, 0.09, 14), woodMatDark);
    cap.position.y = s * 0.78;
    scrollG.add(cap);
  }
  const strap = new THREE.Mesh(new THREE.TorusGeometry(0.092, 0.014, 8, 18), brassMat);
  strap.rotation.x = Math.PI / 2;
  scrollG.add(strap);
}

/* —— 仪器箱（掀盖 + 黄铜锁扣 + 提手 + 标贴） —— */
const caseG = new THREE.Group();
caseG.position.set(-1.35, TABLE_TOP, -5.65);
caseG.rotation.y = 0.28;
tableG.add(caseG);
const caseBody = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.42, 0.85), woodMatDark);
caseBody.position.y = 0.21;
caseG.add(caseBody);
const caseLid = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.07, 0.85), woodMatDark);
caseLid.position.set(0, 0.44, -0.55);
caseLid.rotation.x = -1.25;
caseG.add(caseLid);
for (const s of [-1, 1]) {
  const latch = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.11, 0.04), brassMat);
  latch.position.set(s * 0.6, 0.4, 0.44);
  caseG.add(latch);
}
const caseHandle = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.02, 8, 16, Math.PI), brassMat);
caseHandle.position.set(0, 0.42, 0.43);
caseG.add(caseHandle);
const caseLabelTex = makeLabelTexture(['测绘仪器箱', 'SURVEY KIT'], { w: 256, h: 96, accent: '#5a4a8a', lineSizes: [30, 16] });
const caseLabel = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 0.27), new THREE.MeshBasicMaterial({ map: caseLabelTex }));
caseLabel.position.set(-0.25, 0.22, 0.432);
caseG.add(caseLabel);
contactShadow(2.2, -1.35, -5.65, 0.75);

/* —— 水准尺（E 形分划程序化贴图，平放桌面） —— */
const staffTex = (() => {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 512;
  const g = c.getContext('2d');
  g.fillStyle = '#f2ecdc';
  g.fillRect(0, 0, 64, 512);
  g.fillRect(0, 0, 5, 512);
  for (let b = 0; b < 8; b++) {
    const y0 = b * 64;
    g.fillStyle = '#1e1a12';
    g.fillRect(5, y0, 20, 64);
    for (let d = 0; d < 4; d++) g.fillRect(5 + d * 13, y0, 6, 64);
    g.fillRect(5, y0 + 60, 54, 4);
    g.font = '700 17px "JetBrains Mono", monospace';
    g.fillText(String(b), 44, y0 + 40);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
})();
const staffMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 1.9), new THREE.MeshBasicMaterial({ map: staffTex }));
staffMesh.rotation.set(-Math.PI / 2, 0, Math.PI / 2 + 0.1);
staffMesh.position.set(-2.9, TABLE_TOP + 0.014, -5.3);
tableG.add(staffMesh);
contactShadow(1.6, -2.9, -5.3, 0.6);

/* —— 海拔标尺柱：刻度贴图双面竖立，与模型并立的读数参照 —— */
const altColTex = (() => {
  const c = document.createElement('canvas');
  c.width = 96; c.height = 512;
  const g = c.getContext('2d');
  g.fillStyle = '#efe8d6';
  g.fillRect(0, 0, 96, 512);
  g.fillStyle = '#241a10';
  g.font = '600 20px "JetBrains Mono", monospace';
  g.textAlign = 'left';
  for (let m = 0; m <= 1600; m += 200) {
    const y = 500 - (m / 1600) * 470;
    const major = m % 400 === 0;
    g.fillRect(6, y - (major ? 2 : 1), major ? 42 : 24, major ? 4 : 2);
    if (major) g.fillText(String(m), 52, y + 7);
  }
  g.font = '700 18px "JetBrains Mono", monospace';
  g.fillText('m', 52, 505);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
})();
const altColumn = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 2.24), new THREE.MeshBasicMaterial({ map: altColTex, side: THREE.DoubleSide }));
altColumn.position.set(-6.0, TABLE_TOP + 1.14, 1.4);
altColumn.rotation.y = Math.PI / 2;
tableG.add(altColumn);
const altColPost = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 2.3, 8), woodMatDark);
altColPost.position.set(-6.0, TABLE_TOP + 1.15, 1.4);
tableG.add(altColPost);

/* —— 桌面指北针：黄铜环 + 玫瑰盘面 + 磁针（帧循环轻微摆动）+ 玻璃穹盖 —— */
const dialTex = (() => {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#f4ecd9';
  g.beginPath();
  g.arc(64, 64, 62, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = '#6b4a26';
  g.lineWidth = 3;
  g.beginPath();
  g.arc(64, 64, 56, 0, Math.PI * 2);
  g.stroke();
  g.fillStyle = '#241a10';
  g.font = '700 26px "JetBrains Mono", monospace';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText('N', 64, 26);
  g.fillText('S', 64, 102);
  g.fillText('W', 26, 64);
  g.fillText('E', 102, 64);
  for (let k = 0; k < 12; k++) {
    const ang = (k / 12) * Math.PI * 2;
    g.beginPath();
    g.moveTo(64 + Math.cos(ang) * 46, 64 + Math.sin(ang) * 46);
    g.lineTo(64 + Math.cos(ang) * 52, 64 + Math.sin(ang) * 52);
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
})();
const compassG = new THREE.Group();
compassG.position.set(3.3, TABLE_TOP, 5.75);
tableG.add(compassG);
const cRing = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.032, 10, 26), brassMat);
cRing.rotation.x = Math.PI / 2;
cRing.position.y = 0.055;
compassG.add(cRing);
const cDial = new THREE.Mesh(new THREE.CircleGeometry(0.24, 26), new THREE.MeshBasicMaterial({ map: dialTex }));
cDial.rotation.x = -Math.PI / 2;
cDial.position.y = 0.05;
compassG.add(cDial);
const needlePivot = new THREE.Group();
needlePivot.position.y = 0.075;
needlePivot.rotation.z = -0.4;
compassG.add(needlePivot);
const needleN = new THREE.Mesh(new THREE.ConeGeometry(0.026, 0.2, 8), new THREE.MeshBasicMaterial({ color: 0xc23a24 }));
needleN.position.y = 0.1;
needlePivot.add(needleN);
const needleS = new THREE.Mesh(new THREE.ConeGeometry(0.026, 0.16, 8), new THREE.MeshBasicMaterial({ color: 0x2a2d33 }));
needleS.rotation.x = Math.PI;
needleS.position.y = -0.08;
needlePivot.add(needleS);
const cPivot = new THREE.Mesh(new THREE.SphereGeometry(0.02, 10, 8), brassMat);
needlePivot.add(cPivot);
const cGlass = new THREE.Mesh(
  new THREE.SphereGeometry(0.27, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2),
  matGlass(0xdfeef2, { roughness: 0.08, transmission: 0.9 })
);
cGlass.position.y = 0.05;
compassG.add(cGlass);
contactShadow(0.95, 3.3, 5.75, 0.7);

/* —— 沙盘植被：针叶 / 阔叶 / 灌丛三族 InstancedMesh，落点贴地、随地形变形与竖向夸张联动 —— */
const coniferGeo = mergePlainGeos([
  new THREE.ConeGeometry(0.17, 0.4, 7).translate(0, 0.24, 0),
  new THREE.ConeGeometry(0.13, 0.3, 7).translate(0, 0.5, 0),
  new THREE.CylinderGeometry(0.028, 0.036, 0.14, 6).translate(0, 0.07, 0),
]);
const broadGeo = mergePlainGeos([
  new THREE.IcosahedronGeometry(0.17, 0).scale(1, 1.2, 1).translate(0, 0.3, 0),
  new THREE.CylinderGeometry(0.03, 0.04, 0.18, 6).translate(0, 0.09, 0),
]);
const bushGeo = new THREE.IcosahedronGeometry(0.1, 0).scale(1, 0.72, 1);
const foliageHex = [0x2f5d33, 0x3a6b38, 0x4a7a3a, 0x55823f, 0x2a5030, 0x5d8a46];
const coniferIM = new THREE.InstancedMesh(coniferGeo, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.82, flatShading: true }), 30);
const broadIM = new THREE.InstancedMesh(broadGeo, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85, flatShading: true }), 16);
const bushIM = new THREE.InstancedMesh(bushGeo, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, flatShading: true }), 18);
coniferIM.frustumCulled = false;
broadIM.frustumCulled = false;
bushIM.frustumCulled = false;
annoG.add(coniferIM, broadIM, bushIM);

const treeSlots = (() => {
  const rng = seededRng(20261106);
  const spots = [];
  let guard = 0;
  while (spots.length < 46 && guard++ < 5000) {
    const x = (rng() * 2 - 1) * 4.55;
    const z = (rng() * 2 - 1) * 4.55;
    if (Math.hypot(x, z) < 1.0) continue;                    // 主峰顶留白
    let clear = true;
    for (const s of spots) {
      if (Math.hypot(s[0] - x, s[1] - z) < 0.62) { clear = false; break; }
    }
    if (!clear) continue;
    spots.push([x, z, 0.62 + rng() * 0.5, rng() * Math.PI * 2]);
  }
  return spots;
})();
const bushSlots = (() => {
  const rng = seededRng(7311);
  const spots = [];
  let guard = 0;
  while (spots.length < 18 && guard++ < 3000) {
    const x = (rng() * 2 - 1) * 4.7;
    const z = (rng() * 2 - 1) * 4.7;
    let clear = true;
    for (const s of [...treeSlots, ...spots]) {
      if (Math.hypot(s[0] - x, s[1] - z) < 0.4) { clear = false; break; }
    }
    if (!clear) continue;
    spots.push([x, z, 0.7 + rng() * 0.7, rng() * Math.PI * 2]);
  }
  return spots;
})();

const _treeM4 = new THREE.Matrix4();
const _treeQ = new THREE.Quaternion();
const _treeP = new THREE.Vector3();
const _treeS = new THREE.Vector3();
const _treeUp = new THREE.Vector3(0, 1, 0);
const _treeColor = new THREE.Color();
function layoutTrees() {
  /* 形成章水面漫升：水位线以下的植被随之没顶隐去 */
  const waterBar = state.preset === 'formation' ? Math.max(160, state.waterLevel) : 160;
  let ci = 0, bi = 0;
  for (let k = 0; k < treeSlots.length; k++) {
    const [x, z, sc, rot] = treeSlots[k];
    const conifer = k % 3 !== 2;                              // 约 2/3 针叶
    const h = bilinear(x, z);
    _treeQ.setFromAxisAngle(_treeUp, rot);
    _treeS.setScalar(h < waterBar || h > 1320 ? 0.0001 : sc * (conifer ? 1 : 0.92));
    _treeP.set(x, h / HSCALE * state.exaggeration - 0.012, z);
    _treeM4.compose(_treeP, _treeQ, _treeS);
    if (conifer && ci < 30) {
      coniferIM.setColorAt(ci, _treeColor.setHex(foliageHex[k % foliageHex.length]));
      coniferIM.setMatrixAt(ci++, _treeM4);
    } else if (bi < 16) {
      broadIM.setColorAt(bi, _treeColor.setHex(foliageHex[(k + 2) % foliageHex.length]));
      broadIM.setMatrixAt(bi++, _treeM4);
    }
  }
  coniferIM.count = ci;
  broadIM.count = bi;
  let bu = 0;
  for (let k = 0; k < bushSlots.length && bu < 18; k++) {
    const [x, z, sc, rot] = bushSlots[k];
    const h = bilinear(x, z);
    _treeQ.setFromAxisAngle(_treeUp, rot);
    _treeS.setScalar(h < waterBar || h > 1300 ? 0.0001 : sc);
    _treeP.set(x, h / HSCALE * state.exaggeration - 0.008, z);
    _treeM4.compose(_treeP, _treeQ, _treeS);
    bushIM.setColorAt(bu, _treeColor.setHex(foliageHex[(k + 4) % foliageHex.length]));
    bushIM.setMatrixAt(bu++, _treeM4);
  }
  bushIM.count = bu;
  for (const im of [coniferIM, broadIM, bushIM]) {
    im.instanceMatrix.needsUpdate = true;
    if (im.instanceColor) im.instanceColor.needsUpdate = true;
  }
}

/* —— 登山路线丝带：CatmullRom 贴地放样（鞍部章两条路线，行人沿线行走） —— */
const routeMatA = new THREE.MeshBasicMaterial({ color: 0xff8c42, transparent: true, opacity: 0.72, depthWrite: false });
const routeMatB = new THREE.MeshBasicMaterial({ color: 0x3fbf8a, transparent: true, opacity: 0.72, depthWrite: false });
const routeWays = [
  [[-1.75, 0.35], [-1.2, 0.22], [-0.6, 0.12], [0, 0], [0.6, -0.12], [1.2, -0.24], [1.75, -0.35]],
  [[-1.75, 0.35], [-1.3, 1.05], [-0.7, 1.62], [0.35, 2.2], [1.05, 1.4], [1.5, 0.6], [1.75, -0.35]],
];
const routeCurves = [];
const routeMeshes = [];
let routesBuilt = false;
function ensureRoutes() {
  if (routesBuilt) return;
  routesBuilt = true;
  routeWays.forEach((ways, k) => {
    const pts3 = ways.map(([wx, wz]) => new THREE.Vector3(wx, bilinear(wx, wz) / HSCALE + 0.04, wz));
    const curve = new THREE.CatmullRomCurve3(pts3, false, 'catmullrom', 0.5);
    routeCurves.push(curve);
    const ribbon = sweepTube(curve, (t) => 0.032 + 0.014 * Math.sin(t * Math.PI), 96, 8, k === 0 ? routeMatA : routeMatB);
    ribbon.visible = false;
    terrainG.add(ribbon);
    routeMeshes.push(ribbon);
  });
}

/* ---- 浮窗折叠：整窗收成 40px 圆形徽标（图/剖），localStorage 记忆 + ≤1100px 首访默认折叠 ---- */

const FLOAT_SPECS = [
  { name: 'map', win: mapBox, badge: '图', key: 'contour.foldMap', label: '收起地形图小窗' },
  { name: 'prof', win: profBox, badge: '剖', key: 'contour.foldProf', label: '收起地形剖面图小窗' },
];
const floatFold = {};
function makeFloatFold({ name, win, badge, key, label }) {
  const head = win.querySelector('.cw-head');
  const foldBtn = document.createElement('button');
  foldBtn.type = 'button';
  foldBtn.className = 'fold-btn';
  foldBtn.textContent = '−';
  foldBtn.setAttribute('aria-label', label);
  foldBtn.setAttribute('aria-expanded', 'true');
  foldBtn.setAttribute('aria-controls', win.id);
  foldBtn.title = label;
  head.appendChild(foldBtn);
  const badgeBtn = document.createElement('button');
  badgeBtn.type = 'button';
  badgeBtn.className = 'cw-badge';
  badgeBtn.textContent = badge;
  badgeBtn.setAttribute('aria-label', label.replace('收起', '展开'));
  badgeBtn.title = label.replace('收起', '展开');
  win.appendChild(badgeBtn);
  let saved = null;
  try { saved = localStorage.getItem(key); } catch (e) { /* 忽略 */ }
  /* 首访（无记忆）：≤1100px 默认折叠成徽标（清爽态）；用户操作后按记忆走 */
  floatFold[name] = saved !== null ? saved === '1' : NARROW_VIEW;
  const apply = () => {
    win.classList.toggle('folded', floatFold[name]);
    foldBtn.setAttribute('aria-expanded', String(!floatFold[name]));
  };
  foldBtn.addEventListener('click', () => {
    floatFold[name] = !floatFold[name];
    try { localStorage.setItem(key, floatFold[name] ? '1' : '0'); } catch (e) { /* 忽略 */ }
    apply();
  });
  badgeBtn.addEventListener('click', () => {
    floatFold[name] = !floatFold[name];
    try { localStorage.setItem(key, floatFold[name] ? '1' : '0'); } catch (e) { /* 忽略 */ }
    apply();
  });
  apply();
}

function profileHeights(dir, off, n = 120) {
  const pts = [];
  const c = Math.cos(dir * Math.PI / 180), s = Math.sin(dir * Math.PI / 180);
  for (let k = 0; k <= n; k++) {
    const t = (k / n) * 2 - 1;               // -1..1
    const x = c * t * 4.6 - s * off;
    const z = s * t * 4.6 + c * off;
    pts.push([x, z, bilinear(x, z)]);
  }
  return pts;
}

function bilinear(x, z) {
  const fx = clamp((x + S / 2) / S * N, 0, N - 1e-6);
  const fz = clamp((z + S / 2) / S * N, 0, N - 1e-6);
  const i = Math.floor(fx), j = Math.floor(fz), ax = fx - i, az = fz - j;
  const b = j * VS + i;
  return H[b] * (1 - ax) * (1 - az) + H[b + 1] * ax * (1 - az) + H[b + VS] * (1 - ax) * az + H[b + VS + 1] * ax * az;
}

function drawProfile(dir, off, smoothW) {
  const W = profCanvas.width, Hp = profCanvas.height, padL = 58, padB = 34, padT = 18;
  let pts = profileHeights(dir, off);
  if (smoothW > 1) {
    const out = pts.map((p, k) => {
      let s = 0, n = 0;
      for (let d = -((smoothW - 1) / 2); d <= (smoothW - 1) / 2; d++) {
        const kk = clamp(k + d, 0, pts.length - 1); s += pts[kk][2]; n++;
      }
      return [p[0], p[1], s / n];
    });
    pts = out;
  }
  const maxH = Math.max(600, Math.ceil(Math.max(...pts.map((p) => p[2])) / 200) * 200);
  const X = (k) => padL + (k / (pts.length - 1)) * (W - padL - 14);
  const Y = (h) => Hp - padB - (h / maxH) * (Hp - padB - padT);
  pctx.clearRect(0, 0, W, Hp);
  // 网格与高程刻度
  pctx.font = '500 15px -apple-system,"PingFang SC",sans-serif';
  pctx.textAlign = 'right';
  for (let h = 0; h <= maxH; h += 200) {
    pctx.strokeStyle = 'rgba(128,116,88,0.3)'; pctx.lineWidth = 1;
    pctx.beginPath(); pctx.moveTo(padL, Y(h)); pctx.lineTo(W - 14, Y(h)); pctx.stroke();
    pctx.fillStyle = '#8a7a58';
    pctx.fillText(h + 'm', padL - 6, Y(h) + 5);
  }
  // 地形剖面
  pctx.beginPath();
  pctx.moveTo(X(0), Y(pts[0][2]));
  pts.forEach((p, k) => pctx.lineTo(X(k), Y(p[2])));
  pctx.lineTo(X(pts.length - 1), Hp - padB);
  pctx.lineTo(X(0), Hp - padB);
  pctx.closePath();
  const grad = pctx.createLinearGradient(0, padT, 0, Hp - padB);
  grad.addColorStop(0, '#c8a05e'); grad.addColorStop(1, '#8a6a3c');
  pctx.fillStyle = grad; pctx.fill();
  pctx.beginPath();
  pctx.moveTo(X(0), Y(pts[0][2]));
  pts.forEach((p, k) => pctx.lineTo(X(k), Y(p[2])));
  pctx.strokeStyle = '#6e4a1e'; pctx.lineWidth = 3; pctx.stroke();
  // A/B 端点
  pctx.fillStyle = '#c2452a'; pctx.font = '700 20px -apple-system,"PingFang SC",sans-serif'; pctx.textAlign = 'center';
  pctx.fillText('A', X(0), Y(pts[0][2]) - 10);
  pctx.fillText('B', X(pts.length - 1), Y(pts[pts.length - 1][2]) - 10);
  pctx.textAlign = 'left';
  pctx.fillStyle = '#8a7a58';
  pctx.fillText('水平距离约 9.2 km', padL, Hp - 10);
}

/* ---------------- HUD ---------------- */

const hud = makeHUD(document.getElementById('lcData'), [['a', '读数 A'], ['b', '读数 B'], ['x', '']]);
hud.show(false);

/* ---------------- 状态与控制条 ---------------- */

const state = {
  preset: 'overview', interval: 150, exaggeration: 1,
  waterLevel: 700, showWater: false, autoRise: false,
  showContours: true, showMap: true, showLabels: false,
  dirDeg: 0, profOff: 0, smoothW: 1,
  route: false, routeT: 0,
};

const ctl = createControlsPanel(document.getElementById('controls'));

function exaggerationCtl() {
  return ctl.slider({
    label: '竖向夸张', min: 1, max: 2.6, step: 0.1, value: state.exaggeration,
    fmt: (v) => v.toFixed(1) + '×',
    onInput: (v) => { state.exaggeration = v; terrainG.scale.y = v; layoutAnnos(); },
  });
}
function contourToggle() {
  return ctl.toggle({
    label: '等高线', value: state.showContours,
    onChange: (v) => {
      state.showContours = v;
      contourLines.visible = v; indexLines.visible = v;
      mapDirty = true;
    },
  });
}
function mapToggle() {
  return ctl.toggle({
    label: '地形图', value: state.showMap,
    onChange: (v) => { state.showMap = v; mapBox.style.display = v ? '' : 'none'; },
  });
}
function intervalCtl() {
  return ctl.slider({
    label: '等高距', min: 50, max: 300, step: 25, value: state.interval,
    fmt: (v) => v + ' m',
    onInput: (v) => { state.interval = v; computeContours(v); hud.set('x', '等高距 ' + v + ' m'); },
  });
}

/* ---------------- 章节定义 ---------------- */

function setPreset(name, instant = false) {
  state.preset = name;
  if (!Hfrom) Hfrom = new Float32Array(H);
  Hfrom.set(H);
  samplePreset(name);
  if (Hto) Hto.set(H); else Hto = new Float32Array(H);
  if (instant) { H.set(Hto); morphT = 1; applyHeights(); computeContours(state.interval); layoutAnnos(); }
  else morphT = 0;
}

function layoutAnnos() {
  const ex = state.exaggeration;
  for (const key of Object.keys(labelSprites)) {
    const it = ANNO_POS[key];
    if (it) labelSprites[key].position.set(it[0], it[1] / HSCALE * ex + (it[3] || 0.12), it[2]);
  }
  // 山谷箭头
  const vpts = [[1.7, -2.2], [1.7, -0.9], [1.7, 0.6], [1.7, 2.0]];
  valleyArrows.forEach((m, k) => {
    const [x, z] = vpts[k];
    const h = bilinear(x, z) / HSCALE * ex;
    m.position.set(x, h + 0.07, z);
    m.rotation.set(0, 0, 0);
    m.rotateX(Math.PI / 2);            // 指向 +z（南）＝水流向低处
    m.visible = state.showLabels && state.preset === 'ridgevalley';
  });
  /* 植被贴地：随地形变形 / 竖向夸张 / 水位变化逐帧跟随 */
  layoutTrees();
}

const ANNO_POS = {
  peakA: [-1.8, 1620, 0.2], peakB: [1.7, 1000, 0.7],
  ridge: [-1.5, 1700, 0], valley: [1.7, 520, 0],
  saddle: [0, 620, 0], cliff: [-0.55, 1400, 0],
};

const SECTIONS = [
  {
    id: 'intro', title: '等高线地形图初识',
    html: `<p>等高线地形图用<b>一条条闭合曲线</b>表示地表高低：同一条曲线上各处的高程<b>彼此相等</b>。把它想象成给山「切片」后，把切口的轮廓压平画在纸上。</p>
<p>左侧三维地形与右下角<b>地形图</b>是同一座山的两种表达——旋转地形，对照图上的曲线疏密：线密处坡陡，线疏处坡缓。</p>`,
    enter() {
      setPreset('overview');
      showScene(true, false, false);
      hud.show(false);
      ctl.clear();
      contourToggle(); ctl.sep(); mapToggle(); ctl.sep(); exaggerationCtl();
      app.setCamera([7.4, 6.4, 9.6], [0, 0.4, 0]);
    },
  },
  {
    id: 'form', title: '等高线的形成',
    html: `<p>想象山体被一层层<b>水平面</b>切开：水面与山坡相切留下的那道弧迹，正是一条等高线。再将这些交线一一竖直投影到图纸上，一幅等高线地形图便成形了。</p>
<p>拖动「水面高度」或点「自动上涨」，看水面切过山体时交线如何逐圈出现；右下角地形图中红橙色曲线就是这些交线的投影。</p>`,
    enter() {
      setPreset('formation');
      showScene(true, true, false);
      projLines.visible = true;
      hud.show(false);
      ctl.clear();
      const w = ctl.slider({
        label: '水面高度', min: 50, max: 1500, step: 10, value: state.waterLevel,
        fmt: (v) => Math.round(v) + ' m',
        onInput: (v) => { state.waterLevel = v; state.autoRise = false; },
      });
      state._waterSlider = w;
      ctl.button({
        label: '▶ 自动上涨',
        onClick() {
          state.autoRise = !state.autoRise;
        },
      });
      ctl.sep();
      contourToggle(); ctl.sep();
      ctl.toggle({
        label: '投影到平面', value: true,
        onChange: (v) => { projLines.visible = v; },
      });
      app.setCamera([6.2, 5.2, 8.8], [0, 0.3, 0]);
    },
    tick(dt) {
      if (state.autoRise) {
        state.waterLevel += dt * 180;
        if (state.waterLevel > 1500) state.waterLevel = 50;
        if (state._waterSlider) state._waterSlider.set(state.waterLevel);
        layoutTrees();                          // 植被随水位没顶
        state._mapAcc = (state._mapAcc || 0) + dt;
        if (state._mapAcc > 0.15) { state._mapAcc = 0; mapDirty = true; }   // 节流同步地形图与沙盘图板
      }
      water.position.y = state.waterLevel / HSCALE + 0.002;
    },
  },
  {
    id: 'elev', title: '海拔与相对高度',
    html: `<p><b>海拔</b>（绝对高度）：地表任意一处到<b>海平面</b>的竖直间隔；<b>相对高度</b>：同一处到另一指定点的竖直间隔差。</p>
<p>图中甲峰、乙峰的海拔不同，但甲峰顶到乙峰顶的<b>相对高度</b>＝两者海拔之差。看右上角读数与两根红色垂线（地面到峰顶的垂直距离）。</p>`,
    enter() {
      setPreset('elevation');
      showScene(true, false, true);
      addLabel('peakA', '甲峰 1620 m', { fontSize: 30, color: '#ffb28a', scale: 0.0042 });
      addLabel('peakB', '乙峰 1000 m', { fontSize: 30, color: '#ffb28a', scale: 0.0042 });
      peakMarker.visible = true;
      dropLine.visible = true;
      hud.show(true);
      hud.set('a', '甲峰海拔 1620 m');
      hud.set('b', '乙峰海拔 1000 m');
      hud.set('x', '相对高度 620 m');
      ctl.clear();
      ctl.toggle({
        label: '峰顶标注', value: true,
        onChange: (v) => { peakMarker.visible = v; dropLine.visible = v; labelSprites.peakA.visible = v; labelSprites.peakB.visible = v; },
      });
      ctl.sep();
      ctl.slider({
        label: '基准面高程', min: 0, max: 800, step: 20, value: 0,
        fmt: (v) => Math.round(v) + ' m',
        onInput: (v) => {
          const rel = Math.round(1620 - 1000);
          hud.set('a', '甲峰海拔 1620 m');
          hud.set('b', '乙峰海拔 1000 m');
          hud.set('x', '相对高度恒为 ' + rel + ' m');
          dropLine.geometry.setFromPoints([new THREE.Vector3(-1.8, v / HSCALE + 0.01, 0.2), new THREE.Vector3(-1.8, 1620 / HSCALE + 0.02, 0.2)]);
          dropLine.computeLineDistances();
        },
      });
      ctl.sep();
      exaggerationCtl();
      layoutAnnos();
      dropLine.geometry.setFromPoints([new THREE.Vector3(-1.8, 0.01, 0.2), new THREE.Vector3(-1.8, 1620 / HSCALE + 0.02, 0.2)]);
      dropLine.computeLineDistances();
      app.setCamera([6.8, 4.4, 9.4], [0, 0.5, 0]);
    },
  },
  {
    id: 'interval', title: '等高距与坡度',
    html: `<p><b>等高距</b>是相邻两条等高线的高度差，同一幅图中<b>等高距相同</b>。因此等高线的<b>疏密</b>直接反映坡度：等高距相同时，水平距离越短（线越密），坡越<b>陡</b>。</p>
<p>这座山左侧是陡坡（等高线密），右侧是缓坡（等高线疏）。把等高距调小一档，再看相邻两条线在水平方向上的间距会起什么变化。</p>`,
    enter() {
      setPreset('slope');
      showScene(true, false, false);
      hud.show(true);
      hud.set('a', '左（西）坡：陡');
      hud.set('b', '右（东）坡：缓');
      hud.set('x', '等高距 ' + state.interval + ' m');
      ctl.clear();
      intervalCtl();
      ctl.sep();
      ctl.readout({ label: '同坡两面向', value: '密＝陡 · 疏＝缓' });
      ctl.sep();
      contourToggle(); mapToggle(); ctl.sep(); exaggerationCtl();
      app.setCamera([5.6, 7.2, 9.0], [0, 0.4, 0]);
    },
  },
  {
    id: 'peakbasin', title: '山顶与盆地',
    html: `<p><b>山顶</b>：等高线呈一组<b>闭合曲线</b>，数值<b>内高外低</b>（从外向里数字越来越大）。<b>盆地／洼地</b>相反：闭合曲线数值<b>内低外高</b>。</p>
<p>点下方按钮在「山顶模型」和「盆地模型」间切换，对照等高线数值的变化方向。新等高线上的数值标注见地形图图角。</p>`,
    enter() {
      setPreset('peak');
      showScene(true, false, false);
      hud.show(true);
      hud.set('a', '当前：山顶模型');
      hud.set('b', '闭合曲线 内高外低');
      hud.set('x', '');
      ctl.clear();
      ctl.button({
        label: '山顶模型', onClick() {
          setPreset('peak'); hud.set('a', '当前：山顶模型');
          hud.set('b', '闭合曲线 内高外低');
        },
      });
      ctl.button({
        label: '盆地模型', onClick() {
          setPreset('basin'); hud.set('a', '当前：盆地模型');
          hud.set('b', '闭合曲线 内低外高');
        },
      });
      ctl.sep();
      contourToggle(); mapToggle(); ctl.sep(); intervalCtl();
      app.setCamera([6.0, 7.6, 8.6], [0, 0.5, 0]);
    },
  },
  {
    id: 'ridgevalley', title: '山脊与山谷',
    html: `<p><b>山脊</b>：等高线由高处向低处<b>凸出</b>（凸低为脊），是分水线；<b>山谷</b>：等高线由低处向高处凸出（凸高为谷），是集水线，常发育河流。</p>
<p>开「判读标注」：左侧为山脊（蓝色箭头沿脊线分开流向两侧），山谷中蓝色箭头指示水流方向——水从谷底两侧汇入、流向低处。</p>`,
    enter() {
      setPreset('ridgevalley');
      showScene(true, false, false);
      addLabel('ridge', '山脊（分水）', { fontSize: 28, color: '#ffd9a0', scale: 0.004 });
      addLabel('valley', '山谷（集水）', { fontSize: 28, color: '#9fd8ff', scale: 0.004 });
      hud.show(false);
      ctl.clear();
      ctl.toggle({
        label: '判读标注', value: true,
        onChange: (v) => {
          state.showLabels = v;
          labelSprites.ridge.visible = v; labelSprites.valley.visible = v;
          valleyArrows.forEach((m) => { m.visible = v; });
        },
      });
      ctl.sep();
      contourToggle(); mapToggle(); ctl.sep(); exaggerationCtl();
      state.showLabels = true;
      layoutAnnos();
      app.setCamera([5.8, 6.8, 9.2], [0, 0.4, 0]);
    },
  },
  {
    id: 'saddle', title: '鞍部',
    html: `<p><b>鞍部</b>是两个相邻山顶之间呈<b>马鞍形</b>的低地，两组闭合等高线（两峰）之间的公共区域。鞍部往往是山区<b>翻山的通道</b>——道路常从鞍部经过。</p>
<p>点「出发」看两条登山路线：橙色与绿色路线都经鞍部翻越，比较两条路线经过的等高线条数（爬升高度）。</p>`,
    enter() {
      setPreset('saddle');
      showScene(true, false, false);
      addLabel('saddle', '鞍部', { fontSize: 30, color: '#ffe08a', scale: 0.0045 });
      addLabel('peakA', '峰 A', { fontSize: 26, color: '#ff9a6a', scale: 0.0038 });
      addLabel('peakB', '峰 B', { fontSize: 26, color: '#8ae6b8', scale: 0.0038 });
      travelers.forEach((m) => { m.visible = true; });
      state.route = true; state.routeT = 0;
      hud.show(false);
      ctl.clear();
      ctl.button({
        label: '▶ 出发', onClick(e) {
          state.route = !state.route;
          e.textContent = state.route ? '⏸ 暂停' : '▶ 出发';
        },
      });
      ctl.slider({
        label: '速度', min: 0.2, max: 2.5, step: 0.1, value: 1, fmt: (v) => v.toFixed(1) + '×',
        onInput: (v) => { state.speed = v; },
      });
      ctl.sep();
      contourToggle(); mapToggle(); ctl.sep();
      app.setCamera([6.4, 5.0, 9.4], [0, 0.4, 0]);
      layoutAnnos();
      ensureRoutes();
      routeMeshes.forEach((r) => { r.visible = true; });
    },
    tick(dt) {
      if (!state.route) return;
      state.routeT += dt * (state.speed || 1) * 0.16;
      const t = state.routeT % 1;
      /* 沿放样路线行走：弧长参数取点，高度随地形起伏 */
      travelers.forEach((m, k) => {
        const p = routeCurves[k].getPointAt(t);
        m.position.set(p.x, p.y * state.exaggeration + 0.07, p.z);
      });
    },
  },
  {
    id: 'cliff', title: '陡崖',
    html: `<p>多条等高线<b>重叠</b>的地方是<b>陡崖</b>（近于垂直的陡坡）：几条不同高度的等高线在图上挤成一条线。崖顶与崖底的高差范围：<span class="hl">(n−1)×d ≤ 崖高 &lt; (n+1)×d</span>（n 为重叠条数，d 为等高距）。</p>
<p>本模型西侧是陡崖：开「重叠高亮」看 4 条等高线挤在一起；开「崖高测量」看崖顶到崖底的垂直高差。</p>`,
    enter() {
      setPreset('cliff');
      showScene(true, false, false);
      addLabel('cliff', '陡崖', { fontSize: 30, color: '#ff9a6a', scale: 0.0042 });
      cliffMeasure.visible = false;
      hud.show(true);
      hud.set('a', '重叠等高线 4 条');
      hud.set('b', '等高距 150 m');
      hud.set('x', '崖高 450~750 m');
      ctl.clear();
      ctl.toggle({
        label: '崖高测量', value: false,
        onChange: (v) => { cliffMeasure.visible = v; },
      });
      ctl.toggle({
        label: '重叠高亮', value: false,
        onChange: (v) => {
          contourLines.material.color.set(v ? 0xd9452a : 0x5b3d1e);
          contourLines.material.opacity = v ? 1 : 0.78;
        },
      });
      ctl.sep();
      contourToggle(); mapToggle(); ctl.sep(); exaggerationCtl();
      cliffMeasure.children[0].geometry.setFromPoints([new THREE.Vector3(-0.55, 130 / HSCALE, 0), new THREE.Vector3(-0.55, 1380 / HSCALE, 0)]);
      app.setCamera([7.6, 3.6, 8.6], [-0.6, 0.6, 0]);
      layoutAnnos();
    },
  },
  {
    id: 'profile', title: '地形剖面图',
    html: `<p>剖面图是沿某一<b>方向切一刀</b>，把切口的起伏画成曲线——能直观看出沿线的坡度陡缓、山顶山谷分布，是判断「通视」「引水」类问题的工具。</p>
<p>左下角是沿黄线（A→B）的剖面图。切换切线方向、平移切线位置，看剖面如何变化；「平滑」可去掉锯齿。</p>`,
    enter() {
      setPreset('profile');
      showScene(true, false, false);
      profBox.style.display = '';
      profLine3D.visible = true;
      hud.show(false);
      ctl.clear();
      const dirSeg = ctl.seg({
        options: [{ label: '东西', value: 0 }, { label: '南北', value: 90 }, { label: '东北-西南', value: 45 }, { label: '西北-东南', value: 135 }],
        value: 0, onChange: (v) => { state.dirDeg = v; refreshProf(); },
      });
      state._dirSeg = dirSeg;
      ctl.slider({
        label: '切线位置', min: -3, max: 3, step: 0.25, value: 0,
        fmt: (v) => v.toFixed(2),
        onInput: (v) => { state.profOff = v; refreshProf(); },
      });
      ctl.slider({
        label: '平滑', min: 1, max: 9, step: 2, value: 1,
        fmt: (v) => (v === 1 ? '关' : v + ' 点'),
        onInput: (v) => { state.smoothW = v; refreshProf(); },
      });
      ctl.sep(); mapToggle();
      refreshProf();
      app.setCamera([6.6, 6.6, 9.2], [0, 0.3, 0]);
    },
  },
  {
    id: 'quiz', title: '随堂检测',
    html: `<p>5 道选择题，检验一下等高线地形图的掌握情况。答完可重新开始。</p>`,
    enter() {
      setPreset('overview');
      showScene(true, false, false);
      hud.show(false);
      ctl.clear();
      showQuiz();
      app.setCamera([7.4, 6.4, 9.6], [0, 0.4, 0]);
    },
  },
];

function showScene(contours, waterOn, proj) {
  contourLines.visible = contours && state.showContours;
  indexLines.visible = contours && state.showContours;
  water.visible = waterOn;
  waterShown = waterOn;
  projLines.visible = proj;
  routeMeshes.forEach((r) => { r.visible = false; });
  profBox.style.display = 'none';
  profLine3D.visible = false;
  mapBox.style.display = state.showMap ? '' : 'none';
  peakMarker.visible = false; dropLine.visible = false;
  cliffMeasure.visible = false;
  travelers.forEach((m) => { m.visible = false; });
  Object.values(labelSprites).forEach((s) => { s.visible = false; });
  valleyArrows.forEach((m) => { m.visible = false; });
}

let waterShown = false;
let state_speedKeep = null;

function refreshProf() {
  drawProfile(state.dirDeg, state.profOff, state.smoothW);
  // 3D 贴地剖面线
  const pos = profLine3D.geometry.attributes.position;
  const pts = profileHeights(state.dirDeg, state.profOff, 100);
  pts.forEach((p, k) => pos.setXYZ(k, p[0], p[2] / HSCALE + 0.02, p[1]));
  pos.needsUpdate = true;
  profLine3D.geometry.computeBoundingSphere();
  mapDirty = true;
}

/* ---------------- 随堂检测 ---------------- */

const QUIZ = [
  {
    q: '等高线地形图上，等高线最密集的地方表示？',
    opts: ['陡崖或陡坡', '缓坡', '盆地底部', '鞍部'],
    a: 0,
    ex: '等高距相同时，等高线越密说明单位水平距离内高度变化越大，即坡越陡；多条等高线完全重叠处为陡崖。',
  },
  {
    q: '关于等高距，下列说法正确的是？',
    opts: ['同一幅图中等高距可以不同', '等高距是相邻两条线的水平间距', '同一幅地形图中，等高距相同', '等高距越大，表示的坡度越陡'],
    a: 2,
    ex: '同一幅图的等高距（相邻等高线的海拔差）是固定值；等高线之间的"距离"是水平距离而非等高距；坡度陡缓还取决于水平间距。',
  },
  {
    q: '等高线由高处向低处凸出（凸低为脊）的地形部位是？',
    opts: ['山谷', '山脊', '鞍部', '盆地'],
    a: 1,
    ex: '等高线向低处凸出为山脊（分水线）；向高处凸出为山谷（集水线）。记忆口诀："凸低为脊、凸高为谷"。',
  },
  {
    q: '两个相邻山顶之间的低地部位是？',
    opts: ['陡崖', '山谷', '鞍部', '山脊'],
    a: 2,
    ex: '鞍部位于两山顶之间，形似马鞍，是山区翻山通道常选的位置。',
  },
  {
    q: '某图上 4 条等高线挤成一条线（等高距 150 米），这处陡崖的高度差取值范围落在哪个区间？',
    opts: ['300~600 米', '450~750 米', '600~900 米', '150~450 米'],
    a: 1,
    ex: 'n 条等高线重叠时崖高范围是 (n−1)×d ≤ H < (n+1)×d，即 3×150=450 ≤ H < 5×150=750。',
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
        const next = document.createElement('button');
        next.type = 'button';
        next.className = 'ctl-btn active';
        next.textContent = idx < QUIZ.length - 1 ? '下一题 →' : '查看成绩 →';
        next.addEventListener('click', () => {
          idx++;
          if (idx < QUIZ.length) renderQ();
          else renderResult();
        });
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
      <p style="color:var(--text-dim);margin:4px 0 18px">正确率 ${pct}%${pct >= 80 ? '，等高线判读已经很扎实！' : pct >= 60 ? '，大部分概念已清楚，回顾一下错题。' : '，建议回到前面章节对照模型再看一遍。'}</p>`;
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

/* ================= 三栏布局驱动（左栏章节列表 / 右栏详解联动 / 栏折叠 / 专注模式 / 浮窗折叠） ================= */

const chapNav = document.getElementById('chapNav');
const chapCount = document.getElementById('chapCount');
const detailNo = document.getElementById('detailNo');
const detailTitle = document.getElementById('detailTitle');
const lessonEl = document.getElementById('lesson');
const detailBody = document.getElementById('detailBody');
const controlsEl = document.getElementById('controls');
const contourShell = document.getElementById('contourShell');
let chapterIdx = 0;
let lastSectionIdx = -1;

/* 10 章竖排按钮：序号 + 标题，点击切章，当前章 .on 高亮 */
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
  activeSectionCleanup();
  activeSectionCleanup = () => {};
  if (lastSectionIdx >= 0 && SECTIONS[lastSectionIdx].leave) SECTIONS[lastSectionIdx].leave();
  lastSectionIdx = chapterIdx;
  sec.enter();
  refreshProf();
  /* 本章无控件时整块手风琴收走（不动用户的手风琴偏好；数据块由帧循环按 hud 显隐同步） */
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

const FOLD_KEY = { l: 'contour.foldL', r: 'contour.foldR' };
let foldL = false;
let foldR = false;
let focusSaved = null; /* 进入专注模式前的独立折叠状态 [foldL, foldR]，退出时恢复 */

try {
  foldL = localStorage.getItem(FOLD_KEY.l) === '1';
  foldR = localStorage.getItem(FOLD_KEY.r) === '1';
} catch (e) { /* localStorage 不可用（隐私模式等）时仅本次会话内生效 */ }

function applyFold() {
  contourShell.classList.toggle('fold-l', foldL);
  contourShell.classList.toggle('fold-r', foldR);
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
  contourShell.classList.toggle('focus-mode', on);
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

const ACC_KEYS = { lesson: 'contour.accLesson', controls: 'contour.accControls', data: 'contour.accData' };
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

/* 地形图 / 剖面图浮窗折叠（徽标态），首访按 NARROW_VIEW 默认折叠 */
for (const spec of FLOAT_SPECS) makeFloatFold(spec);

/* ---------------- 启动 ---------------- */

loadAll([
  { key: 'rockNor', label: '岩石法线', job: loadTexture(TEXDIR + 'pbr/rock_nor-BD16lJKl.webp', { colorSpace: null, wrap: true, repeat: [5, 5] }) },
  { key: 'sky', label: '环境光', job: loadHDR(TEXDIR + 'sky/sky_site-C35ymwQp.hdr') },
], (d, t, label) => loader.setText(`正在加载 ${d}/${t}（${label}）`)).then((t) => {
  t.rockNor.channel = 0;
  /* 道具金属/玻璃补环境反射（地形不挂 IBL，观感零回归） */
  for (const m of [brassMat, steelMat, paintMat, rubberMat, objGlass, eyeGlass, vialGlass, cGlass]) {
    m.envMap = studioEnv;
    m.envMapIntensity = 0.9;
  }
  const terrainMesh = new THREE.Mesh(terrainGeo, new THREE.MeshStandardMaterial({
    normalMap: t.rockNor, normalScale: new THREE.Vector2(0.55, 0.55),
    vertexColors: true, roughness: 0.95, metalness: 0.0,
  }));
  terrainG.add(terrainMesh);

  /* 光照环境保留 HDR 天空（反射/补光）；背景交给 edu-vfx 的 illus 深青棚拍接管 */

  samplePreset(state.preset);
  applyHeights();
  computeContours(state.interval);
  layoutAnnos();

  loader.hide();
  window.__eduSections = { select: selectChapter };
  window.__contourDebug = { vfx, app };   /* 调试句柄（自动化验收：draw call 自查） */
  selectChapter(0);

  app.onFrame((dt) => {
    /* 相机缓动由 attachVFX 接管（tickCamera 在渲染钩子内），这里只跑章内 tick */
    const sec = SECTIONS[chapterIdx] || SECTIONS[0];
    if (sec.tick) sec.tick(dt);
    /* 桌面指北针磁针轻微游摆（沙盘氛围细节） */
    needlePivot.rotation.z = -0.4 + Math.sin(performance.now() * 0.0006) * 0.05;
    /* 读数隐藏（quiz 章等）时数据手风琴块一并收走 */
    accSecs.data.classList.toggle('acc-empty', hud.el.style.display === 'none');
    if (morphT < 1) {
      morphT = Math.min(1, morphT + dt / morphDur);
      const e = morphT * morphT * (3 - 2 * morphT);
      for (let k = 0; k < H.length; k++) H[k] = Hfrom[k] + (Hto[k] - Hfrom[k]) * e;
      applyHeights();
      computeContours(state.interval);
      layoutAnnos();
      if (state.preset === 'profile' || profLine3D.visible) refreshProf();
    }
    if (mapDirty) drawMap(state.waterLevel, waterShown);
  });
}).catch((err) => {
  loader.setText('资源加载失败：' + err.message);
  console.error(err);
});

let activeSectionCleanup = () => {};
